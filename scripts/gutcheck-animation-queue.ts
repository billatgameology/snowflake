// Plan and execute portable animation batches selected in app/gutcheck-index.html.
//
//   node scripts/gutcheck-animation-queue.ts plan --queue <selection.json> --batches 2
//   node scripts/gutcheck-animation-queue.ts run --batch <batch-a.json> --dry-run
//   node scripts/gutcheck-animation-queue.ts run --batch <batch-a.json> --nas-stage
//
// A NAS output root is allowed only below _control/staging/gutcheck-animation/. Completed
// immutable publication remains a separate decision-0051 transaction after batches reconcile.

import { gzipSync } from "node:zlib";
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { fileURLToPath } from "node:url";
import { basename, isAbsolute, join, relative, resolve, sep } from "node:path";
import { spawnSync } from "node:child_process";

import {
  animationQueueSourceRecordMatches,
  parseAnimationQueueManifest,
  type AnimationQueueItem,
  type AnimationQueueManifest,
  type AnimationQueueSettings,
} from "../app/src/gutcheck-animation-queue.ts";
import {
  decideNasCatalogServePath,
  decodeNasRequestPath,
  parseNasAssetCatalogV1,
  resolveContainedRegularFile,
} from "./nas-asset-lib.ts";
import { detectNasMount } from "./nas-root.ts";

const REPO = resolve(import.meta.dirname, "..");
const CATALOG = parseNasAssetCatalogV1(readFileSync(join(REPO, "docs/nas-assets.json"), "utf8"));
export const ANIMATION_BATCH_FORMAT = "gutcheck-animation-batch-v1" as const;

export interface AnimationBatchManifest {
  readonly format: typeof ANIMATION_BATCH_FORMAT;
  readonly queueId: string;
  readonly sourceQueue: string;
  readonly createdAt: string;
  readonly batch: { readonly index: number; readonly count: number; readonly label: string };
  readonly settings: AnimationQueueSettings;
  readonly items: readonly AnimationQueueItem[];
}

const argument = (argv: readonly string[], name: string, fallback?: string): string | undefined => {
  const index = argv.indexOf(`--${name}`);
  return index >= 0 ? argv[index + 1] : fallback;
};

const positiveInteger = (raw: string | undefined, label: string): number => {
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 1) throw new Error(`${label} must be a positive integer`);
  return value;
};

const batchLabel = (index: number): string => {
  let value = index + 1;
  let label = "";
  while (value > 0) {
    value--;
    label = String.fromCharCode(97 + (value % 26)) + label;
    value = Math.floor(value / 26);
  }
  return `batch-${label}`;
};

export const partitionAnimationQueue = (
  manifest: AnimationQueueManifest,
  batchCount: number,
  sourceQueue: string,
  createdAt: string,
): AnimationBatchManifest[] => {
  if (!Number.isInteger(batchCount) || batchCount < 1) {
    throw new Error("batch count must be a positive integer");
  }
  const buckets = Array.from({ length: batchCount }, () => [] as AnimationQueueItem[]);
  [...manifest.items]
    .sort((left, right) => left.id.localeCompare(right.id))
    .forEach((item, index) => buckets[index % batchCount]!.push(item));
  return buckets.map((items, index) => ({
    format: ANIMATION_BATCH_FORMAT,
    queueId: manifest.queueId,
    sourceQueue,
    createdAt,
    batch: { index, count: batchCount, label: batchLabel(index) },
    settings: manifest.settings,
    items,
  }));
};

