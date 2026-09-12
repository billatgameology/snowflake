# Plan — Phase 6 WP2 numerical-control ladder (decision-0045 bounded)

- **Phase:** Phase 6 — Validation against the Nakaya diagram
- **Status:** COMPLETE 2026-08-20 — frozen 2026-08-08, reviewed pre-execution, executed 80/80
  (2026-08-08 → 2026-08-20), verdict NO-PASS (criterion) published at
  `evidence/phase6-wp2-ladder/`, post-execution review CONFIRMED with 0 blockers
- **Started:** 2026-08-07
- **Last touched:** 2026-08-08 by Claude Fable 5

The budget-capped numerical-control ladder that decision 0045 retains. Its outcome — pass or
no-pass — is the registered numerics verdict attached to every measured-only Phase 6 result.
**A pass authorizes no production campaign** (decision 0045 item 2, stated in advance). No
value in this file may be tuned after any rung's morphology is seen.

## Done when

The ladder either (a) identifies, by the pre-registered criteria and selection function alone,
a configuration at the frozen strata sizes whose registered checks all pass, or (b) exhausts
its registered rungs or its budget and publishes the no-pass with every rung's evidence under
`evidence/`. Both outcomes complete WP2 under decision 0045. The unit has one proportionate
non-author review of this frozen pre-registration BEFORE execution, and the published result
is independently re-derived from the artifact bytes.

## Registered criteria (inherited, not new)

- **Domain adequacy** (the registered `PHASE6_DOMAIN_SPOT_CHECK` criterion): identical habit
  class AND attached-cell counts within 0.5% between successive registered domain rungs; a
  size passes when two successive increments pass.
- **Timestep control:** halve `cflFill` at the registered check points; same 0.5%/class
  comparison against the unhalved run.
- **Relaxation control:** tighten `relaxTol` one decade at the registered check points; same
  comparison.
- **Spacing sensitivity:** the registered spacings 0.7 / 0.35 / 0.2333 µm at the check points,
  reported as measured sensitivity (no extrapolation operator — R15's production application
  is closed by decision 0045; `phase6FitGridExtrapolation` stays uncalled).
- **Seed-mapping sensitivity:** ±1 cell on the mapped seed radius at the check points.

## Frozen inputs

