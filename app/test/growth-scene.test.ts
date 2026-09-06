import { describe, expect, it } from "vitest";
import {
  growthSceneColdPayloadBytes,
  parseGrowthSceneV1,
} from "../src/growth-scene.ts";

const SHA_A = "a".repeat(64);
const SHA_B = "b".repeat(64);

const component = (id: string, sha = SHA_A, byteLength = 1024) => ({
  id,
  growthAsset: { url: "./needle-growth-v1.bin", byteLength, sha256: sha },
  scientificBundle: { locator: "nas:collections/example/needle", identitySha256: SHA_B },
  transform: { translate: [0, 0, 0], rotateDegrees: [0, 0, 0], scale: 1 },
  phaseOffset: 0,
});

const valid = () => ({
  format: "growth-scene-v1",
  title: "Crossed needles",
  disclosure: "composed-visualization",
  durationSeconds: 8,
  variation: { driver: "cross-angle", value: 60, unit: "degrees" },
  bounds: { xMin: -10, xMax: 10, yMin: -8, yMax: 8, zMin: -5, zMax: 5 },
  camera: { tiltDegrees: 55, yawDegrees: 0, zoom: 1 },
  components: [component("needle-a"), component("needle-b")],
});

describe("growth-scene-v1", () => {
  it("strictly parses a composed scene and counts a repeated component payload once", () => {
    const scene = parseGrowthSceneV1(valid());
    expect(scene.components).toHaveLength(2);
    expect(growthSceneColdPayloadBytes(scene, 600)).toBe(1624);
  });

  it("accepts an explicitly disclosed direct growth recording", () => {
    const wire = valid();
    wire.disclosure = "direct-growth-recording";
    wire.components = [component("direct")];
    expect(parseGrowthSceneV1(wire).disclosure).toBe("direct-growth-recording");
  });

  it("counts distinct cold component assets independently", () => {
    const wire = valid();
    wire.components[1] = component("needle-b", SHA_B, 2048);
    const scene = parseGrowthSceneV1(wire);
    expect(growthSceneColdPayloadBytes(scene, 600)).toBe(3672);
  });

  it("rejects duplicate components, unknown keys, and invalid phase/transform values", () => {
    const duplicate = valid();
    duplicate.components[1]!.id = "needle-a";
    expect(() => parseGrowthSceneV1(duplicate)).toThrow(/duplicates/u);

    const unknown = { ...valid(), surprise: true };
    expect(() => parseGrowthSceneV1(unknown)).toThrow(/keys must be exactly/u);

    const disclosure = valid();
    disclosure.disclosure = "unspecified";
    expect(() => parseGrowthSceneV1(disclosure)).toThrow(/disclosure/u);

    const phase = valid();
    phase.components[0]!.phaseOffset = 1;
    expect(() => parseGrowthSceneV1(phase)).toThrow(/\[0, 1\)/u);

    const scale = valid();
    scale.components[0]!.transform.scale = 0;
    expect(() => parseGrowthSceneV1(scale)).toThrow(/positive/u);
  });

  it("rejects inconsistent byte claims for one content identity", () => {
    const wire = valid();
    wire.components[1]!.growthAsset.byteLength = 2048;
    const scene = parseGrowthSceneV1(wire);
    expect(() => growthSceneColdPayloadBytes(scene, 600)).toThrow(/inconsistent byte lengths/u);
  });
});
