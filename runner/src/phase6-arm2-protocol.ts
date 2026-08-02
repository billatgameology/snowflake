// Phase 6 ARM 2 — the SDAK arm's frozen protocol (ADR 0030 item 5, ADR 0036).
//
// WHY THIS IS A SEPARATE MODULE AND NOT AN EDIT.
//
// Arm 1's protocol is published evidence. `out/phase6-sweep/report.json` names the combined hash
// that produced it, and §3.2 prices any edit to a registered VALUE at a full re-sweep. So arm 2
// gets its own freeze rather than a parameter added to arm 1's: nothing in `phase6-protocol.ts`
// changes, arm 1's three hashes stay bit-identical, and the arm-1 evidence stays verifiable against
// the commit it names. `runner/test/phase6-arm2.test.ts` asserts that, not this comment.
//
// THE DESIGN CONSTRAINT THAT MATTERS: arm 2 must differ from arm 1 in as FEW registered values as
// possible, so the scope of the comparison remains auditable. Holding the grid, measurement size,
// and thresholds fixed excludes those numerical choices as explanations for an arm difference.
// It does not make CAK→M1 a causal SDAK ablation: the composite parameter-set switch changes the
// broad sigma0 forms, A_prism, and both dip factors. Only the matched M1↔M1_NO_DIP_ABLATION pair
// specified by accepted ADR 0040 and still to be frozen by the replacement protocol can isolate sensitivity
// to the implemented dip factors within that frozen solver configuration. It cannot establish
// physical SDAK causality or necessity in nature.
//
// This module therefore builds arm 2's freeze list by APPLYING NAMED OVERRIDES to arm 1's, and the
// test asserts every non-overridden row is the SAME OBJECT (`toBe`, reference identity) as arm 1's.
// "The arms differ in exactly these rows" is then a checked property rather than a claim — and a
// row that drifts fails the suite instead of quietly widening the difference.

import { M1_BASAL_DIP_CENTRE_C, M1_PRISM_DIP_CENTRE_C } from "@vcc/core";
import {
  PHASE6_AMBIGUITY_HALF_WIDTH_C,
  PHASE6_DOMAIN_SPOT_CHECK,
  PHASE6_ENGINE_CONTROL,
  PHASE6_EXTENT_DRIFT_BOUND_AR,
  PHASE6_EXTRAPOLATION_ORDER_WINDOW,
  PHASE6_FAR_FIELD,
  PHASE6_FREEZE_LIST,
  PHASE6_HEADLINE_SCOPE_C,
  PHASE6_LATENT_HEATING,
  PHASE6_NAKAYA_BOUNDARIES_C,
  PHASE6_REFERENCE_REGIMES,
  PHASE6_SIGMA_FRACTIONS,
  PHASE6_SIGMA_WATER_ANCHORS,
  PHASE6_SURFACE_POLICY,
  phase6TemperatureGrid,
  phase6IsInAmbiguityBand,
  phase6ReferenceRegime,
  type Phase6FreezeItem,
  type Phase6ModelClass,
  type Phase6ReferenceRegime,
  type Phase6Score,
} from "./phase6-protocol.ts";

/**
 * The commit at which arm 2's protocol became final.
 *
 * Named from the commit that FOLLOWS the freeze, because a commit cannot contain its own hash — the
 * identical two-step arm 1 uses for `PHASE6_PROTOCOL_FREEZE_COMMIT`. That following commit adds no
 * protocol content, so the hash recorded here is genuinely the one arm 2 froze at.
 *
 * It lives in the GATED values manifest deliberately. A freeze commit added afterwards would be a
 * freeze commit chosen after seeing results; putting it inside the gated hash means it cannot be
 * added later without invalidating the run, which is the only thing that makes "registered before it
 * ran" cost anything.
 */
export const PHASE6_ARM2_FREEZE_COMMIT = "483f7ee56cbbcd5017658aa4879a3a9b87c56809";

/** Arm 2's identity, recorded in its artifacts so an arm can never be mistaken for the other. */
export const PHASE6_ARM2_ID = "arm2-sdak-m1" as const;

/** Arm 2's single registered switch; a composite kinetics change, not a causal SDAK ablation. */
export const PHASE6_ARM2_PARAM_SET = "M1" as const;

/**
 * Temperatures where the REFERENCE is two-valued, so no single-valued score can be right (ADR 0036
 * pre-registration 2).
 *
 * `2109.00098v1` p8: "both platelike and needlelike crystals can grow under essentially identical
 * conditions at this temperature". `1912.03230v1` p16 makes the outcome depend on growth history:
 * columnar growth at −5 °C is obtainable "provided we just start the experiment with a sufficiently
 * high sigma_inf".
 *
 * These points are scored `{plate, column}` and EXCLUDED from the headline — the identical
 * treatment `columns-and-plates` already receives below −21.5 °C, extended to the second place the
 * source documents two habits. They are still swept and still reported.
 *
 * Registered BEFORE arm 2 runs. −4 °C is already inside the ±1.0 °C ambiguity band around −3.3, so
 * the marginal cost is −5 and −6: twelve points, and half of the `columns` headline scope.
 */
