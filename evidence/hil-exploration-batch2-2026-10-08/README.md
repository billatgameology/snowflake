# HIL first-batch triage and second-batch preparation

Project-owned internal development evidence, permanently retained under ADR 0038. No physical
validation, phase credit, serving permission, old-checkpoint migration or local-prune permission.

The completion triage records all 56 first-batch rows: fifty size endpoints and six checkpoint
publication I/O failures. The science triage records the complete named source inventory and
the seed/pressure comparisons used to register the sixteen-row second HIL batch. These receipts
refer to the original fixed producer `b9cf7ed72c82e350b93570fafd8e45afa0b95d53` and absolute
execution paths as historical provenance. Failed endpoints remain unresolved.

`batch1-hil-triage-evidence-20261008.tar.gz` retains the actual consumed result/spec/exit/event
and spatial bytes, triage records/recipe and small bound completion/checkpoint metadata.
`batch1-hil-triage-evidence-20261008.inventory.json` lists exact members, byte lengths and
SHA-256 values. Extract into a fresh directory, preserving the archived `out/` paths, then compare
every regular file against `bundle-inventory.json`. The original source checkout is required to
reexecute its analysis recipe, which imports the tracked runner modules. The archive intentionally
omits solver checkpoint payloads: all original output and checkpoint generations remain in the
retained execution worktree pending explicit recovery and joint HIL/BLD preservation decisions.

Common-age comparisons use actual recorded states at or before the common age and retain the
next-state bracket; there is no interpolation or cycle-offset matching. Two seed shapes have
37 versus 35 initial sites, so this is near-volume-matched, not exact volume control. Endpoint
maximum extent does not hold each axial/lateral span equal. These are current-model leads;
neither mature growth nor grid/domain independence is established.

See `docs/plans/hil-exploration-batch2.md` for the frozen next roster, publication repair and
execution/verification record. Runtime measurements and full-check receipts added here retain
their exact command, source and execution limits.
