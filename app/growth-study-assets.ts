// Product-only packaging. Exact registered local inputs; no NAS serving-policy changes.
import { closeSync, readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";
import { resolve } from "node:path";
import type { Plugin } from "vite";
import { openContainedRegularFile } from "../scripts/nas-asset-lib.ts";
import type { GrowthStudyEntry, GrowthStudyLibrary } from "./src/growth-study-library.ts";

export function loadStudyManifest(root: string): GrowthStudyLibrary {
  const library = JSON.parse(readFileSync(resolve(root, "app/data/growth-library.json"), "utf8")) as GrowthStudyLibrary;
  const seen = new Set<string>();
  if (library.format !== "growth-study-library-v1" || !Array.isArray(library.entries)) throw new Error("Invalid growth study manifest");
  for (const entry of library.entries) {
    if (!/^[a-z0-9][a-z0-9-]*$/u.test(entry.id) || seen.has(entry.id) ||
        !["fleet", "run-b"].includes(entry.source) || !/^[a-f0-9]{64}$/u.test(entry.sourceSha256) ||
        !Number.isInteger(entry.eventCount) || entry.eventCount < 1 || entry.eventCount > 2000000 ||
        !Number.isInteger(entry.finalTick) || entry.finalTick < 1 || entry.finalTick > 16777215 ||
        typeof entry.label !== "string" || typeof entry.habit !== "string") throw new Error("Invalid growth study entry");
    seen.add(entry.id);
  }
  if (!seen.has(library.defaultId)) throw new Error("Growth study default is missing");
  return library;
}

function containedBytes(root: string, filename: string, maximum: number): Buffer | null {
  const opened = openContainedRegularFile(root, filename, filename);
  if (opened.kind !== "ok") return null;
  try { return opened.byteLength <= maximum ? readFileSync(opened.fd) : null; }
  finally { closeSync(opened.fd); }
}

export function packageStudy(original: Buffer, entry: GrowthStudyEntry): Buffer | null {
  if (createHash("sha256").update(original).digest("hex") !== entry.sourceSha256) return null;
  const length = original.readUInt32LE(0);
  const header = JSON.parse(original.subarray(4, 4 + length).toString("utf8"));
  if (header.format !== "gutcheck-growth-v1" || header.eventCount !== entry.eventCount || header.finalTick !== entry.finalTick ||
      original.length !== 4 + length + entry.eventCount * 8) throw new Error(`Unexpected source schema: ${entry.id}`);
  const compact = Buffer.from(JSON.stringify({
    format: "dendrite-presentation-v1", eventCount: header.eventCount, finalTick: header.finalTick,
    dims: [header.config.dims.nx, header.config.dims.ny, header.config.dims.nz],
    center: header.config.center, sourceSha256: entry.sourceSha256,
  }));
  const prefix = Buffer.alloc(4);
  prefix.writeUInt32LE(compact.length);
  return Buffer.concat([prefix, compact, original.subarray(4 + length)]);
}

/** Only the named website replay and fleet files can become public presentation bytes. */
export function readStudy(root: string, entry: GrowthStudyEntry): Buffer | null {
  const filename = `${entry.id}-growth-v1.bin`;
  const candidates: Array<[string, string]> = entry.source === "run-b"
    ? [[resolve(root, "../snowcrystal_website/public/growth"), "run-b-growth-v1.bin"]]
    : [[resolve(root, "out/growth-assets"), filename], [resolve(root, "../snowcrystal_website/public/growth/library"), filename]];
  for (const [folder, name] of candidates) {
    const bytes = containedBytes(folder, name, entry.eventCount * 8 + 1048580);
    if (bytes) {
      const prepared = packageStudy(bytes, entry);
      if (prepared) return prepared;
    }
  }
  if (entry.id === "sweep-t1-sharp") {
    const bytes = containedBytes(resolve(root, "app/data"), "dendrite-study.bin", entry.eventCount * 8 + 65540);
    if (bytes) {
      const header = JSON.parse(bytes.subarray(4, 4 + bytes.readUInt32LE(0)).toString("utf8"));
      if (header.sourceSha256 === entry.sourceSha256 && header.eventCount === entry.eventCount) return bytes;
    }
  }
  return null;
}

export function createGrowthStudyHandler(root: string, library = loadStudyManifest(root)) {
  return (request: IncomingMessage, response: ServerResponse): void => {
    response.setHeader("x-content-type-options", "nosniff");
    response.setHeader("cache-control", "no-cache");
    if (!["GET", "HEAD"].includes(request.method ?? "GET")) {
      response.statusCode = 405; response.setHeader("allow", "GET, HEAD"); response.end(); return;
    }
    const path = (request.url ?? "").split("?", 1)[0];
    let bytes: Buffer | null = null;
    try {
      if (path === "/index.json") {
        bytes = Buffer.from(JSON.stringify({ ...library, entries: library.entries.map(entry => ({ ...entry, available: readStudy(root, entry) !== null })) }));
        response.setHeader("content-type", "application/json");
      } else {
        const id = /^\/([a-z0-9][a-z0-9-]*)\.bin$/u.exec(path ?? "")?.[1];
        const entry = library.entries.find(item => item.id === id);
        if (entry) bytes = readStudy(root, entry);
        response.setHeader("content-type", "application/octet-stream");
      }
      if (bytes === null) { response.statusCode = 404; response.end("Growth replay unavailable"); return; }
      response.setHeader("content-length", bytes.length);
      response.end(request.method === "HEAD" ? undefined : bytes);
    } catch {
      response.statusCode = 500; response.end("Unable to prepare this growth replay");
    }
  };
}

export function growthStudyAssets(root: string): Plugin {
  return {
    name: "growth-study-product-assets",
    configureServer(server) { server.middlewares.use("/growth-studies", createGrowthStudyHandler(root)); },
    generateBundle() {
      const library = loadStudyManifest(root);
      const entries = library.entries.map(entry => {
        const bytes = readStudy(root, entry);
        if (bytes) this.emitFile({ type: "asset", fileName: `growth-studies/${entry.id}.bin`, source: bytes });
        return { ...entry, available: bytes !== null };
      });
      this.emitFile({ type: "asset", fileName: "growth-studies/index.json", source: JSON.stringify({ ...library, entries }) });
    },
  };
}
