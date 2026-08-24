import { hrtime } from "node:process";

export interface Phase10C0VS6ParentWatchdogContext {
  readonly signal: AbortSignal;
  readonly startedAtMonotonicNanoseconds: bigint;
  assertActive(): void;
  registerTerminationTarget(
    terminateAndQuiesce: (reason: Error) => void | Promise<void>,
  ): () => void;
}

export interface Phase10C0VS6GovernedLeafResult<T> {
  readonly terminalState: "complete" | "registered-cap";
  readonly startedAtMonotonicNanoseconds: bigint;
  readonly finishedAtMonotonicNanoseconds: bigint;
  readonly elapsedNanoseconds: number;
  readonly value: T | null;
}

/**
 * Opaque parent-clock boundary captured at one complete child LF arrival. Runtime authenticity is
 * carried by a private WeakMap; a structurally similar caller object has no authority.
 */
export interface Phase10C0VS6GovernedLeafArrivalTransition {
  readonly phase10C0VS6GovernedLeafArrivalTransition: true;
}

/** Opaque parent-clock completion boundary issued only by one active governed leaf. */
export interface Phase10C0VS6GovernedLeafCompletion<T> {
  readonly value: T;
  readonly startedAtMonotonicNanoseconds: bigint;
  readonly finishedAtMonotonicNanoseconds: bigint;
  readonly elapsedNanoseconds: number;
}

export class Phase10C0VS6ParentTimeoutError extends Error {
  readonly elapsedNanoseconds: number;
  readonly maximumElapsedNanoseconds: number;

  constructor(label: string, elapsedNanoseconds: number, maximumElapsedNanoseconds: number) {
    super(
      `Phase 10 C0V S6 ${label} exceeded its parent-monotonic limit ` +
      `${maximumElapsedNanoseconds} ns (observed ${elapsedNanoseconds} ns); fail-stop with stale locks`,
    );
    this.name = "Phase10C0VS6ParentTimeoutError";
    this.elapsedNanoseconds = elapsedNanoseconds;
    this.maximumElapsedNanoseconds = maximumElapsedNanoseconds;
  }
}

interface WatchdogState {
  readonly controller: AbortController;
  readonly startedAt: bigint;
  readonly maximumElapsedNanoseconds: number;
  readonly label: string;
  timedOut: boolean;
  timeoutReason: Error | null;
  activeTerminationTarget: ((reason: Error) => void | Promise<void>) | null;
  terminationPromise: Promise<void> | null;
  activeLeafArrivalCapture: ((
    transition: Phase10C0VS6GovernedLeafArrivalTransition,
    capturedAt: bigint,
  ) => void) | null;
}

interface LeafArrivalTransitionState {
  readonly outerState: WatchdogState;
  readonly capturedAt: bigint;
  readonly completionEligible: boolean;
  completionConsumed: boolean;
  startConsumed: boolean;
}

interface DeferredLeafArrivalStart {
  readonly waitForArrival: (
    signal: AbortSignal,
    captureArrival: () => Phase10C0VS6GovernedLeafArrivalTransition,
  ) => Phase10C0VS6GovernedLeafArrivalTransition |
    Promise<Phase10C0VS6GovernedLeafArrivalTransition>;
}

const WATCHDOG_STATES = new WeakMap<Phase10C0VS6ParentWatchdogContext, WatchdogState>();
const LEAF_COMPLETION_RECORDS = new WeakMap<
  object,
  Readonly<{ leafIdentity: object; elapsedNanoseconds: number }>
>();
const LEAF_ARRIVAL_TRANSITIONS = new WeakMap<object, LeafArrivalTransitionState>();
const TIMER_GRANULARITY_NANOSECONDS = 1_000_000;

function fail(message: string): never {
  throw new Error(`Phase 10 C0V S6 parent watchdog refused: ${message}`);
}

function safeNanoseconds(value: number, label: string): number {
  if (!Number.isSafeInteger(value) || value < 0) fail(`${label} must be a nonnegative safe integer`);
  return value;
}

function elapsedNanoseconds(startedAt: bigint): number {
  const elapsed = hrtime.bigint() - startedAt;
  if (elapsed < 0n || elapsed > BigInt(Number.MAX_SAFE_INTEGER)) {
    fail("parent monotonic elapsed nanoseconds left the safe-integer range");
  }
  return Number(elapsed);
}

