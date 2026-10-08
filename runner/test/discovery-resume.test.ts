import { createHash } from "node:crypto";
import { spawn } from "node:child_process";
import { appendFileSync, existsSync, mkdtempSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { hostname, tmpdir } from "node:os";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { POST_PHASE10_SMOKE_ROWS, runPostPhase10DiscoveryRow, type DiscoveryRow } from "../src/post-phase10-discovery.ts";
import { acquireDiscoveryRowLease, withDiscoveryLeaseUpdate } from "../src/discovery-resume-io.ts";

const json = (path: string) => JSON.parse(readFileSync(path, "utf8"));
const sha = (bytes: string | Uint8Array) => createHash("sha256").update(bytes).digest("hex");
function directory() { return mkdtempSync(resolve(tmpdir(), "vcc-discovery-resume-")); }
function row(changes: Partial<DiscoveryRow> = {}): DiscoveryRow {
  return { ...POST_PHASE10_SMOKE_ROWS[0], id: "resume-witness", targetExtent: 9, maxSteps: 8, cflFill: 0.25,
    spatialSampleExtents: [3, 5, 7], ...changes };
}
function scientificResult(value: ReturnType<typeof runPostPhase10DiscoveryRow>) {
  const { wallSeconds, peakRssBytes, startedAt, finishedAt, ...science } = value;
  return science;
}
function scientificEvents(path: string) {
  return readFileSync(resolve(path, "events.jsonl"), "utf8").trim().split("\n").map((line) => {
    const { rssBytes, ...science } = JSON.parse(line); return science;
  });
}
function generation(path: string) {
  const pointer = json(resolve(path, "resume/latest.json"));
  return { pointer, path: resolve(path, "resume", pointer.current.directory) };
}
function mutateManifest(path: string, mutate: (manifest: any) => void) {
  const latest = generation(path);
  const manifest = json(resolve(latest.path, "manifest.json"));
  mutate(manifest);
  const bytes = JSON.stringify(manifest);
  writeFileSync(resolve(latest.path, "manifest.json"), bytes);
  latest.pointer.current.manifestSha256 = sha(bytes);
  writeFileSync(resolve(path, "resume/latest.json"), JSON.stringify(latest.pointer));
}

describe("discovery row continuation", () => {
  it("serializes stale-owner replacement and admits only one of two real worker contenders", async () => {
    const root = directory(); const owner = resolve(root, "resume-owner.json");
    writeFileSync(owner, JSON.stringify({ pid: 2147483647, hostname: hostname() }));
    withDiscoveryLeaseUpdate(owner, () => {
      expect(() => acquireDiscoveryRowLease(root)).toThrow(/acquisition/);
      expect(json(owner).pid).toBe(2147483647);
    });
    const entry = fileURLToPath(new URL("./fixtures/discovery-resume-lease-worker.ts", import.meta.url));
    const results = await Promise.all([0, 1].map(() => new Promise<number | null>((done) => {
      const child = spawn(process.execPath, [entry, root], { windowsHide: true, stdio: "ignore" });
      child.once("close", done);
    })));
    expect(results.filter((code) => code === 0)).toHaveLength(1);
    expect(results.filter((code) => code !== 0)).toHaveLength(1);
  });
  const modes: [string, Partial<DiscoveryRow>][] = [
    ["ordinary", {}], ["no-dip", { paramSet: "M1_NO_DIP_ABLATION" }],
    ...(["both", "neither", "basal-only", "prism-only"] as const).map((arm): [string, Partial<DiscoveryRow>] => [arm, { experimentalFacetDips: arm }]),
    ["width", { experimentalBasalWidthCells: 3 }],
    ["early width", { experimentalBasalWidthCells: 3, experimentalBasalWidthHistory: { mode: "early-only", cutoffSeconds: 0.4 } }],
    ["warm to cold", { tempC: -6, timelineEvent: { triggerLargestExtent: 5, tempC: -14.4, sigmaInfinity: 0.012 } }],
    ["cold to warm no-dip", { tempC: -14.4, paramSet: "M1_NO_DIP_ABLATION", maxSteps: 40, timelineEvent: { triggerLargestExtent: 5, tempC: -6, sigmaInfinity: 0.0075 } }],
  ];
  it.each(modes)("matches complete scientific output across multiple resumes: %s", (_name, changes) => {
    const root = directory(); const direct = resolve(root, "direct"); const resumed = resolve(root, "resumed");
    const candidate = row(changes);
    const expected = runPostPhase10DiscoveryRow(candidate, direct, { checkpoint: "create" });
    expect(expected.integrityErrors).toEqual([]);
    if (candidate.timelineEvent !== undefined) expect(expected.timeline?.eventCycle).toBeGreaterThan(1);
    if (candidate.experimentalBasalWidthHistory !== undefined) expect(new Set(scientificEvents(direct).map((event) => event.basalWidthObservation.historyActive))).toEqual(new Set([true, false]));
    const firstSplit = expected.timeline === undefined ? 2 : expected.timeline.eventCycle - 1;
    const secondSplit = expected.timeline?.eventCycle ?? 4;
    expect(runPostPhase10DiscoveryRow(candidate, resumed, { checkpoint: "create", pauseAfterCycles: firstSplit }).stopReason).toBe("checkpoint-pause");
    expect(runPostPhase10DiscoveryRow(candidate, resumed, { checkpoint: "resume", pauseAfterCycles: secondSplit }).stopReason).toBe("checkpoint-pause");
    const actual = runPostPhase10DiscoveryRow(candidate, resumed, { checkpoint: "resume" });
    expect(scientificResult(actual)).toEqual(scientificResult(expected));
    expect(scientificEvents(resumed)).toEqual(scientificEvents(direct));
    expect(readFileSync(resolve(generation(resumed).path, "solver.bin"))).toEqual(readFileSync(resolve(generation(direct).path, "solver.bin")));
    for (const snapshot of expected.spatialSnapshots ?? []) expect(readFileSync(resolve(resumed, snapshot.path))).toEqual(readFileSync(resolve(direct, snapshot.path)));
    expect(readdirSync(resolve(resumed, "resume")).filter((name) => name.startsWith("generation-"))).toHaveLength(2);
    // A crash after final checkpoint but before terminal result must not advance another update.
    expect(scientificResult(runPostPhase10DiscoveryRow(candidate, resumed, { checkpoint: "resume" }))).toEqual(scientificResult(expected));
  });

  it("preserves and removes uncommitted event/snapshot tails, ignoring an incomplete generation", () => {
    const root = directory(); const candidate = row();
    const direct = resolve(root, "direct"); const resumed = resolve(root, "resumed");
    runPostPhase10DiscoveryRow(candidate, direct, { checkpoint: "create" });
    runPostPhase10DiscoveryRow(candidate, resumed, { checkpoint: "create", pauseAfterCycles: 2 });
    const tail = '{"partial":';
    appendFileSync(resolve(resumed, "events.jsonl"), tail);
    writeFileSync(resolve(resumed, "boundary-e99.json"), "uncommitted snapshot");
    mkdirSync(resolve(resumed, "resume/pending-interrupted-write"));
    writeFileSync(resolve(resumed, "resume/pending-interrupted-write/solver.bin"), "partial");
    const result = runPostPhase10DiscoveryRow(candidate, resumed, { checkpoint: "resume" });
    expect(result.integrityErrors).toEqual([]);
    expect(scientificEvents(resumed)).toEqual(scientificEvents(direct));
    expect(existsSync(resolve(resumed, "boundary-e99.json"))).toBe(false);
    const recovery = readdirSync(resolve(resumed, "resume")).find((name) => name.startsWith("recovery-"))!;
    expect(readFileSync(resolve(resumed, "resume", recovery, "events-after-checkpoint.jsonl"), "utf8")).toBe(tail);
    expect(readFileSync(resolve(resumed, "resume", recovery, "boundary-e99.json"), "utf8")).toBe("uncommitted snapshot");
  });

  it.each(["solver corruption", "missing runner field", "missing cursor boundary", "wrong source", "wrong row"])("refuses %s before changing observations", (mutation) => {
    const root = directory(); const candidate = row({ timelineEvent: { triggerLargestExtent: 5, tempC: -14.4, sigmaInfinity: 0.012 } });
    expect(runPostPhase10DiscoveryRow(candidate, root, { checkpoint: "create", pauseAfterCycles: 6 }).stopReason).toBe("checkpoint-pause");
    const before = readFileSync(resolve(root, "events.jsonl"));
    if (mutation === "solver corruption") { const path = resolve(generation(root).path, "solver.bin"); const bytes = readFileSync(path); bytes[bytes.length - 1] ^= 1; writeFileSync(path, bytes); }
    if (mutation === "missing runner field") mutateManifest(root, (m) => { delete m.runner.totalSweeps; });
    if (mutation === "missing cursor boundary") mutateManifest(root, (m) => { m.runner.timelineCursor.lastBoundary = null; });
    if (mutation === "wrong source") mutateManifest(root, (m) => { m.binding.gitHead = "wrong"; });
    const invoked = mutation === "wrong row" ? { ...candidate, cflFill: 0.2 } : candidate;
    expect(() => runPostPhase10DiscoveryRow(invoked, root, { checkpoint: "resume" })).toThrow();
    expect(readFileSync(resolve(root, "events.jsonl"))).toEqual(before);
  });

  it("continues an actually killed worker in a fresh process with identical scientific output", async () => {
    const root = directory(); const candidate = row({ maxSteps: 100 });
    const direct = resolve(root, "direct"); const resumed = resolve(root, "resumed");
    const expected = runPostPhase10DiscoveryRow(candidate, direct, { checkpoint: "create" });
    const rowPath = resolve(root, "row.json"); writeFileSync(rowPath, JSON.stringify(candidate));
    const entry = fileURLToPath(new URL("./fixtures/discovery-resume-worker.ts", import.meta.url));
    const worker = spawn(process.execPath, [entry, rowPath, resumed, "create"], { windowsHide: true, stdio: "pipe" });
    let stderr = ""; worker.stderr.on("data", (chunk) => { stderr += chunk; }); worker.stdout.resume();
    const exited = new Promise<number | null>((done) => worker.once("close", (code) => done(code)));
    let killedAtTick: number | null = null;
    const deadline = Date.now() + 10_000;
    while (Date.now() < deadline && worker.exitCode === null) {
      const pointer = resolve(resumed, "resume/latest.json");
      if (existsSync(pointer)) {
        const state = json(resolve(generation(resumed).path, "manifest.json"));
        if (state.tick >= 1 && !existsSync(resolve(resumed, "result.json"))) { killedAtTick = state.tick; worker.kill(); break; }
      }
      await new Promise((done) => setTimeout(done, 2));
    }
    if (killedAtTick === null) worker.kill();
    expect(await exited, stderr).not.toBe(0);
    expect(killedAtTick).not.toBeNull();
    const continuation = spawn(process.execPath, [entry, rowPath, resumed, "resume"], { windowsHide: true, stdio: "pipe" });
    let continuationErrors = ""; continuation.stderr.on("data", (chunk) => { continuationErrors += chunk; }); continuation.stdout.resume();
    const code = await new Promise<number | null>((done) => continuation.once("close", (exit) => done(exit)));
    expect(code, continuationErrors).toBe(0);
    expect(scientificResult(json(resolve(resumed, "result.json")))).toEqual(scientificResult(expected));
    expect(scientificEvents(resumed)).toEqual(scientificEvents(direct));
    expect(readFileSync(resolve(generation(resumed).path, "solver.bin"))).toEqual(readFileSync(resolve(generation(direct).path, "solver.bin")));
  });
});
