# Progress history — Phases 6, 8, and 9 (through 2026-08-20)

**Historical snapshot — not current authority.** [PROGRESS.md](PROGRESS.md) is the live index.
These entries were moved out of the live index on 2026-08-20 during the post-Phase-6 compaction
(maker direction), following the same pattern as
[progress-history-through-2026-08-02.md](progress-history-through-2026-08-02.md), which holds
everything through Phase 5. Entries are preserved as last written, with their original artifact
quotes and hashes; the authoritative detail lives in the linked plans, decisions, and evidence.
A later record supersedes an earlier one; superseding notes are marked in place.

## Phase 6

- The maker's 2026-08-03 direction is recorded verbatim in the
  [completed Phase 6 plan](plans/phase-6-science-first-completion.md) and enacted by accepted decisions
  [0042](decisions/0042-bound-phase6-evidence-integrity-scope.md),
  [0043](decisions/0043-defer-incompatible-heldout-families.md), and
  [0044](decisions/0044-defer-phase6-preview-gpu-cohort.md) plus charter v1.21. The threat model is
  accidental error/crash/environment drift, with attacker-only local tamper closed as history; each
  unit gets one proportionate non-author review engagement. Held-out validation and the v6
  WGSL/preview-GPU cohort move to named Phase 7 work packages owned by `billatgameology`, with no
  Phase 6 credit. Decision 0045 later retained the three measured-only arms and budget-capped
  numerical ladder, but closed R15, the conservative-intersection headline, and the full production
  campaign as not computed.
- [ADR 0041](decisions/0041-phase6-ryzen9-host.md) and charter v1.20 landed canonically in
  `1ff948c`. The manifest-covered [host observation](../evidence/phase6-host/observation-20260803T033028Z.json)
  is 3,051 bytes with SHA-256
  `a21e93a7433666981b1b347f5b88a03e8d4e75658e4e9c25a360aae120a055dd`: Node reports an AMD
  Ryzen 9 5900XT, 32 logical processors, and 68,603,244,544 physical-memory bytes; `nvidia-smi`
  reports the RTX 3080, 10,240 MiB, and driver 591.86. Historical Phase 5 and pre-upgrade Phase 6
  evidence keeps its Ryzen 7 provenance and stated host-binding limits. New evidence records actual
  host, runtime, process concurrency, command, and flags.
- Historical extent-21 artifacts remain valid measured-only comparisons: **CAK 3/90, M1 54/90**
  over their named scopes. They are not the registered conservative-intersection verdict. R15 still
  has no production caller or complete artifact-derived gate, and numerical adequacy is unproved.
  *(Superseded 2026-08-20: decision 0045 closed R15 and the conservative-intersection headline as
  not computed, and the ladder published the numerics NO-PASS; the measured-only counts stand.)*
- **The arm-3 sweep is EXECUTED and published (2026-08-07).** 204/204 points at the registered
  configuration, exit 0, execution head `6340429`, from the two-stage freeze `6d140bf`/`e209d98`
  (values hash `297927da…2db92e` gated). Quoted from
  `evidence/phase6-sweep-arm3/report.json` (1,365 bytes, SHA-256 `32d18a1d…`): headline **5/78
  arm-scope, 5/90 common denominator**, neutral 155, excluded 0, extent-fragile 24. All five
  headline agreements sit in the single-temperature plates-warm regime (5/6 at −2 °C; 0/72
  elsewhere in headline scope) — structurally like arm 1's 3/90. The bistable band records
  11/18 non-neutral rows, all plates; in that band the registered rule accepts either pure
  class, so any non-neutral row agrees by construction. Measured-only grade; the registered
  conservative-intersection headline is not computed (decision 0045); numerical adequacy is per
  the published NO-PASS ladder verdict. The matched M1-versus-ablation pair shows agreement collapsing
  54/90 → 5/90 when only the two dip factors are replaced by one — an implementation-level
  contrast that cannot establish physical SDAK causality or necessity in nature. Points/diagram
  are manifested (244,610 / 30,634 bytes). The Rule 9 sibling verifier passes and is
  suite-pinned; the unit's non-author review returned **0 blockers** (its own 204-row
  recomputation matched every published number; ten hardening items recorded in
  [the arm-3 plan](plans/phase-6-arm3-sweep.md), four adopted).
