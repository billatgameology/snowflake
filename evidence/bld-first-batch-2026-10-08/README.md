# BLD first-batch results — 2026-10-08

All 42 registered BLD rows reached size endpoints; the existing event/result checker reports no errors. Execution used producer d7ff3e1fb122ecbf8994539d3623928cbe5a9c6b, Node v24.13.1 and at most 16 workers, with no experiment wall deadline. The launch ended at 2026-10-08T21:04:12.1478650Z. Track-specific scientific interpretation is pending; this completion is not physical validation.

The three archives preserve every byte in the completed campaign, capacity probe and control directories: 2061 regular files / 1050129781 original bytes, compressed to 66684281 bytes. Every decompressed member was compared by path, length and SHA-256 against payload-members.json. The archives include all event histories, spatial snapshots, restart fields, logs and receipts; none of these claim inputs depends on an external-evidence exception. archive-verification.json records each archive digest and count. Files are pinned in ../MANIFEST.json with Git text conversion disabled.

campaign.json, summary.json, launch-complete.json, launch-exit.json and probe.json are exact selected originals for convenient inspection. Original directory records remain inside the archives. The probe includes its rejected 28-worker rung; it does not mean the 42-row campaign failed. The original automatic wrapper failed to advance after a null exit-code capture; the retained control records show the corrected launch. No stopped legacy-run bytes were replaced.

The complete raw operational copy is registered as bld-first-batch-output@2026-10-08 at collections/bld-first-batch-output/2026-10-08/payload/ on the marked NAS. Its policy is project-owned generated cache, immutable, non-served and maker-approved deletion only. Git evidence remains authoritative for claims. The owner manifest and publication/restore checks are linked from [the batch plan](../../docs/plans/hil-bld-first-batch.md#bld-result-preservation--2026-10-08). Local originals remain.

## Recovery

From a checkout containing the committed catalogue and Node v24.13.1, choose a fresh destination:

    npm.cmd run assets:restore -- --collection bld-first-batch-output@2026-10-08 --to out/restores/bld-first-batch-output-2026-10-08
    npm.cmd run assets:verify-restored -- --collection bld-first-batch-output@2026-10-08 --from out/restores/bld-first-batch-output-2026-10-08

The restored payload contains batch1-bld-resumable, batch1-bld-resumable-probe and batch1-bld-resumable-control directly. No NAS archive extraction is required. All experiment rows are terminal, so do not restart them. For read-only scientific rechecking, import summarizeFirstBatchRow from runner/src/hil-bld-batch-summary.ts for each restored campaign row; the CLI summarize also works but rewrites summary.json, so run exact-byte verification first and preserve that original if using the CLI.

For Git-only recovery the archives contain out/<original-directory>/ paths. Archive member identities and expected bytes are completely listed in payload-members.json (prepend out/ to each path). Check member names/types against that inventory, extract to a fresh directory and compare exact extracted paths, lengths and SHA-256. The archive verification executed those decompressed-member checks before publication.

preservation-invocation.mjs and archive-evidence.py retain the bounded operational recipe; shared storage and scientific code were unchanged. Publication uses same-share staging and no-replace placement, then full hash and fresh restore checks. Windows SMB durability is verification-based; this is not a hardware crash or off-site recovery claim.
