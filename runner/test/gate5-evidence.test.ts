import {
  existsSync,
  linkSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, describe, expect, it } from "vitest";
import {
  domainCenter,
  encodeCheckpoint,
  encodeLKCheckpoint,
  GG_PRESETS,
} from "@vcc/core";
import {
  derivePhase5CheckpointVerification,
  PHASE5_LANE_INDEX_PATH,
  PHASE5_LANE_REPORT_PATH,
  publishPhase5Lane,
  verifyPhase5LaneBundle,
} from "../src/gate5-evidence.ts";
import { PHASE5_FIXTURES } from "../src/phase5-protocol.ts";
import {
  TEST_PHASE5_CHECKPOINT_HOOKS,
  TEST_PHASE5_SOURCE_HASHES,
  passingPhase5Capture,
} from "./phase5-test-fixtures.ts";

const roots: string[] = [];

function temporaryRoot(): string {
  const root = mkdtempSync(join(tmpdir(), "vcc-gate5-evidence-"));
  roots.push(root);
  return root;
}

function publish(root: string) {
  return publishPhase5Lane({
    canonicalDirectory: join(root, "windows-d3d12"),
    capture: passingPhase5Capture(),
    sourceHashes: TEST_PHASE5_SOURCE_HASHES,
    attemptId: "test-attempt",
    verificationHooks: TEST_PHASE5_CHECKPOINT_HOOKS,
  });
}

afterEach(() => {
  for (const root of roots.splice(0)) {
    if (existsSync(root)) rmSync(root, { recursive: true, force: true });
  }
});

