# 0051 — Govern durable untracked assets on the NAS

- **Date:** 2026-08-15
- **Status:** proposed
- **Charter impact:** none. This decision supplies an operational storage lifecycle for bytes that
  the charter or an affected plan already permits outside Git. It changes no phase gate, evidence
  label, scientific claim, or existing exception.

## Context

Gitignore answers whether Git notices a path; it does not say whether the bytes are disposable,
durable, private, reproducible, or backed up. The repository currently has several intentionally
ignored populations with different obligations: restricted research sources, project-owned media
masters, expensive generated output, resumable checkpoints, cited diagnostics, dependencies, and
scratch. Treating all of them as either “cache” or “archive” has already made local cleanup require
manual, collection-specific reconstruction.

The shared `snowcrystal` NAS holds much of this material, but presence on the share is not yet one
governed state. Existing records have deliberately different scopes:

- `docs/nas-ledger.json` is a generated-`out/` census;
- `research/media-inventory.json` owns the research-media inventory;
- `evidence/gutcheck-gg-realism/large-artifact-inventory.json` owns the gut-check bulk products;
- `evidence/OUT-TREES-MANIFEST.json` records a historical ignored-evidence exception; and
- the share-local research-cache manifest owns private acquired bytes.

Combining their file rows into another super-ledger would duplicate ownership and create several
writers for the same facts. Leaving the records unrelated, however, cannot answer which share
roots are durable, which record owns each root, which bytes may be served, or which local copy may
be pruned.

Two accepted decisions establish the boundary this decision must preserve. Decision 0004 keeps
third-party research media out of Git and keeps its provenance index tracked. Its statement that
the bytes are a cache applies to reacquirable, rights-restricted source material; it does not make
a digest a backup or permit a unique source to be discarded. Decision 0038 requires the actual
bytes behind published claims to live in tracked `evidence/` by default because a hash detects
loss but cannot restore a missing artifact. Its historical earlier-phase exception and the
charter's rights-bound source exception remain explicit exceptions, not a general permission to
externalize evidence.

The charter already states the applicable Phase 8B storage exception verbatim:

> Normalized numeric bytes enter Git only when recorded rights permit redistribution; otherwise tracked records bind their identity, hash, schema, locator, NAS-local data reference, and verifier.

It also keeps that work from changing validation authority:

> Phase 8B inherits decision 0046's isolation boundary. It performs no solver run, model or parameter change, model-output scoring, or Phase 9 implementation. Its external-search conclusion is bounded to its registered targeted routes and cutoff rather than a universal claim to all research. Phase 7 remains standalone. Phase 8B cannot grant a quantitative-validation label; under §1.5 and §3.3, only Phase 6's Nakaya gate or Phase 7's separately gated held-out comparison may grant that label over its executed, pre-registered named domain unless a future charter amendment explicitly changes that authority.

This operational policy implements the first quoted allowance while preserving the second quoted
boundary. It neither creates a new external-evidence exception nor changes what any gate must
publish. A claim-bearing artifact stays tracked under decision 0038 unless the governing charter
or an accepted decision explicitly authorizes a different storage binding and the governing plan
records that binding. In
particular, this decision does not retroactively externalize Phase 6 evidence or weaken an active
plan's committed-artifact requirement.

The current whole-share `/nas/<path>` development route creates a separate disclosure problem.
Filesystem containment prevents escape from the share, but it does not prevent a caller who knows
a path from requesting a private source, credential, quarantine item, or unrelated archive inside
the share. Finally, several copies, archives, or recycle entries on the same NAS remain one
hardware and administrative failure domain. They are not independent backups.

## Decision

### 1. Classify before preserving, moving, serving, or pruning

Every durable or cleanup-candidate collection has exactly one of these storage classes. Ignore
rules are discovery aids, not a retention policy.

1. **Tracked evidence.** Project-owned, claim-bearing bytes that reasonably fit ordinary Git stay
   under tracked `evidence/`, pinned by `evidence/MANIFEST.json`, and are retained permanently.
   This remains the decision 0038 default. Storage convenience alone cannot move such bytes to the
   NAS.
