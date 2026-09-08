/** Offline observations only. This module is not imported by the running experiment. */
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { coordsOf, domainCenter, hexSeedSites, type Dims } from "@vcc/core";
import type { DiscoveryRow, DiscoverySpatialSnapshot, DiscoveryTerminalResult } from "./post-phase10-discovery.ts";
import { measureCavityGeometry, type CavityGeometry } from "./post-phase10-cavity-geometry.ts";
import { summarizeCavityBoundary } from "./post-phase10-cavity-spatial.ts";

interface InputIdentity { path: string; byteLength: number; sha256: string }
interface Event {
  cycle: number;
  attached: { index: number; coords: number[] }[];
  attachedCount: number;
  extent: number;
  simTimeSeconds: number;
}
interface State { cycle: number; simTimeSeconds: number; extent: number; attachedCount: number }
interface Frame extends State { geometry: CavityGeometry }
interface EnclosureEpisode { start: State; endExclusive: State | null }
export interface CavityAnalysisOptions {
  /** Largest occupied lattice-coordinate center span, not a Cartesian bounding diameter. */
  centerSpansUm?: readonly number[];
  probeRadiusUm?: number;
}
interface LoadedRow {
  directory: string;
  row: DiscoveryRow;
  result: DiscoveryTerminalResult | null;
  exitCode: number | null;
  sources: InputIdentity[];
  status: "pending" | "inadmissible" | "complete";
}

const DEFAULT_SPANS_UM = [4.2, 5.6, 7, 8.4, 9.8] as const;
const TIME_FRACTIONS = [0, 0.25, 0.5, 0.75, 1] as const;

function readInput<T>(path: string, sources: InputIdentity[]): T {
  const bytes = readFileSync(path);
  sources.push({ path: resolve(path), byteLength: bytes.byteLength,
    sha256: createHash("sha256").update(bytes).digest("hex") });
  return JSON.parse(bytes.toString("utf8")) as T;
}

function loadRow(directory: string): LoadedRow {
  const sources: InputIdentity[] = [];
  const { row } = readInput<{ row: DiscoveryRow }>(resolve(directory, "spec.json"), sources);
  if (row.timelineEvent !== undefined) throw new Error(`${row.id}: cavity analysis is constant-temperature only`);
  if (!existsSync(resolve(directory, "result.json")) || !existsSync(resolve(directory, "exit.json"))) {
    return { directory, row, result: null, exitCode: null, sources, status: "pending" };
  }
  const result = readInput<DiscoveryTerminalResult>(resolve(directory, "result.json"), sources);
  const exit = readInput<{ rowId: string; exitCode: number }>(resolve(directory, "exit.json"), sources);
  if (result.rowId !== row.id || exit.rowId !== row.id) throw new Error(`${row.id}: terminal row mismatch`);
  return { directory, row, result, exitCode: exit.exitCode, sources,
    status: result.admissible && exit.exitCode === 0 ? "complete" : "inadmissible" };
}

/** Sampling is piecewise-constant occupancy; the next event is retained, never interpolated. */
export function bracketCavityTime<T extends State>(states: readonly T[], timeSeconds: number) {
  if (states.length === 0 || !Number.isFinite(timeSeconds) || timeSeconds < states[0].simTimeSeconds ||
    timeSeconds > states[states.length - 1].simTimeSeconds) throw new Error("time outside retained trajectory");
  const nextIndex = states.findIndex((state) => state.simTimeSeconds > timeSeconds);
  const before = states[nextIndex < 0 ? states.length - 1 : nextIndex - 1];
  return { requestedTimeSeconds: timeSeconds, atOrBefore: before,
    nextEvent: nextIndex < 0 ? null : states[nextIndex],
    exactEventTime: before.simTimeSeconds === timeSeconds };
}

function initialState(row: DiscoveryRow, count: number): State {
  return { cycle: 0, simTimeSeconds: 0, attachedCount: count,
    extent: Math.max(2 * row.seedRadius + 1, row.seedThickness) };
}

