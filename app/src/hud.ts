// Depletion HUD pure parts (A3-4): a bounded time series of the depletion ratio and its
// mapping to sparkline polyline points. The ratio values themselves come exclusively from
// @vcc/core's centerRimDepletion via the worker's Metrics bundle — nothing here recomputes
// the metric.

export interface RatioSample {
  readonly tick: number;
  readonly ratio: number;
}

/**
 * Append a sample, keeping the series tick-monotone and bounded. Repeated ticks (forced
 * snapshots after pause/step) are skipped; non-finite ratios are recorded as NaN gaps so the
 * sparkline shows honestly where the metric was undefined.
 */
export function pushSample(
  series: RatioSample[],
  tick: number,
  ratio: number,
  maxSamples: number,
): void {
  const last = series.length > 0 ? series[series.length - 1] : null;
  if (last !== null && tick <= last.tick) return;
  series.push({ tick, ratio: Number.isFinite(ratio) ? ratio : Number.NaN });
  if (series.length > maxSamples) series.splice(0, series.length - maxSamples);
}

/**
 * Map the series to canvas polyline points. x spans the series' tick range across [0, width];
 * y maps ratio 0 -> height (bottom) and yMax -> 0 (top), clamped. NaN samples produce breaks
 * (null entries) so undefined stretches are not drawn as fake lines.
 */
export function polylinePoints(
  series: readonly RatioSample[],
  width: number,
  height: number,
  yMax: number,
): Array<[number, number] | null> {
  if (series.length === 0) return [];
  const t0 = series[0].tick;
  const t1 = series[series.length - 1].tick;
  const span = t1 > t0 ? t1 - t0 : 1;
  return series.map((s) => {
    if (Number.isNaN(s.ratio)) return null;
    const x = ((s.tick - t0) / span) * width;
    const clamped = s.ratio < 0 ? 0 : s.ratio > yMax ? yMax : s.ratio;
    const y = height * (1 - clamped / yMax);
    return [x, y];
  });
}

/** y pixel of a reference ratio line (e.g. ratio = 1) under the same mapping. */
export function referenceLineY(height: number, yMax: number, ratio: number): number {
  const clamped = ratio < 0 ? 0 : ratio > yMax ? yMax : ratio;
  return height * (1 - clamped / yMax);
}
