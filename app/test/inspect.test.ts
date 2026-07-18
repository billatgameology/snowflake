// Evidence-artifact inspection (V4-2): strict decode, view-only semantics, honest evidence
// status, verified evidence context, and named failure surfacing. Fixtures are built
// independently with the @vcc/core ENCODERS and hand-built states; expectations are
// recomputed in the tests with @vcc/core metric functions and GGSolver's own wall mask.

import { describe, expect, it } from "vitest";
import {
  GG_PRESETS,
  aspectRatio,
  branchCount,
  cappedColumnProfile,
  centerRimDepletion,
  computeMetrics,
  crossSectionHollowness,
  encodeCheckpoint,
  encodeLKCheckpoint,
  hexDistance,
  idx,
  latticeBBox,
  latticeExtents,
  sealedVoidFraction,
  type Dims,
  type LKRunState,
  type SolverState,
} from "@vcc/core";
import { GGSolver } from "@vcc/solver-cpu";
import {
  detectCheckpointOperator,
  inspectCheckpointBytes,
  reconstructWall,
  type ArtifactEvidenceContext,
} from "../src/inspect.ts";
import { sha256Hex } from "../src/sha256.ts";

const DIMS: Dims = { nx: 10, ny: 10, nz: 10 };
const CENTER: readonly [number, number, number] = [5, 5, 5];
// hexPrism active region at these dims/center: radius min(5,4,5,4)=4, halfZ min(5,4)=4.
const RADIUS = 4;
const HALF_Z = 4;

function activeCell(i: number, j: number, k: number): boolean {
  return (
    hexDistance(i - CENTER[0], j - CENTER[1]) <= RADIUS && Math.abs(k - CENTER[2]) <= HALF_Z
  );
}

function ggFixtureState(): SolverState {
  const n = DIMS.nx * DIMS.ny * DIMS.nz;
  const a = new Uint8Array(n);
  const b = new Float64Array(n);
  const d = new Float64Array(n);
  for (let k = 0; k < DIMS.nz; k++) {
    for (let j = 0; j < DIMS.ny; j++) {
      for (let i = 0; i < DIMS.nx; i++) {
        if (!activeCell(i, j, k)) continue;
        const x = idx(DIMS, i, j, k);
        const dist = hexDistance(i - CENTER[0], j - CENTER[1]);
        if (k === CENTER[2] && dist <= 2) {
          a[x] = 1;
          b[x] = 1;
        } else {
          d[x] = 0.02 + 0.01 * dist; // asymmetric-in-radius vapor for a nontrivial depletion
        }
      }
    }
  }
  return {
    dims: DIMS,
    tick: 77,
    rngSeed: 42,
    noiseEpsilon: 0,
    farField: "reflecting",
    domain: "hexPrism",
    params: GG_PRESETS.plate,
    a,
    b,
    d,
    center: CENTER,
  };
}

function ggFixtureBytes(): Uint8Array {
  const state = ggFixtureState();
  const metrics = computeMetrics(state.a, state.b, state.d, DIMS, CENTER, state.tick);
  return encodeCheckpoint(state, metrics);
}

function lkFixtureState(): LKRunState {
  const n = DIMS.nx * DIMS.ny * DIMS.nz;
  const a = new Uint8Array(n);
  const f = new Float64Array(n);
  const sigma = new Float64Array(n);
  for (let k = 0; k < DIMS.nz; k++) {
    for (let j = 0; j < DIMS.ny; j++) {
      for (let i = 0; i < DIMS.nx; i++) {
        if (!activeCell(i, j, k)) continue;
        const x = idx(DIMS, i, j, k);
        const dist = hexDistance(i - CENTER[0], j - CENTER[1]);
        if (k === CENTER[2] && dist <= 1) {
          a[x] = 1;
          f[x] = 1; // attached: f=1, sigma=0 (codec contract)
        } else {
          sigma[x] = 0.0005 + 0.0002 * dist;
          if (dist <= 2) f[x] = 0.3;
        }
      }
    }
  }
  return {
    dims: DIMS,
    tick: 55,
    simTimeSeconds: 1.25,
    rngSeed: 7,
    noiseEpsilon: 0,
    domain: "hexPrism",
    center: CENTER,
    tempC: -15,
    sigmaInfinity: 0.002,
    dxUm: 0.35,
    pressurePa: 101_325,
    paramSet: "CAK_A1",
    cflFill: 0.1,
    relaxTol: 1e-9,
    divTol: 1e-7,
    relaxMaxSweeps: 200_000,
    surfacePolicy: "aggregate-hv-g1h1-v4",
    farField: "dirichlet",
    a,
    f,
    sigma,
  };
}

