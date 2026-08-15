// Independent semantic verifier for the Phase 8B S1 lean search-protocol bundle.

import { lstatSync, readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { canonicalJson, canonicalJsonBytes, parseCanonicalJson, sha256Bytes, type StrictJson } from "./gate4-evidence.ts";

const ARTIFACT_NAMES = [
  "artifact-index.json", "protocol.json", "queries.jsonl", "report.json",
  "route-query-cells.jsonl", "routes.jsonl", "smoke-results.jsonl",
] as const;
const PAYLOAD_NAMES = ["protocol.json", "queries.jsonl", "route-query-cells.jsonl", "routes.jsonl", "smoke-results.jsonl"] as const;
const MATRIX_ROUTES = ["arxiv", "cinii", "crossref", "datacite", "nasa-ntrs", "national-diet-library", "openalex", "semantic-scholar"] as const;
const ALL_ROUTES = ["arxiv", "cinii", "crossref", "datacite", "doi-publisher", "jstage", "nasa-ntrs", "national-diet-library", "openalex", "penn-state-data-commons", "semantic-scholar", "supplemental-web", "zenodo"] as const;
const REMOVED_ROUTES = ["jstage", "supplemental-web", "zenodo"] as const;
const FOLLOWUP_CHECKS = ["version-of-record", "correction-or-retraction", "supplement", "public-data", "acquisition-disposition"] as const;
const OPERATION_UNIVERSE = ["backward-citations", "corrections-supplements", "datasets", "exact-record", "forward-citations", "free-text", "later-author-output", "versions"] as const;
const S0_INDEX = { path: "evidence/phase8b-local-denominator/artifact-index.json", byteLength: 1_158, sha256: "93c83a98ef053e4b22b24ce3c072f862b23d55a552df5da177f71f2d935bb8f2" } as const;
const S0_CONTAINERS = { path: "evidence/phase8b-local-denominator/source-containers.jsonl", byteLength: 18_688, sha256: "3f12256918c845cdf2f44a9029dc01ab06c774f7ac1df11e33d3667f8ef23106" } as const;
const SHA256 = /^[0-9a-f]{64}$/;
const QUERY_REGISTRY_SHA256 = "5780fcef8b7e474560fd9410dac0be1dfa5a2fe72cd42b0fca3617cfd833fbd7";
const AUTHOR_SEEDS_SHA256 = "ca6a4557ef309a7d64f025fbf4e6b647227b7b8cbd39bca2fb7db06fa32d3199";
const CITATION_SEEDS_SHA256 = "1db6d2f3a1a1df1a6f9c5b337355bc886270f7f2235458b66be15cdab01774d7";
const DOCUMENT_LEDGER_SHA256 = "4f90079e8bba88859907bc9b23626831a2084e142c8a5b93cba86d8f0f97a0ff";

type JsonObject = { readonly [key: string]: StrictJson };

interface RouteExpectation {
  readonly disposition: "active" | "reviewed-removal";
  readonly queryMode: "matrix" | "seed-only" | "none";
  readonly credentialEnv: string | null;
  readonly method: "GET" | "POST" | null;
  readonly endpointPrefix: string | null;
  readonly paginationMode: string;
  readonly pageSize: number | null;
  readonly cap: number | null;
  readonly officialDocumentId: string;
}

const ROUTE_EXPECTATIONS: Readonly<Record<string, RouteExpectation>> = {
  arxiv: { disposition: "active", queryMode: "matrix", credentialEnv: null, method: "GET", endpointPrefix: "https://export.arxiv.org/api/query?", paginationMode: "offset-plus-total", pageSize: 2_000, cap: 30_000, officialDocumentId: "doc-arxiv" },
  cinii: { disposition: "active", queryMode: "matrix", credentialEnv: "CINII_APP_ID", method: "GET", endpointPrefix: "https://cir.nii.ac.jp/opensearch/v2/articles?", paginationMode: "recursive-inclusive-calendar-month-partition", pageSize: 200, cap: 10_000, officialDocumentId: "doc-cinii" },
  crossref: { disposition: "active", queryMode: "matrix", credentialEnv: "PHASE8_CONTACT_EMAIL", method: "GET", endpointPrefix: "https://api.crossref.org/v1/works?", paginationMode: "cursor", pageSize: 1_000, cap: null, officialDocumentId: "doc-crossref" },
  datacite: { disposition: "active", queryMode: "matrix", credentialEnv: "PHASE8_CONTACT_EMAIL", method: "GET", endpointPrefix: "https://api.datacite.org/dois?", paginationMode: "cursor-link", pageSize: 1_000, cap: null, officialDocumentId: "doc-datacite" },
  "doi-publisher": { disposition: "active", queryMode: "seed-only", credentialEnv: null, method: "GET", endpointPrefix: "https://doi.org/", paginationMode: "redirect-chain", pageSize: null, cap: 10, officialDocumentId: "doc-doi" },
  jstage: { disposition: "reviewed-removal", queryMode: "none", credentialEnv: null, method: null, endpointPrefix: null, paginationMode: "not-applicable", pageSize: null, cap: null, officialDocumentId: "doc-jstage" },
  "nasa-ntrs": { disposition: "active", queryMode: "matrix", credentialEnv: "PHASE8_CONTACT_EMAIL", method: "POST", endpointPrefix: "https://ntrs.nasa.gov/api/citations/search", paginationMode: "offset-with-exact-id-order", pageSize: 100, cap: 10_000, officialDocumentId: "doc-nasa" },
  "national-diet-library": { disposition: "active", queryMode: "matrix", credentialEnv: null, method: "GET", endpointPrefix: "https://ndlsearch.ndl.go.jp/api/sru?", paginationMode: "recursive-inclusive-calendar-day-partition", pageSize: 500, cap: 500, officialDocumentId: "doc-ndl" },
  openalex: { disposition: "active", queryMode: "matrix", credentialEnv: "OPENALEX_API_KEY", method: "GET", endpointPrefix: "https://api.openalex.org/works?", paginationMode: "cursor", pageSize: 100, cap: null, officialDocumentId: "doc-openalex" },
  "penn-state-data-commons": { disposition: "active", queryMode: "seed-only", credentialEnv: null, method: "GET", endpointPrefix: "https://www.datacommons.psu.edu/commonswizard/MetadataDisplay.aspx?", paginationMode: "exact-seed-records", pageSize: null, cap: 3, officialDocumentId: "doc-penn" },
  "semantic-scholar": { disposition: "active", queryMode: "matrix", credentialEnv: null, method: "GET", endpointPrefix: "https://api.semanticscholar.org/graph/v1/paper/search/bulk?", paginationMode: "token", pageSize: 1_000, cap: 10_000_000, officialDocumentId: "doc-semantic-scholar" },
  "supplemental-web": { disposition: "reviewed-removal", queryMode: "none", credentialEnv: null, method: null, endpointPrefix: null, paginationMode: "not-applicable", pageSize: null, cap: null, officialDocumentId: "doc-supplemental-web" },
  zenodo: { disposition: "reviewed-removal", queryMode: "none", credentialEnv: null, method: null, endpointPrefix: null, paginationMode: "not-applicable", pageSize: null, cap: null, officialDocumentId: "doc-zenodo" },
};
const COMPLETION_MARKERS: Readonly<Record<string, string>> = {
  arxiv: "cumulative-unique-equals-initial-total",
  cinii: "all leaf counts reconciled",
  crossref: "short page after all cursors captured",
  datacite: "links.next absent and unique total reconciled",
  "doi-publisher": "terminal response and complete redirect chain captured",
  "nasa-ntrs": "short page and stats total reconciled",
  "national-diet-library": "all leaf counts reconciled",
  openalex: "next_cursor null after final result page",
  "penn-state-data-commons": "all registered dataset IDs terminal",
  "semantic-scholar": "continuation token absent",
};
const ROUTE_REQUEST_SHA256: Readonly<Record<string, string>> = {
  arxiv: "9dbb33be04500edde8c6546192f2067dfeea9fda76e0d8ada76c5ad7c1e932ec",
  cinii: "f142f10f29ef9ac80190d946265a61fefb5c3835899e8790b96badc614f417d6",
  crossref: "2ee429bf46bc815a52485b888997a7214268646f7fc5d4c9b4b3a2ce891086e8",
  datacite: "372134502d624848a80490117b920b855560f0dccbe307723def0b90dc7fd3fc",
  "doi-publisher": "578e276fbfa744f8bfc6721c7db085edf4d9df2891edcad5a4348e0dc87c631e",
  "nasa-ntrs": "55333ac4962d49a8b3ce6633dae6d5c21e29b433b98fddc158d250ca41970ade",
  "national-diet-library": "0ef82b7e5acce1d58301c4e5c6ea6f7f7b91909cbfc15a570af3f817ea54f502",
  openalex: "cafc45a6414479cb7b7cbf4fd36882aed0cb93273ab2bcc7811dc0cfc6a7557e",
  "penn-state-data-commons": "5ccaa126a18184c5e3f76dfafe50a8db52b9422cdb2660935ab477f996d6c1ea",
  "semantic-scholar": "b782eedd0073f6b38dbd5bcf16ac11a8fae411b565ce2bd2789602a5c8e3fe35",
};
const SUPPORTED_OPERATIONS: Readonly<Record<string, readonly string[]>> = {
  arxiv: ["exact-record", "free-text", "later-author-output", "versions"],
  cinii: ["exact-record", "free-text", "later-author-output"],
  crossref: ["backward-citations", "corrections-supplements", "datasets", "exact-record", "free-text", "later-author-output", "versions"],
  datacite: ["datasets", "exact-record", "free-text", "versions"],
  "doi-publisher": ["corrections-supplements", "datasets", "exact-record", "versions"],
  jstage: [],
  "nasa-ntrs": ["exact-record", "free-text", "later-author-output"],
  "national-diet-library": ["exact-record", "free-text", "later-author-output"],
  openalex: ["backward-citations", "exact-record", "forward-citations", "free-text", "later-author-output"],
  "penn-state-data-commons": ["datasets", "exact-record", "versions"],
  "semantic-scholar": ["backward-citations", "exact-record", "forward-citations", "free-text", "later-author-output"],
  "supplemental-web": [],
  zenodo: [],
};

export interface VerifiedSearchProtocol {
  readonly routeCount: number;
  readonly queryCount: number;
  readonly routeQueryCellCount: number;
  readonly credentialBlockers: readonly string[];
  readonly routeBlockers: readonly string[];
  readonly readiness: "ready-for-counted-search-after-freeze" | "protocol-ready-credentials-open" | "protocol-recorded-route-blockers-open";
}

function lexicalCompare(left: string, right: string): number { return left < right ? -1 : left > right ? 1 : 0; }

function object(value: StrictJson | undefined, label: string): JsonObject {
  if (value === null || typeof value !== "object" || Array.isArray(value)) throw new Error(`${label} must be an object`);
  return value as JsonObject;
}

function array(value: StrictJson | undefined, label: string): readonly StrictJson[] {
  if (!Array.isArray(value)) throw new Error(`${label} must be an array`);
  return value;
}

function string(value: StrictJson | undefined, label: string): string {
  if (typeof value !== "string" || value.length === 0) throw new Error(`${label} must be a nonempty string`);
  return value;
}

function nullableString(value: StrictJson | undefined, label: string): string | null {
  if (value === null) return null;
  return string(value, label);
}

function integer(value: StrictJson | undefined, label: string): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) throw new Error(`${label} must be a nonnegative integer`);
  return value;
}

