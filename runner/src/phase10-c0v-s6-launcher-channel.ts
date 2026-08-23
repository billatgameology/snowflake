import { Buffer } from "node:buffer";
import { createHash, randomBytes as cryptographicRandomBytes } from "node:crypto";
import {
  closeSync,
  fstatSync,
  lstatSync,
  openSync,
  readFileSync,
  readSync as readFileDescriptorSync,
  realpathSync,
  writeSync as writeFileDescriptorSync,
} from "node:fs";
import * as nodeProcess from "node:process";

export const PHASE10_C0V_S6_LAUNCHER_FRAME_BYTES_MAXIMUM = 4_096 as const;
export const PHASE10_C0V_S6_LAUNCHER_CHALLENGE_BYTES = 32 as const;
export const PHASE10_C0V_S6_LAUNCHER_AUTHENTICATION_TIMEOUT_MILLISECONDS = 30_000 as const;

const REQUEST_SCHEMA = "phase10-c0v-s6-launcher-challenge-v1" as const;
const RESPONSE_SCHEMA = "phase10-c0v-s6-launcher-response-v1" as const;
const AUTHENTICATION_DOMAIN = "phase10-c0v-s6-native-launcher-auth-v1" as const;
const LAUNCHER_VERSION = "phase10-c0v-s6-native-launcher-v1" as const;
const INITIAL_BOUNDARY_ID = "entry-before-arguments" as const;
const RELEASE_BOUNDARY_ID = "release-output" as const;
const READ_FILE_DESCRIPTOR = 0 as const;
const WRITE_FILE_DESCRIPTOR = 1 as const;
const TIMEOUT_NANOSECONDS =
  BigInt(PHASE10_C0V_S6_LAUNCHER_AUTHENTICATION_TIMEOUT_MILLISECONDS) * 1_000_000n;
const POLL_INTERVAL_MILLISECONDS = 1 as const;
const POLL_WORD = new Int32Array(new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT));

const REQUEST_FIELDS = Object.freeze([
  "schema",
  "domain",
  "sequence",
  "kind",
  "boundaryId",
  "childPid",
  "challenge",
] as const);

const RESPONSE_FIELDS = Object.freeze([
  "schema",
  "domain",
  "sequence",
  "kind",
  "boundaryId",
  "launcherVersion",
  "launcherPid",
  "childPid",
  "challenge",
  "launcherExecutable",
] as const);

const EXECUTABLE_IDENTITY_FIELDS = Object.freeze(["path", "byteLength", "sha256"] as const);
const BOUNDARY_AUTHORITY_FIELDS = Object.freeze(["kind", "boundaryId"] as const);
const RUN_ROSTER_AUTHORITY_FIELDS = Object.freeze(["subrouteId", "requests"] as const);

export type Phase10C0VS6LauncherRequestKind =
  | "initial-auth"
  | "boundary-recheck"
  | "release-output";

export interface Phase10C0VS6LauncherBoundaryAuthority {
  readonly kind: Phase10C0VS6LauncherRequestKind;
  readonly boundaryId: string;
}

export interface Phase10C0VS6LauncherRunBoundaryRosterAuthority {
  readonly subrouteId: string;
  readonly requests: readonly Phase10C0VS6LauncherBoundaryAuthority[];
}

export interface Phase10C0VS6ResolvedLauncherExecutableIdentity {
  /** Exact externally resolved physical path reported by the self-opened launcher. */
  readonly path: string;
  readonly byteLength: number;
  readonly sha256: string;
}

export interface Phase10C0VS6LauncherChannelAuthority {
  /** Null is the catalogue's design-only state and can never open a channel. */
  readonly launcherExecutable: Phase10C0VS6ResolvedLauncherExecutableIdentity | null;
}

export interface Phase10C0VS6LauncherRequest {
  readonly schema: typeof REQUEST_SCHEMA;
  readonly domain: typeof AUTHENTICATION_DOMAIN;
  readonly sequence: number;
  readonly kind: Phase10C0VS6LauncherRequestKind;
  readonly boundaryId: string;
  readonly childPid: number;
  readonly challenge: string;
}

export interface Phase10C0VS6LauncherResponse {
  readonly schema: typeof RESPONSE_SCHEMA;
  readonly domain: typeof AUTHENTICATION_DOMAIN;
  readonly sequence: number;
  readonly kind: Phase10C0VS6LauncherRequestKind;
  readonly boundaryId: string;
  readonly launcherVersion: typeof LAUNCHER_VERSION;
  readonly launcherPid: number;
  readonly childPid: number;
  readonly challenge: string;
  readonly launcherExecutable: Phase10C0VS6ResolvedLauncherExecutableIdentity;
}

export interface Phase10C0VS6LauncherSuccessCompletion {
  readonly outcome: "success";
  readonly mode: "check" | "run";
  readonly acceptedRequestCount: number;
  readonly outputReleased: true;
}

export interface Phase10C0VS6LauncherFailureCompletion {
  readonly outcome: "failure";
  readonly mode: "check" | "run";
  readonly acceptedRequestCount: number;
  readonly outputReleased: false;
}

/**
 * The methods close over module-private state. Callers cannot supply a sequence, challenge,
 * response, or alternate transport, and cannot turn an untrusted injected-I/O session into a
 * production-authenticated session.
 */
export interface Phase10C0VS6LauncherChannelSession {
  bindExactRoster(
    mode: "check",
    roster: readonly Phase10C0VS6LauncherBoundaryAuthority[],
  ): void;
  bindExactRoster(
    mode: "run",
    rosters: readonly Phase10C0VS6LauncherRunBoundaryRosterAuthority[],
  ): void;
  selectRunSubroute(subrouteId: string): void;
  authenticateBoundary(boundary: Phase10C0VS6LauncherBoundaryAuthority): void;
  releaseOutput(): Phase10C0VS6LauncherSuccessCompletion;
  completeFailure(): Phase10C0VS6LauncherFailureCompletion;
}

