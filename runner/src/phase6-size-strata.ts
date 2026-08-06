// Phase 6 WP1 (narrowed) — the Nakaya-comparison physical-size strata operator.
//
// One deterministic pure function over the hash-pinned held-out candidate lock. It consumes only
// already-locked source observations and uncertainties — never model output, archive bytes, or a
// new source — and emits the freeze artifact `evidence/phase6-size-strata/strata.json`:
// stratum S1 (observed initial size, assumption-free), stratum S2 (grown mass-equivalent size at
// 300 s under a declared uniform-density closure, uncertainties uncombined), warm mass anchor W1
// (with an explicit length-conversion refusal), and seven mandatory refusals.
// Governing plan: docs/plans/phase-6-wp1-size-strata.md.

import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  PHASE6_HELDOUT_LOCK_RELATIVE_PATH,
  parsePhase6HeldoutCandidateLockText,
} from "./phase6-heldout-source-lock.ts";

export const PHASE6_SIZE_STRATA_SCHEMA = "phase6-size-strata-freeze-v1";
export const PHASE6_SIZE_STRATA_ARTIFACT_RELATIVE_PATH =
  "evidence/phase6-size-strata/strata.json";

export const PHASE6_NAKAYA_RECORD_RELATIVE_PATH = "research/nakaya-morphology-diagram.md";
/** LF-normalized pin of the tracked Nakaya record (2026-08-06); the figure prints no size. */
export const PHASE6_NAKAYA_RECORD_TEXT_SHA256 =
  "f8746a31cc183161c345ec0fe3c139a98d9c955874195576ade9b5cd40fb1769";
export const PHASE6_NAKAYA_RECORD_TEXT_BYTES = 12_112;

/** The 300 s stratum time is forced by the lock: the last entry of the common window. */
const S2_TIME_SECONDS = 300;
const S2_TIME_INDEX = 4;

interface StrataTrace {
  readonly id: string;
  readonly pressurePa: number;
  readonly tempC: number;
  readonly tempRangeC: number;
  readonly sigmaIcePercent: number;
  readonly sigmaIceRangePercent: number;
  readonly initialRadiusUm: number;
  readonly initialRadiusRangeUm: number;
  readonly massRatios: readonly number[];
}

interface WarmRow {
  readonly timeMinutes: number;
  readonly massGrams: number;
  readonly nonprobabilisticDiagnosticRangeGrams: readonly [number, number];
}

