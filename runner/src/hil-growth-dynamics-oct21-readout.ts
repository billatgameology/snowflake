/** Offline row selection/reconstruction. Frozen cohort comparisons are a later results step. */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { coordsOf, domainCenter, hexSeedSites } from "@vcc/core";
import { summarizeFirstBatchRow } from "./hil-bld-batch-summary.ts";
import { HIL_GROWTH_DYNAMICS_OCT21_ROWS } from "./hil-growth-dynamics-oct21-roster.ts";
import { analyzeCavityRows, bracketCavityTime } from "./post-phase10-cavity-analysis.ts";
import { measureCavityGeometry } from "./post-phase10-cavity-geometry.ts";
import type { DiscoveryRow, DiscoveryTerminalResult } from "./post-phase10-discovery.ts";

interface Event {
  rowId: string; cycle: number; simTimeSeconds: number; extent: number; attachedCount: number;
  attached: { index: number; coords: number[] }[];
  timelineEvent?: unknown;
}
interface Input { path: string; bytes: number; sha256: string }
const hash = (bytes: Buffer) => createHash("sha256").update(bytes).digest("hex");
function readInput(path: string, inputs: Input[]): Buffer {
  const bytes = readFileSync(path);
  inputs.push({ path: resolve(path), bytes: bytes.length, sha256: hash(bytes) });
  return bytes;
}
function json<T>(path: string, inputs: Input[]): T {
  return JSON.parse(readInput(path, inputs).toString("utf8")) as T;
}

/** Reuse lattice geometry and time brackets; independently rederive recorded counts/extents. */
function reconstruct(row: DiscoveryRow, events: readonly Event[], result: DiscoveryTerminalResult) {
  const dims = { nx: row.dimsN, ny: row.dimsN, nz: row.dimsN };
  const occupied = new Set(hexSeedSites(dims, row.seedRadius, row.seedThickness));
  const initialGeometry = measureCavityGeometry(occupied, dims, row.dxUm);
  const low = [Infinity, Infinity, Infinity], high = [-Infinity, -Infinity, -Infinity];
  const include = (index: number) => {
    const coordinates = coordsOf(dims, index);
    coordinates.forEach((value, axis) => {
      low[axis] = Math.min(low[axis], value); high[axis] = Math.max(high[axis], value);
    });
  };
  occupied.forEach(include);
  const state = (cycle: number, simTimeSeconds: number) => ({ cycle, simTimeSeconds,
    attachedCount: occupied.size, extent: Math.max(...high.map((value, axis) => value - low[axis] + 1)),
    iCenterSpanUm: (high[0] - low[0]) * row.dxUm,
    jCenterSpanUm: (high[1] - low[1]) * row.dxUm,
    axialCenterSpanUm: (high[2] - low[2]) * row.dxUm });
  const states = [state(0, 0)];
  assert.equal(result.seedSites, occupied.size, `${row.id}: seed count`);
  for (const event of events) {
    assert.equal(event.rowId, row.id, `${row.id}: event identity`);
    assert.equal(event.cycle, states.length, `${row.id}: event cycle`);
    assert(event.simTimeSeconds > states.at(-1)!.simTimeSeconds, `${row.id}: event time`);
    for (const site of event.attached) {
      assert(Number.isSafeInteger(site.index) && site.index >= 0 && site.index < row.dimsN ** 3,
        `${row.id}: attachment index`);
      assert.deepEqual(site.coords, coordsOf(dims, site.index), `${row.id}: attachment coordinates`);
      assert(!occupied.has(site.index), `${row.id}: repeated attachment`);
      occupied.add(site.index); include(site.index);
    }
    const current = state(event.cycle, event.simTimeSeconds);
    assert.equal(current.attachedCount, event.attachedCount, `${row.id}: reconstructed count`);
    assert.equal(current.extent, event.extent, `${row.id}: reconstructed extent`);
    states.push(current);
  }
  const terminal = states.at(-1)!;
  assert.equal(events.length, result.cycles, `${row.id}: terminal cycle`);
  for (const key of ["simTimeSeconds", "extent", "attachedCount"] as const)
    assert.equal(terminal[key], result[key], `${row.id}: terminal ${key}`);
  const center = domainCenter(dims), rings = new Map<number, number>();
  for (const index of occupied) {
    const [i, j, k] = coordsOf(dims, index);
    if (k !== center[2]) continue;
    const x = i - center[0], y = j - center[1];
    const radius = Math.max(Math.abs(x), Math.abs(y), Math.abs(x + y));
    rings.set(radius, (rings.get(radius) ?? 0) + 1);
  }
  const tip = Math.max(...rings.keys());
  let core = -1;
  for (let radius = 0; radius <= tip; radius++) {
    if ((rings.get(radius) ?? 0) !== (radius === 0 ? 1 : 6 * radius)) break;
    core = radius;
  }
  const timelineEvents = events.filter((event) => event.timelineEvent !== undefined);
  assert.equal(timelineEvents.length, row.timelineEvent === undefined ? 0 : 1, `${row.id}: timeline coverage`);
  const timelineEvent = timelineEvents[0];
  if (timelineEvent !== undefined) assert.equal(result.timeline?.eventCycle, timelineEvent.cycle,
    `${row.id}: timeline cycle`);
  return { reconstructedUpdates: events.length, initial: states[0], terminal, initialGeometry,
    terminalGeometry: measureCavityGeometry(occupied, dims, row.dxUm),
    terminalCentralPlane: { coreRadiusCells: core, tipRadiusCells: tip, gapCells: tip - core,
      coreRadiusUm: core * row.dxUm, tipRadiusUm: tip * row.dxUm, gapUm: (tip - core) * row.dxUm,
      rings: Array.from({ length: tip + 1 }, (_, radius) => ({ radiusCells: radius,
        occupiedSites: rings.get(radius) ?? 0, possibleSites: radius === 0 ? 1 : 6 * radius })) },
    individualAgeBrackets: [0.25, 0.5, 0.75, 1].map((fraction) =>
      bracketCavityTime(states, fraction * terminal.simTimeSeconds)),
    timeline: timelineEvent === undefined ? null : { eventCycle: timelineEvent.cycle,
      actualEventAgeSeconds: timelineEvent.simTimeSeconds,
      availablePostEventSeconds: terminal.simTimeSeconds - timelineEvent.simTimeSeconds,
      sourcePrefixComparison: "pending matched source-static reconstruction" } };
}

