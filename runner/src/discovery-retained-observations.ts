import { createHash, randomUUID } from "node:crypto";
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, renameSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { decodeDiscoveryResumeCheckpoint, takeDecodedDiscoveryResumeCheckpoint } from "@vcc/core";
import type { DiscoveryRow, DiscoverySpatialSnapshot, DiscoveryStopReason } from "./post-phase10-discovery.ts";

/** Finite observation-only settings, bound by spec.json independently of numerical controls. */
export interface DiscoveryRetainedObservations {
  readonly ageSeconds: readonly number[];
  readonly widthHistorySwitch: boolean;
  readonly centralAttachments?: {
    readonly maxHexRadiusCells: number;
    readonly absoluteZOffsets: readonly number[];
  };
}

export interface DiscoveryRetainedBoundary {
  readonly schema: "discovery-retained-boundary-v1";
  readonly rowId: string;
  readonly timing: "after-converged-relaxation-before-surface-advance";
  readonly completedCycles: number;
  readonly simTimeSeconds: number;
  readonly dims: DiscoverySpatialSnapshot["dims"];
  readonly center: readonly number[];
  readonly dxUm: number;
  readonly tempC: number;
  readonly sigmaInfinity: number;
  readonly attachedCount: number;
  readonly cells: DiscoverySpatialSnapshot["cells"];
}

export interface DiscoveryRetainedStateReference {
  readonly tick: number;
  readonly simTimeSeconds: number;
  readonly directory: string;
  readonly manifestSha256: string;
  readonly solver: { readonly bytes: number; readonly sha256: string };
}

export interface DiscoveryRetainedObservation {
  readonly schema: "discovery-retained-observation-v1";
  readonly rowId: string;
  readonly label: string;
  readonly kind: "initial" | "terminal" | "age" | "width-last-active" | "width-first-inactive" | "central-attachments";
  readonly requestedAgeSeconds?: number;
  readonly states: readonly DiscoveryRetainedStateReference[];
  readonly boundary?: { readonly path: string; readonly bytes: number; readonly sha256: string };
  readonly centralAttachedIndices?: readonly number[];
  readonly terminalStopReason?: DiscoveryStopReason;
  readonly terminalTiming?: "last-committed-cycle-boundary";
}

type Intent = Omit<DiscoveryRetainedObservation, "schema" | "rowId" | "states"> & { readonly ticks: readonly number[] };
interface Request {
  readonly schema: "discovery-retained-request-v1";
  readonly rowId: string;
  readonly committedTick: number;
  readonly intents: readonly Intent[];
}
interface Pointer {
  current: { directory: string; manifestSha256: string };
  previous: { directory: string; manifestSha256: string } | null;
}
interface Generation {
  tick: number;
  solver: { bytes: number; sha256: string };
  binding: { row: DiscoveryRow };
}
export interface RetainedCycleObservation {
  readonly tick: number;
  readonly beforeTimeSeconds: number;
  readonly afterTimeSeconds: number;
  readonly historyActive: boolean | undefined;
  readonly attached: readonly { readonly index: number; readonly coords: readonly number[] }[];
  readonly boundary?: DiscoveryRetainedBoundary;
  readonly terminalStopReason: DiscoveryStopReason | null;
}

const digest = (bytes: Uint8Array): string => createHash("sha256").update(bytes).digest("hex");
const jsonBytes = (value: unknown): Buffer => Buffer.from(`${JSON.stringify(value, null, 2)}\n`);
const json = <T>(path: string): T => JSON.parse(readFileSync(path, "utf8")) as T;

/** One writer, copy-first publication; an interrupted temporary copy is never a published capture. */
function immutableJson(path: string, value: unknown): void {
  const bytes = jsonBytes(value);
  if (existsSync(path)) {
    if (!readFileSync(path).equals(bytes)) throw new Error(`retained observation conflicts with existing bytes: ${path}`);
    return;
  }
  const temporary = `${path}.${randomUUID()}.tmp`;
  writeFileSync(temporary, bytes, { flag: "wx" });
  renameSync(temporary, path);
}

export function validateDiscoveryRetainedObservations(value: DiscoveryRetainedObservations, row: DiscoveryRow): void {
  if (!Array.isArray(value.ageSeconds) || value.ageSeconds.some((age, i) =>
    !Number.isFinite(age) || age <= 0 || (i > 0 && age <= value.ageSeconds[i - 1])) ||
    typeof value.widthHistorySwitch !== "boolean") throw new Error("invalid retained observation ages or switch setting");
  if (value.widthHistorySwitch && row.experimentalBasalWidthHistory?.mode !== "early-only") {
    throw new Error("retained width-switch observations require early-only history");
  }
  const central = value.centralAttachments;
  if (central !== undefined && (!Number.isSafeInteger(central.maxHexRadiusCells) || central.maxHexRadiusCells < 0 ||
    !Array.isArray(central.absoluteZOffsets) || central.absoluteZOffsets.length === 0 ||
    central.absoluteZOffsets.some((z, i) => !Number.isSafeInteger(z) || z < 1 ||
      (i > 0 && z <= central.absoluteZOffsets[i - 1])))) throw new Error("invalid retained central attachment region");
}

