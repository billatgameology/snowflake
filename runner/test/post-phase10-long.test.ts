import { describe, expect, it } from "vitest";
import { POST_PHASE10_ADAPTIVE_ROWS } from "../src/post-phase10-adaptive.ts";
import {
  POST_PHASE10_LONG_DIMS_N,
  POST_PHASE10_LONG_ROWS,
  POST_PHASE10_LONG_TARGET_EXTENT,
  findPostPhase10LongRow,
} from "../src/post-phase10-long.ts";

describe("post-Phase-10 long-wave roster", () => {
  it("repeats every pilot condition once at the selected larger domain and extent", () => {
    expect(POST_PHASE10_LONG_ROWS).toHaveLength(432);
    expect(new Set(POST_PHASE10_LONG_ROWS.map((row) => row.id)).size).toBe(432);
    expect(POST_PHASE10_LONG_ROWS.filter((row) => row.lane === "long-map")).toHaveLength(288);
    expect(POST_PHASE10_LONG_ROWS.filter((row) => row.lane === "long-pressure")).toHaveLength(72);
    expect(POST_PHASE10_LONG_ROWS.filter((row) => row.lane === "long-seed")).toHaveLength(72);

    for (const pilotRow of POST_PHASE10_ADAPTIVE_ROWS) {
      const longRow = findPostPhase10LongRow(`long-${pilotRow.id}`);
      expect(longRow).toBeDefined();
      const lane =
        pilotRow.lane === "adaptive-map"
          ? "long-map"
          : pilotRow.lane === "adaptive-pressure"
            ? "long-pressure"
            : "long-seed";
      expect(longRow).toEqual({
        ...pilotRow,
        id: `long-${pilotRow.id}`,
        lane,
        dimsN: POST_PHASE10_LONG_DIMS_N,
        targetExtent: POST_PHASE10_LONG_TARGET_EXTENT,
      });
      expect(longRow?.cflFill).toBe(0.1);
    }
  });

  it("has no resolver path outside the finite roster", () => {
    expect(findPostPhase10LongRow("long-not-a-row")).toBeUndefined();
  });
});
