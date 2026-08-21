import { lstatSync, readFileSync, realpathSync } from "node:fs";
import { isAbsolute, relative, resolve } from "node:path";
import {
  sha256Bytes,
  strictJsonSnapshot,
  type StrictJson,
} from "./gate4-evidence.ts";
import {
  parsePhase10CallableRegistry,
  parsePhase10ObligationMatrix,
  parsePhase10PacketProtocol,
  type Phase10ObligationMatrix,
} from "./phase10-contracts.ts";
import {
  phase10ObligationRunPreflight,
  phase10ValidateObligationMatrix,
} from "./phase10-obligation-preflight.ts";
import type { Phase10ApCheckResult } from "./phase10-verification-receipt.ts";

const MATRIX_PATH = "research/phase10-obligation-matrix-v1.json" as const;
const FOUNDATION_PATH = "research/phase10-foundation-freeze-v1.json" as const;
const SCHEMA_REGISTRY_PATH = "research/phase10-artifact-schema-registry-v1.json" as const;
const C0_PROTOCOL_PATH = "research/phase10-c0-protocol-v1.json" as const;
const C0V_FOUNDATION_PATH = "research/phase10-c0v-foundation-v1.json" as const;
const README_PATH = "research/phase10-execution-v1/README.md" as const;
const CATALOGUE_PATH = "research/phase10-execution-v1/packet-catalogue.json" as const;
const PROTOCOL_PATH = "research/phase10-execution-v1/packets/a-p/protocol.json" as const;
const REGISTRY_PATH = "research/phase10-execution-v1/packets/a-p/callable-registry.json" as const;
const PACKET_ID = "a-p" as const;
const AP_PRODUCE_COMMAND =
  "node runner/src/phase10-ap-publish.ts produce --repository-root . --out out/phase10-obligation-preflight-v1-candidate" as const;
const AP_VERIFY_COMMAND =
  "node runner/src/phase10-ap-independent.ts verify --repository-root . --bundle out/phase10-obligation-preflight-v1-candidate --receipt out/phase10-obligation-preflight-v1-candidate/verification.json" as const;
const AP_PUBLISH_COMMAND =
  "node runner/src/phase10-ap-publish.ts publish --repository-root . --candidate out/phase10-obligation-preflight-v1-candidate --out evidence/phase10-obligation-preflight-v1" as const;

const CHECK_IDS = Object.freeze([
  "chk-ap-called-checks",
  "chk-ap-command-boundary",
  "chk-ap-conditional-groups",
  "chk-ap-global-coverage",
  "chk-ap-output-producers",
  "chk-ap-packet-catalogue",
  "chk-ap-packet-set-equality",
  "chk-ap-rights-resource-claim-boundary",
  "chk-ap-schema-coverage",
  "chk-ap-schema-promotion",
  "chk-ap-self-freeze",
]);

const PREVERIFICATION_OUTPUT_IDS = Object.freeze([
  "out-ap-artifact-index",
  "out-ap-artifact-schema-registry",
  "out-ap-c0-protocol",
  "out-ap-c0v-foundation",
  "out-ap-execution-readme",
  "out-ap-foundation-freeze",
  "out-ap-matrix",
  "out-ap-missing-producer-receipt",
  "out-ap-packet-catalogue",
  "out-ap-self-callable-registry",
  "out-ap-self-packet-protocol",
  "out-ap-uncalled-check-receipt",
]);

const INDEXED_OUTPUT_IDS = Object.freeze(PREVERIFICATION_OUTPUT_IDS.filter((id) =>
  id !== "out-ap-artifact-index"));

type JsonObject = { readonly [key: string]: StrictJson };

export interface Phase10ApCheckCallerRequest {
  readonly repositoryRoot: string;
  readonly candidateDirectory: string;
}

export interface Phase10ApCheckCallerEvaluation {
  readonly executedCheckIds: readonly string[];
  readonly checkResults: readonly Phase10ApCheckResult[];
}