2. **External evidence.** Claim-bearing bytes may live outside Git only when their governing
   charter or an accepted decision explicitly permits it because redistribution is prohibited or
   the collection is impractical for ordinary Git, and the governing plan records the exact
   binding. The immutable NAS collection, a complete tracked binding, the exception authority, and
   an executable verifier form one evidence unit. External evidence is never eligible for
   automatic garbage collection.
3. **Private source.** Copyrighted, privacy-limited, licensed, or otherwise restricted inputs live
   in a non-served NAS collection. Git holds only the provenance and byte binding that rights and
   privacy permit. Reacquirable bytes may use their verified origin as recovery; unique or
   irreplaceable source bytes require a second independent storage domain before their last local
   copy is removed.
4. **Irreplaceable master.** Project-owned recordings, editable production sources, and other
   originals publish as immutable versions. The NAS is their shared working record, not their
   sole backup. No workstation copy may be pruned until an independently verified second storage
   domain and its restoration procedure are recorded.
5. **Generated cache.** Reproducible meshes, renders, checkpoints, and similar bulk output require
   a tracked recipe or provenance record. One verified NAS copy is sufficient when regeneration
   is the declared recovery method. Retention and garbage collection may be finite, but only under
   the collection's recorded policy.
6. **Scratch.** Temporary logs, partial experiments, dependencies, builds, and operating-system
   metadata are not durable records. A scratch collection has a declared expiration or discard
   disposition; absence is not evidence loss. A cited or otherwise useful scratch item must be
   reclassified before preservation is claimed.

Classification applies to collections rather than incidental directory names. A collection may
not mix storage classes, rights policies, privacy policies, or serving policies merely because its
files share a parent directory.

### 2. Use a federated tracked collection catalogue

A small tracked catalogue is the authority for live NAS collections. Each entry has a stable asset
ID and immutable version, storage class and state, owner workstream, canonical share-relative
locator, owner-manifest path and digest, file count and total bytes, provenance and producer
commit/command where applicable, reproducibility status, rights/privacy/serve policy, retention
and garbage-collection policy, restoration procedure, verification receipt, supersession links,
legacy aliases, and the recorded storage domains.

External evidence additionally names the claim or evidence bundle it supports and the exact
charter or accepted-decision clause that authorizes external storage plus the governing plan that
records the binding. A catalogue entry
without that authority cannot change tracked evidence into external evidence.

Detailed file rows remain in one owner manifest. Each row binds a canonical relative path, byte
length, SHA-256 digest, and role or media type; source inventories also carry the permissible
provenance/source identifier. The catalogue references existing complete owner manifests instead
of copying their rows. Sensitive collections may expose an opaque asset ID and aggregate binding
in Git while a private manifest supplies filenames; the public record must still bind the private
manifest's exact bytes without revealing restricted metadata.

All durable locators are POSIX-style paths relative to the detected share root. Absolute paths,
drive letters, backslashes, `.` and `..` components, control characters, trailing spaces or dots,
Windows-reserved names, special files, and case-fold or Unicode-normalization aliases are refused.
The common resolver uses the project share marker and canonical `VCC_NAS_ROOT`; a compatibility
alias is accepted only when both values resolve to the same share.

Forward-published collections use stable collection IDs plus immutable version- or digest-bearing
directories. `_control/` is reserved for non-served staging, locks, receipts, quarantine, and
trash plans. Existing `out/`, `research-cache/`, and frozen evidence locators are registered in
place as legacy roots when their current records bind them. Organization alone does not justify a
bulk rename, and compatibility readers preserve historical locators. `docs/nas-ledger.json`
remains a frozen-scope generated-output ledger rather than becoming the global catalogue.

### 3. Publish and migrate transactionally

Publication follows one fail-closed lifecycle:

1. classify the collection and record its rights, privacy, serving, retention, restoration, and
   backup requirements;
2. acquire a per-collection lock and scan a stable source made only of regular files, refusing
   symlinks, special files, unsafe names, aliases, and mutation during the scan;
