# Closing episode and finale repairs — Round 1 script review, 2026-09-29

Scope: the new closing episode `docs/video/science-series-e12-script.md`, the staged revisions
`docs/video/science-series-e10-script-pending.md` and `…-e11-script-pending.md`, and the single
Ch14 contradiction fix. Plan: [science-series-closing-episode.md](../plans/science-series-closing-episode.md).
Raw findings, reviewer scope statements, repair tables and the confirmation report are retained in
the website checkout under `docs/series-closing-episode-2026-09-29/round1-*`.

## Provenance (Rule 10)

- **Authors:** three Claude Opus 5.5 subagents (E12 script; E10/E11 pending revisions; Ch14 fix).
  They shared the plan and the six retained mapper reports, not each other's drafts.
- **Reviewers:** three further Claude Opus 5.5 subagents, none of which authored the material:
  a Rule 13 adversarial source/claims audit, a teaching/arc review against the design guide, and
  a bridge-honesty review that also served as the independent Ch14 check (decision 0049 scale).
  They shared the plan and mapper reports with the authors; this is a non-author review with
  shared context, not an independent learner test.
- **Repairs and confirmation:** separate repair agents per file, then a fifth non-author agent
  confirmed each finding against the current text and re-ran the mechanical checks.

## What was re-checked

The claims reviewer re-read the cited ch12/ch13/ch14/ch17 sections, arXiv:2306.13087v1 pp. 5–8,
`research/phase6-conclusion.md`, `evidence/phase6-three-arm-report/report.md`,
`research/harrington-pokrifka-2026.md` and, read-only, the website's recorded-model inventory. The
bridge reviewer re-checked the project description against charter §1.5, ch14/ch17/ch30, the
PROGRESS gate table, `docs/libbrecht-parameters.md` §3 and MEDIA-SPEC voice/label rules. Every
backticked chapter anchor in all three scripts exists; Rule 7 lint is clean on all four files.

Not checked: primary PDFs other than 2306.13087; monograph page numbers; whether the named-direct
catalogue settings were chosen "by eye" (review records not read); any rendering or rehearsal;
audio; Mandarin; learner comprehension.

## Findings and dispositions

64 findings: E12 3 must-fix, 34 should-fix, 12 taste; E10 pending 2 should-fix, 3 taste; E11
pending 4 should-fix, 1 taste; Ch14 2 must-fix, 3 should-fix. The confirmation found 55 resolved,
9 partly resolved, none unresolved. Load-bearing corrections:

- **E12 project description** said face rules were "taken directly from experiments"; no
  attachment input is a directly observed value (P2 fits and model inversions). Now: fitted to
  experiments or worked back through models, a few chosen by hand.
- **E12 status of the project** could be heard as a refutation of the narrow-edge idea. It now
  carries the non-convergence caveat and “a result about these models, not a verdict on the
  narrow-edge idea”, and states that the named held-out tests have not been run.
- **Library crystals:** the crystals shown in E02–E07 are the named-direct catalogue recordings
  (`recorded-models.json`, G–G named-direct model, unvalidated), not the growth-fleet library; E05
  shows none. E11-02 and E12 wording and reader provenance were corrected.
- **Ch14:** the first fix (“Somebody tried, with … M1”) contradicted the chapter's own headline arm
  (broad-facet curves with dips off). Final text names both runs, says M2 is unbuilt, explains what
  the curves are and that a crossing does not decide tall versus wide.
- **Conditions:** “in ordinary air” restored wherever edge sharpening or the E06 map is recalled;
  E10-01's map tie-in carries its air condition.
- **E11-09** now keeps E12's three bins (settled, leading proposal, open) and uses
  “demonstration”, not “reconstruction”, for the imposed-speed triangle.

Residues handled by the coordinator after confirmation: E12 narration tightened from 2,375 to
2,048 words (about 14 minutes) with every episode recap, both prediction holds, the answer to
E12-01's question and the project's honest status kept, and every cue phrase re-verified as unique
under whole-word, case-insensitive matching (this caught one ambiguous phrase, “Around our
crystal”); the E12 book card renamed so it cannot be confused with Libbrecht's *Snow Crystals*;
episode references capitalised consistently; E10-01's antecedent (“these fitted broad-face
curves”) and E11's reader wording aligned.

## Remaining limits

The review was source- and text-based. Round 2 must judge the explanation in performance: a
complete local-voice rehearsal with chronological desktop and 360×351 captures, both prediction
holds, every callback crop and Still poses. No human listening, recording or learner test exists.