function timeoutDelayMilliseconds(maximumElapsedNanoseconds: number): number {
  const fireAt = BigInt(maximumElapsedNanoseconds) + BigInt(TIMER_GRANULARITY_NANOSECONDS);
  const milliseconds = (fireAt + 999_999n) / 1_000_000n;
  if (milliseconds > BigInt(2_147_483_647)) fail("parent timeout exceeds the Node timer range");
  return Number(milliseconds);
}

function timeoutDelayMillisecondsFromStart(
  maximumElapsedNanoseconds: number,
  startedAt: bigint,
): number {
  const alreadyElapsed = elapsedNanoseconds(startedAt);
  const remaining = BigInt(maximumElapsedNanoseconds) + BigInt(TIMER_GRANULARITY_NANOSECONDS) -
    BigInt(alreadyElapsed);
  if (remaining <= 0n) return 0;
  const milliseconds = (remaining + 999_999n) / 1_000_000n;
  if (milliseconds > BigInt(2_147_483_647)) fail("parent timeout exceeds the Node timer range");
  return Number(milliseconds);
}

function terminateActive(state: WatchdogState, reason: Error): Promise<void> {
  if (state.terminationPromise !== null) return state.terminationPromise;
  const target = state.activeTerminationTarget;
  state.terminationPromise = target === null
    ? Promise.resolve()
    : Promise.resolve().then(() => target(reason));
  return state.terminationPromise;
}

function contextFor(state: WatchdogState): Phase10C0VS6ParentWatchdogContext {
  const context: Phase10C0VS6ParentWatchdogContext = Object.freeze({
    signal: state.controller.signal,
    startedAtMonotonicNanoseconds: state.startedAt,
    assertActive(): void {
      const observed = elapsedNanoseconds(state.startedAt);
      if (observed > state.maximumElapsedNanoseconds) {
        markOuterTimeout(state, observed);
      }
      if (state.timedOut || state.controller.signal.aborted) {
        throw state.timeoutReason ?? new Error("parent watchdog is no longer active");
      }
    },
    registerTerminationTarget(
      terminateAndQuiesce: (reason: Error) => void | Promise<void>,
    ): () => void {
      if (state.activeTerminationTarget !== null || state.terminationPromise !== null) {
        fail("more than one child termination target is active");
      }
      state.activeTerminationTarget = terminateAndQuiesce;
      let released = false;
      return () => {
        if (released) fail("child termination target was released more than once");
        released = true;
        if (state.activeTerminationTarget !== terminateAndQuiesce) {
          fail("child termination target changed before release");
        }
        state.activeTerminationTarget = null;
        state.terminationPromise = null;
      };
    },
  });
  WATCHDOG_STATES.set(context, state);
  return context;
}

function stateFor(context: Phase10C0VS6ParentWatchdogContext): WatchdogState {
  const state = WATCHDOG_STATES.get(context);
  if (state === undefined) fail("watchdog context was not created by the parent runtime");
  return state;
}

function transitionStateFor(
  transition: Phase10C0VS6GovernedLeafArrivalTransition,
): LeafArrivalTransitionState {
  const state = LEAF_ARRIVAL_TRANSITIONS.get(transition);
  if (state === undefined) fail("governed leaf arrival transition was not issued by the parent runtime");
  return state;
}

function issueArrivalTransition(
  outerState: WatchdogState,
  capturedAt: bigint,
  completionEligible: boolean,
): Phase10C0VS6GovernedLeafArrivalTransition {
  const transition = Object.freeze({
    phase10C0VS6GovernedLeafArrivalTransition: true as const,
  });
  LEAF_ARRIVAL_TRANSITIONS.set(transition, {
    outerState,
    capturedAt,
    completionEligible,
    completionConsumed: false,
    startConsumed: false,
  });
  return transition;
}

/**
 * Authenticated synchronous liveness assertion for claim-bearing code outside the watchdog
 * module.  Merely supplying an object with an `assertActive` method is insufficient: the exact
 * context must have been issued by the currently running parent watchdog.
 */
export function phase10C0VS6AssertActiveParentWatchdog(
  context: Phase10C0VS6ParentWatchdogContext,
): void {
  stateFor(context);
  context.assertActive();
}

