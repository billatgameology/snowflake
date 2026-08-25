# Plan — gut-check animation selection and portable queue

- **Phase:** Pre-Phase 7 product tooling; maker-directed 2026-08-23. Not a charter phase gate.
- **Status:** complete; maker selection and animation execution continue operationally
- **Started:** 2026-08-23
- **Last touched:** 2026-08-24 by OpenAI Codex (GPT-5)

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

- [x] Add queue metadata to generated index rows and extend the strict serving validator.
- [x] Add preview-adjacent selection controls, selected-count panel, local persistence, loopback
      persistence, clear, JSON import, and JSON export.
- [x] Implement the strict shared queue schema and the loopback save/load handler with size,
      method, content-type, candidate-identity, and path checks.
- [x] Implement deterministic batch planning and dry-run execution commands with disjoint output
      and record roots; emit exact batch manifests plus Windows and POSIX NAS-worker launchers.
- [x] Prepare v2q meshes and deterministic static-mesh scene recipes in the execution path without
      starting a real render before the maker has selected items.
- [x] Verify one browser selection/reload/export round trip, an import round trip, batch
      disjointness/exhaustiveness, path refusals, focused tests, and exact `npm test`.
- [x] Update this plan and `docs/PROGRESS.md` with the completed commands, measured counts, and the
      next concrete action for running the maker's exported queue.

## Completion record

Completed 2026-08-23. The current generated index at
`out/gutcheck-gg-realism/index.json` exposes 89 exact selection candidates. A live Playwright smoke
run against `http://127.0.0.1:5173/gutcheck-index.html` selected two rows, observed both after
reload, exported two items, cleared, imported the same two items, and cleared again; the inspected
viewport is preserved at `out/gutcheck-animation-queue/selection-ui.png`. The final mirrored
`out/gutcheck-animation-queue/selection.json` is deliberately empty so the smoke test is not
mistaken for the maker's aesthetic selection.

Focused verification passed:

- `npx vitest run app/test/gutcheck-animation-queue.test.ts runner/test/vite-nas-serving.test.ts`
- `npx vitest run runner/test/gutcheck-animation-queue-cli.test.ts app/test/gutcheck-animation-queue.test.ts`
- `npm run build --workspace app`
- exact `npm test`

The CLI test executed `plan --batches 2`, reopened both manifests, proved their item sets disjoint
and exhaustive, dry-ran both workers, checked both portable launchers, and rejected an unscoped
output root. No real animation was rendered. The next action is the maker's selection, followed by
the commands recorded in `docs/PROGRESS.md`.

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

## Follow-up — figure previews and second-host operator guide (2026-08-24)

The maker confirmed that export works and selected 30 sweep rows, then identified two remaining
usability gaps: the 37 pre-sweep figure-mesh cards still have no preview or selection control, and
the second computer needs a durable run guide rather than chat context.

The historical figure side-by-side composites cannot be restored as browser content. They contain
paper/photography targets and were classified into mixed/private quarantine; decision 0051 and the
completed NAS governance plan explicitly prohibit serving private or mixed bytes through the
development server. This follow-up will regenerate project-owned preview PNGs from the public final
meshes instead. Each figure row will state that its historic source comparison remains non-served,
show the regenerated model preview, and expose the same animation selector. Existing exported queue
JSON remains valid.

### Follow-up done when

- [x] A checked-in operator guide tells a context-free second computer how to validate the repo,
      accept one batch, dry-run it, render to its exclusive NAS staging root, resume, inspect
      results, and report completion without committing generated bytes.
- [x] All public figure meshes with tracked figure records appear as normal image-bearing rows with
      keyboard-accessible animation selectors.
- [x] A bounded loopback route serves only regenerated local figure previews from one exact ignored
      directory; the route cannot address NAS, private media, arbitrary local files, or traversal.
- [x] A reproducible generator renders the figure previews from their public meshes without reading
      the private comparison composites.
- [x] Queue validation accepts the tracked figure-record provenance and exact regenerated-preview
      identity while remaining backward-compatible with the maker's exported sweep-only v1 JSON.
- [x] Browser verification proves the figure thumbnails load, the existing 30 selections survive,
      and a figure selection exports/imports; focused tests, the app build, and exact `npm test`
      pass.

### Follow-up completion record

