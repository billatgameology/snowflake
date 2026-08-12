// Phase 8B S1 lean external-search protocol producer and smoke runner.
//
// This file registers the bounded search. It does not execute a counted search, classify a
// source, or extract a measurement. S2 consumes the frozen route/query cells; S4 owns detailed
// extraction calibration.

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
import {
  canonicalJson,
  canonicalJsonBytes,
  parseCanonicalJson,
  sha256Bytes,
  type StrictJson,
} from "./gate4-evidence.ts";

export const PHASE8_SEARCH_OPERATOR = "phase8b-lean-search-protocol-v1" as const;
export const PHASE8_SEARCH_CUTOFF = "2026-08-11" as const;
export const PHASE8_SEARCH_ARTIFACTS = [
  "artifact-index.json",
  "protocol.json",
  "queries.jsonl",
  "report.json",
  "route-query-cells.jsonl",
  "routes.jsonl",
  "smoke-results.jsonl",
] as const;

const PAYLOAD_NAMES = [
  "protocol.json",
  "queries.jsonl",
  "route-query-cells.jsonl",
  "routes.jsonl",
  "smoke-results.jsonl",
] as const;
const MATRIX_ROUTE_IDS = [
  "arxiv",
  "cinii",
  "crossref",
  "datacite",
  "nasa-ntrs",
  "national-diet-library",
  "openalex",
  "semantic-scholar",
] as const;
const FOLLOWUP_CHECKS = [
  "version-of-record",
  "correction-or-retraction",
  "supplement",
  "public-data",
  "acquisition-disposition",
] as const;
const OPERATION_UNIVERSE = [
  "backward-citations",
  "corrections-supplements",
  "datasets",
  "exact-record",
  "forward-citations",
  "free-text",
  "later-author-output",
  "versions",
] as const;
const S0_INDEX = {
  path: "evidence/phase8b-local-denominator/artifact-index.json",
  byteLength: 1_158,
  sha256: "93c83a98ef053e4b22b24ce3c072f862b23d55a552df5da177f71f2d935bb8f2",
} as const;
const S0_CONTAINERS = {
  path: "evidence/phase8b-local-denominator/source-containers.jsonl",
  byteLength: 18_688,
  sha256: "3f12256918c845cdf2f44a9029dc01ab06c774f7ac1df11e33d3667f8ef23106",
} as const;

type JsonObject = { readonly [key: string]: StrictJson };
type RouteDisposition = "active" | "reviewed-removal";
type SmokeOutcome = "succeeded" | "blocked-credential" | "blocked-route" | "removed";

interface DocumentPin {
  readonly id: string;
  readonly routeId: string;
  readonly url: string;
  readonly byteLength: number;
  readonly sha256: string;
}

interface RequestTemplate {
  readonly method: "GET" | "POST";
  readonly targetTemplate: string;
  readonly headers: readonly { readonly name: string; readonly valueTemplate: string }[];
  readonly bodyTemplate: string | null;
}

export interface SearchRoute {
  readonly schema: "phase8b-search-route-v1";
  readonly id: string;
  readonly disposition: RouteDisposition;
  readonly role: string;
  readonly queryMode: "matrix" | "seed-only" | "none";
  readonly credentialEnv: string | null;
  readonly request: RequestTemplate | null;
  readonly pacing: { readonly minIntervalMs: number; readonly maxConcurrency: 1 } | null;
  readonly pagination: {
    readonly mode: string;
    readonly pageSize: number | null;
    readonly cap: number | null;
    readonly completion: string;
  };
  readonly supportedOperations: readonly string[];
  readonly unsupportedOperations: readonly string[];
  readonly unsupportedOperationOutcome: "BOUNDED_OPEN";
  readonly failOpenConditions: readonly string[];
  readonly followupChecks: readonly string[];
  readonly officialDocumentId: string;
  readonly removalReason: string | null;
}

export interface SearchQuery {
  readonly schema: "phase8b-search-query-v1";
  readonly id: string;
  readonly conceptualId: string;
  readonly family: string;
  readonly language: "en" | "ja";
  readonly canonicalQuery: string;
  readonly canonicalQuerySha256: string;
}

export interface RouteQueryCell {
  readonly schema: "phase8b-route-query-cell-v1";
  readonly id: string;
  readonly routeId: string;
  readonly queryId: string;
  readonly cutoff: typeof PHASE8_SEARCH_CUTOFF;
  readonly plannedRequest: RequestTemplate;
  readonly plannedRequestSha256: string;
  readonly executionState: "unexecuted";
}

export interface SmokeResult {
  readonly schema: "phase8b-route-smoke-v1";
  readonly routeId: string;
  readonly outcome: SmokeOutcome;
  readonly observedAtUtc: string | null;
  readonly plannedRequestSha256: string | null;
  readonly httpStatus: number | null;
  readonly effectiveUrl: string | null;
  readonly responseByteLength: number | null;
  readonly responseSha256: string | null;
  readonly blocker: string | null;
  readonly countedSearch: false;
}

export interface SearchBundle {
  readonly artifacts: ReadonlyMap<string, Uint8Array>;
  readonly routeCount: number;
  readonly queryCount: number;
  readonly routeQueryCellCount: number;
  readonly credentialBlockers: readonly string[];
  readonly routeBlockers: readonly string[];
}

