// Evidence-artifact inspection (V4-2): strict, VIEW-ONLY decoding of gate checkpoints.
//
// The app can load an actual gate checkpoint — GG v1 (Pass A) or LK v2 (Pass B) — and display
// its operator, policy, temperature or G-G control, seed, tick / physical time, evidence
// status, and recorded backend. Rules enforced here, not by convention:
//   - STRICT decode only, via the @vcc/core codecs. Any decode failure propagates as a named
//     error; there is no lenient fallback and no partial display of an invalid artifact.
//   - VIEW-ONLY: decoding copies the payload into fresh arrays; nothing here (or anywhere in
//     the app) can write back to the artifact's source. The app has no write path at all.
//   - Evidence context is verified, not trusted: when a caller supplies the recorded
//     checkpoint SHA-256 / operator from a verified bundle report, the loaded bytes must
//     match both, or loading fails by name.
//
// Pure and environment-neutral (no DOM, no Worker, no Node APIs) so it unit-tests in node.

import {
  aspectRatio,
  cellCount,
  centerRimDepletion,
  decodeCheckpoint,
  decodeLKCheckpoint,
  hexDistance,
  latticeExtents,
  paramSlot,
  type CenterRimDepletion,
  type CheckpointMetrics,
  type Dims,
  type DomainShape,
  type FarFieldCondition,
  type GGParams,
  type LatticeExtents,
  type LKSurfacePolicy,
} from "@vcc/core";
import { fieldSemanticsFor, type FieldSemantics, type OperatorName } from "./display.ts";
import { sha256Hex } from "./sha256.ts";

/**
 * Provenance handed along with bytes that came out of a verified evidence bundle. Everything
 * here is display provenance EXCEPT checkpointSha256 and operator, which are verified against
 * the actual bytes before the artifact is accepted.
 */
export interface ArtifactEvidenceContext {
  readonly runId: string;
  readonly pass: string;
  readonly operator: OperatorName;
  /** Backend recorded by the evidence run (e.g. "float64-cpu-oracle"). */
  readonly backend: string;
  /** Honest evidence-status sentence from the bundle (verdict, report identity). */
  readonly evidenceStatus: string;
  readonly checkpointSha256: string;
}

export interface InspectedEvidence {
  readonly runId: string | null;
  readonly status: string;
  readonly backend: string;
  readonly sha256: string;
}

interface InspectedArtifactBase {
  readonly semantics: FieldSemantics;
  readonly dims: Dims;
  readonly center: readonly [number, number, number];
  readonly domain: DomainShape;
  readonly farField: FarFieldCondition;
  readonly tick: number;
  readonly rngSeed: number;
  readonly noiseEpsilon: number;
  readonly a: Uint8Array;
  /** Reconstructed inert-wall mask (hexPrism), null on box domains. */
  readonly wall: Uint8Array | null;
  /** Volumetric field (GG d / LK sigma), f64 for metrics and f32 for display. */
  readonly field64: Float64Array;
  readonly field32: Float32Array;
  /** Surface state (GG b / LK f), f64 and f32 display copy. */
  readonly surface64: Float64Array;
  readonly surface32: Float32Array;
  /** Shared @vcc/core metric over the operator's own field (V4-4). */
  readonly depletion: CenterRimDepletion;
  readonly extents: LatticeExtents | null;
  readonly aspectRatio: number;
  readonly attachedCount: number;
  readonly evidence: InspectedEvidence;
  /** Complete metadata block for the status panel (operator, policy, control, seed, …). */
  readonly statusLines: readonly string[];
}

export interface GGInspectedArtifact extends InspectedArtifactBase {
  readonly operator: "GGThreshold";
  readonly params: GGParams;
  readonly headerMetrics: CheckpointMetrics | null;
}

export interface LKInspectedArtifact extends InspectedArtifactBase {
  readonly operator: "LibbrechtKinetics";
  readonly surfacePolicy: LKSurfacePolicy;
  readonly tempC: number;
  readonly sigmaInfinity: number;
  readonly simTimeSeconds: number;
}

export type InspectedArtifact = GGInspectedArtifact | LKInspectedArtifact;

const CHECKPOINT_MAGIC = "VCCCKPT1";

