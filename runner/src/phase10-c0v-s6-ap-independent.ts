import { createHash } from "node:crypto";
import { lstatSync, readFileSync, realpathSync } from "node:fs";
import { isAbsolute, relative, resolve, sep } from "node:path";
import { strictJsonSnapshot, type StrictJson } from "./gate4-evidence.ts";
import { phase10C0VS6CanonicalSemanticSha256 } from "./phase10-c0v-s6-semantic-fingerprint.ts";
import { parsePhase10ObligationMatrix, type Phase10ObligationMatrix } from "./phase10-contracts.ts";
import {
  PHASE10_C0V_S6_PACKET_IDS,
  PHASE10_C0V_S6_RECOVERY_V5_ATTEMPT_IDS,
  PHASE10_C0V_S6_RECOVERY_V5_ATTEMPT_ROOT,
  PHASE10_C0V_S6_RECOVERY_V5_AUTHORITY_PATH,
  PHASE10_C0V_S6_RECOVERY_V5_AUTHORITY_ROOT,
  PHASE10_C0V_S6_RECOVERY_V5_PACKAGE_LOCK_PATH,
  PHASE10_C0V_S6_RECOVERY_V5_PACKET_CATALOGUE_PATH,
  PHASE10_C0V_S6_RECOVERY_V6_ATTEMPT_IDS,
  PHASE10_C0V_S6_RECOVERY_V6_ATTEMPT_ROOT,
  PHASE10_C0V_S6_RECOVERY_V6_AUTHORITY_PATH,
  PHASE10_C0V_S6_RECOVERY_V6_AUTHORITY_ROOT,
  PHASE10_C0V_S6_RECOVERY_V6_PACKAGE_LOCK_PATH,
  PHASE10_C0V_S6_RECOVERY_V6_PACKET_CATALOGUE_PATH,
  PHASE10_C0V_S6_RECOVERY_V6_PREDECESSOR_IMPLEMENTATION_FREEZE_COMMIT,
  assertPhase10C0VS6ArtifactSchemaRegistryMatrixParity,
  parsePhase10C0VS6ArtifactSchemaRegistry,
  parsePhase10C0VS6CallableRegistry,
  parsePhase10C0VS6Matrix,
  parsePhase10C0VS6PacketCatalogue,
  parsePhase10C0VS6PacketProtocol,
  parsePhase10C0VS6PrettyJsonBytes,
  parsePhase10C0VS6RecoveryV5Authority,
  parsePhase10C0VS6RecoveryV6Authority,
  type Phase10C0VS6ArtifactIdentity,
  type Phase10C0VS6ArtifactSchemaRegistry,
  type Phase10C0VS6CallableRegistry,
  type Phase10C0VS6ObligationMatrix,
  type Phase10C0VS6PacketCatalogue,
  type Phase10C0VS6PacketId,
  type Phase10C0VS6PacketProtocol,
  type Phase10C0VS6RecoveryV5Authority,
  type Phase10C0VS6RecoveryV6Authority,
} from "./phase10-c0v-s6-contracts.ts";
import {
  phase10C0VS6AssertBuiltinAllowlistRegistryCoverage,
  phase10C0VS6AssertCallableRegistration,
} from "./phase10-c0v-s6-import-audit.ts";
import type { Phase10C0VS6ApNegativeControlReceipt } from "./phase10-c0v-s6-ap-negative-controls.ts";

export const PHASE10_C0V_S6_AP_CHECK_IDS = Object.freeze([
  "chk-ap-c0v-s6-authority-bindings",
  "chk-ap-c0v-s6-branch-routes",
  "chk-ap-c0v-s6-callable-resolution",
  "chk-ap-c0v-s6-called-checks",
  "chk-ap-c0v-s6-original-ap-binding",
  "chk-ap-c0v-s6-output-producers",
  "chk-ap-c0v-s6-override-scope",
  "chk-ap-c0v-s6-packet-catalogue",
  "chk-ap-c0v-s6-resource-contracts",
  "chk-ap-c0v-s6-schema-delta",
] as const);

export type Phase10C0VS6ApCheckId = (typeof PHASE10_C0V_S6_AP_CHECK_IDS)[number];

export interface Phase10C0VS6ApCheckResult {
  readonly checkId: Phase10C0VS6ApCheckId;
  readonly evaluatorCallableId: "phase10-a-p-c0v-s6-evaluator";
  readonly verdict: "pass" | "fail";
  readonly witnesses: readonly string[];
  readonly errors: readonly string[];
}

export interface Phase10C0VS6ApIndependentEvaluation {
  readonly schema: "phase10-c0v-s6-ap-independent-evaluation-v1";
  readonly matrixId: "phase10-c0v-s6-obligations-v1";
  readonly packetId: "a-p-c0v-s6";
  readonly checkResults: readonly Phase10C0VS6ApCheckResult[];
  readonly negativeControlReproofs: readonly Phase10C0VS6ApNegativeControlReproof[];
  readonly aggregateVerdict: "pass" | "fail";
  readonly errors: readonly string[];
}

export interface Phase10C0VS6ApNegativeControlReproof {
  readonly fixtureId: "missing-producer" | "uncalled-check";
  readonly negativeControlId: "nc-ap-c0v-s6-missing-producer" | "nc-ap-c0v-s6-uncalled-check";
  readonly ownerCheckId: "chk-ap-c0v-s6-output-producers" | "chk-ap-c0v-s6-called-checks";
  readonly mutatedRegistry: Phase10C0VS6ArtifactIdentity;
  readonly failingCheckIds: readonly Phase10C0VS6ApCheckId[];
  readonly verdict: "pass";
}

export interface Phase10C0VS6ApAuthorityOverrides {
  readonly matrix?: unknown;
  readonly catalogue?: unknown;
  readonly successorSchemaRegistry?: unknown;
  readonly predecessorSchemaRegistry?: unknown;
  readonly originalMatrix?: unknown;
  readonly protocols?: Partial<Record<Phase10C0VS6PacketId, unknown>>;
  readonly callableRegistries?: Partial<Record<Phase10C0VS6PacketId, unknown>>;
}

export interface Phase10C0VS6ApGraphRequest {
  readonly repositoryRoot: string;
  readonly overrides?: Phase10C0VS6ApAuthorityOverrides;
  /** Final packet execution sets this true. Mutation campaigns set it false to isolate graph errors. */
  readonly requireResolvedCallables?: boolean;
  /** Retained accepted A-P evidence explicitly reopens its own recovery-v5 authority graph. */
  readonly authorityGeneration?: "current" | "historical-predecessor-ap";
}

