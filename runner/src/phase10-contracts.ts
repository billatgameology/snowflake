import { strictJsonSnapshot, type StrictJson } from "./gate4-evidence.ts";

export const PHASE10_OBLIGATION_MATRIX_SCHEMA = "phase10-obligation-matrix-v1" as const;
export const PHASE10_PACKET_PROTOCOL_SCHEMA = "phase10-packet-protocol-v1" as const;
export const PHASE10_CALLABLE_REGISTRY_SCHEMA = "phase10-callable-registry-v1" as const;
export const PHASE10_EXECUTION_RECEIPT_SCHEMA = "phase10-execution-receipt-v1" as const;

export type Phase10LaunchClass =
  | "static-contract"
  | "deciding-extraction"
  | "non-solver"
  | "solver-control"
  | "closure";

export type Phase10ConditionalBranch = "independent-reference" | "reference-refusal";
export type Phase10CallableRole =
  | "producer"
  | "check-caller"
  | "independent-evaluator"
  | "negative-control";
export type Phase10CallableResolution = "planned" | "resolved";
export type Phase10TerminalState = "complete" | "pass" | "fail" | "refusal";
export type Phase10OutputTerminalState = Phase10TerminalState;

export interface Phase10PacketDefinition {
  readonly packetId: string;
  readonly launchClass: Phase10LaunchClass;
  readonly baseOutputIds: readonly string[];
  readonly baseCheckIds: readonly string[];
  readonly dependencyPacketIds: readonly string[];
}

export interface Phase10ArtifactTarget {
  readonly path: string;
  readonly field: string | null;
  readonly schemaId: string;
}

export interface Phase10OutputDefinition {
  readonly outputId: string;
  readonly packetId: string;
  readonly producerCallableId: string;
  readonly artifact: Phase10ArtifactTarget;
  readonly terminalStates: readonly Phase10OutputTerminalState[];
  readonly dependsOnOutputIds: readonly string[];
}

export interface Phase10CheckDefinition {
  readonly checkId: string;
  readonly packetId: string;
  readonly callerCallableId: string;
  readonly independentEvaluatorCallableId: string | null;
  readonly negativeControlIds: readonly string[];
  readonly dependsOnOutputIds: readonly string[];
  readonly dependsOnCheckIds: readonly string[];
}

export interface Phase10NegativeControlDefinition {
  readonly negativeControlId: string;
  readonly packetId: string;
  readonly ownerCheckId: string;
  readonly callableId: string;
}

export interface Phase10ConditionalBranchDefinition {
  readonly outputIds: readonly string[];
  readonly checkIds: readonly string[];
}

export interface Phase10ConditionalGroupDefinition {
  readonly groupId: string;
  readonly packetId: string;
  readonly independentReference: Phase10ConditionalBranchDefinition;
  readonly referenceRefusal: Phase10ConditionalBranchDefinition;
}

export interface Phase10ObligationMatrix {
  readonly schema: typeof PHASE10_OBLIGATION_MATRIX_SCHEMA;
  readonly matrixId: string;
  readonly packets: readonly Phase10PacketDefinition[];
  readonly outputs: readonly Phase10OutputDefinition[];
  readonly checks: readonly Phase10CheckDefinition[];
  readonly negativeControls: readonly Phase10NegativeControlDefinition[];
  readonly conditionalGroups: readonly Phase10ConditionalGroupDefinition[];
}

export interface Phase10ConditionalSelection {
  readonly groupId: string;
  readonly branch: Phase10ConditionalBranch;
}

export interface Phase10ArtifactByteIdentity {
  readonly path: string;
  readonly byteLength: number;
  readonly sha256: string;
}

