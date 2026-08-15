// Independent verifier for the compact Phase 8B S1a search-protocol successor.
//
// The accepted S1 bundle is historical authority. This verifier first reopens and verifies that
// predecessor, then treats S1a as a narrow delta rather than accepting a second unconstrained
// search registry.

import { lstatSync, readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import {
  canonicalJson,
  canonicalJsonBytes,
  parseCanonicalJson,
  sha256Bytes,
  type StrictJson,
} from "./gate4-evidence.ts";
import { verifyPhase8SearchBundle } from "./phase8-search-protocol-verify.ts";

const ARTIFACT_NAMES = [
  "artifact-index.json", "protocol.json", "queries.jsonl", "report.json",
  "route-query-cells.jsonl", "routes.jsonl", "smoke-results.jsonl",
] as const;
const PAYLOAD_NAMES = [
  "protocol.json", "queries.jsonl", "route-query-cells.jsonl", "routes.jsonl",
  "smoke-results.jsonl",
] as const;
const PREDECESSOR_DIRECTORY = "evidence/phase8b-search-protocol";
const PREDECESSOR_INDEX = {
  byteLength: 1_131,
  sha256: "8bc12ee92afdcfdf41148cde4ef89029f572007ba3bee338d1a62a38153dace7",
} as const;
const OPERATOR = "phase8b-lean-search-protocol-v2";
const ALL_ROUTES = [
  "arxiv", "cinii", "crossref", "datacite", "doi-publisher", "jstage", "nasa-ntrs",
  "national-diet-library", "openalex", "penn-state-data-commons", "semantic-scholar",
  "supplemental-web", "zenodo",
] as const;
const MATRIX_ROUTES = [
  "arxiv", "cinii", "crossref", "datacite", "nasa-ntrs", "national-diet-library",
  "openalex", "semantic-scholar",
] as const;
const CHANGED_ROUTES = new Set(["cinii", "crossref", "datacite", "nasa-ntrs"]);
const CINII_DOCUMENTS = [
  { id: "doc-cinii-kg", url: "https://labs.ci.nii.ac.jp/en/detail-knowledgegraph.html", byteLength: 5_184, sha256: "132271676f819be31e5c7b14cfbf47ee892b94b2594d4bfb554d7ff3b591120b" },
  { id: "doc-cinii-labs-terms", url: "https://labs.ci.nii.ac.jp/en/termsofuse.html", byteLength: 10_505, sha256: "a3f6b5237ed6b4e34a57a25bc5345ef6216976c81829dc41fe760c68e71ec606" },
  { id: "doc-cinii-rdf", url: "https://support.nii.ac.jp/en/cir/r_rdf", byteLength: 107_095, sha256: "12ade6a61ff627fb7325264d929965a1ab2cee40faed4ce8aa6fb889ca4ad1fa" },
  { id: "doc-cinii-rights", url: "https://support.nii.ac.jp/en/cinii/copyright", byteLength: 27_906, sha256: "fb03cf2aaf523efd72435f2dff2d2ea631667ff54978aa8d5b37ba47e1e27223" },
] as const;
const SHA256 = /^[0-9a-f]{64}$/;

type JsonObject = { [key: string]: StrictJson };

export interface VerifiedSearchProtocolSuccessor {
  readonly routeCount: number;
  readonly queryCount: number;
  readonly routeQueryCellCount: number;
  readonly credentialBlockers: readonly string[];
  readonly routeBlockers: readonly string[];
  readonly readiness:
    | "ready-for-counted-search-after-freeze"
    | "protocol-ready-credentials-open"
    | "protocol-recorded-route-blockers-open";
}

function lexicalCompare(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function object(value: StrictJson | undefined, label: string): JsonObject {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
  return value as JsonObject;
}

function array(value: StrictJson | undefined, label: string): readonly StrictJson[] {
  if (!Array.isArray(value)) throw new Error(`${label} must be an array`);
  return value;
}

function string(value: StrictJson | undefined, label: string): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`${label} must be a nonempty string`);
  }
  return value;
}

function nullableString(value: StrictJson | undefined, label: string): string | null {
  return value === null ? null : string(value, label);
}

function stringArray(value: StrictJson | undefined, label: string): readonly string[] {
  return array(value, label).map((entry, index) => string(entry, `${label}[${index}]`));
}

function assertExactStrings(actual: readonly string[], expected: readonly string[], label: string): void {
  if (canonicalJson(actual) !== canonicalJson(expected)) throw new Error(`${label} differs`);
}

function bytesEqual(left: Uint8Array, right: Uint8Array): boolean {
  return left.byteLength === right.byteLength && left.every((value, index) => value === right[index]);
}

function integer(value: StrictJson | undefined, label: string): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) {
    throw new Error(`${label} must be a nonnegative integer`);
  }
  return value;
}

function exactKeys(value: JsonObject, expected: readonly string[], label: string): void {
  const actual = Object.keys(value).sort(lexicalCompare);
  const wanted = [...expected].sort(lexicalCompare);
  if (canonicalJson(actual) !== canonicalJson(wanted)) throw new Error(`${label} keys differ`);
}

function readRegular(path: string, label: string): Uint8Array {
  const stats = lstatSync(path);
  if (!stats.isFile() || stats.isSymbolicLink()) throw new Error(`${label} is not a regular file`);
  return new Uint8Array(readFileSync(path));
}

