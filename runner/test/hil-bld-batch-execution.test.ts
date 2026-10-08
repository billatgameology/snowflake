import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { batchGitHead, batchHostIdentity, batchMemoryFailure, launchDiscoveryRows,
  type BatchHostSample } from "../src/hil-bld-batch-execution.ts";
import { firstBatchProbeRows, firstBatchRosterSha256, parseFirstBatchHost,
  validateFirstBatchProbeReceipt, acquireBldCampaignLock, validateResumableBldCampaign, requestBldPause, type FirstBatchProbeReceipt } from "../src/hil-bld-batch-main.ts";
import { FIRST_BATCH_ID, firstBatchRows, firstBatchRepresentativeRows } from "../src/hil-bld-batch-roster.ts";
import { POST_PHASE10_SMOKE_ROWS } from "../src/post-phase10-discovery.ts";

const temporary: string[] = [];
afterEach(() => { for (const directory of temporary.splice(0)) rmSync(directory, { recursive: true, force: true }); });
const read = (path: string): any => JSON.parse(readFileSync(path, "utf8"));
const safeSample = (): BatchHostSample => ({ capturedUtc: new Date().toISOString(),
  availablePhysicalBytes: 40 * 1024 ** 3, commitHeadroomBytes: 40 * 1024 ** 3, children: [] });

function fixture() {
  const directory = mkdtempSync(join(tmpdir(), "vcc-batch-execution-"));
  temporary.push(directory);
  const entryPath = join(directory, "child.mjs");
  writeFileSync(entryPath, `
    const [id] = process.argv.slice(2);
    console.log('stdout:' + id);
    console.error('stderr:' + id);
    await new Promise(resolve => setTimeout(resolve, id.includes('slow') ? 20000 : 200));
    process.exitCode = id.includes('fail') ? 7 : 0;
  `);
  return { directory, entryPath };
}