declare const productionLauncherSessionBrand: unique symbol;

export interface Phase10C0VS6ProductionLauncherChannelSession
  extends Phase10C0VS6LauncherChannelSession {
  readonly [productionLauncherSessionBrand]: true;
}

/**
 * Narrow synchronous dependency boundary for deterministic codec/state-machine tests. Sessions
 * created through this interface are deliberately not production authority.
 */
export interface Phase10C0VS6UntrustedLauncherChannelIO {
  readonly readFileDescriptor: 0;
  readonly writeFileDescriptor: 1;
  randomBytes(byteLength: 32): Uint8Array;
  monotonicNowNanoseconds(): bigint;
  /** Null means the exact nonblocking response pipe currently has no available byte. */
  readAvailableSync(
    fileDescriptor: 0,
    buffer: Uint8Array,
    offset: number,
    byteLength: number,
  ): number | null;
  pausePolling(milliseconds: 1): void;
  writeSync(
    fileDescriptor: 1,
    buffer: Uint8Array,
    offset: number,
    byteLength: number,
  ): number;
  childPid(): number;
  parentPid(): number;
  observeLauncherExecutable(
    expected: Phase10C0VS6ResolvedLauncherExecutableIdentity,
  ): Phase10C0VS6ResolvedLauncherExecutableIdentity;
}

type SessionStatus = "open" | "refused" | "failure-complete" | "success-complete";

interface LauncherSessionState {
  readonly authority: Phase10C0VS6ResolvedLauncherExecutableIdentity;
  readonly io: Phase10C0VS6UntrustedLauncherChannelIO;
  readonly childPid: number;
  readonly issuedChallenges: Set<string>;
  readonly acceptedRequests: Phase10C0VS6LauncherBoundaryAuthority[];
  status: SessionStatus;
  mode: "check" | "run" | null;
  roster: readonly Phase10C0VS6LauncherBoundaryAuthority[] | null;
  runRosters: readonly Phase10C0VS6LauncherRunBoundaryRosterAuthority[] | null;
  selectedRunSubrouteId: string | null;
  rosterIndex: number;
  nextSequence: number;
  launcherPid: number | null;
  lastClockNanoseconds: bigint | null;
  inExchange: boolean;
}

const SESSION_STATES = new WeakMap<Phase10C0VS6LauncherChannelSession, LauncherSessionState>();
const PRODUCTION_SESSIONS = new WeakSet<Phase10C0VS6LauncherChannelSession>();

function fail(message: string): never {
  throw new Error(`Phase 10 C0V S6 launcher channel refused: ${message}`);
}

function errorValue(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}

function refuse(state: LauncherSessionState, error: unknown): never {
  state.status = "refused";
  throw errorValue(error);
}

function ownDataObject(value: unknown, expectedKeys: readonly string[], label: string): Record<string, unknown> {
  if (value === null || Array.isArray(value) || typeof value !== "object") {
    fail(`${label} must be an object`);
  }
  const prototype = Object.getPrototypeOf(value) as unknown;
  if (prototype !== Object.prototype && prototype !== null) {
    fail(`${label} must be a plain object`);
  }
  const keys = Reflect.ownKeys(value);
  if (keys.length !== expectedKeys.length || keys.some((key, index) => key !== expectedKeys[index])) {
    fail(`${label} fields or field order differ`);
  }
  const descriptors = Object.getOwnPropertyDescriptors(value);
  for (const key of expectedKeys) {
    const descriptor = descriptors[key];
    if (descriptor === undefined || !("value" in descriptor) || !descriptor.enumerable) {
      fail(`${label}.${key} must be an enumerable data property`);
    }
  }
  return value as Record<string, unknown>;
}

function safeInteger(value: unknown, label: string, minimum = 0): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < minimum ||
    Object.is(value, -0)) {
    fail(`${label} must be a safe integer at least ${minimum}`);
  }
  return value;
}

function stringValue(value: unknown, label: string): string {
  if (typeof value !== "string") fail(`${label} must be a string`);
  return value;
}

function requestKind(value: unknown, label: string): Phase10C0VS6LauncherRequestKind {
  if (value !== "initial-auth" && value !== "boundary-recheck" && value !== "release-output") {
    fail(`${label} differs from the exact launcher request kinds`);
  }
  return value;
}

function boundaryId(value: unknown, label: string): string {
  const result = stringValue(value, label);
  if (result.length === 0 || /[\r\n\u0000]/u.test(result)) {
    fail(`${label} must be a nonempty single-line identifier`);
  }
  return result;
}

function sha256(value: unknown, label: string): string {
  const result = stringValue(value, label);
  if (!/^[0-9a-f]{64}$/u.test(result)) fail(`${label} must be exact lowercase SHA-256`);
  return result;
}

function sameBytes(left: Uint8Array, right: Uint8Array): boolean {
  return left.byteLength === right.byteLength && left.every((entry, index) => entry === right[index]);
}

function sameBoundary(
  left: Phase10C0VS6LauncherBoundaryAuthority,
  right: Phase10C0VS6LauncherBoundaryAuthority,
): boolean {
  return left.kind === right.kind && left.boundaryId === right.boundaryId;
}

function sameIdentity(
  left: Phase10C0VS6ResolvedLauncherExecutableIdentity,
  right: Phase10C0VS6ResolvedLauncherExecutableIdentity,
): boolean {
  return left.path === right.path && left.byteLength === right.byteLength && left.sha256 === right.sha256;
}

