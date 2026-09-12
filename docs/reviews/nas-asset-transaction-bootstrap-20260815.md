# Review — NAS transaction fixture core and share bootstrap

- **Date:** 2026-08-15
- **Verdict:** fixture core accepted behind a non-production boundary; production exposure blocked
- **Reviewer:** OpenAI Codex GPT-5-family subagent, non-author, with shared coordinator/developer context

## Initial reviewed bytes

| File | SHA-256 |
| --- | --- |
| `scripts/nas-asset-transaction-lib.ts` | `b321c48574f864a81cc424d0b15c8ea1bbba40f133242a6df4a5ba6338080711` |
| `runner/test/nas-asset-transaction-lib.test.ts` | `0e559d47799ea9ea3fa9f4e2c90ad67d5862b12de5786036b526f07e321f5093` |
| `scripts/nas-asset-bootstrap.ts` | `b9a6c9b2c5b7bb75fb142ee55d9a6c35dbd76e119c373a42f297501a5e7c3a1c` |
| `runner/test/nas-asset-bootstrap.test.ts` | `1f722c8cff2765c11751e3cb31814a53badb6ae72397da6b1e718526a6a2c3c8` |
| `scripts/nas-asset-lib.ts` | `c31d682e66ab39d496bb418b3ee7ca574de67d67d24923f0f1627e3b10875178` |

## Independent execution

The reviewer ran the focused transaction, bootstrap, and shared-library fixtures on the stable
bytes above: 113 tests passed (`TMPDIR=/private/tmp npx vitest run
runner/test/nas-asset-transaction-lib.test.ts runner/test/nas-asset-bootstrap.test.ts
runner/test/nas-asset-lib.test.ts`; this review record). Both TypeScript checks and
`git diff --check` also passed. A selected adversarial rerun independently executed 15 controls
covering root overlap, lock-owner replacement, empty-directory collision, final-parent escape,
stage replacement, copied receipts, late inventory entries, bootstrap decoys, pre-marker forged
control state, and control-parent swapping; all 15 refused without the prohibited mutation (this
review record).

The reviewer additionally ran a separate-process receipt-parent toggler. Against the stable
transaction library it redirected one no-replace JSON creation outside the previously validated
parent after 307 attempts; 28 attempts completed in the ordinary parent before that observation
(`{"attempts":307,"ordinarySuccess":28,"redirected":"r-306.json","outsideWitness":true}`;
this review record). Portable Node does not expose descriptor-relative file creation on the
supported hosts. Therefore the receipt-writing transaction core and bootstrap remain unregistered
in `package.json`, and no forward publication, transaction-certified restore, prune, or bootstrap
command may be described as production-safe merely from this review. The independently reviewed,
receipt-free legacy restore is outside this review and grants no transaction certification or prune
authority. ADR 0051 records the cooperative same-credential/ACL boundary; a production command
needs either a stronger primitive or a deliberately reviewed narrowing of that threat boundary.

## Reviewed case-alias repair

A second non-author OpenAI Codex GPT-5-family subagent, with the same shared coordinator/developer
context, reviewed the narrow restore-overlap repair at current transaction-library SHA-256
`85530d3357a55a3f71d8c16db7854ae10934782496a8d81adbd95cf4255f14aa` and test SHA-256
`5e951737a661eb15207ecbb931453edf1bee9ef111f814f43bed35826a2286d2`. It ran the focused
transaction suite (41/41), typecheck, diff checks, the exact case-alias test alone, and an
independent macOS temporary-directory probe. The probe established that lower- and upper-case
spellings resolved to the same inode while the old lexical relation appeared outside the share;
the repaired call refused before creating a destination, restore lock, or staging directory and
left the final payload unchanged.

That reviewer did not run exact `npm test`, touch the live NAS, execute Windows/SMB or ACL checks,
or inject a crash. The original receipt-parent race and missing nested-directory crash-durability
guarantee remain applicable, so the blocked-production verdict is unchanged.

## Limits

The reviewer did not run exact `TMPDIR=/private/tmp npm test`, a physical NAS mutation, SMB or
Windows execution, effective ACL inspection, power-loss injection, a full collection hash, or a
destructive operation. The prune surface remains computation-only with
`executionSupported: false`; no delete executor exists or was reviewed.
