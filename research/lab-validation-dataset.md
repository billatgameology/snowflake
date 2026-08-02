# Lab validation dataset — condition-annotated laboratory crystals from the source library

**Status: extracted 2026-07-16 (first pass). Type: source-index dataset; Evidence: source-stated
conditions with per-entry verification status. Nothing here is gate evidence.** This file and
[`lab-validation-dataset.jsonl`](lab-validation-dataset.jsonl) are the tracked index; the images
they reference live in the **local, gitignored** research media (decision
[0004](../docs/decisions/0004-research-media-not-versioned.md)) — a fresh clone must re-download
the PDF and regenerate renders (commands below).

**Purpose.** This was created under a historical directive that treated the library as the available
lab-data source. The later Phase 6 source audit found other primary candidates and no current
apples-to-apples, pass-eligible held-out target. This remains a source index for in-sample checks and
reconnaissance: it extracts images whose conditions the source documents so a model can be run at
similar conditions without silently promoting the comparison to validation. Companion analysis:
[docs/monograph-review.md](../docs/monograph-review.md) (esp. §4.1 in-sample instrument check).

**Primary source:** K. Libbrecht, *Snow Crystals*, arXiv:1910.06389v2 (`1910.06389v2.pdf`),
read via the `1910.06389v2-llm` bundle. Page cites are printed / pdf (pdf = printed + 1).

---

## Rules and caveats (read before using any entry)

