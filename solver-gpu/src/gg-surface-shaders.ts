import { GPU_WORKGROUP_SIZE } from "./submission.ts";

export const GPU_GG_SURFACE_FLAG_DIRICHLET = 1;

export const GPU_GG_RENDER_BOUNDARY = 1;
export const GPU_GG_RENDER_ATTACH_DECISION = 2;
export const GPU_GG_RENDER_HOLE_FILL = 4;
export const GPU_GG_RENDER_ATTACHED_NOW = 8;
export const GPU_GG_RENDER_NT_SHIFT = 8;
export const GPU_GG_RENDER_NZ_SHIFT = 12;

export const GPU_GG_SURFACE_WGSL = /* wgsl */ `
struct SurfaceUniforms {
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
  kappa0: vec4<f32>,
  kappa1: vec4<f32>,
  mu0: vec4<f32>,
  mu1: vec4<f32>,
  ggThreshBeta0: vec4<f32>,
  ggThreshBeta1: vec4<f32>,
}

struct GgCycleReport {
  boundaryCount: u32,
  attachedTotal: atomic<u32>,
  attachedNow: atomic<u32>,
  holeFillNow: atomic<u32>,
  lastClampDelta: f32,
  dirichletMeter: f32,
  oldBoundaryCount: u32,
  errorFlags: u32,
}

@group(0) @binding(0) var<uniform> uniforms: SurfaceUniforms;
@group(0) @binding(1) var<storage, read_write> occupancy: array<u32>;
@group(0) @binding(2) var<storage, read> wall: array<u32>;
@group(0) @binding(3) var<storage, read_write> topology: array<u32>;
@group(0) @binding(4) var<storage, read_write> vaporOrInput: array<f32>;
@group(0) @binding(5) var<storage, read_write> massOrOutput: array<f32>;
@group(0) @binding(6) var<storage, read_write> boundaryIndices: array<u32>;
@group(0) @binding(7) var<storage, read_write> renderFlags: array<u32>;
@group(0) @binding(8) var<storage, read_write> report: GgCycleReport;

const TOPOLOGY_BOUNDARY: u32 = 2u;
const RENDER_BOUNDARY: u32 = ${GPU_GG_RENDER_BOUNDARY}u;
const RENDER_ATTACH_DECISION: u32 = ${GPU_GG_RENDER_ATTACH_DECISION}u;
const RENDER_HOLE_FILL: u32 = ${GPU_GG_RENDER_HOLE_FILL}u;
const RENDER_ATTACHED_NOW: u32 = ${GPU_GG_RENDER_ATTACHED_NOW}u;
const RENDER_NT_SHIFT: u32 = ${GPU_GG_RENDER_NT_SHIFT}u;
const RENDER_NZ_SHIFT: u32 = ${GPU_GG_RENDER_NZ_SHIFT}u;

fn controlValue(first: vec4<f32>, second: vec4<f32>, slot: u32) -> f32 {
  if (slot < 4u) {
    return first[slot];
  }
  return second[slot - 4u];
}

fn neighborCounts(index: u32) -> vec2<u32> {
  let k = index / uniforms.plane;
  let remainder = index - k * uniforms.plane;
  let j = remainder / uniforms.dims.x;
  let i = remainder - j * uniforms.dims.x;
  var nT = 0u;
  var nZ = 0u;
  if (i + 1u < uniforms.dims.x && occupancy[index + 1u] != 0u) {
    nT += 1u;
  }
  if (i > 0u && occupancy[index - 1u] != 0u) {
    nT += 1u;
  }
  if (j + 1u < uniforms.dims.y && occupancy[index + uniforms.dims.x] != 0u) {
    nT += 1u;
  }
  if (j > 0u && occupancy[index - uniforms.dims.x] != 0u) {
    nT += 1u;
  }
  if (
    i + 1u < uniforms.dims.x &&
    j > 0u &&
    occupancy[index + 1u - uniforms.dims.x] != 0u
  ) {
    nT += 1u;
  }
  if (
    i > 0u &&
    j + 1u < uniforms.dims.y &&
    occupancy[index - 1u + uniforms.dims.x] != 0u
  ) {
    nT += 1u;
  }
  if (k + 1u < uniforms.dims.z && occupancy[index + uniforms.plane] != 0u) {
    nZ += 1u;
  }
  if (k > 0u && occupancy[index - uniforms.plane] != 0u) {
    nZ += 1u;
  }
  return vec2<u32>(nT, nZ);
}

fn slotForCounts(counts: vec2<u32>) -> u32 {
  return min(counts.x, 3u) * 2u + min(counts.y, 1u);
}

@compute @workgroup_size(1)
fn clearCycleReport(@builtin(global_invocation_id) invocation: vec3<u32>) {
  if (invocation.x != 0u) {
    return;
  }
  report.oldBoundaryCount = report.boundaryCount;
  atomicStore(&report.attachedNow, 0u);
  atomicStore(&report.holeFillNow, 0u);
  report.lastClampDelta = 0.0;
  report.errorFlags = 0u;
}

var<workgroup> reductionValues: array<f32, ${GPU_WORKGROUP_SIZE}>;

@compute @workgroup_size(${GPU_WORKGROUP_SIZE})
fn reduceClamp(
  @builtin(global_invocation_id) invocation: vec3<u32>,
  @builtin(local_invocation_index) localIndex: u32,
  @builtin(workgroup_id) workgroupId: vec3<u32>,
) {
  var value = 0.0;
  if (invocation.x < uniforms.inputCount) {
    value = vaporOrInput[uniforms.inputBase + invocation.x];
  }
  reductionValues[localIndex] = value;
  workgroupBarrier();
  var stride = ${GPU_WORKGROUP_SIZE / 2}u;
  loop {
    if (localIndex < stride) {
      reductionValues[localIndex] =
        reductionValues[localIndex] + reductionValues[localIndex + stride];
    }
    workgroupBarrier();
    if (stride == 1u) {
      break;
    }
    stride = stride / 2u;
  }
  if (localIndex == 0u) {
    massOrOutput[uniforms.outputBase + workgroupId.x] = reductionValues[0];
  }
}

@compute @workgroup_size(1)
fn accumulateClamp(@builtin(global_invocation_id) invocation: vec3<u32>) {
  if (invocation.x != 0u) {
    return;
  }
  let delta = vaporOrInput[uniforms.inputBase];
  report.lastClampDelta = delta;
  report.dirichletMeter = report.dirichletMeter + delta;
}

@compute @workgroup_size(${GPU_WORKGROUP_SIZE})
fn freezeBoundary(@builtin(global_invocation_id) invocation: vec3<u32>) {
  if (
    uniforms.baseCell >= uniforms.cellCount ||
    invocation.x >= uniforms.cellCount - uniforms.baseCell
  ) {
    return;
  }
  let index = uniforms.baseCell + invocation.x;
  renderFlags[index] = 0u;
  if (
    occupancy[index] != 0u ||
    wall[index] != 0u ||
    (topology[index] & TOPOLOGY_BOUNDARY) == 0u
  ) {
    return;
  }
  let counts = neighborCounts(index);
  let slot = slotForCounts(counts);
  renderFlags[index] =
    RENDER_BOUNDARY |
    (counts.x << RENDER_NT_SHIFT) |
    (counts.y << RENDER_NZ_SHIFT);
  let retained = controlValue(uniforms.kappa0, uniforms.kappa1, slot);
  let vapor = vaporOrInput[index];
  massOrOutput[index] =
    massOrOutput[index] + (1.0 - retained) * vapor;
  vaporOrInput[index] = retained * vapor;
}

@compute @workgroup_size(${GPU_WORKGROUP_SIZE})
fn decideAttachment(@builtin(global_invocation_id) invocation: vec3<u32>) {
  if (
    uniforms.baseCell >= uniforms.cellCount ||
    invocation.x >= uniforms.cellCount - uniforms.baseCell
  ) {
    return;
  }
  let index = uniforms.baseCell + invocation.x;
  var packed = renderFlags[index];
  if ((packed & RENDER_BOUNDARY) == 0u) {
    return;
  }
  let nT = (packed >> RENDER_NT_SHIFT) & 7u;
  let nZ = (packed >> RENDER_NZ_SHIFT) & 3u;
  let holeFill = nT >= 4u && nZ >= 1u;
  let slot = min(nT, 3u) * 2u + min(nZ, 1u);
  if (
    holeFill ||
    massOrOutput[index] >=
      controlValue(uniforms.ggThreshBeta0, uniforms.ggThreshBeta1, slot)
  ) {
    packed |= RENDER_ATTACH_DECISION;
    if (holeFill) {
      packed |= RENDER_HOLE_FILL;
    }
    renderFlags[index] = packed;
  }
}

@compute @workgroup_size(${GPU_WORKGROUP_SIZE})
fn meltBoundary(@builtin(global_invocation_id) invocation: vec3<u32>) {
  if (
    uniforms.baseCell >= uniforms.cellCount ||
    invocation.x >= uniforms.cellCount - uniforms.baseCell
  ) {
    return;
  }
  let index = uniforms.baseCell + invocation.x;
  let packed = renderFlags[index];
  if (
    (packed & RENDER_BOUNDARY) == 0u ||
    (packed & RENDER_ATTACH_DECISION) != 0u
  ) {
    return;
  }
  let nT = (packed >> RENDER_NT_SHIFT) & 7u;
  let nZ = (packed >> RENDER_NZ_SHIFT) & 3u;
  let slot = min(nT, 3u) * 2u + min(nZ, 1u);
  let melting = controlValue(uniforms.mu0, uniforms.mu1, slot);
  let boundaryMass = massOrOutput[index];
  massOrOutput[index] = (1.0 - melting) * boundaryMass;
  vaporOrInput[index] = vaporOrInput[index] + melting * boundaryMass;
}

@compute @workgroup_size(${GPU_WORKGROUP_SIZE})
fn applyAttachment(@builtin(global_invocation_id) invocation: vec3<u32>) {
  if (
    uniforms.baseCell >= uniforms.cellCount ||
    invocation.x >= uniforms.cellCount - uniforms.baseCell
  ) {
    return;
  }
  let index = uniforms.baseCell + invocation.x;
  let packed = renderFlags[index];
  if ((packed & RENDER_ATTACH_DECISION) == 0u) {
    return;
  }
  occupancy[index] = 1u;
  massOrOutput[index] = massOrOutput[index] + vaporOrInput[index];
  vaporOrInput[index] = 0.0;
  renderFlags[index] = packed | RENDER_ATTACHED_NOW;
  atomicAdd(&report.attachedNow, 1u);
  atomicAdd(&report.attachedTotal, 1u);
  if ((packed & RENDER_HOLE_FILL) != 0u) {
    atomicAdd(&report.holeFillNow, 1u);
  }
}

fn appendNeighbor(index: u32, writePosition: ptr<function, u32>) {
  if (
    occupancy[index] == 0u &&
    wall[index] == 0u &&
    (topology[index] & TOPOLOGY_BOUNDARY) == 0u
  ) {
    topology[index] |= TOPOLOGY_BOUNDARY;
    vaporOrInput[*writePosition] = bitcast<f32>(index);
    *writePosition += 1u;
  }
}

@compute @workgroup_size(1)
fn rebuildBoundary(@builtin(global_invocation_id) invocation: vec3<u32>) {
  if (invocation.x != 0u) {
    return;
  }
  let oldCount = report.oldBoundaryCount;
  var writePosition = 0u;
  var attachmentPosition = 0u;
  for (var position = 0u; position < oldCount; position += 1u) {
    let index = boundaryIndices[position];
    let packed = renderFlags[index];
    if ((packed & RENDER_ATTACHED_NOW) == 0u) {
      vaporOrInput[writePosition] = bitcast<f32>(index);
      writePosition += 1u;
    } else {
      massOrOutput[attachmentPosition] = bitcast<f32>(index);
      attachmentPosition += 1u;
      topology[index] &= ~TOPOLOGY_BOUNDARY;
    }
  }
  for (var position = 0u; position < oldCount; position += 1u) {
    let index = boundaryIndices[position];
    if ((renderFlags[index] & RENDER_ATTACHED_NOW) == 0u) {
      continue;
    }
    let k = index / uniforms.plane;
    let remainder = index - k * uniforms.plane;
    let j = remainder / uniforms.dims.x;
    let i = remainder - j * uniforms.dims.x;
    if (i + 1u < uniforms.dims.x) {
      appendNeighbor(index + 1u, &writePosition);
    }
    if (i > 0u) {
      appendNeighbor(index - 1u, &writePosition);
    }
    if (j + 1u < uniforms.dims.y) {
      appendNeighbor(index + uniforms.dims.x, &writePosition);
    }
    if (j > 0u) {
      appendNeighbor(index - uniforms.dims.x, &writePosition);
    }
    if (i + 1u < uniforms.dims.x && j > 0u) {
      appendNeighbor(index + 1u - uniforms.dims.x, &writePosition);
    }
    if (i > 0u && j + 1u < uniforms.dims.y) {
      appendNeighbor(index - 1u + uniforms.dims.x, &writePosition);
    }
    if (k + 1u < uniforms.dims.z) {
      appendNeighbor(index + uniforms.plane, &writePosition);
    }
    if (k > 0u) {
      appendNeighbor(index - uniforms.plane, &writePosition);
    }
  }
  if (
    writePosition > uniforms.cellCount ||
    attachmentPosition != atomicLoad(&report.attachedNow)
  ) {
    report.errorFlags = 1u;
  }
  report.boundaryCount = writePosition;
}

@compute @workgroup_size(${GPU_WORKGROUP_SIZE})
fn publishBoundary(@builtin(global_invocation_id) invocation: vec3<u32>) {
  if (
    uniforms.baseCell >= uniforms.cellCount ||
    invocation.x >= uniforms.cellCount - uniforms.baseCell
  ) {
    return;
  }
  let position = uniforms.baseCell + invocation.x;
  if (position < report.boundaryCount) {
    boundaryIndices[position] = bitcast<u32>(vaporOrInput[position]);
  } else {
    boundaryIndices[position] = 0u;
  }
}
`;
