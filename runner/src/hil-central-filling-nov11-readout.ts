/** Read immutable mechanism captures; never relax or advance the restored solver. */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { coordsOf, decodeDiscoveryResumeCheckpoint, idx } from "@vcc/core";
import { LKSolver } from "@vcc/solver-cpu";
import { validateDiscoveryRetainedObservations,
  type DiscoveryRetainedObservations, type DiscoveryRetainedStateReference as StateReference,
  type DiscoveryRetainedObservation as CaptureLabel, type DiscoveryRetainedBoundary as Boundary,
} from "./discovery-retained-observations.ts";
import { HIL_CENTRAL_FILLING_NOV11_ROWS, centralFillingObservations } from "./hil-central-filling-nov11-roster.ts";
import { readGrowthDynamicsRow } from "./hil-growth-dynamics-oct21-readout.ts";
import { measureCavityGeometry } from "./post-phase10-cavity-geometry.ts";
import type { DiscoveryRow } from "./post-phase10-discovery.ts";

interface Input { path: string; bytes: number; sha256: string }
interface FileBinding { bytes: number; sha256: string }
interface Generation {
  binding: { schema: string; row: DiscoveryRow; gitHead: string; node: string; v8: string; hostname: string };
  tick: number; solver: FileBinding; eventPrefix: FileBinding;
  snapshots: (FileBinding & { path: string })[];
}
const digest = (bytes: Uint8Array) => createHash("sha256").update(bytes).digest("hex");
const ageLabel = (age: number) => `age-${String(age).replaceAll(".", "p")}`;

/** The observation region is registered, not inferred from the resulting morphology. */
function centralCoordinates(config: DiscoveryRetainedObservations): [number, number, number][] {
  if (config.centralAttachments === undefined) return [];
  const { maxHexRadiusCells: radius, absoluteZOffsets } = config.centralAttachments;
  const zOffsets = [...new Set(absoluteZOffsets.flatMap((z) => [-Math.abs(z), Math.abs(z)]))].sort((a, b) => a - b);
  const coordinates: [number, number, number][] = [];
  for (const z of zOffsets) for (let x = -radius; x <= radius; x++) for (let y = -radius; y <= radius; y++)
    if (Math.max(Math.abs(x), Math.abs(y), Math.abs(x + y)) <= radius) coordinates.push([x, y, z]);
  return coordinates;
}

