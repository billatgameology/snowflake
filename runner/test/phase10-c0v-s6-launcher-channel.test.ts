import { Buffer } from "node:buffer";
import { describe, expect, it } from "vitest";
import {
  PHASE10_C0V_S6_LAUNCHER_AUTHENTICATION_TIMEOUT_MILLISECONDS,
  PHASE10_C0V_S6_LAUNCHER_FRAME_BYTES_MAXIMUM,
  phase10C0VS6AssertProductionLauncherChannel,
  phase10C0VS6AssertProductionLauncherOutputReleased,
  phase10C0VS6LauncherRequestLine,
  phase10C0VS6OpenLauncherChannel,
  phase10C0VS6OpenUntrustedLauncherChannel,
  phase10C0VS6ParseLauncherResponseLine,
  type Phase10C0VS6LauncherBoundaryAuthority,
  type Phase10C0VS6LauncherChannelAuthority,
  type Phase10C0VS6LauncherRequest,
  type Phase10C0VS6LauncherRunBoundaryRosterAuthority,
  type Phase10C0VS6ResolvedLauncherExecutableIdentity,
  type Phase10C0VS6UntrustedLauncherChannelIO,
} from "../src/phase10-c0v-s6-launcher-channel.ts";

const CHILD_PID = 12_345;
const LAUNCHER_PID = 54_321;
const IDENTITY = Object.freeze({
  path: "G:/Code Files/snowflake-phase10-evidence/runner/native/phase10-c0v-s6-launcher-win32-x64.exe",
  byteLength: 98_765,
  sha256: "a".repeat(64),
}) satisfies Phase10C0VS6ResolvedLauncherExecutableIdentity;

const AUTHORITY = Object.freeze({
  launcherExecutable: IDENTITY,
}) satisfies Phase10C0VS6LauncherChannelAuthority;

const INITIAL = Object.freeze({
  kind: "initial-auth",
  boundaryId: "entry-before-arguments",
}) satisfies Phase10C0VS6LauncherBoundaryAuthority;

const BOUNDARY_A = Object.freeze({
  kind: "boundary-recheck",
  boundaryId: "publication-stage:evidence/example.json.stage-attempt-v1",
}) satisfies Phase10C0VS6LauncherBoundaryAuthority;

const BOUNDARY_B = Object.freeze({
  kind: "boundary-recheck",
  boundaryId: "publication-install:evidence/example.json",
}) satisfies Phase10C0VS6LauncherBoundaryAuthority;

const BOUNDARY_C = Object.freeze({
  kind: "boundary-recheck",
  boundaryId: "publication-stage:evidence/selected-a.json.stage-attempt-v1",
}) satisfies Phase10C0VS6LauncherBoundaryAuthority;

const BOUNDARY_D = Object.freeze({
  kind: "boundary-recheck",
  boundaryId: "publication-stage:evidence/selected-b.json.stage-attempt-v1",
}) satisfies Phase10C0VS6LauncherBoundaryAuthority;

const TERMINAL_CANDIDATE = Object.freeze({
  kind: "boundary-recheck",
  boundaryId: "terminal-candidate:out/example/terminal-success-candidate.json",
}) satisfies Phase10C0VS6LauncherBoundaryAuthority;

const RELEASE = Object.freeze({
  kind: "release-output",
  boundaryId: "release-output",
}) satisfies Phase10C0VS6LauncherBoundaryAuthority;

const CHECK_ROSTER = Object.freeze([INITIAL, RELEASE]);
const RUN_ROSTER = Object.freeze([INITIAL, BOUNDARY_A, BOUNDARY_B, BOUNDARY_C, RELEASE]);
const RUN_ROSTERS = Object.freeze([
  Object.freeze({ subrouteId: "route-a", requests: RUN_ROSTER }),
  Object.freeze({
    subrouteId: "route-b",
    requests: Object.freeze([INITIAL, BOUNDARY_A, BOUNDARY_B, BOUNDARY_D, RELEASE]),
  }),
] as const) satisfies readonly Phase10C0VS6LauncherRunBoundaryRosterAuthority[];

