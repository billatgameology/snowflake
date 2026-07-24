import { createHash } from "node:crypto";

export const GATE2B_V4_COLD_CHECKPOINT_BYTES = 15_041_088;
export const GATE2B_V4_COLD_CHECKPOINT_SHA256 =
  "8997d90689fdbe6fb7fe496e4d2780d2f61abe92166e67ed56fa77e65f2de91d";

/** Authenticate the immutable registered cold checkpoint before any structural decode. */
export function authenticateGate2bV4ColdCheckpoint(bytes: Uint8Array): string {
  if (bytes.byteLength !== GATE2B_V4_COLD_CHECKPOINT_BYTES) {
    throw new Error(
      `registered v4 cold checkpoint length mismatch: expected ` +
        `${GATE2B_V4_COLD_CHECKPOINT_BYTES}, got ${bytes.byteLength}`,
    );
  }
  const sha256 = createHash("sha256").update(bytes).digest("hex");
  if (sha256 !== GATE2B_V4_COLD_CHECKPOINT_SHA256) {
    throw new Error(
      `registered v4 cold checkpoint SHA-256 mismatch: expected ` +
        `${GATE2B_V4_COLD_CHECKPOINT_SHA256}, got ${sha256}`,
    );
  }
  return sha256;
}
