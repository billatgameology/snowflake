# Part 1 film plan — review and revisions

## Scope and verdict

Reviewed commit: `d7d1de70251be1fb8b8596b8e6da35d82ef2b8a4`, on
`explore/film-part1-plan`, against base `929189b7ff0132fe288a562796812c68ec886840`.
The complete change is the Part 1 plan, its progress entry, and transcript entry JTS-M008.
This review uses the maker's subsequent direction: education chapters 1–13 are source material;
selection and order are flexible; the complete film must be under one hour; storytelling,
generated web visuals, the maker's narration, and both playback and manual reading are the goal.

**Verdict on the submitted plan: a strong creative foundation, requiring revisions before it
directs production.** Keep the growing Run B crystal, the early plate/column mystery, original
explanatory diagrams, and shared story across the website and film. Correct the scientific
overstatements and runtime contradictions. Give the film room to breathe and select scenes by
their contribution to the story. A complete prerequisite inventory is useful editorial material,
but does not establish that a viewer can follow the film.

The maker authorized acting on this review. The actions in this pass are revisions to the plan,
its sample script, and the current project records. Building the website and recording the full
film remain the production steps defined by the revised plan.

## Findings on the submitted bytes

Original line numbers below refer to the reviewed commit, before repairs.

### R1 — High: the closing claim contradicts the film's own evidence

Plan lines 799–811, especially S34's “everything … settled science except one thing,” erase the
multiple uncertainties described in S27–S33. Chapter 13's `confidence-map` and discussion of
impurities, pressure, premelting and omitted thermal transport explicitly retain several open
questions. The closing SETTLED badge makes this worse. S01/S18's “nobody can say why” also hides
the proposed explanations introduced later in the same film.

**Action:** end with a specific account of what is understood, what measurements constrain, and
what remains uncertain. Describe the morphology mystery as an incomplete explanation, with
hypotheses to examine. Retain the promise of testing models without granting a validation label.

### R2 — High: several scene summaries strengthen or change their sources

- S04, lines 375–383: “below zero none … freeze” changes Chapter 1's `#supercooling`
  account of droplets freezing across a range. State that cooling below zero does not make all
  droplets freeze at once.
- S05, lines 385–398: exhausting liquid droplets is a limit of the described mixed-phase supply
  mechanism, not a general definition of “too cold to snow.” Remove that shortcut.
- S06, lines 402–412: the ring-angle animation is an illustrative construction, not a proof of
  ice Ih from the isolated water molecule's angle. Teach the observed lattice and distinguish
  the model of its bonding from a tiling analogy.
- S18, lines 571–584: “diffusion can never make a plate” exceeds Chapter 7's comparison about
  extreme aspect ratios with comparable facet kinetics. Name the modeled comparison.
- S22, lines 633–646: Chapter 10 Eq. 6.1 divides the density difference by the saturation density
  at the substrate. The plan omits that denominator. Its twentyfold depletion example also
  depends on the stated chamber geometry, not coverage alone; ideal zero and measured zero
  have different precision.
- S27, lines 697–712: Chapter 11 limits the minus-five-degree broad-facet contrast to low
  pressure and low supersaturation. The levitation example fits an effective coefficient;
  it does not directly measure that coefficient. Preserve both qualifications.
- S33, lines 788–797: “no pressure” conflicts with the project's `D(T,P)` mapping; premelting
  is partly represented in fitted inputs. Stamping each omission “carried as a systematic”
  implies work has been discharged. Chapter 13 says that the error must still be bounded or
  carried before a quantitative claim.

**Action:** repair the scene beats and labels in place. Keep the complete narration's source
audit as a later production requirement; this review is not a certification of unwritten dialogue.

### R3 — High: the cold open does not fit its own schedule

