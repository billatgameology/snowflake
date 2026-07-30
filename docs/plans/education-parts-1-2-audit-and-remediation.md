# Plan — Education Parts One and Two audit and remediation

- **Phase:** Documentation and onboarding (education website)
- **Status:** in progress
- **Started:** 2026-07-30
- **Last touched:** 2026-07-30 by Codex
- **Candidate under review:** `c69c66cf8b6d05898b810f02794a8fd66df05045`

## Goal

Independently audit the complete education website rather than inherit its producer's verdict.
Part One must teach the concepts and visual evidence in the local snow-crystal research corpus
to a smart general audience in a coherent order. Part Two must accurately teach this repository
from its current authority documents and implementation. Every interactive model must be tested
for its claimed behavior, and every useful missing demonstration found by the review must be
built and tested.

## Done when

The user supplied this milestone rather than the charter, so the executable completion criteria
are:

- every Part One source named by the site's research inventory has a concept checklist mapped to
  chapter coverage, a relevant image reference where the source has one, and an interactive
  demonstration where interaction materially improves understanding; every deliberate omission
  is named with a reason;
- the Part One chapter sequence has been reviewed as one learning path, and every ordering defect
  found by that review is repaired;
- every Part One interactive is enumerated and browser-tested against its own scientific claim,
  including controls, reset/replay behavior, boundary cases, labels, and the visible state change;
- Part Two has an equivalent coverage and ordering audit against the current charter, accepted
  decisions, solver specifications, package boundaries, live code, tests, and recorded evidence;
- every Part Two interactive is enumerated and browser-tested against the implementation concept
  it claims to explain;
- every additional demonstration recommended by either review is implemented, integrated into
  the appropriate chapter, and covered by behavioral tests;
- the offline build contains the licensed local figures while the GitHub Pages build keeps
  references/placeholders only, with no copyrighted research media added to Git;
- all 29 chapters plus the shared pages pass link, console, layout, accessibility-smoke, theme,
  and interaction checks; exact `npm test` passes; and an adversarial review rechecks the
  published bytes with its provenance and limits recorded;
- the plan and `docs/PROGRESS.md` identify what changed, what the checks prove, and the next
  concrete action, and the completed work is committed without absorbing unrelated Phase 6
  changes already present in the worktree.

## Approach

Treat `c69c66c` as a review candidate, not as evidence of completion. Build two explicit source
maps: papers-to-concepts for Part One and authority/code-to-concepts for Part Two. Audit content
coverage and pedagogy separately from demo correctness so an attractive but scientifically wrong
widget cannot pass by presentation quality. Reuse the existing local figure catalog and offline
builder; copyrighted PDFs, images, and videos stay untracked. Use independent reviewers for the
two course parts and a separate code-level demo audit, then repair the union of findings and send
the resulting bytes through a final adversarial pass.

## Steps

- [x] Reconcile the education worktree, merged history, current candidate, and research-source
      inventory without changing or force-adding local media.
- [x] Audit Part One source coverage, image choices, terminology, and chapter order; record the
      paper-by-paper checklist and omissions in this plan.
- [x] Audit every Part One demo from code and in a real browser; add behavioral assertions that
      independently recompute load-bearing outputs.
- [ ] Repair every Part One gap and implement every recommended new demo.
- [x] Audit Part Two against current authority documents, repository code, tests, evidence, and
      chapter order; record the authority-to-chapter checklist and omissions in this plan.
- [x] Audit every Part Two demo from code and in a real browser; repair gaps and implement every
      recommended new demo.
- [ ] Run the offline/online media split checks, whole-site browser matrix, exact `npm test`, and
      visual inspection of representative pages and every changed interactive.
- [ ] Obtain an independent adversarial re-review of the final bytes, remediate all findings, then
      update `docs/PROGRESS.md`, mark this plan done, and commit the completed audit.

## Out of scope

- Changing solver, runner, GPU, Phase 6 protocol, parameter-table, or evidence behavior.
- Re-running scientific gates or validation sweeps.
- Publishing or force-adding copyrighted research PDFs, videos, or images.
- Reviewing Phase 7 product UI except where Part Two explains its currently accepted design.
- Pushing commits or deploying GitHub Pages; the user requested a local commit only.

## Tried and rejected

- **Accept `c69c66c` from its commit message and prior browser run.** Rejected under Rule 9: the
  producer cannot supply the verdict for the artifact it changed.
- **Count citations or demo containers as coverage.** Rejected: a citation may not teach the
  source's concept, and a canvas may animate while implementing the wrong relationship.
- **Use only extracted PDF text.** Rejected: the request explicitly includes relevant images,
  and layout, captions, axes, and figure-to-claim correspondence require rendered-page review.
- **Commit the local research corpus for a self-contained online site.** Rejected by ADR 0004 and
  copyright scope. The offline builder may consume local media; the public site must reference it.
