# Phase 8 offline visual audit — Libbrecht, *Snow Crystals*

## Source and audit status

- **Citation:** Kenneth G. Libbrecht, *Snow Crystals*, arXiv:1910.06389v2, revised 2021 (self-published 2019/2021 PDF).
- **Canonical source:** `/Volumes/snowcrystal/research-cache/content/1910.06389v2.pdf`
- **Source SHA-256:** `f6cd58ab841f841bcc310d2f722459122f7850cda9681ae0c7d1877bf21ef471`
- **Source size:** 25,611,913 bytes.
- **Extent:** 523 PDF pages.
- **Visual coverage:** 523/523 pages inspected, with no missing page renders.
- **Existing page renders checked:** `page-0001.png` through `page-0523.png`, exactly 523 files.
- **Existing searchable bundle checked:** 523 page-text files, 376 extracted figure records, and 279 figure-page renders under `1910.06389v2-llm/`.
- **Network activity:** none. This was an offline-only audit of material already on the NAS.
- **Modification status:** the source PDF, NAS derivatives, and repository were not changed.

The complete visual pass used nine contiguous contact sheets covering PDF pages 1–64, 65–128, 129–192, 193–256, 257–320, 321–384, 385–448, 449–512, and 513–523. Measurement-dense regions on pages 137–176, 223–322, and 328–367 were inspected again at higher resolution. Table 2.1 on PDF page 58 was inspected at full-page resolution.

## Overall evidentiary verdict

This monograph is a high-value **discovery, synthesis, and cross-reference source**, but it is not one independent experimental campaign. It combines:

1. the author's own measurements and images from several campaigns;
2. reanalyses and model-dependent reconstructions of those measurements;
3. figures reproduced from other investigators;
4. theory, numerical examples, apparatus diagrams, natural-crystal photographs, and historical context.

The book therefore identifies a strong Phase 9 candidate set, especially in Chapters 7 and 8, but a formal measurement record should cite and reconcile the underlying primary paper whenever one is named. Multiple figures from the same apparatus, paper, or later reanalysis are one evidence lineage, not independent confirmations. Measurements that helped fit a project input must not also be presented as held-out validation without an explicit calibration/validation split.

The monograph does not by itself close source currency. Its copyright page notes a newer Princeton University Press edition, while this NAS copy is the 2021 revision of the arXiv/self-published text. The relationship between those editions remains an offline provenance question.

## Chapter-wide disposition

| Chapter | Material visually reviewed | Measurement disposition for Phase 8/9 |
|---|---|---|
| 1 | Natural photographs, historical morphology, Nakaya-style diagrams, introductory process descriptions | Mostly context or secondary synthesis. Conditions and lineage are generally insufficient for numeric confrontation. |
| 2 | Thermodynamic and transport quantities, vapor-pressure curves, terrace energetics | Contains valuable reference inputs, but most plotted quantities are authoritative-reference data plus project/book calculations rather than a new campaign. |
| 3 | Growth-rate plots, free-fall morphology statistics, e-needle images, sublimation sequences, analytic comparisons | Mixed direct measurements, model overlays, and secondary reproductions. Several useful quantitative and behavioral targets require primary-paper tracing. |
| 4 | Broad-facet kinetics, structure-dependent kinetics, pressure comparisons, fitted temperature curves | Central synthesis of measurements and inferred kinetic laws. Much of the plotted horizontal coordinate or fitted parameter is model reconstructed. Treat as calibration evidence unless held-out cases are separated. |
| 5 | Diffusion, morphology, cellular-automaton and analytic examples | Predominantly theory/model output. A few empirical comparison images are useful qualitative controls. |
| 6 | Laboratory apparatus and diagnostics, free-fall calibration, interferometry, microscopy | Valuable method and uncertainty evidence; numeric plots are a mix of direct calibration and secondary reproduction. |
| 7 | Substrate-grown and free-fall growth measurements across temperature, pressure, and supersaturation | Highest-value quantitative compilation. Direct observables coexist with diffusion-corrected surface conditions and fitted parameters. |
| 8 | Electric-needle chamber measurements, temperature profiles, systematic morphology matrix, time histories | Highest-value systematic image and trajectory set. Strong Phase 9 targets, but seed geometry and same-author parameter lineage matter. |
| 9 | Plate-on-pedestal recipes, time-dependent temperature/supersaturation schedules, branching and competition | Direct author observations, useful for history-dependent qualitative tests. Apparatus is explicitly not a precision local-condition instrument. |
| 10 | Classification and photography | Context only for this purpose; generally no controlled growth conditions. |
| 11 | Optical and melting observations | Optical metrology may inform image interpretation; melting lies outside the vapor-growth experiment scope. |
| 12 | Ice grown from liquid water | Outside the stated vapor-grown atmospheric-ice scope, even where quantitative plots are present. |

