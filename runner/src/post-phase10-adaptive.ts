import { phase6SigmaWaterFromTable } from "./phase6-protocol.ts";
import type { DiscoveryRow } from "./post-phase10-discovery.ts";

export const ADAPTIVE_TEMPERATURES_C = Object.freeze([
  -2,
  -3,
  -4,
  -4.5,
  -5,
  -6,
  -7,
  -8,
  -10,
  -12,
  -13,
  -14,
  -14.4,
  -15,
  -16,
  -17,
  -18,
  -19,
  -20,
  -22,
  -24,
  -26,
  -28,
  -30,
] as const);

export const ADAPTIVE_FRACTIONS = Object.freeze([0.075, 0.1, 0.125, 0.15, 0.2, 0.25] as const);
export const ADAPTIVE_INTERACTION_TEMPERATURES_C = Object.freeze([
  -4.5,
  -6,
  -10,
  -14.4,
  -19,
  -24,
] as const);
export const ADAPTIVE_INTERACTION_FRACTIONS = Object.freeze([0.1, 0.15, 0.2] as const);

const PARAMETER_SETS = ["M1", "M1_NO_DIP_ABLATION"] as const;
const PRESSURES_PA = [50_662.5, 202_650] as const;
const SEEDS = [
  { radius: 3, thickness: 1, tag: "r3t1" },
  { radius: 1, thickness: 5, tag: "r1t5" },
] as const;

function numberTag(value: number): string {
  return String(Math.abs(value)).replace(".", "p");
}

function parameterTag(value: (typeof PARAMETER_SETS)[number]): string {
  return value === "M1" ? "m1" : "nodip";
}

function baseRow(input: {
  readonly id: string;
  readonly lane: DiscoveryRow["lane"];
  readonly tempC: number;
  readonly fraction: number;
  readonly paramSet: (typeof PARAMETER_SETS)[number];
  readonly pressurePa: number;
  readonly seedRadius: number;
  readonly seedThickness: number;
}): DiscoveryRow {
  return Object.freeze({
    ...input,
    conditional: false,
    sigmaInfinity: phase6SigmaWaterFromTable(input.tempC) * input.fraction,
    dimsN: 48,
    dxUm: 0.35,
    cflFill: 0.1,
    targetExtent: 21,
    maxSteps: 100_000,
  });
}

const mapRows = ADAPTIVE_TEMPERATURES_C.flatMap((tempC) =>
  ADAPTIVE_FRACTIONS.flatMap((fraction) =>
    PARAMETER_SETS.map((paramSet) =>
      baseRow({
        id: `map-t${numberTag(tempC)}-f${numberTag(fraction)}-${parameterTag(paramSet)}`,
        lane: "adaptive-map",
        tempC,
        fraction,
        paramSet,
        pressurePa: 101_325,
        seedRadius: 2,
        seedThickness: 1,
      }),
    ),
  ),
);

const pressureRows = ADAPTIVE_INTERACTION_TEMPERATURES_C.flatMap((tempC) =>
  ADAPTIVE_INTERACTION_FRACTIONS.flatMap((fraction) =>
    PARAMETER_SETS.flatMap((paramSet) =>
      PRESSURES_PA.map((pressurePa) =>
        baseRow({
          id:
            `pressure-t${numberTag(tempC)}-f${numberTag(fraction)}-` +
            `${parameterTag(paramSet)}-p${numberTag(pressurePa)}`,
          lane: "adaptive-pressure",
          tempC,
          fraction,
          paramSet,
          pressurePa,
          seedRadius: 2,
          seedThickness: 1,
        }),
      ),
    ),
  ),
);

const seedRows = ADAPTIVE_INTERACTION_TEMPERATURES_C.flatMap((tempC) =>
  ADAPTIVE_INTERACTION_FRACTIONS.flatMap((fraction) =>
    PARAMETER_SETS.flatMap((paramSet) =>
      SEEDS.map((seed) =>
        baseRow({
          id:
            `seed-t${numberTag(tempC)}-f${numberTag(fraction)}-` +
            `${parameterTag(paramSet)}-${seed.tag}`,
          lane: "adaptive-seed",
          tempC,
          fraction,
          paramSet,
          pressurePa: 101_325,
          seedRadius: seed.radius,
          seedThickness: seed.thickness,
        }),
      ),
    ),
  ),
);

export const POST_PHASE10_ADAPTIVE_ROWS: readonly DiscoveryRow[] = Object.freeze([
  ...mapRows,
  ...pressureRows,
  ...seedRows,
]);

const adaptiveRowIndex = new Map(POST_PHASE10_ADAPTIVE_ROWS.map((row) => [row.id, row]));
if (adaptiveRowIndex.size !== POST_PHASE10_ADAPTIVE_ROWS.length) {
  throw new Error("post-Phase-10 adaptive roster contains duplicate row ids");
}

export function findPostPhase10AdaptiveRow(rowId: string): DiscoveryRow | undefined {
  return adaptiveRowIndex.get(rowId);
}

export const POST_PHASE10_ADAPTIVE_SMOKE_ROWS: readonly DiscoveryRow[] = Object.freeze([
  Object.freeze({
    ...mapRows[0],
    id: "adaptive-smoke-low-pressure",
    pressurePa: 50_662.5,
    dimsN: 16,
    seedRadius: 1,
    targetExtent: 3,
    maxSteps: 1,
  }),
  Object.freeze({
    ...mapRows[1],
    id: "adaptive-smoke-high-pressure",
    pressurePa: 202_650,
    dimsN: 16,
    seedRadius: 1,
    targetExtent: 3,
    maxSteps: 1,
  }),
]);
