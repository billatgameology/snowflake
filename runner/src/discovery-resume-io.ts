import { createHash, randomUUID } from "node:crypto";
import { closeSync, existsSync, mkdirSync, openSync, readFileSync, readSync, readdirSync,
  renameSync, rmSync, statSync, truncateSync, writeFileSync } from "node:fs";
import { hostname } from "node:os";
import { resolve, sep } from "node:path";
import { decodeDiscoveryResumeCheckpoint, encodeDiscoveryResumeCheckpoint,
  type DecodedDiscoveryResumeCheckpoint, type DiscoveryResumeState, type TimelineCursor } from "@vcc/core";
import type { LKEnvironmentTransitionReport } from "@vcc/solver-cpu";
import type { DiscoveryRow, DiscoverySpatialSnapshotRecord, DiscoveryStopReason } from "./post-phase10-discovery.ts";

export interface DiscoveryRunnerResumeState {
  startedAt: string;
  activeWallSeconds: number;
  peakRssBytes: number;
  totalSweeps: number;
  completedCycleRecords: number;
  allAttachmentEventsD6h: boolean;
  allRelaxationsConverged: boolean;
  maxKineticFillIncrement: number;
  maxDivergenceResidual: number;
  maxAbsSmootherDrift: number;
  minShellInjection: number | null;
  minSurfaceExchange: number | null;
  seedSites: number;
  spatialSnapshots: DiscoverySpatialSnapshotRecord[];
  pendingSpatialExtents: number[];
  currentSmootherDriftAbsLimit: number;
  maximumSmootherDriftAbsLimit: number;
  timelineCursor: TimelineCursor | null;
  timelineTransition: { eventCycle: number; transitionReport: LKEnvironmentTransitionReport } | null;
  integrityErrors: string[];
  terminalStopReason: DiscoveryStopReason | null;
}

interface Binding { schema: "discovery-row-resume-v1"; row: DiscoveryRow; gitHead: string; node: string; v8: string; hostname: string }
interface GenerationRef { directory: string; manifestSha256: string }
interface Pointer { schema: "discovery-row-resume-pointer-v1"; current: GenerationRef; previous: GenerationRef | null }
interface Generation {
  binding: Binding;
  tick: number;
  solver: { bytes: number; sha256: string };
  runner: DiscoveryRunnerResumeState;
  eventPrefix: { bytes: number; sha256: string };
  snapshots: { path: string; bytes: number; sha256: string }[];
}
const digest = (bytes: Uint8Array): string => createHash("sha256").update(bytes).digest("hex");
const readJson = <T>(path: string): T => JSON.parse(readFileSync(path, "utf8")) as T;
const jsonBytes = (value: unknown): Buffer => Buffer.from(`${JSON.stringify(value, null, 2)}\n`);
const generationName = /^generation-\d+-[a-f0-9-]{36}$/;
const snapshotName = /^boundary-e[1-9]\d*\.json$/;
const publicationRetryDelaysMs = [25, 50, 100, 200, 400, 800] as const;
const publicationWait = new Int32Array(new SharedArrayBuffer(4));

/** Briefly tolerate a busy publication target without repeating scientific work. */
function publishRename(source: string, destination: string): void {
  for (let attempt = 0; ; attempt++) {
    try { renameSync(source, destination); return; }
    catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (!["EPERM", "EACCES", "EBUSY"].includes(code ?? "") ||
          attempt === publicationRetryDelaysMs.length) throw error;
      Atomics.wait(publicationWait, 0, 0, publicationRetryDelaysMs[attempt]);
    }
  }
}

/** Serialize the short stale-owner decision as well as creation, so takeover cannot delete a new owner. */
export function withDiscoveryLeaseUpdate<T>(leasePath: string, operation: () => T): T {
  const guard = `${leasePath}.acquire`;
  let fd: number;
  try { fd = openSync(guard, "wx"); }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code === "EEXIST") throw new Error(`lease acquisition is active or was interrupted: ${guard}; inspect its owner before clearing this guard`);
    throw error;
  }
  try {
    writeFileSync(fd, jsonBytes({ pid: process.pid, hostname: hostname(), startedAt: new Date().toISOString() }));
    return operation();
  } finally { closeSync(fd); rmSync(guard); }
}