function oneRunRoster(
  requests: readonly Phase10C0VS6LauncherBoundaryAuthority[],
  subrouteId = "route-a",
): readonly Phase10C0VS6LauncherRunBoundaryRosterAuthority[] {
  return Object.freeze([Object.freeze({ subrouteId, requests })]);
}

function bytes(value: unknown): Uint8Array {
  return new TextEncoder().encode(`${JSON.stringify(value)}\n`);
}

function responseFor(
  request: Phase10C0VS6LauncherRequest,
  launcherExecutable: Phase10C0VS6ResolvedLauncherExecutableIdentity = IDENTITY,
): Record<string, unknown> {
  return {
    schema: "phase10-c0v-s6-launcher-response-v1",
    domain: "phase10-c0v-s6-native-launcher-auth-v1",
    sequence: request.sequence,
    kind: request.kind,
    boundaryId: request.boundaryId,
    launcherVersion: "phase10-c0v-s6-native-launcher-v1",
    launcherPid: LAUNCHER_PID,
    childPid: CHILD_PID,
    challenge: request.challenge,
    launcherExecutable,
  };
}

interface HarnessOptions {
  readonly randomFillBytes?: readonly number[];
  readonly clockNanoseconds?: readonly bigint[];
  readonly parentPids?: readonly number[];
  readonly responseBytes?: (
    response: Record<string, unknown>,
    request: Phase10C0VS6LauncherRequest,
    requestIndex: number,
  ) => Uint8Array;
  readonly observedIdentity?: (
    requestIndex: number,
  ) => Phase10C0VS6ResolvedLauncherExecutableIdentity;
  readonly responseWouldBlockReads?: readonly number[];
  readonly releaseEofWouldBlockReads?: number;
  readonly deferredUnsolicitedBytes?: (
    requestIndex: number,
  ) => Uint8Array | null;
  readonly eofBeforeResponse?: (requestIndex: number) => boolean;
  readonly readErrorBeforeResponse?: (requestIndex: number) => Error | null;
}

interface Harness {
  readonly io: Phase10C0VS6UntrustedLauncherChannelIO;
  readonly requests: Phase10C0VS6LauncherRequest[];
}

