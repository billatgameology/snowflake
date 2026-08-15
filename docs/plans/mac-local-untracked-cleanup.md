# Mac local untracked cleanup

**Phase:** repository maintenance; no charter phase is reopened
**Status:** complete
**Started:** 2026-08-15
**Data move completed:** 2026-08-15
**Verification completed:** 2026-08-15
**Author:** OpenAI Codex GPT-5

## Goal

Leave the primary macOS worktree free of local ignored payloads without losing private research
material or cited session scratch. Move the irreplaceable or provenance-useful material to the
mounted NAS behind verified uniquely named archives, delete only after verification, and record an
exact restore path. Keep the Chapter 1 education branch isolated in its dedicated worktree and do
not publish it.

## Approach

1. Inventory ordinary untracked and ignored paths in the primary and education worktrees.
2. Archive the primary worktree's complete `research/` tree to a unique NAS path. Including the
   small tracked indexes makes restoration simple while Git remains authoritative for those
   duplicate tracked bytes.
3. Archive `.claude/`, `out/`, and `tmp/` as session scratch because the current `out/checks/`
   logs are cited historical diagnostics even though `out/` is disposable by contract.
4. For each archive, write a unique `.partial` file, list it successfully, record its byte size,
   SHA-256 digest, and member count, then rename it to its unique final name and re-check the
   digest.
5. Only after those checks pass, remove the archived ignored copies plus regenerable dependency,
   build, and Finder-metadata paths from the primary worktree. Do not use a repository-wide
   recursive deletion target.
6. Update `docs/local-assets.md`, this plan, and `docs/PROGRESS.md` with measured results and exact
   restoration instructions. Advance the enforced PROGRESS date pin with the live record, then run
   the exact macOS `TMPDIR=/private/tmp npm test` suite.

## Done when

- [x] The research archive and scratch archive exist on the NAS with recorded final paths, byte
      sizes, SHA-256 digests, member counts, and successful archive-list verification.
- [x] The primary worktree has no ordinary untracked or ignored payloads left after deleting only
      the verified archived copies and explicitly named regenerable caches.
- [x] The education worktree remains on `explore/education-ch1-video`, has no upstream configured,
      and has no local payload silently copied from the primary worktree.
- [x] `docs/local-assets.md` gives an exact restore command and preserves the private/copyrighted
      boundary.
- [x] `docs/PROGRESS.md` states the completed maintenance result and a truthful next step.
- [x] `node scripts/lint-rule7.mjs` and `git diff --check` pass after the prose changes.
- [x] `TMPDIR=/private/tmp npm test` passes after advancing the enforced PROGRESS date pin.

## Deliberately not done

- Do not resume, rebase, merge, or publish the Chapter 1 education work.
- Do not push the maker quotations in `docs/journey/TRANSCRIPT.md` to the public remote without
  explicit approval.
- Do not add private or copyrighted research media to Git.
- Do not change scientific evidence, the generated-output NAS ledger, or any charter contract.
- Do not claim NAS storage is an independent backup; it is the durable local storage location.

## Tried and rejected

- **Delete all ignored files immediately:** rejected because ignored research media and cited
  session logs are not all cheaply reconstructable.
- **Track the research cache in Git:** rejected because the cache contains third-party and private
  material that the repository explicitly excludes.
- **Record the research archive in `docs/nas-ledger.json`:** rejected because that ledger covers
  generated-output relocation, not the private research-cache boundary.
- **Copy local payloads into the education worktree:** rejected because it would make two drifting
  caches and obscure which copy is authoritative.
- **Use `path` as the scratch-comparison loop variable:** rejected after the first extracted check
  exposed that `path` is a special zsh command-search array. That attempt changed neither source
  nor archive and retained its temporary extraction; the rerun used `asset_rel` plus
  `/usr/bin/diff`, passed, and removed the temporary tree.
- **Treat the Mac snapshot as the complete media-inventory cache:** rejected by closing review.
  The snapshot is complete for what was local, while the larger loose NAS cache supplies the
  registered media paths that were already absent from this Mac.
- **Use the first exact suite as final evidence:** rejected. It was deliberately interrupted with
  exit 130 after review exposed the stale photo-match root and archive-scope prose; a post-repair
  exact suite is required.
- **Accept the manifest reorder produced during the diagnostic suite:** rejected. An eval-based
  lock test passed the library path as `argv[1]`, causing the library to mistake an import for its
  direct CLI. The no-op reorder was removed rather than absorbed into this cleanup.

## Results