function analyzeCompleteRow(input: LoadedRow, commonTimeSeconds: number, options: CavityAnalysisOptions) {
  const { row, sources, directory } = input;
  const result = input.result!;
  const dims: Dims = { nx: row.dimsN, ny: row.dimsN, nz: row.dimsN };
  const center = domainCenter(dims);
  const occupied = new Set(hexSeedSites(dims, row.seedRadius, row.seedThickness));
  const seedCount = occupied.size;
  const initial = initialState(row, seedCount);
  const eventPath = resolve(directory, "events.jsonl");
  const bytes = readFileSync(eventPath);
  sources.push({ path: eventPath, byteLength: bytes.byteLength,
    sha256: createHash("sha256").update(bytes).digest("hex") });
  const events = bytes.toString("utf8").trim().split("\n").filter(Boolean).map((line) => JSON.parse(line) as Event);
  const states: State[] = [initial, ...events.map(({ cycle, simTimeSeconds, extent, attachedCount }) =>
    ({ cycle, simTimeSeconds, extent, attachedCount }))];
  const final = states[states.length - 1];
  if (events.length !== result.cycles || final.cycle !== result.cycles ||
    final.attachedCount !== result.attachedCount || final.extent !== result.extent ||
    final.simTimeSeconds !== result.simTimeSeconds || seedCount !== result.seedSites) {
    throw new Error(`${row.id}: terminal event/seed mismatch`);
  }
  for (let n = 1; n < states.length; n++) {
    if (states[n].cycle !== n || !(states[n].simTimeSeconds > states[n - 1].simTimeSeconds)) {
      throw new Error(`${row.id}: nonsequential cycle or physical time`);
    }
  }
  const sizeSelections = (options.centerSpansUm ?? DEFAULT_SPANS_UM).map((targetCenterSpanUm) => {
    if (!Number.isFinite(targetCenterSpanUm) || targetCenterSpanUm < 0) throw new Error("invalid center-span target");
    // Tiny arithmetic allowance only: a nominal 7 um lattice span may evaluate just below 7.
    const selected = states.find((state) => (state.extent - 1) * row.dxUm + 1e-12 >= targetCenterSpanUm);
    const actualCenterSpanUm = selected === undefined ? null : (selected.extent - 1) * row.dxUm;
    return { targetCenterSpanUm, selectedCycle: selected?.cycle ?? null, actualCenterSpanUm,
      exactTarget: actualCenterSpanUm !== null && Math.abs(actualCenterSpanUm - targetCenterSpanUm) <= 1e-12 };
  });
  const times = TIME_FRACTIONS.map((fraction) => ({ fraction,
    ...bracketCavityTime(states, fraction * commonTimeSeconds) }));
  const requestedCycles = new Set([0, final.cycle]);
  for (const size of sizeSelections) if (size.selectedCycle !== null) requestedCycles.add(size.selectedCycle);
  for (const time of times) {
    requestedCycles.add(time.atOrBefore.cycle);
    if (time.nextEvent !== null) requestedCycles.add(time.nextEvent.cycle);
  }
  const snapshots = (result.spatialSnapshots ?? []).map((record) => {
    const snapshot = readInput<DiscoverySpatialSnapshot>(resolve(directory, record.path), sources);
    const state = states[record.completedCycles];
    if (state === undefined || snapshot.rowId !== row.id || snapshot.dxUm !== row.dxUm ||
      snapshot.dims.nx !== dims.nx || snapshot.dims.ny !== dims.ny || snapshot.dims.nz !== dims.nz ||
      snapshot.timing !== "after-converged-relaxation-before-surface-advance" ||
      JSON.stringify(snapshot.record) !== JSON.stringify(record) || record.actualExtent !== state.extent ||
      record.simTimeSeconds !== state.simTimeSeconds || snapshot.attachedCount !== state.attachedCount) {
      throw new Error(`${row.id}: snapshot does not match pre-update event state`);
    }
    requestedCycles.add(record.completedCycles);
    return snapshot;
  });
  const frames = new Map<number, Frame>();
  const spatial: { record: DiscoverySpatialSnapshot["record"]; profile: ReturnType<typeof summarizeCavityBoundary> }[] = [];
  let firstEnclosedCenter: State | null = null;
  const enclosureEpisodes: EnclosureEpisode[] = [];
  let openEpisode: EnclosureEpisode | null = null;
  let openEpisodeFrame: Frame | null = null;
  let zMin = center[2] - (row.seedThickness - 1) / 2;
  let zMax = center[2] + (row.seedThickness - 1) / 2;
  const occupiedAxis = new Set<number>();
  for (let k = zMin; k <= zMax; k++) occupiedAxis.add(k);
  const retain = (state: State, attachmentChanged: boolean) => {
    const canHaveCenterVoid = occupiedAxis.size < zMax - zMin + 1;
    let geometry: CavityGeometry | null = null;
    if (requestedCycles.has(state.cycle) || (attachmentChanged && canHaveCenterVoid)) {
      geometry = measureCavityGeometry(occupied, dims, row.dxUm, options.probeRadiusUm);
      if (geometry.attachedCount !== state.attachedCount || geometry.spans === null ||
        Math.max(geometry.spans.i.inclusiveCells, geometry.spans.j.inclusiveCells,
          geometry.spans.k.inclusiveCells) !== state.extent) throw new Error(`${row.id}: geometry/event mismatch`);
      if (requestedCycles.has(state.cycle)) frames.set(state.cycle, { ...state, geometry });
    }
    if (attachmentChanged) {
      const enclosed = geometry?.layers.some((layer) => layer.lateralVoid === "enclosed") ?? false;
      if (enclosed && openEpisode === null) {
        openEpisode = { start: state, endExclusive: null };
        openEpisodeFrame = { ...state, geometry: geometry! };
        enclosureEpisodes.push(openEpisode);
        if (firstEnclosedCenter === null) {
          firstEnclosedCenter = state;
          frames.set(state.cycle, openEpisodeFrame);
        }
      } else if (!enclosed && openEpisode !== null) {
        openEpisode.endExclusive = state;
        openEpisode = null;
        openEpisodeFrame = null;
      }
    }
    for (const snapshot of snapshots.filter((value) => value.record.completedCycles === state.cycle)) {
      spatial.push({ record: snapshot.record, profile: summarizeCavityBoundary(snapshot, occupied, options.probeRadiusUm) });
    }
  };
  retain(initial, true);
  for (let n = 0; n < events.length; n++) {
    const event = events[n];
    for (const site of event.attached) {
      const coordinates = coordsOf(dims, site.index);
      if (site.index < 0 || site.index >= dims.nx * dims.ny * dims.nz ||
        coordinates.some((value, axis) => value !== site.coords[axis]) || occupied.has(site.index)) {
        throw new Error(`${row.id}: duplicate or inconsistent attachment at cycle ${event.cycle}`);
      }
      occupied.add(site.index);
      zMin = Math.min(zMin, coordinates[2]);
      zMax = Math.max(zMax, coordinates[2]);
      if (coordinates[0] === center[0] && coordinates[1] === center[1]) occupiedAxis.add(coordinates[2]);
    }
    if (occupied.size !== event.attachedCount) throw new Error(`${row.id}: attachment-count mismatch at cycle ${event.cycle}`);
    retain(states[n + 1], event.attached.length > 0);
  }
  if (openEpisodeFrame !== null) frames.set((openEpisodeFrame as Frame).cycle, openEpisodeFrame);
  // Cast is needed because TypeScript does not track assignments performed inside retain().
  const onset = firstEnclosedCenter as State | null;
  const snapshotBracket = (onsetState: State | null) => {
    const before = onsetState === null ? null : spatial.filter((value) => value.record.completedCycles < onsetState.cycle).at(-1)?.record ?? null;
    const atOrAfter = onsetState === null ? null : spatial.find((value) => value.record.completedCycles >= onsetState.cycle)?.record ?? null;
    return { before, atOrAfter, hasBoth: before !== null && atOrAfter !== null };
  };
  const terminalEpisode = openEpisode as EnclosureEpisode | null;
  return { row, result, sources, commonTimeSeconds, seedOccupiedCellVolumeUm3: frames.get(0)!.geometry.occupiedCellVolumeUm3,
    firstLaterallyEnclosedCenter: onset,
    onsetSnapshotBracket: snapshotBracket(onset),
    enclosureEpisodes, terminalEnclosureEpisode: terminalEpisode,
    terminalEpisodeSnapshotBracket: snapshotBracket(terminalEpisode?.start ?? null),
    sizeSelections, physicalTimeSelections: times,
    frames: [...frames.values()].sort((a, b) => a.cycle - b.cycle), spatial };
}

