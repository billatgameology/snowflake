// Build the 33 final composed catalog scenes once the consolidated direct review exists.
//
//   node scripts/named-crystal-final-compose.ts plan
//   node scripts/named-crystal-final-compose.ts build

import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { decodeGrowthAssetV1 } from "../app/src/growth-asset.ts";
import {
  type GrowthSceneComponentV1,
  type GrowthSceneV1,
  growthSceneColdPayloadBytes,
  parseGrowthSceneV1,
} from "../app/src/growth-scene.ts";
import { parseNamedCrystalCatalog } from "./named-crystal-catalog.ts";

const REPO = resolve(import.meta.dirname, "..");
const DEFAULT_MANIFEST = join(REPO, "docs", "named-snow-crystal-final-compose.json");
const SLOTS = ["lower", "baseline", "upper"] as const;
type Slot = typeof SLOTS[number];

type Pattern =
  | "double-in-plane"
  | "radial-bullets"
  | "radial-plates"
  | "radial-dendrites"
  | "axial-stack"
  | "twin-columns"
  | "irregular-cluster"
  | "radial-needles"
  | "arrowhead-pair"
  | "crossed-needles"
  | "crossed-plates";

interface FamilyWire {
  readonly typeId: string;
  readonly componentTypeId: string;
  readonly componentSlot: Slot;
  readonly pattern: Pattern;
  readonly driver: string;
  readonly unit: string;
  readonly values: readonly [number, number, number];
}

interface ManifestWire {
  readonly format: "named-crystal-final-compose-recipes-v1";
  readonly catalog: string;
  readonly directReview: string;
  readonly outRoot: string;
  readonly webPayloadLimitBytes: number;
  readonly durationSeconds: number;
  readonly routeChangesOnAcceptance: readonly string[];
  readonly families: readonly FamilyWire[];
}

interface DirectVariantWire {
  readonly slot: Slot;
  readonly entryId: string;
  readonly webAsset: {
    readonly path: string;
    readonly byteLength: number;
    readonly sha256: string;
  };
  readonly scientificBundle: {
    readonly locator: string;
    readonly identitySha256: string;
  };
}

interface DirectReviewWire {
  readonly format: "named-crystal-final-direct-review-v1";
  readonly families: readonly {
    readonly typeId: string;
    readonly status: "accepted";
    readonly variants: readonly DirectVariantWire[];
  }[];
}

interface ComponentBinding {
  readonly typeId: string;
  readonly slot: Slot;
  readonly entryId: string;
  readonly localWebPath: string;
  readonly webUrl: string;
  readonly byteLength: number;
  readonly webSha256: string;
  readonly scientificLocator: string;
  readonly scientificIdentitySha256: string;
  readonly localBounds: GrowthSceneV1["bounds"];
}

export interface FinalComposePlan {
  readonly manifestPath: string;
  readonly repo: string;
  readonly outRoot: string;
  readonly directReviewPath: string;
  readonly directReviewReady: boolean;
  readonly webPayloadLimitBytes: number;
  readonly durationSeconds: number;
  readonly routeChangesOnAcceptance: readonly string[];
  readonly entries: readonly {
    readonly typeId: string;
    readonly typeName: string;
    readonly slot: Slot;
    readonly pattern: Pattern;
    readonly driver: string;
    readonly value: number;
    readonly unit: string;
    readonly componentTypeId: string;
    readonly componentSlot: Slot;
  }[];
}

const PATTERNS = new Set<Pattern>([
  "double-in-plane",
  "radial-bullets",
  "radial-plates",
  "radial-dendrites",
  "axial-stack",
  "twin-columns",
  "irregular-cluster",
  "radial-needles",
  "arrowhead-pair",
  "crossed-needles",
  "crossed-plates",
]);