Plan lines 825–833 allocate 210 words to S00+S01 and 88 seconds, but the written voiceover has
237 spoken words. Counting uses whitespace-delimited tokens containing a letter or digit,
including both voiceover fragments in the malformed row. Row counts are
19 + 41 + 58 + 12 + 53 + 26 + 28 = 237. At the plan's 2.4 words/second that is 98.75 seconds,
before pauses. The 58-word row gets 14 seconds: 248.6 words/minute. The 0:38 row also has four
Markdown cells, so part of the narration occupies the visual column.

**Action:** rewrite the example for an unhurried read, with room for the visual reveal; repair
the table; label timing provisional until the maker reads it aloud. Do not invent the maker's
past beliefs as biographical fact. The media specification recommends 120–140 spoken words/minute.

### R4 — Medium: the checklist is taking control of the story

Plan lines 34–39, 115–121, 212–219 and 282–329 make all 29 ideas mandatory, carry over a
short-feed badge ratio and 60-percent reveal rule, and treat the 35-scene order as decided.
S22–S31 repeatedly introduces new graphs, coefficients, instruments, corrections, and model
prescriptions in short slots. This is an editorial risk, not a measured audience failure.
The maker's latest brief permits selection and reordering under a one-hour ceiling.

**Action:** identify the central story, essential concepts, optional depth, and a small set of
signature visual sequences. Retain scene IDs as source inventory. Keep the short-feed cadence
rules in their original context; use claim-specific language in this film. Include silence,
transitions, titles and credits in the runtime budget. The ending should reward watching Part 1
even if the viewer never watches Part 2.

### R5 — High: scrolling and reduced motion have conflicting contracts

Plan lines 124–129 and WP4 specify separate sticky scene sections, while lines 878–890 and
“Tried and rejected” require one sticky stage. Lines 148–152 disable continuous scroll-linked
motion for reduced motion; the runtime table reinstates scrubbing and automatic cue-position
jumps. Layer visibility alone also does not establish a complete, readable document.

**Action:** specify one shared visual stage alongside semantic scene sections, with a static
reading path. Under reduced motion, narration can advance discrete visuals without moving the
document. Preserve headings, anchors, all prose and descriptions when rendering is unavailable.

### R6 — High: the playback clock lacks state needed for actual audio

The runtime brief polls a single `audio.currentTime`, but assets and WP6 propose per-act files.
There is no act offset, gap/hold rule, audio failure state, or defined exact seek mapping. Comparing
scroll positions each frame can confuse layout changes and programmatic scrolling with reader
input. “Nearest scene” resume can replay or skip a substantial piece of narration.

**Action:** define global film time, audio clip offsets and visual cue ranges, pause before
yielding to reader input, and use the inverse cue mapping to resume at the reader's position.
Keep loading, rejection, buffering, ended, resize and chapter navigation behaviour explicit.

### R7 — High: seeding the hero does not make export seekable

The sibling website's hero uses ticker time and accumulated snowfall state as well as random
values. A camera snap and seeded beacon leave the ending dependent on playback history. Waiting
for two painted frames establishes neither asset readiness nor an exact whole-scene state.

**Action:** require every exported layer to derive from film time, or deterministic fixed-step
replay from a known initial state. A frame is ready only after its assets, fonts, diagrams and
WebGL render complete. Compare representative forward, reverse and direct seeks, then decode a
short audiovisual export before building the full film.

### R8 — Medium: payload size and visibility do not bound rendering cost

“Never unmount” and “every scene … as a layer” can retain textures, decoded volumes, workers
and drawing loops for the whole film. Download byte counts do not establish resident memory or
phone performance. The plan defers the actual Run B appearance at its promised beats until WP4.

**Action:** keep one visual context and a bounded current/next-asset working set; stop inactive
draw loops and dispose replaceable resources. Check the seed, branching, and completed hero at
real cue positions. Use readable static fallbacks when an asset or renderer is unavailable.

### R9 — Medium: narration prose is not a caption track

