# 0032 — How the cross-platform fixture points are chosen, registered before the sweep lands

- **Date:** 2026-07-28
- **Status:** accepted

## Charter impact

None. §3.2's numerical-verification controls require convergence studies at representative sweep
points and do not name the cross-platform control, which is a WP0c registration rather than a
charter clause. The freeze clause that governs edits does not bite either, because
`PHASE6_CROSSPLATFORM_FIXTURE` is **not part of `phase6ProtocolManifest()`** — the fixture is a
control artifact, so this ADR moves no protocol hash and does not invalidate the running sweep.

That is checked, not assumed: the manifest contains `interpolation`, `paramSet`, `latentHeating`,
`farField`, `surfacePolicy`, `freezeCommit`, `parameterTableSha256`, the grid axes, the regime and
scoring rows, the extrapolation window, the extent-drift bound, the domain spot-check, the engine
control, and the freeze list. The fixture appears in none of them.

## Context

ADR 0031 changed the registered parameter set to `CAK` and emptied
`PHASE6_FIXTURE_X64_BASELINE`, because under `CAK` **both** fixture points classify `neutral` —
−5 °C measures AR 1.0000 (measured probe) and −15 °C stays near 1.1053, since A_prism ≈ 0.968 at
(Tm−T) = 15. A tier-2 control whose two points share a class cannot detect the failure it exists
to detect, which is a habit class flipping between architectures.

New points are needed. **Choosing them after seeing which sweep points happen to sit near a class
boundary would be selecting the test from the results** — the same after-the-fact freedom ADR 0031
was written to remove. ADR 0031 therefore deferred the choice rather than making it inline.

This ADR registers the **rule**, while the ADR 0031 re-sweep is still running and its results do
not exist. Applying the rule afterwards is mechanical.

## Decision

**Two pairs are registered, not one**, because the robust and fragile pairs answer different
questions and conflating them costs the answer to both:

- the **robust pair** asks *does the whole pipeline agree across architectures?*
- the **fragile pair** asks *is any habit class in this sweep sensitive to low-order platform arithmetic?*

A single pair chosen for maximum sensitivity answers only the second and reports a difference so
readily that a genuine pipeline disagreement would be indistinguishable from expected noise. A
single robust pair answers only the first and would let a fragile classification ship unflagged.

### The selection rule

Applied to the ADR 0031 re-sweep's `points.json`, over **valid points only** — any point with a
non-null `exclusionReason` is ineligible, because a run that did not happen properly cannot
baseline anything.

| fixture point | rule |
|---|---|
| `robust-plate` | the valid point with the **smallest** `aspectRatio` |
| `robust-column` | the valid point with the **largest** `aspectRatio` |
| `fragile-plate-ceiling` | the valid point minimising `abs(aspectRatio − 0.666666…)` |
| `fragile-column-floor` | the valid point minimising `abs(aspectRatio − 1.5)` |

**Ties break deterministically**, in this order: warmest `tempC`, then smallest `fraction`, then
smaller `aspectRatio`. Stated because integer lattice extents make exact ties genuinely common —
the superseded sweep contained a point at AR exactly 1.5000, and four points sharing AR 0.6842.

**If `robust-plate` and `robust-column` land in the same class**, they are still registered and the
fact is reported as a finding: it means the sweep produced no two points spanning two classes, and
the tier-2 control cannot detect a class flip at all this cycle. It is NOT repaired by relaxing the
rule or hand-picking a substitute. This case is live — `CAK` may produce few or no columns.

**The fragile pair may legitimately be the same point twice** if one point is closest to both
thresholds. Registered as-is; the duplicate is reported rather than worked around.

### What a difference means, restated

Unchanged from the WP0c registration, and it applies with more force to the fragile pair: **a
difference is a FINDING, not a failure to fix.** A fragile point differing between architectures
says that classification is fragile across the tested platforms and must be reported as such. Neither
platform is declared correct and nothing is averaged.

**The two pairs are reported separately and never pooled.** A robust pair agreeing while a fragile
pair differs is the expected and most informative outcome, and collapsing them into one
pass/fail would destroy exactly that distinction.

## Consequences

**Cost is four growth runs, roughly 30 minutes each**, at the registered configuration, after the
re-sweep completes. Two more than the previous control.

**The tier-1 libm digest is unaffected.** It is a pure function of the fingerprint temperatures and
`PHASE6_PARAM_SET`, neither of which this ADR touches; it stays `2a9f64b3` as re-issued by
ADR 0031.

**MAC RUN NEEDED still stands, and grows slightly**: the arm64 side now needs four tier-2 runs plus
the tier-1 fingerprint. The Mac/arm64 run is not attempted here, per standing instruction; the
runbook is updated when the baseline is populated.

**`PHASE6_FIXTURE_X64_BASELINE` stays empty until the re-sweep lands.** The test admits the empty
state and re-imposes the two-class requirement the moment any row is populated — so this rule
cannot be used to fill it with a pair that fails to separate classes without that test failing
loudly, which is the intended interlock.

**Forecloses.** Choosing fixture points by inspecting which ones sit near a boundary. Substituting
a hand-picked point when the rule returns an inconvenient one. Reporting a single pass/fail across
both pairs. Treating a fragile-pair difference as a bug.

## Alternatives considered

**One pair, maximum sensitivity** (the module's existing stated intent — sit where a class is
actually being decided). Rejected as insufficient rather than wrong: it is the better single pair,
and it is retained here as the fragile pair. Alone it cannot distinguish "the arithmetic diverged"
from "this point was always a coin toss."

**One pair, representative.** Rejected: it would have passed happily while a point at AR exactly
1.5000 sat in the published class matrix with its class decided by one lattice site.

**Keep the −5 / −15 °C points and re-baseline them under `CAK`.** Rejected — that is the option
that requires no thought and produces a control that cannot work, since both now classify neutral.

**Defer the whole control until after the SDAK arm.** Rejected. The no-SDAK arm is being gated as a
control in its own right, and an ungated determinism claim would have to be withdrawn from it.