const canonicalJson = (value: unknown): string => `${JSON.stringify(value, null, 2)}\n`;
const sha256 = (bytes: Uint8Array | string): string => createHash("sha256").update(bytes).digest("hex");
const isSha256 = (value: string): boolean => /^[0-9a-f]{64}$/.test(value);
const webPath = (value: string): string => value.replaceAll("\\", "/");
const MAX_SCENE_Z_SCALE = 3.5;
const CELL_HALF_XY = 0.58;
const CELL_HALF_Z = 0.46;

const roundBound = (value: number): number => Math.round(value * 1_000_000) / 1_000_000;

const growthLocalBounds = (
  asset: ReturnType<typeof decodeGrowthAssetV1>,
): GrowthSceneV1["bounds"] => {
  let xMin = Infinity;
  let xMax = -Infinity;
  let yMin = Infinity;
  let yMax = -Infinity;
  let zMin = Infinity;
  let zMax = -Infinity;
  const [nx, ny] = asset.dims;
  const [centerI, centerJ, centerK] = asset.center;
  const centerX = centerI + centerJ / 2;
  const centerY = (Math.sqrt(3) * centerJ) / 2;
  for (const flat of asset.flatIndices) {
    const i = flat % nx;
    const j = Math.floor(flat / nx) % ny;
    const k = Math.floor(flat / (nx * ny));
    const x = i + j / 2 - centerX;
    const y = (Math.sqrt(3) * j) / 2 - centerY;
    const z = (k - centerK) * MAX_SCENE_Z_SCALE;
    xMin = Math.min(xMin, x - CELL_HALF_XY);
    xMax = Math.max(xMax, x + CELL_HALF_XY);
    yMin = Math.min(yMin, y - CELL_HALF_XY);
    yMax = Math.max(yMax, y + CELL_HALF_XY);
    zMin = Math.min(zMin, z - CELL_HALF_Z);
    zMax = Math.max(zMax, z + CELL_HALF_Z);
  }
  return { xMin, xMax, yMin, yMax, zMin, zMax };
};

export const rotateXyzPoint = (
  point: readonly [number, number, number],
  rotateDegrees: readonly [number, number, number],
): readonly [number, number, number] => {
  const rx = rotateDegrees[0] * Math.PI / 180;
  const ry = rotateDegrees[1] * Math.PI / 180;
  const rz = rotateDegrees[2] * Math.PI / 180;
  const [x, y, z] = point;
  const cosZ = Math.cos(rz!);
  const sinZ = Math.sin(rz!);
  const afterZ: readonly [number, number, number] = [cosZ * x - sinZ * y, sinZ * x + cosZ * y, z];
  const cosY = Math.cos(ry!);
  const sinY = Math.sin(ry!);
  const afterY: readonly [number, number, number] = [
    cosY * afterZ[0] + sinY * afterZ[2],
    afterZ[1],
    -sinY * afterZ[0] + cosY * afterZ[2],
  ];
  const cosX = Math.cos(rx!);
  const sinX = Math.sin(rx!);
  return [
    afterY[0],
    cosX * afterY[1] - sinX * afterY[2],
    sinX * afterY[1] + cosX * afterY[2],
  ];
};

export const polarAxisXyzEuler = (
  polarDegrees: number,
  azimuthDegrees: number,
): readonly [number, number, number] => {
  const polar = polarDegrees * Math.PI / 180;
  const azimuth = azimuthDegrees * Math.PI / 180;
  const directionX = Math.sin(polar) * Math.cos(azimuth);
  const directionY = Math.sin(polar) * Math.sin(azimuth);
  const directionZ = Math.cos(polar);
  const rotateY = Math.asin(Math.max(-1, Math.min(1, directionX)));
  const rotateX = Math.atan2(-directionY, directionZ);
  return [rotateX * 180 / Math.PI, rotateY * 180 / Math.PI, azimuthDegrees];
};

