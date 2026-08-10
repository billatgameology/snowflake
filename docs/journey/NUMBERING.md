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

Number one committed public story step, not one day and not every file or cross-post.

A Journey entry may be a discovery, question, failed attempt, correction, crystal, model result,
demo, research note, reflection, or later synthesis. Its primary artifact may be a journal note,
still, audio recording, interactive, or other non-video form, but every committed entry is released
with one lightweight watchable serial edition on its canonical page. A rich step with a model,
diagram, video, and ten destination posts still receives one Journey number.

The public sequence uses two high-water marks. `Hc` is the highest committed Journey number; `Hv` is
the highest commit whose canonical route and serial edition were subsequently observed live by the
independent release check. Every integer from 1 through `Hc` is permanently occupied and ordinarily
has a registry record and canonical-route binding; a forced erasure can reduce it only to the
minimum unavailable position retention permits. `Hv` advances only when live-observation evidence
exists. The allocator maintains `0 <= Hv <= Hc <= Hv + 1`, and it permits a new reservation only when
`Hc = Hv`. Thus the ordinary stable state has `Hc = Hv`; the only allowed mismatch is one unresolved
latest commit, never an intentionally skipped or abandoned interior integer. Continuing availability
and evidence retention after a later forced removal are separate statuses, not something either
high-water mark can guarantee.

Allocation rules:

1. Working concepts, scripts, and builds use a private temporary identity such as
   `SCJ-TMP-<ULID>` and the pre-release media placeholder `JOURNEY-NEXT`. Temporary artifact candidates
   may use `...-A01-RC01`; they are nonpublic, noncitable, do not resolve through `/journey/NNNN`,
   and consume no final `SCJ`, `A`, or `R` suffix.
2. An entry becomes release-eligible only when its canonical page, primary artifact, watchable
   serial edition, source/status, accessibility, rights/privacy, skeptical review when applicable,
   and maker approval are ready under the temporary production record.
3. When `Hc = Hv`, the sole registry authority opens one exclusive release transaction and reserves
   candidate value `Hc + 1` without advancing either mark. No second Journey reservation runs
   concurrently.
4. Inside that transaction, the pipeline freezes the temporary-to-final `SCJ`/`A`/`R`/`P01`
   mapping, renders or speaks the candidate number into final staged media, removes every temporary
   token, freezes member bytes and digests, and completes final preflight. The candidate mark is not
   yet an assigned public Journey identity, and no externally reachable preview or destination
   attempt is permitted.
5. One atomic canonical-release commit verifies the reservation, assigns the final Journey and
   included artifact/release identities, writes the immutable entry snapshot, creates canonical
   publication `P01`, binds and publishes the assigned numeric route, appends the commit event, and
   advances `Hc`. A separate immediate event independently observes the canonical route and serial
   edition public, then advances `Hv`. External distribution and the next Journey reservation remain
   blocked until `Hc = Hv` again.
6. A failed or ambiguous preflight before canonical commit holds the reservation and blocks later
   Journey allocation. Reconcile or retry it; never skip forward. A reservation timeout fails closed:
   it cannot automatically free the candidate while numbered staged bytes may still exist. A
   pre-commit abort revokes staging, proves candidate-numbered bytes did not cross the controlled
   production boundary, records the temporary failure, and leaves both high-water marks unchanged.
   The same integer remains next because it was never a public assignment. If candidate media
   escaped, do not reuse the value for unrelated content. Complete the normal packet for the same
   work or, when content safety prevents that, prepare a reviewed emergency packet whose neutral
   15–59 second unavailable card serves as both primary artifact and serial edition beside a safe
   canonical shell. If even that would be unsafe or forbidden, record and hold the referential
   conflict; do not free the candidate or skip forward.