/** Retain observations outside rotating restart generations without changing scientific evolution. */
export class DiscoveryRetainedObservationStore {
  private readonly output: string;
  private readonly row: DiscoveryRow;
  private readonly config: DiscoveryRetainedObservations;
  private readonly center: readonly number[];
  private readonly root: string;
  private readonly requests: string;
  private readonly labels: string;
  private readonly generations: string;
  private readonly boundaries: string;

  constructor(output: string, row: DiscoveryRow, config: DiscoveryRetainedObservations, center: readonly number[]) {
    validateDiscoveryRetainedObservations(config, row);
    this.output = output; this.row = row; this.config = config; this.center = center;
    this.root = resolve(output, "captures");
    this.requests = resolve(this.root, "requests");
    this.labels = resolve(this.root, "labels");
    this.generations = resolve(this.root, "generations");
    this.boundaries = resolve(this.root, "boundaries");
    for (const directory of [this.requests, this.labels, this.generations, this.boundaries]) mkdirSync(directory, { recursive: true });
  }

  needsBoundary(historyActive: boolean | undefined): boolean {
    return this.config.widthHistorySwitch && (historyActive === true || !existsSync(resolve(this.labels, "width-first-inactive.json")));
  }

  prepareInitial(): void {
    this.request("cycle-0.json", 0, [{ kind: "initial", label: "initial", ticks: [0] }]);
  }

  prepareCycle(cycle: RetainedCycleObservation): void {
    const intents: Intent[] = [];
    const pair = [cycle.tick - 1, cycle.tick];
    for (const age of this.config.ageSeconds) {
      if (cycle.beforeTimeSeconds < age && cycle.afterTimeSeconds >= age) {
        intents.push({ kind: "age", label: `age-${String(age).replaceAll(".", "p")}`, requestedAgeSeconds: age, ticks: pair });
      }
    }
    if (this.config.widthHistorySwitch) {
      const cutoff = this.row.experimentalBasalWidthHistory!.cutoffSeconds;
      const lastActive = cycle.historyActive === true && cycle.afterTimeSeconds >= cutoff;
      const firstInactive = cycle.historyActive === false && !existsSync(resolve(this.labels, "width-first-inactive.json"));
      if (lastActive || firstInactive) {
        if (cycle.boundary === undefined || cycle.boundary.completedCycles !== cycle.tick - 1 ||
          cycle.boundary.simTimeSeconds !== cycle.beforeTimeSeconds) throw new Error("missing or shifted retained switch boundary map");
        if (firstInactive && !existsSync(resolve(this.labels, "width-last-active.json"))) {
          throw new Error("first inactive observation is missing its retained active predecessor");
        }
        const path = `captures/boundaries/cycle-${cycle.tick}.json`;
        immutableJson(resolve(this.output, path), cycle.boundary);
        const bytes = readFileSync(resolve(this.output, path));
        const kind = lastActive ? "width-last-active" : "width-first-inactive";
        intents.push({ kind, label: kind, ticks: pair, requestedAgeSeconds: cutoff,
          boundary: { path, bytes: bytes.length, sha256: digest(bytes) } });
      }
    }
    const region = this.config.centralAttachments;
    if (region !== undefined) {
      const central = cycle.attached.filter(({ coords }) => {
        const q = coords[0] - this.center[0], r = coords[1] - this.center[1], z = coords[2] - this.center[2];
        return Math.max(Math.abs(q), Math.abs(r), Math.abs(q + r)) <= region.maxHexRadiusCells &&
          region.absoluteZOffsets.includes(Math.abs(z));
      });
      if (central.length > 0) intents.push({ kind: "central-attachments", label: `central-attachments-cycle-${cycle.tick}`,
        ticks: pair, centralAttachedIndices: central.map(({ index }) => index) });
    }
    if (cycle.terminalStopReason !== null) intents.push({ kind: "terminal", label: "terminal", ticks: [cycle.tick],
      terminalStopReason: cycle.terminalStopReason, terminalTiming: "last-committed-cycle-boundary" });
    if (intents.length > 0) this.request(`cycle-${cycle.tick}.json`, cycle.tick, intents);
  }

  private request(name: string, committedTick: number, intents: readonly Intent[]): void {
    immutableJson(resolve(this.requests, name), { schema: "discovery-retained-request-v1", rowId: this.row.id,
      committedTick, intents } satisfies Request);
  }

  /** Called before the next update: no selected predecessor can be rotated away first. */
  afterCheckpoint(): void {
    const current = this.currentTick();
    const path = resolve(this.requests, `cycle-${current}.json`);
    if (existsSync(path)) this.publishRequest(json<Request>(path));
  }

