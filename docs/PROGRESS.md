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
- **The maker-directed animation selection, growth replay, and website library are COMPLETE; the
  scientific bundles' governed NAS publication is active (2026-08-29).** The completed
  [queue plan](plans/gutcheck-animation-selection-queue.md) adds preview-adjacent selection,
  portable manifests, deterministic disjoint batches, and the later growth-event path. The Windows
  fleet completed 52 web assets and 52 full scientific bundles; the maker kept the original `fig6`,
  and the website library serves the other 51 from `snowcrystal_website`. The local scientific tree
  at `out/growth-scientific/` contains 6,308 files / 84,247,312,054 bytes. Maker direction on
  2026-08-29 starts its copy-first publication as the provisional generated-cache collection
  `gutcheck-growth-scientific@2026-08-26`; two Windows/SMB attempts failed closed before final
  placement, no durable payload has been written, and no local deletion is authorized. The active
  [publication plan](plans/gutcheck-growth-scientific-nas-publication.md) governs the write.
- **The named snow-crystal animation catalog is COMPLETE (2026-08-31).** The strict
  [catalog](named-snow-crystal-catalog.json) and linked [text table](named-snow-crystal-catalog.md)
  report all 35 Libbrecht guide names exactly once: 33 included types with three accepted animations
  each, plus `Rimed` and `Graupel` visibly excluded because this work adds no droplet-accretion
  physics. Final totals are 99 accepted / zero remaining, 22 direct GG/GG+ families and 11 explicitly
  composed families. All 99 decoder-verified cold web payloads are below 20,000,000 bytes and range
  from 4,769 to 10,923,005 bytes. The 66 direct entries retain 8,999 scientific files /
  110,701,619,469 bytes with 101–121 mesh frames each; the 33 Compose records bind exact component
  scientific identities without claiming a composed scene is one solver state. The exact
  [Compose review](named-snow-crystal-final-compose-review.json) is 50,204 bytes / SHA-256
  `212434bf4704763ccdd33d17b063a79f4305c020fc9e89024046f372e9e0ac19` and binds all 297 real-browser
  captures after live clearance and visual progression review. The catalog plan contains the exact
  report/contact-sheet/catalog identities and final product-sized checks.
- **The named snow-crystal local gallery is COMPLETE (2026-08-31).** The dedicated loopback page
  renders all 35 taxonomy rows and 99 accepted variant cards with previews, payload metadata,
  search, route filters and click-to-play animation. Its exact allowlist API preserves the generic
  Vite `out/` denial and distinguishes direct G-G/G-G+ recordings from Compose. A live Playwright
  smoke counted 35 rows / 99 cards, confirmed unknown/generic-`out` denial, and completed one direct
  and one Compose playback. The server is running at `http://127.0.0.1:5173/named-crystal-catalog.html`;
  PID and logs are under `out/named-crystal-gallery-site/`.
- **Render-worktree NAS closeout is active (2026-09-04).** Maker direction requests a verified NAS
  save, merge to `main`, remote availability and removal of the completed animation and named-catalog
  worktrees. The [closeout plan](plans/render-worktrees-nas-closeout.md) registers the required
  copy/manifest/receipt/full-verify/fresh-restore boundary before any new NAS write. No worktree or
  ignored output has been removed.
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
- **Last updated:** 2026-09-04 (registered the maker-directed render-worktree NAS and Git closeout;
  no payload write, deletion, phase or scientific-evidence change)

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
is complete, including growth-event and full scientific output. The active
[scientific-bundle NAS publication plan](plans/gutcheck-growth-scientific-nas-publication.md)
continues the same registered worktree only for durable generated-cache publication; it changes no
phase status or scientific claim.
The maker-selected [named snow-crystal animation catalog plan](plans/named-crystal-animation-catalog.md)
is a completed product record in `C:/Users/HIL_ADMIN/Documents/GitHub/snowflake-named-catalog` on
branch `feature/named-crystal-catalog`. Its 99 accepted animations, final table, exact dual-output
bindings and real-browser Compose review are complete; no publication or cross-repository copy is
implied by that completion.
The maker-requested [local gallery plan](plans/named-crystal-local-gallery.md) is complete. Its
loopback-only 35-row visual catalog shows three cards per included type and click-to-play
direct/Compose web payloads. The service exposes only catalog/review-bound files and leaves Vite's
general `out/` denial intact; this is local presentation, not publication.
The maker rejected the first gallery player's visual quality after comparison with the existing GG
website. The completed [volume-rendered gallery plan](plans/named-crystal-volume-gallery.md) now uses
that showcase's strict decoder, arrival-volume texture and studio ice material for every card and
modal. Accepted records, identities, direct/Compose meaning and `<20 MB` payloads remain fixed. The
99-scene live-browser smoke passed 66 direct and 33 Compose scenes, including safe final framing and
shared-texture checks; the exact output is
`out/named-crystal-gallery-site/all-volume-smoke-final.log`. The generated-preview report at
`out/named-crystal-gallery-volume-previews/report.json` (19,066 bytes; SHA-256
`5a316187e3bae4f9ed25bd1083865cfb772bcfdaf82784665b0033f494b0dcc3`) binds all 99 current 720×720
volume-rendered card images.
The maker then rejected black, patchy and camera-jittering pinholes in the dense volume view. The
completed [volume stability correction](plans/named-crystal-volume-stability-correction.md) traced
them past a solid first-hit mask to the transmission pass: a coarse probe inside a later body could
have zero field gradient, so normalizing it emitted invalid black pixels that moved with the camera.
The shader now refines the actual far-side crossing, uses a safe fallback normal and smooths only its
shading stencil. The exact ten-capture review is bound by
`out/named-crystal-volume-stability/final-review/report.json` (6,614 bytes; SHA-256
`907d8aaca7cd95919cdbb2cc639fac5175b489512aa3215aadd1cace6ff00f4a`); all accepted products and
payload claims remain unchanged.
The active [render-worktree NAS closeout plan](plans/render-worktrees-nas-closeout.md) now governs
durable publication of every useful ignored named-catalog product plus the animation worktree's
non-duplicated residual, followed by merge/push and exact worktree removal. It changes no catalog,
renderer or scientific result.
The
[Phase 10 candidate plan](plans/phase-10-closures-and-frontier.md) is decision support, not
execution authority; no A–H package is selected.

