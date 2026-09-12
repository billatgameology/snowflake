import { describe, expect, it } from "vitest";

import {
  animationQueueIdFromName,
  DEFAULT_ANIMATION_QUEUE_SETTINGS,
  parseAnimationQueueManifest,
  stringifyAnimationQueueManifest,
  type AnimationQueueManifest,
} from "../src/gutcheck-animation-queue.ts";
import { partitionAnimationQueue } from "../../scripts/gutcheck-animation-queue.ts";

const manifest = (): AnimationQueueManifest => ({
  format: "gutcheck-animation-queue-v1",
  queueId: "favorite-flakes",
  createdAt: "2026-08-23T12:00:00.000Z",
  sourceIndexGenerated: "2026-08-23T11:00:00.000Z",
  settings: DEFAULT_ANIMATION_QUEUE_SETTINGS,
  items: ["bentley785", "staged-branch1-to-plate3-at8000", "staged-branch1-to-plate3-at12000"]
    .sort()
    .map((id) => ({
      id,
      label: `label ${id}`,
      mesh: `/nas/collections/gutcheck-generated-public/2026-08-15/payload/large/gen/${id}-mesh.bin`,
      render: `/nas/collections/gutcheck-generated-public/2026-08-15/payload/gen/renders/${id}-render.png`,
      spec: `evidence/gutcheck-gg-realism/specs/${id}.json`,
    })),
});

describe("gut-check animation queue schema", () => {
  it("round-trips the strict portable manifest", () => {
    const value = manifest();
    expect(parseAnimationQueueManifest(JSON.parse(stringifyAnimationQueueManifest(value)))).toEqual(value);
    expect(animationQueueIdFromName("  My Favorite Snowflakes!  ")).toBe("my-favorite-snowflakes");
  });

  it("rejects unknown keys, duplicates, unsorted items, and identity drift", () => {
    expect(() => parseAnimationQueueManifest({ ...manifest(), unchecked: true })).toThrow(
      /keys must be exactly/u,
    );

    const duplicate = structuredClone(manifest()) as unknown as { items: Array<Record<string, unknown>> };
    duplicate.items[1] = structuredClone(duplicate.items[0]!);
    expect(() => parseAnimationQueueManifest(duplicate)).toThrow(/duplicated/u);

    const unsorted = structuredClone(manifest()) as unknown as { items: Array<Record<string, unknown>> };
    unsorted.items.reverse();
    expect(() => parseAnimationQueueManifest(unsorted)).toThrow(/sorted by id/u);

    const drift = structuredClone(manifest()) as unknown as { items: Array<Record<string, unknown>> };
    drift.items[0]!.spec = "evidence/gutcheck-gg-realism/specs/someone-else.json";
    expect(() => parseAnimationQueueManifest(drift)).toThrow(/tracked source identity/u);
  });

  it("accepts a regenerated figure preview with its tracked figure record", () => {
    const value = manifest();
    const figure = {
      id: "fig10",
      label: "Fig. 10",
      mesh: "/nas/collections/gutcheck-generated-public/2026-08-15/payload/large/figs/fig10-mesh.bin",
      render: "/gutcheck-figure-previews/fig10.png",
      spec: "evidence/gutcheck-gg-realism/fig-records/fig10-record.json",
    };
    const withFigure = {
      ...value,
      items: [...value.items, figure].sort((left, right) => left.id.localeCompare(right.id)),
    };
    expect(parseAnimationQueueManifest(withFigure).items).toContainEqual(figure);
  });

  it("partitions sorted IDs round-robin without overlap or omission", () => {
    const queue = manifest();
    const batches = partitionAnimationQueue(queue, 2, "selection.json", "2026-08-23T13:00:00.000Z");
    expect(batches.map((batch) => batch.batch.label)).toEqual(["batch-a", "batch-b"]);
    const assigned = batches.flatMap((batch) => batch.items.map((item) => item.id));
    expect(new Set(assigned).size).toBe(queue.items.length);
    expect([...assigned].sort()).toEqual(queue.items.map((item) => item.id));
    expect(batches[0]!.items.map((item) => item.id)).toEqual([queue.items[0]!.id, queue.items[2]!.id]);
    expect(batches[1]!.items.map((item) => item.id)).toEqual([queue.items[1]!.id]);
  });
});
