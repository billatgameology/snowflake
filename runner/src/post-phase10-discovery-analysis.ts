import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, relative, resolve } from "node:path";
import {
  POST_PHASE10_DISCOVERY_ROWS,
  readDiscoveryResult,
  type DiscoveryRow,
  type DiscoveryTerminalResult,
} from "./post-phase10-discovery.ts";

type Alignment = "physicalTime" | "extent" | "attachedCount";
type Observable = "aspectRatio" | "boundaryBasalShare" | "attachmentBasalShare";
type Sign = "negative" | "zero" | "positive";
type Trend = "constant" | "nondecreasing" | "nonincreasing" | "nonmonotonic" | "incomplete";

const ALIGNMENTS: readonly Alignment[] = ["physicalTime", "extent", "attachedCount"];
const OBSERVABLES: readonly Observable[] = [
  "aspectRatio",
  "boundaryBasalShare",
  "attachmentBasalShare",
];
const SEPARATION_THRESHOLD = 0.1;
const SUSTAINED_CHECKPOINTS = 3;
const NUMERICAL_EPSILON = 1e-12;

interface DiscoveryCycleEvent {
  readonly schema: "post-phase10-discovery-cycle-v1";
  readonly rowId: string;
  readonly cycle: number;
  readonly boundary: {
    readonly facets: {
      readonly basal: { readonly count: number };
      readonly prism: { readonly count: number };
    };
  };
  readonly attachmentFacets: {
    readonly basal: number;
    readonly prism: number;
  };
  readonly attachedCount: number;
  readonly extent: number;
  readonly aspectRatio: number;
  readonly simTimeSeconds: number;
}

interface TrajectorySample {
  readonly cycle: number;
  readonly physicalTime: number;
  readonly extent: number;
  readonly attachedCount: number;
  readonly aspectRatio: number;
  readonly boundaryBasalShare: number | null;
  readonly attachmentBasalShare: number | null;
}

export interface DifferenceCheckpoint {
  readonly coordinate: number;
  readonly difference: number | null;
  readonly leftCycle?: number;
  readonly rightCycle?: number;
}

export interface SustainedDifference {
  readonly coordinate: number;
  readonly windowEndCoordinate: number;
  readonly difference: number;
  readonly sign: Exclude<Sign, "zero">;
  readonly leftCycle: number | null;
  readonly rightCycle: number | null;
}

interface ScalarDelta {
  readonly from: number;
  readonly to: number;
  readonly signed: number;
  readonly relativeToFrom: number | null;
}

interface InputIdentity {
  readonly path: string;
  readonly bytes: number;
  readonly sha256: string;
}

function json<T>(path: string): T {
  return JSON.parse(readFileSync(path, "utf8")) as T;
}

function sha256(bytes: Buffer): string {
  return createHash("sha256").update(bytes).digest("hex");
}

function inputIdentity(campaignDirectory: string, path: string): InputIdentity {
  const bytes = readFileSync(path);
  return {
    path: relative(campaignDirectory, path).replaceAll("\\", "/"),
    bytes: bytes.byteLength,
    sha256: sha256(bytes),
  };
}

function scalarDelta(from: number, to: number): ScalarDelta {
  return {
    from,
    to,
    signed: to - from,
    relativeToFrom: from === 0 ? null : (to - from) / from,
  };
}

function sign(value: number): Sign {
  if (Math.abs(value) <= NUMERICAL_EPSILON) return "zero";
  return value > 0 ? "positive" : "negative";
}

export function firstSustainedDifference(
  checkpoints: readonly DifferenceCheckpoint[],
  threshold = SEPARATION_THRESHOLD,
  consecutive = SUSTAINED_CHECKPOINTS,
): SustainedDifference | null {
  if (!(threshold > 0) || !Number.isSafeInteger(consecutive) || consecutive < 1) {
    throw new Error("sustained-separation threshold and checkpoint count must be positive");
  }
  for (let start = 0; start <= checkpoints.length - consecutive; start++) {
    const window = checkpoints.slice(start, start + consecutive);
    const first = window[0];
    if (first.difference === null || Math.abs(first.difference) < threshold) continue;
    const firstSign = sign(first.difference);
    if (firstSign === "zero") continue;
    const sustained = window.every(
      (point) =>
        point.difference !== null &&
        Math.abs(point.difference) >= threshold &&
        sign(point.difference) === firstSign,
    );
    if (!sustained) continue;
    const last = window[window.length - 1];
    return {
      coordinate: first.coordinate,
      windowEndCoordinate: last.coordinate,
      difference: first.difference,
      sign: firstSign,
      leftCycle: first.leftCycle ?? null,
      rightCycle: first.rightCycle ?? null,
    };
  }
  return null;
}

