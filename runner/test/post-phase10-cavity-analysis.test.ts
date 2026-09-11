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

function holeFixture(id: string, arm: "both" | "neither", mode: "enabled" | "disabled", timeScale = 1, tempC = -4.5) {
  const data = facetFixture(id, arm, timeScale, tempC);
  const identity = { experimentId: "post-phase10-holefill-isolation-v1", experimentalHoleFilling: mode };
  const row = { ...data.row, experimentalHoleFilling: mode };
  const result = { ...data.result, ...identity };
  const events = data.events.map((event) => ({ ...event, ...identity }));
  json(join(data.directory, "spec.json"), { row, fixed, ...identity });
  json(join(data.directory, "result.json"), result);
  writeFileSync(join(data.directory, "events.jsonl"), events.map((event) => JSON.stringify(event)).join("\n"));
  return { ...data, row, result, events, identity };
}

function interactionFixture(id: string, timeScale = 1) {
  const data = facetFixture(id, "prism-only", timeScale);
  const identity = { experimentId: "post-phase10-prism-holefill-interaction-v1",
    experimentalFacetDips: "prism-only", experimentalHoleFilling: "disabled" };
  const row = { ...data.row, experimentalHoleFilling: "disabled" };
  const result = { ...data.result, ...identity };
  const events = data.events.map((event) => ({ ...event, ...identity }));
  json(join(data.directory, "spec.json"), { row, fixed, ...identity });
  json(join(data.directory, "result.json"), result);
  writeFileSync(join(data.directory, "events.jsonl"), events.map((event) => JSON.stringify(event)).join("\n"));
  return { ...data, row, result, events, identity };
}

function basalWidthFixture(id: string, thresholdCells: number, timeScale = 1, tempC = -4.5) {
  const data = facetFixture(id, "both", timeScale, tempC);
  const identity = { experimentId: "post-phase10-local-basal-width-v1", experimentalBasalWidthCells: thresholdCells };
  const row = { ...data.row, experimentalBasalWidthCells: thresholdCells };
  const histograms: Record<string, number>[] = [{ "3": 2 }, { "1": 1, "3": 1, "5": 2 }, { "1": 3 }];
  // First update has seed geometry, second makes the ring, third leaves it open while extending radially.
  const batches = [[], data.events[0].attached, data.events[2].attached];
  let count = 1;
  const events = data.events.map((event, n) => {
    count += batches[n].length;
    const selected = Object.entries(histograms[n]).filter(([width]) => Number(width) <= thresholdCells)
      .reduce((sum, [, cells]) => sum + cells, 0);
    const unselected = Object.values(histograms[n]).reduce((sum, cells) => sum + cells, 0) - selected;
    return { ...event, ...identity, attached: batches[n], attachedCount: count, extent: [1, 3, 5][n],
      basalWidthObservation: { thresholdCells, timing: "after-converged-relaxation-before-surface-advance",
        completedCyclesBeforeUpdate: n, simTimeSecondsBeforeUpdate: [0, 1, 3][n] * timeScale,
        widthHistogram: histograms[n], selectedBasalCells: selected, unselectedBasalCells: unselected,
        selectedKineticDemandFill: selected * [0.1, 0.2, 0.4][n],
        unselectedKineticDemandFill: unselected * [0.3, 0.5, 0.6][n] } };
  });
  const result = { ...data.result, ...identity, attachedCount: count };
  json(join(data.directory, "spec.json"), { row, fixed, ...identity });
  json(join(data.directory, "result.json"), result);
  writeFileSync(join(data.directory, "events.jsonl"), events.map((event) => JSON.stringify(event)).join("\n"));
  return { ...data, row, result, events, identity };
}

