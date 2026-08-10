# Plan — Preserve the Snow Crystal Journey source transcript

- **Phase:** Maker-directed Journey exploration, outside Phase 6 scope
- **Status:** in progress
- **Started:** 2026-08-09
- **Last touched:** 2026-08-09 by OpenAI Codex

## Goal

Create an append-only working source record for the maker's actual Snow Crystal Journey. Preserve
the maker's selected recollections word for word, then place contemporaneous maker quotations and
git-observed events beside them without blending those three evidence types. This record becomes the
source from which later story beats, scripts, visuals, and public entries may be developed; none of
those derivatives may silently rewrite the source memory.

## Done when

- `docs/journey/TRANSCRIPT.md` defines the record boundary and preserves the maker's currently
  selected origin recount exactly as received, including spelling, capitalization, punctuation,
  uncertainty, and paragraph breaks;
- the record distinguishes chat capture time, claimed event time, repository author time, commit
  time, and publication time rather than treating any one of them as the others;
- an initial repository chronology cites exact commit identities and paths for every git-backed
  observation, while interpretation and unknowns remain labeled;
- exact maker quotations already preserved in repository records are quoted only from inspected
  bytes and cite their containing revision/path;
- the Journey overview links the transcript and `docs/PROGRESS.md` describes it as an unpublished
  working source record rather than a finished narrative or validated history; and
- a skeptical read-only review compares the new verbatim blocks with the available conversation,
  checks each initial git claim against the named revision, and states what inaccessible chat,
  private motivation, and real-world events it cannot verify.

## Approach

Use three visibly separate record classes:

1. **Maker transcript** — immutable verbatim text selected by the maker in this conversation.
2. **Contemporaneous quotation** — exact maker words already preserved in a tracked repository
   record, with the inspected revision and path named.
3. **Repository observation** — facts directly visible in a commit or tree, such as a timestamp,
   subject, file addition, test record, or state transition. These are not attributed as thoughts
   or discoveries unless the maker says so.

Assign source-record IDs that cannot be mistaken for public `SCJ` episode numbers. Record date
precision and uncertainty explicitly. Corrections append a note or superseding recollection; they
do not polish the original quote in place. The initial chronology is deliberately bounded to the
origin and earliest project transition that can be supported cleanly; later history can be added in
reviewable sections rather than turning 516 commits into an unexamined generated summary.

## Steps

- [ ] Inventory the selected maker recount and existing exact maker quotations relevant to the
      origin.
- [ ] Inspect the earliest repository history and identify the smallest defensible initial
      chronology with commit/path evidence.
- [ ] Create the transcript with its append-only and evidence-separation rules.
- [ ] Link it from the Journey overview and update the current-state index.
- [ ] Perform verbatim and git-provenance audits, repair findings, and run documentation checks.

## Out of scope

- Writing public scripts, hooks, captions, shot lists, or numbered Journey episodes.
- Claiming that git reconstructs private intent, memory, uncommitted work, inaccessible chats, or
  the exact instant an idea occurred.
- Copy-editing the maker's words, including names, spelling, grammar, or uncertainty.
- Retrospectively assigning public `SCJ` identities to repository history.
- Editing the frozen education site, solver, evidence, charter, active Phase 6 plan, or handoff.
- Exhaustively narrating all 516 commits in the first transcript revision.

## Tried and rejected

- **Use the polished six-episode origin proposal as the source record.** Rejected: it is an
  editorial derivative written by an LLM, not the maker's word-for-word recollection.
- **Treat commit order as the maker's thought order.** Rejected: git proves repository states and
  recorded timestamps, not when a private realization, motivation, or uncommitted attempt occurred.
- **Correct uncertain names inside the quote.** Rejected: corrections belong in a separate note;
  changing the quoted bytes would destroy the requested transcript.
- **Number source notes as public Journey entries.** Rejected: research records and retrospective
  source material do not consume the gapless public sequence before release.

## Open questions

- Which earlier private chats or voice notes, if any, the maker may later choose to add verbatim.
- Whether future recollections should be recorded only as text or accompanied by a retained audio
  source and transcript relationship.
- How far the next git-history section should extend after the origin record is accepted.