export interface Phase10PacketProtocol {
  readonly schema: typeof PHASE10_PACKET_PROTOCOL_SCHEMA;
  readonly protocolId: string;
  readonly matrixId: string;
  readonly packetId: string;
  readonly artifactSchemaRegistry: Phase10ArtifactByteIdentity;
  readonly selectedBranches: readonly Phase10ConditionalSelection[];
  readonly registeredOutputIds: readonly string[];
  readonly registeredCheckIds: readonly string[];
  readonly registeredNegativeControlIds: readonly string[];
  readonly boundDependencyPacketIds: readonly string[];
}

export interface Phase10CallableIdentity {
  readonly byteLength: number;
  readonly sha256: string;
}

export interface Phase10CallableBinding {
  readonly callableId: string;
  readonly role: Phase10CallableRole;
  readonly resolution: Phase10CallableResolution;
  readonly modulePath: string;
  readonly exportName: string;
  readonly identity: Phase10CallableIdentity | null;
  readonly producedOutputIds: readonly string[];
  readonly invokedCheckIds: readonly string[];
  readonly evaluatedCheckIds: readonly string[];
  readonly executedNegativeControlIds: readonly string[];
}

export interface Phase10CallableRegistry {
  readonly schema: typeof PHASE10_CALLABLE_REGISTRY_SCHEMA;
  readonly registryId: string;
  readonly matrixId: string;
  readonly protocolId: string;
  readonly packetId: string;
  readonly callables: readonly Phase10CallableBinding[];
}

export interface Phase10ExecutionReceipt {
  readonly schema: typeof PHASE10_EXECUTION_RECEIPT_SCHEMA;
  readonly receiptId: string;
  readonly matrixId: string;
  readonly protocolId: string;
  readonly registryId: string;
  readonly packetId: string;
  readonly terminalState: Phase10TerminalState;
  readonly producedOutputIds: readonly string[];
  readonly executedCheckIds: readonly string[];
  readonly evaluatedCheckIds: readonly string[];
  readonly executedNegativeControlIds: readonly string[];
  readonly boundDependencyPacketIds: readonly string[];
}

type JsonObject = { readonly [key: string]: StrictJson };

const ID = /^[a-z][a-z0-9]*(?:[.-][a-z0-9]+)*$/u;
const EXPORT_NAME = /^[A-Za-z_$][A-Za-z0-9_$]*$/u;
const SHA256 = /^[0-9a-f]{64}$/u;
const SAFE_PATH = /^[A-Za-z0-9][A-Za-z0-9._/-]*$/u;

function invalid(label: string, detail: string): never {
  throw new Error(`${label} ${detail}`);
}

function object(value: StrictJson, label: string): JsonObject {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    invalid(label, "must be an object");
  }
  return value as JsonObject;
}

function exactKeys(value: JsonObject, expected: readonly string[], label: string): void {
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  if (
    actual.length !== wanted.length ||
    actual.some((key, index) => key !== wanted[index])
  ) {
    invalid(label, `keys differ: got [${actual.join(", ")}], expected [${wanted.join(", ")}]`);
  }
}

function array(value: StrictJson, label: string): readonly StrictJson[] {
  if (!Array.isArray(value)) invalid(label, "must be an array");
  return value;
}

function string(value: StrictJson, label: string): string {
  if (typeof value !== "string" || value.length === 0 || value !== value.trim()) {
    invalid(label, "must be a nonempty string without surrounding whitespace");
  }
  return value;
}

function id(value: StrictJson, label: string): string {
  const result = string(value, label);
  if (!ID.test(result)) invalid(label, "must be a lowercase dotted or dashed identifier");
  return result;
}

function literal<T extends string>(
  value: StrictJson,
  allowed: readonly T[],
  label: string,
): T {
  const result = string(value, label);
  if (!(allowed as readonly string[]).includes(result)) {
    invalid(label, `must be one of ${allowed.join(", ")}`);
  }
  return result as T;
}

function nullableId(value: StrictJson, label: string): string | null {
  return value === null ? null : id(value, label);
}