7. After commit, never reuse or silently renumber the identity. Retain its minimal non-sensitive
   registry history, route, artifact/release identity, manifest, event, and media records only to the
   extent law, privacy, safety, rights, and ethics permit. Withdrawal or removal keeps a neutral
   numbered shell, an unavailable serial card, and Previous/Next navigation whenever permitted. If
   the immediate independent live observation fails after commit,
   leave `Hc = Hv + 1`, block every external destination and later Journey commit, and repair the
   route; do not roll back `Hc`. Successful observation appends its event and advances `Hv`. A binding
   requirement that forbids even a number-only shell or unavailable card is recorded as an
   exceptional forced-availability failure, not permission to reuse the identity.
8. Private, embargoed, and abandoned work remains temporary and has no place in the public numeric
   sequence. Reserve only in the short final release window, not for a future embargo date.
9. No-work days consume no number. Multiple public steps on one day commit consecutive numbers. A
   late discovery or retrospective entry receives `Hc + 1` through the ordinary commit/observation
   gate and preserves its original occurrence/import metadata; history is never renumbered to insert
   it.
10. A material change in meaning or scientific correction receives the next committed Journey
    number and its own serial edition. A technical repair can remain under the existing entry with a
    new artifact release or history event.

`SCJ-0000` is not a prologue or miscellaneous bucket. The Journey begins at `SCJ-0001`; background
material is linked as context until it is deliberately curated into a numbered entry.

## The three chronologies

### 1. Canonical Journey sequence

The numeric part of `SCJ-0042` records the order in which the Journey tells and preserves its steps.
It is the sequence used by **Previous** and **Next** on the canonical site. Only atomic public
commits advance it; temporary production records and aborted reservations have no position in this
sequence.

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

The visible number is a serial promise at release. Once `SCJ 0042` is distributed beyond its
canonical release, `/journey/0042` has passed independent observation, every earlier positive
integer through 41 has its own release-observation record, and the owned Journey page contains the
watchable edition for 0042. An external social feed may contain only selected entries; only a
surface advertised as the complete Journey playlist must carry the independently observed public
sequence through `Hv`.
Later removal may replace an entry with a neutral unavailable position, or make even that position
unavailable under a binding exception, but it never transfers the number to different content.

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
- **Previous in Journey / Next in Journey:** immediately adjacent committed integers. Each uses its
  assigned route binding and resolves to a live entry or neutral post-publication status shell when
  permitted; a forced-availability exception remains an occupied but unavailable position. Private
  and embargoed production work has no number and no position between them.
- **Earlier in this topic / Later in this topic:** semantic topic or arc relationship, which may
  jump across the numeric sequence.
- **Builds on / Answers:** specific non-adjacent prerequisites or questions.
- **Current understanding:** the latest synthesis or correction that governs the topic now.
- **Corrects / Corrected by:** explicit two-way material-correction relationship.
- **Included in:** later recap, chapter, or collection entries that synthesize this step.
- **Latest:** the newest independently observed Journey entry at `Hv`; an unresolved `Hc` is not
  promoted through discovery navigation.

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
- Before canonical commit, draft artifacts and releases use temporary `A` and `RC` labels beneath
  the production identity; they consume no final suffix. The release transaction freezes the
  source-before-derived graph and contiguous final mapping. At commit, included artifacts receive
  `A01`, `A02`, and so on in registry order. A later artifact receives the next suffix only when its
  record and first release are ready; an assigned artifact suffix is never reused.
- Assign `R01` to the first approved immutable **release manifest** at commit. Aborted draft release
  candidates consume no `R` suffix. A release manifest may package
  several named assets that belong together, such as a clean master, captioned master, transcript,
  subtitle file, poster, or reviewed localization. Each member records its role, locale, filename
  and archive path, media type, byte size, digest algorithm/value, and derivation. The manifest has
  its own version and digest.
- Never replace a retained manifest or member bytes beneath an existing release ID. Any approved
  member, membership, or release metadata changed after approval creates `R02`, `R03`, and so on,
  with a reason and supersession link. Retain the prior identity, manifest, and member bytes to the
  extent permitted by the later-removal rule; otherwise preserve only the allowed unavailable or
  removal record.
