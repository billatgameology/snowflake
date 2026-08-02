# Libbrecht's post-monograph snow-crystal papers — index

Nine snow-crystal papers Libbrecht published *after* the monograph (`1910.06389v2`), indexed by
the Rule 12 source-currency sweep (`research/phase6-source-currency.md`) and obtained 2026-07-28 at
maker direction. They include later printed forms and source-fit values related to, but not the
exclusive provenance of, this project's historical digitized broad-facet table.

Media is not versioned (decision 0004). This index is the tracked artifact: the PDFs and their
page renders are a local cache, re-downloadable and re-verifiable from the URLs and hashes here.

Renders are 300 dpi RGB PNGs at `research/<id>/page-NNNN.png`, matching the existing convention
(2550 × 3300 for US Letter). Produced with PyMuPDF 1.26.5 / MuPDF 1.26.10 — `pdftoppm` is not
available on this host, and the renders are pixel-equivalent for reading purposes.

| arXiv | pages | bytes | sha256 |
|---|---|---|---|
| `2306.04042v1` | 20 | 1,400,163 | `1ff2c1f9699c2aefd26e5373f29c4fdd7a110620c136bd349d813947dacbcd1f` |
| `2109.00098v1` | 23 | 10,572,722 | `e382edbc61e706c4cdb88811bba2488f7d29baf8dd14d94b21e4a12f5d3fbbeb` |
| `2106.09809v1` | 19 | 7,975,371 | `f53b9e64a1a6f149a06aba93474041335d8df0653c2615a1b8c90b6c8b1aaa87` |
| `2012.12916v1` | 14 | 2,369,113 | `249d390ad509bd70f0fa3f4c0f242f2fd951a231d825741d77b3340236af82a2` |
| `2011.02353v1` | 12 | 2,717,131 | `6bd9a8efff803a04d95a9a5046e91a5e7af5cf181b6a7dc41486b173af4f684c` |
| `2009.08404v2` | 18 | 3,660,835 | `d1fe8cb5a88560aba7855b802cf335f1f03f7f802c2f208d3b5d69e6004336dd` |
| `2004.06212v1` | 13 | 1,562,618 | `6e450a1c2969e5cd074b2282ed727c25cb56858347246350c4e0e487b592f49e` |
| `1912.09440v1` | 13 | 1,355,578 | `c4e755c51dd913322954fc2f0e57410f2a6e6937ce3fe256d6b705aac41fc2bc` |
| `1912.03230v1` | 24 | 2,282,494 | `79abfe821a8437601f1b8ded23d533c2ec1be1589d871f1644e61dace90d7477` |

`2306.13087v1` — *Quantifying the Nakaya Diagram* — is indexed separately in
[`2306.13087v1.md`](2306.13087v1.md), which also carries its verified extracts. Its 14 pages are
now rendered alongside these.

Source URLs are `https://arxiv.org/pdf/<id>` for every entry.

## What each is, and why it matters here

Titles and dates are verified from the arXiv listing API. This index records what was **obtained**.

> **UPDATE 2026-07-28 — they have since been read.** What they *say* is recorded in:
>
> - **[`libbrecht-figure-findings.md`](libbrecht-figure-findings.md)** — the figures and tables,
>   read as images, with every number quoted or computed from a printed equation. Start here.
> - **[`figures.md`](figures.md)** — standalone crops of the load-bearing charts, with provenance
>   and hashes, reproducible via `app/scripts/phase6-crop-figures.mjs`.
> - **[`../app/scripts/phase6-libbrecht-closed-forms.mjs`](../app/scripts/phase6-libbrecht-closed-forms.mjs)**
>   — every printed closed form transcribed beside its page citation, evaluated against this
>   project's inputs and against same-lineage source-fit values in the dedicated analysis papers.
>   Re-runnable; this is not independent experimental validation.
>
> ~~**The headline.** A habit boundary requires the basal and prism σ₀ curves to swap order, so the
> crossing count bounds how many habit transitions a model can express. Every broad-facet
> parameterization ever printed for this model has **one** crossing (ours 10.00, M2 8.39,
> `2009.08404v2` Eq. 3 10.92); the Nakaya diagram has **three** boundaries. The two SDAK dips —
> basal at −4.5 °C, prism at −14.4 °C — supply the difference, and each sits inside a band the WP2
> sweep scored zero on (`columns` 0/24, `plates-cold` 0/60). **The sweep's result is structural,
> not a tuning failure**, and SDAK is load-bearing rather than an enhancement.~~
>
> **CORRECTION 2026-08-01 — the structural claim is retracted.** Crossings of `sigma0Basal` and
> `sigma0Prism` alone cannot bound habit transitions: the governing attachment coefficient is
> `alphaHK = A * exp(-sigma0 / sigmaSurface)`, so the temperature- and facet-dependent prefactor
> `A` can change the ordering. The cited crossing counts therefore do not prove a model-class
> impossibility, and the sweep cannot establish from them that SDAK is load-bearing. What survives
> is empirical and limited to the executed rows: they did not reproduce the registered diagram at
> the sampled conditions. Isolating the dip contribution requires a matched no-dip ablation that
> holds the remaining M1 kinetics and run configuration fixed. Even a restricted equal-shared-field
> `alphaHK` ordering swap does not bound the coupled habit: facet-local fields, geometry, diffusion,
> size and history remain part of the forward result.

