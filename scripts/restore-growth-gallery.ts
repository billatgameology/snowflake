// Recover only the registered compact gallery inputs. No solver or NAS publication runs.
import { createHash, randomUUID } from "node:crypto";
import { closeSync, lstatSync, mkdirSync, readFileSync, renameSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { loadStudyManifest } from "../app/growth-study-assets.ts";
import type { GrowthStudyEntry } from "../app/src/growth-study-library.ts";
import { assertPortableShareRelativePath, openContainedRegularFile, parseNasAssetCatalogV1 } from "./nas-asset-lib.ts";
import { loadBoundCollectionSelection, readDescriptorCapped } from "./nas-asset-selection-lib.ts";
import { detectNasMount } from "./nas-root.ts";
import { isCliEntry } from "./cli-entry.ts";

const COLLECTION = "render-worktrees-closeout@2026-09-04";
const RUN_B_URL = "https://nivogenesis.web.app/growth/run-b-growth-v1.bin";
const RUN_B_BYTES = 7_695_060;
const digest = (bytes: Uint8Array): string => createHash("sha256").update(bytes).digest("hex");

export function galleryInputPath(entry: GrowthStudyEntry): string {
  const path = entry.source.startsWith("named-") ? entry.sourcePath : `out/growth-assets/${entry.id}-growth-v1.bin`;
  if (typeof path !== "string" || !path.startsWith("out/")) throw new Error(`Invalid gallery destination: ${entry.id}`);
  assertPortableShareRelativePath(path);
  return path;
}

export function readVerifiedGalleryInput(root: string, path: string, sha256: string, maximum: number): Buffer | null {
  const opened = openContainedRegularFile(root, path, "out");
  if (opened.kind === "not-found") return null;
  if (opened.kind !== "ok") throw new Error(`Gallery input refused: ${path}: ${opened.reason}`);
  try {
    const bytes = readDescriptorCapped(opened.fd, maximum, path);
    if (digest(bytes) !== sha256) throw new Error(`Existing gallery input differs: ${path}; preserve it before retrying`);
    return bytes;
  } finally { closeSync(opened.fd); }
}

export function placeGalleryInput(root: string, path: string, bytes: Buffer, sha256: string): "restored" | "verified" {
  assertPortableShareRelativePath(path);
  if (!path.startsWith("out/") || digest(bytes) !== sha256) throw new Error(`Gallery recovery identity mismatch: ${path}`);
  if (readVerifiedGalleryInput(root, path, sha256, bytes.length)) return "verified";
  let folder = resolve(root);
  for (const part of path.split("/").slice(0, -1)) {
    folder = resolve(folder, part);
    try {
      const stat = lstatSync(folder);
      if (!stat.isDirectory() || stat.isSymbolicLink()) throw new Error(`Gallery destination is not an ordinary directory: ${folder}`);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      mkdirSync(folder);
    }
  }
  const target = resolve(root, path);
  const temporary = resolve(dirname(target), `.restore-${randomUUID()}`);
  writeFileSync(temporary, bytes, { flag: "wx" });
  try {
    if (readVerifiedGalleryInput(root, path, sha256, bytes.length)) return "verified";
    // One operator owns this restore; verify absence immediately before same-directory placement.
    renameSync(temporary, target);
  } finally {
    try { unlinkSync(temporary); }
    catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; }
  }
  if (readVerifiedGalleryInput(root, path, sha256, bytes.length)?.length !== bytes.length) throw new Error(`Gallery copy failed: ${path}`);
  return "restored";
}

async function fetchRunB(): Promise<Buffer> {
  const response = await fetch(RUN_B_URL);
  if (!response.ok || response.body === null) throw new Error(`Run B recovery returned HTTP ${response.status}`);
  const chunks: Uint8Array[] = [];
  let length = 0;
  const reader = response.body.getReader();
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      length += chunk.value.byteLength;
      if (length > RUN_B_BYTES) { await reader.cancel(); throw new Error("Run B recovery exceeds the registered byte length"); }
      chunks.push(chunk.value);
    }
  } finally { reader.releaseLock(); }
  if (length !== RUN_B_BYTES) throw new Error("Run B recovery is truncated");
  return Buffer.concat(chunks);
}

