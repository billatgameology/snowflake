# Plan — Phase 2a evidence and input hardening

- **Phase:** Phase 2a — CPU reference solver machinery
- **Status:** complete
- **Started:** 2026-07-15
- **Last touched:** 2026-07-15 by Codex

## Goal

Close the four defects found by the 2026-07-15 senior re-review without changing the accepted
Gravner–Griffeath dynamics: make GG checkpoints fail closed on malformed metadata and fields,
make every gate-relevant seed/noise input representable and honest, and make parameter-vector
construction enforce its stated seven-slot contract. Valid Phase 2a runs must remain bit-identical
to the accepted checkpoint.

## Done when

Phase 2a's charter criteria remain the governing milestone, copied verbatim from charter §3.2:

> - Stacked triangular lattice: flat typed arrays, index math, 6+2 neighbor lookup. Unit tests for
>   neighbor symmetry and boundary handling. Done when neighbor tests pass in all directions.
> - Vapor diffusion on the lattice, with a mass-conservation test. Done when total mass is
>   conserved to tolerance over long runs.
> - Seed + cell states + the full Gravner–Griffeath update cycle (diffusion → freezing →
>   attachment → melting), including the noise term, with the published threshold parameters.
>   Done when a crystal grows at all.
> - First scientific gate: a stable, sixfold-symmetric hexagonal plate, verified by an automated
>   symmetry check — not by eyeballing. Done when the symmetry-error metric stays under threshold
>   across a full run.
> - Crude field observability from day one: dump vapor slices and surface propensity as images. A
>   malformed crystal can look plausibly organic; a malformed field is obvious immediately.

This hardening is done when malformed GG checkpoint controls/arrays cannot encode or decode;
`--seed` accepts only a uint32; `noiseEpsilon` is enforced in `[0, 1]` at both CLI and solver
boundaries; parameter aliases cannot counterfeit seven distinct configurations; adversarial tests
pin every rejection; `npm test` passes; and the canonical 128×128×64 enforced run produces a
checkpoint byte-identical to `out/plate-gate.ckpt`.

## Approach

Use the same fail-closed pattern already established for LibbrechtKinetics checkpoints: one shared
runtime schema on both encode and decode, exact field descriptors and payload length, and semantic
validation of the GG arrays and metadata. Keep the v1 GG wire layout and property order unchanged
for valid states so the accepted artifact remains the regression oracle. Validate public
`GGSolver` inputs as well as CLI inputs; TypeScript types are not a runtime boundary. Count
parameter configurations by normalized slot, not by caller spelling.

## Steps

- [x] Make `paramVector` require every normalized `(n_T,n_Z)` slot exactly once; add an alias
      collision regression.
- [x] Validate `GGSolver` dimensions, center, seed, enums, parameters, uint32 seed, and
      `noiseEpsilon ∈ [0,1]`; mirror the seed/noise checks in the CLI.
- [x] Add a shared GG checkpoint runtime schema to encode/decode; require the exact v1 field table,
      exact payload size, valid metadata, and valid field semantics.
- [x] Compare every GG v1 header control, serialized metric, parameter, and field bit in the
      runner's round-trip check.
- [x] Add adversarial tests for short/shifted arrays, malformed headers/payloads, `--seed NaN`,
      oversized noise, and logical parameter-key aliases.
- [x] Run `npm test`, the exact canonical Phase 2a gate, and `cmp`/SHA-256 against
      `out/plate-gate.ckpt`.
- [x] Update `docs/PROGRESS.md` and this plan with exact results and any rejected approaches.

## Results

- `npm test`: 138/138 passed (14 files), including Rule 7 and TypeScript.
- Exact enforced command:
  `node runner/src/main.ts grow --preset plate --dims 128,128,64 --ticks 10000 --seed 1
  --out /tmp/phase2a-hardening.ckpt --enforce-gate`.
- Gate result: exit 0 at far-field stop tick 4800; 26,783 attached; per-tick symmetry delta
  clean; maximum full symmetry error 0; aspect ratio 0.168831; mass drift 2.056e-13; no domain
  contact; runner checkpoint round trip byte-identical.
- Artifact result: `cmp` exit 0 against `out/plate-gate.ckpt`; both SHA-256 values are
  `f1796b501564937874065d411455a02a7c8dfb673710df01f799500df0d3a389`.
- Therefore the four boundary/evidence defects are closed without changing the accepted valid
  dynamics or v1 checkpoint bytes.

## Out of scope

- Any change to the G–G stencil, four-step update cycle, presets, symmetry threshold, stopping
  rules, checkpoint version, or accepted scientific result.
- Any change to the registered Phase 2b protocol or the currently running Phase 2b process.
- New checkpoint fields or a wire-format migration; this is strict validation of v1.

## Tried and rejected

- Keeping the runner's hand-written comparison of selected fields was rejected: it had already
  omitted the seed and most header controls. Re-encoding the strict decoded state and comparing
  the entire file is simpler and covers every serialized byte.
- Serializing non-finite crystal-free morphology through JSON was rejected because JSON silently
  rewrites those values to null. Crystal-free checkpoints explicitly record `metrics: null` while
  preserving their controls and fields.
- Retaining physically invalid inert parameter sets in diffusion tests was rejected once the
  public solver boundary began enforcing the published parameter constraints. Those tests now
  call `relaxField()` directly, which is the operation they intend to isolate.

## Open questions

- None. The senior review supplied concrete reproductions and the accepted checkpoint supplies the
  required valid-input oracle.
