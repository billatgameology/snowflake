# Handoff — Phase 6 science-first completion active (2026-08-01)

Read this file, then `docs/phase6-lessons.md`, `docs/PROGRESS.md`, and the active
`docs/plans/phase-6-science-first-completion.md`. The older
`docs/plans/phase-6-nakaya-validation.md` is historical registration, not the live schedule.

## 1. Where the project is

**Phases 2b, 3, 4 and 5 are complete. Phase 6 is ACTIVE AND INCOMPLETE.** The maker accepted the
historical failure to reproduce the Nakaya diagram and directed the science-first branch of O1b:
execute the omitted obligations rather than narrow the charter. Resource cost may control scheduling
and concurrency; it may not weaken a scientific criterion.

The two historical extent-21 artifacts remain valid measured-only results:

| artifact | measured-only agreement | classes plate / neutral / column | scope |
|---|---:|---:|---|
| CAK | 3/90 | 6 / 168 / 30 | 204 rows, broad-facet parameterization |
| M1 | 54/90 common; 54/78 arm scope | 75 / 119 / 10 | 204 rows, dipped parameterization; in-sample |

They are **not** ADR 0026's registered conservative-intersection headline. R15 has no production
caller or complete artifact/gate. The charter's held-out comparisons and hundreds of automated
preview-resolution GPU runs were not executed. Do not report Phase 6 as a completed gate.

CAK→M1 is not a causal SDAK ablation: it changes broad `sigma_0` functions and facet prefactors as
well as M1's dip factors. The active plan adds `M1_NO_DIP_ABLATION`, matching M1 except that both dip
factors are one. Only that matched pair may support a causal statement about those factors.

## 2. Corrections landed in the current working tree

The current correction unit is deliberately kept together pending exact root verification. Its
final non-author content/verifier review is clean. It includes:

- M1's analytic dip centres are 4.5 °C and 14.4 °C under both `log10` and `ln`; 3.08/8.07 are
  `alphaHK` crossing locations, not moved centres. Executable regression added. The last surviving
  false copy in arm 2's hashed justification is now corrected without changing its values hash; old
  justification/combined hashes remain explicit revisions so historical rows still verify.
- The exact registered columns cohort is P1–P4 × A/B/C = 12 rows. Its fail-closed reader now compares
  consecutive rungs and reports P1 **outcome 4**: 1.40000 → 1.52632 → 1.52174. Six later diagnostics
  are separate. Missing, duplicate, shifted and fall-removed mutations are rejected.
- A closed symmetric ±0.135 threshold distance flags 43 additional CAK rows and 52 additional M1
  rows, for totals 59/204 and 85/204. The extra boundary rows have AR exactly 1.500.
- At f = 0.90 the two arms have identical classes at all 34 temperatures, but raw AR differs in
  28/34 pairs; maximum sampled `|ΔAR| = 0.218335`.
- Cross-architecture scope is four CAK configurations only. The live fingerprint differs in 9/448
  entries at 1–31 ULP; all four output rows reproduce exactly. No M1 or full-grid portability claim.
- The flip operator scans pure classes, skips neutral rows and finds two `plate→column` flips per
  arm: one on 2/6 constant-f ladders, none on 4/6, and zero reverse flips. Independent verifiers now
  label their output **MEASURED-ONLY AGREEMENT**, not headline.
- The withdrawn `sigma_0`-crossing structural theorem is marked retracted at every reviewed live
  propagation point. Habit depends on full `alphaHK` and the diffusion-determined surface field.
- ADR 0037's measurements remain: N = 48→64 fails 3/4 sampled checks and N = 64→80 fails 3/4. Its
  no-re-sweep resource decision is superseded. A ratio of 0.746 would require five further
  reductions to get below 0.5% (four gives about 0.576%, five about 0.430%), and is not a convergence
  proof.

## 3. Why R15 cannot be launched yet

