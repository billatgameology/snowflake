import { Buffer } from "node:buffer";
import { env as processEnvironment, execArgv as processExecArguments } from "node:process";
import { strictJsonSnapshot, type StrictJson } from "./gate4-evidence.ts";
import {
  PHASE10_C0V_S6_RECOVERY_V4_ATTEMPT_IDS,
  PHASE10_C0V_S6_RECOVERY_V4_AUTHORITY_ROOT,
  type Phase10C0VS6PacketId,
} from "./phase10-c0v-s6-contracts.ts";

const WIRE_BYTES_KEY = "$phase10C0VS6Bytes" as const;
export const PHASE10_C0V_S6_MAXIMUM_WORKER_WIRE_LINE_BYTES = 33_554_432 as const;

export interface Phase10C0VS6ExactEnvironmentEntry {
  readonly key: string;
  readonly value: string;
}

export const PHASE10_C0V_S6_EXACT_RUNTIME_ENVIRONMENT = Object.freeze([
  Object.freeze({ key: "GIT_CONFIG_GLOBAL", value: "NUL" }),
  Object.freeze({ key: "GIT_CONFIG_NOSYSTEM", value: "1" }),
  Object.freeze({ key: "GIT_OPTIONAL_LOCKS", value: "0" }),
  Object.freeze({ key: "GIT_TERMINAL_PROMPT", value: "0" }),
  Object.freeze({ key: "HOMEDRIVE", value: "" }),
  Object.freeze({ key: "HOMEPATH", value: "" }),
  Object.freeze({ key: "LC_ALL", value: "C" }),
  Object.freeze({ key: "LOGONSERVER", value: "" }),
  Object.freeze({ key: "PATH", value: "C:\\Program Files\\Git\\cmd" }),
  Object.freeze({ key: "PATHEXT", value: ".COM;.EXE" }),
  Object.freeze({ key: "SYSTEMDRIVE", value: "" }),
  Object.freeze({ key: "SYSTEMROOT", value: "C:\\WINDOWS" }),
  Object.freeze({ key: "TEMP", value: "" }),
  Object.freeze({ key: "USERDOMAIN", value: "" }),
  Object.freeze({ key: "USERNAME", value: "" }),
  Object.freeze({ key: "USERPROFILE", value: "" }),
  Object.freeze({ key: "WINDIR", value: "" }),
] satisfies readonly Phase10C0VS6ExactEnvironmentEntry[]);

export const PHASE10_C0V_S6_EXECUTOR_PACKET_AUTHORITY = Object.freeze({
  "a-p-c0v-s6": Object.freeze({
    protocolPath: `${PHASE10_C0V_S6_RECOVERY_V4_AUTHORITY_ROOT}/packets/a-p-c0v-s6/protocol.json`,
    attemptId: PHASE10_C0V_S6_RECOVERY_V4_ATTEMPT_IDS["a-p-c0v-s6"],
  }),
  "c0v-moving-produce": Object.freeze({
    protocolPath: `${PHASE10_C0V_S6_RECOVERY_V4_AUTHORITY_ROOT}/packets/c0v-moving-produce/protocol.json`,
    attemptId: PHASE10_C0V_S6_RECOVERY_V4_ATTEMPT_IDS["c0v-moving-produce"],
  }),
  "c0v-moving-publish": Object.freeze({
    protocolPath: `${PHASE10_C0V_S6_RECOVERY_V4_AUTHORITY_ROOT}/packets/c0v-moving-publish/protocol.json`,
    attemptId: PHASE10_C0V_S6_RECOVERY_V4_ATTEMPT_IDS["c0v-moving-publish"],
  }),
  "c0v-radial-produce": Object.freeze({
    protocolPath: `${PHASE10_C0V_S6_RECOVERY_V4_AUTHORITY_ROOT}/packets/c0v-radial-produce/protocol.json`,
    attemptId: PHASE10_C0V_S6_RECOVERY_V4_ATTEMPT_IDS["c0v-radial-produce"],
  }),
  "c0v-radial-publish": Object.freeze({
    protocolPath: `${PHASE10_C0V_S6_RECOVERY_V4_AUTHORITY_ROOT}/packets/c0v-radial-publish/protocol.json`,
    attemptId: PHASE10_C0V_S6_RECOVERY_V4_ATTEMPT_IDS["c0v-radial-publish"],
  }),
  "c0v-static-produce": Object.freeze({
    protocolPath: `${PHASE10_C0V_S6_RECOVERY_V4_AUTHORITY_ROOT}/packets/c0v-static-produce/protocol.json`,
    attemptId: PHASE10_C0V_S6_RECOVERY_V4_ATTEMPT_IDS["c0v-static-produce"],
  }),
  "c0v-static-publish": Object.freeze({
    protocolPath: `${PHASE10_C0V_S6_RECOVERY_V4_AUTHORITY_ROOT}/packets/c0v-static-publish/protocol.json`,
    attemptId: PHASE10_C0V_S6_RECOVERY_V4_ATTEMPT_IDS["c0v-static-publish"],
  }),
  "c0v-aggregate": Object.freeze({
    protocolPath: `${PHASE10_C0V_S6_RECOVERY_V4_AUTHORITY_ROOT}/packets/c0v-aggregate/protocol.json`,
    attemptId: PHASE10_C0V_S6_RECOVERY_V4_ATTEMPT_IDS["c0v-aggregate"],
  }),
} satisfies Readonly<Record<Phase10C0VS6PacketId, Readonly<{
  protocolPath: string;
  attemptId: string;
}>>>);