describe("reconstructWall", () => {
  it("matches GGSolver's own hexPrism wall mask bit for bit", () => {
    const solver = new GGSolver({
      dims: DIMS,
      params: GG_PRESETS.plate,
      rngSeed: 1,
      domain: "hexPrism",
    });
    const wall = reconstructWall(DIMS, solver.center, "hexPrism");
    expect(wall).not.toBeNull();
    expect(Array.from(wall as Uint8Array)).toEqual(Array.from(solver.wall));
  });

  it("matches GGSolver on asymmetric dims and an off-center domain", () => {
    const dims: Dims = { nx: 12, ny: 9, nz: 7 };
    const solver = new GGSolver({
      dims,
      params: GG_PRESETS.plate,
      rngSeed: 1,
      domain: "hexPrism",
      center: [5, 4, 3],
    });
    const wall = reconstructWall(dims, [5, 4, 3], "hexPrism");
    expect(Array.from(wall as Uint8Array)).toEqual(Array.from(solver.wall));
  });

  it("returns null (no walls) for box domains", () => {
    expect(reconstructWall(DIMS, CENTER, "box")).toBeNull();
  });
});

describe("inspectCheckpointBytes — GG v1", () => {
  it("decodes strictly and reports honest operator/control/seed/tick metadata", () => {
    const artifact = inspectCheckpointBytes(ggFixtureBytes(), null);
    expect(artifact.operator).toBe("GGThreshold");
    expect(artifact.semantics.fieldName).toBe("d");
    expect(artifact.semantics.surfaceName).toBe("b");
    expect(artifact.tick).toBe(77);
    expect(artifact.rngSeed).toBe(42);
    expect(artifact.dims).toEqual(DIMS);
    const status = artifact.statusLines.join("\n");
    expect(status).toContain("view-only");
    expect(status).toContain("GGThreshold");
    expect(status).toContain("rho 0.1");
    expect(status).toContain("ggThreshBeta(0,1) 2.5"); // the plate preset's basal threshold
    expect(status).toContain("seed 42");
    expect(status).toContain("tick 77");
    expect(status).toContain("no physical-time interpretation");
    expect(status).toContain("loose artifact");
    expect(status).toContain("NOT gate evidence");
  });

  it("computes depletion with the SAME @vcc/core metric over d and the reconstructed wall", () => {
    const state = ggFixtureState();
    const artifact = inspectCheckpointBytes(ggFixtureBytes(), null);
    // Independent recomputation: GGSolver's own wall for these dims + core centerRimDepletion.
    const solver = new GGSolver({
      dims: DIMS,
      params: GG_PRESETS.plate,
      rngSeed: 1,
      domain: "hexPrism",
    });
    const expected = centerRimDepletion(state.a, state.d, DIMS, CENTER, solver.wall);
    expect(artifact.depletion.depletionCenter).toBe(expected.depletionCenter);
    expect(artifact.depletion.depletionRim).toBe(expected.depletionRim);
    expect(artifact.depletion.depletionRatio).toBe(expected.depletionRatio);
    expect(Number.isFinite(artifact.depletion.depletionRatio)).toBe(true);
  });

  it("decodes into fresh copies — mutating the artifact never touches the source bytes", () => {
    const bytes = ggFixtureBytes();
    const before = sha256Hex(bytes);
    const artifact = inspectCheckpointBytes(bytes, null);
    artifact.a[0] = 1;
    artifact.field64[0] = 999;
    artifact.surface32[0] = 999;
    expect(sha256Hex(bytes)).toBe(before);
  });
});