function idArray(value: StrictJson, label: string): readonly string[] {
  return Object.freeze(array(value, label).map((entry, index) => id(entry, `${label}[${index}]`)));
}

function safePath(value: StrictJson, label: string): string {
  const result = string(value, label);
  if (
    !SAFE_PATH.test(result) ||
    result.includes("\\") ||
    result.startsWith("/") ||
    result.endsWith("/") ||
    result.split("/").some((part) => part === "" || part === "." || part === "..")
  ) {
    invalid(label, "must be a safe repository-relative path");
  }
  return result;
}

function nullableField(value: StrictJson, label: string): string | null {
  if (value === null) return null;
  const result = string(value, label);
  if (!result.startsWith("/") || result.includes("//")) {
    invalid(label, "must be null or an RFC6901-style absolute JSON pointer");
  }
  return result;
}

function positiveInteger(value: StrictJson, label: string): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value <= 0) {
    invalid(label, "must be a positive safe integer");
  }
  return value;
}

function root(value: unknown, label: string): JsonObject {
  let snapshot: StrictJson;
  try {
    snapshot = strictJsonSnapshot(value);
  } catch (error) {
    invalid(label, error instanceof Error ? error.message : String(error));
  }
  return object(snapshot, label);
}

function packet(value: StrictJson, index: number): Phase10PacketDefinition {
  const label = `obligation matrix packets[${index}]`;
  const row = object(value, label);
  exactKeys(
    row,
    ["packetId", "launchClass", "baseOutputIds", "baseCheckIds", "dependencyPacketIds"],
    label,
  );
  return Object.freeze({
    packetId: id(row.packetId, `${label}.packetId`),
    launchClass: literal(
      row.launchClass,
      ["static-contract", "deciding-extraction", "non-solver", "solver-control", "closure"],
      `${label}.launchClass`,
    ),
    baseOutputIds: idArray(row.baseOutputIds, `${label}.baseOutputIds`),
    baseCheckIds: idArray(row.baseCheckIds, `${label}.baseCheckIds`),
    dependencyPacketIds: idArray(row.dependencyPacketIds, `${label}.dependencyPacketIds`),
  });
}

function artifact(value: StrictJson, label: string): Phase10ArtifactTarget {
  const row = object(value, label);
  exactKeys(row, ["path", "field", "schemaId"], label);
  return Object.freeze({
    path: safePath(row.path, `${label}.path`),
    field: nullableField(row.field, `${label}.field`),
    schemaId: id(row.schemaId, `${label}.schemaId`),
  });
}

function output(value: StrictJson, index: number): Phase10OutputDefinition {
  const label = `obligation matrix outputs[${index}]`;
  const row = object(value, label);
  exactKeys(
    row,
    [
      "outputId",
      "packetId",
      "producerCallableId",
      "artifact",
      "terminalStates",
      "dependsOnOutputIds",
    ],
    label,
  );
  return Object.freeze({
    outputId: id(row.outputId, `${label}.outputId`),
    packetId: id(row.packetId, `${label}.packetId`),
    producerCallableId: id(row.producerCallableId, `${label}.producerCallableId`),
    artifact: artifact(row.artifact, `${label}.artifact`),
    terminalStates: Object.freeze(
      array(row.terminalStates, `${label}.terminalStates`).map((entry, terminalIndex) =>
        literal<Phase10OutputTerminalState>(
          entry,
          ["complete", "fail", "pass", "refusal"],
          `${label}.terminalStates[${terminalIndex}]`,
        )),
    ),
    dependsOnOutputIds: idArray(row.dependsOnOutputIds, `${label}.dependsOnOutputIds`),
  });
}

