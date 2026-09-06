import {
  closeSync,
  createReadStream,
  lstatSync,
  mkdirSync,
  readFileSync,
  realpathSync,
  renameSync,
  writeFileSync,
} from "node:fs";
import type { IncomingMessage, ServerResponse } from "node:http";
import { isIP } from "node:net";
import { dirname, isAbsolute, relative, resolve, sep } from "node:path";
import { defineConfig, type Plugin } from "vite";
import { growthStudyAssets } from "./growth-study-assets.ts";

import {
  decideNasCatalogServePath,
  decodeNasRequestPath,
  openContainedRegularFile,
  parseNasAssetCatalogV1,
  type NasAssetCatalogV1,
  type OpenedContainedRegularFileResolution,
} from "../scripts/nas-asset-lib.ts";
import { detectNasMount } from "../scripts/nas-root.ts";
import {
  animationQueueRenderMatches,
  animationQueueSourceRecordMatches,
  parseAnimationQueueManifest,
  stringifyAnimationQueueManifest,
  type AnimationQueueItem,
} from "./src/gutcheck-animation-queue.ts";

const REPOSITORY_ROOT = resolve(import.meta.dirname, "..");
const CANONICAL_APP_ROOT = resolve(REPOSITORY_ROOT, "app");
const CANONICAL_PUBLIC_ROOT = resolve(CANONICAL_APP_ROOT, "public");
export const NAS_ASSET_CATALOG_PATH = resolve(REPOSITORY_ROOT, "docs/nas-assets.json");

/** Load the tracked serving authority. Missing, malformed, and unknown-field catalogues fail startup. */
export const loadNasAssetCatalog = (catalogPath = NAS_ASSET_CATALOG_PATH): NasAssetCatalogV1 => {
  let source: string;
  try {
    source = readFileSync(catalogPath, "utf8");
  } catch (error) {
    throw new Error(
      `cannot load NAS asset catalogue ${catalogPath}: ${error instanceof Error ? error.message : String(error)}`,
      { cause: error },
    );
  }
  return parseNasAssetCatalogV1(source);
};

// Parsing is deliberately eager. Vite must not start with a missing or invalid serving authority.
export const NAS_ASSET_CATALOG = loadNasAssetCatalog();

// The gut-check index page reads out/gutcheck-gg-realism/index.json, which lives outside the
// Vite root. The page cannot know where the repo is, and the previous answer was to hardcode
// the author's macOS path in app/src/gutcheck-index.ts — dead on every other machine (found on
// the 2026-08-06 transfer). Serve it at a fixed URL instead: the path is resolved here, where
// the repo location is known, and the page just asks for /gutcheck-index.json.
//
// Only the index itself needs this. Bulk files referenced by a current index use the governed
// /nas route below. Dev only — a static bundle from scripts/gutcheck-build-site.ts carries its
// own ./data/index.json next to the page.
const outIndexJson = resolve(REPOSITORY_ROOT, "out/gutcheck-gg-realism/index.json");
const animationSelectionJson = resolve(
  REPOSITORY_ROOT,
  "out/gutcheck-animation-queue/selection.json",
);
const gutcheckFigurePreviewRoot = resolve(REPOSITORY_ROOT, "out/gutcheck-figure-previews");
const FIGURE_PREVIEW_URL = /^\/gutcheck-figure-previews\/(fig\d+(?:v\d+)?)\.png$/u;

type UnknownRecord = Record<string, unknown>;

const indexRecord = (value: unknown, label: string): UnknownRecord => {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
  return value as UnknownRecord;
};

const indexString = (value: unknown, label: string): string => {
  if (typeof value !== "string" || value === "" || /[\u0000-\u001f\u007f]/u.test(value)) {
    throw new Error(`${label} must be a non-empty control-free string`);
  }
  return value;
};

const indexKeys = (
  value: UnknownRecord,
  required: readonly string[],
  optional: readonly string[],
  label: string,
): void => {
  const actual = Object.keys(value);
  for (const key of required) {
    if (!Object.hasOwn(value, key)) throw new Error(`${label}.${key} is required`);
  }
  const allowed = new Set([...required, ...optional]);
  const unexpected = actual.find((key) => !allowed.has(key));
  if (unexpected !== undefined) throw new Error(`${label}.${unexpected} is not recognized`);
};