## Measurement-bearing inventory

Page locators below give PDF page first and printed page second where visible. “Direct” means an observable was experimentally recorded; it does not imply the plotted quantity is free of reconstruction or that the monograph is the primary publication.

### Physical reference inputs and thermodynamics

| Locator | Variables and conditions | Evidence class and lineage | Phase 9 use and limitations |
|---|---|---|---|
| Table 2.1, PDF 58 / print 57 | Temperature from −40 to 0 °C in 1 °C rows; water and ice vapor pressure; saturated vapor number density; water supersaturation relative to ice; kinetic velocity; dimensionless transport quantities; kinetic length; printed diffusion coefficient factor | **Mixed reference and derived.** Vapor-pressure entries are attributed to Mason (1971); the surrounding prose says the other columns are calculated. | Useful for exact cross-checks and dimensional tests, but calculated columns must be regenerated from named formulas and constants rather than admitted as independent measurements. |
| Figs. 2.13–2.14, PDF 59–60 | Ice/water vapor pressure versus temperature; Arrhenius fits; derived excess over ice saturation | **Reference data plus fit/derivation.** | Useful for checking thermodynamic mappings. Not a morphology-validation dataset. |
| Fig. 2.15, PDF 61 / print 60 | Basal and prism terrace step energy versus temperature under near-vacuum conditions | **Derived experimental parameter**, based on growth measurements cited to the author's 2013 work. | Relevant to nucleation-law provenance. The plotted energy is inferred, not directly observed, and shares lineage with later kinetic fits. |

### Chapter 3 growth, free-fall morphology, and geometry

| Locator | Variables and conditions | Evidence class and lineage | Phase 9 use and limitations |
|---|---|---|---|
| Fig. 3.20, PDF 100 / print 99 | Radial growth of thin ice needles versus temperature/velocity-related coordinate; particle-only and particle-plus-heat diffusion comparisons | **Direct measurements plus analytic overlays**, cited to the author's 2016 cylindrical-growth work. | Quantitative transport/heating check. It shares apparatus and analysis lineage with Chapter 8 cylindrical results. The text gives approximate latent-heating factors near 0.8 at −1 °C and 0.4 at −10 °C, decreasing at colder temperatures and roughly inversely with pressure. |
| Fig. 3.24, PDF 106 / print 105 | Free-dendrite tip velocity near −15 °C versus far-field supersaturation | **Direct measurements plus theoretical inference**, including the author's 2002 data and later measurements. | Strong dendrite-speed target. The displayed empirical line is approximately 5 micrometers per second per unit far-field supersaturation. Tip-radius and selection-parameter products discussed in prose are derived, not independently measured. |
| Figs. 3.39, 3.47–3.48, PDF 119–123 | E-needle hollow plate near −16 °C at 16%; cup/fins near −7 °C; I-beam near −9 °C at 16% | **Direct condition-labeled morphology images.** | Useful categorical morphology checks, but isolated images do not establish prevalence or uncertainty. Seed geometry differs from compact-seed simulations. |
| Figs. 3.59–3.61, PDF 130–131 / print 129–130 | Free-fall chamber at −10 °C and far-field supersaturation about 1.4%; hexagonality statistic from six arm lengths; triangularity statistic on selected crystals; Monte Carlo overlay | **Direct image-derived morphology distribution plus derived statistical/model analysis**, cited to 2009 author work. | Valuable distribution-level target that is stronger than cherry-picked images. Sample count is not printed on these pages and must be recovered from the primary source. Selection into the triangular subset must be preserved. |
| Fig. 3.62, PDF 132 / print 131 | E-needle trident morphology at −5 °C at far-field supersaturation settings 32% and 64% | **Direct qualitative occurrence observation.** | Candidate categorical target. The text says more than half at the lower setting showed the trident form, but no denominator is printed; do not convert it into a rate without the primary record. |
| Figs. 3.64–3.66, PDF 133–135 | Negative-crystal growth at −14 °C in a 0.45 mm capillary; plate-on-pedestal growth-to-sublimation sequences | **Secondary reproduction** for the negative crystal; **direct but incompletely conditioned** for the author's sequences. | Geometry/process context. Insufficient as a quantitative gate without primary conditions and timing. |

