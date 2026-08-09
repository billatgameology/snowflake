# Plan — Journey numbering, navigation, and reconstruction

- **Phase:** Maker-directed exploration, outside Phase 6 scope
- **Status:** complete
- **Started:** 2026-08-09
- **Last touched:** 2026-08-09 by OpenAI Codex

## Goal

Define a stable numbering and relationship system for the Snow Crystal Journey so that a person who
encounters any single publication can find its canonical entry, see what happened before and after,
and follow deeper topic links, while the maker can reconstruct the complete content and publication
history even if platforms reorder, edit, remove, or lose posts.

## Done when

`docs/journey/NUMBERING.md` records:

- the public Journey-entry number and permanent URL pattern;
- the distinct identifiers for artifacts, approved release manifests, and publication records;
- immutable assignment, no-reuse, gap, import, draft, failed-publication, withdrawal, correction,
  and supersession rules;
- visible audience labeling and previous/next/current-context navigation;
- the append-only fields needed to rebuild both Journey order and publication order;
- how one publication can reference one entry, several entries, or a later synthesis;
- examples covering an ordinary short, multiple artifacts, cross-posts, a failed upload, a
  correction, and a recap;
- a recovery procedure that does not depend on a platform's history; and
- integration points in the Journey overview, social plan, and media/archive specification.

## Approach

Keep meaning out of the stable number. Use one simple, visible sequence for canonical Journey
entries; scope artifact, approved-release-manifest, and destination-publication suffixes beneath
each entry; and use a separate global append-only history-event sequence. Dates, formats, topics,
platforms, languages, and statuses remain metadata so they can change without renumbering history.

Every outward piece carries the human-facing Journey number and canonical URL or handle. The owned
Journey page supplies explicit previous, next, correction, source-entry, and related-topic links.
An append-only publication register preserves destination URLs, exact release manifests, attempts,
withdrawals, and corrections; deleted records receive a state change, never erasure or number reuse.

## Steps

- [x] Read the Journey, channel, and media specifications.
- [x] Compare human-navigation and archive-reconstruction requirements.
- [x] Freeze the identifier grammar and assignment rules.
- [x] Specify the public label, canonical URL, and before/after navigation contract.
- [x] Specify the append-only publication register and recovery procedure.
- [x] Add representative examples and integration links.
- [x] Review for ambiguity, reconstruction loss, unnecessary daily burden, and future migration.

## Out of scope

- Implementing a database, manifest schema, URL router, redirect, CMS, publishing adapter, or API.
- Assigning numbers to unpublished test content already in the repository.
- Posting, editing, deleting, or importing real social-media publications.
- Editing `docs/education/**`, solver code, evidence, the charter, or Phase 6 scientific records.
- Choosing public branding beyond the functional Journey label and URL pattern.

## Review record

- Two design subagents independently examined the proposal from audience-navigation and
  archive-reconstruction perspectives. Both were OpenAI Codex subagents using the author's
  inherited model and full task context, so this was neither a blind nor a model-diverse review.
  They separately exercised detached media, skipped days, multiple artifacts, late imports,
  cross-posts, ambiguous uploads, corrections, recaps, removals, and platform loss.
- A third OpenAI Codex subagent, again on the inherited model with full context, performed a
  skeptical field-by-field audit. It did not rely on the authors' verdict: it reread the Journey and
  media drafts and checked whether the proposed records could reconstruct the named cases. Its
  first pass found ambiguous release packages, mixed publication states, incomplete retry evidence,
  unsafe timestamp ordering, incomplete detached-media recovery, private-gap behavior, and a
  contradiction in correction handling. A follow-up found entry-level correction scope,
  destination-only localization binding, shared-event entities, and interim-record limits. The
  specification was revised for each finding; its final narrow re-audit reported no material issue.
- No runtime behavior was re-executed because this plan changes prose only. Author-side verification
  checked repository whitespace/conflict markers and Rule 7 after the edits; the exact results are
  recorded in the handoff response rather than treated as scientific evidence.
- The reviews did **not** implement or test a registry, canonical serializer, digest chain, resolver,
  redirect, backup, restore, CMS, or publisher. They did not test real platform APIs, accounts,
  search discoverability, moderation behavior, legal retention, or privacy decisions. Those remain
  explicit implementation and operational limits, and full reconstruction is not claimed until an
  implemented pipeline passes a read-only restore.

## Tried and rejected

- **Use the calendar date as the primary identifier.** Rejected: the Journey allows missed days,
  several entries on one day, imports, and later corrections; a date is useful metadata but not a
  stable sequence.
- **Give each platform its own Journey number.** Rejected: the audience needs one canonical place in
  the story, while platform publications are distribution instances.
- **Renumber entries to remove gaps or insert a late discovery.** Rejected: links, citations,
  screenshots, files, and human memory would all become ambiguous.
- **Encode platform, medium, language, date, topic, or claim status into the canonical entry ID.**
  Rejected: those attributes can multiply or change; stable IDs should not.
- **Overwrite a released artifact while keeping the same release identifier.** Rejected: exact
  reconstruction requires immutable release manifests and explicit supersession.

## Open questions

- Which owned domain will carry `/journey/0042`, and whether `/j/0042` will be launched as a
  permanent short resolver.
- The eventual storage format, canonical serialization, digest algorithm, and central allocation
  mechanism; these must be decided and restore-tested during implementation.
- The public wording and privacy policy for safe tombstones. When existence itself is sensitive, a
  sequential public ID can hide the metadata and reason but cannot conceal the visible number gap.
