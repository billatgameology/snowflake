import { execFileSync } from "node:child_process";
import { appendFileSync, existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import { decodeLKExperimentalResumeCheckpointV1 } from "@vcc/core";
import { LKSolver } from "@vcc/solver-cpu";
import { type DiscoveryRow, runPostPhase10DiscoveryRow } from "../src/post-phase10-discovery.ts";
import { readResumableDiscoveryStatus, runResumableDiscoveryRow } from "../src/post-phase10-discovery-resume.ts";
const directories: string[] = [];
afterEach(() => { for (const directory of directories.splice(0)) rmSync(directory, { recursive: true, force: true }); });
function temporary(): string { const path = mkdtempSync(join(tmpdir(), "vcc-experimental-resume-")); directories.push(path); return path; }
const base: DiscoveryRow = {
  id: "resume-witness", lane: "C", conditional: false, tempC: -5, fraction: .15, sigmaInfinity: .0075,
  paramSet: "M1", dimsN: 12, dxUm: .35, cflFill: .2, seedRadius: 1, seedThickness: 1,
  targetExtent: 9, maxSteps: 12, spatialSampleExtents: [3, 5],
};
const modes: readonly [string, Partial<DiscoveryRow>][] = [
  ["both", { experimentalFacetDips: "both" }], ["neither", { experimentalFacetDips: "neither" }],
  ["basal-only", { experimentalFacetDips: "basal-only" }], ["prism-only", { experimentalFacetDips: "prism-only" }],
  ["ordinary-no-dip", { paramSet: "M1_NO_DIP_ABLATION" }],
  ["full-width", { experimentalBasalWidthCells: 3 }],
  ["early-width", { experimentalBasalWidthCells: 3, experimentalBasalWidthHistory: { mode: "early-only", cutoffSeconds: 1 } }],
];
function events(directory: string): Record<string, unknown>[] {
  return readFileSync(join(directory, "events.jsonl"), "utf8").trim().split("\n").filter(Boolean).map((line) => {
    const { rssBytes: _rss, ...scientific } = JSON.parse(line) as Record<string, unknown>; return scientific;
  });
}
function checkpoint(directory: string): Buffer {
  const pointer = JSON.parse(readFileSync(join(directory, "resume-current.json"), "utf8")) as { slot: number };
  return readFileSync(join(directory, "resume", `slot-${pointer.slot}.bin`));
}
async function solverAt(directory: string): Promise<LKSolver> {
  const bytes = checkpoint(directory);
  return LKSolver.fromExperimentalResumeStateV1(await decodeLKExperimentalResumeCheckpointV1({
    byteLength: bytes.length, async readExactly(offset, target) { target.set(bytes.subarray(offset, offset + target.length)); },
  }));
}
const fixture = fileURLToPath(new URL("./fixtures/discovery-resume-worker.ts", import.meta.url));
function child(rowPath: string, directory: string, pauseAt?: number): void {
  execFileSync(process.execPath, [fixture, rowPath, directory, ...(pauseAt === undefined ? [] : [String(pauseAt)])], {
    cwd: resolve("."), encoding: "utf8", timeout: 30_000,
  });
}

describe("BLD experimental row continuation", () => {
  it.each(modes)("preserves scientific events and exact solver bytes across multiple restores: %s", async (_name, mode) => {
    const root = temporary(); const direct = join(root, "direct"); const resumed = join(root, "resumed");
    const row = { ...base, ...mode };
    const full = await runResumableDiscoveryRow(row, direct);
    expect(full).toMatchObject({ state: "paused", reason: "step-review", cycle: 12 });
    for (const cutoff of [5, 9, 12]) {
      expect(await runResumableDiscoveryRow(row, resumed, { pauseRequested: (cycle) => cycle >= cutoff }))
        .toMatchObject({ state: "paused", reason: "operator-pause", cycle: cutoff });
    }
    expect(events(resumed)).toEqual(events(direct));
    expect(checkpoint(resumed)).toEqual(checkpoint(direct));
    const measurements = (directory: string): Record<string, unknown> => {
      const pointer = JSON.parse(readFileSync(join(directory, "resume-current.json"), "utf8")) as { slot: number };
      const metadata = JSON.parse(readFileSync(join(directory, "resume", `slot-${pointer.slot}.json`), "utf8")) as
        { measurements: Record<string, unknown> };
      const { peakRssBytes: _rss, startedAt: _start, ...science } = metadata.measurements; return science;
    };
    expect(measurements(resumed)).toEqual(measurements(direct));
    expect(existsSync(join(resumed, "result.json"))).toBe(false);
    const solver = await solverAt(resumed); const state = solver.experimentalResumeStateV1().common;
    expect(state.attachedCount).toBeGreaterThan(7);
    expect([...state.f].some((fill) => fill > 0 && fill < 1)).toBe(true);
    expect([...state.sigma].some((sigma) => sigma > 0 && sigma < state.sigmaInfinity)).toBe(true);
    expect(state.fillLedger).toBeGreaterThan(0); expect(state.volumeRateM3PerS).toBeGreaterThan(0);
    const snapshots = readdirSync(direct).filter((leaf) => leaf.startsWith("boundary-e"));
    expect(snapshots.length).toBeGreaterThan(0);
    for (const leaf of snapshots) expect(readFileSync(join(resumed, leaf))).toEqual(readFileSync(join(direct, leaf)));
    if (mode.experimentalBasalWidthHistory !== undefined) {
      const active = events(resumed).map((event) => (event.basalWidthObservation as { historyActive: boolean }).historyActive);
      expect(active).toContain(true); expect(active).toContain(false);
    }
  });

  it("matches a legacy uninterrupted control after real fresh-process pause and resume", () => {
    const root = temporary(); const direct = join(root, "legacy"); const resumed = join(root, "resumed");
    const row: DiscoveryRow = { ...base, maxSteps: 40, targetExtent: 7, experimentalBasalWidthCells: 3,
      experimentalBasalWidthHistory: { mode: "early-only", cutoffSeconds: 1 } };
    const rowPath = join(root, "row.json"); writeFileSync(rowPath, JSON.stringify(row));
    const control = runPostPhase10DiscoveryRow(row, direct);
    expect(control.cycles).toBeGreaterThan(12); expect(control.attachedCount).toBeGreaterThan(control.seedSites);
    for (const cutoff of [5, 9]) child(rowPath, resumed, cutoff);
    child(rowPath, resumed);
    expect(events(resumed)).toEqual(events(direct));
    expect(readResumableDiscoveryStatus(resumed)).toMatchObject({ state: "terminal", cycle: control.cycles });
    const science = (result: Record<string, unknown>): Record<string, unknown> => {
      const { wallSeconds: _wall, peakRssBytes: _rss, startedAt: _start, finishedAt: _finish, ...rest } = result; return rest;
    };
    expect(science(JSON.parse(readFileSync(join(resumed, "result.json"), "utf8"))))
      .toEqual(science(control as unknown as Record<string, unknown>));
  });

  it("keeps the step allowance resumable and honors pause before initial growth", async () => {
    const root = temporary(); const row = { ...base, maxSteps: 2, experimentalFacetDips: "both" as const };
    const pauseFile = join(root, "pause.json"); writeFileSync(pauseFile, "{}"); const output = join(root, "row");
    expect(await runResumableDiscoveryRow(row, output, { pauseFile })).toMatchObject({ state: "paused", cycle: 0 });
    unlinkSync(pauseFile);
    expect(await runResumableDiscoveryRow(row, output)).toMatchObject({ state: "paused", reason: "step-review", cycle: 2 });
    expect(await runResumableDiscoveryRow(row, output)).toMatchObject({ state: "paused", reason: "step-review", cycle: 4 });
    expect(existsSync(join(output, "result.json"))).toBe(false);
  });

  it("classifies real scientific endpoints as terminal and verifies their bytes before skipping", async () => {
    const output = temporary(); const row = { ...base, targetExtent: 5, experimentalFacetDips: "both" as const };
    const outcome = await runResumableDiscoveryRow(row, output);
    expect(outcome).toMatchObject({ state: "terminal", result: { stopReason: "size-target", admissible: true } });
    const before = checkpoint(output); expect(await runResumableDiscoveryRow(row, output)).toEqual(outcome);
    expect(checkpoint(output)).toEqual(before);
    appendFileSync(join(output, "result.json"), " ");
    expect(() => readResumableDiscoveryStatus(output)).toThrow(/result digest mismatch/);
  });

  it("preserves an uncommitted event tail and orphan observations while ignoring a torn inactive slot", async () => {
    const root = temporary(); const output = join(root, "row"); const direct = join(root, "direct");
    const row = { ...base, experimentalFacetDips: "both" as const };
    await runResumableDiscoveryRow(row, direct);
    await runResumableDiscoveryRow(row, output, { pauseRequested: (cycle) => cycle >= 5 });
    const pointer = JSON.parse(readFileSync(join(output, "resume-current.json"), "utf8")) as { slot: number };
    writeFileSync(join(output, "resume", `slot-${1 - pointer.slot}.bin`), "torn unpublished checkpoint");
    appendFileSync(join(output, "events.jsonl"), '{"uncommitted":true}\n');
    writeFileSync(join(output, "boundary-e7.json"), "uncommitted observation");
    writeFileSync(join(output, "result.json"), "uncommitted result");
    unlinkSync(join(output, "resume-status.json"));
    expect(readResumableDiscoveryStatus(output)).toMatchObject({ state: "running", cycle: 5 });
    await runResumableDiscoveryRow(row, output, { pauseRequested: (cycle) => cycle >= 12 });
    expect(events(output)).toEqual(events(direct)); expect(checkpoint(output)).toEqual(checkpoint(direct));
    const recovered = readdirSync(join(output, "recovery"));
    expect(recovered.some((leaf) => leaf.startsWith("events-tail-"))).toBe(true);
    expect(recovered.some((leaf) => leaf.startsWith("boundary-e7.json.uncommitted-"))).toBe(true);
    const tail = recovered.find((leaf) => leaf.startsWith("events-tail-"))!;
    expect(readFileSync(join(output, "recovery", tail), "utf8")).toBe('{"uncommitted":true}\n');
  });

  it("refuses corrupted committed events or pointer without silently falling back", async () => {
    const root = temporary(); const row = { ...base, experimentalFacetDips: "both" as const };
    const first = join(root, "events"); await runResumableDiscoveryRow(row, first, { pauseRequested: (cycle) => cycle >= 5 });
    const eventPath = join(first, "events.jsonl"); const bytes = readFileSync(eventPath); bytes[0] ^= 1; writeFileSync(eventPath, bytes);
    await expect(runResumableDiscoveryRow(row, first)).rejects.toThrow(/event prefix digest mismatch/);
    const second = join(root, "pointer"); await runResumableDiscoveryRow(row, second, { pauseRequested: (cycle) => cycle >= 5 });
    const pointerPath = join(second, "resume-current.json");
    const pointer = JSON.parse(readFileSync(pointerPath, "utf8")) as { metadataSha256: string };
    pointer.metadataSha256 = "0".repeat(64); writeFileSync(pointerPath, JSON.stringify(pointer));
    await expect(runResumableDiscoveryRow(row, second)).rejects.toThrow(/no implicit fallback/);
  });

  it("refuses row substitution, timelines and duplicate live writers", async () => {
    const output = temporary(); const row = { ...base, experimentalFacetDips: "both" as const };
    await runResumableDiscoveryRow(row, output, { pauseRequested: (cycle) => cycle >= 1 });
    await expect(runResumableDiscoveryRow({ ...row, sigmaInfinity: .02 }, output)).rejects.toThrow(/binding mismatch/);
    await expect(runResumableDiscoveryRow({ ...row, timelineEvent: { triggerLargestExtent: 5, tempC: -10, sigmaInfinity: .01 } }, output))
      .rejects.toThrow(/unsupported BLD resume mode/);
    writeFileSync(join(output, "resume-writer.lock.json"), JSON.stringify({ pid: process.pid, token: "other-writer" }));
    await expect(runResumableDiscoveryRow(row, output)).rejects.toThrow(/live writer/);
  });

  it("recovers unpublished initial bytes only with the separate initial binding", async () => {
    const root = temporary(); const output = join(root, "initial"); const row = { ...base, experimentalFacetDips: "both" as const };
    await runResumableDiscoveryRow(row, output, { pauseRequested: () => true });
    unlinkSync(join(output, "resume-current.json")); unlinkSync(join(output, "resume-status.json"));
    writeFileSync(join(output, "resume", "slot-0.bin"), "interrupted first encode");
    expect(await runResumableDiscoveryRow(row, output, { pauseRequested: () => true })).toMatchObject({ state: "paused", cycle: 0 });
    expect(readdirSync(join(output, "recovery")).some((leaf) => leaf.startsWith("unpublished-initial-"))).toBe(true);
    const legacy = join(root, "legacy"); runPostPhase10DiscoveryRow(row, legacy);
    await expect(runResumableDiscoveryRow(row, legacy)).rejects.toThrow(/cannot be resumed/);
  });
});