export const PHASE6_ARM2_BISTABLE_TEMPERATURES_C = [-4, -5, -6] as const;

/**
 * Historical arm-2 wire values used to compare M1 with source-inferred NARROW-FACET (SDAK)
 * nucleation parameters. These are model-dependent inversions/fits reported by the source lineage,
 * not raw independent measurements of the fitted parameter.
 *
 * CORRECTED by the arm-2 freeze review of 2026-07-30, in BOTH directions. My first version claimed a
 * values-hashed "prose-anchored" tier over −2…−15 °C on the ground that prose-stated numbers
 * existed for both dips throughout it. Current interpretation calls these four same-lineage
 * source-inferred references: the warmest is −5 °C and one basal reference is −14 °C. Re-derived
 * from `research/libbrecht-papers-extracts.md` rather than either historical account.
 *
 * M1 against all four, computed:
 *
 *     T     facet   source-fit M1        ratio
 *     −5    basal   0.1%       0.0987%   0.987
 *     −10   prism   0.85%      0.5916%   0.696
 *     −14   basal   2.33%      2.2636%   0.972
 *     −25   prism   6.6%       6.0409%   0.915
 *
 * The numerical asymmetry is limited to these same-lineage source fits: the basal values differ by
 * at most 2.8%, while the prism values differ by 30% at −10 °C and 8.5% at −25 °C. It is a
 * transcription/model-consistency comparison, not independent empirical validation.
 *
 * `measuredPercent` is retained below ONLY because it is part of the frozen historical values
 * manifest. Renaming that key would move `PHASE6_ARM2_VALUES_SHA256` and make the 204-row artifact
 * unverifiable. Current interpretation must use `PHASE6_ARM2_SOURCE_INFERRED_REFERENCES`.
 */
export const PHASE6_ARM2_SDAK_ANCHORS = [
  { tempC: -5, facet: "basal", measuredPercent: 0.1, source: "1912.03230v1 (CM6)" },
  { tempC: -10, facet: "prism", measuredPercent: 0.85, source: "2009.08404v2 p14 (CM8)" },
  { tempC: -14, facet: "basal", measuredPercent: 2.33, source: "2009.08404v2 (CM8)" },
  { tempC: -25, facet: "prism", measuredPercent: 6.6, source: "2009.08404v2 p13 (CM8)" },
] as const;

/** Scientifically named view of the frozen legacy reference values; outside the historical values hash. */
export const PHASE6_ARM2_SOURCE_INFERRED_REFERENCES = PHASE6_ARM2_SDAK_ANCHORS.map(
  ({ tempC, facet, measuredPercent, source }) => ({
    tempC,
    facet,
    sourceInferredPercent: measuredPercent,
    source,
  }),
);

/**
 * How well-sourced arm 2's inputs are at each temperature, published WITH the headline rather than
 * beneath it (ADR 0036 pre-registration 3).
 *
 * These are historical source-reference tiers, not domains of the M1 equations. Figure 1 of
 * 2306.13087v1 displays M1 over `(Tm−T) ∈ [1, 50] °C`; −5 and −25 °C only bracket the four
 * same-lineage numeric reference values above.
 */
export const PHASE6_ARM2_SOURCING_TIERS = [
  {
    tier: "extrapolating-warm",
    warmestC: -2,
    coldestC: -4,
    note: "warmer than every prose-stated SDAK anchor (the warmest is −5 °C, basal). −3 and −4 are " +
      "already outside the headline via the ambiguity band, leaving −2 °C as the ONE headline " +
      "temperature whose inputs are extrapolated on the warm side",
  },
  {
    tier: "bracketed",
    warmestC: -5,
    coldestC: -25,
    note: "inside the span bracketed by prose-stated anchors at −5, −10, −14 and −25 °C. Every " +
      "headline temperature except −2 °C is here",
  },
  {
    tier: "extrapolating-cold",
    warmestC: -26,
    coldestC: -35,
    note: "colder than every prose-stated anchor and colder than 2009.08404v2 Figure 18's plotted " +
      "span — the closed form's extrapolation, evaluated in 3D. Ten temperatures, none of them in " +
      "the headline. Arm 2 adds no independent information here",
  },
] as const;

/**
 * Scientifically named current view of the values-hashed legacy tiers. The historical identifiers
 * above are preserved only so the 204-row artifact remains verifiable; "extrapolating" there means
 * outside the four same-lineage numeric-reference values, not outside M1's source-displayed domain.
 */