- A destination-only crop, captioned export, translation, or recompression may be created at publish
  time without becoming a reusable approved release member, but its exact bytes, text, language,
  transformation, and digest are captured in the destination-publication record. If it becomes an
  approved reusable asset, include it in a new immutable release manifest.
- A React-coded web experience keeps its own artifact identity. A faithful technical capture or
  passive preview that adds no substantive claim, narration, or independent editorial structure may
  remain a named derivative in that artifact's release, or a destination-only derivative when used
  once. A separately scripted or narrated demonstration, frame-controlled animation, or hybrid
  video that adds independent editorial structure or its own release/correction lifecycle receives
  a new `A` suffix. The distinction follows independent editorial meaning and reuse, not duration
  or file format; no separate capture-ID namespace is needed.
- A capture packaged inside the coded experience's own release binds to the exact source-member
  digests and recipe in that manifest. A separate capture artifact, later release, or
  destination-only derivative records `derived from` against the exact source web release/member
  digests and source entry snapshot. Its release or destination record retains the source
  build/bundle, frozen state and inputs, viewport, browser or renderer and capture versions,
  interaction/timeline/camera recipe, output settings, and member digests. A vertical and horizontal
  rendition may share one video artifact when their sequence and meaning remain the same.
- A mutable URL, branch name, or “latest” deployment is not a source identity. The coded-experience
  release retains an immutable source snapshot or repository revision, any applicable dirty-state
  archive, dependency lock/build configuration, built bundle, and every load-bearing data, font,
  media asset, or archived external response. If a later Journey entry newly interprets an older
  experience, its new video belongs to the later entry and references the older exact release; the
  older artifact is not moved or reused.
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

`P01` is reserved for the owned canonical Journey page and finalizes inside the atomic Journey
commit. Its independent live observation is the gate for external distribution and the next Journey
reservation. External destinations begin at `P02` and cannot be attempted while that canonical
commit or observation remains unresolved.

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

For `P02` and later, allocate a publication ID immediately before its first real destination
attempt. Failed and
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

The fields below define the complete record at creation. Later retention remains subject to the
withdrawal/forced-erasure rule: every lawful omission is named, and absent data is never inferred.

Every exported record names its record-format version. Every global event stores its own digest and
the preceding global event's ID and digest, so a recovery check can detect a missing, reordered, or
changed record rather than silently accepting a broken history. The eventual implementation must
define canonical serialization before those digests become meaningful; this document does not.

### Temporary production and release-transaction record

Pre-commit work remains private but reconstructable. Retain:

- temporary production identity, working title, question, occurred/recorded times, and workflow
  state such as concept, scripting, production, review, release-ready, reserved, committed, or
  aborted;
- temporary artifact and release-candidate identities, scripts, builds, source bindings, review
  state, and the proposed artifact order;
- exclusive reservation token, candidate numeric value, prior `Hc` and `Hv`, allocator/lock
  identity, opened time, deadline, and every renewal or manual intervention;
- frozen temporary-to-final `SCJ`/`A`/`R`/`P01` mapping, staged page/media/member digests, placeholder
  scan, accessibility/provenance/rights approvals, and final-preflight event;
- either non-exposure evidence showing that no candidate-numbered bytes or route were externally
  reachable before commit, or the exposure evidence and normal/emergency resolution bound to the
  same candidate; and
- atomic commit event and final identity mapping, or abort reason, staging revocation, non-exposure
  verification, and any candidate-exposure resolution.

Temporary records never appear in public Previous/Next or the canonical `1..Hc` enumeration. They
remain in the private event archive after commit or abort to the extent retention is permitted;
forced omissions are recorded when doing so is allowed.

### Journey-entry record

Retain:

- Journey ID, numeric sequence, title, entry kind, and stable canonical URL;
- question, movement/result, artifact summary, and next question;
- `registered_at` at canonical commit, `occurred_at`, precision/timezone, canonical publication
  time, release-transaction ID, and commit event/digest;