interface Context {
  readonly root: string;
  readonly candidate: string;
  readonly matrixValue: StrictJson;
  readonly matrix: Phase10ObligationMatrix;
  readonly protocolValue: StrictJson;
  readonly registryValue: StrictJson;
  readonly foundation: JsonObject;
  readonly schemaRegistry: JsonObject;
  readonly catalogue: JsonObject;
  readonly readme: string;
  readonly artifactIndex: JsonObject;
  readonly missingProducerReceipt: JsonObject;
  readonly uncalledCheckReceipt: JsonObject;
}

function fail(message: string): never {
  throw new Error(`Phase 10 A-P check caller refused: ${message}`);
}

function compareText(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function exactKeys(value: object, expected: readonly string[], label: string): void {
  const actual = Object.keys(value).sort(compareText);
  const wanted = [...expected].sort(compareText);
  if (actual.length !== wanted.length || actual.some((entry, index) => entry !== wanted[index])) {
    fail(`${label} fields differ`);
  }
}

function object(value: StrictJson, label: string): JsonObject {
  if (value === null || Array.isArray(value) || typeof value !== "object") fail(`${label} must be an object`);
  return value as JsonObject;
}

function array(value: StrictJson | undefined, label: string): readonly StrictJson[] {
  if (!Array.isArray(value)) fail(`${label} must be an array`);
  return value;
}

function strings(value: StrictJson | undefined, label: string): readonly string[] {
  const values = array(value, label);
  if (values.some((entry) => typeof entry !== "string")) fail(`${label} must contain only strings`);
  return values as readonly string[];
}

function prettyJson(bytes: Uint8Array, label: string): StrictJson {
  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    fail(`${label} is not valid UTF-8`);
  }
  if (text.includes("\r")) fail(`${label} must use LF line endings`);
  let value: unknown;
  try {
    value = JSON.parse(text) as unknown;
  } catch {
    fail(`${label} is not valid JSON`);
  }
  const snapshot = strictJsonSnapshot(value);
  if (text !== `${JSON.stringify(snapshot, null, 2)}\n`) fail(`${label} is not exact two-space JSON plus LF`);
  return snapshot;
}

function safeRootDirectory(value: string): string {
  const root = realpathSync(resolve(value));
  const stat = lstatSync(root);
  if (!stat.isDirectory() || stat.isSymbolicLink()) fail("repository root must be a non-symlink directory");
  return root;
}

function safeFileBelow(base: string, relativePath: string, label: string): Uint8Array {
  if (
    isAbsolute(relativePath) || relativePath.includes("\\") || relativePath.startsWith("/") ||
    relativePath.endsWith("/") || relativePath.split("/").some((part) => part === "" || part === "." || part === "..")
  ) {
    fail(`${label} path is unsafe`);
  }
  const absolute = resolve(base, relativePath);
  const stat = lstatSync(absolute);
  if (!stat.isFile() || stat.isSymbolicLink()) fail(`${label} must be a regular non-symlink file`);
  const physical = realpathSync(absolute);
  const fromBase = relative(base, physical).replaceAll("\\", "/");
  if (fromBase !== relativePath) {
    fail(`${label} resolves outside or aliases within its root`);
  }
  return new Uint8Array(readFileSync(physical));
}

function safeCandidate(root: string, value: string): string {
  const candidate = realpathSync(resolve(root, value));
  const stat = lstatSync(candidate);
  const fromRoot = relative(root, candidate);
  if (
    !stat.isDirectory() || stat.isSymbolicLink() || fromRoot === "" || fromRoot === ".." ||
    fromRoot.startsWith(`..${process.platform === "win32" ? "\\" : "/"}`) || isAbsolute(fromRoot)
  ) {
    fail("candidate must be a non-symlink directory below the repository root");
  }
  return candidate;
}