export interface Phase10C0VS6ApIndependentRequest extends Phase10C0VS6ApGraphRequest {
  readonly negativeControlReceiptBytes: {
    readonly missingProducer: Uint8Array;
    readonly uncalledCheck: Uint8Array;
  };
}

interface CapturedAuthority {
  readonly root: string;
  readonly authorityRoot: string;
  readonly packageLockPath: string;
  readonly historicalFreezeArtifacts: ReadonlyMap<string, Phase10C0VS6ArtifactIdentity> | null;
  readonly matrix: Phase10C0VS6ObligationMatrix;
  readonly matrixValue: StrictJson;
  readonly matrixIdentity: Phase10C0VS6ArtifactIdentity;
  readonly originalMatrix: Phase10ObligationMatrix;
  readonly catalogue: Phase10C0VS6PacketCatalogue;
  readonly catalogueIdentity: Phase10C0VS6ArtifactIdentity;
  readonly recoveryAuthority: Phase10C0VS6RecoveryV5Authority | Phase10C0VS6RecoveryV6Authority;
  readonly recoveryAuthorityIdentity: Phase10C0VS6ArtifactIdentity;
  readonly successorSchemaRegistry: Phase10C0VS6ArtifactSchemaRegistry;
  readonly predecessorSchemaRegistryValue: StrictJson;
  readonly protocols: ReadonlyMap<Phase10C0VS6PacketId, Phase10C0VS6PacketProtocol>;
  readonly protocolValues: ReadonlyMap<Phase10C0VS6PacketId, StrictJson>;
  readonly registries: ReadonlyMap<Phase10C0VS6PacketId, Phase10C0VS6CallableRegistry>;
  readonly registryValues: ReadonlyMap<Phase10C0VS6PacketId, StrictJson>;
  readonly requireResolvedCallables: boolean;
}

type JsonObject = { readonly [key: string]: StrictJson };

function fail(message: string): never {
  throw new Error(`Phase 10 C0V S6 supplemental A-P refused: ${message}`);
}

