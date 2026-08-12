# Phase 8B S2 offline visual reconnaissance: Libbrecht batch A

## Status and limits

- **Complete visual coverage:** 94/94 PDF pages inspected across the six named local files. Contact sheets were used for every page; load-bearing plots and typography were reopened as individual page renders.
- **Scope:** S2 reconnaissance only. This is a page-complete candidate inventory and lineage/caveat check, not S3 transcription, figure digitization, source adjudication, or evidence acceptance.
- **No source mutation or network use.** No repo or NAS files were changed during inspection.
- **Visual inventory:** 70 numbered figures and **no numbered tables**. Numerical candidates occur in plots, captions, equations, and prose.
- `research/libbrecht-papers-extracts.md` was used as a navigation/comparison aid, but the page images were independently inspected. Its main page/figure descriptions and stated uncertainty warnings agree with this pass unless noted below.

The inspected NAS artifacts were hash-verified before this record was admitted:

| Local PDF | SHA-256 |
|---|---|
| `1912.03230v1.pdf` | `79abfe821a8437601f1b8ded23d533c2ec1be1589d871f1644e61dace90d7477` |
| `1912.09440v1.pdf` | `c4e755c51dd913322954fc2f0e57410f2a6e6937ce3fe256d6b705aac41fc2bc` |
| `2004.06212v1.pdf` | `6e450a1c2969e5cd074b2282ed727c25cb56858347246350c4e0e487b592f49e` |
| `2009.08404v2.pdf` | `d1fe8cb5a88560aba7855b802cf335f1f03f7f802c2f208d3b5d69e6004336dd` |
| `2011.02353v1.pdf` | `6bd9a8efff803a04d95a9a5046e91a5e7af5cf181b6a7dc41486b173af4f684c` |
| `2012.12916v1.pdf` | `249d390ad509bd70f0fa3f4c0f242f2fd951a231d825741d77b3340236af82a2` |

## Coverage and candidate inventory