export const PHASE6_ARM2_SOURCE_REFERENCE_TIERS = PHASE6_ARM2_SOURCING_TIERS.map((legacy) => {
  const tier =
    legacy.tier === "extrapolating-warm"
      ? "outside-reference-bracket-warm"
      : legacy.tier === "extrapolating-cold"
        ? "outside-reference-bracket-cold"
        : "within-reference-bracket";
  const note =
    tier === "outside-reference-bracket-warm"
      ? "warmer than all four same-lineage numeric references, while inside Figure 1's displayed M1 domain"
      : tier === "outside-reference-bracket-cold"
        ? "colder than all four same-lineage numeric references, while inside Figure 1's displayed M1 domain"
        : "inside the temperature bracket spanned by the four same-lineage numeric references";
  return { tier, warmestC: legacy.warmestC, coldestC: legacy.coldestC, note };
});

/**
 * Historical values-hashed tier identifier. Do not use in current reports.
 * @deprecated Use `phase6Arm2SourceReferenceTier`, whose labels do not misstate the M1 domain.
 */
export function phase6Arm2SourcingTier(tempC: number): string {
  for (const t of PHASE6_ARM2_SOURCING_TIERS) {
    if (tempC <= t.warmestC && tempC >= t.coldestC) return t.tier;
  }
  throw new Error(`no arm-2 sourcing tier contains T = ${String(tempC)} C`);
}

/** Current reporting tier; never display the values-hashed legacy "extrapolating" labels. */
export function phase6Arm2SourceReferenceTier(tempC: number): string {
  for (const tier of PHASE6_ARM2_SOURCE_REFERENCE_TIERS) {
    if (tempC <= tier.warmestC && tempC >= tier.coldestC) return tier.tier;
  }
  throw new Error(`no arm-2 source-reference tier contains T = ${String(tempC)} C`);
}

/** True when the reference itself names two habits here, so a single-valued score cannot be right. */
export function phase6Arm2IsBistable(tempC: number): boolean {
  return PHASE6_ARM2_BISTABLE_TEMPERATURES_C.includes(tempC as -4 | -5 | -6);
}

/**
 * Arm 2's scoring. Identical to arm 1's except inside the bistable band.
 *
 * Deliberately NOT implemented by editing `phase6ScoreHabit`: arm 1's rule must keep producing
 * arm 1's published numbers, and a shared function with an arm flag would put both arms one
 * mistaken default apart. The duplication here is two lines and buys total isolation.
 */
export function phase6Arm2ScoreHabit(tempC: number, modelClass: Phase6ModelClass): Phase6Score {
  if (modelClass === "invalid") return "excluded";
  if (phase6Arm2IsBistable(tempC)) {
    // Both pure classes are accepted; only `neutral` — neither habit — disagrees.
    return modelClass === "neutral" ? "disagree" : "agree";
  }
  const regime = phase6ReferenceRegime(tempC);
  const spec = PHASE6_REFERENCE_REGIMES.find((candidate) => candidate.regime === regime);
  if (spec === undefined) throw new Error(`no spec for regime ${regime}`);
  return spec.accepts.includes(modelClass) ? "agree" : "disagree";
}

/**
 * Arm 2's headline scope: a single-habit regime, outside the ambiguity band, AND outside the
 * bistable band.
 *
 * The bistable points are reported with their own count, exactly as `columns-and-plates` is. A
 * point that accepts both classes cannot fail except by measuring neutral, and counting that
 * toward a headline would inflate it with near-free agreement — the same argument that kept the
 * coldest regime out of arm 1's headline.
 */
export function phase6Arm2InHeadlineScope(tempC: number): boolean {
  if (phase6IsInAmbiguityBand(tempC)) return false;
  if (phase6Arm2IsBistable(tempC)) return false;
  const regime = phase6ReferenceRegime(tempC);
  const spec = PHASE6_REFERENCE_REGIMES.find((candidate) => candidate.regime === regime);
  return spec?.inHeadline ?? false;
}

// ── The freeze list, as named differences from arm 1 ─────────────────────────────────────────

/**
 * Freeze rows whose PROSE differs in arm 2, by id. Every other row is reused by reference.
 *
 * Three rows, and the reason each has to change:
 *   `param-set`               — the change the arm exists to make.
 *   `parameter-interpolation` — M1 is a closed form, not an interpolation between anchors, so the
 *                               row describing the interpolation scheme would be false as written.
 *   `parameter-table`         — arm 2 uses M1's printed algebra plus a registered P4 resolution of
 *                               its unstated logarithm base, rather than consuming arm 1's
 *                               digitized CAK anchors.
 */