/** Only completed, admissible rows contribute measurements; live files are never parsed. */
export function analyzeCavityRows(rowDirectories: readonly string[], options: CavityAnalysisOptions = {}) {
  if (rowDirectories.length === 0) throw new Error("at least one cavity row is required");
  const inputs = rowDirectories.map(loadRow);
  const conditions = [...new Set(inputs.map(({ row }) => `${row.tempC}/${row.sigmaInfinity}/${row.pressurePa ?? 101325}`))];
  const groups = conditions.map((condition) => {
    const group = inputs.filter(({ row }) => `${row.tempC}/${row.sigmaInfinity}/${row.pressurePa ?? 101325}` === condition);
    const complete = group.filter((input) => input.status === "complete");
    return { condition, requestedRowIds: group.map((input) => input.row.id),
      contributingRowIds: complete.map((input) => input.row.id),
      allRequestedRowsAdmissible: complete.length === group.length,
      commonTerminalTimeSeconds: complete.length === 0 ? null : Math.min(...complete.map((input) => input.result!.simTimeSeconds)) };
  });
  const rows = inputs.map((input) => {
    if (input.status !== "complete") return { rowId: input.row.id, status: input.status,
      result: input.result, exitCode: input.exitCode, sources: input.sources, analysis: null };
    const group = groups.find((value) => value.contributingRowIds.includes(input.row.id))!;
    return { rowId: input.row.id, status: input.status, exitCode: input.exitCode,
      analysis: analyzeCompleteRow(input, group.commonTerminalTimeSeconds!, options) };
  });
  return { schema: "post-phase10-cavity-analysis-v1", generatedAt: new Date().toISOString(),
    scope: "Retrospective model-development observations, not a scientific gate or physical validation.",
    definitions: {
      volume: "Occupied-cell volume excludes partial fill; it is not total ice mass or total deposited volume.",
      size: "Largest i/j/k lattice-coordinate center span; i/j are not Cartesian bounding projections. Actual crossings retain overshoot.",
      time: "Common physical time within each named supplied condition group; occupancy is the last completed event, with next-event brackets, not interpolation or metric bounds.",
      cavity: "A center-air component laterally enclosed by ice in a six-neighbor plane; straight axial opening is a sufficient opening witness, not a complete 3D closure test.",
      onset: "First laterally enclosed center-air layer in the retained attachment history; can be transient and does not establish a growth mechanism.",
      episodes: "Intervals with at least one laterally enclosed center-air layer. An open terminal interval persisted only through the recorded stop, not indefinitely; it does not imply the same cavity component survived throughout.",
      spatial: "Converged pre-surface-update samples only. An onset bracket permits inspection but does not establish a temporal causal precursor.",
      grid: "Matched center spans and probe radii do not make voxelized seeds identical; two thickness brackets do not bound nonlinear outputs or establish continuum convergence.",
    }, options: { centerSpansUm: options.centerSpansUm ?? DEFAULT_SPANS_UM, probeRadiusUm: options.probeRadiusUm ?? 0.35 },
    allRequestedRowsAdmissible: inputs.every((input) => input.status === "complete"), groups, rows };
}

