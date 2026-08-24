import { describe, expect, it } from "vitest";
import { strictJsonSnapshot } from "../src/gate4-evidence.ts";
import {
  parsePhase10C0VAnyLayerNonpassControlReceiptBytes,
  parsePhase10C0VResourceLedger,
  parsePhase10C0VTerminalTable,
} from "../src/phase10-c0v-s6-aggregate-contracts.ts";
import {
  independentlyReprovePhase10C0VAnyLayerNonpass,
} from "../src/phase10-c0v-s6-aggregate-verifier.ts";
import {
  phase10C0VS6ArtifactIdentity,
  phase10C0VS6PrettyJsonBytes,
} from "../src/phase10-c0v-s6-execution-contracts.ts";
import { phase10C0VS6ImportClosure } from "../src/phase10-c0v-s6-import-audit.ts";

function bytes(value: unknown): Uint8Array {
  return phase10C0VS6PrettyJsonBytes(strictJsonSnapshot(value));
}

type DeepMutable<T> = T extends readonly (infer Item)[]
  ? DeepMutable<Item>[]
  : T extends object
    ? { -readonly [Key in keyof T]: DeepMutable<T[Key]> }
    : T;

function mutable<T>(value: T): DeepMutable<T> {
  return structuredClone(value) as DeepMutable<T>;
}

function syntheticControlBytes(): Uint8Array {
  const boundary = {
    allowed: ["synthetic-aggregate-negative-control"],
    forbidden: ["evidence-credit", "qualification-credit"],
  };
  const row = (layerId: "C0V-RADIAL" | "C0V-STATIC" | "C0V-MOVING-EVENT") => {
    const stem = layerId === "C0V-RADIAL" ? "radial" : layerId === "C0V-STATIC" ? "static" : "moving";
    return {
      layerId,
      branch: "independent-reference",
      terminalStatus: "pass",
      result: phase10C0VS6ArtifactIdentity(
        `out/phase10-execution-v2/fixtures/c0v-aggregate/synthetic-${stem}-result.json`,
        new TextEncoder().encode(`phase10-c0v-synthetic-${stem}-pass-v1\n`),
      ),
      scientificDisposition: "pass",
      negativeControlDisposition: "pass",
      resourceDisposition: "within-cap",
      claimBoundary: boundary,
    };
  };
  const cleanRows = [row("C0V-RADIAL"), row("C0V-STATIC"), row("C0V-MOVING-EVENT")];
  const cleanTable = {
    schema: "phase10-c0v-terminal-table-v1",
    tableId: "c0v-terminal-table-synthetic-all-pass-v1",
    rows: cleanRows,
    allThreeTerminal: true,
    allIndependentReferences: true,
    allLayersPass: true,
    aggregateStatus: "pass",
  };
  const mutatedTable = {
    ...cleanTable,
    tableId: "c0v-terminal-table-synthetic-radial-refusal-v1",
    rows: [{ ...cleanRows[0], scientificDisposition: "refusal" }, cleanRows[1], cleanRows[2]],
    allLayersPass: false,
    aggregateStatus: "non-pass",
  };
  return bytes({
    schema: "phase10-c0v-any-layer-nonpass-control-v1",
    negativeControlId: "nc-c0v-any-layer-nonpass",
    ownerCheckId: "chk-c0v-any-layer-nonpass",
    callableId: "phase10-nc-c0v-any-layer-nonpass",
    cleanTable,
    mutatedLayerId: "C0V-RADIAL",
    mutatedTable,
    mutation: {
      field: "scientificDisposition",
      before: "pass",
      after: "refusal",
      changedRowCount: 1,
      otherRowsUnchanged: true,
    },
    cleanOutcome: {
      aggregateStatus: "pass",
      packageCompletionEligible: true,
      dependentQualificationBlocked: false,
    },
    attackedOutcome: {
      aggregateStatus: "non-pass",
      packageCompletionEligible: true,
      dependentQualificationBlocked: true,
    },
    result: {
      negativeControlId: "nc-c0v-any-layer-nonpass",
      mutationExecuted: true,
      witnessMoved: true,
      cleanCapturePreserved: true,
      attackedCheckFailed: true,
      pass: true,
    },
  });
}

