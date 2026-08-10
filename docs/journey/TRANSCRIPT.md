# Snow Crystal Journey — Source transcript

**Status:** local working source with no known Journey/audience release. This is not a public
script, a numbered Journey entry, or scientific evidence. The repository remote is public, so this
file is not a privacy boundary: pushing it would expose the exact quotations it contains.

This file preserves the maker's own account before it is divided into episodes or rewritten for an
audience. It also records the earliest visible repository sequence, but keeps that sequence
separate: Git can show what was committed and when; it cannot recover an unrecorded thought, prove
when a video was watched, or decide whether a later memory is correct.

## Record rules

There are three source classes:

1. **Maker transcript** — words selected from the current conversation and preserved exactly,
   including spelling, capitalization, punctuation, uncertainty, and paragraph breaks.
2. **Contemporaneous maker quotation** — maker words already preserved in a tracked historical
   record, quoted from an inspected revision rather than reconstructed from later prose.
3. **Repository observation** — a commit, tree, timestamp, file, recorded test state, or other fact
   visible in Git. It is not attributed as a thought or discovery unless the maker separately says
   that it was one.

`JTS-M`, `JTS-Q`, and `JTS-G` are internal source-record IDs. They are not public `SCJ` episode
numbers and never reserve one. The records are append-only: a later correction or fuller memory is
added and linked to the earlier record instead of silently editing the quoted words.

Date fields are deliberately distinct:

- **Captured** means when this source file could place a conversation record: 2026-08-09, at day
  precision only. Exact chat timestamps are not available here.
- **Remembered occurrence** means when the event in a recollection happened. It remains unknown
  unless the maker supplies it.
- **Git author time** and **Git committer time** are metadata recorded by Git. Neither is treated as
  the time a private realization occurred.
- **Repository exposure** records whether the exact words were already reachable from the public
  repository. A local-only record can become public through a later push.
- **Journey publication** means an intentional release as audience content. It is not inferred from
  repository exposure.

## Maker transcript

### JTS-M001 — Connected-content pipeline

- **Selection:** Journey-relevant excerpt from a mixed-purpose maker turn; its opening session
  instruction is omitted.
- **Captured:** 2026-08-09, day precision.
- **Remembered occurrence:** not applicable; this is current intent.
- **Repository exposure at capture:** already tracked in local commit
  `913541019d3821dbf6611b6e78d3eb5850021e50`; not reachable from inspected public-origin refs as of
  2026-08-09. This task does not push.
- **Journey publication:** no known release.

```text
i'm beginning to think i can combine education website, animation, social media post all together in one pipeline where I only need to create one full chapter of content first that is code based, include code generated images, animation, recorded audio, interactive demo (web use only but can show in video), ice crystal model viewing and video, group all all of these together into one connected, coherent content creation pipeline.

This system will generate social post, video, website, education and demo all together so that, when I have a demo, i can post video about it. when a crystal is created, it gets uploaded to the website, and have a social post about it. when the research progresses and has new content, there can be immediate post about it with content, media, etc,
```

### JTS-M002 — Slow-burn discovery journey

- **Selection:** complete maker turn.
- **Captured:** 2026-08-09, day precision.
- **Remembered occurrence:** the project beginning is described, but not dated.
- **Repository exposure at capture:** local working tree; this task does not push.
- **Journey publication:** no known release.

```text
we don't have to use anything existing, those are contents generated to test the water.

what I think i want to do is a slow burn year long (or longer) discovery journey of snow crystal.  I started with knowing nothing and slowly but consistently 15 secdonds - 1minute per day, i would produce something that moves the journey a step further, sometimes i would take a few steps back, but taking steps everyday,
```

### JTS-M003 — Varied daily media and a chronological journal

- **Selection:** complete maker turn.
- **Captured:** 2026-08-09, day precision.
- **Remembered occurrence:** not applicable; this is current intent.
- **Repository exposure at capture:** local working tree; this task does not push.
- **Journey publication:** no known release.

```text
i like your caution on daily content. Each day can be some different type of content, not all at the same time every day. I could have a journy section that's like a journal where everything is kept in sequence with links to the content
```

### JTS-M004 — The selected origin recollection

- **Selection:** complete maker turn, explicitly introduced by the maker as “the real journey.”
- **Captured:** 2026-08-09, day precision.
- **Remembered occurrence:** the project beginning is described, but no date, spacing between events,
  or relationship to the reachable repository history is supplied.