export function discoveryTrend(values: readonly (number | null)[]): Trend {
  if (values.some((value) => value === null)) return "incomplete";
  const finite = values as readonly number[];
  if (finite.length < 2) return "constant";
  const nondecreasing = finite.slice(1).every((value, index) => value >= finite[index] - NUMERICAL_EPSILON);
  const nonincreasing = finite.slice(1).every((value, index) => value <= finite[index] + NUMERICAL_EPSILON);
  if (nondecreasing && nonincreasing) return "constant";
  if (nondecreasing) return "nondecreasing";
  if (nonincreasing) return "nonincreasing";
  return "nonmonotonic";
}

function readTrajectory(path: string, expectedRowId: string): readonly TrajectorySample[] {
  const text = readFileSync(path, "utf8").trim();
  if (text === "") throw new Error(`empty trajectory: ${path}`);
  let cumulativeBasal = 0;
  let cumulativePrism = 0;
  return text.split(/\r?\n/u).map((line, index) => {
    const event = JSON.parse(line) as DiscoveryCycleEvent;
    if (event.schema !== "post-phase10-discovery-cycle-v1" || event.rowId !== expectedRowId) {
      throw new Error(`unexpected trajectory identity at ${path}:${index + 1}`);
    }
    cumulativeBasal += event.attachmentFacets.basal;
    cumulativePrism += event.attachmentFacets.prism;
    const boundaryBasal = event.boundary.facets.basal.count;
    const boundaryPrism = event.boundary.facets.prism.count;
    const boundaryDenominator = boundaryBasal + boundaryPrism;
    const attachmentDenominator = cumulativeBasal + cumulativePrism;
    return {
      cycle: event.cycle,
      physicalTime: event.simTimeSeconds,
      extent: event.extent,
      attachedCount: event.attachedCount,
      aspectRatio: event.aspectRatio,
      boundaryBasalShare:
        boundaryDenominator === 0 ? null : boundaryBasal / boundaryDenominator,
      attachmentBasalShare:
        attachmentDenominator === 0 ? null : cumulativeBasal / attachmentDenominator,
    };
  });
}

function coordinate(sample: TrajectorySample, alignment: Alignment): number {
  return sample[alignment];
}

function alignedDifferences(
  left: readonly TrajectorySample[],
  right: readonly TrajectorySample[],
  alignment: Alignment,
  observable: Observable,
): readonly DifferenceCheckpoint[] {
  const lower = Math.max(coordinate(left[0], alignment), coordinate(right[0], alignment));
  const upper = Math.min(
    coordinate(left[left.length - 1], alignment),
    coordinate(right[right.length - 1], alignment),
  );
  const coordinates = [
    ...new Set(
      [...left, ...right]
        .map((sample) => coordinate(sample, alignment))
        .filter((value) => value >= lower && value <= upper),
    ),
  ].sort((a, b) => a - b);
  let leftIndex = 0;
  let rightIndex = 0;
  return coordinates.map((value) => {
    while (
      leftIndex + 1 < left.length &&
      coordinate(left[leftIndex + 1], alignment) <= value
    ) {
      leftIndex++;
    }
    while (
      rightIndex + 1 < right.length &&
      coordinate(right[rightIndex + 1], alignment) <= value
    ) {
      rightIndex++;
    }
    const leftValue = left[leftIndex][observable];
    const rightValue = right[rightIndex][observable];
    return {
      coordinate: value,
      difference:
        leftValue === null || rightValue === null ? null : leftValue - rightValue,
      leftCycle: left[leftIndex].cycle,
      rightCycle: right[rightIndex].cycle,
    };
  });
}

function terminalObservables(samples: readonly TrajectorySample[]): Record<Observable, number | null> {
  const final = samples[samples.length - 1];
  return {
    aspectRatio: final.aspectRatio,
    boundaryBasalShare: final.boundaryBasalShare,
    attachmentBasalShare: final.attachmentBasalShare,
  };
}

