# Figure crops and source plates — the research images this project actually needs

Standalone crops of load-bearing figures and tables plus education-only source plates, so a future
reader can inspect the cited evidence without first paging through a PDF.

**Media is not versioned** (decision 0004). The `.png` files are a local cache exactly like the
PDFs and page renders. **This file is the tracked artifact**: it records the source paper, page,
crop rectangle and sha256 of every image. Phase 6 crops and education-only full-page plates are
reproducible separately:

```
node app/scripts/phase6-crop-figures.mjs
node docs/education/tools/build-source-plates.mjs
```

Crop rectangles are fractions of the page `(x0, y0, x1, y1)` from the top-left, so they are
independent of render dpi. Rendering is PyMuPDF at 300 dpi RGB, matching the page-render
convention in [`libbrecht-later-papers.md`](libbrecht-later-papers.md).

## What these are NOT

**No curve on any of these charts has been digitized.** The project's discipline is that a value
read off a plotted curve is not a citable number, and nothing here breaks it. Where a quantity
exists only as plotted data — both SDAK dips, the latent-heating curves — these images are a
*locator*, and turning them into model input remains a separate task with its own read
uncertainty. The one exception is `sdak2-two-branch-table.png`, which is a **table**: its numbers
are transcribed, verified against two independent measurement papers, and recorded in
[`libbrecht-figure-findings.md`](libbrecht-figure-findings.md) §8.

## The crops

| file | source | page | rect | bytes | sha256 |
|---|---|---|---|---|---|
| `nakaya-bands-on-sigma0-M1.png` | `2306.13087v1` | 6 | 0.52, 0.08, 0.90, 0.43 | 330,911 | `fd25a2224cf931d4b88e15a3f7ad71985fd81b310fd2241c78840c28d94adc68` |
| `cak-broad-facet-sigma0-and-A.png` | `2009.08404v2` | 3 | 0.52, 0.08, 0.90, 0.63 | 270,031 | `759feb5a576716b922f2edc44b6b39b7b15c1683af2c54a307e395db56e21fe9` |
| `cak-broad-facet-sigma0-and-A-alt.png` | `2011.02353v1` | 2 | 0.52, 0.08, 0.90, 0.63 | 276,745 | `6a59510e3f5b6e049957a834a1c91302ca33b9e83f9de5872006cab8edf69504` |
| `sdak-dip-basal-measured-near-minus4C.png` | `2011.02353v1` | 7 | 0.52, 0.085, 0.90, 0.45 | 194,787 | `cf0f8cec2a1ec64db0dd72fab46e98c14f02b1d689b60fa6c08b50ba3bd958a5` |
| `sdak-dip-prism-measured-near-minus14C.png` | `2009.08404v2` | 15 | 0.52, 0.08, 0.90, 0.46 | 376,029 | `f637a36930fcaac50789afe2cc564be82d784a03a1a4a5d7a0ce51c453b689c8` |
| `sdak2-two-branch-table.png` | `2306.04042v1` | 9 | 0.10, 0.61, 0.50, 0.79 | 79,522 | `27a519e3c566efbcc90502a07820ac5a72a528aa3a337c5c77f52a33b7d42844` |
| `latent-heating-faceting-vs-growth-rate.png` | `2306.04042v1` | 10 | 0.10, 0.08, 0.90, 0.47 | 700,222 | `cbcdd97ff6b197a712582b1e93495d52cbd6644e3e91bc7fc3915a005bcfd409` |
| `nakaya-206-observations-p1-minus0.5-to-4.5C.png` | `2306.13087v1` | 11 | whole page | 4,403,023 | `0043b9d1a9375c84970b972c3dc45e117a8f3c939c0818834228ef94c28d7af8` |
| `nakaya-206-observations-p2-minus5-to-10C.png` | `2306.13087v1` | 12 | whole page | 4,353,465 | `366bfd0b10465673a850d4bc0086611e323e1482190ab3e69a969e30c090e797` |
| `nakaya-206-observations-p3-minus11-to-16C.png` | `2306.13087v1` | 13 | whole page | 5,514,953 | `b1f9e270facadeb0641f454bd569113456850be5d342aca36e45644af3e6ed5b` |
| `nakaya-206-observations-p4-minus17-to-24C.png` | `2306.13087v1` | 14 | whole page | 4,493,705 | `fe22dadd963b8f16aa3110b2ffc6b1a15cb9fa625bec59c6c936d79fe0a3f9c1` |
| `tax1-needle-matrix-p1-minus0.5-to-3C.png` | `2109.00098v1` | 19 | whole page | 3,713,281 | `5418444407cbdc568089800dc1ebebd0523615580605ebc35496eef1e74ad9c7` |
| `tax1-needle-matrix-p2-minus4-to-7C.png` | `2109.00098v1` | 20 | whole page | 2,543,180 | `530e5e8ed26b3623174467562a86ba09919ebdd436150ab4e020f79b151edd09` |
| `tax1-needle-matrix-p3-minus8-to-11C.png` | `2109.00098v1` | 21 | whole page | 3,938,647 | `edaf11e0c88044e9c1640b6e1ad0b489f00ae980b1ddb008db6afdda5af17c11` |
| `tax1-needle-matrix-p4-minus12-to-15C.png` | `2109.00098v1` | 22 | whole page | 4,251,774 | `9b803d725a3b8b123e2186b01b790f850b8189d2b17d84db92582208c5ee1a57` |
| `tax1-needle-matrix-p5-minus16-to-21C.png` | `2109.00098v1` | 23 | whole page | 3,832,935 | `dc48148ba9dc4f7f411e95f7bcf536e08fb65ed156cff5190fdebc397fb548e1` |
| `gg-3d-morphologies-fig23-31.png` | `GravnerGriffeath_PhysRevE09` | 13 | whole page | 3,079,600 | `92a1f433e66ccadeefafafbcc5e502a33dc2702fd06942ca59079c84b8c4b979` |