export const PHASE6_ARM2_ROW_OVERRIDES: Readonly<Record<string, Phase6FreezeItem["prose"]>> = {
  "param-set": {
    requirement:
      "the parameter set selecting which attachment kinetics every run applies",
    value:
      "M1 — σ₀,basal and σ₀,prism from the model-prescribed SDAK-dipped closed forms of " +
      "2306.13087v1 p6, with " +
      "A_basal = A_prism = 1 on every facet and at every condition",
    source:
      "ADR 0036 historical choice. M2 requires a facet-width input that the current lattice does " +
      "not resolve or constrain, whereas M1 prescribes the narrow-facet limit without querying " +
      "width. The source motivates that prescription with an Edge-Sharpening Instability argument; " +
      "the project has not established that every simulated facet is narrow or that a particular " +
      "row satisfies the source's morphology assumptions. A_basal = A_prism = 1 is the source " +
      "model's explicit simplifying choice. It makes only the RESTRICTED equal-shared-field " +
      "coefficient ordering depend on the two sigma0 functions; it does not make the evolved 3-D " +
      "habit independent of facet-local sigmaSurf, diffusion, geometry or history. A failure " +
      "concentrated at low f cannot by itself identify which model assumption failed",
  },
  "parameter-interpolation": {
    requirement: "how σ₀(T) is obtained between registered temperatures",
    value:
      "no interpolation — σ₀,basal(T) and σ₀,prism(T) are evaluated directly from the printed " +
      "closed forms at every temperature; log is base 10; evaluation is limited to " +
      "(Tm−T) ∈ [1, 50] °C, the domain displayed for M1 in 2306.13087v1 Figure 1",
    source:
      "ADR 0036 as corrected by ADR 0040. Direct closed-form evaluation removes arm 1's numerical " +
      "interpolation operation; it does not remove model-form, source-fit or transcription " +
      "uncertainty. The [1, 50] °C interval comes from the source's displayed M1 model, not from the " +
      "four same-lineage numeric references. The base-10 reading is " +
      "not stated in any paper. Dip minima cannot distinguish logarithm bases: both factors reach " +
      "their minima at the printed 4.5 °C and 14.4 °C centres under log10 and ln; changing base " +
      "changes dip width, not centre. Base 10 is retained because the printed Figure 1 widths " +
      "match that reading. The formerly quoted approximately 3.08 °C and 8.07 °C values are restricted " +
      "equal-shared-field alphaHK equality locations, not dip centres or 3-D habit transitions; " +
      "their count does not independently prove the logarithm base",
  },
  "parameter-table": {
    requirement: "the provenance of arm 2's attachment-kinetics inputs",
    value:
      "arXiv:2306.13087v1 p6 printed M1 algebra plus the project's registered, Figure-1-width-" +
      "supported P4 choice to evaluate its unstated log base as 10; corrected " +
      "docs/libbrecht-parameters.md §4.1a records that mapping, while arm 2 does not consume its " +
      "digitized CAK anchors",
    source:
      "ADR 0036 as corrected by ADR 0040. The printed algebra is transcribed rather than digitized, " +
      "so the ±25% CAK-anchor digitization band does not apply. The paper does not state the " +
      "logarithm base; resolving it as base 10 from Figure 1's widths is a P4 transcription choice " +
      "and can move the evaluated dip widths even though no CAK re-digitization can. The M1 " +
      "prescription itself remains P3: the dip CENTRES were chosen by the author to impose " +
      "agreement with the Nakaya diagram (charter §2.5), so any agreement arm 2 obtains is " +
      "in-sample reproduction and is labelled as such wherever it appears (ADR 0005). The corpus " +
      "states only TWO values of the prism dip numerically — 0.85% at −10 °C " +
      "and 6.6% at −25 °C (2009.08404v2 p14, p13) — and the closed form runs low against both, by " +
      "30% and 8.5%",
  },
};

/**
 * Rows arm 2 registers that arm 1 has no equivalent of. All three come from ADR 0036's pre-registrations
 * and all three must be frozen BEFORE the sweep, because each could otherwise be settled after seeing
 * results.
 */
