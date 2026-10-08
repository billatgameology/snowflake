import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { batchGitHead, batchHostIdentity, batchMemoryFailure, launchDiscoveryRows,
  type BatchHostSample } from "../src/hil-bld-batch-execution.ts";
import { completedProbePrefix, firstBatchProbeRows, firstBatchRosterSha256, parseFirstBatchHost,
  validateFirstBatchProbeReceipt, type FirstBatchProbeReceipt } from "../src/hil-bld-batch-main.ts";
import { FIRST_BATCH_ID, firstBatchRepresentativeRows } from "../src/hil-bld-batch-roster.ts";
import { POST_PHASE10_SMOKE_ROWS, runPostPhase10DiscoveryRow } from "../src/post-phase10-discovery.ts";

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

describe("checkpointed attempt records", () => {
  it("preserves each resumed process attempt and refuses accidental reuse of its logs", async () => {
    const { directory, entryPath } = fixture();
    const rows = [{ ...POST_PHASE10_SMOKE_ROWS[0], id: "checkpointed" }];
    const common = { campaignDirectory: directory, rows, concurrency: 1, entryPath,
      workerArguments: (row: typeof rows[number]) => [row.id] };
    await launchDiscoveryRows({ ...common, launchName: "initial", attemptName: "initial" });
    const initialPath = join(directory, "rows", rows[0].id, "attempts", "initial");
    const original = ["process.json", "stdout.log", "stderr.log", "exit.json"]
      .map((leaf) => readFileSync(join(initialPath, leaf)));
    await expect(launchDiscoveryRows({ ...common, launchName: "accidental" })).rejects.toThrow("row directory already exists");
    const exits = await launchDiscoveryRows({ ...common, launchName: "resume-one",
      attemptName: "resume-one", resumeExistingRows: true });
    expect(exits[0].exitCode).toBe(0);
    expect(read(join(directory, "resume-one-launch.json"))).not.toHaveProperty("hardWallSeconds");
    expect(read(join(directory, "rows", rows[0].id, "process.json"))).toMatchObject({ attemptName: "resume-one" });
    expect(read(join(directory, "rows", rows[0].id, "exit.json"))).toMatchObject({ attemptName: "resume-one", exitCode: 0 });
    ["process.json", "stdout.log", "stderr.log", "exit.json"].forEach((leaf, index) =>
      expect(readFileSync(join(initialPath, leaf))).toEqual(original[index]));
    await expect(launchDiscoveryRows({ ...common, launchName: "duplicate-attempt",
      attemptName: "resume-one", resumeExistingRows: true })).rejects.toThrow("row attempt already exists");
  });
});

describe("probe selection and binding", () => {
  it("qualifies actual completed prefixes only when the checkpointed producer wrote its restart pointer", () => {
    const { directory } = fixture();
    const row = { ...POST_PHASE10_SMOKE_ROWS[0], id: "checkpoint-probe", maxSteps: 3, targetExtent: 100 };
    const result = runPostPhase10DiscoveryRow(row, directory, { checkpoint: "create" });
    expect(result.stopReason).toBe("step-cap");
    const exit = { rowId: row.id, exitCode: 0, signal: null,
      startedAt: result.startedAt, finishedAt: result.finishedAt, wallSeconds: result.wallSeconds };
    expect(completedProbePrefix(directory, exit)).toBe(true);
    rmSync(join(directory, "resume", "latest.json"));
    expect(completedProbePrefix(directory, exit)).toBe(false);
  });

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
