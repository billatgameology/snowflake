import { createHash } from "node:crypto";
import { lstatSync, readFileSync, realpathSync } from "node:fs";
import { relative, resolve } from "node:path";
import { strictJsonSnapshot, type StrictJson } from "./gate4-evidence.ts";
import {
  PHASE10_C0V_S6_RECOVERY_V4_ATTEMPT_IDS,
  PHASE10_C0V_S6_RECOVERY_V4_ATTEMPT_ROOT,
  PHASE10_C0V_S6_RECOVERY_V4_AUTHORITY_ROOT,
  parsePhase10C0VS6PrettyJsonBytes,
} from "./phase10-c0v-s6-contracts.ts";

type MutableJson = null | boolean | number | string | MutableJson[] | { [key: string]: MutableJson };
type JsonObject = { readonly [key: string]: StrictJson };
type MutableJsonObject = { [key: string]: MutableJson };

export interface Phase10C0VS6ApSemanticFingerprint {
  readonly projection: StrictJson;
  readonly sha256: string;
}

export interface Phase10C0VS6ApMutationWitness {
  readonly artifactId: "authority-c0v-radial-produce-callable-registry";
  readonly path: string;
  readonly byteLength: number;
  readonly sha256: string;
  readonly semanticFingerprint: Phase10C0VS6ApSemanticFingerprint;
}

export interface Phase10C0VS6ApNegativeControlReceipt {
  readonly schema: "phase10-ap-negative-control-v1";
  readonly fixtureId: "missing-producer" | "uncalled-check";
  readonly mutation: Readonly<Record<string, string>>;
  readonly beforeWitness: Phase10C0VS6ApMutationWitness;
  readonly afterWitness: Phase10C0VS6ApMutationWitness;
  readonly refused: true;
  readonly error: {
    readonly refusalClass: "missing-producer" | "uncalled-check";
    readonly message: string;
  };
}

export interface Phase10C0VS6ApNegativeControlRequest {
  readonly repositoryRoot: string;
}

const REGISTRY_PATH =
  `${PHASE10_C0V_S6_RECOVERY_V4_AUTHORITY_ROOT}/packets/c0v-radial-produce/callable-registry.json` as const;
const ATTEMPT_PREFIX =
  `${PHASE10_C0V_S6_RECOVERY_V4_ATTEMPT_ROOT}/a-p-c0v-s6/` +
  `${PHASE10_C0V_S6_RECOVERY_V4_ATTEMPT_IDS["a-p-c0v-s6"]}/negative-controls`;

function fail(message: string): never {
  throw new Error(`Phase 10 C0V S6 A-P negative control refused: ${message}`);
}

function object(value: StrictJson, label: string): JsonObject {
  if (value === null || Array.isArray(value) || typeof value !== "object") fail(`${label} must be an object`);
  return value as JsonObject;
}

function mutable(value: StrictJson): MutableJsonObject {
  return JSON.parse(JSON.stringify(value)) as MutableJsonObject;
}

function bytes(value: unknown): Uint8Array {
  return new TextEncoder().encode(`${JSON.stringify(strictJsonSnapshot(value), null, 2)}\n`);
}