export function acquireDiscoveryRowLease(output: string): () => void {
  mkdirSync(output, { recursive: true });
  const path = resolve(output, "resume-owner.json");
  return withDiscoveryLeaseUpdate(path, () => {
  if (existsSync(path)) {
    const old = readJson<{ pid: number; hostname: string }>(path);
    if (!Number.isSafeInteger(old.pid) || old.pid <= 0 || old.hostname !== hostname()) throw new Error("invalid or foreign row owner");
    let live = true;
    try { process.kill(old.pid, 0); } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ESRCH") live = false; else throw error;
    }
    if (live) throw new Error(`discovery row already owned by live PID ${old.pid}`);
    mkdirSync(resolve(output, "resume"), { recursive: true });
    renameSync(path, resolve(output, "resume", `abandoned-owner-${randomUUID()}.json`));
  }
  const token = randomUUID();
  writeFileSync(path, jsonBytes({ pid: process.pid, hostname: hostname(), token, startedAt: new Date().toISOString() }), { flag: "wx" });
  return () => {
    if (existsSync(path) && readJson<{ token: string }>(path).token === token) rmSync(path);
  };
  });
}

function filePrefix(path: string, length: number, hash = createHash("sha256"), offset = 0) {
  if (!Number.isSafeInteger(length) || length < offset || !existsSync(path) || statSync(path).size < length) {
    throw new Error("resume event prefix is missing or truncated");
  }
  const fd = openSync(path, "r");
  try {
    const chunk = Buffer.alloc(64 * 1024);
    while (offset < length) {
      const n = readSync(fd, chunk, 0, Math.min(chunk.length, length - offset), offset);
      if (n === 0) throw new Error("unexpected end of resume event prefix");
      hash.update(chunk.subarray(0, n)); offset += n;
    }
    return hash;
  } finally { closeSync(fd); }
}

function validateRunner(state: DiscoveryRunnerResumeState, tick: number): void {
  const numbers = ["activeWallSeconds", "peakRssBytes", "totalSweeps", "completedCycleRecords", "maxKineticFillIncrement",
    "maxDivergenceResidual", "maxAbsSmootherDrift", "seedSites", "currentSmootherDriftAbsLimit", "maximumSmootherDriftAbsLimit"] as const;
  const keys = [...numbers, "startedAt", "allAttachmentEventsD6h", "allRelaxationsConverged", "minShellInjection", "minSurfaceExchange",
    "spatialSnapshots", "pendingSpatialExtents", "timelineCursor", "timelineTransition", "integrityErrors", "terminalStopReason"];
  if (state === null || typeof state !== "object" || Object.keys(state).length !== keys.length ||
      keys.some((key) => !Object.hasOwn(state, key))) throw new Error("incomplete or unknown runner resume state");
  for (const key of numbers) if (!Number.isFinite(state[key]) || state[key] < 0) throw new Error(`invalid runner resume ${key}`);
  if (!Number.isFinite(Date.parse(state.startedAt)) || state.completedCycleRecords !== tick ||
      !Number.isSafeInteger(state.totalSweeps) || !Number.isSafeInteger(state.seedSites) || state.seedSites < 1 ||
      typeof state.allAttachmentEventsD6h !== "boolean" || typeof state.allRelaxationsConverged !== "boolean" ||
      !Array.isArray(state.integrityErrors) || state.integrityErrors.some((x) => typeof x !== "string") ||
      !Array.isArray(state.spatialSnapshots) || !Array.isArray(state.pendingSpatialExtents) ||
      state.pendingSpatialExtents.some((x) => !Number.isSafeInteger(x) || x < 1) ||
      (state.minShellInjection !== null && !Number.isFinite(state.minShellInjection)) ||
      (state.minSurfaceExchange !== null && !Number.isFinite(state.minSurfaceExchange)) ||
      ![null, "size-target", "step-cap", "stalled", "domain-contact"].includes(state.terminalStopReason)) {
    throw new Error("invalid runner resume state");
  }
}

