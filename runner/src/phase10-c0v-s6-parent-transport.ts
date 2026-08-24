import { Buffer } from "node:buffer";
import type { Readable } from "node:stream";
import type {
  Phase10C0VS6GovernedLeafArrivalTransition,
  Phase10C0VS6GovernedLeafCompletion,
} from "./phase10-c0v-s6-watchdog.ts";
import {
  PHASE10_C0V_S6_MAXIMUM_WORKER_WIRE_LINE_BYTES,
  type Phase10C0VS6WorkerMessageKind,
} from "./phase10-c0v-s6-worker-transport.ts";

export const PHASE10_C0V_S6_MAXIMUM_WORKER_STDERR_BYTES = 33_554_432 as const;

export interface Phase10C0VS6ParentWorkerMessageByteBudget {
  readonly lifecycleLineBytesMaximum: number;
  readonly boundaryOrProgressLineBytesMaximum: number;
  readonly artifactLineBytesMaximum: number;
  readonly resultLineBytesMaximum: number;
  readonly lifecycleLineCountMaximum: number;
  readonly boundaryOrProgressLineCountMaximum: number;
  readonly artifactLineCountMaximum: number;
  readonly resultLineCountMaximum: number;
  readonly derivedMaximumBytes: number;
}

interface PendingLine {
  readonly resolve: (line: Uint8Array) => void;
  readonly reject: (error: Error) => void;
}

export interface Phase10C0VS6AuthenticatedStartArrival {
  readonly line: Uint8Array;
  readonly transition: Phase10C0VS6GovernedLeafArrivalTransition;
}

function fail(message: string): never {
  throw new Error(`Phase 10 C0V S6 parent transport refused: ${message}`);
}

function errorValue(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}

function concatBytes(parts: readonly Uint8Array[]): Uint8Array {
  const length = parts.reduce((sum, entry) => sum + entry.byteLength, 0);
  const result = new Uint8Array(length);
  let offset = 0;
  for (const part of parts) {
    result.set(part, offset);
    offset += part.byteLength;
  }
  return result;
}

/**
 * Parent-only bounded stdout parser. A governed waiter installs its authenticated completion
 * callback before command dispatch, so the watchdog boundary is captured synchronously when
 * the stream recognizes the terminal LF, never later when a Promise consumer is scheduled.
 */
export class Phase10C0VS6WorkerLineQueue {
  private buffered = Buffer.alloc(0);
  private readonly lines: Uint8Array[] = [];
  private readonly rawChunks: Uint8Array[] = [];
  private readonly pending: PendingLine[] = [];
  private readonly maximumLines: number;
  private readonly maximumRawBytes: number;
  private observedLineCount = 0;
  private rawByteLength = 0;
  private ended = false;
  private failure: Error | null = null;

  constructor(stream: Readable, maximumLines: number, maximumRawBytes: number) {
    if (!Number.isSafeInteger(maximumLines) || maximumLines <= 0 ||
      maximumLines > Math.floor(Number.MAX_SAFE_INTEGER / PHASE10_C0V_S6_MAXIMUM_WORKER_WIRE_LINE_BYTES)) {
      fail("worker stdout maximum line count is invalid");
    }
    if (!Number.isSafeInteger(maximumRawBytes) || maximumRawBytes <= 0 ||
      maximumRawBytes > maximumLines * PHASE10_C0V_S6_MAXIMUM_WORKER_WIRE_LINE_BYTES) {
      fail("worker stdout aggregate byte bound is invalid");
    }
    this.maximumLines = maximumLines;
    this.maximumRawBytes = maximumRawBytes;
    stream.on("data", (chunk: Buffer | Uint8Array | string) => {
      try {
        const incoming = typeof chunk === "string" ? Buffer.from(chunk, "utf8") : Buffer.from(chunk);
        const remainingRawBytes = this.maximumRawBytes - this.rawByteLength;
        if (incoming.byteLength > remainingRawBytes) {
          if (remainingRawBytes > 0) {
            this.rawChunks.push(new Uint8Array(incoming.subarray(0, remainingRawBytes)));
            this.rawByteLength += remainingRawBytes;
          }
          fail("worker stdout exceeds the exact packet transport bound");
        }
        this.rawByteLength += incoming.byteLength;
        this.rawChunks.push(new Uint8Array(incoming));
        this.buffered = Buffer.concat([this.buffered, incoming]);
        while (true) {
          const newline = this.buffered.indexOf(0x0a);
          if (newline < 0) break;
          this.observedLineCount += 1;
          if (this.observedLineCount > this.maximumLines) {
            fail("worker stdout exceeds the exact packet message count");
          }
          const line = new Uint8Array(this.buffered.subarray(0, newline + 1));
          this.buffered = this.buffered.subarray(newline + 1);
          if (line.byteLength > PHASE10_C0V_S6_MAXIMUM_WORKER_WIRE_LINE_BYTES) {
            fail("worker stdout line exceeds the exact transport bound");
          }
          const waiter = this.pending.shift();
          if (waiter === undefined) this.lines.push(line);
          else waiter.resolve(line);
        }
        if (this.buffered.byteLength >= PHASE10_C0V_S6_MAXIMUM_WORKER_WIRE_LINE_BYTES) {
          fail("worker stdout line exceeds the exact transport bound before LF");
        }
      } catch (error) {
        this.refuse(errorValue(error));
        stream.destroy();
      }
    });
    stream.once("error", (error) => this.refuse(errorValue(error)));
    stream.once("end", () => {
      if (this.buffered.byteLength !== 0) {
        this.refuse(new Error("worker stdout ended with a partial transport line"));
        return;
      }
      this.ended = true;
      while (this.pending.length > 0) {
        this.pending.shift()!.reject(new Error("worker stdout ended before the expected message"));
      }
    });
    stream.once("close", () => {
      if (!this.ended && this.failure === null) {
        this.refuse(new Error("worker stdout closed before its exact terminal stream boundary"));
      }
    });
  }

