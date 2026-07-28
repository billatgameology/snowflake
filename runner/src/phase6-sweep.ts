// Phase 6 WP2 — the validation sweep harness.
//
// This module turns the frozen protocol into runs and runs into a scored comparison. It does NOT
// decide anything: every threshold, every classification rule, every exclusion it applies comes
// from `phase6-protocol.ts`, which is hash-pinned. If a value is not registered there, this file
// must not invent it.
//
// **It fails closed.** Before a single point runs, `phase6SweepPreflight` requires that the
// protocol freeze is complete, that the manifest hashes to the registered value, that the freeze
// commit is an ancestor of HEAD, and that the tracked tree is clean. A sweep that cannot prove
// which protocol produced it is not evidence, and the charter's whole pre-registration argument
// rests on that being checkable rather than asserted.

import { execFileSync } from "node:child_process";
import { canonicalJsonSha256 } from "./gate4-evidence.ts";
import {
  PHASE6_CROSSPLATFORM_FIXTURE,
} from "./phase6-crossplatform.ts";
import {
  PHASE6_DOMAIN_SPOT_CHECK,
  PHASE6_PROTOCOL_SHA256,
  phase6FreezeComplete,
  phase6IsExtentFragile,
  phase6IsInAmbiguityBand,
  phase6PendingFreezeItems,
  phase6ProtocolManifest,
  phase6ProtocolProvenance,
  phase6ReferenceRegime,
  phase6ScoreHabit,
  phase6SweepGrid,
  PHASE6_REFERENCE_REGIMES,
  type Phase6GridPoint,
  type Phase6ModelClass,
  type Phase6ReferenceRegime,
  type Phase6Score,
} from "./phase6-protocol.ts";

/** Registered habit thresholds — restated from the protocol, not re-chosen. */
const PLATE_CEILING = 1 / 1.5;
const COLUMN_FLOOR = 1.5;

/** Classify a measured aspect ratio under the registered thresholds. */
export function phase6ClassifyHabit(aspectRatioValue: number): Phase6ModelClass {
  if (!Number.isFinite(aspectRatioValue) || aspectRatioValue <= 0) return "invalid";
  if (aspectRatioValue <= PLATE_CEILING) return "plate";
  if (aspectRatioValue >= COLUMN_FLOOR) return "column";
  return "neutral";
}

export interface Phase6PreflightReport {
  readonly ok: boolean;
  readonly failures: readonly string[];
  readonly protocolSha256: string;
  readonly head: string;
  readonly node: string;
  readonly v8: string;
}

/**
 * Everything that must be true before a sweep may produce evidence. Returns the failures rather
 * than throwing, so a caller can print all of them at once — a preflight that reports one
 * problem per run wastes an operator's evening.
 */
export function phase6SweepPreflight(repoRoot: string = process.cwd()): Phase6PreflightReport {
  const failures: string[] = [];

  if (!phase6FreezeComplete()) {
    const pending = phase6PendingFreezeItems().map((item) => item.id).join(", ");
    failures.push(`protocol freeze incomplete: ${pending}`);
  }

  let protocolSha256 = "";
  try {
    // Imported lazily so a manifest failure is a preflight failure, not a module-load crash.
    protocolSha256 = canonicalJsonSha256(phase6ProtocolManifest());
    if (protocolSha256 !== PHASE6_PROTOCOL_SHA256) {
      failures.push(
        `protocol hash ${protocolSha256} does not match the registered ${PHASE6_PROTOCOL_SHA256} ` +
          "— a registered value was edited without updating the pin",
      );
    }
  } catch (error) {
    failures.push(`protocol manifest unavailable: ${error instanceof Error ? error.message : String(error)}`);
  }

  const provenance = phase6ProtocolProvenance(repoRoot);
  if (!provenance.freezeIsAncestor) {
    failures.push(
      "the registered freeze commit is not an ancestor of HEAD — this working tree cannot show " +
        "that the protocol was frozen before the sweep ran",
    );
  }
  if (!provenance.treeIsClean) {
    failures.push(
      `tracked tree is dirty, so the evidence could not be reproduced from ${provenance.head}:\n` +
        provenance.trackedStatus,
    );
  }

  return {
    ok: failures.length === 0,
    failures,
    protocolSha256,
    head: provenance.head,
    node: provenance.node,
    v8: provenance.v8,
  };
}

