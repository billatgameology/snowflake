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
import { Buffer } from "node:buffer";
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
  PHASE5_GG_DIRECT_CLAMP_DIAGNOSTIC_RATIONALE,
  PHASE5_LK_SWEEP_DIAGNOSTIC_RATIONALE,
  PHASE5_LANE_INDEX_PATH,
  PHASE5_LANE_REPORT_PATH,
  publishPhase5Lane,
  verifyPhase5LaneBundle,
} from "../src/gate5-evidence.ts";
import { PHASE5_FIXTURES } from "../src/phase5-protocol.ts";
import {
  TEST_PHASE5_CHECKPOINT_HOOKS,
  TEST_PHASE5_GG_LEDGER_FIXTURE_ID,
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

  it("reconstructs an interleaved global readback audit from per-fixture artifacts", () => {
    const root = temporaryRoot();
    const capture = passingPhase5Capture();
    const reordered = [...capture.raw.readback.records].reverse();
    for (const [sequence, record] of reordered.entries()) {
      (record as { sequence: number }).sequence = sequence;
      const fixture = capture.fixtures.find(
        (entry) => entry.id === record.fixtureId,
      );
      if (fixture === undefined) throw new Error("missing readback fixture");
      const artifactRecord = (fixture.readback as {
        records: Array<{ sequence: number }>;
      }).records[0];
      if (artifactRecord === undefined) {
        throw new Error("missing fixture readback record");
      }
      artifactRecord.sequence = sequence;
    }
    (capture.raw.readback as unknown as {
      records: typeof reordered;
    }).records = reordered;
    expect(() =>
      publishPhase5Lane({
        canonicalDirectory: join(root, "windows-d3d12"),
        capture,
        sourceHashes: TEST_PHASE5_SOURCE_HASHES,
        verificationHooks: TEST_PHASE5_CHECKPOINT_HOOKS,
      }),
    ).not.toThrow();
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
      scalars: Array<{
        name: string;
        cpu: number;
        gpu: number;
        blocking: boolean;
        rationale: string | null;
        applicability: string;
      }>;
    };
    comparison.scalars[0] = {
      name: "invented.self-attested-scalar",
      cpu: 1,
      gpu: 1,
      blocking: true,
      rationale: null,
      applicability: "measured",
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

  it("rejects an unregistered nonblocking scalar", () => {
    const root = temporaryRoot();
    const capture = passingPhase5Capture();
    const fixture = capture.fixtures.find(
      (entry) => entry.id === "gg-plate-reflecting-48x48x24",
    );
    if (fixture === undefined) throw new Error("missing reflecting G-G fixture");
    const comparison = fixture.comparison as {
      scalars: Array<{
        blocking: boolean;
        rationale: string | null;
      }>;
    };
    comparison.scalars[0].blocking = false;
    comparison.scalars[0].rationale =
      PHASE5_GG_DIRECT_CLAMP_DIAGNOSTIC_RATIONALE;
    expect(() =>
      publishPhase5Lane({
        canonicalDirectory: join(root, "windows-d3d12"),
        capture,
        sourceHashes: TEST_PHASE5_SOURCE_HASHES,
        verificationHooks: TEST_PHASE5_CHECKPOINT_HOOKS,
      }),
    ).toThrow(/scalars\[0\] is invalid/);
  });

  it("rejects the LK sweep rationale on a gate-bearing scalar", () => {
    const root = temporaryRoot();
    const capture = passingPhase5Capture();
    const fixture = capture.fixtures.find(
      (entry) => entry.id === "lk-warm-dirichlet-24x24x18",
    );
    if (fixture === undefined) throw new Error("missing warm LK fixture");
    const comparison = fixture.comparison as {
      scalars: Array<{
        name: string;
        blocking: boolean;
        rationale: string | null;
      }>;
    };
    const residual = comparison.scalars.find(
      (entry) => entry.name === "relaxation.residual",
    );
    if (residual === undefined) throw new Error("missing LK residual scalar");
    residual.blocking = false;
    residual.rationale = PHASE5_LK_SWEEP_DIAGNOSTIC_RATIONALE;
    expect(() =>
      publishPhase5Lane({
        canonicalDirectory: join(root, "windows-d3d12"),
        capture,
        sourceHashes: TEST_PHASE5_SOURCE_HASHES,
        verificationHooks: TEST_PHASE5_CHECKPOINT_HOOKS,
      }),
    ).toThrow(/is invalid/);
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

interface MutableGgLedger {
  policy: Record<string, unknown>;
  cycles: Array<{
    cycle: number;
    cpu: {
      clampDelta: number;
      cumulativeMeter: number;
      tick: number;
      oldBoundaryCount: number;
      boundaryCount: number;
      attachedTotal: number;
      relaxation: Record<string, unknown>;
      surface: Record<string, unknown>;
    };
    gpu: {
      clampDelta: number;
      cumulativeMeter: number;
      tick: number;
      report: Record<string, number>;
    };
  }>;
  clampPathWitness: {
    policy: Record<string, unknown>;
    cases: Array<{
      id: string;
      dims: Record<string, number>;
      cellCount: number;
      shellCellCount: number;
      initialValue: number;
      rho: number;
      observedDeltasBase64: string;
      observedVaporBase64: string;
      report: Record<string, number>;
    }>;
  };
  meterReductionWitness: {
    cellCount: number;
    reductionDispatches: number;
    firstReport: Record<string, number>;
    secondReport: Record<string, number>;
  };
  correctedMassOperands: {
    cpuInitialMass: number;
    gpuInitialMass: number;
    cpuFinalMass: number;
    gpuFinalMass: number;
    cpuFinalMeter: number;
    gpuFinalMeter: number;
  };
}

interface MutableScalar {
  applicability: string;
  name: string;
  cpu: number;
  gpu: number;
}

describe("ADR-0019 G-G Dirichlet corrected-mass ledger", () => {
  function ledgerCapture() {
    const capture = passingPhase5Capture();
    const fixture = capture.fixtures.find(
      (entry) => entry.id === TEST_PHASE5_GG_LEDGER_FIXTURE_ID,
    );
    if (fixture === undefined) {
      throw new Error("missing the frozen G-G Dirichlet fixture");
    }
    const comparison = fixture.comparison as {
      ggDirichletLedger: MutableGgLedger;
      scalars: MutableScalar[];
    };
    return {
      capture,
      ledger: comparison.ggDirichletLedger,
      scalars: comparison.scalars,
    };
  }

  function expectRejected(capture: unknown, pattern: RegExp): void {
    const root = temporaryRoot();
    expect(() =>
      publishPhase5Lane({
        canonicalDirectory: join(root, "windows-d3d12"),
        capture: capture as Parameters<
          typeof publishPhase5Lane
        >[0]["capture"],
        sourceHashes: TEST_PHASE5_SOURCE_HASHES,
        verificationHooks: TEST_PHASE5_CHECKPOINT_HOOKS,
      }),
    ).toThrow(pattern);
  }

  it("publishes the complete registered chronology and both device witnesses", () => {
    const frozen = PHASE5_FIXTURES.find(
      (fixture) => fixture.id === TEST_PHASE5_GG_LEDGER_FIXTURE_ID,
    );
    if (frozen === undefined || frozen.kind !== "gg") {
      throw new Error("missing the frozen G-G Dirichlet fixture");
    }
    expect(frozen.stop).toEqual({ kind: "completed-cycle-cap", value: 128 });
    const root = temporaryRoot();
    const bundle = publish(root);
    // The same graph validator runs on publication and on independent reopening, so the
    // aggregate gate re-derives this ledger from the published bytes.
    expect(
      verifyPhase5LaneBundle(
        bundle.directory,
        TEST_PHASE5_SOURCE_HASHES,
        TEST_PHASE5_CHECKPOINT_HOOKS,
      ).report.gatePass,
    ).toBe(true);
    const published = JSON.parse(
      readFileSync(
        join(
          bundle.directory,
          "fixtures",
          TEST_PHASE5_GG_LEDGER_FIXTURE_ID,
          "comparison.json",
        ),
        "utf8",
      ),
    ) as { ggDirichletLedger: MutableGgLedger };
    const ledger = published.ggDirichletLedger;
    expect(ledger.cycles.length).toBe(128);
    expect(ledger.cycles.at(-1)?.cycle).toBe(128);
    expect(ledger.clampPathWitness.cases.map((entry) => entry.id)).toEqual([
      "clamp-path-positive",
      "clamp-path-negative",
    ]);
    expect(ledger.meterReductionWitness.reductionDispatches).toBe(2);
    expect(ledger.correctedMassOperands.gpuFinalMeter).toBe(
      ledger.cycles.at(-1)?.gpu.cumulativeMeter,
    );
  });

  it("rejects a fixture that omits its ledger", () => {
    const { capture } = ledgerCapture();
    const fixture = capture.fixtures.find(
      (entry) => entry.id === TEST_PHASE5_GG_LEDGER_FIXTURE_ID,
    );
    if (fixture === undefined) throw new Error("missing fixture");
    delete (fixture.comparison as { ggDirichletLedger?: unknown })
      .ggDirichletLedger;
    expectRejected(capture, /comparison keys are invalid/);
  });

  it("rejects a ledger attached to a fixture that must not carry one", () => {
    const { capture, ledger } = ledgerCapture();
    const other = capture.fixtures.find(
      (entry) => entry.id === "gg-plate-reflecting-48x48x24",
    );
    if (other === undefined) throw new Error("missing reflecting G-G fixture");
    (other.comparison as { ggDirichletLedger?: unknown }).ggDirichletLedger =
      structuredClone(ledger);
    expectRejected(capture, /comparison keys are invalid/);
  });

  it("rejects a negative-control roster the runner's own replay does not observe", () => {
    const capture = passingPhase5Capture();
    const roster = (capture.raw as unknown as {
      negativeControls: Array<{ failedCriteria: string[] }>;
    }).negativeControls;
    const bypass = roster.find(
      (entry) => (entry as { id?: string }).id === "NC-TOLERANCE-BYPASS",
    );
    if (bypass === undefined) throw new Error("missing NC-TOLERANCE-BYPASS");
    // The producer asserts the pre-ADR-0022 singleton it never observed.
    bypass.failedCriteria = ["P5-NEGATIVE-CONTROLS"];
    const events = capture.fixtures[0].events as {
      negativeControls: unknown;
    };
    events.negativeControls = structuredClone(roster);
    expectRejected(capture, /roster differs from the runner's own replay/);
  });

  it("rejects declared symmetry state that contradicts the invariant operands", () => {
    const capture = passingPhase5Capture();
    const fixture = capture.fixtures.find(
      (entry) => entry.id === "gg-plate-reflecting-48x48x24",
    );
    if (fixture === undefined) throw new Error("missing reflecting G-G fixture");
    const invariants = (fixture.comparison as {
      invariants: Array<{ name: string; left: unknown; right: unknown }>;
    }).invariants;
    const symmetry = invariants.find((entry) => entry.name === "symmetry.exact");
    if (symmetry === undefined) throw new Error("missing symmetry invariant");
    // A real orbit mismatch in the operands while the declared count still reads zero.
    symmetry.left = 1;
    symmetry.right = 1;
    expectRejected(capture, /symmetryMismatchCount contradicts/);
  });

  it("rejects a declared no-contact flag that contradicts the invariant operands", () => {
    const capture = passingPhase5Capture();
    const fixture = capture.fixtures.find(
      (entry) => entry.id === "diff-small-dirichlet-noise-drift-31x29x21",
    );
    if (fixture === undefined) throw new Error("missing diffusion fixture");
    const invariants = (fixture.comparison as {
      invariants: Array<{ name: string; left: unknown; right: unknown }>;
    }).invariants;
    const contact = invariants.find((entry) => entry.name === "domain.no-contact");
    if (contact === undefined) throw new Error("missing contact invariant");
    contact.left = true;
    contact.right = true;
    expectRejected(capture, /domainContact contradicts/);
  });

  it("rejects a blocking scalar that was never measured on either lane", () => {
    const { capture, scalars } = ledgerCapture();
    const scalar = scalars.find((entry) => entry.name === "metrics.total-mass");
    if (scalar === undefined) throw new Error("missing total mass metric");
    // Before the applicability contract this passed, because null === null.
    (scalar as { cpu: number | null }).cpu = null;
    (scalar as { gpu: number | null }).gpu = null;
    expectRejected(capture, /declared measured without two finite operands/);
  });

  it("rejects an unregistered claim of non-applicability", () => {
    const { capture, scalars } = ledgerCapture();
    const scalar = scalars.find((entry) => entry.name === "metrics.total-mass");
    if (scalar === undefined) throw new Error("missing total mass metric");
    (scalar as { cpu: number | null }).cpu = null;
    (scalar as { gpu: number | null }).gpu = null;
    (scalar as { applicability: string }).applicability = "not-applicable";
    expectRejected(capture, /unregistered non-applicability/);
  });

  it("rejects a registered non-applicable scalar that smuggles in operands", () => {
    const capture = passingPhase5Capture();
    const fixture = capture.fixtures.find(
      (entry) => entry.id === "gg-plate-reflecting-48x48x24",
    );
    if (fixture === undefined) throw new Error("missing reflecting G-G fixture");
    const comparison = fixture.comparison as {
      scalars: Array<{ name: string; cpu: number | null; gpu: number | null }>;
    };
    const scalar = comparison.scalars.find(
      (entry) => entry.name === "ledger.dirichlet-meter",
    );
    if (scalar === undefined) throw new Error("missing dirichlet meter scalar");
    scalar.cpu = 0;
    scalar.gpu = 0;
    expectRejected(capture, /not applicable yet carries operands/);
  });

  it("rejects a scalar that declares no applicability at all", () => {
    const { capture, scalars } = ledgerCapture();
    delete (scalars[0] as { applicability?: string }).applicability;
    expectRejected(capture, /keys are invalid/);
  });

  it("rejects a ledger that does not carry the frozen ADR-0019 policy", () => {
    const { capture, ledger } = ledgerCapture();
    ledger.policy.blockingTolerance = "relaxed-for-this-run";
    expectRejected(capture, /frozen ADR-0019 policy/);
  });

  it("rejects a truncated cycle chronology", () => {
    const { capture, ledger } = ledgerCapture();
    ledger.cycles.pop();
    expectRejected(capture, /all 128 signed cycles/);
  });

  it("rejects a chronology that skips a cycle", () => {
    const { capture, ledger } = ledgerCapture();
    ledger.cycles.splice(63, 1);
    ledger.cycles.push(structuredClone(ledger.cycles[126]));
    expectRejected(capture, /not a contiguous cycle chronology/);
  });

  it("rejects a forged binary64 CPU meter", () => {
    const { capture, ledger } = ledgerCapture();
    for (const cycle of ledger.cycles.slice(64)) {
      cycle.cpu.cumulativeMeter += 1e-9;
    }
    expectRejected(capture, /binary64 CPU meter recurrence/);
  });

  it("rejects a forged persistent binary32 GPU meter", () => {
    const { capture, ledger } = ledgerCapture();
    const cycle = ledger.cycles[100];
    cycle.gpu.cumulativeMeter = Math.fround(cycle.gpu.cumulativeMeter * 1.5);
    cycle.gpu.report.dirichletMeter = cycle.gpu.cumulativeMeter;
    expectRejected(capture, /binary32 GPU meter recurrence/);
  });

  it("rejects a GPU meter that no binary32 accumulator could hold", () => {
    const { capture, ledger } = ledgerCapture();
    const cycle = ledger.cycles[7];
    cycle.gpu.cumulativeMeter = 0.1234567890123;
    cycle.gpu.report.dirichletMeter = cycle.gpu.cumulativeMeter;
    expectRejected(capture, /not an exact binary32 value/);
  });

  it("rejects a CPU clamp delta that its own relaxation report contradicts", () => {
    const { capture, ledger } = ledgerCapture();
    ledger.cycles[12].cpu.relaxation.shellClampDiagnostic = 0;
    expectRejected(capture, /clamp delta differs from its relaxation report/);
  });

  it("rejects per-cycle bookkeeping that the two lanes do not share", () => {
    const { capture, ledger } = ledgerCapture();
    ledger.cycles[42].gpu.report.attachedTotal += 1;
    expectRejected(capture, /cycle bookkeeping disagree/);
  });

  it("rejects a cycle whose device report raised error flags", () => {
    const { capture, ledger } = ledgerCapture();
    ledger.cycles[3].gpu.report.errorFlags = 1;
    expectRejected(capture, /device error flags/);
  });

  it("rejects a clamp-path delta field that omits one shell cell", () => {
    const { capture, ledger } = ledgerCapture();
    const entry = ledger.clampPathWitness.cases[0];
    const deltas = Buffer.from(entry.observedDeltasBase64, "base64");
    deltas.writeFloatLE(0, 3 * 4);
    entry.observedDeltasBase64 = deltas.toString("base64");
    expectRejected(capture, /rho minus destination on the shell/);
  });

  it("rejects a clamp-path vapor field that was not clamped to rho", () => {
    const { capture, ledger } = ledgerCapture();
    const entry = ledger.clampPathWitness.cases[1];
    const vapor = Buffer.from(entry.observedVaporBase64, "base64");
    vapor.writeFloatLE(entry.initialValue, 3 * 4);
    entry.observedVaporBase64 = vapor.toString("base64");
    expectRejected(capture, /clamped vapor field is not the registered clamp/);
  });

  it("rejects a clamp-path reduction the delta field does not produce", () => {
    const { capture, ledger } = ledgerCapture();
    const entry = ledger.clampPathWitness.cases[0];
    entry.report.lastClampDelta = Math.fround(entry.report.lastClampDelta * 2);
    expectRejected(capture, /reduction or first accumulation is not exact/);
  });

  it("rejects a clamp-path case that abandons its registered construction", () => {
    const { capture, ledger } = ledgerCapture();
    ledger.clampPathWitness.cases[1].rho =
      ledger.clampPathWitness.cases[1].initialValue;
    expectRejected(capture, /does not match its registered construction/);
  });

  it("rejects a clamp-path shell count that differs from the registered set", () => {
    const { capture, ledger } = ledgerCapture();
    ledger.clampPathWitness.cases[0].shellCellCount -= 1;
    expectRejected(capture, /shell membership differs from the registered set/);
  });

  it("rejects a meter-reduction witness that does not accumulate persistently", () => {
    const { capture, ledger } = ledgerCapture();
    ledger.meterReductionWitness.secondReport.dirichletMeter =
      ledger.meterReductionWitness.secondReport.lastClampDelta;
    expectRejected(capture, /accumulate persistently in binary32/);
  });

  it("rejects a meter-reduction dispatch inventory that was never planned", () => {
    const { capture, ledger } = ledgerCapture();
    ledger.meterReductionWitness.reductionDispatches += 1;
    expectRejected(capture, /dispatch inventory differs from the planned reduction/);
  });

  it("rejects final meters that the reconstructed chronology does not reach", () => {
    const { capture, ledger, scalars } = ledgerCapture();
    const shifted = ledger.correctedMassOperands.cpuFinalMeter + 1e-6;
    ledger.correctedMassOperands.cpuFinalMeter = shifted;
    const scalar = scalars.find((entry) => entry.name === "ledger.dirichlet-meter");
    if (scalar === undefined) throw new Error("missing meter scalar");
    scalar.cpu = shifted;
    expectRejected(capture, /differ from the reconstructed cycle chronology/);
  });

  it("rejects a ledger whose operands the published science scalars contradict", () => {
    const { capture, ledger, scalars } = ledgerCapture();
    const scalar = scalars.find((entry) => entry.name === "ledger.total-mass-bd");
    if (scalar === undefined) throw new Error("missing total mass scalar");
    scalar.cpu = ledger.correctedMassOperands.cpuFinalMass + 1e-6;
    scalar.gpu = ledger.correctedMassOperands.gpuFinalMass + 1e-6;
    expectRejected(capture, /differ from the fixture's published science scalars/);
  });

  it("rejects a within-lane corrected mass outside the frozen mixed-scalar bound", () => {
    const { capture, ledger, scalars } = ledgerCapture();
    const inflated = ledger.correctedMassOperands.cpuFinalMass + 1;
    ledger.correctedMassOperands.cpuFinalMass = inflated;
    const scalar = scalars.find((entry) => entry.name === "ledger.total-mass-bd");
    if (scalar === undefined) throw new Error("missing total mass scalar");
    scalar.cpu = inflated;
    expectRejected(capture, /CPU corrected-mass invariant exceeds/);
  });

  it("rejects a cross-lane corrected-mass disagreement", () => {
    const { capture, ledger, scalars } = ledgerCapture();
    const operands = ledger.correctedMassOperands;
    operands.gpuInitialMass += 1;
    operands.gpuFinalMass += 1;
    const scalar = scalars.find((entry) => entry.name === "ledger.total-mass-bd");
    if (scalar === undefined) throw new Error("missing total mass scalar");
    scalar.gpu = operands.gpuFinalMass;
    expectRejected(capture, /cross-lane corrected-mass invariant exceeds/);
  });
});