if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const [mode, first, second, ...rest] = process.argv.slice(2);
  if ((mode !== "campaign" && mode !== "rows") || !first || !second) {
    throw new Error("Usage: node runner/src/post-phase10-cavity-analysis.ts campaign <campaign-directory> <new-output.json> | rows <new-output.json> <row-directory> [...]");
  }
  const campaign = mode === "campaign" ? JSON.parse(readFileSync(resolve(first, "campaign.json"), "utf8")) as { rows: DiscoveryRow[] } : null;
  const directories = campaign === null ? [second, ...rest] : campaign.rows.map((row) => resolve(first, "rows", row.id));
  const report = analyzeCavityRows(directories);
  const output = mode === "campaign" ? second : first;
  const provenance = { command: process.argv, node: process.version,
    analysisGitHead: execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim(),
    analysisWorktreeDirty: execFileSync("git", ["status", "--porcelain"], { encoding: "utf8" }).trim().length > 0 };
  writeFileSync(output, JSON.stringify({ ...report, provenance }, null, 2) + "\n", { encoding: "utf8", flag: "wx" });
  process.stdout.write(JSON.stringify({ output: resolve(output), rows: report.rows.map(({ rowId, status }) => ({ rowId, status })),
    allRequestedRowsAdmissible: report.allRequestedRowsAdmissible }) + "\n");
}
