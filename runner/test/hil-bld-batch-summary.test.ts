import { appendFileSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { POST_PHASE10_SMOKE_ROWS, runPostPhase10DiscoveryRow } from "../src/post-phase10-discovery.ts";
import { runResumableDiscoveryRow } from "../src/post-phase10-discovery-resume.ts";
import { summarizeFirstBatch, summarizeFirstBatchRow } from "../src/hil-bld-batch-summary.ts";

const directories: string[] = [];
function directory() {
  const path = mkdtempSync(join(tmpdir(), "vcc-first-batch-summary-"));
  directories.push(path);
  return path;
}
afterEach(() => { for (const path of directories.splice(0)) rmSync(path, { recursive: true, force: true }); });

describe("first-batch coverage inventory", () => {

  it("shows a paused checkpoint prefix without treating an uncommitted tail as science", async () => {
    const path = directory();
    const row = { ...POST_PHASE10_SMOKE_ROWS[1], targetExtent: 100, maxSteps: 1 };
    await runResumableDiscoveryRow(row, path);
    appendFileSync(join(path, "events.jsonl"), '{"cycle":2');
    expect(summarizeFirstBatchRow(path)).toMatchObject({
      disposition: "unresolved-prefix", stopReason: "step-review", completedUpdates: 1,
      resumableState: "paused", checkpointCycle: 1, errors: [],
    });
    const pointer = JSON.parse(readFileSync(join(path, "resume-current.json"), "utf8"));
    const checkpoint = join(path, "resume", "slot-" + pointer.slot + ".bin");
    const bytes = readFileSync(checkpoint); bytes[bytes.length - 1] ^= 1; writeFileSync(checkpoint, bytes);
    const failed = summarizeFirstBatchRow(path);
    expect(failed.disposition).toBe("invalid");
    expect(failed.errors.join(" ")).toContain("resume bytes mismatch");
  });

  it("rederives endpoint coverage from real events and refuses a forged success flag", () => {
    const path = directory();
    const result = runPostPhase10DiscoveryRow(POST_PHASE10_SMOKE_ROWS[0], path);
    writeFileSync(join(path, "exit.json"), JSON.stringify({ exitCode: 0, signal: null }));
    expect(summarizeFirstBatchRow(path)).toMatchObject({ disposition: "size-endpoint", completedUpdates: 1 });
    writeFileSync(join(path, "result.json"), JSON.stringify({ ...result, cycles: 2, admissible: true }));
    expect(summarizeFirstBatchRow(path)).toMatchObject({ disposition: "invalid" });
  });

  it("keeps valid step-capped work unresolved and rejects a corrupted numerical report", () => {
    const path = directory();
    runPostPhase10DiscoveryRow({ ...POST_PHASE10_SMOKE_ROWS[0], targetExtent: 100, maxSteps: 1 }, path);
    writeFileSync(join(path, "exit.json"), JSON.stringify({ exitCode: 0, signal: null }));
    expect(summarizeFirstBatchRow(path)).toMatchObject({ disposition: "unresolved-prefix", completedUpdates: 1 });
    const event = JSON.parse(readFileSync(join(path, "events.jsonl"), "utf8"));
    event.relaxation.converged = false;
    writeFileSync(join(path, "events.jsonl"), `${JSON.stringify(event)}\n`);
    expect(summarizeFirstBatchRow(path)).toMatchObject({ disposition: "invalid", completedUpdates: 0 });
  });

  it("retains only the consecutive complete prefix after truncated output", () => {
    const path = directory();
    runPostPhase10DiscoveryRow(POST_PHASE10_SMOKE_ROWS[0], path);
    rmSync(join(path, "result.json"));
    const events = readFileSync(join(path, "events.jsonl"), "utf8");
    writeFileSync(join(path, "events.jsonl"), `${events}{"cycle":2`);
    const summary = summarizeFirstBatchRow(path);
    expect(summary.completedUpdates).toBe(1);
    expect(summary.disposition).toBe("invalid");
    expect(summary.errors).toHaveLength(1);
  });

  it("lists unstarted campaign rows instead of silently dropping them", () => {
    const path = directory();
    writeFileSync(join(path, "campaign.json"), JSON.stringify({ rows: POST_PHASE10_SMOKE_ROWS }));
    const summary = summarizeFirstBatch(path);
    expect(summary.rows).toHaveLength(POST_PHASE10_SMOKE_ROWS.length);
    expect(summary.rows.every((row) => row.disposition === "unresolved-prefix")).toBe(true);
  });

  it("enforces the row's fill limit independently of a producer success flag", () => {
    const path = directory();
    runPostPhase10DiscoveryRow(POST_PHASE10_SMOKE_ROWS[0], path);
    writeFileSync(join(path, "exit.json"), JSON.stringify({ exitCode: 0, signal: null }));
    const event = JSON.parse(readFileSync(join(path, "events.jsonl"), "utf8"));
    event.surface.maxKineticFillIncrement = 1;
    writeFileSync(join(path, "events.jsonl"), `${JSON.stringify(event)}\n`);
    expect(summarizeFirstBatchRow(path).errors).toContain("kinetic fill exceeds registered CFL");
  });

  it.each(["residual", "deltaTimeSeconds"])("validates %s even if a parent kill lost result.json", (key) => {
    const path = directory();
    runPostPhase10DiscoveryRow(POST_PHASE10_SMOKE_ROWS[0], path);
    rmSync(join(path, "result.json"));
    expect(summarizeFirstBatchRow(path)).toMatchObject({ disposition: "unresolved-prefix", completedUpdates: 1 });
    const event = JSON.parse(readFileSync(join(path, "events.jsonl"), "utf8"));
    if (key === "residual") event.relaxation.residual = 1;
    else event.surface.deltaTimeSeconds = -1;
    writeFileSync(join(path, "events.jsonl"), `${JSON.stringify(event)}\n`);
    expect(summarizeFirstBatchRow(path)).toMatchObject({ disposition: "invalid", completedUpdates: 0 });
  });
});