- **Repository exposure at capture:** local working tree; this task does not push.
- **Journey publication:** no known release.

```text
this is the real journey, let's figure out how to get this in to digestible pieces with visual. because without visual, nobody watches. it's going to be superficial at first, but it's needed to grab first audience.


this project started with me wanting to make pretty snowflakes as toy app. I remember watching this youtube video Verbatasium? who went to Dr. Liebrech's lab to create some snowflakes. that's when i was introduced to nakaya's diagram. and it appeared that it follows pretty simple rules and few parameters and that's how all snowflakes are generated.

with AI being so good at coding, the plan was to read Dr. Libretch's paper, take his findings in math equations. program it. make a snow flake generator. Easy Peasy.
```

The uncertain names and spellings in JTS-M004 remain untouched. Identifying the video, researcher,
diagram, or paper belongs in a separately sourced annotation. “simple rules and few parameters” is
the maker's remembered impression at the time, not a scientific conclusion; “without visual,
nobody watches” is the maker's rationale, not a measured audience result.

### JTS-M005 — Direction for this record

- **Selection:** complete maker turn; recordkeeping direction rather than story content.
- **Captured:** 2026-08-09, day precision.
- **Remembered occurrence:** not applicable.
- **Repository exposure at capture:** local working tree; this task does not push.
- **Journey publication:** no known release.

```text
Let's focus on documenting my journey, with actual word for word transcript in md file. then we'll add on to this. based on git history, and my recount of what actually happened.
```

## Contemporaneous maker quotation

### JTS-Q001 — Informal Phase 1 play-test response

- **Recorded context:** functional browser testing of the throwaway two-dimensional journey spike,
  not the planned structured play-test protocol.
- **Containing record:** `docs/plans/phase-1-ux-spike.md`, first tracked with this quotation in
  `d37afd5a81a11d2040cb49e313c9eec2963fe528`.
- **Git author time:** 2026-07-14T22:05:11-07:00.
- **Containing record's session label:** 2026-07-14/15; the exact utterance time is unavailable.
- **Source locator:**
  `git show d37afd5a81a11d2040cb49e313c9eec2963fe528:docs/plans/phase-1-ux-spike.md`.
- **Repository exposure:** already reachable from the public repository; original push time was
  not established in this audit.
- **Journey publication:** no known release.

The containing record explicitly labels these words “Verbatim”:

```text
i think it
works, did not try many journey but the few presets in there works well. compare mode also works
when using different journey, different snowflake are generated.
```

This is an informal positive response about that prototype. It does not establish that the planned
four-task protocol ran, and it does not answer the later scientific-validity questions.

## Earliest repository chronology

This chronology reports the current reachable Git history. The author field on every commit below
is `Bill Wang`; that field is repository metadata, not proof about who composed every sentence.
Unless separately distinguished, each time below is both the Git author and committer time; all use
the recorded `-07:00` offset. ADR 0004, committed in `7c78976f`, says a history rewrite purged MP4
files from all eight then-existing commits and changed their hashes, so those identifiers below are
the surviving post-rewrite identities. The JPEG previews were deleted from a later tree but were
not purged from reachable history.

### JTS-G001 — The tracked project opens with source gathering

- **Commit:** `7c8aaf162594e11dfdaadb658f13a2c12fe8dedf`.
- **Git author and committer time:** 2026-07-14T14:58:52-07:00.
- **Subject:** `plan Phase 0 snowcrystals site research`.
- **Inspected paths:** `docs/PROGRESS.md` and
  `docs/plans/phase-0-snowcrystals-site-research.md`.

This is the root of the reachable history. It adds a research plan and a progress record that calls
the project pre-code. That progress record says local source material had already been gathered,
including the Gravner–Griffeath paper, three Libbrecht PDFs, and a transcript and metadata for a
video titled “The Snowflake Myth.” The commit proves that this statement was recorded; it does not
contain those source bytes, prove they were read or watched, or establish the maker's private order
of discovery.

Source locator: `git show 7c8aaf162594e11dfdaadb658f13a2c12fe8dedf:docs/PROGRESS.md`.

### JTS-G002 — Laboratory-growth media were catalogued; MP4s and previews had different fates

- `3d1a6f8ff9f786ceadb4a8ea7f77d864a989258c`, 2026-07-14T15:02:20-07:00,
  subject `catalog snowcrystals videos and preview stills`, adds a snowcrystals.com video/still
  index and ten JPEG previews.