function exactKeys(value: JsonObject, expected: readonly string[], label: string): void {
  const actual = Object.keys(value).sort(lexicalCompare);
  const wanted = [...expected].sort(lexicalCompare);
  if (canonicalJson(actual) !== canonicalJson(wanted)) throw new Error(`${label} keys differ`);
}

function stringArray(value: StrictJson | undefined, label: string): readonly string[] {
  return array(value, label).map((entry, index) => string(entry, `${label}[${index}]`));
}

function sortedUnique(values: readonly string[], label: string): readonly string[] {
  if (new Set(values).size !== values.length) throw new Error(`${label} contains duplicates`);
  return [...values].sort(lexicalCompare);
}

function assertExactStrings(actual: readonly string[], expected: readonly string[], label: string): void {
  if (canonicalJson(actual) !== canonicalJson(expected)) throw new Error(`${label} differs`);
}

function readRegular(path: string, label: string): Uint8Array {
  const stats = lstatSync(path);
  if (!stats.isFile() || stats.isSymbolicLink()) throw new Error(`${label} is not a regular file`);
  return new Uint8Array(readFileSync(path));
}

function parseJsonLines(bytes: Uint8Array, label: string): readonly JsonObject[] {
  let text: string;
  try { text = new TextDecoder("utf-8", { fatal: true }).decode(bytes); }
  catch { throw new Error(`${label} is not UTF-8`); }
  if (!text.endsWith("\n")) throw new Error(`${label} lacks final newline`);
  const body = text.slice(0, -1);
  if (body.length === 0) return [];
  return body.split("\n").map((line, index) => object(parseCanonicalJson(new TextEncoder().encode(`${line}\n`), `${label}:${index + 1}`), `${label}:${index + 1}`));
}