Do not extend the legacy 204-row loop in place. The reviewed minimum for the two charter arms is
1,224 raw runs: 612 per arm, reducing to 204 complete three-spacing triplets per arm. The matched
no-dip arm adds at least 612 raw runs. Before any production row, a replacement ADR/protocol must
freeze and independently review all of the following:

- exact rational spacings, dimensions, physical target/achieved size and one-cell overshoot rule;
- a physical seed representation held fixed under refinement, plus a seed-mapping sensitivity test;
- which spacing supplies the primary measured class and the exact admitted/refused/invalid truth
  table, denominators and boundary-safe fitted-order comparisons;
- whole-grid domain escalation at every spacing/arm until two successive increments pass, unless an
  independently reviewed worst-case bound genuinely covers omitted points;
- fixed-physics timestep and relaxation controls;
- round-trip-exact structured binary64 output with independently recomputable occupancy/extents;
- exact raw key set; missing, timeout, duplicate, malformed or shifted rows fail rather than shrink a
  denominator;
- per-resolution timeout/retry rules—the old three-hour timeout is shorter than an observed fine run;
- immutable detached source snapshot; exact argv; environment allow-list rejecting `NODE_OPTIONS` and
  preload hooks; per-child source/environment/provenance hashes; canonical atomic publication;
- a flagless artifact-derived `gate6` with independent recomputation and adversarial controls.

The historical prose tuple was not fixed physics: the radius-2/thickness-1 seed stayed fixed in
cells while spacing changed, and 11×0.7, 21×0.35 and 33×0.2333 measure about 7.70, 7.35 and 7.70 µm.
Human stdout also rounded AR to six significant digits, enough to change habit and fitted-order
boundary decisions. Historical ladder rows cannot be upgraded into R15 evidence.

## 4. GPU and held-out obligations

The existing WGSL Phase 6 path is v5/CAK/Dirichlet-oriented. Before the GPU cohort it needs v6's
order-invariant reduction, M1 and matched no-dip routing as registered, monopole-matched far field,
and a derived binary32 convergence envelope validated against float64. Copying float64 tolerances or
calling CPU rows “GPU harness” is not allowed. The charter minimum remains hundreds of automated
runs at approximately eight million active cells; the active target is the full 204-point CAK and M1
grid (408 preview-budget runs), reported separately from the float64 headline.

The source inventory now has a fail-closed partial lock, not a selected validation target.
`research/phase6-heldout-candidate-lock.json` pins five external file hashes, 21 Harrison archive
members, all 16 reconciled levitation traces, corrected experimental conditions, a deterministic
five-time extraction, Takahashi diagnostics, the rejected pressure row, and two history candidates.
The executable verifier reproduces those bytes and says `passEligible=false`. Current findings:

- Harrison/Pokrifka is the cleanest mass-growth candidate, but particle shape and crystallography
  were not observed and the present operator omits vapor-thermal latent-heat resistance. A regular
  D6h seed would be this project's surrogate, not a source observation.
- Takahashi −5.3 °C early mass is retained as a non-gating ensemble diagnostic only. Later sources
  leave the actual warm supersaturation, hollow rim width and step-source state unresolved; its `a`
  and `c` rows are unpaired and cannot form per-crystal aspect ratios.
- The Takahashi 860/1010 mb ratio is context only. Pressure covaries with liquid-water content,
  temperature drift, apparatus/population, polycrystallinity and riming, so no pass interval exists.
- Harrington/Pokrifka 2026 needs substrate/asymmetric/rim/step-source physics. Magee 2006 is the
  strongest free-particle history challenge but needs reversible sublimation, ventilation, latent
  heat, figure digitization and a source-constrained frozen-droplet state.
- No audited held-out family is presently apples-to-apples with the current solver. This is a
  scientific source/model-scope blocker, not a resource deferral or permission to promote a near
  miss.
- The classical Nakaya reference gives morphology regions in temperature/supersaturation but no
  crystal size or size stratum. The later 206-panel grid gives field-of-view widths around
  c-axis-needle observations, not reported crystal dimensions for the current free-prism seed.
  WP2 therefore cannot freeze an arbitrary convenient physical size.

