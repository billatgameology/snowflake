import { GPU_WORKGROUP_SIZE } from "./submission.ts";

export const GPU_LK_FLAG_DIRICHLET = 1;
export const GPU_LK_FLAG_TEMPERATURE_CHANGED = 2;

export const GPU_LK_TOPOLOGY_FAR_FIELD = 1;
export const GPU_LK_TOPOLOGY_BOUNDARY = 2;
export const GPU_LK_TOPOLOGY_KINETIC_ATTACH = 4;
export const GPU_LK_TOPOLOGY_HOLE_ATTACH = 8;

export const GPU_LK_RENDER_BOUNDARY = 1;
export const GPU_LK_RENDER_ATTACH_DECISION = 2;
export const GPU_LK_RENDER_HOLE_FILL = 4;
export const GPU_LK_RENDER_ATTACHED_NOW = 8;
export const GPU_LK_RENDER_NT_SHIFT = 8;
export const GPU_LK_RENDER_NZ_SHIFT = 12;

export const GPU_LK_ERROR_NONFINITE_BOUNDARY = 1;
export const GPU_LK_ERROR_FIXED_POINT = 2;
export const GPU_LK_ERROR_NONFINITE_RELAXATION = 4;
export const GPU_LK_ERROR_INVALID_SURFACE = 8;
export const GPU_LK_ERROR_PARTITION = 16;
export const GPU_LK_ERROR_TOPOLOGY = 32;
export const GPU_LK_ERROR_TIMELINE = 64;

export const GPU_LK_REPORT_WORDS = 128;
export const GPU_LK_REPORT_BYTES = GPU_LK_REPORT_WORDS * 4;
export const GPU_LK_RELAXATION_TRACE_CAPACITY = 16;

export const GPU_LK_REPORT_WORD = {
  errorFlags: 0,
  converged: 1,
  performedSweeps: 2,
  activeOwner: 3,
  residual: 4,
  divergence: 5,
  shellInjection: 6,
  surfaceExchange: 7,
  smootherDrift: 8,
  minLocalSurfaceExchange: 9,
  maxAbsSweepInput: 10,
  boundaryCount: 11,
  attachedTotal: 12,
  oldBoundaryCount: 13,
  attachedNow: 14,
  holeFillNow: 15,
  maxKineticFillIncrement: 16,
  deltaTimeSeconds: 17,
  maxRate: 18,
  maxRawDemand: 19,
  demandTotal: 20,
  placedTotal: 21,
  clippedTotal: 22,
  partitionTotal: 23,
  holeFillDeficit: 24,
  iMin: 25,
  iMax: 26,
  jMin: 27,
  jMax: 28,
  kMin: 29,
  kMax: 30,
  timelineActiveCount: 31,
  timelineShellCount: 32,
  densityBefore: 33,
  densityAfter: 34,
  densityMaxAbsError: 35,
  densityMaxRelError: 36,
  convergenceMode: 37,
  maximumCurrentStepUlpDistance: 38,
  maximumTwoBackUlpDistance: 39,
  rawDrift: 40,
  rawMaxAbsSweepInput: 41,
  rawSurfaceExchange: 42,
  rawMinLocalSurfaceExchange: 43,
  rawShellInjection: 44,
  rawResidualMaximum: 45,
  completedSweepsAfterMutation: 46,
  previousDivergenceStatus: 47,
  previousDivergenceResidual: 48,
  previousDriftBoundPassed: 49,
  traceBase: 64,
} as const;

/**
 * Aggregate-v5 LK shader suite. Storage bindings are deliberately word-typed and role-bound.
 * This lets every entry point stay within WebGPU's portable eight-storage-buffer floor while
 * transporting u32 values and f32 bit patterns without reinterpretation by the host.
 */