function makeHarness(options: HarnessOptions = {}): Harness {
  const requests: Phase10C0VS6LauncherRequest[] = [];
  let pendingRequest = Buffer.alloc(0);
  let pendingResponse = Buffer.alloc(0);
  let pendingResponseWouldBlockReads = 0;
  let pendingUnsolicited = Buffer.alloc(0);
  let unsolicitedWouldBlockReads = 0;
  let endAfterResponse = false;
  let responsePipeEnded = false;
  let releaseEofWouldBlockReads = options.releaseEofWouldBlockReads ?? 0;
  let randomIndex = 0;
  let clockIndex = 0;
  let defaultClock = 0n;
  let parentPidIndex = 0;
  let observedRequestIndex = -1;
  const io: Phase10C0VS6UntrustedLauncherChannelIO = {
    readFileDescriptor: 0,
    writeFileDescriptor: 1,
    randomBytes(byteLength: 32): Uint8Array {
      expect(byteLength).toBe(32);
      const fill = options.randomFillBytes?.[randomIndex] ?? randomIndex + 1;
      randomIndex += 1;
      return new Uint8Array(32).fill(fill);
    },
    monotonicNowNanoseconds(): bigint {
      const registered = options.clockNanoseconds?.[clockIndex];
      clockIndex += 1;
      if (registered !== undefined) return registered;
      const value = defaultClock;
      defaultClock += 1n;
      return value;
    },
    readAvailableSync(_fileDescriptor, target, offset, byteLength): number | null {
      if (responsePipeEnded) return 0;
      if (pendingUnsolicited.byteLength > 0) {
        if (unsolicitedWouldBlockReads > 0) {
          unsolicitedWouldBlockReads -= 1;
          return null;
        }
        const count = Math.min(byteLength, pendingUnsolicited.byteLength);
        target.set(pendingUnsolicited.subarray(0, count), offset);
        pendingUnsolicited = pendingUnsolicited.subarray(count);
        return count;
      }
      if (pendingResponse.byteLength > 0 && pendingResponseWouldBlockReads > 0) {
        pendingResponseWouldBlockReads -= 1;
        return null;
      }
      if (pendingResponse.byteLength === 0) {
        if (endAfterResponse) {
          if (releaseEofWouldBlockReads > 0) {
            releaseEofWouldBlockReads -= 1;
            return null;
          }
          responsePipeEnded = true;
          return 0;
        }
        if (pendingRequest.byteLength === 0) return null;
        const nextRequestIndex = requests.length;
        const injectedReadError = options.readErrorBeforeResponse?.(nextRequestIndex) ?? null;
        if (injectedReadError !== null) throw injectedReadError;
        if (options.eofBeforeResponse?.(nextRequestIndex) === true) {
          responsePipeEnded = true;
          return 0;
        }
        const newline = pendingRequest.indexOf(0x0a);
        if (newline < 0 || newline + 1 !== pendingRequest.byteLength) {
          throw new Error("test launcher did not receive one exact request frame");
        }
        const request = JSON.parse(pendingRequest.toString("utf8", 0, newline)) as Phase10C0VS6LauncherRequest;
        requests.push(request);
        observedRequestIndex = requests.length - 1;
        const response = responseFor(request);
        pendingResponse = Buffer.from(options.responseBytes?.(
          response,
          request,
          observedRequestIndex,
        ) ?? bytes(response));
        pendingResponseWouldBlockReads = options.responseWouldBlockReads?.[observedRequestIndex] ?? 0;
        endAfterResponse = request.kind === "release-output";
        pendingRequest = Buffer.alloc(0);
        if (pendingResponseWouldBlockReads > 0) {
          pendingResponseWouldBlockReads -= 1;
          return null;
        }
      }
      const count = Math.min(byteLength, pendingResponse.byteLength);
      target.set(pendingResponse.subarray(0, count), offset);
      pendingResponse = pendingResponse.subarray(count);
      if (pendingResponse.byteLength === 0) {
        const deferred = options.deferredUnsolicitedBytes?.(observedRequestIndex) ?? null;
        if (deferred !== null) {
          pendingUnsolicited = Buffer.from(deferred);
          unsolicitedWouldBlockReads = 1;
        }
      }
      return count;
    },
    pausePolling(milliseconds: 1): void {
      expect(milliseconds).toBe(1);
    },
    writeSync(_fileDescriptor, source, offset, byteLength): number {
      pendingRequest = Buffer.concat([
        pendingRequest,
        Buffer.from(source.subarray(offset, offset + byteLength)),
      ]);
      return byteLength;
    },
    childPid(): number {
      return CHILD_PID;
    },
    parentPid(): number {
      const registered = options.parentPids?.[parentPidIndex];
      parentPidIndex += 1;
      return registered ?? LAUNCHER_PID;
    },
    observeLauncherExecutable(): Phase10C0VS6ResolvedLauncherExecutableIdentity {
      return options.observedIdentity?.(observedRequestIndex) ?? IDENTITY;
    },
  };
  return { io, requests };
}

function openHarness(options: HarnessOptions = {}): ReturnType<typeof phase10C0VS6OpenUntrustedLauncherChannel> {
  const testHarness = makeHarness(options);
  return phase10C0VS6OpenUntrustedLauncherChannel(AUTHORITY, testHarness.io);
}

