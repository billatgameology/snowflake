const CHECKS = Object.freeze({
  B1a: [
    "chk-b1a-apparatus-surface-forcing",
    "chk-b1a-current-monograph",
    "chk-b1a-development-label",
    "chk-b1a-operand-refusal",
    "chk-b1a-protocol-before-values",
    "chk-b1a-return-only",
    "chk-b1a-search-bounds",
    "chk-b1a-uncertainty-or-envelope",
  ],
  B1b: [
    "chk-b1b-asymmetric-transfer",
    "chk-b1b-evolving-geometry",
    "chk-b1b-local-forcing",
    "chk-b1b-matched-cross-pressure",
    "chk-b1b-no-implemented-transport-claim",
    "chk-b1b-operand-refusal",
    "chk-b1b-protocol-before-values",
    "chk-b1b-return-only",
    "chk-b1b-search-bounds",
    "chk-b1b-support-heat",
  ],
  B2: [
    "chk-b2-complete-method-operands",
    "chk-b2-controlled-velocity-dataset",
    "chk-b2-development-label",
    "chk-b2-operand-refusal",
    "chk-b2-protocol-before-values",
    "chk-b2-return-only",
    "chk-b2-reynolds-diagnostic-only",
    "chk-b2-search-bounds",
  ],
  B3: [
    "chk-b3-carrier-gas-audit",
    "chk-b3-currency",
    "chk-b3-one-factor-or-crossed-identification",
    "chk-b3-protocol-before-values",
    "chk-b3-return-only",
    "chk-b3-search-bounds",
    "chk-b3-temperature-conflict",
    "chk-b3-terminal-nonidentification",
    "chk-b3-two-reader-operator",
    "chk-b3-zhao-role-audit",
  ],
  B4: [
    "chk-b4-forcing-semantics",
    "chk-b4-no-mechanism-rank",
    "chk-b4-protocol-before-values",
    "chk-b4-return-only",
    "chk-b4-rival-fit-or-refusal",
    "chk-b4-same-lineage-limit",
    "chk-b4-search-bounds",
    "chk-b4-theory-methods-separate",
  ],
  B5: [
    "chk-b5-all-attempts-published",
    "chk-b5-calibration-operator-uncertainty",
    "chk-b5-media-feature-roster-frozen",
    "chk-b5-operand-refusal",
    "chk-b5-protocol-before-values",
    "chk-b5-return-only",
    "chk-b5-search-bounds",
    "chk-b5-trajectory-or-categorical-closure",
  ],
} as const);

export const phase10B1aCheckCaller = (): readonly string[] => CHECKS.B1a;
export const phase10B1bCheckCaller = (): readonly string[] => CHECKS.B1b;
export const phase10B2CheckCaller = (): readonly string[] => CHECKS.B2;
export const phase10B3CheckCaller = (): readonly string[] => CHECKS.B3;
export const phase10B4CheckCaller = (): readonly string[] => CHECKS.B4;
export const phase10B5CheckCaller = (): readonly string[] => CHECKS.B5;

export const phase10BAggregateCheckCaller = (): readonly string[] => Object.freeze([
  "chk-b-all-searches-terminal",
  "chk-b-all-six-terminal",
  "chk-b-development-evidence-only",
  "chk-b-no-efh-execution",
  "chk-b-no-provider-contact-purchase",
  "chk-b-report-rederived",
]);
