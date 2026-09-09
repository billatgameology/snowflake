import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { alphaHK } from "@vcc/core";
import { findPostPhase10CavityRow } from "../src/post-phase10-cavity.ts";
import {
  DISCOVERY_FACET_EXPERIMENT_ID,
  POST_PHASE10_SMOKE_ROWS,
  runPostPhase10DiscoveryRow,
  type DiscoverySpatialSnapshot,
} from "../src/post-phase10-discovery.ts";
import {
  POST_PHASE10_FACET_FACTORIAL_ROWS,
  POST_PHASE10_FACET_REUSED_CONTROLS,
  findPostPhase10FacetFactorialRow,
} from "../src/post-phase10-facet-factorial.ts";

const temporaryDirectories: string[] = [];
function scratch(): string {
  const directory = mkdtempSync(join(tmpdir(), "vcc-facet-factorial-"));
  temporaryDirectories.push(directory);
  return directory;
}
function readJson(directory: string, leaf: string): Record<string, unknown> {
  return JSON.parse(readFileSync(join(directory, leaf), "utf8")) as Record<string, unknown>;
}
afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe("bounded post-Phase-10 facet factorial", () => {
  it("launches exactly four hybrids with the completed baseline controls' unchanged settings", () => {
    const expectedIds = ["4p5", "5"].flatMap((temperature) =>
      ["basal-only", "prism-only"].map((arm) => `facet-isolation-t${temperature}-${arm}`),
    );
    expect(POST_PHASE10_FACET_FACTORIAL_ROWS.map((row) => row.id)).toEqual(expectedIds);
    for (const row of POST_PHASE10_FACET_FACTORIAL_ROWS) {
      const temperature = row.tempC === -4.5 ? "4p5" : "5";
      const baseline = findPostPhase10CavityRow(`cavity-baseline-t${temperature}-m1`);
      expect(baseline).toBeDefined();
      const { experimentalFacetDips, ...ordinarySettings } = row;
      expect({ ...ordinarySettings, id: baseline?.id }).toEqual(baseline);
      expect(["basal-only", "prism-only"]).toContain(experimentalFacetDips);
      expect(findPostPhase10FacetFactorialRow(row.id)).toBe(row);
    }
    expect(findPostPhase10FacetFactorialRow("cavity-baseline-t4p5-m1")).toBeUndefined();
    expect(POST_PHASE10_FACET_REUSED_CONTROLS).toEqual(
      ["4p5", "5"].flatMap((temperature) => ["m1", "nodip"].map((arm) => ({
        rowId: `cavity-baseline-t${temperature}-${arm}`,
        directory: `out/post-phase10-cavity/campaign-2026-09-08/rows/cavity-baseline-t${temperature}-${arm}`,
        effectiveFacetDips: arm === "m1" ? "both" : "neither",
        producerGitHead: "eb7b5c4f932939e3b40d686a996796fdaceb1894",
      }))),
    );
  });

  it("lists only those four launch rows and retains the 28-worker ceiling", () => {
    const entry = "runner/src/post-phase10-discovery-main.ts";
    const listed = execFileSync(process.execPath, [entry, "list-facet-factorial"], {
      encoding: "utf8", windowsHide: true,
    });
    expect(JSON.parse(listed)).toEqual(POST_PHASE10_FACET_FACTORIAL_ROWS);
    const output = join(scratch(), "unlaunched");
    const rejected = spawnSync(process.execPath, [entry, "launch-facet-factorial", output, "29"], {
      encoding: "utf8", windowsHide: true,
    });
    expect(rejected.status).toBe(1);
    expect(rejected.stderr).toContain("concurrency must be an integer in [1, 28]");
    expect(existsSync(output)).toBe(false);
  });

  it.each(["basal-only", "prism-only"] as const)(
    "preserves %s identity throughout one-cycle artifacts and uses that facet law",
    (experimentalFacetDips) => {
      const directory = scratch();
      const row = { ...POST_PHASE10_SMOKE_ROWS[0], experimentalFacetDips, spatialSampleExtents: [3] };
      const messages: string[] = [];
      const result = runPostPhase10DiscoveryRow(row, directory, {
        heartbeat: (message) => messages.push(message),
      });
      const identity = { experimentId: DISCOVERY_FACET_EXPERIMENT_ID, experimentalFacetDips };
      expect(result.admissible, JSON.stringify(result)).toBe(true);
      expect(result.cycles).toBe(1);
      expect(result).toMatchObject(identity);
      for (const leaf of ["spec.json", "host.json", "status.json", "result.json"]) {
        expect(readJson(directory, leaf), leaf).toMatchObject(identity);
      }
      expect(readJson(directory, "spec.json").row).toMatchObject({ experimentalFacetDips });
      const events = readFileSync(join(directory, "events.jsonl"), "utf8").trim().split("\n");
      expect(events).toHaveLength(1);
      expect(JSON.parse(events[0])).toMatchObject(identity);
      expect(result.spatialSnapshots).toHaveLength(1);
      const snapshot = readJson(directory, result.spatialSnapshots![0].path) as unknown as DiscoverySpatialSnapshot;
      expect(snapshot).toMatchObject(identity);
      expect(snapshot.cells.some((cell) => cell.facet === "basal")).toBe(true);
      expect(snapshot.cells.some((cell) => cell.facet === "prism")).toBe(true);
      for (const cell of snapshot.cells) {
        const dipped = experimentalFacetDips === "basal-only" ? cell.facet === "basal" : cell.facet === "prism";
        expect(cell.alphaHKBoundary).toBeCloseTo(
          alphaHK(cell.facet, row.tempC, cell.sigmaBoundary, dipped ? "M1" : "M1_NO_DIP_ABLATION"), 11,
        );
      }
      expect(messages.length).toBeGreaterThanOrEqual(2);
      expect(messages.every((message) => message.includes(`experimentId=${identity.experimentId}`) &&
        message.includes(`experimentalFacetDips=${experimentalFacetDips}`))).toBe(true);
    },
  );

  it("leaves ordinary one-cycle artifacts and labels without experimental fields", () => {
    const directory = scratch();
    const messages: string[] = [];
    const result = runPostPhase10DiscoveryRow(
      { ...POST_PHASE10_SMOKE_ROWS[0], spatialSampleExtents: [3] }, directory,
      { heartbeat: (message) => messages.push(message) },
    );
    expect(result.admissible).toBe(true);
    const records = [
      ...["spec.json", "host.json", "status.json", "result.json"].map((leaf) => readJson(directory, leaf)),
      ...readFileSync(join(directory, "events.jsonl"), "utf8").trim().split("\n")
        .map((line) => JSON.parse(line) as Record<string, unknown>),
      readJson(directory, result.spatialSnapshots![0].path),
    ];
    for (const record of records) {
      expect(record).not.toHaveProperty("experimentId");
      expect(record).not.toHaveProperty("experimentalFacetDips");
    }
    expect(messages.every((message) => !message.includes("experimentId=") &&
      !message.includes("experimentalFacetDips="))).toBe(true);
  });

  it("does not accept a hybrid described as an ordinary no-dip base or a timeline run", () => {
    const output = join(scratch(), "unstarted");
    const row = { ...POST_PHASE10_SMOKE_ROWS[0], experimentalFacetDips: "basal-only" as const };
    expect(() => runPostPhase10DiscoveryRow({ ...row, paramSet: "M1_NO_DIP_ABLATION" }, output))
      .toThrow("facet-isolation rows require the M1 base and a constant environment");
    expect(() => runPostPhase10DiscoveryRow({
      ...row, timelineEvent: { triggerLargestExtent: 3, tempC: -4.5, sigmaInfinity: 0.005 },
    }, output)).toThrow("facet-isolation rows require the M1 base and a constant environment");
    expect(existsSync(output)).toBe(false);
  });
});
