import { describe, expect, it } from "vitest";
import {
  evaluatePhase5Lane,
  failedPhase5Criteria,
  type Phase5LaneRawEvidence,
} from "../src/gate5-protocol.ts";
import {
  PHASE5_CRITERIA,
  PHASE5_NEGATIVE_CONTROLS,
  PHASE5_PERFORMANCE,
  type Phase5Criterion,
} from "../src/phase5-protocol.ts";
import { passingPhase5Raw } from "./phase5-test-fixtures.ts";

function fixture(
  raw: Phase5LaneRawEvidence,
  kind: Phase5LaneRawEvidence["fixtures"][number]["kind"],
) {
  const found = raw.fixtures.find((entry) => entry.kind === kind);
  if (found === undefined) throw new Error(`missing ${kind} fixture`);
  return found;
}

const mutations: Readonly<Record<Phase5Criterion, (raw: Phase5LaneRawEvidence) => void>> = {
  "P5-WINDOWS-PROVENANCE": (raw) => {
    (raw.adapter as { backend: string }).backend = "Vulkan";
  },
  "P5-PROTOCOL-MATCH": (raw) => {
    const manifest = raw.protocol.fixtureManifest as {
      fixtures: Array<{ rngSeed: number }>;
    };
    manifest.fixtures[0].rngSeed += 1;
  },
  "P5-ADAPTER-LIMITS": (raw) => {
    (raw.adapter.deviceLimits as Record<string, number>).maxBufferSize = 1;
  },
  "P5-LAYOUT-INDEXING": (raw) => {
    (fixture(raw, "layout") as { comparisonFailureCount: number }).comparisonFailureCount = 1;
  },
  "P5-DIFFUSION": (raw) => {
    (fixture(raw, "diffusion") as { fieldFailureCount: number }).fieldFailureCount = 1;
  },
  "P5-GG-THRESHOLD": (raw) => {
    (fixture(raw, "gg") as { decisionFailureCount: number }).decisionFailureCount = 1;
  },
  "P5-LIBBRECHT-KINETICS": (raw) => {
    (fixture(raw, "lk") as { invariantFailureCount: number }).invariantFailureCount = 1;
  },
  "P5-SYMMETRY": (raw) => {
    const target = raw.fixtures.find(
      (entry) => entry.kind === "gg" && entry.symmetryChecked,
    );
    if (target === undefined) throw new Error("missing symmetry fixture");
    (target as { symmetryMismatchCount: number }).symmetryMismatchCount = 1;
  },
  "P5-DOMAIN-SAFETY": (raw) => {
    (raw.fixtures[0] as { domainContact: boolean }).domainContact = true;
  },
  "P5-DISPATCH-SAFETY": (raw) => {
    (raw.submissions.samples[0].segmentWallMs as number[])[0] =
      PHASE5_PERFORMANCE.maxSubmissionSegmentMs + 1;
  },
  "P5-EDIT-ACK": (raw) => {
    (raw.interactions[0] as { editAcknowledgementMs: number }).editAcknowledgementMs =
      PHASE5_PERFORMANCE.editAcknowledgementMs + 1;
  },
  "P5-FIRST-VALID-FRAME": (raw) => {
    (raw.interactions[0] as { firstValidFrameMs: number }).firstValidFrameMs =
      PHASE5_PERFORMANCE.firstValidPostEditFrameMs + 1;
  },
  "P5-RESIDENCY": (raw) => {
    (raw.readback as { fullFieldDisplayFrameCount: number })
      .fullFieldDisplayFrameCount = 1;
  },
  "P5-CHECKPOINTS": (raw) => {
    (raw.checkpoints[0] as { gpuDecodePass: boolean }).gpuDecodePass = false;
  },
  "P5-NEGATIVE-CONTROLS": (raw) => {
    (raw as { toleranceBypassCount: number }).toleranceBypassCount = 1;
  },
  "P5-PUBLICATION": (raw) => {
    (raw as { publicationVerified: boolean }).publicationVerified = false;
  },
};

