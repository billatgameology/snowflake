// Where the bulk gut-check artifacts are attached on *this* machine.
//
// They live on the NAS share \\GameStation\snowcrystal (docs/nas-ledger.md), mirroring
// repo-relative paths under the share root. The repo is worked from two hosts that mount
// that same share differently — Windows maps it to the persistent drive S:, macOS mounts
// SMB (smb://GameStation/snowcrystal) under /Volumes/. Only the local mount prefix differs;
// everything below it is identical, which is why the dev server addresses NAS files by
// share-relative path (/nas/<path>) and resolves the prefix here.
//
// Detect rather than configure: emitted URLs carry no mount prefix, and a detached checkout
// degrades to local paths. The construction is mount-agnostic; end-to-end index/streaming
// behavior was measured on macOS, while the current Windows S:/ path remains unexecuted.
// GUTCHECK_NAS_ROOT overrides for a mount point not listed here.

import { closeSync, constants, fstatSync, openSync, realpathSync, statSync } from "node:fs";
import { resolve } from "node:path";

// Forward-slash form with a trailing slash so `resolve(mount, rel)` is anchored at the share
// root on both platforms — a bare "S:" would resolve relative to the current directory of
// drive S: on Windows, not to its root.
const CANDIDATE_MOUNTS: readonly string[] = [
  "S:/", // Windows: persistent drive mapping
  "/Volumes/snowcrystal/", // macOS: SMB mount of the same share
];

// The marker that says "this really is the snowcrystal share and the bulk artifacts are in
// it", not merely "a volume with that name is attached". Kept as the directory the index
// builder actually reads from, so detection cannot succeed where the build would fail.
const MARKER = "out/gutcheck-gg-realism/large";

/** Native containment with a root-safe separator boundary and Windows case folding. */
export const pathIsWithinRoot = (
  root: string,
  candidate: string,
  platform: NodeJS.Platform = process.platform,
): boolean => {
  const separator = platform === "win32" ? "\\" : "/";
  const fold = (value: string): string => (platform === "win32" ? value.toLowerCase() : value);
  const foldedRoot = fold(root);
  const foldedCandidate = fold(candidate);
  const prefix = foldedRoot.endsWith(separator) ? foldedRoot : foldedRoot + separator;
  return foldedCandidate === foldedRoot || foldedCandidate.startsWith(prefix);
};

const attached = (mount: string): boolean => {
  try {
    const realMount = realpathSync.native(resolve(mount));
    const realMarker = realpathSync.native(`${mount}${MARKER}`);
    const contained = pathIsWithinRoot(realMount, realMarker);
    return contained && statSync(realMarker).isDirectory();
  } catch {
    return false;
  }
};

export type NasResolution =
  | { kind: "ok"; path: string; size: number; dev: number; ino: number }
  | { kind: "forbidden" }
  | { kind: "notfound" };

export type OpenNasResolution =
  | { kind: "ok"; path: string; size: number; fd: number }
  | { kind: "forbidden" }
  | { kind: "notfound" };

/**
 * Resolve a `/nas/<share-relative path>` request to a servable file, refusing anything that
 * escapes the share. Two containment checks, both load-bearing:
 *
 * - lexical, on the resolve()d path — blocks dot-dot traversal before any fs call;
 * - realpath, on what the filesystem actually resolves to — a symlink INSIDE the share
 *   pointing outside it passes the lexical check (found by adversarial review 2026-08-12),
 *   so containment is re-checked on the real target. The base is realpathed too, because a
 *   mount point (or a test fixture under macOS's /var → /private/var) may itself sit behind
 *   a symlink; comparing a real target against an unresolved base would 403 every request.
 *
 * Escapes are "forbidden"; missing files, dangling links, symlink loops, directories, and
 * malformed percent-encoding are all "notfound" — the route stays boring on anything but a
 * real, contained file.
 */
export const resolveNasRequest = (rawUrl: string, nasBase: string): NasResolution => {
  let rel: string;
  try {
    rel = decodeURIComponent(rawUrl.split("?")[0] ?? "").replace(/^\/+/, "");
  } catch {
    return { kind: "notfound" }; // malformed percent-encoding
  }
  const base = resolve(nasBase);
  const lexical = resolve(base, rel);
  if (!pathIsWithinRoot(base, lexical)) return { kind: "forbidden" };
  let realBase: string;
  let real: string;
  try {
    realBase = realpathSync.native(base);
    real = realpathSync.native(lexical);
  } catch {
    return { kind: "notfound" };
  }
  if (!pathIsWithinRoot(realBase, real)) return { kind: "forbidden" };
  let stat;
  try {
    stat = statSync(real);
  } catch {
    return { kind: "notfound" };
  }
  if (!stat.isFile()) return { kind: "notfound" };
  return { kind: "ok", path: real, size: stat.size, dev: stat.dev, ino: stat.ino };
};

/**
 * Open the already-contained result, bind serving to that descriptor, and reject an ordinary
 * path replacement between resolve/stat/open. Later path swaps cannot retarget an open fd;
 * inode comparison plus a post-open realpath check catches a persistent ancestor replacement.
 * A hostile process performing a precisely timed swap-and-swap-back remains inside the plan's
 * explicitly excluded concurrent-local-mutator boundary. The final-component no-follow flag
 * is an additional guard where the host supports it.
 */
export const openNasResolution = (resolution: NasResolution): OpenNasResolution => {
  if (resolution.kind !== "ok") return resolution;
  let fd: number;
  try {
    fd = openSync(
      resolution.path,
      constants.O_RDONLY | (typeof constants.O_NOFOLLOW === "number" ? constants.O_NOFOLLOW : 0),
    );
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    return code === "ELOOP" ? { kind: "forbidden" } : { kind: "notfound" };
  }
  try {
    const opened = fstatSync(fd);
    const currentReal = realpathSync.native(resolution.path);
    const current = statSync(resolution.path);
    if (
      !opened.isFile() ||
      opened.dev !== resolution.dev ||
      opened.ino !== resolution.ino ||
      currentReal !== resolution.path ||
      current.dev !== opened.dev ||
      current.ino !== opened.ino
    ) {
      closeSync(fd);
      return { kind: "forbidden" };
    }
    return { kind: "ok", path: resolution.path, size: opened.size, fd };
  } catch {
    closeSync(fd);
    return { kind: "notfound" };
  }
};

/**
 * The local mount prefix of the NAS share, forward-slash form with a trailing slash
 * (e.g. "S:/" or "/Volumes/snowcrystal/"), or null when the share is not attached.
 */
export const detectNasMount = (): string | null => {
  const forced = process.env.GUTCHECK_NAS_ROOT;
  if (forced !== undefined && forced !== "") {
    const mount = forced.replace(/\\/g, "/").replace(/\/*$/, "/");
    // An explicit override that does not actually contain the share fails LOUDLY: honoring
    // it silently produced a partial index that looked complete (round-2 review). The
    // operator asked for a specific mount; a typo should stop the build, not degrade it.
    if (!attached(mount)) {
      throw new Error(
        `GUTCHECK_NAS_ROOT=${forced} does not contain ${MARKER} — ` +
          `wrong mount (or share detached); refusing to build a silently partial index`,
      );
    }
    return mount;
  }
  return CANDIDATE_MOUNTS.find(attached) ?? null;
};
