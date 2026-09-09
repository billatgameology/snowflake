import { describe, expect, it } from "vitest";
import {
  nucleationABasal, nucleationAPrism, sigma0BasalFor, sigma0PrismFor,
  type NucleationParamSet,
} from "@vcc/core";
import { LKSolver, prepareFacetDipExperiment, type LKFacetDipArm } from "@vcc/solver-cpu";

const options = {
  dims: { nx: 18, ny: 18, nz: 18 },
  surfacePolicy: "aggregate-hv-g1h1-v6",
  farField: "monopole-matched", domain: "hexPrism",
  tempC: -5, sigmaInfinity: 0.00375, dxUm: 0.35, pressurePa: 101325,
  paramSet: "M1", rngSeed: 1, noiseEpsilon: 0, seedRadius: 2, seedThickness: 1,
  cflFill: 0.05, relaxTol: 1e-9, divTol: 1e-7, relaxMaxSweeps: 200000,
} as const;

function bytes(field: Uint8Array | Float64Array): Uint8Array {
  return new Uint8Array(field.buffer, field.byteOffset, field.byteLength);
}

describe("ADR 0055 finite facet preparation", () => {
  for (const tempC of [-4.5, -5]) {
    for (const [arm, paramSet] of [
      ["both", "M1"], ["neither", "M1_NO_DIP_ABLATION"],
    ] as const) {
      it(`${tempC} ${arm} preserves ordinary evolution through attachment`, () => {
        const environment = { ...options, tempC, sigmaInfinity: 0.075 * Math.abs(tempC) / 100 };
        const ordinary = new LKSolver({ ...environment, paramSet });
        const experiment = new LKSolver({ ...environment, experimentalFacetDips: arm });
        const seedCount = ordinary.a.reduce((sum, value) => sum + value, 0);
        for (let cycle = 0; cycle < 32; cycle++) {
          const ordinaryStep = ordinary.step();
          expect(ordinaryStep.relaxation.converged).toBe(true);
          expect(experiment.step()).toEqual(ordinaryStep);
          for (const field of ["a", "f", "sigma"] as const) {
            expect(bytes(experiment[field])).toEqual(bytes(ordinary[field]));
          }
          expect(experiment.simTimeSeconds).toBe(ordinary.simTimeSeconds);
          expect(experiment.ledger()).toEqual(ordinary.ledger());
        }
        expect(ordinary.a.reduce((sum, value) => sum + value, 0)).toBeGreaterThan(seedCount);
        expect(ordinary.fillLedger).toBeGreaterThan(0);
        expect(ordinary.simTimeSeconds).toBeGreaterThan(0);
        expect(ordinary.sigma.some((value, index) =>
          !ordinary.a[index] && !ordinary.wall[index] && value < environment.sigmaInfinity / 2,
        )).toBe(true);
      });
    }
  }

  for (const arm of ["basal-only", "prism-only"] as const) {
    it(`${arm} uses the selected facet law in both Robin solution and deposited fill`, () => {
      const solver = new LKSolver({ ...options, cflFill: 0.2, experimentalFacetDips: arm });
      let attached = false;
      const seenFacets = new Set<string>();
      for (let cycle = 0; cycle < 8; cycle++) {
        expect(solver.relaxField().converged).toBe(true);
        let demandRate = 0;
        const expectedCells: { index: number; rate: number; before: number }[] = [];
        for (const index of solver.boundaryCells()) {
          const state = solver.boundaryState(index);
          const facet = solver.facetClassOf(index);
          seenFacets.add(facet);
          const set: NucleationParamSet =
            (facet === "basal" && arm === "basal-only") ||
            (facet === "prism" && arm === "prism-only") ? "M1" : "M1_NO_DIP_ABLATION";
          const expectedCoefficient = facet === "inhibited" || state.sigmaBoundary <= 0 ? 0 :
            facet === "rough" ? 1 : facet === "basal" ?
              nucleationABasal(solver.tempC, set) * Math.exp(-sigma0BasalFor(solver.tempC, set) / state.sigmaBoundary) :
              nucleationAPrism(solver.tempC, set) * Math.exp(-sigma0PrismFor(solver.tempC, set) / state.sigmaBoundary);
          // The operator returns one final Robin evaluation after caching the coefficient;
          // recomputation at that returned potential is tolerance-equivalent, not bit-identical.
          expect(state.alphaHKBoundary).toBeCloseTo(expectedCoefficient, 11);
          expect(state.sigmaBoundary).toBeCloseTo(
            state.sigmaOpp / (1 + expectedCoefficient * solver.dxM / solver.x0M), 12,
          );
          const rate = expectedCoefficient * solver.vKinMS * state.sigmaBoundary / solver.dxM;
          demandRate += rate;
          expectedCells.push({ index, rate, before: solver.f[index] });
        }
        const previousDemand = solver.fillLedger + solver.saturationClippedFill;
        const previousCount = solver.a.reduce((sum, value) => sum + value, 0);
        const step = solver.advanceSurface();
        const dt = step.deltaTimeSeconds as number;
        expect(dt).toBeGreaterThan(0);
        expect(solver.fillLedger + solver.saturationClippedFill - previousDemand)
          .toBeCloseTo(demandRate * dt, 10);
        for (const cell of expectedCells) {
          // Geometric hole filling is separately deficit-ledgered and outside kinetic fill.
          if (!solver.a[cell.index]) {
            expect(solver.f[cell.index]).toBeCloseTo(cell.before + cell.rate * dt, 12);
          }
        }
        attached ||= solver.a.reduce((sum, value) => sum + value, 0) > previousCount;
      }
      expect(seenFacets.has("basal") && seenFacets.has("prism") && seenFacets.has("inhibited")).toBe(true);
      expect(attached).toBe(true);
    });
  }

  it("does not mislabel an experimental state as an ordinary checkpoint or timeline", () => {
    const solver = new LKSolver({ ...options, experimentalFacetDips: "basal-only" });
    expect(() => solver.resumeStateV3()).toThrow("ordinary LK checkpoints");
    expect(() => solver.applyTimelineEnvironment(solver.timelineEnvironment())).toThrow("constant environment");
    expect(solver.tick).toBe(0);
    expect(() => new LKSolver({ ...options, paramSet: "CAK", experimentalFacetDips: "both" }))
      .toThrow("M1 base metadata");
    expect(() => new LKSolver({ ...options, surfacePolicy: "aggregate-hv-g1h1-v5", experimentalFacetDips: "both" }))
      .toThrow("aggregate-hv-g1h1-v6");
    expect(() => prepareFacetDipExperiment(-5, "unknown" as LKFacetDipArm)).toThrow("unknown experimentalFacetDips");
  });
});