export async function restoreGrowthGallery(root: string, checkOnly = false) {
  const catalogue = parseNasAssetCatalogV1(readFileSync(resolve(root, "docs/nas-assets.json"), "utf8"));
  const selection = loadBoundCollectionSelection({ catalogue, collection: COLLECTION, repoRoot: root, shareRoot: null });
  if (selection.state !== "active") throw new Error("Gallery recovery collection is not active");
  const entries = loadStudyManifest(root).entries;
  const rows: Array<{ id: string; path: string; sha256: string; bytes: number; status: "restored" | "verified" | "missing" }> = [];
  let mount: string | null = null;
  for (const entry of entries) {
    const path = galleryInputPath(entry);
    const maximum = entry.eventCount * 8 + 1_048_580;
    let bytes = readVerifiedGalleryInput(root, path, entry.sourceSha256, maximum);
    if (bytes) { rows.push({ id: entry.id, path, sha256: entry.sourceSha256, bytes: bytes.length, status: "verified" }); continue; }
    if (checkOnly) { rows.push({ id: entry.id, path, sha256: entry.sourceSha256, bytes: 0, status: "missing" }); continue; }
    if (entry.source === "run-b") bytes = await fetchRunB();
    else {
      const matches = selection.files.filter(row => row.sha256 === entry.sourceSha256);
      if (matches.length !== 1) throw new Error(`Gallery source identity is missing or ambiguous: ${entry.id}`);
      const row = matches[0]!;
      mount ??= detectNasMount();
      if (!mount) throw new Error("Attach the marked NAS and set VCC_NAS_ROOT to restore missing gallery inputs");
      const opened = openContainedRegularFile(mount, row.sharePath, selection.ownershipRoot);
      if (opened.kind !== "ok") throw new Error(`NAS gallery source unavailable: ${entry.id}`);
      try { bytes = readDescriptorCapped(opened.fd, Math.min(row.bytes, maximum), entry.id); }
      finally { closeSync(opened.fd); }
      if (bytes.length !== row.bytes) throw new Error(`NAS gallery source length differs: ${entry.id}`);
    }
    const status = placeGalleryInput(root, path, bytes, entry.sourceSha256);
    rows.push({ id: entry.id, path, sha256: entry.sourceSha256, bytes: bytes.length, status });
  }
  return { checkedAt: new Date().toISOString(), collection: COLLECTION, runBSource: RUN_B_URL,
    files: rows.length, available: rows.filter(row => row.status !== "missing").length,
    restored: rows.filter(row => row.status === "restored").length,
    bytes: rows.reduce((sum, row) => sum + row.bytes, 0), rows };
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  let root = resolve(import.meta.dirname, "..");
  let checkOnly = false;
  for (let index = 0; index < args.length; index++) {
    if (args[index] === "--check") checkOnly = true;
    else if (args[index] === "--root" && args[index + 1]) root = resolve(args[++index]!);
    else throw new Error("Usage: node scripts/restore-growth-gallery.ts [--check] [--root <worktree>]");
  }
  const report = await restoreGrowthGallery(root, checkOnly);
  if (!checkOnly) {
    mkdirSync(resolve(root, "out/growth-gallery"), { recursive: true });
    writeFileSync(resolve(root, "out/growth-gallery/restore.json"), JSON.stringify(report, null, 2) + "\n");
  }
  console.log(JSON.stringify({ files: report.files, available: report.available, restored: report.restored, bytes: report.bytes }));
  if (report.available !== report.files) process.exitCode = 1;
}

if (isCliEntry(import.meta.url)) {
  main().catch(error => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
}
