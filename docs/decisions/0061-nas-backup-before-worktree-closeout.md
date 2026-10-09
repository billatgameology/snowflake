# 0061 — Preserve worktree output on NAS and keep bulk run payloads out of Git

- **Date:** 2026-10-09
- **Status:** accepted by maker direction
- **Charter impact:** append the durable-output/worktree-closeout guardrail in section 3.3;
  numerical laws, scientific labels, historical evidence and phase-gate obligations are unchanged.

## Context

The retired HIL worktrees' complete outputs survived through local relocation and pushed,
compressed Git archives, but had no NAS recovery copy. The maker directed: "I think we should
always backup to Nas when closing a worktree. Not upload large files to github". Preservation
was achieved, but the chosen storage and closeout policy did not match that intent.

Decision 0038 corrected loss of claim-bearing bytes by requiring tracked evidence. It also
recognized that large checkpoint and image binaries were inappropriate ordinary Git history.
Decision 0051 supplies immutable NAS publication, owner manifests, catalogue bindings and tested
recovery, but requires explicit accepted authority before externalizing claim evidence. Its
operative boundary is:

> A claim-bearing artifact stays tracked under decision 0038 unless the governing charter or an accepted decision explicitly authorizes a different storage binding and the governing plan records that binding.

This decision supplies that authority for new bulk run payloads. It does not make a hash a
backup, erase historical evidence obligations, or permit a useful failed attempt to be discarded.

## Charter clauses and amendment

The existing section 3.3 milestone clause remains verbatim:

> Every scientific milestone is an automated metric, not a screenshot.

The existing section 3.3 assurance clause remains verbatim:

> Assurance proportionality (added v1.26, decision 0049). Use decision risk, not the availability of another check, to set assurance depth. Routine source intake establishes identity and version, preserves and hashes the original when applicable, records exact locators, and distinguishes measured or transcribed values from project derivation, with units, conditions, uncertainty, and explicit gaps; it does not receive independent audit by default. A quantitative input that will carry a model, experiment, gate, or published conclusion receives one independent targeted transcription, calculation, or semantic check. A phase gate or strong public scientific claim receives the pre-registered evaluator, independent derivation, negative controls, and adversarial review named by this charter or an accepted decision. A new gate, check, review, registry, or verifier is admitted only for a plausible uncovered in-scope failure that could change a scientific decision or silently corrupt evidence, and only when the control is proportionate to the likely harm. Reviews are not reviewed, and checking stops when another pass is unlikely to change classification, values, the next experiment, or the published claim. If process consumes roughly one quarter of a work block without a direct source, measurement, calculation, code, experiment, or requested decision—or creates a second meta-validation layer—stop and simplify; this is a judgment tripwire, never a tracked metric or a new reporting obligation. Existing controls explicitly required by this charter or an accepted decision remain in force over their named scope until amended at the same authority level.

The only charter edit appends this paragraph after the milestone clause:

> Durable output and worktree closeout (decision 0061, 2026-10-09). Git holds source, concise claim artifacts, analysis and verification code, recipes, provenance, manifests, hashes, NAS locators and recovery records. New bulk run payloads belong in governed immutable NAS collections, including when compressed; bulk claim inputs use the external-evidence binding authorized by decision 0061. Before a worktree closes, useful output must have verified NAS preservation and successful fresh-stage recovery with committed bindings, or an existing verified collection must cover those exact bytes. Worktrees without useful output payloads record that fact; reinstallable dependencies and rebuildable builds are excluded. Local pruning remains a separate exact-target decision subject to class-specific independent-copy requirements. Historical evidence and phase-gate obligations remain unchanged.

No revision marker or existing charter clause is replaced. Scientific checks and claims keep
their authority; the additional requirement governs storage and worktree retirement.

## Decision

### Git records and NAS payloads

Git keeps source, plans, concise results and claim artifacts, analysis/verifier scripts, recipes,
provenance, owner manifests, byte hashes, share-relative NAS locators and recovery receipts.
Small test fixtures remain tracked. New bulk run payloads belong on NAS: full-run archives,
dense checkpoint/field collections, full event/snapshot collections, renders and comparable
generated output. Compression does not change that role. No numeric file-size threshold or new
registry is introduced, and Git LFS is not adopted.