const authorizeDecodedNasIndexUrl = (
  value: string,
  catalog: NasAssetCatalogV1,
  label: string,
): void => {
  if (!value.startsWith("/nas/") || value.includes("?") || value.includes("#") || value.includes("\\")) {
    throw new Error(`${label} must be one catalogue-authorized /nas URL`);
  }
  const decision = decideNasCatalogServePath(catalog, value.slice("/nas/".length));
  if (decision.kind !== "allow") throw new Error(`${label} is not catalogue-authorized`);
};

const authorizeEncodedNasIndexUrl = (
  value: string,
  catalog: NasAssetCatalogV1,
  label: string,
): void => {
  if (!value.startsWith("/nas/") || value.includes("?") || value.includes("#") || value.includes("\\")) {
    throw new Error(`${label} must be one catalogue-authorized /nas URL`);
  }
  const decoded = decodeNasRequestPath(value.slice("/nas".length));
  if (decoded.kind !== "ok" || decideNasCatalogServePath(catalog, decoded.path).kind !== "allow") {
    throw new Error(`${label} is not catalogue-authorized`);
  }
};

const validateIndexHref = (value: unknown, catalog: NasAssetCatalogV1, label: string): void => {
  const href = indexString(value, label);
  if (FIGURE_PREVIEW_URL.test(href)) return;
  if (href.startsWith("/nas/")) {
    authorizeEncodedNasIndexUrl(href, catalog, label);
    return;
  }
  if (!href.startsWith("/") || href.startsWith("//") || href.includes("\\") || href.includes("#")) {
    throw new Error(`${label} must be a root-relative project URL`);
  }
  const parsed = new URL(href, "http://127.0.0.1");
  if (parsed.origin !== "http://127.0.0.1" || parsed.pathname !== "/spike-gg-realism.html") {
    throw new Error(`${label} must target the governed viewer or /nas`);
  }
  const allowedParameters = new Set(["look", "interactive", "mesh", "manifest", "frameExtent", "frame"]);
  const seen = new Set<string>();
  for (const key of parsed.searchParams.keys()) {
    if (!allowedParameters.has(key) || seen.has(key)) throw new Error(`${label} has an unsafe or duplicate query key`);
    seen.add(key);
  }
  const look = parsed.searchParams.get("look");
  if (look === null || !/^[a-z0-9-]+$/u.test(look)) throw new Error(`${label} has an invalid look`);
  const interactive = parsed.searchParams.get("interactive");
  if (interactive !== null && interactive !== "1") throw new Error(`${label} has an invalid interactive value`);
  for (const numeric of ["frameExtent", "frame"] as const) {
    const parameter = parsed.searchParams.get(numeric);
    if (parameter !== null && !/^\d+$/u.test(parameter)) throw new Error(`${label} has an invalid ${numeric}`);
  }
  const mesh = parsed.searchParams.get("mesh");
  const manifest = parsed.searchParams.get("manifest");
  if ((mesh === null) === (manifest === null)) throw new Error(`${label} must name exactly one mesh or manifest`);
  authorizeDecodedNasIndexUrl(mesh ?? manifest as string, catalog, `${label} asset`);
};

const validateIndexItem = (value: unknown, catalog: NasAssetCatalogV1, label: string): void => {
  const item = indexRecord(value, label);
  indexKeys(item, ["href", "label"], ["image", "note"], label);
  indexString(item.label, `${label}.label`);
  validateIndexHref(item.href, catalog, `${label}.href`);
  if (item.image !== undefined) {
    const image = indexString(item.image, `${label}.image`);
    if (!FIGURE_PREVIEW_URL.test(image)) {
      authorizeEncodedNasIndexUrl(image, catalog, `${label}.image`);
    }
  }
  if (item.note !== undefined) indexString(item.note, `${label}.note`);
};