/** Row-local publication and recovery; publication retries never repeat scientific evolution. */
export class DiscoveryCheckpointStore {
  readonly output: string;
  readonly root: string;
  readonly eventsPath: string;
  readonly binding: Binding;
  private prefixHash = createHash("sha256");
  private prefixBytes = 0;

  constructor(output: string, row: DiscoveryRow, head: string) {
    this.output = output;
    this.root = resolve(output, "resume");
    this.eventsPath = resolve(output, "events.jsonl");
    this.binding = { schema: "discovery-row-resume-v1", row, gitHead: head,
      node: process.version, v8: process.versions.v8, hostname: hostname() };
  }

  private generationPath(ref: GenerationRef): string {
    if (!ref || !generationName.test(ref.directory) || !/^[a-f0-9]{64}$/.test(ref.manifestSha256)) throw new Error("invalid checkpoint generation reference");
    return resolve(this.root, ref.directory);
  }

  load(): { decoded: DecodedDiscoveryResumeCheckpoint; runner: DiscoveryRunnerResumeState; recover: () => void } | null {
    const pointerPath = resolve(this.root, "latest.json");
    if (!existsSync(pointerPath)) {
      if ((existsSync(this.eventsPath) && statSync(this.eventsPath).size !== 0) || existsSync(resolve(this.output, "result.json"))) {
        throw new Error("scientific observations exist but no committed resume checkpoint");
      }
      return null; // Interrupted bootstrap before any scientific update; same spec is checked by caller.
    }
    const pointer = readJson<Pointer>(pointerPath);
    if (pointer.schema !== "discovery-row-resume-pointer-v1") throw new Error("unsupported checkpoint pointer");
    const directory = this.generationPath(pointer.current);
    const manifestBytes = readFileSync(resolve(directory, "manifest.json"));
    if (digest(manifestBytes) !== pointer.current.manifestSha256) throw new Error("checkpoint manifest digest mismatch");
    const generation = JSON.parse(manifestBytes.toString("utf8")) as Generation;
    if (JSON.stringify(generation.binding) !== JSON.stringify(this.binding)) throw new Error("checkpoint row/source/runtime/host mismatch");
    const solverBytes = readFileSync(resolve(directory, "solver.bin"));
    if (solverBytes.length !== generation.solver.bytes || digest(solverBytes) !== generation.solver.sha256) throw new Error("checkpoint solver payload mismatch");
    const decoded = decodeDiscoveryResumeCheckpoint(solverBytes);
    if (decoded.tick !== generation.tick) throw new Error("checkpoint tick mismatch");
    validateRunner(generation.runner, generation.tick);
    const prefix = generation.eventPrefix;
    const verifiedHash = filePrefix(this.eventsPath, prefix.bytes);
    if (verifiedHash.copy().digest("hex") !== prefix.sha256) throw new Error("checkpoint event prefix digest mismatch");
    const snapshotPaths = new Set<string>();
    if (!Array.isArray(generation.snapshots) || generation.snapshots.length !== generation.runner.spatialSnapshots.length) throw new Error("checkpoint snapshot inventory mismatch");
    for (const snapshot of generation.snapshots) {
      if (!snapshotName.test(snapshot.path) || snapshotPaths.has(snapshot.path) ||
          !generation.runner.spatialSnapshots.some((s) => s.path === snapshot.path)) throw new Error("invalid checkpoint snapshot identity");
      snapshotPaths.add(snapshot.path);
      const bytes = readFileSync(resolve(this.output, snapshot.path));
      if (bytes.length !== snapshot.bytes || digest(bytes) !== snapshot.sha256) throw new Error("checkpoint snapshot payload mismatch");
    }
    // All validation, including solver/cursor consistency at the caller, precedes mutation.
    return { decoded, runner: generation.runner, recover: () => {
      const tails = readdirSync(this.output).filter((name) =>
        (snapshotName.test(name) && !snapshotPaths.has(name)) || name === "result.json" || name === "status.json" || name === "exit.json");
      const extraBytes = statSync(this.eventsPath).size - prefix.bytes;
      if (tails.length > 0 || extraBytes > 0) {
        const recovery = resolve(this.root, `recovery-${Date.now()}-${randomUUID()}`);
        mkdirSync(recovery, { recursive: true });
        for (const name of tails) renameSync(resolve(this.output, name), resolve(recovery, name));
        if (extraBytes > 0) {
          const input = openSync(this.eventsPath, "r");
          try {
            const tail = Buffer.alloc(extraBytes);
            let read = 0;
            while (read < tail.length) { const n = readSync(input, tail, read, tail.length - read, prefix.bytes + read); if (n === 0) throw new Error("truncated recovery tail"); read += n; }
            writeFileSync(resolve(recovery, "events-after-checkpoint.jsonl"), tail, { flag: "wx" });
          } finally { closeSync(input); }
          truncateSync(this.eventsPath, prefix.bytes);
        }
        writeFileSync(resolve(recovery, "recovery.json"), jsonBytes({ recoveredAt: new Date().toISOString(),
          checkpoint: pointer.current, retainedEventBytes: prefix.bytes, preservedTailBytes: extraBytes, preservedFiles: tails }));
      }
      this.prefixBytes = prefix.bytes; this.prefixHash = verifiedHash;
    } };
  }

