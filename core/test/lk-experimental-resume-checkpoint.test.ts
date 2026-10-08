import { describe, expect, it } from "vitest";
import {
  decodeLKCheckpoint, decodeLKResumeCheckpointV3, decodeLKExperimentalResumeCheckpointV1,
  encodeLKResumeCheckpointV3, encodeLKExperimentalResumeCheckpointV1,
  takeDecodedLKExperimentalResumeCheckpointV1, hexDistance,
  type LKExperimentalResumeDescriptorV1, type LKExperimentalResumeStateV1,
  type LKResumeByteSink, type LKResumeByteSource, type LKResumeStateV3,
} from "@vcc/core";

class Sink implements LKResumeByteSink {
  chunks: Uint8Array[] = [];
  async write(bytes: Uint8Array): Promise<void> { this.chunks.push(bytes.slice()); }
  bytes(): Uint8Array {
    const result = new Uint8Array(this.chunks.reduce((sum, bytes) => sum + bytes.length, 0));
    let offset = 0;
    for (const bytes of this.chunks) { result.set(bytes, offset); offset += bytes.length; }
    return result;
  }
}
function source(bytes: Uint8Array): LKResumeByteSource {
  return { byteLength: bytes.length, async readExactly(offset, target) {
    if (offset < 0 || offset + target.length > bytes.length) throw new Error("truncated source");
    // Byte-sized transport fragments must not change float64 or descriptor decoding.
    for (let index = 0; index < target.length; index++) target[index] = bytes[offset + index];
  } };
}
function common(paramSet: "M1" | "M1_NO_DIP_ABLATION"): LKResumeStateV3 {
  const a = new Uint8Array(27), f = new Float64Array(27), sigma = new Float64Array(27);
  for (let k = 0; k < 3; k++) for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) {
    if (hexDistance(i - 1, j - 1) <= 1) sigma[k * 9 + j * 3 + i] = 0.01;
  }
  a[13] = 1; f[13] = 1; sigma[13] = 0;
  return { numericEngine: "float64-cpu", resumePhase: "cycle-boundary", cycleState: "boundary", timelineMode: "none",
    dims: { nx: 3, ny: 3, nz: 3 }, center: [1, 1, 1], tick: 0, rngSeed: 1, noiseEpsilon: 0,
    domain: "hexPrism", tempC: -5, sigmaInfinity: 0.01, dxUm: 0.35, pressurePa: 101325, paramSet,
    cflFill: 0.05, relaxTol: 1e-9, divTol: 1e-7, relaxMaxSweeps: 200000,
    surfacePolicy: "aggregate-hv-g1h1-v6", farField: "monopole-matched",
    activeCellCount: 21, shellCellCount: 20, hexRadius: 1, zHalfExtent: 1, attachedCount: 1,
    holeFillCountTotal: 0, a, f, sigma, boundaryOrder: [14, 12, 16, 10, 11, 15, 22, 4], lastAttached: [],
    simTimeSeconds: 0, volumeRateM3PerS: 0, lastMaxFillVelocityMS: 0, fillLedger: 0,
    holeFillDeficit: 0, saturationClippedFill: 0, lastRelaxation: null,
    acceptedEnvironmentEventCount: 0, closedPlacedFillVaporUnits: 0, currentTemperatureSegmentStartFill: 0,
    testHookEverUsed: false, mutationEpoch: () => 0 };
}
const modes: readonly LKExperimentalResumeDescriptorV1[] = [
  { kind: "ordinary-no-dip" },
  ...(["both", "neither", "basal-only", "prism-only"] as const).map((arm) => ({ kind: "facet-dips" as const, arm })),
  { kind: "basal-width", widthCells: 3, history: null },
  { kind: "basal-width", widthCells: 3, history: { mode: "early-only", cutoffSeconds: 7.757629624791443 } },
];
async function encoded(experiment = modes[0]): Promise<Uint8Array> {
  const sink = new Sink();
  const state = common(experiment.kind === "ordinary-no-dip" ? "M1_NO_DIP_ABLATION" : "M1");
  const result = await encodeLKExperimentalResumeCheckpointV1({ experiment, common: state }, sink);
  expect(result.byteLength).toBe(sink.bytes().length);
  const commonSink = new Sink();
  await encodeLKResumeCheckpointV3(state, commonSink);
  const bytes = sink.bytes();
  const offset = 12 + new DataView(bytes.buffer).getUint32(8, true);
  expect(bytes.slice(offset)).toEqual(commonSink.bytes());
  return bytes;
}
function mutateHeader(bytes: Uint8Array, mutate: (header: Record<string, any>) => void): Uint8Array {
  const length = new DataView(bytes.buffer, bytes.byteOffset).getUint32(8, true);
  const header = JSON.parse(new TextDecoder().decode(bytes.slice(12, 12 + length)));
  mutate(header);
  const newHeader = new TextEncoder().encode(JSON.stringify(header));
  const result = new Uint8Array(bytes.length - length + newHeader.length);
  result.set(bytes.slice(0, 12)); new DataView(result.buffer).setUint32(8, newHeader.length, true);
  result.set(newHeader, 12); result.set(bytes.slice(12 + length), 12 + newHeader.length);
  return result;
}