function capture(request: Phase10ApCheckCallerRequest): Context {
  const root = safeRootDirectory(request.repositoryRoot);
  const candidate = safeCandidate(root, request.candidateDirectory);
  const matrixValue = prettyJson(safeFileBelow(root, MATRIX_PATH, "matrix"), "matrix");
  const protocolValue = prettyJson(safeFileBelow(root, PROTOCOL_PATH, "A-P protocol"), "A-P protocol");
  const registryValue = prettyJson(safeFileBelow(root, REGISTRY_PATH, "A-P registry"), "A-P registry");
  return Object.freeze({
    root,
    candidate,
    matrixValue,
    matrix: parsePhase10ObligationMatrix(matrixValue),
    protocolValue,
    registryValue,
    foundation: object(prettyJson(safeFileBelow(root, FOUNDATION_PATH, "foundation"), "foundation"), "foundation"),
    schemaRegistry: object(
      prettyJson(safeFileBelow(root, SCHEMA_REGISTRY_PATH, "schema registry"), "schema registry"),
      "schema registry",
    ),
    catalogue: object(prettyJson(safeFileBelow(root, CATALOGUE_PATH, "catalogue"), "catalogue"), "catalogue"),
    readme: new TextDecoder("utf-8", { fatal: true }).decode(safeFileBelow(root, README_PATH, "execution README")),
    artifactIndex: object(
      prettyJson(safeFileBelow(candidate, "artifact-index.json", "candidate artifact index"), "candidate artifact index"),
      "candidate artifact index",
    ),
    missingProducerReceipt: object(
      prettyJson(safeFileBelow(candidate, "missing-producer.json", "missing-producer receipt"), "missing-producer receipt"),
      "missing-producer receipt",
    ),
    uncalledCheckReceipt: object(
      prettyJson(safeFileBelow(candidate, "uncalled-check.json", "uncalled-check receipt"), "uncalled-check receipt"),
      "uncalled-check receipt",
    ),
  });
}

function check(
  checkId: string,
  witnesses: readonly string[],
  action: () => void,
): Phase10ApCheckResult {
  const reasons: string[] = [];
  try {
    action();
  } catch (error) {
    reasons.push(error instanceof Error ? error.message : String(error));
  }
  return Object.freeze({
    checkId,
    verdict: reasons.length === 0 ? "pass" : "fail",
    reasons: Object.freeze([...new Set(reasons)].sort(compareText)),
    witnessOutputIds: Object.freeze([...new Set(witnesses)].sort(compareText)),
  });
}

function exact(actual: readonly string[], expected: readonly string[], label: string): void {
  if (actual.length !== expected.length || actual.some((entry, index) => entry !== expected[index])) {
    fail(`${label} differs`);
  }
}

function validateCalledChecks(context: Context): void {
  const registry = parsePhase10CallableRegistry(context.registryValue);
  const caller = registry.callables.find((entry) => entry.callableId === "phase10-a-p-check-caller");
  if (caller === undefined || caller.role !== "check-caller") fail("A-P check caller is absent");
  exact(caller.invokedCheckIds, CHECK_IDS, "A-P called-check roster");
}

function validateCommandBoundary(context: Context): void {
  if (context.readme.includes("\r")) fail("execution README must use LF line endings");
  for (const marker of [
    "protocol record, not evidence that a packet has run",
    "npm test",
    "phase10-executor.ts run --packet <packet-id>",
    "A-S is a static-contract packet",
    "A-I is the other static-contract packet",
    "node runner/src/main.ts gate10",
    "Unknown packet IDs",
    "No C1",
    AP_PRODUCE_COMMAND,
    AP_VERIFY_COMMAND,
    AP_PUBLISH_COMMAND,
  ]) {
    if (!context.readme.includes(marker)) fail(`execution README lacks command-boundary marker: ${marker}`);
  }
}

