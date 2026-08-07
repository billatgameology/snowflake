// Phase 6 ARM 3 — the matched no-dip ablation arm's frozen protocol (decision 0045 item 4).
//
// WHY THIS IS A SEPARATE MODULE AND NOT AN EDIT.
//
// Both prior arms' protocols are published evidence: the arm-1 and arm-2 204-row artifacts each
// name the hashes that produced them, and §3.2 prices any edit to a registered VALUE at a full
// re-sweep. So arm 3 gets its own freeze rather than a parameter added to either: nothing in
// `phase6-protocol.ts` or `phase6-arm2-protocol.ts` changes, arm 1's three registered hashes and
// arm 2's three stay bit-identical, and both historical artifacts stay verifiable against the
// commits they name. `runner/test/phase6-arm3.test.ts` asserts that, not this comment.
//
// THE DESIGN CONSTRAINT THAT MATTERS: decision 0045 item 4 registers arm 3 as identical to the
// EXECUTED arm-2 configuration in every registered respect except `paramSet`, so the three arms
// are same-protocol comparable. This module therefore does two things by construction rather than
// by promise. (a) It builds its freeze list by APPLYING NAMED OVERRIDES to arm 1's, exactly as
// arm 2 does, so every non-overridden row is the SAME OBJECT (`toBe`, reference identity) as
// arm 1's. (b) It adopts arm 2's scoring functions BY REFERENCE rather than duplicating them —
// arm 2 duplicated arm 1's scorer because the two RULES differed and isolation was the point;
// here the rule must NOT differ, and function identity makes "the matched pair is scored under
// one protocol" a checked property instead of a claim.
//
// CAUSAL SCOPE, stated before any point runs: only the matched M1 ↔ M1_NO_DIP_ABLATION pair can
// support an implementation-level statement about the implemented dip factors within this frozen
// solver configuration. It cannot establish physical SDAK causality or necessity in nature. The
// gated `ablationIdentity` block below registers that scope inside the values hash.

import {
  PHASE6_ARM2_BISTABLE_TEMPERATURES_C,
  phase6Arm2InHeadlineScope,
  phase6Arm2IsBistable,
  phase6Arm2ScoreHabit,
} from "./phase6-arm2-protocol.ts";
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
  type Phase6FreezeItem,
} from "./phase6-protocol.ts";

/**
 * The commit at which arm 3's protocol becomes final.
 *
 * TWO-COMMIT LANDING — THIS IS STAGE 1 OF 2. A commit cannot contain its own hash, so the
 * registration lands first carrying this literal pending marker, and the author fills in the real
 * 40-hex hash of that registration commit in the follow-up commit — the identical two-step arms 1
 * and 2 used. `phase6SweepPreflight` deliberately refuses any non-40-hex value here BY NAME, so
 * arm 3 cannot produce evidence until stage 2 lands.
 *
 * It lives INSIDE the gated values manifest for the same reason arm 2's does: a freeze commit
 * added after results exist would be a freeze commit chosen after seeing results.
 *
 * STAGE 2 must, in one commit that changes nothing else about this protocol:
 *   1. replace this string with the 40-hex hash of the stage-1 registration commit;
 *   2. recompute `PHASE6_ARM3_VALUES_SHA256` and `PHASE6_ARM3_PROTOCOL_SHA256` (the freeze commit
 *      sits inside both manifests) and update the single matching entry of each revision list in
 *      place — the stage-1 hashes gated no run, because preflight refused the arm throughout;
 *   3. update the literal hash pins in `runner/test/phase6-arm3.test.ts`.
 * `PHASE6_ARM3_JUSTIFICATION_SHA256` does not move: the justification manifest carries no commit.
 */
export const PHASE6_ARM3_FREEZE_COMMIT = "pending-stage-2-landing";

/** Arm 3's identity, recorded in its artifacts so an arm can never be mistaken for another. */
export const PHASE6_ARM3_ID = "arm3-no-dip-ablation" as const;

/** Arm 3's single registered switch away from arm 2 — the change the arm exists to make. */
export const PHASE6_ARM3_PARAM_SET = "M1_NO_DIP_ABLATION" as const;

