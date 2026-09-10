import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { findPostPhase10CavityRow } from "../src/post-phase10-cavity.ts";
import { findPostPhase10FollowupRow } from "../src/post-phase10-followup.ts";
import { findPostPhase10FacetFactorialLongRow } from "../src/post-phase10-facet-factorial.ts";
import {
  DISCOVERY_FACET_EXPERIMENT_ID,
  DISCOVERY_HOLEFILL_EXPERIMENT_ID,
  DISCOVERY_PRISM_HOLEFILL_INTERACTION_ID,
  POST_PHASE10_SMOKE_ROWS,
  discoveryExperimentIdentity,
  runPostPhase10DiscoveryRow,
} from "../src/post-phase10-discovery.ts";
import {
  POST_PHASE10_HOLEFILL_ROWS,
  POST_PHASE10_HOLEFILL_REUSED_CONTROLS,
  findPostPhase10HolefillRow,
  POST_PHASE10_HOLEFILL_LONG_ROWS,
  POST_PHASE10_HOLEFILL_LONG_REUSED_CONTROLS,
  findPostPhase10HolefillLongRow,
  POST_PHASE10_PRISM_HOLEFILL_ROWS,
  POST_PHASE10_PRISM_HOLEFILL_REUSED_CONTROLS,
  findPostPhase10PrismHolefillRow,
} from "../src/post-phase10-holefill.ts";

const temporaryDirectories: string[] = [];
function scratch(): string {
  const directory = mkdtempSync(join(tmpdir(), "vcc-holefill-"));
  temporaryDirectories.push(directory);
  return directory;
}
function readJson(directory: string, leaf: string): Record<string, unknown> {
  return JSON.parse(readFileSync(join(directory, leaf), "utf8")) as Record<string, unknown>;
}
afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) rmSync(directory, { recursive: true, force: true });
});