/**
 * Captures the parent monotonic instant synchronously at one complete child-line arrival. The
 * active leaf consumes it as its finish boundary; the immediately following governed leaf may
 * consume the same transition once as its exact start boundary.
 */
export function phase10C0VS6CaptureGovernedLeafArrivalTransition(
  context: Phase10C0VS6ParentWatchdogContext,
): Phase10C0VS6GovernedLeafArrivalTransition {
  const state = stateFor(context);
  context.assertActive();
  const capture = state.activeLeafArrivalCapture;
  if (capture === null || state.activeTerminationTarget === null) {
    fail("governed leaf arrival was captured without one active governed child");
  }
  const capturedAt = hrtime.bigint();
  const outerElapsed = capturedAt - state.startedAt;
  if (outerElapsed < 0n || outerElapsed > BigInt(Number.MAX_SAFE_INTEGER)) {
    fail("governed leaf arrival left the outer safe-integer monotonic range");
  }
  if (Number(outerElapsed) > state.maximumElapsedNanoseconds) {
    markOuterTimeout(state, Number(outerElapsed));
    throw state.timeoutReason as Error;
  }
  const transition = issueArrivalTransition(state, capturedAt, true);
  capture(transition, capturedAt);
  return transition;
}

function markOuterTimeout(state: WatchdogState, observedElapsedNanoseconds?: number): void {
  if (!state.timedOut) {
    const observed = Math.max(
      observedElapsedNanoseconds ?? elapsedNanoseconds(state.startedAt),
      state.maximumElapsedNanoseconds + 1,
    );
    state.timedOut = true;
    state.timeoutReason = new Phase10C0VS6ParentTimeoutError(
      state.label,
      observed,
      state.maximumElapsedNanoseconds,
    );
    state.controller.abort(state.timeoutReason);
  }
}

function tripOuterTimeout(state: WatchdogState): Promise<void> {
  markOuterTimeout(state);
  return terminateActive(state, state.timeoutReason as Error);
}

type Settled<T> =
  | Readonly<{ kind: "resolved"; value: T }>
  | Readonly<{ kind: "rejected"; error: unknown }>;

function settle<T>(promise: Promise<T>): Promise<Settled<T>> {
  return promise.then(
    (value) => Object.freeze({ kind: "resolved" as const, value }),
    (error: unknown) => Object.freeze({ kind: "rejected" as const, error }),
  );
}

function invokeAndSettle<T>(action: () => T | Promise<T>): Promise<Settled<T>> {
  try {
    return settle(Promise.resolve(action()));
  } catch (error) {
    return Promise.resolve(Object.freeze({ kind: "rejected" as const, error }));
  }
}

function errorReason(error: unknown, label: string): Error {
  return error instanceof Error ? error : new Error(`${label}: ${String(error)}`);
}

async function terminateAfterSettledAction<T>(
  terminationPromise: Promise<void>,
  actionOutcomePromise: Promise<Settled<T>>,
): Promise<void> {
  // A failed terminator does not excuse abandoning the action/child-settlement join.  The caller
  // deliberately retains its primary action error, while the enclosing lock remains stale.
  await Promise.all([settle(terminationPromise), actionOutcomePromise]);
}

async function awaitTerminationAndAction<T>(
  terminationPromise: Promise<void>,
  actionOutcomePromise: Promise<Settled<T>>,
): Promise<Settled<T>> {
  const terminationOutcomePromise = settle(terminationPromise);
  const [terminationOutcome, actionOutcome] = await Promise.all([
    terminationOutcomePromise,
    actionOutcomePromise,
  ]);
  if (terminationOutcome.kind === "rejected") throw terminationOutcome.error;
  return actionOutcome;
}

/**
 * Runs the whole locked packet action under a parent-owned monotonic deadline.  A timeout first
 * aborts the context and terminates the active child, then awaits both child/action quiescence
 * before rejecting.  The enclosing lock wrapper therefore retains its locks and no rejected
 * action can continue writing in the background.
 */