export function readCentralFillingRow(directory: string, expected: DiscoveryRow,
  expectedObservations?: DiscoveryRetainedObservations) {
  const terminal = readGrowthDynamicsRow(directory, expected, { cavity: true });
  const inputs = new Map<string, Input>();
  function read(path: string, binding?: FileBinding): Buffer {
    const absolute = resolve(path), bytes = readFileSync(absolute), sha256 = digest(bytes);
    if (binding !== undefined) {
      assert.equal(bytes.length, binding.bytes, `${expected.id}: retained byte length mismatch: ${path}`);
      assert.equal(sha256, binding.sha256, `${expected.id}: retained digest mismatch: ${path}`);
    }
    inputs.set(absolute, { path: absolute, bytes: bytes.length, sha256 });
    return bytes;
  }
  function json<T>(path: string, binding?: FileBinding): T { return JSON.parse(read(path, binding).toString("utf8")) as T; }
  const specPath = resolve(directory, "spec.json");
  const spec = existsSync(specPath) ? json<{ row: DiscoveryRow; retainedObservations?: DiscoveryRetainedObservations }>(specPath) : null;
  if (spec !== null && expectedObservations !== undefined)
    assert.deepEqual(spec.retainedObservations, expectedObservations, `${expected.id}: registered observation mismatch`);
  const config = expectedObservations ?? spec?.retainedObservations;
  if (config !== undefined) validateDiscoveryRetainedObservations(config, expected);
  const requiredLabels = config === undefined ? [] : ["initial", "terminal", ...config.ageSeconds.map(ageLabel),
    ...(config.widthHistorySwitch ? ["width-last-active", "width-first-inactive"] : [])];
  const coordinates = config === undefined ? [] : centralCoordinates(config);
  const labelsPath = resolve(directory, "captures", "labels");
  const files = existsSync(labelsPath) ? readdirSync(labelsPath).filter((name) => name.endsWith(".json")).sort() : [];
  const eventsPath = resolve(directory, "events.jsonl");
  // Appending live rows are safe to inspect only through a committed capture's fixed prefix.
  const eventBytes = files.length > 0 ? readFileSync(eventsPath) : Buffer.alloc(0);
  const states = new Map<string, ReturnType<typeof state>>();
  function state(ref: StateReference) {
    assert.equal(ref.directory, `captures/generations/tick-${ref.tick}`, "retained generation path/tick mismatch");
    const manifestPath = resolve(directory, ref.directory, "manifest.json");
    const manifestBytes = read(manifestPath);
    assert.equal(digest(manifestBytes), ref.manifestSha256, `${expected.id}: retained manifest digest mismatch`);
    const manifest = JSON.parse(manifestBytes.toString("utf8")) as Generation;
    assert.equal(manifest.binding.schema, "discovery-row-resume-v1", "retained generation schema");
    assert.deepEqual(manifest.binding.row, expected, `${expected.id}: retained row mismatch`);
    assert.equal(manifest.tick, ref.tick, "retained manifest tick mismatch");
    assert.deepEqual(manifest.solver, ref.solver, "retained solver binding mismatch");
    assert(Number.isSafeInteger(manifest.eventPrefix.bytes) && manifest.eventPrefix.bytes >= 0 &&
      manifest.eventPrefix.bytes <= eventBytes.length, "retained event prefix missing/truncated");
    assert.equal(digest(eventBytes.subarray(0, manifest.eventPrefix.bytes)), manifest.eventPrefix.sha256,
      `${expected.id}: retained event prefix digest mismatch`);
    for (const snapshot of manifest.snapshots) read(resolve(directory, snapshot.path), snapshot);
    const solverPath = resolve(directory, ref.directory, "solver.bin");
    const solver = LKSolver.restoreDiscovery(decodeDiscoveryResumeCheckpoint(read(solverPath, ref.solver)));
    assert.equal(solver.tick, ref.tick, "retained solver tick mismatch");
    assert.equal(solver.simTimeSeconds, ref.simTimeSeconds, "retained solver time mismatch");
    assert.deepEqual(solver.dims, { nx: expected.dimsN, ny: expected.dimsN, nz: expected.dimsN }, "retained dimensions");
    assert.equal(solver.experimentalBasalWidthCells, expected.experimentalBasalWidthCells, "retained width");
    assert.deepEqual(solver.experimentalBasalWidthHistory, expected.experimentalBasalWidthHistory, "retained history");
    const occupied = new Set<number>();
    for (let index = 0; index < solver.a.length; index++) if (solver.a[index] === 1) occupied.add(index);
    const centralCells = coordinates.map((offset) => {
      const index = idx(solver.dims, solver.center[0] + offset[0], solver.center[1] + offset[1], solver.center[2] + offset[2]);
      const attached = solver.a[index] === 1;
      return { index, offset, offsetUm: offset.map((value) => value * expected.dxUm), attached,
        fill: solver.f[index], latticeCellSigma: attached ? null : solver.sigma[index] };
    });
    const arrays = { occupancy: solver.a, fill: solver.f, latticeSupersaturation: solver.sigma };
    return { tick: solver.tick, simTimeSeconds: solver.simTimeSeconds, source: ref,
      producer: manifest.binding, committedEventPrefix: { path: eventsPath, ...manifest.eventPrefix },
      attachedCount: occupied.size, geometry: measureCavityGeometry(occupied, solver.dims, expected.dxUm),
      centralCells, centralAttachedCount: centralCells.filter((cell) => cell.attached).length,
      arrays: Object.fromEntries(Object.entries(arrays).map(([name, array]) => [name, {
        cells: array.length, bytes: array.byteLength,
        sha256: digest(new Uint8Array(array.buffer, array.byteOffset, array.byteLength)),
      }])) };
  }
  const labels = files.map((file) => {
    const label = json<CaptureLabel>(resolve(labelsPath, file));
    assert.equal(label.schema, "discovery-retained-observation-v1", "retained label schema");
    assert.equal(label.rowId, expected.id, "retained label row identity");
    assert.equal(file, `${label.label}.json`, "retained label filename identity");
    assert(["initial", "terminal", "age", "width-last-active", "width-first-inactive", "central-attachments"].includes(label.kind),
      "unknown retained observation kind");
    assert(label.states.length > 0, "retained label has no states");
    for (const ref of label.states) {
      const known = states.get(ref.directory);
      if (known === undefined) states.set(ref.directory, state(ref));
      else assert.deepEqual(known.source, ref, "conflicting retained state references");
    }
    if (label.kind === "age") {
      assert.equal(label.label, ageLabel(label.requestedAgeSeconds!), "retained age label mismatch");
      assert(config?.ageSeconds.includes(label.requestedAgeSeconds!), "unregistered retained age");
      assert(label.states[0].simTimeSeconds <= label.requestedAgeSeconds! &&
        label.states.at(-1)!.simTimeSeconds >= label.requestedAgeSeconds!, "retained states do not bracket requested age");
    }
    let boundary = null;
    if (label.boundary !== undefined) {
      const value = json<Boundary>(resolve(directory, label.boundary.path), label.boundary);
      assert.equal(value.schema, "discovery-retained-boundary-v1", "retained boundary schema");
      assert.equal(value.rowId, expected.id, "retained boundary row identity");
      assert.equal(value.timing, "after-converged-relaxation-before-surface-advance", "retained boundary timing");
      assert.deepEqual(value.dims, { nx: expected.dimsN, ny: expected.dimsN, nz: expected.dimsN }, "retained boundary dimensions");
      const byIndex = new Map(value.cells.map((cell) => {
        assert.deepEqual(cell.coords, coordsOf(value.dims, cell.index), "retained boundary coordinates");
        return [cell.index, cell] as const;
      }));
      boundary = { source: label.boundary, timing: value.timing, completedCycles: value.completedCycles,
        simTimeSeconds: value.simTimeSeconds, attachedCount: value.attachedCount,
        centralCells: coordinates.map((offset) => {
          const index = idx(value.dims, value.center[0] + offset[0], value.center[1] + offset[1], value.center[2] + offset[2]);
          const cell = byIndex.get(index);
          return { index, offset, offsetUm: offset.map((coordinate) => coordinate * expected.dxUm),
            presentOnBoundary: cell !== undefined, values: cell ?? null };
        }) };
    }
    return { ...label, boundaryReadout: boundary };
  });
  const missingLabels = requiredLabels.filter((label) => !labels.some((record) => record.label === label));
  return { ...terminal, retainedObservations: { configured: config !== undefined, configuration: config ?? null,
    requiredLabels, missingLabels, completeNamedLabels: config !== undefined && missingLabels.length === 0,
    missingMeaning: "Unavailable at this observation; a pending row may not have reached the trigger, while an earlier terminal row may never reach it.",
    centralAttachmentLabels: labels.filter((label) => label.kind === "central-attachments").length,
    centralRegionSites: coordinates.length, labels, states: [...states.values()].sort((a, b) => a.tick - b.tick),
    inputs: [...inputs.values()] } };
}