  /** Check existing captures and finish any interrupted committed copy before continuing. */
  reconcile(): void {
    const current = this.currentTick();
    for (const name of readdirSync(this.requests).filter((name) => /^(?:cycle|terminal)-\d+\.json$/.test(name))) {
      const request = json<Request>(resolve(this.requests, name));
      if (request.committedTick <= current) this.publishRequest(request);
    }
  }

  /** A failed relaxation has no complete-cycle state; retain the last committed boundary honestly. */
  retainTerminal(reason: DiscoveryStopReason): void {
    if (reason === "checkpoint-pause" || existsSync(resolve(this.labels, "terminal.json"))) return;
    const pointerPath = resolve(this.output, "resume/latest.json");
    if (!existsSync(pointerPath)) return;
    const current = this.currentTick();
    this.request(`terminal-${current}.json`, current, [{ kind: "terminal", label: "terminal", ticks: [current],
      terminalStopReason: reason, terminalTiming: "last-committed-cycle-boundary" }]);
    this.publishRequest(json<Request>(resolve(this.requests, `terminal-${current}.json`)));
  }

  private currentTick(): number {
    const pointer = json<Pointer>(resolve(this.output, "resume/latest.json"));
    return json<Generation>(resolve(this.output, "resume", pointer.current.directory, "manifest.json")).tick;
  }

  private publishRequest(request: Request): void {
    if (request.schema !== "discovery-retained-request-v1" || request.rowId !== this.row.id) throw new Error("retained request identity mismatch");
    for (const intent of request.intents) {
      const { ticks, ...detail } = intent;
      const states = ticks.map((tick) => this.retainGeneration(tick));
      if (intent.boundary !== undefined) {
        const bytes = readFileSync(resolve(this.output, intent.boundary.path));
        if (bytes.length !== intent.boundary.bytes || digest(bytes) !== intent.boundary.sha256) throw new Error("retained boundary map mismatch");
      }
      immutableJson(resolve(this.labels, `${intent.label}.json`), { schema: "discovery-retained-observation-v1",
        rowId: this.row.id, ...detail, states } satisfies DiscoveryRetainedObservation);
    }
  }

  private retainGeneration(tick: number): DiscoveryRetainedStateReference {
    const directory = `captures/generations/tick-${tick}`;
    const target = resolve(this.output, directory);
    if (!existsSync(target)) {
      const pointer = json<Pointer>(resolve(this.output, "resume/latest.json"));
      let source: string | undefined;
      let sourceDigest: string | undefined;
      for (const ref of [pointer.previous, pointer.current]) {
        if (ref === null) continue;
        const candidate = resolve(this.output, "resume", ref.directory);
        const manifestBytes = readFileSync(resolve(candidate, "manifest.json"));
        if (digest(manifestBytes) !== ref.manifestSha256) throw new Error("retained source manifest mismatch");
        if ((JSON.parse(manifestBytes.toString("utf8")) as Generation).tick === tick) { source = candidate; sourceDigest = ref.manifestSha256; break; }
      }
      if (source === undefined) throw new Error(`required retained generation ${tick} is no longer available`);
      const temporary = resolve(this.generations, `pending-tick-${tick}-${randomUUID()}`);
      mkdirSync(temporary);
      copyFileSync(resolve(source, "manifest.json"), resolve(temporary, "manifest.json"));
      copyFileSync(resolve(source, "solver.bin"), resolve(temporary, "solver.bin"));
      const checked = this.checkGeneration(temporary, tick, directory);
      if (checked.manifestSha256 !== sourceDigest) throw new Error("retained generation copy mismatch");
      renameSync(temporary, target);
      return checked;
    }
    return this.checkGeneration(target, tick, directory);
  }

  private checkGeneration(path: string, tick: number, directory: string): DiscoveryRetainedStateReference {
    const manifestBytes = readFileSync(resolve(path, "manifest.json"));
    const manifest = JSON.parse(manifestBytes.toString("utf8")) as Generation;
    const solverBytes = readFileSync(resolve(path, "solver.bin"));
    if (manifest.tick !== tick || JSON.stringify(manifest.binding.row) !== JSON.stringify(this.row) ||
        solverBytes.length !== manifest.solver.bytes || digest(solverBytes) !== manifest.solver.sha256) {
      throw new Error("retained generation binding or solver payload mismatch");
    }
    const decoded = decodeDiscoveryResumeCheckpoint(solverBytes);
    if (decoded.tick !== tick) throw new Error("retained generation decoded tick mismatch");
    const state = takeDecodedDiscoveryResumeCheckpoint(decoded);
    return { tick, simTimeSeconds: state.simTimeSeconds, directory, manifestSha256: digest(manifestBytes), solver: manifest.solver };
  }
}
