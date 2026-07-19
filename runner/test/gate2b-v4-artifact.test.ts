import { describe, expect, it } from "vitest";
import {
  GATE2B_V4_COLD_CHECKPOINT_BYTES,
  GATE2B_V4_COLD_CHECKPOINT_SHA256,
  authenticateGate2bV4ColdCheckpoint,
} from "../../scripts/gate2b-v4-artifact.ts";

describe("registered gate2b v4 cold-checkpoint authentication", () => {
  it("pins the exact retained artifact identity", () => {
    expect(GATE2B_V4_COLD_CHECKPOINT_BYTES).toBe(15_041_088);
    expect(GATE2B_V4_COLD_CHECKPOINT_SHA256).toBe(
      "8997d90689fdbe6fb7fe496e4d2780d2f61abe92166e67ed56fa77e65f2de91d",
    );
  });

  it("rejects both a shifted-length artifact and same-length shifted bytes", () => {
    expect(() => authenticateGate2bV4ColdCheckpoint(new Uint8Array(1))).toThrow(
      /length mismatch/,
    );
    const sameLengthWrongBytes = new Uint8Array(GATE2B_V4_COLD_CHECKPOINT_BYTES);
    sameLengthWrongBytes[0] = 1;
    expect(() => authenticateGate2bV4ColdCheckpoint(sameLengthWrongBytes)).toThrow(
      /SHA-256 mismatch/,
    );
  });
});