export type Phase10C0VS6WorkerCommandKind = "invoke" | "acknowledge" | "stop";

export interface Phase10C0VS6WorkerCommand {
  readonly schema: "phase10-c0v-s6-worker-command-v1";
  readonly sequence: number;
  readonly packetId: Phase10C0VS6PacketId;
  readonly attemptId: string;
  readonly kind: Phase10C0VS6WorkerCommandKind;
  readonly invocationId: string | null;
  readonly acknowledgedWorkerSequence: number | null;
}

export type Phase10C0VS6WorkerMessageKind =
  | "ready"
  | "boundary"
  | "progress"
  | "artifact"
  | "result"
  | "stopped"
  | "error";

export interface Phase10C0VS6WorkerMessage {
  readonly schema: "phase10-c0v-s6-worker-message-v1";
  readonly sequence: number;
  readonly packetId: Phase10C0VS6PacketId;
  readonly attemptId: string;
  readonly kind: Phase10C0VS6WorkerMessageKind;
  readonly invocationId: string | null;
  readonly payload: StrictJson | null;
}

export type Phase10C0VS6WorkerMessageInput = Omit<Phase10C0VS6WorkerMessage, "payload"> & {
  readonly payload: unknown | null;
};

function fail(message: string): never {
  throw new Error(`Phase 10 C0V S6 worker transport refused: ${message}`);
}

function asciiUppercase(value: string): string {
  return value.replace(/[a-z]/g, (entry) => entry.toUpperCase());
}

function forbiddenNodeEnvironmentKey(key: string): boolean {
  const upper = asciiUppercase(key);
  return upper === "NODE" || upper.startsWith("NODE_") ||
    upper === "TS_NODE" || upper.startsWith("TS_NODE_");
}

/** Exact loader state shared by the two catalogue-owned runtime entrypoints. */
export function phase10C0VS6AssertExactRuntimeLoaderState(): void {
  if (processExecArguments.length !== 0) {
    fail("registered runtime process.execArgv must be exactly empty");
  }
  const forbidden = Object.keys(processEnvironment)
    .filter(forbiddenNodeEnvironmentKey)
    .sort();
  if (forbidden.length !== 0) {
    fail(`registered runtime environment contains forbidden Node loader keys: ${forbidden.join(",")}`);
  }
}

function exactRuntimeEnvironmentEntries(
  entries: readonly Phase10C0VS6ExactEnvironmentEntry[],
): readonly Phase10C0VS6ExactEnvironmentEntry[] {
  if (entries.length !== PHASE10_C0V_S6_EXACT_RUNTIME_ENVIRONMENT.length ||
    entries.some((entry, index) => {
      const expected = PHASE10_C0V_S6_EXACT_RUNTIME_ENVIRONMENT[index]!;
      return entry === null || typeof entry !== "object" || Array.isArray(entry) ||
        Object.keys(entry).length !== 2 || Object.keys(entry)[0] !== "key" ||
        Object.keys(entry)[1] !== "value" || entry.key !== expected.key ||
        entry.value !== expected.value;
    })) {
    fail("runtime clean environment differs from the exact compiled host roster");
  }
  return entries;
}

/** Materialize only the exact catalogue/compiled child environment; no ambient value is copied. */
export function phase10C0VS6ExactWorkerEnvironment(
  entries: readonly Phase10C0VS6ExactEnvironmentEntry[],
): Readonly<Record<string, string>> {
  exactRuntimeEnvironmentEntries(entries);
  const result = Object.create(null) as Record<string, string>;
  for (const entry of entries) result[entry.key] = entry.value;
  return Object.freeze(result);
}