function exactIdentity(
  value: unknown,
  label: string,
): Phase10C0VS6ResolvedLauncherExecutableIdentity {
  const row = ownDataObject(value, EXECUTABLE_IDENTITY_FIELDS, label);
  const path = stringValue(row.path, `${label}.path`);
  if (!/^[A-Za-z]:\//u.test(path) || path.includes("\\") || /[\r\n\u0000]/u.test(path)) {
    fail(`${label}.path must be an exact forward-slash Windows physical path`);
  }
  return Object.freeze({
    path,
    byteLength: safeInteger(row.byteLength, `${label}.byteLength`, 1),
    sha256: sha256(row.sha256, `${label}.sha256`),
  });
}

function exactAuthority(
  value: Phase10C0VS6LauncherChannelAuthority,
): Phase10C0VS6ResolvedLauncherExecutableIdentity {
  const row = ownDataObject(value, ["launcherExecutable"], "launcher channel authority");
  if (row.launcherExecutable === null) {
    fail("resolved launcher executable identity is absent");
  }
  return exactIdentity(row.launcherExecutable, "launcher channel authority.launcherExecutable");
}

function exactBoundaryAuthority(
  value: Phase10C0VS6LauncherBoundaryAuthority,
  label: string,
): Phase10C0VS6LauncherBoundaryAuthority {
  const row = ownDataObject(value, BOUNDARY_AUTHORITY_FIELDS, label);
  return Object.freeze({
    kind: requestKind(row.kind, `${label}.kind`),
    boundaryId: boundaryId(row.boundaryId, `${label}.boundaryId`),
  });
}

function exactRoster(
  mode: "check" | "run",
  value: readonly Phase10C0VS6LauncherBoundaryAuthority[],
): readonly Phase10C0VS6LauncherBoundaryAuthority[] {
  if (!Array.isArray(value) || Object.getPrototypeOf(value) !== Array.prototype) {
    fail("launcher boundary roster must be a plain array");
  }
  if (mode !== "check" && mode !== "run") fail("launcher boundary roster mode differs");
  const keys = Reflect.ownKeys(value);
  const expectedKeys: (string | symbol)[] = Array.from(
    { length: value.length },
    (_, index) => String(index),
  );
  expectedKeys.push("length");
  if (keys.length !== expectedKeys.length || keys.some((key, index) => key !== expectedKeys[index])) {
    fail("launcher boundary roster must be dense without extra or symbolic properties");
  }
  const descriptors = Object.getOwnPropertyDescriptors(value);
  for (let index = 0; index < value.length; index++) {
    const descriptor = descriptors[String(index)];
    if (descriptor === undefined || !("value" in descriptor) || !descriptor.enumerable) {
      fail(`launcher boundary roster[${index}] must be an enumerable data property`);
    }
  }
  const roster: Phase10C0VS6LauncherBoundaryAuthority[] = [];
  for (let index = 0; index < value.length; index++) {
    const descriptor = descriptors[String(index)];
    if (descriptor === undefined || !("value" in descriptor)) {
      fail(`launcher boundary roster[${index}] lacks its inspected data value`);
    }
    roster.push(exactBoundaryAuthority(
      descriptor.value as Phase10C0VS6LauncherBoundaryAuthority,
      `launcher boundary roster[${index}]`,
    ));
  }
  if (roster.length < 2 ||
    roster[0]?.kind !== "initial-auth" || roster[0].boundaryId !== INITIAL_BOUNDARY_ID ||
    roster.at(-1)?.kind !== "release-output" || roster.at(-1)?.boundaryId !== RELEASE_BOUNDARY_ID) {
    fail("launcher boundary roster must start with exact initial auth and end with exact output release");
  }
  if (mode === "check" && roster.length !== 2) {
    fail("check launcher boundary roster must contain only initial auth and output release");
  }
  for (let index = 1; index < roster.length - 1; index++) {
    if (roster[index]?.kind !== "boundary-recheck") {
      fail("launcher boundary roster has a premature or repeated initial/release request");
    }
  }
  const ids = roster.map((entry) => entry.boundaryId);
  if (new Set(ids).size !== ids.length) fail("launcher boundary roster contains a duplicate boundary ID");
  return Object.freeze(roster);
}

function exactRunRosters(
  value: readonly Phase10C0VS6LauncherRunBoundaryRosterAuthority[],
): readonly Phase10C0VS6LauncherRunBoundaryRosterAuthority[] {
  if (!Array.isArray(value) || Object.getPrototypeOf(value) !== Array.prototype || value.length === 0) {
    fail("launcher run rosters must be a nonempty plain array");
  }
  const keys = Reflect.ownKeys(value);
  const expectedKeys: (string | symbol)[] = Array.from(
    { length: value.length },
    (_, index) => String(index),
  );
  expectedKeys.push("length");
  if (keys.length !== expectedKeys.length || keys.some((key, index) => key !== expectedKeys[index])) {
    fail("launcher run rosters must be dense without extra or symbolic properties");
  }
  const descriptors = Object.getOwnPropertyDescriptors(value);
  const rosters: Phase10C0VS6LauncherRunBoundaryRosterAuthority[] = [];
  for (let index = 0; index < value.length; index++) {
    const descriptor = descriptors[String(index)];
    if (descriptor === undefined || !("value" in descriptor) || !descriptor.enumerable) {
      fail(`launcher run rosters[${index}] must be an enumerable data property`);
    }
    const row = ownDataObject(
      descriptor.value,
      RUN_ROSTER_AUTHORITY_FIELDS,
      `launcher run rosters[${index}]`,
    );
    const subrouteId = stringValue(row.subrouteId, `launcher run rosters[${index}].subrouteId`);
    if (!/^[a-z0-9][a-z0-9-]*$/u.test(subrouteId)) {
      fail(`launcher run rosters[${index}].subrouteId is not a safe stable token`);
    }
    rosters.push(Object.freeze({
      subrouteId,
      requests: exactRoster(
        "run",
        row.requests as readonly Phase10C0VS6LauncherBoundaryAuthority[],
      ),
    }));
  }
  if (new Set(rosters.map((entry) => entry.subrouteId)).size !== rosters.length) {
    fail("launcher run rosters contain a duplicate subroute ID");
  }
  return Object.freeze(rosters);
}

