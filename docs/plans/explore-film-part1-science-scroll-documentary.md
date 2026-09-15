# Plan — Part 1 film: "How a snowflake is made" as a scroll documentary on Cryosphere

- **Phase:** Maker-directed Journey/media exploration, outside Phase 6 scope (precedents:
  [explore-journey-scroll-documentary.md](explore-journey-scroll-documentary.md),
  [explore-education-ch1-video.md](explore-education-ch1-video.md))
- **Status:** Prototype revision retained; prepared film through S13 implemented and product-checked. WP1 maker read/recording pending; WP2 text review resolved; later production continues at S15.
- **Started:** 2026-09-14
- **Last touched:** 2026-09-15 by OpenAI Codex (prepared film through S13; product and visual checks)
- **Review:** [findings and dispositions](../reviews/film-part1-plan-review-2026-09-15.md),
  reviewing the original plan at `d7d1de70251be1fb8b8596b8e6da35d82ef2b8a4`.

## Goal

Turn education chapters 1–13 — the science half of the course — into **Part 1 of the living
documentary**: one tall page on the Cryosphere website (`snowcrystal_website`, the sibling
repository) that opens with the Run B hero, can be read by scrolling or played with the maker's
recorded narration driving the scroll, and renders frame-exactly to a 16:9 film. Tell a satisfying
science story in its own right: how invisible water builds an intricate crystal, how people
learned to observe and measure that process, and why predicting its shape remains difficult.
This also prepares a new viewer for Part 2's model-development story and recorded negative result.

This plan is the first draft of Part 1's **narrative score** (media spec, "Living scroll
documentary"): the act and scene order, what each scene must teach and why Part 2 needs it, the
visual that carries each beat and where it comes from, the narration budget per scene, the tags
and confidence labels, and the runtime shape the website needs. The full narration now lives in
[part1-script.md](../video/part1-script.md); the inventory and sample below retain the reviewed
planning context. The execution record identifies the selected production draft and its checks.

The original maker direction is preserved verbatim in the Journey transcript as `JTS-M008`
([TRANSCRIPT.md](../journey/TRANSCRIPT.md)), together with the four decisions the maker selected:
about 20–25 minutes; browser-rendered originals plus public-domain history, no Libbrecht figures;
the maker's own first-person narration at a smart-teenager level; scene plan plus one scripted
scene in that pass. **The subsequent direction in `JTS-M009` governs this revision:** chapters
1–13 are source material; order and content selection are flexible; the complete documentary is
**under one hour**, narrated by the maker, with impressive generated web visuals and automatic
playback or manual scrolling. The earlier 20–25-minute choice remains the first draft's context,
not a ceiling that requires rushed speech. Review and correction are authorized in this pass.

## Done when

There is no chartered film milestone. The charter's scientific-claim discipline still applies.
This planning and review unit is done when:

- the story, essential concepts and optional depth are distinguished; selected scenes name their
  sources and preserve their qualifications, with corrections to the source chapters identified;
- the runtime method budgets narration, visual holds, transitions, titles and credits together
  below one hour; word counts support comfortable delivery rather than determine a fixed cut;
- one scene is fully scripted in the house `TIME | VOICEOVER | ON SCREEN` format with its
  fact-check table, as the template for the rest;
- every proposed visual is an original browser rendering or an archive candidate with a named
  clearance step and an original-diagram fallback; no Libbrecht figure is an asset;
- the website runtime section names, for scroll/read, watch/listen, and export, which mechanism
  carries it and whether that mechanism exists today or is a gap;
- `docs/PROGRESS.md` records the plan and the next media step; and
- the requested review is recorded with applied corrections and evidence limits. The full Rule
  13 fact-check audit remains a gate on the complete narration before final recording.

## Approach

### One score, three performances

The media spec already settles the architecture: one versioned narrative score performed three
ways — scroll/read at the reader's pace, watch/listen after an intentional start with narration
driving the page, and a deterministic fixed-frame export. The scene records in this plan are the
draft score. Each carries a stable scene key, the chapter anchor it teaches, the source chapters
and claim labels, the narration beats and word budget, the visual state (layer, component,
driver), the on-screen tags, and its share of the film clock.

Before implementation, create the internal draft score at `docs/video/part1-score.json`; this
repository owns it. It references the script by stable scene key, source chapter path/anchor and
Git revision, claim/review status, visual origin and cues, reader text/description, caption cues,
audio clip identity and offsets, and capture settings. The website imports an identified snapshot
and records its revision/digest; edits return to this source. Public `SCJ` allocation and the
immutable release package remain later work. The draft score needs no new publication registry.

### Story and visual priorities

The viewer's question is **how a snow crystal gets its shape, and how we know**. Use the early
plate/column puzzle to create curiosity, then change scale as each explanation becomes useful:

1. **Meet the crystal.** Reveal its beauty and the MODEL disclosure, pose the changing shapes,
   then distinguish vapour growth from a frozen raindrop.
2. **Follow the water.** Move from lattice and facets to the invisible vapour field. Make the
   runaway corner the first large visual payoff.
3. **Read its history.** Follow changing conditions, common arm histories and the limits of
   reading a finished shape. Return to the map with more understanding.
4. **Ask how we know.** One memorable instrument sequence turns observation into a measurement;
   use it to introduce the difference between a measurement, a fitted curve and a hypothesis.
5. **Reach the frontier.** Explain the surface barrier and proposed narrow-edge feedback at the
   level needed to understand the uncertainty. Finish with what a model can be asked to predict.

These are editorial movements, not new scene identifiers. Existing S00–S34 keys remain a source
inventory and may be combined, shortened, reordered or moved to optional reader notes. Keep the
essential concepts: vapour deposition and nucleation; ice Ih's lattice and facet directions;
supersaturation and diffusion; attachment and branching; growth history and the morphology map;
measurement versus model inputs; and the limits of proposed surface explanations. The detailed
coverage map below is an aid, not a requirement to speak every item.

Prioritize four signature visual sequences: a crystal-to-lattice scale change (S06–S08), a vapour
halo becoming a runaway corner (S09/S13), a journey written into growth (S15–S17), and an
instrument measurement becoming a model input (S22/S26–S29). Give each a clear question, visible
change and spoken payoff. Hold the result long enough to inspect it; use silence deliberately.
Keep exact taxonomy counts, repository identifier naming, crossing counts, and the detailed
retraction story in optional reading or Part 2 if they interrupt this arc. A viewer should leave
with an answer about snow crystals, not merely instructions for a sequel.

Before porting the diagram inventory, make a short prototype of the halo/corner sequence with a
Run B handover, temporary timing and readable prose. It must exercise manual reverse scroll,
intentional playback, interruption/resume, static reading and a short export. This tests the
visual ambition and runtime together while the full script is still easy to edit.

### The spine: Run B grows across the whole of Part 1

The `/run-b-hero` route today grows the Run B crystal from its 19-cell seed in 13 seconds, holds,
then lets the camera fall away until the crystal is one marker in a snowfield, and loops. In the
film the same tour is stretched across Part 1: the seed sits on the void in the cold open, the
crystal is complete at the end of the last science act, and the hero's existing ending — hold,
zoom-out, handover to the beacon, snowfall, drift off the bottom — becomes the transition into
Part 2, which opens by following that flake down into the maker's story.

Why this shape:

- The maker asked to keep using the hero, and a single growing object gives a twenty-minute page
  one continuous through-line that scrolling cannot lose.
- The crystal is **model output, unvalidated** — a Gravner–Griffeath run, not a photograph — and
  Part 2 is about whether that kind of crystal deserves to be believed. Saying so in the cold open
  is both the series bible's mandatory spoken MODEL disclosure and the film's promise.
- The compact growth history supports seeking. Loading, decoding, rendering and camera state
  still have costs; the prototype checks backward seeks on the actual assets.

Rules the spine obeys:

- A persistent **MODEL** tag whenever Run B is on screen, never removed for a beauty shot.
- The GROW IT rule from the series bible: the replay may only *illustrate* a claim the chapters
  independently establish. It never demonstrates a physical claim, and the narration never says
  "watch how the physics does X" over it.
- After the explicitly cued opening preview, growth is a monotone function of film progress:
  a table of `(scene key → growth fraction at scene start, at scene end)`. Revisit the inherited
  growth hints when cues are selected; offstage growth may advance only through an explicit cue.
  The continuous story starts at the seed; the crystal is finished at the end of the frontier act, so the
  branching act, the diary act, and the menagerie act each get a visibly different stage of it.
- Run B is a G-G plate/dendrite rendering with phenomenological inputs and no physical temperature
  assignment. The narration may say "a computer's crystal"; it may not name a temperature for it.

### Four visual layers and their tags

| Layer | Tag on screen | What it is | Where it comes from |
|---|---|---|---|
| **SPECIMEN** | `MODEL` | Measured solver replays: Run B, and other assets from the growth library for the menagerie scene | This repository's growth assets, already decoded by the site's `growthAsset.ts` |
| **DIAGRAM** | `DIAGRAM` | Original animations that carry explanatory and quantitative beats within stated limits | Selected education interactives and pilot designs, adapted to externally driven state; no obligation to port the entire inventory |
| **ARCHIVE** | `ARCHIVE` (photograph or drawing, dated) | Candidate historical images, used only after individual clearance | Kepler, Descartes, Hooke, Bentley and USDA candidates checked at the exact item level; original-diagram alternatives |
| **ATMOSPHERE** | none | The site's procedural rooms (the `/hero1` snowfield, the home lattice, the powers-of-ten dive, the museum rooms, the tiling zoo, the light room) | Already built; used for mood and transitions only |

