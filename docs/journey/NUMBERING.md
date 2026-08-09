# Snow Crystal Journey numbering and reconstruction

**Status:** exploratory house specification. It defines stable identities and records; it does not
implement a registry, URL resolver, archive, CMS, or publisher, and it does not assign numbers to
the repository's existing test content.

The numbering system has two jobs:

1. A person who encounters one isolated piece can locate its place in the Journey and find what
   came before, after, or corrected it.
2. The maker can reconstruct the canonical story, exact released artifacts, and destination
   publication history without trusting a platform feed, filename timestamp, or mutable URL.

One number cannot truthfully represent story order, when the underlying work happened, and when
each platform published it. This specification keeps those three chronologies separate.

## The identifiers

| Entity | Example | Visibility | Meaning |
|---|---|---|---|
| Journey entry | `SCJ-0042` | Public | The 42nd canonical intellectual or narrative step; not “day 42” |
| Artifact | `SCJ-0042-A01` | Archive and provenance | The first meaningful artifact owned by that entry |
| Approved artifact release | `SCJ-0042-A01-R02` | Archive and detailed provenance | The second immutable approved release of that artifact |
| Destination publication | `SCJ-0042-P03` | Normally archive-only | The third destination placement registered beneath that entry |
| Global history event | `SCJ-E000127` | Archive-only | One append-only registration, attempt, confirmation, edit, correction, import, or removal event |

The public presentation is **Snow Crystal Journey 0042**, **Journey 0042**, or the compact mark
**SCJ 0042**. The stable machine/search token is `SCJ-0042`.

Number formatting:

- Journey numbers have a minimum of four digits: `SCJ-0001` through `SCJ-9999`, then
  `SCJ-10000`. Four digits already allow more than 27 years at one entry per day; the sequence grows
  rather than wrapping or being renumbered.
- Artifact, release, and destination-publication suffixes have a minimum of two digits and grow when
  needed: `A01`, `R01`, and `P01`.
- Global events have a minimum of six digits and grow when needed: `SCJ-E000001`.
- IDs use uppercase ASCII and hyphens exactly as shown. A separate numeric field, not string sorting,
  determines order after a minimum width is exceeded.

The stable ID contains no date, platform, language, topic, media type, title, claim status, or
visibility. Those are metadata and may multiply or change without changing identity.

## What receives a Journey number

Number one honest story step, not one day and not every file or cross-post.

A Journey entry may be a discovery, question, failed attempt, correction, crystal, model result,
demo, research note, reflection, or later synthesis. A journal-only step receives a number even when
it produces no social derivative. A rich step with a model, diagram, video, and ten destination
posts still receives one Journey number.

Allocation rules:

1. Working drafts use temporary private names and do not consume Journey numbers.
2. The central Journey registry assigns the next number when the maker approves the canonical entry,
   before any outward distribution.
3. An assigned number is permanent. It is never reused, recycled, or silently renumbered after a
   failure, cancellation, withdrawal, deletion, or later import.
4. No-work days consume no number. Multiple real steps on one day receive consecutive numbers.
5. A late discovery or retrospective entry receives the next available number and explicit
   relationship/date metadata; it is never inserted by renumbering history.
6. If an assigned entry cannot be public, preserve its registry record and use a public tombstone
   when legal, privacy, safety, or ethical constraints permit. A gap is not an invitation to reuse
   the number. When even a tombstone would reveal protected information, public navigation skips
   to the nearest public entry without confirming the hidden entry or exposing its metadata; strict
   numeric adjacency remains available only in the private registry. A visible numeric gap may
   still be inferable and is unavoidable when permanent public IDs surround it.
7. A material change in meaning or scientific correction receives a new Journey number. A technical
   repair can remain under the existing entry with a new artifact release or history event.

`SCJ-0000` is not a prologue or miscellaneous bucket. The Journey begins at `SCJ-0001`; background
material is linked as context until it is deliberately curated into a numbered entry.

## The three chronologies

### 1. Canonical Journey sequence

The numeric part of `SCJ-0042` records the order in which the Journey tells and preserves its steps.
It is the sequence used by **Previous** and **Next** on the canonical site.

### 2. Content chronology

