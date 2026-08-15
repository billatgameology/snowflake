// Phase 8B S1a: narrow route-readiness successor to the accepted S1 protocol.
//
// The accepted v1 bundle remains immutable. This producer reopens that bundle, applies only the
// maker-authorized route changes, and emits one self-contained v2 bundle for S2.

import { randomUUID } from "node:crypto";
import {
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { canonicalJson, canonicalJsonBytes, sha256Bytes } from "./gate4-evidence.ts";
import { verifyPhase8SearchBundle } from "./phase8-search-protocol-verify.ts";

export const PHASE8_SEARCH_SUCCESSOR_OPERATOR = "phase8b-lean-search-protocol-v2" as const;
export const PHASE8_SEARCH_SUCCESSOR_ARTIFACTS = [
  "artifact-index.json",
  "protocol.json",
  "queries.jsonl",
  "report.json",
  "route-query-cells.jsonl",
  "routes.jsonl",
  "smoke-results.jsonl",
] as const;
const PREDECESSOR_DIRECTORY = "evidence/phase8b-search-protocol";
const PREDECESSOR_INDEX = {
  path: `${PREDECESSOR_DIRECTORY}/artifact-index.json`,
  byteLength: 1_131,
  sha256: "8bc12ee92afdcfdf41148cde4ef89029f572007ba3bee338d1a62a38153dace7",
} as const;
const PAYLOAD_NAMES = [
  "protocol.json",
  "queries.jsonl",
  "route-query-cells.jsonl",
  "routes.jsonl",
  "smoke-results.jsonl",
] as const;
const CHANGED_ROUTE_IDS = new Set(["cinii", "crossref", "datacite", "nasa-ntrs"]);
const OPENALEX_PLACEHOLDER = "{{OPENALEX_API_KEY}}";
const TEXT_ENCODER = new TextEncoder();
const TEXT_DECODER = new TextDecoder("utf-8", { fatal: true });

type JsonObject = Record<string, unknown>;

export interface SuccessorSmokeResult {
  readonly schema: "phase8b-route-smoke-v2";
  readonly routeId: string;
  readonly outcome: "succeeded" | "blocked-credential" | "blocked-route" | "removed";
  readonly observedAtUtc: string | null;
  readonly plannedRequestSha256: string | null;
  readonly httpStatus: number | null;
  readonly effectiveUrl: string | null;
  readonly responseByteLength: number | null;
  readonly responseSha256: string | null;
  readonly blocker: string | null;
  readonly countedSearch: false;
}

export interface SearchSuccessorBundle {
  readonly artifacts: ReadonlyMap<string, Uint8Array>;
  readonly routeCount: number;
  readonly queryCount: number;
  readonly routeQueryCellCount: number;
  readonly credentialBlockers: readonly string[];
  readonly routeBlockers: readonly string[];
}

function cloneObject(value: unknown, label: string): JsonObject {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
  return structuredClone(value) as JsonObject;
}

function parseJson(bytes: Uint8Array, label: string): JsonObject {
  let value: unknown;
  try { value = JSON.parse(TEXT_DECODER.decode(bytes)); }
  catch { throw new Error(`${label} is not JSON`); }
  return cloneObject(value, label);
}

function parseJsonLines(bytes: Uint8Array, label: string): JsonObject[] {
  let text: string;
  try { text = TEXT_DECODER.decode(bytes); }
  catch { throw new Error(`${label} is not UTF-8`); }
  if (!text.endsWith("\n")) throw new Error(`${label} lacks final newline`);
  return text.slice(0, -1).split("\n").filter(Boolean).map((line, index) => {
    let value: unknown;
    try { value = JSON.parse(line); }
    catch { throw new Error(`${label}:${index + 1} is not JSON`); }
    return cloneObject(value, `${label}:${index + 1}`);
  });
}

function jsonLines(records: readonly unknown[]): Uint8Array {
  return TEXT_ENCODER.encode(`${records.map((record) => canonicalJson(record)).join("\n")}\n`);
}

function readBundle(directory: string): Map<string, Uint8Array> {
  const artifacts = new Map<string, Uint8Array>();
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (!entry.isFile() || entry.isSymbolicLink()) {
      throw new Error(`bundle entry is not a regular file: ${entry.name}`);
    }
    artifacts.set(entry.name, new Uint8Array(readFileSync(join(directory, entry.name))));
  }
  return artifacts;
}

