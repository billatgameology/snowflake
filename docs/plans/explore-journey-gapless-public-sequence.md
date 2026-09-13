# Plan — Gapless public Journey sequence

- **Phase:** Maker-directed exploration, outside Phase 6 scope
- **Status:** complete
- **Started:** 2026-08-09
- **Last touched:** 2026-08-09 by OpenAI Codex

## Goal

Replace the earlier private-gap policy with a public serial contract that matches how the maker will
use the Journey number inside videos. Every ordinary committed public `SCJ` release must bind a
discoverable canonical entry, and public numbers must remain consecutive. A later binding-removal
exception remains occupied and is never reused. Draft, abandoned, private, and embargoed work stays
outside the `SCJ` namespace until its release transaction commits.

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
atomically published and bound to its serial edition. An immediate independent live observation
gates external distribution and every later Journey commit. A failed pre-commit transaction blocks
later allocation until it is retried or aborted; an abort invalidates every staged numbered byte and
consumes no public number. After commit, withdrawal keeps the numbered page, unavailable card, or
minimal permitted record; the number is never reused.

Keep the watch-in-order promise without requiring every destination every day. Each public entry is
committed with one short watchable serial edition on its owned canonical page; the day's main
artifact may still be a note, still, interactive, model, correction, audio entry, or longer piece.
A standard React presentation/capture template can make the minimal edition, but it still requires
maker approval, accurate status, accessibility, and provenance.

## Steps

- [x] Inspect every current private-gap, allocation, navigation, reconstruction, withdrawal,
      late-import, and sample-event clause.
- [x] Replace the gap policy and define the complete allocation lifecycle.
- [x] Add the watchable serial-edition and script-placeholder production rules.
- [x] Rebind the sample week's entry snapshots and events to canonical commit.
- [x] Mark the earlier exploration plan's private-gap conclusion as amended.
- [x] Perform skeptical schema and editorial audits and repair findings.
- [x] Update `docs/PROGRESS.md` and run the documentation checks.

## Out of scope

- Implementing a registry lock, release transaction, publisher, placeholder renderer, or playlist.
- Allocating actual `SCJ` numbers or applying the rule retroactively to repository test content.
- Selecting the permanent owned domain, serial video destination, or internal production-key format.
- Guaranteeing continuing route, artifact, or record availability against a binding legal, privacy,
  safety, rights, or ethical removal; the allocator still never reuses the occupied number.
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
- **Let temporary IDs forecast their eventual public number.** Rejected in audit: abandonment would
  make the draft namespace behave like the public queue even if the label were technically private.
- **Use one high-water mark for both commit and live confirmation.** Rejected in audit: the interval
  after an atomic commit but before independent observation would make “latest public” ambiguous.
  `Hc` records committed occupation and `Hv` records the independently observed prefix.
- **Put commit and its later live observation in one append-only event.** Rejected in audit: an
  immutable commit event cannot acquire evidence produced after it. The sample uses distinct event
  pairs and reclaims one later planning event per day instead of renumbering source snapshots.

## Review record

- A schema reviewer, an editorial reviewer, and a house-media-policy reviewer were OpenAI Codex
  subagents using the same inherited model as the author with full conversation context; the exact
  deployment label was not exposed. These were skeptical same-model reads, not blind or model-diverse
  reviews.
- The schema reviewer re-read the current numbering specification, old-plan amendment, and all
  sample event/source bindings. It found the commit/observation event conflation, an unsupported
  `1..41` replay claim, number-shaped temporary IDs, high-water ambiguity, exposure-record and
  forced-erasure contradictions, and several stale derived event references. Each finding was
  repaired. Its final current-byte audit reported no material defect and verified the continuous
  `E000127..E000242` allocation and all five commit/observation pairs.
- The editorial reviewer re-read the overview, media specification, numbering/removal boundary, and
  sample. It found the unqualified replay claim, current R01/R02 serial ambiguity, optional-primary
  wording, and emergency-card exception. After repair, its current-byte follow-up was clean.
- The house-policy reviewer re-read the full current diff. It found that ongoing media availability
  and record retention had been promised too absolutely. The revised text distinguishes commit-time
  serial availability, permanent numeric occupation/non-reuse, and later retention only to the
  extent permitted. Its final narrow re-read was clean.
- Author verification on 2026-08-09: `git diff --check` was clean and the Rule 7 scanner reported
  `rule7: clean (494 files scanned)`. Exact `npm test` completed in 352.56 seconds: the Rule 7 scan
  and both TypeScript typechecks passed; Vitest reported 80 passed files, 4 failed files, 1,453
  passed tests, 32 failed tests, and 7 skipped tests. Thirty-one failures came from the repository's
  path-safety guards rejecting this macOS workspace's `/var` alias/junction or the Phase 5
  publication parent reached through an alias/junction. The remaining failure was the existing
  `progress-index.test.ts` assertion pinned to `Last updated: 2026-08-06`; `PROGRESS.md` already said
  `2026-08-09` at pre-implementation commit `8ea9996`. No code or test was changed to suppress
  either environment condition.
- All reviewers were read-only. They did not implement or replay a registry, inspect real artifacts
  or digests, exercise a route/removal/restore workflow, validate accessibility in rendered media,
  test a platform, assess legal requirements, or verify fictional entries 1–41. Those are limits of
  this prose design, not evidence silently implied by it.

## Open questions

- Whether a separate external destination should ever be advertised as a complete serial playlist;
  the owned Journey page is sufficient for the current contract.
