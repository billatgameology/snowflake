# ADR 0038 — evidence that backs a published claim is TRACKED, not ignored

**Status:** ACCEPTED. Maker-directed 2026-08-01.

## Context

`out/` has been gitignored since the start, and decision 0004's convention for research media was
carried over to run outputs: **artifacts live in the ignored tree, their hashes are the tracked
record.** Every Phase 6 report says so in as many words.

That convention is wrong for evidence, and the maker called it: *"our output data should've been
saved as evidence, not untracked throw away data."*

**Why it is wrong, concretely.** A hash proves an artifact has not changed. It does not preserve the
artifact. Three things this phase already demonstrated:

- Arm 1's 204 measurements existed in **no commit** for the entire phase. Erratum E4 records that a
  single mistyped directory suffix would have destroyed 89 core-hours with no way back.
- Arm 2's artifact was destroyed once already — the completion-time gate refused to write it, and
  the rows survived only because they were manually copied aside (E4).
- The columns ladder lost a 5.2-hour measurement to a driver race, and its recovery depended on a
  backup file that existed only because I made one by hand minutes earlier.

An evidence store you can lose to a typo is not an evidence store.

## Decision

**A new tracked `evidence/` tree holds every artifact that backs a published claim.** `out/` stays
ignored and becomes what its name always implied: scratch, checkpoints, logs, probe output.

Phase 6's 16 files, 916 KB, moved there:

| directory | what it is |
|---|---|
| `evidence/phase6-sweep/` | arm 1, the registered no-SDAK sweep |
| `evidence/phase6-sweep-arm2/` | arm 2, the registered SDAK sweep + `regeneration.json` |
| `evidence/phase6-sweep-6995868-cak-a1-superseded/` | the ADR 0031-invalidated arm, preserved |
| `evidence/phase6-sweep-arm2-STRANDED-8c781b1/` | the E4 stranded rows |
| `evidence/phase6-columns-ladder/` | the size ladder, 19 rungs + its pre-clobber backup |
| `evidence/phase6-domain-spot-check/` | E6's discharge |
| `evidence/phase6-domain-escalation/` | the N=64-vs-N=80 check |
| `evidence/phase6-throughput-probe/` | the x64 host measurement |

**The migration was byte-verified, not assumed.** Every file was hashed before the move and
re-hashed after; the move refused to complete unless all 16 digests were unchanged. They were.
`evidence/MANIFEST.json` records the digest and size of each, so the tree can be checked against
itself at any time — and against the hashes already printed in the published reports.

**Every reader was repointed and re-run.** `phase6-wp5-independent` PASS, `phase6-arm2-independent`
PASS, `phase6-diagram-reconcile` PASS, `phase6-flip-census` COMPLETE, 16 negative controls ALL
EXECUTED, and the one test that reads an artifact (`runner/test/phase6-sweep.test.ts`) passes in
exact `npm test`.

## What is deliberately NOT moved, and why

**~900 MB of earlier-phase binaries stay in `out/`:** `phase4/` (496 MB), `phase5*` (4 × 77 MB),
`phase2b/` (58 MB), `phase4-visual/`. Two independent reasons:

1. **The maker's standing constraint** on those trees is *read only; register digests and add checks
   only.* Moving them is out of scope for this ADR.
2. **Git is the wrong store for them.** They are `.ckpt` and `.png` blobs; committing them would add
   ~900 MB of binary history to every future clone. If they are to be versioned, that is a **Git LFS**
   decision and it is a separate one, deliberately not taken here.

`out/worktrees/` (996 MB, git internals) and `out/education-review-scratch/` (174 MB) are not
evidence at all and stay ignored.

**Consequence, stated rather than left implicit:** earlier phases keep decision 0004's
hash-only treatment. Phase 6 does not. That asymmetry is real, and it is the honest state — the
alternative is either a 900 MB repository or a claim of uniformity that is not true.

## Consequences

- Phase 6's evidence now survives a mistyped path, a `git clean`, or a disk swap.
- Anyone cloning the repository can re-run every independent verifier with no prior artifacts.
- The published byte hashes in `research/phase6-sweep-report.md` and the two-arm report are now
  checkable **against files in the same commit**, rather than against a tree the reader does not
  have.
- `out/` may be deleted at any time without losing a published claim. It could not before.