function compactLine(value: object, label: string): Uint8Array {
  let text: string;
  try {
    text = `${JSON.stringify(value)}\n`;
  } catch {
    fail(`${label} cannot be encoded as compact JSON`);
  }
  const bytes = new TextEncoder().encode(text);
  if (bytes.byteLength === 0 || bytes.byteLength > PHASE10_C0V_S6_LAUNCHER_FRAME_BYTES_MAXIMUM) {
    fail(`${label} exceeds the exact 4096-byte frame bound`);
  }
  return bytes;
}

function exactRequest(
  value: Phase10C0VS6LauncherRequest,
): Phase10C0VS6LauncherRequest {
  const row = ownDataObject(value, REQUEST_FIELDS, "launcher request");
  if (row.schema !== REQUEST_SCHEMA) fail("launcher request schema differs");
  if (row.domain !== AUTHENTICATION_DOMAIN) fail("launcher request domain differs");
  const challenge = stringValue(row.challenge, "launcher request challenge");
  if (!/^[0-9a-f]{64}$/u.test(challenge)) {
    fail("launcher request challenge must be exact 32-byte lowercase hex");
  }
  return Object.freeze({
    schema: REQUEST_SCHEMA,
    domain: AUTHENTICATION_DOMAIN,
    sequence: safeInteger(row.sequence, "launcher request sequence"),
    kind: requestKind(row.kind, "launcher request kind"),
    boundaryId: boundaryId(row.boundaryId, "launcher request boundary ID"),
    childPid: safeInteger(row.childPid, "launcher request child PID", 1),
    challenge,
  });
}

export function phase10C0VS6LauncherRequestLine(
  value: Phase10C0VS6LauncherRequest,
): Uint8Array {
  return compactLine(exactRequest(value), "launcher request");
}

function oneJsonLine(bytes: Uint8Array, label: string): unknown {
  if (!(bytes instanceof Uint8Array) || bytes.byteLength === 0 ||
    bytes.byteLength > PHASE10_C0V_S6_LAUNCHER_FRAME_BYTES_MAXIMUM) {
    fail(`${label} exceeds the exact 4096-byte frame bound`);
  }
  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    fail(`${label} is not UTF-8`);
  }
  if (!text.endsWith("\n") || text.includes("\r") || text.slice(0, -1).includes("\n")) {
    fail(`${label} must be one compact JSON frame with terminal LF`);
  }
  try {
    return JSON.parse(text.slice(0, -1)) as unknown;
  } catch {
    fail(`${label} is not JSON`);
  }
}

function responseValue(value: unknown): Phase10C0VS6LauncherResponse {
  const row = ownDataObject(value, RESPONSE_FIELDS, "launcher response");
  if (row.schema !== RESPONSE_SCHEMA) fail("launcher response schema differs");
  if (row.domain !== AUTHENTICATION_DOMAIN) fail("launcher response domain differs");
  if (row.launcherVersion !== LAUNCHER_VERSION) fail("launcher response version differs");
  const challenge = stringValue(row.challenge, "launcher response challenge");
  if (!/^[0-9a-f]{64}$/u.test(challenge)) {
    fail("launcher response challenge must be exact 32-byte lowercase hex");
  }
  return Object.freeze({
    schema: RESPONSE_SCHEMA,
    domain: AUTHENTICATION_DOMAIN,
    sequence: safeInteger(row.sequence, "launcher response sequence"),
    kind: requestKind(row.kind, "launcher response kind"),
    boundaryId: boundaryId(row.boundaryId, "launcher response boundary ID"),
    launcherVersion: LAUNCHER_VERSION,
    launcherPid: safeInteger(row.launcherPid, "launcher response launcher PID", 1),
    childPid: safeInteger(row.childPid, "launcher response child PID", 1),
    challenge,
    launcherExecutable: exactIdentity(row.launcherExecutable, "launcher response executable"),
  });
}

export function phase10C0VS6ParseLauncherResponseLine(
  bytes: Uint8Array,
): Phase10C0VS6LauncherResponse {
  const response = responseValue(oneJsonLine(bytes, "launcher response"));
  if (!sameBytes(compactLine(response, "launcher response"), bytes)) {
    fail("launcher response is not canonical compact JSON");
  }
  return response;
}

function exactIo(value: Phase10C0VS6UntrustedLauncherChannelIO): Phase10C0VS6UntrustedLauncherChannelIO {
  if (value === null || typeof value !== "object" || value.readFileDescriptor !== READ_FILE_DESCRIPTOR ||
    value.writeFileDescriptor !== WRITE_FILE_DESCRIPTOR || typeof value.randomBytes !== "function" ||
    typeof value.monotonicNowNanoseconds !== "function" ||
    typeof value.readAvailableSync !== "function" || typeof value.pausePolling !== "function" ||
    typeof value.writeSync !== "function" || typeof value.childPid !== "function" ||
    typeof value.parentPid !== "function" || typeof value.observeLauncherExecutable !== "function") {
    fail("launcher channel I/O does not expose the exact fd0/fd1 nonblocking polling boundary");
  }
  return value;
}

