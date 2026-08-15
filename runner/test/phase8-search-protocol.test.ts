import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { canonicalJson, canonicalJsonBytes, sha256Bytes } from "../src/gate4-evidence.ts";
import {
  derivePhase8SearchBundle,
  PHASE8_SEARCH_ROUTES,
  phase8SearchSmokeRequestSha256,
  runPhase8SearchSmoke,
  writePhase8SearchBundle,
  type SmokeResult,
} from "../src/phase8-search-protocol.ts";
import {
  verifyPhase8SearchArtifacts,
  verifyPhase8SearchBundle,
} from "../src/phase8-search-protocol-verify.ts";

const REPOSITORY_ROOT = process.cwd();
const PAYLOADS = ["protocol.json", "queries.jsonl", "route-query-cells.jsonl", "routes.jsonl", "smoke-results.jsonl"] as const;
const SHA = "1".repeat(64);
const directories: string[] = [];
type MutableObject = Record<string, unknown>;

afterEach(() => {
  for (const directory of directories.splice(0)) rmSync(directory, { recursive: true, force: true });
});

function fixtureSmoke(): readonly SmokeResult[] {
  return PHASE8_SEARCH_ROUTES.map((route): SmokeResult => {
    if (route.disposition === "reviewed-removal") {
      return { schema: "phase8b-route-smoke-v1", routeId: route.id, outcome: "removed", observedAtUtc: null, plannedRequestSha256: null, httpStatus: null, effectiveUrl: null, responseByteLength: null, responseSha256: null, blocker: route.removalReason, countedSearch: false };
    }
    if (route.credentialEnv !== null) {
      return { schema: "phase8b-route-smoke-v1", routeId: route.id, outcome: "blocked-credential", observedAtUtc: null, plannedRequestSha256: null, httpStatus: null, effectiveUrl: null, responseByteLength: null, responseSha256: null, blocker: `missing environment variable ${route.credentialEnv}`, countedSearch: false };
    }
    return { schema: "phase8b-route-smoke-v1", routeId: route.id, outcome: "succeeded", observedAtUtc: "2026-08-11T20:00:00.000Z", plannedRequestSha256: phase8SearchSmokeRequestSha256(route.id), httpStatus: 200, effectiveUrl: `https://smoke.invalid/${route.id}`, responseByteLength: 2, responseSha256: SHA, blocker: null, countedSearch: false };
  });
}

function bundleMap(): Map<string, Uint8Array> {
  return new Map(derivePhase8SearchBundle(REPOSITORY_ROOT, fixtureSmoke()).artifacts);
}

function json(bytes: Uint8Array): MutableObject {
  return JSON.parse(new TextDecoder().decode(bytes)) as MutableObject;
}

function jsonLines(bytes: Uint8Array): MutableObject[] {
  return new TextDecoder().decode(bytes).trimEnd().split("\n").filter(Boolean).map((line) => JSON.parse(line) as MutableObject);
}

function linesBytes(records: readonly MutableObject[]): Uint8Array {
  return new TextEncoder().encode(`${records.map((record) => canonicalJson(record)).join("\n")}\n`);
}

function descriptor(path: string, kind: string, bytes: Uint8Array): MutableObject {
  return { path, kind, byteLength: bytes.byteLength, sha256: sha256Bytes(bytes) };
}

function reseal(artifacts: Map<string, Uint8Array>): void {
  const report = json(artifacts.get("report.json") as Uint8Array);
  const payloadDescriptors = PAYLOADS.map((path) => descriptor(path, path.endsWith("jsonl") ? "canonical-jsonl" : "canonical-json", artifacts.get(path) as Uint8Array));
  report.artifacts = payloadDescriptors;
  const reportBytes = canonicalJsonBytes(report);
  artifacts.set("report.json", reportBytes);
  const reportDescriptor = descriptor("report.json", "canonical-json-report", reportBytes);
  const index = json(artifacts.get("artifact-index.json") as Uint8Array);
  index.report = reportDescriptor;
  index.artifacts = [reportDescriptor, ...payloadDescriptors];
  artifacts.set("artifact-index.json", canonicalJsonBytes(index));
}

function mutateJson(artifacts: Map<string, Uint8Array>, path: "protocol.json" | "report.json", mutation: (record: MutableObject) => void): void {
  const record = json(artifacts.get(path) as Uint8Array);
  mutation(record);
  artifacts.set(path, canonicalJsonBytes(record));
  reseal(artifacts);
}

function mutateJsonl(artifacts: Map<string, Uint8Array>, path: "queries.jsonl" | "route-query-cells.jsonl" | "routes.jsonl" | "smoke-results.jsonl", mutation: (records: MutableObject[]) => void): void {
  const records = jsonLines(artifacts.get(path) as Uint8Array);
  mutation(records);
  artifacts.set(path, linesBytes(records));
  reseal(artifacts);
}

