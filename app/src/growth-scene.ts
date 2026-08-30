export const GROWTH_SCENE_WEB_LIMIT_BYTES = 20_000_000;

export interface GrowthSceneAssetV1 {
  readonly url: string;
  readonly byteLength: number;
  readonly sha256: string;
}

export interface GrowthSceneScientificBundleV1 {
  readonly locator: string;
  readonly identitySha256: string;
}

export interface GrowthSceneTransformV1 {
  readonly translate: readonly [number, number, number];
  readonly rotateDegrees: readonly [number, number, number];
  readonly scale: number;
}

export interface GrowthSceneComponentV1 {
  readonly id: string;
  readonly growthAsset: GrowthSceneAssetV1;
  readonly scientificBundle: GrowthSceneScientificBundleV1;
  readonly transform: GrowthSceneTransformV1;
  readonly phaseOffset: number;
}

export interface GrowthSceneV1 {
  readonly format: "growth-scene-v1";
  readonly title: string;
  readonly disclosure: "composed-visualization";
  readonly durationSeconds: number;
  readonly variation: {
    readonly driver: string;
    readonly value: number;
    readonly unit: string;
  };
  readonly bounds: {
    readonly xMin: number;
    readonly xMax: number;
    readonly yMin: number;
    readonly yMax: number;
    readonly zMin: number;
    readonly zMax: number;
  };
  readonly camera: {
    readonly tiltDegrees: number;
    readonly yawDegrees: number;
    readonly zoom: number;
  };
  readonly components: readonly GrowthSceneComponentV1[];
}

const object = (value: unknown, label: string): Record<string, unknown> => {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
  return value as Record<string, unknown>;
};

