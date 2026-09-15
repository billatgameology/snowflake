# Plan — Part 1 film: "How a snowflake is made" as a scroll documentary on Cryosphere

- **Phase:** Maker-directed Journey/media exploration, outside Phase 6 scope (precedents:
  [explore-journey-scroll-documentary.md](explore-journey-scroll-documentary.md),
  [explore-education-ch1-video.md](explore-education-ch1-video.md))
- **Status:** in progress
- **Started:** 2026-09-14
- **Last touched:** 2026-09-15 by Claude Fable 5.1 (`claude-fable-5-1`)

## Goal

Turn education chapters 1–13 — the science half of the course — into **Part 1 of the living
documentary**: one tall page on the Cryosphere website (`snowcrystal_website`, the sibling
repository) that opens with the Run B hero, can be read by scrolling or played with the maker's
recorded narration driving the scroll, and renders frame-exactly to a 16:9 film. Part 1 exists so
that Part 2 — the story of building a growth model in software, testing it against Nakaya's
diagram, and reporting the negative result — can be followed by someone who arrived knowing
nothing.

This plan is the first draft of Part 1's **narrative score** (media spec, "Living scroll
documentary"): the act and scene order, what each scene must teach and why Part 2 needs it, the
visual that carries each beat and where it comes from, the narration budget per scene, the tags
and confidence labels, and the runtime shape the website needs. The complete narration script is
the next deliverable, not this one; one scene is scripted here as the template.

Maker direction is preserved verbatim in the Journey transcript as `JTS-M008`
([TRANSCRIPT.md](../journey/TRANSCRIPT.md)), together with the four decisions the maker selected:
about 20–25 minutes; browser-rendered originals plus public-domain history, no Libbrecht figures;
the maker's own first-person narration at a smart-teenager level; scene plan plus one scripted
scene in this pass.

## Done when

No charter clause governs video production. This planning unit is done when:

- every idea in the must-know set (§"What Part 2 needs") is assigned to at least one scene, and
  every scene names its source chapters and the confidence label of each claim it carries, as the
  chapters label it;
- the scene table's narration budget sums to **3,000–3,700 words**, which at the Chapter 1 pilot's
  pacing of 2.4 words per second is 20:50–25:40 of playback;
- one scene is fully scripted in the house `TIME | VOICEOVER | ON SCREEN` format with its
  fact-check table, as the template for the rest;
- every visual is browser-rendered or a public-domain archive image with a rights row, and no
  Libbrecht figure appears anywhere in the plan;
- the website runtime section names, for scroll/read, watch/listen, and export, which mechanism
  carries it and whether that mechanism exists today or is a gap;
- `docs/PROGRESS.md` records the plan and the next media step; and
- the plan's interpretive content has had the author's skeptical pass. The full Rule 13
  adversarial fact-check audit is a named gate on the narration script (WP2) before any recording;
  it is not a gate on this plan.

## Approach

### One score, three performances

The media spec already settles the architecture: one versioned narrative score performed three
ways — scroll/read at the reader's pace, watch/listen after an intentional start with narration
driving the page, and a deterministic fixed-frame export. The scene records in this plan are the
draft score. Each carries a stable scene key, the chapter anchor it teaches, the source chapters
and claim labels, the narration beats and word budget, the visual state (layer, component,
driver), the on-screen tags, and its share of the film clock.

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
- The whole growth history is already scrubbable at any frame (the raymarcher holds every arrival
  tick), so scrolling backward is free.

Rules the spine obeys:

- A persistent **MODEL** tag whenever Run B is on screen, never removed for a beauty shot.
- The GROW IT rule from the series bible: the replay may only *illustrate* a claim the chapters
  independently establish. It never demonstrates a physical claim, and the narration never says
  "watch how the physics does X" over it.
- Growth is a monotone function of film progress: a table of `(scene key → growth fraction at
  scene start, at scene end)`. Scenes where the crystal is offstage hold the fraction constant.
  Cold open shows the seed; the crystal is finished at the end of the frontier act, so the
  branching act, the diary act, and the menagerie act each get a visibly different stage of it.
- The crystal is a stellar-dendrite-class plate at −15 °C-like conditions in the model's terms
  only. The narration may say "a computer's crystal"; it may not name a temperature for it.

### Four visual layers and their tags

| Layer | Tag on screen | What it is | Where it comes from |
|---|---|---|---|
| **SPECIMEN** | `MODEL` | Measured solver replays: Run B, and other assets from the growth library for the menagerie scene | This repository's growth assets, already decoded by the site's `growthAsset.ts` |
| **DIAGRAM** | `DIAGRAM` | Original animations that carry every quantitative and causal beat | The twenty education interactives (`docs/education/assets/anim-*.js`, project-original canvas code) ported to progress-driven components; the Chapter 1 pilot's A1–A13 designs compressed; new pieces listed per scene |
| **ARCHIVE** | `ARCHIVE` (photograph or drawing, dated) | Public-domain historical images, each with a rights row | Kepler 1611, Descartes 1637, Hooke 1665, Bentley plates checked individually, USDA LT-SEM micrographs (US government work); never a Nakaya photograph |
| **ATMOSPHERE** | none | The site's procedural rooms (the `/hero1` snowfield, the home lattice, the powers-of-ten dive, the museum rooms, the tiling zoo, the light room) | Already built; used for mood and transitions only |

