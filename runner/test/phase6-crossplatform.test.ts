// The Phase 6 cross-platform reproducibility control (WP0c registration).
//
// Note what is and is not asserted here. The libm digest is pinned ONLY when the test is running
// on x64, where it is a genuine regression tripwire. On any other architecture it is deliberately
// not asserted, because a different digest there is the control's expected-possible OUTCOME — a
// reportable finding about non-correctly-rounded transcendentals — and turning a legitimate
// finding into a red test would train everyone to ignore it. The comparison that decides the
// control is run by hand, per docs/runbooks/phase6-cross-platform-control.md.

import { describe, expect, it } from "vitest";
import {
  PHASE6_CROSSPLATFORM_FIXTURE,
  PHASE6_FIXTURE_X64_BASELINE,
  PHASE6_FIXTURE_X64_BASELINE_STALE_CAK_A1,
  PHASE6_LIBM_DIGEST_X64_BASELINE,
  float64Bits,
  phase6FixturePointSigmaInf,
  phase6FixtureSigmaInf,
  phase6LibmDigest,
  phase6LibmFingerprint,
} from "../src/phase6-crossplatform.ts";
import { PHASE6_FAR_FIELD, PHASE6_SURFACE_POLICY } from "../src/phase6-protocol.ts";

describe("the libm fingerprint", () => {
  it("is deterministic and covers every transcendental the solver consumes", () => {
    const first = phase6LibmFingerprint();
    const second = phase6LibmFingerprint();
    expect(phase6LibmDigest(first)).toBe(phase6LibmDigest(second));

    const names = new Set(first.map((entry) => entry.name));
    // Every physics input that reaches Math.exp / Math.log / Math.pow.
    for (const required of [
      "pSatIce",
      "pSatWater",
      "cSat",
      "vKin",
      "kineticLength",
      "sigma0Basal",
      "sigma0Prism",
      "nucleationAPrism",
      "alphaHK.basal",
      "alphaHK.prism",
    ]) {
      expect(names.has(required), required).toBe(true);
    }
    // Every entry is a full 64-bit pattern, so a difference cannot hide in a rounded decimal.
    for (const entry of first) expect(entry.bits).toMatch(/^[0-9a-f]{16}$/);
  });

  it("samples the whole Nakaya range at 1 C, plus the boundaries and fixture points", () => {
    const arguments_ = new Set(
      phase6LibmFingerprint()
        .filter((entry) => entry.name === "pSatIce")
        .map((entry) => entry.argument),
    );
    for (let t = -2; t >= -30; t--) expect(arguments_.has(t.toFixed(1)), `T=${t}`).toBe(true);
    // The three digitized Nakaya boundaries — where a ULP is most likely to matter, because a
    // habit flip is being located there.
    for (const boundary of ["-3.3", "-9.9", "-21.5"]) {
      expect(arguments_.has(boundary), boundary).toBe(true);
    }
  });

  it("would actually notice a last-ULP change", () => {
    // The guard this whole control rests on: a one-ULP difference must change the digest. If the
    // fingerprint rounded, printed too few digits, or hashed something coarser, it could not
    // detect what it exists to detect.
    const entries = [...phase6LibmFingerprint()];
    const original = phase6LibmDigest(entries);
    const first = entries[0] as { name: string; argument: string; bits: string };
    const nudged = [
      { ...first, bits: float64Bits(nextAfter(bitsToNumber(first.bits))) },
      ...entries.slice(1),
    ];
    expect(phase6LibmDigest(nudged)).not.toBe(original);
  });

  it("matches the registered x64 baseline, when running on x64", () => {
    if (process.arch !== "x64") return; // see the header — not a failure elsewhere
    expect(phase6LibmDigest(phase6LibmFingerprint())).toBe(PHASE6_LIBM_DIGEST_X64_BASELINE);
  });
});

