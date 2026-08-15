# Plan — durable untracked assets and NAS governance

- **Phase:** repository infrastructure; no charter phase is reopened
- **Status:** in progress
- **Started:** 2026-08-15
- **Last touched:** 2026-08-15 by OpenAI Codex GPT-5

## Goal

Make `research/` and `out/` disposable local staging areas while preserving every useful durable
byte outside Git on the shared NAS under one explicit, cross-host contract. Git keeps the small
authority: provenance, rights, recipes, manifests, receipts, and verification logic. The NAS keeps
large, private, expensive, or non-redistributable bytes. A file is never considered preserved
merely because it is ignored, hashed, or currently present on one workstation.

This work first inventories and classifies the existing share, then introduces the governance and
tooling, and only then performs a reviewed copy/verify/switch migration. Historical paths frozen in
evidence remain readable; no bulk rename is allowed to rewrite their meaning.

## Done when

- A tracked collection catalogue accounts for every non-system live root on the snowcrystal share
  and binds each durable collection to an owner manifest, storage class, rights/serve policy,
  retention policy, restore procedure, and share-relative locator. An attached-share audit reports
  no unclassified durable collection, conflicting owner, case-fold collision, unsafe path, or
  unexplained publication staging residue.
- The existing inventories are reconciled without pretending they have the same scope:
  `docs/nas-ledger.json`, `research/media-inventory.json`,
  `evidence/gutcheck-gg-realism/large-artifact-inventory.json`, and share-relative
  `research-cache/RESEARCH-CACHE-MANIFEST.jsonl`. Every file named by
  `evidence/OUT-TREES-MANIFEST.json` is either located in verified durable storage or receives an
  explicit unavailable/superseded disposition; hash-only history is not called preservation.
- A new accepted ADR, `AGENTS.md`, `.gitignore`, and the operational asset documentation state the
  same lifecycle and distinguish tracked evidence, external evidence, private sources,
  irreplaceable masters, generated caches, and scratch.
- One shared NAS resolver uses a project marker, one canonical environment variable, safe
  share-relative POSIX paths, and compatibility aliases that fail on conflicting configuration.
  Fixture tests cover macOS and Windows path rules, containment, symlinks, case/Unicode aliases,
  reserved names, special files, and wrong or detached shares.
- Publication is transactional: stable-source scan, same-share staging, source/staged hash match,
  absent-destination publish, final re-hash, tracked receipt/catalogue update, fresh restore check,
  and only then an explicit local prune. Tests prove interruption, collision, source mutation,
  concurrent publication, NAS loss, and Git-update failure cannot silently authorize deletion.
- The development server serves only catalogue-approved generated collections. Private research,
  credentials, quarantined material, and other share paths return a refusal in fixture tests even
  when the caller knows their exact path.
- Existing consumers stop scanning sibling worktrees or silently preferring stale local bytes.
  Writer-specific authoring flows may take an explicit local staging input, but a served index
  never relabels that input as NAS content; ordinary reads use a verified NAS collection or fail.
- A reviewed old-to-new migration manifest covers every physical move. Each moved object matches
  its pre-move byte length and SHA-256 at the final path, current consumers pass against the final
  layout, rollback remains possible until review closes, and deletion uses a separate exact target
  list. Frozen historical locators and the live Phase 6 ladder are not mutated.
- The macOS attached-share audit, fixture restore/publish/audit controls, Rule 7, typechecks, and
  exact `TMPDIR=/private/tmp npm test` pass. The closing review records what was independently
  rerun and states Windows `S:/`, full-byte, credential-rotation, and backup limits truthfully.

## Approach

Use a federated tracked catalogue rather than one duplicated per-file super-ledger. A collection
entry owns a stable asset ID and version, storage class, share-relative root, manifest identity,
aggregate counts/digest, provenance, rights/privacy/serve policy, retention, restore command, and
legacy aliases. Existing complete manifests remain their collection's byte inventory; the catalogue
binds them rather than copying tens of thousands of rows into a fourth schema.

The forward layout is collection-oriented and versioned. Control state is isolated under a
non-served `_control/` namespace for staging, locks, receipts, quarantine, and trash plans. New
durable objects publish to immutable version- or digest-bearing paths. Existing `out/` and
`research-cache/` roots are grandfathered in place when a tracked record freezes their locator;
organization does not justify rewriting evidence history or copying roughly the whole share.

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
- [ ] Reconcile the manifest scopes and locate the legacy `OUT-TREES-MANIFEST` bytes without
      touching the active Phase 6 Windows worktree, process, or unpublished artifact.
- [ ] Write and review ADR 0051, including the exact relationship to ADRs 0004/0038 and the charter
      clauses that already authorize rights-bound NAS locators. Do not weaken the tracked-evidence
      rule for a gate without an explicit same-authority amendment.
- [ ] Add the root marker, canonical resolver, collection catalogue/schema, static verifier, and
      fixture tests. Preserve `VCC_NAS_ROOT` as canonical; temporarily accept the older
      `GUTCHECK_NAS_ROOT` only when it resolves to the same share.
- [x] Add bounded read-only `assets:audit` and `assets:verify`; neither command can mutate the
      share, and explicit full verification remains one registered collection at a time.
- [ ] Add transactional `assets:publish`, `assets:restore`, and local `assets:prune`. The first
      release produces a garbage-collection plan only; it does not automatically delete NAS bytes.
- [x] Restrict `/nas` to explicitly serveable catalogue collections and refuse non-loopback
      exposure unless a later reviewed requirement authorizes it.
- [ ] Adapt gutcheck publication/index/site/workpack flows, research inventory tooling, education
      media discovery, and future gate finalization in bounded slices with exact tests after each
      changed contract. Frozen Phase 8 absolute-path identities get compatibility readers, not
      rewritten evidence.
- [ ] Generate and review the exact migration manifest. Register frozen roots in place; copy first
      for any path that truly moves; verify final readers; quarantine obsolete duplicates and
      partials; prune old paths only after the rollback and review conditions pass.
- [ ] Update `docs/PROGRESS.md` as each slice lands, run the required final checks, obtain one
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
- A big-bang copy or rename of the ledgered gutcheck tree when registration in place preserves the
  same safety with less risk.
- Automatic permanent deletion. The initial tooling may produce quarantine and garbage-collection
  plans; destructive execution remains a separately reviewed operation.

## Tried and rejected

- **Blanket rename into a cosmetically cleaner tree:** rejected because many Phase 8/9 records and
  gutcheck URLs freeze current share-relative paths. Byte preservation would not preserve their
  meaning, and copying the ledgered bulk would add risk without adding durability.
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

## Open questions

- The existing root `openalex.txt` is credential-like and reachable by the current broad `/nas`
  route. Its value was not read. Rotation/revocation and final custody require maker/provider
  authority; the code can close serving and prevent recurrence first.
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
- Windows `S:/` SMB locking, atomic rename, case/Unicode behavior, restore, and serving need an
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
