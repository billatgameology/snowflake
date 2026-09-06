# Progress — The Virtual Cloud Chamber

**This file is the compact, authoritative current-state index. Read it completely and leave it
true after every session that changes anything.** Rules: [AGENTS.md](../AGENTS.md). Governing spec:
[project charter.md](../project%20charter.md). The handoff mechanism is retired (maker direction
2026-08-20): this index plus the active plans are the sole live state, and work proceeds in
isolated worktrees per Rule 16.

## Historical record

The complete pre-compaction state and chronology through 2026-08-02 (Phases 0–5 and early
Phase 6) are preserved byte-for-byte in
[progress-history-through-2026-08-02.md](progress-history-through-2026-08-02.md); its body is
byte- and SHA-256-pinned by `runner/test/progress-index.test.ts`. The detailed Phase 6, 8, and
9 entries pruned from this index on 2026-08-20 are preserved as last written in
[progress-history-phases-6-8-9.md](progress-history-phases-6-8-9.md). Both are historical, not
current authority; open them only when this index, a plan, ADR, or audit links to historical
detail.

## Current state

- **Two Views is complete.** Branch Journey is removed,
  and branch detail fills the right column with stronger default zoom. The final
  [visual-study follow-up](plans/dendrite-visual-studies.md) records the change. Focused pane/data
  tests, typecheck, Rule 7 and app build pass. The browser smoke verifies both panes, closer zoom,
  seeking, graphs and export restoration, with zero colored pixels in all 16 gutter samples and
  no unexpected browser errors (`out/two-views/browser-smoke.json`). Its actual 1080p MP4 decodes
  successfully and was visually inspected. Next: open the Two Views link below.

- **Web pane cropping and Crystal Cast centering are corrected.** Rendering uses displayed
  canvas bounds and Cast's own offscreen pixel viewport. The preceding product checks are
  preserved in `out/branch-flight/browser-smoke.json` and `out/three-views/browser-smoke.json`;
  the final [visual-study follow-up](plans/dendrite-visual-studies.md) records the current
  two-pane simplification. Source coordinates, chronology and graph calculations are preserved.

- **Phase 6 is COMPLETE (2026-08-20).** The maker accepts the recorded failure to reproduce the
  Nakaya diagram as the phase's scientific finding. Decision
  [0045](decisions/0045-bound-phase6-closure-to-a-compute-week.md) and charter v1.22 defined the
  discharge and every element executed: the frozen WP1 strata; the three measured-only arms
  (CAK 3/90; M1 54/78 arm scope, 54/90 common denominator; `M1_NO_DIP_ABLATION` 5/78, 5/90); the
  80/80 numerical-control ladder with its published **NO-PASS (criterion)** verdict and
  review-confirmed re-derivation; the pinned
  [three-arm narrative](../evidence/phase6-three-arm-report/report.md) stating agreements,
  disagreements, numerical limits, and the accepted failure; and the flagless `gate6`, which
  re-derives all of it from committed evidence and exited 0 (13/13 criteria; repro:
  `node runner/src/main.ts gate6`). ADR 0026's conservative-intersection headline, R15's
  production path, and the full three-arm campaign closed at measured-only grade — stated as
  not computed by decision 0045, never as satisfied. No Phase 6 label was upgraded; the phase
  closes with zero quantitative-validation claims, and the 0043/0044 deferrals stay Phase 7
  property with no Phase 6 credit.
- **Phase 8 is COMPLETE (Phase 8A 2026-08-10; Phase 8B 2026-08-12).**
  Decision [0048](decisions/0048-focus-phase8b-on-phase9-ready-benchmarks.md) and charter v1.25
  preserve the completed [Phase 8A target book](plans/phase-8-what-is-real.md) byte-for-byte and
  focus the [Phase 8B corpus](plans/phase-8-measurement-corpus.md) on measurements Phase 9 can use.
  The [plain-English guide](phase8-baseline-guide.md) maps measured families to tests, limits and
  Git/NAS artifacts.
  Phase 8B writes separate artifacts; the immutable Phase 8A book remains 59,019 bytes / SHA-256
  `47a75f3fcc499d74d36cd08eeaed7f4e839bf991deb179fa19ce809d57e171ec`.
  Quoted from [`evidence/phase8b-benchmark-final-v1/report.json`](../evidence/phase8b-benchmark-final-v1/report.json):
  the successor contains 51 model-development records (18 P0 / 28 P1 / 5 P2), zero held-out rows,
  252,134 native history rows, 431 adjudicated plot points and zero P2 coordinate rows. Its
  independent verifier returned `ok=true`; successor-target-book SHA-256 is
  `c54b89683eea1f064bd8e81d6e9e06b3b9bbc6c022168b981cbfa71e5fc3cdd3`. The targeted pass is
  terminal and bounded, not global literature closure; the corrected residual sample is 0/9 misses
  after preserving and remediating its original Bacon miss. Phase 8B itself scored no model,
  supplied no adoption authority, and cannot grant a validation label. The exact full suite passed 97/97
  files; the detached clean-checkout verifier and 51 focused tests passed; and the final non-author audit
  returned zero blockers after its two bookkeeping findings were repaired. Phase 7 is completely
  standalone, unstarted and requires its own plan/worktree; Phase 10 remains uncharted.
