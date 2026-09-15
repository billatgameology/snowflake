# Part 1 prototype — visual inspection

Date: 2026-09-15. Requested after the maker described the short prototype as “just okay.”

## Verdict

**The prototype is a working presentation, but does not yet meet the documentary's visual
ambition. Improve this sequence before multiplying its visual pattern across the full story.**
The earlier functional checks remain what they were; they did not establish cinematic quality.
The current route is the entire short sequence study, not the opening of the complete draft film.
No website, score, narration or source chapter was changed during this inspection.

## What was inspected, and by whom

- Primary reviewer: OpenAI Codex, the implementation agent, in the same context as the build.
  This is a candid self-review, not an independent aesthetic verdict. The exact served model
  identifier/build is not exposed here.
- A separate `runtime_review` agent, with shared task context but no website authorship, inspected
  existing exported frames and the adjacent frames at the model/diagram cuts. Its input was
  visual/art-direction critique, not another test-suite review. It did not use the live browser.
- Website: `explore/film-part1@a9d18b3252ca0e456d478cdf23293cf175c5bd97`, unchanged and clean.
  Score snapshot: `40e7891`, identified by the prior
  [verification receipt](../video/part1-prototype-verification.json).
- Primary live inspection: `http://127.0.0.1:5185/film/part-1`, desktop viewport 1440×900,
  then phone viewport 390×844. Initiated normal playback and sampled rendered screenshots at
  displayed times approximately 14.81, 32.74, 55.97 and 78.04 seconds; separately inspected the
  opening and sought 7 and 68 seconds. Phone inspection covered the opening, a model still,
  the corner article/diagram and a seek from the opening to 40 seconds. These are live frame
  observations across playback, not a claim to have continuously watched every frame or listened
  to narration. The screenshots are in the inspection conversation, not a new retained export.
- Existing local files inspected by the secondary reviewer are under the website's
  `export/part1-prototype/`: `still-0-0.png`, `still-1-7.png`, `still-2-22.png`,
  `still-3-40.png`, `still-4-58.png`, `still-5-68.png`, `still-6-76.png`, `still-7-78.png`,
  and representative decoded MP4 images. Both `segment-0` and `segment-1` frames `00029`
  and `00030` were compared. Their provenance is in the existing export report/receipt.
- Read the relevant rendering, scroll-mapping and responsive-layout code after observing the
  page. Did not rerun build, unit tests, export, scientific checks or source audit: no product
  code or claim changed. This is a qualitative product judgment, not a new scientific result.

## Findings

