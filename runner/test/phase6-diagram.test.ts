// The diagram is a REPORT of the scored grid, not a second opinion on it. These tests exist
// mostly to pin that: it must draw what the scoring said, and must not be able to re-derive a
// habit of its own.

import { describe, expect, it } from "vitest";
import { phase6RenderDiagram } from "../src/phase6-diagram.ts";
import {
  phase6ScorePoint,
  type Phase6PointResult,
  type Phase6ScoredPoint,
} from "../src/phase6-sweep.ts";
import {
  PHASE6_NAKAYA_BOUNDARIES_C,
  PHASE6_SIGMA_FRACTIONS,
  phase6SweepGrid,
  phase6TemperatureGrid,
} from "../src/phase6-protocol.ts";

const result = (aspectRatio: number, overrides: Partial<Phase6PointResult> = {}): Phase6PointResult => ({
  tempC: -15,
  fraction: 0.15,
  sigmaInf: 0.02355,
  steps: 300,
  attached: 5000,
  aspectRatio,
  largestExtent: 21,
  symmetryError: 0,
  deltaSymClean: true,
  allConverged: true,
  domainContact: false,
  config: null,
  seconds: 100,
  ...overrides,
});

/** A full synthetic grid: plate warm of −10, neutral cold of it. */
function syntheticGrid() {
  return phase6SweepGrid().map((point) =>
    phase6ScorePoint(point, result(point.tempC > -10 ? 0.38 : 1.1)),
  );
}

describe("the diagram artifact", () => {
  it("renders a standalone SVG covering the whole registered grid", () => {
    const svg = phase6RenderDiagram(syntheticGrid(), "protocol abc123 · head def456");
    expect(svg.startsWith("<svg")).toBe(true);
    expect(svg.trimEnd().endsWith("</svg>")).toBe(true);
    // No external references: the artifact must be readable with nothing else present.
    expect(svg).not.toContain("http://www.w3.org/1999/xlink");
    expect(svg).not.toMatch(/<image|<script|href="http/);
    // One cell per grid point.
    const cells = svg.match(/<rect [^>]*width="22" height="22"/g) ?? [];
    expect(cells.length).toBeGreaterThanOrEqual(
      phase6TemperatureGrid().length * PHASE6_SIGMA_FRACTIONS.length,
    );
  });

  it("carries its provenance into the image", () => {
    // A diagram that escapes into a slide deck must still say which protocol produced it.
    const svg = phase6RenderDiagram(syntheticGrid(), "protocol abc123 · head def456");
    expect(svg).toContain("protocol abc123");
    expect(svg).toContain("head def456");
  });

  it("draws the reference boundaries where the reference puts them", () => {
    const svg = phase6RenderDiagram(syntheticGrid(), "x");
    for (const boundary of PHASE6_NAKAYA_BOUNDARIES_C) {
      expect(svg).toContain(`${boundary} °C`);
    }
  });

  it("marks an excluded run as excluded rather than as a habit", () => {
    const scored = phase6SweepGrid().map((point) =>
      phase6ScorePoint(point, result(0.38, { allConverged: point.tempC !== -15 })),
    );
    const svg = phase6RenderDiagram(scored, "x");
    // The hatch pattern is only emitted for invalid points.
    expect(svg).toContain('fill="url(#excluded)"');
    expect(svg).toContain("excluded by name");
  });

  it("escapes the subtitle rather than injecting it", () => {
    const svg = phase6RenderDiagram(syntheticGrid(), '<script>alert("x")</script>');
    expect(svg).not.toContain("<script>");
    expect(svg).toContain("&lt;script&gt;");
  });

  it("draws the scored CLASS, never its own reading of the aspect ratio", () => {
    // The regression this guards: a renderer that re-derived habit from AR could disagree with
    // the report it illustrates. So feed it a point whose class CONTRADICTS its ratio — class
    // "column" on an aspect ratio of 0.3, which the protocol would call a plate — and check the
    // rendered colour follows the class.
    const grid = phase6SweepGrid();
    const first = grid[0];
    if (first === undefined) throw new Error("empty grid");
    const contradictory: Phase6ScoredPoint = {
      point: first,
      result: result(0.3),
      modelClass: "column",
      regime: "plates-warm",
      score: "disagree",
      inAmbiguityBand: false,
      inHeadlineScope: true,
      extentFragile: false,
      exclusionReason: null,
    };
    const svg = phase6RenderDiagram([contradictory], "x");
    const columnFill = "#d95f0e";
    const plateFill = "#2c7fb8";
    expect(svg).toContain(columnFill);
    // Only the legend swatch should carry the plate colour, not a grid cell — one occurrence.
    expect((svg.match(new RegExp(plateFill, "g")) ?? []).length).toBe(1);
  });
});
