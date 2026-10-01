# Plan — chapters 30–33: worked examples, equations and demos

- **Phase:** Cross-phase education reconciliation — Phases 6–10 (continuation of
  [education-phase7-10-continuation.md](education-phase7-10-continuation.md))
- **Status:** implemented and merged in the 2026-10-01 local consolidation; final checks and shared test-debt limits are recorded in [that plan](local-consolidation-2026-10-01.md)
- **Started:** 2026-09-14
- **Last touched:** 2026-09-14 by Claude (Opus 5)
- **Branch/worktree:** `docs/education-ch30-33-demos` off `docs/education-phase10`, in the existing
  isolated worktree `G:\Code Files\snowflake-education-phase10` (Rule 16: reuse the task worktree).

## Goal

The maker's complaint on 2026-09-09 was that Chapters 30–33 "look very light on showing examples,
unlike Chapters 1–5". A two-pass multi-agent audit (20 reviewers, 10 verifiers, published
2026-09-14) confirmed it by measurement and produced 77 ranked proposals with full demo specs. This
plan turns that audit into changes: fix the confirmed errata and the three misleading figures, meet
the site's own teaching recipe (definition → equation block with a *where* list → a worked number
from the record → a demo the reader can change and predict → a key-idea callout), and give each of
the four chapters three to five interactives that actually recompute something from reader input.

## Done when

Chapters 30–33 satisfy the parent plan's **Done when** for a chapter — "a plain-language question,
learning goals, concrete examples, at least three working interactive teaching models, source/limit
captions, and a handoff to the next chapter" — where *working interactive teaching model* now means
what Chapters 19, 20, 24 and 25 mean by it: the reader changes an input and the page recomputes a
result from committed values, rather than switching between pre-written tabs. Additionally:

- The nine confirmed errata are corrected in place with the audit's verified wording.
- `c31-blender`, `c31-matcher` and `c33-error-sources` no longer mislead (the audit's three
  "misleading" severities).
- Every chapter carries at least one equation block with a *where* list and at least one worked pair
  of real numbers from a named committed record.
- Every new interactive has a built-from line saying what it encodes **and** what it cannot prove,
  and is registered in `docs/education/tools/site-manifest.json`.
- No Evidence label is upgraded anywhere: Phase 6 measurements stay measured-only, Phase 7 stays not
  started, Phase 8/9/10 results stay development/refusal, "complete" never means "succeeded", and
  P0/P1/P2 stay roles.
- `node docs/education/tools/verify.mjs --public-only`, `node docs/education/tools/build-local.mjs`,
  `node docs/education/tools/screenshot.mjs` for the changed chapters, `npm run lint:rule7`,
  `node --check` on changed JS and `git diff --check` all pass on the final bytes, and the results are
  recorded below with the exact commands.

## Approach

1. **Phase A — errata and the three misleading figures.** Smallest, highest-trust change first. Apply
   the nine confirmed errata with the audit's suggested wording; rebuild `c31-blender` as a live
   weighting blender, remove the uncommitted mirror-plane case from `c31-matcher`, and make
   `c33-error-sources` draw fail counts in its "Comparisons failed" mode.
2. **Phase B — the cheap pass.** Equation blocks with *where* lists (ch30 relDiff, ch31 m = ρ·k·r³,
   ch32 dm/dt = 4πrσK and mean squared error), the ch30 three-arm regime tables, a
   define-on-first-use sweep across all four chapters, new glossary headwords, and a who-checked
   callout per chapter.
3. **Phase C — demos**, in the audit's ranked order, three to five per chapter, each
   predict → act → reveal → break-it. Shared components are built once in a single new asset module
   rather than four times; ownership of each idea is settled by the audit's ownership table and is
   not re-litigated.
4. **Phase D — verify, record, commit**, and update `site-manifest.json`, `figures.html`, the
   glossary, this plan's *Verification record* and `docs/PROGRESS.md`.

