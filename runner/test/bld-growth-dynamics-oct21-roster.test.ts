import { describe, expect, it } from "vitest";
import { BLD_GROWTH_DYNAMICS_OCT21 as batch,
  BLD_GROWTH_DYNAMICS_OCT21_ROWS as entries } from "../src/bld-growth-dynamics-oct21-roster.ts";
import { namedBatchRows } from "../src/hil-bld-batch-roster.ts";
import { HIL_FACET_PRESSURE_OCT19_ROWS } from "../src/hil-facet-pressure-oct19-roster.ts";
import { HIL_LARGE_BATCH_OCT11_ROWS } from "../src/hil-large-batch-oct11-roster.ts";
import { HIL_TWO_DAY_OCT12_ROWS } from "../src/hil-two-day-oct12-roster.ts";
import { HIL_WARM_REFINEMENT_ROWS } from "../src/hil-warm-refinement-roster.ts";
import { discoveryExperimentIdentity, type DiscoveryRow } from "../src/post-phase10-discovery.ts";

// Explicit protocol expansion, independent of the producer's loops and helper defaults.
const expectedSuffixes = `
f0-basal-only f0-neither
c0-neither c0-basal-only c0-prism-only c0-both
w1-t4p5-c025-broad w1-t4p5-c025-full-w3 w1-t4p5-c025-late20-w3 w1-t4p5-c025-early1-w3
w1-t4p5-c025-early5-w3 w1-t4p5-c025-early10-w3 w1-t4p5-c025-early20-w3 w1-t4p5-c025-early40-w3
w1-t5-c025-broad w1-t5-c025-full-w3 w1-t5-c025-late20-w3 w1-t5-c025-early1-w3
w1-t5-c025-early5-w3 w1-t5-c025-early10-w3 w1-t5-c025-early20-w3 w1-t5-c025-early40-w3
f1-t6p5-basal-only f1-t6p5-prism-only f1-t9p5-basal-only f1-t9p5-prism-only
w1-t4p5-c05-full-w3 w1-t4p5-c05-late20-w3 w1-t4p5-c05-early1-w3
w1-t4p5-c05-early5-w3 w1-t4p5-c05-early10-w3 w1-t4p5-c05-early40-w3
w1-t5-c05-broad w1-t5-c05-full-w3 w1-t5-c05-late20-w3 w1-t5-c05-early1-w3
w1-t5-c05-early5-w3 w1-t5-c05-early10-w3 w1-t5-c05-early20-w3 w1-t5-c05-early40-w3
w2-t4p5-w2-full w2-t4p5-w2-early5 w2-t4p5-w2-early20
w2-t4p5-w4-full w2-t4p5-w4-early5 w2-t4p5-w4-early20
w2-t5-w2-full w2-t5-w2-early5 w2-t5-w2-early20
w2-t5-w4-full w2-t5-w4-early5 w2-t5-w4-early20
w3-pHalf-broad w3-pHalf-early20-w3 w3-pDouble-broad w3-pDouble-early20-w3
w3-fLow-broad w3-fLow-early20-w3 w3-fHigh-broad w3-fHigh-early20-w3
f2-t7p5-r3-h1-neither f2-t7p5-r3-h1-basal-only f2-t7p5-r3-h1-prism-only f2-t7p5-r3-h1-both
f2-t7p5-r1-h5-neither f2-t7p5-r1-h5-basal-only f2-t7p5-r1-h5-prism-only f2-t7p5-r1-h5-both
f2-t8p5-r3-h1-neither f2-t8p5-r3-h1-basal-only f2-t8p5-r3-h1-prism-only f2-t8p5-r3-h1-both
f2-t8p5-r1-h5-neither f2-t8p5-r1-h5-basal-only f2-t8p5-r1-h5-prism-only f2-t8p5-r1-h5-both
f3-t6p5-f10-neither f3-t6p5-f10-basal-only f3-t6p5-f10-prism-only f3-t6p5-f10-both
f3-t6p5-f20-neither f3-t6p5-f20-basal-only f3-t6p5-f20-prism-only f3-t6p5-f20-both
f3-t9p5-f10-neither f3-t9p5-f10-basal-only f3-t9p5-f10-prism-only f3-t9p5-f10-both
f3-t9p5-f20-neither f3-t9p5-f20-basal-only f3-t9p5-f20-prism-only f3-t9p5-f20-both
`.trim().split(/\s+/);
const byId = (suffix: string) => entries.find(({ row }) => row.id === `gd21-bld-${suffix}`)!;
const warmSamples = [5, 9, 13, 17, 21, 25];
const facetSamples = [5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27];

