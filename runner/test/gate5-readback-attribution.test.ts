// The WP7 precondition: app-path readback records carry the APPLICATION's production labels,
// which name no fixture, so the label match that serves the WP1-WP4 probe sources would
// publish every one of them under a single fixture. These tests pin the observation-based
// attribution that replaces it — the app's own append-only audit counts at each preview
// case's start and end, cross-checked against the self-identifying named-probe pick labels —
// and pin that every way the observations can fail to place a record fails closed.

import { describe, expect, it } from "vitest";
import {
  attributePerformanceReadback,
  performanceReadbackWindows,
  previewCaseOfFixture,
  PHASE5_PREVIEW_CASE_FIXTURES,
  type Phase5PreviewReadbackWindow,
} from "../src/gate5-readback-attribution.ts";
import {
  PHASE5_BUDGETS,
  PHASE5_FIXTURES,
  PHASE5_PERFORMANCE,
} from "../src/phase5-protocol.ts";

const PLATE_FIXTURE = "gg-plate-reflecting-48x48x24";
const COLUMN_FIXTURE = "gg-column-dirichlet-noise-timeline-32x32x64";

/** The exact app-path label shapes the S6 probe collected on the registered host. */
function appPathLabels(pick: string, count: number): string[] {
  const labels = [
    "app:gg:tick-1:report",
    "app:gg:tick-1:far-field-mean",
    `app:view:pick-${pick}:a`,
    `app:view:pick-${pick}:b`,
    `app:view:pick-${pick}:d`,
    `app:view:pick-${pick}:attach-tick`,
    `app:view:pick-${pick}:n0-a`,
    "app:view:sample:count",
    "app:view:sample:cells",
    "app:view:sample:colors",
  ];
  return Array.from({ length: count }, (_, index) => labels[index % labels.length] as string);
}

/**
 * A performance report shaped exactly like the observed one: three setup reads before the
 * plate case opens, two more between the cases, and no record after the last case closes.
 */
function performanceReport(options?: {
  readonly plateSetup?: number;
  readonly columnSetup?: number;
  readonly plateBody?: number;
  readonly columnBody?: number;
  readonly trailing?: number;
}): {
  readonly cases: unknown[];
  readonly readback: { readonly records: { readonly label: string }[] };
} {
  const plateSetup = options?.plateSetup ?? 3;
  const columnSetup = options?.columnSetup ?? 2;
  const plateBody = options?.plateBody ?? 595;
  const columnBody = options?.columnBody ?? 595;
  const trailing = options?.trailing ?? 0;
  const labels = [
    ...Array.from({ length: plateSetup }, () => "init:far-field-mean"),
    ...appPathLabels("200-200-25", plateBody),
    ...Array.from({ length: columnSetup }, () => "init:far-field-mean"),
    ...appPathLabels("80-80-160", columnBody),
    ...Array.from({ length: trailing }, () => "app:view:sample:count"),
  ];
  const plateStart = plateSetup;
  const plateEnd = plateSetup + plateBody;
  const columnStart = plateEnd + columnSetup;
  const columnEnd = columnStart + columnBody;
  return {
    cases: [
      {
        id: "preview-plate",
        auditRecordsAtStart: plateStart,
        pickTarget: { i: 200, j: 200, k: 25 },
        closing: { auditRecordsAtEnd: plateEnd },
      },
      {
        id: "preview-column",
        auditRecordsAtStart: columnStart,
        pickTarget: { i: 80, j: 80, k: 160 },
        closing: { auditRecordsAtEnd: columnEnd },
      },
    ],
    readback: { records: labels.map((label) => ({ label })) },
  };
}

function attributeAll(report: {
  readonly readback: { readonly records: { readonly label: string }[] };
}): string[] {
  const windows = performanceReadbackWindows(report);
  return report.readback.records.map((entry, index) =>
    attributePerformanceReadback(index, entry.label, windows),
  );
}

