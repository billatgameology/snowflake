import { phase6SigmaWaterFromTable } from "./phase6-protocol.ts";
import type { DiscoveryLane, DiscoveryRow } from "./post-phase10-discovery.ts";

const ARMS = ["M1", "M1_NO_DIP_ABLATION"] as const;
const PRESSURES_PA = [50_662.5, 202_650] as const;
const SEEDS = [
  { radius: 3, thickness: 1, tag: "r3t1" },
  { radius: 1, thickness: 5, tag: "r1t5" },
] as const;

export const POST_PHASE10_FOLLOWUP_ROW_COUNT = 134;

export const POST_PHASE10_FOLLOWUP_MIXED_CONDITIONS = Object.freeze([
  { tempC: -4, fractions: [0.15, 0.2, 0.25] },
  { tempC: -4.5, fractions: [0.1, 0.125, 0.15, 0.2, 0.25] },
  { tempC: -5, fractions: [0.1, 0.125, 0.2, 0.25] },
  { tempC: -6, fractions: [0.075, 0.1] },
  { tempC: -8, fractions: [0.1] },
  { tempC: -20, fractions: [0.075] },
  { tempC: -22, fractions: [0.15, 0.2] },
  { tempC: -24, fractions: [0.2, 0.25] },
] as const);

function numberTag(value: number): string {
  return String(Math.abs(value)).replace(".", "p");
}

function armTag(paramSet: DiscoveryRow["paramSet"]): string {
  return paramSet === "M1" ? "m1" : "nodip";
}

function followupRow(input: {
  readonly id: string;
  readonly lane: Extract<DiscoveryLane, `followup-${string}`>;
  readonly tempC: number;
  readonly fraction: number;
  readonly paramSet: DiscoveryRow["paramSet"];
  readonly pressurePa?: number;
  readonly seedRadius?: number;
  readonly seedThickness?: number;
  readonly dimsN: number;
  readonly targetExtent: number;
  readonly cflFill: number;
  readonly timelineEvent?: DiscoveryRow["timelineEvent"];
}): DiscoveryRow {
  return Object.freeze({
    id: input.id,
    lane: input.lane,
    conditional: false,
    tempC: input.tempC,
    fraction: input.fraction,
    sigmaInfinity: phase6SigmaWaterFromTable(input.tempC) * input.fraction,
    pressurePa: input.pressurePa ?? 101_325,
    paramSet: input.paramSet,
    dimsN: input.dimsN,
    dxUm: 0.35,
    cflFill: input.cflFill,
    seedRadius: input.seedRadius ?? 2,
    seedThickness: input.seedThickness ?? 1,
    targetExtent: input.targetExtent,
    maxSteps: 100_000,
    ...(input.timelineEvent === undefined ? {} : { timelineEvent: input.timelineEvent }),
  });
}

const seedTimestepRows = [-7, -8, -9].flatMap((tempC) =>
  ARMS.flatMap((paramSet) =>
    SEEDS.map((seed) =>
      followupRow({
        id:
          `followup-seed-timestep-t${numberTag(tempC)}-f0p15-` +
          `${armTag(paramSet)}-${seed.tag}`,
        lane: "followup-seed-timestep",
        tempC,
        fraction: 0.15,
        paramSet,
        seedRadius: seed.radius,
        seedThickness: seed.thickness,
        dimsN: 64,
        targetExtent: 29,
        cflFill: 0.05,
      }),
    ),
  ),
);

const seedForcingRows = [-8, -9].flatMap((tempC) =>
  [0.1, 0.2].flatMap((fraction) =>
    ARMS.flatMap((paramSet) =>
      SEEDS.map((seed) =>
        followupRow({
          id:
            `followup-seed-forcing-t${numberTag(tempC)}-f${numberTag(fraction)}-` +
            `${armTag(paramSet)}-${seed.tag}`,
          lane: "followup-seed-forcing",
          tempC,
          fraction,
          paramSet,
          seedRadius: seed.radius,
          seedThickness: seed.thickness,
          dimsN: 64,
          targetExtent: 29,
          cflFill: 0.1,
        }),
      ),
    ),
  ),
);

const seedLocalizationRows = [-8.25, -8.5, -8.75].flatMap((tempC) =>
  ARMS.flatMap((paramSet) =>
    SEEDS.map((seed) =>
      followupRow({
        id:
          `followup-seed-localization-t${numberTag(tempC)}-f0p15-` +
          `${armTag(paramSet)}-${seed.tag}`,
        lane: "followup-seed-localization",
        tempC,
        fraction: 0.15,
        paramSet,
        seedRadius: seed.radius,
        seedThickness: seed.thickness,
        dimsN: 64,
        targetExtent: 29,
        cflFill: 0.1,
      }),
    ),
  ),
);

