import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative, resolve } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { growthSceneColdPayloadBytes, parseGrowthSceneV1 } from "../../app/src/growth-scene.ts";
import { parseNamedCrystalCatalog, summarizeNamedCrystalCatalog } from "../../scripts/named-crystal-catalog.ts";
import { acceptFinalComposeCatalog } from "../../scripts/named-crystal-final-compose-accept.ts";

const REPO = resolve(import.meta.dirname, "../..");
const SOURCE_CATALOG = join(REPO, "docs", "named-snow-crystal-catalog.json");
const COMPOSE_MANIFEST = join(REPO, "docs", "named-snow-crystal-final-compose.json");
const SLOTS = ["lower", "baseline", "upper"] as const;
const ROUTE_CHANGES = ["multiply-capped-columns", "needle-clusters"] as const;
const VIEWS = [
  { id: "face", tiltDegrees: 0, yawDegrees: 0 },
  { id: "oblique", tiltDegrees: 55, yawDegrees: 15 },
  { id: "axial", tiltDegrees: 85, yawDegrees: 0 },
] as const;
const STAGES = [
  { id: "start", fraction: 0 },
  { id: "middle", fraction: 0.55 },
  { id: "final", fraction: 1 },
] as const;
const roots: string[] = [];

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

const sha256 = (bytes: Uint8Array | string): string => createHash("sha256").update(bytes).digest("hex");
const writeJson = (path: string, value: unknown): void => writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
const identity = (repo: string, path: string) => {
  const bytes = readFileSync(path);
  return { path: relative(repo, path), byteLength: bytes.byteLength, sha256: sha256(bytes) };
};

interface FixtureOptions {
  readonly missingCapture?: boolean;
  readonly coldFailure?: boolean;
  readonly prematureRoute?: boolean;
}

interface Fixture {
  readonly root: string;
  readonly decisions: string;
  readonly catalog: string;
  readonly table: string;
  readonly review: string;
  readonly report: string;
  readonly firstCapture: string;
}

const fixture = (options: FixtureOptions = {}): Fixture => {
  const root = mkdtempSync(join(tmpdir(), "named-final-compose-accept-"));
  roots.push(root);
  const catalog = join(root, "catalog.json");
  const table = join(root, "catalog.md");
  const review = join(root, "compose-review.json");
  const rawCatalog = JSON.parse(readFileSync(SOURCE_CATALOG, "utf8")) as {
    entries: Array<Record<string, unknown>>;
  };
  for (const entry of rawCatalog.entries) {
    if ((entry.route === "gg" || entry.route === "gg-plus") && !ROUTE_CHANGES.includes(
      entry.id as (typeof ROUTE_CHANGES)[number],
    )) {
      const variants = entry.variants as Record<string, unknown>;
      for (const slot of SLOTS) {
        variants[slot] = {
          entryId: `direct-${String(entry.id)}-${slot}`,
          variation: { driver: "rho-scale", value: 1, unit: "multiplier" },
          links: {
            preview: `out/direct-${String(entry.id)}-${slot}.png`,
            webAsset: `out/direct-${String(entry.id)}-${slot}.bin`,
            recipeOrScene: `out/direct-${String(entry.id)}-${slot}.json`,
            scientificBundle: `out/direct-${String(entry.id)}-${slot}/`,
          },
          webPayloadBytes: 1,
        };
      }
    }
  }
  if (options.prematureRoute === true) {
    rawCatalog.entries.find(({ id }) => id === "multiply-capped-columns")!.route = "compose";
  }
  writeJson(catalog, rawCatalog);

  const manifest = JSON.parse(readFileSync(COMPOSE_MANIFEST, "utf8")) as {
    readonly families: readonly {
      readonly typeId: string;
      readonly pattern: string;
      readonly driver: string;
      readonly unit: string;
      readonly values: readonly [number, number, number];
    }[];
  };
  const outRoot = join(root, "out", "compose");
  mkdirSync(outRoot, { recursive: true });
  const results: Array<Record<string, unknown>> = [];
  for (const family of manifest.families) {
    for (const [index, slot] of SLOTS.entries()) {
      const entryId = `${family.typeId}-${slot}`;
      const entryRoot = join(outRoot, entryId);
      mkdirSync(entryRoot, { recursive: true });
      const componentSha = sha256(`component:${family.typeId}`);
      const component = (id: string, angle: number) => ({
        id,
        growthAsset: { url: "./component-growth-v1.bin", byteLength: 128, sha256: componentSha },
        scientificBundle: { locator: `fixture:${family.typeId}`, identitySha256: "b".repeat(64) },
        transform: { translate: [0, 0, 0], rotateDegrees: [angle, 0, 0], scale: 1 },
        phaseOffset: 0,
      });
      const scene = parseGrowthSceneV1({
        format: "growth-scene-v1",
        title: entryId,
        disclosure: "composed-visualization",
        durationSeconds: 8,
        variation: { driver: family.driver, value: family.values[index]!, unit: family.unit },
        bounds: { xMin: -10, xMax: 10, yMin: -10, yMax: 10, zMin: -10, zMax: 10 },
        camera: { tiltDegrees: 38, yawDegrees: 15, zoom: 1 },
        components: [component("part-a", 0), component("part-b", 30)],
      });
      const scenePath = join(entryRoot, "scene.json");
      writeJson(scenePath, scene);
      const sceneIdentity = identity(root, scenePath);
      const sciencePath = join(entryRoot, "scientific-scene-bundle.json");
      writeJson(sciencePath, {
        format: "named-crystal-composed-scientific-bundle-v1",
        entryId,
        disclosure: "composed-visualization-of-independent-direct-growth-components",
        scene: { path: "scene.json", byteLength: sceneIdentity.byteLength, sha256: sceneIdentity.sha256 },
        directReview: { path: "fixture-direct-review.json", byteLength: 1, sha256: "c".repeat(64) },
        componentBundles: [{ locator: `fixture:${family.typeId}`, identitySha256: "b".repeat(64) }],
      });
      const coldBytes = growthSceneColdPayloadBytes(scene, sceneIdentity.byteLength);
      results.push({
        entryId,
        typeId: family.typeId,
        slot,
        pattern: family.pattern,
        variation: scene.variation,
        componentTypeId: "fixture-component",
        componentSlot: "baseline",
        componentEntryId: "fixture-component-baseline",
        instanceCount: 2,
        uniqueWebAssetCount: 1,
        coldWebPayloadBytes: options.coldFailure === true && results.length === 0 ? 20_000_000 : coldBytes,
        webPayloadLimitBytes: 20_000_000,
        actualComponentDecoder: "decodeGrowthAssetV1",
        scene: sceneIdentity,
        scientificSceneBundle: identity(root, sciencePath),
      });
    }
  }
  expect(results).toHaveLength(33);
  const reportPath = join(outRoot, "report.json");
  writeJson(reportPath, {
    format: "named-crystal-final-compose-report-v1",
    completed: 33,
    failed: 0,
    webPayloadLimitBytes: 20_000_000,
    routeChangesOnAcceptance: ROUTE_CHANGES,
    results,
  });
  const reportIdentity = identity(root, reportPath);

  const contactPath = join(outRoot, "contact-sheet.png");
  writeFileSync(contactPath, "fixture final Compose contact sheet");
  const contactIdentity = identity(root, contactPath);
  const captures: Array<Record<string, unknown>> = [];
  let firstCapture = "";
  for (const result of results) {
    for (const view of VIEWS) {
      for (const stage of STAGES) {
        if (options.missingCapture === true && captures.length === 0) continue;
        const path = join(outRoot, "browser-review", `${String(result.entryId)}-${view.id}-${stage.id}.png`);
        mkdirSync(join(outRoot, "browser-review"), { recursive: true });
        writeFileSync(path, `fixture:${String(result.entryId)}:${view.id}:${stage.id}`);
        if (firstCapture === "") firstCapture = path;
        captures.push({
          entryId: result.entryId,
          typeId: result.typeId,
          slot: result.slot,
          view: view.id,
          tiltDegrees: view.tiltDegrees,
          yawDegrees: view.yawDegrees,
          stage: stage.id,
          fraction: stage.fraction,
          ...identity(root, path),
        });
      }
    }
  }
  const browserPath = join(outRoot, "browser-review.json");
  writeJson(browserPath, {
    format: "named-crystal-final-compose-browser-review-v1",
    sourceReport: reportIdentity,
    playback: {
      page: "app/spike-gg-realism.html",
      queryMode: "growthScene",
      componentVerification: "browser-fetch-sha256-decodeGrowthAssetV1",
      views: VIEWS,
      stages: STAGES,
    },
    completedEntries: 33,
    contactSheet: contactIdentity,
    captures,
  });
  const decisions = join(root, "decisions.json");
  writeJson(decisions, {
    format: "named-crystal-final-compose-decisions-v1",
    reviewedAt: "2026-08-30",
    composeReport: reportIdentity,
    browserReview: identity(root, browserPath),
    contactSheet: contactIdentity,
    families: manifest.families.map(({ typeId }) => ({
      typeId,
      rationale: `${typeId} retains its named composed external form in face, oblique and axial review.`,
    })),
  });
  return { root, decisions, catalog, table, review, report: reportPath, firstCapture };
};