Record when the experiment, observation, recording, research event, or imported artifact actually
occurred. At minimum retain:

- `occurred_at`, including timezone when known;
- date/time precision, such as exact instant, day, month, bounded range, or unknown;
- `recorded_at`, when the Journey record was made; and
- `imported_at` and the original timestamp when older material is imported.

Machine timestamps use an unambiguous UTC representation while also preserving the original offset
or stated local timezone when it carries context.

A coarse date represents an interval, not an invented instant. For example, month precision means
the event occurred somewhere within that month. When two such intervals overlap, their external
order remains unknown even though the registry necessarily learned about them in some order.

A retrospective entry might be assigned `SCJ-0203` today while clearly stating that its source event
occurred two months earlier. Its number is not falsified history; it is the order in which that step
entered the canonical Journey.

### 3. Publication chronology

Every canonical-page release, social post, email issue, feed item, destination edit, and removal is
recorded through destination-publication IDs and append-only events. Retain scheduled, attempted,
remotely confirmed, edited, and removed times separately.

The global event number records deterministic registry-knowledge order. The event's `effective_at`
records when the outside action actually occurred, as an instant or bounded interval with stated
precision. Exact, non-overlapping times can rebuild part of the wall-clock publication timeline.
Events whose possible-time intervals overlap remain externally unordered. A global event number
may break a display tie in registry order, but it never pretends to prove their outside order.
Unknown or ambiguous time remains explicitly unknown; it is never guessed from filesystem or feed
order.

## What the audience sees

Every outward publication carries two independent recovery paths:

1. a visible or spoken Journey identity that survives downloading or screenshotting; and
2. searchable text and, where supported, the canonical link.

| Medium | Required audience treatment |
|---|---|
| Short or long video | Show `SCJ 0042` as a quiet persistent mark or readable opening/end mark; put “Snow Crystal Journey 0042” and the canonical locator in searchable metadata |
| Still image | Put `SCJ 0042` in a legible corner and include the full identity/link in caption and alt text |
| Carousel | Put the compact mark on every card so a detached screenshot retains its origin |
| Text post or thread | Put “Journey 0042” in the first line or durable footer and link the canonical entry where the surface permits |
| Audio | Speak “Snow Crystal Journey forty-two” once and repeat the ID/link in show notes and transcript |
| Live session | Put the Journey ID in the event title/description and in the retained recording's metadata |
| Model or interactive | Display the Journey ID near its provenance/status and expose the canonical link in the surrounding page |

Do not spend a separate outro on the number when a small persistent mark is sufficient. Do not rely
only on pixels—the piece would not be searchable—or only on a platform caption—the identity would
be lost when the media is downloaded.

Until an owned domain is selected, the URL contract is written as:

- canonical: `{owned-site}/journey/0042`
- optional permanent short resolver: `{owned-site}/j/0042`

The canonical URL never depends on a title slug. A readable slug may be an alias, but title changes
must not break the numeric URL. The Latin `SCJ-0042` identity stays unchanged in every localization.

Until that domain and resolver exist, recovery from detached media is best effort: the project name
and `SCJ-0042` are searchable, but no promise can make an unregistered locator permanent. Once the
domain is selected, every durable visual or audio artifact includes the full project name or stable
short textual URL at least once, while the compact `SCJ 0042` mark remains persistent where
appropriate. Preserve domain and redirect history in the registry and URL map, and keep old-domain
redirects for as long as practical after a migration.

Destination-publication and event numbers do not need to appear to the audience. They are recovery
and audit tools, not competing episode numbers.

## Canonical entry navigation

Every Journey page provides these distinct relationships rather than calling all of them “next”:

- **Start:** `SCJ-0001` or a later curated starting guide.
- **Previous in Journey / Next in Journey:** nearest public entries in numeric canonical sequence.
  Show a safe tombstone when one is permitted; otherwise skip a private or embargoed gap without
  confirming the entry or revealing its metadata. The visible number gap may remain inferable; the
  private registry retains strict adjacency.
- **Earlier in this topic / Later in this topic:** semantic topic or arc relationship, which may
  jump across the numeric sequence.