The old source-strata/ladder/WP3/R15 prerequisite sentence governed the now-closed Phase 6
production path. WP3 and R15 closed as not computed under decision 0045; that sentence does not
govern a future Phase 10 diagnostic. Any selected Phase 10 execution must instead freeze and pass
the package-specific prerequisites in its charter amendment and execution plan. Decisions
0043–0044's Phase 7 deferrals remain authoritative and cannot be discharged by Phase 10.

## Next step

### Render-worktree NAS closeout — active

Commit the registered closeout plan, finish the already-running fresh full-hash verification of
`gutcheck-growth-scientific@2026-08-26`, and record its exact result. Then reconcile the final
animation/NAS commits into this branch, implement the fixed-source residual-copy and publication
commands, and commit the provisional `render-worktrees-closeout@2026-09-04` catalogue entry before
the first new NAS write. Do not remove either worktree until the new collection passes publication,
tracked manifest registration, a later full verifier, a fresh restore/verify round-trip, required
repository checks, `main` merge and remote push.

### Gut-check scientific bundles — governed NAS publication active

The marked share resolved to `S:/`, its bootstrap identity check passed, it has sufficient free
space, and `collections/gutcheck-growth-scientific/2026-08-26/` was absent at the opening check.
The plan, provisional catalogue entry, and bounded publisher are committed. Its read-only stable
inventory passed at 6,308 files / 84,247,312,054 bytes / tree SHA-256
`4a1e18634896a58b5e8acf26a041c75de72982bd32a665cae7762976f6465f3e`, with the final and restore
targets absent. The first publication attempt failed closed after staging one 18,076-byte file:
Windows SMB committed mtime/ctime on descriptor close, invalidating the core's pre-close ownership
snapshot even though the staged SHA-256 equalled source. No final collection or receipt exists.
The first repair preserves every substantive identity/byte check and captures each file ownership
snapshot after close. The exact first failed stage and lock are preserved, not deleted, under
`_control/quarantine/unresolved/gutcheck-growth-scientific-20260829-publish-attempt1/` with a
failure record. The second transaction copied and verified the full 6,308-file stage, then failed
closed before final reservation because SMB later settled mutable metadata on one unchanged nested
directory. No final collection or receipt exists. The directory repair retains exact whole-tree
path/length/SHA-256 verification and strict file identities while binding directories by their
device/inode/mode object identity; 46 focused tests passed with six skipped, including the new
settled-timestamp regression and existing replacement negatives. The exact full second stage was
re-inventoried at 6,308 files / 84,247,312,054 bytes / tree SHA-256
`4a1e18634896a58b5e8acf26a041c75de72982bd32a665cae7762976f6465f3e`, then it and its lock moved
intact, never deleted, to
`_control/quarantine/unresolved/gutcheck-growth-scientific-20260829-publish-attempt2/` with a failure
record. The next command is the repaired publication:

`node scripts/nas-publish-gutcheck-growth-scientific.ts --publish`

The command uses the new `publish3` transaction identity. Maker direction later on 2026-08-29
narrowed completion to the basic durable copy plus an exact tracked owner manifest so the project
knows the NAS locator. Let the already-running publisher finish its own repeated hashes and receipt,
then run `node scripts/nas-publish-gutcheck-growth-scientific.ts --register`. Do not run `--restore`,
the restored-tree verifier, or a later fresh-process full NAS verifier in this task; record them as
deferred, keep restore status `documented`, and do not claim they ran. Do not delete
`out/growth-scientific/` or either failed-attempt quarantine; pruning is not part of this request.

### Named snow-crystal catalog — complete

