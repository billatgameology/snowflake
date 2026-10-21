import { createHash } from "node:crypto";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { coordsOf, hexSeedSites } from "@vcc/core";
import { BLD_GROWTH_DYNAMICS_OCT21_ROWS } from "../src/bld-growth-dynamics-oct21-roster.ts";
import { readBldGrowthDynamicsCampaign, readBldGrowthDynamicsRow, readRetainedBldGrowthDynamicsRows,
  type BldReadoutKind } from "../src/bld-growth-dynamics-oct21-readout.ts";
import { POST_PHASE10_SMOKE_ROWS, runPostPhase10DiscoveryRow } from "../src/post-phase10-discovery.ts";

const temporary: string[] = [];
const json = (path: string, value: unknown) => writeFileSync(path, JSON.stringify(value));
function directory() {
  const path = mkdtempSync(join(tmpdir(), "vcc-bld-readout-")); temporary.push(path); return path;
}
function completed(kind: BldReadoutKind) {
  const path = directory(), row = { ...POST_PHASE10_SMOKE_ROWS[0], id: `manufactured-bld-${kind}-fixture`,
    ...(kind === "warm" ? {} : { experimentalFacetDips: "neither" as const }),
    ...(kind === "cold" ? { tempC: -20 } : {}) };
  runPostPhase10DiscoveryRow(row, path);
  json(join(path, "exit.json"), { rowId: row.id, exitCode: 0, signal: null });
  return { path, row };
}
afterEach(() => { for (const path of temporary.splice(0)) rmSync(path, { recursive: true, force: true }); });