describe("PHASE5_PREVIEW_CASE_FIXTURES", () => {
  it("maps every registered preview case onto a registered blocking fixture", () => {
    expect(Object.keys(PHASE5_PREVIEW_CASE_FIXTURES).sort()).toEqual(
      [...PHASE5_PERFORMANCE.previewCases].sort(),
    );
    for (const fixtureId of Object.values(PHASE5_PREVIEW_CASE_FIXTURES)) {
      const fixture = PHASE5_FIXTURES.find((entry) => entry.id === fixtureId);
      expect(fixture?.blocking).toBe(true);
    }
  });

  it("inverts exactly, so a fixture's submissions, interactions and readbacks share one map", () => {
    // The capture publishes all three from `previewCaseOfFixture`; if it ever disagreed with
    // the forward map, a fixture's timing evidence and its readbacks would name different
    // cases. This pins them as exact inverses over every registered blocking fixture.
    for (const [budgetId, fixtureId] of Object.entries(PHASE5_PREVIEW_CASE_FIXTURES)) {
      expect(previewCaseOfFixture(fixtureId)).toBe(budgetId);
    }
    const owned = new Set(Object.values(PHASE5_PREVIEW_CASE_FIXTURES));
    for (const fixture of PHASE5_FIXTURES) {
      expect(previewCaseOfFixture(fixture.id)).toBe(
        owned.has(fixture.id) ? PHASE5_PERFORMANCE.previewCases.find(
          (budgetId) => PHASE5_PREVIEW_CASE_FIXTURES[budgetId] === fixture.id,
        ) : null,
      );
    }
    expect(previewCaseOfFixture("not-a-fixture")).toBeNull();
  });

  it("keeps the two preview cases' pick targets distinct and per-budget", () => {
    // The corroboration is only as good as this: the probe picks the midpoint of the case's
    // own occupancy bounding box, which at case start is the seed at the domain centre, so
    // the pick label identifies the case even though the app never names one. These are the
    // targets observed on the registered host; the test pins that the two budgets cannot
    // produce the same label.
    const observed = {
      "preview-plate": { i: 200, j: 200, k: 25 },
      "preview-column": { i: 80, j: 80, k: 160 },
    } as const;
    for (const [budgetId, target] of Object.entries(observed)) {
      const budget = PHASE5_BUDGETS.find((entry) => entry.id === budgetId);
      expect(budget).toBeDefined();
      const dims = budget?.dims;
      expect({
        i: (dims?.nx ?? 0) >> 1,
        j: (dims?.ny ?? 0) >> 1,
        k: (dims?.nz ?? 0) >> 1,
      }).toEqual(target);
    }
    expect(observed["preview-plate"]).not.toEqual(observed["preview-column"]);
  });
});

describe("performanceReadbackWindows", () => {
  it("partitions the observed inventory across the registered preview cases", () => {
    const windows = performanceReadbackWindows(performanceReport());
    expect(windows).toEqual([
      {
        budgetId: "preview-plate",
        fixtureId: PLATE_FIXTURE,
        startIndex: 0,
        inCaseStartIndex: 3,
        endIndex: 598,
        setupRecordCount: 3,
        pickTarget: { i: 200, j: 200, k: 25 },
      },
      {
        budgetId: "preview-column",
        fixtureId: COLUMN_FIXTURE,
        startIndex: 598,
        inCaseStartIndex: 600,
        endIndex: 1195,
        setupRecordCount: 2,
        pickTarget: { i: 80, j: 80, k: 160 },
      },
    ] satisfies Phase5PreviewReadbackWindow[]);
  });

  it("refuses a case inventory that is not the registered preview cases, in order", () => {
    const swapped = performanceReport();
    const cases = [swapped.cases[1], swapped.cases[0]];
    expect(() =>
      performanceReadbackWindows({ ...swapped, cases }),
    ).toThrow(/but the protocol registers/);
    expect(() =>
      performanceReadbackWindows({ ...swapped, cases: [swapped.cases[0]] }),
    ).toThrow(/but the protocol registers/);
  });

  it("refuses a start that regresses behind the previous case's end", () => {
    const report = performanceReport();
    const cases = [
      report.cases[0],
      {
        ...(report.cases[1] as Record<string, unknown>),
        auditRecordsAtStart: 500,
      },
    ];
    expect(() => performanceReadbackWindows({ ...report, cases })).toThrow(
      /does not follow the previous case's end 598/,
    );
  });

  it("refuses an end that is not after its own start or exceeds the inventory", () => {
    const report = performanceReport();
    for (const end of [3, 2, 1196]) {
      const cases = [
        { ...(report.cases[0] as Record<string, unknown>), closing: { auditRecordsAtEnd: end } },
        report.cases[1],
      ];
      expect(() => performanceReadbackWindows({ ...report, cases })).toThrow(
        /audit-record end/,
      );
    }
  });

  it("refuses records observed after the last preview case closed", () => {
    expect(() => performanceReadbackWindows(performanceReport({ trailing: 4 }))).toThrow(
      /4 app-path readbacks were observed after the last preview case closed/,
    );
  });

  it("refuses a case that published no named-probe pick target", () => {
    const report = performanceReport();
    const cases = [
      { ...(report.cases[0] as Record<string, unknown>), pickTarget: { i: 200, j: 200 } },
      report.cases[1],
    ];
    expect(() => performanceReadbackWindows({ ...report, cases })).toThrow(
      /published no named-probe pick target/,
    );
  });

  it("refuses a report with no readback or case inventory", () => {
    expect(() => performanceReadbackWindows({ cases: [] })).toThrow(
      /published no readback inventory/,
    );
    expect(() => performanceReadbackWindows({ readback: { records: [] } })).toThrow(
      /published no preview-case inventory/,
    );
    expect(() => performanceReadbackWindows(null)).toThrow(/published no readback inventory/);
  });
});