describe("inspectCheckpointBytes — LK v2", () => {
  it("reports policy, temperature control, physical time, and sigma/f semantics", () => {
    const artifact = inspectCheckpointBytes(encodeLKCheckpoint(lkFixtureState()), null);
    expect(artifact.operator).toBe("LibbrechtKinetics");
    expect(artifact.semantics.fieldName).toBe("sigma");
    expect(artifact.semantics.surfaceName).toBe("f");
    if (artifact.operator !== "LibbrechtKinetics") throw new Error("unreachable");
    expect(artifact.surfacePolicy).toBe("aggregate-hv-g1h1-v4");
    expect(artifact.tempC).toBe(-15);
    expect(artifact.sigmaInfinity).toBe(0.002);
    expect(artifact.simTimeSeconds).toBe(1.25);
    const status = artifact.statusLines.join("\n");
    expect(status).toContain("surface policy: aggregate-hv-g1h1-v4");
    expect(status).toContain("temperature -15 C");
    expect(status).toContain("physical time 1.25 s");
    expect(status).toContain("interface step 55");
    // No G-G vocabulary on an LK artifact.
    expect(status).not.toContain("ggThreshBeta");
  });

  it("computes depletion over sigma (the LK field), not any G-G quantity", () => {
    const state = lkFixtureState();
    const artifact = inspectCheckpointBytes(encodeLKCheckpoint(state), null);
    const wall = reconstructWall(DIMS, CENTER, "hexPrism") as Uint8Array;
    const expected = centerRimDepletion(state.a, state.sigma, DIMS, CENTER, wall);
    expect(artifact.depletion.depletionCenter).toBe(expected.depletionCenter);
    expect(artifact.depletion.depletionRatio).toBe(expected.depletionRatio);
  });
});

describe("evidence context verification", () => {
  function contextFor(bytes: Uint8Array): ArtifactEvidenceContext {
    return {
      runId: "A-HABIT-U0",
      pass: "A",
      operator: "GGThreshold",
      backend: "float64-cpu-oracle",
      evidenceClass: "published-gate-evidence",
      protocol: "phase4-pass-a-v1",
      reportPath: "gate4a-report.json",
      manifestSha256: "6d1ee3a262e8985930ded30f8ef490e1e47402dce6c55f2b3b16e4e80b0d9a98",
      viewVerdict: {
        criterion: "A-HABIT-ENDPOINTS",
        passed: true,
        summary: "registered endpoint aspect ratios invert",
      },
      checkpointSha256: sha256Hex(bytes),
    };
  }

  it("verified context flows into the evidence status and backend lines", () => {
    const bytes = ggFixtureBytes();
    const artifact = inspectCheckpointBytes(bytes, contextFor(bytes));
    expect(artifact.evidence.runId).toBe("A-HABIT-U0");
    expect(artifact.evidence.backend).toBe("float64-cpu-oracle");
    const status = artifact.statusLines.join("\n");
    expect(status).toContain("run: A-HABIT-U0");
    expect(status).toContain("published Pass A gate evidence");
    expect(status).toContain("A-HABIT-ENDPOINTS=true");
    expect(status).toContain("recorded backend: float64-cpu-oracle");
    expect(status).not.toContain("loose artifact");
  });

  it("rejects a recorded-hash mismatch by name (artifact metadata cannot be spoofed)", () => {
    const bytes = ggFixtureBytes();
    const context = { ...contextFor(bytes), checkpointSha256: "0".repeat(64) };
    expect(() => inspectCheckpointBytes(bytes, context)).toThrow(/artifact hash mismatch/);
  });

  it("rejects an operator label mismatch by name (LK context on GG bytes)", () => {
    const bytes = ggFixtureBytes();
    const context = {
      ...contextFor(bytes),
      operator: "LibbrechtKinetics" as const,
    };
    expect(() => inspectCheckpointBytes(bytes, context)).toThrow(/operator label mismatch/);
  });

  it("rejects forged backend, manifest, and free-form status context", () => {
    const bytes = ggFixtureBytes();
    expect(() =>
      inspectCheckpointBytes(bytes, {
        ...contextFor(bytes),
        backend: "gpu-float32",
      } as unknown as ArtifactEvidenceContext),
    ).toThrow(/backend must be float64-cpu-oracle/);
    expect(() =>
      inspectCheckpointBytes(bytes, {
        ...contextFor(bytes),
        manifestSha256: "0".repeat(64),
      }),
    ).toThrow(/does not pin the frozen manifest/);
    expect(() =>
      inspectCheckpointBytes(bytes, {
        ...contextFor(bytes),
        evidenceStatus: "published despite forgery",
      } as unknown as ArtifactEvidenceContext),
    ).toThrow(/unknown key evidenceStatus/);
    expect(inspectCheckpointBytes(bytes, contextFor(bytes)).evidence.status).not.toContain(
      "published despite forgery",
    );
  });

  it("keeps opted-in synthetic context labeled NOT gate evidence", () => {
    const bytes = ggFixtureBytes();
    const artifact = inspectCheckpointBytes(bytes, {
      ...contextFor(bytes),
      evidenceClass: "synthetic-fixture-not-gate-evidence",
      manifestSha256: "1".repeat(64),
      syntheticNotice: "SYNTHETIC FIXTURE - NOT GATE EVIDENCE",
    });
    expect(artifact.evidence.status).toBe("SYNTHETIC FIXTURE - NOT GATE EVIDENCE");
    expect(artifact.statusLines.join("\n")).toContain("NOT GATE EVIDENCE");
  });
});

