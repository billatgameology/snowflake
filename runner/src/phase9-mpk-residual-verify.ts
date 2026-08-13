/** Pure, fail-closed verifier for the Phase 9 M-PK eligibility/refusal foundation. */
import { canonicalJson, sha256Bytes } from "./gate4-evidence.ts";

type JsonRecord = Record<string, unknown>;

export interface Phase9MpkFoundationVerificationInputs {
  readonly protocolBytes: Uint8Array;
  readonly shelfFreezeBytes: Uint8Array;
  readonly adapterRegistryBytes: Uint8Array;
  readonly successorBytes: Uint8Array;
  readonly plotMetadataBytes: Uint8Array;
  readonly mgpProtocolBytes: Uint8Array;
  readonly mgpRegistryBytes: Uint8Array;
  readonly mfProtocolBytes: Uint8Array;
}

export interface Phase9MpkFoundationVerification {
  readonly ok: true;
  readonly protocolId: "phase9-mpk-residual-source-replay-foundation-v1";
  readonly sourceSeriesCount: 4;
  readonly sourcePointCount: 78;
  readonly aggregateGasPressureConstraintCount: 26;
  readonly sourceDataScoresProduced: 0;
  readonly modelScoresProduced: 0;
  readonly surfaceKineticsResidualAvailable: false;
  readonly threeDimensionalReplayAuthorized: false;
  readonly promotionAuthorized: false;
  readonly grantsValidationClaim: false;
}

const EXPECTED_TOP_LEVEL_KEYS = [
  "schema", "protocolId", "state", "question", "upstreamBindings", "sourceBinding",
  "seriesRoster", "mgpConstraint", "conditionMapping", "refusals", "stopRule",
] as const;
const EXPECTED_UPSTREAM_KEYS = [
  "s0bShelfFreeze", "s1AdapterRegistry", "phase8Successor", "phase8PlotMetadata",
  "mgpProtocol", "mgpRegistry", "mfProtocol",
] as const;
const EXPECTED_BINDING_KEYS = ["path", "byteLength", "sha256"] as const;
const EXPECTED_STATE_SHA = "358f6d596b644fd4ff829504b4c155ca349097fbd42f2d4da7dfef6bf51cbd41";
const EXPECTED_QUESTION_SHA = "d6f82e0616d530a9c9f0576371e056ae62a1cfd6531d94df201ffd6bada596f5";
const EXPECTED_SOURCE_SHA = "1cae065ff477a0fc946fe1df5544d9b1a09d2b42ab4d73bfefa08803a8f4c188";
const EXPECTED_SERIES_SHA = "073624b8cfed5fa1c28d9abfde19b4be9a664a2dbe0d94a36da7e92773a03714";
const EXPECTED_MGP_CONSTRAINT_SHA = "05f35877c77a242ee3ea566ab8488cba9d70e7f38cf8b16d03e0e9833f6c525c";
const EXPECTED_MAPPING_SHA = "a3c09df6b8cc49aa27adb2945563cfb979abb802989cd59e99de76cc3f583669";
const EXPECTED_REFUSALS_SHA = "3ba69f9cb3a93ea626256931fd8572ad22eee080d34d2c42f2498dfbfbb5529d";
const EXPECTED_STOP_SHA = "043703cbcefa24f6628423407419770e693013445f6395aeea56b3c3a544518d";
const EXPECTED_MPK_SHELF_SHA = "3af348da4850821e05fe81c9ee95a7485e0b0293dd2e9e1a5d1a1210b562558a";
const EXPECTED_MGP_SHELF_SHA = "8023f7360a7d208fb087f66329c52b6e7eba673832144899b4a4a10ac4a908ff";

const EXPECTED_BINDINGS = Object.freeze({
  s0bShelfFreeze: { path: "evidence/phase9-source-overlay-v1/shelf-freeze.json", byteLength: 63_975,
    sha256: "b0bbab2e01eca61dfb2b807bda3614aaf803e5fd0457f2df02aa3e4b8c5d1a06" },
  s1AdapterRegistry: { path: "research/phase9-adapter-registry-v1.jsonl", byteLength: 48_946,
    sha256: "498e85471766294d812b3ef9d747381e92eb476e8a9b40a3f34f855b53e46337" },
  phase8Successor: { path: "evidence/phase8b-benchmark-final-v1/successor-target-book.jsonl", byteLength: 36_094,
    sha256: "c54b89683eea1f064bd8e81d6e9e06b3b9bbc6c022168b981cbfa71e5fc3cdd3" },
  phase8PlotMetadata: { path: "evidence/phase8b-plot-digitization-v3/records.jsonl", byteLength: 32_617,
    sha256: "3b22753b246e1ddd026daa8fe8eaab170971c71ef7d9fb63e0d25c8ad91547c8" },
  mgpProtocol: { path: "research/phase9-mgp-intake-protocol-v1.json", byteLength: 13_701,
    sha256: "9a9c654e0d6ab776620d058e5a060203141038938ed560ad1caf62c23545a3f6" },
  mgpRegistry: { path: "research/phase9-mgp-development-registry-v1.jsonl", byteLength: 40_805,
    sha256: "4332a287a003dc587d7380ad59245d9927d89a98e4108af71700f8192167ed9a" },
  mfProtocol: { path: "research/phase9-mf-mk2-protocol-v1.json", byteLength: 33_473,
    sha256: "e061d63974b68a5df0e371569cde00dfe482be5949f6d277a34199647c392dcc" },
} as const);

