// Protocol-independent streamed LibbrechtKinetics resume checkpoints (ADR 0039).
//
// This module is additive. The frozen GG v1 and LK v1/v2 codecs remain in checkpoint.ts.
// Core stays environment-neutral: hashing, files, publication, traces, and campaign policy
// belong to the runner.

import { CHECKPOINT_MAGIC } from "./checkpoint.ts";
import { cellCount, coordsOf, hexDistance, type Dims } from "./lattice.ts";
import { kineticLength, mIce, vKin } from "./libbrecht.ts";

export const MAX_LK_RESUME_HEADER_BYTES = 65_536;
export const LK_RESUME_STREAM_CHUNK_BYTES = 8_388_608;
export const LK_RESUME_TEST_BUFFER_CAP_BYTES = 16_777_216;

export type LKResumeParamSetV3 = "CAK" | "M1" | "M1_NO_DIP_ABLATION";

export interface LKResumeByteSink {
  write(chunk: Uint8Array): Promise<void>;
}

export interface LKResumeByteSource {
  readonly byteLength: number;
  readExactly(offset: number, target: Uint8Array): Promise<void>;
}

/** Core-owned structural copy of the solver report; core never imports solver-cpu. */
export interface LKResumeRelaxationReportV3 {
  readonly sweeps: number;
  readonly converged: boolean;
  readonly residual: number;
  readonly divergenceResidual: number;
  readonly shellClampDiagnostic: number;
  readonly surfaceExchangeDiagnostic: number;
  readonly smootherDriftDiagnostic: number;
  readonly minLocalSurfaceExchangeDiagnostic: number;
}

export interface LKResumeStateV3 {
  readonly numericEngine: "float64-cpu";
  readonly resumePhase: "cycle-boundary";
  readonly cycleState: "boundary";
  readonly timelineMode: "none";
  readonly dims: Dims;
  readonly tick: number;
  readonly rngSeed: number;
  readonly noiseEpsilon: number;
  readonly domain: "hexPrism";
  readonly center: readonly [number, number, number];
  readonly tempC: number;
  readonly sigmaInfinity: number;
  /** Original admitted input bits; never reconstructed from the derived metre value. */
  readonly dxUm: number;
  readonly pressurePa: number;
  readonly paramSet: LKResumeParamSetV3;
  readonly cflFill: number;
  readonly relaxTol: number;
  readonly divTol: number;
  readonly relaxMaxSweeps: number;
  readonly surfacePolicy: "aggregate-hv-g1h1-v6";
  readonly farField: "monopole-matched";
  readonly activeCellCount: number;
  readonly shellCellCount: number;
  readonly hexRadius: number;
  readonly zHalfExtent: number;
  readonly attachedCount: number;
  readonly holeFillCountTotal: number;
  readonly a: Uint8Array;
  readonly f: Float64Array;
  readonly sigma: Float64Array;
  readonly boundaryOrder: readonly number[];
  readonly lastAttached: readonly number[];
  readonly simTimeSeconds: number;
  readonly volumeRateM3PerS: number;
  readonly lastMaxFillVelocityMS: number;
  readonly fillLedger: number;
  readonly holeFillDeficit: number;
  readonly saturationClippedFill: number;
  readonly lastRelaxation: LKResumeRelaxationReportV3 | null;
  /** Constant-environment eligibility witnesses. None is serialized. */
  readonly acceptedEnvironmentEventCount: number;
  readonly closedPlacedFillVaporUnits: number;
  readonly currentTemperatureSegmentStartFill: number;
  readonly testHookEverUsed: boolean;
  /** Live encode-concurrency sentinel. It is not a wire field. */
  mutationEpoch(): number;
}

export interface LKResumeValidatedTopologyV3 {
  readonly wall: Uint8Array;
  readonly blocked: Uint8Array;
  readonly inBoundary: Uint8Array;
  readonly nTAtt: Uint8Array;
  readonly nZAtt: Uint8Array;
  readonly dirichletCells: Int32Array;
  readonly shellRadiusM: Float64Array;
  readonly activeCellCount: number;
  readonly shellCellCount: number;
  readonly hexRadius: number;
  readonly zHalfExtent: number;
  readonly attachedCount: number;
  readonly iMin: number;
  readonly iMax: number;
  readonly jMin: number;
  readonly jMax: number;
  readonly kMin: number;
  readonly kMax: number;
}

/** Final owned arrays/state returned exactly once from a decoded ownership envelope. */
export interface LKResumeAdoptedStateV3 {
  readonly version: 3;
  readonly numericEngine: "float64-cpu";
  readonly resumePhase: "cycle-boundary";
  readonly cycleState: "boundary";
  readonly timelineMode: "none";
  readonly dims: Dims;
  readonly tick: number;
  readonly rngSeed: number;
  readonly noiseEpsilon: number;
  readonly domain: "hexPrism";
  readonly center: readonly [number, number, number];
  readonly tempC: number;
  readonly sigmaInfinity: number;
  readonly dxUm: number;
  readonly pressurePa: number;
  readonly paramSet: LKResumeParamSetV3;
  readonly cflFill: number;
  readonly relaxTol: number;
  readonly divTol: number;
  readonly relaxMaxSweeps: number;
  readonly surfacePolicy: "aggregate-hv-g1h1-v6";
  readonly farField: "monopole-matched";
  readonly a: Uint8Array;
  readonly f: Float64Array;
  readonly sigma: Float64Array;
  readonly boundaryOrder: number[];
  readonly lastAttached: number[];
  readonly simTimeSeconds: number;
  readonly volumeRateM3PerS: number;
  readonly lastMaxFillVelocityMS: number;
  readonly fillLedger: number;
  readonly holeFillDeficit: number;
  readonly saturationClippedFill: number;
  readonly holeFillCountTotal: number;
  readonly lastRelaxation: LKResumeRelaxationReportV3 | null;
  readonly acceptedEnvironmentEventCount: 0;
  readonly closedPlacedFillVaporUnits: 0;
  readonly currentTemperatureSegmentStartFill: 0;
  readonly testHookEverUsed: false;
  readonly topology: LKResumeValidatedTopologyV3;
}

export interface DecodedLKResumeCheckpointV3 {
  readonly version: 3;
  readonly checkpointKind: "lk-resume";
  readonly tick: number;
  readonly byteLength: number;
}

export interface LKResumeEncodingSummary {
  readonly version: 3;
  readonly tick: number;
  readonly headerLength: number;
  readonly payloadLength: number;
  readonly byteLength: number;
}

export type LKResumeFieldNameV3 =
  | "a"
  | "f"
  | "sigma"
  | "boundaryOrder"
  | "lastAttached"
  | "resumeScalars";

export type LKResumeFieldDtypeV3 = "u8" | "f64" | "u32";

export interface LKResumeFieldDescriptorV3 {
  readonly name: LKResumeFieldNameV3;
  readonly dtype: LKResumeFieldDtypeV3;
  readonly length: number;
}

export interface LKResumeCheckpointHeaderV3 {
  readonly version: 3;
  readonly rule: "LibbrechtKinetics";
  readonly checkpointKind: "lk-resume";
  readonly endianness: "LE";
  readonly resumePhase: "cycle-boundary";
  readonly cycleState: "boundary";
  readonly timelineMode: "none";
  readonly dims: { readonly nx: number; readonly ny: number; readonly nz: number };
  readonly tick: number;
  readonly rngSeed: number;
  readonly noiseEpsilon: string;
  readonly domain: "hexPrism";
  readonly center: readonly [number, number, number];
  readonly tempC: string;
  readonly sigmaInfinity: string;
  readonly dxUm: string;
  readonly pressurePa: string;
  readonly paramSet: LKResumeParamSetV3;
  readonly cflFill: string;
  readonly relaxTol: string;
  readonly divTol: string;
  readonly relaxMaxSweeps: number;
  readonly surfacePolicy: "aggregate-hv-g1h1-v6";
  readonly farField: "monopole-matched";
  readonly topology: {
    readonly activeCellCount: number;
    readonly shellCellCount: number;
    readonly hexRadius: number;
    readonly zHalfExtent: number;
    readonly attachedCount: number;
    readonly boundaryCount: number;
    readonly lastAttachedCount: number;
  };
  readonly solverCounters: {
    readonly holeFillCountTotal: number;
    readonly lastRelaxationPresent: boolean;
    readonly lastRelaxationSweeps: number;
    readonly lastRelaxationConverged: boolean;
    readonly resumeScalarNullMask: number;
  };
  readonly fields: readonly LKResumeFieldDescriptorV3[];
}

const PREAMBLE_BYTES = 12;
const RESUME_SCALAR_COUNT = 12;
const ABSENT_REPORT_NULL_MASK = 0b111111000000;
const MAX_SIGNED_INDEX_CELL_COUNT = 0x7fff_ffff;
const LITTLE_ENDIAN_PLATFORM = new Uint8Array(new Uint16Array([0x0102]).buffer)[0] === 0x02;
const textEncoder = new TextEncoder();
const fatalTextDecoder = new TextDecoder("utf-8", { fatal: true });

