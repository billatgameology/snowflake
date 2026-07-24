import { cellCount, type Dims } from "@vcc/core";

export type GpuOperatorKind = "gg" | "lk";
export type GpuScalarType = "u32" | "f32";

export interface GpuCellBufferSchema {
  readonly name: string;
  readonly scalarType: GpuScalarType;
  readonly bytesPerCell: 4;
  readonly ownership: "shared" | GpuOperatorKind;
}

export const GPU_SHARED_CELL_BUFFERS = [
  { name: "occupancy", scalarType: "u32", bytesPerCell: 4, ownership: "shared" },
  { name: "wall", scalarType: "u32", bytesPerCell: 4, ownership: "shared" },
  { name: "topology", scalarType: "u32", bytesPerCell: 4, ownership: "shared" },
  { name: "boundaryIndices", scalarType: "u32", bytesPerCell: 4, ownership: "shared" },
  { name: "scratchScalarA", scalarType: "f32", bytesPerCell: 4, ownership: "shared" },
  { name: "scratchScalarB", scalarType: "f32", bytesPerCell: 4, ownership: "shared" },
  { name: "noise", scalarType: "f32", bytesPerCell: 4, ownership: "shared" },
  { name: "reduction", scalarType: "f32", bytesPerCell: 4, ownership: "shared" },
  { name: "renderFlags", scalarType: "u32", bytesPerCell: 4, ownership: "shared" },
] as const satisfies readonly GpuCellBufferSchema[];

export const GPU_GG_CELL_BUFFERS = [
  { name: "ggBoundaryMass", scalarType: "f32", bytesPerCell: 4, ownership: "gg" },
  { name: "ggVaporA", scalarType: "f32", bytesPerCell: 4, ownership: "gg" },
  { name: "ggVaporB", scalarType: "f32", bytesPerCell: 4, ownership: "gg" },
] as const satisfies readonly GpuCellBufferSchema[];

export const GPU_LK_CELL_BUFFERS = [
  { name: "lkFill", scalarType: "f32", bytesPerCell: 4, ownership: "lk" },
  { name: "lkSigmaA", scalarType: "f32", bytesPerCell: 4, ownership: "lk" },
  { name: "lkSigmaB", scalarType: "f32", bytesPerCell: 4, ownership: "lk" },
  {
    name: "lkBoundaryAttachmentCoefficient",
    scalarType: "f32",
    bytesPerCell: 4,
    ownership: "lk",
  },
  {
    name: "lkBoundarySupersaturation",
    scalarType: "f32",
    bytesPerCell: 4,
    ownership: "lk",
  },
  {
    name: "lkOpposingSupersaturation",
    scalarType: "f32",
    bytesPerCell: 4,
    ownership: "lk",
  },
] as const satisfies readonly GpuCellBufferSchema[];

export const GPU_GG_BYTES_PER_CELL = 48;
export const GPU_LK_BYTES_PER_CELL = 60;
export const GPU_CELL_BYTES_CEILING = 64;

export interface GpuGridLayout {
  readonly dims: Dims;
  readonly plane: number;
  readonly cellCount: number;
}

function requirePositiveU32(value: number, label: string): number {
  if (!Number.isSafeInteger(value) || value <= 0 || value > 0xffff_ffff) {
    throw new Error(`${label} must be a positive u32-safe integer`);
  }
  return value;
}

export function createGpuGridLayout(dims: Dims): GpuGridLayout {
  const nx = requirePositiveU32(dims.nx, "dims.nx");
  const ny = requirePositiveU32(dims.ny, "dims.ny");
  const nz = requirePositiveU32(dims.nz, "dims.nz");
  const plane = nx * ny;
  const count = plane * nz;
  if (
    !Number.isSafeInteger(plane) ||
    !Number.isSafeInteger(count) ||
    plane > 0xffff_ffff ||
    count > 0xffff_ffff
  ) {
    throw new Error("GPU grid products must fit exact host integers and WGSL u32");
  }
  if (count !== cellCount({ nx, ny, nz })) {
    throw new Error("GPU grid cell-count calculation disagrees with core");
  }
  return { dims: { nx, ny, nz }, plane, cellCount: count };
}

export function gpuIndex(
  layout: GpuGridLayout,
  i: number,
  j: number,
  k: number,
): number {
  if (
    !Number.isSafeInteger(i) ||
    !Number.isSafeInteger(j) ||
    !Number.isSafeInteger(k) ||
    i < 0 ||
    i >= layout.dims.nx ||
    j < 0 ||
    j >= layout.dims.ny ||
    k < 0 ||
    k >= layout.dims.nz
  ) {
    throw new Error(`GPU coordinates are out of range: (${i},${j},${k})`);
  }
  return k * layout.plane + j * layout.dims.nx + i;
}

export function gpuCoords(
  layout: GpuGridLayout,
  index: number,
): readonly [number, number, number] {
  if (!Number.isSafeInteger(index) || index < 0 || index >= layout.cellCount) {
    throw new Error(`GPU index is out of range: ${String(index)}`);
  }
  const k = Math.floor(index / layout.plane);
  const remainder = index - k * layout.plane;
  const j = Math.floor(remainder / layout.dims.nx);
  const i = remainder - j * layout.dims.nx;
  return [i, j, k];
}

export function coordinateHash(i: number, j: number, k: number): number {
  return (
    Math.imul(i, 73_856_093) ^
    Math.imul(j, 19_349_663) ^
    Math.imul(k, 83_492_791)
  ) >>> 0;
}

export interface GpuBufferDescriptor {
  readonly name: string;
  readonly scalarType: GpuScalarType;
  readonly ownership: "shared" | GpuOperatorKind;
  readonly byteLength: number;
}

