# Plan — E02: Why six is only the beginning

- **Phase:** Journey/media; no scientific phase or gate change
- **Status:** design-guide catch-up complete (2026-09-18, website `4e33879`); narrated E02 remains intentionally unreleased; maker viewing/listening at the preview gate pending
- **Started:** 2026-09-16
- **Authority:** initial silent build followed by explicit maker authorization on 2026-09-17: add audio using the latest E01 voice and synchronize timing
- **Parent:** [series plan](explore-journey-science-series.md), [maker design guide](../video/science-series-design-guide.md)
- **Worktrees:** authority `/Users/clipper/github/snowflake` on `explore/film-part1-plan`;
  website `/Users/clipper/github/snowcrystal_website-film-part1` on `explore/film-part1`, baseline `c3143a2`

## Goal

**Current release override:** the maker's later
[opening-card request](explore-journey-science-series.md#opening-copy-and-episode-2-release-hold--planned-2026-09-17)
holds E02 behind Coming soon. Website `d7eb937` gates its mounting, direct entry, home action
and E01 continuation through `src/series/seriesRelease.ts`. Preserve this hold until explicit
release direction; the original runtime requirements below describe the retained implementation,
not permission to expose it now. Source, bilingual recordings and reusable crystal catalog remain.

Continue E01's earned shape question: what does ice's molecular arrangement explain, and what
does it leave for growth physics? The audience should distinguish molecule from lattice, infer
why a hidden structure requires evidence, recognize a three-dimensional hexagonal oxygen network,
name basal/prism faces and their directions, and see why the same structure permits different
habits. No fixed episode duration; give the argument its needed inspection time.

## Approach and scope

Write the complete source-bound script and beat/shot table before website work. Primary local
sources are Chapter 2's observation/Kepler/X-ray sections and Chapter 3. Source currency matters:
do not inherit the chapter's obsolete claim that pure cubic ice has never been observed, its
universal snow-temperature/formation language, or an angle-alone proof of a unique lattice.
Use targeted primary-source checks for load-bearing facts and a read-only science review of the
actual script/visual plan; record corrections before implementation. Keep the chapters unchanged.

Visual thesis: **one crystal, a journey inward, then outward with a sharper question.** Rich
project crystal imagery provides observation; labelled projected three-dimensional teaching
geometry explains structure. Select a molecule/network/ring before changing scale or view. Show
the same ring tilted, the same lattice extended and turned, the same prism's face families
highlighted. Fixed references make material addition different from rotation or translation.
Keep structure demonstrations schematic, not atomistic dynamics or measured diffraction data.

Working scenes: six-direction puzzle; observation and selection; Kepler's testable packing guess; diffraction as evidence;
bent molecule versus four-neighbour oxygen network; puckered rings and the c-axis view; alternative
stacking; face families and normal directions; lattice/layer scale; and same structure/different
growth ending. The pyramidal-angle construction remains in the source reader, with its
deferral recorded in the script. Final script may combine beats where
watching reveals repetition. Preserve source-section dispositions rather than silently cut depth.

Use existing project-generated growth imagery where it serves opening/ending context. Browse
manifest identities and available payloads; do not force unrelated growth recordings into an
atomic explanation. Original code-native diagrams are the main new animation work. No private
photographs, third-party generated artwork, new scientific runs or asset publication.

## Runtime and preservation

- Append E02 beneath the retained home/E01 document, with `/series/episode-2` direct entry,
  an additional home entry and an E01-ending continuation. No hard navigation for those buttons.
- E02 is explicitly **silent visual rehearsal**: complete readable narration draft plus an
  editorial clock, Play/Pause/seek/rate and reversible manual scrolling. No fake audio element,
  TTS, ElevenLabs call, credential access or reused E01 speech. Timing is provisional.
- Keep playback ownership exclusive. Starting either episode pauses the other. Manual input
  yields immediately; seeking/resize and reduced-motion/Still retain meaningful states. No
  automatic E01→E02 playback on completion without a user action.
- Preserve home growth/snowfall choreography, E01 narration/source/drawings, original film and
  previous exports. Limit E01 edits to continuation/exclusive playback wiring. Keep existing stack,
  dependencies and retained port 5185; no deployment, push, merge or cleanup.

## Steps

- [x] Draft [script, sources/dispositions and visual beat table](../video/science-series-e02-script.md).
- [x] Fact-check and source-review actual words/visual claims; repair findings before building.
  [Review record](../reviews/science-series-e02-review-2026-09-16.md) names checks and limits.
- [x] Commit this plan and reviewed script before website implementation (`f619d6a`).
- [x] Build complete silent E02, continuous entry and purposeful reversible animations.
- [x] Run focused content/geometry/timing/transport tests, TypeScript and app production build.
- [x] Inspect normal-speed representative playback, each scene's before/action/after, desktop/
  phone, transitions, reverse seek and Still; review against maker design guide and repair.
- [x] Record exact implementation/checks, preservation and untested narration/device boundaries.

Implementation: website `f02a3be751e32d70ac26584651b564620ed2bf4c`. The
[review/edit record](../reviews/science-series-e02-review-2026-09-16.md#build-and-design-guide-review)
names bounded viewing versus code-only checks. Website `docs/episode-two-tests.tap` at that
commit records **81 passes, zero failures**; TypeScript and production build passed.
No final narration or uninterrupted narrated viewing is implied.

## Done when

The complete E02 reading/animation draft is available in the same series experience, scientifically
checked over its named source scope, with legible concept-bound actions and a recorded design-guide
review/edit loop. The site clearly says no audio and provisional timing. Product-sized checks and
bounded browser observations pass; source correctness, visual judgment and maker acceptance are
separate. No final narration, uninterrupted narrated viewing, audience approval or export is claimed.
No exact scientific `npm test` or gate for this isolated presentation/content addition.

## Open questions

Final voice, actual performance timing and maker comprehension response remain later inputs.
Physical-phone/iOS behavior cannot be inferred from a desktop narrow viewport.

## Maker revision — library, meaning and molecular continuity

2026-09-16 feedback on the initial build: replace the opening's schematic plate/column with
real project recordings; history must earn its place; explain necessary notation in the narration;
explain why the tetrahedron is relevant; reuse the education honeycomb idea and carry that same
sheet through a rotating, zoomed-out network and stacking view.

Bounded approach, committed before implementation:

- Reduce playback to eight scenes by moving observation history and Kepler's packing detour
  to the existing source reader. Retain diffraction as an answer to how hidden spacing is
  measured, with plain-language labels and narration definitions before any shorthand.
- Use the six locally available, manifest-registered direct G–G recordings for hexagonal plates,
  solid columns, stellar dendrites, hollow columns, capped columns and sectored plates. Publish
  only minimal-header derivatives of these project-generated payloads into the website, pinning
  source and served hashes. No private NAS route or new simulation. This explicitly extends the
  initial no-new-asset-publication scope for the maker-requested catalogue reuse.
- Use three actual growths in the opening, and the other three in the ending's diversity beat.
  Keep visible model/unvalidated, accelerated nonphysical-tick and independently framed labels.
  Add an opt-in unit-Z render setting; preserve legacy 2.6-times styling on other pages.
- Explain two donated plus two accepted hydrogen bonds before introducing the tetrahedral
  neighbour directions. Label idealized network hydrogen positions, distinct from the isolated
  molecule's measured internal angle. Check one H per O–O edge and two donated links per O.
- Adapt the education sheet's visual idea, not its final oxygen-only 2D geometry: keep persistent
  atom IDs in the reviewed puckered Ih ring/sheet, reveal neighbouring rings, zoom and orbit,
  then reveal connections above/below the same sheet. Registry comparison is secondary, explicitly
  symbolic, not a substituted sheet or physical layer-deposition movie.
- Verify focused geometry/content/assets/timeline tests, TypeScript, production build and bounded
  live desktop/narrow before/action/after, reverse seek and Still viewing. Root is sole Site editor;
  read-only asset, story and science reviewers advise independently. No audio or solver changes.

Done when these exact comprehension repairs are implemented, reviewed and recorded, with maker
acceptance still pending. Preserve E01/home/old film and the source-section disposition record.

Completed at website `707ca01ec8f9c753f49389ac667e6559c8268daa`; the
[bounded review/edit record](../reviews/science-series-e02-review-2026-09-16.md#maker-revision--recordings-and-a-continuous-molecular-story)
names actual viewing, independent code/source findings and repairs. Website
`docs/episode-two-revision-tests.tap` at that commit records **85 passes, zero failures**.
TypeScript/production build pass; eight-scene source import hash is recorded in the review.
Next: maker feedback on the revised page, not automatic narration generation or E03 production.

## Updated-guide comprehension revision — 2026-09-17

The maker now requests review and implementation against the updated design guide. Preserve the
eight-scene investigation, six real model recordings and continuous H₂O sheet/network. The
new E01 performance at website `1fd50e6` is independently owned and must remain unchanged.

1. Rewrite E02's narration in the approved concrete, conversational voice. Explain what each
   representation does before its technical name; remove production instructions from speech.
   Keep model/source qualifiers, but relocate repeated implementation detail to visible notes.
2. Repair the largest prerequisite burdens: waves before measurement, connections before the
   tetrahedron, a repeated network before stacking terminology, direction of added material
   before face vocabulary, and repeated distance before scale arithmetic.
3. Supply a substantive optional reader inside the same source file and live page for molecular
   angles/ice rules, diffraction geometry, alternate stacking, face orientation, lattice/layer
   dimensions and history. Keep precise source links and explicit section dispositions. Do not
   silently drop depth or exile a necessary premise.
4. Revise corresponding drawings and paragraph cues. Add deliberate input/question/result holds
   where a viewer can predict a change; withhold result labels until release. Preserve deterministic
   reverse/Still states, retained object identity, fixed references and the existing recordings.
5. Obtain bounded read-only story/source/runtime review, focused tests, typecheck/build, and
   cold-load desktop/narrow visual review of changed beats with incoming/outgoing context.
   Record actual coverage separately from complete performance and audience comprehension.

Done when revised words, explanatory actions and optional depth are available in the silent E02,
material review findings are repaired, and checks/limits are recorded. No audio generation or
credential access, E01 rewrite, solver/gate work, new episode, export, deployment or publication.
Silent timing is provisional; full spoken rehearsal and uncoached audience teach-back stay pending.
Root is the sole website editor. This amendment is committed before implementation.

Completed at website `414dbe85c704fc750dec7db66057717a62d46de7`. The
[review/edit record](../reviews/science-series-e02-review-2026-09-16.md#updated-guide-comprehension-revision--2026-09-17)
records scoped source/story/runtime findings, repairs and actual visual/interaction coverage.
Website `docs/episode-two-guide-tests.tap` records **82 passes, zero failures**; TypeScript
and production build pass. E01/home/old film/assets remain unchanged. Next: maker comprehension
review; complete spoken rehearsal and a fresh uncoached audience account remain pending.

## Narrated performance amendment — 2026-09-17

The maker now explicitly authorizes full E02 narration. This amendment supersedes the earlier
no-audio/credential-access restrictions for E02 only; prior silent-build records remain historical.
Use the latest E01 voice, Juniper (`aMSt68OGf4xUZAnLpTU8`), with its retained multilingual-v2
settings. Read the authorized credential only inside synthesis, never into logs or committed files.
Keep the reviewed E02 spoken paragraphs unchanged; optional reader depth is not narrated.

1. Preserve immutable per-scene requests, audio and provider character alignment in a new E02
   directory. Pin source/audio identities. Never automatically repeat an uncertain paid request.
2. Decode and compose sample-indexed PCM, retaining original takes. Insert actual pauses before
   each of the four in-paragraph prediction answers, plus ordinary paragraph/scene breaths.
   Transform caption, paragraph and visual phrase cues through the same sample map.
3. Replace E02's provisional reading clock with the existing narration transport. Actual media
   time owns visuals and scrolling, including rate changes and buffering. Preserve direct entry,
   interruptible continuous descent, exclusive episode ownership, manual/seek/reverse/Still modes,
   explicit retry on audio failure, and end stopping. Update silent UI labels only outside E02.
4. Verify every take/master decodes, exact spoken-source coverage, alignment bounds and actual
   prediction pauses. Run focused episode/audio/continuity tests, typecheck, production build,
   and live desktop/narrow playback inspections with independent source/runtime/cue review.
   Distinguish automated synchronization and sampled viewing from full human listening acceptance.

Done when the complete E02 narration is playable with phrase-aligned causal visuals and scrolling,
all four prediction answers are withheld through their pauses, checks and limitations are recorded,
and E01/home/old-film behavior and retained audio remain intact. No new voice selection, script
rewrite, E03, solver/gate changes, publication or export. Root remains sole Site editor.

Completed at website `5fcd95a`: full Juniper narration, sample-mapped prediction pauses and media-owned visual/scroll
timing are implemented. The [review/edit record](../reviews/science-series-e02-review-2026-09-16.md#authorized-juniper-narration-and-synchronization--2026-09-17)
names retained identities, independent artifact/ASR/runtime review, repaired findings and actual
browser coverage. Website `docs/episode-two-audio-tests.tap` records **86 passes, zero failures**;
TypeScript and production build pass. Human pronunciation listening and audience teach-back
remain pending; next is maker review, not more automatic synthesis.

## Design-guide catch-up — 2026-09-18 (planned before implementation)

Maker request (2026-09-18, after the Nivogenesis public release and the E01 phone pass): "Following the
design guide for episode design, there have been several updates on content, design, approaches. Please
update episode 2 based on those new requirements." This lifts the 2026-09-18 "don't work on E02" hold for
this task only. The **release hold stays**: `EPISODE_TWO_RELEASED` remains `false`, E02 stays out of the
public bundle, and the Coming-soon card is unchanged. Releasing is a separate maker decision.

Baseline per file (website `explore/film-part1`, HEAD `71b25af`; E02 last revised at `5fcd95a`/`1f0fbd5`):
`EpisodeTwo.tsx` unchanged since the freeze; `EpisodeTwoVisual.tsx` gained the catalogue import at
`833ee9e`; `episode-two.zh-CN.json` and `episode-two-narration.zh-CN.json` carry the refined text and the
Susan revision from `e3bfbb4`. English narration: Juniper revision `2026-09-17-e02-juniper` (664.6 s).
Mandarin: Susan revision `2026-09-18-e02-mandarin-susan` (918.7 s), never played in a browser.

What changed after E02's last revision, and what E02 must therefore catch up on (a fact-finding fan-out of
five independent readers plus synthesis, 2026-09-18, 132 raw items; the ranked gap map G01–G33 is retained
in session scratch and summarised here):

1. **Player and layout parity with E01** (guide requirement 10/11; maker's E01 attention pass and phone
   pass, both accepted): one accessible Menu holding the section selector, Still and scene-aware Sources
   (Escape, backwards Tab, outside dismissal, focus return, opening pauses, closing never resumes); the
   stage carries no chapter eyebrow/title, no per-beat description sentence and no persistent production
   note (the prediction question stays local during its hold; a compact `Model · unvalidated ⓘ` key
   appears only while a recording is displayed and opens Menu → Sources); the Play control is the
   highlighted fixed-width `episode-play` with the ▶ glyph when paused; the Mandarin badge leaves the
   controls bar; the guided scroll uses the expected-position envelope (seeded before entering, cleared on
   pause) and the ten-pixel touch threshold; phone top-bar compaction and the ≤ 400 px brand tagline
   rule get `#episode-2` twins or a shared selector. The `series.css` comment "E02 retains its layout" was
   a 2026-09-17 scoping choice, superseded by this request.
2. **Public-neutral wording** (public release D16; science-review E02 finding deferred with the freeze):
   the Sources disclosure names both served voices and Kenneth G. Libbrecht's *Snow Crystals*, drops
   "draft" and the second-person "the voice you selected"; optional-reader paragraphs stop naming numbered
   future episodes at render time (as E01's `publicReader` does), so no source hash changes; the footer's
   "Episode 3 is not produced yet" becomes an unnumbered line; Sources state the recordings' model status
   **and** rendering recipe (unit Z, fitted frames, time-compressed, unvalidated).
3. **Attention pass on the eight scenes** (guide "what enters now, what remains, what retires"; E01's
   accepted scene-9 method): gate always-on captions to their spoken phrases (E02-01 six-direction labels,
   E02-04 wave/ray caption stack, E02-05 entry captions); reveal "≈ 5 million in-sheet repeats" at "About
   five million", not at paragraph entry; give the narrated cell a focus cue in E02-01 ("the plate … the
   column … the star"); give transition paragraphs a named inspection target instead of a static frame;
   announce the E02-08 teaching prism as a schematic with a local label; name the one unlabeled arrow.
   Visual-only; every new or changed canvas string gets its Chinese equivalent.
4. **Spoken content** (guide items added after the E02 script: cited-person context; a closing that leaves
   a specific question for the next episode): two English passages change — E02-09 p2 introduces
   Libbrecht in one clause, and E02-10 p3 ends on the next episode's question. Under the standing refresh
   direction the two affected Juniper takes are regenerated in a new revision that reuses the six unchanged
   takes byte-for-byte; the paced master, captions, cues and the script/JSON hash bindings are rebuilt.
   The other guide item (shared-action imperatives such as "Highlight those two ends") was reviewed and
   kept on 2026-09-17 as viewer-shared actions; it is not reopened.
5. **Chinese text and Mandarin voice.** The eight deferred E02 translation findings (seven confirmed, one
   terminology; recorded in website `docs/series-narration/2026-09-18-e01-mandarin-yun/translation-review.json`
   with "deferred: Episode 2 frozen") are applied through the cue pairs, and the two rewritten English
   passages are translated. Those word changes touch seven of eight sections, so the standing direction
   requires refreshing the Mandarin takes; the refresh voice is **Yun** (`4AfodMgwXps9oZFhHzoj`, the maker's
   2026-09-18 choice over Susan, restated in the guide). **Assumption, stated for the maker:** all eight E02
   Mandarin takes are regenerated with Yun in one new revision rather than leaving one Susan take among
   Yun takes; the Susan revision stays retained. If the maker prefers Susan for E02, the same pipeline
   reruns with `--voice=0H4ruoQ81Ei2FCwjW5j1`.
6. **Local review surface.** With the hold in place nothing mounts E02, so a non-public-only preview gate
   (`/?e02=preview`, dead code in the public build by the `__NIVOGENESIS_PUBLIC__` define) mounts E02
   beneath the home for review; the pinned release patterns in `SeriesHome.tsx`, the router and the
   release test are kept and the release test gains the gate's negative control.

Not done here, recorded for the maker: loudness matching across the language toggle; a physical-phone
check (E02 cannot reach a Firebase preview channel while the public build excludes it); human listening of
the new Yun/Juniper takes; an uncoached teach-back; acceptance of the five 2026-09-16 E02 feedback fixes.

Checks (product-sized, Rule 6): `npm run build` and `npm run build:public`; the E02-bearing focused set
(`episode-two`, `episode-two-audio`, `series-bilingual-audio`, `series-localization`, `series-release`,
`series-opening-sound`, `series-reading`, `public-release`) plus the release smoke against the hosting
emulator to prove E02 still stays out of the public bytes; full decode of every new take and master with
exact spoken-source coverage; a cold-load live check of the preview gate on the retained dev server at
desktop and 360 px (play from the intro, takeover and resume, forward/reverse seek, Still, language switch
during a prediction hold, Menu keyboard and focus paths, natural end) with per-scene captures viewed by the
author; an independent read-only review (different context) of the change set; then the review record,
this plan, `docs/PROGRESS.md` and the website receipts. Human listening and audience acceptance stay
separate from these checks.

Done when: all six strands above are implemented on `explore/film-part1`, the checks pass and are recorded,
the public build still contains no E02 bytes, `EPISODE_TWO_RELEASED` is still `false`, retained revisions
are untouched, and the next step for the maker is viewing/listening on the preview gate.

Completed at website `4e33879` (part 1 `b7ed794`, part 2 `4e33879`): all six strands. Records: website
`docs/science-series.md` (catch-up section), `docs/episode-two-catchup-verification.json` (identities and
checks, assembled from the artifacts by `scripts/episode-two-catchup-receipt.mjs`),
`docs/series-narration/2026-09-18-e02-mandarin-yun-q/translation-application.json`, audits under
`docs/series-narration/mandarin-review-2026-09-18-e02-yun-q/`; the
[review addendum](../reviews/science-series-e02-review-2026-09-16.md#design-guide-catch-up--2026-09-18)
records the three-lens review, its 29 confirmed findings and repairs, and the limits. Numbers at write
time, copied from the receipt: Juniper `2026-09-18-e02-juniper-question` paced 683.19 s (six takes reused
byte-for-byte from the 2026-09-17 revision); Yun `2026-09-18-e02-mandarin-yun-q` paced 932.57 s, 244 anchors,
4 holds, audits pass (69 production phrases, onset error ≤ 2e-13 s); **100 focused tests passed, 0 failed**;
`npm run build` and `npm run build:public` exit 0; emulator smoke clean; live check clean at 1280×800 and
360×780 emulation. Loudness: Yun −28.6 LUFS vs English −25.6, no gain change. The Susan and 2026-09-17
revisions and the two intermediate 2026-09-18 revisions (`-juniper-hook`, `-mandarin-yun`) are retained as
reuse sources. Deviation from strand 4 as planned: the review found the closing still declarative, so the
two closing sentences were swapped and the E02-10 takes regenerated once more (two further paid takes).
Two shared player fixes from the review also landed in E01 source (envelope kept on pause; wheel/touch
takeover re-derives the clock); the live site at `84af23f` lacks them until the next deploy. Next: the
maker views and listens at `http://127.0.0.1:5185/?e02=preview`; release stays a separate decision.

## Tried and rejected

- Driving narrated playback with the provisional reading clock or matching prediction words
  after discarding punctuation (a question's “wider?” is not the answer's “Wider:”).
- Reusing unverified ignored PCM caches as composition inputs; preserve verified takes and
  derive fresh explicit-format PCM. Do not resynthesize an intact take to repair timing code.

- Keeping optional complexity in the spoken path while calling citations a substantive reader.
- Reducing plane spacing and changing beam angle simultaneously, hiding the lost-match step.
- Forcing every Still paragraph to its final pose, revealing a prediction answer prematurely.
- Replacing specific comprehension repairs with a blanket shorter duration or faster playback.

- Making the water molecule itself hexagonal; using a 2D honeycomb as the full 3D crystal.
- Treating tetrahedral bonding as proof of exactly two possible structures or identical six arms.
- Repeating an obsolete no-pure-Ic claim merely because the local chapter prints it.
- Presenting a generated diffraction illustration as an experimental photograph or unique solution.
- Using a growth-model cell or styled thickness as a molecular dimension or physical specimen size.
- Replacing the accepted E01 player to obtain a silent E02 rehearsal clock.
- Treating history as a compulsory introduction, unexplained letters as self-evident, or one
  actual crystal plus two drawings as sufficient use of the available recording library.
