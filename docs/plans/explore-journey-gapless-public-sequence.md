# Plan — Gapless public Journey sequence

- **Phase:** Maker-directed exploration, outside Phase 6 scope
- **Status:** in progress
- **Started:** 2026-08-09
- **Last touched:** 2026-08-09 by OpenAI Codex

## Goal

Replace the earlier private-gap policy with a public serial contract that matches how the maker will
use the Journey number inside videos. Every committed public `SCJ` number must resolve to a
discoverable canonical entry, and public numbers must remain consecutive. Draft, abandoned,
private, and embargoed work stays outside the `SCJ` namespace until its release transaction commits.

## Done when

- `docs/journey/NUMBERING.md` defines a consecutive public sequence, temporary production identity,
  serialized number reservation, canonical-publication commit point, pre-commit abort behavior,
  permanent post-commit identity, tombstones, late imports, and allocation timing for `SCJ`, `A`,
  `R`, `P`, and `E`;
- public Previous/Next and reconstruction no longer tolerate an ordinary hidden numeric gap;
- `docs/journey/MEDIA-SPEC.md` defines a lightweight watchable serial edition for every public entry
  while allowing its primary artifact and selected destinations to vary;
- scripting can begin under a working identity and `JOURNEY-NEXT` placeholder, with the permanent
  number materialized and checked only at the release gate;
- the fictional five-entry week replays the reservation/commit lifecycle and binds every source
  snapshot to the canonical commit event; and
- the Journey overview, earlier numbering plan, and `docs/PROGRESS.md` state the amended contract
  without implying that a registry or publisher already implements it.

## Approach

Use a two-phase serialized release transaction. Work begins under a non-public production key. When
the canonical page and required serial package are approved, the sole registry authority reserves
the next number, materializes it into final media and records, and attempts the canonical website
publication. The number becomes an assigned `SCJ` identity only when that canonical page is
independently confirmed public. A failed pre-commit transaction blocks later allocation until it is
retried or aborted; an abort invalidates every staged numbered byte and consumes no public number.
After commit, withdrawal keeps the numbered page or neutral tombstone and the number is never reused.

Keep the watch-in-order promise without requiring every destination every day. Each public entry has
one short watchable serial edition in the owned archive and chosen serial video home; the day's main
artifact may still be a note, still, interactive, model, correction, audio entry, or longer piece.
A standard React presentation/capture template can make the minimal edition, but it still requires
maker approval, accurate status, accessibility, and provenance.

## Steps

- [x] Inspect every current private-gap, allocation, navigation, reconstruction, withdrawal,
      late-import, and sample-event clause.
- [ ] Replace the gap policy and define the complete allocation lifecycle.
- [ ] Add the watchable serial-edition and script-placeholder production rules.
- [ ] Rebind the sample week's entry snapshots and events to canonical commit.
- [ ] Mark the earlier exploration plan's private-gap conclusion as amended.
- [ ] Perform skeptical schema and editorial audits and repair findings.
- [ ] Update `docs/PROGRESS.md` and run the documentation checks.

## Out of scope

- Implementing a registry lock, release transaction, publisher, placeholder renderer, or playlist.
- Allocating actual `SCJ` numbers or applying the rule retroactively to repository test content.
- Selecting the permanent owned domain, serial video destination, or internal production-key format.
- Guaranteeing that an external platform keeps every copy available; the owned canonical sequence
  and archive carry the continuity promise.
- Editing education, solver, evidence, charter, or active Phase 6 implementation records.

## Tried and rejected

- **Assign `SCJ` at editorial greenlight.** Rejected: an abandoned or indefinitely delayed piece can
  create a visible hole before the public serial promise begins.
- **Keep private entries inside the public sequence and skip them in navigation.** Rejected by the
  maker: a visible number baked into media promises that adjacent episodes can be found.
- **Create a second public sequence for video episodes.** Rejected: two audience-facing numbers
  would compete, and a detached video would no longer have one obvious place in the Journey.
- **Renumber after publication to close a hole.** Rejected: media, links, citations, and memory make
  a committed public identity immutable.
- **Let several ready pieces claim numbers concurrently.** Rejected: canonical confirmation order
  could diverge from the visible sequence and create a gap or collision.

## Open questions

- Which owned serial video home will guarantee the full watch-in-order playlist in addition to the
  canonical Journey website.
- Whether the standard minimal serial edition should always be 15 seconds or may use a shorter
  motion card when the primary artifact is intentionally non-video.