function laneA(results: ReadonlyMap<string, DiscoveryTerminalResult>, eligibility: unknown): unknown {
  const rows = ["a80", "a96", "a112"].map((id) => results.get(id) as DiscoveryTerminalResult);
  const comparison = (from: DiscoveryTerminalResult, to: DiscoveryTerminalResult) => ({
    from: from.rowId,
    to: to.rowId,
    attachedCount: scalarDelta(from.attachedCount, to.attachedCount),
    aspectRatio: scalarDelta(from.aspectRatio, to.aspectRatio),
    cycles: scalarDelta(from.cycles, to.cycles),
    simTimeSeconds: scalarDelta(from.simTimeSeconds, to.simTimeSeconds),
  });
  return {
    eligibility,
    rows: rows.map((result) => ({
      rowId: result.rowId,
      admissible: result.admissible,
      habitClass: result.habitClass,
      cycles: result.cycles,
      attachedCount: result.attachedCount,
      aspectRatio: result.aspectRatio,
      simTimeSeconds: result.simTimeSeconds,
      wallSeconds: result.wallSeconds,
    })),
    successiveDomainDeltas: [comparison(rows[0], rows[1]), comparison(rows[1], rows[2])],
  };
}

function laneB(results: ReadonlyMap<string, DiscoveryTerminalResult>): unknown {
  const cells = {
    n80c1: results.get("a80") as DiscoveryTerminalResult,
    n96c1: results.get("a96") as DiscoveryTerminalResult,
    n80c05: results.get("b80-c05") as DiscoveryTerminalResult,
    n96c05: results.get("b96-c05") as DiscoveryTerminalResult,
  };
  const metric = (name: "attachedCount" | "aspectRatio" | "cycles" | "simTimeSeconds") => {
    const values = {
      n80c1: cells.n80c1[name],
      n96c1: cells.n96c1[name],
      n80c05: cells.n80c05[name],
      n96c05: cells.n96c05[name],
    };
    const domainAtC1 = values.n96c1 - values.n80c1;
    const domainAtC05 = values.n96c05 - values.n80c05;
    const timestepAtN80 = values.n80c05 - values.n80c1;
    const timestepAtN96 = values.n96c05 - values.n96c1;
    return {
      values,
      domainContrasts: { atCfl0p1: domainAtC1, atCfl0p05: domainAtC05 },
      timestepContrasts: { atN80: timestepAtN80, atN96: timestepAtN96 },
      interaction: domainAtC05 - domainAtC1,
    };
  };
  const baseline = cells.n96c1;
  const seedPerturbation = (id: "b96-seed7" | "b96-seed9") => {
    const candidate = results.get(id) as DiscoveryTerminalResult;
    const baselineGrowth = baseline.attachedCount - baseline.seedSites;
    const candidateGrowth = candidate.attachedCount - candidate.seedSites;
    return {
      rowId: id,
      seedSites: scalarDelta(baseline.seedSites, candidate.seedSites),
      totalAttached: scalarDelta(baseline.attachedCount, candidate.attachedCount),
      postSeedGrowth: scalarDelta(baselineGrowth, candidateGrowth),
      aspectRatio: scalarDelta(baseline.aspectRatio, candidate.aspectRatio),
      cycles: scalarDelta(baseline.cycles, candidate.cycles),
      simTimeSeconds: scalarDelta(baseline.simTimeSeconds, candidate.simTimeSeconds),
    };
  };
  return {
    baselineRowId: "a96",
    note: "Four cells are reported directly; no error law is fit from two levels.",
    metrics: {
      attachedCount: metric("attachedCount"),
      aspectRatio: metric("aspectRatio"),
      cycles: metric("cycles"),
      simTimeSeconds: metric("simTimeSeconds"),
    },
    seedPerturbations: [seedPerturbation("b96-seed7"), seedPerturbation("b96-seed9")],
  };
}

interface LaneCPair {
  readonly tempC: number;
  readonly fraction: number;
  readonly sigmaInfinity: number;
  readonly rowIds: { readonly m1: string; readonly noDip: string };
  readonly terminal: {
    readonly m1: Record<Observable, number | null>;
    readonly noDip: Record<Observable, number | null>;
    readonly differenceM1MinusNoDip: Record<Observable, number | null>;
  };
  readonly firstSustained: Record<Alignment, Record<Observable, SustainedDifference | null>>;
}

