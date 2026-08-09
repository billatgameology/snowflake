# Plan — Journey numbering, navigation, and reconstruction

- **Phase:** Maker-directed exploration, outside Phase 6 scope
- **Status:** in progress
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
- the distinct identifiers for artifacts, approved revisions, and publication records;
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
entries and a separate append-only sequence for destination publication records. Scope artifact and
revision identifiers beneath the Journey entry. Dates, formats, topics, platforms, languages, and
statuses remain metadata so they can change without renumbering history.

Every outward piece carries the human-facing Journey number and canonical URL or handle. The owned
Journey page supplies explicit previous, next, correction, source-entry, and related-topic links.
An append-only publication register preserves destination URLs, exact released revisions, attempts,
withdrawals, and corrections; deleted records receive a state change, never erasure or number reuse.

## Steps

- [x] Read the Journey, channel, and media specifications.
- [ ] Compare human-navigation and archive-reconstruction requirements.
- [ ] Freeze the identifier grammar and assignment rules.
- [ ] Specify the public label, canonical URL, and before/after navigation contract.
- [ ] Specify the append-only publication register and recovery procedure.
- [ ] Add representative examples and integration links.
- [ ] Review for ambiguity, reconstruction loss, unnecessary daily burden, and future migration.

## Out of scope

- Implementing a database, manifest schema, URL router, redirect, CMS, publishing adapter, or API.
- Assigning numbers to unpublished test content already in the repository.
- Posting, editing, deleting, or importing real social-media publications.
- Editing `docs/education/**`, solver code, evidence, the charter, or Phase 6 scientific records.
- Choosing public branding beyond the functional Journey label and URL pattern.

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
- **Overwrite a released artifact while keeping the same revision identifier.** Rejected: exact
  reconstruction requires immutable released revisions and explicit supersession.

## Open questions

- Whether the visible label should be “Journey 0042,” “Snow Crystal Journey 0042,” or a shorter
  `J0042` mark in constrained video frames.
- Whether publication-record numbers should ever be visible publicly or remain archive-only.
- Whether an existing external publication imported later keeps only its original timestamp or also
  receives an explicit import-order record.