/** Missing/live rows are listed without parsing their changing event stream. */
export function readGrowthDynamicsRow(directory: string, expected: DiscoveryRow) {
  const inputs: Input[] = [], base = { rowId: expected.id, directory: resolve(directory), row: expected };
  const specPath = resolve(directory, "spec.json");
  if (!existsSync(specPath)) return { ...base, status: "pending", reason: "no immutable row spec yet", inputs };
  const spec = json<{ row: DiscoveryRow }>(specPath, inputs);
  assert.deepEqual(spec.row, expected, `${expected.id}: immutable registered row mismatch`);
  if (!["result.json", "exit.json"].every((leaf) => existsSync(resolve(directory, leaf))))
    return { ...base, status: "pending", reason: "no complete terminal result and exit", inputs };
  const result = json<DiscoveryTerminalResult>(resolve(directory, "result.json"), inputs);
  const exit = json<{ rowId?: string; exitCode: number | null; signal: string | null;
    termination?: string }>(resolve(directory, "exit.json"), inputs);
  if (exit.rowId !== undefined) assert.equal(exit.rowId, expected.id, "exit row identity");
  const checked = summarizeFirstBatchRow(directory);
  if (checked.disposition !== "size-endpoint" || exit.termination !== undefined)
    return { ...base, status: "unresolved-terminal", stopReason: result.stopReason,
      producer: { gitHead: result.gitHead, node: result.node }, checked, inputs,
      reason: "Only independently checked size endpoints enter this reconstruction recipe" };
  const events = readInput(resolve(directory, "events.jsonl"), inputs).toString("utf8")
    .split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line) as Event);
  const reconstruction = reconstruct(expected, events, result);
  const warm = expected.tempC > -10 && expected.timelineEvent === undefined &&
    !expected.id.startsWith("gd21-hil-h1-") && !expected.id.includes("static");
  // A one-row cavity call supplies per-row witnesses only, never the frozen multi-row cohort age.
  const cavity = warm ? analyzeCavityRows([directory], { centerSpansUm: [9.8] }).rows[0].analysis : null;
  return { ...base, status: "size-endpoint", stopReason: result.stopReason,
    producer: { gitHead: result.gitHead, node: result.node }, checked, inputs, reconstruction,
    cavity: cavity === null ? null : { firstLaterallyEnclosedCenter: cavity.firstLaterallyEnclosedCenter,
      sizeSelections: cavity.sizeSelections, basalWidthHistory: cavity.basalWidthHistory ?? null,
      basalWidthObservation: cavity.basalWidthObservation ?? null,
      straightOpenPlaneIntervals: cavity.straightOpenPlaneIntervals, sources: cavity.sources } };
}

