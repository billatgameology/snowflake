import { createHash } from "node:crypto";
import {
  canonicalJson,
  strictJsonSnapshot,
  type StrictJson,
} from "./gate4-evidence.ts";

export const PHASE10_C0_SCIENCE_PROTOCOL_PATH =
  "research/phase10-c0-protocol-v1.json";
export const PHASE10_C0_SCIENCE_PROTOCOL_ID =
  "phase10-c0-existing-byte-diagnostic-v1";
export const PHASE10_C0_MATRIX_ID =
  "phase10-selected-package-obligations-v1";
export const PHASE10_C0_RUNTIME = "v24.13.1";
export const PHASE10_C0_BRANCH = "phase10/evidence-verification";
export const PHASE10_C0_DERIVE_PACKET_PROTOCOL_PATH =
  "research/phase10-execution-v1/packets/c0-derive/protocol.json";
export const PHASE10_C0_PUBLISH_PACKET_PROTOCOL_PATH =
  "research/phase10-execution-v1/packets/c0-publish/protocol.json";
export const PHASE10_C0_EXECUTOR_RESOURCES = Object.freeze({
  solverExecutionAuthorized: false,
  requiredRuntime: PHASE10_C0_RUNTIME,
  processConcurrency: 1,
  scientificProcessHours: 0,
  projectedScratchBytes: 16 * 1024 * 1024,
  projectedOutputBytes: 4 * 1024 * 1024,
  minimumFreeBytes: 64 * 1024 * 1024,
  maxWallSeconds: 300,
  nasRequired: false,
  c0vScratchCapBytes: null,
});

export function phase10C0ExecutorCommand(
  packetId: "c0-derive" | "c0-publish",
  attemptId: string,
): string {
  if (!/^[a-z0-9][a-z0-9.-]*$/u.test(attemptId)) {
    throw new Error("Phase 10 C0 contract refused: attempt ID is not a safe stable CLI token");
  }
  const protocolPath = packetId === "c0-derive"
    ? PHASE10_C0_DERIVE_PACKET_PROTOCOL_PATH
    : PHASE10_C0_PUBLISH_PACKET_PROTOCOL_PATH;
  return `node runner/src/phase10-executor.ts run --packet ${packetId} --protocol ${protocolPath} --attempt ${attemptId}`;
}

export const PHASE10_C0_ROW_FIELDS = Object.freeze([
  "rowId",
  "tempC",
  "fraction",
  "paramSet",
  "dxUm",
  "seedRadius",
  "targetExtent",
  "domainN",
  "cflFill",
  "relaxTol",
  "surfacePolicy",
  "farField",
  "pressurePa",
  "noiseEpsilon",
  "rngSeed",
  "domain",
  "divTol",
  "relaxMaxSweeps",
  "seedThickness",
  "sigmaInfinity",
  "stopReason",
  "cycles",
  "totalSweeps",
  "wallSeconds",
  "attachedCount",
  "finalExtent",
  "aspectRatio",
  "symmetryError",
  "engine",
  "peakRssBytes",
  "gitHead",
  "startedIso",
  "finishedIso",
  "concurrency",
  "host",
  "dispatcherCommand",
] as const);

export const PHASE10_C0_NUMERICAL_FIELDS = Object.freeze([
  "attachedCount",
  "aspectRatio",
  "finalExtent",
  "symmetryError",
  "cycles",
  "totalSweeps",
] as const);

export const PHASE10_C0_COST_FIELDS = Object.freeze([
  "wallSeconds",
  "peakRssBytes",
] as const);

export const PHASE10_C0_ERROR_SOURCE_IDS = Object.freeze([
  "domain-coarse-spacing",
  "domain-fine-spacing",
  "cflFill",
  "relaxTol",
  "seedRadius",
] as const);

export const PHASE10_C0_GAP_IDS = Object.freeze([
  "attachment-event-orbit",
  "checkpoint-state",
  "crystallographic-calipers",
  "future-target-observation",
  "kinetic-ledgers",
  "occupancy-mask",
  "physical-time-history",
  "relaxation-histories",
  "trajectory",
  "vapor-surface-fields",
] as const);

export const PHASE10_C0_DERIVE_OUTPUTS = Object.freeze({
  "out-c0-analysis": Object.freeze({
    path: "evidence/phase10-numerical-verification-v1/c0-analysis.json",
    fileName: "c0-analysis.json",
  }),
  "out-c0-comparisons": Object.freeze({
    path: "evidence/phase10-numerical-verification-v1/c0-comparisons.jsonl",
    fileName: "c0-comparisons.jsonl",
  }),
  "out-c0-gaps": Object.freeze({
    path: "evidence/phase10-numerical-verification-v1/c0-target-field-gaps.json",
    fileName: "c0-target-field-gaps.json",
  }),
  "out-c0-historical-limit": Object.freeze({
    path: "evidence/phase10-numerical-verification-v1/c0-historical-verifier-limit.json",
    fileName: "c0-historical-verifier-limit.json",
  }),
});

export const PHASE10_C0_PUBLISH_OUTPUTS = Object.freeze({
  "out-c0-artifact-index": Object.freeze({
    path: "evidence/phase10-numerical-verification-v1/c0-artifact-index.json",
    fileName: "c0-artifact-index.json",
  }),
  "out-c0-report": Object.freeze({
    path: "evidence/phase10-numerical-verification-v1/c0-report.json",
    fileName: "c0-report.json",
  }),
});

export const PHASE10_C0_DERIVE_CHECK_IDS = Object.freeze([
  "chk-c0-all-spacings",
  "chk-c0-comparison-roster",
  "chk-c0-cost-separation",
  "chk-c0-field-allowlist",
  "chk-c0-independent-rederivation",
  "chk-c0-no-solver",
  "chk-c0-operand-echo",
  "chk-c0-row-roster",
] as const);

export const PHASE10_C0_PUBLISH_CHECK_IDS = Object.freeze([
  "chk-c0-publish-artifact-graph",
  "chk-c0-publish-breakdown",
  "chk-c0-publish-gap-list",
  "chk-c0-publish-historical-limit",
  "chk-c0-publish-no-habit-claim",
] as const);

export const PHASE10_C0_NEGATIVE_CONTROL_IDS = Object.freeze([
  "nc-c0-coarse-fail-fine-pass",
  "nc-c0-duplicate-or-truncated",
  "nc-c0-fine-fail-coarse-pass",
  "nc-c0-forbidden-field",
  "nc-c0-forged-producer-verdict",
  "nc-c0-missing-row",
  "nc-c0-operand-echo",
] as const);

export type Phase10C0DeriveCheckId = typeof PHASE10_C0_DERIVE_CHECK_IDS[number];
export type Phase10C0PublishCheckId = typeof PHASE10_C0_PUBLISH_CHECK_IDS[number];
export type Phase10C0NegativeControlId = typeof PHASE10_C0_NEGATIVE_CONTROL_IDS[number];
export type Phase10C0ErrorSourceId = typeof PHASE10_C0_ERROR_SOURCE_IDS[number];
export type Phase10C0HabitClass = "plate" | "neutral" | "column" | "invalid";
export type Phase10C0FailureClass = "criterion" | "infrastructure" | "mixed";