- **Builds on / Answers:** specific non-adjacent prerequisites or questions.
- **Current understanding:** the latest synthesis or correction that governs the topic now.
- **Corrects / Corrected by:** explicit two-way material-correction relationship.
- **Included in:** later recap, chapter, or collection entries that synthesize this step.
- **Latest:** the newest public Journey entry.

If the next entry does not exist yet, the page says so. Do not bake a guessed future “next” ID into
permanent media, and do not require old social captions to be edited each time a new entry appears;
the canonical page resolves the live navigation.

## Artifacts and approved releases

An artifact is a meaningful object, not every export. Examples include a video, crystal model,
interactive, diagram, audio note, measured dataset, or substantial text. Captions, crops, posters,
thumbnails, language renditions, codecs, and platform transcodes normally remain derivatives of the
same artifact rather than receiving new artifact numbers.

Rules:

- Every artifact has one owning Journey entry and may be referenced by later entries.
- Preserve a solver run, checkpoint, specimen, dataset, demo, or research source's native identifier
  alongside the Journey artifact ID; the editorial ID does not replace scientific provenance.
- Assign `A01`, `A02`, and so on when an artifact is registered in the canonical entry. Never reuse
  an assigned artifact suffix.
- Assign `R01` to the first approved immutable **release manifest**. A release manifest may package
  several named assets that belong together, such as a clean master, captioned master, transcript,
  subtitle file, poster, or reviewed localization. Each member records its role, locale, filename
  and archive path, media type, byte size, digest algorithm/value, and derivation. The manifest has
  its own version and digest.
- Never replace a manifest or member bytes beneath an existing release ID. Any approved member,
  membership, or release metadata changed after approval creates `R02`, `R03`, and so on, with a
  reason and supersession link; the prior manifest remains recoverable.
- A destination-only crop, captioned export, translation, or recompression may be created at publish
  time without becoming a reusable approved release member, but its exact bytes, text, language,
  transformation, and digest are captured in the destination-publication record. If it becomes an
  approved reusable asset, include it in a new immutable release manifest.
- Every localization binds to both the precise source release manifest and the immutable source
  entry snapshot event/digest from which it was translated.
- A typo, caption-timing repair, or encoding fix may increment a release. A material scientific
  correction becomes a new Journey entry and links back to the original.

Recommended filename prefixes keep loose files recoverable without making filenames authoritative.
In this example the first three files are named members of the `A01-R01` release manifest:

```text
SCJ-0042-A01-R01-master.mp4
SCJ-0042-A01-R01-captioned-en.mp4
SCJ-0042-A01-R01.en.srt
SCJ-0042-A02-R01-model.glb
```

The registry and digests remain authoritative; filenames can be copied or mistyped.

## Destination publications

A destination publication is one independently mutable placement: the canonical website page, a
YouTube upload, TikTok post, Instagram Reel, Weixin edition, Pinterest Pin, email issue, feed item,
or substantive published reply. Each receives `P01`, `P02`, and so on beneath its primary Journey
entry.

Every publication has exactly one primary Journey entry so its public recovery path is unambiguous.
If it combines several entries, either create a new synthesis entry or retain an ordered explicit
source-Journey list in addition to the primary ID.

- The same approved video on six platforms creates six publication records, not six Journey entries.
- An Instagram-to-Facebook automatic cross-post creates two records because the destinations can
  diverge or disappear independently. When that fan-out is known, preallocate one publication ID
  per intended destination and link them through the same batch or cross-post attempt event.
- A Story and Reel are separate records even if they use identical bytes.
- A language edition published as a separate destination object receives its own publication ID and
  records the exact source release and locale.
- An ordinary conversation reply need not enter the registry. A deliberate outward reply is a
  publication beneath the entry it explains; if it introduces a new result or claim, promote it to
  a new Journey entry first.
- Republishing after deletion creates a new publication ID and a `replaces` relationship because it
  creates a new remote object or URL.
- Editing the same remote object retains its publication ID and appends a new global history event.

Allocate a publication ID immediately before its first real destination attempt. Failed and
ambiguous attempts keep their ID. A retry aimed at completing the same intended remote object stays
under that publication ID; an accidentally created duplicate or deliberate replacement receives a
new one. An unexpected destination copy discovered after a fan-out receives a retrospective
publication ID with `first_observed_at`, asserted remote creation time and precision, and the causal
attempt event.

