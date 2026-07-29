import { GPU_GRID_UNIFORM_WGSL } from "./layout.ts";
import { GPU_WORKGROUP_SIZE } from "./submission.ts";

const GRID_ENTRY_GUARD = /* wgsl */ `
  let index = uniforms.baseCell + invocation.x;
  if (index >= uniforms.cellCount) {
    return;
  }
`;

export const GPU_COORDINATE_HASH_WGSL = /* wgsl */ `
${GPU_GRID_UNIFORM_WGSL}

@group(0) @binding(0) var<uniform> uniforms: GridUniforms;
@group(0) @binding(1) var<storage, read_write> output: array<u32>;

@compute @workgroup_size(${GPU_WORKGROUP_SIZE})
fn coordinateHash(@builtin(global_invocation_id) invocation: vec3<u32>) {
${GRID_ENTRY_GUARD}
  let k = index / uniforms.plane;
  let remainder = index - k * uniforms.plane;
  let j = remainder / uniforms.dims.x;
  let i = remainder - j * uniforms.dims.x;
  output[index] =
    (i * 73856093u) ^
    (j * 19349663u) ^
    (k * 83492791u);
}
`;

/**
 * Copies words rather than typed values so u32 values and f32 bit patterns use the
 * same bit-exact transport path.
 */
export const GPU_COPY_WORDS_WGSL = /* wgsl */ `
${GPU_GRID_UNIFORM_WGSL}

@group(0) @binding(0) var<uniform> uniforms: GridUniforms;
@group(0) @binding(1) var<storage, read> source: array<u32>;
@group(0) @binding(2) var<storage, read_write> destination: array<u32>;

@compute @workgroup_size(${GPU_WORKGROUP_SIZE})
fn copyWords(@builtin(global_invocation_id) invocation: vec3<u32>) {
${GRID_ENTRY_GUARD}
  destination[index] = source[index];
}
`;

export const GPU_COUNTER_PRNG_WGSL = /* wgsl */ `
${GPU_GRID_UNIFORM_WGSL}

@group(0) @binding(0) var<uniform> uniforms: GridUniforms;
@group(0) @binding(1) var<storage, read_write> output: array<u32>;

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
fn counterPrng(@builtin(global_invocation_id) invocation: vec3<u32>) {
${GRID_ENTRY_GUARD}
  output[index] = hashCounter(
    uniforms.rngSeed,
    index,
    uniforms.tick,
    uniforms.streamId,
  );
}
`;