function codePointCompare(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function jsonObject(value: StrictJson, label: string): JsonObject {
  if (value === null || Array.isArray(value) || typeof value !== "object") fail(`${label} must be an object`);
  return value as JsonObject;
}

function jsonArray(value: StrictJson | undefined, label: string): readonly StrictJson[] {
  if (!Array.isArray(value)) fail(`${label} must be an array`);
  return value;
}

function stringArray(value: StrictJson | undefined, label: string): readonly string[] {
  const rows = jsonArray(value, label);
  if (rows.some((entry) => typeof entry !== "string")) fail(`${label} must contain strings`);
  return rows as readonly string[];
}

function sameStrings(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((entry, index) => entry === right[index]);
}

function physicalRoot(value: string): string {
  const requested = resolve(value);
  const requestedStat = lstatSync(requested);
  if (!requestedStat.isDirectory() || requestedStat.isSymbolicLink()) {
    fail("repository root must be an unaliased directory");
  }
  const physical = realpathSync(requested);
  if (relative(requested, physical) !== "" || relative(physical, requested) !== "") {
    fail("repository root must be an unaliased directory");
  }
  return physical;
}

function safePath(value: string, label: string): string {
  if (isAbsolute(value) || value.includes("\\") || value.startsWith("/") || value.endsWith("/") ||
    value.split("/").some((segment) => segment === "" || segment === "." || segment === "..")) {
    fail(`${label} is not a safe repository-relative path`);
  }
  return value;
}

function readBytes(root: string, path: string, label: string): Uint8Array {
  const relativePath = safePath(path, label);
  const absolute = resolve(root, relativePath);
  const stat = lstatSync(absolute);
  if (!stat.isFile() || stat.isSymbolicLink() || stat.nlink !== 1) {
    fail(`${label} must be a unique regular file`);
  }
  const physical = realpathSync(absolute);
  const displacement = relative(root, physical);
  if (displacement === "" || displacement === ".." || displacement.startsWith(`..${sep}`) ||
    isAbsolute(displacement) || relative(absolute, physical) !== "" || relative(physical, absolute) !== "") {
    fail(`${label} resolves outside or aliases within the repository`);
  }
  return new Uint8Array(readFileSync(physical));
}

function sha256(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

function identity(path: string, bytes: Uint8Array): Phase10C0VS6ArtifactIdentity {
  return Object.freeze({ path, byteLength: bytes.byteLength, sha256: sha256(bytes) });
}

function sameIdentity(left: Phase10C0VS6ArtifactIdentity, right: Phase10C0VS6ArtifactIdentity): boolean {
  return left.path === right.path && left.byteLength === right.byteLength && left.sha256 === right.sha256;
}

function loadJson(root: string, path: string, override: unknown, label: string): StrictJson {
  if (override !== undefined) return strictJsonSnapshot(override);
  return parsePhase10C0VS6PrettyJsonBytes(readBytes(root, path, label), label);
}

function capture(request: Phase10C0VS6ApGraphRequest): CapturedAuthority {
  const root = physicalRoot(request.repositoryRoot);
  const overrides = request.overrides ?? {};
  const historical = request.authorityGeneration === "historical-predecessor-ap";
  const cataloguePath = historical
    ? PHASE10_C0V_S6_RECOVERY_V5_PACKET_CATALOGUE_PATH
    : PHASE10_C0V_S6_RECOVERY_V6_PACKET_CATALOGUE_PATH;
  const authorityPath = historical
    ? PHASE10_C0V_S6_RECOVERY_V5_AUTHORITY_PATH
    : PHASE10_C0V_S6_RECOVERY_V6_AUTHORITY_PATH;
  const authorityRoot = historical
    ? PHASE10_C0V_S6_RECOVERY_V5_AUTHORITY_ROOT
    : PHASE10_C0V_S6_RECOVERY_V6_AUTHORITY_ROOT;
  const packageLockPath = historical
    ? PHASE10_C0V_S6_RECOVERY_V5_PACKAGE_LOCK_PATH
    : PHASE10_C0V_S6_RECOVERY_V6_PACKAGE_LOCK_PATH;
  const matrixPath = "research/phase10-c0v-s6-obligation-matrix-v1.json";
  const matrixBytes = readBytes(root, matrixPath, "S6 obligation matrix");
  const matrixValue = loadJson(root, matrixPath, overrides.matrix, "S6 obligation matrix");
  const matrix = parsePhase10C0VS6Matrix(matrixValue);
  const catalogueBytes = readBytes(root, cataloguePath, "S6 packet catalogue");
  const catalogue = parsePhase10C0VS6PacketCatalogue(loadJson(
    root, cataloguePath, overrides.catalogue, "S6 packet catalogue",
  ));
  const recoveryAuthorityBytes = readBytes(
    root,
    authorityPath,
    "S6 recovery authority",
  );
  const recoveryAuthorityValue = parsePhase10C0VS6PrettyJsonBytes(recoveryAuthorityBytes, "S6 recovery authority");
  const recoveryAuthority = historical
    ? parsePhase10C0VS6RecoveryV5Authority(recoveryAuthorityValue)
    : parsePhase10C0VS6RecoveryV6Authority(recoveryAuthorityValue);
  const originalMatrix = parsePhase10ObligationMatrix(loadJson(
    root,
    "research/phase10-obligation-matrix-v1.json",
    overrides.originalMatrix,
    "original obligation matrix",
  ));
  const predecessorSchemaRegistryValue = loadJson(
    root,
    "research/phase10-c0v-artifact-schema-registry-v1.json",
    overrides.predecessorSchemaRegistry,
    "predecessor artifact schema registry",
  );
  const successorSchemaRegistry = parsePhase10C0VS6ArtifactSchemaRegistry(loadJson(
    root,
    "research/phase10-c0v-s6-artifact-schema-registry-v1.json",
    overrides.successorSchemaRegistry,
    "successor artifact schema registry",
  ));
  const protocols = new Map<Phase10C0VS6PacketId, Phase10C0VS6PacketProtocol>();
  const protocolValues = new Map<Phase10C0VS6PacketId, StrictJson>();
  const registries = new Map<Phase10C0VS6PacketId, Phase10C0VS6CallableRegistry>();
  const registryValues = new Map<Phase10C0VS6PacketId, StrictJson>();
  for (const packetId of PHASE10_C0V_S6_PACKET_IDS) {
    const protocolPath = `${authorityRoot}/packets/${packetId}/protocol.json`;
    const registryPath = `${authorityRoot}/packets/${packetId}/callable-registry.json`;
    const protocolValue = loadJson(root, protocolPath, overrides.protocols?.[packetId], `${packetId} protocol`);
    const registryValue = loadJson(
      root, registryPath, overrides.callableRegistries?.[packetId], `${packetId} callable registry`,
    );
    protocolValues.set(packetId, protocolValue);
    registryValues.set(packetId, registryValue);
    protocols.set(packetId, parsePhase10C0VS6PacketProtocol(protocolValue));
    registries.set(packetId, parsePhase10C0VS6CallableRegistry(registryValue));
  }
  let historicalFreezeArtifacts: ReadonlyMap<string, Phase10C0VS6ArtifactIdentity> | null = null;
  if (historical) {
    const apPacket = protocols.get("a-p-c0v-s6")!;
    const preflight = jsonObject(loadJson(
      root,
      apPacket.paths.preflightReceiptPath,
      undefined,
      "accepted A-P retained preflight",
    ), "accepted A-P retained preflight");
    const observed = jsonObject(preflight.observed, "accepted A-P retained preflight observed");
    const codeFreeze = jsonObject(observed.codeFreeze, "accepted A-P retained preflight codeFreeze");
    if (codeFreeze.commit !== PHASE10_C0V_S6_RECOVERY_V6_PREDECESSOR_IMPLEMENTATION_FREEZE_COMMIT) {
      fail("accepted A-P retained preflight freeze commit differs from recovery-v6 authority");
    }
    const identities = jsonArray(codeFreeze.artifacts, "accepted A-P retained preflight freeze artifacts")
      .map((entry, index) => bindingIdentity(
        entry,
        `accepted A-P retained preflight freeze artifact[${index}]`,
      ));
    if (new Set(identities.map((entry) => entry.path)).size !== identities.length) {
      fail("accepted A-P retained preflight freeze artifacts repeat a path");
    }
    historicalFreezeArtifacts = new Map(identities.map((entry) => [entry.path, entry]));
  }
  return Object.freeze({
    root,
    authorityRoot,
    packageLockPath,
    historicalFreezeArtifacts,
    matrix,
    matrixValue,
    matrixIdentity: identity(matrixPath, matrixBytes),
    originalMatrix,
    catalogue,
    catalogueIdentity: identity(cataloguePath, catalogueBytes),
    recoveryAuthority,
    recoveryAuthorityIdentity: identity(authorityPath, recoveryAuthorityBytes),
    successorSchemaRegistry,
    predecessorSchemaRegistryValue,
    protocols,
    protocolValues,
    registries,
    registryValues,
    requireResolvedCallables: request.requireResolvedCallables !== false,
  });
}

function bindingIdentity(value: StrictJson | undefined, label: string): Phase10C0VS6ArtifactIdentity {
  const row = jsonObject(value as StrictJson, label);
  if (typeof row.path !== "string" || typeof row.byteLength !== "number" || typeof row.sha256 !== "string") {
    fail(`${label} is not an artifact identity`);
  }
  return Object.freeze({ path: row.path, byteLength: row.byteLength, sha256: row.sha256 });
}

function validateLiveIdentity(context: CapturedAuthority, artifact: Phase10C0VS6ArtifactIdentity, label: string): void {
  const actual = identity(artifact.path, readBytes(context.root, artifact.path, label));
  if (!sameIdentity(actual, artifact)) fail(`${label} bytes differ from the frozen identity`);
}

function validateAuthorityBindings(context: CapturedAuthority): readonly string[] {
  const bindings = jsonObject(context.matrix.bindings, "matrix.bindings");
  const singletonNames = [
    "originalMatrix", "c0vFoundation", "predecessorSchemaRegistry", "predecessorSchemaContracts",
    "successorSchemaRegistry", "successorSchemaContracts",
  ] as const;
  for (const name of singletonNames) validateLiveIdentity(context, bindingIdentity(bindings[name], `matrix.bindings.${name}`), name);
  for (const [index, entry] of jsonArray(bindings.originalApEvidence, "matrix.bindings.originalApEvidence").entries()) {
    validateLiveIdentity(context, bindingIdentity(entry, `matrix.bindings.originalApEvidence[${index}]`), `original A-P evidence ${index}`);
  }
  if (context.catalogue.recoveryAuthority === undefined ||
    !sameIdentity(context.catalogue.recoveryAuthority, context.recoveryAuthorityIdentity)) {
    fail("packet catalogue does not bind the exact live recovery authority");
  }
  if (context.recoveryAuthority.successor.packetCatalogueId !== context.catalogue.catalogueId ||
    context.recoveryAuthority.successor.packetCataloguePath !== context.catalogueIdentity.path) {
    fail("recovery authority successor catalogue does not identify the active catalogue");
  }
  for (const packetId of PHASE10_C0V_S6_PACKET_IDS) {
    const protocol = context.protocols.get(packetId)!;
    const registry = context.registries.get(packetId)!;
    if (!sameIdentity(protocol.bindings.matrix, context.matrixIdentity) ||
      !sameIdentity(protocol.bindings.packetCatalogue, context.catalogueIdentity) ||
      protocol.registryId !== registry.registryId || registry.protocolId !== protocol.protocolId ||
      registry.packetId !== packetId || protocol.bindings.recoveryAuthority === undefined ||
      !sameIdentity(protocol.bindings.recoveryAuthority, context.recoveryAuthorityIdentity)) {
      fail(`${packetId} protocol/registry authority binding differs`);
    }
    const registryPath = `${context.authorityRoot}/packets/${packetId}/callable-registry.json`;
    const registryBytes = readBytes(context.root, registryPath, `${packetId} live registry`);
    if (!sameIdentity(protocol.bindings.callableRegistry, identity(registryPath, registryBytes))) {
      fail(`${packetId} protocol does not bind its exact live callable registry`);
    }
  }
  return Object.freeze([
    "matrix-bindings",
    "recovery-authority-binding",
    "all-eight-protocol-bindings",
    "all-eight-registry-bindings",
  ]);
}

function overrideObject(context: CapturedAuthority): JsonObject {
  return jsonObject(context.matrix.overridePolicy, "matrix.overridePolicy");
}

function validateBranchRoutes(context: CapturedAuthority): readonly string[] {
  for (const layer of context.matrix.s5Layers) {
    const selected = context.matrix.routes.filter((route) => route.routeId === layer.selectedRouteId);
    if (selected.length !== 1 || selected[0]!.active !== true ||
      selected[0]!.selectedByDisposition !== layer.s5ArtifactDisposition) {
      fail(`${layer.layerId} selected route is not the unique active route for its frozen disposition`);
    }
  }
  const radialDiscrepancy = context.matrix.routes.filter((route) =>
    route.routeId === "route-c0v-radial-discrepancy-match-only");
  if (radialDiscrepancy.length !== 1 || radialDiscrepancy[0]!.active !== false ||
    radialDiscrepancy[0]!.inactiveReason === null) {
    fail("the preserved radial discrepancy route is absent or selectable");
  }
  for (const route of context.matrix.routes.filter((entry) => entry.terminalSubroutes !== null)) {
    const dispositions = route.terminalSubroutes!.map((entry) => entry.dispositionCode);
    if (!sameStrings(dispositions, route.allowedAttemptDispositionCodes)) {
      fail(`${route.routeId} terminal subroutes differ from its exact disposition roster`);
    }
  }
  const policy = overrideObject(context);
  const inactive = new Set([
    ...stringArray(policy.inactiveOriginalOutputIds, "inactiveOriginalOutputIds"),
    ...stringArray(policy.inactiveOriginalCheckIds, "inactiveOriginalCheckIds"),
    ...stringArray(policy.inactiveOriginalNegativeControlIds, "inactiveOriginalNegativeControlIds"),
  ]);
  const current = new Set([
    ...context.matrix.outputs.map((entry) => entry.outputId),
    ...context.matrix.checks.map((entry) => entry.checkId),
    ...context.matrix.negativeControls.map((entry) => entry.negativeControlId),
  ]);
  const overridden = new Set(stringArray(policy.overriddenPacketIds, "overriddenPacketIds"));
  const originalDefinitions = [
    ...context.originalMatrix.outputs.filter((entry) => overridden.has(entry.packetId)).map((entry) => entry.outputId),
    ...context.originalMatrix.checks.filter((entry) => overridden.has(entry.packetId)).map((entry) => entry.checkId),
    ...context.originalMatrix.negativeControls.filter((entry) => overridden.has(entry.packetId)).map((entry) => entry.negativeControlId),
  ];
  for (const definitionId of originalDefinitions) {
    const active = current.has(definitionId);
    const inactiveDefinition = inactive.has(definitionId);
    if (active === inactiveDefinition) fail(`original definition ${definitionId} is not conserved exactly once`);
  }
  if ([...inactive].some((definitionId) => !originalDefinitions.includes(definitionId))) {
    fail("inactive-original roster contains a non-original definition");
  }
  return Object.freeze(["selected-route-triad", "preserved-radial-discrepancy-route", "original-definition-partition"]);
}

function allCallables(context: CapturedAuthority): readonly Phase10C0VS6CallableRegistry["callables"][number][] {
  return Object.freeze([...context.registries.values()].flatMap((registry) => [...registry.callables]));
}

function validateCallableResolution(context: CapturedAuthority): readonly string[] {
  const callables = allCallables(context);
  phase10C0VS6AssertBuiltinAllowlistRegistryCoverage(callables.map((entry) => entry.callableId));
  if (context.requireResolvedCallables) {
    for (const callable of callables) {
      if (callable.resolution !== "resolved" || callable.identity === null) {
        fail(`${callable.callableId} is not resolved`);
      }
      const registeredIdentity = Object.freeze({ path: callable.modulePath, ...callable.identity });
      if (context.historicalFreezeArtifacts === null) {
        phase10C0VS6AssertCallableRegistration(context.root, {
          callableId: callable.callableId,
          modulePath: callable.modulePath,
          exportName: callable.exportName,
          identity: registeredIdentity,
        });
      } else {
        const frozenIdentity = context.historicalFreezeArtifacts.get(callable.modulePath) ??
          fail(`${callable.callableId} module is absent from the accepted A-P code freeze`);
        if (!sameIdentity(frozenIdentity, registeredIdentity)) {
          fail(`${callable.callableId} registry identity differs from the accepted A-P code freeze`);
        }
      }
    }
  }
  return Object.freeze([
    "exact-callable-union",
    context.requireResolvedCallables ? "all-live-import-audits" : "mutation-structural-mode",
  ]);
}

function validateCalledChecks(context: CapturedAuthority): readonly string[] {
  for (const check of context.matrix.checks) {
    const registry = context.registries.get(check.packetId)!;
    const callers = registry.callables.filter((entry) => entry.callableId === check.callerCallableId &&
      entry.role === "check-caller" && entry.invokedCheckIds.includes(check.checkId));
    const evaluators = registry.callables.filter((entry) => entry.callableId === check.independentEvaluatorCallableId &&
      entry.role === "independent-evaluator" && entry.evaluatedCheckIds.includes(check.checkId));
    if (callers.length !== 1 || evaluators.length !== 1) fail(`registered check ${check.checkId} is uncalled or unevaluated`);
  }
  for (const [packetId, registry] of context.registries) {
    const packetCheckIds = new Set(context.matrix.checks.filter((entry) => entry.packetId === packetId).map((entry) => entry.checkId));
    for (const callable of registry.callables) {
      for (const checkId of [...callable.invokedCheckIds, ...callable.evaluatedCheckIds]) {
        if (!packetCheckIds.has(checkId)) fail(`${callable.callableId} names phantom or foreign check ${checkId}`);
      }
    }
  }
  return Object.freeze(["every-check-called-once", "every-check-evaluated-once", "no-phantom-check-registrations"]);
}

function validateOriginalApBinding(context: CapturedAuthority): readonly string[] {
  const bindings = jsonObject(context.matrix.bindings, "matrix.bindings");
  const original = bindingIdentity(bindings.originalMatrix, "matrix.bindings.originalMatrix");
  if (original.path !== "research/phase10-obligation-matrix-v1.json" ||
    context.originalMatrix.matrixId !== "phase10-selected-package-obligations-v1") {
    fail("original A-P matrix binding differs");
  }
  const evidence = jsonArray(bindings.originalApEvidence, "matrix.bindings.originalApEvidence").map((entry, index) =>
    bindingIdentity(entry, `originalApEvidence[${index}]`));
  const expectedPaths = [
    "evidence/phase10-obligation-preflight-v1/artifact-index.json",
    "evidence/phase10-obligation-preflight-v1/missing-producer.json",
    "evidence/phase10-obligation-preflight-v1/packets/a-p/preflight.json",
    "evidence/phase10-obligation-preflight-v1/packets/a-p/terminal-receipt.json",
    "evidence/phase10-obligation-preflight-v1/uncalled-check.json",
    "evidence/phase10-obligation-preflight-v1/verification.json",
  ];
  if (!sameStrings(evidence.map((entry) => entry.path), expectedPaths)) fail("original A-P evidence roster differs");
  return Object.freeze(["original-matrix", "original-six-artifacts"]);
}

function validateOutputProducers(context: CapturedAuthority): readonly string[] {
  for (const output of context.matrix.outputs) {
    const registry = context.registries.get(output.packetId)!;
    const producers = registry.callables.filter((entry) =>
      (entry.role === "producer" || entry.role === "negative-control") &&
      entry.callableId === output.producerCallableId && entry.producedOutputIds.includes(output.outputId));
    if (producers.length !== 1) fail(`output ${output.outputId} has no callable producer ${output.producerCallableId}`);
  }
  for (const [packetId, registry] of context.registries) {
    for (const callable of registry.callables) {
      for (const outputId of callable.producedOutputIds) {
        const definitions = context.matrix.outputs.filter((entry) => entry.packetId === packetId &&
          entry.outputId === outputId && entry.producerCallableId === callable.callableId);
        if (definitions.length !== 1) fail(`${callable.callableId} produces phantom or foreign output ${outputId}`);
      }
    }
  }
  return Object.freeze(["every-output-produced-once", "no-phantom-output-registrations"]);
}

function validateOverrideScope(context: CapturedAuthority): readonly string[] {
  const policy = overrideObject(context);
  const overridden = stringArray(policy.overriddenPacketIds, "overriddenPacketIds");
  const added = stringArray(policy.addedPacketIds, "addedPacketIds");
  const expectedOverridden = [
    "c0v-aggregate", "c0v-moving-produce", "c0v-moving-publish", "c0v-radial-produce",
    "c0v-radial-publish", "c0v-static-produce", "c0v-static-publish",
  ];
  if (!sameStrings(overridden, expectedOverridden) || !sameStrings(added, ["a-p-c0v-s6"])) {
    fail("packet override/addition scope differs");
  }
  const replacements = jsonArray(policy.schemaReplacements, "schemaReplacements");
  if (replacements.length !== 4) fail("schema replacement scope must contain exactly four rows");
  return Object.freeze(["seven-overridden-packets", "one-added-packet", "four-schema-replacements"]);
}

function overlaps(left: string, right: string): boolean {
  return left === right || left.startsWith(`${right}/`) || right.startsWith(`${left}/`);
}

function validatePacketCatalogue(context: CapturedAuthority): readonly string[] {
  if (context.catalogue.packageLockPath !== context.packageLockPath) {
    fail("catalogue package lock differs");
  }
  const attemptRoots = context.catalogue.packets.map((entry) => entry.attemptRoot);
  const packetLocks = context.catalogue.packets.map((entry) => entry.lockPath);
  for (let left = 0; left < attemptRoots.length; left += 1) {
    for (let right = left + 1; right < attemptRoots.length; right += 1) {
      if (overlaps(attemptRoots[left]!, attemptRoots[right]!)) fail("catalogue attempt roots overlap");
    }
  }
  if (new Set(packetLocks).size !== packetLocks.length || packetLocks.includes(context.catalogue.packageLockPath)) {
    fail("packet/package lock mappings collide");
  }
  const allFinals: string[] = [];
  const allStages: string[] = [];
  for (const catalogueRow of context.catalogue.packets) {
    const protocol = context.protocols.get(catalogueRow.packetId)!;
    if (protocol.paths.attemptRoot !== catalogueRow.attemptRoot ||
      protocol.paths.lockPath !== catalogueRow.lockPath ||
      protocol.paths.preflightReceiptPath !== catalogueRow.preflightReceiptPath ||
      protocol.paths.terminalReceiptPath !== catalogueRow.terminalReceiptPath ||
      protocol.paths.packageLockPath !== context.catalogue.packageLockPath) {
      fail(`${catalogueRow.packetId} protocol/catalogue path mapping differs`);
    }
    allFinals.push(...protocol.paths.publicationStagingPaths.map((entry) => entry.finalPath));
    allStages.push(...protocol.paths.publicationStagingPaths.map((entry) => entry.stagingPath));
    if (protocol.paths.publicationStagingPaths.some((entry) =>
      entry.finalPath.startsWith(`${protocol.paths.attemptRoot}/`) ||
      entry.stagingPath.startsWith(`${protocol.paths.attemptRoot}/`))) {
      fail(`${catalogueRow.packetId} publication transition enters its attempt root`);
    }
  }
  if (new Set(allFinals).size !== allFinals.length || new Set(allStages).size !== allStages.length ||
    allFinals.some((path) => allStages.includes(path))) {
    fail("global publication final/stage mapping is duplicated or crossed");
  }
  return Object.freeze(["catalogue-order", "global-locks", "nonoverlapping-attempt-roots", "unique-publication-transitions"]);
}

function validateResourceContracts(context: CapturedAuthority): readonly string[] {
  for (const [packetId, protocol] of context.protocols) {
    const resources = protocol.resources;
    if (resources.packageElapsedNanosecondsMaximum !== 86_400_000_000_000 ||
      resources.packageProcessHoursMaximum !== 24 ||
      resources.currentPacketRegisteredProcessHoursMaximum !==
        resources.currentPacketRegisteredElapsedNanosecondsMaximum / 3_600_000_000_000 ||
      resources.outerInfrastructureSafetyTimeoutSeconds !==
        resources.currentPacketRegisteredElapsedNanosecondsMaximum / 1_000_000_000 + 3600 ||
      resources.automaticRetry !== false ||
      protocol.paths.packageLockPath !== context.packageLockPath) {
      fail(`${packetId} resource literals or integer derivations differ`);
    }
    const rawFields = protocol.workerInvocationContract.exactFields;
    if (!rawFields.includes("monotonicOffsetNanoseconds") ||
      protocol.workerInvocationContract.monotonicClockRule !==
        "parent-owned-zero-based-safe-integer-nanoseconds-nondecreasing") {
      fail(`${packetId} lacks parent-monotonic worker timing authority`);
    }
    if (protocol.terminalSubroutes.some((entry) => String(entry.dispositionCode) === "retryable-infrastructure") ||
      protocol.executionRecordTuples.some((entry) => String(entry.dispositionCode) === "retryable-infrastructure")) {
      fail(`${packetId} registers a claim-bearing infrastructure route`);
    }
  }
  return Object.freeze(["integer-process-cap", "parent-monotonic-leaves", "outer-fail-stop", "no-claim-bearing-retry"]);
}

function predecessorSchemaIds(context: CapturedAuthority): ReadonlySet<string> {
  const root = jsonObject(context.predecessorSchemaRegistryValue, "predecessor schema registry");
  const collections = ["artifactSchemas", "schemaAliases", "externalSchemaDefinitions", "externalSchemaReservations"];
  return new Set(collections.flatMap((collection) =>
    jsonArray(root[collection], `predecessor schema registry.${collection}`).map((entry, index) => {
      const row = jsonObject(entry, `predecessor schema registry.${collection}[${index}]`);
      if (typeof row.schemaId !== "string") fail(`predecessor schema registry.${collection}[${index}].schemaId differs`);
      return row.schemaId;
    })));
}

function validateSchemaDelta(context: CapturedAuthority): readonly string[] {
  assertPhase10C0VS6ArtifactSchemaRegistryMatrixParity(context.successorSchemaRegistry, context.matrix);
  const oldIds = predecessorSchemaIds(context);
  const newIds: ReadonlySet<string> = new Set(context.successorSchemaRegistry.schemas.map((entry) => entry.schemaId));
  for (const output of context.matrix.outputs) {
    if (!oldIds.has(output.artifact.schemaId) && !newIds.has(output.artifact.schemaId)) {
      fail(`published output ${output.outputId} cites unregistered schema ${output.artifact.schemaId}`);
    }
  }
  return Object.freeze(["successor-registry-matrix-parity", "every-output-schema-registered"]);
}

const VALIDATORS: Readonly<Record<Phase10C0VS6ApCheckId, (context: CapturedAuthority) => readonly string[]>> = Object.freeze({
  "chk-ap-c0v-s6-authority-bindings": validateAuthorityBindings,
  "chk-ap-c0v-s6-branch-routes": validateBranchRoutes,
  "chk-ap-c0v-s6-callable-resolution": validateCallableResolution,
  "chk-ap-c0v-s6-called-checks": validateCalledChecks,
  "chk-ap-c0v-s6-original-ap-binding": validateOriginalApBinding,
  "chk-ap-c0v-s6-output-producers": validateOutputProducers,
  "chk-ap-c0v-s6-override-scope": validateOverrideScope,
  "chk-ap-c0v-s6-packet-catalogue": validatePacketCatalogue,
  "chk-ap-c0v-s6-resource-contracts": validateResourceContracts,
  "chk-ap-c0v-s6-schema-delta": validateSchemaDelta,
});

function evaluate(checkId: Phase10C0VS6ApCheckId, context: CapturedAuthority): Phase10C0VS6ApCheckResult {
  try {
    return Object.freeze({
      checkId,
      evaluatorCallableId: "phase10-a-p-c0v-s6-evaluator",
      verdict: "pass",
      witnesses: VALIDATORS[checkId](context),
      errors: Object.freeze([]),
    });
  } catch (error) {
    return Object.freeze({
      checkId,
      evaluatorCallableId: "phase10-a-p-c0v-s6-evaluator",
      verdict: "fail",
      witnesses: Object.freeze([]),
      errors: Object.freeze([error instanceof Error ? error.message : String(error)]),
    });
  }
}

interface Phase10C0VS6ApGraphEvaluation {
  readonly checkResults: readonly Phase10C0VS6ApCheckResult[];
  readonly aggregateVerdict: "pass" | "fail";
  readonly errors: readonly string[];
}

function evaluateGraph(request: Phase10C0VS6ApGraphRequest): Phase10C0VS6ApGraphEvaluation {
  const context = capture(request);
  const checkResults = Object.freeze(PHASE10_C0V_S6_AP_CHECK_IDS.map((checkId) => evaluate(checkId, context)));
  const errors = Object.freeze(checkResults.flatMap((entry) => entry.errors));
  return Object.freeze({
    checkResults,
    aggregateVerdict: errors.length === 0 ? "pass" : "fail",
    errors,
  });
}

function exactObjectKeys(row: JsonObject, expected: readonly string[], label: string): void {
  const actual = Object.keys(row);
  if (!sameStrings(actual, expected)) fail(`${label} fields/order differ from [${expected.join(", ")}]`);
}

function exactString(value: StrictJson | undefined, label: string): string {
  if (typeof value !== "string") fail(`${label} must be a string`);
  return value;
}

function exactSha(value: StrictJson | undefined, label: string): string {
  const parsed = exactString(value, label);
  if (!/^[0-9a-f]{64}$/u.test(parsed)) fail(`${label} must be lowercase SHA-256`);
  return parsed;
}

function exactByteLength(value: StrictJson | undefined, label: string): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) {
    fail(`${label} must be a nonnegative safe integer`);
  }
  return value;
}