// The canonical hash is IMPORTED, never reimplemented. A local copy would have to reproduce
// gate4-evidence's key ordering and encoding exactly, and any drift between the two would make
// preflight reject a protocol that is in fact correct — a fail-closed check that fails for the
// wrong reason is worse than none, because it trains an operator to bypass it.

/** One sweep point, measured. */
export interface Phase6PointResult {
  readonly tempC: number;
  readonly fraction: number;
  readonly sigmaInf: number;
  readonly steps: number;
  readonly attached: number;
  readonly aspectRatio: number;
  readonly largestExtent: number;
  readonly symmetryError: number;
  readonly deltaSymClean: boolean;
  readonly allConverged: boolean;
  readonly domainContact: boolean;
  readonly seconds: number;
}

/** One sweep point, scored under the registered rules. */
export interface Phase6ScoredPoint {
  readonly point: Phase6GridPoint;
  readonly result: Phase6PointResult;
  readonly modelClass: Phase6ModelClass;
  readonly regime: Phase6ReferenceRegime;
  readonly score: Phase6Score;
  readonly inAmbiguityBand: boolean;
  readonly inHeadlineScope: boolean;
  readonly extentFragile: boolean;
  /** Why a point was excluded, named rather than silently dropped. */
  readonly exclusionReason: string | null;
}

/**
 * Apply the registered rules to a measured point. All of the judgement lives in the protocol;
 * this function only routes.
 *
 * A run is `invalid` — and therefore EXCLUDED BY NAME, never dropped — if it failed to converge,
 * broke D6h symmetry with noise off, or tripped the domain-contact guard. Those are runs that did
 * not happen properly, not statements about the model.
 */
export function phase6ScorePoint(
  point: Phase6GridPoint,
  result: Phase6PointResult,
): Phase6ScoredPoint {
  const invalidReasons: string[] = [];
  if (!result.allConverged) invalidReasons.push("a relaxation did not converge");
  if (!result.deltaSymClean) invalidReasons.push("a per-tick attachment delta broke D6h invariance");
  if (result.symmetryError !== 0) invalidReasons.push(`symmetryError = ${result.symmetryError} with noise off`);
  if (result.domainContact) invalidReasons.push("tripped the 65% domain-contact guard");

  const modelClass: Phase6ModelClass =
    invalidReasons.length > 0 ? "invalid" : phase6ClassifyHabit(result.aspectRatio);
  const regime = phase6ReferenceRegime(point.tempC);
  const spec = PHASE6_REFERENCE_REGIMES.find((candidate) => candidate.regime === regime);
  const inAmbiguityBand = phase6IsInAmbiguityBand(point.tempC);

  return {
    point,
    result,
    modelClass,
    regime,
    score: phase6ScoreHabit(point.tempC, modelClass),
    inAmbiguityBand,
    // A point counts toward the headline only if it is in a single-habit regime AND outside the
    // ambiguity band. Both conditions were registered pre-sweep.
    inHeadlineScope: (spec?.inHeadline ?? false) && !inAmbiguityBand,
    extentFragile: modelClass !== "invalid" && phase6IsExtentFragile(result.aspectRatio),
    exclusionReason: invalidReasons.length > 0 ? invalidReasons.join("; ") : null,
  };
}

export interface Phase6RegimeTally {
  readonly regime: Phase6ReferenceRegime;
  readonly inHeadline: boolean;
  readonly agree: number;
  readonly disagree: number;
  readonly excluded: number;
  readonly neutralCount: number;
  readonly extentFragile: number;
}

export interface Phase6SweepReport {
  readonly protocolSha256: string;
  readonly head: string;
  /** THE headline: agreement over headline-scope points, measured class. */
  readonly headlineAgree: number;
  readonly headlineTotal: number;
  /** Published beneath the headline, never above it. */
  readonly neutralCount: number;
  readonly excludedCount: number;
  readonly extentFragileCount: number;
  readonly perRegime: readonly Phase6RegimeTally[];
  readonly excludedPoints: readonly { tempC: number; fraction: number; reason: string }[];
}

/**
 * Aggregate scored points into the registered report shape.
 *
 * The headline is deliberately narrow — headline-scope points only — and the counts that could
 * inflate it travel with it rather than beneath a fold: neutrals (which score disagree), named
 * exclusions, and extent-fragile flags.
 */