export async function phase10C0VS6WithOuterInfrastructureWatchdog<T>(
  maximumElapsedNanosecondsValue: number,
  action: (context: Phase10C0VS6ParentWatchdogContext) => T | Promise<T>,
  label = "outer infrastructure action",
): Promise<T> {
  const maximumElapsedNanoseconds = safeNanoseconds(
    maximumElapsedNanosecondsValue,
    "outer maximum elapsed nanoseconds",
  );
  const state: WatchdogState = {
    controller: new AbortController(),
    startedAt: hrtime.bigint(),
    maximumElapsedNanoseconds,
    label,
    timedOut: false,
    timeoutReason: null,
    activeTerminationTarget: null,
    terminationPromise: null,
    activeLeafArrivalCapture: null,
  };
  const context = contextFor(state);
  let signalTimeout!: () => void;
  let timeoutTerminationPromise: Promise<void> | null = null;
  const timeoutSignal = new Promise<void>((resolve) => {
    signalTimeout = resolve;
  });
  const timer = setTimeout(() => {
    timeoutTerminationPromise = tripOuterTimeout(state);
    void settle(timeoutTerminationPromise).then(signalTimeout);
  }, timeoutDelayMilliseconds(maximumElapsedNanoseconds));
  const actionOutcomePromise = invokeAndSettle(() => action(context));
  const first = await Promise.race([
    actionOutcomePromise.then((outcome) => Object.freeze({ kind: "action" as const, outcome })),
    timeoutSignal.then(() => Object.freeze({ kind: "timeout" as const })),
  ]);
  clearTimeout(timer);
  if (first.kind === "timeout") {
    if (timeoutTerminationPromise === null || state.timeoutReason === null) {
      fail("outer timeout signal lacks its parent termination state");
    }
    await awaitTerminationAndAction(timeoutTerminationPromise, actionOutcomePromise);
    throw state.timeoutReason;
  }
  const observed = elapsedNanoseconds(state.startedAt);
  if (observed > maximumElapsedNanoseconds || state.timedOut) {
    const termination = tripOuterTimeout(state);
    await awaitTerminationAndAction(termination, actionOutcomePromise);
    throw state.timeoutReason;
  }
  if (first.outcome.kind === "rejected") {
    const reason = errorReason(first.outcome.error, `${label} rejected`);
    state.controller.abort(reason);
    if (state.activeTerminationTarget !== null) {
      await terminateAfterSettledAction(terminateActive(state, reason), actionOutcomePromise);
    }
    throw first.outcome.error;
  }
  if (state.activeTerminationTarget !== null) {
    const reason = new Error(
      "Phase 10 C0V S6 parent watchdog refused: packet action completed while a child " +
      "termination target remained registered",
    );
    state.controller.abort(reason);
    await terminateAfterSettledAction(terminateActive(state, reason), actionOutcomePromise);
    throw reason;
  }
  return first.outcome.value;
}

export function phase10C0VS6ClassifyGovernedElapsedNanoseconds(
  elapsedNanosecondsValue: number,
  registeredWallSecondsMaximum: 300 | 14400,
): "complete" | "registered-cap" {
  const elapsed = safeNanoseconds(elapsedNanosecondsValue, "governed leaf elapsed nanoseconds");
  const maximum = registeredWallSecondsMaximum * 1_000_000_000;
  return elapsed > maximum ? "registered-cap" : "complete";
}

/**
 * Runs one governed worker leaf.  The timer fires at the registered limit plus one millisecond;
 * the final classification uses the exact parent-monotonic integer duration, so equality is
 * complete and any strict overrun is a registered cap.  A capped value is never returned.
 */
