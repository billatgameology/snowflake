# Plan — gut-check animation selection and portable queue

- **Phase:** Pre-Phase 7 product tooling; maker-directed 2026-08-23. Not a charter phase gate.
- **Status:** in progress
- **Started:** 2026-08-23
- **Last touched:** 2026-08-23 by OpenAI Codex (GPT-5)

## Goal

Let the maker select project-generated snowflake meshes beside their preview images, preserve that
selection as a portable manifest, split it deterministically into disjoint batches, and render each
selected final mesh as a web-ready turntable/flyaround on either this checkout or another computer.
Each worker writes only its own batch directory so worktrees and hosts can reconcile records later
without two processes rewriting one shared result file.

## Done when

- Every generated-crystal preview with an available final mesh has a keyboard-accessible selection
  control and visible selected state.
- Selections survive reload locally, are mirrored to a repository-local ignored queue file when the
  loopback development server is available, and can be exported/imported as strict
  `gutcheck-animation-queue-v1` JSON.
- A CLI validates the queue against tracked spec identities, partitions it deterministically into
  any positive batch count, and emits exact batch manifests plus commands for local or second-host
  execution.
- A dry run proves batch A and batch B are disjoint and exhaustive. The execution path prepares
  `gutcheck-mesh-v2q` assets and deterministic scene recipes from existing final meshes; workers
  use distinct output/record roots and may target NAS `_control/staging/` without mutating an
  immutable public collection.
- The focused browser/CLI tests and exact `npm test` pass.

## Approach

Extend the generated index rows with stable queue metadata rather than reverse-engineering IDs from
display labels. The page keeps selection state in `localStorage` so the static site still works,
and the loopback Vite server accepts the same strictly validated manifest at one bounded endpoint so
the list is also visible to command-line tooling. Export/import remains the portable authority.

Use the already measured web format, `gutcheck-mesh-v2q`: u16 bounding-box positions,
octahedral signed-byte normals, and the narrowest safe index representation. The Phase 7 prep
measurement was 62.9 MB raw v1 → 41.9 MB raw v2q → 18.3 MB v2q over gzip, with 51.5 dB PSNR and
no eyeballed artifact at 1200 px. That is the maker's remembered “under 20 MB” result. It applies
to the measured single hero mesh over HTTP compression; it is not a promise that every mesh or a
whole growth timeline is below 20 MB.

Animation jobs consume the existing final mesh and render a short deterministic camera flyaround;
they do not rerun the solver. The queue pins the look, dimensions, duration, frame rate, web mesh
format, and source logical NAS asset. Sorted IDs are assigned round-robin to batches, which is
stable across hosts and balances an unknown mix better than contiguous alphabetical chunks.
Mutable multi-host output goes below an explicit per-queue/per-batch root (local `out/` by default,
or NAS `_control/staging/` when supplied). Publishing a completed result set into immutable
`collections/` remains a separate governed transaction after reconciliation.

## Steps

- [ ] Add queue metadata to generated index rows and extend the strict serving validator.
- [ ] Add preview-adjacent selection controls, selected-count panel, local persistence, loopback
      persistence, clear, JSON import, and JSON export.
- [ ] Implement the strict shared queue schema and the loopback save/load handler with size,
      method, content-type, candidate-identity, and path checks.
- [ ] Implement deterministic batch planning and dry-run execution commands with disjoint output
      and record roots; extend the portable workpack selector to accept exact batch IDs.
- [ ] Prepare v2q meshes and deterministic static-mesh scene recipes in the execution path without
      starting a real render before the maker has selected items.
- [ ] Verify one browser selection/reload/export round trip, an import round trip, batch
      disjointness/exhaustiveness, path refusals, focused tests, and exact `npm test`.
- [ ] Update this plan and `docs/PROGRESS.md` with the completed commands, measured counts, and the
      next concrete action for running the maker's exported queue.

## Out of scope

- Starting expensive animation renders before the maker has made a selection.
- Treating NAS staging as durable publication, adding a new served collection, or bypassing the
  catalogue/transaction rules in decision 0051.
- Replacing the recorded look, changing solver behavior, generating new crystal morphology, or
  claiming validation from aesthetic selections.
- Promise that every web mesh or encoded video is below 20 MB; the queue records actual output
  sizes and the measured 18.3 MB result stays scoped to its named hero.

## Tried and rejected

- **Browser-only state as the sole record.** `localStorage` is useful for reloads but another
  worktree, host, or agent cannot consume it reliably. Keep it as the static-site fallback and
  export/mirror a strict manifest.
- **One shared result root and one shared record file for all workers.** The Phase 6 concurrent
  writer incident lost a multi-hour measurement. Each batch gets an exclusive directory and
  immutable item identities; reconciliation happens after workers finish.
- **Writing completed output directly into the current public generated collection.** That
  collection is immutable and catalogue-governed. Workers may write only local scratch or an
  explicit NAS staging root; final publication is a later transaction.
- **Regrowing selected crystals to animate them.** The final meshes already exist. A camera
  animation over those meshes is faster, cheaper, and exactly matches what the maker selected.

## Open questions

- After the first queued samples are rendered, the maker may choose a different duration, camera
  path, look, or video aspect ratio. Those are queue-level render settings and do not change the
  selection/batching design.
- Final immutable NAS collection ID/version and retention policy are chosen at publication time,
  after actual output counts and byte sizes are known.