const accept = (value: Fixture) => acceptFinalComposeCatalog(
  value.decisions,
  value.catalog,
  value.table,
  value.review,
  value.root,
);

describe("named crystal final Compose acceptance", () => {
  it("verifies 297 captures and reaches the terminal 99-slot catalog", () => {
    const value = fixture();
    expect(accept(value)).toMatchObject({
      acceptedVariants: 99,
      remainingVariants: 0,
      directTypes: 22,
      composeTypes: 11,
    });
    const catalog = parseNamedCrystalCatalog(JSON.parse(readFileSync(value.catalog, "utf8")) as unknown);
    expect(summarizeNamedCrystalCatalog(catalog)).toMatchObject({
      acceptedSlots: 99,
      remainingSlots: 0,
      ggTypes: 22,
      composeTypes: 11,
    });
    expect(catalog.entries.find(({ id }) => id === "multiply-capped-columns")?.route).toBe("compose");
    expect(catalog.entries.find(({ id }) => id === "needle-clusters")?.route).toBe("compose");
  });

  it("refuses exact Compose report drift", () => {
    const value = fixture();
    writeFileSync(value.report, "drift", { flag: "a" });
    expect(() => accept(value)).toThrow(/report identity drift/);
  });

  it("refuses a capture whose bytes drift after browser review", () => {
    const value = fixture();
    writeFileSync(value.firstCapture, "drift", { flag: "a" });
    expect(() => accept(value)).toThrow(/identity drift/);
  });

  it("refuses incomplete nine-capture coverage", () => {
    const value = fixture({ missingCapture: true });
    expect(() => accept(value)).toThrow(/browser review is incomplete/);
  });

  it("refuses a cold payload at the web ceiling", () => {
    const value = fixture({ coldFailure: true });
    expect(() => accept(value)).toThrow(/result is not eligible/);
  });

  it("refuses an asymmetric premature deferred-route transition", () => {
    const value = fixture({ prematureRoute: true });
    expect(() => accept(value)).toThrow(/atomic pending .* or final/u);
  });
});