const transformedSceneBounds = (
  components: readonly GrowthSceneComponentV1[],
  local: GrowthSceneV1["bounds"],
): GrowthSceneV1["bounds"] => {
  const corners: Array<readonly [number, number, number]> = [];
  for (const x of [local.xMin, local.xMax]) {
    for (const y of [local.yMin, local.yMax]) {
      for (const z of [local.zMin, local.zMax]) corners.push([x, y, z]);
    }
  }
  let xMin = Infinity;
  let xMax = -Infinity;
  let yMin = Infinity;
  let yMax = -Infinity;
  let zMin = Infinity;
  let zMax = -Infinity;
  for (const component of components) {
    for (const corner of corners) {
      const scaled = corner.map((value) => value * component.transform.scale) as [number, number, number];
      const rotated = rotateXyzPoint(scaled, component.transform.rotateDegrees);
      const transformed = rotated.map(
        (value, index) => value + component.transform.translate[index]!,
      ) as [number, number, number];
      xMin = Math.min(xMin, transformed[0]);
      xMax = Math.max(xMax, transformed[0]);
      yMin = Math.min(yMin, transformed[1]);
      yMax = Math.max(yMax, transformed[1]);
      zMin = Math.min(zMin, transformed[2]);
      zMax = Math.max(zMax, transformed[2]);
    }
  }
  const span = Math.max(xMax - xMin, yMax - yMin, zMax - zMin);
  const padding = Math.max(2, span * 0.08);
  return {
    xMin: roundBound(xMin - padding),
    xMax: roundBound(xMax + padding),
    yMin: roundBound(yMin - padding),
    yMax: roundBound(yMax + padding),
    zMin: roundBound(zMin - padding),
    zMax: roundBound(zMax + padding),
  };
};

export const sceneBoundsContainTransformedCorners = (
  bounds: GrowthSceneV1["bounds"],
  components: readonly GrowthSceneComponentV1[],
  local: GrowthSceneV1["bounds"],
): boolean => {
  const epsilon = 1e-5;
  for (const component of components) {
    for (const x of [local.xMin, local.xMax]) {
      for (const y of [local.yMin, local.yMax]) {
        for (const z of [local.zMin, local.zMax]) {
          const scaled: readonly [number, number, number] = [x, y, z].map(
            (value) => value * component.transform.scale,
          ) as [number, number, number];
          const rotated = rotateXyzPoint(scaled, component.transform.rotateDegrees);
          const point = rotated.map(
            (value, index) => value + component.transform.translate[index]!,
          ) as [number, number, number];
          if (
            point[0] < bounds.xMin - epsilon || point[0] > bounds.xMax + epsilon ||
            point[1] < bounds.yMin - epsilon || point[1] > bounds.yMax + epsilon ||
            point[2] < bounds.zMin - epsilon || point[2] > bounds.zMax + epsilon
          ) return false;
        }
      }
    }
  }
  return true;
};

const argument = (argv: readonly string[], name: string, fallback?: string): string | undefined => {
  const index = argv.indexOf(`--${name}`);
  if (index < 0) return fallback;
  const value = argv[index + 1];
  if (value === undefined) throw new Error(`--${name} wants a value`);
  return value;
};