function validateConditionalGroups(context: Context): void {
  const validation = phase10ValidateObligationMatrix(context.matrixValue);
  if (validation.conditionalGroupCount !== 3) fail("matrix conditional-group count is not 3");
  for (const group of context.matrix.conditionalGroups) {
    if (group.independentReference.outputIds.length === 0 || group.referenceRefusal.outputIds.length === 0) {
      fail(`${group.groupId} has an empty terminal branch`);
    }
  }
}

function validateGlobalCoverage(context: Context): void {
  const validation = phase10ValidateObligationMatrix(context.matrixValue);
  if (
    validation.packetCount !== 21 || validation.outputCount !== 112 || validation.checkCount !== 140 ||
    validation.negativeControlCount !== 23 || validation.conditionalGroupCount !== 3
  ) {
    fail("matrix global obligation counts differ from 21/112/140/23/3");
  }
  const indexEntries = array(context.artifactIndex.artifacts, "artifact-index artifacts")
    .map((entry) => object(entry, "artifact-index entry"));
  exact(indexEntries.map((entry) => String(entry.artifactId)), INDEXED_OUTPUT_IDS, "A-P producer index IDs");
}

function validateOutputProducers(context: Context): void {
  if (context.matrix.outputs.some((output) => output.producerCallableId.length === 0)) {
    fail("matrix contains an output without a producer callable ID");
  }
  if (context.matrix.checks.some((entry) => entry.callerCallableId.length === 0)) {
    fail("matrix contains a check without a caller callable ID");
  }
  const registry = parsePhase10CallableRegistry(context.registryValue);
  const producerBindings = new Map(registry.callables
    .filter((entry) => entry.role === "producer")
    .map((entry) => [entry.callableId, entry.producedOutputIds] as const));
  for (const output of context.matrix.outputs.filter((entry) => entry.packetId === PACKET_ID)) {
    if (!producerBindings.get(output.producerCallableId)?.includes(output.outputId)) {
      fail(`${output.outputId} is absent from its A-P producer binding`);
    }
  }
}

function catalogueRows(context: Context): readonly JsonObject[] {
  exactKeys(context.catalogue, ["schema", "catalogueId", "matrixId", "packets"], "packet catalogue");
  if (context.catalogue.schema !== "phase10-packet-catalogue-v1" ||
      context.catalogue.catalogueId !== "phase10-selected-package-packet-paths-v1" ||
      context.catalogue.matrixId !== context.matrix.matrixId) {
    fail("packet catalogue identity differs");
  }
  return array(context.catalogue.packets, "catalogue packets").map((entry) => object(entry, "catalogue packet"));
}

