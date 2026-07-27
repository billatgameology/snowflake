// Phase 6 cross-platform reproducibility control (WP0c registration; WP3 required it).
//
// IEEE 754 makes `+ - * / sqrt` correctly rounded on every conforming platform, but it does NOT
// specify `Math.exp`, `Math.log` or `Math.pow`. Every one of this solver's physics inputs runs
// through at least one of them — `pSatIce` and `pSatWater` (exp), `sigma0Basal`/`sigma0Prism`
// (log and exp, via the piecewise log-log scheme), `alphaHK` (exp) — so two conforming engines on
// two architectures may legitimately differ in the last ULP. Phase 2b pinned its exact Node/V8
// build and declined any cross-engine bitwise claim. Phase 6 goes further and TESTS it.
//
// The control is deliberately two-tier, because the two tiers answer different questions and
// cost three orders of magnitude apart:
//
//   TIER 1 — the libm fingerprint. Bitwise-exact values of every transcendental the solver
//   actually calls, at the exact arguments it actually passes. Runs in milliseconds and needs no
//   solver at all. If this matches, the two platforms agree on the physics inputs and no habit
//   difference downstream can be blamed on libm. If it differs, this says exactly WHICH function
//   at WHICH argument, which no end-to-end comparison can.
//
//   TIER 2 — the end-to-end habit classification, at the registered sweep configuration. This is
//   the one that matters for the claim, because the registered failure mode is a habit class
//   that flips. It costs a full growth run per point.
//
// Tier 1 alone cannot close the control: identical inputs can still diverge downstream, because
// the relaxation is iterative and a tie at the attachment threshold can break either way. Tier 2
// alone cannot localize a failure. Both are registered.
//
// **A difference is a FINDING, not a failure to fix.** If a habit class differs between arm64
// and x64, that conclusion was resting on a last-ULP coin toss and is reported as fragile. It is
// never averaged away, and neither platform is declared correct.

import {
  alphaHK,
  cSat,
  kineticLength,
  nucleationAPrism,
  pSatIce,
  pSatWater,
  sigma0Basal,
  sigma0Prism,
  vKin,
} from "../../core/src/index.ts";
import {
  PHASE6_FAR_FIELD,
  PHASE6_NAKAYA_BOUNDARIES_C,
  PHASE6_SURFACE_POLICY,
  phase6SigmaWaterFromTable,
} from "./phase6-protocol.ts";

/** Exact float64 bits of a number, as a stable 16-hex-digit string. */
export function float64Bits(value: number): string {
  const buffer = new ArrayBuffer(8);
  new Float64Array(buffer)[0] = value;
  const hi = new Uint32Array(buffer)[1] as number;
  const lo = new Uint32Array(buffer)[0] as number;
  return hi.toString(16).padStart(8, "0") + lo.toString(16).padStart(8, "0");
}

/**
 * The registered end-to-end fixture. Two points, one per habit class the sweep must separate,
 * at the configuration WP3 registered (N = 48, measurement extent 21, Δx = 0.35, cfl = 0.1).
 *
 * They are the SWEEP's configuration on purpose. A cheaper, smaller fixture would test the
 * arithmetic just as well but would not test it where a habit class is actually being decided,
 * and the registered failure mode is a class that flips.
 */
export const PHASE6_CROSSPLATFORM_FIXTURE = {
  dims: { nx: 48, ny: 48, nz: 48 },
  dxUm: 0.35,
  cflFill: 0.1,
  targetExtent: 21,
  pressurePa: 101325,
  paramSet: "CAK_A1",
  surfacePolicy: PHASE6_SURFACE_POLICY,
  farField: PHASE6_FAR_FIELD,
  relaxTol: 1e-9,
  divTol: 1e-7,
  relaxMaxSweeps: 200_000,
  rngSeed: 1,
  noiseEpsilon: 0,
  domain: "hexPrism",
  seedRadius: 2,
  seedThickness: 1,
  waterRelativeFraction: 0.15,
  points: [
    { label: "warm", tempC: -5 },
    { label: "cold", tempC: -15 },
  ],
} as const;

/** σ∞ for a fixture point, from the registered Table 2.1 ladder rather than `sigmaWater()`. */
export function phase6FixtureSigmaInf(tempC: number): number {
  return phase6SigmaWaterFromTable(tempC) * PHASE6_CROSSPLATFORM_FIXTURE.waterRelativeFraction;
}

/**
 * Temperatures the fingerprint samples. Covers the whole Nakaya range at 1 °C spacing so a libm
 * difference cannot hide between two coarsely-spaced samples, plus the exact fixture
 * temperatures and the three digitized Nakaya boundaries.
 */
