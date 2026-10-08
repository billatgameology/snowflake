# BLD results received and verified on HIL

HIL fetched `origin/codex/bld-exploration` at `b333782` and imported its completed result/recovery
bundles byte-for-byte, together with one NAS catalogue entry and its bound owner manifests.
`import-provenance.json` identifies both producer families and retains the branch-local BLD
decision and plan as historical provenance. They do not replace the current charter or HIL ADR 0060.
HIL's numerical implementation is unchanged. BLD execution source remains available on its branch.

The unchanged asset commands verified the marked NAS collection, restored it to fresh HIL
staging, and independently verified that restored tree: 2061 files / 1050129781 bytes, tree
SHA-256 `2c77efcd57f7586c68af44a1da257385f97333aec6487cbdf8c6aeb17e8585b0`.
The separate stdout/stderr and actual exit receipts record all three commands. This is a local
restore and verification, not a new publication, independent backup or deletion authorization.

`restored-row-check.json` records HIL's existing per-row checker rederiving all 42 BLD size
endpoints and matching the saved scientific summary fields. The two additional BLD status fields
were checked explicitly against terminal status, result digest, checkpoint metadata and event
prefix; only the filesystem location differs. The restored `summary.json` stayed byte-unchanged.
This did not decode/adopt BLD checkpoints, evolve a solver or prove cross-producer equivalence.

`hil-completion-status.json` retains the earlier HIL census: 56 first-batch and sixteen successor
size endpoints, including all six recovered I/O failures. Across the two computers 114 completed
cases are available for analysis. These counts establish operational coverage, not scientific
morphology conclusions or physical validation.

HIL staging is `out/restores/bld-first-batch-output-2026-10-08/` in the integration worktree.
Use the registered cold/warm comparisons and actual physical-time brackets for the next joint
readout. Source-version differences must be considered before pooling or comparing outcomes.
Both computers' original output and the NAS collection remain intact; no new campaign launched.

The imported `evidence/bld-first-batch-2026-10-08/verify-science.mjs` is preserved producer code.
It expects BLD's additional summary metadata and is not the command used for this HIL readout.
For future replay use the recorded BLD producer or repeat the explicitly scoped comparison above.
