# NAS layout migration — 2026-08-16

## Result

The one-time organization pass is complete on the macOS-mounted project share. Every retained
project payload formerly loose below top-level `out/` or `research-cache/` now has a versioned
collection locator below `collections/`. Material that could not yet be assigned a durable
collection moved to private custody below `_control/quarantine/`; it was not deleted. Both legacy
top-level payload roots are absent.

The share still has non-payload infrastructure outside those roots: the project identity marker,
provider-managed recycle metadata, and one unnamed credential-custody item reported only as an
aggregate by `assets:audit`. Those are not asset collections. The custody item was not opened,
named, hashed, moved, or catalogued by this pass.

## Standard layout

Future project bytes use these exact locations:

| Purpose | Location |
| --- | --- |
| Durable payload | `collections/<asset-id>/<version>/payload/` |
| Public-safe owner manifest | `docs/nas-assets/manifests/<asset-id>/<version>.json` |
| Private-filename owner manifest | `collections/<asset-id>/<version>/manifest.private.jsonl` |
| Collection registration and policy | `docs/nas-assets.json` |
| Unresolved private custody | `_control/quarantine/unresolved/<batch-id>/` |
| Migration receipt | `_control/receipts/migrations/<batch-id>/result.json` |

An existing complete tracked owner manifest may remain authoritative when copying its rows into a
new file would create duplicate ownership. `docs/nas-ledger.json` is that explicit exception for
the migrated generated-output collections. Historical producer paths remain in frozen evidence,
source records, `historicalRepoPath`, and `legacyAliases`; catalogue-aware readers translate them
to the current physical collection without rewriting historical bytes.

## Generated-output collections

The earlier governed Phase 3 move and this pass leave the generated-output ledger with 23,225
files / 469,030,661,007 bytes. The exact tracked artifact is `docs/nas-ledger.json`: 5,263,948 bytes,
SHA-256 `76d8c54f20e75913dda3e621dd67a45321cab130559a7956a6cb8ccc1e53a6b4`.

| Collection | State | Files | Bytes | Historical root |
| --- | --- | ---: | ---: | --- |
| `gutcheck-generated-public@2026-08-15` | active | 22,190 | 457,429,171,007 | `out/gutcheck-gg-realism` selected generated prefixes |
| `earlier-phase3-visual@2026-08-01` | active | 10 | 984,164 | `out/phase3-visual` |
| `gutcheck-workspace-remainder@2026-08-15` | provisional | 931 | 833,991,988 | remaining `out/gutcheck-gg-realism` selection |
| `gutcheck-retained-archives@2026-08-07` | provisional | 6 | 10,721,854,876 | gut-check archive selection |
| `out-legacy-scratch-archives@2026-08-15` | provisional | 2 | 41,999,619 | `out/archives` |
| `phase9-failed-debug@2026-08-13` | provisional | 10 | 85,153 | `out/debug` |
| `phase6-arm64-host-record@2026-08-12` | provisional | 55 | 43,644 | `out/phase6-arm64` |
| `wp3-phase4-review@2026-08-12` | provisional | 21 | 2,530,556 | `out/wp3-review-phase4` |

The 2026-08-16 `out/` batch moved 23,215 files / 469,029,676,843 bytes into seven collections by
absent-target same-share directory rename. Its receipt is 1,117 bytes, SHA-256
`729a8c94de837b23acd44d68153c84b2f1a20c5847bc162a2ac0fdb8ff7194b3`. Before the move, 710
documented generated files / 11,170,310,714 bytes omitted by the older ledger were fully hashed
and added. Final path, count, and byte totals matched the prepared collection sets.

## Private research collections

Six retained research selections now total 3,989 files / 3,607,599,141 bytes:

