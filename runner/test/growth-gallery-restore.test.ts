import { createHash } from "node:crypto";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { galleryInputPath, placeGalleryInput, readVerifiedGalleryInput } from "../../scripts/restore-growth-gallery.ts";
import { readStudy } from "../../app/growth-study-assets.ts";
import type { GrowthStudyEntry } from "../../app/src/growth-study-library.ts";

const roots: string[] = [];
afterEach(() => { for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true }); });
const root = () => { const value = mkdtempSync(join(tmpdir(), "gallery-recovery-")); roots.push(value); return value; };
const digest = (bytes: Uint8Array) => createHash("sha256").update(bytes).digest("hex");
const entry: GrowthStudyEntry = { id: "run-b", label: "Run B", habit: "dendrite", source: "run-b", sourceSha256: "0".repeat(64), eventCount: 2, finalTick: 10, terminationReason: "tick-cap" };

describe("registered gallery recovery", () => {
  it("keeps all destinations inside local output staging", () => {
    expect(galleryInputPath(entry)).toBe("out/growth-assets/run-b-growth-v1.bin");
    expect(galleryInputPath({ ...entry, id: "sample", source: "named-direct", sourcePath: "out/named-crystal-catalog/sample.bin" })).toBe("out/named-crystal-catalog/sample.bin");
    for (const path of ["research/private.bin", "out/../private.bin", "out/alias\\private.bin"])
      expect(() => galleryInputPath({ ...entry, source: "named-direct", sourcePath: path })).toThrow();
  });

  it("recovers exact bytes and reruns without replacing them", () => {
    const target = root();
    const bytes = Buffer.from("registered compact recording");
    const path = galleryInputPath(entry);
    expect(placeGalleryInput(target, path, bytes, digest(bytes))).toBe("restored");
    expect(placeGalleryInput(target, path, bytes, digest(bytes))).toBe("verified");
    expect(readVerifiedGalleryInput(target, path, digest(bytes), bytes.length)).toEqual(bytes);
  });

  it("refuses mismatched sources and preserves a different existing local file", () => {
    const target = root();
    const bytes = Buffer.from("registered recording");
    const path = galleryInputPath(entry);
    expect(() => placeGalleryInput(target, path, Buffer.from("wrong source"), digest(bytes))).toThrow("identity mismatch");
    mkdirSync(join(target, "out/growth-assets"), { recursive: true });
    writeFileSync(join(target, path), "local recording kept");
    expect(() => placeGalleryInput(target, path, bytes, digest(bytes))).toThrow("Existing gallery input differs");
    expect(readFileSync(join(target, path), "utf8")).toBe("local recording kept");
  });

  it("serves recovered Run B from the worktree without a sibling website", () => {
    const target = root();
    const header = Buffer.from(JSON.stringify({ format: "gutcheck-growth-v1", eventCount: 2, finalTick: 10, config: { dims: { nx: 3, ny: 3, nz: 3 }, center: [1, 1, 1] } }));
    const prefix = Buffer.alloc(4); prefix.writeUInt32LE(header.length);
    const events = Buffer.alloc(16); events.writeUInt32LE(13); events.writeUInt32LE(14, 8); events.writeUInt32LE(10, 12);
    const bytes = Buffer.concat([prefix, header, events]);
    const registered = { ...entry, sourceSha256: digest(bytes) };
    placeGalleryInput(target, galleryInputPath(registered), bytes, registered.sourceSha256);
    expect(readStudy(target, registered)?.subarray(-16)).toEqual(events);
    expect(readStudy(target, { ...registered, sourceSha256: "f".repeat(64) })).toBeNull();
  });
});
