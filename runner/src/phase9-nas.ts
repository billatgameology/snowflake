// Phase 9 portable NAS resolution.
//
// Git records paths relative to the snowcrystal share. The two execution hosts mount that same
// share differently, so neither evidence nor source registries may persist a host mount prefix.
// Resolution checks both the lexical path and the real filesystem target: a contained symlink
// that points outside the share must not turn an apparently safe registry row into arbitrary file
// access.

import { realpathSync, statSync } from "node:fs";
import { isAbsolute, resolve, sep } from "node:path";

const DEFAULT_NAS_CANDIDATES = ["S:/", "/Volumes/snowcrystal/"] as const;
const NAS_MARKER = "research-cache";

export type Phase9NasResolution =
  | { readonly kind: "ok"; readonly path: string; readonly byteLength: number }
  | { readonly kind: "forbidden"; readonly reason: string }
  | { readonly kind: "not-found"; readonly reason: string };

function normalizeMount(value: string): string {
  return value.replace(/\\/g, "/").replace(/\/*$/, "/");
}

function hasMarker(mount: string): boolean {
  try {
    return statSync(resolve(mount, NAS_MARKER)).isDirectory();
  } catch {
    return false;
  }
}

/**
 * Locate the snowcrystal share on either supported host. `VCC_NAS_ROOT` is intentionally scoped
 * to this project rather than reusing a shell or system option. An explicit but wrong override
 * fails loudly; silently falling back would let a partial source census look complete.
 */
export function detectPhase9NasRoot(
  environment: Readonly<Record<string, string | undefined>> = process.env,
  candidates: readonly string[] = DEFAULT_NAS_CANDIDATES,
): string | null {
  const forced = environment.VCC_NAS_ROOT;
  if (forced !== undefined && forced !== "") {
    const normalized = normalizeMount(forced);
    if (!hasMarker(normalized)) {
      throw new Error(`VCC_NAS_ROOT=${forced} does not contain ${NAS_MARKER}`);
    }
    return normalized;
  }
  for (const candidate of candidates) {
    const normalized = normalizeMount(candidate);
    if (hasMarker(normalized)) return normalized;
  }
  return null;
}

/** Validate the portable identity before touching the filesystem. */
export function assertPhase9ShareRelativePath(value: string, label = "NAS path"): void {
  if (
    value.length === 0 ||
    isAbsolute(value) ||
    value.includes("\\") ||
    value.includes("\0") ||
    value.startsWith("/") ||
    value.endsWith("/") ||
    value.split("/").some((part) => part === "" || part === "." || part === "..")
  ) {
    throw new Error(`${label} must be a safe share-relative POSIX path`);
  }
}

/**
 * Resolve a registered share-relative path to a regular file while preserving containment across
 * `..`, symlinks, junctions, and macOS's mount aliases.
 */
export function resolvePhase9NasFile(relativePath: string, nasRoot: string): Phase9NasResolution {
  try {
    assertPhase9ShareRelativePath(relativePath);
  } catch (error) {
    return { kind: "forbidden", reason: error instanceof Error ? error.message : "unsafe NAS path" };
  }

  // A Windows drive root keeps its trailing separator through resolve()/realpath ("S:/" -> "S:\"),
  // so blindly appending `sep` builds "S:\\" and rejects every child of the share as an escape.
  const childPrefix = (root: string): string => (root.endsWith(sep) ? root : `${root}${sep}`);
  const lexicalRoot = resolve(nasRoot);
  const lexicalTarget = resolve(lexicalRoot, relativePath);
  if (lexicalTarget !== lexicalRoot && !lexicalTarget.startsWith(childPrefix(lexicalRoot))) {
    return { kind: "forbidden", reason: "lexical NAS path escapes the share" };
  }

  let realRoot: string;
  let realTarget: string;
  try {
    realRoot = realpathSync.native(lexicalRoot);
    realTarget = realpathSync.native(lexicalTarget);
  } catch {
    return { kind: "not-found", reason: "NAS path does not resolve" };
  }
  if (realTarget !== realRoot && !realTarget.startsWith(childPrefix(realRoot))) {
    return { kind: "forbidden", reason: "real NAS target escapes the share" };
  }

  try {
    const status = statSync(realTarget);
    if (!status.isFile()) return { kind: "not-found", reason: "NAS target is not a regular file" };
    return { kind: "ok", path: realTarget, byteLength: status.size };
  } catch {
    return { kind: "not-found", reason: "NAS target cannot be stated" };
  }
}

/** Convert the exact legacy macOS prefix frozen in the Phase 9 knowledge register. */
export function normalizeFrozenKnowledgeNasPath(value: string): string {
  const prefix = "/Volumes/snowcrystal/";
  if (!value.startsWith(prefix)) {
    throw new Error(`frozen knowledge path does not use the registered ${prefix} prefix`);
  }
  const relativePath = value.slice(prefix.length);
  assertPhase9ShareRelativePath(relativePath, "frozen knowledge path");
  return relativePath;
}