export function loadFinalComposePlan(
  manifestPath = DEFAULT_MANIFEST,
  outRootOverride?: string,
  repo = REPO,
): FinalComposePlan {
  const absoluteManifest = resolve(manifestPath);
  const wire = JSON.parse(readFileSync(absoluteManifest, "utf8")) as ManifestWire;
  if (wire.format !== "named-crystal-final-compose-recipes-v1") {
    throw new Error("unknown final Compose recipe format");
  }
  if (wire.webPayloadLimitBytes !== 20_000_000 || wire.durationSeconds !== 8) {
    throw new Error("final Compose output contract drift");
  }
  if (
    wire.families.length !== 11 ||
    new Set(wire.families.map(({ typeId }) => typeId)).size !== 11 ||
    wire.routeChangesOnAcceptance.join(",") !== "multiply-capped-columns,needle-clusters"
  ) {
    throw new Error("final Compose family/route-change contract drift");
  }
  const catalog = parseNamedCrystalCatalog(
    JSON.parse(readFileSync(resolve(repo, wire.catalog), "utf8")) as unknown,
  );
  const routeChanges = new Set(wire.routeChangesOnAcceptance);
  const entries: FinalComposePlan["entries"][number][] = [];
  for (const family of wire.families) {
    if (!PATTERNS.has(family.pattern)) throw new Error(`${family.typeId}: unknown Compose pattern`);
    if (
      family.values.length !== 3 ||
      !family.values.every(Number.isFinite) ||
      family.driver.trim() === "" ||
      family.unit.trim() === ""
    ) {
      throw new Error(`${family.typeId}: invalid Compose driver family`);
    }
    const target = catalog.entries.find(({ id }) => id === family.typeId);
    const component = catalog.entries.find(({ id }) => id === family.componentTypeId);
    if (target === undefined || component === undefined) throw new Error(`${family.typeId}: catalog binding missing`);
    const targetRouteOk = target.route === "compose" || (target.route === "gg-plus" && routeChanges.has(target.id));
    if (!targetRouteOk) throw new Error(`${family.typeId}: target route is not Compose/pending Compose`);
    if (!["gg", "gg-plus"].includes(component.route)) {
      throw new Error(`${family.typeId}: component ${component.id} is not direct growth`);
    }
    if (Object.values(target.variants).some((variant) => variant !== null)) {
      throw new Error(`${family.typeId}: Compose target already has accepted slots`);
    }
    for (let index = 0; index < SLOTS.length; index++) {
      entries.push({
        typeId: family.typeId,
        typeName: target.name,
        slot: SLOTS[index]!,
        pattern: family.pattern,
        driver: family.driver,
        value: family.values[index]!,
        unit: family.unit,
        componentTypeId: family.componentTypeId,
        componentSlot: family.componentSlot,
      });
    }
  }
  if (entries.length !== 33 || new Set(entries.map(({ typeId, slot }) => `${typeId}/${slot}`)).size !== 33) {
    throw new Error("final Compose plan must materialize 33 unique entries");
  }
  const directReviewPath = resolve(repo, wire.directReview);
  return {
    manifestPath: absoluteManifest,
    repo,
    outRoot: resolve(repo, outRootOverride ?? wire.outRoot),
    directReviewPath,
    directReviewReady: existsSync(directReviewPath),
    webPayloadLimitBytes: wire.webPayloadLimitBytes,
    durationSeconds: wire.durationSeconds,
    routeChangesOnAcceptance: wire.routeChangesOnAcceptance,
    entries,
  };
}

const readDirectBindings = (plan: FinalComposePlan): {
  readonly reviewIdentity: { readonly byteLength: number; readonly sha256: string };
  readonly bindings: ReadonlyMap<string, ComponentBinding>;
} => {
  if (!plan.directReviewReady) {
    throw new Error(`final direct review is not ready: ${plan.directReviewPath}`);
  }
  const reviewBytes = readFileSync(plan.directReviewPath);
  const review = JSON.parse(reviewBytes.toString()) as DirectReviewWire;
  if (review.format !== "named-crystal-final-direct-review-v1") {
    throw new Error("unknown final direct review format");
  }
  const bindings = new Map<string, ComponentBinding>();
  for (const family of review.families) {
    if (family.status !== "accepted") throw new Error(`${family.typeId}: direct review family is not accepted`);
    for (const variant of family.variants) {
      if (!SLOTS.includes(variant.slot) || !isSha256(variant.webAsset.sha256) ||
          !isSha256(variant.scientificBundle.identitySha256)) {
        throw new Error(`${family.typeId}/${variant.slot}: malformed direct component identity`);
      }
      const localWebPath = resolve(plan.repo, variant.webAsset.path);
      const bytes = readFileSync(localWebPath);
      if (bytes.byteLength !== variant.webAsset.byteLength || sha256(bytes) !== variant.webAsset.sha256) {
        throw new Error(`${family.typeId}/${variant.slot}: direct component web identity drift`);
      }
      const growth = decodeGrowthAssetV1(
        bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
      );
      const key = `${family.typeId}/${variant.slot}`;
      if (bindings.has(key)) throw new Error(`${key}: duplicate direct component binding`);
      bindings.set(key, {
        typeId: family.typeId,
        slot: variant.slot,
        entryId: variant.entryId,
        localWebPath,
        webUrl: variant.webAsset.path,
        byteLength: variant.webAsset.byteLength,
        webSha256: variant.webAsset.sha256,
        scientificLocator: variant.scientificBundle.locator,
        scientificIdentitySha256: variant.scientificBundle.identitySha256,
        localBounds: growthLocalBounds(growth),
      });
    }
  }
  return {
    reviewIdentity: { byteLength: reviewBytes.byteLength, sha256: sha256(reviewBytes) },
    bindings,
  };
};