- [ADR 0040](decisions/0040-correct-phase6-coefficient-and-sdak-provenance.md) and charter v1.19
  govern the coefficient/provenance correction. The current LF-normalized parameter table is 50,464
  bytes with SHA-256 `c0b314b681146152207f061209a3097609e34a234b0027ed73faa427334c79e2`.
  Historical parameter/protocol hashes and both legacy manifest schemas remain untouched.
- The candidate source lock covers five files, 21 Harrison archive members, and all 16 reconciled
  levitation traces but remains `passEligible=false`. The audited incompatibility finding is that no
  current held-out family is apples-to-apples with the implemented geometry and transport physics;
  decision 0043 defers all four without calling that a pass. The amended
  [source-currency record](../research/phase6-source-currency.md) is 29,714 bytes with SHA-256
  `af045438ab2e4bb0de82aea4b289388d7d2c0448322298f7ecfe4ed21e5d2563`. No provider request, new
  import, TAX2 measurement, R15 row, GPU validation row, or production solver job ran.
- `crystallographicSpans()` reports exact integer `basalCaliper2`/`zLayers` (focused tests cover
  all D6 planar transforms and z reflection); not yet a reviewed source-to-model size mapping and
  no substitute for numerical controls.
- Proposed [ADR 0039](decisions/0039-cycle-boundary-lk-resume-checkpoints.md) keeps runner resume
  deferred until WP3 freezes it; production rows may not resume before acceptance. *(Phase 6
  closed without a WP3 freeze; ADR 0039 remains proposed, not accepted.)*
- Education is frozen for Phase 6; the one maker-approved exception (`af7463b`, 2026-08-04) added
  the independent-laboratory record to chapters 4–13, `references.html`, and
  `FUTURE-ADDITIONS.md`. No other `docs/education/**` drift since `60e3f3f` (diff-verified
  2026-08-06); `8acf9fe` added proposed Phase 8–10 drafts. Decisions 0046/0050 adopted Phases 8–9
  without reopening education; Phase 10 remains uncharted and inactive. **Pages deploy retired
  2026-08-16 (maker direction):** `pages.yml` deleted, GitHub Pages disabled, content stays
  in-repo unpublished; `test.yml` CI unaffected.
- The gut-check exploration (`explore/gg-realism-gutcheck`) is MERGED to `main` (`98bc75d`,
  2026-08-12, merged-tree suite green); eyeball-only, not evidence, no solver code touched.