/** The worker independently proves its process environment equals the frozen child roster. */
export function phase10C0VS6AssertExactWorkerEnvironment(): void {
  const expected = phase10C0VS6ExactWorkerEnvironment(PHASE10_C0V_S6_EXACT_RUNTIME_ENVIRONMENT);
  const actualKeys = Object.keys(processEnvironment).sort();
  const expectedKeys = Object.keys(expected);
  if (actualKeys.length !== expectedKeys.length ||
    actualKeys.some((key, index) => key !== expectedKeys[index] || processEnvironment[key] !== expected[key])) {
    fail("worker process environment differs from the exact compiled child roster");
  }
}

function safeInteger(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0 || Object.is(value, -0)) {
    fail(`${label} must be a nonnegative safe integer`);
  }
  return value;
}

function exactKeys(value: object, expected: readonly string[], label: string): void {
  const keys = Object.keys(value);
  if (keys.length !== expected.length || keys.some((entry, index) => entry !== expected[index])) {
    fail(`${label} fields or field order differ`);
  }
}

function objectValue(value: unknown, label: string): Record<string, unknown> {
  if (value === null || Array.isArray(value) || typeof value !== "object") fail(`${label} must be an object`);
  return value as Record<string, unknown>;
}

function packetIdValue(value: unknown, label: string): Phase10C0VS6PacketId {
  if (typeof value !== "string" || !(value in PHASE10_C0V_S6_EXECUTOR_PACKET_AUTHORITY)) {
    fail(`${label} is not a compiled packet ID`);
  }
  return value as Phase10C0VS6PacketId;
}

function safeStableToken(value: unknown, label: string): string {
  if (typeof value !== "string" || !/^[a-z0-9][a-z0-9.-]*$/u.test(value)) {
    fail(`${label} is not a safe stable token`);
  }
  return value;
}

function canonicalWireValue(
  value: unknown,
  seen = new Set<object>(),
  acceptEncodedByteMarker = false,
): StrictJson {
  if (value === null || typeof value === "string" || typeof value === "boolean") return value;
  if (typeof value === "number") {
    if (!Number.isFinite(value) || Object.is(value, -0)) fail("wire payload contains a noncanonical number");
    return value;
  }
  if (value instanceof Uint8Array) {
    if (Object.getPrototypeOf(value) !== Uint8Array.prototype) {
      fail("wire byte payload must be an unextended Uint8Array");
    }
    const keys = Reflect.ownKeys(value);
    const expectedKeys = Array.from({ length: value.byteLength }, (_, index) => String(index));
    if (keys.length !== expectedKeys.length || keys.some((key, index) => key !== expectedKeys[index])) {
      fail("wire byte payload must not contain extra or symbolic properties");
    }
    return { [WIRE_BYTES_KEY]: Buffer.from(value).toString("base64") };
  }
  if (Array.isArray(value)) {
    if (seen.has(value)) fail("wire payload contains a cycle");
    seen.add(value);
    try {
      const descriptors = Object.getOwnPropertyDescriptors(value);
      const keys = Reflect.ownKeys(value);
      const expectedKeys = Array.from({ length: value.length }, (_, index) => String(index));
      expectedKeys.push("length");
      if (keys.length !== expectedKeys.length ||
        keys.some((key, index) => typeof key !== "string" || key !== expectedKeys[index])) {
        fail("wire payload arrays must be dense without extra or symbolic properties");
      }
      const lengthDescriptor = Object.getOwnPropertyDescriptor(value, "length");
      if (lengthDescriptor === undefined || !("value" in lengthDescriptor)) {
        fail("wire payload array length must be a data property");
      }
      const result: StrictJson[] = [];
      for (let index = 0; index < value.length; index++) {
        const descriptor = descriptors[String(index)];
        if (descriptor === undefined || !("value" in descriptor) || !descriptor.enumerable) {
          fail(`wire payload array index ${index} must be an enumerable data property`);
        }
        result.push(canonicalWireValue(descriptor.value, seen, acceptEncodedByteMarker));
      }
      return result;
    } finally {
      seen.delete(value);
    }
  }
  if (typeof value === "object") {
    if (seen.has(value)) fail("wire payload contains a cycle");
    seen.add(value);
    try {
      const prototype = Object.getPrototypeOf(value) as unknown;
      if (prototype !== Object.prototype && prototype !== null) {
        fail("wire payload objects must be plain objects");
      }
      const ownKeys = Reflect.ownKeys(value);
      if (ownKeys.some((key) => typeof key !== "string")) {
        fail("wire payload objects must not contain symbolic properties");
      }
      const sourceKeys = ownKeys as string[];
      const descriptors = Object.getOwnPropertyDescriptors(value);
      const dataValue = (key: string): unknown => {
        const descriptor = descriptors[key];
        if (descriptor === undefined || !("value" in descriptor) || !descriptor.enumerable) {
          fail(`wire payload field ${key} must be an enumerable data property`);
        }
        return descriptor.value;
      };
      if (sourceKeys.includes(WIRE_BYTES_KEY)) {
        if (!acceptEncodedByteMarker) {
          fail("wire byte payload marker is reserved for Uint8Array values");
        }
        const encodedValue = dataValue(WIRE_BYTES_KEY);
        if (sourceKeys.length !== 1 || typeof encodedValue !== "string" ||
          !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/u.test(
            encodedValue,
          )) {
          fail("wire byte payload marker must be the sole key with canonical base64");
        }
        if (Buffer.from(encodedValue, "base64").toString("base64") !== encodedValue) {
          fail("wire byte payload is not canonical base64");
        }
        return { [WIRE_BYTES_KEY]: encodedValue };
      }
      const result = Object.create(null) as Record<string, StrictJson>;
      for (const key of [...sourceKeys].sort()) {
        result[key] = canonicalWireValue(dataValue(key), seen, acceptEncodedByteMarker);
      }
      return result;
    } finally {
      seen.delete(value);
    }
  }
  fail("wire payload contains a non-JSON value");
}