const makeComponent = (
  id: string,
  binding: ComponentBinding,
  sceneDirectory: string,
  translate: readonly [number, number, number],
  rotateDegrees: readonly [number, number, number],
  scale: number,
  phaseOffset: number,
): GrowthSceneComponentV1 => {
  let url = webPath(relative(sceneDirectory, binding.localWebPath));
  if (!url.startsWith(".")) url = `./${url}`;
  return {
    id,
    growthAsset: { url, byteLength: binding.byteLength, sha256: binding.webSha256 },
    scientificBundle: {
      locator: binding.scientificLocator,
      identitySha256: binding.scientificIdentitySha256,
    },
    transform: { translate, rotateDegrees, scale },
    phaseOffset,
  };
};

const radial = (
  prefix: string,
  binding: ComponentBinding,
  sceneDirectory: string,
  tilt: number,
): GrowthSceneComponentV1[] => Array.from({ length: 6 }, (_, index) => {
  const azimuth = index * 60;
  const rotation = polarAxisXyzEuler(tilt, azimuth);
  return makeComponent(`${prefix}-${index + 1}`, binding, sceneDirectory, [0, 0, 0], rotation, 0.78, index * 0.025);
});

const componentsFor = (
  entry: FinalComposePlan["entries"][number],
  binding: ComponentBinding,
  sceneDirectory: string,
): GrowthSceneComponentV1[] => {
  const v = entry.value;
  switch (entry.pattern) {
    case "double-in-plane":
      return [
        makeComponent("star-a", binding, sceneDirectory, [0, 0, 0], [0, 0, 0], 1, 0),
        makeComponent("star-b", binding, sceneDirectory, [0, 0, 0], [0, 0, v], 0.96, 0.04),
      ];
    case "radial-bullets": return radial("bullet", binding, sceneDirectory, v);
    case "radial-plates": return radial("plate", binding, sceneDirectory, v);
    case "radial-dendrites": return radial("dendrite", binding, sceneDirectory, v);
    case "axial-stack":
      return [-1, 0, 1].map((position, index) =>
        makeComponent(
          `capped-column-${index + 1}`,
          binding,
          sceneDirectory,
          [0, 0, position * v * 150],
          [0, 0, 0],
          0.72,
          index * 0.04,
        )
      );
    case "twin-columns":
      return [
        makeComponent("column-a", binding, sceneDirectory, [-28, 0, 0], [0, -v / 2, 0], 0.9, 0),
        makeComponent("column-b", binding, sceneDirectory, [28, 0, 0], [0, v / 2, 0], 0.9, 0.04),
      ];
    case "irregular-cluster": {
      const locations: readonly (readonly [number, number, number])[] = [
        [-70, -25, -20], [60, -35, 20], [-10, 55, -35], [25, 10, 60], [-45, 30, 45], [65, 45, -45],
      ];
      return locations.map((location, index) => makeComponent(
        `irregular-${index + 1}`,
        binding,
        sceneDirectory,
        location,
        [index * 17, index * 29, index * 43],
        0.62 * (1 + (index % 2 === 0 ? v : -v)),
        index * 0.035,
      ));
    }
    case "radial-needles": return radial("needle", binding, sceneDirectory, v);
    case "arrowhead-pair":
      return [
        makeComponent("arrowhead-a", binding, sceneDirectory, [-35, 0, 0], [0, -v / 2, -15], 0.86, 0),
        makeComponent("arrowhead-b", binding, sceneDirectory, [35, 0, 0], [0, v / 2, 15], 0.86, 0.05),
      ];
    case "crossed-needles":
      return [
        makeComponent(
          "needle-a", binding, sceneDirectory, [0, 0, 0], polarAxisXyzEuler(90, -v / 2), 1, 0,
        ),
        makeComponent(
          "needle-b", binding, sceneDirectory, [0, 0, 0], polarAxisXyzEuler(90, v / 2), 0.96, 0.04,
        ),
      ];
    case "crossed-plates":
      return [
        makeComponent("plate-a", binding, sceneDirectory, [0, 0, 0], [-v / 2, 0, 0], 1, 0),
        makeComponent("plate-b", binding, sceneDirectory, [0, 0, 0], [v / 2, 0, 0], 0.96, 0.04),
      ];
  }
};

