import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { GG_PRESETS, domainCenter, type Dims } from "@vcc/core";
import { GGSolver } from "@vcc/solver-cpu";
import { afterAll, describe, expect, it } from "vitest";

import { decodeGrowthAsset, type GrowthSourceProvenance } from "../../app/src/gutcheck-growth-format.ts";
import {
  assertGrowthAttachmentBatch,
  collectGrowthReplay,
  parseGrowthBakeCli,
  parseLegacyGrowthManifest,
  publishGrowthAssetNoClobber,
  sha256Hex,
  verifyGrowthEventOccupancy,
  type GrowthReplaySpec,
  type LegacyGrowthChecks,
} from "../../scripts/gutcheck-bake-growth.ts";

const REPOSITORY_ROOT = resolve(import.meta.dirname, "..", "..");
const SCRIPT = join(REPOSITORY_ROOT, "scripts", "gutcheck-bake-growth.ts");
const DIMS = { nx: 20, ny: 20, nz: 12 } as const;
const TICK_CAP = 200;
const SNAPSHOT_TICKS = [0, 50, 100, 200] as const;
const temporaryRoots: string[] = [];

afterAll(() => {
  for (const root of temporaryRoots) rmSync(root, { recursive: true, force: true });
});

function makeTemporaryRoot(label: string): string {
  const root = mkdtempSync(join(tmpdir(), `gutcheck-growth-${label}-`));
  temporaryRoots.push(root);
  return root;
}

interface IndependentTrace {
  readonly arrivalTick: Int32Array;
  readonly snapshots: ReadonlyMap<number, Uint8Array>;
  readonly frameCounts: ReadonlyMap<number, number>;
  readonly finalCount: number;
  readonly occupancySha256: string;
}

let cachedTrace: IndependentTrace | null = null;

/** Independent event reconstruction by diffing a before/after a-field, not lastAttached. */
function independentTrace(): IndependentTrace {
  if (cachedTrace !== null) return cachedTrace;
  const solver = new GGSolver({
    dims: DIMS,
    params: GG_PRESETS.plate,
    rngSeed: 1,
    noiseEpsilon: 0,
    domain: "hexPrism",
    farField: "reflecting",
    seedRadius: 2,
    seedThickness: 1,
    center: domainCenter(DIMS),
  });
  const arrivalTick = new Int32Array(solver.a.length);
  arrivalTick.fill(-1);
  for (let index = 0; index < solver.a.length; index++) {
    if (solver.a[index] === 1) arrivalTick[index] = 0;
  }
  const snapshots = new Map<number, Uint8Array>([[0, solver.a.slice()]]);
  const frameCounts = new Map<number, number>([[0, solver.attachedCount]]);
  for (let tick = 1; tick <= TICK_CAP; tick++) {
    const before = solver.a.slice();
    const attachedBefore = solver.attachedCount;
    solver.step();
    let attachedDelta = 0;
    for (let index = 0; index < solver.a.length; index++) {
      const prior = before[index]!;
      const current = solver.a[index]!;
      if ((prior !== 0 && prior !== 1) || (current !== 0 && current !== 1)) {
        throw new Error(`a-field left binary state at tick ${tick}, index ${index}: ${prior}->${current}`);
      }
      if (prior === current) continue;
      if (prior !== 0 || current !== 1) {
        throw new Error(`a-field changed other than 0->1 at tick ${tick}, index ${index}: ${prior}->${current}`);
      }
      expect(arrivalTick[index]).toBe(-1);
      arrivalTick[index] = tick;
      attachedDelta++;
    }
    expect(attachedDelta).toBe(solver.attachedCount - attachedBefore);
    if ((SNAPSHOT_TICKS as readonly number[]).includes(tick)) {
      snapshots.set(tick, solver.a.slice());
      frameCounts.set(tick, solver.attachedCount);
    }
  }
  cachedTrace = {
    arrivalTick,
    snapshots,
    frameCounts,
    finalCount: solver.attachedCount,
    occupancySha256: createHash("sha256").update(solver.a).digest("hex"),
  };
  return cachedTrace;
}

const SOURCE: GrowthSourceProvenance = {
  label: "growth baker unit-test provenance",
  command: { argv: ["unit-test"] },
  runtime: { node: process.version },
  git: { head: "0123456789abcdef", dirty: false },
};

function replaySpec(overrides: Partial<GrowthReplaySpec> = {}): GrowthReplaySpec {
  return {
    preset: "plate",
    dims: DIMS,
    tickCap: TICK_CAP,
    domain: "hexPrism",
    rngSeed: 1,
    noiseEpsilon: 0,
    padding: 2,
    source: SOURCE,
    ...overrides,
  };
}