Line 138 calls the page's whole narration text “captions.” The media specification's
`Captions and accessibility` section requires reviewed timing and SRT/VTT plus a transcript.

**Action:** keep semantic reading text, time-aligned captions, and necessary visual descriptions
as distinct outputs of the shared score. Check keyboard controls without intercepting typing or
normal page navigation. Verify labels and captions in both phone and film compositions.

### R10 — Medium: score ownership is postponed past the point it is needed

Lines 155–166 defer the narrative-score manifest, while the plan, narration and website cue file
can all become competing authored versions. The media specification defines one score shared by
all performances; public Journey numbering is a later, separate transaction.

**Action:** establish an internal draft score and its owner before runtime work. Bind script,
source snapshot, visual state, cue and caption references there; import a versioned copy into
the website and record its source identity. Defer release packaging and public allocation.

### R11 — Medium: stale or unverified dependencies become blanket blockers

The new progress entry says education stays frozen despite the same file recording Phase 6
closure and the subsequent education update. Hosting and merge-order questions block WP4 as a
whole, although local assets and an isolated prototype can support development. The plan also
calls catalog assets “untracked everywhere,” despite this repository's governed NAS records.

**Action:** distinguish historical freeze language, current task scope, local development
availability, durable provenance, and public hosting. Record website commit observations and
check them again before integration. Resolve ordinary branch dependencies from the actual diff;
keep public hosting as a publication decision.

### R12 — Medium: asset rights are asserted before the named item is checked

The archive section makes blanket conclusions from an author, agency or publication year while
WP3 has not identified the selected files. The maker's no-Libbrecht-figures constraint is already
sufficient; no new legal conclusion is needed for planning. A generic teaching diagram is also
different from a disguised reconstruction of a restricted source image.

**Action:** make archive items candidates pending exact source and rights records; prefer an
original diagram when no item has been cleared. Keep source-image reproduction out of the
diagram specification. This review does not clear any archive image for publication.

### R13 — Medium: the existing export and renderer do not establish film fidelity

The website's `scripts/export-growth-film.mjs` explicitly uses an 8-bit compositor path when
DOM/HUD content must be included; its higher-precision path captures the crystal canvas. The
plan depends on labels and diagrams as well as crystals, so it cannot borrow a whole-film
precision claim from that canvas path. `src/growth/GrowthStage.tsx` also exaggerates crystal
thickness, and `GrowthLibrary.tsx` uses preview decimation. Those choices matter when a scene
asks the viewer to compare thickness or aspect ratio.

**Action:** choose an explicit initial full-composition export profile, benchmark it with a
short audiovisual sample, and retain render settings. Use undistorted geometry or an explicitly
separate schematic for dimensional teaching; disclose cosmetic exaggeration in render notes.

## Production recommendations

1. Let the central question evolve: how does an invisible supply of water build such a varied
   object, what have people learned to measure, and where does explanation still fall short?
2. Use a few visual sequences worth lingering over: crystal-to-lattice scale change, vapour halo
   and runaway corner, a journey written into growth, and a measurement becoming a model input.
3. Treat the inherited scene list as a library. Equations, exact crossing counts, taxonomy counts
   and repository naming conventions can move to optional reading or Part 2 when they interrupt
   Part 1. Introduce a technical term only when the story gives the viewer a use for it.
4. Prototype a short representative sequence with temporary timing before porting the full
   interactive inventory. Check reverse scrolling, explicit playback, interruption, static
   reading, phone layout and a short export on that sequence.
5. Draft the full narration after that visual feasibility check; have the maker read it at a
   comfortable pace before final timing. Record clean voice, then review timed captions and the
   assembled sound and image together. Retain the complete-script scientific audit before final
   recording.

## Review provenance and limits

Coordinator: OpenAI Codex, GPT-6 as identified by this session. Three Codex agents using the
inherited session model performed separate read-only passes on science, story/source contracts,
and runtime feasibility. They shared this session's conversation and repository context. They
did not share the plan author's private extraction session. The submitted plan identifies its
author as Claude Fable 5.1; that attribution was read from the plan, not independently verified.

