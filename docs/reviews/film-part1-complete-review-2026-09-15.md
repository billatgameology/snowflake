# Part 1 complete visual film — review/edit loop

## Status and scope

The [complete visual-film execution](../plans/explore-film-part1-science-scroll-documentary.md#complete-visual-film-outcome) and review/edit loop are complete. The maker asked to finish the visuals before recording narration. The prepared runtime covers the reviewed story through credits, and the full-length viewing export passed its final output checks. Root found no blocking presentation defect in the inspected decoded samples. This is pre-narration technical completion, not maker acceptance or final voiced-master acceptance; the [final receipt](../video/part1-complete-verification.json) binds the source, implementation, checks and actual output.

At write time, [the prepared score](../video/part1-prepared-score.json) is 420,546 bytes, SHA-256 `f9eb32fd6bbe8996b2d6842f4c8223ec7c4c4d6478f1f1b7e9d75967465ecc0f`, imported from authority revision `95c837678291014327af6b6970596d17dc244d22`. Its actual JSON contains 82 rows and a provisional 2,120-second duration. The [script](../video/part1-script.md) remains 60,305 bytes, SHA-256 `3a55b48ade327a360ce14d14dc2f7979bd956200c57120324bfdab2561b86e36`; its [existing source review](film-part1-script-review-2026-09-15.md) is not replaced by this implementation review. No new spoken text, source chapter, solver or scientific gate is approved here.

## Reviewer provenance

The reviewers were OpenAI Codex inherited-session lanes `runtime_review`, `science_review` and `story_review`, with exact model IDs unavailable. They shared task context and exchanged findings with the implementation agent. This was **not blind, independent-context, or independently reproduced browser review**. `story_review` also authored earlier script/score assets; its current code/source review is not an independent audit of those authored assets.

For this loop the reviewer lanes inspected code, score and relevant source text read-only; the story lane also drafted this review record. Root alone edited the website, executed browser/capture checks and visually viewed the source captures, corrected frames and final decoded-MP4 samples. Root appended the final execution disposition here. Contact-sheet and sampled-frame inspection is not an uninterrupted real-time watch of the narrated film. The website worktree is `/Users/clipper/github/snowcrystal_website-film-part1`; website-relative paths below refer to it.

## Findings and applied repairs

The following dispositions are supported by the current implementation and root's review feedback. The local reports in the next section bound execution evidence; a code repair alone is not final viewing acceptance.

| Finding | Repair / bounded disposition |
|---|---|
| Same-theme silent holds restarted the completed chain, growing crystal and narrowed facet. | `S17-05`, `S22-05`, `S26-05` and the later animated `S28-05` now carry constant end-state progress. `Part1Film.tsx` passes mapped diagram progress and uses the hold endpoint in reader stills; `film-content.mjs` supplies the static edition. Intentional transition animations remain separate. |
| The final-transition helper promised the computer crystal as the next view, despite the scripted diagram recap intervening. | `closingGeometry.ts` now says to gather the connections before returning to the computer. The reviewed dialogue, recap and delayed complete Run B reveal are preserved. |
| A successful island was already spreading under the “waiting” label. | `terraceScene` delays its successful growth until the label changes; loose molecular traffic remains visible. The layer-completion drawing is clipped to the terrace footprint and grows by addition. These remain schematic, not molecular simulation results. |
| Optical signals changed while the depicted ice thickness stayed fixed. | The laser and white-light panels now share an increasing illustrated thickness and changing optical path, while retaining distinct signals and explicit schematic status. No calibrated thickness conversion or laboratory data was fabricated. |
| Adjacent inference/fit panels mixed an attachment-response curve with a temperature-dependent barrier dip. | `epistemic-lines` now separates observed growth, a model-inferred barrier and a chosen barrier curve with a temperature label. It no longer implies that the unlike curves are one directly measured fit. |
| The frontier's open questions repeated the narrowed-facet view instead of reconnecting to the original map. | `open-mechanism` returns to the qualitative habit map and introduces the research questions. The hypothesis label precedes motion and remains visible; questions do not imply executed tests. |
| Historical and later experimental apparatus could be confused. | The historical chamber uses a suspended-fibre growth sketch; the later experiment retains its separate frost reservoir, substrate and temperature controls. Qualitative map directions and the revised cold end are identified. |
| Proposed edge sharpening and explanatory labels needed a clear reading. | The edge-growth polygon retains earlier ice rather than carving it away; gas supply and outward growth remain distinct. Root adjusted explanatory label placement/scrims after viewing corrected frames. This is a hypothesis diagram, not a validated Run B mechanism. |
| Root/runtime found the final dolly could lose the crystal at the camera's fixed far plane. | A prepared-film-only `cameraFar` hook in `StageTour`/`GrowthStage`, driven by `filmFarPlane` in `choreography.ts`, keeps clipping beyond the authored camera move and recomputes on reverse seek. The intended model fade, not clipping, owns the disappearance; other tours keep their prior default. |
| Resumable export could trust the wrong receipt filename, and encoder failure/backpressure needed fail-closed handling. | Root added receipt-to-chunk filename/interval/fingerprint checks, verifies actual resumed bytes and decoded dimensions/frame counts, and introduced `encoderPipe` with handled spawn/early-exit/write failure. An executed filename-substitution negative control rejects before assembly. The actual full-duration assembly also passes the output checks recorded below. |
| Final regression testing found that skipping hidden-crystal draws also bypassed context-loss detection during diagrams. | Root restored the inexpensive context-health check independently of drawing, retaining the rendering optimization. The executed context-loss test now covers both model and diagram capture seeks; the prototype matrix passes after the repair. The failed report is preserved at `export/film-prototype-complete-regression/report.json`, and the corrected run at `export/film-prototype-complete-regression-v2/report.json`. |

The film's closing scientific comparison remains explicitly a proposed future test, not invented observed data. Credits identify the original diagrams, identified unvalidated replay, pending maker recording and accompanying source transcript. Credits have no invented source binding or public release URL. The existing repeated recaps and provisional speech slots are retained; this loop does not silently rewrite or retime the maker's narration.

## Historical local evidence, not a full-length export

These reports were read at write time. Their implementation/score identities, rather than words such as “final” in folder names, determine scope.

- `export/part1-complete-final-v1/report.json`: sampled composition review, 126 still entries, exact repeated/reverse/reload screenshot comparison on its named renderer, and a decoded **six-second** audiovisual montage. SHA-256 `4c5bc16ab0b6a25de937999375c33e8480d0c272a1634dd71507f6faacb2b6ad`. It is not the complete movie. Current camera, closing-diagram and exporter bytes differ from that report's implementation snapshot, so it does not verify those later edits.
- `export/part1-complete-farclip-check/report.json`: later root capture report for the clipping correction, with sampled stills and its own implementation hashes; SHA-256 `aa9802da80c3c32b940d090c4633b55338d0919de1771c6150b4a04f8a2f6da6`. It has no newly encoded/decoded movie and cannot replace the final assembly check.
- `export/film-complete-final-v2/report.json`: ten completed browser checks and no reported page errors, including row selection, navigation, media-clock interruption, phone/enlarged-text reading, static editions, ending reversal and delayed audio metadata. SHA-256 `9b3554de10008d32a201ad1afaacfcb8e7044bb2446e31772d5b39797d35cf88`. The earlier `export/film-complete-review-final/report.json` is a failed seek assertion, not a pass; the helper now uses the range input's precision and allows the audio sample interval while preserving the selected visual time.
- `export/part1-full-pipeline-test-v1/report.json`: bounded **three-second** pipeline test, decoded assembly and resumed chunks, using two workers; per-frame presentation timestamps and decoded chunk-boundary comparisons are recorded. SHA-256 `fb0eab7f312ff915cde6edb47787d0fe9c2b150ba7983c19997f1abf917e26c1`. Its resumed-run wall time is not fresh rendering cost or full-film performance.
- `export/part1-full-resume-negative-v1/negative-control.json`: actual equal-duration chunk filename substitution rejected with exit 1 before assembly; original chunk bytes preserved. SHA-256 `0e66c964571da147c53664c1686ff398ab1722de1cffad53e6553408f021c7bf`.

The prepared/product and export-contract test files contain targeted regressions for the repaired boundaries. These historical samples do not replace the final command outputs and website identities bound in the receipt below.

## Final-build checkpoint

Website implementation is committed at `9d181afb6937a1e91fb89091b3543091c5f46eb5`
on `explore/film-part1`. Root checked the actual final sampler's implementation-file digests
against the current source bytes before committing. The final records supersede the earlier
samples only for the implemented product surfaces they test:

- `export/part1-complete-accepted-sample-v3/report.json`: the corrected composition, exact
  representative repeat/reverse/reload comparisons, late-handover pixel sentinel and decoded
  sample. The failed `-v2` attempt was interrupted by a concurrent documentation edit triggering
  Vite reload; it is not a product pass. All website writers stopped before the final rerun.
- `export/part1-complete-accepted-sample/focused-tests.log` and `typecheck.log`: root executed
  the focused timeline/opening/prepared/export tests and `npx tsc -b` after the context-health
  repair. `export/part1-complete-accepted-sample-v3/build-result.json` retains the successful
  Sites build helper result, including the bundler's existing large-chunk warning.
- `export/film-complete-accepted-browser-v2/report.json`,
  `export/film-opening-complete-regression-v2/report.json` and
  `export/film-prototype-complete-regression-v2/report.json`: final complete-film, opening and
  prototype playback matrices. Root also visually inspected phone laboratory, layer,
  hypothesis, complete-model and credit frames and watched the optical measurement scene
  advance in the retained in-app browser. This was a sampled watch, not a full-duration watch.
- `export/part1-full-pipeline-test-v3/report.json` and
  `export/part1-full-resume-negative-v3/negative-control.json`: bounded pipeline and actual
  resume-substitution rejection against the frozen final build. The full render uses that
  same build but its own full-frame plan and fingerprint.

The science reviewer rechecked the shared thickness/laser-phase parameter and connected fibre;
no remaining blocker was found within its bounded source/diagram audit. The runtime reviewer
rechecked the prepared-only far-plane change, reverse-seek recomputation and final separation
of context-health checks from hidden rendering, with no blocker. It inspected root's corrected
prototype report but did not rerun it. These final lane checks were read-only inspection, not
independently executed browser checks.
The story lane's final read-only close-out check found no current-status contradiction among
the plan, progress index, this review and the final receipt; it did not perform another
implementation or browser audit.

## Final full-length output and disposition

The [final receipt](../video/part1-complete-verification.json) binds 27 passing focused tests,
successful typecheck/build, 10 complete-film / 8 opening / 18 prototype browser checks and
the final capture/output reports. Website documentation is committed at
`a0163d360bbd252b2cb442465c3e7b23d6c5500c`; the implementation remains `9d181af…` above.
The final sampler contains 126 still entries and a decoded six-second montage. Its
`health-repair-visual-comparison.json` compares the pre/post health-check repair captures with
zero mismatches. None of these small samples is substituted for the actual full export.

Root completed `FILM_OUT=export/part1-full-final node scripts/export-part1-full.mjs` with two
rendering workers. The actual `export/part1-full-final/report.json` records:

- 2120 seconds (35:20), 63600 frames, 1920×1080 at 30 fps; 8-bit H.264 / BT.709 limited-range
  video and 48 kHz timing-only audio. No maker voice is present.
- 71 chunks, with the first/last decoded frame pair of each checked against the assembly
  (71 boundary pairs, not 71 internal joins). Every frame's presentation timestamp/duration,
  chunk keyframes and complete audio/video decode passed; no errors were reported.
- 3158.362 seconds of rendering/verification wall time. The MP4 is 280575547 bytes,
  SHA-256 `17273d2a5f3d353f9c1e9f711b4b796992e66da03195b845878f0ad71f8dbf44`.
  The adjacent VTT contains 229 provisional caption rows; its bytes/hash and the full recipe,
  browser and renderer identities are bound in the final receipt.

Root then inspected all 16 contact sheets containing 95 decoded MP4 samples: one selected
state from every scored row plus selected cuts, fades and endpoint states. Four repaired
scenes were also viewed at full frame size. The bound
`export/part1-full-final/assembled-visual-inspection.json` records the observations and limits.
Caption/figure separation remains readable in the inspected frames, the layer and optical
repairs are present, hypothesis labeling remains visible, the full crystal reveal is delayed,
and the crystal survives the late pullback until the intended fade. Credits are present and
readable. The final disposition is **no blocking presentation defect found in inspected
samples**. This is not an uninterrupted 35:20 watch, a maker approval, or a scientific metric.

The visual-film implementation, review/edit loop and provisional viewing copy are complete.
All export/inspection bundles remain local ignored working artifacts; no archival, backup,
upload or publication is claimed. No source chapter, solver or scientific gate changed.

## Remaining maker-dependent production

The maker's viewing, aloud read and recording come next, followed by actual-voice caption and
clip alignment, any necessary pacing/retime changes, and final voiced-master acceptance.
Recheck changed scenes and regenerate the voiced output under new recorded identities.
Real mobile hardware and OS background playback policy were not certified by the emulated
browser checks. Publication and scientific validation remain separate work.

Final document/source checks are recorded in the receipt: the prepared, opening and production
score compilers pass their `--check` commands, and `node scripts/lint-rule7.mjs` is clean.
`git diff --check` covers the close-out edits; these checks are not scientific-suite results.
