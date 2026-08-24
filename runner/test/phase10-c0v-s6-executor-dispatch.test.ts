import type { ChildProcessWithoutNullStreams } from "node:child_process";
import { EventEmitter } from "node:events";
import { env as processEnvironment, execArgv as processExecArguments } from "node:process";
import { PassThrough } from "node:stream";
import { fileURLToPath } from "node:url";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import {
  parsePhase10C0VS6PacketProtocol,
  parsePhase10C0VS6PrettyJsonBytes,
  type Phase10C0VS6PacketId,
} from "../src/phase10-c0v-s6-contracts.ts";
import {
  phase10C0VS6CheckExecutorConfiguration,
  phase10C0VS6ObserveWorkerProcessLifecycle,
  phase10C0VS6ParseExecutorArguments,
  phase10C0VS6RunExecutor,
} from "../src/phase10-c0v-s6-executor.ts";
import {
  phase10C0VS6CompiledWorkerInvocationRoster,
  phase10C0VS6ParseWorkerArguments,
} from "../src/phase10-c0v-s6-executor-worker.ts";
import {
  phase10C0VS6PhysicalRepositoryRoot,
  phase10C0VS6ReadUniquePhysicalFile,
} from "../src/phase10-c0v-s6-filesystem.ts";
import {
  PHASE10_C0V_S6_MAXIMUM_WORKER_STDERR_BYTES,
  Phase10C0VS6ParentWorkerOutput,
  type Phase10C0VS6ParentWorkerMessageByteBudget,
} from "../src/phase10-c0v-s6-parent-transport.ts";
import {
  PHASE10_C0V_S6_EXECUTOR_PACKET_AUTHORITY,
  PHASE10_C0V_S6_EXACT_RUNTIME_ENVIRONMENT,
  PHASE10_C0V_S6_MAXIMUM_WORKER_WIRE_LINE_BYTES,
  phase10C0VS6AssertExactRuntimeLoaderState,
  phase10C0VS6DecodeWorkerPayload,
  phase10C0VS6ExactWorkerEnvironment,
  phase10C0VS6ParseWorkerCommandLine,
  phase10C0VS6ParseWorkerMessageLine,
  phase10C0VS6WorkerCommandLine,
  phase10C0VS6WorkerMessageLine,
  type Phase10C0VS6WorkerCommand,
} from "../src/phase10-c0v-s6-worker-transport.ts";

const repositoryRoot = fileURLToPath(new URL("../..", import.meta.url));
const originalRuntimeExecArguments = Object.freeze([...processExecArguments]);
const runtimeNodeEnvironmentEntries = Object.freeze(Object.entries(processEnvironment)
  .filter(([key]) => /^(?:NODE(?:_|$)|TS_NODE(?:_|$))/iu.test(key)));
const packetIds = Object.freeze(Object.keys(
  PHASE10_C0V_S6_EXECUTOR_PACKET_AUTHORITY,
) as Phase10C0VS6PacketId[]);

function cli(packetId: Phase10C0VS6PacketId, mode: "check" | "run"): readonly string[] {
  const row = PHASE10_C0V_S6_EXECUTOR_PACKET_AUTHORITY[packetId];
  return Object.freeze([
    mode, "--packet", packetId, "--protocol", row.protocolPath, "--attempt", row.attemptId,
  ]);
}