/**
 * The manifest-level matched-pair identity, gated inside the values hash.
 *
 * This block REPLACES arm 2's five dip-specific keys (`m1BasalDipCentreC`, `m1PrismDipCentreC`,
 * `sdakAnchors`, `bistableTemperaturesC`, `sourcingTiers`) — a named, recorded schema deviation.
 * Those keys register dip centres, dip-anchor sourcing and dip-era references that this arm
 * removes; repeating them here would register values no arm-3 evidence path reads. What arm 3
 * actually evaluates is registered instead: the two broad-branch closed forms by their
 * `core/src/libbrecht.ts` export names, the A = 1 choice on both facets, and the claim that
 * scopes what the matched pair may ever be said to show.
 */
export const PHASE6_ARM3_ABLATION_IDENTITY = {
  sigma0Basal: "sigma0BasalM2Broad",
  sigma0Prism: "sigma0PrismM2Broad",
  aBasal: 1,
  aPrism: 1,
  matchedPairClaim:
    "the only implemented kinetic difference from M1 is the replacement of both registered dip " +
    "factors by 1 — the M2 broad-facet-branch closed forms evaluated under M1's registered " +
    "(Tm−T) ∈ [1, 50] °C domain guard. The matched M1-versus-M1_NO_DIP_ABLATION pair therefore " +
    "supports an implementation-level contrast about the implemented dip factors only, and never " +
    "establishes physical SDAK causality or necessity in nature",
} as const;

// ── Arm 3's scoring: arm 2's, by reference ───────────────────────────────────────────────────
//
// Decision 0045 item 4 registers the configurations as identical except `paramSet`, and the
// scoring rule is part of the configuration. These are the SAME FUNCTION OBJECTS as arm 2's, not
// copies: the matched pair cannot drift apart in how the bistable band, the headline scope, or
// any score is decided, because there is only one implementation to drift. The test asserts the
// identity with `toBe`. (Arm 2 deliberately did NOT share arm 1's scorer — but there the two
// rules differed, and the risk was a mistaken shared default. Here the rules must be equal.)

export const phase6Arm3ScoreHabit = phase6Arm2ScoreHabit;
export const phase6Arm3InHeadlineScope = phase6Arm2InHeadlineScope;
export const phase6Arm3IsBistable = phase6Arm2IsBistable;

// ── The freeze list, as named differences from arm 1 ─────────────────────────────────────────

/**
 * Freeze rows whose PROSE differs in arm 3, by id. Every other row is reused by reference.
 *
 * The same three rows arm 2 overrides, and for the same structural reason — each arm-1 text would
 * be false as written for this arm:
 *   `param-set`               — the change the arm exists to make.
 *   `parameter-interpolation` — the broad branch is a closed form, not an interpolation between
 *                               digitized anchors.
 *   `parameter-table`         — arm 3 transcribes printed broad-branch algebra and consumes
 *                               neither arm 1's digitized CAK anchors nor arm 2's logarithm-base
 *                               resolution.
 */
