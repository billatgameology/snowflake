import { mkdtempSync, mkdirSync, writeFileSync, rmSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import { createHash } from "node:crypto";
import { createServer } from "node:http";
import { afterEach, describe, expect, it } from "vitest";
import { createGrowthStudyHandler, loadStudyManifest, packageStudy, readStudy, readStudyPreview } from "../../app/growth-study-assets.ts";
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
  it("serves only source-matched, digest-matched previews and supports image revalidation", async () => {
    const f = fixture();
    const folder = join(f.root, "app/data/growth-previews"); mkdirSync(folder, { recursive: true });
    const bytes = Buffer.from("png fixture");
    const image = join(folder, `${f.entry.id}.png`);
    const manifest = { format: "growth-study-previews-v1", previews: [{ id: f.entry.id, sourceSha256: f.entry.sourceSha256, sha256: createHash("sha256").update(bytes).digest("hex"), byteLength: bytes.length }] };
    writeFileSync(image, bytes); writeFileSync(join(folder, "index.json"), JSON.stringify(manifest));
    expect(readStudyPreview(f.root, f.entry)).toEqual(bytes);
    expect(readStudyPreview(f.root, { ...f.entry, sourceSha256: "f".repeat(64) })).toBeNull();
    const server = createServer(createGrowthStudyHandler(f.root, f.library));
    await new Promise<void>(r => server.listen(0, "127.0.0.1", r));
    const address = server.address(); if (!address || typeof address === "string") throw new Error("Missing address");
    const base = `http://127.0.0.1:${address.port}`;
    try {
      const response = await fetch(`${base}/sample.png`);
      expect(response.status).toBe(200); expect(response.headers.get("content-type")).toBe("image/png");
      expect(Buffer.from(await response.arrayBuffer())).toEqual(bytes);
      expect((await fetch(`${base}/sample.png`, { headers: { "if-none-match": response.headers.get("etag")! } })).status).toBe(304);
      for (const path of ["/unknown.png", "/%2e%2e%2fprivate.png", "/index.png"]) expect((await fetch(base + path)).status).toBe(404);
      const head = await fetch(`${base}/sample.png`, { method: "HEAD" });
      expect(head.headers.get("content-length")).toBe(String(bytes.length)); expect((await head.arrayBuffer()).byteLength).toBe(0);
      writeFileSync(image, "corrupt"); expect((await fetch(`${base}/sample.png`)).status).toBe(404);
    } finally { await new Promise<void>(r => server.close(() => r())); }
  });
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

  it("registers both libraries including the accepted named trios and preserves exclusions", () => {
    const root = resolve(import.meta.dirname, "../..");
    const library = loadStudyManifest(root);
    expect(library.entries).toHaveLength(151);
    expect(library.entries.filter(entry => entry.source === "named-direct")).toHaveLength(66);
    expect(library.entries.filter(entry => entry.source === "named-compose")).toHaveLength(33);
    const families = new Map<string, number>();
    for (const entry of library.entries.filter(entry => entry.source.startsWith("named-"))) families.set(entry.habit, (families.get(entry.habit) ?? 0) + 1);
    expect(families.size).toBe(33);
    expect([...families.values()].every(count => count === 3)).toBe(true);
    expect(library.entries.some(entry => entry.id === "run-b")).toBe(true);
    expect(library.entries.some(entry => entry.id === "fig6")).toBe(false);
    expect(library.excluded.some(entry => entry.id === "fig6")).toBe(true);
    const packaged = readFileSync(resolve(root, "app/data/dendrite-study.bin"));
    expect(JSON.parse(packaged.subarray(4, 4 + packaged.readUInt32LE(0)).toString()).sourceSha256).toBe(library.entries.find(entry => entry.id === library.defaultId)!.sourceSha256);
  });

  it("packages only pinned named components, deduplicating scenes without leaking source paths", async () => {
    const f = fixture();
    const direct: GrowthStudyEntry = { ...f.entry, id: "named-sample", source: "named-direct", sourcePath: "out/named-crystal-catalog/final-resolution-a-v1/sample/growth-v1.bin" };
    mkdirSync(dirname(join(f.root, direct.sourcePath!)), { recursive: true });
    writeFileSync(join(f.root, direct.sourcePath!), f.original);
    const sceneBytes = Buffer.from(JSON.stringify({ format: "growth-scene-v1", disclosure: "composed-visualization", camera: { tiltDegrees: 55, yawDegrees: 0 }, components: [0, 0.2].map(phaseOffset => ({ growthAsset: { sha256: direct.sourceSha256, byteLength: f.original.length, url: "/private-source-path" }, scientificBundle: { locator: "private-scientific-path" }, phaseOffset, transform: { translate: [0, 0, 0], rotateDegrees: [0, 0, 0], scale: 1 } })) }));
    const scene: GrowthStudyEntry = { ...f.entry, id: "named-scene", source: "named-compose", sourcePath: "out/named-crystal-catalog/final-compose-v1/sample/scene.json", sourceSha256: createHash("sha256").update(sceneBytes).digest("hex"), eventCount: 4, finalTick: 1 };
    mkdirSync(dirname(join(f.root, scene.sourcePath!)), { recursive: true });
    writeFileSync(join(f.root, scene.sourcePath!), sceneBytes);
    const library: GrowthStudyLibrary = { ...f.library, entries: [direct, scene] };
    const bytes = readStudy(f.root, scene, library)!;
    const header = JSON.parse(bytes.subarray(4, 4 + bytes.readUInt32LE(0)).toString());
    expect(header.assets).toHaveLength(1);
    expect(header.components).toHaveLength(2);
    expect(bytes.toString()).not.toContain("private-");
    expect(bytes.toString()).not.toContain("workstation-");
    expect(readStudy(f.root, { ...direct, sourcePath: "out/named-crystal-catalog/../../private.bin" }, library)).toBeNull();
    writeFileSync(join(f.root, direct.sourcePath!), "corrupt");
    expect(readStudy(f.root, scene, library)).toBeNull();
  });
});