/** Refuse a stale index before its links can recreate a private /@fs or absolute-path bypass. */
export const validateGutcheckIndexForServing = (source: string, catalog: NasAssetCatalogV1): void => {
  if (Buffer.byteLength(source) > 8 * 1024 * 1024) throw new Error("gutcheck index exceeds 8 MiB");
  let value: unknown;
  try {
    value = JSON.parse(source) as unknown;
  } catch {
    throw new Error("gutcheck index is not JSON");
  }
  const index = indexRecord(value, "gutcheck index");
  indexKeys(index, ["generated", "root", "sections"], [], "gutcheck index");
  const generated = indexString(index.generated, "gutcheck index.generated");
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/u.test(generated)) {
    throw new Error("gutcheck index.generated must be a UTC timestamp");
  }
  if (index.root !== "out/gutcheck-gg-realism") {
    throw new Error("gutcheck index.root must be the logical gutcheck root");
  }
  if (!Array.isArray(index.sections)) throw new Error("gutcheck index.sections must be an array");
  for (const [sectionIndex, sectionValue] of index.sections.entries()) {
    const label = `gutcheck index.sections[${sectionIndex}]`;
    const section = indexRecord(sectionValue, label);
    indexKeys(section, ["items", "title"], ["note", "rows"], label);
    indexString(section.title, `${label}.title`);
    if (section.note !== undefined) indexString(section.note, `${label}.note`);
    if (!Array.isArray(section.items)) throw new Error(`${label}.items must be an array`);
    section.items.forEach((item, itemIndex) => validateIndexItem(item, catalog, `${label}.items[${itemIndex}]`));
    if (section.rows === undefined) continue;
    if (!Array.isArray(section.rows)) throw new Error(`${label}.rows must be an array`);
    for (const [rowIndex, rowValue] of section.rows.entries()) {
      const rowLabel = `${label}.rows[${rowIndex}]`;
      const row = indexRecord(rowValue, rowLabel);
      indexKeys(row, ["comparisons", "label", "viewers"], ["animation", "queue"], rowLabel);
      indexString(row.label, `${rowLabel}.label`);
      for (const key of ["comparisons", "viewers"] as const) {
        if (!Array.isArray(row[key])) throw new Error(`${rowLabel}.${key} must be an array`);
        row[key].forEach((item, itemIndex) => validateIndexItem(item, catalog, `${rowLabel}.${key}[${itemIndex}]`));
      }
      if (row.animation !== undefined) validateIndexItem(row.animation, catalog, `${rowLabel}.animation`);
      if (row.queue !== undefined) {
        const queue = indexRecord(row.queue, `${rowLabel}.queue`);
        indexKeys(queue, ["id", "mesh", "render", "spec"], [], `${rowLabel}.queue`);
        const id = indexString(queue.id, `${rowLabel}.queue.id`);
        if (!/^[a-z0-9][a-z0-9.-]{0,127}$/u.test(id)) {
          throw new Error(`${rowLabel}.queue.id is not portable`);
        }
        authorizeEncodedNasIndexUrl(
          indexString(queue.mesh, `${rowLabel}.queue.mesh`),
          catalog,
          `${rowLabel}.queue.mesh`,
        );
        const render = indexString(queue.render, `${rowLabel}.queue.render`);
        if (!animationQueueRenderMatches(id, render)) {
          throw new Error(`${rowLabel}.queue.render must match its generated preview identity`);
        }
        if (render.startsWith("/nas/")) {
          authorizeEncodedNasIndexUrl(render, catalog, `${rowLabel}.queue.render`);
        }
        if (!animationQueueSourceRecordMatches(id, indexString(queue.spec, `${rowLabel}.queue.spec`))) {
          throw new Error(`${rowLabel}.queue.spec must match its tracked source identity`);
        }
      }
    }
  }
};

export const createGutcheckIndexHandler = (
  indexPath: string,
  catalog: NasAssetCatalogV1,
): NasRequestHandler => (request, response) => {
  const method = request.method ?? "GET";
  if (method !== "GET" && method !== "HEAD") {
    response.statusCode = 405;
    response.setHeader("allow", "GET, HEAD");
    response.end();
    return;
  }
  let source: string;
  try {
    source = readFileSync(indexPath, "utf8");
  } catch {
    // Not generated yet: 404 so the page shows its "run gutcheck-build-index.ts" notice.
    response.statusCode = 404;
    response.end();
    return;
  }
  try {
    validateGutcheckIndexForServing(source, catalog);
  } catch {
    response.statusCode = 409;
    response.setHeader("cache-control", "no-store");
    response.end("gutcheck index is stale or unsafe; rebuild it");
    return;
  }
  const body = Buffer.from(source);
  response.setHeader("content-type", "application/json");
  response.setHeader("cache-control", "no-cache");
  response.setHeader("x-content-type-options", "nosniff");
  response.setHeader("content-length", body.byteLength);
  response.end(method === "HEAD" ? undefined : body);
};

const gutcheckIndexHandler = createGutcheckIndexHandler(outIndexJson, NAS_ASSET_CATALOG);

