import { canonicalJson, sha256Bytes } from "./gate4-evidence.ts";

/** SHA-256 of recursively canonicalized UTF-8 JSON with no trailing line feed. */
export function phase10C0VS6CanonicalSemanticSha256(projection: unknown): string {
  return sha256Bytes(new TextEncoder().encode(canonicalJson(projection)));
}
