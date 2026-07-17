// Operator-honest display semantics (V4-1): the fixed labels for each operator, and the
// label-mismatch negatives — LK state labeled as d/b, or GG state labeled as sigma/f, must
// fail by name, never render.

import { describe, expect, it } from "vitest";
import { assertFieldSemanticsHonest, fieldSemanticsFor } from "../src/display.ts";
import { sha256Hex } from "../src/sha256.ts";
import { createHash } from "node:crypto";

describe("fieldSemanticsFor", () => {
  it("GGThreshold displays d (model units) and boundary mass b", () => {
    const semantics = fieldSemanticsFor("GGThreshold");
    expect(semantics.fieldName).toBe("d");
    expect(semantics.surfaceName).toBe("b");
    expect(semantics.fieldTitle).toContain("vapor mass d");
    expect(semantics.fieldUnits).toContain("model units");
    expect(semantics.fieldUnits).toContain("unvalidated");
    expect(semantics.surfaceTitle).toContain("boundary mass b");
  });

  it("LibbrechtKinetics displays sigma (dimensionless) and boundary fill f", () => {
    const semantics = fieldSemanticsFor("LibbrechtKinetics");
    expect(semantics.fieldName).toBe("sigma");
    expect(semantics.surfaceName).toBe("f");
    expect(semantics.fieldTitle).toContain("supersaturation sigma");
    expect(semantics.fieldUnits).toContain("dimensionless");
    expect(semantics.surfaceTitle).toContain("boundary fill f");
    // Never a claim of validation.
    expect(semantics.fieldUnits).toContain("unvalidated");
  });

  it("rejects unknown operators", () => {
    expect(() => fieldSemanticsFor("Reiter" as never)).toThrow(/unknown operator/);
  });
});

describe("assertFieldSemanticsHonest (label-mismatch negatives)", () => {
  it("accepts both canonical semantics objects", () => {
    expect(() => assertFieldSemanticsHonest(fieldSemanticsFor("GGThreshold"))).not.toThrow();
    expect(() =>
      assertFieldSemanticsHonest(fieldSemanticsFor("LibbrechtKinetics")),
    ).not.toThrow();
  });

  it("rejects LK state relabeled as GG vapor mass d", () => {
    const forged = { ...fieldSemanticsFor("LibbrechtKinetics"), fieldName: "d" as const };
    expect(() => assertFieldSemanticsHonest(forged)).toThrow(/operator\/field label mismatch/);
  });

  it("rejects GG state relabeled as sigma", () => {
    const forged = { ...fieldSemanticsFor("GGThreshold"), fieldName: "sigma" as const };
    expect(() => assertFieldSemanticsHonest(forged)).toThrow(/operator\/field label mismatch/);
  });

  it("rejects LK boundary fill relabeled as boundary mass b (and vice versa)", () => {
    const lkForged = { ...fieldSemanticsFor("LibbrechtKinetics"), surfaceName: "b" as const };
    expect(() => assertFieldSemanticsHonest(lkForged)).toThrow(/operator\/field label mismatch/);
    const ggForged = { ...fieldSemanticsFor("GGThreshold"), surfaceName: "f" as const };
    expect(() => assertFieldSemanticsHonest(ggForged)).toThrow(/operator\/field label mismatch/);
  });

  it("rejects drifted wording (a silently reworded unit claim)", () => {
    const drifted = {
      ...fieldSemanticsFor("GGThreshold"),
      fieldUnits: "micrometers (validated)",
    };
    expect(() => assertFieldSemanticsHonest(drifted)).toThrow(/operator\/field label mismatch/);
  });
});

describe("sha256Hex (pure implementation pinned to published vectors)", () => {
  const encode = (text: string): Uint8Array => new TextEncoder().encode(text);

  it("matches the FIPS 180-4 test vectors", () => {
    expect(sha256Hex(encode(""))).toBe(
      "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    );
    expect(sha256Hex(encode("abc"))).toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    );
    expect(sha256Hex(encode("abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq"))).toBe(
      "248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1",
    );
  });

  it("agrees with node:crypto on binary data (independent implementation cross-check)", () => {
    const bytes = new Uint8Array(70_001);
    for (let n = 0; n < bytes.length; n++) bytes[n] = (n * 7 + (n >> 3)) & 0xff;
    const expected = createHash("sha256").update(bytes).digest("hex");
    expect(sha256Hex(bytes)).toBe(expected);
    // A subarray view must hash the view, not the whole buffer.
    const view = bytes.subarray(13, 60_000);
    expect(sha256Hex(view)).toBe(createHash("sha256").update(view).digest("hex"));
  });
});
