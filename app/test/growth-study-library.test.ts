import { describe, expect, it } from "vitest";
import { filterGrowthEntries, growthStudyShape, orderGrowthEntries, type GrowthStudyEntry } from "../src/growth-study-library.ts";
import { readDendrite } from "../src/dendrite-data.ts";

describe("growth study selection and framing", () => {
  it("uses specific name-based navigation buckets before the broad planar fallback", () => {
    const sample = (label: string, habit = "planar") => ({ label, habit }) as GrowthStudyEntry;
    expect(growthStudyShape(sample("Fernlike Stellar Dendrites"))).toBe("dendrites");
    expect(growthStudyShape(sample("Columns on Plates"))).toBe("columns");
    expect(growthStudyShape(sample("Crossed Needles"))).toBe("columns");
    expect(growthStudyShape(sample("Hollow Plates"))).toBe("plates");
    expect(growthStudyShape(sample("Bullet Rosettes", "Bullet Rosettes"))).toBe("other");
    expect(growthStudyShape(sample("12-branched Stars"))).toBe("plates");
    expect(growthStudyShape({ ...sample("Fig. 13"), browseShape: "dendrites" })).toBe("dendrites");
    const earlier = { ...sample("Fig. 13"), id: "fig13", source: "fleet", browseShape: "dendrites" } as GrowthStudyEntry;
    const column = { ...sample("Solid Columns"), id: "column", source: "named-direct" } as GrowthStudyEntry;
    const dendrite = { ...sample("Stellar Dendrites"), id: "dendrite", source: "named-direct" } as GrowthStudyEntry;
    expect(orderGrowthEntries([earlier, column, dendrite]).map(entry => entry.id)).toEqual(["dendrite", "column", "fig13"]);
  });
  it("matches multiple search terms across identity, label and habit", () => {
    const entries = [
      { id: "fig29", label: "Fig. 29", habit: "needle" },
      { id: "fig30", label: "Fig. 30", habit: "hollow column" },
    ] as GrowthStudyEntry[];
    expect(filterGrowthEntries(entries, "FIG needle").map(entry => entry.id)).toEqual(["fig29"]);
    expect(filterGrowthEntries(entries, "column").map(entry => entry.id)).toEqual(["fig30"]);
    expect(filterGrowthEntries(entries, "plate")).toEqual([]);
  });

  it("frames an axial crystal by its full extent rather than its tiny in-plane radius", () => {
    const header = new TextEncoder().encode(JSON.stringify({ format: "dendrite-presentation-v1", dims: [3, 3, 101], center: [1, 1, 50], finalTick: 100, eventCount: 3, sourceSha256: "a".repeat(64) }));
    const buffer = new ArrayBuffer(4 + header.length + 24);
    const view = new DataView(buffer);
    view.setUint32(0, header.length, true);
    new Uint8Array(buffer, 4, header.length).set(header);
    for (const [index, pair] of [[454, 0], [4, 100], [904, 100]].entries()) {
      view.setUint32(4 + header.length + index * 8, pair[0]!, true);
      view.setUint32(8 + header.length + index * 8, pair[1]!, true);
    }
    const data = readDendrite(buffer);
    expect(data.radius).toBe(0);
    expect(data.extent).toBe(50);
    expect(data.vertical).toBe(true);
  });
});