const DOCUMENTS: readonly DocumentPin[] = [
  { id: "doc-arxiv", routeId: "arxiv", url: "https://info.arxiv.org/help/api/user-manual.html", byteLength: 160_616, sha256: "14579fd2abb6d7c1aa0fe01af75754ea283852d4b8f63c3072ae31ebeb04b445" },
  { id: "doc-cinii", routeId: "cinii", url: "https://support.nii.ac.jp/ja/cir/r_opensearch", byteLength: 88_199, sha256: "9ea0b3a27a95f714e2ed1c6aa4bd5a1f7e54a5bcad10f48b4b61fc0602b365c2" },
  { id: "doc-crossref", routeId: "crossref", url: "https://www.crossref.org/documentation/retrieve-metadata/rest-api/", byteLength: 70_010, sha256: "2d0b0eedaf9b60516610873f90fa8fd85ef132d714856ec659d82e438f977cb6" },
  { id: "doc-datacite", routeId: "datacite", url: "https://support.datacite.org/reference", byteLength: 176_849, sha256: "674016364e5404cece21e83754b645171a52859a213b529651a344ecbc0fc734" },
  { id: "doc-doi", routeId: "doi-publisher", url: "https://www.doi.org/doi-handbook/DOIHandbook_2025.pdf", byteLength: 2_109_394, sha256: "1f6c73c12890a8bef8f30d06a7fe1de90723318e796bfff68d4a64759b4ddcf3" },
  { id: "doc-jstage", routeId: "jstage", url: "https://www.jstage.jst.go.jp/static/pages/WebAPI/-char/ja", byteLength: 60_754, sha256: "40bf89d29e9eed874d69b0e68d2110843aa11caff2ac1690a0157df8cf731f2a" },
  { id: "doc-nasa", routeId: "nasa-ntrs", url: "https://ntrs.nasa.gov/api/openapi/openapi/swagger-ui-init.js", byteLength: 62_450, sha256: "c717d64a274d3024acf5b4381f022e61a9756a79380e5af906d74124a1d2cb7a" },
  { id: "doc-ndl", routeId: "national-diet-library", url: "https://ndlsearch.ndl.go.jp/file/help/api/specifications/ndlsearch_api_20260331.pdf", byteLength: 740_996, sha256: "df71c696a5d34358715528c4ded29c8ea97f7c81a3c7128a412a5499f4ec4df7" },
  { id: "doc-openalex", routeId: "openalex", url: "https://developers.openalex.org/api-reference/works/list-works", byteLength: 537_307, sha256: "7338c6925b261b9b613cb7669356c9c0634064ebf6906284dba6fef7461c81ab" },
  { id: "doc-penn", routeId: "penn-state-data-commons", url: "https://www.datacommons.psu.edu/commonswizard/MetadataDisplay.aspx?Dataset=6184", byteLength: 12_062, sha256: "dd76f8c536ec84288ff42ffa9572dd49f00d05cbee8abec57ae81965a70ec84e" },
  { id: "doc-semantic-scholar", routeId: "semantic-scholar", url: "https://api.semanticscholar.org/graph/v1/swagger.json", byteLength: 123_200, sha256: "00d7302bcb07414971a0b483d332e57c01344e037ce878d5baab3c312df039ae" },
  { id: "doc-supplemental-web", routeId: "supplemental-web", url: "https://api-dashboard.search.brave.com/documentation/resources/terms-of-service", byteLength: 118_471, sha256: "17aaedc21102e1ccd1bca53db246c7fadad73ec4e5f77ea4b8c0c87c95a98cb0" },
  { id: "doc-zenodo", routeId: "zenodo", url: "https://support.zenodo.org/help/en-gb/31-api/209-what-is-the-difference-between-the-legacy-api-and-the-rest-api", byteLength: 7_337, sha256: "0db35a191c9fc7ae806c866184f0d62d1fb96423c9a2eee465474c5513c0157f" },
] as const;

const ACTIVE_COMMON = {
  schema: "phase8b-search-route-v1" as const,
  disposition: "active" as const,
  unsupportedOperationOutcome: "BOUNDED_OPEN" as const,
  followupChecks: FOLLOWUP_CHECKS,
  removalReason: null,
};

function unsupported(supported: readonly string[]): readonly string[] {
  const present = new Set(supported);
  return OPERATION_UNIVERSE.filter((operation) => !present.has(operation));
}

function activeRoute(input: Omit<SearchRoute, keyof typeof ACTIVE_COMMON | "unsupportedOperations">): SearchRoute {
  return { ...ACTIVE_COMMON, ...input, unsupportedOperations: unsupported(input.supportedOperations) };
}

function removedRoute(id: string, role: string, officialDocumentId: string, reason: string): SearchRoute {
  return {
    schema: "phase8b-search-route-v1",
    id,
    disposition: "reviewed-removal",
    role,
    queryMode: "none",
    credentialEnv: null,
    request: null,
    pacing: null,
    pagination: { mode: "not-applicable", pageSize: null, cap: null, completion: "not-applicable" },
    supportedOperations: [],
    unsupportedOperations: OPERATION_UNIVERSE,
    unsupportedOperationOutcome: "BOUNDED_OPEN",
    failOpenConditions: [],
    followupChecks: FOLLOWUP_CHECKS,
    officialDocumentId,
    removalReason: reason,
  };
}