describe("Phase 10 C0V S6 executor dispatch", () => {
  beforeEach(() => {
    processExecArguments.splice(0, processExecArguments.length);
    for (const key of Object.keys(processEnvironment)) {
      if (/^(?:NODE(?:_|$)|TS_NODE(?:_|$))/iu.test(key)) delete processEnvironment[key];
    }
  });

  afterAll(() => {
    processExecArguments.splice(0, processExecArguments.length, ...originalRuntimeExecArguments);
    for (const [key, value] of runtimeNodeEnvironmentEntries) processEnvironment[key] = value;
  });

  it("accepts exactly the compiled 16 public command tuples", () => {
    for (const packetId of packetIds) {
      for (const mode of ["check", "run"] as const) {
        expect(phase10C0VS6ParseExecutorArguments(cli(packetId, mode))).toEqual({
          mode,
          packetId,
          protocolPath: PHASE10_C0V_S6_EXECUTOR_PACKET_AUTHORITY[packetId].protocolPath,
          attemptId: PHASE10_C0V_S6_EXECUTOR_PACKET_AUTHORITY[packetId].attemptId,
        });
      }
    }
  });

  it("rejects reordered, extended, and cross-packet public command authority", () => {
    const valid = [...cli("a-p-c0v-s6", "check")];
    expect(() => phase10C0VS6ParseExecutorArguments([
      valid[0]!, valid[3]!, valid[4]!, valid[1]!, valid[2]!, valid[5]!, valid[6]!,
    ])).toThrow(/exact command shape/u);
    expect(() => phase10C0VS6ParseExecutorArguments([...valid, "--extra"])).toThrow(/exact command shape/u);
    expect(() => phase10C0VS6ParseExecutorArguments([
      ...valid.slice(0, 4),
      PHASE10_C0V_S6_EXECUTOR_PACKET_AUTHORITY["c0v-moving-produce"].protocolPath,
      ...valid.slice(5),
    ])).toThrow(/compiled packet authority/u);
    expect(() => phase10C0VS6ParseExecutorArguments([
      ...valid.slice(0, 6),
      PHASE10_C0V_S6_EXECUTOR_PACKET_AUTHORITY["c0v-moving-produce"].attemptId,
    ])).toThrow(/compiled packet authority/u);
  });

  it("performs static check inspection without claiming a preflight or run authority", () => {
    for (const packetId of packetIds) {
      const parsed = phase10C0VS6ParseExecutorArguments(cli(packetId, "check"));
      const result = phase10C0VS6CheckExecutorConfiguration(repositoryRoot, parsed);
      expect(result).toMatchObject({
        mode: "check",
        packetId,
        registeredAttemptId: PHASE10_C0V_S6_EXECUTOR_PACKET_AUTHORITY[packetId].attemptId,
        inspection: "configuration-valid-non-authorizing",
        preflightObserved: false,
        runAuthorized: false,
      });
      expect(result.limits).toContain("no-resource-or-mutable-dependency-observation");
      expect(result.executableNow).toBe(true);
    }
  });

  it("requires a physical repository before any ready run can open an attempt", async () => {
    for (const packetId of packetIds) {
      await expect(phase10C0VS6RunExecutor(cli(packetId, "run"), "Z:\\not-observed-before-freeze"))
        .rejects.toThrow(/ENOENT|repository root/u);
    }
  });

  it("rejects loader-capable parent state and materializes no ambient child value", () => {
    const originalExecArguments = [...processExecArguments];
    const originalNodeOptions = processEnvironment.Node_Options;
    const originalTsNodeProject = processEnvironment.tS_nOdE_PrOjEcT;
    try {
      processExecArguments.splice(0, processExecArguments.length);
      processExecArguments.push("--import=out/test-loader.mjs");
      expect(() => phase10C0VS6AssertExactRuntimeLoaderState()).toThrow(/execArgv/u);
      processExecArguments.splice(0, processExecArguments.length);

      processEnvironment.Node_Options = "--require=out/test-loader.cjs";
      expect(() => phase10C0VS6AssertExactRuntimeLoaderState()).toThrow(/Node loader keys/u);
      expect(phase10C0VS6ExactWorkerEnvironment(PHASE10_C0V_S6_EXACT_RUNTIME_ENVIRONMENT))
        .toEqual(Object.fromEntries(PHASE10_C0V_S6_EXACT_RUNTIME_ENVIRONMENT
          .map((entry) => [entry.key, entry.value])));
      delete processEnvironment.Node_Options;
      processEnvironment.tS_nOdE_PrOjEcT = "out/tsconfig.loader.json";
      expect(() => phase10C0VS6AssertExactRuntimeLoaderState()).toThrow(/Node loader keys/u);
      expect(() => phase10C0VS6ExactWorkerEnvironment(Object.freeze([
        ...PHASE10_C0V_S6_EXACT_RUNTIME_ENVIRONMENT.slice(0, -1),
        Object.freeze({ key: "SYSTEMROOT", value: "C:\\OTHER" }),
      ]))).toThrow(/exact compiled host roster/u);
    } finally {
      processExecArguments.splice(0, processExecArguments.length, ...originalExecArguments);
      if (originalNodeOptions === undefined) delete processEnvironment.Node_Options;
      else processEnvironment.Node_Options = originalNodeOptions;
      if (originalTsNodeProject === undefined) delete processEnvironment.tS_nOdE_PrOjEcT;
      else processEnvironment.tS_nOdE_PrOjEcT = originalTsNodeProject;
    }
  });

  it("accepts only the compiled internal worker arguments and protocol rosters", () => {
    const root = phase10C0VS6PhysicalRepositoryRoot(repositoryRoot);
    for (const packetId of packetIds) {
      const authority = PHASE10_C0V_S6_EXECUTOR_PACKET_AUTHORITY[packetId];
      const args = [
        "--repository-root", repositoryRoot,
        "--packet", packetId,
        "--protocol", authority.protocolPath,
        "--attempt", authority.attemptId,
      ];
      expect(phase10C0VS6ParseWorkerArguments(args)).toMatchObject({ packetId });
      const protocol = parsePhase10C0VS6PacketProtocol(parsePhase10C0VS6PrettyJsonBytes(
        phase10C0VS6ReadUniquePhysicalFile(root, authority.protocolPath),
        `${packetId} dispatch-test protocol`,
      ));
      expect(phase10C0VS6CompiledWorkerInvocationRoster(protocol).length).toBeGreaterThan(0);
      const other = packetId === "a-p-c0v-s6" ? "c0v-moving-produce" : "a-p-c0v-s6";
      expect(() => phase10C0VS6ParseWorkerArguments([
        ...args.slice(0, 5),
        PHASE10_C0V_S6_EXECUTOR_PACKET_AUTHORITY[other].protocolPath,
        ...args.slice(6),
      ])).toThrow(/compiled packet authority/u);
    }
  });
});

