# evidence/gutcheck-gg-realism — the spike's tracked provenance

The gut-check spike's recipes and run records, relocated from gitignored `out/` on
2026-08-12 (maker directive: `out/` is fully temporary — ADR 0038's "may be deleted at any
time" now holds with no exceptions). Everything in this directory is pinned in
`evidence/MANIFEST.json` (bytes + SHA-256, enforced by `npm test`); the writers listed
below re-pin it automatically.

| path | what |
| --- | --- |
| `specs/` | sweep recipes — one JSON per crystal, incl. staged schedules (written by `scripts/gutcheck-sweep-specs.mjs`) |
| `dialin/` | animation dial-in recipes (500/800/1200 + probes) |
| `gen-records/` | per-crystal provenance: spec, stop reason, tick, mesh stats (written by `scripts/gutcheck-grow-batch.mjs`) |
| `fig-records/` | the same, for the paper-figure reproductions |
| `large-artifact-inventory.json` | the archive-pack ledger: relpath + SHA-256 + bytes for the binaries and zip packs it has inventoried (1,640 files at last rebuild — the live census of everything on the share is `docs/nas-ledger.json`). Rebuilt by `scripts/gutcheck-archive-pack.ts`, which preserves entries whose files are not restored locally |

Nothing else can regenerate these files: 74 of the 93 sweep specs come from
`scripts/gutcheck-sweep-specs.mjs` but 19 are hand-authored, and the records capture what
each run actually did (stop reason, final tick, mesh stats — runtime facts no rerun is
guaranteed to reproduce bit-for-bit). Every mesh, render and timeline regenerates FROM
them. That asymmetry — irreplaceable primaries, reproducible outputs — is why they are
tracked while the multi-GB outputs are not.

## Where everything else lives

- **`out/gutcheck-gg-realism/`** — transient only: the generated `index.json`, grow logs,
  and any locally restored bulk. Disposable at any time.
- **The NAS share** (`\\GameStation\snowcrystal`, `docs/nas-ledger.md`) — all bulk binaries
  (meshes, timelines, renders, checkpoints, archive packs) plus the loose extras mirror,
  ledgered per file in `docs/nas-ledger.json`. On the measured macOS path, the dev server
  streams them and a fresh worktree needs only
  `node scripts/gutcheck-build-index.ts && npm run dev`; the current Windows `S:/` path
  remains unexecuted.

## Workflow after growing anything new

1. `scripts/gutcheck-grow-batch.mjs` reads `specs/` here, writes the record here (re-pins
   the MANIFEST), and puts bulk output under `out/gutcheck-gg-realism/`.
2. Render (`scripts/gutcheck-render-mesh.mjs`), move the new bulk to the share (mirrored
   path), append `docs/nas-ledger.json`.
3. Rebuild the site index: `node scripts/gutcheck-build-index.ts`.

A direct `scripts/gutcheck-grow-params.ts` invocation does not re-pin the manifest; run
`npm run evidence:pin` after it writes a record here.

A run's timeline directory may contain a `STOPPED` marker: the run was deliberately killed
(the index labels it "stopped by choice"); its partial timeline is still valid.