export function phase6Aggregate(
  scored: readonly Phase6ScoredPoint[],
  protocolSha256: string,
  head: string,
): Phase6SweepReport {
  const headline = scored.filter((s) => s.inHeadlineScope);
  const perRegime = PHASE6_REFERENCE_REGIMES.map((spec) => {
    const inRegime = scored.filter((s) => s.regime === spec.regime && !s.inAmbiguityBand);
    return {
      regime: spec.regime,
      inHeadline: spec.inHeadline,
      agree: inRegime.filter((s) => s.score === "agree").length,
      disagree: inRegime.filter((s) => s.score === "disagree").length,
      excluded: inRegime.filter((s) => s.score === "excluded").length,
      neutralCount: inRegime.filter((s) => s.modelClass === "neutral").length,
      extentFragile: inRegime.filter((s) => s.extentFragile).length,
    };
  });

  return {
    protocolSha256,
    head,
    headlineAgree: headline.filter((s) => s.score === "agree").length,
    headlineTotal: headline.filter((s) => s.score !== "excluded").length,
    neutralCount: scored.filter((s) => s.modelClass === "neutral").length,
    excludedCount: scored.filter((s) => s.score === "excluded").length,
    extentFragileCount: scored.filter((s) => s.extentFragile).length,
    perRegime,
    excludedPoints: scored
      .filter((s) => s.exclusionReason !== null)
      .map((s) => ({
        tempC: s.point.tempC,
        fraction: s.point.fraction,
        reason: s.exclusionReason as string,
      })),
  };
}

/** The registered grid, as the harness will execute it. */
export function phase6SweepPlan(): readonly Phase6GridPoint[] {
  return phase6SweepGrid();
}

/**
 * The `grow-lk` argument vector for one registered grid point. Built from the protocol so a
 * sweep command cannot drift from the frozen configuration, and exported so the runbook and the
 * tests can assert they are the same thing.
 */
export function phase6PointCommand(point: Phase6GridPoint): readonly string[] {
  const fixture = PHASE6_CROSSPLATFORM_FIXTURE;
  return [
    "runner/src/main.ts", "grow-lk",
    "--temp-c", String(point.tempC),
    "--sigma-inf", point.sigmaInf.toFixed(6),
    "--dims", `${fixture.dims.nx},${fixture.dims.ny},${fixture.dims.nz}`,
    "--dx-um", String(fixture.dxUm),
    "--cfl", String(fixture.cflFill),
    "--target-extent", String(fixture.targetExtent),
    "--surface-policy", fixture.surfacePolicy,
    "--far-field", fixture.farField,
    "--metrics-every", "100000",
  ];
}

/** Domain spot-check verdict at the sweep's fastest-growing point. */
export function phase6DomainSpotCheckPasses(
  coarse: { attached: number; modelClass: Phase6ModelClass },
  fine: { attached: number; modelClass: Phase6ModelClass },
): { passed: boolean; reason: string } {
  if (PHASE6_DOMAIN_SPOT_CHECK.requireIdenticalClass && coarse.modelClass !== fine.modelClass) {
    return {
      passed: false,
      reason: `habit class differs between N=${PHASE6_DOMAIN_SPOT_CHECK.coarseN} (${coarse.modelClass}) ` +
        `and N=${PHASE6_DOMAIN_SPOT_CHECK.fineN} (${fine.modelClass})`,
    };
  }
  const relative = Math.abs(fine.attached - coarse.attached) / coarse.attached;
  if (relative > PHASE6_DOMAIN_SPOT_CHECK.attachedCountTolerance) {
    return {
      passed: false,
      reason: `attached counts differ by ${(relative * 100).toFixed(2)}%, over the registered ` +
        `${(PHASE6_DOMAIN_SPOT_CHECK.attachedCountTolerance * 100).toFixed(1)}%`,
    };
  }
  return { passed: true, reason: "class identical and attached counts within the registered tolerance" };
}

/** Exposed for the runner's preflight command. */
export function phase6GitHead(repoRoot: string = process.cwd()): string {
  return execFileSync("git", ["rev-parse", "HEAD"], { cwd: repoRoot, encoding: "utf8" }).trim();
}

/** Registered domain-contact guard: charter §3.1, 65% of any domain extent. */
export const PHASE6_DOMAIN_CONTACT_FRACTION = 0.65;

