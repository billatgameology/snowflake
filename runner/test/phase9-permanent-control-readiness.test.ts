import { deepStrictEqual } from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import {
  evaluatePhase9PermanentControlReadiness,
  type Phase9PermanentControlReadinessInputs,
} from "../src/phase9-permanent-control-readiness.ts";

const PATHS = {
  shelfFreezeBytes: "evidence/phase9-source-overlay-v1/shelf-freeze.json",
  adapterRegistryBytes: "research/phase9-adapter-registry-v1.jsonl",
  successorTargetBookBytes: "evidence/phase8b-benchmark-final-v1/successor-target-book.jsonl",
  ggMachinerySpecBytes: "docs/gg-machinery.md",
  attachmentKineticsSpecBytes: "docs/attachment-kinetics.md",
  ggSolverSourceBytes: "solver-cpu/src/gg-solver.ts",
  lkSolverSourceBytes: "solver-cpu/src/lk-solver.ts",
} as const;

const EXPECTED_PROTOCOL = {
  schema: "phase9-permanent-control-readiness-protocol-v1",
  protocolId: "phase9-s2-permanent-control-readiness-v1",
  state: {
    role: "availability-and-refusal-foundation-only",
    developmentOnly: true,
    threeDimensionalSolverRunsAuthorized: 0,
    quantitativeScoresAuthorized: 0,
    physicalPromotionEligible: false,
    grantsValidationClaim: false,
  },
  question: "Which frozen S1 purposes are representable by either permanent control without inventing physical mappings, and what can be run now without a three-dimensional solver?",
  inputs: {
    shelfFreeze: {
      path: "evidence/phase9-source-overlay-v1/shelf-freeze.json",
      byteLength: 63_975,
      sha256: "b0bbab2e01eca61dfb2b807bda3614aaf803e5fd0457f2df02aa3e4b8c5d1a06",
    },
    adapterRegistry: {
      path: "research/phase9-adapter-registry-v1.jsonl",
      byteLength: 48_946,
      sha256: "498e85471766294d812b3ef9d747381e92eb476e8a9b40a3f34f855b53e46337",
    },
    successorTargetBook: {
      path: "evidence/phase8b-benchmark-final-v1/successor-target-book.jsonl",
      byteLength: 36_094,
      sha256: "c54b89683eea1f064bd8e81d6e9e06b3b9bbc6c022168b981cbfa71e5fc3cdd3",
    },
    ggMachinerySpec: {
      path: "docs/gg-machinery.md",
      byteLength: 24_718,
      sha256: "9d7f64f92c986e036830fd4f2850a4c87a11668d01d14e5f63a666995d5c9943",
    },
    attachmentKineticsSpec: {
      path: "docs/attachment-kinetics.md",
      byteLength: 56_814,
      sha256: "e245a7355aef6926a0228e69d4dedfc9c68ae311d4d04a210cace33bdf1e1900",
    },
    ggSolver: {
      path: "solver-cpu/src/gg-solver.ts",
      byteLength: 35_382,
      sha256: "11e8b128ce0bdbe41bf564b4c92a619bc1fab06e87ac30f74f93cb67b36fdef4",
    },
    lkSolver: {
      path: "solver-cpu/src/lk-solver.ts",
      byteLength: 91_632,
      sha256: "0719b820182d9f8edb954a6d17044f72da02084b6a7b5df58a4b9cb405976062",
    },
  },
  implementation: {
    model: {
      path: "runner/src/phase9-permanent-control-readiness.ts",
      byteLength: 10_916,
      sha256: "16873d575898b05de93b189940f05997421afc9af9717ffd5cc2c285fd4b5dea",
    },
  },
  censusContract: {
    selectionCount: 51,
    requestedPurposeCount: 112,
    adapterCompatibleWithLimitation: 51,
    ineligible: 41,
    sourceBlocked: 20,
  },
  controlContract: {
    GGThreshold: "Refuse all physical scores: ticks have no physical-time meaning; fields and thresholds have no physical condition, size, mass, normal-velocity, support, geometry, or ensemble mapping.",
    LibbrechtKinetics: "Refuse all current scores: source support, substrate, initial geometry, ensemble, gas species, ventilation, free-fall, or planar surface-forcing mappings remain absent; pressure input is air-diffusivity scaling, not those missing protocols.",
    boundary: "Maintained-shell LK runs require both residual and divergence convergence; reflecting LK is diagnostic-only. GG reflecting alone carries its mass invariant; no far-field condition is compared silently.",
    interpretiveRows: "The five interpretive rows are non-scoring guardrails, not solver targets.",
  },
  precommittedOutcome: {
    controlCompatibleSelectionCount: 0,
    solverRunsAuthorized: 0,
    quantitativeScoresProduced: 0,
    physicalPromotions: 0,
    validationClaimsGranted: 0,
    hostReleaseAloneWouldAuthorize: false,
  },
  limits: [
    "This is a source-derived availability/refusal vector, not a mismatch score.",
    "No three-dimensional solver, NAS row body, model output, fit, interpolation, promotion, or validation gate is executed.",
    "A later runnable comparison requires a separately frozen source-to-control mapping and the released host; host release alone does not repair protocol mismatch.",
    "The S2-CONTROLS shelf remains source-blocked and pending on four incomplete Nakaya 1957 acquisition attempts.",
  ],
} as const;

