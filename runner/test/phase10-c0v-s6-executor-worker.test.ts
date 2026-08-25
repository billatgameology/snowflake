import { Buffer } from "node:buffer";
import { spawnSync } from "node:child_process";
import {
  env as processEnvironment,
  execArgv as processExecArguments,
  execPath as nodeExecutablePath,
  platform as processPlatform,
} from "node:process";
import { fileURLToPath } from "node:url";
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type StopPolicy = "none" | "wrong-finite-start-ack" | "withhold-finite-complete" |
  "withhold-finite-artifact";

const harness = vi.hoisted(() => ({
  input: [] as number[],
  stdoutPending: [] as number[],
  messages: [] as Array<Record<string, unknown>>,
  inputSequence: 0,
  stopPolicy: "none" as StopPolicy,
  witnessBytes: new Uint8Array([1, 2, 3, 4]),
  summaryBytes: new TextEncoder().encode("{}\n"),
}));

function command(
  kind: "invoke" | "acknowledge" | "stop",
  invocationId: string | null,
  acknowledgedWorkerSequence: number | null = null,
): void {
  const value = {
    schema: "phase10-c0v-s6-worker-command-v1",
    sequence: harness.inputSequence++,
    packetId: "c0v-radial-produce",
    attemptId: "c0v-radial-produce-20260822-v1",
    kind,
    invocationId,
    acknowledgedWorkerSequence,
  };
  harness.input.push(...new TextEncoder().encode(`${JSON.stringify(value)}\n`));
}

function reactToWorkerMessage(message: Record<string, unknown>): void {
  harness.messages.push(message);
  const kind = message.kind;
  const invocationId = message.invocationId;
  const payload = message.payload as Record<string, unknown> | null;
  if (kind === "ready") {
    command("invoke", "inv-c0v-radial-production");
    return;
  }
  if (kind === "result" && invocationId === "inv-c0v-radial-production") {
    command("invoke", "inv-c0v-radial-evaluator");
    return;
  }
  if (kind === "boundary") {
    const negativeControlId = payload?.negativeControlId;
    const stage = payload?.stage;
    if (negativeControlId === "nc-radial-finite-shell-term" && stage === "start" &&
      harness.stopPolicy === "wrong-finite-start-ack") {
      command("acknowledge", "inv-c0v-radial-evaluator", message.sequence as number);
      return;
    }
    if (negativeControlId === "nc-radial-finite-shell-term" && stage === "complete" &&
      harness.stopPolicy === "withhold-finite-complete") return;
    command("acknowledge", invocationId as string, message.sequence as number);
    return;
  }
  if (kind === "artifact") {
    if (payload?.negativeControlId === "nc-radial-finite-shell-term" &&
      harness.stopPolicy === "withhold-finite-artifact") return;
    command("acknowledge", invocationId as string, message.sequence as number);
    return;
  }
  if (kind === "result" && invocationId === "inv-c0v-radial-evaluator") {
    command("stop", null);
  }
}

vi.mock("node:fs", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:fs")>();
  return {
    ...actual,
    readSync(fd: number, buffer: Uint8Array, offset: number, length: number): number {
      if (fd !== 0) throw new Error(`unexpected test read descriptor ${fd}`);
      if (harness.input.length === 0) throw new Error("test parent withheld its acknowledgement");
      const count = Math.min(length, harness.input.length);
      buffer.set(harness.input.splice(0, count), offset);
      return count;
    },
    writeSync(
      fd: number,
      buffer: Uint8Array | string,
      offset = 0,
      length = typeof buffer === "string" ? Buffer.byteLength(buffer) : buffer.byteLength,
    ): number {
      if (fd !== 1 && fd !== 2) throw new Error(`unexpected test write descriptor ${fd}`);
      const bytes = typeof buffer === "string"
        ? new Uint8Array(Buffer.from(buffer, "utf8"))
        : new Uint8Array(buffer.buffer, buffer.byteOffset + offset, length);
      if (fd === 2) return bytes.byteLength;
      harness.stdoutPending.push(...bytes);
      while (true) {
        const newline = harness.stdoutPending.indexOf(0x0a);
        if (newline < 0) break;
        const line = harness.stdoutPending.splice(0, newline + 1);
        const parsed = JSON.parse(new TextDecoder().decode(new Uint8Array(line)).trim()) as Record<string, unknown>;
        reactToWorkerMessage(parsed);
      }
      return bytes.byteLength;
    },
  };
});