async function runGovernedLeafWithWatchdog<T>(
  outerContext: Phase10C0VS6ParentWatchdogContext,
  registeredWallSecondsMaximum: 300 | 14400,
  terminateAndQuiesce: (reason: Error) => void | Promise<void>,
  action: (
    leafSignal: AbortSignal,
    assertActive: () => void,
    complete: (
      value: T,
      arrivalTransition?: Phase10C0VS6GovernedLeafArrivalTransition,
    ) => Phase10C0VS6GovernedLeafCompletion<T>,
    startedAtMonotonicNanoseconds: bigint,
  ) => Phase10C0VS6GovernedLeafCompletion<T> | Promise<Phase10C0VS6GovernedLeafCompletion<T>>,
  startAuthority: Phase10C0VS6GovernedLeafArrivalTransition | DeferredLeafArrivalStart | null,
): Promise<Phase10C0VS6GovernedLeafResult<T>> {
  const outerState = stateFor(outerContext);
  outerContext.assertActive();
  const maximumElapsedNanoseconds = registeredWallSecondsMaximum * 1_000_000_000;
  const immediateLeafStartedAt = startAuthority === null ? hrtime.bigint() : null;
  const leafController = new AbortController();
  let leafTimedOut = false;
  let leafTimeoutReason: Error | null = null;
  let leafTimeoutElapsedNanoseconds: number | null = null;
  let terminationPromise: Promise<void> | null = null;
  const terminateOnce = (reason: Error): Promise<void> => {
    terminationPromise ??= Promise.resolve().then(() => terminateAndQuiesce(reason));
    return terminationPromise;
  };
  const releaseOuterTarget = outerContext.registerTerminationTarget(terminateOnce);
  let leafStartedAt: bigint;
  try {
    let startTransition: Phase10C0VS6GovernedLeafArrivalTransition | null = null;
    if (startAuthority === null) {
      leafStartedAt = immediateLeafStartedAt as bigint;
    } else {
      if ("waitForArrival" in startAuthority) {
        let captured: Phase10C0VS6GovernedLeafArrivalTransition | null = null;
        let arrivalWaitActive = true;
        const captureArrival = (): Phase10C0VS6GovernedLeafArrivalTransition => {
          outerContext.assertActive();
          if (!arrivalWaitActive || outerState.activeTerminationTarget !== terminateOnce) {
            fail("deferred governed start capture outlived its exact termination-target wait");
          }
          if (captured !== null || outerState.activeLeafArrivalCapture !== null) {
            fail("deferred governed leaf captured more than one or an overlapping start arrival");
          }
          const capturedAt = hrtime.bigint();
          const outerElapsed = capturedAt - outerState.startedAt;
          if (outerElapsed < 0n || outerElapsed > BigInt(Number.MAX_SAFE_INTEGER)) {
            fail("deferred governed start arrival left the outer safe-integer monotonic range");
          }
          if (Number(outerElapsed) > outerState.maximumElapsedNanoseconds) {
            markOuterTimeout(outerState, Number(outerElapsed));
            throw outerState.timeoutReason as Error;
          }
          captured = issueArrivalTransition(outerState, capturedAt, false);
          return captured;
        };
        let returned: Phase10C0VS6GovernedLeafArrivalTransition;
        try {
          returned = await startAuthority.waitForArrival(outerContext.signal, captureArrival);
        } finally {
          arrivalWaitActive = false;
        }
        if (captured === null || returned !== captured) {
          fail("deferred governed start waiter returned no exact parent-issued LF-arrival transition");
        }
        startTransition = captured;
      } else {
        startTransition = startAuthority;
      }
      const transitionState = transitionStateFor(startTransition);
      if (transitionState.outerState !== outerState) {
        fail("governed leaf arrival transition belongs to a different outer watchdog");
      }
      if (transitionState.startConsumed) {
        fail("governed leaf arrival transition start boundary was consumed more than once");
      }
      if (transitionState.capturedAt > hrtime.bigint()) {
        fail("governed leaf arrival transition lies in the parent monotonic future");
      }
      transitionState.startConsumed = true;
      leafStartedAt = transitionState.capturedAt;
    }
  } catch (error) {
    const reason = errorReason(error, "governed leaf start transition rejected");
    leafController.abort(reason);
    await settle(terminateOnce(reason));
    releaseOuterTarget();
    throw error;
  }
  const markLeafTimeout = (observedElapsedNanoseconds?: number): void => {
    if (!leafTimedOut) {
      const observed = Math.max(
        observedElapsedNanoseconds ?? elapsedNanoseconds(leafStartedAt),
        maximumElapsedNanoseconds + 1,
      );
      leafTimedOut = true;
      leafTimeoutElapsedNanoseconds = observed;
      leafTimeoutReason = new Phase10C0VS6ParentTimeoutError(
        "governed leaf",
        observed,
        maximumElapsedNanoseconds,
      );
      leafController.abort(leafTimeoutReason);
    }
  };
  const assertLeafActive = (): void => {
    outerContext.assertActive();
    const observed = elapsedNanoseconds(leafStartedAt);
    if (observed > maximumElapsedNanoseconds) markLeafTimeout(observed);
    if (leafTimedOut || leafController.signal.aborted) {
      throw leafTimeoutReason ?? new Error("governed leaf watchdog is no longer active");
    }
  };
  let signalTimeout!: () => void;
  let timeoutTerminationPromise: Promise<void> | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let completionIssued = false;
  let capturedArrivalTransition: Phase10C0VS6GovernedLeafArrivalTransition | null = null;
  const leafIdentity = Object.freeze({});
  const timeoutSignal = new Promise<void>((resolve) => {
    signalTimeout = resolve;
  });
  const tripLeaf = (): Promise<void> => {
    markLeafTimeout();
    return terminateOnce(leafTimeoutReason as Error);
  };
  const complete = (
    value: T,
    arrivalTransition?: Phase10C0VS6GovernedLeafArrivalTransition,
  ): Phase10C0VS6GovernedLeafCompletion<T> => {
    if (completionIssued) fail("governed leaf completion boundary was captured more than once");
    outerContext.assertActive();
    let finishedAtMonotonicNanoseconds: bigint;
    if (arrivalTransition === undefined) {
      if (capturedArrivalTransition !== null) {
        fail("governed leaf completion omitted its already captured LF-arrival transition");
      }
      finishedAtMonotonicNanoseconds = hrtime.bigint();
    } else {
      const transitionState = transitionStateFor(arrivalTransition);
      if (transitionState.outerState !== outerState || capturedArrivalTransition !== arrivalTransition) {
        fail("governed leaf completion uses a different or uncaptured LF-arrival transition");
      }
      if (!transitionState.completionEligible || transitionState.completionConsumed ||
        transitionState.startConsumed) {
        fail("governed leaf LF-arrival completion boundary was consumed out of order or more than once");
      }
      transitionState.completionConsumed = true;
      finishedAtMonotonicNanoseconds = transitionState.capturedAt;
    }
    const elapsed = finishedAtMonotonicNanoseconds - leafStartedAt;
    if (elapsed < 0n || elapsed > BigInt(Number.MAX_SAFE_INTEGER)) {
      fail("governed leaf elapsed nanoseconds left the safe-integer range");
    }
    const observed = Number(elapsed);
    if (observed > maximumElapsedNanoseconds) markLeafTimeout(observed);
    if (leafTimedOut || leafController.signal.aborted) {
      throw leafTimeoutReason ?? new Error("governed leaf watchdog is no longer active");
    }
    if (timer === null) fail("governed leaf completion preceded timer installation");
    completionIssued = true;
    const token: Phase10C0VS6GovernedLeafCompletion<T> = Object.freeze({
      value,
      startedAtMonotonicNanoseconds: leafStartedAt,
      finishedAtMonotonicNanoseconds,
      elapsedNanoseconds: observed,
    });
    LEAF_COMPLETION_RECORDS.set(token, Object.freeze({
      leafIdentity,
      elapsedNanoseconds: observed,
    }));
    clearTimeout(timer);
    if (outerState.activeLeafArrivalCapture === captureArrival) {
      outerState.activeLeafArrivalCapture = null;
    }
    return token;
  };

  const captureArrival = (
    transition: Phase10C0VS6GovernedLeafArrivalTransition,
    capturedAt: bigint,
  ): void => {
    if (completionIssued || capturedArrivalTransition !== null) {
      fail("governed leaf captured more than one LF-arrival transition");
    }
    const elapsed = capturedAt - leafStartedAt;
    if (elapsed < 0n || elapsed > BigInt(Number.MAX_SAFE_INTEGER)) {
      fail("governed leaf LF-arrival elapsed nanoseconds left the safe-integer range");
    }
    capturedArrivalTransition = transition;
    const observed = Number(elapsed);
    if (observed > maximumElapsedNanoseconds) markLeafTimeout(observed);
    if (timer !== null) clearTimeout(timer);
  };

  const initialElapsed = elapsedNanoseconds(leafStartedAt);
  if (initialElapsed > maximumElapsedNanoseconds) {
    markLeafTimeout(initialElapsed);
    if (leafTimeoutReason === null || leafTimeoutElapsedNanoseconds === null) {
      fail("governed leaf initial overrun lacks its captured timeout state");
    }
    const initialTimeoutReason: Error = leafTimeoutReason;
    const initialTimeoutElapsedNanoseconds: number = leafTimeoutElapsedNanoseconds;
    try {
      await terminateOnce(initialTimeoutReason);
      return Object.freeze({
        terminalState: "registered-cap",
        startedAtMonotonicNanoseconds: leafStartedAt,
        finishedAtMonotonicNanoseconds:
          leafStartedAt + BigInt(initialTimeoutElapsedNanoseconds),
        elapsedNanoseconds: initialTimeoutElapsedNanoseconds,
        value: null,
      });
    } finally {
      releaseOuterTarget();
    }
  }
  if (outerState.activeLeafArrivalCapture !== null) {
    const reason = new Error(
      "Phase 10 C0V S6 parent watchdog refused: another governed LF-arrival capture is active",
    );
    leafController.abort(reason);
    try {
      await terminateOnce(reason);
    } finally {
      releaseOuterTarget();
    }
    throw reason;
  }
  outerState.activeLeafArrivalCapture = captureArrival;
  timer = setTimeout(() => {
    timeoutTerminationPromise = tripLeaf();
    void settle(timeoutTerminationPromise).then(signalTimeout);
  }, timeoutDelayMillisecondsFromStart(maximumElapsedNanoseconds, leafStartedAt));
  const actionOutcomePromise = invokeAndSettle(() => action(
    leafController.signal,
    assertLeafActive,
    complete,
    leafStartedAt,
  ));
  try {
    const first = await Promise.race([
      actionOutcomePromise.then((outcome) => Object.freeze({ kind: "action" as const, outcome })),
      timeoutSignal.then(() => Object.freeze({ kind: "timeout" as const })),
    ]);
    clearTimeout(timer);
    if (first.kind === "timeout") {
      if (
        leafTimeoutReason === null ||
        leafTimeoutElapsedNanoseconds === null ||
        timeoutTerminationPromise === null
      ) {
        fail("governed leaf timeout signal lacks its parent termination state");
      }
      await awaitTerminationAndAction(timeoutTerminationPromise, actionOutcomePromise);
      return Object.freeze({
        terminalState: "registered-cap",
        startedAtMonotonicNanoseconds: leafStartedAt,
        finishedAtMonotonicNanoseconds:
          leafStartedAt + BigInt(leafTimeoutElapsedNanoseconds),
        // The governed interval ends at the parent timer's captured boundary.  Child
        // termination and quiescence are mandatory before return, but their time is
        // infrastructure cleanup and must not inflate scientific/process accounting.
        elapsedNanoseconds: leafTimeoutElapsedNanoseconds,
        value: null,
      });
    }
    if (leafTimedOut) {
      if (leafTimeoutElapsedNanoseconds === null) {
        fail("governed leaf timeout lacks its captured monotonic elapsed nanoseconds");
      }
      const termination = tripLeaf();
      await awaitTerminationAndAction(termination, actionOutcomePromise);
      return Object.freeze({
        terminalState: "registered-cap",
        startedAtMonotonicNanoseconds: leafStartedAt,
        finishedAtMonotonicNanoseconds:
          leafStartedAt + BigInt(leafTimeoutElapsedNanoseconds),
        elapsedNanoseconds: leafTimeoutElapsedNanoseconds,
        value: null,
      });
    }
    if (outerState.timedOut) {
      await terminateActive(outerState, outerState.timeoutReason as Error);
      await actionOutcomePromise;
      throw outerState.timeoutReason;
    }
    if (first.outcome.kind === "rejected") {
      const reason = errorReason(first.outcome.error, "governed leaf action rejected");
      leafController.abort(reason);
      await terminateAfterSettledAction(terminateOnce(reason), actionOutcomePromise);
      throw first.outcome.error;
    }
    const completion = first.outcome.value;
    const completionRecord = LEAF_COMPLETION_RECORDS.get(completion);
    if (completionRecord === undefined || completionRecord.leafIdentity !== leafIdentity) {
      const reason = new Error(
        "Phase 10 C0V S6 parent watchdog refused: governed leaf returned no exact " +
        "parent-issued completion boundary",
      );
      leafController.abort(reason);
      await terminateAfterSettledAction(terminateOnce(reason), actionOutcomePromise);
      throw reason;
    }
    return Object.freeze({
      terminalState: "complete",
      startedAtMonotonicNanoseconds: completion.startedAtMonotonicNanoseconds,
      finishedAtMonotonicNanoseconds: completion.finishedAtMonotonicNanoseconds,
      elapsedNanoseconds: completionRecord.elapsedNanoseconds,
      value: completion.value,
    });
  } finally {
    if (timer !== null) clearTimeout(timer);
    if (outerState.activeLeafArrivalCapture === captureArrival) {
      outerState.activeLeafArrivalCapture = null;
    }
    releaseOuterTarget();
  }
}