/**
 * Parse one `grow-lk` stdout into a measured point. Returns null when the run produced no
 * parseable summary at all, which the caller records as an excluded point rather than a zero.
 */
export function phase6ParseRun(
  point: Phase6GridPoint,
  stdout: string,
  seconds: number,
  domainN: number,
): Phase6PointResult | null {
  const tail = stdout.split("stop reason")[1];
  if (tail === undefined) return null;
  const num = (re: RegExp): number => {
    const hit = re.exec(tail);
    return hit === null ? Number.NaN : Number(hit[1]);
  };
  const largestExtent = num(/extent=(\d+)/);
  const aspectRatioValue = num(/AR=([0-9.e+-]+)/);
  if (!Number.isFinite(largestExtent) || !Number.isFinite(aspectRatioValue)) return null;
  return {
    tempC: point.tempC,
    fraction: point.fraction,
    sigmaInf: point.sigmaInf,
    steps: num(/step=(\d+)/),
    attached: num(/attached=(\d+)/),
    aspectRatio: aspectRatioValue,
    largestExtent,
    symmetryError: num(/symErr=([0-9.e+-]+)/),
    deltaSymClean: /deltaSymClean=true/.test(tail),
    allConverged: /allConverged=true/.test(tail),
    // Computed rather than parsed: the guard is a property of the geometry, and a run that
    // reached it must be excluded whether or not the runner happened to print it.
    domainContact: largestExtent / domainN > PHASE6_DOMAIN_CONTACT_FRACTION,
    seconds,
  };
}

export interface Phase6SweepProgress {
  readonly done: number;
  readonly total: number;
  readonly scored: Phase6ScoredPoint;
}

/**
 * Execute the registered grid, one child process per point, `concurrency` at a time.
 *
 * Independent processes rather than threads, the Phase 2b v5p pattern: a point that throws
 * cannot corrupt another, and each carries its own memory. Wall seconds are recorded per point
 * but are contended by construction and are NOT a cost measurement.
 */
export async function phase6RunSweep(options: {
  readonly concurrency: number;
  readonly repoRoot: string;
  readonly onPoint?: (progress: Phase6SweepProgress) => void;
  readonly points?: readonly Phase6GridPoint[];
}): Promise<readonly Phase6ScoredPoint[]> {
  const { execFile } = await import("node:child_process");
  const queue = options.points ?? phase6SweepPlan();
  const domainN = PHASE6_CROSSPLATFORM_FIXTURE.dims.nx;
  const scored: Phase6ScoredPoint[] = [];
  let next = 0;

  const runOne = (point: Phase6GridPoint): Promise<Phase6ScoredPoint> =>
    new Promise((resolve) => {
      const started = Date.now();
      execFile(
        process.execPath,
        [...phase6PointCommand(point)],
        { cwd: options.repoRoot, encoding: "utf8", maxBuffer: 128 * 1024 * 1024 },
        (error, stdout) => {
          const seconds = (Date.now() - started) / 1000;
          const parsed = phase6ParseRun(point, String(stdout ?? ""), seconds, domainN);
          if (parsed === null) {
            // A point that produced no summary is EXCLUDED BY NAME, never silently skipped and
            // never scored as a habit. Encoded as an unconverged result so the single scoring
            // path in phase6ScorePoint handles it.
            resolve(
              phase6ScorePoint(point, {
                tempC: point.tempC,
                fraction: point.fraction,
                sigmaInf: point.sigmaInf,
                steps: Number.NaN,
                attached: Number.NaN,
                aspectRatio: Number.NaN,
                largestExtent: Number.NaN,
                symmetryError: Number.NaN,
                deltaSymClean: false,
                allConverged: false,
                domainContact: false,
                seconds,
              }),
            );
            return;
          }
          if (error !== null && error !== undefined) {
            resolve(phase6ScorePoint(point, { ...parsed, allConverged: false }));
            return;
          }
          resolve(phase6ScorePoint(point, parsed));
        },
      ).on("error", () => {
        /* the callback above already resolves this point */
      });
    });

  async function worker(): Promise<void> {
    while (next < queue.length) {
      const point = queue[next++] as Phase6GridPoint;
      const result = await runOne(point);
      scored.push(result);
      options.onPoint?.({ done: scored.length, total: queue.length, scored: result });
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(options.concurrency, queue.length) }, () => worker()),
  );
  return scored;
}
