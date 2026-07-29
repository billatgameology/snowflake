# 0028 — Erratum in the frozen parameter table's Eq. 3.35 check (exponent mismatch)

- **Date:** 2026-07-27
- **Status:** accepted
- **Charter impact:** none, and per Rule 5 here is the clause that makes it none. §3.2 Phase 6
  item 1 says:

  > "Any post-freeze edit to parameters or protocol requires a logged ADR and invalidates prior
  > sweep results — the full sweep re-runs."

  This is that logged ADR. The clause is satisfied rather than amended: it does not forbid the
  edit, it prices it. **No sweep had run at the time of writing**, so the price was zero and no
  results were invalidated. The same clause is why this correction could not be a silent edit,
  however small — it is the mechanism, not an obstacle to route around.

## Context

`docs/libbrecht-parameters.md` was frozen and hash-pinned by WP0c (`6d28623`,
sha256 `e572da78…`). The 2026-07-27 independent review found a wrong number in it, in §1.1's
third check on the Eq. 3.35 erratum:

> "**A crystal that is not growing cannot be biased by the far boundary.** As `alphaHK → 0` the
> corrected bias vanishes (**3.7e−6 at `alphaHK = 1e−8`**)"

Verified against the live solver at the documented test point (`R` = 3 µm, `R_far` = 16.8 µm,
−5 °C, 1 atm):

| `alphaHK` | `finiteShellBias` |
|---|---|
| 1e−6 | 3.7538e−6 |
| 1e−7 | 3.7539e−7 |
| **1e−8** | **3.7539e−8** |
| 1e−9 | 3.7539e−9 |

The document paired the **1e−6** row's value with the **1e−8** argument — an exponent slip of two
orders, presumably from reading across rows of exactly this table.

## Decision

Correct the line, through this ADR rather than as a silent edit, and state the property the
check is actually making rather than a single sampled value:

> the corrected bias vanishes **linearly in `alphaHK`** — 3.7539e−6, 3.7539e−7 and 3.7539e−8 at
> `alphaHK` = 1e−6, 1e−7 and 1e−8 respectively

`PHASE6_PARAMETER_TABLE_SHA256` moves `e572da78…` → `276494f6…`, and
`PHASE6_PARAMETER_TABLE_REVISIONS` records both so the freeze has a history rather than a
silently-replaced constant.

## Consequences

**The erratum's argument is untouched.** The check is that a crystal with no flux cannot be
biased by a far boundary, i.e. that the corrected bias → 0 as `alphaHK` → 0 while the *printed*
Eq. 3.35 instead tends to `[1 − R/R_far]^(−1) − 1` ≈ 22%. That contrast is what falsifies the
printed form, and it holds at every row above. Nothing in ADR 0024, WP3b, or the monopole far
field depends on which row was quoted.

**No parameter value changed.** The edit is to a worked check in the erratum discussion, not to
any anchor, coefficient, or interpolation input. Every number the solver reads is bit-identical,
which is why no re-run of anything is required beyond re-hashing the file.

**Stating the scaling is better than stating a point.** "Vanishes linearly, here are three rows"
cannot be misquoted by one row the way a single sampled value can, and it is also the stronger
statement — linearity in `alphaHK` is what the corrected `gamma = (a + X₀/R)/a` predicts, so the
check now demonstrates the functional form rather than one sample of it.

**The freeze mechanism worked as intended.** The hash did not prevent the error — it was already
in the file when the hash was taken — but it did force this correction to be an ADR with a
recorded before/after rather than an untracked edit to a document the protocol depends on. That
is the property being bought.

## Alternatives considered

**Leave it and note the erratum elsewhere.** Rejected: the parameter table is the document other
work reads to learn what the project believes, and leaving a wrong number in it with the
correction filed somewhere else optimises for the freeze's convenience over the reader's.

**Fix it silently, since it is "only prose".** Rejected, and the directive to route it through an
ADR is right. A frozen file with a silent edit is not frozen; the whole value of the hash is that
it makes edits visible, and the first time an exception is made for a small one is when it stops
working.