function writeAll(state: LauncherSessionState, bytes: Uint8Array): void {
  let offset = 0;
  while (offset < bytes.byteLength) {
    const written = state.io.writeSync(
      WRITE_FILE_DESCRIPTOR,
      bytes,
      offset,
      bytes.byteLength - offset,
    );
    if (!Number.isSafeInteger(written) || written <= 0 || written > bytes.byteLength - offset) {
      fail("launcher request write made invalid progress");
    }
    offset += written;
  }
}

function readAvailable(
  state: LauncherSessionState,
  buffer: Uint8Array,
  offset: number,
  byteLength: number,
): number | null {
  const count = state.io.readAvailableSync(
    READ_FILE_DESCRIPTOR,
    buffer,
    offset,
    byteLength,
  );
  if (count !== null &&
    (!Number.isSafeInteger(count) || count < 0 || count > byteLength)) {
    fail("launcher response read made invalid progress");
  }
  return count;
}

function assertWithinResponseDeadline(
  state: LauncherSessionState,
  writeCompletedAt: bigint,
): void {
  if (now(state) - writeCompletedAt > TIMEOUT_NANOSECONDS) {
    fail("launcher response exceeded the exact 30000ms parent-monotonic bound");
  }
}

function assertNoQueuedResponse(state: LauncherSessionState): void {
  const probe = Buffer.allocUnsafe(1);
  const count = readAvailable(state, probe, 0, probe.byteLength);
  if (count === null) return;
  if (count === 0) fail("launcher response pipe ended before the next exact request");
  fail("launcher emitted an extra or unsolicited response byte before the next exact request");
}

function pauseResponsePolling(state: LauncherSessionState): void {
  state.io.pausePolling(POLL_INTERVAL_MILLISECONDS);
}

function assertPostResponseBoundary(
  state: LauncherSessionState,
  writeCompletedAt: bigint,
  release: boolean,
): void {
  const probe = Buffer.allocUnsafe(1);
  while (true) {
    const count = readAvailable(state, probe, 0, probe.byteLength);
    if (release) assertWithinResponseDeadline(state, writeCompletedAt);
    if (count === null) {
      if (!release) return;
      pauseResponsePolling(state);
      continue;
    }
    if (count === 0) {
      if (release) return;
      fail("launcher response pipe ended before release-output");
    }
    fail("launcher emitted an extra or unsolicited response byte after one exact response");
  }
}

function readOneFrame(
  state: LauncherSessionState,
  writeCompletedAt: bigint,
  release: boolean,
): Uint8Array {
  const buffer = Buffer.allocUnsafe(PHASE10_C0V_S6_LAUNCHER_FRAME_BYTES_MAXIMUM + 1);
  let offset = 0;
  while (true) {
    const count = readAvailable(state, buffer, offset, buffer.byteLength - offset);
    assertWithinResponseDeadline(state, writeCompletedAt);
    if (count === null) {
      pauseResponsePolling(state);
      continue;
    }
    if (count === 0) fail("launcher response pipe ended before one exact response");
    offset += count;
    const newline = buffer.subarray(0, offset).indexOf(0x0a);
    if (newline >= 0) {
      if (newline + 1 !== offset) fail("launcher emitted an extra or unsolicited response byte");
      if (offset > PHASE10_C0V_S6_LAUNCHER_FRAME_BYTES_MAXIMUM) {
        fail("launcher response exceeds the exact 4096-byte frame bound");
      }
      const frame = new Uint8Array(buffer.subarray(0, offset));
      assertPostResponseBoundary(state, writeCompletedAt, release);
      return frame;
    }
    if (offset >= PHASE10_C0V_S6_LAUNCHER_FRAME_BYTES_MAXIMUM) {
      fail("launcher response exceeds the exact 4096-byte frame bound before LF");
    }
  }
}

function now(state: LauncherSessionState): bigint {
  const value = state.io.monotonicNowNanoseconds();
  if (typeof value !== "bigint" || value < 0n ||
    (state.lastClockNanoseconds !== null && value < state.lastClockNanoseconds)) {
    fail("launcher authentication clock is not nonnegative monotonic nanoseconds");
  }
  state.lastClockNanoseconds = value;
  return value;
}

function nextChallenge(state: LauncherSessionState): string {
  const raw = state.io.randomBytes(PHASE10_C0V_S6_LAUNCHER_CHALLENGE_BYTES);
  if (!(raw instanceof Uint8Array) || raw.byteLength !== PHASE10_C0V_S6_LAUNCHER_CHALLENGE_BYTES) {
    fail("launcher challenge source did not return exactly 32 bytes");
  }
  const challenge = Buffer.from(raw).toString("hex");
  if (!/^[0-9a-f]{64}$/u.test(challenge) || state.issuedChallenges.has(challenge)) {
    fail("launcher challenge is not fresh exact lowercase 32-byte hex");
  }
  state.issuedChallenges.add(challenge);
  return challenge;
}

function validateResponse(
  state: LauncherSessionState,
  request: Phase10C0VS6LauncherRequest,
  bytes: Uint8Array,
): void {
  const response = phase10C0VS6ParseLauncherResponseLine(bytes);
  if (response.sequence !== request.sequence || response.kind !== request.kind ||
    response.boundaryId !== request.boundaryId || response.childPid !== request.childPid ||
    response.challenge !== request.challenge || response.domain !== request.domain) {
    fail("launcher response does not exactly echo its request");
  }
  const currentChildPid = safeInteger(state.io.childPid(), "current child PID", 1);
  const currentParentPid = safeInteger(state.io.parentPid(), "current parent PID", 1);
  if (currentChildPid !== state.childPid || response.childPid !== currentChildPid ||
    response.launcherPid !== currentParentPid) {
    fail("launcher response PID binding differs from the live child/parent relationship");
  }
  if (state.launcherPid === null) state.launcherPid = response.launcherPid;
  else if (response.launcherPid !== state.launcherPid) fail("launcher parent PID changed across boundaries");
  if (!sameIdentity(response.launcherExecutable, state.authority)) {
    fail("launcher-reported executable identity differs from resolved external authority");
  }
  const observed = exactIdentity(
    state.io.observeLauncherExecutable(state.authority),
    "observed launcher executable",
  );
  if (!sameIdentity(observed, state.authority) || !sameIdentity(observed, response.launcherExecutable)) {
    fail("fresh launcher executable observation differs from response or resolved authority");
  }
}