export const PHASE6_ARM2_ADDED_ROWS: readonly Phase6FreezeItem[] = [
  {
    id: "bistable-band",
    group: "comparison-design",
    status: "registered",
    prose: {
      requirement:
        "how temperatures at which the REFERENCE names two habits are scored",
      value:
        `T ∈ {${PHASE6_ARM2_BISTABLE_TEMPERATURES_C.join(", ")}} °C accepts {plate, column} and is ` +
        "EXCLUDED from the headline, reported with its own count. neutral still scores disagree",
      source:
        "ADR 0036 pre-registration 2, registered pre-sweep. 2109.00098v1 p8 records that 'both " +
        "platelike and needlelike crystals can grow under essentially identical conditions at this " +
        "temperature', and 1912.03230v1 p16 makes which one you get depend on growth history. " +
        "Scoring {column} alone there would score against a claim the source does not make. This " +
        "is the identical treatment columns-and-plates already receives below −21.5 °C, extended " +
        "to the second place two habits are documented — not a new mechanism. COST, stated as a " +
        "number: −4 °C is already inside the ambiguity band, so −5 and −6 leave the headline, " +
        "which is 12 points and half of the columns regime's scope. It moves the DENOMINATOR " +
        "only: the withdrawn/confounded historical proxy forecast's numerator was 42 either way; " +
        "it is inadmissible as habit evidence and was not a valid pre-run habit prediction. " +
        "CAPABILITY LIMIT: arm 2 " +
        "runs single-trajectory at fixed seed and constant σ∞, so it cannot exhibit bistability " +
        "even if the model has it; the arm avoids scoring against the two-valuedness rather than " +
        "testing it",
    },
  },
  {
    id: "input-sourcing-tiers",
    group: "physics-inputs",
    status: "registered",
    prose: {
      requirement:
        "how well-sourced arm 2's inputs are at each temperature, published with the headline",
      value:
        PHASE6_ARM2_SOURCE_REFERENCE_TIERS.map(
          (t) => `${t.warmestC}…${t.coldestC} °C ${t.tier}`,
        ).join("; ") +
        "; same-lineage source-fit references " +
        PHASE6_ARM2_SOURCE_INFERRED_REFERENCES.map(
          (a) => `${a.tempC} °C ${a.facet} ${a.sourceInferredPercent}%`,
        ).join(", "),
      source:
        "ADR 0036 pre-registration 3. The prism dip reduction is numerically large — 0.055 of " +
        "the broad-facet value at −15 °C, still 0.635 at −25 °C, 0.920 at −35 °C — and the corpus " +
        "states only two of its values numerically. Ten of the 34 registered temperatures lie " +
        "below every numeric reference while remaining inside the source's displayed M1 domain. " +
        "Any restricted equal-shared-field coefficient-order swap near −24/−25 °C is an analytic " +
        "model diagnostic, not a predicted 3-D habit transition. The −25 °C source-fit value is " +
        "same-lineage and cannot independently validate a hit there; a miss also cannot isolate " +
        "the SDAK prescription",
    },
  },
  {
    id: "registered-expectation",
    group: "comparison-design",
    status: "registered",
    prose: {
      requirement:
        "the withdrawn/confounded historical proxy forecast registered before arm 2 ran; " +
        "inadmissible as habit evidence",
      value:
        "withdrawn/confounded historical proxy forecast (inadmissible as habit evidence; not a " +
        "valid pre-run habit prediction): headline 42/90 under arm 1's UNMODIFIED scoring " +
        "(42/78 under the bistable-band rule); " +
        "per regime plates-warm 4/6, columns 0/12 all neutral, plates-cold 38/60 under the " +
        "positive log-log proxy. The historical linear alternative is refused because it produces " +
        "nonpositive aspect ratios; its former 66/78 score and 42–66 range are withdrawn",
      source:
        "ADR 0036 Part 2 historical forecast. It fit arm 1's own 204 aspect ratios against a scalar " +
        "sigmaInfinity/far-field equal-field coefficient-ratio proxy (ln AR = −0.2659 + " +
        "0.5119·ln r, R² = 0.511, back-check " +
        "173/204) and transferred that empirical relation to M1. The fit is not a mechanistic " +
        "habit law, and 44/204 predictions extrapolated beyond its fitted ratio range. The later " +
        "arm-2 run measured 54/90 under its historical scoring, but that in-sample result neither " +
        "validates the forecast nor isolates the dip factors. Separately, 9/78 rows from the " +
        "historical linear proxy were nonpositive and are numerically inadmissible for R15 or a " +
        "gate; its former 66/78 score is withdrawn. The 0-D " +
        "ordering check is a same-source transcription diagnostic only",
    },
  },
];

/**
 * Arm 2's freeze list: arm 1's rows, with the three named overrides applied and the three new rows
 * appended.
 *
 * Rows that are not overridden are returned BY REFERENCE, so `phase6Arm2FreezeList().find(...)` and
 * `PHASE6_FREEZE_LIST.find(...)` return the same object for every shared row. That is what makes
 * "the arms differ in exactly these rows" checkable with `toBe` rather than argued in prose.
 */
export function phase6Arm2FreezeList(): readonly Phase6FreezeItem[] {
  const overridden = PHASE6_FREEZE_LIST.map((item) => {
    const prose = PHASE6_ARM2_ROW_OVERRIDES[item.id];
    return prose === undefined ? item : { ...item, prose };
  });
  return [...overridden, ...PHASE6_ARM2_ADDED_ROWS];
}