vi.mock("../src/phase10-c0v-s6-runtime-authority.ts", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../src/phase10-c0v-s6-runtime-authority.ts")>();
  return {
    ...actual,
    derivePhase10C0VS6RetainedRuntimeAuthority: () => ({
      preflight: {
        verdict: "pass",
        refusalCandidate: null,
        observed: {
          candidateDirectory:
    "out/phase10-execution-v2/recovery-v9/attempts/c0v-radial-produce/c0v-radial-produce-20260822-v1/candidate",
          command: "test-only-worker-dispatch",
          head: "0".repeat(40),
          resources: { observedFreeBytes: 1_000_000_000 },
        },
      },
    }),
  };
});

vi.mock("../src/phase10-c0v-s6-filesystem.ts", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../src/phase10-c0v-s6-filesystem.ts")>();
  return {
    ...actual,
    phase10C0VS6ReadUniquePhysicalFile(
      root: Parameters<typeof actual.phase10C0VS6ReadUniquePhysicalFile>[0],
      path: string,
    ): Uint8Array {
      if (path.endsWith("/preflight.json")) return new TextEncoder().encode("{}\n");
      if (path.endsWith("/c0v-radial-witness.bin")) return new Uint8Array(harness.witnessBytes);
      if (path.endsWith("/c0v-radial-producer-summary.json")) return new Uint8Array(harness.summaryBytes);
      return actual.phase10C0VS6ReadUniquePhysicalFile(root, path);
    },
  };
});

vi.mock("../src/phase10-c0v-radial-production.ts", () => ({
  producePhase10C0VRadialWitness: (input: {
    observeCaseBoundary(event: unknown): void;
  }) => {
    const cases = [
      ["radial-dr-0p7um", 21],
      ["radial-dr-0p35um", 40],
      ["radial-dr-0p175um", 80],
      ["radial-dr-0p0875um", 159],
    ] as const;
    cases.forEach(([caseId, expectedNodeCount], caseIndex) => {
      input.observeCaseBoundary({ stage: "start", caseIndex, caseId, expectedNodeCount });
      input.observeCaseBoundary({ stage: "complete", caseIndex, caseId, expectedNodeCount });
    });
    return {
      witnessBytes: new Uint8Array(harness.witnessBytes),
      producerSummary: {},
      producerSummaryBytes: new Uint8Array(harness.summaryBytes),
    };
  },
}));

vi.mock("../src/phase10-c0v-radial-checks.ts", () => ({
  phase10C0VRadialProduceCheckCaller: (input: {
    observeNegativeControlBoundary(event: unknown): void;
    observeNegativeControlProgress(event: unknown): void;
    observeNegativeControlArtifact(event: unknown): void;
  }) => {
    const controls = [
      ["nc-radial-finite-shell-term", "mutated-witness"],
      ["nc-radial-forged-summary", "mutated-summary"],
      ["nc-radial-robin-coefficient", "mutated-witness"],
    ] as const;
    for (const [negativeControlId, artifactKind] of controls) {
      input.observeNegativeControlBoundary({
        boundaryKind: "governed-leaf",
        stage: "start",
        negativeControlId,
        caseIndex: null,
        caseId: null,
      });
      if (negativeControlId === "nc-radial-robin-coefficient") {
        [
          "radial-dr-0p7um",
          "radial-dr-0p35um",
          "radial-dr-0p175um",
          "radial-dr-0p0875um",
        ].forEach((caseId, caseIndex) => {
          input.observeNegativeControlBoundary({
            boundaryKind: "internal-case",
            stage: "start",
            negativeControlId,
            caseIndex,
            caseId,
          });
          input.observeNegativeControlBoundary({
            boundaryKind: "internal-case",
            stage: "complete",
            negativeControlId,
            caseIndex,
            caseId,
          });
        });
      }
      input.observeNegativeControlProgress({
        negativeControlId,
        stage: "attacked-evaluation-complete",
      });
      input.observeNegativeControlProgress({
        negativeControlId,
        stage: "independent-proof-complete",
      });
      input.observeNegativeControlBoundary({
        boundaryKind: "governed-leaf",
        stage: "complete",
        negativeControlId,
        caseIndex: null,
        caseId: null,
      });
      input.observeNegativeControlArtifact({
        negativeControlId,
        artifactKind,
        artifact: {
          path: `out/test/${negativeControlId}.bin`,
          byteLength: 1,
          sha256: "0".repeat(64),
        },
        bytes: new Uint8Array([1]),
      });
    }
    return { schema: "test-radial-caller-result" };
  },
}));

