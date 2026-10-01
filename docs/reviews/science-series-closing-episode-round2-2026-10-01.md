# Closing episode and finale repairs — Round 2 performance review, 2026-10-01

Scope: the performed explanation of the new closing Episode 12 and of the staged E10/E11 repairs,
reviewed on frozen rehearsal stages driven by a provisional local macOS voice (Samantha), plus the
local-only E12 player. Plan: [science-series-closing-episode.md](../plans/science-series-closing-episode.md);
Round 1 (scripts): [round 1](science-series-closing-episode-round1-2026-09-29.md). Every raw review,
plan, repair table and confirmation is retained in the website checkout under
`docs/series-closing-episode-2026-09-29/` (`round2-e10-e11/`, `pending-finalize/`, `round2-e12/`,
`round2-e12-repair/`, `round3-e12-finish/`, `e12-local-preview/`).

## Provenance and limits (Rule 10)

All builders, reviewers, repairers and confirmers were Claude Opus 5.5 subagents. Every review and
confirmation was by an agent that had not built or repaired the material it judged; all shared
the plan and the retained records, so these are non-author reviews with shared context, not
independent learner tests. Reviewers judged sampled frames (seeked poses and continuous-run
captures, latterly through contact sheets), not continuous viewing. Final full runs used
`HEADLESS_FAKE_AUDIO=1` because headless Chrome's real audio clock stalls on this Mac; they verify
timing and state, not sound. No human listening, no uncoached learner test, no physical-device
test and no paid recording exist. All timing margins are provisional-voice margins.

## E10/E11 staged revisions

- **Round 2 visual review** (non-author, changed scenes and their transitions, both viewports and
  Still): E10 13 findings (1 must-fix: the schematic broad-face curves crossed twice where the
  source has one crossing), E11 17 findings. All fixed or partly fixed in pending-only code; none
  needed a spoken change. Fresh full 1× runs and pose captures confirmed each repair.
- **Pending code kept out of released bundles.** Pending-only drawing moved into
  `episodeTenPendingDrawing.ts` / `episodeElevenPendingDrawing.ts`, registered through empty hooks
  in the released modules and imported only by rehearsal entries and tests. Canvas-operation
  hashes of the pending path were identical before and after the split, and all 586 (E10) and 548
  (E11) pose captures stayed byte-identical. A public-build `unreleased-text` leak guard with
  negative controls was added. Independent verification passed all seven checks.
- **Recorded productions unchanged:** a draw-call snapshot of the recorded E10/E11 (baseline from
  unmodified code) passes throughout; a deliberate one-character mutation changes its hash.
- **Visual notes synced** with the implementation; narration and reader text byte-identical.
  Sections to re-record when approved: E10-01, E10-05, E10-09; E11-02, E11-09.

## E12 Round 2

Three non-author reviews of the first complete performance:

- **Finale (“does the series end?”):** in the words yes, on screen not yet. Must-fix: the
  settled/proposal/open verdict was barely visible on a half-empty desktop stage; the science's last
  line ran straight into the project disclaimer with no pause. Ten should-fixes, including a
  ledger that underweighted what is settled, a missing Episode 1 sentence at the bookend, and drawn
  outline stand-ins where the opening crystal itself was meant.
- **Teaching (desktop):** two must-fix mislabels (“not yet measured” on the narrow-edge effect;
  outlines presented as the opening model crystal) and ten should-fixes (callback captions out of
  step with the words, a ledger that lost its content, final poses cut short).
- **Phone and Still:** two must-fix (no readable phone verdict; text below the 12 px floor) and
  further layout findings.

A repair lead merged these into 38 owned items (15 findings rejected or merged with reasons).
Spoken changes (net +57 words, narration now 2,105 words, about 13.6 minutes with the local voice):

- E12-08: the settled pieces now “let you read most of our crystal” (six arms because corners ran
  ahead into richer air; side branches scattered because nothing assigned them).
- E12-09: the answer to E12-01's question gets its own paragraph and names Episode 6's full scope
  (“Why it is so thin, and why the faces trade places: a leading proposal…”).
- E12-10: the frontier is tied to Episode 2's warning (“the step Episode two warned about”).
- E12-11: “The book these episodes are drawn from puts it this way…”; the bookend adds Episode 1's
  own next sentence, “They appeared as new water joined the ice.”
- E12-12: opens with the sign-off “That is what we know, and where it stops.” and adds “But this
  miss was scored by a rule written before the test ran, and the project kept it as its finding.”

**Rule 13 audit of the spoken changes** (non-author): all eight new or changed sentences supported
by quoted sources (ch13 `#why-bother`, `#working-hypothesis`, ch12 `#how-sure`, ch30 status, E01
recorded content). It found that an unchanged sentence the new one leans on was imprecise under
the pre-written scoring rule; “where the map has columns” became “where the map calls for columns”.
Leak-probe anchors and both prediction-hold answers are unchanged.

Other repairs: a larger desktop crystal with the empty panel used for the ledger trays and a
three-row answer card; authored silences of 3 s after E12-11 and 3.5 s after E12-12, honoured by
the rehearsal tool and both production pacers (all retained production scores unchanged); a real
still of Run B captured from Episode 1's own framing, labelled with the full model key; callback
captions retimed to their clauses; canvas text-size test on every frame.

**Confirmation.** Desktop: all 37 acceptance items pass, and the confirmer's verdict was “Yes. On
desktop the series now feels finished before the snowflake project begins.” The phone confirmer
was lost twice to machine sleep; a final pass rebuilt the confirmation from contact sheets: phone
and desktop both answered **yes**, with remaining items fixed in a loop (a clipped attribution, a
stale visual note, the model still's key now arriving with the image). A last polish pass fixed
a callback that sliced a card on shorter laptop windows (1366×768, 1280×752–798), title strips that
could clip, a 2.5:1 closing status row (now above 5.6:1), and small phone overlaps, each with tests
and renders at seven window sizes.

## Local preview

At the maker's direction, E12's real player is on in local builds only, with the provisional voice
labelled “Provisional local voice · not the recording” wherever a voice is named; the public build
contains no E12 chunk, provisional asset or wording, and E11's Continue reaches E12 only locally.
The installer refuses a stale or misattributed score and proves the named voice. Live player and
transition checks passed at 1280×800 and 360×780.

## Remaining before any release

Human listening and an uncoached learner check; the approved recording pass (E10/E11 changed
sections, then E12) followed by the timing recheck against measured alignment (several holds and
clause windows have 1.2–1.8 s margins); E05–E11 public first, because the E12 bundle carries their
canvas strings; and the Ch14 page verified live before E12's footer link ships.