### Chapter 4 broad-facet and structure-dependent kinetics

| Locator | Variables and conditions | Evidence class and lineage | Phase 9 use and limitations |
|---|---|---|---|
| Fig. 4.4, PDF 145 / print 144 | Growth velocity versus reconstructed surface supersaturation at −15 °C; terrace-nucleation fit | **Direct velocity measurements with transport reconstruction and fit**, cited to 2013 author work. | Important kinetic calibration/check. Surface supersaturation is not a directly imposed local observable; preserve the reconstruction method and its uncertainty. |
| Figs. 4.5–4.6, PDF 145–146 | Smooth temperature functions for broad basal/prism nucleation scales and fit prefactors; inferred terrace step energies | **Derived synthesis.** | These are parameter mappings, not held-out observations. Their source points and smoothing choices must be traced before use. |
| Fig. 4.8, PDF 148 / print 147 | Blocky plate on a c-axis needle in air at −0.5 °C; reconstructed surface supersaturation about 0.1% | **Direct image plus model-based local-condition interpretation.** | Qualitative habit target near melting. Local surface condition is reconstructed and should not be treated as a directly controlled independent variable. |
| Figs. 4.12–4.17, PDF 153–160 | Structure-dependent/curvature-dependent kinetic mechanisms and illustrative response curves | **Hypothesis and model.** | Mechanistic hypotheses and candidate experiment designs, not measurements. Do not score a solver against these as though they were observations. |
| Figs. 4.18–4.21, PDF 163–165 | Low-pressure measurements at −5 °C for basal/prism facets; low-pressure thin plates; air-grown hollow columns; e-needle morphology ladder at far-field settings 4, 8, 16, 32, 64, 128% | **Direct measurements/images plus fitted interpretation**, mostly same-author campaigns. | Strong temperature/pressure/morphology constraints. The low-pressure versus air comparison changes apparatus and geometry along with pressure, so it does not isolate a pressure effect. The e-needle ladder is same-lineage with Chapter 8. |
| Figs. 4.23–4.24, PDF 167–169 | Approximate −5 °C free-fall analysis; four −2 °C experimental configurations spanning substrate, low pressure, e-needle witness-surface, and free fall | **Compiled direct data plus substantial model inference.** | Useful consistency web, not four automatically independent replications. Each apparatus has distinct transport corrections and shared author assumptions. |
| Figs. 4.26–4.27, PDF 173 | Effective prism kinetic dip near −14 °C and basal dip near −4 °C versus temperature | **Derived effective parameters**, citing 2020 primary papers. | High-priority source leads because these papers post-date much of the earlier synthesis. Use the primary curves, fitting protocol, and uncertainty rather than digitizing the book figure if obtainable. |

### Chapter 5 empirical comparisons embedded in model discussion

| Locator | Variables and conditions | Evidence class and lineage | Phase 9 use and limitations |
|---|---|---|---|
| Fig. 5.14, PDF 185 / print 184 | Sidebranch mergers in plate-on-pedestal growth | **Direct qualitative observation.** | Behavioral topology check only; conditions are inadequate for a numeric gate. |
| Figs. 5.24–5.25, PDF 203–204 | E-needle plate observations compared with a two-dimensional cellular model; blocky prism near −10 °C with little basal hollowing | **Direct images/data combined with model output.** | Useful artifact-control examples: the simulation should not receive credit for a morphology caused by an acknowledged model artifact. The empirical portion repeats other author lineages. |