function canonicalPrettyBytes(value: StrictJson): Uint8Array {
  return new TextEncoder().encode(`${JSON.stringify(strictJsonSnapshot(value), null, 2)}\n`);
}

function sameBytes(left: Uint8Array, right: Uint8Array): boolean {
  return left.byteLength === right.byteLength && left.every((entry, index) => entry === right[index]);
}

function parseMutationWitness(
  value: StrictJson | undefined,
  label: string,
): Phase10C0VS6ApNegativeControlReceipt["beforeWitness"] {
  const row = jsonObject(value as StrictJson, label);
  exactObjectKeys(row, ["artifactId", "path", "byteLength", "sha256", "semanticFingerprint"], label);
  const semantic = jsonObject(row.semanticFingerprint, `${label}.semanticFingerprint`);
  exactObjectKeys(semantic, ["projection", "sha256"], `${label}.semanticFingerprint`);
  if (semantic.projection === undefined) fail(`${label}.semanticFingerprint.projection is absent`);
  parsePhase10C0VS6CallableRegistry(semantic.projection);
  return Object.freeze({
    artifactId: exactString(row.artifactId, `${label}.artifactId`) as "authority-c0v-radial-produce-callable-registry",
    path: safePath(exactString(row.path, `${label}.path`), `${label}.path`),
    byteLength: exactByteLength(row.byteLength, `${label}.byteLength`),
    sha256: exactSha(row.sha256, `${label}.sha256`),
    semanticFingerprint: Object.freeze({
      projection: strictJsonSnapshot(semantic.projection),
      sha256: exactSha(semantic.sha256, `${label}.semanticFingerprint.sha256`),
    }),
  });
}