export interface Phase10C0ArtifactIdentity {
  readonly path: string;
  readonly byteLength: number;
  readonly sha256: string;
}

export interface Phase10C0ExecutionProvenance {
  readonly runtime: string;
  readonly command: string;
  readonly cwd: string;
  readonly gitHead: string;
  readonly startedIso: string;
  readonly finishedIso: string;
  readonly processConcurrency: number;
}

export interface Phase10C0RetainedPreflight {
  readonly packetId: "c0-derive" | "c0-publish";
  readonly attemptId: string;
  readonly command: string;
  readonly cwd: string;
  readonly runtime: typeof PHASE10_C0_RUNTIME;
  readonly gitHead: string;
  readonly observedFreeBytes: number;
  readonly byteLength: number;
  readonly sha256: string;
}

export interface Phase10C0EvaluatorExecutionBinding {
  readonly evaluatorCallableId: string;
  readonly modulePath: string;
  readonly exportName: string;
  readonly byteLength: number;
  readonly sha256: string;
  readonly runtime: string;
  readonly command: string;
  readonly gitHead: string;
  readonly startedOn: string;
  readonly endedOn: string;
  readonly processConcurrency: number;
}

export interface Phase10C0DeriveCandidateBytes {
  readonly rowsBytes: Uint8Array;
  readonly analysisBytes: Uint8Array;
  readonly comparisonsBytes: Uint8Array;
  readonly gapsBytes: Uint8Array;
  readonly historicalLimitBytes: Uint8Array;
}

export interface Phase10C0Row {
  readonly rowId: string;
  readonly tempC: number;
  readonly fraction: number;
  readonly paramSet: string;
  readonly dxUm: number;
  readonly seedRadius: number;
  readonly targetExtent: number;
  readonly domainN: number;
  readonly cflFill: number;
  readonly relaxTol: number;
  readonly surfacePolicy: string;
  readonly farField: string;
  readonly pressurePa: number;
  readonly noiseEpsilon: number;
  readonly rngSeed: number;
  readonly domain: string;
  readonly divTol: number;
  readonly relaxMaxSweeps: number;
  readonly seedThickness: number;
  readonly sigmaInfinity: number;
  readonly stopReason: string;
  readonly cycles: number;
  readonly totalSweeps: number;
  readonly wallSeconds: number;
  readonly attachedCount: number;
  readonly finalExtent: number;
  readonly aspectRatio: number;
  readonly symmetryError: number;
  readonly engine: string;
  readonly peakRssBytes: number;
  readonly gitHead: string;
  readonly startedIso: string;
  readonly finishedIso: string;
  readonly concurrency: number;
  readonly host: string;
  readonly dispatcherCommand: string;
}

export interface Phase10C0ExpectedRow {
  readonly rowId: string;
  readonly tempC: number;
  readonly fraction: number;
  readonly paramSet: string;
  readonly dxUm: number;
  readonly seedRadius: number;
  readonly targetExtent: number;
  readonly domainN: number;
  readonly cflFill: number;
  readonly relaxTol: number;
  readonly surfacePolicy: string;
  readonly farField: string;
  readonly pressurePa: number;
  readonly noiseEpsilon: number;
  readonly rngSeed: number;
  readonly domain: string;
  readonly divTol: number;
  readonly relaxMaxSweeps: number;
  readonly seedThickness: number;
  readonly sigmaInfinity: number;
}

export interface Phase10C0Pairing {
  readonly comparisonId: string;
  readonly kind: "domain" | "auxiliary";
  readonly errorSourceId: Phase10C0ErrorSourceId;
  readonly domainSpacingDxUm: 0.7 | 0.35 | null;
  readonly rowIdA: string;
  readonly rowIdB: string;
}

export interface Phase10C0ArtifactDefect {
  readonly code: string;
  readonly scope: "input" | "row" | "pairing" | "provenance" | "output";
  readonly rowId: string | null;
  readonly lineNumber: number | null;
  readonly detail: string;
}

export interface Phase10C0ParsedRows {
  readonly rowsById: ReadonlyMap<string, Phase10C0Row>;
  readonly expectedRowsById: ReadonlyMap<string, Phase10C0ExpectedRow>;
  readonly pairings: readonly Phase10C0Pairing[];
  readonly missingRowIds: readonly string[];
  readonly unexpectedRowIds: readonly string[];
  readonly duplicateRowIds: readonly string[];
  readonly defects: readonly Phase10C0ArtifactDefect[];
}

export interface Phase10C0Protocol {
  readonly value: StrictJson;
  readonly protocolId: typeof PHASE10_C0_SCIENCE_PROTOCOL_ID;
  readonly adoptionCommit: string;
  readonly rowsArtifact: Phase10C0ArtifactIdentity;
  readonly historicalReportArtifact: Phase10C0ArtifactIdentity;
}

type JsonObject = { readonly [key: string]: StrictJson };

function fail(message: string): never {
  throw new Error(`Phase 10 C0 contract refused: ${message}`);
}

export function phase10C0Lexical(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

export function phase10C0Sha256(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

export function phase10C0ArtifactIdentity(
  path: string,
  bytes: Uint8Array,
): Phase10C0ArtifactIdentity {
  return Object.freeze({ path, byteLength: bytes.byteLength, sha256: phase10C0Sha256(bytes) });
}

export function phase10C0PrettyJsonBytes(value: unknown): Uint8Array {
  return new TextEncoder().encode(`${JSON.stringify(strictJsonSnapshot(value), null, 2)}\n`);
}

export function phase10C0JsonlBytes(rows: readonly unknown[]): Uint8Array {
  if (rows.length === 0) fail("JSONL output cannot be empty");
  return new TextEncoder().encode(
    `${rows.map((row) => canonicalJson(strictJsonSnapshot(row))).join("\n")}\n`,
  );
}

function jsonObject(value: unknown, label: string): JsonObject {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    fail(`${label} must be an object`);
  }
  return value as JsonObject;
}

function exactKeys(value: object, expected: readonly string[], label: string): void {
  const actual = Object.keys(value).sort(phase10C0Lexical);
  const wanted = [...expected].sort(phase10C0Lexical);
  if (actual.length !== wanted.length || actual.some((key, index) => key !== wanted[index])) {
    fail(`${label} fields differ`);
  }
}

export function phase10C0ParsePrettyJson(bytes: Uint8Array, label: string): StrictJson {
  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    fail(`${label} is not valid UTF-8`);
  }
  if (text.includes("\r")) fail(`${label} contains CR bytes`);
  let parsed: unknown;
  try {
    parsed = JSON.parse(text) as unknown;
  } catch {
    fail(`${label} is not valid JSON`);
  }
  const snapshot = strictJsonSnapshot(parsed);
  if (text !== `${JSON.stringify(snapshot, null, 2)}\n`) {
    fail(`${label} is not exact two-space JSON with one terminal LF`);
  }
  return snapshot;
}

function stringField(object: JsonObject, key: string, label: string): string {
  const value = object[key];
  if (typeof value !== "string" || value.length === 0 || value !== value.trim()) {
    fail(`${label}.${key} must be a nonempty trimmed string`);
  }
  return value;
}