export const PHASE6_ARM3_ROW_OVERRIDES: Readonly<Record<string, Phase6FreezeItem["prose"]>> = {
  "param-set": {
    requirement:
      "the parameter set selecting which attachment kinetics every run applies",
    value:
      "M1_NO_DIP_ABLATION — σ₀,basal and σ₀,prism from the M2 broad-facet-branch closed forms " +
      "(the printed M1 prefactors of 2306.13087v1 p6 with both dip factors replaced by 1), with " +
      "A_basal = A_prism = 1 on every facet and at every condition, under M1's registered " +
      "(Tm−T) ∈ [1, 50] °C domain guard",
    source:
      "Decision 0045 item 4: the matched no-dip arm, identical to the executed arm-2 " +
      "configuration in every registered respect except this parameter set, so the three arms " +
      "are same-protocol comparable. The broad branch is a matched INPUT, not M2 proper: it " +
      "implements none of M2's width feedback, and the project has not established that every " +
      "simulated facet satisfies any width assumption. A_basal = A_prism = 1 is inherited from " +
      "the source model's explicit simplifying choice, unchanged from arm 2 so the pair differs " +
      "in the dip factors alone. A failure or an agreement here cannot by itself identify which " +
      "model assumption is responsible",
  },
  "parameter-interpolation": {
    requirement: "how σ₀(T) is obtained between registered temperatures",
    value:
      "no interpolation — σ₀,basal(T) and σ₀,prism(T) are evaluated directly from the printed " +
      "broad-branch prefactors at every temperature; both dip factors are identically 1, so no " +
      "logarithm-base choice enters the evaluation; evaluation is limited to (Tm−T) ∈ [1, 50] " +
      "°C, the domain displayed for M1 in 2306.13087v1 Figure 1 and shared by this arm on purpose",
    source:
      "Decision 0045 item 4 and WP2 reconnaissance sub-unit A (core/src/libbrecht.ts, " +
      "sigma0BasalM2Broad and sigma0PrismM2Broad). Sharing M1's registered domain guard means " +
      "removing the dip factors does not silently add extrapolated temperature support. Arm 2's " +
      "registered Figure-1-width-supported base-10 logarithm resolution is vacuous for this arm: " +
      "the logarithm appears only inside the dip factors this arm removes",
  },
  "parameter-table": {
    requirement: "the provenance of arm 3's attachment-kinetics inputs",
    value:
      "arXiv:2306.13087v1 p6 printed M1 algebra with both SDAK dip factors removed — the M2 " +
      "broad-facet branch, 0.02·T^1.75 + 0.3 and 0.015·T^2 + 0.02·T^0.6 in percent, transcribed " +
      "in core/src/libbrecht.ts — while arm 3 consumes neither arm 1's digitized CAK anchors nor " +
      "any logarithm-base transcription choice",
    source:
      "Decision 0045 item 4. The prefactors are transcribed from printed algebra rather than " +
      "digitized, so the ±25% CAK-anchor digitization band does not apply, and the unstated " +
      "logarithm base arm 2 had to resolve as a P4 choice never enters. The broad branch keeps " +
      "the source lineage's P3 provenance: it is a model prescription, not an independent " +
      "measurement, so any agreement or disagreement it produces is scoped to the implemented " +
      "closed forms and labelled as such wherever it appears (ADR 0005)",
  },
};

/**
 * Rows arm 3 registers that arm 1 has no equivalent of. Both must be frozen BEFORE the sweep:
 * the first fixes how the two-habit band is scored, the second fixes what the matched pair may
 * ever be claimed to show — each could otherwise be settled after seeing results.
 *
 * Arm 2's other two added rows are deliberately NOT mirrored: `input-sourcing-tiers` brackets the
 * four same-lineage SDAK numeric references, which describe the dips this arm removes, and
 * `registered-expectation` records arm 2's withdrawn historical forecast — decision 0045
 * registers no forecast for arm 3, and inventing one here would be a new pre-registration, not a
 * mirror.
 */
export const PHASE6_ARM3_ADDED_ROWS: readonly Phase6FreezeItem[] = [
  {
    id: "bistable-band",
    group: "comparison-design",
    status: "registered",
    prose: {
      requirement:
        "how temperatures at which the REFERENCE names two habits are scored",
      value:
        `T ∈ {${PHASE6_ARM2_BISTABLE_TEMPERATURES_C.join(", ")}} °C accepts {plate, column} and ` +
        "is EXCLUDED from the headline, reported with its own count; neutral still scores " +
        "disagree — arm 2's registered rule, adopted unchanged",
      source:
        "ADR 0036 pre-registration 2, adopted via decision 0045 item 4: arm 3 is identical to " +
        "the executed arm-2 configuration in every registered respect except the parameter set, " +
        "and the scoring rule is part of that configuration. This module reuses arm 2's scoring " +
        "functions by reference, so the two arms of the matched pair cannot drift apart in how " +
        "this band is scored. The capability limit is inherited too: a single-trajectory run at " +
        "fixed seed and constant σ∞ cannot exhibit bistability, so the rule avoids scoring " +
        "against the source's two-valuedness rather than testing it",
    },
  },
  {
    id: "ablation-identity",
    group: "physics-inputs",
    status: "registered",
    prose: {
      requirement:
        "the manifest-level matched-pair identity decision 0045 requires this registration to carry",
      value:
        "gated ablationIdentity block: sigma0BasalM2Broad and sigma0PrismM2Broad by export name, " +
        "A_basal = A_prism = 1, and a matchedPairClaim scoping the pair to an " +
        "implemented-dip-factor contrast",
      source:
        "Decision 0045 item 4 and core/src/libbrecht.ts. The block replaces arm 2's five " +
        "dip-specific manifest keys (m1BasalDipCentreC, m1PrismDipCentreC, sdakAnchors, " +
        "bistableTemperaturesC, sourcingTiers) — a named, recorded schema deviation: those keys " +
        "register dip centres and dip-anchor sourcing this arm removes, and repeating them would " +
        "register values no arm-3 evidence path reads. The bistable temperatures stay registered " +
        "through the bistable-band freeze row above and through arm 2's own gated manifest, " +
        "whose scoring this arm adopts by reference. The claim is inside the VALUES hash so it " +
        "cannot be weakened after results exist without invalidating the run",
    },
  },
];

