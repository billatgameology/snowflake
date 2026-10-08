// ADR 0060: bounded, synchronous development checkpoints, separate from LK v1/v2/v3.
import {
  validateLKResumeNumericalControls,
  validateLKResumeDynamicState,
  validateLKResumeTopology,
  type LKResumeStateV3,
  type LKResumeValidatedTopologyV3,
} from "./lk-resume-checkpoint.ts";

export const DISCOVERY_RESUME_SCHEMA = "discovery-resume-v1" as const;
export const MAX_DISCOVERY_RESUME_CELLS = 64 ** 3;
export const MAX_DISCOVERY_RESUME_BYTES = 64 * 1024 * 1024;
const MAX_HEADER_BYTES = 65_536;
const MAGIC = new TextEncoder().encode("VCCDR001");

export interface DiscoveryResumeState extends Omit<LKResumeStateV3, "timelineMode" | "paramSet"> {
  readonly paramSet: "M1" | "M1_NO_DIP_ABLATION";
  readonly experimentalFacetDips: "both" | "neither" | "basal-only" | "prism-only" | null;
  readonly experimentalBasalWidthCells: number | null;
  readonly experimentalBasalWidthHistory: {
    readonly mode: "early-only" | "late-only";
    readonly cutoffSeconds: number;
  } | null;
}

export interface AdoptedDiscoveryResumeState extends Omit<DiscoveryResumeState,
  "mutationEpoch" | "boundaryOrder" | "lastAttached"> {
  readonly schema: typeof DISCOVERY_RESUME_SCHEMA;
  readonly boundaryOrder: number[];
  readonly lastAttached: number[];
  readonly topology: LKResumeValidatedTopologyV3;
}

export interface DecodedDiscoveryResumeCheckpoint {
  readonly schema: typeof DISCOVERY_RESUME_SCHEMA;
  readonly tick: number;
  readonly byteLength: number;
}

const METADATA_KEYS = [
  "numericEngine", "resumePhase", "cycleState", "dims", "tick", "rngSeed", "noiseEpsilon",
  "domain", "center", "tempC", "sigmaInfinity", "dxUm", "pressurePa", "paramSet", "cflFill",
  "relaxTol", "divTol", "relaxMaxSweeps", "surfacePolicy", "farField", "activeCellCount",
  "shellCellCount", "hexRadius", "zHalfExtent", "attachedCount", "holeFillCountTotal",
  "simTimeSeconds", "volumeRateM3PerS", "lastMaxFillVelocityMS", "fillLedger", "holeFillDeficit",
  "saturationClippedFill", "lastRelaxation", "acceptedEnvironmentEventCount",
  "closedPlacedFillVaporUnits", "currentTemperatureSegmentStartFill", "testHookEverUsed",
  "experimentalFacetDips", "experimentalBasalWidthCells", "experimentalBasalWidthHistory",
] as const;
const REPORT_KEYS = ["sweeps", "converged", "residual", "divergenceResidual", "shellClampDiagnostic",
  "surfaceExchangeDiagnostic", "smootherDriftDiagnostic", "minLocalSurfaceExchangeDiagnostic"];

function fail(message: string): never { throw new Error(`discovery resume ${message}`); }
function record(value: unknown, label: string): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) fail(`${label} must be an object`);
  return value as Record<string, unknown>;
}
function keys(value: unknown, expected: readonly string[], label: string): void {
  const actual = Object.keys(record(value, label));
  if (actual.length !== expected.length || actual.some((key) => !expected.includes(key))) {
    fail(`${label} has missing or unknown fields`);
  }
}
function finiteNonnegative(value: number, label: string): void {
  if (!Number.isFinite(value) || value < 0 || Object.is(value, -0)) fail(`${label} must be finite and nonnegative`);
}
function positiveInteger(value: number, label: string): void {
  if (!Number.isSafeInteger(value) || value <= 0) fail(`${label} must be a positive safe integer`);
}

/** All scalar numbers, including signed zero, retain exact IEEE-754 bits in the header. */
function exactReplacer(_key: string, value: unknown): unknown {
  if (typeof value !== "number") return value;
  if (!Number.isFinite(value)) fail("header numbers must be finite");
  const bytes = new Uint8Array(8);
  new DataView(bytes.buffer).setFloat64(0, value, false);
  return { $f64: Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("") };
}
function exactReviver(_key: string, value: unknown): unknown {
  if (value === null || typeof value !== "object" || !("$f64" in value)) return value;
  keys(value, ["$f64"], "floating-point scalar");
  const hex = (value as { $f64: unknown }).$f64;
  if (typeof hex !== "string" || !/^[0-9a-f]{16}$/.test(hex)) fail("invalid floating-point bits");
  const bytes = Uint8Array.from({ length: 8 }, (_, index) => Number.parseInt(hex.slice(index * 2, index * 2 + 2), 16));
  const decoded = new DataView(bytes.buffer).getFloat64(0, false);
  if (!Number.isFinite(decoded)) fail("decoded header number must be finite");
  return decoded;
}