export function parsePhase10C0VS6ApNegativeControlReceiptBytes(
  receiptBytes: Uint8Array,
  label = "A-P negative-control receipt",
): Phase10C0VS6ApNegativeControlReceipt {
  const value = parsePhase10C0VS6PrettyJsonBytes(receiptBytes, label);
  const row = jsonObject(value, label);
  exactObjectKeys(row, [
    "schema", "fixtureId", "mutation", "beforeWitness", "afterWitness", "refused", "error",
  ], label);
  if (row.schema !== "phase10-ap-negative-control-v1" ||
    (row.fixtureId !== "missing-producer" && row.fixtureId !== "uncalled-check") || row.refused !== true) {
    fail(`${label} schema, fixtureId, or refused literal differs`);
  }
  const fixtureId = row.fixtureId;
  const mutation = jsonObject(row.mutation, `${label}.mutation`);
  const expectedMutationKeys = fixtureId === "missing-producer"
    ? ["kind", "callableId"]
    : ["kind", "callableId", "checkId"];
  exactObjectKeys(mutation, expectedMutationKeys, `${label}.mutation`);
  const expectedMutation = fixtureId === "missing-producer"
    ? Object.freeze({ kind: "remove-callable", callableId: "phase10-c0v-radial-production-producer" })
    : Object.freeze({
      kind: "remove-invoked-check",
      callableId: "phase10-c0v-s6-attempt-census-check-caller",
      checkId: "chk-c0v-radial-attempt-census",
    });
  if (Object.entries(expectedMutation).some(([key, expected]) => mutation[key] !== expected)) {
    fail(`${label}.mutation differs from the exact named operation`);
  }
  const error = jsonObject(row.error, `${label}.error`);
  exactObjectKeys(error, ["refusalClass", "message"], `${label}.error`);
  if (error.refusalClass !== fixtureId) fail(`${label}.error.refusalClass differs from fixtureId`);
  return Object.freeze({
    schema: "phase10-ap-negative-control-v1",
    fixtureId,
    mutation: expectedMutation,
    beforeWitness: parseMutationWitness(row.beforeWitness, `${label}.beforeWitness`),
    afterWitness: parseMutationWitness(row.afterWitness, `${label}.afterWitness`),
    refused: true,
    error: Object.freeze({
      refusalClass: fixtureId,
      message: exactString(error.message, `${label}.error.message`),
    }),
  });
}

