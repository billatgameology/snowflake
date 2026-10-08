import { describe, expect, it } from "vitest";
import {
  decodeLKExperimentalResumeCheckpointV1, encodeLKExperimentalResumeCheckpointV1,
  type LKResumeByteSource,
} from "@vcc/core";
import { LKSolver, type LKSolverOptions } from "@vcc/solver-cpu";

const base = {
  dims: { nx: 12, ny: 12, nz: 9 }, domain: "hexPrism", center: [6, 6, 4],
  tempC: -5, sigmaInfinity: 0.01, dxUm: 0.35, pressurePa: 101325,
  paramSet: "M1", surfacePolicy: "aggregate-hv-g1h1-v6", farField: "monopole-matched",
  cflFill: 0.2, relaxTol: 1e-8, divTol: 1e-6, relaxMaxSweeps: 200000,
  rngSeed: 0x12345678, noiseEpsilon: 0.25, seedRadius: 2, seedThickness: 1,
} as const;
const modes: readonly (readonly [string, Partial<LKSolverOptions>])[] = [
  ["broad", { paramSet: "M1_NO_DIP_ABLATION" }],
  ...(["both", "neither", "basal-only", "prism-only"] as const).map((experimentalFacetDips) =>
    [experimentalFacetDips, { experimentalFacetDips }] as const),
  ["full width", { experimentalBasalWidthCells: 3 }],
  ["early width", { experimentalBasalWidthCells: 3,
    experimentalBasalWidthHistory: { mode: "early-only", cutoffSeconds: 1e-6 } }],
];
function source(bytes: Uint8Array): LKResumeByteSource {
  return { byteLength: bytes.length, async readExactly(offset, target) {
    if (offset + target.length > bytes.length) throw new Error("source truncated");
    target.set(bytes.subarray(offset, offset + target.length));
  } };
}
async function encoded(solver: LKSolver): Promise<Uint8Array> {
  const chunks: Uint8Array[] = [];
  const result = await encodeLKExperimentalResumeCheckpointV1(solver.experimentalResumeStateV1(), {
    async write(chunk) { chunks.push(chunk.slice()); },
  });
  const bytes = new Uint8Array(result.byteLength);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  expect(offset).toBe(bytes.length);
  return bytes;
}
async function restored(solver: LKSolver): Promise<LKSolver> {
  return LKSolver.fromExperimentalResumeStateV1(await decodeLKExperimentalResumeCheckpointV1(source(await encoded(solver))));
}
function bytes(view: Uint8Array | Float64Array): Uint8Array {
  return new Uint8Array(view.buffer, view.byteOffset, view.byteLength).slice();
}
function scientific(solver: LKSolver) {
  const { mutationEpoch: _epoch, ...common } = solver.experimentalResumeStateV1().common;
  return { experiment: solver.experimentalResumeStateV1().experiment, ...common,
    a: bytes(solver.a), f: bytes(solver.f), sigma: bytes(solver.sigma),
    boundaryOrder: [...common.boundaryOrder], lastAttached: [...common.lastAttached],
    ledger: solver.ledger(), wall: bytes(solver.wall),
    extents: ["iMin", "iMax", "jMin", "jMax", "kMin", "kMax"].map((key) =>
      (solver as unknown as Record<string, number>)[key]),
  };
}