### Chapter 6 metrology, calibration, and free-fall methods

| Locator | Variables and conditions | Evidence class and lineage | Phase 9 use and limitations |
|---|---|---|---|
| Figs. 6.14–6.15, PDF 229–230 | White-light and laser interferometry configurations | **Measurement method.** | Documents how thickness/velocity observables are obtained and which observables are direct; not itself an outcome dataset. |
| Figs. 6.16–6.20, PDF 230–233 | Terrace and surface microscopy observations from several cited groups | **Mostly secondary reproduction.** | Source-discovery leads for step dynamics and surface structure. Primary-paper rights, conditions, and measurements must be reconciled separately. |
| Fig. 6.22, PDF 235 / print 234 | Diameter and thickness after 200 s of free fall in air, reproduced from Yamashita via a 1987 source | **Numeric but secondary reproduction.** | Useful historical size target. The same data reappear in Fig. 7.21; count once, and resolve the original experiment and units before formal admission. |
| Fig. 6.24, PDF 236 / print 235 | Free-fall chamber supersaturation versus reservoir temperature at chamber temperatures −5, −15, and −20 °C; differential-hygrometry points and empirical model | **Direct apparatus calibration plus fit**, cited to 2008 author work. | Necessary provenance for free-fall supersaturation. It is a chamber calibration, not a local crystal-surface measurement. |
| Fig. 6.25, PDF 237 / print 236 | Free-fall images at −2, −5, and −15 °C, with 50 micrometer scale | **Direct author imagery.** | Demonstrates chamber inhomogeneity and morphology spread; useful uncertainty evidence rather than a clean point target. |
| Fig. 6.26, PDF 238 / print 237 | Laminar-flow observations from a 1999 cited source | **Secondary reproduction.** | Source lead only until primary details are recovered. |
| Figs. 6.38 and 6.40, PDF 244–246 | Oriented capillary growth from roughly 3 mm to 12 mm; negative crystal at −14 °C in a 0.45 mm capillary | **Direct but incompletely conditioned** for the author image; **secondary** for the negative crystal. | Scale/geometry context; not a quantitative validation record as presented. |

### Chapter 7 quantitative growth measurements