type MutableJson = null | boolean | number | string | MutableJson[] | { [key: string]: MutableJson };

function mutableObject(value: MutableJson, label: string): { [key: string]: MutableJson } {
  if (value === null || Array.isArray(value) || typeof value !== "object") fail(`${label} must be an object`);
  return value;
}

function deriveExpectedMutation(receipt: Phase10C0VS6ApNegativeControlReceipt): StrictJson {
  const mutated = JSON.parse(JSON.stringify(
    receipt.beforeWitness.semanticFingerprint.projection,
  )) as MutableJson;
  const registry = mutableObject(mutated, "embedded baseline registry");
  if (!Array.isArray(registry.callables)) fail("embedded baseline registry callables are absent");
  if (receipt.fixtureId === "missing-producer") {
    const index = registry.callables.findIndex((entry) =>
      mutableObject(entry, "embedded callable").callableId === "phase10-c0v-radial-production-producer");
    if (index < 0) fail("embedded baseline lacks the named producer before mutation");
    registry.callables.splice(index, 1);
  } else {
    const caller = registry.callables.map((entry) => mutableObject(entry, "embedded callable")).find((entry) =>
      entry.callableId === "phase10-c0v-s6-attempt-census-check-caller");
    if (caller === undefined || !Array.isArray(caller.invokedCheckIds)) {
      fail("embedded baseline lacks the attempt-census check caller");
    }
    const index = caller.invokedCheckIds.indexOf("chk-c0v-radial-attempt-census");
    if (index < 0) fail("embedded baseline lacks the named invoked check before mutation");
    caller.invokedCheckIds.splice(index, 1);
  }
  return strictJsonSnapshot(mutated);
}

