// GG+ is a product-side initial-condition extension of the permanent G-G control. It inherits
// every evolution method from GGSolver unchanged and adds only a strict, versioned seed geometry.
// Keeping this adapter in a separate source file preserves the byte-frozen gg-solver.ts identity
// used by the completed Phase 9 permanent-control readiness record.

import { hexSeedSites } from "@vcc/core";
import { GGSolver, type GGSolverOptions } from "./gg-solver.ts";

export type GGSeedOffset = readonly [number, number, number];

export type GGSeedGeometryV1 =
  | {
      readonly version: 1;
      readonly kind: "none";
    }
  | {
      readonly version: 1;
      readonly kind: "hexPrism";
      readonly radius: number;
      readonly thickness: number;
    }
  | {
      readonly version: 1;
      readonly kind: "siteOffsets";
      readonly offsets: readonly GGSeedOffset[];
    };

export type GGPlusSolverOptions = Omit<GGSolverOptions, "seedRadius" | "seedThickness"> & {
  readonly seedGeometry: GGSeedGeometryV1;
};

const SEED_NEIGHBOR_OFFSETS: readonly GGSeedOffset[] = [
  [1, 0, 0],
  [-1, 0, 0],
  [0, 1, 0],
  [0, -1, 0],
  [1, -1, 0],
  [-1, 1, 0],
  [0, 0, 1],
  [0, 0, -1],
] as const;

function exactOwnKeys(
  value: Record<string, unknown>,
  expected: readonly string[],
  label: string,
): void {
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  if (actual.length !== wanted.length || actual.some((key, index) => key !== wanted[index])) {
    throw new Error(`${label} keys must be exactly [${wanted.join(", ")}]`);
  }
}

function seedOffsetKey(offset: GGSeedOffset): string {
  return `${offset[0]},${offset[1]},${offset[2]}`;
}

function snapshotSeedGeometry(value: unknown): GGSeedGeometryV1 {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("seedGeometry must be an object");
  }
  const record = value as Record<string, unknown>;
  const version = record.version;
  const kind = record.kind;
  if (version !== 1) throw new Error(`seedGeometry.version must be 1, got ${String(version)}`);

  if (kind === "none") {
    exactOwnKeys(record, ["version", "kind"], "seedGeometry none");
    return { version: 1, kind: "none" };
  }
  if (kind === "hexPrism") {
    exactOwnKeys(
      record,
      ["version", "kind", "radius", "thickness"],
      "seedGeometry hexPrism",
    );
    const radius = record.radius;
    const thickness = record.thickness;
    if (!Number.isSafeInteger(radius) || (radius as number) < 0) {
      throw new Error(`seedGeometry.radius must be a non-negative safe integer, got ${radius}`);
    }
    if (
      !Number.isSafeInteger(thickness) ||
      (thickness as number) < 1 ||
      (thickness as number) % 2 === 0
    ) {
      throw new Error(`seedGeometry.thickness must be odd and >= 1, got ${thickness}`);
    }
    return {
      version: 1,
      kind: "hexPrism",
      radius: radius as number,
      thickness: thickness as number,
    };
  }
  if (kind !== "siteOffsets") {
    throw new Error(`seedGeometry.kind must be none, hexPrism, or siteOffsets, got ${String(kind)}`);
  }
  exactOwnKeys(record, ["version", "kind", "offsets"], "seedGeometry siteOffsets");
  const offsetsValue = record.offsets;
  if (!Array.isArray(offsetsValue) || offsetsValue.length === 0) {
    throw new Error("seedGeometry.offsets must be a non-empty array");
  }
  exactOwnKeys(
    offsetsValue as unknown as Record<string, unknown>,
    Array.from({ length: offsetsValue.length }, (_, index) => String(index)),
    "seedGeometry.offsets",
  );

  const offsets: GGSeedOffset[] = new Array(offsetsValue.length);
  const keys = new Set<string>();
  for (let index = 0; index < offsetsValue.length; index++) {
    const candidate = offsetsValue[index];
    if (!Array.isArray(candidate) || candidate.length !== 3) {
      throw new Error(`seedGeometry.offsets[${index}] must contain exactly three coordinates`);
    }
    exactOwnKeys(
      candidate as unknown as Record<string, unknown>,
      ["0", "1", "2"],
      `seedGeometry.offsets[${index}]`,
    );
    const owned: GGSeedOffset = [
      candidate[0] as number,
      candidate[1] as number,
      candidate[2] as number,
    ];
    for (let axis = 0; axis < 3; axis++) {
      if (!Number.isSafeInteger(owned[axis])) {
        throw new Error(
          `seedGeometry.offsets[${index}][${axis}] must be a safe integer, got ${owned[axis]}`,
        );
      }
    }
    const key = seedOffsetKey(owned);
    if (keys.has(key)) throw new Error(`seedGeometry.offsets contains duplicate ${key}`);
    keys.add(key);
    offsets[index] = owned;
  }

  const visited = new Set<string>();
  const pending: GGSeedOffset[] = [offsets[0]!];
  visited.add(seedOffsetKey(offsets[0]!));
  while (pending.length > 0) {
    const current = pending.pop()!;
    for (const delta of SEED_NEIGHBOR_OFFSETS) {
      const neighbor: GGSeedOffset = [
        current[0] + delta[0],
        current[1] + delta[1],
        current[2] + delta[2],
      ];
      const key = seedOffsetKey(neighbor);
      if (keys.has(key) && !visited.has(key)) {
        visited.add(key);
        pending.push(neighbor);
      }
    }
  }
  if (visited.size !== offsets.length) {
    throw new Error("seedGeometry.offsets must form one connected lattice component");
  }
  return { version: 1, kind: "siteOffsets", offsets };
}

