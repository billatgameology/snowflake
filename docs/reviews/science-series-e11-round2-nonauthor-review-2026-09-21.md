# E11 Round 2 — nonauthor delivered-performance review

Reviewer: E10 episode owner, reviewing E11. Candidate: full public component at `http://127.0.0.1:5250/episode-11`, compiled site `export/series-final-batch-round2-site-v1`. English production narration: 611.5143764172335 seconds. Production source, cues and drawing inputs stayed frozen throughout this review.

## Scope and evidence

- `poses/review.json`: 130 targeted captures through the actual full component, with final measured narration timing, at 1280 × 800 and 360 × 780. Every capture was visually inspected. No page/console errors, seek mismatches or document overflow were detected.
- Both prediction holds, their Still states, all eight scene transitions, partial growth states, proposed test outcomes, final layer advance and final Still composition are included. Paused reader text remains available by design; the visual hold withholds answer-specific emphasis.
- `native-outcomes/review.json`: focused actual 1× playback samples through the outcome sentence. Fake audio output is explicit; no continuous human watching, listening, physical-device experience or uncoached learner comprehension is claimed.
- `export/final-batch-e11-round2-native-v1/review.json`: the complete native 1× run ended naturally at 611.514 seconds with 53 chronological captures and no reported problems. I inspected all 53 stages in chronological order. The covered-prediction finding is also visible at 503.29 and 515.41 seconds; this complete-run inspection added no further required correction. It is sampled visual inspection of a complete automated run, not continuous human viewing.

## Required findings queued during the frozen run

### 1. Possible outcomes switch ahead of their spoken clauses

At E11-08, the visual chooses `floor(outcomes * 3)` from one 4.35-second eased reveal. Its start is 521.278453515 seconds. The three separate observations therefore do not follow the three measured clauses:

| State | Current visual switch | Measured corresponding clause | Lead |
| --- | ---: | ---: | ---: |
| `misses both` | 522.961743187 | `disagree with both,` starts 523.809453515 | 0.848 s early |
| `cannot choose` | 523.945163842 | `or be too uncertain to choose.` starts 525.155453515 | 1.210 s early |

This causes the graph to display the uncertainty example while the narration is still describing disagreement with both predictions. The states themselves are scientifically clear; their delivery is mismatched. Required repair: separate exact measured phrase gates for the three possibilities, retaining each state until the next relevant clause. Keep text and audio unchanged. The retained audio-pacing cue packet is immutable; any new visual cue packet must be recorded separately as root directs.

Targeted evidence: `poses/phone-E11-08-outcomes-0.15.png`, `poses/phone-E11-08-outcomes-0.5.png`, `poses/phone-E11-08-outcomes-0.9.png` and desktop equivalents. Focused native captures corroborate the early states: the active player was following at 523.111389 seconds with `misses both` visible and at 524.218278 seconds with `cannot choose` visible, before the corresponding clause onsets. The native clip recorded no browser errors.

### 2. Withheld-data status obscures a prediction

At the completed `fit` state, the opaque `data held aside` rectangle covers part of the green later prediction on both desktop and 360 px. The instructional distinction needs predictions visible before observations are revealed. Required repair: position the status outside both prediction paths, preserving the complete comparison.

Evidence: `poses/desktop-E11-08-fit-1.png` and `poses/phone-E11-08-fit-1.png`.

### Small layout polish

At 360 px in E11-07, the `one orientation` selection rectangle around grain A slightly intersects grain B's left edge. Separate the unrelated grain from the selected region or tighten the A boundary. Evidence: `poses/phone-E11-07-single-1.png`.

## Bounded positive findings

The recipe versus growth-rule introduction retains its teaching-example qualifier. Boundary and cell representations actually expand; flat faces and branch absence are visibly contrasted. M1/M2 changes remain policy assignments. Grid refinement preserves a fixed physical ruler. The alternating-speed example retains the starting outline and advances the planes outward; it does not shrink old solid. The two-direction tip inset remains connected and proposed. The history example preserves its old column. Final branching, selected face and layer spread keep identity and earn the concluding return to prediction and measurement. Captured visual holds and Still states reveal no answer-specific emphasis early.

## Repair recheck

Closed on the rebuilt full website v2 at `http://127.0.0.1:5252/episode-11`, frozen directory `export/series-final-batch-round2-site-v2`.

- `export/e10-review-e11-round2/recheck-v2/review.json`: 38 targeted desktop/360 px captures, all inspected, with no runtime, seek or overflow errors. Both sides of all three exact clause onsets were checked in motion and Still. Before each onset the previous state remains; after it the corresponding next outcome appears. Both original prediction holds remain unresolved in motion and Still.
- The status now sits above the graph, so both complete prediction curves remain visible before observations appear. The grain-A selection is separated from grain B at phone and desktop widths.
- `export/e10-review-e11-round2/native-outcomes-v2/review.json`: a fresh actual 1× following passage confirms `distinguishes` at 523.536586 s, `misses both` at 524.130474 s and still at 524.930810 s, then `cannot choose` at 525.502180 s. These states now agree with the measured clauses rather than arriving early. All five captured native states were inspected; no browser errors were recorded.
- Spoken source, final audio, measured score and original prediction holds are unchanged. Root retained the revised visual cue packet separately from the immutable audio-pacing input; its final binding manifest is `docs/series-narration/final-batch-review-2026-09-21/final-visual-cue-bindings.json` in the website repository.

Both required findings and the selection-box polish are repaired and independently rechecked. No new required finding emerged from the bounded recheck.