## What each one shows, and why it is here

### `nakaya-bands-on-sigma0-M1.png` — the single most important figure found

Libbrecht's Figure 1: σ₀(T) for basal and prism in the M1 model, **with the Nakaya habit bands
drawn onto the plot** — `plates | columns | thin plates | columns`, separated by dashed lines at
(Tm−T) ≈ 3, 8, 25 — and **the band edges sitting exactly at the curve crossings**.

This is the source asserting that the crossing structure *is* the morphology mechanism. It is the
evidence behind the central finding in
[`libbrecht-figure-findings.md`](libbrecht-figure-findings.md) §1: every broad-facet σ₀
parameterization has one crossing, the diagram has three boundaries, and the two SDAK dips supply
the difference. The basal dip bottoms near (Tm−T) = 4.5 inside the `columns` band the WP2 sweep
scored **0/24**; the prism dip bottoms near 15 inside the `plates-cold` band it scored **0/60**.

### `cak-broad-facet-sigma0-and-A.png` and `…-alt.png` — the broad-facet parameters, with data

Two printings of the same CAK broad-facet figure: σ₀ (top panel) and **A** (bottom panel) against
(Tm−T), basal and prism, with measured points and error bars. The `2009.08404v2` page also prints
Eqs. (2)–(5) — the closed forms for both σ₀ curves, `A_basal = 1`, and **`A_prism`**, which this
project previously had only as digitized anchors. The `-alt` copy from `2011.02353v1` is kept as a
cross-check that both papers show the same curves.

### `sdak-dip-basal-measured-near-minus4C.png` — the dip that should make columns

Measured σ₀,basal,SDAK(T) over −1…−10 °C at σ∞ ≈ 8%, "revealing a substantial 'SDAK dip' centered
near -4 C". Measured under conditions chosen to suppress SDAK-2, so this characterises SDAK-1.
Dotted line is an eye guide, not a fit.

### `sdak-dip-prism-measured-near-minus14C.png` — the dip that should make cold plates

Measured σ₀,prism,SDAK(T) over −5…−40 °C at σ_far = **32% only**, dip centred near −13/−14 °C.
The paper states the simple exponential form fails at the peak and that a single σ₀ parameter is
"not adequate to fully describe the growth behavior near -14 C".

### `sdak2-two-branch-table.png` — the most directly usable artifact found

`Table 1`: the two-branch `(A1, σ₀,1, A2, σ₀,2)` prism attachment kinetics from −1 to −15 °C, plus
`v_kin(T)`. σ₀ is a **fraction**. Branch 1 reproduces the dedicated −2 °C and −5 °C measurement
papers exactly on all four numbers; branch 2 is the SDAK-2 addition and is absent by −15 °C.
Needs no digitization. This is what ADR 0030's SDAK arm should be built on.

### `latent-heating-faceting-vs-growth-rate.png` — when the deferred systematic bites

`R/r_corner` vs prism growth velocity at −1…−15 °C, latent heating off (black) vs on (red), for
R = 20 µm and R = 500 µm. **Stated for near-vacuum growth conditions, which are not this
project's 1 atm case** — a locator for the systematic's shape, not transferable evidence.

### `nakaya-206-observations-*.png` — the candidate held-out target, seen

The four plate pages of Figure 2: 206 photographs on a temperature × supersaturation grid
(σ rows 7, 10, 15, 20, 30, 45, 70, 100, 150 %), each panel labelled with growth time and a µm
scale. Page 3 of the set (−11…−16 °C) is the striking one: **every panel is a plate**, against the
sweep's 0/60 there.

**These are not yet a scoring target**, and the blocking reason is recorded in
[`libbrecht-figure-findings.md`](libbrecht-figure-findings.md) §7: the σ normalisation convention
is not yet established from the source, the panels are selected rather than sampled, every crystal
grows on a c-axis needle rather than this project's hexagonal plate seed, and the stated
supersaturation uncertainty is a ±20% band.

### `tax1-needle-matrix-*.png` — the seed-conditioned morphology survey

TAX1 Figure 24a–e: five full pages of crystals grown on the ends of slender c-axis ice needles,
arranged by temperature and far-away supersaturation. The plates preserve the printed captions,
empty or unreachable cells, and needle geometry. They are qualitative selected examples rather
than population frequencies, and their seed differs from this project's plate seed. The education
site uses them to teach how to read a morphology matrix; they are not Phase 6 evidence.

### `gg-3d-morphologies-fig23-31.png` — what the full 3-D model produced

Gravner and Griffeath printed page 13, containing Figures 23–31: sectored plates, fern and
simple-star morphologies, a needle, a hollow column, and a column with hollow prism facets. The
education site uses this page to distinguish its small two-dimensional teaching zoo from the
paper's three-dimensional model. This source plate does not alter or extend the repository solver.