const EXPECTED_SERIES = Object.freeze({
  "P8B-P1-L16-F3-H": {
    metadata: "1c230f8568c2c2dce1b1ced07c1cd90fddfe0324c641b8b1ccc124c5124d1f39",
    adapter: "a0a1fd7f4b658dfb9e34705c1159cbdfc497e50ae028ae10ef12f2c4e18ebbfb",
    successor: "9311dbd4c843213f55ab9f49481d2bb02a425674e5349e759bd977e30934f4e1",
  },
  "P8B-P1-L16-F3-R": {
    metadata: "0bd1b7519a042f11a925b262a5fcfb0388f3a7c823dace2ece7ecd91ff2242cd",
    adapter: "776a73cb74e55d2ade12e0145ff8e894a8dda95542b63957292ffe0baefe0bd7",
    successor: "8ea855731e09c6a68793bc164a96f512835f7223ac2c4480ca20dfebdde96e37",
  },
  "P8B-P1-L16-F4-H": {
    metadata: "75fabecb58da475182ed88adb21fe87d886208d6b2001f5a4f09a5800d4e235e",
    adapter: "df767173f2a25d580184410087f7c3a86a4e43a2df3c201c1b4db3593174d10a",
    successor: "dbaea8ce730f0016fe8e34085ee05e1191a02dfabe5d360c6146f3a5569d8fad",
  },
  "P8B-P1-L16-F4-R": {
    metadata: "8a1f52eff1cea40459138facfb87446a73bec09022f7d168e5430a870037c7fa",
    adapter: "da0ddcdfe4f9529c039e18e9cc253edcc75ebf80d8f472e88f9785d29466048c",
    successor: "522552be3da8a455588bed06f13e5a0484cd81f81e011020f90381eef244fcd6",
  },
} as const);

function decode(bytes: Uint8Array, label: string): string {
  const value = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  if (value.includes("\r") || !value.endsWith("\n")) throw new Error(`${label} must be LF JSON with final newline`);
  return value;
}

function record(value: unknown, label: string): JsonRecord {
  if (value === null || Array.isArray(value) || typeof value !== "object") throw new Error(`${label} must be an object`);
  return value as JsonRecord;
}

function exactKeys(value: JsonRecord, expected: readonly string[], label: string): void {
  const actual = Object.keys(value).sort();
  const pinned = [...expected].sort();
  if (actual.length !== pinned.length || actual.some((key, index) => key !== pinned[index])) {
    throw new Error(`${label} key set differs`);
  }
}

function parseJson(bytes: Uint8Array, label: string): JsonRecord {
  return record(JSON.parse(decode(bytes, label)) as unknown, label);
}

function parseRows(bytes: Uint8Array, label: string): readonly JsonRecord[] {
  return decode(bytes, label).trimEnd().split("\n").map((line, index) => {
    const row = record(JSON.parse(line) as unknown, `${label} row ${index + 1}`);
    if (canonicalJson(row) !== line) throw new Error(`${label} row ${index + 1} is not canonical`);
    return row;
  });
}

function semanticSha(value: unknown): string {
  return sha256Bytes(new TextEncoder().encode(canonicalJson(value)));
}

function assertSemantic(value: unknown, expected: string, label: string): void {
  if (semanticSha(value) !== expected) throw new Error(`${label} exact semantics differ`);
}

function assertBinding(bytes: Uint8Array, value: unknown, expected: { readonly path: string; readonly byteLength: number; readonly sha256: string }, label: string): void {
  const binding = record(value, `${label} binding`);
  exactKeys(binding, EXPECTED_BINDING_KEYS, `${label} binding`);
  if (binding.path !== expected.path || binding.byteLength !== bytes.byteLength ||
      binding.byteLength !== expected.byteLength || binding.sha256 !== sha256Bytes(bytes) ||
      binding.sha256 !== expected.sha256) throw new Error(`${label} exact binding differs`);
}

function uniqueRow(rows: readonly JsonRecord[], selectionId: string, label: string): JsonRecord {
  const matches = rows.filter((row) => row.selectionId === selectionId);
  if (matches.length !== 1) throw new Error(`${label} exact roster differs`);
  return matches[0] as JsonRecord;
}

