import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import {
  DEFAULT_ANIMATION_QUEUE_SETTINGS,
  stringifyAnimationQueueManifest,
  type AnimationQueueManifest,
} from "../../app/src/gutcheck-animation-queue.ts";

const REPO = resolve(import.meta.dirname, "../..");
const SCRIPT = join(REPO, "scripts/gutcheck-animation-queue.ts");
const roots: string[] = [];

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe("gut-check animation queue CLI", () => {
  it("plans portable A/B manifests and dry-runs both workers", () => {
    const root = mkdtempSync(join(tmpdir(), "gutcheck-animation-cli-"));
    roots.push(root);
    const ids = [
      "bentley785",
      "staged-branch1-to-plate3-at8000",
      "staged-branch1-to-plate3-at12000",
    ].sort();
    const queue: AnimationQueueManifest = {
      format: "gutcheck-animation-queue-v1",
      queueId: "cli-fixture",
      createdAt: "2026-08-23T12:00:00.000Z",
      sourceIndexGenerated: "2026-08-23T11:00:00.000Z",
      settings: DEFAULT_ANIMATION_QUEUE_SETTINGS,
      items: ids.map((id) => ({
        id,
        label: `label ${id}`,
        mesh: `/nas/collections/gutcheck-generated-public/2026-08-15/payload/large/gen/${id}-mesh.bin`,
        render: `/nas/collections/gutcheck-generated-public/2026-08-15/payload/gen/renders/${id}-render.png`,
        spec: `evidence/gutcheck-gg-realism/specs/${id}.json`,
      })),
    };
    const queuePath = join(root, "selection.json");
    const outDir = join(root, "planned");
    writeFileSync(queuePath, stringifyAnimationQueueManifest(queue));

    const output = execFileSync(
      process.execPath,
      [SCRIPT, "plan", "--queue", queuePath, "--batches", "2", "--out-dir", outDir],
      { cwd: REPO, encoding: "utf8" },
    );
    expect(output).toContain("batch-a: 2 item(s)");
    expect(output).toContain("batch-b: 1 item(s)");
    expect(existsSync(join(outDir, "RUN-batch-a.cmd"))).toBe(true);
    expect(readFileSync(join(outDir, "RUN-batch-b.sh"), "utf8")).toContain("--nas-stage");

    const batches = ["batch-a", "batch-b"].map((label) =>
      JSON.parse(readFileSync(join(outDir, `${label}.json`), "utf8")) as {
        items: Array<{ id: string }>;
      },
    );
    const assigned = batches.flatMap((batch) => batch.items.map((item) => item.id));
    expect(new Set(assigned).size).toBe(ids.length);
    expect([...assigned].sort()).toEqual(ids);

    for (const label of ["batch-a", "batch-b"]) {
      const dryRun = execFileSync(
        process.execPath,
        [SCRIPT, "run", "--batch", join(outDir, `${label}.json`), "--dry-run"],
        { cwd: REPO, encoding: "utf8" },
      );
      expect(dryRun).toContain("would render");
    }

    const refused = spawnSync(
      process.execPath,
      [
        SCRIPT,
        "run",
        "--batch",
        join(outDir, "batch-a.json"),
        "--dry-run",
        "--output-root",
        join(root, "unscoped-worker-output"),
      ],
      { cwd: REPO, encoding: "utf8" },
    );
    expect(refused.status).not.toBe(0);
    expect(refused.stderr).toMatch(/non-local output requires|NAS output must stay below/u);
  });
});