function descriptor(path: string, kind: string, bytes: Uint8Array): JsonObject {
  return { path, kind, byteLength: bytes.byteLength, sha256: sha256Bytes(bytes) };
}

function descriptorFrom(value: StrictJson | undefined, label: string): JsonObject {
  const result = object(value, label);
  exactKeys(result, ["path", "kind", "byteLength", "sha256"], label);
  string(result.path, `${label}.path`); string(result.kind, `${label}.kind`); integer(result.byteLength, `${label}.byteLength`);
  if (!SHA256.test(string(result.sha256, `${label}.sha256`))) throw new Error(`${label}.sha256 differs`);
  return result;
}

function rejectCallerVerdicts(value: StrictJson, path = "$", seen = new WeakSet<object>()): void {
  if (value === null || typeof value !== "object") return;
  if (seen.has(value)) throw new Error(`${path} contains a cycle`);
  seen.add(value);
  if (Array.isArray(value)) value.forEach((entry, index) => rejectCallerVerdicts(entry, `${path}[${index}]`, seen));
  else {
    for (const [key, entry] of Object.entries(value)) {
      if (["accepted", "pass", "passEligible", "verdict"].includes(key)) throw new Error(`caller-supplied verdict field is forbidden: ${path}.${key}`);
      rejectCallerVerdicts(entry, `${path}.${key}`, seen);
    }
  }
  seen.delete(value);
}

function readS0SourceIds(repositoryRoot: string): readonly string[] {
  for (const pin of [S0_INDEX, S0_CONTAINERS]) {
    const bytes = readRegular(resolve(repositoryRoot, pin.path), pin.path);
    if (bytes.byteLength !== pin.byteLength || sha256Bytes(bytes) !== pin.sha256) throw new Error(`S0 drift: ${pin.path}`);
  }
  const records = parseJsonLines(readRegular(resolve(repositoryRoot, S0_CONTAINERS.path), S0_CONTAINERS.path), S0_CONTAINERS.path);
  const ids = records.map((record) => string(record.id, "S0 container.id"));
  if (ids.length !== 23) throw new Error("S0 source count differs");
  return sortedUnique(ids, "S0 source IDs");
}

