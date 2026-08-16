# Plan — durable untracked assets and NAS governance

- **Phase:** repository infrastructure; no charter phase is reopened
- **Status:** complete
- **Started:** 2026-08-15
- **Last touched:** 2026-08-16 by OpenAI Codex GPT-5

## Goal

Make `research/` and `out/` disposable local staging areas while preserving every useful durable
byte outside Git on the shared NAS under one explicit, cross-host contract. Git keeps the small
authority: provenance, rights, recipes, manifests, receipts, and verification logic. The NAS keeps
large, private, expensive, or non-redistributable bytes. A file is never considered preserved
merely because it is ignored, hashed, or currently present on one workstation.

This work first inventories and classifies the existing share, then physically organizes every
project payload under one of two project-owned top-level namespaces: durable versioned collections
under `collections/`, and temporary operational custody under `_control/`. Historical paths frozen
in evidence remain as provenance and catalogue aliases; they do not require the old physical
`out/` or `research-cache/` roots to remain on the share.

## Done when

- Apart from the root identity marker, every project-owned live share object is below
  `collections/` or `_control/`; provider recycle data and credential custody are outside the asset
  layout. No project payload remains loose under top-level `out/` or `research-cache/`.
- A tracked collection catalogue accounts for every durable collection on the snowcrystal share
  and binds each durable collection to an owner manifest, storage class, rights/serve policy,
  retention policy, restore procedure, level-qualified verification record, and share-relative
  locator. Forward-published collections additionally bind separate publication and fresh-restore
  receipts; a migrated pre-transaction registration without those records remains explicitly
  non-prune-authorizing. An attached-share audit reports
  no unclassified durable collection, conflicting owner, case-fold collision, unsafe path, or
  unexplained publication staging residue.
- The existing inventories are reconciled without pretending they have the same scope:
  `docs/nas-ledger.json`, `research/media-inventory.json`,
  `evidence/gutcheck-gg-realism/large-artifact-inventory.json`, and the historical private-cache
  manifest preserved under `_control/receipts/migrations/`. Every file named by
  `evidence/OUT-TREES-MANIFEST.json` is either located in verified durable storage or receives an
  explicit unavailable/superseded disposition; hash-only history is not called preservation.
- A new accepted ADR, `AGENTS.md`, `.gitignore`, and the operational asset documentation state the
  same lifecycle and distinguish tracked evidence, external evidence, private sources,
  irreplaceable masters, generated caches, and scratch.
- One shared NAS resolver uses a project marker, one canonical environment variable, safe
  share-relative POSIX paths, and compatibility aliases that fail on conflicting configuration.
  Fixture tests cover macOS and Windows path rules, containment, symlinks, case/Unicode aliases,
  reserved names, special files, and wrong or detached shares.
- Public-safe owner manifests use the tracked forward path
  `docs/nas-assets/manifests/<asset-id>/<version>.json`; private owner manifests use the non-served
  NAS path `collections/<asset-id>/<version>/manifest.private.jsonl`. The tracked catalogue binds
  either manifest's exact bytes, digest, format and selected aggregate. Existing complete owner
  manifests may remain authoritative while their rows are updated to canonical collection paths.
- The development server serves only catalogue-approved generated collections. Private research,
  credentials, quarantined material, and other share paths return a refusal in fixture tests even
  when the caller knows their exact path.
- Current NAS consumers covered by this maintenance pass stop scanning sibling worktrees or
  silently preferring stale local bytes. Writer-specific authoring flows may take an explicit
  local staging input, but a served index never relabels that input as NAS content; ordinary reads
  use a verified NAS collection or fail.
- A reviewed old-to-new migration map covers every physical move. Whole collection trees use an
  absent-target same-share rename after an exact inventory; interleaved selections move only their
  manifest-owned rows. Each final collection matches its owner rows, current consumers pass against
  the final layout, and the reverse mapping remains the rollback path until review closes. Unknown
  material moves to dated `_control/quarantine/unresolved/` custody with a NAS-private inventory;
  it is neither served nor treated as a durable collection until classified.
