# Review — NAS legacy restore compatibility path

- **Date:** 2026-08-15
- **Verdict:** accepted for the four current active legacy collections; no transaction or prune authority
- **Reviewer:** OpenAI Codex GPT-5-family subagent, non-author, with shared coordinator/developer context

## Stable reviewed bytes

| File | SHA-256 |
| --- | --- |
| `scripts/nas-asset-selection-lib.ts` | `912a8cf6fe445d1b2f7dec94b525e777bca1674bff96caf934b29e3ae4fd5bb9` |
| `scripts/nas-asset-legacy-restore-lib.ts` | `38897175150a37170ebbbd559dbd23fddad1fc02ed483a20834c276f5d49cfde` |
| `scripts/nas-asset-restore.ts` | `a672bcc390e17ba9ebfe29e2fcea39d473bc4e31ea93f408fe2431ac02e22ebd` |
| `runner/test/nas-asset-selection-lib.test.ts` | `cf95acd0ecef6de2348c7f4b3bab1c66d1b2d8dc6bce8eb32f4eca448527ea53` |
| `runner/test/nas-asset-legacy-restore.test.ts` | `8ddc4064ce954ac40a211e369b02e721af69ad97c7031a518431553fdd4d2ca6` |
| `runner/test/nas-asset-restore-cli.test.ts` | `ccf0bf91d4ad55fe38a23434b1bf7778b4028e04b9f522caca0e165acfcc59eb` |
| `package.json` | `1158c0528e11f37928ecedc2104fed45fd447879567485148cccd5ea149092b8` |

## Independent execution

The reviewer inspected the selector, restore library, production CLI, package surface, current
catalogue commands, and their fixtures. The exact focused command was:

```text
TMPDIR=/private/tmp npx vitest run runner/test/nas-asset-lib.test.ts runner/test/nas-mount-identity.test.ts runner/test/nas-asset-legacy-restore.test.ts runner/test/nas-asset-restore-cli.test.ts runner/test/nas-asset-selection-lib.test.ts runner/test/nas-assets-catalog.test.ts runner/test/nas-assets.test.ts
npm run typecheck
npm run lint:rule7
git diff --check
```

The seven focused files and 139 tests passed; both typechecks passed; Rule 7 was clean over 1,002
files; and the diff check was clean (this review record). The reviewer replayed the original
forged-catalogue child-process exploit: the repaired command exited nonzero, emitted one sanitized
JSON failure, and created no file in either the canonical or injected repository.

After the generated-output ledger acquired exact rows for both scratch archives, the real-catalogue
missing-owner negative control was repointed from that now-owned collection to the still-unowned
`phase8b-derived@2026-08-15` collection. No production code or assertion changed. The reviewer
inspected the final test bytes and reran its 16 tests within the closing 229-test boundary.

The review confirmed exact active `id@version` binding, marked-share validation, canonical
catalogue/repository authority, path-free reports, fresh `out/restores/` reservation, no-clobber
behavior, source and destination integrity checks, exact directory shape, single-file refusal,
partial-failure visibility, and explicit `durableReceiptWritten: false` /
`pruneAuthorized: false` output. The source-mutation claim is limited to mutation or replacement
observed during each descriptor-bound copy; a later source change is outside the already verified
destination result.

## Operational limit

Sibling alias checks currently rescan directory entries for each path component and restored file.
For the observed 13,455-file flat directory, the reviewer derived approximately 181.0 million
source and 90.5 million destination sibling-entry comparisons. Synthetic zero-byte restores on
local APFS measured 2.313 seconds at 500 files, 5.856 seconds at 1,000, 11.665 seconds at 2,000,
and 26.945 seconds at 4,000 (reviewer execution recorded here). These measurements do not transfer
to SMB or to the 446 GB collection. This is not a correctness blocker for the small initial
restore, but the large restore is operationally unmeasured and must not be called practical until
optimized or timed on its registered host and storage path.

## Limits

The reviewer did not run exact `TMPDIR=/private/tmp npm test`, mutate or restore from the physical
NAS, execute Windows `S:/`, test SMB contention or performance, inspect effective ACLs, run the
446 GB restore, validate an independent backup, or conduct hostile same-credential race testing.
This path has no owner-manifest generator, tracked catalogue/receipt update, Git-head binding,
durable publication receipt, or prune authority. It is accepted only for the four active legacy
locators in the 2026-08-15 catalogue. A forward-layout collection requires explicit
legacy/transaction dispatch before it may become active. This review shared the developer's
context and is not a different-model or context-independent audit.
