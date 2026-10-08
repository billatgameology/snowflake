// ADR 0060: identified constant-environment BLD continuation; ordinary codec bytes stay frozen.
import {
  decodeLKResumeCheckpointV3, encodeLKResumeCheckpointV3, takeDecodedLKResumeCheckpointV3,
  MAX_LK_RESUME_HEADER_BYTES,
  type LKResumeAdoptedStateV3, type LKResumeByteSink, type LKResumeByteSource, type LKResumeStateV3,
} from "./lk-resume-checkpoint.ts";

export type LKExperimentalResumeDescriptorV1 =
  | { readonly kind: "ordinary-no-dip" }
  | { readonly kind: "facet-dips"; readonly arm: "both" | "neither" | "basal-only" | "prism-only" }
  | { readonly kind: "basal-width"; readonly widthCells: number;
      readonly history: null | { readonly mode: "early-only"; readonly cutoffSeconds: number } };
export interface LKExperimentalResumeStateV1 {
  readonly experiment: LKExperimentalResumeDescriptorV1;
  readonly common: LKResumeStateV3;
}
export interface DecodedLKExperimentalResumeCheckpointV1 {
  readonly version: 1;
  readonly checkpointKind: "lk-experimental-resume";
  readonly tick: number;
  readonly byteLength: number;
}
export interface LKExperimentalResumeAdoptedStateV1 {
  readonly experiment: LKExperimentalResumeDescriptorV1;
  readonly common: LKResumeAdoptedStateV3;
}
export interface LKExperimentalResumeEncodingSummaryV1 {
  readonly version: 1;
  readonly tick: number;
  readonly byteLength: number;
  readonly commonByteLength: number;
}
const MAGIC = "VCLEXR01";
const PREAMBLE_BYTES = 12;
const encoder = new TextEncoder();
const decoder = new TextDecoder("utf-8", { fatal: true });
function fail(message: string): never { throw new Error(`LK experimental resume checkpoint ${message}`); }
function record(value: unknown, keys: readonly string[], name: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) fail(`${name} must be an object`);
  const object = value as Record<string, unknown>;
  const actual = Object.keys(object);
  if (actual.length !== keys.length || actual.some((key, index) => key !== keys[index])) fail(`${name} keys/order must be exactly ${keys.join(",")}`);
  return object;
}
function floatHex(value: number): string {
  const bytes = new Uint8Array(8);
  new DataView(bytes.buffer).setFloat64(0, value, false);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}