describe("ADR 0060 BLD experimental continuation", () => {
  for (const [label, mode] of modes) {
    it(`${label}: initial, every-cycle and multiple restores preserve complete evolution`, async () => {
      const options = { ...base, ...mode };
      const direct = new LKSolver(options);
      let every = await restored(new LKSolver(options));
      let multiple = await restored(new LKSolver(options));
      expect(scientific(every)).toEqual(scientific(direct));
      expect(scientific(multiple)).toEqual(scientific(direct));
      let attachments = 0;
      let sawPartialFill = false;
      for (let cycle = 1; cycle <= 12; cycle++) {
        const expected = direct.step();
        expect(expected.relaxation.converged).toBe(true);
        expect(every.step()).toEqual(expected);
        expect(multiple.step()).toEqual(expected);
        attachments += expected.surface.attachedNow;
        sawPartialFill ||= direct.f.some((value, index) => !direct.a[index] && value > 0 && value < 1);
        const beforeExport = scientific(direct);
        const checkpoint = await encoded(direct);
        expect(scientific(direct)).toEqual(beforeExport);
        every = await restored(every);
        if ([1, 4, 8, 11].includes(cycle)) multiple = await restored(multiple);
        expect(scientific(every)).toEqual(beforeExport);
        expect(scientific(multiple)).toEqual(beforeExport);
        expect(await encoded(every)).toEqual(checkpoint);
        expect(await encoded(multiple)).toEqual(checkpoint);
      }
      expect(attachments).toBeGreaterThan(0);
      expect(sawPartialFill).toBe(true);
      const common = direct.experimentalResumeStateV1().common;
      expect(common.volumeRateM3PerS).toBeGreaterThan(0);
      expect(direct.fillLedger).toBeGreaterThan(0);
      expect(direct.sigma.some((value, index) => !direct.a[index] && !direct.wall[index] && value < direct.sigmaInfinity)).toBe(true);
      expect(() => direct.resumeStateV3()).toThrow();
    });
  }

  it("rebuilds width geometry after attachment and switches at an exact cutoff without fresh attachment", async () => {
    const options = { ...base, noiseEpsilon: 0, experimentalBasalWidthCells: 3 };
    const full = new LKSolver(options);
    const first = full.step();
    expect(first.relaxation.converged).toBe(true);
    expect(first.surface.attachedNow).toBe(0);
    const cutoffSeconds = full.simTimeSeconds;
    const earlyOptions = { ...options, experimentalBasalWidthHistory: { mode: "early-only" as const, cutoffSeconds } };
    const direct = new LKSolver(earlyOptions);
    expect(direct.step()).toEqual(first);
    expect(direct.simTimeSeconds).toBe(cutoffSeconds);
    const continuation = await restored(direct);
    expect(continuation.basalWidthHistoryActive()).toBe(false);
    expect(continuation.relaxField()).toEqual(direct.relaxField());
    let basal = 0;
    for (const index of direct.boundaryCells()) {
      expect(continuation.boundaryState(index)).toEqual(direct.boundaryState(index));
      if (direct.facetClassOf(index) === "basal") {
        basal++;
        expect(continuation.boundaryState(index).basalWidthSelected).toBe(false);
      }
    }
    expect(basal).toBeGreaterThan(0);
    expect(continuation.advanceSurface()).toEqual(direct.advanceSurface());
    expect(scientific(continuation)).toEqual(scientific(direct));

    let last = first;
    for (let cycle = 0; cycle < 20 && last.surface.attachedNow === 0; cycle++) last = full.step();
    expect(last.surface.attachedNow).toBeGreaterThan(0);
    const afterAttachment = await restored(full);
    expect([...afterAttachment.boundaryCells()]).toEqual([...full.boundaryCells()]);
    expect(afterAttachment.lastAttached).toEqual(full.lastAttached);
    expect(afterAttachment.relaxField()).toEqual(full.relaxField());
    for (const index of full.boundaryCells()) expect(afterAttachment.boundaryState(index)).toEqual(full.boundaryState(index));
    expect(afterAttachment.advanceSurface()).toEqual(full.advanceSurface());
    expect(scientific(afterAttachment)).toEqual(scientific(full));
  });

  it("keeps the separate scope, initial boundary and single-use ownership strict", async () => {
    const ordinary = new LKSolver(base);
    expect(() => ordinary.experimentalResumeStateV1()).toThrow("registered BLD");
    for (const override of [
      { experimentalHoleFilling: "enabled" as const },
      { experimentalBasalWidthCells: 3, experimentalBasalWidthHistory: { mode: "late-only" as const, cutoffSeconds: 20 } },
      { experimentalFacetDips: "basal-only" as const, testMode: true, testExtraSeedSites: [] },
    ]) expect(() => new LKSolver({ ...base, ...override }).experimentalResumeStateV1()).toThrow();
    const event = new LKSolver({ ...base, paramSet: "M1_NO_DIP_ABLATION" });
    event.applyTimelineEnvironment({ ...event.timelineEnvironment(), sigmaInfinity: 0.02 });
    expect(() => event.experimentalResumeStateV1()).toThrow("constant environment");
    const candidate = new LKSolver({ ...base, experimentalFacetDips: "both" });
    const checkpoint = await encoded(candidate);
    const decoded = await decodeLKExperimentalResumeCheckpointV1(source(checkpoint));
    expect(() => LKSolver.fromExperimentalResumeStateV1({ ...decoded })).toThrow("decoder-branded");
    expect(LKSolver.fromExperimentalResumeStateV1(decoded).tick).toBe(0);
    expect(() => LKSolver.fromExperimentalResumeStateV1(decoded)).toThrow("already consumed");
    expect(candidate.relaxField().converged).toBe(true);
    expect(() => candidate.experimentalResumeStateV1()).toThrow("cycle-boundary");
  });
});