describe("Phase 5 lane criterion evaluator", () => {
  it("passes the complete frozen baseline in exact criterion order", () => {
    const raw = passingPhase5Raw();
    const verdict = evaluatePhase5Lane(raw);
    expect(verdict.gatePass).toBe(true);
    expect(verdict.exitCode).toBe(0);
    expect(verdict.criteria.map((entry) => entry.id)).toEqual(PHASE5_CRITERIA);
    expect(verdict.criteria.every((entry) => entry.pass)).toBe(true);
    expect(raw.submissions.samples).toHaveLength(
      PHASE5_PERFORMANCE.previewCases.length *
        (PHASE5_PERFORMANCE.warmupCount +
          PHASE5_PERFORMANCE.sampleCount),
    );
    expect(raw.interactions).toHaveLength(
      PHASE5_PERFORMANCE.previewCases.length *
        PHASE5_PERFORMANCE.sampleCount,
    );
    expect(raw.adapter.budgets).toHaveLength(8);
    expect(new Set(raw.adapter.budgets.map((entry) => entry.id)).size).toBe(8);
  });

  it("registers one uniquely owned negative control per criterion", () => {
    expect(PHASE5_NEGATIVE_CONTROLS.map((entry) => entry.owner)).toEqual(
      PHASE5_CRITERIA,
    );
    expect(new Set(PHASE5_NEGATIVE_CONTROLS.map((entry) => entry.id)).size).toBe(
      PHASE5_CRITERIA.length,
    );
  });

  for (const criterion of PHASE5_CRITERIA) {
    it(`makes the ${criterion} mutation fail only its named owner`, () => {
      const raw = structuredClone(passingPhase5Raw());
      mutations[criterion](raw);
      const verdict = evaluatePhase5Lane(raw);
      expect(verdict.gatePass).toBe(false);
      expect(verdict.exitCode).toBe(1);
      expect(failedPhase5Criteria(verdict)).toEqual([criterion]);
    });
  }

  it("rejects incomplete fixture inventories instead of evaluating vacuously", () => {
    const raw = structuredClone(passingPhase5Raw());
    (raw as unknown as { fixtures: unknown[] }).fixtures = raw.fixtures.slice(1);
    expect(() => evaluatePhase5Lane(raw)).toThrow(/inventory is incomplete/);
  });

  it("rejects duplicate fixture ids before criterion evaluation", () => {
    const raw = structuredClone(passingPhase5Raw());
    (raw as unknown as { fixtures: unknown[] }).fixtures = [
      ...raw.fixtures,
      structuredClone(raw.fixtures[0]),
    ];
    expect(() => evaluatePhase5Lane(raw)).toThrow(/duplicate ids/);
  });

  it("rejects unknown raw and nested keys instead of silently ignoring schema drift", () => {
    const top = structuredClone(passingPhase5Raw()) as unknown as Record<string, unknown>;
    top.unregistered = true;
    expect(() =>
      evaluatePhase5Lane(top as unknown as Phase5LaneRawEvidence),
    ).toThrow(/keys differ/);

    const nested = structuredClone(passingPhase5Raw()) as unknown as {
      adapter: Record<string, unknown>;
    };
    nested.adapter.unregistered = true;
    expect(() =>
      evaluatePhase5Lane(nested as unknown as Phase5LaneRawEvidence),
    ).toThrow(/keys differ/);
  });

  it("rejects counterfeit one-byte budget allocations", () => {
    const raw = structuredClone(passingPhase5Raw());
    const budget = raw.adapter.budgets.find(
      (entry) => entry.id === "preview-plate",
    );
    if (budget === undefined) throw new Error("missing preview plate budget");
    (budget as { requiredBytes: number }).requiredBytes = 1;
    (budget as { allocatedBytes: number | null }).allocatedBytes = 1;
    expect(failedPhase5Criteria(evaluatePhase5Lane(raw))).toEqual([
      "P5-ADAPTER-LIMITS",
    ]);
  });
});
