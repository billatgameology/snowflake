import {
  canonicalJsonBytes,
  sha256Bytes,
  strictJsonSnapshot,
  type StrictJson,
} from "./gate4-evidence.ts";
import { parsePhase10CallableRegistry } from "./phase10-contracts.ts";
import { phase10ObligationRunPreflight } from "./phase10-obligation-preflight.ts";

const REGISTRY_OUTPUT_ID = "out-ap-self-callable-registry" as const;
const REGISTRY_PATH = "research/phase10-execution-v1/packets/a-p/callable-registry.json" as const;
const PRODUCER_CALLABLE_ID = "phase10-a-p-producer" as const;
const CHECK_CALLER_ID = "phase10-a-p-check-caller" as const;
const UNCALLED_CHECK_ID = "chk-ap-called-checks" as const;

type JsonObject = { readonly [key: string]: StrictJson };
type MutableJsonObject = { [key: string]: StrictJson };

export interface Phase10ApSemanticFingerprint {
  readonly projection: StrictJson;
  readonly sha256: string;
}

export interface Phase10ApMutationWitness {
  readonly artifactId: typeof REGISTRY_OUTPUT_ID;
  readonly path: string;
  readonly byteLength: number;
  readonly sha256: string;
  readonly semanticFingerprint: Phase10ApSemanticFingerprint;
}

export interface Phase10ApNegativeControlReceipt {
  readonly schema: "phase10-ap-negative-control-v1";
  readonly fixtureId: "missing-producer" | "uncalled-check";
  readonly mutation: StrictJson;
  readonly beforeWitness: Phase10ApMutationWitness;
  readonly afterWitness: Phase10ApMutationWitness;
  readonly refused: true;
  readonly error: {
    readonly refusalClass: "missing-producer" | "uncalled-check";
    readonly message: string;
  };
}

export interface Phase10ApNegativeControlRequest {
  readonly repositoryRoot: string;
  readonly matrix: unknown;
  readonly protocol: unknown;
  readonly registryBytes: Uint8Array;
}

function fail(message: string): never {
  throw new Error(`Phase 10 A-P negative control refused: ${message}`);
}

function object(value: StrictJson, label: string): JsonObject {
  if (value === null || Array.isArray(value) || typeof value !== "object") {
    fail(`${label} must be an object`);
  }
  return value as JsonObject;
}

function prettyJson(bytes: Uint8Array, label: string): StrictJson {
  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    fail(`${label} is not valid UTF-8`);
  }
  if (text.includes("\r")) fail(`${label} must use LF line endings`);
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

function prettyJsonBytes(value: unknown): Uint8Array {
  return new TextEncoder().encode(`${JSON.stringify(strictJsonSnapshot(value), null, 2)}\n`);
}

function mutableClone(value: StrictJson): MutableJsonObject {
  return object(
    JSON.parse(JSON.stringify(value)) as StrictJson,
    "callable registry clone",
  ) as MutableJsonObject;
}

