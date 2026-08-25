import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { derivePhase10FinalPackageReport } from "../src/phase10-final-package.ts";

const ROOT = process.cwd();
const COMMIT = "1".repeat(40);

describe("Phase 10 final package", () => {
  it("derives completion from B refusal while preserving incomplete C0V credit", () => {
    const report = derivePhase10FinalPackageReport(ROOT, COMMIT) as Record<string, any>;
    expect(report).toMatchObject({
      schema: "phase10-final-package-report-v1",
      phase: 10,
      packageOutcome: "complete-negative",
      completionBasis: "terminal-b-source-refusal",
      c0vAggregate: { disposition: "incomplete-no-pass", packetCredit: false, pass: false },
      downstreamCandidates: [],
    });
    expect(report.workstreams.map((row: any) => row.workstreamId)).toEqual(["A-P", "A-S", "A-I", "B", "C0", "C0V"]);
    expect(report.workstreams.find((row: any) => row.workstreamId === "B")).toMatchObject({ completion: "refusal" });
    expect(report.workstreams.find((row: any) => row.workstreamId === "C0V")).toMatchObject({
      completion: "maker-terminated-incomplete",
      scientificDisposition: "incomplete-no-pass",
    });
    expect(report.c0vLayers).toEqual([
      expect.objectContaining({ layerId: "C0V-RADIAL", scientificDisposition: "no-verdict", s6PacketCredit: false }),
      expect.objectContaining({ layerId: "C0V-MOVING", scientificDisposition: "refusal", s6PacketCredit: false }),
      expect.objectContaining({ layerId: "C0V-STATIC", scientificDisposition: "refusal", s6PacketCredit: false }),
    ]);
    expect(report.claimBoundary).toMatchObject({
      quantitativeValidationEarned: false,
      solverPhysicsChanged: false,
      downstreamExecutionAuthorized: false,
      priorPhaseLabelsAndArtifactsPreserved: true,
    });
    for (const binding of report.inputs) {
      const value = readFileSync(join(ROOT, binding.path));
      expect(binding).toMatchObject({
        byteLength: value.byteLength,
        sha256: createHash("sha256").update(value).digest("hex"),
      });
    }
  });

  it("refuses a non-commit producer identity", () => {
    expect(() => derivePhase10FinalPackageReport(ROOT, "not-a-commit")).toThrow(/producer commit differs/u);
  });

  it("matches the published report to its bound producer commit", () => {
    const published = JSON.parse(readFileSync(join(ROOT, "evidence/phase10-closure-v1/report.json"), "utf8")) as Record<string, any>;
    expect(published).toEqual(derivePhase10FinalPackageReport(ROOT, published.producerCommit, published.closedOn));
  });
});
