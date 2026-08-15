# Mac local untracked cleanup

**Phase:** repository maintenance; no charter phase is reopened  
**Status:** in progress  
**Started:** 2026-08-15  
**Author:** OpenAI Codex GPT-5

## Goal

Leave the primary macOS worktree free of local ignored payloads without losing private research
material or cited session scratch. Move the irreplaceable or provenance-useful material to the
mounted NAS behind verified immutable archives, delete only after verification, and record an
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
   SHA-256 digest, and member count, then rename it to its final immutable name and re-check the
   digest.
5. Only after those checks pass, remove the archived ignored copies plus regenerable dependency,
   build, and Finder-metadata paths from the primary worktree. Do not use a repository-wide
   recursive deletion target.
6. Update `docs/local-assets.md`, this plan, and `docs/PROGRESS.md` with measured results and exact
   restoration instructions. Run the Rule 7 prose scan and Git whitespace check.

## Done when

- [ ] The research archive and scratch archive exist on the NAS with recorded final paths, byte
      sizes, SHA-256 digests, member counts, and successful archive-list verification.
- [ ] The primary worktree has no ordinary untracked or ignored payloads left after deleting only
      the verified archived copies and explicitly named regenerable caches.
- [ ] The education worktree remains on `explore/education-ch1-video`, has no upstream configured,
      and has no local payload silently copied from the primary worktree.
- [ ] `docs/local-assets.md` gives an exact restore command and preserves the private/copyrighted
      boundary.
- [ ] `docs/PROGRESS.md` states the completed maintenance result and a truthful next step.
- [ ] `node scripts/lint-rule7.mjs` and `git diff --check` pass after the prose changes.

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

## Results

Pending archive creation and verification.
