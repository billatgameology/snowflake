# NAS marker/bootstrap and first attached audit — 2026-08-15

This is the bounded post-bootstrap state record for the macOS mount. It records only the canonical
marker, fixed control paths, catalogue-derived manifests, and aggregate audit result. Bootstrap did
not enumerate unknown roots. The audit read bounded top-level names internally for classification
but emitted only aggregate counts; no credential value was read, emitted, hashed, moved, or
catalogued.

## Marker and fixed control state

The read-only command
`node scripts/nas-asset-bootstrap.ts --nas-root /Volumes/snowcrystal` exited 0 and reported
`state: "already-bootstrapped"`, two validated identity roots, six required control directories
already present, and the marker validated. The marker is an ordinary 72-byte file with SHA-256
`c7aa03ec6cb96e3922f17f5005cbea984dea8f947ba8f42ef0ca8a41ebdf1dc1`.

macOS `stat` reported the marker and the fixed `_control`, `staging`, `locks`, `receipts`,
`quarantine`, and `trash` paths owned by UID:GID `501:20` with mode `0700` as exposed by this SMB
mount. That is a macOS observation, not a Windows ACL or cross-host privacy claim.

## Attached read-only commands

`npm run assets:verify -- --nas-root /Volumes/snowcrystal` exited 0. It verified the declared owner
manifests and every machine-supported selector aggregate; payload hashing was not requested. Its
report recorded two documented-only selectors, four collections without declared owner
manifests, and thirteen attached collections whose payload bytes were not read. Those limitations
are not failures of the bounded manifest check and do not assert payload presence.

`npm run assets:audit -- --nas-root /Volumes/snowcrystal` intentionally exited 1. Its bounded
top-level metadata scan observed seven entries: six classified and one unclassified; unsafe,
case/NFC-alias, symlink, special/unstatable, wrong-kind, and missing-required-root counts were all
zero. The remaining entry was reported only as an aggregate unclassified count. It is the open
credential-custody item and keeps the catalogue Done When open.

## Live governed index and streaming

`node scripts/gutcheck-build-index.ts` exited 0 against the marked physical share and reported
3 sections / 37 items. The generated index contained only mount-agnostic `/nas/` URLs and no
private-root or absolute-mount string. A Vite server bound to loopback returned 200 and 339 bytes
for one catalogue-approved generated file, 206 and 10 bytes for its requested range, and 403 with
zero response bytes for both a private collection root and an unknown root. The server was then
stopped; no payload was modified.

## First physical compatibility restore

After the reviewed implementation landed as commit `b9b7b40`, the coordinator ran the exact
operator commands from `docs/local-assets.md` against the marked macOS share:

```text
npm run assets:restore -- --collection earlier-phase3-visual@2026-08-01 --to out/restores/earlier-phase3-visual-2026-08-01
npm run assets:verify-restored -- --collection earlier-phase3-visual@2026-08-01 --from out/restores/earlier-phase3-visual-2026-08-01
```

Both exited 0 and independently reported 10 files / 984,164 bytes with tree SHA-256
`73a9f672d9e803854ec8c82a2a0e0192f448989984ce30772e768b20644d3faf`.
The fresh ignored staging tree was retained for inspection. Both reports explicitly state
`durableReceiptWritten: false` and `pruneAuthorized: false`; the result verifies only this local
compatibility staging tree. The commands read selected NAS payloads but wrote, moved, and deleted
nothing on the share.

## Limits

The manifest/audit commands did not hash collection payloads, and the compatibility restore hashed
only its ten selected Phase 3 files. No NAS payload was moved, mutated, or deleted. No command
inspected effective server ACLs, executed Windows `S:/`, validated an independent backup, rotated
a credential, or authorized publication, garbage collection, or pruning.

## Compatibility-restore review

OpenAI Codex GPT-5 reviewed the retained Phase 3 staging tree as a non-author agent with shared
coordinator/developer context. The reviewer independently re-derived the committed owner selection,
recomputed the exact 10-file / 984,164-byte inventory and tree SHA-256
`73a9f672d9e803854ec8c82a2a0e0192f448989984ce30772e768b20644d3faf`, and found no symlinks,
special files, hard links, or case/Unicode aliases. Rule 7, focused catalogue/progress tests, and the
staged diff check also passed. The reviewer did not access the NAS or observe the original command
exits, run the full suite, inspect Windows/SMB/ACL behavior, validate backups or credential custody,
or authorize any receipt or prune operation.
