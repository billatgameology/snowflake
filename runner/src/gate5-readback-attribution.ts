// Attribution of the WP6 S6 performance probe's audited readbacks to the preview case that
// produced them — from the probe's OWN observations, never from a label guess.
//
// The app-path labels the S6 probe collects are the application's production labels
// (`app:gg:tick-N:...`, `app:view:pick-i-j-k:...`, `app:view:sample:...`,
// `init:far-field-mean`). None of them names a fixture, so the label match that serves the
// WP1-WP4 probe sources would attribute every app-path record to whichever fixture was passed
// as that source's default. Instead, each preview case reports the application's own
// audit-record count observed at case start (`auditRecordsAtStart`) and at case end
// (`closing.auditRecordsAtEnd`); the app's `GpuReadbackAudit` is append-only for the whole
// session, so those counts are exact index boundaries into the one published record list.
//
// The windows partition the complete list: case k owns `[previous case end, its own end)`.
// The records before a case's own `auditRecordsAtStart` are the reads the application
// performed while that case was being set up — its engine construction's initial far-field
// instrument read after the budget selection — and are published with the case they precede.
// Records observed after the last case closed have no successor to belong to and fail closed.
//
// Every window is then cross-checked against self-identifying evidence: each named-probe pick
// label carries the exact cell the app was asked to probe, and the probe picks the case's own
// published `pickTarget` (the centre of its budget's grid), so a record whose label names a
// different cell than the window it fell in — or a label naming a different registered preview
// case — rejects the attribution instead of publishing it.

import { PHASE5_PERFORMANCE } from "./phase5-protocol.ts";

/**
 * The frozen preview-case → published-fixture association. The capture publishes each preview
 * case's submissions and interactions under the blocking fixture of the same morphology; its
 * audited readbacks are published the same way and by the same map.
 */
export const PHASE5_PREVIEW_CASE_FIXTURES: Readonly<Record<string, string>> =
  Object.freeze({
    "preview-plate": "gg-plate-reflecting-48x48x24",
    "preview-column": "gg-column-dirichlet-noise-timeline-32x32x64",
  });

/** `app:view:pick-<i>-<j>-<k>:...` — the app's own named-probe pick readback labels. */
const APP_PICK_LABEL = /^app:view:pick-(\d+)-(\d+)-(\d+):/;

export interface Phase5PickTarget {
  readonly i: number;
  readonly j: number;
  readonly k: number;
}

export interface Phase5PreviewReadbackWindow {
  /** The registered preview case (budget) this window belongs to. */
  readonly budgetId: string;
  /** The blocking fixture the case's evidence is published under. */
  readonly fixtureId: string;
  /** First app-path record index this case owns (the previous case's end, or 0). */
  readonly startIndex: number;
  /** The audit-record count the application reported when this case opened. */
  readonly inCaseStartIndex: number;
  /** One past the last app-path record index this case owns. */
  readonly endIndex: number;
  /** How many owned records preceded the case's own opening (its setup reads). */
  readonly setupRecordCount: number;
  /** The cell the probe asks the app to probe by name throughout this case. */
  readonly pickTarget: Phase5PickTarget;
}

function safeCount(value: unknown): number | null {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0
    ? value
    : null;
}