function hexFloat(value: unknown): number {
  if (typeof value !== "string" || !/^[0-9a-f]{16}$/.test(value)) fail("cutoff must contain exact float64 bits");
  const bytes = Uint8Array.from(value.match(/../g)!, (pair) => Number.parseInt(pair, 16));
  return new DataView(bytes.buffer).getFloat64(0, false);
}
/** Exact bounded descriptor, also used at the solver's separate export boundary. */
export function validateLKExperimentalResumeDescriptorV1(value: unknown): LKExperimentalResumeDescriptorV1 {
  if (typeof value !== "object" || value === null) fail("experiment must be an object");
  const kind = (value as Record<string, unknown>).kind;
  if (kind === "ordinary-no-dip") {
    record(value, ["kind"], "experiment");
    return Object.freeze({ kind });
  }
  if (kind === "facet-dips") {
    const object = record(value, ["kind", "arm"], "experiment");
    const arm = object.arm;
    if (arm !== "both" && arm !== "neither" && arm !== "basal-only" && arm !== "prism-only") fail("unknown facet arm");
    return Object.freeze({ kind, arm });
  }
  if (kind === "basal-width") {
    const object = record(value, ["kind", "widthCells", "history"], "experiment");
    if (!Number.isSafeInteger(object.widthCells) || (object.widthCells as number) <= 0) fail("widthCells must be a positive safe integer");
    let history: { readonly mode: "early-only"; readonly cutoffSeconds: number } | null = null;
    if (object.history !== null) {
      const candidate = record(object.history, ["mode", "cutoffSeconds"], "history");
      if (candidate.mode !== "early-only") fail("history mode must be early-only");
      if (typeof candidate.cutoffSeconds !== "number" || !Number.isFinite(candidate.cutoffSeconds) || candidate.cutoffSeconds <= 0) fail("cutoffSeconds must be finite and positive");
      history = Object.freeze({ mode: "early-only", cutoffSeconds: candidate.cutoffSeconds });
    }
    return Object.freeze({ kind, widthCells: object.widthCells as number, history });
  }
  return fail("unknown experimental descriptor");
}
function matchPreparation(experiment: LKExperimentalResumeDescriptorV1, paramSet: string): void {
  const expected = experiment.kind === "ordinary-no-dip" ? "M1_NO_DIP_ABLATION" : "M1";
  if (paramSet !== expected) fail(`experiment requires common paramSet ${expected}`);
}
function wireDescriptor(experiment: LKExperimentalResumeDescriptorV1): unknown {
  return experiment.kind !== "basal-width" || experiment.history === null ? experiment : {
    kind: experiment.kind, widthCells: experiment.widthCells,
    history: { mode: experiment.history.mode, cutoffSeconds: floatHex(experiment.history.cutoffSeconds) },
  };
}
function fromWireDescriptor(value: unknown): LKExperimentalResumeDescriptorV1 {
  if (typeof value === "object" && value !== null && (value as Record<string, unknown>).kind === "basal-width") {
    const object = record(value, ["kind", "widthCells", "history"], "experiment");
    if (object.history !== null) {
      const history = record(object.history, ["mode", "cutoffSeconds"], "history");
      return validateLKExperimentalResumeDescriptorV1({ kind: object.kind, widthCells: object.widthCells,
        history: { mode: history.mode, cutoffSeconds: hexFloat(history.cutoffSeconds) } });
    }
  }
  return validateLKExperimentalResumeDescriptorV1(value);
}
export async function encodeLKExperimentalResumeCheckpointV1(
  state: LKExperimentalResumeStateV1, sink: LKResumeByteSink,
): Promise<LKExperimentalResumeEncodingSummaryV1> {
  const experiment = validateLKExperimentalResumeDescriptorV1(state.experiment);
  matchPreparation(experiment, state.common.paramSet);
  const epoch = state.common.mutationEpoch();
  const header = encoder.encode(JSON.stringify({ version: 1, checkpointKind: "lk-experimental-resume",
    stateCodec: "lk-resume-v3", experiment: wireDescriptor(experiment) }));
  if (header.length > MAX_LK_RESUME_HEADER_BYTES) fail("header is too large");
  const preamble = new Uint8Array(PREAMBLE_BYTES);
  preamble.set(encoder.encode(MAGIC));
  new DataView(preamble.buffer).setUint32(8, header.length, true);
  for (const chunk of [preamble, header]) {
    await sink.write(chunk);
    if (state.common.mutationEpoch() !== epoch) fail("state mutated during experimental header write");
  }
  const common = await encodeLKResumeCheckpointV3(state.common, sink);
  return { version: 1, tick: common.tick,
    byteLength: PREAMBLE_BYTES + header.length + common.byteLength, commonByteLength: common.byteLength };
}
const decodedOwnership = new WeakMap<object, LKExperimentalResumeAdoptedStateV1>();
const consumed = new WeakSet<object>();
export function takeDecodedLKExperimentalResumeCheckpointV1(
  decoded: DecodedLKExperimentalResumeCheckpointV1,
): LKExperimentalResumeAdoptedStateV1 {
  if (consumed.has(decoded)) fail("ownership envelope was already consumed");
  const owned = decodedOwnership.get(decoded);
  if (owned === undefined) fail("ownership envelope is not decoder-branded");
  consumed.add(decoded);
  decodedOwnership.delete(decoded);
  return owned;
}
export async function decodeLKExperimentalResumeCheckpointV1(
  source: LKResumeByteSource,
): Promise<DecodedLKExperimentalResumeCheckpointV1> {
  if (!Number.isSafeInteger(source.byteLength) || source.byteLength < PREAMBLE_BYTES) fail("invalid source length");
  const preamble = new Uint8Array(PREAMBLE_BYTES);
  await source.readExactly(0, preamble);
  if (decoder.decode(preamble.subarray(0, 8)) !== MAGIC) fail("wrong checkpoint family or magic");
  const headerLength = new DataView(preamble.buffer).getUint32(8, true);
  if (headerLength === 0 || headerLength > MAX_LK_RESUME_HEADER_BYTES) fail("invalid header length");
  const commonOffset = PREAMBLE_BYTES + headerLength;
  if (commonOffset >= source.byteLength) fail("truncated header or absent common state");
  const headerBytes = new Uint8Array(headerLength);
  await source.readExactly(PREAMBLE_BYTES, headerBytes);
  const headerText = decoder.decode(headerBytes);
  const header = record(JSON.parse(headerText), ["version", "checkpointKind", "stateCodec", "experiment"], "header");
  if (header.version !== 1 || header.checkpointKind !== "lk-experimental-resume" || header.stateCodec !== "lk-resume-v3") fail("unsupported experimental checkpoint identity");
  const experiment = fromWireDescriptor(header.experiment);
  if (headerText !== JSON.stringify({ version: 1, checkpointKind: "lk-experimental-resume",
    stateCodec: "lk-resume-v3", experiment: wireDescriptor(experiment) })) fail("header is not canonical");
  const commonDecoded = await decodeLKResumeCheckpointV3({
    byteLength: source.byteLength - commonOffset,
    readExactly: (offset, target) => source.readExactly(commonOffset + offset, target),
  });
  const common = takeDecodedLKResumeCheckpointV3(commonDecoded);
  matchPreparation(experiment, common.paramSet);
  const envelope: DecodedLKExperimentalResumeCheckpointV1 = Object.freeze({
    version: 1, checkpointKind: "lk-experimental-resume", tick: common.tick, byteLength: source.byteLength,
  });
  decodedOwnership.set(envelope, { experiment, common });
  return envelope;
}
