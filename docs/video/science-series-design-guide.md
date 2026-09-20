# Science series — maker's critique and episode design guide

Captured 2026-09-16 from the maker's feedback and **last updated 2026-09-20**. It accumulates the
conversational E01 production lessons and the later introduction, visual-flow, comparison,
visual-clutter, real-model inspection and closing-hook feedback, then the 2026-09-18 Episode 2
catch-up and phone passes and the 2026-09-19 home redesign. A direction here can be reversed by a
later one: the 2026-09-17 opening soundscape was removed on 2026-09-18, and the opening itself was
rebuilt on 2026-09-19. Where a section is superseded it says so in place.
This is the reusable editorial/design guide for
the [active series plan](../plans/explore-journey-science-series.md), not a scientific gate.
The [E01 visual guide](science-series-e01-visual-guide.md) holds that episode's shot history.
The [conversational production review](../reviews/science-series-e01-conversational-production-2026-09-17.md)
records the latest repairs and their limits. Those self-review findings inform the requirements
below; they are not new maker praise or evidence of audience comprehension. Earlier scene
numbers in the feedback record refer to the earlier cut, not the revised episode's section order.
The later [Mandarin production review](../reviews/science-series-mandarin-production-2026-09-17.md)
records bilingual audio, same-page switching and their separate listening limits. The newer records
a future episode will want are the [Episode 2 script](science-series-e02-script.md) and its
[review with the 2026-09-18 catch-up addendum](../reviews/science-series-e02-review-2026-09-16.md#design-guide-catch-up--2026-09-18),
the [public science review of the deployed Episode 1](../reviews/nivogenesis-e01-public-science-review-2026-09-18.md),
the [Mandarin voice review](../reviews/science-series-mandarin-susan-2026-09-18.md), and the
website's own running record `docs/science-series.md`, where the shipped facts and receipts live.

## Start here when creating an episode

Use this sequence within the existing episode plan, script/shot table and review record—not
as another set of production documents:

1. Choose one question and a plain-language takeaway. Trace its prerequisites to actual
   demonstrations, not earlier mentions. Keep source dispositions so depth is not silently lost.
2. Draft in the [conversational voice](#narrators-voice--maker-approved-direction-2026-09-17)
   while browsing the animation library linked from the active plan. Write words and visible
   explanations together; do not finish a lecture and then decorate it.
3. Fill the [scene worksheet](#small-scene-design-worksheet), including input, action, result,
   likely misconception and transitions. Put optional quantitative depth in an actual reader.
4. Source-check the revised words **and what the diagram implies**, then prototype the hardest
   explanatory passage with a spoken rehearsal before multiplying the treatment.
5. Review a complete temporary-voice performance for pacing and understanding before scaling
   production. Record any partial coverage honestly; sampled checks do not fulfill that review.
   This is the step that keeps being skipped: Episode 2's own review records complete uninterrupted
   viewing at narration speed as **not checked**, because its reviewers seeked to instants. A
   sampled pass is worth having and is not this.
6. Follow the [audio and timing contract](#narration-and-timing-contract), including the maker's
   standing direction to refresh affected narration when its words are rewritten.
   Retime cues to the delivered performance; rehearse again after pause or tempo changes.
7. Apply the [viewing method](#how-a-future-reviewer-should-critique-a-scene) and
   [completion checklist](#completion-checklist-and-acceptance-boundaries). Fix specific defects,
   then distinguish technical readiness from listening and audience acceptance.
8. Ship it into the site: the catalog row, the release flag, the route, the home wiring, the
   Chinese copies and dictionaries, and the extended tests. The
   [delivery surface](#the-delivery-surface-an-episode-plugs-into) says what an episode must
   provide, [device and platform rules](#device-and-platform-rules-every-episode-inherits) say what
   it must survive, and the website runbook `docs/adding-an-episode.md` carries the exact files and
   commands. An episode that is written, performed and reviewed but not integrated is not finished.

If you are starting on a new machine, read
[where the work lives](#where-the-work-lives--two-repositories) first: the series is split across two
repositories that must sit side by side, and some of what the checks read is not in Git at all.

No fixed duration or authorization to start another episode follows from this guide. The
standing narration refresh does not authorize a different voice or an unrequested episode.
Keep the previous film and approved features intact.

## Where the work lives — two repositories

The series is split in two on purpose: **what is true** is written and reviewed in the authority
repository, and **what is served** is built in the website repository. Every episode has content in
both, and several checks read across the boundary.

| | Authority — `snowflake` | Website — `snowcrystal_website` |
|---|---|---|
| GitHub | `billatgameology/snowflake`, **public**, default `main` | `billatgameology/snowcrystal_website`, **private**, default `master` |
| Local path in use | `/Users/clipper/github/snowflake` | `/Users/clipper/github/snowcrystal_website-film-part1` (a Rule 16 worktree) |
| Holds | this guide; the plans, decisions and reviews; each episode's spoken script (`docs/video/science-series-eNN-script.md`), its Chinese copy (`…-zh-CN.json`), the shared diagram dictionary (`science-series-diagrams-zh-CN.json`) and the Mandarin cue sources; the education chapters the Sources links point at; the solver and its evidence | the site: episode components, cue and drawing modules, narration scores, the served narration masters under `public/series/narration/`, the served model derivatives under `public/growth/models/`, the brand files, every check script under `scripts/`, the hosting config and the deploy receipts under `docs/` |
| Episode text is | the source of truth | imported, and byte-compared back against the authority copy by the tests |

**They must be siblings, and the authority directory must be named `snowflake`.** Website checks
resolve the authority repository as `../../snowflake` from `scripts/`; a few accept the environment
variable `SNOWFLAKE_AUTHORITY` instead. Any other layout fails the localization and import tests.

### A fresh machine

1. Clone both repositories into the same parent directory, the authority one as `snowflake`.
   Check out the working branches named below — not the default branches, which do not have this
   work.
2. In the website repository: `npm install`, then `npx vite --host 127.0.0.1 --port 5185` for the
   dev server. Node 24 is what the scripts run on (24.19.0 at the time of writing).
3. Install the tools the checks shell out to: **ffmpeg and ffprobe** (every narration and audit
   step decodes audio), **the Playwright Chrome channel** (the live checks and the release smoke
   launch `channel: 'chrome'`), and the **Firebase CLI** logged in to the `nivogenesis` project for
   preview channels, the hosting emulator and deploys.
4. Restore what is deliberately outside Git (below). Without it the site still builds and runs;
   one test and all narration work do not.

### What is not in Git, and where it comes from

- **The authority repository's `out/` tree is ignored** (Rule 15). It holds the named-crystal
  growth recordings the served models are derived from; the website's episode test re-hashes each
  served `.bin` against its `sourcePath` inside `out/`, so that test fails on a fresh clone until
  the collection is restored from the governed NAS. The served derivatives themselves are tracked
  in the website repository, so the site renders without it.
- **Credentials are never in Git.** The ElevenLabs key lives at `out/secret/elevenlabs.txt` in the
  authority repository, restored from the NAS secrets backup. Read it inside the command that needs
  it; never print, copy or commit it.
- `node_modules/`, `dist/` and `dist-public/` are built, not stored. The narration masters and the
  model derivatives **are** tracked in the website repository (about 590 MB of audio at the time of
  writing), so a clone is large but complete.

### Branch truth — check this before trusting a clone

As of 2026-09-19 the series work lives on local branches that have **not** been pushed:

| | Branch | Contains | On origin? |
|---|---|---|---|
| Authority | `explore/film-part1-plan` | the plans, reviews, scripts and translations for E01 and E02 | **no** — `main` does not contain this work |
| Website | `explore/film-part1` | every episode and the live site | **no** as a branch; the deployed commits are reachable through the pushed tags `nivogenesis-public-2026-09-18`, `-09-18.2` and `-09-19`, and `release/nivogenesis-public` holds the first release |

A second machine therefore cannot reconstruct the current state from GitHub alone. Either push the
branches or copy the worktrees. Pushing the **website** branch is ordinary: that repository is
private. Pushing the **authority** branch publishes Episode 2's script and translation to a public
repository while the episode is deliberately held from the site — that is the maker's decision, not
a housekeeping step.

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
samples and full E01 AI sample narration. The maker's subsequent standing direction is to
refresh affected English narration whenever the spoken English is rewritten, as specified in
the [audio contract](#narration-and-timing-contract). Visual-only changes do not by themselves
require new speech. Draft words and visuals together and retime to the actual performance.
The later maker-supplied Mandarin voice `4AfodMgwXps9oZFhHzoj` (Yun) lifted the Mandarin deferral for
the translated episodes. On 2026-09-18 the maker auditioned `0H4ruoQ81Ei2FCwjW5j1` (Susan - Warm
Narrator) and then chose Yun again, so Yun is the Mandarin refresh voice; the Susan revisions are
retained. Neither authorizes inventing another voice.

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

### Follow-up on the narrated eleven-section revision

The maker subsequently requested a substantive Kenneth Libbrecht introduction and reported
that section 6 still spent too many words over little visible change, with poor explanatory
flow. The whole section 9 comparison remained confusing; its percentage numbers appeared
before their purpose was established. These are maker-reported problems with the later cut,
not a retraction of the earlier praise for scene 5's surface treatment.

The [current script](science-series-e01-comprehension-draft.md) responds by giving Libbrecht
a relevant one-sentence introduction, rebuilding R06 as visible controlled comparisons, and
keeping R09 on the actual extra-vapour amounts in equal-volume −15/−40 °C reference samples.
All percentages and their calculation remain in the optional reader. This is a requested
revision; later maker praise below specifically accepts its sequential visual construction,
not proof of a fresh viewer's understanding of every comparison.

Carry forward three lessons: introduce a cited person by why their work matters; establish
what is being compared before displaying its numbers; and make each causal step visible as
it is spoken. Adding friendlier words to an unchanged image does not resolve a visual-flow
problem. The exact cold pair is an E01 example, not a rule to repeat in future episodes.

### Follow-up: attention, clutter and the praised scene-9 build-up

The maker's later English scene-7 screenshot shows chapter navigation, Sources and Still,
a chapter eyebrow and title, a second diagram heading, a quantity plus qualification, local
labels, a net-flow sentence and a long model disclaimer competing in a narrow frame. The maker
says there are “way to many titles and words that are not helpful” throughout the episode and
requests a Menu for the secondary tools. This is an attention/hierarchy critique, not a request
to make every label smaller or strip away the identities they previously asked us to explain.

The maker explicitly praises revised scene 9 because “you don't show everything at once” and
“you show items one at a time as you explain, and build up the scene”. Carry forward the method:
reference first, change next, comparison once both operands mean something. The praise applies
to that construction, not automatic acceptance of all science, timing or audience comprehension.

The resulting English E01 pass keeps the spoken script and audio, moves secondary controls and
full production notes into Menu → Sources, and makes detail arrival depend on the existing
spoken cues. Shared display labels retain Chinese equivalents to avoid breaking the existing
toggle; this pass does not rewrite either performed language or synthesize narration.
The [attention-pass review](../reviews/science-series-e01-attention-2026-09-17.md) owns the
actual verification and its limits. These implemented responses are not new maker praise.

For each beat, decide three things: **what enters now, what remains as a useful reference,
and what can retire**. Keep the object stable when its context changes. A selected drop can
lead to a magnifier; a plain box can lead to wall impacts, then water's contribution, then a
pressure indicator. Do not introduce all four explanations at entry and merely highlight them
later. A comparison overview can still be useful—the earlier four-panel overview was praised—
but unvisited panels need not already display every result name or mechanism annotation.

### Follow-up: meaningful labels, real inspection and an actual ending hook

The maker's next screenshot identifies an unlabeled upward arrow beside a large droplet.
Keep the diameter visible first. When explaining air resistance, place the upward indication
below the falling drop and name its effect: it slows the fall. Then show rising air separately,
which can keep a small drop suspended. Grey airflow strokes must not be mistaken for the
white water-vapour tracers. This is a direction/referent/sequence problem, not a demand for more
text everywhere; a small screen must retain the essential label.

The maker also requests removal of the opening production sentence and scene-1 model badge.
Those particular on-stage notes move to accessible Sources; model status has not changed.
Do not generalize this into removing conditions necessary to understand a comparison.

An inspectable snowfall flake should be an actual project recording in the established ice
renderer, not a decorative glyph revealed at larger size. Preserve its identity and camera
through the opening handover. Hover may enlarge it, but click/touch/keyboard must also work;
rotation, bounded zoom, reset and dismissal must not hijack ordinary page scrolling. Test
loading, redraw after enlargement, offscreen release and phone-sized framing. Keep decorative
weather separate from any claim of physical prediction.

The final line should leave a specific unanswered question that belongs to the next episode,
not sound like restarting this one. The E01 revision says “Next episode, we're going inside
the ice,” then asks what a flat plate and branching star have in common, ending with “Why six?”
Refresh the changed narration and its visual cues together. These are implemented responses
to the maker's requests, not yet new praise or comprehension evidence. The
[follow-up review](../reviews/science-series-e01-opening-followup-2026-09-17.md) records verification
and remaining limits.

### Follow-up: Episode 3 needs one novelty at a time — 2026-09-20

The maker's first Episode 3 review reports a specific comprehension failure rather than a request
for more decoration. The laboratory droplet image in scene 4 is unclear and should read top-down.
The paragraph beginning “In the source, the observed moat...” asks the viewer to learn technical
wording, a new evidentiary distinction and a new side-by-side representation at once. Scene 5 shows
its complete system before its parts have meaning; the narration describes depletion, movement and
growth while the important visual states read as static. The cut from that finished sphere comparison
to scene 6's finished hexagonal field is abrupt. Scene 8 works and should be preserved. Scene 9 needs
a quick visible recap of the episode's causal chain and plainer words before the flat-face question.

The repair is **one kind of novelty per teaching beat**: a new physical idea, a new technical name or
a new visual grammar, not all three together. When the representation changes, use it first to restate
an idea the viewer already understands. When the concept changes, keep the established representation.
Name a technical concept only after its visible event has acquired ordinary-language meaning. Build
subject → changed condition → visible action → result, then show the combined comparison or recap.
Do not begin with the finished overview and merely highlight pieces of it later.

For the laboratory reconstruction, establish a top-down faceted crystal and clearly liquid droplets
on the support, let the viewer notice the already-clear scalloped moat, trace its boundary, and only
then place the observation beside the calculated field. Do not animate unobserved droplets forming or
evaporating, and do not imply pixel registration between different source figures or specimens. For
the ideal-sphere passage, follow delivery to the surface and net addition to the ice in one case before
introducing the changed surface case; no dot count may imply that the effective surface response is a
literal one-collision joining probability. Put the cases side by side only after both are understood.
Carry the centered sphere and outer supply into the shape change; identify the corner and face centre
before contours enter, and explain in ordinary words that each contour marks the same amount before
naming contour spacing or gradient. End by re-enacting the episode's few causal moves one at a time,
then retain one selected face for the next question.

This feedback came from the maker. The bounded synthesis above was prepared by a shared-context OpenAI
Codex agent acting as a documentary and education director reviewer, not a person claiming human
directing or teaching credentials. That reviewer read this guide, the complete Episode 3 authority
script and the current drawing/cue source, and inspected retained scored frames. It did not perform a
fresh normal-speed playback, human listening review or audience-comprehension test.

## Nivogenesis collection and optional sound — 2026-09-17 (the sound was later removed)

**Superseded in part.** The maker removed the opening soundscape on 2026-09-18 ("remove play with
sound"): the home has no audio element and no sound control, and a test pins their absence. The
composition and its reproducible recipe stay retained in the website repository, unshipped. The
collection direction below still stands; read the sound paragraphs as history.

The maker names the series **Nivogenesis** and asks for the three additional E02 crystal
recordings in the opening. Reuse a varied, identifiable collection rather than filling every
position with the same attractive star. Keep the established renderer, inspection controls and
the original Run B arrival. Additional recordings need a bounded rendering budget: static
demand-driven previews, one expanded inspection at a time, low-tier decimation and release
when offscreen. This is a product decision, not acceptance of the models as physical predictions.

The maker also authorizes the suggested quiet air-and-crystalline-tone soundscape. Sound
supports the opening's mood; it does not represent measured crystal vibrations or explain a
scientific mechanism. Keep it explicitly opt-in, with an obvious mute control and no automatic
restart. Wait for the visual to be ready, follow its clock, and stop before narration takes
ownership. (Superseded with the sound: there is no pending playback to cancel, and the control
names changed — Still and Replay opening moved into the episode Menu on 2026-09-19, and the Skip
that exists now is the opening's own bottom-right control, not the old controls bar. The rule
survives for any future opt-in media: every exit cancels it.)
Skip, Still, leaving the home, hiding the page and unmount must cancel pending
playback too. A quiet waveform and successful decoding are technical checks, not a listening
review: distinguish them and ask the maker to audition on their own speakers or headphones.

Inspect replay and display-density changes as well as first load. A retained drawing buffer
can still be cleared by a DPR change; an obsolete asynchronous renderer must not reconfigure
or dispose the replacement's canvas. The
[Nivogenesis review](../reviews/science-series-nivogenesis-2026-09-17.md) records these repaired
failures and the bounded visual/audio checks. This request is not new praise for the result.

Opening direction, 2026-09-19, as shipped: the maker asked for an opening that is "super clean", and the
live home is the snow scene with the series title, **one central Play that appears only after the opening
finishes**, and a **Skip at the bottom right while it plays** (the maker's phone test reversed a review
repair that had shown the Play early). Skip lands on the finished scene with the snowfall already full;
Play enters Episode 1 without passing the cards. The episode cards are the second scene, reached by
scrolling; Still and Replay opening live in the episode Menu; each episode loads as its own chunk only
when chosen. The record is the series plan's 2026-09-19 section and the website's `docs/science-series.md`.
Not new praise for the result.

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

**Revised scene 9: understanding accumulates.** The later praise singles out how the picture
is built in time. Copy the reference → change → result sequence, not its specific dots, boxes
or temperatures. This supports the design direction, not a new universal scene template.

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
[performed conversational script](science-series-e01-comprehension-draft.md) apply this requirement.
That file retains its original draft filename but now binds the produced narration; do not
treat it as an unperformed scratch draft or edit it without an explicit script revision.

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
  exiled to a footnote. The reader supplies the explanation, units, conditions and calculation,
  with precise source links—not just a list of references or internal production shorthand.
  More useful explanation may require more time or another section.
- Explain every representational change: what a dot, colour, box, axis, unit or letter means,
  what is held fixed and what it cannot imply. Do not recolour vapour as the established liquid
  colour merely to distinguish an arithmetic subset. Invented teaching counters must be
  explicitly separate from source-derived scientific examples.
- Rehearse at ordinary speaking speed. Give the viewer a chance to predict a consequence
  before revealing it, without mandatory quiz UI. A quiet hold should support thinking about
  an understood picture, not waiting for an unexplained symbol to acquire meaning. Show the
  changed input before the question; withhold answer labels and result motion until its release.
  If geometry is held for prediction, identify that editorial hold rather than imply physical
  balance. Keep continuing molecular traffic visible when that is part of the explanation.
- Ask a general-adult reviewer open questions: “What happened?”, “Why?”, “What would happen
  if we changed this?” and “What does this not tell us?” Record their actual answer and the
  first missing link, not just “clear?” or a satisfaction score. Do not coach the answer and
  then count it as independent understanding. Repeat only the affected explanation after repair.

For E01, the main checks are the water route without collision; equal exchange despite
unchanged size; different outcomes for liquid and ice in the same air; water-vapour pressure
versus all-air pressure; the reference and extra vapour in equal-volume samples; and what
remains unknown about shape. Percentage reasoning is now an optional-reader check, not a
prerequisite for following the narrated story.
They are acceptance questions for a future viewer, not a new automated gate or claimed result.
Preserve scene 5's explicitly praised visuals while improving its vocabulary bridge.

### Narrator's voice — maker-approved direction, 2026-09-17

The maker found the revised tone too technical, requested a teenager-friendly sample of the
hardest idea, then explicitly liked the two-neighbours sample and asked to apply its tone to
the draft. That approved the **voice direction**. Later requests authorized production and
English audio, followed by the standing refresh direction below. None of these actions
establishes audience understanding. Mandarin production was separately authorized by the later
voice-ID message, not inferred from the tone approval.

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

R05–R07 of the [performed script](science-series-e01-comprehension-draft.md) adapt the approved
sample while retaining the earlier demonstration and avoiding an unnecessary second full
equilibrium lesson. The whole script follows that voice. The earlier cut's production and
bounded synchronization checks did not establish audience understanding; the later R06/R09
feedback requires changes to the visible explanation as well as the words. Human listening
and uncoached audience-understanding checks remain distinct from tone approval.

Use its conversational pattern where useful: **notice something → ask what changed → follow
the cause → name the idea → use it**. It is not a mandatory rhythm for every paragraph.
Preserve precision in the ordinary words: water that reaches a surface has not necessarily
joined it. Simplifying the vocabulary must not simplify away the mechanism or its conditions.

### Visual and editorial requirements

**Budget novelty before adding detail.** In one teaching beat, change only one of the physical idea,
the technical wording or the visual grammar. A representation change first carries a known idea; a
concept change keeps a known representation; a technical name follows the ordinary-language event it
names. This is a sequencing rule, not a quota on words, cuts or drawings. The combined overview belongs
after its components have meaning.

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
   When a passage advances the explanation, give it a corresponding visible change or a clear
   inspection target. Do not spend several introductory paragraphs restating a puzzle over an
   almost unchanged diagram before the first useful action. Carry an already-understood state
   forward and change one condition where that makes the next cause easier to see. Treat narrated
   verbs as shot obligations: if the words say reaches, joins, depletes, grows, reverses or refreshes,
   the relevant state must visibly change at that phrase. Still and reduced-motion views preserve a
   before reference and the changed result instead of exposing the final diagram from scene entry.
5. **A comparison the viewer can read.** Preserve a before-outline, fixed boundary, scale or
   matched view when change is the lesson. Camera tracking must not conceal growth. Rotation
   is not growth; a sliding block is not added material. State what is held fixed and changed.
   Anchor old material and the rear edge while the growing face advances. Do not compress the
   gas coordinates simply because less drawing space remains; clip at the new solid boundary.
6. **Motion that explains the mechanism.** Animate the causal journey and its outcome, not
   ambient busyness. When narration distinguishes reciprocal traffic from net change, show
   both. A route reaches its actual surface; a boundary's label, traffic and movement agree.
   Show the changed input as well as the outcome: saying “less vapour” cannot leave an identical
   gas picture with only a different caption. Distinguish qualitative staging from counted data.
7. **Object and scale continuity.** Carry the same parcel, donor, seed, face or crystal through
   related beats. Introduce a close-up with a selection/leader and retain a parent reference
   when helpful. If the shot is a new specimen, example, model or schematic, say so. Before a reset,
   close a comparison back to one subject and carry one invariant—centre, scale, outer condition,
   selected face or highlighted mechanism—across the cut. Then change only the intended variable.
   Preserve irreversible story changes; do not refill a depleted donor or unfreeze a seed accidentally.
8. **Meaning before arithmetic.** Before a chart/table/equation, establish the physical
   question and what the compared quantities do. Attach units and reference conditions to
   objects. Show the denominator and absolute amount when a percentage can mislead. Keep
   provenance available, but do not make understanding depend on knowing the cited table.
   Introduce the quantity, reference and purpose before the comparison numbers appear; an
   unexplained percentage is not a useful opening hook. A cited person's name also needs
   context: briefly explain their relevant work before relying on their authority. If arithmetic
   creates a second lesson that obscures the physical story, retain it in an actual reader
   while teaching the physical comparison in the main scene.
   Highlight the reference first, then the extra; preserve equal volumes and constant dot units
   when comparing amounts. Rounded populations must not imply an exact decimal percentage.
   Clearly label invented counters as a teaching example, separate from scientific quantities.
9. **Enough imagery for the ideas, not an animation quota.** A multi-concept passage needs
   corresponding visible stages, comparisons or discoveries. One image may evolve; a chart
   may be useful; neither is forbidden. Reject a static diagram that stops explaining while
   narration moves on. Choose library assets/renderers by story job, reusing, adapting or
   creating treatments wherever the story benefits. Distinguish observation, explanatory
   diagram and model output. When a spatial pattern is the evidence, begin in the viewpoint that
   makes the observation readable, show it alone, focus the pattern, and only then introduce an
   inferred or calculated representation beside it. A closing recap re-enacts the causal spine in
   a few sequential motifs; it is not a spoken list over one already-finished image.
10. **Beauty with readable hierarchy.** Give the crystal and its changes visual presence,
    inspect lighting/facets/depth in motion, and remove distracting artifacts. Put essential
    labels/numbers in quiet, high-contrast space. Check narrow layouts without squeezing all
    annotations into the image. Attractive rendering must not mask identity or imply validation.
    The animation is not a slide deck: do not stack the chapter title, a subsection title,
    an action heading and a full-sentence explanation of the same event. Put chapter navigation,
    sources, Still and Replay opening in an accessible secondary menu; leave core playback
    reachable. Still is one series-wide toggle owned by the page — it freezes the opening snowfall
    and the episode illustrations together — and Replay returns to the top, replays the opening and
    keeps the visitor's Still choice. Keep
    chapter titles in the reader/navigation. On the stage use at most one current-beat heading
    when it helps, and prefer direct object labels/pointing to repeated headlines.
    Make the primary Play unmistakable while paused and quiet while playing: a fixed minimum width
    so the control does not resize, a filled highlight with a play glyph, and a gentle pulse that
    becomes a static ring under reduced motion. The home's central Play follows the same rule.
    A useful label identifies an otherwise ambiguous object, condition, quantity or change.
    Introduce it when it becomes relevant; retain it only while it helps decode the image.
    Remove a redundant label rather than shrinking it or dimming it into illegibility. Canvas text
    has a floor that must survive the stage transform: hold a minimum on-screen size rather than
    scaling a desktop-tuned one down, and switch to a small-screen type ramp on narrow viewports.
    Move generic repeated production caveats into Sources; keep model identity and validation
    status tied to the renderer actually displayed in those accessible details. A persistent
    on-stage badge is not mandatory (the maker explicitly removed E01's first-scene badge). The
    pattern both episodes now use instead: a compact model key appears **only while a recorded model
    is actually on screen**, names its status in a few words, and is a button that opens
    Menu → Sources for the full provenance. A key that outlives its renderer, or that sits over a
    diagram fallback, is the defect this replaced.
    Keep inference-critical qualifiers
    locally at the relevant beat (approximate example, held prediction, fixed temperature,
    equal volume/dot unit, externally controlled vapour, or altered model thickness).
    Accessible detail is not permission to omit the condition that makes the visible claim true.
11. **Continuous experience with reader control.** Preserve filmic entry and transitions,
    user-initiated narration, and immediate manual takeover. Use the same explanatory states
    for audio time and reversible reading. Still/reduced motion retains the idea, reference
    and result even when animation is removed. Do not make motion the sole source of meaning.
    Still should be a legible pose for the current spoken idea, not an arbitrary frozen frame
    or the entire scene's final answer shown too soon.
12. **Honest scope and acceptance.** Source qualifiers survive the visual: an example is not
    a universal threshold, a styled model is not measured reality, and illustrative rates
    are not predictions. Keep author/reviewer observations and maker praise distinct. Preserve
    prior work and approved features; later approval applies only to what was actually named.

## The delivery surface an episode plugs into

The site is three scenes in one document: **opening → episode selection → the chosen episode.** The
opening is the snow scene with the series title, one central Play (shown once the opening arrives)
and a Skip at the bottom right while it plays. The selection scene lists the episodes as cards. The
chosen episode follows. Still and Replay opening live in the episode Menu. An episode is a guest in
this structure, and it must supply what the structure expects.

**One row of data, one chunk of code.** Every episode is one entry in the website's episode catalog
(number, kicker, title, route, released) and one lazily imported module. The selection cards, the
Coming-soon state and whether the public build contains the episode all derive from that row;
nothing else enumerates episodes. Episode 1 is prefetched during the opening because its Play is
the fast path; every other episode loads when it is chosen. As the series grows — the maker speaks of thirty, while the series plan's working map lists eleven
units and disclaims a fixed count — this is the property that matters: **the home must never carry
an episode nobody asked for.** Measured on the live build
of 2026-09-19, a visitor who never presses Play loads the home chunk and Episode 1's prefetch and
nothing else.

**What an episode component must provide.** A handle the home can drive (start, pause, and a
language-switch position capture), an ownership contract (claim, release, and a blocked test that
every scroll, resize, tick and takeover path consults, so exactly one episode owns playback), scene
controls (the shared Still, a Replay that returns to the opening), and a queued start: a visitor can
press Play before the episode's chunk has arrived, and the episode must honour that start from its
own mount rather than dropping the press. Direct entry at `/episode-N` must land in the reader
rather than replaying the opening.

**A held episode is held in four places at once.** While an episode is unreleased, its import is
dead code behind a build-time literal, its route redirects to the opening, the public asset
allowlist omits its narration, and the release test plants the episode's own live strings in the
built output as negative controls. All four must be extended for each new held episode, and the
local review gate (a query key that mounts the held episode on non-public builds) is per episode,
not generic. Releasing is then one flag plus the allowlist growth, a fresh public build and the
smoke.

**Generalize before Episode 3.** The current wiring is honestly pairwise: the home's playback
ownership is typed for two episodes and pauses "the other" by name, the language-switch restore
collects exactly two handles, and the import, pacing, cue and test scripts are per-episode files
with hard-coded section counts. None of that is a flag away. Budget an explicit generalization pass
— a keyed map over the catalog, and per-episode parameters instead of per-episode scripts — before
the third episode, and do it as its own change so the diff that adds an episode stays readable.

The website runbook `docs/adding-an-episode.md` holds the file-by-file steps, the exact commands and
the known traps. Keep that runbook current when the wiring changes; this section states the rules
that outlive it.

## Device and platform rules every episode inherits

These are paid-for rules. Each one came from a real failure on the maker's phones, and every
episode's stage inherits them.

**Touch must scroll.** The site's global stylesheet disables touch panning on every canvas, which
is right for a drag-to-rotate surface and wrong for a full-screen scene: once the opening's cards
moved away, a finger on the snow could not scroll the page at all. The series home and the episode
stage canvases opt back in to vertical panning; a deliberate manipulation surface (the crystal
inspector) keeps the block, and says so where it is written. A new canvas outside those selectors
is unscrollable until you extend them.

**Two snowfall renderers, and iOS always gets the second.** A WebGPU compute field runs where WebGPU
exists and the performance tier is high enough; otherwise an analytic WebGL2 field draws the same
weather, and a static wash is the last resort. No iOS browser exposes WebGPU, so every iPhone and
iPad runs the WebGL2 path: **treat it as a first-class look, not a fallback.** It once drew a
sixteenth of the flakes the compute path drew at phone size — four compounding causes: iOS reports
at most four cores and no memory, so the tier heuristic demoted it; the WebGL2 count table was half
the compute one; that path hid half its particles until the page was scrolled; and its sprites were
shrunk on narrow screens. All four are fixed, and the tier rule now recognises Apple touch devices
explicitly. If you touch a count table, a sprite size or a device heuristic, re-measure the two
paths side by side at phone size and record the numbers.

**Guided scroll survives an asynchronous browser.** iOS WebKit applies a programmatic scroll
asynchronously, so a naive "did the position change?" test reads the site's own writes as the
visitor taking over, and playback stops a second after it starts. The episodes keep an envelope of
recent programmatic positions and ignore scroll events inside it, re-seeding that envelope on pause
so a late event cannot flip the reader into manual. A touch takeover additionally needs ten pixels
of movement, because a tap wobbles. Reuse these; do not re-derive them.

**Budget the renderers on touch devices.** iOS Safari recycles WebGL contexts and reloads the tab
under memory pressure where Android Chrome does not. Fewer live recorded models, half-resolution
volumes, a capped device pixel ratio and a capped tier brought the opening from nine live contexts
and a 112 MB heap to seven and 62 MB. Count the contexts a new scene mounts, release them when it is
hidden, and handle context loss with a legible status rather than a dead canvas.

**Compose at 360 px, not only at desktop.** Canvas labels that sit clear on a laptop collide on a
phone: the stage scales, so drawing code holds a minimum on-screen type size rather than shrinking a
desktop-tuned one, and each collision found in review needed its own repair (a halo behind a label,
spaced legend lines, a smaller outline, a shortened tag). Full-height rules ship a plain-`vh`
declaration before the `svh` one for older iOS. The stage becomes a sticky band on phones and any
height change must be mirrored in the scroll offsets that depend on it. Bottom-anchored controls
clear the home indicator with a safe-area inset and are at least 44 px tall.

**Debug on the real device, then believe only what you measured there.** `?diag=1` prints an overlay
with the user agent, capability probes, viewport and canvas metrics, the active renderer, live and
peak WebGL contexts, the heap, and every media-play outcome including refusals. Narration start is a
user gesture on iOS and can still be refused, so the retry path stays. And note the standing limit:
every check the records describe ran under Chrome phone emulation, which cannot reproduce the iOS
memory pressure that motivated the budget. A clean emulated run is not evidence that an iPhone
survives a new scene; the maker's own device is.

## Small scene-design worksheet

Add this information to the episode's existing shot table; do not create another database.
A scene can have several conceptual beats. Group sentences that share one visible action.

| Field | Author must supply |
| --- | --- |
| Question and takeaway | What should a first-time viewer understand by the end that they did not at the start? |
| Prerequisites and explanation | What must already be understood, where was it demonstrated, and what plain-language causal explanation earns the new concept? |
| Understanding check and depth | What can the viewer predict or explain without a term prompt? Which nonessential quantitative detail is retained in the reader or a named later episode? |
| Source and misconception | Source anchor/conditions; the likely wrong reading the image must prevent. |
| Beat / spoken cue | Exact script phrase; provisional timing replaced by actual narration alignment; local inspection/prediction hold and answer-release cue where needed. |
| Subject / focus / scale | What to look at; how it is identified and selected; parent object if magnified. |
| Before → action → after | Visible input change, observable response, fixed reference, result held for inspection; what the motion means and does not mean. |
| Attention and disclosure | What enters now, what remains as reference, what retires; which local labels are necessary and which headings/details belong in the reader or Menu → Sources. |
| Novelty budget and build order | Which one is new in this beat—physical idea, technical wording or visual grammar? What known reference carries it? In what order do subject, changed condition, action, result and eventual overview appear? |
| Visual choice | Asset identity and growth interval; renderer/camera; reuse, adaptation or new diagram; model/schematic/source status. |
| Connection | Which object/state survives the preceding and following shot; explicit reset/example change if any. |
| Reading alternatives | Essential labels and description; phone composition at 360 px; Still/discrete pose preserving the argument. |
| Device budget | How many live WebGL contexts this scene mounts and when they are released; whether it depends on the WebGL2 snowfall path; the phone stage height it assumes. |
| Review outcome | Build/time range, actual observed problem, repair, check performed, remaining uncertainty and exact maker response if any. |

For a comparison, include the denominator, units and held-fixed conditions in these cells.
For a deliberately quiet beat, say what the viewer is inspecting. No arbitrary minimum number
of animations, labels, assets or cuts is required.

## Narration and timing contract

Words, images and pauses are one performance. A correct transcript beside a correct diagram
can still fail if the useful action happens before the viewer knows where to look.

**Standing maker direction for future spoken-English rewrites:** automatically refresh the
affected English narration as part of the rewrite, using the current approved English voice,
**Juniper** (`aMSt68OGf4xUZAnLpTU8`), and update its alignment, captions and scene cues. This is
explicit ongoing direction, not permission inferred from an old sample. Reuse unchanged takes
where appropriate; do not leave old spoken words playing against a rewritten transcript.
Visual-only or optional-reader-only edits do not require synthesis when the spoken words are
unchanged. Preserve earlier recordings and the exact source of each new take. Keep the Chinese
text in step with the revised meaning: a qualifier must survive translation at equal strength, and
neither language may carry a claim the other does not. Every new or changed canvas caption and
interface string needs its Chinese entry in the shared dictionaries — a missing key falls back to
English silently by design, so add an explicit assertion for each episode's own keys. The maker supplied Mandarin voice **Yun**
(`4AfodMgwXps9oZFhHzoj`) on 2026-09-17, auditioned **Susan** (`0H4ruoQ81Ei2FCwjW5j1`) on 2026-09-18
and chose Yun again the same day; Yun is the current Mandarin refresh voice, and the Susan
revisions stay retained (E02 moved to Yun on 2026-09-18 when the maker reopened it for the design-guide
catch-up; its Susan revision stays retained). When a rewrite changes
performed Chinese words, refresh the affected Mandarin take and rebuild its semantic alignment
as well; do not play a stale translation against the new meaning. The standing refresh does
not authorize a different voice or an unrequested new episode.

**Episode 3 English-first override — 2026-09-20:** for the current clarity revision, finish and obtain
maker acceptance of the revised English script, staging and performed English episode before producing
revised Mandarin audio or finalizing Mandarin semantic alignment. Do not play the retained Mandarin
performance against changed English meaning or changed reveal logic. Preserve every historical Yun
take and receipt; this is a sequencing pause, not permission to delete or overwrite them and not a
general reversal of bilingual parity. After English acceptance, revise and review the Chinese source,
cues and affected Yun performance from that accepted meaning in one bounded pass.

**One bilingual performance, not two pages.** The top English / 中文 control selects Simplified
Chinese text and Mandarin audio together, on the same route and DOM. Languages have different
real durations. Preserve section, paragraph and semantic phrase position—not elapsed seconds
or a whole-episode duration fraction. Each selected recording owns the clock; convert it to
the shared visual score through reviewed phrase anchors. Retain actual prediction pauses and
their withheld answers. A hold is inserted silence in the paced master of **both** languages, not a
visual pause over continuing speech: it runs before the named answer phrase, the answer releases on
that phrase's measured onset, and the on-screen labels share the same release state. Durations are
per episode (Episode 1 holds 2.4 seconds, Episode 2 three), so author them as data, not as a
constant. Show the selected recording's duration. Pause the old element before
playing the new one, keep speed and paused/manual mode, invalidate old play promises, and apply
the latest position when metadata arrives. Test round trips, rapid switches, buffering/error
handling and live switches during a prediction pause. No autoplay from a paused language toggle.
Sentence-internal animation progress is interpolated **when no word timing exists**. It usually now
does: the delivered English takes carry measured word onsets, and Episode 2 gates its reveals on
authored phrases resolved against them — a phrase that is missing or ambiguous inside its paragraph
throws rather than guessing. Mandarin carries no word array, so a cue reaches it through the
bilingual anchors. Provider timings remain provider timings, not a phonetic measurement. A natural pause may exist in only one language, so record coincident anchor reductions
and inspect the affected cues. Fluent listening remains distinct from machine alignment.

- Before recording or synthesis, review the exact spoken source and its diagram implications.
  Separate spoken text, reader text and animator instructions. Record the approved source
  identity and the narrator/voice authorized for this revision. Apply the standing English
  refresh above within its scope; an earlier sample alone grants no additional scope.
- Preserve original takes and request text, non-secret voice/model/settings, source hashes,
  alignment and decoded durations. Keep any paced derivative separate. Never log credentials,
  overwrite prior masters or automatically repeat an uncertain paid request.
- Measure and record integrated loudness for every delivered master in both languages at each
  refresh. Mandarin currently sits about three units below English on both episodes (Episode 1:
  −28.8 against −25.2 LUFS; Episode 2: −28.6 against −25.6), so the language toggle is a step down
  in level. No gain change has been made: matching them is a maker decision, and the measurement is
  what makes it decidable.
- Actual media time owns captions, visual cues and guided scrolling. Buffering or a failed
  play request must not let an independent clock keep narrating visually. Silent rehearsal
  timing remains explicitly provisional; user input pauses guided playback and hands over.
- Pace difficult passages locally. Listen/rehearse the delivered phrase and inspect whether
  the viewer has time to identify the subject, see the action and understand the result.
  Words per minute can flag a rushed passage but cannot certify clarity. Use useful pauses or
  bounded tempo adjustment when appropriate; do not copy E01's exact speeds/holds as a recipe.
- After editing tempo, inserting pauses or joining takes, rebuild the timeline from decoded
  audio segments, then recheck affected captions, cue boundaries and transitions at normal
  playback speed. Accurate paragraph endpoints do not prove accurate word timing. Label
  interpolated timings as such; use fresh alignment if the required cue precision needs it.
- Keep AI narration visibly identified. Technical signal/source checks and optional independent
  transcription can catch defects; they cannot approve pronunciation, natural delivery or the
  emotional fit. A human listen remains a separate, explicitly recorded task.

**Production invariants.** The pipeline is built so that a mistake fails loudly instead of quietly
shipping. Do not route around any of these; the website runbook has the commands.

- **The script's hash is the root of the chain.** The authority script's SHA-256 is written into the
  imported content, carried into every retained request record and score, and recomputed from the
  authority file by the tests. Editing the script without re-importing, or re-importing without
  regenerating the affected takes, breaks the build by name.
- **One request per section per take, and never an automatic retry.** Any failed or uncertain
  synthesis stops with an explicit message; an orphan request file is a stop sign to investigate,
  not litter to delete. A dry run is the default, and synthesis happens only with the explicit
  generate argument and a credential path.
- **Revision directories are immutable.** Masters, takes and provenance are written create-only, and
  a rerun refuses to overwrite. A changed take means a new dated revision; earlier revisions stay
  retained as reuse sources, and reuse copies a take only when the spoken text, voice, endpoint,
  model and settings match exactly and the old audio re-hashes.
- **Synthesis settings are pinned and test-enforced** (model, endpoint, stability, similarity,
  speaker boost and speed). Changing them changes the performance: that is a recorded decision, not
  a tweak. The voice itself is pinned in a test too, so a substitution cannot be quiet.
- **Every phrase that gates a visual reveal must be resolvable and unambiguous on the English word
  clock, and must start a Chinese anchor pair.** The lookup throws on a missing or ambiguous phrase;
  the semantic review then maps each onset through the bilingual anchors and demands the two agree.
  Word-level timing exists only on the English score, so a cue that needs a Mandarin word onset
  cannot be written — reach Mandarin through the anchors.
- **Pacing is composition, not editing.** The current standard inserts silence at natural gaps and
  never time-stretches a take; the English pacer's older sibling did stretch one section, so do not
  copy it. Prediction holds are authored data, and the Mandarin clock refuses a translation whose
  recorded English hash no longer matches.
- **Run the three independent audits** (integrity, pacing, semantic score) parameterized to the new
  revision and keep their output in a dated directory. They re-derive from the bytes rather than
  trusting the producer, and their hard-coded expectations — the number of phrase-gated reveals, the
  prediction list — are alarms to update deliberately in the same pass, not noise.

Worked example: E01's comparison needed more thinking time, not a blanket slower film.
The retained take was paced locally; the changed vapour input became visible before the
question, its answer label waited for the release, and the surface then moved against a fixed
reference. The [production review](../reviews/science-series-e01-conversational-production-2026-09-17.md)
records what was measured and watched. This is a tested production repair, not proof that a
fresh viewer now understands the comparison.

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
- Is the next idea already fully drawn before its explanation? What can arrive later without
  losing the reference needed for comparison? Which text repeats something already clear?

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

## Completion checklist and acceptance boundaries

Use these prompts in the existing review record; mark each relevant item checked, needs repair
or not checked. Record the build/source/audio identities and actual coverage. A silent draft
marks final-audio checks pending rather than inventing speech or claiming a completed performance.

- **Content:** prerequisites are demonstrated before reuse; conversational wording remains
  source-correct; qualifiers survive the image; optional depth is actually available; symbols
  and reference quantities are explained. Have a bounded non-author review of load-bearing
  words/depictions before treating them as production-ready.
- **Visual performance:** watch the main causal beats and incoming/outgoing transitions at
  normal speed without scrubbing first. Inspect focus, visible input/action/result, comparison,
  prediction/answer timing and continuity. Check actual desktop and narrow-browser compositions,
  including labels, counters and space left around moving boundaries; geometry tests alone
  do not establish readability. Name sampled coverage separately from a complete viewing.
  Inspect the actual visible frame, not just the strings emitted by a drawing function:
  a correctly named label at zero opacity still fails. Check that a model badge disappears
  when the diagram fallback is shown. Include a narrow-frame text-stack check and verify that
  the result or next technical term is not exposed before the relevant spoken cue.
- **Audio and matching:** decode the delivered file and check source coverage, duration,
  joins/pauses and clipping. Verify that the browser loads that exact master and that important
  phrases coincide with the intended visible action. State whether anyone actually listened;
  provider alignment or independent transcription is not listening or pronunciation acceptance.
- **Loading and entry:** only the chosen episode's chunk loads, and you recorded the numbers; the
  first episode is prefetched during the opening; a Play pressed before its chunk arrives still
  starts the episode; direct entry, the selection card and the previous episode's Continue all land
  correctly; a held episode contributes no bytes to the public build.
- **Interaction/access:** test forward and reverse seeking, manual takeover/resume, Still,
  reduced motion, loading/buffering/error behavior, natural end and exclusive playback across
  home/episodes. Describe which wheel, keyboard, touch and device paths were exercised;
  a phone-sized viewport is not a physical-phone test. Preserve earlier content.
  Secondary menus must not move reader geometry or restart playback. Test Escape, backwards
  Tab from the first control, outside dismissal, chapter selection and focus return without
  scrolling; closing a paused menu does not silently resume narration.
- **Site integration:** name the catalog row, the release flag and its build-time mirrors, the
  route, the home wiring sites, the Chinese copies' cross-repository byte match, the dictionary keys
  added and the exact test files extended. For a held episode, state which of the four hold
  mechanisms you verified (dead-code import, redirected route, allowlist exclusion, leak probes) and
  that the public build contains none of its bytes. Name the chunk sizes the build emitted.
- **Device checks:** run the focused test files, both builds, the release test with its negative
  controls, the release smoke against the hosting emulator, and the live checks at desktop and
  360 px — including touch scrolling on the scene, a takeover and resume, the Menu's keyboard and
  focus paths, Still, reverse seek and the natural end. Record that this was emulation and name what
  only a physical phone can settle.
- **Current-build checks:** cold-reload after drawing edits before the final browser verdict;
  hot reload can retain a stale canvas callback. Rebuild before you review or smoke, and check that
  the bundle under test postdates your last edit: the first confirmed finding of the 2026-09-19
  review was that the build being reviewed was stale, so its captures did not show the code under
  review. Record a fresh error-observation window and
  separate existing limitations from new failures. Use focused product checks for product-only
  changes and the repository's risk-based rules for scientific/evidence changes—not blanket gates.
- **Audience acceptance:** ask an uncoached first-time viewer to explain and predict using the
  central ideas. Record their actual account and first missing link. Keep `ready for maker
  review`, `human listening pending` and `audience understanding not checked` separate from
  passing automated checks. Do not infer acceptance from silence or a beautiful image.

Every review identifies its author/model when known, whether context was shared, what it
independently checked and what it did not. Do not present a specialist's source review as a
first-time viewer test. Repair the identified issue and replay its affected context; record
remaining limits instead of expanding a bounded review into unrelated work.

## Applying the lessons beyond E01

### Episode 2 feedback: meaning, library use and continuity

The maker's response to the initial E02 draft adds these concrete checks (requested, not yet
accepted fixes):

- “there are hundreds of crystal animations” and the three-across comparison used only one
  model: inspect the existing library first. Use actual recorded examples when comparing crystal
  appearances; retain their model status and rendering recipe in Sources, with camera scale or
  geometric exaggeration local when needed to interpret the visible comparison. A drawing
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
The 2026-09-18 catch-up applied this guide's later requirements to the held Episode 2 (Menu and stage
hierarchy, phrase-gated reveals with a focus cue, the closing question, cited-person context, Yun
Mandarin over the reviewed Chinese); the record is the E02 plan's catch-up section and the
[review addendum](../reviews/science-series-e02-review-2026-09-16.md#design-guide-catch-up--2026-09-18).

These are design prompts for the provisional episode map, not new science claims or approved shots.

| Future story job | Apply the lesson |
| --- | --- |
| E02 — structure, faces and scale (built; held from release) | Kept a parent crystal while selecting the face/lattice detail, labelled the scale change and made the narrated direction the focus. What the 2026-09-18 catch-up added is the reusable part: names and features arrive with their spoken phrases, a focus ring follows the recording being named, a close-up is introduced whole before it zooms, a drawn teaching object says it is schematic, and the stage carries no chapter text stack. |
| E03 — delivery through air | Answer the question Episode 2 ends on, in its words: how does water actually reach a growing crystal, and what happens to it on the way? Let the air region do visible explanatory work. Connect the chosen representation to an identifiable surface; distinguish material motion, field depiction and any model result. Shipping it also means updating the previous episode's Continue wiring, its closing promise and the release flag together — a next-episode hook is a site obligation as well as an editorial one. |
| E04–E05 — face growth and branching | Keep reference geometry and old material readable while the relevant location changes. Use the library/camera to reveal the narrated feature, not to replace a mechanism with a glamour shot. |
| E06 onward — comparisons, histories and measurement | Name the held-fixed conditions, carry specimens/history forward, show what an instrument observes before inferred quantities, and give each number a physical referent. No single unexplained map or table for an entire argument. |

## Releasing an episode

Publishing adds obligations the drafting sections do not cover.

**Public-facing wording is its own pass.** The page must not promise numbered future episodes, name
an internal production document, or address the visitor as the person who chose the voice. Name the
AI voices actually served in both languages and say plainly that the narration is not a recording by
or an endorsement from a real person. Keep the model status *and* the rendering recipe of any
recorded example in Sources, not on the stage. Do this at render time where you can, so the reviewed
source text and its hash bindings stay untouched.

**A deployed episode earns a review of the deployed artifact,** not only of the draft: the words as
served, the links as served, and the provenance a visitor can actually reach. Keep its findings
separate from maker praise and from audience understanding, both of which remain unproven by any
deploy.

**Mechanics belong to the runbook.** Deploy only from a committed head and only the public build; use
a preview channel with an expiry for review unless the maker waives it; replace the verification and
smoke receipts in place; tag the deployed commit and record it in both repositories. The website's
`docs/adding-an-episode.md` and `docs/public-release.md` hold the commands.

**Holding an episode is a first-class state.** An episode can be complete, reviewed and deliberately
unreleased — Episode 2 is. Say so in the records rather than implying it is unfinished, and keep its
content out of the public build by the four mechanisms named in
[the delivery surface](#the-delivery-surface-an-episode-plugs-into).

## Maintenance

**Refreshed 2026-09-19** for future-episode use, after Episode 1 went live, Episode 2 was brought up
to this guide and held, and the home was rebuilt for a thirty-episode series. That refresh added
[where the work lives](#where-the-work-lives--two-repositories) (the two repositories, the fresh-machine
setup, what is deliberately outside Git and which branches actually hold the work),
[the delivery surface](#the-delivery-surface-an-episode-plugs-into),
[device and platform rules](#device-and-platform-rules-every-episode-inherits), the production
invariants in the timing contract, and site/device items in the completion checklist; it corrected
the removed opening sound, the Menu's contents and the Mandarin voice. Facts were verified in the
two repositories at authority `648f866` and website `81f9bc6`; the numbers quoted here come from the
receipts named beside them, not from memory. None of it is evidence of audience understanding.

This guide is the reusable standard; the E01 guide and dated reviews are examples and history.
Future feedback adds its exact scoped response and refines the relevant rule here. Do not silently
rewrite an earlier quotation or infer approval from silence. Update the active plan's next action
and link the latest episode review; do not copy a growing chronology into every episode.

Prepared originally by the root OpenAI Codex agent from the available maker messages and linked
records, with a shared-context read-only story review of that synthesis; exact model identity was
unavailable then, and that documentation-only synthesis added no browser inspection or audience
test. The 2026-09-18 and 2026-09-19 updates were written in Claude sessions alongside the work they
describe (see the commits), each with independent read-only reviews by separate agents recorded in
the dated review documents. The later attention-pass review separately records code changes
and sampled visual inspection; no audience test or new audio generation follows from this guide.
A future episode must earn its own review.

The 2026-09-20 Episode 3 clarity amendment records the maker's first review of that held episode and
adds the one-novelty, verb-to-motion, evidence-staging, transition-invariant and sequential-recap rules,
plus the maker's scoped English-first production order. The shared-context OpenAI Codex reviewer named
above checked authority and implementation source plus retained frames; it did not claim human
credentials, fresh full playback, listening acceptance or audience understanding. No script, visual or
audio change follows merely from documenting that direction.
