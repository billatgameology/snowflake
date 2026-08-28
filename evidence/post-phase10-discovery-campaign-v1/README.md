# Post-Phase-10 discovery campaign

This is exploratory model-development evidence, not Phase 7, a Phase 10 reopening, a physical-causality result, or quantitative validation.

## Method

All 31 registered rows reached terminal results. Analysis method `post-phase10-discovery-analysis-v1` uses a post-hoc sustained-separation threshold of 0.1 for 3 consecutive carry-forward-aligned checkpoints with one sign. Boundary composition is basal/(basal+prism); attachment orientation is cumulative basal/(basal+prism) attachment events.

## Lane A — measured domain sequence

| Row | Admissible | Cycles | Attached | Aspect ratio | Simulated s | Wall s |
|---|---|---:|---:|---:|---:|---:|
| a80 | true | 92 | 7693 | 1.227273 | 36.492611 | 4789.677 |
| a96 | true | 92 | 7693 | 1.227273 | 36.668591 | 11377.162 |
| a112 | true | 93 | 7717 | 1.227273 | 37.158972 | 21616.53 |

A80 and A96 ended with identical attached count and aspect ratio. A112 preserved the exact aspect ratio and ended 24 attached cells above A96 (+0.311972%). This is a measured three-domain plateau in final gross aspect ratio and a small remaining attached-count difference, not a general proof of domain independence.

## Lane B — numerical and seed contrasts

At both N80 and N96, changing `cflFill` from 0.1 to 0.05 changed attached count by -288 and aspect ratio by 0.058442; the final-observable domain-by-timestep interactions were 0 attached cells and 0 aspect ratio. No error law is fit from two levels.

The smaller and larger seed perturbations changed total attached count and gross aspect ratio in opposite directions, while post-seed growth moved oppositely to total count because the starting site counts differ. Initialization memory is therefore a substantive next question, not a cosmetic seed-size effect.

## Lane C — matched M1 minus no-dip endpoints

| Temperature C | Fraction | AR M1 | AR no-dip | AR difference | Boundary-basal-share difference | Attachment-basal-share difference |
|---:|---:|---:|---:|---:|---:|---:|
| -24 | 0.1 | 0.65 | 1.909091 | -1.259091 | 0.19367 | -0.609422 |
| -24 | 0.125 | 0.65 | 1.615385 | -0.965385 | 0.164902 | -0.219325 |
| -24 | 0.2 | 0.789474 | 1.3125 | -0.523026 | 0.07535 | 0.113333 |
| -19 | 0.1 | 0.263158 | 1.615385 | -1.352227 | 0.396699 | -0.250648 |
| -19 | 0.125 | 0.368421 | 1.4 | -1.031579 | 0.370129 | 0.061688 |
| -19 | 0.2 | 0.382085 | 1.166667 | -0.784581 | 0.440685 | -0.227642 |
| -6 | 0.125 | 1.105263 | 0.578947 | 0.526316 | -0.127327 | 0.101904 |
| -6 | 0.15 | 1 | 0.578947 | 0.421053 | -0.181407 | 0 |
| -6 | 0.2 | 0.894737 | 0.578947 | 0.315789 | -0.188574 | 0.0625 |
| -5 | 0.125 | 1.235294 | 0.578947 | 0.656347 | -0.201891 | 0.191159 |
| -5 | 0.15 | 1.235294 | 0.578947 | 0.656347 | -0.293977 | 0.209677 |
| -5 | 0.2 | 1.235294 | 0.60042 | 0.634874 | -0.399533 | 0.212121 |

The M1/no-dip endpoint contrast is large and temperature-dependent. It is nearly forcing-insensitive at -5 C, weakens monotonically with forcing at -6 C, -19 C, and -24 C in gross aspect-ratio magnitude, and has opposite signs in the warm and cold neighborhoods. This identifies implementation-level transition structure worth testing; it does not establish physical causality.

## First sustained separations

Each cell is `physical time s / extent / attached count`; `—` means the 0.10-by-three rule was not met on the common trajectory range.

| Temperature C | Fraction | Aspect ratio | Boundary composition | Attachment orientation |
|---:|---:|---|---|---|
| -24 | 0.1 | 3.422897 / 5 / 31 | 3.369784 / 5 / 31 | 3.422897 / 7 / 31 |
| -24 | 0.125 | 2.412393 / 5 / 43 | 2.19019 / 5 / 31 | 2.412393 / 7 / 43 |
| -24 | 0.2 | 1.104308 / 5 / 43 | 1.017689 / 5 / 31 | 1.104308 / 7 / 43 |
| -19 | 0.1 | 2.735198 / 5 / 43 | 1.260632 / 5 / 43 | 2.735198 / 7 / 43 |
| -19 | 0.125 | 1.807249 / 5 / 43 | 0.955919 / 5 / 43 | 1.807249 / 7 / 43 |
| -19 | 0.2 | 0.859203 / 5 / 43 | 0.553308 / 5 / 55 | 0.859203 / 7 / 43 |
| -6 | 0.125 | 1.065691 / 5 / 111 | 1.164902 / 5 / 31 | 1.232531 / 7 / 43 |
| -6 | 0.15 | 0.866575 / 5 / 111 | 0.947175 / 11 / 31 | 0.960246 / 7 / 43 |
| -6 | 0.2 | 0.62978 / 5 / 123 | 1.147837 / 11 / 141 | 0.66102 / 7 / 43 |
| -5 | 0.125 | 1.069779 / 5 / 43 | 1.167981 / 5 / 31 | 1.267755 / 7 / 43 |
| -5 | 0.15 | 0.881924 / 5 / 105 | 0.962956 / 5 / 31 | 0.998888 / 7 / 43 |
| -5 | 0.2 | 0.652612 / 5 / 111 | 0.712655 / 11 / 75 | 0.69748 / 7 / 43 |

The machine-readable report contains the sign and monotonic-timing maps for every observable/alignment, the four-cell numerical contrasts, seed deltas, and SHA-256 identities of the retained raw inputs.

## Recommended next experiments

Use a broad but adaptive parallel follow-up: dense 48-cubed localization around the observed bends; multiple seed geometries only at transition conditions; separate basal-dip and prism-dip matched ablations; pressure contrasts through the existing physical D(T,P); and abrupt temperature histories through the existing schedule machinery. Promote only survivors to selected 80/96-cubed and `cflFill = 0.05` checks. Run up to 16 independent CPU processes; do not involve Phase 7.
