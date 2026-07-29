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
  PHASE6_PARAM_SET,
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
 * The registered end-to-end fixture. **Four points in two pairs** (ADR 0032), at the configuration
 * WP3 registered (N = 48, measurement extent 21, Δx = 0.35, cfl = 0.1).
 *
 * They are the SWEEP's configuration on purpose. A cheaper, smaller fixture would test the
 * arithmetic just as well but would not test it where a habit class is actually being decided,
 * and the registered failure mode is a class that flips.
 *
 * It was two points until ADR 0031: `CAK` collapsed the old −5/−15 °C pair into the same class
 * (both `neutral`), leaving a control that could not detect the flip it exists to detect.
 */
export const PHASE6_CROSSPLATFORM_FIXTURE = {
  dims: { nx: 48, ny: 48, nz: 48 },
  dxUm: 0.35,
  cflFill: 0.1,
  targetExtent: 21,
  pressurePa: 101325,
  // ADR 0031: sourced from the protocol so the determinism control and the sweep cannot diverge.
  // It previously read "CAK_A1" as a literal while `phase6PointCommand` emitted no --param-set at
  // all, so the fixture documented a value it never passed.
  paramSet: PHASE6_PARAM_SET,
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
  /**
   * Sampling fraction for the TIER-1 fingerprint only — it sweeps σ_surf across every fingerprint
   * temperature, so it needs one fraction rather than a per-point one. The tier-2 points below
   * carry their own fractions.
   */
  waterRelativeFraction: 0.15,
  /**
   * TIER-2 points, selected by the ADR 0032 rule applied mechanically to the ADR 0031 re-sweep.
   * Two pairs, never pooled:
   *
   *   robust  — smallest and largest aspectRatio among valid points. Asks whether the whole
   *             pipeline agrees across architectures. Spans plate/column, so a flip is detectable.
   *   fragile — closest to each class threshold. Asks whether any class here is a last-ULP coin
   *             toss. `fragile-column-floor` measured AR **exactly 1.5000**, i.e. an exact integer
   *             tie in lattice extents sitting precisely on the column floor — one site either way
   *             changes its class. That is the sharpest fragility probe the grid contains.
   *
   * Every one is a point the re-sweep already ran, because the rule selects from its valid points.
   * The baseline below is therefore taken from the sweep's own rows rather than from fresh runs —
   * same arithmetic, no chance of a separate run diverging. ADR 0032's "four growth runs" cost
   * estimate applies only to the arm64 side.
   */
  points: [
    { label: "robust-plate", tempC: -2, fraction: 0.1 },
    { label: "robust-column", tempC: -28, fraction: 0.1 },
    { label: "fragile-plate-ceiling", tempC: -3, fraction: 0.25 },
    { label: "fragile-column-floor", tempC: -23, fraction: 0.15 },
  ],
} as const;

/**
 * σ∞ at the tier-1 fingerprint's sampling fraction, from the registered Table 2.1 ladder rather
 * than `sigmaWater()` — whose own docstring records that it crosses zero at −1.969 °C.
 */
export function phase6FixtureSigmaInf(tempC: number): number {
  return phase6SigmaWaterFromTable(tempC) * PHASE6_CROSSPLATFORM_FIXTURE.waterRelativeFraction;
}