describe("named batch execution", () => {

  it("pauses dispatch without killing the active update, then keeps a distinct retry log", async () => {
    const { directory, entryPath } = fixture();
    const rows = ["first", "queued"].map((id) => ({ ...POST_PHASE10_SMOKE_ROWS[0], id }));
    let pause = false;
    const exits = await launchDiscoveryRows({ campaignDirectory: directory, launchName: "attempt-0001", rows,
      concurrency: 1, entryPath, resumeRows: true, workerArguments: (row) => [row.id],
      pauseRequested: () => pause,
      monitor: { cadenceMs: 20, sample: async (pids) => { if (pids.length > 0) pause = true; return safeSample(); } } });
    expect(exits).toHaveLength(1);
    expect(exits[0]).toMatchObject({ rowId: "first", exitCode: 0, signal: null });
    expect(exits[0].termination).toBeUndefined();
    expect(read(join(directory, "attempt-0001-complete.json"))).toMatchObject({
      abortReason: "operator-pause", unstartedRowIds: ["queued"] });
    const rowDirectory = join(directory, "rows", "first");
    writeFileSync(join(rowDirectory, "checkpoint-witness"), "retained-state");
    const second = await launchDiscoveryRows({ campaignDirectory: directory, launchName: "attempt-0002",
      rows: [rows[0]], concurrency: 1, entryPath, resumeRows: true, workerArguments: (row) => [row.id] });
    expect(second[0].exitCode).toBe(0);
    expect(readFileSync(join(rowDirectory, "checkpoint-witness"), "utf8")).toBe("retained-state");
    for (const attempt of ["attempt-0001", "attempt-0002"]) {
      expect(readFileSync(join(rowDirectory, "attempts", attempt, "stdout.log"), "utf8")).toContain("stdout:first");
      expect(read(join(rowDirectory, "attempts", attempt, "process.json")).pid).toBeGreaterThan(0);
      expect(read(join(rowDirectory, "attempts", attempt, "exit.json")).exitCode).toBe(0);
    }
    expect(read(join(directory, "attempt-0002-launch.json")).hardWallSeconds).toBeUndefined();
  });

  it("dispatches nothing when an operator pause is already pending", async () => {
    const { directory, entryPath } = fixture();
    const exits = await launchDiscoveryRows({ campaignDirectory: directory, launchName: "prepaused",
      rows: [POST_PHASE10_SMOKE_ROWS[0]], concurrency: 1, entryPath, pauseRequested: () => true });
    expect(exits).toEqual([]);
    expect(read(join(directory, "prepaused-complete.json"))).toMatchObject({
      actualMaximumConcurrency: 0, abortReason: "operator-pause" });
  });

  it("executes independent processes at the requested overlap and retains each exact command/log/exit", async () => {
    const { directory, entryPath } = fixture();
    const rows = [0, 1, 2, 3, 4].map((index) => ({ ...POST_PHASE10_SMOKE_ROWS[0], id: `fixture-${index}` }));
    const exits = await launchDiscoveryRows({ campaignDirectory: directory, launchName: "bounded", rows,
      concurrency: 2, entryPath, workerArguments: (row) => [row.id], hardWallSeconds: 10 });
    expect(exits).toHaveLength(5);
    expect(exits.every((exit) => exit.exitCode === 0 && exit.signal === null)).toBe(true);
    expect(read(join(directory, "bounded-complete.json"))).toMatchObject({ actualMaximumConcurrency: 2,
      abortReason: null, unstartedRowIds: [] });
    const intervals = exits.flatMap((exit) => [{ time: Date.parse(exit.startedAt), delta: 1 },
      { time: Date.parse(exit.finishedAt), delta: -1 }]).sort((a, b) => a.time - b.time || a.delta - b.delta);
    let active = 0;
    let actualPeak = 0;
    for (const event of intervals) { active += event.delta; actualPeak = Math.max(actualPeak, active); }
    expect(actualPeak).toBe(2);
    for (const row of rows) {
      const rowDirectory = join(directory, "rows", row.id);
      expect(read(join(rowDirectory, "process.json")).command).toEqual([process.execPath, entryPath, row.id]);
      expect(readFileSync(join(rowDirectory, "stdout.log"), "utf8")).toContain(`stdout:${row.id}`);
      expect(readFileSync(join(rowDirectory, "stderr.log"), "utf8")).toContain(`stderr:${row.id}`);
      expect(read(join(rowDirectory, "exit.json"))).toMatchObject({ rowId: row.id, exitCode: 0 });
    }
  });

  it("refuses to spawn under a failing initial resource sample", async () => {
    const { directory, entryPath } = fixture();
    const rows = [{ ...POST_PHASE10_SMOKE_ROWS[0], id: "unstarted" }];
    const exits = await launchDiscoveryRows({ campaignDirectory: directory, launchName: "low", rows,
      concurrency: 1, entryPath, monitor: { sample: async () => ({ ...safeSample(), availablePhysicalBytes: 1 }) } });
    expect(exits).toEqual([]);
    expect(read(join(directory, "low-complete.json"))).toMatchObject({ actualMaximumConcurrency: 0,
      abortReason: "available-physical-memory-limit", unstartedRowIds: ["unstarted"] });
  });

  it("kills its active workers and leaves queued work unstarted when memory falls", async () => {
    const { directory, entryPath } = fixture();
    const rows = [0, 1, 2].map((index) => ({ ...POST_PHASE10_SMOKE_ROWS[0], id: `slow-${index}` }));
    let samples = 0;
    const exits = await launchDiscoveryRows({ campaignDirectory: directory, launchName: "fall", rows,
      concurrency: 2, entryPath, workerArguments: (row) => [row.id], monitor: { cadenceMs: 30,
        sample: async () => (++samples === 1 ? safeSample() : { ...safeSample(), commitHeadroomBytes: 1 }) } });
    expect(exits).toHaveLength(2);
    expect(exits.every((exit) => exit.termination === "resource-stop")).toBe(true);
    expect(read(join(directory, "fall-complete.json"))).toMatchObject({ abortReason: "commit-headroom-limit",
      unstartedRowIds: ["slow-2"] });
  });

  it("enforces a hard wall budget and stops a failing probe queue", async () => {
    const { directory, entryPath } = fixture();
    const rows = ["slow-first", "never-started"].map((id) => ({ ...POST_PHASE10_SMOKE_ROWS[0], id }));
    const exits = await launchDiscoveryRows({ campaignDirectory: directory, launchName: "timeout", rows,
      concurrency: 1, entryPath, workerArguments: (row) => [row.id], hardWallSeconds: 0.15, stopOnWorkerFailure: true });
    expect(exits).toHaveLength(1);
    expect(exits[0].termination).toBe("hard-wall-budget");
    expect(read(join(directory, "timeout-complete.json"))).toMatchObject({ abortReason: "worker-failure:slow-first",
      unstartedRowIds: ["never-started"] });
  });

  it("retains a crashed worker while allowing independent science rows to continue", async () => {
    const { directory, entryPath } = fixture();
    const rows = ["fail-first", "surviving"].map((id) => ({ ...POST_PHASE10_SMOKE_ROWS[0], id }));
    const exits = await launchDiscoveryRows({ campaignDirectory: directory, launchName: "continue", rows,
      concurrency: 1, entryPath, workerArguments: (row) => [row.id], hardWallSeconds: 10, stopOnWorkerFailure: false });
    expect(exits.map((exit) => exit.exitCode)).toEqual([7, 0]);
    expect(read(join(directory, "continue-complete.json"))).toMatchObject({ abortReason: null, unstartedRowIds: [] });
  });
});

