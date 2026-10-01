# Plan — closing Episode 12 and finale repairs (audio held)

- **Phase:** Maker-directed Journey/media; no scientific phase or gate change
- **Status:** done for the authorized scope (local preview on; recording, release and listening are
  separate maker decisions)
- **Started:** 2026-09-29
- **Last touched:** 2026-10-01 by Claude Opus 5.5 (Claude Code)
- **Authorization:** after a verified finale audit found that E11 does not close the chapter 1–13
  science convincingly, the maker wrote: “i feel we can create a closing episode that revisits all
  episodes and like a summary recap of all episodes, and then you can add the opening for what's
  next.  please also do all the fixes, hold off on redoing audio”
- **Later direction (2026-09-30):** asked how Episode 12 should be enabled, the maker chose the
  local preview: “I build E12's real player and turn it on in the local site only, with the Mac's
  Samantha voice clearly labelled provisional, after the repairs finish. The public build keeps E12
  held, and there's no paid audio.” The player is therefore built now; the provisional narration
  is an untracked local install, never the production narration path, and every public-build
  branch folds it away.
- **Checkouts:** authority `snowflake` / `explore/film-part1-plan` at `6c99e19`; website
  `snowcrystal_website` / `codex/series-first-batch` at `2e79e9b`. The website worktree carries
  someone else's uncommitted E02 edits (`scripts/episode-two.test.mjs`, `src/series/episodeTwoCues.ts`,
  `src/series/episodeTwoDrawing.ts`, `src/series/series-diagrams.zh-CN.json`, last modified
  2026-09-21). They are independently owned: never edit, stage, commit, revert or rely on them.
- **Baseline before any change (2026-09-29):** 17 focused website test files, 150 tests, 149 pass.
  The one failure, `series-localization.test.mjs` “Chinese display copies retain English source
  identity…”, is caused by the foreign `series-diagrams.zh-CN.json` edit no longer matching its
  authority mirror; it is pre-existing and not this work's to repair.

## Goal

Give the chapter 1–13 series a real ending and a doorway to Part Two. A new closing episode, E12,
revisits every episode as one visible causal build, states what is settled, what is a leading
proposal and what is open, and then opens the next story: the project that tries to build a model
of snow-crystal growth that is allowed to fail. E10 and E11 receive the verified audit repairs.
Nothing is recorded: every spoken change is staged so that one later, explicitly approved recording
step can promote it, while the current recorded E10/E11 keep playing correctly.

## Done when

1. `docs/video/science-series-e12-script.md` exists in the modern script shape (scenes with
   narration, visual/source notes and the teaching-beat worksheet; substantive reader; source
   dispositions) and has passed a non-author source review with every substantive finding repaired.
2. `docs/video/science-series-e10-script-pending.md` and `…-e11-script-pending.md` contain the
   repairs listed below, reviewed the same way. The recorded scripts stay byte-identical.
3. The website has E12 content, cues, drawing, stage and rehearsal entry; a held catalog card;
   held route/public-build rules; and E11/E10 footers that describe the new order. The E10/E11
   pending revisions are imported under `docs/series-pending/` and rehearsable.
4. A draw-call snapshot test proves the production E10/E11 drawings are unchanged by any new
   pending-only visual. The public build contains no E12 or pending text.
5. Complete local-voice (`say`, Samantha) 1× rehearsals of E12 and of pending E10/E11 reach natural
   end, and a non-author review of chronological captures finds no unrepaired substantive defect.
6. Focused tests, TypeScript and both builds pass, with any failure caused by the foreign E02
   edits identified as pre-existing. No paid synthesis request was made.
7. Ch14's opening no longer says curve crossings decide tall versus wide, after one independent
   adversarial check (Rule 13, proportionate under decision 0049).
8. Reviews, PROGRESS, website `docs/science-series.md` / `docs/adding-an-episode.md` and this plan
   record what was done, what was checked and what was not. Commits exclude the foreign E02 files.

## Approach

### E12 — the closing episode

English-only, like E10/E11. Working shape (the author may merge or split scenes where the argument
needs it):

1. **Bookend.** Return to E01's opening subject, a shrinking drop beside a growing crystal, now
   labelled honestly as a computer-grown model where it is one. Ask how much of this crystal eleven
   investigations can now explain. Open in fresh wording: the public leak probes read E12's first
   two scenes, so do not quote earlier episodes verbatim there.
2. **Revisit every episode as one causal build** on one continuing E12 crystal that never resets:
   seed and material relay (E01) → six directions (E02) → delivery and depletion (E03) → the flat
   face (E04) → corners lead and branch (E05) → the shape map as a question (E06) → retained history
   (E07) → measuring a face (E08) → inferring its response (E09) → the narrow rim (E10) → what would
   count as an explanation and the proposed test (E11). Each episode is recalled by selecting a
   feature on the continuing crystal and showing a linked callback drawn by that episode's own
   exported drawing function with a synthetic cue, labelled “Episode N · title”. No live cue
   functions or narration imports; at most one WebGL recording (bookends only).