const HEADER_KEYS = [
  "version",
  "rule",
  "checkpointKind",
  "endianness",
  "resumePhase",
  "cycleState",
  "timelineMode",
  "dims",
  "tick",
  "rngSeed",
  "noiseEpsilon",
  "domain",
  "center",
  "tempC",
  "sigmaInfinity",
  "dxUm",
  "pressurePa",
  "paramSet",
  "cflFill",
  "relaxTol",
  "divTol",
  "relaxMaxSweeps",
  "surfacePolicy",
  "farField",
  "topology",
  "solverCounters",
  "fields",
] as const;
const DIMS_KEYS = ["nx", "ny", "nz"] as const;
const TOPOLOGY_KEYS = [
  "activeCellCount",
  "shellCellCount",
  "hexRadius",
  "zHalfExtent",
  "attachedCount",
  "boundaryCount",
  "lastAttachedCount",
] as const;
const COUNTER_KEYS = [
  "holeFillCountTotal",
  "lastRelaxationPresent",
  "lastRelaxationSweeps",
  "lastRelaxationConverged",
  "resumeScalarNullMask",
] as const;
const FIELD_KEYS = ["name", "dtype", "length"] as const;

interface LKResumeSnapshotV3 extends LKResumeStateV3 {
  readonly dims: { readonly nx: number; readonly ny: number; readonly nz: number };
  readonly center: readonly [number, number, number];
  readonly boundaryOrder: number[];
  readonly lastAttached: number[];
  readonly lastRelaxation: LKResumeRelaxationReportV3 | null;
}

interface ValidatedLayout {
  readonly n: number;
  readonly boundaryCount: number;
  readonly lastAttachedCount: number;
  readonly payloadLength: number;
  readonly byteLength: number;
}

function fail(message: string): never {
  throw new Error(`LK resume checkpoint ${message}`);
}

function requireRecord(value: unknown, name: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    fail(`${name} must be an object`);
  }
  return value as Record<string, unknown>;
}

function requireExactKeys(
  value: Record<string, unknown>,
  expected: readonly string[],
  name: string,
): void {
  const actual = Object.keys(value);
  if (
    actual.length !== expected.length ||
    actual.some((key, index) => key !== expected[index])
  ) {
    fail(`${name} keys/order must be exactly [${expected.join(", ")}]`);
  }
}

function requireSafeInteger(value: unknown, name: string, minimum = 0): number {
  if (!Number.isSafeInteger(value) || (value as number) < minimum) {
    fail(`${name} must be a safe integer >= ${minimum}`);
  }
  return value as number;
}

function requirePositiveSafeInteger(value: unknown, name: string): number {
  return requireSafeInteger(value, name, 1);
}

function requireUint32(value: unknown, name: string): number {
  const number = requireSafeInteger(value, name);
  if (number > 0xffff_ffff) fail(`${name} must be a uint32 integer`);
  return number;
}

function requireFinite(value: unknown, name: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    fail(`${name} must be finite`);
  }
  return value;
}

function requirePositiveFinite(value: unknown, name: string): number {
  const number = requireFinite(value, name);
  if (!(number > 0)) fail(`${name} must be positive`);
  return number;
}

function requireCanonicalZero(value: number, name: string): void {
  if (!Object.is(value, 0)) fail(`${name} must use canonical positive-zero bits`);
}

function validateCanonicalZeroWhenZero(value: number, name: string): void {
  if (value === 0) requireCanonicalZero(value, name);
}

function safeAdd(left: number, right: number, name: string): number {
  if (!Number.isSafeInteger(left) || left < 0 || !Number.isSafeInteger(right) || right < 0) {
    fail(`${name} operands must be nonnegative safe integers`);
  }
  const result = left + right;
  if (!Number.isSafeInteger(result)) fail(`${name} exceeds safe-integer arithmetic`);
  return result;
}

function safeMultiply(left: number, right: number, name: string): number {
  if (!Number.isSafeInteger(left) || left < 0 || !Number.isSafeInteger(right) || right < 0) {
    fail(`${name} operands must be nonnegative safe integers`);
  }
  const result = left * right;
  if (!Number.isSafeInteger(result)) fail(`${name} exceeds safe-integer arithmetic`);
  return result;
}

function bytesEqual(left: Uint8Array, right: Uint8Array): boolean {
  if (left.length !== right.length) return false;
  for (let index = 0; index < left.length; index++) {
    if (left[index] !== right[index]) return false;
  }
  return true;
}

function f64ToHex(value: number): string {
  const bytes = new Uint8Array(8);
  new DataView(bytes.buffer).setFloat64(0, value, false);
  let hex = "";
  for (const byte of bytes) hex += byte.toString(16).padStart(2, "0");
  return hex;
}

function hexToF64(value: unknown, name: string): number {
  if (typeof value !== "string" || !/^[0-9a-f]{16}$/.test(value)) {
    fail(`${name} must be exactly 16 lowercase hexadecimal digits`);
  }
  const bytes = new Uint8Array(8);
  for (let index = 0; index < 8; index++) {
    bytes[index] = Number.parseInt(value.slice(index * 2, index * 2 + 2), 16);
  }
  return new DataView(bytes.buffer).getFloat64(0, false);
}

function sameFloatBits(left: number, right: number): boolean {
  return f64ToHex(left) === f64ToHex(right);
}

function validateMutationEpoch(value: unknown): number {
  if (!Number.isSafeInteger(value) || (value as number) < 0) {
    fail("mutation epoch must be a nonnegative safe integer");
  }
  return value as number;
}

function cloneReport(
  report: LKResumeRelaxationReportV3 | null,
): LKResumeRelaxationReportV3 | null {
  if (report === null) return null;
  return Object.freeze({
    sweeps: report.sweeps,
    converged: report.converged,
    residual: report.residual,
    divergenceResidual: report.divergenceResidual,
    shellClampDiagnostic: report.shellClampDiagnostic,
    surfaceExchangeDiagnostic: report.surfaceExchangeDiagnostic,
    smootherDriftDiagnostic: report.smootherDriftDiagnostic,
    minLocalSurfaceExchangeDiagnostic: report.minLocalSurfaceExchangeDiagnostic,
  });
}

function snapshotState(state: LKResumeStateV3): {
  readonly snapshot: LKResumeSnapshotV3;
  readonly epoch: number;
  readonly readEpoch: () => number;
} {
  if (typeof state !== "object" || state === null) fail("encode state must be an object");
  if (typeof state.mutationEpoch !== "function") {
    fail("encode state must expose a live mutationEpoch() sentinel");
  }
  const readEpoch = state.mutationEpoch.bind(state);
  const epoch = validateMutationEpoch(readEpoch());
  if (!Array.isArray(state.center) || state.center.length !== 3) {
    fail("center must contain exactly three coordinates");
  }
  if (!Array.isArray(state.boundaryOrder) || !Array.isArray(state.lastAttached)) {
    fail("ordered topology lists must be arrays");
  }
  const snapshot: LKResumeSnapshotV3 = {
    numericEngine: state.numericEngine,
    resumePhase: state.resumePhase,
    cycleState: state.cycleState,
    timelineMode: state.timelineMode,
    dims: Object.freeze({ nx: state.dims.nx, ny: state.dims.ny, nz: state.dims.nz }),
    tick: state.tick,
    rngSeed: state.rngSeed,
    noiseEpsilon: state.noiseEpsilon,
    domain: state.domain,
    center: Object.freeze([state.center[0], state.center[1], state.center[2]]),
    tempC: state.tempC,
    sigmaInfinity: state.sigmaInfinity,
    dxUm: state.dxUm,
    pressurePa: state.pressurePa,
    paramSet: state.paramSet,
    cflFill: state.cflFill,
    relaxTol: state.relaxTol,
    divTol: state.divTol,
    relaxMaxSweeps: state.relaxMaxSweeps,
    surfacePolicy: state.surfacePolicy,
    farField: state.farField,
    activeCellCount: state.activeCellCount,
    shellCellCount: state.shellCellCount,
    hexRadius: state.hexRadius,
    zHalfExtent: state.zHalfExtent,
    attachedCount: state.attachedCount,
    holeFillCountTotal: state.holeFillCountTotal,
    a: state.a,
    f: state.f,
    sigma: state.sigma,
    boundaryOrder: state.boundaryOrder.slice(),
    lastAttached: state.lastAttached.slice(),
    simTimeSeconds: state.simTimeSeconds,
    volumeRateM3PerS: state.volumeRateM3PerS,
    lastMaxFillVelocityMS: state.lastMaxFillVelocityMS,
    fillLedger: state.fillLedger,
    holeFillDeficit: state.holeFillDeficit,
    saturationClippedFill: state.saturationClippedFill,
    lastRelaxation: cloneReport(state.lastRelaxation),
    acceptedEnvironmentEventCount: state.acceptedEnvironmentEventCount,
    closedPlacedFillVaporUnits: state.closedPlacedFillVaporUnits,
    currentTemperatureSegmentStartFill: state.currentTemperatureSegmentStartFill,
    testHookEverUsed: state.testHookEverUsed,
    mutationEpoch: readEpoch,
  };
  if (validateMutationEpoch(readEpoch()) !== epoch) {
    fail("state mutated while the resume snapshot was being captured");
  }
  return { snapshot, epoch, readEpoch };
}

interface ResumeControlInput {
  readonly numericEngine: unknown;
  readonly resumePhase: unknown;
  readonly cycleState: unknown;
  readonly timelineMode: unknown;
  readonly dims: Dims;
  readonly tick: unknown;
  readonly rngSeed: unknown;
  readonly noiseEpsilon: unknown;
  readonly domain: unknown;
  readonly center: readonly number[];
  readonly tempC: unknown;
  readonly sigmaInfinity: unknown;
  readonly dxUm: unknown;
  readonly pressurePa: unknown;
  readonly paramSet: unknown;
  readonly cflFill: unknown;
  readonly relaxTol: unknown;
  readonly divTol: unknown;
  readonly relaxMaxSweeps: unknown;
  readonly surfacePolicy: unknown;
  readonly farField: unknown;
}