“Scheduled,” “upload accepted,” and “published” are different states. Confirmation requires a
remote object ID, URL, or equivalent independent observation. A timeout is **ambiguous**, not
automatically failed; reconcile it before retrying so the pipeline does not create duplicates.
Every attempt retains the exact payload or an immutable payload reference/digest, destination route
and account, idempotency or request key when available, request and response IDs, attempted and
response times, outcome, and the observations used to reconcile it.

If one ambiguous attempt creates more than one remote object, preserve the one causal attempt and
give every independently mutable object its own publication ID. The first object independently
confirmed from that attempt retains the preallocated ID; each later-confirmed duplicate receives a
new ID and a `duplicate of` relationship. If confirmation order itself is ambiguous, do not guess:
leave the preallocated publication as the unresolved attempt, allocate permanent new publication
records for every observed object, and append a resolution that identifies which new placement
fulfills the original intent. Never reassign an ID from one remote object to another.

## Append-only reconstruction records

The working site may maintain convenient current indexes, but no last-write-wins row is the only
history. Every state change appends a globally numbered event. Current state is derived by replaying
events, not by erasing the prior state.

Every exported record names its record-format version. Every global event stores its own digest and
the preceding global event's ID and digest, so a recovery check can detect a missing, reordered, or
changed record rather than silently accepting a broken history. The eventual implementation must
define canonical serialization before those digests become meaningful; this document does not.

### Journey-entry record

Retain:

- Journey ID, numeric sequence, title, entry kind, and stable canonical URL;
- question, movement/result, artifact summary, and next question;
- `registered_at`, `occurred_at`, precision/timezone, and canonical publication time;
- visibility: public, unlisted, private, or embargoed;
- canonical-page availability: live, tombstone, unavailable, or unknown;
- editorial status: current, partially corrected, wholly corrected, superseded, or withdrawn;
- artifact and current approved-release IDs;
- ordered relationship IDs: continues, builds on, answers, corrects, supersedes, derived from,
  imported from, and summarized by;
- topic or arc membership without encoding it into the ID;
- current claim/model status and provenance-record references; and
- maker approval, skeptical review state, and the event/digest for each immutable entry snapshot.

Every material-correction relationship identifies its exact target: the source entry snapshot
event/digest; affected claim, statement, time segment, or page region; affected artifact release and
member when applicable; affected destination-publication IDs; replacement Journey entry and
release; and whether the correction is partial or whole-entry. A partially corrected entry may
remain public and useful; it is not silently promoted to wholly superseded.

### Artifact-release record

Retain:

- artifact/release-manifest ID, parent Journey ID, role, kind, state, approval time, manifest
  format/version, and manifest digest algorithm/value;
- source entry snapshot event/digest and, for localization, exact source release-manifest ID;
- the ordered named-asset list, with each member's role, locale, filename/archive path, media type,
  byte size, digest algorithm/value, creation/export time, and derivation;
- source artifact, run, checkpoint, specimen, dataset, or prior-release IDs;
- transformation history; and
- caption, transcript, alt-text, provenance, rights, privacy, and correction-record references.

### Destination-publication record

Retain:

- publication ID and primary Journey ID;
- the ordered source Journey IDs and exact artifact-release IDs used;
- destination, surface, account identity/handle at that time, locale, audience, and manual/API route;
- exact title, body, description, tags, alt text, disclosures, and canonical link;
- archive path and digest algorithm/value for every exact uploaded file;
- maker approval, scheduled time, attempt time, confirmed remote publication time, and expiry when
  applicable;
- remote platform ID and URL;
- workflow state: planned, attempted, ambiguous, confirmed, or failed;
- availability state: live, removed, expired, unavailable, or unknown;
- editorial state: current, corrected, superseded, or withdrawn;
- replacement, correction, moderation, removal, and platform-presentation observations; and
- every related global history-event ID.

A localized destination record also retains the exact source entry snapshot event/digest, source
release-manifest and member IDs, target locale, translator or system provenance, terminology review,
and human language/scientific approval. This applies even when the localized bytes exist only in
the destination record and were never promoted to an approved reusable release member.