An ATMOSPHERE piece never carries a fact. If a scene needs one to (the tiling zoo for "why not
five", say), the piece is re-scoped to the claim, given a `DIAGRAM` tag, and listed under that
layer. This is the education site's own rule — every interactive states what it encodes and where
its limits begin — carried into the film.

### Voice

First person, the maker, at the register of [video-explainer.md](../video-explainer.md): "when I
started I thought a snowflake was frozen rain." The "I" is the learner, not the builder; Part 1
stays about the science and the build is not narrated until Part 2. Scene openers use the hook
bank's native grammar — *you'd think X; it's the opposite* — because that is what the source
material says at every scale, not a device. The Chapter 1 pilot script is compressed, not
rewritten: its beats, its glosses, and its pre-flagged audit items carry over. Each act ends on a
confidence badge — `SETTLED`, `MOSTLY`, `HYPOTHESIS`, or `NOBODY KNOWS` — and the series bible's
3:1 ratio of settled to nobody-knows endings holds across Part 1.

### Scroll/read, watch/listen, export — concrete behaviour

These are the media spec's required behaviours made specific for this page.

**Scroll/read (the base performance).** Each scene is a tall section whose scroll budget is
proportional to its narration seconds, with a sticky full-viewport stage. Progress is computed from
the section's bounding rect on the shared ticker, exactly as the `/biography` cloud column does
today, and written to the stage — never to React state. The narration text is visible as readable
prose beside or beneath the stage, so the argument is complete with sound off and with animation
off. Audio never starts because the page scrolled. Chapter headings are real headings; every act
has a stable fragment anchor and a resume point.

**Watch/listen.** An explicit Play control starts the maker's recorded narration. A cue map —
narration time → film progress — drives the film clock, and the document scroll follows the clock
through Lenis so the reader sees the same page they would have scrolled to. Manual scrolling during
playback pauses the narration, leaves the page where the reader put it, and shows a "resume from
here" affordance that restarts the audio at the cue nearest the current scene. Keyboard: Space
plays and pauses, arrow keys step scenes, and focus is never moved by the player. Captions are the
narration text itself, already on the page.

**Export.** The site's capture bridge (`?capture=1`) already lets an offline renderer set a clock
to an exact time and wait for the painted frame. The film page exposes the film clock through the
same bridge; the export script steps it frame-exactly at a fixed rate in a purpose-made 16:9
composition with reader chrome hidden, and narration is assembled offline against the same cue
map. The render notes record the recipe, the detected renderer, and the settings, as the Run B
export notes do today. A screen recording of someone scrolling is not the film.

**Reduced motion.** On `prefers-reduced-motion`, the spine holds the finished crystal, every scene
resolves to its composed still, auto-scroll and continuous scroll-linked motion are disabled, and
the reading order, headings, prose, and sources remain complete. A persistent audience override is
offered.

### Where the build lives

- **This repository (authority):** this plan; the narration script and its fact-check table under
  `docs/video/`; the rights register; the Rule 13 audit record; the score records as they mature.
  Nothing under `docs/education/` is edited — the freeze holds; chapters are read, not changed.
- **The website repository (`snowcrystal_website`):** a new route for the film, the film runtime,
  the ported diagram components, the narration cue file and audio, and the export script. Its
  README gets one pointer to this plan; there is no second copy of the plan. Work starts from
  `origin/master` (which carries the 16-bit capture path merged after the hero), on one branch.
- The narrative-score manifest, `SCJ` numbering, and release identity are deferred until a
  release is proposed (numbering spec, "Living scroll documentary"): the choice between one
  synthesis entry and several freezes before numbers are assigned, and not before.

### Rights

- **No Libbrecht figure, crop, or adaptation.** All 139 figures the chapters cite are third-party
  research media (decision 0004) and stay out of the film exactly as they stay out of Git.
- **Public-domain archive images only**, each with a rights row: source URL, publication date,
  author death date where relevant, license statement, date checked, and who checked. A Bentley
  plate is checked as an individual image, not as "Bentley is public domain": his 1931 book is not
  yet clear in every jurisdiction, while Smithsonian-held plates and his pre-1929 publications
  are. An image without a passing row is a `DIAGRAM` stand-in until it has one.
- **USDA LT-SEM micrographs** are US government works and may appear with attribution (the social
  README already records this).
- **No AI-generated video or imagery.** The Chapter 1 pilot's optional V-series B-roll track is
  not used: the maker chose browser-rendered originals, and the site's identity is real-time
  rendering with no pre-baked frames.
- **Nakaya:** the morphology diagram is redrawn from the chapter's own `anim-nakaya.js` (a
  `DIAGRAM`, with its caveat that the boundaries are qualitative). Nakaya's photographs are not
  public domain and do not appear.

## How the source material was read