function validateControls(state: ResumeControlInput): number {
  if (state.numericEngine !== "float64-cpu") fail("numericEngine must be float64-cpu");
  if (state.resumePhase !== "cycle-boundary") fail("resumePhase must be cycle-boundary");
  if (state.cycleState !== "boundary") fail("cycleState must be boundary");
  if (state.timelineMode !== "none") fail("timelineMode must be none");
  if (state.domain !== "hexPrism") fail("domain must be hexPrism for v3");
  if (state.surfacePolicy !== "aggregate-hv-g1h1-v6") {
    fail("surfacePolicy must be aggregate-hv-g1h1-v6 for v3");
  }
  if (state.farField !== "monopole-matched") {
    fail("farField must be monopole-matched for v3");
  }
  if (state.paramSet !== "CAK" && state.paramSet !== "M1" && state.paramSet !== "M1_NO_DIP_ABLATION") {
    fail(`paramSet is outside the exact v3 allow-list: ${String(state.paramSet)}`);
  }

  const nx = requirePositiveSafeInteger(state.dims.nx, "dims.nx");
  const ny = requirePositiveSafeInteger(state.dims.ny, "dims.ny");
  const nz = requirePositiveSafeInteger(state.dims.nz, "dims.nz");
  const plane = safeMultiply(nx, ny, "cell-plane size");
  const n = safeMultiply(plane, nz, "cell count");
  if (n <= 0 || n > MAX_SIGNED_INDEX_CELL_COUNT) {
    fail(`cell count must be in [1, ${MAX_SIGNED_INDEX_CELL_COUNT}] for v3 production`);
  }
  if (cellCount(state.dims) !== n) fail("cell count disagrees with lattice multiplication");

  if (!Array.isArray(state.center) || state.center.length !== 3) {
    fail("center must contain exactly three coordinates");
  }
  for (let axis = 0; axis < 3; axis++) {
    const coordinate = state.center[axis];
    const limit = axis === 0 ? nx : axis === 1 ? ny : nz;
    if (!Number.isSafeInteger(coordinate) || coordinate < 0 || coordinate >= limit) {
      fail(`center[${axis}] must be an in-domain safe integer`);
    }
  }

  requireSafeInteger(state.tick, "tick");
  requireUint32(state.rngSeed, "rngSeed");
  const noise = requireFinite(state.noiseEpsilon, "noiseEpsilon");
  if (noise < 0 || noise > 1) fail("noiseEpsilon must be in [0, 1]");
  const tempC = requireFinite(state.tempC, "tempC");
  if (tempC < -50 || tempC > -1) fail("tempC must be in [-50, -1]");
  const sigmaInfinity = requirePositiveFinite(state.sigmaInfinity, "sigmaInfinity");
  const dxUm = requirePositiveFinite(state.dxUm, "dxUm");
  const pressurePa = requirePositiveFinite(state.pressurePa, "pressurePa");
  const cflFill = requireFinite(state.cflFill, "cflFill");
  if (!(cflFill > 0 && cflFill < 1)) fail("cflFill must be in (0, 1)");
  requirePositiveFinite(state.relaxTol, "relaxTol");
  requirePositiveFinite(state.divTol, "divTol");
  requirePositiveSafeInteger(state.relaxMaxSweeps, "relaxMaxSweeps");

  const dxM = dxUm * 1e-6;
  const vKinMS = vKin(tempC);
  const x0M = kineticLength(tempC, pressurePa);
  const mIceLedger = mIce(tempC);
  for (const [name, value] of [
    ["derived dxM", dxM],
    ["derived vKinMS", vKinMS],
    ["derived X_0", x0M],
    ["derived M_ice", mIceLedger],
    ["derived dxM/X_0", dxM / x0M],
    ["derived maximum kinetic fill-rate scale", (6 * vKinMS * sigmaInfinity) / dxM],
  ] as const) {
    if (!Number.isFinite(value) || !(value > 0)) fail(`${name} must be finite and positive`);
  }

  return n;
}

function validateConstantEnvironmentEligibility(state: LKResumeSnapshotV3): void {
  requireCanonicalZero(
    state.acceptedEnvironmentEventCount,
    "acceptedEnvironmentEventCount for constant-environment v3",
  );
  requireCanonicalZero(
    state.closedPlacedFillVaporUnits,
    "closedPlacedFillVaporUnits",
  );
  requireCanonicalZero(
    state.currentTemperatureSegmentStartFill,
    "currentTemperatureSegmentStartFill",
  );
  if (state.testHookEverUsed !== false) fail("testHookEverUsed must be false for v3 export");
}

function validateArrayShapes(
  state: Pick<LKResumeSnapshotV3 | LKResumeAdoptedStateV3, "a" | "f" | "sigma">,
  n: number,
): void {
  if (!(state.a instanceof Uint8Array) || state.a.length !== n) {
    fail(`a must be a Uint8Array of length ${n}`);
  }
  if (!(state.f instanceof Float64Array) || state.f.length !== n) {
    fail(`f must be a Float64Array of length ${n}`);
  }
  if (!(state.sigma instanceof Float64Array) || state.sigma.length !== n) {
    fail(`sigma must be a Float64Array of length ${n}`);
  }
}

interface DynamicStateInput {
  readonly tick: number;
  readonly relaxTol: number;
  readonly divTol: number;
  readonly relaxMaxSweeps: number;
  readonly attachedCount: number;
  readonly holeFillCountTotal: number;
  readonly lastAttached: readonly number[];
  readonly simTimeSeconds: number;
  readonly volumeRateM3PerS: number;
  readonly lastMaxFillVelocityMS: number;
  readonly fillLedger: number;
  readonly holeFillDeficit: number;
  readonly saturationClippedFill: number;
  readonly lastRelaxation: LKResumeRelaxationReportV3 | null;
}

function validateDynamicState(state: DynamicStateInput): Float64Array {
  const values = [
    state.simTimeSeconds,
    state.volumeRateM3PerS,
    state.lastMaxFillVelocityMS,
    state.fillLedger,
    state.holeFillDeficit,
    state.saturationClippedFill,
  ] as const;
  const names = [
    "simTimeSeconds",
    "volumeRateM3PerS",
    "lastMaxFillVelocityMS",
    "fillLedger",
    "holeFillDeficit",
    "saturationClippedFill",
  ] as const;
  const scalars = new Float64Array(RESUME_SCALAR_COUNT);
  for (let slot = 0; slot < values.length; slot++) {
    const value = requireFinite(values[slot], names[slot]);
    if (value < 0) fail(`${names[slot]} must be nonnegative`);
    validateCanonicalZeroWhenZero(value, names[slot]);
    scalars[slot] = value;
  }

  const holeFillCountTotal = requireSafeInteger(
    state.holeFillCountTotal,
    "holeFillCountTotal",
  );
  if (holeFillCountTotal > state.attachedCount) {
    fail("holeFillCountTotal cannot exceed attachedCount");
  }
  if (holeFillCountTotal === 0) {
    if (state.holeFillDeficit !== 0) {
      fail("positive holeFillDeficit requires positive holeFillCountTotal");
    }
    requireCanonicalZero(state.holeFillDeficit, "holeFillDeficit when no hole fill occurred");
  } else if (!(state.holeFillDeficit > 0)) {
    fail("positive holeFillCountTotal requires positive holeFillDeficit");
  }

  const report = state.lastRelaxation;
  if ((state.tick === 0) !== (report === null)) {
    fail("last relaxation must be absent if and only if tick is zero");
  }
  if (state.tick === 0) {
    if (state.lastAttached.length !== 0) fail("tick-zero lastAttached must be empty");
    if (holeFillCountTotal !== 0) fail("tick-zero holeFillCountTotal must be zero");
    for (let slot = 0; slot < 6; slot++) {
      requireCanonicalZero(scalars[slot], `tick-zero resumeScalars[${slot}]`);
    }
    return scalars;
  }

  if (report === null) fail("nonzero tick requires a last relaxation report");
  const sweeps = requirePositiveSafeInteger(report.sweeps, "lastRelaxation.sweeps");
  if (sweeps > state.relaxMaxSweeps) {
    fail("lastRelaxation.sweeps exceeds relaxMaxSweeps");
  }
  const residual = requireFinite(report.residual, "lastRelaxation.residual");
  const divergence = requireFinite(
    report.divergenceResidual,
    "lastRelaxation.divergenceResidual",
  );
  if (residual < 0 || !(residual < state.relaxTol)) {
    fail("lastRelaxation.residual must be nonnegative and strictly below relaxTol");
  }
  if (divergence < 0 || !(divergence < state.divTol)) {
    fail("lastRelaxation.divergenceResidual must be nonnegative and strictly below divTol");
  }
  validateCanonicalZeroWhenZero(residual, "lastRelaxation.residual");
  validateCanonicalZeroWhenZero(divergence, "lastRelaxation.divergenceResidual");
  const shellClamp = requireFinite(
    report.shellClampDiagnostic,
    "lastRelaxation.shellClampDiagnostic",
  );
  const surfaceExchange = requireFinite(
    report.surfaceExchangeDiagnostic,
    "lastRelaxation.surfaceExchangeDiagnostic",
  );
  const smootherDrift = requireFinite(
    report.smootherDriftDiagnostic,
    "lastRelaxation.smootherDriftDiagnostic",
  );
  const minLocal = requireFinite(
    report.minLocalSurfaceExchangeDiagnostic,
    "lastRelaxation.minLocalSurfaceExchangeDiagnostic",
  );
  for (const [name, value] of [
    ["lastRelaxation.shellClampDiagnostic", shellClamp],
    ["lastRelaxation.surfaceExchangeDiagnostic", surfaceExchange],
    ["lastRelaxation.smootherDriftDiagnostic", smootherDrift],
    ["lastRelaxation.minLocalSurfaceExchangeDiagnostic", minLocal],
  ] as const) {
    validateCanonicalZeroWhenZero(value, name);
  }
  const recomputedDivergence =
    Math.abs(shellClamp + smootherDrift - surfaceExchange) /
    Math.max(Math.abs(surfaceExchange), 1e-300);
  if (!sameFloatBits(recomputedDivergence, divergence)) {
    fail("lastRelaxation.divergenceResidual does not match the exact v6 identity");
  }
  const derivedConverged = residual < state.relaxTol && divergence < state.divTol;
  if (report.converged !== derivedConverged || report.converged !== true) {
    fail("lastRelaxation.converged does not match the strict dual criteria");
  }
  scalars[6] = residual;
  scalars[7] = divergence;
  scalars[8] = shellClamp;
  scalars[9] = surfaceExchange;
  scalars[10] = smootherDrift;
  scalars[11] = minLocal;
  return scalars;
}