function predecessor(repositoryRoot: string): Map<string, Uint8Array> {
  const directory = resolve(repositoryRoot, PREDECESSOR_DIRECTORY);
  verifyPhase8SearchBundle(directory, repositoryRoot);
  const artifacts = readBundle(directory);
  const index = artifacts.get("artifact-index.json");
  if (index === undefined || index.byteLength !== PREDECESSOR_INDEX.byteLength || sha256Bytes(index) !== PREDECESSOR_INDEX.sha256) {
    throw new Error("accepted S1 predecessor drift");
  }
  return artifacts;
}

const CINII_DOCUMENTS = [
  { id: "doc-cinii-kg", url: "https://labs.ci.nii.ac.jp/en/detail-knowledgegraph.html", byteLength: 5_184, sha256: "132271676f819be31e5c7b14cfbf47ee892b94b2594d4bfb554d7ff3b591120b" },
  { id: "doc-cinii-labs-terms", url: "https://labs.ci.nii.ac.jp/en/termsofuse.html", byteLength: 10_505, sha256: "a3f6b5237ed6b4e34a57a25bc5345ef6216976c81829dc41fe760c68e71ec606" },
  { id: "doc-cinii-rdf", url: "https://support.nii.ac.jp/en/cir/r_rdf", byteLength: 107_095, sha256: "12ade6a61ff627fb7325264d929965a1ab2cee40faed4ce8aa6fb889ca4ad1fa" },
  { id: "doc-cinii-rights", url: "https://support.nii.ac.jp/en/cinii/copyright", byteLength: 27_906, sha256: "fb03cf2aaf523efd72435f2dff2d2ea631667ff54978aa8d5b37ba47e1e27223" },
] as const;