export function readHilCentralFillingCampaign(directory: string) {
  const rows = HIL_CENTRAL_FILLING_NOV11_ROWS.map(({ row }) =>
    readCentralFillingRow(resolve(directory, "rows", row.id), row, centralFillingObservations(row)));
  return packageReport("campaign", rows);
}
function packageReport(mode: "campaign" | "retained", rows: ReturnType<typeof readCentralFillingRow>[]) {
  return { schema: "hil-central-filling-nov11-readout-v1", createdAt: new Date().toISOString(), mode,
    scope: "Individual event reconstruction and read-only retained-state observations; matched cohort conclusions remain pending.",
    definitions: {
      stateTiming: "Completed-cycle full states; their lattice fields come from the preceding relaxation, not a new solve on the post-update geometry.",
      boundaryTiming: "Converged boundary observations before surface advance; sigmaBoundary is distinct from checkpoint lattice supersaturation.",
      fill: "Preserved per-cell fill fractions, not flux or a claim that an unfilled cell can never attach. Attached-cell lattice sigma is omitted.",
      centralRegion: "Registered first axial layers outside the seed and integer hex patches; coarse/fine site counts and seed geometry differ.",
      causality: "Different preparations retain coupled geometry/fill/vapor/history differences; no component was transplanted or isolated.",
    }, census: { requestedRows: rows.length, sizeEndpoints: rows.filter((row) => row.status === "size-endpoint").length,
      rowsWithCaptures: rows.filter((row) => row.retainedObservations.states.length > 0).length,
      retainedStates: rows.reduce((sum, row) => sum + row.retainedObservations.states.length, 0) },
    matchedCohortComparisons: { available: false, reason: "Run the registered A/B/C cohort comparisons only with complete, bound operands and explicit missing coverage." }, rows };
}

if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const [mode, first, second, ...rest] = process.argv.slice(2);
  assert((mode === "campaign" && first && second && rest.length === 0) || (mode === "retained" && first && second),
    "Usage: node runner/src/hil-central-filling-nov11-readout.ts campaign <root> <new-output.json> | retained <new-output.json> <row-directory> [...]");
  const output = resolve(mode === "campaign" ? second : first);
  const report = mode === "campaign" ? readHilCentralFillingCampaign(first) : packageReport("retained", [second, ...rest].map((directory) => {
    const { row } = JSON.parse(readFileSync(resolve(directory, "spec.json"), "utf8")) as { row: DiscoveryRow };
    return readCentralFillingRow(directory, row);
  }));
  mkdirSync(dirname(output), { recursive: true });
  writeFileSync(output, JSON.stringify({ ...report, command: process.argv }, null, 2) + "\n", { flag: "wx" });
  console.log(JSON.stringify({ output, sha256: digest(readFileSync(output)), census: report.census }));
}
