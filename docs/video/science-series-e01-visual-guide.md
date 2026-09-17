# E01 visual direction — teach through visible changes

Maker-directed revision, 2026-09-16. This guide records what is already produced in scenes
1–5 and applies those lessons to the rest of Episode 1. Baseline website: `0949118`.
It guides a presentation-only rewrite, not new narration, quantitative science or model output.
The source-bound [script](science-series-e01-script.md) and recorded speech remain unchanged.

## What the first five scenes already do

| Scene | Produced visual treatment | What makes it useful / remaining repair |
| --- | --- | --- |
| 1 — Material budget | Quiet white quantity, growing Run B replay, a selected amber droplet with an arrow and before-size outline, brief visible shrink, white vapour arrivals. | The viewer knows what to watch and can compare before/after. The model is illustrative, not proof of the cloud mechanism. |
| 2 — Four precipitation routes | Four-panel overview; the narrated category lights up and enlarges. Liquid freezing, deposition, rime/graupel and aggregation have different actions. | Overview supplies context; temporary focus supplies attention. Deposited geometry stays fixed while new material appears. |
| 3 — Inside a cloud | Liquid/gas fields, rising/expanding parcel, condensation, droplet-size bracket, air-gap close-up, supercooling. | Multiple views follow different concepts, but labels and recognizable cloud context are too weak. Repair the opening phase key and show a cloud emerging from the same parcel. |
| 4 — First ice | One labelled droplet linked to a rectangular magnified interior. Irregular non-ice speck stays distinct from amber liquid and hatched ice; qualified temperature examples; retained frozen seed. | Identity, material and scale are explicit. Keep the same seed into the next scene instead of replacing it with a star. |
| 5 — Balance | An identified surface, solid below it, fixed lower edge, a dashed before-line, clear growth/shrink arrows, arriving and leaving tracers, and gas that changes with the narrated perturbation. | The best reference: each sentence changes something observable. Equilibrium preserves motion but not net growth. The viewer sees what the boundary belongs to and what has changed. Retain this boundary demonstration; revise only its seed-to-surface entrance/inset. |

## Working visual rules

1. **Identify, act, hold.** Label an object or quantity before asking the viewer to interpret
   it. Give a spoken action a short, conspicuous change, then leave its consequence visible.
2. **Keep the subject.** Carry the droplet, seed, deposited ice or parcel across related shots.
   A change of scale has a selection window and an original-object reference, not a mystery cut.
3. **Make comparisons visible.** Use a fixed baseline, before-outline, stable quantity scale or
   paired view. Do not try to teach growth with rotation, or net transfer with idle decorative dots.
4. **Motion has a job.** Arrival, departure, condensation, depletion and newly added growth are
   different actions. Background two-way traffic continues even when a net arrow points one way.
5. **Follow the actual words.** Sentence-aligned cues drive meaningful changes; not one static
   table or one uniformly slow animation for an entire section. Pause and reverse seek reproduce
   the same state. Still mode retains the current concept as a discrete readable pose.
6. **Use more than colour.** Label liquid, vapour and ice; distinguish solid texture and outlines.
   Keep legends in quiet space. Molecular tracers, cloud droplets and large crystals are not on
   a shared physical scale unless explicitly stated. Vapour is invisible in nature.
7. **Reveal the explanation, not all annotations at once.** Start with the objects, show the
   mechanism, then introduce the numbers needed to resolve it. A chart can be one useful shot;
   it is not the entire scene.
8. **Keep scientific scope visible.** Schematic motion is not a measured trajectory/rate.
   Source table values, calculated amounts and model replay keep their separate provenance.
   No invented quantitative interpolation, temperature cutoff or claim that Run B is a cloud experiment.

## Revised shot sequence