Independent work in this review: complete branch diff and plan read; direct checks against
education chapter text and named authority sections; scene-budget and spoken-word calculations;
read-only inspection of the sibling website and cached Git refs. The inspected website checkout
was `6e2592c`, cached master was `adae4041ec32638b92afc159c5ee50d4770360c9`, and the cached
library branch was `e8f82d0`. No fetch or mutation was made there. Code witnesses for R5–R8/R13:
`src/growth/RunBHero.tsx`, `src/hero1/snowfallGL.ts`, `src/growth/GrowthStage.tsx`,
`src/growth/GrowthLibrary.tsx`, `src/growth/growthVolume.worker.ts`, `src/lib/ticker.ts`,
`src/lib/hooks.ts`, and `scripts/export-growth-film.mjs`; the education replay witness is
`docs/education/assets/anim-diffusion.js`. No solver or scientific gate
ran. No film runtime, audience test, final narration, live website smoke, full export, source
PDF census, global literature survey or legal clearance was performed. The internal extraction
workflow named by the author was not used as evidence.

## Revision disposition and checks

**R1–R13 are applied at plan level.** The revised plan replaces the affected scene statements
and cold-open table, adopts the maker's under-one-hour/story-first brief, defines one internal
score owner, resolves the three viewing-mode contracts, and moves a representative prototype
ahead of bulk visual production. The current progress entry and JTS-M009 record the direction
and concrete next step. Original reviewed bytes remain available in commit `d7d1de7`.

The same reviewers made one bounded follow-up on their original findings after repairs. The
science pass confirmed its corrections and caught residual S00/S01 visual instructions, which
were synchronized with the rewritten example. The runtime pass confirmed the revised contracts
and caught an inventory heading that still implied every diagram must be ported; that wording
was corrected. These are checks of repairs in this review engagement, not reviews of this report.

The story follow-up confirmed the revised timing, captions, score ownership, uncertainty recap
and optional detail. The coordinator checked the remaining S00/S01 instructions against the
sample after synchronizing them.

Executed checks on the revised documentation:

- `node scripts/lint-rule7.mjs` — exit 0, `rule7: clean (1371 files scanned)`.
- `git diff --check` — exit 0, no whitespace defects.
- Read-only Node checks of the changed documents — 93 relative Markdown file links resolved,
  zero missing targets. Removing the newly added JTS-M009 block from the current transcript
  reproduces the original `d7d1de7` transcript byte-for-byte.
- Independent Node arithmetic over the actual plan text reproduced the original 237-word
  sample and the unchanged 35-row, 3,480-word candidate budget. The revised sample has five
  three-cell rows, 173 spoken words and 92 seconds of contiguous provisional timing.

Revised sample calculation, from the plan's `Fully scripted scene` table at write time:

| Row | Spoken words | Allocated seconds, including holds |
|---|---:|---:|
| 0:00–0:16 | 28 | 16 |
| 0:16–0:34 | 36 | 18 |
| 0:34–0:55 | 37 | 21 |
| 0:55–1:14 | 35 | 19 |
| 1:14–1:32 | 37 | 18 |
| Total | 173 | 92 |

Counting rule: split voiceover on whitespace and count tokens containing a Unicode letter or
number; punctuation-only tokens are excluded. The original malformed row's two spoken fragments
are joined before counting. At 120–140 spoken words/minute, the new sample's 173 words use
86.5–74.14 seconds, leaving 5.5–17.86 seconds inside its provisional timeline for visual holds.
That is a pacing calculation, not a measured performance by the maker.

No software suite was run: these changes are prose, source references and planning under Rule 6.
The sibling website remains clean. Production behaviour remains untested: the next step is
WP0A's short local website prototype, then full script/score, complete-script fact-check, maker
recording and final product review.
