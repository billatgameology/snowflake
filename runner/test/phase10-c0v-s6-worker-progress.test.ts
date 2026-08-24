import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import type {
  Phase10C0VS6WorkerProgressContract,
} from "../src/phase10-c0v-s6-contracts.ts";
import {
  parsePhase10C0VS6WorkerProgress,
  phase10C0VS6ArtifactIdentity,
  phase10C0VS6WorkerProgressBytes,
  type Phase10C0VS6AttemptRowV2,
  type Phase10C0VS6ExecutableInvocationRecord,
  type Phase10C0VS6RegisteredExecutableInvocationRoster,
  type Phase10C0VS6WorkerProgressRecord,
} from "../src/phase10-c0v-s6-execution-contracts.ts";
import {
  phase10C0VS6PhysicalRepositoryRoot,
} from "../src/phase10-c0v-s6-filesystem.ts";
import {
  independentlyEvaluatePhase10C0VS6WorkerProgress,
  phase10C0VS6CreateWorkerProgressEventLog,
  phase10C0VS6ReopenWorkerProgressEventLog,
} from "../src/phase10-c0v-s6-worker-progress.ts";

const temporaryRoots: string[] = [];

function temporaryRoot(label: string): string {
  const parent = resolve(process.cwd(), "out", "phase10-c0v-s6-worker-progress-tests");
  mkdirSync(parent, { recursive: true });
  const root = join(parent, `${label}-${process.pid}-${temporaryRoots.length}`);
  rmSync(root, { recursive: true, force: true });
  mkdirSync(root, { recursive: false });
  temporaryRoots.push(root);
  return root;
}

afterEach(() => {
  for (const root of temporaryRoots.splice(0)) rmSync(root, { recursive: true, force: true });
});

function row(
  sequence: number,
  event: Phase10C0VS6WorkerProgressRecord["event"],
  terminalState: Phase10C0VS6WorkerProgressRecord["terminalState"],
  candidate: { readonly byteLength: number; readonly sha256: string } | null = null,
): Phase10C0VS6WorkerProgressRecord {
  const invocationBoundary = event === "invocation-started" || event === "invocation-finished";
  return Object.freeze({
    schema: "phase10-c0v-worker-progress-row-v1",
    sequence,
    observedAt: `2026-08-22T00:00:0${sequence}.000Z`,
    event,
    invocationId: invocationBoundary ? "inv-c0v-radial-producer" : null,
    caseId: null,
    startedCaseIds: Object.freeze([]),
    completedCaseIds: Object.freeze([]),
    activeCaseId: null,
    completedNumericFieldValueCount: 0,
    completedUniformFieldValueCount: 0,
    candidateByteLength: candidate?.byteLength ?? 0,
    candidateSha256: candidate?.sha256 ?? null,
    terminalState,
  });
}

function progressRows(
  stoppedState: "complete" | "registered-cap" | "infrastructure-failure",
  invocationState: "complete" | "registered-cap" = "complete",
): readonly Phase10C0VS6WorkerProgressRecord[] {
  return Object.freeze([
    row(0, "worker-started", "running"),
    row(1, "invocation-started", "running"),
    row(2, "invocation-finished", invocationState),
    row(3, "worker-stopped", stoppedState),
  ]);
}

function midCaseProductionCapRows(): readonly Phase10C0VS6WorkerProgressRecord[] {
  const activeCaseId = "radial-mid-case-cap";
  const preserveActive = (record: Phase10C0VS6WorkerProgressRecord) => Object.freeze({
    ...record,
    startedCaseIds: Object.freeze([activeCaseId]),
    completedCaseIds: Object.freeze([]),
    activeCaseId,
  });
  return Object.freeze([
    row(0, "worker-started", "running"),
    row(1, "invocation-started", "running"),
    preserveActive(Object.freeze({
      ...row(2, "case-started", "running"),
      invocationId: "inv-c0v-radial-producer",
      caseId: activeCaseId,
    })),
    preserveActive(row(3, "invocation-finished", "registered-cap")),
    preserveActive(row(4, "worker-stopped", "registered-cap")),
  ]);
}

