import { describe, expect, it } from "vitest";
import { isD6hInvariantSet, GG_PRESETS, type Dims } from "@vcc/core";
import { GGPlusSolver, GGSolver } from "@vcc/solver-cpu";

const devDims: Dims = { nx: 32, ny: 32, nz: 16 };

describe("GGPlusSolver — versioned seed geometry", () => {
  const base = { dims: devDims, params: GG_PRESETS.plate, rngSeed: 1 } as const;

  it("inherits an evolution trajectory bit-identical to the permanent G-G control", () => {
    const control = new GGSolver({ ...base, seedRadius: 2, seedThickness: 1 });
    const extended = new GGPlusSolver({
      ...base,
      seedGeometry: { version: 1, kind: "hexPrism", radius: 2, thickness: 1 },
    });
    expect(extended.initialSeedCells()).toEqual(
      Array.from(control.a, (attached, site) => attached === 1 ? site : -1).filter(
        (site) => site >= 0,
      ),
    );
    for (let tick = 0; tick < 200; tick++) {
      control.step();
      extended.step();
    }
    expect(Array.from(extended.a)).toEqual(Array.from(control.a));
    expect(Array.from(extended.b)).toEqual(Array.from(control.b));
    expect(Array.from(extended.d)).toEqual(Array.from(control.d));
  });

  it("canonicalizes custom site order without changing the initialized seed or growth", () => {
    const offsets = [
      [0, 0, 0],
      [1, 0, 0],
      [2, 0, 0],
      [2, 0, 1],
    ] as const;
    const forward = new GGPlusSolver({
      ...base,
      seedGeometry: { version: 1, kind: "siteOffsets", offsets },
    });
    const shuffled = new GGPlusSolver({
      ...base,
      seedGeometry: {
        version: 1,
        kind: "siteOffsets",
        offsets: [offsets[2], offsets[0], offsets[3], offsets[1]],
      },
    });
    expect(forward.initialSeedCells()).toEqual(shuffled.initialSeedCells());
    expect(isD6hInvariantSet(forward.initialSeedCells(), forward.dims, forward.center)).toBe(false);
    for (const site of forward.initialSeedCells()) {
      expect(forward.a[site]).toBe(1);
      expect(forward.b[site]).toBe(1);
      expect(forward.d[site]).toBe(0);
    }
    const copy = forward.initialSeedCells() as number[];
    copy[0] = 0;
    expect(forward.initialSeedCells()).toEqual(shuffled.initialSeedCells());
    for (let tick = 0; tick < 80; tick++) {
      forward.step();
      shuffled.step();
    }
    expect(Array.from(forward.a)).toEqual(Array.from(shuffled.a));
    expect(Array.from(forward.b)).toEqual(Array.from(shuffled.b));
    expect(Array.from(forward.d)).toEqual(Array.from(shuffled.d));
  });

  it("supports an explicit no-seed control", () => {
    const solver = new GGPlusSolver({
      ...base,
      seedGeometry: { version: 1, kind: "none" },
    });
    expect(solver.attachedCount).toBe(0);
    expect(solver.initialSeedCells()).toEqual([]);
  });

  it("rejects ambiguous, malformed, duplicate, disconnected, and non-fitting custom seeds", () => {
    expect(
      () =>
        new GGPlusSolver({
          ...base,
          seedRadius: 2,
          seedGeometry: { version: 1, kind: "none" },
        } as never),
    ).toThrow(/mutually exclusive/);
    expect(
      () =>
        new GGPlusSolver({
          ...base,
          seedGeometry: { version: 1, kind: "siteOffsets", offsets: [] },
        }),
    ).toThrow(/non-empty/);
    expect(
      () =>
        new GGPlusSolver({
          ...base,
          seedGeometry: {
            version: 1,
            kind: "siteOffsets",
            offsets: [
              [0, 0, 0],
              [0, 0, 0],
            ],
          },
        }),
    ).toThrow(/duplicate/);
    expect(
      () =>
        new GGPlusSolver({
          ...base,
          seedGeometry: {
            version: 1,
            kind: "siteOffsets",
            offsets: [
              [0, 0, 0],
              [2, 0, 0],
            ],
          },
        }),
    ).toThrow(/connected/);
    expect(
      () =>
        new GGPlusSolver({
          ...base,
          seedGeometry: {
            version: 1,
            kind: "siteOffsets",
            offsets: [[0.5, 0, 0]],
          },
        }),
    ).toThrow(/safe integer/);
    expect(
      () =>
        new GGPlusSolver({
          ...base,
          seedGeometry: { version: 1, kind: "siteOffsets", offsets: [[16, 0, 0]] },
        }),
    ).toThrow(/outside the domain/);
    expect(
      () =>
        new GGPlusSolver({
          ...base,
          domain: "hexPrism",
          seedGeometry: { version: 1, kind: "siteOffsets", offsets: [[15, 1, 0]] },
        }),
    ).toThrow(/outside the active domain/);
  });
});
