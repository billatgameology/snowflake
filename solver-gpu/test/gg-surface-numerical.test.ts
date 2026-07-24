import { describe, expect, test } from "vitest";
import {
  idx,
  neighborIndices,
  paramSlot,
  type Dims,
  type GGParams,
} from "@vcc/core";

interface SurfaceState {
  readonly occupancy: Uint32Array;
  readonly wall: Uint32Array;
  readonly boundary: readonly number[];
  readonly boundaryMass: Float32Array;
  readonly vapor: Float32Array;
}

interface SurfaceResult extends SurfaceState {
  readonly attached: readonly number[];
  readonly holeFills: readonly number[];
}

function counts(
  occupancy: Uint32Array,
  dims: Dims,
  index: number,
): readonly [number, number] {
  const plane = dims.nx * dims.ny;
  const k = Math.floor(index / plane);
  const remainder = index - k * plane;
  const j = Math.floor(remainder / dims.nx);
  const i = remainder - j * dims.nx;
  const neighbors = neighborIndices(dims, i, j, k);
  let nT = 0;
  let nZ = 0;
  for (let offset = 0; offset < 6; offset++) {
    const neighbor = neighbors[offset];
    if (neighbor >= 0 && occupancy[neighbor] !== 0) nT++;
  }
  for (let offset = 6; offset < 8; offset++) {
    const neighbor = neighbors[offset];
    if (neighbor >= 0 && occupancy[neighbor] !== 0) nZ++;
  }
  return [nT, nZ];
}

/**
 * Independent binary32 transcription of the registered surface stage. This is deliberately
 * test-local: production continues to be the WGSL graph, while these scalar equations make
 * threshold order, raw-count hole filling, and boundary-list evolution reviewable.
 */
function surfaceCycle(
  dims: Dims,
  params: GGParams,
  input: SurfaceState,
  holeFillUsesRawCounts = true,
): SurfaceResult {
  const occupancy = new Uint32Array(input.occupancy);
  const wall = new Uint32Array(input.wall);
  const boundaryMass = new Float32Array(input.boundaryMass);
  const vapor = new Float32Array(input.vapor);
  const startCounts = new Map<number, readonly [number, number]>();
  const decisions: number[] = [];
  const holeFills: number[] = [];

  for (const index of input.boundary) {
    const [nT, nZ] = counts(occupancy, dims, index);
    startCounts.set(index, [nT, nZ]);
    const slot = paramSlot(Math.min(nT, 3), Math.min(nZ, 1));
    const oldVapor = vapor[index];
    boundaryMass[index] = Math.fround(
      boundaryMass[index] +
        Math.fround(Math.fround(1 - Math.fround(params.kappa[slot])) * oldVapor),
    );
    vapor[index] = Math.fround(Math.fround(params.kappa[slot]) * oldVapor);
  }

  for (const index of input.boundary) {
    const [nT, nZ] = startCounts.get(index) ?? [-1, -1];
    const slot = paramSlot(Math.min(nT, 3), Math.min(nZ, 1));
    const holeFill = holeFillUsesRawCounts && nT >= 4 && nZ >= 1;
    if (holeFill || boundaryMass[index] >= Math.fround(params.ggThreshBeta[slot])) {
      decisions.push(index);
      if (holeFill) holeFills.push(index);
    }
  }

  const decisionSet = new Set(decisions);
  for (const index of input.boundary) {
    if (decisionSet.has(index)) continue;
    const [nT, nZ] = startCounts.get(index) ?? [-1, -1];
    const slot = paramSlot(Math.min(nT, 3), Math.min(nZ, 1));
    const oldMass = boundaryMass[index];
    boundaryMass[index] = Math.fround(
      Math.fround(1 - Math.fround(params.mu[slot])) * oldMass,
    );
    vapor[index] = Math.fround(
      vapor[index] + Math.fround(Math.fround(params.mu[slot]) * oldMass),
    );
  }

  for (const index of decisions) {
    occupancy[index] = 1;
    boundaryMass[index] = Math.fround(boundaryMass[index] + vapor[index]);
    vapor[index] = 0;
  }

  const boundary: number[] = input.boundary.filter(
    (index) => !decisionSet.has(index),
  );
  const membership = new Set(boundary);
  for (const index of decisions) {
    const plane = dims.nx * dims.ny;
    const k = Math.floor(index / plane);
    const remainder = index - k * plane;
    const j = Math.floor(remainder / dims.nx);
    const i = remainder - j * dims.nx;
    for (const neighbor of neighborIndices(dims, i, j, k)) {
      if (
        neighbor >= 0 &&
        occupancy[neighbor] === 0 &&
        wall[neighbor] === 0 &&
        !membership.has(neighbor)
      ) {
        membership.add(neighbor);
        boundary.push(neighbor);
      }
    }
  }
  return {
    occupancy,
    wall,
    boundary,
    boundaryMass,
    vapor,
    attached: decisions,
    holeFills,
  };
}

