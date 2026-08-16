# NAS inventory audit — 2026-08-15

## Purpose and status

This is the bounded, read-only opening census for the
[NAS asset-governance plan](plans/nas-asset-governance.md). It records what was observed on the
attached macOS share, what was derived only from an existing manifest, and where the records do
not yet account for the same bytes. It is **not** the final layout decision, a migration manifest,
a deletion list, a backup claim, or authorization to rotate a credential.

No share byte or repository file was moved, renamed, deleted, or rewritten during the audit. No
bulk payload was opened to recompute its digest. One unbounded recursive `du` attempt was stopped
with exit 130 after producing no result; the useful census below instead combines bounded
filesystem metadata reads with existing manifests.

## Scope and notation

- **Host observation:** macOS, 2026-08-15.
- **Share resolution:** `detectNasMount()` in `scripts/nas-root.ts` returned the attached share
  prefix `/Volumes/snowcrystal/`. That observed prefix is reported as execution provenance only;
  it is not a path for consumers to hardcode.
- **Filesystem-observed (`F`):** counted from `readdir` plus `lstat`, or from a bounded `find` and
  `stat`, without following symlinks and without reading regular-file payloads.
- **Manifest-derived (`M`):** counted from the named existing manifest. It describes that
  manifest's scope and date, not an independently enumerated current share.
- **Reconciled (`R`):** computed by comparing two manifest records in memory. Equal hash fields
  mean that the records agree; they do not mean this audit rehashed the NAS byte.
- **Sampled (`S`):** a deterministic subset was checked on the share for existence, regular-file
  type, and byte length only.

The full recursive metadata walk of the roughly 447 GB ledgered output tree and the 76,653-entry
research-cache manifest was deliberately not completed. The deep trees therefore use manifest
totals plus bounded samples. Smaller second-level roots were fully metadata-enumerated.

## Top-level observation

The bounded depth-two listing found these top-level entries:

| Entry | Observed type | Disposition signal |
|---|---|---|
| `out/` | directory | Live generated-output mirror, archives, and historical debug material. |
| `research-cache/` | directory | Private sources, derived material, searches, intakes, archives, and verification residue. |
| `#recycle/` | directory | Synology recycle namespace; recovery convenience, not durable preservation. |
| `.DS_Store` | regular file, 12,292 bytes | Finder metadata; not a durable project asset. |
| `[redacted credential-like root]` | regular file, 22 bytes | Live share-root object; see the security finding below. |

The share reported 63 TiB capacity, 19 TiB used and 44 TiB available through `df -h` at audit
time. Those filesystem-wide values are capacity context, not a project logical-byte total.

## Second-level census

The table deliberately keeps filesystem observations separate from manifest totals. A row marked
`M` was not recursively recounted from the live share during this audit.

| Share-relative root | Basis | Files | Logical bytes | Owning or related record |
|---|---:|---:|---:|---|
| `out/gutcheck-gg-realism/**` excluding retained archive ZIPs | M | 22,411 | 447,092,852,281 | `docs/nas-ledger.json` |
| `out/gutcheck-gg-realism/archives/` | F | 6 | 10,721,854,876 | Historical archive rows in `large-artifact-inventory.json`; only the six 2026-08-07 files remain live. |
| `out/archives/` | F | 2 | 41,999,619 | One file in `docs/nas-ledger.json`; the later tar is recorded in `docs/local-assets.md`. |
| `out/debug/` | F, M | 10 | 85,153 | `docs/nas-ledger.json` |
| `out/phase3-visual/` | F, M | 10 | 984,164 | `docs/nas-ledger.json` and `evidence/OUT-TREES-MANIFEST.json` |
| `out/phase6-arm64/` | F, M | 55 | 43,644 | `docs/nas-ledger.json` |
| `out/wp3-review-phase4/` | F, M | 21 | 2,530,556 | `docs/nas-ledger.json` |
| `research-cache/content/` at the 2026-08-11 whole-cache freeze | M | 76,653 | 3,996,025,157 | Share-only `research-cache/RESEARCH-CACHE-MANIFEST.jsonl` |
| Registered media subset of `research-cache/content/` | M | 2,477 | 2,013,534,785 | `research/media-inventory.json` |
| `research-cache/local-worktree-archives/` | F | 1 | 1,172,661,248 | `docs/local-assets.md` |
| `research-cache/phase8b-derived/` | F | 66 | 11,636,810 | Paths and individual identities are scattered through Phase 8B records. |
| `research-cache/phase8b-search/` | F | 115 | 232,427,655 | Paths and individual identities are scattered through Phase 8B records. |
| `research-cache/phase9-search/` | F | 3 | 631,494 | Phase 9 records reference this material. |
| `research-cache/post-phase9-intake/` | F | 27 | 165,728,249 | `research/phase9-post-freeze-source-intake-v1.json` owns a narrower scope. |
| `research-cache/verification-20260810-nas-copy-01/` | F | 24 | 110,412,535 | Verification residue whose retention class remains undecided. |
| `research-cache/RESEARCH-CACHE-MANIFEST.jsonl` | F | 1 | 20,531,852 | Share-only historical whole-cache manifest. |
| `research-cache/.DS_Store` | F | 1 | 14,340 | Finder metadata; not a durable project asset. |
| `#recycle/` | F | 17 | 1,344,610 | Synology recycle namespace; ten directories were also observed. |