Evidence discipline is unchanged from the parent plan: original SVG/HTML models are built from
**committed aggregate values only**, never from the private NAS rows (the 252,134 native history rows
and 431 digitized plot coordinates are private; their counts, hashes and derived statistics are
committed), and no source figure is republished. Toy or invented values are labelled invented on the
figure itself; hypothetical states (a what-if tolerance slider, a "suppose it had passed" button) are
visibly labelled and reset to the recorded state.

## Steps

- [x] Phase A — nine errata, `c31-blender`, `c31-matcher`, `c33-error-sources`.
- [x] Phase B — equation blocks (ch30 relDiff, ch31 m = ρ·k·r³, ch32 dm/dt and mean squared error),
  the ch30 three-arm tables, the ch33 knob table, eight new glossary headwords, a who-checked callout
  per chapter.
- [x] Phase C — one shared component module plus the ranked demos per chapter.
- [x] Phase D — verifier, offline build, screenshots, Rule 7, `node --check`, `git diff --check`;
  `site-manifest.json` and `docs/PROGRESS.md` updated. `figures.html` needed no regeneration: it
  counts cited source figures (139 across 33 chapters) and this work added none.

## What was built

| Chapter | Replaced | New | Kept |
|---|---|---|---|
| 30 | `c30-two-results` (two-tab card) | `c30-gate-board` (13 gate6 criteria, sort-then-reveal, four sabotage buttons, exit code), `c30-rungs` (three recorded counts per check point with the ±0.5 % ribbon) | `c30-label-stack`, `c30-profiles`, `c30-debts` |
| 31 | `c31-blender` → `c31-weights`; `c31-matcher` rebuilt | `c31-pressure` (two doors under pressure), `c31-forcing` (48 percent of what?), `c31-seal` (seal, then peek) | `c31-witnesses` (kicker corrected), `c31-library`, `c31-provenance` |
| 32 | `c32-funnel` → `c32-discriminator`; `c32-baseline` → `c32-contests` | `c32-sphere` (RK4 integration of dm/dt = 4πrσK with the recorded end-residual arrows) | `c32-multipliers`, `c32-mapping` (units and margin added), `c32-ledger` |
| 33 | `c33-two-gates` → `c33-gate-board`; `c33-error-sources` + `c33-ladder` → `c33-comparisons` | `c33-three-questions` (consistency / verification / validation), `c33-clocks` (four clocks, one day), `c33-stamps` (stamp it yourself) | `c33-bridge`, `c33-recoveries` |

Shared components live once in `docs/education/assets/anim-part2-evidence.js` (gate board, dot strip,
bar rows, record card, stamp, lamp, tab helper, and a labelled FNV-1a stand-in for SHA-256, since
`Viz.hashString` is internal and not exported), with their styles in `assets/education.css`.

## Out of scope

- Reworking Chapters 1–29 except to add cross-links.
- Modifying any evidence artifact, plan, decision record or charter clause outside `docs/education/`
  (plus this plan and `docs/PROGRESS.md`).
- Any new physics, solver behaviour, experiment, source acquisition or scientific gate credit.
- Describing anything in Phases 6–10 as validation, or starting/claiming Phase 7 work.
- Re-running the exact repository suite: an unrelated 18-process scientific campaign
  (`explore/post-phase10-discovery`, `post-phase10-discovery-main.ts`) occupied the host throughout
  this work block, which is the same blocker the parent plan already records.

## Tried and rejected

- **Trusting the audit's headline "eight equation blocks in Chapter 5".** Rejected on measurement:
  `grep -c equation__math` gives Chapter 5 **two** equation blocks; the site maximum is six
  (Chapters 19, 21, 26). The audit's substantive point survives unchanged — Chapters 30–33 have
  **zero** — but the comparison number was wrong and is not repeated on any page or in this record.