- **Phase 9 is COMPLETE (development-only, 2026-08-13).**
  Decision [0050](decisions/0050-adopt-phase9-modular-physics-experiments.md), charter v1.27 and the
  [execution plan](plans/phase-9-execution.md) authorized isolated Mac development. S0B's
  [report](../evidence/phase9-source-overlay-v1/report.json) (6,530 bytes; SHA-256 `51e1fa2b…63d8a`)
  resolves 70 aliases to 59 complete artifacts. The files record an in-session shelf freeze before
  scoring; detailed S0B and scored-result bytes first entered Git together in `1efe127`, so
  Git ordering cannot independently prove that sequence. S1 maps all 51 rows through fail-closed adapters. All 51 Phase 8B records remain development evidence.
  Separate [verification receipts](../evidence/phase9-publication-verification-v1/) bind the clean-head
  commands and stdout for D-BT (`central-no-effect-or-failure`, Lamb `431.3416` versus rescale
  `0.6578183`, 0/6 wins, 24 no-flip sensitivities) and M-F/M-K2
  (`diagnostic-mapping-dependent`, 2/5, physical score unavailable). Other arms stop at reviewed
  source/analytic/refusal foundations; the all-no-pass branch closed:
  zero promotions and no combination campaign. Exact `TMPDIR=/private/tmp npm test` passed at
  completion; a later [different-model external review](reviews/phase9-external-review-2026-08-13.md)
  re-ran it as 115/115 files, 1,912 passed and seven skipped; the
  [post-review repair run](reviews/phase9-external-review-repairs-2026-08-13.md) passed 116/116 and
  1,924. Phase 9 cannot grant a quantitative-validation label or earn Phase 6/7 credit. The Mac
  lane ran only source/scalar/planar work; Phase 6's Windows evidence
  host, processes, artifacts, and then-unpublished verdict remained isolated throughout. The
  [maker guide](phase9-model-development-guide.md) explains the data, methods, results, and next evidence.
- **The Phase 9 knowledge baseline is COMPLETE (research-only, 2026-08-12).** Its
  [report](../research/phase9-knowledge-sources.md), [guide](phase9-knowledge-guide.md), and
  [artifact](../evidence/phase9-knowledge-baseline-v1/report.json) (5,263 bytes; SHA-256
  `37c7aadf18bce7420883930f66d6c6a473100dd27e1468dd8396a3c1214b1f96`) preserve 18 sources and
  15 hypotheses. It is now a bound S0B input; no model ran during its construction.
- **Maker directions (2026-08-20).** Phase 7 is on hold and, when resumed, runs as a parallel
  product/engineering track beside the science workstream (charter v1.23 already makes it
  standalone; this adds no new authority and starts nothing). The handoff mechanism is retired:
  [HANDOFF.md](HANDOFF.md) is a tombstone kept only for the byte-frozen archive's links, and its
  test pin now enforces the tombstone. The maker clarified that the Phase 10 A+B text was
  brainstorming and **selected no Phase 10 package (2026-08-20)**. Commit `f51f58e` recorded that
  brainstorm as a selection before the correction arrived; this live index and the
  [decision-ready candidate plan](plans/phase-10-closures-and-frontier.md) supersede that status
  statement. Phase 10 remains uncharted, no execution plan is active, and no scientific PC run is
  authorized.
- **Assurance is proportional to decision risk.** [Decision 0049](decisions/0049-make-assurance-proportionate-to-decision-risk.md),
  charter v1.26 and `AGENTS.md` require integrity for routine sources, one targeted check for
  load-bearing inputs, and full named controls for gates or strong public claims. No recursive
  reviews; stop when another check cannot change the decision. No evidence or criteria changed.