| Scene | Narrated cue → visible action |
| --- | --- |
| 3 | “Vapour…” → label white gas tracers and amber droplets explicitly. “In the winter cloud…” → the same population pulls into a recognizable cloud overview, with liquid and compact ice identified. “Lift moist air…” → follow one parcel rising; its envelope expands and its temperature cue cools. “Amount … becomes smaller” → qualitative balance reference falls, without a capacity metaphor. “Condensing…” → liquid builds around visible particles and the parcel becomes cloud; then select one droplet for the existing scale/air-gap/supercooling shots. |
| 4→5 | Keep the hatched frozen droplet and buried speck through the end of 4. In 5, enclose that seed with air at fixed temperature, select its outer boundary, then zoom into the existing moving surface. No instant star or new seed identity. |
| 6 | Start with ice and liquid surfaces exchanging both ways at the same temperature. Compare their different balance points; introduce 1.65 and 1.91 mbar only with the source example. Keep one air marker fixed while switching the reference from water to ice. Finally place the air between the two references and show liquid shrinking while ice grows. Water balance means no net liquid loss; both-way traffic persists. |
| 7 | Return to the cloud and its already-grown crystal. Show local vapour drawdown and donor shrink. Follow one highlighted molecule through departure, wandering gas and incorporation, while other arrivals/departures remain visible at both surfaces. Resolve the approximate budget, then widen attention to the surrounding-air journey. |
| 8 | Pose the rising-percentage prediction; highlight the denominator. Reveal the existing sourced temperature examples one at a time. Then compare percent and absolute excess in separate aligned, fixed-scale panels, dynamically highlighting the contrasting cold-end trends. A labelled schematic trend may illustrate the near−12°C maximum; no new numerical curve. Keep the −40°C caveat adjacent. |
| 9 | Follow the same donor population: some freeze into compact ice and others evaporate. Show the liquid reservoir diminishing while ice and some vapour remain. Contextual source temperature is not an on/off switch. Finish by selecting the remaining water and its route through air. |
| 10 | Keep the grown crystal as payoff; resolve the material route beside it. Shift attention to faces/directions/branches. For the source's laboratory promise, show a labelled conceptual reconstruction: conditions change, then new material appears while earlier geometry stays fixed. Return to the grown object and the open question “Why six?” No fabricated physical controls on Run B. |

## Completion and checks

Implement the full sequence in the retained series route; preserve the old film, home,
voice and source text. Inspect representative sentence states and transitions in real playback,
including a narrow viewport, reverse seek and Still. Run focused diagram/transport tests,
website TypeScript and production build. Review the changed depiction against this guide and
the script. Document repairs and limits; software tests do not establish audience engagement.

## Implemented result

Website `explore/film-part1@68e31f265b4b463a528cf53ef608968698cf5528` implements this pass,
following authority plan commit `9368961`. The first-five-scene table above records the baseline
assessment; the cloud and seed-transition repairs it calls for are now produced. Scene 5's
surface mechanics remain intact. New `laterEpisodeCues.ts` and `laterEpisodeDrawing.ts` stage
all later explanations against the retained spoken sentences; `seedDrawing.ts` carries the
same compact hatched ice and buried particle across the transition.

The relay uses a linked surface detail and then a larger contact-edge cutaway, not a presumed
circular boundary around the branched Run B model. Its selected molecule becomes part of the
drawn solid while arrivals and departures continue through the exterior. The later comparisons
retain separate source-value/amount scales and caveats. The reservoir shows both liquid-loss
routes, then cloud history, the cold-supply limit and remaining water. The ending's laboratory
shot is explicitly conceptual; new outer branches are distinguished from retained earlier ice.

The [review/edit record](../reviews/science-series-e01-visual-cues-2026-09-16.md#full-visual-storytelling-pass)
names the depiction, spacing and Still repairs. Website `docs/series-tests.tap` at the named
commit records **66 passes, zero failures**; its `docs/science-series.md` records the commands,
TypeScript/build and bounded desktop/phone-sized playback checks. This is an implemented
visual draft, not maker comprehension/listening acceptance or scientific validation.

## Tried and rejected

- One static chart/table for the full explanation: maker feedback found it visually insufficient.
- Unlabelled yellow/white circles: phase identity was ambiguous.
- Replacing the frozen seed with a star before magnifying: breaks object continuity.
- Only donor-to-crystal paths: misrepresents the explicitly narrated two-way molecular traffic.
- Treating a crystal's bounding circle as solid: put molecular contact on a drawn surface.
- One static chart for the whole section: retain source charts as individual shots, surrounded
  by the physical objects and comparisons that give their numbers meaning.