export const PHASE8_SEARCH_ROUTES: readonly SearchRoute[] = [
  activeRoute({
    id: "arxiv", role: "bibliographic-discovery", queryMode: "matrix", credentialEnv: null,
    request: { method: "GET", targetTemplate: "https://export.arxiv.org/api/query?search_query=all%3A%22{QUERY}%22%20AND%20submittedDate%3A%5B190001010000%20TO%20202608112359%5D&start=0&max_results=2000&sortBy=submittedDate&sortOrder=ascending", headers: [{ name: "accept", valueTemplate: "application/atom+xml" }], bodyTemplate: null },
    pacing: { minIntervalMs: 3_000, maxConcurrency: 1 },
    pagination: { mode: "offset-plus-total", pageSize: 2_000, cap: 30_000, completion: "cumulative-unique-equals-initial-total; cap hit is BOUNDED_OPEN" },
    supportedOperations: ["exact-record", "free-text", "later-author-output", "versions"],
    failOpenConditions: ["total-changed", "duplicate-or-missing-id", "cap-hit", "response-parse-failure"], officialDocumentId: "doc-arxiv",
  }),
  activeRoute({
    id: "cinii", role: "bibliographic-discovery", queryMode: "matrix", credentialEnv: "CINII_APP_ID",
    request: { method: "GET", targetTemplate: "https://cir.nii.ac.jp/opensearch/v2/articles?appid={{CINII_APP_ID}}&q={QUERY}&from=190001&until=202608&sortorder=0&count=200&start=1&format=json", headers: [{ name: "accept", valueTemplate: "application/json" }], bodyTemplate: null },
    pacing: { minIntervalMs: 1_000, maxConcurrency: 1 },
    pagination: { mode: "recursive-inclusive-calendar-month-partition", pageSize: 200, cap: 10_000, completion: "all leaf counts reconciled below cap; irreducible cap is BOUNDED_OPEN" },
    supportedOperations: ["exact-record", "free-text", "later-author-output"],
    failOpenConditions: ["credential-missing", "month-cap-hit", "august-day-precision-ambiguous", "response-parse-failure"], officialDocumentId: "doc-cinii",
  }),
  activeRoute({
    id: "crossref", role: "bibliographic-discovery", queryMode: "matrix", credentialEnv: "PHASE8_CONTACT_EMAIL",
    request: { method: "GET", targetTemplate: "https://api.crossref.org/v1/works?query.bibliographic={QUERY}&filter=until-pub-date%3A2026-08-11&sort=published&order=asc&rows=1000&cursor=%2A&mailto={{PHASE8_CONTACT_EMAIL}}", headers: [{ name: "accept", valueTemplate: "application/vnd.crossref-api-message+json" }, { name: "user-agent", valueTemplate: "VirtualCloudChamber-Phase8B/1.0 (mailto:{{PHASE8_CONTACT_EMAIL}})" }], bodyTemplate: null },
    pacing: { minIntervalMs: 100, maxConcurrency: 1 },
    pagination: { mode: "cursor", pageSize: 1_000, cap: null, completion: "short page after all cursors captured" },
    supportedOperations: ["backward-citations", "corrections-supplements", "datasets", "exact-record", "free-text", "later-author-output", "versions"],
    failOpenConditions: ["credential-missing", "cursor-missing", "cursor-repeat", "response-parse-failure"], officialDocumentId: "doc-crossref",
  }),
  activeRoute({
    id: "datacite", role: "dataset-discovery", queryMode: "matrix", credentialEnv: "PHASE8_CONTACT_EMAIL",
    request: { method: "GET", targetTemplate: "https://api.datacite.org/dois?query={QUERY}&page%5Bcursor%5D=1&page%5Bsize%5D=1000", headers: [{ name: "accept", valueTemplate: "application/vnd.api+json" }, { name: "user-agent", valueTemplate: "VirtualCloudChamber-Phase8B/1.0 (mailto:{{PHASE8_CONTACT_EMAIL}})" }], bodyTemplate: null },
    pacing: { minIntervalMs: 1_000, maxConcurrency: 1 },
    pagination: { mode: "cursor-link", pageSize: 1_000, cap: null, completion: "links.next absent and unique total reconciled" },
    supportedOperations: ["datasets", "exact-record", "free-text", "versions"],
    failOpenConditions: ["credential-missing", "next-link-missing-or-malformed", "publication-day-ambiguous", "response-parse-failure"], officialDocumentId: "doc-datacite",
  }),
  activeRoute({
    id: "doi-publisher", role: "seed-resolution-and-source-currency", queryMode: "seed-only", credentialEnv: null,
    request: { method: "GET", targetTemplate: "https://doi.org/{DOI}", headers: [{ name: "accept", valueTemplate: "text/html,application/pdf;q=0.9,*/*;q=0.1" }], bodyTemplate: null },
    pacing: { minIntervalMs: 1_000, maxConcurrency: 1 },
    pagination: { mode: "redirect-chain", pageSize: null, cap: 10, completion: "terminal response and complete redirect chain captured" },
    supportedOperations: ["corrections-supplements", "datasets", "exact-record", "versions"],
    failOpenConditions: ["redirect-cap-hit", "malformed-location", "terminal-response-unavailable", "version-or-rights-unresolved"], officialDocumentId: "doc-doi",
  }),
  removedRoute("jstage", "bibliographic-discovery", "doc-jstage", "API terms prohibit retaining machine-readable results for the evidence period; route contributes no closure claim"),
  activeRoute({
    id: "nasa-ntrs", role: "bibliographic-and-report-discovery", queryMode: "matrix", credentialEnv: "PHASE8_CONTACT_EMAIL",
    request: { method: "POST", targetTemplate: "https://ntrs.nasa.gov/api/citations/search", headers: [{ name: "accept", valueTemplate: "application/json" }, { name: "content-type", valueTemplate: "application/json; charset=utf-8" }, { name: "user-agent", valueTemplate: "VirtualCloudChamber-Phase8B/1.0 (contact:{{PHASE8_CONTACT_EMAIL}})" }], bodyTemplate: "{\"page\":{\"from\":0,\"size\":100},\"q\":{QUERY_JSON},\"sort\":{\"field\":\"id\",\"order\":\"asc\"}}" },
    pacing: { minIntervalMs: 2_000, maxConcurrency: 1 },
    pagination: { mode: "offset-with-exact-id-order", pageSize: 100, cap: 10_000, completion: "short page and stats total reconciled; cap hit is BOUNDED_OPEN" },
    supportedOperations: ["exact-record", "free-text", "later-author-output"],
    failOpenConditions: ["credential-missing", "result-cap-hit", "order-drift", "stats-total-mismatch", "response-parse-failure"], officialDocumentId: "doc-nasa",
  }),
  activeRoute({
    id: "national-diet-library", role: "bibliographic-discovery", queryMode: "matrix", credentialEnv: null,
    request: { method: "GET", targetTemplate: "https://ndlsearch.ndl.go.jp/api/sru?operation=searchRetrieve&version=1.2&query=anywhere%3D%22{QUERY}%22%20AND%20from%3D%221900-01-01%22%20AND%20until%3D%222026-08-11%22&maximumRecords=500&startRecord=1", headers: [{ name: "accept", valueTemplate: "application/xml" }], bodyTemplate: null },
    pacing: { minIntervalMs: 1_000, maxConcurrency: 1 },
    pagination: { mode: "recursive-inclusive-calendar-day-partition", pageSize: 500, cap: 500, completion: "all leaf counts reconciled below cap; irreducible day cap is BOUNDED_OPEN" },
    supportedOperations: ["exact-record", "free-text", "later-author-output"],
    failOpenConditions: ["single-day-cap-hit", "count-reconciliation-failed", "response-parse-failure"], officialDocumentId: "doc-ndl",
  }),
  activeRoute({
    id: "openalex", role: "bibliographic-discovery", queryMode: "matrix", credentialEnv: "OPENALEX_API_KEY",
    request: { method: "GET", targetTemplate: "https://api.openalex.org/works?search={QUERY}&filter=to_publication_date%3A2026-08-11&sort=publication_date&per_page=100&cursor=%2A&api_key={{OPENALEX_API_KEY}}", headers: [{ name: "accept", valueTemplate: "application/json" }], bodyTemplate: null },
    pacing: { minIntervalMs: 100, maxConcurrency: 1 },
    pagination: { mode: "cursor", pageSize: 100, cap: null, completion: "next_cursor null after final result page" },
    supportedOperations: ["backward-citations", "exact-record", "forward-citations", "free-text", "later-author-output"],
    failOpenConditions: ["credential-missing", "cursor-missing-or-repeat", "stable-order-unavailable", "response-parse-failure"], officialDocumentId: "doc-openalex",
  }),
  activeRoute({
    id: "penn-state-data-commons", role: "seed-dataset-discovery", queryMode: "seed-only", credentialEnv: null,
    request: { method: "GET", targetTemplate: "https://www.datacommons.psu.edu/commonswizard/MetadataDisplay.aspx?Dataset={DATASET_ID}", headers: [{ name: "accept", valueTemplate: "text/html" }], bodyTemplate: null },
    pacing: { minIntervalMs: 1_000, maxConcurrency: 1 },
    pagination: { mode: "exact-seed-records", pageSize: null, cap: 3, completion: "all registered dataset IDs terminal" },
    supportedOperations: ["datasets", "exact-record", "versions"],
    failOpenConditions: ["seed-record-unavailable", "file-license-unresolved", "date-day-precision-unavailable"], officialDocumentId: "doc-penn",
  }),
  activeRoute({
    id: "semantic-scholar", role: "bibliographic-discovery", queryMode: "matrix", credentialEnv: null,
    request: { method: "GET", targetTemplate: "https://api.semanticscholar.org/graph/v1/paper/search/bulk?query={QUERY}&publicationDateOrYear=%3A2026-08-11&sort=paperId%3Aasc&fields=paperId%2CcorpusId%2CexternalIds%2Ctitle%2Cabstract%2Cyear%2CpublicationDate%2Cauthors%2Cvenue%2CpublicationTypes%2CopenAccessPdf", headers: [{ name: "accept", valueTemplate: "application/json" }], bodyTemplate: null },
    pacing: { minIntervalMs: 1_000, maxConcurrency: 1 },
    pagination: { mode: "token", pageSize: 1_000, cap: 10_000_000, completion: "continuation token absent" },
    supportedOperations: ["backward-citations", "exact-record", "forward-citations", "free-text", "later-author-output"],
    failOpenConditions: ["token-repeat", "cap-hit", "publication-date-missing", "response-parse-failure"], officialDocumentId: "doc-semantic-scholar",
  }),
  removedRoute("supplemental-web", "supplemental-discovery", "doc-supplemental-web", "no provider contract combined bounded observable closure with permitted retained response evidence"),
  removedRoute("zenodo", "dataset-discovery", "doc-zenodo", "current and documented legacy APIs did not yield one source-supported current pagination/cap/sort contract"),
] as const;