describe("attributePerformanceReadback", () => {
  it("attributes app-path records that name no fixture to the case that produced them", () => {
    const report = performanceReport();
    const attributed = attributeAll(report);
    expect(attributed).toHaveLength(1195);
    // The defect this replaces: not one of these labels names a fixture, so a label match
    // would have published all 1,195 under the plate fixture.
    expect(
      report.readback.records.every((entry) =>
        PHASE5_FIXTURES.every((fixture) => !entry.label.includes(fixture.id)),
      ),
    ).toBe(true);
    expect(attributed.filter((id) => id === PLATE_FIXTURE)).toHaveLength(598);
    expect(attributed.filter((id) => id === COLUMN_FIXTURE)).toHaveLength(597);
    // The setup reads are published with the case they precede, and the case's own reads
    // start exactly where the application said the case opened.
    expect(attributed.slice(0, 3)).toEqual([PLATE_FIXTURE, PLATE_FIXTURE, PLATE_FIXTURE]);
    expect(attributed[597]).toBe(PLATE_FIXTURE);
    expect(attributed.slice(598, 600)).toEqual([COLUMN_FIXTURE, COLUMN_FIXTURE]);
    expect(attributed[1194]).toBe(COLUMN_FIXTURE);
  });

  it("rejects a pick label that contradicts the window it fell in", () => {
    const report = performanceReport();
    const windows = performanceReadbackWindows(report);
    expect(() =>
      attributePerformanceReadback(700, "app:view:pick-200-200-25:a", windows),
    ).toThrow(/contradicts the preview-column pick target 80-80-160/);
    expect(() =>
      attributePerformanceReadback(10, "app:view:pick-80-80-160:a", windows),
    ).toThrow(/contradicts the preview-plate pick target 200-200-25/);
  });

  it("rejects a named-probe pick observed before its case opened", () => {
    const windows = performanceReadbackWindows(performanceReport());
    expect(() =>
      attributePerformanceReadback(1, "app:view:pick-200-200-25:a", windows),
    ).toThrow(/is a named-probe pick before preview-plate opened/);
    expect(() =>
      attributePerformanceReadback(599, "app:view:pick-80-80-160:b", windows),
    ).toThrow(/is a named-probe pick before preview-column opened/);
  });

  it("rejects a label naming a different registered preview case", () => {
    const windows = performanceReadbackWindows(performanceReport());
    expect(() =>
      attributePerformanceReadback(10, "preview-column:sample:3:frame-probe", windows),
    ).toThrow(/names preview-column inside the preview-plate window/);
    expect(() =>
      attributePerformanceReadback(700, "preview-plate:sample:3:frame-probe", windows),
    ).toThrow(/names preview-plate inside the preview-column window/);
    // A label naming its OWN case is evidence, not a conflict.
    expect(
      attributePerformanceReadback(10, "preview-plate:sample:3:frame-probe", windows),
    ).toBe(PLATE_FIXTURE);
  });

  it("refuses an index no window owns", () => {
    const windows = performanceReadbackWindows(performanceReport());
    expect(() => attributePerformanceReadback(1195, "app:view:sample:count", windows)).toThrow(
      /no preview case owns app-path readback 1195/,
    );
    expect(() => attributePerformanceReadback(-1, "app:view:sample:count", windows)).toThrow(
      /no preview case owns app-path readback -1/,
    );
    expect(() => attributePerformanceReadback(0, "app:view:sample:count", [])).toThrow(
      /no preview case owns app-path readback 0/,
    );
  });

  it("attributes a non-string label by window alone rather than guessing", () => {
    const windows = performanceReadbackWindows(performanceReport());
    expect(attributePerformanceReadback(0, undefined, windows)).toBe(PLATE_FIXTURE);
    expect(attributePerformanceReadback(1194, 42, windows)).toBe(COLUMN_FIXTURE);
  });
});
