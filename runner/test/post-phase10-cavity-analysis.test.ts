import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { coordsOf, idx } from "@vcc/core";
import { afterEach, describe, expect, it } from "vitest";
import { analyzeCavityRows, bracketCavityTime } from "../src/post-phase10-cavity-analysis.ts";

const scratch: string[] = [];
const dims = { nx: 20, ny: 20, nz: 20 };
const neighbors = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, -1], [-1, 1]];
const fixed = { surfacePolicy: "aggregate-hv-g1h1-v6", farField: "monopole-matched",
  pressurePa: 101325, rngSeed: 1, noiseEpsilon: 0, relaxTol: 1e-9, divTol: 1e-7, relaxMaxSweeps: 200000 };
function json(path: string, value: unknown) { writeFileSync(path, JSON.stringify(value)); }
function fixture(id: string, timeScale = 1, pending = false) {
  const root = mkdtempSync(join(tmpdir(), "vcc-cavity-analysis-"));
  scratch.push(root);
  const directory = join(root, id);
  mkdirSync(directory);
  const row = { id, lane: "cavity-mechanism", conditional: false, tempC: -4.5, fraction: 0.075,
    sigmaInfinity: 0.003375, pressurePa: 101325, paramSet: "M1", dimsN: 20, dxUm: 0.35,
    cflFill: 0.05, seedRadius: 0, seedThickness: 1, targetExtent: 5, maxSteps: 100 };
  json(join(directory, "spec.json"), { row });
  const batches = [neighbors.map(([di, dj]) => idx(dims, 10 + di, 10 + dj, 11)),
    [idx(dims, 10, 10, 11), idx(dims, 10, 10, 9)], [idx(dims, 13, 10, 10)]];
  let count = 1;
  const events = batches.map((batch, n) => {
    count += batch.length;
    return { cycle: n + 1, attached: batch.map((index) => ({ index, coords: coordsOf(dims, index) })),
      attachedCount: count, extent: [3, 3, 5][n], simTimeSeconds: [1, 3, 4][n] * timeScale };
  });
  writeFileSync(join(directory, "events.jsonl"), events.map((value) => JSON.stringify(value)).join("\n") + "\n");
  const result = { rowId: id, admissible: true, cycles: 3, seedSites: 1, attachedCount: 10,
    extent: 5, simTimeSeconds: 4 * timeScale, spatialSnapshots: [] as object[] };
  if (!pending) {
    json(join(directory, "result.json"), result);
    json(join(directory, "exit.json"), { rowId: id, exitCode: 0 });
  }
  return { directory, row, events, result };
}

function facetFixture(id: string, arm: "both" | "neither" | "basal-only" | "prism-only", timeScale = 1, tempC = -4.5) {
  const data = fixture(id, timeScale);
  const isHybrid = arm === "basal-only" || arm === "prism-only";
  const identity = isHybrid ? { experimentId: "post-phase10-facet-isolation-v1", experimentalFacetDips: arm } : {};
  const row = { ...data.row, tempC, paramSet: arm === "neither" ? "M1_NO_DIP_ABLATION" : "M1",
    ...(isHybrid ? { experimentalFacetDips: arm } : {}) };
  const result = { ...data.result, ...identity };
  const events = data.events.map((event) => ({ ...event, ...identity }));
  json(join(data.directory, "spec.json"), { row, fixed, ...identity });
  json(join(data.directory, "result.json"), result);
  writeFileSync(join(data.directory, "events.jsonl"), events.map((event) => JSON.stringify(event)).join("\n"));
  return { ...data, row, result, events, identity };
}
afterEach(() => {
  for (const directory of scratch.splice(0)) rmSync(directory, { recursive: true, force: true });
});