The primary source snapshot contained 2,974 regular research files in 389 directories, totaling
1,166,728,510 logical bytes, with no symlinks. It is preserved at share-relative
`research-cache/local-worktree-archives/snowflake-main-ignored-research-20260815.tar`:

- archive bytes: 1,172,661,248;
- members: 3,363, all below `research/`, with no AppleDouble entries;
- SHA-256: `535648aa42e6748853f4ac808b837f571a24a1a630f4ce6948100a0c407cde94`;
- verification: successful final `tar -tf`, matching hash before and after final rename, and a
  fresh extraction whose `diff -qr` against the complete live source returned no difference.

The 10-file / 7-directory, 319,485-logical-byte scratch snapshot is preserved at share-relative
`out/archives/snowflake-main-local-scratch-20260815.tar`:

- archive bytes: 348,672;
- members: 17, all below `.claude/`, `out/`, or `tmp/`, with no AppleDouble entries;
- SHA-256: `99dbedbe56138a775ca7c3366974459af96296d852354f98a808145f9ea44130`;
- verification: successful final `tar -tf`, matching hash before and after final rename, and a
  fresh extraction whose three `diff -qr` comparisons returned no difference.

Only after those checks, explicit ignored-only cleans removed the private research cache,
`.claude/`, `out/`, `tmp/`, the two dependency trees, `app/dist/`, and Finder metadata. In the
primary worktree, both `git ls-files --others --exclude-standard` and
`git ls-files --others --ignored --exclude-standard` now return no paths, and `git clean -ndX`
has no deletion preview.

The education worktree is registered at
`/Users/clipper/github/snowflake-education-ch1-video` on `explore/education-ch1-video`; its
incorrect `origin/main` upstream was removed. It contains no ordinary untracked or ignored files.
Unrelated tracked education edits appeared concurrently and the education branch advanced while
this cleanup was running. Their source and content are outside this task, so the complete education
changeset was preserved rather than silently reverted or absorbed.

The truthful PROGRESS update also advances the matching assertions in
`runner/test/progress-index.test.ts`; that test-only executable change makes exact
`TMPDIR=/private/tmp npm test` mandatory. The final exact command passed after all repairs. Rule 7
and Git whitespace checks also pass.

Closing review also found that `scripts/gutcheck-photo-match.mjs` still hardcoded the now-empty
sibling checkout despite its workflow needing private media. It now accepts an explicit `--root`,
defaults honestly to this repository's `research/`, and has a no-write `--print-inputs` path pinned
by `runner/test/gutcheck-photo-match-cli.test.ts`. The research-inventory comments and current
operational docs now point to share-relative `research-cache/content/` or a staged extraction.

The diagnostic full suite then exposed a pre-existing test leak: an eval importer of
`gutcheck-evidence-lib.ts` accidentally invoked the real pinning CLI and reordered one unchanged
manifest entry. The direct-execution guard now excludes eval/print mode, subtree enumeration has a
deterministic case-folded order across filesystems, and a fake-repository negative control pins the
seam. Focused hardening and a direct CLI run both preserved the exact real-manifest SHA-256
`0022fe34da92122925221f08d2a7e47def8da32127772dd8c7d6b32c1415abea`; the diagnostic full-suite
pass is not treated as final evidence because the reorder happened during that run.

The Mac snapshot is complete for the former local tree but contains only 1,626 of the 2,477 media
paths in `research/media-inventory.json` (1,159,779,039 registered media bytes). Independent review
rehashed those 1,626 members with no mismatch and found all remaining registered paths in the loose
NAS `research-cache/content/` tree at their recorded sizes. It did not rehash every loose NAS byte.

## Review record

- **Reviewers:** two read-only OpenAI Codex GPT-5 subagents, non-authors with shared
  parent/developer context.
- **Independently re-executed:** archive stat/SHA/list/type/containment/logical-byte checks; all
  1,626 inventory-covered snapshot-member hashes; worktree ordinary/ignored/upstream checks;
  focused photo-match/progress/hardening tests; PROGRESS cap/date-pin inspection; and Rule 7/Git
  whitespace checks.
- **Limits:** the source was already deleted before review, so reviewers could not independently
  repeat the pre-deletion extracted `diff -qr`. They did not inspect the semantic content or rights
  status of every private file. The loose NAS audit checked every registered path and size, not
  every loose-file SHA-256. The author/parent ran the final exact `TMPDIR=/private/tmp npm test`;
  the read-only reviewers did not independently repeat that full suite.
- **Verdict:** approved after the requested snapshot-scope, stale-path, date-pin, restore-wording,
  photo-match-root, and manifest-import repairs. The required final exact suite passed afterward.