/**
 * Arm 3's freeze list: arm 1's rows, with the three named overrides applied and the two new rows
 * appended.
 *
 * Rows that are not overridden are returned BY REFERENCE, so `phase6Arm3FreezeList().find(...)`
 * and `PHASE6_FREEZE_LIST.find(...)` return the same object for every shared row — the identical
 * construction to `phase6Arm2FreezeList`, and what makes "the arms differ in exactly these rows"
 * checkable with `toBe` rather than argued in prose.
 */
export function phase6Arm3FreezeList(): readonly Phase6FreezeItem[] {
  const overridden = PHASE6_FREEZE_LIST.map((item) => {
    const prose = PHASE6_ARM3_ROW_OVERRIDES[item.id];
    return prose === undefined ? item : { ...item, prose };
  });
  return [...overridden, ...PHASE6_ARM3_ADDED_ROWS];
}

// ── Arm 3's manifests and hashes (ADR 0033's two-hash scheme, applied to the new arm) ─────────
//
// Same split as arms 1 and 2: the VALUES hash gates and costs a re-sweep if edited; the
// JUSTIFICATION hash is reported and costs nothing, because no evidence-producing path reads
// prose. Every shared value is read from arm 1's exported constant rather than re-typed here —
// the arms being swept over the SAME grid is the property that makes them comparable at all.

/** Everything an arm-3 evidence path reads. Gated by preflight. */
export function phase6Arm3ValuesManifest(
  items: readonly Phase6FreezeItem[] = phase6Arm3FreezeList(),
): Record<string, unknown> {
  const pending = items.filter((item) => item.status === "pending");
  if (pending.length > 0) {
    throw new Error(
      `Phase 6 arm 3 is not frozen: ${pending.length} item(s) pending — ` +
        `${pending.map((item) => item.id).join(", ")}`,
    );
  }
  return {
    arm: PHASE6_ARM3_ID,
    paramSet: PHASE6_ARM3_PARAM_SET,
    // Shared with arms 1 and 2 BY REFERENCE — the controlled part of the comparison.
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
    // Arm 3's own registered value — the ONE block that replaces arm 2's five dip-specific keys
    // (a named, recorded schema deviation; see PHASE6_ARM3_ABLATION_IDENTITY).
    ablationIdentity: PHASE6_ARM3_ABLATION_IDENTITY,
    freezeCommit: PHASE6_ARM3_FREEZE_COMMIT,
    freezeRows: items.map((item) => ({ id: item.id, group: item.group, status: item.status })),
  };
}

/** Arm 3's prose. Reported, never gated; a correction here costs no re-sweep. */
export function phase6Arm3JustificationManifest(
  items: readonly Phase6FreezeItem[] = phase6Arm3FreezeList(),
): Record<string, unknown> {
  return { arm: PHASE6_ARM3_ID, prose: items.map((item) => ({ id: item.id, ...item.prose })) };
}