/** Starts a governed leaf at the exact parent-owned boundary captured immediately before action. */
export function phase10C0VS6RunGovernedLeafWithWatchdog<T>(
  outerContext: Phase10C0VS6ParentWatchdogContext,
  registeredWallSecondsMaximum: 300 | 14400,
  terminateAndQuiesce: (reason: Error) => void | Promise<void>,
  action: (
    leafSignal: AbortSignal,
    assertActive: () => void,
    complete: (
      value: T,
      arrivalTransition?: Phase10C0VS6GovernedLeafArrivalTransition,
    ) => Phase10C0VS6GovernedLeafCompletion<T>,
    startedAtMonotonicNanoseconds: bigint,
  ) => Phase10C0VS6GovernedLeafCompletion<T> | Promise<Phase10C0VS6GovernedLeafCompletion<T>>,
): Promise<Phase10C0VS6GovernedLeafResult<T>> {
  return runGovernedLeafWithWatchdog(
    outerContext,
    registeredWallSecondsMaximum,
    terminateAndQuiesce,
    action,
    null,
  );
}

/**
 * Starts the next governed leaf at an authenticated child LF-arrival transition. Processing and
 * ACK delay between the prior leaf's finish and this call remains charged to the next leaf.
 */
export function phase10C0VS6RunGovernedLeafFromArrivalWithWatchdog<T>(
  outerContext: Phase10C0VS6ParentWatchdogContext,
  arrivalTransition: Phase10C0VS6GovernedLeafArrivalTransition,
  registeredWallSecondsMaximum: 300 | 14400,
  terminateAndQuiesce: (reason: Error) => void | Promise<void>,
  action: (
    leafSignal: AbortSignal,
    assertActive: () => void,
    complete: (
      value: T,
      arrivalTransition?: Phase10C0VS6GovernedLeafArrivalTransition,
    ) => Phase10C0VS6GovernedLeafCompletion<T>,
    startedAtMonotonicNanoseconds: bigint,
  ) => Phase10C0VS6GovernedLeafCompletion<T> | Promise<Phase10C0VS6GovernedLeafCompletion<T>>,
): Promise<Phase10C0VS6GovernedLeafResult<T>> {
  return runGovernedLeafWithWatchdog(
    outerContext,
    registeredWallSecondsMaximum,
    terminateAndQuiesce,
    action,
    arrivalTransition,
  );
}

