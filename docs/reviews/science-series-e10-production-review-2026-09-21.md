# E10 production review — final chapter batch

Status: Both review/update rounds are complete. Final English narration is present, all 12 focused tests pass without skips, and the Round 2 mobile-layout repair has passed its actual-touch recheck.

Scope: English only, E10-01 through E10-09. This is an owner and non-author agent review with shared project context. Source review, automated media playback and sampled visual inspection are separate evidence. No human listening, physical-device result or uncoached learner comprehension is claimed.

## Source and story review

The non-author final-batch source reviewer checked the whole spoken script and optional reader against chapter 12 and the cited primary papers. No scientific narration correction was required. Two concrete source/visual-note repairs were made: the final chapter link now uses the real `#working-hypothesis` anchor, and the pressure comparison preserves source-to-face distance rather than implying that reducing pressure shortens the geometric path. The optional reader additionally preserves the separate 22% supply experiment without claiming a full supply map.

The coordinator caught an instruction to the animator in E10-04: “Show the arrivals first…” became viewer-facing narration: “As these arrivals collect, a new island can survive and spread.” The content and exact phrase cue were reimported together. Local rehearsal before that edit cannot stand for the final spoken source.

## Round 1 — provisional performance and revisions

The owner first inspected 360 × 345 teaching frames and end-of-paragraph states, independently of the eventual narration. Initial checks fixed a clipped parent plate in E10-02, a temperature-marker collision with the E10-03 clock label, and unequal comparison-clock intervals in E10-07. The production stage was then frozen for the complete local-voice performance at `export/final-batch-e10-round1-v1` in the website repository.

The frozen first pass completed naturally at 559.564 seconds, with 54 chronological captures and no playback/browser/source-identity problems. The owner and non-author source reviewer inspected all 54 captured stages. The E11 owner additionally inspected 18 targeted desktop/narrow states. This is sampled inspection of a complete automated performance, not continuous human viewing.

Findings repaired after that performance:

| Cue | Encountered result and likely wrong inference | Required repair and verification |
| --- | --- | --- |
| E10-03 witness growth | Only radius moved, and new ice obscured the original reference. The witness inference lacked its observed dimensional premise. | Added face-normal advance with the bottom retained, overlaid original marks, labelled nonnumeric face/rim displacements and separate links to witness/local-supply/rim-response inference. |
| E10-04 surface route | Particles crossed empty space, making proposed surface traffic look like ordinary gas delivery. | Added connected curved shoulders and constrained trajectories to those shoulders and the terrace. |
| E10-04 arrivals | Twelve particles are rendered into six identical pairs of target positions; only six distinct marks can be seen despite the twelve-arrival caption. | Put the two corner streams in separate rows, retaining twelve unique marks on each lane; check actual emitted drawing coordinates and narrow frames. |
| E10-05 cold step | The regime name collided with the step-lip label. | Repositioned the lip label while retaining both referents. |
| E10-06 closer steps | A tiny static step mark did not demonstrate closer spacing. | Added a linked enlarged inset: wide earlier treads remain, followed by progressively closer new treads; old solid is not compressed. |
| E10-07 fast-start onset | A shared progress value made both histories grow early, then erase their additions at the pulse cue. | Separate monotonic lane progress and clocks preserve the completed gentle case while the fast-start case begins. A rendered-state regression catches the original reset. |
| E10-07 similar later air | The later-condition label and representation-status line occupy the same vertical position. | Move the later condition and its connector below the persistent status; inspect the complete late history frame. |
| E10-08 change chosen local supply | The response bars change, but the barrier graph stays unchanged while the spoken sentence refers to response-curve crossings moving. | Introduce calculated response curves with an explicit axis change and show the crossing move under the selected supply; preserve the initial crossing as a reference, keep morphology labels absent. |

Focused tests cover source identity, exact phrase uniqueness, prediction withholding under normal/Still/reverse seeking, retained old material, matched strip depth and width, distinct arrival positions, and actual drawn half/tenth bars. The arrival-position regression was observed to fail on the initial drawing rather than merely asserting a copied constant. Final delivered-clock tests stay explicitly skipped until production narration exists.

Additional coordinator findings were repaired before final speech: history labels now clear the seed bottoms and clocks; fraction labels appear only when their bars reach the corresponding full, half or tenth width. The owner split the final recap into strip, surface-traffic and outward-addition phrase gates, moved the second feedback cycle onto the spoken growth phrase, and separated introducing a response graph from changing its local supply. Recap particles now contrast with the added ice, and the representation label changes when the quantitative bars retire.