const QUERY_DEFINITIONS = [
  ["facet-rate", "vapor-sublimation-and-facet-rates", "ice crystal facet growth velocity measurement", "氷晶 結晶面 成長速度 測定"],
  ["facet-threshold", "facet-thresholds", "ice crystal critical supersaturation facet growth threshold measurement", "氷晶 結晶面 臨界過飽和度 成長しきい値 測定"],
  ["geometry", "geometry-and-density", "ice crystal area volume density length width measurement", "氷晶 面積 体積 密度 長さ 幅 測定"],
  ["habit", "morphology-and-trajectories", "snow crystal morphology habit transition distribution experiment", "雪結晶 形態 晶癖 転移 分布 実験"],
  ["historical-lexicon", "historical-lexicon", "artificial snow crystal growth experiment", "人工雪 雪の結晶 成長 実験"],
  ["history", "environmental-controls", "ice crystal growth changing temperature supersaturation growth history experiment", "氷晶 成長 温度 過飽和 変化 成長履歴 実験"],
  ["native-data", "native-data-and-supplements", "ice crystal growth dataset data table measurements", "氷晶 成長 データセット データ表 測定値"],
  ["natural-cloud", "controlled-natural-cloud", "individual ice crystal natural cloud growth controlled observation", "個々の氷晶 自然雲 成長 制御観測"],
  ["pressure-gas", "environmental-controls", "ice crystal growth pressure background gas composition experiment", "氷晶 成長 圧力 雰囲気ガス 組成 実験"],
  ["seed", "environmental-controls", "ice crystal growth seed nucleation substrate experiment", "氷晶 成長 種結晶 核生成 基板 実験"],
  ["sublimation", "vapor-sublimation-and-facet-rates", "ice crystal sublimation temperature humidity experiment", "氷晶 昇華 温度 湿度 実験"],
  ["supplement", "native-data-and-supplements", "ice crystal growth supplementary material supporting information data", "氷晶 成長 補足資料 付録 付属データ"],
  ["thermal", "environmental-controls", "ice crystal growth thermal effect temperature gradient latent heat experiment", "氷晶 成長 熱的効果 温度勾配 潜熱 実験"],
  ["trajectory", "morphology-and-trajectories", "snow crystal mass size thickness time series experiment", "雪結晶 質量 寸法 厚さ 時間変化 実験"],
  ["vapor", "vapor-sublimation-and-facet-rates", "ice crystal vapor growth temperature supersaturation experiment", "氷晶 気相成長 温度 過飽和 実験"],
  ["ventilation", "environmental-controls", "ice crystal growth ventilation airflow free fall experiment", "氷晶 成長 通風 気流 自由落下 実験"],
] as const;

export const PHASE8_SEARCH_QUERIES: readonly SearchQuery[] = QUERY_DEFINITIONS.flatMap(
  ([conceptualId, family, en, ja]) => ([
    { schema: "phase8b-search-query-v1" as const, id: `p8b-s1-q-${conceptualId}-en-v1`, conceptualId: `Q-${conceptualId.toUpperCase()}`, family, language: "en" as const, canonicalQuery: en.normalize("NFC"), canonicalQuerySha256: sha256Bytes(new TextEncoder().encode(en.normalize("NFC"))) },
    { schema: "phase8b-search-query-v1" as const, id: `p8b-s1-q-${conceptualId}-ja-v1`, conceptualId: `Q-${conceptualId.toUpperCase()}`, family, language: "ja" as const, canonicalQuery: ja.normalize("NFC"), canonicalQuerySha256: sha256Bytes(new TextEncoder().encode(ja.normalize("NFC"))) },
  ]),
);

const AUTHOR_SEEDS = [
  "Alexander Harrison", "Alfred M. Moyle", "Brian D. Swanson", "David Griffeath",
  "Gorow Wakahama", "Gwenore F. Pokrifka", "James Walkling", "Janko Gravner",
  "Jerry Y. Harrington", "John Hallett", "Jon Nelson", "Journal of the Meteorological Society of Japan",
  "Kenneth G. Libbrecht", "Lavender Elle Hanson", "Marcia B. Baker", "Marcus Hanson",
  "Matthew P. Bailey", "Neil J. Bacon", "Norihiko Fukuta", "Tatsuo Endoh", "Tsuneya Takahashi",
] as const;