Work only in `C:/Users/HIL_ADMIN/Documents/GitHub/snowflake-named-catalog` on
`feature/named-crystal-catalog`; do not touch the running NAS publisher in the animation worktree.
The strict taxonomy, exact [52-asset visual audit](named-snow-crystal-current-assets.md), and
versioned GG+ seed implementation are complete in the isolated worktree. GG+ is a separate
initial-condition adapter: the permanent `gg-solver.ts` control remains byte-identical, while the
adapter's hexagonal-prism route matches its tested 200-tick state bit-for-bit. Strict custom sites
are connected, canonicalized, bounds-checked, and identity-bound by exact sorted-site digest.
A real four-site custom-seed growth sample round-tripped its web growth event file and full public
checkpoint. Focused seed/runner/control-identity tests passed 25/25. Exact `npm test` then passed
140/140 files, 2,237 tests with 49 skipped, in 440.00 seconds after setting `TEMP` and `TMP` to the
canonical long Windows temp path; the permanent G-G control identity passed inside that run.

The coverage-first command `node scripts/named-crystal-baseline-probes.ts run` then used exactly 24
workers and completed 24/24 direct-growth jobs. Its report is
`out/named-crystal-catalog/baseline-probes-v1/report.json` (40,380 bytes; SHA-256
`68221cc4190f4d28008dfc17c8fb0cf3cfa67347fc741ec4e13f9b767904ed3c`): web files ranged from
62,188 to 830,136 bytes, totalled 8,188,899 bytes, and all were strictly below 20,000,000 bytes.
The bound three-view review records ten advance candidates, five retune candidates and nine failed
probes, with zero formal slots filled. A presentation-only orthographic camera correction now
includes projected Z and full three-dimensional extent, so tall columns are no longer clipped into
vertical bars; its focused review/runner/framing checks passed 8/8, both typechecks passed, and the
app build transformed 73 modules. Next register one 24-job, one-driver-per-family follow-up across
the six failed GG+ hard forms (four deterministic variants each). That follow-up is now registered
in `docs/named-snow-crystal-hard-form-probes.json`: 24 unique jobs, four variants each for Scrolls
on Plates, Triangular Forms, Cups, Multiply Capped Columns, Needle Clusters and Hollow Plates. Its
runner independently binds those IDs to the failed first-pass review, materializes exact custom
sites/schedules, records exact argv and actual worker count, and enforces the same strict web
ceiling. The 24-job plan, connected-seed/schedule tests, both typechecks, Rule 7 scan and diff check
pass. Next run `node scripts/named-crystal-hard-form-probes.ts run` with exactly 24 independent
processes. That run completed 24/24 jobs with 24 actual workers; its 47,848-byte report (SHA-256
`21475d310edcc231fe1f5429d42684ac0bbb92f047c060acf7249570aa281ddf`) records web files from
34,549 to 507,663 bytes, 2,895,660 bytes total, all below the strict ceiling. Three-view review
advances the four Hollow Plates variants, sends Multiply Capped Columns and Needle Clusters to
explicit Compose, and sends Scrolls on Plates, Triangular Forms and Cups to one bounded early-stop
search because growth erased their defining seed feature. Zero formal slots are filled. Next
register the three-family, 24-job early-stop interval search before launching it on all 24 cores;
that manifest and runner are now complete. They derive one fixed source seed/spec for each family,
vary only stop tick across 100–1,200, record initial and newly attached site counts, and require 24
actual workers plus the strict web gate. Its 24-job plan, fixed-spec tests, both typechecks, Rule 7
scan and diff check pass. The run then completed 24/24 with 24 workers. Its 50,418-byte report
(SHA-256 `4b09087bbcf515f527bc8fa5e281b51f5be9661a86d53be61e564f41f7a74db3`) records positive growth
for every job and web assets from 4,105 to 53,312 bytes. Three-view review advances Scrolls on
Plates at 100/300/400 ticks, Triangular Forms at 200/400/600 ticks, and Cups at 100/200/400 ticks:
nine production candidates, still zero formal slots. Next bind the accepted direct-growth
production candidate matrix—including these nine and four Hollow Plates candidates. The versioned
Compose contract and live player are now also implemented: strict component/scientific identities,
transforms, phase offsets, bounds, unique cold-byte accounting, actual browser byte/hash checks and
an explicit composed-visualization disclosure. A deterministic crossed-needle smoke used one
121,806-byte growth request for two transformed instances and sought successfully at 4/8 seconds;
the three focused files passed 8/8, both typechecks and the 75-module app build passed. That local
probe is player evidence only, not an accepted scene. Next commit this contract, then build the
direct-growth production candidate matrix and first scientifically bound Compose baselines before
changing the two route decisions. The generated maker-facing catalog table now links all selected
early-stop/hollow-plate trios plus the Solid Column, Sheath, Split Plate and Isolated Bullet
baselines, and it names the two pending Compose transitions. Its strict validator and four focused
tests pass while correctly retaining zero accepted slots. Next register the dual-output production
matrix: exact lower/baseline/upper recipe identities for the new GG+ families and exact reuse
identities for current strong anchors, without inventing a scientific locator before the independent
publisher registers it. Do not touch the independently running NAS publisher in the animation
worktree.

