// Gravner-Griffeath machinery parameters (gg-machinery §3, §7, §8).
//
// The three vector parameters are indexed by boundary configuration (n_T, n_Z) with
// n_T in {0..3} (capped), n_Z in {0,1}, excluding (0,0): length-8 arrays with
// slot = n_T*2 + n_Z, slot 0 unused (poisoned with NaN so accidental reads are loud).
//
// Naming (AGENTS.md Rule 7): G-G's attachment threshold is `ggThreshBeta`, never a bare
// spelling. kappa and mu are unambiguous and keep their own names.

export interface GGParams {
  /** rho — initial/ambient vapor density, the supersaturation knob. */
  readonly rho: number;
  /** phi — drift strength (vapor drifts in -z). 0 in all §8 presets. */
  readonly phi: number;
  /** kappa(n_T, n_Z) — fraction of vapor that STAYS vapor at a boundary site. */
  readonly kappa: Float64Array;
  /** mu(n_T, n_Z) — melting rate: fraction of boundary mass returned to vapor. */
  readonly mu: Float64Array;
  /** ggThreshBeta(n_T, n_Z) — GGThreshold attachment threshold (replaced in 2b, kept forever). */
  readonly ggThreshBeta: Float64Array;
}

/** Slot index for a boundary configuration. n_T capped to 3, n_Z capped to 1 by callers. */
export function paramSlot(nT: number, nZ: number): number {
  return nT * 2 + nZ;
}

/** The 7 meaningful (n_T, n_Z) configurations, in slot order 1..7. */
export const PARAM_CONFIGS: ReadonlyArray<readonly [number, number]> = [
  [0, 1],
  [1, 0],
  [1, 1],
  [2, 0],
  [2, 1],
  [3, 0],
  [3, 1],
];

/**
 * Build a length-8 vector from per-configuration values.
 * Keys are "nT,nZ" strings; every one of the 7 configurations must be present.
 */
export function paramVector(values: Record<string, number>): Float64Array {
  const v = new Float64Array(8).fill(Number.NaN);
  const seenSlots = new Set<number>();
  for (const [key, value] of Object.entries(values)) {
    const parts = key.split(",");
    if (parts.length !== 2) throw new Error(`bad configuration key: ${key}`);
    const nT = Number(parts[0]);
    const nZ = Number(parts[1]);
    if (!Number.isInteger(nT) || !Number.isInteger(nZ) || nT < 0 || nT > 3 || nZ < 0 || nZ > 1 || (nT === 0 && nZ === 0)) {
      throw new Error(`bad configuration key: ${key}`);
    }
    const slot = paramSlot(nT, nZ);
    if (seenSlots.has(slot)) {
      throw new Error(`duplicate configuration slot (${nT},${nZ}) via key: ${key}`);
    }
    v[slot] = value;
    seenSlots.add(slot);
  }
  if (seenSlots.size !== PARAM_CONFIGS.length) {
    throw new Error(`expected all 7 configurations, got ${seenSlots.size}`);
  }
  return v;
}

function uniformVector(value: number): Record<string, number> {
  const values: Record<string, number> = {};
  for (const [nT, nZ] of PARAM_CONFIGS) values[`${nT},${nZ}`] = value;
  return values;
}

// ── Published presets (gg-machinery §8; verified against the paper 2026-07-14:
//    plate §VII, dendrite §VIII, needle §XI Fig. 29, hollow column §XI Fig. 30) ─────────────
// All have phi = 0. The dendrite series is a rho sweep 0.095-0.105; 0.1 is the classic
// stellar dendrite (Fig. 14) and is the value used here.

export type GGPresetName = "plate" | "needle" | "hollowColumn" | "dendrite";

export const GG_PRESETS: Readonly<Record<GGPresetName, GGParams>> = {
  plate: {
    rho: 0.1,
    phi: 0,
    kappa: paramVector(uniformVector(0.1)),
    mu: paramVector(uniformVector(0.001)),
    ggThreshBeta: paramVector({
      "0,1": 2.5,
      "1,0": 2,
      "1,1": 2,
      "2,0": 2,
      "2,1": 1,
      "3,0": 1,
      "3,1": 1,
    }),
  },
  needle: {
    rho: 0.1,
    phi: 0,
    kappa: paramVector(uniformVector(0.1)),
    mu: paramVector(uniformVector(0.001)),
    ggThreshBeta: paramVector({
      "0,1": 2,
      "1,0": 4,
      "1,1": 4,
      "2,0": 4,
      "2,1": 1,
      "3,0": 1,
      "3,1": 1,
    }),
  },
  hollowColumn: {
    rho: 0.1,
    phi: 0,
    kappa: paramVector(uniformVector(0.1)),
    mu: paramVector(uniformVector(0.01)),
    ggThreshBeta: paramVector({
      "0,1": 1,
      "1,0": 2,
      "1,1": 0.5,
      "2,0": 2,
      "2,1": 0.5,
      "3,0": 0.5,
      "3,1": 1,
    }),
  },
  dendrite: {
    rho: 0.1,
    phi: 0,
    kappa: paramVector(uniformVector(0.1)),
    mu: paramVector(uniformVector(0.008)),
    ggThreshBeta: paramVector({
      "0,1": 1.6,
      "1,0": 1.5,
      "1,1": 1.4,
      "2,0": 1.5,
      "2,1": 1,
      "3,0": 1,
      "3,1": 1,
    }),
  },
};