import { phase10C0VS6ExecutorWorker } from "../src/phase10-c0v-s6-executor-worker.ts";
import {
  PHASE10_C0V_S6_EXACT_RUNTIME_ENVIRONMENT,
  phase10C0VS6ExactWorkerEnvironment,
} from
  "../src/phase10-c0v-s6-worker-transport.ts";

const repositoryRoot = fileURLToPath(new URL("../..", import.meta.url));
const originalRuntimeExecArguments = Object.freeze([...processExecArguments]);
const originalRuntimeEnvironmentEntries = Object.freeze(Object.entries(processEnvironment)
  .filter((entry): entry is [string, string] => entry[1] !== undefined));
const workerArguments = Object.freeze([
  "--repository-root", repositoryRoot,
  "--packet", "c0v-radial-produce",
      "--protocol", "research/phase10-execution-v2/recovery-v9/packets/c0v-radial-produce/protocol.json",
  "--attempt", "c0v-radial-produce-20260822-v1",
]);

function reset(policy: StopPolicy): void {
  harness.input.splice(0);
  harness.stdoutPending.splice(0);
  harness.messages.splice(0);
  harness.inputSequence = 0;
  harness.stopPolicy = policy;
}

function replaceRuntimeEnvironment(entries: readonly (readonly [string, string])[]): void {
  for (const key of Object.keys(processEnvironment)) delete processEnvironment[key];
  for (const [key, value] of entries) processEnvironment[key] = value;
}

function negativeControlTrace(): readonly string[] {
  return harness.messages
    .filter((entry) => entry.kind === "artifact" ||
      (entry.kind === "boundary" &&
        (entry.payload as Record<string, unknown>).boundaryKind === "governed-leaf"))
    .map((entry) => {
      const payload = entry.payload as Record<string, unknown>;
      return `${String(entry.invocationId)}:${String(entry.kind)}:${String(payload.stage ?? payload.artifactKind)}`;
    });
}

