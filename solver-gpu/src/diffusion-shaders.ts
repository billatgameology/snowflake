import { GPU_WORKGROUP_SIZE } from "./submission.ts";

export const GPU_GG_DIFFUSION_FLAG_NOISE = 1;
export const GPU_GG_DIFFUSION_FLAG_DRIFT = 2;
export const GPU_GG_DIFFUSION_FLAG_DIRICHLET = 4;

/**
 * Production G-G diffusion shader. All entry points share one explicit bind-group layout:
 * uniforms, occupancy, wall, topology, source, two stage auxiliaries, and destination.
 * The host changes the buffer roles between ordered dispatches; no entry point updates in place.
 */
export const GPU_GG_DIFFUSION_WGSL = /* wgsl */ `
struct DiffusionUniforms {
  dims: vec3<u32>,
  cellCount: u32,
  plane: u32,
  baseCell: u32,
  generation: u32,
  rngSeed: u32,
  tick: u32,
  streamId: u32,
  flags: u32,
  reserved0: u32,
  phi: f32,
  rho: f32,
  noiseEpsilon: f32,
  reserved1: f32,
}

@group(0) @binding(0) var<uniform> uniforms: DiffusionUniforms;
@group(0) @binding(1) var<storage, read> occupancy: array<u32>;
@group(0) @binding(2) var<storage, read> wall: array<u32>;
@group(0) @binding(3) var<storage, read> topology: array<u32>;
@group(0) @binding(4) var<storage, read> source: array<f32>;
@group(0) @binding(5) var<storage, read_write> auxiliaryA: array<f32>;
@group(0) @binding(6) var<storage, read_write> auxiliaryB: array<f32>;
@group(0) @binding(7) var<storage, read_write> destination: array<f32>;

fn blocked(index: u32) -> bool {
  return occupancy[index] != 0u || wall[index] != 0u;
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

@compute @workgroup_size(${GPU_WORKGROUP_SIZE})
fn prepareNoise(@builtin(global_invocation_id) invocation: vec3<u32>) {
  if (
    uniforms.baseCell >= uniforms.cellCount ||
    invocation.x >= uniforms.cellCount - uniforms.baseCell
  ) {
    return;
  }
  let index = uniforms.baseCell + invocation.x;
  let xi = uniforms.noiseEpsilon * f32(
    hashCounter(uniforms.rngSeed, index, uniforms.tick, uniforms.streamId) & 1u
  );
  auxiliaryB[index] = xi;
  auxiliaryA[index] = xi;
}

@compute @workgroup_size(${GPU_WORKGROUP_SIZE})
fn applyNoise(@builtin(global_invocation_id) invocation: vec3<u32>) {
  if (
    uniforms.baseCell >= uniforms.cellCount ||
    invocation.x >= uniforms.cellCount - uniforms.baseCell
  ) {
    return;
  }
  let index = uniforms.baseCell + invocation.x;
  auxiliaryA[index] = fma(-auxiliaryB[index], source[index], source[index]);
}

@compute @workgroup_size(${GPU_WORKGROUP_SIZE})
fn diffuseInPlane(@builtin(global_invocation_id) invocation: vec3<u32>) {
  if (
    uniforms.baseCell >= uniforms.cellCount ||
    invocation.x >= uniforms.cellCount - uniforms.baseCell
  ) {
    return;
  }
  let index = uniforms.baseCell + invocation.x;
  if (blocked(index)) {
    auxiliaryA[index] = 0.0;
    return;
  }

  let k = index / uniforms.plane;
  let remainder = index - k * uniforms.plane;
  let j = remainder / uniforms.dims.x;
  let i = remainder - j * uniforms.dims.x;
  let own = source[index];

  var east = own;
  var west = own;
  var northEast = own;
  var southWest = own;
  var southEast = own;
  var northWest = own;
  if (i + 1u < uniforms.dims.x && !blocked(index + 1u)) {
    east = source[index + 1u];
  }
  if (i > 0u && !blocked(index - 1u)) {
    west = source[index - 1u];
  }
  if (j + 1u < uniforms.dims.y && !blocked(index + uniforms.dims.x)) {
    northEast = source[index + uniforms.dims.x];
  }
  if (j > 0u && !blocked(index - uniforms.dims.x)) {
    southWest = source[index - uniforms.dims.x];
  }
  if (
    i + 1u < uniforms.dims.x &&
    j > 0u &&
    !blocked(index + 1u - uniforms.dims.x)
  ) {
    southEast = source[index + 1u - uniforms.dims.x];
  }
  if (
    i > 0u &&
    j + 1u < uniforms.dims.y &&
    !blocked(index - 1u + uniforms.dims.x)
  ) {
    northWest = source[index - 1u + uniforms.dims.x];
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
  auxiliaryA[index] = (((own + low) + middle) + high) / 7.0;
}

@compute @workgroup_size(${GPU_WORKGROUP_SIZE})
fn diffuseVertical(@builtin(global_invocation_id) invocation: vec3<u32>) {
  if (
    uniforms.baseCell >= uniforms.cellCount ||
    invocation.x >= uniforms.cellCount - uniforms.baseCell
  ) {
    return;
  }
  let index = uniforms.baseCell + invocation.x;
  if (blocked(index)) {
    auxiliaryA[index] = 0.0;
    return;
  }

  let k = index / uniforms.plane;
  let own = source[index];
  var up = own;
  var down = own;
  if (k + 1u < uniforms.dims.z && !blocked(index + uniforms.plane)) {
    up = source[index + uniforms.plane];
  }
  if (k > 0u && !blocked(index - uniforms.plane)) {
    down = source[index - uniforms.plane];
  }
  let verticalPair = up + down;
  let centerTerm = (4.0 / 7.0) * own;
  auxiliaryA[index] = fma(3.0 / 14.0, verticalPair, centerTerm);
}

@compute @workgroup_size(${GPU_WORKGROUP_SIZE})
fn applyDrift(@builtin(global_invocation_id) invocation: vec3<u32>) {
  if (
    uniforms.baseCell >= uniforms.cellCount ||
    invocation.x >= uniforms.cellCount - uniforms.baseCell
  ) {
    return;
  }
  let index = uniforms.baseCell + invocation.x;
  if (blocked(index)) {
    auxiliaryA[index] = 0.0;
    return;
  }

  let k = index / uniforms.plane;
  var freeBelow = 0.0;
  var freeAbove = 0.0;
  var above = 0.0;
  if (k > 0u && !blocked(index - uniforms.plane)) {
    freeBelow = 1.0;
  }
  if (k + 1u < uniforms.dims.z && !blocked(index + uniforms.plane)) {
    freeAbove = 1.0;
    above = source[index + uniforms.plane];
  }
  let retained = fma(
    -uniforms.phi * freeBelow,
    source[index],
    source[index],
  );
  auxiliaryA[index] = fma(uniforms.phi * freeAbove, above, retained);
}

@compute @workgroup_size(${GPU_WORKGROUP_SIZE})
fn commitDiffusion(@builtin(global_invocation_id) invocation: vec3<u32>) {
  if (
    uniforms.baseCell >= uniforms.cellCount ||
    invocation.x >= uniforms.cellCount - uniforms.baseCell
  ) {
    return;
  }
  let index = uniforms.baseCell + invocation.x;
  if (blocked(index)) {
    destination[index] = 0.0;
    return;
  }
  var value = source[index];
  if ((uniforms.flags & ${GPU_GG_DIFFUSION_FLAG_NOISE}u) != 0u) {
    value = fma(auxiliaryB[index], auxiliaryA[index], value);
  }
  destination[index] = value;
}

@compute @workgroup_size(${GPU_WORKGROUP_SIZE})
fn clampDirichlet(@builtin(global_invocation_id) invocation: vec3<u32>) {
  if (
    uniforms.baseCell >= uniforms.cellCount ||
    invocation.x >= uniforms.cellCount - uniforms.baseCell
  ) {
    return;
  }
  let index = uniforms.baseCell + invocation.x;
  auxiliaryA[index] = 0.0;
  if (!blocked(index) && (topology[index] & 1u) != 0u) {
    auxiliaryA[index] = uniforms.rho - destination[index];
    destination[index] = uniforms.rho;
  }
}
`;