export function phase10C0VS6EncodeWorkerPayload(value: unknown): StrictJson {
  return strictJsonSnapshot(canonicalWireValue(value));
}

export function phase10C0VS6DecodeWorkerPayload(value: StrictJson): unknown {
  if (value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map((entry) => phase10C0VS6DecodeWorkerPayload(entry));
  const row = value as Record<string, StrictJson>;
  const keys = Object.keys(row);
  if (keys.length === 1 && keys[0] === WIRE_BYTES_KEY) {
    const encoded = row[WIRE_BYTES_KEY];
    if (typeof encoded !== "string" || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/u.test(encoded)) {
      fail("wire byte payload is not canonical base64");
    }
    const bytes = Buffer.from(encoded, "base64");
    if (bytes.toString("base64") !== encoded) fail("wire byte payload is not canonical base64");
    return new Uint8Array(bytes);
  }
  const decoded = Object.create(null) as Record<string, unknown>;
  for (const key of keys.sort()) decoded[key] = phase10C0VS6DecodeWorkerPayload(row[key]!);
  return decoded;
}

function commandValue(
  value: unknown,
  expectedSequence: number,
  scope: Pick<Phase10C0VS6WorkerCommand, "packetId" | "attemptId">,
): Phase10C0VS6WorkerCommand {
  const row = objectValue(value, "worker command");
  exactKeys(row, [
    "schema", "sequence", "packetId", "attemptId", "kind", "invocationId",
    "acknowledgedWorkerSequence",
  ], "worker command");
  if (row.schema !== "phase10-c0v-s6-worker-command-v1") fail("worker command schema differs");
  const sequence = safeInteger(row.sequence, "worker command sequence");
  if (sequence !== expectedSequence) fail("worker command sequence is omitted, repeated, or reordered");
  const packetId = packetIdValue(row.packetId, "worker command packet ID");
  const attemptId = safeStableToken(row.attemptId, "worker command attempt ID");
  if (packetId !== scope.packetId || attemptId !== scope.attemptId) fail("worker command scope differs");
  const kind = row.kind === "invoke" || row.kind === "acknowledge" || row.kind === "stop"
    ? row.kind
    : fail("worker command kind differs");
  const invocationId = row.invocationId === null
    ? null
    : safeStableToken(row.invocationId, "worker command invocation ID");
  const acknowledgedWorkerSequence = row.acknowledgedWorkerSequence === null
    ? null
    : safeInteger(row.acknowledgedWorkerSequence, "worker acknowledged sequence");
  if ((kind === "stop") !== (invocationId === null) ||
    (kind === "acknowledge") !== (acknowledgedWorkerSequence !== null) ||
    (kind === "invoke" && acknowledgedWorkerSequence !== null)) {
    fail("worker command kind/nullability rule differs");
  }
  return Object.freeze({
    schema: "phase10-c0v-s6-worker-command-v1",
    sequence,
    packetId,
    attemptId,
    kind,
    invocationId,
    acknowledgedWorkerSequence,
  });
}

function compactLine(value: object): Uint8Array {
  const bytes = new TextEncoder().encode(`${JSON.stringify(value)}\n`);
  if (bytes.byteLength > PHASE10_C0V_S6_MAXIMUM_WORKER_WIRE_LINE_BYTES) {
    fail("wire line exceeds the exact byte bound");
  }
  return bytes;
}

function parseOneLine(bytes: Uint8Array, label: string): unknown {
  if (bytes.byteLength === 0 || bytes.byteLength > PHASE10_C0V_S6_MAXIMUM_WORKER_WIRE_LINE_BYTES) {
    fail(`${label} exceeds the exact wire-line byte bound`);
  }
  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    fail(`${label} is not UTF-8`);
  }
  if (!text.endsWith("\n") || text.includes("\r") || text.slice(0, -1).includes("\n")) {
    fail(`${label} must be one compact JSON line with terminal LF`);
  }
  try {
    return JSON.parse(text.slice(0, -1)) as unknown;
  } catch {
    fail(`${label} is not JSON`);
  }
}

