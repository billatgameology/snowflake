# E02 source, implementation and design review — 2026-09-16

## Pre-build review

Scope: the complete [E02 script](../video/science-series-e02-script.md) and
[plan](../plans/science-series-episode-2.md), education Chapters 2–3 and targeted primary
checks. Root authored the draft. Shared-context, read-only science, story and runtime agents
reviewed it; exact model identifiers were unavailable. This is not an independent scientific
gate or audience comprehension test. No audio was generated or reviewed.

The science reviewer read the complete script/plan and relevant original-monograph passages,
and independently calculated the proposed ideal oxygen coordinates. The story reviewer checked
the actual script against the maker's design guide. Runtime review inspected existing player
contracts before implementation. Pre-repair script SHA-256:
`d773c86dc99e913fdee0b66836b44673acb49ab6e87ad4fb28b2748247273e7f`.
Chapter 3 at authority baseline `6cc99bd`:
`6f1268a444d8c063c59d70ce3b1bb19d7ac2a3a536b332efc16edcd260994da7`.

### Findings incorporated before build

| Finding | Repair / boundary |
| --- | --- |
| Circle packing is an analogy, not the oxygen structure. | Separate labelled packing and open-network examples; do not morph cannonballs into water molecules. |
| Diffraction needs observable cause/effect, not six invented dots. | Reinforcement/cancellation, then plane spacing and angle at fixed wavelength; name the one-wavelength path condition and Barnes's experiment. Drawings remain principle diagrams, not experimental data. |
| Scene 2's first paragraph lacked its own visual discovery. | Reveal optical detail before retaining the same specimen's record, then show selection bias. |
| Molecular and network angles describe different objects. | Isolated H–O–H approximately 104.5°; ideal oxygen-neighbour tetrahedral angle approximately 109.5°. Explicit oxygen-only legend; no four covalently attached hydrogens. |
| Arbitrary six-cycle selection could contradict the c-axis view. | Use a basal chair ring with alternating heights and persistent oxygen IDs. Local tetrahedral coordination is not a proof of a unique lattice. |
| Ring and macroscopic hexagons do not align corner-for-corner. | Explicit 30° molecular-ring/crystallographic-hexagon comparison; distinguish corner directions from side-face normals. |
| Local chapter's no-pure-cubic-ice assertion is obsolete. | Positive 2020 laboratory finding, qualified by detectable stacking disorder. Do not say this finding came after the cited 2021 monograph version or that ordinary snow is cubic. |
| Ideal network and measured dimensions differ slightly. | Geometry uses ideal c/a = sqrt(8/3); measured rounded a/c values are separate source annotations, not measurements of the drawing. |
| Scale can silently become a claim about Run B. | The 2.3 mm tip-to-tip specimen is Libbrecht's example. Roughly five million basal-plane repeats is a length comparison, not a molecule count or Run B dimension. |
| Plan retained a geometric-prediction scene absent from script. | Observation/selection takes that slot; pyramidal-angle derivation is explicitly deferred to the source reader. |

### Primary checks and source limits