interface StrataOperands {
  readonly lockId: string;
  readonly timesSeconds: readonly number[];
  readonly massRatioOperator: string;
  readonly traces: readonly StrataTrace[];
  readonly warm: {
    readonly id: string;
    readonly status: string;
    readonly tempC: number;
    readonly habitCode: string;
    readonly rows: readonly WarmRow[];
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function finitePositive(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function finiteNonnegative(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

/**
 * Structural validation of exactly the operand fields this operator consumes. The lock's own
 * canonical/text hashes are enforced separately by `parsePhase6HeldoutCandidateLockText`; these
 * checks fail by name so a defect is reported as itself rather than as a digest mismatch.
 */
export function phase6SizeStrataOperandFailures(value: unknown): readonly string[] {
  if (!isRecord(value)) return ["candidate lock is not an object"];
  const failures: string[] = [];
  const harrison = value.harrisonCandidate;
  if (!isRecord(harrison)) return ["harrisonCandidate is missing"];
  const times = harrison.timesSeconds;
  if (!Array.isArray(times) || times[S2_TIME_INDEX] !== S2_TIME_SECONDS) {
    failures.push(
      `timesSeconds[${S2_TIME_INDEX}] must be the locked ${S2_TIME_SECONDS} s common-window end`,
    );
  }
  const uncertainty = harrison.observationUncertainty;
  if (!isRecord(uncertainty) || uncertainty.operator !== "[0.95*y, 1.05*y]") {
    failures.push("Harrison observationUncertainty.operator must be the locked [0.95*y, 1.05*y]");
  }
  const traces = harrison.traces;
  if (!Array.isArray(traces) || traces.length !== 16) {
    failures.push(
      `size-strata operand trace count must be exactly 16, got ` +
        `${Array.isArray(traces) ? traces.length : "non-array"}`,
    );
  }
  // Per-trace guards run on whatever rows exist, so a specific defect (for example a
  // synthesized required-absent row) is reported by name even when the count is also wrong.
  if (Array.isArray(traces)) {
    for (const [index, trace] of traces.entries()) {
      if (!isRecord(trace)) {
        failures.push(`trace ${index} is not an object`);
        continue;
      }
      const label = `trace ${String(trace.id ?? index)}`;
      if (!finitePositive(trace.initialRadiusUm)) {
        failures.push(`${label}: initialRadiusUm must be a finite positive number`);
      }
      if (!finiteNonnegative(trace.initialRadiusRangeUm)) {
        failures.push(`${label}: initialRadiusRangeUm must be a finite nonnegative number`);
      }
      if (typeof trace.tempC !== "number" || !Number.isFinite(trace.tempC) || trace.tempC >= 0) {
        failures.push(`${label}: tempC must be a finite negative number`);
      }
      if (!finiteNonnegative(trace.tempRangeC)) {
        failures.push(`${label}: tempRangeC must be a finite nonnegative number`);
      }
      if (!finitePositive(trace.sigmaIcePercent)) {
        failures.push(`${label}: sigmaIcePercent must be a finite positive number`);
      }
      if (!finiteNonnegative(trace.sigmaIceRangePercent)) {
        failures.push(`${label}: sigmaIceRangePercent must be a finite nonnegative number`);
      }
      if (!finitePositive(trace.pressurePa)) {
        failures.push(`${label}: pressurePa must be a finite positive number`);
      }
      const ratios = trace.massRatios;
      if (!Array.isArray(ratios) || !finitePositive(ratios[S2_TIME_INDEX])) {
        failures.push(`${label}: massRatios[${S2_TIME_INDEX}] must be a finite positive number`);
      }
      // The lock pins this corrected Table 1 row as ABSENT: no archive member backs it, and
      // synthesizing or substituting it is forbidden. Refuse it here by name so the defect is
      // not first reported as a hash mismatch.
      if (trace.tempC === -31.5 || trace.initialRadiusUm === 10.69) {
        failures.push(
          `${label}: matches the required-absent corrected row ` +
            "(-31.5 C / 5% / 10.69 um); synthesizing it is forbidden",
        );
      }
    }
  }
  const takahashi = value.takahashiDiagnostic;
  if (!isRecord(takahashi)) {
    failures.push("takahashiDiagnostic is missing");
    return failures;
  }
  if (takahashi.status !== "source-locked-non-gating-diagnostic") {
    failures.push("takahashiDiagnostic.status must remain source-locked-non-gating-diagnostic");
  }
  if (takahashi.scoreable !== false) {
    failures.push("takahashiDiagnostic must remain scoreable=false");
  }
  const conditions = takahashi.conditions;
  if (!isRecord(conditions) || conditions.tempC !== -5.3) {
    failures.push("takahashiDiagnostic.conditions.tempC must be the locked -5.3 C");
  }
  const fit = takahashi.ensembleFit;
  const rows = isRecord(fit) ? fit.rows : undefined;
  if (!Array.isArray(rows) || rows.length !== 2) {
    failures.push("takahashiDiagnostic.ensembleFit.rows must contain exactly the two locked rows");
  } else {
    for (const [index, row] of rows.entries()) {
      if (!isRecord(row)) {
        failures.push(`warm row ${index} is not an object`);
        continue;
      }
      const expectedMinutes = index === 0 ? 3 : 5;
      if (row.timeMinutes !== expectedMinutes) {
        failures.push(`warm row ${index}: timeMinutes must be ${expectedMinutes}`);
      }
      const central = row.massGrams;
      const range = row.nonprobabilisticDiagnosticRangeGrams;
      if (!finitePositive(central)) {
        failures.push(`warm row ${index}: massGrams must be a finite positive number`);
      }
      if (
        !Array.isArray(range) ||
        range.length !== 2 ||
        !finitePositive(range[0]) ||
        !finitePositive(range[1]) ||
        !finitePositive(central) ||
        !(range[0] < central && central < range[1])
      ) {
        failures.push(
          `warm row ${index}: nonprobabilisticDiagnosticRangeGrams must bracket massGrams`,
        );
      }
    }
  }
  return failures;
}

function extractOperands(value: unknown): StrataOperands {
  const failures = phase6SizeStrataOperandFailures(value);
  if (failures.length > 0) {
    throw new Error(`invalid size-strata operands:\n- ${failures.join("\n- ")}`);
  }
  const lock = value as Record<string, unknown>;
  const harrison = lock.harrisonCandidate as Record<string, unknown>;
  const takahashi = lock.takahashiDiagnostic as Record<string, unknown>;
  const conditions = takahashi.conditions as Record<string, unknown>;
  const fit = takahashi.ensembleFit as Record<string, unknown>;
  return {
    lockId: String(lock.lockId),
    timesSeconds: harrison.timesSeconds as readonly number[],
    massRatioOperator: (harrison.observationUncertainty as Record<string, unknown>)
      .operator as string,
    traces: harrison.traces as readonly StrataTrace[],
    warm: {
      id: String(takahashi.id),
      status: String(takahashi.status),
      tempC: conditions.tempC as number,
      habitCode: String(conditions.habitCode),
      rows: fit.rows as readonly WarmRow[],
    },
  };
}

export interface Phase6SizeStrataArtifact {
  readonly schema: typeof PHASE6_SIZE_STRATA_SCHEMA;
  readonly [key: string]: unknown;
}

/** Deterministic pure computation. No I/O, no clock, no configuration, no tunable value. */
export function computePhase6SizeStrata(lockValue: unknown): Phase6SizeStrataArtifact {
  const operands = extractOperands(lockValue);
  const s1PerTrace = operands.traces.map((trace) => ({
    id: trace.id,
    initialRadiusUm: trace.initialRadiusUm,
    initialRadiusRangeUm: trace.initialRadiusRangeUm,
    intervalUm: [
      trace.initialRadiusUm - trace.initialRadiusRangeUm,
      trace.initialRadiusUm + trace.initialRadiusRangeUm,
    ] as const,
    tempC: trace.tempC,
    tempRangeC: trace.tempRangeC,
    sigmaIcePercent: trace.sigmaIcePercent,
    sigmaIceRangePercent: trace.sigmaIceRangePercent,
    pressurePa: trace.pressurePa,
  }));
  const s1UnionUm = [
    Math.min(...s1PerTrace.map((row) => row.intervalUm[0])),
    Math.max(...s1PerTrace.map((row) => row.intervalUm[1])),
  ] as const;
  const conditionDomain = {
    tempC: [
      Math.min(...operands.traces.map((trace) => trace.tempC)),
      Math.max(...operands.traces.map((trace) => trace.tempC)),
    ],
    sigmaIcePercent: [
      Math.min(...operands.traces.map((trace) => trace.sigmaIcePercent)),
      Math.max(...operands.traces.map((trace) => trace.sigmaIcePercent)),
    ],
    pressurePa: [
      Math.min(...operands.traces.map((trace) => trace.pressurePa)),
      Math.max(...operands.traces.map((trace) => trace.pressurePa)),
    ],
    meaning:
      "envelope of the 16 traces' central condition values; per-trace marginal ranges are " +
      "frozen independently in the lock and are not combined here",
  };
  const s2PerTrace = operands.traces.map((trace) => ({
    id: trace.id,
    initialRadiusUm: trace.initialRadiusUm,
    massRatioAt300s: trace.massRatios[S2_TIME_INDEX],
    centralEquivalentRadiusUm:
      trace.initialRadiusUm * Math.cbrt(trace.massRatios[S2_TIME_INDEX]),
  }));
  const s2UnionCentralUm = [
    Math.min(...s2PerTrace.map((row) => row.centralEquivalentRadiusUm)),
    Math.max(...s2PerTrace.map((row) => row.centralEquivalentRadiusUm)),
  ] as const;

  return {
    schema: PHASE6_SIZE_STRATA_SCHEMA,
    purpose:
      "Nakaya-comparison physical-size strata frozen from already-locked source observations " +
      "only. Nakaya's Figure 1 prints no crystal size, growth time, or scale bar, so no single " +
      "'correct Nakaya measurement size' exists; the honest outputs are source-anchored strata " +
      "plus explicit refusals. The comparison itself stays ordinal (habit reversal sequence " +
      "across the recorded boundary temperatures).",
    quantityConvention:
      "All stratum values are RADII in micrometers (diameter = 2r). Binary64 values are " +
      "serialized with shortest round-trip JSON numbers.",
    lockProvenance: {
      relativePath: PHASE6_HELDOUT_LOCK_RELATIVE_PATH,
      lockId: operands.lockId,
      timesSeconds: operands.timesSeconds,
    },
    nakayaComparisonReference: {
      relativePath: PHASE6_NAKAYA_RECORD_RELATIVE_PATH,
      textSha256: PHASE6_NAKAYA_RECORD_TEXT_SHA256,
      textBytes: PHASE6_NAKAYA_RECORD_TEXT_BYTES,
      boundariesC: [-3.3, -9.9, -21.5],
      boundaryReadUncertaintyC: 0.5,
      contributesNoSizeOperand:
        "the figure defines habit regimes in temperature and supersaturation only; it reports " +
        "no crystal size, growth time, scale bar, or size stratum",
    },
    strata: {
      s1ObservedInitialSize: {
        kind: "assumption-free",
        quantity: "initial particle radius",
        unit: "micrometer",
        perTrace: s1PerTrace,
        unionIntervalUm: s1UnionUm,
        uncertaintySemantics:
          "each per-trace interval is that trace's own stated corrected-table marginal range " +
          "of a single quantity; the union combines nothing across quantities " +
          "(combineByQuadrature=false, scoreableEnvelope=false are honored)",
        conditionDomain,
        mapsToPhysicalSeedSize:
          "directly: an observed initial-particle radius interval. WP2 registers the lattice " +
          "mapping (radius to seed cells per candidate spacing) and its sensitivity runs; " +
          "nothing here chooses a lattice value.",
        caveats: [
          "per-particle crystallography was not observed",
          "per-particle shape was not observed",
          "a regular D6h seed of this radius would be a project-chosen sensitivity surrogate, " +
            "not a source observation (recorded rejection: Harrison seed assignment)",
        ],
      },
      s2GrownMassEquivalentSize300s: {
        kind: "declared-closure",
        quantity: "grown mass-equivalent radius at 300 s",
        unit: "micrometer",
        closure:
          "mass-equivalent radius under a compact-uniform-density closure: r0 * cbrt(m/m0). " +
          "Density cancels in the ratio, so no density constant enters. Per-particle shape and " +
          "crystallography were never observed; this is NOT an observed linear dimension.",
        timeSeconds: S2_TIME_SECONDS,
        timeSelection:
          "forced, not chosen: the last entry of the locked timesSeconds common window",
        perTrace: s2PerTrace,
        unionCentralIntervalUm: s2UnionCentralUm,
        uncertaintyOperatorsUncombined: {
          initialRadius: "per-trace corrected-table marginal range, listed under s1 perTrace",
          massRatio: `${operands.massRatioOperator} — source-stated maximum relative error; ` +
            "not a confidence interval, standard deviation, or probability distribution",
          combinedEnvelope:
            "refused: the lock freezes marginal ranges independently " +
            "(combineByQuadrature=false) and declines to authorize a joint envelope; no " +
            "cross-quantity corner is computed or scoreable",
        },
        conditionDomain,
        mapsToPhysicalSize:
          "a grown measurement size whose seed is the same trace family's S1 radius; WP2 " +
          "registers the stopping/measurement mapping and its sensitivities",
      },
    },
    warmAnchorW1: {
      kind: "mass-anchor-not-a-size-stratum",
      id: operands.warm.id,
      status: operands.warm.status,
      tempC: operands.warm.tempC,
      habitCode: operands.warm.habitCode,
      rows: operands.warm.rows,
      lengthConversionRefusal:
        "converting these masses to any linear size requires an ice-density closure that is " +
        "not a locked observation, and the observed habit is a hollow column whose rim width " +
        "was never observed, so a mass-equivalent length would understate maximum dimension " +
        "by an unobserved factor. Published so WP2/WP8 can see the only locked " +
        "warm-temperature scale information and why it does not become a stratum.",
    },
    refusals: [
      {
        name: "no-stratum-at-or-above-100um",
        reason:
          "no locked observation supports a stratum at or above 100 micrometers; the " +
          "100/150/200/300 um reconnaissance probes are non-transferable and their promotion " +
          "is forbidden by name (research/phase6-source-currency.md section 9)",
      },
      {
        name: "no-aspect-ratio-stratum",
        reason:
          "Takahashi's a(t) and c(t) rows are unpaired ensemble data; pairing them into " +
          "per-crystal aspect ratios would manufacture an observation",
      },
      {
        name: "no-pressure-stratum",
        reason:
          "TAKAHASHI91_PRESSURE_CONTEXT_V1 is source-locked-context-only; pressure is " +
          "confounded and no pass interval may be derived",
      },
      {
        name: "no-growth-history-stratum",
        reason:
          "both history candidates are not scoreable (substrate support or figure-only " +
          "schedule) and supply no free-crystal size observation",
      },
      {
        name: "no-field-of-view-stratum",
        reason:
          "borrowing a figure field-of-view width as crystal extent is forbidden " +
          "(research/phase6-source-currency.md section 3)",
      },
      {
        name: "corrected-minus-31-5C-row-stays-absent",
        reason:
          "the corrected -31.5 C / 5% / 10.69 um Table 1 row has no matching archive member; " +
          "synthesizing or substituting it is forbidden, and the operator refuses any trace " +
          "matching it",
      },
      {
        name: "lock-data-pins-inherited",
        reason:
          "heticegrowth_625.dat stays excluded (homogeneous family); 716d contributes only " +
          "direct m/m0; 805l uses the corrected 8.9 +/- 0.7 um radius; 712k's median " +
          "coalescer stands behind the locked mass ratios",
      },
    ],
    declaredExtrapolations: [
      "S1 and S2 are sourced at -30.9 to -35.7 C only, and W1 at -5.3 C only, while the " +
        "Nakaya comparison grid spans the whole diagram; applying the strata across all 204 " +
        "sweep points is a declared extrapolation.",
      "Both strata sit one to two orders of magnitude below the ~0.1-3 mm natural crystals " +
        "from which Nakaya's diagram was drawn; a registered comparison at these strata is a " +
        "statement about early growth at source-anchored sizes, not about millimetre-scale " +
        "natural crystals.",
    ],
    downstream: {
      numericStrataCount: 2,
      note:
        "whether WP2 treats S1 and S2 as two strata (Z = 2) or S1 only (Z = 1) is a WP2/WP3 " +
        "protocol decision made before any production row; this artifact records the frozen " +
        "candidates and presumes neither. The gated values-manifest binding is WP3's job.",
    },
  };
}

export function phase6SizeStrataArtifactText(artifact: Phase6SizeStrataArtifact): string {
  return `${JSON.stringify(artifact, null, 1)}\n`;
}

function sha256Hex(text: string): string {
  return createHash("sha256").update(new TextEncoder().encode(text)).digest("hex");
}

/** Validate the Nakaya record's LF-normalized identity so the reference pin is real. */
export function phase6NakayaRecordTextFailures(text: string): readonly string[] {
  const normalized = text.replace(/\r\n/g, "\n");
  const failures: string[] = [];
  const bytes = new TextEncoder().encode(normalized).byteLength;
  if (bytes !== PHASE6_NAKAYA_RECORD_TEXT_BYTES) {
    failures.push(
      `Nakaya record normalized byte length ${bytes} != ${PHASE6_NAKAYA_RECORD_TEXT_BYTES}`,
    );
  }
  const digest = sha256Hex(normalized);
  if (digest !== PHASE6_NAKAYA_RECORD_TEXT_SHA256) {
    failures.push(
      `Nakaya record normalized-text SHA-256 ${digest} != ${PHASE6_NAKAYA_RECORD_TEXT_SHA256}`,
    );
  }
  return failures;
}

/** Full pipeline from the two pinned tracked records to the artifact object. */
export function buildPhase6SizeStrataArtifact(
  lockText: string,
  nakayaText: string,
): Phase6SizeStrataArtifact {
  const nakayaFailures = phase6NakayaRecordTextFailures(nakayaText);
  if (nakayaFailures.length > 0) {
    throw new Error(`invalid Nakaya record input:\n- ${nakayaFailures.join("\n- ")}`);
  }
  const lock = parsePhase6HeldoutCandidateLockText(lockText);
  return computePhase6SizeStrata(lock);
}

function emit(repoRoot: string): void {
  const lockText = readFileSync(resolve(repoRoot, PHASE6_HELDOUT_LOCK_RELATIVE_PATH), "utf8");
  const nakayaText = readFileSync(
    resolve(repoRoot, PHASE6_NAKAYA_RECORD_RELATIVE_PATH),
    "utf8",
  );
  const text = phase6SizeStrataArtifactText(buildPhase6SizeStrataArtifact(lockText, nakayaText));
  const artifactPath = resolve(repoRoot, PHASE6_SIZE_STRATA_ARTIFACT_RELATIVE_PATH);
  mkdirSync(dirname(artifactPath), { recursive: true });
  writeFileSync(artifactPath, text);

  const manifestPath = resolve(repoRoot, "evidence/MANIFEST.json");
  const manifestText = readFileSync(manifestPath, "utf8");
  const manifest = JSON.parse(manifestText) as {
    fileCount: number;
    totalBytes: number;
    files: Record<string, { bytes: number; sha256: string }>;
  };
  const roundTrip = `${JSON.stringify(manifest, null, 1)}\n`;
  if (roundTrip !== manifestText) {
    throw new Error(
      "evidence/MANIFEST.json does not round-trip through JSON.stringify(value, null, 1); " +
        "refusing to rewrite it in a different format",
    );
  }
  const bytes = new TextEncoder().encode(text).byteLength;
  manifest.files["phase6-size-strata/strata.json"] = { bytes, sha256: sha256Hex(text) };
  manifest.fileCount = Object.keys(manifest.files).length;
  manifest.totalBytes = Object.values(manifest.files).reduce((sum, pin) => sum + pin.bytes, 0);
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 1)}\n`);
  process.stdout.write(
    `wrote ${PHASE6_SIZE_STRATA_ARTIFACT_RELATIVE_PATH} (${bytes} bytes, sha256 ` +
      `${sha256Hex(text)}) and updated evidence/MANIFEST.json\n`,
  );
}

const invokedDirectly =
  typeof process.argv[1] === "string" &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedDirectly) {
  if (process.argv[2] !== "emit") {
    process.stderr.write("usage: node runner/src/phase6-size-strata.ts emit\n");
    process.exit(2);
  }
  emit(process.cwd());
}