describe("Phase 5 lane evidence publication", () => {
  it("publishes and independently reopens the complete indexed graph", () => {
    const root = temporaryRoot();
    const bundle = publish(root);
    const reopened = verifyPhase5LaneBundle(
      bundle.directory,
      TEST_PHASE5_SOURCE_HASHES,
      TEST_PHASE5_CHECKPOINT_HOOKS,
    );
    expect(reopened.report.gatePass).toBe(true);
    expect(reopened.index.publication).toBe("complete");
    expect(reopened.manifest.sourceHashes).toEqual(TEST_PHASE5_SOURCE_HASHES);
    // Manifest + report + three terminal payloads + seven files for each of ten fixtures.
    expect(reopened.index.artifacts.length).toBe(75);
    expect(readFileSync(join(bundle.directory, PHASE5_LANE_INDEX_PATH)).at(0))
      .toBe("{".charCodeAt(0));
  });

  it("uses the real core decoders when no test-only checkpoint seam is supplied", () => {
    const root = temporaryRoot();
    const canonicalDirectory = join(root, "windows-d3d12");
    expect(() =>
      publishPhase5Lane({
        canonicalDirectory,
        capture: passingPhase5Capture(),
        sourceHashes: TEST_PHASE5_SOURCE_HASHES,
        attemptId: "real-decode",
      }),
    ).toThrow();
    expect(existsSync(canonicalDirectory)).toBe(false);
  });

  it("rejects a browser capture that preclaims publisher-owned verification", () => {
    const root = temporaryRoot();
    const capture = passingPhase5Capture();
    (capture.raw as { publicationVerified: boolean }).publicationVerified = true;
    expect(() =>
      publishPhase5Lane({
        canonicalDirectory: join(root, "windows-d3d12"),
        capture,
        sourceHashes: TEST_PHASE5_SOURCE_HASHES,
        verificationHooks: TEST_PHASE5_CHECKPOINT_HOOKS,
      }),
    ).toThrow(/cannot preclaim/);
  });

  it("rejects a fixture artifact that disagrees with its raw measurement", () => {
    const root = temporaryRoot();
    const capture = passingPhase5Capture();
    const comparison = capture.fixtures[0].comparison as {
      fields: Array<{ maxAbs: number }>;
    };
    comparison.fields[0].maxAbs = 1;
    expect(() =>
      publishPhase5Lane({
        canonicalDirectory: join(root, "windows-d3d12"),
        capture,
        sourceHashes: TEST_PHASE5_SOURCE_HASHES,
        verificationHooks: TEST_PHASE5_CHECKPOINT_HOOKS,
      }),
    ).toThrow(/failure counts differ/);
  });

  it("rejects timing evidence that omits a recorded submission", () => {
    const root = temporaryRoot();
    const capture = passingPhase5Capture();
    const timing = capture.fixtures[0].timing as {
      submissionSamples: unknown[];
    };
    timing.submissionSamples.pop();
    expect(() =>
      publishPhase5Lane({
        canonicalDirectory: join(root, "windows-d3d12"),
        capture,
        sourceHashes: TEST_PHASE5_SOURCE_HASHES,
        verificationHooks: TEST_PHASE5_CHECKPOINT_HOOKS,
      }),
    ).toThrow(/timing artifacts differ/);
  });

  it("rejects an invented scalar even when CPU and GPU agree", () => {
    const root = temporaryRoot();
    const capture = passingPhase5Capture();
    const fixture = capture.fixtures.find((entry) => entry.id.startsWith("gg-"));
    if (fixture === undefined) throw new Error("missing G-G fixture");
    const comparison = fixture.comparison as {
      scalars: Array<{ name: string; cpu: number; gpu: number }>;
    };
    comparison.scalars[0] = {
      name: "invented.self-attested-scalar",
      cpu: 1,
      gpu: 1,
    };
    expect(() =>
      publishPhase5Lane({
        canonicalDirectory: join(root, "windows-d3d12"),
        capture,
        sourceHashes: TEST_PHASE5_SOURCE_HASHES,
        verificationHooks: TEST_PHASE5_CHECKPOINT_HOOKS,
      }),
    ).toThrow(/scalar inventory differs/);
  });

  it("rejects uninterpreted or incomplete event records", () => {
    const root = temporaryRoot();
    const capture = passingPhase5Capture();
    const events = capture.fixtures[0].events as {
      records: Array<{
        kind: string;
        sequence: number;
        cpu: unknown;
        gpu: unknown;
      }>;
    };
    events.records[0] = {
      kind: "invented-event",
      sequence: 0,
      cpu: { value: "same" },
      gpu: { value: "same" },
    };
    expect(() =>
      publishPhase5Lane({
        canonicalDirectory: join(root, "windows-d3d12"),
        capture,
        sourceHashes: TEST_PHASE5_SOURCE_HASHES,
        verificationHooks: TEST_PHASE5_CHECKPOINT_HOOKS,
      }),
    ).toThrow(/event record inventory differs/);
  });

  it("rejects UTF-8 BOMs in terminal evidence", () => {
    const root = temporaryRoot();
    const capture = passingPhase5Capture();
    (capture as { stdout: Uint8Array }).stdout = new Uint8Array([
      0xef,
      0xbb,
      0xbf,
      ...capture.stdout,
    ]);
    expect(() =>
      publishPhase5Lane({
        canonicalDirectory: join(root, "windows-d3d12"),
        capture,
        sourceHashes: TEST_PHASE5_SOURCE_HASHES,
        verificationHooks: TEST_PHASE5_CHECKPOINT_HOOKS,
      }),
    ).toThrow(/must not contain a UTF-8 BOM/);
  });

  it("rejects identical checkpoint metadata that differs from its frozen fixture", () => {
    const fixture = PHASE5_FIXTURES.find(
      (candidate) => candidate.id === "layout-noncubic-box-17x19x11",
    );
    if (fixture === undefined || !fixture.blocking || fixture.kind !== "layout") {
      throw new Error("missing layout fixture");
    }
    const length = fixture.dims.nx * fixture.dims.ny * fixture.dims.nz;
    const bytes = encodeCheckpoint({
      dims: fixture.dims,
      tick: 0,
      rngSeed: fixture.rngSeed + 1,
      noiseEpsilon: fixture.noiseEpsilon,
      farField: "reflecting",
      domain: fixture.domain,
      params: GG_PRESETS.plate,
      a: new Uint8Array(length),
      b: new Float64Array(length),
      d: new Float64Array(length),
      center: domainCenter(fixture.dims),
    }, null);
    const derived = derivePhase5CheckpointVerification(fixture, bytes, bytes);
    expect(derived.checkpoint.occupancyMismatchCount).toBe(0);
    expect(derived.checkpoint.metadataMismatchCount).toBe(1);
  });

  it("authenticates LK controls exactly while leaving physical time to scalar tolerance", () => {
    const fixture = PHASE5_FIXTURES.find(
      (candidate) => candidate.id === "lk-warm-dirichlet-24x24x18",
    );
    if (fixture === undefined || !fixture.blocking || fixture.kind !== "lk") {
      throw new Error("missing warm LK fixture");
    }
    const length = fixture.dims.nx * fixture.dims.ny * fixture.dims.nz;
    const base = {
      surfacePolicy: fixture.surfacePolicy,
      dims: fixture.dims,
      tick: Number(fixture.stop.value),
      rngSeed: fixture.rngSeed,
      noiseEpsilon: fixture.noiseEpsilon,
      domain: fixture.domain,
      center: domainCenter(fixture.dims),
      tempC: fixture.tempC,
      sigmaInfinity: fixture.sigmaInfinity,
      dxUm: fixture.dxUm,
      pressurePa: fixture.pressurePa,
      paramSet: fixture.paramSet,
      cflFill: fixture.cflFill,
      relaxTol: fixture.relaxTol,
      divTol: fixture.divTol,
      relaxMaxSweeps: fixture.relaxMaxSweeps,
      farField: fixture.farField,
      a: new Uint8Array(length),
      f: new Float64Array(length),
      sigma: new Float64Array(length),
    } as const;
    const cpu = encodeLKCheckpoint({ ...base, simTimeSeconds: 1 });
    const gpu = encodeLKCheckpoint({ ...base, simTimeSeconds: 1.00001 });
    expect(
      derivePhase5CheckpointVerification(fixture, cpu, gpu).checkpoint
        .metadataMismatchCount,
    ).toBe(0);
    const shifted = encodeLKCheckpoint({
      ...base,
      simTimeSeconds: 1.00001,
      tempC: fixture.tempC + 1,
    });
    expect(
      derivePhase5CheckpointVerification(fixture, cpu, shifted).checkpoint
        .metadataMismatchCount,
    ).toBe(1);
  });

  it("rejects an indexed artifact byte mutation after publication", () => {
    const bundle = publish(temporaryRoot());
    writeFileSync(join(bundle.directory, "stdout.log"), "changed\n");
    expect(() =>
      verifyPhase5LaneBundle(
        bundle.directory,
        TEST_PHASE5_SOURCE_HASHES,
        TEST_PHASE5_CHECKPOINT_HOOKS,
      ),
    ).toThrow(/metadata mismatch|hash mismatch|immutable|differs/);
  });

  it("rejects noncanonical JSON even if a caller edits a JSON artifact directly", () => {
    const bundle = publish(temporaryRoot());
    const reportPath = join(bundle.directory, PHASE5_LANE_REPORT_PATH);
    const parsed = JSON.parse(readFileSync(reportPath, "utf8")) as unknown;
    writeFileSync(reportPath, JSON.stringify(parsed, null, 2));
    expect(() =>
      verifyPhase5LaneBundle(
        bundle.directory,
        TEST_PHASE5_SOURCE_HASHES,
        TEST_PHASE5_CHECKPOINT_HOOKS,
      ),
    ).toThrow();
  });

  it("rejects unindexed extra files", () => {
    const bundle = publish(temporaryRoot());
    writeFileSync(join(bundle.directory, "extra.txt"), "extra");
    expect(() =>
      verifyPhase5LaneBundle(
        bundle.directory,
        TEST_PHASE5_SOURCE_HASHES,
        TEST_PHASE5_CHECKPOINT_HOOKS,
      ),
    ).toThrow(/file set differs/);
  });

  it("rejects a coherent index kind shift against the frozen artifact graph", () => {
    const bundle = publish(temporaryRoot());
    const indexPath = join(bundle.directory, PHASE5_LANE_INDEX_PATH);
    const index = JSON.parse(readFileSync(indexPath, "utf8")) as {
      artifacts: Array<{ path: string; kind: string }>;
    };
    const target = index.artifacts.find((entry) => entry.path === "stdout.log");
    if (target === undefined) throw new Error("missing stdout artifact");
    target.kind = "invented-log-kind";
    writeFileSync(indexPath, `${JSON.stringify(index)}\n`);
    expect(() =>
      verifyPhase5LaneBundle(
        bundle.directory,
        TEST_PHASE5_SOURCE_HASHES,
        TEST_PHASE5_CHECKPOINT_HOOKS,
      ),
    ).toThrow(/artifact graph|kind|descriptor|differs/);
  });

  it("rejects hard-linked artifacts and removes its private failed attempt", () => {
    const root = temporaryRoot();
    const canonicalDirectory = join(root, "windows-d3d12");
    let linked = false;
    expect(() =>
      publishPhase5Lane({
        canonicalDirectory,
        capture: passingPhase5Capture(),
        sourceHashes: TEST_PHASE5_SOURCE_HASHES,
        attemptId: "hard-link",
        verificationHooks: TEST_PHASE5_CHECKPOINT_HOOKS,
        hooks: {
          afterArtifactWrite: (path, stagingDirectory) => {
            if (!linked && path === "stdout.log") {
              linkSync(
                join(stagingDirectory, path),
                join(stagingDirectory, "stdout-alias.log"),
              );
              linked = true;
            }
          },
        },
      }),
    ).toThrow();
    expect(linked).toBe(true);
    expect(existsSync(canonicalDirectory)).toBe(false);
    expect(existsSync(join(root, ".windows-d3d12.attempt-hard-link"))).toBe(false);
  });

  it("detects a staging mutation before rename and leaves no canonical lane", () => {
    const root = temporaryRoot();
    const canonicalDirectory = join(root, "windows-d3d12");
    expect(() =>
      publishPhase5Lane({
        canonicalDirectory,
        capture: passingPhase5Capture(),
        sourceHashes: TEST_PHASE5_SOURCE_HASHES,
        attemptId: "mutated",
        verificationHooks: TEST_PHASE5_CHECKPOINT_HOOKS,
        hooks: {
          beforeRename: (stagingDirectory) => {
            writeFileSync(join(stagingDirectory, "stderr.log"), "late mutation\n");
          },
        },
      }),
    ).toThrow(/immutable root changed|metadata mismatch|hash mismatch/);
    expect(existsSync(canonicalDirectory)).toBe(false);
  });

  it("refuses to delete a replacement that appears at the private staging path", () => {
    const root = temporaryRoot();
    const canonicalDirectory = join(root, "windows-d3d12");
    const stagingDirectory = join(root, ".windows-d3d12.attempt-replaced");
    const movedDirectory = join(root, "moved-owned-attempt");
    expect(() =>
      publishPhase5Lane({
        canonicalDirectory,
        capture: passingPhase5Capture(),
        sourceHashes: TEST_PHASE5_SOURCE_HASHES,
        attemptId: "replaced",
        verificationHooks: TEST_PHASE5_CHECKPOINT_HOOKS,
        hooks: {
          beforeRename: (staging) => {
            renameSync(staging, movedDirectory);
            mkdirSync(staging);
            writeFileSync(join(staging, "replacement-owner.txt"), "keep");
          },
        },
      }),
    ).toThrow(/safe cleanup refused a replaced path/);
    expect(readFileSync(join(stagingDirectory, "replacement-owner.txt"), "utf8"))
      .toBe("keep");
    expect(existsSync(movedDirectory)).toBe(true);
    expect(existsSync(canonicalDirectory)).toBe(false);
  });

  it("never overwrites an existing canonical directory", () => {
    const root = temporaryRoot();
    const canonicalDirectory = join(root, "windows-d3d12");
    mkdirSync(canonicalDirectory);
    writeFileSync(join(canonicalDirectory, "owner.txt"), "keep");
    expect(() =>
      publishPhase5Lane({
        canonicalDirectory,
        capture: passingPhase5Capture(),
        sourceHashes: TEST_PHASE5_SOURCE_HASHES,
        verificationHooks: TEST_PHASE5_CHECKPOINT_HOOKS,
      }),
    ).toThrow(/already exists/);
    expect(readFileSync(join(canonicalDirectory, "owner.txt"), "utf8")).toBe("keep");
  });
});