describe("Phase 10 C0V S6 blocking worker transport", () => {
  const scope = Object.freeze({ packetId: "a-p-c0v-s6" as const, attemptId: "a-p-c0v-s6-20260822-v1" });

  it("round-trips exact commands and recursive byte payloads", () => {
    const command: Phase10C0VS6WorkerCommand = Object.freeze({
      schema: "phase10-c0v-s6-worker-command-v1",
      sequence: 0,
      ...scope,
      kind: "invoke",
      invocationId: "inv-a-p-c0v-s6-nc-missing-producer",
      acknowledgedWorkerSequence: null,
    });
    const commandBytes = phase10C0VS6WorkerCommandLine(command, scope);
    expect(phase10C0VS6ParseWorkerCommandLine(commandBytes, 0, scope)).toEqual(command);

    const messageBytes = phase10C0VS6WorkerMessageLine(Object.freeze({
      schema: "phase10-c0v-s6-worker-message-v1" as const,
      sequence: 0,
      ...scope,
      kind: "result" as const,
      invocationId: command.invocationId,
      payload: Object.freeze({ nested: Object.freeze([new Uint8Array([0, 1, 254, 255])]) }),
    }), scope);
    const message = phase10C0VS6ParseWorkerMessageLine(messageBytes, 0, scope);
    const decoded = phase10C0VS6DecodeWorkerPayload(message.payload! as never) as {
      readonly nested: readonly Uint8Array[];
    };
    expect([...decoded.nested[0]!]).toEqual([0, 1, 254, 255]);
  });

  it("preserves an own __proto__ payload key without prototype mutation or field loss", () => {
    const payload = Object.create(null) as Record<string, unknown>;
    payload.__proto__ = 1;
    payload.ok = 2;
    const bytes = phase10C0VS6WorkerMessageLine(Object.freeze({
      schema: "phase10-c0v-s6-worker-message-v1" as const,
      sequence: 0,
      ...scope,
      kind: "result" as const,
      invocationId: "inv-a-p-c0v-s6-nc-missing-producer",
      payload,
    }), scope);
    const parsed = phase10C0VS6ParseWorkerMessageLine(bytes, 0, scope);
    const decoded = phase10C0VS6DecodeWorkerPayload(parsed.payload!) as Record<string, unknown>;
    expect(Object.prototype.hasOwnProperty.call(decoded, "__proto__")).toBe(true);
    expect(Object.keys(decoded)).toEqual(["__proto__", "ok"]);
    expect(decoded.__proto__).toBe(1);
    expect(Object.getPrototypeOf(decoded)).toBeNull();
  });

  it("rejects accessors, non-plain objects, and extended arrays without invoking accessors", () => {
    let accessorCalls = 0;
    const accessorPayload = Object.create(null) as Record<string, unknown>;
    Object.defineProperty(accessorPayload, "value", {
      enumerable: true,
      get: () => {
        accessorCalls += 1;
        return 1;
      },
    });
    const line = (payload: unknown) => phase10C0VS6WorkerMessageLine(Object.freeze({
      schema: "phase10-c0v-s6-worker-message-v1" as const,
      sequence: 0,
      ...scope,
      kind: "result" as const,
      invocationId: "inv-a-p-c0v-s6-nc-missing-producer",
      payload,
    }), scope);
    expect(() => line(accessorPayload)).toThrow(/enumerable data property/u);
    expect(accessorCalls).toBe(0);
    expect(() => line(new Date(0))).toThrow(/plain objects/u);

    const extendedArray = [1] as unknown[] & { extra?: number };
    extendedArray.extra = 2;
    expect(() => line(extendedArray)).toThrow(/dense without extra/u);
    const sparseArray = new Array(1);
    expect(() => line(sparseArray)).toThrow(/dense without extra/u);
  });

  it("rejects field-order, sequence, nullability, framing, and reserved-marker attacks", () => {
    const reordered = new TextEncoder().encode(
      '{"schema":"phase10-c0v-s6-worker-command-v1","sequence":0,' +
      '"attemptId":"a-p-c0v-s6-20260822-v1","packetId":"a-p-c0v-s6",' +
      '"kind":"invoke","invocationId":"inv-a-p-c0v-s6-nc-missing-producer",' +
      '"acknowledgedWorkerSequence":null}\n',
    );
    expect(() => phase10C0VS6ParseWorkerCommandLine(reordered, 0, scope)).toThrow(/field order/u);
    const valid = phase10C0VS6WorkerCommandLine(Object.freeze({
      schema: "phase10-c0v-s6-worker-command-v1",
      sequence: 0,
      ...scope,
      kind: "stop",
      invocationId: null,
      acknowledgedWorkerSequence: null,
    }), scope);
    expect(() => phase10C0VS6ParseWorkerCommandLine(valid, 1, scope)).toThrow(/sequence/u);
    expect(() => phase10C0VS6WorkerCommandLine(Object.freeze({
      schema: "phase10-c0v-s6-worker-command-v1",
      sequence: 0,
      ...scope,
      kind: "acknowledge",
      invocationId: "inv-a-p-c0v-s6-nc-missing-producer",
      acknowledgedWorkerSequence: null,
    }), scope)).toThrow(/nullability/u);
    expect(() => phase10C0VS6ParseWorkerCommandLine(
      new TextEncoder().encode(`${new TextDecoder().decode(valid).trim()}\r\n`), 0, scope,
    )).toThrow(/compact JSON line/u);
    expect(() => phase10C0VS6WorkerMessageLine(Object.freeze({
      schema: "phase10-c0v-s6-worker-message-v1" as const,
      sequence: 0,
      ...scope,
      kind: "result" as const,
      invocationId: "inv-a-p-c0v-s6-nc-missing-producer",
      payload: { $phase10C0VS6Bytes: "AA==" },
    }), scope)).toThrow(/reserved for Uint8Array/u);
  });

  it("rejects noncanonical byte markers and lines above the exact 32 MiB bound", () => {
    const noncanonical = new TextEncoder().encode(
      '{"schema":"phase10-c0v-s6-worker-message-v1","sequence":0,' +
      '"packetId":"a-p-c0v-s6","attemptId":"a-p-c0v-s6-20260822-v1",' +
      '"kind":"result","invocationId":"inv-a-p-c0v-s6-nc-missing-producer",' +
      '"payload":{"$phase10C0VS6Bytes":"AA"}}\n',
    );
    expect(() => phase10C0VS6ParseWorkerMessageLine(noncanonical, 0, scope)).toThrow(/canonical base64/u);
    const oversized = new Uint8Array(PHASE10_C0V_S6_MAXIMUM_WORKER_WIRE_LINE_BYTES + 1);
    oversized[oversized.length - 1] = 0x0a;
    expect(() => phase10C0VS6ParseWorkerMessageLine(oversized, 0, scope)).toThrow(/byte bound/u);
    expect(() => phase10C0VS6WorkerMessageLine(Object.freeze({
      schema: "phase10-c0v-s6-worker-message-v1" as const,
      sequence: 0,
      ...scope,
      kind: "result" as const,
      invocationId: "inv-a-p-c0v-s6-nc-missing-producer",
      payload: "x".repeat(PHASE10_C0V_S6_MAXIMUM_WORKER_WIRE_LINE_BYTES),
    }), scope)).toThrow(/wire line exceeds/u);
  });
});

