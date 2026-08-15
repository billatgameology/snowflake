// Phase 9 portable NAS resolution.
//
// Git records paths relative to the snowcrystal share. The two execution hosts mount that same
// share differently, so neither evidence nor source registries may persist a host mount prefix.
// Mount identity and file containment delegate to the shared asset-governance boundary so this
// completed phase cannot drift back to a workflow-specific marker or weaker path interpretation.

import {
  assertPortableShareRelativePath,
  resolveContainedRegularFile,
} from "../../scripts/nas-asset-lib.ts";
import { detectNasMount } from "../../scripts/nas-root.ts";

export type Phase9NasResolution =
  | { readonly kind: "ok"; readonly path: string; readonly byteLength: number }
  | { readonly kind: "forbidden"; readonly reason: string }
  | { readonly kind: "not-found"; readonly reason: string };

/**
 * Locate the marked snowcrystal share. VCC_NAS_ROOT is canonical; the compatibility environment
 * and automatic S:/ or /Volumes/snowcrystal candidates are interpreted by the shared resolver.
 */
export function detectPhase9NasRoot(
  environment: Readonly<Record<string, string | undefined>> = process.env,
  candidates?: readonly string[],
): string | null {
  return candidates === undefined
    ? detectNasMount(environment)
    : detectNasMount(environment, candidates);
}

/** Validate the portable identity before touching the filesystem. */
export function assertPhase9ShareRelativePath(value: string, label = "NAS path"): void {
  try {
    assertPortableShareRelativePath(value, label);
  } catch {
    throw new Error(`${label} must be a safe share-relative POSIX path`);
  }
}

/**
 * Resolve a registered share-relative path to an ordinary non-symlink file. The shared primitive
 * keeps the same lexical/real containment boundary used by governed consumers and closes its
 * verified descriptor before returning this legacy Phase 9 result shape.
 */
export function resolvePhase9NasFile(relativePath: string, nasRoot: string): Phase9NasResolution {
  const resolution = resolveContainedRegularFile(nasRoot, relativePath);
  if (resolution.kind === "ok") {
    return { kind: "ok", path: resolution.path, byteLength: resolution.byteLength };
  }
  return resolution;
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