/**
 * Waits for a later child governed-start LF while continuously retaining the same termination
 * target, captures that arrival with the parent clock, and starts the leaf at that exact instant.
 * This is the safe post-artifact-ACK path: the persistence/ACK gap precedes the governed leaf and
 * no termination-target handoff gap is exposed between capture and timer installation.
 */
export function phase10C0VS6RunGovernedLeafFromDeferredArrivalWithWatchdog<T>(
  outerContext: Phase10C0VS6ParentWatchdogContext,
  registeredWallSecondsMaximum: 300 | 14400,
  terminateAndQuiesce: (reason: Error) => void | Promise<void>,
  waitForArrival: (
    signal: AbortSignal,
    captureArrival: () => Phase10C0VS6GovernedLeafArrivalTransition,
  ) => Phase10C0VS6GovernedLeafArrivalTransition |
    Promise<Phase10C0VS6GovernedLeafArrivalTransition>,
  action: (
    leafSignal: AbortSignal,
    assertActive: () => void,
    complete: (
      value: T,
      arrivalTransition?: Phase10C0VS6GovernedLeafArrivalTransition,
    ) => Phase10C0VS6GovernedLeafCompletion<T>,
    startedAtMonotonicNanoseconds: bigint,
  ) => Phase10C0VS6GovernedLeafCompletion<T> | Promise<Phase10C0VS6GovernedLeafCompletion<T>>,
): Promise<Phase10C0VS6GovernedLeafResult<T>> {
  return runGovernedLeafWithWatchdog(
    outerContext,
    registeredWallSecondsMaximum,
    terminateAndQuiesce,
    action,
    Object.freeze({ waitForArrival }),
  );
}