describe("BLD growth-dynamics saved-row selection", () => {
  it("retains all 92 requested rows and scientific kinds while their inputs are missing", () => {
    const report = readBldGrowthDynamicsCampaign(directory());
    expect(report.rows.map((row) => row.rowId)).toEqual(BLD_GROWTH_DYNAMICS_OCT21_ROWS.map(({ row }) => row.id));
    expect(report.census).toMatchObject({ requestedRows: 92, sizeEndpoints: 0,
      kinds: [{ kind: "warm", requested: 50, sizeEndpoints: 0 },
        { kind: "facet", requested: 38, sizeEndpoints: 0 }, { kind: "cold", requested: 4, sizeEndpoints: 0 }] });
    expect(report.census.missing).toHaveLength(92);
    expect(report.census.pending).toHaveLength(0);
    expect(report.census.invalid).toHaveLength(0);
    expect(report.frozenCohortComparisons.available).toBe(false);
    expect(report.frozenCohortComparisons.pending.join(" ")).toContain("tip-8/9");
  });

  it("distinguishes pending live rows from operand mismatch without reading partial events", () => {
    const root = directory(), row = BLD_GROWTH_DYNAMICS_OCT21_ROWS[0].row;
    const path = join(root, "rows", row.id); mkdirSync(path, { recursive: true });
    json(join(path, "spec.json"), { row });
    writeFileSync(join(path, "events.jsonl"), '{"partial":');
    let report = readBldGrowthDynamicsCampaign(root);
    expect(report.rows[0]).toMatchObject({ status: "pending", kind: "facet" });
    expect(report.rows[0].inputs).toHaveLength(1);
    expect(report.census.pending).toHaveLength(1);
    expect(report.census.missing).toHaveLength(91);
    json(join(path, "spec.json"), { row: { ...row, id: "unexpected-historical-row", cflFill: 0.05 } });
    report = readBldGrowthDynamicsCampaign(root);
    expect(report.rows[0]).toMatchObject({ rowId: row.id, status: "invalid" });
    expect(report.rows[0].reason).toContain("immutable registered row mismatch");
    expect(report.census.invalid).toHaveLength(1);
    expect(report.census.missing).toHaveLength(91);
  });

  it("reconstructs explicit warm, facet and cold inputs with original producer identities and independent spans", () => {
    const fixtures = (["warm", "facet", "cold"] as const).map((kind) => ({ kind, ...completed(kind) }));
    const report = readRetainedBldGrowthDynamicsRows(fixtures.map(({ kind, path }) => ({ kind, directory: path })));
    expect(report.census.sizeEndpoints).toBe(3);
    expect(report.frozenCohortComparisons.available).toBe(false);
    expect(report.rows.map((row) => row.rowId)).toEqual(fixtures.map(({ row }) => row.id));
    for (const [index, entry] of report.rows.entries()) {
      const { row, path, kind } = fixtures[index], saved = entry.scientificReadout;
      if (!saved || !("reconstruction" in saved) || !saved.reconstruction) throw new Error("expected reconstructed endpoint");
      const events = readFileSync(join(path, "events.jsonl"), "utf8").trim().split("\n")
        .map((line) => JSON.parse(line) as { attached: { index: number }[] });
      const dims = { nx: row.dimsN, ny: row.dimsN, nz: row.dimsN };
      const occupied = new Set([...hexSeedSites(dims, row.seedRadius, row.seedThickness),
        ...events.flatMap((event) => event.attached.map((site) => site.index))]);
      const coordinates = [...occupied].map((site) => coordsOf(dims, site));
      const spans = [0, 1, 2].map((axis) => Math.max(...coordinates.map((point) => point[axis])) -
        Math.min(...coordinates.map((point) => point[axis])));
      expect(saved.reconstruction.terminal).toMatchObject({ attachedCount: occupied.size,
        extent: Math.max(...spans) + 1, axialCenterSpanUm: spans[2] * row.dxUm });
      const result = JSON.parse(readFileSync(join(path, "result.json"), "utf8"));
      expect(saved.producer).toEqual({ gitHead: result.gitHead, node: result.node });
      expect(saved.reconstruction.individualAgeBrackets.at(-1)?.exactEventTime).toBe(true);
      expect(saved.cavity === null).toBe(kind !== "warm");
      for (const input of entry.inputs) {
        const bytes = readFileSync(input.path);
        expect(input.bytes).toBe(bytes.length);
        expect(input.sha256).toBe(createHash("sha256").update(bytes).digest("hex"));
      }
    }
    const wrong = readBldGrowthDynamicsRow(fixtures[1].path, "warm");
    expect(wrong.status).toBe("invalid");
    expect(wrong.reason).toContain("facet intervention selected as warm");
  });

  it("retains coordinate corruption as invalid with input hashes even when producer counts agree", () => {
    const { path, row } = completed("facet");
    const events = readFileSync(join(path, "events.jsonl"), "utf8").trim().split("\n").map((line) => JSON.parse(line));
    events[0].attached.push({ index: 0, coords: [0, 0, 1] }); events[0].attachedCount++;
    const result = JSON.parse(readFileSync(join(path, "result.json"), "utf8"));
    json(join(path, "result.json"), { ...result, attachedCount: result.attachedCount + 1 });
    writeFileSync(join(path, "events.jsonl"), events.map((event) => JSON.stringify(event)).join("\n") + "\n");
    const report = readBldGrowthDynamicsRow(path, "facet", row);
    expect(report.status).toBe("invalid");
    expect(report.reason).toContain("attachment coordinates");
    expect(report.inputs.some((input) => input.path.endsWith("events.jsonl"))).toBe(true);
    expect(report.scientificReadout).toBeNull();
  });

  it("keeps finite step-cap outcomes unresolved and refuses duplicate retained identities", () => {
    const { path, row } = completed("cold");
    const result = JSON.parse(readFileSync(join(path, "result.json"), "utf8"));
    json(join(path, "result.json"), { ...result, stopReason: "step-cap" });
    const report = readBldGrowthDynamicsRow(path, "cold", row);
    expect(report).toMatchObject({ status: "unresolved-terminal" });
    expect(report.scientificReadout).toMatchObject({ stopReason: "step-cap" });
    expect(() => readRetainedBldGrowthDynamicsRows([{ kind: "cold", directory: path },
      { kind: "cold", directory: path }])).toThrow("duplicate selected row IDs");
  });
});