3. copy into a uniquely named same-share `_control/` staging directory, then compare every source
   and staged byte by length and SHA-256;
4. generate the owner manifest and publish into an absent immutable destination by a same-share
   rename;
5. reopen and re-hash the final bytes, then write a publication receipt;
6. update the tracked catalogue and receipt through its own lock, temporary file, validation, and
   rename sequence;
7. restore the published collection into fresh empty staging and verify the exact file set,
   lengths, digests, and any claim-bearing verifier; and
8. only after every applicable backup requirement passes, authorize a separately explicit local
   prune list.

A completed NAS rename followed by a failed Git update leaves a visible orphan for audit; it never
authorizes source deletion. Any interrupted copy, changed source, collision, missing final byte,
failed verifier, lost share, or conflicting publisher also fails closed. Migration uses the same
copy-first lifecycle and a reviewed old-to-new manifest. It retains rollback until final readers
and review pass, and its deletion list is separate from its copy list.

Restore targets a fresh staging directory, validates archive member names and types before
extraction, checks the manifest after extraction, and places the verified tree without silently
overwriting an existing destination. Force replacement may be offered only for generated cache;
evidence, sources, and masters require quarantine and an explicit rollback path.

The implementation may describe SMB locking and same-share rename as preserved by construction on
macOS, but it cannot claim executed Windows behavior until `S:/` publication, contention, restore,
case/Unicode, and interruption fixtures have run successfully on the Windows host.

### 4. Keep rights, privacy, secrets, and serving separate

Rights and privacy determine which bytes and metadata may enter Git; storage class does not
override either. Raw restricted media, private filenames not already public, and private owner
manifests stay outside the public repository. Their tracked entries expose only the minimum
identity, aggregate binding, rights state, and verifier interface needed by the governing record.

Credentials are neither assets nor catalogue records. Credential values, digests, and revealing
locators never enter the repository, collection manifests, receipts, archives, or served trees.
They belong in a credential manager or runtime environment and must be rotated or revoked through
the provider when exposure is possible.

The development server resolves `/nas` only through catalogue entries explicitly marked serveable
and only for generated/public collections. It refuses private sources, external evidence without
separate public authorization, masters, credentials, staging, locks, receipts, quarantine, trash,
and unknown share paths even when the caller supplies an exact contained path. Loopback remains
the default exposure boundary; non-loopback serving requires a later reviewed authorization.

### 5. Treat deduplication, backup, and garbage collection as separate operations

Duplicate candidates are identified by both byte length and SHA-256, never by name or modification
time. No physical deduplication crosses rights, privacy, retention, or ownership boundaries. The
first implementation uses ordinary immutable copies rather than hard links or symlinks; a future
content-addressed store requires measured benefit, mutation isolation, portable restore tests, and
its own accepted decision.

Loose files, archives, snapshots, and recycle entries on the same NAS are one storage domain.
Calling any combination of them a backup is prohibited. Tracked manifests make corruption and
absence detectable; they do not recover absent bytes. External evidence, unique private sources,
and irreplaceable masters therefore retain their class-specific independent-copy requirement.

Garbage collection is reachability-based from the tracked catalogue and owner manifests, not a
raw filesystem sweep. Its first release only produces a reviewed exact plan. A later authorized
execution moves eligible collections to a dated transaction under `_control/trash/`, preserves a
tombstone and rollback window, waits the configured grace period, and only then deletes the exact
approved targets. Tracked evidence, external evidence, unique sources, and masters are never
automatic garbage-collection candidates. A legal or privacy deletion may override ordinary
retention, but it must address every known copy and preserve only a sanitized tombstone when
lawful.

### 6. Enforce the lifecycle at the repository boundary

Detached CI validates catalogue and manifest schemas, aggregate counts, digest syntax, owner
uniqueness, portable paths, legacy aliases, required rights/privacy/serve/retention fields, tracked
manifest presence, and explicit external-evidence authority. It rejects raw mount prefixes,
staging/trash locators, private collections marked serveable, and unowned durable roots represented
in fixtures.