function verifyProtocol(protocol: JsonObject, repositoryRoot: string): void {
  exactKeys(protocol, ["schema", "operator", "state", "cutoff", "scope", "stopping", "localDenominatorBinding", "seeds", "officialDocumentLedger", "requiredSourceChecks", "policies", "minimalRecordSchemas", "execution", "limitations"], "protocol");
  if (protocol.schema !== "phase8b-lean-search-protocol-v1" || protocol.operator !== "phase8b-lean-search-protocol-v1" || protocol.state !== "registered-search-unexecuted") throw new Error("protocol identity differs");
  const cutoff = object(protocol.cutoff, "protocol.cutoff");
  if (cutoff.inclusiveDate !== "2026-08-11" || cutoff.exclusiveInstantUtc !== "2026-08-12T00:00:00Z" || cutoff.ambiguousOrMissingDate !== "BOUNDED_OPEN") throw new Error("cutoff drift");
  const stopping = object(protocol.stopping, "protocol.stopping");
  if (stopping.frontier !== "complete cumulative nonempty included-source set" || stopping.consecutiveCompleteZeroAdditionRounds !== 2 || stopping.additionResetsCounter !== true || stopping.unresolvedRouteLeadOrAcquisition !== "BOUNDED_OPEN" || stopping.resourceCapHit !== "BOUNDED_OPEN" || stopping.closedOutcome !== "SATURATED_AT_CUTOFF") throw new Error("stopping rule drift");
  const local = object(protocol.localDenominatorBinding, "protocol.localDenominatorBinding");
  if (local.sourceContainerCount !== 23 || canonicalJson(local.artifactIndex) !== canonicalJson(S0_INDEX) || canonicalJson(local.sourceContainers) !== canonicalJson(S0_CONTAINERS)) throw new Error("S0 binding differs");
  const seeds = object(protocol.seeds, "protocol.seeds");
  assertExactStrings(stringArray(seeds.sourceContainerIds, "source seeds"), readS0SourceIds(repositoryRoot), "source seeds");
  const authors = stringArray(seeds.normalizedAuthors, "author seeds");
  const citations = stringArray(seeds.citationIdentifiers, "citation seeds");
  if (sha256Bytes(canonicalJsonBytes(authors)) !== AUTHOR_SEEDS_SHA256) throw new Error("author seed drift");
  if (sha256Bytes(canonicalJsonBytes(citations)) !== CITATION_SEEDS_SHA256) throw new Error("citation seed drift");
  assertExactStrings(stringArray(protocol.requiredSourceChecks, "required source checks"), FOLLOWUP_CHECKS, "required source checks");
  const ledger = array(protocol.officialDocumentLedger, "official document ledger").map((entry, index) => object(entry, `official document ${index}`));
  if (ledger.length !== ALL_ROUTES.length || sha256Bytes(canonicalJsonBytes(ledger)) !== DOCUMENT_LEDGER_SHA256) throw new Error("official document ledger drift");
  assertExactStrings(sortedUnique(ledger.map((entry) => string(entry.routeId, "official document.routeId")), "official document routes"), ALL_ROUTES, "official document route coverage");
  for (const entry of ledger) {
    if (!string(entry.url, "official document.url").startsWith("https://")) throw new Error("official document URL must be HTTPS");
    integer(entry.byteLength, "official document.byteLength");
    if (!SHA256.test(string(entry.sha256, "official document.sha256"))) throw new Error("official document hash differs");
  }
  const policies = object(protocol.policies, "protocol.policies");
  const rights = object(policies.rights, "rights policy");
  if (rights.default !== "unknown-open" || rights.unknownPermitsRedistribution !== false || rights.sourceBytesFiguresAndDerivedNumbersAssessedSeparately !== true) throw new Error("rights policy defaults allow or collapse rights");
  assertExactStrings(stringArray(rights.states, "rights states"), ["permitted", "prohibited", "unknown-open"], "rights states");
  const lineage = object(policies.lineage, "lineage policy");
  assertExactStrings(stringArray(lineage.dimensions, "lineage dimensions"), ["raw-data", "campaign-apparatus", "investigator-institution", "model-calibration"], "lineage dimensions");
  if (lineage.unknownDimension !== "unknown-open" || lineage.unknownMayEstablishIndependence !== false || lineage.versionsArchivesReanalysesCannotIncreaseWitnessCount !== true) throw new Error("lineage independence policy differs");
  const leakage = object(policies.leakage, "leakage policy");
  if (leakage.heldOutRequiresAllLineageDimensionsKnown !== true || leakage.anyDevelopmentOverlapBlocksHeldOut !== true || leakage.unknownBlocksHeldOut !== true) throw new Error("leakage policy differs");
  const extraction = object(policies.extraction, "extraction policy");
  if (extraction.detailedCalibrationOwner !== "S4" || extraction.numericRowsRequireReportedAndExtractionUncertaintyFields !== true) throw new Error("extraction ownership or uncertainty policy differs");
  const schemas = object(protocol.minimalRecordSchemas, "minimal schemas");
  for (const name of ["searchResult", "lead", "source", "measurement"]) if (stringArray(schemas[name], `schema ${name}`).length < 7) throw new Error(`minimal schema is incomplete: ${name}`);
  const execution = object(protocol.execution, "protocol.execution");
  assertExactStrings(stringArray(execution.matrixRouteIds, "matrix route IDs"), MATRIX_ROUTES, "matrix route IDs");
  if (execution.queryCount !== 32 || execution.routeQueryCellCount !== 256 || execution.credentialsNeverRecorded !== true || execution.smokeIsCountedSearch !== false || execution.rawCountedResponsesRequiredInS2 !== true) throw new Error("execution registration differs");
}