function record(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

/**
 * Derive the app-path readback windows from one performance-probe report. Throws — never
 * guesses — when the report's case inventory, boundaries, or pick targets cannot place every
 * observed record.
 */
export function performanceReadbackWindows(
  performance: unknown,
): readonly Phase5PreviewReadbackWindow[] {
  const report = record(performance);
  const readback = record(report?.readback);
  const records = readback?.records;
  if (!Array.isArray(records)) {
    throw new Error("the performance probe published no readback inventory");
  }
  const cases = report?.cases;
  if (!Array.isArray(cases)) {
    throw new Error("the performance probe published no preview-case inventory");
  }
  const registered = [...PHASE5_PERFORMANCE.previewCases];
  const observedIds = cases.map((entry) => String(record(entry)?.id));
  if (
    observedIds.length !== registered.length ||
    observedIds.some((id, index) => id !== registered[index])
  ) {
    throw new Error(
      `the performance probe reports cases [${observedIds.join(", ")}] but the protocol ` +
        `registers [${registered.join(", ")}]`,
    );
  }
  const windows: Phase5PreviewReadbackWindow[] = [];
  let previousEnd = 0;
  for (const [index, entry] of cases.entries()) {
    const caseReport = record(entry);
    const budgetId = registered[index] as string;
    const fixtureId = PHASE5_PREVIEW_CASE_FIXTURES[budgetId];
    if (fixtureId === undefined) {
      throw new Error(`no published fixture owns preview case ${budgetId}`);
    }
    const observedStart = safeCount(caseReport?.auditRecordsAtStart);
    const observedEnd = safeCount(record(caseReport?.closing)?.auditRecordsAtEnd);
    if (observedStart === null || observedStart < previousEnd) {
      throw new Error(
        `${budgetId} reports audit-record start ${String(
          record(caseReport)?.auditRecordsAtStart,
        )}, which does not follow the previous case's end ${previousEnd}`,
      );
    }
    if (
      observedEnd === null ||
      observedEnd <= observedStart ||
      observedEnd > records.length
    ) {
      throw new Error(
        `${budgetId} reports audit-record end ${String(
          record(caseReport?.closing)?.auditRecordsAtEnd,
        )} against start ${observedStart} and ${records.length} observed records`,
      );
    }
    const target = record(caseReport?.pickTarget);
    const i = safeCount(target?.i);
    const j = safeCount(target?.j);
    const k = safeCount(target?.k);
    if (i === null || j === null || k === null) {
      throw new Error(`${budgetId} published no named-probe pick target`);
    }
    windows.push({
      budgetId,
      fixtureId,
      startIndex: previousEnd,
      inCaseStartIndex: observedStart,
      endIndex: observedEnd,
      setupRecordCount: observedStart - previousEnd,
      pickTarget: { i, j, k },
    });
    previousEnd = observedEnd;
  }
  if (previousEnd !== records.length) {
    throw new Error(
      `${records.length - previousEnd} app-path readbacks were observed after the last ` +
        "preview case closed and no case owns them",
    );
  }
  return windows;
}

/**
 * The owning fixture of one app-path readback record, rejected rather than guessed whenever
 * the record's own label contradicts the window it fell in.
 */
export function attributePerformanceReadback(
  index: number,
  label: unknown,
  windows: readonly Phase5PreviewReadbackWindow[],
): string {
  const window = windows.find(
    (candidate) => index >= candidate.startIndex && index < candidate.endIndex,
  );
  if (window === undefined) {
    throw new Error(`no preview case owns app-path readback ${index}`);
  }
  const text = typeof label === "string" ? label : "";
  const pick = APP_PICK_LABEL.exec(text);
  if (pick !== null) {
    const target = window.pickTarget;
    if (
      Number(pick[1]) !== target.i ||
      Number(pick[2]) !== target.j ||
      Number(pick[3]) !== target.k
    ) {
      throw new Error(
        `app-path readback ${index} (${text}) contradicts the ${window.budgetId} pick ` +
          `target ${target.i}-${target.j}-${target.k}`,
      );
    }
    if (index < window.inCaseStartIndex) {
      throw new Error(
        `app-path readback ${index} (${text}) is a named-probe pick before ` +
          `${window.budgetId} opened`,
      );
    }
  }
  for (const other of PHASE5_PERFORMANCE.previewCases) {
    if (other !== window.budgetId && text.includes(other)) {
      throw new Error(
        `app-path readback ${index} (${text}) names ${other} inside the ` +
          `${window.budgetId} window`,
      );
    }
  }
  return window.fixtureId;
}