Thirteen independent readers extracted every load-bearing fact from chapters 1–13 with the
confidence label the chapter gives it, the figures and interactives each chapter uses, and what
Part 2 later calls back to; seven readers catalogued every visual panel on the Cryosphere site
(driver, fidelity, what it may and may not be used to claim); one assessed the site's runtime
against the film's needs; one story editor merged the extractions into 29 must-know ideas, a
43-edge prerequisite graph, and five candidate teaching orders (workflow `wf_0b937e68-061`,
2026-09-14; 22 agents, none failed; per-agent returns in that run's `journal.jsonl`). The
extractions are working material, not evidence: every claim below is re-cited to the chapter and
printed page the readers reported, and the narration script (WP1) re-checks each against the
chapter text before the Rule 13 audit.

**Order chosen: mystery first, then one crystal's biography, then the instruments, then the
open question.** Of the five candidate orders, the mystery-first opening (pose the plate–column
alternation as an unexplained map before teaching anything) and the single-crystal-biography spine
(the physics arrives when the crystal needs it: freeze, facet, starve, branch, record, land) were
merged, because the Run B crystal growing across the film *is* a biography and the maker's
Part 2 is the search for the answer to the mystery. The history chapter is split: Kepler and
Barnes serve the lattice act; Bentley, Nakaya and the modern chamber form the instruments act.
Pure chapter order was rejected: it reaches the map at minute twelve with no pull, and it teaches
the Gravner–Griffeath automaton before the nucleation barrier that replaces its surface rule.

## The film

Ten acts, 35 scenes, **3,480 narrated words** (summed from the table below on 2026-09-15),
24:10 of narration at the Chapter 1 pilot's 2.4 words per second, plus about 20 seconds of
unnarrated handover at the end: **≈24:30**. The budget sits inside the 3,000–3,700-word target.
Timecodes are planning values from the word budgets (per-scene seconds rounded, so the last scene
ends at 24:13 in the table); they lock at the recording session, keeping two placements: the
two-part engine lands at about 60 % of runtime (S14–S20), and the Part 1 badge sits inside the
final scene.

**Spine column.** `stage` = the Run B crystal fills the frame; `witness` = it is small and dim in
a corner, still growing, so the through-line never breaks; `off` = hidden while a diagram or
archive carries the beat. **g** = fraction of Run B's 70,000 ticks shown at the scene's end (the
mapping into tour seconds is `g × 13`; exact per-scene values are tuned in WP4 against the
crystal's actual look, but the monotone order is fixed here).

| Key | Start | Act | Scene | Ch. | Must-know ids | Layer · visual | Spine | g | Words |
|---|---|---|---|---|---|---|---|---|---|
| S00 | 0:00 | 0 Cold open | Nineteen cells | 1, 9 | (disclosure) | SPECIMEN · Run B seed on the void | stage | 0.02 | 90 |
| S01 | 0:38 | 0 | Flat, tall, flat, tall | 7, 1 | nakaya_diagram (posed), habit_flip_open | DIAGRAM · thermometer + schematic prism (ch7 `anim-alternation`) | witness | 0.02 | 120 |
| S02 | 1:28 | I What falls | Not frozen rain | 1 | deposition_from_vapour | DIAGRAM · sleet bead vs under-construction crystal (pilot A1, compressed) | witness | 0.04 | 100 |
| S03 | 2:10 | I | Crystal or flake | 1, 2, 9 | single_crystal_vs_flake | DIAGRAM · dark sleeve, hexagons fusing into clumps (ch1 `anim-aggregate`) | off | 0.04 | 80 |
| S04 | 2:43 | I | Nothing freezes at zero | 1 | deposition (seed, nucleation) | DIAGRAM · supercooling roulette (ch1 `anim-supercool`) | off | 0.04 | 100 |
| S05 | 3:25 | I | The one-way robbery | 1, 4 | supersaturation_vs_ice, deposition | DIAGRAM · droplet vs ice, 100,000 counter (ch1 `anim-budget`, pilot A8) | witness | 0.10 | 110 |
| S06 | 4:11 | II Why six | Five cannot close | 3 | hexagonal_lattice_six | DIAGRAM · bent molecule, ring proof (ch3 `anim-why-six`; `/zoo` acts re-scoped) | off | 0.10 | 110 |
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
| S30 | 20:57 | VIII | A crossing is not a boundary | 12, 13 | crossing_not_boundary | DIAGRAM · crossing count flickers 0–3 (`anim-sigma0` mountAlphaHK); 'structural, not numerical' struck through | off | 0.92 | 100 |
| S31 | 21:39 | VIII | Fit, guide, or guess | 13 | four_kinds_of_line | DIAGRAM · four panels, same six dots (ch13 `epistemic-lines`) | witness | 0.94 | 80 |
| S32 | 22:12 | IX The frontier | A handful of souls | 13 | instruments_change_questions | DIAGRAM · open-clock bar race, confidence map ending on the skin (ch13 `open-clock`, `confidence-map`) | witness | 0.96 | 100 |
| S33 | 22:54 | IX | What a model would have to leave out | 13, 12, 5, 4, 9 | stated_omissions | DIAGRAM · omissions checklist, each stamped 'carried as a systematic' | witness | 0.98 | 80 |
| S34 | 23:27 | IX Handover | Finished | 1, 7, 13 | habit_flip_open (restated) | SPECIMEN · Run B completes, holds; then the hero's fall-away, beacon, snowfall | stage | 1.00 | 110 |

**Act badges** (the series bible's terminal beat, once per act): I SETTLED · II SETTLED ·
III SETTLED · IV SETTLED · V MOSTLY (the map) and NOBODY KNOWS (the flip) · VI SETTLED ·
VII MOSTLY · VIII HYPOTHESIS · IX/Part 1: SETTLED, with one open door. Five settled endings
against one open question stated twice keeps the bible's 3:1 ratio, and every "nobody knows"
names which kind of open it is (S18: unexplained since 1936; S32: neglect as much as difficulty).

## What Part 2 needs

The 29 ideas the story editor found a viewer must hold to follow Part 2, each with its status as
the chapters label it and the scenes that carry it. Every idea is carried at least once; the
first-listed scene is where it is taught, later ones are reprises.

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
quote survives). Nothing on this list feeds Part 2.

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
  first, MODEL in the corner whenever it is on screen → when I started I thought I knew what a
  snowflake was → Part 1 is what it actually is; Part 2 is whether this thing deserves belief.
- *Visual:* SPECIMEN. Run B at tick 0, face-on, the 19-site seed; the first ticks fire on the
  last beat. Title rises: PART ONE · HOW A SNOWFLAKE IS MADE.
- *Tags/text:* `MODEL` from frame one; mono provenance line (lattice, seed, no noise, tick cap).
- *Sources:* run provenance from the site README "The Run B stage" and this repository's growth
  asset record; 19-site seed (AGENTS.md trap; ch3 bridge). Labels: measured (project artifact).
- *Exists:* `RunBHero` stage. *Build:* film clock mapping; the title.

**S01 · Flat, tall, flat, tall** (120 words · 50 s · g holds · spine: witness)
- *Teaches:* the mystery. Hold moisture still, cool the air, the shape flips three times; nobody
  has explained it since the 1930s.
- *Beats:* here is the puzzle that got me → near −2 plates, near −5 columns, near −15 plates
  again (the big stars), colder still the map says columns again, though that corner is the least
  trusted → same water, same ice, a few degrees apart → Nakaya mapped it in the 1930s; ninety
  years later, nobody can say why → everything in this film exists so you can read a computer's
  answer to that question yourself.
- *Visual:* DIAGRAM. A thermometer descends 0 → −35 °C; a schematic prism flattens, stretches,
  flattens, stretches; band labels appear as each is crossed; a "3 flips" counter; "1936" with a
  hairline running to today. Port of ch7's inline `anim-alternation` (schematic aspect targets,
  not measurements; the port keeps its caption).
- *Sources:* ch7 band boundaries −3.3/−9.9/−21.5 °C read ±0.5 (arXiv:1211.5555v1 Fig. via
  `anim-nakaya.js`); Libbrecht's ranges (arXiv:2012.12916v1 p. 1); cold end contested (Bailey &
  Hallett, ch7); "remains elusive" (ch1 printed pp. 16–17; ch7 printed p. 157). Labels: measured
  (boundaries), open (cause), open (cold band).
- *Exists:* ch7 inline script. *Build:* progress-driven port.

### Act I — What falls (chapter 1)

**S02 · Not frozen rain** (100 words · 42 s · g → 0.04 · spine: witness)
- *Beats:* freeze a raindrop and you get sleet, a grey bead → a snow crystal is built the other
  way: molecules arrive as gas and lock on, one at a time, no liquid step, deposition → the seed
  is the one exception, a frozen droplet, one part in a hundred thousand of the finished thing.
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
- *Beats:* a cloud is liquid droplets, not vapour → below zero none of them freeze; supercooled
  → freezing needs somewhere to start, a speck; pure water holds to nearly −40, dust about −10,
  silver iodide −4, some bacteria −2 → the speck picks the birthday, not the design.