const CITATION_SEEDS = [
  "arxiv:0711.4020", "arxiv:1211.5555v1", "arxiv:1910.06389v2", "arxiv:1910.09067v2",
  "arxiv:1912.03230v1", "arxiv:1912.09440v1", "arxiv:2004.06212v1", "arxiv:2009.08404v2",
  "arxiv:2011.02353v1", "arxiv:2012.12916v1", "arxiv:2106.09809v1", "arxiv:2109.00098v1",
  "arxiv:2306.04042v1", "arxiv:2306.13087v1", "doi:10.1103/PhysRevE.79.011601",
  "doi:10.1175/1520-0469(1998)055<0910:SOIC>2.0.CO;2",
  "doi:10.1175/1520-0469(2004)061<0514:GRAHOI>2.0.CO;2", "doi:10.1175/JAS-D-15-0234.1",
  "doi:10.1175/JAS-D-19-0303.1", "doi:10.1175/JAS-D-25-0030.1", "doi:10.1175/JAS-D-26-0016.1",
  "doi:10.1256/qj.02.04", "doi:10.2151/jmsj1965.66.6_841", "doi:10.2151/jmsj1965.69.1_15",
  "doi:10.2151/jmsj1965.69.2_251", "doi:10.26208/XJQK-R076", "doi:10.26208/YMMC-Z637",
  "doi:10.26208/dd1w-wa17", "title-sha256:52fc61ef9a45060c43bae30ee6d1031a62598ecac26b196a7d8e3b76ea19ccf3",
] as const;

