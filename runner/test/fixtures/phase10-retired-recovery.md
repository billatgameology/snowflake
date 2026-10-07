# Retired Phase 10 recovery test data

`phase10-retired-recovery.tar.gz` is the exact project-owned retained-attempt archive from
`local-worktree-closeout@2026-10-01`, payload `evidence-phase10-execution-v2.tar.gz`:
214,961 bytes, SHA-256 `73260d23836866bd5c47ca871e60ab3e6f12938eaf722ca70dc5b7f4370b5e25`.

`phase10-retired-references.tar.gz` is the same collection's exact
`evidence-phase10-c0v-reference-v1.tar.gz` payload: 100,651 bytes, SHA-256
`e34e5abb9bdcd621f879f5cf6a68e9d658741446c02b86a83931fbd228298b5a`.
It preserves the nine retained reference/resource-baseline files required by the accepted A-P
verifier. The recovery archive preserves 70 regular files.

Both source archives and copied fixtures were independently hashed on 2026-10-07.

The test helper validates this original owner pin and extracts the retained locks and refused
attempt records into a disposable, private Git checkout at `7c58f8b`. Production verifiers then
reopen their original scientific identities and raw lifecycle records. This fixture replaces the
tests' dependency on one computer's ignored `out/phase10-execution-v2/` directory. No published
evidence, scientific threshold, freeze pin or accepted claim is changed.

These are historical, refused records. They grant no execution credit and are never a resume queue.
The test extraction is not a NAS restore command or authorization to resume retired S6.