| Local PDF | Pages seen | Visual contents | Measurement candidates and scope | Dominant limitations / lineage |
|---|---:|---|---|---|
| `1912.03230v1.pdf` (CM6, -5 C) | 24/24 | Figs. 1-17; no tables | pp.7-12 Figs.3-9: low-pressure and newer substrate coefficient data plus an R/H ensemble; pp.14-15 Figs.10-11: free-fall size histories and model-conditioned basal inference; pp.17-19 Figs.13-16: needle histories, coefficient inference, morphology panels, and five printed velocity pairs; p.20 Fig.17: Knight morphology interpretation | Figs.3-4 reuse the 2013 low-pressure experiment. Figs.5-9 are the newer substrate-apparatus family also documented by APP. Figs.10-11 reanalyse `[2009Lib]`, whose earlier coefficient analysis this paper calls largely incorrect. Figs.13-15 revisit `[2016Lib1]`, whose absolute analysis is explicitly called flawed; the growth-rate ratio is the more defensible observable. Fig.9 is selected and explicitly nonrepresentative; Fig.10 selected slender columns and did not record the full distribution. |
| `1912.09440v1.pdf` (APP) | 13/13 | Figs. 1-6; no tables | pp.10-12 Figs.4-6: one selected -5 C, 0.08-bar crystal, a 27-image growth/sublimation sequence, measured R(t)/H(t), and modeled supersaturation traces; p.11 prints the fitted `sigma0_basal=0.73%`, `sigma0_prism=0.20%`, `A_prism=0.25` | Apparatus/method paper, not a population data set. The supersaturation zero point is adjusted per crystal, early points are omitted, the forward analysis is described as subjective, and no uncertainty is printed for the three fitted values. The model is least reliable for thin plates/slender columns and does not reproduce sublimation. |
| `2004.06212v1.pdf` (CM7, -2 C) | 13/13 | Figs. 1-13; no tables | pp.5-6 Figs.3-4: low-pressure coefficient point clouds from two apparatus generations; p.6 Fig.5: reproduced 1989 near-vacuum data; pp.7-8 Figs.6-8: free-fall diameter/thickness histories, model-conditioned coefficient inversion, and reproduced cloud-chamber size curves; pp.9-11 Figs.9-12: needle morphology panels, inferred high-speed coefficients, and a directly measured single-needle R(t)/H(t) trajectory; p.12 Fig.13: modeled surface-supersaturation field | Figs.3 and 4 are distinct hardware/runs but the same author/fit framework, not wholly independent sources. Fig.5 and Fig.8 are secondary reproductions; use their originals for S3. The Fig.6 far-field supersaturations may be high by about 2x and the old coefficient inference is retracted. Fig.7 and Fig.10 are witness-surface/model conditioned. The low-speed Fig.10 point is explicitly not solid despite error bars. Fig.13 is a fitted model diagnostic, not a measurement. |
| `2009.08404v2.pdf` (CM8, -14 C focus) | 18/18 | Figs. 1-19; no tables | pp.8-12 Figs.8-13: e-needle image sequences, R/H histories, and witness-surface coefficient estimates across far-field supersaturation; pp.13-15 Figs.14-18: -25 C/-10 C comparisons and a temperature sweep of inferred narrow-prism `sigma0`; p.16 Fig.19: direct radial growth velocity versus temperature at fixed far-field supersaturation, with peak `-14.15 +/- 0.15 C` | All central SDAK magnitudes are CAK/witness-surface inversions: surface supersaturation is not independently measured, only the basal/prism growth-rate ratio is directly constrained, and the paper allows about a factor-2 surface-supersaturation systematic for some morphologies. Low-supersaturation points have large uncertainty. Figs.10-18 are one e-needle apparatus/analysis family, not independent routes. Fig.19 constrains the apparatus-specific growth-rate peak, not directly the minimum of the inferred SDAK dip. |
| `2011.02353v1.pdf` (CM9, -4 C focus) | 12/12 | Figs. 1-8; no tables | p.6 Fig.4: one direct needle-growth series with captioned radial/axial speeds; pp.7-8 Figs.5-6: inferred basal-SDAK parameter versus temperature, inferred surface supersaturation, and measured basal/prism velocity ratio; pp.9-10 Figs.7-8: 0.5-128% far-field morphology sweep and inferred attachment-coefficient curves | The inversion assumes the broad-prism CAK curve, assumes nearby facets share surface supersaturation, and is explicitly called a bootstrap. Slanted needles receive an ad hoc 1.3x surface-supersaturation correction; droplet nucleation perturbed the chamber. SDAK-2 confounds the high-supersaturation regime. The broad-facet curves used as anchors are assumed exact for this analysis despite acknowledged uncertainty. |
| `2012.12916v1.pdf` (CM10, molecular mechanism) | 14/14 | Figs. 1-7; no tables | Fig.1 and Fig.3 restate source-model curves; Figs.2 and 4-7 are mechanistic schematics. pp.6-9 print order-of-magnitude molecular estimates such as `D_facet ~= 1e-7 m^2/s` and `x_SD ~= 100 nm` | No new empirical data series. This is a hypothesis/model paper whose central quantities are explicitly rough guesses, often uncertain by an order of magnitude or more. Use it for proposed mechanism and parameter-sensitivity scope, not as an independent measurement lineage. |

## Best S3 candidates, classified by what is actually observed

### More direct observables

- **APP Fig.6 (p.12):** one real R(t)/H(t) trajectory with modeled correction traces. Strong implementation/replay candidate, but single-crystal and fit-conditioned.
- **CM6 Fig.8 (p.12):** R/H histogram for all well-formed simple prisms in one sample. The caption exposes the filter: roughly 15 crystals/mm2 total and about 20% included; columnar crystals were absent. This is the cleanest ensemble-shape candidate in the batch, but it is substrate-grown and in-sample to the model lineage.
- **CM6 Fig.10 (p.14), CM7 Fig.6 (p.7):** free-fall size-versus-time observations. Preserve the raw geometric trajectories separately from the papers' later-disavowed coefficient analyses and uncertain far-field supersaturation labels.
- **CM6 Fig.14 (p.17), CM7 Fig.12 (p.11), CM8 Figs.9/11/13/14, CM9 Fig.4 (p.6):** single-crystal R/H histories from needle experiments. Useful trajectory diagnostics after geometry mapping; not independent across papers.
- **CM6 Fig.16 (p.19):** five printed basal/prism tip-velocity pairs at 8-128% far-field supersaturation. Direct velocities are stronger than the Fig.15 coefficient inversion derived from them.
- **CM8 Fig.19 (p.16):** direct radial velocity versus temperature and the printed peak `-14.15 +/- 0.15 C`; retain its fixed far-field condition and apparatus lineage.
- **CM9 Fig.6 bottom (p.8):** measured basal/prism velocity ratio versus temperature. It is more direct than the inferred coefficient curves, though still a needle-geometry, in-sample diagnostic.

### Model-conditioned inversions