function exchange(
  state: LauncherSessionState,
  boundary: Phase10C0VS6LauncherBoundaryAuthority,
): void {
  if (state.status !== "open") fail("launcher session is no longer open");
  if (state.inExchange) refuse(state, new Error("launcher request exchange is already in flight"));
  state.inExchange = true;
  try {
    assertNoQueuedResponse(state);
    const request = Object.freeze({
      schema: REQUEST_SCHEMA,
      domain: AUTHENTICATION_DOMAIN,
      sequence: state.nextSequence,
      kind: boundary.kind,
      boundaryId: boundary.boundaryId,
      childPid: state.childPid,
      challenge: nextChallenge(state),
    });
    const requestBytes = phase10C0VS6LauncherRequestLine(request);
    writeAll(state, requestBytes);
    const writeCompletedAt = now(state);
    const responseBytes = readOneFrame(
      state,
      writeCompletedAt,
      boundary.kind === "release-output",
    );
    validateResponse(state, request, responseBytes);
    state.acceptedRequests.push(boundary);
    state.nextSequence += 1;
  } catch (error) {
    refuse(state, error);
  } finally {
    state.inExchange = false;
  }
}

function sessionState(session: Phase10C0VS6LauncherChannelSession): LauncherSessionState {
  const state = SESSION_STATES.get(session);
  if (state === undefined) fail("launcher session object is forged or belongs to another channel");
  return state;
}

