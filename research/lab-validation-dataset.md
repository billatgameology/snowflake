# Lab validation dataset — condition-annotated laboratory crystals from the source library

**Status: extracted 2026-07-16 (first pass). Type: source-index dataset; Evidence: source-stated
conditions with per-entry verification status. Nothing here is gate evidence.** This file and
[`lab-validation-dataset.jsonl`](lab-validation-dataset.jsonl) are the tracked index; the images
they reference live in the **local, gitignored** research media (decision
[0004](../docs/decisions/0004-research-media-not-versioned.md)) — a fresh clone must re-download
the PDF and regenerate renders (commands below).

**Purpose.** The maker's directive: this library is the only lab source available for validating
the models — so extract every image whose growth conditions the source documents, in a form that
lets us *run the model at the same conditions and compare the result with the lab image* (and,
where the source printed them, with measured growth rates). Companion analysis:
[docs/monograph-review.md](../docs/monograph-review.md) (esp. §4.1 instrument-level validation).

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
   - `sigma_surf` **at the facet** (e.g. Figs. 4.8, 4.19, 7.14, 7.15): the transport problem is
     already solved/corrected out; these test the **kinetics law alone**.
   - `sigma_infinity` far-field / chamber supersaturation (Figs. 8.16 grid, 8.21–8.29, 7.21,
     3.59): the model must solve transport too; treat as the Dirichlet/monopole far field.
   - Values are **relative to ice** and can exceed water saturation by a lot in diffusion
     chambers (grid tops out at 128 %); that is chamber physics, not a typo. Chamber-model
     systematics apply (mono §6.1 "Supersaturation", §8.3).
3. **Geometry classes gate feasibility.** Each entry carries `feasibility`:
   - `free-crystal-analog` — isolated crystal in uniform far field (free-fall data): closest to
     the solver today; **start here** (Fig. 7.21 is the flagship).
   - `facet-rate-experiment` — v_n(sigma_surf) curves: needs the facet-rate / 1D-oracle harness
     (monograph-review §3), nearly transport-free.
   - `needs-column-seed` — e-needle growth: solver needs an elongated seed option (the canonical
     19-site seed is pinned; adding a seed class is an ADR-level change for evidence use).
   - `substrate-unsupported` — VPG/PoP substrate geometry not modeled in v1; qualitative trends
     may still be citable as context, never as agreement.
   - `beyond-v1-kinetics` — source attributes the form to SDAK/ESI (thin plates near −15 °C,
     hollow columns/fishbones near −5 °C at high σ): no-SDAK runs are **expected** to miss these;
     record misses as consistent-with-source, not as solver defects.
   - `cylindrical-analytic` — matches the 1D/2D reference-solver tier.
4. **Growth time and scale.** Grid tiles: ~5 min (highest σ) to ~30 min (lower σ); per-tile time
   and absolute scale are NOT recoverable (per-tile crop/zoom, mono printed p. 300). Comparisons
   at matched **crystal size** (charter: habit is size-dependent) or matched physical time where
   stated (e.g. 200 s in Fig. 7.21).
5. **Grades.** A = quantitative rates/series with stated conditions; B = morphology image with
   stated (T, σ) and geometry; C = partial/contextual conditions; D = visual reference only.
   n/a = absent tile.