function parseJsonLines(bytes: Uint8Array, label: string): readonly JsonObject[] {
  let value: string;
  try {
    value = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw new Error(`${label} is not UTF-8`);
  }
  if (!value.endsWith("\n")) throw new Error(`${label} lacks final newline`);
  const body = value.slice(0, -1);
  if (body.length === 0) return [];
  return body.split("\n").map((line, index) =>
    object(
      parseCanonicalJson(new TextEncoder().encode(`${line}\n`), `${label}:${index + 1}`),
      `${label}:${index + 1}`,
    )
  );
}

function descriptor(path: string, kind: string, bytes: Uint8Array): JsonObject {
  return { path, kind, byteLength: bytes.byteLength, sha256: sha256Bytes(bytes) };
}

function descriptorFrom(value: StrictJson | undefined, label: string): JsonObject {
  const result = object(value, label);
  exactKeys(result, ["path", "kind", "byteLength", "sha256"], label);
  string(result.path, `${label}.path`);
  string(result.kind, `${label}.kind`);
  integer(result.byteLength, `${label}.byteLength`);
  if (!SHA256.test(string(result.sha256, `${label}.sha256`))) {
    throw new Error(`${label}.sha256 differs`);
  }
  return result;
}

function rejectCallerVerdicts(value: StrictJson, path = "$", seen = new WeakSet<object>()): void {
  if (value === null || typeof value !== "object") return;
  if (seen.has(value)) throw new Error(`${path} contains a cycle`);
  seen.add(value);
  if (Array.isArray(value)) {
    value.forEach((entry, index) => rejectCallerVerdicts(entry, `${path}[${index}]`, seen));
  } else {
    for (const [key, entry] of Object.entries(value)) {
      if (["accepted", "pass", "passEligible", "verdict"].includes(key)) {
        throw new Error(`caller-supplied verdict field is forbidden: ${path}.${key}`);
      }
      rejectCallerVerdicts(entry, `${path}.${key}`, seen);
    }
  }
  seen.delete(value);
}

function readArtifactDirectory(directory: string): ReadonlyMap<string, Uint8Array> {
  const artifacts = new Map<string, Uint8Array>();
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (!entry.isFile() || entry.isSymbolicLink()) {
      throw new Error(`bundle entry is not a regular file: ${entry.name}`);
    }
    artifacts.set(entry.name, readRegular(join(directory, entry.name), entry.name));
  }
  return artifacts;
}

function verifyPredecessor(repositoryRoot: string): ReadonlyMap<string, Uint8Array> {
  const directory = resolve(repositoryRoot, PREDECESSOR_DIRECTORY);
  const index = readRegular(join(directory, "artifact-index.json"), "predecessor artifact index");
  if (
    index.byteLength !== PREDECESSOR_INDEX.byteLength ||
    sha256Bytes(index) !== PREDECESSOR_INDEX.sha256
  ) {
    throw new Error("accepted S1 predecessor index drift");
  }
  const verified = verifyPhase8SearchBundle(directory, repositoryRoot);
  if (
    verified.routeCount !== 13 || verified.queryCount !== 32 ||
    verified.routeQueryCellCount !== 256
  ) {
    throw new Error("accepted S1 predecessor dimensions differ");
  }
  return readArtifactDirectory(directory);
}

function recordsById(records: readonly JsonObject[], label: string): ReadonlyMap<string, JsonObject> {
  const map = new Map<string, JsonObject>();
  for (const record of records) {
    const id = string(record.id, `${label}.id`);
    if (map.has(id)) throw new Error(`${label} IDs contain duplicates`);
    map.set(id, record);
  }
  return map;
}