const parseBatch = (value: unknown): AnimationBatchManifest => {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("animation batch must be an object");
  }
  const batch = value as Record<string, unknown>;
  const expected = ["batch", "createdAt", "format", "items", "queueId", "settings", "sourceQueue"];
  if (Object.keys(batch).sort().join("\0") !== expected.sort().join("\0")) {
    throw new Error("animation batch has unrecognized or missing keys");
  }
  if (batch["format"] !== ANIMATION_BATCH_FORMAT) throw new Error("unexpected animation batch format");
  const part = batch["batch"] as Record<string, unknown>;
  if (
    part === null ||
    typeof part !== "object" ||
    Array.isArray(part) ||
    Object.keys(part).sort().join("\0") !== ["count", "index", "label"].sort().join("\0")
  ) {
    throw new Error("animation batch.batch is invalid");
  }
  const count = positiveInteger(String(part["count"]), "animation batch.batch.count");
  const index = Number(part["index"]);
  if (!Number.isInteger(index) || index < 0 || index >= count) {
    throw new Error("animation batch.batch.index is outside its count");
  }
  if (part["label"] !== batchLabel(index)) throw new Error("animation batch.batch.label is not canonical");
  const queueLike = parseAnimationQueueManifest({
    format: "gutcheck-animation-queue-v1",
    queueId: batch["queueId"],
    createdAt: batch["createdAt"],
    sourceIndexGenerated: batch["createdAt"],
    settings: batch["settings"],
    items: batch["items"],
  });
  if (typeof batch["sourceQueue"] !== "string" || batch["sourceQueue"] === "") {
    throw new Error("animation batch.sourceQueue must be a non-empty string");
  }
  return {
    format: ANIMATION_BATCH_FORMAT,
    queueId: queueLike.queueId,
    sourceQueue: batch["sourceQueue"],
    createdAt: queueLike.createdAt,
    batch: { index, count, label: part["label"] as string },
    settings: queueLike.settings,
    items: queueLike.items,
  };
};

const assertTrackedSourceRecords = (items: readonly AnimationQueueItem[]): void => {
  for (const item of items) {
    const path = resolve(REPO, item.spec);
    const evidenceRoot = resolve(REPO, "evidence/gutcheck-gg-realism");
    if (
      !animationQueueSourceRecordMatches(item.id, item.spec) ||
      !path.startsWith(`${evidenceRoot}${sep}`) ||
      !existsSync(path)
    ) {
      throw new Error(`${item.id}: tracked source record is absent or escapes the evidence root`);
    }
  }
};

const stringifyBatch = (batch: AnimationBatchManifest): string => `${JSON.stringify(batch, null, 1)}\n`;

const plan = (argv: readonly string[]): void => {
  const queueArg = argument(argv, "queue");
  if (queueArg === undefined) throw new Error("plan requires --queue <selection.json>");
  const queuePath = resolve(queueArg);
  const queue = parseAnimationQueueManifest(JSON.parse(readFileSync(queuePath, "utf8")) as unknown);
  assertTrackedSourceRecords(queue.items);
  const batches = positiveInteger(argument(argv, "batches", "2"), "--batches");
  const outDir = resolve(
    argument(argv, "out-dir", join("out/gutcheck-animation-queue", queue.queueId)) as string,
  );
  mkdirSync(outDir, { recursive: true });
  const planned = partitionAnimationQueue(queue, batches, basename(queuePath), new Date().toISOString());
  const assigned = new Set<string>();
  for (const batch of planned) {
    for (const item of batch.items) {
      if (assigned.has(item.id)) throw new Error(`planner duplicated ${item.id}`);
      assigned.add(item.id);
    }
    const path = join(outDir, `${batch.batch.label}.json`);
    writeFileSync(path, stringifyBatch(batch));
    writeFileSync(
      join(outDir, `RUN-${batch.batch.label}.cmd`),
      `@echo off\r\nnode scripts\\gutcheck-animation-queue.ts run --batch "%~dp0${batch.batch.label}.json" --nas-stage %*\r\n`,
    );
    writeFileSync(
      join(outDir, `RUN-${batch.batch.label}.sh`),
      `#!/bin/sh\nnode scripts/gutcheck-animation-queue.ts run --batch "$(dirname "$0")/${batch.batch.label}.json" --nas-stage "$@"\n`,
    );
    console.log(`${batch.batch.label}: ${batch.items.length} item(s) -> ${path}`);
    console.log(
      `  node scripts/gutcheck-animation-queue.ts run --batch ${JSON.stringify(path)}`,
    );
    console.log(
      `  node scripts/gutcheck-animation-queue.ts run --batch ${JSON.stringify(path)} --nas-stage`,
    );
  }
  if (assigned.size !== queue.items.length) throw new Error("planner did not assign every queue item");
};