The first production matrix completed 24/24 with 24 actual workers. The exact 567,085-byte report
(SHA-256 `ed3153cb3480180555c972ee07c0ec635111deb0773ed9bdcc1726e16dd4ef52`)
records decoder-verified web files from 4,759 to 361,488 bytes, 3,084,489 bytes total. The full
scientific inventory is 2,924 files / 2,291,163,313 bytes with 101–121 frames per entry. The bound
8,384,905-byte three-view contact sheet (SHA-256
`a77d447ecb0ca6b3f4f43de02007d165076f062aa6becbfc4c4ab3677e463346`)
supports acceptance of all eight lower/baseline/upper trios. The generated catalog table now links
each accepted preview, web asset, recipe and scientific bundle and reports 24 accepted / 75
remaining. Outputs remain local ignored products; governed publication is still pending and no NAS
locator is claimed.

The second 24-job protocol is now registered for Simple Prisms, Hexagonal Plates, Hollow Columns,
Stellar Plates, Capped Columns, Sectored Plates, Simple Needles and Fernlike Stellar Dendrites.
Every trio varies only one schedule-wide `rho` scale by ±5%. Six families derive from advance-grade
baseline materializations; Simple Prisms binds the strong `fig11` current-audit source, and
Hexagonal Plates binds the strong `sweep-t2p5-r0p08` source. The two plate families whose probes
contacted their domains use fixed enlarged domains. The exact manifest and runner are now
implemented and the read-only plan materializes all 24 jobs. It reuses the first tranche's
dual-output executor/verifier and refuses source review/hash, route, dimension, host/concurrency or
output-contract drift. The focused two-file check passes 11 tests; both TypeScript projects, the
Rule 7 scan and diff check pass. The implementation was committed as `8c13747`, then
`node scripts/named-crystal-direct-production-2.ts run` completed 24/24 with 24 actual workers. Its
594,644-byte report (SHA-256
`f5d30f6e896980a19df9716f5400c207c5c9994dce7fcd3804ec0c2ef97b85e1`) records decoder-verified
web files from 55,268 to 3,576,987 bytes and scientific bundles totalling 3,078 files /
6,568,205,710 bytes with 115–121 mesh states each. The 9,983,672-byte three-view sheet (SHA-256
`6e849aab1f49ed1e6e107516e42c27578ed6dee37a3d15e7abde5c92d3e6e578`) shows the eight expected
morphologies. Hollow Columns and Simple Needles retain 41–48 Z layers at their closest boundary;
Capped Columns retain 66–70. They are not vertically clipped.

Maker direction nevertheless requires the established large scientific domain scale: existing
planar sources are generally 500–800 cells across, Simple Needles/Hollow Columns are
128×128×768, and Capped Columns are 320×320×512. Therefore both completed 24-job fleets are retained
as parameter/morphology screens but do not complete final-resolution catalog slots. The active plan
now registers two replacement 24-worker fleets with exact large domains/caps and a vertical
clearance gate, while preserving the same three-variant recipes, 120-mesh-state scientific cadence,
actual web decoder and strict byte ceiling. Next commit that protocol revision; then implement the
tracked supersession/reset plus the common final-resolution runner and focused preflight before
launching Fleet A on all 24 cores. The protocol revision is committed as `e73d467`. The exact
36,250-byte supersession record (SHA-256
`7529a3c2ee754f24baf5515bb6b8631670a8423b14194f485dee4c789b080dbd`) now preserves both screens
and resets the strict catalog to 0 accepted / 99 remaining. The common manifest/runner materializes
24 unique source-bound jobs for either Fleet A or B, checks all registered large dimensions/caps,
and enforces both 16-layer and 5%-of-`nz` vertical clearance after generation. Its five focused
files pass 26 tests, both TypeScript projects pass, the Rule 7 scan is clean across 1,077 files and
the diff check passes; both final output roots remain absent. Next commit this implementation
checkpoint, then launch
`node scripts/named-crystal-final-resolution-production.ts run --fleet a` with all 24 workers. Do
not touch the independently completed NAS publisher in the animation worktree.

Fleet A is now running with 24 actual child processes and no early stderr. While it runs, the active
plan registers Fleet C for the final six direct-growth types: three exact-source `rho` variants each
for Columns on Plates, Skeletal Forms, Simple Stars, Stellar Dendrites and Double Plates, plus nine
fixed-recipe Capped Bullet stop candidates from which three adjacent bullet-and-cap results must
survive review. Implement and preflight Fleet C without launching it; Fleet A retains the only
24-worker production lane until it completes. Fleet C is now implemented as a separate byte-pinned
manifest/runner, its 24-job read-only plan leaves the output root absent, and its combined focused
check with the A/B runner passes 14 tests. Both TypeScript projects pass, the Rule 7 scan is clean
across 1,080 files, and the diff check passes. Commit this implementation without changing or
restarting Fleet A; Fleet C remains queued until the lane is free.