/** σ∞ for a named tier-2 fixture point, at that point's own registered fraction. */
export function phase6FixturePointSigmaInf(label: string): number {
  const point = PHASE6_CROSSPLATFORM_FIXTURE.points.find((p) => p.label === label);
  if (point === undefined) throw new Error(`no fixture point labelled ${label}`);
  return phase6SigmaWaterFromTable(point.tempC) * point.fraction;
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
    push("nucleationAPrism", t, nucleationAPrism(tempC, PHASE6_PARAM_SET));
    // The driving supersaturation this temperature is actually swept at, and two neighbours,
    // so the exponential is probed across the range the surface field explores.
    const sigmaInf = phase6FixtureSigmaInf(tempC);
    for (const scale of [0.25, 1, 4]) {
      const sigmaSurf = sigmaInf * scale;
      push("alphaHK.basal", `${t}@${scale}`, alphaHK("basal", tempC, sigmaSurf, PHASE6_PARAM_SET));
      push("alphaHK.prism", `${t}@${scale}`, alphaHK("prism", tempC, sigmaSurf, PHASE6_PARAM_SET));
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
 *
 * **Re-issued 2026-07-28 by ADR 0031**, `560aeaf7` → `2a9f64b3`. The fingerprint previously
 * sampled `nucleationAPrism` and `alphaHK` at the literal `"CAK_A1"`, under which
 * `nucleationAPrism` returns a constant 1 at every temperature — so the tier-1 control was
 * fingerprinting a code path the sweep was not going to ship, and exercised nothing of the
 * A_prism interpolation. It now samples `PHASE6_PARAM_SET`.
 *
 * **MAC RUN NEEDED.** The arm64 side of this control has not been run and is not attempted here;
 * see the runbook. Re-issuing the digest resets that comparison — any previously recorded arm64
 * digest is against `560aeaf7` and is not comparable to this one.
 */
export const PHASE6_LIBM_DIGEST_X64_BASELINE = "2a9f64b3";

/**
 * The tier-2 baseline, likewise x64-only. These are not fresh runs: they are the N = 48 rows of
 * WP3's extent-21 domain ladder (`research/phase6-convergence.md` §1.2), whose conditions the
 * fixture reproduces exactly. The registered comparison is the HABIT CLASS; the counts and
 * ratios are recorded so a difference can be located, not so it can be required to match.
 */
/**
 * STALE — these values were produced under `CAK_A1`, and ADR 0031 changed the registered parameter
 * set to `CAK`. They are retained rather than deleted so the comparison has a history, but they
 * MUST NOT be used as the arm64 comparison baseline until repopulated.
 *
 * A measured calibration probe already shows how far the warm row moves: at −5 °C, f = 0.15, the
 * same configuration under `CAK` gives step 300, attached 4883, AR 1.0000 (neutral) against the
 * 0.3821 plate below. The cold row should barely move — `A_prism` ≈ 0.968 at (Tm−T) = 15, and
 * `2009.08404v2` Fig. 2's caption states A ≈ 1 for both facets between −10 and −30 °C.
 *
 * Repopulate from the ADR 0031 re-sweep's own −5 °C and −15 °C f = 0.15 rows rather than from
 * separate runs, so the control and the sweep are the same arithmetic.
 *
 * **Re-issuing this baseline resets the cross-platform control: MAC RUN NEEDED.** See the runbook.
 * The Mac/arm64 run is not attempted here.
 */
export const PHASE6_FIXTURE_X64_BASELINE_STALE_CAK_A1 = [
  { label: "warm", tempC: -5, steps: 145, attached: 1513, aspectRatio: 0.3821, habit: "plate" },
  { label: "cold", tempC: -15, steps: 316, attached: 5161, aspectRatio: 1.1053, habit: "neutral" },
] as const;

/**
 * The x64 tier-2 baseline under `CAK`, at the four ADR 0032 points. Taken verbatim from the
 * ADR 0031 re-sweep's own `out/phase6-sweep/points.json` rows (protocol `8aeb2b80…`, produced at
 * commit `390fe35`, 204/204 with zero exclusions), NOT from separate runs.
 *
 * It is a BASELINE, NOT A REQUIREMENT. A second architecture producing different numbers is this
 * control's expected-possible outcome and a reportable finding, not a bug to be fixed — and that
 * applies with most force to `fragile-column-floor`, whose AR is exactly 1.5000, sitting on the
 * column floor by an exact integer tie.
 *
 * **MAC RUN NEEDED** — the arm64 side is four growth runs plus the tier-1 fingerprint, roughly
 * 30 minutes each. Not attempted here; see docs/phase6-cross-platform-control.md.
 */
export const PHASE6_FIXTURE_X64_BASELINE = [
  { label: "robust-plate", tempC: -2, fraction: 0.1, sigmaInf: 0.002, steps: 175, attached: 1313, aspectRatio: 0.263158, habit: "plate" },
  { label: "robust-column", tempC: -28, fraction: 0.1, sigmaInf: 0.03150000000000001, steps: 195, attached: 1171, aspectRatio: 2.33333, habit: "column" },
  { label: "fragile-plate-ceiling", tempC: -3, fraction: 0.25, sigmaInf: 0.0075, steps: 198, attached: 3157, aspectRatio: 0.684211, habit: "neutral" },
  { label: "fragile-column-floor", tempC: -23, fraction: 0.15, sigmaInf: 0.037875, steps: 248, attached: 3037, aspectRatio: 1.5, habit: "column" },
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