const gutcheckIndexJson: Plugin = {
  name: "gutcheck-index-json",
  apply: "serve",
  configureServer(server) {
    server.middlewares.use("/gutcheck-index.json", gutcheckIndexHandler);
  },
};

export const createGutcheckFigurePreviewHandler = (
  previewRoot: string,
): NasRequestHandler => (request, response) => {
  const method = request.method ?? "GET";
  if (method !== "GET" && method !== "HEAD") {
    response.statusCode = 405;
    response.setHeader("allow", "GET, HEAD");
    response.end();
    return;
  }
  let requestPath: string;
  try {
    requestPath = decodeURIComponent((request.url ?? "").split("?", 1)[0] as string);
  } catch {
    forbidden(response);
    return;
  }
  const match = /^\/(fig\d+(?:v\d+)?)\.png$/u.exec(requestPath);
  if (match === null) {
    forbidden(response);
    return;
  }
  const filename = `${match[1]}.png`;
  const opened = openContainedRegularFile(previewRoot, filename, filename);
  if (opened.kind === "forbidden") {
    forbidden(response);
    return;
  }
  if (opened.kind === "not-found") {
    response.statusCode = 404;
    response.end();
    return;
  }
  response.setHeader("content-type", "image/png");
  response.setHeader("content-length", opened.byteLength);
  response.setHeader("cache-control", "no-cache");
  response.setHeader("x-content-type-options", "nosniff");
  if (method === "HEAD") {
    closeQuietly(opened.fd);
    response.end();
    return;
  }
  pipeNasFile(response, opened.path, opened.fd, { start: 0, end: opened.byteLength - 1 });
};

const gutcheckFigurePreviews: Plugin = {
  name: "gutcheck-local-figure-previews",
  apply: "serve",
  configureServer(server) {
    server.middlewares.use(
      "/gutcheck-figure-previews",
      createGutcheckFigurePreviewHandler(gutcheckFigurePreviewRoot),
    );
  },
};

const queueCandidatesFromIndex = (indexPath: string, catalog: NasAssetCatalogV1): Map<string, AnimationQueueItem> => {
  const source = readFileSync(indexPath, "utf8");
  validateGutcheckIndexForServing(source, catalog);
  const value = JSON.parse(source) as {
    sections: Array<{ rows?: Array<{ label: string; queue?: Omit<AnimationQueueItem, "label"> }> }>;
  };
  const candidates = new Map<string, AnimationQueueItem>();
  for (const section of value.sections) {
    for (const row of section.rows ?? []) {
      if (row.queue === undefined) continue;
      candidates.set(row.queue.id, { ...row.queue, label: row.label });
    }
  }
  return candidates;
};

const assertQueueMatchesIndex = (
  items: readonly AnimationQueueItem[],
  indexPath: string,
  catalog: NasAssetCatalogV1,
): void => {
  const candidates = queueCandidatesFromIndex(indexPath, catalog);
  for (const item of items) {
    const candidate = candidates.get(item.id);
    if (
      candidate === undefined ||
      candidate.label !== item.label ||
      candidate.mesh !== item.mesh ||
      candidate.render !== item.render ||
      candidate.spec !== item.spec
    ) {
      throw new Error(`queue item ${item.id} is not an exact candidate in the current index`);
    }
  }
};