function validate(state: DiscoveryResumeState, buildTopology: boolean): LKResumeValidatedTopologyV3 | null {
  keys(state.dims, ["nx", "ny", "nz"], "dimensions");
  const n = validateLKResumeNumericalControls({ ...state, timelineMode: "none" });
  if (n > MAX_DISCOVERY_RESUME_CELLS) fail(`cell count exceeds bounded N64 capacity ${MAX_DISCOVERY_RESUME_CELLS}`);
  if (state.paramSet !== "M1" && state.paramSet !== "M1_NO_DIP_ABLATION") fail("parameter set must be M1 or matched no-dip");
  if (state.testHookEverUsed !== false) fail("test hooks are not eligible");
  if (state.acceptedEnvironmentEventCount !== 0 && state.acceptedEnvironmentEventCount !== 1) {
    fail("acceptedEnvironmentEventCount must be zero or one");
  }
  finiteNonnegative(state.closedPlacedFillVaporUnits, "closedPlacedFillVaporUnits");
  finiteNonnegative(state.currentTemperatureSegmentStartFill, "currentTemperatureSegmentStartFill");
  if (state.currentTemperatureSegmentStartFill > state.fillLedger) fail("temperature segment origin exceeds fill ledger");
  if (state.acceptedEnvironmentEventCount === 0 &&
    (state.closedPlacedFillVaporUnits !== 0 || state.currentTemperatureSegmentStartFill !== 0)) {
    fail("unfired environment requires zero temperature ledger origins");
  }
  const facet = state.experimentalFacetDips;
  if (facet !== null && !["both", "neither", "basal-only", "prism-only"].includes(facet)) fail("unknown facet arm");
  const width = state.experimentalBasalWidthCells;
  const history = state.experimentalBasalWidthHistory;
  if (width !== null) positiveInteger(width, "basal width");
  if (facet !== null && width !== null) fail("facet and width modes cannot combine");
  if (facet !== null || width !== null) {
    if (state.paramSet !== "M1") fail("experimental preparation requires M1 base");
    if (state.acceptedEnvironmentEventCount !== 0) fail("experimental modes cannot carry temperature events");
  }
  if (history !== null) {
    keys(history, ["mode", "cutoffSeconds"], "width history");
    if (width === null) fail("width history requires width selection");
    if (history.mode !== "early-only" && history.mode !== "late-only") fail("unknown width history mode");
    if (!Number.isFinite(history.cutoffSeconds) || history.cutoffSeconds <= 0) fail("cutoff must be finite and positive");
  }
  if (state.lastRelaxation !== null) keys(state.lastRelaxation, REPORT_KEYS, "last relaxation");
  validateLKResumeDynamicState(state, state.acceptedEnvironmentEventCount === 1);
  if (!(state.a instanceof Uint8Array) || state.a.length !== n ||
    !(state.f instanceof Float64Array) || state.f.length !== n ||
    !(state.sigma instanceof Float64Array) || state.sigma.length !== n) fail("field shapes do not match dimensions");
  return validateLKResumeTopology(state, n, buildTopology);
}

function metadata(state: DiscoveryResumeState): Record<string, unknown> {
  return Object.fromEntries(METADATA_KEYS.map((key) => [key, state[key]]));
}

/** Bounded N64 scope avoids a second asynchronous runner without changing the streamed V3 API. */
export function encodeDiscoveryResumeCheckpoint(state: DiscoveryResumeState): Uint8Array {
  const epoch = state.mutationEpoch();
  validate(state, false);
  const header = new TextEncoder().encode(JSON.stringify({ schema: DISCOVERY_RESUME_SCHEMA,
    state: metadata(state), boundaryCount: state.boundaryOrder.length, lastAttachedCount: state.lastAttached.length }, exactReplacer));
  if (header.length > MAX_HEADER_BYTES) fail("header is too large");
  const n = state.a.length;
  const length = 12 + header.length + n * 17 + 4 * (state.boundaryOrder.length + state.lastAttached.length);
  if (length > MAX_DISCOVERY_RESUME_BYTES) fail("checkpoint exceeds bounded byte capacity");
  const bytes = new Uint8Array(length);
  bytes.set(MAGIC);
  const view = new DataView(bytes.buffer);
  view.setUint32(8, header.length, true);
  bytes.set(header, 12);
  let offset = 12 + header.length;
  bytes.set(state.a, offset); offset += n;
  for (const field of [state.f, state.sigma]) {
    for (const value of field) { view.setFloat64(offset, value, true); offset += 8; }
  }
  for (const field of [state.boundaryOrder, state.lastAttached]) {
    for (const value of field) { view.setUint32(offset, value, true); offset += 4; }
  }
  if (state.mutationEpoch() !== epoch) fail("solver changed during encoding");
  return bytes;
}