describe("Phase 10 C0V S6 launcher channel codec", () => {
  it("encodes the exact compact request field order with one LF inside the 4096-byte bound", () => {
    const request: Phase10C0VS6LauncherRequest = {
      schema: "phase10-c0v-s6-launcher-challenge-v1",
      domain: "phase10-c0v-s6-native-launcher-auth-v1",
      sequence: 0,
      kind: "initial-auth",
      boundaryId: "entry-before-arguments",
      childPid: CHILD_PID,
      challenge: "01".repeat(32),
    };
    const line = phase10C0VS6LauncherRequestLine(request);
    expect(new TextDecoder().decode(line)).toBe(
      `{"schema":"phase10-c0v-s6-launcher-challenge-v1","domain":"phase10-c0v-s6-native-launcher-auth-v1","sequence":0,"kind":"initial-auth","boundaryId":"entry-before-arguments","childPid":12345,"challenge":"${"01".repeat(32)}"}\n`,
    );
    expect(line.byteLength).toBeLessThanOrEqual(PHASE10_C0V_S6_LAUNCHER_FRAME_BYTES_MAXIMUM);
  });

  it("rejects noncanonical, reordered, duplicate, extra, and oversized response frames", () => {
    const attacks: readonly ((response: Record<string, unknown>) => Uint8Array)[] = [
      (response) => new TextEncoder().encode(` ${JSON.stringify(response)}\n`),
      (response) => {
        const { schema, ...rest } = response;
        return bytes({ ...rest, schema });
      },
      (response) => {
        const encoded = bytes(response);
        return new Uint8Array([...encoded, ...encoded]);
      },
      (response) => bytes({ ...response, extra: true }),
      (response) => new TextEncoder().encode(`${JSON.stringify(response)} \n`),
      (response) => bytes({
        ...response,
        launcherExecutable: {
          path: `G:/${"x".repeat(PHASE10_C0V_S6_LAUNCHER_FRAME_BYTES_MAXIMUM)}`,
          byteLength: IDENTITY.byteLength,
          sha256: IDENTITY.sha256,
        },
      }),
    ];
    for (const attack of attacks) {
      const harness = makeHarness({ responseBytes: (response) => attack(response) });
      expect(() => phase10C0VS6OpenUntrustedLauncherChannel(AUTHORITY, harness.io)).toThrow(
        /launcher channel refused/u,
      );
    }
  });

  it("parses only the exact canonical response schema and nested image field order", () => {
    const request: Phase10C0VS6LauncherRequest = {
      schema: "phase10-c0v-s6-launcher-challenge-v1",
      domain: "phase10-c0v-s6-native-launcher-auth-v1",
      sequence: 0,
      kind: "initial-auth",
      boundaryId: "entry-before-arguments",
      childPid: CHILD_PID,
      challenge: "01".repeat(32),
    };
    expect(phase10C0VS6ParseLauncherResponseLine(bytes(responseFor(request)))).toMatchObject({
      sequence: 0,
      launcherPid: LAUNCHER_PID,
      launcherExecutable: IDENTITY,
    });
    const reorderedIdentity = {
      sha256: IDENTITY.sha256,
      path: IDENTITY.path,
      byteLength: IDENTITY.byteLength,
    };
    expect(() => phase10C0VS6ParseLauncherResponseLine(
      bytes(responseFor(request, reorderedIdentity)),
    )).toThrow(/executable fields or field order differ/u);
  });
});