function laneC(
  campaignDirectory: string,
  rows: readonly DiscoveryRow[],
): { readonly pairs: readonly LaneCPair[]; readonly forcingMaps: readonly unknown[] } {
  const conditions = new Map<string, DiscoveryRow[]>();
  for (const row of rows.filter((candidate) => candidate.lane === "C")) {
    const key = `${row.tempC}/${row.fraction}`;
    conditions.set(key, [...(conditions.get(key) ?? []), row]);
  }
  const pairs = [...conditions.values()]
    .map((matched): LaneCPair => {
      const m1Row = matched.find((row) => row.paramSet === "M1");
      const noDipRow = matched.find((row) => row.paramSet === "M1_NO_DIP_ABLATION");
      if (m1Row === undefined || noDipRow === undefined) {
        throw new Error(`incomplete Lane C pair: ${matched.map((row) => row.id).join(",")}`);
      }
      const m1 = readTrajectory(resolve(campaignDirectory, "rows", m1Row.id, "events.jsonl"), m1Row.id);
      const noDip = readTrajectory(
        resolve(campaignDirectory, "rows", noDipRow.id, "events.jsonl"),
        noDipRow.id,
      );
      const m1Terminal = terminalObservables(m1);
      const noDipTerminal = terminalObservables(noDip);
      const difference = Object.fromEntries(
        OBSERVABLES.map((observable) => [
          observable,
          m1Terminal[observable] === null || noDipTerminal[observable] === null
            ? null
            : m1Terminal[observable] - noDipTerminal[observable],
        ]),
      ) as Record<Observable, number | null>;
      const firstSustained = Object.fromEntries(
        ALIGNMENTS.map((alignment) => [
          alignment,
          Object.fromEntries(
            OBSERVABLES.map((observable) => [
              observable,
              firstSustainedDifference(alignedDifferences(m1, noDip, alignment, observable)),
            ]),
          ),
        ]),
      ) as Record<Alignment, Record<Observable, SustainedDifference | null>>;
      return {
        tempC: m1Row.tempC,
        fraction: m1Row.fraction,
        sigmaInfinity: m1Row.sigmaInfinity,
        rowIds: { m1: m1Row.id, noDip: noDipRow.id },
        terminal: {
          m1: m1Terminal,
          noDip: noDipTerminal,
          differenceM1MinusNoDip: difference,
        },
        firstSustained,
      };
    })
    .sort((a, b) => a.tempC - b.tempC || a.fraction - b.fraction);

  const forcingMaps = [...new Set(pairs.map((pair) => pair.tempC))].map((tempC) => {
    const temperaturePairs = pairs
      .filter((pair) => pair.tempC === tempC)
      .sort((a, b) => a.fraction - b.fraction);
    return {
      tempC,
      fractions: temperaturePairs.map((pair) => pair.fraction),
      observables: Object.fromEntries(
        OBSERVABLES.map((observable) => {
          const finalDifferences = temperaturePairs.map(
            (pair) => pair.terminal.differenceM1MinusNoDip[observable],
          );
          return [
            observable,
            {
              finalDifferences,
              finalSigns: finalDifferences.map((value) => (value === null ? null : sign(value))),
              finalTrend: discoveryTrend(finalDifferences),
              firstSustainedTiming: Object.fromEntries(
                ALIGNMENTS.map((alignment) => {
                  const values = temperaturePairs.map(
                    (pair) => pair.firstSustained[alignment][observable]?.coordinate ?? null,
                  );
                  return [alignment, { values, trend: discoveryTrend(values) }];
                }),
              ),
            },
          ];
        }),
      ),
    };
  });
  return { pairs, forcingMaps };
}

function formatNumber(value: number | null, digits = 6): string {
  if (value === null) return "—";
  return Number.isInteger(value) ? String(value) : value.toFixed(digits).replace(/0+$/u, "").replace(/\.$/u, "");
}