The rows must not be summed as if they were disjoint. In particular, the registered media is a
subset of the whole research-cache freeze, and the gutcheck archive ZIPs intentionally contain
copies of some loose payloads.

## Manifest reconciliation

### Generated-output ledger

The opening snapshot of `docs/nas-ledger.json`, generated `2026-08-15T15:24:34.000Z`, recorded
22,508 files and 447,138,146,745 bytes. Its path prefixes were:

| Prefix | Files | Bytes |
|---|---:|---:|
| `out/gutcheck-gg-realism/` | 22,411 | 447,092,852,281 |
| `out/archives/` | 1 | 41,650,947 |
| `out/debug/` | 10 | 85,153 |
| `out/phase3-visual/` | 10 | 984,164 |
| `out/phase6-arm64/` | 55 | 43,644 |
| `out/wp3-review-phase4/` | 21 | 2,530,556 |

That opening snapshot had no duplicate exact paths, no differing paths with the same NFC
case-folded key,
and no absolute, backslash-bearing, or `..`-bearing path (`R`). It does **not** purport to cover
the whole share: private research, the six retained gutcheck ZIPs, recycle material, and the newer
2026-08-15 scratch tar are outside its `files[]` scope.

Later in this same governance work, the tracked ledger was extended rather than reinterpreted: the
six already-present retained gutcheck ZIPs and the verified 2026-08-15 scratch tar were added as
seven explicit rows. The current `docs/nas-ledger.json`, generated
`2026-08-16T00:18:55.000Z`, records 22,515 files / 457,860,350,293 bytes and has SHA-256
`fd4f95c709202cb9e0ff835339c560a121f38a4f61aca09330f1d562e70332a8`; the catalogue pins that
current byte set. The opening counts above remain the dated input to this audit, not a claim about
the later ledger revision.

### Gutcheck large-artifact inventory

`evidence/gutcheck-gg-realism/large-artifact-inventory.json` records:

- 1,640 loose-file rows totaling 32,977,529,276 bytes;
- 11 historical archive rows totaling 19,892,299,921 compressed bytes; and
- six logical groups: `anim-B`, `anim-smoke`, `checkpoints`, `extras`, `figs`, and `meshes`.

Resolving `root: "out"` rows below `out/gutcheck-gg-realism/` and legacy/default rows below
`out/gutcheck-gg-realism/large/`, 1,633 loose rows have the same path, size, and recorded SHA-256
in `docs/nas-ledger.json`; zero overlapping rows disagree (`R`). The seven inventory rows absent
from the NAS ledger are exactly the checkpoint group, seven files totaling 4,140,115,483 bytes:

```text
out/gutcheck-gg-realism/large/checkpoints/dendrite-1200x1200x48-noise0.ckpt
out/gutcheck-gg-realism/large/checkpoints/dendrite-1200x1200x48-noise1e-5-seed20260802.ckpt
out/gutcheck-gg-realism/large/checkpoints/dendrite-384x384x144-noise0.ckpt
out/gutcheck-gg-realism/large/checkpoints/dendrite-384x384x48-noise0.ckpt
out/gutcheck-gg-realism/large/checkpoints/dendrite-384x384x48-seed20260802.ckpt
out/gutcheck-gg-realism/large/checkpoints/plate-1200x1200x48-noise0.ckpt
out/gutcheck-gg-realism/large/checkpoints/smoke-128.ckpt
```

The retained 2026-08-07 checkpoint ZIP has the inventory's recorded compressed size of
1,012,696,447 bytes and declares those seven members and 4,140,115,483 uncompressed bytes. This
audit did not reopen or rehash that ZIP, so the archive record is not upgraded into a new member
verification claim.

The historical archive list intentionally retains absent entries. It contains four exact
old/new record pairs with equal recorded byte length and SHA-256: `anim-B`, `anim-smoke`,
`checkpoints`, and `meshes` dated 2026-08-04 versus 2026-08-07. The live archive directory already
contains only the six 2026-08-07 ZIPs; the five 2026-08-04 archive names are not live duplicates.
The two `figs` versions differ and must not be collapsed. A filename or group match alone is never
sufficient deletion authority.

### Research inventories

`research/media-inventory.json`, generated 2026-08-07, records only images, video, and PDF media:
2,477 unique safe paths and 2,013,534,785 bytes. Its `filesInTree: 21245` field describes the
larger source tree seen by that generator; it is not its registered-file count.

The share-only `research-cache/RESEARCH-CACHE-MANIFEST.jsonl`, generated 2026-08-11, instead
records a whole Windows research-tree copy. Its header reports 76,653 ordinary files and
3,996,025,157 bytes, divided as follows:

| Recorded storage class | Files | Bytes |
|---|---:|---:|
| `ignored-research-cache` | 3,642 | 1,593,265,642 |
| `recovery-or-scratch` | 72,991 | 2,401,810,560 |
| `tracked-project-record` | 20 | 948,955 |

It also records seven excluded reparse points and one excluded volatile file. The manifest is
itself only on the NAS and says its intended repository path was
`research/RESEARCH-CACHE-MANIFEST.jsonl`; that path is not tracked at this audit head. The two
research inventories differ in time, selection, and purpose. Neither may silently replace the
other, and the 72,991 recovery/scratch rows need collection-level retention review before any
future quarantine proposal.

`research/phase9-post-freeze-source-intake-v1.json` records 24 payload/provenance files totaling
165,706,780 bytes and explicitly excludes its manifest and README sidecar copies from that count.
The containing NAS tree held 27 files and 165,728,249 bytes (`F`). The record therefore describes
26 expected physical files—24 registered rows plus two documented sidecars—while the observed tree
count exceeds that accounting by one file. This count-only comparison did not establish which path
is extra; it is an unmatched-path input to the future catalogue, not deletion authority.

### `OUT-TREES-MANIFEST` preservation gap

`evidence/OUT-TREES-MANIFEST.json` names 479 files and 904,317,624 bytes across eight roots:

| Root | Files | Bytes | Loose NAS observation |
|---|---:|---:|---|
| `out/phase2b` | 11 | 60,438,811 | Not observed at the share root. |
| `out/phase4` | 125 | 519,684,864 | Not observed at the share root. |
| `out/phase4-visual` | 21 | 1,924,721 | Not observed at the share root. |
| `out/phase5` | 78 | 80,944,402 | Not observed at the share root. |
| `out/phase5-wp5-0a611e7` | 78 | 79,697,941 | Not observed at the share root. |
| `out/phase5-wp5-0a611e7-original` | 78 | 79,697,941 | Not observed at the share root. |
| `out/phase5-wp7-32eed48-superseded` | 78 | 80,944,780 | Not observed at the share root. |
| `out/phase3-visual` | 10 | 984,164 | Present loose; also in `docs/nas-ledger.json`. |

The seven unobserved roots comprise 469 files and 903,333,460 bytes. They may exist on another
host or inside an archive, but a hash record alone cannot establish either. This audit did not list
archive members, so no archive is claimed to close the gap. Each root needs a located-and-verified,
unavailable, or superseded disposition before the governance plan can call it accounted for.