export function verifyPhase9MpkFoundation(
  inputs: Phase9MpkFoundationVerificationInputs,
): Phase9MpkFoundationVerification {
  const protocol = parseJson(inputs.protocolBytes, "M-PK protocol");
  exactKeys(protocol, EXPECTED_TOP_LEVEL_KEYS, "M-PK protocol");
  if (protocol.schema !== "phase9-mpk-residual-protocol-v1" ||
      protocol.protocolId !== "phase9-mpk-residual-source-replay-foundation-v1") {
    throw new Error("M-PK protocol identity differs");
  }
  assertSemantic(protocol.state, EXPECTED_STATE_SHA, "M-PK state");
  assertSemantic(protocol.question, EXPECTED_QUESTION_SHA, "M-PK question");
  assertSemantic(protocol.sourceBinding, EXPECTED_SOURCE_SHA, "M-PK source binding");
  assertSemantic(protocol.seriesRoster, EXPECTED_SERIES_SHA, "M-PK series roster");
  assertSemantic(protocol.mgpConstraint, EXPECTED_MGP_CONSTRAINT_SHA, "M-PK M-GP constraint");
  assertSemantic(protocol.conditionMapping, EXPECTED_MAPPING_SHA, "M-PK condition mapping");
  assertSemantic(protocol.refusals, EXPECTED_REFUSALS_SHA, "M-PK refusals");
  assertSemantic(protocol.stopRule, EXPECTED_STOP_SHA, "M-PK stop rule");

  const upstream = record(protocol.upstreamBindings, "M-PK upstream bindings");
  exactKeys(upstream, EXPECTED_UPSTREAM_KEYS, "M-PK upstream bindings");
  assertBinding(inputs.shelfFreezeBytes, upstream.s0bShelfFreeze, EXPECTED_BINDINGS.s0bShelfFreeze, "S0B");
  assertBinding(inputs.adapterRegistryBytes, upstream.s1AdapterRegistry, EXPECTED_BINDINGS.s1AdapterRegistry, "S1");
  assertBinding(inputs.successorBytes, upstream.phase8Successor, EXPECTED_BINDINGS.phase8Successor, "Phase 8 successor");
  assertBinding(inputs.plotMetadataBytes, upstream.phase8PlotMetadata, EXPECTED_BINDINGS.phase8PlotMetadata, "Phase 8 metadata");
  assertBinding(inputs.mgpProtocolBytes, upstream.mgpProtocol, EXPECTED_BINDINGS.mgpProtocol, "M-GP protocol");
  assertBinding(inputs.mgpRegistryBytes, upstream.mgpRegistry, EXPECTED_BINDINGS.mgpRegistry, "M-GP registry");
  assertBinding(inputs.mfProtocolBytes, upstream.mfProtocol, EXPECTED_BINDINGS.mfProtocol, "M-F protocol");

  const shelf = parseJson(inputs.shelfFreezeBytes, "S0B shelf");
  const shelfRows = (shelf.shelf as unknown[]).map((row, index) => record(row, `shelf row ${index + 1}`));
  assertSemantic(shelfRows.find((row) => row.item === "M-PK"), EXPECTED_MPK_SHELF_SHA, "M-PK shelf row");
  assertSemantic(shelfRows.find((row) => row.item === "M-GP"), EXPECTED_MGP_SHELF_SHA, "M-GP shelf row");

  const metadata = parseRows(inputs.plotMetadataBytes, "Phase 8 metadata");
  const adapters = parseRows(inputs.adapterRegistryBytes, "S1 registry");
  const successor = parseRows(inputs.successorBytes, "Phase 8 successor");
  for (const [selectionId, expected] of Object.entries(EXPECTED_SERIES)) {
    assertSemantic(uniqueRow(metadata, selectionId, "metadata"), expected.metadata, `${selectionId} metadata`);
    assertSemantic(uniqueRow(adapters, selectionId, "adapter"), expected.adapter, `${selectionId} adapter`);
    assertSemantic(uniqueRow(successor, selectionId, "successor"), expected.successor, `${selectionId} successor`);
  }
  const mgpRows = parseRows(inputs.mgpRegistryBytes, "M-GP registry");
  if (mgpRows.length !== 26 || mgpRows.some((row) =>
    record(row.claimBoundary, "M-GP claim boundary").surfaceKineticsInferenceAuthorized !== false)) {
    throw new Error("M-GP transport-confounded constraint roster differs");
  }

  return Object.freeze({
    ok: true,
    protocolId: "phase9-mpk-residual-source-replay-foundation-v1",
    sourceSeriesCount: 4,
    sourcePointCount: 78,
    aggregateGasPressureConstraintCount: 26,
    sourceDataScoresProduced: 0,
    modelScoresProduced: 0,
    surfaceKineticsResidualAvailable: false,
    threeDimensionalReplayAuthorized: false,
    promotionAuthorized: false,
    grantsValidationClaim: false,
  });
}