  save(solver: DiscoveryResumeState, runner: DiscoveryRunnerResumeState): void {
    validateRunner(runner, solver.tick);
    mkdirSync(this.root, { recursive: true });
    if (!existsSync(this.eventsPath)) writeFileSync(this.eventsPath, "", { flag: "wx" });
    const eventBytes = statSync(this.eventsPath).size;
    this.prefixHash = filePrefix(this.eventsPath, eventBytes, this.prefixHash, this.prefixBytes);
    this.prefixBytes = eventBytes;
    const solverBytes = encodeDiscoveryResumeCheckpoint(solver);
    const name = `generation-${solver.tick}-${randomUUID()}`;
    const pending = resolve(this.root, `pending-${name}`);
    mkdirSync(pending);
    const manifest: Generation = { binding: this.binding, tick: solver.tick,
      solver: { bytes: solverBytes.length, sha256: digest(solverBytes) }, runner,
      eventPrefix: { bytes: eventBytes, sha256: this.prefixHash.copy().digest("hex") },
      snapshots: runner.spatialSnapshots.map((snapshot) => {
        if (!snapshotName.test(snapshot.path)) throw new Error("invalid snapshot name");
        const bytes = readFileSync(resolve(this.output, snapshot.path));
        return { path: snapshot.path, bytes: bytes.length, sha256: digest(bytes) };
      }) };
    writeFileSync(resolve(pending, "solver.bin"), solverBytes, { flag: "wx" });
    if (digest(readFileSync(resolve(pending, "solver.bin"))) !== manifest.solver.sha256) throw new Error("checkpoint write verification failed");
    const manifestBytes = jsonBytes(manifest);
    writeFileSync(resolve(pending, "manifest.json"), manifestBytes, { flag: "wx" });
    publishRename(pending, resolve(this.root, name));
    const pointerPath = resolve(this.root, "latest.json");
    const old = existsSync(pointerPath) ? readJson<Pointer>(pointerPath) : null;
    const pointer: Pointer = { schema: "discovery-row-resume-pointer-v1",
      current: { directory: name, manifestSha256: digest(manifestBytes) }, previous: old?.current ?? null };
    const tempPointer = resolve(this.root, `latest-${randomUUID()}.tmp`);
    writeFileSync(tempPointer, jsonBytes(pointer), { flag: "wx" });
    publishRename(tempPointer, pointerPath);
    // Only this writer's now-superseded third generation is scratch under the two-generation protocol.
    if (old?.previous !== null && old?.previous !== undefined) {
      const obsolete = this.generationPath(old.previous);
      if (!obsolete.startsWith(this.root + sep) || obsolete === this.generationPath(pointer.current) ||
          (pointer.previous !== null && obsolete === this.generationPath(pointer.previous))) throw new Error("invalid obsolete checkpoint target");
      rmSync(obsolete, { recursive: true });
    }
  }
}
