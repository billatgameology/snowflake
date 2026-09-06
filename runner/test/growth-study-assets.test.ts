import { mkdtempSync, mkdirSync, writeFileSync, rmSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import { createHash } from "node:crypto";
import { createServer } from "node:http";
import { afterEach, describe, expect, it } from "vitest";
import { createGrowthStudyHandler, loadStudyManifest, packageStudy, readStudy } from "../../app/growth-study-assets.ts";
import type { GrowthStudyEntry, GrowthStudyLibrary } from "../../app/src/growth-study-library.ts";

const scratch: string[] = [];
afterEach(() => {
  for (const root of scratch.splice(0)) {
    if (dirname(root) !== resolve(tmpdir()) || !basename(root).startsWith("growth-study-")) throw new Error("Unexpected test cleanup target");
    rmSync(root, { recursive: true, force: true });
  }
});

function fixture() {
  const root = mkdtempSync(join(resolve(tmpdir()), "growth-study-"));
  scratch.push(root);
  const folder = join(root, "out/growth-assets");
  mkdirSync(folder, { recursive: true });
  const header = Buffer.from(JSON.stringify({ format: "gutcheck-growth-v1", eventCount: 2, finalTick: 10, config: { dims: { nx: 3, ny: 3, nz: 3 }, center: [1, 1, 1] }, source: { command: "workstation-private-path" } }));
  const prefix = Buffer.alloc(4); prefix.writeUInt32LE(header.length);
  const payload = Buffer.alloc(16); payload.writeUInt32LE(13, 0); payload.writeUInt32LE(14, 8); payload.writeUInt32LE(10, 12);
  const original = Buffer.concat([prefix, header, payload]);
  const entry: GrowthStudyEntry = { id: "sample", label: "Sample", habit: "planar", source: "fleet", sourceSha256: createHash("sha256").update(original).digest("hex"), eventCount: 2, finalTick: 10, terminationReason: "tick-cap" };
  const file = join(folder, "sample-growth-v1.bin");
  writeFileSync(file, original);
  const library: GrowthStudyLibrary = { format: "growth-study-library-v1", defaultId: "sample", entries: [entry], excluded: [] };
  return { root, entry, library, original, payload, file };
}

describe("bounded growth presentation assets", () => {
  it("keeps original events byte-exact and drops workstation metadata", () => {
    const f = fixture();
    const bytes = packageStudy(f.original, f.entry)!;
    expect(bytes.subarray(4 + bytes.readUInt32LE(0))).toEqual(f.payload);
    expect(bytes.toString("utf8")).not.toContain("workstation-private-path");
    expect(readStudy(f.root, f.entry)).toEqual(bytes);
    const altered = Buffer.from(f.original); altered[altered.length - 1] ^= 1;
    expect(packageStudy(altered, f.entry)).toBeNull();
    writeFileSync(f.file, altered);
    expect(readStudy(f.root, f.entry)).toBeNull();
  });

  it("serves only registered presentation identities through GET and HEAD", async () => {
    const f = fixture();
    const server = createServer(createGrowthStudyHandler(f.root, f.library));
    await new Promise<void>(resolvePromise => server.listen(0, "127.0.0.1", resolvePromise));
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("Missing test address");
    const base = `http://127.0.0.1:${address.port}`;
    try {
      const index = await (await fetch(`${base}/index.json`)).json() as GrowthStudyLibrary;
      expect(index.entries[0].available).toBe(true);
      const response = await fetch(`${base}/sample.bin`);
      expect(response.status).toBe(200);
      const expected = await response.arrayBuffer();
      const head = await fetch(`${base}/sample.bin`, { method: "HEAD" });
      expect(head.headers.get("content-length")).toBe(String(expected.byteLength));
      expect((await head.arrayBuffer()).byteLength).toBe(0);
      for (const path of ["/fig6.bin", "/unknown.bin", "/%2e%2e%2fprivate.bin", "/sample-growth-v1.bin"]) {
        expect((await fetch(base + path)).status).toBe(404);
      }
      expect((await fetch(`${base}/sample.bin`, { method: "POST" })).status).toBe(405);
      writeFileSync(f.file, "corrupt");
      expect((await fetch(`${base}/sample.bin`)).status).toBe(404);
    } finally { await new Promise<void>((resolvePromise, reject) => server.close(error => error ? reject(error) : resolvePromise())); }
  });

  it("registers the approved website set plus Run B and preserves the Fig. 6 exclusion", () => {
    const root = resolve(import.meta.dirname, "../..");
    const library = loadStudyManifest(root);
    expect(library.entries).toHaveLength(52);
    expect(library.entries.some(entry => entry.id === "run-b")).toBe(true);
    expect(library.entries.some(entry => entry.id === "fig6")).toBe(false);
    expect(library.excluded.some(entry => entry.id === "fig6")).toBe(true);
    const packaged = readFileSync(resolve(root, "app/data/dendrite-study.bin"));
    expect(JSON.parse(packaged.subarray(4, 4 + packaged.readUInt32LE(0)).toString()).sourceSha256).toBe(library.entries.find(entry => entry.id === library.defaultId)!.sourceSha256);
  });
});