describe("independent G-G surface numerics", () => {
  test("pins non-cubic freezing, simultaneous decisions, melting exclusion, raw hole fill, and boundary order", () => {
    const dims = { nx: 7, ny: 6, nz: 5 };
    const count = dims.nx * dims.ny * dims.nz;
    const occupancy = new Uint32Array(count);
    const wall = new Uint32Array(count);
    const boundaryMass = new Float32Array(count);
    const vapor = new Float32Array(count);
    const at = (i: number, j: number, k: number): number =>
      idx(dims, i, j, k);
    for (const attached of [
      at(4, 3, 2),
      at(2, 3, 2),
      at(3, 4, 2),
      at(3, 2, 2),
      at(3, 3, 3),
    ]) {
      occupancy[attached] = 1;
    }
    const survivor = at(1, 3, 2);
    const thresholdAttachment = at(5, 3, 2);
    const holeAttachment = at(3, 3, 2);
    const simultaneousWitness = at(5, 2, 2);
    const boundary = [
      survivor,
      thresholdAttachment,
      holeAttachment,
      simultaneousWitness,
    ];
    wall[at(6, 3, 2)] = 1;
    boundaryMass[survivor] = 0.1;
    boundaryMass[thresholdAttachment] = 0.95;
    boundaryMass[holeAttachment] = 0;
    boundaryMass[simultaneousWitness] = 0;
    for (const index of boundary) vapor[index] = 0.4;

    const params: GGParams = {
      rho: 0.1,
      phi: 0,
      kappa: new Float64Array([0, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25]),
      mu: new Float64Array([0, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2]),
      ggThreshBeta: new Float64Array([0, 4, 1, 4, 0.1, 4, 4, 10]),
    };
    const result = surfaceCycle(dims, params, {
      occupancy,
      wall,
      boundary,
      boundaryMass,
      vapor,
    });

    expect(result.attached).toEqual([thresholdAttachment, holeAttachment]);
    expect(result.holeFills).toEqual([holeAttachment]);
    expect(result.occupancy[simultaneousWitness]).toBe(0);
    expect(result.boundaryMass[thresholdAttachment]).toBeCloseTo(1.35, 6);
    expect(result.vapor[thresholdAttachment]).toBe(0);
    expect(result.boundaryMass[survivor]).toBeCloseTo(0.32, 6);
    expect(result.vapor[survivor]).toBeCloseTo(0.18, 6);
    expect(result.boundary).toEqual([
      survivor,
      simultaneousWitness,
      at(5, 4, 2),
      at(6, 2, 2),
      at(4, 4, 2),
      at(5, 3, 3),
      at(5, 3, 1),
      at(4, 2, 2),
      at(2, 4, 2),
      at(3, 3, 1),
    ]);

    const thresholdMutation = {
      ...params,
      ggThreshBeta: new Float64Array(params.ggThreshBeta),
    };
    thresholdMutation.ggThreshBeta[2] = 1.3;
    expect(
      surfaceCycle(dims, thresholdMutation, {
        occupancy,
        wall,
        boundary,
        boundaryMass,
        vapor,
      }).attached,
    ).toEqual([holeAttachment]);
    expect(
      surfaceCycle(
        dims,
        params,
        { occupancy, wall, boundary, boundaryMass, vapor },
        false,
      ).attached,
    ).toEqual([thresholdAttachment]);
  });
});
