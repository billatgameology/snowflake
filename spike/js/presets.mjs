// spike/js/presets.mjs — built-in preset journeys. DOM-free.
//
// Presets are what make the first five minutes of a play session about
// *designing*, not about finding the model's narrow good band (plan, Steps).
// All values were curated by experiment on 2026-07-14 (node runs of the sim
// core; ballparks, not citations — this is a toy model).
//
// A finding from that curation, useful when designing journeys: reiterBeta
// (background vapor) is a rim boundary condition plus the initial field, so
// mid-journey reiterBeta changes reach the crystal only slowly, by diffusing
// in from the far edge. Immediate mid-journey drama comes from reiterGamma
// (acts directly on receptive cells) and reiterAlpha (global mixing speed).

import { makeHistory, makeSegment } from './history.mjs';

export const PRESET_GRID_SIZE = 200;

export const PRESETS = [
  makeHistory('Preset — steady growth', PRESET_GRID_SIZE, [
    makeSegment(620, 1.0, 0.60, 0.0001),
  ]),
  makeHistory('Preset — boost then starve', PRESET_GRID_SIZE, [
    makeSegment(300, 1.0, 0.40, 0.020),
    makeSegment(500, 1.0, 0.40, 0.004),
  ]),
  makeHistory('Preset — branch then fill', PRESET_GRID_SIZE, [
    makeSegment(420, 1.0, 0.62, 0.0),
    makeSegment(110, 1.0, 0.62, 0.012),
  ]),
  makeHistory('Preset — calm, then stormy', PRESET_GRID_SIZE, [
    makeSegment(250, 0.5, 0.55, 0.001),
    makeSegment(370, 2.0, 0.55, 0.0),
  ]),
];