function rfc3986(value: string): string {
  return encodeURIComponent(value).replace(/[!'()*]/g, (character) =>
    `%${character.charCodeAt(0).toString(16).toUpperCase()}`);
}

function plannedRequest(route: SearchRoute, query: SearchQuery): RequestTemplate {
  if (route.request === null || route.queryMode !== "matrix") throw new Error(`route has no matrix request: ${route.id}`);
  const encoded = rfc3986(query.canonicalQuery);
  return {
    method: route.request.method,
    targetTemplate: route.request.targetTemplate.replaceAll("{QUERY}", encoded),
    headers: route.request.headers,
    bodyTemplate: route.request.bodyTemplate?.replaceAll("{QUERY_JSON}", JSON.stringify(query.canonicalQuery)) ?? null,
  };
}

export function deriveRouteQueryCells(): readonly RouteQueryCell[] {
  const routeById = new Map(PHASE8_SEARCH_ROUTES.map((route) => [route.id, route]));
  return MATRIX_ROUTE_IDS.flatMap((routeId) => {
    const route = routeById.get(routeId);
    if (route === undefined) throw new Error(`missing matrix route: ${routeId}`);
    return PHASE8_SEARCH_QUERIES.map((query) => {
      const request = plannedRequest(route, query);
      return {
        schema: "phase8b-route-query-cell-v1" as const,
        id: `p8b-s1-rq-${routeId}-${query.id.slice("p8b-s1-q-".length)}`,
        routeId,
        queryId: query.id,
        cutoff: PHASE8_SEARCH_CUTOFF,
        plannedRequest: request,
        plannedRequestSha256: sha256Bytes(canonicalJsonBytes(request)),
        executionState: "unexecuted" as const,
      };
    });
  });
}

function jsonLines(records: readonly unknown[]): Uint8Array {
  return new TextEncoder().encode(`${records.map((record) => canonicalJson(record)).join("\n")}\n`);
}

function parseJsonLines(bytes: Uint8Array, label: string): readonly JsonObject[] {
  let text: string;
  try { text = new TextDecoder("utf-8", { fatal: true }).decode(bytes); }
  catch { throw new Error(`${label} is not UTF-8`); }
  if (!text.endsWith("\n")) throw new Error(`${label} lacks final newline`);
  const lines = text.slice(0, -1).split("\n");
  if (lines.length === 1 && lines[0] === "") return [];
  return lines.map((line, index) => {
    const value = parseCanonicalJson(new TextEncoder().encode(`${line}\n`), `${label}:${index + 1}`);
    if (value === null || typeof value !== "object" || Array.isArray(value)) throw new Error(`${label}:${index + 1} must be an object`);
    return value as JsonObject;
  });
}

function readPinned(repositoryRoot: string, pin: typeof S0_INDEX | typeof S0_CONTAINERS): Uint8Array {
  const absolute = resolve(repositoryRoot, pin.path);
  const stats = lstatSync(absolute);
  if (!stats.isFile() || stats.isSymbolicLink()) throw new Error(`S0 binding is not a regular file: ${pin.path}`);
  const bytes = new Uint8Array(readFileSync(absolute));
  if (bytes.byteLength !== pin.byteLength || sha256Bytes(bytes) !== pin.sha256) throw new Error(`S0 binding drift: ${pin.path}`);
  return bytes;
}

function sourceSeedIds(repositoryRoot: string): readonly string[] {
  readPinned(repositoryRoot, S0_INDEX);
  const records = parseJsonLines(readPinned(repositoryRoot, S0_CONTAINERS), S0_CONTAINERS.path);
  const ids = records.map((record) => {
    if (typeof record.id !== "string") throw new Error("S0 source container lacks id");
    return record.id;
  }).sort();
  if (ids.length !== 23 || new Set(ids).size !== ids.length) throw new Error("S0 source seed denominator differs");
  return ids;
}

function buildProtocol(repositoryRoot: string): JsonObject {
  return {
    schema: "phase8b-lean-search-protocol-v1",
    operator: PHASE8_SEARCH_OPERATOR,
    state: "registered-search-unexecuted",
    cutoff: { inclusiveDate: PHASE8_SEARCH_CUTOFF, exclusiveInstantUtc: "2026-08-12T00:00:00Z", ambiguousOrMissingDate: "BOUNDED_OPEN" },
    scope: {
      inclusion: "primary measurements or raw data for laboratory or controlled natural-cloud observations of vapor-grown or sublimating individual atmospheric ice crystals",
      exclusion: "theory, simulation, review or parameterization without new measurements; aggregation, riming, melting, nucleation-only, sea ice, frost engineering, bulk remote sensing, conditionless images, metadata-only records, and identifiable secondary reproductions",
      phase9SuppliesNoInclusionFilter: true,
    },
    stopping: {
      frontier: "complete cumulative nonempty included-source set",
      consecutiveCompleteZeroAdditionRounds: 2,
      additionResetsCounter: true,
      unresolvedRouteLeadOrAcquisition: "BOUNDED_OPEN",
      resourceCapHit: "BOUNDED_OPEN",
      closedOutcome: "SATURATED_AT_CUTOFF",
    },
    localDenominatorBinding: { artifactIndex: S0_INDEX, sourceContainers: S0_CONTAINERS, sourceContainerCount: 23 },
    seeds: { sourceContainerIds: sourceSeedIds(repositoryRoot), citationIdentifiers: CITATION_SEEDS, normalizedAuthors: AUTHOR_SEEDS },
    officialDocumentLedger: DOCUMENTS as unknown as StrictJson,
    requiredSourceChecks: FOLLOWUP_CHECKS,
    policies: {
      rights: { states: ["permitted", "prohibited", "unknown-open"], default: "unknown-open", unknownPermitsRedistribution: false, sourceBytesFiguresAndDerivedNumbersAssessedSeparately: true },
      lineage: { dimensions: ["raw-data", "campaign-apparatus", "investigator-institution", "model-calibration"], unknownDimension: "unknown-open", unknownMayEstablishIndependence: false, versionsArchivesReanalysesCannotIncreaseWitnessCount: true },
      leakage: { heldOutRequiresAllLineageDimensionsKnown: true, anyDevelopmentOverlapBlocksHeldOut: true, unknownBlocksHeldOut: true },
      extraction: { allowedMethods: ["native-data", "table-transcription", "prose-transcription", "plot-digitization", "calibrated-image", "qualitative", "not-recoverable"], detailedCalibrationOwner: "S4", numericRowsRequireReportedAndExtractionUncertaintyFields: true },
    },
    minimalRecordSchemas: {
      searchResult: ["routeId", "queryId", "requestHash", "responseHash", "position", "identifier", "title", "date", "terminalDisposition"],
      lead: ["leadId", "sourceId", "kind", "routeId", "round", "terminalDisposition", "evidenceHash"],
      source: ["sourceId", "identity", "version", "corrections", "supplements", "data", "rights", "lineage", "acquisitionDisposition"],
      measurement: ["measurementId", "sourceId", "locator", "observable", "conditions", "units", "ensemble", "method", "reportedUncertainty", "extractionUncertainty", "lineage", "rights", "role", "split", "disposition"],
    },
    execution: { matrixRouteIds: MATRIX_ROUTE_IDS, queryCount: PHASE8_SEARCH_QUERIES.length, routeQueryCellCount: MATRIX_ROUTE_IDS.length * PHASE8_SEARCH_QUERIES.length, credentialsNeverRecorded: true, smokeIsCountedSearch: false, rawCountedResponsesRequiredInS2: true },
    limitations: ["S1 registers and smoke-tests routes but performs no counted search.", "Detailed extraction and digitization operators are intentionally deferred to S4.", "A route or follow-up operation that cannot prove terminal coverage produces BOUNDED_OPEN, never zero results."],
  };
}

function descriptor(path: string, kind: string, bytes: Uint8Array): JsonObject {
  return { path, kind, byteLength: bytes.byteLength, sha256: sha256Bytes(bytes) };
}

function bytesEqual(left: Uint8Array, right: Uint8Array): boolean {
  if (left.byteLength !== right.byteLength) return false;
  return left.every((value, index) => value === right[index]);
}

export function derivePhase8SearchBundle(repositoryRoot: string, smokeResults: readonly SmokeResult[]): SearchBundle {
  const compare = (left: string, right: string): number => left < right ? -1 : left > right ? 1 : 0;
  const routes = [...PHASE8_SEARCH_ROUTES].sort((left, right) => compare(left.id, right.id));
  const queries = [...PHASE8_SEARCH_QUERIES].sort((left, right) => compare(left.id, right.id));
  const cells = [...deriveRouteQueryCells()].sort((left, right) => compare(left.id, right.id));
  const smoke = [...smokeResults].sort((left, right) => compare(left.routeId, right.routeId));
  const artifacts = new Map<string, Uint8Array>();
  artifacts.set("protocol.json", canonicalJsonBytes(buildProtocol(repositoryRoot)));
  artifacts.set("queries.jsonl", jsonLines(queries));
  artifacts.set("route-query-cells.jsonl", jsonLines(cells));
  artifacts.set("routes.jsonl", jsonLines(routes));
  artifacts.set("smoke-results.jsonl", jsonLines(smoke));
  const payloads = PAYLOAD_NAMES.map((path) => descriptor(path, path.endsWith("jsonl") ? "canonical-jsonl" : "canonical-json", artifacts.get(path) as Uint8Array));
  const credentialBlockers = smoke.filter((record) => record.outcome === "blocked-credential").map((record) => record.routeId);
  const routeBlockers = smoke.filter((record) => record.outcome === "blocked-route").map((record) => record.routeId);
  const report = {
    schema: "phase8b-lean-search-report-v1",
    operator: PHASE8_SEARCH_OPERATOR,
    state: "protocol-candidate-search-unexecuted",
    artifacts: payloads,
    derivedCounts: { routeCount: routes.length, activeRouteCount: routes.filter((route) => route.disposition === "active").length, removedRouteCount: routes.filter((route) => route.disposition === "reviewed-removal").length, queryCount: queries.length, routeQueryCellCount: cells.length, smokeResultCount: smoke.length, registeredSearchRequestCount: 0 },
    smokeSummary: { succeeded: smoke.filter((record) => record.outcome === "succeeded").length, blockedCredential: credentialBlockers.length, blockedRoute: routeBlockers.length, removed: smoke.filter((record) => record.outcome === "removed").length },
    credentialBlockers,
    routeBlockers,
    readiness: routeBlockers.length === 0 ? (credentialBlockers.length === 0 ? "ready-for-counted-search-after-freeze" : "protocol-ready-credentials-open") : "protocol-recorded-route-blockers-open",
    grantsValidationClaim: false,
    permitsPhase9Execution: false,
    claim: "The bounded external-search recipe and its uncounted route smoke dispositions are registered; no counted search or measurement extraction has run.",
  };
  const reportBytes = canonicalJsonBytes(report);
  artifacts.set("report.json", reportBytes);
  const index = {
    schema: "phase8b-lean-search-index-v1",
    bundleCompleteness: "complete",
    report: descriptor("report.json", "canonical-json-report", reportBytes),
    artifacts: [descriptor("report.json", "canonical-json-report", reportBytes), ...payloads],
  };
  artifacts.set("artifact-index.json", canonicalJsonBytes(index));
  return { artifacts, routeCount: routes.length, queryCount: queries.length, routeQueryCellCount: cells.length, credentialBlockers, routeBlockers };
}

export function readSmokeResults(path: string): readonly SmokeResult[] {
  return parseJsonLines(new Uint8Array(readFileSync(path)), "smoke results") as unknown as readonly SmokeResult[];
}

export function readPhase8SearchBundle(directory: string): ReadonlyMap<string, Uint8Array> {
  const result = new Map<string, Uint8Array>();
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (!entry.isFile() || entry.isSymbolicLink()) throw new Error(`bundle entry is not a regular file: ${entry.name}`);
    result.set(entry.name, new Uint8Array(readFileSync(join(directory, entry.name))));
  }
  return result;
}