describe("the registered fixture", () => {
  it("runs the sweep's own configuration, not a cheaper lookalike", () => {
    // The registered failure mode is a habit CLASS that flips, so the fixture has to sit where a
    // class is actually being decided: WP3's registered N = 48, extent 21, dx = 0.35, cfl = 0.1.
    expect(PHASE6_CROSSPLATFORM_FIXTURE.dims).toEqual({ nx: 48, ny: 48, nz: 48 });
    expect(PHASE6_CROSSPLATFORM_FIXTURE.targetExtent).toBe(21);
    expect(PHASE6_CROSSPLATFORM_FIXTURE.dxUm).toBe(0.35);
    expect(PHASE6_CROSSPLATFORM_FIXTURE.cflFill).toBe(0.1);
    expect(PHASE6_CROSSPLATFORM_FIXTURE.surfacePolicy).toBe(PHASE6_SURFACE_POLICY);
    expect(PHASE6_CROSSPLATFORM_FIXTURE.farField).toBe(PHASE6_FAR_FIELD);
    expect(PHASE6_CROSSPLATFORM_FIXTURE.noiseEpsilon).toBe(0); // deterministic, or it proves nothing
  });

  it("reproduces the WP3 ladder conditions exactly, so its baseline is already measured", () => {
    // The tier-2 baseline is not a fresh run — it is the N = 48 row of the extent-21 domain
    // ladder. That only holds if the fixture's sigma_inf is bit-identical to the ladder's.
    expect(phase6FixtureSigmaInf(-5)).toBeCloseTo(0.0075, 12);
    expect(phase6FixtureSigmaInf(-15)).toBeCloseTo(0.023550, 12);
  });

  it("registers two pairs that answer different questions (ADR 0032)", () => {
    const labels = PHASE6_CROSSPLATFORM_FIXTURE.points.map((p) => p.label);
    expect(labels).toEqual([
      "robust-plate",
      "robust-column",
      "fragile-plate-ceiling",
      "fragile-column-floor",
    ]);
    // Every baseline row is a registered fixture point, and vice versa — so a row cannot be
    // added for a point the fixture does not register, or a point left without a baseline.
    expect(PHASE6_FIXTURE_X64_BASELINE.map((r) => r.label)).toEqual(labels);
    // Each row's sigmaInf is the one its own registered fraction produces, not the tier-1
    // sampling fraction. This is the check that would have caught reusing 0.15 for all four.
    for (const row of PHASE6_FIXTURE_X64_BASELINE) {
      expect(phase6FixturePointSigmaInf(row.label)).toBeCloseTo(row.sigmaInf, 12);
    }
  });

  it("keeps the robust pair spanning two classes and the fragile pair on the thresholds", () => {
    const at = (label: string) => PHASE6_FIXTURE_X64_BASELINE.find((r) => r.label === label);
    // Robust: the control cannot detect a class flip unless these two differ.
    expect(at("robust-plate")?.habit).toBe("plate");
    expect(at("robust-column")?.habit).toBe("column");
    // ...and they must sit clear of the thresholds, or they are not robust.
    expect(at("robust-plate")?.aspectRatio).toBeLessThan(1 / 1.5 - 0.2);
    expect(at("robust-column")?.aspectRatio).toBeGreaterThan(1.5 + 0.5);

    // Fragile: within a hair of a threshold, which is the whole point. `fragile-column-floor`
    // is exactly 1.5 — an exact integer tie in lattice extents, so its class turns on one site.
    expect(Math.abs((at("fragile-plate-ceiling")?.aspectRatio ?? 0) - 1 / 1.5)).toBeLessThan(0.05);
    expect(at("fragile-column-floor")?.aspectRatio).toBe(1.5);
  });

  it("keeps the superseded CAK_A1 rows as history, not as a usable baseline", () => {
    // ADR 0031's stale table is retained so the comparison has a history. It must stay clearly
    // separate from the live baseline: two rows, both neutral-or-plate under the old parameter
    // set, and no label overlap with the four ADR 0032 points that replaced them.
    expect(PHASE6_FIXTURE_X64_BASELINE_STALE_CAK_A1.length).toBe(2);
    const stale = new Set(PHASE6_FIXTURE_X64_BASELINE_STALE_CAK_A1.map((r) => r.label));
    for (const row of PHASE6_FIXTURE_X64_BASELINE) expect(stale.has(row.label)).toBe(false);
  });
});

function bitsToNumber(bits: string): number {
  const buffer = new ArrayBuffer(8);
  const words = new Uint32Array(buffer);
  words[1] = Number.parseInt(bits.slice(0, 8), 16);
  words[0] = Number.parseInt(bits.slice(8), 16);
  return new Float64Array(buffer)[0] as number;
}

/** The next representable float64 above `value`, for the one-ULP sensitivity check. */
function nextAfter(value: number): number {
  const buffer = new ArrayBuffer(8);
  new Float64Array(buffer)[0] = value;
  const words = new Uint32Array(buffer);
  if ((words[0] as number) === 0xffffffff) {
    words[0] = 0;
    words[1] = (words[1] as number) + 1;
  } else {
    words[0] = (words[0] as number) + 1;
  }
  return new Float64Array(buffer)[0] as number;
}