3. **Settled / leading proposal / open ledger,** with the E06 plate/column question answered as far
   as the sources allow. Wording comes from the vetted ledger (see Sources).
4. **Why it is still open,** and the human close: a tiny field, hard experiments, careful looking
   still counts, “we do not know” as a scientific position, and a practical invitation to look.
5. **What's next:** the project behind the series, described in the third person with its honest
   status; the question the next story asks; no dates, no chronology, no spoken score fractions.

### Pending E10/E11 repairs (spoken, staged)

- **E10-01:** tie the broad-face discrepancy back to E06's map (the series returns to the shape
  question here), and name the broad-face curves once as part of what their author calls the
  comprehensive attachment kinetics model. Keep the `discrepancy` phrase or re-key it.
- **E10-05:** the exact positions, widths and depths of the dip windows were chosen so the account
  matches the shape map, so matching that map later is not an independent test; the reduction
  regions near −4 and −14 °C have separate model-based support. The mechanism needs top and side
  faces to become disordered differently near melting, which molecular simulations have not
  confirmed (they may not be sharp enough to see it). Keep `trail` and `notlocation` phrases.
- **E10-09:** close E06-09's promise explicitly: this is the leading proposal for why the faces
  trade places; for one face near −14 °C the forward estimate lowers the barrier to about half
  while experiments suggest about a tenth. Change the `next` handoff: E11 is no longer the final
  episode.
- **E11-02:** the computer-grown crystals shown in the series come from this kind of cellular rule,
  run by the project behind the series; their settings were chosen, some by eye, to make those
  shapes, and they contain no temperature. Resemblance, not a tested prediction.