An edit is an event, not a mutually exclusive state. The three state dimensions are derived from
events, allowing a confirmed publication to be edited, corrected, and later removed without losing
any of those facts.

### Global history event

Each `SCJ-E000127` event retains:

- record-format version, event digest, and previous-global-event ID/digest;
- registry time and effective outside time, with precision/timezone;
- actor or system, one primary affected entity ID, and any ordered related entity IDs;
- event type and exact resulting immutable snapshot or release reference;
- prior event/revision, reason, and related correction/retry/removal IDs;
- remote response or independent observation; and
- error and ambiguity details when an operation did not resolve cleanly.

An attempt event additionally retains the immutable payload reference/digest, destination route and
account, idempotency/request key when one exists, request/response IDs, timestamps, observed remote
objects, and reconciliation evidence. Several publication records may reference the same attempt
when an automatic fan-out or ambiguous duplicate occurred.

Useful event types include entry registered, canonical published, artifact revised, publication
planned, attempt started, attempt failed, attempt ambiguous, publication confirmed, publication
edited, correction linked, removal requested, publication removed, link observed broken, and import
recorded. The prose names may later become implementation constants, but this document does not
define code or a storage schema.

## Corrections, recaps, and imports

### Material correction

Suppose `SCJ-0068` corrects a claim in `SCJ-0042`:

- `SCJ-0068` is a new first-class entry with `corrects: SCJ-0042`.
- `SCJ-0042` remains intact and gains a visible `corrected by SCJ-0068` banner/link through a new
  history event.
- Existing destination posts retain their publication IDs. If their captions can be edited, append
  an edit event that adds the correction link; otherwise publish a correction placement and link it.
- Do not disguise the change in meaning as `SCJ-0042-A01-R02`.

### Recap or chapter

A recap is a new Journey entry because it is a new act of synthesis. It records an ordered explicit
list of every source Journey ID and exact load-bearing release/snapshot used. A display may say
“Entries 0081–0099,” but the reconstruction record may not store only a range: omitted,
noncontiguous, corrected, or superseded sources would become invisible.

### Late import

If old material already belongs to an existing entry, attach it as an artifact or destination
publication of that entry. If it represents a genuinely missing story step, give it the next
available Journey number and record:

- original owner, URL/ID, and timestamp with precision;
- original bytes and digest when legitimately archived;
- acquisition/import time and legacy aliases;
- `imported from`, `occurred at`, and chronology relationships; and
- why it was recorded retrospectively.

Never renumber earlier entries to insert it.

### Withdrawal or disappearance

Record who requested removal, why, when it was attempted, and when remote absence was confirmed.
Distinguish maker withdrawal, legal/privacy removal, moderation removal, ordinary expiry, account
loss, and a merely broken link. Keep the ID and event record. Retain private bytes only when legally
and ethically permitted, and use a public tombstone when appropriate.

## Worked example

Journey 0042 produces a model, a guided video, and several publications:

```text
SCJ-0042              canonical Journey entry
├─ SCJ-0042-A01       model artifact
│  └─ ...-A01-R01     approved model release
├─ SCJ-0042-A02       guided video artifact
│  └─ ...-A02-R01     approved video release
├─ SCJ-0042-P01       canonical website publication
├─ SCJ-0042-P02       YouTube Short; confirmed
├─ SCJ-0042-P03       TikTok post; first attempt ambiguous, later confirmed
├─ SCJ-0042-P04       Instagram Reel; confirmed
└─ SCJ-0042-P05       Facebook Reel; preallocated for the known automatic fan-out
```

The ambiguous TikTok attempt and later confirmation are separate global events beneath `P03`; they
do not create a new Journey entry or silently disappear. If Facebook is a known automatic
destination, `P05` is preallocated before the shared Instagram/Facebook fan-out and linked to its
causal attempt. An unexpected copy discovered on another destination receives a retrospective
publication ID and observation event.

Later, `SCJ-0068` materially corrects `SCJ-0042`. The original remains navigable, both pages link to
each other, and destination edits or correction posts are appended to their publication histories.
Still later, recap `SCJ-0100` lists both entries explicitly among its sources and uses the corrected
understanding rather than pretending the earlier record never existed.

