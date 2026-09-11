import { describe, expect, it } from "vitest";
import {
  coordsOf, mirror, nucleationABasal, nucleationAPrism, rot60,
  sigma0BasalFor, sigma0PrismFor, symmetryError, zmirror,
  type NucleationParamSet,
} from "@vcc/core";
import { LKSolver } from "@vcc/solver-cpu";

const options = {
  dims: { nx: 18, ny: 18, nz: 18 },
  surfacePolicy: "aggregate-hv-g1h1-v6", farField: "monopole-matched", domain: "hexPrism",
  tempC: -5, sigmaInfinity: 0.00375, dxUm: 0.35, pressurePa: 101325,
  paramSet: "M1", rngSeed: 1, noiseEpsilon: 0, seedRadius: 2, seedThickness: 1,
  cflFill: 0.2, relaxTol: 1e-9, divTol: 1e-7, relaxMaxSweeps: 200000,
} as const;

function indexOf(i: number, j: number, k: number): number {
  return k * 18 * 18 + j * 18 + i;
}

function bytes(field: Uint8Array | Float64Array): Uint8Array {
  return new Uint8Array(field.buffer, field.byteOffset, field.byteLength);
}

function depletedStart(solver: LKSolver): void {
  for (let index = 0; index < solver.sigma.length; index++) {
    if (solver.a[index] || solver.wall[index]) continue;
    const [i, j, k] = coordsOf(solver.dims, index);
    const di = i - solver.center[0], dj = j - solver.center[1], dk = k - solver.center[2];
    solver.sigma[index] = solver.sigmaInfinity * (0.2 + 0.5 / (1 + di * di + di * dj + dj * dj + dk * dk));
  }
}

/** Independent reference: build the complete face mask, then its collinear integer coordinates. */
function referenceWidths(solver: LKSolver, index: number): number[] {
  const { nx, ny, nz } = solver.dims;
  const [i, j, k] = coordsOf(solver.dims, index);
  const widths: number[] = [];
  for (const outward of [-1, 1]) {
    const supportK = k - outward;
    if (supportK < 0 || supportK >= nz || !solver.a[indexOf(i, j, supportK)]) continue;
    const mask: [number, number][] = [];
    for (let jj = 0; jj < ny; jj++) for (let ii = 0; ii < nx; ii++) {
      if (solver.a[indexOf(ii, jj, supportK)] && !solver.wall[indexOf(ii, jj, k)] &&
        !solver.a[indexOf(ii, jj, k)]) mask.push([ii - i, jj - j]);
    }
    const chords = [[1, 0], [0, 1], [1, -1]].map(([di, dj]) => {
      const positions = new Set(mask.filter(([ii, jj]) => ii * dj === jj * di)
        .map(([ii, jj]) => di === 0 ? jj / dj : ii / di));
      let lower = 0, upper = 0;
      while (positions.has(lower - 1)) lower--;
      while (positions.has(upper + 1)) upper++;
      return upper - lower + 1;
    });
    widths.push(Math.min(...chords));
  }
  return widths;
}