Attached-share commands separate read-only `assets:audit` and `assets:verify` from transactional
`assets:publish`, `assets:restore`, and explicit local `assets:prune`. Garbage collection initially
has a plan-only command. Tests cover truncated or sparse manifests, undeclared extra and missing
files, concurrent publishers, source mutation, partial publication, symlinks and special files,
path traversal, case/Unicode collisions, same-name different-byte collisions, failed catalogue
updates, failed restoration, and refusal to serve private or unknown paths. Repository cleanup
must inventory both ordinary and ignored files and may not substitute an unbounded
repository-wide clean for a reviewed target list.

## Consequences

- A fresh clone can discover what durable collections exist, what owns each one, and how to verify
  or restore it without pretending every private or large byte belongs in Git.
- Small claim-bearing evidence remains self-contained in Git. External evidence gains a rigorous
  representation but remains exceptional and must cite higher-level authority.
- Cleanup becomes slower than deletion: classification, publication, restoration, and backup gates
  must complete before pruning. That cost is deliberate because local deletion is the irreversible
  edge of this workflow.
- Existing manifests retain their scopes and writers, while the catalogue adds a new consistency
  boundary. Catalogue and owner-manifest updates therefore need locking, atomic publication, and
  explicit recovery from a split NAS/Git transaction.
- Legacy roots remain less tidy, and compatibility readers remain necessary. This avoids changing
  frozen evidence meaning or copying hundreds of gigabytes merely for cosmetic uniformity.
- The NAS remains a single point of loss until the maker designates an independent storage domain.
  Irreplaceable masters and unique sources cannot be pruned in the meantime.
- Private metadata becomes less convenient to inspect from a public clone, and the development
  server can no longer act as a whole-share file browser.
- Permanent garbage collection remains maker-controlled until retention periods, grace periods,
  and an approver are selected. The initial implementation may quarantine and plan but not
  permanently delete NAS bytes.
- The threshold for “impractical for ordinary Git,” possible Git LFS use, independent backup and
  encryption/key custody, public treatment of private filenames, disposition of legacy
  `OUT-TREES-MANIFEST` bytes, and executed Windows semantics remain explicit maker decisions. Their
  absence defaults to retaining bytes and preserving the stricter tracked-evidence rule.

## Alternatives considered

**Keep the current per-workflow conventions.** Rejected because no authority then accounts for
all live share roots, ownership collisions, serve policy, restoration, or safe local deletion.

**Create one flat per-file ledger for the entire share.** Rejected because it duplicates large
owner manifests, makes unrelated collections rewrite one file, and permits conflicting writers to
claim the same paths. A federated catalogue supplies global ownership without duplicating byte
inventories.

**Treat a tracked hash as preservation.** Rejected because a digest can detect missing or changed
bytes but cannot restore them. This is the failure decision 0038 corrected.

**Track every durable byte in Git.** Rejected because rights and privacy forbid publishing some
sources, large reproducible output is inappropriate repository history, and the charter already
requires NAS-local bindings for restricted Phase 8B material. Project-owned claim evidence that
reasonably fits Git remains tracked.

**Move all existing bytes into a clean new directory tree.** Rejected because historical records,
URLs, and manifests freeze current locators. Registering legacy roots in place preserves meaning
and avoids a high-risk, low-value bulk copy.

**Use Git LFS as the universal external store.** Rejected for this decision. LFS does not solve
rights or privacy, is not yet an accepted project dependency, and does not remove the need for
retention, verification, restoration, serving, or backup policy. A later maker decision may
evaluate it for a specific project-owned collection.

**Serve any path that resolves inside the NAS.** Rejected because filesystem containment does not
provide authorization between public generated output and private material on the same share.

**Deduplicate with hard links or symlinks immediately.** Rejected because shared mutation aliases,
SMB behavior, cross-platform restoration, and rights-bound retention are not yet discharged.

**Enable automatic garbage collection immediately.** Rejected until real inventory establishes
reachability, retention and grace periods are selected, rollback is tested, and the maker approves
an exact destructive policy.