## 5. Ranked next actions

1. The adversarial review of the candidate-source lock is clean. Retain `passEligible=false` until
   geometry, independence, observable definition and uncertainty all pass. Do not infer the missing
   Harrison crystallography or a convenient Nakaya measurement size from model output.
2. The first bit-identical CPU preparation/cache improvement is implemented and independently
   accepted. Specify the new resumable monopole checkpoint before freezing WP2 reconnaissance. Under
   the current whole-grid rule the production domain minimum is 5,508 rows per nested size
   trajectory; no rigorous D6h/monopole bound replaces it.
3. Write the replacement science-first ADR and amended Phase 6 protocol only after WP1/WP2 supply
   an honest held-out disposition and passing numerical inputs. A plan is already committed;
   the ADR must quote every affected/no-impact charter clause and preserve ADR 0037's negative data.
4. Implement a new versioned `phase6-r15-*` evidence path and flagless gate, then adversarially review
   it before any registered production row.
5. Execute the frozen numerical campaign, CPU arms, matched ablation, GPU cohort and held-out families
   in that order only where the preceding freeze/adequacy dependency is satisfied.

## 6. Standing constraints

- Do not push unless asked. Local commits are intentionally unpushed.
- `docs/education/**` is delegated to a separate session; do not touch it. Corrections that propagated
  there remain a named external dependency.
- Preserve `.claude/settings.local.json`; it is untracked user state, not part of this correction.
- Treat accepted `out/phase5*`, `out/phase2b/`, `out/phase4/` and `out/phase4-visual/` as read-only.
- Never relabel Windows/Chromium/D3D12 evidence as Metal or general WebGPU portability.
- Calibration/reconnaissance probes are non-transferable unless they use the exact registered
  configuration; they never enter a gate by prose.
- Only exact `npm test` counts as the full local check. Name the exact command and result.
- A verdict is recomputed from published bytes; no component supplies both sides. Every negative
  control must prove its named mutation occurred independently of the verifier it attacks.
- No long Phase 6 evidence run from a moving working tree or inherited environment.

## 7. Repository state and current verification

- Branch `main`; local commits remain unpushed. The earlier reviewed correction unit is committed;
  the partial source-lock/performance-preparation unit described above is currently uncommitted and
  must receive exact root verification plus non-author recheck before commit.
- `.claude/settings.local.json` is untracked user state and intentionally untouched.
- Historical production sweep bytes were not modified. The arm64 fingerprint was relocated
  byte-identically from `docs/` into the manifest-guarded evidence tree (18,398 bytes, SHA-256
  `d6686f8e...`); a complete x64 lightweight fingerprint fixture was added beside it and the
  evidence manifest updated. Neither is a production sweep.
- Targeted verification completed so far:

```text
node app/scripts/phase6-ladder-read.mjs
node app/scripts/phase6-flip-census.mjs
node app/scripts/phase6-wp5-independent.mjs
node app/scripts/phase6-arm2-independent.mjs
node app/scripts/phase6-diagram-reconcile.mjs
npx vitest run runner/test/evidence-integrity.test.ts runner/test/phase6-ladder-reader.test.ts runner/test/phase6-independent-evidence-scripts.test.ts runner/test/phase6-sdak.test.ts runner/test/phase6-sweep.test.ts runner/test/phase6-crossplatform.test.ts runner/test/phase6-protocol.test.ts
npm run lint:rule7
node scripts/verify-phase6-heldout-source-lock.mjs --harrison tmp/source-lock/harrison-2016.zip --pokrifka tmp/source-lock/pokrifka-2020.pdf --takahashi tmp/pdfs/takahashi1991.pdf --corrigendum tmp/pdfs/takahashi1991-corrigendum.pdf --history tmp/harrington-pokrifka-2026.zip
```