export const createGutcheckAnimationSelectionHandler = (
  selectionPath: string,
  indexPath: string,
  catalog: NasAssetCatalogV1,
): ((request: IncomingMessage, response: ServerResponse) => void) => (request, response) => {
  const method = request.method ?? "GET";
  response.setHeader("cache-control", "no-store");
  response.setHeader("x-content-type-options", "nosniff");
  if (method === "GET" || method === "HEAD") {
    let source: string;
    try {
      source = readFileSync(selectionPath, "utf8");
      const manifest = parseAnimationQueueManifest(JSON.parse(source) as unknown);
      assertQueueMatchesIndex(manifest.items, indexPath, catalog);
      source = stringifyAnimationQueueManifest(manifest);
    } catch {
      response.statusCode = 404;
      response.end();
      return;
    }
    const body = Buffer.from(source);
    response.setHeader("content-type", "application/json");
    response.setHeader("content-length", body.byteLength);
    response.end(method === "HEAD" ? undefined : body);
    return;
  }
  if (method !== "PUT") {
    response.statusCode = 405;
    response.setHeader("allow", "GET, HEAD, PUT");
    response.end();
    return;
  }
  if (!(request.headers["content-type"] ?? "").toLowerCase().startsWith("application/json")) {
    response.statusCode = 415;
    response.end("content-type must be application/json");
    return;
  }
  const chunks: Buffer[] = [];
  let bytes = 0;
  let refused = false;
  request.on("data", (chunk: Buffer) => {
    if (refused) return;
    bytes += chunk.byteLength;
    if (bytes > 1024 * 1024) {
      refused = true;
      response.statusCode = 413;
      response.end("animation queue exceeds 1 MiB");
      request.destroy();
      return;
    }
    chunks.push(chunk);
  });
  request.on("end", () => {
    if (refused) return;
    try {
      const manifest = parseAnimationQueueManifest(
        JSON.parse(Buffer.concat(chunks).toString("utf8")) as unknown,
      );
      assertQueueMatchesIndex(manifest.items, indexPath, catalog);
      const source = stringifyAnimationQueueManifest(manifest);
      mkdirSync(dirname(selectionPath), { recursive: true });
      const temporary = `${selectionPath}.${String(process.pid)}.tmp`;
      writeFileSync(temporary, source, { encoding: "utf8", flag: "w" });
      renameSync(temporary, selectionPath);
      response.statusCode = 204;
      response.end();
    } catch (error) {
      response.statusCode = 400;
      response.end(error instanceof Error ? error.message : String(error));
    }
  });
};

const gutcheckAnimationSelection: Plugin = {
  name: "gutcheck-animation-selection",
  apply: "serve",
  configureServer(server) {
    server.middlewares.use(
      "/gutcheck-animation-selection.json",
      createGutcheckAnimationSelectionHandler(
        animationSelectionJson,
        outIndexJson,
        NAS_ASSET_CATALOG,
      ),
    );
  },
};

const NAS_TYPES: Record<string, string> = {
  ".png": "image/png",
  ".json": "application/json",
  ".bin": "application/octet-stream",
  ".mp4": "video/mp4",
};

const closeQuietly = (fd: number): void => {
  try {
    closeSync(fd);
  } catch {
    // The descriptor may already have been closed by a response or stream error.
  }
};

export const pipeNasFile = (
  res: ServerResponse,
  path: string,
  fd: number,
  options?: { start: number; end: number },
): void => {
  let stream: ReturnType<typeof createReadStream>;
  try {
    stream = createReadStream(path, { ...options, fd, autoClose: true });
  } catch {
    closeQuietly(fd);
    if (!res.headersSent) {
      res.removeHeader("content-length");
      res.removeHeader("content-range");
      res.statusCode = 503;
      res.end("NAS read failed (share detached?)");
    } else {
      res.destroy();
    }
    return;
  }
  // The share can fail after the descriptor is safely opened. Handle that ordinary I/O error
  // on the response instead of emitting an unhandled stream error that can take down the dev
  // server.
  stream.on("error", () => {
    if (res.headersSent) {
      res.destroy();
      return;
    }
    res.removeHeader("content-length");
    res.removeHeader("content-range");
    res.statusCode = 503;
    res.end("NAS read failed (share detached?)");
  });
  // If the browser abandons a large/rate-limited response, pipe() does not automatically
  // destroy the source. Explicitly do so or its NAS descriptor can remain open indefinitely.
  const onResponseClose = (): void => {
    if (!res.writableFinished) stream.destroy();
  };
  res.once("close", onResponseClose);
  stream.once("close", () => res.off("close", onResponseClose));
  stream.pipe(res);
};

type RangeResolution =
  | { readonly kind: "none" }
  | { readonly kind: "ok"; readonly start: number; readonly end: number }
  | { readonly kind: "unsatisfiable" };

const resolveByteRange = (header: string | undefined, size: number): RangeResolution => {
  if (header === undefined) return { kind: "none" };
  const match = /^bytes=(\d*)-(\d*)$/u.exec(header);
  // RFC range support is optional. Ignore unsupported units, malformed syntax, and multi-ranges.
  if (match === null || (match[1] === "" && match[2] === "")) return { kind: "none" };
  if (!Number.isSafeInteger(size) || size < 0) return { kind: "unsatisfiable" };
  const first = match[1] === "" ? null : Number(match[1]);
  const last = match[2] === "" ? null : Number(match[2]);
  if (
    (first !== null && (!Number.isSafeInteger(first) || first < 0)) ||
    (last !== null && (!Number.isSafeInteger(last) || last < 0)) ||
    size === 0
  ) {
    return { kind: "unsatisfiable" };
  }
  if (first === null) {
    if (last === null || last === 0) return { kind: "unsatisfiable" };
    return { kind: "ok", start: Math.max(0, size - last), end: size - 1 };
  }
  const end = last === null ? size - 1 : Math.min(last, size - 1);
  if (first >= size || first > end) return { kind: "unsatisfiable" };
  return { kind: "ok", start: first, end };
};