describe("raw occupancy morphology metadata", () => {
  it("derives bbox/extents and every shared-core morphology metric from checkpoint occupancy", () => {
    const bytes = ggFixtureBytes();
    const artifact = inspectCheckpointBytes(bytes, null);
    expect(artifact.bbox).toEqual(latticeBBox(artifact.a, artifact.dims));
    expect(artifact.extents).toEqual(latticeExtents(artifact.a, artifact.dims));
    expect(artifact.morphology).toEqual({
      aspectRatio: aspectRatio(artifact.a, artifact.dims),
      attachedCount: latticeExtents(artifact.a, artifact.dims)?.attachedCount ?? 0,
      crossSectionHollowness: crossSectionHollowness(artifact.a, artifact.dims),
      sealedVoidFraction: sealedVoidFraction(artifact.a, artifact.dims),
      branchCount: branchCount(artifact.a, artifact.dims, artifact.center),
      cappedColumnProfile: cappedColumnProfile(artifact.a, artifact.dims, artifact.center) ?? null,
    });
  });
});

describe("strict decode failures surface by name (no silent fallback)", () => {
  it("rejects truncated checkpoint bytes", () => {
    const bytes = ggFixtureBytes();
    expect(() => inspectCheckpointBytes(bytes.subarray(0, bytes.length - 16), null)).toThrow(
      /payload length does not match/,
    );
  });

  it("rejects non-checkpoint bytes by magic", () => {
    const junk = new TextEncoder().encode("NOTACKPT-and-then-some-longer-content");
    expect(() => inspectCheckpointBytes(junk, null)).toThrow(/not a VCC checkpoint/);
  });

  it("rejects a header length that overruns the available bytes", () => {
    const bytes = ggFixtureBytes().slice();
    new DataView(bytes.buffer).setUint32(8, bytes.length, true);
    expect(() => inspectCheckpointBytes(bytes, null)).toThrow(/header length exceeds/);
  });

  it("rejects a corrupted header (invalid JSON)", () => {
    const bytes = ggFixtureBytes().slice();
    bytes[14] = 0x00; // stomp inside the JSON header
    expect(() => detectCheckpointOperator(bytes)).toThrow(/not valid JSON/);
  });

  it("rejects a payload byte flip that violates the codec's state validators", () => {
    const state = ggFixtureState();
    const metrics = computeMetrics(state.a, state.b, state.d, DIMS, CENTER, state.tick);
    const bytes = encodeCheckpoint(state, metrics).slice();
    // Flip an occupancy byte in the a-field payload: attachedCount no longer matches the
    // header metrics, which the strict decoder must reject.
    const headerLength = new DataView(bytes.buffer).getUint32(8, true);
    const aOffset = 12 + headerLength;
    const flipIndex = aOffset + idx(DIMS, 5, 5, 5); // the attached center cell
    expect(bytes[flipIndex]).toBe(1);
    bytes[flipIndex] = 0;
    expect(() => inspectCheckpointBytes(bytes, null)).toThrow(/attachedCount does not match/);
  });
});