type MutableJson = null | boolean | number | string | MutableJson[] |
  { [key: string]: MutableJson };
type MutableJsonObject = { [key: string]: MutableJson };

function validateProtocolSemantics(candidate: unknown): void {
  try {
    deepStrictEqual(candidate, EXPECTED_PROTOCOL);
  } catch {
    throw new Error("S2 readiness protocol semantic validator refused changed semantics");
  }
}

function protocolDraft(): MutableJsonObject {
  return structuredClone(EXPECTED_PROTOCOL) as unknown as MutableJsonObject;
}

function objectField(value: MutableJsonObject, key: string): MutableJsonObject {
  const field = value[key];
  if (field === null || Array.isArray(field) || typeof field !== "object") {
    throw new Error(`${key} is not an object`);
  }
  return field;
}

function arrayField(value: MutableJsonObject, key: string): MutableJson[] {
  const field = value[key];
  if (!Array.isArray(field)) throw new Error(`${key} is not an array`);
  return field;
}

function inputs(): Phase9PermanentControlReadinessInputs {
  return Object.fromEntries(Object.entries(PATHS).map(([name, path]) =>
    [name, new Uint8Array(readFileSync(path))])) as unknown as Phase9PermanentControlReadinessInputs;
}

function fileIdentity(identity: { readonly path: string; readonly byteLength: number; readonly sha256: string }): void {
  const bytes = readFileSync(identity.path);
  expect(bytes.byteLength, identity.path).toBe(identity.byteLength);
  expect(createHash("sha256").update(bytes).digest("hex"), identity.path).toBe(identity.sha256);
}

