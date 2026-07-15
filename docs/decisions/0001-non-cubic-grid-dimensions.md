# 0001 — Grid dimensions are (nx, ny, nz), not N³

- **Date:** 2026-07-14
- **Status:** accepted
- **Charter impact:** §3.1 and §3.2 updated in this session (the `128³ / 256³ / 384³ / 512³`
  resolution-mode language)

## Context

The charter consistently describes simulation size as a single cubic number: the CPU oracle at
"96³–128³", and Phase 5's resolution modes as "128³ dev / 256³ preview / 384³ detailed / 512³
bake". Read literally, that implies one scalar resolution parameter and a cubic domain.

The morphologies the project exists to produce are not cubic, and are not even close.

Reading the Gravner–Griffeath case studies (see [gg-machinery.md](../gg-machinery.md) §8 — link
updated 2026-07-14; originally pointed at `gg-model.md` §7, split by decision 0003) against their
reported sizes: their plate reaches a radius of about 350 lattice units while remaining a *plate*
— a handful of cells thick. That wants a domain around 800 × 800 × 80. Their needles and columns
are the transpose: narrow in the T-plane, long in Z. A cube large enough to contain the plate is
~10× the cells actually needed, and a cube sized for a column is the same waste rotated.

The charter's own §3.3 guardrail says model validity outranks compute, and that surplus budget
should go to diffusion iterations, observability and sweeps *before* resolution. Spending an
order of magnitude of the grid on empty vapor is the exact opposite of that. It matters most in
Phase 6, where the value of the sweep harness is runs-per-night.

The decision has to be made now rather than later because it is not a local change. It threads
through the flat index arithmetic, the checkpoint format, the WGSL bind groups and workgroup
dispatch shape, and every buffer-size limit calculation in Phase 5. Retrofitting it after the GPU
port would mean rewriting the port.

## Decision

Domain size is **three independent integers `(nx, ny, nz)`** everywhere: in `core`, in the
checkpoint header, in the CLI, in the WGSL dispatch, and in the resolution presets.

There is no scalar "resolution" parameter anywhere in the codebase. Resolution *modes* survive as
named presets, but each names a triple chosen to fit the morphology it targets, not a cube.

## Consequences

**Buys.** Plates and columns each get a domain that fits them, so the same cell budget reaches
substantially further in the direction that matters. Phase 6's sweeps get more runs per night out
of the 4080 for free. Buffer-limit arithmetic in Phase 5 gets easier, not harder, because the
binding size is driven by the field that is actually large.

**Costs.** Three numbers to thread instead of one, and three places to get the index math wrong
instead of one. Anisotropic domains make some conveniences harder — a single "domain radius" for
the 80%-of-domain stopping rule becomes per-axis, and the symmetry metric has to be told which
axis is the c-axis rather than assuming.

**Forecloses.** Nothing. A cube is `nx = ny = nz`, still expressible, and the dev preset may well
stay near-cubic.

**Live trap.** The 6-fold symmetry lives in the T-plane, so `nx` and `ny` are *not* freely
independent of each other in the way `nz` is: the triangular lattice's axial coordinates are
skewed, so a domain with `nx = ny` is a rhombus in real space, not a hexagon, and its corners are
not equidistant from the seed. This does not break the physics — the crystal simply must not
reach the domain edge, which the 80% stopping rule already enforces — but any metric that assumes
"distance to domain edge" is isotropic is wrong. Flagged here so it is not rediscovered as a
mysterious symmetry-metric failure.

## Alternatives considered

**Keep N³ and just pick N large enough for the worst case.** Loses roughly an order of magnitude
of cells to empty vapor for plate morphologies, which is precisely the compute the charter wants
spent on diffusion iterations and sweeps instead. It also silently caps the interesting parameter
regimes: the aspect-ratio sweep at the heart of Phase 4 runs from plate to column, so *every*
cube is badly sized for one end of the sweep or the other.

**Keep N³ for v1 and generalise at the Phase 5 gate.** Superficially attractive — nothing before
Phase 5 is compute-bound. Rejected because the generalisation lands in exactly the code that is
hardest to change and worst to debug (WGSL index arithmetic over flat storage buffers), and the
charter itself warns that "a swapped coordinate is a silent physics bug." Doing it in inspectable
TypeScript first, with the CPU oracle to check against, costs almost nothing now and a great deal
later.

**Anisotropic but with a fixed aspect per preset (e.g. always 4:1).** A middle road with no
constituency: it carries all the complexity of three integers while still fitting no morphology
particularly well.