function assertWitnessIdentity(
  witness: Phase10C0VS6ApNegativeControlReceipt["beforeWitness"],
  expectedPath: string,
  encoded: Uint8Array,
  label: string,
): void {
  if (witness.artifactId !== "authority-c0v-radial-produce-callable-registry" ||
    witness.path !== expectedPath || witness.byteLength !== encoded.byteLength ||
    witness.sha256 !== sha256(encoded) ||
    witness.semanticFingerprint.sha256 !==
      phase10C0VS6CanonicalSemanticSha256(witness.semanticFingerprint.projection)) {
    fail(`${label} does not bind the exact canonical registry bytes`);
  }
}

export function independentlyReprovePhase10C0VS6ApNegativeControl(
  repositoryRoot: string,
  receiptBytes: Uint8Array,
  authorityGeneration: Phase10C0VS6ApGraphRequest["authorityGeneration"] = "current",
): Phase10C0VS6ApNegativeControlReproof {
  const root = physicalRoot(repositoryRoot);
  const receipt = parsePhase10C0VS6ApNegativeControlReceiptBytes(receiptBytes);
  const historical = authorityGeneration === "historical-predecessor-ap";
  const authorityRoot = historical
    ? PHASE10_C0V_S6_RECOVERY_V5_AUTHORITY_ROOT
    : PHASE10_C0V_S6_RECOVERY_V6_AUTHORITY_ROOT;
  const attemptRoot = historical
    ? PHASE10_C0V_S6_RECOVERY_V5_ATTEMPT_ROOT
    : PHASE10_C0V_S6_RECOVERY_V6_ATTEMPT_ROOT;
  const attemptId = historical
    ? PHASE10_C0V_S6_RECOVERY_V5_ATTEMPT_IDS["a-p-c0v-s6"]
    : PHASE10_C0V_S6_RECOVERY_V6_ATTEMPT_IDS["a-p-c0v-s6"];
  const registryPath =
    `${authorityRoot}/packets/c0v-radial-produce/callable-registry.json`;
  const baselineBytes = canonicalPrettyBytes(receipt.beforeWitness.semanticFingerprint.projection);
  const liveBaselineBytes = readBytes(root, registryPath, "live radial callable registry");
  if (!sameBytes(baselineBytes, liveBaselineBytes)) {
    fail(`${receipt.fixtureId} embedded baseline bytes differ from the live strict registry`);
  }
  const expectedAfter = deriveExpectedMutation(receipt);
  const expectedAfterBytes = canonicalPrettyBytes(expectedAfter);
  const observedAfterBytes = canonicalPrettyBytes(receipt.afterWitness.semanticFingerprint.projection);
  if (!sameBytes(expectedAfterBytes, observedAfterBytes)) {
    fail(`${receipt.fixtureId} embedded mutation differs from the independently derived named operation`);
  }
  const afterPath =
    `${attemptRoot}/a-p-c0v-s6/` +
    `${attemptId}/negative-controls/` +
    `${receipt.fixtureId}/callable-registry.json`;
  assertWitnessIdentity(receipt.beforeWitness, registryPath, baselineBytes, `${receipt.fixtureId} before witness`);
  assertWitnessIdentity(receipt.afterWitness, afterPath, observedAfterBytes, `${receipt.fixtureId} after witness`);
  if (receipt.beforeWitness.sha256 === receipt.afterWitness.sha256) {
    fail(`${receipt.fixtureId} before/after registry identities are equal`);
  }
  const ownerCheckId = receipt.fixtureId === "missing-producer"
    ? "chk-ap-c0v-s6-output-producers"
    : "chk-ap-c0v-s6-called-checks";
  const baseline = evaluateGraph({
    repositoryRoot: root,
    requireResolvedCallables: false,
    authorityGeneration,
  });
  const beforeCheck = baseline.checkResults.find((entry) => entry.checkId === ownerCheckId);
  if (beforeCheck?.verdict !== "pass") fail(`${ownerCheckId} does not pass on the retained baseline`);
  const mutated = evaluateGraph({
    repositoryRoot: root,
    overrides: {
      callableRegistries: { "c0v-radial-produce": receipt.afterWitness.semanticFingerprint.projection },
    },
    requireResolvedCallables: false,
    authorityGeneration,
  });
  const afterCheck = mutated.checkResults.find((entry) => entry.checkId === ownerCheckId);
  if (afterCheck?.verdict !== "fail" || afterCheck.errors.length === 0 ||
    receipt.error.refusalClass !== receipt.fixtureId || receipt.error.message !== afterCheck.errors[0]) {
    fail(`${receipt.fixtureId} owner-check refusal differs from independent graph evaluation`);
  }
  const failingCheckIds = Object.freeze(mutated.checkResults
    .filter((entry) => entry.verdict === "fail")
    .map((entry) => entry.checkId));
  if (!failingCheckIds.includes(ownerCheckId)) fail(`${receipt.fixtureId} does not make its owner check load-bearing`);
  return Object.freeze({
    fixtureId: receipt.fixtureId,
    negativeControlId: receipt.fixtureId === "missing-producer"
      ? "nc-ap-c0v-s6-missing-producer"
      : "nc-ap-c0v-s6-uncalled-check",
    ownerCheckId,
    mutatedRegistry: identity(afterPath, observedAfterBytes),
    failingCheckIds,
    verdict: "pass",
  });
}

