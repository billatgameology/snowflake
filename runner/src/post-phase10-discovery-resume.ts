import { createHash, randomUUID } from "node:crypto";
import {
  closeSync, existsSync, fsyncSync, ftruncateSync, mkdirSync, openSync, readFileSync,
  readSync, readdirSync, renameSync, statSync, unlinkSync, writeFileSync, writeSync,
} from "node:fs";
import { execFileSync } from "node:child_process";
import { basename, resolve } from "node:path";
import {
  decodeLKExperimentalResumeCheckpointV1, encodeLKExperimentalResumeCheckpointV1,
} from "@vcc/core";
import { LKSolver } from "@vcc/solver-cpu";
import {
  discoveryRowEvolution, type DiscoveryContinuationBoundary, type DiscoveryContinuationMeasurements,
  type DiscoveryRow, type DiscoveryTerminalResult,
} from "./post-phase10-discovery.ts";

const SCHEMA = "post-phase10-discovery-resume-v1" as const;
const STATUS_SCHEMA = "post-phase10-discovery-resume-status-v1" as const;
const POINTER = "resume-current.json";
const STATUS = "resume-status.json";
interface FileBinding { readonly path: string; readonly bytes: number; readonly sha256: string }
interface ResumePointer {
  readonly schema: typeof SCHEMA;
  readonly generation: number;
  readonly slot: 0 | 1;
  readonly metadataSha256: string;
}
interface ResumeMetadata {
  readonly schema: typeof SCHEMA;
  readonly generation: number;
  readonly rowSha256: string;
  readonly gitHead: string;
  readonly node: string;
  readonly v8: string;
  readonly spec: FileBinding;
  readonly checkpoint: FileBinding;
  readonly events: FileBinding;
  readonly snapshots: readonly FileBinding[];
  readonly measurements: DiscoveryContinuationMeasurements;
}
export interface ResumableDiscoveryStatus {
  readonly schema: typeof STATUS_SCHEMA;
  readonly rowId: string;
  readonly state: "running" | "paused" | "terminal";
  readonly cycle: number;
  readonly reason?: "operator-pause" | "step-review";
  readonly checkpointGeneration: number;
  readonly eventsBytes: number;
  readonly resultSha256?: string;
}
export type ResumableDiscoveryOutcome =
  | { readonly state: "paused"; readonly reason: "operator-pause" | "step-review";
      readonly cycle: number; readonly checkpointPath: string }
  | { readonly state: "terminal"; readonly result: DiscoveryTerminalResult };