function legacyValue(trace: IndependentTrace): Record<string, unknown> {
  return {
    format: "gutcheck-anim-v1",
    complete: true,
    config: {
      preset: "plate",
      dims: DIMS,
      domain: "hexPrism",
      ticks: TICK_CAP,
      every: 50,
      seed: 1,
      noise: 0,
      extraction: { spacing: 0.8, sigma: 0.45, iso: 0.5, margin: 4, normalDelta: 3 },
    },
    frames: SNAPSHOT_TICKS.map((tick) => ({
      file: `mesh-t${String(tick).padStart(6, "0")}.bin`,
      tick,
      attachedCount: trace.frameCounts.get(tick),
    })),
  };
}

function parseLegacy(value: unknown): LegacyGrowthChecks {
  return parseLegacyGrowthManifest(value, {
    preset: "plate",
    dims: DIMS,
    tickCap: TICK_CAP,
    domain: "hexPrism",
    rngSeed: 1,
    noiseEpsilon: 0,
  });
}

describe("exact G-G attachment replay", () => {
  it("matches exact per-index ticks and revealed occupancy at several ticks", () => {
    const trace = independentTrace();
    expect(trace.finalCount).toBe(61); // 19-site seed plus 42 post-seed attachments.
    const result = collectGrowthReplay(
      replaySpec({
        legacyChecks: parseLegacy(legacyValue(trace)),
        expectedAttachedCount: trace.finalCount,
        expectedOccupancySha256: trace.occupancySha256,
      }),
    );
    const decoded = decodeGrowthAsset(result.bytes);

    expect(decoded.header.attachedCount).toBe(trace.finalCount);
    expect(decoded.header.eventCount).toBe(trace.finalCount);
    expect(decoded.header.seedCount).toBe(19);
    expect(decoded.header.config.center).toEqual(domainCenter(DIMS));
    expect(decoded.header.config.params.kappa[0]).toBeNull();
    expect(decoded.header.config.params.mu[0]).toBeNull();
    expect(decoded.header.config.params.ggThreshBeta[0]).toBeNull();
    expect(result.finalOccupancySha256).toBe(trace.occupancySha256);

    const encodedArrival = new Int32Array(trace.arrivalTick.length);
    encodedArrival.fill(-1);
    for (let event = 0; event < decoded.header.eventCount; event++) {
      const index = decoded.flatIndices[event]!;
      const tick = decoded.attachTicks[event]!;
      expect(encodedArrival[index]).toBe(-1);
      encodedArrival[index] = tick;
      expect(tick).toBe(trace.arrivalTick[index]);
    }
    expect(encodedArrival).toEqual(trace.arrivalTick);

    for (const tick of SNAPSHOT_TICKS) {
      const revealed = new Uint8Array(trace.arrivalTick.length);
      for (let event = 0; event < decoded.header.eventCount; event++) {
        if (decoded.attachTicks[event]! <= tick) revealed[decoded.flatIndices[event]!] = 1;
      }
      expect(revealed).toEqual(trace.snapshots.get(tick));
    }
  });

  it("emits byte-identical output for the same replay and provenance", () => {
    const first = collectGrowthReplay(replaySpec());
    const second = collectGrowthReplay(replaySpec());
    expect(second.bytes).toEqual(first.bytes);
    expect(sha256Hex(second.bytes)).toBe(sha256Hex(first.bytes));
  });

  it("fails at the exact legacy frame whose attached count differs", () => {
    const trace = independentTrace();
    const value = legacyValue(trace);
    const frames = value["frames"] as Array<Record<string, unknown>>;
    frames[2]!["attachedCount"] = (frames[2]!["attachedCount"] as number) + 1;
    expect(() => collectGrowthReplay(replaySpec({ legacyChecks: parseLegacy(value) }))).toThrow(
      /legacy attached-count mismatch at tick 100/,
    );
  });

  it("rejects independently supplied endpoint count and occupancy hash mismatches", () => {
    const trace = independentTrace();
    expect(() =>
      collectGrowthReplay(replaySpec({ expectedAttachedCount: trace.finalCount + 1 })),
    ).toThrow(/final attached-count mismatch/);
    const wrongSha256 = `${trace.occupancySha256.slice(0, -1)}${
      trace.occupancySha256.endsWith("0") ? "1" : "0"
    }`;
    expect(() =>
      collectGrowthReplay(replaySpec({ expectedOccupancySha256: wrongSha256 })),
    ).toThrow(/final occupancy SHA-256 mismatch/);
  });

  it("rejects a same-count event set that reconstructs the wrong final occupancy", () => {
    const solverOccupancy = Uint8Array.from([0, 1, 0, 1, 0]);
    expect(() => verifyGrowthEventOccupancy(solverOccupancy, Uint32Array.from([1, 2]))).toThrow(
      /event-derived final occupancy SHA-256.*differs from solver/,
    );
  });

  it("requires every lastAttached batch length to equal the attached-count delta", () => {
    expect(() => assertGrowthAttachmentBatch(7, 10, 12, Uint32Array.of(4))).toThrow(
      /lastAttached length 1 differs from attached-count delta 2 at tick 7/,
    );
    expect(() => assertGrowthAttachmentBatch(7, 12, 11, Uint32Array.of())).toThrow(
      /attached count decreased/,
    );
    expect(() => assertGrowthAttachmentBatch(7, 10, 12, Uint32Array.of(4, 9))).not.toThrow();
  });
});