- Sizes: the frozen WP1 strata (`evidence/phase6-size-strata/strata.json`, SHA-256
  `aba93698…d0288b6`): S1 seed radii mapped `round(r_seed/dxUm)` cells; S2 measurement spans
  mapped `round(2·r_meas/dxUm)` cells (span semantics per the recon plan's corrected mapping).
- Arms: M1 and CAK at every rung (the two historical arms); the ablation arm inherits M1's
  rung verdict as an UNTESTED TRANSFER ASSUMPTION (Rule 11), not a measurement — the ladder
  runs M1 and CAK separately precisely because `paramSet` may matter, so the inheritance is
  recorded as an assumption the verdict carries, never as evidence.
- Check points, frozen by stated rule: **the four points the registered `domain-budgets` row
  already designated for its spot-check, unchanged** — `(−31 °C, f = 0.60)`,
  `(−13 °C, f = 0.15)`, `(−6 °C, f = 0.15)`, `(−27 °C, f = 0.15)`. The rule grants zero
  selection freedom, spans both habit axes and both fraction extremes among historically
  designated points, and makes every ladder comparison continuous with ADR 0037's measured
  history. Both arms (M1 and CAK) run at all four points at every rung.

## Budget and rungs (frozen 2026-08-08 from the closed Stage A data)

- **Size configuration:** seed 17 cells growing to extent 54 at `dxUm = 0.35` (the S1-floor
  seed with the S2-floor measurement span), and its coarse replicate seed 8 → extent 27 at
  `dxUm = 0.7`. The S1-ceiling seed (35 cells) pairs coherently only with ceiling-scale
  extents, which the Stage A closure records as measured-scaling-infeasible; the fine spacing
  0.2333 µm at these sizes (seed 25 → extent 81, N ≥ 128) projects past the per-rung cap by
  the same measured scaling. Both exclusions are cost facts recorded here, and the verdict's
  scope statement names them: **the ladder verdict covers the floor sizes at spacings
  0.7/0.35 µm only.**
- **Domain rungs:** at 0.35 µm — `N = 96, 112, 128` (guard floor 54/0.65 = 83.1; increments
  of 16, the historical convention); at 0.7 µm — `N = 48, 64, 80` (the historical rungs).
  Enumeration order: coarse spacing fully first (cheapest, catches driver defects), then
  0.35 µm rungs ascending. Pass at a spacing requires the registered criterion at BOTH
  successive increments (96→112 and 112→128; 48→64 and 64→80).
- **Auxiliary controls at the base rung** (0.35 µm, N = 96, all four points, both arms):
  `cflFill` halved to 0.05; `relaxTol` tightened to 1e-10; seed radius ±1 cell (16 and 18).
  Same 0.5%/class comparison against the base run.
- **Row count and budget:** 24 domain rows per spacing × 2 spacings = 48, plus 32 auxiliary
  rows = **80 rows total**. Measured anchor: 2.9 h at N = 96 (one point, M1) — a Stage A Dirichlet run, NON-TRANSFERABLE
  (Rule 11): it sizes budgets and caps only and can never enter a verdict; budget ≤ 3
  wall-clock days at recorded concurrency ≤ 12, per-row wall cap **10 h** (one host
  up-window). Rows are scientifically independent and may run concurrently; concurrency is
  recorded execution provenance and no scheduling choice changes a case's PHYSICS — but
  contention can push a row into its wall cap, so a capped row under concurrency is an
  infrastructure fact, and the published report separates every no-pass into criterion,
  infrastructure, or mixed classes so a scheduling exhaustion is never read as a numerics
  failure.
- **Caps and drops:** a wall-capped row is recorded `wall-cap-infrastructure` and treated as
  not-comparable — it can only produce no-pass, never a silent exclusion. If the enumeration
  threatens the 3-day budget, rows drop in pre-declared reverse priority: auxiliary seed-±1
  first, then relaxTol, then cfl (the 0.7 µm N = 80 rung executes third of ten enumeration
  blocks and is unreachable by budget truncation — recorded, review H8). A dropped row is a
  missing row: the evaluator's missing-row list is the drop log, and any drop that removes a
  criterion's data forces no-pass for that criterion.
- **Fixed run configuration, frozen:** every row uses the registered sweep configuration
  except where a rung or control varies it by name — `aggregate-hv-g1h1-v6`,
  `farField = monopole-matched` (the registered §2.4 condition the sweeps executed; the
  Stage A probe's Dirichlet runs were non-transferable and are not comparable),
  `pressurePa = 101325`, `noiseEpsilon = 0`, `rngSeed = 1`, `domain = hexPrism`,
  `divTol = 1e-7`, `relaxMaxSweeps = 200000`, seed thickness `2·seedRadius + 1` (the
  isometric mapping the strata freeze records), step cap `100000` cycles (equal to the
  registered fixture's `steps`), and the `0.65` domain-contact guard.
- **Stop mapping, frozen:** rows stop on the existing `size-target` machinery at the mapped
  extent span (54 or 27). Recorded reason: S2 centrals are floors on half the true maximum
  dimension, and an extent-span stop measures habit at that observable scale with tested
  machinery; the ladder driver is itself a new in-process evidence path, and within it the extent-span
  stop reuses the tested `size-target` semantics, while an attached-count stop would add a
  second new, untested stopping rule. Stage A recorded both quantities; the choice
  was fixed here before any rung ran.
- **The deterministic selection function:** a spacing PASSES iff, at all four points and both
  arms, both successive domain increments satisfy the registered criterion (identical class
  AND attached counts within 0.5%) AND every auxiliary control at the base rung satisfies the
  same comparison. The auxiliary conjunct gates BOTH spacings (the strict reading, fixed here so it cannot be
  re-argued after results). Anything else — any failed comparison, capped row, dropped row,
  or unconverged run — is **no-pass for that spacing**. The published verdict is the per-spacing
  pass/no-pass table plus the scope statement; nothing selects among passing rungs, and a
  pass authorizes no production campaign (decision 0045, stated in advance).

## Execution scheduling record

- 2026-08-08: launched at concurrency 12 from `f59d187`. The complete coarse spacing (24/24
  rows, all `size-target`) measured ~10× per-process wall inflation at sustained 12-way (the
  N = 80 coarse row: 24,228.3 s against a ~2,000–2,500 s serial expectation) — memory-bus
  saturation on this dual-channel host. At that inflation every 0.35 µm row projects past its
  10 h cap, which would convert the central domain comparisons into infrastructure cap rows.
  The dispatcher was stopped (12 in-flight 0.35 µm rows discarded unrecorded, ~6.4 h each) and
  relaunched at concurrency 6 — a scheduling choice inside the frozen 1..12 range, recorded
  per row in the artifact; no case's physics changes. The 3-day budget may stretch; the
  maker's 2026-08-07 clarification (envelope bounds scope, not correctness) governs.
- 2026-08-08 (later): the concurrency-6 relaunch was itself refused by the B2 HEAD-continuity
  guard — the scheduling-record commit had moved `main` past the freeze-era head the 24
  recorded rows carry. Working as designed. Execution moved to the pinned worktree
  `G:Code Filessnowflake-phase6-ladder` at detached HEAD `f59d187` (the arm-2 worktree
  pattern), so the whole artifact stays single-head while `main` remains free for records;
  `npm install` there dirtied `package-lock.json` and was restored before launch (the
  dirty-tree refusal fired first, also as designed). The deeper contention source was also
  identified: five maker gut-check solver runs (`dialin-b1p3-*`) share the memory bus from
  the exploration worktree. Relaunched at concurrency 4 to co-exist with them; per-row
  concurrency is recorded in the artifact.

- 2026-08-09: maker-directed cap amendment, selected in an interactive session from written
  options ("Keep both; pre-declare 16 h caps") and pre-declared BEFORE any N=112/128 row ran:
  the 0.35 µm class (domain rungs and the N=96-based auxiliary rows) carries a **16 h wall
  cap**; the 0.7 µm rows keep 10 h. Basis, measured: the first N=96 row took 24,699.5 s at
  concurrency 4 beside four maker gut-check runs (~2.4× its isolated anchor), and its sibling
  rows then passed 9 h under the same load. This is an infrastructure parameter with a
  recorded basis, never a criterion change. Implementing it requires a new commit, so the
  execution becomes a sanctioned TWO-PHASE run: rows recorded before the amendment carry the
  freeze-era head `f59d187`; all later rows carry exactly one amendment head; and every
  N=112/128 row must carry the amendment head (none ran before it). The evaluator enforces
  that shape fail-closed (a third head, or a heavy row at the freeze head, is an artifact
  defect forcing no-pass), reports both heads, and the unit review checks the amendment head
  equals this amendment's landing commit — operatively `aa81295`, the commit that also aligned
  the dispatcher's continuity check with this sanction (the `a0c69fd` relaunch was refused by
  the dispatcher's own guard, recorded in the launch logs).
- 2026-08-09 (minutes later): the maker superseded the 16 h choice with the direction,
  verbatim: "we shouldn't stop anything with arbitrary timeliness, if it takes longer , it's
  okay." Every row now carries a uniform **48 h runaway-hang backstop** — a wedged-process
  protection, never a scheduling stop; slow rows are science and run to completion. The
  two-phase head record above is unchanged. The four N=96 rows in flight under the old
  10 h dispatcher finish or cap on their own; any capped row is retired by the sanctioned
  `--retry-row` path and re-run to completion under the amendment head.

- 2026-08-11: second amendment under the same maker direction. A legitimate, converged N=96
  row measured **39.6 h** under co-tenant load — under the 48 h "runaway" backstop's regime —
  so at N=112/128 the backstop would have killed honest science. The wall backstop is REMOVED
  entirely: every row is already bounded by construction (registered step cap 100,000 cycles ×
  relaxation cap 200,000 sweeps/cycle), so no wall guard is needed for termination, and an
  OS-level hang is handled by the sanctioned `--retry-row` path. Cap history: 10 h (frozen)
  → 16 h class (superseded in minutes) → 48 h backstop → none. The sanctioned head list
  gains this amendment's landing commit as its third member (freeze `f59d187`, first
  amendment `aa81295`, plus at most one later head), enforced fail-closed by the evaluator;
  the swap happened at the −27 °C row boundary. Operatively the third head is `3827b77` —
  the commit that also taught the dispatcher's continuity allow-list the full sanctioned set
  after it refused the aa81295-era rows (launch logs record the refusal); no row ran at the
  intermediate `151d679`.

- 2026-08-12: the maker's gut-check solver runs completed and the maker directed, verbatim:
  "you may kill the 3 gutcheck dev server / the entire pc is yours, max out all cores." The
  dev servers were stopped and the dispatcher restarted at concurrency 12 (the plan's recorded
  ceiling) on the now-dedicated host, same head `3827b77`; the four in-flight N=112 rows
  re-run among the 12 slots — total time-to-finish improves even counting the discarded
  progress (measured aggregate throughput roughly doubles from 4-way to 8+-way on this
  bandwidth-bound host). Scheduling only; no case's physics changes.

- 2026-08-20 (post-execution review corrections, appended — the entries above are preserved
  as written): the review's millisecond slot-chain reconstruction of the artifact found two
  omissions in this record. (1) The 2026-08-09 account "the four N=96 rows in flight under
  the old 10 h dispatcher finish or cap on their own" is contradicted by the artifact: the
  aa81295-era re-runs of those four rows started 13:30:25Z, ~61 minutes before the earliest
  possible 10 h self-cap of siblings launched 04:31:44Z, so the amendment relaunch discarded
  roughly 27–29 h of aggregate in-flight compute unrecorded (only
  `dom-0.35-n96@-13C-f0.15-M1` survived to record under the freeze head). (2) Slot-chain
  accounting implies an unrecorded ~48 h aa-era attempt of `dom-0.35-n96@-27C-f0.15-M1`: the
  slot freed at 08-10T08:16:29.902Z has no recorded backfill while every other slot-free
  event backfills within 10 ms, and a row started then would hit the 48 h backstop at exactly
  08-12T08:16:29.9Z — i.e. the backstop DID kill one legitimate in-flight N=96 row before the
  2026-08-11 amendment removed it; the row's only recorded run is the first slot of the
  08-12T21:48:07Z concurrency-12 batch (36.85 h, `size-target`). Neither affects any recorded
  row's physics, the artifact's completeness, or the sanctioned head shape. Also recorded:
  the wall values quoted in the 2026-08-08/-09 entries above (24,228.3 s; 24,699.5 s) are
  dispatcher-log spans ~0.5 s above the rows' self-recorded `wallSeconds` (24,227.8;
  24,699.0) — the artifact's numbers are authoritative.

## Out of scope

- Any production-configuration selection or campaign authorization (decision 0045).
- The R15 extrapolation operator, conservative intersection, and WP4 path (closed by 0045).
- Any change to the frozen strata, the recon plan, or historical evidence.

## Tried and rejected

(Inherited: N = 48/64/80 all fail the registered criterion at extent 21 — ADR 0037; the
extent ladder is non-monotone; probes transfer only from the registered configuration,
Rule 11. Append new entries as they occur.)

## Open questions

(Both prior open questions were fixed in the 2026-08-08 freeze above: the stop mapping is the
extent-span `size-target` machinery with its recorded reason, and the four check points are
the registered `domain-budgets` spot-check points, unchanged, by the zero-freedom rule.)

## Review record (post-execution, 2026-08-20)

**Engagement.** The unit's one post-execution non-author review, discharging the "Done when"
requirement that the published result be independently re-derived from the artifact bytes.
Provenance (Rule 10): performed 2026-08-20 by six independent Claude Fable 5
(`claude-fable-5`) agent contexts orchestrated from the authoring session but sharing no
conversation state with it; different-model status is NOT established (same limitation the
WP1 review recorded). Review inputs: the frozen plan, `evidence/phase6-wp2-ladder/`
(`rows.jsonl` SHA-256 `c4fa70f7…cd14`, `report.json` `fd20f701…ebb7`), the strata freeze,
decision 0045, and repository history at `c459933`.

**Method and outcome.** (1) A firewalled reviewer — barred from the author evaluator, its
tests, and the report — re-implemented the selection function from this plan plus the
registered `phase6DomainSpotCheckPasses`/`phase6ClassifyHabit` operators and recomputed the
verdict from `rows.jsonl`: **complete agreement** — overall no-pass, both spacings no-pass,
the identical 28 distinct failing comparisons (5 coarse-domain, 6 fine-domain, 17 auxiliary)
with every percentage matching to three decimals, pass counts 11/16, 10/16, 15/32, and the
same three-head census. The convention that the coarse/base run is the 0.5% denominator was
confirmed against the registered operator and shown not outcome-determining (0 of 64
comparisons flip under the alternative). (2) Integrity: recomputed hashes match the report
binding and MANIFEST pins; all 80 rows carry the frozen configuration; heads are exactly the
sanctioned three with no heavy row at the freeze head and no row at `151d679`. (3) Documents:
the strata hash, the four check points' pre-plan registration (`a1cb4bb`/ADR 0037,
2026-07-31), decision-0045 obligations in the scope statement, the seed/extent mapping, and
zero extrapolation/R15 references all verify. (4) Scheduling: the artifact's concurrency,
head-era, and stop-reason shape matches this record; per-tier wall statistics published in
the review transcript. (5) Rule 9: six named mutation controls (count +0.6% / −0.4% at the
boundary, deleted row, unsanctioned head, `step-cap` stop, habit-class flip) each produced
exactly the expected detection; the real evidence bytes were hash-verified untouched after
the runs. **Verdict: CONFIRMED, 0 blockers.**