function createSession(
  authorityValue: Phase10C0VS6LauncherChannelAuthority,
  ioValue: Phase10C0VS6UntrustedLauncherChannelIO,
): Phase10C0VS6LauncherChannelSession {
  const authority = exactAuthority(authorityValue);
  const io = exactIo(ioValue);
  const childPid = safeInteger(io.childPid(), "initial child PID", 1);
  const state: LauncherSessionState = {
    authority,
    io,
    childPid,
    issuedChallenges: new Set<string>(),
    acceptedRequests: [],
    status: "open",
    mode: null,
    roster: null,
    runRosters: null,
    selectedRunSubrouteId: null,
    rosterIndex: 0,
    nextSequence: 0,
    launcherPid: null,
    lastClockNanoseconds: null,
    inExchange: false,
  };
  let session!: Phase10C0VS6LauncherChannelSession;
  const currentState = (receiver: unknown): LauncherSessionState => {
    if (receiver !== session) fail("launcher session method receiver is forged or cross-session");
    return sessionState(session);
  };
  session = Object.freeze({
    bindExactRoster(
      this: Phase10C0VS6LauncherChannelSession,
      mode: "check" | "run",
      rosterValue:
        | readonly Phase10C0VS6LauncherBoundaryAuthority[]
        | readonly Phase10C0VS6LauncherRunBoundaryRosterAuthority[],
    ): void {
      const current = currentState(this);
      if (current.status !== "open" || current.mode !== null || current.roster !== null ||
        current.runRosters !== null || current.selectedRunSubrouteId !== null ||
        current.acceptedRequests.length !== 1 || current.nextSequence !== 1) {
        refuse(current, new Error("launcher roster may be bound exactly once after initial auth"));
      }
      try {
        current.mode = mode;
        if (mode === "check") {
          const roster = exactRoster(
            "check",
            rosterValue as readonly Phase10C0VS6LauncherBoundaryAuthority[],
          );
          if (!sameBoundary(roster[0]!, current.acceptedRequests[0]!)) {
            fail("launcher check roster does not contain the accepted initial authentication request");
          }
          current.roster = roster;
        } else {
          const rosters = exactRunRosters(
            rosterValue as readonly Phase10C0VS6LauncherRunBoundaryRosterAuthority[],
          );
          if (rosters.some((entry) => !sameBoundary(
            entry.requests[0]!,
            current.acceptedRequests[0]!,
          ))) {
            fail("launcher run rosters do not contain the accepted initial authentication request");
          }
          current.runRosters = rosters;
        }
        current.rosterIndex = 1;
      } catch (error) {
        refuse(current, error);
      }
    },
    selectRunSubroute(
      this: Phase10C0VS6LauncherChannelSession,
      subrouteIdValue: string,
    ): void {
      const current = currentState(this);
      try {
        if (current.status !== "open" || current.mode !== "run" || current.runRosters === null ||
          current.roster !== null || current.selectedRunSubrouteId !== null) {
          fail("launcher run subroute may be selected exactly once after run-roster binding");
        }
        const subrouteId = stringValue(subrouteIdValue, "launcher selected subroute ID");
        if (!/^[a-z0-9][a-z0-9-]*$/u.test(subrouteId)) {
          fail("launcher selected subroute ID is not a safe stable token");
        }
        const matches = current.runRosters.filter((entry) => entry.subrouteId === subrouteId);
        if (matches.length !== 1) fail("launcher selected subroute is absent or duplicated");
        const selected = matches[0]!;
        if (current.rosterIndex !== 3 || current.acceptedRequests.length !== 3 ||
          current.acceptedRequests[0]?.kind !== "initial-auth" ||
          current.acceptedRequests[0].boundaryId !== INITIAL_BOUNDARY_ID ||
          current.acceptedRequests[1]?.kind !== "boundary-recheck" ||
          !current.acceptedRequests[1].boundaryId.startsWith("publication-stage:") ||
          current.acceptedRequests[2]?.kind !== "boundary-recheck" ||
          !current.acceptedRequests[2].boundaryId.startsWith("publication-install:")) {
          fail("launcher run subroute may be selected only after the exact preflight stage/install prefix");
        }
        if (current.acceptedRequests.length !== current.rosterIndex ||
          current.acceptedRequests.some((entry, index) =>
            selected.requests[index] === undefined ||
            !sameBoundary(entry, selected.requests[index]!))) {
          fail("launcher selected subroute differs from the already accepted common prefix");
        }
        current.roster = selected.requests;
        current.selectedRunSubrouteId = selected.subrouteId;
      } catch (error) {
        refuse(current, error);
      }
    },
    authenticateBoundary(
      this: Phase10C0VS6LauncherChannelSession,
      boundaryValue: Phase10C0VS6LauncherBoundaryAuthority,
    ): void {
      const current = currentState(this);
      try {
        if (current.status !== "open" || current.mode === null) {
          fail("launcher boundary cannot execute before one exact roster is bound");
        }
        const supplied = exactBoundaryAuthority(boundaryValue, "launcher requested boundary");
        let expected = current.roster?.[current.rosterIndex];
        if (current.mode === "run" && current.roster === null) {
          if (current.runRosters === null) fail("launcher run boundary lacks its bound roster set");
          const candidates = current.runRosters.map((entry) => entry.requests[current.rosterIndex]);
          expected = candidates[0];
          if (expected === undefined || candidates.some((entry) =>
            entry === undefined || !sameBoundary(entry, expected!))) {
            fail("launcher run subroute must be selected before its exact rosters diverge");
          }
          if (expected.boundaryId.startsWith("terminal-candidate:")) {
            fail("launcher run subroute must be selected before terminal-candidate publication");
          }
        }
        if (expected === undefined || expected.kind !== "boundary-recheck" ||
          !sameBoundary(supplied, expected)) {
          fail("launcher boundary is duplicate, extra, omitted, or reordered against the bound roster");
        }
        exchange(current, expected);
        current.rosterIndex += 1;
      } catch (error) {
        refuse(current, error);
      }
    },
    releaseOutput(
      this: Phase10C0VS6LauncherChannelSession,
    ): Phase10C0VS6LauncherSuccessCompletion {
      const current = currentState(this);
      try {
        if (current.status !== "open" || current.roster === null || current.mode === null ||
          (current.mode === "run" && current.selectedRunSubrouteId === null)) {
          fail("launcher output cannot release before one exact roster is bound");
        }
        const expected = current.roster[current.rosterIndex];
        if (expected === undefined || current.rosterIndex !== current.roster.length - 1 ||
          expected.kind !== "release-output" || expected.boundaryId !== RELEASE_BOUNDARY_ID) {
          fail("launcher output release is premature, repeated, or absent from the exact roster tail");
        }
        exchange(current, expected);
        current.rosterIndex += 1;
        if (current.rosterIndex !== current.roster.length) {
          fail("launcher success did not complete the exact bound roster");
        }
        current.status = "success-complete";
        return Object.freeze({
          outcome: "success",
          mode: current.mode,
          acceptedRequestCount: current.acceptedRequests.length,
          outputReleased: true,
        });
      } catch (error) {
        refuse(current, error);
      }
    },
    completeFailure(
      this: Phase10C0VS6LauncherChannelSession,
    ): Phase10C0VS6LauncherFailureCompletion {
      const current = currentState(this);
      try {
        if (current.status !== "open" || current.mode === null ||
          (current.roster === null && current.runRosters === null)) {
          fail("launcher failure completion requires one exact bound roster");
        }
        const prefixRosters = current.roster === null
          ? current.runRosters!.map((entry) => entry.requests)
          : [current.roster];
        if (prefixRosters.some((roster) => current.rosterIndex >= roster.length ||
          roster.slice(0, current.rosterIndex).some((entry, index) =>
            !sameBoundary(entry, current.acceptedRequests[index]!))) ||
          current.acceptedRequests.length !== current.rosterIndex ||
          current.acceptedRequests.at(-1)?.kind === "release-output") {
          fail("launcher failure is not a strict non-release prefix of the exact bound roster");
        }
        current.status = "failure-complete";
        return Object.freeze({
          outcome: "failure",
          mode: current.mode,
          acceptedRequestCount: current.acceptedRequests.length,
          outputReleased: false,
        });
      } catch (error) {
        refuse(current, error);
      }
    },
  });
  SESSION_STATES.set(session, state);
  exchange(state, Object.freeze({ kind: "initial-auth", boundaryId: INITIAL_BOUNDARY_ID }));
  return session;
}