describe("Phase 9 S2 permanent-control readiness", () => {
  it("derives the exact 51-row census and refuses both controls without running or scoring", () => {
    const result = evaluatePhase9PermanentControlReadiness(inputs());
    expect(result.summary).toEqual({
      selectionCount: 51,
      requestedPurposeCount: 112,
      controlCompatibleSelectionCount: 0,
      solverRunsAuthorized: 0,
      quantitativeScoresProduced: 0,
      physicalPromotions: 0,
      validationClaimsGranted: 0,
      hostReleaseAloneWouldAuthorize: false,
    });
    expect(result.purposeCounts).toEqual({
      adapterCompatibleWithLimitation: 51, ineligible: 41, sourceBlocked: 20,
    });
    expect(result.adapterCensus).toHaveLength(51);
    expect(result.s2SourceState).toEqual({
      status: "source-blocked-pending",
      blockerIds: [
        "P9B-PARTIAL-NAKAYA-01", "P9B-PARTIAL-NAKAYA-02",
        "P9B-PARTIAL-NAKAYA-03", "P9B-PARTIAL-NAKAYA-04",
      ],
      completeControlSourceSha256: [
        "56a1fe58167674455d776d63c04ddde5203c3776c168f44fd092b7cedf0b6d49",
        "5dbaf113df742de6c24e507a7961bfd50178d91481437cfd1625f6f5adddceb1",
      ],
    });
    expect(result.controls.GGThreshold).toMatchObject({
      availability: "globally-refused-no-protocol-matched-score",
      clock: "dimensionless-tick-no-physical-time",
    });
    expect(result.controls.LibbrechtKinetics).toMatchObject({
      availability: "globally-refused-no-protocol-matched-score",
      clock: "physical-interface-seconds",
      boundaryLimit:
        "maintained-shell-runs-require-residual-and-divergence-reflecting-is-diagnostic-only",
    });
    expect(result.adapterCensus[0]?.selectionId).toBe("P8B-P0-10C734F0C6C31B5904B10BE7");
    expect(result.adapterCensus.at(-1)?.selectionId).toBe("P8B-P2-PK20-HOMO-DENOM");
  });

  it("rejects shifted frozen inputs instead of accepting caller-attested availability", () => {
    for (const field of Object.keys(PATHS) as (keyof Phase9PermanentControlReadinessInputs)[]) {
      const changed = inputs();
      const bytes = changed[field].slice();
      bytes[0] = (bytes[0] ?? 0) ^ 1;
      expect(() => evaluatePhase9PermanentControlReadiness({ ...changed, [field]: bytes }), field)
        .toThrow(/identity/u);
    }
  });

  it("binds the bounded protocol and every named input and implementation artifact", () => {
    const protocol = JSON.parse(readFileSync(
      "research/phase9-permanent-control-readiness-protocol-v1.json", "utf8")) as unknown;
    validateProtocolSemantics(protocol);
    Object.values(EXPECTED_PROTOCOL.inputs).forEach(fileIdentity);
    Object.values(EXPECTED_PROTOCOL.implementation).forEach(fileIdentity);
  });

  it("rejects named semantic mutations even when the edited protocol remains coherent JSON", () => {
    const mutations: readonly {
      readonly name: string;
      readonly mutate: (value: MutableJsonObject) => void;
    }[] = [
      {
        name: "score wording",
        mutate: (value) => {
          objectField(value, "controlContract").GGThreshold =
            "Permit physical scores after the host is released.";
        },
      },
      {
        name: "validation wording",
        mutate: (value) => {
          arrayField(value, "limits")[1] =
            "A three-dimensional solver and validation gate are executed.";
        },
      },
      {
        name: "question",
        mutate: (value) => { value.question = "Which permanent control validates the sources?"; },
      },
      {
        name: "limit",
        mutate: (value) => {
          arrayField(value, "limits")[3] = "The S2-CONTROLS shelf is complete.";
        },
      },
      {
        name: "renamed input key",
        mutate: (value) => {
          const inputRows = objectField(value, "inputs");
          inputRows.shelf = inputRows.shelfFreeze ?? null;
          delete inputRows.shelfFreeze;
        },
      },
      {
        name: "extra input key",
        mutate: (value) => {
          objectField(value, "inputs").callerAttestation = {
            path: "attested.json", byteLength: 0, sha256: "0".repeat(64),
          };
        },
      },
      {
        name: "score claim flag",
        mutate: (value) => {
          objectField(value, "state").quantitativeScoresAuthorized = 1;
        },
      },
      {
        name: "promotion claim flag",
        mutate: (value) => {
          objectField(value, "state").physicalPromotionEligible = true;
        },
      },
      {
        name: "validation claim flag",
        mutate: (value) => {
          objectField(value, "state").grantsValidationClaim = true;
        },
      },
      {
        name: "outcome claim flag",
        mutate: (value) => {
          objectField(value, "precommittedOutcome").validationClaimsGranted = 1;
        },
      },
    ];
    for (const mutation of mutations) {
      const changed = protocolDraft();
      mutation.mutate(changed);
      expect(() => validateProtocolSemantics(changed), mutation.name).toThrow(
        /semantic validator refused/u,
      );
    }
  });
});
