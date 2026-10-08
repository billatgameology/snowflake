import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { batchGitHead, batchHostIdentity } from "../src/hil-bld-batch-execution.ts";
import { acquireFirstBatchLease, firstBatchRosterSha256, planFirstBatchResume,
  validateFirstBatchCampaignReceipt, type FirstBatchCampaignReceipt,
  type FirstBatchProbeReceipt } from "../src/hil-bld-batch-main.ts";
import { FIRST_BATCH_ID, firstBatchRows } from "../src/hil-bld-batch-roster.ts";
import { POST_PHASE10_SMOKE_ROWS, runPostPhase10DiscoveryRow } from "../src/post-phase10-discovery.ts";
import { withDiscoveryLeaseUpdate } from "../src/discovery-resume-io.ts";

const temporary: string[] = [];
afterEach(() => { for (const path of temporary.splice(0)) rmSync(path, { recursive: true, force: true }); });
function directory() {
  const path = mkdtempSync(join(tmpdir(), "vcc-batch-resume-"));
  temporary.push(path);
  return path;
}
const json = (path: string, value: unknown): void => writeFileSync(path, JSON.stringify(value));

function bindings() {
  const receipt: FirstBatchProbeReceipt = { schema: "hil-bld-first-batch-probe-v1", batchId: FIRST_BATCH_ID,
    host: "HIL", gitHead: batchGitHead(), node: process.version, v8: process.versions.v8,
    hostIdentity: batchHostIdentity(), rosterSha256: firstBatchRosterSha256("HIL"), recommendedConcurrency: 4,
    rungs: [{ concurrency: 4, qualified: true, directory: "fixture", actualMaximumConcurrency: 4,
      wallSeconds: 10, rowsPerSecond: 0.6, abortReason: null, minimumAvailablePhysicalBytes: 20 * 1024 ** 3,
      minimumCommitHeadroomBytes: 20 * 1024 ** 3, maxSampledChildRssBytes: 1024, rowIds: [] }], limit: "fixture" };
  const receiptBytes = Buffer.from(JSON.stringify(receipt));
  const campaign: FirstBatchCampaignReceipt = { schema: "hil-bld-first-batch-campaign-v2", batchId: FIRST_BATCH_ID,
    checkpointFormat: "discovery-resume-v1", host: "HIL", gitHead: receipt.gitHead, node: receipt.node,
    v8: receipt.v8, hostIdentity: receipt.hostIdentity, rosterSha256: receipt.rosterSha256,
    probeReceiptSha256: createHash("sha256").update(receiptBytes).digest("hex"),
    requestedConcurrency: 4, rows: firstBatchRows("HIL").map(({ row }) => row) };
  return { campaign, receiptBytes };
}