function markdownReport(analysis: any): string {
  const laneARows = analysis.laneA.rows as readonly any[];
  const laneCDifferences = analysis.laneC.pairs as readonly LaneCPair[];
  const lines = [
    "# Post-Phase-10 discovery campaign",
    "",
    "This is exploratory model-development evidence, not Phase 7, a Phase 10 reopening, a physical-causality result, or quantitative validation.",
    "",
    "## Method",
    "",
    `All 31 registered rows reached terminal results. Analysis method \`${analysis.analysisMethod}\` uses a post-hoc sustained-separation threshold of ${analysis.postHocSustainedSeparation.absoluteDifferenceThreshold} for ${analysis.postHocSustainedSeparation.consecutiveAlignedCheckpoints} consecutive carry-forward-aligned checkpoints with one sign. Boundary composition is basal/(basal+prism); attachment orientation is cumulative basal/(basal+prism) attachment events.`,
    "",
    "## Lane A — measured domain sequence",
    "",
    "| Row | Admissible | Cycles | Attached | Aspect ratio | Simulated s | Wall s |",
    "|---|---|---:|---:|---:|---:|---:|",
    ...laneARows.map(
      (row) =>
        `| ${row.rowId} | ${String(row.admissible)} | ${row.cycles} | ${row.attachedCount} | ${formatNumber(row.aspectRatio)} | ${formatNumber(row.simTimeSeconds)} | ${formatNumber(row.wallSeconds, 3)} |`,
    ),
    "",
    "A80 and A96 ended with identical attached count and aspect ratio. A112 preserved the exact aspect ratio and ended 24 attached cells above A96 (+0.311972%). This is a measured three-domain plateau in final gross aspect ratio and a small remaining attached-count difference, not a general proof of domain independence.",
    "",
    "## Lane B — numerical and seed contrasts",
    "",
    `At both N80 and N96, changing \`cflFill\` from 0.1 to 0.05 changed attached count by ${analysis.laneB.metrics.attachedCount.timestepContrasts.atN80} and aspect ratio by ${formatNumber(analysis.laneB.metrics.aspectRatio.timestepContrasts.atN80)}; the final-observable domain-by-timestep interactions were ${analysis.laneB.metrics.attachedCount.interaction} attached cells and ${formatNumber(analysis.laneB.metrics.aspectRatio.interaction)} aspect ratio. No error law is fit from two levels.`,
    "",
    "The smaller and larger seed perturbations changed total attached count and gross aspect ratio in opposite directions, while post-seed growth moved oppositely to total count because the starting site counts differ. Initialization memory is therefore a substantive next question, not a cosmetic seed-size effect.",
    "",
    "## Lane C — matched M1 minus no-dip endpoints",
    "",
    "| Temperature C | Fraction | AR M1 | AR no-dip | AR difference | Boundary-basal-share difference | Attachment-basal-share difference |",
    "|---:|---:|---:|---:|---:|---:|---:|",
    ...laneCDifferences.map(
      (pair) =>
        `| ${pair.tempC} | ${pair.fraction} | ${formatNumber(pair.terminal.m1.aspectRatio)} | ${formatNumber(pair.terminal.noDip.aspectRatio)} | ${formatNumber(pair.terminal.differenceM1MinusNoDip.aspectRatio)} | ${formatNumber(pair.terminal.differenceM1MinusNoDip.boundaryBasalShare)} | ${formatNumber(pair.terminal.differenceM1MinusNoDip.attachmentBasalShare)} |`,
    ),
    "",
    "The M1/no-dip endpoint contrast is large and temperature-dependent. It is nearly forcing-insensitive at -5 C, weakens monotonically with forcing at -6 C, -19 C, and -24 C in gross aspect-ratio magnitude, and has opposite signs in the warm and cold neighborhoods. This identifies implementation-level transition structure worth testing; it does not establish physical causality.",
    "",
    "## First sustained separations",
    "",
    "Each cell is `physical time s / extent / attached count`; `—` means the 0.10-by-three rule was not met on the common trajectory range.",
    "",
    "| Temperature C | Fraction | Aspect ratio | Boundary composition | Attachment orientation |",
    "|---:|---:|---|---|---|",
    ...laneCDifferences.map((pair) => {
      const timing = (observable: Observable) =>
        ALIGNMENTS.map((alignment) => formatNumber(pair.firstSustained[alignment][observable]?.coordinate ?? null)).join(" / ");
      return `| ${pair.tempC} | ${pair.fraction} | ${timing("aspectRatio")} | ${timing("boundaryBasalShare")} | ${timing("attachmentBasalShare")} |`;
    }),
    "",
    "The machine-readable report contains the sign and monotonic-timing maps for every observable/alignment, the four-cell numerical contrasts, seed deltas, and SHA-256 identities of the retained raw inputs.",
    "",
    "## Recommended next experiments",
    "",
    "Use a broad but adaptive parallel follow-up: dense 48-cubed localization around the observed bends; multiple seed geometries only at transition conditions; separate basal-dip and prism-dip matched ablations; pressure contrasts through the existing physical D(T,P); and abrupt temperature histories through the existing schedule machinery. Promote only survivors to selected 80/96-cubed and `cflFill = 0.05` checks. Run up to 16 independent CPU processes; do not involve Phase 7.",
    "",
  ];
  return `${lines.join("\n")}\n`;
}