Completed 2026-08-24. `node scripts/gutcheck-figure-previews.ts --force` rendered 33 local,
project-owned PNG previews from catalogue-authorized public figure meshes and wrote their ignored
manifest below `out/gutcheck-figure-previews/`. The rebuilt
`out/gutcheck-gg-realism/index.json` contains 33 pre-sweep figure rows with exact queue metadata,
89 generated-sweep rows, five animation-dial-in rows, and two remaining Run B interactive links
whose cards have no comparison image. Historical mixed/private composites remain non-served.

Live Playwright verification loaded all 33 figure selectors and a nonzero-width Fig. 10 thumbnail,
temporarily added Fig. 10, exported and imported the resulting queue, and preserved the maker's
30-item sweep baseline. The maker then selected 21 figure rows in their browser; the loopback
mirror at `out/gutcheck-animation-queue/selection.json` recorded 51 total items (30 sweep plus 21
figure) without manual file editing. The durable context-free second-host instructions are in
`docs/gutcheck-animation-worker-guide.md`.

Follow-up verification passed:

- `npx vitest run app/test/gutcheck-animation-queue.test.ts runner/test/gutcheck-animation-queue-cli.test.ts runner/test/vite-nas-serving.test.ts runner/test/gutcheck-build-index-catalog.test.ts`
- `npm run typecheck`
- `npm run lint:rule7`
- `npm run build --workspace app`
- exact `npm test`

### Process correction after completion

Maker direction on 2026-08-24 supersedes the verification precedent implied by this plan's original
done criteria. The full-suite runs above are retained as an accurate historical record, but they
were disproportionate for isolated website and animation-orchestration work and must not be copied
into a later product task. Future work on this queue follows `AGENTS.md` Rule 6: focused queue/UI
tests, relevant typecheck and app build, then a live smoke, dry run, or representative sample render.
Exact `npm test` and scientific gate suites apply only if the change crosses into their scientific,
evidence, gate, or root-wide contracts.

### Publication and worktree closure

PR preparation on 2026-08-24 retained exactly one task branch,
`feature/animation-generation`, with implementation/process head `c2791b3`; the other registered
worktrees are separately owned, and the dirty `phase10/evidence-verification` worktree is untouched.
Product-sized verification for the final state is the focused queue/index/serving tests,
`npm run typecheck`, `npm run build --workspace app`, the Rule 7 scan, and the live browser/HTTP
smoke recorded above. The earlier exact `npm test` result remains historical rather than a new
closure requirement. PR: [#9](https://github.com/billatgameology/snowflake/pull/9).

Before removing the task worktree, transfer the live ignored `selection.json`, regenerated figure
preview cache, and generated index into the primary worktree's corresponding `out/` paths and
verify their hashes. The two UI screenshots are reproducible inspection scratch and may be
discarded with the worktree.

### Follow-up tried and rejected

- **Re-serve the historical composites from private quarantine.** Rejected: their target halves are
  restricted/mixed source media, and loopback is not an exception to decision 0051's serving rule.
- **Embed 37 live Three.js viewers in the index.** Rejected: dozens of simultaneous WebGL contexts
  are expensive and fragile. Deterministic project-owned PNG thumbnails make selection cheap while
  each row keeps its existing interactive viewer link.

### Windows render lane repair (2026-08-24, branch fix/animation-queue-windows-spawn)

First Windows execution of the render lane (host HIL_ADMIN, Node 24.19.0, maker's exported
51-item queue). `run --nas-stage` failed before rendering anything: `npx vite build ... failed
with status null`. Root cause: `runChecked` mapped `npx` to `npx.cmd` on win32 but `spawnSync`
of a `.cmd` without a shell fails EINVAL since Node's CVE-2024-27980 (BatBadBut) hardening in
20.12+, and the error surfaced only as `status null` because `result.error` was never inspected.
The same command succeeded when run manually in a shell, isolating the spawn mechanism.

Fix (two edits in `scripts/gutcheck-animation-queue.ts`): invoke vite through its JS bin
(`process.execPath` + `node_modules/vite/bin/vite.js`) so only real executables are spawned, and
throw `result.error` from `runChecked` when the spawn itself fails. The win32 `.cmd` mapping is
removed as dead. `scene-capture.mjs`'s `ffmpeg` spawn resolves a real `.exe` and is unaffected.

- **Rejected: `shell: true` on win32.** Reintroduces cmd.exe argument-injection surface on paths
  that include a NAS staging directory; the JS-bin invocation is deterministic and needs no
  escaping rules.

Verification per this plan's process correction: focused queue tests
(`runner/test/gutcheck-animation-queue-cli.test.ts`, `app/test/gutcheck-animation-queue.test.ts`,
5/5 pass), `npm run typecheck`, then the representative sample render (single-item fig13 probe,
the queue's largest source mesh at 72.7 MB, written to the canonical batch-a NAS staging
directory so the full run resumes past it by identity).

### Follow-up: growth-event assets for the website (maker direction, 2026-08-24)

The maker reviewed the fig13 turntable and redirected the deliverable: the queue's 51 selections
need **growth animations (seed to full size)**, consumed by the separate `snowcrystal_website`
repo's Run B stage. That site replays a `gutcheck-growth-v1` asset — u32 header-length prefix,
strict JSON header, then eventCount × (u32 flat site index, u32 attach tick) little-endian,
i-fastest/j-next/k-slowest — and raymarches the arrival-tick volume directly; no meshes, no MP4,
~8 bytes per attached site (run B: 7.7 MB for 961,597 events). The original baker
(`gutcheck-bake-growth.ts`) lives only on an unmerged Mac exploration branch
(`explore/education-ch1-video`, head `44fd4b6`) and is preset-only; the 51 items are spec/stage
runs, so the writer is added to `gutcheck-grow-params.ts` instead (same reasoning as
`--frames-dir`: this loop already owns the spec, stages, and stop rules).

Plan:

1. `--growth-out <file>` [+ `--growth-padding`, default 2] on grow-params: seed sites from the
   t=0 attached field (`a[idx]===1`) as tick-0 events, then `solver.lastAttached` appended after
   every `step()`; crop tracked over all events plus padding; header mirrors run B's (required
   decoder fields plus lattice/spec/runIdentity/source provenance and optional expected-endpoint
   echo from the item's pinned record, warn-only on mismatch — the arm64 control showed habit
   classes portable but not bitwise trajectories, so x64 regrowths may differ in ULP detail).
   Assert seedCount + per-step events == final attachedCount; refuse > 8M events (decoder cap).
