# Opening inspection and E01 follow-up review

## Verdict and scope

Ready for maker viewing, not human-listening or general-adult comprehension acceptance.
Website `explore/film-part1@725c69c`, from `4d7cc52`, implements the five requests under the
[plan amendment](../plans/explore-journey-science-series.md#opening-inspection-and-e01-follow-up--2026-09-17-planned-before-implementation),
committed before implementation in authority commit `b70658c`.

Root Codex agent owns implementation, browser QA and this record. Three shared-context
read-only agents reviewed runtime/source assets, scientific representation, and story/audio.
Exact model identities were unavailable. They did not act as uncoached viewers or listen to
the performance. No solver, evidence gate, publication, new episode or new export was run.

## Requested changes

- Removed the opening production sentence and scene-1 model badge. Sources retain the actual
  model's limitations; no validation claim changed. Scientific conditions remain local where
  needed to interpret the image.
- Large snowfall markers now use actual recorded growth volumes: the incoming Run B plus a
  rotating selection from the existing crystal library. The opening's ice-volume renderer,
  incoming recording and camera are reused. Hover enlarges; click/keyboard can pin/open;
  drag rotates, wheel/buttons zoom, and Reset/Escape/close are available. The decorative Hero1
  snowfall and standalone defaults remain separate and unchanged.
- Scene 3 introduces diameter first, then an upward, labelled resistance arrow below the
  descending drop, then rising-air streaks below/around the suspended drop. Grey airflow is
  distinct from white molecular tracers. Local chapter material and existing narration support
  the distinction: resistance slows settling; moving air can keep small droplets suspended.
  The internal split of the two clauses is editorial, not claimed word-level alignment.
- The final English paragraph now promises the next episode, asks what a flat plate and a
  branching star share, and ends “Why six?” The final English take was regenerated using the
  standing Juniper voice. Earlier matching takes were reused exactly.
- The [design guide](../video/science-series-design-guide.md) records useful versus redundant
  labels, directional/referent clarity, real-model inspection, and a forward closing question.

## Review-and-repair loop

Runtime review caught an incoming-renderer size/pose mismatch, a readiness gap, and an early
hover opening that could interfere with the handover. The incoming flake now shares the actual
load and authored camera coordinate; handover waits for its first draw, and it cannot open
until released. The export wait uses the visible layer's expected count, including the period
before IntersectionObserver mounts children; intentionally offscreen layers do not block it.

Browser inspection then caught a blank enlarged canvas after resizing and a stacking rule
that put the entire dark background over the title. Static viewers retain their drawing buffer,
and only the marker layer is raised. The repaired plate visibly rotates and changes size under
drag and wheel input. Short recordings are displayed after the growth-edge highlight settles;
the incoming Run B keeps its shared opening sample. No renderer or source geometry was edited.

The initial focused run found an obsolete expected word count after the hook rewrite; the
expectation was updated. A new motion test initially varied wall time instead of story progress;
it now tests the scene's actual reversible story-time animation. Neither was a production
failure hidden by loosening a scientific assertion.

## Verification and provenance

The website receipt `docs/series-opening-verification.json` contains the exact commands,
results, media identities and browser coverage. It records **64 focused tests passed, zero
failed**, and the Sites portable build (`tsc -b && vite build`) passed with the existing
large-chunk warning. Scope: E01 cues/drawing, reading, continuous playback, localization,
bilingual clocks, export contract and preserved sample audio. No full scientific suite was
required for these product-only changes.

Authority prose checks: `npm run lint:rule7` and `git diff --check` passed. A read-only
relative-link existence check passed for this review and the updated design guide.

Independent runtime review hashed every catalog asset and Run B against its expected digest;
the recorded binaries match. The original film, E02, earlier takes/masters and completed
Mandarin MP4 were not replaced.

New English revision: website `docs/series-narration/2026-09-17-e01-hook/paced-report.json`.
Independent reconstruction verifies only the last paragraph changed; the first ten take hashes
and timeline records are unchanged. Full decoding covered the English takes, raw/paced masters
and Mandarin master, with no decoder error or full-scale clipping. Active English master SHA:
`b1d02448dd1889612561626882b28576eb03616e19b662b0feb2575508daf8af`.

Mandarin words and audio remain unchanged under the English-only editorial scope. Its old
performed source remains explicit: `english-variation.json` registers the sole paragraph
difference, reconstructs the previous source identity, and rejects unrelated drift. The new
`semantic-hook-v3` clock maps the shared “Why six?” meaning without falsely matching the new
English lead-in to Chinese speech. Mandarin master SHA remains
`8cd202aa33c24971a4f207cda17088628f1f65f204e7f340277a83a8b0725ac1`.

## Browser coverage and limits

Root cold-reloaded after final drawing edits; checked the default viewport plus phone and wide
overrides recorded in the receipt. Sampled natural opening growth and completed title/snowfall;
inspected recorded plate, column and Run B; exercised keyboard open, drag, wheel, Reset and
Escape/focus return. Verified offscreen marker unmount, no opening production sentence, no
scene-1 badge, phone/desktop resistance and rising-air labels, the new master loaded in the
audio element, natural ending at “Why six?”, and paused English → Mandarin → English near
the ending without restart. Temporary viewport overrides were reset.

The final cold-load console window showed THREE.Clock deprecation warnings, no subsequent
errors in the retrieved window. Earlier warm-edit GPUCanvasContext errors are retained as
historical observations, not silently described as a clean session.

This was sampled browser QA, not uninterrupted complete viewing, frame-by-frame handover
capture, physical-phone/pinch testing or a newly rendered MP4. No human listening or independent
ASR was completed; source/character alignment and decode checks do not establish pronunciation
acceptance. Next: maker review of the same local series/E01 page, particularly inspection feel,
droplet readability and the final English delivery. Do not infer audience comprehension.