function check(value: StrictJson, index: number): Phase10CheckDefinition {
  const label = `obligation matrix checks[${index}]`;
  const row = object(value, label);
  exactKeys(
    row,
    [
      "checkId",
      "packetId",
      "callerCallableId",
      "independentEvaluatorCallableId",
      "negativeControlIds",
      "dependsOnOutputIds",
      "dependsOnCheckIds",
    ],
    label,
  );
  return Object.freeze({
    checkId: id(row.checkId, `${label}.checkId`),
    packetId: id(row.packetId, `${label}.packetId`),
    callerCallableId: id(row.callerCallableId, `${label}.callerCallableId`),
    independentEvaluatorCallableId: nullableId(
      row.independentEvaluatorCallableId,
      `${label}.independentEvaluatorCallableId`,
    ),
    negativeControlIds: idArray(row.negativeControlIds, `${label}.negativeControlIds`),
    dependsOnOutputIds: idArray(row.dependsOnOutputIds, `${label}.dependsOnOutputIds`),
    dependsOnCheckIds: idArray(row.dependsOnCheckIds, `${label}.dependsOnCheckIds`),
  });
}

function negativeControl(value: StrictJson, index: number): Phase10NegativeControlDefinition {
  const label = `obligation matrix negativeControls[${index}]`;
  const row = object(value, label);
  exactKeys(row, ["negativeControlId", "packetId", "ownerCheckId", "callableId"], label);
  return Object.freeze({
    negativeControlId: id(row.negativeControlId, `${label}.negativeControlId`),
    packetId: id(row.packetId, `${label}.packetId`),
    ownerCheckId: id(row.ownerCheckId, `${label}.ownerCheckId`),
    callableId: id(row.callableId, `${label}.callableId`),
  });
}

function conditionalBranch(value: StrictJson, label: string): Phase10ConditionalBranchDefinition {
  const row = object(value, label);
  exactKeys(row, ["outputIds", "checkIds"], label);
  return Object.freeze({
    outputIds: idArray(row.outputIds, `${label}.outputIds`),
    checkIds: idArray(row.checkIds, `${label}.checkIds`),
  });
}

function conditionalGroup(value: StrictJson, index: number): Phase10ConditionalGroupDefinition {
  const label = `obligation matrix conditionalGroups[${index}]`;
  const row = object(value, label);
  exactKeys(
    row,
    ["groupId", "packetId", "independentReference", "referenceRefusal"],
    label,
  );
  return Object.freeze({
    groupId: id(row.groupId, `${label}.groupId`),
    packetId: id(row.packetId, `${label}.packetId`),
    independentReference: conditionalBranch(
      row.independentReference,
      `${label}.independentReference`,
    ),
    referenceRefusal: conditionalBranch(row.referenceRefusal, `${label}.referenceRefusal`),
  });
}

export function parsePhase10ObligationMatrix(value: unknown): Phase10ObligationMatrix {
  const label = "Phase 10 obligation matrix";
  const row = root(value, label);
  exactKeys(
    row,
    ["schema", "matrixId", "packets", "outputs", "checks", "negativeControls", "conditionalGroups"],
    label,
  );
  const schema = literal(row.schema, [PHASE10_OBLIGATION_MATRIX_SCHEMA], `${label}.schema`);
  return Object.freeze({
    schema,
    matrixId: id(row.matrixId, `${label}.matrixId`),
    packets: Object.freeze(array(row.packets, `${label}.packets`).map(packet)),
    outputs: Object.freeze(array(row.outputs, `${label}.outputs`).map(output)),
    checks: Object.freeze(array(row.checks, `${label}.checks`).map(check)),
    negativeControls: Object.freeze(
      array(row.negativeControls, `${label}.negativeControls`).map(negativeControl),
    ),
    conditionalGroups: Object.freeze(
      array(row.conditionalGroups, `${label}.conditionalGroups`).map(conditionalGroup),
    ),
  });
}

function conditionalSelection(value: StrictJson, index: number): Phase10ConditionalSelection {
  const label = `Phase 10 packet protocol selectedBranches[${index}]`;
  const row = object(value, label);
  exactKeys(row, ["groupId", "branch"], label);
  return Object.freeze({
    groupId: id(row.groupId, `${label}.groupId`),
    branch: literal(
      row.branch,
      ["independent-reference", "reference-refusal"],
      `${label}.branch`,
    ),
  });
}