export const GPU_LK_WGSL = /* wgsl */ `
struct LkUniforms {
  dims: vec3<u32>,
  cellCount: u32,
  plane: u32,
  baseCell: u32,
  generation: u32,
  tick: u32,
  inputBase: u32,
  inputCount: u32,
  outputBase: u32,
  flags: u32,
  activeCellCount: u32,
  boundaryCount: u32,
  rngSeed: u32,
  localSweep: u32,
  sigmaInfinity: f32,
  relaxTol: f32,
  divTol: f32,
  dxOverX0: f32,
  sigma0Basal: f32,
  sigma0Prism: f32,
  prefactorBasal: f32,
  prefactorPrism: f32,
  noiseEpsilon: f32,
  vKinOverDx: f32,
  cflFill: f32,
  cSatOld: f32,
  cSatNew: f32,
  densityRatio: f32,
  ownerAfter: u32,
  captureSlot: u32,
  reserved0: vec4<u32>,
  reserved1: vec4<u32>,
}

@group(0) @binding(0) var<uniform> uniforms: LkUniforms;
@group(0) @binding(1) var<storage, read_write> storage0: array<u32>;
@group(0) @binding(2) var<storage, read_write> storage1: array<u32>;
@group(0) @binding(3) var<storage, read_write> storage2: array<u32>;
@group(0) @binding(4) var<storage, read_write> storage3: array<u32>;
@group(0) @binding(5) var<storage, read_write> storage4: array<u32>;
@group(0) @binding(6) var<storage, read_write> storage5: array<u32>;
@group(0) @binding(7) var<storage, read_write> storage6: array<u32>;
@group(0) @binding(8) var<storage, read_write> report: array<atomic<u32>>;

const TOPOLOGY_FAR_FIELD: u32 = ${GPU_LK_TOPOLOGY_FAR_FIELD}u;
const TOPOLOGY_BOUNDARY: u32 = ${GPU_LK_TOPOLOGY_BOUNDARY}u;
const TOPOLOGY_KINETIC_ATTACH: u32 = ${GPU_LK_TOPOLOGY_KINETIC_ATTACH}u;
const TOPOLOGY_HOLE_ATTACH: u32 = ${GPU_LK_TOPOLOGY_HOLE_ATTACH}u;
const TOPOLOGY_TRANSIENT_MASK: u32 =
  TOPOLOGY_KINETIC_ATTACH | TOPOLOGY_HOLE_ATTACH;

const RENDER_BOUNDARY: u32 = ${GPU_LK_RENDER_BOUNDARY}u;
const RENDER_ATTACH_DECISION: u32 = ${GPU_LK_RENDER_ATTACH_DECISION}u;
const RENDER_HOLE_FILL: u32 = ${GPU_LK_RENDER_HOLE_FILL}u;
const RENDER_ATTACHED_NOW: u32 = ${GPU_LK_RENDER_ATTACHED_NOW}u;
const RENDER_NT_SHIFT: u32 = ${GPU_LK_RENDER_NT_SHIFT}u;
const RENDER_NZ_SHIFT: u32 = ${GPU_LK_RENDER_NZ_SHIFT}u;

const ERROR_NONFINITE_BOUNDARY: u32 = ${GPU_LK_ERROR_NONFINITE_BOUNDARY}u;
const ERROR_FIXED_POINT: u32 = ${GPU_LK_ERROR_FIXED_POINT}u;
const ERROR_NONFINITE_RELAXATION: u32 = ${GPU_LK_ERROR_NONFINITE_RELAXATION}u;
const ERROR_INVALID_SURFACE: u32 = ${GPU_LK_ERROR_INVALID_SURFACE}u;
const ERROR_PARTITION: u32 = ${GPU_LK_ERROR_PARTITION}u;
const ERROR_TOPOLOGY: u32 = ${GPU_LK_ERROR_TOPOLOGY}u;
const ERROR_TIMELINE: u32 = ${GPU_LK_ERROR_TIMELINE}u;

const REPORT_ERROR_FLAGS: u32 = ${GPU_LK_REPORT_WORD.errorFlags}u;
const REPORT_CONVERGED: u32 = ${GPU_LK_REPORT_WORD.converged}u;
const REPORT_PERFORMED_SWEEPS: u32 = ${GPU_LK_REPORT_WORD.performedSweeps}u;
const REPORT_ACTIVE_OWNER: u32 = ${GPU_LK_REPORT_WORD.activeOwner}u;
const REPORT_RESIDUAL: u32 = ${GPU_LK_REPORT_WORD.residual}u;
const REPORT_DIVERGENCE: u32 = ${GPU_LK_REPORT_WORD.divergence}u;
const REPORT_SHELL_INJECTION: u32 = ${GPU_LK_REPORT_WORD.shellInjection}u;
const REPORT_SURFACE_EXCHANGE: u32 = ${GPU_LK_REPORT_WORD.surfaceExchange}u;
const REPORT_SMOOTHER_DRIFT: u32 = ${GPU_LK_REPORT_WORD.smootherDrift}u;
const REPORT_MIN_LOCAL_EXCHANGE: u32 =
  ${GPU_LK_REPORT_WORD.minLocalSurfaceExchange}u;
const REPORT_MAX_ABS_SWEEP_INPUT: u32 =
  ${GPU_LK_REPORT_WORD.maxAbsSweepInput}u;
const REPORT_BOUNDARY_COUNT: u32 = ${GPU_LK_REPORT_WORD.boundaryCount}u;
const REPORT_ATTACHED_TOTAL: u32 = ${GPU_LK_REPORT_WORD.attachedTotal}u;
const REPORT_OLD_BOUNDARY_COUNT: u32 = ${GPU_LK_REPORT_WORD.oldBoundaryCount}u;
const REPORT_ATTACHED_NOW: u32 = ${GPU_LK_REPORT_WORD.attachedNow}u;
const REPORT_HOLE_FILL_NOW: u32 = ${GPU_LK_REPORT_WORD.holeFillNow}u;
const REPORT_MAX_KINETIC_INCREMENT: u32 =
  ${GPU_LK_REPORT_WORD.maxKineticFillIncrement}u;
const REPORT_DELTA_TIME: u32 = ${GPU_LK_REPORT_WORD.deltaTimeSeconds}u;
const REPORT_MAX_RATE: u32 = ${GPU_LK_REPORT_WORD.maxRate}u;
const REPORT_MAX_RAW_DEMAND: u32 = ${GPU_LK_REPORT_WORD.maxRawDemand}u;
const REPORT_DEMAND_TOTAL: u32 = ${GPU_LK_REPORT_WORD.demandTotal}u;
const REPORT_PLACED_TOTAL: u32 = ${GPU_LK_REPORT_WORD.placedTotal}u;
const REPORT_CLIPPED_TOTAL: u32 = ${GPU_LK_REPORT_WORD.clippedTotal}u;
const REPORT_PARTITION_TOTAL: u32 = ${GPU_LK_REPORT_WORD.partitionTotal}u;
const REPORT_HOLE_DEFICIT: u32 = ${GPU_LK_REPORT_WORD.holeFillDeficit}u;
const REPORT_I_MIN: u32 = ${GPU_LK_REPORT_WORD.iMin}u;
const REPORT_I_MAX: u32 = ${GPU_LK_REPORT_WORD.iMax}u;
const REPORT_J_MIN: u32 = ${GPU_LK_REPORT_WORD.jMin}u;
const REPORT_J_MAX: u32 = ${GPU_LK_REPORT_WORD.jMax}u;
const REPORT_K_MIN: u32 = ${GPU_LK_REPORT_WORD.kMin}u;
const REPORT_K_MAX: u32 = ${GPU_LK_REPORT_WORD.kMax}u;
const REPORT_TIMELINE_ACTIVE_COUNT: u32 =
  ${GPU_LK_REPORT_WORD.timelineActiveCount}u;
const REPORT_TIMELINE_SHELL_COUNT: u32 =
  ${GPU_LK_REPORT_WORD.timelineShellCount}u;
const REPORT_DENSITY_BEFORE: u32 = ${GPU_LK_REPORT_WORD.densityBefore}u;
const REPORT_DENSITY_AFTER: u32 = ${GPU_LK_REPORT_WORD.densityAfter}u;
const REPORT_DENSITY_MAX_ABS_ERROR: u32 =
  ${GPU_LK_REPORT_WORD.densityMaxAbsError}u;
const REPORT_DENSITY_MAX_REL_ERROR: u32 =
  ${GPU_LK_REPORT_WORD.densityMaxRelError}u;
const REPORT_CONVERGENCE_MODE: u32 = ${GPU_LK_REPORT_WORD.convergenceMode}u;
const REPORT_MAX_CURRENT_STEP_ULP: u32 =
  ${GPU_LK_REPORT_WORD.maximumCurrentStepUlpDistance}u;
const REPORT_MAX_TWO_BACK_ULP: u32 =
  ${GPU_LK_REPORT_WORD.maximumTwoBackUlpDistance}u;
const REPORT_RAW_DRIFT: u32 = ${GPU_LK_REPORT_WORD.rawDrift}u;
const REPORT_RAW_MAX_INPUT: u32 =
  ${GPU_LK_REPORT_WORD.rawMaxAbsSweepInput}u;
const REPORT_RAW_EXCHANGE: u32 = ${GPU_LK_REPORT_WORD.rawSurfaceExchange}u;
const REPORT_RAW_MIN_EXCHANGE: u32 =
  ${GPU_LK_REPORT_WORD.rawMinLocalSurfaceExchange}u;
const REPORT_RAW_SHELL: u32 = ${GPU_LK_REPORT_WORD.rawShellInjection}u;
const REPORT_RAW_RESIDUAL_MAX: u32 =
  ${GPU_LK_REPORT_WORD.rawResidualMaximum}u;
const REPORT_COMPLETED_SWEEPS_AFTER_MUTATION: u32 =
  ${GPU_LK_REPORT_WORD.completedSweepsAfterMutation}u;
const REPORT_PREVIOUS_DIVERGENCE_STATUS: u32 =
  ${GPU_LK_REPORT_WORD.previousDivergenceStatus}u;
const REPORT_PREVIOUS_DIVERGENCE_RESIDUAL: u32 =
  ${GPU_LK_REPORT_WORD.previousDivergenceResidual}u;
const REPORT_PREVIOUS_DRIFT_BOUND_PASSED: u32 =
  ${GPU_LK_REPORT_WORD.previousDriftBoundPassed}u;
const REPORT_TRACE_BASE: u32 = ${GPU_LK_REPORT_WORD.traceBase}u;

const CONVERGENCE_INCOMPLETE: u32 = 0u;
const CONVERGENCE_FIXED_POINT: u32 = 1u;
const CONVERGENCE_BOUNDED_TWO_CYCLE: u32 = 2u;
const DIVERGENCE_UNAVAILABLE: u32 = 0u;
const DIVERGENCE_FINITE: u32 = 1u;
const DIVERGENCE_ZERO_EXCHANGE_UNCONVERGED: u32 = 2u;
const DIVERGENCE_NOT_APPLICABLE: u32 = 3u;

const F32_MIN_NORMAL: f32 = bitcast<f32>(0x00800000u);
const F32_MAX: f32 = bitcast<f32>(0x7f7fffffu);
const F32_EPSILON: f32 = 0.00000011920928955078125;

var<workgroup> reductionValues: array<f32, ${GPU_WORKGROUP_SIZE}>;
var<workgroup> reductionU32Values: array<u32, ${GPU_WORKGROUP_SIZE}>;

fn loadF32(words: ptr<storage, array<u32>, read_write>, index: u32) -> f32 {
  return bitcast<f32>((*words)[index]);
}

fn storeF32(
  words: ptr<storage, array<u32>, read_write>,
  index: u32,
  value: f32,
) {
  (*words)[index] = bitcast<u32>(value);
}

fn reportLoadF32(index: u32) -> f32 {
  return bitcast<f32>(atomicLoad(&report[index]));
}

fn reportStoreF32(index: u32, value: f32) {
  atomicStore(&report[index], bitcast<u32>(value));
}

fn finiteF32(value: f32) -> bool {
  return (bitcast<u32>(abs(value)) & 0x7f800000u) != 0x7f800000u;
}

fn isActiveCell(index: u32) -> bool {
  return storage0[index] == 0u && storage1[index] == 0u;
}

fn relaxHalted() -> bool {
  return
    atomicLoad(&report[REPORT_ERROR_FLAGS]) != 0u ||
    atomicLoad(&report[REPORT_CONVERGED]) != 0u;
}

fn gridIndex(invocation: vec3<u32>) -> u32 {
  return uniforms.baseCell + invocation.x;
}

fn outsideGrid(invocation: vec3<u32>) -> bool {
  return
    uniforms.baseCell >= uniforms.cellCount ||
    invocation.x >= uniforms.cellCount - uniforms.baseCell;
}

fn rotateLeft32(value: u32, shift: u32) -> u32 {
  return (value << shift) | (value >> (32u - shift));
}

fn mixCounterWord(value: u32) -> u32 {
  var mixed = value * 0xcc9e2d51u;
  mixed = rotateLeft32(mixed, 15u);
  return mixed * 0x1b873593u;
}

fn mixCounterHash(hash: u32, value: u32) -> u32 {
  var mixedHash = hash ^ mixCounterWord(value);
  mixedHash = rotateLeft32(mixedHash, 13u);
  return mixedHash * 5u + 0xe6546b64u;
}

fn hashCounter(seed: u32, cellIndex: u32, tick: u32, streamId: u32) -> u32 {
  var hash = seed;
  hash = mixCounterHash(hash, cellIndex);
  hash = mixCounterHash(hash, tick);
  hash = mixCounterHash(hash, streamId);
  hash = hash ^ 12u;
  hash = hash ^ (hash >> 16u);
  hash = hash * 0x85ebca6bu;
  hash = hash ^ (hash >> 13u);
  hash = hash * 0xc2b2ae35u;
  return hash ^ (hash >> 16u);
}

fn rawNeighborCounts(index: u32) -> vec2<u32> {
  let k = index / uniforms.plane;
  let remainder = index - k * uniforms.plane;
  let j = remainder / uniforms.dims.x;
  let i = remainder - j * uniforms.dims.x;
  var nT = 0u;
  var nZ = 0u;
  if (i + 1u < uniforms.dims.x && storage0[index + 1u] != 0u) {
    nT += 1u;
  }
  if (i > 0u && storage0[index - 1u] != 0u) {
    nT += 1u;
  }
  if (
    j + 1u < uniforms.dims.y &&
    storage0[index + uniforms.dims.x] != 0u
  ) {
    nT += 1u;
  }
  if (j > 0u && storage0[index - uniforms.dims.x] != 0u) {
    nT += 1u;
  }
  if (
    i + 1u < uniforms.dims.x &&
    j > 0u &&
    storage0[index + 1u - uniforms.dims.x] != 0u
  ) {
    nT += 1u;
  }
  if (
    i > 0u &&
    j + 1u < uniforms.dims.y &&
    storage0[index - 1u + uniforms.dims.x] != 0u
  ) {
    nT += 1u;
  }
  if (k + 1u < uniforms.dims.z && storage0[index + uniforms.plane] != 0u) {
    nZ += 1u;
  }
  if (k > 0u && storage0[index - uniforms.plane] != 0u) {
    nZ += 1u;
  }
  return vec2<u32>(nT, nZ);
}

fn roundU32DivideBySeven(numerator: u32) -> u32 {
  let quotient = numerator / 7u;
  let remainder = numerator - quotient * 7u;
  return quotient + select(0u, 1u, remainder >= 4u);
}

// D3D compilers may lower f32 division by a constant to a reciprocal multiply.
// The WP4 shadow instead requires the correctly rounded binary32 quotient.
fn divideF32BySeven(value: f32) -> f32 {
  let bits = bitcast<u32>(value);
  let sign = bits & 0x80000000u;
  let exponent = (bits >> 23u) & 0xffu;
  let fraction = bits & 0x007fffffu;
  if (exponent == 0xffu || (exponent == 0u && fraction == 0u)) {
    return value / 7.0;
  }
  var significand = fraction;
  if (exponent != 0u) {
    significand |= 0x00800000u;
  }
  if (exponent == 0u) {
    return bitcast<f32>(sign | roundU32DivideBySeven(significand));
  }
  if (exponent <= 3u) {
    let numerator = significand << (exponent - 1u);
    return bitcast<f32>(sign | roundU32DivideBySeven(numerator));
  }
  let shift = select(2u, 3u, significand < 0x00e00000u);
  var rounded = roundU32DivideBySeven(significand << shift);
  var outputExponent = exponent - shift;
  if (rounded == 0x01000000u) {
    rounded = 0x00800000u;
    outputExponent += 1u;
  }
  return bitcast<f32>(
    sign |
    (outputExponent << 23u) |
    (rounded - 0x00800000u),
  );
}

@compute @workgroup_size(${GPU_WORKGROUP_SIZE})
fn diffuseInPlanePairs(@builtin(global_invocation_id) invocation: vec3<u32>) {
  if (outsideGrid(invocation) || relaxHalted()) {
    return;
  }
  let index = gridIndex(invocation);
  if (!isActiveCell(index)) {
    storeF32(&storage3, index, 0.0);
    storeF32(&storage4, index, 0.0);
    storeF32(&storage5, index, 0.0);
    return;
  }
  let k = index / uniforms.plane;
  let remainder = index - k * uniforms.plane;
  let j = remainder / uniforms.dims.x;
  let i = remainder - j * uniforms.dims.x;
  let own = loadF32(&storage2, index);
  var east = own;
  var west = own;
  var northEast = own;
  var southWest = own;
  var southEast = own;
  var northWest = own;
  if (
    i + 1u < uniforms.dims.x &&
    storage0[index + 1u] == 0u &&
    storage1[index + 1u] == 0u
  ) {
    east = loadF32(&storage2, index + 1u);
  }
  if (
    i > 0u &&
    storage0[index - 1u] == 0u &&
    storage1[index - 1u] == 0u
  ) {
    west = loadF32(&storage2, index - 1u);
  }
  if (
    j + 1u < uniforms.dims.y &&
    storage0[index + uniforms.dims.x] == 0u &&
    storage1[index + uniforms.dims.x] == 0u
  ) {
    northEast = loadF32(&storage2, index + uniforms.dims.x);
  }
  if (
    j > 0u &&
    storage0[index - uniforms.dims.x] == 0u &&
    storage1[index - uniforms.dims.x] == 0u
  ) {
    southWest = loadF32(&storage2, index - uniforms.dims.x);
  }
  if (
    i + 1u < uniforms.dims.x &&
    j > 0u &&
    storage0[index + 1u - uniforms.dims.x] == 0u &&
    storage1[index + 1u - uniforms.dims.x] == 0u
  ) {
    southEast = loadF32(&storage2, index + 1u - uniforms.dims.x);
  }
  if (
    i > 0u &&
    j + 1u < uniforms.dims.y &&
    storage0[index - 1u + uniforms.dims.x] == 0u &&
    storage1[index - 1u + uniforms.dims.x] == 0u
  ) {
    northWest = loadF32(&storage2, index - 1u + uniforms.dims.x);
  }
  let pair1 = east + west;
  let pair2 = northEast + southWest;
  let pair3 = southEast + northWest;
  var low: f32;
  var middle: f32;
  var high: f32;
  if (pair1 <= pair2) {
    if (pair2 <= pair3) {
      low = pair1;
      middle = pair2;
      high = pair3;
    } else if (pair1 <= pair3) {
      low = pair1;
      middle = pair3;
      high = pair2;
    } else {
      low = pair3;
      middle = pair1;
      high = pair2;
    }
  } else if (pair1 <= pair3) {
    low = pair2;
    middle = pair1;
    high = pair3;
  } else if (pair2 <= pair3) {
    low = pair2;
    middle = pair3;
    high = pair1;
  } else {
    low = pair3;
    middle = pair2;
    high = pair1;
  }
  storeF32(&storage3, index, low);
  storeF32(&storage4, index, middle);
  storeF32(&storage5, index, high);
}

@compute @workgroup_size(${GPU_WORKGROUP_SIZE})
fn diffuseInPlaneAddLow(@builtin(global_invocation_id) invocation: vec3<u32>) {
  if (outsideGrid(invocation) || relaxHalted()) {
    return;
  }
  let index = gridIndex(invocation);
  if (!isActiveCell(index)) {
    storeF32(&storage3, index, 0.0);
    return;
  }
  storeF32(
    &storage3,
    index,
    loadF32(&storage2, index) + loadF32(&storage3, index),
  );
}

@compute @workgroup_size(${GPU_WORKGROUP_SIZE})
fn diffuseInPlaneAccumulate(@builtin(global_invocation_id) invocation: vec3<u32>) {
  if (outsideGrid(invocation) || relaxHalted()) {
    return;
  }
  let index = gridIndex(invocation);
  if (!isActiveCell(index)) {
    storeF32(&storage2, index, 0.0);
    return;
  }
  storeF32(
    &storage2,
    index,
    loadF32(&storage2, index) + loadF32(&storage3, index),
  );
}

@compute @workgroup_size(${GPU_WORKGROUP_SIZE})
fn diffuseInPlaneDivide(@builtin(global_invocation_id) invocation: vec3<u32>) {
  if (outsideGrid(invocation) || relaxHalted()) {
    return;
  }
  let index = gridIndex(invocation);
  if (!isActiveCell(index)) {
    storeF32(&storage2, index, 0.0);
    return;
  }
  storeF32(&storage2, index, divideF32BySeven(loadF32(&storage2, index)));
}

@compute @workgroup_size(${GPU_WORKGROUP_SIZE})
fn diffuseVerticalNeighborSum(@builtin(global_invocation_id) invocation: vec3<u32>) {
  if (outsideGrid(invocation) || relaxHalted()) {
    return;
  }
  let index = gridIndex(invocation);
  if (!isActiveCell(index)) {
    storeF32(&storage4, index, 0.0);
    storeF32(&storage5, index, 0.0);
    return;
  }
  let k = index / uniforms.plane;
  let own = loadF32(&storage2, index);
  var up = own;
  var down = own;
  if (
    k + 1u < uniforms.dims.z &&
    storage0[index + uniforms.plane] == 0u &&
    storage1[index + uniforms.plane] == 0u
  ) {
    up = loadF32(&storage2, index + uniforms.plane);
  }
  if (
    k > 0u &&
    storage0[index - uniforms.plane] == 0u &&
    storage1[index - uniforms.plane] == 0u
  ) {
    down = loadF32(&storage2, index - uniforms.plane);
  }
  storeF32(&storage4, index, up + down);
  storeF32(&storage5, index, abs(loadF32(&storage3, index)));
}

@compute @workgroup_size(${GPU_WORKGROUP_SIZE})
fn diffuseVerticalProducts(@builtin(global_invocation_id) invocation: vec3<u32>) {
  if (outsideGrid(invocation) || relaxHalted()) {
    return;
  }
  let index = gridIndex(invocation);
  if (!isActiveCell(index)) {
    storeF32(&storage3, index, 0.0);
    storeF32(&storage4, index, 0.0);
    return;
  }
  let neighborSum = loadF32(&storage3, index);
  storeF32(
    &storage3,
    index,
    0.21428571641445159912109375 * neighborSum,
  );
  storeF32(
    &storage4,
    index,
    0.571428596973419189453125 * loadF32(&storage2, index),
  );
}

@compute @workgroup_size(${GPU_WORKGROUP_SIZE})
fn diffuseVerticalCombine(@builtin(global_invocation_id) invocation: vec3<u32>) {
  if (outsideGrid(invocation) || relaxHalted()) {
    return;
  }
  let index = gridIndex(invocation);
  if (!isActiveCell(index)) {
    storeF32(&storage2, index, 0.0);
    return;
  }
  let candidate =
    loadF32(&storage2, index) + loadF32(&storage3, index);
  storeF32(&storage2, index, candidate);
}

@compute @workgroup_size(${GPU_WORKGROUP_SIZE})
fn diffuseVerticalMetrics(@builtin(global_invocation_id) invocation: vec3<u32>) {
  if (outsideGrid(invocation) || relaxHalted()) {
    return;
  }
  let index = gridIndex(invocation);
  if (!isActiveCell(index)) {
    storeF32(&storage4, index, 0.0);
    return;
  }
  storeF32(
    &storage4,
    index,
    loadF32(&storage2, index) - loadF32(&storage3, index),
  );
}

fn opposingSupersaturation(index: u32) -> f32 {
  let k = index / uniforms.plane;
  let remainder = index - k * uniforms.plane;
  let j = remainder / uniforms.dims.x;
  let i = remainder - j * uniforms.dims.x;
  var sum = 0.0;
  var count = 0u;
  if (
    i + 1u < uniforms.dims.x &&
    i > 0u &&
    storage0[index + 1u] != 0u &&
    storage0[index - 1u] == 0u &&
    storage1[index - 1u] == 0u
  ) {
    sum += loadF32(&storage3, index - 1u);
    count += 1u;
  }
  if (
    i > 0u &&
    i + 1u < uniforms.dims.x &&
    storage0[index - 1u] != 0u &&
    storage0[index + 1u] == 0u &&
    storage1[index + 1u] == 0u
  ) {
    sum += loadF32(&storage3, index + 1u);
    count += 1u;
  }
  if (
    j + 1u < uniforms.dims.y &&
    j > 0u &&
    storage0[index + uniforms.dims.x] != 0u &&
    storage0[index - uniforms.dims.x] == 0u &&
    storage1[index - uniforms.dims.x] == 0u
  ) {
    sum += loadF32(&storage3, index - uniforms.dims.x);
    count += 1u;
  }
  if (
    j > 0u &&
    j + 1u < uniforms.dims.y &&
    storage0[index - uniforms.dims.x] != 0u &&
    storage0[index + uniforms.dims.x] == 0u &&
    storage1[index + uniforms.dims.x] == 0u
  ) {
    sum += loadF32(&storage3, index + uniforms.dims.x);
    count += 1u;
  }
  if (
    i + 1u < uniforms.dims.x &&
    j > 0u &&
    i > 0u &&
    j + 1u < uniforms.dims.y &&
    storage0[index + 1u - uniforms.dims.x] != 0u &&
    storage0[index - 1u + uniforms.dims.x] == 0u &&
    storage1[index - 1u + uniforms.dims.x] == 0u
  ) {
    sum += loadF32(&storage3, index - 1u + uniforms.dims.x);
    count += 1u;
  }
  if (
    i > 0u &&
    j + 1u < uniforms.dims.y &&
    i + 1u < uniforms.dims.x &&
    j > 0u &&
    storage0[index - 1u + uniforms.dims.x] != 0u &&
    storage0[index + 1u - uniforms.dims.x] == 0u &&
    storage1[index + 1u - uniforms.dims.x] == 0u
  ) {
    sum += loadF32(&storage3, index + 1u - uniforms.dims.x);
    count += 1u;
  }
  if (
    k + 1u < uniforms.dims.z &&
    k > 0u &&
    storage0[index + uniforms.plane] != 0u &&
    storage0[index - uniforms.plane] == 0u &&
    storage1[index - uniforms.plane] == 0u
  ) {
    sum += loadF32(&storage3, index - uniforms.plane);
    count += 1u;
  }
  if (
    k > 0u &&
    k + 1u < uniforms.dims.z &&
    storage0[index - uniforms.plane] != 0u &&
    storage0[index + uniforms.plane] == 0u &&
    storage1[index + uniforms.plane] == 0u
  ) {
    sum += loadF32(&storage3, index + uniforms.plane);
    count += 1u;
  }
  if (count == 0u) {
    return 0.0;
  }
  return sum / f32(count);
}

fn attachmentCoefficient(index: u32, counts: vec2<u32>, sigmaSurface: f32) -> f32 {
  if (sigmaSurface <= 0.0 || (counts.x == 1u && counts.y == 0u)) {
    return 0.0;
  }
  var coefficient = 1.0;
  if (counts.x == 0u && counts.y > 0u) {
    coefficient =
      uniforms.prefactorBasal * exp(-uniforms.sigma0Basal / sigmaSurface);
  } else if (counts.x == 2u && counts.y == 0u) {
    coefficient =
      uniforms.prefactorPrism * exp(-uniforms.sigma0Prism / sigmaSurface);
  }
  if (uniforms.noiseEpsilon > 0.0) {
    let bit = hashCounter(uniforms.rngSeed, index, uniforms.tick, 2u) & 1u;
    coefficient *= 1.0 - uniforms.noiseEpsilon * f32(bit);
  }
  return coefficient;
}

@compute @workgroup_size(${GPU_WORKGROUP_SIZE})
fn solveBoundary(@builtin(global_invocation_id) invocation: vec3<u32>) {
  if (outsideGrid(invocation) || relaxHalted()) {
    return;
  }
  let index = gridIndex(invocation);
  if ((storage2[index] & TOPOLOGY_BOUNDARY) == 0u) {
    storeF32(&storage4, index, 0.0);
    storeF32(&storage5, index, 0.0);
    storeF32(&storage6, index, 0.0);
    return;
  }
  let sigmaOpp = opposingSupersaturation(index);
  storeF32(&storage6, index, sigmaOpp);
  if (!finiteF32(sigmaOpp)) {
    atomicOr(&report[REPORT_ERROR_FLAGS], ERROR_NONFINITE_BOUNDARY);
    storeF32(&storage4, index, 0.0);
    storeF32(&storage5, index, 0.0);
    return;
  }
  if (sigmaOpp <= 0.0) {
    storeF32(&storage4, index, 0.0);
    storeF32(&storage5, index, sigmaOpp);
    return;
  }
  let counts = rawNeighborCounts(index);
  var iterate = sigmaOpp;
  for (var iteration = 0u; iteration < 60u; iteration += 1u) {
    let coefficient = attachmentCoefficient(index, counts, iterate);
    let next = sigmaOpp / (1.0 + coefficient * uniforms.dxOverX0);
    iterate = 0.5 * (iterate + next);
  }
  let coefficient = attachmentCoefficient(index, counts, iterate);
  let solved = sigmaOpp / (1.0 + coefficient * uniforms.dxOverX0);
  let fixedPointError = abs(solved - iterate);
  let fixedPointLimit =
    8.0 * F32_EPSILON * max(abs(sigmaOpp), F32_MIN_NORMAL);
  if (
    !finiteF32(coefficient) ||
    !finiteF32(solved) ||
    coefficient < 0.0 ||
    coefficient > 1.0
  ) {
    atomicOr(&report[REPORT_ERROR_FLAGS], ERROR_NONFINITE_BOUNDARY);
  }
  if (fixedPointError > fixedPointLimit) {
    atomicOr(&report[REPORT_ERROR_FLAGS], ERROR_FIXED_POINT);
  }
  storeF32(&storage4, index, coefficient);
  storeF32(&storage5, index, solved);
}

@compute @workgroup_size(${GPU_WORKGROUP_SIZE})
fn measureBoundaryExchange(@builtin(global_invocation_id) invocation: vec3<u32>) {
  if (outsideGrid(invocation) || relaxHalted()) {
    return;
  }
  let index = gridIndex(invocation);
  if ((storage0[index] & TOPOLOGY_BOUNDARY) == 0u) {
    storeF32(&storage3, index, 0.0);
    storeF32(&storage4, index, F32_MAX);
    return;
  }
  let exchange =
    loadF32(&storage1, index) - loadF32(&storage2, index);
  if (!finiteF32(exchange)) {
    atomicOr(&report[REPORT_ERROR_FLAGS], ERROR_NONFINITE_BOUNDARY);
  }
  storeF32(&storage3, index, exchange);
  storeF32(&storage4, index, exchange);
}

@compute @workgroup_size(${GPU_WORKGROUP_SIZE})
fn publishBoundaryValues(@builtin(global_invocation_id) invocation: vec3<u32>) {
  if (outsideGrid(invocation) || relaxHalted()) {
    return;
  }
  let index = gridIndex(invocation);
  if ((storage0[index] & TOPOLOGY_BOUNDARY) != 0u) {
    storage1[index] = storage2[index];
  }
}

@compute @workgroup_size(${GPU_WORKGROUP_SIZE})
fn clampDirichletShell(@builtin(global_invocation_id) invocation: vec3<u32>) {
  if (outsideGrid(invocation) || relaxHalted()) {
    return;
  }
  let index = gridIndex(invocation);
  var delta = 0.0;
  if (
    (uniforms.flags & ${GPU_LK_FLAG_DIRICHLET}u) != 0u &&
    storage0[index] == 0u &&
    storage1[index] == 0u &&
    (storage2[index] & TOPOLOGY_FAR_FIELD) != 0u
  ) {
    delta = uniforms.sigmaInfinity - loadF32(&storage3, index);
    storeF32(&storage3, index, uniforms.sigmaInfinity);
  }
  storeF32(&storage4, index, delta);
}

@compute @workgroup_size(${GPU_WORKGROUP_SIZE})
fn measureResidual(@builtin(global_invocation_id) invocation: vec3<u32>) {
  if (outsideGrid(invocation) || relaxHalted()) {
    return;
  }
  let index = gridIndex(invocation);
  var change = 0.0;
  if (storage0[index] == 0u && storage1[index] == 0u) {
    change = abs(loadF32(&storage3, index) - loadF32(&storage2, index));
  }
  storeF32(&storage4, index, change);
}

@compute @workgroup_size(${GPU_WORKGROUP_SIZE})
fn snapshotCycleReference(@builtin(global_invocation_id) invocation: vec3<u32>) {
  if (outsideGrid(invocation) || relaxHalted()) {
    return;
  }
  let index = gridIndex(invocation);
  storage1[index] = storage0[index];
}

fn orderedF32Key(value: f32) -> u32 {
  let bits = bitcast<u32>(value);
  return select(~bits, bits | 0x80000000u, (bits & 0x80000000u) == 0u);
}

fn orderedF32Distance(left: f32, right: f32) -> u32 {
  let leftKey = orderedF32Key(left);
  let rightKey = orderedF32Key(right);
  return max(leftKey, rightKey) - min(leftKey, rightKey);
}

@compute @workgroup_size(${GPU_WORKGROUP_SIZE})
fn measureCycleUlp(@builtin(global_invocation_id) invocation: vec3<u32>) {
  if (outsideGrid(invocation) || relaxHalted()) {
    return;
  }
  let index = gridIndex(invocation);
  var currentDistance = 0u;
  var twoBackDistance = 0u;
  if (storage0[index] == 0u && storage1[index] == 0u) {
    let current = loadF32(&storage2, index);
    let destination = loadF32(&storage3, index);
    let twoBack = loadF32(&storage4, index);
    if (!finiteF32(current) || !finiteF32(destination) || !finiteF32(twoBack)) {
      atomicOr(&report[REPORT_ERROR_FLAGS], ERROR_NONFINITE_RELAXATION);
      currentDistance = 0xffffffffu;
      twoBackDistance = 0xffffffffu;
    } else {
      currentDistance = orderedF32Distance(current, destination);
      twoBackDistance = orderedF32Distance(twoBack, destination);
    }
  }
  storage5[index] = currentDistance;
  storage6[index] = twoBackDistance;
}

fn reduceValue(
  invocation: vec3<u32>,
  localIndex: u32,
  mode: u32,
) {
  let halted = relaxHalted();
  var value = 0.0;
  if (mode == 1u) {
    value = -F32_MAX;
  } else if (mode == 2u) {
    value = F32_MAX;
  }
  if (!halted && invocation.x < uniforms.inputCount) {
    value = loadF32(&storage0, uniforms.inputBase + invocation.x);
  }
  reductionValues[localIndex] = value;
  workgroupBarrier();
  var stride = ${GPU_WORKGROUP_SIZE / 2}u;
  loop {
    if (localIndex < stride) {
      let right = reductionValues[localIndex + stride];
      if (mode == 1u) {
        reductionValues[localIndex] = max(reductionValues[localIndex], right);
      } else if (mode == 2u) {
        reductionValues[localIndex] = min(reductionValues[localIndex], right);
      } else {
        reductionValues[localIndex] = reductionValues[localIndex] + right;
      }
    }
    workgroupBarrier();
    if (stride == 1u) {
      break;
    }
    stride = stride / 2u;
  }
  if (localIndex == 0u && !halted) {
    let outputIndex =
      uniforms.outputBase + invocation.x / ${GPU_WORKGROUP_SIZE}u;
    storeF32(&storage1, outputIndex, reductionValues[0]);
  }
}

fn reduceMaximumU32(
  invocation: vec3<u32>,
  localIndex: u32,
) {
  let halted = relaxHalted();
  var value = 0u;
  if (!halted && invocation.x < uniforms.inputCount) {
    value = storage0[uniforms.inputBase + invocation.x];
  }
  reductionU32Values[localIndex] = value;
  workgroupBarrier();
  var stride = ${GPU_WORKGROUP_SIZE / 2}u;
  loop {
    if (localIndex < stride) {
      reductionU32Values[localIndex] = max(
        reductionU32Values[localIndex],
        reductionU32Values[localIndex + stride],
      );
    }
    workgroupBarrier();
    if (stride == 1u) {
      break;
    }
    stride = stride / 2u;
  }
  if (localIndex == 0u && !halted) {
    let outputIndex =
      uniforms.outputBase + invocation.x / ${GPU_WORKGROUP_SIZE}u;
    storage1[outputIndex] = reductionU32Values[0];
  }
}

@compute @workgroup_size(${GPU_WORKGROUP_SIZE})
fn reduceSum(
  @builtin(global_invocation_id) invocation: vec3<u32>,
  @builtin(local_invocation_index) localIndex: u32,
) {
  reduceValue(invocation, localIndex, 0u);
}

@compute @workgroup_size(${GPU_WORKGROUP_SIZE})
fn reduceMax(
  @builtin(global_invocation_id) invocation: vec3<u32>,
  @builtin(local_invocation_index) localIndex: u32,
) {
  reduceValue(invocation, localIndex, 1u);
}

@compute @workgroup_size(${GPU_WORKGROUP_SIZE})
fn reduceMin(
  @builtin(global_invocation_id) invocation: vec3<u32>,
  @builtin(local_invocation_index) localIndex: u32,
) {
  reduceValue(invocation, localIndex, 2u);
}

@compute @workgroup_size(${GPU_WORKGROUP_SIZE})
fn reduceMaxU32(
  @builtin(global_invocation_id) invocation: vec3<u32>,
  @builtin(local_invocation_index) localIndex: u32,
) {
  reduceMaximumU32(invocation, localIndex);
}

@compute @workgroup_size(1)
fn captureScalar(@builtin(global_invocation_id) invocation: vec3<u32>) {
  if (invocation.x != 0u || relaxHalted()) {
    return;
  }
  atomicStore(&report[uniforms.captureSlot], storage0[0]);
}

@compute @workgroup_size(1)
fn decideConvergence(@builtin(global_invocation_id) invocation: vec3<u32>) {
  if (
    invocation.x != 0u ||
    atomicLoad(&report[REPORT_ERROR_FLAGS]) != 0u ||
    atomicLoad(&report[REPORT_CONVERGED]) != 0u
  ) {
    return;
  }
  let drift = reportLoadF32(REPORT_RAW_DRIFT);
  let maxInput = reportLoadF32(REPORT_RAW_MAX_INPUT);
  let exchange = reportLoadF32(REPORT_RAW_EXCHANGE);
  var minimumExchange = reportLoadF32(REPORT_RAW_MIN_EXCHANGE);
  let shell = reportLoadF32(REPORT_RAW_SHELL);
  let residualMaximum = reportLoadF32(REPORT_RAW_RESIDUAL_MAX);
  if (atomicLoad(&report[REPORT_BOUNDARY_COUNT]) == 0u) {
    minimumExchange = 0.0;
  }
  let residual = residualMaximum / uniforms.sigmaInfinity;
  var divergence = 0.0;
  var divergenceSentinel = false;
  if ((uniforms.flags & ${GPU_LK_FLAG_DIRICHLET}u) != 0u) {
    let corrected = (shell + drift) - exchange;
    if (exchange == 0.0) {
      if (corrected == 0.0) {
        divergence = 0.0;
      } else {
        divergenceSentinel = true;
      }
    } else {
      divergence = abs(corrected) / abs(exchange);
    }
  }
  if (
    !finiteF32(drift) ||
    !finiteF32(maxInput) ||
    !finiteF32(exchange) ||
    !finiteF32(minimumExchange) ||
    !finiteF32(shell) ||
    !finiteF32(residual) ||
    (
      (uniforms.flags & ${GPU_LK_FLAG_DIRICHLET}u) != 0u &&
      exchange != 0.0 &&
      !finiteF32(divergence)
    )
  ) {
    atomicOr(&report[REPORT_ERROR_FLAGS], ERROR_NONFINITE_RELAXATION);
    return;
  }
  reportStoreF32(REPORT_RESIDUAL, residual);
  if (divergenceSentinel) {
    atomicStore(&report[REPORT_DIVERGENCE], 0x7f800000u);
  } else {
    reportStoreF32(REPORT_DIVERGENCE, divergence);
  }
  reportStoreF32(REPORT_SHELL_INJECTION, shell);
  reportStoreF32(REPORT_SURFACE_EXCHANGE, exchange);
  reportStoreF32(REPORT_SMOOTHER_DRIFT, drift);
  reportStoreF32(REPORT_MIN_LOCAL_EXCHANGE, minimumExchange);
  reportStoreF32(REPORT_MAX_ABS_SWEEP_INPUT, maxInput);
  let traceOffset = REPORT_TRACE_BASE + uniforms.localSweep * 2u;
  reportStoreF32(traceOffset, drift);
  reportStoreF32(traceOffset + 1u, maxInput);
  atomicAdd(&report[REPORT_PERFORMED_SWEEPS], 1u);
  atomicStore(&report[REPORT_ACTIVE_OWNER], uniforms.ownerAfter);
  let divergenceSatisfied =
    (uniforms.flags & ${GPU_LK_FLAG_DIRICHLET}u) == 0u ||
    (!divergenceSentinel && divergence < uniforms.divTol);
  var currentDivergenceStatus = DIVERGENCE_FINITE;
  if ((uniforms.flags & ${GPU_LK_FLAG_DIRICHLET}u) == 0u) {
    currentDivergenceStatus = DIVERGENCE_NOT_APPLICABLE;
  } else if (divergenceSentinel) {
    currentDivergenceStatus = DIVERGENCE_ZERO_EXCHANGE_UNCONVERGED;
  }
  let completedSweepsAfterMutation = atomicAdd(
    &report[REPORT_COMPLETED_SWEEPS_AFTER_MUTATION],
    1u,
  ) + 1u;
  if (residual < uniforms.relaxTol && divergenceSatisfied) {
    atomicStore(&report[REPORT_CONVERGENCE_MODE], CONVERGENCE_FIXED_POINT);
    atomicStore(&report[REPORT_CONVERGED], 1u);
    return;
  }
  let previousDivergenceStatus = atomicLoad(
    &report[REPORT_PREVIOUS_DIVERGENCE_STATUS],
  );
  let previousDivergenceResidual = reportLoadF32(
    REPORT_PREVIOUS_DIVERGENCE_RESIDUAL,
  );
  let previousDivergenceSatisfied =
    (
      (uniforms.flags & ${GPU_LK_FLAG_DIRICHLET}u) == 0u &&
      previousDivergenceStatus == DIVERGENCE_NOT_APPLICABLE
    ) ||
    (
      (uniforms.flags & ${GPU_LK_FLAG_DIRICHLET}u) != 0u &&
      previousDivergenceStatus == DIVERGENCE_FINITE &&
      finiteF32(previousDivergenceResidual) &&
      previousDivergenceResidual >= 0.0 &&
      previousDivergenceResidual < uniforms.divTol
    );
  let boundedTwoCycle =
    completedSweepsAfterMutation >= 2u &&
    atomicLoad(&report[REPORT_MAX_CURRENT_STEP_ULP]) <= 1u &&
    atomicLoad(&report[REPORT_MAX_TWO_BACK_ULP]) == 0u &&
    divergenceSatisfied &&
    previousDivergenceSatisfied &&
    atomicLoad(&report[REPORT_PREVIOUS_DRIFT_BOUND_PASSED]) == 1u;
  if (boundedTwoCycle) {
    atomicStore(
      &report[REPORT_CONVERGENCE_MODE],
      CONVERGENCE_BOUNDED_TWO_CYCLE,
    );
    atomicStore(&report[REPORT_CONVERGED], 1u);
    return;
  }
  atomicStore(
    &report[REPORT_PREVIOUS_DIVERGENCE_STATUS],
    currentDivergenceStatus,
  );
  if (divergenceSentinel) {
    atomicStore(&report[REPORT_PREVIOUS_DIVERGENCE_RESIDUAL], 0x7f800000u);
  } else {
    reportStoreF32(REPORT_PREVIOUS_DIVERGENCE_RESIDUAL, divergence);
  }
}

@compute @workgroup_size(${GPU_WORKGROUP_SIZE})
fn stressNonlinearBoundary(@builtin(global_invocation_id) invocation: vec3<u32>) {
  if (outsideGrid(invocation)) {
    return;
  }
  let index = gridIndex(invocation);
  if (index >= uniforms.inputCount) {
    return;
  }
  let sigmaOpp = loadF32(&storage0, index);
  if (!finiteF32(sigmaOpp)) {
    atomicOr(&report[REPORT_ERROR_FLAGS], ERROR_NONFINITE_BOUNDARY);
    return;
  }
  if (sigmaOpp <= 0.0) {
    storeF32(&storage1, index, 0.0);
    storeF32(&storage2, index, sigmaOpp);
    return;
  }
  let prismCounts = vec2<u32>(2u, 0u);
  var iterate = sigmaOpp;
  for (var iteration = 0u; iteration < 60u; iteration += 1u) {
    let coefficient = attachmentCoefficient(index, prismCounts, iterate);
    let next = sigmaOpp / (1.0 + coefficient);
    iterate = 0.5 * (iterate + next);
  }
  let coefficient = attachmentCoefficient(index, prismCounts, iterate);
  let solved = sigmaOpp / (1.0 + coefficient);
  if (
    !finiteF32(coefficient) ||
    !finiteF32(solved) ||
    coefficient < 0.0 ||
    coefficient > 1.0
  ) {
    atomicOr(&report[REPORT_ERROR_FLAGS], ERROR_NONFINITE_BOUNDARY);
    return;
  }
  storeF32(&storage1, index, coefficient);
  storeF32(&storage2, index, solved);
}

@compute @workgroup_size(${GPU_WORKGROUP_SIZE})
fn computeSurfaceRate(@builtin(global_invocation_id) invocation: vec3<u32>) {
  if (outsideGrid(invocation)) {
    return;
  }
  let index = gridIndex(invocation);
  var rate = 0.0;
  if ((storage0[index] & TOPOLOGY_BOUNDARY) != 0u) {
    rate =
      loadF32(&storage1, index) *
      uniforms.vKinOverDx *
      loadF32(&storage2, index);
    if (!finiteF32(rate) || rate < 0.0) {
      atomicOr(&report[REPORT_ERROR_FLAGS], ERROR_INVALID_SURFACE);
      rate = 0.0;
    }
  }
  storeF32(&storage3, index, rate);
}

@compute @workgroup_size(1)
fn prepareSurface(@builtin(global_invocation_id) invocation: vec3<u32>) {
  if (invocation.x != 0u) {
    return;
  }
  let maxRate = loadF32(&storage0, 0u);
  if (!finiteF32(maxRate) || maxRate < 0.0) {
    atomicOr(&report[REPORT_ERROR_FLAGS], ERROR_INVALID_SURFACE);
    return;
  }
  var deltaTime = 0.0;
  if (maxRate > 0.0) {
    deltaTime = uniforms.cflFill / maxRate;
  }
  if (!finiteF32(deltaTime) || deltaTime < 0.0) {
    atomicOr(&report[REPORT_ERROR_FLAGS], ERROR_INVALID_SURFACE);
    return;
  }
  reportStoreF32(REPORT_MAX_RATE, maxRate);
  reportStoreF32(REPORT_DELTA_TIME, deltaTime);
}

fn surfaceDemand(index: u32) -> f32 {
  if ((storage0[index] & TOPOLOGY_BOUNDARY) == 0u) {
    return 0.0;
  }
  return loadF32(&storage1, index) * reportLoadF32(REPORT_DELTA_TIME);
}

@compute @workgroup_size(${GPU_WORKGROUP_SIZE})
fn writeSurfaceDemand(@builtin(global_invocation_id) invocation: vec3<u32>) {
  if (outsideGrid(invocation)) {
    return;
  }
  let index = gridIndex(invocation);
  let raw = surfaceDemand(index);
  if (!finiteF32(raw) || raw < 0.0) {
    atomicOr(&report[REPORT_ERROR_FLAGS], ERROR_INVALID_SURFACE);
  }
  storeF32(&storage3, index, raw);
}

@compute @workgroup_size(${GPU_WORKGROUP_SIZE})
fn writeSurfacePlaced(@builtin(global_invocation_id) invocation: vec3<u32>) {
  if (outsideGrid(invocation)) {
    return;
  }
  let index = gridIndex(invocation);
  let raw = surfaceDemand(index);
  let fill = loadF32(&storage2, index);
  let placed = min(raw, max(0.0, 1.0 - fill));
  if (!finiteF32(fill) || fill < 0.0 || fill > 1.0 || !finiteF32(placed)) {
    atomicOr(&report[REPORT_ERROR_FLAGS], ERROR_INVALID_SURFACE);
  }
  storeF32(&storage3, index, placed);
}

@compute @workgroup_size(${GPU_WORKGROUP_SIZE})
fn writeSurfaceClipped(@builtin(global_invocation_id) invocation: vec3<u32>) {
  if (outsideGrid(invocation)) {
    return;
  }
  let index = gridIndex(invocation);
  let raw = surfaceDemand(index);
  let fill = loadF32(&storage2, index);
  let placed = min(raw, max(0.0, 1.0 - fill));
  storeF32(&storage3, index, raw - placed);
}

@compute @workgroup_size(${GPU_WORKGROUP_SIZE})
fn writeSurfacePartition(@builtin(global_invocation_id) invocation: vec3<u32>) {
  if (outsideGrid(invocation)) {
    return;
  }
  let index = gridIndex(invocation);
  let raw = surfaceDemand(index);
  let fill = loadF32(&storage2, index);
  let placed = min(raw, max(0.0, 1.0 - fill));
  let clipped = raw - placed;
  let partitionError = (placed + clipped) - raw;
  let limit = 4.0 * F32_EPSILON * max(abs(raw), F32_MIN_NORMAL);
  if (!finiteF32(partitionError) || abs(partitionError) > limit) {
    atomicOr(&report[REPORT_ERROR_FLAGS], ERROR_PARTITION);
  }
  storeF32(&storage3, index, partitionError);
}

fn surfaceCounts(index: u32) -> vec2<u32> {
  let k = index / uniforms.plane;
  let remainder = index - k * uniforms.plane;
  let j = remainder / uniforms.dims.x;
  let i = remainder - j * uniforms.dims.x;
  var nT = 0u;
  var nZ = 0u;
  if (i + 1u < uniforms.dims.x && storage1[index + 1u] != 0u) {
    nT += 1u;
  }
  if (i > 0u && storage1[index - 1u] != 0u) {
    nT += 1u;
  }
  if (
    j + 1u < uniforms.dims.y &&
    storage1[index + uniforms.dims.x] != 0u
  ) {
    nT += 1u;
  }
  if (j > 0u && storage1[index - uniforms.dims.x] != 0u) {
    nT += 1u;
  }
  if (
    i + 1u < uniforms.dims.x &&
    j > 0u &&
    storage1[index + 1u - uniforms.dims.x] != 0u
  ) {
    nT += 1u;
  }
  if (
    i > 0u &&
    j + 1u < uniforms.dims.y &&
    storage1[index - 1u + uniforms.dims.x] != 0u
  ) {
    nT += 1u;
  }
  if (k + 1u < uniforms.dims.z && storage1[index + uniforms.plane] != 0u) {
    nZ += 1u;
  }
  if (k > 0u && storage1[index - uniforms.plane] != 0u) {
    nZ += 1u;
  }
  return vec2<u32>(nT, nZ);
}

@compute @workgroup_size(${GPU_WORKGROUP_SIZE})
fn writeHoleDeficit(@builtin(global_invocation_id) invocation: vec3<u32>) {
  if (outsideGrid(invocation)) {
    return;
  }
  let index = gridIndex(invocation);
  var deficit = 0.0;
  if ((storage0[index] & TOPOLOGY_BOUNDARY) != 0u) {
    let raw = loadF32(&storage2, index) * reportLoadF32(REPORT_DELTA_TIME);
    let fill = loadF32(&storage3, index);
    let placed = min(raw, max(0.0, 1.0 - fill));
    let afterKinetic = fill + placed;
    let counts = surfaceCounts(index);
    if (afterKinetic < 1.0 && counts.x >= 4u && counts.y >= 1u) {
      deficit = 1.0 - afterKinetic;
    }
  }
  storeF32(&storage4, index, deficit);
}

@compute @workgroup_size(${GPU_WORKGROUP_SIZE})
fn applySurfaceDecisions(@builtin(global_invocation_id) invocation: vec3<u32>) {
  if (outsideGrid(invocation)) {
    return;
  }
  let index = gridIndex(invocation);
  storage4[index] = 0u;
  if ((storage0[index] & TOPOLOGY_BOUNDARY) == 0u) {
    return;
  }
  let raw = loadF32(&storage2, index) * reportLoadF32(REPORT_DELTA_TIME);
  let fill = loadF32(&storage3, index);
  let placed = min(raw, max(0.0, 1.0 - fill));
  var updated = fill + placed;
  let counts = surfaceCounts(index);
  var topology = storage0[index] & ~TOPOLOGY_TRANSIENT_MASK;
  var packed =
    RENDER_BOUNDARY |
    (counts.x << RENDER_NT_SHIFT) |
    (counts.y << RENDER_NZ_SHIFT);
  if (updated >= 1.0) {
    updated = 1.0;
    topology |= TOPOLOGY_KINETIC_ATTACH;
    packed |= RENDER_ATTACH_DECISION;
  } else if (counts.x >= 4u && counts.y >= 1u) {
    updated = 1.0;
    topology |= TOPOLOGY_HOLE_ATTACH;
    packed |= RENDER_ATTACH_DECISION | RENDER_HOLE_FILL;
  }
  if (!finiteF32(updated) || updated < 0.0 || updated > 1.0) {
    atomicOr(&report[REPORT_ERROR_FLAGS], ERROR_INVALID_SURFACE);
    return;
  }
  storeF32(&storage3, index, updated);
  storage0[index] = topology;
  storage4[index] = packed;
}

@compute @workgroup_size(1)
fn validateSurfaceClosure(@builtin(global_invocation_id) invocation: vec3<u32>) {
  if (invocation.x != 0u) {
    return;
  }
  let demand = reportLoadF32(REPORT_DEMAND_TOTAL);
  let placed = reportLoadF32(REPORT_PLACED_TOTAL);
  let clipped = reportLoadF32(REPORT_CLIPPED_TOTAL);
  let partitionTotal = reportLoadF32(REPORT_PARTITION_TOTAL);
  let maxRaw = reportLoadF32(REPORT_MAX_RAW_DEMAND);
  let boundaryCount = atomicLoad(&report[REPORT_BOUNDARY_COUNT]);
  let closure = (placed + clipped) - demand;
  let limit =
    64.0 * f32(boundaryCount) * F32_EPSILON * max(maxRaw, F32_MIN_NORMAL);
  if (
    !finiteF32(demand) ||
    !finiteF32(placed) ||
    !finiteF32(clipped) ||
    !finiteF32(partitionTotal) ||
    !finiteF32(maxRaw) ||
    demand < 0.0 ||
    placed < 0.0 ||
    clipped < 0.0 ||
    abs(closure) > limit
  ) {
    atomicOr(&report[REPORT_ERROR_FLAGS], ERROR_PARTITION);
  }
  reportStoreF32(REPORT_MAX_KINETIC_INCREMENT, maxRaw);
}

fn attachOrdered(index: u32, attachmentPosition: ptr<function, u32>, hole: bool) {
  storage1[index] = 1u;
  storeF32(&storage2, index, 0.0);
  storage0[index] &= ~(TOPOLOGY_BOUNDARY | TOPOLOGY_TRANSIENT_MASK);
  storage5[*attachmentPosition] = index;
  *attachmentPosition += 1u;
  var packed = storage6[index] | RENDER_ATTACHED_NOW;
  if (hole) {
    packed |= RENDER_HOLE_FILL;
  }
  storage6[index] = packed;
  let k = index / uniforms.plane;
  let remainder = index - k * uniforms.plane;
  let j = remainder / uniforms.dims.x;
  let i = remainder - j * uniforms.dims.x;
  atomicMin(&report[REPORT_I_MIN], i);
  atomicMax(&report[REPORT_I_MAX], i);
  atomicMin(&report[REPORT_J_MIN], j);
  atomicMax(&report[REPORT_J_MAX], j);
  atomicMin(&report[REPORT_K_MIN], k);
  atomicMax(&report[REPORT_K_MAX], k);
}

@compute @workgroup_size(1)
fn applyAttachmentsOrdered(@builtin(global_invocation_id) invocation: vec3<u32>) {
  if (invocation.x != 0u) {
    return;
  }
  let oldCount = atomicLoad(&report[REPORT_OLD_BOUNDARY_COUNT]);
  if (oldCount > uniforms.cellCount) {
    atomicOr(&report[REPORT_ERROR_FLAGS], ERROR_TOPOLOGY);
    return;
  }
  var survivingCount = 0u;
  for (var position = 0u; position < oldCount; position += 1u) {
    let index = storage3[position];
    let topology = storage0[index];
    if ((topology & TOPOLOGY_TRANSIENT_MASK) == 0u) {
      storage4[survivingCount] = index;
      survivingCount += 1u;
    }
  }
  var attachmentPosition = 0u;
  for (var position = 0u; position < oldCount; position += 1u) {
    let index = storage3[position];
    if ((storage0[index] & TOPOLOGY_KINETIC_ATTACH) != 0u) {
      attachOrdered(index, &attachmentPosition, false);
    }
  }
  let kineticCount = attachmentPosition;
  for (var position = 0u; position < oldCount; position += 1u) {
    let index = storage3[position];
    if ((storage0[index] & TOPOLOGY_HOLE_ATTACH) != 0u) {
      attachOrdered(index, &attachmentPosition, true);
    }
  }
  atomicStore(&report[REPORT_ATTACHED_NOW], attachmentPosition);
  atomicStore(&report[REPORT_HOLE_FILL_NOW], attachmentPosition - kineticCount);
  atomicAdd(&report[REPORT_ATTACHED_TOTAL], attachmentPosition);
  atomicStore(&report[REPORT_BOUNDARY_COUNT], survivingCount);
}

fn appendEligible(index: u32, writePosition: ptr<function, u32>) {
  if (
    storage1[index] != 0u ||
    storage2[index] != 0u ||
    (storage0[index] & TOPOLOGY_BOUNDARY) != 0u
  ) {
    return;
  }
  if (*writePosition >= uniforms.cellCount) {
    atomicOr(&report[REPORT_ERROR_FLAGS], ERROR_TOPOLOGY);
    return;
  }
  storage0[index] |= TOPOLOGY_BOUNDARY;
  storage4[*writePosition] = index;
  *writePosition += 1u;
}

@compute @workgroup_size(1)
fn appendAttachmentNeighbors(@builtin(global_invocation_id) invocation: vec3<u32>) {
  if (invocation.x != 0u) {
    return;
  }
  var writePosition = atomicLoad(&report[REPORT_BOUNDARY_COUNT]);
  let attachmentCount = atomicLoad(&report[REPORT_ATTACHED_NOW]);
  for (var position = 0u; position < attachmentCount; position += 1u) {
    let index = storage3[position];
    let k = index / uniforms.plane;
    let remainder = index - k * uniforms.plane;
    let j = remainder / uniforms.dims.x;
    let i = remainder - j * uniforms.dims.x;
    if (i + 1u < uniforms.dims.x) {
      appendEligible(index + 1u, &writePosition);
    }
    if (i > 0u) {
      appendEligible(index - 1u, &writePosition);
    }
    if (j + 1u < uniforms.dims.y) {
      appendEligible(index + uniforms.dims.x, &writePosition);
    }
    if (j > 0u) {
      appendEligible(index - uniforms.dims.x, &writePosition);
    }
    if (i + 1u < uniforms.dims.x && j > 0u) {
      appendEligible(index + 1u - uniforms.dims.x, &writePosition);
    }
    if (i > 0u && j + 1u < uniforms.dims.y) {
      appendEligible(index - 1u + uniforms.dims.x, &writePosition);
    }
    if (k + 1u < uniforms.dims.z) {
      appendEligible(index + uniforms.plane, &writePosition);
    }
    if (k > 0u) {
      appendEligible(index - uniforms.plane, &writePosition);
    }
  }
  atomicStore(&report[REPORT_BOUNDARY_COUNT], writePosition);
}

fn publishCounts(index: u32) -> vec2<u32> {
  let k = index / uniforms.plane;
  let remainder = index - k * uniforms.plane;
  let j = remainder / uniforms.dims.x;
  let i = remainder - j * uniforms.dims.x;
  var nT = 0u;
  var nZ = 0u;
  if (i + 1u < uniforms.dims.x && storage1[index + 1u] != 0u) {
    nT += 1u;
  }
  if (i > 0u && storage1[index - 1u] != 0u) {
    nT += 1u;
  }
  if (
    j + 1u < uniforms.dims.y &&
    storage1[index + uniforms.dims.x] != 0u
  ) {
    nT += 1u;
  }
  if (j > 0u && storage1[index - uniforms.dims.x] != 0u) {
    nT += 1u;
  }
  if (
    i + 1u < uniforms.dims.x &&
    j > 0u &&
    storage1[index + 1u - uniforms.dims.x] != 0u
  ) {
    nT += 1u;
  }
  if (
    i > 0u &&
    j + 1u < uniforms.dims.y &&
    storage1[index - 1u + uniforms.dims.x] != 0u
  ) {
    nT += 1u;
  }
  if (k + 1u < uniforms.dims.z && storage1[index + uniforms.plane] != 0u) {
    nZ += 1u;
  }
  if (k > 0u && storage1[index - uniforms.plane] != 0u) {
    nZ += 1u;
  }
  return vec2<u32>(nT, nZ);
}

@compute @workgroup_size(${GPU_WORKGROUP_SIZE})
fn publishTopology(@builtin(global_invocation_id) invocation: vec3<u32>) {
  if (outsideGrid(invocation)) {
    return;
  }
  let index = gridIndex(invocation);
  let boundaryCount = atomicLoad(&report[REPORT_BOUNDARY_COUNT]);
  if (index < boundaryCount) {
    storage4[index] = storage3[index];
  } else {
    storage4[index] = 0u;
  }
  let counts = publishCounts(index);
  let retainedDecisionBits =
    storage5[index] &
    (RENDER_ATTACH_DECISION | RENDER_HOLE_FILL | RENDER_ATTACHED_NOW);
  if (storage1[index] != 0u) {
    storage5[index] =
      retainedDecisionBits |
      (counts.x << RENDER_NT_SHIFT) |
      (counts.y << RENDER_NZ_SHIFT);
  } else if ((storage0[index] & TOPOLOGY_BOUNDARY) != 0u) {
    storage5[index] =
      RENDER_BOUNDARY |
      (counts.x << RENDER_NT_SHIFT) |
      (counts.y << RENDER_NZ_SHIFT);
  } else {
    storage5[index] = 0u;
  }
}

@compute @workgroup_size(${GPU_WORKGROUP_SIZE})
fn preserveAttachmentEvidence(@builtin(global_invocation_id) invocation: vec3<u32>) {
  if (outsideGrid(invocation)) {
    return;
  }
  let position = gridIndex(invocation);
  let attachmentCount = atomicLoad(&report[REPORT_ATTACHED_NOW]);
  let boundaryCount = atomicLoad(&report[REPORT_BOUNDARY_COUNT]);
  if (boundaryCount + attachmentCount > uniforms.cellCount) {
    atomicOr(&report[REPORT_ERROR_FLAGS], ERROR_TOPOLOGY);
    return;
  }
  if (position < attachmentCount) {
    storage0[uniforms.cellCount - attachmentCount + position] =
      storage1[position];
  }
}

@compute @workgroup_size(${GPU_WORKGROUP_SIZE})
fn transformTimeline(@builtin(global_invocation_id) invocation: vec3<u32>) {
  if (outsideGrid(invocation)) {
    return;
  }
  let index = gridIndex(invocation);
  storeF32(&storage4, index, 0.0);
  storeF32(&storage5, index, 0.0);
  storeF32(&storage6, index, 0.0);
  if (storage0[index] != 0u || storage1[index] != 0u) {
    return;
  }
  let sigmaOld = loadF32(&storage3, index);
  if (!finiteF32(sigmaOld) || sigmaOld < -1.0) {
    atomicOr(&report[REPORT_ERROR_FLAGS], ERROR_TIMELINE);
    return;
  }
  let densityBefore = (1.0 + sigmaOld) * uniforms.cSatOld;
  var sigmaNew = sigmaOld;
  if ((uniforms.flags & ${GPU_LK_FLAG_TEMPERATURE_CHANGED}u) != 0u) {
    sigmaNew = (1.0 + sigmaOld) * uniforms.densityRatio - 1.0;
    storeF32(&storage3, index, sigmaNew);
  }
  let densityAfter = (1.0 + sigmaNew) * uniforms.cSatNew;
  let absoluteError = abs(densityAfter - densityBefore);
  if (
    !finiteF32(sigmaNew) ||
    sigmaNew < -1.0 ||
    !finiteF32(densityBefore) ||
    !finiteF32(densityAfter) ||
    !finiteF32(absoluteError)
  ) {
    atomicOr(&report[REPORT_ERROR_FLAGS], ERROR_TIMELINE);
  }
  storeF32(&storage4, index, densityBefore);
  storeF32(&storage5, index, densityAfter);
  storeF32(&storage6, index, absoluteError);
  atomicAdd(&report[REPORT_TIMELINE_ACTIVE_COUNT], 1u);
  if ((storage2[index] & TOPOLOGY_FAR_FIELD) != 0u) {
    atomicAdd(&report[REPORT_TIMELINE_SHELL_COUNT], 1u);
  }
}

@compute @workgroup_size(${GPU_WORKGROUP_SIZE})
fn writeTimelineRelativeError(@builtin(global_invocation_id) invocation: vec3<u32>) {
  if (outsideGrid(invocation)) {
    return;
  }
  let index = gridIndex(invocation);
  let densityBefore = loadF32(&storage0, index);
  let absoluteError = loadF32(&storage1, index);
  var relativeError = 0.0;
  if (densityBefore != 0.0 || absoluteError != 0.0) {
    relativeError =
      absoluteError / max(abs(densityBefore), F32_MIN_NORMAL);
  }
  if (!finiteF32(relativeError)) {
    atomicOr(&report[REPORT_ERROR_FLAGS], ERROR_TIMELINE);
  }
  storeF32(&storage2, index, relativeError);
}

@compute @workgroup_size(${GPU_WORKGROUP_SIZE})
fn clearBoundaryCaches(@builtin(global_invocation_id) invocation: vec3<u32>) {
  if (outsideGrid(invocation)) {
    return;
  }
  let index = gridIndex(invocation);
  storage0[index] = 0u;
  storage1[index] = 0u;
  storage2[index] = 0u;
}
`;