function observeProductionLauncherExecutable(
  expected: Phase10C0VS6ResolvedLauncherExecutableIdentity,
): Phase10C0VS6ResolvedLauncherExecutableIdentity {
  const lexicalPath = expected.path.replaceAll("/", "\\");
  const stat = lstatSync(lexicalPath, { bigint: true });
  if (!stat.isFile() || stat.isSymbolicLink()) {
    fail("resolved launcher executable is missing or is not a regular physical file");
  }
  const physicalPath = realpathSync.native(lexicalPath).replaceAll("\\", "/");
  if (physicalPath !== expected.path) {
    fail("resolved launcher executable path differs from its self-opened physical path");
  }
  let descriptor: number | null = null;
  let bytes: Buffer;
  let before: ReturnType<typeof fstatSync>;
  let after: ReturnType<typeof fstatSync>;
  try {
    descriptor = openSync(lexicalPath, "r");
    before = fstatSync(descriptor, { bigint: true });
    if (!before.isFile() || before.dev !== stat.dev || before.ino !== stat.ino ||
      before.size !== stat.size || before.nlink !== stat.nlink) {
      fail("launcher executable changed between path and descriptor observation");
    }
    bytes = readFileSync(descriptor);
    after = fstatSync(descriptor, { bigint: true });
  } finally {
    if (descriptor !== null) closeSync(descriptor);
  }
  if (before.dev !== after.dev || before.ino !== after.ino || before.size !== after.size ||
    before.nlink !== after.nlink) {
    fail("launcher executable changed while its exact bytes were hashed");
  }
  const byteLength = Number(after.size);
  if (!Number.isSafeInteger(byteLength) || byteLength <= 0) {
    fail("launcher executable byte length is not a positive safe integer");
  }
  return Object.freeze({
    path: physicalPath,
    byteLength,
    sha256: createHash("sha256").update(bytes).digest("hex"),
  });
}

const PRODUCTION_IO: Phase10C0VS6UntrustedLauncherChannelIO = Object.freeze({
  readFileDescriptor: READ_FILE_DESCRIPTOR,
  writeFileDescriptor: WRITE_FILE_DESCRIPTOR,
  randomBytes: (byteLength: 32): Uint8Array =>
    new Uint8Array(cryptographicRandomBytes(byteLength)),
  monotonicNowNanoseconds: (): bigint => nodeProcess.hrtime.bigint(),
  readAvailableSync: (
    fileDescriptor: 0,
    buffer: Uint8Array,
    offset: number,
    byteLength: number,
  ): number | null => {
    try {
      return readFileDescriptorSync(fileDescriptor, buffer, offset, byteLength, null);
    } catch (error) {
      const code = error !== null && typeof error === "object" && "code" in error
        ? (error as { readonly code?: unknown }).code
        : undefined;
      if (code === "EAGAIN" || code === "EWOULDBLOCK") return null;
      throw error;
    }
  },
  pausePolling: (milliseconds: 1): void => {
    if (milliseconds !== POLL_INTERVAL_MILLISECONDS) {
      fail("launcher response poll interval differs from its exact implementation");
    }
    Atomics.wait(POLL_WORD, 0, 0, milliseconds);
  },
  writeSync: (
    fileDescriptor: 1,
    buffer: Uint8Array,
    offset: number,
    byteLength: number,
  ): number => writeFileDescriptorSync(fileDescriptor, buffer, offset, byteLength),
  childPid: (): number => nodeProcess.pid,
  parentPid: (): number => nodeProcess.ppid,
  observeLauncherExecutable: observeProductionLauncherExecutable,
});

/**
 * Open and authenticate sequence zero using only production fd0/fd1, crypto, process identity,
 * monotonic clock, and fresh descriptor-hashed launcher bytes. A null/planned catalogue identity
 * fails before any control-channel byte is written.
 */
export function phase10C0VS6OpenLauncherChannel(
  authority: Phase10C0VS6LauncherChannelAuthority,
): Phase10C0VS6ProductionLauncherChannelSession {
  const session = createSession(authority, PRODUCTION_IO);
  PRODUCTION_SESSIONS.add(session);
  return session as Phase10C0VS6ProductionLauncherChannelSession;
}

/**
 * Exercise the exact codec and state machine with injected synchronous I/O. The returned session
 * is intentionally untrusted and fails the production-session assertion below.
 */
export function phase10C0VS6OpenUntrustedLauncherChannel(
  authority: Phase10C0VS6LauncherChannelAuthority,
  io: Phase10C0VS6UntrustedLauncherChannelIO,
): Phase10C0VS6LauncherChannelSession {
  return createSession(authority, io);
}

/** Runtime guard used by the executor before treating a channel as pre-argument launch authority. */
export function phase10C0VS6AssertProductionLauncherChannel(
  value: unknown,
): asserts value is Phase10C0VS6ProductionLauncherChannelSession {
  if (value === null || typeof value !== "object" ||
    !PRODUCTION_SESSIONS.has(value as Phase10C0VS6LauncherChannelSession)) {
    fail("launcher channel is not a production-opened authenticated session");
  }
  const state = sessionState(value as Phase10C0VS6LauncherChannelSession);
  if (state.status !== "open" || state.mode !== null || state.roster !== null ||
    state.runRosters !== null || state.selectedRunSubrouteId !== null ||
    state.acceptedRequests.length !== 1 || state.nextSequence !== 1 || state.rosterIndex !== 0 ||
    state.acceptedRequests[0]?.kind !== "initial-auth" ||
    state.acceptedRequests[0].boundaryId !== INITIAL_BOUNDARY_ID) {
    fail("production launcher channel is not at the exact authenticated pre-argument boundary");
  }
}

/** Runtime guard used immediately before emitting executor output after the terminal exchange. */
export function phase10C0VS6AssertProductionLauncherOutputReleased(
  value: unknown,
): asserts value is Phase10C0VS6ProductionLauncherChannelSession {
  if (value === null || typeof value !== "object" ||
    !PRODUCTION_SESSIONS.has(value as Phase10C0VS6LauncherChannelSession)) {
    fail("launcher channel is not a production-opened authenticated session");
  }
  const state = sessionState(value as Phase10C0VS6LauncherChannelSession);
  if (state.status !== "success-complete" || state.roster === null ||
    state.rosterIndex !== state.roster.length || state.acceptedRequests.at(-1)?.kind !== "release-output") {
    fail("production launcher channel has not completed release-last success");
  }
}