The final Compose protocol is also registered for 11 families / 33 scenes, including the deferred
Multiply Capped Columns and Needle Clusters route transitions. Every trio varies one small transform
property, counts unique component bytes, binds exact full-resolution component science identities,
and requires real-browser hash/decode/seek/render evidence. Implement its recipe manifest and
fail-closed builder while Fleet A runs, but do not materialize scenes or change routes until the
consolidated direct review exists.

The recipe manifest and fail-closed Compose builder are now implemented. A fixture consolidated
review exercised all 33 scenes through strict scene parsing, actual component decoding, unique cold
byte accounting and scientific-scene inventory generation; the three focused files pass nine tests,
both TypeScript projects pass, and the Rule 7 scan is clean across 1,083 files. The production plan
reports `directReviewReady: false` and leaves its output root absent as required. Commit this
checkpoint; do not build real scenes or change routes before direct acceptance.

The Compose browser-review helper is now implemented too. It requires the complete real 33-entry
report, rechecks scene identities and the cold-byte ceiling, and drives the app's strict
`growthScene` path through component fetch/hash/decode before capturing start / 55% / final time.
It will write 99 capture identities bound to the exact source report, but cannot itself accept or
change a catalog row. Its JavaScript syntax check passes, the Rule 7 scan is clean across 1,085
files, and the diff check passes. Commit this helper while Fleet A continues; do not run it before
direct acceptance and real Compose materialization.

Review found that those 99 captures cover three timeline stages but only one camera and therefore do
not yet discharge the separately registered three-view morphology gate. The correction is now
registered before implementation: add capture-only bounded growth-scene camera overrides and produce
face/oblique/axial × start/55%/final captures, 297 exact playback images in total. Update and test the
helper while Fleet A continues; do not use its current 99-image form as Compose acceptance evidence.

The Compose three-view correction is now implemented. Normal playback cannot apply review params;
capture mode bounds tilt/yaw, and the helper now writes 297 face/oblique/axial × start/55%/final
captures plus a bound final-time contact sheet. Eight focused tests, both TypeScript projects and the
76-module app build pass. The built-app smoke command loaded a strict in-memory scene through real
component fetch/hash/decode, rendered the axial override, proved normal playback ignored review
params and refused 91° capture tilt; its screenshot SHA-256 was
`7179d18e9f33958313bec382944557db902a612fda33d8dfc0aa3ccc27cd3d75`. Both review scripts pass
syntax checks, Rule 7 is clean across 1,090 files and the diff check passes. Commit the correction;
real capture remains blocked on direct acceptance and scene materialization.

The final Compose acceptance transaction is now registered before implementation. A future reviewed
decision must pin the exact 33-scene report, 297-capture browser review and final-time three-view
contact sheet, with one morphology rationale per Compose family. A fail-closed verifier will rehash
all scenes, scientific-scene bundles and 297 captures, reparse scenes, recompute cold bytes, then fill
the last 33 slots and apply the two deferred route changes in one catalog/table transaction. Implement
and fixture-test it while Fleet A continues; production decisions remain blocked on real direct
acceptance, scene materialization and visual review.

The fail-closed final Compose verifier is now implemented. It rechecks all 33 actual scene/science
products, recomputes cold bytes, rehashes all 297 captures, requires exact nine-view/stage coverage
per entry, and prepares the last 33 slots plus both deferred route changes before any tracked output
replacement. The catalog validator now permits only the empty 24/9 pending route state or the complete
22/11 terminal route state. Six acceptance fixtures plus four catalog tests pass, including report,
capture, coverage, cold-byte and premature-route controls; both TypeScript projects pass, Rule 7 is
clean across 1,092 files and the diff check passes. Commit the verifier; real decisions remain blocked
on direct acceptance, scene generation, 297-image capture and visual review.

The final direct-acceptance transaction is now registered before implementation. One future tracked
decision file must pin the exact A/B/C reports, three-view contact sheets and clearance reports,
record every morphology rationale, and choose exactly three adjacent Capped Bullets stops. A
fail-closed verifier will recheck all selected actual web/scientific identities and clearance rows,
then atomically produce the consolidated 22-family / 66-variant direct review and fill only the 66
direct catalog slots. Implement and fixture-test that verifier while Fleet A continues, but do not
create the production decision file or accept any row before all real outputs are visually reviewed.

The fail-closed direct-acceptance verifier is now implemented. It rechecks contained A/B/C artifact
identities, complete 24-worker reports, every selected decoder/web/scientific identity, all registered
clearance rows and Capped Bullets adjacency before preparing the consolidated review and 66-slot
catalog/table transaction. Five focused fixtures pass: one complete 66-slot transaction plus exact
report drift, non-adjacent Capped Bullets, selected web-byte drift and incomplete-clearance controls.
Both TypeScript projects pass, the Rule 7 scan is clean across 1,087 files, and the diff check passes.
Commit the verifier; its production decision/review inputs remain absent until A/B/C visual review.