describe("Phase 10 C0V S6 parent-owned worker progress", () => {
  it("preserves the active case through a coherent mid-case production cap", () => {
    const records = midCaseProductionCapRows();
    const bytes = phase10C0VS6WorkerProgressBytes(records);
    const parsed = parsePhase10C0VS6WorkerProgress(Object.freeze({
      artifact: phase10C0VS6ArtifactIdentity("out/attempt/worker-progress.jsonl", bytes),
      records,
    }));
    expect(parsed.records.at(-2)).toMatchObject({
      event: "invocation-finished",
      caseId: null,
      activeCaseId: "radial-mid-case-cap",
      terminalState: "registered-cap",
    });
    expect(parsed.records.at(-1)).toMatchObject({
      event: "worker-stopped",
      caseId: null,
      activeCaseId: "radial-mid-case-cap",
      terminalState: "registered-cap",
    });

    const rootPath = temporaryRoot("mid-case-cap");
    const root = phase10C0VS6PhysicalRepositoryRoot(rootPath);
    const writer = phase10C0VS6CreateWorkerProgressEventLog(
      root,
      "out/attempt/worker-progress.jsonl",
      records[0]!,
    );
    for (const record of records.slice(1)) writer.append(record);
    expect(writer.closeAndReopen().records).toEqual(records);

    const erased = records.map((record) => record.event === "invocation-finished"
      ? Object.freeze({ ...record, activeCaseId: null })
      : record);
    expect(() => parsePhase10C0VS6WorkerProgress(Object.freeze({
      artifact: phase10C0VS6ArtifactIdentity("out/attempt/worker-progress.jsonl", bytes),
      records: Object.freeze(erased),
    }))).toThrow(/activeCaseId/u);
  });

  it("durably appends compact rows and binds the first candidate marker to live reopened bytes", () => {
    const rootPath = temporaryRoot("append");
    const root = phase10C0VS6PhysicalRepositoryRoot(rootPath);
    const progressPath = "out/attempt/worker-progress.jsonl";
    const candidatePath = "out/attempt/candidate/c0v-radial-witness.bin";
    const candidateBytes = new Uint8Array([11, 23, 37, 41]);
    mkdirSync(resolve(rootPath, "out/attempt/candidate"), { recursive: true });
    writeFileSync(resolve(rootPath, candidatePath), candidateBytes, { flag: "wx" });
    const candidate = phase10C0VS6ArtifactIdentity(candidatePath, candidateBytes);
    const records = Object.freeze([
      row(0, "worker-started", "running"),
      row(1, "invocation-started", "running"),
      row(2, "invocation-finished", "complete", candidate),
      row(3, "worker-stopped", "complete", candidate),
    ]);
    const writer = phase10C0VS6CreateWorkerProgressEventLog(root, progressPath, records[0]!);
    writer.append(records[1]!);
    writer.append(records[2]!, candidate);
    writer.append(records[3]!);
    const closed = writer.closeAndReopen();
    expect(closed.records).toEqual(records);
    expect(closed.bytes).toEqual(phase10C0VS6WorkerProgressBytes(records));
    expect(phase10C0VS6ReopenWorkerProgressEventLog(root, closed.identity).records).toEqual(records);
    expect(() => writer.append(records[3]!)).toThrow(/closed/u);
    expect(() => writer.closeAndReopen()).toThrow(/already closed/u);
    expect(() => phase10C0VS6CreateWorkerProgressEventLog(root, progressPath, records[0]!))
      .toThrow(/append resume is forbidden/u);

    writeFileSync(resolve(rootPath, progressPath), "{}\n", { flag: "a" });
    expect(() => phase10C0VS6ReopenWorkerProgressEventLog(root, closed.identity))
      .toThrow(/immutable worker progress event log/u);
  });

  it("rejects sequence, transition, and unbacked or drifted candidate markers before append", () => {
    const rootPath = temporaryRoot("append-attacks");
    const root = phase10C0VS6PhysicalRepositoryRoot(rootPath);
    const progressPath = "out/attempt/worker-progress.jsonl";
    const candidatePath = "out/attempt/candidate/c0v-radial-witness.bin";
    const candidateBytes = new Uint8Array([2, 3, 5, 7]);
    mkdirSync(resolve(rootPath, "out/attempt/candidate"), { recursive: true });
    writeFileSync(resolve(rootPath, candidatePath), candidateBytes, { flag: "wx" });
    const candidate = phase10C0VS6ArtifactIdentity(candidatePath, candidateBytes);
    const writer = phase10C0VS6CreateWorkerProgressEventLog(
      root,
      progressPath,
      row(0, "worker-started", "running"),
    );
    expect(() => writer.append(row(2, "invocation-started", "running"))).toThrow(/contiguous index 1/u);
    writer.append(row(1, "invocation-started", "running"));
    expect(() => writer.append(row(2, "worker-stopped", "complete"))).toThrow(/closed invocation state/u);
    const retained = row(2, "invocation-finished", "complete", candidate);
    expect(() => writer.append(retained)).toThrow(/reopened identity/u);
    writeFileSync(resolve(rootPath, candidatePath), new Uint8Array([13]), { flag: "w" });
    expect(() => writer.append(retained, candidate)).toThrow(/newly retained candidate/u);
    writeFileSync(resolve(rootPath, candidatePath), candidateBytes, { flag: "w" });
    writer.append(retained, candidate);
    expect(() => writer.append(row(3, "worker-stopped", "complete")))
      .toThrow(/mutates or removes/u);
    writer.append(row(3, "worker-stopped", "complete", candidate));
    writer.closeAndReopen();
  });

  it.each([
    ["complete", "complete"],
    ["registered-cap", "registered-cap"],
  ] as const)("retains infrastructure stop after a closed %s leaf", (invocationState, _label) => {
    const records = progressRows("infrastructure-failure", invocationState);
    const bytes = phase10C0VS6WorkerProgressBytes(records);
    const progress = parsePhase10C0VS6WorkerProgress(Object.freeze({
      artifact: phase10C0VS6ArtifactIdentity("out/attempt/worker-progress.jsonl", bytes),
      records,
    }));
    expect(progress.records.at(-1)?.terminalState).toBe("infrastructure-failure");
  });

  it("rejects an infrastructure-stopped raw stream when a claim-bearing attempt tries to consume it", () => {
    const records = progressRows("infrastructure-failure");
    const bytes = phase10C0VS6WorkerProgressBytes(records);
    const progress = parsePhase10C0VS6WorkerProgress(Object.freeze({
      artifact: phase10C0VS6ArtifactIdentity("out/attempt/worker-progress.jsonl", bytes),
      records,
    }));
    const invocation: Phase10C0VS6ExecutableInvocationRecord = Object.freeze({
      invocationId: "inv-c0v-radial-producer",
      callableId: "phase10-c0v-radial-producer",
      negativeControlId: null,
      invocationClass: "solver-production",
      startedAt: records[1]!.observedAt,
      finishedAt: records[2]!.observedAt,
      elapsedNanoseconds: 1_000_000_000,
      wallSeconds: 1,
      registeredWallSecondsMaximum: 300,
      terminalState: "complete",
    });
    const attempt = Object.freeze({
      workerProgress: progress,
      executableInvocationRecords: Object.freeze([invocation]),
      dispositionCode: "production-complete",
    }) as unknown as Phase10C0VS6AttemptRowV2;
    const contract = Object.freeze({
      filename: "worker-progress.jsonl",
      caseOrder: Object.freeze([]),
      completedFieldValueCounts: Object.freeze([]),
    }) as unknown as Phase10C0VS6WorkerProgressContract;
    const roster = Object.freeze({
      tupleId: "synthetic-complete",
      completionRule: "complete-roster",
      prefixOfTupleId: null,
      invocations: Object.freeze([Object.freeze({
        invocationId: invocation.invocationId,
        callableId: invocation.callableId,
        negativeControlId: null,
        invocationClass: invocation.invocationClass,
        registeredWallSecondsMaximum: invocation.registeredWallSecondsMaximum,
        terminalState: "complete",
      })]),
    }) as Phase10C0VS6RegisteredExecutableInvocationRoster;
    expect(() => independentlyEvaluatePhase10C0VS6WorkerProgress(
      attempt,
      contract,
      roster,
      Object.freeze({
        workerStartedAt: records[0]!.observedAt,
        workerStoppedAt: records[3]!.observedAt,
        workerElapsedNanoseconds: 3_000_000_000,
        invocationRecords: Object.freeze([invocation]),
      }),
      null,
    )).toThrow(/claim-bearing worker progress ends in infrastructure failure/u);
  });
});
