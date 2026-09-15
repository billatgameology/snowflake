# Plan — chapters 30–33: worked examples, equations and demos

- **Phase:** Cross-phase education reconciliation — Phases 6–10 (continuation of
  [education-phase7-10-continuation.md](education-phase7-10-continuation.md))
- **Status:** in progress
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

- [ ] Phase A — nine errata, `c31-blender`, `c31-matcher`, `c33-error-sources`.
- [ ] Phase B — equation blocks, three-arm tables, define-on-first-use, glossary headwords,
  who-checked callouts.
- [ ] Phase C — shared components plus the ranked demos per chapter.
- [ ] Phase D — verifier, offline build, screenshots, Rule 7, `node --check`, `git diff --check`;
  update `site-manifest.json`, `figures.html`, `docs/PROGRESS.md` and this record.

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

## Verification record

*(filled in at Phase D)*

## Open questions

*(none yet)*
