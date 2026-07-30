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
// possible, because everything the two arms share is what makes their comparison a controlled one.
// A second arm that quietly re-tuned the grid, the measurement size, or the thresholds could
// "outperform" arm 1 without saying anything about SDAK.
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

/** The parameter set arm 2 runs. The single change the whole arm exists to test. */
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
 * Every prose-stated measurement of the NARROW-FACET (SDAK) nucleation parameters in the corpus —
 * the quantities M1's dipped curves ARE, and so the only numbers arm 2's inputs can be checked
 * against.
 *
 * CORRECTED by the arm-2 freeze review of 2026-07-30, in BOTH directions. My first version claimed a
 * "prose-anchored" tier over −2…−15 °C on the ground that prose-stated numbers existed for both dips
 * throughout it; in fact the warmest anchor of any kind is −5 °C, so −2…−4 is warmer than every
 * anchor. The review's counter-claim that −11…−15 was anchor-free was ALSO wrong: the basal dip has
 * an anchor at −14 °C. Re-derived from `research/libbrecht-papers-extracts.md` rather than from
 * either account.
 *
 * M1 against all four, computed:
 *
 *     T     facet   measured   M1        ratio
 *     −5    basal   0.1%       0.0987%   0.987
 *     −10   prism   0.85%      0.5916%   0.696
 *     −14   basal   2.33%      2.2636%   0.972
 *     −25   prism   6.6%       6.0409%   0.915
 *
 * The ASYMMETRY is the finding: the basal dip is well anchored (2.8% worst) and the prism dip is
 * not (30% low at −10 °C, low at both). Arm 2's predicted gain is almost entirely cold plates, which
 * the PRISM dip drives — so the arm's strongest predicted effect rides on its weaker-anchored input.
 * Registered before the run rather than discovered in the discussion afterwards.
 */
export const PHASE6_ARM2_SDAK_ANCHORS = [
  { tempC: -5, facet: "basal", measuredPercent: 0.1, source: "1912.03230v1 (CM6)" },
  { tempC: -10, facet: "prism", measuredPercent: 0.85, source: "2009.08404v2 p14 (CM8)" },
  { tempC: -14, facet: "basal", measuredPercent: 2.33, source: "2009.08404v2 (CM8)" },
  { tempC: -25, facet: "prism", measuredPercent: 6.6, source: "2009.08404v2 p13 (CM8)" },
] as const;

