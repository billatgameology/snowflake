// Phase 4 GG scenario catalog (V4-2, live GG): the developer-selectable run configurations
// mirroring the plan's Pass A protocol at their registered dims and controls. These drive the
// LIVE worker at dev pace — they are exploration, never gate evidence (the flagless gate4a
// command owns evidence; this app never runs it).
//
// Values are transcribed from docs/plans/phase-4-morphology-gauntlet.md:
//   A-HABIT     — published plate preset, dims 64,64,128, single abstract columnarity control
//                 u mapped to ggThreshBeta(0,1) = 3 - 2u; endpoints u=0 -> 3 and u=1 -> 1.
//   A-DEPLETION — published hollowColumn preset, dims 64,64,128.
//   A-TIMELINE  — hollowColumn segment 1, then G-G §XII's simple-cap values at the first
//                 zExtent >= 25 boundary: rho=0.1, phi=0, kappa all 0.1, mu all 0.001,
//                 ggThreshBeta(0,1)=5, (1,0)=(2,0)=(1,1)=2.4, (2,1)=(3,0)=(3,1)=1.
//   A-BRANCH    — published dendrite preset with rho=0.105 (the paper's fern endpoint),
//                 dims 160,160,48.
//
// Pure module (no DOM) so scenario values unit-test in node against independently spelled
// expectations.

import {
  GG_PRESETS,
  ggTimelineEnvironmentFromParams,
  type GGTimelineEnvironment,
  type GGTimelineSchedule,
} from "@vcc/core";
import { validateInitConfig, type InitConfig } from "./protocol.ts";

export interface Phase4Scenario {
  readonly id: string;
  readonly label: string;
  readonly config: InitConfig;
}

/** G-G §XII simple-cap environment, in PARAM_CONFIGS slot order
 *  [(0,1),(1,0),(1,1),(2,0),(2,1),(3,0),(3,1)]. */
export const CAPPED_COLUMN_EVENT_ENVIRONMENT: GGTimelineEnvironment = {
  rho: 0.1,
  phi: 0,
  kappa: [0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1],
  mu: [0.001, 0.001, 0.001, 0.001, 0.001, 0.001, 0.001],
  ggThreshBeta: [5, 2.4, 2.4, 2.4, 1, 1, 1],
};

/** The A-TIMELINE capped-column schedule: hollowColumn, one abrupt event at zExtent 25. */
export function cappedColumnSchedule(): GGTimelineSchedule {
  return {
    version: 1,
    mode: "abrupt",
    operator: "GGThreshold",
    initialEnvironment: ggTimelineEnvironmentFromParams(GG_PRESETS.hollowColumn),
    events: [
      {
        index: 0,
        operator: "GGThreshold",
        trigger: { kind: "zExtent", value: 25 },
        environment: CAPPED_COLUMN_EVENT_ENVIRONMENT,
      },
    ],
  };
}

const GAUNTLET_DIMS = { nx: 64, ny: 64, nz: 128 } as const;
const BRANCH_DIMS = { nx: 160, ny: 160, nz: 48 } as const;

function scenario(id: string, label: string, config: unknown): Phase4Scenario {
  // validateInitConfig is the same gatekeeper the UI and worker use; a scenario that would
  // not survive it is a bug here, not a runtime surprise later.
  return { id, label, config: validateInitConfig(config) };
}

export const PHASE4_SCENARIOS: readonly Phase4Scenario[] = [
  scenario("A-HABIT-U0", "A-HABIT u=0 — plate endpoint (ggThreshBeta(0,1)=3)", {
    preset: "plate",
    dims: GAUNTLET_DIMS,
    seed: 1,
    noiseEpsilon: 0,
    domain: "hexPrism",
    farField: "reflecting",
    ggThreshBeta01Override: 3,
  }),
  scenario("A-HABIT-U1", "A-HABIT u=1 — column endpoint (ggThreshBeta(0,1)=1)", {
    preset: "plate",
    dims: GAUNTLET_DIMS,
    seed: 1,
    noiseEpsilon: 0,
    domain: "hexPrism",
    farField: "reflecting",
    ggThreshBeta01Override: 1,
  }),
  scenario("A-DEPLETION", "A-DEPLETION — hollowColumn widening-column field signal", {
    preset: "hollowColumn",
    dims: GAUNTLET_DIMS,
    seed: 1,
    noiseEpsilon: 0,
    domain: "hexPrism",
    farField: "reflecting",
  }),
  scenario("A-TIMELINE", "A-TIMELINE — capped column (hollowColumn, then §XII cap at zExtent 25)", {
    preset: "hollowColumn",
    dims: GAUNTLET_DIMS,
    seed: 1,
    noiseEpsilon: 0,
    domain: "hexPrism",
    farField: "reflecting",
    schedule: cappedColumnSchedule(),
  }),
  scenario("A-BRANCH-DENDRITE", "A-BRANCH — dendrite at rho=0.105 (fern endpoint)", {
    preset: "dendrite",
    dims: BRANCH_DIMS,
    seed: 1,
    noiseEpsilon: 0,
    domain: "hexPrism",
    farField: "reflecting",
    rhoOverride: 0.105,
  }),
];

export function phase4ScenarioById(id: string): Phase4Scenario | null {
  return PHASE4_SCENARIOS.find((s) => s.id === id) ?? null;
}