Final-resolution Fleet A then completed 24/24 jobs with 24 actual workers and zero failed/missing.
Its exact 591,740-byte report (SHA-256
`3f2450ea36371ad66198004e5f66368d59eeccb0e2ac021b46b973a121aa1cfd`) records 24 decoder-verified
web files from 623,976 to 10,923,005 bytes, all strictly below 20,000,000 bytes, plus 3,043
scientific files / 42,323,811,889 bytes with 109–121 mesh states per entry. The exact 4,225-byte
vertical-clearance report (SHA-256
`8badf5ef28933e6f3247edff9938ac30fe0345b38839492ae3439a166615f456`) passes 9/9 tall results:
Hollow Columns retain 238–249 Z layers at the closer boundary, Capped Columns 106–121 and Simple
Needles 178–196. Visual inspection of the exact 10,913,625-byte three-view sheet (SHA-256
`66222f9f5a84edb1b0132f7d049319b519c199eefa1c4f85f35af40a2572fcdf`) accepts all eight trios as
production candidates: planar forms retain their named face morphology, Hollow Columns/Needles are
axial and fully framed, and Capped Columns keep distinct caps at both ends. These 24 outputs remain
unaccepted until the consolidated A/B/C direct decision. Next commit this execution/review record,
then run `node scripts/named-crystal-final-resolution-production.ts run --fleet b` in the freed
24-worker lane; do not launch Fleet C concurrently.

Final-resolution Fleet B then completed 24/24 jobs with 24 actual workers and zero failed/missing.
Its exact 568,078-byte report (SHA-256
`51c23843bcbb0953d07fcd4ad0fe2d8734ee07b3c7a73e130fea713c5b8a97fe`) records 24 decoder-verified
web files from 4,769 to 444,686 bytes, all strictly below 20,000,000 bytes, plus 2,924 scientific
files / 12,489,068,672 bytes with 101–121 mesh states per entry. The exact 5,342-byte clearance
report (SHA-256 `0ce28de986c0424ea7adc2aabf720180ecfdccb7bfcdfaa8c78f062998235339`)
passes 12/12 tall results: Cups retain 246–250 Z layers at the closer boundary, Isolated Bullets
205–218, Sheaths 321–332 and Solid Columns 267–269. Visual inspection of the exact 8,666,417-byte
three-view sheet (SHA-256
`31dd77b506bf723dd110330e9497acc6c637286f061766b5ee172008b2386cae`) accepts all eight trios as
production candidates: the tall families are fully framed, Hollow Plates retain their cavity,
Scrolls remain asymmetric, Triangular Forms remain triangular and Split Plates & Stars remain
visibly split. These outputs remain unaccepted until the consolidated direct decision. Next commit
this record, then run `node scripts/named-crystal-final-resolution-production-c.ts run` in the freed
24-worker lane; do not start Compose generation concurrently.

Final-resolution Fleet C first pass then finished 21/24 with zero missing and 24 actual workers.
The exact 524,024-byte report (SHA-256
`84415852227cc635782358f5f2342173ff47edd9d2b910614a7a1b919e0d320e`) shows all nine Capped
Bullets searches and all Stellar Dendrites, Simple Stars and Skeletal Forms variants passed. The
exact 4,703-byte clearance report (SHA-256
`b368839ad836f358f83bedea994318bc686ba08078869a3e4ff7c880ba5067a0`) passes all 12 Columns on
Plates / Capped Bullets rows. Three child solvers exited zero and produced decoder-valid web files
below 20,000,000 bytes, but deterministic domain contact preceded their tick caps and left only
88/95/88 scientific frames: `columns-on-plates-upper` stopped at tick 10,251,
`double-plates-baseline` at 33,737 and `double-plates-upper` at 31,081. The active plan now registers
an exact three-job cadence-only repair at 86/282/260 ticks per frame, targeting 121 states while
requiring the final mesh/state/record/growth identities to remain byte-identical. Next implement and
focused-test the fail-closed repair/reconciliation tool, commit it, run the three jobs in parallel,
then render and inspect Fleet C's contact sheet. Do not weaken the 100-frame floor or change solver
recipes/domains.

The fail-closed cadence repair is now implemented. Its tracked manifest binds all first-pass and
unchanged-product identities; the runner derives exactly the three registered jobs, stages them in
a separate root, verifies 121-frame timelines plus byte-identical final mesh/checkpoint/record/web
products, archives the failed bundles, and reconciles the fleet without rewriting its original
24-worker launch. The read-only plan succeeds; the three focused files pass 13 tests; both
TypeScript projects, the Rule 7 scan (1,095 files) and diff check pass. Next commit this checkpoint,
then run `node scripts/named-crystal-final-resolution-c-cadence-repair.ts run`; the three independent
repairs use three actual workers because no other failed recipe exists to occupy the remaining
cores. After 3/3 completes, render and inspect Fleet C's three-view sheet.