function integerField(
  object: JsonObject,
  key: string,
  label: string,
  minimum: number,
): number {
  const value = object[key];
  if (!Number.isSafeInteger(value) || (value as number) < minimum) {
    fail(`${label}.${key} must be a safe integer >= ${minimum}`);
  }
  return value as number;
}

function numberField(
  object: JsonObject,
  key: string,
  label: string,
  minimum: number | null = null,
  strictMinimum = false,
): number {
  const value = object[key];
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    (minimum !== null && (strictMinimum ? value <= minimum : value < minimum))
  ) {
    fail(`${label}.${key} is not a permitted finite number`);
  }
  return value;
}

function artifactIdentityFromProtocol(value: unknown, label: string): Phase10C0ArtifactIdentity {
  const object = jsonObject(value, label);
  exactKeys(object, ["path", "byteLength", "sha256", "gitTextAttribute", "role"], label);
  const path = stringField(object, "path", label);
  const byteLength = integerField(object, "byteLength", label, 0);
  const sha256 = stringField(object, "sha256", label);
  if (!/^[0-9a-f]{64}$/u.test(sha256) || object.gitTextAttribute !== "unset") {
    fail(`${label} identity or text attribute differs`);
  }
  return Object.freeze({ path, byteLength, sha256 });
}

/** Parse the committed C0 scientific protocol without opening either scientific input artifact. */
export function parsePhase10C0Protocol(bytes: Uint8Array): Phase10C0Protocol {
  const value = phase10C0ParsePrettyJson(bytes, "C0 scientific protocol");
  const root = jsonObject(value, "C0 scientific protocol");
  if (root.schema !== "phase10-c0-protocol-v1" || root.protocolId !== PHASE10_C0_SCIENCE_PROTOCOL_ID) {
    fail("C0 scientific protocol identity/state differs");
  }
  const state = jsonObject(root.state, "C0 protocol state");
  exactKeys(state, ["protocol", "historicalPhase6PublishedResultsAlreadyKnown", "phase10RankingRulesChosenFromValues", "solverExecutionAuthorized", "phase6EvidenceMutationAuthorized"], "C0 protocol state");
  if (
    state.protocol !== "frozen-before-phase10-c0-value-analysis" ||
    state.historicalPhase6PublishedResultsAlreadyKnown !== true ||
    state.phase10RankingRulesChosenFromValues !== false ||
    state.solverExecutionAuthorized !== false ||
    state.phase6EvidenceMutationAuthorized !== false
  ) fail("C0 scientific protocol identity/state differs");
  const claimBoundary = jsonObject(root.claimBoundary, "C0 claim boundary");
  exactKeys(claimBoundary, ["allowed", "forbidden"], "C0 claim boundary");
  if (
    !Array.isArray(claimBoundary.allowed) || !Array.isArray(claimBoundary.forbidden) ||
    !claimBoundary.forbidden.includes("a new solver run or replay") ||
    !claimBoundary.forbidden.includes("a target-facing laboratory score or quantitative-validation claim")
  ) fail("C0 claim boundary differs");
  const adoptionCommit = stringField(root, "adoptionCommit", "C0 scientific protocol");
  if (!/^[0-9a-f]{40}$/u.test(adoptionCommit)) fail("C0 adoptionCommit is not a Git hash");
  const inputs = jsonObject(root.inputArtifacts, "C0 inputArtifacts");
  const rowsArtifact = artifactIdentityFromProtocol(inputs.rows, "C0 rows input");
  const historicalReportArtifact = artifactIdentityFromProtocol(
    inputs.historicalReport,
    "C0 historical report input",
  );
  if (
    rowsArtifact.path !== "evidence/phase6-wp2-ladder/rows.jsonl" ||
    rowsArtifact.byteLength !== 73_873 ||
    rowsArtifact.sha256 !== "c4fa70f7d8351f998f4800ff580ddaad0eb09fd2e2f2df7f606ca717e789cd14" ||
    historicalReportArtifact.path !== "evidence/phase6-wp2-ladder/report.json" ||
    historicalReportArtifact.byteLength !== 43_863 ||
    historicalReportArtifact.sha256 !== "fd20f7018dbe2e4a09634c076ff274a017dafe6600321a983836bb8ab1b1ebb7"
  ) {
    fail("C0 frozen input identity differs");
  }
  const rowSchema = jsonObject(root.rowSchema, "C0 rowSchema");
  const fields = jsonObject(rowSchema.fields, "C0 rowSchema.fields");
  exactKeys(fields, PHASE10_C0_ROW_FIELDS, "C0 rowSchema.fields");
  if (
    rowSchema.exactKeySetSortedLfSha256 !==
      "649cc1dadc340eebf11f413b9ff88be5b61b36fab59fa4c7d800f5fe121d1af1"
  ) {
    fail("C0 row key-set identity differs");
  }
  const roster = jsonObject(root.roster, "C0 roster");
  if (roster.expectedRowCount !== 80) fail("C0 expected row count differs");
  const pairings = jsonObject(root.pairingGraph, "C0 pairing graph");
  if (pairings.expectedPairingCount !== 64) fail("C0 expected pairing count differs");
  const aggregation = jsonObject(root.aggregationRules, "C0 aggregation rules");
  if (
    aggregation.overallPass !== "every registered spacing passes" ||
    aggregation.implementationRequirement !==
      "use an all-spacings/every reduction; any-spacing/some aggregation is forbidden"
  ) {
    fail("C0 all-spacings rule differs");
  }
  const command = jsonObject(root.commandSeparation, "C0 command separation");
  if (
    command.requiredExecutionRuntime !== "Node v24.13.1" ||
    typeof command.producer !== "string" ||
    !(command.producer as string).includes("does not produce the independent verdict")
  ) {
    fail("C0 command separation differs");
  }
  const protocol: Phase10C0Protocol = Object.freeze({
    value,
    protocolId: PHASE10_C0_SCIENCE_PROTOCOL_ID,
    adoptionCommit,
    rowsArtifact,
    historicalReportArtifact,
  });
  // These calculations bind code-generated rosters back to the protocol's frozen digest tuples.
  const expectedRows = phase10C0ExpectedRows();
  const rowRosterBytes = new TextEncoder().encode(
    `${expectedRows.map((row) => row.rowId).sort(phase10C0Lexical).join("\n")}\n`,
  );
  const expectedPairings = phase10C0ExpectedPairings();
  const pairingRosterBytes = new TextEncoder().encode(
    `${expectedPairings.map((pairing) => pairing.comparisonId).sort(phase10C0Lexical).join("\n")}\n`,
  );
  if (
    rowRosterBytes.byteLength !== 2_152 ||
    phase10C0Sha256(rowRosterBytes) !==
      "560b19895d883e77dee2a3ea889d45684aa9188ba247fc1f2fcbbb8a0c537593" ||
    pairingRosterBytes.byteLength !== 3_992 ||
    phase10C0Sha256(pairingRosterBytes) !==
      "90016bf4f3d3268f83409a760146ece6110626042c83e4e33a980b44d2a52216"
  ) {
    fail("code-generated C0 roster identities differ from the frozen protocol");
  }
  return protocol;
}