function compareText(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function fingerprint(projection: StrictJson): Phase10ApSemanticFingerprint {
  const snapshot = strictJsonSnapshot(projection);
  return Object.freeze({
    projection: snapshot,
    sha256: sha256Bytes(canonicalJsonBytes(snapshot)),
  });
}

function witness(
  path: string,
  bytes: Uint8Array,
  projection: StrictJson,
): Phase10ApMutationWitness {
  return Object.freeze({
    artifactId: REGISTRY_OUTPUT_ID,
    path,
    byteLength: bytes.byteLength,
    sha256: sha256Bytes(bytes),
    semanticFingerprint: fingerprint(projection),
  });
}

function callableProjection(registryValue: StrictJson): StrictJson {
  const registry = parsePhase10CallableRegistry(registryValue);
  return strictJsonSnapshot({
    callableIds: registry.callables.map((entry) => entry.callableId).sort(),
    producerBindings: registry.callables
      .filter((entry) => entry.role === "producer")
      .map((entry) => ({
        callableId: entry.callableId,
        producedOutputIds: entry.producedOutputIds,
      }))
      .sort((left, right) => compareText(left.callableId, right.callableId)),
    checkCallerBindings: registry.callables
      .filter((entry) => entry.role === "check-caller")
      .map((entry) => ({
        callableId: entry.callableId,
        invokedCheckIds: entry.invokedCheckIds,
      }))
      .sort((left, right) => compareText(left.callableId, right.callableId)),
  });
}

function rejection(
  request: Phase10ApNegativeControlRequest,
  mutatedRegistry: StrictJson,
  expectedPattern: RegExp,
): string {
  try {
    phase10ObligationRunPreflight(
      request.matrix,
      request.protocol,
      mutatedRegistry,
      request.repositoryRoot,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!expectedPattern.test(message)) {
      fail(`mutation refused for the wrong reason: ${message}`);
    }
    return message;
  }
  fail("mutation was accepted by run preflight");
}

function baseline(request: Phase10ApNegativeControlRequest): {
  readonly registry: StrictJson;
  readonly beforeBytes: Uint8Array;
} {
  const registry = prettyJson(request.registryBytes, "A-P callable registry");
  phase10ObligationRunPreflight(
    request.matrix,
    request.protocol,
    registry,
    request.repositoryRoot,
  );
  return Object.freeze({ registry, beforeBytes: new Uint8Array(request.registryBytes) });
}

/** Execute the exact missing-producer mutation registered by nc-ap-missing-producer. */
export function runPhase10MissingProducerControl(
  request: Phase10ApNegativeControlRequest,
): Phase10ApNegativeControlReceipt {
  const clean = baseline(request);
  const mutable = mutableClone(clean.registry);
  const callables = mutable.callables;
  if (!Array.isArray(callables)) fail("callable registry has no callable array");
  const beforeCount = callables.length;
  mutable.callables = callables.filter((entry) =>
    object(entry, "callable entry").callableId !== PRODUCER_CALLABLE_ID);
  if ((mutable.callables as readonly StrictJson[]).length !== beforeCount - 1) {
    fail(`mutation did not remove exactly ${PRODUCER_CALLABLE_ID}`);
  }
  const mutated = strictJsonSnapshot(mutable);
  const afterBytes = prettyJsonBytes(mutated);
  const message = rejection(
    request,
    mutated,
    /callable roster differs|missing producer|has no callable producer/u,
  );
  return Object.freeze({
    schema: "phase10-ap-negative-control-v1",
    fixtureId: "missing-producer",
    mutation: Object.freeze({ kind: "remove-callable", callableId: PRODUCER_CALLABLE_ID }),
    beforeWitness: witness(REGISTRY_PATH, clean.beforeBytes, callableProjection(clean.registry)),
    afterWitness: witness(
      "out/phase10-execution-v1/attempts/a-p/negative-controls/missing-producer/callable-registry.json",
      afterBytes,
      callableProjection(mutated),
    ),
    refused: true,
    error: Object.freeze({ refusalClass: "missing-producer", message }),
  });
}

/** Execute the exact uncalled-check mutation registered by nc-ap-uncalled-check. */
export function runPhase10UncalledCheckControl(
  request: Phase10ApNegativeControlRequest,
): Phase10ApNegativeControlReceipt {
  const clean = baseline(request);
  const mutable = mutableClone(clean.registry);
  const callables = mutable.callables;
  if (!Array.isArray(callables)) fail("callable registry has no callable array");
  const caller = callables
    .map((entry) => object(entry, "callable entry") as MutableJsonObject)
    .find((entry) => entry.callableId === CHECK_CALLER_ID);
  if (caller === undefined || !Array.isArray(caller.invokedCheckIds)) {
    fail(`callable registry has no ${CHECK_CALLER_ID} invocation roster`);
  }
  const beforeCount = caller.invokedCheckIds.length;
  caller.invokedCheckIds = caller.invokedCheckIds.filter((entry) => entry !== UNCALLED_CHECK_ID);
  if ((caller.invokedCheckIds as readonly StrictJson[]).length !== beforeCount - 1) {
    fail(`mutation did not remove exactly ${UNCALLED_CHECK_ID}`);
  }
  const mutated = strictJsonSnapshot(mutable);
  const afterBytes = prettyJsonBytes(mutated);
  const message = rejection(
    request,
    mutated,
    /check-caller obligations differs|uncalled check|is uncalled by/u,
  );
  return Object.freeze({
    schema: "phase10-ap-negative-control-v1",
    fixtureId: "uncalled-check",
    mutation: Object.freeze({
      kind: "remove-invoked-check",
      callableId: CHECK_CALLER_ID,
      checkId: UNCALLED_CHECK_ID,
    }),
    beforeWitness: witness(REGISTRY_PATH, clean.beforeBytes, callableProjection(clean.registry)),
    afterWitness: witness(
      "out/phase10-execution-v1/attempts/a-p/negative-controls/uncalled-check/callable-registry.json",
      afterBytes,
      callableProjection(mutated),
    ),
    refused: true,
    error: Object.freeze({ refusalClass: "uncalled-check", message }),
  });
}