export function writePhase8SearchBundle(directory: string, bundle: SearchBundle): void {
  const names = [...bundle.artifacts.keys()].sort();
  const expected = [...PHASE8_SEARCH_ARTIFACTS].sort();
  if (canonicalJson(names) !== canonicalJson(expected)) throw new Error("refusing incomplete search-protocol bundle");
  if (existsSync(directory)) throw new Error(`refusing to overwrite existing bundle: ${directory}`);
  mkdirSync(dirname(directory), { recursive: true });
  const staging = join(dirname(directory), `.${basename(directory)}.staging-${randomUUID()}`);
  mkdirSync(staging);
  try {
    for (const name of names) writeFileSync(join(staging, name), bundle.artifacts.get(name) as Uint8Array, { flag: "wx" });
    const reopened = readPhase8SearchBundle(staging);
    for (const [name, bytes] of bundle.artifacts) if (!bytesEqual(bytes, reopened.get(name) as Uint8Array)) throw new Error(`staged artifact changed: ${name}`);
    if (existsSync(directory)) throw new Error(`bundle destination appeared: ${directory}`);
    renameSync(staging, directory);
  } catch (error) {
    rmSync(staging, { recursive: true, force: true });
    throw error;
  }
}

function smokeTemplate(route: SearchRoute): RequestTemplate {
  if (route.request === null) throw new Error(`removed route has no request: ${route.id}`);
  if (route.queryMode === "matrix") {
    const query = PHASE8_SEARCH_QUERIES.find((record) => record.language === "en");
    if (query === undefined) throw new Error("missing English smoke query");
    const request = plannedRequest(route, query);
    return {
      ...request,
      targetTemplate: request.targetTemplate
        .replace("max_results=2000", "max_results=1")
        .replace("count=200", "count=1")
        .replace("rows=1000", "rows=1")
        .replace("page%5Bsize%5D=1000", "page%5Bsize%5D=1")
        .replace("maximumRecords=500", "maximumRecords=1")
        .replace("per_page=100", "per_page=1"),
      bodyTemplate: request.bodyTemplate?.replace("\"size\":100", "\"size\":1") ?? null,
    };
  }
  if (route.id === "doi-publisher") return { ...route.request, targetTemplate: route.request.targetTemplate.replace("{DOI}", rfc3986("10.1175/JAS-D-19-0303.1")) };
  if (route.id === "penn-state-data-commons") return { ...route.request, targetTemplate: route.request.targetTemplate.replace("{DATASET_ID}", "6184") };
  throw new Error(`seed-only smoke target missing: ${route.id}`);
}

/** Stable redacted request identity used by tests; the verifier reconstructs it independently. */
export function phase8SearchSmokeRequestSha256(routeId: string): string {
  const route = PHASE8_SEARCH_ROUTES.find((candidate) => candidate.id === routeId);
  if (route === undefined || route.disposition !== "active") throw new Error(`active smoke route not found: ${routeId}`);
  return sha256Bytes(canonicalJsonBytes(smokeTemplate(route)));
}

function substituteCredential(value: string, route: SearchRoute, environment: Readonly<Record<string, string | undefined>>, encodeForUri: boolean): string {
  if (route.credentialEnv === null) return value;
  const credential = environment[route.credentialEnv];
  if (credential === undefined || credential.trim().length === 0) throw new Error(`credential missing: ${route.credentialEnv}`);
  if (/[^\x20-\x7e]/.test(credential) || /[\r\n]/.test(credential)) throw new Error(`credential invalid: ${route.credentialEnv}`);
  return value.replaceAll(`{{${route.credentialEnv}}}`, encodeForUri ? rfc3986(credential) : credential);
}

function redactCredential(value: string, route: SearchRoute, environment: Readonly<Record<string, string | undefined>>): string {
  if (route.credentialEnv === null) return value;
  const credential = environment[route.credentialEnv];
  if (credential === undefined) return value;
  return value.replaceAll(credential, "REDACTED").replaceAll(rfc3986(credential), "REDACTED");
}

function smokeRecord(route: SearchRoute, outcome: SmokeOutcome, input: Partial<Omit<SmokeResult, "schema" | "routeId" | "outcome" | "countedSearch">>): SmokeResult {
  return {
    schema: "phase8b-route-smoke-v1", routeId: route.id, outcome,
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

function parsedJsonObject(bytes: Uint8Array, routeId: string): Record<string, unknown> {
  let value: unknown;
  try { value = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)); }
  catch { throw new Error(`${routeId} smoke response is not JSON`); }
  if (value === null || typeof value !== "object" || Array.isArray(value)) throw new Error(`${routeId} smoke response is not an object`);
  return value as Record<string, unknown>;
}

/** A smoke proves the registered first response is parseable; it does not contribute search rows. */
function validateSmokeResponse(routeId: string, bytes: Uint8Array): void {
  if (bytes.byteLength === 0) throw new Error(`${routeId} smoke response is empty`);
  if (routeId === "arxiv" || routeId === "national-diet-library") {
    const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    const marker = routeId === "arxiv" ? "<feed" : "searchRetrieveResponse";
    if (!text.includes(marker)) throw new Error(`${routeId} smoke XML lacks ${marker}`);
    return;
  }
  if (routeId === "doi-publisher" || routeId === "penn-state-data-commons") return;
  const value = parsedJsonObject(bytes, routeId);
  if (routeId === "cinii" && !Array.isArray(value.items)) throw new Error("cinii smoke lacks JSON-LD items[]");
  if (routeId === "crossref") {
    const message = value.message;
    if (message === null || typeof message !== "object" || !Array.isArray((message as Record<string, unknown>).items)) throw new Error("crossref smoke lacks message.items[]");
  }
  if (routeId === "datacite" && (!Array.isArray(value.data) || value.links === null || typeof value.links !== "object")) throw new Error("datacite smoke lacks data[] or cursor links");
  if (routeId === "nasa-ntrs") {
    const stats = value.stats;
    const results = value.results;
    if (stats === null || typeof stats !== "object" || (stats as Record<string, unknown>).estimate !== false || !Array.isArray(results)) throw new Error("nasa-ntrs smoke requires results[] and stats.estimate=false");
    const ids = results.map((entry) => entry !== null && typeof entry === "object" ? String((entry as Record<string, unknown>).id) : "");
    if (ids.some((id, index) => index > 0 && id < (ids[index - 1] as string))) throw new Error("nasa-ntrs smoke results are not id-sorted");
  }
  if (routeId === "openalex") {
    if (!Array.isArray(value.results) || value.meta === null || typeof value.meta !== "object" || !("next_cursor" in (value.meta as Record<string, unknown>))) throw new Error("openalex smoke lacks results[] or meta.next_cursor");
  }
  if (routeId === "semantic-scholar") {
    if (!Array.isArray(value.data) || !("total" in value)) throw new Error("semantic-scholar smoke lacks data[] or approximate total");
    if ("token" in value && value.token !== null && typeof value.token !== "string") throw new Error("semantic-scholar smoke continuation token is malformed");
  }
}

