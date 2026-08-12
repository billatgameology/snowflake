// Phase 6 WP1 (narrowed) — size-strata freeze artifact tests.
//
// Non-vacuous by construction: every published number is independently recomputed here from a
// fresh parse of the hash-pinned candidate lock, using differently-ordered expressions, and each
// negative control executes its named mutation (Rule 9) before asserting the refusal fires.

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  PHASE6_HELDOUT_LOCK_RELATIVE_PATH,
} from "../src/phase6-heldout-source-lock.ts";
import {
  PHASE6_NAKAYA_RECORD_RELATIVE_PATH,
  PHASE6_SIZE_STRATA_ARTIFACT_RELATIVE_PATH,
  buildPhase6SizeStrataArtifact,
  computePhase6SizeStrata,
  phase6NakayaRecordTextFailures,
  phase6SizeStrataArtifactText,
  phase6SizeStrataOperandFailures,
} from "../src/phase6-size-strata.ts";

const REPO = fileURLToPath(new URL("../..", import.meta.url));
const lockText = readFileSync(join(REPO, PHASE6_HELDOUT_LOCK_RELATIVE_PATH), "utf8");
const nakayaText = readFileSync(join(REPO, PHASE6_NAKAYA_RECORD_RELATIVE_PATH), "utf8");
const artifactText = readFileSync(
  join(REPO, PHASE6_SIZE_STRATA_ARTIFACT_RELATIVE_PATH),
  "utf8",
);

interface PublishedTraceS1 {
  readonly id: string;
  readonly initialRadiusUm: number;
  readonly initialRadiusRangeUm: number;
  readonly intervalUm: readonly [number, number];
  readonly tempC: number;
  readonly sigmaIcePercent: number;
  readonly pressurePa: number;
  readonly radiusUnderUnresolvedMismatch: boolean;
  readonly contributesToUnion: boolean;
}

interface PublishedTraceS2 {
  readonly id: string;
  readonly initialRadiusUm: number;
  readonly massRatioAt300s: number;
  readonly centralEquivalentRadiusUm: number;
  readonly radiusUnderUnresolvedMismatch: boolean;
  readonly contributesToUnion: boolean;
}

// The lock pins 716d's stated radius in an unresolved mismatch; the operator must echo the
// trace and exclude it from both stratum unions.
const CONTESTED_ID = "716d";

interface PublishedArtifact {
  readonly schema: string;
  readonly strata: {
    readonly s1ObservedInitialSize: {
      readonly perTrace: readonly PublishedTraceS1[];
      readonly unionIntervalUm: readonly [number, number];
      readonly conditionDomain: {
        readonly tempC: readonly [number, number];
        readonly sigmaIcePercent: readonly [number, number];
        readonly pressurePa: readonly [number, number];
      };
    };
    readonly s2GrownMassEquivalentSize300s: {
      readonly perTrace: readonly PublishedTraceS2[];
      readonly unionCentralIntervalUm: readonly [number, number];
      readonly timeSeconds: number;
    };
  };
  readonly warmAnchorW1: {
    readonly tempC: number;
    readonly rows: readonly {
      readonly timeMinutes: number;
      readonly massGrams: number;
      readonly nonprobabilisticDiagnosticRangeGrams: readonly [number, number];
    }[];
  };
  readonly refusals: readonly { readonly name: string; readonly reason: string }[];
}

// Fresh, module-independent parse of the lock for recomputation.
interface RawTrace {
  readonly id: string;
  readonly initialRadiusUm: number;
  readonly initialRadiusRangeUm: number;
  readonly tempC: number;
  readonly sigmaIcePercent: number;
  readonly pressurePa: number;
  readonly massRatios: readonly number[];
}
const rawLock = JSON.parse(lockText) as {
  harrisonCandidate: { traces: readonly RawTrace[]; timesSeconds: readonly number[] };
  takahashiDiagnostic: {
    conditions: { tempC: number };
    ensembleFit: {
      rows: readonly {
        timeMinutes: number;
        massGrams: number;
        nonprobabilisticDiagnosticRangeGrams: readonly [number, number];
      }[];
    };
  };
};
const published = JSON.parse(artifactText) as PublishedArtifact;