const CHECK_POINTS = Object.freeze([
  Object.freeze({ tempC: -31, fraction: 0.6, sigmaInfinity: 0.21204000000000003 }),
  Object.freeze({ tempC: -13, fraction: 0.15, sigmaInfinity: 0.02025 }),
  Object.freeze({ tempC: -6, fraction: 0.15, sigmaInfinity: 0.00906 }),
  Object.freeze({ tempC: -27, fraction: 0.15, sigmaInfinity: 0.045375 }),
]);
const ARMS = Object.freeze(["M1", "CAK"] as const);
const SPACINGS = Object.freeze([
  Object.freeze({ dxUm: 0.7 as const, seedRadius: 8, targetExtent: 27, domainNs: Object.freeze([48, 64, 80]) }),
  Object.freeze({ dxUm: 0.35 as const, seedRadius: 17, targetExtent: 54, domainNs: Object.freeze([96, 112, 128]) }),
]);
const AUXILIARY_CONTROLS = Object.freeze([
  Object.freeze({ name: "cfl0.05", cflFill: 0.05, relaxTol: 1e-9, seedRadius: 17 }),
  Object.freeze({ name: "relaxTol1e-10", cflFill: 0.1, relaxTol: 1e-10, seedRadius: 17 }),
  Object.freeze({ name: "seed16", cflFill: 0.1, relaxTol: 1e-9, seedRadius: 16 }),
  Object.freeze({ name: "seed18", cflFill: 0.1, relaxTol: 1e-9, seedRadius: 18 }),
]);
const FIXED = Object.freeze({
  surfacePolicy: "aggregate-hv-g1h1-v6",
  farField: "monopole-matched",
  pressurePa: 101_325,
  noiseEpsilon: 0,
  rngSeed: 1,
  domain: "hexPrism",
  divTol: 1e-7,
  relaxMaxSweeps: 200_000,
});

function expectedRow(
  rowId: string,
  point: typeof CHECK_POINTS[number],
  arm: typeof ARMS[number],
  dxUm: number,
  seedRadius: number,
  targetExtent: number,
  domainN: number,
  cflFill: number,
  relaxTol: number,
): Phase10C0ExpectedRow {
  return Object.freeze({
    rowId,
    tempC: point.tempC,
    fraction: point.fraction,
    paramSet: arm,
    dxUm,
    seedRadius,
    targetExtent,
    domainN,
    cflFill,
    relaxTol,
    ...FIXED,
    seedThickness: 2 * seedRadius + 1,
    sigmaInfinity: point.sigmaInfinity,
  });
}

/** Deterministically enumerate the exact 80-row registered roster without opening row values. */
export function phase10C0ExpectedRows(): readonly Phase10C0ExpectedRow[] {
  const rows: Phase10C0ExpectedRow[] = [];
  for (const spacing of SPACINGS) {
    for (const domainN of spacing.domainNs) {
      for (const point of CHECK_POINTS) {
        for (const arm of ARMS) {
          rows.push(expectedRow(
            `dom-${spacing.dxUm}-n${domainN}@${point.tempC}C-f${point.fraction}-${arm}`,
            point,
            arm,
            spacing.dxUm,
            spacing.seedRadius,
            spacing.targetExtent,
            domainN,
            0.1,
            1e-9,
          ));
        }
      }
    }
  }
  for (const control of AUXILIARY_CONTROLS) {
    for (const point of CHECK_POINTS) {
      for (const arm of ARMS) {
        rows.push(expectedRow(
          `aux-${control.name}@${point.tempC}C-f${point.fraction}-${arm}`,
          point,
          arm,
          0.35,
          control.seedRadius,
          54,
          96,
          control.cflFill,
          control.relaxTol,
        ));
      }
    }
  }
  if (rows.length !== 80 || new Set(rows.map((row) => row.rowId)).size !== 80) {
    fail("C0 row enumeration is not exactly 80 unique rows");
  }
  return Object.freeze(rows);
}

function domainId(dxUm: number, domainN: number, tempC: number, fraction: number, arm: string): string {
  return `dom-${dxUm}-n${domainN}@${tempC}C-f${fraction}-${arm}`;
}

/** Deterministically enumerate the exact 64 oriented comparison pairs and error-source groups. */
export function phase10C0ExpectedPairings(): readonly Phase10C0Pairing[] {
  const pairings: Phase10C0Pairing[] = [];
  for (const spacing of SPACINGS) {
    for (let index = 0; index + 1 < spacing.domainNs.length; index += 1) {
      const domainA = spacing.domainNs[index]!;
      const domainB = spacing.domainNs[index + 1]!;
      for (const point of CHECK_POINTS) {
        for (const arm of ARMS) {
          const rowIdA = domainId(spacing.dxUm, domainA, point.tempC, point.fraction, arm);
          const rowIdB = domainId(spacing.dxUm, domainB, point.tempC, point.fraction, arm);
          pairings.push(Object.freeze({
            comparisonId: `domain|${rowIdA}|${rowIdB}`,
            kind: "domain",
            errorSourceId: spacing.dxUm === 0.7
              ? "domain-coarse-spacing"
              : "domain-fine-spacing",
            domainSpacingDxUm: spacing.dxUm,
            rowIdA,
            rowIdB,
          }));
        }
      }
    }
  }
  for (const control of AUXILIARY_CONTROLS) {
    for (const point of CHECK_POINTS) {
      for (const arm of ARMS) {
        const rowIdA = domainId(0.35, 96, point.tempC, point.fraction, arm);
        const rowIdB = `aux-${control.name}@${point.tempC}C-f${point.fraction}-${arm}`;
        const errorSourceId: Phase10C0ErrorSourceId = control.name === "cfl0.05"
          ? "cflFill"
          : control.name === "relaxTol1e-10"
          ? "relaxTol"
          : "seedRadius";
        pairings.push(Object.freeze({
          comparisonId: `auxiliary|${rowIdA}|${rowIdB}`,
          kind: "auxiliary",
          errorSourceId,
          domainSpacingDxUm: null,
          rowIdA,
          rowIdB,
        }));
      }
    }
  }
  const sorted = pairings.sort((left, right) => phase10C0Lexical(left.comparisonId, right.comparisonId));
  if (sorted.length !== 64 || new Set(sorted.map((pairing) => pairing.comparisonId)).size !== 64) {
    fail("C0 pairing enumeration is not exactly 64 unique pairs");
  }
  return Object.freeze(sorted);
}

function topLevelKeys(line: string): readonly string[] {
  const keys: string[] = [];
  let index = 0;
  const skip = (): void => {
    while (/\s/u.test(line[index] ?? "")) index += 1;
  };
  skip();
  if (line[index] !== "{") fail("JSONL row is not an object");
  index += 1;
  while (true) {
    skip();
    if (line[index] === "}") return keys;
    if (line[index] !== '"') fail("JSONL row has a non-string top-level key");
    const start = index;
    index += 1;
    let escaped = false;
    while (index < line.length) {
      const character = line[index]!;
      index += 1;
      if (escaped) {
        escaped = false;
      } else if (character === "\\") {
        escaped = true;
      } else if (character === '"') {
        break;
      }
    }
    const token = line.slice(start, index);
    let key: unknown;
    try {
      key = JSON.parse(token) as unknown;
    } catch {
      fail("JSONL row has an invalid top-level key escape");
    }
    if (typeof key !== "string") fail("JSONL row key is not a string");
    if (keys.includes(key)) fail(`JSONL row duplicates top-level key ${key}`);
    keys.push(key);
    skip();
    if (line[index] !== ":") fail("JSONL row key has no colon");
    index += 1;
    skip();
    let depth = 0;
    let inString = false;
    escaped = false;
    while (index < line.length) {
      const character = line[index]!;
      if (inString) {
        if (escaped) escaped = false;
        else if (character === "\\") escaped = true;
        else if (character === '"') inString = false;
      } else if (character === '"') inString = true;
      else if (character === "[" || character === "{") depth += 1;
      else if (character === "]" || character === "}") {
        if (depth === 0 && character === "}") break;
        depth -= 1;
      } else if (character === "," && depth === 0) break;
      index += 1;
    }
    skip();
    if (line[index] === ",") {
      index += 1;
      continue;
    }
    if (line[index] === "}") return keys;
    fail("JSONL row has an invalid top-level delimiter");
  }
}