- **E11-09:** close E11's own question (resemblance, reconstruction, mechanism, prediction), name
  the concrete proposed test (a hollow crystal's rim after a recorded supply drop), and hand off to
  E12. The series-wide recap, the “sleeve” image and the method-only last line move out.
- Readers and source dispositions updated to match (premelting caveat now spoken; in-sample status;
  deferred topics given explicit dispositions).
- **Visual-only now:** E10 footer kicker no longer says “final”; E11 footer shows Episode 12 as
  the next episode, “Coming soon” while held.

Staging follows the website mapper's option (b): separate `-pending.md` authority files imported
into `docs/series-pending/eNN/{content.json,cues.json,manifest.json}` (outside `src/`), with
`--pending`/`--content`/`--cues` options for import and the two rehearsal tools, a Vite redirect of
the rehearsal entry's JSON imports, and a `narrationHeld` config guard that refuses paid generation
for E10, E11 and E12 before credentials are read. New E10/E11 visuals are gated on reveal keys that
exist only in the pending cues. Promotion later: copy pending bytes over the canonical script,
reimport, move cues, dry-run then (only with approval) `generate --reuse --expect-new`, pace with
`--replace-live`, audit.

### Sources the authors must use

Mapper reports retained with this work (website `docs/series-closing-episode-2026-09-29/`):
tooling recipe, visual-reuse assessment, E01–E06 and E07–E11 recap inventories, the settled/open
ledger and the what's-next constraints. Load-bearing corrections they established:

- “Recovers about half” is wrong. Half and one tenth are two estimates for the same prism facet
  near −14 °C (forward mechanism versus model-based inversion of experiments).
- “CAK” names the whole comprehensive attachment kinetics package, not only its broad-face curves.
- “Measured surface physics” overclaims the project: its inputs are source-tabulated, fitted and
  model-inverted parameterizations plus a few hand-chosen, map-informed choices (ch14).
- Do not state temperature band boundaries or a plate–column–plate–column alternation; E06
  narrates only “near five below: long forms; near fifteen below: flat, branched”, and the cold end
  has been revised. Do not repeat ch13's “two dials” or “everything under that skin is in hand”.
- Do not repeat “nothing has photographed it a molecule at a time” or “pure cubic ice never
  observed”; use the narrow wording in the ledger.
- The library crystals and Run B are unvalidated `GGThreshold` (Gravner–Griffeath) model output;
  every Nakaya score comes from the other operator. Do not merge them. Do not mention Phase 10.
- A synthetic voice never speaks as the maker (MEDIA-SPEC): no first person for the project.

## Steps

- [x] Commit this plan (authority) before implementation (`9b52994`).
- [x] Author E12 script; author E10/E11 pending scripts; draft the Ch14 fix.
- [x] Round 1: non-author adversarial source review of all three scripts (Rule 13) plus an
  explanation/arc review; apply every substantive finding; record the review
  ([review](../reviews/science-series-closing-episode-round1-2026-09-29.md)). E12 then tightened
  from 2,375 to 2,048 spoken words (about 14 minutes) with every recap and hold kept.
- [x] Website tooling: config (E12, `narrationHeld`), import `--pending`, rehearsal `--content` /
  `--cues`, preproduction redirect; draw-call snapshot baseline written from unmodified code
  (`2e79e9b`) with a passing negative control (one-character colour change alters the hash).
- [x] Website E12: content import, cues, drawing (continuing crystal + callbacks redrawn by each
  episode's own drawer), stage, rehearsal entry, held card/route/public rules, tests.
- [x] Website E10/E11: pending imports, pending-only visuals (in separate modules registered only
  by rehearsal entries), footers, tests, public-build leak guard.
- [x] Rehearsals: local-voice scores; full 1× frozen-stage runs for E12 and pending E10/E11;
  desktop, 360-px and Still pose captures; contact sheets.
- [x] Round 2: non-author performance reviews, repairs, Rule 13 audit of new spoken text,
  independent confirmations (desktop and phone both judge that the series now ends); see the
  [Round 2 review](../reviews/science-series-closing-episode-round2-2026-10-01.md).
- [x] Ch14 fix with its independent check; `npm run education:verify` passed on 2026-09-30.
- [x] Local preview (later direction): E12 player on in local builds only, provisional voice
  labelled, public build excludes it; live player and E11 → E12 transition checks pass.
- [x] Verify: focused tests, TypeScript, `npm run build`, `npm run build:public`, snapshot proof.
- [x] Record reviews, docs, PROGRESS; commit both repositories. At the maker's direction
  (2026-10-01) the four pre-existing E02 files are committed separately from this work, and both
  branches are pushed. Website `codex/series-first-batch`: `f099108` (this work; its exact tree
  passed TypeScript, both builds and 332/332 tests in a temporary clean worktree, since removed)
  and `f7dcb53` (the earlier E02 exploded-view edits, which reintroduce the localization mirror
  failure until the authority mirror is updated). Authority `explore/film-part1-plan` fast-forwards
  its remote. Pre-push audit (non-author): no secrets, nothing over 1 MB, no ignored or provisional
  files, Rule 7 clean. Worktrees: only the primary checkouts remain; no backup branches.

## Out of scope

- Any paid narration request, pacing of new audio, or promotion of pending revisions.
- A public E12: its release flag stays false and the public build excludes it entirely. (Superseded
  in part on 2026-09-30: the player, home mount, `?e12=preview` key and E11's Continue now exist
  for local builds only, driven by a labelled provisional local voice; see the later direction.)
- Mandarin for E12 or the E10/E11 revisions.
- E09 spoken edits. The audit's E09-01 signpost is repaired where the series returns to the shape
  question (E10-01) and in E12's recap, because an E09 sentence would also require a Mandarin pair,
  a Mandarin cue-source edit and a translation re-stamp for an episode whose Mandarin is held.
  E09's title is unchanged; retitling is a maker identity decision.
- E01 and E06 spoken edits (both bilingual; E01 is public). The sleeve callback is replaced by an
  E12 bookend to E01's actual opening image.
- Deployment, publication of E05–E12, physical-device testing, human listening and learner tests.
- Book chapters other than the single Ch14 contradiction.

## Tried and rejected

- **Ch14 first fix “Somebody tried, with … M1”.** Accurate about M1 but contradicted the
  chapter's own headline arm (broad-facet curves with dips off); replaced after Round 1.
- **Education verifier under load.** A full `npm run education:verify` run on 2026-09-29 passed
  its ten pre-browser checks, then timed out loading the offline profile page while two rehearsal
  workflows held the load average near 160. Rerun when the machine is idle before claiming a pass. **Rerun 2026-09-30: passed** (197 checks,
  all 149 negative controls rejected, exit 0).

- **Agents across machine sleep.** Long workflows died twice when the Mac slept (stall detection
  after 3 minutes without progress). Keep the machine awake (`caffeinate -ims`) for the duration
  of a run and stop it afterwards.
- **Reviewing hundreds of single screenshots in one agent.** Image-heavy reviewers stalled; contact
  sheets (PIL) plus at most ~40 individual images per agent worked.
- **Headless real audio for full runs on this Mac.** Chrome's audio clock stalls; final runs use
  `HEADLESS_FAKE_AUDIO=1` and say so. That checks timing, not sound.
- **Pending visuals inside released modules.** Pending-only strings would ship (unrendered) in the
  public E10/E11 chunks; moved to separate pending modules behind empty hooks.
- **Revising E10/E11 authority scripts in place.** Tests bind content, narration and authority
  bytes by SHA-256, `narratedBeats` throws on paragraph-count changes and missing cue phrases throw;
  production would break until new audio exists.
- **Driving earlier episodes' live cue functions inside E12.** Pulls about 344 KB gzip of narration
  into the E12 chunk and couples E12 to recordings that are about to change. Synthetic cues instead.
- **Nesting earlier Stage components.** They inset by window width (`innerWidth > 800`), not
  container, and each owns a tick loop and possibly WebGL.

## Open questions

- Maker: whether the eventual recording pass should also re-pace unchanged takes (no provider call)
  if reader-only edits are later made to recorded episodes.
- Maker: whether E12's what's-next should link to the book's Part Two, a future video series, or
  both. (The local footer currently says “Continue reading: Part Two” and links Chapter 14.)
- Maker: approve the recording pass (E10-01/05/09, E11-02/09, then E12) and listen; recheck the
  1.2–1.8 s timing margins against measured alignment at promotion.
- Maker: watch E12 once as an audience member (local preview) and decide on public release, which
  also needs E05–E11 public first.