### Directly on the warm-end problem

~~Historical claim: our digitized σ₀_prism is 1.6–3.2× low at −2…−5 °C; −2 °C contains all five
validation agreements; and the comparators are dedicated independent measurement papers.~~

> **CORRECTION 2026-08-01 — the struck claim is unsupported by the cited comparison.** These papers
> infer/source-fit σ₀,prism = **0.03%** at −2 °C and **≈0.2%** at −5 °C within the same model/source
> lineage. Our digitized anchors are 0.028% at −2 °C (6.7% low) and 0.27% at −5 °C
> (35% high; 0.07 percentage point absolute). M2 is ×3.01/×2.14 and `2009.08404v2` Eq. (3) is
> ×1.07/×1.54 relative to those −2/−5 °C source fits. The earlier uniform 1.6–3.2×-low conclusion
> used the wrong comparator, but the corrected comparison does not support uniform ~7% agreement.
> This is a same-lineage transcription/model-consistency check, not independent measurement of
> σ₀. The “five agreements” count belonged to the superseded CAK_A1 artifact; the retained historical
> CAK artifact is 3/90. Our digitized `A_prism` separately matches `2009.08404v2` Eq. (5) to within 8.4% worst and
> ~2% typically. Computed in
> [`../app/scripts/phase6-libbrecht-closed-forms.mjs`](../app/scripts/phase6-libbrecht-closed-forms.mjs).

- **`2004.06212v1`** — *Comprehensive Model 7: Ice Attachment Kinetics near −2 °C* (2020-04-13)
- **`1912.03230v1`** — *Comprehensive Model 6: Ice Attachment Kinetics near −5 °C* (2019-12-06)

### The seed question

- **`2109.00098v1`** — *Taxonomy 1: Using c-axis Ice Needles as Seed Crystals* (2021-08-31). The
  methods paper for the seed geometry behind all 206 observations in `2306.13087`. Required
  reading before adopting that data set as a comparison target or matching its seed — our
  registered seed is a hexagonal plate. A sparse Phase 6 diagnostic found a large seed-dependent
  difference in its executed comparison; it did not establish a largest systematic over the full
  protocol (`phase6-convergence.md` §5).

### SDAK primary sources (ADR 0030's arm)

- **`2012.12916v1`** — *Comprehensive Model 10: On the Molecular Dynamics of SDAK* (2020-12-23)
- **`2011.02353v1`** — *Comprehensive Model 9: Characterizing SDAK near −4 °C* (2020-11-04)
- **`2009.08404v2`** — *Comprehensive Model 8: Characterizing SDAK near −14 °C* (2020-09-17).
  Note **v2**; the stretch register cited this unversioned.

### Method and context

- **`2306.04042v1`** — *A Comprehensive Model of Snow Crystal Faceting* (2023-06-06). ~~Reportedly
  carries the SDAK-2 two-branch (A, σ₀) table — sweep-reported, unverified.~~ **VERIFIED
  2026-07-28: it is Table 1, page 9**, covering −1 to −15 °C with `v_kin(T)`, and it is a table
  rather than a plot, so it needs no digitization. Its first branch matches the four displayed
  source-fit values in the −2 °C and −5 °C papers at their stated precision; all are from the same
  author/model lineage. See
  [`libbrecht-figure-findings.md`](libbrecht-figure-findings.md) §8 and the crop in
  [`figures.md`](figures.md).
- **`1912.09440v1`** — *A Versatile Apparatus for Measuring the Growth Rates of Small Ice Prisms
  from the Vapor Phase* (2019-12-19). The instrument behind the measurement papers; relevant to
  what their stated uncertainties mean.
- **`2106.09809v1`** — *Triangular Snowflakes* (2021-06-17). Three-fold structures on a hexagonal
  lattice; not on the Phase 6 critical path, obtained for completeness of the sweep.

## Standing constraint

The historical CAK artifact retains the parameter-table hash it executed. M1 forms from this corpus
did enter the historical arm-2 freeze, whose registered headline was never produced; its values
hash remains preserved for artifact verification. The corrected table is accepted under ADR 0040
with a separately named current-file hash; the replacement protocol still requires a new freeze and
full registered rerun. Any further behavior change
remains ADR- and re-freeze-gated under charter §3.2.
