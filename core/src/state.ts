// Solver state (gg-machinery §2): three fields per cell on the flat lattice.
// The 3D model has no separate crystal-mass field — frozen mass lives in b.

import type { Dims } from "./lattice.ts";
import type { GGParams } from "./params.ts";

/**
 * Far-field boundary condition (charter §2.4). Phase 2a implements REFLECTING only — it is
 * the G-G-fidelity condition and what makes mass conservation exact. "dirichlet" is declared
 * so the checkpoint format carries the condition from day one (results are never compared
 * across conditions silently, charter §3.3); the solver implements it in Phase 2b.
 */
export type FarFieldCondition = "reflecting" | "dirichlet";

/**
 * Active-domain shape (finding, 2026-07-14, recorded in the Phase 2 plan): a rectangular
 * axial box is a RHOMBUS in cartesian space — its walls sit at unequal hex distances from
 * the center (C2 symmetry, not C6), and an even nz puts unequal z-reservoirs above and below
 * the seed plane. Under the reflecting condition the walls therefore feed the crystal
 * anisotropically, and exact D6h symmetry is geometrically impossible once the depletion
 * field reaches a wall (measured: a systematic Δb ≈ 0.03 between zmirror partners by tick
 * 269 on nz=16). G-G themselves ran "a finite lattice in the shape of hexagonal prism"
 * (paper §III). "hexPrism" masks the active region to an inscribed hexagonal prism with a
 * zmirror-symmetric z-range; masked cells are inert walls under the same reflecting rule.
 */
export type DomainShape = "box" | "hexPrism";

export interface SolverState {
  readonly dims: Dims;
  tick: number;
  /** PRNG seed; with noiseEpsilon the complete description of the noise realization. */
  readonly rngSeed: number;
  /** epsilon of gg-machinery §6; 0 = noise off. Published guidance: order 1e-5. */
  readonly noiseEpsilon: number;
  readonly farField: FarFieldCondition;
  readonly domain: DomainShape;
  readonly params: GGParams;
  /** Attachment flag, 0/1. a = 1 iff the site is in the crystal. */
  readonly a: Uint8Array;
  /** Boundary mass — quasi-liquid when a = 0, frozen ice when a = 1. */
  readonly b: Float64Array;
  /** Diffusive mass — water vapor. 0 forever on attached sites. */
  readonly d: Float64Array;
  /** Crystal/symmetry center (a lattice site). */
  readonly center: readonly [number, number, number];
}