function artifactByteIdentity(value: StrictJson, label: string): Phase10ArtifactByteIdentity {
  const row = object(value, label);
  exactKeys(row, ["path", "byteLength", "sha256"], label);
  const sha256 = string(row.sha256, `${label}.sha256`);
  if (!SHA256.test(sha256)) invalid(`${label}.sha256`, "must be a lowercase SHA-256 digest");
  return Object.freeze({
    path: safePath(row.path, `${label}.path`),
    byteLength: positiveInteger(row.byteLength, `${label}.byteLength`),
    sha256,
  });
}

export function parsePhase10PacketProtocol(value: unknown): Phase10PacketProtocol {
  const label = "Phase 10 packet protocol";
  const row = root(value, label);
  exactKeys(
    row,
    [
      "schema",
      "protocolId",
      "matrixId",
      "packetId",
      "artifactSchemaRegistry",
      "selectedBranches",
      "registeredOutputIds",
      "registeredCheckIds",
      "registeredNegativeControlIds",
      "boundDependencyPacketIds",
    ],
    label,
  );
  const schema = literal(row.schema, [PHASE10_PACKET_PROTOCOL_SCHEMA], `${label}.schema`);
  return Object.freeze({
    schema,
    protocolId: id(row.protocolId, `${label}.protocolId`),
    matrixId: id(row.matrixId, `${label}.matrixId`),
    packetId: id(row.packetId, `${label}.packetId`),
    artifactSchemaRegistry: artifactByteIdentity(
      row.artifactSchemaRegistry,
      `${label}.artifactSchemaRegistry`,
    ),
    selectedBranches: Object.freeze(
      array(row.selectedBranches, `${label}.selectedBranches`).map(conditionalSelection),
    ),
    registeredOutputIds: idArray(row.registeredOutputIds, `${label}.registeredOutputIds`),
    registeredCheckIds: idArray(row.registeredCheckIds, `${label}.registeredCheckIds`),
    registeredNegativeControlIds: idArray(
      row.registeredNegativeControlIds,
      `${label}.registeredNegativeControlIds`,
    ),
    boundDependencyPacketIds: idArray(
      row.boundDependencyPacketIds,
      `${label}.boundDependencyPacketIds`,
    ),
  });
}

function callableIdentity(value: StrictJson, label: string): Phase10CallableIdentity {
  const row = object(value, label);
  exactKeys(row, ["byteLength", "sha256"], label);
  const sha256 = string(row.sha256, `${label}.sha256`);
  if (!SHA256.test(sha256)) invalid(`${label}.sha256`, "must be a lowercase SHA-256 digest");
  return Object.freeze({
    byteLength: positiveInteger(row.byteLength, `${label}.byteLength`),
    sha256,
  });
}