The cadence repair generation completed 3/3 at exactly 121 frames each; the decoder-verified staged
web files are 1,599,644 / 5,877,133 / 6,214,328 bytes. Reconciliation then stopped before replacing
anything because the preregistered byte-identity assertion included `record.json` and
`growth-v1.bin`. Direct comparison proves every repaired final mesh and checkpoint is byte-identical.
The record differs only in generated paths, web byte count and wall time; strict decoding shows the
web event counts, seed counts, endpoints, dimensions, center, flat-index arrays and attach-tick
arrays are identical, while its provenance header records the different root and cadence argv. The
active plan now registers a correction: retain byte equality for mesh/checkpoint, require exact
field/event semantic equality for record/web, relocate only embedded root prefixes, and rebuild the
final inventory/status. Next implement and focused-test that correction, commit it, then rerun the
reconciliation stage without rerunning the completed solvers.

The correction is now implemented and product-sized verification passes: three focused files / 15
tests, both TypeScript projects, Rule 7 across 1,095 files and diff check. Exact mesh/checkpoint
identity remains mandatory; non-provenance record fields and both decoded attachment arrays now have
independent negative controls. The final-root files are re-decoded and recursively inventoried after
their embedded root prefixes are relocated. Next commit this correction and rerun the same repair
command; it must detect the complete 3/3 staged report, skip solver work, reconcile Fleet C and leave
the original failed bundles in the registered archive.

Fleet C is now complete and visually reviewed. Its exact 686,526-byte consolidated report (SHA-256
`0807b91d123516b4cbfc6d9be8306e8a1838b21f36e1f0e76d8363240e380490`) records 24/24,
decoder-verified web assets of 88,655–8,441,989 bytes, and 3,032 scientific files /
55,888,738,908 bytes with 102–121 frames. Clearance remains 12/12 in the exact 4,703-byte report
(SHA-256 `b368839ad836f358f83bedea994318bc686ba08078869a3e4ff7c880ba5067a0`). The exact 9,654,924-byte
three-view sheet (SHA-256
`4addc816196a172831df0702b7901d5f2028188076d8aaca1405672015cbee5d`) passes all five trios; Capped
Bullets stops 4,500/5,000/5,500 are the selected adjacent trio because each retains a tapered bullet
body and distinct plate cap. The exact three-fleet decision is now tracked. Next commit this review
and decision, then run `node scripts/named-crystal-final-direct-accept.ts` to fill 66 direct slots;
after its focused verification, build the 33 registered Compose scenes.

Final direct acceptance is complete: the exact 92,966-byte consolidated review (SHA-256
`31f5566114deae377d0a715bab2938b05750e5c6095a08e6144e6787023223ec`) binds 22 families / 66
variants, and the generated catalog is now 66 accepted / 33 remaining. Two focused tests had stale
0/99 fixture assumptions after the intended state transition; they now construct an explicit empty
direct fixture and assert the live 66/33 catalog. Both focused files pass nine tests, both TypeScript
projects pass, Rule 7 is clean across 1,097 files and diff check passes. Next commit this transaction,
then run `node scripts/named-crystal-final-compose.ts build`, capture all 297 real-browser review
images, inspect them and execute final Compose acceptance.

The first complete 297-capture Compose review is not accepted. Visual inspection found that the
fixed −500…500 scene cube makes several families tiny, while radial bullets/needles and crossed
needles overlap because their old Euler Z variation does not rotate the component's local Z axis in
the player's XYZ order. The active plan now registers exact event-derived transformed bounds, tested
polar-axis Euler rotations and high-visibility `bold-ice` review captures. Next commit this correction
protocol, implement it with focused geometry controls, rebuild the 33 scenes and replace all 297
review captures before creating any Compose decision.

The Compose framing/rotation correction is implemented. Exact decoded-event AABBs replace the fixed
cube; every transformed corner is checked against its published bounds; radial/crossed axes now use
a tested polar-to-XYZ mapping; and review switches to high-visibility `bold-ice`. Three focused files
pass 12 tests, both TypeScript projects pass, Rule 7 is clean across 1,097 files, JavaScript syntax
and diff checks pass. Next commit this implementation, rebuild the 33 scenes and regenerate the full
297-capture review before visual acceptance.

All 33 real Compose scene/scientific bundles are built. The first browser-review request stopped on
a Vite 403 before any scene rendered because the helper attempted raw `/@fs` access to `out/`, which
the app's security boundary intentionally denies. The boundary remains unchanged. The helper now
intercepts only the exact byte/SHA-verified scene and component URLs inside Playwright while serving
ordinary app code through loopback Vite; syntax, Rule 7 and diff checks pass. Next commit this helper
fix, rerun all 297 captures, then inspect the final-time three-view contact sheet.

The exact Playwright routes then reached and rendered the first real scene, but its first WebGPU
screenshot exceeded Playwright's unrelated 30-second capture default. The helper now gives scene
and contact-sheet screenshots the same 120-second ceiling already used for scene readiness. Next
commit this capture-only timeout and restart the browser review; no scene output or solver product
changed.