describe("probe selection and binding", () => {
  it("retains actual representative scientific inputs and enough independent jobs for each rung", () => {
    for (const host of ["HIL", "BLD"] as const) {
      const representatives = firstBatchRepresentativeRows(host);
      for (const concurrency of [1, 4, 8, 16]) {
        const rows = firstBatchProbeRows(host, concurrency);
        expect(rows).toHaveLength(Math.max(concurrency, representatives.length));
        expect(new Set(rows.map((row) => row.id)).size).toBe(rows.length);
        representatives.forEach(({ row }, index) => expect(rows[index]).toEqual({ ...row,
          id: `${row.id}--probe-${index}`, maxSteps: 3 }));
      }
    }
    expect(() => parseFirstBatchHost("PC2")).toThrow("HIL or BLD");
  });

  it("requires the same source, host, runtime and roster plus an actually safe completed rung", () => {
    const receipt: FirstBatchProbeReceipt = { schema: "hil-bld-first-batch-probe-v1", batchId: FIRST_BATCH_ID,
      host: "HIL", gitHead: batchGitHead(), node: process.version, v8: process.versions.v8,
      hostIdentity: batchHostIdentity(), rosterSha256: firstBatchRosterSha256("HIL"), recommendedConcurrency: 4,
      rungs: [{ concurrency: 4, qualified: true, directory: "fixture", actualMaximumConcurrency: 4,
        wallSeconds: 10, rowsPerSecond: 0.6, abortReason: null, minimumAvailablePhysicalBytes: 20 * 1024 ** 3,
        minimumCommitHeadroomBytes: 20 * 1024 ** 3, maxSampledChildRssBytes: 1024, rowIds: [] }], limit: "fixture" };
    expect(validateFirstBatchProbeReceipt(receipt, "HIL")).toBe(4);
    expect(() => validateFirstBatchProbeReceipt(receipt, "BLD")).toThrow("different batch or named host");
    for (const mutation of [{ gitHead: "stale" }, { node: "old-node" }, { rosterSha256: "wrong" },
      { hostIdentity: { ...receipt.hostIdentity, hostname: "different-machine" } }, { recommendedConcurrency: 8 },
      { rungs: [{ ...receipt.rungs[0], minimumCommitHeadroomBytes: 1 }] }]) {
      expect(() => validateFirstBatchProbeReceipt({ ...receipt, ...mutation }, "HIL")).toThrow();
    }
    expect(batchMemoryFailure({ ...safeSample(), availablePhysicalBytes: NaN })).toBe("invalid-host-memory-sample");
  });
});

describe("resumable campaign ownership", () => {
  it("refuses duplicate live ownership and releases only its local lock", () => {
    const { directory } = fixture();
    const release = acquireBldCampaignLock(directory);
    expect(() => acquireBldCampaignLock(directory)).toThrow("already running");
    release();
    acquireBldCampaignLock(directory)();
  });

  it("refuses a live orphan worker even without a parent lock", () => {
    const { directory } = fixture();
    const rowDirectory = join(directory, "rows", "orphan");
    const logDirectory = join(rowDirectory, "attempts", "attempt-0001");
    mkdirSync(logDirectory, { recursive: true });
    writeFileSync(join(rowDirectory, "process.json"), JSON.stringify({ pid: process.pid, logDirectory }));
    expect(() => acquireBldCampaignLock(directory)).toThrow("worker still running");
    writeFileSync(join(logDirectory, "exit.json"), "{}");
    acquireBldCampaignLock(directory)();
  });

  it("rejects legacy campaigns and stale immutable source before resume", () => {
    const { directory } = fixture();
    expect(() => validateResumableBldCampaign({ schema: "hil-bld-first-batch-campaign-v1" } as any))
      .toThrow("legacy prefixes have no restart state");
    writeFileSync(join(directory, "campaign.json"), JSON.stringify({ schema: "hil-bld-first-batch-campaign-v1", host: "BLD" }));
    expect(() => requestBldPause(directory)).toThrow("not a resumable BLD campaign");
    const campaign = { schema: "hil-bld-first-batch-campaign-v2", executionMode: "bld-experimental-resume-v1",
      host: "BLD", batchId: FIRST_BATCH_ID, gitHead: batchGitHead(), node: process.version,
      v8: process.versions.v8, rosterSha256: firstBatchRosterSha256("BLD"),
      requestedConcurrency: 16, hostIdentity: batchHostIdentity(), rows: firstBatchRows("BLD").map((entry) => entry.row) };
    expect(() => validateResumableBldCampaign(campaign as any)).not.toThrow();
    for (const mutation of [{ gitHead: "stale" }, { node: "other-runtime" }, { rows: campaign.rows.slice(1) },
      { requestedConcurrency: 29 }, { hostIdentity: { ...campaign.hostIdentity, hostname: "elsewhere" } }]) {
      expect(() => validateResumableBldCampaign({ ...campaign, ...mutation } as any)).toThrow();
    }
    writeFileSync(join(directory, "campaign.json"), JSON.stringify(campaign));
    requestBldPause(directory);
    expect(read(join(directory, "pause-request.json")).reason).toBe("operator-pause");
  });
});