function axialRingHistory(id: string, movingPit: boolean, sign = 1) {
  const data = fixture(id);
  let count = 1;
  const events = [1, 2, 3].map((height, n) => {
    const batch = neighbors.map(([di, dj]) => idx(dims, 10 + di, 10 + dj, 10 + sign * height));
    if (movingPit && height > 1) batch.push(idx(dims, 10, 10, 10 + sign * (height - 1)));
    if (height === 3) batch.push(idx(dims, 13, 10, 10));
    count += batch.length;
    return { cycle: n + 1, attached: batch.map((index) => ({ index, coords: coordsOf(dims, index) })),
      attachedCount: count, extent: [3, 3, 5][n], simTimeSeconds: [1, 2, 4][n] };
  });
  writeFileSync(join(data.directory, "events.jsonl"), events.map((event) => JSON.stringify(event)).join("\n"));
  json(join(data.directory, "result.json"), { ...data.result, attachedCount: count });
  return data.directory;
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

  it("labels ordinary/facet rows as hole-fill-enabled and matches two separate closure quartets", () => {
    const groups = [-4.5, -5].map((tempC, n) => [
      facetFixture(`closure-${n}-both-on`, "both", n + 1, tempC),
      facetFixture(`closure-${n}-neither-on`, "neither", n + 2, tempC),
      holeFixture(`closure-${n}-both-off`, "both", "disabled", n + 3, tempC),
      holeFixture(`closure-${n}-neither-off`, "neither", "disabled", n + 4, tempC),
    ]);
    const report = analyzeCavityRows(groups.flat().map((data) => data.directory));
    expect(report.groups.map((group) => group.commonTerminalTimeSeconds)).toEqual([4, 8]);
    expect(report.groups.every((group) => group.holeFillFactorial.allFourCornersAdmissibleAndMatched)).toBe(true);
    expect(report.rows.map((row) => row.effectiveHoleFilling)).toEqual([
      "enabled", "enabled", "disabled", "disabled", "enabled", "enabled", "disabled", "disabled",
    ]);
    expect(report.rows.map((row) => row.analysis!.effectiveHoleFilling)).toEqual(
      report.rows.map((row) => row.effectiveHoleFilling));
    expect(report.groups[0].rowArms.map((row) => row.effectiveFacetDips)).toEqual(["both", "neither", "both", "neither"]);
    const hybrid = facetFixture("hybrid-hole-default", "basal-only");
    expect(analyzeCavityRows([hybrid.directory]).rows[0].effectiveHoleFilling).toBe("enabled");
    const explicitOn = holeFixture("explicit-on", "neither", "enabled");
    expect(analyzeCavityRows([explicitOn.directory]).rows[0].effectiveHoleFilling).toBe("enabled");
  });

  it("cannot substitute a hole-fill-off control into an otherwise complete facet comparison", () => {
    const off = holeFixture("substituted-off", "both", "disabled");
    const otherArms = ["neither", "basal-only", "prism-only"] as const;
    const others = otherArms.map((arm) => facetFixture(`other-${arm}`, arm));
    const report = analyzeCavityRows([off.directory, ...others.map((row) => row.directory)]);
    expect(report.groups[0].facetFactorial.completeFourArmRoster).toBe(true);
    expect(report.groups[0].facetFactorial.sameNonKineticConfiguration).toBe(false);
    expect(report.groups[0].facetFactorial.differingFields).toEqual(["effectiveHoleFilling"]);
    expect(report.groups[0].facetFactorial.allFourArmsAdmissibleAndMatched).toBe(false);
    expect(report.groups[0].holeFillFactorial.completeFourCornerRoster).toBe(false);
  });

  it("checks hole-fill identity at each artifact boundary and rejects mixed opt-ins", () => {
    const data = holeFixture("identified-off", "neither", "disabled");
    const { directory, row, result, events, identity } = data;
    json(join(directory, "spec.json"), { row, fixed });
    expect(() => analyzeCavityRows([directory])).toThrow("spec experimental hole-fill identity mismatch");
    json(join(directory, "spec.json"), { row, fixed, ...identity });
    json(join(directory, "result.json"), { ...result, experimentalHoleFilling: "enabled" });
    expect(() => analyzeCavityRows([directory])).toThrow("result experimental hole-fill identity mismatch");
    json(join(directory, "result.json"), result);
    writeFileSync(join(directory, "events.jsonl"), events.map((event, n) => JSON.stringify(
      n === 1 ? { ...event, experimentId: "post-phase10-facet-isolation-v1" } : event)).join("\n"));
    expect(() => analyzeCavityRows([directory])).toThrow("event 2 experimental hole-fill identity mismatch");
    writeFileSync(join(directory, "events.jsonl"), events.map((event) => JSON.stringify(event)).join("\n"));
    const record = { path: "boundary-e3.json", triggerExtent: 3, actualExtent: 3, completedCycles: 1, simTimeSeconds: 1 };
    result.spatialSnapshots.push(record);
    json(join(directory, "result.json"), result);
    const snapshot = { schema: "post-phase10-spatial-boundary-v1", rowId: row.id,
      timing: "after-converged-relaxation-before-surface-advance", record, dims, center: [10, 10, 10],
      dxUm: 0.35, tempC: row.tempC, sigmaInfinity: row.sigmaInfinity, seedRadius: 0, seedThickness: 1,
      attachedCount: 7, cells: [], ...identity };
    json(join(directory, record.path), snapshot);
    expect(analyzeCavityRows([directory]).rows[0].effectiveHoleFilling).toBe("disabled");
    json(join(directory, record.path), { ...snapshot, experimentalFacetDips: "both" });
    expect(() => analyzeCavityRows([directory])).toThrow("snapshot boundary-e3.json experimental hole-fill identity mismatch");
    json(join(directory, "spec.json"), { row: { ...row, paramSet: "M1", experimentalFacetDips: "both" }, fixed, ...identity });
    expect(() => analyzeCavityRows([directory])).toThrow("facet and hole-fill experiments cannot be combined");
  });

  it("distinguishes a straight-open cavity witness from a capped vacancy without a general 3D closure claim", () => {
    const open = fixture("open-witness");
    const openFrame = analyzeCavityRows([open.directory]).rows[0].analysis!.frames.find((frame) => frame.cycle === 1)!;
    expect(openFrame.enclosureWitnesses).toEqual({ laterallyEnclosedLayers: 1, straightAxiallyOpenLayers: 1,
      laterallyEnclosedWithoutStraightAxialOpening: 0, longestConsecutiveStraightOpenLayerRun: 1,
      longestStraightOpenCenterSpanUm: 0, maxStraightOpenDepthBelowAxialEnvelopeUm: 0 });

    const capped = fixture("capped-witness");
    const capIndex = idx(dims, 10, 10, 12);
    capped.events[0].attached.push({ index: capIndex, coords: coordsOf(dims, capIndex) });
    for (const event of capped.events) event.attachedCount++;
    capped.events[1].extent = 4;
    capped.result.attachedCount++;
    writeFileSync(join(capped.directory, "events.jsonl"), capped.events.map((event) => JSON.stringify(event)).join("\n"));
    json(join(capped.directory, "result.json"), capped.result);
    const report = analyzeCavityRows([capped.directory]);
    const cappedFrame = report.rows[0].analysis!.frames.find((frame) => frame.cycle === 1)!;
    expect(cappedFrame.enclosureWitnesses).toEqual({ laterallyEnclosedLayers: 1, straightAxiallyOpenLayers: 0,
      laterallyEnclosedWithoutStraightAxialOpening: 1, longestConsecutiveStraightOpenLayerRun: 0,
      longestStraightOpenCenterSpanUm: 0, maxStraightOpenDepthBelowAxialEnvelopeUm: 0 });
    expect(report.definitions.enclosureWitnesses).toContain("does not establish a sealed vacancy");
  });

  it("matches the prism/closure quartet and computes a nonzero discrete common-age contrast", () => {
    const controls = [facetFixture("interaction-neither-on", "neither", 1),
      holeFixture("interaction-neither-off", "neither", "disabled", 2),
      facetFixture("interaction-prism-on", "prism-only", 3)];
    const combined = interactionFixture("interaction-prism-off", 4);
    const report = analyzeCavityRows([...controls, combined].map((row) => row.directory),
      { centerSpansUm: [0.7, 1.4, 2] });
    const group = report.groups[0];
    expect(group.prismHoleFillInteraction.allFourCornersAdmissibleAndMatched).toBe(true);
    expect(group.holeFillFactorial.completeFourCornerRoster).toBe(false);
    expect(group.facetFactorial.completeFourArmRoster).toBe(false);
    const contrasts = group.prismHoleFillInteraction.contrasts!;
    const atOneSecond = contrasts.physicalTime[1];
    expect(atOneSecond.requestedTimeSeconds).toBe(1);
    expect(atOneSecond.corners.map((corner) => [corner.rowId, corner.cycle])).toEqual([
      ["interaction-neither-on", 1], ["interaction-neither-off", 0],
      ["interaction-prism-on", 0], ["interaction-prism-off", 0],
    ]);
    // Counts are 7/1/1/1: (1 - 1) - (1 - 7) = 6, independently of report arithmetic.
    expect(atOneSecond.enabledPrismEffect?.attachedCount).toBe(-6);
    expect(atOneSecond.disabledPrismEffect?.attachedCount).toBe(0);
    expect(atOneSecond.differenceOfEffects).toMatchObject({ attachedCount: 6, straightAxiallyOpenLayers: 1 });
    expect(atOneSecond.corners.map((corner) => corner.nextEvent?.simTimeSeconds)).toEqual([3, 2, 3, 4]);
    expect(contrasts.sizes[0]).toMatchObject({ matched: true, requestedCenterSpanUm: 0.7 });
    expect(contrasts.sizes[2]).toMatchObject({ matched: false, differenceOfEffects: null });
    expect(contrasts.terminalSize).toMatchObject({ coordinate: "terminal-size", matched: true,
      requestedCenterSpanUm: 1.4, differenceOfEffects: { attachedCount: 0 } });
    expect(contrasts.terminalSize.corners.map((corner) => corner.simTimeSeconds)).toEqual([4, 8, 12, 16]);
    json(join(combined.directory, "spec.json"), { row: combined.row, fixed,
      ...combined.identity, experimentId: "post-phase10-holefill-isolation-v1" });
    expect(() => analyzeCavityRows([combined.directory])).toThrow("spec prism/hole-fill interaction identity mismatch");
  });

  it.each([-1, 1])("tracks the same open planes behind the advancing axial envelope in direction %i", (sign) => {
    const directory = axialRingHistory("deepening-rings", false, sign);
    const side = sign === -1 ? "lower" : "upper";
    const analysis = analyzeCavityRows([directory]).rows[0].analysis!;
    const terminal = analysis.frames.at(-1)!;
    expect(terminal.enclosureWitnesses).toMatchObject({ straightAxiallyOpenLayers: 3,
      longestConsecutiveStraightOpenLayerRun: 3, longestStraightOpenCenterSpanUm: 0.7,
      maxStraightOpenDepthBelowAxialEnvelopeUm: 0.7 });
    expect(analysis.straightOpenPlaneIntervals.map((interval) => ({
      offset: interval.offset, side: interval.side, start: interval.start.cycle,
      end: interval.endExclusive, tip: interval.tipOffsetAtStart,
      advance: interval.maxTipAdvanceWhileOpenUm, depth: interval.maxDepthBelowAxialEnvelopeUm,
    }))).toEqual([
      { offset: sign, side, start: 1, end: null, tip: sign, advance: 0.7, depth: 0.7 },
      { offset: 2 * sign, side, start: 2, end: null, tip: 2 * sign, advance: 0.35, depth: 0.35 },
      { offset: 3 * sign, side, start: 3, end: null, tip: 3 * sign, advance: 0, depth: 0 },
    ]);
  });

  it("does not mistake successive single-plane pits for persistence of the same interior plane", () => {
    const directory = axialRingHistory("moving-pits", true);
    const analysis = analyzeCavityRows([directory]).rows[0].analysis!;
    expect(analysis.enclosureEpisodes).toHaveLength(1);
    expect(analysis.enclosureEpisodes[0].endExclusive).toBeNull();
    expect(analysis.frames.at(-1)!.enclosureWitnesses).toMatchObject({
      longestConsecutiveStraightOpenLayerRun: 1, longestStraightOpenCenterSpanUm: 0,
      maxStraightOpenDepthBelowAxialEnvelopeUm: 0 });
    expect(analysis.straightOpenPlaneIntervals.map((interval) => ({ offset: interval.offset,
      start: interval.start.cycle, end: interval.endExclusive?.cycle ?? null,
      advance: interval.maxTipAdvanceWhileOpenUm }))).toEqual([
      { offset: 1, start: 1, end: 2, advance: 0 },
      { offset: 2, start: 2, end: 3, advance: 0 },
      { offset: 3, start: 3, end: null, advance: 0 },
    ]);
  });

  it("keeps local basal-width arms distinct and matches each temperature's four registered arms", () => {
    const groups = [-4.5, -5].map((tempC, n) => [
      facetFixture(`width-${n}-broad`, "neither", n + 1, tempC),
      facetFixture(`width-${n}-dipped`, "basal-only", n + 2, tempC),
      basalWidthFixture(`width-${n}-le2`, 2, n + 3, tempC),
      basalWidthFixture(`width-${n}-le3`, 3, n + 4, tempC),
    ]);
    const report = analyzeCavityRows(groups.flat().map((data) => data.directory));
    expect(report.groups.map((group) => group.commonTerminalTimeSeconds)).toEqual([4, 8]);
    expect(report.groups.every((group) => group.basalWidthComparison.allFourArmsAdmissibleAndMatched)).toBe(true);
    expect(report.groups.every((group) => !group.facetFactorial.completeFourArmRoster &&
      !group.holeFillFactorial.completeFourCornerRoster && !group.prismHoleFillInteraction.completeFourCornerRoster)).toBe(true);
    expect(report.groups[0].basalWidthComparison.arms.map((row) => [row.arm, row.thresholdCells])).toEqual([
      ["broad-everywhere", null], ["dipped-basal-everywhere", null], ["width<=2", 2], ["width<=3", 3],
    ]);
    expect(report.rows.map((row) => row.effectiveFacetDips)).toEqual([
      "neither", "basal-only", "local-basal-width", "local-basal-width",
      "neither", "basal-only", "local-basal-width", "local-basal-width",
    ]);
    expect(report.rows[0].analysis).not.toHaveProperty("basalWidthObservation");
    expect(report.rows[1].analysis).not.toHaveProperty("basalWidthObservation");
    const duplicate = analyzeCavityRows([groups[0][0], groups[0][1], groups[0][2], groups[0][2]]
      .map((data) => data.directory));
    expect(duplicate.groups[0].basalWidthComparison.completeFourArmRoster).toBe(false);
  });

  it("measures seed versus evolving activation and sums already-integrated demand around onset", () => {
    const narrow = basalWidthFixture("width-activation-le2", 2, 3);
    const wide = basalWidthFixture("width-activation-le3", 3, 3);
    const report = analyzeCavityRows([narrow.directory, wide.directory]);
    const low = report.rows[0].analysis!.basalWidthObservation!;
    const high = report.rows[1].analysis!.basalWidthObservation!;
    expect(low.seedUpdate?.selectedBasalCells).toBe(0);
    expect(high.seedUpdate?.selectedBasalCells).toBe(2);
    expect(low.firstSelectedUpdate).toMatchObject({ cycle: 2, completedCyclesBeforeUpdate: 1,
      simTimeSecondsBeforeUpdate: 3, simTimeSecondsAfterUpdate: 9 });
    expect(high.firstPositiveSelectedDemandUpdate).toMatchObject({ cycle: 1, simTimeSecondsBeforeUpdate: 0 });
    expect(low.totals).toMatchObject({ observedUpdates: 3, updatesWithSelectedBasalCells: 2,
      mixedSelectionUpdates: 1, allBasalSelectedUpdates: 1, minSelectedBasalFraction: 0, maxSelectedBasalFraction: 1,
      widthHistogramCellUpdates: { "1": 4, "3": 3, "5": 2 }, selectedBasalCellUpdates: 4, unselectedBasalCellUpdates: 5 });
    // The fixture supplies demand-fill amounts, despite physical timesteps 3/6/3 seconds.
    // Their sums are 0 + 0.2 + 1.2 and 0.6 + 1.5 + 0; never multiply these amounts by dt again.
    expect(low.totals.selectedKineticDemandFill).toBeCloseTo(1.4, 14);
    expect(low.totals.unselectedKineticDemandFill).toBeCloseTo(2.1, 14);
    expect(high.totals.selectedKineticDemandFill).toBeCloseTo(1.8, 14);
    expect(high.totals.unselectedKineticDemandFill).toBe(1);
    expect(high.totals.allBasalSelectedUpdates).toBe(2);
    expect(low.firstEnclosure?.onset.cycle).toBe(2);
    expect(low.firstEnclosure?.updatesCompletedBeforeOnset).toMatchObject({ observedUpdates: 1,
      selectedKineticDemandFill: 0 });
    expect(high.firstEnclosure?.updatesCompletedBeforeOnset.selectedKineticDemandFill).toBeCloseTo(0.2, 14);
    expect(low.firstEnclosure?.onsetProducingUpdate).toMatchObject({ cycle: 2, selectedBasalCells: 1,
      unselectedBasalCells: 3 });
    expect(low.terminalEnclosure?.updatesAfterOnset).toMatchObject({ observedUpdates: 1,
      allBasalSelectedUpdates: 1, unselectedBasalCellUpdates: 0 });
  });

  it("requires the width identity and pre-update observation instead of silently reading global M1", () => {
    const data = basalWidthFixture("width-identity", 2);
    json(join(data.directory, "spec.json"), { row: data.row, fixed, ...data.identity,
      experimentId: "post-phase10-facet-isolation-v1" });
    expect(() => analyzeCavityRows([data.directory])).toThrow("spec local basal-width identity mismatch");
    json(join(data.directory, "spec.json"), { row: data.row, fixed, ...data.identity });
    data.events[0].basalWidthObservation.completedCyclesBeforeUpdate = 1;
    writeFileSync(join(data.directory, "events.jsonl"), data.events.map((event) => JSON.stringify(event)).join("\n"));
    expect(() => analyzeCavityRows([data.directory])).toThrow("event 1 basal-width observation timing/threshold mismatch");
  });
});