function parseRow(value: unknown, label: string): Phase10C0Row {
  const row = jsonObject(value, label);
  exactKeys(row, PHASE10_C0_ROW_FIELDS, label);
  const parsed: Phase10C0Row = Object.freeze({
    rowId: stringField(row, "rowId", label),
    tempC: numberField(row, "tempC", label),
    fraction: numberField(row, "fraction", label),
    paramSet: stringField(row, "paramSet", label),
    dxUm: numberField(row, "dxUm", label, 0, true),
    seedRadius: integerField(row, "seedRadius", label, 1),
    targetExtent: integerField(row, "targetExtent", label, 1),
    domainN: integerField(row, "domainN", label, 1),
    cflFill: numberField(row, "cflFill", label, 0, true),
    relaxTol: numberField(row, "relaxTol", label, 0, true),
    surfacePolicy: stringField(row, "surfacePolicy", label),
    farField: stringField(row, "farField", label),
    pressurePa: numberField(row, "pressurePa", label, 0, true),
    noiseEpsilon: numberField(row, "noiseEpsilon", label, 0),
    rngSeed: integerField(row, "rngSeed", label, Number.MIN_SAFE_INTEGER),
    domain: stringField(row, "domain", label),
    divTol: numberField(row, "divTol", label, 0, true),
    relaxMaxSweeps: integerField(row, "relaxMaxSweeps", label, 1),
    seedThickness: integerField(row, "seedThickness", label, 1),
    sigmaInfinity: numberField(row, "sigmaInfinity", label),
    stopReason: stringField(row, "stopReason", label),
    cycles: integerField(row, "cycles", label, 0),
    totalSweeps: integerField(row, "totalSweeps", label, 0),
    wallSeconds: numberField(row, "wallSeconds", label, 0),
    attachedCount: integerField(row, "attachedCount", label, 0),
    finalExtent: integerField(row, "finalExtent", label, 0),
    aspectRatio: numberField(row, "aspectRatio", label, 0, true),
    symmetryError: numberField(row, "symmetryError", label, 0),
    engine: stringField(row, "engine", label),
    peakRssBytes: integerField(row, "peakRssBytes", label, 0),
    gitHead: stringField(row, "gitHead", label),
    startedIso: stringField(row, "startedIso", label),
    finishedIso: stringField(row, "finishedIso", label),
    concurrency: integerField(row, "concurrency", label, 1),
    host: stringField(row, "host", label),
    dispatcherCommand: stringField(row, "dispatcherCommand", label),
  });
  if (!/^[0-9a-f]{40}$/u.test(parsed.gitHead)) fail(`${label}.gitHead is malformed`);
  if (Number.isNaN(Date.parse(parsed.startedIso)) || Number.isNaN(Date.parse(parsed.finishedIso))) {
    fail(`${label} timestamps are malformed`);
  }
  return parsed;
}

const ECHO_FIELDS = Object.freeze([
  "tempC", "fraction", "paramSet", "dxUm", "seedRadius", "targetExtent", "domainN",
  "cflFill", "relaxTol", "surfacePolicy", "farField", "pressurePa", "noiseEpsilon",
  "rngSeed", "domain", "divTol", "relaxMaxSweeps", "seedThickness", "sigmaInfinity",
] as const);

function rowEchoErrors(row: Phase10C0Row, expected: Phase10C0ExpectedRow): readonly string[] {
  const errors: string[] = [];
  for (const field of ECHO_FIELDS) {
    if (row[field] !== expected[field]) {
      errors.push(`${field}=${JSON.stringify(row[field])} expected ${JSON.stringify(expected[field])}`);
    }
  }
  return errors;
}

