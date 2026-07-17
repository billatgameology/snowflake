// Phase 4 scenario catalog (V4-2): registered values recomputed against independently
// spelled expectations from docs/plans/phase-4-morphology-gauntlet.md, plus the config
// validation that binds a schedule's initial environment to the actual starting parameters.

import { describe, expect, it } from "vitest";
import {
  GG_PRESETS,
  PARAM_CONFIGS,
  ggTimelineEnvironmentFromParams,
  paramSlot,
} from "@vcc/core";
import {
  CAPPED_COLUMN_EVENT_ENVIRONMENT,
  PHASE4_SCENARIOS,
  cappedColumnSchedule,
  phase4ScenarioById,
} from "../src/scenarios.ts";
import { DEFAULT_INIT, ggParamsForInit, validateInitConfig } from "../src/protocol.ts";

describe("PHASE4_SCENARIOS registered values", () => {
  it("contains exactly the five registered scenarios", () => {
    expect(PHASE4_SCENARIOS.map((s) => s.id)).toEqual([
      "A-HABIT-U0",
      "A-HABIT-U1",
      "A-DEPLETION",
      "A-TIMELINE",
      "A-BRANCH-DENDRITE",
    ]);
  });

  it("A-HABIT endpoints: plate preset, dims 64,64,128, ggThreshBeta(0,1) = 3 and 1", () => {
    for (const [id, ggThreshBeta01] of [
      ["A-HABIT-U0", 3],
      ["A-HABIT-U1", 1],
    ] as const) {
      const scenario = phase4ScenarioById(id);
      expect(scenario).not.toBeNull();
      const config = scenario!.config;
      expect(config.preset).toBe("plate");
      expect(config.dims).toEqual({ nx: 64, ny: 64, nz: 128 });
      expect(config.seed).toBe(1);
      expect(config.noiseEpsilon).toBe(0);
      expect(config.domain).toBe("hexPrism");
      expect(config.farField).toBe("reflecting");
      expect(config.ggThreshBeta01Override).toBe(ggThreshBeta01);
      expect(config.rhoOverride).toBeNull();
      expect(config.schedule).toBeNull();
      // The override changes ONLY slot (0,1); every other value stays byte-identical to the
      // published plate preset (the plan's "every other scalar and vector slot" clause).
      const params = ggParamsForInit(config);
      expect(params.ggThreshBeta[paramSlot(0, 1)]).toBe(ggThreshBeta01);
      for (const [nT, nZ] of PARAM_CONFIGS) {
        if (nT === 0 && nZ === 1) continue;
        expect(params.ggThreshBeta[paramSlot(nT, nZ)]).toBe(
          GG_PRESETS.plate.ggThreshBeta[paramSlot(nT, nZ)],
        );
      }
      expect(Array.from(params.kappa)).toEqual(Array.from(GG_PRESETS.plate.kappa));
      expect(Array.from(params.mu)).toEqual(Array.from(GG_PRESETS.plate.mu));
      expect(params.rho).toBe(GG_PRESETS.plate.rho);
      expect(params.phi).toBe(GG_PRESETS.plate.phi);
    }
  });

  it("A-DEPLETION: published hollowColumn at 64,64,128, no overrides", () => {
    const config = phase4ScenarioById("A-DEPLETION")!.config;
    expect(config.preset).toBe("hollowColumn");
    expect(config.dims).toEqual({ nx: 64, ny: 64, nz: 128 });
    expect(config.ggThreshBeta01Override).toBeNull();
    expect(config.rhoOverride).toBeNull();
    const params = ggParamsForInit(config);
    expect(Array.from(params.ggThreshBeta)).toEqual(
      Array.from(GG_PRESETS.hollowColumn.ggThreshBeta),
    );
  });

  it("A-BRANCH-DENDRITE: dendrite preset at 160,160,48 with rho = 0.105 only", () => {
    const config = phase4ScenarioById("A-BRANCH-DENDRITE")!.config;
    expect(config.preset).toBe("dendrite");
    expect(config.dims).toEqual({ nx: 160, ny: 160, nz: 48 });
    expect(config.rhoOverride).toBe(0.105);
    expect(config.ggThreshBeta01Override).toBeNull();
    const params = ggParamsForInit(config);
    expect(params.rho).toBe(0.105);
    expect(Array.from(params.ggThreshBeta)).toEqual(
      Array.from(GG_PRESETS.dendrite.ggThreshBeta),
    );
    expect(Array.from(params.mu)).toEqual(Array.from(GG_PRESETS.dendrite.mu));
  });

  it("A-TIMELINE: hollowColumn segment 1, one abrupt §XII cap event at zExtent 25", () => {
    const config = phase4ScenarioById("A-TIMELINE")!.config;
    expect(config.preset).toBe("hollowColumn");
    expect(config.schedule).not.toBeNull();
    const schedule = config.schedule!;
    expect(schedule.operator).toBe("GGThreshold");
    expect(schedule.mode).toBe("abrupt");
    expect(schedule.initialEnvironment).toEqual(
      ggTimelineEnvironmentFromParams(GG_PRESETS.hollowColumn),
    );
    expect(schedule.events).toHaveLength(1);
    const event = schedule.events[0];
    expect(event.trigger).toEqual({ kind: "zExtent", value: 25 });
    // Independently spelled §XII simple-cap expectation (plan, A-TIMELINE), in the
    // PARAM_CONFIGS order (0,1),(1,0),(1,1),(2,0),(2,1),(3,0),(3,1):
    expect(event.environment).toEqual({
      rho: 0.1,
      phi: 0,
      kappa: [0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1],
      mu: [0.001, 0.001, 0.001, 0.001, 0.001, 0.001, 0.001],
      ggThreshBeta: [5, 2.4, 2.4, 2.4, 1, 1, 1],
    });
    expect(CAPPED_COLUMN_EVENT_ENVIRONMENT).toEqual(event.environment);
  });
});