/**
 * G-G evolution with a versioned initial seed. No diffusion, freezing, threshold attachment,
 * melting, noise, timeline, stopping, or ledger behavior is overridden.
 */
export class GGPlusSolver extends GGSolver {
  private readonly ggPlusInitialSeed: Int32Array;

  constructor(options: GGPlusSolverOptions) {
    if (options === null || typeof options !== "object") {
      throw new Error("GGPlusSolver options must be an object");
    }
    const runtimeOptions = options as GGPlusSolverOptions & Record<string, unknown>;
    if (
      Object.prototype.hasOwnProperty.call(runtimeOptions, "seedRadius") ||
      Object.prototype.hasOwnProperty.call(runtimeOptions, "seedThickness")
    ) {
      throw new Error("seedGeometry is mutually exclusive with seedRadius and seedThickness");
    }
    const { seedGeometry: seedGeometryValue, ...baseOptions } = runtimeOptions;
    const seedGeometry = snapshotSeedGeometry(seedGeometryValue);
    super({ ...(baseOptions as Omit<GGSolverOptions, "seedRadius">), seedRadius: null });

    const { nx, ny, nz } = this.dims;
    const [ic, jc, kc] = this.center;
    let sites: readonly number[] = [];
    if (seedGeometry.kind === "hexPrism") {
      sites = hexSeedSites(
        this.dims,
        seedGeometry.radius,
        seedGeometry.thickness,
        this.center,
      );
    } else if (seedGeometry.kind === "siteOffsets") {
      const resolved: number[] = [];
      for (const offset of seedGeometry.offsets) {
        const i = ic + offset[0];
        const j = jc + offset[1];
        const k = kc + offset[2];
        if (i < 0 || i >= nx || j < 0 || j >= ny || k < 0 || k >= nz) {
          throw new Error(`seed site offset ${seedOffsetKey(offset)} is outside the domain`);
        }
        const site = k * nx * ny + j * nx + i;
        if (this.wall[site] === 1) {
          throw new Error(`seed site offset ${seedOffsetKey(offset)} is outside the active domain`);
        }
        resolved.push(site);
      }
      resolved.sort((left, right) => left - right);
      sites = resolved;
    }

    const attachCell = Reflect.get(this, "attachCell");
    const rebuildBoundaryList = Reflect.get(this, "rebuildBoundaryList");
    if (typeof attachCell !== "function" || typeof rebuildBoundaryList !== "function") {
      throw new Error("GG+ initialization is incompatible with this GGSolver implementation");
    }
    for (const site of sites) {
      if (this.wall[site] === 1) throw new Error("seed does not fit the active domain");
      Reflect.apply(attachCell, this, [site, true]);
    }
    if (sites.length > 0) Reflect.apply(rebuildBoundaryList, this, []);
    this.ggPlusInitialSeed = Int32Array.from([...sites].sort((left, right) => left - right));
  }

  /** Sorted, copy-safe flat indices for the exact initialized seed. */
  initialSeedCells(): readonly number[] {
    return Array.from(this.ggPlusInitialSeed);
  }
}