  private refuse(error: Error): void {
    if (this.failure !== null) return;
    this.failure = error;
    while (this.pending.length > 0) this.pending.shift()!.reject(error);
  }

  next(): Promise<Uint8Array> {
    if (this.failure !== null) return Promise.reject(this.failure);
    const line = this.lines.shift();
    if (line !== undefined) return Promise.resolve(line);
    if (this.ended) return Promise.reject(new Error("worker stdout ended before the expected message"));
    return new Promise<Uint8Array>((resolveLine, rejectLine) => {
      this.pending.push({ resolve: resolveLine, reject: rejectLine });
    });
  }

  nextAtAuthenticatedBoundary(
    complete: (line: Uint8Array) => Phase10C0VS6GovernedLeafCompletion<Uint8Array>,
  ): Promise<Phase10C0VS6GovernedLeafCompletion<Uint8Array>> {
    if (this.failure !== null) return Promise.reject(this.failure);
    if (this.lines.length !== 0) {
      const error = new Error("worker emitted a governed result before its exact parent wait boundary");
      this.refuse(error);
      return Promise.reject(error);
    }
    if (this.ended) return Promise.reject(new Error("worker stdout ended before the expected message"));
    return new Promise((resolveCompletion, rejectCompletion) => {
      this.pending.push({
        resolve: (line) => {
          try {
            resolveCompletion(complete(line));
          } catch (error) {
            // The authenticated leaf watchdog owns completion-boundary rejection (including
            // the exact strict-over-cap case) and will terminate/quiesce the child. The raw
            // stream itself remains valid unless it independently violates framing or roster.
            rejectCompletion(errorValue(error));
          }
        },
        reject: rejectCompletion,
      });
    });
  }

  nextAtAuthenticatedStartArrival(
    captureArrival: () => Phase10C0VS6GovernedLeafArrivalTransition,
  ): Promise<Phase10C0VS6AuthenticatedStartArrival> {
    if (this.failure !== null) return Promise.reject(this.failure);
    if (this.lines.length !== 0) {
      const error = new Error("worker emitted a governed start before its exact parent wait boundary");
      this.refuse(error);
      return Promise.reject(error);
    }
    if (this.ended) return Promise.reject(new Error("worker stdout ended before the expected message"));
    return new Promise((resolveArrival, rejectArrival) => {
      this.pending.push({
        resolve: (line) => {
          try {
            resolveArrival(Object.freeze({ line, transition: captureArrival() }));
          } catch (error) {
            // The deferred governed-leaf wrapper owns an authenticated arrival rejection and
            // terminates/quiesces the child. The already observed raw LF remains valid transport.
            rejectArrival(errorValue(error));
          }
        },
        reject: rejectArrival,
      });
    });
  }

  retainedBytes(): Uint8Array {
    return concatBytes(this.rawChunks);
  }

  assertEndedAndEmpty(): void {
    if (this.failure !== null) throw this.failure;
    if (!this.ended || this.buffered.byteLength !== 0 || this.lines.length !== 0 || this.pending.length !== 0) {
      fail("worker stdout did not end at the exact consumed message boundary");
    }
  }
}

/** Parent-owned stdout/stderr retention and terminal quiescence boundary. */
export class Phase10C0VS6ParentWorkerOutput {
  readonly lines: Phase10C0VS6WorkerLineQueue;
  private readonly stderrChunks: Uint8Array[] = [];
  private stderrRetainedByteLength = 0;
  private stderrEnded = false;
  private stderrFailure: Error | null = null;
  private readonly messageByteBudget: Phase10C0VS6ParentWorkerMessageByteBudget;
  private readonly observedMessageCounts = {
    lifecycle: 0,
    boundaryOrProgress: 0,
    artifact: 0,
    result: 0,
  };

