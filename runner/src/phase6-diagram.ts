// Phase 6 WP2 — the diagram artifact.
//
// Renders the swept grid in the reference's own coordinates so the two can be looked at side by
// side: temperature falling left to right, supersaturation rising upward, with the digitized
// habit-boundary temperatures drawn where the reference puts them.
//
// It is a REPORT of the scored grid, not a second opinion on it. Every class, score, exclusion
// and band membership it draws is read from the scored points; this file chooses colours and
// nothing else. In particular it must never re-derive a habit from an aspect ratio — that rule
// lives in the protocol, and a renderer that reimplemented it could disagree with the report it
// illustrates.

import {
  PHASE6_AMBIGUITY_HALF_WIDTH_C,
  PHASE6_NAKAYA_BOUNDARIES_C,
  PHASE6_SIGMA_FRACTIONS,
  phase6TemperatureGrid,
  type Phase6ModelClass,
} from "./phase6-protocol.ts";
import type { Phase6ScoredPoint } from "./phase6-sweep.ts";

/** Deliberately colour-blind-safe and distinguishable in greyscale by lightness. */
const CLASS_FILL: Record<Phase6ModelClass, string> = {
  plate: "#2c7fb8", // blue, dark
  column: "#d95f0e", // orange, mid
  neutral: "#dddddd", // light grey — visually recedes, which is honest: it is "no habit"
  invalid: "#ffffff", // white with a hatch stroke; an excluded run must not read as a result
};

const LAYOUT = {
  cell: 22,
  padLeft: 92,
  padRight: 210,
  padTop: 64,
  padBottom: 64,
} as const;

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Render the scored grid to a standalone SVG.
 *
 * `subtitle` carries the provenance line — protocol hash and commit — into the image itself, so
 * a diagram that escapes into a slide still says which protocol produced it.
 */