**Findings adopted and remediated (same day).** (a) Rule 6 transcription defect in
PROGRESS.md's abbreviated rows hash (`…8d14` → `…cd14`) — corrected. (b) Extent parity: all
56 fine-spacing rows stop at extent 55, the first reachable extent ≥ the mapped target 54 on
the odd-extent lattice (coarse rows hit 27 exactly); uniform on both sides of every
comparison so the like-for-like property holds; PROGRESS wording corrected and the fact
recorded here — the report's "to extent 54" scope phrasing describes the mapped target, and
the artifact's `finalExtent` fields are authoritative. (c) Two scheduling-record omissions —
corrected by the dated append above; the original entries are preserved as written.
(d) Notes recorded without action: the report's singular `amendmentHead` field names the
operative third head while `aa81295` appears in `distinctGitHeads` (the full sanctioned set
is recoverable from the artifact); `rowsPath` names the ephemeral worktree path (the hash
binding carries provenance); the spacing-sensitivity criterion is discharged implicitly by
the published per-spacing rows rather than as a named report section; the guard value 0.65
and step-cap are not echoed as row fields (verified indirectly). The reviewer's own notes
contained one internal typo (seed18 breakdown 2/8 vs the correct 1/8), caught by the
cross-comparison agent; no table or verdict was affected.

**Suite pinning.** The reviewer's verifier is committed as
`app/scripts/phase6-wp2-ladder-independent.mjs` (changes from the reviewed original: portable
path resolution and an explicit rows-path argument only) with
`runner/test/phase6-wp2-ladder-independent.test.ts` re-asserting the re-derived verdict,
the report agreement, and four of the mutation controls on every suite run.