- **CM6 Figs.3/5/6:** coefficient curves inferred from low-pressure/substrate data; useful for source-model reconstruction. Figures 3-4 are the same underlying basal observations in corrected/uncorrected form and must not be counted twice.
- **CM7 Figs.3-4:** the best within-author, two-apparatus comparison at -2 C. Treat it as a reproducibility envelope, not two independent scientific lineages.
- **CM7 Figs.7/10, CM6 Figs.11/15, CM8 Figs.12/15/17/18, CM9 Figs.5/8:** all use a witness-surface or related CAK assumption to infer surface supersaturation and attachment coefficients. They can test transcription of the source's inversion, but cannot serve as model-independent validation of the inferred SDAK magnitude.

### Context-only or original-source-needed

- Photographic morphology panels are valuable for qualitative classification but often selected, projection-only, or history-dependent. Do not promote them to quantitative aspect-ratio evidence without a registered image measurement and selection protocol.
- CM7 Figs.5 and 8 and CM6 Fig.17 reproduce or interpret external studies (`[1989Sei]`, `[1987Kob]`, `[2012Kni]`). They identify separate lineages, but S3 should obtain and cite the original papers rather than digitize these secondary renderings.
- CM10 Figs.2 and 4-7 are explanatory diagrams, not data.

## Cross-paper lineage map

1. **2013 low-pressure interferometric lineage:** CM6 Fig.3-4 and CM7 Fig.3 are temperature slices/re-presentations of the same Libbrecht-Rickerby experimental program.
2. **New substrate apparatus lineage:** APP documents the method and one worked crystal; CM6 Figs.5-9 and CM7 Fig.4 use that apparatus family. These are separate runs but shared hardware, calibration logic, substrate systematics, and author analysis.
3. **Free-fall lineage:** CM6 Figs.10-11 (`[2009Lib]`) and CM7 Figs.6-7 (`[2008Lib1]`) are older free-fall data reanalysed after the author judged the original attachment-coefficient analyses substantially/largely incorrect.
4. **Electric-needle lineage:** CM6 Figs.13-16, CM7 Figs.9-13, CM8 Figs.7-19, and CM9 Figs.4-8 are different temperature/runs in the same broad apparatus and witness-surface modeling program. Temperature variation does not make these independent methods.
5. **External legacy lineages:** CM7 Fig.5 (`[1989Sei]`), CM7 Fig.8 (`[1987Kob]`), and CM6 Fig.17 (`[2012Kni]`) are potentially independent authors/data, but only secondarily reproduced or qualitatively interpreted here.
6. **CM10:** synthesis/hypothesis built from the preceding measurement/model family; no new independent observations.

## Cross-check against `research/libbrecht-papers-extracts.md`

The existing extraction is substantively strong for these six sources: figure numbering/pages, the main digitization candidates, the witness-surface limitations, the APP missing-minus-sign typo, the CM8 -4/-5 C dip-location disagreement, and the CM10 uncertainty language all visually check out.

Items to correct or clarify before formal reuse:

1. **CM7 version metadata:** the coverage table and inspected local filename say `2004.06212v1`, but the extraction's section 9A says the CM7 file is v2. That sentence is inconsistent with the inspected artifact.
2. **CM8 Fig.18 axis wording:** the plot contains separate `sigma0_basal` and `sigma0_prism` series on one percent-valued y-axis. The extraction's slash-form `sigma0_basal / sigma0_prism` could be misread as a mathematical ratio; it is not a quotient plot.
3. **Additional S3-worthy direct-data companions:** the extraction's “Figures worth digitizing” list is intentionally selective, but the visual pass adds CM6 Fig.16's five printed velocity pairs, CM7 Fig.12's R/H trajectory, CM8 companion R/H plots (especially Figs.13-14), and CM9 Fig.4/Fig.7 as useful direct-observable or morphology-context candidates. Their coefficient-inference companions remain model conditioned.
4. **APP p.11 source typo independently visible:** both printed exponential laws omit the expected minus sign. Preserve “as printed”; do not silently repair it during transcription.
5. **CM10 p.8 likely missing negation independently visible:** the sentence says the diffusion length “does change by an extremely large factor” immediately after saying two factors cancel. Preserve and flag the printed wording rather than correcting it silently.

## What remains for S3

- Register candidate figures before digitization, including axis transform, pixel-to-data calibration, symbol/curve separation, uncertainty-bar handling, and a no-double-count lineage key.
- Transcribe captions/prose and independently recompute any derived value from the published bytes.
- Acquire original papers for secondary reproductions before treating their data as independent evidence.
- Do not treat these sources as held-out evidence for a model whose parameter curves/SDAK forms were built from the same measurements.
