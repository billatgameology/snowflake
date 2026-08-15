# Phase 9 external review — 2026-08-13

## Provenance

- **Reviewer:** Claude, Fable 5 model family.
- **Context:** different model family from the OpenAI Codex author; no shared development-session
  context.
- **Submitted review:** the tracked
  [source transcription](phase9-external-review-source-2026-08-13.txt) is 10,454 bytes / SHA-256
  `1dcd22cf9afc4e807077727b5d70b6f89554e3f613490da1b13c154a3a806c06`. Its first 10,453 bytes
  reproduce the maker attachment exactly (SHA-256
  `20696b9762e7aee74059cca5aa9c7cd862249917855298d5d0f578845f77e416`); the tracked text adds one
  final LF. The session-cache source was
  `/Users/clipper/.codex/attachments/59aef1cf-5d6c-4015-9285-e9c77e14aa93/pasted-text.txt`.

## Independent re-execution reported by the reviewer

- Exact `TMPDIR=/private/tmp npm test`: Rule 7 clean over 955 files; both typechecks passed;
  115/115 Vitest files, 1,912 passed tests and seven skipped; exit 0.
- D-BT: independent Python reimplementation from the NAS TSV bytes, including preparation, RK4,
  all four comparators and leave-one-history-out evaluation; the repository verifier also returned
  `ok=true` and executed all 15 named controls.
- M-F/M-K2: independent pipeline reimplementation recovered all 90 series records, the 2/5
  mapping decision and label; the repository verifier returned `ok=true` and rejected all nine
  mutations.
- S1 adapter census derived three ways, including an execution over all 44 real NAS row artifacts.
- Independent arithmetic checks of the Sato contingency diagnostic, transport resistances and
  manufactured Gibbs–Thomson/convergence relations.

The review found no numerical discrepancy and no result-invalidating defect.

## Accepted findings

1. The repository history does not independently demonstrate that the detailed D-BT and
   M-F/M-K2 protocols preceded model-output inspection: protocol and result bytes first entered Git
   together in `1efe127`. Their timing is an in-session freeze supported by internal hashes and
   pre-run reviews, not a Git-order-demonstrable precommitment.
2. The registered-corpus row parsers had no hermetic success-path or parser-semantic negative tests;
   the original focused tests supplied empty row-artifact maps.
3. The two earlier committed reviews disclosed shared context but did not explicitly state that
   reviewer and author used the same model family.
4. The completion record said the suite exited 0 but did not persist its 115/115, 1,912-passed,
   seven-skipped counts.
5. The immutable D-BT producer report correctly stops at
   `candidate-awaiting-independent-byte-verification`, and the M-F/M-K2 report at
   `candidate-awaiting-independent-verification`, but the successful verifier executions needed
   durable command/output/verdict records outside those producer-owned bytes.

The external review also noted that D-BT's fitted leave-one-history-out comparator retains
same-condition siblings in its training folds, and that the inherited M-F comparator is worse than
the zero-growth control at `q=0.75` and `q=1`. Both are interpretation limits worth narrating.

## Additional findings and process notes

Before repair, `PROGRESS.md` called D-BT verified while its immutable producer report remained
`candidate-awaiting-independent-byte-verification` and no verifier execution receipt existed. The
review called that a state contradiction, not merely an opportunity for stronger documentation. It
also qualified the claim that two earlier D-BT candidates were rejected: v2's scores, diagnostics
and scientific result were byte-identical to v3; v2 failed because its assurance harness contained
a vacuous mutation.

The parser finding was zero suite coverage of all three private row-parser families. The reviewer
established their behavior only by executing the real NAS artifacts; supported-dimension/rim and
non-planar plot-series families additionally had no production consumer or sibling verifier. The
missing completion counts were explicitly a Rule 6 copied-at-write-time failure even though the
external rerun showed the remembered numbers were true.

Minor process findings were that the old Next step omitted Phase 9 branch integration, the guide
review named an unpreserved intermediate hash, and future schemas should avoid `heldout*` names
while leaving frozen identifiers unchanged. The tracked source review preserves the complete
recomputation witnesses, positive controls, next-science recommendations, summary caveats and its
judgment that the disclosed `FRONTIER-*` carve-out was acceptable; nothing was recommended for
removal.

## Limits

The reviewer did not visually audit all 59 source PDFs/archives, reassess source rights or currency,
read NAS source content beyond the registered/hash-bound inputs, or execute a physical solver.

This record summarizes the review; the linked tracked transcription preserves the supplied text.
The repository repairs and their own post-change checks are recorded separately rather than
retroactively attributed to the reviewer.
