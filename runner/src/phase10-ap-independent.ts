import { spawnSync } from "node:child_process";
import { lstatSync, readFileSync, realpathSync } from "node:fs";
import { isAbsolute, relative, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";
import {
  canonicalJsonBytes,
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
import {
  writePhase10PacketVerificationReceipt,
  type Phase10ApCheckResult,
  type Phase10ApIndependentEvaluation,
  type Phase10ApNegativeControlResult,
  type Phase10ApVerifiedArtifact,
} from "./phase10-verification-receipt.ts";

const EXPECTED_BRANCH = "phase10/evidence-verification" as const;
const EXPECTED_RUNTIME = "v24.13.1" as const;
const PACKET_ID = "a-p" as const;
const MATRIX_PATH = "research/phase10-obligation-matrix-v1.json" as const;
const FOUNDATION_PATH = "research/phase10-foundation-freeze-v1.json" as const;
const SCHEMA_REGISTRY_PATH = "research/phase10-artifact-schema-registry-v1.json" as const;
const README_PATH = "research/phase10-execution-v1/README.md" as const;
const CATALOGUE_PATH = "research/phase10-execution-v1/packet-catalogue.json" as const;
const PROTOCOL_PATH = "research/phase10-execution-v1/packets/a-p/protocol.json" as const;
const REGISTRY_PATH = "research/phase10-execution-v1/packets/a-p/callable-registry.json" as const;
const REGISTRY_OUTPUT_ID = "out-ap-self-callable-registry" as const;
const VERIFY_COMMAND =
  "node runner/src/phase10-ap-independent.ts verify --repository-root . --bundle out/phase10-obligation-preflight-v1-candidate --receipt out/phase10-obligation-preflight-v1-candidate/verification.json" as const;
const PRODUCE_COMMAND =
  "node runner/src/phase10-ap-publish.ts produce --repository-root . --out out/phase10-obligation-preflight-v1-candidate" as const;
const PUBLISH_COMMAND =
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
const CONTROL_IDS = Object.freeze([
  "nc-ap-missing-producer",
  "nc-ap-uncalled-check",
] as const);
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
const CANDIDATE_FILES: Readonly<Record<string, string>> = Object.freeze({
  "out-ap-artifact-index": "artifact-index.json",
  "out-ap-missing-producer-receipt": "missing-producer.json",
  "out-ap-uncalled-check-receipt": "uncalled-check.json",
});

type JsonObject = { readonly [key: string]: StrictJson };
type MutableJsonObject = { [key: string]: StrictJson };

interface Phase10ApMutationWitness {
  readonly artifactId: typeof REGISTRY_OUTPUT_ID;
  readonly path: string;
  readonly byteLength: number;
  readonly sha256: string;
  readonly semanticFingerprint: {
    readonly projection: StrictJson;
    readonly sha256: string;
  };
}

export interface Phase10ApIndependentRequest {
  readonly repositoryRoot: string;
  readonly candidateDirectory: string;
}

interface CapturedOutput {
  readonly outputId: string;
  readonly registeredPath: string;
  readonly localPath: string;
  readonly bytes: Uint8Array;
  readonly value: StrictJson | null;
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
  readonly missingReceipt: JsonObject;
  readonly uncalledReceipt: JsonObject;
  readonly outputs: ReadonlyMap<string, CapturedOutput>;
}

function fail(message: string): never {
  throw new Error(`Phase 10 A-P independent verification refused: ${message}`);
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

function exact(actual: readonly string[], expected: readonly string[], label: string): void {
  if (actual.length !== expected.length || actual.some((entry, index) => entry !== expected[index])) {
    fail(`${label} differs`);
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
  if (text !== `${JSON.stringify(snapshot, null, 2)}\n`) {
    fail(`${label} is not exact two-space JSON with one terminal LF`);
  }
  return snapshot;
}

function prettyJsonBytes(value: unknown): Uint8Array {
  return new TextEncoder().encode(`${JSON.stringify(strictJsonSnapshot(value), null, 2)}\n`);
}

function safeRelativePath(value: string, label: string): string {
  if (
    isAbsolute(value) || value.includes("\\") || value.startsWith("/") || value.endsWith("/") ||
    value.split("/").some((part) => part === "" || part === "." || part === "..")
  ) {
    fail(`${label} is not a safe repository-relative path`);
  }
  return value;
}

function pathWithin(parent: string, child: string): boolean {
  const displacement = relative(parent, child);
  return displacement !== "" && displacement !== ".." && !displacement.startsWith(`..${sep}`) && !isAbsolute(displacement);
}

function safeRoot(value: string): string {
  const root = realpathSync(resolve(value));
  const stat = lstatSync(root);
  if (!stat.isDirectory() || stat.isSymbolicLink()) fail("repository root must be a non-symlink directory");
  return root;
}

function safeCandidate(root: string, value: string): string {
  const candidate = realpathSync(resolve(root, value));
  const stat = lstatSync(candidate);
  if (!stat.isDirectory() || stat.isSymbolicLink() || !pathWithin(root, candidate)) {
    fail("candidate must be a non-symlink directory below the repository root");
  }
  return candidate;
}

function readSafeFile(base: string, relativePath: string, label: string): Uint8Array {
  const path = safeRelativePath(relativePath, label);
  const absolute = resolve(base, path);
  const stat = lstatSync(absolute);
  if (!stat.isFile() || stat.isSymbolicLink()) fail(`${label} must be a regular non-symlink file`);
  const physical = realpathSync(absolute);
  if (relative(base, physical).replaceAll("\\", "/") !== path) {
    fail(`${label} resolves outside or aliases within its root`);
  }
  return new Uint8Array(readFileSync(physical));
}

function output(context: Context, outputId: string): CapturedOutput {
  const value = context.outputs.get(outputId);
  if (value === undefined) fail(`captured output ${outputId} is absent`);
  return value;
}

function capturedOutput(outputs: ReadonlyMap<string, CapturedOutput>, outputId: string): CapturedOutput {
  const value = outputs.get(outputId);
  if (value === undefined) fail(`captured output ${outputId} is absent`);
  return value;
}

function capture(request: Phase10ApIndependentRequest): Context {
  const root = safeRoot(request.repositoryRoot);
  const candidate = safeCandidate(root, request.candidateDirectory);
  const matrixBytes = readSafeFile(root, MATRIX_PATH, "A-P matrix");
  const matrixValue = prettyJson(matrixBytes, "A-P matrix");
  const matrix = parsePhase10ObligationMatrix(matrixValue);
  const protocolBytes = readSafeFile(root, PROTOCOL_PATH, "A-P protocol");
  const registryBytes = readSafeFile(root, REGISTRY_PATH, "A-P registry");
  const protocolValue = prettyJson(protocolBytes, "A-P protocol");
  const registryValue = prettyJson(registryBytes, "A-P registry");
  const captured = new Map<string, CapturedOutput>();
  for (const outputId of PREVERIFICATION_OUTPUT_IDS) {
    const contract = matrix.outputs.find((entry) => entry.packetId === PACKET_ID && entry.outputId === outputId);
    if (contract === undefined || contract.artifact.field !== null) fail(`${outputId} has no whole-file A-P output contract`);
    const candidatePath = CANDIDATE_FILES[outputId];
    const bytes = candidatePath === undefined
      ? readSafeFile(root, contract.artifact.path, outputId)
      : readSafeFile(candidate, candidatePath, outputId);
    const isReadme = outputId === "out-ap-execution-readme";
    captured.set(outputId, Object.freeze({
      outputId,
      registeredPath: contract.artifact.path,
      localPath: candidatePath ?? contract.artifact.path,
      bytes,
      value: isReadme ? null : prettyJson(bytes, outputId),
    }));
  }
  const readme = new TextDecoder("utf-8", { fatal: true }).decode(
    capturedOutput(captured, "out-ap-execution-readme").bytes,
  );
  return Object.freeze({
    root,
    candidate,
    matrixValue,
    matrix,
    protocolValue,
    registryValue,
    foundation: object(capturedOutput(captured, "out-ap-foundation-freeze").value!, "foundation"),
    schemaRegistry: object(capturedOutput(captured, "out-ap-artifact-schema-registry").value!, "schema registry"),
    catalogue: object(capturedOutput(captured, "out-ap-packet-catalogue").value!, "packet catalogue"),
    readme,
    artifactIndex: object(capturedOutput(captured, "out-ap-artifact-index").value!, "artifact index"),
    missingReceipt: object(capturedOutput(captured, "out-ap-missing-producer-receipt").value!, "missing-producer receipt"),
    uncalledReceipt: object(capturedOutput(captured, "out-ap-uncalled-check-receipt").value!, "uncalled-check receipt"),
    outputs: captured,
  });
}

function check(checkId: string, witnesses: readonly string[], action: () => void): Phase10ApCheckResult {
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
    PRODUCE_COMMAND,
    VERIFY_COMMAND,
    PUBLISH_COMMAND,
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

function expectedVerifiedArtifacts(context: Context): readonly Phase10ApVerifiedArtifact[] {
  return Object.freeze(PREVERIFICATION_OUTPUT_IDS.map((outputId) => {
    const artifact = output(context, outputId);
    return Object.freeze({
      outputId,
      path: artifact.registeredPath,
      byteLength: artifact.bytes.byteLength,
      sha256: sha256Bytes(artifact.bytes),
    });
  }));
}

function validateArtifactIndex(context: Context): void {
  exactKeys(context.artifactIndex, ["schema", "bundleId", "artifacts"], "A-P artifact index");
  if (
    context.artifactIndex.schema !== "phase10-artifact-index-v1" ||
    context.artifactIndex.bundleId !== "phase10-obligation-preflight-v1"
  ) {
    fail("A-P artifact-index identity differs");
  }
  const rows = array(context.artifactIndex.artifacts, "A-P artifact-index artifacts")
    .map((entry) => object(entry, "A-P artifact-index entry"));
  exact(rows.map((entry) => String(entry.artifactId)), INDEXED_OUTPUT_IDS, "A-P artifact-index roster/order");
  for (const row of rows) {
    exactKeys(row, ["artifactId", "path", "mediaType", "byteLength", "sha256", "role", "producedBy"], "A-P artifact-index entry");
    const outputId = String(row.artifactId);
    const contract = context.matrix.outputs.find((entry) => entry.packetId === PACKET_ID && entry.outputId === outputId);
    const captured = output(context, outputId);
    if (
      contract === undefined || contract.artifact.field !== null || row.path !== contract.artifact.path ||
      row.byteLength !== captured.bytes.byteLength || row.sha256 !== sha256Bytes(captured.bytes) ||
      row.producedBy !== contract.producerCallableId || row.role !== "obligation-preflight" ||
      row.mediaType !== (contract.artifact.path.endsWith(".md")
        ? "text/markdown; charset=utf-8"
        : "application/json")
    ) {
      fail(`${outputId} artifact-index binding differs from reopened bytes and frozen producer`);
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
  validateArtifactIndex(context);
}

function validateOutputProducers(context: Context): void {
  if (context.matrix.outputs.some((entry) => entry.producerCallableId.length === 0)) {
    fail("matrix contains an output without a producer callable ID");
  }
  if (context.matrix.checks.some((entry) => entry.callerCallableId.length === 0)) {
    fail("matrix contains a check without a caller callable ID");
  }
  const registry = parsePhase10CallableRegistry(context.registryValue);
  const producers = new Map(registry.callables
    .filter((entry) => entry.role === "producer")
    .map((entry) => [entry.callableId, entry.producedOutputIds] as const));
  for (const outputEntry of context.matrix.outputs.filter((entry) => entry.packetId === PACKET_ID)) {
    if (!producers.get(outputEntry.producerCallableId)?.includes(outputEntry.outputId)) {
      fail(`${outputEntry.outputId} is absent from its A-P producer binding`);
    }
  }
}

function catalogueRows(context: Context): readonly JsonObject[] {
  exactKeys(context.catalogue, ["schema", "catalogueId", "matrixId", "packets"], "packet catalogue");
  if (
    context.catalogue.schema !== "phase10-packet-catalogue-v1" ||
    context.catalogue.catalogueId !== "phase10-selected-package-packet-paths-v1" ||
    context.catalogue.matrixId !== context.matrix.matrixId
  ) {
    fail("packet catalogue identity differs");
  }
  return array(context.catalogue.packets, "catalogue packets").map((entry) => object(entry, "catalogue packet"));
}

function validateCatalogue(context: Context): void {
  const rows = catalogueRows(context);
  const expectedIds = context.matrix.packets.map((entry) => entry.packetId);
  exact(expectedIds, [...expectedIds].sort(compareText), "matrix packet order");
  exact(rows.map((row) => String(row.packetId)), expectedIds, "catalogue packet roster/order");
  const allPaths = new Set<string>();
  const attemptRoots = new Set<string>();
  const destinations = new Set<string>();
  for (const row of rows) {
    exactKeys(row, [
      "packetId", "launchClass", "protocolPath", "callableRegistryPath", "attemptRoot",
      "preflightReceiptPath", "terminalReceiptPath", "verificationPaths",
    ], "catalogue packet row");
    const packetId = String(row.packetId);
    const packet = context.matrix.packets.find((entry) => entry.packetId === packetId);
    if (packet === undefined || row.launchClass !== packet.launchClass) fail(`${packetId} catalogue row differs from matrix`);
    const expected = Object.freeze({
      protocolPath: `research/phase10-execution-v1/packets/${packetId}/protocol.json`,
      callableRegistryPath: `research/phase10-execution-v1/packets/${packetId}/callable-registry.json`,
      attemptRoot: `out/phase10-execution-v1/attempts/${packetId}`,
      preflightReceiptPath: `evidence/phase10-obligation-preflight-v1/packets/${packetId}/preflight.json`,
      terminalReceiptPath: `evidence/phase10-obligation-preflight-v1/packets/${packetId}/terminal-receipt.json`,
    });
    for (const [field, expectedPath] of Object.entries(expected)) {
      const path = safeRelativePath(String(row[field]), `${packetId}.${field}`);
      if (path !== expectedPath) fail(`${packetId}.${field} differs from the frozen path convention`);
      if (allPaths.has(path)) fail(`catalogue path ${path} is reused`);
      allPaths.add(path);
      if (field === "attemptRoot") {
        if (attemptRoots.has(path)) fail(`catalogue attempt root ${path} is reused`);
        attemptRoots.add(path);
      }
      if (field === "preflightReceiptPath" || field === "terminalReceiptPath") {
        if (destinations.has(path)) fail(`catalogue output destination ${path} is reused`);
        destinations.add(path);
      }
    }
    const verificationPaths = strings(row.verificationPaths, `${packetId}.verificationPaths`);
    if (verificationPaths.length === 0) fail(`${packetId}.verificationPaths is empty`);
    exact(verificationPaths, [...verificationPaths].sort(compareText), `${packetId}.verificationPaths order`);
    if (new Set(verificationPaths).size !== verificationPaths.length) fail(`${packetId}.verificationPaths contains a duplicate`);
    for (const [index, raw] of verificationPaths.entries()) {
      const path = safeRelativePath(raw, `${packetId}.verificationPaths[${index}]`);
      if (!path.startsWith("evidence/") || !path.endsWith(".json")) {
        fail(`${packetId}.verificationPaths[${index}] is not an evidence JSON destination`);
      }
      if (allPaths.has(path) || destinations.has(path)) fail(`catalogue path ${path} is reused`);
      allPaths.add(path);
      destinations.add(path);
      const matches = context.matrix.outputs.filter((entry) =>
        entry.packetId === packetId && entry.artifact.field === null && entry.artifact.path === path);
      if (matches.length !== 1) fail(`${packetId}.verificationPaths[${index}] does not name one frozen packet output`);
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
  exact(
    protocol.registeredNegativeControlIds,
    context.matrix.negativeControls.filter((entry) => entry.packetId === PACKET_ID)
      .map((entry) => entry.negativeControlId).sort(compareText),
    "A-P negative-control set",
  );
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
  if (
    created.maximumCombinedStagingAndPublicationBytes !== 10 * 1024 ** 3 ||
    created.paidAcquisitionAuthorized !== false || created.sourcePruneAuthorized !== false
  ) {
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
  readonly definitions: Map<string, { readonly kind: string }>;
  readonly availability: Map<string, JsonObject>;
} {
  const definitions = new Map<string, { readonly kind: string }>();
  for (const [field, kind] of [
    ["artifactSchemas", "artifact"], ["schemaAliases", "alias"],
    ["externalSchemaDefinitions", "external"], ["externalSchemaReservations", "reservation"],
  ] as const) {
    for (const raw of array(context.schemaRegistry[field], `schema registry ${field}`)) {
      const row = object(raw, `${field} row`);
      const schemaId = String(row.schemaId);
      if (definitions.has(schemaId)) fail(`schema ${schemaId} is defined more than once`);
      definitions.set(schemaId, { kind });
    }
  }
  const availability = new Map<string, JsonObject>();
  for (const raw of array(context.schemaRegistry.schemaAvailability, "schema availability")) {
    const row = object(raw, "schema availability row");
    const schemaId = String(row.schemaId);
    if (availability.has(schemaId)) fail(`schema availability ${schemaId} is duplicated`);
    availability.set(schemaId, row);
  }
  return { definitions, availability };
}

function validateSchemaCoverage(context: Context): void {
  const schemas = schemaCollections(context);
  exact([...schemas.definitions.keys()].sort(compareText), [...schemas.availability.keys()].sort(compareText), "schema definition/availability set");
  for (const matrixOutput of context.matrix.outputs) {
    if (!schemas.definitions.has(matrixOutput.artifact.schemaId)) fail(`${matrixOutput.outputId} has no schema definition`);
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
      for (const matrixOutput of context.matrix.outputs.filter((entry) => entry.artifact.schemaId === schemaId)) {
        if (!required.includes(matrixOutput.packetId)) fail(`${schemaId} reservation omits packet ${matrixOutput.packetId}`);
      }
    } else if (row.state === "defined") {
      if (definition.kind === "reservation" || required.length !== 0) fail(`${schemaId} defined state differs`);
    } else {
      fail(`${schemaId} has an unknown availability state`);
    }
  }
}

function validateSelfFreeze(context: Context): void {
  const result = phase10ObligationRunPreflight(context.matrixValue, context.protocolValue, context.registryValue, context.root);
  if (result.packetId !== PACKET_ID || result.stage !== "run" || result.unresolvedCallableIds.length !== 0) {
    fail("A-P run preflight did not produce a resolved self-freeze pass");
  }
  if (context.missingReceipt.schema !== "phase10-ap-negative-control-v1" || context.missingReceipt.fixtureId !== "missing-producer" || context.missingReceipt.refused !== true) {
    fail("missing-producer receipt identity/refusal differs");
  }
  if (context.uncalledReceipt.schema !== "phase10-ap-negative-control-v1" || context.uncalledReceipt.fixtureId !== "uncalled-check" || context.uncalledReceipt.refused !== true) {
    fail("uncalled-check receipt identity/refusal differs");
  }
  const registry = parsePhase10CallableRegistry(context.registryValue);
  const modulePaths = [...new Set(registry.callables
    .filter((entry) => entry.resolution === "resolved")
    .map((entry) => entry.modulePath))].sort(compareText);
  for (const modulePath of modulePaths) {
    const attribute = git(context.root, ["check-attr", "text", "--", modulePath]);
    if (attribute !== `${modulePath}: text: unset`) {
      fail(`${modulePath} is not checkout-stable under the required -text attribute`);
    }
  }
}

function structuralResults(context: Context): readonly Phase10ApCheckResult[] {
  const results = Object.freeze([
    check("chk-ap-called-checks", ["out-ap-matrix", "out-ap-self-callable-registry"], () => validateCalledChecks(context)),
    check("chk-ap-command-boundary", ["out-ap-execution-readme"], () => validateCommandBoundary(context)),
    check("chk-ap-conditional-groups", ["out-ap-matrix"], () => validateConditionalGroups(context)),
    check("chk-ap-global-coverage", ["out-ap-artifact-index", "out-ap-matrix"], () => validateGlobalCoverage(context)),
    check("chk-ap-output-producers", ["out-ap-matrix", "out-ap-self-callable-registry"], () => validateOutputProducers(context)),
    check("chk-ap-packet-catalogue", ["out-ap-matrix", "out-ap-packet-catalogue"], () => validateCatalogue(context)),
    check("chk-ap-packet-set-equality", ["out-ap-matrix", "out-ap-packet-catalogue", "out-ap-self-packet-protocol"], () => validatePacketSets(context)),
    check("chk-ap-rights-resource-claim-boundary", ["out-ap-foundation-freeze"], () => validateBoundary(context)),
    check("chk-ap-schema-coverage", ["out-ap-artifact-schema-registry", "out-ap-matrix"], () => validateSchemaCoverage(context)),
    check("chk-ap-schema-promotion", ["out-ap-artifact-schema-registry", "out-ap-matrix"], () => validateSchemaPromotion(context)),
    check("chk-ap-self-freeze", ["out-ap-matrix", "out-ap-missing-producer-receipt", "out-ap-self-callable-registry", "out-ap-self-packet-protocol", "out-ap-uncalled-check-receipt"], () => validateSelfFreeze(context)),
  ]);
  exact(results.map((entry) => entry.checkId), CHECK_IDS, "independent A-P check order");
  return results;
}

function mutableClone(value: StrictJson): MutableJsonObject {
  return object(JSON.parse(JSON.stringify(value)) as StrictJson, "registry clone") as MutableJsonObject;
}

function callableProjection(registryValue: StrictJson): StrictJson {
  const registry = parsePhase10CallableRegistry(registryValue);
  return strictJsonSnapshot({
    callableIds: registry.callables.map((entry) => entry.callableId).sort(compareText),
    producerBindings: registry.callables.filter((entry) => entry.role === "producer")
      .map((entry) => ({ callableId: entry.callableId, producedOutputIds: entry.producedOutputIds }))
      .sort((left, right) => compareText(left.callableId, right.callableId)),
    checkCallerBindings: registry.callables.filter((entry) => entry.role === "check-caller")
      .map((entry) => ({ callableId: entry.callableId, invokedCheckIds: entry.invokedCheckIds }))
      .sort((left, right) => compareText(left.callableId, right.callableId)),
  });
}

function witness(path: string, bytes: Uint8Array, projection: StrictJson): Phase10ApMutationWitness {
  const snapshot = strictJsonSnapshot(projection);
  return Object.freeze({
    artifactId: REGISTRY_OUTPUT_ID,
    path,
    byteLength: bytes.byteLength,
    sha256: sha256Bytes(bytes),
    semanticFingerprint: Object.freeze({
      projection: snapshot,
      sha256: sha256Bytes(canonicalJsonBytes(snapshot)),
    }),
  });
}

function sameJson(left: unknown, right: unknown): boolean {
  return JSON.stringify(strictJsonSnapshot(left)) === JSON.stringify(strictJsonSnapshot(right));
}

function controlResult(
  context: Context,
  controlId: "nc-ap-missing-producer" | "nc-ap-uncalled-check",
): Phase10ApNegativeControlResult {
  const errors: string[] = [];
  let mutationExecuted = false;
  let rejected = false;
  const registryBytes = output(context, REGISTRY_OUTPUT_ID).bytes;
  const mutable = mutableClone(context.registryValue);
  const callables = mutable.callables;
  if (!Array.isArray(callables)) fail("registry callables is not an array");
  const fixtureId = controlId === "nc-ap-missing-producer" ? "missing-producer" : "uncalled-check";
  const afterPath = `out/phase10-execution-v1/attempts/a-p/negative-controls/${fixtureId}/callable-registry.json`;
  let mutation: StrictJson;
  let refusalClass: string;
  let expectedPattern: RegExp;
  if (controlId === "nc-ap-missing-producer") {
    const before = callables.length;
    mutable.callables = callables.filter((entry) => object(entry, "callable entry").callableId !== "phase10-a-p-producer");
    mutationExecuted = mutable.callables.length === before - 1;
    mutation = strictJsonSnapshot({ kind: "remove-callable", callableId: "phase10-a-p-producer" });
    refusalClass = "missing-producer";
    expectedPattern = /callable roster differs|missing producer|has no callable producer/u;
  } else {
    const caller = callables.map((entry) => object(entry, "callable entry") as MutableJsonObject)
      .find((entry) => entry.callableId === "phase10-a-p-check-caller");
    if (caller === undefined || !Array.isArray(caller.invokedCheckIds)) fail("A-P check caller roster is absent");
    const before = caller.invokedCheckIds.length;
    caller.invokedCheckIds = caller.invokedCheckIds.filter((entry) => entry !== "chk-ap-called-checks");
    mutationExecuted = caller.invokedCheckIds.length === before - 1;
    mutation = strictJsonSnapshot({
      kind: "remove-invoked-check",
      callableId: "phase10-a-p-check-caller",
      checkId: "chk-ap-called-checks",
    });
    refusalClass = "uncalled-check";
    expectedPattern = /check-caller obligations differs|uncalled check|is uncalled by/u;
  }
  const mutated = strictJsonSnapshot(mutable);
  const afterBytes = prettyJsonBytes(mutated);
  let refusalMessage = "";
  try {
    phase10ObligationRunPreflight(context.matrixValue, context.protocolValue, mutated, context.root);
    errors.push("mutated registry was accepted by run preflight");
  } catch (error) {
    refusalMessage = error instanceof Error ? error.message : String(error);
    if (expectedPattern.test(refusalMessage)) rejected = true;
    else errors.push(`mutation refused for the wrong reason: ${refusalMessage}`);
  }
  if (!mutationExecuted) errors.push("named mutation did not occur exactly once");
  const beforeWitness = witness(REGISTRY_PATH, registryBytes, callableProjection(context.registryValue));
  const afterWitness = witness(afterPath, afterBytes, callableProjection(mutated));
  const expectedReceipt = strictJsonSnapshot({
    schema: "phase10-ap-negative-control-v1",
    fixtureId,
    mutation,
    beforeWitness,
    afterWitness,
    refused: true,
    error: { refusalClass, message: refusalMessage },
  });
  const observedReceipt = fixtureId === "missing-producer" ? context.missingReceipt : context.uncalledReceipt;
  if (!sameJson(observedReceipt, expectedReceipt)) errors.push(`${fixtureId} candidate receipt differs from independent re-execution`);
  return Object.freeze({
    negativeControlId: controlId,
    mutationExecuted,
    rejected,
    beforeWitness,
    afterWitness,
    errors: Object.freeze([...new Set(errors)].sort(compareText)),
  });
}

/** Re-open every frozen A-P input/candidate byte and independently derive all checks and controls. */
export function independentlyVerifyPhase10ApArtifacts(
  request: Phase10ApIndependentRequest,
): Phase10ApIndependentEvaluation {
  const context = capture(request);
  const preflight = phase10ObligationRunPreflight(context.matrixValue, context.protocolValue, context.registryValue, context.root);
  exact(preflight.outputIds.filter((id) => id !== "out-ap-verification" && id !== "out-ap-self-execution-receipt"), PREVERIFICATION_OUTPUT_IDS, "A-P independently reopened output roster");
  exact(preflight.checkIds, CHECK_IDS, "A-P independently evaluated check roster");
  exact(preflight.negativeControlIds, CONTROL_IDS, "A-P independently executed control roster");
  const checkResults = structuralResults(context);
  const negativeControlResults = Object.freeze(CONTROL_IDS.map((id) => controlResult(context, id)));
  const verdict = checkResults.every((entry) => entry.verdict === "pass") &&
    negativeControlResults.every((entry) => entry.mutationExecuted && entry.rejected && entry.errors.length === 0)
    ? "pass"
    : "fail";
  return Object.freeze({
    verdict,
    verifiedArtifacts: expectedVerifiedArtifacts(context),
    checkResults,
    executedNegativeControlIds: CONTROL_IDS,
    negativeControlResults,
  });
}

function git(repositoryRoot: string, args: readonly string[]): string {
  const result = spawnSync("git", args, { cwd: repositoryRoot, encoding: "utf8" });
  if (result.error !== undefined || result.status !== 0) {
    fail(`git ${args.join(" ")} failed: ${(result.stderr || result.error?.message || "unknown error").trim()}`);
  }
  return result.stdout.trim();
}

function cliArguments(argv: readonly string[]): Phase10ApIndependentRequest & { readonly receipt: string } {
  if (argv[0] !== "verify") fail("expected verify subcommand");
  const values = new Map<string, string>();
  for (let index = 1; index < argv.length; index += 2) {
    const flag = argv[index];
    const value = argv[index + 1];
    if (flag === undefined || value === undefined || !flag.startsWith("--") || values.has(flag)) fail("CLI flags differ");
    values.set(flag, value);
  }
  if (
    values.size !== 3 || !values.has("--repository-root") || !values.has("--bundle") ||
    !values.has("--receipt") || argv.join(" ") !== VERIFY_COMMAND.slice("node runner/src/phase10-ap-independent.ts ".length)
  ) {
    fail("verify command differs from the frozen command");
  }
  return Object.freeze({
    repositoryRoot: values.get("--repository-root")!,
    candidateDirectory: values.get("--bundle")!,
    receipt: values.get("--receipt")!,
  });
}

function main(): void {
  const request = cliArguments(process.argv.slice(2));
  const root = safeRoot(request.repositoryRoot);
  if (process.version !== EXPECTED_RUNTIME) fail(`runtime ${process.version} differs from ${EXPECTED_RUNTIME}`);
  const branch = git(root, ["branch", "--show-current"]);
  if (branch !== EXPECTED_BRANCH) fail(`branch ${branch} differs from ${EXPECTED_BRANCH}`);
  if (git(root, ["status", "--porcelain=v1", "--untracked-files=all"]).length !== 0) {
    fail("independent verification requires a clean worktree");
  }
  const gitHead = git(root, ["rev-parse", "HEAD"]);
  if (!/^[0-9a-f]{40}$/u.test(gitHead)) fail("Git head is not a lowercase 40-character hash");
  const expectedReceipt = resolve(root, request.candidateDirectory, "verification.json");
  if (resolve(root, request.receipt) !== expectedReceipt) fail("receipt path is not the registered candidate-local verification path");
  const startedOn = new Date().toISOString();
  const evaluation = independentlyVerifyPhase10ApArtifacts(request);
  const endedOn = new Date().toISOString();
  const receipt = writePhase10PacketVerificationReceipt({
    repositoryRoot: root,
    candidateDirectory: request.candidateDirectory,
    evaluation,
    command: VERIFY_COMMAND,
    gitHead,
    startedOn,
    endedOn,
  });
  process.stdout.write(`${JSON.stringify({ state: "verified", verdict: receipt.aggregateVerdict, path: request.receipt })}\n`);
  if (receipt.aggregateVerdict !== "pass") process.exitCode = 1;
}

const invoked = process.argv[1];
if (invoked !== undefined && import.meta.url === pathToFileURL(resolve(invoked)).href) {
  try {
    main();
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}

export const PHASE10_AP_VERIFY_COMMAND = VERIFY_COMMAND;