- public canonical visibility and separately scoped detail/artifact restrictions; private,
  embargoed, and unlisted pre-publication work belongs to the temporary production record instead;
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
- transformation history and, for a code-derived image or video, the exact source release/member
  digests, route/component, initial state, props/parameters, archived inputs, interaction or
  animation timeline, viewport/environment, simulated/playback timing, frame-sampling and encoder
  settings, audio synchronization, output digest, known nondeterminism, and rerender-test result;
  and
- caption, transcript, alt-text, provenance, rights, privacy, and correction-record references.

### Destination-publication record

Retain:

- publication ID and primary Journey ID;
- the ordered source Journey IDs and exact artifact-release IDs used;
- destination, surface, account identity/handle at that time, locale, audience, and manual/API route;
- exact title, body, description, tags, alt text, disclosures, and canonical link;
- archive path and digest algorithm/value for every exact uploaded file;
- for a destination-only code-derived image or video, the complete capture manifest, exact source
  release/member digests and entry snapshot, output digest, and rerender-test result;
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
retained events, allowing a confirmed publication to be edited, corrected, and later removed
without ordinary workflow overwriting those facts. Forced omissions remain explicit evidence gaps.

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

Useful event types include production opened, candidate reserved, reservation preflight passed,
reservation aborted, candidate exposure detected, canonical release committed, canonical release
observed, artifact revised, publication planned, attempt started, attempt failed, attempt ambiguous,
publication confirmed, publication edited, correction linked, removal requested, publication
removed, link observed broken, and import recorded. The prose names may later become implementation
constants, but this document does not define code or a storage schema.

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
public Journey number through the ordinary release transaction and record:

- original owner, URL/ID, and timestamp with precision;
- original bytes and digest when legitimately archived;
- acquisition/import time and legacy aliases;
- `imported from`, `occurred at`, and chronology relationships; and
- why it was recorded retrospectively.

Never renumber earlier entries to insert it. Its Journey number records when the retrospective step
joined the public story; `occurred_at` preserves when the underlying work actually happened.

### Withdrawal or disappearance

Record who requested removal, why, when it was attempted, and when remote absence was confirmed.
Distinguish maker withdrawal, legal/privacy removal, moderation removal, ordinary expiry, account
loss, and a merely broken link. Retain the minimal number identity, removal fact, route,
artifact/release identity, manifest, event detail, and private bytes only when legally and ethically
permitted. Keep the numeric route as a neutral unavailable/withdrawn shell and replace the serial
with a neutral unavailable card, with Previous/Next navigation and no protected metadata, whenever
permitted. If an external binding requirement forbids even that number-only shell or card, record the
forced availability failure when allowed; never reuse, skip forward as if nothing happened, or
renumber surrounding entries.

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
2. Replay temporary production records and reservation/abort/commit/observation events separately.
   Verify that only canonical-release commits advanced `Hc`, only successful independent canonical
   observations advanced `Hv`, every commit used the then-current `Hc + 1`, and no new reservation
   opened unless `Hc = Hv`.
3. Verify `0 <= Hv <= Hc <= Hv + 1`. Enumerate every integer from 1 through `Hc`; fail by name if any
   is not occupied. Require its Journey record and canonical-route binding unless a recorded forced
   erasure limits retention. For every integer through `Hv`, require its original live-observation
   evidence. If forced erasure removed that evidence, report the historical `Hv` claim as no longer
   independently verifiable and name the evidence gap; a removal event is not substitute proof of
   the earlier observation. Report a current live page, neutral post-publication status shell,
   unresolved latest commit, or forced-availability exception without pretending those availability
   states are interchangeable.
4. Replay entry events to derive each page's current state, relationships, and correction banner.
5. Expand each entry's artifacts and approved release manifests; verify the manifest and every
   member's archive path, byte size, and digest.
6. Expand its destination publications; replay their events to recover attempts, exact copy/files,
   remote IDs/URLs, edits, replacements, and final known state.
7. Rebuild the externally supported portion of publication time from exact or non-overlapping
   effective-time intervals. Report overlapping, unknown, and ambiguous intervals as unordered;
   use event IDs only to show registry-knowledge order, never as outside-time evidence.