| Locator | Variables and conditions | Evidence class and lineage | Phase 9 use and limitations |
|---|---|---|---|
| Fig. 7.6, PDF 256 / print 255 | Substrate supersaturation calibration using stable water droplets versus temperature offset | **Direct calibration plus no-adjustable-parameter thermodynamic comparison.** | High-value input uncertainty. The text reports absolute supersaturation zero uncertainty about 0.001, corresponding to a temperature-offset uncertainty about 0.01 °C; calibration becomes harder near melting. |
| Figs. 7.8–7.12, PDF 259–262 | Individual thin-plate time sequence near −12 °C; radius/thickness and basal/prism velocities versus time or substrate supersaturation; white-light and direct imaging | **Direct size/time/velocity observations.** | Strong trajectory and facet-rate targets. Chamber/substrate supersaturation and reconstructed surface supersaturation are distinct; both must be retained. |
| Fig. 7.13, PDF 263 / print 262 | Corrected and uncorrected kinetic response; diffusion correction grows at high rate | **Direct velocity with model-derived correction.** | Use raw observables for an independent solver confrontation where possible. At the highest rate, reconstructed surface supersaturation is roughly half the far-field value, making conclusions correction-sensitive. |
| Fig. 7.14, PDF 264 / print 263 | One −12 °C basal velocity curve and histogram across 23 crystals | **Direct velocities plus fitted nucleation scale.** | Valuable replicate distribution. The single-crystal fit is reported as 2.3 ± 0.2%; the weighted mean across 23 crystals as 1.95 ± 0.15%. These are fitted parameters, not direct observables. |
| Fig. 7.15, PDF 264 / print 263 | Prism growth velocity versus reconstructed surface supersaturation at −15 °C and 20 mbar; speeds approaching 1 micrometer/s | **Direct velocity plus fit.** | Low-pressure kinetic target with reduced diffusion effects. The reported fitted nucleation scale is 3%; primary data and pressure uncertainty should be recovered. |
| Fig. 7.16, PDF 265 / print 264 | Aggregate −12 °C results before and after diffusion correction | **Compiled direct observations plus reconstruction.** | The caption refers to 23 crystals while nearby prose refers to 12 separate crystals. This internal inconsistency must be resolved against the primary paper before a formal record is frozen. |
| Figs. 7.17–7.19, PDF 265–267 | Basal kinetic response at four temperatures; fitted nucleation scales and prefactors versus temperature; alternative refit fixing prefactor to unity | **Fit-parameter synthesis and sensitivity analysis.** | Important uncertainty/model-identifiability evidence. The author retains the original fit while explicitly stating that the all-unity-prefactor interpretation is not excluded. Do not treat the smooth parameter curves as exact measured truth. |
| Fig. 7.21, PDF 269 / print 268 | Crystal size after 200 s in air versus far-field supersaturation: −5 °C columns and −10 °C plates; author points plus Yamashita-derived points | **Mixed direct and secondary data.** | Useful size/habit trend. Both habits become more isometric with increasing supersaturation. Keep the two source lineages separate and do not treat the book's juxtaposition as a replication protocol. |
| Figs. 7.22–7.23, PDF 270–271 | Free-fall size versus fall time at several far-field supersaturations, at −5 °C and −10 °C; each paired size point is one crystal | **Direct measurements**, cited to 2009 author work. | Strong time/size targets with real dispersion. Crystal sizes vary by roughly a factor of two, plausibly from chamber spatial variation. At 6.5% far-field supersaturation the correction is roughly as large as the far-field value, so the author considers inferred surface kinetics unreliable even if the measured size data remain usable. |
| Figs. 7.24–7.25, PDF 273–274 | Inferred prism kinetics under a “well-behaved basal” assumption; comprehensive pressure-dependent model | **Explicitly speculative/model-dependent derivation.** | Hypothesis-generation only unless independently tested. Basal pressure invariance is described as uncertain, so the derived prism pressure response cannot serve as ground truth. |
| Fig. 7.26, PDF 275 | Proposed apparatus | **Experiment proposal, no outcome data.** | Potential Phase 9 design input, not evidence. |

### Chapter 8 electric-needle systematic morphology and trajectories

| Locator | Variables and conditions | Evidence class and lineage | Phase 9 use and limitations |
|---|---|---|---|
| Fig. 8.6, PDF 289 / print 288 | Electric drive voltage versus dendrite tip velocity at −15 °C | **Direct measurement**, cited to 1998 author work. | Quantitative apparatus-response lead. Voltage is not itself the physical boundary condition, so primary calibration is required. |
| Fig. 8.7, PDF 290 / print 289 | Tip velocity versus supersaturation at −5 °C for normal, non-c-axis, and c-axis needles | **Direct measurements**, cited to 2002 author work. | Useful orientation/seed-geometry comparison. Preserve category definitions and replicate counts from the primary source. |
| Figs. 8.12, 8.14–8.15, PDF 296–299 | Measured temperature profiles in two diffusion chambers and finite-element supersaturation field model | **Direct thermal calibration plus numerical field reconstruction.** | Governs the uncertainty of every chamber setting. The second chamber's center thermistor is reported accurate to ±0.1 °C. Supersaturation at the crystal is model derived. |
| Fig. 8.16, PDF 302–307 / print 301–306 | Five-page morphology matrix: temperatures −0.5, −1, −2, …, −18, and −21 °C crossed with nominal far-field supersaturation 128, 64, 32, 16, and 8%; 100 nominal cells, with three absent/melting entries in the existing index | **Direct systematic image set** from the second diffusion chamber/e-needle apparatus. | Top-priority morphology dataset. Existing tracked records enumerate the 100 nominal cells. Cropping and scale vary; needles are at least about 30 micrometers and the largest plates about 1.5 mm. Growth time varies from roughly 5 minutes at high settings to 30 minutes at low settings, not a per-tile controlled common clock. Seed geometry differs sharply from a compact seed, and chamber supersaturation is modeled rather than a measured local surface condition. |
| Fig. 8.17, PDF 309 / print 308 | Single-needle radius versus time at −2 °C, measured 100 micrometers below the tip | **Direct trajectory.** | Quantitative cylindrical-growth target, with geometry/location explicitly defined. One specimen is not a population distribution. |
| Figs. 8.18–8.19, PDF 310 / print 309 | Radial velocity at radius 5 micrometers versus chamber temperature offset at −2 °C and −15 °C; particle-only and particle-plus-heat models | **Direct velocities plus fitted thermal/kinetic model**, cited to 2016 author work. | Useful coupled transport/kinetics test. The cylindrical boundary logarithm is estimated to about 20% accuracy, limiting parameter inference. |
| Figs. 8.21–8.27, PDF 312–315 | Plate-on-needle growth at −15 °C for nominal far-field settings 11%, 7%, and 4.6%; face/side images; plate radius, needle radius, and axial height versus time; modeled cross-sections | **Direct single-specimen trajectories plus model fits.** | Top-priority history-resolved target. There is one representative specimen per setting. In the 11% case, the modeled boundary setting is fitted to about 5% using a witness surface, so the fit is not an independent test of the nominal chamber value. |
| Figs. 8.29–8.31, PDF 318–319 | Plate/column evolution at −5 °C and nominal far-field supersaturation 1.8%; radial and axial time series; transition near 130 s from tapered to fully faceted; analytic model | **Direct images/trajectories plus analytic interpretation.** | Strong transition/history target. The observed transition coincides with slower radial and faster axial growth, but causal interpretation remains model dependent. |

