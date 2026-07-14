# 0004 — Research media is not versioned; its index is

- **Date:** 2026-07-14
- **Status:** accepted
- **Charter impact:** none. This reverses a deliverable of the completed
  [phase-0-snowcrystals-site-research](../plans/phase-0-snowcrystals-site-research.md) plan
  ("archived the 10 highest-available MP4s"), not a charter commitment.

## Context

Phase 0 archived 10 lab-growth movies from SnowCrystals.com into `research/snowcrystals.com-videos/`
and committed them — 277 MB of MP4 across commits `f76e364`..`14fc6c7`.

The index written alongside them records the reason this cannot stand.
[`research/snowcrystals.com-videos.md`](../../research/snowcrystals.com-videos.md) §"Rights and
use": Libbrecht holds copyright on the site's photographs and videos; permitted use is small,
personal, and non-publishing; **internet publication is excluded without permission**. The index
states the conclusion itself — these are "research references, not assets cleared for a public
website or product."

Committed media is published media the moment a remote exists. This repository has no remote
today, which is the only reason the situation was still recoverable: `git push` would have
uploaded all 277 MB, and history would have kept it there after any later deletion. The project
intends to ship a public web product (charter §3.1), so a remote is a matter of time, and the
window to fix this cheaply was closing.

A second, smaller consideration: `git gc` on a 300 MB repository of incompressible H.264 is slow,
and every future clone pays for it.

## Decision

**`research/` media is not tracked. The `.md` index is.**

- `research/snowcrystals.com-videos/` (the 10 MP4s), the four research PDFs, and the video
  transcript are gitignored via `research/*` with a `!research/*.md` negation.
- The MP4s were purged from all 8 commits with `git filter-repo`, and the reflog and a stray
  `refs/codex/turn-diffs/checkpoints/...` ref — which pinned the blobs after the rewrite — were
  expired and collected. `.git` went from **305 MB to 720 KB**. No commit was dropped; all 8
  survive with their messages and non-media changes intact.
- The files stay on disk, untouched, at their existing paths. Nothing about how a session *uses*
  them changes.

The index makes this safe, and that is the whole argument: it carries every source URL, byte
size, frame size, duration, and SHA-256. Any model or machine can re-fetch the archive and verify
it byte-for-byte. **The provenance is the record; the bytes are a cache.**

## Consequences

- **A fresh clone does not have the videos.** It has the index and must re-download from it. This
  is the cost, and it is paid by a human once, not by the solver.
- **The archive is no longer backed up by the repo.** If the working copy is lost, it is
  re-fetchable from snowcrystals.com — but if that site goes down, the local copies are the only
  ones, and they are now outside version control. Accepted: the alternative is republishing
  someone else's copyrighted work, which is not a backup strategy.
- **Anything Phase 6 needs from the videos must be a derived, citable measurement** recorded in a
  tracked `.md`, not a frame pulled from a blob in git. This is the same discipline
  `libbrecht-parameters.md` already enforces for numbers.
- **The commit hashes changed.** Any external reference to a pre-rewrite hash is dead. Nothing had
  been pushed and no remote exists, so nothing outside this machine can hold such a reference. A
  pre-rewrite bundle was taken before the operation.

## Alternatives considered

**Leave it and add a `.gitignore` going forward.** Rejected: gitignore does not affect tracked
files. The blobs would have stayed in all 8 commits and gone up on the first push regardless —
the copyright exposure would be unchanged, and only the illusion of a fix gained.

**`git rm --cached` without rewriting history.** Rejected for the same reason. It untracks the
files from HEAD, but every prior commit still carries them, so the push still publishes 277 MB of
Libbrecht's video. This is the trap: it *looks* like the problem is solved because `git status`
goes quiet.

**Git LFS.** Rejected. LFS solves repository *size*, not *rights* — the media would still be
published to whatever remote hosts the LFS objects. It also adds a hard dependency to every clone
for an asset that is already reproducible from its index.

**Seek Libbrecht's permission and keep them tracked.** Not rejected on the merits, and worth doing
independently if the videos are ever wanted in the product. But it is a slow, uncertain,
out-of-band process, and it is not a reason to keep 277 MB of unlicensed media in git while
waiting for an answer. Ask first, commit after — never the reverse.