export function phase10C0VS6WorkerCommandLine(
  value: Phase10C0VS6WorkerCommand,
  scope: Pick<Phase10C0VS6WorkerCommand, "packetId" | "attemptId">,
): Uint8Array {
  return compactLine(commandValue(value, value.sequence, scope));
}

export function phase10C0VS6ParseWorkerCommandLine(
  bytes: Uint8Array,
  expectedSequence: number,
  scope: Pick<Phase10C0VS6WorkerCommand, "packetId" | "attemptId">,
): Phase10C0VS6WorkerCommand {
  const parsed = commandValue(parseOneLine(bytes, "worker command"), expectedSequence, scope);
  const canonical = compactLine(parsed);
  if (canonical.byteLength !== bytes.byteLength || canonical.some((entry, index) => entry !== bytes[index])) {
    fail("worker command is not canonical compact JSON");
  }
  return parsed;
}

function messageValue(
  value: unknown,
  expectedSequence: number,
  scope: Pick<Phase10C0VS6WorkerMessage, "packetId" | "attemptId">,
): Phase10C0VS6WorkerMessage {
  const row = objectValue(value, "worker message");
  exactKeys(row, ["schema", "sequence", "packetId", "attemptId", "kind", "invocationId", "payload"], "worker message");
  if (row.schema !== "phase10-c0v-s6-worker-message-v1") fail("worker message schema differs");
  const sequence = safeInteger(row.sequence, "worker message sequence");
  if (sequence !== expectedSequence) fail("worker message sequence is omitted, repeated, or reordered");
  const packetId = packetIdValue(row.packetId, "worker message packet ID");
  const attemptId = safeStableToken(row.attemptId, "worker message attempt ID");
  if (packetId !== scope.packetId || attemptId !== scope.attemptId) fail("worker message scope differs");
  const kind = row.kind === "ready" || row.kind === "boundary" || row.kind === "progress" ||
    row.kind === "artifact" || row.kind === "result" || row.kind === "stopped" || row.kind === "error"
    ? row.kind
    : fail("worker message kind differs");
  const invocationId = row.invocationId === null
    ? null
    : safeStableToken(row.invocationId, "worker message invocation ID");
  const boundary = kind === "ready" || kind === "stopped";
  if (boundary !== (row.payload === null) || (boundary && invocationId !== null) ||
    (!boundary && kind !== "error" && invocationId === null)) {
    fail("worker message kind/nullability rule differs");
  }
  return Object.freeze({
    schema: "phase10-c0v-s6-worker-message-v1",
    sequence,
    packetId,
    attemptId,
    kind,
    invocationId,
    payload: row.payload === null ? null : canonicalWireValue(row.payload, new Set<object>(), true),
  });
}

export function phase10C0VS6WorkerMessageLine(
  value: Phase10C0VS6WorkerMessageInput,
  scope: Pick<Phase10C0VS6WorkerMessage, "packetId" | "attemptId">,
): Uint8Array {
  const wireValue = Object.freeze({
    schema: value.schema,
    sequence: value.sequence,
    packetId: value.packetId,
    attemptId: value.attemptId,
    kind: value.kind,
    invocationId: value.invocationId,
    payload: value.payload === null ? null : phase10C0VS6EncodeWorkerPayload(value.payload),
  });
  return compactLine(messageValue(wireValue, value.sequence, scope));
}

export function phase10C0VS6ParseWorkerMessageLine(
  bytes: Uint8Array,
  expectedSequence: number,
  scope: Pick<Phase10C0VS6WorkerMessage, "packetId" | "attemptId">,
): Phase10C0VS6WorkerMessage {
  const parsed = messageValue(parseOneLine(bytes, "worker message"), expectedSequence, scope);
  const canonical = compactLine(parsed);
  if (canonical.byteLength !== bytes.byteLength || canonical.some((entry, index) => entry !== bytes[index])) {
    fail("worker message is not canonical compact JSON");
  }
  return parsed;
}