describe("no-clobber publication", () => {
  it("publishes with a hard-link handoff, preserves an existing target, and cleans temporaries", () => {
    const root = makeTemporaryRoot("publish");
    const output = join(root, "growth.bin");
    const first = Uint8Array.from([1, 2, 3, 4]);
    expect(publishGrowthAssetNoClobber(output, first)).toBe(resolve(output));
    expect(new Uint8Array(readFileSync(output))).toEqual(first);

    expect(() => publishGrowthAssetNoClobber(output, Uint8Array.from([9, 9]))).toThrow();
    expect(new Uint8Array(readFileSync(output))).toEqual(first);
    expect(readdirSync(root).filter((name) => name.includes("gutcheck-growth-tmp"))).toEqual([]);
  });

  it("does not replace a target that existed before publication", () => {
    const root = makeTemporaryRoot("existing");
    const output = join(root, "growth.bin");
    writeFileSync(output, "maker-owned");
    expect(() => publishGrowthAssetNoClobber(output, Uint8Array.from([7]))).toThrow();
    expect(readFileSync(output, "utf8")).toBe("maker-owned");
    expect(readdirSync(root).filter((name) => name.includes("gutcheck-growth-tmp"))).toEqual([]);
  });
});

describe("growth baker CLI", () => {
  const validArgs = [
    "--preset",
    "plate",
    "--dims",
    "20,20,12",
    "--ticks",
    "200",
    "--out",
    "growth.bin",
  ] as const;

  it("requires the four run-defining options and rejects ambiguous input", () => {
    expect(parseGrowthBakeCli(validArgs)).toMatchObject({
      preset: "plate",
      dims: DIMS,
      tickCap: 200,
      outputPath: "growth.bin",
      domain: "hexPrism",
      rngSeed: 1,
      noiseEpsilon: 0,
      padding: 2,
      progressEvery: 1000,
    });
    for (const required of ["--preset", "--dims", "--ticks", "--out"]) {
      const index = (validArgs as readonly string[]).indexOf(required);
      const without = [...validArgs.slice(0, index), ...validArgs.slice(index + 2)];
      expect(() => parseGrowthBakeCli(without)).toThrow(new RegExp(`${required} is required`));
    }
    expect(() => parseGrowthBakeCli([...validArgs, "--ticks", "201"])).toThrow(/duplicate option/);
    expect(() => parseGrowthBakeCli([...validArgs, "--noise", "NaN"])).toThrow(/--noise/);
    expect(() => parseGrowthBakeCli([...validArgs, "--progress", "-1"])).toThrow(/--progress/);
    const maxTickArgs: string[] = [...validArgs];
    maxTickArgs[maxTickArgs.indexOf("200")] = "4294967295";
    expect(() => parseGrowthBakeCli(maxTickArgs)).toThrow(/--ticks/);
    expect(() => parseGrowthBakeCli([...validArgs, "--unexpected", "1"])).toThrow(/unknown option/);
  });

  it("executes through the guarded entry point and records command, runtime, and git provenance", () => {
    const root = makeTemporaryRoot("cli");
    const output = join(root, "smoke.bin");
    const child = spawnSync(
      process.execPath,
      [
        SCRIPT,
        "--preset",
        "plate",
        "--dims",
        "12,12,8",
        "--ticks",
        "1",
        "--out",
        output,
        "--progress",
        "0",
      ],
      { cwd: REPOSITORY_ROOT, encoding: "utf8" },
    );
    expect(child.status, child.stderr).toBe(0);
    const source = decodeGrowthAsset(readFileSync(output)).header.source as Record<string, unknown>;
    expect(source["command"]).toMatchObject({ cwd: REPOSITORY_ROOT });
    expect(source["runtime"]).toMatchObject({ node: process.version });
    expect(source["git"]).toMatchObject({ repositoryRoot: REPOSITORY_ROOT });
  });

  it("returns a nonzero CLI result without creating output when required flags are absent", () => {
    const root = makeTemporaryRoot("invalid-cli");
    const output = join(root, "must-not-exist.bin");
    const child = spawnSync(process.execPath, [SCRIPT, "--out", output], {
      cwd: REPOSITORY_ROOT,
      encoding: "utf8",
    });
    expect(child.status).toBe(1);
    expect(child.stderr).toContain("--preset is required");
    expect(() => readFileSync(output)).toThrow();
  });
});