- The macOS attached-share durable-collection checks, fixture restore/publish/audit controls, Rule
  7, typechecks, and exact `TMPDIR=/private/tmp npm test` pass. A generic root audit may remain
  nonzero only for explicitly redacted non-asset custody outside the catalogue. The closing review
  records what was independently rerun and states Windows `S:/`, full-byte, credential-rotation,
  and backup limits truthfully.

## Approach

Use a federated tracked catalogue rather than one duplicated per-file super-ledger. A collection
entry owns a stable asset ID and version, storage class, share-relative root, manifest identity,
aggregate counts/digest, provenance, rights/privacy/serve policy, retention, restore command, and
legacy aliases. Existing complete manifests remain their collection's byte inventory; the catalogue
binds them rather than copying tens of thousands of rows into a fourth schema.

The share layout is collection-oriented and versioned. Durable bytes live at
`collections/<asset-id>/<version>/payload/`. A public-safe owner manifest lives in Git at
`docs/nas-assets/manifests/<asset-id>/<version>.json`; a private-name owner manifest lives beside
the collection at `collections/<asset-id>/<version>/manifest.private.jsonl`, outside every served
prefix, while Git binds only its digest and aggregate. Control state is isolated under the
non-served `_control/` namespace for staging, locks, receipts, quarantine, and trash plans.

The old top-level `out/` and `research-cache/` roots are migration inputs, not permanent aliases.
Their historical paths remain in immutable evidence, provenance fields and `legacyAliases`, while
the physical bytes move to canonical collection paths. Provisional state limits claims, serving,
retention and deletion; it does not justify leaving a known collection loose. Material that cannot
yet be assigned to one collection moves to dated quarantine with a private inventory.

The policy classes are:

1. **Tracked evidence:** project-owned, claim-bearing bytes that reasonably fit Git; permanent in
   `evidence/` and pinned by its existing manifest.
2. **External evidence:** claim-bearing bytes that are too large or cannot legally be redistributed;
   immutable NAS collection plus complete tracked binding, an explicit charter or accepted-ADR
   exception, and a governing plan that records the binding. It is never automatic
   garbage-collection material.
3. **Private source:** copyrighted, privacy-limited, or otherwise restricted input; private NAS
   collection plus sanitized tracked provenance and byte binding, never dev-server content.
4. **Irreplaceable master:** recordings, editable production sources, and other originals; NAS is
   the shared working record, but local deletion also requires an independently verified second
   storage domain once one is designated.
5. **Generated cache:** reproducible bulk output with a tracked recipe/provenance record; one
   verified NAS copy is acceptable and regeneration is the recovery strategy.
6. **Scratch:** explicitly temporary, unmanifested work with a declared disposition; absence is not
   a loss. Dependencies and builds stay in this class and are not archived by default.

Credentials are not assets or records. Their values and digests never enter the public catalogue.
They belong in a credential manager or runtime environment and outside every served collection.

## Steps

- [x] Freeze a read-only census of live roots, owner manifests, aliases, recycle/quarantine
      material, credentials, partials, and unmatched paths. Record commands, time, host, and scope;
      do not use an unbounded scan whose cost cannot be observed.
- [x] Reconcile the manifest scopes and give every missing legacy `OUT-TREES-MANIFEST` tree an
      explicit unavailable or superseded disposition without touching the active Phase 6 Windows
      worktree, process, or unpublished artifact. Recovery, if later attempted, is separate work.
- [x] Write and review ADR 0051, including the exact relationship to ADRs 0004/0038 and the charter
      clauses that already authorize rights-bound NAS locators. Do not weaken the tracked-evidence
      rule for a gate without an explicit same-authority amendment.
- [x] Add the canonical resolver, collection catalogue/schema, static verifier, and fixture tests.
      Preserve `VCC_NAS_ROOT` as canonical; temporarily accept the older
      `GUTCHECK_NAS_ROOT` only when it resolves to the same share.
- [x] Install the reviewed root marker and fixed `_control/` directories, without moving payloads,
      then run the first bounded attached-share audit.
- [x] Add bounded read-only `assets:audit` and `assets:verify`; neither command can mutate the
      share, and explicit full verification remains one registered collection at a time.
- [x] Add receipt-free legacy `assets:restore` and `assets:verify-restored` compatibility commands.
      They require one exact active version, restore only to fresh `out/restores/` staging, verify
      the exact destination set, and grant neither transaction certification nor prune authority.
