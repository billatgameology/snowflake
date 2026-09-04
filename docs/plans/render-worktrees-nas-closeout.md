# Plan — preserve generated worktree output and open the closeout PR

- **Phase:** Pre-Phase 7 product retention; no charter phase or gate is reopened
- **Status:** active — publication preparation
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
- [ ] Simplify the publisher to the maker-requested copy, register, and PR scope; commit it.
- [ ] Copy the remaining animation, primary-worktree, and generated-build outputs into the closeout
      source and record the simple count/byte comparison.
- [ ] Publish to the NAS and register the owner manifest and catalogue result.
- [ ] Run the required repository checks and record exact results.
- [ ] Push the feature branch and open a pull request to `main`.
- [ ] After the maker later confirms a restore on another computer, make a separate authorized
      cleanup pass for local output, worktrees, and branches.

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