// ── Arm 2's manifests and hashes (ADR 0033's two-hash scheme, applied to the new arm) ─────────
//
// Same split as arm 1: the VALUES hash gates and costs a re-sweep if edited; the JUSTIFICATION hash
// is reported and costs nothing, because no evidence-producing path reads prose. Arm 2 starts under
// the scheme rather than being retrofitted into it, which was the whole point of landing ADR 0033
// before this freeze.
//
// Every shared value is read from arm 1's exported constant rather than re-typed here. A second
// copy of the temperature grid would be a second thing to keep in sync, and the two arms being
// swept over the SAME grid is the property that makes them comparable at all.

/** Everything an arm-2 evidence path reads. Gated by preflight. */
export function phase6Arm2ValuesManifest(
  items: readonly Phase6FreezeItem[] = phase6Arm2FreezeList(),
): Record<string, unknown> {
  const pending = items.filter((item) => item.status === "pending");
  if (pending.length > 0) {
    throw new Error(
      `Phase 6 arm 2 is not frozen: ${pending.length} item(s) pending — ` +
        `${pending.map((item) => item.id).join(", ")}`,
    );
  }
  return {
    arm: PHASE6_ARM2_ID,
    paramSet: PHASE6_ARM2_PARAM_SET,
    // Shared with arm 1 BY REFERENCE — the controlled part of the comparison.
    latentHeating: PHASE6_LATENT_HEATING,
    farField: PHASE6_FAR_FIELD,
    surfacePolicy: PHASE6_SURFACE_POLICY,
    temperatureGrid: phase6TemperatureGrid(),
    sigmaFractions: PHASE6_SIGMA_FRACTIONS,
    sigmaWaterAnchors: PHASE6_SIGMA_WATER_ANCHORS,
    nakayaBoundariesC: PHASE6_NAKAYA_BOUNDARIES_C,
    ambiguityHalfWidthC: PHASE6_AMBIGUITY_HALF_WIDTH_C,
    referenceRegimes: PHASE6_REFERENCE_REGIMES,
    headlineScopeC: PHASE6_HEADLINE_SCOPE_C,
    extrapolationOrderWindow: PHASE6_EXTRAPOLATION_ORDER_WINDOW,
    extentDriftBoundAR: PHASE6_EXTENT_DRIFT_BOUND_AR,
    domainSpotCheck: PHASE6_DOMAIN_SPOT_CHECK,
    engineControl: PHASE6_ENGINE_CONTROL,
    // Arm 2's own registered values.
    bistableTemperaturesC: PHASE6_ARM2_BISTABLE_TEMPERATURES_C,
    sourcingTiers: PHASE6_ARM2_SOURCING_TIERS,
    m1BasalDipCentreC: M1_BASAL_DIP_CENTRE_C,
    m1PrismDipCentreC: M1_PRISM_DIP_CENTRE_C,
    sdakAnchors: PHASE6_ARM2_SDAK_ANCHORS,
    freezeCommit: PHASE6_ARM2_FREEZE_COMMIT,
    freezeRows: items.map((item) => ({ id: item.id, group: item.group, status: item.status })),
  };
}

/** Arm 2's prose. Reported, never gated; a correction here costs no re-sweep. */
export function phase6Arm2JustificationManifest(
  items: readonly Phase6FreezeItem[] = phase6Arm2FreezeList(),
): Record<string, unknown> {
  return { arm: PHASE6_ARM2_ID, prose: items.map((item) => ({ id: item.id, ...item.prose })) };
}

/**
 * Arm 2's registered VALUES hash — the gate. Editing any registered arm-2 value moves this and,
 * under charter §3.2 as amended by ADR 0033, makes the earlier sweep inadmissible for a
 * replacement gate and requires its full replacement rerun. Earlier executed bytes and
 * measurements remain historical evidence of their named superseded protocol.
 *
 * Registered at the arm-2 freeze, before any arm-2 point ran.
 */
export const PHASE6_ARM2_VALUES_SHA256 =
  "13e678d5eec467a391958a18c71c8d170900d6efd0d5c23bb4362d863b9acd76";

/** Arm 2's justification hash — reported, never gated. Prose corrections cost no re-sweep. */
export const PHASE6_ARM2_JUSTIFICATION_SHA256 =
  "e2f7f24c5fc71137c9d06bb2344685b260d8702426edf656f22dd6b42f58471f";