## Recycle, residue, and credential finding

The recycle tree contained 17 files in ten directories, totaling 1,344,610 bytes (`F`). Its
bounded listing includes:

- an abandoned `.staging-20260810-nas-copy-01` tree with canary and hash-progress files;
- duplicate or timestamp-suffixed `live-summary` and `read-a` variants;
- a recycled post-Phase-9 manifest;
- an empty credential-named file; and
- a credential-named safe-backup file whose content is an old project handoff, not a credential.

Recycle is neither an independent storage domain nor an archive. These paths should enter a
future quarantine/retention review; this record does not authorize their removal.

The live share-root credential-like object is 22 bytes, and a historical Phase 8 plan records its
earlier use without making it an asset. No locator, value, or digest is reproduced here.
Credentials are not project assets: the final policy prevents serving and catalogue ingestion,
while rotation/revocation, secret-manager custody, and recycle purging require maker or provider
authority. The broad pre-governance `/nas` route made this a disclosure concern independent of
filesystem containment at audit time.

## Type, containment, permission, and sample checks

- The share root appeared as `drwx------`, UID:GID `501:20` (`F`).
- At depth two, all 17 observed directories appeared as `drwx------`; all seven regular files
  appeared as `-rwx------`, also UID:GID `501:20` (`F`). The executable appearance is an SMB mode
  mapping observation, not a claim that each file is an executable program.
- No symlink was found through depth three, and no special file was found through depth two.
  Fully enumerated smaller roots also contained zero symlinks, special files, or metadata-read
  errors (`F`). Deep
  `out/gutcheck-gg-realism/large/` and `research-cache/content/` were not recursively cleared of
  those risks by this bounded audit.
- The four tracked per-file inventories tested for uniqueness—NAS ledger, media inventory,
  gutcheck loose rows, and gutcheck archive rows—had no exact duplicates, no differing
  NFC/case-fold collisions, and no lexically unsafe paths (`R`). This is a manifest-path result,
  not a census of unmatched live names.
- A deterministic sample grouped NAS-ledger rows by their first two path components and selected
  up to nine evenly spaced entries per group: 46 of 46 were present regular files with the
  registered byte length (`S`).
- An evenly spaced media-inventory sample plus its last row checked 65 entries: 65 of 65 were
  present regular files with the registered byte length (`S`).
- Neither sample recomputed SHA-256.
- No Windows `S:/` access, another-user access, SMB lock, atomic rename, ACL, case-fold, or Unicode
  behavior was executed. The `0700` macOS view therefore does not establish cross-host access.

## Reproducible read-only command forms

The commands below resolve the share through project code. The variable contains the observed
host prefix; consumers continue to use share-relative paths.

```bash
snowflake_nas_audit_root=$(node --input-type=module -e '
  import { detectNasMount } from "./scripts/nas-root.ts";
  const mount = detectNasMount();
  if (mount === null) throw new Error("NAS detached");
  process.stdout.write(mount.replace(/[\\/]+$/, ""));
')

# The opening audit's raw whole-root name enumeration is retired because it emitted private and
# credential-like names. Current bounded audit reports unknown entries only as aggregate counts.
npm run assets:audit -- --nas-root "$snowflake_nas_audit_root"
df -h "$snowflake_nas_audit_root"
stat -f 'root mode=%Sp uid=%u gid=%g type=%HT' "$snowflake_nas_audit_root"

# Raw whole-root `find`, `stat %N`, link, and special-file listings are retired: they print private
# names. `assets:audit` performs the bounded metadata/type checks and emits only aggregate counts.
```

The manifest totals and main prefix breakdown are reproducible without touching NAS payloads:

```bash
jq '{generated,fileCount,totalBytes,nas,moves}' docs/nas-ledger.json
jq '{generated,format,root,scope,totals,groups}' research/media-inventory.json
jq '{generated,format,root,fileCount:(.files|length),fileBytes:(.files|map(.bytes)|add),archives}' \
  evidence/gutcheck-gg-realism/large-artifact-inventory.json
jq '{schema,recorded,totalFiles,totalBytes,trees}' evidence/OUT-TREES-MANIFEST.json
jq '{schema,state,nas,fileCount:(.files|length),fileBytes:(.files|map(.bytes)|add)}' \
  research/phase9-post-freeze-source-intake-v1.json

# The share-only whole-cache manifest is newline-delimited JSON.
wc -l "$snowflake_nas_audit_root/research-cache/RESEARCH-CACHE-MANIFEST.jsonl"
jq -s '
  {
    headers: map(select(.recordType == "header")) | length,
    files: map(select(.recordType == "file")) | length,
    excludedReparse: map(select(.recordType == "excludedReparsePoint")) | length,
    excludedVolatile: map(select(.recordType == "excludedVolatileFile")) | length,
    fileBytes: (map(select(.recordType == "file") | .bytes) | add),
    storageClasses: (
      map(select(.recordType == "file"))
      | group_by(.storageClass)
      | map({class: .[0].storageClass, files: length, bytes: (map(.bytes) | add)})
    )
  }
' "$snowflake_nas_audit_root/research-cache/RESEARCH-CACHE-MANIFEST.jsonl"
```

The filesystem counts for smaller roots used a metadata-only traversal equivalent to this. The
two large roots are intentionally absent from the list:

```bash
SNOWFLAKE_NAS_AUDIT_ROOT="$snowflake_nas_audit_root" node --input-type=module <<'NODE'
import { lstat, readdir } from "node:fs/promises";
import path from "node:path";

const nasRoot = process.env.SNOWFLAKE_NAS_AUDIT_ROOT;
if (nasRoot === undefined) throw new Error("SNOWFLAKE_NAS_AUDIT_ROOT is required");
const roots = [
  "out/archives",
  "out/debug",
  "out/phase3-visual",
  "out/phase6-arm64",
  "out/wp3-review-phase4",
  "research-cache/local-worktree-archives",
  "research-cache/phase8b-derived",
  "research-cache/phase8b-search",
  "research-cache/phase9-search",
  "research-cache/post-phase9-intake",
  "research-cache/verification-20260810-nas-copy-01",
  "#recycle",
];

async function scan(relativeRoot) {
  const result = { root: relativeRoot, files: 0, dirs: 0, links: 0, special: 0, bytes: 0 };
  const queue = [path.join(nasRoot, relativeRoot)];
  while (queue.length > 0) {
    const absolute = queue.shift();
    const entry = await lstat(absolute);
    if (entry.isSymbolicLink()) { result.links++; continue; }
    if (entry.isFile()) { result.files++; result.bytes += entry.size; continue; }
    if (!entry.isDirectory()) { result.special++; continue; }
    result.dirs++;
    for (const name of await readdir(absolute)) queue.push(path.join(absolute, name));
  }
  return result;
}

for (const root of roots) console.log(JSON.stringify(await scan(root)));
NODE
```

The sample result is reproducible by reading the two tracked manifests, selecting the stated
evenly spaced rows, and applying `lstat` to the resolved share-relative path. A future checked-in
auditor should encode that selection and its output rather than treating this one-off sample as a
complete verifier.

## Explicit limits and next use

- This audit does not authenticate the 447 GB output collection, the roughly 4 GB historical
  research-cache freeze, or any archive member. Existing SHA-256 records remain the authority for
  their named scopes.
- It does not prove the current live tree is complete relative to any manifest; the two bounded
  samples establish only their named rows.
- It does not identify every unmatched deep live file because the large roots were not recursively
  enumerated.
- It does not establish independent backup, NAS snapshot health, off-site recovery, or protection
  against NAS hardware loss.
- It does not establish Windows behavior, cross-user permissions, current credential validity, or
  publication rights.
- It does not decide whether historical archives, recycle material, verification residue, or
  recovery/scratch collections should be retained. Those are inputs to the catalogue, ADR, and
  reviewed migration plan.

This record supplied the opening input to `docs/nas-assets.json` and ADR 0051. Remaining ownership
gaps still require reconciliation, and every physical move, quarantine, secret rotation, or
deletion requires its own reviewed authority and exact target list.
