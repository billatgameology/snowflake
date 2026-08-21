import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { isAbsolute, relative, resolve } from "node:path";
import ts from "typescript";
import {
  parsePhase10CallableRegistry,
  parsePhase10ExecutionReceipt,
  parsePhase10ObligationMatrix,
  parsePhase10PacketProtocol,
  type Phase10ArtifactByteIdentity,
  type Phase10CallableBinding,
  type Phase10CallableRegistry,
  type Phase10CheckDefinition,
  type Phase10ConditionalBranch,
  type Phase10ConditionalGroupDefinition,
  type Phase10ExecutionReceipt,
  type Phase10NegativeControlDefinition,
  type Phase10ObligationMatrix,
  type Phase10OutputDefinition,
  type Phase10OutputTerminalState,
  type Phase10PacketDefinition,
  type Phase10PacketProtocol,
} from "./phase10-contracts.ts";

const RECEIPT_TERMINAL_STATES = new Set<Phase10OutputTerminalState>([
  "complete",
  "fail",
  "pass",
  "refusal",
]);

type PreflightStage = "freeze" | "run" | "receipt";

interface PreparedPacket {
  readonly matrix: Phase10ObligationMatrix;
  readonly protocol: Phase10PacketProtocol;
  readonly registry: Phase10CallableRegistry;
  readonly packet: Phase10PacketDefinition;
  readonly outputs: readonly Phase10OutputDefinition[];
  readonly checks: readonly Phase10CheckDefinition[];
  readonly negativeControls: readonly Phase10NegativeControlDefinition[];
  readonly selectedBranches: Readonly<Record<string, Phase10ConditionalBranch>>;
}

interface Phase10SchemaAvailabilityRow {
  readonly schemaId: string;
  readonly state: "defined" | "reserved";
  readonly requiredBeforePacketIds: readonly string[];
}

interface Phase10ExternalSchemaDefinition {
  readonly schemaId: string;
  readonly owner: string;
  readonly state: "defined";
  readonly contractPath: string;
  readonly contractPointer: string;
  readonly byteLength: number;
  readonly sha256: string;
}

interface Phase10SchemaAvailabilityView {
  readonly rows: ReadonlyMap<string, Phase10SchemaAvailabilityRow>;
  readonly externalDefinitions: ReadonlyMap<string, Phase10ExternalSchemaDefinition>;
}

export interface Phase10ObligationPreflightPass {
  readonly pass: true;
  readonly stage: PreflightStage;
  readonly matrixId: string;
  readonly protocolId: string;
  readonly registryId: string;
  readonly packetId: string;
  readonly outputIds: readonly string[];
  readonly checkIds: readonly string[];
  readonly negativeControlIds: readonly string[];
  readonly callableIds: readonly string[];
  readonly unresolvedCallableIds: readonly string[];
  readonly selectedBranches: Readonly<Record<string, Phase10ConditionalBranch>>;
  readonly receiptId: string | null;
  readonly terminalState: Phase10ExecutionReceipt["terminalState"] | null;
}

export interface Phase10ObligationMatrixValidationPass {
  readonly pass: true;
  readonly matrixId: string;
  readonly packetCount: number;
  readonly outputCount: number;
  readonly checkCount: number;
  readonly negativeControlCount: number;
  readonly conditionalGroupCount: number;
}