function validateCatalogue(context: Context): void {
  const rows = catalogueRows(context);
  const expectedPacketIds = context.matrix.packets.map((entry) => entry.packetId);
  exact(expectedPacketIds, [...expectedPacketIds].sort(compareText), "matrix packet order");
  exact(rows.map((row) => String(row.packetId)), expectedPacketIds, "catalogue packet roster/order");
  const allPaths = new Set<string>();
  const attemptRoots = new Set<string>();
  const outputDestinations = new Set<string>();
  const safePath = (value: StrictJson | undefined, label: string): string => {
    if (
      typeof value !== "string" || value.length === 0 || isAbsolute(value) || value.includes("\\") ||
      value.startsWith("/") || value.endsWith("/") ||
      value.split("/").some((part) => part === "" || part === "." || part === "..")
    ) {
      fail(`${label} is unsafe`);
    }
    return value;
  };
  for (const row of rows) {
    exactKeys(
      row,
      [
        "packetId", "launchClass", "protocolPath", "callableRegistryPath", "attemptRoot",
        "preflightReceiptPath", "terminalReceiptPath", "verificationPaths",
      ],
      "catalogue packet row",
    );
    const packetId = String(row.packetId);
    const packet = context.matrix.packets.find((entry) => entry.packetId === packetId);
    if (packet === undefined || row.launchClass !== packet.launchClass) fail(`${packetId} catalogue row differs from matrix`);
    const expectedPaths = Object.freeze({
      protocolPath: `research/phase10-execution-v1/packets/${packetId}/protocol.json`,
      callableRegistryPath: `research/phase10-execution-v1/packets/${packetId}/callable-registry.json`,
      attemptRoot: `out/phase10-execution-v1/attempts/${packetId}`,
      preflightReceiptPath: `evidence/phase10-obligation-preflight-v1/packets/${packetId}/preflight.json`,
      terminalReceiptPath: `evidence/phase10-obligation-preflight-v1/packets/${packetId}/terminal-receipt.json`,
    });
    for (const [field, expected] of Object.entries(expectedPaths)) {
      const value = safePath(row[field], `${packetId}.${field}`);
      if (value !== expected) fail(`${packetId}.${field} differs from the frozen packet path convention`);
      if (allPaths.has(value)) fail(`catalogue path ${value} is reused`);
      allPaths.add(value);
      if (field === "attemptRoot") {
        if (attemptRoots.has(value)) fail(`catalogue attempt root ${value} is reused`);
        attemptRoots.add(value);
      }
      if (field === "preflightReceiptPath" || field === "terminalReceiptPath") {
        if (outputDestinations.has(value)) fail(`catalogue output destination ${value} is reused`);
        outputDestinations.add(value);
      }
    }
    const verificationPaths = strings(row.verificationPaths, `${packetId}.verificationPaths`);
    if (verificationPaths.length === 0) fail(`${packetId}.verificationPaths is empty`);
    exact(verificationPaths, [...verificationPaths].sort(compareText), `${packetId}.verificationPaths order`);
    if (new Set(verificationPaths).size !== verificationPaths.length) {
      fail(`${packetId}.verificationPaths contains a duplicate`);
    }
    for (const [index, rawPath] of verificationPaths.entries()) {
      const path = safePath(rawPath, `${packetId}.verificationPaths[${index}]`);
      if (!path.startsWith("evidence/") || !path.endsWith(".json")) {
        fail(`${packetId}.verificationPaths[${index}] is not an evidence JSON destination`);
      }
      if (allPaths.has(path) || outputDestinations.has(path)) fail(`catalogue path ${path} is reused`);
      allPaths.add(path);
      outputDestinations.add(path);
      const matchingOutputs = context.matrix.outputs.filter((output) =>
        output.packetId === packetId && output.artifact.field === null && output.artifact.path === path);
      if (matchingOutputs.length !== 1) {
        fail(`${packetId}.verificationPaths[${index}] does not name exactly one frozen packet output`);
      }
    }
  }
}

function validatePacketSets(context: Context): void {
  const protocol = parsePhase10PacketProtocol(context.protocolValue);
  const packet = context.matrix.packets.find((entry) => entry.packetId === PACKET_ID);
  if (packet === undefined) fail("matrix has no A-P packet");
  exact(protocol.registeredOutputIds, packet.baseOutputIds, "A-P output set");
  exact(protocol.registeredCheckIds, packet.baseCheckIds, "A-P check set");
  exact(protocol.boundDependencyPacketIds, packet.dependencyPacketIds, "A-P dependency set");
  const controls = context.matrix.negativeControls
    .filter((entry) => entry.packetId === PACKET_ID)
    .map((entry) => entry.negativeControlId)
    .sort(compareText);
  exact(protocol.registeredNegativeControlIds, controls, "A-P negative-control set");
  exact(
    catalogueRows(context).map((row) => String(row.packetId)).sort(compareText),
    context.matrix.packets.map((entry) => entry.packetId).sort(compareText),
    "catalogue/matrix packet set",
  );
}