interface TopologyInput {
  readonly dims: Dims;
  readonly center: readonly [number, number, number];
  readonly dxUm: number;
  readonly a: Uint8Array;
  readonly f: Float64Array;
  readonly sigma: Float64Array;
  readonly boundaryOrder: readonly number[];
  readonly lastAttached: readonly number[];
  readonly activeCellCount: number;
  readonly shellCellCount: number;
  readonly hexRadius: number;
  readonly zHalfExtent: number;
  readonly attachedCount: number;
}

function allocateUint8(length: number, name: string): Uint8Array {
  try {
    return new Uint8Array(length);
  } catch (error) {
    fail(`${name} allocation failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function allocateFloat64(length: number, name: string): Float64Array {
  try {
    return new Float64Array(length);
  } catch (error) {
    fail(`${name} allocation failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function allocateInt32(length: number, name: string): Int32Array {
  try {
    return new Int32Array(length);
  } catch (error) {
    fail(`${name} allocation failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function countAttachedNeighbors(
  a: Uint8Array,
  dims: Dims,
  i: number,
  j: number,
  k: number,
): readonly [number, number] {
  const { nx, ny, nz } = dims;
  const plane = nx * ny;
  const base = k * plane + j * nx + i;
  let nT = 0;
  let nZ = 0;
  if (i + 1 < nx) nT += a[base + 1];
  if (i - 1 >= 0) nT += a[base - 1];
  if (j + 1 < ny) nT += a[base + nx];
  if (j - 1 >= 0) nT += a[base - nx];
  if (i + 1 < nx && j - 1 >= 0) nT += a[base + 1 - nx];
  if (i - 1 >= 0 && j + 1 < ny) nT += a[base - 1 + nx];
  if (k + 1 < nz) nZ += a[base + plane];
  if (k - 1 >= 0) nZ += a[base - plane];
  return [nT, nZ];
}

function validateTopology(
  state: TopologyInput,
  n: number,
  buildOwnedTopology: boolean,
): LKResumeValidatedTopologyV3 | null {
  requireSafeInteger(state.activeCellCount, "topology.activeCellCount");
  requireSafeInteger(state.shellCellCount, "topology.shellCellCount");
  requireSafeInteger(state.hexRadius, "topology.hexRadius");
  requireSafeInteger(state.zHalfExtent, "topology.zHalfExtent");
  requireSafeInteger(state.attachedCount, "topology.attachedCount");
  if (state.activeCellCount > n || state.shellCellCount > state.activeCellCount) {
    fail("topology active/shell counts exceed the domain");
  }
  if (!Array.isArray(state.boundaryOrder) || !Array.isArray(state.lastAttached)) {
    fail("boundaryOrder and lastAttached must be arrays");
  }
  if (state.boundaryOrder.length > n || state.lastAttached.length > n) {
    fail("ordered topology list length exceeds the cell count");
  }

  const [ic, jc, kc] = state.center;
  const { nx, ny } = state.dims;
  const radius = Math.min(ic, nx - 1 - ic, jc, ny - 1 - jc);
  const halfZ = Math.min(kc, state.dims.nz - 1 - kc);
  const hexPlaneCount = safeAdd(
    safeMultiply(3, safeMultiply(radius, radius + 1, "hex-plane radius product"), "hex-plane scale"),
    1,
    "hex-plane cell count",
  );
  const activeExpected = safeMultiply(hexPlaneCount, 2 * halfZ + 1, "active-cell count");
  const interiorPlaneCount =
    radius > 0
      ? safeAdd(
          safeMultiply(
            3,
            safeMultiply(radius - 1, radius, "interior hex-plane radius product"),
            "interior hex-plane scale",
          ),
          1,
          "interior hex-plane cell count",
        )
      : 0;
  const interiorExpected =
    radius > 0 && halfZ > 0
      ? safeMultiply(interiorPlaneCount, 2 * halfZ - 1, "interior-cell count")
      : 0;
  const shellExpected = activeExpected - interiorExpected;
  if (
    state.hexRadius !== radius ||
    state.zHalfExtent !== halfZ ||
    state.activeCellCount !== activeExpected ||
    state.shellCellCount !== shellExpected
  ) {
    fail("stored active/shell counts or hex extents do not match the recomputed domain");
  }

  const wall = buildOwnedTopology ? allocateUint8(n, "wall topology") : null;
  const blocked = buildOwnedTopology ? allocateUint8(n, "blocked topology") : null;
  // In decode mode this final array is also the serialized-order membership witness. That
  // avoids carrying a second full-domain byte array (about 393 MiB at the contemplated 744^3
  // configuration) merely to encode the same boundary set during validation.
  const inBoundary = buildOwnedTopology ? allocateUint8(n, "boundary topology") : null;
  const seen = inBoundary ?? allocateUint8(n, "ordered-list witness");
  for (let position = 0; position < state.boundaryOrder.length; position++) {
    const index = state.boundaryOrder[position];
    if (!Number.isSafeInteger(index) || index < 0 || index >= n) {
      fail(`boundaryOrder[${position}] must be an in-range integer`);
    }
    if (seen[index] !== 0) fail(`boundaryOrder contains duplicate index ${index}`);
    seen[index] = 1;
  }

  const nTAtt = buildOwnedTopology ? allocateUint8(n, "in-plane neighbor topology") : null;
  const nZAtt = buildOwnedTopology ? allocateUint8(n, "vertical neighbor topology") : null;
  const dirichletCells = buildOwnedTopology
    ? allocateInt32(shellExpected, "Dirichlet-cell topology")
    : null;
  const shellRadiusM = buildOwnedTopology
    ? allocateFloat64(shellExpected, "shell-radius topology")
    : null;

  let activeCount = 0;
  let shellCount = 0;
  let attachedCount = 0;
  let boundaryCount = 0;
  let iMin = Infinity;
  let iMax = -Infinity;
  let jMin = Infinity;
  let jMax = -Infinity;
  let kMin = Infinity;
  let kMax = -Infinity;
  const dxM = state.dxUm * 1e-6;
  const plane = nx * ny;
  for (let index = 0; index < n; index++) {
    const k = Math.floor(index / plane);
    const inPlane = index - k * plane;
    const j = Math.floor(inPlane / nx);
    const i = inPlane - j * nx;
    const distance = hexDistance(i - ic, j - jc);
    const active = distance <= radius && Math.abs(k - kc) <= halfZ;
    const shell = active && (distance === radius || Math.abs(k - kc) === halfZ);
    const a = state.a[index];
    const f = state.f[index];
    const sigma = state.sigma[index];
    if (a !== 0 && a !== 1) fail(`a[${index}] must be binary`);
    if (!Number.isFinite(f) || f < 0 || f > 1) fail(`f[${index}] must be finite and in [0, 1]`);
    validateCanonicalZeroWhenZero(f, `f[${index}]`);
    if (!Number.isFinite(sigma) || sigma < -1) fail(`sigma[${index}] must be finite and >= -1`);

    const [nT, nZ] = countAttachedNeighbors(state.a, state.dims, i, j, k);
    const boundary = active && a === 0 && nT + nZ > 0;
    if (!active) {
      if (a !== 0) fail(`masked wall cell ${index} must have a=0`);
      requireCanonicalZero(f, `masked wall f[${index}]`);
      requireCanonicalZero(sigma, `masked wall sigma[${index}]`);
      if (wall !== null && blocked !== null) {
        wall[index] = 1;
        blocked[index] = 1;
      }
    } else {
      activeCount++;
      if (shell) {
        if (dirichletCells !== null && shellRadiusM !== null) {
          dirichletCells[shellCount] = index;
          const di = i - ic;
          const dj = j - jc;
          const dk = k - kc;
          const squared = di * di + di * dj + dj * dj + dk * dk;
          const radiusM = Math.sqrt(squared) * dxM;
          if (!Number.isFinite(radiusM) || !(radiusM > 0)) {
            fail("monopole-matched shell requires every shell cell off-centre");
          }
          shellRadiusM[shellCount] = radiusM;
        }
        shellCount++;
      }
      if (a === 1) {
        attachedCount++;
        if (f !== 1) fail(`attached cell ${index} must have f=1`);
        requireCanonicalZero(sigma, `attached sigma[${index}]`);
        if (blocked !== null) blocked[index] = 1;
        if (i < iMin) iMin = i;
        if (i > iMax) iMax = i;
        if (j < jMin) jMin = j;
        if (j > jMax) jMax = j;
        if (k < kMin) kMin = k;
        if (k > kMax) kMax = k;
      } else if (boundary) {
        boundaryCount++;
      } else {
        requireCanonicalZero(f, `active non-boundary f[${index}]`);
      }
    }
    if (seen[index] !== (boundary ? 1 : 0)) {
      fail(`boundaryOrder is not an exact permutation of the boundary set at index ${index}`);
    }
    if (nTAtt !== null && nZAtt !== null) {
      nTAtt[index] = nT;
      nZAtt[index] = nZ;
    }
  }
  if (
    activeCount !== activeExpected ||
    shellCount !== shellExpected ||
    attachedCount !== state.attachedCount ||
    boundaryCount !== state.boundaryOrder.length
  ) {
    fail("stored topology counts do not match the independently recomputed fields");
  }

  if (buildOwnedTopology) {
    if (blocked === null) fail("internal blocked topology construction failed");
    // Attached cells already carry blocked=1. Temporarily mark last-attachment membership as 2,
    // then restore 1. No second full-domain duplicate witness is needed.
    for (let position = 0; position < state.lastAttached.length; position++) {
      const index = state.lastAttached[position];
      if (!Number.isSafeInteger(index) || index < 0 || index >= n) {
        fail(`lastAttached[${position}] must be an in-range integer`);
      }
      if (state.a[index] !== 1) fail(`lastAttached index ${index} is not attached`);
      if (blocked[index] === 2) fail(`lastAttached contains duplicate index ${index}`);
      blocked[index] = 2;
      const [i, j, k] = coordsOf(state.dims, index);
      if (hexDistance(i - ic, j - jc) > radius || Math.abs(k - kc) > halfZ) {
        fail(`lastAttached index ${index} is not active`);
      }
    }
    for (const index of state.lastAttached) blocked[index] = 1;
  } else {
    seen.fill(0);
    for (let position = 0; position < state.lastAttached.length; position++) {
      const index = state.lastAttached[position];
      if (!Number.isSafeInteger(index) || index < 0 || index >= n) {
        fail(`lastAttached[${position}] must be an in-range integer`);
      }
      if (seen[index] !== 0) fail(`lastAttached contains duplicate index ${index}`);
      seen[index] = 1;
      if (state.a[index] !== 1) fail(`lastAttached index ${index} is not attached`);
      const [i, j, k] = coordsOf(state.dims, index);
      if (hexDistance(i - ic, j - jc) > radius || Math.abs(k - kc) > halfZ) {
        fail(`lastAttached index ${index} is not active`);
      }
    }
  }

  if (!buildOwnedTopology) return null;
  if (
    wall === null ||
    blocked === null ||
    inBoundary === null ||
    nTAtt === null ||
    nZAtt === null ||
    dirichletCells === null ||
    shellRadiusM === null
  ) {
    fail("internal topology construction failed");
  }
  return {
    wall,
    blocked,
    inBoundary,
    nTAtt,
    nZAtt,
    dirichletCells,
    shellRadiusM,
    activeCellCount: activeCount,
    shellCellCount: shellCount,
    hexRadius: radius,
    zHalfExtent: halfZ,
    attachedCount,
    iMin,
    iMax,
    jMin,
    jMax,
    kMin,
    kMax,
  };
}

function validateLayout(
  n: number,
  boundaryCount: number,
  lastAttachedCount: number,
  headerLength: number,
): ValidatedLayout {
  requirePositiveSafeInteger(n, "layout cell count");
  requireSafeInteger(boundaryCount, "layout boundary count");
  requireSafeInteger(lastAttachedCount, "layout last-attachment count");
  requirePositiveSafeInteger(headerLength, "header length");
  if (headerLength > MAX_LK_RESUME_HEADER_BYTES || headerLength > 0xffff_ffff) {
    fail(`header length exceeds ${MAX_LK_RESUME_HEADER_BYTES} bytes`);
  }
  if (boundaryCount > n) fail("boundary count exceeds the cell count");
  if (lastAttachedCount > n) fail("last-attachment count exceeds the cell count");
  if (n - 1 > 0xffff_ffff) fail("wire index representation exceeds uint32");
  let payloadLength = n;
  payloadLength = safeAdd(payloadLength, safeMultiply(8, n, "f byte length"), "a+f payload");
  payloadLength = safeAdd(
    payloadLength,
    safeMultiply(8, n, "sigma byte length"),
    "main-field payload",
  );
  payloadLength = safeAdd(
    payloadLength,
    safeMultiply(4, boundaryCount, "boundary-order byte length"),
    "boundary payload",
  );
  payloadLength = safeAdd(
    payloadLength,
    safeMultiply(4, lastAttachedCount, "last-attachment byte length"),
    "last-attachment payload",
  );
  payloadLength = safeAdd(
    payloadLength,
    safeMultiply(8, RESUME_SCALAR_COUNT, "resume-scalar byte length"),
    "resume payload",
  );
  const byteLength = safeAdd(
    safeAdd(PREAMBLE_BYTES, headerLength, "fixed-header byte length"),
    payloadLength,
    "total checkpoint byte length",
  );
  return { n, boundaryCount, lastAttachedCount, payloadLength, byteLength };
}

interface CanonicalHeaderInput {
  readonly dims: Dims;
  readonly tick: number;
  readonly rngSeed: number;
  readonly noiseEpsilon: number;
  readonly center: readonly [number, number, number];
  readonly tempC: number;
  readonly sigmaInfinity: number;
  readonly dxUm: number;
  readonly pressurePa: number;
  readonly paramSet: LKResumeParamSetV3;
  readonly cflFill: number;
  readonly relaxTol: number;
  readonly divTol: number;
  readonly relaxMaxSweeps: number;
  readonly activeCellCount: number;
  readonly shellCellCount: number;
  readonly hexRadius: number;
  readonly zHalfExtent: number;
  readonly attachedCount: number;
  readonly boundaryCount: number;
  readonly lastAttachedCount: number;
  readonly holeFillCountTotal: number;
  readonly lastRelaxationPresent: boolean;
  readonly lastRelaxationSweeps: number;
  readonly lastRelaxationConverged: boolean;
  readonly resumeScalarNullMask: number;
  readonly n: number;
}

function buildCanonicalHeader(input: CanonicalHeaderInput): LKResumeCheckpointHeaderV3 {
  return {
    version: 3,
    rule: "LibbrechtKinetics",
    checkpointKind: "lk-resume",
    endianness: "LE",
    resumePhase: "cycle-boundary",
    cycleState: "boundary",
    timelineMode: "none",
    dims: { nx: input.dims.nx, ny: input.dims.ny, nz: input.dims.nz },
    tick: input.tick,
    rngSeed: input.rngSeed,
    noiseEpsilon: f64ToHex(input.noiseEpsilon),
    domain: "hexPrism",
    center: [input.center[0], input.center[1], input.center[2]],
    tempC: f64ToHex(input.tempC),
    sigmaInfinity: f64ToHex(input.sigmaInfinity),
    dxUm: f64ToHex(input.dxUm),
    pressurePa: f64ToHex(input.pressurePa),
    paramSet: input.paramSet,
    cflFill: f64ToHex(input.cflFill),
    relaxTol: f64ToHex(input.relaxTol),
    divTol: f64ToHex(input.divTol),
    relaxMaxSweeps: input.relaxMaxSweeps,
    surfacePolicy: "aggregate-hv-g1h1-v6",
    farField: "monopole-matched",
    topology: {
      activeCellCount: input.activeCellCount,
      shellCellCount: input.shellCellCount,
      hexRadius: input.hexRadius,
      zHalfExtent: input.zHalfExtent,
      attachedCount: input.attachedCount,
      boundaryCount: input.boundaryCount,
      lastAttachedCount: input.lastAttachedCount,
    },
    solverCounters: {
      holeFillCountTotal: input.holeFillCountTotal,
      lastRelaxationPresent: input.lastRelaxationPresent,
      lastRelaxationSweeps: input.lastRelaxationSweeps,
      lastRelaxationConverged: input.lastRelaxationConverged,
      resumeScalarNullMask: input.resumeScalarNullMask,
    },
    fields: [
      { name: "a", dtype: "u8", length: input.n },
      { name: "f", dtype: "f64", length: input.n },
      { name: "sigma", dtype: "f64", length: input.n },
      { name: "boundaryOrder", dtype: "u32", length: input.boundaryCount },
      { name: "lastAttached", dtype: "u32", length: input.lastAttachedCount },
      { name: "resumeScalars", dtype: "f64", length: RESUME_SCALAR_COUNT },
    ],
  };
}

function canonicalHeaderFromState(
  state: LKResumeSnapshotV3,
  n: number,
): LKResumeCheckpointHeaderV3 {
  const report = state.lastRelaxation;
  return buildCanonicalHeader({
    dims: state.dims,
    tick: state.tick,
    rngSeed: state.rngSeed,
    noiseEpsilon: state.noiseEpsilon,
    center: state.center,
    tempC: state.tempC,
    sigmaInfinity: state.sigmaInfinity,
    dxUm: state.dxUm,
    pressurePa: state.pressurePa,
    paramSet: state.paramSet,
    cflFill: state.cflFill,
    relaxTol: state.relaxTol,
    divTol: state.divTol,
    relaxMaxSweeps: state.relaxMaxSweeps,
    activeCellCount: state.activeCellCount,
    shellCellCount: state.shellCellCount,
    hexRadius: state.hexRadius,
    zHalfExtent: state.zHalfExtent,
    attachedCount: state.attachedCount,
    boundaryCount: state.boundaryOrder.length,
    lastAttachedCount: state.lastAttached.length,
    holeFillCountTotal: state.holeFillCountTotal,
    lastRelaxationPresent: report !== null,
    lastRelaxationSweeps: report?.sweeps ?? 0,
    lastRelaxationConverged: report?.converged ?? false,
    resumeScalarNullMask: report === null ? ABSENT_REPORT_NULL_MASK : 0,
    n,
  });
}

interface ParsedResumeHeader {
  readonly header: LKResumeCheckpointHeaderV3;
  readonly n: number;
  readonly tick: number;
  readonly rngSeed: number;
  readonly noiseEpsilon: number;
  readonly dims: { readonly nx: number; readonly ny: number; readonly nz: number };
  readonly center: readonly [number, number, number];
  readonly tempC: number;
  readonly sigmaInfinity: number;
  readonly dxUm: number;
  readonly pressurePa: number;
  readonly paramSet: LKResumeParamSetV3;
  readonly cflFill: number;
  readonly relaxTol: number;
  readonly divTol: number;
  readonly relaxMaxSweeps: number;
  readonly activeCellCount: number;
  readonly shellCellCount: number;
  readonly hexRadius: number;
  readonly zHalfExtent: number;
  readonly attachedCount: number;
  readonly boundaryCount: number;
  readonly lastAttachedCount: number;
  readonly holeFillCountTotal: number;
  readonly lastRelaxationPresent: boolean;
  readonly lastRelaxationSweeps: number;
  readonly lastRelaxationConverged: boolean;
  readonly resumeScalarNullMask: number;
}

function parseCanonicalHeader(headerBytes: Uint8Array): ParsedResumeHeader {
  let text: string;
  try {
    text = fatalTextDecoder.decode(headerBytes);
  } catch (error) {
    fail(`header is not fatal-valid UTF-8: ${error instanceof Error ? error.message : String(error)}`);
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    fail(`header is not valid JSON: ${error instanceof Error ? error.message : String(error)}`);
  }
  const record = requireRecord(parsed, "header");
  if (record.version === 1 || record.version === 2) {
    fail(`resume decoder rejects legacy LK/GG version ${String(record.version)} by name`);
  }
  if (record.version !== 3) fail(`unsupported resume version ${String(record.version)}`);
  requireExactKeys(record, HEADER_KEYS, "header");
  for (const [key, expected] of [
    ["rule", "LibbrechtKinetics"],
    ["checkpointKind", "lk-resume"],
    ["endianness", "LE"],
    ["resumePhase", "cycle-boundary"],
    ["cycleState", "boundary"],
    ["timelineMode", "none"],
    ["domain", "hexPrism"],
    ["surfacePolicy", "aggregate-hv-g1h1-v6"],
    ["farField", "monopole-matched"],
  ] as const) {
    if (record[key] !== expected) fail(`${key} must be ${expected}`);
  }

  const dimsRecord = requireRecord(record.dims, "dims");
  requireExactKeys(dimsRecord, DIMS_KEYS, "dims");
  const dims = Object.freeze({
    nx: requirePositiveSafeInteger(dimsRecord.nx, "dims.nx"),
    ny: requirePositiveSafeInteger(dimsRecord.ny, "dims.ny"),
    nz: requirePositiveSafeInteger(dimsRecord.nz, "dims.nz"),
  });
  const n = safeMultiply(
    safeMultiply(dims.nx, dims.ny, "cell-plane size"),
    dims.nz,
    "cell count",
  );
  if (n > MAX_SIGNED_INDEX_CELL_COUNT) {
    fail(`cell count exceeds the v3 signed-index ceiling ${MAX_SIGNED_INDEX_CELL_COUNT}`);
  }
  const tick = requireSafeInteger(record.tick, "tick");
  const rngSeed = requireUint32(record.rngSeed, "rngSeed");
  if (!Array.isArray(record.center) || record.center.length !== 3) {
    fail("center must be an exact three-element array");
  }
  const center: readonly [number, number, number] = Object.freeze([
    requireSafeInteger(record.center[0], "center[0]"),
    requireSafeInteger(record.center[1], "center[1]"),
    requireSafeInteger(record.center[2], "center[2]"),
  ]);
  for (let axis = 0; axis < 3; axis++) {
    const limit = axis === 0 ? dims.nx : axis === 1 ? dims.ny : dims.nz;
    if (center[axis] >= limit) fail(`center[${axis}] is outside dims`);
  }
  const noiseEpsilon = hexToF64(record.noiseEpsilon, "noiseEpsilon");
  const tempC = hexToF64(record.tempC, "tempC");
  const sigmaInfinity = hexToF64(record.sigmaInfinity, "sigmaInfinity");
  const dxUm = hexToF64(record.dxUm, "dxUm");
  const pressurePa = hexToF64(record.pressurePa, "pressurePa");
  const cflFill = hexToF64(record.cflFill, "cflFill");
  const relaxTol = hexToF64(record.relaxTol, "relaxTol");
  const divTol = hexToF64(record.divTol, "divTol");
  const relaxMaxSweeps = requirePositiveSafeInteger(record.relaxMaxSweeps, "relaxMaxSweeps");
  const paramSet = record.paramSet;
  if (paramSet !== "CAK" && paramSet !== "M1" && paramSet !== "M1_NO_DIP_ABLATION") {
    fail(`paramSet is outside the exact v3 allow-list: ${String(paramSet)}`);
  }

  const topology = requireRecord(record.topology, "topology");
  requireExactKeys(topology, TOPOLOGY_KEYS, "topology");
  const activeCellCount = requireSafeInteger(topology.activeCellCount, "topology.activeCellCount");
  const shellCellCount = requireSafeInteger(topology.shellCellCount, "topology.shellCellCount");
  const hexRadius = requireSafeInteger(topology.hexRadius, "topology.hexRadius");
  const zHalfExtent = requireSafeInteger(topology.zHalfExtent, "topology.zHalfExtent");
  const attachedCount = requireSafeInteger(topology.attachedCount, "topology.attachedCount");
  const boundaryCount = requireSafeInteger(topology.boundaryCount, "topology.boundaryCount");
  const lastAttachedCount = requireSafeInteger(
    topology.lastAttachedCount,
    "topology.lastAttachedCount",
  );
  for (const [name, count] of [
    ["activeCellCount", activeCellCount],
    ["shellCellCount", shellCellCount],
    ["attachedCount", attachedCount],
    ["boundaryCount", boundaryCount],
    ["lastAttachedCount", lastAttachedCount],
  ] as const) {
    if (count > n) fail(`topology.${name} exceeds the cell count`);
  }

  const counters = requireRecord(record.solverCounters, "solverCounters");
  requireExactKeys(counters, COUNTER_KEYS, "solverCounters");
  const holeFillCountTotal = requireSafeInteger(
    counters.holeFillCountTotal,
    "solverCounters.holeFillCountTotal",
  );
  if (typeof counters.lastRelaxationPresent !== "boolean") {
    fail("solverCounters.lastRelaxationPresent must be boolean");
  }
  if (typeof counters.lastRelaxationConverged !== "boolean") {
    fail("solverCounters.lastRelaxationConverged must be boolean");
  }
  const lastRelaxationPresent = counters.lastRelaxationPresent;
  const lastRelaxationSweeps = requireSafeInteger(
    counters.lastRelaxationSweeps,
    "solverCounters.lastRelaxationSweeps",
  );
  const lastRelaxationConverged = counters.lastRelaxationConverged;
  const resumeScalarNullMask = requireSafeInteger(
    counters.resumeScalarNullMask,
    "solverCounters.resumeScalarNullMask",
  );
  if (!lastRelaxationPresent) {
    if (
      lastRelaxationSweeps !== 0 ||
      lastRelaxationConverged !== false ||
      resumeScalarNullMask !== ABSENT_REPORT_NULL_MASK
    ) {
      fail("absent relaxation counters must be sweeps=0, converged=false, nullMask=4032");
    }
  } else if (
    lastRelaxationSweeps < 1 ||
    lastRelaxationSweeps > relaxMaxSweeps ||
    lastRelaxationConverged !== true ||
    resumeScalarNullMask !== 0
  ) {
    fail("present relaxation counters must name a converged in-range report with nullMask=0");
  }
  if ((tick === 0) !== !lastRelaxationPresent) {
    fail("report presence must be equivalent to tick being nonzero");
  }

  if (!Array.isArray(record.fields) || record.fields.length !== 6) {
    fail("fields must be an exact six-element array");
  }
  const expectedFields: ReadonlyArray<readonly [LKResumeFieldNameV3, LKResumeFieldDtypeV3, number]> = [
    ["a", "u8", n],
    ["f", "f64", n],
    ["sigma", "f64", n],
    ["boundaryOrder", "u32", boundaryCount],
    ["lastAttached", "u32", lastAttachedCount],
    ["resumeScalars", "f64", RESUME_SCALAR_COUNT],
  ];
  for (let index = 0; index < expectedFields.length; index++) {
    const descriptor = requireRecord(record.fields[index], `fields[${index}]`);
    requireExactKeys(descriptor, FIELD_KEYS, `fields[${index}]`);
    const expected = expectedFields[index];
    if (
      descriptor.name !== expected[0] ||
      descriptor.dtype !== expected[1] ||
      descriptor.length !== expected[2]
    ) {
      fail(`fields[${index}] does not match ${expected[0]}:${expected[1]}[${expected[2]}]`);
    }
  }

  const canonical = buildCanonicalHeader({
    dims,
    tick,
    rngSeed,
    noiseEpsilon,
    center,
    tempC,
    sigmaInfinity,
    dxUm,
    pressurePa,
    paramSet,
    cflFill,
    relaxTol,
    divTol,
    relaxMaxSweeps,
    activeCellCount,
    shellCellCount,
    hexRadius,
    zHalfExtent,
    attachedCount,
    boundaryCount,
    lastAttachedCount,
    holeFillCountTotal,
    lastRelaxationPresent,
    lastRelaxationSweeps,
    lastRelaxationConverged,
    resumeScalarNullMask,
    n,
  });
  const canonicalBytes = textEncoder.encode(JSON.stringify(canonical));
  if (!bytesEqual(canonicalBytes, headerBytes)) {
    fail("header bytes are not the exact canonical JSON encoding");
  }

  return {
    header: canonical,
    n,
    tick,
    rngSeed,
    noiseEpsilon,
    dims,
    center,
    tempC,
    sigmaInfinity,
    dxUm,
    pressurePa,
    paramSet,
    cflFill,
    relaxTol,
    divTol,
    relaxMaxSweeps,
    activeCellCount,
    shellCellCount,
    hexRadius,
    zHalfExtent,
    attachedCount,
    boundaryCount,
    lastAttachedCount,
    holeFillCountTotal,
    lastRelaxationPresent,
    lastRelaxationSweeps,
    lastRelaxationConverged,
    resumeScalarNullMask,
  };
}

function assertStreamChunk(chunk: Uint8Array, name: string): void {
  if (!(chunk instanceof Uint8Array)) fail(`${name} must be a Uint8Array`);
  if (chunk.byteLength <= 0 || chunk.byteLength > LK_RESUME_STREAM_CHUNK_BYTES) {
    fail(`${name} must contain 1..${LK_RESUME_STREAM_CHUNK_BYTES} bytes`);
  }
}

async function writeChecked(
  sink: LKResumeByteSink,
  chunk: Uint8Array,
  readEpoch: () => number,
  epoch: number,
): Promise<void> {
  assertStreamChunk(chunk, "sink chunk");
  if (validateMutationEpoch(readEpoch()) !== epoch) {
    fail("solver mutated before an awaited resume-checkpoint sink write");
  }
  await sink.write(chunk);
  if (validateMutationEpoch(readEpoch()) !== epoch) {
    fail("solver mutated across an awaited resume-checkpoint sink write");
  }
}

async function writeU8Field(
  sink: LKResumeByteSink,
  values: Uint8Array,
  readEpoch: () => number,
  epoch: number,
): Promise<void> {
  for (let offset = 0; offset < values.length; ) {
    const count = Math.min(LK_RESUME_STREAM_CHUNK_BYTES, values.length - offset);
    await writeChecked(sink, values.subarray(offset, offset + count), readEpoch, epoch);
    offset += count;
  }
}

async function writeF64Field(
  sink: LKResumeByteSink,
  values: Float64Array,
  readEpoch: () => number,
  epoch: number,
): Promise<void> {
  const maxElements = LK_RESUME_STREAM_CHUNK_BYTES / 8;
  for (let elementOffset = 0; elementOffset < values.length; ) {
    const count = Math.min(maxElements, values.length - elementOffset);
    let bytes: Uint8Array;
    if (LITTLE_ENDIAN_PLATFORM) {
      bytes = new Uint8Array(
        values.buffer,
        values.byteOffset + elementOffset * 8,
        count * 8,
      );
    } else {
      bytes = new Uint8Array(count * 8);
      const view = new DataView(bytes.buffer);
      for (let index = 0; index < count; index++) {
        view.setFloat64(index * 8, values[elementOffset + index], true);
      }
    }
    await writeChecked(sink, bytes, readEpoch, epoch);
    elementOffset += count;
  }
}

async function writeU32List(
  sink: LKResumeByteSink,
  values: readonly number[],
  readEpoch: () => number,
  epoch: number,
): Promise<void> {
  const maxElements = LK_RESUME_STREAM_CHUNK_BYTES / 4;
  for (let elementOffset = 0; elementOffset < values.length; ) {
    const count = Math.min(maxElements, values.length - elementOffset);
    const bytes = new Uint8Array(count * 4);
    const view = new DataView(bytes.buffer);
    for (let index = 0; index < count; index++) {
      view.setUint32(index * 4, values[elementOffset + index], true);
    }
    await writeChecked(sink, bytes, readEpoch, epoch);
    elementOffset += count;
  }
}

function validateSource(source: LKResumeByteSource): number {
  if (typeof source !== "object" || source === null || typeof source.readExactly !== "function") {
    fail("source must implement readExactly(offset, target)");
  }
  if (!Number.isSafeInteger(source.byteLength) || source.byteLength < 0) {
    fail("source.byteLength must be a nonnegative safe integer");
  }
  return source.byteLength;
}

async function readChecked(
  source: LKResumeByteSource,
  sourceLength: number,
  offset: number,
  target: Uint8Array,
): Promise<number> {
  assertStreamChunk(target, "source read target");
  const end = safeAdd(offset, target.byteLength, "source read end offset");
  if (end > sourceLength) fail("source read crosses the declared byte length");
  await source.readExactly(offset, target);
  return end;
}

async function readU8Field(
  source: LKResumeByteSource,
  sourceLength: number,
  startOffset: number,
  target: Uint8Array,
): Promise<number> {
  let wireOffset = startOffset;
  for (let offset = 0; offset < target.length; ) {
    const count = Math.min(LK_RESUME_STREAM_CHUNK_BYTES, target.length - offset);
    wireOffset = await readChecked(
      source,
      sourceLength,
      wireOffset,
      target.subarray(offset, offset + count),
    );
    offset += count;
  }
  return wireOffset;
}

async function readF64Field(
  source: LKResumeByteSource,
  sourceLength: number,
  startOffset: number,
  target: Float64Array,
): Promise<number> {
  let wireOffset = startOffset;
  const maxElements = LK_RESUME_STREAM_CHUNK_BYTES / 8;
  for (let elementOffset = 0; elementOffset < target.length; ) {
    const count = Math.min(maxElements, target.length - elementOffset);
    if (LITTLE_ENDIAN_PLATFORM) {
      const bytes = new Uint8Array(
        target.buffer,
        target.byteOffset + elementOffset * 8,
        count * 8,
      );
      wireOffset = await readChecked(source, sourceLength, wireOffset, bytes);
    } else {
      const bytes = new Uint8Array(count * 8);
      wireOffset = await readChecked(source, sourceLength, wireOffset, bytes);
      const view = new DataView(bytes.buffer);
      for (let index = 0; index < count; index++) {
        target[elementOffset + index] = view.getFloat64(index * 8, true);
      }
    }
    elementOffset += count;
  }
  return wireOffset;
}

function allocateNumberArray(length: number, name: string): number[] {
  try {
    return new Array<number>(length);
  } catch (error) {
    fail(`${name} allocation failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function readU32List(
  source: LKResumeByteSource,
  sourceLength: number,
  startOffset: number,
  target: number[],
): Promise<number> {
  let wireOffset = startOffset;
  const maxElements = LK_RESUME_STREAM_CHUNK_BYTES / 4;
  for (let elementOffset = 0; elementOffset < target.length; ) {
    const count = Math.min(maxElements, target.length - elementOffset);
    const bytes = new Uint8Array(count * 4);
    wireOffset = await readChecked(source, sourceLength, wireOffset, bytes);
    const view = new DataView(bytes.buffer);
    for (let index = 0; index < count; index++) {
      target[elementOffset + index] = view.getUint32(index * 4, true);
    }
    elementOffset += count;
  }
  return wireOffset;
}

const decodedBrands = new WeakSet<object>();
const consumedDecoded = new WeakSet<object>();
const decodedOwnership = new WeakMap<object, LKResumeAdoptedStateV3>();

/** Atomically take the decoder-owned state. Missing brand, copies, and repeat takes fail. */
export function takeDecodedLKResumeCheckpointV3(
  decoded: DecodedLKResumeCheckpointV3,
): LKResumeAdoptedStateV3 {
  if (typeof decoded !== "object" || decoded === null || !decodedBrands.has(decoded)) {
    throw new Error("LK resume checkpoint ownership envelope is not decoder-branded");
  }
  if (consumedDecoded.has(decoded)) {
    throw new Error("LK resume checkpoint ownership envelope was already consumed");
  }
  const owned = decodedOwnership.get(decoded);
  if (owned === undefined) {
    throw new Error("LK resume checkpoint ownership envelope has no owned state");
  }
  consumedDecoded.add(decoded);
  decodedOwnership.delete(decoded);
  return owned;
}

export async function encodeLKResumeCheckpointV3(
  state: LKResumeStateV3,
  sink: LKResumeByteSink,
): Promise<LKResumeEncodingSummary> {
  if (typeof sink !== "object" || sink === null || typeof sink.write !== "function") {
    fail("sink must implement write(chunk)");
  }
  const { snapshot, epoch, readEpoch } = snapshotState(state);
  const n = validateControls(snapshot);
  validateConstantEnvironmentEligibility(snapshot);
  validateArrayShapes(snapshot, n);
  const resumeScalars = validateDynamicState(snapshot);
  validateTopology(snapshot, n, false);

  const header = canonicalHeaderFromState(snapshot, n);
  const headerBytes = textEncoder.encode(JSON.stringify(header));
  const layout = validateLayout(
    n,
    snapshot.boundaryOrder.length,
    snapshot.lastAttached.length,
    headerBytes.length,
  );
  if (validateMutationEpoch(readEpoch()) !== epoch) {
    fail("solver mutated before resume-checkpoint streaming began");
  }

  const preamble = new Uint8Array(PREAMBLE_BYTES);
  for (let index = 0; index < CHECKPOINT_MAGIC.length; index++) {
    preamble[index] = CHECKPOINT_MAGIC.charCodeAt(index);
  }
  new DataView(preamble.buffer).setUint32(8, headerBytes.length, true);
  await writeChecked(sink, preamble, readEpoch, epoch);
  await writeChecked(sink, headerBytes, readEpoch, epoch);
  await writeU8Field(sink, snapshot.a, readEpoch, epoch);
  await writeF64Field(sink, snapshot.f, readEpoch, epoch);
  await writeF64Field(sink, snapshot.sigma, readEpoch, epoch);
  await writeU32List(sink, snapshot.boundaryOrder, readEpoch, epoch);
  await writeU32List(sink, snapshot.lastAttached, readEpoch, epoch);
  await writeF64Field(sink, resumeScalars, readEpoch, epoch);
  if (validateMutationEpoch(readEpoch()) !== epoch) {
    fail("solver mutated before resume-checkpoint streaming completed");
  }
  return {
    version: 3,
    tick: snapshot.tick,
    headerLength: headerBytes.length,
    payloadLength: layout.payloadLength,
    byteLength: layout.byteLength,
  };
}

export async function decodeLKResumeCheckpointV3(
  source: LKResumeByteSource,
): Promise<DecodedLKResumeCheckpointV3> {
  const sourceLength = validateSource(source);
  if (sourceLength < PREAMBLE_BYTES) fail("source is shorter than the fixed preamble");
  const preamble = new Uint8Array(PREAMBLE_BYTES);
  await readChecked(source, sourceLength, 0, preamble);
  let magic = "";
  for (let index = 0; index < 8; index++) magic += String.fromCharCode(preamble[index]);
  if (magic !== CHECKPOINT_MAGIC) fail(`bad magic ${JSON.stringify(magic)}`);
  const headerLength = new DataView(preamble.buffer).getUint32(8, true);
  if (headerLength === 0) fail("header length must be nonzero");
  if (headerLength > MAX_LK_RESUME_HEADER_BYTES) {
    fail(`header length exceeds ${MAX_LK_RESUME_HEADER_BYTES} bytes`);
  }
  const headerEnd = safeAdd(PREAMBLE_BYTES, headerLength, "header end offset");
  if (headerEnd > sourceLength) fail("header length exceeds the available source bytes");
  const headerBytes = new Uint8Array(headerLength);
  await readChecked(source, sourceLength, PREAMBLE_BYTES, headerBytes);
  const parsed = parseCanonicalHeader(headerBytes);
  const layout = validateLayout(
    parsed.n,
    parsed.boundaryCount,
    parsed.lastAttachedCount,
    headerLength,
  );
  if (layout.byteLength !== sourceLength) {
    fail(
      `source length ${sourceLength} does not equal the exact planned total ${layout.byteLength}`,
    );
  }

  validateControls({
    numericEngine: "float64-cpu",
    resumePhase: "cycle-boundary",
    cycleState: "boundary",
    timelineMode: "none",
    dims: parsed.dims,
    tick: parsed.tick,
    rngSeed: parsed.rngSeed,
    noiseEpsilon: parsed.noiseEpsilon,
    domain: "hexPrism",
    center: parsed.center,
    tempC: parsed.tempC,
    sigmaInfinity: parsed.sigmaInfinity,
    dxUm: parsed.dxUm,
    pressurePa: parsed.pressurePa,
    paramSet: parsed.paramSet,
    cflFill: parsed.cflFill,
    relaxTol: parsed.relaxTol,
    divTol: parsed.divTol,
    relaxMaxSweeps: parsed.relaxMaxSweeps,
    surfacePolicy: "aggregate-hv-g1h1-v6",
    farField: "monopole-matched",
  });

  const a = allocateUint8(parsed.n, "a field");
  const f = allocateFloat64(parsed.n, "f field");
  const sigma = allocateFloat64(parsed.n, "sigma field");
  const boundaryOrder = allocateNumberArray(parsed.boundaryCount, "boundaryOrder");
  const lastAttached = allocateNumberArray(parsed.lastAttachedCount, "lastAttached");
  const resumeScalars = allocateFloat64(RESUME_SCALAR_COUNT, "resumeScalars");
  let offset = headerEnd;
  offset = await readU8Field(source, sourceLength, offset, a);
  offset = await readF64Field(source, sourceLength, offset, f);
  offset = await readF64Field(source, sourceLength, offset, sigma);
  offset = await readU32List(source, sourceLength, offset, boundaryOrder);
  offset = await readU32List(source, sourceLength, offset, lastAttached);
  offset = await readF64Field(source, sourceLength, offset, resumeScalars);
  if (offset !== sourceLength) fail("decoder did not consume the exact planned source length");

  let lastRelaxation: LKResumeRelaxationReportV3 | null;
  if (!parsed.lastRelaxationPresent) {
    for (let slot = 6; slot < RESUME_SCALAR_COUNT; slot++) {
      requireCanonicalZero(resumeScalars[slot], `null resumeScalars[${slot}]`);
    }
    lastRelaxation = null;
  } else {
    lastRelaxation = Object.freeze({
      sweeps: parsed.lastRelaxationSweeps,
      converged: parsed.lastRelaxationConverged,
      residual: resumeScalars[6],
      divergenceResidual: resumeScalars[7],
      shellClampDiagnostic: resumeScalars[8],
      surfaceExchangeDiagnostic: resumeScalars[9],
      smootherDriftDiagnostic: resumeScalars[10],
      minLocalSurfaceExchangeDiagnostic: resumeScalars[11],
    });
  }
  const dynamicInput: DynamicStateInput = {
    tick: parsed.tick,
    relaxTol: parsed.relaxTol,
    divTol: parsed.divTol,
    relaxMaxSweeps: parsed.relaxMaxSweeps,
    attachedCount: parsed.attachedCount,
    holeFillCountTotal: parsed.holeFillCountTotal,
    lastAttached,
    simTimeSeconds: resumeScalars[0],
    volumeRateM3PerS: resumeScalars[1],
    lastMaxFillVelocityMS: resumeScalars[2],
    fillLedger: resumeScalars[3],
    holeFillDeficit: resumeScalars[4],
    saturationClippedFill: resumeScalars[5],
    lastRelaxation,
  };
  validateDynamicState(dynamicInput);
  validateArrayShapes({ a, f, sigma }, parsed.n);
  const topology = validateTopology(
    {
      dims: parsed.dims,
      center: parsed.center,
      dxUm: parsed.dxUm,
      a,
      f,
      sigma,
      boundaryOrder,
      lastAttached,
      activeCellCount: parsed.activeCellCount,
      shellCellCount: parsed.shellCellCount,
      hexRadius: parsed.hexRadius,
      zHalfExtent: parsed.zHalfExtent,
      attachedCount: parsed.attachedCount,
    },
    parsed.n,
    true,
  );
  if (topology === null) fail("decoder did not construct owned topology");

  const owned: LKResumeAdoptedStateV3 = {
    version: 3,
    numericEngine: "float64-cpu",
    resumePhase: "cycle-boundary",
    cycleState: "boundary",
    timelineMode: "none",
    dims: parsed.dims,
    tick: parsed.tick,
    rngSeed: parsed.rngSeed,
    noiseEpsilon: parsed.noiseEpsilon,
    domain: "hexPrism",
    center: parsed.center,
    tempC: parsed.tempC,
    sigmaInfinity: parsed.sigmaInfinity,
    dxUm: parsed.dxUm,
    pressurePa: parsed.pressurePa,
    paramSet: parsed.paramSet,
    cflFill: parsed.cflFill,
    relaxTol: parsed.relaxTol,
    divTol: parsed.divTol,
    relaxMaxSweeps: parsed.relaxMaxSweeps,
    surfacePolicy: "aggregate-hv-g1h1-v6",
    farField: "monopole-matched",
    a,
    f,
    sigma,
    boundaryOrder,
    lastAttached,
    simTimeSeconds: resumeScalars[0],
    volumeRateM3PerS: resumeScalars[1],
    lastMaxFillVelocityMS: resumeScalars[2],
    fillLedger: resumeScalars[3],
    holeFillDeficit: resumeScalars[4],
    saturationClippedFill: resumeScalars[5],
    holeFillCountTotal: parsed.holeFillCountTotal,
    lastRelaxation,
    acceptedEnvironmentEventCount: 0,
    closedPlacedFillVaporUnits: 0,
    currentTemperatureSegmentStartFill: 0,
    testHookEverUsed: false,
    topology,
  };
  const envelope: DecodedLKResumeCheckpointV3 = Object.freeze({
    version: 3,
    checkpointKind: "lk-resume",
    tick: parsed.tick,
    byteLength: sourceLength,
  });
  decodedBrands.add(envelope);
  decodedOwnership.set(envelope, owned);
  return envelope;
}