function packageReport(mode: "campaign" | "retained", rows: ReturnType<typeof readGrowthDynamicsRow>[]) {
  assert.equal(new Set(rows.map((row) => row.rowId)).size, rows.length, "duplicate selected row IDs");
  return { schema: "hil-growth-dynamics-oct21-row-readout-v1", createdAt: new Date().toISOString(), mode,
    scope: "Individual saved-row reconstruction only; no frozen-cohort comparison or physical validation.",
    definitions: { age: "Fractions of each individual row's terminal age, not common cohort ages; event brackets without interpolation.",
      extent: "Largest occupied lattice-coordinate extent includes end cells; center span is (extent - 1) times dxUm.",
      occupancy: "Occupied-site counts and occupied-cell volume exclude partial fill and are not total accreted mass.",
      cold: "Terminal central-plane hex rings only; registered exact-tip plateau and common-age comparisons remain pending." },
    census: { requestedRows: rows.length, sizeEndpoints: rows.filter((row) => row.status === "size-endpoint").length,
      missingOrUnresolved: rows.filter((row) => row.status !== "size-endpoint").map((row) => row.rowId) },
    frozenCohortComparisons: { available: false,
      reason: mode === "retained" ? "Retained-input exercise preserves original identities; these are not new campaign results." :
        "This launch slice reconstructs rows; complete bound historical/BLD cohorts and their registered comparisons remain pending.",
      pending: ["W4 twelve-member common-age/size comparison", "C1 matched exact-tip plateaus and common ages",
        "H1 source-prefix equality and joint Dnew/D0 history/static windows"] }, rows };
}

export function readHilGrowthDynamicsCampaign(directory: string) {
  return packageReport("campaign", HIL_GROWTH_DYNAMICS_OCT21_ROWS.map(({ row }) =>
    readGrowthDynamicsRow(resolve(directory, "rows", row.id), row)));
}

export function readRetainedGrowthDynamicsRows(directories: readonly string[]) {
  assert(directories.length > 0, "retained mode needs explicit row directories");
  return packageReport("retained", directories.map((directory) => {
    const { row } = JSON.parse(readFileSync(resolve(directory, "spec.json"), "utf8")) as { row: DiscoveryRow };
    return readGrowthDynamicsRow(directory, row);
  }));
}

if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const [mode, first, second, ...rest] = process.argv.slice(2);
  if ((mode === "campaign" && first && second && rest.length === 0) ||
      (mode === "retained" && first && second)) {
    const output = resolve(mode === "campaign" ? second : first);
    const report = mode === "campaign" ? readHilGrowthDynamicsCampaign(first) :
      readRetainedGrowthDynamicsRows([second, ...rest]);
    mkdirSync(dirname(output), { recursive: true });
    writeFileSync(output, JSON.stringify({ ...report, command: process.argv }, null, 2) + "\n", { flag: "wx" });
    console.log(JSON.stringify({ output, sha256: hash(readFileSync(output)), census: report.census,
      frozenCohortComparisonsAvailable: false }));
  } else throw new Error("Usage: node runner/src/hil-growth-dynamics-oct21-readout.ts campaign <root> <new-output.json> | retained <new-output.json> <row-directory> [...]");
}
