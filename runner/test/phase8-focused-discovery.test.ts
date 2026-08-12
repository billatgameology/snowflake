import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { runFocusedDiscovery } from "../src/phase8-focused-discovery.ts";

// fileURLToPath, not URL#pathname: the pathname form yields "/G:/Code%20Files/…" on Windows,
// which resolve() then mangles into a doubled drive letter. Behavior-identical on POSIX.
const REPOSITORY_ROOT = fileURLToPath(new URL("../..", import.meta.url));
const KEY = "test-openalex-key-unsafe-to-retain";

function response(value: unknown, contentType = "application/json"): Response {
  return new Response(JSON.stringify(value), {
    status: 200,
    headers: { "content-type": contentType },
  });
}

describe("Phase 8B focused discovery", () => {
  it("executes exactly four OpenAlex and three CiNii queries without retaining the key", async () => {
    const originalFetch = globalThis.fetch;
    const calls: string[] = [];
    globalThis.fetch = async (input) => {
      const target = String(input);
      calls.push(target);
      if (target.includes("api.openalex.org")) {
        expect(target).toContain(encodeURIComponent(KEY));
        return response({ meta: { count: 0, next_cursor: null, cost_usd: 0.001 }, results: [] });
      }
      expect(target).toBe("https://cinii.kgraph.jp/sparql");
      return response(
        { head: { vars: ["article"] }, results: { bindings: [] } },
        "application/sparql-results+json",
      );
    };
    const rawRoot = join(mkdtempSync(join(tmpdir(), "phase8-focused-")), "run");
    try {
      const report = await runFocusedDiscovery(REPOSITORY_ROOT, rawRoot, KEY, { ciniiPacingMs: 0 });
      expect(report).toMatchObject({ state: "complete", queryCount: 7, requestCount: 7, resultCount: 0, keyAbsenceScanPassed: true });
      expect(calls.filter((target) => target.includes("api.openalex.org"))).toHaveLength(4);
      expect(calls.filter((target) => target.includes("cinii.kgraph.jp"))).toHaveLength(3);
      for (const path of ["run.json", "run-report.json", "response-ledger.jsonl"]) {
        const bytes = readFileSync(join(rawRoot, path));
        expect(bytes.includes(KEY)).toBe(false);
        expect(bytes.includes(encodeURIComponent(KEY))).toBe(false);
      }
    } finally {
      globalThis.fetch = originalFetch;
    }
  }, 15_000);

  it("retains the first response and fails open when a focused query exceeds 500 records", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (input) => {
      const target = String(input);
      if (target.includes("api.openalex.org")) {
        const work = { id: `https://openalex.org/W${Math.abs(target.length)}`, doi: null, title: "candidate", publication_date: "2020-01-01" };
        return response({ meta: { count: 501, next_cursor: "NEXT", cost_usd: 0.001 }, results: [work] });
      }
      return response(
        { head: { vars: ["article"] }, results: { bindings: [] } },
        "application/sparql-results+json",
      );
    };
    const rawRoot = join(mkdtempSync(join(tmpdir(), "phase8-focused-cap-")), "run");
    try {
      const report = await runFocusedDiscovery(REPOSITORY_ROOT, rawRoot, KEY, { ciniiPacingMs: 0 });
      expect(report.state).toBe("bounded-open");
      expect(report.boundedOpenQueryCount).toBe(4);
      expect(report.requestCount).toBe(7);
      expect(readFileSync(join(rawRoot, "openalex", "snow-growth", "page-001.json")).byteLength).toBeGreaterThan(0);
    } finally {
      globalThis.fetch = originalFetch;
    }
  }, 15_000);

  it("refuses to overwrite a prior private run", async () => {
    const rawRoot = mkdtempSync(join(tmpdir(), "phase8-focused-existing-"));
    writeFileSync(join(rawRoot, "marker"), "user data");
    await expect(runFocusedDiscovery(REPOSITORY_ROOT, rawRoot, KEY)).rejects.toThrow("raw root already exists");
  });
});