function validateBoundary(context: Context): void {
  const selected = object(context.foundation.selectedPackage as StrictJson, "selected package");
  exact(strings(selected.included, "selected included"), ["A-S", "A-I", "B", "C0", "C0V", "packet-specific A-P"], "selected package");
  const nas = object(context.foundation.nasBoundary as StrictJson, "NAS boundary");
  const existing = object(nas.existingCollection as StrictJson, "existing NAS collection");
  const created = object(nas.newCollection as StrictJson, "new NAS collection");
  if (existing.servePolicy !== "deny" || existing.privacy !== "private" || existing.mutability !== "immutable") {
    fail("existing NAS boundary is not private, denied, and immutable");
  }
  if (created.maximumCombinedStagingAndPublicationBytes !== 10 * 1024 ** 3 ||
      created.paidAcquisitionAuthorized !== false || created.sourcePruneAuthorized !== false) {
    fail("new-source resource/authority boundary differs");
  }
  const search = object(context.foundation.searchPolicy as StrictJson, "search policy");
  if (
    search.maximumPacketsPerOperandGroup !== 1 || search.maximumServicesOrEndpointsPerPacket !== 3 ||
    search.maximumQueriesPerPacket !== 4 || search.maximumUniqueCandidatesAfterDeduplicationPerPacket !== 25 ||
    search.broadDiscoveryAuthorized !== false || search.providerContactAuthorized !== false ||
    search.purchaseAuthorized !== false || search.experimentAuthorized !== false
  ) {
    fail("search/resource boundary differs");
  }
  const claim = object(context.foundation.claimBoundary as StrictJson, "claim boundary");
  if (
    claim.scopeCensusOnlyForAS !== true || claim.allOpenedSourceValuesArePhase10DevelopmentEvidence !== true ||
    claim.priorPhaseLabelsAndArtifactsPreserved !== true
  ) {
    fail("positive claim-boundary fields differ");
  }
  for (const field of [
    "quantitativeValidationEarned", "phase7CreditEarned", "phase8CreditEarned", "phase9CreditEarned",
    "heldOutComparisonExecuted", "targetScoreProduced", "solverPhysicsChanged", "c1ThroughC5RowsProduced",
    "habitRowsProduced", "eObservationOperatorImplemented", "fExternalRequestWrittenOrSent",
    "hTransportImplemented", "downstreamExecutionAuthorized",
  ]) {
    if (claim[field] !== false) fail(`claim boundary ${field} is not false`);
  }
}

function schemaCollections(context: Context): {
  readonly definitions: Map<string, { readonly kind: string; readonly value: JsonObject }>;
  readonly availability: Map<string, JsonObject>;
} {
  const definitions = new Map<string, { readonly kind: string; readonly value: JsonObject }>();
  for (const [field, kind] of [
    ["artifactSchemas", "artifact"], ["schemaAliases", "alias"],
    ["externalSchemaDefinitions", "external"], ["externalSchemaReservations", "reservation"],
  ] as const) {
    for (const raw of array(context.schemaRegistry[field], `schema registry ${field}`)) {
      const value = object(raw, `${field} row`);
      const schemaId = String(value.schemaId);
      if (definitions.has(schemaId)) fail(`schema ${schemaId} is defined more than once`);
      definitions.set(schemaId, { kind, value });
    }
  }
  const availability = new Map<string, JsonObject>();
  for (const raw of array(context.schemaRegistry.schemaAvailability, "schema availability")) {
    const value = object(raw, "schema availability row");
    const schemaId = String(value.schemaId);
    if (availability.has(schemaId)) fail(`schema availability ${schemaId} is duplicated`);
    availability.set(schemaId, value);
  }
  return { definitions, availability };
}

function validateSchemaCoverage(context: Context): void {
  const schemas = schemaCollections(context);
  exact([...schemas.definitions.keys()].sort(compareText), [...schemas.availability.keys()].sort(compareText), "schema definition/availability set");
  for (const output of context.matrix.outputs) {
    if (!schemas.definitions.has(output.artifact.schemaId)) fail(`${output.outputId} has no schema definition`);
  }
}