/** Strictly parse the input JSONL and retain named defects instead of defaulting malformed rows. */
export function parsePhase10C0Rows(bytes: Uint8Array): Phase10C0ParsedRows {
  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    fail("C0 rows are not valid UTF-8");
  }
  const expectedRows = phase10C0ExpectedRows();
  const expectedRowsById = new Map(expectedRows.map((row) => [row.rowId, row] as const));
  const pairings = phase10C0ExpectedPairings();
  const defects: Phase10C0ArtifactDefect[] = [];
  const rowsById = new Map<string, Phase10C0Row>();
  const duplicateIds = new Set<string>();
  const unexpectedIds = new Set<string>();
  if (text.includes("\r")) {
    defects.push({ code: "c0-input-cr-byte", scope: "input", rowId: null, lineNumber: null, detail: "rows contain CR bytes" });
  }
  const hasTerminalLf = text.endsWith("\n");
  if (!hasTerminalLf) {
    defects.push({ code: "c0-input-missing-terminal-lf", scope: "input", rowId: null, lineNumber: null, detail: "rows lack the required terminal LF" });
  }
  const lines = (hasTerminalLf ? text.slice(0, -1) : text).split("\n");
  if (lines.some((line) => line.length === 0)) {
    defects.push({ code: "c0-input-blank-line", scope: "input", rowId: null, lineNumber: null, detail: "rows contain a blank line" });
  }
  for (const [offset, line] of lines.entries()) {
    const lineNumber = offset + 1;
    if (line.length === 0) continue;
    let parsed: unknown;
    let keys: readonly string[];
    try {
      keys = topLevelKeys(line);
      parsed = JSON.parse(line) as unknown;
    } catch (error) {
      defects.push({
        code: "c0-row-malformed-json",
        scope: "row",
        rowId: null,
        lineNumber,
        detail: error instanceof Error ? error.message : "row is malformed JSON",
      });
      continue;
    }
    const sortedKeys = [...keys].sort(phase10C0Lexical);
    const expectedKeys = [...PHASE10_C0_ROW_FIELDS].sort(phase10C0Lexical);
    if (
      sortedKeys.length !== expectedKeys.length ||
      sortedKeys.some((key, index) => key !== expectedKeys[index])
    ) {
      const possible = parsed !== null && typeof parsed === "object" && !Array.isArray(parsed)
        ? (parsed as { readonly rowId?: unknown }).rowId
        : null;
      defects.push({
        code: "c0-row-key-set",
        scope: "row",
        rowId: typeof possible === "string" ? possible : null,
        lineNumber,
        detail: "row key set differs from the frozen 36-field schema",
      });
      continue;
    }
    let row: Phase10C0Row;
    try {
      row = parseRow(parsed, `C0 row line ${lineNumber}`);
    } catch (error) {
      const possible = parsed !== null && typeof parsed === "object" && !Array.isArray(parsed)
        ? (parsed as { readonly rowId?: unknown }).rowId
        : null;
      defects.push({
        code: "c0-row-field-contract",
        scope: "row",
        rowId: typeof possible === "string" ? possible : null,
        lineNumber,
        detail: error instanceof Error ? error.message : "row field contract failed",
      });
      continue;
    }
    if (!expectedRowsById.has(row.rowId)) {
      unexpectedIds.add(row.rowId);
      defects.push({ code: "c0-unexpected-row", scope: "row", rowId: row.rowId, lineNumber, detail: "rowId is outside the frozen roster" });
      continue;
    }
    if (rowsById.has(row.rowId) || duplicateIds.has(row.rowId)) {
      duplicateIds.add(row.rowId);
      rowsById.delete(row.rowId);
      defects.push({ code: "c0-duplicate-row", scope: "row", rowId: row.rowId, lineNumber, detail: "rowId occurs more than once" });
      continue;
    }
    const expected = expectedRowsById.get(row.rowId)!;
    const echoErrors = rowEchoErrors(row, expected);
    if (echoErrors.length > 0) {
      defects.push({ code: "c0-operand-echo", scope: "row", rowId: row.rowId, lineNumber, detail: echoErrors.join("; ") });
      continue;
    }
    const sanctionedHeads = new Set([
      "f59d18702301155c0c2e7eaecc3442e6cf117123",
      "aa812952efbf5c4ef7152cc7595342092a51b000",
      "3827b7763e870da6a81f8dc3430cfc4be5ab3ec6",
    ]);
    if (!sanctionedHeads.has(row.gitHead)) {
      defects.push({ code: "c0-unsanctioned-head", scope: "provenance", rowId: row.rowId, lineNumber, detail: `unsanctioned gitHead ${row.gitHead}` });
      continue;
    }
    if (/^dom-0\.35-n(112|128)@/u.test(row.rowId) && row.gitHead === "f59d18702301155c0c2e7eaecc3442e6cf117123") {
      defects.push({ code: "c0-heavy-row-freeze-head", scope: "provenance", rowId: row.rowId, lineNumber, detail: "heavy row carries the forbidden pre-amendment head" });
      continue;
    }
    rowsById.set(row.rowId, row);
  }
  for (const duplicateId of duplicateIds) rowsById.delete(duplicateId);
  const missingRowIds = [...expectedRowsById.keys()]
    .filter((rowId) => !rowsById.has(rowId))
    .sort(phase10C0Lexical);
  for (const rowId of missingRowIds) {
    defects.push({ code: "c0-missing-row", scope: "row", rowId, lineNumber: null, detail: "expected row is unavailable or invalid" });
  }
  const sortedDefects = defects.sort((left, right) =>
    phase10C0Lexical(
      `${left.code}\u0000${left.rowId ?? ""}\u0000${left.lineNumber ?? 0}`,
      `${right.code}\u0000${right.rowId ?? ""}\u0000${right.lineNumber ?? 0}`,
    ));
  return Object.freeze({
    rowsById,
    expectedRowsById,
    pairings,
    missingRowIds: Object.freeze(missingRowIds),
    unexpectedRowIds: Object.freeze([...unexpectedIds].sort(phase10C0Lexical)),
    duplicateRowIds: Object.freeze([...duplicateIds].sort(phase10C0Lexical)),
    defects: Object.freeze(sortedDefects),
  });
}

export function phase10C0ClassifyHabit(aspectRatio: number): Phase10C0HabitClass {
  if (!Number.isFinite(aspectRatio) || aspectRatio <= 0) return "invalid";
  if (aspectRatio <= 1 / 1.5) return "plate";
  if (aspectRatio >= 1.5) return "column";
  return "neutral";
}

export function phase10C0FoldFailureClasses(
  classes: readonly Phase10C0FailureClass[],
): Phase10C0FailureClass | null {
  const distinct = new Set(classes);
  if (distinct.size === 0) return null;
  if (distinct.size > 1 || distinct.has("mixed")) return "mixed";
  return [...distinct][0]!;
}

/** The authoritative top-level reduction. Deliberately exported for both mixed-direction controls. */
export function phase10C0EverySpacing(
  spacingVerdicts: readonly ("pass" | "no-pass")[],
): "pass" | "no-pass" {
  if (spacingVerdicts.length !== 2) fail("all-spacings reduction requires exactly two spacings");
  return spacingVerdicts.every((verdict) => verdict === "pass") ? "pass" : "no-pass";
}

export function phase10C0NormalizedAbsoluteDelta(left: number, right: number): number {
  if (!Number.isFinite(left) || !Number.isFinite(right)) fail("diagnostic operands must be finite");
  const scale = Math.max(Math.abs(left), Math.abs(right));
  return scale === 0 ? 0 : Math.abs(right - left) / scale;
}

export function phase10C0GapItems(): readonly StrictJson[] {
  const definitions: Readonly<Record<string, readonly [string, string, string]>> = Object.freeze({
    "attachment-event-orbit": ["per-cycle attachment coordinates or orbit witnesses", "absent-from-persisted-rows", "attachment-event bytes"],
    "checkpoint-state": ["checkpoint or resume-state bytes", "absent-from-persisted-rows", "checkpoint bytes"],
    "crystallographic-calipers": ["exact crystallographic spans or axis calipers", "forbidden-inference", "registered caliper output"],
    "future-target-observation": ["a future B-defined observation operator", "requires-future-observation-operator", "future selected target operator"],
    "kinetic-ledgers": ["kinetic, clipping, hole-fill, or vapor ledgers", "absent-from-persisted-rows", "detailed ledger bytes"],
    "occupancy-mask": ["occupancy or attached-cell masks", "absent-from-persisted-rows", "occupancy bytes"],
    "physical-time-history": ["physical-time history", "absent-from-persisted-rows", "per-step physical-time bytes"],
    "relaxation-histories": ["relaxation residual, divergence, or smoother-drift histories", "absent-from-persisted-rows", "relaxation history bytes"],
    "trajectory": ["per-cycle or continuous trajectories", "absent-from-persisted-rows", "trajectory bytes"],
    "vapor-surface-fields": ["vapor-field or surface-propensity arrays", "absent-from-persisted-rows", "field-array bytes"],
  });
  return Object.freeze(PHASE10_C0_GAP_IDS.map((gapId) => {
    const [fieldDescription, reasonCode, requiredSource] = definitions[gapId]!;
    return strictJsonSnapshot({
      gapId,
      fieldDescription,
      availability: "unavailable",
      reasonCode,
      requiredSource,
      disposition: "explicit-refusal",
    });
  }));
}

export function phase10C0AssertExecution(execution: Phase10C0ExecutionProvenance): void {
  exactKeys(execution, ["runtime", "command", "cwd", "gitHead", "startedIso", "finishedIso", "processConcurrency"], "C0 execution provenance");
  if (execution.runtime !== PHASE10_C0_RUNTIME) fail(`runtime ${execution.runtime} differs from ${PHASE10_C0_RUNTIME}`);
  if (!/^[0-9a-f]{40}$/u.test(execution.gitHead)) fail("execution gitHead is malformed");
  if (execution.processConcurrency !== 1) fail("C0 processConcurrency must be exactly one");
  if (
    execution.command.length === 0 || execution.cwd.length === 0 ||
    Number.isNaN(Date.parse(execution.startedIso)) || Number.isNaN(Date.parse(execution.finishedIso)) ||
    Date.parse(execution.finishedIso) < Date.parse(execution.startedIso)
  ) {
    fail("execution command/cwd/timestamp contract differs");
  }
}