### Chapter 9 plate-on-pedestal schedules and history effects

The chapter supplies direct images and repeatable recipes, but the author explicitly describes the apparatus as unsuitable for precision rate measurements or precisely known crystal-local conditions. Air flow, temperature gradients, supersaturation, droplets, substrate effects, and thermal contact all contribute uncertainty. Thermistors are stated to be better than ±0.1 °C absolute with regulation around ±0.01 °C; typical flow is 200–300 cubic centimeters per minute and growth spans about 20–60 minutes.

| Locator | Variables and conditions | Evidence class and lineage | Phase 9 use and limitations |
|---|---|---|---|
| Fig. 9.14, PDF 345 / print 344 | Seed near 90 micrometers grown to a plate near 300 micrometers; initial temperature near −12.5 °C over a few minutes | **Direct recipe/image sequence.** | Qualitative schedule-replay target. Local supersaturation is not precision known. |
| Figs. 9.18–9.24, PDF 348–352 | Time-varying temperature/supersaturation recipes that initiate or suppress branches | **Direct history-conditioned morphology.** | Valuable for testing whether the solver responds qualitatively to event order and duration. Not a numeric physical gate without calibrated local fields. |
| Fig. 9.28, PDF 355 / print 354 | Repeated cycles including roughly 30 seconds at lower supersaturation to thicken ribs | **Direct procedural observation.** | Candidate hysteresis/history test. Treat timing and morphology as approximate recipe evidence. |
| Figs. 9.36, 9.38–9.39, PDF 361–364 | Side-by-side twins, interference, and vapor competition | **Direct qualitative observations.** | Useful multi-crystal/competition phenomena, likely beyond an isolated single-crystal Phase 9 experiment. Conditions are not adequate for precise fitting. |

### Scope exclusions and contextual measurements

- Chapter 10 classification plates and most Chapters 1 and 11 natural photographs lack controlled growth conditions, clocks, or independent provenance sufficient for a measurement record. They may inform descriptive categories but not numeric validation.
- Fig. 11.7 shows a 27-second melting sequence just below 0 °C. It is direct but outside the vapor-growth target.
- Figs. 11.11–11.12 characterize optical resolution/instrumentation. They may constrain image-analysis uncertainty, not crystal-growth physics.
- Chapter 12 quantitative figures concern ice grown from liquid water. They were visually reviewed and deliberately excluded from the vapor-grown atmospheric-ice evidence set.

## Lineage and uncertainty controls required before Phase 9