- `f85ebb7dbd54264410615f46507c8bd4d9d6f3e4`, 2026-07-14T15:08:29-07:00,
  subject `archive highest-resolution snowcrystals videos`, records a local highest-resolution
  video archive in the index; ADR 0004 records that the MP4 bytes were later purged from history.
- `826c5fc062b4c9bb8216d29acb72807479e9383e`, 2026-07-14T15:23:14-07:00,
  subject `remove local snowcrystals preview stills`, deletes the ten JPEG paths from that tree and
  adds `research/snowcrystals.com-videos.md`. The earlier JPEG blobs remain reachable through
  `3d1a6f8`.

The defensible observation is that early repository work catalogued real laboratory-growth media,
purged the MP4 archive, and removed previews from subsequent trees while leaving their earlier Git
objects reachable. It does not identify the remembered video in JTS-M004 or date when the maker
first saw it.

Source locators: `git show --stat <commit>` for each identity above, and
`git show 826c5fc062b4c9bb8216d29acb72807479e9383e:research/snowcrystals.com-videos.md`.

### JTS-G003 — Charter, governance, and Phase 0–2 design documents entered the tree

- **Commit:** `7c78976f1051d7d23650a7a9a1462eccbecbec35`.
- **Git author and committer time:** 2026-07-14T15:42:36-07:00.
- **Subject:** `Add project governance, charter, and Phase 0–2 design docs`.
- **Inspected paths:** `project charter.md`, `AGENTS.md`, `docs/gg-machinery.md`,
  `docs/attachment-kinetics.md`, `docs/libbrecht-parameters.md`, and early plans and decisions.

The committed charter describes an interactive instrument for designing a crystal's environmental
history, growing a three-dimensional result, and exposing hidden vapor and surface state. It also
explicitly says the project is not yet a validated physical simulator. This is a committed design
state, not a verbatim account of what the maker thought before it was written.

Source locator: `git show 7c78976f1051d7d23650a7a9a1462eccbecbec35:'project charter.md'`.

### JTS-G004 — A Libbrecht monograph was prepared for LLM-assisted research

- **Planning commit:** `596b07a5b8c938b65a8d9eec8f8febd60fd122b4`,
  2026-07-14T16:19:28-07:00, subject `plan LLM research bundle extraction`.
- **Tooling commit:** `4fa29f810883041ab311761eec11778bfbc7061a`,
  2026-07-14T16:34:43-07:00, subject `build LLM research bundle tooling`.
- **Inspected paths:** `docs/plans/research-snow-crystals-llm-bundle.md`,
  `research/1910.06389v2-llm.md`, and the bundle build and verification scripts.

The tracked record describes turning a local 523-page Kenneth Libbrecht monograph into a
searchable multimodal research bundle. Its index records 376 figures, 279 rendered evidence pages,
and a strict verification sample. The full generated bundle remained local, while its index and
build and verification scripts were tracked. This supports the narrow claim that LLM-oriented paper
extraction entered the recorded workflow early; it does not prove that the source was understood
correctly or that translating its findings into code would be easy.

Source locator:
`git show 4fa29f810883041ab311761eec11778bfbc7061a:research/1910.06389v2-llm.md`.

### JTS-G005 — A deliberately throwaway Reiter journey-editor spike was built

- **Planning commit:** `c6c2e1669f355868b4149e6c8bdcf860af52d45b`,
  2026-07-14T16:48:28-07:00, subject
  `Charter v1.2 review integration: sync docs, add Phase 1 plan, harden Phase 1-2 plans`.
- **Build commit:** `1a08bcab37e81e627ca53bd0122b2a151fa8112a`,
  2026-07-14T21:36:36-07:00, subject
  `Phase 1: build the 2D cloud-journey spike and fix the maker-review defects`.
- **Inspected paths:** `docs/plans/phase-1-ux-spike.md` and `spike/`.

The plan asks whether designing a cloud journey feels engaging. It chooses an isolated,
throwaway, two-dimensional Reiter model, uses nonphysical parameter labels, and says not to evolve
the spike into the real product. The build adds timeline editing, replay, save/load, comparison, and
four presets. The committed plan still leaves the structured play-session gate open.

Source locator:
`git show 1a08bcab37e81e627ca53bd0122b2a151fa8112a:docs/plans/phase-1-ux-spike.md`.