function exactStringArray(value: StrictJson | undefined, expected: readonly string[], label: string): void {
  if (!Array.isArray(value) || value.length !== expected.length || value.some((item, index) => item !== expected[index])) {
    fail(`${label} differs from the exact sorted registration`);
  }
}

function safeIdentity(value: StrictJson | undefined, label: string): void {
  const identity = jsonObject(value, label);
  exactKeys(identity, ["path", "byteLength", "sha256"], label);
  const path = stringField(identity, "path", label);
  if (
    path.includes("\\") || path.startsWith("/") || path.split("/").some((part) => part === "" || part === "." || part === "..") ||
    !Number.isSafeInteger(identity.byteLength) || (identity.byteLength as number) < 0 ||
    typeof identity.sha256 !== "string" || !/^[0-9a-f]{64}$/u.test(identity.sha256)
  ) fail(`${label} identity differs`);
}

/** Parse and tightly bind the executor's retained preflight without importing executor code. */
export function phase10C0ParseRetainedPreflight(
  bytes: Uint8Array,
  packetId: "c0-derive" | "c0-publish",
): Phase10C0RetainedPreflight {
  const receipt = jsonObject(phase10C0ParsePrettyJson(bytes, `${packetId} retained preflight`), `${packetId} retained preflight`);
  exactKeys(receipt, [
    "schema", "receiptId", "matrixId", "protocolId", "registryId", "packetId", "attemptId", "stage",
    "observed", "outputIds", "checkIds", "negativeControlIds", "callableIds", "selectedBranches", "verdict", "reasons",
  ], `${packetId} retained preflight`);
  const attemptId = stringField(receipt, "attemptId", `${packetId} retained preflight`);
  if (!/^[a-z0-9][a-z0-9.-]*$/u.test(attemptId)) fail(`${packetId} retained preflight attempt ID is unsafe`);
  const expectedProtocolId = packetId === "c0-derive" ? "phase10-c0-derive-existing-byte-v1" : "phase10-c0-publish-existing-byte-v1";
  const expectedRegistryId = packetId === "c0-derive" ? "phase10-c0-derive-resolved-callables-v3" : "phase10-c0-publish-resolved-callables-v3";
  if (
    receipt.schema !== "phase10-preflight-receipt-v1" || receipt.receiptId !== `phase10-${packetId}-${attemptId}-preflight-v1` ||
    receipt.matrixId !== PHASE10_C0_MATRIX_ID || receipt.protocolId !== expectedProtocolId || receipt.registryId !== expectedRegistryId ||
    receipt.packetId !== packetId || receipt.stage !== "run" || receipt.verdict !== "pass"
  ) fail(`${packetId} retained preflight identity/verdict differs`);
  const expectedOutputs = packetId === "c0-derive"
    ? [...Object.keys(PHASE10_C0_DERIVE_OUTPUTS), "out-c0-derive-verification"].sort(phase10C0Lexical)
    : [...Object.keys(PHASE10_C0_PUBLISH_OUTPUTS), "out-c0-verification-receipt"].sort(phase10C0Lexical);
  const expectedChecks = packetId === "c0-derive" ? PHASE10_C0_DERIVE_CHECK_IDS : PHASE10_C0_PUBLISH_CHECK_IDS;
  const expectedControls = packetId === "c0-derive" ? PHASE10_C0_NEGATIVE_CONTROL_IDS : [];
  const expectedDependencies = packetId === "c0-derive" ? ["a-p"] : ["a-p", "c0-derive"];
  const expectedCallables = packetId === "c0-derive"
    ? [
        "phase10-c0-derive-check-caller", "phase10-c0-derive-producer", "phase10-c0-derive-verification-receipt-writer",
        "phase10-c0-evaluator", "phase10-nc-c0-coarse-fail-fine-pass", "phase10-nc-c0-duplicate-or-truncated",
        "phase10-nc-c0-fine-fail-coarse-pass", "phase10-nc-c0-forbidden-field", "phase10-nc-c0-forged-producer-verdict",
        "phase10-nc-c0-missing-row", "phase10-nc-c0-operand-echo",
      ].sort(phase10C0Lexical)
    : ["phase10-c0-publication-verifier", "phase10-c0-publish-check-caller", "phase10-c0-publish-producer", "phase10-c0-publish-verification-receipt-writer"].sort(phase10C0Lexical);
  exactStringArray(receipt.outputIds, expectedOutputs, `${packetId} retained outputs`);
  exactStringArray(receipt.checkIds, expectedChecks, `${packetId} retained checks`);
  exactStringArray(receipt.negativeControlIds, expectedControls, `${packetId} retained controls`);
  exactStringArray(receipt.callableIds, expectedCallables, `${packetId} retained callables`);
  if (canonicalJson(receipt.selectedBranches as StrictJson) !== "{}") fail(`${packetId} selected branch selection differs`);
  exactStringArray(receipt.reasons, [], `${packetId} retained reasons`);
  const observed = jsonObject(receipt.observed, `${packetId} retained observations`);
  exactKeys(observed, [
    "launchClass", "branch", "head", "runtime", "command", "cwd", "repositoryBundleRoot", "matrix", "packetCatalogue",
    "artifactSchemaRegistry", "scienceProtocol", "protocol", "callableRegistry", "codeFreeze", "registeredAttemptRoot",
    "attemptDirectory", "candidateDirectory", "stdoutPath", "stderrPath", "exitStatusPath", "resourceLedgerPath", "lockPath",
    "finalPreflightReceiptPath", "finalTerminalReceiptPath", "verificationPaths", "dependencyPacketIds", "dependencyArtifacts", "resources",
  ], `${packetId} retained observations`);
  const head = stringField(observed, "head", `${packetId} retained observations`);
  const runtime = stringField(observed, "runtime", `${packetId} retained observations`);
  const command = stringField(observed, "command", `${packetId} retained observations`);
  const cwd = stringField(observed, "cwd", `${packetId} retained observations`);
  const packetRoot = `out/phase10-execution-v1/attempts/${packetId}`;
  const attemptRoot = `${packetRoot}/${attemptId}`;
  const verificationPath = packetId === "c0-derive"
    ? "evidence/phase10-numerical-verification-v1/c0-derive-verification.json"
    : "evidence/phase10-numerical-verification-v1/c0-verification.json";
  if (
    observed.launchClass !== "non-solver" || observed.branch !== PHASE10_C0_BRANCH ||
    !/^[0-9a-f]{40}$/u.test(head) || runtime !== PHASE10_C0_RUNTIME ||
    command !== phase10C0ExecutorCommand(packetId, attemptId) || observed.repositoryBundleRoot !== "." ||
    observed.registeredAttemptRoot !== packetRoot || observed.attemptDirectory !== attemptRoot ||
    observed.candidateDirectory !== `${attemptRoot}/candidate` || observed.stdoutPath !== `${attemptRoot}/stdout.log` ||
    observed.stderrPath !== `${attemptRoot}/stderr.log` || observed.exitStatusPath !== `${attemptRoot}/exit-status.json` ||
    observed.resourceLedgerPath !== `${attemptRoot}/resource-ledger.json` || observed.lockPath !== `${packetRoot}/writer.lock` ||
    observed.finalPreflightReceiptPath !== `evidence/phase10-obligation-preflight-v1/packets/${packetId}/preflight.json` ||
    observed.finalTerminalReceiptPath !== `evidence/phase10-obligation-preflight-v1/packets/${packetId}/terminal-receipt.json`
  ) fail(`${packetId} retained path/provenance observations differ`);
  exactStringArray(observed.verificationPaths, [verificationPath], `${packetId} verification paths`);
  exactStringArray(observed.dependencyPacketIds, expectedDependencies, `${packetId} dependency IDs`);
  for (const [field, expectedPath] of [
    ["matrix", "research/phase10-obligation-matrix-v1.json"],
    ["packetCatalogue", "research/phase10-execution-v1/packet-catalogue.json"],
    ["artifactSchemaRegistry", "research/phase10-artifact-schema-registry-v1.json"],
    ["scienceProtocol", PHASE10_C0_SCIENCE_PROTOCOL_PATH],
    ["protocol", packetId === "c0-derive" ? PHASE10_C0_DERIVE_PACKET_PROTOCOL_PATH : PHASE10_C0_PUBLISH_PACKET_PROTOCOL_PATH],
    ["callableRegistry", `research/phase10-execution-v1/packets/${packetId}/callable-registry.json`],
  ] as const) {
    safeIdentity(observed[field], `${packetId} observed ${field}`);
    if (jsonObject(observed[field], `${packetId} observed ${field}`).path !== expectedPath) fail(`${packetId} observed ${field} path differs`);
  }
  const freeze = jsonObject(observed.codeFreeze, `${packetId} code freeze`);
  exactKeys(freeze, ["commit", "artifacts"], `${packetId} code freeze`);
  if (typeof freeze.commit !== "string" || !/^[0-9a-f]{40}$/u.test(freeze.commit) || !Array.isArray(freeze.artifacts) || freeze.artifacts.length === 0) {
    fail(`${packetId} code freeze differs`);
  }
  const freezePaths = freeze.artifacts.map((value, index) => {
    safeIdentity(value, `${packetId} code freeze artifact ${index}`);
    return jsonObject(value, `${packetId} code freeze artifact ${index}`).path as string;
  });
  if (freezePaths.some((path, index) => index > 0 && freezePaths[index - 1]! >= path)) fail(`${packetId} code freeze artifact roster is not sorted unique`);
  if (!Array.isArray(observed.dependencyArtifacts) || observed.dependencyArtifacts.length !== expectedDependencies.length) fail(`${packetId} dependency artifact roster differs`);
  for (const [index, value] of observed.dependencyArtifacts.entries()) {
    const dependency = jsonObject(value, `${packetId} dependency artifact ${index}`);
    exactKeys(dependency, ["packetId", "protocol", "callableRegistry", "preflightReceipt", "terminalReceipt", "verificationArtifacts"], `${packetId} dependency artifact ${index}`);
    if (dependency.packetId !== expectedDependencies[index]) fail(`${packetId} dependency artifact order differs`);
    for (const field of ["protocol", "callableRegistry", "preflightReceipt", "terminalReceipt"] as const) safeIdentity(dependency[field], `${packetId} dependency ${String(dependency.packetId)} ${field}`);
    if (!Array.isArray(dependency.verificationArtifacts) || dependency.verificationArtifacts.length !== 1) fail(`${packetId} dependency verification artifact roster differs`);
    safeIdentity(dependency.verificationArtifacts[0], `${packetId} dependency verification artifact`);
  }
  const resources = jsonObject(observed.resources, `${packetId} retained resources`);
  exactKeys(resources, [...Object.keys(PHASE10_C0_EXECUTOR_RESOURCES), "observedFreeBytes"], `${packetId} retained resources`);
  for (const [key, value] of Object.entries(PHASE10_C0_EXECUTOR_RESOURCES)) {
    if (resources[key] !== value) fail(`${packetId} retained resource ${key} differs`);
  }
  if (!Number.isSafeInteger(resources.observedFreeBytes) || (resources.observedFreeBytes as number) < PHASE10_C0_EXECUTOR_RESOURCES.minimumFreeBytes) {
    fail(`${packetId} retained observed free bytes are insufficient`);
  }
  return Object.freeze({
    packetId,
    attemptId,
    command,
    cwd,
    runtime: PHASE10_C0_RUNTIME,
    gitHead: head,
    observedFreeBytes: resources.observedFreeBytes as number,
    byteLength: bytes.byteLength,
    sha256: phase10C0Sha256(bytes),
  });
}