1. **Trace primary sources.** For each admitted record, preserve the cited paper, figure/table locator, apparatus, date/version, and whether the monograph reproduces, redraws, averages, or reanalyzes it.
2. **Keep direct and reconstructed variables separate.** Radius, thickness, elapsed time, and recorded images are direct observables when the method says so. Crystal-surface supersaturation, effective kinetic parameters, step energy, and several chamber fields are fitted or transport-reconstructed quantities.
3. **Do not merge far-field, chamber-center, substrate, and crystal-surface supersaturation.** They are different quantities with different uncertainties and often a numerical model between them.
4. **Preserve campaign identity.** Chapters 3, 4, 7, and 8 repeatedly reuse the author's substrate, free-fall, low-pressure, and electric-needle campaigns. A later compilation or replot is not an independent experiment.
5. **Separate calibration from validation.** Broad-facet kinetic curves and structure-dependent prescriptions derived from these measurements cannot be validated by fitting the same points again. Candidate held-out data should differ by paper/campaign, not merely by a neighboring figure.
6. **Retain raw-observable uncertainty.** Free-fall sizes show roughly factor-two specimen variation; high-supersaturation surface reconstruction can become unusable; high-rate substrate points are diffusion sensitive; cylindrical boundary factors carry about 20% uncertainty; chamber thermometry has stated absolute limits.
7. **Respect geometry.** Electric needles, c-axis needles, plate-on-pedestal seeds, free-falling embryos, and substrate-supported crystals are not interchangeable initial/boundary conditions. A mismatch must be labeled rather than absorbed into a morphology score.
8. **Resolve the Fig. 7.16 count inconsistency.** The monograph's caption and nearby prose give different crystal counts. The primary paper must decide the record.
9. **Preserve image metadata.** Fig. 8.16 has variable scale/crop and only a broad growth-time rule; it should not be converted into a common-time/common-scale numerical image set without more source metadata.
10. **Audit rights per component.** The copyright page permits certain noncommercial scholarly uses of author-created content but notes that separately sourced material may have distinct rights. Keep source bytes private on the NAS; assess redistribution rights for each derived image or numeric extraction.

## Phase 9 readiness and recommended priority

The monograph audit is complete enough to move from discovery to **primary-source reconciliation and formal record construction**. It is not, by itself, a license to treat every plotted curve as measured ground truth.

Recommended order:

1. **Formalize Chapter 7 direct observables:** substrate time histories, facet velocities, replicate distributions, free-fall size/time points, calibration error, and raw-versus-corrected forms.
2. **Formalize Chapter 8 systematic records:** the 100-cell morphology matrix, the −15 °C plate-on-needle trajectories, the −5 °C transition trajectory, and chamber calibration/model provenance.
3. **Recover the primary sources behind Chapter 4's temperature-dependent kinetic synthesis**, especially the 2020 papers, and mark every curve as fit input, derived result, or possible held-out comparison.
4. **Use Chapter 3 distributional morphology and dendrite speed as separate behavior targets** only after sample counts and primary conditions are resolved.
5. **Keep Chapter 9 as qualitative schedule/history evidence** unless better local-condition calibration exists in a primary source.
6. **Use Chapters 1, 5, 10, 11, and 12 mainly for context, mechanisms, artifact warnings, or explicit scope exclusions.**

For Phase 9 experiment design, the strongest near-term targets are not isolated “looks similar” images. They are measured trajectories, rate-versus-condition curves with explicit reconstruction uncertainty, replicate distributions, and the systematic Fig. 8.16 morphology grid. The latter is especially useful for categorical habit coverage, while the Chapter 7/8 time series are better for quantitative confrontation.

## Remaining gaps

- **Visual inspection gaps:** none; all 523 PDF pages were covered.
- **Numerical extraction gap:** curves and error bars have not been formally digitized in this audit.
- **Primary-source gap:** reproduced or reanalyzed figures still need paper-level reconciliation before admission to the formal Phase 8 dataset.
- **Metadata gap:** several image sequences lack per-specimen time, common scale, replicate count, or calibrated local surface condition in the monograph.
- **Currency gap:** the newer book edition has not been compared with this 2021 revision.
- **Rights gap:** third-party figure reuse and redistribution terms have not been resolved component by component.

These are evidence-construction gaps, not page-review gaps. No additional broad search is needed to understand what this monograph contains; any follow-up should be narrowly targeted to its cited primary papers and missing record fields.
