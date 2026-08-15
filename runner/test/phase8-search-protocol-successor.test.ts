import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { canonicalJson, canonicalJsonBytes, sha256Bytes } from "../src/gate4-evidence.ts";
import {
  buildCiNiiSparql,
  derivePhase8SearchSuccessorBundle,
  runPhase8SearchSuccessorSmoke,
  writePhase8SearchSuccessorBundle,
  type SuccessorSmokeResult,
} from "../src/phase8-search-protocol-successor.ts";
import {
  verifyPhase8SearchSuccessorArtifacts,
  verifyPhase8SearchSuccessorBundle,
} from "../src/phase8-search-protocol-successor-verify.ts";

const REPOSITORY_ROOT = process.cwd();
const PAYLOADS = ["protocol.json", "queries.jsonl", "route-query-cells.jsonl", "routes.jsonl", "smoke-results.jsonl"] as const;
const directories: string[] = [];
type MutableObject = Record<string, unknown>;

afterEach(() => {
  for (const directory of directories.splice(0)) rmSync(directory, { recursive: true, force: true });
});

function response(target: string, body: string, contentType = "application/json", status = 200): Response {
  const bytes = new TextEncoder().encode(body);
  return {
    ok: status >= 200 && status < 300,
    status,
    url: target,
    headers: new Headers({ "content-type": contentType }),
    arrayBuffer: async () => bytes.buffer,
  } as Response;
}

const fakeFetch = (async (input: string | URL | globalThis.Request, init?: RequestInit) => {
  const target = String(input);
  if (target.includes("cinii.kgraph.jp")) {
    expect(init?.method).toBe("POST");
    expect(String(init?.body)).toContain("LIMIT+1");
    return response(target, '{"head":{"vars":["article"]},"results":{"bindings":[]}}', "application/sparql-results+json");
  }
  if (target.includes("export.arxiv.org")) return response(target, "<feed></feed>", "application/atom+xml");
  if (target.includes("api.crossref.org")) return response(target, '{"message":{"items":[]}}');
  if (target.includes("api.datacite.org")) return response(target, '{"data":[],"links":{}}');
  if (target.includes("ntrs.nasa.gov")) return response(target, '{"results":[],"stats":{"estimate":false,"total":0}}');
  if (target.includes("ndlsearch")) return response(target, "<searchRetrieveResponse></searchRetrieveResponse>", "application/xml");
  if (target.includes("api.openalex.org")) return response(target, '{"meta":{"next_cursor":null},"results":[]}');
  if (target.includes("semanticscholar")) return response(target, '{"data":[],"token":null,"total":0}');
  return response(target, "ok", "text/plain");
}) as typeof fetch;

async function fixtureSmoke(key = "secret-openalex-test-key"): Promise<readonly SuccessorSmokeResult[]> {
  return runPhase8SearchSuccessorSmoke({
    repositoryRoot: REPOSITORY_ROOT,
    openAlexApiKey: key,
    fetchImpl: fakeFetch,
    observedAtUtc: "2026-08-11T22:00:00.000Z",
  });
}

function json(bytes: Uint8Array): MutableObject {
  return JSON.parse(new TextDecoder().decode(bytes)) as MutableObject;
}

function jsonLines(bytes: Uint8Array): MutableObject[] {
  return new TextDecoder().decode(bytes).trimEnd().split("\n").filter(Boolean)
    .map((line) => JSON.parse(line) as MutableObject);
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
  if (value === null || typeof value !== "object" || Array.isArray(value)) throw new Error(`${key} is not an object`);
  return value as MutableObject;
}