describe("bounded post-Phase-10 geometric-completion experiment", () => {
  it("adds four larger disabled rows matched to the retained snapshot-free N80 controls", () => {
    const expectedIds = ["4p5", "5"].flatMap((temperature) =>
      ["m1", "nodip"].map((arm) => `holefill-off-long-t${temperature}-${arm}`));
    expect(POST_PHASE10_HOLEFILL_LONG_ROWS.map((row) => row.id)).toEqual(expectedIds);
    for (const row of POST_PHASE10_HOLEFILL_LONG_ROWS) {
      const baselineId = row.id.replace("holefill-off-long", "followup-larger-cavity")
        .replace(/-(m1|nodip)$/, "-f0p075-$1");
      const baseline = findPostPhase10FollowupRow(baselineId);
      expect(baseline).toBeDefined();
      const { experimentalHoleFilling, ...ordinarySettings } = row;
      expect(experimentalHoleFilling).toBe("disabled");
      expect({ ...ordinarySettings, id: baselineId }).toEqual(baseline);
      expect(row).toMatchObject({ dimsN: 80, targetExtent: 37, dxUm: 0.35, cflFill: 0.05 });
      expect(row).not.toHaveProperty("spatialSampleExtents");
      expect(row).not.toHaveProperty("experimentalFacetDips");
      expect(findPostPhase10HolefillLongRow(row.id)).toBe(row);
      expect(findPostPhase10HolefillRow(row.id)).toBeUndefined();
    }
    expect(POST_PHASE10_HOLEFILL_LONG_REUSED_CONTROLS).toEqual(
      ["4p5", "5"].flatMap((temperature) => ["m1", "nodip"].map((arm) => {
        const rowId = `followup-larger-cavity-t${temperature}-f0p075-${arm}`;
        return { rowId, directory: `out/post-phase10-followup/campaign-2026-09-03-wave2/rows/${rowId}`,
          effectiveHoleFilling: "enabled", producerGitHead: "dd4ef5245e6b48fff164b888e3b287665ab6c457" };
      })),
    );
  });

  it("lists the separate larger campaign and applies the existing concurrency ceiling", () => {
    const entry = "runner/src/post-phase10-discovery-main.ts";
    const listed = execFileSync(process.execPath, [entry, "list-holefill-long"], {
      encoding: "utf8", windowsHide: true,
    });
    expect(JSON.parse(listed)).toEqual(POST_PHASE10_HOLEFILL_LONG_ROWS);
    const output = join(scratch(), "unlaunched-long");
    const rejected = spawnSync(process.execPath, [entry, "launch-holefill-long", output, "29"], {
      encoding: "utf8", windowsHide: true,
    });
    expect(rejected.status).toBe(1);
    expect(rejected.stderr).toContain("concurrency must be an integer in [1, 28]");
    expect(existsSync(output)).toBe(false);
  });

  it("changes only geometric completion in exactly four baseline-matched rows", () => {
    const expectedIds = ["4p5", "5"].flatMap((temperature) =>
      ["m1", "nodip"].map((arm) => `holefill-off-t${temperature}-${arm}`));
    expect(POST_PHASE10_HOLEFILL_ROWS.map((row) => row.id)).toEqual(expectedIds);
    for (const row of POST_PHASE10_HOLEFILL_ROWS) {
      const baselineId = row.id.replace("holefill-off", "cavity-baseline");
      const baseline = findPostPhase10CavityRow(baselineId);
      expect(baseline).toBeDefined();
      const { experimentalHoleFilling, ...ordinarySettings } = row;
      expect(experimentalHoleFilling).toBe("disabled");
      expect({ ...ordinarySettings, id: baselineId }).toEqual(baseline);
      expect(row.experimentalFacetDips).toBeUndefined();
      expect(findPostPhase10HolefillRow(row.id)).toBe(row);
    }
    expect(findPostPhase10HolefillRow("cavity-baseline-t4p5-m1")).toBeUndefined();
    expect(POST_PHASE10_HOLEFILL_REUSED_CONTROLS).toEqual(expectedIds.map((id) => {
      const rowId = id.replace("holefill-off", "cavity-baseline");
      return {
        rowId,
        directory: `out/post-phase10-cavity/campaign-2026-09-08/rows/${rowId}`,
        effectiveHoleFilling: "enabled",
        producerGitHead: "eb7b5c4f932939e3b40d686a996796fdaceb1894",
      };
    }));
  });

  it("lists four new rows without their reused controls and retains the 28-worker ceiling", () => {
    const entry = "runner/src/post-phase10-discovery-main.ts";
    const listed = execFileSync(process.execPath, [entry, "list-holefill"], {
      encoding: "utf8", windowsHide: true,
    });
    expect(JSON.parse(listed)).toEqual(POST_PHASE10_HOLEFILL_ROWS);
    const output = join(scratch(), "unlaunched");
    const rejected = spawnSync(process.execPath, [entry, "launch-holefill", output, "29"], {
      encoding: "utf8", windowsHide: true,
    });
    expect(rejected.status).toBe(1);
    expect(rejected.stderr).toContain("concurrency must be an integer in [1, 28]");
    expect(existsSync(output)).toBe(false);
  });

  it.each(POST_PHASE10_SMOKE_ROWS)("labels a disabled one-cycle $paramSet run throughout its artifacts", (smoke) => {
    const directory = scratch();
    const messages: string[] = [];
    const result = runPostPhase10DiscoveryRow({
      ...smoke, experimentalHoleFilling: "disabled", spatialSampleExtents: [3],
    }, directory, { heartbeat: (message) => messages.push(message) });
    const identity = {
      experimentId: DISCOVERY_HOLEFILL_EXPERIMENT_ID, experimentalHoleFilling: "disabled",
    };
    expect(result.admissible, JSON.stringify(result)).toBe(true);
    expect(result.cycles).toBe(1);
    expect(result).toMatchObject({ ...identity, holeFillCountTotal: 0, holeFillDeficit: 0 });
    expect(result.fillLedger).toBeGreaterThan(0);
    expect(result.spatialSnapshots).toHaveLength(1);
    const events = readFileSync(join(directory, "events.jsonl"), "utf8").trim().split("\n")
      .map((line) => JSON.parse(line) as Record<string, unknown>);
    expect(events).toHaveLength(1);
    expect(events[0].ledgers).toMatchObject({ holeFillCountTotal: 0, holeFillDeficit: 0 });
    for (const record of [
      result, ...events,
      ...["spec.json", "host.json", "status.json", "result.json", result.spatialSnapshots![0].path]
        .map((leaf) => readJson(directory, leaf)),
    ]) {
      expect(record).toMatchObject(identity);
      expect(record).not.toHaveProperty("experimentalFacetDips");
    }
    expect(readJson(directory, "spec.json").row).toMatchObject({
      paramSet: smoke.paramSet, experimentalHoleFilling: "disabled",
    });
    expect(messages.length).toBeGreaterThanOrEqual(2);
    expect(messages.every((message) => message.includes(`experimentId=${identity.experimentId}`) &&
      message.includes("experimentalHoleFilling=disabled"))).toBe(true);
  });

  it("preserves ordinary and facet identity shapes, while labeling enabled explicitly", () => {
    expect(discoveryExperimentIdentity({})).toEqual({});
    for (const experimentalFacetDips of ["both", "neither", "basal-only", "prism-only"] as const) {
      expect(discoveryExperimentIdentity({ experimentalFacetDips })).toEqual({
        experimentId: DISCOVERY_FACET_EXPERIMENT_ID, experimentalFacetDips,
      });
    }
    expect(discoveryExperimentIdentity({ experimentalHoleFilling: "enabled" })).toEqual({
      experimentId: DISCOVERY_HOLEFILL_EXPERIMENT_ID, experimentalHoleFilling: "enabled",
    });
  });

  it("keeps unsupported dip combinations and timelines out of the geometric-completion comparison", () => {
    const output = join(scratch(), "unstarted");
    const row = { ...POST_PHASE10_SMOKE_ROWS[0], experimentalHoleFilling: "disabled" as const };
    expect(() => runPostPhase10DiscoveryRow({ ...row, experimentalFacetDips: "basal-only" }, output))
      .toThrow("only prism-only with disabled hole filling may be combined");
    expect(() => runPostPhase10DiscoveryRow({
      ...row, timelineEvent: { triggerLargestExtent: 3, tempC: -4.5, sigmaInfinity: 0.005 },
    }, output)).toThrow("hole-fill-isolation rows require a constant environment");
    expect(existsSync(output)).toBe(false);
  });
});

