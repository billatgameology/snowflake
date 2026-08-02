# Plan — Phase 6 SDAK arm: in-sample reproduction sweep

- **Phase:** Phase 6 — Validation against the Nakaya diagram (SDAK arm; ADR 0030)
- **Status:** superseded; do not execute. ADR 0030 was never accepted; use
  `phase-6-science-first-completion.md`; its interpretation amendment was accepted in decision 0040.
- **Started:** 2026-07-28 (drafted)
- **Last touched:** 2026-07-28 by Claude Fable 5 — initial draft at the maker's direction

## Goal

Historical goal (withdrawn): test whether M1 changes the failed CAK Nakaya comparison.
This is the charter's scheduled SDAK arm (§3.2 Phase 2b "SDAK last, and gated"; §3.2 Phase 6
separate reporting), and ADR 0005 fixes its epistemic ceiling in advance: with P3 inputs
active, matching Nakaya is in-sample reproduction, never independent validation. CAK→M1 is
confounded and is not decisive about the dip factors; no priority claim is supported.

Provenance correction (accepted ADR 0040): the M1 source prints the algebra but leaves `log`
unspecified. This project classifies the exact Nakaya-informed prescription as P3 and resolves the
base as 10 through a separate, Figure-1-width-supported P4 transcription choice. P3 is the project's
provenance classification, not a label printed by the source. The historical
all-P3/direct-transcription wording below is not current.

## Done when

Charter §3.2 Phase 6, verbatim: "Done when the model's temperature-vs-supersaturation
morphology diagram is compared against Nakaya's, with the agreements and the disagreements
both stated." For this arm specifically, operationalized: the SDAK-active sweep runs under
its own frozen protocol, its diagram is reported beside — never merged with — the no-SDAK
diagram, every SDAK-vs-Nakaya agreement is labeled in-sample, and the registered expected
result (S2) is confronted with the outcome explicitly, hit or miss.

## Approach

Additive, oracle-only, pre-registered. A new coupled surface policy (`aggregate-hv-sdak-v1`)
implements width-dependent kinetics on the CPU oracle; SDAK inputs live in a separately
frozen, separately hashed annex transcribed from printed closed forms (arXiv:2306.13087
dips, verified in-repo at `21bff19`; arXiv:2306.04042 SDAK-2 branches, verification is S0);
the facet-width query is built on integer lattice invariants under the ADR 0023/0024 D6h
rule; the expected result is derived from a 0D/1D analysis and committed before any 3D sweep;
and the sweep itself runs under a new frozen protocol only after the running no-SDAK sweep
terminates and publishes. Everything the running sweep depends on is territory this plan may
not touch (ADR 0030 §5).

## Steps

- [ ] **S0 — Verify arXiv:2306.04042 in-repo** (Rule 12 / stretch-register discipline):
  obtain the paper, verify the SDAK-2 two-branch (A, sigma_0) table against its printed
  pages, record SHA-256 and page cites in `research/`. No sweep-reported number enters the
  annex unverified.
- [ ] **S1 — The SDAK annex**: new file beside `docs/libbrecht-parameters.md` (which stays
  byte-unchanged), every entry P3 with equation/page citation, canonical units, the
  percent-vs-fraction guard restated, content hash registered in the test suite, and the
  Rule 12 currency check recorded in the freeze. Check: suite fails on any annex edit.
- [ ] **S2 — Registered expectation**: 0D/1D facet-competition analysis from the annex forms
  across the registered temperature axis; commit only the equal-field coefficient-order diagnostic
  and its limitation before any 3D SDAK run. Check: withdrawn by the current correction and addressed by accepted decision 0040; referenced by
  the protocol before S6.
- [ ] **S3 — Facet-width query**: local width measurement over surface cells, keyed to
  integer invariants only; D6h bitwise regression at the largest admissible fill-CFL plus a
  negative control proving the regression detects an order-dependent variant. Check: both
  tests green, and the negative control fails the broken variant by name.
- [ ] **S4 — `aggregate-hv-sdak-v1`**: the policy, with noise coupling inherited (noise
  multiplies alphaHK identically in boundary condition and fill), checkpoints naming the
  policy, v3–v6 bit-unchanged (existing regression suite), GPU entry points still refusing
  non-v5. Check: full root `npm test` green; v5/v6 fixtures byte-identical.
- [ ] **S5 — Calibration probes** at the WP3 conditions, labeled non-citable (Rule 11
  stamps anything off-configuration non-transferable). Check: probe records carry the label.
- [ ] **S6 — Freeze the SDAK sweep protocol** (new id, same machinery; scoring by ADR 0025,
  grid handling by ADR 0026), only after the running no-SDAK sweep has terminated and its
  evidence is published and recorded in PROGRESS. Check: freeze commit is an ancestor of the
  sweep's execution commit.
- [ ] **S7 — Run the SDAK sweep** (flagless, CPU oracle, parallel per-point processes).
  Check: exit status, per-point records, and artifacts under a fresh `out/` root that cannot
  collide with `evidence/phase6-sweep/`.
- [ ] **S8 — Report**: SDAK diagram beside the no-SDAK diagram, never merged; in-sample
  labels on every agreement; S2's historical proxy reported only as inadmissible; if morphology
  remains discrepant, any next intervention requires its own sourced, registered design —
  not an improvisation.

## Out of scope

- Applying `chi_0(T,P)` (registered follow-up F1 with its own expected result), the
  terrace-context classifier (F2), and surface diffusion (charter §2.6 exclusion).
- Editing `docs/libbrecht-parameters.md` or `runner/src/phase6-protocol.ts`; the broad-facet
  closed-form adoption remains a separate open maker decision.
- Porting SDAK to the GPU; any e-needle/Fig. 8.16 quantitative comparison (still gated on
  the column-seed ADR); any external publication (stretch register §4 gates apply).

## Tried and rejected

- **Broad-facet uncertainty-band conclusion** — the historical calculation concerns analytic input
  ordering, not a 3-D habit theorem; it does not close the forward-model question.
- (Append as the work proceeds.)

## Open questions

- ADR 0030 acceptance by the maker (this plan is inert until then).
- The pending comparison-target decision (`9a75b7c`): classical Nakaya only, or the
  2306.13087 quantified matrix alongside — affects S8's report, not S0–S7.
- The exact width-query definition (the charter's "attackable but unpublished" gap): S3 must
  choose, state, and version it as P4; a maker look at the candidate definition before S4 is
  cheap insurance.
