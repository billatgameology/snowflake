# Plan — Make Snow Crystal Journey media outlet-native

- **Phase:** Maker-directed Journey exploration, outside Phase 6 scope
- **Status:** done
- **Started:** 2026-08-10
- **Last touched:** 2026-08-10 by OpenAI Codex

## Goal

Replace the reuse-first social strategy with an outlet-native editorial strategy. One real Journey
event may supply a shared source package—research, code, captures, diagrams, renders, audio, and
transcript—but it does not presumptively supply one finished video for every destination. Short-form
feeds receive hook-first short stories; YouTube and selected Facebook placements may receive long
explainers; visual, conversational, live, community, direct, and owned destinations receive the
content form that fits their use.

Preserve the gapless public Journey sequence. Its required owned-page serial edition remains a
watchable navigation artifact, not a universal social master. A selected destination short may also
serve as that edition when it fits both jobs, but cross-platform reuse is an editorial decision, not
the default production architecture.

## Done when

- `docs/journey/SOCIAL-MEDIA.md` maps every retained destination to its native editorial role and
  clearly rejects automatic identical cross-posting as the strategy;
- `docs/journey/MEDIA-SPEC.md` defines the reusable source package, hook-first short grammar,
  long-explainer grammar, visual/carousel, conversation, live/community, direct, and owned formats;
- the media specification removes or narrows every clause that treats one clean 9:16 file as the
  universal finished deliverable, while retaining clean sources, native upload, accessibility,
  rights, provenance, correction, music, and platform-preflight rules;
- the canonical 15–59 second serial edition is explicitly scoped to the owned chronological index,
  carries an honest hook when it is an ordinary short, and is not forced onto social destinations;
- numbering makes distinct outlet edits reconstructable as distinct artifacts/releases/publication
  records without creating additional Journey numbers;
- the overview and fictional sample cannot be read as overriding the outlet-native policy; and
- a skeptical read-only audit finds no surviving universal-master contradiction in current Journey
  authority, followed by the planning-document checks authorized in `AGENTS.md`.

## Approach

Use four layers:

1. **Journey event and canonical entry** — the real chronological step and its owned record.
2. **Reusable source package** — the best available research, scripts, clean media components,
   captures, code/model states, editable diagrams, voice, transcript, and provenance.
3. **Editorial editions** — separately scripted and edited pieces for a selected outlet and purpose.
4. **Destination publications** — exact uploaded bytes/copy and their platform records.

Define native families rather than a universal derivative list:

- hook-first vertical discovery for TikTok, Shorts, Reels, Spotlight, and Weixin Channels;
- long explanation for YouTube, selected Facebook placements, the website, and localized Weixin
  Official Account treatment;
- visual sequencing for Instagram carousels and Pinterest;
- conversational field notes for Threads, X, and selected Moments;
- live/community participation for YouTube Live, Twitch, and later Discord;
- direct follow/digest editions for email, RSS, WhatsApp, and Telegram; and
- the website as the complete chronological and corrective record.

Hooks remain honest: show a visible anomaly, transformation, question, failure, or showcase
immediately; deliver the promised result in the same piece; do not use the series number as a
substitute for the hook or manufacture a cliffhanger. Long-form still needs a title/thumbnail
promise and strong opening, but not the compressed two-second grammar of a short feed.

## Steps

- [x] Audit current Journey authority and examples for universal-master assumptions.
- [x] Rewrite the channel strategy around outlet-native editorial families and a retained-channel
      matrix.
- [x] Amend the media specification's production flow, duration/hook rules, artifact packets,
      platform editions, and checklist.
- [x] Clarify numbering/reconstruction and mark the reuse-heavy fictional sample's editorial limits
      without rewriting its immutable example event ledger.
- [x] Update the overview and current-state index.
- [x] Run skeptical editorial and cross-document reviews, repair findings, and run the exempt
      planning-document checks.

## Out of scope

- Publishing, uploading, scheduling, or automating any destination.
- Rechecking numeric platform limits that were sourced on 2026-08-09; this amendment changes the
  editorial strategy, not the recorded compatibility facts.
- Writing the first real public script or assigning an `SCJ` number.
- Rewriting the fictional sample's event IDs, release transaction, or allocator/recovery exercise.
- Changing code, tests, the charter, an ADR, scientific specifications, evidence, education, or the
  active Phase 6 plan.

## Tried and rejected

- **One clean vertical master uploaded everywhere.** Rejected by maker direction: it optimizes the
  factory rather than the audience and makes every destination inherit short-feed assumptions.
- **One completely independent production per outlet.** Rejected: reusable research, captures,
  editable graphics, clean source media, audio, and provenance should still be shared.
- **Treat a Journey number as the opening hook.** Rejected: the identity helps sequence followers;
  it does not give a new viewer a reason to stop.
- **Remove the owned serial edition to solve the reuse problem.** Rejected for this amendment: the
  maker's gapless numbered watch-in-order requirement is independent of social distribution. The
  serial edition is narrowed to that navigation job instead.
- **Retroactively rebuild the fictional sample ledger.** Rejected: its purpose is schema and
  reconstruction testing. It will receive an explicit editorial-limit note; a future sample can
  exercise outlet-native production in detail.

## Open questions

- Which real Journey event should become the first side-by-side outlet-native production test.
- Whether a recurring long YouTube chapter should synthesize a fixed number of entries or follow a
  natural story arc.
- Which Facebook placements merit a long native explainer rather than a Reel, linked YouTube video,
  or group post.

## Review and verification record

### Round 1 — adversarial rewrite audit

- **Reviewers/model/context:** OpenAI Codex (GPT-5) subagents Turing, Rawls, and Lagrange. Each
  inherited the developer instructions and then received a bounded read-only audit assignment;
  they shared project/conversation context with the editing agent but did not author these changes.
- **Independently checked:** Turing traced reuse-first and universal-master clauses across
  `SOCIAL-MEDIA.md` and `MEDIA-SPEC.md`; Rawls mapped every retained outlet to a native content role;
  Lagrange checked `NUMBERING.md` and `SAMPLE-WEEK-01.md` for artifact/release/publication and replay
  consequences.
- **Limits:** text-only review. No platform fact or link was reverified, no account/composer was
  inspected, no media was produced, and no allocator, publication, or reconstruction was executed.

The round found the universal-master architecture, X-shaped Threads copy, combined
Instagram/Facebook treatment, ambiguous long-form master, and missing replayable source-package and
native-fit records. Those findings were repaired. The maker's retained owned serial requirement and
the decision not to renumber the fictional ledger were treated as fixed constraints.

### Round 2 — repaired-current-bytes audit

- **Reviewers/model/context:** the same OpenAI Codex (GPT-5) subagents, with the same shared
  developer/project context and targeted follow-up instructions.
- **Independently checked:** Turing re-read the current social/media specifications and found no
  remaining universal-master or long-form contradiction; Rawls re-read the current overview,
  media, and sample workload/feasibility boundaries and found no material editorial inconsistency;
  Lagrange re-read current numbering and found package, brief, native-fit, archive, replay, daily,
  and interim-manifest records internally reconstructable. Rawls also reported a clean
  `git diff --check`.
- **Limits:** semantic Markdown review only. The reviewers did not test native fit, accessibility,
  workload, platform behavior or policies, media output, implementation, publication, or restore.

### Local checks

- `git diff --check` — clean.
- `node scripts/lint-rule7.mjs` — `rule7: clean (497 files scanned)`.
- `npm test` — not run and not required: this change is limited to Journey/media planning Markdown
  and its direct plan/index/current-state links under the explicit `AGENTS.md` planning exception.