| Priority | Observed problem | Why it weakens the film | Concrete next edit |
|---|---|---|---|
| First | Desktop playback shows a large stage heading, captions, persistent controls and an independently scrolling transcript with another heading and the same argument. At roughly 55.97 s the diagram still says “Growth feeds growth,” while the right column prominently shows “Back to the crystal” and its next-scene prose. | The page offers competing places to look. Continuous anchor-to-anchor scrolling brings the next idea forward before the visual reaches it. | Give playback a focused visual performance while preserving a deliberate reading performance. Keep source/description access and compact MODEL/DIAGRAM labels; avoid continuously moving the full transcript beside the shot. If a transcript stays visible, hold/highlight the current beat and move between beats. |
| First | The opening seed occupies a very small part of a mostly empty stage. The large headline does more visual work than the crystal. | There is no immediate visual question or compelling detail to follow. | Open on a close, partial mid-growth structure, then return to the seed. Do not reveal the complete final silhouette early. Frame the seed deliberately rather than leaving its size incidental. |
| First | Across the halo/corner interval, the same centered teal disc, contour family, arrows and camera scale persist. The growing protrusion changes, but attention is not progressively directed into it. At the feedback beat, an internal qualification and the caption also repeat one another. | A long explanation feels like successive versions of one slide. The viewer reads the causal claim rather than discovering it visually. | Establish the halo, isolate one corner, move closer, suppress unrelated contours, and sequentially emphasize gradient, delivery and extension. Show the opposing attachment effect as a distinct beat, retaining its qualification. Use visual progression, not decorative particle volume. |
| First | At 13.9667→14.0000 s, a detailed, bright point-up model plate cuts to a smaller flat-top schematic hexagon, displaced left/up, in a different palette. At 61.9667→62.0000 s, the right-facing schematic tip vanishes and a larger near-sixfold model plate returns, displaced right/down. Headline, caption and illustration switch together. | These read as retrieving the next illustration, not following one question through related views. The later branch has no identifiable relationship to the corner just explained. | Match projected center, orientation and scale before changing representation. Preserve an identifiable local tip through the return, then widen. A crossfade alone does not fix mismatched geometry. Keep the explicit change from MODEL to DIAGRAM; a matched view must not imply a measured Run B field. |
| First | At about 78 s, the receding model is enclosed by a visible dark rectangle. The same boundary is present in the decoded final MP4 image. | It looks like a render panel shrinking inside a page, not a crystal entering atmosphere. Shrinking, dimming and sparse dots also weaken the final focal point together. | Recede the crystal through camera/object evaluation inside a stationary, full-size composition, or otherwise composite its background seamlessly. Hold a legible final silhouette before handing over to snowfall. Do not bring back accumulated, non-seekable hero state. |
| Next | The early plate at 7 s is very bright, milky lavender/blue, with subdued internal contrast. The oblique branch view at 68 s has considerably stronger structure and depth. | The early model reads as a luminous solid ornament; the later shot supplies more of the desired material interest. | Refine the early camera/light/exposure together and preserve internal detail. Keep the successful oblique depth. Do not hide mesoscopic geometry or turn an artistic material adjustment into a physical-optics claim. |
| Next | Phone article model stills scale down a whole film composition, including tiny baked-in headings/captions. The static diagram also keeps labels inside its large SVG viewBox, making them very small at article width. In the observed opening→40 s phone seek, the viewport ended midway through the article with the player offscreen. | Passing a no-overflow check does not make the reading images useful or keep a person oriented. The smaller rendering carries redundant, hard-to-read chrome. | Export image-only model stills with semantic captions outside the bitmap; adapt diagram labels to the phone layout. Fix the observed seek/layout correction so the intended player or selected scene remains in view. Verify the precise interaction rather than assuming all phone seeks behave identically. |

## Source-backed implementation observations

These locate plausible causes of the observed presentation issues, not additional user-facing
scientific claims. Paths are relative to the website worktree.

- `src/film/Part1Film.tsx`, `draw`: the ending applies CSS opacity and scale/translation to
  the entire `.film-model` wrapper. Its backdrop therefore moves with the crystal. Model and
  diagram visibility switch discretely at cue boundaries.
- `src/film/film.css`: the desktop layout permanently pairs stage and article; headings stay
  present throughout each cue. Capture mode hides the article, but ordinary playback does not.
- `Part1Film.tsx`, `scrollFromTime` and `measure`: page position interpolates between scene-start
  anchors. A page-level ResizeObserver can also correct scroll position when a changed heading
  changes layout. `scrollFromTime` itself skips still mode, so the observed phone jump should be
  investigated at the layout-correction path rather than “fixed” by weakening the still-mode rule.
- Article model stills reuse whole-composition PNGs in `public/film/stills/`. Their descriptive
  HTML text is useful and should remain; the baked-in film typography is the presentation problem.

## Keep, change, and stop condition

Keep the restrained palette, clear typography, compact provenance, model/diagram distinction,
source-qualified explanations, deterministic runtime and the oblique branch shot. The chief
missing ingredient is directed attention and visual development, not more effects or a new stack.

Next implementation pass: improve this existing representative sequence—focused playback,
local corner progression, geometric continuity, clean ending and phone still/seek treatment—then
inspect those exact changes in playback and reading. No new scene-plan pass, wholesale source
audit, full-film export or scientific suite is warranted for this visual revision. Reuse the
existing product-sized checks for code changes. Only then propagate the stronger visual pattern
into WP4/WP5. The maker's voice is still required later, but missing narration is not an excuse
for the observed compositional weaknesses.

Limits: sampled stills do not establish transition smoothness at every frame, actual device
performance, screen-reader usability, emotional response with the maker's delivery, or final
film quality. The phone was a resized desktop browser, not physical phone hardware; its seek
used the accessibility range control, not a physical touch drag. No rating
or mathematical measure of “impressive” is claimed. This report is a qualitative inspection;
the earlier passing functional receipt is not rewritten as a visual-acceptance result.

Documentation checks: `node scripts/lint-rule7.mjs` and `git diff --cached --check` exited 0.
The website checkout remains unchanged at the inspected revision.