describe("Phase 10 C0V S6 launcher channel session", () => {
  it("uses zero-based contiguous sequence, fresh challenges, exact echo, and release-last success", () => {
    const harness = makeHarness();
    const session = phase10C0VS6OpenUntrustedLauncherChannel(AUTHORITY, harness.io);
    session.bindExactRoster("run", RUN_ROSTERS);
    session.authenticateBoundary(BOUNDARY_A);
    session.authenticateBoundary(BOUNDARY_B);
    session.selectRunSubroute("route-a");
    session.authenticateBoundary(BOUNDARY_C);
    expect(session.releaseOutput()).toEqual({
      outcome: "success",
      mode: "run",
      acceptedRequestCount: 5,
      outputReleased: true,
    });
    expect(harness.requests.map((request) => ({
      sequence: request.sequence,
      kind: request.kind,
      boundaryId: request.boundaryId,
      childPid: request.childPid,
      challenge: request.challenge,
    }))).toEqual([
      { sequence: 0, kind: "initial-auth", boundaryId: "entry-before-arguments", childPid: CHILD_PID, challenge: "01".repeat(32) },
      { sequence: 1, kind: "boundary-recheck", boundaryId: BOUNDARY_A.boundaryId, childPid: CHILD_PID, challenge: "02".repeat(32) },
      { sequence: 2, kind: "boundary-recheck", boundaryId: BOUNDARY_B.boundaryId, childPid: CHILD_PID, challenge: "03".repeat(32) },
      { sequence: 3, kind: "boundary-recheck", boundaryId: BOUNDARY_C.boundaryId, childPid: CHILD_PID, challenge: "04".repeat(32) },
      { sequence: 4, kind: "release-output", boundaryId: "release-output", childPid: CHILD_PID, challenge: "05".repeat(32) },
    ]);
  });

  it("allows the exact two-request check roster", () => {
    const harness = makeHarness();
    const session = phase10C0VS6OpenUntrustedLauncherChannel(AUTHORITY, harness.io);
    session.bindExactRoster("check", CHECK_ROSTER);
    expect(session.releaseOutput()).toMatchObject({ outcome: "success", acceptedRequestCount: 2 });
    expect(harness.requests.map((request) => request.kind)).toEqual(["initial-auth", "release-output"]);
  });

  it("authenticates only the common run prefix before raw authority selects one subroute", () => {
    const divergent = openHarness();
    divergent.bindExactRoster("run", RUN_ROSTERS);
    expect(() => divergent.selectRunSubroute("route-a")).toThrow(
      /only after the exact preflight stage\/install prefix/u,
    );

    const divergenceAtOutcome = openHarness();
    divergenceAtOutcome.bindExactRoster("run", RUN_ROSTERS);
    divergenceAtOutcome.authenticateBoundary(BOUNDARY_A);
    divergenceAtOutcome.authenticateBoundary(BOUNDARY_B);
    expect(() => divergenceAtOutcome.authenticateBoundary(BOUNDARY_C)).toThrow(
      /subroute must be selected before its exact rosters diverge/u,
    );

    const terminalBeforeSelection = openHarness();
    terminalBeforeSelection.bindExactRoster("run", Object.freeze([
      Object.freeze({
        subrouteId: "route-a",
        requests: Object.freeze([INITIAL, BOUNDARY_A, BOUNDARY_B, TERMINAL_CANDIDATE, BOUNDARY_C, RELEASE]),
      }),
      Object.freeze({
        subrouteId: "route-b",
        requests: Object.freeze([INITIAL, BOUNDARY_A, BOUNDARY_B, TERMINAL_CANDIDATE, BOUNDARY_D, RELEASE]),
      }),
    ]));
    terminalBeforeSelection.authenticateBoundary(BOUNDARY_A);
    terminalBeforeSelection.authenticateBoundary(BOUNDARY_B);
    expect(() => terminalBeforeSelection.authenticateBoundary(TERMINAL_CANDIDATE)).toThrow(
      /selected before terminal-candidate publication/u,
    );

    const selected = openHarness();
    selected.bindExactRoster("run", RUN_ROSTERS);
    selected.authenticateBoundary(BOUNDARY_A);
    selected.authenticateBoundary(BOUNDARY_B);
    expect(() => selected.selectRunSubroute("absent-route")).toThrow(/absent or duplicated/u);

    const repeated = openHarness();
    repeated.bindExactRoster("run", RUN_ROSTERS);
    repeated.authenticateBoundary(BOUNDARY_A);
    repeated.authenticateBoundary(BOUNDARY_B);
    repeated.selectRunSubroute("route-b");
    expect(() => repeated.selectRunSubroute("route-b")).toThrow(/selected exactly once/u);
  });

  it("rejects stale or cross-session challenges and repeated RNG output", () => {
    const stale = makeHarness({
      responseBytes: (response, _request, requestIndex) => bytes(requestIndex === 1
        ? { ...response, challenge: "01".repeat(32) }
        : response),
    });
    const staleSession = phase10C0VS6OpenUntrustedLauncherChannel(AUTHORITY, stale.io);
    staleSession.bindExactRoster("check", CHECK_ROSTER);
    expect(() => staleSession.releaseOutput()).toThrow(/does not exactly echo/u);

    const replay = makeHarness({
      randomFillBytes: [9],
      responseBytes: (response) => bytes({ ...response, challenge: "01".repeat(32) }),
    });
    expect(() => phase10C0VS6OpenUntrustedLauncherChannel(AUTHORITY, replay.io)).toThrow(
      /does not exactly echo/u,
    );

    const duplicateRandom = makeHarness({ randomFillBytes: [1, 1] });
    const duplicateSession = phase10C0VS6OpenUntrustedLauncherChannel(AUTHORITY, duplicateRandom.io);
    duplicateSession.bindExactRoster("check", CHECK_ROSTER);
    expect(() => duplicateSession.releaseOutput()).toThrow(/challenge is not fresh/u);
  });

  it.each([
    ["sequence", (response: Record<string, unknown>) => ({ ...response, sequence: 1 })],
    ["kind", (response: Record<string, unknown>) => ({ ...response, kind: "boundary-recheck" })],
    ["boundary", (response: Record<string, unknown>) => ({ ...response, boundaryId: "wrong" })],
    ["child PID", (response: Record<string, unknown>) => ({ ...response, childPid: CHILD_PID + 1 })],
    ["launcher PID", (response: Record<string, unknown>) => ({ ...response, launcherPid: LAUNCHER_PID + 1 })],
  ])("rejects a wrong echoed %s", (_label, mutate) => {
    const harness = makeHarness({ responseBytes: (response) => bytes(mutate(response)) });
    expect(() => phase10C0VS6OpenUntrustedLauncherChannel(AUTHORITY, harness.io)).toThrow(
      /launcher channel refused/u,
    );
  });

  it("rechecks the live parent PID and fixed launcher PID at every boundary", () => {
    const harness = makeHarness({ parentPids: [LAUNCHER_PID, LAUNCHER_PID + 7] });
    const session = phase10C0VS6OpenUntrustedLauncherChannel(AUTHORITY, harness.io);
    session.bindExactRoster("check", CHECK_ROSTER);
    expect(() => session.releaseOutput()).toThrow(/PID binding differs/u);
  });

  it("rejects both a launcher-reported image drift and a freshly observed image drift", () => {
    const changed = Object.freeze({ ...IDENTITY, sha256: "b".repeat(64) });
    const reported = makeHarness({
      responseBytes: (_response, request) => bytes(responseFor(request, changed)),
    });
    expect(() => phase10C0VS6OpenUntrustedLauncherChannel(AUTHORITY, reported.io)).toThrow(
      /reported executable identity differs/u,
    );

    const observed = makeHarness({ observedIdentity: () => changed });
    expect(() => phase10C0VS6OpenUntrustedLauncherChannel(AUTHORITY, observed.io)).toThrow(
      /fresh launcher executable observation differs/u,
    );
  });

  it("accepts exactly 30000ms and rejects 30001ms and a regressing monotonic clock", () => {
    const timeoutNanoseconds =
      BigInt(PHASE10_C0V_S6_LAUNCHER_AUTHENTICATION_TIMEOUT_MILLISECONDS) * 1_000_000n;
    const equality = makeHarness({
      clockNanoseconds: [100n, 100n + timeoutNanoseconds, 100n + timeoutNanoseconds],
    });
    expect(() => phase10C0VS6OpenUntrustedLauncherChannel(AUTHORITY, equality.io)).not.toThrow();

    const over = makeHarness({ clockNanoseconds: [100n, 101n + timeoutNanoseconds] });
    expect(() => phase10C0VS6OpenUntrustedLauncherChannel(AUTHORITY, over.io)).toThrow(
      /exceeded the exact 30000ms/u,
    );

    const regression = makeHarness({ clockNanoseconds: [100n, 99n] });
    expect(() => phase10C0VS6OpenUntrustedLauncherChannel(AUTHORITY, regression.io)).toThrow(
      /not nonnegative monotonic/u,
    );
  });

  it("polls an empty live pipe and includes release-response EOF in the exact deadline", () => {
    const timeoutNanoseconds =
      BigInt(PHASE10_C0V_S6_LAUNCHER_AUTHENTICATION_TIMEOUT_MILLISECONDS) * 1_000_000n;
    const silent = makeHarness({
      responseWouldBlockReads: [2],
      clockNanoseconds: [0n, timeoutNanoseconds, timeoutNanoseconds + 1n],
    });
    expect(() => phase10C0VS6OpenUntrustedLauncherChannel(AUTHORITY, silent.io)).toThrow(
      /exceeded the exact 30000ms/u,
    );

    const equality = makeHarness({
      releaseEofWouldBlockReads: 1,
      clockNanoseconds: [
        0n, 1n,
        100n, 100n + timeoutNanoseconds, 100n + timeoutNanoseconds,
        100n + timeoutNanoseconds,
      ],
    });
    const equalitySession = phase10C0VS6OpenUntrustedLauncherChannel(AUTHORITY, equality.io);
    equalitySession.bindExactRoster("check", CHECK_ROSTER);
    expect(() => equalitySession.releaseOutput()).not.toThrow();

    const over = makeHarness({
      releaseEofWouldBlockReads: 1,
      clockNanoseconds: [
        0n, 1n,
        100n, 100n + timeoutNanoseconds, 100n + timeoutNanoseconds,
        101n + timeoutNanoseconds,
      ],
    });
    const overSession = phase10C0VS6OpenUntrustedLauncherChannel(AUTHORITY, over.io);
    overSession.bindExactRoster("check", CHECK_ROSTER);
    expect(() => overSession.releaseOutput()).toThrow(/exceeded the exact 30000ms/u);
  });

  it("rejects a response byte that arrives after the prior immediate drain before the next request", () => {
    const harness = makeHarness({
      deferredUnsolicitedBytes: (requestIndex) => requestIndex === 0
        ? new TextEncoder().encode("x")
        : null,
    });
    const session = phase10C0VS6OpenUntrustedLauncherChannel(AUTHORITY, harness.io);
    session.bindExactRoster("check", CHECK_ROSTER);
    expect(() => session.releaseOutput()).toThrow(/extra or unsolicited response byte before/u);
    expect(harness.requests).toHaveLength(1);
  });

  it("rejects an intervening byte after a canonical release response and one would-block poll before EOF", () => {
    const harness = makeHarness({
      deferredUnsolicitedBytes: (requestIndex) => requestIndex === 1
        ? new TextEncoder().encode("x")
        : null,
    });
    const session = phase10C0VS6OpenUntrustedLauncherChannel(AUTHORITY, harness.io);
    session.bindExactRoster("check", CHECK_ROSTER);
    expect(() => session.releaseOutput()).toThrow(
      /extra or unsolicited response byte after one exact response/u,
    );
    expect(harness.requests.map((request) => request.kind)).toEqual([
      "initial-auth",
      "release-output",
    ]);
  });

  it("rejects premature response-pipe EOF before one response arrives", () => {
    const harness = makeHarness({ eofBeforeResponse: (requestIndex) => requestIndex === 0 });
    expect(() => phase10C0VS6OpenUntrustedLauncherChannel(AUTHORITY, harness.io)).toThrow(
      /response pipe ended before one exact response/u,
    );
  });

  it("propagates a non-EAGAIN response-pipe read error and refuses authentication", () => {
    const error = Object.assign(new Error("synthetic non-EAGAIN response-pipe failure"), {
      code: "EIO",
    });
    const harness = makeHarness({ readErrorBeforeResponse: () => error });
    expect(() => phase10C0VS6OpenUntrustedLauncherChannel(AUTHORITY, harness.io)).toThrow(error);
  });

  it("rejects malformed roster structure, premature release, order drift, duplicates, and extras", () => {
    const earlyRelease = openHarness();
    expect(() => earlyRelease.bindExactRoster("run", oneRunRoster([INITIAL, RELEASE, BOUNDARY_A]))).toThrow(
      /start with exact initial auth and end with exact output release/u,
    );

    const duplicateId = openHarness();
    expect(() => duplicateId.bindExactRoster(
      "run",
      oneRunRoster([INITIAL, BOUNDARY_A, BOUNDARY_A, RELEASE]),
    )).toThrow(
      /duplicate boundary ID/u,
    );

    const checkExtra = openHarness();
    expect(() => checkExtra.bindExactRoster("check", [INITIAL, BOUNDARY_A, RELEASE])).toThrow(
      /check launcher boundary roster/u,
    );

    const premature = openHarness();
    premature.bindExactRoster("run", oneRunRoster(RUN_ROSTER));
    premature.authenticateBoundary(BOUNDARY_A);
    premature.authenticateBoundary(BOUNDARY_B);
    premature.selectRunSubroute("route-a");
    expect(() => premature.releaseOutput()).toThrow(/output release is premature/u);

    const reordered = openHarness();
    reordered.bindExactRoster("run", oneRunRoster(RUN_ROSTER));
    reordered.authenticateBoundary(BOUNDARY_A);
    reordered.authenticateBoundary(BOUNDARY_B);
    reordered.selectRunSubroute("route-a");
    expect(() => reordered.authenticateBoundary(BOUNDARY_D)).toThrow(/duplicate, extra, omitted, or reordered/u);

    const duplicate = openHarness();
    duplicate.bindExactRoster("run", oneRunRoster(RUN_ROSTER));
    duplicate.authenticateBoundary(BOUNDARY_A);
    duplicate.authenticateBoundary(BOUNDARY_B);
    duplicate.selectRunSubroute("route-a");
    duplicate.authenticateBoundary(BOUNDARY_C);
    expect(() => duplicate.authenticateBoundary(BOUNDARY_C)).toThrow(/duplicate, extra, omitted, or reordered/u);

    const extra = openHarness();
    extra.bindExactRoster("check", CHECK_ROSTER);
    extra.releaseOutput();
    expect(() => extra.authenticateBoundary(BOUNDARY_A)).toThrow(/before one exact roster is bound/u);
  });

  it("snapshots the bound roster and rejects post-bind mutable roster drift or a second bind", () => {
    const mutableBoundary: { kind: "boundary-recheck"; boundaryId: string } = {
      kind: "boundary-recheck",
      boundaryId: BOUNDARY_C.boundaryId,
    };
    const mutableRoster = [INITIAL, BOUNDARY_A, BOUNDARY_B, mutableBoundary, RELEASE];
    const drift = openHarness();
    drift.bindExactRoster("run", oneRunRoster(mutableRoster));
    drift.authenticateBoundary(BOUNDARY_A);
    drift.authenticateBoundary(BOUNDARY_B);
    drift.selectRunSubroute("route-a");
    mutableBoundary.boundaryId = "publication-stage:evidence/drifted.json";
    expect(() => drift.authenticateBoundary(mutableBoundary)).toThrow(/duplicate, extra, omitted, or reordered/u);

    const rebound = openHarness();
    rebound.bindExactRoster("check", CHECK_ROSTER);
    expect(() => rebound.bindExactRoster("check", CHECK_ROSTER)).toThrow(/bound exactly once/u);
  });

  it("rejects a method replay with a forged or cross-session receiver", () => {
    const left = openHarness();
    const right = openHarness({ randomFillBytes: [9] });
    left.bindExactRoster("run", oneRunRoster(RUN_ROSTER));
    right.bindExactRoster("run", oneRunRoster(RUN_ROSTER));
    left.authenticateBoundary(BOUNDARY_A);
    left.authenticateBoundary(BOUNDARY_B);
    right.authenticateBoundary(BOUNDARY_A);
    right.authenticateBoundary(BOUNDARY_B);
    left.selectRunSubroute("route-a");
    right.selectRunSubroute("route-a");
    expect(() => left.authenticateBoundary.call(right, BOUNDARY_C)).toThrow(
      /method receiver is forged or cross-session/u,
    );
    left.authenticateBoundary(BOUNDARY_C);
    right.authenticateBoundary(BOUNDARY_C);
  });

  it("completes only a strict non-release failure prefix and seals the session", () => {
    const session = openHarness();
    session.bindExactRoster("run", RUN_ROSTERS);
    session.authenticateBoundary(BOUNDARY_A);
    expect(session.completeFailure()).toEqual({
      outcome: "failure",
      mode: "run",
      acceptedRequestCount: 2,
      outputReleased: false,
    });
    expect(() => session.authenticateBoundary(BOUNDARY_B)).toThrow(/before one exact roster is bound/u);
    expect(() => session.completeFailure()).toThrow(/requires one exact bound roster/u);
  });

  it("fails closed when the resolved launcher identity is absent and never trusts injected I/O", () => {
    expect(() => phase10C0VS6OpenLauncherChannel({ launcherExecutable: null })).toThrow(
      /resolved launcher executable identity is absent/u,
    );
    const session = openHarness();
    session.bindExactRoster("check", CHECK_ROSTER);
    session.releaseOutput();
    expect(() => phase10C0VS6AssertProductionLauncherChannel(session)).toThrow(
      /not a production-opened authenticated session/u,
    );
    expect(() => phase10C0VS6AssertProductionLauncherOutputReleased(session)).toThrow(
      /not a production-opened authenticated session/u,
    );
  });
});