- **Maker verification boundary (2026-08-24).** Isolated website, gallery, animation-selection,
  render-recipe, and batch-orchestration changes use focused tests, relevant typecheck/build checks,
  and a live smoke or representative render. They do not trigger exact `npm test`, scientific gates,
  or unrelated solver suites unless they also change a scientific, evidence, gate, or root-wide
  contract. `AGENTS.md` Rule 6 is the durable operating rule; completed records still state checks
  that actually ran but do not establish precedent.
- **The GG gut-check catalogue now leads with its image-bearing generated sweep (2026-08-23).**
  The governed NAS split intentionally leaves historical mixed comparison/reference media
  unserved, but 89 project-generated PNG renders remain public and healthy. The index formerly
  placed 37 model-only orphan links ahead of them, making the thumbnails appear absent; the
  generator now orders the generated-crystal gallery first and a regression pins that priority.
  This is an operational UX correction only and changes no scientific evidence or phase state.
- **The maker-directed animation selection, growth replay, website library, and scientific-bundle
  NAS copy/registration are COMPLETE (2026-08-29).** The completed
  [queue plan](plans/gutcheck-animation-selection-queue.md) adds preview-adjacent selection,
  portable manifests, deterministic disjoint batches, and the later growth-event path. The Windows
  fleet completed 52 web assets and 52 full scientific bundles; the maker kept the original `fig6`,
  and the website library serves the other 51 from `snowcrystal_website`. The local scientific tree
  at `out/growth-scientific/` contains 6,308 files / 84,247,312,054 bytes. Maker direction on
  2026-08-29 direction copied it as generated-cache collection
  `gutcheck-growth-scientific@2026-08-26`. It is active at
  `collections/gutcheck-growth-scientific/2026-08-26/payload`, with 6,308 files /
  84,247,312,054 bytes / tree SHA-256
  `4a1e18634896a58b5e8acf26a041c75de72982bd32a665cae7762976f6465f3e`. The tracked 6,308-row owner
  manifest tells the project every exact NAS path. Two earlier Windows/SMB attempts failed closed
  and remain preserved in non-served quarantine; no local deletion was authorized or performed.
  The [publication plan](plans/gutcheck-growth-scientific-nas-publication.md) records the receipts
  and narrowed no-restore scope.
- Historical extent-21 artifacts remain valid measured-only comparisons: **CAK 3/90, M1 54/90**
  over their named scopes. They are not the registered conservative-intersection verdict, which
  decision 0045 closed as not computed.
- CAK→M1 is a confounded parameter-family comparison. Only matched M1 versus
  `M1_NO_DIP_ABLATION` may isolate the implemented dip factors' effect on this solver under the
  frozen configuration; it **cannot establish physical SDAK causality or necessity** in nature.
- Education is frozen with known-stale prose; the Pages deploy is retired (2026-08-16, maker
  direction) and content stays in-repo unpublished, `test.yml` CI unaffected. Reconciliation is
  a live decision point under **Next step**. Full freeze history:
  [the history file](progress-history-phases-6-8-9.md).
- **Visual-study catalogue correction is complete (2026-09-04).** The maker identified the newer
  accepted named catalogue in `../snowflake-named-catalog/docs/named-snow-crystal-catalog.json`.
  The correction in [the visual-study plan](plans/dendrite-visual-studies.md) adds its accepted
  named recordings and explicitly composed scenes to all four views. The live index reports
  151 available entries, including 99 named entries (`out/named-growth-studies/live-index.json`).
- **Visual animation browser is complete (2026-09-04).** The large dropdown is replaced by
  **Browse crystals**, a thumbnail gallery with search, shape/collection filters, dendrites first
  and click-to-play in the current view. The [visual-study plan](plans/dendrite-visual-studies.md)
  records implementation and checks. The browser smoke verified 151 cards and decoded Timeglass
  previews, zero full recording downloads on browse-first entry and no unexpected errors
  (`out/growth-gallery/browser-smoke.json`). Keyboard focus, phone layout, selection, playback,
  filter/scroll retention and broken-image fallback pass. Next: open the gallery link below.
- **Last updated:** 2026-09-05 (two views and closer branch detail;
  no phase or scientific-evidence change)