function ciniiTokens(query: string): readonly string[] {
  if (query !== query.normalize("NFC")) throw new Error("CiNii query is not NFC");
  const tokens = query.split(" ");
  if (tokens.length === 0 || tokens.some((token) => token.length === 0 || /[\u0000-\u001f\u007f'"\\]/u.test(token))) {
    throw new Error("CiNii query contains an unsupported token");
  }
  return tokens;
}

function sparqlString(value: string): string {
  if (/[\u0000-\u001f\u007f"\\]/u.test(value)) throw new Error("unsafe SPARQL string");
  return `"${value}"`;
}

/** Build the exact first-page query. S2 adds only the registered strict keyset cursor filter. */
export function buildCiNiiSparql(canonicalQuery: string, cursor: string | null = null, limit = 101): string {
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 101) throw new Error("CiNii limit differs");
  if (cursor !== null && (!cursor.startsWith("https://cir.nii.ac.jp/crid/") || !cursor.endsWith(".rdf"))) {
    throw new Error("CiNii cursor differs");
  }
  const expression = ciniiTokens(canonicalQuery).map((token) => `'${token}'`).join(" AND ");
  const cursorLine = cursor === null ? "" : `  FILTER(STR(?article) > ${sparqlString(cursor)})\n`;
  return [
    "PREFIX cir: <https://cir.nii.ac.jp/schema/1.0/>",
    "PREFIX dc: <http://purl.org/dc/elements/1.1/>",
    "PREFIX dcterms: <http://purl.org/dc/terms/>",
    "PREFIX foaf: <http://xmlns.com/foaf/0.1/>",
    "SELECT DISTINCT ?article WHERE {",
    "  ?article a cir:Article .",
    "  FILTER(STRSTARTS(STR(?article), \"https://cir.nii.ac.jp/crid/\"))",
    "  FILTER(STRENDS(STR(?article), \".rdf\"))",
    cursorLine.trimEnd(),
    `  { ?article dc:title ?text . ?text bif:contains ${sparqlString(expression)} }`,
    `  UNION { ?article dcterms:alternative ?text . ?text bif:contains ${sparqlString(expression)} }`,
    `  UNION { ?article cir:description ?description . ?description cir:notation ?text . ?text bif:contains ${sparqlString(expression)} }`,
    `  UNION { ?article foaf:topic ?topic . ?topic dc:title ?text . ?text bif:contains ${sparqlString(expression)} }`,
    "}",
    "ORDER BY STR(?article)",
    `LIMIT ${limit}`,
  ].filter((line) => line.length > 0).join("\n");
}

function ciniiForm(canonicalQuery: string, limit = 101): string {
  return new URLSearchParams({
    query: buildCiNiiSparql(canonicalQuery, null, limit),
    format: "application/sparql-results+json",
    timeout: "30000",
  }).toString();
}

function changedRoute(route: JsonObject): JsonObject {
  const id = String(route.id);
  if (id === "cinii") {
    return {
      ...route,
      schema: "phase8b-search-route-v2",
      role: "historical-snapshot-supplement",
      credentialEnv: null,
      request: {
        method: "POST",
        targetTemplate: "https://cinii.kgraph.jp/sparql",
        headers: [
          { name: "accept", valueTemplate: "application/sparql-results+json" },
          { name: "content-type", valueTemplate: "application/x-www-form-urlencoded; charset=UTF-8" },
        ],
        bodyTemplate: "query={SPARQL_FORM}&format=application%2Fsparql-results%2Bjson&timeout=30000",
      },
      pacing: { minIntervalMs: 3_000, maxConcurrency: 1 },
      pagination: {
        mode: "strict-crid-keyset-with-lookahead",
        pageSize: 100,
        cap: 10_000,
        continuationRequestMutation: "insert FILTER(STR(?article) > \"{LAST_RETAINED_URI}\") after the .rdf filter; LAST_RETAINED_URI is row 100; LIMIT remains 101",
        completion: "HTTP 200 page has at most 100 strictly increasing unique CRID RDF URIs; row 101 advances the keyset cursor; cap hit is BOUNDED_OPEN",
      },
      failOpenConditions: [
        "non-200-including-partial-206", "redirect", "timeout-or-network-failure",
        "response-media-type-or-parse-failure", "binding-shape-or-uri-failure",
        "nonmonotone-duplicate-or-repeated-cursor", "cap-hit", "endpoint-query-incompatibility",
      ],
      officialDocumentId: "doc-cinii-kg",
      coverage: {
        snapshotAsOf: "2024-04-04",
        coversProjectCutoff: false,
        experimental: true,
        claim: "historical snapshot only; no CiNii coverage claim after 2024-04-04",
        fullTextFieldSemantics: "all query tokens must coexist in one indexed title, alternate-title, description, or keyword literal",
      },
      responseRights: {
        rawUriOnlyResponseRetention: "private-NAS-plus-hash",
        publicRedistribution: "unknown-open-pending-source-specific-license",
        richerMetadataPublication: "prohibited-until-source-specific-license-clears",
      },
    };
  }
  const request = cloneObject(route.request, `${id}.request`);
  const headers = structuredClone(request.headers) as JsonObject[];
  const target = String(request.targetTemplate);
  if (id === "crossref") {
    return {
      ...route,
      schema: "phase8b-search-route-v2",
      credentialEnv: null,
      request: {
        ...request,
        targetTemplate: target.replace(/&mailto=\{\{PHASE8_CONTACT_EMAIL\}\}$/, ""),
        headers: [
          { name: "accept", valueTemplate: "application/json" },
          { name: "user-agent", valueTemplate: "VirtualCloudChamber-Phase8B/2.0" },
        ],
      },
      pacing: { minIntervalMs: 1_100, maxConcurrency: 1 },
      failOpenConditions: (route.failOpenConditions as string[]).filter((value) => value !== "credential-missing"),
      access: { mode: "anonymous-public-pool", contactIdentityInvented: false },
    };
  }
  if (id === "datacite" || id === "nasa-ntrs") {
    return {
      ...route,
      schema: "phase8b-search-route-v2",
      credentialEnv: null,
      request: {
        ...request,
        headers: headers.map((header) => header.name === "user-agent"
          ? { name: "user-agent", valueTemplate: "VirtualCloudChamber-Phase8B/2.0" }
          : header),
      },
      failOpenConditions: (route.failOpenConditions as string[]).filter((value) => value !== "credential-missing"),
      access: { mode: "anonymous-public", contactIdentityInvented: false },
    };
  }
  return route;
}

function routeRequest(route: JsonObject, query: JsonObject): JsonObject {
  const request = cloneObject(route.request, `${String(route.id)}.request`);
  const canonicalQuery = String(query.canonicalQuery);
  if (route.id === "cinii") {
    request.bodyTemplate = ciniiForm(canonicalQuery);
    return request;
  }
  const encoded = encodeURIComponent(canonicalQuery).replace(/[!'()*]/g, (character) =>
    `%${character.charCodeAt(0).toString(16).toUpperCase()}`);
  request.targetTemplate = String(request.targetTemplate).replaceAll("{QUERY}", encoded);
  if (request.bodyTemplate !== null) {
    request.bodyTemplate = String(request.bodyTemplate).replaceAll("{QUERY_JSON}", JSON.stringify(canonicalQuery));
  }
  return request;
}

function amendedProtocol(base: JsonObject): JsonObject {
  const execution = cloneObject(base.execution, "protocol.execution");
  const officialDocumentLedger = (base.officialDocumentLedger as JsonObject[]).flatMap((document) =>
    document.routeId === "cinii"
      ? CINII_DOCUMENTS.map((replacement) => ({ ...replacement, routeId: "cinii" }))
      : [document]);
  return {
    ...base,
    schema: "phase8b-lean-search-protocol-v2",
    operator: PHASE8_SEARCH_SUCCESSOR_OPERATOR,
    supersedes: PREDECESSOR_INDEX,
    routeReadinessAmendment: {
      authorizedRouteIds: [...CHANGED_ROUTE_IDS].sort(),
      ciniiDocumentIds: CINII_DOCUMENTS.map((document) => document.id),
      ciniiSnapshotAsOf: "2024-04-04",
      ciniiCoversProjectCutoff: false,
      rejectedCiNiiQueryForm: "per-token UNION groups exceeded Virtuoso generated-SQL limit in an uncounted six-token probe",
      contactEmailIsCredential: false,
    },
    officialDocumentLedger,
    runtimeSecrets: {
      allowedCredentialPlaceholders: ["OPENALEX_API_KEY"],
      OPENALEX_API_KEY: { retained: false, source: "runtime-only NAS file or environment" },
    },
    responseRetention: {
      default: "private-NAS-plus-hash",
      gitPublication: "only when provider/source license permits",
      ciniiUriOnlyResponses: "private-NAS-plus-hash",
    },
    execution: { ...execution, allowedCredentialPlaceholders: ["OPENALEX_API_KEY"] },
    limitations: [
      ...(base.limitations as unknown[]),
      "CiNii is an experimental 2024-04-04 snapshot and supplies no coverage claim after that date.",
      "CiNii full-text tokens must coexist within one indexed metadata literal; other registered routes carry current and cross-field discovery.",
    ],
  };
}

function descriptor(path: string, kind: string, bytes: Uint8Array): JsonObject {
  return { path, kind, byteLength: bytes.byteLength, sha256: sha256Bytes(bytes) };
}

function derivedRecords(repositoryRoot: string): { protocol: JsonObject; routes: JsonObject[]; queries: JsonObject[]; cells: JsonObject[]; predecessorArtifacts: Map<string, Uint8Array> } {
  const predecessorArtifacts = predecessor(repositoryRoot);
  const protocol = amendedProtocol(parseJson(predecessorArtifacts.get("protocol.json") as Uint8Array, "predecessor protocol"));
  const routes = parseJsonLines(predecessorArtifacts.get("routes.jsonl") as Uint8Array, "predecessor routes").map((route) =>
    CHANGED_ROUTE_IDS.has(String(route.id)) ? changedRoute(route) : route);
  const queries = parseJsonLines(predecessorArtifacts.get("queries.jsonl") as Uint8Array, "predecessor queries");
  const routeMap = new Map(routes.map((route) => [String(route.id), route]));
  const queryMap = new Map(queries.map((query) => [String(query.id), query]));
  const cells = parseJsonLines(predecessorArtifacts.get("route-query-cells.jsonl") as Uint8Array, "predecessor cells").map((cell) => {
    if (!CHANGED_ROUTE_IDS.has(String(cell.routeId))) return cell;
    const request = routeRequest(routeMap.get(String(cell.routeId)) as JsonObject, queryMap.get(String(cell.queryId)) as JsonObject);
    return { ...cell, plannedRequest: request, plannedRequestSha256: sha256Bytes(canonicalJsonBytes(request)) };
  });
  return { protocol, routes, queries, cells, predecessorArtifacts };
}

function smokeTemplate(route: JsonObject, firstEnglish: JsonObject): JsonObject {
  if (route.queryMode === "matrix") {
    const request = routeRequest(route, firstEnglish);
    if (route.id === "cinii") request.bodyTemplate = ciniiForm(String(firstEnglish.canonicalQuery), 1);
    else {
      request.targetTemplate = String(request.targetTemplate)
        .replace("max_results=2000", "max_results=1")
        .replace("rows=1000", "rows=1")
        .replace("page%5Bsize%5D=1000", "page%5Bsize%5D=1")
        .replace("maximumRecords=500", "maximumRecords=1")
        .replace("per_page=100", "per_page=1");
      if (request.bodyTemplate !== null) request.bodyTemplate = String(request.bodyTemplate).replace("\"size\":100", "\"size\":1");
    }
    return request;
  }
  const request = cloneObject(route.request, `${String(route.id)} smoke request`);
  if (route.id === "doi-publisher") request.targetTemplate = String(request.targetTemplate).replace("{DOI}", "10.1175%2FJAS-D-19-0303.1");
  else if (route.id === "penn-state-data-commons") request.targetTemplate = String(request.targetTemplate).replace("{DATASET_ID}", "6184");
  else throw new Error(`seed-only smoke target missing: ${String(route.id)}`);
  return request;
}

function redact(value: string, secrets: readonly string[]): string {
  let result = value;
  for (const secret of secrets.filter(Boolean)) {
    for (const form of new Set([secret, encodeURIComponent(secret)])) result = result.replaceAll(form, "REDACTED");
  }
  return result;
}

function validateCiNii(bytes: Uint8Array, contentType: string | null): void {
  if (contentType?.split(";", 1)[0]?.trim().toLowerCase() !== "application/sparql-results+json") {
    throw new Error("CiNii smoke media type differs");
  }
  const value = parseJson(bytes, "CiNii smoke response");
  const head = cloneObject(value.head, "CiNii smoke head");
  if (canonicalJson(head.vars) !== canonicalJson(["article"])) throw new Error("CiNii smoke vars differ");
  const results = cloneObject(value.results, "CiNii smoke results");
  if (!Array.isArray(results.bindings) || results.bindings.length > 1) throw new Error("CiNii smoke bindings differ");
  for (const raw of results.bindings) {
    const binding = cloneObject(raw, "CiNii smoke binding");
    const article = cloneObject(binding.article, "CiNii smoke article");
    if (article.type !== "uri" || typeof article.value !== "string" || !article.value.startsWith("https://cir.nii.ac.jp/crid/") || !article.value.endsWith(".rdf")) throw new Error("CiNii smoke article differs");
  }
}

function validateJsonRoute(routeId: string, bytes: Uint8Array): void {
  const value = parseJson(bytes, `${routeId} smoke response`);
  if (routeId === "crossref") {
    const message = cloneObject(value.message, "Crossref message");
    if (!Array.isArray(message.items)) throw new Error("Crossref smoke items differ");
  } else if (routeId === "datacite") {
    if (!Array.isArray(value.data) || value.links === null || typeof value.links !== "object") throw new Error("DataCite smoke shape differs");
  } else if (routeId === "nasa-ntrs") {
    const stats = cloneObject(value.stats, "NASA stats");
    if (!Array.isArray(value.results) || stats.estimate !== false) throw new Error("NASA smoke shape differs");
  } else if (routeId === "openalex") {
    const meta = cloneObject(value.meta, "OpenAlex meta");
    if (!Array.isArray(value.results) || !("next_cursor" in meta)) throw new Error("OpenAlex smoke shape differs");
  } else if (routeId === "semantic-scholar") {
    if (!Array.isArray(value.data) || !("total" in value)) throw new Error("Semantic Scholar smoke shape differs");
  }
}

function validateSmoke(routeId: string, response: Response, bytes: Uint8Array): void {
  if (bytes.byteLength === 0) throw new Error(`${routeId} smoke response is empty`);
  if (routeId === "cinii") { validateCiNii(bytes, response.headers.get("content-type")); return; }
  if (routeId === "arxiv" || routeId === "national-diet-library") {
    const text = TEXT_DECODER.decode(bytes);
    const marker = routeId === "arxiv" ? "<feed" : "searchRetrieveResponse";
    if (!text.includes(marker)) throw new Error(`${routeId} smoke XML differs`);
    return;
  }
  if (routeId !== "doi-publisher" && routeId !== "penn-state-data-commons") validateJsonRoute(routeId, bytes);
}

function smokeRecord(routeId: string, outcome: SuccessorSmokeResult["outcome"], input: Partial<SuccessorSmokeResult>): SuccessorSmokeResult {
  return {
    schema: "phase8b-route-smoke-v2", routeId, outcome,
    observedAtUtc: input.observedAtUtc ?? null,
    plannedRequestSha256: input.plannedRequestSha256 ?? null,
    httpStatus: input.httpStatus ?? null,
    effectiveUrl: input.effectiveUrl ?? null,
    responseByteLength: input.responseByteLength ?? null,
    responseSha256: input.responseSha256 ?? null,
    blocker: input.blocker ?? null,
    countedSearch: false,
  };
}

export function readOpenAlexKeyFile(path: string): string {
  const stats = lstatSync(path);
  if (!stats.isFile() || stats.isSymbolicLink()) throw new Error("OpenAlex key path is not a regular file");
  const text = TEXT_DECODER.decode(new Uint8Array(readFileSync(path)));
  const key = text.endsWith("\n") ? text.slice(0, -1) : text;
  if (key.length === 0 || /[^\x21-\x7e]/.test(key) || key.includes("\n") || key.includes("\r")) {
    throw new Error("OpenAlex key file must contain one printable nonempty line");
  }
  return key;
}

export async function runPhase8SearchSuccessorSmoke(options: {
  readonly repositoryRoot?: string;
  readonly openAlexApiKey?: string;
  readonly fetchImpl?: typeof fetch;
  readonly observedAtUtc?: string;
  readonly timeoutMs?: number;
} = {}): Promise<readonly SuccessorSmokeResult[]> {
  const repositoryRoot = options.repositoryRoot ?? fileURLToPath(new URL("../..", import.meta.url));
  const { routes, queries } = derivedRecords(repositoryRoot);
  const firstEnglish = queries.find((query) => query.language === "en");
  if (firstEnglish === undefined) throw new Error("successor smoke query is missing");
  const observedAtUtc = options.observedAtUtc ?? new Date().toISOString();
  const fetchImpl = options.fetchImpl ?? fetch;
  const timeoutMs = options.timeoutMs ?? 45_000;
  const key = options.openAlexApiKey;
  if (key !== undefined && (key.length === 0 || /[^\x21-\x7e]/.test(key) || /[\r\n]/.test(key))) {
    throw new Error("runtime OpenAlex key must be printable and nonempty");
  }
  const secrets = key === undefined ? [] : [key];
  const results: SuccessorSmokeResult[] = [];
  for (const route of routes) {
    const routeId = String(route.id);
    if (route.disposition === "reviewed-removal") {
      results.push(smokeRecord(routeId, "removed", { blocker: String(route.removalReason) }));
      continue;
    }
    if (route.credentialEnv === "OPENALEX_API_KEY" && key === undefined) {
      results.push(smokeRecord(routeId, "blocked-credential", { blocker: "missing runtime OPENALEX_API_KEY" }));
      continue;
    }
    const request = smokeTemplate(route, firstEnglish);
    const plannedRequestSha256 = sha256Bytes(canonicalJsonBytes(request));
    const target = String(request.targetTemplate).replaceAll(OPENALEX_PLACEHOLDER, key === undefined ? OPENALEX_PLACEHOLDER : encodeURIComponent(key));
    const headers = Object.fromEntries((request.headers as JsonObject[]).map((header) => [String(header.name), String(header.valueTemplate)]));
    const body = request.bodyTemplate === null ? undefined : String(request.bodyTemplate);
    try {
      const response = await fetchImpl(target, { method: String(request.method), headers, body, redirect: "follow", signal: AbortSignal.timeout(timeoutMs) });
      const bytes = new Uint8Array(await response.arrayBuffer());
      if (bytes.byteLength > 2 * 1024 * 1024) throw new Error("smoke response exceeded 2 MiB cap");
      const exactSuccess = routeId === "cinii" ? response.status === 200 : response.ok;
      if (!exactSuccess) {
        results.push(smokeRecord(routeId, "blocked-route", { observedAtUtc, plannedRequestSha256, httpStatus: response.status, effectiveUrl: redact(response.url, secrets), responseByteLength: bytes.byteLength, responseSha256: sha256Bytes(bytes), blocker: `HTTP ${response.status}` }));
      } else {
        validateSmoke(routeId, response, bytes);
        results.push(smokeRecord(routeId, "succeeded", { observedAtUtc, plannedRequestSha256, httpStatus: response.status, effectiveUrl: redact(response.url, secrets), responseByteLength: bytes.byteLength, responseSha256: sha256Bytes(bytes) }));
      }
    } catch (error) {
      const message = redact(error instanceof Error ? error.message : String(error), secrets);
      results.push(smokeRecord(routeId, "blocked-route", { observedAtUtc, plannedRequestSha256, blocker: message }));
    }
  }
  return results.sort((left, right) => left.routeId < right.routeId ? -1 : left.routeId > right.routeId ? 1 : 0);
}

export function derivePhase8SearchSuccessorBundle(repositoryRoot: string, smoke: readonly SuccessorSmokeResult[]): SearchSuccessorBundle {
  const { protocol, routes, queries, cells, predecessorArtifacts } = derivedRecords(repositoryRoot);
  const artifacts = new Map<string, Uint8Array>();
  artifacts.set("protocol.json", canonicalJsonBytes(protocol));
  artifacts.set("queries.jsonl", predecessorArtifacts.get("queries.jsonl") as Uint8Array);
  artifacts.set("route-query-cells.jsonl", jsonLines(cells));
  artifacts.set("routes.jsonl", jsonLines(routes));
  artifacts.set("smoke-results.jsonl", jsonLines(smoke));
  const payloads = PAYLOAD_NAMES.map((path) => descriptor(path, path.endsWith("jsonl") ? "canonical-jsonl" : "canonical-json", artifacts.get(path) as Uint8Array));
  const credentialBlockers = smoke.filter((record) => record.outcome === "blocked-credential").map((record) => record.routeId);
  const routeBlockers = smoke.filter((record) => record.outcome === "blocked-route").map((record) => record.routeId);
  const report = {
    schema: "phase8b-lean-search-successor-report-v2",
    operator: PHASE8_SEARCH_SUCCESSOR_OPERATOR,
    state: "protocol-successor-candidate-search-unexecuted",
    supersedes: PREDECESSOR_INDEX,
    artifacts: payloads,
    derivedCounts: { routeCount: routes.length, activeRouteCount: 10, removedRouteCount: 3, queryCount: queries.length, routeQueryCellCount: cells.length, smokeResultCount: smoke.length, registeredSearchRequestCount: 0 },
    smokeSummary: { succeeded: smoke.filter((record) => record.outcome === "succeeded").length, blockedCredential: credentialBlockers.length, blockedRoute: routeBlockers.length, removed: smoke.filter((record) => record.outcome === "removed").length },
    credentialBlockers,
    routeBlockers,
    readiness: routeBlockers.length > 0 ? "protocol-recorded-route-blockers-open" : credentialBlockers.length > 0 ? "protocol-ready-credentials-open" : "ready-for-counted-search-after-freeze",
    grantsValidationClaim: false,
    permitsPhase9Execution: false,
    claim: "The maker-authorized route-readiness successor and fresh uncounted smokes are registered; no counted search or measurement extraction has run.",
  };
  const reportBytes = canonicalJsonBytes(report);
  artifacts.set("report.json", reportBytes);
  const reportDescriptor = descriptor("report.json", "canonical-json-report", reportBytes);
  artifacts.set("artifact-index.json", canonicalJsonBytes({ schema: "phase8b-lean-search-successor-index-v2", bundleCompleteness: "complete", report: reportDescriptor, artifacts: [reportDescriptor, ...payloads] }));
  return { artifacts, routeCount: routes.length, queryCount: queries.length, routeQueryCellCount: cells.length, credentialBlockers, routeBlockers };
}

export function readSuccessorSmokeResults(path: string): readonly SuccessorSmokeResult[] {
  return parseJsonLines(new Uint8Array(readFileSync(path)), "successor smoke results") as unknown as readonly SuccessorSmokeResult[];
}

export function writePhase8SearchSuccessorBundle(directory: string, bundle: SearchSuccessorBundle): void {
  if (existsSync(directory)) throw new Error(`refusing to overwrite existing bundle: ${directory}`);
  const names = [...bundle.artifacts.keys()].sort();
  if (canonicalJson(names) !== canonicalJson([...PHASE8_SEARCH_SUCCESSOR_ARTIFACTS].sort())) throw new Error("refusing incomplete successor bundle");
  mkdirSync(dirname(directory), { recursive: true });
  const staging = join(dirname(directory), `.${basename(directory)}.staging-${randomUUID()}`);
  mkdirSync(staging);
  try {
    for (const name of names) writeFileSync(join(staging, name), bundle.artifacts.get(name) as Uint8Array, { flag: "wx" });
    renameSync(staging, directory);
  } catch (error) {
    rmSync(staging, { recursive: true, force: true });
    throw error;
  }
}

function parseCli(argv: readonly string[]): { command: "smoke" | "build" | "verify"; repositoryRoot: string; output?: string; smokeResults?: string; bundle?: string; openAlexKeyFile?: string } {
  const command = argv[0];
  if (command !== "smoke" && command !== "build" && command !== "verify") throw new Error("usage: phase8-search-protocol-successor.ts <smoke|build|verify> [options]");
  const values = new Map<string, string>();
  for (let index = 1; index < argv.length; index += 2) {
    const key = argv[index]; const value = argv[index + 1];
    if (key === undefined || value === undefined || !["--output", "--smoke-results", "--bundle", "--repository-root", "--openalex-key-file"].includes(key) || values.has(key)) throw new Error("invalid successor arguments");
    values.set(key, value);
  }
  const repositoryRoot = values.get("--repository-root") ?? fileURLToPath(new URL("../..", import.meta.url));
  if (command === "smoke" && values.get("--output") === undefined) throw new Error("smoke requires --output");
  if (command === "build" && (values.get("--smoke-results") === undefined || values.get("--bundle") === undefined)) throw new Error("build requires --smoke-results and --bundle");
  if (command === "verify" && values.get("--bundle") === undefined) throw new Error("verify requires --bundle");
  return { command, repositoryRoot, output: values.get("--output"), smokeResults: values.get("--smoke-results"), bundle: values.get("--bundle"), openAlexKeyFile: values.get("--openalex-key-file") };
}

const invoked = process.argv[1];
if (invoked !== undefined && import.meta.url === pathToFileURL(resolve(invoked)).href) {
  try {
    const args = parseCli(process.argv.slice(2));
    if (args.command === "smoke") {
      const key = args.openAlexKeyFile === undefined ? process.env.OPENALEX_API_KEY : readOpenAlexKeyFile(args.openAlexKeyFile);
      const smoke = await runPhase8SearchSuccessorSmoke({ repositoryRoot: args.repositoryRoot, openAlexApiKey: key });
      writeFileSync(args.output as string, jsonLines(smoke), { flag: "wx" });
      process.stdout.write(`PHASE8B SEARCH SUCCESSOR SMOKE routes=${smoke.length} succeeded=${smoke.filter((record) => record.outcome === "succeeded").length} blocked=${smoke.filter((record) => record.outcome.startsWith("blocked-")).length} removed=${smoke.filter((record) => record.outcome === "removed").length} countedSearch=0\n`);
    } else if (args.command === "build") {
      const bundle = derivePhase8SearchSuccessorBundle(args.repositoryRoot, readSuccessorSmokeResults(args.smokeResults as string));
      writePhase8SearchSuccessorBundle(args.bundle as string, bundle);
      process.stdout.write(`PHASE8B SEARCH SUCCESSOR BUILT routes=${bundle.routeCount} queries=${bundle.queryCount} cells=${bundle.routeQueryCellCount}\n`);
    } else {
      const { verifyPhase8SearchSuccessorBundle } = await import("./phase8-search-protocol-successor-verify.ts");
      const result = verifyPhase8SearchSuccessorBundle(args.bundle as string, args.repositoryRoot);
      process.stdout.write(`PHASE8B SEARCH SUCCESSOR OK routes=${result.routeCount} queries=${result.queryCount} cells=${result.routeQueryCellCount} blockers=${result.routeBlockers.length + result.credentialBlockers.length}\n`);
    }
  } catch (error) {
    process.stderr.write(`PHASE8B SEARCH SUCCESSOR FAIL ${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}