- [x] Keep forward transactional publication/prune tooling unexposed until it has a separately
      justified production use. It is not a prerequisite for this operator-controlled same-share
      organization pass, and this pass adds no further speculative transaction machinery.
- [x] Restrict `/nas` to explicitly serveable catalogue collections and refuse non-loopback
      exposure unless a later reviewed requirement authorizes it.
- [x] Adapt the current gutcheck index/site, research inventory, and Phase 8/9 reader paths needed
      by the migrated layout, with exact compatibility tests. Frozen absolute-path identities use
      compatibility readers rather than rewritten evidence. Education media and future gate flows
      adopt the same contract when those consumers are activated; they are not prebuilt here.
- [x] Generate the exact migration map; inventory and move every retained `out/` and
      `research-cache/` selection to its canonical collection; quarantine unresolved material;
      update owner manifests, catalogue paths and readers; then verify that both legacy top-level
      roots are absent. Do focused checks during the batches and one exact full suite/review after
      the final metadata update.
- [x] Update `docs/PROGRESS.md` as each slice lands, run the required final checks, obtain one
      proportionate non-author closing review, and leave an exact next action if any maker-owned
      credential, backup, Windows, or legacy-artifact decision remains.

## Out of scope

- Rewriting tracked evidence, frozen Phase 8/9 records, historical digests, or scientific claims.
- Touching the live Phase 6 ladder worktree, process, artifact, or execution host.
- Treating NAS placement as an independent backup or promising recovery from NAS hardware loss.
- Publishing copyrighted/private media, private filenames that are not already public record, or
  any credential value/digest to Git.
- Enabling Git LFS or moving small project-owned evidence out of Git merely to make one policy look
  uniform.
- New publication/prune machinery, storage redesign beyond the two-root layout, or repeated full
  suite/review cycles for each moved directory.
- Automatic permanent deletion. The initial tooling may produce quarantine and garbage-collection
  plans; destructive execution remains a separately reviewed operation.

## Tried and rejected

- **Blind path replacement without a collection map:** rejected because historical Phase 8/9
  records freeze producer-era paths and mixed roots contain different rights and retention classes.
  The adopted migration moves physical bytes by manifest-owned collection while preserving old
  paths as provenance/aliases; it does not rewrite immutable historical evidence.
- **One flat per-file ledger for the whole share:** rejected because it would duplicate three
  detailed owner manifests, create conflicting refresh paths, and make unrelated collections
  rewrite one large file. A small federated catalogue keeps ownership explicit.
- **“Hash in Git” as preservation:** rejected by ADR 0038 and by the current census gap. A digest
  detects change but cannot restore an absent byte.
- **NAS presence as backup:** rejected because the share is one storage/failure domain; its ZIPs,
  loose copies, and recycle bin are not independent backups.
- **Whole-share `/nas` serving:** rejected because the current share contains private sources and a
  root-level credential-like file. Filesystem containment prevents escape from the share, not
  disclosure within it.
- **Local-wins index merge or a generic authoring override:** rejected because a checkout path is
  not a share identity. Writer-specific tools may consume explicit staging, but the served index
  reads only catalogue-approved bytes from a validated share or emits metadata-only detached output.
- **Credentials in the public asset catalogue:** rejected because even locators/digests can leak
  operational security information. Credentials use a separate secret-management path.
- **Automatic garbage collection in the first version:** rejected until manifest reachability,
  retention, grace period, and maker approval are established on real inventory.
- **Recursive `du` as the opening census:** rejected after the read-only SMB walk produced no
  observable result within the work block and was interrupted with exit 130. It changed nothing;
  manifest-driven totals plus bounded metadata scans are the auditable approach.
- **Full 469 GB reread after same-share renames:** stopped as disproportionate before it produced a
  receipt. It would have re-read previously registered bytes without changing the organization
  decision. The pass instead hashed all 710 newly registered rows and checked the exact final path,
  count and byte-size sets; existing rows retain their prior ledger digests.

## Separate follow-ups — not closure blockers

- A credential-like root object was observed during the bounded audit. Its value was not read and
  it is not an asset. Rotation/revocation and final custody require maker/provider authority;
  historical records that already name it do not make it catalogue material.