  constructor(
    stdout: Readable,
    stderr: Readable,
    maximumStdoutLines: number,
    maximumStdoutBytes: number,
    messageByteBudget: Phase10C0VS6ParentWorkerMessageByteBudget,
    terminateForStderrOverflow: () => void,
  ) {
    const expectedLines = messageByteBudget.lifecycleLineCountMaximum +
      messageByteBudget.boundaryOrProgressLineCountMaximum +
      messageByteBudget.artifactLineCountMaximum + messageByteBudget.resultLineCountMaximum;
    const expectedBytes = messageByteBudget.lifecycleLineBytesMaximum *
      messageByteBudget.lifecycleLineCountMaximum +
      messageByteBudget.boundaryOrProgressLineBytesMaximum *
      messageByteBudget.boundaryOrProgressLineCountMaximum +
      messageByteBudget.artifactLineBytesMaximum * messageByteBudget.artifactLineCountMaximum +
      messageByteBudget.resultLineBytesMaximum * messageByteBudget.resultLineCountMaximum;
    if (expectedLines !== maximumStdoutLines || expectedBytes !== messageByteBudget.derivedMaximumBytes ||
      expectedBytes > maximumStdoutBytes) {
      fail("worker stdout class budget differs from its aggregate limits");
    }
    this.messageByteBudget = messageByteBudget;
    this.lines = new Phase10C0VS6WorkerLineQueue(stdout, maximumStdoutLines, maximumStdoutBytes);
    stderr.on("data", (chunk: Buffer | Uint8Array | string) => {
      const bytes = new Uint8Array(typeof chunk === "string" ? Buffer.from(chunk, "utf8") : Buffer.from(chunk));
      const remainingRetainedBytes =
        PHASE10_C0V_S6_MAXIMUM_WORKER_STDERR_BYTES - this.stderrRetainedByteLength;
      const retained = bytes.subarray(0, remainingRetainedBytes);
      if (retained.byteLength > 0) {
        this.stderrChunks.push(new Uint8Array(retained));
        this.stderrRetainedByteLength += retained.byteLength;
      }
      if (bytes.byteLength > remainingRetainedBytes) {
        if (this.stderrFailure === null) {
          this.stderrFailure = new Error("worker stderr exceeds the exact retained diagnostic bound");
          terminateForStderrOverflow();
        }
        return;
      }
    });
    stderr.once("error", (error) => {
      if (this.stderrFailure === null) {
        this.stderrFailure = errorValue(error);
        terminateForStderrOverflow();
      }
    });
    stderr.once("end", () => {
      this.stderrEnded = true;
    });
    stderr.once("close", () => {
      if (!this.stderrEnded && this.stderrFailure === null) {
        this.stderrFailure = new Error("worker stderr closed before its exact terminal stream boundary");
      }
    });
  }

  nextLine(): Promise<Uint8Array> {
    if (this.stderrFailure !== null) return Promise.reject(this.stderrFailure);
    return this.lines.next();
  }

  nextLineAtAuthenticatedBoundary(
    complete: (line: Uint8Array) => Phase10C0VS6GovernedLeafCompletion<Uint8Array>,
  ): Promise<Phase10C0VS6GovernedLeafCompletion<Uint8Array>> {
    if (this.stderrFailure !== null) return Promise.reject(this.stderrFailure);
    return this.lines.nextAtAuthenticatedBoundary(complete);
  }

  nextLineAtAuthenticatedStartArrival(
    captureArrival: () => Phase10C0VS6GovernedLeafArrivalTransition,
  ): Promise<Phase10C0VS6AuthenticatedStartArrival> {
    if (this.stderrFailure !== null) return Promise.reject(this.stderrFailure);
    return this.lines.nextAtAuthenticatedStartArrival(captureArrival);
  }

  observeParsedMessage(kind: Phase10C0VS6WorkerMessageKind, lineByteLength: number): void {
    const category = kind === "ready" || kind === "stopped" || kind === "error"
      ? "lifecycle"
      : kind === "boundary" || kind === "progress"
        ? "boundaryOrProgress"
        : kind;
    const [bytesMaximum, countMaximum] = category === "lifecycle"
      ? [this.messageByteBudget.lifecycleLineBytesMaximum, this.messageByteBudget.lifecycleLineCountMaximum]
      : category === "boundaryOrProgress"
        ? [
          this.messageByteBudget.boundaryOrProgressLineBytesMaximum,
          this.messageByteBudget.boundaryOrProgressLineCountMaximum,
        ]
        : category === "artifact"
          ? [this.messageByteBudget.artifactLineBytesMaximum, this.messageByteBudget.artifactLineCountMaximum]
          : [this.messageByteBudget.resultLineBytesMaximum, this.messageByteBudget.resultLineCountMaximum];
    if (!Number.isSafeInteger(lineByteLength) || lineByteLength <= 0 || lineByteLength > bytesMaximum) {
      fail(`worker ${category} line exceeds its exact class byte bound`);
    }
    this.observedMessageCounts[category] += 1;
    if (this.observedMessageCounts[category] > countMaximum) {
      fail(`worker ${category} messages exceed their exact class count`);
    }
  }

  retainedStdoutBytes(): Uint8Array {
    return this.lines.retainedBytes();
  }

  retainedStderrBytes(): Uint8Array {
    return concatBytes(this.stderrChunks);
  }

  assertQuiescent(): void {
    this.lines.assertEndedAndEmpty();
    if (this.stderrFailure !== null) throw this.stderrFailure;
    if (!this.stderrEnded) fail("worker stderr did not reach its terminal stream boundary");
  }
}