8. Derive public Previous/Next from adjacent committed integers, treating a neutral status shell or
   recorded forced-availability exception as an occupied position; derive
   topic/correction/synthesis navigation separately.
9. Reverse-check every retained remote URL/platform ID to its publication record and Journey entry,
   and every publication record to archived exact text and uploaded bytes.
10. Report missing bytes, broken URLs, unknown times, conflicting remote state, or digest mismatch as
   explicit recovery gaps. Never fill them by inference.

The owned archive, event register, and digests are the reconstruction authority. Social feeds,
platform analytics, filesystem modification times, filenames, and search results are discovery aids
only.

A recoverable archive periodically exports a self-contained bundle containing, to the extent
retention remains permitted, the record-format definition, event register, derived current index,
immutable entry snapshots, artifact releases, exact publication text/files, URL map, and checksum
manifest. The bundle names every forced omission and does not call a legally reduced register
complete. Store recoverable copies independently of the social platforms and periodically perform a
read-only reconstruction using the steps above. A backup that has never been restored is only an
untested copy.

### Reconstruction boundary

This record can restore the retained owned Journey entry state, archived source and uploaded bytes,
known destination copy, intended relationships, and remote lifecycle events. It cannot recreate a
platform's transcoding, interface, feed position, recommendation
algorithm, unarchived analytics, ordinary unregistered replies or comments, bytes that could not
legally or ethically be retained, or an exact external order when timestamps remain ambiguous.
Those limits are reported as recovery gaps, not filled with plausible substitutes.

## Daily burden

The human workflow remains small even though allocation commits late:

1. write and produce under the temporary production identity and `JOURNEY-NEXT` placeholder;
2. approve one primary artifact, the canonical entry, and the smallest honest watchable serial
   edition;
3. let the exclusive release transaction materialize and commit the next public number;
4. independently confirm the canonical route and serial edition; and
5. register only the external destination publications actually selected.

Artifact/release allocation, placeholder replacement, canonical commit, publication attempts, and
global-event capture are pipeline-managed once the system exists; they are not a second hand-written
daily essay. The solo-maker public minimum is the consecutive `SCJ` identity, canonical page,
approved primary artifact, watchable serial edition, and applicable access/provenance/review work.
An external destination not used that day remains **N/A**.

Before that pipeline and its first successful read-only restore exist, release only one Journey
entry at a time. Keep one authoritative ledger for `Hc`, `Hv`, and the next candidate; do not begin
another entry's final numbered render until the current canonical page is confirmed, and retain a
small manual manifest
with the Journey and release IDs, exact serial master and public copy, canonical confirmation,
destination/account, remote ID/URL, confirmed time/precision, and evidence. Mark uncaptured request,
response, edit, or platform details unknown. Do not claim full reconstruction for an interim
publication.

## Failure modes this design prevents

- Dates, “Day 42,” missed days, timezones, multiple entries, and backfills becoming one confused ID.
- A draft, embargo, cancellation, or abandoned experiment creating a missing public episode number.
- Six platform copies acquiring six competing Journey numbers.
- A title, topic, platform, format, language, or claim-status change making an ID false.
- Renumbering old entries to insert a late discovery and breaking every citation, screenshot, and
  URL.
- Reusing a withdrawn or failed number for unrelated content.
- Publishing a later number while the preceding canonical release is unresolved.
- Losing identity when media is downloaded or searchability when a mark exists only in pixels.
- Calling numeric-next, topic-next, and scientific correction the same relationship.
- Treating an accepted upload or timeout as confirmed publication and creating duplicates on retry.
- Overwriting a released file, translation, caption, or social edit without a recoverable revision.
- Recording only the master and not the exact text and bytes actually published.
- Treating a platform URL, mutable handle, feed order, or clock as permanent identity.
- Hiding noncontiguous or corrected sources behind a recap range.
- Letting several future workers allocate IDs independently without one registry authority.
