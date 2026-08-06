# Plan — Social content exploration (notes only)

- **Phase:** Pre-Phase 7 exploration, maker-directed 2026-08-04. Not a charter phase gate.
- **Status:** twelve scripts written, adversarially fact-checked and editorially reviewed;
  nothing produced, nothing published
- **Started:** 2026-08-04
- **Last touched:** 2026-08-05 by Claude Opus 5 (`claude-opus-5[1m]`)

## Goal

Explore social-media content that uses the science of snow crystals as a hook and smuggles
the education in behind it — Mark Rober's method, with the maker doing voiceover. This
session's scope, set by the maker: **discuss, then write the exploratory ideas down.** No
scripts, no renders, no runs, no posting.

Branch `explore/social-content` (worktree `../snowflake-social-content`), branched from
`d328035`. Merging into `main` is a separate, later maker decision; discarding the branch is
an acceptable outcome and needs no ceremony.

## Maker decisions recorded (2026-08-04)

| Decision | Value |
|---|---|
| Purpose | Hooks that make people curious; teach everything we know, in digestible pieces |
| Audience | Young crowd |
| Style | Mark Rober — education inside viral content |
| Voice | Maker does voiceover |
| Structure | **Hooks first, look for a pattern — not a strict flow** |
| Scope | Education chapters 1–13 (the science arc) |
| Build scope | Build whatever this project needs to serve science, the education site, and social |
| This session | Markdown only, in a new folder |

## Done when

The notes exist and are specific enough to act on cold: named hooks with their payoffs and
chapter sources, the pattern behind them, and an honest list of what is undecided and what
needs sourcing. **This session is exploration; it produces no asset and makes no claim.**

## What was written

[docs/social/](../social/):

| File | Contains |
|---|---|
| `README.md` | Purpose, decisions, the four rules binding outward-facing work |
| `hook-bank.md` | 52 hooks as spoken lines, grouped by four patterns, each with payoff + chapter |
| `question-bank.md` | ~30 questions graded into four confidence tiers, from settled to nobody-knows |
| `open-questions.md` | Decided / not decided / needs sourcing / animation gaps |

## The finding

Sorting the candidate hooks produced one dominant pattern rather than a taxonomy:
**"it's backwards" is the native grammar of this subject.** Facets exist because they are
the worst at growing; a flat face is slightly concave; "too cold to snow" is about fuel not
cold; the percentage of spare vapour climbs while the actual supply collapses; the long
edges of a triangular crystal are the slow ones. That yields one repeatable format —
*"you'd think X, it's the opposite, here's why"* — which is native to short-form and, here,
is simply what the science says.

Three supporting patterns feed it: **seeing the unseeable** (the proof beat), **somebody did
something absurd** (the person beat, needing no new animation), and **the honest gap** (the
Trojan-horse payload — where the data stops and the guess starts).

## Approach and constraints

- **All 13 chapters were read in full before writing.** Every hook carries its chapter, so a
  script can be built without re-deriving the science.
- **Two claims are flagged UNSOURCED** and must not be spoken until checked (Nakaya's rabbit
  hair; Kepler's finances). The general rule: anything colourful that is not in the chapters
  gets sourced first.
- Charter §1.5 and Rule 13 govern a voiceover exactly as they govern UI labels. The corpus
  is careful about measurement vs fit vs eye guide vs convenient formula; a hook may not
  quietly upgrade one to another.
- Source figures are © Kenneth G. Libbrecht and are never redistributed.
- No agent posts anything. External contact is maker-gated.
- No edits to `core/`, `solver-cpu/`, `runner/`, `solver-gpu/`, `evidence/`, the charter, or
  ADRs.

## Open items

Listed in full in [docs/social/open-questions.md](../social/open-questions.md). The biggest:
whether the project itself is the throughline from piece one, or whether the science runs
standalone with the build arriving later as its own arc.

## Out of scope

- Chapters 14–29 (the build/epistemics arc) — a candidate second series, not this one.
- Any `LibbrechtKinetics` or Phase 6 content. Phase 6 is active and incomplete.
- Producing, publishing or scheduling anything.

## Session 2 (2026-08-05) — agent-driven production of a launch slate

Maker direction: act as social content manager, generate ideas with agents, review and
refine, write scripts, deliver end-to-end without needing input.

**Pipeline run:** four parallel concept agents (chapters 1–4, 5–8, 9–13, plus a channel
strategist) produced 42 concepts and a series architecture → editorial selection of a
12-video slate, resolving two duplications the agents produced independently → four parallel
script agents wrote 12 timecoded scripts with per-claim fact-check tables → two independent
reviewers (adversarial fact-checker vs the corpus; short-form editor on retention only) →
fixes applied.

**Two blockers found.** Both in the "starving" framing, and one originated in this project's
own hook bank rather than in agent output: the claim that branches are *not* caused by fast
growth is contradicted by ch 6 Fig. 3.5, and "branches aren't a sign of plenty" is
contradicted by ch 6's "the most elaborate crystals fall from the wettest clouds". The
repair improved the video — the shortage is local and self-inflicted, which is a second
reversal rather than a retreat. Eighteen further corrections applied; two titles killed as
actively dangerous. Full record in [docs/social/review-findings.md](../social/review-findings.md),
including the reviewers' stated limits.

**Deliverable:** [docs/social/](../social/) — series bible, 12 scripts, review findings,
reserve bench, hook bank, question bank, open questions.

## Tried and rejected

- **A first pass that jumped straight to a content catalogue, format spec and rights
  discipline** (2026-08-04, same session). Written and then wiped at the maker's direction:
  it optimised the wrong thing. The ask was hooks and curiosity, not a production plan, and
  the content had to be discussed rather than delivered. Recorded because the discarded
  files contained real work on rights (every existing `side-by-side-*` composite embeds an
  APS figure and is unpublishable) that will be needed again if assets are ever built from
  the sibling exploration branch.
- **Organising hooks into six mechanism categories** (correction / open door / character /
  reveal / confession / scale). Superseded once all thirteen chapters were read: the
  "correction" category turned out not to be one category among six but the structure of the
  entire subject, which is a much more useful finding.
