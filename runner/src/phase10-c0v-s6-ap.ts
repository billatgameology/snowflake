import { createHash } from "node:crypto";
import { lstatSync, readFileSync, realpathSync } from "node:fs";
import { isAbsolute, relative, resolve, sep } from "node:path";
import { strictJsonSnapshot, type StrictJson } from "./gate4-evidence.ts";
import {
  PHASE10_C0V_S6_RECOVERY_V3_AUTHORITY_PATH,
  PHASE10_C0V_S6_RECOVERY_V3_AUTHORITY_ROOT,
  PHASE10_C0V_S6_RECOVERY_V3_PACKET_CATALOGUE_PATH,
  parsePhase10C0VS6PrettyJsonBytes,
} from "./phase10-c0v-s6-contracts.ts";
import {
  PHASE10_C0V_S6_AP_CHECK_IDS,
  independentlyVerifyPhase10C0VS6ApArtifacts,
  parsePhase10C0VS6ApNegativeControlReceiptBytes,
  type Phase10C0VS6ApIndependentEvaluation,
  type Phase10C0VS6ApIndependentRequest,
} from "./phase10-c0v-s6-ap-independent.ts";
import {
  type Phase10C0VS6ApNegativeControlReceipt,
} from "./phase10-c0v-s6-ap-negative-controls.ts";

export interface Phase10C0VS6ApArtifactIndexEntry {
  readonly artifactId: string;
  readonly path: string;
  readonly mediaType: "application/json" | "text/markdown; charset=utf-8";
  readonly byteLength: number;
  readonly sha256: string;
  readonly role: "obligation-preflight";
  readonly producedBy: "phase10-a-p-c0v-s6-producer";
}

export interface Phase10C0VS6ApArtifactIndex {
  readonly schema: "phase10-artifact-index-v1";
  readonly bundleId: "phase10-obligation-preflight-v4";
  readonly artifacts: readonly Phase10C0VS6ApArtifactIndexEntry[];
}

export interface Phase10C0VS6ApProduceRequest {
  readonly repositoryRoot: string;
  readonly negativeControlReceiptBytes: {
    readonly missingProducer: Uint8Array;
    readonly uncalledCheck: Uint8Array;
  };
}

export interface Phase10C0VS6ApProduceResult {
  readonly artifactIndex: Phase10C0VS6ApArtifactIndex;
  readonly missingProducer: Phase10C0VS6ApNegativeControlReceipt;
  readonly uncalledCheck: Phase10C0VS6ApNegativeControlReceipt;
  readonly bytes: {
    readonly artifactIndex: Uint8Array;
    readonly missingProducer: Uint8Array;
    readonly uncalledCheck: Uint8Array;
  };
}

export interface Phase10C0VS6ApCheckCallerResult {
  readonly schema: "phase10-c0v-s6-ap-check-caller-result-v1";
  readonly packetId: "a-p-c0v-s6";
  readonly callerCallableId: "phase10-a-p-c0v-s6-check-caller";
  readonly evaluatorCallableId: "phase10-a-p-c0v-s6-evaluator";
  readonly evaluation: Phase10C0VS6ApIndependentEvaluation;
  readonly executedCheckIds: readonly (typeof PHASE10_C0V_S6_AP_CHECK_IDS)[number][];
  readonly evaluatedCheckIds: readonly (typeof PHASE10_C0V_S6_AP_CHECK_IDS)[number][];
  readonly executedNegativeControlIds: readonly [
    "nc-ap-c0v-s6-missing-producer",
    "nc-ap-c0v-s6-uncalled-check",
  ];
}

interface IndexSource {
  readonly artifactId: string;
  readonly path: string;
  readonly bytes: Uint8Array;
}

type JsonObject = { readonly [key: string]: StrictJson };

const MATRIX_PATH = "research/phase10-c0v-s6-obligation-matrix-v1.json" as const;
const CATALOGUE_PATH = PHASE10_C0V_S6_RECOVERY_V3_PACKET_CATALOGUE_PATH;
const RECOVERY_AUTHORITY_PATH = PHASE10_C0V_S6_RECOVERY_V3_AUTHORITY_PATH;
const README_PATH = "research/phase10-execution-v2/README.md" as const;

function fail(message: string): never {
  throw new Error(`Phase 10 C0V S6 supplemental A-P check caller refused: ${message}`);
}