describe("ADR 0058 exposed-support basal width experiment", () => {
  for (const endpoint of ["broad", "dipped"] as const) {
    it(`matches the ${endpoint} control from nonuniform vapor with nonzero fill`, () => {
      const threshold = endpoint === "broad" ? 1 : 18;
      const control = new LKSolver({ ...options, ...(endpoint === "broad"
        ? { paramSet: "M1_NO_DIP_ABLATION" as const }
        : { experimentalFacetDips: "basal-only" as const }) });
      const experiment = new LKSolver({ ...options, experimentalBasalWidthCells: threshold });
      depletedStart(control);
      depletedStart(experiment);
      // Four steps stay below saturation in the broad fixture. The all-dipped case
      // additionally traverses attachment while every possible domain chord still selects.
      for (let cycle = 0; cycle < (endpoint === "broad" ? 4 : 8); cycle++) {
        const expectedRelaxation = control.relaxField();
        expect(expectedRelaxation.converged).toBe(true);
        expect(experiment.relaxField()).toEqual(expectedRelaxation);
        for (const index of control.boundaryCells()) {
          const actual = experiment.boundaryState(index);
          const { basalWidthCells, basalWidthSelected, ...ordinaryShape } = actual;
          const expected = control.boundaryState(index);
          expect(ordinaryShape).toEqual(expected);
          expect(Object.hasOwn(expected, "basalWidthCells")).toBe(false);
          expect(Object.hasOwn(expected, "basalWidthSelected")).toBe(false);
          if (experiment.facetClassOf(index) === "basal") {
            expect(basalWidthCells).toBe(Math.min(...referenceWidths(experiment, index)));
            expect(basalWidthSelected).toBe(endpoint === "dipped");
          } else {
            expect(Object.hasOwn(actual, "basalWidthCells")).toBe(false);
            expect(Object.hasOwn(actual, "basalWidthSelected")).toBe(false);
          }
        }
        expect(experiment.advanceSurface()).toEqual(control.advanceSurface());
        for (const field of ["a", "f", "sigma"] as const) expect(bytes(experiment[field])).toEqual(bytes(control[field]));
        expect(experiment.ledger()).toEqual(control.ledger());
        expect(experiment.simTimeSeconds).toBe(control.simTimeSeconds);
      }
      expect(experiment.fillLedger).toBeGreaterThan(0);
      expect(experiment.simTimeSeconds).toBeGreaterThan(0);
      const activeVapor = experiment.sigma.filter((_value, index) => !experiment.a[index] && !experiment.wall[index]);
      expect(Math.min(...activeVapor)).toBeLessThan(Math.max(...activeVapor));
      if (endpoint === "broad") expect(experiment.attachedCount).toBe(19);
      else expect(experiment.attachedCount).toBeGreaterThan(19);
    });
  }

  it("uses independently classified mixed widths in the Robin law and kinetic demand", () => {
    const solver = new LKSolver({ ...options, experimentalBasalWidthCells: 3 });
    depletedStart(solver);
    let sawSelectedDemand = false, sawBroadDemand = false, attached = false;
    for (let cycle = 0; cycle < 8; cycle++) {
      expect(solver.relaxField().converged).toBe(true);
      let demandRate = 0;
      const widths: Record<number, number> = {};
      const cells: { index: number; before: number; rate: number }[] = [];
      for (const index of solver.boundaryCells()) {
        const facet = solver.facetClassOf(index), state = solver.boundaryState(index);
        let selected = false;
        if (facet === "basal") {
          const width = Math.min(...referenceWidths(solver, index));
          widths[width] = (widths[width] ?? 0) + 1;
          selected = width <= 3;
          expect(state.basalWidthCells).toBe(width);
          expect(state.basalWidthSelected).toBe(selected);
        } else {
          expect(Object.hasOwn(state, "basalWidthCells")).toBe(false);
          expect(Object.hasOwn(state, "basalWidthSelected")).toBe(false);
        }
        const set: NucleationParamSet = selected ? "M1" : "M1_NO_DIP_ABLATION";
        const coefficient = facet === "inhibited" || state.sigmaBoundary <= 0 ? 0 :
          facet === "rough" ? 1 : facet === "basal" ?
            nucleationABasal(solver.tempC, set) * Math.exp(-sigma0BasalFor(solver.tempC, set) / state.sigmaBoundary) :
            nucleationAPrism(solver.tempC, "M1_NO_DIP_ABLATION") *
              Math.exp(-sigma0PrismFor(solver.tempC, "M1_NO_DIP_ABLATION") / state.sigmaBoundary);
        expect(state.alphaHKBoundary).toBeCloseTo(coefficient, 11);
        expect(state.robinGeometry).toBe(1);
        expect(state.fillGeometry).toBe(1);
        expect(state.sigmaBoundary).toBeCloseTo(state.sigmaOpp / (1 + coefficient * solver.dxM / solver.x0M), 12);
        const rate = coefficient * solver.vKinMS * state.sigmaBoundary / solver.dxM;
        if (facet === "basal" && rate > 0) {
          sawSelectedDemand ||= selected;
          sawBroadDemand ||= !selected;
        }
        demandRate += rate;
        cells.push({ index, before: solver.f[index], rate });
      }
      if (cycle === 0) expect(widths).toEqual({ 3: 24, 4: 12, 5: 2 });
      const demandBefore = solver.fillLedger + solver.saturationClippedFill;
      const report = solver.advanceSurface(), dt = report.deltaTimeSeconds as number;
      expect(dt).toBeGreaterThan(0);
      expect(solver.fillLedger + solver.saturationClippedFill - demandBefore).toBeCloseTo(demandRate * dt, 10);
      for (const cell of cells) if (!solver.a[cell.index]) {
        expect(solver.f[cell.index]).toBeCloseTo(cell.before + cell.rate * dt, 12);
      }
      expect(symmetryError(solver.a, solver.dims, solver.center)).toBe(0);
      attached ||= report.attachedNow > 0;
    }
    expect(sawSelectedDemand && sawBroadDemand && attached).toBe(true);
  });

  it("refreshes widths after attachment changes an exposed support mask", () => {
    const solver = new LKSolver({ ...options, experimentalBasalWidthCells: 2 });
    expect(solver.relaxField().converged).toBe(true);
    for (const sign of [-1, 1]) {
      const oldCorner = indexOf(11, 9, 9 + sign);
      expect(solver.boundaryState(oldCorner).basalWidthCells).toBe(3);
      expect(solver.boundaryState(oldCorner).basalWidthSelected).toBe(false);
      // Prepare a deterministic saturation fixture without modifying attached topology.
      solver.f[indexOf(9, 9, 9 + sign)] = 1;
    }
    expect(solver.advanceSurface().attachedNow).toBe(2);
    expect(solver.relaxField().converged).toBe(true);
    for (const sign of [-1, 1]) {
      const oldCorner = indexOf(11, 9, 9 + sign), newTip = indexOf(9, 9, 9 + 2 * sign);
      expect(solver.neighborCounts(oldCorner)).toEqual([0, 1]);
      expect(referenceWidths(solver, oldCorner)).toEqual([2]);
      expect(solver.boundaryState(oldCorner).basalWidthCells).toBe(2);
      expect(solver.boundaryState(oldCorner).basalWidthSelected).toBe(true);
      expect(solver.boundaryState(newTip).basalWidthCells).toBe(1);
      expect(solver.boundaryState(newTip).basalWidthSelected).toBe(true);
    }
  });

  it("takes both [02] support widths symmetrically under rotation, mirror and vertical reversal", () => {
    function fixture(flip: number): LKSolver {
      const sites: number[] = [];
      for (const [offset, radius] of [[-1, 3], [1, 1]]) {
        for (let di = -radius; di <= radius; di++) for (let dj = -radius; dj <= radius; dj++) {
          if (Math.max(Math.abs(di), Math.abs(dj), Math.abs(di + dj)) <= radius) sites.push(indexOf(9 + di, 9 + dj, 9 + flip * offset));
        }
      }
      const solver = new LKSolver({ ...options, experimentalBasalWidthCells: 2,
        seedRadius: null, testMode: true, testExtraSeedSites: sites });
      depletedStart(solver);
      return solver;
    }
    const solver = fixture(1), reflected = fixture(-1);
    expect(solver.relaxField().converged).toBe(true);
    expect(reflected.relaxField().converged).toBe(true);
    const center = indexOf(9, 9, 9), edge = indexOf(10, 9, 9);
    expect(solver.neighborCounts(center)).toEqual([0, 2]);
    expect(referenceWidths(solver, center).sort((a, b) => a - b)).toEqual([3, 7]);
    expect(solver.boundaryState(center).basalWidthCells).toBe(3);
    expect(solver.boundaryState(center).basalWidthSelected).toBe(false);
    expect(solver.neighborCounts(edge)).toEqual([0, 2]);
    expect(solver.boundaryState(edge).basalWidthCells).toBe(2);
    expect(solver.boundaryState(edge).basalWidthSelected).toBe(true);
    // [02] has no opposing vapor pixel under the unchanged aggregate closure.
    expect(solver.boundaryState(center).sigmaOpp).toBe(0);
    expect(solver.boundaryState(center).alphaHKBoundary).toBe(0);
    let checked = 0;
    for (const index of solver.boundaryCells()) {
      if (solver.facetClassOf(index) !== "basal") continue;
      checked++;
      const state = solver.boundaryState(index), [i, j, k] = coordsOf(solver.dims, index);
      expect(state.basalWidthCells).toBe(Math.min(...referenceWidths(solver, index)));
      const [ri, rj] = rot60(i, j, 9, 9), [mi, mj] = mirror(i, j, 9, 9);
      for (const image of [solver.boundaryState(indexOf(ri, rj, k)), solver.boundaryState(indexOf(mi, mj, k)),
        reflected.boundaryState(indexOf(i, j, zmirror(k, 9)))]) {
        expect(image.basalWidthCells).toBe(state.basalWidthCells);
        expect(image.basalWidthSelected).toBe(state.basalWidthSelected);
        expect(image.alphaHKBoundary).toBe(state.alphaHKBoundary);
        expect(image.sigmaBoundary).toBe(state.sigmaBoundary);
      }
    }
    expect(checked).toBeGreaterThan(7);
  });

  it("keeps the option positive, constant, separate and outside ordinary checkpoints", () => {
    const solver = new LKSolver({ ...options, experimentalBasalWidthCells: 2 });
    expect(() => solver.resumeStateV3()).toThrow("ordinary LK checkpoints");
    expect(() => solver.applyTimelineEnvironment(solver.timelineEnvironment())).toThrow("constant environment");
    for (const threshold of [0, 2.5]) expect(() => new LKSolver({ ...options, experimentalBasalWidthCells: threshold })).toThrow("positive safe integer");
    expect(() => new LKSolver({ ...options, experimentalBasalWidthCells: 2, paramSet: "M1_NO_DIP_ABLATION" })).toThrow("M1 base metadata");
    expect(() => new LKSolver({ ...options, experimentalBasalWidthCells: 2, surfacePolicy: "aggregate-hv-g1h1-v5" })).toThrow("aggregate-hv-g1h1-v6");
    expect(() => new LKSolver({ ...options, experimentalBasalWidthCells: 2, experimentalFacetDips: "basal-only" })).toThrow("cannot combine");
    expect(() => new LKSolver({ ...options, experimentalBasalWidthCells: 2, experimentalHoleFilling: "enabled" })).toThrow("cannot combine");
  });
});
