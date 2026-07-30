# 0034 — Correct erratum E1's justification, and correct ADR 0033's "preserved hash" claim

- **Date:** 2026-07-29
- **Status:** accepted

## Charter impact

None — and this is the first ADR for which that is true *because of* an amendment rather than in
spite of one. §3.2 Phase 6 item 1 as amended by ADR 0033:

> "Any post-freeze edit to a registered **value** requires a logged ADR and invalidates prior sweep
> results — the full sweep re-runs. Any post-freeze edit to a registered **justification** requires
> a logged ADR and invalidates nothing, provided the values hash is unchanged by it."

This ADR edits a justification only. `PHASE6_VALUES_SHA256` is **unchanged** at
`879e069f612f1c6b4b40074d5cc890419fc17f09545dc27b2c8823d7667938f6` — verified by recomputing the
values manifest after the edit. So no sweep is invalidated and no re-run is owed. The arm-1
evidence stands.

## The correction

`docs/phase6-protocol-errata.md` E1 recorded that the `t-sigma-grid` freeze row's `source` string
justified the σ-axis upper bound with a claim that is false for the registered parameter set.

**Old:**

> "…and toward f = 0.90 the basal/prism contrast compresses from 0.34–3.76 to 0.84–1.25."

**New:**

> "…and above 1x water saturation sustained supersaturation nucleates droplets, which changes the
> boundary condition around the crystal (2109.00098v1 p9)."

**Why the old text is wrong, measured.** Those figures are `CAK_A1` values, and ADR 0031 registered
`CAK`. Computed over the registered T axis with `alphaHK(basal)/alphaHK(prism)` at
σ∞ = f · `phase6SigmaWaterFromTable(T)`:

| parameter set | f = 0.15 | f = 0.90 |
|---|---|---|
| `CAK_A1` | 0.34 – 3.75 | 0.84 – 1.25 |
| **`CAK`** (registered) | **1.20 – 3.75** | **1.06 – 5.05** |

Under `CAK` the contrast at f = 0.90 is **wider** than at f = 0.15. The claim does not lose
precision, it **reverses** — so it cannot justify anything, let alone an upper bound.

**Why the new text is defensible.** It is a ground the row did not previously give, and it is
sourced: `2109.00098v1` p9 states that "rapid nucleation of water droplets whenever the near-surface
supersaturation exceeds 𝜎_water … mak[es] it quite difficult to examine ice growth behaviors on
substrates with 𝜎 > 𝜎_water". That is why Libbrecht's own high-σ observations use free-standing
needles, and it is a real reason a cloud-conditions grid stops at 1× water saturation.

**What is unchanged.** The registered grid — 34 temperatures × 6 fractions, f ∈ {0.10, 0.15, 0.25,
0.40, 0.60, 0.90} — is untouched, as is every executed result. The row's other justification for
keeping the top row ("weak facet contrast is not weak habit variation") never depended on the
compression figure and stands as written. Erratum E1 is closed by this ADR; E2 was already
corrected in place, being an unhashed comment.

## Correction to ADR 0033

ADR 0033 §3 said the legacy combined hash would be "**PRESERVED**, not retired" and "must still hash
to `8aeb2b80…`, pinned by test". **That was over-strong, and this ADR is what falsified it.**

The combined manifest contains prose by construction, so the first ADR-logged justification
correction necessarily moves it: `8aeb2b80…` → `2b94aa5f…`. "Preserved" and "prose is correctable"
cannot both hold of the same hash. ADR 0033 asserted a durable invariant where only a
commit-relative one exists — the same species of over-strong claim Rule 6 was written for, one ADR
after the rule landed.

**Corrected mechanism:**

- `PHASE6_PROTOCOL_SHA256_AT_ARM1_EVIDENCE` records `8aeb2b80…` as a **historical** value. It is
  reproducible by checking out `390fe35` — the commit `out/phase6-sweep/report.json` names — and
  computing the combined manifest there. It is **not** reproducible at HEAD, and does not need to
  be: evidence is verified against the commit that produced it.
- `PHASE6_PROTOCOL_SHA256` tracks the current combined value, with both entries in
  `PHASE6_PROTOCOL_REVISIONS` and the arm-1 value labelled as the one the evidence cites.
- **`PHASE6_VALUES_SHA256` is the hash that must hold across prose corrections**, and it did. That
  is the invariant ADR 0033 should have claimed.

The test was rewritten to assert what is actually true: that the cited value remains in the revision
history, that the current pin matches, and that the values hash survived the edit.

## Consequences

**The two-hash scheme is now exercised end to end, on a real correction rather than a synthetic
one.** A wrong justification was fixed, the values hash held, and no compute was spent. That is the
mechanism ADR 0033 bought, working.

**Verified after the edit**, named exactly: `npm run typecheck` PASS; `npx vitest run` on the three
Phase 6 suites 75/75; `app/scripts/phase6-wp5-independent.mjs` still re-derives all 204 points and
PASSES against unchanged artifacts. Exact `npm test` remains RED on the delegated
`docs/education/**` Rule 7 violations.

**Forecloses.** Claiming a hash that contains prose is durably stable. Verifying published evidence
against HEAD rather than against the commit it names. Carrying a known-wrong justification because
correcting it looks expensive — it is now cheap, and the errata file is for things that cannot yet
be fixed, not a place to park them.

## Alternatives considered

**Leave E1 as an erratum now that its determinism justification is measured.** Rejected. The maker's
instruction closed the *question* of whether the erratum's reasoning was sound, not the defect
itself. With ADR 0033 landed the fix costs nothing, and a frozen artifact that still contains a
reversed claim is worse than one that never had the error, because a reader who does not find the
errata file is actively misled.

**Also correct the other 24 rows' justifications pre-emptively.** Rejected as unscoped: the audit
checked one row because a related claim failed, and no basis exists for asserting the others are
wrong or right. They are unaudited, which is now stated in `docs/phase6-protocol-errata.md` rather
than implied.