- **Treat a clean worktree's missing ignored Phase 6 sweep as an education failure.** Rejected:
  baseline exact `npm test` passed Rule 7, both typechecks, and 1,261 of 1,262 cases; the sole
  failure is `runner/test/phase6-sweep.test.ts` requiring ignored
  `out/phase6-sweep/points.json`. Final verification will use the existing immutable artifact as
  an ignored prerequisite and will not alter Phase 6 code or evidence semantics.

## Audit record

### Worktree, history, and corpus reconciliation

- `education-worktree` is clean at `f8668d23667f499693a015062756430a4d6a8e81`; that commit is
  also its merge base with `main`. The reviewed Part Two branch was merged by `5af860e`; candidate
  `c69c66c` is a later main-only whole-course remediation and is therefore the byte set under
  review, not an unmerged alternate implementation.
- At audit start `main` was at `c69c66c`, 19 commits ahead of `origin/main`, with unrelated
  in-progress Phase 6 SDAK files already dirty. Plan commit `9897fd5` added only this file; the
  Phase 6 files remain outside the education scope and must not be staged.
- The local research cache contains 14 top-level PDFs plus generated page/figure derivatives,
  10 videos, and the transcript: 3,628 ignored files in total and zero untracked non-ignored
  research files. Git tracks 13 research indexes/reports, not the copyrighted media. No cache
  byte was modified, moved, staged, or force-added during reconciliation.
- The public source inventory names the monograph, ten post-monograph measurement/method papers,
  three modelling papers (including Gravner-Griffeath), three historical works, and the
  Murphy-Koop reference standard. Part One's paper audit uses that inventory and the 120-entry
  tracked figure manifest; historical works and the standard are checked as concept sources even
  though they are not among the 14 cached PDFs.
- To honor the operator's isolation request, implementation now lives in
  `G:\Code Files\snowflake-education-audit` on branch `education-audit`, based on criteria/state
  commits `9897fd5` and `3af7501`. Read-only junctions expose the local ignored figure/video cache
  to the isolated worktree; the primary Phase 6 worktree is not an edit or staging target.

### Part One source-coverage and order audit

The chapter order is accepted: observable crystal and cloud, history, lattice, transport,
surface physics, instability, habit diagram, environmental history, morphology, measurement,
quantitative kinetics, SDAK, then the epistemic frontier. Repairs are local rather than a
chapter reorder.

| Source family | Coverage verdict before remediation | Required remediation |
|---|---|---|
| Libbrecht monograph | Main vapor-growth narrative is strong | Add transport resistance, aerodynamics/ventilation, negative crystals, and chemical/contamination effects; name liquid-water growth, cartography, full simulation survey, and photographic craft as deliberate scope limits |
| TAX2, 2306.13087 | M1 curves, dips, bands, and working-hypothesis status are present | Show the 206-observation evidence; distinguish M1/M2, Gibbs-Thomson, seed/sample scope, and correct the inferred-log-base provenance |
| FACET, 2306.04042 | Only a high-level paragraph | Teach its two-process equation, accessible Table 1, temperature/pressure scope, particle-diffusion bias, latent heating, and disagreement with CM7 |
| TAX1, 2109.00098 | Needle-seed concepts and plate multiplicity are present | Add the 97-panel matrix and its selected-sample, growth-time, scale, and top/bottom-asymmetry limits |
| Triangular crystals, 2106.09809 | Puzzle and threshold interaction are good | Add measured rate/width context, 3-D SDAK interpretation, and narrow experimental scope |
| CM10, 2012.12916 | Factor-two prediction versus factor-ten observation is strong | Add pressure-gated ESI assumptions and uncertainty |
| CM9, 2011.02353 | Sparse | Add measured basal-dip evidence, rate ratios, hollowing onset, pressure branches, and errors |
| CM8, 2009.08404 | Broad curves and prism dip are substantially taught | Add direct evidence, factor-two witness systematic, and morphology/history caveat |
| CM7, 2004.06212 | Broad −2 °C values only | Add large-prism versus kinetic-roughening branches, overlap ambiguity, pressure limit, and FACET conflict |
| CM6, 1912.03230 | Two −5 °C rows only | Add broad/narrow basal branches, initial-fast history, hysteresis, plate/column outcomes, and selection limits |
| Apparatus, 1912.09440 | Chamber, fitting, substrate, zero point are strong | Add 1.5-D silhouette, latent-heating correction, and uncertainty limits |
| CAK, 1910.09067 | Concepts are distributed but direct scope is sparse | Add a measured-versus-modeled source map and semi-empirical limit |
| Growth physics, 1211.5555 | Habit boundaries and transport/kinetics are good | Add size/pressure complexity and situate the wider modeling survey |
| Gravner-Griffeath | Simplified 2-D rule and zoo are taught | Repair the toy model, add 3-D ridges/ribs/hollowing context, and state omissions |
| Kepler, Bentley/Humphreys, Nakaya, Murphy-Koop | Appropriate and adequate | Retain; pair reconstructed habits with the later laboratory matrices |
| Local videos | Unused | Add an offline real-growth scrubber and a rights-aware online source card |

