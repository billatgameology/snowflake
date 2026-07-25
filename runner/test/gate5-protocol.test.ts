import { describe, expect, it } from "vitest";
import { GG_PRESETS } from "@vcc/core";
import {
  evaluatePhase5Lane,
  failedPhase5Criteria,
  type Phase5LaneRawEvidence,
} from "../src/gate5-protocol.ts";
import {
  applyPhase5NegativeControlMutation,
  assertPhase5CaptureRederivationAgrees,
  derivePhase5NegativeControlOutcomeDetails,
  derivePhase5NegativeControlOutcomes,
  phase5AxisSwappedIndexRoundTripWitness,
  phase5CaptureArtifactDigests,
  phase5RegisteredIndexRoundTripWitness,
  rederivePhase5RawEvidence,
  verifyPhase5CaptureEvidence,
  PHASE5_NEGATIVE_CONTROL_MUTATION_IDS,
} from "../src/gate5-negative-controls.ts";
import { canonicalJson } from "../src/gate4-evidence.ts";
import type { Phase5LaneCapture } from "../src/gate5-evidence.ts";
import {
  PHASE5_CRITERIA,
  PHASE5_FIELD_TOLERANCES,
  PHASE5_NEGATIVE_CONTROLS,
  PHASE5_PERFORMANCE,
  type Phase5Criterion,
} from "../src/phase5-protocol.ts";
import {
  passingPhase5Capture,
  passingPhase5Raw,
} from "./phase5-test-fixtures.ts";

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

// ---------------------------------------------------------------------------
// Negative controls executed at their named boundary
// ---------------------------------------------------------------------------

const LAYOUT_FIXTURE_ID = "layout-noncubic-box-17x19x11";
const DIRICHLET_DIFFUSION_FIXTURE_ID = "diff-small-dirichlet-noise-drift-31x29x21";
const REFLECTING_GG_FIXTURE_ID = "gg-plate-reflecting-48x48x24";
const DIRICHLET_LK_FIXTURE_ID = "lk-warm-dirichlet-24x24x18";
const LAYOUT_DIMS = { nx: 17, ny: 19, nz: 11 } as const;

