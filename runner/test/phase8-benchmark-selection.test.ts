import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { canonicalJson } from "../src/gate4-evidence.ts";
import {
  derivePhase8bSelectionBundle,
  PHASE8B_SELECTION_TRACKED_INPUTS,
  verifyPhase8bSelectionArtifacts,
  writePhase8bSelectionDirectory,
  type Phase8bSelectionInputs,
} from "../src/phase8-benchmark-selection.ts";

const REPOSITORY_ROOT = process.cwd();
const temporaryDirectories: string[] = [];

afterEach(() => {
  for (const path of temporaryDirectories.splice(0)) rmSync(path, { recursive: true, force: true });
});

function jsonl(records: readonly unknown[]): Uint8Array {
  return new TextEncoder().encode(`${records.map((record) => canonicalJson(record)).join("\n")}\n`);
}

function fixtureInputs(overrides: Partial<Phase8bSelectionInputs["triage"]> = {}): Phase8bSelectionInputs {
  const tracked = new Map<string, Uint8Array>();
  for (const path of Object.values(PHASE8B_SELECTION_TRACKED_INPUTS)) {
    tracked.set(path, new Uint8Array(readFileSync(join(REPOSITORY_ROOT, path))));
  }
  const implementation = new Map<string, Uint8Array>([
    [
      "runner/src/phase8-benchmark-selection.ts",
      new Uint8Array(readFileSync(join(REPOSITORY_ROOT, "runner/src/phase8-benchmark-selection.ts"))),
    ],
    [
      "runner/test/phase8-benchmark-selection.test.ts",
      new Uint8Array(readFileSync(join(REPOSITORY_ROOT, "runner/test/phase8-benchmark-selection.test.ts"))),
    ],
  ]);
  return {
    scope: "test-fixture",
    tracked,
    triage: {
      focused: overrides.focused ?? jsonl([{
        identifier: "https://openalex.org/W-SELECTED",
        disposition: "known-local-or-acquired",
        reasonCode: "known-inventory-identity-match",
        knownMatch: { recordId: "P8B-S2R0-2EA39D1BD3D62F87101CF104" },
      }]),
      author: overrides.author ?? jsonl([
        { recordKind: "route-status", status: "complete" },
        {
          identifier: "https://openalex.org/W-RESIDUAL-A",
          disposition: "likely-eligible-primary",
          reasonCode: "TITLE_PRIMARY_GROWTH_RATE",
          knownMatch: null,
        },
      ]),
      citation: overrides.citation ?? jsonl([
        {
          identifier: "https://openalex.org/W-SELECTED",
          disposition: "known-local-or-acquired",
          reasonCodes: ["KNOWN_ACQUIRED_IDENTIFIER"],
          knownMatches: [{ sourceId: "P8B-S2R0-2EA39D1BD3D62F87101CF104" }],
        },
        {
          identifier: "https://openalex.org/W-RESIDUAL-B",
          disposition: "needs-metadata-or-fulltext",
          reasonCodes: ["ADJACENT_CONTENT_SCOPE_UNCLEAR"],
          knownMatches: [],
        },
      ]),
    },
    implementation,
  };
}

function parseJson(bytes: Uint8Array): Record<string, unknown> {
  return JSON.parse(new TextDecoder().decode(bytes)) as Record<string, unknown>;
}