describe("Phase 10 C0V S6 parent stream boundary", () => {
  const AP_MAXIMUM_STDOUT_BYTES = 4_194_304;

  it("distinguishes a true spawn failure from a post-spawn process error until raw close", async () => {
    const preSpawn = new EventEmitter();
    const preSpawnLifecycle = phase10C0VS6ObserveWorkerProcessLifecycle(
      preSpawn as unknown as Pick<ChildProcessWithoutNullStreams, "once" | "on">,
    );
    let preSpawnExitSettled = false;
    void preSpawnLifecycle.exit.then(() => {
      preSpawnExitSettled = true;
    });
    const spawnRefusal = expect(preSpawnLifecycle.spawned).rejects.toThrow(/synthetic spawn failure/u);
    preSpawn.emit("error", new Error("synthetic spawn failure"));
    await spawnRefusal;
    await Promise.resolve();
    expect(preSpawnExitSettled).toBe(false);
    expect(preSpawnLifecycle.processState.spawned).toBe(false);
    expect(preSpawnLifecycle.processState.postSpawnError).toBeNull();
    preSpawn.emit("close", -4058, null);
    expect(await preSpawnLifecycle.exit).toEqual({ exitCode: -4058, signal: null });

    const postSpawn = new EventEmitter();
    const postSpawnLifecycle = phase10C0VS6ObserveWorkerProcessLifecycle(
      postSpawn as unknown as Pick<ChildProcessWithoutNullStreams, "once" | "on">,
    );
    postSpawn.emit("spawn");
    await postSpawnLifecycle.spawned;
    let postSpawnExitSettled = false;
    void postSpawnLifecycle.exit.then(() => {
      postSpawnExitSettled = true;
    });
    const processError = new Error("synthetic post-spawn process error");
    postSpawn.emit("error", processError);
    await Promise.resolve();
    expect(postSpawnExitSettled).toBe(false);
    expect(postSpawnLifecycle.processState.spawned).toBe(true);
    expect(postSpawnLifecycle.processState.postSpawnError).toBe(processError);
    postSpawn.emit("close", 1, null);
    expect(await postSpawnLifecycle.exit).toEqual({ exitCode: 1, signal: null });
  });

  function output(
    maximumLines = 2,
    maximumStdoutBytes = maximumLines * PHASE10_C0V_S6_MAXIMUM_WORKER_WIRE_LINE_BYTES,
    messageByteBudget: Phase10C0VS6ParentWorkerMessageByteBudget = Object.freeze({
      lifecycleLineBytesMaximum: Math.floor(maximumStdoutBytes / maximumLines),
      boundaryOrProgressLineBytesMaximum: 16_384,
      artifactLineBytesMaximum: 262_144,
      resultLineBytesMaximum: 917_504,
      lifecycleLineCountMaximum: maximumLines,
      boundaryOrProgressLineCountMaximum: 0,
      artifactLineCountMaximum: 0,
      resultLineCountMaximum: 0,
      derivedMaximumBytes: maximumStdoutBytes,
    }),
  ): Readonly<{
    stdout: PassThrough;
    stderr: PassThrough;
    capture: Phase10C0VS6ParentWorkerOutput;
    terminationCalls: { value: number };
  }> {
    const stdout = new PassThrough();
    const stderr = new PassThrough();
    const terminationCalls = { value: 0 };
    const capture = new Phase10C0VS6ParentWorkerOutput(
      stdout,
      stderr,
      maximumLines,
      maximumStdoutBytes,
      messageByteBudget,
      () => {
        terminationCalls.value += 1;
      },
    );
    return { stdout, stderr, capture, terminationCalls };
  }

  it("captures a governed completion synchronously at LF recognition", async () => {
    const fixture = output(1);
    let callbackRan = false;
    const pending = fixture.capture.nextLineAtAuthenticatedBoundary((line) => {
      callbackRan = true;
      return Object.freeze({
        value: line,
        startedAtMonotonicNanoseconds: 10n,
        finishedAtMonotonicNanoseconds: 20n,
        elapsedNanoseconds: 10,
      });
    });
    fixture.stdout.write(Buffer.from("result\n", "utf8"));
    expect(callbackRan).toBe(true);
    expect(new TextDecoder().decode((await pending).value)).toBe("result\n");
    const stdoutEnded = new Promise<void>((resolveEnd) => fixture.stdout.once("end", resolveEnd));
    const stderrEnded = new Promise<void>((resolveEnd) => fixture.stderr.once("end", resolveEnd));
    fixture.stdout.end();
    fixture.stderr.end();
    await Promise.all([stdoutEnded, stderrEnded]);
    expect(() => fixture.capture.assertQuiescent()).not.toThrow();
  });

  it("captures a deferred governed start synchronously at LF recognition", async () => {
    const fixture = output(1);
    const transition = Object.freeze({ phase10C0VS6GovernedLeafArrivalTransition: true as const });
    let callbackRan = false;
    const pending = fixture.capture.nextLineAtAuthenticatedStartArrival(() => {
      callbackRan = true;
      return transition;
    });
    fixture.stdout.write(Buffer.from("governed-start\n", "utf8"));
    expect(callbackRan).toBe(true);
    const observed = await pending;
    expect(new TextDecoder().decode(observed.line)).toBe("governed-start\n");
    expect(observed.transition).toBe(transition);
    const stdoutEnded = new Promise<void>((resolveEnd) => fixture.stdout.once("end", resolveEnd));
    const stderrEnded = new Promise<void>((resolveEnd) => fixture.stderr.once("end", resolveEnd));
    fixture.stdout.end();
    fixture.stderr.end();
    await Promise.all([stdoutEnded, stderrEnded]);
    expect(() => fixture.capture.assertQuiescent()).not.toThrow();

    const buffered = output(1);
    buffered.stdout.write(Buffer.from("early-start\n", "utf8"));
    await new Promise<void>((resolveTurn) => setImmediate(resolveTurn));
    await expect(buffered.capture.nextLineAtAuthenticatedStartArrival(() => transition)).rejects.toThrow(
      /before its exact parent wait boundary/u,
    );
  });

  it("leaves watchdog boundary rejection distinct from transport framing", async () => {
    const capped = output(1);
    const cappedStdoutEnded = new Promise<void>((resolveEnd) => capped.stdout.once("end", resolveEnd));
    const cappedStderrEnded = new Promise<void>((resolveEnd) => capped.stderr.once("end", resolveEnd));
    const cappedBoundary = capped.capture.nextLineAtAuthenticatedBoundary(() => {
      throw new Error("synthetic authenticated registered-cap boundary");
    });
    capped.stdout.end(Buffer.from("late-result\n", "utf8"));
    capped.stderr.end();
    await expect(cappedBoundary).rejects.toThrow(/registered-cap boundary/u);
    await Promise.all([cappedStdoutEnded, cappedStderrEnded]);
    expect(() => capped.capture.assertQuiescent()).not.toThrow();

    const trailing = output(2);
    const trailingBoundary = trailing.capture.nextLineAtAuthenticatedBoundary(() => {
      throw new Error("synthetic authenticated registered-cap boundary");
    });
    trailing.stdout.end(Buffer.from("late-result\nforged-extra\n", "utf8"));
    trailing.stderr.end();
    await expect(trailingBoundary).rejects.toThrow(/registered-cap boundary/u);
    expect(() => trailing.capture.assertQuiescent()).toThrow(/exact consumed message boundary/u);
  });

  it("rejects trailing and partial stdout before terminal quiescence", async () => {
    const trailing = output(2);
    const first = trailing.capture.nextLine();
    trailing.stdout.end(Buffer.from("expected\ntrailing\n", "utf8"));
    trailing.stderr.end();
    expect(new TextDecoder().decode(await first)).toBe("expected\n");
    expect(() => trailing.capture.assertQuiescent()).toThrow(/exact consumed message boundary/u);

    const partial = output(1);
    const awaited = partial.capture.nextLine();
    partial.stdout.end(Buffer.from("no-terminal-lf", "utf8"));
    partial.stderr.end();
    await expect(awaited).rejects.toThrow(/partial transport line/u);
    expect(() => partial.capture.assertQuiescent()).toThrow(/partial transport line/u);
  });

  it("rejects a late stderr overflow before a terminal worker claim", async () => {
    const fixture = output(1);
    const stdoutEnded = new Promise<void>((resolveEnd) => fixture.stdout.once("end", resolveEnd));
    const stderrEnded = new Promise<void>((resolveEnd) => fixture.stderr.once("end", resolveEnd));
    const line = fixture.capture.nextLine();
    fixture.stdout.end(Buffer.from("result\n", "utf8"));
    expect(new TextDecoder().decode(await line)).toBe("result\n");
    fixture.stderr.write(Buffer.alloc(PHASE10_C0V_S6_MAXIMUM_WORKER_STDERR_BYTES));
    fixture.stderr.end(Buffer.from([0]));
    await Promise.all([stdoutEnded, stderrEnded]);
    expect(fixture.terminationCalls.value).toBe(1);
    expect(fixture.capture.retainedStderrBytes().byteLength).toBe(
      PHASE10_C0V_S6_MAXIMUM_WORKER_STDERR_BYTES,
    );
    expect(() => fixture.capture.assertQuiescent()).toThrow(/stderr exceeds/u);
  });

  it("retains the exact bounded raw prefix when a chunk crosses either stream limit", async () => {
    const equalityFixture = output(1, AP_MAXIMUM_STDOUT_BYTES);
    const equalityLine = equalityFixture.capture.nextLine();
    const equalityStdoutEnded = new Promise<void>((resolveEnd) => equalityFixture.stdout.once("end", resolveEnd));
    const equalityStderrEnded = new Promise<void>((resolveEnd) => equalityFixture.stderr.once("end", resolveEnd));
    equalityFixture.stdout.end(Buffer.concat([
      Buffer.alloc(AP_MAXIMUM_STDOUT_BYTES - 1, 0x61),
      Buffer.from([0x0a]),
    ]));
    equalityFixture.stderr.end();
    expect((await equalityLine).byteLength).toBe(AP_MAXIMUM_STDOUT_BYTES);
    await Promise.all([equalityStdoutEnded, equalityStderrEnded]);
    expect(equalityFixture.capture.retainedStdoutBytes().byteLength).toBe(AP_MAXIMUM_STDOUT_BYTES);
    expect(() => equalityFixture.capture.assertQuiescent()).not.toThrow();

    const stdoutFixture = output(1, AP_MAXIMUM_STDOUT_BYTES);
    const pendingLine = stdoutFixture.capture.nextLine();
    stdoutFixture.stdout.write(Buffer.alloc(AP_MAXIMUM_STDOUT_BYTES - 1, 0x61));
    stdoutFixture.stdout.end(Buffer.from([0x62, 0x0a]));
    stdoutFixture.stderr.end();
    await expect(pendingLine).rejects.toThrow(/stdout exceeds/u);
    const retainedStdout = stdoutFixture.capture.retainedStdoutBytes();
    expect(retainedStdout.byteLength).toBe(AP_MAXIMUM_STDOUT_BYTES);
    expect(retainedStdout[retainedStdout.byteLength - 1]).toBe(0x62);

    const stderrFixture = output(1);
    const stdoutEnded = new Promise<void>((resolveEnd) => stderrFixture.stdout.once("end", resolveEnd));
    const stderrEnded = new Promise<void>((resolveEnd) => stderrFixture.stderr.once("end", resolveEnd));
    const stderrFixtureResult = stderrFixture.capture.nextLine();
    stderrFixture.stdout.end(Buffer.from("result\n", "utf8"));
    stderrFixture.stderr.write(Buffer.alloc(PHASE10_C0V_S6_MAXIMUM_WORKER_STDERR_BYTES - 1, 0x63));
    stderrFixture.stderr.end(Buffer.from([0x64, 0x65]));
    expect(new TextDecoder().decode(await stderrFixtureResult)).toBe("result\n");
    await Promise.all([stdoutEnded, stderrEnded]);
    const retainedStderr = stderrFixture.capture.retainedStderrBytes();
    expect(retainedStderr.byteLength).toBe(PHASE10_C0V_S6_MAXIMUM_WORKER_STDERR_BYTES);
    expect(retainedStderr[retainedStderr.byteLength - 1]).toBe(0x64);
    expect(stderrFixture.terminationCalls.value).toBe(1);
    expect(() => stderrFixture.capture.assertQuiescent()).toThrow(/stderr exceeds/u);
  });

  it("enforces exact per-class line and count ceilings within the aggregate stdout bound", () => {
    const budget = Object.freeze({
      lifecycleLineBytesMaximum: 4_096,
      boundaryOrProgressLineBytesMaximum: 16_384,
      artifactLineBytesMaximum: 262_144,
      resultLineBytesMaximum: 917_504,
      lifecycleLineCountMaximum: 2,
      boundaryOrProgressLineCountMaximum: 1,
      artifactLineCountMaximum: 1,
      resultLineCountMaximum: 2,
      derivedMaximumBytes: 2_121_728,
    });
    const fixture = output(6, AP_MAXIMUM_STDOUT_BYTES, budget);
    expect(() => fixture.capture.observeParsedMessage("result", 917_504)).not.toThrow();
    expect(() => fixture.capture.observeParsedMessage("result", 917_504)).not.toThrow();
    expect(() => fixture.capture.observeParsedMessage("result", 1)).toThrow(/class count/u);

    const resultOverflow = output(6, AP_MAXIMUM_STDOUT_BYTES, budget);
    expect(() => resultOverflow.capture.observeParsedMessage("result", 917_505)).toThrow(/class byte bound/u);
    expect(() => resultOverflow.capture.observeParsedMessage("boundary", 16_384)).not.toThrow();
    expect(() => resultOverflow.capture.observeParsedMessage("progress", 1)).toThrow(/class count/u);

    const callbackOverflow = output(6, AP_MAXIMUM_STDOUT_BYTES, budget);
    expect(() => callbackOverflow.capture.observeParsedMessage("artifact", 262_145)).toThrow(/class byte bound/u);
  });
});