- **"Fixing" the two reviewer claims the audit refuted.** "More than five hours of timed full test
  suites" is correct (eleven timed suites on 2026-08-24 totalling 18,183.5 s = 5.05 h; the
  implementation-freeze suite at execution-plan line 1252 counts), and the 0.652-second figure is in
  the execution plan at line 639. Neither is changed.
- **Keeping the `c31-matcher` "mirror-plane stand-in for the window" case.** Rejected: it presents a
  substrate representation as a project mechanism. The Phase 9 execution plan lists substrate support
  under open adoption decisions, and Chapter 32 itself says the depleted layer is not supplied. The
  rebuilt matcher refuses the Libbrecht pair on apparatus instead.
- **A tripwire slider for Rule 14's one-quarter rule (ch33 P4 as designed).** Rejected under Rule 14B:
  the rule is explicitly a judgement tripwire and not a tracked metric, so turning it into a dial
  would teach the opposite of what `AGENTS.md` says. Reduced to a definition of governed
  process-hours plus a static three-clock chart.
- **An attachment-coefficient slider that "closes" the factor-of-two gap (ch32 P32-17 as designed).**
  Rejected: the Phase 9 record explicitly does not list a surface-attachment barrier among the
  candidate explanations, so a slider that finds one would be the course proposing a mechanism the
  project never tested.
- **A majority axis on the ch33 ladder sandbox.** Rejected: the historical verifier's defect was a
  `some`/`every` quantifier mismatch, not a vote; adding a majority axis would invent a rule the
  script never had.

### Defects the adversarial review found in this work, and what they taught

These are recorded because they are the kind of mistake the next model will make again:

- **A shared crystal size that was not shared.** The ch30 rung demo said both spacings grew "the same
  18.9-micrometre crystal". 18.9 µm is the *mapped target*; the 56 fine-spacing rows all stop at
  extent 55, which is 19.25 µm, because the first reachable extent on the odd-extent lattice is one
  past the target. The figure now names the stopping size per spacing.
- **Substring sniffing for a verdict.** `state: b[1].indexOf("pass") >= 0 ? "ok" : "refused"` styled
  "criterion no-pass" as a pass, because "no-pass" contains "pass". State is now declared per box and
  never inferred from wording. This is the same class of error as Phase 6's `some`/`every` mismatch.
- **A control that moved the model but not the control.** Several buttons assigned to a closure
  variable while the `Viz.slider` they should have driven kept its old position, so the readout and
  the control disagreed. `Viz.slider` returns a handle whose setter re-syncs the input, the output
  and `aria-valuetext`; use it. A related trap: a range input snaps an assigned value to its step
  grid, so `value: Math.log10(101325)` on a 0.02 grid silently becomes 100.0 kPa, and the recorded
  multiplier 0.4968669 becomes 0.497 on a 0.001 grid. Where the exact value matters, keep it in state
  and move the control only for display — and say on the figure that the control is quantised.
- **An ablation that was only labelled on its own button.** The "close the heat door" toggle changed
  every drawn curve with nothing on the figure saying the committed formula had been altered, and no
  way back. Rule: a hypothetical must be visible in the figure's own output and must have a reset.
  The same review found the toggle did not reach the project hybrid, which builds its own heat path —
  so the standing note now says which curves it affects.
- **A scoreboard that rewarded the hypothetical.** In ch33's stamps, engaging "suppose radial had run"
  made "failed" the scored-correct answer. The tally now always scores against the recorded word and
  pauses while the hypothetical is on.
- **Claims about the figure that the figure did not support.** A caption promised a fingerprint
  stand-in the board never rendered (removed, along with the unused helper); two built-from lines
  stated provenance without a cannot-prove clause; one said the "to continue" column quotes decision
  0054 when two of its six entries do and four are this course's reading.
- **Arithmetic that reads a hundred times wrong.** "0.6 % of one percent of the cap" for 0.1479 of 24
  hours; 0.1479/24 is 0.62 %, not 0.006 %.

## Verification record