- [Libbrecht monograph](https://arxiv.org/pdf/1910.06389v2), relevant structure and scale
  discussion, including printed p. 46's 2.3 mm specimen. The local chapter's blanket temperature/
  phase language and angle-only polygon argument are not copied into the episode.
- [NIST water geometry](https://cccbdb.nist.gov/exp2x.asp?casno=7732185&charge=0):
  isolated-molecule H–O–H angle supports the rounded molecular value. Root also read this page.
- [Barnes 1929](https://doi.org/10.1098/rspa.1929.0195): historical ice X-ray attribution.
  The animation does not determine hydrogen positions or uniquely infer Ih from six spots.
- [Brumberg et al. 2017](https://digitalcommons.dartmouth.edu/facoa/3201/): chair-form molecular
  hexagons, crystallographic hexagon and their 30° relative orientation. Root also read the
  primary authors' repository abstract. This is not permission to use its images.
- [Komatsu et al. 2020](https://www.nature.com/articles/s41467-020-14346-5) and
  [del Rosso et al. 2020](https://www.nature.com/articles/s41563-020-0606-y): primary reports
  correcting the obsolete pure-Ic assertion; laboratory context retained.
- [Stacking illustration](https://journals.iucr.org/j/issues/2018/04/00/kc5075/kc5075fig1.html):
  ideal hexagonal/cubic registries versus disorder. E02 uses original symbolic layer diagrams.

The reviewer independently calculated four nearest oxygen neighbours for each interior basis
site, nearest distance sqrt(3/8) in a-unit coordinates and tetrahedral neighbour-pair angles.
The proposed basis is `(0,0,0), (0,0,3/8), (2/3,1/3,1/2), (2/3,1/3,7/8)` with
`a1=(1,0,0), a2=(-1/2,sqrt(3)/2,0), c=sqrt(8/3)`.
This verifies ideal teaching geometry, not a physical simulation, measured coordinates or
implementation correctness. Production tests and visual inspection follow separately.

## Build and design-guide review

Implemented at website `explore/film-part1@f02a3be751e32d70ac26584651b564620ed2bf4c`, in
`/Users/clipper/github/snowcrystal_website-film-part1`. Route:
`http://127.0.0.1:5185/series/episode-2`. The final imported script SHA-256, recorded in
website `src/series/episode-two.json`, is
`9bb74d7496c40a636b124a3d7b49dada7cf0362c8bed021e0cb0471395d34b13`.
The script's scale ladder description was clarified as explicitly broken, not logarithmic.

### Review/edit loop

After the complete implementation, the same shared-context non-author reviewers inspected
science depiction, design-guide correspondence and playback ownership. Root performed the
live visual pass. Code-only reviewers did not claim browser comprehension testing.

| Scene / cue | Observed or code-derived problem → repair |
| --- | --- |
| 1, “plate … column … star” | Initial highlight was a flat hexagon over an oblique plate, and omitted the column end. Select the actual projected plate and column faces; retain six star directions. |
| 2, retained record | Paragraph-local action reset made the completed record shrink and enlarge again. Keep the completed magnification while the population/selection argument continues. |
| 4, smaller spacing then Barnes | Contraction restarted in the historical paragraph. Hold the completed spacing, add geometrically consistent extra-path segments and move the spacing label off its line. Normal-speed wave reinforcement/cancellation was visibly readable. |
| 5, hydrogen bonds | The initially arbitrary molecule drawing had different apparent angles from the immediately preceding lesson. Use the same 104.5° construction for both molecules, with a donor hydrogen pointing toward the accepting oxygen; retain solid versus dashed bonds. |
| 6, turn the same atoms | Project the c-axis from an end-on dot rather than prematurely drawing an in-plane arrow. Carry all six numbered IDs into a full side view, with higher/lower reference levels. Background network nodes fade before entering heading/caption space; retain the completed reveal. |
| 7, stacking disorder | The established Ih/Ic stacks restarted as the new stack entered. Preserve their completed layers, build only the new mixed stack and hold all through the laboratory-result paragraph. |
| 8, add on side walls | Completed end growth disappeared. Keep the increased height while side shells add. Replace slash-only legends with separate ring/crystal and corner/normal labels. |
| 9, repeat and layer sizes | A generic prism did not identify the repeat endpoints; both local layers advanced upward. Use a translation-cell detail with a/c endpoints, a retained basal surface with upward addition, and a prism-side surface with outward addition. Add explicit dimension marks and a broken-scale comparison. |
| 10, air around the model | Keep the recorded model while tracers visibly traverse the surrounding space. These are approaching schematic paths, not a computed field or a claim of contact at a model's bounding circle. |

The science reviewer closed the named geometry repairs after reading the changed code and
independently checking the extra-path geometry. Runtime review found and closed E01's retained
ownership on audio error/end and paused scrollbar takeover defects. A final narrow resize
finding was repaired: manual intro/footer reading is not reanchored into the timed paragraph
range. Root observed a middle-of-episode position survive the desktop-to-narrow change.

### Visual and interaction observations

Root inspected live desktop `1270×710`, narrow `390×844` and the default app viewport.
Representative states across all scenes were examined, with extra passes through the
molecule/tetrahedron/bond distinction, ring face-on/side/reveal states, stacking, end/side
addition, 30° comparison, repeat/layer sizes and closing air paths. Normal-speed samples
included the opening progression, wave reinforcement/cancellation and ring rotation/reveal;
other paragraph states used controlled seeks. This was **not an uninterrupted full-episode
watch**, and there was deliberately no E02 narration to listen to.

Still retained the ring's higher/lower result. Native scrolling changed E02 from following
to manual; reverse movement moved its reading time backward. Direct entry stayed idle.
The retained home offered both episode entries without layout overlap in the narrow view.
E01 entry played its existing narration; E02 entry immediately paused it and, after the
descent, remained the sole following player. The URL did not navigate for those button
actions. E02 stopped at its clock's end after a changed-speed trial. Temporary viewport
overrides were reset, and E02 was left idle as the deliverable.

The final cold-load log inspection found no errors; existing Three.js clock deprecation
warnings remain. This is not a physical-phone/iOS, assistive-device or all-GPU guarantee.
The original home renderer/choreography, E01 narration/content/drawings and `src/film/`
showed no byte changes against website baseline `c3143a2` in the targeted preservation diff.
E01's player changed only for ownership, upstream measurements and the continuation control.

### Checks and verdict

Website `docs/episode-two-tests.tap` at the implementation commit records **81 passes, zero
failures** from:

```text
node --test --test-reporter=tap --test-reporter-destination=docs/episode-two-tests.tap scripts/episode-two.test.mjs scripts/series-continuous.test.mjs scripts/series-audio.test.mjs scripts/series.test.mjs scripts/film-timeline.test.mjs scripts/film-opening.test.mjs scripts/film-prepared.test.mjs scripts/film-export.test.mjs
```

New coverage checks source import, ideal oxygen geometry, ring identity, cue/Still states,
scroll inversion, silent-clock completion, pending E01 audio interruption and finite drawing
coordinates. Existing series/film tests remain included. `npx tsc -b`, the Sites
`build-site.mjs` production build and `git diff --check` passed. The existing large-bundle
warning remains. No scientific suite/gate, synthesis, credential read, export or deployment.

**Ready for maker review as a complete silent visual draft.** The maker's guide materially
changed continuity, labels, timing and the meaning of dimension displays. This verdict is
not maker praise, an engagement measurement or final episode production acceptance. Next:
maker comprehension/pace feedback, then separately authorized narration and actual alignment.

## Maker revision — recordings and a continuous molecular story

Implemented at website `707ca01ec8f9c753f49389ac667e6559c8268daa`, following the pre-build
authority amendment `2397f9c`. This supersedes the initial visual treatment above, not its
historical check record. The source script is now eight scenes; source IDs retain gaps for
the two history detours moved out of playback. Its imported hash, copied from website
`src/series/episode-two.json`, is
`3d50ff7ab58b59b061d59cea6c067d4a92d69727a2afd2803dad3950742e79d0`.

### Request interpreted and implemented

The maker asked for actual library recordings in the three-across shot, useful explanation
instead of unnecessary history, spoken meanings for necessary symbols, an explained
tetrahedron, the education H₂O honeycomb idea, a whole-network zoom/orbit, and continuity into
layer positions. The reusable [design guide](../video/science-series-design-guide.md#episode-2-feedback-meaning-library-use-and-continuity)
now records these as comprehension requirements, not newly inferred praise.

- Opening: actual hexagonal-plate, solid-column and stellar-dendrite recordings, growing in
  fixed independent frames. Ending: hollow-column, capped-column and sectored-plate recordings;
  the hollow end gets a labelled close-up after growth. The six selected baseline IDs,
  source/served/event hashes and crop/stopping metadata are in website
  `src/series/episode-two-crystals.json`, traced to authority
  `app/data/named-growth-library.json`. Source events are unchanged; served headers omit
  producer commands and workstation paths. No private NAS route was enabled.
- These remain G–G visual examples, not natural specimens or validated physical predictions.
  Ticks are not physical seconds; views are independently framed. E02 explicitly uses unit-Z
  geometry. Other renderer callers retain their existing 2.6 default. No new solver run.
- Observation biography and Kepler packing are optional source reading. X-rays stay because
  they answer how hidden spacing is measured, with wavelength, perpendicular plane spacing
  and glancing beam angle defined in narration and labelled in words. No unexplained d/theta.
- A retained central molecule supplies two hydrogens on donated bonds and accepts two other
  connections. The tetrahedron appears only after its four neighbouring oxygen positions.
  The script separates the isolated molecule's internal angle from idealized network angles.
- The education animation was inspected directly: its H atoms fade before a final 2D oxygen
  honeycomb. We adapted the recognizable-water/sheet idea, not that implementation or its
  angle-alone derivation. The new ideal Ih geometry keeps one allowed periodic hydrogen
  assignment, persistent oxygen IDs and the same basal chair ring. It is not a disordered
  proton sample, measured hydrogen geometry or molecular dynamics.
- A sheet reveals neighbouring rings, tilts, pulls back and turns; the exact outgoing sheet
  and camera persist into connections above and below. The whole network then turns. A later
  secondary key defines A/B/C as registry positions without replacing or morphing the Ih
  molecular view. Necessary a/c length symbols are now spoken; micrometre is spelled out.

### Review provenance and edits

Root OpenAI Codex authored the revision and performed browser viewing. Shared-context
read-only science, story and runtime agents independently inspected the actual script/code,
source geometry and selected asset integrity. They did not inspect the browser. Exact model
identity was unavailable; these were advisory reviews, not independent audience tests.

The reviews found and the root repaired:

1. The central molecule briefly lost an owned H during neighbour reveal, and cropped network
   oxygens could lose owned H. All visible oxygens now draw both owned hydrogens independently
   of neighbour visibility/cropping; there is still only one donor per O–O edge.
2. The last molecule paragraph completed a sheet that the next scene then removed. It now
   ends ring-only at the identical incoming pose, and the sheet is revealed once.
3. Existing out-of-sheet stubs vanished when the surrounding-network fade first became
   positive. Stub fade is separate from owned H and newly revealed connections.
4. The wavelength bracket had the right length but did not track crests. It now follows two
   consecutive crests. Finished recordings also retain their orbit across paragraph seams.
5. Unchanged paused/Still model frames were needlessly raymarched. Exact rendering now caches
   time, viewport and ready revision; the ready callback is stable and the visual component
   is memoized. At most three catalogue contexts mount in the relevant visible scene.

The science reviewer re-read the repaired H/stub/continuity/bracket sites and closed its
identified findings. Root browser inspection additionally repaired over-close model framing,
Run-B-sized glow intervals washing out the short column run, harsh rectangular backdrops,
small registry letters and crowding between diagram labels and the caption. A cold reload
was required after changing the React export to a memo wrapper; the hot-refresh-only
“Component is not a function” failure did not persist after reload.

### What was actually checked

Website `docs/episode-two-revision-tests.tap` at the implementation commit records **85 passes,
zero failures**, copied from the receipt at write time. Exact command:

```text
node --test --test-reporter=tap --test-reporter-destination=docs/episode-two-revision-tests.tap scripts/episode-two.test.mjs scripts/series-continuous.test.mjs scripts/series-audio.test.mjs scripts/series.test.mjs scripts/film-timeline.test.mjs scripts/film-opening.test.mjs scripts/film-prepared.test.mjs scripts/film-export.test.mjs
```

Coverage includes source-import equality/hash, independent nearest-neighbour and ice-rule
counts, one donor per link, sheet membership and exact sheet→stack camera seam, all six
source/derivative/event payload hashes and decode/volume builds, monotonic recording growth,
orbit seams, cue/Still/finite-drawing checks, timeline/ownership and retained film tests.
`npx tsc -b`, `git diff --check`, and the standalone Sites production build
(`node /Users/clipper/.codex/plugins/cache/openai-bundled/sites/0.1.70/scripts/build-site.mjs`)
passed. The existing large-chunk build warning remains. Authority prose uses
`npm run lint:rule7` and `git diff --check`, not the scientific suite.

Root inspected representative states in all eight scenes at desktop `1270×710`, plus the
recorded trio, spacing/angle labels, donated/accepted/tetrahedron view, sheet, registry key and
Still pose at narrow `390×844`. Normal-speed portions included visible opening growth and
the sheet pullback/orbit through the retained landmark into the connected network reveal.
Controlled seeks supplied other before/action/after and reverse comparisons. Native scrolling
interrupted Play; Still retained an explanatory pose. Final cold-load viewing showed all
recordings loaded and the retained face/scale scenes intact. This is bounded sampling, not
an uninterrupted full-episode watch, narration alignment, physical-phone or all-GPU test.

The final website diff leaves E01 source/audio/drawings, SeriesHome choreography and original
film scene files unchanged. No synthesis, credentials, scientific suite/gate, export, push or
deployment. **Ready for maker comprehension/pace review, not maker accepted.**

## Updated-guide comprehension revision — 2026-09-17

Maker request: review and update E02 against the refreshed episode guide. Pre-build authority
amendment `e7710fb`; website baseline `1fd50e6`. This is an authorized revision of the silent
draft, not permission for narration. Source/import identity at completion:
`86b818171353dbf7a5c4ec9a7737c7d836fa2d52546ab1f7ac4e1c9194a60b1f` in website
`src/series/episode-two.json`. Implementation identity is recorded in the plan/PROGRESS.

### Findings and repairs

| Passage / problem | Revision and disposition |
| --- | --- |
| Opening/ending sounded partly like instructions to the animator; growth-energy jargon introduced a theory only to reject it. | Concrete plate/column/star observations; spoken model qualification retained, implementation details in visible notes. End directly distinguishes reaching from joining the surface. |
| X-ray lesson named waves/planes but assumed the connection; spacing and matching angle changed together. | Define crest/trough and combined wave first. Explain X-rays as scattered waves. Reduce spacing at the original angle, show the shorter extra-path bar, hold the question, then restore the one-wavelength match at a larger angle. |
| Bond terminology could imply giving away hydrogen; angles arrived before their purpose. | Explain solid internal links versus weaker dashed links between intact molecules; explicitly no hydrogen transfer. Four neighbours precede the tetrahedral guide. Detailed angles and ice rules remain explained in the reader. |
| Alternate-stack letters, 30° orientation and several decimal dimensions crowded the main chain. | Retain the necessary distinctions in ordinary language; supply six substantive reader entries with their own precise sources, not just citations or a disposition table. The known cubic-ice correction is beside its explanation. |
| Network view provided little direction on “this molecule”. | Dim the surrounding network, identify the selected molecule with a leader, emphasize its links, then restore the larger pattern. Preserve gold-ring identity and exact sheet/stack seam. |
| Face naming showed answers without a chance to use the idea. | End/side prediction holds and a new common-prism test with visibly faster side advance. The old solid remains fixed; larger lateral additions produce the broader result. Labels and description wait for release. |
| Still skipped the new comparison, including wave shift and local focus. | Prediction states use the current conceptual beat, not the scene's end. Wave and local-neighbour Still poses also retain their before states until the authored change. |
| Small repeat label crossed lower network details in narrow view. | Quiet label band separates the actual repeat bracket from background atoms. The bracket links matching sites one lattice translation apart, not nearest neighbours. |

### Provenance and source checks

Root OpenAI Codex authored the source/implementation and inspected the browser. Shared-context
read-only `story_review`, `science_review` and `runtime_review` independently read their named
source/code boundaries; exact model IDs were unavailable. None performed an audience test or
browser review. The story findings led to the conversational rewrite, real optional reader,
bond clarification and prediction opportunity. Runtime review independently reproduced the
Still defect and checked new prediction states, reverse behavior and reader/clock separation.

Science review compared the revised words/reader with Chapters 2–3 and previously checked
primary sources, independently recomputed the length comparison and inspected changed code.
It verified that the Bragg comparison loses and regains the selected match, the faster-side
case has larger side-normal than basal advance, and the scale bracket connects equivalent
oxygen sites with matching hydrogen orientations. It found “restored angle” imprecise and
a caption restarting “Turn the beam…” after matching was already complete; both are fixed.
Root additionally reopened the [NIST water geometry](https://cccbdb.nist.gov/exp2x.asp?casno=7732185&charge=0)
and [Komatsu 2020](https://www.nature.com/articles/s41467-020-14346-5) primary pages, and checked
the local chapter's printed lattice/layer dimensions and specimen-size passage. No new
scientific measurement, numerical solver change or validation claim follows.

### Checked, and not checked

- **Content: checked over the named scope.** Eight revised scenes and six substantive reader
  entries; demonstrated prerequisites and understanding prompts are in the source shot table.
  Extra quantitative depth remains available; pyramid construction is explicitly deferred
  to E07 rather than falsely described as supplied here.
- **Visuals: bounded viewing.** Root inspected desktop 1270×710 and narrow 390×844. Normal-speed
  samples covered the changed-gap X-ray passage and face selection/reveal; selected before/
  question/result/reverse poses covered bonds, local focus, speed contrast and scale. A final
  cold load followed drawing changes. The unchanged recording assets and sheet seam are
  protected by focused tests, not relabelled a new full viewing of every retained animation.
- **Interaction: sampled checks.** Native upward scroll yielded manual mode; reader expansion
  during Play yielded manual mode; reverse seek/Still kept the question unspoiled; resumed
  playback reached natural end and paused. Desktop/narrow layouts were inspected and the
  override reset. No physical-phone/touch, OS reduced-motion toggle, forced GPU/network error
  or new full E01/old-film playback pass was performed.
- **Audio/performance: pending by scope.** No E02 audio, credential access, synthesis or full
  spoken rehearsal. Word-rate cue locations and local pauses remain explicitly provisional.
- **Audience: not checked.** Ask an uncoached viewer to explain how a hidden gap changes a
  measured signal; what the tetrahedron surrounds; what a side view reveals; which direction
  faster side addition favours; and why knowing the structure does not settle the final shape.
  Their actual account, not agreement or test passes, is the next comprehension evidence.

Website `docs/episode-two-guide-tests.tap` records **82 passes, zero failures** (copied from
the receipt at write time). The command is in website `docs/science-series-episode-two.md`;
it includes the focused E02, continuous-series/audio and retained film tests. TypeScript and
the standalone Sites production build pass, retaining the existing chunk-size advisory.
Final cold-load error queries returned an empty error list. Authority `npm run lint:rule7`
and both worktrees' `git diff --check` pass. No full scientific suite or gate was warranted.

The changed implementation paths are E02-only. The new E01 performance, home choreography,
original film, six crystal payloads and shared transport/rendering code are unchanged from
website baseline `1fd50e6`. **Ready for maker review; human performance and fresh audience
understanding remain open.** No E03, export, push, deployment or publication.