const sourceMesh = (item: AnimationQueueItem): string => {
  const decoded = decodeNasRequestPath(item.mesh.slice("/nas".length));
  if (decoded.kind !== "ok") throw new Error(`${item.id}: mesh URL is malformed`);
  const decision = decideNasCatalogServePath(CATALOG, decoded.path);
  if (decision.kind !== "allow") throw new Error(`${item.id}: mesh is not catalogue-authorized`);
  const nasRoot = detectNasMount();
  if (nasRoot === null) throw new Error("the marked NAS share is not attached");
  const resolution = resolveContainedRegularFile(nasRoot, decoded.path, decision.matchedPrefix);
  if (resolution.kind !== "ok") throw new Error(`${item.id}: mesh cannot be opened: ${resolution.reason}`);
  return resolution.path;
};

const assertOutputRoot = (outputRoot: string, queueId: string, batch: string): void => {
  if (!isAbsolute(outputRoot)) throw new Error("output root must resolve to an absolute path");
  const localRoot = resolve(REPO, "out/gutcheck-animation-queue", queueId, batch);
  if (outputRoot === localRoot || outputRoot.startsWith(`${localRoot}${sep}`)) return;
  const nasRoot = detectNasMount();
  if (nasRoot === null) throw new Error("non-local output requires the marked NAS share");
  const rel = relative(resolve(nasRoot), outputRoot).replaceAll("\\", "/");
  const required = `_control/staging/gutcheck-animation/${queueId}/${batch}`;
  if (rel !== required && !rel.startsWith(`${required}/`)) {
    throw new Error(`NAS output must stay below ${required}`);
  }
};