- *Visual:* DIAGRAM. ch1 `anim-supercool`: sixty droplets, thermometer ticks to −40 °C,
  histogram fills; in-frame caption "spread illustrative — marked temperatures from the source".
- *Sources:* ch1 printed pp. 18–19 (nucleators), p. 59 (homogeneous nucleation). Labels:
  established. The "birthday, not design" gloss is pre-flagged in the pilot for audit.
- *Build:* port.

**S05 · The one-way robbery** (110 words · 46 s · g → 0.10 · spine: witness)
- *Beats:* ice holds its molecules tighter than liquid water → air in balance with droplets is
  already oversupplied for ice; that surplus, measured against ice, is supersaturation, the word
  the whole film runs on → the droplets evaporate to feed the crystal: liquid → gas → ice, about
  a hundred thousand of them per crystal → one line: when the droplets are spent, it is too
  cold to snow.
- *Visual:* DIAGRAM. ch1 `anim-budget` as a time-lapse: droplet field consumed nearest-first,
  counter 0 → 100,000; pilot A8's side-by-side droplet vs ice. Run B witness grows to a small
  faceted plate in the corner.
- *Sources:* ch1 printed pp. 19–20 (Fig. 1.5, 100,000 droplets), vapour-pressure statement
  (section around Fig. 1.5, printed p. 19); ch4 Table 2.1 printed p. 57. Labels: established;
  measured (vapour pressures).
- *Build:* port; the A8 beat.

### Act II — Why six (chapters 3 and 2)

**S06 · Five cannot close** (110 words · 46 s · spine: off)
- *Beats:* a water molecule is bent, 104.5°, five degrees short of the tetrahedral 109.5° → try
  to close a ring of oxygens at that angle: three, four, five all fail, five by one and a half
  degrees; six overshoots and folds into a chair → repeat the ring and you get a honeycomb with
  six equivalent directions → the six is in the stacking, not in the molecule.
- *Visual:* DIAGRAM. ch3 `anim-why-six` as a scroll-driven proof; then `anim-lattice`'s honeycomb
  spreading. The site's `/zoo` HexAct/PentAct (exact plane geometry) may carry the "five cannot
  close" beat if re-scoped and tagged DIAGRAM; it must not be presented as molecular.
- *Sources:* ch3 printed pp. 48–49 (bond angles, near-tetrahedral bonding); the ring argument is
  the chapter's own from that input. Labels: established.
- *Build:* ports.

**S07 · Kepler's question, Barnes's film** (80 words · 33 s · spine: off)
- *Beats:* in 1611 Kepler asked why six and guessed cannonballs: right idea, wrong stack → the
  answer arrived in 1929 on X-ray film, 318 years later: six-fold spots → that settled how ice
  stacks; it said nothing about how a crystal grows, and that is the half still open.
- *Visual:* ARCHIVE · Kepler, *Strena seu de Nive Sexangula* (1611) title page, public domain,
  rights row in WP3. DIAGRAM · ch2 `anim-diffract`: lattice angle slides 90° → 60°, four spots
  become six; a rebuilt negative turns 60° and lands on itself (Barnes's photograph itself is not
  shown).
- *Sources:* ch2 printed pp. 25, 28 (Kepler, Barnes 1929, Fig. 1.19); ch2 'Careful' callout
  (statics vs dynamics); ch2 printed p. 30 (kinetics 'a work in progress'). Labels: historical;
  established; open.
- *Build:* port; archive scan.

**S08 · One solid, every crystal** (110 words · 46 s · spine: witness)
- *Beats:* stripped down, every snow crystal is a hexagonal prism: two basal caps, six prism
  sides → stretch it, a column; squash it, a plate; one number, height over width, is the whole
  habit → the lattice fixes the six and every angle; it cannot say plate or column, because
  every ice crystal has the same lattice → that is decided at the growing surface.
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
  air around it, leaving a dried-out halo every molecule must cross → the halo re-forms in about
  50 milliseconds, thousands of times faster than the ice changes, so it is always there, glued
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
  survived → this is a story about rates, not the lowest-energy shape (ice would need eight days
  to settle; a cloud will not hold still for eight seconds).
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
  air, grows faster, pokes out further → a perfectly flat growing face is a valid answer to the
  physics that nature cannot hold, a pencil on its point → push a hexagon hard enough and the
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
  a line across the map → new ice only adds outside, so the crystal is a stack of moments,
  oldest in the middle → a capped column is column-then-plate, readable from geometry alone → the
  six arms match because they rode together; nothing passes between them, and the fine
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
  1936; the photograph exists, it has a date, and I cannot show it → years of growing and
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

**S18 · Which face is stubborn** (110 words · 46 s · g → 0.74 · spine: witness)
- *Beats:* a growing crystal ends up bounded by its slowest faces → so a thin plate needs the
  basal coefficient very much smaller than the prism one; a needle the reverse → diffusion can
  never make a plate: set the two coefficients equal and a plate un-flattens toward a block even
  while it keeps branching; surface energy is too even-handed → so flat, tall, flat, tall can only
  mean the two faces swap which is stubborn, three times, as the air cools → nothing in the settled
  physics says why. That is the open question, and it has been open since the map was drawn.
- *Visual:* DIAGRAM. `anim-aspect` dial with the "which face must be harder" verdict; the
  un-flattening plate (Fig. 3.30/3.29 idea, original); ch7 `anim-alternation` with the two face
  bars trading places three times; badge NOBODY KNOWS — "unexplained since 1936, in a field of a
  handful of people" (the kind of open is named).
- *Sources:* ch7 printed p. 111 (rule), pp. 111–112 (diffusion cannot yield extreme aspect
  ratios), 'Still unsettled' (arXiv:2011.02353v1 p. 1; printed p. 157). Labels: established
  (rule); model result (un-flattening); open.
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

**S22 · The sensor that eats its reading** (110 words · 46 s · spine: off)
- *Beats:* temperature is easy; humidity is not, because any sensor in a cold chamber grows ice
  and corrupts its own reading → so you construct it: frost on the ceiling at one temperature,
  the crystal on the floor at another, the difference of two saturated densities is the
  supersaturation; equal temperatures give exactly zero → check it with droplets: the line is not
  a fit, nothing to tune → the mistake that looks like nothing: stray crystals covering one
  percent of the floor pull the value down twentyfold; older growth data may be off a
  hundredfold.
