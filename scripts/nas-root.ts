// Where the bulk gut-check artifacts are attached on *this* machine.
//
// They live on the NAS share \\GameStation\snowcrystal (docs/nas-ledger.md), mirroring
// repo-relative paths under the share root. The repo is worked from two hosts that mount
// that same share differently — Windows maps it to the persistent drive S:, macOS mounts
// SMB (smb://GameStation/snowcrystal) under /Volumes/. Only the local mount prefix differs;
// everything below it is identical, which is why the dev server addresses NAS files by
// share-relative path (/nas/<path>) and resolves the prefix here.
//
// Detect rather than persist a host path: emitted URLs carry no mount prefix, and a detached
// checkout fails or enters an explicitly requested metadata-only mode. VCC_NAS_ROOT is canonical;
// accepted only when it does not conflict with the canonical setting. The construction is
// mount-agnostic; end-to-end index/streaming behavior was measured on macOS, while the current
// Windows S:/ path remains unexecuted.

import {
  closeSync,
  constants,
  fstatSync,
  lstatSync,
  openSync,
  readSync,
  realpathSync,
  statSync,
  type Stats,
} from "node:fs";
import { isAbsolute, posix, resolve, win32 } from "node:path";

import {
  NAS_SHARE_MARKER_FORMAT,
  NAS_SHARE_MARKER_PATH as GOVERNED_NAS_SHARE_MARKER_PATH,
  NAS_SHARE_PROJECT_ID,
  resolveNasRootEnvironment,
} from "./nas-asset-lib.ts";

// Forward-slash form with a trailing slash so `resolve(mount, rel)` is anchored at the share
// root on both platforms — a bare "S:" would resolve relative to the current directory of
// drive S: on Windows, not to its root.
export const NAS_CANDIDATE_MOUNTS: readonly string[] = [
  "S:/", // Windows: persistent drive mapping
  "/Volumes/snowcrystal/", // macOS: SMB mount of the same share
];

export const NAS_SHARE_MARKER_PATH = GOVERNED_NAS_SHARE_MARKER_PATH;
export const NAS_SHARE_MARKER = Object.freeze({
  format: NAS_SHARE_MARKER_FORMAT,
  projectId: NAS_SHARE_PROJECT_ID,
} as const);

/** Native containment with a root-safe separator boundary and Windows case folding. */
export const pathIsWithinRoot = (
  root: string,
  candidate: string,
  platform: NodeJS.Platform = process.platform,
): boolean => {
  const pathApi = platform === "win32" ? win32 : posix;
  const relation = pathApi.relative(pathApi.resolve(root), pathApi.resolve(candidate));
  return relation === "" || (!relation.startsWith(`..${pathApi.sep}`) && relation !== ".." && !pathApi.isAbsolute(relation));
};

type NasShareInspection =
  | {
      readonly kind: "ok";
      readonly mount: string;
      readonly realRoot: string;
      readonly dev: number;
      readonly ino: number;
    }
  | { readonly kind: "invalid"; readonly reason: string };

export interface NasShareInspectionHooks {
  /** Deterministic mutation hook for adversarial identity tests; never set by production callers. */
  readonly afterMarkerRead?: (markerPath: string) => void;
}

const statIdentity = (status: Stats): string =>
  [status.dev, status.ino, status.mode, status.nlink, status.size, status.mtimeMs, status.ctimeMs].join(":");

const readMarkerBytes = (fd: number): Buffer => {
  const buffer = Buffer.allocUnsafe(4_097);
  let total = 0;
  while (total < buffer.length) {
    const count = readSync(fd, buffer, total, buffer.length - total, total);
    if (count === 0) break;
    total += count;
  }
  return buffer.subarray(0, total);
};

const normalizedConfiguredRoot = (
  environmentName: "VCC_NAS_ROOT" | "GUTCHECK_NAS_ROOT",
  value: string,
): string => {
  const resolution = resolveNasRootEnvironment({ [environmentName]: value });
  if (resolution.kind !== "configured") throw new Error(`${environmentName} was not configured`);
  return resolution.root;
};