describe("Phase 8B route-readiness successor", () => {
  it("reopens accepted S1 and independently verifies the complete narrow v2 successor", async () => {
    const smoke = await fixtureSmoke();
    const bundle = derivePhase8SearchSuccessorBundle(REPOSITORY_ROOT, smoke);
    expect([...bundle.artifacts.keys()].sort()).toEqual([
      "artifact-index.json", "protocol.json", "queries.jsonl", "report.json",
      "route-query-cells.jsonl", "routes.jsonl", "smoke-results.jsonl",
    ]);
    expect(verifyPhase8SearchSuccessorArtifacts(bundle.artifacts, REPOSITORY_ROOT)).toEqual({
      routeCount: 13,
      queryCount: 32,
      routeQueryCellCount: 256,
      credentialBlockers: [],
      routeBlockers: [],
      readiness: "ready-for-counted-search-after-freeze",
    });
    expect(new TextDecoder().decode(bundle.artifacts.get("queries.jsonl"))).toBe(
      new TextDecoder().decode((await import("node:fs")).readFileSync("evidence/phase8b-search-protocol/queries.jsonl")),
    );
  });

  it("uses only the runtime OpenAlex secret and never retains it or invented contact data", async () => {
    const secret = "secret-openalex-test-key";
    const smoke = await fixtureSmoke(secret);
    const serializedSmoke = canonicalJson(smoke);
    expect(serializedSmoke).not.toContain(secret);
    expect(serializedSmoke).not.toContain("PHASE8_CONTACT_EMAIL");
    expect(serializedSmoke).not.toContain("mailto:");
    const bundleText = [...derivePhase8SearchSuccessorBundle(REPOSITORY_ROOT, smoke).artifacts.values()]
      .map((bytes) => new TextDecoder().decode(bytes)).join("\n");
    expect(bundleText).not.toContain(secret);
    expect(bundleText.match(/\{\{OPENALEX_API_KEY\}\}/g)?.length).toBeGreaterThan(0);
    expect(bundleText).not.toContain("{{PHASE8_CONTACT_EMAIL}}");
  });

  it("redacts raw and encoded OpenAlex secrets from thrown transport errors", async () => {
    const secret = "secret+/=?&key";
    const throwingFetch = (async (input: string | URL | globalThis.Request, init?: RequestInit) => {
      const target = String(input);
      if (target.includes("api.openalex.org")) {
        throw new Error(`transport failed for raw=${secret} encoded=${encodeURIComponent(secret)} target=${target}`);
      }
      return fakeFetch(input, init);
    }) as typeof fetch;
    const smoke = await runPhase8SearchSuccessorSmoke({
      repositoryRoot: REPOSITORY_ROOT,
      openAlexApiKey: secret,
      fetchImpl: throwingFetch,
      observedAtUtc: "2026-08-11T22:00:00.000Z",
    });
    const openalex = smoke.find((record) => record.routeId === "openalex");
    expect(openalex?.outcome).toBe("blocked-route");
    expect(canonicalJson(openalex)).not.toContain(secret);
    expect(canonicalJson(openalex)).not.toContain(encodeURIComponent(secret));
    expect(openalex?.blocker).toContain("REDACTED");
  });

  it("materializes the registered strict CiNii keyset continuation", () => {
    const cursor = "https://cir.nii.ac.jp/crid/1234567890123456789.rdf";
    const sparql = buildCiNiiSparql("ice crystal", cursor);
    expect(sparql).toContain(`FILTER(STR(?article) > "${cursor}")`);
    expect(sparql).toContain("ORDER BY STR(?article)");
    expect(sparql).toContain("LIMIT 101");
  });

  it("publishes once and reopens exact bytes", async () => {
    const parent = mkdtempSync(join(tmpdir(), "phase8-search-successor-"));
    directories.push(parent);
    const directory = join(parent, "candidate");
    const bundle = derivePhase8SearchSuccessorBundle(REPOSITORY_ROOT, await fixtureSmoke());
    writePhase8SearchSuccessorBundle(directory, bundle);
    expect(verifyPhase8SearchSuccessorBundle(directory, REPOSITORY_ROOT).routeQueryCellCount).toBe(256);
    expect(() => writePhase8SearchSuccessorBundle(directory, bundle)).toThrow(/overwrite/);
  });

  const controls: readonly { name: string; mutate: (artifacts: Map<string, Uint8Array>) => void; error: RegExp }[] = [
    { name: "predecessor binding drift", mutate: (a) => mutateJson(a, "protocol.json", (r) => { objectAt(r, "supersedes").sha256 = "0".repeat(64); }), error: /predecessor binding/ },
    { name: "query-byte drift", mutate: (a) => mutateJsonl(a, "queries.jsonl", (r) => { r[0]!.canonicalQuery = "changed"; }), error: /query bytes/ },
    { name: "post-snapshot coverage claim", mutate: (a) => mutateJsonl(a, "routes.jsonl", (r) => { objectAt(r.find((x) => x.id === "cinii") as MutableObject, "coverage").coversProjectCutoff = true; }), error: /authorized successor route delta|snapshot\/recall/ },
    { name: "CiNii rights default-open", mutate: (a) => mutateJsonl(a, "routes.jsonl", (r) => { objectAt(r.find((x) => x.id === "cinii") as MutableObject, "responseRights").publicRedistribution = "permitted"; }), error: /authorized successor route delta|response-rights/ },
    { name: "CiNii SPARQL field loss", mutate: (a) => mutateJsonl(a, "route-query-cells.jsonl", (r) => { const cell = r.find((x) => x.routeId === "cinii") as MutableObject; const request = objectAt(cell, "plannedRequest"); request.bodyTemplate = String(request.bodyTemplate).replace("foaf%3Atopic", "foaf%3Abroken"); cell.plannedRequestSha256 = sha256Bytes(canonicalJsonBytes(request)); }), error: /planned request differs/ },
    { name: "restored contact placeholder", mutate: (a) => mutateJsonl(a, "routes.jsonl", (r) => { const route = r.find((x) => x.id === "crossref") as MutableObject; objectAt(route, "request").targetTemplate = `${String(objectAt(route, "request").targetTemplate)}&mailto={{PHASE8_CONTACT_EMAIL}}`; }), error: /authorized successor route delta|contact placeholder/ },
    { name: "second credential gate", mutate: (a) => mutateJsonl(a, "routes.jsonl", (r) => { (r.find((x) => x.id === "datacite") as MutableObject).credentialEnv = "SOME_SECRET"; }), error: /authorized successor route delta|false credential gate/ },
    { name: "fake smoke hash", mutate: (a) => mutateJsonl(a, "smoke-results.jsonl", (r) => { (r.find((x) => x.routeId === "openalex") as MutableObject).plannedRequestSha256 = "1".repeat(64); }), error: /smoke planned request/ },
    { name: "partial CiNii response accepted", mutate: (a) => mutateJsonl(a, "smoke-results.jsonl", (r) => { (r.find((x) => x.routeId === "cinii") as MutableObject).httpStatus = 206; }), error: /successful smoke/ },
    { name: "caller verdict", mutate: (a) => mutateJson(a, "report.json", (r) => { r.verdict = "pass"; }), error: /caller-supplied verdict/ },
  ];

  for (const control of controls) {
    it(`rejects changed-risk control: ${control.name}`, async () => {
      const artifacts = new Map(derivePhase8SearchSuccessorBundle(REPOSITORY_ROOT, await fixtureSmoke()).artifacts);
      control.mutate(artifacts);
      expect(() => verifyPhase8SearchSuccessorArtifacts(artifacts, REPOSITORY_ROOT)).toThrow(control.error);
    });
  }
});