- **Optional graphs and MP4 export are complete.** Single views offer attached-site,
  interval-attachment and outward-reach graphs with independent toggles and synchronized seeking.
  **Export MP4** creates the current treatment/camera in H.264, with optional graphs. Actual UI
  downloads pass 720p/1080p stream decoding; composed statistics, cancellation/restoration and
  mobile checks pass (`out/growth-insights/browser-smoke.json`). Exact `npm test` passed:
  143 files, 2,248 tests passed / 49 skipped (`out/growth-insights/npm-test-final.log`, exit 0).
  Build passed. The [visual-study follow-up](plans/dendrite-visual-studies.md) records the controls,
  canonical Windows temporary-path fix and earlier rejected attempts. Next: use the controls below
  the single animation. No solver or source recording has changed.

## Phase gates

A scientific gate is complete only through named, reproducible evidence. Detailed review history
and every superseded attempt live in the linked plans and historical progress snapshot.

| Phase | Current gate state | Reproduction/evidence |
|---|---|---|
| 0 | Complete, maker-asserted 2026-07-14 | Charter §2.8 knowledge checks; no automated metric is applicable. |
| 1 | Complete, maker-asserted 2026-07-15 | Informal UX sessions were positive; the four-task protocol was not run. [Plan](plans/phase-1-ux-spike.md). |
| 2a | Complete, maker-asserted 2026-07-15 | Seed 1, `128,128,64` hexPrism plate: symmetry error 0 through 4,800 ticks, AR `0.168831`; checkpoint SHA-256 `f1796b501564937874065d411455a02a7c8dfb673710df01f799500df0d3a389`. Repro: `node runner/src/main.ts grow --preset plate --dims 128,128,64 --ticks 10000 --seed 1 --out out/plate-gate.ckpt --enforce-gate`. |
| 2b | Complete 2026-07-20 | Clean `0dc0f86`, seed 1, `96³` hexPrism, extent 61: −5 °C AR `0.118644` plate; −15 °C AR `12.2000` column; symmetry error 0 and every relaxation converged. Repro: `node runner/src/main.ts gate2b`. |
| 3 | Complete, maker-asserted 2026-07-23 | `gate3` exit 0: depletion-ratio median `0.531454`, 90.2% below 1, radius 38, symmetry error 0. Repro: `node runner/src/main.ts gate3`. |
| 4 | Complete 2026-07-18 | `gate4` at `70a2496`: 24/24 blocking G-G records and 12/12 diagnostic LK records executed; `gatePass=true`, `passBDiagnosticPass=false`. Repro: `node runner/src/main.ts gate4`. |
| 5 | Complete, maker-asserted 2026-07-26 | Clean `c436df5`, observed Windows/Chromium/D3D12: 16/16 gate criteria, 560 bounded segments below 500 ms, zero device losses/errors/full-field display-frame reads, 16/16 negative controls rejected. Repro: `node runner/src/main.ts gate5-lane` and `node runner/src/main.ts gate5`. |
| 6 | **Complete 2026-08-20** | `gate6` exit 0 at `44488ab`: 13/13 criteria re-derive the amended obligations from committed evidence — strata freeze, three measured-only arms (3/90; 54/78·54/90; 5/78·5/90), ladder NO-PASS (criterion), narrative report, closure labels, 0043/0044 deferrals. Negative result accepted as the finding; no label upgraded. Repro: `node runner/src/main.ts gate6`. |
| 7 | Not started; independently eligible | Charter v1.25 preserves Phase 7's independence but does not start it. A committed Phase 7 plan and isolated worktree are required; product, held-out validation, and v6 WGSL/preview-GPU parity remain its scope. |
| 8 | **Complete (8A + 8B)** | The immutable 8A book remains 18 entries / 59,019 bytes / SHA-256 `47a75f3f…71ec`. The verified 8B successor is 51 development records, 252,134 native rows and 431 plot points; no row is held out. [Completed plan](plans/phase-8-measurement-corpus.md). |
| 9 | **Complete (development-only)** | The all-no-pass branch closed: D-BT failed, M-F/M-K2 stayed mapping-dependent, controls/path-state/M-PK are unavailable or non-identifiable, and zero items promoted. Exact `TMPDIR=/private/tmp npm test` passed; no result grants validation credit. [Completed plan](plans/phase-9-execution.md). |

## Active plan