6. Comparisons using CAK inputs at conditions the SDAK dips were tuned on remain **in-sample**
   for Nakaya purposes (charter §2.7); the grid entries are still legitimate targets for
   *rate/onset/trend* comparisons and for the no-SDAK falsification record.

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
| `mono-7.21_freefall-sizes_200s` | sizes+habit after 200 s free fall vs σ∞ (Fig. 7.21, printed p. 268) | −5 °C and −10 °C, air | **flagship near-term target** — isolated crystal, uniform far field, fixed clock; matches solver geometry today |
| `mono-7.15_prism-vn-curve_-15C_20mbar` | prism v_n(σ_surf) curve, σ₀ = 3 % fit (Figs. 4.4/7.15, printed pp. 144/263) | −15 °C, 20 mbar air, σ_surf axis | kinetics-law test, transport-free; facet-rate harness target |
| `mono-7.14_basal-vn-curve_-12C` | basal v_n(σ_surf), σ₀ = 2.3±0.2 % (Fig. 7.14, printed p. 263) | −12 °C, low P | ditto for basal; also rejects dislocation model |
| `mono-8.21/8.24/8.26` (3 entries) | σ-series at −15 °C: 4.6 % blocky → 7 % thick plate → 11 % thin plate (printed pp. 311–314) | e-needle, air, DC2 | aspect-ratio-vs-σ trend at fixed T; thin-plate endpoint is ESI territory |
| `mono-8.29_needle-rates_-5C_1.8pct` | axial+radial needle rates, rate transition at full faceting (printed p. 317) | −5 °C, σ∞ 1.8 %, air | growth-rate trajectory target |
| `mono-8.17_needle-radius_-2C` | needle radius vs time (printed p. 308) | −2 °C, air | cylindrical-analytic tier |
| `mono-3.20_needle-velocity-vs-T_heating` | radial velocity coefficient vs T; particle-only model overpredicts (printed p. 99) | air, r = 5 µm ref | the latent-heating (chi_0) benchmark |

Grade B highlights (condition-labeled morphology):

- `mono-4.20_-5C_sigma-threshold-series` — the −5 °C onset ladder (4 % solid column → 8 %
  hollow → 16 % needle clusters → 32 % tridents → 64/128 % fishbones; printed p. 164). The
  model's hollowing-onset σ at −5 °C is directly comparable even where extreme forms need SDAK.
- `mono-5.25_blocky-prism_-10C_artifact-control` — **numerics-artifact control**: real blocky
  prism has essentially no basal hollowing; the source's own facet-kink CA could not avoid
  hollowing it (printed p. 203). Cite when reading any LK hollowing positive.
- `mono-4.8_blocky-plate_-0.5C` — prism faceting at σ_surf ≈ 0.1 % caused by `A_prism < 1`,
  not a nucleation barrier: a target the `CAK_A1` set should FAIL and the `CAK` set should hit.
- `mono-9.18_pop-timeline_-12.5C-to--15C` — the cleanest printed two-segment temperature
  history (cool → edge thins → corner branching): a qualitative timeline target.
- `mono-3.39` (−16 °C, 16 % spoked hollow plate), `mono-3.48` (I-beam ridges, −9 °C, 16 %),
  `mono-3.62` (tridents, −5 °C, 32/64 %), `mono-3.59` (free-fall non-hexagonal plates, −10 °C,
  σ∞ ≈ 1.4 % — symmetry-breaking statistics reference).

Grade C/D: `mono-4.19` (VPG plates-vacuum vs columns-air at −5 °C, substrate), `mono-9.14`
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

## JSONL schema (one object per line)

`id`, `kind` (morphology-image | growth-rate-curve | time-series-images | video), `absent?`,
`source` {doc, figure, printed_page, pdf_page, panel?}, `assets` (bundle-relative local paths),
`conditions` {temp_c, sigma_pct, sigma_fraction, sigma_ref, medium, geometry, growth_time_s?,
history?}, `morphology_as_read` (grid; reviewer reading) or `morphology_source_stated` (caption),
`quantitative?`, `comparison_note?`, `special_role?`, `grade`, `feasibility[]`, `verification`.

## Gaps and next extraction targets

- Fig. 8.16 σ-definition detail (how DC2 σ at the crystal location was calibrated) — read mono
  §8.3/§6.1 fully before quantitative σ use; record the stated uncertainty.
- Chapter 7 tabulated datasets beyond the sampled figures (more v_n curves across T).
- 1910.09067 figures (crystal photos duplicate monograph sources; its Fig. 4 raw σ₀ points are
  parameter material, not image targets) — deliberately deferred.
- Panel-level re-verification pass: someone (human or model) opens each grid tile at full
  resolution against the PDF and flips `verification` to caption/PDF-verified. Not done in v0.