// ── Validator (gg-machinery §7) ─────────────────────────────────────────────────────────────
// Packard-regime and growth-stall bounds are ERRORS. Monotonicity is a WARNING, one per
// violated comparison — the paper's own hollow-column preset violates it twice, both into
// slot (3,1), and a hard error would reject published parameters.

export interface ParamValidation {
  readonly errors: string[];
  readonly warnings: string[];
}

const VECTOR_NAMES = ["kappa", "mu", "ggThreshBeta"] as const;

/** Adjacent-configuration comparisons for monotonicity: value should not increase. */
const MONOTONICITY_STEPS: ReadonlyArray<readonly [[number, number], [number, number]]> = [
  // +1 in n_T at fixed n_Z
  [[1, 0], [2, 0]],
  [[2, 0], [3, 0]],
  [[0, 1], [1, 1]],
  [[1, 1], [2, 1]],
  [[2, 1], [3, 1]],
  // +1 in n_Z at fixed n_T
  [[1, 0], [1, 1]],
  [[2, 0], [2, 1]],
  [[3, 0], [3, 1]],
];

export function validateParams(p: GGParams): ParamValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!(Number.isFinite(p.rho) && p.rho > 0)) errors.push(`rho must be finite and > 0, got ${p.rho}`);
  if (!(Number.isFinite(p.phi) && p.phi >= 0 && p.phi < 1)) {
    errors.push(`phi must be finite and in [0, 1), got ${p.phi}`);
  }
  for (const name of VECTOR_NAMES) {
    const v = p[name];
    if (v.length !== 8) errors.push(`${name} must have length 8, got ${v.length}`);
    for (const [nT, nZ] of PARAM_CONFIGS) {
      const value = v[paramSlot(nT, nZ)];
      if (!Number.isFinite(value)) {
        errors.push(`${name}(${nT},${nZ}) is unset`);
      } else if (name === "ggThreshBeta" ? !(value > 0) : !(value >= 0 && value <= 1)) {
        errors.push(`${name}(${nT},${nZ}) out of range: ${value}`);
      }
    }
  }
  if (errors.length > 0) return { errors, warnings }; // ranges are broken; bounds would be noise

  const s01 = paramSlot(0, 1);
  const s10 = paramSlot(1, 0);

  // Packard regime: (1 - kappa_01)*rho < ggThreshBeta_01, same at (1,0).
  for (const s of [s01, s10]) {
    const supply = (1 - p.kappa[s]) * p.rho;
    if (!(supply < p.ggThreshBeta[s])) {
      errors.push(
        `Packard bound violated at slot (${s >> 1},${s & 1}): (1-kappa)*rho = ${supply} >= ggThreshBeta = ${p.ggThreshBeta[s]}`,
      );
    }
  }

  // Growth stall: mu_01*ggThreshBeta_01 < (1 - kappa_01)*rho, same at (1,0).
  for (const s of [s01, s10]) {
    const drain = p.mu[s] * p.ggThreshBeta[s];
    const supply = (1 - p.kappa[s]) * p.rho;
    if (!(drain < supply)) {
      errors.push(
        `growth-stall bound violated at slot (${s >> 1},${s & 1}): mu*ggThreshBeta = ${drain} >= (1-kappa)*rho = ${supply}`,
      );
    }
  }

  // Monotonicity: each vector should be non-increasing in each coordinate. Warning per
  // violated comparison.
  for (const name of VECTOR_NAMES) {
    const v = p[name];
    for (const [[fT, fZ], [tT, tZ]] of MONOTONICITY_STEPS) {
      const from = v[paramSlot(fT, fZ)];
      const to = v[paramSlot(tT, tZ)];
      if (to > from) {
        warnings.push(
          `${name} increases from (${fT},${fZ})=${from} to (${tT},${tZ})=${to}; the paper assumes it decreases in each coordinate`,
        );
      }
    }
  }

  return { errors, warnings };
}