function expectedChangedRoute(predecessor: JsonObject): JsonObject {
  const id = string(predecessor.id, "predecessor route.id");
  if (id === "cinii") {
    return {
      ...predecessor,
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
  const request = structuredClone(object(predecessor.request, `${id}.predecessor request`)) as JsonObject;
  const failOpenConditions = stringArray(predecessor.failOpenConditions, `${id}.predecessor failOpenConditions`)
    .filter((value) => value !== "credential-missing");
  if (id === "crossref") {
    request.targetTemplate = string(request.targetTemplate, "Crossref predecessor target")
      .replace(/&mailto=\{\{PHASE8_CONTACT_EMAIL\}\}$/, "");
    request.headers = [
      { name: "accept", valueTemplate: "application/json" },
      { name: "user-agent", valueTemplate: "VirtualCloudChamber-Phase8B/2.0" },
    ];
    return {
      ...predecessor,
      schema: "phase8b-search-route-v2",
      credentialEnv: null,
      request,
      pacing: { minIntervalMs: 1_100, maxConcurrency: 1 },
      failOpenConditions,
      access: { mode: "anonymous-public-pool", contactIdentityInvented: false },
    };
  }
  if (id === "datacite" || id === "nasa-ntrs") {
    request.headers = array(request.headers, `${id}.headers`).map((entry, index) => {
      const header = object(entry, `${id}.header ${index}`);
      return header.name === "user-agent"
        ? { name: "user-agent", valueTemplate: "VirtualCloudChamber-Phase8B/2.0" }
        : header;
    });
    return {
      ...predecessor,
      schema: "phase8b-search-route-v2",
      credentialEnv: null,
      request,
      failOpenConditions,
      access: { mode: "anonymous-public", contactIdentityInvented: false },
    };
  }
  throw new Error(`unexpected authorized changed route: ${id}`);
}

function verifyProtocol(
  protocol: JsonObject,
  predecessor: JsonObject,
): void {
  const predecessorKeys = Object.keys(predecessor);
  exactKeys(protocol, [...predecessorKeys, "supersedes", "routeReadinessAmendment", "runtimeSecrets", "responseRetention"], "protocol");
  if (
    protocol.schema !== OPERATOR || protocol.operator !== OPERATOR ||
    protocol.state !== "registered-search-unexecuted"
  ) {
    throw new Error("successor protocol identity differs");
  }
  const binding = object(protocol.supersedes, "protocol.supersedes");
  exactKeys(binding, ["path", "byteLength", "sha256"], "protocol.supersedes");
  if (
    binding.path !== `${PREDECESSOR_DIRECTORY}/artifact-index.json` ||
    binding.byteLength !== PREDECESSOR_INDEX.byteLength ||
    binding.sha256 !== PREDECESSOR_INDEX.sha256
  ) {
    throw new Error("successor predecessor binding differs");
  }

  const unchanged = [
    "cutoff", "scope", "stopping", "localDenominatorBinding", "seeds", "requiredSourceChecks",
    "policies", "minimalRecordSchemas",
  ] as const;
  for (const key of unchanged) {
    if (canonicalJson(protocol[key]) !== canonicalJson(predecessor[key])) {
      throw new Error(`successor protocol unauthorized change: ${key}`);
    }
  }

  const execution = object(protocol.execution, "protocol.execution");
  const oldExecution = object(predecessor.execution, "predecessor.execution");
  if (canonicalJson(execution) !== canonicalJson({ ...oldExecution, allowedCredentialPlaceholders: ["OPENALEX_API_KEY"] })) {
    throw new Error("successor execution dimensions differ");
  }

  const amendment = object(protocol.routeReadinessAmendment, "protocol.routeReadinessAmendment");
  exactKeys(amendment, ["authorizedRouteIds", "ciniiDocumentIds", "ciniiSnapshotAsOf", "ciniiCoversProjectCutoff", "rejectedCiNiiQueryForm", "contactEmailIsCredential"], "protocol.routeReadinessAmendment");
  if (
    canonicalJson(amendment.authorizedRouteIds) !== canonicalJson(["cinii", "crossref", "datacite", "nasa-ntrs"]) ||
    canonicalJson(amendment.ciniiDocumentIds) !== canonicalJson(CINII_DOCUMENTS.map((document) => document.id)) ||
    amendment.ciniiSnapshotAsOf !== "2024-04-04" || amendment.ciniiCoversProjectCutoff !== false ||
    amendment.contactEmailIsCredential !== false ||
    amendment.rejectedCiNiiQueryForm !== "per-token UNION groups exceeded Virtuoso generated-SQL limit in an uncounted six-token probe"
  ) {
    throw new Error("successor route-readiness amendment differs");
  }

  const oldLedger = array(predecessor.officialDocumentLedger, "predecessor official document ledger")
    .map((entry, index) => object(entry, `predecessor official document ${index}`));
  const expectedLedger = oldLedger.flatMap((document) => document.routeId === "cinii"
    ? CINII_DOCUMENTS.map((replacement) => ({ ...replacement, routeId: "cinii" }))
    : [document]);
  if (canonicalJson(protocol.officialDocumentLedger) !== canonicalJson(expectedLedger)) {
    throw new Error("successor official document ledger differs");
  }

  const runtimeSecrets = object(protocol.runtimeSecrets, "protocol.runtimeSecrets");
  if (canonicalJson(runtimeSecrets) !== canonicalJson({
    allowedCredentialPlaceholders: ["OPENALEX_API_KEY"],
    OPENALEX_API_KEY: { retained: false, source: "runtime-only NAS file or environment" },
  })) throw new Error("successor runtime-secret policy differs");
  const retention = object(protocol.responseRetention, "protocol.responseRetention");
  if (canonicalJson(retention) !== canonicalJson({
    default: "private-NAS-plus-hash",
    gitPublication: "only when provider/source license permits",
    ciniiUriOnlyResponses: "private-NAS-plus-hash",
  })) throw new Error("successor response-retention policy differs");

  const limitations = stringArray(protocol.limitations, "protocol.limitations");
  const oldLimitations = stringArray(predecessor.limitations, "predecessor limitations");
  if (canonicalJson(limitations.slice(0, oldLimitations.length)) !== canonicalJson(oldLimitations)) {
    throw new Error("successor predecessor limitations changed");
  }
  assertExactStrings(limitations.slice(oldLimitations.length), [
    "CiNii is an experimental 2024-04-04 snapshot and supplies no coverage claim after that date.",
    "CiNii full-text tokens must coexist within one indexed metadata literal; other registered routes carry current and cross-field discovery.",
  ], "successor added limitations");
}

function verifyRoutes(
  routes: readonly JsonObject[],
  predecessors: readonly JsonObject[],
): ReadonlyMap<string, JsonObject> {
  assertExactStrings(routes.map((route) => string(route.id, "route.id")), ALL_ROUTES, "route order");
  const old = recordsById(predecessors, "predecessor route");
  const result = new Map<string, JsonObject>();
  for (const route of routes) {
    const id = string(route.id, "route.id");
    const predecessor = old.get(id);
    if (predecessor === undefined) throw new Error(`unknown successor route: ${id}`);
    if (!CHANGED_ROUTES.has(id)) {
      if (canonicalJson(route) !== canonicalJson(predecessor)) {
        throw new Error(`unauthorized successor route change: ${id}`);
      }
    } else {
      if (canonicalJson(route) !== canonicalJson(expectedChangedRoute(predecessor))) {
        throw new Error(`authorized successor route delta differs: ${id}`);
      }
    }
    result.set(id, route);
  }

  const cinii = result.get("cinii") as JsonObject;
  exactKeys(cinii, [...Object.keys(old.get("cinii") as JsonObject), "coverage", "responseRights"], "route cinii");
  if (
    cinii.disposition !== "active" || cinii.queryMode !== "matrix" ||
    cinii.credentialEnv !== null || cinii.officialDocumentId !== "doc-cinii-kg" ||
    !string(cinii.role, "cinii.role").toLowerCase().includes("historical")
  ) {
    throw new Error("CiNii successor route identity differs");
  }
  const ciniiRequest = object(cinii.request, "cinii.request");
  if (
    ciniiRequest.method !== "POST" ||
    ciniiRequest.targetTemplate !== "https://cinii.kgraph.jp/sparql" ||
    /{{[^}]+}}/.test(canonicalJson(ciniiRequest))
  ) {
    throw new Error("CiNii SPARQL request differs");
  }
  const body = string(ciniiRequest.bodyTemplate, "cinii.request.bodyTemplate");
  for (const marker of ["{SPARQL_FORM}", "application%2Fsparql-results%2Bjson", "timeout=30000"] as const) {
    if (!body.includes(marker)) throw new Error(`CiNii SPARQL marker missing: ${marker}`);
  }
  if (canonicalJson(ciniiRequest.headers) !== canonicalJson([
    { name: "accept", valueTemplate: "application/sparql-results+json" },
    { name: "content-type", valueTemplate: "application/x-www-form-urlencoded; charset=UTF-8" },
  ])) throw new Error("CiNii request headers differ");
  const ciniiPagination = object(cinii.pagination, "cinii.pagination");
  if (
    ciniiPagination.mode !== "strict-crid-keyset-with-lookahead" || ciniiPagination.pageSize !== 100 ||
    ciniiPagination.cap !== 10_000 ||
    ciniiPagination.continuationRequestMutation !== "insert FILTER(STR(?article) > \"{LAST_RETAINED_URI}\") after the .rdf filter; LAST_RETAINED_URI is row 100; LIMIT remains 101"
  ) {
    throw new Error("CiNii keyset pagination differs");
  }
  const coverage = object(cinii.coverage, "cinii.coverage");
  if (canonicalJson(coverage) !== canonicalJson({
    snapshotAsOf: "2024-04-04",
    coversProjectCutoff: false,
    experimental: true,
    claim: "historical snapshot only; no CiNii coverage claim after 2024-04-04",
    fullTextFieldSemantics: "all query tokens must coexist in one indexed title, alternate-title, description, or keyword literal",
  })) throw new Error("CiNii snapshot/recall contract differs");
  const rights = object(cinii.responseRights, "cinii.responseRights");
  if (canonicalJson(rights) !== canonicalJson({
    rawUriOnlyResponseRetention: "private-NAS-plus-hash",
    publicRedistribution: "unknown-open-pending-source-specific-license",
    richerMetadataPublication: "prohibited-until-source-specific-license-clears",
  })) throw new Error("CiNii response-rights contract differs");
  const ciniiText = canonicalJson(cinii).toLowerCase();
  for (const marker of ["partial-206", "cap-hit", "snapshot", "2024-04-04", "redistribut"] as const) {
    if (!ciniiText.includes(marker)) throw new Error(`CiNii fail-open/rights marker missing: ${marker}`);
  }

  for (const id of ["crossref", "datacite", "nasa-ntrs"] as const) {
    const route = result.get(id) as JsonObject;
    exactKeys(route, [...Object.keys(old.get(id) as JsonObject), "access"], `route ${id}`);
    if (route.credentialEnv !== null) throw new Error(`${id} retains false credential gate`);
    const serialized = canonicalJson(route);
    if (/PHASE8_CONTACT_EMAIL|mailto:|contact:/i.test(serialized)) {
      throw new Error(`${id} retains contact placeholder`);
    }
    const access = object(route.access, `${id}.access`);
    if (access.contactIdentityInvented !== false) throw new Error(`${id} invents contact identity`);
    const failOpen = stringArray(route.failOpenConditions, `${id}.failOpenConditions`);
    if (failOpen.includes("credential-missing")) throw new Error(`${id} retains credential fail-open`);
  }
  const openalex = result.get("openalex") as JsonObject;
  if (
    openalex.credentialEnv !== "OPENALEX_API_KEY" ||
    !canonicalJson(openalex).includes("{{OPENALEX_API_KEY}}")
  ) {
    throw new Error("OpenAlex runtime credential contract differs");
  }
  const credentialRoutes = routes.filter((route) => route.credentialEnv !== null);
  if (
    credentialRoutes.length !== 1 ||
    credentialRoutes[0]?.id !== "openalex" ||
    credentialRoutes[0]?.credentialEnv !== "OPENALEX_API_KEY"
  ) {
    throw new Error("successor credential placeholders differ");
  }
  return result;
}

function rfc3986(value: string): string {
  return encodeURIComponent(value).replace(/[!'()*]/g, (character) =>
    `%${character.charCodeAt(0).toString(16).toUpperCase()}`);
}

function ciniiSparql(canonicalQuery: string, limit: number): string {
  const tokens = canonicalQuery.split(" ");
  if (
    canonicalQuery !== canonicalQuery.normalize("NFC") || tokens.length === 0 ||
    tokens.some((token) => token.length === 0 || /[\u0000-\u001f\u007f'"\\]/u.test(token))
  ) throw new Error("CiNii query cannot be encoded safely");
  const expression = tokens.map((token) => `'${token}'`).join(" AND ");
  return [
    "PREFIX cir: <https://cir.nii.ac.jp/schema/1.0/>",
    "PREFIX dc: <http://purl.org/dc/elements/1.1/>",
    "PREFIX dcterms: <http://purl.org/dc/terms/>",
    "PREFIX foaf: <http://xmlns.com/foaf/0.1/>",
    "SELECT DISTINCT ?article WHERE {",
    "  ?article a cir:Article .",
    "  FILTER(STRSTARTS(STR(?article), \"https://cir.nii.ac.jp/crid/\"))",
    "  FILTER(STRENDS(STR(?article), \".rdf\"))",
    `  { ?article dc:title ?text . ?text bif:contains \"${expression}\" }`,
    `  UNION { ?article dcterms:alternative ?text . ?text bif:contains \"${expression}\" }`,
    `  UNION { ?article cir:description ?description . ?description cir:notation ?text . ?text bif:contains \"${expression}\" }`,
    `  UNION { ?article foaf:topic ?topic . ?topic dc:title ?text . ?text bif:contains \"${expression}\" }`,
    "}",
    "ORDER BY STR(?article)",
    `LIMIT ${limit}`,
  ].join("\n");
}

function ciniiForm(canonicalQuery: string, limit: number): string {
  return new URLSearchParams({
    query: ciniiSparql(canonicalQuery, limit),
    format: "application/sparql-results+json",
    timeout: "30000",
  }).toString();
}

function reconstructMatrixRequest(route: JsonObject, query: JsonObject, ciniiLimit = 101): JsonObject {
  const request = structuredClone(object(route.request, `${String(route.id)}.request`)) as JsonObject;
  const queryText = string(query.canonicalQuery, `${String(query.id)}.canonicalQuery`);
  if (route.id === "cinii") {
    request.bodyTemplate = ciniiForm(queryText, ciniiLimit);
    return request;
  }
  request.targetTemplate = string(request.targetTemplate, "request.targetTemplate")
    .replaceAll("{QUERY}", rfc3986(queryText));
  if (request.bodyTemplate !== null) {
    request.bodyTemplate = string(request.bodyTemplate, "request.bodyTemplate")
      .replaceAll("{QUERY_JSON}", JSON.stringify(queryText));
  }
  return request;
}

function reconstructSmokeRequest(route: JsonObject, firstEnglish: JsonObject): JsonObject {
  if (route.queryMode === "matrix") {
    const request = reconstructMatrixRequest(route, firstEnglish, route.id === "cinii" ? 1 : 101);
    if (route.id !== "cinii") {
      request.targetTemplate = string(request.targetTemplate, "smoke target")
        .replace("max_results=2000", "max_results=1")
        .replace("rows=1000", "rows=1")
        .replace("page%5Bsize%5D=1000", "page%5Bsize%5D=1")
        .replace("maximumRecords=500", "maximumRecords=1")
        .replace("per_page=100", "per_page=1");
      if (request.bodyTemplate !== null) {
        request.bodyTemplate = string(request.bodyTemplate, "smoke body")
          .replace("\"size\":100", "\"size\":1");
      }
    }
    return request;
  }
  const request = structuredClone(object(route.request, `${String(route.id)}.request`)) as JsonObject;
  if (route.id === "doi-publisher") {
    request.targetTemplate = string(request.targetTemplate, "DOI target")
      .replace("{DOI}", "10.1175%2FJAS-D-19-0303.1");
  } else if (route.id === "penn-state-data-commons") {
    request.targetTemplate = string(request.targetTemplate, "Penn target")
      .replace("{DATASET_ID}", "6184");
  } else throw new Error(`seed-only smoke route differs: ${String(route.id)}`);
  return request;
}

function verifyCells(
  cells: readonly JsonObject[],
  predecessors: readonly JsonObject[],
  routes: ReadonlyMap<string, JsonObject>,
  queries: ReadonlyMap<string, JsonObject>,
): void {
  if (cells.length !== 256) throw new Error("successor route/query cell count differs");
  assertExactStrings(
    cells.map((cell) => string(cell.id, "cell.id")),
    predecessors.map((cell) => string(cell.id, "predecessor cell.id")),
    "successor route/query cell order",
  );
  const old = recordsById(predecessors, "predecessor cell");
  const pairs = new Set<string>();
  for (const cell of cells) {
    exactKeys(
      cell,
      ["schema", "id", "routeId", "queryId", "cutoff", "plannedRequest", "plannedRequestSha256", "executionState"],
      `cell ${String(cell.id)}`,
    );
    const id = string(cell.id, "cell.id");
    const routeId = string(cell.routeId, `${id}.routeId`);
    const queryId = string(cell.queryId, `${id}.queryId`);
    if (
      cell.schema !== "phase8b-route-query-cell-v1" || cell.cutoff !== "2026-08-11" ||
      cell.executionState !== "unexecuted" || !MATRIX_ROUTES.includes(routeId as typeof MATRIX_ROUTES[number])
    ) {
      throw new Error(`successor cell identity differs: ${id}`);
    }
    const pair = `${routeId}\0${queryId}`;
    if (pairs.has(pair)) throw new Error(`successor duplicate route/query cell: ${routeId}/${queryId}`);
    pairs.add(pair);
    const request = object(cell.plannedRequest, `${id}.plannedRequest`);
    if (cell.plannedRequestSha256 !== sha256Bytes(canonicalJsonBytes(request))) {
      throw new Error(`successor planned request hash differs: ${id}`);
    }
    const predecessor = old.get(id);
    if (predecessor === undefined) throw new Error(`successor cell has no predecessor: ${id}`);
    if (!CHANGED_ROUTES.has(routeId)) {
      if (canonicalJson(cell) !== canonicalJson(predecessor)) {
        throw new Error(`unauthorized successor cell change: ${id}`);
      }
    } else {
      const query = queries.get(queryId);
      if (query === undefined) throw new Error(`successor cell query missing: ${id}`);
      const expectedRequest = reconstructMatrixRequest(routes.get(routeId) as JsonObject, query);
      const expected = {
        ...predecessor,
        plannedRequest: expectedRequest,
        plannedRequestSha256: sha256Bytes(canonicalJsonBytes(expectedRequest)),
      };
      if (canonicalJson(cell) !== canonicalJson(expected)) {
        throw new Error(`successor planned request differs from route recipe: ${id}`);
      }
    }
    const serialized = canonicalJson(request);
    if (routeId !== "openalex" && /\{\{[^}]+\}\}/.test(serialized)) {
      throw new Error(`unexpected credential placeholder in cell: ${id}`);
    }
    if (routeId === "openalex" && !serialized.includes("{{OPENALEX_API_KEY}}")) {
      throw new Error(`OpenAlex credential placeholder missing from cell: ${id}`);
    }
    if (/PHASE8_CONTACT_EMAIL|mailto:|contact:/i.test(serialized)) {
      throw new Error(`contact placeholder retained in cell: ${id}`);
    }
    if (routeId === "cinii") {
      const body = string(request.bodyTemplate, `${id}.bodyTemplate`);
      if (body.includes("{SPARQL_FORM}")) throw new Error(`CiNii cell retains form placeholder: ${id}`);
      const decoded = new URLSearchParams(body);
      if (
        decoded.get("format") !== "application/sparql-results+json" ||
        decoded.get("timeout") !== "30000" || decoded.get("query") !== ciniiSparql(
          string((queries.get(queryId) as JsonObject).canonicalQuery, `${queryId}.canonicalQuery`),
          101,
        )
      ) throw new Error(`CiNii cell SPARQL differs: ${id}`);
    }
  }
  if (pairs.size !== 256) throw new Error("successor route/query matrix is incomplete");
}

function verifySmoke(
  smoke: readonly JsonObject[],
  routes: ReadonlyMap<string, JsonObject>,
  queries: ReadonlyMap<string, JsonObject>,
): { credentialBlockers: string[]; routeBlockers: string[]; summary: JsonObject } {
  if (smoke.length !== 13) throw new Error("successor smoke result count differs");
  assertExactStrings(smoke.map((record) => string(record.routeId, "smoke.routeId")), ALL_ROUTES, "smoke order");
  let succeeded = 0;
  let removed = 0;
  const credentialBlockers: string[] = [];
  const routeBlockers: string[] = [];
  const firstEnglish = [...queries.values()].find((query) => query.language === "en");
  if (firstEnglish === undefined) throw new Error("successor smoke query is missing");
  for (const record of smoke) {
    exactKeys(
      record,
      ["schema", "routeId", "outcome", "observedAtUtc", "plannedRequestSha256", "httpStatus", "effectiveUrl", "responseByteLength", "responseSha256", "blocker", "countedSearch"],
      `smoke ${String(record.routeId)}`,
    );
    const routeId = string(record.routeId, "smoke.routeId");
    const route = routes.get(routeId) as JsonObject;
    const outcome = string(record.outcome, `${routeId}.outcome`);
    if (record.schema !== "phase8b-route-smoke-v2" || record.countedSearch !== false) {
      throw new Error(`successor smoke identity/counting differs: ${routeId}`);
    }
    if (route.disposition === "reviewed-removal") {
      if (
        outcome !== "removed" || record.observedAtUtc !== null ||
        record.plannedRequestSha256 !== null || record.httpStatus !== null ||
        record.effectiveUrl !== null || record.responseByteLength !== null ||
        record.responseSha256 !== null || record.blocker !== route.removalReason
      ) {
        throw new Error(`successor removed route smoke mismatch: ${routeId}`);
      }
      removed++;
      continue;
    }
    if (outcome === "blocked-credential") {
      if (
        routeId !== "openalex" || route.credentialEnv !== "OPENALEX_API_KEY" ||
        record.blocker !== "missing runtime OPENALEX_API_KEY" ||
        record.observedAtUtc !== null || record.plannedRequestSha256 !== null ||
        record.httpStatus !== null || record.effectiveUrl !== null ||
        record.responseByteLength !== null || record.responseSha256 !== null
      ) {
        throw new Error(`successor credential blocker mismatch: ${routeId}`);
      }
      credentialBlockers.push(routeId);
      continue;
    }
    if (outcome !== "succeeded" && outcome !== "blocked-route") {
      throw new Error(`successor active route smoke outcome differs: ${routeId}`);
    }
    const observed = string(record.observedAtUtc, `${routeId}.observedAtUtc`);
    if (!Number.isFinite(Date.parse(observed)) || !SHA256.test(string(record.plannedRequestSha256, `${routeId}.plannedRequestSha256`))) {
      throw new Error(`successor smoke provenance differs: ${routeId}`);
    }
    const expectedSmokeHash = sha256Bytes(canonicalJsonBytes(reconstructSmokeRequest(route, firstEnglish)));
    if (record.plannedRequestSha256 !== expectedSmokeHash) {
      throw new Error(`successor smoke planned request differs: ${routeId}`);
    }
    if (outcome === "succeeded") {
      const status = integer(record.httpStatus, `${routeId}.httpStatus`);
      const responseByteLength = integer(record.responseByteLength, `${routeId}.responseByteLength`);
      if (
        status < 200 || status >= 300 || status === 206 ||
        !string(record.effectiveUrl, `${routeId}.effectiveUrl`).startsWith("https://") ||
        !SHA256.test(string(record.responseSha256, `${routeId}.responseSha256`)) ||
        responseByteLength === 0 || responseByteLength > 2 * 1024 * 1024 ||
        record.blocker !== null
      ) {
        throw new Error(`successor successful smoke is incoherent: ${routeId}`);
      }
      succeeded++;
    } else {
      string(record.blocker, `${routeId}.blocker`);
      if (record.httpStatus !== null) integer(record.httpStatus, `${routeId}.httpStatus`);
      if (record.effectiveUrl !== null && !string(record.effectiveUrl, `${routeId}.effectiveUrl`).startsWith("https://")) {
        throw new Error(`successor blocked-route URL differs: ${routeId}`);
      }
      if (record.responseByteLength !== null) integer(record.responseByteLength, `${routeId}.responseByteLength`);
      if (record.responseSha256 !== null && !SHA256.test(string(record.responseSha256, `${routeId}.responseSha256`))) {
        throw new Error(`successor blocked-route response hash differs: ${routeId}`);
      }
      routeBlockers.push(routeId);
    }
    const evidenceText = canonicalJson(record);
    if (/\{\{OPENALEX_API_KEY\}\}|PHASE8_CONTACT_EMAIL|mailto:/i.test(evidenceText)) {
      throw new Error(`successor smoke leaks a secret or contact placeholder: ${routeId}`);
    }
  }
  return {
    credentialBlockers,
    routeBlockers,
    summary: { succeeded, blockedCredential: credentialBlockers.length, blockedRoute: routeBlockers.length, removed },
  };
}

function verifyReport(
  report: JsonObject,
  payloadDescriptors: readonly JsonObject[],
  smoke: ReturnType<typeof verifySmoke>,
): VerifiedSearchProtocolSuccessor {
  exactKeys(report, ["schema", "operator", "state", "supersedes", "artifacts", "derivedCounts", "smokeSummary", "credentialBlockers", "routeBlockers", "readiness", "grantsValidationClaim", "permitsPhase9Execution", "claim"], "report");
  if (
    report.schema !== "phase8b-lean-search-successor-report-v2" || report.operator !== OPERATOR ||
    report.state !== "protocol-successor-candidate-search-unexecuted" || report.grantsValidationClaim !== false ||
    report.permitsPhase9Execution !== false || canonicalJson(report.artifacts) !== canonicalJson(payloadDescriptors)
  ) {
    throw new Error("successor report identity, pins, or claim boundary differs");
  }
  if (report.claim !== "The maker-authorized route-readiness successor and fresh uncounted smokes are registered; no counted search or measurement extraction has run.") {
    throw new Error("successor report claim differs");
  }
  if (canonicalJson(report.supersedes) !== canonicalJson({ path: `${PREDECESSOR_DIRECTORY}/artifact-index.json`, ...PREDECESSOR_INDEX })) {
    throw new Error("successor report predecessor binding differs");
  }
  const counts = object(report.derivedCounts, "report.derivedCounts");
  const expectedCounts = { routeCount: 13, activeRouteCount: 10, removedRouteCount: 3, queryCount: 32, routeQueryCellCount: 256, smokeResultCount: 13, registeredSearchRequestCount: 0 };
  if (canonicalJson(counts) !== canonicalJson(expectedCounts)) throw new Error("successor report counts differ");
  if (
    canonicalJson(report.smokeSummary) !== canonicalJson(smoke.summary) ||
    canonicalJson(report.credentialBlockers) !== canonicalJson(smoke.credentialBlockers) ||
    canonicalJson(report.routeBlockers) !== canonicalJson(smoke.routeBlockers)
  ) {
    throw new Error("successor report smoke derivation differs");
  }
  const readiness = smoke.routeBlockers.length > 0
    ? "protocol-recorded-route-blockers-open"
    : smoke.credentialBlockers.length > 0
      ? "protocol-ready-credentials-open"
      : "ready-for-counted-search-after-freeze";
  if (report.readiness !== readiness) throw new Error("successor report readiness differs");
  return { routeCount: 13, queryCount: 32, routeQueryCellCount: 256, credentialBlockers: smoke.credentialBlockers, routeBlockers: smoke.routeBlockers, readiness };
}

export function verifyPhase8SearchSuccessorArtifacts(
  actual: ReadonlyMap<string, Uint8Array>,
  repositoryRoot: string,
): VerifiedSearchProtocolSuccessor {
  const predecessor = verifyPredecessor(repositoryRoot);
  const names = [...actual.keys()].sort(lexicalCompare);
  if (canonicalJson(names) !== canonicalJson(ARTIFACT_NAMES)) {
    throw new Error("successor bundle file set differs");
  }
  if (!bytesEqual(
    actual.get("queries.jsonl") as Uint8Array,
    predecessor.get("queries.jsonl") as Uint8Array,
  )) {
    throw new Error("successor query bytes differ from accepted S1");
  }

  const parsed = new Map<string, StrictJson>();
  for (const name of ["artifact-index.json", "protocol.json", "report.json"] as const) {
    parsed.set(name, parseCanonicalJson(actual.get(name) as Uint8Array, name));
  }
  const routes = parseJsonLines(actual.get("routes.jsonl") as Uint8Array, "routes.jsonl");
  const queries = parseJsonLines(actual.get("queries.jsonl") as Uint8Array, "queries.jsonl");
  const cells = parseJsonLines(
    actual.get("route-query-cells.jsonl") as Uint8Array,
    "route-query-cells.jsonl",
  );
  const smoke = parseJsonLines(
    actual.get("smoke-results.jsonl") as Uint8Array,
    "smoke-results.jsonl",
  );
  const protocol = object(parsed.get("protocol.json"), "protocol");
  const report = object(parsed.get("report.json"), "report");
  for (const value of [protocol, report, ...routes, ...queries, ...cells, ...smoke]) {
    rejectCallerVerdicts(value);
  }

  const index = object(parsed.get("artifact-index.json"), "artifact index");
  exactKeys(index, ["schema", "bundleCompleteness", "report", "artifacts"], "artifact index");
  if (
    index.schema !== "phase8b-lean-search-successor-index-v2" ||
    index.bundleCompleteness !== "complete"
  ) {
    throw new Error("successor artifact index identity differs");
  }
  const payloadDescriptors = PAYLOAD_NAMES.map((path) =>
    descriptor(
      path,
      path.endsWith("jsonl") ? "canonical-jsonl" : "canonical-json",
      actual.get(path) as Uint8Array,
    )
  );
  const reportDescriptor = descriptor(
    "report.json",
    "canonical-json-report",
    actual.get("report.json") as Uint8Array,
  );
  if (
    canonicalJson(descriptorFrom(index.report, "artifact index report")) !==
    canonicalJson(reportDescriptor)
  ) {
    throw new Error("successor artifact index report pin differs");
  }
  const indexed = array(index.artifacts, "artifact index artifacts").map((entry, position) =>
    descriptorFrom(entry, `artifact index artifact ${position}`)
  );
  if (canonicalJson(indexed) !== canonicalJson([reportDescriptor, ...payloadDescriptors])) {
    throw new Error("successor artifact index payload pins differ");
  }

  if (routes.length !== 13 || queries.length !== 32 || cells.length !== 256 || smoke.length !== 13) {
    throw new Error("successor dimensions differ");
  }
  const predecessorProtocol = object(
    parseCanonicalJson(predecessor.get("protocol.json") as Uint8Array, "predecessor protocol"),
    "predecessor protocol",
  );
  const predecessorRoutes = parseJsonLines(
    predecessor.get("routes.jsonl") as Uint8Array,
    "predecessor routes",
  );
  const predecessorCells = parseJsonLines(
    predecessor.get("route-query-cells.jsonl") as Uint8Array,
    "predecessor cells",
  );
  verifyProtocol(protocol, predecessorProtocol);
  const routeMap = verifyRoutes(routes, predecessorRoutes);
  const queryMap = recordsById(queries, "query");
  verifyCells(cells, predecessorCells, routeMap, queryMap);
  const smokeResult = verifySmoke(smoke, routeMap, queryMap);
  return verifyReport(report, payloadDescriptors, smokeResult);
}

export function verifyPhase8SearchSuccessorBundle(
  directory: string,
  repositoryRoot: string,
): VerifiedSearchProtocolSuccessor {
  return verifyPhase8SearchSuccessorArtifacts(readArtifactDirectory(resolve(directory)), repositoryRoot);
}
