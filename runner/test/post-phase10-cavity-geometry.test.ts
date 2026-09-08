import { describe, expect, it } from "vitest";
import { domainCenter, idx, type Dims } from "@vcc/core";
import { measureCavityGeometry } from "../src/post-phase10-cavity-geometry.ts";

const dims: Dims = { nx: 24, ny: 24, nz: 24 };
const center = domainCenter(dims);
const cell = (i: number, j: number, k: number): number => idx(dims, center[0] + i, center[1] + j, center[2] + k);
// Independent fixture membership: the axial hex is the intersection of three strips.
function prism(radius: number, lower: number, upper: number): Set<number> {
  const occupied = new Set<number>();
  for (let k = lower; k <= upper; k++) {
    for (let i = -radius; i <= radius; i++) {
      for (let j = -radius; j <= radius; j++) {
        if (i + j >= -radius && i + j <= radius) occupied.add(cell(i, j, k));
      }
    }
  }
  return occupied;
}

describe("offline cavity geometry", () => {
  it("measures an analytic solid hexagonal prism without promoting occupancy to mass", () => {
    const occupied = prism(2, -1, 1);
    const measured = measureCavityGeometry(occupied, dims, 0.35);
    expect(occupied.size).toBe(57); // Three layers of 1 + 6 + 12 sites.
    expect(measured.attachedCount).toBe(57);
    expect(measured.occupiedCellVolumeUm3).toBeCloseTo(57 * Math.sqrt(3) / 2 * 0.35 ** 3, 14);
    expect(measured.integerHexRadius).toBe(2);
    expect(measured.spans?.i).toEqual({ min: 10, max: 14, centerSpanCells: 4,
      centerSpanUm: 1.4, inclusiveCells: 5, inclusiveSpanUm: 1.75 });
    expect(measured.spans?.j).toEqual(measured.spans?.i);
    expect(measured.spans?.k).toEqual({ min: 11, max: 13, centerSpanCells: 2,
      centerSpanUm: 0.7, inclusiveCells: 3, inclusiveSpanUm: 3 * 0.35 });
    expect(measured.probe).toEqual({ requestedRadiusUm: 0.35, integerHexRadius: 1,
      actualRadiusUm: 0.35, siteCount: 7 });
    expect(measured.layers.every((layer) => layer.centerOccupied && layer.probeState === "full" &&
      layer.lateralVoid === "center-occupied" && layer.enclosedVoidAreaUm2 === null &&
      layer.directAxialOpening.lower === null && layer.directAxialOpening.upper === null)).toBe(true);
    expect(measured.waist).toEqual({ probeFullLayerCount: 3, lowerOffset: -1, upperOffset: 1,
      centerSpanUm: 0.7, inclusiveThicknessUm: 3 * 0.35 });
  });

  it("identifies lateral enclosure and opposite straight axial openings around a solid waist", () => {
    const occupied = prism(3, -4, 4);
    const channel = prism(1, -4, 4);
    for (const index of channel) {
      if (!prism(1, -1, 1).has(index)) occupied.delete(index);
    }
    const measured = measureCavityGeometry(occupied, dims, 0.35);
    expect(measured.attachedCount).toBe(291); // 3*37 solid sites plus 6*(37-7) annular sites.
    expect(measured.layers.filter((layer) => layer.lateralVoid === "enclosed")).toHaveLength(6);
    for (const layer of measured.layers.filter((entry) => Math.abs(entry.offset) >= 2)) {
      expect(layer.attachedCount).toBe(30);
      expect(layer.probeOccupiedCount).toBe(0);
      expect(layer.probeState).toBe("empty");
      expect(layer.enclosedVoidSiteCount).toBe(7);
      expect(layer.enclosedVoidAreaUm2).toBeCloseTo(7 * Math.sqrt(3) / 2 * 0.35 ** 2, 14);
      expect(layer.directAxialOpening).toEqual({ lower: layer.offset < 0, upper: layer.offset > 0 });
    }
    expect(measured.waist.probeFullLayerCount).toBe(3);
    expect(measured.layers.reduce((sum, layer) => sum + layer.attachedCount, 0)).toBe(occupied.size);
  });

  it("does not call six separated arms an enclosed cavity", () => {
    const occupied = new Set<number>();
    for (const [i, j] of [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]]) {
      for (const radius of [2, 3]) occupied.add(cell(i * radius, j * radius, 0));
    }
    const measured = measureCavityGeometry(occupied, dims, 0.35);
    expect(measured.attachedCount).toBe(12);
    expect(measured.layers[0]).toMatchObject({ centerOccupied: false, probeState: "empty",
      lateralVoid: "open", enclosedVoidSiteCount: null, enclosedVoidAreaUm2: null,
      directAxialOpening: { lower: true, upper: true } });
    expect(measured.waist.probeFullLayerCount).toBe(0);
  });

  it("keeps fixed physical probe radius across a twofold spacing change and labels cell envelopes", () => {
    const coarse = measureCavityGeometry(prism(2, -1, 1), dims, 0.35);
    const fine = measureCavityGeometry(prism(4, -2, 2), dims, 0.175);
    expect(coarse.probe.integerHexRadius).toBe(1);
    expect(fine.probe.integerHexRadius).toBe(2);
    expect(fine.probe.siteCount).toBe(19); // 1 + 6 + 12, not the coarse seven-site probe.
    expect(fine.probe.actualRadiusUm).toBe(coarse.probe.actualRadiusUm);
    expect(fine.integerHexRadiusUm).toBe(coarse.integerHexRadiusUm);
    expect(fine.spans?.i.centerSpanUm).toBe(coarse.spans?.i.centerSpanUm);
    expect(fine.spans?.k.centerSpanUm).toBe(coarse.spans?.k.centerSpanUm);
    expect(fine.spans?.k.inclusiveSpanUm).not.toBe(coarse.spans?.k.inclusiveSpanUm);
    expect(fine.occupiedCellVolumeUm3).toBeCloseTo(305 * Math.sqrt(3) / 2 * 0.175 ** 3, 14);
    const roundedDown = measureCavityGeometry(prism(2, 0, 0), dims, 0.35, 0.5);
    expect(roundedDown.probe).toEqual({ requestedRadiusUm: 0.5, integerHexRadius: 1,
      actualRadiusUm: 0.35, siteCount: 7 });
  });

  it("includes empty axial gaps and does not mistake blocked straight paths for a 3D verdict", () => {
    const occupied = new Set([...prism(1, -2, -2), ...prism(1, 2, 2)]);
    const measured = measureCavityGeometry(occupied, dims, 0.35);
    expect(measured.layers.map((layer) => layer.offset)).toEqual([-2, -1, 0, 1, 2]);
    expect(measured.layers[2]).toMatchObject({ attachedCount: 0, integerHexRadius: null,
      centerOccupied: false, probeState: "empty", lateralVoid: "open",
      directAxialOpening: { lower: false, upper: false } });
    expect(measured.waist).toEqual({ probeFullLayerCount: 0, lowerOffset: null, upperOffset: null,
      centerSpanUm: 0, inclusiveThicknessUm: 0 });
  });

  it("represents empty occupancy and a partial central probe explicitly", () => {
    const empty = measureCavityGeometry(new Set(), dims, 0.35);
    expect(empty).toMatchObject({ attachedCount: 0, occupiedCellVolumeUm3: 0, spans: null,
      integerHexRadius: null, integerHexRadiusUm: null, layers: [] });
    const singleton = measureCavityGeometry(new Set([cell(0, 0, 0)]), dims, 0.35);
    expect(singleton.layers[0]).toMatchObject({ centerOccupied: true, probeOccupiedCount: 1,
      probeState: "partial", lateralVoid: "center-occupied" });
    expect(singleton.waist.probeFullLayerCount).toBe(0);
    expect(singleton.spans?.k.centerSpanUm).toBe(0);
    expect(singleton.spans?.k.inclusiveSpanUm).toBe(0.35);
    expect(() => measureCavityGeometry(new Set([24 ** 3]), dims, 0.35)).toThrow("out of bounds");
  });
});
