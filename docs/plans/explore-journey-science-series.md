# Plan — Snow Crystal Journey: a question-led science series

- **Phase:** Maker-directed Journey/media; no scientific phase or gate change
- **Status:** separate series home and Episode 1 implementation authorized and in progress; previous film preserved
- **Started:** 2026-09-15
- **Last touched:** 2026-09-15 by OpenAI Codex (animation-library reuse and rendering freedom added)
- **Direction:** [JTS-M010/M011](../journey/TRANSCRIPT.md#jts-m010--the-format-works-the-content-needs-rethinking), plus [JTS-M012 visual-production direction](../journey/TRANSCRIPT.md#jts-m012--use-the-animation-library-and-rendering-experiments-freely)
- **Supersedes:** the single-film editorial constraints in [the Part 1 plan](explore-film-part1-science-scroll-documentary.md), not its recorded implementation or verification results

## Goal

Tell a thorough, engaging investigation of how snow crystals grow and how people learned to
understand them, using education chapters 1–13 and their cited sources. Time follows the
investigation: there is no target total runtime, no under-one-hour ceiling, and no mandatory
episode duration. Each episode should earn attention through a concrete question, visible
phenomenon, explanation, experiment or counterexample, and a satisfying advance in understanding.
Preserve the working manual-scroll, narrated-playback and video-export format. The scientific
story can later connect to the maker's model-building experiment without inventing its chronology
or beginning another scientific workstream.

“Thorough like our experiment” means showing the reasoning, methods, unsuccessful explanations,
conditions and remaining uncertainty—not reading every source paragraph or repeating every
qualification aloud. The audience should see why a claim is worth believing and where it stops.

## What changes, and what stays

- JTS-M011 supersedes the aggregate runtime constraint in JTS-M009 and the provisional 35:20
  cut. Do not replace it with a new fixed target or multiply the existing cut into equal episodes.
- The [prepared score](../video/part1-prepared-score.json), script, completed MP4, earlier editions,
  and [technical receipt](../video/part1-complete-verification.json) remain intact as the prior
  pilot and reusable material. They are not the new series' approved narrative or timing.
- The existing score's repeated section timing is a production artifact, not an editorial rule.
  New beats receive provisional timings only after their argument and demonstration are written.
- Drop the requirement to withhold one complete Run B silhouette until the entire story ends.
  Each episode needs its own visible payoff. Run B remains identified model output wherever used;
  it is neither a measured ice specimen nor proof of the preceding physical explanation.
- Maker feedback accepts the format's direction, not every content or crystal-design choice.
  Visual quality and episode storytelling remain open review surfaces.
- Preserve original browser-generated visuals, source/status labels, accessible static reading,
  reversible cue state and exact export identity. Existing project animations/renderers and new
  local rendering treatments are in scope under JTS-M012. External photographs, external
  generative-media services, archive rights, music, publication and public `SCJ` numbering are
  not newly authorized.
- Narration follows the revised script. The Lydia and Isla auditions remain voice tests of the
  old opening, not selection of a final narrator or permission to synthesize the series.

No charter amendment is needed: this changes media selection and duration, not the charter's
science or validation contract. [MEDIA-SPEC](../journey/MEDIA-SPEC.md#living-scroll-documentary-and-narrative-score)
already allows modular, story-earned long-form work. Short-feed duration and badge rules do not
become episode rules. Current scientific status comes from [PROGRESS](../PROGRESS.md).

## Approach

### An investigation, not a summary of conclusions

For each episode, identify a question the viewer can actually ask. Establish the phenomenon
before introducing the terminology. Develop the most useful explanation, let an observation or
controlled comparison test it, and resolve the episode's question to the extent the sources allow.
The next question should arise from that resolution, not from withholding an available answer.
This is an editorial check, not a repeated six-scene formula or a requirement to fabricate failure.

Restore causal and experimental sequences that the pilot compressed: the face that stays flat
despite uneven delivery; the measurement corrupted by other ice; the distinction between a
measured optical signal and an inferred quantity; and the discrepancy that motivates narrow-facet
kinetics. Do not present a hypothesis first and supply its motivating problem much later.

History belongs where a new instrument or idea changes what can be asked. Preserve genuine
disagreements, revisions and failed approaches without assigning undocumented thoughts to a
scientist or presenting a neat retrospective sequence as the maker's personal chronology.

### Working episode map

These are provisional internal editorial units, not public episode identities, a fixed count,
or a release commitment. Split or merge at an earned conceptual payoff after drafting and reading.
Length is intentionally unassigned.

| Unit / working title | Investigation and visible payoff | Principal source material |
|---|---|---|
| E01 — **Not a frozen raindrop** | Where does the water in a crystal come from? Follow the seed and the liquid → vapour → ice relay; make the material budget and its limits visible. | Ch1; Ch4 equilibrium and cloud-supply sections |
| E02 — **Why six is only the beginning** | What does the internal structure explain—and what does it leave unexplained? Connect observation and X-rays to the three-dimensional lattice, stacking, basal/prism faces and scale. | Ch2 observation/Kepler/X-rays; Ch3 |
| E03 — **The air is part of the problem** | Why can a willing surface grow slowly? Develop diffusion, depleted surroundings and the source's two-bottleneck example. Compare hidden transport with the observable halo, and distinguish deposition, loss and moving-air cases. | Ch4 transport/halo/sublimation/ventilation; Ch5 attachment vocabulary |
| E04 — **How a growing face stays flat** | Why do the slow faces remain, and how can one face advance evenly despite uneven supply? Follow molecular opportunities, steps and the source-described compensating mechanism. | Ch5; the flat-face limit in Ch6; basic step/nucleation concepts from Ch11 |
| E05 — **The moment a corner becomes a branch** | What changes when the flat-face compensation is insufficient? Build the feedback, stable-tip question, directional-preference comparison and unequal sidebranches. | Ch6; relevant Ch5 conditions |
| E06 — **One substance, many shapes** | Can chosen growth conditions organize the variety? Build the habit map through controlled comparisons, face-normal growth and extreme aspect ratios; include hollow forms and disagreements between laboratories. | Ch2 Nakaya; Ch7; Ch9 names and shape comparisons |
| E07 — **A crystal remembers—but not perfectly** | How much of a crystal's life can we read? Follow a changing growth history, capped columns and coordinated arms; confront ambiguous surface marks, seed structure, non-sixfold examples and collection bias. | Ch8; Ch9 real populations/twins/pyramidal forms |
| E08 — **How to measure a growing crystal** | How can an apparatus alter what it measures? Work through vapour control, the apparently empty substrate, isolation and geometry, optical methods, support methods and experimental reach. | Ch10; relevant experimental history from Ch2 |
| E09 — **What does it mean for a molecule to stick?** | Can measured growth reveal surface response? Develop layer nucleation and its barrier, one worked inference, response curves, prefactors, temperature dependence and disagreements. End with the concrete broad-facet/extreme-habit discrepancy. | Ch11; Ch5 edge energy/premelting/air composition; setup from Ch12 |
| E10 — **Can the edge change the rules?** | Does a narrow facet behave differently from a broad one? Follow the motivating observations, growth-history evidence, proposed feedback and model-conditioned barrier reductions. Distinguish equality-root diagnostics from habit predictions. | Ch12; supporting Ch11 experiment scope; Ch13 working-hypothesis cautions |
| E11 — **What would count as an explanation?** | Which models explain a feature, and which claims require an actual prediction test? Compare the source's model families, stress cases and omissions; make the remaining frontier and next test specific. | Ch13; Ch9 model diversity; the separately sourced maker journey as a bridge only |

Prerequisite checks:

- E01 explains the meaning of ice-relative surplus before E03 uses it in transport.
- E02 establishes face directions; E03 introduces delivery and attachment as coupled constraints.
- E04 explains surface opportunities and shape regulation; E09 later quantifies their response.
  Do not repeat the same lesson under a different title or postpone an essential premise until E09.
- E06 is about controlled conditions; E07 is about changing histories and the limits of inversion.
- E08 establishes the measurement method before E09 uses inferred values. E09 supplies the
  discrepancy that motivates E10. E11 asks a different question: adequacy of a predictive account.

### Coverage without silent compression

The chapter allocation above is the initial map, not a claim that every source section has been
audited or scripted. As each episode is drafted, put the chapter's substantive anchored sections
into its beat/source table with one explicit disposition: taught here; taught in another named
episode; expanded in the accompanying reader; or deliberately deferred with a reason. Do not hide
a missing premise, caveat or counterexample in optional notes. No new registry or coverage software
is needed; the script's existing source table is sufficient.

The chapter-level coverage includes these easily lost subjects:

- Ch1: crystal/flake/rime distinctions, supercooling and seed formation, material relay and the
  source-scoped “too cold” account, without inventing one universal cloud history.
- Ch2–3: observation history and selection, molecular versus lattice geometry, stacking exceptions,
  facet names, physical scale, and what structure alone cannot decide.
- Ch4–6: relative surplus versus absolute water, coupled delivery/attachment, growth versus
  sublimation, falling-air effects, step supply, surface energy versus growth, premelting and
  impurities, flat-face regulation, anisotropy, tips, sidebranches and limits of fractal analogy.
- Ch7–9: aspect ratio versus branching, the map's second axis and revised regions, hollow forms,
  nonunique histories, imperfect symmetry, surface features, population/photographic bias, twins,
  other facet families and the difference between a model gallery and natural observation.
- Ch10–11: instrument-induced disturbances, calibration and isolation, what each optical method
  measures, apparatus limits, defect-free and defect-supplied growth, inferred parameters and
  the conditions under which broad-facet measurements were obtained.
- Ch12–13: low-pressure qualifications and history, narrow-facet hypotheses and chosen fit forms,
  diagnostic roots versus morphology, model families/stress cases, omissions and explicit tests.

Concrete quantitative examples are welcome when they help: name their source, units, conditions
and what was measured versus derived. Do not replace real evidence with made-up scatter or
decorative equations. Source changes or stronger outward-facing claims require their normal
proportionate fact check before being imported into a production score.

### Visual rework

**Visuals are a primary attraction and a core storytelling tool, not a finishing layer.** Under
[JTS-M012](../journey/TRANSCRIPT.md#jts-m012--use-the-animation-library-and-rendering-experiments-freely),
draw extensively from the project's generated animation library and rendering experiments. Use
as much of that material as serves the episodes; there is no clip quota, requirement to show
everything, or restriction to Run B, one rendering method or the pilot's visual style. Reuse,
adapt or combine existing treatments, and create new renderers, materials, lighting, camera
sequences, cutaways or explanatory animations where the story benefits. New rendering work is
an authorized production option, not an exception requiring another editorial permission.

Start visual development alongside script drafting by browsing the existing library and making
an episode shot shortlist. Use these discovery points rather than rebuilding known assets:

- [Growth-library usage and rendering controls](../../app/data/README.md), with the browse-first
  gallery at `http://127.0.0.1:5191/dendrite-styles.html?browse=1` when its local server is running.
- [Earlier growth library](../../app/data/growth-library.json),
  [named direct/Compose library](../../app/data/named-growth-library.json),
  [preview index](../../app/data/growth-previews/index.json) and
  [named-crystal catalog](../named-snow-crystal-catalog.md) for source identities and choices.
- [Visual studies](dendrite-visual-studies.md) for Ion Bloom, Timeglass, Two Views and Crystal
  Cast; [volume rendering](named-crystal-volume-gallery.md) and its
  [stability correction](named-crystal-volume-stability-correction.md); and the
  [glass/camera study](explore-gutcheck-growth-glass-camera.md) for additional approaches.
  Read the applicable implementation record and rejected attempts before adapting a method;
  a tested method is a candidate, not a fresh acceptance of its appearance in this episode.

The two library manifests above register 151 choices: 52 earlier-library entries and 99 named
variants (66 direct, 33 Compose). This is an entry count from those manifests, not a count of
independent solver runs or a new playback-quality verdict.

Keep a lightweight shot table with each episode's script: story purpose, source asset ID/path,
selected growth interval, treatment/camera, and whether it is reused, adapted or newly created.
Mark missing local payloads explicitly and use the documented source/restore path; a preview or
catalog entry alone does not establish that its animation is currently playable. This is a shot
selection pass, not a new catalog system or a mandate to render the entire library.

Build visual hooks into openings and transitions: striking growth, close inspection, useful
contrasts and changes of scale should invite the question or reveal the answer. Compare existing
and new treatments on representative sequences in motion, not just attractive stills. Inspect
the actual scroll/playback and decoded export for readability, pacing, framing, artifacts and
visual variety. Keep enough time to see the phenomenon; do not add arbitrary motion or cuts to
simulate engagement. Scientific labels and explanations should remain legible within the spectacle.

The opening's thick blue-purple model rendering and sparse diagram cards are not the accepted
quality bar for the series. First test a small set of crystal views: readable thin facets,
convincing edge lighting, restrained colour, useful depth/scale cues and deliberate comparisons.
Keep numerical geometry versus display styling explicit; do not alter scientific output to earn
a prettier validation claim. An illustrative crystal remains illustrative even if it looks real.
Retain direct-recording versus Compose labels, source conditions and model limits. Arrival colours,
relief, smoothing, thickness exaggeration and artistic lighting are display treatments, not measured
ice properties. Do not use a striking model animation as experimental proof of its narrated mechanism.

Distinguish three jobs: a crystal view that rewards observation, a diagram that makes a mechanism
legible, and a model replay that shows what that model produced. Neither every diagram nor every
episode needs Run B. Use changing views to answer a question—not to keep a static slide busy.
Test a representative sequence with temporary voice and pauses before porting the whole inventory.
No new voice generation or external asset acquisition is implied by this planning step.

### First episode treatment to draft next

E01's promise is to explain where the material comes from, rather than give a tour of the series.

1. **A visible puzzle.** Contrast a simple frozen drop with a developing crystal and ask how
   the branching object acquired its water. Clearly identify the images' origins.
2. **The personal entry, briefly.** Use the maker's sourced initial expectation where it helps
   motivate the question. Do not spend successive passages announcing future understanding.
3. **Two routes, same substance.** Distinguish freezing liquid from adding vapour to existing ice;
   show the crystal/aggregate/rime distinction where it prevents a misunderstanding.
4. **A beginning that complicates the first answer.** Follow the chapter's supercooled-droplet
   route to an ice seed. Explain why a liquid beginning does not make later growth frozen rain.
5. **One parcel of cloud, two equilibria.** Explain balance and ice-relative excess through
   molecular exchange. Avoid air-as-a-container imagery or an unexplained humidity percentage.
6. **Follow the transfer.** Connect shrinking liquid droplets, vapour and growing ice. Use the
   cited large-crystal budget as a worked example, with its scope visible—not a universal price.
7. **Test the simple story's limits.** Distinguish remaining water from a relative percentage
   where needed, and show the chapter's exhausted-liquid case without a universal cold cutoff.
8. **An earned ending.** Return to the opening comparison: the viewer can now account for the
   material and the two stages. The unresolved shape of the crystal motivates E02.

This is a beat treatment, not final dialogue or a timecoded score. Give each causal transition
enough explanation and inspection time; merge any beat that repeats an already-earned answer.

## Done when

There is no chartered media gate. Completion is per episode, not “all files render.” An episode
is a pre-narration production candidate when:

- its question, prerequisites, complete source disposition and ending are written;
- its script teaches the mechanism through at least one concrete observation, demonstration,
  worked example or experimental comparison, with the relevant limits;
- its shot table shows deliberate library reuse and treatment selection, with new visual work
  identified where useful; representative moving sequences have been visually inspected;
- source/claim review covers the actual revised words and visuals, not the old script's verdict;
- a complete temporary-voice performance has been watched for pacing and comprehension, and the
  maker has reviewed its story and representative crystal treatment before large-scale production;
- its scroll, playback, static/access and exported forms preserve the same argument and labels;
- product-sized checks cover changes actually made, with actual output identities and explicit
  untested boundaries recorded.

Final narration, caption alignment, episode timing and maker acceptance are separately required
for a completed episode. The earlier editorial/visual checkpoint governs multiplying a production
treatment, not permission to research or draft later scripts. It does not require final maker
recording or newly purchased/generated speech; those are not prerequisites for further writing.

These checks protect factual and technical quality. They do not compute or certify engagement.

## Steps

- [x] Preserve the new maker brief and supersede the single-film ceiling and editorial structure.
- [x] Establish the working question-led map, chapter allocations, first-episode treatment and
  specific visual revision target; retain the previous implementation without rewriting it.
- [x] Record JTS-M012: extensive animation-library reuse, freedom to adapt or create rendering
  methods, and visual attraction as a first-class production requirement.
- [ ] Browse the animation/treatment library alongside drafting; build E01's shot shortlist and
  identify where reuse, adaptation or new visual work best serves the story.
- [ ] Draft E01's full script and section-level source/coverage table, including a read-through.
- [ ] Produce and review one representative crystal/mechanism sequence against the revised story.
- [ ] Adapt the existing runtime to episode-level navigation and score ownership, using an
  implementation plan committed before code changes. Reuse the current player contracts.
- [ ] Review E01 as a pre-narration editorial/visual prototype before multiplying its production
  treatment across the series; later source research and script drafting may proceed meanwhile.
- [ ] Draft, check and produce later episodes in dependency order, revising boundaries as needed.
- [ ] Record chosen narration and align the actual performance after the relevant script is ready.

## Out of scope

- New solver development, scientific experiments/gates, source-chapter edits or claims of validation.
- Retelling the later project experiment without its own source/chronology treatment.
- Replacing the working site, deleting the pilot, re-rendering the unchanged full film, or silently
  changing its bound script/score/audio files in this planning pass.
- New paid generation, final synthetic-voice selection, external media acquisition, uploading,
  publishing, public numbering, pushing or merging.
- A compulsory episode count, schedule, uniform duration or artificial series-wide cliffhanger.

## Implementation — separate series home and Episode 1

Maker direction after JTS-M012 accepts the targeted director-review revisions and asks for a new
page/tab, explicitly preserving the previous film. Build in the existing isolated website
`/Users/clipper/github/snowcrystal_website-film-part1`, with new `/series` and `/series/episode-1`
routes. Do not replace `/film/part-1`, its script/score, viewing copy, opening or prototype.

- Home: reuse Run B Hero's actual volume asset, authored camera and crystal renderer. Speed the
  growth modestly on the new route only. At completion, the same on-screen crystal shrinks and
  drifts into Hero1's snowfall, using the existing Hero1 field implementation and fallback chain,
  not an approximate replacement. Then reveal the Cryosphere title and Episode 1 entry.
- Add a new navigation tab and open the new home in a separate browser tab; retain the old film.
  Keep skip/replay and reduced-motion access so viewing the opening is not a compulsory wait.
- Episode 1: write and implement the complete first investigation, opening on disappearing
  droplets feeding a crystal, then seed formation, vapour deposition, equilibrium/supply,
  the worked approximate material budget and source-scoped limits. End on growth without a
  blueprint and the shape question. The recurring series question is how water builds these
  forms without a blueprint and how an explanation can be tested. Keep source labels and the
  distinction between illustrative motion and measured/modelled histories.
- Write actual episode narration and source/shot tables in the authority repository, then use
  the same content in a separate scroll/playback page. Timing remains provisional until narration;
  no paid speech generation or full-film re-render is required by this implementation.
- Preserve default behavior on `/run-b-hero` and `/hero1`; new component options must default
  to the existing behavior. User-requested exact visual continuity calls for live inspection of
  growth, handover, snowfall, title, episode scrolling/playback and reduced-motion/mobile states.
- Verify with focused product tests, website TypeScript/build, live browser smoke and visual
  inspection. Compare the old score/script identities and smoke the old film. No solver or
  scientific claim logic changes; do not run scientific gates or the scientific full suite for
  presentation-only changes. No deployment, push, merge or asset cleanup is requested.

Done for this slice means the new home and complete Episode 1 are usable, the requested original
scenes are reused, the old film remains available and unchanged, and actual checks/remaining
narration limits are recorded. A working home alone is not completion of the episode request.

## Review and limits

OpenAI Codex `story_review`, with inherited shared context and exact model ID unavailable,
independently proposed question-led boundaries from the chapters and identified prerequisite,
duplication and delayed-payoff risks. It did not edit files, run a browser, recheck every cited
scientific statement or test an audience. Root adopted the experimental ordering and separated
the hypothesis discussion from the wider modelling frontier as a provisional additional unit.
This is editorial design, not acceptance of unwritten episodes. Root's prior timing inspection
and decoded-frame observations are critiques of the old pilot, not new series test results.
The same reviewer checked this written brief for contradictions and missing prerequisites;
root clarified that the prototype checkpoint does not block later writing on final narration.

Documentation verification: `node scripts/lint-rule7.mjs` and `git diff --check` passed for this
brief and its transcript, supersession and current-state updates. No code, browser, render,
audio-generation or scientific checks were run for this prose-only rework.

## Open questions

- Exact episode boundaries and lengths: resolve by drafting and watching, not a preset duration.
- Crystal appearance: approve a representative treatment before scaling it across episodes.
- Final narration: maker recording remains the default; the two voice auditions settle nothing.
- The later model-building story: identify its own source horizon before expanding beyond the
  current science series. Publication and release identities remain separate decisions.

## Tried and rejected

- **Use a single-film runtime as the content budget.** Maker direction removes the ceiling; keep
  the causal and experimental steps whose removal made the pilot feel thin.
- **Give every subject the same time.** Uniform slots made introductions, mechanisms and recaps
  feel interchangeable. New timings follow their actual jobs.
- **Use more time for more preamble.** Repeated promises and general cautions delay discovery;
  extra time must buy understanding, evidence, inspection or a meaningful change in the question.
- **Restore depth by reading every paragraph.** A comprehensive source disposition protects
  coverage; deliberate story selection and a substantive reader preserve engagement and access.
- **Declare the series finished because its runtime works.** Keep technical completion separate
  from source review, editorial judgment, visual acceptance and the maker's final performance.
- **Treat the pilot's crystal or renderer as the only visual vocabulary.** The project library
  and rendering experiments are available for broad reuse; choose or create treatments by their
  storytelling job, without forcing every available animation into the series.