- Which independent storage domain, encryption policy, and key custody should protect future
  irreplaceable masters? Until decided, such masters may be copied to NAS but not deleted locally.
- What threshold makes project-owned evidence too large for ordinary Git, and is Git LFS ever
  allowed? Default: decide per governing plan; do not move existing tracked evidence.
- What grace period and approver govern quarantine/trash deletion? Default: no permanent deletion
  in this workstream without a reviewed exact list and maker approval.
- Are all private filenames already present in tracked source records acceptable in the public
  catalogue, or should some collections expose only opaque IDs and aggregate metadata?
- Can the missing legacy `OUT-TREES-MANIFEST` bytes be recovered from the Windows host, and if so
  are they historical evidence, generated cache, or superseded scratch?
- Windows `S:/` SMB locking, no-replace placement, effective ACLs, case/Unicode behavior, restore,
  and serving need an
  executed host check before cross-platform durability is claimed; macOS construction alone is not
  that check.

## Audit result

The bounded opening census is recorded in
[`docs/nas-inventory-audit-20260815.md`](../nas-inventory-audit-20260815.md). It keeps live
filesystem observations separate from manifest-derived totals and records the precise scope gaps:
the generated-output ledger is internally consistent but not share-wide; the media and full-cache
research manifests describe different selections and dates; private/derived/search/archive roots
lack one owner catalogue; and seven of the eight historical `OUT-TREES-MANIFEST` roots have no
observed loose NAS location. The audit changed no share bytes and grants no deletion authority.

## Implementation record

Commit `4c87061` adds the federated catalogue, strict schema, portable-path and collision checks,
catalogue serve decisions, descriptor-bound regular-file access, stable tree inventory, and atomic
JSON publication primitives. The focused command
`TMPDIR=/private/tmp npx vitest run runner/test/nas-asset-lib.test.ts runner/test/nas-assets-catalog.test.ts`,
followed by `npm run typecheck` and `npm run lint:rule7`, passed on that commit. This checkpoint does
not create the physical share marker, change a consumer, move a NAS byte, or authorize pruning.

Commits `33fc666`, `6b75502`, and `ae4aad4` add the shared marker/resolver contract, Phase 9
delegation, catalogue-only gutcheck index, bounded read-only audit/verification CLI, and
catalogue-only loopback development serving. The current focused command is:

```text
TMPDIR=/private/tmp npx vitest run runner/test/nas-asset-lib.test.ts runner/test/nas-assets-catalog.test.ts runner/test/nas-assets.test.ts runner/test/nas-mount-identity.test.ts runner/test/phase9-nas.test.ts runner/test/gutcheck-build-index-catalog.test.ts runner/test/gutcheck-hardening.test.ts runner/test/vite-nas-serving.test.ts
npm run typecheck
npm run lint:rule7
git diff --check
```

It passed after the final marker, selector, index and Vite repairs. This checkpoint still creates no
physical marker/control directory, moves no NAS payload, executes no Windows host check and grants
no publication or prune authority.

### Review record — resolver, index, serving and read-only tools

- **Reviewers/context:** three non-author OpenAI Codex GPT-5-family subagents, each sharing the
  coordinator's repository/development context. The mount/index reviewer also produced the bounded
  transactional design but did not author this checkpoint.
- **Independently re-executed:** mount/index and Phase 9 fixture suites plus direct symlink/hard-link
  exploit reproductions; Vite fixture suites plus live dev/preview persistent-link refusals; CLI,
  catalogue and path-library fixtures plus direct bounded-read, selector, empty-root, single-file
  and detached-overlay reproductions; relevant typechecks and diff checks.
- **Limits:** no reviewer ran exact `TMPDIR=/private/tmp npm test`, Windows `S:/`, a physical marked
  NAS audit, a real collection-wide payload hash, SMB contention/rename, credential handling,
  publication, restore or prune. Full read-only verification checks registered rows but does not
  discover undeclared extras; transactional final/restore verification must enumerate exact trees.

### Transaction and bootstrap checkpoint