export function phase6RenderDiagram(
  scored: readonly Phase6ScoredPoint[],
  subtitle: string,
  /**
   * Which arm this diagram shows. Defaulted to arm 1 because that is what every existing caller
   * renders, and passed explicitly by the sweep so an arm-2 figure cannot escape captioned as
   * arm 1's — which the hard-coded title used to guarantee it would.
   */
  armLabel = "no-SDAK (CAK)",
): string {
  const temps = phase6TemperatureGrid();
  const fractions: number[] = [...PHASE6_SIGMA_FRACTIONS];
  const width = LAYOUT.padLeft + temps.length * LAYOUT.cell + LAYOUT.padRight;
  const height = LAYOUT.padTop + fractions.length * LAYOUT.cell + LAYOUT.padBottom;
  const xOf = (tempC: number): number =>
    LAYOUT.padLeft + temps.indexOf(tempC) * LAYOUT.cell;
  // Supersaturation rises UPWARD, as in the reference figure.
  const yOf = (fraction: number): number =>
    LAYOUT.padTop + (fractions.length - 1 - fractions.indexOf(fraction)) * LAYOUT.cell;
  const byKey = new Map(scored.map((s) => [`${s.point.tempC}|${s.point.fraction}`, s]));

  const parts: string[] = [];
  parts.push(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" ` +
      `viewBox="0 0 ${width} ${height}" font-family="system-ui,sans-serif">`,
    `<rect width="${width}" height="${height}" fill="#ffffff"/>`,
    `<defs><pattern id="excluded" width="6" height="6" patternUnits="userSpaceOnUse" ` +
      `patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="6" stroke="#b00" ` +
      `stroke-width="1.5"/></pattern></defs>`,
    `<text x="${LAYOUT.padLeft}" y="26" font-size="16" font-weight="600">` +
      `Phase 6 — ${escapeXml(armLabel)} habit over the registered (T, σ) grid</text>`,
    `<text x="${LAYOUT.padLeft}" y="46" font-size="11" fill="#555">${escapeXml(subtitle)}</text>`,
  );

  // Ambiguity bands behind everything: the reader should see immediately which columns do not
  // count as evidence, rather than discovering it in a caption.
  const plotTop = LAYOUT.padTop;
  const plotHeight = fractions.length * LAYOUT.cell;
  for (const tempC of temps) {
    const scoredHere = byKey.get(`${tempC}|${fractions[0] as number}`);
    if (scoredHere?.inAmbiguityBand !== true) continue;
    parts.push(
      `<rect x="${xOf(tempC)}" y="${plotTop}" width="${LAYOUT.cell}" height="${plotHeight}" ` +
        `fill="#fff3cd"/>`,
    );
  }

  // Reference boundaries, drawn at their digitized temperatures rather than snapped to a cell.
  const axisXOf = (tempC: number): number => {
    // Linear in grid index; the axis is uniform 1 °C by registration.
    const warmest = temps[0] as number;
    return LAYOUT.padLeft + (warmest - tempC) * LAYOUT.cell + LAYOUT.cell / 2;
  };
  for (const boundary of PHASE6_NAKAYA_BOUNDARIES_C) {
    const x = axisXOf(boundary);
    parts.push(
      `<line x1="${x.toFixed(1)}" y1="${plotTop - 8}" x2="${x.toFixed(1)}" ` +
        `y2="${plotTop + plotHeight + 8}" stroke="#111" stroke-width="1.5" ` +
        `stroke-dasharray="5 3"/>`,
      `<text x="${x.toFixed(1)}" y="${plotTop - 12}" font-size="10" text-anchor="middle">` +
        `${boundary} °C</text>`,
    );
  }

  for (const tempC of temps) {
    for (const fraction of fractions) {
      const point = byKey.get(`${tempC}|${fraction}`);
      const x = xOf(tempC);
      const y = yOf(fraction);
      if (point === undefined) {
        parts.push(
          `<rect x="${x}" y="${y}" width="${LAYOUT.cell}" height="${LAYOUT.cell}" ` +
            `fill="#ffffff" stroke="#e0e0e0"/>`,
        );
        continue;
      }
      const fill = CLASS_FILL[point.modelClass];
      parts.push(
        `<rect x="${x}" y="${y}" width="${LAYOUT.cell}" height="${LAYOUT.cell}" ` +
          `fill="${fill}" stroke="#ffffff" stroke-width="1"/>`,
      );
      if (point.modelClass === "invalid") {
        parts.push(
          `<rect x="${x}" y="${y}" width="${LAYOUT.cell}" height="${LAYOUT.cell}" ` +
            `fill="url(#excluded)" stroke="#b00" stroke-width="1"/>`,
        );
      }
      // A disagreement inside the headline scope is the quantity the phase is about, so it is
      // marked. Disagreements outside it are not — marking them would imply they were scored.
      if (point.score === "disagree" && point.inHeadlineScope) {
        parts.push(
          `<circle cx="${x + LAYOUT.cell / 2}" cy="${y + LAYOUT.cell / 2}" r="3.2" ` +
            `fill="none" stroke="#111" stroke-width="1.6"/>`,
        );
      }
      if (point.extentFragile) {
        parts.push(
          `<path d="M ${x + 2} ${y + LAYOUT.cell - 2} L ${x + 7} ${y + LAYOUT.cell - 2}" ` +
            `stroke="#111" stroke-width="2"/>`,
        );
      }
    }
  }

  // Axes.
  for (const tempC of temps) {
    if (tempC % 5 !== 0) continue;
    parts.push(
      `<text x="${xOf(tempC) + LAYOUT.cell / 2}" y="${plotTop + plotHeight + 18}" ` +
        `font-size="10" text-anchor="middle">${tempC}</text>`,
    );
  }
  parts.push(
    `<text x="${LAYOUT.padLeft + (temps.length * LAYOUT.cell) / 2}" ` +
      `y="${plotTop + plotHeight + 38}" font-size="11" text-anchor="middle">` +
      `temperature (°C)</text>`,
  );
  for (const fraction of fractions) {
    parts.push(
      `<text x="${LAYOUT.padLeft - 10}" y="${yOf(fraction) + LAYOUT.cell / 2 + 4}" ` +
        `font-size="10" text-anchor="end">${fraction.toFixed(2)}</text>`,
    );
  }
  parts.push(
    `<text transform="translate(24 ${plotTop + plotHeight / 2}) rotate(-90)" font-size="11" ` +
      `text-anchor="middle">σ∞ / σ_water</text>`,
  );

  // Legend.
  const legendX = LAYOUT.padLeft + temps.length * LAYOUT.cell + 24;
  let legendY = plotTop + 4;
  const legendRow = (fill: string, label: string, hatch = false): void => {
    parts.push(
      `<rect x="${legendX}" y="${legendY}" width="14" height="14" fill="${fill}" ` +
        `stroke="#999"/>`,
    );
    if (hatch) {
      parts.push(
        `<rect x="${legendX}" y="${legendY}" width="14" height="14" fill="url(#excluded)" ` +
          `stroke="#b00"/>`,
      );
    }
    parts.push(
      `<text x="${legendX + 20}" y="${legendY + 11}" font-size="11">${escapeXml(label)}</text>`,
    );
    legendY += 20;
  };
  legendRow(CLASS_FILL.plate, "plate  (AR ≤ 0.667)");
  legendRow(CLASS_FILL.column, "column (AR ≥ 1.5)");
  legendRow(CLASS_FILL.neutral, "neutral — no habit");
  legendRow(CLASS_FILL.invalid, "excluded by name", true);
  legendY += 6;
  parts.push(
    `<circle cx="${legendX + 7}" cy="${legendY + 7}" r="3.2" fill="none" stroke="#111" ` +
      `stroke-width="1.6"/>`,
    `<text x="${legendX + 20}" y="${legendY + 11}" font-size="11">scored disagreement</text>`,
  );
  legendY += 20;
  parts.push(
    `<rect x="${legendX}" y="${legendY}" width="14" height="14" fill="#fff3cd" stroke="#999"/>`,
    `<text x="${legendX + 20}" y="${legendY + 11}" font-size="11">` +
      `ambiguity band (±${PHASE6_AMBIGUITY_HALF_WIDTH_C} °C)</text>`,
  );
  legendY += 20;
  parts.push(
    `<path d="M ${legendX + 1} ${legendY + 12} L ${legendX + 6} ${legendY + 12}" stroke="#111" ` +
      `stroke-width="2"/>`,
    `<text x="${legendX + 20}" y="${legendY + 11}" font-size="11">extent-fragile</text>`,
  );

  parts.push("</svg>");
  return parts.join("\n");
}
