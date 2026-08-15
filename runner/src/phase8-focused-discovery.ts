// Phase 8B S2 focused discovery: four bounded OpenAlex searches plus three CiNii snapshot searches.

import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, renameSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { canonicalJson, canonicalJsonBytes, sha256Bytes } from "./gate4-evidence.ts";
import { buildCiNiiSparql, readOpenAlexKeyFile } from "./phase8-search-protocol-successor.ts";
import { verifyPhase8SearchSuccessorBundle } from "./phase8-search-protocol-successor-verify.ts";

const OPENALEX_QUERIES = [
  { id: "snow-growth", text: "\"snow crystal growth\" experiment" },
  { id: "ice-growth-supersaturation", text: "\"ice crystal growth\" supersaturation experiment" },
  { id: "ice-sublimation", text: "\"ice crystal sublimation\" experiment" },
  { id: "artificial-snow", text: "\"artificial snow crystal\" growth" },
] as const;

const CINII_QUERIES = [
  { id: "artificial-snow-ja", text: "人工雪 雪結晶 成長 実験" },
  { id: "facet-rate-ja", text: "氷晶 成長速度 過飽和度 測定" },
  { id: "habit-growth-ja", text: "雪結晶 晶癖 成長 実験" },
] as const;

const PROTOCOL_DIRECTORY = "evidence/phase8b-search-protocol-v2";
const PROTOCOL_INDEX_SHA256 = "2ffc196ed74611d8dd34d7b69566c7209ad31edb27d7243e19db82a7cc119116";
const TEXT_DECODER = new TextDecoder("utf-8", { fatal: true });
const RESULT_CAP = 500;

type JsonObject = Record<string, unknown>;

function object(value: unknown, label: string): JsonObject {
  if (value === null || typeof value !== "object" || Array.isArray(value)) throw new Error(`${label} must be an object`);
  return value as JsonObject;
}

function parseJson(bytes: Uint8Array, label: string): JsonObject {
  try { return object(JSON.parse(TEXT_DECODER.decode(bytes)), label); }
  catch (error) { throw new Error(`${label} is invalid JSON: ${error instanceof Error ? error.message : String(error)}`); }
}

function writeOnce(path: string, bytes: Uint8Array): void {
  if (existsSync(path)) throw new Error(`refusing to overwrite ${path}`);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, bytes, { flag: "wx" });
}