describe("bounded prism kinetics and geometric-completion interaction", () => {
  it("adds only the two missing N80 corners and names six reused controls", () => {
    expect(POST_PHASE10_PRISM_HOLEFILL_ROWS.map((row) => row.id))
      .toEqual(["prism-holefill-off-t4p5", "prism-holefill-off-t5"]);
    for (const row of POST_PHASE10_PRISM_HOLEFILL_ROWS) {
      const tag = row.tempC === -4.5 ? "4p5" : "5";
      const baselineId = `facet-isolation-long-t${tag}-prism-only`;
      const baseline = findPostPhase10FacetFactorialLongRow(baselineId);
      const { experimentalHoleFilling, ...settings } = row;
      expect(experimentalHoleFilling).toBe("disabled");
      expect({ ...settings, id: baselineId }).toEqual(baseline);
      expect(row).toMatchObject({ dimsN: 80, targetExtent: 37, dxUm: 0.35, cflFill: 0.05,
        paramSet: "M1", experimentalFacetDips: "prism-only" });
      expect(row).not.toHaveProperty("spatialSampleExtents");
      expect(findPostPhase10PrismHolefillRow(row.id)).toBe(row);
      expect(findPostPhase10HolefillLongRow(row.id)).toBeUndefined();
    }
    expect(POST_PHASE10_PRISM_HOLEFILL_REUSED_CONTROLS).toHaveLength(6);
    for (const tag of ["4p5", "5"]) {
      const controls = POST_PHASE10_PRISM_HOLEFILL_REUSED_CONTROLS.filter((row) => row.rowId.includes(`-t${tag}-`));
      expect(controls.map((row) => [row.effectiveFacetDips, row.effectiveHoleFilling]))
        .toEqual([["neither", "enabled"], ["neither", "disabled"], ["prism-only", "enabled"]]);
      expect(controls.every((row) => row.directory.endsWith(`/rows/${row.rowId}`))).toBe(true);
    }
  });

  it("lists only the interaction rows through the dedicated CLI", () => {
    const listed = execFileSync(process.execPath,
      ["runner/src/post-phase10-discovery-main.ts", "list-prism-holefill"],
      { encoding: "utf8", windowsHide: true });
    expect(JSON.parse(listed)).toEqual(POST_PHASE10_PRISM_HOLEFILL_ROWS);
  });

  it("carries both opt-ins through a kinetic smoke run without ordinary checkpoint metadata", () => {
    const directory = scratch();
    const messages: string[] = [];
    const identity = { experimentId: DISCOVERY_PRISM_HOLEFILL_INTERACTION_ID,
      experimentalFacetDips: "prism-only" as const, experimentalHoleFilling: "disabled" as const };
    expect(discoveryExperimentIdentity(identity)).toEqual(identity);
    const result = runPostPhase10DiscoveryRow({ ...POST_PHASE10_SMOKE_ROWS[0], paramSet: "M1",
      experimentalFacetDips: "prism-only", experimentalHoleFilling: "disabled", spatialSampleExtents: [3],
    }, directory, { heartbeat: (message) => messages.push(message) });
    expect(result.admissible, JSON.stringify(result)).toBe(true);
    expect(result).toMatchObject({ ...identity, cycles: 1, holeFillCountTotal: 0, holeFillDeficit: 0 });
    expect(result.fillLedger).toBeGreaterThan(0);
    const event = JSON.parse(readFileSync(join(directory, "events.jsonl"), "utf8").trim());
    for (const record of [result, event,
      ...["spec.json", "host.json", "status.json", "result.json", result.spatialSnapshots![0].path]
        .map((leaf) => readJson(directory, leaf))]) expect(record).toMatchObject(identity);
    expect(messages.length).toBeGreaterThanOrEqual(2);
    expect(messages.every((message) => message.includes(identity.experimentId) &&
      message.includes("experimentalFacetDips=prism-only") && message.includes("experimentalHoleFilling=disabled")))
      .toBe(true);
  });
});