const cameraFor = (pattern: Pattern): GrowthSceneV1["camera"] => ({
  tiltDegrees: pattern === "crossed-plates" ? 55 : 38,
  yawDegrees: pattern === "irregular-cluster" ? 25 : 15,
  zoom: pattern.startsWith("radial-") ? 1.05 : 1,
});

export function buildFinalComposeScenes(plan: FinalComposePlan): {
  readonly completed: number;
  readonly reportPath: string;
  readonly results: readonly Record<string, unknown>[];
} {
  const { reviewIdentity, bindings } = readDirectBindings(plan);
  mkdirSync(plan.outRoot, { recursive: true });
  const results: Record<string, unknown>[] = [];
  for (const entry of plan.entries) {
    const binding = bindings.get(`${entry.componentTypeId}/${entry.componentSlot}`);
    if (binding === undefined) {
      throw new Error(`${entry.typeId}: accepted component ${entry.componentTypeId}/${entry.componentSlot} is missing`);
    }
    const entryId = `${entry.typeId}-${entry.slot}`;
    const directory = join(plan.outRoot, entryId);
    mkdirSync(directory, { recursive: true });
    const components = componentsFor(entry, binding, directory);
    const scene: GrowthSceneV1 = {
      format: "growth-scene-v1",
      title: `${entry.typeName} — ${entry.slot}`,
      disclosure: "composed-visualization",
      durationSeconds: plan.durationSeconds,
      variation: { driver: entry.driver, value: entry.value, unit: entry.unit },
      bounds: transformedSceneBounds(components, binding.localBounds),
      camera: cameraFor(entry.pattern),
      components,
    };
    const parsed = parseGrowthSceneV1(scene);
    if (!sceneBoundsContainTransformedCorners(parsed.bounds, parsed.components, binding.localBounds)) {
      throw new Error(`${entryId}: derived scene bounds do not contain every transformed component corner`);
    }
    const sceneBytes = canonicalJson(parsed);
    const coldBytes = growthSceneColdPayloadBytes(parsed, Buffer.byteLength(sceneBytes));
    if (coldBytes >= plan.webPayloadLimitBytes) {
      throw new Error(`${entryId}: cold web payload ${coldBytes} is not below ${plan.webPayloadLimitBytes}`);
    }
    const scenePath = join(directory, "scene.json");
    writeFileSync(scenePath, sceneBytes);
    const uniqueScience = new Map<string, { locator: string; identitySha256: string }>();
    for (const component of parsed.components) {
      uniqueScience.set(component.scientificBundle.identitySha256, component.scientificBundle);
    }
    const scienceBundle = {
      format: "named-crystal-composed-scientific-bundle-v1",
      entryId,
      disclosure: "composed-visualization-of-independent-direct-growth-components",
      scene: {
        path: "scene.json",
        byteLength: Buffer.byteLength(sceneBytes),
        sha256: sha256(sceneBytes),
      },
      directReview: {
        path: webPath(relative(directory, plan.directReviewPath)),
        ...reviewIdentity,
      },
      componentBundles: [...uniqueScience.values()],
    };
    const sciencePath = join(directory, "scientific-scene-bundle.json");
    const scienceBytes = canonicalJson(scienceBundle);
    writeFileSync(sciencePath, scienceBytes);
    results.push({
      entryId,
      typeId: entry.typeId,
      slot: entry.slot,
      pattern: entry.pattern,
      variation: parsed.variation,
      componentTypeId: binding.typeId,
      componentSlot: binding.slot,
      componentEntryId: binding.entryId,
      instanceCount: parsed.components.length,
      uniqueWebAssetCount: 1,
      coldWebPayloadBytes: coldBytes,
      webPayloadLimitBytes: plan.webPayloadLimitBytes,
      actualComponentDecoder: "decodeGrowthAssetV1",
      boundsPolicy: "decoded-events-transformed-aabb-zscale3p5-pad8pct-v1",
      bounds: parsed.bounds,
      scene: {
        path: webPath(relative(plan.repo, scenePath)),
        byteLength: statSync(scenePath).size,
        sha256: sha256(readFileSync(scenePath)),
      },
      scientificSceneBundle: {
        path: webPath(relative(plan.repo, sciencePath)),
        byteLength: statSync(sciencePath).size,
        sha256: sha256(readFileSync(sciencePath)),
      },
    });
  }
  const reportPath = join(plan.outRoot, "report.json");
  const report = {
    format: "named-crystal-final-compose-report-v1",
    sourceManifest: {
      path: webPath(relative(plan.repo, plan.manifestPath)),
      byteLength: statSync(plan.manifestPath).size,
      sha256: sha256(readFileSync(plan.manifestPath)),
    },
    directReview: {
      path: webPath(relative(plan.repo, plan.directReviewPath)),
      ...reviewIdentity,
    },
    completed: results.length,
    failed: 0,
    webPayloadLimitBytes: plan.webPayloadLimitBytes,
    routeChangesOnAcceptance: plan.routeChangesOnAcceptance,
    results,
  };
  writeFileSync(reportPath, canonicalJson(report));
  return { completed: results.length, reportPath, results };
}