export function analyzePostPhase10Discovery(
  campaignDirectoryInput: string,
  outputDirectoryInput: string,
): unknown {
  const campaignDirectory = resolve(campaignDirectoryInput);
  const outputDirectory = resolve(outputDirectoryInput);
  const resultEntries = POST_PHASE10_DISCOVERY_ROWS.map((row) => [
    row.id,
    readDiscoveryResult(resolve(campaignDirectory, "rows", row.id, "result.json")),
  ] as const);
  const results = new Map(resultEntries);
  const invalid = [...results.values()].filter((result) => !result.admissible);
  if (invalid.length > 0) {
    throw new Error(`campaign contains inadmissible terminal rows: ${invalid.map((row) => row.rowId).join(",")}`);
  }
  const producerHeads = new Set([...results.values()].map((result) => result.gitHead));
  const nodeVersions = new Set([...results.values()].map((result) => result.node));
  if (producerHeads.size !== 1 || nodeVersions.size !== 1) {
    throw new Error("campaign rows do not share one producer Git head and Node runtime");
  }

  const topLevelSources = [
    "campaign.json",
    "initial-launch.json",
    "initial-complete.json",
    "a112-eligibility.json",
    "a112-launch.json",
    "a112-complete.json",
  ];
  const rowSources = POST_PHASE10_DISCOVERY_ROWS.flatMap((row) =>
    ["spec.json", "events.jsonl", "result.json"].map((name) => `rows/${row.id}/${name}`),
  );
  const sourceFiles = [...topLevelSources, ...rowSources]
    .map((path) => inputIdentity(campaignDirectory, resolve(campaignDirectory, path)))
    .sort((a, b) => a.path.localeCompare(b.path));
  const analysis = {
    schema: "post-phase10-discovery-analysis-v1",
    campaignId: basename(campaignDirectory),
    analysisMethod: "post-phase10-discovery-analysis-v1",
    producerGitHead: [...producerHeads][0],
    node: [...nodeVersions][0],
    rowCount: results.size,
    allRowsAdmissible: true,
    scope:
      "Exploratory model-development evidence only; not Phase 7, a Phase 10 reopening, physical causality, or quantitative validation.",
    postHocSustainedSeparation: {
      absoluteDifferenceThreshold: SEPARATION_THRESHOLD,
      consecutiveAlignedCheckpoints: SUSTAINED_CHECKPOINTS,
      signMustRemainConstant: true,
      alignment: "last observation carried forward on each merged physical-time, extent, or attached-count coordinate within the common range",
      boundaryComposition: "basal boundary count / (basal + prism boundary count)",
      attachmentOrientation:
        "cumulative basal attachment events / cumulative (basal + prism attachment events)",
    },
    sourceFiles,
    laneA: laneA(
      results,
      json(resolve(campaignDirectory, "a112-eligibility.json")),
    ),
    laneB: laneB(results),
    laneC: laneC(campaignDirectory, POST_PHASE10_DISCOVERY_ROWS),
  };
  mkdirSync(outputDirectory, { recursive: false });
  writeFileSync(
    resolve(outputDirectory, "analysis.json"),
    `${JSON.stringify(analysis, null, 2)}\n`,
    "utf8",
  );
  writeFileSync(resolve(outputDirectory, "README.md"), markdownReport(analysis), "utf8");
  return analysis;
}