function appendRecord(path: string, value: unknown): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${canonicalJson(value)}\n`, { flag: existsSync(path) ? "a" : "wx" });
}

function atomicWrite(path: string, bytes: Uint8Array): void {
  mkdirSync(dirname(path), { recursive: true });
  const temporary = `${path}.tmp-${process.pid}-${randomUUID()}`;
  writeFileSync(temporary, bytes, { flag: "wx" });
  renameSync(temporary, path);
}

function redact(value: string, key: string): string {
  return value.replaceAll(key, "REDACTED").replaceAll(encodeURIComponent(key), "REDACTED");
}

function sleep(milliseconds: number): Promise<void> {
  return new Promise((accept) => setTimeout(accept, milliseconds));
}

function openAlexUrl(query: string, cursor: string, key: string): string {
  const url = new URL("https://api.openalex.org/works");
  url.searchParams.set("search", query);
  url.searchParams.set("filter", "to_publication_date:2026-08-11");
  url.searchParams.set("sort", "publication_date:asc");
  url.searchParams.set("per_page", "100");
  url.searchParams.set("cursor", cursor);
  url.searchParams.set("select", "id,doi,title,publication_date,type,authorships,primary_location,open_access,cited_by_count,referenced_works,is_retracted");
  url.searchParams.set("api_key", key);
  return url.toString();
}

async function fetchBytes(url: string, init: RequestInit): Promise<{ response: Response; bytes: Uint8Array }> {
  const response = await fetch(url, { ...init, signal: AbortSignal.timeout(120_000) });
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes.byteLength > 64 * 1024 * 1024) throw new Error("focused response exceeded 64 MiB");
  return { response, bytes };
}

async function runOpenAlex(rawRoot: string, key: string): Promise<JsonObject[]> {
  const summaries: JsonObject[] = [];
  for (const query of OPENALEX_QUERIES) {
    let cursor = "*";
    let page = 0;
    let expectedTotal: number | null = null;
    let resultCount = 0;
    let requestCount = 0;
    let costUsd = 0;
    let state = "complete";
    let blocker: string | null = null;
    const identifiers = new Set<string>();
    while (cursor.length > 0) {
      page += 1;
      requestCount += 1;
      const url = openAlexUrl(query.text, cursor, key);
      const startedAtUtc = new Date().toISOString();
      let response: Response;
      let bytes: Uint8Array;
      try {
        ({ response, bytes } = await fetchBytes(url, { headers: { accept: "application/json" } }));
      } catch (error) {
        state = "bounded-open";
        blocker = redact(error instanceof Error ? error.message : String(error), key);
        break;
      }
      const ordinal = String(page).padStart(3, "0");
      writeOnce(join(rawRoot, "openalex", query.id, `page-${ordinal}.json`), bytes);
      appendRecord(join(rawRoot, "response-ledger.jsonl"), {
        schema: "phase8b-focused-response-v1",
        provider: "openalex",
        queryId: query.id,
        query: query.text,
        page,
        countedSearch: true,
        startedAtUtc,
        finishedAtUtc: new Date().toISOString(),
        requestUrl: redact(url, key),
        httpStatus: response.status,
        responseByteLength: bytes.byteLength,
        responseSha256: sha256Bytes(bytes),
        rateLimitRemaining: response.headers.get("x-ratelimit-remaining"),
      });
      if (response.status !== 200) {
        state = "bounded-open";
        blocker = `HTTP ${response.status}`;
        break;
      }
      const value = parseJson(bytes, `OpenAlex ${query.id} page ${page}`);
      const meta = object(value.meta, "OpenAlex meta");
      if (!Number.isSafeInteger(meta.count) || Number(meta.count) < 0 || !Array.isArray(value.results)) {
        state = "bounded-open";
        blocker = "invalid OpenAlex result envelope";
        break;
      }
      const total = Number(meta.count);
      costUsd += typeof meta.cost_usd === "number" ? meta.cost_usd : 0;
      if (expectedTotal === null) expectedTotal = total;
      else if (expectedTotal !== total) {
        state = "bounded-open";
        blocker = `OpenAlex total changed from ${expectedTotal} to ${total}`;
        break;
      }
      for (const raw of value.results) {
        const result = object(raw, "OpenAlex result");
        if (typeof result.id !== "string" || identifiers.has(result.id)) {
          state = "bounded-open";
          blocker = "missing or duplicate OpenAlex work ID";
          break;
        }
        identifiers.add(result.id);
        resultCount += 1;
        appendRecord(join(rawRoot, "private-leads.jsonl"), {
          schema: "phase8b-focused-lead-v1",
          provider: "openalex",
          queryId: query.id,
          position: resultCount,
          identifier: result.id,
          doi: result.doi ?? null,
          title: result.title ?? null,
          publicationDate: result.publication_date ?? null,
          rawResponseSha256: sha256Bytes(bytes),
          disposition: "pending-scope-screen",
        });
      }
      if (blocker !== null) break;
      if (total > RESULT_CAP) {
        state = "bounded-open";
        blocker = `focused precision cap exceeded: ${total} > ${RESULT_CAP}`;
        break;
      }
      const next = meta.next_cursor;
      if (next === null) cursor = "";
      else if (typeof next === "string" && next.length > 0 && resultCount < total) cursor = next;
      else if (resultCount >= total) cursor = "";
      else {
        state = "bounded-open";
        blocker = "OpenAlex continuation missing";
        break;
      }
      if (cursor.length > 0) await sleep(125);
    }
    if (state === "complete" && expectedTotal !== resultCount) {
      state = "bounded-open";
      blocker = `OpenAlex result count ${resultCount} differs from ${expectedTotal ?? "missing"}`;
    }
    summaries.push({ provider: "openalex", queryId: query.id, query: query.text, state, requestCount, resultCount, expectedTotal, costUsd, blocker });
    atomicWrite(join(rawRoot, "live-summary.json"), canonicalJsonBytes(summaries));
  }
  return summaries;
}

function ciniiBody(query: string, cursor: string | null): string {
  return new URLSearchParams({
    query: buildCiNiiSparql(query, cursor, 101),
    format: "application/sparql-results+json",
    timeout: "30000",
  }).toString();
}

async function runCiNii(rawRoot: string, pacingMs: number): Promise<JsonObject[]> {
  const summaries: JsonObject[] = [];
  for (const query of CINII_QUERIES) {
    let cursor: string | null = null;
    let page = 0;
    let requestCount = 0;
    let resultCount = 0;
    let state = "complete";
    let blocker: string | null = null;
    const identifiers = new Set<string>();
    while (true) {
      page += 1;
      requestCount += 1;
      const startedAtUtc = new Date().toISOString();
      let response: Response;
      let bytes: Uint8Array;
      try {
        ({ response, bytes } = await fetchBytes("https://cinii.kgraph.jp/sparql", {
          method: "POST",
          headers: {
            accept: "application/sparql-results+json",
            "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
          },
          body: ciniiBody(query.text, cursor),
          redirect: "manual",
        }));
      } catch (error) {
        state = "bounded-open";
        blocker = error instanceof Error ? error.message : String(error);
        break;
      }
      const ordinal = String(page).padStart(3, "0");
      writeOnce(join(rawRoot, "cinii", query.id, `page-${ordinal}.json`), bytes);
      appendRecord(join(rawRoot, "response-ledger.jsonl"), {
        schema: "phase8b-focused-response-v1",
        provider: "cinii",
        queryId: query.id,
        query: query.text,
        page,
        countedSearch: true,
        startedAtUtc,
        finishedAtUtc: new Date().toISOString(),
        httpStatus: response.status,
        responseByteLength: bytes.byteLength,
        responseSha256: sha256Bytes(bytes),
      });
      const mediaType = response.headers.get("content-type")?.split(";", 1)[0]?.trim().toLowerCase();
      if (response.status !== 200 || mediaType !== "application/sparql-results+json") {
        state = "bounded-open";
        blocker = `CiNii transport differs: HTTP ${response.status}, ${mediaType ?? "missing media type"}`;
        break;
      }
      const value = parseJson(bytes, `CiNii ${query.id} page ${page}`);
      const bindings = object(value.results, "CiNii results").bindings;
      if (!Array.isArray(bindings) || bindings.length > 101) {
        state = "bounded-open";
        blocker = "invalid CiNii binding envelope";
        break;
      }
      const pageIdentifiers: string[] = [];
      for (const raw of bindings) {
        const article = object(object(raw, "CiNii binding").article, "CiNii article");
        const identifier = article.value;
        if (article.type !== "uri" || typeof identifier !== "string" || !identifier.startsWith("https://cir.nii.ac.jp/crid/") || !identifier.endsWith(".rdf")) {
          state = "bounded-open";
          blocker = "invalid CiNii CRID URI";
          break;
        }
        pageIdentifiers.push(identifier);
      }
      if (blocker !== null) break;
      for (let index = 1; index < pageIdentifiers.length; index += 1) {
        if ((pageIdentifiers[index - 1] as string) >= (pageIdentifiers[index] as string)) {
          state = "bounded-open";
          blocker = "CiNii result order is not strict";
          break;
        }
      }
      if (blocker !== null) break;
      const retained = pageIdentifiers.slice(0, 100);
      for (const identifier of retained) {
        if (identifiers.has(identifier)) {
          state = "bounded-open";
          blocker = "duplicate CiNii CRID across pages";
          break;
        }
        identifiers.add(identifier);
        resultCount += 1;
        appendRecord(join(rawRoot, "private-leads.jsonl"), {
          schema: "phase8b-focused-lead-v1",
          provider: "cinii",
          queryId: query.id,
          position: resultCount,
          identifier,
          doi: null,
          title: null,
          publicationDate: null,
          rawResponseSha256: sha256Bytes(bytes),
          disposition: "pending-private-rdf-enrichment",
        });
      }
      if (blocker !== null || pageIdentifiers.length <= 100) break;
      cursor = retained[retained.length - 1] as string;
      if (resultCount >= RESULT_CAP) {
        state = "bounded-open";
        blocker = `focused precision cap reached: ${RESULT_CAP}`;
        break;
      }
      await sleep(pacingMs);
    }
    summaries.push({ provider: "cinii", queryId: query.id, query: query.text, state, requestCount, resultCount, expectedTotal: null, costUsd: 0, blocker });
    atomicWrite(join(rawRoot, "live-summary.json"), canonicalJsonBytes(summaries));
    await sleep(pacingMs);
  }
  return summaries;
}

function keyAbsentFromTree(root: string, key: string): boolean {
  const needles = [Buffer.from(key), Buffer.from(encodeURIComponent(key))];
  const visit = (directory: string): boolean => readdirSync(directory, { withFileTypes: true }).every((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return visit(path);
    if (!entry.isFile() || entry.isSymbolicLink()) return true;
    const bytes = readFileSync(path);
    return needles.every((needle) => bytes.indexOf(needle) === -1);
  });
  return visit(root);
}

export async function runFocusedDiscovery(
  repositoryRoot: string,
  rawRoot: string,
  key: string,
  options: { readonly ciniiPacingMs?: number } = {},
): Promise<JsonObject> {
  const protocolDirectory = resolve(repositoryRoot, PROTOCOL_DIRECTORY);
  verifyPhase8SearchSuccessorBundle(protocolDirectory, repositoryRoot);
  const indexBytes = new Uint8Array(readFileSync(join(protocolDirectory, "artifact-index.json")));
  if (sha256Bytes(indexBytes) !== PROTOCOL_INDEX_SHA256) throw new Error("S1a protocol index drift");
  if (existsSync(rawRoot)) throw new Error(`raw root already exists: ${rawRoot}`);
  mkdirSync(rawRoot, { recursive: true });
  const startedAtUtc = new Date().toISOString();
  writeOnce(join(rawRoot, "run.json"), canonicalJsonBytes({
    schema: "phase8b-focused-discovery-run-v1",
    countedSearch: true,
    startedAtUtc,
    protocolArtifactIndexSha256: PROTOCOL_INDEX_SHA256,
    openAlexQueries: OPENALEX_QUERIES,
    ciniiQueries: CINII_QUERIES,
    resultCapPerQuery: RESULT_CAP,
    responseRetention: "private-NAS-plus-hash",
    runtimeSecretsRetained: false,
  }));
  const [openAlex, cinii] = await Promise.all([runOpenAlex(rawRoot, key), runCiNii(rawRoot, options.ciniiPacingMs ?? 3_000)]);
  const summaries = [...openAlex, ...cinii];
  const keyAbsent = keyAbsentFromTree(rawRoot, key);
  if (!keyAbsent) throw new Error("OpenAlex key bytes entered focused discovery artifacts");
  const report = {
    schema: "phase8b-focused-discovery-report-v1",
    state: summaries.some((summary) => summary.state !== "complete") ? "bounded-open" : "complete",
    countedSearch: true,
    startedAtUtc,
    finishedAtUtc: new Date().toISOString(),
    queryCount: summaries.length,
    completeQueryCount: summaries.filter((summary) => summary.state === "complete").length,
    boundedOpenQueryCount: summaries.filter((summary) => summary.state !== "complete").length,
    requestCount: summaries.reduce((sum, summary) => sum + Number(summary.requestCount), 0),
    resultCount: summaries.reduce((sum, summary) => sum + Number(summary.resultCount), 0),
    openAlexCostUsd: openAlex.reduce((sum, summary) => sum + Number(summary.costUsd), 0),
    runtimeSecretsRetained: false,
    keyAbsenceScanPassed: keyAbsent,
    summaries,
  };
  writeOnce(join(rawRoot, "run-report.json"), canonicalJsonBytes(report));
  return report;
}

async function main(): Promise<void> {
  const rawIndex = process.argv.indexOf("--raw-root");
  const keyIndex = process.argv.indexOf("--openalex-key-file");
  if (rawIndex < 0 || keyIndex < 0 || process.argv[rawIndex + 1] === undefined || process.argv[keyIndex + 1] === undefined) {
    throw new Error("usage: phase8-focused-discovery.ts --raw-root PATH --openalex-key-file PATH");
  }
  const key = readOpenAlexKeyFile(process.argv[keyIndex + 1] as string);
  try {
    const repositoryRoot = fileURLToPath(new URL("../..", import.meta.url));
    const report = await runFocusedDiscovery(repositoryRoot, resolve(process.argv[rawIndex + 1] as string), key);
    process.stdout.write(`PHASE8B FOCUSED SEARCH state=${String(report.state)} queries=${String(report.queryCount)} complete=${String(report.completeQueryCount)} requests=${String(report.requestCount)} results=${String(report.resultCount)}\n`);
  } catch (error) {
    throw new Error(redact(error instanceof Error ? error.message : String(error), key));
  }
}

if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) await main();