const inspectNasShare = (mount: string, hooks: NasShareInspectionHooks): NasShareInspection => {
  const lexicalRoot = resolve(mount);
  let rootStatus;
  try {
    rootStatus = lstatSync(lexicalRoot);
  } catch {
    return { kind: "invalid", reason: "root does not exist" };
  }
  if (!rootStatus.isDirectory() || rootStatus.isSymbolicLink()) {
    return { kind: "invalid", reason: "root is not an ordinary non-symlink directory" };
  }

  let realRoot: string;
  try {
    realRoot = realpathSync.native(lexicalRoot);
  } catch {
    return { kind: "invalid", reason: "root realpath cannot be resolved" };
  }
  const markerPath = resolve(lexicalRoot, NAS_SHARE_MARKER_PATH);
  if (!pathIsWithinRoot(lexicalRoot, markerPath)) {
    return { kind: "invalid", reason: "marker path escapes the root" };
  }

  let markerStatus;
  try {
    markerStatus = lstatSync(markerPath);
  } catch {
    return { kind: "invalid", reason: `missing ${NAS_SHARE_MARKER_PATH}` };
  }
  if (!markerStatus.isFile() || markerStatus.isSymbolicLink() || markerStatus.nlink !== 1) {
    return { kind: "invalid", reason: `${NAS_SHARE_MARKER_PATH} is not an ordinary non-symlink file` };
  }
  if (markerStatus.size > 4_096) {
    return { kind: "invalid", reason: `${NAS_SHARE_MARKER_PATH} is unexpectedly large` };
  }

  let fd: number;
  try {
    fd = openSync(
      markerPath,
      constants.O_RDONLY | (typeof constants.O_NOFOLLOW === "number" ? constants.O_NOFOLLOW : 0),
    );
  } catch {
    return { kind: "invalid", reason: `${NAS_SHARE_MARKER_PATH} cannot be opened safely` };
  }
  try {
    const opened = fstatSync(fd);
    const current = lstatSync(markerPath);
    const realMarker = realpathSync.native(markerPath);
    if (
      !opened.isFile() ||
      opened.nlink !== 1 ||
      opened.size > 4_096 ||
      current.isSymbolicLink() ||
      current.nlink !== 1 ||
      statIdentity(markerStatus) !== statIdentity(opened) ||
      statIdentity(opened) !== statIdentity(current) ||
      !pathIsWithinRoot(realRoot, realMarker)
    ) {
      return { kind: "invalid", reason: `${NAS_SHARE_MARKER_PATH} changed or escaped while opening` };
    }

    const firstBytes = readMarkerBytes(fd);
    if (firstBytes.byteLength !== opened.size) {
      return { kind: "invalid", reason: `${NAS_SHARE_MARKER_PATH} changed while reading` };
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(firstBytes.toString("utf8")) as unknown;
    } catch {
      return { kind: "invalid", reason: `${NAS_SHARE_MARKER_PATH} is malformed JSON` };
    }
    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
      return { kind: "invalid", reason: `${NAS_SHARE_MARKER_PATH} must contain one object` };
    }
    const record = parsed as Record<string, unknown>;
    const keys = Object.keys(record).sort();
    if (
      keys.length !== 2 ||
      keys[0] !== "format" ||
      keys[1] !== "projectId" ||
      record.format !== NAS_SHARE_MARKER.format ||
      record.projectId !== NAS_SHARE_MARKER.projectId
    ) {
      return { kind: "invalid", reason: `${NAS_SHARE_MARKER_PATH} has the wrong identity schema` };
    }
    hooks.afterMarkerRead?.(markerPath);
    const finalOpened = fstatSync(fd);
    const finalBytes = readMarkerBytes(fd);
    const finalRoot = lstatSync(lexicalRoot);
    const finalMarker = lstatSync(markerPath);
    if (
      !finalRoot.isDirectory() ||
      finalRoot.isSymbolicLink() ||
      statIdentity(finalRoot) !== statIdentity(rootStatus) ||
      realpathSync.native(lexicalRoot) !== realRoot ||
      !finalMarker.isFile() ||
      finalMarker.isSymbolicLink() ||
      finalMarker.nlink !== 1 ||
      finalOpened.nlink !== 1 ||
      statIdentity(finalOpened) !== statIdentity(opened) ||
      statIdentity(finalMarker) !== statIdentity(opened) ||
      finalBytes.byteLength !== firstBytes.byteLength ||
      !finalBytes.equals(firstBytes) ||
      realpathSync.native(markerPath) !== realMarker
    ) {
      return { kind: "invalid", reason: "root or marker changed while validating share identity" };
    }
    return {
      kind: "ok",
      mount: mount.replace(/\\/gu, "/").replace(/\/*$/u, "/"),
      realRoot,
      dev: rootStatus.dev,
      ino: rootStatus.ino,
    };
  } catch {
    return { kind: "invalid", reason: `${NAS_SHARE_MARKER_PATH} cannot be verified` };
  } finally {
    closeSync(fd);
  }
};

const sameInspectedShare = (
  left: Extract<NasShareInspection, { readonly kind: "ok" }>,
  right: Extract<NasShareInspection, { readonly kind: "ok" }>,
): boolean => left.dev === right.dev && left.ino === right.ino && left.realRoot === right.realRoot;

const automaticCandidates = (): readonly string[] => {
  if (process.platform === "win32") return [NAS_CANDIDATE_MOUNTS[0] as string];
  if (process.platform === "darwin") return [NAS_CANDIDATE_MOUNTS[1] as string];
  return [];
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
export const detectNasMount = (
  environment: Readonly<Record<string, string | undefined>> = process.env,
  candidates: readonly string[] = automaticCandidates(),
  hooks: NasShareInspectionHooks = {},
): string | null => {
  const canonicalRaw = environment.VCC_NAS_ROOT;
  const legacyRaw = environment.GUTCHECK_NAS_ROOT;
  const canonical = canonicalRaw === undefined || canonicalRaw === ""
    ? null
    : normalizedConfiguredRoot("VCC_NAS_ROOT", canonicalRaw);
  const legacy = legacyRaw === undefined || legacyRaw === ""
    ? null
    : normalizedConfiguredRoot("GUTCHECK_NAS_ROOT", legacyRaw);

  const inspectConfigured = (
    name: "VCC_NAS_ROOT" | "GUTCHECK_NAS_ROOT",
    raw: string,
    normalized: string,
  ): Extract<NasShareInspection, { readonly kind: "ok" }> => {
    const inspected = inspectNasShare(normalized, hooks);
    if (inspected.kind !== "ok") {
      throw new Error(
        `${name}=${raw} is not the marked snowcrystal share: ${inspected.reason}; ` +
          `refusing to use a silently wrong or detached mount`,
      );
    }
    return inspected;
  };

  if (canonical !== null) {
    const inspectedCanonical = inspectConfigured("VCC_NAS_ROOT", canonicalRaw as string, canonical);
    if (legacy !== null) {
      const inspectedLegacy = canonical === legacy
        ? inspectedCanonical
        : inspectConfigured("GUTCHECK_NAS_ROOT", legacyRaw as string, legacy);
      if (!sameInspectedShare(inspectedCanonical, inspectedLegacy)) {
        throw new Error("VCC_NAS_ROOT conflicts with legacy GUTCHECK_NAS_ROOT: they identify different marked roots");
      }
    }
    return inspectedCanonical.mount;
  }
  if (legacy !== null) {
    return inspectConfigured("GUTCHECK_NAS_ROOT", legacyRaw as string, legacy).mount;
  }

  for (const candidate of candidates) {
    if (!isAbsolute(candidate)) continue;
    let normalized: string;
    try {
      normalized = normalizedConfiguredRoot("VCC_NAS_ROOT", candidate);
    } catch {
      continue;
    }
    const inspected = inspectNasShare(normalized, hooks);
    if (inspected.kind === "ok") return inspected.mount;
  }
  return null;
};