function callable(value: StrictJson, index: number): Phase10CallableBinding {
  const label = `Phase 10 callable registry callables[${index}]`;
  const row = object(value, label);
  exactKeys(
    row,
    [
      "callableId",
      "role",
      "resolution",
      "modulePath",
      "exportName",
      "identity",
      "producedOutputIds",
      "invokedCheckIds",
      "evaluatedCheckIds",
      "executedNegativeControlIds",
    ],
    label,
  );
  const resolution = literal(
    row.resolution,
    ["planned", "resolved"],
    `${label}.resolution`,
  );
  const modulePath = safePath(row.modulePath, `${label}.modulePath`);
  if (!modulePath.startsWith("runner/src/") || !modulePath.endsWith(".ts")) {
    invalid(`${label}.modulePath`, "must name a TypeScript module below runner/src");
  }
  const exportName = string(row.exportName, `${label}.exportName`);
  if (!EXPORT_NAME.test(exportName)) invalid(`${label}.exportName`, "must be a JavaScript identifier");
  if (exportName === "default") {
    invalid(`${label}.exportName`, "must name a direct non-default export");
  }
  const identity = row.identity === null ? null : callableIdentity(row.identity, `${label}.identity`);
  if (resolution === "planned" && identity !== null) {
    invalid(label, "a planned callable must have null identity");
  }
  if (resolution === "resolved" && identity === null) {
    invalid(label, "a resolved callable must carry a byte identity");
  }
  return Object.freeze({
    callableId: id(row.callableId, `${label}.callableId`),
    role: literal(
      row.role,
      ["producer", "check-caller", "independent-evaluator", "negative-control"],
      `${label}.role`,
    ),
    resolution,
    modulePath,
    exportName,
    identity,
    producedOutputIds: idArray(row.producedOutputIds, `${label}.producedOutputIds`),
    invokedCheckIds: idArray(row.invokedCheckIds, `${label}.invokedCheckIds`),
    evaluatedCheckIds: idArray(row.evaluatedCheckIds, `${label}.evaluatedCheckIds`),
    executedNegativeControlIds: idArray(
      row.executedNegativeControlIds,
      `${label}.executedNegativeControlIds`,
    ),
  });
}

export function parsePhase10CallableRegistry(value: unknown): Phase10CallableRegistry {
  const label = "Phase 10 callable registry";
  const row = root(value, label);
  exactKeys(
    row,
    ["schema", "registryId", "matrixId", "protocolId", "packetId", "callables"],
    label,
  );
  const schema = literal(row.schema, [PHASE10_CALLABLE_REGISTRY_SCHEMA], `${label}.schema`);
  return Object.freeze({
    schema,
    registryId: id(row.registryId, `${label}.registryId`),
    matrixId: id(row.matrixId, `${label}.matrixId`),
    protocolId: id(row.protocolId, `${label}.protocolId`),
    packetId: id(row.packetId, `${label}.packetId`),
    callables: Object.freeze(array(row.callables, `${label}.callables`).map(callable)),
  });
}

export function parsePhase10ExecutionReceipt(value: unknown): Phase10ExecutionReceipt {
  const label = "Phase 10 execution receipt";
  const row = root(value, label);
  exactKeys(
    row,
    [
      "schema",
      "receiptId",
      "matrixId",
      "protocolId",
      "registryId",
      "packetId",
      "terminalState",
      "producedOutputIds",
      "executedCheckIds",
      "evaluatedCheckIds",
      "executedNegativeControlIds",
      "boundDependencyPacketIds",
    ],
    label,
  );
  const schema = literal(row.schema, [PHASE10_EXECUTION_RECEIPT_SCHEMA], `${label}.schema`);
  return Object.freeze({
    schema,
    receiptId: id(row.receiptId, `${label}.receiptId`),
    matrixId: id(row.matrixId, `${label}.matrixId`),
    protocolId: id(row.protocolId, `${label}.protocolId`),
    registryId: id(row.registryId, `${label}.registryId`),
    packetId: id(row.packetId, `${label}.packetId`),
    terminalState: literal(
      row.terminalState,
      ["complete", "pass", "fail", "refusal"],
      `${label}.terminalState`,
    ),
    producedOutputIds: idArray(row.producedOutputIds, `${label}.producedOutputIds`),
    executedCheckIds: idArray(row.executedCheckIds, `${label}.executedCheckIds`),
    evaluatedCheckIds: idArray(row.evaluatedCheckIds, `${label}.evaluatedCheckIds`),
    executedNegativeControlIds: idArray(
      row.executedNegativeControlIds,
      `${label}.executedNegativeControlIds`,
    ),
    boundDependencyPacketIds: idArray(
      row.boundDependencyPacketIds,
      `${label}.boundDependencyPacketIds`,
    ),
  });
}