export async function runPhase8SearchSmoke(options: {
  readonly environment?: Readonly<Record<string, string | undefined>>;
  readonly fetchImpl?: typeof fetch;
  readonly observedAtUtc?: string;
  readonly timeoutMs?: number;
} = {}): Promise<readonly SmokeResult[]> {
  const environment = options.environment ?? process.env;
  const fetchImpl = options.fetchImpl ?? fetch;
  const observedAtUtc = options.observedAtUtc ?? new Date().toISOString();
  const timeoutMs = options.timeoutMs ?? 20_000;
  const results: SmokeResult[] = [];
  for (const route of PHASE8_SEARCH_ROUTES) {
    if (route.disposition === "reviewed-removal") {
      results.push(smokeRecord(route, "removed", { blocker: route.removalReason }));
      continue;
    }
    if (route.credentialEnv !== null && !environment[route.credentialEnv]?.trim()) {
      results.push(smokeRecord(route, "blocked-credential", { blocker: `missing environment variable ${route.credentialEnv}` }));
      continue;
    }
    const template = smokeTemplate(route);
    const plannedRequestSha256 = phase8SearchSmokeRequestSha256(route.id);
    try {
      const target = substituteCredential(template.targetTemplate, route, environment, true);
      const headers = Object.fromEntries(template.headers.map((header) => [header.name, substituteCredential(header.valueTemplate, route, environment, false)]));
      const body = template.bodyTemplate === null ? undefined : substituteCredential(template.bodyTemplate, route, environment, false);
      const response = await fetchImpl(target, { method: template.method, headers, body, redirect: "follow", signal: AbortSignal.timeout(timeoutMs) });
      const responseBytes = new Uint8Array(await response.arrayBuffer());
      if (responseBytes.byteLength > 2 * 1024 * 1024) throw new Error("smoke response exceeded 2 MiB cap");
      if (!response.ok) {
        results.push(smokeRecord(route, "blocked-route", { observedAtUtc, plannedRequestSha256, httpStatus: response.status, effectiveUrl: redactCredential(response.url, route, environment), responseByteLength: responseBytes.byteLength, responseSha256: sha256Bytes(responseBytes), blocker: `HTTP ${response.status}` }));
      } else {
        validateSmokeResponse(route.id, responseBytes);
        results.push(smokeRecord(route, "succeeded", { observedAtUtc, plannedRequestSha256, httpStatus: response.status, effectiveUrl: redactCredential(response.url, route, environment), responseByteLength: responseBytes.byteLength, responseSha256: sha256Bytes(responseBytes) }));
      }
    } catch (error) {
      results.push(smokeRecord(route, "blocked-route", { observedAtUtc, plannedRequestSha256, blocker: error instanceof Error ? error.message : String(error) }));
    }
  }
  return results.sort((left, right) => left.routeId < right.routeId ? -1 : left.routeId > right.routeId ? 1 : 0);
}

function writeExclusive(path: string, bytes: Uint8Array): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, bytes, { flag: "wx" });
}

function parseCli(argv: readonly string[]): { command: "smoke" | "build" | "verify"; repositoryRoot: string; output?: string; smokeResults?: string; bundle?: string } {
  const command = argv[0];
  if (command !== "smoke" && command !== "build" && command !== "verify") throw new Error("usage: phase8-search-protocol.ts <smoke --output file | build --smoke-results file --bundle dir | verify --bundle dir> [--repository-root dir]");
  const values = new Map<string, string>();
  for (let index = 1; index < argv.length; index += 2) {
    const key = argv[index]; const value = argv[index + 1];
    if (key === undefined || value === undefined || !["--output", "--smoke-results", "--bundle", "--repository-root"].includes(key) || values.has(key)) throw new Error("invalid search-protocol arguments");
    values.set(key, value);
  }
  const repositoryRoot = values.get("--repository-root") ?? fileURLToPath(new URL("../..", import.meta.url));
  if (command === "smoke" && values.get("--output") === undefined) throw new Error("smoke requires --output");
  if (command === "build" && (values.get("--smoke-results") === undefined || values.get("--bundle") === undefined)) throw new Error("build requires --smoke-results and --bundle");
  if (command === "verify" && values.get("--bundle") === undefined) throw new Error("verify requires --bundle");
  return { command, repositoryRoot, output: values.get("--output"), smokeResults: values.get("--smoke-results"), bundle: values.get("--bundle") };
}

const invoked = process.argv[1];
if (invoked !== undefined && import.meta.url === pathToFileURL(resolve(invoked)).href) {
  try {
    const args = parseCli(process.argv.slice(2));
    if (args.command === "smoke") {
      const results = await runPhase8SearchSmoke();
      writeExclusive(args.output as string, jsonLines(results));
      process.stdout.write(`PHASE8B SEARCH SMOKE RECORDED routes=${results.length} succeeded=${results.filter((record) => record.outcome === "succeeded").length} blocked=${results.filter((record) => record.outcome.startsWith("blocked-")).length} removed=${results.filter((record) => record.outcome === "removed").length} countedSearch=0\n`);
    } else if (args.command === "build") {
      const bundle = derivePhase8SearchBundle(args.repositoryRoot, readSmokeResults(args.smokeResults as string));
      writePhase8SearchBundle(args.bundle as string, bundle);
      process.stdout.write(`PHASE8B SEARCH PROTOCOL CANDIDATE BUILT routes=${bundle.routeCount} queries=${bundle.queryCount} cells=${bundle.routeQueryCellCount} credentialBlockers=${bundle.credentialBlockers.length} routeBlockers=${bundle.routeBlockers.length}\n`);
    } else {
      const { verifyPhase8SearchBundle } = await import("./phase8-search-protocol-verify.ts");
      const result = verifyPhase8SearchBundle(args.bundle as string, args.repositoryRoot);
      process.stdout.write(`PHASE8B SEARCH PROTOCOL OK routes=${result.routeCount} queries=${result.queryCount} cells=${result.routeQueryCellCount} credentialBlockers=${result.credentialBlockers.length} routeBlockers=${result.routeBlockers.length}\n`);
    }
  } catch (error) {
    process.stderr.write(`PHASE8B SEARCH PROTOCOL FAIL ${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}