The unexposed transaction fixture core now binds source, stage, final, lock-owner and receipt
identities; inventories exact file sets; refuses overlaps and replacement; restores through an
atomically reserved absent destination; and emits computation-only prune plans. The bootstrap
entry point requires an explicit absolute root, verifies the registered private-manifest witness,
refuses pre-marker control state, creates only the fixed control skeleton, and writes the marker
last. The physical command
`node scripts/nas-asset-bootstrap.ts --nas-root /Volumes/snowcrystal` ran in default dry-run mode
and returned `would-bootstrap`; a subsequent read-only check found both marker and `_control`
absent. No share byte changed.

The non-author review is recorded in
[`docs/reviews/nas-asset-transaction-bootstrap-20260815.md`](../reviews/nas-asset-transaction-bootstrap-20260815.md).
It accepted the fixture behavior but reproduced a same-credential ancestor-swap escape in the
portable JSON writer. Bootstrap, publish, prune, and the transaction core's receipt-writing restore
therefore remain unregistered. The separately reviewed receipt-free legacy restore is registered
only for the four current active legacy collections and grants no production certification or
deletion authority. The next forward implementation slice may expose only a workflow whose threat
boundary, crash durability, forward/legacy dispatch, and receipt placement are explicitly reviewed.

### Legacy restore compatibility checkpoint

`scripts/nas-asset-selection-lib.ts`, `scripts/nas-asset-legacy-restore-lib.ts`, and
`scripts/nas-asset-restore.ts` bind an exact catalogue version and owner-manifest selection, require
the marked share, reserve a fresh destination below `out/restores/`, copy through bounded file
descriptors, and independently re-inventory the destination's exact files, lengths, and hashes.
The command emits path-free reports and says explicitly that it writes no durable receipt and grants
no prune authority. Its non-author review is recorded in
[`docs/reviews/nas-asset-legacy-restore-20260815.md`](../reviews/nas-asset-legacy-restore-20260815.md).
That review also records a non-blocking scalability limit: sibling-alias checks are structurally
quadratic for large flat directories. The large gut-check restore remains operationally unmeasured
and must not be described as practical until it is optimized or timed on the NAS.

### Physical bootstrap and first attached audit

After ADR acceptance and the focused boundary checks listed above passed, the reviewed bootstrap
ran against `/Volumes/snowcrystal`. Default dry-run returned `would-bootstrap`; `--apply` created
the fixed `_control/` skeleton and `.snowflake-nas.json`; a second default run returned
`already-bootstrapped`. The command validated the identity roots and fully re-hashed the
catalogue-bound private-manifest witness before and after marker publication. It did not enumerate
unknown root names or open, move, replace, or delete any collection payload. Current marker,
control, verification and audit facts are recorded in
[`docs/nas-bootstrap-audit-20260815.md`](../nas-bootstrap-audit-20260815.md).

`npm run assets:verify -- --nas-root /Volumes/snowcrystal` then exited 0: all declared owner
manifests and machine-supported selector aggregates verified, with payload hashing explicitly not
run. After the first governed collection move, `npm run assets:audit -- --nas-root /Volumes/snowcrystal`
intentionally exited 1: eight bounded top-level entries were observed, seven were classified, and one unnamed ordinary entry remained
unclassified. That is the maker/provider-owned credential-custody follow-up recorded above; it was
not read, named, hashed, moved, or catalogued. The generic root audit therefore remains
intentionally nonzero, but it found no unclassified durable collection and does not keep this
asset-layout plan open.

Process deviation: the additive physical bootstrap ran before this implementation unit was
committed, although the code bytes and focused controls had completed review. That missed the
planned clean-commit sequencing precondition. The post-apply checks found no payload mutation, but
the deviation is recorded rather than treated as precedent.

