// --growth-out (gutcheck-growth-v1) round trip: grow a small crystal for real, then decode
// the attachment-event asset under the same strict rules the website's consumer enforces
// (snowcrystal_website src/growth/growthAsset.ts): u32 header-length prefix, JSON header,
// eventCount x (u32 flat index, u32 attach tick) LE, eventCount === attachedCount, and a
// crop that actually contains every event.

import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { writeFileSync } from "node:fs";

import { afterEach, describe, expect, it } from "vitest";

const REPO = resolve(import.meta.dirname, "../..");
const SCRIPT = join(REPO, "scripts/gutcheck-grow-params.ts");
const roots: string[] = [];

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

interface DecodedGrowth {
  header: Record<string, unknown>;
  flatIndices: Uint32Array;
  attachTicks: Uint32Array;
}

/** The website decoder's load-bearing checks, ported so this repo cannot drift from them. */
function decodeGrowthV1(bytes: Buffer): DecodedGrowth {
  expect(bytes.byteLength).toBeGreaterThanOrEqual(4);
  const headerBytes = bytes.readUInt32LE(0);
  expect(headerBytes).toBeGreaterThan(0);
  expect(headerBytes).toBeLessThanOrEqual(1024 * 1024);
  const header = JSON.parse(bytes.subarray(4, 4 + headerBytes).toString("utf8")) as Record<
    string,
    unknown
  >;
  expect(header.format).toBe("gutcheck-growth-v1");
  const eventCount = header.eventCount as number;
  expect(eventCount).toBe(header.attachedCount);
  const payload = bytes.byteLength - 4 - headerBytes;
  expect(payload).toBe(eventCount * 8);
  const flatIndices = new Uint32Array(eventCount);
  const attachTicks = new Uint32Array(eventCount);
  for (let event = 0; event < eventCount; event++) {
    const offset = 4 + headerBytes + event * 8;
    flatIndices[event] = bytes.readUInt32LE(offset);
    attachTicks[event] = bytes.readUInt32LE(offset + 4);
  }
  return { header, flatIndices, attachTicks };
}

describe("grow-params --growth-out", () => {
  it("writes a gutcheck-growth-v1 asset the website decoder rules accept", () => {
    const root = mkdtempSync(join(tmpdir(), "gutcheck-growth-out-"));
    roots.push(root);
    const specPath = join(root, "spec.json");
    writeFileSync(
      specPath,
      JSON.stringify({
        label: "growth-out test crystal",
        rho: 0.12,
        phi: 0.01,
        ggThreshTable: { "01": 3.5, "10": 1, "11": 1, "20": 1, "21": 1, "30": 1, "31": 1 },
        kappa: { default: 0.005, overrides: {} },
        mu: { default: 0.001, overrides: {} },
      }),
    );
    const growthPath = join(root, "growth.bin");
    const recordPath = join(root, "record.json");
    execFileSync(
      process.execPath,
      [
        SCRIPT,
        "--spec-file", specPath,
        "--dims", "48,48,16",
        "--ticks", "300",
        "--seed", "1",
        "--noise", "0",
        "--out-mesh", join(root, "mesh.bin"),
        "--record", recordPath,
        "--growth-out", growthPath,
        "--metrics-every", "1000",
      ],
      { cwd: REPO, stdio: "pipe" },
    );

    const decoded = decodeGrowthV1(readFileSync(growthPath));
    const record = JSON.parse(readFileSync(recordPath, "utf8")) as Record<string, unknown>;
    const header = decoded.header;

    // The asset and the run record describe the same endpoint.
    expect(header.attachedCount).toBe(record.attachedCount);
    expect(header.finalTick).toBe(record.tick);
    expect(header.terminationReason).toBe(record.stopReason);
    const growthSummary = record.growth as Record<string, unknown>;
    expect(growthSummary.eventCount).toBe(header.eventCount);

    // Canonical seed: radius-2 hexagonal plate, 19 sites, all attached at tick 0, first.
    expect(header.seedCount).toBe(19);
    for (let event = 0; event < 19; event++) expect(decoded.attachTicks[event]).toBe(0);

    // Chronological event order, and every non-seed tick within (0, finalTick].
    const finalTick = header.finalTick as number;
    let previous = 0;
    for (let event = 0; event < decoded.attachTicks.length; event++) {
      const tick = decoded.attachTicks[event]!;
      expect(tick).toBeGreaterThanOrEqual(previous);
      expect(tick).toBeLessThanOrEqual(finalTick);
      if (event >= 19) expect(tick).toBeGreaterThan(0);
      previous = tick;
    }

    // Every event index sits inside the declared crop (flat index = k*nx*ny + j*nx + i).
    const crop = header.crop as Record<string, number>;
    const config = header.config as { dims: { nx: number; ny: number; nz: number } };
    const { nx, ny } = config.dims;
    const seen = new Set<number>();
    for (const index of decoded.flatIndices) {
      expect(seen.has(index)).toBe(false);
      seen.add(index);
      const i = index % nx;
      const j = Math.floor(index / nx) % ny;
      const k = Math.floor(index / (nx * ny));
      expect(i).toBeGreaterThanOrEqual(crop.iMin!);
      expect(i).toBeLessThanOrEqual(crop.iMax!);
      expect(j).toBeGreaterThanOrEqual(crop.jMin!);
      expect(j).toBeLessThanOrEqual(crop.jMax!);
      expect(k).toBeGreaterThanOrEqual(crop.kMin!);
      expect(k).toBeLessThanOrEqual(crop.kMax!);
    }
  });
});
