# Plan — durable untracked assets and NAS governance

- **Phase:** repository infrastructure; no charter phase is reopened
- **Status:** complete — post-close correction verified; maker cleanup decision pending
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
therefore remain unregistered. At that checkpoint, the separately reviewed receipt-free legacy
restore was registered only for the four then-active legacy collections and granted no production certification or
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
That review also records the original non-blocking scalability limit: sibling-alias checks were
structurally quadratic for large flat directories. Commit `d92f39a` replaced that scan with stable
per-directory snapshots and revalidation whose work is independent of the flat-file count. The
correction checkpoint physically restored the 434-file / 666,233,360-byte diagnostic collection;
that result does not transfer to the 22,190-file / 457,429,171,007-byte generated-public collection
or Windows `S:/`.

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
([attached record](../nas-bootstrap-audit-20260815.md#first-physical-compatibility-restore)). That
fresh ignored staging was disposable and is no longer present. The historical result closes only
the bounded legacy compatibility check; it writes no durable receipt, grants no prune authority,
and does not transfer to the operationally unmeasured generated-public restore.

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
[`docs/nas-layout-migration-20260816.md`](../nas-layout-migration-20260816.md). At the original close,
the generated-output ledger bound 23,225 files / 469,030,661,007 bytes at canonical collection
paths. Six retained research selections bound 3,989 files / 3,607,599,141 bytes; unresolved research
custody bound 73,095 files / 2,166,064,630 bytes in one private manifest. The later gutcheck
correction and its separate quarantine batch are recorded below. The Phase 9 knowledge calculation
ran against the new private locator and produced bytes identical to the tracked evidence artifact.

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

### Post-close correction — mixed gutcheck remainder

- [x] Reclassify the exact 931-row source into a disjoint and exhaustive 434/128/369 partition.
- [x] Commit the reviewed one-time program and recovery-path hardening before physical apply.
- [x] Apply without deletion; publish and verify the exact receipt, program, selectors, ledger,
      catalogue, diagnostic tree, and private quarantine manifest.
- [x] Run full physical diagnostic verification, a fresh restore, the restored-tree verifier,
      aggregate audit, Phase 9 replay, focused tests, both typechecks, Rule 7, and diff check.
- [x] Obtain the distinct non-author correction review required by Rule 10; record it in
      [`nas-gutcheck-remainder-correction-20260816.md`](../reviews/nas-gutcheck-remainder-correction-20260816.md).
- [x] Run exact `TMPDIR=/private/tmp npm test` after the correction review.
- [ ] Ask the maker to approve or reject the exact redundant local-staging deletion list; never
      infer that permission from NAS placement or quarantine custody.

The closing claim above was reopened after an independent row-level review found that
`gutcheck-workspace-remainder@2026-08-15` still combined generated diagnostics, redundant Git
mirrors, and unresolved mixed/private material under one null storage class. That is physical
organization but not the single-class ownership required by ADR 0051. The correction is exact and
non-deleting: 434 files / 666,233,360 bytes move to the active generated-diagnostic collection;
128 redundant record mirrors / 174,537 bytes and 369 still-mixed files / 167,584,091 bytes move to
one dated private quarantine batch. The source remains 931 files / 833,991,988 bytes with tree
SHA-256 `63e32a8ab0e3025cbba22ba8e789e65be0c283fbc8595247b21fb65b34ea7ddd`.

The first three reviewed apply attempts published no receipt. The first found a self-lock
post-acquisition check and completed exact rollback. The second stopped before payload movement
when macOS SMB reported timestamp-incoherent metadata for the new lock-owner file. The third
completed its payload checks but refused `candidate-ledger-changed` after another session removed
the active worktree during the run; exact rollback completed. Those attempts are recorded failures,
not migration evidence. The task worktree was reconstructed, registered, and locked against
ordinary removal; commit `d92f39a` preserves the reviewed correction program and recovery-path
hardening before physical execution.

The fourth apply passed from that committed checkpoint. It moved all 931 files / 833,991,988 bytes
without deleting payload: 434 files / 666,233,360 bytes became
`gutcheck-generated-diagnostic-frames@2026-08-15`, and the remaining 497 files / 167,758,628 bytes
moved to dated private quarantine. The 1,547-byte receipt has SHA-256
`7de6caa21b04862069addc4bbd6476ba87aa8c83f42f4bd1deb697e5681ae220`; the superseded source,
transaction staging, and lock are absent. The installed ledger is 5,165,509 bytes / SHA-256
`aedde64bb1d01632d790fbf0d3a5ca7a3b3a594b90f3714033b48b1cfeccee05` and owns 22,728 files /
468,862,902,379 bytes; the installed 26-collection catalogue is 70,891 bytes / SHA-256
`b7dffe7817b1fec7cfc0ac61b77c2c20bf7cfd329bae037ffb597d60553fb31c`.

Attached verification now passes for every declared owner binding. Full physical verification and
a fresh ignored restore both matched the diagnostic collection's 434 files / 666,233,360 bytes /
tree SHA-256 `d223ded77137f5fb2bd0bdb73d40def04d2ec6df8aa3000d87ecd034774e572b`.
The Phase 9 calculation replay remained byte-identical at SHA-256
`71c3c15587f1a705dbfa6ac9dd7fcb74ef5141c7547d06214d4dd64e423efee5`. The eight-file focused
boundary passed 150/150 tests, both TypeScript projects passed, Rule 7 was clean over 1,010 files,
and `git diff --check` passed. The bounded root audit remains intentionally nonzero solely for one
unnamed custody entry (six entries: five classified, one unclassified; every unsafe-kind count
zero). The distinct Rule 10 review returned zero blockers. The final exact
`TMPDIR=/private/tmp npm test` then exited 0: 130/130 test files, 2,224 passed / 7 skipped in
398.57 seconds. Its log is `/private/tmp/npm-test-nas-remainder-correction-20260816.log`, 34,802
bytes, SHA-256 `8a9b445af3c0db040b57ef9d7eba27e90d9d13b14812cc65e3583f961866e708`.
The repository correction is complete; request approval before removing the exact redundant local
staging paths. No NAS or quarantine deletion is authorized.


## Windows write lane — archive the Windows workstation's untracked bulk (registered 2026-08-20)

Maker direction (2026-08-20, verbatim): "do not delete anything. / let's first make a windows to
nas governed tooling or windows write path first. make sure we follow existing filing directory
standard in nas. it should be gamestation/snowcrystal. / once you have that, copy everything over
to nas, lean on the safe side." Maker clarifications, same session: the Mac lane is idle (this
machine owns the catalogue/ledger until this lane lands and pushes), and scope is the untracked
bulk plus a git-bundle snapshot.

This lane discharges the standing "Windows S:/ … remains unexecuted" follow-up for the WRITE
path, under ADR 0051's existing lifecycle — no new governance. Collections are created by the
sanctioned bounded-program pattern (AGENTS.md Rule 15; reference implementation
`scripts/nas-finalize-gutcheck-remainder.mjs`), never by an unregistered forward command. Nothing
local is deleted at any step; prune remains a separately maker-approved list that this lane never
produces.

### Scope — what gets archived, lean-safe

Every untracked byte on the Windows workstation with any plausible durability claim, partitioned
into single-class collections (ADR 0051 §2 forbids mixed classes):

1. `windows-out-evidence-trees@2026-08-20` — class `external-evidence`. The eight out/ trees
   whose identities `evidence/OUT-TREES-MANIFEST.json` pins (`out/phase2b`, `out/phase4`,
   `out/phase4-visual`, `out/phase5`, `out/phase5-wp5-0a611e7`, `out/phase5-wp5-0a611e7-original`,
   `out/phase5-wp7-32eed48-superseded`, `out/phase3-visual`) plus the enumerated out/-root gate
   checkpoints and logs that PROGRESS or a gate table cites (the `plate-gate*.ckpt` family,
   `gate2b-*.ckpt`, `gate3-plate.ckpt`, and their logs). Authority: OUT-TREES-MANIFEST plus the
   Phase 2a/2b/3/4/5 gate rows in `docs/PROGRESS.md`; ADR 0038 and ADR 0051 govern.
2. `windows-phase6-ladder-workspace@2026-08-20` — class `external-evidence`. The complete
   `out/` residue of the pinned ladder worktree `G:\Code Files\snowflake-phase6-ladder`
   (`live.log`, seven launch logs, and the rows.jsonl whose bytes equal the published
   `evidence/phase6-wp2-ladder/rows.jsonl`, SHA-256 `c4fa70f7…cd14`). Authority: the WP2 ladder
   plan's execution scheduling record cites these logs ("recorded in the launch logs").
3. `windows-repo-bundle@2026-08-20` — class `generated-cache` (regenerable from GitHub; the
   recipe is `git bundle create … --all` at the recorded head). One `snowflake.bundle` file plus
   a `bundle-verify.txt` transcript of `git bundle verify`.
4. `windows-out-scratch@2026-08-20` — class `scratch`, disposition "retained pending maker
   review; no expiration". Everything else under the main checkout's `out/` (education scratch
   trees, `out/worktrees/**`, probe scripts, exploratory checkpoints and logs, review scratch)
   EXCEPT bytes already selected by collections 1–2. Selector: enumerated top-level path list
   frozen in the archival program; an unexpected top-level directory is a refusal. Amended
   after the program's non-author review (2026-08-20): regenerable link material and this
   lane's own outputs are RECORDED EXCLUSIONS in the receipt rather than quarantine payload —
   node_modules junctions (not followed), `out/restores/**` (this lane's own validation
   staging), and `out/nas-archive-*` (this lane's own outputs); hard-linked dedup files are
   recorded-and-included. Unsafe names and mid-scan mutation remain hard refusals.

### Windows SMB validation protocol — before any durable write

Executed and recorded in this section's implementation record before the archival program runs
with `--apply`:

- [ ] The four registered read commands run green from Windows against `S:/`
      (`assets:audit`, and `assets:verify --full` on one existing small active collection;
      `assets:restore` + `assets:verify-restored` on the same collection into fresh
      `out/restores/`). First Windows execution of each — that is itself lane evidence.
- [ ] `node scripts/nas-asset-bootstrap.ts --nas-root S:/` reports `already-bootstrapped`.
- [ ] A bounded semantics probe, writing ONLY under `_control/staging/windows-probe-<date>/`:
      exclusive create (`wx`) contested twice; rename onto an absent target; rename-refusal onto
      a present target; `dev`/`ino` agreement between a staging child and its final parent
      (the transaction core's same-filesystem guard); `nlink` observation on SMB; case-fold
      collision behavior (create `A.txt`, probe `a.txt`); trailing-dot/space refusal; timestamp
      coherence of a freshly created owner file (the failure that aborted the Mac's second
      apply). Every observation recorded verbatim; no probe byte under `collections/`.
- [ ] **Durability mitigation for the win32 `fsyncParentDirectory` no-op**
      (`scripts/nas-asset-lib.ts:1522-1525`): every durable rename in the archival program is
      followed by close → reopen-by-path → full re-hash, the receipt is written only after that
      verification, and the lane's Done-when requires a later, separate-process
      `assets:verify --full` pass over every new collection (a fresh SMB session, after the
      write session ended). Crash durability of SMB rename remains UNPROVEN as a hardware
      property; the lane's claim is verification-based, not fsync-based, and says so in each
      collection's `verification.limits`.

### The archival program

`scripts/nas-archive-windows-workspace.mjs` — bounded, one-time, modeled on the reference
implementation: pinned expectations, share resolution via `detectNasMount`, per-batch lock under
`_control/locks/`, source inventory via the shared stable-tree/refusal machinery, copy-in to
uniquely named `_control/staging/` (workstation→share copy, byte-verified length+SHA-256 against
the source before promotion — the one structural difference from the same-share-rename reference,
recorded here because the source filesystem is not the share), absent-target rename into
`collections/<id>/<version>/payload/`, final reopen-and-re-hash, exactly one owner manifest per
collection (tracked `docs/nas-assets/manifests/<id>/<version>.json` for the public classes; the
scratch collection may use the same public path — no private filenames exist in this scope),
receipt to `_control/receipts/migrations/windows-workspace-2026-08-20/result.json` with the
program and selector copies beside it, provisional catalogue entries committed BEFORE any durable
share write, active only after verification. Default read-only; `--apply`; `--rollback` with the
receipt-published boundary exactly as the reference.

### Done when

- [ ] Validation protocol above fully executed and recorded.
- [ ] The program's read-only pass, its non-author review (Rule 10; one engagement, blockers
      separated from hardening), and the reviewed program committed BEFORE physical apply.
- [ ] Apply completes; receipt published and byte-verified; all four collections re-verified
      `--full` from a fresh process; one collection restore + `verify-restored` round-trip green
      from Windows.
- [ ] Catalogue, owner manifests, ledger `files[]`/`moves[]` additions, and this record
      committed as one unit; exact `npm.cmd test` gates the push.
- [ ] Nothing deleted anywhere; the maker's prune approval remains a separate future decision.