describe("InitConfig scenario-field validation", () => {
  it("defaults the new fields to null for legacy-shaped configs", () => {
    const config = validateInitConfig({
      preset: "plate",
      dims: { nx: 32, ny: 32, nz: 32 },
      seed: 1,
      noiseEpsilon: 0,
      domain: "hexPrism",
      farField: "reflecting",
    });
    expect(config.rhoOverride).toBeNull();
    expect(config.ggThreshBeta01Override).toBeNull();
    expect(config.schedule).toBeNull();
  });

  it("rejects non-positive or non-finite overrides by name", () => {
    for (const bad of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(() =>
        validateInitConfig({ ...DEFAULT_INIT, rhoOverride: bad }),
      ).toThrow(/rhoOverride/);
      expect(() =>
        validateInitConfig({ ...DEFAULT_INIT, ggThreshBeta01Override: bad }),
      ).toThrow(/ggThreshBeta01Override/);
    }
  });

  it("rejects a schedule whose initialEnvironment mislabels the starting parameters", () => {
    const schedule = cappedColumnSchedule();
    // Config claims the PLATE preset while the schedule starts from hollowColumn: a run
    // whose recorded initial environment lies about its parameters must not construct.
    expect(() =>
      validateInitConfig({ ...DEFAULT_INIT, preset: "plate", schedule }),
    ).toThrow(/initialEnvironment must equal/);
    // The honest pairing passes.
    expect(() =>
      validateInitConfig({ ...DEFAULT_INIT, preset: "hollowColumn", schedule }),
    ).not.toThrow();
  });

  it("rejects a non-GG schedule (live worker stepping is GG-only)", () => {
    const lkSchedule = {
      version: 1,
      mode: "abrupt",
      operator: "LibbrechtKinetics",
      initialEnvironment: { tempC: -15, sigmaInfinity: 0.002 },
      events: [],
    };
    expect(() =>
      validateInitConfig({ ...DEFAULT_INIT, schedule: lkSchedule }),
    ).toThrow(/GG-only/);
  });

  it("rejects an internally invalid schedule via the shared core validator", () => {
    const schedule = cappedColumnSchedule();
    const broken = {
      ...schedule,
      events: [schedule.events[0], schedule.events[0]], // duplicate trigger + index
    };
    expect(() => validateInitConfig({ ...DEFAULT_INIT, schedule: broken })).toThrow();
  });

  it("ggParamsForInit returns fresh owned vectors (the preset table cannot be mutated)", () => {
    const config = phase4ScenarioById("A-HABIT-U0")!.config;
    const params = ggParamsForInit(config);
    params.ggThreshBeta[paramSlot(0, 1)] = 999;
    params.kappa[paramSlot(1, 0)] = 999;
    expect(GG_PRESETS.plate.ggThreshBeta[paramSlot(0, 1)]).toBe(2.5);
    expect(GG_PRESETS.plate.kappa[paramSlot(1, 0)]).toBe(0.1);
    // And a second call is unaffected by the first call's mutation.
    expect(ggParamsForInit(config).ggThreshBeta[paramSlot(0, 1)]).toBe(3);
  });
});
