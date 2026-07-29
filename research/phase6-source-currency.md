# Phase 6 source-currency check (Rule 12)

Rule 12 requires that before a parameter table or protocol freezes, every cited source is
confirmed to be its latest version and the cited authors' later output is swept for anything
superseding the extraction — with the check recorded as part of the freeze.

**This check is late.** The Phase 6 parameter table froze at `6d28623` without it; three uncited
Libbrecht papers surfaced the following day, which is the incident Rule 12 was written from. This
document performs the check retroactively and records what it found.

**It deliberately edits neither the frozen table nor the protocol.** The 204-point sweep has now
run, and charter §3.2 Phase 6 item 1 says:

> "Any post-freeze edit to parameters or protocol requires a logged ADR and invalidates prior
> sweep results — the full sweep re-runs."

So a currency record written *into* the frozen artifacts would invalidate the evidence it is
meant to qualify. It lives here instead, and the protocol references it.

## Method

arXiv listing API, `http://export.arxiv.org/api/query?search_query=au:"Libbrecht"`, sorted by
submission date descending, 40 entries retrieved 2026-07-28. Version numbers confirmed against
each paper's own abstract page. Non-snow-crystal entries by unrelated authors of the same surname
are excluded.

## Part 1 — are the cited sources current?

| cited source | we cite | latest | current? |
|---|---|---|---|
| arXiv:1910.09067 *A Quantitative Physical Model of the Snow Crystal Morphology Diagram* | v2 | **v2** | yes |
| arXiv:1910.06389 *Snow Crystals* (the monograph) | v2 | **v2** | yes |
| arXiv:1211.5555 *Toward a Comprehensive Model… 1* | v1 | **v1** | yes |

All three are at their latest version. **No cited source is stale.**

## Part 2 — the author's later output

This is where the check bites. Libbrecht's snow-crystal papers published *after* the monograph
(1910.06389v2, from which our σ₀ anchors are digitized):

| arXiv | date | title | in the stretch register? | obtained? |
|---|---|---|---|---|
| 2306.13087v1 | 2023-06-22 | Taxonomy 2: **Quantifying the Nakaya Diagram** | yes | **yes** |
| 2306.04042v1 | 2023-06-06 | A Comprehensive Model of Snow Crystal Faceting | yes | no |
| 2109.00098v1 | 2021-08-31 | Taxonomy 1: **Using c-axis Ice Needles as Seed Crystals** | **no** | no |
| 2106.09809v1 | 2021-06-17 | Triangular Snowflakes | **no** | no |
| 2012.12916v1 | 2020-12-23 | Comprehensive Model 10: **Molecular Dynamics of SDAK** | **no** | no |
| 2011.02353v1 | 2020-11-04 | Comprehensive Model 9: **SDAK near −4 °C** | mentioned | no |
| 2009.08404**v2** | 2020-09-17 | Comprehensive Model 8: **SDAK near −14 °C** | yes (unversioned) | no |
| 2004.06212v1 | 2020-04-13 | Comprehensive Model 7: **Ice Attachment Kinetics near −2 °C** | **no** | no |
| 1912.09440v1 | 2019-12-19 | Apparatus for measuring growth rates of small ice prisms | **no** | no |
| 1912.03230v1 | 2019-12-06 | Comprehensive Model 6: **Ice Attachment Kinetics near −5 °C** | **no** | no |

**Six snow-crystal papers the stretch register did not list**, and one version discrepancy
(2009.08404 is at v2; the register cites it unversioned).

## Part 3 — what this means, ordered by consequence

**1. There is dedicated published measurement at exactly the temperatures where our warm-end
inputs are worst.** `2004.06212` measures attachment kinetics near **−2 °C** and `1912.03230`
near **−5 °C**. Those are precisely the temperatures where `research/2306.13087v1.md` §3 found our
digitized σ₀_prism low by a factor of **1.6–3.2** against Libbrecht's own printed closed form —
and −2 °C is where **all five** of the sweep's agreements sit. Our anchors there come from
digitizing a figure in the 2019 monograph; dedicated measurement papers for those exact
temperatures were published in 2019-12 and 2020-04 and have never been consulted by this project.

**2. The seed question has a companion paper we have not read.** `2109.00098` is *Taxonomy 1:
Using c-axis Ice Needles as Seed Crystals* — the methods paper for the seed geometry used
throughout `2306.13087`'s 206 observations. Any decision about adopting that data set as a
comparison target, or about matching its seed, should read this first.

**3. SDAK has three later papers.** `2012.12916` (molecular dynamics), `2011.02353` (near −4 °C)
and `2009.08404v2` (near −14 °C). ADR 0030's SDAK arm proposes building its annex from printed
closed forms; these are the primary sources behind them and its step-zero verification should
cover them.

## What was NOT checked

Stated as a limit rather than left implicit:

- **Only titles, dates and version numbers were verified** for every paper except 2306.13087.
  Nothing in Part 3 rests on having read the others — the consequences above are inferences from
  titles and from the already-measured discrepancy, not from their contents.
- **No non-arXiv source was swept** — journal versions, errata, or the snowcrystals.com material
  may differ from the preprints.
- **Only Libbrecht was swept.** The Gravner–Griffeath sources behind the G–G skeleton were not
  re-checked for currency.
- **This check does not re-open the freeze.** It records what a Rule 12 check would have found
  had it run at the right time. Acting on any of it is an ADR-level decision with a re-sweep
  cost, and none is taken here.