function objectAt(record: MutableObject, key: string): MutableObject {
  const value = record[key];
  if (value === null || typeof value !== "object" || Array.isArray(value)) throw new Error(`test fixture ${key} is not an object`);
  return value as MutableObject;
}

describe("Phase 8B lean search protocol", () => {
  it("builds and independently verifies exactly seven unexecuted-search artifacts", () => {
    const bundle = derivePhase8SearchBundle(REPOSITORY_ROOT, fixtureSmoke());
    expect([...bundle.artifacts.keys()].sort()).toEqual([
      "artifact-index.json", "protocol.json", "queries.jsonl", "report.json",
      "route-query-cells.jsonl", "routes.jsonl", "smoke-results.jsonl",
    ]);
    const result = verifyPhase8SearchArtifacts(bundle.artifacts, REPOSITORY_ROOT);
    expect(result).toEqual({
      routeCount: 13,
      queryCount: 32,
      routeQueryCellCount: 256,
      credentialBlockers: ["cinii", "crossref", "datacite", "nasa-ntrs", "openalex"],
      routeBlockers: [],
      readiness: "protocol-ready-credentials-open",
    });
    expect(new TextDecoder().decode(bundle.artifacts.get("report.json"))).toContain('"registeredSearchRequestCount":0');
  });

  it("publishes once and reopens the immutable bytes", () => {
    const parent = mkdtempSync(join(tmpdir(), "phase8-search-")); directories.push(parent);
    const directory = join(parent, "candidate");
    const bundle = derivePhase8SearchBundle(REPOSITORY_ROOT, fixtureSmoke());
    writePhase8SearchBundle(directory, bundle);
    expect(verifyPhase8SearchBundle(directory, REPOSITORY_ROOT).routeQueryCellCount).toBe(256);
    expect(() => writePhase8SearchBundle(directory, bundle)).toThrow(/overwrite/);
  });

  it("runs route-shape smoke without counting it or retaining credentials", async () => {
    const fakeFetch = (async (input: string | URL | globalThis.Request, init?: RequestInit) => {
      const target = String(input);
      let body = "{}";
      if (target.includes("export.arxiv.org")) body = "<feed></feed>";
      else if (target.includes("cir.nii")) body = '{"items":[]}';
      else if (target.includes("crossref")) {
        expect(target).toContain("maker%40example.test");
        expect(JSON.stringify(init?.headers)).toContain("maker@example.test");
        body = '{"message":{"items":[]}}';
      }
      else if (target.includes("datacite.org")) body = '{"data":[],"links":{}}';
      else if (target.includes("ntrs.nasa")) {
        expect(init?.method).toBe("POST");
        body = '{"results":[],"stats":{"estimate":false,"total":0}}';
      } else if (target.includes("ndlsearch")) body = "<searchRetrieveResponse></searchRetrieveResponse>";
      else if (target.includes("openalex")) body = '{"meta":{"next_cursor":null},"results":[]}';
      else if (target.includes("semanticscholar")) body = '{"data":[],"token":null,"total":0}';
      else body = "ok";
      const bytes = new TextEncoder().encode(body);
      return { ok: true, status: 200, url: target, arrayBuffer: async () => bytes.buffer } as Response;
    }) as typeof fetch;
    const environment = { PHASE8_CONTACT_EMAIL: "maker@example.test", CINII_APP_ID: "secret-cinii", OPENALEX_API_KEY: "secret-openalex" };
    const smoke = await runPhase8SearchSmoke({ environment, fetchImpl: fakeFetch, observedAtUtc: "2026-08-11T20:00:00.000Z" });
    expect(smoke.filter((record) => record.outcome === "succeeded")).toHaveLength(10);
    expect(smoke.filter((record) => record.outcome === "removed")).toHaveLength(3);
    const serialized = canonicalJson(smoke);
    expect(serialized).not.toContain("secret-cinii");
    expect(serialized).not.toContain("secret-openalex");
    expect(serialized).not.toContain("maker@example.test");
    expect(verifyPhase8SearchArtifacts(derivePhase8SearchBundle(REPOSITORY_ROOT, smoke).artifacts, REPOSITORY_ROOT).readiness).toBe("ready-for-counted-search-after-freeze");
  });

  const controls: readonly { readonly name: string; readonly mutate: (artifacts: Map<string, Uint8Array>) => void; readonly error: RegExp }[] = [
    { name: "omitted route/query cell", mutate: (a) => mutateJsonl(a, "route-query-cells.jsonl", (r) => { r.shift(); }), error: /cell count|omitted/ },
    { name: "false pagination closure", mutate: (a) => mutateJsonl(a, "routes.jsonl", (r) => { objectAt(r[0] as MutableObject, "pagination").completion = "first page is enough"; }), error: /pagination completion/ },
    { name: "swallowed removed-route failure", mutate: (a) => mutateJsonl(a, "smoke-results.jsonl", (r) => { const x = r.find((v) => v.routeId === "jstage") as MutableObject; x.outcome = "succeeded"; x.observedAtUtc = "2026-08-11T20:00:00.000Z"; x.plannedRequestSha256 = SHA; x.httpStatus = 200; x.effectiveUrl = "https://example.test"; x.responseByteLength = 1; x.responseSha256 = SHA; x.blocker = null; }), error: /removed route smoke mismatch/ },
    { name: "altered bytes without index repair", mutate: (a) => { const bytes = (a.get("routes.jsonl") as Uint8Array).slice(); bytes[10] = (bytes[10] as number) ^ 1; a.set("routes.jsonl", bytes); }, error: /index payload pins/ },
    { name: "default-allow rights", mutate: (a) => mutateJson(a, "protocol.json", (r) => { objectAt(objectAt(r, "policies"), "rights").default = "permitted"; }), error: /rights policy/ },
    { name: "false independence", mutate: (a) => mutateJson(a, "protocol.json", (r) => { objectAt(objectAt(r, "policies"), "lineage").unknownMayEstablishIndependence = true; }), error: /lineage independence/ },
    { name: "leakage default-open", mutate: (a) => mutateJson(a, "protocol.json", (r) => { objectAt(objectAt(r, "policies"), "leakage").unknownBlocksHeldOut = false; }), error: /leakage policy/ },
    { name: "caller-supplied verdict", mutate: (a) => mutateJson(a, "report.json", (r) => { r.verdict = "pass"; }), error: /caller-supplied verdict/ },
    { name: "S0 binding drift", mutate: (a) => mutateJson(a, "protocol.json", (r) => { objectAt(objectAt(r, "localDenominatorBinding"), "artifactIndex").sha256 = "0".repeat(64); }), error: /S0 binding/ },
    { name: "query drift", mutate: (a) => mutateJsonl(a, "queries.jsonl", (r) => { const q = r[0] as MutableObject; q.canonicalQuery = `${String(q.canonicalQuery)} changed`; q.canonicalQuerySha256 = sha256Bytes(new TextEncoder().encode(String(q.canonicalQuery))); }), error: /query registry drift/ },
    { name: "source-seed drift", mutate: (a) => mutateJson(a, "protocol.json", (r) => { const seeds = objectAt(r, "seeds"); seeds.sourceContainerIds = (seeds.sourceContainerIds as unknown[]).slice(1); }), error: /source seeds/ },
    { name: "cutoff drift", mutate: (a) => mutateJson(a, "protocol.json", (r) => { objectAt(r, "cutoff").inclusiveDate = "2026-08-12"; }), error: /cutoff drift/ },
    { name: "stopping drift", mutate: (a) => mutateJson(a, "protocol.json", (r) => { objectAt(r, "stopping").consecutiveCompleteZeroAdditionRounds = 1; }), error: /stopping rule/ },
    { name: "smoke coverage mismatch", mutate: (a) => mutateJsonl(a, "smoke-results.jsonl", (r) => { r.pop(); }), error: /smoke result count/ },
    { name: "planned request/hash mismatch", mutate: (a) => mutateJsonl(a, "route-query-cells.jsonl", (r) => { objectAt(r[0] as MutableObject, "plannedRequest").targetTemplate = "https://example.test"; }), error: /planned request hash/ },
    { name: "operation partition gap", mutate: (a) => mutateJsonl(a, "routes.jsonl", (r) => { const route = r[0] as MutableObject; route.unsupportedOperations = (route.unsupportedOperations as unknown[]).slice(1); }), error: /operation coverage/ },
    { name: "resealed matrix request drift", mutate: (a) => mutateJsonl(a, "route-query-cells.jsonl", (r) => { const cell = r.find((value) => value.routeId === "crossref") as MutableObject; const request = objectAt(cell, "plannedRequest"); request.targetTemplate = String(request.targetTemplate).replace("rows=1000", "rows=1"); cell.plannedRequestSha256 = sha256Bytes(canonicalJsonBytes(request)); }), error: /planned request differs from route recipe/ },
    { name: "supported operation moved to unsupported", mutate: (a) => mutateJsonl(a, "routes.jsonl", (r) => { const route = r.find((value) => value.id === "crossref") as MutableObject; route.supportedOperations = (route.supportedOperations as string[]).filter((value) => value !== "datasets"); route.unsupportedOperations = [...(route.unsupportedOperations as string[]), "datasets"].sort(); }), error: /supported operations/ },
    { name: "fake attempted-smoke request hash", mutate: (a) => mutateJsonl(a, "smoke-results.jsonl", (r) => { const smoke = r.find((value) => value.routeId === "arxiv") as MutableObject; smoke.plannedRequestSha256 = "2".repeat(64); }), error: /smoke planned request differs/ },
  ];

  for (const control of controls) {
    it(`rejects risk-class control: ${control.name}`, () => {
      const artifacts = bundleMap();
      control.mutate(artifacts);
      expect(() => verifyPhase8SearchArtifacts(artifacts, REPOSITORY_ROOT)).toThrow(control.error);
    });
  }
});
