import { createHash } from "node:crypto";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { parseGrowthSceneV1 } from "../../app/src/growth-scene.ts";
import {
  buildFinalComposeScenes,
  loadFinalComposePlan,
} from "../../scripts/named-crystal-final-compose.ts";

const REPO = resolve(import.meta.dirname, "../..");
const MANIFEST = resolve(REPO, "docs", "named-snow-crystal-final-compose.json");
const CATALOG = resolve(REPO, "docs", "named-snow-crystal-catalog.json");
const roots: string[] = [];

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

const encodeGrowth = (): Uint8Array => {
  const events = [[1, 0], [2, 0], [3, 5], [7, 20]] as const;
  const header = new TextEncoder().encode(JSON.stringify({
    format: "gutcheck-growth-v1",
    eventCount: events.length,
    attachedCount: events.length,
    seedCount: 2,
    finalTick: 20,
    config: { dims: { nx: 4, ny: 4, nz: 2 }, center: [2, 2, 1] },
  }));
  const bytes = new Uint8Array(4 + header.length + events.length * 8);
  const view = new DataView(bytes.buffer);
  view.setUint32(0, header.length, true);
  bytes.set(header, 4);
  for (const [index, [flat, tick]] of events.entries()) {
    view.setUint32(4 + header.length + index * 8, flat, true);
    view.setUint32(4 + header.length + index * 8 + 4, tick, true);
  }
  return bytes;
};

const fixture = (): { manifest: string; outRoot: string } => {
  const root = mkdtempSync(join(tmpdir(), "named-final-compose-"));
  roots.push(root);
  const componentPath = join(root, "component-growth-v1.bin");
  const component = encodeGrowth();
  writeFileSync(componentPath, component);
  const componentSha = createHash("sha256").update(component).digest("hex");
  const directReviewPath = join(root, "direct-review.json");
  const componentTypes = [
    "simple-stars",
    "isolated-bullets",
    "hexagonal-plates",
    "stellar-dendrites",
    "capped-columns",
    "solid-columns",
    "stellar-plates",
    "simple-needles",
    "simple-prisms",
  ];
  writeFileSync(directReviewPath, JSON.stringify({
    format: "named-crystal-final-direct-review-v1",
    families: componentTypes.map((typeId) => ({
      typeId,
      status: "accepted",
      variants: [{
        slot: "baseline",
        entryId: `${typeId}-baseline`,
        webAsset: { path: componentPath, byteLength: component.byteLength, sha256: componentSha },
        scientificBundle: { locator: `fixture:${typeId}`, identitySha256: "b".repeat(64) },
      }],
    })),
  }));
  const wire = JSON.parse(readFileSync(MANIFEST, "utf8")) as Record<string, unknown>;
  wire.catalog = CATALOG;
  wire.directReview = directReviewPath;
  wire.outRoot = join(root, "out");
  const manifest = join(root, "manifest.json");
  writeFileSync(manifest, JSON.stringify(wire));
  return { manifest, outRoot: wire.outRoot as string };
};

describe("named crystal final Compose production", () => {
  it("registers 11 one-driver trios and waits for the consolidated direct review", () => {
    const plan = loadFinalComposePlan();
    expect(plan.entries).toHaveLength(33);
    expect(new Set(plan.entries.map(({ typeId }) => typeId))).toHaveLength(11);
    for (const typeId of new Set(plan.entries.map(({ typeId }) => typeId))) {
      expect(plan.entries.filter((entry) => entry.typeId === typeId).map(({ slot }) => slot))
        .toEqual(["lower", "baseline", "upper"]);
    }
    expect(plan.routeChangesOnAcceptance).toEqual(["multiply-capped-columns", "needle-clusters"]);
    expect(plan.directReviewReady).toBe(false);
    expect(existsSync(plan.outRoot)).toBe(false);
  });

  it("fails closed when materialization is attempted before direct acceptance", () => {
    const plan = loadFinalComposePlan();
    expect(() => buildFinalComposeScenes(plan)).toThrow(/final direct review is not ready/);
  });

  it("builds, strictly parses, decoder-checks, and inventories all 33 scenes", () => {
    const { manifest, outRoot } = fixture();
    const plan = loadFinalComposePlan(manifest, outRoot, REPO);
    expect(plan.directReviewReady).toBe(true);
    const result = buildFinalComposeScenes(plan);
    expect(result.completed).toBe(33);
    expect(result.results).toHaveLength(33);
    const report = JSON.parse(readFileSync(result.reportPath, "utf8")) as {
      readonly completed: number;
      readonly failed: number;
      readonly results: readonly {
        readonly entryId: string;
        readonly coldWebPayloadBytes: number;
        readonly actualComponentDecoder: string;
        readonly scene: { readonly path: string };
      }[];
    };
    expect(report.completed).toBe(33);
    expect(report.failed).toBe(0);
    for (const entry of report.results) {
      expect(entry.coldWebPayloadBytes).toBeLessThan(20_000_000);
      expect(entry.actualComponentDecoder).toBe("decodeGrowthAssetV1");
      const scene = parseGrowthSceneV1(JSON.parse(readFileSync(resolve(REPO, entry.scene.path), "utf8")));
      expect(scene.disclosure).toBe("composed-visualization");
      expect(scene.components.length).toBeGreaterThanOrEqual(2);
      expect(existsSync(join(dirname(resolve(REPO, entry.scene.path)), "scientific-scene-bundle.json"))).toBe(true);
    }
  });
});

function dirname(path: string): string {
  return resolve(path, "..");
}