const runChecked = (command: string, args: string[], cwd = REPO): void => {
  const executable =
    process.platform === "win32" && (command === "npm" || command === "npx")
      ? `${command}.cmd`
      : command;
  const result = spawnSync(executable, args, {
    cwd,
    stdio: "inherit",
  });
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} failed with status ${String(result.status)}`);
  }
};

const sceneFor = (item: AnimationQueueItem, meshFile: string, settings: AnimationQueueSettings): unknown => ({
  format: "gutcheck-scene-v1",
  title: `${item.label} — web turntable`,
  look: settings.look,
  frameExtent: 620,
  duration: settings.durationSeconds,
  fps: settings.fps,
  source: { mesh: `../data/meshes/${meshFile}` },
  camera: [
    { t: 0, tilt: 12, yaw: 0, zoom: 1.08 },
    { t: 4, tilt: 32, yaw: 120, zoom: 1.14 },
    { t: 8, tilt: 22, yaw: 240, zoom: 1.1 },
    { t: 12, tilt: 12, yaw: 360, zoom: 1.08 },
  ],
  captions: [
    { t0: 0.4, t1: 3.2, text: item.label },
    { t0: 9.2, t1: 11.8, text: "Model output, unvalidated" },
  ],
});

const execute = (argv: readonly string[]): void => {
  const batchArg = argument(argv, "batch");
  if (batchArg === undefined) throw new Error("run requires --batch <batch.json>");
  const batchPath = resolve(batchArg);
  const batch = parseBatch(JSON.parse(readFileSync(batchPath, "utf8")) as unknown);
  assertTrackedSourceRecords(batch.items);
  const defaultRoot = join("out/gutcheck-animation-queue", batch.queueId, batch.batch.label);
  const explicitOutput = argument(argv, "output-root");
  const nasStage = argv.includes("--nas-stage");
  if (explicitOutput !== undefined && nasStage) {
    throw new Error("choose either --output-root or --nas-stage, not both");
  }
  const nasRoot = nasStage ? detectNasMount() : null;
  if (nasStage && nasRoot === null) throw new Error("the marked NAS share is not attached");
  const outputRoot = resolve(
    nasStage
      ? join(
          nasRoot as string,
          "_control/staging/gutcheck-animation",
          batch.queueId,
          batch.batch.label,
        )
      : (explicitOutput ?? defaultRoot),
  );
  assertOutputRoot(outputRoot, batch.queueId, batch.batch.label);
  const dryRun = argv.includes("--dry-run");
  console.log(
    `${batch.batch.label}: ${batch.items.length} item(s), ${batch.settings.width}x${batch.settings.height}, ` +
      `${batch.settings.durationSeconds}s @ ${batch.settings.fps} fps, ${batch.settings.meshFormat} + ` +
      `${batch.settings.transportEncoding}`,
  );
  for (const item of batch.items) console.log(`  ${dryRun ? "would render" : "render"} ${item.id}`);
  if (dryRun || batch.items.length === 0) return;

  const siteDir = join(outputRoot, "site");
  const webMeshDir = join(outputRoot, "web/meshes");
  const sceneDir = join(outputRoot, "scenes");
  const videoDir = join(outputRoot, "videos");
  const recordDir = join(outputRoot, "records");
  for (const dir of [siteDir, webMeshDir, sceneDir, videoDir, recordDir]) mkdirSync(dir, { recursive: true });
  runChecked("npx", ["vite", "build", "--outDir", siteDir, "--emptyOutDir"], join(REPO, "app"));
  mkdirSync(join(siteDir, "data/meshes"), { recursive: true });

  const gl = argument(argv, "gl", process.platform === "win32" ? "d3d11" : "swiftshader") as string;
  if (gl !== "d3d11" && gl !== "swiftshader") throw new Error("--gl must be d3d11 or swiftshader");
  for (const [jobIndex, item] of batch.items.entries()) {
    const recordPath = join(recordDir, `${item.id}.json`);
    const videoPath = join(videoDir, `${item.id}.mp4`);
    const webMeshPath = join(webMeshDir, `${item.id}-v2q.bin`);
    const compressedPath = `${webMeshPath}.gz`;
    if (existsSync(recordPath) && existsSync(videoPath) && existsSync(webMeshPath) && existsSync(compressedPath)) {
      console.log(`skip ${item.id} — complete outputs exist`);
      continue;
    }
    const inputMesh = sourceMesh(item);
    runChecked(process.execPath, ["scripts/gutcheck-mesh-quantize.ts", inputMesh, webMeshPath]);
    writeFileSync(compressedPath, gzipSync(readFileSync(webMeshPath), { level: 9 }));
    const stagedMesh = join(siteDir, "data/meshes", basename(webMeshPath));
    cpSync(webMeshPath, stagedMesh);
    const scenePath = join(sceneDir, `${item.id}.json`);
    writeFileSync(scenePath, `${JSON.stringify(sceneFor(item, basename(webMeshPath), batch.settings), null, 1)}\n`);
    const frameDir = join(outputRoot, "frames", item.id);
    runChecked(process.execPath, [
      "app/scripts/scene-capture.mjs",
      "--scene", scenePath,
      "--site", siteDir,
      "--out-dir", frameDir,
      "--width", String(batch.settings.width),
      "--height", String(batch.settings.height),
      "--port", String(8300 + batch.batch.index * 100 + jobIndex),
      "--mp4", videoPath,
      "--gl", gl,
      "--video-bitrate", "10M",
    ]);
    const videoBytes = statSync(videoPath).size;
    if (videoBytes >= 20_000_000) {
      throw new Error(`${item.id}: encoded video is ${videoBytes} bytes, not below 20 MB; frames retained`);
    }
    const result = {
      format: "gutcheck-animation-result-v1",
      queueId: batch.queueId,
      batch: batch.batch,
      item,
      settings: batch.settings,
      sourceMeshBytes: statSync(inputMesh).size,
      webMeshBytes: statSync(webMeshPath).size,
      webMeshGzipBytes: statSync(compressedPath).size,
      videoBytes,
      videoBelow20MB: true,
      completedAt: new Date().toISOString(),
    };
    writeFileSync(recordPath, `${JSON.stringify(result, null, 1)}\n`);
    rmSync(frameDir, { recursive: true, force: true });
    console.log(`ok ${item.id}: video ${(videoBytes / 1e6).toFixed(1)} MB`);
  }
};

const main = (): void => {
  const [command, ...argv] = process.argv.slice(2);
  if (command === "plan") plan(argv);
  else if (command === "run") execute(argv);
  else throw new Error("usage: gutcheck-animation-queue.ts plan|run [options]");
};

if (process.argv[1] !== undefined && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
