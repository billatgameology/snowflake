import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { PHASE9_MV_SOURCE_RELATIVE_REGISTRY } from "../src/phase9-mv-eligibility.js";
import {
  PHASE9_MV_PREFLIGHT_MUTATIONS,
  PHASE9_MV_REQUIRED_MISSING_DIMENSIONS,
  phase9MvPreflight,
  type Phase9MvArtifactIdentity,
  type Phase9MvProtocol,
} from "../src/phase9-mv-preflight.js";

const PROTOCOL_PATH = "research/phase9-mv-protocol-v1.json";

function protocol(): Phase9MvProtocol {
  return JSON.parse(readFileSync(PROTOCOL_PATH, "utf8")) as Phase9MvProtocol;
}

function bytes(path: string): Uint8Array {
  return readFileSync(path);
}

function run(value = protocol()) {
  return phase9MvPreflight(
    value,
    bytes(value.upstreamBindings.sourceOverlay.shelfFreeze.path),
    bytes(value.upstreamBindings.phase8bSuccessor.path),
    bytes(value.upstreamBindings.phase8bPlotMetadata.path),
  );
}

function clone<T>(value: T): T {
  return structuredClone(value);
}

function mutateJson(source: Uint8Array, mutator: (value: Record<string, unknown>) => void): Uint8Array {
  const value = JSON.parse(new TextDecoder().decode(source)) as Record<string, unknown>;
  mutator(value);
  return new TextEncoder().encode(`${JSON.stringify(value, null, 2)}\n`);
}

function mutateJsonl(source: Uint8Array, mutator: (rows: Record<string, unknown>[]) => void): Uint8Array {
  const rows = new TextDecoder().decode(source).trimEnd().split("\n").map((line) => JSON.parse(line) as Record<string, unknown>);
  mutator(rows);
  return new TextEncoder().encode(`${rows.map((row) => JSON.stringify(row)).join("\n")}\n`);
}

function repin(pin: Phase9MvArtifactIdentity, changedBytes: Uint8Array): void {
  (pin as { byteLength: number; sha256: string }).byteLength = changedBytes.byteLength;
  (pin as { byteLength: number; sha256: string }).sha256 =
    createHash("sha256").update(changedBytes).digest("hex");
}

function rebindSuccessorMetadataArtifact(
  successorBytes: Uint8Array,
  metadataBytes: Uint8Array,
): Uint8Array {
  const metadataSha256 = createHash("sha256").update(metadataBytes).digest("hex");
  return mutateJsonl(successorBytes, (rows) => {
    for (const row of rows) {
      const binding = row.binding;
      if (binding === null || Array.isArray(binding) || typeof binding !== "object") continue;
      const metadataRecordArtifact = (binding as Record<string, unknown>).metadataRecordArtifact;
      if (
        metadataRecordArtifact === null ||
        Array.isArray(metadataRecordArtifact) ||
        typeof metadataRecordArtifact !== "object"
      ) continue;
      (metadataRecordArtifact as Record<string, unknown>).byteLength = metadataBytes.byteLength;
      (metadataRecordArtifact as Record<string, unknown>).sha256 = metadataSha256;
    }
  });
}