The maker-directed [growth visual studies](plans/dendrite-visual-studies.md), including the
newer named catalogue, are complete on `fix/animation-queue-windows-spawn` in `snowflake-animation`.
`out/named-growth-studies/packaging.json` records 151 prepared/decoded replays, including all 99
newer named entries. The gallery now offers collection and shape filtering; direct recordings and composed
scenes share Ion Bloom, Timeglass, Two Views and Crystal Cast with explicit composition labels.
Focused tests, typecheck, Rule 7 and app build passed. The earlier production browser sweep records
604 view renders and no unexpected errors (`out/named-growth-studies/browser-smoke.json`).
Final camera/timing refinements passed 20 targeted live renders and the rebuilt-production
seek check (`final-browser-smoke.json` and `final-production.json` in that directory).
Exact source identities are in `app/data/named-growth-library.json`.
The subsequent gallery pass adds tracked Timeglass previews (`app/data/growth-previews/index.json`)
and the focused browsing checks in `out/growth-gallery/browser-smoke.json`; it does not repeat
the earlier renderer sweep. The plan's gallery follow-up records the current browsing UI.
The subsequent structural-rendering pass replaces the two retired treatments and records its
representative controls/render checks in `out/growth-structure/browser-smoke.json`.
The completed graphs/export follow-up adds recording-derived readouts and actual MP4 downloads;
its browser and required full-check records are in `out/growth-insights/` as named above.
The subsequent Three Views replacement and Cast centering use the representative product checks
in `out/three-views/`, followed by the retired moving camera checks in `out/branch-flight/` and
the current two-pane/cropping checks in `out/two-views/`;
the earlier catalogue-wide sweep predates these rendering changes.
No solver, scientific evidence, source acceptance or phase state changed.

[phase-6-science-first-completion.md](plans/phase-6-science-first-completion.md) is the completed Phase 6 record (see its Completion record).
[phase-8-measurement-corpus.md](plans/phase-8-measurement-corpus.md) and
[phase-8-what-is-real.md](plans/phase-8-what-is-real.md) are completed records; the
[Phase 9 execution plan](plans/phase-9-execution.md) is complete and its
[knowledge-baseline plan](plans/phase-9-knowledge-baseline.md) is a completed research input.
The older [proposed consumer plan](plans/phase-9-modular-physics-arms.md) is superseded design
history, not execution authority. Decisions 0046–0050 keep worktrees, processes, artifacts, claims,
and completion credit isolated.
[nas-asset-governance.md](plans/nas-asset-governance.md) is a completed infrastructure record; its
correction changes no phase claim or credit.

The maker-directed [gut-check animation selection and queue plan](plans/gutcheck-animation-selection-queue.md)
is complete, including growth-event and full scientific output. The
[scientific-bundle NAS publication plan](plans/gutcheck-growth-scientific-nas-publication.md) is
also complete after the durable generated-cache copy, manifest registration, and exact repository
checks; it changes no phase status or scientific claim.
The
[Phase 10 candidate plan](plans/phase-10-closures-and-frontier.md) is decision support, not
execution authority; no A–H package is selected.

The old source-strata/ladder/WP3/R15 prerequisite sentence governed the now-closed Phase 6
production path. WP3 and R15 closed as not computed under decision 0045; that sentence does not
govern a future Phase 10 diagnostic. Any selected Phase 10 execution must instead freeze and pass
the package-specific prerequisites in its charter amendment and execution plan. Decisions
0043–0044's Phase 7 deferrals remain authoritative and cannot be discharged by Phase 10.

## Next step

### Growth visual studies — ready to use

Open `http://127.0.0.1:5191/dendrite-styles.html?browse=1` to see the thumbnail gallery. Search or
filter by shape/collection, then click a card to play it in the current view. Use **Browse
crystals** to reopen the gallery and **View** to select Timeglass or another treatment. The
**Named catalogue** filter shows the newer types and their variants. A fresh session can use
`npm run dev --workspace app -- --port 5191`. The [plan](plans/dendrite-visual-studies.md)
records the completed checks and source locations. No implementation work remains in this request.
The loopback dev server is recorded at `out/growth-gallery/dev-server.pid`; its logs are
beside it. Missing local source files remain visibly unavailable; the tracked original dendrite
remains usable. For already restored producer output, see `app/data/README.md` and
`GROWTH_STUDY_CATALOG_ROOT`. Timeglass is the default view.
For the new composition, start at `dendrite-styles.html?style=2&crystal=sweep-t1-sharp`.
**Two Views** shows the top view beside a closer three-quarter branch detail. Drag panes
independently, double-click to reset a pane, or adjust **Detail zoom**. **Crystal Cast** is centered
and retains **Move the light**. Open **Graphs** below any single animation to toggle attached sites,
new attachments and outward reach, or click a chart to scrub. **Export MP4** offers 720p/1080p,
10/20/30-second complete-growth clips and optional visible graphs. It retains the current
camera/rendering controls and restores playback after export. The plan's final follow-up records
the two-pane composition and closer detail checks; `app/data/README.md` has usage and browser requirements.