const exactKeys = (value: Record<string, unknown>, keys: readonly string[], label: string): void => {
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${label} keys must be exactly ${expected.join(", ")}`);
  }
};

const string = (value: unknown, label: string): string => {
  if (typeof value !== "string" || value.trim() === "") throw new Error(`${label} must be non-empty`);
  return value;
};

const finite = (value: unknown, label: string): number => {
  if (typeof value !== "number" || !Number.isFinite(value)) throw new Error(`${label} must be finite`);
  return value;
};

const positive = (value: unknown, label: string): number => {
  const parsed = finite(value, label);
  if (parsed <= 0) throw new Error(`${label} must be positive`);
  return parsed;
};

const positiveInteger = (value: unknown, label: string): number => {
  const parsed = positive(value, label);
  if (!Number.isSafeInteger(parsed)) throw new Error(`${label} must be a safe integer`);
  return parsed;
};

const sha256 = (value: unknown, label: string): string => {
  const parsed = string(value, label);
  if (!/^[0-9a-f]{64}$/u.test(parsed)) throw new Error(`${label} must be lowercase SHA-256`);
  return parsed;
};

const vector3 = (value: unknown, label: string): readonly [number, number, number] => {
  if (!Array.isArray(value) || value.length !== 3) throw new Error(`${label} must have three values`);
  return [finite(value[0], `${label}[0]`), finite(value[1], `${label}[1]`), finite(value[2], `${label}[2]`)];
};

const parseAsset = (value: unknown, label: string): GrowthSceneAssetV1 => {
  const wire = object(value, label);
  exactKeys(wire, ["url", "byteLength", "sha256"], label);
  const url = string(wire.url, `${label}.url`);
  if (url.includes("\\")) throw new Error(`${label}.url must use web path separators`);
  return {
    url,
    byteLength: positiveInteger(wire.byteLength, `${label}.byteLength`),
    sha256: sha256(wire.sha256, `${label}.sha256`),
  };
};

const parseScientificBundle = (value: unknown, label: string): GrowthSceneScientificBundleV1 => {
  const wire = object(value, label);
  exactKeys(wire, ["locator", "identitySha256"], label);
  return {
    locator: string(wire.locator, `${label}.locator`),
    identitySha256: sha256(wire.identitySha256, `${label}.identitySha256`),
  };
};

const parseTransform = (value: unknown, label: string): GrowthSceneTransformV1 => {
  const wire = object(value, label);
  exactKeys(wire, ["translate", "rotateDegrees", "scale"], label);
  return {
    translate: vector3(wire.translate, `${label}.translate`),
    rotateDegrees: vector3(wire.rotateDegrees, `${label}.rotateDegrees`),
    scale: positive(wire.scale, `${label}.scale`),
  };
};

export function parseGrowthSceneV1(value: unknown): GrowthSceneV1 {
  const wire = object(value, "scene");
  exactKeys(
    wire,
    ["format", "title", "disclosure", "durationSeconds", "variation", "bounds", "camera", "components"],
    "scene",
  );
  if (wire.format !== "growth-scene-v1") throw new Error("scene.format must be growth-scene-v1");
  if (wire.disclosure !== "composed-visualization") {
    throw new Error("scene.disclosure must be composed-visualization");
  }

  const variation = object(wire.variation, "scene.variation");
  exactKeys(variation, ["driver", "value", "unit"], "scene.variation");
  const bounds = object(wire.bounds, "scene.bounds");
  exactKeys(bounds, ["xMin", "xMax", "yMin", "yMax", "zMin", "zMax"], "scene.bounds");
  const parsedBounds = {
    xMin: finite(bounds.xMin, "scene.bounds.xMin"),
    xMax: finite(bounds.xMax, "scene.bounds.xMax"),
    yMin: finite(bounds.yMin, "scene.bounds.yMin"),
    yMax: finite(bounds.yMax, "scene.bounds.yMax"),
    zMin: finite(bounds.zMin, "scene.bounds.zMin"),
    zMax: finite(bounds.zMax, "scene.bounds.zMax"),
  };
  if (
    parsedBounds.xMax <= parsedBounds.xMin ||
    parsedBounds.yMax <= parsedBounds.yMin ||
    parsedBounds.zMax <= parsedBounds.zMin
  ) {
    throw new Error("scene.bounds maxima must be greater than minima");
  }

  const camera = object(wire.camera, "scene.camera");
  exactKeys(camera, ["tiltDegrees", "yawDegrees", "zoom"], "scene.camera");
  if (!Array.isArray(wire.components) || wire.components.length === 0) {
    throw new Error("scene.components must be non-empty");
  }
  const seen = new Set<string>();
  const components = wire.components.map((candidate, index): GrowthSceneComponentV1 => {
    const label = `scene.components[${index}]`;
    const component = object(candidate, label);
    exactKeys(
      component,
      ["id", "growthAsset", "scientificBundle", "transform", "phaseOffset"],
      label,
    );
    const id = string(component.id, `${label}.id`);
    if (seen.has(id)) throw new Error(`${label}.id duplicates ${id}`);
    seen.add(id);
    const phaseOffset = finite(component.phaseOffset, `${label}.phaseOffset`);
    if (phaseOffset < 0 || phaseOffset >= 1) {
      throw new Error(`${label}.phaseOffset must be in [0, 1)`);
    }
    return {
      id,
      growthAsset: parseAsset(component.growthAsset, `${label}.growthAsset`),
      scientificBundle: parseScientificBundle(component.scientificBundle, `${label}.scientificBundle`),
      transform: parseTransform(component.transform, `${label}.transform`),
      phaseOffset,
    };
  });

  return {
    format: "growth-scene-v1",
    title: string(wire.title, "scene.title"),
    disclosure: "composed-visualization",
    durationSeconds: positive(wire.durationSeconds, "scene.durationSeconds"),
    variation: {
      driver: string(variation.driver, "scene.variation.driver"),
      value: finite(variation.value, "scene.variation.value"),
      unit: string(variation.unit, "scene.variation.unit"),
    },
    bounds: parsedBounds,
    camera: {
      tiltDegrees: finite(camera.tiltDegrees, "scene.camera.tiltDegrees"),
      yawDegrees: finite(camera.yawDegrees, "scene.camera.yawDegrees"),
      zoom: positive(camera.zoom, "scene.camera.zoom"),
    },
    components,
  };
}

/** Manifest bytes plus every uniquely addressed cold component payload. */
export function growthSceneColdPayloadBytes(scene: GrowthSceneV1, manifestBytes: number): number {
  const totalManifestBytes = positiveInteger(manifestBytes, "manifestBytes");
  const lengthsBySha = new Map<string, number>();
  for (const component of scene.components) {
    const previous = lengthsBySha.get(component.growthAsset.sha256);
    if (previous !== undefined && previous !== component.growthAsset.byteLength) {
      throw new Error(`growth asset ${component.growthAsset.sha256} has inconsistent byte lengths`);
    }
    lengthsBySha.set(component.growthAsset.sha256, component.growthAsset.byteLength);
  }
  return totalManifestBytes + [...lengthsBySha.values()].reduce((sum, value) => sum + value, 0);
}