export interface NasRequestHandlerOptions {
  readonly catalog: NasAssetCatalogV1;
  readonly resolveNasRoot: () => string | null;
  readonly openFile?: (
    root: string,
    relativePath: string,
    allowedPrefix: string,
  ) => OpenedContainedRegularFileResolution;
}

export type NasRequestHandler = (request: IncomingMessage, response: ServerResponse) => void;

const forbidden = (response: ServerResponse): void => {
  // One empty response for every catalogue denial avoids becoming a private-path existence oracle.
  response.statusCode = 403;
  response.end();
};

/**
 * Build an injectable /nas handler. Its order is security-significant: method, one decode,
 * catalogue authorization, mount resolution, then descriptor-bound filesystem open.
 */
export const createNasRequestHandler = ({
  catalog,
  resolveNasRoot,
  openFile = openContainedRegularFile,
}: NasRequestHandlerOptions): NasRequestHandler => (request, response) => {
  const method = request.method ?? "GET";
  if (method !== "GET" && method !== "HEAD") {
    response.statusCode = 405;
    response.setHeader("allow", "GET, HEAD");
    response.end();
    return;
  }

  const decoded = decodeNasRequestPath(request.url ?? "");
  if (decoded.kind !== "ok") {
    forbidden(response);
    return;
  }
  const decision = decideNasCatalogServePath(catalog, decoded.path);
  if (decision.kind !== "allow") {
    forbidden(response);
    return;
  }

  let root: string | null;
  try {
    root = resolveNasRoot();
  } catch {
    response.statusCode = 503;
    response.end("NAS mount resolution failed");
    return;
  }
  if (root === null) {
    response.statusCode = 404;
    response.end("no NAS share attached (see docs/nas-ledger.md)");
    return;
  }

  let opened: OpenedContainedRegularFileResolution;
  try {
    opened = openFile(root, decoded.path, decision.matchedPrefix);
  } catch {
    response.statusCode = 503;
    response.end("NAS open failed");
    return;
  }
  if (opened.kind === "forbidden") {
    forbidden(response);
    return;
  }
  if (opened.kind === "not-found") {
    response.statusCode = 404;
    response.end("not found (NAS attached?)");
    return;
  }

  const extensionAt = decoded.path.lastIndexOf(".");
  const extension = extensionAt < 0 ? "" : decoded.path.slice(extensionAt).toLowerCase();
  response.setHeader("content-type", NAS_TYPES[extension] ?? "application/octet-stream");
  response.setHeader("x-content-type-options", "nosniff");
  response.setHeader("accept-ranges", "bytes");
  const range = resolveByteRange(request.headers.range, opened.byteLength);
  if (range.kind === "unsatisfiable") {
    closeQuietly(opened.fd);
    response.statusCode = 416;
    response.setHeader("content-range", `bytes */${opened.byteLength}`);
    response.end();
    return;
  }
  if (range.kind === "ok") {
    response.statusCode = 206;
    response.setHeader("content-range", `bytes ${range.start}-${range.end}/${opened.byteLength}`);
    response.setHeader("content-length", range.end - range.start + 1);
    if (method === "HEAD") {
      closeQuietly(opened.fd);
      response.end();
      return;
    }
    pipeNasFile(response, opened.path, opened.fd, { start: range.start, end: range.end });
    return;
  }

  response.setHeader("content-length", opened.byteLength);
  if (method === "HEAD") {
    closeQuietly(opened.fd);
    response.end();
    return;
  }
  if (opened.byteLength === 0) {
    closeQuietly(opened.fd);
    response.end();
    return;
  }
  // The collection may still be in its catalogued working state. Bind a full response to the
  // descriptor size already published in Content-Length so a concurrent append cannot spill
  // additional bytes into this response; a truncation still surfaces as a stream failure.
  pipeNasFile(response, opened.path, opened.fd, { start: 0, end: opened.byteLength - 1 });
};