function fingerprintTemperatures(): number[] {
  const temps = new Set<number>();
  for (let t = -2; t >= -30; t--) temps.add(t);
  for (const boundary of PHASE6_NAKAYA_BOUNDARIES_C) temps.add(boundary);
  for (const point of PHASE6_CROSSPLATFORM_FIXTURE.points) temps.add(point.tempC);
  return [...temps].sort((a, b) => b - a);
}

export interface Phase6LibmEntry {
  readonly name: string;
  readonly argument: string;
  readonly bits: string;
}

/**
 * TIER 1. Every transcendental-dependent physics quantity the solver consumes, at the arguments
 * it consumes them at, as exact float64 bit patterns.
 *
 * `alphaHK` is sampled at the σ_surf values the sweep actually produces rather than at round
 * numbers: it is `A·exp(−σ₀/σ_surf)`, so its sensitivity to a ULP in `σ₀` is amplified by
 * `σ₀/σ_surf`, which is of order 10 at the registered conditions. Sampling it where that ratio
 * is large is the point.
 */
export function phase6LibmFingerprint(): readonly Phase6LibmEntry[] {
  const out: Phase6LibmEntry[] = [];
  const push = (name: string, argument: string, value: number): void => {
    out.push({ name, argument, bits: float64Bits(value) });
  };
  for (const tempC of fingerprintTemperatures()) {
    const t = tempC.toFixed(1);
    push("pSatIce", t, pSatIce(tempC));
    push("pSatWater", t, pSatWater(tempC));
    push("cSat", t, cSat(tempC));
    push("vKin", t, vKin(tempC));
    push("kineticLength", t, kineticLength(tempC, PHASE6_CROSSPLATFORM_FIXTURE.pressurePa));
    push("sigma0Basal", t, sigma0Basal(tempC));
    push("sigma0Prism", t, sigma0Prism(tempC));
    push("nucleationAPrism", t, nucleationAPrism(tempC, "CAK_A1"));
    // The driving supersaturation this temperature is actually swept at, and two neighbours,
    // so the exponential is probed across the range the surface field explores.
    const sigmaInf = phase6FixtureSigmaInf(tempC);
    for (const scale of [0.25, 1, 4]) {
      const sigmaSurf = sigmaInf * scale;
      push("alphaHK.basal", `${t}@${scale}`, alphaHK("basal", tempC, sigmaSurf, "CAK_A1"));
      push("alphaHK.prism", `${t}@${scale}`, alphaHK("prism", tempC, sigmaSurf, "CAK_A1"));
    }
  }
  return out;
}

/**
 * A single stable digest of the tier-1 fingerprint, for eyeball comparison across machines.
 * FNV-1a over the entry text — not cryptographic, and not required to be: it exists so two
 * operators can compare one short string, and the full table is still published for locating any
 * difference.
 */
export function phase6LibmDigest(entries: readonly Phase6LibmEntry[]): string {
  return fnv1a(entries);
}

/**
 * The x64 baseline, measured on the registered host. It is a BASELINE, NOT A REQUIREMENT: a
 * second architecture producing a different digest is the control's expected-possible outcome
 * and a reportable finding, not a bug to be fixed. It is recorded here so a second operator has
 * one short string to compare instead of 448 lines.
 *
 * Host: win32 x64, Node v24.13.1, V8 13.6.233.17-node.40.
 */
export const PHASE6_LIBM_DIGEST_X64_BASELINE = "560aeaf7";

/**
 * The tier-2 baseline, likewise x64-only. These are not fresh runs: they are the N = 48 rows of
 * WP3's extent-21 domain ladder (`research/phase6-convergence.md` §1.2), whose conditions the
 * fixture reproduces exactly. The registered comparison is the HABIT CLASS; the counts and
 * ratios are recorded so a difference can be located, not so it can be required to match.
 */
export const PHASE6_FIXTURE_X64_BASELINE = [
  { label: "warm", tempC: -5, steps: 145, attached: 1513, aspectRatio: 0.3821, habit: "plate" },
  { label: "cold", tempC: -15, steps: 316, attached: 5161, aspectRatio: 1.1053, habit: "neutral" },
] as const;

function fnv1a(entries: readonly Phase6LibmEntry[]): string {
  let hash = 0x811c9dc5;
  for (const entry of entries) {
    for (const character of `${entry.name}|${entry.argument}|${entry.bits}\n`) {
      hash ^= character.codePointAt(0) as number;
      hash = Math.imul(hash, 0x01000193) >>> 0;
    }
  }
  return hash.toString(16).padStart(8, "0");
}