describe("Phase 10 C0V S6 real worker dispatcher ACK state machine", () => {
  beforeEach(() => {
    processExecArguments.splice(0, processExecArguments.length);
    replaceRuntimeEnvironment(PHASE10_C0V_S6_EXACT_RUNTIME_ENVIRONMENT
      .map((entry) => [entry.key, entry.value] as const));
    reset("none");
  });

  afterEach(() => {
    replaceRuntimeEnvironment(originalRuntimeEnvironmentEntries);
  });

  afterAll(() => {
    processExecArguments.splice(0, processExecArguments.length, ...originalRuntimeExecArguments);
  });

  it("materializes the exact 17-row environment in a real Windows Node child", () => {
    const expectedKeys = PHASE10_C0V_S6_EXACT_RUNTIME_ENVIRONMENT.map((entry) => entry.key);
    expect(expectedKeys).toHaveLength(17);
    expect(expectedKeys).toEqual([...expectedKeys].sort());
    if (processPlatform !== "win32") return;

    const childProgram = [
      "const entries = Object.entries(process.env)",
      ".sort(([left], [right]) => left < right ? -1 : left > right ? 1 : 0)",
      ".map(([key, value]) => ({ key, value }));",
      "process.stdout.write(JSON.stringify(entries));",
    ].join("");
    const child = spawnSync(nodeExecutablePath, ["--eval", childProgram], {
      cwd: repositoryRoot,
      encoding: "utf8",
      env: { ...phase10C0VS6ExactWorkerEnvironment(PHASE10_C0V_S6_EXACT_RUNTIME_ENVIRONMENT) },
      maxBuffer: 65_536,
      timeout: 10_000,
      windowsHide: true,
    });
    expect(child.error).toBeUndefined();
    expect(child.signal).toBeNull();
    expect(child.status).toBe(0);
    expect(child.stderr).toBe("");
    expect(JSON.parse(child.stdout)).toEqual(PHASE10_C0V_S6_EXACT_RUNTIME_ENVIRONMENT);
  });

  it("rejects any ambient row outside the exact parent-provided worker environment", () => {
    processEnvironment.PHASE10_C0V_S6_UNREGISTERED = "1";
    expect(() => phase10C0VS6ExecutorWorker(workerArguments)).toThrow(/environment differs/u);
    expect(harness.messages).toEqual([]);
  });

  it("requires exact NC-scoped ACKs and completes the three artifact barriers in order", () => {
    expect(() => phase10C0VS6ExecutorWorker(workerArguments)).not.toThrow();
    expect(harness.messages.filter((entry) => entry.kind === "ready" || entry.kind === "stopped"))
      .toHaveLength(2);
    expect(harness.messages.filter((entry) => entry.kind === "boundary" || entry.kind === "progress"))
      .toHaveLength(28);
    expect(harness.messages.filter((entry) => entry.kind === "artifact")).toHaveLength(3);
    expect(harness.messages.filter((entry) => entry.kind === "result")).toHaveLength(2);
    expect(negativeControlTrace()).toEqual([
      "inv-c0v-radial-nc-finite-shell-term:boundary:start",
      "inv-c0v-radial-nc-finite-shell-term:boundary:complete",
      "inv-c0v-radial-nc-finite-shell-term:artifact:mutated-witness",
      "inv-c0v-radial-nc-forged-summary:boundary:start",
      "inv-c0v-radial-nc-forged-summary:boundary:complete",
      "inv-c0v-radial-nc-forged-summary:artifact:mutated-summary",
      "inv-c0v-radial-nc-robin-coefficient:boundary:start",
      "inv-c0v-radial-nc-robin-coefficient:boundary:complete",
      "inv-c0v-radial-nc-robin-coefficient:artifact:mutated-witness",
    ]);
    expect(harness.messages.at(-1)?.kind).toBe("stopped");
  });

  it("rejects an evaluator-scoped ACK before entering the finite control", () => {
    reset("wrong-finite-start-ack");
    expect(() => phase10C0VS6ExecutorWorker(workerArguments)).toThrow(/acknowledgement differs/u);
    expect(negativeControlTrace()).toEqual([
      "inv-c0v-radial-nc-finite-shell-term:boundary:start",
    ]);
  });

  it("cannot emit the current artifact while its governed-complete ACK is withheld", () => {
    reset("withhold-finite-complete");
    expect(() => phase10C0VS6ExecutorWorker(workerArguments)).toThrow(/withheld its acknowledgement/u);
    expect(negativeControlTrace()).toEqual([
      "inv-c0v-radial-nc-finite-shell-term:boundary:start",
      "inv-c0v-radial-nc-finite-shell-term:boundary:complete",
    ]);
  });

  it("cannot enter the next control while the completed artifact ACK is withheld", () => {
    reset("withhold-finite-artifact");
    expect(() => phase10C0VS6ExecutorWorker(workerArguments)).toThrow(/withheld its acknowledgement/u);
    expect(negativeControlTrace()).toEqual([
      "inv-c0v-radial-nc-finite-shell-term:boundary:start",
      "inv-c0v-radial-nc-finite-shell-term:boundary:complete",
      "inv-c0v-radial-nc-finite-shell-term:artifact:mutated-witness",
    ]);
  });
});