- **WP1 size strata are FROZEN (2026-08-06).** `evidence/phase6-size-strata/strata.json` is
  18,867 bytes with SHA-256 `aba93698ad6dcd72237a9c7ffa48588143533db315c059a29f6cd98c8d0288b6`:
  S1 observed initial radius `[5.8999999999999995, 12.1]` µm (15 uncontested Harrison traces;
  `716d` echoed, flagged, excluded per the lock's unresolved-mismatch pin) and S2 grown
  mass-equivalent radius at 300 s `[9.472732790460505, 20.459585775743665]` µm (declared
  uniform-density closure; centrals are floors on half the true maximum dimension), plus warm
  anchor W1 and seven refusals. Frozen after a three-round non-author review ending CONFIRMED
  with 0 open blockers; provenance and limits (different-model status not established) are in
  [the WP1 plan](plans/phase-6-wp1-size-strata.md)'s Review record. Exact `npm.cmd test` on the
  frozen tree exited 0: Rule 7 clean over 436 files, both TypeScript projects, Vitest 82 files /
  1,454 tests in 628.68 s. Whether WP2 uses Z = 2 or Z = 1 strata is a WP2/WP3 protocol
  decision. *(Phase 6 closed without a WP3 freeze; the ladder consumed floor sizes only and the
  S2-ceiling stratum's numerics remain UNVERIFIED.)*

### Phase 6 closure record (2026-08-20)

The 80-row ladder (frozen plan, three-round pre-execution review, execution and
post-execution review records, all in [phase-6-wp2-ladder.md](plans/phase-6-wp2-ladder.md))
completed 2026-08-20 with **overall NO-PASS, class `criterion`, both spacings**. Quoted from
[`evidence/phase6-wp2-ladder/report.json`](../evidence/phase6-wp2-ladder/report.json)
(43,863 bytes, SHA-256 `fd20f701…ebb7`; bound [`rows.jsonl`](../evidence/phase6-wp2-ladder/rows.jsonl)
73,873 bytes, `c4fa70f7…cd14`): attached-cell counts exceeded the registered 0.5% agreement
at 5/16 coarse-domain, 6/16 fine-domain, and 17/32 auxiliary check points, with
seed-perturbation deltas reaching 9.285%; all 80 rows stopped `size-target` with 0
missing/unexpected/defects and exactly the three sanctioned heads. The numerics are published
as NOT converged at these resolutions; the S2-ceiling stratum stays UNVERIFIED; a pass would
have authorized no production (decision 0045). The WP2 non-author review confirmed the
verdict (0 blockers; all 28 failing comparisons re-derived to three decimals; verifier
suite-pinned at `app/scripts/phase6-wp2-ladder-independent.mjs`). WP8 executed same day: the
pinned [three-arm narrative](../evidence/phase6-three-arm-report/report.md), the flagless
`gate6` (`runner/src/gate6-aggregate.ts`) with 14 suite-pinned negative controls, the gate
unit's non-author review, exact `npm test`, and reconciliation; Phase 6 changed to complete
on the gate's exit 0, per the plan's WP8 rule. A same-day macOS re-derivation at `9e64ef7`
(clean tree) reproduced gate6 13/13 / exit 0 and exact `TMPDIR=/private/tmp npm test` green:
132 files, 2,250 passed / 7 skipped in 403.61 s. Held-out and preview-GPU work remain
Phase 7 property with no Phase 6 credit.

## Phase 8

The compact completion record stays in [PROGRESS.md](PROGRESS.md) (its pinned status bullet and
gate row); the detailed work records are the
[Phase 8A target-book plan](plans/phase-8-what-is-real.md) and the
[Phase 8B measurement-corpus plan](plans/phase-8-measurement-corpus.md), with the plain-English
map in [phase8-baseline-guide.md](phase8-baseline-guide.md).

## Phase 9

- **The Phase 9 knowledge baseline is COMPLETE (research-only, 2026-08-12).** Its
  [report](../research/phase9-knowledge-sources.md), [guide](phase9-knowledge-guide.md), and
  [artifact](../evidence/phase9-knowledge-baseline-v1/report.json) (5,263 bytes; SHA-256
  `37c7aadf18bce7420883930f66d6c6a473100dd27e1468dd8396a3c1214b1f96`) preserve 18 sources and
  15 hypotheses. It is now a bound S0B input; no model ran during its construction.
- Related record: two rejected D-BT candidates (10 files / 85,153 bytes) are preserved on NAS;
  14 post-freeze payloads are logged in
  [`phase9-post-freeze-source-intake-v1.json`](../research/phase9-post-freeze-source-intake-v1.json)
  (unregistered, not evidence). The [CI repair](https://github.com/billatgameology/snowflake/pull/6)
  merged green on Ubuntu. Phase 9 was not reopened.

## Infrastructure

### Gutcheck/NAS relocation — landed and approved (2026-08-14)

`ffb3a5e` lands the 254-path relocation/hardening unit. Claude Fable 5 approved it with zero
blockers after 72/72 focused tests and reviewer exact `TMPDIR=/private/tmp npm test`: 1,722
passed / 7 skipped (`out/checks/npm-test-round3-review.log`, SHA-256 `2a90d0d5…b11d`). Windows
`S:/` and full NAS replay remain unexecuted; two deferred low findings are in the plan.
*(Superseded 2026-08-20: the Windows write lane executed; see the entry below.)*

### NAS asset governance detail (through 2026-08-20)

The [governance plan](plans/nas-asset-governance.md) holds the full record. `d92f39a` applied
the macOS correction without deletion (diagnostics 434 files / 666,233,360 bytes; quarantine
497 / 167,758,628; receipt `7de6caa2…220`). The Windows write lane executed 2026-08-20
(`0b34ee9`), quoted from the plan's apply record: 11 collections, 8,362 files, 2,774,126,334
bytes staged and promoted with three-way hash identity; receipt
`_control/receipts/migrations/windows-workspace-2026-08-20/result.json` (465,124 bytes,
SHA-256 `254d5b70…5c0f`); 11/11 fresh-process full verifies and a green restore round-trip;
the ledger owns 31,090 files / 471,637,028,713 bytes. The external-evidence backup gap closed
same day (`9e64ef7`): both external-evidence collections copied to an independent domain
(workstation C: drive), 37 files / 137,211,035 bytes verified twice against ledger pins, and
both catalogue entries now carry `backup.status: verified`. SMB rename crash-durability stays
verification-based (win32 cannot fsync a directory handle). The maker's exact prune approval
remains a separate future decision.