/**
 * How well-sourced arm 2's inputs are at each temperature, published WITH the headline rather than
 * beneath it (ADR 0036 pre-registration 3).
 *
 * The criterion is BRACKETING by the anchors above — a fact about the corpus rather than a
 * judgement: −5 °C is the warmest prose-stated SDAK value anywhere, −25 °C the coldest.
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

/** The sourcing tier a temperature falls in. Every registered temperature has exactly one. */
export function phase6Arm2SourcingTier(tempC: number): string {
  for (const t of PHASE6_ARM2_SOURCING_TIERS) {
    if (tempC <= t.warmestC && tempC >= t.coldestC) return t.tier;
  }
  throw new Error(`no arm-2 sourcing tier contains T = ${String(tempC)} C`);
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
 *   `parameter-table`         — arm 2's physics does not come from the digitized table at all.
 */
export const PHASE6_ARM2_ROW_OVERRIDES: Readonly<Record<string, Phase6FreezeItem["prose"]>> = {
  "param-set": {
    requirement:
      "the parameter set selecting which attachment kinetics every run applies",
    value:
      "M1 — σ₀,basal and σ₀,prism from the SDAK-dipped closed forms of 2306.13087v1 p6, with " +
      "A_basal = A_prism = 1 on every facet and at every condition",
    source:
      "ADR 0036. M1 is chosen over the width-dependent M2 because SDAK's controlling facet width " +
      "is ~50 nm (2009.08404v2 p6) against Δx = 350 nm — 7× below one cell — so M2 would need a " +
      "sub-grid closure with a strength parameter no source prints, and agreement bought by " +
      "tuning it would measure the closure rather than the hypothesis. M1 needs no width query: " +
      "it assumes every facet is narrow, which its own paper licenses on the ground that the " +
      "Edge-Sharpening Instability 'is quite efficient in air, quickly turning broad facets into " +
      "narrow facets during growth' (p7). A = 1 is that paper's explicit choice ('To keep M1 " +
      "relatively simple, we chose to set A = 1 in Equation 3 for all growth conditions'), and it " +
      "is load-bearing: it makes the habit ordering provably independent of σ_surf. REGISTERED " +
      "LIMITATION — the all-facets-narrow assumption is scoped by its author to fast-growing " +
      "morphologies, so the f = 0.10 rows are where it is least justified; a failure concentrated " +
      "at low f is that assumption failing, not the SDAK hypothesis failing",
  },
  "parameter-interpolation": {
    requirement: "how σ₀(T) is obtained between registered temperatures",
    value:
      "no interpolation — σ₀,basal(T) and σ₀,prism(T) are evaluated directly from the printed " +
      "closed forms at every temperature; log is base 10; extrapolation banned outside " +
      "(Tm−T) ∈ [1, 50] °C, the same domain the digitized set refuses outside",
    source:
      "ADR 0036. A closed form has no interpolation error, which removes arm 1's leave-one-out " +
      "10.7%/9.0% systematic entirely — but it also has no natural domain, so adopting it as " +
      "printed would have silently dropped the extrapolation ban the digitized set enforces. " +
      "Bounded to the anchors' own domain so no new number is registered. The base-10 reading is " +
      "not stated in any paper: it is established by the dip minima landing at the 4.5 °C and " +
      "14.4 °C the prose names, where natural log puts them at 3.08 °C and 8.07 °C and yields " +
      "five habit transitions instead of three",
  },
  "parameter-table": {
    requirement: "the provenance of arm 2's attachment-kinetics inputs",
    value:
      "arXiv:2306.13087v1 p6, transcribed from printed equations — NOT docs/libbrecht-parameters.md, " +
      "whose digitized anchors arm 2 does not read",
    source:
      "ADR 0036. Transcription from a printed closed form rather than digitization from a figure, " +
      "so the ±25% digitization band does not apply and no re-digitization can move these values. " +
      "Provenance is nonetheless class P3 and NOT improved by that: the dip CENTRES were chosen by " +
      "the author to impose agreement with the Nakaya diagram (charter §2.5), so any agreement " +
      "arm 2 obtains is in-sample reproduction and is labelled as such wherever it appears (ADR " +
      "0005). The corpus states only TWO values of the prism dip numerically — 0.85% at −10 °C " +
      "and 6.6% at −25 °C (2009.08404v2 p14, p13) — and the closed form runs low against both, by " +
      "30% and 8.5%",
  },
};

/**
 * Rows arm 2 registers that arm 1 has no equivalent of. Both come from ADR 0036's pre-registrations
 * and both must be frozen BEFORE the sweep, because both could otherwise be settled after seeing
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
        "only: the registered prediction's numerator is 42 either way. CAPABILITY LIMIT: arm 2 " +
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
        PHASE6_ARM2_SOURCING_TIERS.map((t) => `${t.warmestC}…${t.coldestC} °C ${t.tier}`).join("; ") +
        "; anchors " +
        PHASE6_ARM2_SDAK_ANCHORS.map((a) => `${a.tempC} °C ${a.facet} ${a.measuredPercent}%`).join(", "),
      source:
        "ADR 0036 pre-registration 3. The prism dip is arm 2's most consequential input — 0.055 of " +
        "the broad-facet value at −15 °C, still 0.635 at −25 °C, 0.920 at −35 °C — and the corpus " +
        "states only two of its values numerically. Ten of the 34 registered temperatures lie " +
        "below every anchor. M1's third predicted transition (−24/−25 °C) lands exactly ON the " +
        "single cold anchor rather than beyond it, so it is anchored at one measured point and is " +
        "the weakest of the three predictions; registered as such so a hit there is not over-read " +
        "and a miss is not reported as a refutation of SDAK",
    },
  },
  {
    id: "registered-expectation",
    group: "comparison-design",
    status: "registered",
    prose: {
      requirement:
        "the result arm 2 is expected to produce, registered before it runs",
      value:
        "headline 42/90 under arm 1's UNMODIFIED scoring (42/78 under the bistable-band rule); " +
        "per regime plates-warm 4/6, columns 0/12 all neutral, plates-cold 38/60; range 42–66 " +
        "across two defensible fit forms",
      source:
        "ADR 0036 Part 2, derived by fitting arm 1's own 204 measured aspect ratios against the " +
        "attachment anisotropy its kinetics imply (ln AR = −0.2659 + 0.5119·ln r, R² = 0.511, " +
        "back-check 173/204) and applying that transfer function to M1 at the same points. Arm 1 " +
        "measured 3/90. The sharpest claim is that SDAK as M1 still does NOT rescue the column " +
        "regime: 0 of 12, all neutral, at −7 and −8 °C where M1's own facet contrast is 0.673 and " +
        "0.976. STATED WEAKNESS: 44 of 204 points extrapolate beyond arm 1's fitted anisotropy " +
        "range and they are concentrated at −10…−23 °C, which is precisely the plates-cold regime " +
        "supplying the entire predicted gain — the strongest part of the forecast is the least " +
        "supported. The 0D sense agreement (15/15 temperatures) is a TRANSCRIPTION CHECK and not " +
        "evidence: the dip centres were chosen to impose it",
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
 * under charter §3.2 as amended by ADR 0033, invalidates arm-2 sweep results.
 *
 * Registered at the arm-2 freeze, before any arm-2 point ran.
 */
export const PHASE6_ARM2_VALUES_SHA256 =
  "13e678d5eec467a391958a18c71c8d170900d6efd0d5c23bb4362d863b9acd76";

/** Arm 2's justification hash — reported, never gated. Prose corrections cost no re-sweep. */
export const PHASE6_ARM2_JUSTIFICATION_SHA256 =
  "1b7faeb85fb9095931ef9294d65c619723ac389de24daddd8d9c173b833d00e8";

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
  "b09a932ec7345eddf838ee2de1c0ef4731212c625a1069e62193c06ae950fdec";