- *Visual:* DIAGRAM. ch10 `anim-two-thermometers` (readout climbs from exactly 0.0 %); Fig. 7.6
  idea as an original droplet-check plot; `anim-why-l-1mm` causal chain ("20× too high").
- *Sources:* ch10 printed pp. 221–222 (Eq. 6.1), p. 255 (droplet check, zero hunt), p. 251
  (Eqs. 7.6–7.7, Fig. 7.2), p. 254. Labels: established; measured.
- *Build:* ports.

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

**S27 · Fits, not laws** (110 words · 46 s · g → 0.88 · spine: witness)
- *Beats:* where do the barrier numbers come from? Grow a prism, time a face, divide, fit; the
  curves are "little more than parameterized fits" → the same barrier is printed 0.7 % in one
  paper and 0.73 % in another: good to a few tens of percent, not three decimals → the prism
  ceiling sags below 1 above −10 °C with no explanation anyone accepts → and at −5 °C the broad
  facet numbers say plate, where the map says column: that should stop you → a second
  laboratory, weighing a levitated frozen droplet by the voltage that holds it, sees the
  coefficient fall tenfold as the crystal matures. The surface remembers.
- *Visual:* DIAGRAM. Two-panel σ₀(T), A(T) chart re-plotted from the closed forms in
  `docs/libbrecht-parameters.md`, provenance-coloured; "0.7 versus 0.73" card; `barrier-chart`
  with the −5 °C presets pinned under "plate in the column band"; `anim-cm6-history` fork; Penn
  State data card.
- *Sources:* ch11 printed p. 145 and Fig. 4.5; arXiv:1912.03230v1 pp. 3, 5; arXiv:1912.09440v1
  p. 11; Fig. 4.18 printed p. 162 (−5 °C); printed pp. 55, 146 (ceiling); Pokrifka et al. 2020,
  Harrison et al. 2016. Labels: model result (fits); measured (−5 °C data, levitation); open
  (ceiling); hypothesis (kinetics-transition interpretation).
- *Build:* chart; ports.

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

**S30 · A crossing is not a boundary** (100 words · 42 s · g → 0.92 · spine: off)
- *Beats:* it is tempting to read where the two barrier curves cross as where plates become
  columns → it is not: a crossing says only which barrier is lower at one shared surplus;
  restore the ceiling and the count of crossings depends on the surplus you chose → this course
  once claimed a "structural, not numerical" bound from crossing counts; an adversarial review
  found it invalid and it was retracted → habit belongs only to a complete three-dimensional
  forward run judged by a frozen evaluator. Remember that sentence; Part 2 is built on it.
- *Visual:* DIAGRAM. `anim-sigma0` mountAlphaHK: the σ_surf slider flickers the crossing count
  0, 1, 2, 3; the words "structural, not numerical" struck through on screen; the "Corrected"
  callout wording.
- *Sources:* ch12 Key idea; arXiv:2009.08404v2 p. 3 Eqs. 1–5; the correction recorded in
  `research/libbrecht-figure-findings.md`; retraction commit `5463e76` (Rule 6). Labels:
  corrected.
- *Build:* port.

**S31 · Fit, guide, or guess** (80 words · 33 s · g → 0.94 · spine: witness)
- *Beats:* the most memorable line on a science graph is often not a result; nine words in a
  caption tell you → four kinds of line: a measurement or an inversion through a model; a fit
  whose shape a person chose; an eye guide with no equation; a convenient shape with tuned
  numbers → papers say which in one skippable clause → Part 2 stamps every number it uses with
  one of those four.
- *Visual:* DIAGRAM. ch13 `epistemic-lines`: the same six dots, then a solid line, then a dotted
  one, then the dots vanish and a formula remains; the real caption words each time.
- *Sources:* Snow Crystals Fig. 4.26 caption printed p. 172; arXiv:2009.08404v2 p. 3 and Fig. 18
  caption. Labels: established.
- *Build:* port.

### Act IX — The frontier, and the handover (chapter 13)

**S32 · A handful of souls** (100 words · 42 s · g → 0.96 · spine: witness)
- *Beats:* the man behind most of these measurements calls it "forbidden research", "mainly just
  me and my credit card" → "typically, there are a handful of interested souls around the globe"
  → these questions are open because barely anyone has looked as much as because they are hard;
  difficulty and neglect look identical from outside → every one of them comes back to the last
  molecular skin of the ice, which nothing has photographed a molecule at a time → "we do not
  know" is a position; it says where to start.
- *Visual:* DIAGRAM. ch13 `open-clock` bar race (only "why six" ever closes); `confidence-map`
  orbit of one crystal, six markers, ending on the surface marker "the skin is the frontier".
- *Sources:* Snow Crystals printed p. 41; arXiv:2012.12916v1 p. 11; ch13 'places the account runs
  out'. Labels: historical (quotes); open.
- *Build:* ports.

**S33 · What a model would have to leave out** (80 words · 33 s · g → 0.98 · spine: witness)
- *Beats:* so suppose you tried to build one. You would solve vapour and nothing else → no latent
  heat, no wind from falling, no slushy skin, no molecules walking on the surface, no facet
  width, no pressure, no rime, no sublimation, no collisions, one fixed seed → none of that is
  automatically harmless; each has to be bounded or carried as a stated error → a model built
  this way can be wrong in ways it can name. That is the best thing about it.
- *Visual:* DIAGRAM. The omissions checklist card, each line stamped "carried as a systematic";
  `anim-aerodynamics` and `anim-qll` as one-beat inserts.
- *Sources:* ch4, ch5, ch9, ch12, ch13 stated-omission passages (ch5 'Scope before acronym';
  ch12 closing; arXiv:2306.13087v1 pp. 5, 7). Labels: stated model limitations.
- *Build:* the card.

**S34 · Finished** (110 words · 46 s · g → 1.00, then the hero ending · spine: stage)
- *Beats:* the computer's crystal is finished: 961,597 sites, each with the tick it froze on →
  everything you know now is settled science except one thing, and the film has been honest
  about which → so here is the exam: give a program temperature and spare vapour, nothing else,
  and ask it to grow flat, tall, flat, tall → this is what one program grew from a toy's rules;
  whether it grew the right thing at the right temperature is Part 2 → badge: SETTLED, with one
  open door → and then it falls, one flake among the rest of the weather.