/**
 * Decide which strict decoder a checkpoint needs. Both formats share the magic; the LK header
 * is distinguished by its mandatory rule tag. This only routes — every validation stays in
 * the strict @vcc/core decoders.
 */
export function detectCheckpointOperator(bytes: Uint8Array): OperatorName {
  if (bytes.length < 12) throw new Error("artifact is shorter than a checkpoint fixed header");
  let magic = "";
  for (let i = 0; i < 8; i++) magic += String.fromCharCode(bytes[i]);
  if (magic !== CHECKPOINT_MAGIC) {
    throw new Error(`artifact is not a VCC checkpoint (magic ${JSON.stringify(magic)})`);
  }
  const headerLength = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint32(
    8,
    true,
  );
  if (headerLength > bytes.length - 12) {
    throw new Error("checkpoint header length exceeds the available bytes");
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(new TextDecoder().decode(bytes.subarray(12, 12 + headerLength)));
  } catch {
    throw new Error("checkpoint header is not valid JSON");
  }
  const rule = (parsed as { rule?: unknown } | null)?.rule;
  return rule === "LibbrechtKinetics" ? "LibbrechtKinetics" : "GGThreshold";
}

/**
 * Reconstruct the inert-wall mask a solver would build for this domain: hexPrism masks the
 * inscribed hexagonal prism (radius = min center-to-face distance, zmirror-symmetric z range)
 * — the same active-region formula the @vcc/core checkpoint validators enforce on wall cells.
 * Unit tests cross-check this against GGSolver's own wall array.
 */
export function reconstructWall(
  dims: Dims,
  center: readonly [number, number, number],
  domain: DomainShape,
): Uint8Array | null {
  if (domain === "box") return null;
  const [ic, jc, kc] = center;
  const radius = Math.min(ic, dims.nx - 1 - ic, jc, dims.ny - 1 - jc);
  const halfZ = Math.min(kc, dims.nz - 1 - kc);
  const n = cellCount(dims);
  const wall = new Uint8Array(n);
  const plane = dims.nx * dims.ny;
  for (let index = 0; index < n; index++) {
    const k = Math.floor(index / plane);
    const inPlane = index - k * plane;
    const j = Math.floor(inPlane / dims.nx);
    const i = inPlane - j * dims.nx;
    const active = hexDistance(i - ic, j - jc) <= radius && Math.abs(k - kc) <= halfZ;
    if (!active) wall[index] = 1;
  }
  return wall;
}

function toF32(values: Float64Array): Float32Array {
  const out = new Float32Array(values.length);
  out.set(values);
  return out;
}

function looseEvidence(sha256: string): InspectedEvidence {
  return {
    runId: null,
    status: "loose artifact — unverified, NOT gate evidence",
    backend: "unrecorded",
    sha256,
  };
}

function verifyContext(
  bytes: Uint8Array,
  actualOperator: OperatorName,
  context: ArtifactEvidenceContext | null,
): InspectedEvidence {
  const actualSha = sha256Hex(bytes);
  if (context === null) return looseEvidence(actualSha);
  if (context.checkpointSha256 !== actualSha) {
    throw new Error(
      `artifact hash mismatch: evidence context records sha256 ${context.checkpointSha256}, ` +
        `loaded bytes hash to ${actualSha}`,
    );
  }
  if (context.operator !== actualOperator) {
    throw new Error(
      `operator label mismatch: evidence context claims ${context.operator}, artifact ` +
        `decodes as ${actualOperator}`,
    );
  }
  return {
    runId: context.runId,
    status: context.evidenceStatus,
    backend: context.backend,
    sha256: actualSha,
  };
}

function num(value: number): string {
  return Number.isFinite(value) ? String(value) : "undefined (NaN)";
}

/**
 * Strictly decode checkpoint bytes into a view-only inspected artifact. `context` carries
 * verified-bundle provenance; null marks the artifact honestly as loose/unverified.
 */