Before remediation, all 160 Part One source-image placements used the monograph cache; none used
the strongest later-paper crops already present under `research/figures`. The public claim must
be “the registered local corpus,” not “all snowflake science globally”: the source-currency
sweep excludes non-arXiv publications, journal errata, website updates, and G-G currency.

Five reviewed opportunities are mandatory implementation work because the user requested every
recommended demo:

1. FACET additive-process versus CM7 branch-switch explorer.
2. TAX1/TAX2 laboratory morphology-matrix browser.
3. CM6 −5 °C history/hysteresis explorer.
4. Rights-aware real-growth time-lapse scrubber.
5. Aerodynamics/ventilation explorer.

### Part Two authority/code and order audit

The Part Two sequence is accepted: scope, evidence labels, provenance, falsifiability,
governance, lattice, determinism, surface seam, convergence, far field, metrics, adversarial
tests, GPU conformance, preregistration, result, and limitations. Its blocking repairs are:

- distinguish signed numerical boundary replacement/exchange from physical kinetic demand and
  the placed-fill ledger in chapters 19, 22, 23, 26, and the glossary;
- consolidate current Phase 6 status in the index, references, glossary, and chapters 28–29;
- replace chapter 18's false universal source ranking with question-based authority routing;
- fix chapter 21's `[10]` explanation: aggregate v4/v5/v6 pins it to zero;
- mark the CAK_A1 domain ladder non-transferable to CAK;
- make chapter 28's crossing verdict depend on the actual published state and add reset;
- scope chapter 16's 33-row display as a grouped §§2–8 view and expose recorded gaps;
- narrow `deltaSymClean` to attachment-delta symmetry, correct the workspace/spike and 38-check
  descriptions, and distinguish the Phase 3 instrument from the future Phase 7 product.

Four reviewed opportunities are mandatory implementation work:

1. GG-versus-LK timeline-event explorer, including state preservation, density transform,
   unclamped negative supersaturation, shell re-clamp diagnostic, atomic kinetics, and step-local
   conversion.
2. Fail-closed checkpoint mutation explorer.
3. Side-by-side numerical-exchange and physical-demand ledger explorer.
4. Transferability matrix plus historical/current Phase 6 status controls.

### Interactive audit

The independent browser inventory contains 33 pages and 169 visual roots: 151 `.anim` roots and
18 charts; 150 have controls and 19 are static. Every root mounted at desktop/light,
mobile/dark, and reduced motion, with zero page exceptions, empty roots, or missing accessible
names. That mounting result did not certify model behavior. Independent oracles found:

- `anim-gg-zoo.js` substitutes zero for an attached neighbor instead of the center value, losing
  12.64–19.85% of `Σ(v+b)` across the four presets; its density slider does not reset state and
  its 90-tick attachment stall falsely declares vapor exhaustion;
- `anim-diffusion.js` uses raster-order in-place Gauss-Seidel and reaches vapor orbit error
  `0.01325047`, fill orbit error `0.07122594`, and four occupancy disagreements by step 2,000;
- chapter 8's rib schedule is static and reports 50 units when it draws 67.25;
- chapter 10 correctly evaluates Eq. 7.6 but calls proximity to its 1 mm value “convergence”;
- chapters 13, 16, 18, 21, and 28 contain the claim/state defects recorded above;
- 32 `Math.random()` calls make six visual models and five generated-ID groups non-deterministic;
- stored-theme selection happens after figures mount, so 133 of 169 roots initially use the
  wrong palette when stored and OS themes disagree;
- `viz.js` can restart a user-paused demo after tab restoration; chapter 20 calls a sequential
  binary64 accumulation exact; chapter 26 has a two-pixel mobile overflow.

The existing `screenshot.mjs` is fail-open and nonportable. It must be replaced by a committed
Playwright verifier with an exact page/root manifest, layout/theme/motion/accessibility/link
checks, control/reset coverage, deterministic-load checks, independent scientific oracles, and
executed negative controls. Screenshots remain artifacts rather than verdicts.

Audit reviewers were read-only Codex GPT-5-family subagents sharing the task context but not the
candidate producer's execution. They independently inspected primary-source pages/crops/video
frames, authority/code/history, all pages in Chromium, controls, and selected mathematical
oracles. Limits: no reviewer reran scientific gates or the full literature beyond the registered
corpus; unflagged decorative models were mounted and inspected but not all independently
re-derived.

## Open questions

- None currently. Any source whose licensing or scientific role is genuinely ambiguous will be
  left as a referenced omission rather than silently copied or guessed.
