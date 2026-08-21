import type { Phase10C0ExecutionProvenance } from "./phase10-c0-contracts.ts";
import {
  independentlyEvaluatePhase10C0Derive,
  type Phase10C0EvaluatorExecution,
} from "./phase10-c0-independent.ts";
import { writePhase10C0DeriveVerificationReceipt } from "./phase10-c0-derive-verification-receipt.ts";
import { phase10C0PublicationVerifier } from "./phase10-c0-publication-verifier.ts";
import { writePhase10C0PublishVerificationReceipt } from "./phase10-c0-publish-verification-receipt.ts";

export interface Phase10C0CandidateFileBytes {
  readonly [fileName: string]: Uint8Array;
}

export interface Phase10C0DerivePublicationVerificationContext {
  readonly packetId: "c0-derive";
  readonly scienceProtocolBytes: Uint8Array;
  readonly packetProtocolBytes: Uint8Array;
  readonly callableRegistryBytes: Uint8Array;
  readonly preflightReceiptBytes: Uint8Array;
  readonly rowsBytes: Uint8Array;
  readonly historicalReportBytes: Uint8Array;
  readonly evaluatorExecution: Phase10C0EvaluatorExecution;
  readonly evaluatorCwd: string;
  readonly enforceFrozenInputIdentities?: boolean;
}

export interface Phase10C0PublishPublicationVerificationContext {
  readonly packetId: "c0-publish";
  readonly scienceProtocolBytes: Uint8Array;
  readonly packetProtocolBytes: Uint8Array;
  readonly callableRegistryBytes: Uint8Array;
  readonly preflightReceiptBytes: Uint8Array;
  readonly evaluatorModuleBytes: Uint8Array;
  readonly execution: Phase10C0ExecutionProvenance;
}

export type Phase10C0PublicationVerificationContext =
  | Phase10C0DerivePublicationVerificationContext
  | Phase10C0PublishPublicationVerificationContext;

function fail(message: string): never {
  throw new Error(`Phase 10 C0 publication guard refused: ${message}`);
}

function required(files: Phase10C0CandidateFileBytes, fileName: string): Uint8Array {
  const bytes = files[fileName];
  if (bytes === undefined) fail(`candidate lacks ${fileName}`);
  return bytes;
}

function sameBytes(left: Uint8Array, right: Uint8Array): boolean {
  return left.byteLength === right.byteLength && left.every((value, index) => value === right[index]);
}

/** Re-run the registered evaluator and receipt writer over the exact candidate bytes. */
export function phase10C0ValidateCandidateVerification(
  context: Phase10C0PublicationVerificationContext,
  files: Phase10C0CandidateFileBytes,
): void {
  if (context.packetId === "c0-derive") {
    const evaluation = independentlyEvaluatePhase10C0Derive({
      scienceProtocolBytes: context.scienceProtocolBytes,
      preflightReceiptBytes: context.preflightReceiptBytes,
      historicalReportBytes: context.historicalReportBytes,
      candidate: {
        rowsBytes: context.rowsBytes,
        analysisBytes: required(files, "c0-analysis.json"),
        comparisonsBytes: required(files, "c0-comparisons.jsonl"),
        gapsBytes: required(files, "c0-target-field-gaps.json"),
        historicalLimitBytes: required(files, "c0-historical-verifier-limit.json"),
      },
      evaluatorExecution: context.evaluatorExecution,
      evaluatorCwd: context.evaluatorCwd,
      enforceFrozenInputIdentities: context.enforceFrozenInputIdentities,
    });
    const expected = writePhase10C0DeriveVerificationReceipt({
      packetProtocolBytes: context.packetProtocolBytes,
      callableRegistryBytes: context.callableRegistryBytes,
      preflightReceiptBytes: context.preflightReceiptBytes,
      evaluation,
      execution: context.evaluatorExecution,
      evaluatorCwd: context.evaluatorCwd,
    });
    if (!sameBytes(expected, required(files, "c0-derive-verification.json"))) {
      fail("derive verification is stale, forged, or not derived from the co-published bytes");
    }
    return;
  }
  const evaluation = phase10C0PublicationVerifier({
    scienceProtocolBytes: context.scienceProtocolBytes,
    preflightReceiptBytes: context.preflightReceiptBytes,
    candidate: {
      analysisBytes: required(files, "c0-analysis.json"),
      comparisonsBytes: required(files, "c0-comparisons.jsonl"),
      gapsBytes: required(files, "c0-target-field-gaps.json"),
      historicalLimitBytes: required(files, "c0-historical-verifier-limit.json"),
      artifactIndexBytes: required(files, "c0-artifact-index.json"),
      reportBytes: required(files, "c0-report.json"),
    },
    execution: context.execution,
  });
  const expected = writePhase10C0PublishVerificationReceipt({
    packetProtocolBytes: context.packetProtocolBytes,
    callableRegistryBytes: context.callableRegistryBytes,
    evaluatorModuleBytes: context.evaluatorModuleBytes,
    preflightReceiptBytes: context.preflightReceiptBytes,
    evaluation,
    execution: context.execution,
  });
  if (!sameBytes(expected, required(files, "c0-verification.json"))) {
    fail("publication verification is stale, forged, or not derived from the co-published bytes");
  }
}