- *Visual:* SPECIMEN. Run B completes and holds (the tour's 13 s mark), the resting turn; then
  the existing hero ending: the camera falls away, the crossfade to the beacon glyph, the
  snowfield fades in, the flake drifts down and off. Card over the snow: PART TWO · A MODEL THAT
  CAN BE WRONG. The MODEL tag stays until the crossfade.
- *Sources:* run provenance (site README, growth asset record); ch1/ch7/ch13 open question;
  ch13 handoff. Labels: measured (artifact); open.
- *Exists:* the whole hero ending; the beacon must be seeded (no `Math.random`) for export.
- *Build:* the end card; the beacon seed.

## Fully scripted scene: the cold open (S00 + S01)

The template for WP1. Timestamps are planning values at 2.4 words per second; ON SCREEN
describes layer, component, tags, and the film-clock state so the runtime can be built from the
row. British spellings on screen, as in the chapters.

**Editorial spine (one sentence):** the crystal you are watching is a computer's, said out loud
in the first ten seconds, and the reason it exists is a map nobody has explained since 1936.

| TIME | VOICEOVER | ON SCREEN |
|---|---|---|
| 0:00–0:09 | This is a snow crystal. Nineteen cells of ice on a hexagonal grid, inside a computer, about to grow. | SPECIMEN. Run B at tick 0 on the void, face-on, the 19-site seed filling about a fifth of the frame; nothing else. Tag `MODEL` top-right from frame one. Film clock `t = 0`, growth fraction `g = 0`. |
| 0:09–0:24 | It isn't real. I want to say that before anything else. No camera saw this. A program grew it, from a handful of rules, over about ten hours. Every time it's on screen you'll see the word MODEL in the corner. | The first ticks fire: cells attach at the six corners of the seed (`g` 0 → 0.01). The `MODEL` tag pulses once. Mono provenance line fades in beneath it: **Gravner–Griffeath model · 1200 × 1200 × 48 lattice · seed 1 · no noise · 70 000 steps**. |
| 0:24–0:38 | When I started, I thought I knew what a snowflake was. Frozen rain. Six sides. No two alike. Nearly all of that turned out to be wrong, or not what I thought it meant. So this is the first half of the story: what a snow crystal actually is, told well enough that the second half makes sense. | The tour camera drifts a few degrees (its authored pose near `t = 0`); the crystal is a small hexagonal outline now (`g` → 0.02). Title rises in the display face: **PART ONE · HOW A SNOWFLAKE IS MADE**. |
| 0:38–0:44 | And the second half is whether this thing — | — deserves to be believed. | Hard cut to DIAGRAM. Tag `DIAGRAM` top-right. A vertical thermometer on the left, 0 to −35 °C, marker at 0; a schematic hexagonal prism centre frame, blocky. The Run B crystal shrinks to a witness thumbnail bottom-left, still tagged `MODEL`, growth paused. |
| 0:44–1:03 | Here's the puzzle that got me. Hold the moisture still, and cool the air. Near minus two, ice grows flat plates. Near minus five, columns. Near minus fifteen, plates again — the big stars. And colder still, the map says columns again, though that corner of the map is the part people trust least. | The marker descends. The prism flattens to a wafer, stretches to a pencil, flattens, stretches (port of ch7 `anim-alternation`, schematic aspect targets). Band labels appear as each boundary is crossed: **PLATES · COLUMNS · PLATES · COLUMNS**, the last one hatched. Muted mono caption held under the prism: *schematic — encodes which habit each band produces, not a measured aspect ratio*. |
| 1:03–1:16 | Flat, tall, flat, tall. Same water. Same ice. A few degrees apart. Ukichiro Nakaya mapped this in the nineteen-thirties. Ninety years later, nobody can say why. | The four bands settle into a strip. A counter stamps **3 FLIPS**. A hairline draws from **1936** to a right-hand mark labelled **today**; the line stays open at the right end. |
| 1:16–1:28 | So everything in this film is here for one reason: so that when a computer sits that exam in Part Two, you can read its answer for yourself. | The strip fades. The prism cross-dissolves into the Run B seed, which returns to the stage (SPECIMEN, `MODEL`), and the growth resumes (`g` 0.02 → 0.04 into S02). Eyebrow for the next act fades in bottom-left: **01 · WHAT FALLS**. |

**Fact-check**

| CLAIM (as spoken) | ROW | CITATION | CONFIDENCE |
|---|---|---|---|
| The seed is nineteen cells on a hexagonal grid | 0:00 | AGENTS.md ("the canonical radius-2, thickness-1 seed has 19 sites; the paper's 20 is an erratum"); ch3 bridge (19-site sixfold seed) | measured (project artifact) |
| No camera saw it; a program grew it | 0:09 | Site README "The Run B stage": a Gravner–Griffeath solver run, 1200×1200×48 lattice, seed 1, no noise; 961,597 attachment events | measured (project artifact) |
| About ten hours | 0:09 | Site README: stopped on its 70,000-tick cap after 36,348 s of compute (10.1 h) | measured (project artifact) |
| A handful of rules | 0:09 | Ch 9: G-G automaton = vapour diffusion on a hexagonal lattice, a neighbour-count attachment threshold, hole filling (Gravner & Griffeath 2009) | model result |
| Frozen rain / six sides / no two alike as misconceptions | 0:24 | Ch 1 printed p. 17 (sleet vs deposition); ch 1 (stars are one type; columns near −5 °C); ch 8 printed pp. 42–44 ("alike" depends on the meaning) | established |
| Near −2 plates, near −5 columns, near −15 plates, colder columns; cold corner least trusted | 0:44 | Ch 7: boundaries read at −3.3, −9.9, −21.5 °C ± 0.5 (arXiv:1211.5555v1 figure via `anim-nakaya.js`); Libbrecht's ranges "platelike above −3, columnar −4 to −6, platelike −11 to −18, columnar below −30" (arXiv:2012.12916v1 p. 1); Bailey & Hallett cold-end revision (ch 7) | measured (warm boundaries, three laboratories); open (cold band) |
| Hold the moisture still: the diagram applies only to constant conditions | 0:44 | Ch 7/8: Fig. 10.1 caption printed p. 383 | established (source's own caveat) |
| Nakaya mapped it in the 1930s | 1:03 | Ch 2/10 printed pp. 30–31; first synthetic crystal 12 March 1936 | historical |
| Ninety years later nobody can say why | 1:03 | Ch 1 printed pp. 16–17 ("remains elusive"); ch 7 'Still unsettled', printed p. 157; arXiv:2011.02353v1 p. 1 | open question |
| "The computer sits that exam" | 1:16 | Gloss on Part 2's Phase 6 comparison (docs/PROGRESS.md, Phase 6 accepted negative finding); no scientific claim | gloss (audit: confirm the wording does not imply a result) |

**Runtime notes for this scene.** Growth fraction `g` runs 0 → 0.02 across S00 and holds
through S01; the witness thumbnail is the same canvas scaled, not a second WebGL context. Under
reduced motion S00 shows the finished seed still, S01 shows the four bands with four static prisms
side by side and the same captions. Under capture the title and eyebrow are driven from `t`, not
CSS transitions.

## Website runtime and build brief

The runtime assessment (workflow `wf_0b937e68-061`, `inventory:runtime-mechanisms`) read the
site's ticker, scroll, hooks, stage, hero, tour, capture bridge and export script on both the local
branch and `origin/master`. What it found, and what the film page therefore is:

| Need | Today | Mechanism / gap |
|---|---|---|
| Drive every scene from one page value | exists three times | The house idiom: tall section, sticky `h-svh` stage, one `onTick` reading the section rect into a ref. Gap: no shared page-progress store; Motion's `useScroll` was observed non-monotonic under Lenis and must not be used. |
| Auto-scroll at narration pace; detect manual scroll | **gap** | Per-frame `lenis.scrollTo(y, {immediate: true, force: true})` from the ticker (native instant scroll when Lenis is absent). Manual input: compare `window.scrollY` with the y written last frame, plus Lenis's `virtual-scroll` event; any discrepancy pauses narration. `stopScroll()` is a lock, not a detector. |
| Map the Run B tour clock to the film | exists | `TourClock {elapsed, playing, seekTo}`; everything is a pure function of `elapsed`, the whole history resident. Gaps: the camera has two damped states, so add a `snap` path; the R3F canvas runs its own rAF, so switch to `frameloop="never"` and step it with `advance(t)` from the site ticker; the resting orbit is unbounded past 16 s, so give the film a finite end. |
| Narration sync | **gap** | No audio playback exists. Use an `HTMLAudioElement` as the master clock in play mode, polled on the ticker (`timeupdate` is ~4 Hz). Play starts only inside the Play button's click handler (autoplay policy enforces the "never from scrolling" rule). COEP `require-corp` means the audio file must be same-origin. |
| Frame-exact export | exists for `/growth` | `?capture=1` installs `seek/renderedAt/frames`; the exporter's `seekExact` waits two painted frames. Promote to a page-level `__filmCapture.seek(t)`; force lazy gates open; freeze CSS transitions and wall-clock effects; seed the beacon; DOM-layer frames go through the compositor screenshot path. |
| Reduced motion | exists | Composed stills, Lenis absent, transitions zeroed. Decide that scrubbing survives (native scroll still drives the ticker) with `frameloop="demand"` on the crystal; Play jumps between cue positions. |
| Lazy mounting | exists by viewport | `useIsActive` with a 25 % margin. Gap: the 7.7 MB volume needs seconds to tens of seconds; start the growth worker at page mount and prefetch other heavy scenes by cue time, not proximity. Never unmount inside the sticky stage. |
| Chapter anchors and resume | **gap** | No hash routing. Resume by `?t=` or `#act`, restored into `film.t` with an instant scroll and `scroll-margin-top` for the fixed nav; never starts audio. |

**The page.** One route (proposed `/film/part-1`; promoting it to `/` is a later decision). One
tall `<section>` whose height is the sum of the scene budgets, wrapping one sticky full-viewport
stage. Every scene lives inside that stage as a layer (DOM caption blocks, 2D canvases, and one
react-three-fiber canvas for the Run B spine), toggled by opacity and visibility, never as
separate sticky sections, so there is one WebGL context for the crystal and one clock. A
module-level `film = { t, mode: 'scroll' | 'play' | 'still', lastY }` ref is written by exactly one
ticker subscription just above Lenis's priority: in scroll mode it inverts the cue table from the
section rect; in play mode it reads `audio.currentTime`, sets `t`, scrolls the document to
`y(t)`, and watches for manual input. Every scene is a pure function of `film.t`; the spine sets
`clock.current.elapsed = tourTime(g(t))` with `playing = false` and the snap flag. The cue table
is one strictly decoded array `[{ t0, t1, scene, sceneProgress }]` in the shape of
`sceneMotion.ts`'s captions, and it is the only mapping between seconds and page position in
both directions, so scrubbing backward lands on the frame playing forward produced.

**Branch and merge order.** Build on `origin/master` (PR #2's 16-bit capture path is there; the
local branch lacks it). The menagerie and capped-column replays need the growth-library branch's
`StageTour` generalisation (`makeLibraryTour`, columns framed by extent), so merge or rebase
`feature/growth-library` first, or cherry-pick `2ab1ce0` and `e8f82d0`; a film that edits
`GrowthStage` without that refactor conflicts with it later.

**Assets.** `public/growth/run-b-growth-v1.bin` (7.7 MB) plus the seven catalog replays the
scenes name (S15's capped column, S19's six types), each 0.2–10 MB and currently untracked
everywhere (the library README calls hosting an open decision). Narration audio per act.

**Diagram components (WP5).** Ported from the education interactives, each taking an external
progress value and keeping its original caption and limits: ch1 `anim-aggregate`,
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
photograph (rebuilt as `anim-diffract`), Nakaya's photographs (date card only), every Libbrecht
figure.

## Steps

- [x] **WP0 — This plan.** Framework, must-know set, scene table, scene records, one scripted
      scene, runtime brief, `docs/PROGRESS.md` entry; committed on `explore/film-part1-plan`
      (2026-09-15). Checks: `node scripts/lint-rule7.mjs` and `git diff --check`; the scene
      table's word sum and the 29-id coverage were recomputed by script before commit.
- [ ] **WP1 — Full narration draft.** `docs/video/part1-script.md`: every scene in the house
      `TIME | VOICEOVER | ON SCREEN` format, a fact-check table in which every factual beat carries
      a chapter and printed-page citation or is marked as the chapter's gloss, word count inside the
      budget, badges placed.
- [ ] **WP2 — Rule 13 adversarial fact-check audit** of WP1 by a non-author reviewer, a different
      model preferred (Rule 10), against the fact-check table and the chapters; repairs; script
      locked. No recording before this.
- [ ] **WP3 — Rights register** for every ARCHIVE item; any image without a passing row is replaced
      by its `DIAGRAM` stand-in.
- [ ] **WP4 — Film runtime on the website.** One branch off `origin/master`: the route, the film
      clock, scene sections with sticky stages, the Run B spine mapping, readable narration prose,
      fragment anchors, keyboard navigation, reduced-motion path. Verified in a real browser the
      way the site's own build record says it must be: navigate, scroll the stage into view, watch a
      live number move. Typecheck and lint are not verification for a WebGL page.
- [ ] **WP5 — Diagram components.** Port the education interactives the scene records name, build
      the new pieces, each driven by an external progress value and carrying its tag; each states
      what it encodes and its limits in its own copy, as the education originals do.
- [ ] **WP6 — Narration and watch/listen.** The maker records against the locked script; per-act
      audio and the cue map; the Play control, cue-driven scroll, the manual-scroll pause and
      resume, captions.
- [ ] **WP7 — Export.** Extend the Run B export script into a film export: fixed-frame render of
      the 16:9 composition through the capture bridge, offline audio assembly, a notes file with
      the recipe and the detected renderer.
- [ ] **WP8 — Review and record.** A skeptical read of the built page against the media spec's
      required behaviours for all three performances (each marked working, not implemented, or not
      tested); the maker's visual inspection; the review record with what was and was not checked.

## Out of scope

- Editing `docs/education/**` (frozen until Phase 6 closes). Chapters are read, not changed.
- Part 2 (chapters 14–33), its script, or its visuals; this plan only leaves the handover to it.
- Any solver, evidence, gate, charter, ADR, or Phase 6/7/10 change; any scientific claim beyond
  what the chapters already label.
- Publication, upload, `SCJ` allocation, the narrative-score manifest, or NAS publication of media.
- Replacing or changing the website's existing routes, including `/growth` and `/run-b-hero`; the
  film is a new route that reuses their components.
- AI-generated video or imagery; Libbrecht figures under any framing.

## Tried and rejected

- **Use the Chapter 1 pilot's V-series generated B-roll.** Rejected 2026-09-14: the maker chose
  browser-rendered originals, and the site's stated identity is real-time rendering with no
  pre-baked frames. The A-series diagram designs carry over; the V-series does not.
- **Screen-record a scroll session as the film.** Rejected by the media spec before this plan: a
  wheel-scroll recording makes browser chrome, scroll jitter, and dropped frames the pacing
  system. The export steps a clock frame-exactly instead, as the Run B export already does.
- **Make the exported movie the master.** Rejected by the scroll-documentary plan: corrections,
  responsive layouts, accessibility, and outlet-native hooks need the score and the source
  packages beneath the film.
- **Play the hero's 13-second growth as-is at the top and treat the rest as unrelated scenes.**
  Rejected in this plan: it spends the only continuous visual asset in the first minute and leaves
  twenty minutes without a through-line. Stretching the tour clock over the whole of Part 1 costs
  nothing (the history is fully scrubbable) and gives every act a visibly different crystal.
- **Tell the film in chapter order.** Rejected: the Nakaya map, the only pull the story has,
  would arrive at minute twelve, and the Gravner–Griffeath automaton would be met before the
  nucleation barrier that replaces its surface rule. Mystery-first plus a single-crystal biography
  respects every edge of the prerequisite graph (checked against the 43 edges in the map).
- **Drive the film from Motion's `useScroll`.** Rejected: the site's own `/hero1` page records it
  running non-monotonically under Lenis and computes progress from the section rect instead. The
  film uses the rect idiom in scroll mode and the audio clock in play mode.
- **Render a lookalike of Nakaya's 12 March 1936 photograph.** Rejected: a rendered stand-in for
  a specific historical photograph is a fake photograph whatever the tag says. S17 uses a date
  card and the redrawn diagram, and the narration says the photograph exists and cannot be shown.
- **Let the site's procedural rooms carry facts** (the `/kshow` Nakaya wall, the `/biography`
  cloud column's altitude and temperature bands, the `/storm` census). Rejected as fact carriers:
  their habit thresholds are hand-placed (`habitFromConditions`) and their numbers are authored,
  which the inventory confirms file by file. They are atmosphere only, or re-scoped and re-tagged
  as `DIAGRAM` with the claim narrowed to what they actually encode (the `/zoo` plane-tiling acts).
- **Show Barnes's 1929 X-ray photograph or any figure from the monograph.** Rejected on rights
  (decision 0004); the diffraction beat is rebuilt from ch2's `anim-diffract`.
- **Separate sticky sections per scene, each with its own canvas.** Rejected by the runtime
  assessment: browsers cap live WebGL contexts and the site never unmounts a mounted stage, so a
  35-scene page built that way accumulates contexts and rAF loops. One sticky stage, one crystal
  canvas, layers toggled by visibility.

## Open questions

- **Route name and whether the film becomes the site's index.** The maker called the hero "the
  main page of the education"; this plan builds the film as a new route and leaves promoting it to
  `/` as a later, separate decision.
- **Narration recording setup and per-act versus per-scene audio files.** Per-act is proposed for
  fewer cue seams; the maker's recording workflow decides.
- **Bentley plate rights, per image.** Deferred to WP3 with the rule above; nothing in the scene
  records depends on a specific plate passing.
- **Release identity** (one synthesis entry versus several) is deliberately not decided here.
- **Hosting for the replay assets.** Run B (7.7 MB) plus the seven catalog replays the scenes
  name (0.2–10 MB each) are untracked in both repositories; the growth-library README calls
  hosting an open decision (repository, bucket, or release asset). The menagerie scene cannot be
  built until it is made.
- **Merge order with `feature/growth-library`.** The film needs its `StageTour` path for the
  catalog replays; whether that branch merges to master first or the film branch carries the two
  commits is the maker's call before WP4 starts.
- **The cold-end line in S01 and S17.** "Colder still, the map says columns again, though that
  corner is the least trusted" is the proposed wording that respects Bailey & Hallett; the Rule 13
  audit should confirm it neither asserts nor denies the classical cold band.
- **Per-scene growth fractions.** The `g` column fixes the monotone order; the exact frames at
  which the plate looks like "one solid" (S08) and the corners break (S13) are read off the Run B
  radius envelope during WP4, not from this table.