describe("offline cavity trajectory analysis", () => {
  it("reconstructs an enclosed transient, distinguishes its later disappearance, and retains size overshoot", () => {
    const { directory } = fixture("manufactured-ring");
    const report = analyzeCavityRows([directory], { centerSpansUm: [0.7, 1.05, 1.4, 2] });
    const analysis = report.rows[0].analysis!;
    expect(analysis.firstLaterallyEnclosedCenter?.cycle).toBe(1);
    const onset = analysis.frames.find((frame) => frame.cycle === 1)!;
    const ring = onset.geometry.layers.find((layer) => layer.offset === 1)!;
    expect(ring.lateralVoid).toBe("enclosed");
    expect(ring.enclosedVoidSiteCount).toBe(1);
    expect(ring.directAxialOpening).toEqual({ lower: false, upper: true });
    expect(analysis.frames.at(-1)!.geometry.layers.some((layer) => layer.lateralVoid === "enclosed")).toBe(false);
    expect(analysis.frames.at(-1)!.geometry.occupiedCellVolumeUm3).toBeCloseTo(10 * Math.sqrt(3) / 2 * 0.35 ** 3, 14);
    expect(analysis.sizeSelections.map(({ selectedCycle, exactTarget }) => ({ selectedCycle, exactTarget }))).toEqual([
      { selectedCycle: 1, exactTarget: true }, { selectedCycle: 3, exactTarget: false },
      { selectedCycle: 3, exactTarget: true }, { selectedCycle: null, exactTarget: false },
    ]);
    expect(analysis.onsetSnapshotBracket).toEqual({ before: null, atOrAfter: null, hasBoth: false });
    expect(analysis.enclosureEpisodes).toHaveLength(1);
    expect(analysis.enclosureEpisodes[0].start.cycle).toBe(1);
    expect(analysis.enclosureEpisodes[0].endExclusive?.cycle).toBe(2);
    expect(analysis.terminalEnclosureEpisode).toBeNull();
    expect(analysis.sources.map((source) => source.byteLength)).toEqual(
      analysis.sources.map((source) => readFileSync(source.path).byteLength));
  });

  it("separates an earlier transient from a new enclosure interval still present at the stop", () => {
    const { directory, events, result } = fixture("reopened");
    events[2].attached.push(...neighbors.map(([di, dj]) => {
      const index = idx(dims, 10 + di, 10 + dj, 12);
      return { index, coords: coordsOf(dims, index) };
    }));
    events[2].attachedCount += 6;
    result.attachedCount += 6;
    writeFileSync(join(directory, "events.jsonl"), events.map((event) => JSON.stringify(event)).join("\n"));
    json(join(directory, "result.json"), result);
    const analysis = analyzeCavityRows([directory]).rows[0].analysis!;
    expect(analysis.enclosureEpisodes).toHaveLength(2);
    expect(analysis.firstLaterallyEnclosedCenter?.cycle).toBe(1);
    expect(analysis.terminalEnclosureEpisode?.start.cycle).toBe(3);
    expect(analysis.terminalEnclosureEpisode?.endExclusive).toBeNull();
    expect(analysis.frames.at(-1)!.geometry.layers.filter((layer) => layer.lateralVoid === "enclosed")).toHaveLength(1);
  });

  it("matches actual physical time within the named group and retains both discrete event states", () => {
    const slow = fixture("slow");
    const fast = fixture("fast", 0.5);
    const report = analyzeCavityRows([slow.directory, fast.directory]);
    expect(report.groups[0].commonTerminalTimeSeconds).toBe(2);
    const slowSelection = report.rows[0].analysis!.physicalTimeSelections.at(-1)!;
    const fastSelection = report.rows[1].analysis!.physicalTimeSelections.at(-1)!;
    expect(slowSelection.requestedTimeSeconds).toBe(2);
    expect(slowSelection.atOrBefore.cycle).toBe(1);
    expect(slowSelection.nextEvent?.cycle).toBe(2);
    expect(slowSelection.exactEventTime).toBe(false);
    expect(fastSelection.atOrBefore.cycle).toBe(3);
    expect(fastSelection.exactEventTime).toBe(true);
    expect(fastSelection.nextEvent).toBeNull();
    expect(report.rows[0].analysis!.frames.map((frame) => frame.cycle)).toContain(2);
  });

  it("does not read partial events or claim a complete comparison when a supplied row is live", () => {
    const complete = fixture("complete");
    const live = fixture("live", 1, true);
    writeFileSync(join(live.directory, "events.jsonl"), '{"cycle":');
    const report = analyzeCavityRows([complete.directory, live.directory]);
    expect(report.allRequestedRowsAdmissible).toBe(false);
    expect(report.groups[0].allRequestedRowsAdmissible).toBe(false);
    expect(report.groups[0].requestedRowIds).toEqual(["complete", "live"]);
    expect(report.groups[0].contributingRowIds).toEqual(["complete"]);
    expect(report.rows[1].status).toBe("pending");
    expect(report.rows[1].analysis).toBeNull();
  });

  it("catches accidental attachment-count disagreement instead of measuring a different crystal", () => {
    const { directory, events } = fixture("wrong-count");
    events[0].attachedCount++;
    writeFileSync(join(directory, "events.jsonl"), events.map((event) => JSON.stringify(event)).join("\n"));
    expect(() => analyzeCavityRows([directory])).toThrow("attachment-count mismatch at cycle 1");
  });

  it("associates spatial data with the pre-update occupancy and records missing onset coverage", () => {
    const { directory, row, result } = fixture("sampled");
    const record = { path: "boundary-e3.json", triggerExtent: 3, actualExtent: 3, completedCycles: 1, simTimeSeconds: 1 };
    const snapshot = { schema: "post-phase10-spatial-boundary-v1", rowId: row.id,
      timing: "after-converged-relaxation-before-surface-advance", record, dims, center: [10, 10, 10],
      dxUm: 0.35, tempC: row.tempC, sigmaInfinity: row.sigmaInfinity, seedRadius: 0, seedThickness: 1, attachedCount: 7,
      cells: [{ index: idx(dims, 10, 10, 9), coords: [10, 10, 9], neighborCounts: [0, 1], facet: "basal",
        fill: 0.1, sigmaOpp: 0.003, sigmaBoundary: 0.002, alphaHKBoundary: 0.1, robinGeometry: 1, fillGeometry: 1 }] };
    result.spatialSnapshots.push(record);
    json(join(directory, "result.json"), result);
    json(join(directory, record.path), snapshot);
    const analysis = analyzeCavityRows([directory]).rows[0].analysis!;
    expect(analysis.spatial[0].profile.planes[0].orientation).toBe("downward");
    expect(analysis.onsetSnapshotBracket).toEqual({ before: null, atOrAfter: record, hasBoth: false });
    snapshot.attachedCount++;
    json(join(directory, record.path), snapshot);
    expect(() => analyzeCavityRows([directory])).toThrow("snapshot does not match pre-update event state");
  });

  it("selects an exact event without interpolation and refuses out-of-history time", () => {
    const states = [0, 1, 3].map((simTimeSeconds, cycle) => ({ simTimeSeconds, cycle, extent: 1, attachedCount: 1 }));
    const bracket = bracketCavityTime(states, 1);
    expect(bracket.atOrBefore.cycle).toBe(1);
    expect(bracket.nextEvent?.cycle).toBe(2);
    expect(bracket.exactEventTime).toBe(true);
    expect(() => bracketCavityTime(states, 4)).toThrow("time outside retained trajectory");
  });

  it("labels all four effective arms and recomputes common physical age separately for each quartet", () => {
    const arms = ["both", "neither", "basal-only", "prism-only"] as const;
    const first = arms.map((arm, n) => facetFixture(`warm-${arm}`, arm, n + 1, -4.5));
    const second = arms.map((arm, n) => facetFixture(`cool-${arm}`, arm, n + 2, -5));
    const report = analyzeCavityRows([...first, ...second].map((data) => data.directory));
    expect(report.groups.map((group) => group.commonTerminalTimeSeconds)).toEqual([4, 8]);
    expect(report.groups.every((group) => group.facetFactorial.allFourArmsAdmissibleAndMatched)).toBe(true);
    expect(report.rows.map((row) => row.effectiveFacetDips)).toEqual([...arms, ...arms]);
    expect(report.rows.map((row) => row.analysis!.effectiveFacetDips)).toEqual([...arms, ...arms]);
    expect(report.rows.map((row) => row.analysis!.physicalTimeSelections.at(-1)!.requestedTimeSeconds))
      .toEqual([4, 4, 4, 4, 8, 8, 8, 8]);
    expect(report.groups[0].rowArms[2]).toMatchObject({
      baseParamSet: "M1", effectiveFacetDips: "basal-only", experimentalFacetDips: "basal-only",
    });
  });

  it("does not mark mismatched configurations or duplicate arms as a matched factorial", () => {
    const arms = ["both", "neither", "basal-only", "prism-only"] as const;
    const data = arms.map((arm) => facetFixture(`configuration-${arm}`, arm));
    const changed = data[2];
    json(join(changed.directory, "spec.json"), { row: { ...changed.row, cflFill: 0.1 }, fixed, ...changed.identity });
    const report = analyzeCavityRows(data.map((entry) => entry.directory));
    expect(report.groups[0].facetFactorial).toEqual({
      completeFourArmRoster: true, fixedControlsRecorded: true, sameNonKineticConfiguration: false,
      differingFields: ["cflFill"], allFourArmsAdmissibleAndMatched: false,
    });
    const ordinary = fixture("extra-ordinary");
    const duplicated = analyzeCavityRows([...data.map((entry) => entry.directory), ordinary.directory]);
    expect(duplicated.groups[0].facetFactorial.completeFourArmRoster).toBe(false);
    expect(duplicated.groups[0].facetFactorial.allFourArmsAdmissibleAndMatched).toBe(false);
    json(join(changed.directory, "spec.json"), { row: changed.row, ...changed.identity });
    const missingControls = analyzeCavityRows(data.map((entry) => entry.directory));
    expect(missingControls.groups[0].facetFactorial.fixedControlsRecorded).toBe(false);
    expect(missingControls.groups[0].facetFactorial.allFourArmsAdmissibleAndMatched).toBe(false);
  });

  it("checks the explicit facet arm across the spec, result, event and spatial snapshot", () => {
    const data = facetFixture("identified-hybrid", "basal-only");
    const { directory, row, identity, result, events } = data;
    json(join(directory, "spec.json"), { row });
    expect(() => analyzeCavityRows([directory])).toThrow("spec experimental facet identity mismatch");
    json(join(directory, "spec.json"), { row, ...identity });
    json(join(directory, "result.json"), { ...result, experimentalFacetDips: "prism-only" });
    expect(() => analyzeCavityRows([directory])).toThrow("result experimental facet identity mismatch");
    json(join(directory, "result.json"), result);
    writeFileSync(join(directory, "events.jsonl"), events.map((event, n) => JSON.stringify(
      n === 1 ? { ...event, experimentId: "wrong-experiment" } : event)).join("\n"));
    expect(() => analyzeCavityRows([directory])).toThrow("event 2 experimental facet identity mismatch");
    writeFileSync(join(directory, "events.jsonl"), events.map((event) => JSON.stringify(event)).join("\n"));
    const record = { path: "boundary-e3.json", triggerExtent: 3, actualExtent: 3, completedCycles: 1, simTimeSeconds: 1 };
    result.spatialSnapshots.push(record);
    json(join(directory, "result.json"), result);
    const snapshot = { schema: "post-phase10-spatial-boundary-v1", rowId: row.id,
      timing: "after-converged-relaxation-before-surface-advance", record, dims, center: [10, 10, 10],
      dxUm: 0.35, tempC: row.tempC, sigmaInfinity: row.sigmaInfinity, seedRadius: 0, seedThickness: 1,
      attachedCount: 7, cells: [], ...identity };
    json(join(directory, record.path), snapshot);
    expect(analyzeCavityRows([directory]).rows[0].analysis!.effectiveFacetDips).toBe("basal-only");
    json(join(directory, record.path), { ...snapshot, experimentalFacetDips: "neither" });
    expect(() => analyzeCavityRows([directory])).toThrow("snapshot boundary-e3.json experimental facet identity mismatch");
  });
});