Bulk claim inputs use decision 0051's **external-evidence** class, citing this decision and their
governing plan. Their complete owner manifest, immutable NAS payload, tracked binding and existing
executable verifier form one evidence unit. Use permanent retention and no automatic garbage
collection for external evidence. Reproducible non-claim output may use generated-cache; rights,
privacy, serving and independent-copy rules remain those of decision 0051. Do not use the cache
label to weaken retention of actual claim inputs.

This prospectively narrows decision 0038's tracked-evidence default and supplies decision 0051's
required exception for bulk run output. Concise project-owned claim artifacts still remain in Git.
Historical tracked payloads, accepted ADR text and frozen phase evidence stay unchanged. Existing
gate requirements and their consumers are not silently redirected. Any removal of already-pushed
blobs or rewriting of Git history requires a separately scoped maker decision.

### NAS preservation before worktree retirement

Before a worktree is closed, removed or archived, inventory its useful retained output, including
ignored files. Complete decision 0051's existing publication and fresh-stage recovery procedure
and commit the catalogue, owner binding, provenance and recovery records. Record collection/version
and exact covered output paths in the affected plan. Local relocation or a Git archive alone is
insufficient. If preservation cannot complete, the output-owning worktree stays open.

An existing immutable collection can satisfy closeout when its verified byte identities and
successful recovery cover the exact outputs. Reference that record instead of duplicating bytes
or rerunning recovery merely because another worktree closes. A code/docs-only worktree with no
useful output payload records that fact. Reinstallable dependencies, rebuildable builds and
explicitly declared scratch need no NAS publication; cited diagnostics and useful failed attempts
are retained output, not scratch by convenience.

Closing a checkout remains distinct from pruning useful local copies. The exact-target prune
decision, committed bindings, successful recovery and class-specific independent-copy requirements
remain mandatory. One NAS plus copies/archives/snapshots on that NAS is one failure domain. Retain
workstation copies of external evidence, unique sources and irreplaceable masters until their
independent recovery requirements are discharged. No automatic deletion or generic publisher is
authorized by this decision.

### Bounded HIL catch-up

The [closeout plan](../plans/nas-worktree-closeout.md) registers
`hil-completed-runs@2026-10-09`: the three existing HIL output archives and their three member
inventories, published as external evidence with serve denied. Restore both the six-file payload
and the complete member identity of each restored archive. The original output trees and historical
Git artifacts remain. BLD's existing NAS collection and the active warm-refinement producer remain
unchanged. The catch-up repairs the missing NAS recovery copy; it does not claim that the retired
worktrees satisfied a requirement adopted later.

## Consequences

- New clones retain small, reviewable authority instead of accumulating complete run archives.
  Reproducing a bulk-backed analysis also requires access to the registered NAS collection.
- Worktree retirement has an explicit recovery prerequisite. A detached NAS can delay closure,
  while existing verified immutable collections avoid redundant transfers and repeated checks.
- The existing inventory/copy/restore machinery addresses accidental omission and partial copy;
  no new defense framework or scientific test campaign is needed for this policy change.
- NAS preservation does not establish recovery from NAS failure. Retained independent workstation
  copies and the existing class-specific prune restrictions remain necessary.
- Already-pushed archives remain in repository history. This prospective rule does not shrink
  existing clones or rewrite other computers' branches.

## Alternatives considered

- **Keep compressing complete runs into Git:** preserves bytes but still accumulates bulk history
  and fails the maker's requested NAS-before-closeout policy.
- **Keep only hashes or relocate output locally:** detects loss or changes its local path, but
  does not provide the requested verified NAS recovery copy.
- **Copy whole worktrees indiscriminately:** includes rebuildable dependencies and risks mixing
  rights/classes; use the useful-output inventory and existing collection lifecycle instead.
- **Require a new restore for every closeout despite exact prior coverage:** redundant when an
  immutable collection already has matching identities and verified recovery.
- **Immediately rewrite old Git history:** exceeds this direction's prospective storage correction
  and needs separate coordination with the other checkouts.