/**
 * Arm 3's registered VALUES hash — the gate. Editing any registered arm-3 value moves this and,
 * under charter §3.2 as amended by ADR 0033, makes the earlier sweep inadmissible for a
 * replacement gate and requires its full replacement rerun.
 *
 * STAGE-1 VALUE: the actual canonical hash of the manifest as built with the pending
 * freeze-commit string, so the working-tree suite is green before the registration commit lands.
 * STAGE 2 RECOMPUTES IT — the 40-hex freeze commit sits inside the manifest, so landing it moves
 * this hash — and updates the single values-revision entry and the test pin in the same commit.
 * The stage-1 hash gates nothing: preflight refuses the arm by name until the commit is 40-hex.
 */
export const PHASE6_ARM3_VALUES_SHA256 =
  "399f264e2ccd71cbb622fe23000b098e63f106d5a99253ec9c43abc5e3069f3b";

/** Arm 3's justification hash — reported, never gated. Stable across the stage-2 landing. */
export const PHASE6_ARM3_JUSTIFICATION_SHA256 =
  "7d01d251c98d7663b215daeb47bb39baec1f070e4c7edd7eac86f4f9d63803a2";

/** Justification-hash revisions for arm 3, newest last; append on any prose correction. */
export const PHASE6_ARM3_JUSTIFICATION_REVISIONS: readonly {
  sha256: string;
  note: string;
}[] = [
  {
    sha256: "7d01d251c98d7663b215daeb47bb39baec1f070e4c7edd7eac86f4f9d63803a2",
    note:
      "arm-3 registration, decision 0045 item 4: three overridden rows, bistable-band adopted " +
      "from arm 2, and the ablation-identity matched-pair scope. Registered BEFORE any arm-3 " +
      "point ran",
  },
];

/** Values-hash revisions for arm 3, newest last. Stage 2 updates the single entry in place. */
export const PHASE6_ARM3_VALUES_REVISIONS: readonly { sha256: string; note: string }[] = [
  {
    sha256: "399f264e2ccd71cbb622fe23000b098e63f106d5a99253ec9c43abc5e3069f3b",
    note:
      "arm-3 registration, decision 0045 item 4. 27 rows: arm 1's 25 with param-set, " +
      "parameter-interpolation and parameter-table overridden, plus bistable-band and " +
      "ablation-identity. STAGE 1 of the two-commit landing: hashed with freezeCommit = " +
      "\"pending-stage-2-landing\"; stage 2 lands the 40-hex freeze commit and recomputes this " +
      "entry in place — the stage-1 hash gated no run, because preflight refuses a non-40-hex " +
      "freeze commit by name. Registered BEFORE any arm-3 point ran",
  },
];

/**
 * Arm 3's COMBINED manifest — values and prose in one object, the same construction arms 1 and 2
 * use. Reported in artifacts so a reader can name the protocol that produced them; it moves on
 * prose, so it is pinned by revision history rather than treated as durable.
 */
export function phase6Arm3ProtocolManifest(
  items: readonly Phase6FreezeItem[] = phase6Arm3FreezeList(),
): Record<string, unknown> {
  return {
    ...phase6Arm3ValuesManifest(items),
    prose: items.map((item) => ({ id: item.id, ...item.prose })),
  };
}

/**
 * Arm 3's combined hash. STAGE-1 VALUE, recomputed by stage 2 alongside the values hash (the
 * freeze commit sits inside this manifest too).
 */
export const PHASE6_ARM3_PROTOCOL_SHA256 =
  "d9d02f32be20fc500aeffd74aaf05ecce85e2027cf0e90aa6e843fc87594ec90";

/** Combined-hash revisions for arm 3, newest last; combined hashes move on prose by design. */
export const PHASE6_ARM3_PROTOCOL_REVISIONS: readonly { sha256: string; note: string }[] = [
  {
    sha256: "d9d02f32be20fc500aeffd74aaf05ecce85e2027cf0e90aa6e843fc87594ec90",
    note:
      "arm-3 registration combined manifest, stage 1 of the two-commit landing (freezeCommit " +
      "still the pending marker); stage 2 recomputes this entry in place with the 40-hex commit",
  },
];
