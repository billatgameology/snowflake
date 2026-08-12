# out/gutcheck-gg-realism — layout

The gut-check spike's output tree. Recipes and provenance are git-tracked; bulk binaries
live on the NAS and are ledgered in `docs/nas-ledger.md` (+ machine-readable `.json`
twin with per-file SHA-256). The site index (`scripts/gutcheck-build-index.ts`)
auto-detects the NAS at `S:\out\gutcheck-gg-realism` and links artifacts there; without
the NAS attached it falls back to local paths.

| path | what | git | home |
| --- | --- | --- | --- |
| `specs/` | sweep recipes (one JSON per crystal, incl. staged schedules) | tracked | local |
| `dialin/` | animation dial-in recipes (500/800/1200 + probes) | tracked | local |
| `gen/*-record.json` | per-crystal provenance: spec, stop reason, tick, mesh stats | tracked | local |
| `gen/*.log` | grow logs | untracked | local |
| `gen/renders/` | glass stills (`<id>-render.png` is what the index reads) | untracked | NAS |
| `large/gen/` | final meshes (`<id>-mesh.bin`) | untracked | NAS |
| `large/anim/<id>/` | growth timelines (frame meshes + `manifest.json`) | untracked | NAS |
| `large/figs/`, `large/meshes/`, `large/anim-B/` | paper-figure meshes, Run B artifacts | untracked | NAS |
| `large/checkpoints/`, `archives/` | solver states, zip packs | untracked | NAS |
| `figs/`, `photos/`, root `*.png` | comparison images, style heroes | partially tracked | local |
| `index.json` | generated site index — rebuild with `node scripts/gutcheck-build-index.ts` | untracked | local |

Workflow after growing anything new: render (`scripts/gutcheck-render-mesh.mjs`), move
the new bulk output to `S:` mirroring paths, append to `docs/nas-ledger.json`, rebuild
the index.

A run's timeline directory may contain a `STOPPED` marker: the run was deliberately
killed (the index labels it "stopped by choice"); its partial timeline is still valid.