function record(value: unknown, label: string): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} is not an object`);
  }
  return value as Record<string, unknown>;
}

function list(value: unknown, label: string): unknown[] {
  if (!Array.isArray(value)) throw new Error(`${label} is not an array`);
  return value as unknown[];
}

function payloadOf(
  capture: Phase5LaneCapture,
  fixtureId: string,
  artifact: "comparison" | "events" | "timing" | "readback",
): Record<string, unknown> {
  const found = capture.fixtures.find((entry) => entry.id === fixtureId);
  if (found === undefined) throw new Error(`missing capture fixture ${fixtureId}`);
  return record(found[artifact], `${fixtureId} ${artifact}`);
}

function namedEntry(
  values: unknown[],
  name: string,
  label: string,
): Record<string, unknown> {
  for (const value of values) {
    const entry = record(value, label);
    if (entry.name === name) return entry;
  }
  throw new Error(`${label} omits ${name}`);
}

function comparisonEntry(
  capture: Phase5LaneCapture,
  fixtureId: string,
  group: "fields" | "scalars" | "decisions" | "invariants",
  name: string,
): Record<string, unknown> {
  const comparison = payloadOf(capture, fixtureId, "comparison");
  return namedEntry(
    list(comparison[group], `${fixtureId} ${group}`),
    name,
    `${fixtureId} ${group}`,
  );
}

function firstTimingEntry(
  capture: Phase5LaneCapture,
  key: "submissionSamples" | "interactions",
): Record<string, unknown> {
  return record(
    list(payloadOf(capture, LAYOUT_FIXTURE_ID, "timing")[key], key)[0],
    `${key} sample`,
  );
}

function changedArtifactPaths(
  baseline: Phase5LaneCapture,
  mutated: Phase5LaneCapture,
): readonly string[] {
  const before = phase5CaptureArtifactDigests(baseline);
  const after = phase5CaptureArtifactDigests(mutated);
  expect([...after.keys()].sort()).toEqual([...before.keys()].sort());
  return [...before.keys()]
    .filter((path) => before.get(path) !== after.get(path))
    .sort();
}

/**
 * The failing criteria each control's mutation is *observed* to produce. Nothing in the
 * implementation consults the registered owner while deciding this, so a wrong entry here is
 * a real disagreement with the evaluator rather than a bookkeeping mismatch.
 */
const OBSERVED_FAILING_CRITERIA: Readonly<
  Record<string, readonly Phase5Criterion[]>
> = {
  "NC-WINDOWS-BACKEND-RELABEL": ["P5-WINDOWS-PROVENANCE"],
  "NC-PROTOCOL-HASH-SHIFT": ["P5-PROTOCOL-MATCH"],
  "NC-REQUIRED-LIMIT-DOWNGRADE": ["P5-ADAPTER-LIMITS"],
  "NC-AXIS-SWAP": ["P5-LAYOUT-INDEXING"],
  "NC-WRONG-BOUNDARY-CLAMP": ["P5-DIFFUSION"],
  "NC-STALE-PING-PONG": ["P5-GG-THRESHOLD"],
  "NC-LK-RESIDUAL-ONLY": ["P5-LIBBRECHT-KINETICS"],
  "NC-SYMMETRY-BIT": ["P5-SYMMETRY"],
  "NC-DOMAIN-CONTACT": ["P5-DOMAIN-SAFETY"],
  "NC-EXCESSIVE-DISPATCH": ["P5-DISPATCH-SAFETY"],
  "NC-LATE-EDIT-ACK": ["P5-EDIT-ACK"],
  "NC-LATE-FIRST-FRAME": ["P5-FIRST-VALID-FRAME"],
  "NC-FULL-FIELD-PER-FRAME": ["P5-RESIDENCY"],
  "NC-CHECKPOINT-DTYPE-SHIFT": ["P5-CHECKPOINTS"],
  "NC-TOLERANCE-BYPASS": ["P5-LAYOUT-INDEXING", "P5-NEGATIVE-CONTROLS"],
  "NC-ARTIFACT-BYTE-MUTATION": ["P5-PUBLICATION"],
};

/** The indexed artifacts each control's mutation is expected to disturb, and only those. */
const MUTATED_ARTIFACT_PATHS: Readonly<Record<string, readonly string[]>> = {
  "NC-WINDOWS-BACKEND-RELABEL": [],
  "NC-PROTOCOL-HASH-SHIFT": [],
  "NC-REQUIRED-LIMIT-DOWNGRADE": [],
  "NC-AXIS-SWAP": [`fixtures/${LAYOUT_FIXTURE_ID}/comparison.json`],
  "NC-WRONG-BOUNDARY-CLAMP": [
    `fixtures/${DIRICHLET_DIFFUSION_FIXTURE_ID}/comparison.json`,
  ],
  "NC-STALE-PING-PONG": [`fixtures/${REFLECTING_GG_FIXTURE_ID}/comparison.json`],
  "NC-LK-RESIDUAL-ONLY": [`fixtures/${DIRICHLET_LK_FIXTURE_ID}/comparison.json`],
  "NC-SYMMETRY-BIT": [`fixtures/${REFLECTING_GG_FIXTURE_ID}/comparison.json`],
  "NC-DOMAIN-CONTACT": [
    `fixtures/${DIRICHLET_DIFFUSION_FIXTURE_ID}/comparison.json`,
  ],
  "NC-EXCESSIVE-DISPATCH": [`fixtures/${LAYOUT_FIXTURE_ID}/timing.json`],
  "NC-LATE-EDIT-ACK": [`fixtures/${LAYOUT_FIXTURE_ID}/timing.json`],
  "NC-LATE-FIRST-FRAME": [`fixtures/${LAYOUT_FIXTURE_ID}/timing.json`],
  "NC-FULL-FIELD-PER-FRAME": [`fixtures/${LAYOUT_FIXTURE_ID}/readback.json`],
  "NC-CHECKPOINT-DTYPE-SHIFT": [`fixtures/${LAYOUT_FIXTURE_ID}/comparison.json`],
  "NC-TOLERANCE-BYPASS": [
    `fixtures/${LAYOUT_FIXTURE_ID}/comparison.json`,
    `fixtures/${LAYOUT_FIXTURE_ID}/events.json`,
  ],
  "NC-ARTIFACT-BYTE-MUTATION": [
    `fixtures/${LAYOUT_FIXTURE_ID}/cpu-reference.ckpt`,
  ],
};

/** Controls whose mutation is on raw evidence that has no payload artifact of its own. */
const RAW_EVIDENCE_CONTROL_IDS: ReadonlySet<string> = new Set([
  "NC-WINDOWS-BACKEND-RELABEL",
  "NC-PROTOCOL-HASH-SHIFT",
  "NC-REQUIRED-LIMIT-DOWNGRADE",
]);

/**
 * What each mutation must actually have done to the underlying evidence. These assertions are
 * about the corrupted operand itself, not about any verdict derived from it.
 */
const MUTATION_ASSERTIONS: Readonly<
  Record<
    string,
    (baseline: Phase5LaneCapture, mutated: Phase5LaneCapture) => void
  >
> = {
  "NC-WINDOWS-BACKEND-RELABEL": (baseline, mutated) => {
    expect(baseline.raw.adapter.backend).toBe("D3D12");
    expect(mutated.raw.adapter.backend).toBe("Vulkan");
  },
  "NC-PROTOCOL-HASH-SHIFT": (baseline, mutated) => {
    const before = record(
      record(baseline.raw.protocol.toleranceManifest, "tolerance manifest")
        .scalarTolerances,
      "scalarTolerances",
    ).maxAbs;
    const after = record(
      record(mutated.raw.protocol.toleranceManifest, "tolerance manifest")
        .scalarTolerances,
      "scalarTolerances",
    ).maxAbs;
    expect(typeof before).toBe("number");
    expect(after).not.toBe(before);
    // The recorded hash is deliberately retained: the shift is only visible on recomputation.
    expect(mutated.raw.protocol.toleranceSha256).toBe(
      baseline.raw.protocol.toleranceSha256,
    );
  },
  "NC-REQUIRED-LIMIT-DOWNGRADE": (baseline, mutated) => {
    expect(
      Object.hasOwn(baseline.raw.adapter.deviceLimits, "maxBufferSize"),
    ).toBe(true);
    expect(Object.hasOwn(mutated.raw.adapter.deviceLimits, "maxBufferSize")).toBe(
      false,
    );
  },
  "NC-AXIS-SWAP": (baseline, mutated) => {
    const before = comparisonEntry(
      baseline,
      LAYOUT_FIXTURE_ID,
      "decisions",
      "layout.index-round-trip",
    );
    const after = comparisonEntry(
      mutated,
      LAYOUT_FIXTURE_ID,
      "decisions",
      "layout.index-round-trip",
    );
    const swapped = phase5AxisSwappedIndexRoundTripWitness(LAYOUT_DIMS);
    expect(canonicalJson(after.gpu)).toBe(canonicalJson(swapped));
    expect(canonicalJson(after.gpu)).not.toBe(canonicalJson(before.gpu));
    // Only the device operand moves; the reference side stays untouched evidence.
    expect(canonicalJson(after.cpu)).toBe(canonicalJson(before.cpu));
  },
  "NC-WRONG-BOUNDARY-CLAMP": (baseline, mutated) => {
    const before = comparisonEntry(
      baseline,
      DIRICHLET_DIFFUSION_FIXTURE_ID,
      "decisions",
      "state.far-field-set",
    );
    const after = comparisonEntry(
      mutated,
      DIRICHLET_DIFFUSION_FIXTURE_ID,
      "decisions",
      "state.far-field-set",
    );
    expect(canonicalJson(after.gpu)).not.toBe(canonicalJson(before.gpu));
    expect(record(after.gpu, "far-field operand").shellCount).toBe(0);
    expect(canonicalJson(after.cpu)).toBe(canonicalJson(before.cpu));
  },
  "NC-STALE-PING-PONG": (baseline, mutated) => {
    const before = comparisonEntry(
      baseline,
      REFLECTING_GG_FIXTURE_ID,
      "fields",
      "d",
    );
    const after = comparisonEntry(
      mutated,
      REFLECTING_GG_FIXTURE_ID,
      "fields",
      "d",
    );
    expect(before.tolerance).toBe("ggVapor");
    expect(before.maxAbs).toBe(0);
    expect(after.maxAbs).toBe(GG_PRESETS.plate.rho);
    expect(Number(after.maxAbs)).toBeGreaterThan(
      PHASE5_FIELD_TOLERANCES.ggVapor.maxAbs,
    );
  },
  "NC-LK-RESIDUAL-ONLY": (baseline, mutated) => {
    const before = comparisonEntry(
      baseline,
      DIRICHLET_LK_FIXTURE_ID,
      "invariants",
      "convergence.dual-or-reflecting",
    );
    const after = comparisonEntry(
      mutated,
      DIRICHLET_LK_FIXTURE_ID,
      "invariants",
      "convergence.dual-or-reflecting",
    );
    expect(canonicalJson(before.left)).toBe(canonicalJson(before.right));
    expect(canonicalJson(after.left)).not.toBe(canonicalJson(after.right));
    expect(after.relation).toBe(before.relation);
  },
  "NC-SYMMETRY-BIT": (baseline, mutated) => {
    const before = comparisonEntry(
      baseline,
      REFLECTING_GG_FIXTURE_ID,
      "invariants",
      "symmetry.exact",
    );
    const after = comparisonEntry(
      mutated,
      REFLECTING_GG_FIXTURE_ID,
      "invariants",
      "symmetry.exact",
    );
    expect(canonicalJson(before.left)).toBe(canonicalJson(before.right));
    expect(after.left).toBe(1);
    expect(after.right).toBe(1);
    // The flipped bit is inside the shared registered orbit, so the two lanes still agree and
    // the invariant's own comparison keeps passing. Only an independent reading of the
    // operands sees the broken symmetry.
    expect(canonicalJson(after.left)).toBe(canonicalJson(after.right));
  },
  "NC-DOMAIN-CONTACT": (baseline, mutated) => {
    const before = comparisonEntry(
      baseline,
      DIRICHLET_DIFFUSION_FIXTURE_ID,
      "invariants",
      "domain.no-contact",
    );
    const after = comparisonEntry(
      mutated,
      DIRICHLET_DIFFUSION_FIXTURE_ID,
      "invariants",
      "domain.no-contact",
    );
    expect(before.left).toBe(false);
    expect(after.left).toBe(true);
    // Marked eligible: the invariant's own comparison still agrees with itself.
    expect(canonicalJson(after.left)).toBe(canonicalJson(after.right));
  },
  "NC-EXCESSIVE-DISPATCH": (baseline, mutated) => {
    const before = list(
      firstTimingEntry(baseline, "submissionSamples").segmentWallMs,
      "segmentWallMs",
    );
    const after = list(
      firstTimingEntry(mutated, "submissionSamples").segmentWallMs,
      "segmentWallMs",
    );
    expect(Number(before[0])).toBeLessThanOrEqual(
      PHASE5_PERFORMANCE.maxSubmissionSegmentMs,
    );
    expect(after[0]).toBe(PHASE5_PERFORMANCE.maxSubmissionSegmentMs + 1);
  },
  "NC-LATE-EDIT-ACK": (baseline, mutated) => {
    expect(
      Number(firstTimingEntry(baseline, "interactions").editAcknowledgementMs),
    ).toBeLessThanOrEqual(PHASE5_PERFORMANCE.editAcknowledgementMs);
    expect(
      firstTimingEntry(mutated, "interactions").editAcknowledgementMs,
    ).toBe(PHASE5_PERFORMANCE.editAcknowledgementMs + 1);
  },
  "NC-LATE-FIRST-FRAME": (baseline, mutated) => {
    expect(
      Number(firstTimingEntry(baseline, "interactions").firstValidFrameMs),
    ).toBeLessThanOrEqual(PHASE5_PERFORMANCE.firstValidPostEditFrameMs);
    expect(firstTimingEntry(mutated, "interactions").firstValidFrameMs).toBe(
      PHASE5_PERFORMANCE.firstValidPostEditFrameMs + 1,
    );
  },
  "NC-FULL-FIELD-PER-FRAME": (baseline, mutated) => {
    const readbackBefore = payloadOf(baseline, LAYOUT_FIXTURE_ID, "readback");
    const readbackAfter = payloadOf(mutated, LAYOUT_FIXTURE_ID, "readback");
    const before = record(
      list(readbackBefore.records, "records")[0],
      "readback record",
    );
    const after = record(
      list(readbackAfter.records, "records")[0],
      "readback record",
    );
    expect(before.fullField).toBe(false);
    expect(before.displayFrame).toBe(false);
    expect(after.fullField).toBe(true);
    expect(after.displayFrame).toBe(true);
    expect(after.byteOffset).toBe(0);
    expect(after.byteLength).toBe(after.sourceByteLength);
    expect(after.displayFrameSequence).toBe(after.sequence);
    expect(readbackBefore.fullFieldDisplayFrameCount).toBe(0);
    expect(readbackAfter.fullFieldDisplayFrameCount).toBe(1);
  },
  "NC-CHECKPOINT-DTYPE-SHIFT": (baseline, mutated) => {
    const before = record(
      payloadOf(baseline, LAYOUT_FIXTURE_ID, "comparison").checkpoint,
      "checkpoint",
    );
    const after = record(
      payloadOf(mutated, LAYOUT_FIXTURE_ID, "comparison").checkpoint,
      "checkpoint",
    );
    expect(before.endianness).toBe("little-endian");
    expect(after.endianness).toBe("big-endian");
  },
  "NC-TOLERANCE-BYPASS": (baseline, mutated) => {
    const before = comparisonEntry(baseline, LAYOUT_FIXTURE_ID, "fields", "d");
    const after = comparisonEntry(mutated, LAYOUT_FIXTURE_ID, "fields", "d");
    expect(before.tolerance).toBe("diffusionD");
    expect(before.maxAbs).toBe(0);
    expect(after.maxAbs).toBe(PHASE5_FIELD_TOLERANCES.diffusionD.maxAbs * 10);
    expect(Number(after.maxAbs)).toBeGreaterThan(
      PHASE5_FIELD_TOLERANCES.diffusionD.maxAbs,
    );
    expect(
      payloadOf(baseline, LAYOUT_FIXTURE_ID, "events").toleranceBypassCount,
    ).toBe(0);
    expect(
      payloadOf(mutated, LAYOUT_FIXTURE_ID, "events").toleranceBypassCount,
    ).toBe(1);
  },
  "NC-ARTIFACT-BYTE-MUTATION": (baseline, mutated) => {
    const before = baseline.fixtures.find(
      (entry) => entry.id === LAYOUT_FIXTURE_ID,
    );
    const after = mutated.fixtures.find((entry) => entry.id === LAYOUT_FIXTURE_ID);
    if (before === undefined || after === undefined) {
      throw new Error("missing layout fixture capture");
    }
    expect(after.cpuReferenceCheckpoint.byteLength).toBe(
      before.cpuReferenceCheckpoint.byteLength,
    );
    expect(after.cpuReferenceCheckpoint[0]).not.toBe(
      before.cpuReferenceCheckpoint[0],
    );
    expect([...after.cpuReferenceCheckpoint].slice(1)).toEqual(
      [...before.cpuReferenceCheckpoint].slice(1),
    );
  },
};

describe("Phase 5 negative controls executed at their named boundary", () => {
  it("registers exactly one mutation implementation per frozen control", () => {
    expect(PHASE5_NEGATIVE_CONTROL_MUTATION_IDS).toEqual(
      PHASE5_NEGATIVE_CONTROLS.map((control) => control.id).sort(),
    );
    expect(PHASE5_NEGATIVE_CONTROL_MUTATION_IDS).toHaveLength(
      PHASE5_CRITERIA.length,
    );
    expect(Object.keys(OBSERVED_FAILING_CRITERIA).sort()).toEqual(
      PHASE5_NEGATIVE_CONTROL_MUTATION_IDS,
    );
    expect(Object.keys(MUTATION_ASSERTIONS).sort()).toEqual(
      PHASE5_NEGATIVE_CONTROL_MUTATION_IDS,
    );
    expect(Object.keys(MUTATED_ARTIFACT_PATHS).sort()).toEqual(
      PHASE5_NEGATIVE_CONTROL_MUTATION_IDS,
    );
  });

  it("re-derives the unmutated capture's raw evidence from its own payload", () => {
    const capture = passingPhase5Capture();
    expect(() => assertPhase5CaptureRederivationAgrees(capture)).not.toThrow();
    expect(canonicalJson(rederivePhase5RawEvidence(capture, true))).toBe(
      canonicalJson({ ...capture.raw, publicationVerified: true }),
    );
  });

  it("accepts the unmutated capture with an empty observed failing set", () => {
    const capture = passingPhase5Capture();
    const verification = verifyPhase5CaptureEvidence(
      capture,
      phase5CaptureArtifactDigests(capture),
    );
    expect(verification.structuralReason).toBeNull();
    expect(verification.failedCriteria).toEqual([]);
    expect(verification.rejected).toBe(false);
    expect(verification.rejection).toBe("none");
  });

  it("returns the frozen control inventory in registered order", () => {
    const outcomes = derivePhase5NegativeControlOutcomes(passingPhase5Capture());
    expect(outcomes.map((outcome) => outcome.id)).toEqual(
      PHASE5_NEGATIVE_CONTROLS.map((control) => control.id),
    );
    expect(outcomes.map((outcome) => outcome.owner)).toEqual(
      PHASE5_NEGATIVE_CONTROLS.map((control) => control.owner),
    );
    expect(outcomes.map((outcome) => outcome.mutation)).toEqual(
      PHASE5_NEGATIVE_CONTROLS.map((control) => control.mutation),
    );
    for (const outcome of outcomes) {
      expect(Object.keys(outcome).sort()).toEqual([
        "failedCriteria",
        "id",
        "mutation",
        "owner",
        "rejected",
      ]);
    }
  });

  it("refuses an unregistered control id instead of doing nothing", () => {
    expect(() =>
      applyPhase5NegativeControlMutation(
        "NC-NOT-REGISTERED",
        passingPhase5Capture(),
      ),
    ).toThrow(/unregistered Phase 5 negative control/);
  });

  it("swaps j and k in a mapping the non-cubic layout fixture can tell apart", () => {
    const registered = phase5RegisteredIndexRoundTripWitness(LAYOUT_DIMS);
    const swapped = phase5AxisSwappedIndexRoundTripWitness(LAYOUT_DIMS);
    expect(LAYOUT_DIMS.ny).not.toBe(LAYOUT_DIMS.nz);
    expect(canonicalJson(registered)).not.toBe(canonicalJson(swapped));
    expect(record(registered, "registered witness").cellCount).toBe(
      LAYOUT_DIMS.nx * LAYOUT_DIMS.ny * LAYOUT_DIMS.nz,
    );
    expect(record(swapped, "swapped witness").cellCount).toBe(
      LAYOUT_DIMS.nx * LAYOUT_DIMS.ny * LAYOUT_DIMS.nz,
    );
    expect(String(record(swapped, "swapped witness").sha256)).toMatch(
      /^[0-9a-f]{64}$/,
    );
  });

  it("refuses a capture whose declared raw evidence contradicts its payload", () => {
    const capture = passingPhase5Capture();
    (capture.raw.fixtures[0] as { decisionFailureCount: number })
      .decisionFailureCount = 1;
    expect(() => derivePhase5NegativeControlOutcomes(capture)).toThrow(
      /disagrees with the capture's declared raw evidence/,
    );
  });

  it("refuses to score controls against an already-failing baseline", () => {
    const capture = passingPhase5Capture();
    (capture.raw.adapter as { backend: string }).backend = "Vulkan";
    expect(() => derivePhase5NegativeControlOutcomes(capture)).toThrow(
      /require an accepted baseline capture/,
    );
  });

  it("observes an owner-independent failing set for the tolerance bypass", () => {
    const outcomes = derivePhase5NegativeControlOutcomeDetails(
      passingPhase5Capture(),
    );
    const bypass = outcomes.find(
      (outcome) => outcome.id === "NC-TOLERANCE-BYPASS",
    );
    if (bypass === undefined) throw new Error("missing tolerance bypass outcome");
    // Direct evidence that ownership is read off the evaluator rather than copied in: the
    // observed set is larger than the registered owner and still contains it.
    expect(bypass.failedCriteria).toContain(bypass.owner);
    expect(bypass.failedCriteria.length).toBeGreaterThan(1);
    expect(
      bypass.failedCriteria.filter((criterion) => criterion !== bypass.owner),
    ).toEqual(["P5-LAYOUT-INDEXING"]);
  });

  for (const control of PHASE5_NEGATIVE_CONTROLS) {
    it(`${control.id} corrupts its named evidence and is refused by the evaluator`, () => {
      const baseline = passingPhase5Capture();
      const baselineRaw = canonicalJson(baseline.raw);
      const baselineDigests = [...phase5CaptureArtifactDigests(baseline)];
      const mutated = applyPhase5NegativeControlMutation(control.id, baseline);

      // The mutation touched a deep clone, never the caller's capture.
      expect(canonicalJson(baseline.raw)).toBe(baselineRaw);
      expect([...phase5CaptureArtifactDigests(baseline)]).toEqual(baselineDigests);

      // It executed at the boundary the control names.
      MUTATION_ASSERTIONS[control.id](baseline, mutated);
      expect(changedArtifactPaths(baseline, mutated)).toEqual(
        [...MUTATED_ARTIFACT_PATHS[control.id]].sort(),
      );
      if (RAW_EVIDENCE_CONTROL_IDS.has(control.id)) {
        expect(canonicalJson(mutated.raw)).not.toBe(baselineRaw);
      } else {
        // No summary counter moved: every `*FailureCount`, declared count, and declared flag
        // in raw evidence is byte-identical to the accepted baseline's, so the refusal below
        // can only have come from re-deriving the payload.
        expect(canonicalJson(mutated.raw)).toBe(baselineRaw);
      }

      // And the refusal is observed, not declared.
      const outcomes = derivePhase5NegativeControlOutcomeDetails(baseline);
      const outcome = outcomes.find((entry) => entry.id === control.id);
      if (outcome === undefined) throw new Error(`missing outcome ${control.id}`);
      expect(outcome.structuralReason).toBeNull();
      expect(outcome.rejection).toBe("criteria");
      expect(outcome.rejected).toBe(true);
      expect(outcome.failedCriteria).toEqual(
        OBSERVED_FAILING_CRITERIA[control.id],
      );
      expect(outcome.failedCriteria).toContain(control.owner);
      expect(outcome.ownerObserved).toBe(true);
    });
  }
});