function validateSchemaPromotion(context: Context): void {
  const schemas = schemaCollections(context);
  for (const [schemaId, row] of schemas.availability) {
    const definition = schemas.definitions.get(schemaId);
    if (definition === undefined) fail(`${schemaId} availability has no definition`);
    const required = strings(row.requiredBeforePacketIds, `${schemaId} promotion roster`);
    if (row.state === "reserved") {
      if (definition.kind !== "reservation" || required.length === 0) fail(`${schemaId} reserved state differs`);
      for (const output of context.matrix.outputs.filter((entry) => entry.artifact.schemaId === schemaId)) {
        if (!required.includes(output.packetId)) fail(`${schemaId} reservation omits packet ${output.packetId}`);
      }
    } else if (row.state === "defined") {
      if (definition.kind === "reservation" || required.length !== 0) fail(`${schemaId} defined state differs`);
    } else {
      fail(`${schemaId} has an unknown availability state`);
    }
  }
}

function validateSelfFreeze(context: Context): void {
  const result = phase10ObligationRunPreflight(
    context.matrixValue,
    context.protocolValue,
    context.registryValue,
    context.root,
  );
  if (result.packetId !== PACKET_ID || result.stage !== "run" || result.unresolvedCallableIds.length !== 0) {
    fail("A-P run preflight did not produce a resolved self-freeze pass");
  }
  if (context.missingProducerReceipt.refused !== true || context.missingProducerReceipt.fixtureId !== "missing-producer") {
    fail("missing-producer receipt is not a refusal");
  }
  if (context.uncalledCheckReceipt.refused !== true || context.uncalledCheckReceipt.fixtureId !== "uncalled-check") {
    fail("uncalled-check receipt is not a refusal");
  }
}

/** Invoke every registered A-P structural check without supplying an authoritative verdict. */
export function verifyPhase10ApArtifacts(
  request: Phase10ApCheckCallerRequest,
): Phase10ApCheckCallerEvaluation {
  const context = capture(request);
  const results = Object.freeze([
    check("chk-ap-called-checks", ["out-ap-matrix", "out-ap-self-callable-registry"], () => validateCalledChecks(context)),
    check("chk-ap-command-boundary", ["out-ap-execution-readme"], () => validateCommandBoundary(context)),
    check("chk-ap-conditional-groups", ["out-ap-matrix"], () => validateConditionalGroups(context)),
    check("chk-ap-global-coverage", ["out-ap-artifact-index", "out-ap-matrix"], () => validateGlobalCoverage(context)),
    check("chk-ap-output-producers", ["out-ap-matrix", "out-ap-self-callable-registry"], () => validateOutputProducers(context)),
    check("chk-ap-packet-catalogue", ["out-ap-packet-catalogue"], () => validateCatalogue(context)),
    check("chk-ap-packet-set-equality", ["out-ap-matrix", "out-ap-packet-catalogue", "out-ap-self-packet-protocol"], () => validatePacketSets(context)),
    check("chk-ap-rights-resource-claim-boundary", ["out-ap-foundation-freeze"], () => validateBoundary(context)),
    check("chk-ap-schema-coverage", ["out-ap-artifact-schema-registry", "out-ap-matrix"], () => validateSchemaCoverage(context)),
    check("chk-ap-schema-promotion", ["out-ap-artifact-schema-registry", "out-ap-matrix"], () => validateSchemaPromotion(context)),
    check("chk-ap-self-freeze", ["out-ap-matrix", "out-ap-missing-producer-receipt", "out-ap-self-callable-registry", "out-ap-self-packet-protocol", "out-ap-uncalled-check-receipt"], () => validateSelfFreeze(context)),
  ]);
  exact(results.map((entry) => entry.checkId), CHECK_IDS, "A-P invoked check order");
  return Object.freeze({ executedCheckIds: CHECK_IDS, checkResults: results });
}

export const PHASE10_AP_CHECK_IDS = CHECK_IDS;
export const PHASE10_AP_PREVERIFICATION_OUTPUT_IDS = PREVERIFICATION_OUTPUT_IDS;
export const PHASE10_AP_INDEXED_OUTPUT_IDS = INDEXED_OUTPUT_IDS;