export interface GpuBufferPlan {
  readonly operator: GpuOperatorKind;
  readonly layout: GpuGridLayout;
  readonly buffers: readonly GpuBufferDescriptor[];
  readonly bytesPerCell: number;
  readonly totalCellBytes: number;
}

export function createGpuBufferPlan(
  dims: Dims,
  operator: GpuOperatorKind,
): GpuBufferPlan {
  const layout = createGpuGridLayout(dims);
  const operatorBuffers =
    operator === "gg" ? GPU_GG_CELL_BUFFERS : GPU_LK_CELL_BUFFERS;
  const schema = [...GPU_SHARED_CELL_BUFFERS, ...operatorBuffers];
  const buffers = schema.map((entry) => {
    const byteLength = layout.cellCount * entry.bytesPerCell;
    if (!Number.isSafeInteger(byteLength) || byteLength <= 0 || byteLength % 4 !== 0) {
      throw new Error(`invalid GPU byte length for ${entry.name}`);
    }
    return {
      name: entry.name,
      scalarType: entry.scalarType,
      ownership: entry.ownership,
      byteLength,
    };
  });
  const bytesPerCell = schema.reduce((sum, entry) => sum + entry.bytesPerCell, 0);
  const expected = operator === "gg" ? GPU_GG_BYTES_PER_CELL : GPU_LK_BYTES_PER_CELL;
  if (bytesPerCell !== expected || bytesPerCell > GPU_CELL_BYTES_CEILING) {
    throw new Error(`GPU ${operator} schema has unexpected bytes/cell ${bytesPerCell}`);
  }
  return {
    operator,
    layout,
    buffers,
    bytesPerCell,
    totalCellBytes: layout.cellCount * bytesPerCell,
  };
}

export interface GpuAllocationLimits {
  readonly maxBufferSize: number;
  readonly maxStorageBufferBindingSize: number;
  readonly aggregateByteLimit?: number;
}

export interface GpuAllocationSupport {
  readonly supported: boolean;
  readonly reasons: readonly string[];
  readonly largestBufferBytes: number;
  readonly totalCellBytes: number;
}

export function validateGpuAllocation(
  plan: GpuBufferPlan,
  limits: GpuAllocationLimits,
): GpuAllocationSupport {
  for (const [name, value] of Object.entries(limits)) {
    if (
      value !== undefined &&
      (!Number.isSafeInteger(value) || value <= 0)
    ) {
      throw new Error(`${name} must be a positive safe integer`);
    }
  }
  const reasons: string[] = [];
  let largestBufferBytes = 0;
  for (const buffer of plan.buffers) {
    largestBufferBytes = Math.max(largestBufferBytes, buffer.byteLength);
    if (buffer.byteLength > limits.maxBufferSize) {
      reasons.push(
        `${buffer.name} requires ${buffer.byteLength} bytes, above maxBufferSize ` +
          `${limits.maxBufferSize}`,
      );
    }
    if (buffer.byteLength > limits.maxStorageBufferBindingSize) {
      reasons.push(
        `${buffer.name} requires ${buffer.byteLength} bytes, above ` +
          `maxStorageBufferBindingSize ${limits.maxStorageBufferBindingSize}`,
      );
    }
  }
  if (
    limits.aggregateByteLimit !== undefined &&
    plan.totalCellBytes > limits.aggregateByteLimit
  ) {
    reasons.push(
      `cell buffers require ${plan.totalCellBytes} bytes, above aggregateByteLimit ` +
        `${limits.aggregateByteLimit}`,
    );
  }
  return {
    supported: reasons.length === 0,
    reasons,
    largestBufferBytes,
    totalCellBytes: plan.totalCellBytes,
  };
}

export const GPU_GRID_UNIFORM_BYTES = 48;

export const GPU_GRID_UNIFORM_OFFSETS = {
  dims: 0,
  cellCount: 12,
  plane: 16,
  baseCell: 20,
  generation: 24,
  rngSeed: 28,
  tick: 32,
  streamId: 36,
  reserved0: 40,
  reserved1: 44,
} as const;

export interface GpuGridUniformValues {
  readonly layout: GpuGridLayout;
  readonly baseCell: number;
  readonly generation: number;
  readonly rngSeed: number;
  readonly tick: number;
  readonly streamId: number;
}

function requireU32(value: number, label: string): number {
  if (
    !Number.isSafeInteger(value) ||
    value < 0 ||
    value > 0xffff_ffff
  ) {
    throw new Error(`${label} must be a u32-safe integer`);
  }
  return value;
}

export function encodeGpuGridUniforms(values: GpuGridUniformValues): ArrayBuffer {
  const { layout } = values;
  if (values.baseCell >= layout.cellCount) {
    throw new Error("baseCell must address a cell in the grid");
  }
  const words = new Uint32Array(GPU_GRID_UNIFORM_BYTES / 4);
  words[0] = layout.dims.nx;
  words[1] = layout.dims.ny;
  words[2] = layout.dims.nz;
  words[3] = layout.cellCount;
  words[4] = layout.plane;
  words[5] = requireU32(values.baseCell, "baseCell");
  words[6] = requireU32(values.generation, "generation");
  words[7] = requireU32(values.rngSeed, "rngSeed");
  words[8] = requireU32(values.tick, "tick");
  words[9] = requireU32(values.streamId, "streamId");
  words[10] = 0;
  words[11] = 0;
  return words.buffer;
}

export const GPU_GRID_UNIFORM_WGSL = /* wgsl */ `
struct GridUniforms {
  dims: vec3<u32>,
  cellCount: u32,
  plane: u32,
  baseCell: u32,
  generation: u32,
  rngSeed: u32,
  tick: u32,
  streamId: u32,
  reserved0: u32,
  reserved1: u32,
}
`;