describe("ADR 0060 experimental resume envelope", () => {
  for (const [index, experiment] of modes.entries()) {
    it(`preserves mode ${index} and ordinary common codec bytes`, async () => {
      const bytes = await encoded(experiment);
      const decoded = await decodeLKExperimentalResumeCheckpointV1(source(bytes));
      expect(decoded.tick).toBe(0);
      expect(() => takeDecodedLKExperimentalResumeCheckpointV1({ ...decoded })).toThrow("decoder-branded");
      const state = takeDecodedLKExperimentalResumeCheckpointV1(decoded);
      expect(state.experiment).toEqual(experiment);
      expect(state.common.boundaryOrder).toEqual([14, 12, 16, 10, 11, 15, 22, 4]);
      expect(state.common.a[13]).toBe(1);
      expect(state.common.f[13]).toBe(1);
      expect(() => takeDecodedLKExperimentalResumeCheckpointV1(decoded)).toThrow("already consumed");
      expect(() => decodeLKCheckpoint(bytes)).toThrow();
      await expect(decodeLKResumeCheckpointV3(source(bytes))).rejects.toThrow("magic");
    });
  }
  it("rejects wrong families, truncation and extension", async () => {
    const bytes = await encoded();
    const innerOffset = 12 + new DataView(bytes.buffer).getUint32(8, true);
    await expect(decodeLKExperimentalResumeCheckpointV1(source(bytes.slice(innerOffset)))).rejects.toThrow("family");
    await expect(decodeLKExperimentalResumeCheckpointV1(source(bytes.slice(0, -1)))).rejects.toThrow("source length");
    const extended = new Uint8Array(bytes.length + 1); extended.set(bytes);
    await expect(decodeLKExperimentalResumeCheckpointV1(source(extended))).rejects.toThrow("source length");
  });
  it("rejects missing, unknown and incompatible descriptors instead of restoring different kinetics", async () => {
    const bytes = await encoded(modes[6]);
    for (const mutation of [
      (header: Record<string, any>) => { delete header.experiment; },
      (header: Record<string, any>) => { header.experiment.kind = "unknown"; },
      (header: Record<string, any>) => { header.experiment.history.mode = "late-only"; },
      (header: Record<string, any>) => { header.experiment.widthCells = 0; },
      (header: Record<string, any>) => { header.experiment.history.cutoffSeconds = "7ff0000000000000"; },
      (header: Record<string, any>) => { header.experiment.experimentalHoleFilling = "disabled"; },
      (header: Record<string, any>) => { header.experiment = { kind: "ordinary-no-dip" }; },
    ]) await expect(decodeLKExperimentalResumeCheckpointV1(source(mutateHeader(bytes, mutation)))).rejects.toThrow();
    const state: LKExperimentalResumeStateV1 = { experiment: modes[1], common: common("M1_NO_DIP_ABLATION") };
    await expect(encodeLKExperimentalResumeCheckpointV1(state, new Sink())).rejects.toThrow("paramSet M1");
  });
  it("checks mutation while the outer header is streamed", async () => {
    let epoch = 0;
    const state = { ...common("M1"), mutationEpoch: () => epoch };
    await expect(encodeLKExperimentalResumeCheckpointV1({ experiment: modes[1], common: state }, {
      async write() { epoch++; },
    })).rejects.toThrow("mutated");
  });
});