const nasRequestHandler = createNasRequestHandler({
  catalog: NAS_ASSET_CATALOG,
  // Keep mount inspection after catalogue authorization. A denied path never touches the share.
  resolveNasRoot: () => detectNasMount(),
});

const nasStatic: Plugin = {
  name: "gutcheck-nas-static",
  apply: "serve",
  configureServer(server) {
    server.middlewares.use("/nas", nasRequestHandler);
  },
};

/** Refuse wildcard, LAN, hostname, and Vite's boolean --host forms. */
export const assertLoopbackViteHost = (host: string | boolean | undefined, label: string): void => {
  const isNumericLoopback =
    typeof host === "string" &&
    ((isIP(host) === 4 && host.startsWith("127.")) || (isIP(host) === 6 && host === "::1"));
  if (!isNumericLoopback) {
    throw new Error(`${label} must be a numeric loopback address; refusing ${String(host)}`);
  }
};

/** Reject command/API overrides that would move Vite's raw-file roots outside this policy. */
export const assertCanonicalViteRoots = (root: string, publicDir: string | false): void => {
  if (resolve(root) !== CANONICAL_APP_ROOT) {
    throw new Error("Vite root must remain the canonical app directory");
  }
  if (publicDir !== false && resolve(publicDir) !== CANONICAL_PUBLIC_ROOT) {
    throw new Error("Vite publicDir must remain canonical or be disabled");
  }
};

const loopbackOnly: Plugin = {
  name: "loopback-only-development-server",
  configResolved(config) {
    // This sees the fully merged config, including command-line --host overrides.
    assertLoopbackViteHost(config.server.host, "server.host");
    assertLoopbackViteHost(config.preview.host, "preview.host");
    assertCanonicalViteRoots(config.root, config.publicDir);
  },
};

type ViteNext = (error?: unknown) => void;
type ViteBoundaryHandler = (request: IncomingMessage, response: ServerResponse, next: ViteNext) => void;

const nativePathIsWithin = (root: string, candidate: string): boolean => {
  const rel = relative(root, candidate);
  return rel === "" || (!rel.startsWith(`..${sep}`) && rel !== ".." && !isAbsolute(rel));
};

const pathHasOnlyOrdinaryComponents = (root: string, candidate: string): boolean => {
  const rel = relative(root, candidate);
  if (rel === "" || !nativePathIsWithin(root, candidate)) return false;
  let current = root;
  const parts = rel.split(sep);
  try {
    for (let index = 0; index < parts.length; index += 1) {
      current = resolve(current, parts[index] as string);
      const status = lstatSync(current);
      if (status.isSymbolicLink()) return false;
      if (index < parts.length - 1 && !status.isDirectory()) return false;
      if (index === parts.length - 1 && (!status.isFile() || status.nlink !== 1)) return false;
    }
    return true;
  } catch {
    return false;
  }
};

/**
 * Vite's lexical fs.allow/fs.deny checks follow repository-local symlinks. Guard local file
 * requests first so a link in app/ cannot expose research/, out/, the NAS, or an arbitrary file
 * outside the checkout. Vite still performs transformation after this persistent-path check;
 * hostile concurrent replacement by another local writer remains outside this loopback-only
 * development-server boundary.
 */
