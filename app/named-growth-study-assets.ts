import { closeSync, readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { resolve } from "node:path";
import { openContainedRegularFile } from "../scripts/nas-asset-lib.ts";
import type { GrowthStudyEntry, GrowthStudyLibrary } from "./src/growth-study-library.ts";
import type { StudyComponent, StudySceneHeader } from "./src/growth-study-data.ts";

export function validNamedStudyPath(path: string): boolean {
  return /^out\/named-crystal-catalog\/final-(resolution-[abc]|compose)-v1\/[a-z0-9-]+\/(growth-v1\.bin|scene\.json)$/u.test(path);
}

export function readNamedStudy(root: string, entry: GrowthStudyEntry, library: GrowthStudyLibrary,
  packageDirect: (bytes: Buffer, entry: GrowthStudyEntry) => Buffer | null): Buffer | null {
  if (!entry.sourcePath || !validNamedStudyPath(entry.sourcePath)) return null;
  const roots = [root, resolve(root, "../snowflake-named-catalog")];
  if (process.env.GROWTH_STUDY_CATALOG_ROOT) roots.unshift(resolve(process.env.GROWTH_STUDY_CATALOG_ROOT));
  const read = (item: GrowthStudyEntry): Buffer | null => {
    if (!item.sourcePath || !validNamedStudyPath(item.sourcePath)) return null;
    for (const folder of roots) {
      const opened = openContainedRegularFile(folder, item.sourcePath, item.sourcePath);
      if (opened.kind !== "ok") continue;
      try {
        if (opened.byteLength > 20000000) continue;
        const bytes = readFileSync(opened.fd);
        if (createHash("sha256").update(bytes).digest("hex") === item.sourceSha256) return bytes;
      } finally { closeSync(opened.fd); }
    }
    return null;
  };
  const original = read(entry);
  if (!original) return null;
  if (entry.source === "named-direct") return packageDirect(original, entry);
  const scene = JSON.parse(original.toString("utf8"));
  if (scene.format !== "growth-scene-v1" || scene.disclosure !== "composed-visualization" || !Array.isArray(scene.components) || scene.components.length > 16) throw new Error("Invalid registered scene");
  const assets: Buffer[] = [];
  const bySha = new Map<string, number>();
  const components: StudyComponent[] = [];
  let eventCount = 0;
  for (const component of scene.components) {
    const source = library.entries.find(item => item.source === "named-direct" && item.sourceSha256 === component.growthAsset.sha256);
    if (!source) throw new Error("Scene references an unregistered component");
    let asset = bySha.get(source.sourceSha256);
    if (asset === undefined) {
      const bytes = read(source);
      if (!bytes) return null;
      if (bytes.length !== component.growthAsset.byteLength) throw new Error("Scene component length mismatch");
      const compact = packageDirect(bytes, source);
      if (!compact) return null;
      asset = assets.length; assets.push(compact); bySha.set(source.sourceSha256, asset);
    }
    components.push({ asset, transform: component.transform, phaseOffset: component.phaseOffset });
    eventCount += source.eventCount;
  }
  if (eventCount !== entry.eventCount || entry.finalTick !== 1) throw new Error("Scene event count mismatch");
  const header: StudySceneHeader = { format: "growth-study-scene-v1", sourceSha256: entry.sourceSha256,
    assets: assets.map(bytes => bytes.length), components,
    camera: { tiltDegrees: scene.camera.tiltDegrees, yawDegrees: scene.camera.yawDegrees } };
  const json = Buffer.from(JSON.stringify(header));
  const prefix = Buffer.alloc(4); prefix.writeUInt32LE(json.length);
  return Buffer.concat([prefix, json, ...assets]);
}
