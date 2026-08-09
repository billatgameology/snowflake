# Plan — React experience as a Journey media source

- **Phase:** Maker-directed exploration, outside Phase 6 scope
- **Status:** in progress
- **Started:** 2026-08-09
- **Last touched:** 2026-08-09 by OpenAI Codex

## Goal

Extend the Snow Crystal Journey documents so a React-coded page, interactive, model viewer, or
educational scene can serve both as a web experience and as the exact visual source for demo,
animation, still, and preview derivatives. Preserve a simple creative workflow while retaining the
source build, state, capture recipe, provenance, accessibility, and artifact relationships needed
to understand or reconstruct a video later.

## Done when

- `docs/journey/MEDIA-SPEC.md` distinguishes real-interface demos, frame-controlled animations,
  and hybrid videos, and defines a presentation/capture mode plus its archive metadata;
- `docs/journey/NUMBERING.md` explains when a capture stays a derivative and when a separately
  scripted video receives its own artifact identity;
- the Journey overview and five-entry sample make the React-source relationship visible without
  implying that any capture tooling or media already exists;
- the addition preserves the existing accessibility, provenance, correction, and reconstruction
  rules; and
- `docs/PROGRESS.md` records the new planning state and its operational limits.

## Approach

Treat the approved web experience as a reusable visual source, not as a disposable screen to record
informally. Record the exact source release and entry snapshot, frozen data/state, viewport,
browser/capture environment, timeline or interaction recipe, and output relationship. Use dedicated
9:16 and 16:9 presentation layouts when needed instead of assuming one crop can carry every piece.
Keep the audience-facing rule simple: a video demonstrates or animates the experience but never
becomes interactive merely because it came from the website.

## Steps

- [x] Inspect the Journey overview, media, numbering, sample-week, and progress records.
- [ ] Add the React-source and presentation/capture-mode rules to the media specification.
- [ ] Add source/derived identity and reconstruction rules to the numbering specification.
- [ ] Apply the rule to the overview and existing fictional sample week.
- [ ] Perform a skeptical consistency review and repair any ambiguity.
- [ ] Update `docs/PROGRESS.md` and run the documentation checks.

## Out of scope

- Writing React, capture, animation, browser-automation, or video-rendering code.
- Selecting or installing a capture framework, plugin, browser, codec library, or hosting service.
- Creating or rendering a real website, animation, still, or video.
- Claiming pixel-identical output across browsers or machines without a future measured test.
- Changing education, solver, evidence, charter, or active Phase 6 implementation records.

## Tried and rejected

- **Treat every recording as the interactive itself.** Rejected: a viewer cannot operate a video,
  and the archive must distinguish the web experience from a linear demonstration.
- **Use one horizontal capture and crop it everywhere.** Rejected: controls, labels, fields, axes,
  and scientific status can disappear or become unreadable in a blind vertical crop.
- **Call a browser recording reproducible because the source is code.** Rejected: build inputs,
  data, timing, fonts, viewport, browser behavior, and capture settings can all change the result.

## Open questions

- Which future capture or frame-rendering tool best fits the project once implementation begins.
- Whether the first production trial should compare real-interface capture, frame-controlled
  animation, and a hybrid cut from the same React experience.