### Phase 10 — planning complete; maker package selection pending

The [candidate plan](plans/phase-10-closures-and-frontier.md) replaces the original A–D shorthand
with composable A–H packages and explicit return gates. Nothing is selected. Its recommended
default is **A-S + A-I + B, alongside no-solver C0 and verification-first C0V with its
packet-specific A-P preflight**, with no PC habit run. A separate opt-in early numerical-risk
probe is **C0 + A-P + C1–C2**: fresh N80 replay, N96
sentinel, then N112 only if N96 passes, with a three-row/72-process-hour maximum. It is diagnostic
at one neutral attached-count consumer and does not qualify a future B target. D remains deferred.

The next action is the maker's package choice or a decision to stop at G. After a choice—and not
before—the repository actions are:

1. write a package-scoped execution plan and ADR/charter amendment with the chosen done/stop rules,
   authority boundaries, resource budget, and complete charter-clause audit;
2. correct `AGENTS.md`'s stale “Phases 0–8” sentence during that reconciliation; and
3. for any executable/PC package, implement A-P's obligation matrix, producer, independent
   evaluator, negative controls required by the protocol, and exact launch README; pass exact
   `npm test` and packet preflight before moving the run to the PC.

Standing constraints: no Phase 8 record may be relabeled unseen; Phase 7 retains held-out,
product, and GPU obligations; B outcomes do not automatically authorize E/F/H; the permanent
`GGThreshold`/`LibbrechtKinetics` operators remain unchanged unless a separately adopted package
explicitly amends their contract; and no Phase 6 evidence artifact is rewritten.

### Other live decision points

1. **NAS prune approval** — the exact workstation-source prune list (pinned ladder worktree
   `G:\Code Files\snowflake-phase6-ladder`, archived `out/` trees) is now unblocked by the
   verified external-evidence backups; it remains a separate reviewed maker decision. Nothing
   has been deleted.
2. **Education reconciliation** — maker-directed, not started. The frozen education verifier
   oracles (`docs/education/tools/part-two-oracles.mjs`) pin superseded state-document
   content, including the retired handoff, so they are part of that reconciliation's scope.

Phase 7 stays on hold as a parallel product/engineering track; it still requires its own
committed plan and isolated worktree before any work starts, and V4/V4.x apparatus stays
retired.

### Phase 6 closure record — no Phase 6 work remains

Closed 2026-08-20 on the flagless `gate6` exit 0 (gate table above; completed
[plan](plans/phase-6-science-first-completion.md)). The
[80-row ladder](plans/phase-6-wp2-ladder.md) published **NO-PASS (criterion)** on both
spacings — the numerics are NOT converged at these resolutions and the attached-count
observable carries multi-percent seed sensitivity — and the WP2 and gate-unit non-author
reviews closed with 0 blockers. A same-day macOS re-derivation at `9e64ef7` (clean tree)
reproduced gate6 13/13 / exit 0 and exact `TMPDIR=/private/tmp npm test` green: 132 files,
2,250 passed / 7 skipped in 403.61 s. Full closure detail:
[the history file](progress-history-phases-6-8-9.md). Held-out and preview-GPU work remain
Phase 7 property with no Phase 6 credit.

### Phase 8B record — closed; external search remains stopped

Decision 0048, charter v1.25, and the
[benchmark-corpus plan](plans/phase-8-measurement-corpus.md) govern. Preserve `evidence/phase8-target-book/`
byte-for-byte, along with rejected plot-adjudication history and the failed original residual
audit. Broad discovery and the residual backlog remain stopped absent a new named
measurement gap; Phase 9 S0B is bounded reconciliation of already registered complete Git/NAS
sources. All 51 Phase 8B records are development evidence and none may be relabeled held out.

### NAS asset governance — complete through the Windows write lane; prune approval pending

The [governance plan](plans/nas-asset-governance.md) holds the full record: the macOS
correction applied without deletion (`d92f39a`), the Windows write lane executed 2026-08-20
(`0b34ee9`: 11 collections, 8,362 files, receipt-verified, 11/11 fresh-process full verifies,
green restore round-trip), and the external-evidence backup gap closed same day (`9e64ef7`:
independent-domain copies verified twice against ledger pins, `backup.status: verified`). SMB
rename crash-durability stays verification-based. Remaining: the maker's exact prune approval
(decision point 1 under **Other live decision points**). Quoted detail:
[the history file](progress-history-phases-6-8-9.md).