const ownedStates = new WeakMap<object, AdoptedDiscoveryResumeState>();
const consumed = new WeakSet<object>();

export function decodeDiscoveryResumeCheckpoint(bytes: Uint8Array): DecodedDiscoveryResumeCheckpoint {
  if (!(bytes instanceof Uint8Array) || bytes.length < 12 || bytes.length > MAX_DISCOVERY_RESUME_BYTES) fail("invalid byte length");
  if (MAGIC.some((byte, index) => byte !== bytes[index])) fail("wrong magic; ordinary checkpoint formats are not discovery resume state");
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const headerLength = view.getUint32(8, true);
  if (headerLength === 0 || headerLength > MAX_HEADER_BYTES || 12 + headerLength > bytes.length) fail("invalid header length");
  const headerText = new TextDecoder("utf-8", { fatal: true }).decode(bytes.subarray(12, 12 + headerLength));
  const header = record(JSON.parse(headerText, exactReviver), "header");
  keys(header, ["schema", "state", "boundaryCount", "lastAttachedCount"], "header");
  if (header.schema !== DISCOVERY_RESUME_SCHEMA) fail("unsupported schema");
  keys(header.state, METADATA_KEYS, "state metadata");
  const controls = header.state as Omit<DiscoveryResumeState, "a" | "f" | "sigma" | "boundaryOrder" | "lastAttached" | "mutationEpoch">;
  keys(controls.dims, ["nx", "ny", "nz"], "dimensions");
  const n = validateLKResumeNumericalControls({ ...controls, timelineMode: "none" });
  if (n > MAX_DISCOVERY_RESUME_CELLS) fail("cell count exceeds bounded N64 capacity");
  const boundaryCount = header.boundaryCount as number;
  const lastAttachedCount = header.lastAttachedCount as number;
  for (const count of [boundaryCount, lastAttachedCount]) {
    if (!Number.isSafeInteger(count) || count < 0 || count > n) fail("invalid topology list length");
  }
  const expectedLength = 12 + headerLength + n * 17 + 4 * (boundaryCount + lastAttachedCount);
  if (bytes.length !== expectedLength) fail("payload length does not match header");
  let offset = 12 + headerLength;
  const a = bytes.slice(offset, offset + n); offset += n;
  const f = new Float64Array(n);
  const sigma = new Float64Array(n);
  for (const field of [f, sigma]) {
    for (let index = 0; index < n; index++) { field[index] = view.getFloat64(offset, true); offset += 8; }
  }
  const boundaryOrder: number[] = [];
  const lastAttached: number[] = [];
  for (const [field, count] of [[boundaryOrder, boundaryCount], [lastAttached, lastAttachedCount]] as const) {
    for (let index = 0; index < count; index++) { field.push(view.getUint32(offset, true)); offset += 4; }
  }
  const state: DiscoveryResumeState = { ...controls, a, f, sigma, boundaryOrder, lastAttached, mutationEpoch: () => 0 };
  const topology = validate(state, true);
  if (topology === null) fail("topology reconstruction failed");
  const envelope: DecodedDiscoveryResumeCheckpoint = Object.freeze({ schema: DISCOVERY_RESUME_SCHEMA,
    tick: state.tick, byteLength: bytes.length });
  ownedStates.set(envelope, { ...controls, schema: DISCOVERY_RESUME_SCHEMA, a, f, sigma, boundaryOrder, lastAttached, topology });
  return envelope;
}

/** One-use owned arrays avoid accidental mutable aliasing between restored solvers. */
export function takeDecodedDiscoveryResumeCheckpoint(decoded: DecodedDiscoveryResumeCheckpoint): AdoptedDiscoveryResumeState {
  if (consumed.has(decoded)) fail("decoded state was already consumed");
  const state = ownedStates.get(decoded);
  if (state === undefined) fail("decoded state is not an owned decoder envelope");
  ownedStates.delete(decoded);
  consumed.add(decoded);
  return state;
}