| Collection | State | Files | Bytes | Private owner-manifest bytes / SHA-256 |
| --- | --- | ---: | ---: | --- |
| `research-private-freeze@2026-08-11` | active | 3,778 | 2,024,519,833 | 938,836 / `9d552bfb27a0d919af0cb306271a511fb72fd718f2236ae6cbbcd0d7fb2a98e6` |
| `research-mac-snapshot@2026-08-15` | provisional | 1 | 1,172,661,248 | 398 / `c69a405d610991a8a1ad6c17a94562abf0c901015a598cde26e8da6dd66697b1` |
| `phase8b-derived@2026-08-15` | provisional | 66 | 11,636,810 | 16,348 / `3507970990a6543e66319d20b471b5e5b0ed83d6078b3a308dc1172554eb8027` |
| `phase8b-search@2026-08-15` | provisional | 115 | 232,427,655 | 29,572 / `5608dd7c13a1314c066d51b22d6e5607828ba22388d4bf06fb73507d355c9e06` |
| `phase9-search@2026-08-15` | provisional | 3 | 631,494 | 910 / `4edb758f6b2f473cc90f534232be31a1fb9ad03e079655f9b451acb3ba67d767` |
| `post-phase9-intake@2026-08-13` | provisional | 26 | 165,722,101 | 6,335 / `9d839913d4f078a912e302194e34d718e470f91244f6cf81e4c6b627e7dd90db` |

The initial research receipt is 1,940 bytes, SHA-256
`7fdcdc26ac493f8a080071d168a66d5c8e634b43eb0f0d3bc076e93ca95e0bfe`. It preserves the
20,531,852-byte historical private manifest with SHA-256
`3f5b2cd66f653a75f7ed91d769e35b97194e8ffe16901a1a3267d1bf497b6846` under the migration
receipt tree.

Two bounded corrections then promoted 15 inputs directly used by tracked Phase 9 replay from
quarantine into `research-private-freeze`. Each exact source row was SHA-256 verified before and
after its absent-target same-share move, and each revised private manifest was byte-verified. The
13-file / 308,546-byte correction receipt is 762 bytes, SHA-256
`e2a072cf00392c5b8015d1414bd51cfd016efd4b6e48abcd0147099fa3324ad4`; the 2-file /
2,505,727-byte correction receipt is 761 bytes, SHA-256
`613df6102877e06a5a7cd36c7145b26cd85984e7d02ff04f700645ef91c7b56e`.

## Quarantine

The final unresolved research batch contains 73,095 files / 2,166,064,630 bytes. Its private
manifest is 24,068,458 bytes with SHA-256
`2bc0aaafbf428efe211bc4ecefd334293b34cfd1a2ca5cc21985ac43d7ac6dfa`. It contains the remaining
historical recovery-or-scratch selection, redundant tracked-record mirrors, 179 previously
unmanifested content files, bounded copy-verification residue, and local metadata. These bytes are
preserved pending classification or an explicit maker-approved disposal plan; quarantine does not
make them a durable collection or authorize deletion.

The verified legacy Phase 3 copy remains separately quarantined from its earlier governed move.
No quarantine payload was deleted in this pass.

## Verification and compatibility

- The generated and research batches began from exact path/count/byte maps. Final collection and
  quarantine sets matched those maps; target roots were absent before placement.
- Research private-owner manifests bind every retained row. The large historical private selection
  reused its registered content hashes and was checked for exact paths and byte sizes; the 15 replay
  corrections were freshly rehashed. The other five retained research collections were fully
  hashed for their new private manifests.
- One immutable research source file could not be renamed directly. It used a verified copy to an
  absent target followed by an exact source unlink; the destination digest matched before the
  source was removed.
- The Phase 9 knowledge calculation completed from the canonical private collection and its output
  was byte-identical to the tracked evidence artifact.
- `npm run assets:verify -- --nas-root /Volumes/snowcrystal` returned `ok=true` for catalogue and
  owner-manifest bindings. It reported three unavailable no-manifest limits and fourteen
  payload-not-read limits; it did not claim a whole-share payload rehash.
- `npm run assets:audit -- --nas-root /Volumes/snowcrystal` intentionally returned nonzero with six
  bounded top-level entries: five classified and one unnamed custody item. Unsafe paths, aliases,
  links, special files, wrong kinds, and missing required roots were all zero.
- Compatibility readers map producer-era research and generated-output locators to canonical
  collection roots. Frozen evidence and source records were not rewritten.

## Limits and remaining decisions

This pass did not execute Windows `S:/`, inspect SMB ACL behavior, establish an independent backup,
rotate or relocate the unnamed credential-custody item, or authorize quarantine deletion. It did
not freshly rehash every large historical research payload or every previously registered
generated row: the 710 new generated rows were hashed, while existing ledger rows retained their
registered hashes across same-share renames. Catalogue states remain provisional where rights,
retention, recovery, or evidence authority is unresolved; physical organization is not a
scientific or retention verdict.
