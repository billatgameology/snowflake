import { describe, expect, it } from "vitest";

import { strictJsonSnapshot } from "../src/gate4-evidence.ts";
import {
  phase10C0VS6ArtifactIdentity,
  phase10C0VS6PrettyJsonBytes,
} from "../src/phase10-c0v-s6-execution-contracts.ts";
import {
  parsePhase10C0VLayerArtifactIndexBytes,
  parsePhase10C0VPublishedLayerResultBytes,
  phase10C0VLayerArtifactIndexBytes,
  phase10C0VLayerResultBytes,
  type Phase10C0VLayerArtifactIndex,
  type Phase10C0VLayerResultV1,
} from "../src/phase10-c0v-s6-publication-verifier.ts";

const text = new TextEncoder();

function movingResult(): Phase10C0VLayerResultV1 {
  return Object.freeze({
    schema: "phase10-c0v-moving-result-v1",
    resultId: "c0v-moving-result-v1",
    layerId: "C0V-MOVING-EVENT",
    branch: "independent-reference",
    protocol: phase10C0VS6ArtifactIdentity("evidence/protocol.json", text.encode("protocol\n")),
    referenceOrRefusal: phase10C0VS6ArtifactIdentity("evidence/reference.json", text.encode("reference\n")),
    attemptLedger: phase10C0VS6ArtifactIdentity("evidence/attempts.jsonl", text.encode("attempt\n")),
    witness: null,
    evaluation: null,
    terminalStatus: "refusal",
    scientificDisposition: "refusal",
    negativeControlDisposition: "not-run-no-credit",
    resourceDisposition: "within-cap",
    claimBoundary: Object.freeze({
      allowed: Object.freeze(["moving-reference-discrepancy-refusal"]),
      forbidden: Object.freeze(["validation-claim"]),
    }),
  });
}

function artifactIndex(): Phase10C0VLayerArtifactIndex {
  const first = phase10C0VS6ArtifactIdentity("evidence/attempts.jsonl", text.encode("attempt\n"));
  const second = phase10C0VS6ArtifactIdentity("evidence/result.json", text.encode("result\n"));
  return Object.freeze({
    schema: "phase10-artifact-index-v1",
    bundleId: "phase10-numerical-verification-v1",
    artifacts: Object.freeze([
      Object.freeze({
        artifactId: "out-attempt-ledger",
        path: first.path,
        mediaType: "application/x-ndjson",
        byteLength: first.byteLength,
        sha256: first.sha256,
        role: "attempt-ledger",
        producedBy: "phase10-attempt-writer",
      }),
      Object.freeze({
        artifactId: "out-result",
        path: second.path,
        mediaType: "application/json",
        byteLength: second.byteLength,
        sha256: second.sha256,
        role: "layer-result",
        producedBy: "phase10-publication-producer",
      }),
    ]),
  });
}

function pretty(value: unknown): Uint8Array {
  return phase10C0VS6PrettyJsonBytes(strictJsonSnapshot(value));
}

describe("Phase 10 C0V S6 publication codecs", () => {
  it("round-trips the exact moving refusal projection", () => {
    const expected = movingResult();
    expect(parsePhase10C0VPublishedLayerResultBytes(
      phase10C0VLayerResultBytes(expected),
      "c0v-moving-publish",
    )).toEqual(expected);
  });

  it("rejects an extra result field and a relabeled resource disposition", () => {
    const expected = movingResult();
    expect(() => parsePhase10C0VPublishedLayerResultBytes(pretty({
      ...expected,
      extra: true,
    }), "c0v-moving-publish")).toThrow(/ordered fields differ/u);
    expect(() => parsePhase10C0VPublishedLayerResultBytes(pretty({
      ...expected,
      resourceDisposition: "registered-cap-resource-refusal",
    }), "c0v-moving-publish")).toThrow(/exact refusal projection differs/u);
  });

  it("requires an artifact-ID-sorted unique path roster with path-derived media types", () => {
    const expected = artifactIndex();
    expect(parsePhase10C0VLayerArtifactIndexBytes(
      phase10C0VLayerArtifactIndexBytes(expected),
    )).toEqual(expected);

    expect(() => parsePhase10C0VLayerArtifactIndexBytes(pretty({
      ...expected,
      artifacts: [...expected.artifacts].reverse(),
    }))).toThrow(/artifact-ID sorted/u);
    expect(() => parsePhase10C0VLayerArtifactIndexBytes(pretty({
      ...expected,
      artifacts: [
        expected.artifacts[0],
        {
          ...expected.artifacts[1],
          path: expected.artifacts[0]!.path,
          mediaType: expected.artifacts[0]!.mediaType,
        },
      ],
    }))).toThrow(/repeat a path/u);
    expect(() => parsePhase10C0VLayerArtifactIndexBytes(pretty({
      ...expected,
      artifacts: [
        { ...expected.artifacts[0], mediaType: "application/json" },
        expected.artifacts[1],
      ],
    }))).toThrow(/mediaType differs/u);
  });
});
