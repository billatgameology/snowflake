# Plan — preserve generated worktree output and open the closeout PR

- **Phase:** Pre-Phase 7 product retention; no charter phase or gate is reopened
- **Status:** active — published and registered; checks and PR remain
- **Started:** 2026-09-04
- **Last touched:** 2026-09-04 by OpenAI Codex (GPT-5)

## Goal

Copy the generated product output that exists in the named-catalog, animation, and primary
worktrees to the governed `snowcrystal` NAS; commit the locator, owner manifest, simple execution
record, and restore command; then open a pull request to `main`.

Maker direction on 2026-09-04 supersedes the original same-machine restore-and-cleanup closeout.
Do not merge the pull request, delete local output, remove a worktree, or delete a branch. The maker
will merge and test restoration on another computer, then explicitly authorize cleanup later.

## Collection contract

- Existing dependency: `gutcheck-growth-scientific@2026-08-26` already owns
  `snowflake-animation/out/growth-scientific/`. Its later full verifier passed on 2026-09-04, so the
  84,247,312,054-byte tree is not duplicated.
- New identity: `render-worktrees-closeout@2026-09-04`.
- New source: the named-catalog worktree's `out/` tree after copy-only preparation adds:
  - `animation-worktree-closeout/`: every animation `out/` item except the existing scientific
    collection and the interrupted partial restore, plus the generated animation `app/dist/`;
  - `main-worktree-closeout/`: the primary worktree's complete `out/` tree;
  - `named-worktree-build/`: the generated named-catalog `app/dist/` tree.
- Durable locator: `collections/render-worktrees-closeout/2026-09-04/payload/` on the marked share
  resolved by `scripts/nas-root.ts`.
- Storage class: immutable `generated-cache`; these are project-generated outputs, captures, logs,
  and builds, not scientific validation evidence.
- Owner manifest: tracked at
  `docs/nas-assets/manifests/render-worktrees-closeout/2026-09-04.json` with path, byte length, and
  SHA-256 for each payload file, as required by the existing NAS catalogue format.
- Serving: denied. A different checkout restores through the catalogue command.

Dependency caches (`node_modules/`) are reproducible installation products and are not retained.
The interrupted `out/restores/gutcheck-growth-scientific-closeout-2026-09-04/` tree is an incomplete
duplicate of an already-active NAS collection, not generated project output. It remains untouched
locally for the maker-authorized cleanup pass.

## Done when

- The plan, fixed collection identity, copy command, and provisional catalogue entry are committed
  before the new NAS payload is written.
- Copy-only preparation retains each source and compares source/destination file counts and total
  bytes. The exact result is logged.
- The existing NAS transaction copier publishes the immutable payload and its normal publication
  receipt. Registration commits the exact owner manifest and activates only this collection.
- No additional local restore, adversarial fixture, independent full verifier, or scientific gate
  is run. The restore remains `documented` until the maker tests it on another computer.
- The checks covering the changed publication/catalogue boundary pass and their results are logged.
- The feature branch is pushed and a pull request to `main` is opened.
- Every source output, worktree, and local branch remains in place.

## Approach

Use the repository's existing transaction copier and catalogue format rather than add a new storage
framework. Preparation is a bounded recursive copy with a simple file-count/byte-count comparison.
The transaction's standard manifest digests are retained because they are what make the files
addressable and checkable after another machine fetches the repository; no extra verification layer
is added.

## Steps

- [x] Read the governing state and inventory all three registered worktrees.
- [x] Commit the initial plan, reconcile the animation branch, and commit the provisional publisher.
- [x] Confirm the existing scientific collection with its already-started full verifier.
- [x] Stop the subsequently started local restore; retain its partial destination untouched.
- [x] Simplify the publisher to the maker-requested copy, register, and PR scope; commit it.
- [x] Copy the remaining animation, primary-worktree, and generated-build outputs into the closeout
      source and record the simple count/byte comparison.
- [x] Publish to the NAS and register the owner manifest and catalogue result.
- [x] Run the required repository checks and record exact results.
- [ ] Push the feature branch and open a pull request to `main`.
- [ ] After the maker later confirms a restore on another computer, make a separate authorized
      cleanup pass for local output, worktrees, and branches.

## Execution record

`node scripts/nas-publish-render-worktrees-closeout.ts --copy-worktree-output` exited 0. It copied
1,436 files / 4,214,048,793 bytes without deleting a source: animation `out/` residual 969 files /
3,542,758,536 bytes, animation app build 9 / 1,641,462, primary-worktree `out/` 440 / 667,919,484,
and named-catalog app build 18 / 1,729,311. The existing scientific collection, interrupted partial
restore, and dependency caches were not copied for the reasons registered above.

`node scripts/nas-publish-render-worktrees-closeout.ts --dry-run` exited 0 with 18,932 files /
130,479,382,836 bytes selected, 47,799,742,791,680 bytes free on the marked share, and the fixed
final locator absent.

`node scripts/nas-publish-render-worktrees-closeout.ts --publish` exited 0. Source, staged, and
final trees matched 18,932 files / 130,479,382,836 bytes / tree SHA-256
`1a2f9d0f4758a1f54e73f4d11e6da31046d041417f890020c1c7f9e2175960c2`. The immutable locator is
`collections/render-worktrees-closeout/2026-09-04/payload`. Its 1,010-byte receipt is
`_control/receipts/publication/render-worktrees-closeout/2026-09-04/render-worktrees-closeout-
20260904-publish.json`, SHA-256
`f83cea7828b8183cfed13b7138a00193e94dcbf60eb15ca652a1c123a4b6ee29`; the transaction lock was
released normally.

`node scripts/nas-publish-render-worktrees-closeout.ts --register` exited 0 and activated only this
collection. The tracked 18,932-row owner manifest is 5,337,142 bytes / SHA-256
`c9489ad64f6e693f09853ab35863b158e23dc3107c618c9cdd8282789d8b8a8d` and binds the same tree.
Restore was not performed. Every source, branch, and worktree remains in place.

Focused closeout checks then passed: `npx vitest run
runner/test/render-worktrees-closeout-nas-publication.test.ts
runner/test/nas-assets-catalog.test.ts` reported 2 files / 12 tests passed in 1.65 seconds;
`npm run typecheck`, `npm run lint:rule7` (1,128 files scanned), and `git diff --check` exited 0.
The first focused run had one helper-test failure because the activation unit test read the newly
active real catalogue while exercising a provisional-to-active transition. The test now constructs
its own provisional fixture; the real catalogue/owner-manifest integrity test was green in both
runs. Under the maker's explicit simple-verification direction, no exact `npm test`, adversarial
transaction fixture, scientific gate, independent NAS verifier, or local restore was run.

## Out of scope

- Merging the pull request or changing `main` directly.
- Deleting, moving, or pruning any local or NAS content.
- Removing a worktree or branch before the maker's restoration confirmation.
- Re-running a solver, changing a rendered product, altering scientific claims, or running a
  scientific gate.
- Retaining reinstallable dependency caches.

## Tried and rejected

- **Remove clean Git worktrees immediately.** Rejected: ignored generated output is not represented
  by Git status.
- **Duplicate the existing 84.2 GB scientific collection.** Rejected: the active collection owns
  that exact tree and passed its 2026-09-04 full verifier.
- **Require a same-machine fresh restore before the PR.** Superseded by maker direction: restoration
  will be tested on another computer, and cleanup waits for that result. The interrupted local copy
  was stopped and retained.
- **Add another bespoke verification framework.** Rejected by maker direction. The existing
  publication receipt and required owner manifest are sufficient for this copy.