The new provisional score is `export/final-batch-e10-local-v3/score.json`, bound to the current cue packet and exact English source. It uses explicit local Samantha speech, measured fragment duration and estimated within-fragment word timing. No provisional score or speech is installed in the production narration tree. The final repaired frozen stage is `export/final-batch-e10-round1-repaired-v4/site`, with its source/build/audio identity in the adjacent `build.json`; previous v1–v3 builds remain diagnostic history. Source and all 117 exact reveal phrases are frozen for production.

Bounded post-repair checks: non-author reviewer inspected all seven original failures on fresh compiled builds at desktop and 360 px, including before/after pulse onset and moving response crossings. The coordinator checked all 27 paragraph-end poses. The owner captured 40 additional desktop/phone intermediate states for feedback, later history, numeric bars and recap; a final 12-capture subset checks the recap contrast/status refinement. Eleven focused tests pass before final audio, with the delivered-clock test explicitly skipped rather than reported as a pass. Tests use actual rendered coordinates for twelve distinguishable arrivals and full/half/tenth widths, and assert independent history retention, answer withholding, source identity and deterministic reverse seeking.

## Round 2 — delivered performance and revisions

The delivered Juniper score is present, and all 12 focused tests now pass without skips, including final source binding, measured prediction holds and all exact phrase reveals. The coordinator completed a native 1× run against the frozen full website candidate at `http://127.0.0.1:5250/episode-10`, built in `export/series-final-batch-round2-site-v1`. It ended naturally at 572.737 seconds, with 54 chronological captures and no reported problems. The independent source reviewer inspected all 54 captured stages, 56 additional causal poses and eight prediction-hold samples, and found no new scientific or animation correction. This is sampled inspection of a complete automated performance, not a listening or continuous human-viewing claim.

The E11 owner completed a non-author delivered-performance review through the actual E10 component. Its 106 targeted desktop/360 px states cover all paragraphs, both prediction holds, Still and causal intermediates. Six selected native 1× context windows add 109 chronological captures for the measurement/inference chain, surface arrivals, temperature window, feedback, moving response crossing and numerical shortfall. The reviewer inspected contact sheets and enlarged key states, with no browser errors or new required correction. This selected-context result is separate from the coordinator's uninterrupted run. Evidence: `export/e11-cross-review-e10-round2-v1/review.md`, `export/e11-cross-review-e10-round2-contexts/review.json` and `export/e11-cross-review-e10-round2-temperature/review.json`.

The coordinator's actual mobile-touch check did find a required interaction repair. The closing reader heading used the shared 4rem size; its word “explanation?” exceeded the 312 px reader width (363 px scroll width), expanding the mobile layout viewport to 387 px despite a 360 px visual viewport. Fixed controls inherited that expansion, clipping the speed selector and displacing touch hit targets. This was text overflow, not a defective seek control. The E10-only closing heading now uses `clamp(2rem, 7vw, 4rem)`; no overflow mask was introduced, and narration, cues and art were unchanged.

On the fresh compiled v2 website at `http://127.0.0.1:5252/episode-10`, the owner verified a real emulated-touch scroll takeover and tap-to-resume: layout and visual viewport both remain 360 px, visual scale remains 1, offsetTop remains 0, and every playback control lies within the visible viewport. All E10 h1/h2 elements fit their content widths; the desktop footer retains 64 px type and was visually inspected. Receipt: `export/e10-round2-phone-footer/recheck-v2/review.json`, with desktop/phone screenshots. The final build is `export/series-final-batch-round2-site-v2`. Complete-run receipt: `export/final-batch-e10-round2-native-v1/review.json`.

The independent source reviewer also rechecked v2 with mobile emulation and actual taps: layout/visual/scroll widths are all 360 px, heading client/scroll widths both 312 px, and the speed selector ends at 348.813 px. Its desktop review remains clear. Both owner and non-author checks close the Round 2 repair without changing the narrated content or performance.

The E10 owner also performed the non-author final E11 review; its concrete findings, timing measurements and repair recheck are retained in [the E11 Round 2 cross-review](science-series-e11-round2-nonauthor-review-2026-09-21.md). The coordinator's final-batch record retains aggregate source/media/build identities and interaction receipts.

## Reusable-guide disposition

The current portable guide already covers visible count consistency, shared comparison coordinates, current-instance review, narrated verbs, and complete intermediate/narrow composition. These findings therefore primarily demand better application; they do not justify adding episode history to the general guide.