All five direct readers/verifiers pass. The combined focused run is **7 files / 125 tests passed**,
including evidence integrity and ten fail-closed reader/verifier regressions. Exact root `npm test`
exited 0 in 735.4 seconds on the final candidate: Rule 7 clean across 408 files, both TypeScript
projects passed, and Vitest passed **76 files / 1,347 tests** in 725.74 seconds. `git diff --check`
is clean. The closing reviewer separately invoked `npm.cmd test`; its 600.4-second tool ceiling
terminated the still-passing run with exit 124 after Rule 7 and both typechecks completed, so that
reviewer attempt is explicitly a timeout, not a second full-suite pass.

The new partial source-lock verifier separately exits 0: five exact external files, 21 Harrison ZIP
members, and every fixed-time interpolation reproduce; maximum observed bracket gap is
`0.9451000000000249 s` in binary64 evaluation. Its focused Vitest file passes 7/7, including raw
duplicate-key and unknown/duplicate-CLI-field controls. The prepared-kinetics differential passes
56/56 across all existing parameter sets and all four policies; its independent reviewer reports no
remaining blocker or should-fix. Exact root `npm test` on the complete unit exits 0 in 731.9 seconds:
Rule 7 clean over 426 files, both TypeScript projects green, and 78 files / 1,383 tests passed
(Vitest 721.88 seconds).

The final combined current-unit run passes **4 files / 99 tests**. The source-lock reviewer
independently reran 7/7 plus both byte verifiers and closed with zero blockers/should-fixes. The
prepared-kinetics reviewer independently reran 56/56 and closed with zero blockers/should-fixes.

## 8. Review provenance and limits

The 2026-08-01 claim audit used OpenAI `gpt-5.6-sol` at ultra reasoning. It inherited the current
request/handoff context but did not author Phase 6. It independently re-executed both historical
artifact verifiers, diagram reconciliation, flip census, ladder reader, direct JSON class/fragility/
f = 0.90 recomputations and the live fingerprint, and inspected CAK/M1 mappings. Separate non-author
reviews audited R15 and the GPU/held-out seams.

The closing content/verifier review used OpenAI `gpt-5.6-terra` at ultra reasoning. It shared the
task/handoff context, did not author or edit the candidate, and independently rechecked the focused
7-file / 125-test suite, evidence integrity, both complete fingerprint tables and their manifest,
reader mutation coverage, Rule 7, both typechecks and `git diff --check`. It found no remaining
content or fail-closed-verifier blocker. Its attempted repository-wide test hit the 600.4-second
tool limit described above; that timeout is a review limit, not a pass or test failure.

The candidate-source reviewer was OpenAI `gpt-5.6-sol` at ultra reasoning, non-author with full
shared context. It independently checked all five external hashes, all 21 locked Harrison members,
the 16 corrected condition rows, 80 interpolated ratios, duplicate/exclusion/missing-row controls,
Takahashi ranges and every fail-closed mutation; final focused recheck was 7/7 plus both byte
verifiers. It did not run the solver, exhaust world literature, recover missing crystallography,
derive distributions, or digitize a compatible physical-size target.

The prepared-kinetics reviewer was OpenAI `gpt-5.6-sol` at ultra reasoning, non-author with full
shared context. It inspected construction, all boundary paths, timeline transactions, noise and
override ordering, reports, ledgers and checkpoint codec use, and independently ran the final 56/56
differential. It did not compare a separately built historical executable, run production-size or
final-tolerance trajectories, test another engine/architecture, establish a whole-solver speedup,
or complete final-tree `npm test`.

No reviewer re-ran the 408 historical long solver jobs, an R15 production campaign, preview-budget
GPU cohort or held-out experiment. The candidate-source lock is complete, but the selected target/
evidence freeze remains open because the current sources do not specify an apples-to-apples target.
`docs/education/**`
was explicitly out of scope. No arm64 execution or primary-source revalidation was performed by the
closing reviewer. Root completed the exact full-suite check recorded above.