After the reviewed implementation landed as commit `b9b7b40`, the small Phase 3 compatibility
restore and destination verifier both exited 0: 10 files / 984,164 bytes, tree SHA-256
`73a9f672d9e803854ec8c82a2a0e0192f448989984ce30772e768b20644d3faf`
([attached record](../nas-bootstrap-audit-20260815.md#first-physical-compatibility-restore)). The
fresh ignored staging tree remains available for inspection. This closes only the bounded legacy
compatibility check; it writes no durable receipt, grants no prune authority, and does not transfer
to the operationally unmeasured large gut-check restore.

### First governed collection migration

The fully classified Phase 3 visual collection moved from the legacy `out/phase3-visual` mirror to
`collections/earlier-phase3-visual/2026-08-01/payload`. The move reused the existing ledger,
catalogue, exact inventory, restore and quarantine boundaries; it added no publication framework.
Source, target, quarantine and fresh restored staging each matched 10 files / 984,164 bytes and tree
SHA-256 `73a9f672d9e803854ec8c82a2a0e0192f448989984ce30772e768b20644d3faf`.
The old exact copy remains quarantined, not deleted. Historical payload bytes and embedded producer
paths were not rewritten. This proves the bounded layout move, not independent backup, Windows/SMB
behavior, or readiness to migrate mixed and provisional roots.

### Complete two-root organization

The maker then directed the physical organization to completion without adding more speculative
publication machinery. The 2026-08-16 pass moved every retained payload from the legacy top-level
`out/` and `research-cache/` roots into versioned `collections/**` payloads, generated the six
required private owner manifests, moved unresolved research into dated `_control/quarantine/**`
custody, and removed both now-empty legacy roots. No payload was permanently deleted. Current
readers translate producer-era logical paths; frozen evidence and source records remain unchanged.

The exact collection, manifest, quarantine and migration-receipt aggregates are recorded in
[`docs/nas-layout-migration-20260816.md`](../nas-layout-migration-20260816.md). The generated-output
ledger now binds 23,225 files / 469,030,661,007 bytes at canonical collection paths. Six retained
research selections bind 3,989 files / 3,607,599,141 bytes; final unresolved research custody binds
73,095 files / 2,166,064,630 bytes in a private manifest. The Phase 9 knowledge calculation ran
against the new private locator and produced bytes identical to the tracked evidence artifact.

The attached read-only verifier accepts every declared owner-manifest selection. The bounded audit
sees six top-level entries, classifies five, and continues to refuse the one unnamed credential-
custody item without exposing it. That item, Windows execution, independent backup, and any later
quarantine disposal remain maker-owned follow-up decisions; none prevents the completed physical
layout from being the standard for future retained files.

### Final repository verification

The focused migration boundary passed 9 files / 123 tests, both TypeScript projects, Rule 7 over
1,007 files, and `git diff --check`. The first exact suite then correctly found two stale repository
pins: the current PROGRESS date and an edit to a hash-frozen Phase 9 source record. The source record
was restored byte-for-byte and the current-date regression was updated; the two focused tests then
passed 25/25.

The final exact `TMPDIR=/private/tmp npm test` exited 0: 129/129 test files, 2,210 passed and seven
skipped in 401.14 seconds. The named run artifact was
`/private/tmp/npm-test-nas-layout-20260816-final.log`, 33,731 bytes, SHA-256
`0a90511eaedbe9b2514d8767d22d5acdafd93469198bc6300762d77d9ce30bd2` at record time. This is
repository verification, not a Windows, backup, credential-custody, or whole-payload audit.

### Closing review — complete two-root organization

- **Verdict/binding:** PASS with zero blockers on staged tree
  `5a00991eac12baac7532d4516323b5ac0d77eb65`.
- **Reviewer/context:** non-author OpenAI Codex GPT-5-family subagent sharing the coordinator's
  repository and development context.
- **Independently re-executed:** index/tree binding, Rule 7, `git diff --check`, the nine-file
  migration compatibility suite, read-only `assets:verify` and aggregate-only `assets:audit`, known
  legacy-root absence, live collection and private-manifest bindings, quarantine aggregate,
  generated-ledger aggregate/digest and one-owner partition, migration receipt pins, all registered
  media-overlay row bindings, the physical Phase 8 v3 verifier, and byte-identical Phase 9 knowledge
  calculation from canonical paths.
- **Limits:** the reviewer did not run exact full `npm test`, Windows `S:/`, SMB ACL checks,
  independent-backup recovery, credential handling, a full payload rehash, or any NAS write. The
  unnamed custody item remains a maker/provider decision.

The pre-organization implementation boundary and its exact repository suite are recorded in
[`docs/reviews/nas-asset-governance-validation-20260815.md`](../reviews/nas-asset-governance-validation-20260815.md).
That exact suite was coordinator-run after the reviewed code and catalogue repairs; the non-author
reviewer independently ran the focused legacy-restore boundary but did not rerun the full suite.
