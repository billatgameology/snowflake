export const GUTCHECK_ANIMATION_QUEUE_FORMAT = "gutcheck-animation-queue-v1" as const;

export interface AnimationQueueSettings {
  readonly pipeline: "web-turntable-v1";
  readonly look: "glass";
  readonly width: 1080;
  readonly height: 1080;
  readonly fps: 30;
  readonly durationSeconds: 12;
  readonly meshFormat: "gutcheck-mesh-v2q";
  readonly transportEncoding: "gzip";
}

export interface AnimationQueueItem {
  readonly id: string;
  readonly label: string;
  readonly mesh: string;
  readonly render: string;
  readonly spec: string;
}

export interface AnimationQueueManifest {
  readonly format: typeof GUTCHECK_ANIMATION_QUEUE_FORMAT;
  readonly queueId: string;
  readonly createdAt: string;
  readonly sourceIndexGenerated: string;
  readonly settings: AnimationQueueSettings;
  readonly items: readonly AnimationQueueItem[];
}

export const DEFAULT_ANIMATION_QUEUE_SETTINGS: AnimationQueueSettings = Object.freeze({
  pipeline: "web-turntable-v1",
  look: "glass",
  width: 1080,
  height: 1080,
  fps: 30,
  durationSeconds: 12,
  meshFormat: "gutcheck-mesh-v2q",
  transportEncoding: "gzip",
});

const record = (value: unknown, label: string): Record<string, unknown> => {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
  return value as Record<string, unknown>;
};

const exactKeys = (
  value: Record<string, unknown>,
  required: readonly string[],
  label: string,
): void => {
  const expected = [...required].sort();
  const actual = Object.keys(value).sort();
  if (actual.join("\0") !== expected.join("\0")) {
    throw new Error(`${label} keys must be exactly ${expected.join(", ")}`);
  }
};

const string = (value: unknown, label: string): string => {
  if (typeof value !== "string" || value.length === 0 || /[\u0000-\u001f\u007f]/u.test(value)) {
    throw new Error(`${label} must be a non-empty control-free string`);
  }
  return value;
};

const literal = <T extends string | number>(value: unknown, expected: T, label: string): T => {
  if (value !== expected) throw new Error(`${label} must be ${String(expected)}`);
  return expected;
};

export const animationQueueIdFromName = (name: string): string => {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, "-")
    .replace(/^-+|-+$/gu, "")
    .slice(0, 64)
    .replace(/-+$/gu, "");
  return slug === "" ? "snowflake-animation-selection" : slug;
};

export const parseAnimationQueueManifest = (value: unknown): AnimationQueueManifest => {
  const queue = record(value, "animation queue");
  exactKeys(
    queue,
    ["createdAt", "format", "items", "queueId", "settings", "sourceIndexGenerated"],
    "animation queue",
  );
  literal(queue["format"], GUTCHECK_ANIMATION_QUEUE_FORMAT, "animation queue.format");
  const queueId = string(queue["queueId"], "animation queue.queueId");
  if (!/^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/u.test(queueId)) {
    throw new Error("animation queue.queueId must be a lowercase slug of at most 64 characters");
  }
  const createdAt = string(queue["createdAt"], "animation queue.createdAt");
  const sourceIndexGenerated = string(
    queue["sourceIndexGenerated"],
    "animation queue.sourceIndexGenerated",
  );
  for (const [label, timestamp] of [
    ["animation queue.createdAt", createdAt],
    ["animation queue.sourceIndexGenerated", sourceIndexGenerated],
  ] as const) {
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/u.test(timestamp)) {
      throw new Error(`${label} must be a UTC timestamp`);
    }
  }

  const settings = record(queue["settings"], "animation queue.settings");
  exactKeys(
    settings,
    [
      "durationSeconds",
      "fps",
      "height",
      "look",
      "meshFormat",
      "pipeline",
      "transportEncoding",
      "width",
    ],
    "animation queue.settings",
  );
  const parsedSettings: AnimationQueueSettings = {
    pipeline: literal(settings["pipeline"], "web-turntable-v1", "animation queue.settings.pipeline"),
    look: literal(settings["look"], "glass", "animation queue.settings.look"),
    width: literal(settings["width"], 1080, "animation queue.settings.width"),
    height: literal(settings["height"], 1080, "animation queue.settings.height"),
    fps: literal(settings["fps"], 30, "animation queue.settings.fps"),
    durationSeconds: literal(
      settings["durationSeconds"],
      12,
      "animation queue.settings.durationSeconds",
    ),
    meshFormat: literal(
      settings["meshFormat"],
      "gutcheck-mesh-v2q",
      "animation queue.settings.meshFormat",
    ),
    transportEncoding: literal(
      settings["transportEncoding"],
      "gzip",
      "animation queue.settings.transportEncoding",
    ),
  };

  if (!Array.isArray(queue["items"])) throw new Error("animation queue.items must be an array");
  const items: AnimationQueueItem[] = [];
  const seen = new Set<string>();
  for (const [index, itemValue] of queue["items"].entries()) {
    const label = `animation queue.items[${index}]`;
    const item = record(itemValue, label);
    exactKeys(item, ["id", "label", "mesh", "render", "spec"], label);
    const id = string(item["id"], `${label}.id`);
    if (!/^[a-z0-9][a-z0-9.-]{0,127}$/u.test(id)) throw new Error(`${label}.id is not portable`);
    if (seen.has(id)) throw new Error(`${label}.id is duplicated`);
    seen.add(id);
    const mesh = string(item["mesh"], `${label}.mesh`);
    const render = string(item["render"], `${label}.render`);
    const spec = string(item["spec"], `${label}.spec`);
    if (!mesh.startsWith("/nas/") || !mesh.endsWith(`/${id}-mesh.bin`)) {
      throw new Error(`${label}.mesh must be the selected generated mesh /nas URL`);
    }
    if (!render.startsWith("/nas/") || !/\.png$/u.test(render)) {
      throw new Error(`${label}.render must be a generated PNG /nas URL`);
    }
    if (spec !== `evidence/gutcheck-gg-realism/specs/${id}.json`) {
      throw new Error(`${label}.spec must match its tracked spec identity`);
    }
    items.push({ id, label: string(item["label"], `${label}.label`), mesh, render, spec });
  }
  const sorted = [...items].sort((a, b) => a.id.localeCompare(b.id));
  if (items.some((item, index) => item.id !== sorted[index]?.id)) {
    throw new Error("animation queue.items must be sorted by id");
  }

  return {
    format: GUTCHECK_ANIMATION_QUEUE_FORMAT,
    queueId,
    createdAt,
    sourceIndexGenerated,
    settings: parsedSettings,
    items,
  };
};

export const stringifyAnimationQueueManifest = (manifest: AnimationQueueManifest): string =>
  `${JSON.stringify(parseAnimationQueueManifest(manifest), null, 1)}\n`;