function digest(value: Uint8Array): string {
  return createHash("sha256").update(value).digest("hex");
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

function liveRegistry(rootValue: string): StrictJson {
  const root = physicalRoot(rootValue);
  const absolute = resolve(root, REGISTRY_PATH);
  const stat = lstatSync(absolute);
  if (!stat.isFile() || stat.isSymbolicLink() || stat.nlink !== 1 ||
    relative(root, realpathSync(absolute)).replaceAll("\\", "/") !== REGISTRY_PATH) {
    fail("radial callable registry is not a unique unaliased repository file");
  }
  return parsePhase10C0VS6PrettyJsonBytes(new Uint8Array(readFileSync(absolute)), "radial callable registry");
}

function projection(value: StrictJson): StrictJson {
  const registry = object(value, "callable registry");
  if (!Array.isArray(registry.callables)) fail("callable registry callables must be an array");
  // Retain the complete strict registry object. The independent evaluator canonically
  // reserializes these bytes, rederives the named mutation, and reruns the affected graph check;
  // the control-authored refused/error fields never carry authority by themselves.
  return strictJsonSnapshot(registry);
}

function witness(path: string, value: StrictJson): Phase10C0VS6ApMutationWitness {
  const encoded = bytes(value);
  const semantic = projection(value);
  return Object.freeze({
    artifactId: "authority-c0v-radial-produce-callable-registry",
    path,
    byteLength: encoded.byteLength,
    sha256: digest(encoded),
    semanticFingerprint: Object.freeze({ projection: semantic, sha256: digest(bytes(semantic)) }),
  });
}

export function runPhase10C0VS6MissingProducerControl(
  request: Phase10C0VS6ApNegativeControlRequest,
): Phase10C0VS6ApNegativeControlReceipt {
  const before = liveRegistry(request.repositoryRoot);
  const after = mutable(before);
  if (!Array.isArray(after.callables)) fail("radial callable registry callables are absent");
  const index = after.callables.findIndex((entry) => object(entry as StrictJson, "callable").callableId ===
    "phase10-c0v-radial-production-producer");
  if (index < 0) fail("named radial production producer is absent before mutation");
  after.callables.splice(index, 1);
  const afterValue = strictJsonSnapshot(after);
  return Object.freeze({
    schema: "phase10-ap-negative-control-v1",
    fixtureId: "missing-producer",
    mutation: Object.freeze({
      kind: "remove-callable",
      callableId: "phase10-c0v-radial-production-producer",
    }),
    beforeWitness: witness(REGISTRY_PATH, before),
    afterWitness: witness(`${ATTEMPT_PREFIX}/missing-producer/callable-registry.json`, afterValue),
    refused: true,
    error: Object.freeze({
      refusalClass: "missing-producer",
      message: "Phase 10 C0V S6 supplemental A-P refused: output out-c0v-radial-witness has no callable producer phase10-c0v-radial-production-producer",
    }),
  });
}

export function runPhase10C0VS6UncalledCheckControl(
  request: Phase10C0VS6ApNegativeControlRequest,
): Phase10C0VS6ApNegativeControlReceipt {
  const before = liveRegistry(request.repositoryRoot);
  const after = mutable(before);
  if (!Array.isArray(after.callables)) fail("radial callable registry callables are absent");
  const caller = after.callables.map((entry) => object(entry as StrictJson, "callable")).find((entry) =>
    entry.callableId === "phase10-c0v-s6-attempt-census-check-caller") as MutableJsonObject | undefined;
  if (caller === undefined || !Array.isArray(caller.invokedCheckIds)) fail("attempt census caller is absent");
  const index = caller.invokedCheckIds.indexOf("chk-c0v-radial-attempt-census");
  if (index < 0) fail("radial attempt-census check is absent before mutation");
  caller.invokedCheckIds.splice(index, 1);
  const afterValue = strictJsonSnapshot(after);
  return Object.freeze({
    schema: "phase10-ap-negative-control-v1",
    fixtureId: "uncalled-check",
    mutation: Object.freeze({
      kind: "remove-invoked-check",
      callableId: "phase10-c0v-s6-attempt-census-check-caller",
      checkId: "chk-c0v-radial-attempt-census",
    }),
    beforeWitness: witness(REGISTRY_PATH, before),
    afterWitness: witness(`${ATTEMPT_PREFIX}/uncalled-check/callable-registry.json`, afterValue),
    refused: true,
    error: Object.freeze({
      refusalClass: "uncalled-check",
      message: "Phase 10 C0V S6 supplemental A-P refused: registered check chk-c0v-radial-attempt-census is uncalled or unevaluated",
    }),
  });
}
