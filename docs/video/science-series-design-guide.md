# Science series — maker's critique and episode design guide

Captured 2026-09-16 from the maker's feedback in the film/series task, through the request to
write these lessons for future reviewers. This is the reusable editorial/design guide for
the [active series plan](../plans/explore-journey-science-series.md), not a scientific gate.
The [E01 visual guide](science-series-e01-visual-guide.md) holds that episode's shot history.

## The central reading of the feedback

**Make the narrated idea visible, understandable and worth watching at the moment it is spoken.**

The maker is not asking only for prettier pictures, more particles or faster cuts. The recurring
test is whether a first-time viewer knows what to attend to, what the image represents, what
changed, and how that change explains the words. Beauty attracts attention; directed visual
explanation keeps it. A functioning player and a correct source citation do not settle either.
This is our synthesis of the comments below, not an invented quotation or audience-study result.

Two apparently opposing comments belong together: the old opening felt slow, yet the compressed
film omitted too much. **Increase useful understanding per passage; do not solve slowness by
removing the causal steps.** Give a difficult idea more time and more helpful imagery, not a
longer hold on an unexplained diagram. Episodes may be as long as their investigation earns.

## Feedback record and acceptance boundaries

Quoted excerpts below are selected verbatim from maker messages in the current task; prose in
the other columns is interpretation. Exact message timestamps and viewed browser revisions were
not supplied. Implementation links identify recorded responses, not proof of which exact build
the maker watched. Earlier complete directions are [JTS-M010–M012](../journey/TRANSCRIPT.md#jts-m010--the-format-works-the-content-needs-rethinking).
Speech-transcription quirks in quotations are left intact. The pasted director/plan-review prose
was another reviewer's opinion; it is not relabelled as the maker's own scene-by-scene judgment.

### Format, pace and visual ambition

| Feedback | What it asks of future work | Acceptance boundary |
| --- | --- | --- |
| “Do visual inspections. I saw the first 1.2 minute, it was just okay”; later “That's cool, how much did you do? Can you keep working on it” | Inspect the performance, revise actual compositions and continue beyond a short prototype. | General encouragement after the pilot revision; not approval of every later scene. [Recorded revision](../reviews/film-part1-visual-revision-2026-09-15.md). |
| “the scrolling and video playing is working well”; “it feels a little slow at first 5 minutes”; “i feel a lot of details are missing” | Preserve the working format while fixing narrative momentum and depth independently. | Format praise coexists with content and crystal-quality criticism. [JTS-M010](../journey/TRANSCRIPT.md#jts-m010--the-format-works-the-content-needs-rethinking). |
| “as long as content is interesting and engaging”; “be thorough just like our experiment” | Use question-led episodes; retain mechanisms, comparisons, methods and limits. No replacement runtime ceiling. | More time is permitted, not automatically interesting. [JTS-M011](../journey/TRANSCRIPT.md#jts-m011--let-the-investigation-determine-the-length-consider-multiple-episodes). |
| “the visual is what catch people attention” | Browse the animation library and rendering experiments; reuse, adapt or create the treatment that serves the scene. | No quota to use all animations and no Run-B-only rule. [JTS-M012](../journey/TRANSCRIPT.md#jts-m012--use-the-animation-library-and-rendering-experiments-freely). |
| “you shouldn't remove previous 35+ minute of work”; request for Run B Hero growth blending into the exact Hero1 snowfall | Make the series additive; preserve the previous film. Carry one crystal into the weather before title/episode entry. | Preservation and exact reuse were explicit requirements, not merely a preference for a similar look. |
| “seemlessly transition into the snow fall beautifully” | Preserve object identity, scale and motion across the handover. | Explicit praise for the home transition. It accompanied criticism of black artifacts and episode growth, so it is not blanket renderer approval. |
| “it should feel like one continous scrolling”; “only when a user scrolls up or down does it exit the auto scroll” | Home and episode feel like one filmic document; intentional Play owns guided movement until manual input takes over. | Requested and implemented behavior; later scene comments alone do not constitute a complete interaction acceptance test. |
| “looks rotated a little then stopped”; “weird black lines or artifacts” | Growth must be visible as added material, not camera motion; inspect the render in motion as well as still. | Fixed episode framing and scoped shader repairs are recorded in the [continuous-series review](../reviews/science-series-continuous-e01-2026-09-16.md); no all-device guarantee. |

Narration was initially reserved for the maker at the end; later requests authorized specific
samples and full E01 AI sample narration. Those are production decisions, not a requirement to
buy or regenerate speech for every design iteration. Draft words and visuals together, rehearse
with available temporary speech, and retime to the actual performance when it exists. Do not
infer a final narrator choice or series-wide generation permission from E01's sample.

### Scene-by-scene critique and response

Here, **praised** means the maker explicitly praised the named feature; **implemented** means
the response exists in the linked record but has no subsequent explicit acceptance in this
conversation. Both may apply to different parts of the same scene.

| Scene / feedback excerpt | Comprehension problem and implemented response | What is actually supported |
| --- | --- | --- |
| **1 — opening budget:** “background color kind of mix with the text”; no cue toward “one particular” droplet; shrink only obvious while scrubbing | Quiet high-contrast quantity; select and point to one stationary donor; before-size outline and speech-timed shrink; keep crystal growth visible. | **Praised after revision:** “I like the new revise scene one” and “I can see it still growing so that's great.” This does not prove which individual styling change caused the praise. |
| **1 — budget follow-up:** “show some of those white water vapors going into the snow crystal” | The material-budget number needs its material route. Sustain white vapour arrivals during that spoken example, not only earlier. | **Implemented** after the opening praise; not itself separately praised. |
| **2 — four routes:** “the grid view is great as a overview”; full grid makes it hard to know which cell to focus on | Keep the overview, then highlight/enlarge the narrated cell and return it to context. Each route needs its own action. | **Praised:** the overview. **Requested/implemented:** guided cell focus. Do not discard the praised context or call the new focus explicitly accepted. |
| **3 — cloud:** “way too long to stay in one visual”; “there's definitely a lot of concepts talked about” | Stage phase identity, cloud context, rising/cooling parcel, condensation, scale and reservoir rather than stretch one composition across all concepts. | **Implemented**, then revisited by the maker. Merely adding several views did not finish the explanation. |
| **3 — identity/order:** “you're actually showing a snowflake so that confuse me”; “i see yellow and white circles, they should be labeled”; “I want to see a cloud?” | Remove premature crystal from the air-gap passage; identify liquid and vapour; bridge recognizable cloud to close-up. Latest view keeps droplets, white vapour and other gases together through magnification and below-zero cue. | **Implemented**, not yet explicitly accepted. The cloud overview and the later crystal-free air-gap view have different jobs. |
| **4 — first ice:** “I don't understand this graphics”; previous droplets/frozen rain “all looks like a sphere” | Distinguish droplet, non-ice speck and new ice by labels, shape/texture and a linked magnified interior. Show the event when it is spoken; retain the same frozen seed afterwards. | **Implemented**, not yet explicitly accepted. The maker's diagnosis was identity and sequence, not simply insufficient decoration. |
| **4 — clean-water/protein examples:** latest request quotes the two temperature examples as needing work | Give separate qualified examples visible action: clean liquid persists during cooling; a local ice patch starts at an identified helpful surface. Keep the qualifiers, rather than imply universal temperature switches. | **Implemented** in the latest follow-up; no later maker verdict. The user named this passage without prescribing this exact solution. |
| **5 — balance:** “that section is pretty good”; movement was subtle and the line's identity only became clear later | Establish that the boundary belongs to ice, fill the solid region, keep a fixed reference and before-line, add directional cues and make gain/loss visible while exchange continues. | **Explicit later praise:** “You seem five is beautiful, so great job”. This is the strongest mechanism-scene reference, not a ban on improving its entrance. |
| **4→5 — continuity:** “keep using that ice seed, then we zoom in even closer” | Carry the same frozen seed into the box and select its exterior before magnifying the surface. | **Requested/implemented after scene 5 praise.** Praise for the surface demonstration did not approve the old transition. |
| **6 — two balances:** “it's just one static chart”; later “i see the difference, but don't understand what it means” and confusion about the table reference | The chart showed different values without their physical consequence. Latest treatment retains surfaces, establishes equal exchange/no net change, introduces their separate balance values, then shows the same air leaving liquid unchanged while ice grows. | **Implemented**, awaiting maker comprehension review. A citation and a visible difference are not explanations by themselves. |
| **7 — relay/air:** “did not show molecule going both ways”; “there's no action in \"surrounding air\"” | Show reciprocal exchange alongside the net transfer. Carry tracers through a labelled air region to actual drawn ice, with visible travel and paths. | **Implemented**, not separately praised. Do not replace transport with a static arrow or fake contact at the model's bounding circle. |
| **8 — percentage/amount:** “it's just a table”; “40% of few is in total less than smaller percentage at 15”; points to the static website | Make the reference amount visible with source-derived equal-volume/equal-dot samples before separating the surplus and comparing amounts. This quotation is the maker's intuitive comparison, not a new numerical source. | **Implemented**, not separately praised. The source's denominator, units and conditions still govern; percentages are not percentages of the total population. |
| **9 — limits/history:** “imagery doesn't explain the narration” after an earlier request to rework the remaining scenes | Retain one donor population through freezing, evaporation and depletion; show what remains, then the qualified cooling/history/air-supply limits. | **Implemented**, not yet explicitly accepted. No more specific visual diagnosis was supplied; this treatment is our interpretation to test. |
| **10 — material versus shape:** latest request quotes the recap and unexplained faces/directions/branches | Re-enact donor → vapour → deposition beside the retained crystal, then highlight concrete schematic shape features as the new question. | **Implemented**, no later maker verdict. The request identifies a weak passage; it does not explicitly endorse our replacement. |

Response provenance: [first-five-scene revision and identity follow-up](../reviews/science-series-e01-visual-cues-2026-09-16.md),
[full pass](../reviews/science-series-e01-visual-cues-2026-09-16.md#full-visual-storytelling-pass),
[air/amount/history follow-up](../reviews/science-series-e01-visual-cues-2026-09-16.md#air-counted-water-and-persistent-cloud-follow-up),
and [latest meaning-first follow-up](../reviews/science-series-e01-visual-cues-2026-09-16.md#meaning-before-numbers-follow-up).
Those records name implementation revisions and check limits. Neither passing tests nor the
absence of another complaint upgrades an implemented response to maker acceptance.

## What to carry forward from the praise

**Home: continuity that feels physical.** The actual Run B growth shrinks/drifts into a held
marker in the actual Hero1 snowfall, then joins the population. The maker explicitly praised
that blend. Reuse its principle—one understandable object changes context without losing its
identity—not the identical snow transition between every topic.

**Scene 1: a readable event.** The revised opening separates the quantity from visual noise,
directs attention to a donor and makes its shrink/crystal growth noticeable. The maker praised
the revised scene and specifically noticed continuing growth, then requested more vapour at
the budget cue. Preserve the readable event; finish its causal connection rather than treating
the compliment as closure of every beat.

**Scene 5: a visible mechanism.** The improved surface demonstration gives a physical identity
to the line, holds a reference, shows two-way traffic, and distinguishes exchange from net
growth/loss. The later “beautiful” comment and request to use scene 5 as a guide support it as
a reference. Our interpretation is that clarity, motion and labels work together here; there
was no controlled comparison proving one fix alone caused the praise. Later seed-to-surface
continuity was requested separately. Copy this explanatory grammar, not a blue slab in every scene.

**Grid and player: keep the useful structure.** The maker liked the category overview and
scroll/play format while asking for focus, continuity and deeper content. Repair the weak
attention/story layer without unnecessarily rebuilding the structure that already helps.

## Requirements for subsequent episodes

Use these in the existing script/shot table and review record. They are human editorial
requirements, not a new scoring system, generated registry or scientific acceptance gate.

### General-adult comprehension requirement

New maker report: one general-adult reviewer found E01 dense, did not understand “water vapor
pressure” or “equilibrium”, became lost after scene 6, and found scene 8 too dense. The maker
requires concepts to be introduced **and explained before being built on**. This is secondhand
feedback from one viewer, not a population study; the exact viewed revision is not identified.
It supersedes any assumption that the earlier visual repairs established understanding.
The [full E01 review](../reviews/science-series-e01-comprehension-review-2026-09-16.md) and
[approval-only script](science-series-e01-comprehension-draft.md) apply this requirement.

**Goal:** a general adult without prior physical chemistry can explain the episode's causal
story in ordinary words and make a simple prediction using its important concepts. Vocabulary
recall, beautiful animation, correct citations and agreeing with the narrator are not substitutes.

- Before depending on an idea, identify its concrete subject, show what happens, explain why
  that supports the relationship, then allow a prediction or rephrasing. A definition alone
  does not establish usable understanding. Introduce the technical name at the demonstrated
  event; do not introduce several names as though they were one concept.
- Write each scene's prerequisites and point to the earlier demonstration that earns them.
  If the prerequisite is only mentioned there, repair that earlier scene. The place a viewer
  gets lost may be downstream of the first missing explanation.
- Separate **event, explanation, measurement and calculation** into intelligible beats.
  For E01: equal exchange → equilibrium; two surfaces → different consequences; gas-wall
  impacts → pressure; water's contribution → water-vapour pressure; reference amount → percent.
  Do not introduce the whole compound term and immediately calculate with it.
- Earn the physical payoff before optional arithmetic. Keep necessary caveats in the main
  argument, but retain additional examples/derivations in a substantive reader or named later
  episode when they interrupt it. No detail silently disappears and no essential premise is
  exiled to a footnote. More useful explanation may require more time or another section.
- Explain every representational change: what a dot, colour, box, axis, unit or letter means,
  what is held fixed and what it cannot imply. Do not recolour vapour as the established liquid
  colour merely to distinguish an arithmetic subset. Invented teaching counters must be
  explicitly separate from source-derived scientific examples.
- Rehearse at ordinary speaking speed. Give the viewer a chance to predict a consequence
  before revealing it, without mandatory quiz UI. A quiet hold should support thinking about
  an understood picture, not waiting for an unexplained symbol to acquire meaning.
- Ask a general-adult reviewer open questions: “What happened?”, “Why?”, “What would happen
  if we changed this?” and “What does this not tell us?” Record their actual answer and the
  first missing link, not just “clear?” or a satisfaction score. Do not coach the answer and
  then count it as independent understanding. Repeat only the affected explanation after repair.

For E01, the proposed checks are the water route without collision; equal exchange despite
unchanged size; different outcomes for liquid and ice in the same air; water-vapour pressure
versus all-air pressure; a percentage's reference amount; and what remains unknown about shape.
They are acceptance questions for a future viewer, not a new automated gate or claimed result.
Preserve scene 5's explicitly praised visuals while improving its vocabulary bridge.

### Narrator's voice — maker-approved direction, 2026-09-17

The maker found the revised tone too technical, requested a teenager-friendly sample of the
hardest idea, then explicitly liked the two-neighbours sample and asked to apply its tone to
the draft. This approves the **voice direction**, not the complete episode or new audio.

Sound like a curious person helping someone notice a surprising event. Start with concrete
subjects (“a drop and a piece of ice”), ask an honest question (“same cold air, opposite
changes?”), and walk through the cause in ordinary words. Name the concept once its meaning
is visible. The accepted equilibrium wording is the reference: “It doesn't mean everything
has stopped. It means the two changes cancel out.” Teenager-friendly means no assumed specialist
background, not slang, baby talk, or less accurate science.

Prefer conversational sentences and natural contractions. Questions should lead to something
the viewer can see, not become a quiz every paragraph. Replace abstract lecture language and
lesson announcements with observations. Keep instructions to the animator out of spoken text;
“look what remains” is narration, whereas “do not erase the atmosphere” is a production note.
Avoid repeated reassurance about not remembering names, claims that an idea is obvious, and
intentional-sounding molecules. Keep essential conditions and caveats in natural language:
same temperature, equal gas space, both-way traffic, and the specific example's limits.

R05–R07 of the [approval draft](science-series-e01-comprehension-draft.md) adapt the approved
sample while retaining the earlier demonstration and avoiding an unnecessary second full
equilibrium lesson. The whole draft now follows that voice. A spoken rehearsal and audience
understanding check still remain; written tone approval cannot substitute for either.

### Visual and editorial requirements

1. **An earned investigation.** Open with an observable puzzle or transformation, promptly
   identify the question and develop its explanation. Preserve the important causal steps,
   evidence, conditions and counterexamples. End by showing what was answered and why the next
   question follows. No arbitrary episode duration, uniform beat length or repeated promises.
   Retain the plan's [source-section dispositions](../plans/explore-journey-science-series.md#coverage-without-silent-compression)
   in the existing script table: taught here, in another named episode, in the accompanying
   reader, or deliberately deferred with a reason. Citations alone do not reveal missing steps.
2. **An identifiable subject before action.** A first-time viewer can name the key object,
   material/state and scale when it appears. Use local labels, texture, silhouette and a
   stable legend as needed; do not rely on colour alone or label every decorative particle.
   Previewing a later subject is allowed only as an explicit preview, not an unexplained intruder.
3. **A deliberate focus cue.** For “this”, “one”, “here” or a narrated category, select the
   exact subject before its important action. Point, highlight, enlarge or isolate while
   preserving enough context to locate it. Return to the overview when comparison needs it.
4. **A visible action during its spoken beat.** Growth, shrinkage, travel, freezing and balance
   must be legible at intended playback speed without seeking. Identify → act → hold is the
   default pattern, not a mandatory cut per sentence. Fix time mapping/framing/contrast before
   adding decoration. Quiet holds are valuable when they permit inspection of an understood result.
5. **A comparison the viewer can read.** Preserve a before-outline, fixed boundary, scale or
   matched view when change is the lesson. Camera tracking must not conceal growth. Rotation
   is not growth; a sliding block is not added material. State what is held fixed and changed.
6. **Motion that explains the mechanism.** Animate the causal journey and its outcome, not
   ambient busyness. When narration distinguishes reciprocal traffic from net change, show
   both. A route reaches its actual surface; a boundary's label, traffic and movement agree.
7. **Object and scale continuity.** Carry the same parcel, donor, seed, face or crystal through
   related beats. Introduce a close-up with a selection/leader and retain a parent reference
   when helpful. If the shot is a new specimen, example, model or schematic, say so. Preserve
   irreversible story changes; do not refill a depleted donor or unfreeze a seed accidentally.
8. **Meaning before arithmetic.** Before a chart/table/equation, establish the physical
   question and what the compared quantities do. Attach units and reference conditions to
   objects. Show the denominator and absolute amount when a percentage can mislead. Keep
   provenance available, but do not make understanding depend on knowing the cited table.
9. **Enough imagery for the ideas, not an animation quota.** A multi-concept passage needs
   corresponding visible stages, comparisons or discoveries. One image may evolve; a chart
   may be useful; neither is forbidden. Reject a static diagram that stops explaining while
   narration moves on. Choose library assets/renderers by story job, reusing, adapting or
   creating treatments wherever the story benefits. Distinguish observation, explanatory
   diagram and model output.
10. **Beauty with readable hierarchy.** Give the crystal and its changes visual presence,
    inspect lighting/facets/depth in motion, and remove distracting artifacts. Put essential
    labels/numbers in quiet, high-contrast space. Check narrow layouts without squeezing all
    annotations into the image. Attractive rendering must not mask identity or imply validation.
11. **Continuous experience with reader control.** Preserve filmic entry and transitions,
    user-initiated narration, and immediate manual takeover. Use the same explanatory states
    for audio time and reversible reading. Still/reduced motion retains the idea, reference
    and result even when animation is removed. Do not make motion the sole source of meaning.
12. **Honest scope and acceptance.** Source qualifiers survive the visual: an example is not
    a universal threshold, a styled model is not measured reality, and illustrative rates
    are not predictions. Keep author/reviewer observations and maker praise distinct. Preserve
    prior work and approved features; later approval applies only to what was actually named.

## Small scene-design worksheet

Add this information to the episode's existing shot table; do not create another database.
A scene can have several conceptual beats. Group sentences that share one visible action.

| Field | Author must supply |
| --- | --- |
| Question and takeaway | What should a first-time viewer understand by the end that they did not at the start? |
| Prerequisites and explanation | What must already be understood, where was it demonstrated, and what plain-language causal explanation earns the new concept? |
| Understanding check and depth | What can the viewer predict or explain without a term prompt? Which nonessential quantitative detail is retained in the reader or a named later episode? |
| Source and misconception | Source anchor/conditions; the likely wrong reading the image must prevent. |
| Beat / spoken cue | Exact script phrase; provisional beat timing, replaced by actual narration alignment when available. |
| Subject / focus / scale | What to look at; how it is identified and selected; parent object if magnified. |
| Before → action → after | Observable change, fixed reference, result held for inspection; what the motion means and does not mean. |
| Visual choice | Asset identity and growth interval; renderer/camera; reuse, adaptation or new diagram; model/schematic/source status. |
| Connection | Which object/state survives the preceding and following shot; explicit reset/example change if any. |
| Reading alternatives | Essential labels and description; phone composition; Still/discrete pose preserving the argument. |
| Review outcome | Build/time range, actual observed problem, repair, check performed, remaining uncertainty and exact maker response if any. |

For a comparison, include the denominator, units and held-fixed conditions in these cells.
For a deliberately quiet beat, say what the viewer is inspecting. No arbitrary minimum number
of animations, labels, assets or cuts is required.

## How a future reviewer should critique a scene

For a first-impression visual/editorial pass, watch at the intended narration speed **without
scrubbing**. Do not read the implementation first and then credit the image with knowledge it
never supplied. A code/source-only reviewer may inspect implementation first, but must state
that playback comprehension was not assessed. For the viewing pass, ask in viewer language:

- Where am I meant to look, and what is that object or line?
- What visibly happens while those words are spoken? Can I notice it without replay?
- What stayed fixed, what changed, and how does that explain the claim?
- Do the labels/numbers mean something now, or am I only seeing that they differ?
- Is this the same object at another scale, or did the subject silently change?
- What new understanding or worthwhile observation makes this passage earn its time?

Then replay only the suspect beat: inspect focus, before/action/after, transitions, a narrow
viewport, reverse seek and Still. Check the source where the image can change the scientific
meaning. Do not demand blanket new science tests for a presentation-only revision; use the
project's proportionate verification rule. Before multiplying a treatment, watch a complete
temporary-voice episode for pace and comprehension; record honestly if only samples were viewed.

Write findings as **scene + exact phrase/time + what the viewer actually sees + likely wrong
inference + smallest useful repair**. For example: “At the shared-air sentence both numbers
are visible, but neither surface changes; I cannot tell what the surplus does. Keep liquid
steady and show ice gain against a fixed before-line.” This is more actionable than “needs
more animation.” Diagnose identity/timing/causality before assuming the solution is more detail.

Use `revise`, `ready for maker review`, or `maker praised [named feature]`; retain `not checked`
for unobserved behavior. A source-meaning error, unidentified subject, invisible key change or
word/image contradiction needs repair before calling that scene ready. Taste suggestions can
remain suggestions. No averaged score may hide a comprehension failure. Tests/build completion
is reported separately from visual judgment; visual judgment separately from maker acceptance.

After a fix, replay the affected passage with its incoming/outgoing transition. Preserve any
praised component outside the defect. Stop once the bounded issue is resolved; do not start a
review-of-review programme or await final narration before useful drafting can continue.

## Applying the lessons beyond E01

### Episode 2 feedback: meaning, library use and continuity

The maker's response to the initial E02 draft adds these concrete checks (requested, not yet
accepted fixes):

- “there are hundreds of crystal animations” and the three-across comparison used only one
  model: inspect the existing library first. Use actual recorded examples when comparing crystal
  appearances; label their model status, camera scale and any geometric exaggeration. A drawing
  remains useful for a mechanism, but is not a substitute for the available crystal imagery.
- “mere history lesson” and the qualified value of X-rays: names and dates are optional. Keep a
  historical method when it answers a live question, such as how invisible spacing is measured.
  Move biography/chronology to the reader when it delays the investigation.
- “the \"d\" … wasn't explained”: every necessary symbol must have its referent shown and its
  meaning spoken before it is used. Prefer “plane spacing” to an unexplained letter. Apply the
  same rule to axis names, angles, scales and stacking letters—not just equations.
- “why tetrahedron?”: naming a geometric object is not an explanation. Show the four neighbouring
  molecules and what connects them before revealing the geometric guide; distinguish observed
  structure from any claimed deduction of it.
- Wants the education H₂O sheet, a zoomed-out rotating network, and layer positions to continue
  that sheet: preserve identifiable atoms/rings across camera and scale changes. Begin top-down,
  reveal puckering obliquely, then show interlayer connections. Do not substitute symbolic cards
  at the very moment the audience expects the same object to become three-dimensional.

This is scoped feedback on E02, not rejection of the praised E01 surface scene or home transition.

These are design prompts for the provisional episode map, not new science claims or approved shots.

| Future story job | Apply the lesson |
| --- | --- |
| E02 — structure, faces and scale | Keep a parent crystal while selecting the face/lattice detail; label the scale change and make the narrated direction the focus. Do not let a beautiful lattice rotate while its meaning goes unexplained. |
| E03 — delivery through air | Let the air region do visible explanatory work. Connect the chosen representation to an identifiable surface; distinguish material motion, field depiction and any model result. |
| E04–E05 — face growth and branching | Keep reference geometry and old material readable while the relevant location changes. Use the library/camera to reveal the narrated feature, not to replace a mechanism with a glamour shot. |
| E06 onward — comparisons, histories and measurement | Name the held-fixed conditions, carry specimens/history forward, show what an instrument observes before inferred quantities, and give each number a physical referent. No single unexplained map or table for an entire argument. |

## Maintenance

This guide is the reusable standard; the E01 guide and dated reviews are examples and history.
Future feedback adds its exact scoped response and refines the relevant rule here. Do not silently
rewrite an earlier quotation or infer approval from silence. Update the active plan's next action
and link the latest episode review; do not copy a growing chronology into every episode.

Prepared by the root OpenAI Codex agent from the available maker messages and linked records.
Shared-context read-only story review checked the synthesis; exact model identity was unavailable.
No new browser inspection, code change, audio generation or audience test is claimed by this document.
