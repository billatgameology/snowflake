// The `grow-lk` CLI defaults, factored out so a frozen-protocol preflight can CHECK them.
//
// Why this module exists. ADR 0031 found that the Phase 6 sweep ran `CAK_A1` while the protocol
// registered an interpolated `A_prism`, because `phase6PointCommand` emitted no `--param-set` and
// the CLI default supplied one. The audit of 2026-07-29 then found the same shape of hole is still
// open in seven more places: `relaxTol`, `divTol`, `noiseEpsilon`, `rngSeed`, `pressurePa`,
// `seedRadius`, `seedThickness` and `relaxMaxSweeps` all reach a sweep run through this defaults
// object, and four of them have no CLI flag at all so they CANNOT be passed explicitly.
//
// Every one of them currently MATCHES its registered value — the sweep was lucky, not correct by
// construction. `phase6AssertDefaultsMatchProtocol` in phase6-sweep.ts turns that luck into a
// checked invariant: if anyone edits a default here, or edits a registered value there, preflight
// fails and no evidence is produced.
//
// It lives in its own module because `main.ts` imports `phase6-sweep.ts`, so `phase6-sweep.ts`
// cannot import `main.ts` back without a cycle.
//
// **Changing any value here is a protocol-affecting change** even though this file is not hashed:
// a value that reaches a run is a value the protocol registers. Route it through an ADR.

import type { FarFieldCondition, LKSurfacePolicy } from "@vcc/core";

export interface GrowLKDefaults {
  readonly surfacePolicy: LKSurfacePolicy;
  readonly farField: FarFieldCondition;
  readonly dims: { readonly nx: number; readonly ny: number; readonly nz: number };
  readonly dxUm: number;
  readonly paramSet: "CAK_A1" | "CAK";
  readonly cfl: number;
  readonly tol: number;
  readonly steps: number;
  readonly targetExtent: number;
  readonly seed: number;
  readonly noise: number;
  readonly metricsEvery: number;
  readonly pressurePa: number;
  readonly seedRadius: number;
  readonly seedThickness: number;
  readonly relaxMaxSweeps: number;
  readonly divTol: number;
}

/**
 * The parser's starting point. `surfacePolicy` and `farField` are deliberately the PRE-Phase-6
 * values so every executed Phase 2b/4/5 command still replays byte for byte; Phase 6 overrides
 * both explicitly on the command line, which is why the mismatch is safe here and checked there.
 */
export const GROW_LK_DEFAULTS: GrowLKDefaults = {
  surfacePolicy: "aggregate-hv-g1h1-v5",
  farField: "dirichlet",
  dims: { nx: 96, ny: 96, nz: 96 },
  dxUm: 0.35,
  paramSet: "CAK_A1",
  cfl: 0.1,
  tol: 1e-9,
  steps: 100_000,
  targetExtent: 60,
  seed: 1,
  noise: 0,
  metricsEvery: 100,
  pressurePa: 101_325,
  seedRadius: 2,
  seedThickness: 1,
  relaxMaxSweeps: 200_000,
  divTol: 1e-7,
} as const;

/**
 * Parameters the Phase 6 sweep passes EXPLICITLY on every child command line. Anything registered
 * by the protocol and absent from this list reaches the run through `GROW_LK_DEFAULTS` and must be
 * checked against the registered value instead.
 */
export const PHASE6_EXPLICIT_FLAGS = [
  "--temp-c",
  "--sigma-inf",
  "--dims",
  "--dx-um",
  "--cfl",
  "--target-extent",
  "--surface-policy",
  "--far-field",
  "--param-set",
] as const;

/**
 * Registered parameters that have NO CLI flag, so they can only ever arrive as a default. Listed
 * by name so the preflight check cannot silently stop covering one.
 */
export const PHASE6_UNFLAGGED_PARAMETERS = [
  "pressurePa",
  "seedRadius",
  "seedThickness",
  "relaxMaxSweeps",
] as const;

/**
 * Which `GROW_LK_DEFAULTS` key each explicitly-passed flag overrides.
 *
 * Pin-register recommendation 14. The previous checks were both *enumerated*: a hand-kept list of
 * flags and a hand-kept table of default-backed parameters. Two hand-kept lists cannot prove they
 * cover a third thing, and they didn't — `steps` was in neither, so mutating its default moved no
 * hash, failed no test, and let a five-step run be scored as a habit measurement.
 *
 * With this map, preflight iterates the DEFAULTS OBJECT itself and requires every key to be
 * accounted for. A new field added to `GrowLKDefaults` fails preflight until someone says which
 * bucket it belongs in — which is the property an enumerated list can never have.
 */
export const PHASE6_DEFAULT_KEY_FLAGS: Readonly<Record<string, string>> = {
  surfacePolicy: "--surface-policy",
  farField: "--far-field",
  dims: "--dims",
  dxUm: "--dx-um",
  paramSet: "--param-set",
  cfl: "--cfl",
  targetExtent: "--target-extent",
};

/**
 * Defaults that CANNOT change a run's physics, each with the reason it cannot.
 *
 * This bucket is deliberately hard to qualify for: it means the value is provably absent from the
 * numerical path, not merely believed harmless. `steps` was the tempting candidate and is exactly
 * the one that does not qualify — a loop bound decides when measurement happens, so it decides what
 * is measured. It is registered on the fixture instead.
 */
export const PHASE6_RESULT_IRRELEVANT_DEFAULTS: Readonly<Record<string, string>> = {
  metricsEvery: "controls how often a progress line is printed; read only by console.log, and the " +
    "sweep passes --metrics-every 100000 to silence it. No solver state depends on it",
};
