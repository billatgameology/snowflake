import { createHash } from "node:crypto";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { coordsOf, hexSeedSites } from "@vcc/core";
import { HIL_GROWTH_DYNAMICS_OCT21_ROWS } from "../src/hil-growth-dynamics-oct21-roster.ts";
import { readGrowthDynamicsRow, readHilGrowthDynamicsCampaign,
  readRetainedGrowthDynamicsRows } from "../src/hil-growth-dynamics-oct21-readout.ts";
import { POST_PHASE10_SMOKE_ROWS, runPostPhase10DiscoveryRow } from "../src/post-phase10-discovery.ts";

const temporary: string[] = [];
const json = (path: string, value: unknown) => writeFileSync(path, JSON.stringify(value));
function directory() {
  const path = mkdtempSync(join(tmpdir(), "vcc-growth-readout-")); temporary.push(path); return path;
}
function completed() {
  const path = directory(), row = { ...POST_PHASE10_SMOKE_ROWS[0], id: "gd21-hil-w4-manufactured-readout-fixture" };
  runPostPhase10DiscoveryRow(row, path);
  json(join(path, "exit.json"), { rowId: row.id, exitCode: 0, signal: null });
  return { path, row };
}
afterEach(() => { for (const path of temporary.splice(0)) rmSync(path, { recursive: true, force: true }); });

describe("HIL growth-dynamics saved-row selection", () => {
  it("lists the complete new 24-row roster, including unstarted members, without inventing cohort results", () => {
    const report = readHilGrowthDynamicsCampaign(directory());
    expect(report.rows.map((row) => row.rowId)).toEqual(HIL_GROWTH_DYNAMICS_OCT21_ROWS.map(({ row }) => row.id));
    expect(report.rows.filter((row) => row.rowId.includes("-w4-"))).toHaveLength(4);
    expect(report.rows.filter((row) => row.rowId.includes("-c1-"))).toHaveLength(8);
    expect(report.rows.filter((row) => row.rowId.startsWith("gd21-hil-h1-"))).toHaveLength(12);
    expect(report.census).toMatchObject({ requestedRows: 24, sizeEndpoints: 0 });
    expect(report.census.missingOrUnresolved).toHaveLength(24);
    expect(report.frozenCohortComparisons.available).toBe(false);
  });

  it("does not read a live/truncated stream and rejects mismatched immutable operands", () => {
    const root = directory(), row = HIL_GROWTH_DYNAMICS_OCT21_ROWS[0].row;
    const path = join(root, "rows", row.id); mkdirSync(path, { recursive: true });
    json(join(path, "spec.json"), { row });
    writeFileSync(join(path, "events.jsonl"), '{"partial":');
    const report = readHilGrowthDynamicsCampaign(root);
    expect(report.rows[0]).toMatchObject({ rowId: row.id, status: "pending" });
    json(join(path, "spec.json"), { row: { ...row, cflFill: 0.05 } });
    expect(() => readHilGrowthDynamicsCampaign(root)).toThrow("immutable registered row mismatch");
  });

  it("reconstructs a newly named row from real saved events and independently checks count, span and hashes", () => {
    const { path, row } = completed(), report = readGrowthDynamicsRow(path, row);
    expect(report.status).toBe("size-endpoint");
    if (!("reconstruction" in report)) throw new Error("expected completed row reconstruction");
    const events = readFileSync(join(path, "events.jsonl"), "utf8").trim().split("\n").map((line) =>
      JSON.parse(line) as { attached: { index: number }[] });
    const dims = { nx: row.dimsN, ny: row.dimsN, nz: row.dimsN };
    const cells = [...hexSeedSites(dims, row.seedRadius, row.seedThickness),
      ...events.flatMap((event) => event.attached.map((site) => site.index))];
    expect(report.reconstruction!.terminal.attachedCount).toBe(new Set(cells).size);
    const z = cells.map((index) => coordsOf(dims, index)[2]);
    expect(report.reconstruction!.terminal.axialCenterSpanUm).toBe((Math.max(...z) - Math.min(...z)) * row.dxUm);
    expect(report.reconstruction!.individualAgeBrackets.at(-1)?.exactEventTime).toBe(true);
    for (const input of report.inputs) {
      const bytes = readFileSync(input.path);
      expect(input.bytes).toBe(bytes.length);
      expect(input.sha256).toBe(createHash("sha256").update(bytes).digest("hex"));
    }
    const retained = readRetainedGrowthDynamicsRows([path]);
    expect(retained.mode).toBe("retained");
    expect(retained.rows[0].rowId).toBe(row.id);
    expect(retained.frozenCohortComparisons.available).toBe(false);
  });

  it("rejects coordinate corruption even when event/result counts agree and the producer claims success", () => {
    const { path, row } = completed();
    const events = readFileSync(join(path, "events.jsonl"), "utf8").trim().split("\n").map((line) => JSON.parse(line));
    events[0].attached.push({ index: 0, coords: [0, 0, 1] });
    events[0].attachedCount++;
    const result = JSON.parse(readFileSync(join(path, "result.json"), "utf8"));
    json(join(path, "result.json"), { ...result, attachedCount: result.attachedCount + 1 });
    writeFileSync(join(path, "events.jsonl"), events.map((event) => JSON.stringify(event)).join("\n") + "\n");
    expect(() => readGrowthDynamicsRow(path, row)).toThrow("attachment coordinates");
  });

  it.each(["step-cap", "domain-contact", "unconverged"])("keeps %s unresolved even with a zero exit", (stopReason) => {
    const { path, row } = completed();
    const result = JSON.parse(readFileSync(join(path, "result.json"), "utf8"));
    json(join(path, "result.json"), { ...result, stopReason });
    const report = readGrowthDynamicsRow(path, row);
    expect(report).toMatchObject({ status: "unresolved-terminal", stopReason });
    expect("reconstruction" in report).toBe(false);
  });
});