## Reconstruction procedure

To rebuild the Journey from preserved records:

1. Verify the append-only event register and immutable snapshot/release digests.
2. Enumerate Journey entries by their numeric sequence, retaining private registry records and safe
   public tombstones where permitted.
3. Replay entry events to derive each page's current state, relationships, and correction banner.
4. Expand each entry's artifacts and approved release manifests; verify the manifest and every
   member's archive path, byte size, and digest.
5. Expand its destination publications; replay their events to recover attempts, exact copy/files,
   remote IDs/URLs, edits, replacements, and final known state.
6. Rebuild the externally supported portion of publication time from exact or non-overlapping
   effective-time intervals. Report overlapping, unknown, and ambiguous intervals as unordered;
   use event IDs only to show registry-knowledge order, never as outside-time evidence.
7. Derive public Previous/Next navigation by nearest public entry, apply safe tombstones where
   permitted, and separately derive private numeric adjacency and topic/correction/synthesis
   navigation.
8. Reverse-check every retained remote URL/platform ID to its publication record and Journey entry,
   and every publication record to archived exact text and uploaded bytes.
9. Report missing bytes, broken URLs, unknown times, conflicting remote state, or digest mismatch as
   explicit recovery gaps. Never fill them by inference.

The owned archive, event register, and digests are the reconstruction authority. Social feeds,
platform analytics, filesystem modification times, filenames, and search results are discovery aids
only.

A recoverable archive periodically exports a self-contained bundle containing the record-format
definition, complete event register, derived current index, immutable entry snapshots, artifact
releases, exact publication text/files, URL map, and checksum manifest. Store recoverable copies
independently of the social platforms and periodically perform a read-only reconstruction using the
steps above. A backup that has never been restored is only an untested copy.

### Reconstruction boundary

This record can restore the owned Journey entry state, archived source and uploaded bytes, known
destination copy, intended relationships, and every remote lifecycle event that was actually
recorded. It cannot recreate a platform's transcoding, interface, feed position, recommendation
algorithm, unarchived analytics, ordinary unregistered replies or comments, bytes that could not
legally or ethically be retained, or an exact external order when timestamps remain ambiguous.
Those limits are reported as recovery gaps, not filled with plausible substitutes.

## Daily burden

The numbering system adds only four actions to an ordinary entry:

1. receive the next approved Journey number;
2. place `SCJ 0042` on the artifact and “Snow Crystal Journey 0042” in searchable copy;
3. link the canonical entry; and
4. register only the artifacts and destination publications that actually exist.

Artifact-release-manifest, publication, attempt, and global-event capture is pipeline-managed once
the system exists; it is not a second hand-written daily essay. The solo-maker minimum remains the
public `SCJ` identity, canonical page, approved artifact, and destination URL or confirmation.
A destination not used that day remains **N/A**.

Before that pipeline and its first successful read-only restore exist, the four-item minimum
preserves identity and navigation but supports only partial reconstruction. If anything is
published during this interim, keep one small manual publication manifest with the Journey and
release IDs, exact uploaded file and public copy, destination/account, remote ID/URL, confirmed time
and precision, and confirmation evidence. Mark uncaptured request, response, edit, or platform
details unknown. Do not claim full reconstruction for an interim publication.

## Failure modes this design prevents

- Dates, “Day 42,” missed days, timezones, multiple entries, and backfills becoming one confused ID.
- Six platform copies acquiring six competing Journey numbers.
- A title, topic, platform, format, language, or claim-status change making an ID false.
- Renumbering old entries to insert a late discovery and breaking every citation, screenshot, and
  URL.
- Reusing a withdrawn or failed number for unrelated content.
- Losing identity when media is downloaded or searchability when a mark exists only in pixels.
- Calling numeric-next, topic-next, and scientific correction the same relationship.
- Treating an accepted upload or timeout as confirmed publication and creating duplicates on retry.
- Overwriting a released file, translation, caption, or social edit without a recoverable revision.
- Recording only the master and not the exact text and bytes actually published.
- Treating a platform URL, mutable handle, feed order, or clock as permanent identity.
- Hiding noncontiguous or corrected sources behind a recap range.
- Letting several future workers allocate IDs independently without one registry authority.