2. Focused round-trip test + decode of a real output with the website's own `growthAsset.ts`
   (the consumer is the contract).
3. Calibration: regrow fig11 (cheapest item, recorded 351 s) with `--growth-out`; measures this
   host's speed ratio for the fleet decision and produces the first asset.
4. Fleet (pending maker scope decision): regrow the 51 with `--growth-out` only (no `--frames-dir`
   mesh timelines — the site needs events, not meshes), several runs concurrent, recorded hours
   ≈ 390 total on the original host.

The fig13 turntable render and the batch-a staging output remain valid but are no longer the
deliverable; the turntable batch is shelved unless the maker asks for it.

Worktree registration (Rule 16): this workstream moved to the isolated worktree
`C:/Users/HIL_ADMIN/Documents/GitHub/snowflake-animation` on branch
`fix/animation-queue-windows-spawn` (maker direction, 2026-08-24); the primary checkout returned
to `main`. Owner: the animation/growth session on the Windows host. Removal condition: after this
branch's PR merges and its `out/growth-assets/` products are reconciled to NAS staging.

Implementation note: the first `--growth-out` commit used a constructor parameter property,
which Node's type stripping refuses at runtime (`ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX` — parameter
properties are non-erasable; the repo runs `.ts` directly). Replaced with an explicit field.
The round-trip test and both typechecks pass in the worktree.

Fleet execution (2026-08-24): `scripts/gutcheck-growth-fleet.ts` plan|run regrows every queue
item from its PINNED record (embedded spec, dims, tick cap, seed, extraction; specs/ not
consulted), longest-first (LPT — cheapest-first would start an 18 h item last and add ~15 h of
makespan), resume-by-identity on `<id>-growth-v1.bin` + `<id>-record.json`, per-item logs.
Maker directed 20-way parallelism on this 24-thread host. Calibration on fig11: endpoint
reproduced exactly (tick 1706, attached 350941, no drift warnings), wall 276 s vs 351 s recorded
(host ratio ~1.27x faster), asset 2.8 MB, and the snowcrystal_website's own `growthAsset.ts`
decoder accepts the file and builds its 201x201x109 volume. Fleet projection at 20-wide:
~15 h wall for the remaining 50.