1. **Association is not yet human-certified.** Bundle figure cards machine-associate images,
   captions, and conditions by layout proximity; the Figure 8.16 grid labels were **visually
   transcribed by the extracting session** from 200-dpi renders. Every entry carries a
   `verification` field. **Before any accepted comparison, re-verify the entry against the
   canonical PDF page** (the bundle README's own rule).
2. **σ semantics differ BETWEEN entries — never mix them.** Three classes appear, recorded
   per-entry in `sigma_ref`:
   - `sigma_surf` **at the facet** (e.g. Figs. 4.8, 4.19, 7.14, 7.15): these values are
     reconstructed or corrected by the source's transport model, not directly measured. They test
     the source's fitted kinetics interpretation; transport is modeled rather than absent, so the
     same source lineage cannot provide an independent validation of that interpretation.
   - `sigma_infinity` far-field / chamber supersaturation (Figs. 8.16 grid, 8.21–8.29, 7.21,
     3.59): the model must solve transport too; treat as the Dirichlet/monopole far field.
   - Values are **relative to ice** and can exceed water saturation by a lot in diffusion
     chambers (grid tops out at 128 %); that is chamber physics, not a typo. Chamber-model
     systematics apply (mono §6.1 "Supersaturation", §8.3).
3. **Geometry classes gate feasibility.** Each entry carries `feasibility`:
   - `free-crystal-analog` — isolated free-fall crystal data, useful as a transport/ventilation
     reconnaissance candidate but not geometry-, size-, or seed-matched to the solver today.
   - `facet-rate-experiment` — v_n(sigma_surf) curves: needs the facet-rate / 1D-oracle harness
     (monograph-review §3); surface supersaturation is source-reconstructed, so these are useful
     same-lineage fit diagnostics rather than transport-free independent observations.
   - `needs-column-seed` — e-needle growth: solver needs an elongated seed option (the canonical
     19-site seed is pinned; adding a seed class is an ADR-level change for evidence use).
   - `substrate-unsupported` — VPG/PoP substrate geometry not modeled in v1; qualitative trends
     may still be citable as context, never as agreement.
   - `beyond-v1-kinetics` — source attributes extreme thin plates near −15 °C and sheath-like
     hollow columns/fishbones near −5 °C at high σ to SDAK/ESI: no-SDAK runs are **expected** to
     miss those extreme forms. Mild hollowing is not excluded without ESI and must be assessed
     separately; record scoped misses as consistent-with-source, not automatically as solver defects.
   - `cylindrical-analytic` — matches the 1D/2D reference-solver tier.
4. **Growth time and scale.** Grid tiles: ~5 min (highest σ) to ~30 min (lower σ), and the source
   supplies field-of-view scale/time information for the panels. Per-crystal dimensions and a common
   endpoint size are not directly printed, while crop/zoom varies. Any accepted matched-size or
   matched-time comparison therefore still needs a blind extraction protocol; a caption-wide time
   range is not a per-tile clock (contrast the explicit 200 s in Fig. 7.21).
5. **Grades.** A = quantitative rates/series with stated conditions; B = morphology image with
   stated (T, σ) and geometry; C = partial/contextual conditions; D = visual reference only.
   n/a = absent tile.
6. Comparisons using the M1/P3 SDAK approximation at conditions that informed its dips remain
   **in-sample** for Nakaya purposes (charter §2.7). Grid entries may support clearly labeled
   *rate/onset/trend* diagnostics and blind reconnaissance, but cannot close a held-out gate. The
   machine-readable index carries `passEligible=false` until a separate selected-target lock says
   otherwise; a future loader must fail closed if that lock is absent.

## Regenerating local image assets

```text
# from research/1910.06389v2-llm/ (gitignored; safe to add derivatives)
pdftoppm -f 303 -l 307 -r 200 -png ../1910.06389v2.pdf page-images-extra/pdf-page
```

All other referenced images already exist in the bundle (`figures/fig-N.M/visual.png`,
`page-images/pdf-page-XXXX.png`) or are re-renderable the same way at any page.

---

## Part A — the Figure 8.16 morphology diagram on e-needles (printed pp. 301–306 / pdf 302–307)

The most systematic condition-labeled image set in the source: isolated single crystals on
e-needle tips in the DC2 chamber, **fixed (T, σ) held constant per tile**, T from −0.5 to
−21 °C, σ from 8 % to 128 % (rel. ice). ~30 µm needle diameters; largest plates ~1.5 mm.
Cell text below = the extracting session's as-read morphology (NOT source text); 3 tiles absent.
One JSONL entry per tile (`mono-8.16_T{T}C_S{σ}pct`).

### printed p. 302 / pdf 303 — T = −0.5, −1, −2, −3 °C

| σ \ T | −0.5 °C | −1 °C | −2 °C | −3 °C |
|---|---|---|---|---|
| 128 % | — (melting) | sidebranched star cluster | six-arm dendrite star | sparse branched cluster |
| 64 % | six-arm pointed star | six-arm pointed star | six-arm star, heavier sidebranches | 3D branched cluster on column |
| 32 % | broad six-lobed plate | stellar plate, dendritic lobes | hex plate, concentric web | dense cup/rosette |
| 16 % | hex plate, star ribs | lobed openwork plate | hex plate, inner star | short capped column |
| 8 % | small plate cap on needle | simple hex plate | slender column tip | slender column, split tip |

### printed p. 303 / pdf 304 — T = −4, −5, −6, −7 °C

| σ \ T | −4 °C | −5 °C | −6 °C | −7 °C |
|---|---|---|---|---|
| 128 % | fishbone spray | fishbone spray | fishbone spray | fishbone spray (denser) |
| 64 % | branched needle cluster | needle spray | needle cluster | dense sheath cluster |
| 32 % | hollow sheath cluster | thin needle cluster | hollow column/sheath | skeletal hollow prism cap |
| 16 % | slender needle | needle, split tip | thin hollow column | hollow column tube |
| 8 % | needle tip | bare column tip | slender column (hollowing) | slender column (hollowing) |

### printed p. 304 / pdf 305 — T = −8, −9, −10, −11 °C

| σ \ T | −8 °C | −9 °C | −10 °C | −11 °C |
|---|---|---|---|---|
| 128 % | 3D spiky dendrite spray | 3D spiky dendrite spray | six-arm sidebranched star | six-arm sidebranched star |
| 64 % | plate crown/cup rosette | plate crown rosette | petaled plate rosette | sectored petal rosette |
| 32 % | faceted skeletal cap | ribbed hex plate | sectored web plate | large ribbed hex plate |
| 16 % | capped column | sectored plate | skeletal openwork plate | ribbed hex plate |
| 8 % | slender column, small cap | slender column, small cap | column, small plate forming | column, small plate forming |

### printed p. 305 / pdf 306 — T = −12, −13, −14, −15 °C

| σ \ T | −12 °C | −13 °C | −14 °C | −15 °C |
|---|---|---|---|---|
| 128 % | partial star on needle | fernlike stellar dendrite | fernlike stellar dendrite | fernlike stellar dendrite |
| 64 % | six-arm star, sparse sidebranches | six-arm narrow star | stellar dendrite, sidebranches | stellar dendrite, sidebranches |
| 32 % | simple hex plate, ribs | six-petal simple star | six-petal simple star (robust feature, printed p. 302) | six-petal simple star |
| 16 % | skeletal ribbed plate | notched lobed plate | notched lobed plate | hex plate, star ribs |
| 8 % | capped column tip | simple hex plate | simple hex plate, markings | simple hex plate |

### printed p. 306 / pdf 307 — T = −16, −17, −18, −21 °C

| σ \ T | −16 °C | −17 °C | −18 °C | −21 °C |
|---|---|---|---|---|
| 128 % | fernlike stellar dendrite | fernlike stellar dendrite | — | — |
| 64 % | sparse star, ringed sidebranches | large ribbed hex plate | small plate cluster rosette | blocky rosette |
| 32 % | skeletal hex plate | ribbed plate on column | ribbed plate | blocky capped column |
| 16 % | ribbed hex plate | openwork plate | openwork plate | blocky cap on column |
| 8 % | T-shaped capped column | slender column | slender column | slender column |

## Part B — curated case studies (quantitative first)

Grade A (rates / time series with stated conditions):

| JSONL id | What | Conditions | Why it matters |
|---|---|---|---|
| `mono-7.21_freefall-sizes_200s` | sizes+habit after 200 s free fall vs σ∞ (Fig. 7.21, printed p. 268) | −5 °C and −10 °C, air | useful free-fall reconnaissance with a fixed clock; ventilation, seed, size, and geometry remain unmatched, so it is not a gate target |
| `mono-7.15_prism-vn-curve_-15C_20mbar` | prism v_n(σ_surf) curve, σ₀ = 3 % source fit (Figs. 4.4/7.15, printed pp. 144/263) | −15 °C, 20 mbar air, source-reconstructed σ_surf axis | same-lineage kinetics-fit diagnostic for a facet-rate harness; not an independent or transport-free observation |
| `mono-7.14_basal-vn-curve_-12C` | basal v_n(σ_surf), source-fit σ₀ = 2.3±0.2 % (Fig. 7.14, printed p. 263) | −12 °C, low P, source-reconstructed σ_surf | analogous same-lineage diagnostic for basal kinetics; the source reports rejection of the dislocation model by fit quality |
| `mono-8.21/8.24/8.26` (3 entries) | σ-series at −15 °C: 4.6 % blocky → 7 % thick plate → 11 % thin plate (printed pp. 311–314) | e-needle, air, DC2 | aspect-ratio-vs-σ trend at fixed T; thin-plate endpoint is ESI territory |
| `mono-8.29_needle-rates_-5C_1.8pct` | axial+radial needle rates, rate transition at full faceting (printed p. 317) | −5 °C, σ∞ 1.8 %, air | growth-rate trajectory reconnaissance reference; e-needle geometry is unmatched |
| `mono-8.17_needle-radius_-2C` | needle radius vs time (printed p. 308) | −2 °C, air | cylindrical-analytic tier |
| `mono-3.20_needle-velocity-vs-T_heating` | radial velocity coefficient vs T; particle-only model overpredicts (printed p. 99) | air, r = 5 µm ref | the latent-heating (chi_0) benchmark |

Grade B highlights (condition-labeled morphology):

- `mono-4.20_-5C_sigma-threshold-series` — the −5 °C onset ladder (4 % solid column → 8 %
  hollow → 16 % needle clusters → 32 % tridents → 64/128 % fishbones; printed p. 164). It is an
  in-sample, electric-needle onset reference; the model lacks that geometry and the extreme forms
  need SDAK/ESI, so no threshold is directly gate-comparable without a registered mapping.
- `mono-5.25_blocky-prism_-10C_artifact-control` — **numerics-artifact control**: real blocky
  prism has essentially no basal hollowing; the source's own facet-kink CA could not avoid
  hollowing it (printed p. 203). Cite when reading any LK hollowing positive.
- `mono-4.8_blocky-plate_-0.5C` — the source attributes prism faceting at reconstructed
  σ_surf ≈ 0.1 % to `A_prism < 1`, not to a nucleation barrier. This contrasts the rationale
  behind `CAK` and `CAK_A1`; the unmatched geometry makes reachability a diagnostic, not a
  predetermined experimental hit/fail result.
- `mono-9.18_pop-timeline_-12.5C-to--15C` — a printed two-segment temperature-history
  reconnaissance reference (cool → edge thins → corner branching). The substrate geometry and
  supersaturation are unmatched, so the dataset-wide `passEligible=false` status applies.
- `mono-3.39` (−16 °C, 16 % spoked hollow plate), `mono-3.48` (I-beam ridges, −9 °C, 16 %),
  `mono-3.62` (tridents, −5 °C, 32/64 %), `mono-3.59` (free-fall non-hexagonal plates, −10 °C,
  σ∞ ≈ 1.4 % — symmetry-breaking statistics reference).

Grade C/D: `mono-4.19` (VPG plates at low pressure/low surface supersaturation versus columns in
air at unstated/higher supersaturation, on a substrate—multiple covariates change, so this does not
isolate pressure), `mono-9.14`
(PoP 90→300 µm), `mono-6.26` ([1999Fuk] laminar-flow panel), snowcrystals.com videos (no
recorded conditions — visual reference only, existing project rule).

## How a comparison run consumes an entry (intended workflow, not yet built)

1. Map `conditions` → runner inputs: `--temp-c`, `--sigma-inf` (fraction), pressure, and the
   geometry class (seed type; far-field condition per monograph-review §2.4).
2. Grow to the entry's stated size or physical time; **stop rules from the entry, not eyeball**.
3. Emit the standard metrics plus renders matched to the lab viewing axis (side / face-on).
4. Compare: metrics against `quantitative` where present; morphology side-by-side against the
   image, labeled with the entry's grade, `sigma_ref` class, and feasibility caveats.
5. Any *accepted* comparison requires: PDF re-verification of the entry, a registered protocol,
   and honest in-sample labeling where P3 inputs are active. Exploratory comparisons say so.

## JSONL schema (one discriminated object per line)

The first 122 lines are entry objects, identified by `id` and the absence of `record_kind`:
`id`, `kind` (morphology-image | growth-rate-curve | time-series-images | video), `absent?`,
`source` {doc, figure, printed_page, pdf_page, panel?}, `assets` (bundle-relative local paths),
`conditions` {temp_c, sigma_pct, sigma_fraction, sigma_ref, medium, geometry, growth_time_s?,
history?}, `morphology_as_read` (grid; reviewer reading) or `morphology_source_stated` (caption),
`quantitative?`, `comparison_note?`, `special_role?`, `grade`, `feasibility[]`, `verification`.

The final line is the sole status object and has no `id`:
`record_kind="dataset-status"`, `dataset="lab-validation-dataset"`, `entry_count`,
`source_index_only`, `passEligible`, and `eligibility_reason`. Thus 123 JSON lines means 122 indexed
entries plus one status record, not 123 observations. Any consumer used for evidence must reject an
unknown/duplicate/nonterminal status record, an entry containing `record_kind`, a status containing
`id`, duplicate entry IDs, or a declared `entry_count` different from the independently counted entry
objects. The current `passEligible=false` makes the dataset an index/reconnaissance corpus, not a
held-out target lock.

## Gaps and next extraction targets

- Fig. 8.16 σ-definition detail (how DC2 σ at the crystal location was calibrated) — read mono
  §8.3/§6.1 fully before quantitative σ use; record the stated uncertainty.
- Chapter 7 tabulated datasets beyond the sampled figures (more v_n curves across T).
- 1910.09067 figures (crystal photos duplicate monograph sources; its Fig. 4 raw σ₀ points are
  parameter material, not image targets) — deliberately deferred.
- Panel-level re-verification pass: someone (human or model) opens each grid tile at full
  resolution against the PDF and flips `verification` to caption/PDF-verified. Not done in v0.