export function inspectCheckpointBytes(
  bytes: Uint8Array,
  context: ArtifactEvidenceContext | null,
): InspectedArtifact {
  const operator = detectCheckpointOperator(bytes);
  const evidence = verifyContext(bytes, operator, context);
  const semantics = fieldSemanticsFor(operator);

  if (operator === "GGThreshold") {
    const { header, state } = decodeCheckpoint(bytes);
    const wall = reconstructWall(state.dims, state.center, state.domain);
    const depletion = centerRimDepletion(
      state.a,
      state.d,
      state.dims,
      state.center,
      wall ?? undefined,
    );
    const extents = latticeExtents(state.a, state.dims);
    const ggThreshBeta01 = state.params.ggThreshBeta[paramSlot(0, 1)];
    const statusLines = [
      "INSPECTING ARTIFACT — view-only; evidence bytes are never modified",
      "operator: GGThreshold (abstract thresholds; no physical surface policy)",
      `run: ${evidence.runId ?? "(loose artifact)"} · evidence: ${evidence.status}`,
      `recorded backend: ${evidence.backend}`,
      `G-G control: rho ${num(state.params.rho)} · phi ${num(state.params.phi)} · ` +
        `ggThreshBeta(0,1) ${num(ggThreshBeta01)} (model units, unvalidated)`,
      `seed ${state.rngSeed} · noise ${state.noiseEpsilon} · tick ${state.tick} ` +
        `(G-G ticks have no physical-time interpretation)`,
      `domain ${state.domain} · far field ${state.farField} · dims ` +
        `${state.dims.nx},${state.dims.ny},${state.dims.nz}`,
      `checkpoint sha256 ${evidence.sha256}`,
    ];
    return {
      operator: "GGThreshold",
      semantics,
      dims: state.dims,
      center: state.center,
      domain: state.domain,
      farField: state.farField,
      tick: state.tick,
      rngSeed: state.rngSeed,
      noiseEpsilon: state.noiseEpsilon,
      a: state.a,
      wall,
      field64: state.d,
      field32: toF32(state.d),
      surface64: state.b,
      surface32: toF32(state.b),
      depletion,
      extents,
      aspectRatio: aspectRatio(state.a, state.dims),
      attachedCount: extents?.attachedCount ?? 0,
      evidence,
      statusLines,
      params: state.params,
      headerMetrics: header.metrics,
    };
  }

  const { state } = decodeLKCheckpoint(bytes);
  const wall = reconstructWall(state.dims, state.center, state.domain);
  const depletion = centerRimDepletion(
    state.a,
    state.sigma,
    state.dims,
    state.center,
    wall ?? undefined,
  );
  const extents = latticeExtents(state.a, state.dims);
  const statusLines = [
    "INSPECTING ARTIFACT — view-only; evidence bytes are never modified",
    "operator: LibbrechtKinetics (source-cited kinetics; Evidence = unvalidated)",
    `surface policy: ${state.surfacePolicy}`,
    `run: ${evidence.runId ?? "(loose artifact)"} · evidence: ${evidence.status}`,
    `recorded backend: ${evidence.backend}`,
    `control: temperature ${num(state.tempC)} C · sigmaInfinity ${num(state.sigmaInfinity)} ` +
      `(dimensionless) · ${state.paramSet} · ${num(state.pressurePa)} Pa · dx ${num(state.dxUm)} um`,
    `seed ${state.rngSeed} · noise ${state.noiseEpsilon} · interface step ${state.tick} · ` +
      `physical time ${num(state.simTimeSeconds)} s`,
    `domain ${state.domain} · far field ${state.farField} · dims ` +
      `${state.dims.nx},${state.dims.ny},${state.dims.nz}`,
    `checkpoint sha256 ${evidence.sha256}`,
  ];
  return {
    operator: "LibbrechtKinetics",
    semantics,
    dims: state.dims,
    center: state.center,
    domain: state.domain,
    farField: state.farField,
    tick: state.tick,
    rngSeed: state.rngSeed,
    noiseEpsilon: state.noiseEpsilon,
    a: state.a,
    wall,
    field64: state.sigma,
    field32: toF32(state.sigma),
    surface64: state.f,
    surface32: toF32(state.f),
    depletion,
    extents,
    aspectRatio: aspectRatio(state.a, state.dims),
    attachedCount: extents?.attachedCount ?? 0,
    evidence,
    statusLines,
    surfacePolicy: state.surfacePolicy,
    tempC: state.tempC,
    sigmaInfinity: state.sigmaInfinity,
    simTimeSeconds: state.simTimeSeconds,
  };
}