function compareText(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function object(value: StrictJson, label: string): JsonObject {
  if (value === null || Array.isArray(value) || typeof value !== "object") fail(`${label} must be an object`);
  return value as JsonObject;
}

function rootDirectory(value: string): string {
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

function safePath(path: string): string {
  if (isAbsolute(path) || path.includes("\\") || path.startsWith("/") || path.endsWith("/") ||
    path.split("/").some((entry) => entry === "" || entry === "." || entry === "..")) {
    fail(`unsafe authority path ${path}`);
  }
  return path;
}

function liveBytes(root: string, pathValue: string): Uint8Array {
  const path = safePath(pathValue);
  const absolute = resolve(root, path);
  const stat = lstatSync(absolute);
  if (!stat.isFile() || stat.isSymbolicLink() || stat.nlink !== 1) fail(`${path} is not a unique regular file`);
  const physical = realpathSync(absolute);
  const displacement = relative(root, physical);
  if (displacement === "" || displacement === ".." || displacement.startsWith(`..${sep}`) ||
    isAbsolute(displacement) || relative(absolute, physical) !== "" || relative(physical, absolute) !== "") {
    fail(`${path} aliases or escapes the repository`);
  }
  return new Uint8Array(readFileSync(physical));
}

function jsonBytes(value: unknown): Uint8Array {
  return new TextEncoder().encode(`${JSON.stringify(strictJsonSnapshot(value), null, 2)}\n`);
}

function sha256(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

function sourceIds(root: string): readonly IndexSource[] {
  const matrix = object(parsePhase10C0VS6PrettyJsonBytes(liveBytes(root, MATRIX_PATH), "S6 matrix"), "S6 matrix");
  const bindings = object(matrix.bindings as StrictJson, "S6 matrix.bindings");
  const byPath = new Map<string, string>();
  const register = (artifactId: string, path: string): void => {
    const previous = byPath.get(path);
    if (previous !== undefined && previous !== artifactId) fail(`${path} has two artifact IDs`);
    byPath.set(path, artifactId);
  };
  for (const name of [
    "originalMatrix", "c0vFoundation", "predecessorSchemaRegistry", "predecessorSchemaContracts",
    "successorSchemaRegistry", "successorSchemaContracts",
  ]) {
    const row = object(bindings[name] as StrictJson, `bindings.${name}`);
    if (typeof row.path !== "string") fail(`bindings.${name}.path differs`);
    register(`authority-${name}`, row.path);
  }
  if (!Array.isArray(bindings.originalApEvidence)) fail("originalApEvidence must be an array");
  for (const [index, entry] of bindings.originalApEvidence.entries()) {
    const row = object(entry, `originalApEvidence[${index}]`);
    if (typeof row.path !== "string") fail(`originalApEvidence[${index}].path differs`);
    register(`authority-original-a-p-${index}`, row.path);
  }
  register("authority-execution-v2-readme", README_PATH);
  register("authority-execution-v2-recovery-v3", RECOVERY_AUTHORITY_PATH);
  register("authority-packet-catalogue", CATALOGUE_PATH);
  for (const packetId of [
    "a-p-c0v-s6", "c0v-moving-produce", "c0v-moving-publish", "c0v-radial-produce",
    "c0v-radial-publish", "c0v-static-produce", "c0v-static-publish", "c0v-aggregate",
  ]) {
    register(`authority-${packetId}-protocol`, `${PHASE10_C0V_S6_RECOVERY_V3_AUTHORITY_ROOT}/packets/${packetId}/protocol.json`);
    register(`authority-${packetId}-callable-registry`, `${PHASE10_C0V_S6_RECOVERY_V3_AUTHORITY_ROOT}/packets/${packetId}/callable-registry.json`);
  }
  return Object.freeze([...byPath.entries()].map(([path, artifactId]) => Object.freeze({
    artifactId,
    path,
    bytes: liveBytes(root, path),
  })));
}

function entry(source: IndexSource): Phase10C0VS6ApArtifactIndexEntry {
  return Object.freeze({
    artifactId: source.artifactId,
    path: source.path,
    mediaType: source.path.endsWith(".md") ? "text/markdown; charset=utf-8" : "application/json",
    byteLength: source.bytes.byteLength,
    sha256: sha256(source.bytes),
    role: "obligation-preflight",
    producedBy: "phase10-a-p-c0v-s6-producer",
  });
}

export function verifyPhase10C0VS6ApArtifacts(
  request: Phase10C0VS6ApIndependentRequest,
): Phase10C0VS6ApCheckCallerResult {
  const evaluation = independentlyVerifyPhase10C0VS6ApArtifacts(request);
  if (evaluation.aggregateVerdict !== "pass") fail(evaluation.errors.join(" | "));
  const executedCheckIds = Object.freeze(evaluation.checkResults.map((entry) => entry.checkId));
  if (executedCheckIds.length !== PHASE10_C0V_S6_AP_CHECK_IDS.length ||
    executedCheckIds.some((entry, index) => entry !== PHASE10_C0V_S6_AP_CHECK_IDS[index])) {
    fail("independent evaluator check roster differs from the registered caller roster");
  }
  const executedNegativeControlIds = Object.freeze(evaluation.negativeControlReproofs.map(
    (entry) => entry.negativeControlId,
  ));
  if (executedNegativeControlIds.length !== 2 ||
    executedNegativeControlIds[0] !== "nc-ap-c0v-s6-missing-producer" ||
    executedNegativeControlIds[1] !== "nc-ap-c0v-s6-uncalled-check") {
    fail("independent evaluator negative-control roster differs from the registered caller roster");
  }
  return Object.freeze({
    schema: "phase10-c0v-s6-ap-check-caller-result-v1",
    packetId: "a-p-c0v-s6",
    callerCallableId: "phase10-a-p-c0v-s6-check-caller",
    evaluatorCallableId: "phase10-a-p-c0v-s6-evaluator",
    evaluation,
    executedCheckIds,
    evaluatedCheckIds: executedCheckIds,
    executedNegativeControlIds: executedNegativeControlIds as unknown as readonly [
      "nc-ap-c0v-s6-missing-producer",
      "nc-ap-c0v-s6-uncalled-check",
    ],
  });
}

export function producePhase10C0VS6ApArtifacts(
  request: Phase10C0VS6ApProduceRequest,
): Phase10C0VS6ApProduceResult {
  const root = rootDirectory(request.repositoryRoot);
  const missingBytes = new Uint8Array(request.negativeControlReceiptBytes.missingProducer);
  const uncalledBytes = new Uint8Array(request.negativeControlReceiptBytes.uncalledCheck);
  const missingProducer = parsePhase10C0VS6ApNegativeControlReceiptBytes(
    missingBytes,
    "missing-producer retained receipt",
  );
  const uncalledCheck = parsePhase10C0VS6ApNegativeControlReceiptBytes(
    uncalledBytes,
    "uncalled-check retained receipt",
  );
  if (missingProducer.fixtureId !== "missing-producer" || uncalledCheck.fixtureId !== "uncalled-check") {
    fail("negative-control receipt roles are swapped");
  }
  const sources = [
    ...sourceIds(root),
    Object.freeze({
      artifactId: "out-ap-c0v-s6-missing-producer",
      path: "evidence/phase10-obligation-preflight-v4/missing-producer.json",
      bytes: missingBytes,
    }),
    Object.freeze({
      artifactId: "out-ap-c0v-s6-uncalled-check",
      path: "evidence/phase10-obligation-preflight-v4/uncalled-check.json",
      bytes: uncalledBytes,
    }),
  ];
  const artifacts = Object.freeze(sources.map(entry).sort((left, right) =>
    compareText(left.artifactId, right.artifactId)));
  if (new Set(artifacts.map((artifact) => artifact.artifactId)).size !== artifacts.length ||
    new Set(artifacts.map((artifact) => artifact.path)).size !== artifacts.length) {
    fail("artifact index contains duplicate IDs or paths");
  }
  const artifactIndex: Phase10C0VS6ApArtifactIndex = Object.freeze({
    schema: "phase10-artifact-index-v1",
    bundleId: "phase10-obligation-preflight-v4",
    artifacts,
  });
  return Object.freeze({
    artifactIndex,
    missingProducer,
    uncalledCheck,
    bytes: Object.freeze({ artifactIndex: jsonBytes(artifactIndex), missingProducer: missingBytes, uncalledCheck: uncalledBytes }),
  });
}