function lexical(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function sorted(values: Iterable<string>): readonly string[] {
  return [...values].sort(lexical);
}

function refuse(message: string): never {
  throw new Error(`Phase 10 A-P refused: ${message}`);
}

function parseOrRefuse<T>(label: string, parse: () => T): T {
  try {
    return parse();
  } catch (error) {
    refuse(`${label} is invalid: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function availabilityObject(value: unknown, label: string): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    refuse(`${label} must be an object`);
  }
  return value as Record<string, unknown>;
}

function availabilityString(value: unknown, label: string): string {
  if (typeof value !== "string" || value.length === 0 || value !== value.trim()) {
    refuse(`${label} must be a nonempty string without surrounding whitespace`);
  }
  return value;
}

function exactAvailabilityKeys(
  value: Record<string, unknown>,
  keys: readonly string[],
  label: string,
): void {
  const actual = Object.keys(value).sort(lexical);
  const expected = [...keys].sort(lexical);
  if (actual.length !== expected.length || actual.some((key, index) => key !== expected[index])) {
    refuse(`${label} keys differ from [${expected.join(", ")}]`);
  }
}

function availabilityStringArray(value: unknown, label: string): readonly string[] {
  if (!Array.isArray(value)) refuse(`${label} must be an array`);
  const result = value.map((entry, index) => availabilityString(entry, `${label}[${index}]`));
  if (new Set(result).size !== result.length) refuse(`${label} must not repeat values`);
  return result;
}

function parseSchemaAvailability(value: unknown): Phase10SchemaAvailabilityView {
  const root = availabilityObject(value, "artifact schema registry");
  exactAvailabilityKeys(
    root,
    [
      "schema",
      "createdOn",
      "foundationFreeze",
      "conformance",
      "enums",
      "definitions",
      "artifactSchemas",
      "schemaAliases",
      "externalSchemaDefinitions",
      "externalSchemaReservations",
      "schemaAvailability",
      "refusalSemantics",
    ],
    "artifact schema registry",
  );
  if (root.schema !== "phase10-artifact-schema-registry-v1") {
    refuse("artifact schema registry has the wrong schema discriminator");
  }
  for (const arrayName of [
    "artifactSchemas",
    "schemaAliases",
    "externalSchemaDefinitions",
    "externalSchemaReservations",
    "schemaAvailability",
  ] as const) {
    if (!Array.isArray(root[arrayName])) {
      refuse(`artifact schema registry ${arrayName} must be an array`);
    }
  }
  const artifactSchemas = root.artifactSchemas as readonly unknown[];
  const schemaAliases = root.schemaAliases as readonly unknown[];
  const externalSchemaDefinitions = root.externalSchemaDefinitions as readonly unknown[];
  const externalSchemaReservations = root.externalSchemaReservations as readonly unknown[];
  const schemaAvailability = root.schemaAvailability as readonly unknown[];

  const concreteStates = new Map<
    string,
    { readonly state: "defined" | "reserved"; readonly requiredBeforePacketIds: readonly string[] }
  >();
  const addConcrete = (
    schemaId: string,
    state: "defined" | "reserved",
    requiredBeforePacketIds: readonly string[],
    label: string,
  ): void => {
    if (concreteStates.has(schemaId)) {
      refuse(`${schemaId} has more than one concrete schema definition or reservation`);
    }
    concreteStates.set(schemaId, { state, requiredBeforePacketIds });
    if (!/^[a-z][a-z0-9]*(?:[.-][a-z0-9]+)*$/u.test(schemaId)) {
      refuse(`${label}.schemaId is not a lowercase dotted or dashed identifier`);
    }
  };

  for (const [index, entry] of artifactSchemas.entries()) {
    const label = `artifactSchemas[${index}]`;
    const row = availabilityObject(entry, label);
    const keys = Object.hasOwn(row, "requiredSections")
      ? ["schemaId", "format", "exactFields", "fieldContracts", "requiredSections", "invariants"]
      : ["schemaId", "format", "exactFields", "fieldContracts", "invariants"];
    exactAvailabilityKeys(row, keys, label);
    const schemaId = availabilityString(row.schemaId, `${label}.schemaId`);
    const format = availabilityString(row.format, `${label}.format`);
    if (!["json", "jsonl-row", "markdown-utf8"].includes(format)) {
      refuse(`${schemaId} has an unsupported artifact schema format`);
    }
    const exactFields = availabilityStringArray(row.exactFields, `${label}.exactFields`);
    const fieldContracts = availabilityObject(row.fieldContracts, `${label}.fieldContracts`);
    const fieldContractKeys = Object.keys(fieldContracts);
    if (
      fieldContractKeys.length !== exactFields.length ||
      [...fieldContractKeys].sort(lexical).some(
        (field, fieldIndex) => field !== [...exactFields].sort(lexical)[fieldIndex],
      )
    ) {
      refuse(`${schemaId} fieldContracts do not exactly cover exactFields`);
    }
    for (const [field, contract] of Object.entries(fieldContracts)) {
      availabilityString(contract, `${label}.fieldContracts.${field}`);
    }
    const invariants = availabilityStringArray(row.invariants, `${label}.invariants`);
    const requiredSections = Object.hasOwn(row, "requiredSections")
      ? availabilityStringArray(row.requiredSections, `${label}.requiredSections`)
      : [];
    if (invariants.length === 0 || (exactFields.length === 0 && requiredSections.length === 0)) {
      refuse(`${schemaId} is a label without a substantive local contract`);
    }
    addConcrete(schemaId, "defined", [], label);
  }
  const aliasTargets = new Map<string, string>();
  for (const [index, entry] of schemaAliases.entries()) {
    const label = `schemaAliases[${index}]`;
    const row = availabilityObject(entry, label);
    exactAvailabilityKeys(row, ["schemaId", "contractSchemaId", "fixedBranchId"], label);
    const schemaId = availabilityString(row.schemaId, `${label}.schemaId`);
    const contractSchemaId = availabilityString(row.contractSchemaId, `${label}.contractSchemaId`);
    availabilityString(row.fixedBranchId, `${label}.fixedBranchId`);
    addConcrete(schemaId, "defined", [], label);
    aliasTargets.set(schemaId, contractSchemaId);
  }
  const externalDefinitions = new Map<string, Phase10ExternalSchemaDefinition>();
  for (const [index, entry] of externalSchemaDefinitions.entries()) {
    const label = `externalSchemaDefinitions[${index}]`;
    const row = availabilityObject(entry, label);
    exactAvailabilityKeys(
      row,
      [
        "schemaId",
        "owner",
        "state",
        "contractPath",
        "contractPointer",
        "byteLength",
        "sha256",
      ],
      label,
    );
    const schemaId = availabilityString(row.schemaId, `${label}.schemaId`);
    if (row.state !== "defined") refuse(`${schemaId} external definition is not defined`);
    const contractPath = availabilityString(row.contractPath, `${label}.contractPath`);
    if (
      !/^[A-Za-z0-9][A-Za-z0-9._/-]*$/u.test(contractPath) ||
      contractPath.startsWith("/") ||
      contractPath.includes("\\") ||
      contractPath.split("/").some((part) => part === "" || part === "." || part === "..")
    ) {
      refuse(`${schemaId} external contract path is unsafe`);
    }
    const contractPointer = availabilityString(row.contractPointer, `${label}.contractPointer`);
    if (!contractPointer.startsWith("/") || contractPointer.includes("//")) {
      refuse(`${schemaId} external contract pointer is not RFC6901-style`);
    }
    if (
      typeof row.byteLength !== "number" ||
      !Number.isSafeInteger(row.byteLength) ||
      row.byteLength <= 0
    ) {
      refuse(`${schemaId} external contract byteLength must be a positive safe integer`);
    }
    const sha256 = availabilityString(row.sha256, `${label}.sha256`);
    if (!/^[0-9a-f]{64}$/u.test(sha256)) refuse(`${schemaId} external contract SHA-256 is invalid`);
    addConcrete(schemaId, "defined", [], label);
    externalDefinitions.set(schemaId, {
      schemaId,
      owner: availabilityString(row.owner, `${label}.owner`),
      state: "defined",
      contractPath,
      contractPointer,
      byteLength: row.byteLength,
      sha256,
    });
  }
  for (const [index, entry] of externalSchemaReservations.entries()) {
    const label = `externalSchemaReservations[${index}]`;
    const row = availabilityObject(entry, label);
    exactAvailabilityKeys(row, ["schemaId", "owner", "state", "requiredBeforePacketIds"], label);
    const schemaId = availabilityString(row.schemaId, `${label}.schemaId`);
    availabilityString(row.owner, `${label}.owner`);
    if (row.state !== "reserved") refuse(`${schemaId} external reservation is not reserved`);
    const requiredBeforePacketIds = availabilityStringArray(
      row.requiredBeforePacketIds,
      `${label}.requiredBeforePacketIds`,
    );
    requireSortedUnique(requiredBeforePacketIds, `${label}.requiredBeforePacketIds`);
    if (requiredBeforePacketIds.length === 0) {
      refuse(`${schemaId} reservation lacks a required promotion packet roster`);
    }
    addConcrete(schemaId, "reserved", requiredBeforePacketIds, label);
  }
  for (const [aliasId, targetId] of aliasTargets) {
    if (concreteStates.get(targetId)?.state !== "defined" || aliasTargets.has(targetId)) {
      refuse(`schema alias ${aliasId} does not target a concrete defined schema`);
    }
  }

  const rows = new Map<string, Phase10SchemaAvailabilityRow>();
  for (const [index, entry] of schemaAvailability.entries()) {
    const label = `schemaAvailability[${index}]`;
    const row = availabilityObject(entry, label);
    exactAvailabilityKeys(row, ["schemaId", "state", "requiredBeforePacketIds"], label);
    const schemaId = availabilityString(row.schemaId, `${label}.schemaId`);
    if (rows.has(schemaId)) refuse(`schemaAvailability repeats ${schemaId}`);
    if (row.state !== "defined" && row.state !== "reserved") {
      refuse(`${label}.state must be defined or reserved`);
    }
    const requiredBeforePacketIds = availabilityStringArray(
      row.requiredBeforePacketIds,
      `${label}.requiredBeforePacketIds`,
    );
    requireSortedUnique(requiredBeforePacketIds, `${label}.requiredBeforePacketIds`);
    rows.set(schemaId, { schemaId, state: row.state, requiredBeforePacketIds });
  }
  requireSortedUnique([...rows.keys()], "schemaAvailability schema IDs");
  requireExactSet([...rows.keys()], [...concreteStates.keys()], "schemaAvailability concrete IDs");
  for (const [schemaId, concrete] of concreteStates) {
    const projected = rows.get(schemaId) as Phase10SchemaAvailabilityRow;
    if (projected.state !== concrete.state) {
      refuse(`${schemaId} schemaAvailability state differs from its concrete contract`);
    }
    requireExactSet(
      projected.requiredBeforePacketIds,
      concrete.requiredBeforePacketIds,
      `${schemaId} schemaAvailability promotion roster`,
    );
  }
  return { rows, externalDefinitions };
}

function resolveJsonPointer(value: unknown, pointer: string, schemaId: string): unknown {
  let current = value;
  for (const encodedPart of pointer.slice(1).split("/")) {
    const part = encodedPart.replaceAll("~1", "/").replaceAll("~0", "~");
    if (current === null || typeof current !== "object" || Array.isArray(current)) {
      refuse(`${schemaId} external contract pointer crosses a non-object at ${encodedPart}`);
    }
    const record = current as Record<string, unknown>;
    if (!Object.hasOwn(record, part)) {
      refuse(`${schemaId} external contract pointer misses ${encodedPart}`);
    }
    current = record[part];
  }
  return current;
}

function readBoundArtifactSchemaRegistry(
  identity: Phase10ArtifactByteIdentity,
  repositoryRoot: string,
): unknown {
  const absoluteRoot = resolve(repositoryRoot);
  const absolutePath = resolve(absoluteRoot, identity.path);
  const relativePath = relative(absoluteRoot, absolutePath);
  if (
    relativePath.length === 0 ||
    relativePath === ".." ||
    relativePath.startsWith(`..${process.platform === "win32" ? "\\" : "/"}`) ||
    isAbsolute(relativePath)
  ) {
    refuse("packet protocol artifact-schema registry path escapes the repository root");
  }
  let bytes: Uint8Array;
  try {
    bytes = new Uint8Array(readFileSync(absolutePath));
  } catch (error) {
    refuse(
      "packet protocol artifact-schema registry cannot be read: " +
        (error instanceof Error ? error.message : String(error)),
    );
  }
  const digest = createHash("sha256").update(bytes).digest("hex");
  if (bytes.byteLength !== identity.byteLength || digest !== identity.sha256) {
    refuse("packet protocol artifact-schema registry byte identity differs");
  }
  try {
    return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)) as unknown;
  } catch (error) {
    refuse(
      "packet protocol artifact-schema registry is not strict UTF-8 JSON: " +
        (error instanceof Error ? error.message : String(error)),
    );
  }
}

function validateActiveArtifactSchemas(
  matrix: Phase10ObligationMatrix,
  packet: Phase10PacketDefinition,
  outputs: readonly Phase10OutputDefinition[],
  artifactSchemaRegistryIdentity: Phase10ArtifactByteIdentity,
  requireDefined: boolean,
  repositoryRoot: string,
): void {
  const availability = parseSchemaAvailability(
    readBoundArtifactSchemaRegistry(artifactSchemaRegistryIdentity, repositoryRoot),
  );
  const packetIds = new Set(matrix.packets.map((matrixPacket) => matrixPacket.packetId));
  for (const row of availability.rows.values()) {
    for (const requiredPacketId of row.requiredBeforePacketIds) {
      if (!packetIds.has(requiredPacketId)) {
        refuse(`${row.schemaId} names unknown promotion packet ${requiredPacketId}`);
      }
    }
  }
  for (const matrixOutput of matrix.outputs) {
    if (!availability.rows.has(matrixOutput.artifact.schemaId)) {
      refuse(`artifact schema registry omits matrix schema ${matrixOutput.artifact.schemaId}`);
    }
  }
  for (const external of availability.externalDefinitions.values()) {
    const schemaId = external.schemaId;
    const absoluteRoot = resolve(repositoryRoot);
    const absolutePath = resolve(absoluteRoot, external.contractPath);
    const relativePath = relative(absoluteRoot, absolutePath);
    if (
      relativePath.length === 0 ||
      relativePath === ".." ||
      relativePath.startsWith(`..${process.platform === "win32" ? "\\" : "/"}`) ||
      isAbsolute(relativePath)
    ) {
      refuse(`${schemaId} external contract path escapes the repository root`);
    }
    let bytes: Uint8Array;
    try {
      bytes = new Uint8Array(readFileSync(absolutePath));
    } catch (error) {
      refuse(
        `${schemaId} external contract cannot be read: ` +
          (error instanceof Error ? error.message : String(error)),
      );
    }
    const digest = createHash("sha256").update(bytes).digest("hex");
    if (bytes.byteLength !== external.byteLength || digest !== external.sha256) {
      refuse(`${schemaId} external contract byte identity differs from the registry`);
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)) as unknown;
    } catch (error) {
      refuse(
        `${schemaId} external contract is not strict UTF-8 JSON: ` +
          (error instanceof Error ? error.message : String(error)),
      );
    }
    const contract = availabilityObject(
      resolveJsonPointer(parsed, external.contractPointer, schemaId),
      `${schemaId} external contract`,
    );
    const contractEnums = contract.enums === undefined
      ? null
      : availabilityObject(contract.enums, `${schemaId} external contract enums`);
    const schemaDiscriminators = contractEnums === null || !Array.isArray(contractEnums.schema)
      ? []
      : contractEnums.schema;
    if (
      contract.schemaId !== schemaId &&
      (schemaDiscriminators.length !== 1 || schemaDiscriminators[0] !== schemaId)
    ) {
      refuse(`${schemaId} external contract endpoint has a different schemaId`);
    }
  }
  for (const output of outputs) {
    const schemaId = output.artifact.schemaId;
    const row = availability.rows.get(schemaId) as Phase10SchemaAvailabilityRow;
    if (row.state === "reserved") {
      if (!row.requiredBeforePacketIds.includes(packet.packetId)) {
        refuse(`${schemaId} is reserved without a promotion rule for packet ${packet.packetId}`);
      }
      if (requireDefined) {
        refuse(`${packet.packetId} run preflight found reserved artifact schema ${schemaId}`);
      }
    }
  }
}

function requireSortedUnique(values: readonly string[], label: string): void {
  for (let index = 0; index < values.length; index++) {
    if (index > 0 && lexical(values[index - 1] as string, values[index] as string) >= 0) {
      refuse(`${label} must be sorted and unique`);
    }
  }
}

function requireDefinitionOrder<T>(
  values: readonly T[],
  idOf: (value: T) => string,
  label: string,
): void {
  requireSortedUnique(values.map(idOf), label);
}

function requireExactSet(
  actual: readonly string[],
  expected: readonly string[],
  label: string,
): void {
  requireSortedUnique(actual, label);
  const wanted = sorted(expected);
  if (
    actual.length !== wanted.length ||
    actual.some((value, index) => value !== wanted[index])
  ) {
    const actualSet = new Set(actual);
    const expectedSet = new Set(wanted);
    const missing = wanted.filter((value) => !actualSet.has(value));
    const unexpected = actual.filter((value) => !expectedSet.has(value));
    refuse(
      `${label} differs` +
        `${missing.length === 0 ? "" : `; missing [${missing.join(", ")}]`}` +
        `${unexpected.length === 0 ? "" : `; unexpected [${unexpected.join(", ")}]`}`,
    );
  }
}

function mapById<T>(
  values: readonly T[],
  idOf: (value: T) => string,
  label: string,
): ReadonlyMap<string, T> {
  requireDefinitionOrder(values, idOf, label);
  return new Map(values.map((value) => [idOf(value), value] as const));
}

function requirePacket<T extends { readonly packetId: string }>(
  value: T,
  packets: ReadonlyMap<string, Phase10PacketDefinition>,
  label: string,
): Phase10PacketDefinition {
  const packet = packets.get(value.packetId);
  if (packet === undefined) refuse(`${label} names unknown packet ${value.packetId}`);
  return packet;
}

function requirePacketLocal(
  ownerPacketId: string,
  dependencyPacketId: string,
  label: string,
): void {
  if (ownerPacketId !== dependencyPacketId) {
    refuse(`${label} crosses packets ${ownerPacketId} -> ${dependencyPacketId}`);
  }
}

function assertAcyclic(
  ids: readonly string[],
  dependencies: (id: string) => readonly string[],
  label: string,
): void {
  const state = new Map<string, "visiting" | "done">();
  const stack: string[] = [];
  const visit = (id: string): void => {
    if (state.get(id) === "done") return;
    if (state.get(id) === "visiting") {
      const start = stack.indexOf(id);
      refuse(`${label} contains a cycle: ${[...stack.slice(start), id].join(" -> ")}`);
    }
    state.set(id, "visiting");
    stack.push(id);
    for (const dependency of dependencies(id)) visit(dependency);
    stack.pop();
    state.set(id, "done");
  };
  for (const id of ids) visit(id);
}

function validateMatrix(matrix: Phase10ObligationMatrix): void {
  if (matrix.packets.length === 0) refuse("obligation matrix has no packets");
  const packets = mapById(matrix.packets, (value) => value.packetId, "matrix packet IDs");
  const outputs = mapById(matrix.outputs, (value) => value.outputId, "matrix output IDs");
  const checks = mapById(matrix.checks, (value) => value.checkId, "matrix check IDs");
  const controls = mapById(
    matrix.negativeControls,
    (value) => value.negativeControlId,
    "matrix negative-control IDs",
  );
  const groups = mapById(
    matrix.conditionalGroups,
    (value) => value.groupId,
    "matrix conditional-group IDs",
  );

  for (const outputId of outputs.keys()) {
    if (checks.has(outputId) || controls.has(outputId) || groups.has(outputId)) {
      refuse(`obligation ID ${outputId} is reused across namespaces`);
    }
  }
  for (const checkId of checks.keys()) {
    if (controls.has(checkId) || groups.has(checkId)) {
      refuse(`obligation ID ${checkId} is reused across namespaces`);
    }
  }
  for (const controlId of controls.keys()) {
    if (groups.has(controlId)) refuse(`obligation ID ${controlId} is reused across namespaces`);
  }

  const callableRoles = new Map<string, Phase10CallableBinding["role"]>();
  const registerCallableRole = (
    callableId: string,
    role: Phase10CallableBinding["role"],
  ): void => {
    const prior = callableRoles.get(callableId);
    if (prior !== undefined && prior !== role) {
      refuse(`callable ${callableId} is assigned conflicting matrix roles ${prior} and ${role}`);
    }
    callableRoles.set(callableId, role);
  };
  for (const output of matrix.outputs) {
    registerCallableRole(output.producerCallableId, "producer");
  }
  for (const check of matrix.checks) {
    registerCallableRole(check.callerCallableId, "check-caller");
    if (check.independentEvaluatorCallableId !== null) {
      registerCallableRole(check.independentEvaluatorCallableId, "independent-evaluator");
    }
  }
  for (const control of matrix.negativeControls) {
    registerCallableRole(control.callableId, "negative-control");
  }

  for (const packet of matrix.packets) {
    requireSortedUnique(packet.baseOutputIds, `${packet.packetId}.baseOutputIds`);
    requireSortedUnique(packet.baseCheckIds, `${packet.packetId}.baseCheckIds`);
    requireSortedUnique(packet.dependencyPacketIds, `${packet.packetId}.dependencyPacketIds`);
    for (const dependencyId of packet.dependencyPacketIds) {
      if (dependencyId === packet.packetId) refuse(`${packet.packetId} depends on itself`);
      if (!packets.has(dependencyId)) {
        refuse(`${packet.packetId} depends on unknown packet ${dependencyId}`);
      }
    }
    for (const outputId of packet.baseOutputIds) {
      const output = outputs.get(outputId);
      if (output === undefined) refuse(`${packet.packetId} names unknown base output ${outputId}`);
      requirePacketLocal(packet.packetId, output.packetId, `${packet.packetId} base output ${outputId}`);
    }
    for (const checkId of packet.baseCheckIds) {
      const check = checks.get(checkId);
      if (check === undefined) refuse(`${packet.packetId} names unknown base check ${checkId}`);
      requirePacketLocal(packet.packetId, check.packetId, `${packet.packetId} base check ${checkId}`);
    }
  }
  assertAcyclic(
    [...packets.keys()],
    (packetId) => (packets.get(packetId) as Phase10PacketDefinition).dependencyPacketIds,
    "packet dependency graph",
  );

  const artifactTargets = new Set<string>();
  for (const output of matrix.outputs) {
    requirePacket(output, packets, `output ${output.outputId}`);
    requireSortedUnique(output.terminalStates, `${output.outputId}.terminalStates`);
    if (output.terminalStates.length === 0) refuse(`${output.outputId} has no terminal state`);
    requireSortedUnique(output.dependsOnOutputIds, `${output.outputId}.dependsOnOutputIds`);
    for (const dependencyId of output.dependsOnOutputIds) {
      const dependency = outputs.get(dependencyId);
      if (dependency === undefined) {
        refuse(`${output.outputId} depends on unknown output ${dependencyId}`);
      }
      requirePacketLocal(output.packetId, dependency.packetId, `${output.outputId} dependency`);
    }
    const target = `${output.artifact.path}#${output.artifact.field ?? ""}`;
    if (artifactTargets.has(target)) refuse(`artifact target ${target} is registered twice`);
    artifactTargets.add(target);
  }

  for (const check of matrix.checks) {
    requirePacket(check, packets, `check ${check.checkId}`);
    requireSortedUnique(check.negativeControlIds, `${check.checkId}.negativeControlIds`);
    requireSortedUnique(check.dependsOnOutputIds, `${check.checkId}.dependsOnOutputIds`);
    requireSortedUnique(check.dependsOnCheckIds, `${check.checkId}.dependsOnCheckIds`);
    for (const outputId of check.dependsOnOutputIds) {
      const dependency = outputs.get(outputId);
      if (dependency === undefined) refuse(`${check.checkId} depends on unknown output ${outputId}`);
      requirePacketLocal(check.packetId, dependency.packetId, `${check.checkId} output dependency`);
    }
    for (const checkId of check.dependsOnCheckIds) {
      const dependency = checks.get(checkId);
      if (dependency === undefined) refuse(`${check.checkId} depends on unknown check ${checkId}`);
      requirePacketLocal(check.packetId, dependency.packetId, `${check.checkId} check dependency`);
    }
  }

  for (const control of matrix.negativeControls) {
    requirePacket(control, packets, `negative control ${control.negativeControlId}`);
    const owner = checks.get(control.ownerCheckId);
    if (owner === undefined) {
      refuse(`${control.negativeControlId} names unknown owner check ${control.ownerCheckId}`);
    }
    requirePacketLocal(control.packetId, owner.packetId, `${control.negativeControlId} owner`);
    if (!owner.negativeControlIds.includes(control.negativeControlId)) {
      refuse(`${control.negativeControlId} is not registered by owner check ${owner.checkId}`);
    }
  }
  for (const check of matrix.checks) {
    const owned = sorted(
      matrix.negativeControls
        .filter((control) => control.ownerCheckId === check.checkId)
        .map((control) => control.negativeControlId),
    );
    requireExactSet(check.negativeControlIds, owned, `${check.checkId} negative-control ownership`);
  }

  const outputAssignments = new Map<string, number>(
    matrix.outputs.map((value) => [value.outputId, 0] as const),
  );
  const checkAssignments = new Map<string, number>(
    matrix.checks.map((value) => [value.checkId, 0] as const),
  );
  const assignOutput = (packetId: string, outputId: string, label: string): void => {
    const value = outputs.get(outputId);
    if (value === undefined) refuse(`${label} names unknown output ${outputId}`);
    requirePacketLocal(packetId, value.packetId, `${label} output ${outputId}`);
    outputAssignments.set(outputId, (outputAssignments.get(outputId) as number) + 1);
  };
  const assignCheck = (packetId: string, checkId: string, label: string): void => {
    const value = checks.get(checkId);
    if (value === undefined) refuse(`${label} names unknown check ${checkId}`);
    requirePacketLocal(packetId, value.packetId, `${label} check ${checkId}`);
    checkAssignments.set(checkId, (checkAssignments.get(checkId) as number) + 1);
  };
  for (const packet of matrix.packets) {
    for (const outputId of packet.baseOutputIds) assignOutput(packet.packetId, outputId, packet.packetId);
    for (const checkId of packet.baseCheckIds) assignCheck(packet.packetId, checkId, packet.packetId);
  }
  for (const group of matrix.conditionalGroups) {
    requirePacket(group, packets, `conditional group ${group.groupId}`);
    for (const [branchName, branch] of [
      ["independent-reference", group.independentReference],
      ["reference-refusal", group.referenceRefusal],
    ] as const) {
      requireSortedUnique(branch.outputIds, `${group.groupId}.${branchName}.outputIds`);
      requireSortedUnique(branch.checkIds, `${group.groupId}.${branchName}.checkIds`);
      if (branch.outputIds.length === 0 || branch.checkIds.length === 0) {
        refuse(`${group.groupId}.${branchName} must register at least one output and one check`);
      }
      for (const outputId of branch.outputIds) {
        assignOutput(group.packetId, outputId, `${group.groupId}.${branchName}`);
      }
      for (const checkId of branch.checkIds) {
        assignCheck(group.packetId, checkId, `${group.groupId}.${branchName}`);
      }
    }
    const independentChecks = group.independentReference.checkIds.map(
      (checkId) => checks.get(checkId) as Phase10CheckDefinition,
    );
    const independentOutputs = new Set(group.independentReference.outputIds);
    if (
      !independentChecks.some(
        (check) =>
          check.independentEvaluatorCallableId !== null &&
          check.negativeControlIds.length > 0 &&
          check.dependsOnOutputIds.some((outputId) => independentOutputs.has(outputId)),
      )
    ) {
      refuse(
        `${group.groupId}.independent-reference lacks a check that binds a branch output, ` +
          "an independent evaluator, and a negative control",
      );
    }
  }
  for (const packet of matrix.packets) {
    const packetGroups = matrix.conditionalGroups.filter(
      (group) => group.packetId === packet.packetId,
    );
    const reachableStatesByOutput = new Map<string, Set<string>>(
      matrix.outputs
        .filter((output) => output.packetId === packet.packetId)
        .map((output) => [output.outputId, new Set<string>()]),
    );
    const requireTerminalIntersection = (
      groupIndex: number,
      selectedOutputIds: readonly string[],
      branchNames: readonly string[],
    ): void => {
      if (groupIndex < packetGroups.length) {
        const group = packetGroups[groupIndex] as Phase10ConditionalGroupDefinition;
        requireTerminalIntersection(
          groupIndex + 1,
          [...selectedOutputIds, ...group.independentReference.outputIds],
          [...branchNames, `${group.groupId}=independent-reference`],
        );
        requireTerminalIntersection(
          groupIndex + 1,
          [...selectedOutputIds, ...group.referenceRefusal.outputIds],
          [...branchNames, `${group.groupId}=reference-refusal`],
        );
        return;
      }
      const activeOutputIds = [...packet.baseOutputIds, ...selectedOutputIds];
      let admitted = new Set(RECEIPT_TERMINAL_STATES);
      for (const outputId of activeOutputIds) {
        const outputStates = new Set(
          (outputs.get(outputId) as Phase10OutputDefinition).terminalStates,
        );
        admitted = new Set([...admitted].filter((state) => outputStates.has(state)));
      }
      if (admitted.size === 0) {
        const branchLabel = branchNames.length === 0 ? "base" : branchNames.join(", ");
        refuse(`${packet.packetId} ${branchLabel} has no common receipt terminal state`);
      }
      for (const outputId of activeOutputIds) {
        const reachable = reachableStatesByOutput.get(outputId) as Set<string>;
        for (const state of admitted) reachable.add(state);
      }
      if (activeOutputIds.length > 1) {
        const active = new Set(activeOutputIds);
        const adjacency = new Map(activeOutputIds.map((outputId) => [outputId, new Set<string>()]));
        for (const outputId of activeOutputIds) {
          const output = outputs.get(outputId) as Phase10OutputDefinition;
          for (const dependencyId of output.dependsOnOutputIds) {
            if (!active.has(dependencyId)) {
              const branchLabel = branchNames.length === 0 ? "base" : branchNames.join(", ");
              refuse(
                `${packet.packetId} ${branchLabel} output ${outputId} depends on inactive ` +
                  `output ${dependencyId}`,
              );
            }
            (adjacency.get(outputId) as Set<string>).add(dependencyId);
            (adjacency.get(dependencyId) as Set<string>).add(outputId);
          }
        }
        const reached = new Set<string>();
        const pending = [activeOutputIds[0] as string];
        while (pending.length > 0) {
          const outputId = pending.pop() as string;
          if (reached.has(outputId)) continue;
          reached.add(outputId);
          for (const neighbor of adjacency.get(outputId) as Set<string>) {
            if (!reached.has(neighbor)) pending.push(neighbor);
          }
        }
        if (reached.size !== activeOutputIds.length) {
          const branchLabel = branchNames.length === 0 ? "base" : branchNames.join(", ");
          const disconnected = activeOutputIds.filter((outputId) => !reached.has(outputId));
          refuse(
            `${packet.packetId} ${branchLabel} output graph is disconnected at ` +
              `[${disconnected.join(", ")}]`,
          );
        }
      }
    };
    requireTerminalIntersection(0, [], []);
    for (const output of matrix.outputs.filter((value) => value.packetId === packet.packetId)) {
      const reachable = reachableStatesByOutput.get(output.outputId) as Set<string>;
      const unreachable = output.terminalStates.filter((state) => !reachable.has(state));
      if (unreachable.length > 0) {
        refuse(
          `${output.outputId} lists unreachable receipt terminal states ` +
            `[${unreachable.join(", ")}]`,
        );
      }
    }
  }
  for (const [outputId, count] of outputAssignments) {
    if (count !== 1) refuse(`output ${outputId} has ${count} base/conditional registrations, expected 1`);
  }
  for (const [checkId, count] of checkAssignments) {
    if (count !== 1) refuse(`check ${checkId} has ${count} base/conditional registrations, expected 1`);
  }
  for (const packet of matrix.packets) {
    const assignedOutputCount = matrix.outputs.filter((value) => value.packetId === packet.packetId).length;
    const assignedCheckCount = matrix.checks.filter((value) => value.packetId === packet.packetId).length;
    if (assignedOutputCount === 0 || assignedCheckCount === 0) {
      refuse(`${packet.packetId} must own at least one output and one check`);
    }
  }

  const obligationIds = [
    ...matrix.outputs.map((value) => `output:${value.outputId}`),
    ...matrix.checks.map((value) => `check:${value.checkId}`),
  ].sort(lexical);
  assertAcyclic(
    obligationIds,
    (node) => {
      const [kind, id] = node.split(":", 2) as ["output" | "check", string];
      if (kind === "output") {
        return (outputs.get(id) as Phase10OutputDefinition).dependsOnOutputIds.map(
          (dependencyId) => `output:${dependencyId}`,
        );
      }
      const value = checks.get(id) as Phase10CheckDefinition;
      return [
        ...value.dependsOnOutputIds.map((dependencyId) => `output:${dependencyId}`),
        ...value.dependsOnCheckIds.map((dependencyId) => `check:${dependencyId}`),
      ];
    },
    "obligation dependency graph",
  );
}

function assertDirectCallableExport(
  bytes: Uint8Array,
  modulePath: string,
  exportName: string,
  callableId: string,
): void {
  const source = ts.createSourceFile(
    modulePath,
    new TextDecoder("utf-8", { fatal: true }).decode(bytes),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  const parseDiagnostics = (
    source as ts.SourceFile & { readonly parseDiagnostics?: readonly ts.Diagnostic[] }
  ).parseDiagnostics ?? [];
  if (parseDiagnostics.length !== 0) {
    refuse(`${callableId} module contains TypeScript parse errors: ${modulePath}`);
  }
  const localCallables = new Set<string>();
  const exportedCallables = new Set<string>();
  const isExported = (node: ts.Node): boolean =>
    (ts.getCombinedModifierFlags(node as ts.Declaration) & ts.ModifierFlags.Export) !== 0;
  const isDefault = (node: ts.Node): boolean =>
    (ts.getCombinedModifierFlags(node as ts.Declaration) & ts.ModifierFlags.Default) !== 0;

  for (const statement of source.statements) {
    if (
      ts.isFunctionDeclaration(statement) &&
      statement.name !== undefined &&
      statement.body !== undefined
    ) {
      localCallables.add(statement.name.text);
      if (isExported(statement) && !isDefault(statement)) {
        exportedCallables.add(statement.name.text);
      }
      continue;
    }
    if (ts.isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        if (
          ts.isIdentifier(declaration.name) &&
          declaration.initializer !== undefined &&
          (ts.isArrowFunction(declaration.initializer) ||
            ts.isFunctionExpression(declaration.initializer))
        ) {
          localCallables.add(declaration.name.text);
          if (isExported(statement)) exportedCallables.add(declaration.name.text);
        }
      }
      continue;
    }
    if (
      ts.isExportDeclaration(statement) &&
      statement.moduleSpecifier === undefined &&
      statement.exportClause !== undefined &&
      ts.isNamedExports(statement.exportClause)
    ) {
      for (const element of statement.exportClause.elements) {
        if (element.name.text === "default") continue;
        const localName = element.propertyName?.text ?? element.name.text;
        if (localCallables.has(localName)) exportedCallables.add(element.name.text);
      }
    }
  }
  if (!exportedCallables.has(exportName)) {
    refuse(
      `${callableId} export ${exportName} is not a directly exported function in ${modulePath}`,
    );
  }
}

function activePacket(
  matrix: Phase10ObligationMatrix,
  protocol: Phase10PacketProtocol,
): {
  readonly packet: Phase10PacketDefinition;
  readonly outputs: readonly Phase10OutputDefinition[];
  readonly checks: readonly Phase10CheckDefinition[];
  readonly negativeControls: readonly Phase10NegativeControlDefinition[];
  readonly selectedBranches: Readonly<Record<string, Phase10ConditionalBranch>>;
} {
  if (protocol.matrixId !== matrix.matrixId) {
    refuse(`packet protocol matrixId ${protocol.matrixId} differs from ${matrix.matrixId}`);
  }
  const packet = matrix.packets.find((value) => value.packetId === protocol.packetId);
  if (packet === undefined) refuse(`packet protocol names unknown packet ${protocol.packetId}`);
  requireDefinitionOrder(
    protocol.selectedBranches,
    (value) => value.groupId,
    `${packet.packetId} selected branch IDs`,
  );
  const groups = matrix.conditionalGroups.filter((value) => value.packetId === packet.packetId);
  requireExactSet(
    protocol.selectedBranches.map((value) => value.groupId),
    groups.map((value) => value.groupId),
    `${packet.packetId} conditional selections`,
  );
  const selectedBranches: Record<string, Phase10ConditionalBranch> = Object.create(null) as Record<
    string,
    Phase10ConditionalBranch
  >;
  const outputIds = [...packet.baseOutputIds];
  const checkIds = [...packet.baseCheckIds];
  for (const group of groups) {
    const selection = protocol.selectedBranches.find((value) => value.groupId === group.groupId);
    if (selection === undefined) refuse(`${group.groupId} has no selected branch`);
    selectedBranches[group.groupId] = selection.branch;
    const branch = selection.branch === "independent-reference"
      ? group.independentReference
      : group.referenceRefusal;
    outputIds.push(...branch.outputIds);
    checkIds.push(...branch.checkIds);
  }
  const activeOutputIds = sorted(outputIds);
  const activeCheckIds = sorted(checkIds);
  const outputsById = new Map(matrix.outputs.map((value) => [value.outputId, value] as const));
  const checksById = new Map(matrix.checks.map((value) => [value.checkId, value] as const));
  const controlsById = new Map(
    matrix.negativeControls.map((value) => [value.negativeControlId, value] as const),
  );
  const outputs = activeOutputIds.map((outputId) => outputsById.get(outputId) as Phase10OutputDefinition);
  const checks = activeCheckIds.map((checkId) => checksById.get(checkId) as Phase10CheckDefinition);
  const negativeControlIds = sorted(checks.flatMap((check) => check.negativeControlIds));
  const negativeControls = negativeControlIds.map(
    (controlId) => controlsById.get(controlId) as Phase10NegativeControlDefinition,
  );

  requireExactSet(protocol.registeredOutputIds, activeOutputIds, `${packet.packetId} registered outputs`);
  requireExactSet(protocol.registeredCheckIds, activeCheckIds, `${packet.packetId} registered checks`);
  requireExactSet(
    protocol.registeredNegativeControlIds,
    negativeControlIds,
    `${packet.packetId} registered negative controls`,
  );
  requireExactSet(
    protocol.boundDependencyPacketIds,
    packet.dependencyPacketIds,
    `${packet.packetId} bound dependencies`,
  );

  const activeOutputs = new Set(activeOutputIds);
  const activeChecks = new Set(activeCheckIds);
  for (const output of outputs) {
    for (const dependencyId of output.dependsOnOutputIds) {
      if (!activeOutputs.has(dependencyId)) {
        refuse(`${output.outputId} has inactive output dependency ${dependencyId}`);
      }
    }
  }
  for (const check of checks) {
    for (const dependencyId of check.dependsOnOutputIds) {
      if (!activeOutputs.has(dependencyId)) {
        refuse(`${check.checkId} has inactive output dependency ${dependencyId}`);
      }
    }
    for (const dependencyId of check.dependsOnCheckIds) {
      if (!activeChecks.has(dependencyId)) {
        refuse(`${check.checkId} has inactive check dependency ${dependencyId}`);
      }
    }
  }
  return {
    packet,
    outputs,
    checks,
    negativeControls,
    selectedBranches: Object.freeze(selectedBranches),
  };
}

function actionList(
  callable: Phase10CallableBinding,
  role: Phase10CallableBinding["role"],
): readonly string[] {
  if (role === "producer") return callable.producedOutputIds;
  if (role === "check-caller") return callable.invokedCheckIds;
  if (role === "independent-evaluator") return callable.evaluatedCheckIds;
  return callable.executedNegativeControlIds;
}

function validateCallables(
  prepared: Omit<PreparedPacket, "registry">,
  registry: Phase10CallableRegistry,
  requireResolved: boolean,
  repositoryRoot: string,
): void {
  const { matrix, protocol, packet, outputs, checks, negativeControls } = prepared;
  if (
    registry.matrixId !== matrix.matrixId ||
    registry.protocolId !== protocol.protocolId ||
    registry.packetId !== packet.packetId
  ) {
    refuse("callable registry identity does not match matrix/protocol/packet");
  }
  const callables = mapById(
    registry.callables,
    (value) => value.callableId,
    `${packet.packetId} callable IDs`,
  );
  for (const callable of registry.callables) {
    requireSortedUnique(callable.producedOutputIds, `${callable.callableId}.producedOutputIds`);
    requireSortedUnique(callable.invokedCheckIds, `${callable.callableId}.invokedCheckIds`);
    requireSortedUnique(callable.evaluatedCheckIds, `${callable.callableId}.evaluatedCheckIds`);
    requireSortedUnique(
      callable.executedNegativeControlIds,
      `${callable.callableId}.executedNegativeControlIds`,
    );
  }

  const expected = new Map<
    string,
    { readonly role: Phase10CallableBinding["role"]; readonly ids: string[] }
  >();
  const registerExpected = (
    callableId: string,
    role: Phase10CallableBinding["role"],
    obligationId: string,
  ): void => {
    const existing = expected.get(callableId);
    if (existing !== undefined && existing.role !== role) {
      refuse(`callable ${callableId} is assigned conflicting roles ${existing.role} and ${role}`);
    }
    if (existing === undefined) expected.set(callableId, { role, ids: [obligationId] });
    else existing.ids.push(obligationId);
  };

  for (const output of outputs) {
    const producer = callables.get(output.producerCallableId);
    if (producer === undefined) {
      refuse(`output ${output.outputId} has no callable producer ${output.producerCallableId}`);
    }
    if (producer.role !== "producer") {
      refuse(`output ${output.outputId} producer ${producer.callableId} has role ${producer.role}`);
    }
    if (!producer.producedOutputIds.includes(output.outputId)) {
      refuse(`output ${output.outputId} is not produced by ${producer.callableId}`);
    }
    registerExpected(producer.callableId, "producer", output.outputId);
  }
  for (const check of checks) {
    const caller = callables.get(check.callerCallableId);
    if (caller === undefined) {
      refuse(`registered check ${check.checkId} has no caller ${check.callerCallableId}`);
    }
    if (caller.role !== "check-caller") {
      refuse(`registered check ${check.checkId} caller ${caller.callableId} has role ${caller.role}`);
    }
    if (!caller.invokedCheckIds.includes(check.checkId)) {
      refuse(`registered check ${check.checkId} is uncalled by ${caller.callableId}`);
    }
    registerExpected(caller.callableId, "check-caller", check.checkId);

    if (check.independentEvaluatorCallableId !== null) {
      const evaluator = callables.get(check.independentEvaluatorCallableId);
      if (evaluator === undefined) {
        refuse(
          `registered check ${check.checkId} has no independent evaluator ` +
            check.independentEvaluatorCallableId,
        );
      }
      if (evaluator.role !== "independent-evaluator") {
        refuse(`check ${check.checkId} evaluator ${evaluator.callableId} has role ${evaluator.role}`);
      }
      if (!evaluator.evaluatedCheckIds.includes(check.checkId)) {
        refuse(`check ${check.checkId} is not evaluated by ${evaluator.callableId}`);
      }
      if (evaluator.modulePath === caller.modulePath) {
        refuse(`check ${check.checkId} evaluator shares caller module ${evaluator.modulePath}`);
      }
      for (const outputId of check.dependsOnOutputIds) {
        const output = outputs.find((value) => value.outputId === outputId);
        if (output === undefined) continue;
        const producer = callables.get(output.producerCallableId) as Phase10CallableBinding;
        if (evaluator.modulePath === producer.modulePath) {
          refuse(`check ${check.checkId} evaluator shares producer module ${evaluator.modulePath}`);
        }
      }
      registerExpected(evaluator.callableId, "independent-evaluator", check.checkId);
    }
  }
  for (const control of negativeControls) {
    const callable = callables.get(control.callableId);
    if (callable === undefined) {
      refuse(`negative control ${control.negativeControlId} has no callable ${control.callableId}`);
    }
    if (callable.role !== "negative-control") {
      refuse(`negative control ${control.negativeControlId} callable ${callable.callableId} has role ${callable.role}`);
    }
    if (!callable.executedNegativeControlIds.includes(control.negativeControlId)) {
      refuse(`negative control ${control.negativeControlId} is unexecuted by ${callable.callableId}`);
    }
    registerExpected(callable.callableId, "negative-control", control.negativeControlId);
  }

  const activeProducers = registry.callables.filter((callable) => callable.role === "producer");
  const activeEvaluators = registry.callables.filter(
    (callable) => callable.role === "independent-evaluator",
  );
  const activeNegativeControls = registry.callables.filter(
    (callable) => callable.role === "negative-control",
  );
  for (const evaluator of activeEvaluators) {
    for (const producer of activeProducers) {
      if (evaluator.modulePath === producer.modulePath) {
        refuse(
          `evaluator ${evaluator.callableId} shares active producer module ` +
            `${producer.callableId}: ${evaluator.modulePath}`,
        );
      }
    }
    for (const control of activeNegativeControls) {
      if (evaluator.modulePath === control.modulePath) {
        refuse(
          `evaluator ${evaluator.callableId} shares negative-control module ` +
            `${control.callableId}: ${evaluator.modulePath}`,
        );
      }
    }
  }

  requireExactSet([...callables.keys()], [...expected.keys()], `${packet.packetId} callable roster`);
  for (const [callableId, registration] of expected) {
    const callable = callables.get(callableId) as Phase10CallableBinding;
    if (callable.role !== registration.role) {
      refuse(`callable ${callableId} role differs from registered obligation role`);
    }
    requireExactSet(
      actionList(callable, registration.role),
      registration.ids,
      `${callableId} ${registration.role} obligations`,
    );
    for (const role of [
      "producer",
      "check-caller",
      "independent-evaluator",
      "negative-control",
    ] as const) {
      if (role !== registration.role && actionList(callable, role).length !== 0) {
        refuse(`${callableId} carries role-inapplicable ${role} obligations`);
      }
    }
    if (requireResolved && callable.resolution !== "resolved") {
      refuse(`run preflight found unresolved callable ${callableId}`);
    }
    if (callable.resolution === "resolved") {
      const absoluteRoot = resolve(repositoryRoot);
      const absoluteModule = resolve(absoluteRoot, callable.modulePath);
      const relativeModule = relative(absoluteRoot, absoluteModule);
      if (
        relativeModule.length === 0 ||
        relativeModule === ".." ||
        relativeModule.startsWith(`..${process.platform === "win32" ? "\\" : "/"}`) ||
        isAbsolute(relativeModule)
      ) {
        refuse(`${callableId} module path escapes the repository root`);
      }
      let bytes: Uint8Array;
      try {
        bytes = new Uint8Array(readFileSync(absoluteModule));
      } catch (error) {
        refuse(
          `${callableId} module cannot be read: ` +
            (error instanceof Error ? error.message : String(error)),
        );
      }
      const identity = callable.identity;
      if (identity === null) refuse(`${callableId} resolved without a byte identity`);
      const sha256 = createHash("sha256").update(bytes).digest("hex");
      if (identity.byteLength !== bytes.byteLength || identity.sha256 !== sha256) {
        refuse(`${callableId} module byte identity differs from the callable registry`);
      }
      assertDirectCallableExport(bytes, callable.modulePath, callable.exportName, callableId);
    }
  }
}

function prepare(
  matrixValue: unknown,
  protocolValue: unknown,
  registryValue: unknown,
  requireResolved: boolean,
  repositoryRoot: string,
): PreparedPacket {
  const matrix = parseOrRefuse("obligation matrix", () => parsePhase10ObligationMatrix(matrixValue));
  const protocol = parseOrRefuse("packet protocol", () => parsePhase10PacketProtocol(protocolValue));
  const registry = parseOrRefuse("callable registry", () => parsePhase10CallableRegistry(registryValue));
  validateMatrix(matrix);
  const active = activePacket(matrix, protocol);
  validateActiveArtifactSchemas(
    matrix,
    active.packet,
    active.outputs,
    protocol.artifactSchemaRegistry,
    requireResolved,
    repositoryRoot,
  );
  validateCallables({ matrix, protocol, ...active }, registry, requireResolved, repositoryRoot);
  return { matrix, protocol, registry, ...active };
}

function result(
  stage: PreflightStage,
  prepared: PreparedPacket,
  receipt: Phase10ExecutionReceipt | null,
): Phase10ObligationPreflightPass {
  return Object.freeze({
    pass: true,
    stage,
    matrixId: prepared.matrix.matrixId,
    protocolId: prepared.protocol.protocolId,
    registryId: prepared.registry.registryId,
    packetId: prepared.packet.packetId,
    outputIds: Object.freeze(prepared.outputs.map((value) => value.outputId)),
    checkIds: Object.freeze(prepared.checks.map((value) => value.checkId)),
    negativeControlIds: Object.freeze(
      prepared.negativeControls.map((value) => value.negativeControlId),
    ),
    callableIds: Object.freeze(prepared.registry.callables.map((value) => value.callableId)),
    unresolvedCallableIds: Object.freeze(
      prepared.registry.callables
        .filter((value) => value.resolution === "planned")
        .map((value) => value.callableId),
    ),
    selectedBranches: prepared.selectedBranches,
    receiptId: receipt?.receiptId ?? null,
    terminalState: receipt?.terminalState ?? null,
  });
}

/** Parse and validate the complete, packet-agnostic obligation graph. */
export function phase10ValidateObligationMatrix(
  matrixValue: unknown,
): Phase10ObligationMatrixValidationPass {
  const matrix = parseOrRefuse("obligation matrix", () =>
    parsePhase10ObligationMatrix(matrixValue));
  validateMatrix(matrix);
  return Object.freeze({
    pass: true,
    matrixId: matrix.matrixId,
    packetCount: matrix.packets.length,
    outputCount: matrix.outputs.length,
    checkCount: matrix.checks.length,
    negativeControlCount: matrix.negativeControls.length,
    conditionalGroupCount: matrix.conditionalGroups.length,
  });
}

/**
 * Validate the S1 contract graph while allowing later packet callables to remain explicitly planned.
 * A planned callable is a named obligation, never launch authorization.
 */
export function phase10ObligationFreezePreflight(
  matrix: unknown,
  protocol: unknown,
  callableRegistry: unknown,
  repositoryRoot = process.cwd(),
): Phase10ObligationPreflightPass {
  return result(
    "freeze",
    prepare(matrix, protocol, callableRegistry, false, repositoryRoot),
    null,
  );
}

/** Refuse launch unless every active producer, caller, evaluator, and control is byte-resolved. */
export function phase10ObligationRunPreflight(
  matrix: unknown,
  protocol: unknown,
  callableRegistry: unknown,
  repositoryRoot = process.cwd(),
): Phase10ObligationPreflightPass {
  return result(
    "run",
    prepare(matrix, protocol, callableRegistry, true, repositoryRoot),
    null,
  );
}

/**
 * Validate a terminal receipt by exact equality with the obligations derived from the first three
 * layers. A producer cannot make an omitted output or uncalled check disappear from the contract.
 */
export function phase10ObligationReceiptPreflight(
  matrix: unknown,
  protocol: unknown,
  callableRegistry: unknown,
  receiptValue: unknown,
  repositoryRoot = process.cwd(),
): Phase10ObligationPreflightPass {
  const prepared = prepare(
    matrix,
    protocol,
    callableRegistry,
    true,
    repositoryRoot,
  );
  const receipt = parseOrRefuse("execution receipt", () =>
    parsePhase10ExecutionReceipt(receiptValue));
  if (
    receipt.matrixId !== prepared.matrix.matrixId ||
    receipt.protocolId !== prepared.protocol.protocolId ||
    receipt.registryId !== prepared.registry.registryId ||
    receipt.packetId !== prepared.packet.packetId
  ) {
    refuse("execution receipt identity does not match matrix/protocol/registry/packet");
  }
  requireExactSet(
    receipt.producedOutputIds,
    prepared.outputs.map((value) => value.outputId),
    `${prepared.packet.packetId} receipt produced outputs`,
  );
  requireExactSet(
    receipt.executedCheckIds,
    prepared.checks.map((value) => value.checkId),
    `${prepared.packet.packetId} receipt executed checks`,
  );
  requireExactSet(
    receipt.evaluatedCheckIds,
    prepared.checks
      .filter((value) => value.independentEvaluatorCallableId !== null)
      .map((value) => value.checkId),
    `${prepared.packet.packetId} receipt evaluated checks`,
  );
  requireExactSet(
    receipt.executedNegativeControlIds,
    prepared.negativeControls.map((value) => value.negativeControlId),
    `${prepared.packet.packetId} receipt executed negative controls`,
  );
  requireExactSet(
    receipt.boundDependencyPacketIds,
    prepared.packet.dependencyPacketIds,
    `${prepared.packet.packetId} receipt bound dependencies`,
  );
  for (const output of prepared.outputs) {
    if (!output.terminalStates.includes(receipt.terminalState)) {
      refuse(
        `${prepared.packet.packetId} receipt terminal state ${receipt.terminalState} ` +
          `is not admitted by output ${output.outputId}`,
      );
    }
  }
  return result("receipt", prepared, receipt);
}