describe("Phase 9 M-V byte-bound preflight", () => {
  it("binds S0B and reconstructs the exact ten-record relative registry while absolute eligibility stays zero", () => {
    const frozen = protocol();
    expect(frozen.upstreamBindings.sourceOverlay.shelfFreeze).toEqual({
      path: "evidence/phase9-source-overlay-v1/shelf-freeze.json",
      byteLength: 63_975,
      sha256: "b0bbab2e01eca61dfb2b807bda3614aaf803e5fd0457f2df02aa3e4b8c5d1a06",
    });
    expect(frozen.upstreamBindings.sourceOverlay.exactShelf).toMatchObject({
      sourceBlocked: false,
      protocolDispositionRequired: true,
      protocolDispositionState: "pending",
    });
    expect(frozen.upstreamBindings.sourceOverlay.exactShelf.restrictionDispositions).toHaveLength(14);
    expect(frozen.absoluteEligibility).toEqual({
      state: "blocked-no-byte-bound-consuming-arm-record",
      eligibleCount: 0,
      analyticReynoldsHelperRole: "diagnostic-only",
      missingDimensions: PHASE9_MV_REQUIRED_MISSING_DIMENSIONS,
    });
    expect(frozen.sourceRelativeRegistry).toEqual(PHASE9_MV_SOURCE_RELATIVE_REGISTRY);
    expect(run()).toEqual({
      selectionCount: 10,
      heliumArgonMixtureCount: 6,
      heliumAtReducedPressureCount: 4,
      airCount: 0,
      maximumReynoldsBoundCount: 0,
      absoluteEligibleCount: 0,
      selectionIds: frozen.sd71AbsoluteCensus.expectedSelectionIds,
      sourceRelativeRegistry: PHASE9_MV_SOURCE_RELATIVE_REGISTRY,
    });
  });

  it("executes every named semantic mutation on actual bytes or the actual local disposition", () => {
    const frozen = protocol();
    const freshShelf = () => bytes(frozen.upstreamBindings.sourceOverlay.shelfFreeze.path);
    const freshSuccessor = () => bytes(frozen.upstreamBindings.phase8bSuccessor.path);
    const freshMetadata = () => bytes(frozen.upstreamBindings.phase8bPlotMetadata.path);
    const cases: readonly [string, () => void][] = [
      ["shelf-byte-change", () => {
        const changed = freshShelf(); changed[changed.length - 2] ^= 1;
        expect(changed).not.toEqual(freshShelf());
        expect(() => phase9MvPreflight(frozen, changed, freshSuccessor(), freshMetadata())).toThrow(/M-V preflight refused/u);
      }],
      ["shelf-source-blocked-change", () => {
        const changedBytes = mutateJson(freshShelf(), (value) => {
          const shelf = value.shelf as Record<string, unknown>[];
          const row = shelf.find((entry) => entry.item === "M-V")!;
          row.sourceBlocked = true;
        });
        const changed = clone(frozen);
        repin(changed.upstreamBindings.sourceOverlay.shelfFreeze, changedBytes);
        expect(new TextDecoder().decode(changedBytes)).toContain('"sourceBlocked": true');
        expect(() => phase9MvPreflight(changed, changedBytes, freshSuccessor(), freshMetadata())).toThrow(/source-blocker state differs/u);
      }],
      ["shelf-disposition-required-change", () => {
        const changedBytes = mutateJson(freshShelf(), (value) => {
          const shelf = value.shelf as Record<string, unknown>[];
          const row = shelf.find((entry) => entry.item === "M-V")!;
          row.protocolDispositionRequired = false;
        });
        const changed = clone(frozen);
        repin(changed.upstreamBindings.sourceOverlay.shelfFreeze, changedBytes);
        expect(new TextDecoder().decode(changedBytes)).toContain('"protocolDispositionRequired": false');
        expect(() => phase9MvPreflight(changed, changedBytes, freshSuccessor(), freshMetadata())).toThrow(/source-blocker state differs/u);
      }],
      ["shelf-disposition-state-change", () => {
        const changedBytes = mutateJson(freshShelf(), (value) => {
          const shelf = value.shelf as Record<string, unknown>[];
          const row = shelf.find((entry) => entry.item === "M-V")!;
          row.protocolDispositionState = "resolved";
        });
        const changed = clone(frozen);
        repin(changed.upstreamBindings.sourceOverlay.shelfFreeze, changedBytes);
        expect(new TextDecoder().decode(changedBytes)).toContain('"protocolDispositionState": "resolved"');
        expect(() => phase9MvPreflight(changed, changedBytes, freshSuccessor(), freshMetadata())).toThrow(/source-blocker state differs/u);
      }],
      ["shelf-restriction-change", () => {
        const changedBytes = mutateJson(freshShelf(), (value) => {
          const shelf = value.shelf as Record<string, unknown>[];
          const row = shelf.find((entry) => entry.item === "M-V")!;
          const restrictions = row.protocolRestrictions as Record<string, unknown>[];
          restrictions[0]!.text = `${restrictions[0]!.text as string} changed`;
        });
        const changed = clone(frozen);
        repin(changed.upstreamBindings.sourceOverlay.shelfFreeze, changedBytes);
        expect(new TextDecoder().decode(changedBytes)).toContain("changed");
        expect(() => phase9MvPreflight(changed, changedBytes, freshSuccessor(), freshMetadata())).toThrow(/restrictions differ/u);
      }],
      ["restriction-local-disposition-missing", () => {
        const changed = clone(frozen);
        const disposition = changed.upstreamBindings.sourceOverlay.exactShelf.restrictionDispositions[0] as unknown as Record<string, unknown>;
        expect("localDisposition" in disposition).toBe(true);
        delete disposition.localDisposition;
        expect("localDisposition" in disposition).toBe(false);
        expect(() => phase9MvPreflight(changed, freshShelf(), freshSuccessor(), freshMetadata())).toThrow(/local disposition/u);
      }],
      ["missing-source-alternative-change", () => {
        const changed = clone(frozen);
        (changed.upstreamBindings.sourceOverlay.missingSourceAlternative as { clearedScope: string }).clearedScope = "M-PT too";
        expect(() => phase9MvPreflight(changed, freshShelf(), freshSuccessor(), freshMetadata())).toThrow(/source alternative differs/u);
      }],
      ["successor-byte-change", () => {
        const changed = freshSuccessor(); changed[changed.length - 2] ^= 1;
        expect(changed).not.toEqual(freshSuccessor());
        expect(() => phase9MvPreflight(frozen, freshShelf(), changed, freshMetadata())).toThrow(/byte\/hash pin differs/u);
      }],
      ["plot-metadata-byte-change", () => {
        const changed = freshMetadata(); changed[changed.length - 2] ^= 1;
        expect(changed).not.toEqual(freshMetadata());
        expect(() => phase9MvPreflight(frozen, freshShelf(), freshSuccessor(), changed)).toThrow(/byte\/hash pin differs/u);
      }],
      ["SD71-row-missing", () => {
        const metadataBytes = mutateJsonl(freshMetadata(), (rows) => {
          const index = rows.findIndex((row) => row.selectionId === "P8B-P1-SD71-M11");
          expect(index).toBeGreaterThanOrEqual(0);
          rows.splice(index, 1);
        });
        const successorBytes = rebindSuccessorMetadataArtifact(freshSuccessor(), metadataBytes);
        const changed = clone(frozen);
        repin(changed.upstreamBindings.phase8bSuccessor, successorBytes);
        repin(changed.upstreamBindings.phase8bPlotMetadata, metadataBytes);
        expect(() => phase9MvPreflight(changed, freshShelf(), successorBytes, metadataBytes)).toThrow(/exact SD71/u);
      }],
      ["SD71-row-added", () => {
        const addedSuccessorBytes = mutateJsonl(freshSuccessor(), (rows) => {
          const source = clone(rows.find((row) => row.selectionId === "P8B-P1-SD71-M11")!);
          source.selectionId = "P8B-P1-SD71-M99";
          const binding = source.binding as Record<string, unknown>;
          binding.metadataRecordId = "P8B-P1-SD71-M99";
          rows.push(source);
        });
        const metadataBytes = mutateJsonl(freshMetadata(), (rows) => {
          const source = clone(rows.find((row) => row.selectionId === "P8B-P1-SD71-M11")!);
          source.selectionId = "P8B-P1-SD71-M99";
          rows.push(source);
        });
        const successorBytes = rebindSuccessorMetadataArtifact(addedSuccessorBytes, metadataBytes);
        const changed = clone(frozen);
        repin(changed.upstreamBindings.phase8bSuccessor, successorBytes);
        repin(changed.upstreamBindings.phase8bPlotMetadata, metadataBytes);
        expect(new TextDecoder().decode(successorBytes)).toContain("P8B-P1-SD71-M99");
        expect(new TextDecoder().decode(metadataBytes)).toContain("P8B-P1-SD71-M99");
        expect(() => phase9MvPreflight(changed, freshShelf(), successorBytes, metadataBytes)).toThrow(/exact SD71/u);
      }],
      ["SD71-carrier-gas-change", () => {
        const metadataBytes = mutateJsonl(freshMetadata(), (rows) => {
          const row = rows.find((entry) => entry.selectionId === "P8B-P1-SD71-M11")!;
          (row.conditions as Record<string, unknown>).carrierGas = "air";
        });
        const successorBytes = rebindSuccessorMetadataArtifact(freshSuccessor(), metadataBytes);
        const changed = clone(frozen);
        repin(changed.upstreamBindings.phase8bSuccessor, successorBytes);
        repin(changed.upstreamBindings.phase8bPlotMetadata, metadataBytes);
        expect(new TextDecoder().decode(metadataBytes)).toContain('"carrierGas":"air"');
        expect(() => phase9MvPreflight(changed, freshShelf(), successorBytes, metadataBytes)).toThrow(/intervention-axis conditions differ/u);
      }],
      ["SD71-axis-binding-change", () => {
        const metadataBytes = mutateJsonl(freshMetadata(), (rows) => {
          const row = rows.find((entry) => entry.selectionId === "P8B-P1-SD71-M11")!;
          (row.conditions as Record<string, unknown>).fixedReportedVaporDiffusivityCm2PerS = 0.78;
        });
        const successorBytes = rebindSuccessorMetadataArtifact(freshSuccessor(), metadataBytes);
        const changed = clone(frozen);
        repin(changed.upstreamBindings.phase8bSuccessor, successorBytes);
        repin(changed.upstreamBindings.phase8bPlotMetadata, metadataBytes);
        expect(new TextDecoder().decode(metadataBytes)).toContain('"fixedReportedVaporDiffusivityCm2PerS":0.78');
        expect(() => phase9MvPreflight(changed, freshShelf(), successorBytes, metadataBytes)).toThrow(/intervention-axis conditions differ/u);
      }],
      ["SD71-metadata-record-artifact-change", () => {
        const changedBytes = mutateJsonl(freshSuccessor(), (rows) => {
          const row = rows.find((entry) => entry.selectionId === "P8B-P1-SD71-M11")!;
          const binding = row.binding as Record<string, unknown>;
          const metadataRecordArtifact = binding.metadataRecordArtifact as Record<string, unknown>;
          metadataRecordArtifact.sha256 = "0".repeat(64);
        });
        const changed = clone(frozen); repin(changed.upstreamBindings.phase8bSuccessor, changedBytes);
        expect(new TextDecoder().decode(changedBytes)).toContain(`"sha256":"${"0".repeat(64)}"`);
        expect(() => phase9MvPreflight(changed, freshShelf(), changedBytes, freshMetadata())).toThrow(/artifact binding differs/u);
      }],
      ["SD71-row-artifact-change", () => {
        const changedBytes = mutateJsonl(freshSuccessor(), (rows) => {
          const row = rows.find((entry) => entry.selectionId === "P8B-P1-SD71-M11")!;
          const binding = row.binding as Record<string, unknown>;
          const rowArtifact = binding.rowArtifact as Record<string, unknown>;
          rowArtifact.sha256 = "0".repeat(64);
        });
        const changed = clone(frozen); repin(changed.upstreamBindings.phase8bSuccessor, changedBytes);
        expect(new TextDecoder().decode(changedBytes)).toContain(`"sha256":"${"0".repeat(64)}"`);
        expect(() => phase9MvPreflight(changed, freshShelf(), changedBytes, freshMetadata())).toThrow(/artifact binding differs/u);
      }],
      ["SD71-coherent-row-artifact-forgery", () => {
        const forgedDigest = "0".repeat(64);
        const metadataBytes = mutateJsonl(freshMetadata(), (rows) => {
          const row = rows.find((entry) => entry.selectionId === "P8B-P1-SD71-M11")!;
          const rowArtifact = row.rowArtifact as Record<string, unknown>;
          rowArtifact.sha256 = forgedDigest;
        });
        const reboundSuccessorBytes = rebindSuccessorMetadataArtifact(freshSuccessor(), metadataBytes);
        const successorBytes = mutateJsonl(reboundSuccessorBytes, (rows) => {
          const row = rows.find((entry) => entry.selectionId === "P8B-P1-SD71-M11")!;
          const binding = row.binding as Record<string, unknown>;
          const rowArtifact = binding.rowArtifact as Record<string, unknown>;
          rowArtifact.sha256 = forgedDigest;
        });
        const changed = clone(frozen);
        repin(changed.upstreamBindings.phase8bSuccessor, successorBytes);
        repin(changed.upstreamBindings.phase8bPlotMetadata, metadataBytes);
        expect(new TextDecoder().decode(successorBytes)).toContain(`"sha256":"${forgedDigest}"`);
        expect(new TextDecoder().decode(metadataBytes)).toContain(`"sha256":"${forgedDigest}"`);
        expect(() => phase9MvPreflight(changed, freshShelf(), successorBytes, metadataBytes)).toThrow(/closed registry differs/u);
      }],
      ["SD71-coherent-row-byte-length-forgery", () => {
        const metadataBytes = mutateJsonl(freshMetadata(), (rows) => {
          const row = rows.find((entry) => entry.selectionId === "P8B-P1-SD71-M11")!;
          const rowArtifact = row.rowArtifact as Record<string, unknown>;
          rowArtifact.bytes = 1;
        });
        const reboundSuccessorBytes = rebindSuccessorMetadataArtifact(freshSuccessor(), metadataBytes);
        const successorBytes = mutateJsonl(reboundSuccessorBytes, (rows) => {
          const row = rows.find((entry) => entry.selectionId === "P8B-P1-SD71-M11")!;
          const binding = row.binding as Record<string, unknown>;
          const rowArtifact = binding.rowArtifact as Record<string, unknown>;
          rowArtifact.byteLength = 1;
        });
        const changed = clone(frozen);
        repin(changed.upstreamBindings.phase8bSuccessor, successorBytes);
        repin(changed.upstreamBindings.phase8bPlotMetadata, metadataBytes);
        expect(new TextDecoder().decode(successorBytes)).toContain('"byteLength":1');
        expect(new TextDecoder().decode(metadataBytes)).toContain('"bytes":1');
        expect(() => phase9MvPreflight(changed, freshShelf(), successorBytes, metadataBytes)).toThrow(/closed registry differs/u);
      }],
      ["SD71-row-artifact-extra-key", () => {
        const metadataBytes = mutateJsonl(freshMetadata(), (rows) => {
          const row = rows.find((entry) => entry.selectionId === "P8B-P1-SD71-M11")!;
          const rowArtifact = row.rowArtifact as Record<string, unknown>;
          rowArtifact.unregistered = true;
        });
        const successorBytes = rebindSuccessorMetadataArtifact(freshSuccessor(), metadataBytes);
        const changed = clone(frozen);
        repin(changed.upstreamBindings.phase8bSuccessor, successorBytes);
        repin(changed.upstreamBindings.phase8bPlotMetadata, metadataBytes);
        expect(new TextDecoder().decode(metadataBytes)).toContain('"unregistered":true');
        expect(() => phase9MvPreflight(changed, freshShelf(), successorBytes, metadataBytes)).toThrow(/metadata row artifact keys differ/u);
      }],
      ["SD71-maximum-Re-injected", () => {
        const metadataBytes = mutateJsonl(freshMetadata(), (rows) => {
          const row = rows.find((entry) => entry.selectionId === "P8B-P1-SD71-M11")!;
          (row.conditions as Record<string, unknown>).maximumReynoldsUpperBound = 1;
        });
        const successorBytes = rebindSuccessorMetadataArtifact(freshSuccessor(), metadataBytes);
        const changed = clone(frozen);
        repin(changed.upstreamBindings.phase8bSuccessor, successorBytes);
        repin(changed.upstreamBindings.phase8bPlotMetadata, metadataBytes);
        expect(new TextDecoder().decode(metadataBytes)).toContain('"maximumReynoldsUpperBound":1');
        expect(() => phase9MvPreflight(changed, freshShelf(), successorBytes, metadataBytes)).toThrow(/census differs/u);
      }],
      ["absolute-block-state-change", () => {
        const changed = clone(frozen);
        (changed.absoluteEligibility as { state: string }).state = "eligible";
        expect(() => phase9MvPreflight(changed, freshShelf(), freshSuccessor(), freshMetadata())).toThrow(/absolute eligibility block differs/u);
      }],
    ];
    expect(cases.map(([name]) => name)).toEqual(PHASE9_MV_PREFLIGHT_MUTATIONS);
    for (const [, execute] of cases) execute();
  });
});