### JTS-G006 — CPU-model scaffolding overlapped the still-open toy phase

- **Commit:** `a00110ea4c091c3bec0816e94e7364c7c502e6a2`.
- **Git author time:** 2026-07-14T21:37:44-07:00.
- **Git committer time:** 2026-07-14T21:52:19-07:00.
- **Subject:** `Phase 2a (in progress, NOT gated): workspace scaffold + G-G machinery`.
- **Inspected paths:** `core/`, `solver-cpu/`, `runner/`, and
  `docs/plans/phase-2-cpu-solver.md`.

The commit creates the TypeScript workspace, the core lattice and state machinery, a float64 CPU
solver, a runner, and tests while explicitly marking Phase 2a “NOT gated.” Repository order shows
that this state entered the tree before the toy-phase closure; it does not prove simultaneous work
or explain the maker's private reasoning.

Source locator: `git show --stat a00110ea4c091c3bec0816e94e7364c7c502e6a2`.

### JTS-G007 — Committed records say browser use exposed replay-integrity defects

- **Defect record:** `7f3f12cff954e6eced847a157adfeb5b1995063d`,
  2026-07-14T21:53:08-07:00, subject
  `PROGRESS: Phase 1 replay-fidelity round 3 — maker verdict, three blocking defects`.
- **Repair record:** `d37afd5a81a11d2040cb49e313c9eec2963fe528`,
  2026-07-14T22:05:11-07:00, subject
  `Phase 1 round 3: replay fidelity complete — tick-0 reseed, duration-edit divergence, staircase save`.
- **Closure record:** `a58bac03eaa7844e9da1b0bcee9e455da1e6689d`,
  2026-07-14T22:21:59-07:00, subject
  `Close Phase 1: gate maker-asserted, spike archived`.
- **Inspected paths:** `docs/PROGRESS.md`, `docs/plans/phase-1-ux-spike.md`,
  `spike/check.mjs`, the changed `spike/js/` modules, and `spike/README.md`.

The committed records describe three replay-honesty defects found in browser use: a tick-zero edit
did not reseed, changing the length of a completed segment reassigned already-consumed ticks, and a
long live edit could create an unsaveable journey. The next commit records repairs and regression
checks. The closure record archives the spike with an informal positive signal while explicitly
saying the planned four-task protocol was not run and its history artifacts were not produced.

The closure commit has a Git author timestamp on 2026-07-14, while the document records the gate as
maker-asserted on 2026-07-15. Both values are retained; this file does not silently choose one as
the event date.

Source locators:

- `git show 7f3f12cff954e6eced847a157adfeb5b1995063d:docs/PROGRESS.md`
- `git show d37afd5a81a11d2040cb49e313c9eec2963fe528:docs/plans/phase-1-ux-spike.md`
- `git show a58bac03eaa7844e9da1b0bcee9e455da1e6689d:docs/plans/phase-1-ux-spike.md`
- `git show a58bac03eaa7844e9da1b0bcee9e455da1e6689d:spike/README.md`

## Reconciliation without invention

JTS-M004 remembers this order: a wish to make a pretty snowflake toy; a remembered laboratory video;
an introduction to the Nakaya diagram; an impression that a few simple rules might be enough; and a
plan to extract equations from Libbrecht's work and let AI help turn them into a generator.

The reachable repository cannot date that private sequence. Its first state is compatible with
parts of the account: papers and a video transcript are listed as already local, then visual sources
are catalogued, a charter and research apparatus appear, a monograph is prepared for LLM use, a
throwaway Reiter journey-editor spike is built, and CPU-model work begins. Compatibility is not
corroboration of the private sequence. The Git record cannot identify the remembered video,
establish when the idea began, or show which understanding came before another.

This first chronology stops at the archived Phase 1 toy. Phase 2a's gate attempts and later science
contain changing claims, corrections, and new evidence; they should be appended as their own
audited section rather than compressed into a confident retrospective.

## How to add the next piece

Add the maker's next recollection first as a new `JTS-M` record. Preserve the exact words, give the
remembered event only the date precision the maker actually supplies, and leave uncertainty intact.
Then inspect only the Git interval relevant to that recollection and add `JTS-G` observations with
exact revisions and paths. If the two accounts differ, preserve both and state the difference.
Scripts, hooks, visuals, and public `SCJ` entries are later derivatives and must link back to these
source IDs rather than replacing them.
