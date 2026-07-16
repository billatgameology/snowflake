// Perceptually monotone colormap for overlays and slices (A3-1/A3-2): a compact viridis
// ramp, linearly interpolated between anchor points sampled from the published colormap.
// Viridis is designed to be perceptually uniform with monotonically increasing luminance —
// the test suite asserts the luminance monotonicity survives our interpolation.
//
// Pure (no three.js, no DOM) so it unit-tests in node. Values are sRGB floats in [0, 1];
// convert with srgbToLinear before writing into linear-workspace GPU attributes.

/** Viridis anchors at t = 0, 1/8, ..., 1 (matplotlib reference values). */
const VIRIDIS_ANCHORS: ReadonlyArray<readonly [number, number, number]> = [
  [0.267004, 0.004874, 0.329415],
  [0.275191, 0.194905, 0.496005],
  [0.229739, 0.322361, 0.545706],
  [0.172719, 0.448791, 0.557885],
  [0.127568, 0.566949, 0.550556],
  [0.157851, 0.683765, 0.501686],
  [0.369214, 0.788888, 0.382914],
  [0.678489, 0.863742, 0.189503],
  [0.993248, 0.906157, 0.143936],
];

/** Distinct "no data" gray for NaN/undefined values — never a ramp color, so it reads as absent. */
export const NO_DATA_SRGB: readonly [number, number, number] = [0.42, 0.4, 0.45];

/** Viridis at t (clamped to [0, 1]); NaN maps to NO_DATA_SRGB. Returns sRGB floats. */
export function viridis(t: number): [number, number, number] {
  if (Number.isNaN(t)) return [NO_DATA_SRGB[0], NO_DATA_SRGB[1], NO_DATA_SRGB[2]];
  const clamped = t < 0 ? 0 : t > 1 ? 1 : t;
  const scaled = clamped * (VIRIDIS_ANCHORS.length - 1);
  const lo = Math.min(Math.floor(scaled), VIRIDIS_ANCHORS.length - 2);
  const frac = scaled - lo;
  const c0 = VIRIDIS_ANCHORS[lo];
  const c1 = VIRIDIS_ANCHORS[lo + 1];
  return [
    c0[0] + (c1[0] - c0[0]) * frac,
    c0[1] + (c1[1] - c0[1]) * frac,
    c0[2] + (c1[2] - c0[2]) * frac,
  ];
}

/**
 * Map a value into [0, 1] over [min, max], clamped. Degenerate ranges (max <= min) return 0
 * rather than dividing by zero. NaN passes through (the caller decides how to show no-data).
 */
export function normalizeToUnit(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return Number.NaN;
  if (!(max > min)) return 0;
  const t = (value - min) / (max - min);
  return t < 0 ? 0 : t > 1 ? 1 : t;
}

/** Standard sRGB electro-optical transfer: sRGB component -> linear component. */
export function srgbToLinear(c: number): number {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

/** Relative luminance (Rec. 709 weights) of an sRGB triple — the monotonicity test metric. */
export function relativeLuminance(rgb: readonly [number, number, number]): number {
  return (
    0.2126 * srgbToLinear(rgb[0]) + 0.7152 * srgbToLinear(rgb[1]) + 0.0722 * srgbToLinear(rgb[2])
  );
}
