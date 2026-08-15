# Phase 8 target-book derived-observable operators

**Status:** registered specification for Phase 8 S5. These operators transform a caller-selected
observation window; they do not select windows, smooth data, assign habits, choose thresholds, or
decide pass/fail. A later scoring protocol must register those choices before it sees model output.

## Shared numerical rules

- Inputs are binary64 finite numbers. Physical times, masses, mass ratios, and mass rates must be
  strictly positive; ordered abscissae must be strictly increasing.
- Natural logarithms are used. Changing the positive time or mass unit therefore changes only a
  fitted intercept, not a power exponent.
- Regression reductions use Neumaier-compensated sums in source enumeration order. Positive means
  use scale-normalized operands with a compensated normalized sum; signed means sum each
  source-order value after division by the sample count when signs are mixed, while same-sign means
  use the scale-normalized form. These forms avoid overflow while retaining small residuals after
  cancellation.
- Every required or reported numeric result must be finite. Nonfinite range probes used to choose
  a stable algebraic path are never accepted or published. The implementation uses
  scale-normalized RMS and signed-mean reductions, log-domain ratios, and overflow-safe midpoint
  identities where those are algebraically equivalent. If a required quantity is not representable
  as a finite binary64 number, the operator fails with a named error instead of publishing `NaN` or
  an infinity.
- No operator extrapolates, silently drops a point, invents a plotted value, chooses a favorable
  interval, or converts a reported marginal uncertainty into a probability distribution.

The implementation is [`core/src/target-observables.ts`](../core/src/target-observables.ts), with
independently stated fixtures in
[`core/test/target-observables.test.ts`](../core/test/target-observables.test.ts).

## O1 — Mass-law exponent

For a pre-registered series `(t_i, m_i)`, fit

```text
ln(m_i) = b + q ln(t_i) + residual_i
```

by unweighted ordinary least squares. Report `q`, `b`, the sample count, and the unweighted RMS
residual in log mass. The caller registers the time window and any uncertainty-weighted alternative;
this operator never searches for the straightest interval. Takahashi et al. (1991) report mass-time
power laws for freely falling crystals, while Bacon, Baker, and Swanson (2003) discuss the
diffusion-limited radius-time scaling; their exact extraction locators live in the corresponding
Phase 8 research indexes.

## O2 — Power exponent P

Pokrifka et al. (2020), accepted-manuscript p. 15 / local PDF p. 15, Eq. 14 defines

```text
P = 3 ln(mDot / mDot0) / ln(m / m0).
```

`powerExponentP()` implements that pointwise expression. It evaluates the printed quotient first
so adjacent large rates retain their representable ratio, then falls back to
`ln(mDot) - ln(mDot0)` when the quotient is zero, subnormal, or infinite; subnormal division is
nonzero but can carry large relative rounding error. The paper uses a short time average for
`mDot0`; the averaging window and any derivative/smoothing method remain explicit target protocol
fields because the source does not define one universally transferable window. The singular point
`m/m0 = 1` is rejected. The fixtures independently reconstruct the paper's printed limits: rate
ratio `(m/m0)^(1/3)` gives `P = 1`, and `(m/m0)^(2/3)` gives `P = 2`.

## O3 — Scaled mass-growth trajectory and comparison

Pokrifka et al. (2020), accepted-manuscript p. 12 / local PDF p. 12, Eq. 10 defines the scaled mass
growth rate on a constant-supersaturation series:

```text
Gs = (mDot / mean(mDot)) * mean((m / m0)^(2/3)).
```

`scaledMassGrowthTrajectory()` returns `ln(Gs)` at every caller-supplied mass ratio. Both means are
ordinary sample means on the exact supplied cadence, evaluated with scale-normalized positive
means. The printed normalized-rate product is evaluated directly whenever it is finite and
normal; a subnormal normalized quotient/product or an out-of-range product uses the algebraically
equivalent log-domain fallback.
Fixed cadence is an external, fail-closed precondition: `MassGrowthRateSample` deliberately has no
time field, so this operator cannot verify cadence. In Phase 8 extraction and any Phase 9 scoring,
the caller must independently verify and record that the supplied series has the pre-registered
fixed cadence (or that a pre-registered resampling rule was applied) before invoking this operator.
Changing sample density would change both means and therefore the observable. This precondition does
not expand the target-book schema.

`compareScaledMassGrowthTrajectories()` treats the source/target mass ratios as the comparison grid,
linearly interpolates candidate `ln(Gs)` in mass ratio, and reports point count, RMS log difference,
maximum absolute log difference, and signed mean log difference. Interpolation treats each supplied
binary64 operand as exact, evaluates the weighted rational in integer minimum-subnormal units, and
rounds once to binary64 with nearest-even ties; this preserves representable subnormal and
cancellation-dominated results without accepting an out-of-range intermediate. It refuses
extrapolation. It does not turn those diagnostics into an acceptance threshold.

The source cautions on accepted-manuscript pp. 14–15 / local PDF pp. 14–15 that non-isometric
growth can make a kinetics-influenced case resemble the diffusion limit. A comparison result is
therefore an observable, not by itself a mechanism verdict.

## O4 — Boundary temperature

For two adjacent, pre-registered temperature samples with unlike non-neutral habits, ordered from
colder to warmer, report

```text
estimate = (T_colder + T_warmer) / 2
read half-width = (T_warmer - T_colder) / 2
interval = [T_colder, T_warmer].
```

This is a grid-read uncertainty, not experimental temperature uncertainty and not a confidence
interval. Neutral or ambiguous classifications must be resolved by the later protocol before it
supplies a bracket; the operator does not scan outward or pick among multiple transitions.
The implementation evaluates the printed sum and difference before division when those operations
are finite, and uses the algebraically equivalent split-half form only when the direct operation
overflows. A positive half-width that rounds to zero remains unrepresentable and is rejected.

## Deliberate limits

- These operators do not certify that a source is independent, held out, or comparable to a model.
- The mass-law fit does not infer mass from dimensions or combine unpaired ensemble dimensions.
- The Pokrifka operators accept mass rates; they do not hide differentiation or filtering choices.
- The scaled-trajectory sample type cannot attest time cadence; the Phase 8/9 caller owns the
  independently recorded fixed-cadence check described under O3.
- Scaled-trajectory comparison is not valid outside the candidate's observed mass-ratio domain.
- Boundary extraction measures one registered bracket. Multiple crossings remain multiple results;
  they are never averaged into one boundary.
