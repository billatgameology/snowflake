import { phase6SigmaWaterFromTable } from "./phase6-protocol.ts";
import type { DiscoveryRow } from "./post-phase10-discovery.ts";

const STANDARD_ARMS = ["M1", "M1_NO_DIP_ABLATION"] as const;
const PRESSURES_PA = [50_662.5, 202_650] as const;
const SEEDS = [
  { radius: 3, thickness: 1, tag: "r3t1" },
  { radius: 1, thickness: 5, tag: "r1t5" },
] as const;

function numberTag(value: number): string {
  return String(Math.abs(value)).replace(".", "p");
}

function parameterTag(paramSet: DiscoveryRow["paramSet"]): string {
  return paramSet === "M1" ? "m1" : "nodip";
}

function confirmationRow(input: {
  readonly id: string;
  readonly lane: Extract<
    DiscoveryRow["lane"],
    "confirm-seed" | "confirm-pressure" | "confirm-map"
  >;
  readonly tempC: number;
  readonly fraction: number;
  readonly paramSet: DiscoveryRow["paramSet"];
  readonly pressurePa?: number;
  readonly seedRadius?: number;
  readonly seedThickness?: number;
  readonly cflFill: number;
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
    dimsN: 64,
    dxUm: 0.35,
    cflFill: input.cflFill,
    seedRadius: input.seedRadius ?? 2,
    seedThickness: input.seedThickness ?? 1,
    targetExtent: 29,
    maxSteps: 100_000,
  });
}

const seedTransitionRows = [-7, -8, -9].flatMap((tempC) =>
  STANDARD_ARMS.flatMap((paramSet) =>
    SEEDS.map((seed) =>
      confirmationRow({
        id:
          `confirm-seed-transition-t${numberTag(tempC)}-f0p15-` +
          `${parameterTag(paramSet)}-${seed.tag}`,
        lane: "confirm-seed",
        tempC,
        fraction: 0.15,
        paramSet,
        seedRadius: seed.radius,
        seedThickness: seed.thickness,
        cflFill: 0.1,
      }),
    ),
  ),
);

const seedCflRows = [-4.5, -6, -10].flatMap((tempC) =>
  STANDARD_ARMS.flatMap((paramSet) =>
    SEEDS.map((seed) =>
      confirmationRow({
        id:
          `confirm-seed-cfl-t${numberTag(tempC)}-f0p15-` +
          `${parameterTag(paramSet)}-${seed.tag}`,
        lane: "confirm-seed",
        tempC,
        fraction: 0.15,
        paramSet,
        seedRadius: seed.radius,
        seedThickness: seed.thickness,
        cflFill: 0.05,
      }),
    ),
  ),
);

const pressureReversalRows = [0.1, 0.15, 0.2].flatMap((fraction) =>
  STANDARD_ARMS.flatMap((paramSet) =>
    PRESSURES_PA.map((pressurePa) =>
      confirmationRow({
        id:
          `confirm-pressure-reversal-cfl-t6-f${numberTag(fraction)}-` +
          `${parameterTag(paramSet)}-p${numberTag(pressurePa)}`,
        lane: "confirm-pressure",
        tempC: -6,
        fraction,
        paramSet,
        pressurePa,
        cflFill: 0.05,
      }),
    ),
  ),
);

const pressurePersistenceRows = [-14.4, -19, -24].flatMap((tempC) =>
  STANDARD_ARMS.flatMap((paramSet) =>
    PRESSURES_PA.map((pressurePa) =>
      confirmationRow({
        id:
          `confirm-pressure-persistence-cfl-t${numberTag(tempC)}-f0p15-` +
          `${parameterTag(paramSet)}-p${numberTag(pressurePa)}`,
        lane: "confirm-pressure",
        tempC,
        fraction: 0.15,
        paramSet,
        pressurePa,
        cflFill: 0.05,
      }),
    ),
  ),
);

const topologyCflRows = [-12, -14.4, -18].flatMap((tempC) =>
  STANDARD_ARMS.map((paramSet) =>
    confirmationRow({
      id: `confirm-topology-cfl-t${numberTag(tempC)}-f0p15-${parameterTag(paramSet)}`,
      lane: "confirm-map",
      tempC,
      fraction: 0.15,
      paramSet,
      cflFill: 0.05,
    }),
  ),
);

const cavityCflRows = [-4.5, -5].flatMap((tempC) =>
  STANDARD_ARMS.map((paramSet) =>
    confirmationRow({
      id: `confirm-cavity-cfl-t${numberTag(tempC)}-f0p075-${parameterTag(paramSet)}`,
      lane: "confirm-map",
      tempC,
      fraction: 0.075,
      paramSet,
      cflFill: 0.05,
    }),
  ),
);

export const POST_PHASE10_CONFIRM_ROWS: readonly DiscoveryRow[] = Object.freeze([
  ...seedTransitionRows,
  ...seedCflRows,
  ...pressureReversalRows,
  ...pressurePersistenceRows,
  ...topologyCflRows,
  ...cavityCflRows,
]);

const confirmationRowIndex = new Map(POST_PHASE10_CONFIRM_ROWS.map((row) => [row.id, row]));
if (confirmationRowIndex.size !== POST_PHASE10_CONFIRM_ROWS.length) {
  throw new Error("post-Phase-10 confirmation roster contains duplicate row ids");
}

export function findPostPhase10ConfirmationRow(rowId: string): DiscoveryRow | undefined {
  return confirmationRowIndex.get(rowId);
}