describe("Phase 8B priority benchmark selection", () => {
  it("freezes the exact 18/26/5 selection and closes each residual denominator by set difference", () => {
    const bundle = derivePhase8bSelectionBundle(fixtureInputs());
    expect(bundle.counts).toEqual({
      p0: 18,
      p1: 26,
      p2: 5,
      selectedLocalUnitCount: 28,
      residualLocalUnitCount: 886,
      selectedAcquiredSourceCount: 5,
      residualAcquiredSourceCount: 23,
      exactIdentifierCount: 3,
      promotedIdentifierCount: 1,
      residualIdentifierCount: 2,
    });
    expect([...bundle.artifacts.keys()].sort()).toEqual([
      "artifact-index.json", "backlog.json", "protocol.json", "report.json", "selection.jsonl",
    ]);

    const selectionText = new TextDecoder().decode(
      bundle.artifacts.get("selection.jsonl") as Uint8Array,
    );
    const records = selectionText.trimEnd().split("\n").map((line) => JSON.parse(line) as Record<string, unknown>);
    expect(records).toHaveLength(49);
    expect(records.filter((record) => record.priorityClass === "P0")).toHaveLength(18);
    expect(records.filter((record) => record.priorityClass === "P1")).toHaveLength(26);
    expect(records.filter((record) => record.priorityClass === "P2")).toHaveLength(5);
    expect(selectionText).not.toMatch(/"(?:expectedEffect|expectedDirection|measuredValues|outcomeValues|ordinates|targetCoordinates|threshold)"/);
    expect(records.every((record) =>
      record.numericTargetCoordinatesExtractedBeforeSelection === false)).toBe(true);
    expect(records.every((record) => record.outcomeValueUsedAsSelectionCriterion === false)).toBe(true);
    expect(records.every((record) => record.phase9EvidenceRole === "model-development")).toBe(true);

    const backlog = parseJson(bundle.artifacts.get("backlog.json") as Uint8Array);
    expect(JSON.stringify(backlog)).toContain('"PROVENANCE_MISMATCH_625":1');
    expect(JSON.stringify(backlog)).toContain('"BACKLOG_ELIGIBLE_NONPRIORITY":17');
    expect(JSON.stringify(backlog)).toContain('"BACKLOG_SCOPE_OR_PROTOCOL_MISMATCH":6');
  });

  it("re-derives artifacts and rejects a caller-edited selection or report", () => {
    const inputs = fixtureInputs();
    const bundle = derivePhase8bSelectionBundle(inputs);
    expect(verifyPhase8bSelectionArtifacts(bundle.artifacts, inputs).counts.p1).toBe(26);

    const changedSelection = new Map(bundle.artifacts);
    const selection = (changedSelection.get("selection.jsonl") as Uint8Array).slice();
    selection[20] = (selection[20] as number) ^ 1;
    changedSelection.set("selection.jsonl", selection);
    expect(() => verifyPhase8bSelectionArtifacts(changedSelection, inputs)).toThrow(/selection artifact differs/);

    const callerVerdict = new Map(bundle.artifacts);
    const report = parseJson(callerVerdict.get("report.json") as Uint8Array);
    report.verdict = "pass";
    callerVerdict.set("report.json", new TextEncoder().encode(canonicalJson(report)));
    expect(() => verifyPhase8bSelectionArtifacts(callerVerdict, inputs)).toThrow(/selection artifact differs/);
  });

  it("rejects a residual identifier without an upstream disposition reason", () => {
    const badCitation = jsonl([{
      identifier: "https://openalex.org/W-UNREASONED",
      disposition: "needs-metadata-or-fulltext",
      knownMatches: [],
    }]);
    expect(() => derivePhase8bSelectionBundle(fixtureInputs({ citation: badCitation })))
      .toThrow(/residual identifier lacks stable source-row reason/);
  });

  it("rejects selected-unit and selected-source drift in the accepted upstream bytes", () => {
    const missingUnit = fixtureInputs();
    const unitPath = PHASE8B_SELECTION_TRACKED_INPUTS.localUnits;
    const unitLines = new TextDecoder().decode(missingUnit.tracked.get(unitPath) as Uint8Array).trimEnd().split("\n");
    const changedUnits = unitLines.filter((line) => !line.includes("P8B-UNIT-10C734F0C6C31B5904B10BE7"));
    const trackedWithoutUnit = new Map(missingUnit.tracked);
    trackedWithoutUnit.set(unitPath, new TextEncoder().encode(`${changedUnits.join("\n")}\n`));
    expect(() => derivePhase8bSelectionBundle({ ...missingUnit, tracked: trackedWithoutUnit }))
      .toThrow(/local-unit universe drifted|selected P0 unit is absent/);

    const missingSource = fixtureInputs();
    const sourcePath = PHASE8B_SELECTION_TRACKED_INPUTS.acquiredSources;
    const sourceLines = new TextDecoder().decode(missingSource.tracked.get(sourcePath) as Uint8Array).trimEnd().split("\n");
    const changedSources = sourceLines.filter((line) => !line.includes("P8B-S2R0-5EF679012E89A00B20AEC8C7"));
    const trackedWithoutSource = new Map(missingSource.tracked);
    trackedWithoutSource.set(sourcePath, new TextEncoder().encode(`${changedSources.join("\n")}\n`));
    expect(() => derivePhase8bSelectionBundle({ ...missingSource, tracked: trackedWithoutSource }))
      .toThrow(/acquired-source universe drifted|selected acquired source is absent/);
  });

  it("publishes atomically once and refuses an overwrite", () => {
    const parent = mkdtempSync(join(tmpdir(), "phase8b-selection-"));
    temporaryDirectories.push(parent);
    const destination = join(parent, "candidate");
    const bundle = derivePhase8bSelectionBundle(fixtureInputs());
    writePhase8bSelectionDirectory(destination, bundle);
    expect(() => writePhase8bSelectionDirectory(destination, bundle)).toThrow(/overwrite/);
  });
});