export function phase10C0AssertBoundExecution(
  execution: Phase10C0ExecutionProvenance,
  preflightReceiptBytes: Uint8Array,
  packetId: "c0-derive" | "c0-publish",
): Phase10C0RetainedPreflight {
  phase10C0AssertExecution(execution);
  const preflight = phase10C0ParseRetainedPreflight(preflightReceiptBytes, packetId);
  if (
    execution.command !== preflight.command || execution.cwd !== preflight.cwd || execution.gitHead !== preflight.gitHead ||
    execution.runtime !== preflight.runtime || execution.processConcurrency !== PHASE10_C0_EXECUTOR_RESOURCES.processConcurrency
  ) fail(`${packetId} execution differs from its retained preflight`);
  return preflight;
}

export function phase10C0AssertBoundEvaluatorExecution(
  execution: Phase10C0EvaluatorExecutionBinding,
  executionCwd: string,
  preflightReceiptBytes: Uint8Array,
  packetId: "c0-derive" | "c0-publish",
): Phase10C0RetainedPreflight {
  exactKeys(execution, [
    "evaluatorCallableId", "modulePath", "exportName", "byteLength", "sha256", "runtime", "command", "gitHead",
    "startedOn", "endedOn", "processConcurrency",
  ], `${packetId} evaluator execution`);
  const preflight = phase10C0ParseRetainedPreflight(preflightReceiptBytes, packetId);
  if (
    execution.command !== preflight.command || executionCwd !== preflight.cwd || execution.gitHead !== preflight.gitHead ||
    execution.runtime !== preflight.runtime || execution.processConcurrency !== PHASE10_C0_EXECUTOR_RESOURCES.processConcurrency ||
    !Number.isSafeInteger(execution.byteLength) || execution.byteLength <= 0 || !/^[0-9a-f]{64}$/u.test(execution.sha256) ||
    Number.isNaN(Date.parse(execution.startedOn)) || Number.isNaN(Date.parse(execution.endedOn)) ||
    Date.parse(execution.endedOn) < Date.parse(execution.startedOn)
  ) fail(`${packetId} evaluator execution differs from its retained preflight`);
  return preflight;
}

export function phase10C0ExactJson(left: unknown, right: unknown): boolean {
  return canonicalJson(strictJsonSnapshot(left)) === canonicalJson(strictJsonSnapshot(right));
}