describe("explicit first-batch resume", () => {
  it("binds resume to the original checkpointed campaign, exact probe, host, source, runtime and rows", () => {
    const { campaign, receiptBytes } = bindings();
    expect(validateFirstBatchCampaignReceipt(campaign, "HIL", receiptBytes)).toBe(4);
    for (const mutation of [
      { schema: "hil-bld-first-batch-campaign-v1" }, { checkpointFormat: "old" }, { host: "BLD" },
      { gitHead: "different" }, { node: "different" }, { v8: "different" },
      { hostIdentity: { ...campaign.hostIdentity, hostname: "other-machine" } },
      { rosterSha256: "wrong" }, { probeReceiptSha256: "wrong" }, { requestedConcurrency: 8 },
      { rows: campaign.rows.slice(1) }, { rows: [{ ...campaign.rows[0], targetExtent: 99 }, ...campaign.rows.slice(1)] },
    ]) expect(() => validateFirstBatchCampaignReceipt({ ...campaign, ...mutation } as FirstBatchCampaignReceipt,
      "HIL", receiptBytes)).toThrow();
    expect(() => validateFirstBatchCampaignReceipt(campaign, "HIL", Buffer.from(`${receiptBytes}\n`)))
      .toThrow("probe binding");
  });

  it("refuses a second live coordinator and records recovery from an actually exited owner", () => {
    const path = directory();
    const release = acquireFirstBatchLease(path);
    expect(() => acquireFirstBatchLease(path)).toThrow("still running");
    release();
    const former = spawnSync(process.execPath, ["-e", "process.exit(0)"], { windowsHide: true });
    expect(former.status).toBe(0);
    json(join(path, "campaign-owner.json"), { pid: former.pid, token: "old-attempt" });
    const releaseRecovered = acquireFirstBatchLease(path);
    expect(JSON.parse(readFileSync(join(path, "campaign-owner.json"), "utf8")))
      .toMatchObject({ pid: process.pid, recoveredOwner: { pid: former.pid, token: "old-attempt" } });
    releaseRecovered();
  });

  it("cannot inspect or replace a stale owner while another invocation holds its acquisition guard", () => {
    const path = directory();
    const former = spawnSync(process.execPath, ["-e", "process.exit(0)"], { windowsHide: true });
    expect(former.status).toBe(0);
    const ownerPath = join(path, "campaign-owner.json");
    json(ownerPath, { pid: former.pid, token: "stale" });
    const original = readFileSync(ownerPath);
    withDiscoveryLeaseUpdate(ownerPath, () => {
      expect(() => acquireFirstBatchLease(path)).toThrow();
      expect(readFileSync(ownerPath)).toEqual(original);
    });
    const release = acquireFirstBatchLease(path);
    expect(JSON.parse(readFileSync(ownerPath, "utf8")).pid).toBe(process.pid);
    release();
  });

  it("skips an independently checked completed row and retains both unfinished and unstarted work", () => {
    const path = directory();
    const finished = { ...POST_PHASE10_SMOKE_ROWS[0], id: "finished" };
    const interrupted = { ...POST_PHASE10_SMOKE_ROWS[0], id: "interrupted", targetExtent: 100 };
    const unstarted = { ...POST_PHASE10_SMOKE_ROWS[0], id: "unstarted" };
    const finishedPath = join(path, "rows", finished.id);
    runPostPhase10DiscoveryRow(finished, finishedPath);
    json(join(finishedPath, "exit.json"), { exitCode: 0, signal: null });
    const interruptedPath = join(path, "rows", interrupted.id);
    mkdirSync(join(interruptedPath, "resume"), { recursive: true });
    json(join(interruptedPath, "spec.json"), { row: interrupted });
    // Selection only observes the pointer; the actual row resume validates its bound bytes.
    json(join(interruptedPath, "resume", "latest.json"), { fixture: "not decoded by selection" });
    expect(planFirstBatchResume(path, [finished, interrupted, unstarted])).toEqual({
      skippedRowIds: [finished.id], pending: [
        { row: interrupted, command: "resume-row" }, { row: unstarted, command: "run-row" },
      ],
    });
    json(join(finishedPath, "exit.json"), { exitCode: 1, signal: null });
    expect(() => planFirstBatchResume(path, [finished])).toThrow("no committed resume checkpoint");
  });

  it("refuses completed-output corruption, wrong row, missing state and an orphaned live worker", () => {
    const path = directory();
    const row = { ...POST_PHASE10_SMOKE_ROWS[0], id: "checked" };
    const rowPath = join(path, "rows", row.id);
    const result = runPostPhase10DiscoveryRow(row, rowPath);
    json(join(rowPath, "exit.json"), { exitCode: 0, signal: null });
    json(join(rowPath, "result.json"), { ...result, cycles: result.cycles + 1, admissible: true });
    expect(() => planFirstBatchResume(path, [row])).toThrow("invalid completed evidence");
    json(join(rowPath, "result.json"), { ...result, stopReason: "solver-error" });
    expect(() => planFirstBatchResume(path, [row])).toThrow("requiring review");
    rmSync(join(rowPath, "result.json"));
    expect(() => planFirstBatchResume(path, [row])).toThrow("no committed resume checkpoint");
    json(join(rowPath, "spec.json"), { row: { ...row, tempC: -12 } });
    expect(() => planFirstBatchResume(path, [row])).toThrow("persisted spec");
    json(join(rowPath, "process.json"), { pid: process.pid });
    expect(() => planFirstBatchResume(path, [row])).toThrow("live worker");
  });

  it("retries a bootstrap-only directory through the resume producer without treating it as completed science", () => {
    const path = directory();
    const row = POST_PHASE10_SMOKE_ROWS[0];
    const rowPath = join(path, "rows", row.id);
    mkdirSync(rowPath, { recursive: true });
    json(join(rowPath, "spec.json"), { row });
    writeFileSync(join(rowPath, "events.jsonl"), "");
    expect(planFirstBatchResume(path, [row])).toEqual({ skippedRowIds: [], pending: [{ row, command: "resume-row" }] });
  });

  it.each(['{"schema":', '{"schema":"post-phase10-discovery-result-v1"}'])(
    "routes interrupted terminal publication to checkpoint recovery: %s", (partial) => {
      const path = directory();
      const row = POST_PHASE10_SMOKE_ROWS[0];
      const rowPath = join(path, "rows", row.id);
      runPostPhase10DiscoveryRow(row, rowPath, { checkpoint: "create" });
      writeFileSync(join(rowPath, "result.json"), partial);
      expect(planFirstBatchResume(path, [row])).toEqual({ skippedRowIds: [], pending: [{ row, command: "resume-row" }] });
      // Selection preserves the bytes; the row producer owns validated recovery and tail custody.
      expect(readFileSync(join(rowPath, "result.json"), "utf8")).toBe(partial);
      rmSync(join(rowPath, "resume", "latest.json"));
      expect(() => planFirstBatchResume(path, [row])).toThrow();
    });

  it.each(['{"exitCode":', '{"exitCode":0}'])(
    "routes interrupted exit publication to checkpoint recovery: %s", (partial) => {
      const path = directory();
      const row = POST_PHASE10_SMOKE_ROWS[0];
      const rowPath = join(path, "rows", row.id);
      runPostPhase10DiscoveryRow(row, rowPath, { checkpoint: "create" });
      writeFileSync(join(rowPath, "exit.json"), partial);
      expect(planFirstBatchResume(path, [row])).toEqual({ skippedRowIds: [], pending: [{ row, command: "resume-row" }] });
      expect(readFileSync(join(rowPath, "exit.json"), "utf8")).toBe(partial);
      rmSync(join(rowPath, "resume", "latest.json"));
      expect(() => planFirstBatchResume(path, [row])).toThrow();
    });
});
