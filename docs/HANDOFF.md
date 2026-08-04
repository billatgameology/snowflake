# Handoff — Phase 6 maker redirect: cut to the final campaign (2026-08-03)

This is the manually triggered cold-start pointer. Current state belongs in `docs/PROGRESS.md`; the
maker's 2026-08-03 direction is recorded verbatim in the active plan's **Governing direction**
section and supersedes all prior resume points, including this file's previous version.

## Resume point

Phase 6 is incomplete. Do **not** resume the WP1 eight-control batch preflight, its half-migrated
schema-v2 state, or any part of the v4/V4.x search-register/publisher/control-batch apparatus. The
maker closed that line on 2026-08-03: it is preserved rejected history, not open work. Its open
review findings (worker/launcher authentication, 58-role enforcement, junction/reparse refusal,
and the rest) are attacker-class or apparatus-internal and are dispatched by the direction's
threat-model ADR, not by further implementation.

Read in order:

1. `docs/phase6-lessons.md`.
2. The maker's 2026-08-03 direction in
   `docs/plans/phase-6-science-first-completion.md` (Governing direction).
3. `docs/PROGRESS.md`, especially **Next step** — it lists the immediate actions in order.

Summary of the direction: threat model is sloppiness (accidental error, crash, environment drift),
not malicious attacks by the author on their own research; attacker-class findings close by one ADR
as a named class. One proportionate non-author review per unit; a unit failing review twice
escalates to the maker with options. Held-out validation (all four families) and the preview GPU
cohort are deferred past Phase 6 by ADR + charter amendment with named owners. The final campaign
keeps three arms (CAK, M1, `M1_NO_DIP_ABLATION`). Push `main` once ADR 0041 lands canonically and
exact `npm test` is green (maker-authorized).

## State to preserve

The isolated clone `research/tmp/recovery/wp1-v42-control-execution-author/` (branch
`codex/wp1-v42-control-execution`, base `ed2d6e75970cf3284c26378c87e5445ac8ec3eb4`) is preserved
as-is as rejected history, including its non-compiling schema-v2 checkpoint; do not complete,
clean, or delete it. The live root remains branch `main`, HEAD
`62c0f0220e47287372d8d4772488dfcfc0a6325a`, with intentional dirty/untracked entries — do not
clean, absorb, or revert it. No project evidence process or long run is active. Preserve
`research/tmp/`; publish scientific data only through the reviewed `evidence/` path.

## Next actions

Follow `docs/PROGRESS.md` **Next step** exactly: land ADR 0041 canonically; restore exact
`npm test` green on the live root (progress-index date pin and compaction budget included); author
the three direction ADRs with verbatim charter quotes per Rule 5, amending the charter in the same
session; push `main`; then the narrowed WP1 size-strata freeze; then WP2 ladder pre-registration →
registered ladder execution → WP3 freeze → WP4 R15 implementation → WP6 three-arm campaign →
WP8 gate.

Science integrity takes priority over runtime, under the 2026-08-03 review-depth cap. During
normal development, update `docs/PROGRESS.md` normally; reduce unsolicited status to at most
hourly only during an actual 2+ hour run.
