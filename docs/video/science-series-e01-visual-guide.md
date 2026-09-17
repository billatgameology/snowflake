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
| 6 | Keep ice and liquid surfaces visible throughout. First show equal arrivals/departures and stationary surfaces in explicitly separate balance comparisons; introduce 1.65 and 1.91 mbar beside them. Then hold the same air at the water-balance value: liquid stays steady, ice gains. Only then introduce the relative-humidity labels. Finally show air between the two balance values: liquid shrinks while ice grows. Both-way traffic persists. |
| 7 | Return to the cloud and its already-grown crystal. Show local vapour drawdown and donor shrink. Follow one highlighted molecule through departure, wandering gas and incorporation, while other arrivals/departures remain visible at both surfaces. Resolve the approximate budget, then widen attention to the surrounding-air journey. |
| 8 | Pose the rising-percentage prediction with equal-volume, equal-value dot samples; identify the ice-balance denominator and extra water. Reveal the existing sourced temperature examples one at a time. Then physically separate the surplus units for an absolute-amount comparison. Rounded dots do not replace printed source percentages. A labelled schematic trend may illustrate the near−12°C maximum; no new numerical curve. Keep the −40°C caveat adjacent. |
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

## Follow-up: show the air, count the water, keep the cloud

Maker feedback on the prior implementation requested more visible action in scenes 7–9.
Website `explore/film-part1@068dc120037063c28b4ee78034307fcd6dc82695`, following authority
plan commit `639859e`, now implements:

- A magnified surrounding-air region with moving vapour, path tails and contact at different
  positions on the drawn ice face. Surface exchange remains reciprocal. The label explicitly
  distinguishes illustrative wandering vapour from wind.
- Equal-volume water samples adapted from Chapter 4 `#anim-chambers`, followed by an
  animated separation of the extra above ice balance. The fixed rounded dot amount makes
  the much smaller cold reference visible before the percentages and amounts are compared.
- One persistent cloud population: identified droplets freeze or evaporate; frozen remnants
  and vapour remain after liquid donors disappear. History outlines preserve earlier positions.
  The cold paragraph moves an uncalibrated equilibrium reference, not the actual cloud's
  counted water; the remaining-water paragraph resumes visible air transport.

The [follow-up review](../reviews/science-series-e01-visual-cues-2026-09-16.md#air-counted-water-and-persistent-cloud-follow-up)
records the source check and bounded desktop/phone playback, reverse/Still inspection.
Website `docs/series-tests.tap` at that commit records **68 passes, zero failures**. The prior
implemented-result section remains the historical record of the broader pass; this follow-up
supersedes its scene 8 comparison treatment and scene 9 cutaway sequence.

## Follow-up: explain the meaning before the numbers

Website `explore/film-part1@c3143a2dbc4ce7d9902515b58614156b6c0cefc0`, following authority
plan commit `d0d7561`, supersedes the ending of scene 3, scene 4's example cards, scene 6's
pressure-marker comparison and scene 10's opening recap.

The shared principle is to retain the physical subject while explaining it. Scene 3 keeps
liquid and labelled gas together through magnification and cooling. Scene 4 gives its separate
source examples different actions, with a local ice patch contained in the liquid and its
helpful protein surface still identifiable. Scene 6 shows what balance does before its values:
equal exchange and no size change, then the same air balancing liquid but growing ice. Scene
10 follows donor water into a linked surface close-up, then identifies concrete schematic
shape features without pretending to pick a precise facet on the model.

Keep fixed reference geometry: gas cannot become denser merely because the ice moves up,
and growing ice needs a stable rear edge/texture rather than a sliding block. Source example
qualifiers, illustrative scale/rates, pressure units and the ice-relative denominator stay
visible. The [review record](../reviews/science-series-e01-visual-cues-2026-09-16.md#meaning-before-numbers-follow-up)
records repairs and bounded inspection. Website `docs/series-tests.tap` at the named commit
records **72 passes, zero failures**; narration and surrounding work remain intact.

## Tried and rejected

- Source-table attribution as the explanation: first show what the values mean at a surface.
- Growing a local ice patch outside its example droplet or hiding the helpful surface: preserve
  phase containment and the starting condition's identity.
- Translating a solid inset or compressing gas coordinates as ice advances: fix the reference
  frame and let the solid gain area instead.

- Static air arrows during a narrated journey: the travel distance and motion must be visible.
- Percentage-only or chart-only comparison: first show the different reference quantities.
- Unrelated icons replacing a cloud midway through its history: preserve the same objects.
- Arbitrary cold-water dot counts: countable units imply ratios; use sourced samples or an
  explicitly uncalibrated reference, not invented numerical change.

- One static chart/table for the full explanation: maker feedback found it visually insufficient.
- Unlabelled yellow/white circles: phase identity was ambiguous.
- Replacing the frozen seed with a star before magnifying: breaks object continuity.
- Only donor-to-crystal paths: misrepresents the explicitly narrated two-way molecular traffic.
- Treating a crystal's bounding circle as solid: put molecular contact on a drawn surface.
- One static chart for the whole section: retain source charts as individual shots, surrounded
  by the physical objects and comparisons that give their numbers meaning.