The corrected review reached 13/33 scenes before a second presentation defect was found and the run
was stopped: Multiply Capped Columns touches/crosses the viewport edge in oblique and axial views.
The transformed scene bounds themselves contain every component, but the orthographic fit omits
the yaw contribution from X and the final Compose `zoom` values below 1 shrink the calculated
half-span. The active plan now registers yaw-aware projected framing, a tall/yawed regression and a
minimum scene frame factor of 1. Next implement and focus-check that correction, rebuild the same 33
scenes, remove the partial rejected captures and restart all 297 views.

The yaw-aware projected-framing correction is implemented and focus-checked. Orthographic width and
height now include the actual yawed X/Y contributions, and final Compose scale-to-frame factors are
1 or 1.05 so the built-in 12% allowance remains positive. Fifteen focused tests pass, the root
typecheck covers both TypeScript projects, the app production build passes, Rule 7 is clean across
1,097 files and syntax/diff checks pass. Next commit the correction, rebuild all 33 scenes, remove
the rejected partial capture directory and restart the complete 297-view review.

That restarted review was stopped after six scenes because the first real face-on 12-branched Star
still reaches the top and bottom pixels despite the yaw-aware AABB fit. This partial capture set is
also rejected. The active plan now registers a conservative 1.4 scene frame factor plus a live
Three.js projected-cell rectangle that makes the browser harness fail unless every view retains 5%
clearance on all sides. Next implement/focus-check the rendered-clearance contract, rebuild the 33
scenes and validate the first flat and tall sentinels before continuing the full pass.

The rendered-clearance gate is implemented: full-growth decoded cells are projected through the
actual Three.js component/scene matrices and camera, and the review helper refuses a view outside
`-0.9..0.9` NDC before taking screenshots. Final Compose scenes use a conservative 1.4 frame factor.
Four focused files pass 16 tests, both TypeScript projects and the app production build pass, Rule 7
is clean across 1,097 files and syntax/diff checks pass. Next commit, rebuild, archive the rejected
partial review and restart with early flat/tall visual sentinels.

That final pass completed all 33 scenes / 297 captures with every live clearance check passing.
Flat and tall sentinels plus the complete contact sheet and representative seed/middle/final frames
passed visual review. The exact 45,797-byte Compose report (SHA-256
`d20832db1c7af49aaaae8e132b536e0298b8a992a11d9c5a25a1dc62a6513467`), 137,828-byte browser review
(SHA-256 `42b25f9177cdadd5ea7aa9931c3b2f74db0459c6bba9d0de1dd3422260d9d311`) and 5,243,676-byte contact
sheet (SHA-256 `0e2ea39dccb3fbf2b2c5bed4ef81ecf000670c1afbb80e999b76fe1397f47e59`) are bound by the tracked
decision and consolidated review. Final acceptance atomically filled the last 33 slots and changed
Multiply Capped Columns and Needle Clusters to Compose. The catalog is terminal at 99 accepted /
zero remaining, 22 direct / 11 Compose / two excluded; every cold web payload is below 20,000,000
bytes. Six focused files pass 26 tests, the root typecheck, app production build, Rule 7 across 1,099
files and diff check pass. This workstream has no remaining generation step. Publication or copying
these local products is a separate maker-authorized transaction if desired.

### Named snow-crystal local gallery — complete

The [local gallery plan](plans/named-crystal-local-gallery.md) completed the dedicated Vite page,
exact allowlist service and truthful direct/Compose playback distinction. Focused tests passed 2
files / 6 tests, both TypeScript projects typechecked, the app production build and Rule 7 passed,
and the live browser smoke covered the serving boundary plus one direct and one Compose playback.
No gallery implementation step remains. Public deployment or cross-repository copying would be a
separate maker-authorized transaction.

### Named snow-crystal volume rendering — complete

The [volume-rendered gallery plan](plans/named-crystal-volume-gallery.md) is complete. All 99 cards
now use matching final-frame previews and open the component-aware GG-style volume player. The
direct planar, tall/hollow and Compose sentinels passed visual inspection; the complete 66-direct /
33-Compose browser sweep passed framing, error and shared-texture assertions. Focused tests passed
three files / nine tests, both TypeScript projects typechecked, the app production build, Rule 7,
script syntax, diff check and the live gallery smoke passed. No solver, growth history, accepted
identity, scientific claim or network-payload ceiling changed. The loopback page remains
`http://127.0.0.1:5173/named-crystal-catalog.html`; public deployment is a separate transaction.

### Named snow-crystal volume stability correction — complete

The [volume stability correction](plans/named-crystal-volume-stability-correction.md) is complete.
The maker's exact 12-branched Star, its direct Simple Star source, two adjacent orbit frames, a
six-component Radiating Dendrite and thin/tall/hollow sentinels now render without the invalid black
pattern. All 99 previews were regenerated; the full browser sweep passed 66 direct / 33 Compose
players and the gallery smoke passed its serving boundary plus both playback routes. Focused tests,
both TypeScript projects, the app build, Rule 7, script syntax and diff checks pass. No solver output,
accepted identity, Compose transform, animation timing or network payload changed. The loopback page
remains `http://127.0.0.1:5173/named-crystal-catalog.html`.

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
