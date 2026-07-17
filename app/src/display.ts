// Operator-honest display semantics (V4-1).
//
// The two permanent surface operators expose UNRELATED state that must never be relabeled as
// each other (charter §1.5; AGENTS.md "the two permanent surface operators"):
//   GGThreshold        — diffusive vapor mass `d` and boundary mass `b`, phenomenological
//                        model units with no physical interpretation.
//   LibbrechtKinetics  — dimensionless supersaturation `sigma` (relative to ice) and the
//                        distinct dimensionless boundary fill `f`. f is NOT a reuse of G-G
//                        boundary mass b, and sigma is NOT d in different clothes.
//
// Every display snapshot carries a FieldSemantics tag; assertFieldSemanticsHonest rejects any
// operator/field-name combination that would show one operator's state under the other's
// label. Pure and environment-neutral so the honesty rules unit-test in node.

export type OperatorName = "GGThreshold" | "LibbrechtKinetics";

export interface FieldSemantics {
  readonly operator: OperatorName;
  /** Volumetric field identity: GG diffusive vapor mass d, LK supersaturation sigma. */
  readonly fieldName: "d" | "sigma";
  readonly fieldTitle: string;
  readonly fieldUnits: string;
  /** Surface-state identity: GG boundary mass b, LK boundary fill f. */
  readonly surfaceName: "b" | "f";
  readonly surfaceTitle: string;
  readonly surfaceUnits: string;
}

const GG_SEMANTICS: FieldSemantics = {
  operator: "GGThreshold",
  fieldName: "d",
  fieldTitle: "diffusive vapor mass d",
  fieldUnits: "model units (computed state, unvalidated)",
  surfaceName: "b",
  surfaceTitle: "boundary mass b",
  surfaceUnits: "model units (computed state, unvalidated)",
};

const LK_SEMANTICS: FieldSemantics = {
  operator: "LibbrechtKinetics",
  fieldName: "sigma",
  fieldTitle: "supersaturation sigma",
  fieldUnits: "dimensionless, relative to ice (computed state, unvalidated)",
  surfaceName: "f",
  surfaceTitle: "boundary fill f",
  surfaceUnits: "dimensionless fill fraction in [0, 1] (computed state, unvalidated)",
};

/** The honest semantics for an operator. Returned objects are shared and frozen. */
export function fieldSemanticsFor(operator: OperatorName): FieldSemantics {
  if (operator === "GGThreshold") return GG_SEMANTICS;
  if (operator === "LibbrechtKinetics") return LK_SEMANTICS;
  throw new Error(`unknown operator: ${String(operator)}`);
}

Object.freeze(GG_SEMANTICS);
Object.freeze(LK_SEMANTICS);

/**
 * Reject a semantics tag whose operator and field/surface names disagree — e.g. LK state
 * labeled as vapor mass d, or GG state labeled sigma/f. This is the V4-1 "without relabeling
 * one as the other" rule as an enforced check, not a convention.
 */
export function assertFieldSemanticsHonest(semantics: FieldSemantics): void {
  const expected = fieldSemanticsFor(semantics.operator);
  if (semantics.fieldName !== expected.fieldName) {
    throw new Error(
      `operator/field label mismatch: ${semantics.operator} state must display field ` +
        `"${expected.fieldName}", got "${semantics.fieldName}"`,
    );
  }
  if (semantics.surfaceName !== expected.surfaceName) {
    throw new Error(
      `operator/field label mismatch: ${semantics.operator} state must display surface ` +
        `"${expected.surfaceName}", got "${semantics.surfaceName}"`,
    );
  }
  if (
    semantics.fieldTitle !== expected.fieldTitle ||
    semantics.fieldUnits !== expected.fieldUnits ||
    semantics.surfaceTitle !== expected.surfaceTitle ||
    semantics.surfaceUnits !== expected.surfaceUnits
  ) {
    throw new Error(
      `operator/field label mismatch: ${semantics.operator} display labels drifted from the ` +
        `honest fixed wording`,
    );
  }
}
