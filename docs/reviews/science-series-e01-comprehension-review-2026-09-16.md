# Episode 1 — whole-episode comprehension review

## Verdict

**Revise the teaching sequence across the episode.** This is not just a missing label in scene
6, and adding more animation alone will not resolve it. The first explicit prerequisite gap
occurs in scene 3; scene 6 combines several unearned concepts, and scene 8 adds another chain of
representations and calculations. Keep the visible water journey, praised surface mechanism,
continuous player and useful four-route overview.

The maker reports one general-adult reviewer found unfamiliar concepts—including equilibrium
and water-vapour pressure—too dense, was lost after scene 6, and found scene 8 too dense. The
viewer's exact watched revision, uninterrupted viewing conditions and verbatim answers are not
available. This is valuable secondhand audience feedback, not a broad audience study. Our
diagnosis of the missing links below is editorial analysis, not something the viewer herself
was reported to have said.

Maker-selected delivery: **visual fixes and revised script first**. Accordingly, only the
circular scene-4 magnifier and wavy scene-6 liquid surface change in the live episode. The
[complete revised script](../video/science-series-e01-comprehension-draft.md) is a separate
approval artifact, not imported, retimed or narrated. The [series guide](../video/science-series-design-guide.md#general-adult-comprehension-requirement)
now states the general-adult comprehension requirement and future-review questions.

## Scope and provenance

- Baseline authority: `4bcf7d4`; performed text: `docs/video/science-series-e01-script.md`.
  Baseline website: `707ca01ec8f9c753f49389ac667e6559c8268daa`. Plan amendment committed before
  implementation: `282cbdb`.
- Root OpenAI Codex reviewed all ten narration sections, prescriptions, the reusable guide,
  source qualifiers and relevant drawing/timing code. Exact deployed model identifier is not
  exposed. Root is the implementation author, not an independent or blind reviewer.
- Shared-context, read-only Codex agents `e01_story_review`, `e01_science_review` and
  `e01_runtime_review` separately examined all ten sections for teaching, source meaning and
  implementation risks. Exact model IDs were unavailable; no different-model independence
  is claimed. They did not edit files or use the browser.
- Science reviewer read local Chapter 1/4 passages and NASA/AMS definitions; root also opened
  NASA's pressure explanation and AMS's vapour/equilibrium definitions. A bounded review of
  the **actual revised script** caught two defects: restore balance before removing vapour,
  and specify equal gas volumes when comparing amounts. Both are repaired.
- Runtime reviewer independently ran `node --test scripts/series.test.mjs scripts/series-continuous.test.mjs`
  on the pre-edit website: 37 passed, zero failed. That checked implementation contracts,
  not understanding. Root's post-edit checks are recorded below.
- Root inspected representative rendered states spanning all ten current scenes on the
  retained browser, then the two changed scenes in motion and narrow/Still/reverse states.
  This was **not an uninterrupted 14-minute listening pass, a first-time blind viewing, a
  physical-phone test, or a fresh general-adult comprehension trial**. Root had read the code
  and script first, so the visual observations cannot certify what a novice would understand.

## Highest-priority findings

1. **P1 — An unexplained prerequisite appears before the reported failure.** Scene 3 says
   “The amount of vapour needed to balance liquid water becomes smaller.” Its moving reference
   can show a decrease but cannot teach what balance is. Two-way exchange comes in scene 5.
   Revision: show and define condensation here; defer the balance explanation until it exists.
2. **P1 — Naming is mistaken for explaining.** Scene 5 demonstrates equal exchange but names
   saturation/supersaturation, not equilibrium. Scene 6 then opens the compound term
   “equilibrium vapour pressure.” Revision: name equilibrium at equal exchange, allow a
   prediction, then use it. Explain pressure separately through molecular impacts and water's
   contribution, with temperature and gas volume fixed for amount comparisons.
3. **P1 — Scene 6 has too many new comparison systems.** Separate balances, pressure units,
   numerical values, an ice-relative percentage, relative humidity, changed reference and an
   intermediate shared-air state all precede the full cloud payoff. The surfaces now move,
   but movement does not explain the units. Revision: teach the two surfaces and shared-air
   outcomes first, immediately resolve the relay, then give pressure its own lesson.
4. **P1 — Scene 8 asks viewers to learn a diagram while calculating with it.** Percent,
   denominator, changing temperature, two balance amounts, equal volume, grams per cubic metre,
   a selected surplus population, a −40 °C caveat and a −12 °C peak arrive in one scene.
   Revision: a plainly invented counter example, then a qualified equal-volume vapour
   comparison. Retain full numbers/curve in substantive reader text, not an empty source link.
5. **P2 — “Supply” can overstate the plotted quantity.** Scene 8's excess is equilibrium
   vapour above ice balance per volume, not all cloud water or lifetime delivery to the crystal.
   Keep the replenishing liquid and air supply distinct. The approval script states this.
6. **P2 — Representation rules change without being taught.** Amber means liquid or departing
   tracers earlier, but arithmetic surplus vapour in scene 8. Use a selection outline/hatching
   for surplus and keep its identity as vapour. This is prescribed for the future script-driven
   build, not silently changed under the existing narration in this pass.

## Every-scene review

Times below are sampled positions on the current recorded clock, not complete scene coverage.
“Risk” is our inference; “observed” is limited to the displayed state or named code/text.

| Scene / cue | Current observation and risk | Revision and understanding check |
| --- | --- | --- |
| **1**, “Watch one droplet” (0:15 sample) | Selected amber donor, pointer, model crystal and readable approximate budget are visible. Preserve these; gas/molecule versus drop scale is not yet explicitly taught. | Define vapour as invisible gaseous water when first used; say many molecules make a drop. Ask how water reached ice without a collision. No need to memorise 100,000. |
| **2**, route overview (1:36 sample) | The four-action grid provides useful context. Deposition, rime, graupel and aggregation add several names before the mechanism. | Actions first, names second, explicit permission not to memorise the taxonomy. Return attention to gas-to-ice. Ask which route needs a drop to land. |
| **3**, rising/cooling parcel (2:46 sample) | The parcel, rise arrow, gas dots and cooling label are readable. The adjacent paragraph invokes balance before teaching it; source/code also introduce scale and reservoir language. | Show gas becoming liquid and name condensation; identify stored liquid and travelling gas. No balance gauge in the revised scene. Ask what is visible and what lies between drops. |
| **4**, first patch (4:10 sample) | Old rectangle clearly distinguishes speck/liquid/ice but does not look like a magnifying glass. “Ordered patch” and two extreme temperature examples add conceptual work. | Live circular lens now retains a handle, parent leader and non-ice-speck label. Draft explains the starting event before nucleation; qualified exact temperatures remain reader depth. Ask whether the speck is ice and whether zero guarantees freezing. |
| **5**, equal exchange (5:57 sample) | The praised filled solid, identified face, before-line and reciprocal motion give the best mechanism grammar. Script goes from equal exchange to saturation and supersaturation without naming equilibrium. | Preserve the drawing. Name equilibrium only after equal exchange, then invite a growth/shrink prediction. Explain “same amount overall” before using “net.” |
| **6**, pressure example and intermediate air (7:30, 8:05 samples) | Both surfaces and their consequences are visible. Units and comparison labels still assume understanding of pressure. Air-dot populations are illustrative, not a 1.65:1.91 quantitative ratio. | Live water is wavy again, with fixed mean at balance. Future script removes calculation from this first comparison, explicitly distinguishes separate equal-volume boxes from the later shared-air experiment, and asks why the two surfaces respond differently. |
| **7**, handover (8:55 sample) | Selected wandering transfer reaches a drawn ice edge and reciprocal paths remain. The first paragraph compresses the replenishment feedback into “tends to keep.” | Explain ice removes nearby gas → fewer returns to drops → drops lose water → gas replenished. One tracked molecule is an example, not directed travel by all molecules. Ask what made the donor shrink. |
| **8**, separated surplus (10:53 sample) | Equal-volume boxes and much smaller cold population are visible; percentage, two temperatures, g/m³ and caveat share the view. Amber surplus changes the established colour meaning. | Teach extra relative to an explicit reference pile first; then introduce the scientific diagram's legend. Explain that excess vapour is not total cloud supply. Ask whether the bigger percentage determines the bigger amount. |
| **9**, depleted population (12:02 sample) | Frozen former drops, former positions, residual vapour and existing ice persist: a useful record of where water went. The folk saying/temperature/rebuttal compete with this physical conclusion. | Lead with depleted liquid, not “too cold.” Keep source's selected temperature/history in supplied reader text. Ask what has disappeared and what remains; no universal snowfall cutoff. |
| **10**, added material (13:10 sample) | Seed-to-grown model and “not a hidden stencil” distinction are concrete. “Its material is no longer mysterious” assumes audience success; a lab preview adds a new thread during the ending. | Give a brief unprompted route reconstruction before the answer. Point out faces, directions and branches as the unresolved question. Retain lab detail in reader/E07/E08. Ask what is and is not explained. |

## Proposed teaching sequence and preservation

The approval draft preserves the ten scene jobs but adds one dedicated pressure lesson after the
relay payoff. It therefore has eleven provisional sections, not eleven equal time slots:

1. See donor shrink and ice grow; identify the gas route.
2. Distinguish physical routes without a vocabulary exam.
3. Identify visible droplets versus invisible gaseous water.
4. Explain the start of ice and follow the same seed.
5. Demonstrate equal exchange, name equilibrium, predict a perturbation.
6. Demonstrate different surface balances and deliberately shared-air consequences.
7. Resolve the opening cloud-transfer question.
8. Explain molecular pressure, water's contribution and saturation language.
9. Explain percent-of-reference versus extra amount, with a qualified scientific comparison.
10. Follow liquid depletion without a universal cold cutoff.
11. Reconstruct the route; separate material from unexplained shape.

Thoroughness is preserved by supplied reader passages for millibar/RH arithmetic, the three
temperature values and calculated peak, the selected cold-cloud account and laboratory-history
example. These are not necessary premises hidden in footnotes. The core physical explanation,
two-way exchange, fixed-condition assumptions, selected-route status and no-universal-cutoff
qualification remain spoken. Revised words are not yet approved or user-tested.

## Live visual implementation and checks

Implemented at website `2ecebe2d7cd97fee7a35af683e420bd3525e67d6`.

Only `earlyEpisodeDrawing.ts`'s scene-4 lens and `laterEpisodeDrawing.ts`'s scene-6 liquid surface
change, plus focused tests/documentation. The new `liquidSurfaceOffset` completes two wavelengths
across the surface, so its mean is unchanged as phase advances. The mean falls only with the
existing net-evaporation cue; particles and arrows meet their local wavy surface. Ice stays flat.
The circular lens retains liquid/solid labels, non-ice speck and original parent. Browser review
moved the “First ice” callout to quiet space rather than leaving it over the patch.
The actual-diff code review caught a short-canvas clipping risk in the phase key. It now draws
outside the clipping region and moves above very small lenses; a narrow-layout follow-up keeps
the smaller mobile key inside its readable lens to avoid crowding the heading. Short-desktop
1270×610 and final narrow views were inspected after this repair.

Root observed desktop 1270×710 and narrow 390×844 layouts, liquid/first-ice/frozen lens states,
live scene-6 progression from 7:30 to about 8:00, forward/reverse 7:30 ↔ 8:05, Still and manual
up-scroll takeover. At the narrow size the lens and phase labels remain contained; the fixed
baseline distinguishes waves from net liquid loss. Still retains a wave-shaped liquid boundary
without ongoing movement. A cold reload was required to replace an old canvas callback retained
by development hot reload; old screenshots were not misreported as the new treatment.

Executed from `/Users/clipper/github/snowcrystal_website-film-part1`:

```text
node --test --test-reporter=tap --test-reporter-destination=docs/episode-one-comprehension-tests.tap scripts/series.test.mjs scripts/series-continuous.test.mjs scripts/series-audio.test.mjs scripts/episode-two.test.mjs scripts/film-timeline.test.mjs scripts/film-opening.test.mjs scripts/film-prepared.test.mjs scripts/film-export.test.mjs
npx tsc -b
node /Users/clipper/.codex/plugins/cache/openai-bundled/sites/0.1.70/scripts/build-site.mjs
git diff --check
```

The TAP artifact records **87 passes, zero failures**. TypeScript and production build pass;
the build retains its existing large-chunk advisory. Tests cover deterministic finite drawings,
new circle/wave behavior, unchanged narrated text/asset identity, clock ownership, E02 and film
boundaries. An initial new lens test sampled the separate final-seed shot and wrongly expected
a lens there; it was corrected to the actual lens stages, not by changing the preserved seed shot.

No script import, narration synthesis, credential access, solver or scientific gate, export,
deployment, push or merge. Old film, home, E02 and recorded E01 remain preserved. These checks
prove a bounded presentation change, not improved comprehension of the still-unmodified narration.

Authority prose checks: `npm run lint:rule7` and `git diff --check` pass. A one-off Node check
resolved relative file links in the review/draft/guides and confirmed the eleven separately
marked approval narration sections. The check creates no new permanent verification machinery.

## Next decision

Read the approval draft with the maker. Decide on its separated pressure lesson and reader-depth
allocation before importing words or remapping visual cues. Then rehearse the revised performance
and ask a general adult the open questions above without first teaching them the answers. Record
actual responses and the earliest missing link. Technical success must not be called audience
acceptance by inference.