describe("Phase 10 C0V S6 aggregate", () => {
  it("independently re-proves the exact one-layer non-pass mutation", () => {
    const receiptBytes = syntheticControlBytes();
    const parsed = parsePhase10C0VAnyLayerNonpassControlReceiptBytes(receiptBytes);
    const reproof = independentlyReprovePhase10C0VAnyLayerNonpass(receiptBytes);

    expect(parsed.cleanOutcome).toEqual({
      aggregateStatus: "pass",
      packageCompletionEligible: true,
      dependentQualificationBlocked: false,
    });
    expect(parsed.attackedOutcome).toEqual({
      aggregateStatus: "non-pass",
      packageCompletionEligible: true,
      dependentQualificationBlocked: true,
    });
    expect(parsed.cleanTable.rows.map((entry) => entry.scientificDisposition)).toEqual([
      "pass", "pass", "pass",
    ]);
    expect(parsed.mutatedTable.rows.map((entry) => entry.scientificDisposition)).toEqual([
      "refusal", "pass", "pass",
    ]);
    expect(reproof.result).toEqual({
      negativeControlId: "nc-c0v-any-layer-nonpass",
      mutationExecuted: true,
      witnessMoved: true,
      cleanCapturePreserved: true,
      attackedCheckFailed: true,
      pass: true,
    });
  });

  it("rejects a mutator-authored outcome and any second changed row", () => {
    const clean = parsePhase10C0VAnyLayerNonpassControlReceiptBytes(
      syntheticControlBytes(),
    );
    const forgedOutcome = mutable(clean);
    forgedOutcome.attackedOutcome.aggregateStatus = "pass";
    expect(() => independentlyReprovePhase10C0VAnyLayerNonpass(bytes(forgedOutcome))).toThrow(
      /attacked outcome/i,
    );

    const secondMutation = mutable(clean);
    secondMutation.mutatedTable.rows[1]!.scientificDisposition = "refusal";
    expect(() => independentlyReprovePhase10C0VAnyLayerNonpass(bytes(secondMutation))).toThrow(
      /mutated table/i,
    );
  });

  it("rejects unknown fields, wrong table identities, and reordered layers", () => {
    const clean = parsePhase10C0VAnyLayerNonpassControlReceiptBytes(
      syntheticControlBytes(),
    );
    const extra = { ...mutable(clean), inheritedVerdict: "pass" };
    expect(() => parsePhase10C0VAnyLayerNonpassControlReceiptBytes(bytes(extra))).toThrow(/fields differ/i);
    expect(() => parsePhase10C0VTerminalTable(clean.cleanTable)).toThrow(/tableId/i);

    const reordered = mutable(clean);
    const first = reordered.cleanTable.rows[0]!;
    reordered.cleanTable.rows[0] = reordered.cleanTable.rows[1]!;
    reordered.cleanTable.rows[1] = first;
    expect(() => parsePhase10C0VAnyLayerNonpassControlReceiptBytes(bytes(reordered))).toThrow(/layerId/i);
  });

  it("recomputes the produce-attempt subtotal and never accepts self-authored totals", () => {
    const packetIds = ["c0v-radial-produce", "c0v-static-produce", "c0v-moving-produce"] as const;
    const dispositions = [
      "production-complete", "preimplementation-reference-refusal", "reference-discrepancy-refusal",
    ] as const;
    const elapsed = [3_600_000_000_000, 7_200_000_000_000, 10_800_000_000_000] as const;
    const attempts = packetIds.map((packetId, index) => ({
      packetId,
      attemptId: `${packetId}-20260822-v1`,
      attemptLedger: phase10C0VS6ArtifactIdentity(
        `evidence/phase10-numerical-verification-v1/${packetId}-attempts.jsonl`,
        new TextEncoder().encode(packetId),
      ),
      terminalStatus: index === 0 ? "pass" : "refusal",
      dispositionCode: dispositions[index],
      governedInvocationElapsedNanoseconds: elapsed[index],
      processHours: elapsed[index]! / 3_600_000_000_000,
      maximumObservedConcurrentBytes: (index + 1) * 1024,
      terminalRetainedBytes: (index + 1) * 512,
    }));
    const ledger = {
      schema: "phase10-c0v-resource-ledger-v1",
      ledgerId: "c0v-resource-ledger-v1",
      requiredRuntime: "Node v24.13.1",
      perInvocationWallHoursMaximum: 4,
      packageProcessHoursMaximum: 24,
      solverControlProcessConcurrency: 1,
      scratchRetainedGiBMaximum: 64,
      attempts,
      totals: {
        governedInvocationElapsedNanoseconds: 21_600_000_000_000,
        processHours: 6,
        maximumObservedConcurrentBytes: 3072,
        terminalRetainedBytes: 3072,
      },
      capExceeded: false,
      disposition: "within-cap",
    };
    expect(parsePhase10C0VResourceLedger(ledger).totals.processHours).toBe(6);
    const forged = mutable(ledger);
    forged.totals.terminalRetainedBytes += 1;
    expect(() => parsePhase10C0VResourceLedger(forged)).toThrow(/totals differ/i);
  });

  it("keeps aggregate producers outside the independent evaluator closure", () => {
    const root = process.cwd();
    const producer = phase10C0VS6ImportClosure(root, "runner/src/phase10-c0v-s6-aggregate.ts");
    const evaluator = phase10C0VS6ImportClosure(root, "runner/src/phase10-c0v-s6-aggregate-verifier.ts");
    const caller = phase10C0VS6ImportClosure(root, "runner/src/phase10-c0v-s6-aggregate-checks.ts");
    const paths = (receipt: typeof producer): readonly string[] => receipt.closure.map((entry) => entry.path);

    expect(paths(producer)).not.toContain("runner/src/phase10-c0v-s6-aggregate-verifier.ts");
    expect(paths(producer)).not.toContain("runner/src/phase10-c0v-s6-aggregate-checks.ts");
    expect(paths(evaluator)).not.toContain("runner/src/phase10-c0v-s6-aggregate.ts");
    expect(paths(caller)).toContain("runner/src/phase10-c0v-s6-aggregate-verifier.ts");
  });
});