function verifyRoutes(routes: readonly JsonObject[]): ReadonlyMap<string, JsonObject> {
  const routeIds = routes.map((route) => string(route.id, "route.id"));
  assertExactStrings(routeIds, ALL_ROUTES, "route registry/order");
  const map = new Map<string, JsonObject>();
  for (const route of routes) {
    exactKeys(route, ["schema", "id", "disposition", "role", "queryMode", "credentialEnv", "request", "pacing", "pagination", "supportedOperations", "unsupportedOperations", "unsupportedOperationOutcome", "failOpenConditions", "followupChecks", "officialDocumentId", "removalReason"], `route ${String(route.id)}`);
    const id = string(route.id, "route.id");
    const expected = ROUTE_EXPECTATIONS[id];
    if (expected === undefined || route.schema !== "phase8b-search-route-v1" || route.disposition !== expected.disposition || route.queryMode !== expected.queryMode || route.credentialEnv !== expected.credentialEnv || route.officialDocumentId !== expected.officialDocumentId || route.unsupportedOperationOutcome !== "BOUNDED_OPEN") throw new Error(`route identity differs: ${id}`);
    assertExactStrings(stringArray(route.followupChecks, `${id}.followupChecks`), FOLLOWUP_CHECKS, `${id}.followupChecks`);
    const supported = stringArray(route.supportedOperations, `${id}.supportedOperations`);
    const unsupported = stringArray(route.unsupportedOperations, `${id}.unsupportedOperations`);
    assertExactStrings(supported, SUPPORTED_OPERATIONS[id] as readonly string[], `${id} supported operations`);
    const combined = sortedUnique([...supported, ...unsupported], `${id} operation partition`);
    assertExactStrings(combined, OPERATION_UNIVERSE, `${id} operation coverage`);
    if (supported.some((operation) => unsupported.includes(operation))) throw new Error(`route operation overlap: ${id}`);
    const pagination = object(route.pagination, `${id}.pagination`);
    if (pagination.mode !== expected.paginationMode || pagination.pageSize !== expected.pageSize || pagination.cap !== expected.cap || typeof pagination.completion !== "string" || pagination.completion.length === 0) throw new Error(`pagination contract differs: ${id}`);
    const completionMarker = COMPLETION_MARKERS[id];
    if (expected.disposition === "active" && (completionMarker === undefined || !String(pagination.completion).includes(completionMarker))) throw new Error(`pagination completion differs: ${id}`);
    if (expected.cap !== null && expected.pageSize !== null && expected.disposition === "active" && !`${String(pagination.completion)} ${stringArray(route.failOpenConditions, `${id}.failOpenConditions`).join(" ")}`.toLowerCase().includes("cap")) throw new Error(`capped route lacks cap fail-open: ${id}`);
    if (expected.disposition === "reviewed-removal") {
      if (route.request !== null || route.pacing !== null || supported.length !== 0 || nullableString(route.removalReason, `${id}.removalReason`) === null) throw new Error(`removed route remains executable: ${id}`);
    } else {
      if (route.removalReason !== null || stringArray(route.failOpenConditions, `${id}.failOpenConditions`).length === 0) throw new Error(`active route lacks fail-open conditions: ${id}`);
      const request = object(route.request, `${id}.request`);
      if (request.method !== expected.method || !string(request.targetTemplate, `${id}.targetTemplate`).startsWith(expected.endpointPrefix as string)) throw new Error(`route request differs: ${id}`);
      if (sha256Bytes(canonicalJsonBytes(request)) !== ROUTE_REQUEST_SHA256[id]) throw new Error(`route request recipe differs: ${id}`);
      const pacing = object(route.pacing, `${id}.pacing`);
      if (pacing.maxConcurrency !== 1 || integer(pacing.minIntervalMs, `${id}.minIntervalMs`) < 100) throw new Error(`route pacing differs: ${id}`);
      if (id === "crossref" && !string(request.targetTemplate, "crossref target").includes("until-pub-date%3A2026-08-11")) throw new Error("Crossref cutoff missing");
      if (id === "openalex" && (!string(request.targetTemplate, "OpenAlex target").includes("to_publication_date%3A2026-08-11") || string(request.targetTemplate, "OpenAlex target").includes("include_xpac"))) throw new Error("OpenAlex cutoff or obsolete parameter differs");
      if (id === "semantic-scholar" && !string(request.targetTemplate, "Semantic Scholar target").includes("publicationDateOrYear=%3A2026-08-11")) throw new Error("Semantic Scholar cutoff missing");
      if (id === "national-diet-library" && !string(request.targetTemplate, "NDL target").includes("until%3D%222026-08-11%22")) throw new Error("NDL cutoff missing");
      if (id === "datacite" && !stringArray(route.failOpenConditions, "DataCite fail-open").includes("publication-day-ambiguous")) throw new Error("DataCite client cutoff gap not fail-open");
    }
    map.set(id, route);
  }
  return map;
}

function verifyQueries(queries: readonly JsonObject[]): ReadonlyMap<string, JsonObject> {
  if (queries.length !== 32 || sha256Bytes(new TextEncoder().encode(`${queries.map((query) => canonicalJson(query)).join("\n")}\n`)) !== QUERY_REGISTRY_SHA256) throw new Error("query registry drift");
  const ids = queries.map((query) => string(query.id, "query.id"));
  assertExactStrings(ids, [...ids].sort(lexicalCompare), "query order");
  sortedUnique(ids, "query IDs");
  const conceptual = new Map<string, Set<string>>();
  const result = new Map<string, JsonObject>();
  for (const query of queries) {
    exactKeys(query, ["schema", "id", "conceptualId", "family", "language", "canonicalQuery", "canonicalQuerySha256"], `query ${String(query.id)}`);
    const id = string(query.id, "query.id");
    const concept = string(query.conceptualId, `${id}.conceptualId`);
    const language = string(query.language, `${id}.language`);
    const text = string(query.canonicalQuery, `${id}.canonicalQuery`);
    if (query.schema !== "phase8b-search-query-v1" || (language !== "en" && language !== "ja") || text !== text.normalize("NFC") || query.canonicalQuerySha256 !== sha256Bytes(new TextEncoder().encode(text))) throw new Error(`query semantics differ: ${id}`);
    const languages = conceptual.get(concept) ?? new Set<string>(); languages.add(language); conceptual.set(concept, languages);
    result.set(id, query);
  }
  if (conceptual.size !== 16 || [...conceptual.values()].some((languages) => canonicalJson([...languages].sort()) !== canonicalJson(["en", "ja"]))) throw new Error("query bilingual conceptual coverage differs");
  return result;
}