/** Justification-hash revisions for arm 2, newest last; old evidence cites the first row. */
export const PHASE6_ARM2_JUSTIFICATION_REVISIONS: readonly {
  sha256: string;
  note: string;
}[] = [
  {
    sha256: "1b7faeb85fb9095931ef9294d65c619723ac389de24daddd8d9c173b833d00e8",
    note: "historical arm-2 justification, including the incorrect logarithm-base centre claim",
  },
  {
    sha256: "80e9c920b04c0a6e1f6985b2edb1e6cf33d336bb8bb89eb3fdf437a7dcfc24ba",
    note:
      "2026-08-01 prose correction: both logarithm bases retain the printed dip centres; base " +
      "changes width. That revision still described 3.08/8.07 C generically as alphaHK crossings; " +
      "the next revision narrows them to equal-shared-field coefficient equalities. Registered " +
      "values are unchanged",
  },
  {
    sha256: "f184f5459c99de6cac552e5b74bdd199a03ca205d6aabca5c12e6a98ff6464b9",
    note:
      "2026-08-01 interpretation correction: source-fit rather than direct-measurement provenance; " +
      "source Figure 1 domain; equal-shared-field coefficient equalities rather than habit " +
      "transitions; no exclusive low-f cause; and refusal of the linear proxy's nonpositive AR " +
      "outputs. Historical values and values hash are unchanged",
  },
  {
    sha256: "3d3e91954c71258c861092fd07a06297cae8ce39ece1bef62a35e8f4e81481d4",
    note:
      "2026-08-01 adversarial causal-scope correction: CAK-to-M1 changes several kinetics " +
      "choices and does not isolate the dip factors; the 54/90 forward result remains a valid " +
      "in-sample measurement, while numerical inadmissibility applies to 9/78 nonpositive " +
      "historical linear-proxy rows. Historical values and values hash are unchanged",
  },
  {
    sha256: "ad00d02c57d22b4902bbc823aadf34c47dda559f0ca1484f4850cb94216649c1",
    note:
      "candidate ADR 0040 inherited arm-1 interpretation correction: scope historical " +
      "numerical probes to the CAK_A1 configurations actually measured and remove unsupported " +
      "habit, exact-convergence and causal readings. Historical values and values hash are unchanged",
  },
  {
    sha256: "49ec78de5e79611918c08b88c3d43556f8ebd6f0b80451e13439181e7fd1a8a4",
    note:
      "candidate ADR 0040 source-domain correction: current report prose calls the historical " +
      "tiers outside/within the four same-lineage numeric-reference bracket, never closed-form " +
      "extrapolation beyond Figure 1's displayed M1 domain. Historical values and values hash are unchanged",
  },
  {
    sha256: "e8d8bd749e456246a504ff5093734a8c6ba15f865b2f5413f2a98abb0183e80d",
    note:
      "candidate ADR 0040 parameter-table provenance correction: arm 2 remains a direct " +
      "transcription of M1's printed equations and does not consume the digitized CAK anchors; " +
      "the corrected parameter table records that source mapping. Historical values and values " +
      "hash are unchanged",
  },
  {
    sha256: "e8dcc4378d6913c0da8d98f2820858cadd9a17fa541e4108770476883e26911e",
    note:
      "candidate ADR 0040 P3/P4 provenance correction: the source prints the M1 algebra but not " +
      "the logarithm base; base 10 is a Figure-1-width-supported project transcription choice. " +
      "Historical values and values hash are unchanged",
  },
  {
    sha256: "709646e565b0795cad50349db72f42d882abfb84a6f927424f96ee2417441603",
    note:
      "2026-08-02 accepted ADR 0040 propagation correction: every live field that names the " +
      "42/90 or 42/78 result labels it a withdrawn/confounded historical proxy forecast, " +
      "inadmissible as habit evidence and not a valid pre-run habit prediction. Historical " +
      "values and values hash are unchanged",
  },
  {
    sha256: "e2f7f24c5fc71137c9d06bb2344685b260d8702426edf656f22dd6b42f58471f",
    note:
      "2026-08-02 ADR 0040 acceptance-audit metrology follow-up inherited from arm 1: exact " +
      "atmosphere conversion is distinguished from the P2 diffusivity anchor closure. Historical " +
      "values and values hash are unchanged",
  },
];

/** Values-hash revisions for arm 2, newest last. */
export const PHASE6_ARM2_VALUES_REVISIONS: readonly { sha256: string; note: string }[] = [
  {
    sha256: "13e678d5eec467a391958a18c71c8d170900d6efd0d5c23bb4362d863b9acd76",
    note:
      "arm-2 freeze, ADR 0036. 28 rows: arm 1's 25 with param-set, parameter-interpolation and " +
      "parameter-table overridden, plus bistable-band, input-sourcing-tiers and " +
      "registered-expectation. Registered BEFORE any arm-2 point ran",
  },
];