// Recompute from the monograph table anchors, without calling the producer's interpolation function.
function tableSigma(tempC: number): number {
  if (tempC === -20) return 0.215;
  if (tempC === -4.5) return 0.02 + ((-4.5 + 2) / (-5 + 2)) * (0.05 - 0.02);
  return 0.05 + ((tempC + 5) / (-10 + 5)) * (0.102 - 0.05);
}

describe("BLD October21 fixed growth dynamics roster", () => {
  it("pins the exact 92-row order, first 32 slots and BLD-only ceiling", () => {
    expect(expectedSuffixes).toHaveLength(92);
    expect(entries.map(({ row }) => row.id)).toEqual(expectedSuffixes.map((suffix) => `gd21-bld-${suffix}`));
    expect(new Set(entries.map(({ row }) => row.id)).size).toBe(92);
    expect(batch).toMatchObject({ id: "bld-growth-dynamics-2026-10-21",
      launchPrefix: "bld-growth-dynamics-oct21", workerCeilings: { BLD: 32 } });
    expect(namedBatchRows(batch, "BLD")).toHaveLength(92);
    expect(batch.representatives("BLD")).toEqual(entries);
    expect(() => namedBatchRows(batch, "HIL")).toThrow("not assigned");
    expect(entries[31].row.id).toBe("gd21-bld-w1-t4p5-c05-early40-w3");
    expect(entries[32].row.id).toBe("gd21-bld-w1-t5-c05-broad");
    expect(entries.slice(32)).toHaveLength(60);
  });

  it("retains the common finite scientific controls and exact forcing, without a production wall deadline", () => {
    for (const { host, row } of entries) {
      expect(host).toBe("BLD");
      expect(row).toMatchObject({ conditional: false, dimsN: 64, dxUm: 0.35, targetExtent: 29 });
      expect(row.sigmaInfinity).toBe(tableSigma(row.tempC) * row.fraction);
      expect(row).not.toHaveProperty("maxWallSeconds");
      expect(row).not.toHaveProperty("hardWallSeconds");
      expect(row).not.toHaveProperty("timelineEvent");
      expect(row).not.toHaveProperty("experimentalHoleFilling");
      expect(Object.isFrozen(row)).toBe(true);
      expect(Object.isFrozen(row.spatialSampleExtents)).toBe(true);
    }
    expect(batch).not.toHaveProperty("hardWallSeconds");
  });

  it("binds all 30 W1 preparation durations and timestep arms without relaunching reused operands", () => {
    const arms = [
      ["broad", undefined, undefined], ["full-w3", undefined, undefined],
      ["late20-w3", "late-only", 20], ["early1-w3", "early-only", 1],
      ["early5-w3", "early-only", 5], ["early10-w3", "early-only", 10],
      ["early20-w3", "early-only", 20], ["early40-w3", "early-only", 40],
    ] as const;
    let checked = 0;
    for (const [temperature, tempC] of [["4p5", -4.5], ["5", -5]] as const) {
      for (const [step, cflFill] of [["05", 0.05], ["025", 0.025]] as const) {
        for (const [arm, mode, cutoffSeconds] of arms) {
          const suffix = `w1-t${temperature}-c${step}-${arm}`;
          if (temperature === "4p5" && step === "05" && (arm === "broad" || arm === "early20-w3")) {
            expect(byId(suffix)).toBeUndefined();
            continue;
          }
          const expected: DiscoveryRow = { id: `gd21-bld-${suffix}`, lane: "cavity-mechanism",
            conditional: false, tempC, fraction: 0.075, sigmaInfinity: tableSigma(tempC) * 0.075,
            pressurePa: 101325, paramSet: arm === "broad" ? "M1_NO_DIP_ABLATION" : "M1",
            dimsN: 64, dxUm: 0.35, seedRadius: 2, seedThickness: 1, cflFill,
            targetExtent: 29, maxSteps: 100000, spatialSampleExtents: warmSamples,
            ...(arm === "broad" ? {} : { experimentalBasalWidthCells: 3 }),
            ...(mode === undefined ? {} : { experimentalBasalWidthHistory: { mode, cutoffSeconds } }),
          };
          expect(byId(suffix)).toEqual({ host: "BLD", track: "warm-history", row: expected });
          checked++;
        }
      }
    }
    expect(checked).toBe(30);
  });

  it("changes only registered width, pressure or forcing for the 20 W2/W3 operands", () => {
    for (const temperature of ["4p5", "5"]) {
      for (const width of [2, 4]) {
        for (const arm of ["full", "early5", "early20"]) {
          const entry = byId(`w2-t${temperature}-w${width}-${arm}`);
          const reference = byId(`w1-t${temperature}-c025-${arm}-w3`);
          expect(entry).toEqual({ ...reference, row: { ...reference.row, id: entry.row.id,
            experimentalBasalWidthCells: width } });
        }
      }
    }
    for (const [condition, pressurePa, fraction] of [
      ["pHalf", 50662.5, 0.075], ["pDouble", 202650, 0.075],
      ["fLow", 101325, 0.05], ["fHigh", 101325, 0.1],
    ] as const) {
      for (const arm of ["broad", "early20-w3"]) {
        const entry = byId(`w3-${condition}-${arm}`);
        const reference = byId(`w1-t4p5-c025-${arm}`);
        expect(entry).toEqual({ ...reference, row: { ...reference.row, id: entry.row.id,
          pressurePa, fraction, sigmaInfinity: tableSigma(-4.5) * fraction } });
      }
    }
  });

  it("matches all 42 facet/sentinel controls, changing only registered ID and timestep", () => {
    const controls = [...HIL_FACET_PRESSURE_OCT19_ROWS, ...HIL_LARGE_BATCH_OCT11_ROWS, ...HIL_TWO_DAY_OCT12_ROWS];
    const match = (suffix: string, controlId: string, cflFill: number) => {
      const entry = byId(suffix);
      const control = controls.find(({ row }) => row.id === controlId);
      expect(control, controlId).toBeDefined();
      expect(entry).toEqual({ ...control, host: "BLD", row: { ...control!.row, id: entry.row.id, cflFill } });
      expect(entry.row).toMatchObject({ pressurePa: 101325, maxSteps: 20000,
        paramSet: "M1", spatialSampleExtents: facetSamples });
    };
    for (const arm of ["basal-only", "neither"]) {
      const controlId = arm === "basal-only"
        ? "oct19-hil-facet-step-t9p5-f0p15-r3-h1-cfl0p025-basal-only"
        : "oct11-hil-seed-t9p5-f0p15-r3-h1-neither";
      match(`f0-${arm}`, controlId, 0.0125);
    }
    const arms = ["neither", "basal-only", "prism-only", "both"];
    for (const arm of arms) match(`c0-${arm}`, `oct12-hil-cold-step-t20-f0p15-cfl0p025-${arm}`, 0.0125);
    for (const temperature of ["6p5", "9p5"]) {
      for (const arm of ["basal-only", "prism-only"]) {
        match(`f1-t${temperature}-${arm}`, `oct11-hil-seed-t${temperature}-f0p15-r1-h5-${arm}`, 0.025);
      }
      for (const [forcing, fraction] of [["10", "0p1"], ["20", "0p2"]]) {
        for (const arm of arms) {
          match(`f3-t${temperature}-f${forcing}-${arm}`,
            `oct12-hil-seed-t${temperature}-f${fraction}-r3-h1-${arm}`, 0.025);
        }
      }
    }
    for (const temperature of ["7p5", "8p5"]) {
      for (const seed of ["r3-h1", "r1-h5"]) {
        for (const arm of arms) {
          match(`f2-t${temperature}-${seed}-${arm}`, `oct12-hil-seed-t${temperature}-f0p15-${seed}-${arm}`, 0.025);
        }
      }
    }
    expect(entries.filter(({ row }) => row.experimentalFacetDips !== undefined)).toHaveLength(42);
  });

  it("preserves historical warm configurations and distinct experiment identities", () => {
    for (const [arm, oldArm] of [["broad", "broad"], ["early20-w3", "early"]]) {
      const old = HIL_WARM_REFINEMENT_ROWS.find(({ row }) => row.id === `warm-refine-coarse-t4p5-${oldArm}`)!;
      const entry = byId(`w1-t4p5-c025-${arm}`);
      expect(entry).toEqual({ ...old, host: "BLD", row: { ...old.row, id: entry.row.id, cflFill: 0.025 } });
    }
    for (const { row } of entries) {
      const identity = discoveryExperimentIdentity(row);
      if (row.paramSet === "M1_NO_DIP_ABLATION") {
        expect(identity).toEqual({});
        expect(row).not.toHaveProperty("experimentalBasalWidthCells");
        expect(row).not.toHaveProperty("experimentalBasalWidthHistory");
      } else if (row.experimentalFacetDips !== undefined) {
        expect(identity.experimentId).toBe("post-phase10-facet-isolation-v1");
        expect(row).not.toHaveProperty("experimentalBasalWidthCells");
      } else if (row.experimentalBasalWidthHistory !== undefined) {
        expect(identity.experimentId).toBe("post-phase10-basal-width-history-v1");
        expect(Object.isFrozen(row.experimentalBasalWidthHistory)).toBe(true);
      } else {
        expect(identity.experimentId).toBe("post-phase10-local-basal-width-v1");
      }
    }
  });
});