- `node docs/education/tools/verify.mjs --public-only` **passed** on the final bytes: 37 manifest
  pages, 205 visual roots, 191 checks, 222 browser-profile loads plus deterministic repeats, and all
  149 artifact-backed negative controls executed and rejected. Report: ignored
  `out/education-verify/report.json`, manifest sha256 `ab609e49…`.
  One earlier run of this work failed 7 checks on chapter 30, all of them the same defect: the
  manifest lists interactive ids in DOM order and `c30-rungs` precedes `c30-gate-board` on the page.
  Fixed by reordering the manifest, not the page.
- `node docs/education/tools/build-local.mjs` **passed** (exit 0) and rebuilt the offline course
  under ignored `out/education-local/`, retaining rights-aware placeholders for the absent source
  media. Nothing was republished.
- `node docs/education/tools/screenshot.mjs` **passed 16 of 16** profiles (desktop and mobile, light
  and dark) across all four changed chapters, with no page errors. Report: ignored
  `out/education-visual-qa/report.json`.
- `npm run lint:rule7` **passed**, 1,518 files scanned.
- `node --check` **passed** on `docs/education/assets/anim-part2-evidence.js` and on every inline
  chapter script, extracted to ignored `out/ch3x-syntax/`.
- `git diff --check` **passed**.
- **Exact `npm test` was NOT run, and this work is not described as suite-green.** An unrelated
  18-process scientific campaign (`explore/post-phase10-discovery`,
  `runner/src/post-phase10-discovery-main.ts`, cavity and basal-history waves) occupied the host for
  the whole work block, which is the same blocker the parent plan already carries. These changes are
  confined to `docs/education/`, this plan and `docs/PROGRESS.md`; they touch no executable code,
  test, gate or evidence artifact, so the education verifier plus the Rule 7 scan cover their actual
  failure surface. The parent plan's open exact-suite checkbox still governs.

### Independent checks of the content itself

Two multi-agent passes ran against these bytes before they were committed, both re-deriving from the
records rather than from the page:

- **Evidence extraction (10 areas, 8 verified).** Every load-bearing number the chapters print was
  re-read from its committed file and, where it was arithmetic, recomputed. The D-BT sphere model was
  independently re-ported twice and reproduces the committed end residuals for all six histories to
  about one part in a million; the 64 ladder rows, the tolerance sweep (18/20/36/43/51/53/61/64 at
  0.1/0.2/0.5/1/2/3/5/10 %), the three-arm tables, the gate6 and gate10 check ids and the Phase 8B
  family counts all reproduce. Two verification agents hit a session limit and their extractions were
  therefore single-sourced (Phase 8 family counts, and the sweep/oracle survey); both were separately
  re-derived by hand here.
- **Adversarial review (six lenses, each verified by a second agent).** 99 findings, of which the
  verifiers confirmed roughly two thirds and refuted the rest. Every confirmed finding was fixed. The
  substantive ones are recorded under *Tried and rejected* below, because several were defects in
  what this plan itself had specified.

## Open questions

- The audit's ranked plan expected the per-family share in `c31-weights` to read 12.5 % (one of
  eight). It reads 14.3 %, because the audit's own skeptic required the five P2 safeguards to carry
  zero weight under every rule — they hold no numbers and cannot agree with anything — which leaves
  seven voting families. The figure says so on the row.
- `c31-weights`'s fourth rule is labelled **one apparatus = one vote** rather than one laboratory.
  The code buckets the two Penn State chambers separately, and the Phase 8 guide's stricter rule
  (shared raw data, apparatus, investigator and calibration lineages count once) would merge them and
  arguably Gonda's two campaigns as well. There is no committed laboratory count to appeal to, so the
  figure states the ambiguity instead of resolving it.
- The temperature–pressure family map named in the audit's shared-component list was **not** built:
  none of the demos that survived the ownership pass needs one, and Rule 14B forbids building shared
  infrastructure that no current deliverable is blocked on. `c31-pressure` carries the pressure axis
  the map would have carried.