export function independentlyVerifyPhase10C0VS6ApArtifacts(
  request: Phase10C0VS6ApIndependentRequest,
): Phase10C0VS6ApIndependentEvaluation {
  const graph = evaluateGraph(request);
  const missingProducer = independentlyReprovePhase10C0VS6ApNegativeControl(
    request.repositoryRoot,
    request.negativeControlReceiptBytes.missingProducer,
    request.authorityGeneration,
  );
  const uncalledCheck = independentlyReprovePhase10C0VS6ApNegativeControl(
    request.repositoryRoot,
    request.negativeControlReceiptBytes.uncalledCheck,
    request.authorityGeneration,
  );
  if (missingProducer.fixtureId !== "missing-producer" || uncalledCheck.fixtureId !== "uncalled-check") {
    fail("negative-control receipt roles are swapped");
  }
  const negativeControlReproofs = Object.freeze([missingProducer, uncalledCheck]);
  return Object.freeze({
    schema: "phase10-c0v-s6-ap-independent-evaluation-v1",
    matrixId: "phase10-c0v-s6-obligations-v1",
    packetId: "a-p-c0v-s6",
    checkResults: graph.checkResults,
    negativeControlReproofs,
    aggregateVerdict: graph.aggregateVerdict,
    errors: graph.errors,
  });
}