const mixedTimestepRows = POST_PHASE10_FOLLOWUP_MIXED_CONDITIONS.flatMap((condition) =>
  condition.fractions.flatMap((fraction) =>
    ARMS.map((paramSet) =>
      followupRow({
        id:
          `followup-mixed-timestep-t${numberTag(condition.tempC)}-` +
          `f${numberTag(fraction)}-${armTag(paramSet)}`,
        lane: "followup-mixed-timestep",
        tempC: condition.tempC,
        fraction,
        paramSet,
        dimsN: 64,
        targetExtent: 29,
        cflFill: 0.05,
      }),
    ),
  ),
);

const largerSeedRows = [-7, -8, -9].flatMap((tempC) =>
  ARMS.flatMap((paramSet) =>
    SEEDS.map((seed) =>
      followupRow({
        id:
          `followup-larger-seed-t${numberTag(tempC)}-f0p15-` +
          `${armTag(paramSet)}-${seed.tag}`,
        lane: "followup-larger",
        tempC,
        fraction: 0.15,
        paramSet,
        seedRadius: seed.radius,
        seedThickness: seed.thickness,
        dimsN: 80,
        targetExtent: 37,
        cflFill: 0.1,
      }),
    ),
  ),
);

const largerPressureConditions = [
  ...[0.1, 0.15, 0.2].map((fraction) => ({ tempC: -6, fraction })),
  ...[-14.4, -19, -24].map((tempC) => ({ tempC, fraction: 0.15 })),
] as const;
const largerPressureRows = largerPressureConditions.flatMap((condition) =>
  ARMS.flatMap((paramSet) =>
    PRESSURES_PA.map((pressurePa) =>
      followupRow({
        id:
          `followup-larger-pressure-t${numberTag(condition.tempC)}-` +
          `f${numberTag(condition.fraction)}-${armTag(paramSet)}-p${numberTag(pressurePa)}`,
        lane: "followup-larger",
        tempC: condition.tempC,
        fraction: condition.fraction,
        paramSet,
        pressurePa,
        dimsN: 80,
        targetExtent: 37,
        cflFill: 0.05,
      }),
    ),
  ),
);

const largerTopologyRows = [-12, -14.4, -18].flatMap((tempC) =>
  ARMS.map((paramSet) =>
    followupRow({
      id: `followup-larger-topology-t${numberTag(tempC)}-f0p15-${armTag(paramSet)}`,
      lane: "followup-larger",
      tempC,
      fraction: 0.15,
      paramSet,
      dimsN: 80,
      targetExtent: 37,
      cflFill: 0.05,
    }),
  ),
);

const largerCavityRows = [-4.5, -5].flatMap((tempC) =>
  ARMS.map((paramSet) =>
    followupRow({
      id: `followup-larger-cavity-t${numberTag(tempC)}-f0p075-${armTag(paramSet)}`,
      lane: "followup-larger",
      tempC,
      fraction: 0.075,
      paramSet,
      dimsN: 80,
      targetExtent: 37,
      cflFill: 0.05,
    }),
  ),
);

const historyDirections = [
  { fromTempC: -4.5, toTempC: -24 },
  { fromTempC: -24, toTempC: -4.5 },
  { fromTempC: -6, toTempC: -14.4 },
  { fromTempC: -14.4, toTempC: -6 },
] as const;
const historyRows = historyDirections.flatMap(({ fromTempC, toTempC }) =>
  ARMS.map((paramSet) =>
    followupRow({
      id:
        `followup-history-t${numberTag(fromTempC)}-to-t${numberTag(toTempC)}-` +
        `${armTag(paramSet)}`,
      lane: "followup-history",
      tempC: fromTempC,
      fraction: 0.15,
      paramSet,
      dimsN: 64,
      targetExtent: 29,
      cflFill: 0.1,
      timelineEvent: {
        triggerLargestExtent: 11,
        tempC: toTempC,
        sigmaInfinity: phase6SigmaWaterFromTable(toTempC) * 0.15,
      },
    }),
  ),
);

export const POST_PHASE10_FOLLOWUP_ROWS: readonly DiscoveryRow[] = Object.freeze([
  ...seedTimestepRows,
  ...seedForcingRows,
  ...seedLocalizationRows,
  ...mixedTimestepRows,
  ...largerSeedRows,
  ...largerPressureRows,
  ...largerTopologyRows,
  ...largerCavityRows,
  ...historyRows,
]);

if (POST_PHASE10_FOLLOWUP_ROWS.length !== POST_PHASE10_FOLLOWUP_ROW_COUNT) {
  throw new Error(
    `post-Phase-10 follow-up roster has ${POST_PHASE10_FOLLOWUP_ROWS.length} rows, ` +
      `expected ${POST_PHASE10_FOLLOWUP_ROW_COUNT}`,
  );
}

const followupRowIndex = new Map(POST_PHASE10_FOLLOWUP_ROWS.map((candidate) => [candidate.id, candidate]));
if (followupRowIndex.size !== POST_PHASE10_FOLLOWUP_ROWS.length) {
  throw new Error("post-Phase-10 follow-up roster contains duplicate row ids");
}

export function findPostPhase10FollowupRow(rowId: string): DiscoveryRow | undefined {
  return followupRowIndex.get(rowId);
}