export const createViteLocalFileBoundary = (
  repositoryRoot = REPOSITORY_ROOT,
  appRoot = resolve(repositoryRoot, "app"),
  publicRoot: string | false = resolve(appRoot, "public"),
): ViteBoundaryHandler => {
  const realRepositoryRoot = realpathSync.native(repositoryRoot);
  const realAppRoot = realpathSync.native(appRoot);
  const denyRepositoryPath = (absolute: string): boolean => {
    if (!nativePathIsWithin(repositoryRoot, absolute)) return true;
    const rel = relative(repositoryRoot, absolute);
    const components = rel.split(sep).map((component) => component.normalize("NFC").toLowerCase());
    const first = components[0];
    if (first === "research" || first === "out") return true;
    const final = components.at(-1) ?? "";
    if (
      components.includes(".git") ||
      final === ".env" ||
      final.startsWith(".env.") ||
      final.endsWith(".crt") ||
      final.endsWith(".pem")
    ) return true;
    if (!pathHasOnlyOrdinaryComponents(repositoryRoot, absolute)) return true;
    let real: string;
    try {
      real = realpathSync.native(absolute);
    } catch {
      return true;
    }
    return !nativePathIsWithin(realRepositoryRoot, real);
  };

  return (request, response, next) => {
    const rawPath = (request.url ?? "").split("?", 1)[0] as string;
    let decoded: string;
    try {
      decoded = decodeURIComponent(rawPath);
    } catch {
      forbidden(response);
      return;
    }
    if (decoded.startsWith("/@fs/")) {
      let native = decoded.slice("/@fs/".length);
      if (process.platform === "win32" && /^\/[A-Za-z]:\//u.test(native)) native = native.slice(1);
      if (!isAbsolute(native) || denyRepositoryPath(resolve(native))) {
        forbidden(response);
        return;
      }
      next();
      return;
    }

    // Root-relative requests may be served directly from app/ (or app/public/) without /@fs.
    // Check existing candidates so those routes cannot follow the same persistent symlink attack.
    if (decoded.startsWith("/") && !decoded.startsWith("//")) {
      const relativeUrl = decoded.slice(1);
      const bases = publicRoot === false ? [realAppRoot] : [realAppRoot, resolve(publicRoot)];
      for (const base of bases) {
        const candidate = resolve(base, relativeUrl);
        if (!nativePathIsWithin(base, candidate)) {
          forbidden(response);
          return;
        }
        let status;
        try {
          status = lstatSync(candidate);
        } catch {
          continue;
        }
        if (status.isDirectory() && !status.isSymbolicLink()) {
          const indexCandidate = resolve(candidate, "index.html");
          try {
            lstatSync(indexCandidate);
          } catch {
            continue;
          }
          if (denyRepositoryPath(indexCandidate)) {
            forbidden(response);
            return;
          }
          continue;
        }
        if (denyRepositoryPath(candidate)) {
          forbidden(response);
          return;
        }
      }
    }
    next();
  };
};

const viteLocalFileBoundary: Plugin = {
  name: "repository-local-file-boundary",
  apply: "serve",
  configureServer(server) {
    server.middlewares.use(createViteLocalFileBoundary(
      REPOSITORY_ROOT,
      server.config.root,
      server.config.publicDir,
    ));
  },
  configurePreviewServer(server) {
    const previewRoot = resolve(server.config.root, server.config.build.outDir);
    server.middlewares.use(createViteLocalFileBoundary(REPOSITORY_ROOT, previewRoot, false));
  },
};

// Module workers only (the solver worker); "es" keeps import statements legal inside the
// bundled worker. Build target es2022 matches the repo's tsconfig target.
export default defineConfig({
  plugins: [
    loopbackOnly,
    viteLocalFileBoundary,
    gutcheckIndexJson,
    gutcheckFigurePreviews,
    gutcheckAnimationSelection,
    growthStudyAssets(REPOSITORY_ROOT),
    nasStatic,
  ],
  worker: { format: "es" },
  build: {
    target: "es2022",
    // three.js is a single large dependency; the default 500 kB warning is noise here.
    chunkSizeWarningLimit: 1500,
    // Multi-page: the Phase 3 instrument plus the gut-check spike pages, so `vite build`
    // emits a static site usable from any plain host (Phase 7 prep Track A,
    // docs/plans/explore-phase7-prep.md).
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, "index.html"),
        gutcheckIndex: resolve(import.meta.dirname, "gutcheck-index.html"),
        spike: resolve(import.meta.dirname, "spike-gg-realism.html"),
        dendriteStyles: resolve(import.meta.dirname, "dendrite-styles.html"),
      },
    },
  },
  server: {
    host: "127.0.0.1",
    port: 5173,
    strictPort: false,
    // Large artifacts live on the governed NAS collections. Do NOT add a NAS mount to Vite's
    // lexical /@fs allow-list: that would bypass catalogue authorization and descriptor-bound
    // opening. Only this repository belongs in /@fs.
    fs: {
      strict: true,
      allow: [REPOSITORY_ROOT],
      // Setting deny replaces Vite's defaults, so preserve them while blocking both local
      // staging trees. The validated custom index endpoint above is the sole out/ exception.
      deny: [".env", ".env.*", "*.{crt,pem}", "**/.git/**", "**/research/**", "**/out/**"],
    },
  },
  preview: { host: "127.0.0.1", port: 4173, strictPort: false },
});