/**
 * Arm 2's COMBINED manifest — values and prose in one object, the same construction arm 1 uses for
 * `phase6ProtocolManifest`.
 *
 * Added after the arm-2 freeze review, and after the sweep was launched and stopped one minute in:
 * the header printed `protocol 2b94aa5f…`, which is ARM 1's combined hash, and arm 2's report.json
 * would have carried it. The arm-discriminating fields were all correct, but a report that says
 * `arm: arm2-sdak-m1` beside a protocol hash whose manifest registers `paramSet: "CAK"` is exactly
 * the confusion the identity fix existed to remove.
 *
 * It is NOT part of `phase6Arm2ValuesManifest`, for the same reason arm 1's combined hash is not
 * part of its own values manifest: a manifest cannot contain its own hash, and a combined hash moves
 * on prose. So adding this leaves `PHASE6_ARM2_VALUES_SHA256` and the freeze commit untouched — the
 * freeze stands, and this costs no re-freeze.
 */
export function phase6Arm2ProtocolManifest(
  items: readonly Phase6FreezeItem[] = phase6Arm2FreezeList(),
): Record<string, unknown> {
  return {
    ...phase6Arm2ValuesManifest(items),
    prose: items.map((item) => ({ id: item.id, ...item.prose })),
  };
}

/**
 * Arm 2's combined hash. Reported in its artifacts so a reader can name the protocol that produced
 * them; it moves on prose, so it is pinned by revision history rather than treated as durable —
 * the lesson ADR 0034 paid for on arm 1.
 */
export const PHASE6_ARM2_PROTOCOL_SHA256 =
  "4be5c82d8ddb64947f459f40f1d941eb0e95d7548a6f6dd18067c65eda53076b";

/** Combined-hash revisions for arm 2, newest last; combined hashes move on prose by design. */
export const PHASE6_ARM2_PROTOCOL_REVISIONS: readonly { sha256: string; note: string }[] = [
  {
    sha256: "b09a932ec7345eddf838ee2de1c0ef4731212c625a1069e62193c06ae950fdec",
    note: "historical combined manifest cited by the 204-row arm-2 artifact",
  },
  {
    sha256: "785f7325f7042b17ed220a19cc404d4ad0a5023d3c64de412afab138835db6e1",
    note: "combined manifest after the 2026-08-01 logarithm-base justification correction",
  },
  {
    sha256: "6e405882ff46c8fb883ee11753e1fc5ecfc9f046e16350590115d55469099e81",
    note:
      "combined manifest after the 2026-08-01 source-fit, domain and coefficient-order " +
      "interpretation and invalid-linear-proxy correction; registered values are unchanged",
  },
  {
    sha256: "7b4b4c14e5d419e781224cfda36c2ed6b293d8c062014ff23a2e1dffa1507719",
    note:
      "combined manifest after the 2026-08-01 adversarial causal-scope and invalid-linear-row " +
      "correction; registered values are unchanged",
  },
  {
    sha256: "8c8db86582d1ced530b5cdbdaa0e924797c1aa14dc999d463f72e980db43ce14",
    note:
      "combined manifest after the candidate ADR 0040 inherited arm-1 numerical-probe " +
      "interpretation correction; registered values are unchanged and no historical artifact is upgraded",
  },
  {
    sha256: "cb88ee3020891867a170c20f62a6ce2cd72c1a4c248caef1899c90579e8e1c9b",
    note:
      "combined manifest after the candidate ADR 0040 source-reference-bracket/domain correction; " +
      "registered values are unchanged and no historical artifact is upgraded",
  },
  {
    sha256: "09f49f229c472cd47c4a100fcd340f7fd472d716eb734c9c3244b3a19928146a",
    note:
      "combined manifest after the candidate ADR 0040 parameter-table provenance correction; " +
      "registered values are unchanged and no historical artifact is upgraded",
  },
  {
    sha256: "fa8c61f182966ea3496763ba766a2911086299fb3ef07e576be2a4023f82d2a9",
    note:
      "combined manifest after the candidate ADR 0040 P3/P4 logarithm-base provenance " +
      "correction; registered values are unchanged and no historical artifact is upgraded",
  },
  {
    sha256: "21b16a7bf69b5015909fd381a6f7d2ab42ba5b8d343573c3e554bd4f1363261f",
    note:
      "combined manifest after the 2026-08-02 accepted ADR 0040 propagation correction labels " +
      "every live 42/90 or 42/78 field as a withdrawn/confounded historical proxy forecast; " +
      "registered values are unchanged and no historical artifact is upgraded",
  },
  {
    sha256: "4be5c82d8ddb64947f459f40f1d941eb0e95d7548a6f6dd18067c65eda53076b",
    note:
      "combined manifest after the 2026-08-02 ADR 0040 acceptance-audit metrology follow-up " +
      "separates exact atmosphere conversion from the P2 diffusivity anchor closure; registered " +
      "values are unchanged and no historical artifact is upgraded",
  },
];