describe("phase6 size-strata freeze artifact", () => {
  it("regenerates byte-identically from the two pinned tracked inputs", () => {
    const rebuilt = phase6SizeStrataArtifactText(
      buildPhase6SizeStrataArtifact(lockText, nakayaText),
    );
    expect(rebuilt).toBe(artifactText);
    // Determinism: a second computation is byte-identical to the first.
    expect(
      phase6SizeStrataArtifactText(buildPhase6SizeStrataArtifact(lockText, nakayaText)),
    ).toBe(rebuilt);
  });

  it("independently recomputes every published S1 number from a fresh lock parse", () => {
    const traces = rawLock.harrisonCandidate.traces;
    expect(published.strata.s1ObservedInitialSize.perTrace).toHaveLength(traces.length);
    expect(traces.filter((trace) => trace.id === CONTESTED_ID)).toHaveLength(1);
    // Reverse iteration order and reversed operand order versus the producer.
    let unionLow = Number.POSITIVE_INFINITY;
    let unionHigh = Number.NEGATIVE_INFINITY;
    for (let index = traces.length - 1; index >= 0; index--) {
      const trace = traces[index];
      const row = published.strata.s1ObservedInitialSize.perTrace[index];
      expect(row.id).toBe(trace.id);
      const low = -trace.initialRadiusRangeUm + trace.initialRadiusUm;
      const high = trace.initialRadiusRangeUm + trace.initialRadiusUm;
      expect(row.intervalUm[0]).toBe(low);
      expect(row.intervalUm[1]).toBe(high);
      expect(row.initialRadiusUm).toBe(trace.initialRadiusUm);
      expect(row.initialRadiusRangeUm).toBe(trace.initialRadiusRangeUm);
      expect(row.tempC).toBe(trace.tempC);
      expect(row.sigmaIcePercent).toBe(trace.sigmaIcePercent);
      expect(row.pressurePa).toBe(trace.pressurePa);
      expect(row.radiusUnderUnresolvedMismatch).toBe(trace.id === CONTESTED_ID);
      expect(row.contributesToUnion).toBe(trace.id !== CONTESTED_ID);
      if (trace.id !== CONTESTED_ID) {
        if (low < unionLow) unionLow = low;
        if (high > unionHigh) unionHigh = high;
      }
    }
    expect(published.strata.s1ObservedInitialSize.unionIntervalUm[0]).toBe(unionLow);
    expect(published.strata.s1ObservedInitialSize.unionIntervalUm[1]).toBe(unionHigh);
    // The exclusion is non-vacuous: the contested trace's stated floor lies below the
    // published union floor, so including it would have changed the published number.
    const contested = traces.find((trace) => trace.id === CONTESTED_ID);
    expect(contested).toBeDefined();
    expect(contested!.initialRadiusUm - contested!.initialRadiusRangeUm).toBeLessThan(unionLow);

    const domain = published.strata.s1ObservedInitialSize.conditionDomain;
    const contributing = traces.filter((trace) => trace.id !== CONTESTED_ID);
    const sorted = (values: readonly number[]): readonly number[] =>
      [...values].sort((a, b) => a - b);
    const temps = sorted(contributing.map((trace) => trace.tempC));
    const sigmas = sorted(contributing.map((trace) => trace.sigmaIcePercent));
    const pressures = sorted(contributing.map((trace) => trace.pressurePa));
    expect(domain.tempC).toEqual([temps[0], temps[temps.length - 1]]);
    expect(domain.sigmaIcePercent).toEqual([sigmas[0], sigmas[sigmas.length - 1]]);
    expect(domain.pressurePa).toEqual([pressures[0], pressures[pressures.length - 1]]);
  });

  it("independently recomputes every published S2 number from a fresh lock parse", () => {
    const traces = rawLock.harrisonCandidate.traces;
    expect(rawLock.harrisonCandidate.timesSeconds[4]).toBe(300);
    expect(
      rawLock.harrisonCandidate.timesSeconds[rawLock.harrisonCandidate.timesSeconds.length - 1],
    ).toBe(300);
    expect(published.strata.s2GrownMassEquivalentSize300s.timeSeconds).toBe(300);
    const rows = published.strata.s2GrownMassEquivalentSize300s.perTrace;
    expect(rows).toHaveLength(traces.length);
    let low = Number.POSITIVE_INFINITY;
    let high = Number.NEGATIVE_INFINITY;
    for (let index = traces.length - 1; index >= 0; index--) {
      const trace = traces[index];
      const row = rows[index];
      expect(row.id).toBe(trace.id);
      expect(row.massRatioAt300s).toBe(trace.massRatios[4]);
      // Commuted multiplication order versus the producer; exact for binary64.
      const central = Math.cbrt(trace.massRatios[4]) * trace.initialRadiusUm;
      expect(row.centralEquivalentRadiusUm).toBe(central);
      expect(row.radiusUnderUnresolvedMismatch).toBe(trace.id === CONTESTED_ID);
      expect(row.contributesToUnion).toBe(trace.id !== CONTESTED_ID);
      if (trace.id !== CONTESTED_ID) {
        if (central < low) low = central;
        if (central > high) high = central;
      }
    }
    expect(published.strata.s2GrownMassEquivalentSize300s.unionCentralIntervalUm[0]).toBe(low);
    expect(published.strata.s2GrownMassEquivalentSize300s.unionCentralIntervalUm[1]).toBe(high);
  });

  it("echoes the warm anchor rows exactly and keeps them a non-size anchor", () => {
    expect(published.warmAnchorW1.tempC).toBe(rawLock.takahashiDiagnostic.conditions.tempC);
    expect(published.warmAnchorW1.rows).toEqual(rawLock.takahashiDiagnostic.ensembleFit.rows);
    const text = JSON.stringify(published.warmAnchorW1);
    expect(text).toContain("lengthConversionRefusal");
    expect(text).toContain("source-locked-non-gating-diagnostic");
  });

  it("publishes no numeric stratum reaching 100 um, with the named refusal present", () => {
    const numericEndpoints = [
      ...published.strata.s1ObservedInitialSize.perTrace.flatMap((row) => row.intervalUm),
      ...published.strata.s1ObservedInitialSize.unionIntervalUm,
      ...published.strata.s2GrownMassEquivalentSize300s.perTrace.map(
        (row) => row.centralEquivalentRadiusUm,
      ),
      ...published.strata.s2GrownMassEquivalentSize300s.unionCentralIntervalUm,
    ];
    expect(numericEndpoints.length).toBeGreaterThan(0);
    for (const value of numericEndpoints) {
      expect(Number.isFinite(value)).toBe(true);
      expect(value).toBeLessThan(100);
      expect(value).toBeGreaterThan(0);
    }
    const names = published.refusals.map((refusal) => refusal.name);
    expect(names).toContain("no-stratum-at-or-above-100um");
    expect(names).toContain("no-aspect-ratio-stratum");
    expect(names).toContain("no-pressure-stratum");
    expect(names).toContain("no-growth-history-stratum");
    expect(names).toContain("no-field-of-view-stratum");
    expect(names).toContain("corrected-minus-31-5C-row-stays-absent");
    expect(names).toContain("lock-data-pins-inherited");
    expect(names).toHaveLength(7);
  });

  it("rejects named operand mutations (each control executes its mutation)", () => {
    const baseline = JSON.parse(lockText) as Record<string, never>;
    expect(phase6SizeStrataOperandFailures(baseline)).toEqual([]);

    interface Mutable {
      harrisonCandidate: {
        timesSeconds: number[];
        dataQualityPins: string[];
        traces: {
          id: string;
          initialRadiusUm: number;
          tempC: number;
          massRatios: number[];
        }[];
      };
      takahashiDiagnostic: {
        ensembleFit: {
          rows: { nonprobabilisticDiagnosticRangeGrams: [number, number] }[];
        };
      };
    }
    const clone = (): Mutable => JSON.parse(lockText) as Mutable;

    const nanRadius = clone();
    nanRadius.harrisonCandidate.traces[3].initialRadiusUm = Number.NaN;
    expect(Number.isNaN(nanRadius.harrisonCandidate.traces[3].initialRadiusUm)).toBe(true);
    expect(phase6SizeStrataOperandFailures(nanRadius).join("\n")).toContain(
      "initialRadiusUm must be a finite positive number",
    );

    const synthesized = clone();
    synthesized.harrisonCandidate.traces.push({
      ...synthesized.harrisonCandidate.traces[0],
      id: "synthesized",
      tempC: -31.5,
      initialRadiusUm: 10.69,
    });
    expect(synthesized.harrisonCandidate.traces).toHaveLength(17);
    const synthesizedFailures = phase6SizeStrataOperandFailures(synthesized).join("\n");
    expect(synthesizedFailures).toContain("trace count must be exactly 16");
    expect(synthesizedFailures).toContain("required-absent corrected row");

    const truncated = clone();
    truncated.harrisonCandidate.traces.pop();
    expect(truncated.harrisonCandidate.traces).toHaveLength(15);
    expect(phase6SizeStrataOperandFailures(truncated).join("\n")).toContain(
      "trace count must be exactly 16",
    );

    const negativeRatio = clone();
    negativeRatio.harrisonCandidate.traces[7].massRatios[4] = -1;
    expect(negativeRatio.harrisonCandidate.traces[7].massRatios[4]).toBe(-1);
    expect(phase6SizeStrataOperandFailures(negativeRatio).join("\n")).toContain(
      "massRatios[4] must be a finite positive number",
    );

    const shiftedWindow = clone();
    shiftedWindow.harrisonCandidate.timesSeconds[4] = 240;
    expect(shiftedWindow.harrisonCandidate.timesSeconds[4]).toBe(240);
    expect(phase6SizeStrataOperandFailures(shiftedWindow).join("\n")).toContain(
      "timesSeconds[4] must be the locked 300 s common-window end",
    );

    const invertedWarmRange = clone();
    const row = invertedWarmRange.takahashiDiagnostic.ensembleFit.rows[0];
    row.nonprobabilisticDiagnosticRangeGrams = [
      row.nonprobabilisticDiagnosticRangeGrams[1],
      row.nonprobabilisticDiagnosticRangeGrams[0],
    ];
    expect(
      row.nonprobabilisticDiagnosticRangeGrams[0],
    ).toBeGreaterThan(row.nonprobabilisticDiagnosticRangeGrams[1]);
    expect(phase6SizeStrataOperandFailures(invertedWarmRange).join("\n")).toContain(
      "nonprobabilisticDiagnosticRangeGrams must bracket massGrams",
    );

    const droppedPin = clone();
    const pinCountBefore = droppedPin.harrisonCandidate.dataQualityPins.length;
    droppedPin.harrisonCandidate.dataQualityPins =
      droppedPin.harrisonCandidate.dataQualityPins.filter(
        (pin) => !pin.includes("716d"),
      );
    expect(droppedPin.harrisonCandidate.dataQualityPins.length).toBe(pinCountBefore - 1);
    expect(phase6SizeStrataOperandFailures(droppedPin).join("\n")).toContain(
      "716d radius exclusion is no longer justified",
    );

    expect(() => computePhase6SizeStrata(truncated)).toThrow(/trace count must be exactly 16/);
  });

  it("a finite radius mutation changes the computed artifact (plan-promised control)", () => {
    const baseline = phase6SizeStrataArtifactText(
      computePhase6SizeStrata(JSON.parse(lockText)),
    );
    const mutated = JSON.parse(lockText) as {
      harrisonCandidate: { traces: { id: string; initialRadiusUm: number }[] };
    };
    // Mutate an UNCONTESTED trace's radius so the change must flow into both strata.
    const target = mutated.harrisonCandidate.traces.find((trace) => trace.id === "731a");
    expect(target).toBeDefined();
    target!.initialRadiusUm = target!.initialRadiusUm + 0.25;
    expect(target!.initialRadiusUm).not.toBe(12.0);
    const mutatedText = phase6SizeStrataArtifactText(computePhase6SizeStrata(mutated));
    expect(mutatedText).not.toBe(baseline);
  });

  it("refuses tampered input text by hash, for both pinned inputs", () => {
    // A length-changing tamper is refused by the byte-length pin...
    const lengthTamper = `${lockText} `;
    expect(lengthTamper).not.toBe(lockText);
    expect(() => buildPhase6SizeStrataArtifact(lengthTamper, nakayaText)).toThrow(
      /normalized byte length/,
    );
    // ...and a length-preserving substitution is refused by the hash pin.
    expect(lockText).toContain("11.7");
    const valueTamper = lockText.replace("11.7", "11.8");
    expect(valueTamper).not.toBe(lockText);
    expect(valueTamper.length).toBe(lockText.length);
    expect(() => buildPhase6SizeStrataArtifact(valueTamper, nakayaText)).toThrow(/SHA-256/);

    const tamperedNakaya = nakayaText.replace("−3.3", "−3.4");
    expect(tamperedNakaya).not.toBe(nakayaText);
    expect(phase6NakayaRecordTextFailures(tamperedNakaya)).not.toEqual([]);
    expect(() => buildPhase6SizeStrataArtifact(lockText, tamperedNakaya)).toThrow(
      /Nakaya record/,
    );
  });
});
