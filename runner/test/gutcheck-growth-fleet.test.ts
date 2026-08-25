// Growth-fleet job resolution: every job replays its item's pinned record exactly (dims, cap,
// seed, extraction), figs resolve to fig-records and sweeps to gen-records, and the planner
// orders by recorded cost and reports resume state without spawning any solver.

import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { jobForItem, pinnedRecordPath } from "../../scripts/gutcheck-growth-fleet.ts";

const REPO = resolve(import.meta.dirname, "../..");
const SCRIPT = join(REPO, "scripts/gutcheck-growth-fleet.ts");
const roots: string[] = [];

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

const record = {
  spec: { label: "fleet test", rho: 0.1, phi: 0, ggThreshTable: {}, kappa: {}, mu: {} },
  dims: { nx: 64, ny: 64, nz: 16 },
  domain: "hexPrism",
  seed: 7,
  noise: 0,
  tickCap: 500,
  tick: 321,
  attachedCount: 1234,
  elapsedSeconds: 42,
  mesh: { extraction: { spacing: 0.8, sigma: 0.45, normalDelta: 3 } },
};

describe("growth fleet", () => {
  it("maps fig items to fig-records and sweep items to gen-records", () => {
    expect(pinnedRecordPath("fig13", "evidence/gutcheck-gg-realism/fig-records/fig13-record.json"))
      .toBe("evidence/gutcheck-gg-realism/fig-records/fig13-record.json");
    expect(pinnedRecordPath("sweep-t1-r0p1", "evidence/gutcheck-gg-realism/specs/sweep-t1-r0p1.json"))
      .toBe("evidence/gutcheck-gg-realism/gen-records/sweep-t1-r0p1-record.json");
    expect(() => pinnedRecordPath("x", "evidence/other/x.json")).toThrow(/unrecognized/);
  });

  it("builds a job that replays the pinned record exactly", () => {
    const root = mkdtempSync(join(tmpdir(), "growth-fleet-"));
    roots.push(root);
    mkdirSync(join(root, "evidence/gutcheck-gg-realism/gen-records"), { recursive: true });
    writeFileSync(
      join(root, "evidence/gutcheck-gg-realism/gen-records/item-a-record.json"),
      JSON.stringify(record),
    );
    const outDir = join(root, "out");
    mkdirSync(outDir, { recursive: true });
    const job = jobForItem("item-a", "evidence/gutcheck-gg-realism/specs/item-a.json", outDir, root);
    expect(job.recordedSeconds).toBe(42);
    expect(job.expectTick).toBe(321);
    expect(job.expectAttached).toBe(1234);
    const argv = job.argv.join(" ");
    expect(argv).toContain("--dims 64,64,16");
    expect(argv).toContain("--ticks 500");
    expect(argv).toContain("--seed 7");
    expect(argv).toContain("--seed-thickness 1");
    expect(argv).toContain("--spacing 0.8");
    expect(argv).toContain("--expect-tick 321");
    expect(argv).toContain("--expect-attached 1234");
    expect(argv).toContain(join(outDir, "item-a-growth-v1.bin"));
  });

  it("adds state and frame products in scientific mode, with a ~120-frame cadence", () => {
    const root = mkdtempSync(join(tmpdir(), "growth-fleet-"));
    roots.push(root);
    mkdirSync(join(root, "evidence/gutcheck-gg-realism/gen-records"), { recursive: true });
    writeFileSync(
      join(root, "evidence/gutcheck-gg-realism/gen-records/item-a-record.json"),
      JSON.stringify({ ...record, tick: 30000 }),
    );
    const outDir = join(root, "out");
    mkdirSync(outDir, { recursive: true });
    const web = jobForItem("item-a", "evidence/gutcheck-gg-realism/specs/item-a.json", outDir, root);
    expect(web.argv.join(" ")).not.toContain("--out-state");
    const sci = jobForItem(
      "item-a", "evidence/gutcheck-gg-realism/specs/item-a.json", outDir, root, true,
    );
    const argv = sci.argv.join(" ");
    expect(argv).toContain(`--out-state ${join(outDir, "item-a-state.bin")}`);
    expect(argv).toContain(`--frames-dir ${join(outDir, "item-a-frames")}`);
    expect(argv).toContain("--frames-every 250"); // 30000 ticks / 120 frames
  });

  it("refuses a pinned attachedCount above the decoder cap", () => {
    const root = mkdtempSync(join(tmpdir(), "growth-fleet-"));
    roots.push(root);
    mkdirSync(join(root, "evidence/gutcheck-gg-realism/fig-records"), { recursive: true });
    writeFileSync(
      join(root, "evidence/gutcheck-gg-realism/fig-records/big-record.json"),
      JSON.stringify({ ...record, attachedCount: 9 * 1024 * 1024 }),
    );
    expect(() =>
      jobForItem("big", "evidence/gutcheck-gg-realism/fig-records/big-record.json", root, root),
    ).toThrow(/decoder cap/);
  });

  it("plans against the real queue export shape, cheapest first, with resume state", () => {
    const root = mkdtempSync(join(tmpdir(), "growth-fleet-"));
    roots.push(root);
    const outDir = join(root, "out");
    mkdirSync(outDir, { recursive: true });
    // Two real queue items whose pinned records exist in this repository.
    const queue = {
      format: "gutcheck-animation-queue-v1",
      queueId: "fleet-test",
      createdAt: "2026-08-24T00:00:00.000Z",
      sourceIndexGenerated: "2026-08-24T00:00:00.000Z",
      settings: {
        pipeline: "web-turntable-v1",
        look: "glass",
        width: 1080,
        height: 1080,
        fps: 30,
        durationSeconds: 12,
        meshFormat: "gutcheck-mesh-v2q",
        transportEncoding: "gzip",
      },
      items: [
        {
          id: "fig11",
          label: "Fig. 11",
          mesh: "/nas/collections/x/fig11-mesh.bin",
          render: "/gutcheck-figure-previews/fig11.png",
          spec: "evidence/gutcheck-gg-realism/fig-records/fig11-record.json",
        },
        {
          id: "sweep-t1-r0p1",
          label: "sweep",
          mesh: "/nas/collections/x/sweep-t1-r0p1-mesh.bin",
          render: "/gutcheck-figure-previews/sweep-t1-r0p1.png",
          spec: "evidence/gutcheck-gg-realism/specs/sweep-t1-r0p1.json",
        },
      ],
    };
    const queuePath = join(root, "queue.json");
    writeFileSync(queuePath, JSON.stringify(queue));
    // fig11 already "done": both identity files exist.
    writeFileSync(join(outDir, "fig11-growth-v1.bin"), "x");
    writeFileSync(join(outDir, "fig11-record.json"), "{}");
    const output = execFileSync(
      process.execPath,
      [SCRIPT, "plan", "--queue", queuePath, "--out-dir", outDir],
      { cwd: REPO, encoding: "utf8" },
    );
    const lines = output.trim().split(/\r?\n/);
    // fig11 recorded 351 s, the sweep 13664 s: longest first means the sweep leads.
    expect(lines[0]).toMatch(/^pending sweep-t1-r0p1/);
    expect(lines[1]).toMatch(/^done +fig11/);
    expect(lines[2]).toMatch(/pending recorded compute/);
  });
});