function rfc3986(value: string): string { return encodeURIComponent(value).replace(/[!'()*]/g, (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`); }

function reconstructMatrixRequest(route: JsonObject, query: JsonObject): JsonObject {
  const request = object(route.request, `${String(route.id)}.request`);
  const queryText = string(query.canonicalQuery, `${String(query.id)}.canonicalQuery`);
  const bodyTemplate = request.bodyTemplate;
  if (bodyTemplate !== null && typeof bodyTemplate !== "string") throw new Error(`route body template differs: ${String(route.id)}`);
  return {
    method: request.method as StrictJson,
    targetTemplate: string(request.targetTemplate, `${String(route.id)}.targetTemplate`).replaceAll("{QUERY}", rfc3986(queryText)),
    headers: request.headers as StrictJson,
    bodyTemplate: bodyTemplate?.replaceAll("{QUERY_JSON}", JSON.stringify(queryText)) ?? null,
  };
}

function reconstructSmokeRequest(route: JsonObject, firstEnglishQuery: JsonObject): JsonObject {
  let request: Record<string, StrictJson>;
  if (route.queryMode === "matrix") {
    const matrix = reconstructMatrixRequest(route, firstEnglishQuery);
    request = {
      ...matrix,
      targetTemplate: string(matrix.targetTemplate, "smoke target")
        .replace("max_results=2000", "max_results=1")
        .replace("count=200", "count=1")
        .replace("rows=1000", "rows=1")
        .replace("page%5Bsize%5D=1000", "page%5Bsize%5D=1")
        .replace("maximumRecords=500", "maximumRecords=1")
        .replace("per_page=100", "per_page=1"),
      bodyTemplate: matrix.bodyTemplate === null ? null : string(matrix.bodyTemplate, "smoke body").replace("\"size\":100", "\"size\":1"),
    };
  } else {
    request = { ...object(route.request, `${String(route.id)}.request`) };
    if (route.id === "doi-publisher") request.targetTemplate = string(request.targetTemplate, "DOI smoke target").replace("{DOI}", rfc3986("10.1175/JAS-D-19-0303.1"));
    else if (route.id === "penn-state-data-commons") request.targetTemplate = string(request.targetTemplate, "Penn smoke target").replace("{DATASET_ID}", "6184");
    else throw new Error(`seed-only smoke target differs: ${String(route.id)}`);
  }
  return request;
}

function verifyCells(cells: readonly JsonObject[], routes: ReadonlyMap<string, JsonObject>, queries: ReadonlyMap<string, JsonObject>): void {
  if (cells.length !== 256) throw new Error("route/query cell count differs");
  const ids = cells.map((cell) => string(cell.id, "route/query cell.id"));
  assertExactStrings(ids, [...ids].sort(lexicalCompare), "route/query cell order");
  sortedUnique(ids, "route/query cell IDs");
  const pairs = new Set<string>();
  for (const cell of cells) {
    exactKeys(cell, ["schema", "id", "routeId", "queryId", "cutoff", "plannedRequest", "plannedRequestSha256", "executionState"], `route/query cell ${String(cell.id)}`);
    const routeId = string(cell.routeId, "route/query routeId");
    const queryId = string(cell.queryId, "route/query queryId");
    if (!MATRIX_ROUTES.includes(routeId as typeof MATRIX_ROUTES[number]) || !queries.has(queryId) || cell.schema !== "phase8b-route-query-cell-v1" || cell.cutoff !== "2026-08-11" || cell.executionState !== "unexecuted") throw new Error(`route/query identity differs: ${routeId}/${queryId}`);
    const pair = `${routeId}\0${queryId}`; if (pairs.has(pair)) throw new Error(`duplicate route/query cell: ${routeId}/${queryId}`); pairs.add(pair);
    const request = object(cell.plannedRequest, `${routeId}/${queryId}.plannedRequest`);
    if (cell.plannedRequestSha256 !== sha256Bytes(canonicalJsonBytes(request))) throw new Error(`planned request hash differs: ${routeId}/${queryId}`);
    const route = routes.get(routeId) as JsonObject;
    const expectedRequest = reconstructMatrixRequest(route, queries.get(queryId) as JsonObject);
    if (canonicalJson(request) !== canonicalJson(expectedRequest)) throw new Error(`planned request differs from route recipe: ${routeId}/${queryId}`);
    const routeRequest = object(route.request, `${routeId}.request`);
    if (request.method !== routeRequest.method) throw new Error(`planned request method differs: ${routeId}/${queryId}`);
    const target = string(request.targetTemplate, `${routeId}/${queryId}.target`);
    const queryText = string((queries.get(queryId) as JsonObject).canonicalQuery, `${queryId}.canonicalQuery`);
    const body = request.bodyTemplate;
    if (routeId === "nasa-ntrs") {
      if (body === null || typeof body !== "string" || !body.includes(JSON.stringify(queryText))) throw new Error(`NASA request omitted query: ${queryId}`);
    } else if (!target.includes(rfc3986(queryText))) throw new Error(`planned request omitted exact query: ${routeId}/${queryId}`);
    if (!target.startsWith(ROUTE_EXPECTATIONS[routeId]?.endpointPrefix as string)) throw new Error(`planned request endpoint differs: ${routeId}/${queryId}`);
    if (/\{QUERY(?:_JSON)?\}/.test(target) || (typeof body === "string" && /\{QUERY(?:_JSON)?\}/.test(body))) throw new Error(`planned request retains query placeholder: ${routeId}/${queryId}`);
  }
  for (const routeId of MATRIX_ROUTES) for (const queryId of queries.keys()) if (!pairs.has(`${routeId}\0${queryId}`)) throw new Error(`omitted route/query cell: ${routeId}/${queryId}`);
}

function verifySmoke(smoke: readonly JsonObject[], routes: ReadonlyMap<string, JsonObject>, queries: ReadonlyMap<string, JsonObject>): { credentialBlockers: string[]; routeBlockers: string[]; summary: JsonObject } {
  if (smoke.length !== 13) throw new Error("smoke result count differs");
  const routeIds = smoke.map((record) => string(record.routeId, "smoke.routeId"));
  assertExactStrings(routeIds, ALL_ROUTES, "smoke route coverage/order");
  const firstEnglishQuery = [...queries.values()].find((query) => query.language === "en");
  if (firstEnglishQuery === undefined) throw new Error("smoke query is missing");
  const credentialBlockers: string[] = []; const routeBlockers: string[] = [];
  let succeeded = 0; let removed = 0;
  for (const record of smoke) {
    exactKeys(record, ["schema", "routeId", "outcome", "observedAtUtc", "plannedRequestSha256", "httpStatus", "effectiveUrl", "responseByteLength", "responseSha256", "blocker", "countedSearch"], `smoke ${String(record.routeId)}`);
    const routeId = string(record.routeId, "smoke.routeId");
    const route = routes.get(routeId) as JsonObject;
    const outcome = string(record.outcome, `${routeId}.outcome`);
    if (record.schema !== "phase8b-route-smoke-v1" || record.countedSearch !== false) throw new Error(`smoke identity/counting differs: ${routeId}`);
    if (route.disposition === "reviewed-removal") {
      if (outcome !== "removed" || record.observedAtUtc !== null || record.plannedRequestSha256 !== null || record.httpStatus !== null || record.effectiveUrl !== null || record.responseByteLength !== null || record.responseSha256 !== null || record.blocker !== route.removalReason) throw new Error(`removed route smoke mismatch: ${routeId}`);
      removed++; continue;
    }
    if (outcome === "blocked-credential") {
      const credential = nullableString(route.credentialEnv, `${routeId}.credentialEnv`);
      if (credential === null || record.observedAtUtc !== null || record.plannedRequestSha256 !== null || record.httpStatus !== null || record.effectiveUrl !== null || record.responseByteLength !== null || record.responseSha256 !== null || !string(record.blocker, `${routeId}.blocker`).includes(credential)) throw new Error(`credential blocker mismatch: ${routeId}`);
      credentialBlockers.push(routeId); continue;
    }
    if (outcome !== "succeeded" && outcome !== "blocked-route") throw new Error(`active route smoke outcome differs: ${routeId}`);
    const observed = string(record.observedAtUtc, `${routeId}.observedAtUtc`);
    const smokeHash = string(record.plannedRequestSha256, `${routeId}.plannedRequestSha256`);
    if (!Number.isFinite(Date.parse(observed)) || !SHA256.test(smokeHash)) throw new Error(`smoke provenance differs: ${routeId}`);
    if (smokeHash !== sha256Bytes(canonicalJsonBytes(reconstructSmokeRequest(route, firstEnglishQuery)))) throw new Error(`smoke planned request differs: ${routeId}`);
    if (outcome === "succeeded") {
      const status = integer(record.httpStatus, `${routeId}.httpStatus`);
      if (status < 200 || status >= 300 || !string(record.effectiveUrl, `${routeId}.effectiveUrl`).startsWith("https://") || !SHA256.test(string(record.responseSha256, `${routeId}.responseSha256`)) || integer(record.responseByteLength, `${routeId}.responseByteLength`) > 2 * 1024 * 1024 || record.blocker !== null) throw new Error(`successful smoke is incoherent: ${routeId}`);
      succeeded++;
    } else {
      string(record.blocker, `${routeId}.blocker`); routeBlockers.push(routeId);
      if (record.responseSha256 !== null && !SHA256.test(string(record.responseSha256, `${routeId}.responseSha256`))) throw new Error(`blocked response hash differs: ${routeId}`);
      if (record.responseByteLength !== null) integer(record.responseByteLength, `${routeId}.responseByteLength`);
    }
  }
  return { credentialBlockers, routeBlockers, summary: { succeeded, blockedCredential: credentialBlockers.length, blockedRoute: routeBlockers.length, removed } };
}

function verifyReport(report: JsonObject, payloadDescriptors: readonly JsonObject[], routeCount: number, queryCount: number, cellCount: number, smokeCount: number, smoke: ReturnType<typeof verifySmoke>): VerifiedSearchProtocol {
  exactKeys(report, ["schema", "operator", "state", "artifacts", "derivedCounts", "smokeSummary", "credentialBlockers", "routeBlockers", "readiness", "grantsValidationClaim", "permitsPhase9Execution", "claim"], "report");
  if (report.schema !== "phase8b-lean-search-report-v1" || report.operator !== "phase8b-lean-search-protocol-v1" || report.state !== "protocol-candidate-search-unexecuted" || report.grantsValidationClaim !== false || report.permitsPhase9Execution !== false) throw new Error("report identity or claim boundary differs");
  if (canonicalJson(report.artifacts) !== canonicalJson(payloadDescriptors)) throw new Error("report artifact pins differ");
  const counts = object(report.derivedCounts, "report.derivedCounts");
  const expectedCounts = { routeCount, activeRouteCount: 10, removedRouteCount: 3, queryCount, routeQueryCellCount: cellCount, smokeResultCount: smokeCount, registeredSearchRequestCount: 0 };
  if (canonicalJson(counts) !== canonicalJson(expectedCounts)) throw new Error("report counts differ");
  if (canonicalJson(report.smokeSummary) !== canonicalJson(smoke.summary) || canonicalJson(report.credentialBlockers) !== canonicalJson(smoke.credentialBlockers) || canonicalJson(report.routeBlockers) !== canonicalJson(smoke.routeBlockers)) throw new Error("report smoke summary differs");
  const readiness = smoke.routeBlockers.length > 0 ? "protocol-recorded-route-blockers-open" : smoke.credentialBlockers.length > 0 ? "protocol-ready-credentials-open" : "ready-for-counted-search-after-freeze";
  if (report.readiness !== readiness) throw new Error("report readiness differs");
  return { routeCount, queryCount, routeQueryCellCount: cellCount, credentialBlockers: smoke.credentialBlockers, routeBlockers: smoke.routeBlockers, readiness };
}

export function verifyPhase8SearchArtifacts(actual: ReadonlyMap<string, Uint8Array>, repositoryRoot: string): VerifiedSearchProtocol {
  const names = [...actual.keys()].sort(lexicalCompare);
  assertExactStrings(names, ARTIFACT_NAMES, "bundle file set");
  const parsed = new Map<string, StrictJson>();
  for (const name of ["artifact-index.json", "protocol.json", "report.json"] as const) parsed.set(name, parseCanonicalJson(actual.get(name) as Uint8Array, name));
  const index = object(parsed.get("artifact-index.json"), "artifact index");
  exactKeys(index, ["schema", "bundleCompleteness", "report", "artifacts"], "artifact index");
  if (index.schema !== "phase8b-lean-search-index-v1" || index.bundleCompleteness !== "complete") throw new Error("artifact index identity differs");
  const payloadDescriptors = PAYLOAD_NAMES.map((path) => descriptor(path, path.endsWith("jsonl") ? "canonical-jsonl" : "canonical-json", actual.get(path) as Uint8Array));
  const reportDescriptor = descriptor("report.json", "canonical-json-report", actual.get("report.json") as Uint8Array);
  if (canonicalJson(descriptorFrom(index.report, "artifact index report")) !== canonicalJson(reportDescriptor)) throw new Error("artifact index report pin differs");
  if (canonicalJson(array(index.artifacts, "artifact index artifacts").map((entry, position) => descriptorFrom(entry, `artifact index artifact ${position}`))) !== canonicalJson([reportDescriptor, ...payloadDescriptors])) throw new Error("artifact index payload pins differ");
  const protocol = object(parsed.get("protocol.json"), "protocol");
  const report = object(parsed.get("report.json"), "report");
  const routes = parseJsonLines(actual.get("routes.jsonl") as Uint8Array, "routes.jsonl");
  const queries = parseJsonLines(actual.get("queries.jsonl") as Uint8Array, "queries.jsonl");
  const cells = parseJsonLines(actual.get("route-query-cells.jsonl") as Uint8Array, "route-query-cells.jsonl");
  const smokeRecords = parseJsonLines(actual.get("smoke-results.jsonl") as Uint8Array, "smoke-results.jsonl");
  for (const value of [protocol, report, ...routes, ...queries, ...cells, ...smokeRecords]) rejectCallerVerdicts(value);
  verifyProtocol(protocol, repositoryRoot);
  const routeMap = verifyRoutes(routes);
  const queryMap = verifyQueries(queries);
  verifyCells(cells, routeMap, queryMap);
  const smoke = verifySmoke(smokeRecords, routeMap, queryMap);
  return verifyReport(report, payloadDescriptors, routes.length, queries.length, cells.length, smokeRecords.length, smoke);
}

export function verifyPhase8SearchBundle(directory: string, repositoryRoot: string): VerifiedSearchProtocol {
  const root = resolve(directory);
  const entries = readdirSync(root, { withFileTypes: true });
  const artifacts = new Map<string, Uint8Array>();
  for (const entry of entries) {
    if (!entry.isFile() || entry.isSymbolicLink()) throw new Error(`bundle entry is not a regular file: ${entry.name}`);
    artifacts.set(entry.name, readRegular(join(root, entry.name), entry.name));
  }
  return verifyPhase8SearchArtifacts(artifacts, repositoryRoot);
}