An ATMOSPHERE piece never carries a fact. If a scene needs one to (the tiling zoo for "why not
five", say), the piece is re-scoped to the claim, given a `DIAGRAM` tag, and listed under that
layer. This is the education site's own rule — every interactive states what it encodes and where
its limits begin — carried into the film.

### Voice

First person, the maker, at the accessible register of [video-explainer.md](../video-explainer.md).
Write observations the maker can own; statements about prior beliefs or personal experience need
the maker's confirmation. Part 1 follows the science; detailed software history belongs to Part 2.
Vary scene openings between a question, an observation, an experiment and a reveal. The Chapter 1
pilot supplies material to rewrite and fact-check, not approved dialogue to inherit unchanged.
Use the media specification's 120–140 spoken words per minute as a draft estimate, then measure
the maker's table read. Short-feed rules about a 60-percent reveal, terminal badges and a 3:1
publication ratio do not govern this film's acts. Qualify the actual claim at the point it matters;
do not assign SETTLED to a sequence containing unresolved mechanisms.

### Scroll/read, watch/listen, export — concrete behaviour

These are the media spec's required behaviours made specific for this page.

**Scroll/read (the base performance).** Semantic article sections contain real headings, complete
prose, visual descriptions, sources and stable act/scene anchors. One shared sticky visual stage
serves them; each section's layout provides measured scroll anchors, without forcing scroll
distance to equal narration duration. A piecewise cue map connects those anchors to film time.
The complete article remains usable without JavaScript, WebGL, audio or continuous animation.
Decorative stage overlays are hidden from assistive technology; inactive interactive overlays
cannot receive focus. The renderer consumes progress without requiring per-frame React updates.

**Watch/listen.** An explicit Play control starts the maker's recorded narration. A cue map —
narration time → film progress — drives the film clock. The visual revision gives this performance
full-width focus without continuously moving transcript prose alongside it. The measured
time/anchor map remains available for deliberate reader takeover, not automatic watch-mode
document repositioning. Reader scroll intent pauses audio and releases automatic visual
progression before the next write. Resume maps the actual reader position back
to the corresponding cue time. Controls include play/pause, seek, mute/volume, captions and act
navigation. Player keyboard shortcuts apply within the player controls, never while typing or
using normal page navigation, and playback does not move focus. Reviewed, time-aligned captions
are separate from the complete reading text; retain VTT/SRT, transcript and visual descriptions.

**Export.** The site's capture bridge (`?capture=1`) already lets an offline renderer set a clock
to an exact time and wait for the painted frame. The film page exposes the film clock through the
same bridge; the export script steps it frame-exactly at a fixed rate in a purpose-made 16:9
composition with reader chrome hidden, and narration is assembled offline against the same cue
map. The render notes record the recipe, the detected renderer, and the settings, as the Run B
export notes do today. A screen recording of someone scrolling is not the film.

**Reduced motion.** On `prefers-reduced-motion`, each scene uses its selected composed still
(a seed, intermediate or finished crystal as appropriate), auto-scroll and continuous scroll-linked motion are disabled, and
the reading order, headings, prose, and sources remain complete. A persistent audience override is
offered. Playback may advance discrete scene stills and captions while audio plays, but does not
scroll the document or continuously scrub the crystal in this mode. Reader-initiated navigation
remains available.

### Where the build lives

- **This repository (authority):** this plan; the narration script and its fact-check table under
  `docs/video/`; the rights register; the Rule 13 audit record; the score records as they mature.
  Source chapters are read, not edited in this task. The historical freeze ended with Phase 6;
  `docs/PROGRESS.md` records its closure and the later education update.
- **The website repository (`snowcrystal_website`):** a new route for the film, the film runtime,
  the ported diagram components, the narration cue file and audio, and the export script. Its
  README gets one pointer to this plan. Recheck the website's branch state before implementation
  and reuse its task worktree under its rules; the runtime review below names the inspected refs.
- The internal score precedes the runtime. Public `SCJ` numbering and the immutable release
  package are deferred until a release is proposed, under the numbering specification.

### Rights

- **No Libbrecht figure, crop, or traced/reconstructed source image.** This is the maker's asset
  constraint, consistent with decision 0004. Original teaching diagrams may use cited facts and
  equations without reproducing a source figure's expressive composition.
- **Public-domain archive images only**, each with a rights row: source URL, publication date,
  author and relevant rights information, intended use, date checked, and who checked. Dates,
  author names and institutional custody alone do not clear a selected file. An item without a
  passing row is replaced by an original `DIAGRAM` or omitted.
- **USDA LT-SEM micrographs** are candidates; check the selected item's credit and reuse statement
  before use. No archive image is cleared by this plan review.
- **No AI-generated video or imagery.** The Chapter 1 pilot's optional V-series B-roll track is
  not used: the maker chose browser-rendered originals, and the site's identity is real-time
  rendering with no pre-baked frames.
- **Nakaya:** make an original diagram from the chapter's cited observations and equations,
  retaining uncertainty and constant-condition qualifications. Historical photographs are not
  selected for this film; a date card needs no comment about unavailable media in the narration.

## How the source material was read

The original plan author reported the following extraction process: thirteen readers extracted
load-bearing facts from chapters 1–13 with the
confidence label the chapter gives it, the figures and interactives each chapter uses, and what
Part 2 later calls back to; seven readers catalogued every visual panel on the Cryosphere site
(driver, fidelity, what it may and may not be used to claim); one assessed the site's runtime
against the film's needs; one story editor merged the extractions into 29 must-know ideas, a
43-edge prerequisite graph, and five candidate teaching orders (workflow `wf_0b937e68-061`,
2026-09-14; 22 agents, none failed; per-agent returns in that run's `journal.jsonl`). The
extractions are working material, not evidence. This review did not inspect that workflow. The
scene inventory carries citations to the chapter and
printed page the readers reported, and the narration script (WP1) re-checks each against the
chapter text before the Rule 13 audit.

**Order chosen: mystery first, then one crystal's biography, then the instruments, then the
open question.** Of the five candidate orders, the mystery-first opening (pose the plate–column
alternation as an unexplained map before teaching anything) and the single-crystal-biography spine
(the physics arrives when the crystal needs it: freeze, facet, starve, branch, record, land) were
merged, because the Run B crystal growing across the film *is* a biography and the maker's
Part 2 is the search for the answer to the mystery. The history chapter is split: Kepler and
Barnes serve the lattice act; Bentley, Nakaya and the modern chamber form the instruments act.
The early map is an editorial choice that supplies a question to revisit. Chapter order is not
mandatory, and neither is this first scene order. The author's subsequent script check reports
no prerequisite violations; the [review addendum](../reviews/film-part1-plan-review-2026-09-15.md#author-response-and-wp1-notes)
records its attribution and limits. The rejected-order rationale was inconsistent, not evidence
that the scene order violated the graph. Select the final sequence through the story and table read.

## The film

The inherited inventory has **35 candidate scenes and 3,480 budgeted words**, independently
summed from its rows in the [review](../reviews/film-part1-plan-review-2026-09-15.md). These are
draft allocations, not a finished narration count or a required cut. At the media specification's
120–140 words/minute, that word budget alone takes roughly 25–29 minutes; deliberate holds,
transitions and credits add time. A roughly half-hour first cut is a useful starting point, with
freedom to shorten or expand as the story earns it. The maker's hard limit is **total runtime
strictly below 60:00**, including silence, opening, handover and credits. Never accelerate the
voice to meet it. The final cue table comes from the selected script and actual recorded audio.

The table's **legacy start** offsets and the seconds in scene headings preserve the original
continuous-speech draft for comparison; they are not implementation cues. WP1 replaces them in
the score with explicit narration, hold and transition durations. The revised cold open below
has its own provisional timing and supersedes S00/S01's original allocation.

**Spine column.** `stage` = the Run B crystal fills the frame; `witness` = an optional small
corner view, omitted when it competes with a diagram; `off` = hidden while a diagram or
archive carries the beat. **g** = fraction of Run B's 70,000 ticks shown at the scene's end (the
original mapping into tour seconds was `g × 13`; WP0A checks the actual appearance, then WP1
records the chosen mapping in the score. The draft fractions below are not locked cues).

| Key | Legacy start | Act | Scene | Ch. | Coverage ids | Layer · visual | Spine | g | Draft words |
|---|---|---|---|---|---|---|---|---|---|
| S00 | 0:00 | 0 Cold open | Nineteen cells | 1, 9 | (disclosure) | SPECIMEN · Run B seed on the void | stage | 0.02 | 90 |
| S01 | 0:38 | 0 | Flat, tall, flat, tall | 7, 1 | nakaya_diagram (posed), habit_flip_open | DIAGRAM · thermometer + schematic prism (ch7 `anim-alternation`) | witness | 0.02 | 120 |
| S02 | 1:28 | I What falls | Not frozen rain | 1 | deposition_from_vapour | DIAGRAM · sleet bead vs under-construction crystal (pilot A1, compressed) | witness | 0.04 | 100 |
| S03 | 2:10 | I | Crystal or flake | 1, 2, 9 | single_crystal_vs_flake | DIAGRAM · dark sleeve, hexagons fusing into clumps (ch1 `anim-aggregate`) | off | 0.04 | 80 |
| S04 | 2:43 | I | Nothing freezes at zero | 1 | deposition (seed, nucleation) | DIAGRAM · supercooling roulette (ch1 `anim-supercool`) | off | 0.04 | 100 |
| S05 | 3:25 | I | The one-way robbery | 1, 4 | supersaturation_vs_ice, deposition | DIAGRAM · droplet vs ice, 100,000 counter (ch1 `anim-budget`, pilot A8) | witness | 0.10 | 110 |
| S06 | 4:11 | II Why six | Six directions in ordinary ice | 3 | hexagonal_lattice_six | DIAGRAM · ice Ih stacking; ring exercise labeled ideal geometry | off | 0.10 | 110 |
| S07 | 4:57 | II | Kepler's question, Barnes's film | 2, 3 | instruments_change_questions, statics_vs_dynamics | ARCHIVE · Kepler 1611 title page; DIAGRAM · diffraction spots (ch2 `anim-diffract`) | off | 0.10 | 80 |
| S08 | 5:30 | II | One solid, every crystal | 3, 1, 7 | facet_families, statics_vs_dynamics | DIAGRAM · labelled prism, plate↔column morph (ch3 `prism-anim`, ch7 `anim-aspect`) | witness | 0.10 | 110 |
| S09 | 6:16 | III The supply line | The halo | 4 | diffusion_supplies | DIAGRAM · hex-lattice depletion halo, 'hide the vapour' (ch4/6 `anim-diffusion`) | witness | 0.20 | 110 |
| S10 | 7:02 | III | Percentages are not grams | 4, 7 | supersaturation_vs_ice (numbers, ceiling) | DIAGRAM · vapour curves, surplus crest at −12 °C (ch4 `chart-vapour`, `chart-excess`) | off | 0.20 | 80 |
| S11 | 7:35 | III | The worst growers win | 5, 1, 3 | facets_are_slowest | DIAGRAM · blob condenses to a hexagon (ch5 `anim-slow-wins`) | witness | 0.28 | 100 |
| S12 | 8:17 | III | The attachment coefficient | 5, 4 | attachment_coefficient, field_surface_coupling | DIAGRAM · growth law card, three surface classes, facet-balance (ch5 `anim-facet-balance`) | witness | 0.35 | 120 |
| S13 | 9:07 | IV The runaway bump | Poke the flat ice | 6, 1 | branching_instability | DIAGRAM · one bump runs away (ch6 `anim-bump`); SPECIMEN · Run B crosses into branching | stage | 0.52 | 120 |
| S14 | 9:57 | IV | Ride the tip; order and chaos | 6, 7 | order_and_chaos | DIAGRAM · co-moving tip camera (ch6 `anim-tipframe`); seaweed control (`anim-diffusion` face-seeking ladder) | witness | 0.58 | 110 |
| S15 | 10:43 | IV | A snowflake is a diary | 8, 1, 2 | crystal_is_record, two_dials | DIAGRAM · route dragged across the map (ch8 `#journey`), six arms no telephone (`#six-arms`); SPECIMEN · capped-column replay | witness | 0.64 | 120 |
| S16 | 11:33 | IV | Some of it is about the ice | 8 | crystal_is_record (caveat), gg_automaton (seed) | DIAGRAM · rib planting (`anim-rib-replay`); sandwich split cutaway | off | 0.64 | 70 |
| S17 | 12:02 | V The map | Nakaya's freezer | 7, 2, 10 | nakaya_diagram | DIAGRAM · date card 12 March 1936; the redrawn diagram (`anim-nakaya`); three labs; free-fall windows | witness | 0.70 | 120 |
| S18 | 12:52 | V | Which face is stubborn | 7, 11, 12 | aspect_ratio_rule, habit_flip_open | DIAGRAM · aspect dial, equal coefficients un-flatten a plate, two face bars trading places | witness | 0.74 | 110 |
| S19 | 13:38 | V | The menagerie | 9, 2 | single_crystal_vs_flake, selection_bias | SPECIMEN · six named-type replays (MODEL); DIAGRAM · 35-box chart regrouping (ch9 `anim-fieldguide`) | off | 0.74 | 100 |
| S20 | 14:20 | V | One rule, four presets | 9, 6 | gg_automaton, two_alphas | DIAGRAM · one-layer G-G zoo (`anim-gg-zoo`); two-alphas card | witness | 0.74 | 80 |
| S21 | 14:53 | VI How we know | Four hundred years of looking | 2 | instruments_change_questions, selection_bias | ARCHIVE · Magnus, Descartes, Hooke, Bentley plates (rights rows); DIAGRAM · spend your plates (ch2 `anim-album`) | off | 0.76 | 110 |
| S22 | 15:39 | VI | The sensor that eats its reading | 10 | constructed_measurements | DIAGRAM · two thermometers (ch10 `anim-two-thermometers`), the crowding trap (`anim-why-l-1mm`) | off | 0.78 | 110 |
| S23 | 16:25 | VI | Counting flickers | 10 | constructed_measurements | DIAGRAM · fringe counter (ch10 `anim-fringes`); one run, two speeds | off | 0.79 | 70 |
| S24 | 16:54 | VI | Two lengths in, a protractor out | 9, 3 | four_kinds_of_line (the test) | DIAGRAM · 88.7 predicted vs 88.5 ± 0.5 (ch9 `anim-twin-angles`) | witness | 0.80 | 80 |
| S25 | 17:27 | VII The stickiness of ice | The lottery | 11, 5 | terrace_nucleation_barrier | DIAGRAM · islands flicker, one layer sweeps (ch11 `island-lottery`) | off | 0.80 | 90 |
| S26 | 18:05 | VII | One formula per face | 11 | attachment_coefficient, terrace_nucleation_barrier | DIAGRAM · barrier chart on a log axis (ch11 `barrier-chart`), −15 °C fingerprint | witness | 0.84 | 100 |
| S27 | 18:47 | VII | Fits, not laws | 11, 5, 12, 13 | parameters_are_fits, history_dependence | DIAGRAM · 0.7 vs 0.73 card; sagging prism ceiling; the −5 °C collision; Penn State fall (`anim-cm6-history`) | witness | 0.88 | 110 |
| S28 | 19:33 | VIII Why the shape flips | Fifty nanometres | 12 | sdak_dips | DIAGRAM · wide vs narrow terrace (ch12 `anim-crowding`); the loop that will not stop (`anim-esi`) | witness | 0.90 | 100 |
| S29 | 20:15 | VIII | Numbers written down by hand | 12, 13 | sdak_dips (status) | DIAGRAM · three numbers you can move (ch13 `chosen-numbers`); ×2 vs ×10 shortfall (`anim-esi-shortfall`) | off | 0.90 | 100 |
| S30 | 20:57 | VIII | A crossing is not a boundary | 12, 13 | crossing_not_boundary | DIAGRAM · input comparison and coupled growth; technical correction in reader notes | off | 0.92 | 100 |
| S31 | 21:39 | VIII | Fit, guide, or guess | 13 | four_kinds_of_line | DIAGRAM · four panels, same six dots (ch13 `epistemic-lines`) | witness | 0.94 | 80 |
| S32 | 22:12 | IX The frontier | A handful of souls | 13 | instruments_change_questions | DIAGRAM · open-clock bar race, confidence map ending on the skin (ch13 `open-clock`, `confidence-map`) | witness | 0.96 | 100 |
| S33 | 22:54 | IX | What a model leaves out | 13, 12, 5, 4, 9 | stated_omissions | DIAGRAM · represented, parameterized, omitted; effects still to assess | witness | 0.98 | 80 |
| S34 | 23:27 | IX Handover | Finished | 1, 7, 13 | habit_flip_open (restated) | SPECIMEN · Run B completes, holds; then the hero's fall-away, beacon, snowfall | stage | 1.00 | 110 |

**Confidence treatment.** Identify observations, modeled illustrations and hypotheses when each
appears. The final recap distinguishes established foundations, measured/fitted inputs and open
surface questions; it does not assign a single badge to the whole film. Short-feed badge ratios
are not a reason to strengthen a scientific statement.

## Coverage reference for Part 2

The original editor's 29 ideas and proposed placements are retained for source navigation. They
are not 29 compulsory explanations or a measured account of audience comprehension. The essential
concepts above govern selection; technical details can become optional reading or Part 2 material.
These draft labels must remain scoped to the claim, including the review corrections below.

| Must-know id | Status (as the chapters label it) | Taught in | Reprised |
|---|---|---|---|
| single_crystal_vs_flake | established | S03 | S19 |
| deposition_from_vapour | established | S02, S05 | S04 |
| supersaturation_vs_ice | measured (Murphy & Koop); established | S05 | S10, S22 |
| two_dials | established; measured (the 45-minute schedule crystal) | S15 | S01, S18 |
| hexagonal_lattice_six | established (Barnes 1929); historical (Kepler) | S06 | S07 |
| facet_families | established; measured (a0, c0) | S08 | S18 |
| statics_vs_dynamics | open (kinetics); established (crystallography) | S07, S08 | S32 |
| diffusion_supplies | established; measured (halo photographs) | S09 | S13 |
| field_surface_coupling | established (feedback); model result (thin-plate inversion) | S12 | — |
| facets_are_slowest | established | S11 | S19 |
| attachment_coefficient | established | S12 | S26 |
| two_alphas | a naming rule the chapter states as its own | S20 | — |
| terrace_nucleation_barrier | established (theory); measured (−15 °C prism) | S25 | S26 |
| branching_instability | established; measured (tip traits); model result (seaweed) | S13 | S14 |
| order_and_chaos | established (split); model result (G-G's claim) | S14 | S16 |
| gg_automaton | model result | S20 | S16 |
| aspect_ratio_rule | established (rule); model result (un-flattening) | S18 | — |
| nakaya_diagram | historical; measured (boundaries); open (cold band) | S17 | S01 |
| habit_flip_open | open question | S18 | S01, S34 |
| crystal_is_record | established; measured (twins, ribs) | S15 | S16 |
| selection_bias | measured (automated cameras); established (argument) | S21 | S19 |
| constructed_measurements | measured; established | S22 | S23 |
| parameters_are_fits | model result (fits); measured (−5 °C); open (ceiling, collision) | S27 | S29 |
| sdak_dips | hypothesis (author's own word); model result (inferred regions) | S28 | S29 |
| crossing_not_boundary | corrected (computed; not a morphology theorem) | S30 | — |
| stated_omissions | stated model limitations | S33 | S27 |
| history_dependence | measured; hypothesis (interpretation) | S27 | S15 |
| four_kinds_of_line | established | S31 | S24 |
| instruments_change_questions | historical (interpretive thesis) | S21 | S07, S32 |

**Deliberately cut or reduced to a line**, from the editor's list and the chapters' own
"color" markings: rime, graupel and sleet taxonomy beyond one line (S02); "too cold to snow"
(one line in S05); D'Arcy Thompson; ice Ic, stacking disorder and twin planes; pyramidal facets
beyond the 28.0° mention; ventilation, latent heat and Nelson's sublimation study beyond their
line in S33; the FACET/CM7 table; Gibbs–Thomson; Koch curves and succinonitrile; the TAX1/TAX2
photographic matrices; the "no two alike" counting argument; classification-system counts beyond
the 35-box chart; riming stages and double-plate statistics; electric ice needles; screw
dislocations beyond one line; the −6/−8.4/−10.9 °C crossing history; the funding bar chart (the
quote survives). Revisit these cuts if the chosen Part 2 story needs one; this list is an editorial
choice, not a proof of which concepts every viewer will need. Retain the ice Ih stacking caveat
in S06 even if the wider ice-polymorph discussion stays optional.

## Scene records

Each record is the draft score entry for one scene: what it must teach, the narration beats in
order (not yet the words), the visual and where it comes from, the on-screen text and tags, the
sources with the chapters' labels, and what exists versus what must be built. Chapter and printed
page references are as the readers reported them from the chapters; WP1 re-verifies each against
the chapter text before the Rule 13 audit.

### Act 0 — Cold open

**S00 · Nineteen cells** (90 words · 38 s · g 0 → 0.02 · spine: stage)
- *Teaches:* the crystal on screen is a model, not a photograph; the film's promise.
- *Beats:* this is a snow crystal, nineteen cells of ice in a computer → it is not real, say so
  first, MODEL in the corner whenever it is on screen → ask how water builds a crystal → follow
  what has been learned and what remains uncertain. Use the revised scripted example below.
- *Visual:* SPECIMEN. Use the revised cold-open table as the current cue design: seed, explicit
  preview, return to the seed. Title: HOW A SNOWFLAKE IS MADE. The original timing above is a
  superseded allocation, not the production clock.
- *Tags/text:* `MODEL` from frame one; mono provenance line (lattice, seed, no noise, tick cap).
- *Sources:* run provenance from the site README "The Run B stage" and this repository's growth
  asset record; 19-site seed (AGENTS.md trap; ch3 bridge). Labels: measured (project artifact).
- *Exists:* `RunBHero` stage. *Build:* film clock mapping; the title.

**S01 · Flat, tall, flat, tall** (120 words · 50 s · g holds · spine: witness)
- *Teaches:* the mystery. Under specified growth conditions, the characteristic shape changes
  with temperature; observations are clearer than the full quantitative explanation.
- *Beats:* here is the puzzle that got me → near −2 plates, near −5 columns, near −15 plates
  again (the big stars), colder still the map says columns again, though that corner is the least
  trusted → same water, same ice, a few degrees apart → Nakaya mapped the pattern in the 1930s;
  proposed explanations now exist, but predicting the shapes remains unfinished → follow the
  growth and the experiments that made those explanations possible.
- *Visual:* DIAGRAM. Separate constant-condition plate/column examples follow the revised cold
  open, with the cold region hatched. Do not morph one crystal into a reversed growth history,
  score “3 flips,” or imply that no explanation has appeared since 1936. Preserve the source
  animation's schematic-aspect qualification.
- *Sources:* ch7 band boundaries −3.3/−9.9/−21.5 °C read ±0.5 (arXiv:1211.5555v1 Fig. via
  `anim-nakaya.js`); Libbrecht's ranges (arXiv:2012.12916v1 p. 1); cold end contested (Bailey &
  Hallett, ch7); "remains elusive" (ch1 printed pp. 16–17; ch7 printed p. 157). Labels: measured
  (boundaries), open (cause), open (cold band).
- *Exists:* ch7 inline script. *Build:* progress-driven port.

### Act I — What falls (chapter 1)

**S02 · Not frozen rain** (100 words · 42 s · g → 0.04 · spine: witness)
- *Beats:* freeze a raindrop and you get sleet, a grey bead → a snow crystal is built the other
  way: molecules arrive as gas and lock on, one at a time, no liquid step, deposition → the seed
  often begins as a frozen cloud droplet in the path described here; the chapter's illustrative
  budget makes that seed a small fraction of the finished crystal, not a universal ratio.
- *Visual:* DIAGRAM. Pilot A1 acts 1–2 compressed: the bead lands dead; beside it dots assemble
  a six-branched outline. Overlay GAS → SOLID = DEPOSITION.
- *Sources:* ch1 printed p. 17 (sleet, deposition), pp. 18–19 (seed 10–20 µm), seed fraction is
  the chapter's arithmetic. Labels: established.
- *Exists:* pilot A1 prompt. *Build:* the animation as a progress-driven component.

**S03 · Crystal or flake** (80 words · 33 s · spine: off)
- *Beats:* catch snow on a dark sleeve: a star sometimes, mostly splinters and grey clumps → a
  snow crystal is one continuous lattice; a "snowflake" can be hundreds of crystals that collided
  and stuck, and a clump has no symmetry of its own → this film is about the crystal.
- *Visual:* DIAGRAM. ch1 `anim-aggregate` as a scroll scene: outlined hexagons fall, the sky
  warms, they fuse into filled clumps; push into one outlined hexagon.
- *Sources:* ch1 printed p. 17 (quoted); ch9 Fig. 10.4 printed p. 388 (clumps far more common).
  Labels: established; measured (frequency).
- *Build:* port (fall speeds are the animation's device; caption kept).

**S04 · Nothing freezes at zero** (100 words · 42 s · spine: off)
- *Beats:* the visible cloud contains droplets → they do not all freeze when temperature crosses
  zero; many remain liquid below it, supercooled → freezing starts by nucleation, often helped
  by a speck → the chapter's examples span a range of nucleators and temperatures, not universal
  switch points → the nucleator helps set when growth starts and usually has little effect on
  the later design in the example being described.
- *Visual:* DIAGRAM. ch1 `anim-supercool`: sixty droplets, thermometer ticks to −40 °C,
  histogram fills; in-frame caption "spread illustrative — marked temperatures from the source".
- *Sources:* ch1 printed pp. 18–19 (nucleators), p. 59 (homogeneous nucleation). Labels:
  established. Preserve the chapter's "usually" qualifier; the pilot's absolute gloss is not used.
- *Build:* port.

**S05 · The one-way robbery** (110 words · 46 s · g → 0.10 · spine: witness)
- *Beats:* ice holds its molecules tighter than liquid water → air in balance with droplets is
  already oversupplied for ice; that surplus, measured against ice, is supersaturation, the word
  the whole film runs on → the droplets evaporate to feed the crystal: liquid → gas → ice, about
  a hundred thousand in the chapter's illustrative crystal budget → as the liquid droplets
  disappear, this mixed-phase transfer loses its liquid-water supply. Do not infer a universal
  temperature cutoff for snowfall from this mechanism.
- *Visual:* DIAGRAM. ch1 `anim-budget` as a time-lapse: droplet field consumed nearest-first,
  counter 0 → 100,000; pilot A8's side-by-side droplet vs ice. Run B witness grows to a small
  faceted plate in the corner.
- *Sources:* ch1 printed pp. 19–20 (Fig. 1.5, 100,000 droplets), vapour-pressure statement
  (section around Fig. 1.5, printed p. 19); ch4 Table 2.1 printed p. 57. Labels: established;
  measured (vapour pressures).
- *Build:* port; the A8 beat.

### Act II — Why six (chapters 3 and 2)

**S06 · Six directions in ordinary ice** (110 draft words · spine: off)
- *Beats:* a water molecule is bent → ordinary ice Ih has roughly tetrahedral oxygen neighbours
  arranged in a particular stacking → that stacking contains six-membered rings and six
  equivalent directions → local bonding alone does not uniquely select it; cubic stacking can
  share that local arrangement → the six belongs to the crystal structure.
- *Visual:* DIAGRAM. Label molecular bond angle and oxygen-neighbour angle separately, then
  reveal `anim-lattice`'s ice Ih stacking. If retained, `anim-why-six` is an ideal geometric
  exercise, not a unique derivation of ice Ih. A plane-tiling analogy is labeled as such.
- *Sources:* ch3 printed pp. 48–49 and its explicit ice Ih/ice Ic stacking caveat. Labels:
  established (structure); illustrative geometric model (ring exercise).
- *Build:* ports.

**S07 · Kepler's question, Barnes's film** (80 words · 33 s · spine: off)
- *Beats:* in 1611 Kepler asked why six and guessed cannonballs: right idea, wrong stack → the
  answer arrived in 1929 on X-ray film, 318 years later: six-fold spots → that settled how ice
  stacks; it said nothing about how a crystal grows, and that is the half still open.
- *Visual:* ARCHIVE candidate · Kepler, *Strena seu de Nive Sexangula* (1611) title page,
  exact item checked in WP3. DIAGRAM · ch2 `anim-diffract`: lattice angle slides 90° → 60°, four spots
  become six; a rebuilt negative turns 60° and lands on itself (Barnes's photograph itself is not
  shown).
- *Sources:* ch2 printed pp. 25, 28 (Kepler, Barnes 1929, Fig. 1.19); ch2 'Careful' callout
  (statics vs dynamics); ch2 printed p. 30 (kinetics 'a work in progress'). Labels: historical;
  established; open.
- *Build:* port; archive scan.

**S08 · One solid, every crystal** (110 words · 46 s · spine: witness)
- *Beats:* begin with a simple ice Ih hexagonal prism: two basal caps, six prism
  sides → stretch it, a column; squash it, a plate; height over width usefully summarizes that
  simple prism's habit → the lattice does not by itself decide plate or column, because
  these ice Ih plates and columns share that lattice → their relative growth is decided at
  the growing surface. Habit is more than one number for irregular or polycrystalline forms.
- *Visual:* DIAGRAM. ch3 `prism-anim` labelling pass (basal, prism, c-axis, a-axes), then ch7
  `anim-aspect` on a log dial 0.01 → 20. The Run B witness is a small hexagonal plate at this
  point, which the narration may point at.
- *Sources:* ch1 Fig. 1.7 printed p. 20; ch3 printed pp. 50–53 (facet families, a0 = 0.452 nm,
  c0 = 0.736 nm); ch7 printed p. 111 (aspect ratio), pp. 113–114 (0.01, 20); ch3 closing handoff.
  Labels: established; measured (lattice constants).
- *Build:* ports.

### Act III — The supply line (chapters 4 and 5)

**S09 · The halo** (110 words · 46 s · g → 0.20 · spine: witness)
- *Beats:* nothing steers vapour to the crystal; molecules random-walk in → the crystal eats the
  air around it, leaving a depleted halo → the halo re-forms in about
  50 milliseconds at the chapter's example scale, much faster than the ice changes, staying close
  to the outline → it has been photographed as a clean moat in a fog of droplets; its edge is a
  contour of an invisible humidity field.
- *Visual:* DIAGRAM. `anim-diffusion` with the field shown: seed, halo blooms, 'hide the vapour'
  reveal; a rebuilt moat (droplet speckle outside a contour), never the photograph.
- *Sources:* ch4 printed p. 76 (diffusion), p. 92 (timescale, D ≈ 2e-5 m²/s), Figs. 3.3, 9.16,
  9.17 (moat) printed pp. 78, 345–346. Labels: established; measured (photographs).
- *Build:* port; the moat rebuild.

**S10 · Percentages are not grams** (80 words · 33 s · spine: off)
- *Beats:* below zero there are two curves, ice and supercooled water; the gap is the surplus →
  as a percentage it climbs all the way to −40; in grams it crests near −12 and collapses; 47 %
  of almost nothing is almost nothing → so the vertical axis of the map has a ceiling, the water
  line, arched over the warm half.
- *Visual:* DIAGRAM. ch4 `chart-vapour` and `chart-excess` (Murphy & Koop formulas shared with
  `anim-nakaya.js`), scrubber lands on −12.3 °C.
- *Sources:* ch4 Table 2.1 printed p. 57, Fig. 2.14 printed p. 58, crest computed at −12.3 °C
  ('How we know' callout); ch7 water line. Labels: measured; established.
- *Build:* port.

**S11 · The worst growers win** (100 words · 42 s · g → 0.28 · spine: witness)
- *Beats:* molecules stick to rough patches and mostly bounce off flat ones → rough patches race
  outward until they collide and vanish from the outline; the slow flat faces are what is left →
  you see flat faces because they are the worst at growing; nothing chose the hexagon, it
  survived → this is a story about growth rates; the chapter's equilibrium-shape estimate is
  slow compared with the growth process being described, rather than a universal cloud clock.
- *Visual:* DIAGRAM. ch5 `anim-slow-wins`: scroll sets the facet speed ratio, a hexagon condenses
  out of a lumpy blob, the seed left as a ghost; per-segment sticking bars (Fig. 1.8 rebuild).
- *Sources:* ch1 Fig. 1.8 printed p. 21; ch5 printed p. 46 and pp. 59–65 (energy argument killed
  three ways; eight days). Labels: established.
- *Build:* port.

**S12 · The attachment coefficient** (120 words · 50 s · g → 0.35 · spine: witness)
- *Beats:* put a number on stickiness: the fraction of arriving molecules that stay, 0 to 1 →
  growth speed = that number × a temperature-set speed × the spare vapour at the surface → three
  kinds of surface: basal terraces, prism terraces, both stingy; everything else rough, near 1 →
  corners get more vapour, yet a face stays flat because steps nucleate at the corners and crowd
  the centre: the product is the same everywhere → this is the surface half of the engine; the
  film will keep calling it the attachment coefficient.
- *Visual:* DIAGRAM. Typeset law card `v = alphaHK × v_kin × sigma_surf` (the project's spelling on
  screen, with a one-line "why the odd name" footnote deferred to S20); ch11 `anatomy` overlay
  tinting the three classes on a rendered crystal; ch5 `anim-facet-balance` break-and-heal.
- *Sources:* ch5 Eq. 3.8 printed p. 93; Fig. 4.3 printed p. 140 (three classes); printed p. 80
  and Fig. 3.4 (feedback). Labels: established (law, classes, feedback); model result (thin-plate
  inversion, Fig. 3.29).
- *Build:* ports; the law card.

### Act IV — The runaway bump (chapters 6 and 8)

**S13 · Poke the flat ice** (120 words · 50 s · g → 0.52 · spine: stage)
- *Beats:* the air next to a growing crystal is drier → any bump that pokes out reaches richer
  air, grows faster, pokes out further under the conditions illustrated → in this instability,
  small disturbances can grow rather than disappear → push a hexagon hard enough and the
  face centre runs out of stickiness to spend (the coefficient cannot pass 1), so the switch is
  abrupt, and all six corners cross together → watch it happen to the computer's crystal.
- *Visual:* DIAGRAM ch6 `anim-bump` (Libbrecht's 'grows slightly faster … sticks out even
  farther' read one clause at a time); then SPECIMEN: Run B takes the stage as its corners break
  into six arms, the tour's authored "Branching" beat.
- *Sources:* ch6 Fig. 3.6 and printed pp. 81–82; printed pp. 80–82 (ceiling of 1, abrupt); Fig.
  1.9 printed p. 21 and printed p. 83 (six corners). Labels: established. The Run B beat
  illustrates; the narration says "the computer's crystal does it too", never "here is the
  physics".
- *Build:* port; the stage handover.

**S14 · Ride the tip; order and chaos** (110 words · 46 s · g → 0.58 · spine: witness)
- *Beats:* lock a camera to a dendrite tip and the landscape freezes while ice flows past; a
  micron-wide point carving an arm thousands of times its size → diffusion alone would split
  that tip forever: turn the lattice's preference down in a simulation and you get seaweed → so
  two moving parts: attachment brings order, faceted and lattice-sharp; diffusion brings
  instability and chaos; more vapour tips it toward chaos → "diffusion picks the place; the
  surface decides the shape".
- *Visual:* DIAGRAM. ch6 `anim-tipframe`; `anim-diffusion` face-seeking ladder as four runs side
  by side (seaweed → star → crisp hexagon; Fig. 3.26 rebuild, never the figure).
- *Sources:* ch6 Fig. 3.22 printed p. 102 (Ivantsov), printed pp. 84–85 (tip ≈ 1 µm), Fig. 3.26
  printed p. 107 (anisotropy control, a simulation), order-and-chaos passage; ch7 printed
  pp. 114–115. Labels: established; measured (tip traits); model result (seaweed).
- *Build:* ports.

**S15 · A snowflake is a diary** (120 words · 50 s · g → 0.64 · spine: witness)
- *Beats:* a cloud has two knobs, temperature and spare vapour; Libbrecht grew a whole crystal in
  45 minutes by turning them on a schedule → a cloud does not hold still, so a real crystal drags
  a line across the map → during the deposition history illustrated, new growth extends the
  solid, retaining traces of earlier growth → a capped column is column-then-plate, readable from geometry alone → the
  six arms share similar conditions; they need no arm-to-arm signalling, and the fine
  sidebranches, seeded by chance, do not match.
- *Visual:* DIAGRAM ch8 `#journey` (route dragged across the redrawn diagram, run forward then
  backward: the plate has nowhere to go); `#six-arms` (shift one arm's clock). SPECIMEN: a capped
  column from the named catalog (`capped-columns-baseline`, MODEL) turned to show the join.
- *Sources:* ch1 Fig. 1.11 (45-minute crystal), Fig. 1.4 printed p. 18 (capped column), printed
  p. 21 and Fig. 1.10 (common history); ch8 printed pp. 21–23, Fig. 10.1 caption printed p. 383
  (constant conditions); ch6 printed pp. 83–84 (sidebranches). Labels: established; measured.
- *Build:* ports; the catalog replay on the stage (needs the growth-library `StageTour` path).

**S16 · Some of it is about the ice** (70 words · 29 s · spine: off)
- *Beats:* you can write on a snowflake: drop the humidity for thirty seconds and a rib is planted
  → but a model crystal held under weather that never changed split itself into two plates and
  wrote ridges between them: a forged two-act story → so reading a crystal gives a plausible
  scenario, not a log, and a model's realistic feature is not automatically physics.
- *Visual:* DIAGRAM `anim-rib-replay` cutaway; a cutaway sketch of the sandwich split (original,
  labelled after Gravner & Griffeath 2009 §7).
- *Sources:* ch8 printed pp. 125–126 and Fig. 3.53 (ribs); Gravner & Griffeath 2009 §§7, 9
  (sandwich). Labels: measured (rib recipe); model result (sandwich).
- *Build:* port; the cutaway.

### Act V — The map (chapters 7 and 9)

**S17 · Nakaya's freezer** (120 words · 50 s · g → 0.70 · spine: witness)
- *Beats:* a natural crystal shows you an answer but never the question → Nakaya stopped waiting
  for snow: a walk-in freezer at Hokkaido, a rabbit hair, the first synthetic crystal on 12 March
  1936 → years of growing and
  varying gave the map: plates, columns, plates, then a mixed cold band; boundaries read at −3.3,
  −9.9, −21.5 °C, give or take half a degree → three later laboratories redrew it and the
  alternation held; free-fall crystals put the warm boundaries within a degree or two with blocky
  crystals straddling each switch → the cold end is contested and the map assumes the weather
  holds still.
- *Visual:* DIAGRAM. Date card "12 March 1936" over the void (no rendered stand-in for the
  photograph); `anim-nakaya` redraw with the computed water line, scroll drives the probe; three
  schematic band ribbons (Hallett, Kobayashi, Yokoyama, Fig. 1.25 rebuild) and Takahashi's
  free-fall windows as translucent overlays; a hatched cold band.
- *Sources:* ch2/ch10 printed pp. 30–31 (Nakaya, 1936); ch7 boundaries table (arXiv:1211.5555v1
  figure via `anim-nakaya.js`, ±0.5 read error), Fig. 1.25 printed p. 32, Takahashi et al. 1991
  windows, Bailey & Hallett cold end, Fig. 10.1 caption printed p. 383. Labels: historical;
  measured; open (cold band).
- *Build:* ports; ribbons overlay.

**S18 · Which face is stubborn** (110 draft words · spine: witness)
- *Beats:* thin plates require much slower growth normal to the basal faces than to the prism
  faces; needles reverse that balance → in the equal-kinetics calculation described in the
  chapter, a thin plate thickens toward a block → explaining the map means explaining how the
  balance changes with conditions → proposed surface mechanisms address that problem, but a
  complete quantitative prediction is still unfinished.
- *Visual:* DIAGRAM. The aspect dial, then the named equal-kinetics calculation and two face
  bars. Caption the assumptions of the comparison; no universal claim that diffusion cannot
  produce any plate. End with “surface explanation still incomplete.”
- *Sources:* ch7 printed pp. 111–112 (extreme aspect ratios and comparable facet kinetics);
  printed p. 157; the account of active modeling in `docs/video-explainer.md`.
  Labels: established (direction of facet growth); model result (comparison); open (full account).
- *Build:* ports.

**S19 · The menagerie** (100 words · 42 s · spine: off; specimens on stage)
- *Beats:* there is no absolute classification and there never will be: seven kinds, or 35, or
  121 are the sizes of filing systems, not facts about snow → a crystal is a growth history, not a
  member of a category → published photographs are a biased sample; most snow is small clumps and
  worn crystals; cold clouds are mostly polycrystals → here are a computer's versions of some
  named types, grown by the same rules as the crystal in the corner; they are models, not
  specimens.
- *Visual:* SPECIMEN · six named-catalog replays on the Run B stage, one after another (hexagonal
  plate, stellar dendrite, fernlike stellar dendrite, simple needle, hollow column, sectored
  plate; `MODEL` tag and the type name on screen, with "model rendition" under it). DIAGRAM ·
  ch9 `anim-fieldguide` regrouping the 35 boxes; `anim-taxonomy` 41 → 80 → 121 → 35.
- *Sources:* ch9 printed p. 384 (quoted), Fig. 10.3 printed p. 387, Figs. 10.4, 10.7 printed
  pp. 388, 390; Bailey & Hallett polycrystal census. Labels: established; measured.
- *Exists:* 66 catalog `growth-v1.bin` files locally (`out/named-crystal-catalog/final-resolution-*`),
  the site's decoder, the growth-library tour. *Build:* asset selection and hosting decision
  (open question), stage sequencing.

**S20 · One rule, four presets** (80 words · 33 s · spine: witness)
- *Beats:* in 2009 two mathematicians built a toy: vapour diffusing across a hexagonal grid, a
  cell freezing once enough mass piles up next to enough frozen neighbours → a few numbers give
  plates, stars, blades, dendrites → the numbers carry no units; they are not temperatures → one
  warning before Part 2: this toy's threshold and the attachment coefficient are both written
  with the same Greek letter in the literature and are unrelated; this project spells them apart.
- *Visual:* DIAGRAM. `anim-gg-zoo` one-layer G-G with four presets as the viewer scrolls; the
  two-alphas card (`alphaHK` sticking probability versus `ggThreshAlpha` boundary-mass cutoff, a
  bare letter struck through).
- *Editorial option:* retain the contrast between a useful generative model and measured physical
  inputs; move the repository spelling card to optional reading or Part 2.
- *Sources:* ch9 (Gravner & Griffeath 2009 rule; knobs without units); ch5 naming rule ('Putting
  a number on stickiness'). Labels: model result; naming convention.
- *Build:* port; the card.

### Act VI — How we know (chapters 2, 10, 9)

**S21 · Four hundred years of looking** (110 words · 46 s · spine: off)
- *Beats:* people wrote down "six" for two thousand years before anyone asked why → Magnus's
  woodcut got one star among crescents and hands: one right shape among wrong ones is not a
  discovery → Descartes, no lens, described a capped column in 1637 → Bentley bolted a camera to a
  microscope in 1885 and shot for 46 winters, honest plates every one → and the album still lies
  about winter: expensive plates saved for the photogenic crystal make the rare look normal.
  Selection bias needs no fraud → instruments, not cleverer people, move the story.
- *Visual:* ARCHIVE · Magnus 1555 woodcut, Descartes 1637 figure, Hooke 1665 Micrographia plate,
  Bentley plates (each needs a passing rights row; any that fails becomes a DIAGRAM stand-in).
  DIAGRAM · ch2 `anim-album` "spend your season's plates" (pick six, develop, pull back to the
  untouched board); the instrument timeline ending on an empty tenth stop.
- *Sources:* ch2 printed pp. 24–27 (Magnus, Harriot, Descartes, Bentley), p. 27 (automated
  cameras), Fig. 1.15. Labels: historical; measured (selection); established (argument).
- *Build:* port; archive rows; timeline.

**S22 · The sensor that eats its reading** (110 draft words · spine: off)
- *Beats:* measuring humidity near growing ice is difficult → a chamber can instead use the
  temperature of an ice reservoir and the crystal substrate to calculate the fractional vapour
  excess → the difference of the two equilibrium densities is divided by the equilibrium density
  at the substrate → equal temperatures give zero in that ideal calculation; the experiment's
  zero setting still has uncertainty → unwanted crystals also consume vapour, so an apparently
  small amount of neighbouring ice can seriously change the inferred supply.
- *Visual:* DIAGRAM. The two-thermometer experiment, a normalized excess readout and a crowding
  reveal. If the twentyfold example is retained, label the chapter's roughly centimetre chamber,
  micrometre-scale crystal radii and consumption assumptions; do not make coverage alone its cause.
  Use a newly composed plot of the cited droplet-check relation, not a copy of Fig. 7.6.
- *Sources:* ch10 Eq. 6.1 (printed pp. 221–222), zero-setting uncertainty and droplet check
  (p. 255), and the worked chamber geometry (pp. 251–254). Labels: calculated under stated
  assumptions; measured (experimental check).
- *Build:* selected ports.

**S23 · Counting flickers** (70 words · 29 s · spine: off)
- *Beats:* thickness is measured with light as the ruler: two reflections going in and out of
  step; every full flicker is the same thickness step → growth read to nanometres per second, in
  a chamber pumped to a fiftieth of sea-level pressure so the crystal answers at once → one run
  gives two speeds, basal and prism; their ratio is the habit.
- *Visual:* DIAGRAM. ch10 `anim-fringes` scroll-locked counter; the one-sensor-one-clock filmstrip
  (Fig. 7.10/7.11 rebuild).
- *Sources:* ch10 printed pp. 228–229 (Eq. 6.3), pp. 255–260 (20 mbar, Figs. 7.8, 7.10, 7.11).
  Labels: established; measured.
- *Build:* port.

**S24 · Two lengths in, a protractor out** (80 words · 33 s · spine: witness)
- *Beats:* here is what a test looks like → the lattice has two measured lengths; from them an
  arrowhead twin's edges must meet at 88.7° → somebody put a protractor on a South Pole
  photograph: 88.5, give or take half a degree → prediction computed from stated inputs, laid
  beside an independent measurement with its uncertainty. Hold that shape; Part 2 is one long
  version of it.
- *Visual:* DIAGRAM. ch9 `anim-twin-angles`: two lengths typed in, the angle computed, the
  protractor bar slides onto the number line.
- *Sources:* ch9 printed pp. 52, 69–73, Fig. 2.30 printed p. 71 (88.5 ± 0.5). Labels: established
  (lattice constants); model prediction; measured.
- *Build:* port.

### Act VII — The stickiness of ice (chapter 11)

**S25 · The lottery** (90 words · 38 s · spine: off)
- *Beats:* a flat face has no step to grip; a landed molecule lives briefly and leaves → the face
  can only advance by winning a lottery: a chance island must exceed a critical size, about ten
  molecules across at one percent surplus, or it dissolves → mostly it loses; then one island
  clears the bar and a whole layer sweeps the face → that is why facets are slow, and why the
  barrier is a picture before it is a number.
- *Visual:* DIAGRAM. ch11 `island-lottery`: islands flicker and die; fuel down, the face stalls;
  fuel up, layers complete on a counter.
- *Sources:* ch11 printed pp. 138, 141–142 (R_crit, ~300 molecules). Labels: established.
- *Build:* port.

**S26 · One formula per face** (100 words · 42 s · g → 0.84 · spine: witness)
- *Beats:* the lottery collapses to one formula per face: the coefficient equals a ceiling times
  e to the minus barrier over surplus → the exponential is an amplifier: a barrier seven times
  larger, a coefficient a hundred times smaller; a lower barrier means a faster face → the
  fingerprint has been seen: one prism face at −15 °C, flat toe then a sudden sweep, barrier 3 % →
  two faces, two barriers, and which is lower can change with temperature.
- *Visual:* DIAGRAM. ch11 `barrier-chart` on a log axis with the cursor sliding past the barrier
  ("a dead face wakes up"); Fig. 4.4 rebuilt as an original threshold curve; two curves pinned
  with a crossing marker (labelled "input diagnostic", previewing S30).
- *Sources:* ch11 Eqs. 4.4–4.5 printed pp. 142–143, Fig. 4.4 printed p. 144 (−15 °C, σ₀ = 3 %),
  Fig. 4.5 caption (hundredfold example, ch12). Labels: established (theory); measured
  (fingerprint).
- *Build:* port.

**S27 · Fits, not laws** (110 draft words · spine: witness)
- *Beats:* barrier values come from growth measurements interpreted through a model → useful
  fits have a scope and uncertainty → the broad-facet comparison at minus five degrees uses
  small prisms near vacuum and low supersaturation; it favours plate-like growth under those
  conditions, unlike the familiar atmospheric column band → a levitation experiment in another
  laboratory infers a falling effective attachment coefficient from a fit to one crystal's
  growth → those observations invite questions about conditions and history, not a universal
  rule that every surface remembers in the same way.
- *Visual:* DIAGRAM. A measurement-to-fit sequence, explicit pressure/supersaturation labels,
  then the levitation example. The provenance-coloured parameter chart and 0.7/0.73 comparison
  are optional reader detail if the full set crowds the narration.
- *Sources:* ch11 printed p. 145, Fig. 4.5; its low-pressure/low-supersaturation qualification
  around Fig. 4.18 (p. 162); the explicitly fitted levitation example in its Penn State section,
  citing Pokrifka et al. 2020 and Harrison et al. 2016. Labels: measured growth, model-conditioned
  fitted coefficients, hypothesis (history interpretation), open (unexplained prefactors).
- *Build:* selected chart and ports.

### Act VIII — Why the shape flips (chapters 12 and 13)

**S28 · Fifty nanometres** (100 words · 42 s · g → 0.90 · spine: witness)
- *Beats:* the rim of a plate hundreds of microns across is a strip about 50 nanometres wide,
  fewer than 200 molecules, and that sliver decides the plate's entire sideways growth → the
  proposal: on an over-sharp corner, molecules slide down onto the strip; the door is unchanged,
  the queue at the door is longer; the effective barrier drops → but only in a narrow temperature
  band: basal near −4, prism near −14 → then a loop: faster face, narrower strip, lower barrier,
  faster face, until the plate is paper-thin. That is the proposed answer to flat, tall, flat,
  tall.
- *Visual:* DIAGRAM. ch12 `anim-crowding` (the lower strip shrinks 800 → 50 nm, layer-starts
  strobe); `anim-esi` loop lighting node by node, the plate thinning edge-on to a 1–2 µm floor.
- *Sources:* ch12 Fig. 4.9 caption and printed pp. 148–149 (w = √(8Ra)); Figs. 4.10–4.11 printed
  pp. 150–152; printed pp. 154–156 (ESI), Figs. 4.15–4.16. Labels: hypothesis (the author's
  'speculative', 'working hypothesis').
- *Build:* ports.

**S29 · Numbers written down by hand** (100 words · 42 s · spine: off)
- *Beats:* how sure is that? The dips were placed by hand, "judiciously chosen" to make the map
  come out right; the dip formulas are "completely ad hoc", in the author's words → three
  constants you can move: depth, centre, width; drag them and the crossings slide; snap back and
  they sit where they were written → work the mechanism forward from first principles and it
  comes up roughly fivefold short; the author says so → the plotted dip points are inversions
  through a model, not readings → badge for the act: HYPOTHESIS.
- *Visual:* DIAGRAM. ch13 `chosen-numbers` (0.87 / 4.5 / 0.07 under "written down, not
  derived"); `anim-esi-shortfall` two bars ×2 vs ×10.
- *Sources:* arXiv:2009.08404v2 p. 5; arXiv:2011.02353v1 p. 4; arXiv:2306.13087v1 pp. 5–6;
  arXiv:2012.12916v1 p. 9; Snow Crystals printed p. 152 and Figs. 4.26–4.27 printed p. 172.
  Labels: hypothesis; model-conditioned inference.
- *Build:* ports.

**S30 · A crossing is not a boundary** (100 draft words · optional technical depth)
- *Beats:* two barrier curves crossing is a comparison of model inputs → it does not by itself
  locate a plate-to-column boundary → the full attachment coefficients also depend on prefactors
  and surface supersaturation, while the growing shape changes its own surrounding field →
  predicting a shape requires those pieces to work together.
- *Visual:* DIAGRAM. Compare barriers, then full coefficients at a labeled shared surface
  supersaturation, then return to the three-dimensional growth problem. Crossing counts are an
  input diagnostic; do not present them as a morphology result.
- *Sources:* ch12's corrected Key idea; ch13 `anim-sigma0`; the correction in
  `research/libbrecht-figure-findings.md`. Label: conditional input comparison.
- *Reader/Part 2 note:* the project's retracted crossing-bound claim and frozen evaluator belong
  to its development story. They are not a general definition of how laboratory habit is known.
- *Build:* selected port.

**S31 · Fit, guide, or guess** (80 words · 33 s · g → 0.94 · spine: witness)
- *Beats:* the most memorable line on a science graph is often not a result; nine words in a
  caption tell you → four kinds of line: a measurement or an inversion through a model; a fit
  whose shape a person chose; an eye guide with no equation; a convenient shape with tuned
  numbers → papers say which in one skippable clause → asking where a curve comes from changes how much
  weight it can carry. These teaching categories are not the project's separate P1–P4 taxonomy.
- *Visual:* DIAGRAM. ch13 `epistemic-lines`: the same six dots, then a solid line, then a dotted
  one, then the dots vanish and a formula remains; the real caption words each time.
- *Sources:* Snow Crystals Fig. 4.26 caption printed p. 172; arXiv:2009.08404v2 p. 3 and Fig. 18
  caption. Labels: established.
- *Build:* port.

### Act IX — The frontier, and the handover (chapter 13)

**S32 · A handful of souls** (100 draft words · spine: witness)
- *Beats:* Libbrecht describes a small experimental field and difficult measurements → the
  growing surface remains a focus of the questions in these sources → useful explanations and
  open questions coexist → uncertainty can identify the next measurement worth making.
- *Visual:* DIAGRAM. A source-dated view of the field, then selected points on the confidence
  map. Avoid a race labeled “today” or a claim about everything scientists have ever imaged.
- *Sources:* Snow Crystals printed p. 41; arXiv:2012.12916v1 p. 11; ch13's listed open questions.
  Labels: attributed historical perspective; open questions in the named source set.
- *Build:* selected ports.

**S33 · What a model leaves out** (80 draft words · spine: witness)
- *Beats:* a model chooses what to resolve → this project's physical formulation couples vapour
  transport to a parameterized surface rule; pressure affects diffusion and some surface effects
  enter fitted inputs → heat transport, explicit surface motion and other processes remain
  omitted or simplified → their consequences need assessment before a quantitative claim.
- *Visual:* DIAGRAM. Distinguish “represented,” “parameterized” and “omitted/simplified.”
  Unassessed omissions read “effect not yet bounded,” never “carried as a systematic” by default.
  Keep this physical formulation distinct from the decorative G-G Run B replay.
- *Sources:* ch13's model-limit passage; ch11's premelting qualification;
  `docs/libbrecht-parameters.md` pressure-dependent diffusion; charter §§2.2, 2.6–2.7.
  Labels: stated implementation scope; unresolved error.
- *Build:* the card.

**S34 · What the crystal leaves us with** (110 draft words · g → 1.00, then handover)
- *Beats:* the computer's crystal completes → ordinary ice gives us the lattice, vapour supplies
  material, and surface growth and changing conditions shape the result → measurements and
  fitted descriptions explain parts of that story; important surface questions remain →
  the next challenge is to put a specified model together and compare its predictions with
  observations → the final crystal falls into the snowfield, carrying that question onward.
- *Visual:* SPECIMEN, tagged MODEL. Complete Run B, hold for inspection, then use the hero's
  fall-away and beacon handover. Show the established foundations and remaining questions
  together, without a whole-film SETTLED badge. The optional Part 2 card follows the payoff.
- *Sources:* ch1/ch7/ch13, current project claim limits and the Run B artifact record.
  Labels: model output; established foundations; fitted descriptions; open questions.
- *Exists:* the hero ending as an interactive sequence. *Build:* a version whose hero phases,
  camera, beacon and snowfall can be sought from film time; seeding alone is insufficient.

## Fully scripted scene: the cold open (S00 + S01)

This revised example supersedes the original 88-second allocation. Its timing is provisional,
with pauses inside the visual holds; it must be read aloud by the maker before recording.
The same words become semantic page text and reviewed timed captions. British spelling is used
on screen, as in the chapters. No sentence invents the maker's earlier beliefs.

**Editorial spine:** meet a computer-grown crystal, ask what shapes real ice, and promise a
journey through what experiments have taught us.

| TIME | VOICEOVER | ON SCREEN |
|---|---|---|
| 0:00–0:16 | This crystal grew inside a computer. Nineteen cells became a branching shape. Those are model cells, not individual molecules. But the question it raises belongs to real snow. | SPECIMEN, MODEL from frame one. Begin on the seed; a controlled reveal introduces the branching form as a brief preview, then returns to the seed before the continuous story begins. Caption the preview so it is not read as elapsed physical time. |
| 0:16–0:34 | How does water build something like this? A snow crystal grows as water vapour joins the ice. And the shape depends on the conditions around it. Change those conditions, and the result can look completely different. | Original DIAGRAM: vapour joining a simple crystal, then plate and column silhouettes. Hold a moment on the contrast. Title: HOW A SNOWFLAKE IS MADE. |
| 0:34–0:55 | Near minus two degrees, plates are familiar. Near minus five, columns. Near minus fifteen, plates again, including the great branching stars. Farther into the cold, the classical map shows columns again, although that region is more complicated. | Separate schematic examples under constant growth conditions; these are not one crystal reversing its past growth. Temperature in °C, specified supersaturation context, hatched cold region. No precise boundary or three-flip score is claimed. |
| 0:55–1:14 | Ukichiro Nakaya began mapping that pattern in the nineteen-thirties. We have learned a great deal since. There are measurements, models and proposed explanations. But putting them together to predict the changing shapes is still unfinished. | Original diagram of observations, then an experiment and a proposed surface mechanism. Label their different roles. The present-day statement is scoped to the film's reviewed sources. |
| 1:14–1:32 | I want to follow the water, from an invisible molecule to the edge of a crystal. Along the way, we will see what people managed to measure, what those measurements explain, and where the next questions begin. | Return to the Run B seed, MODEL visible. A quiet hold, then the first continuous growth cue leads into WHAT FALLS. Film time is a presentation clock; G-G ticks are not seconds in a cloud. |

**Fact-check for this example**

| Claim | Source and scope | Status |
|---|---|---|
| Run B begins with nineteen model cells and becomes a branching crystal | [Run B record](explore-gutcheck-growth-volume.md), “Full Run B bake — complete and independently validated,” and strict growth decoder; the seed is the canonical radius-2 seed. Verify the selected local asset identity in the prototype. | Project artifact; model output |
| Model cells are not individual molecules | Charter §1.3: mesoscopic cells; no molecular-scale interpretation of the replay. | Model definition |
| Snow crystals grow by deposition and depend on surrounding conditions | Ch1 `01-not-a-frozen-raindrop.html#not-a-raindrop` and `#no-blueprint`, printed pp. 17–23. Nucleation and later growth are distinguished in the following act. | Established mechanism |
| Approximate warm plate/column bands; complicated cold region | Ch7 `#alternation`, `#the-map` and `#cold-end-rewritten`, including supersaturation/constant-condition caveats. The diagram illustrates ranges, not measured aspect ratios or a continuous cooling experiment on one crystal. | Observed pattern; cold-end qualification |
| Nakaya's 1930s work | Ch2 `#nakaya` or ch10 `#bad-laboratory`, printed pp. 30–31. | Historical |
| Measurements and proposed explanations exist; the end-to-end account is unfinished | Ch7/ch11–13, `docs/video-explainer.md` active-modeling discussion and charter §2.7's reviewed-source scope. | Scoped account of progress and uncertainty |
| “I want to follow the water” | Authored invitation for the maker to narrate; no assertion about private biography. | Editorial voice |

**Runtime notes.** The preview is a separate explicit cue; after it the Run B history progresses
monotonically except when the reader seeks backward. Before any claimed branching transition,
inspect the actual asset frame. Use the same visual context for stage and witness. Reduced motion
shows selected static views; it neither replays the preview motion nor forces a scroll. Titles,
diagrams, labels and the return to the seed are driven by cue time in capture mode.

## Website runtime and build brief

Read-only review on 2026-09-15 inspected the website checkout at `6e2592c` on
`run-b-growth-stage`, cached `origin/master@adae4041ec32638b92afc159c5ee50d4770360c9` and
`origin/feature/growth-library@e8f82d0`. These are observed local refs, not a live remote check.
The [review](../reviews/film-part1-plan-review-2026-09-15.md) records code locations and limits.

### Page, controls and time

Use a new `/film/part-1` route with semantic article sections and one shared visual stage.
Keep the renderer persistent, not every scene's resources. On small screens or static reading,
place each scene's prose and descriptive still in reading order; keep the argument complete
when enhanced rendering is unavailable. Do not put the entire transcript into overlapping
opacity layers.

One controller owns film time and scroll writes. It has reading, playing, paused, seeking,
loading and ended states, with separate film/reader position ownership. Pausing or slider
seeking does not by itself establish a reader anchor. The draft score supplies these mappings:

- **Global film seconds ↔ scene/cue/local progress.** Use explicit cue intervals, including
  silence, titles, inspection holds and the ending. No overlapping or missing timeline spans.
- **Global film seconds ↔ audio clip/local seconds.** Per-act recordings have a global start
  offset, trim offsets and duration. Include approved silence in the assembled per-act media so
  the audio clock covers visual holds; use explicit inter-act offsets and seamless transitions.
  If a transition is audible or introduces a gap, assemble one continuous playback track.
- **Film seconds ↔ measured page anchors.** Compute layout after fonts and content are ready.
  Map within cue intervals in both directions. Distinct endpoints remain addressable even for
  a visual hold; avoid a many-times-to-one-position mapping that makes resume ambiguous.
- **Film seconds → Run B tick and camera pose.** Growth ticks are model chronology, not physical
  seconds. Authored time compression and the explicit opening preview are recorded in the score.

Read the audio clock while playing, using the global offset. The first play request comes from
an intentional user action; handle a rejected `play()` promise visibly without scrolling.
Buffering or a missing required visual pauses progression and shows a recoverable state.
A hidden tab pauses the film; returning offers resume. At the end, hold the final composition
and stop audio/scrolling without looping. Seeking to another act loads the appropriate clip and
visuals before resuming only if that was the user's selected state.

Wheel, touch, scrolling keys and scrollbar dragging release playback control before the next
automatic scroll write. Distinguish tagged programmatic scrolls, subpixel rounding and layout
changes from reader intent; a difference from last frame's Y alone is not the detector.
A resize/font change preserves film time in playback and recomputes anchors without scrolling
the film-owned page; reading mode restores only an actual saved reader scene/progress without
starting audio. Reduced motion
disables automatic scrolling and continuous scrubbing, including after a live preference or
persistent override change. Audio may accompany discrete still changes with reviewed captions.

Use the site's shared ticker and section-rect mechanism as an integration starting point.
The controller owns render scheduling; make its ordering with Lenis and the WebGL draw explicit
in code. Do not mix the canvas's independent animation loop with an exact capture driver.
Shortcuts are scoped to focused player controls and never intercept an editable field or native
reading keys elsewhere. Resume URLs use stable scene/act anchors and optional bounded time;
they never start playback automatically.

### Deterministic visuals and capture

The existing capture bridge is a foundation. Camera damping, hero phase transitions, beacon
sway, snowfall and some education simulations also hold state. A component must either evaluate
directly from cue time, or replay deterministic fixed steps from a known seed/checkpoint. For
stateful diffusion diagrams, choose a bounded precomputed sequence or deterministic replay cache;
an external progress prop alone does not implement reverse seeking.

A page capture acknowledgement covers the requested time, loaded asset identities, completed
worker results, fonts, diagrams, DOM overlays and final WebGL draw. Two painted frames or the
crystal clock alone are insufficient. A missing dependency fails the frame capture explicitly;
never encode a loading indicator as an accepted film frame.

**Initial export profile (production choice to prove in the prototype):** full-composition
1920×1080, 30 fps, 8-bit output through the compositor, with specified colour handling, timed
captions and 48 kHz audio assembly. The website's higher-precision path captures the crystal
canvas only; it does not establish high-precision DOM/diagram composition. A later resolution
or precision increase requires its own representative render and cost estimate, not a claim
borrowed from the canvas exporter. Retain score and asset identities, renderer/browser version,
frame count/rate, colour settings, audio offsets, caption sidecar and final media probe.
Render resumable scene/act chunks with exact frame ranges and common audio time, then assemble
and decode the result; verify that joins neither duplicate nor omit frames or speech.

### Assets, memory and presentation

Resolve Run B and selected catalogue recordings from the existing local files or governed NAS
catalogue and verify their recorded identities. The named catalogue and its scientific/source
bindings are already tracked in this repository; files being ignored in the website does not
mean they are unpreserved everywhere. Public hosting is a later deployment choice and does not
block a local prototype.

Measure download bytes, decoded CPU memory, GPU textures and render targets separately. Keep
current/next-scene assets in a bounded cache, evict obsolete entries, terminate finished workers
and dispose replaceable GPU resources. Prefetch by cue and readiness without keeping every
volume and canvas live. Inactive layers do no animation work. Missing optional visuals get an
honest static fallback while readable content remains available; required export visuals fail.

The reviewed website renderer exaggerates thickness and can decimate catalogue previews.
Record those choices in render notes. For a scene teaching aspect ratio or thickness, use
undistorted geometry or a clearly labeled separate schematic; do not let a MODEL tag silently
stand in for dimensional fidelity. Inspect actual seed, branching, column and final-crystal
views before assigning their cues.

### Integration and checks

Before edits in the website, inspect its worktrees, dirty state and current branch diff. Reuse
the film task worktree if present; otherwise isolate implementation from the existing hero work.
The reviewed library branch descends from the reviewed master and supplies `StageTour` and
column framing. Carry only needed, understood changes into the film branch after checking its
current state; this is an ordinary local dependency decision, not a requirement to merge another
agent's branch into master. Preserve existing routes and unrelated work.

The representative prototype covers:

| Boundary | Demonstration |
|---|---|
| Story and render | A sourced science diagram, crystal handover, text/labels and an ending cue at intended size; inspect the result visually |
| Manual reading | Forward/reverse scroll, act/scene links, reload/resume, touch and keyboard navigation without trapping focus |
| Playback | Intentional play; exact mapped seek/resume; reader takeover by wheel, touch, keys and scrollbar; act join and ended state |
| Failure and layout | Slow/missing asset, audio rejection/buffering, hidden tab, resize and late fonts; no unexpected scrolling or silent gap |
| Access | Phone portrait, enlarged text, reviewed caption layout, live reduced-motion change and complete no-WebGL/static reading |
| Export | The same representative cue times reached forward, backward, directly and after reload; inspect equivalent states under a declared renderer tolerance; decode a short audiovisual file including labels and ending |

Use focused tests for cue mapping, time/asset readiness, transport and seek state, the website's
typecheck/lint/build, and a live browser smoke plus sample export. State actual measured render
cost before launching a full-film export. These are product checks under Rule 6; exact
`npm test` and scientific gates are not default film checks. If later implementation touches
scientific readouts, evidence or solver behaviour, reclassify that specific change under Rule 6.

**Candidate diagram inventory.** WP0A/WP1 select what the story needs; WP5 does not port this
whole list. Selected components need directly evaluated or reproducibly replayed state, and retain
their source captions and limits: ch1 `anim-aggregate`,
`anim-supercool`, `anim-budget`; ch2 `anim-diffract`, `anim-album`; ch3 `anim-why-six`,
`anim-lattice`, `prism-anim`; ch4 `chart-vapour`, `chart-excess` (both on `anim-nakaya.js`'s
Murphy & Koop functions); ch4/6 `anim-diffusion`; ch5 `anim-slow-wins`, `anim-facet-balance`;
ch6 `anim-bump`, `anim-tipframe`; ch7 `anim-alternation`, `anim-aspect`, `anim-nakaya`; ch8
`#journey`, `#six-arms`, `anim-rib-replay`; ch9 `anim-fieldguide`, `anim-taxonomy`,
`anim-twin-angles`, `anim-gg-zoo`; ch10 `anim-two-thermometers`, `anim-why-l-1mm`,
`anim-fringes`; ch11 `anatomy`, `island-lottery`, `barrier-chart`; ch12 `anim-crowding`,
`anim-esi`, `anim-esi-shortfall`, `anim-cm6-history`; ch13 `chosen-numbers`, `anim-sigma0`
(mountAlphaHK), `epistemic-lines`, `open-clock`, `confidence-map`. New: the S02 sleet/deposition
compression of pilot A1, the S12 law card, the S16 sandwich cutaway, the S17 band ribbons overlay,
the S20 two-alphas card, the S21 instrument timeline, the S22 droplet-check plot, the S27
provenance-coloured parameter chart, the S33 omissions card, the S34 end card. Site pieces reused
as ATMOSPHERE: the `/hero1` snowfield and beacon glyph (already in the hero ending); `/zoo`'s
HexAct/PentAct only if re-scoped and tagged for S06.

**Archive items (WP3 rights rows).** Kepler 1611 title page (S07); Olaus Magnus 1555 woodcut,
Descartes 1637 figure, Hooke 1665 Micrographia plate, Bentley plates checked individually (S21);
optional USDA LT-SEM micrographs (S03 or S19). Not used under any framing: Barnes's 1929
photograph (its teaching idea becomes an original diffraction diagram), Nakaya's photographs
(date card only), every Libbrecht
figure.

## Steps

- [x] **WP0 — Original plan and requested review.** The initial plan is committed at `d7d1de7`.
      The review file records the complete diff assessment, corrections and evidence limits.
- [x] **WP0A — Representative film prototype.** Create the minimal internal score for the selected
      halo/corner sequence and Run B transitions, with source references and temporary timing;
      implement it in the website task branch. Exercise the runtime/check matrix above, including
      static reading and a short whole-composition export. Temporary audio is an engineering
      fixture, never a replacement for the maker's final voice. Resolve demonstrated feasibility
      problems before bulk diagram work.
- [ ] **WP1 — Full narration and draft score.** Write `docs/video/part1-script.md` in
      `TIME | VOICEOVER | ON SCREEN` form for the selected story, using stable scene keys.
      Complete `docs/video/part1-score.json` with exact source chapter revision/path/anchors,
      claim scope, prose/descriptions, visual and audio/caption references. Every factual beat
      has a source or is identified as interpretation. Cut/merge optional scenes; budget pauses,
      transitions and credits. Read aloud and keep the complete cut under one hour.
      Draft text/score are prepared; the checkbox remains open for the maker's aloud read.
- [x] **WP2 — Complete-script fact-check.** A non-author review under Rules 10/13 checks WP1
      against the sources and the repairs here. Resolve factual blockers before final narration
      recording; this plan review does not approve unwritten dialogue.
      The [complete-script review](../reviews/film-part1-script-review-2026-09-15.md) resolves
      the text check for its named hash; changed dialogue does not inherit that verdict.
- [x] **WP3 — Selected archive rights.** Record the exact item and reuse basis for each chosen
      archive asset. Replace unresolved candidates with original diagrams or omit them. This can
      proceed alongside script work and does not block a diagram-only prototype.
      No archive image is selected in the full draft: original diagrams and the identified
      project replay suffice. Reopen this item if an external image is introduced.
- [x] **WP4 — Expand the verified runtime.** Add the selected story to the shared stage and
      semantic article, keeping time, controls, loading and reduced-motion behaviour from WP0A.
      Import the identified score version and preserve existing website routes.
- [x] **WP5 — Selected visuals.** Produce the signature sequences first; adapt only the supporting
      diagrams the final story uses. Each preserves its source limits and has reversible state
      plus a descriptive static view. Review clarity and presentation at phone and film sizes.
- [ ] **WP6 — Maker narration and access tracks.** Record the fact-checked script in the maker's
      own voice; retain clean audio. Align actual clip durations and global offsets; review
      pronunciations, captions, VTT/SRT, transcript and essential visual descriptions. Recheck
      complete runtime including silence and credits.
- [ ] **WP7 — Full export.** Render the approved cue timeline in resumable chunks, assemble
      narration/captions on the same timebase, and inspect/decode the final output and joins.
      Record the recipe, identities, renderer and observed duration; it must remain under 60:00.

  - [x] Pre-narration visual viewing copy: complete timeline, provisional captions, full
    assembly/decode/frame-boundary verification and sampled visual inspection are recorded
    in [Complete visual-film outcome](#complete-visual-film-outcome).
  - [ ] Final voiced master: align the maker recording, retime as needed and repeat the
    affected output checks. The timing-only viewing copy does not discharge this item.

- [ ] **WP8 — Final product review.** Exercise the three performances with the actual content,
      obtain the maker's visual and narration review, and record what worked and what remains
      untested. Publication and public identities remain separate release work.

  - [x] Complete visual-film technical review/edit loop and product checks, with shared-session
    provenance and sampled-watch limits recorded in the complete review.
  - [ ] Maker visual/narration acceptance and final post-recording pacing/access review.

## Out of scope

- Editing `docs/education/**` in this task. Its chapters supply source material; the historical
  freeze is not a current blocker.
- Part 2's complete script and visuals. This film may prepare its questions while delivering
  its own science story.
- Solver, evidence, gate, charter, ADR or phase-state changes. Any claim newly exposed by a
  diagram or readout must retain its own scientific review and Rule 6 verification tier.
- Publication, upload, public `SCJ` allocation or NAS publication of new media. The internal
  draft score and local development asset resolution are in scope.
- Replacing the website's existing routes or index. The proposed film route is `/film/part-1`.
- AI-generated raster/video assets and Libbrecht figures. Generated visuals here are authored
  browser diagrams and identified model replays.

## Open questions

The following are remaining production inputs. The
[author-response notes for WP1](../reviews/film-part1-plan-review-2026-09-15.md#author-response-and-wp1-notes)
carry the accepted source-wording and editorial refinements; incorporate them during scripting.

- **Narration:** the maker's actual recording, comfortable delivery pace and pronunciation
  preferences are needed at WP6. Start with per-act clean tracks; the score supplies global
  offsets and the final export can use a continuous assembled track.
- **Archive selections:** use original diagrams until an exact selected item has a passing
  rights record. No historical image is necessary for the prototype.
- **Public hosting and release identity:** choose at publication. Existing local or governed
  replay files support development after identity checks; no new remote upload is implied.
- **Cue appearance:** WP0A inspected actual seed, branching and final frames. Full-story camera
  and growth cues still need selection; the inherited g column is a draft hint, not evidence.
- **Site integration:** dependency inspection and isolated implementation are complete as recorded
  below. Preserve the independent hero/library work; merging to master remains separate work.

## Review completion

The [review record](../reviews/film-part1-plan-review-2026-09-15.md) names the findings, applied
corrections, commands and limits. Planning revisions cover story selection, runtime budgeting,
the sample narration, scientific qualifications, score ownership, access, seekable visuals and
prototype-first production. At review completion the next step was WP0A; its executed result
and current production state are recorded below. The plan review itself did not approve final
narration, visuals or export.

## Execution record — 2026-09-15

The maker approved execution after the author-response addendum. WP0A started with the
[internal score](../video/part1-score.json); its cue timings and engineering audio are provisional,
not an approved narration recording. Sources are pinned to the pre-execution repository snapshot.
The original halo/corner diagram is an explicitly qualitative schematic, not a solver port
or new scientific readout. Existing source chapters and numerical code remain untouched.

A fresh website fetch confirmed the reviewed dependency chain. Film implementation is isolated
at `/Users/clipper/github/snowcrystal_website-film-part1`, branch `explore/film-part1`, starting
from `origin/feature/growth-library@e8f82d0`. That tip includes the reusable `StageTour` seam and
column framing over `origin/master@adae404`; the existing `run-b-growth-stage` checkout stays
unchanged. Website implementation is committed at `a9d18b3252ca0e456d478cdf23293cf175c5bd97`.
No remote branch is merged or published by this work.

Implementation choice: one exact, externally advanced renderer; pure cue-time diagrams and
ending particles; semantic article plus generated no-JavaScript fallback from the score; one
assembled timing-tone track for browser-clock and audiovisual-export checks. Final speech
remains the maker's. The route is `/film/part-1`. Product checks are focused clock/score tests,
website typecheck/build, the approved live browser matrix and a short full-composition export.
No scientific test suite or gate is launched for this presentation-only slice.

**WP0A result.** The [verification record](../video/part1-prototype-verification.json) copies
the browser/export reports and successful build/test output at write time. The website imports
the prototype score from `40e7891`, byte digest recorded in `src/film/score-origin.json`.
The source chapters bind published revision `929189b7ff0132fe288a562796812c68ec886840`,
verified byte-identical to the reviewed chapter snapshot. The replay is checked by its score
digest in the decoding worker before use. One audio clock owns playback; reader input and
hidden-tab events pause it, with no automatic restart. Reduced-motion/phone/no-WebGL modes
retain descriptive stills and the complete semantic article; a generated no-JavaScript page
contains the same argument. The diagram is visibly schematic and Run B remains unvalidated,
with its thickness styling disclosed.

Recorded checks: 6 focused timeline tests and 16 browser checks pass; the existing TypeScript/
Vite build exits 0 (existing large-chunk warning retained). A 180-frame montage spanning two
model/diagram boundaries and the ending decodes with both video and audio at exactly 6.000 s,
1920×1080/30 fps, 8-bit yuv420p/BT.709 and 48 kHz AAC. Its observed export wall time is 28.061 s.
Selected direct/reverse/reload samples are byte-identical on Chrome 153.0.8010.36 / Apple M4
Metal. The decoded replay uses 23,912,132 bytes; instrumented GPU allocation payloads total
85,290,704 bytes, excluding browser/driver/default-framebuffer/compositor overhead. These
numbers are copied from the named verification JSON, not estimates for the complete film.
Representative decoded MP4 frames were visually inspected; no narrated-film viewing is claimed.
Touch/visibility/scroll-key events were synthesized, not tested on real mobile hardware.

The [bounded non-author runtime review](../reviews/film-part1-runtime-review-2026-09-15.md)
records the discovered defects, repairs and no-remaining-blocker WP0A verdict. It distinguishes
the reviewer's own source/hash checks from the implementation agent's executed product checks.
A final live navigation smoke also returned from the film to the original homepage and Run B
page, exercised its FINAL control, and returned to the film. This was an observed navigation
smoke, not a full audit of the existing pages' content or behavior.

**WP1 draft and WP2 result.** [The full script](../video/part1-script.md) selects sixteen
sequences and incorporates the author-response refinements. Its separate `productionDraft`
member in the same score preserves the checked prototype playback fields. Draft statistics,
copied from that member and reproduced by `node scripts/build-part1-production-score.mjs --check`:
3,924 spoken words, 82 timed rows (64 spoken), 1,920 allocated speech seconds plus 200 explicit
silent seconds, 2,120 seconds total (35:20), and a maximum allocated row rate of 140 words/minute.
These are arithmetic on authored time slots, not measured maker delivery. The generator binds
the full script and review bytes, source revision/path/anchors and source scope; it rejects stale
identity, malformed timings/columns and score drift. Its default command prints the generated
member without writing files; apply changes as a reviewed patch, then use `--check`.

The [complete non-author source audit](../reviews/film-part1-script-review-2026-09-15.md) found
no recording-blocking factual issue. It independently checked the selected Run B payload's
nineteen-cell seed and reaffirmed the current script hash after metadata-only status changes.
WP2 text review is resolved; no aloud maker read or final recording has occurred, so WP1's read
criterion remains open. No external archive images are selected (WP3); original diagrams and
project replay supply the chosen visuals. WP4/WP5 expand this story on the checked runtime;
full visual production, actual narration/captions, full export and maker acceptance remain open.

Closeout checks for the documentation/score boundary: `node --check scripts/build-part1-production-score.mjs`,
`node scripts/build-part1-production-score.mjs --check`, `node scripts/lint-rule7.mjs`, and
`git diff --check`. These are not a scientific suite or phase-gate claim.

## Requested visual inspection — 2026-09-15

The maker described the prototype as “just okay” and requested actual visual inspection.
The [visual review](../reviews/film-part1-visual-review-2026-09-15.md) records live desktop/phone
observations, exported frame comparisons, reviewer context and limits. The technical checks
do not establish the desired cinematic quality. Revise the short prototype's attention hierarchy,
corner progression, cut continuity, ending composition and phone presentation before propagating
that pattern into the full story. No website or score changes were made in the inspection.
Keep the approved story/source contract and existing runtime; this is visual execution work,
not another scene-plan pass or an expansion of scientific claims.

The maker authorized these improvements. Execution now adds a score-owned camera track,
full-width watch presentation with deliberate reader takeover, progressive corner framing,
an in-renderer ending pullback and legible phone figures. The cropped opening detail is a
flash-forward within the unfinished model, then a cut to the seed; the final silhouette is
reserved for the return. Model/diagram handovers return to the same face-on scale and corner
orientation before switching representation. Narration and the inactive full-film draft are
unchanged. Verify focused transport/camera tests, build, the phone seek regression and new
captured shots; preserve the previous verification artifacts as historical records.

## Visual revision result — 2026-09-15

The [revision record](../reviews/film-part1-visual-revision-2026-09-15.md) documents the changes,
live desktop/phone observations, separate reviewers and limits. Website commit
`3e17dfa2bd35ac0386f89f6d11da77381ef71a2e` replaces the old split-playback composition with focused
watch/reader ownership, score-driven camera shots, progressive corner attention, matched cuts,
an in-renderer ending pullback and image-only phone figures. No narration or scientific claim
was revised. The full-film draft is imported as inactive metadata, not activated for playback.

The [new receipt](../video/part1-visual-revision-verification.json) copies 8 focused test passes,
18 browser passes, the successful typecheck/build and a decoded 6.000-second/180-frame
sample at 1920×1080/30 fps. Export wall time 27.784 seconds is limited to that sample.
Its 15 capture source digests were recomputed against the committed website and matched.
Earlier receipts remain historical; final verification paths are
`export/part1-visual-revision-checked/` and `export/film-visual-revision-final-verification/`
in the website worktree. The next implementation is WP4/WP5 on this improved runtime; maker
visual acceptance, aloud read and actual narration remain separate from the technical checks.

## WP4/WP5 opening-chapter execution — 2026-09-15

The maker accepted the improved prototype and asked to keep working. The next bounded product
slice is the first four sequences of `part1-score.json.productionDraft`: S00, S01, S02 and S05,
through its S05 endpoint. Build that actual opening chapter, not another technical demo or
an empty full-length timeline. Preserve the prototype as an explicitly selectable comparison
edition on the same film route; the default becomes the clearly labeled opening chapter.

Compile a separate `docs/video/part1-opening-score.json` from the reviewed sequence rows with
`scripts/build-part1-opening-score.mjs`. Bind script/review/source identities, copy the narration
verbatim, derive provisional sentence-sized captions and retain silent holds. Keep the full
`productionDraft.activeForPlayback:false`; selecting a prepared opening slice does not approve
unproduced scenes or the maker's unrecorded voice. Commit this score before importing it.

Implement original reversible diagrams for scale change, independent plate/column examples,
the qualified habit map, deposition versus frozen drop, crystal/aggregate/rime, supercooling,
and the liquid–vapour–ice relay. Use the existing persistent replay for the cropped opening
and seed. No completed model silhouette appears. Diagrams are qualitative; include the
same-temperature equilibrium comparison, ice-relative supersaturation wording, hatched cold
region, illustrative freezing timing, and attribution/scope for the large-crystal budget.
No measured boundaries, particle trajectories, rates or new physical readouts are invented.

Extend the checked watch/reader transport with edition and sequence navigation. Phone and
no-JavaScript reading get image-only static figures and real text. Keep maker narration pending;
the chapter's temporary timing track is an explicitly labeled fixture. Preserve the old
prototype's export and browser tests; add focused opening-score/transport checks and frame
samples of each new visual family, including reverse/reload and a short decoded export.
Run the product build, then asset capture, then live browser checks sequentially to avoid
development reload interference. Visually inspect desktop and phone output before closeout.

Done for this slice: the selected opening chapter can play, seek and read in order, with every
reviewed row represented, no placeholder visuals, correct source/model/diagram labels, checked
static access and an honest endpoint. Full-film expansion, actual narration and final export
remain later work under WP4–WP8; this is execution of the approved plan, not a new plan review.

## Opening-chapter outcome — 2026-09-15

The bounded S00/S01/S02/S05 slice is implemented and checked in website
`explore/film-part1@a1c7ed32d8acb8e468885405f31a34dab874fe15`. The default `/film/part-1`
plays the prepared opening; `/film/part-1/prototype` preserves the comparison and its independent
static page. The [implementation/visual record](../reviews/film-part1-opening-implementation-2026-09-15.md)
documents changes, non-author findings, repaired failures and limits. The opening score imported
from `aea24c1` remains separate from the inactive full production draft.

The [receipt](../video/part1-opening-verification.json) derives 520 seconds / 20 rows / 956 spoken
words / 56 provisional captions from the score, and records 13 focused tests, 8 opening browser
checks, 18 prototype browser checks and a successful TypeScript/Vite build. Its opening montage
decoded as 6.000 seconds / 180 frames at 1920×1080/30 fps, with 19.56-second sample export wall
time. All 19 recorded implementation hashes match. Repeated/reverse/reload samples pass the
unchanged exact-byte comparator under the named 2D software-raster/Metal-WebGL capture recipe.
These are product/sample checks, not whole-film performance or scientific-gate evidence.

The root inspected desktop and phone samples; a non-author source/visual pass confirmed the
hexagonal column, compact frozen-drop symbol, surface-attached rime, exhausted-liquid label,
qualified cold region and budget title. No maker voice was synthesized. No publish, merge,
solver or chapter change occurred. Continue at S06 after recording the next bounded production
slice; final motion polish, reader-copy polish, maker read/recording and full-film acceptance
remain open. The original prototype's earlier visual-acceptance uncertainty is superseded by
the maker's direction to keep it; this opening still needs its own maker viewing.

## Next prepared-film slice — 2026-09-15

The maker says “Keep going.” Continue the approved production, selecting reviewed S06, S11,
S09 and S13 from `docs/video/part1-score.json` `productionDraft` (520–1040 seconds, copied
from those sequence bounds). Do not rewrite narration or activate unimplemented later rows.
Compile a separate prepared-film score containing the opening plus these four sequences.
The prepared edition becomes `/film/part-1`; preserve the unchanged opening at
`/film/part-1/opening` and the prototype at `/film/part-1/prototype`. This prepared artifact
can grow in subsequent slices; do not create another edition per slice.

Original browser diagrams move through historical packing/diffraction ideas, the ideal ice Ih
oxygen sublattice, basal/prism faces, molecular terraces, slow-face survival by addition,
delivery and attachment, random walks and qualitative diffusion, the substrate-droplet
threshold principle, then corner amplification. Reuse Chapter 3's cited oxygen basis for
three-dimensional lattice geometry; distinguish oxygen-only structure from hydrogen placement,
macroscopic habit and the Run B model grid. Preserve low-to-high vapour labels and distinguish
net inward transport from outward growth. No synthetic experimental results or new physics.

Keep the opening's narration and rows unchanged; only its final visual theme changes from an
opening endpoint to a transition. Hold the model offstage after the seed; explicitly cut at
S13-04 to an inspected mid-growth branch (18,000–30,000 G-G ticks, art-directed camera), not
the completed silhouette. No physical time or measured field is inferred from this replay.

Root owns website edits and browser/build actions. A bounded delegate may compile the new
score in the authority repository; a read-only source check supplies visual constraints.
Implement all selected rows, inspect desktop and phone output, run focused edition/geometry/
transport tests and TypeScript/Vite build, then representative exact captures and a short
decoded export, then browser playback checks. Keep asset-writing jobs separate from playback
checks. These are product checks; no scientific suite, gate, publishing or narration synthesis.

Done for this slice: every selected reviewed row has a working, source-qualified visual and
reader representation; prepared/opening/prototype identity is checked; playback, seeking,
reverse/reload capture and static access pass. Record actual outcomes and remaining limits
before moving to S15. Maker viewing, full-film performance and final voice timing remain open.

## Prepared-film continuation outcome — 2026-09-15

The bounded S06/S11/S09/S13 extension is implemented at website
`explore/film-part1@834c7690cc46ec9da8cfae09344ce9814597e1f4`. The prepared score imported
from `a2c5555` now owns `/film/part-1`; the unchanged opening and prototype retain their own
routes. The [implementation/visual record](../reviews/film-part1-prepared-implementation-2026-09-15.md)
states reviewer provenance, actual inspections, repaired failures and limits. The
[receipt](../video/part1-prepared-verification.json) derives 1040 seconds / 40 rows / 1930 spoken
words / 113 captions from the selected score and records 21 focused tests, 9 prepared browser
checks, 8 opening checks, 18 prototype checks and successful TypeScript/Vite build.

Its final prepared export has 59 sampled still entries, unchanged exact repeated/reverse/reload
comparisons, and a decoded 6.000000-second / 180-frame sample at 1920×1080/30 fps. Sample export
wall time is 21.811 seconds; this is not full-film performance. All recorded implementation
digests match. The earlier editions' still exports pass, and wrong-edition capture is rejected.

Visual inspection tightened the return camera beyond the initial slice recipe while preserving
its ticks and explicit cut. A conflicting radial vapour wash was removed; the portrait reading
figures were recomposed. Late audio metadata now preserves the newest seek, and control-focus
scrolling no longer resets phone playback to the opening. The record distinguishes those actual
repairs from maker visual acceptance and final voice timing, which remain open. No publish,
merge, solver, chapter or scientific-gate work occurred. Continue at S15 in the same prepared
artifact after recording the next bounded slice; no repeat of the scene-plan review is required.

## Complete visual-film execution — 2026-09-15

Maker direction supersedes the earlier bounded-slice stopping point: “I do narration at the
end. Continue until all complete. Then run a review and edit loop.” Complete the remaining
reviewed S15/S17/S22/S25/S26/S28/S32/S34 and credits in the existing prepared edition. The
source for duration, row boundaries and dialogue is `docs/video/part1-score.json`'s bound
`productionDraft`; the narration and its source-review identity remain unchanged.

Implementation order:

1. Extend the prepared-score compiler through the final credits, preserving its existing
   opening and structure/branch cues. Build directly evaluated, reversible original diagrams
   for history, experimental inference, terrace nucleation, fitted response and hypothesis.
2. Finish the delayed complete Run B reveal, deterministic atmospheric handover, readable
   credits and sources. Retain the model disclaimer and thickness-rendering qualification.
   Keep hypothesis labeling visible before proposed mechanisms move. Adapt chapter navigation
   and static/phone reading for the complete content.
3. Inspect the actual complete sequence inventory and transitions in the browser and captured
   composition. Run a documented non-author source/runtime/story review, repair actionable
   findings, then repeat affected checks and visual inspection. Review provenance and limits
   must distinguish independent checks from shared-session review and maker acceptance.
4. Verify focused product tests, typecheck/build, playback/static/failure/access checks,
   exact representative forward/reverse/reload captures and decoded sample output. Measure
   export cost before launching a full-length, resumable 1080p/30-fps viewing export with the
   existing explicitly identified timing fixture and caption sidecar. Decode the assembly
   and check frame joins and under-one-hour runtime. Asset writers precede live playback QA.

Done for this execution: all reviewed visual sequences and credits are present; whole-film
review/edit findings are resolved or explicitly bounded; the full visual viewing copy and
reproduction record exist; the current-state record points to the final source/site identities.
Maker recording is deliberately last, not a blocker to this work. WP6 and the post-recording
retime/final voiced master remain maker-dependent production inputs; do not claim their
completion, or claim maker visual acceptance on the maker's behalf. WP7's viewing copy can
prove the full visual pipeline before voice exists, with its provisional status stated.
Publication, merges, solver changes and edits to source chapters remain out of scope.

### Implementation and review checkpoint

The full prepared artifact is compiled/imported from authority
`95c837678291014327af6b6970596d17dc244d22`. Its source is
`docs/video/part1-prepared-score.json` (SHA-256
`f9eb32fd6bbe8996b2d6842f4c8223ec7c4c4d6478f1f1b7e9d75967465ecc0f`):
the entire reviewed dialogue, sequence inventory and credits now play in the existing edition.
The original opening and prototype retain their separate scores/routes. WP4/WP5 are implemented;
the [complete review/edit record](../reviews/film-part1-complete-review-2026-09-15.md) documents
shared-session reviewer provenance, source/diagram repairs and root visual inspection.
The completed full-length export and final verification receipt are recorded below. WP6 and
maker acceptance stay open, as directed above.

### Complete visual-film outcome

The requested pre-narration execution is complete. The
[final receipt](../video/part1-complete-verification.json) binds the prepared score to website
implementation `9d181afb6937a1e91fb89091b3543091c5f46eb5` and final website documentation
revision `a0163d360bbd252b2cb442465c3e7b23d6c5500c`. It derives 2120 seconds, 82 rows,
3924 spoken words and 229 provisional captions from the identified score. All reviewed
sequences and credits are present; the original opening and prototype remain separate.

Root executed 27 focused tests, typecheck/build and the final 10 complete-film / 8 opening /
18 prototype browser checks, as bound by that receipt. Representative repeat/reverse/reload
captures compare exactly under the recorded renderer. The review/edit loop repaired drawing,
source-qualification, silent-hold, camera-clipping, context-health and export-failure issues;
the [review](../reviews/film-part1-complete-review-2026-09-15.md) preserves findings, failed
attempts, reviewer provenance and verification limits. These are product checks, not a
scientific gate or real-device accessibility certification.

The actual command, run in `/Users/clipper/github/snowcrystal_website-film-part1`, was
`FILM_OUT=export/part1-full-final node scripts/export-part1-full.mjs`.
`export/part1-full-final/report.json` records 63600 frames at 1920×1080/30 fps, 2120 seconds,
71 chunks with their first/last decoded frame pairs checked against the assembly, and
3158.362 seconds of render/verification wall time with two rendering workers. Full audio/video
decode and every frame's presentation timestamp/duration passed. The adjacent MP4 is
280575547 bytes, SHA-256 `17273d2a5f3d353f9c1e9f711b4b796992e66da03195b845878f0ad71f8dbf44`;
the caption sidecar and exact recipe identities are bound in the receipt. This is an 8-bit
timing-only viewing copy, not recorded narration or a 16-bit whole-compositor master.

Root inspected all 16 contact sheets containing 95 decoded MP4 samples, covering every scored
row plus selected cuts/fades/end states, and four repaired scenes at full frame size. The
bound `assembled-visual-inspection.json` records no blocking presentation defect in those
samples. This was not an uninterrupted 35:20 watch and does not imply maker acceptance.
The full MP4, sidecar and inspection artifacts are preserved as ignored local working output;
no NAS archival, backup or publication is claimed.

Next: maker viewing and aloud read/recording of `docs/video/part1-script.md`, followed by WP6
voice/caption alignment and any necessary retime. Export the voiced master into a new output
folder and repeat affected product/output checks against its actual identities. No further
visual implementation is required by this execution's done criterion; no push, merge, source
chapter change, solver change or publication occurred.

## Tried and rejected

- **Skip hidden draws and their health checks together.** Final prototype regression exposed
  capture accepting a diagram after loss of its persistent WebGL context. The draw path now
  checks resource health even when hidden rendering work is skipped; model and diagram seeks
  both execute the context-loss negative case.
- **A fixed far clipping plane during the final dolly.** The crystal vanished before the
  explicit fade. Prepared-only dynamic far-plane headroom fixes the shot; a captured-pixel
  sentinel rejects the retained bad frame and accepts the corrected one.
- **Restart a completed drawing for a silent hold.** Constant final progress now survives
  animated, reading and no-JavaScript evaluations. Silence is not a replay trigger.
- **Static thickness with animated interference, or a completing layer beyond its face.**
  Optical paths now share growing thickness; completed layers clip to the terrace footprint.
- **Trust the receipt's consumed filename, or wait indefinitely for encoder drain.** The full
  exporter derives chunk filenames, checks the actual bytes, and races writes against handled
  process completion. Real receipt substitution and early-exit cases fail closed.

- **Radial shading beneath a deformed field.** It encoded a different concentration pattern
  from the contours. Use neutral air and one ordered set of deformed qualitative contours.
- **A full-width mid-growth return.** It spent too much silhouette and diluted the branch
  question. The final prepared score tightens the camera while retaining the selected ticks.
- **Tiny landscape miniatures on phones.** Reading figures need portrait composition and
  reflowing labels, not simply a smaller film frame.
- **Assume visual readiness implies audio metadata.** A longer fixture exposed that race.
  Apply the latest chosen time when metadata arrives; test an intentionally delayed response.
- **Map watch-panel scrolling to the first article anchor.** Control focus and text reflow
  reset selected scenes. Reader mapping begins at the article, and control-focus motion is not
  reader intent. Check actual paused screenshots as well as earlier audio advancement.

- **Default GPU SVG rasterization as an exact capture recipe.** Sparse edge pixels changed
  on reload. Markup retention, geometricPrecision and image isolation did not alone fix it.
  The opening export pins 2D software rasterization while preserving Metal WebGL, and passes
  the original exact comparator. No cross-device pixel claim is made.
- **A shared Run B component name as an edition discriminator.** It selected opening stills
  for prototype static reading. Separate edition identification and a negative-control export
  check now prevent page/score/media mixing.
- **Pure balanced-word captions.** They left a dangling start of the next sentence. The
  generated opening uses sentence/clause-aware chunks without rewriting narration.
- **Updating restart status only after audio seeking.** It left the ended message visible
  during restart. Seek intent updates status immediately; obsolete ended events are ignored.

- **Treat a paused media time as a reader anchor.** Phone caption reflow jumped into the
  article. Explicit player/reader ownership now authorizes correction only for actual reading.
- **Hide a phone renderer with display:none before it is ready.** A diagram-first load had a
  zero-size rendering viewport and could not complete readiness. Visibility hides it while
  preserving its viewport.
- **Overlap asset-writing build/export jobs with live playback tests.** The development
  reload can interrupt the test. Final browser verification runs after those writers finish.

- **Treat functional checks as visual acceptance.** The maker's viewing and the requested
  visual pass exposed presentation defects the transport/export checks did not cover. Inspect
  the actual shots and reading experience before multiplying the diagram layout.

- **Assume the renderer is ready when its worker returns.** R3F mounts later; an explicit
  driver-ready handshake and texture-ready draw are required before capture acknowledgement.
- **Reuse the hero's near plane and root transition unchanged.** The former hid the seed;
  the latter caused reload sample differences. Exact film rendering owns these settings.
- **Join independently AAC-encoded sample clips.** Padding moved audio beyond the video end;
  cut the original continuous PCM fixture and encode the joined audio once.

- **Treat chapters or the original scene order as compulsory film structure.** Superseded by
  JTS-M009: use them as source material and edit for story and understanding.
- **Use the short-feed badge ratio or 60-percent reveal as a film rule.** Superseded in review.
  Those rules govern short-feed cadence; they do not justify an overall SETTLED film ending.
- **Preserve the original cold-open schedule.** Rejected in review: the spoken text exceeded its
  allocation, one row required rushed speech and another had a malformed table. The revised
  example is provisional until a table read.
- **Use the Chapter 1 pilot's V-series generated B-roll.** The maker chose browser-rendered
  originals. The A-series teaching designs remain candidate inputs with their qualifications.
- **Screen-record a wheel-scroll session as the film.** Render cue states at fixed frames;
  documentary timing must not depend on a person's scrolling or dropped display frames.
- **Make the exported movie the master.** The shared score and source package retain the
  editable content, timing and correction relationships.
- **Spend the whole Run B reveal and abandon it after the opening.** Keep it as a recurring
  story object, with a labeled preview if useful and room to disappear during dense diagrams.
  Its presence in every corner is not a requirement.
- **Assume timeline stretching is free.** The asset supports seeking, but the renderer, camera,
  snowfall and stateful diagrams require explicit time control and measured cost.
- **Reproduce a restricted historical photograph as a lookalike.** Use an original teaching
  diagram or date card. Source photographs and their expressive compositions are not the assets.
- **Let procedural atmosphere carry unverified scientific facts.** Re-scope any selected piece
  as an explicitly labeled diagram with supported conditions; otherwise keep it atmospheric.
- **One canvas/context and animation loop per scene.** Use a shared renderer with bounded live
  resources and semantic article sections. Do not replace readable prose with hidden overlays.
- **Treat a camera snap, seeded beacon or two painted frames as whole-film determinism.** Every
  visible layer and readiness dependency participates in capture; stateful diagrams and snowfall
  need direct evaluation or reproducible fixed-step replay.
- **Block local prototyping on public hosting or a merge to master.** Resolve local assets and
  integrate needed dependencies on the isolated task branch; public release decisions come later.