const printPlan = (plan: FinalComposePlan): void => {
  for (const entry of plan.entries) {
    console.log(
      `${entry.typeId}-${entry.slot}`.padEnd(42) +
      `${entry.componentTypeId}/${entry.componentSlot}  ${entry.driver}=${entry.value} ${entry.unit}`,
    );
  }
  console.log(JSON.stringify({
    entries: plan.entries.length,
    families: new Set(plan.entries.map(({ typeId }) => typeId)).size,
    directReviewReady: plan.directReviewReady,
    directReview: plan.directReviewPath,
    webPayloadLimitBytes: plan.webPayloadLimitBytes,
    outRoot: plan.outRoot,
  }));
};

const main = (): void => {
  const [command, ...argv] = process.argv.slice(2);
  const plan = loadFinalComposePlan(
    argument(argv, "manifest", DEFAULT_MANIFEST),
    argument(argv, "out-root"),
  );
  if (command === "plan") printPlan(plan);
  else if (command === "build") {
    const result = buildFinalComposeScenes(plan);
    console.log(JSON.stringify({ completed: result.completed, report: result.reportPath }));
  } else {
    throw new Error("usage: named-crystal-final-compose.ts plan|build [--manifest file] [--out-root dir]");
  }
};

if (process.argv[1] !== undefined && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