export interface ResumableDiscoveryOptions {
  /** Auto-detect an existing checkpoint by default; false requires a fresh row. */
  readonly resume?: boolean;
  readonly pauseFile?: string;
  readonly pauseRequested?: (completedCycles: number) => boolean;
  readonly heartbeat?: (message: string) => void;
}
function digest(bytes: Uint8Array | string): string { return createHash("sha256").update(bytes).digest("hex"); }
function json(path: string): unknown { return JSON.parse(readFileSync(path, "utf8")) as unknown; }
function object(value: unknown): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) throw new Error("invalid resume object");
  return value as Record<string, unknown>;
}
function exactKeys(value: Record<string, unknown>, expected: readonly string[]): void {
  if (Object.keys(value).sort().join("|") !== [...expected].sort().join("|")) throw new Error("invalid resume keys");
}
function durableJson(path: string, value: unknown): void {
  const temporary = `${path}.tmp-${randomUUID()}`;
  writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`, { flag: "wx", flush: true });
  renameSync(temporary, path);
}
function fileBinding(directory: string, path: string): FileBinding {
  const bytes = readFileSync(resolve(directory, path));
  return { path, bytes: bytes.length, sha256: digest(bytes) };
}
function checkBinding(directory: string, binding: FileBinding, expectedPath?: string): void {
  const b = object(binding);
  exactKeys(b, ["path", "bytes", "sha256"]);
  if (typeof b.path !== "string" || (expectedPath !== undefined && b.path !== expectedPath) ||
    !/^(spec\.json|events\.jsonl|resume\/slot-[01]\.bin|boundary-e[0-9]+\.json)$/.test(b.path) ||
    !Number.isSafeInteger(b.bytes) || (b.bytes as number) < 0 ||
    typeof b.sha256 !== "string" || !/^[a-f0-9]{64}$/.test(b.sha256)) throw new Error("invalid resume file binding");
  const actual = fileBinding(directory, binding.path);
  if (actual.bytes !== binding.bytes || actual.sha256 !== binding.sha256) throw new Error(`resume bytes mismatch: ${binding.path}`);
}
function hashPrefix(path: string, length: number): ReturnType<typeof createHash> {
  const hash = createHash("sha256");
  const fd = openSync(path, "r");
  try {
    const buffer = Buffer.alloc(64 * 1024);
    for (let offset = 0; offset < length;) {
      const count = readSync(fd, buffer, 0, Math.min(buffer.length, length - offset), offset);
      if (count === 0) throw new Error("resume events shorter than committed prefix");
      hash.update(buffer.subarray(0, count)); offset += count;
    }
  } finally { closeSync(fd); }
  return hash;
}
function loadCheckpointMetadata(directory: string): { pointer: ResumePointer; metadata: ResumeMetadata } {
  const raw = object(json(resolve(directory, POINTER)));
  exactKeys(raw, ["schema", "generation", "slot", "metadataSha256"]);
  if (raw.schema !== SCHEMA || !Number.isSafeInteger(raw.generation) || (raw.generation as number) < 0 ||
    (raw.slot !== 0 && raw.slot !== 1) || raw.slot !== (raw.generation as number) % 2 ||
    typeof raw.metadataSha256 !== "string" || !/^[a-f0-9]{64}$/.test(raw.metadataSha256)) {
    throw new Error("invalid current resume pointer; no implicit fallback");
  }
  const pointer = raw as unknown as ResumePointer;
  const metadataBytes = readFileSync(resolve(directory, `resume/slot-${pointer.slot}.json`));
  if (digest(metadataBytes) !== pointer.metadataSha256) throw new Error("resume metadata digest mismatch; no implicit fallback");
  const value = object(JSON.parse(metadataBytes.toString("utf8")));
  exactKeys(value, ["schema", "generation", "rowSha256", "gitHead", "node", "v8", "spec", "checkpoint", "events", "snapshots", "measurements"]);
  if (value.schema !== SCHEMA || value.generation !== pointer.generation || !Array.isArray(value.snapshots)) {
    throw new Error("invalid resume metadata");
  }
  const metadata = value as unknown as ResumeMetadata;
  checkBinding(directory, metadata.spec, "spec.json");
  checkBinding(directory, metadata.checkpoint, `resume/slot-${pointer.slot}.bin`);
  for (const snapshot of metadata.snapshots) checkBinding(directory, snapshot);
  const events = object(metadata.events);
  exactKeys(events, ["path", "bytes", "sha256"]);
  if (events.path !== "events.jsonl" || !Number.isSafeInteger(events.bytes) || (events.bytes as number) < 0 ||
    typeof events.sha256 !== "string" || !/^[a-f0-9]{64}$/.test(events.sha256)) throw new Error("invalid event prefix binding");
  if (hashPrefix(resolve(directory, "events.jsonl"), metadata.events.bytes).digest("hex") !== metadata.events.sha256) {
    throw new Error("resume committed event prefix digest mismatch");
  }
  const measurements = object(metadata.measurements);
  if (!Number.isSafeInteger(measurements.completedCycleRecords) || (measurements.completedCycleRecords as number) < 0 ||
    !Array.isArray(measurements.spatialSnapshots) || !Array.isArray(measurements.pendingSpatialExtents)) {
    throw new Error("invalid resume measurements");
  }
  return { pointer, metadata };
}

/** A status is useful only with its published, verified checkpoint or terminal result. */
export function readResumableDiscoveryStatus(directory: string): ResumableDiscoveryStatus | null {
  if (!existsSync(resolve(directory, STATUS))) {
    if (!existsSync(resolve(directory, POINTER))) return null;
    const { pointer, metadata } = loadCheckpointMetadata(directory);
    const spec = object(json(resolve(directory, "spec.json")));
    const row = object(spec.row);
    if (typeof row.id !== "string") throw new Error("invalid resumable row identity");
    return { schema: STATUS_SCHEMA, rowId: row.id, state: "running",
      cycle: metadata.measurements.completedCycleRecords, checkpointGeneration: pointer.generation,
      eventsBytes: metadata.events.bytes };
  }
  const value = object(json(resolve(directory, STATUS)));
  if (value.schema !== STATUS_SCHEMA || typeof value.rowId !== "string" ||
    !["running", "paused", "terminal"].includes(String(value.state)) ||
    !Number.isSafeInteger(value.cycle) || (value.cycle as number) < 0 ||
    !Number.isSafeInteger(value.checkpointGeneration)) throw new Error("invalid resume status");
  const { pointer, metadata } = loadCheckpointMetadata(directory);
  const status = value as unknown as ResumableDiscoveryStatus;
  if (status.checkpointGeneration > pointer.generation) throw new Error("resume status points beyond current checkpoint");
  if (status.state === "terminal") {
    const bytes = readFileSync(resolve(directory, "result.json"));
    if (digest(bytes) !== status.resultSha256) throw new Error("resume terminal result digest mismatch");
    const result = JSON.parse(bytes.toString("utf8")) as DiscoveryTerminalResult;
    if (result.schema !== "post-phase10-discovery-result-v1" || result.rowId !== status.rowId ||
      result.cycles !== status.cycle || result.stopReason === "step-cap" || result.stopReason === "wall-budget") {
      throw new Error("invalid resumable terminal result");
    }
  }
  return status.state === "terminal" ? status : { ...status, cycle: metadata.measurements.completedCycleRecords,
    checkpointGeneration: pointer.generation, eventsBytes: metadata.events.bytes };
}

function recoverUncommittedOutputs(directory: string, metadata: ResumeMetadata): void {
  const recovery = resolve(directory, "recovery");
  const preserve = (path: string): void => {
    mkdirSync(recovery, { recursive: true });
    renameSync(path, resolve(recovery, `${basename(path)}.uncommitted-${randomUUID()}`));
  };
  const eventsPath = resolve(directory, "events.jsonl");
  const size = statSync(eventsPath).size;
  if (size > metadata.events.bytes) {
    mkdirSync(recovery, { recursive: true });
    const input = openSync(eventsPath, "r+");
    const tail = openSync(resolve(recovery, `events-tail-${randomUUID()}.jsonl`), "wx");
    try {
      const buffer = Buffer.alloc(64 * 1024);
      for (let offset = metadata.events.bytes; offset < size;) {
        const n = readSync(input, buffer, 0, Math.min(buffer.length, size - offset), offset);
        if (n === 0) throw new Error("event tail changed while preserving");
        writeAll(tail, buffer.subarray(0, n)); offset += n;
      }
      fsyncSync(tail);
      ftruncateSync(input, metadata.events.bytes); fsyncSync(input);
    } finally { closeSync(tail); closeSync(input); }
  }
  const retained = new Set(metadata.snapshots.map((snapshot) => snapshot.path));
  for (const leaf of readdirSync(directory)) {
    if (/^boundary-e[0-9]+\.json$/.test(leaf) && !retained.has(leaf)) preserve(resolve(directory, leaf));
  }
  if (existsSync(resolve(directory, "result.json"))) preserve(resolve(directory, "result.json"));
}
function writeAll(fd: number, bytes: Uint8Array): void {
  for (let offset = 0; offset < bytes.length;) {
    const written = writeSync(fd, bytes, offset, bytes.length - offset);
    if (written === 0) throw new Error("checkpoint write made no progress");
    offset += written;
  }
}
function lockRow(directory: string): () => void {
  const path = resolve(directory, "resume-writer.lock.json");
  if (existsSync(path)) {
    const previous = object(json(path));
    if (!Number.isSafeInteger(previous.pid) || (previous.pid as number) <= 0) throw new Error("invalid row writer lock");
    let alive = true;
    try { process.kill(previous.pid as number, 0); }
    catch (error) { if ((error as NodeJS.ErrnoException).code === "ESRCH") alive = false; else throw error; }
    if (alive) throw new Error(`row already has a live writer: ${String(previous.pid)}`);
    const recovery = resolve(directory, "recovery"); mkdirSync(recovery, { recursive: true });
    renameSync(path, resolve(recovery, `abandoned-writer-${randomUUID()}.json`));
  }
  const token = randomUUID();
  writeFileSync(path, JSON.stringify({ pid: process.pid, token }), { flag: "wx", flush: true });
  return () => { if (existsSync(path) && object(json(path)).token === token) unlinkSync(path); };
}

/** BLD constant-environment continuation; maxSteps is an allowance per invocation, never a terminal result. */
export async function runResumableDiscoveryRow(
  row: DiscoveryRow, directory: string, options: ResumableDiscoveryOptions = {},
): Promise<ResumableDiscoveryOutcome> {
  if (row.timelineEvent !== undefined || row.experimentalHoleFilling !== undefined ||
    row.experimentalBasalWidthHistory?.mode === "late-only") throw new Error("unsupported BLD resume mode");
  if (!Number.isSafeInteger(row.maxSteps) || row.maxSteps <= 0) throw new Error("resume maxSteps allowance must be positive");
  directory = resolve(directory); mkdirSync(directory, { recursive: true });
  const release = lockRow(directory);
  try { return await runOwned(row, directory, options); } finally { release(); }
}
async function runOwned(row: DiscoveryRow, directory: string, options: ResumableDiscoveryOptions): Promise<ResumableDiscoveryOutcome> {
  const head = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
  const rowSha256 = digest(JSON.stringify(row));
  let generation = -1;
  let continuation: DiscoveryContinuationBoundary | undefined;
  let committedEventsBytes = 0;
  let eventHash = createHash("sha256");
  const existing = existsSync(resolve(directory, POINTER));
  if (existing && options.resume === false) throw new Error("resume checkpoint already exists");
  const initialPath = resolve(directory, "resume-initial.json");
  if (!existing && options.resume === true && !existsSync(initialPath)) throw new Error("resume checkpoint is missing");
  if (!existing) {
    const initialBinding = { schema: SCHEMA, rowSha256, gitHead: head, node: process.version, v8: process.versions.v8 };
    if (existsSync(initialPath)) {
      if (JSON.stringify(json(initialPath)) !== JSON.stringify(initialBinding)) throw new Error("initial resume row/source/runtime binding mismatch");
      // No current pointer has ever committed: preserve unfinished initial publication,
      // then reconstruct only the seed. This path never claims recovered growth.
      const leaves = readdirSync(directory).filter((leaf) =>
        ["spec.json", "host.json", "events.jsonl", "result.json", "status.json", STATUS, "resume"].includes(leaf) ||
        /^boundary-e[0-9]+\.json$/.test(leaf));
      if (leaves.length > 0) {
        const recovery = resolve(directory, "recovery", `unpublished-initial-${randomUUID()}`);
        mkdirSync(recovery, { recursive: true });
        for (const leaf of leaves) renameSync(resolve(directory, leaf), resolve(recovery, leaf));
      }
    } else {
      if (["spec.json", "host.json", "events.jsonl", "result.json", STATUS, "resume"].some((leaf) => existsSync(resolve(directory, leaf)))) {
        throw new Error("existing observations without an experimental checkpoint cannot be resumed");
      }
      durableJson(initialPath, initialBinding);
    }
  }
  if (existing) {
    const { pointer, metadata } = loadCheckpointMetadata(directory);
    if (metadata.rowSha256 !== rowSha256 || metadata.gitHead !== head || metadata.node !== process.version ||
      metadata.v8 !== process.versions.v8) throw new Error("resume row/source/runtime binding mismatch");
    const status = readResumableDiscoveryStatus(directory);
    if (status?.state === "terminal") return { state: "terminal", result: json(resolve(directory, "result.json")) as DiscoveryTerminalResult };
    const path = resolve(directory, metadata.checkpoint.path);
    const fd = openSync(path, "r");
    try {
      const decoded = await decodeLKExperimentalResumeCheckpointV1({ byteLength: statSync(path).size,
        async readExactly(offset, target) {
          for (let done = 0; done < target.length;) {
            const count = readSync(fd, target, done, target.length - done, offset + done);
            if (count === 0) throw new Error("truncated experimental checkpoint"); done += count;
          }
        } });
      const solver = LKSolver.fromExperimentalResumeStateV1(decoded);
      if (solver.tick !== metadata.measurements.completedCycleRecords) throw new Error("checkpoint/measurement cycle mismatch");
      continuation = { solver, measurements: metadata.measurements };
    } finally { closeSync(fd); }
    recoverUncommittedOutputs(directory, metadata);
    generation = pointer.generation;
    committedEventsBytes = metadata.events.bytes;
    eventHash = hashPrefix(resolve(directory, "events.jsonl"), committedEventsBytes);
  }
  const evolution = discoveryRowEvolution(row, directory, { heartbeat: options.heartbeat }, continuation);
  let initialCycle: number | undefined;
  const save = async (boundary: DiscoveryContinuationBoundary): Promise<void> => {
    mkdirSync(resolve(directory, "resume"), { recursive: true });
    const eventsPath = resolve(directory, "events.jsonl");
    if (!existsSync(eventsPath)) writeFileSync(eventsPath, "", { flag: "wx", flush: true });
    const eventFd = openSync(eventsPath, "r+");
    const size = statSync(eventsPath).size;
    try {
      const buffer = Buffer.alloc(64 * 1024);
      for (let offset = committedEventsBytes; offset < size;) {
        const n = readSync(eventFd, buffer, 0, Math.min(buffer.length, size - offset), offset);
        if (n === 0) throw new Error("event append disappeared");
        eventHash.update(buffer.subarray(0, n)); offset += n;
      }
      fsyncSync(eventFd);
    } finally { closeSync(eventFd); }
    const nextGeneration = generation + 1;
    const slot = nextGeneration % 2 as 0 | 1;
    const checkpointLeaf = `resume/slot-${slot}.bin`;
    const checkpointPath = resolve(directory, checkpointLeaf);
    const temporary = `${checkpointPath}.tmp-${randomUUID()}`;
    const fd = openSync(temporary, "wx");
    const checkpointHash = createHash("sha256"); let bytes = 0;
    try {
      await encodeLKExperimentalResumeCheckpointV1(boundary.solver.experimentalResumeStateV1(), {
        async write(chunk) { writeAll(fd, chunk); checkpointHash.update(chunk); bytes += chunk.length; },
      });
      fsyncSync(fd);
    } finally { closeSync(fd); }
    renameSync(temporary, checkpointPath);
    const metadata: ResumeMetadata = {
      schema: SCHEMA, generation: nextGeneration, rowSha256, gitHead: head, node: process.version, v8: process.versions.v8,
      spec: fileBinding(directory, "spec.json"),
      checkpoint: { path: checkpointLeaf, bytes, sha256: checkpointHash.digest("hex") },
      events: { path: "events.jsonl", bytes: size, sha256: eventHash.copy().digest("hex") },
      snapshots: boundary.measurements.spatialSnapshots.map((snapshot) => fileBinding(directory, snapshot.path)),
      measurements: boundary.measurements,
    };
    // Snapshot and spec bytes must reach storage before a pointer can commit them.
    for (const binding of [metadata.spec, ...metadata.snapshots]) {
      const observation = openSync(resolve(directory, binding.path), "r+");
      try { fsyncSync(observation); } finally { closeSync(observation); }
    }
    const metadataPath = resolve(directory, `resume/slot-${slot}.json`);
    durableJson(metadataPath, metadata);
    durableJson(resolve(directory, POINTER), { schema: SCHEMA, generation: nextGeneration, slot,
      metadataSha256: digest(readFileSync(metadataPath)) } satisfies ResumePointer);
    generation = nextGeneration; committedEventsBytes = size;
  };
  for (;;) {
    const next = evolution.next();
    if (next.done) {
      if (next.value.stopReason === "step-cap" || next.value.stopReason === "wall-budget") {
        throw new Error("resumable driver unexpectedly produced a capped terminal result");
      }
      const resultPath = resolve(directory, "result.json");
      const fd = openSync(resultPath, "r+"); try { fsyncSync(fd); } finally { closeSync(fd); }
      durableJson(resolve(directory, STATUS), { schema: STATUS_SCHEMA, rowId: row.id, state: "terminal",
        cycle: next.value.cycles, checkpointGeneration: generation, eventsBytes: committedEventsBytes, resultSha256: digest(readFileSync(resultPath)) } satisfies ResumableDiscoveryStatus);
      return { state: "terminal", result: next.value };
    }
    const boundary = next.value;
    initialCycle ??= boundary.solver.tick;
    await save(boundary);
    const terminal = boundary.measurements.terminalStopReason !== null;
    const operatorPause = options.pauseRequested?.(boundary.solver.tick) === true ||
      (options.pauseFile !== undefined && existsSync(options.pauseFile));
    const reviewPause = boundary.solver.tick - initialCycle >= row.maxSteps;
    if (!terminal && (operatorPause || reviewPause)) {
      const reason = operatorPause ? "operator-pause" : "step-review";
      durableJson(resolve(directory, STATUS), { schema: STATUS_SCHEMA, rowId: row.id, state: "paused", reason,
        cycle: boundary.solver.tick, checkpointGeneration: generation, eventsBytes: committedEventsBytes } satisfies ResumableDiscoveryStatus);
      evolution.return(undefined as never);
      return { state: "paused", reason, cycle: boundary.solver.tick, checkpointPath: resolve(directory, POINTER) };
    }
    durableJson(resolve(directory, STATUS), { schema: STATUS_SCHEMA, rowId: row.id, state: "running",
      cycle: boundary.solver.tick, checkpointGeneration: generation, eventsBytes: committedEventsBytes } satisfies ResumableDiscoveryStatus);
  }
}
