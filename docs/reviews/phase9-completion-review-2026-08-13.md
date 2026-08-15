# Phase 9 completion review — 2026-08-13

## Review provenance

- **Reviewer:** OpenAI Codex; the exact serving model and snapshot were not exposed.
- **Context:** the reviewer shared the developer's repository and conversation context but did not
  author or edit the reviewed completion commit.
- **Independence limit:** author and reviewer were both OpenAI Codex, so different-model
  independence is not established. This was a shared-context, non-author review.
- **Reviewed commit:** `1efe127` (`Complete Phase 9 bounded development tranche`).
- **Worktree behavior:** read-only and clean throughout the review.

## What the reviewer independently re-executed

- A focused Phase 9 verifier and integrity run: 20 test files and 262 tests passed.
- Source-overlay derivation: 70 aliases resolved to 59 unique complete artifacts—55 PDFs and four
  ZIP archives—totaling 283,899,114 bytes.
- D-BT published-score derivation:
  - continuum equal-history MSE `87.4527233`;
  - Lamb equal-history MSE `431.3416`;
  - leave-one-history-out continuum-rescale MSE `0.65781849`;
  - project-hybrid MSE `86.88252`;
  - Lamb strict wins `0/6`;
  - minimum named sensitivity margin `140.224156`.
- M-F/M-K2 derivation: exactly two of five diagnostic mappings met the registered effect, with
  zero physical passes and zero promotions.
- Phase 8 artifact bindings and the absence of changes to the permanent solvers after Phase 9
  adoption.

The independently averaged seven-significant-digit published score rows give trailing values such
as `0.65781849`; the report and guide quote the verifier's source-arithmetic result rounded under
the publication contract (`0.6578183`). The continuum and project-hybrid trailing digits differ for
the same representation reason; no comparison or verdict changes.

## Findings and disposition

### Candidate shelf versus frontier routing labels

The execution plan's candidate table contains 11 rows covering 14 module labels. The S0B
`shelf-freeze.json` also contains ten `FRONTIER-*` source-routing labels. Nine remain pending
because they were not adopted candidate mechanisms; `FRONTIER-WANG87` is source-blocked and marked
`not-required` because no authorized full text was available.

The completed all-no-pass conclusion is supported for the adopted candidate table. It must not be
restated as a claim that every frontier paper or possible future mechanism was tested. The
[maker guide](../phase9-model-development-guide.md) now separates executed candidates,
prerequisite groundwork, and frontier research leads explicitly.

### Scope of the numerical result

The reviewer found no numerical discrepancy in the published D-BT or M-F/M-K2 claims. Only D-BT
is a registered source-scored no-effect/failure result. M-F/M-K2 is a mapping-dependent diagnostic.
Every other candidate is source intake, compatibility/refusal work, a categorical description, an
analytic calculation, or manufactured numerical groundwork—not a measured model failure.

Phase 9 changed no physical solver and promoted no mechanism.

## Limits of this review

The reviewer did not:

- rerun the full repository suite;
- visually re-audit all 59 source artifacts;
- execute any three-dimensional solver;
- validate source rights; or
- review the educational guide, which was written after this completion review.

The educational guide therefore receives its own subsequent adversarial review before publication.

## Subsequent assurance

A later [different-model external review](phase9-external-review-2026-08-13.md) independently
re-executed the exact full suite and both quantitative pipelines. Its accepted record and test gaps
are repaired separately; they do not retroactively change this review's scope or provenance.
