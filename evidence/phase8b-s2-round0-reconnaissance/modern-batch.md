# Phase 8B modern-source full-text measurement-unit reconnaissance

Status: **detailed S2 full-text eligibility and measurement-unit reconnaissance; not a formal S3 independent pass.** The cumulative source set was not frozen when this review was assigned, so these provisional unit boundaries must not be described as a blinded or independent S3 result.

Scope: the nine already-acquired PDFs in `/Volumes/snowcrystal/research-cache/phase8b-search/acquired-sources-20260811-v1/`. No network retrieval was performed. Each PDF was extracted with `pdftotext`, rendered page-completely, and every rendered page was visually inspected. Page numbers below are **PDF page numbers**, not printed journal pagination.

## Headline inventory

- 9 PDFs; 114/114 pages visually inspected.
- 68 labeled figures and 3 labeled tables (71 display containers) enumerated below.
- 60/71 display containers contain primary, reused, or mixed measurement content; the other 11 are setup, simulation, mechanism, or conceptual displays and are retained below as explicit exclusions.
- Provisional current-target disposition: 5 sources contain potentially eligible individual-crystal or individual-derived growth/sublimation units; 4 are specimen/observable/population mismatches but remain useful discovery or contextual sources.
- Four acquisition filenames do not match the PDF's actual lead author: `demmenie...` is Jambon-Puillet et al.; `neshyba...` is Magee et al.; `pfalzgraff...` is Voigtlaender et al.; `zhao...` is Feng et al. Do not propagate the filenames as citations.

Extraction-family vocabulary used below:

- `native-first`: obtain author data/supplement before digitizing the PDF.
- `table-transcription`: values are printed and can be transcribed with a second-person check.
- `plot-digitization`: values exist only as marks/curves in the PDF unless native data are recovered.
- `image-series`: calibrated or time-labeled images; quantitative image measurement needs the native frames and a predeclared calibration procedure.
- `prose-transcription`: a numerical result printed only in prose.
- `qualitative-index`: image/panel and conditions are indexable, but the article does not support a quantitative value.
- `model/secondary`: not a primary measurement unit from this source.

## 1. `cloud-growth-2025.pdf`

Actual source: Fuchs et al. (2025), *Quantifying ice crystal growth rates in natural clouds from glaciogenic cloud seeding experiments*. Pages: **20/20 inspected**. Full-text verdict: complete main article, appendices, and references; native data and plotting code are external (Zenodo DOI printed on p. 18) and were not acquired in this pass.

Provisional scope verdict: **mixed/include pending native-data inspection.** Major-axis lengths are measured on individually classified pristine crystals, but age is inferred from plume residence time and the PDF reports bins/distributions rather than individual records. Radar, bulk cloud microphysics, threshold tuning, and literature-comparison marks are contextual or secondary, not individual-crystal outcomes.

### Display and candidate-unit inventory

- **p. 4, Fig. 1 — explicit exclusion.** CLOUDLAB/UAV/tethered-balloon/radar schematic. Protocol only; no measurement series.
- **p. 4, Fig. 2a–d — context candidates `CG-F2a`–`CG-F2d`.** One representative seeding experiment (SE3, 25 Jan 2023, seeding near -5.5 C, approximately 8 min residence): (a) radar reflectivity time-height curtain; (b) cloud-droplet and ice-crystal number-concentration time series; (c) LWC-versus-CDNC points and regression; (d) CDNC-versus-ICNC points and regression. Units are those printed on axes (dBZ/height/time, cm^-3, L^-1, and g m^-3). Sample is the SE3 plume time series, not individual crystals. Uncertainty is not plotted. Family `native-first`; bulk-context only.
- **p. 5, Fig. 3a–b — context candidates `CG-F3a`–`CG-F3b`.** (a) retrieved horizontal wind speeds from HOLIMO, remote sensing, radar HTI, and radar PPI for the 14 experiments, m s^-1; (b) corresponding residence time per experiment, min. Atomic series are the four named wind-retrieval methods and one 14-experiment residence-time series. No displayed uncertainty. Family `native-first`; inputs to inferred age, not crystal-growth outcomes.
- **p. 7, Fig. 4a–d — primary candidate families `CG-F4a-SE01..14`, `CG-F4b-SE01..14`, and `CG-F4c/d-SE01..14`.** Fourteen experiment-specific binned mean major-axis growth-rate series (micrometres s^-1) versus (a) LWC, g m^-3; (b) CDNC, cm^-3; and (c,d) ICNC, L^-1. Panels c and d are alternate log/linear views of the same ICNC relationship and must not become duplicate units. Bin widths: 0.05 g m^-3, 80 cm^-3, 10 logarithmic ICNC bins, and 50 L^-1 linear ICNC bins; values shown only for >10 crystals, with 10–25-crystal bins unfilled. Series are condition-labeled by SE1–SE14 and temperature; solid/dotted marks distinguish weak/strong riming. Family `native-first`, otherwise `plot-digitization`. Candidate unit boundary is one experiment x one independent predictor relationship; do not count c and d twice.
- **p. 7, Fig. 5 — context candidates `CG-F5-all-rimed` and `CG-F5-pristine`.** Two size distributions for SE9, one combining rimed and pristine crystals and one restricted to pristine crystals; diameter in micrometres and concentration on the ordinate, with means marked. No uncertainty. Family `native-first`; sampling-bias diagnostic.
- **p. 9, Fig. 6a–c — derived aggregate candidates `CG-F6-LWC`, `CG-F6-CDNC`, `CG-F6-ICNC`.** All weak-riming experiments pooled after normalizing each crystal's rate by its experiment mean: 2-D count distributions and vertical-bin means versus LWC, CDNC, and ICNC. Solid black bars are +/-1 standard deviation. Sample is pooled individual pristine-crystal records; n varies by bin and is encoded by counts. Family `native-first`; derived threshold-selection evidence rather than an independent growth experiment.
- **p. 10, Fig. 7a–i — derived threshold-series candidates.** `CG-F7a..c-CDNC25,50,75,100,125` are five CDNC-threshold fit series in each of the LWC, CDNC, and ICNC panels; `CG-F7d..f-ICNC400,140,100,90,80` are five ICNC-threshold fit series in each panel; `CG-F7g..i-C100/I100,C125/I100,C100/I90,C125/I90` are four joint-threshold fit series in each panel. LWC/CDNC use linear fits, ICNC exponential fits; shaded bands are 95% confidence intervals. These are 42 condition-labeled fit series derived from the same pooled records, not 42 independent experiments. Family `native-first`; otherwise plot/Table B1 transcription.
- **p. 11, Fig. 8 — primary/derived candidates `CG-F8-raw-SE01..14`, `CG-F8-threshold-SE01..14`, `CG-F8-lucky-SE01..14`.** Per-experiment growth-rate box plots versus temperature: 14 raw distributions, 9 threshold-filtered distributions (five strong-riming experiments are not applicable), and 14 upper-size-tail/80th-percentile distributions. Box semantics: lower/upper quartile, median, mean, and 1.5-IQR whiskers. Four literature families (T91, R76, K12, C14) are secondary and must be separated. Units micrometres s^-1 and degrees C. Family `native-first`; secondary marks are `model/secondary`.
- **p. 14, Table A1 — 14 row-level condition/sample candidates `CG-TA1-SE01` through `CG-TA1-SE14`.** Each row records mission/time, temperature (degrees C), seeding distance (m), retrieved wind speed (m s^-1), residence time (s), total crystal count, pristine count, threshold-surviving count, and lucky-crystal count. Five rows (SE6, 7, 8, 9, 12) are strong-riming and have threshold count n/a. Family `table-transcription`, but native metadata should remain authoritative.
- **p. 15, Fig. B1 — 15 derived distribution cells `CG-FB1-C25/50/75/100/125 x LWC/CDNC/ICNC`.** Each cell contains the normalized count distribution, bin mean, +/-1 SD, fitted curve, and 95% CI. Same observations and threshold series as Fig. 7/Table B1; no new experiment. Family `native-first`.
- **p. 16, Fig. B2 — 15 derived distribution cells `CG-FB2-I400/140/100/90/80 x LWC/CDNC/ICNC`.** Same measurement and uncertainty semantics as B1; duplicate lineage to Fig. 7/Table B1. Family `native-first`.
- **p. 17, Fig. B3 — 12 derived distribution cells `CG-FB3-C100/I100,C125/I100,C100/I90,C125/I90 x LWC/CDNC/ICNC`.** Same lineage and uncertainty semantics. Family `native-first`.
- **p. 18, Table B1 — 15 row-level derived-fit candidates.** Rows are: none; CDNC >=25, 50, 75, 100, 125 cm^-3; ICNC <=400, 140, 100, 90, 80 L^-1; and four joint pairs (100/100, 125/100, 100/90, 125/90). Each row gives LWC slope and r-squared, CDNC slope and r-squared, and ICNC exponential a, b, c, with printed plus/minus fit uncertainty for slope/a/b/c. Family `table-transcription`; these are derived results linked to B1–B3, not independent measurements.

### Prose-only numerical-result candidates

- **pp. 1, 6, 11–12, `CG-P-growth-range`.** Reported major-axis rates span **0.17–0.81 micrometres s^-1** across 14 experiments at **-5.1 to -8.3 C**; maxima near -5.3 C are >0.6 micrometres s^-1 and values near -8.3 C are <0.2 micrometres s^-1. Sample is the experiment-level distributions above; no separate uncertainty. `prose-transcription`, linked rather than independent.
- **p. 11, `CG-P-filter-effects`.** Threshold-filtered values are approximately **13% higher** than raw values (except SE14); 80th-percentile/lucky values are approximately **48% higher**. Derived pooled comparisons, no printed confidence interval. `prose-transcription`.
- **pp. 6, 8–10, method/selection constants.** The 5.5 min flare window, CDNC >=100 cm^-3, ICNC <=100 L^-1, and 80th-percentile rule are analysis conditions, not standalone outcome units.

## 2. `demmenie-et-al-2018-singular-sublimation.pdf`

Actual source: **Jambon-Puillet, Shahidzadeh, and Bonn (2018)**, *Singular sublimation of ice and snow crystals*. Pages: **6/6 inspected**. Full-text verdict: complete main Nature Communications article; supplementary movies/notes/figures are referenced but absent. Filename-author mismatch must be corrected in any source register.

Provisional scope verdict: **exclude from the present atmospheric individual-crystal target.** The primary specimens are water drops frozen on a substrate (melt-grown pointy ice drops), not vapor-grown atmospheric crystals. The one snowflake sequence is explicitly adapted from Libbrecht and therefore secondary. Retain as a sublimation-physics analogue/discovery source.

### Display and candidate-unit inventory

- **p. 2, Fig. 1a–b — explicit secondary/model exclusion.** (a) adapted snowflake sublimation image sequence from Libbrecht; (b) 3-D simulation at radius 1.1 mm, thickness 0.2 mm, surface temperature -10 C, RH 0%. No primary measurement from this paper.
- **p. 3, Fig. 2 — candidate `JS-F2-drop`.** One time-labeled image trajectory of a pointy ice drop, initial volume 4.4 microlitres, surface temperature -10 C, RH 4.8%, scale 1 mm; frames at 0, 3, 15, 66, 183, 267, and 336 min plus final approximately 363 min in the accompanying sequence. Family `image-series`; no plotted uncertainty.
- **p. 3, Fig. 3 — candidate `JS-F3-Vt`.** One drop's volume-versus-time trajectory across supercooled-water and ice phases; surface temperature -15 C, RH 2.8%, freezing after 92 min. Red marks are observations; black line is analytic model. Volume/time units as plotted. Family `plot-digitization`; native movie preferred. Water-phase and ice-phase segments should remain distinguishable.
- **p. 4, Fig. 4a–d — candidate lineage `JS-F4-tip`.** (a) tip profiles every 2 min for the first half hour, one 3.5 microlitre drop at -12 C and RH 5.1%, 100 micrometre scale; (b) curvature-rescaled versions of those same profiles; (c,d) the same curvature-versus-time observations displayed linear and log-log for a -15 C, RH 4.6% run. Printed fit: curvature = A(t+t0)^-1/2, A=2.32e5 s^1/2 m^-1, t0=9 s. Atomic data series are the raw profile family and the curvature-time series; b and d are transformed/replotted views, not independent experiments. Family `native-first`, then `plot-digitization`/`image-series`.
- **p. 4, Fig. 5a–c — candidates `JS-F5-Vt`, `JS-F5-fluxR`, `JS-F5-Rt`, `JS-F5-Ht`, and `JS-F5-profiles`.** Same drop as Fig. 2: volume versus time; instantaneous volume flux versus radius inset; radius versus time; height versus time; and profiles every 15 min. Simulation/analytic curves are not measurements. Family `native-first`, then plot/image extraction. These series share one specimen and must not be treated as independent replicates.

### Prose-only numerical-result candidates

- **Methods/results, `JS-P-wettability`.** Experiments on substrates spanning contact angle **20–120 degrees** reportedly showed the same qualitative evaporation behavior; n and effect uncertainty are not stated. Discovery-only prose result.
- **Methods/calibration.** RH generally 1–7% with hygrometer accuracy +/-2%; tip-curvature radius accuracy +/-3–10 micrometres; thermal-camera limits +/-2 C and +/-100 micrometres. These are uncertainty/condition metadata for the figure units, not standalone results.

## 3. `lamb-et-al-2017-isotopic-fractionation.pdf`

Actual source: Lamb et al. (2017), *Laboratory measurements of HDO/H2O isotopic fractionation during ice deposition in simulated cirrus clouds*. Pages: **6/6 inspected**. Full-text verdict: complete main PNAS article; the SI Appendix containing experiment tables, fitting details, and additional figures is absent, so per-experiment unit construction is not yet auditable.

Provisional scope verdict: **exclude from the present individual-crystal morphology/growth target, retain as physical-property/context evidence.** It measures chamber-population vapor isotope evolution and inferred fractionation, not individual crystal size, shape, or trajectory.

### Display and candidate-unit inventory

- **p. 2, Fig. 1 — explicit exclusion.** AIDA/IsoCloud apparatus schematic; protocol only.
- **p. 3, Fig. 2 — candidate `LC-F2-expansion`.** One typical expansion as a synchronized multichannel block: pressure and temperature; ice-particle number density, total IWC (equivalent ppmv), and ice supersaturation; vapor isotope ratio over roughly 1000 s. Cooling lasts about 2 min and post-ice equilibration about 5 min. One experiment, multiple observables; uncertainties not shown. Family `native-first`.
- **p. 3, Fig. 3 — candidates `LC-F3-E27` and `LC-F3-E45`.** Vapor isotope ratio normalized to initial value versus remaining vapor fraction in log coordinates for experiments 27 and 45 at similar temperature but mean ice saturation 1.01 and 1.35. One-second data points; fitted slopes give effective fractionation. Family `native-first`; fit uncertainty is not plotted here.
- **p. 4, Fig. 4 — candidates `LC-F4-E01..E28` plus two global-fit blocks.** Twenty-eight individual-experiment equilibrium HDO/H2O fractionation estimates across 194–234 K; 2-sigma bars are individual-fit uncertainty. Black/purple global fits use one- and two-parameter wall-flux treatments; global shading is 3-sigma. M67 and E13 curves are secondary. Exact experiment labels/conditions require the missing SI. Family `native-first`; points may become 28 units only after SI/native row linkage.
- **p. 5, Fig. 5 — six derived blocks.** For each assumed diffusivity ratio d=1.0453, 1.0095, and 0.9736: a kinetic-factor-versus-deposition-weighted-supersaturation series and a retrieved temperature-fit-parameter-versus-supersaturation series. The open-diamond default-d calculation is a reprocessing of the same experiments. Error bars are propagated 1-sigma bounds. These are sensitivity analyses over shared experiments, not independent measurements. Family `native-first`.

### Prose-only numerical-result candidates

- **pp. 3–4, `LC-P-global-fit`.** Main analysis uses 28 experiments at **194–234 K**, mean ice saturation approximately **1.0–1.4**, and particle diameters **2–14 micrometres**. The fitted diffusivity ratio is **1.009 +/- 0.036**; fit coefficients printed in the article include **a0=-0.0559** and **a1=13525**. Link to Fig. 4/5 and SI, not independent units.
- **p. 4, `LC-P-surface-effect`.** With default d=1.0164, inferred surface parameter x=**0.957 +/- 0.22**; at d=1.0251, x=**0.924 +/- 0.22**. Derived sensitivity result, `prose-transcription`.

## 4. `libbrecht-2013-attachment-kinetics.pdf`

Actual source: Libbrecht (2013), *Toward a Comprehensive Model of Snow Crystal Growth Dynamics: 2. Structure Dependent Attachment Kinetics near -5 C*. Pages: **13/13 inspected**. Full-text verdict: complete arXiv preprint. Later source `libbrecht-2016-background-gas.pdf` explicitly retracts the pressure-invariance premise and the basal-terrace interpretation; this source's measurements may remain usable, but its headline physical interpretation cannot be inherited.

Provisional scope verdict: **include primary growth series with lineage/retraction warning.** Individual substrate-supported vapor-grown columns at -5.15 C are on target, but inferred surface quantities are strongly model- and boundary-condition-dependent and several displayed inputs are reused from earlier papers.

### Display and candidate-unit inventory

- **p. 4, Fig. 1 — candidates `L13-F1-0.03bar` and `L13-F1-1bar`.** Measured basal attachment coefficient versus far-field supersaturation at -5.15 C in 0.03 bar and 1 bar background gas, with theory curves. Sample count is not stated in the display; errors are described as experiment/model systematics in text rather than point bars. Family `native-first`, otherwise `plot-digitization`. Verify whether all low-pressure points originate in this experiment or prior source [6].
- **p. 5, Fig. 2 — secondary candidate/exclusion `L13-F2-prior`.** Prism attachment coefficient versus surface supersaturation at -5.15 C, explicitly from reference [6], with parameterized curves. Preserve as a cited-source lead, not a primary unit of this paper.
- **p. 6, Fig. 3 — candidate `L13-F3-image-sequence`.** One substrate-supported column growth sequence, about 60 micrometres long initially and 145 micrometres in the final image over 4 min. Qualitative morphology/image trajectory; `image-series`.
- **p. 9, Fig. 4 — candidates `L13-F4-H`, `L13-F4-R-interferometry`, and `L13-F4-R-imaging`.** One low-supersaturation crystal at -5.15 C, 1 bar, set far-field supersaturation 1%; half-length H(t), effective radius R(t) from interferometry, and R(t) from imaging. Initial R,H=(10.2,13.3) micrometres. Model curves use 0.29%, 0.44%, and 0.66% far-field values; these curves are derived, not observations. Family `native-first`/`plot-digitization`.
- **p. 10, Fig. 5 — no new measurement unit.** Replots the Fig. 4 observations against models with basal nucleation-barrier parameter 0.2%, 0.3%, and 0.45%. Index as duplicate lineage plus model sensitivity.
- **p. 11, Fig. 6 — candidates `L13-F6-H`, `L13-F6-R-interferometry`, and `L13-F6-R-imaging`.** One high-supersaturation crystal at -5.15 C, 1 bar, set far-field supersaturation 3.9%; H(t) and two R(t) methods, time shifted to hollowing onset. Initial R,H=(11.1,15.2) micrometres; inset cross-section at t=41 s. Model far-field values 1.6%, 2.4%, 3.6% are derived. Family `native-first`/`plot-digitization`.
- **p. 12, Fig. 7 — no new measurement unit.** Replots Fig. 6 against basal-barrier model values 0%, 0.025%, and 0.05%. Duplicate observation lineage, model sensitivity only.

### Prose-only numerical-result candidates

- **pp. 2–3, reused intrinsic parameters.** At -5.15 C the paper quotes prior intrinsic basal values (A=1 +/-0.3, barrier=0.75 +/-0.1%) and prism values (A=0.15 +/-0.05, barrier=0.17 +/-0.06%). These are secondary to reference [6], not new units.
- **pp. 8–12, `L13-P-low` and `L13-P-high`.** Low run: fitted far-field supersaturation 0.44%, inferred basal barrier about 0.3%. High run: fitted far-field 2.4%, inferred basal barrier about 0.025%, described as roughly tenfold below the low-run value and thirtyfold below prior intrinsic value; basal hollowing reported above set far-field supersaturation about 1.5%. These are model-conditioned results linked to Figs. 4–7. The later 2016 paper explicitly negates the claimed need for terrace-width-dependent basal kinetics.

## 5. `libbrecht-2016-background-gas.pdf`

Actual source: Libbrecht (2016), *The Effect of Background Gas on Snow Crystal Growth Dynamics: Observations and Theory*. Pages: **14/14 inspected**. Full-text verdict: complete arXiv preprint.

Provisional scope verdict: **include.** Primary individual vapor-grown needle/column trajectories and a small multi-crystal rate series are on target. Surface-attachment estimates are model-conditioned; sample counts for the multi-crystal plot are not given in text.

### Display and candidate-unit inventory

- **p. 3, Fig. 1 — candidate `L16-F1-high-image`.** One hollow-column image/trajectory example after 9 min at -5 C and center supersaturation approximately 3.7% (Delta-T=5 C). Image dimensions are calibrated; the graph is not shown here. Family `image-series`/qualitative.
- **p. 4, Fig. 2 — candidate `L16-F2-low-images`.** Calibrated optical time sequence for one low-supersaturation crystal at -5 C, Delta-T=2.5 C, center supersaturation 0.92%; images correspond to every other Fig. 3 point; scale line 100 micrometres. Same specimen as Fig. 3, not an extra replicate.
- **p. 5, Fig. 3 — candidates `L16-F3-R` and `L16-F3-H`.** Radius and height versus time for the Fig. 2 crystal. R starts at 3 micrometres; arbitrary H offset starts near 15 micrometres. Imaging uncertainty: R about +/-1 micrometre random and +/-5% absolute; H about +/-2 micrometres; center-supersaturation run variation +/-15%. Model curves with basal-barrier variants are derived. Family `native-first`/`plot-digitization`.
- **p. 7, Fig. 4 — candidates `L16-F4-R` and `L16-F4-H`.** One intermediate-supersaturation needle at -5 C, Delta-T=3.5 C, center supersaturation about 1.8%; radius and height trajectories with abrupt transition around 130 s (observed interval about 100–160 s). H offset starts near 10 micrometres. Same uncertainties as above. Family `native-first`/`plot-digitization`.
- **p. 8, Fig. 5 — no new measurement unit.** Replots Fig. 4 R(t) with model prism-prefactor values 0.005, 0.002, and 0.001. Duplicate data plus model sensitivity.
- **p. 9, Fig. 6 — explicit model exclusion.** Modeled supersaturation-versus-radius before and after the Fig. 4 transition; no observations.
- **p. 10, Fig. 7 — no new measurement unit.** Replots Fig. 4 H(t)/R(t) with two numerical models. Duplicate lineage.
- **p. 11, Fig. 8 — candidate `L16-F8-dHdt`.** Axial growth rate versus Delta-T for several needle crystals; at Delta-T=3 and 3.5 C, before/after-transition points are separately marked. Units are micrometres s^-1 and degrees C. Error bars are plotted, but n and their exact statistical definition are not stated in the main text. Family `native-first`/`plot-digitization`; each plotted crystal/transition state may become a row only after native-data recovery.

### Prose-only numerical-result candidates

- **pp. 6–7, `L16-P-transition`.** Across the Fig. 4 transition, radial growth falls by about **2x** and axial growth rises by about **4x**. Linked to one specimen and not an independent unit.
- **pp. 8, 12, `L16-P-prism-attachment`.** Best-fit prism attachment-coefficient prefactor approximately **0.002** at surface supersaturation near 1% and 1 bar, with overall uncertainty roughly **a factor of two**. This is an inversion/model-conditioned result, not a directly observed coefficient.
- **p. 10, thermal estimates.** Latent-heating estimates are about 0.2 C before and 0.06 C after transition; model estimates, not measurements.
- **pp. 11–12, qualitative regime limits.** At center supersaturation about 3.7%, R follows an approximate square-root-time law without transition; above about 15% the morphology becomes fishbone. No sample count or uncertainty, so retain as qualitative prose leads.
- **p. 12, interpretation correction.** The paper says the prior 2013 assumption of pressure-independent prism kinetics and its resulting basal-terrace conclusion were wrong. Any synthesis must carry this supersession relation.

## 6. `neshyba-et-al-2014-mesoscopic-roughness.pdf`

Actual source: **Magee, Miller, Amaral, and Cumiskey (2014)**, *Mesoscopic surface roughness of ice crystals pervasive across a wide range of ice crystal conditions*. Pages: **15/15 inspected**. Full-text verdict: complete article including Appendix Table A1; linked growth/sublimation videos are absent. Filename-author mismatch must be corrected.

Provisional scope verdict: **include qualitative/image units, with substrate and low-pressure qualifiers.** The ESEM supplies primary individual-crystal growth/sublimation images and a condition table; most results are qualitative, and most crystals are substrate-supported under non-atmospheric gas pressure. Transported diffusion-chamber crystals are closer to atmospheric provenance but remain qualitative.

### Display and candidate-unit inventory

- **p. 5, Fig. 1a–i — nine image-panel candidates `MG-F1a` through `MG-F1i`.** Different crystals/regions across magnification, temperature, vapor pressure, and growth/sublimation state, each linked to Table A1. Panels f and i mark roughness-profile regions. Observable is surface topography/roughness morphology, not a growth rate. Family `qualitative-index`; native images needed for quantitative profiles.
- **p. 6, Fig. 2a–d — candidate lineage `MG-F2a..d`.** Four increasing-magnification views of one growing hexagonal crystal; panel d reports ridge depth **1.592 micrometres**. Treat the four panels as one specimen/condition lineage, with the ridge-depth prose/value as its quantitative result. Family `image-series`.
- **p. 7, Fig. 3a–f — candidate `MG-F3-sequence`.** Time sequence, usually about 10 s between frames and 20 s between d/e, showing two pre-existing crystals that remain inhibited after a 0.3 C temperature decrease while nearby crystals nucleate/grow; constant vapor pressure, equivalent condition approximately 105% RHi. One field/sequence, not six replicates. Family `image-series`.
- **p. 8, Fig. 4a–d — four sublimation image candidates `MG-F4a` through `MG-F4d`.** Scalloped depressions, ridges, and peaks under the distinct Table A1 conditions; panel a began as polycrystalline ice. Family `qualitative-index`; panel a should be tagged specimen-class mixed/polycrystal.
- **p. 9, Fig. 5a–d — four transported-crystal candidates `MG-F5a` through `MG-F5d`.** Four different crystals grown at -50 C in a static diffusion chamber at 100–105% RHi and transported under cryogenic/vapor-matched conditions. Qualitative surface images; family `qualitative-index`.
- **p. 10, Fig. 6 — candidate `MG-F6`.** One growing crystal/region at 10,903x (with 1,903x locator inset), near a basal/prism intersection. The article reports sub-200 nm roughness visibility but no height series. Family `qualitative-index`.
- **p. 12, Table A1 — 28 condition-row candidates.** Explicit rows: Fig. 1a–i (9), Fig. 2a–d (4), Fig. 3a–f (6), Fig. 4a–d (4), Fig. 5a–d (4), and Fig. 6 main (1). Columns are magnification, vapor pressure (Pa, +/-0.5 Pa), substage temperature (degrees C, +/-0.1 C), calibrated surface temperature (degrees C, +/-0.3 C), and ice saturation ratio (+/-4%). Family `table-transcription`. Rows condition image panels; they are not automatically 28 independent specimens because repeated views/sequences exist.

### Prose-only numerical-result candidates

- **pp. 5–6, `MG-P-roughness-scale`.** Roughness heights are generally below 1 micrometre; profile metric values in the marked Fig. 1 regions are reported in the approximate 0.10–0.40 range. Quantitative use requires original profiles/native images.
- **p. 7, `MG-P-inhibition`.** Repeated inhibited-growth cases are reported below -30 C and above about 115% RHi; the illustrated 0.3 C perturbation did not restart the old crystals but did nucleate/grow neighbors. No n or effect uncertainty, so qualitative lead only.
- **pp. 10–11, resolution/calibration.** Typical image resolution is 2–3 pixels (roughly 50–75 nm in high-magnification cases); surface temperature confidence +/-0.3 C and saturation-ratio confidence about +/-4%. Metadata for image units.

## 7. `pfalzgraff-et-al-2018-growth-sublimation-roughness.pdf`

Actual source: **Voigtlaender et al. (2018)**, *Surface roughness during depositional growth and sublimation of ice crystals*. Pages: **16/16 inspected**. Full-text verdict: complete ACP article; supplemental calibration data and videos S1/S2 are referenced but absent. Filename-author mismatch must be corrected.

Provisional scope verdict: **include.** The paper has individual vapor-grown/sublimated crystal size and roughness trajectories. Saturation is inferred from flows and the authors explicitly say high-supersaturation conditions cannot be characterized accurately; this is a load-bearing limitation.

### Display and candidate-unit inventory

- **p. 3, Fig. 1 — explicit exclusion.** IRIS flow-system schematic.
- **p. 4, Fig. 2 — explicit exclusion.** LISA optical-system schematic.
- **p. 4, Fig. 3a–d — explicit model exclusion.** CFD velocity, temperature, and saturation-ratio profiles; no measured series.
- **p. 5, Fig. 4 — three calibration-series candidates `VG-F4-wall20`, `VG-F4-wall30`, `VG-F4-wall40`.** Outlet temperature versus total flow for wall temperatures -20, -30, and -40 C and inlet 20 C, comparing measured points to calculated values. Temperature sensor accuracy +/-0.01 K; solid curves interpolate observations. Family `native-first`/`plot-digitization`; apparatus calibration only.
- **p. 5, Fig. 5 — calibration candidate `VG-F5-RHi`.** Measured and modeled ice relative humidity versus wet-flow rate at total flow 5 L min^-1, wall -30 C, inlet 20 C, dew point 19.5 C (resulting sample temperature about -27.5 C). RHi spans roughly 0.75 at 0.1 L min^-1 wet flow to 1.2 at 2 L min^-1. Family `native-first`; apparatus calibration.
- **p. 7, Fig. 6a–b — secondary exclusion.** Smooth/rough column scattering patterns from prior AIDA/Schnaiter et al. work, not new observations here.
- **p. 8, Fig. 7 — four trajectory candidates `VG-F7-slow-size`, `VG-F7-slow-roughness`, `VG-F7-fast-size`, `VG-F7-fast-roughness`.** Two pre-existing crystals at -35 C, each regrown from 20 to 29 micrometres. Slow wet/dry flows 0.7/4.3 L min^-1 and fast 1.0/4.0 L min^-1 (about 10% RHi difference). Fast roughness 0.27 to 0.39 over 23 s; slow 0.29 to 0.37 over 100 s. LOESS curves are derived. One crystal per condition; no bars. Family `native-first`/`plot-digitization`.
- **p. 8, Fig. 8 — candidate `VG-F8-growth-roughness`.** Roughness-increase rate versus crystal growth rate for **15 separate simple-column experiments**, size range 20–80 micrometres; 12 initial crystals were sublimated then regrown. Printed coefficient of determination R-squared=0.82. Each plotted experiment can become a row if native data are recovered. Family `native-first`/`plot-digitization`.
- **p. 9, Fig. 9 — candidates `VG-F9-size` and `VG-F9-roughness`, plus synchronized image/scattering sequence.** One glass-fibre-nucleated prism at -30 C through repeated growth/sublimation; estimated ice saturation 1.0–1.05 before reduction, wet/dry flows 0.8–1.0/4.2–4.0 L min^-1. At t=140 s combined roughness is about 0.3; after regrowth it rises near t=250 s and ends about 0.6. Family `native-first`; video S1 preferred. Same specimen, two observables.
- **p. 10, Fig. 10 — candidates `VG-F10-size` and `VG-F10-roughness`, plus synchronized image/scattering sequence.** One illite-nucleated crystal at -40 C through three cycles, estimated ice saturation about 1.0–1.1 and wet/dry flows 0.6–0.8/4.4–4.2 L min^-1. Family `native-first`; video S2 preferred. No independent uncertainty shown.

### Prose-only numerical-result candidates

- **pp. 5–6, calibration drift.** For wall -40 C, total flow 7 L min^-1, wet flow 0.9 L min^-1, initial ice saturation about 1.2: temperature rose approximately -31.7 to -31.0 C and frost point -29.5 to -29.0 C over 20 min. This demonstrates time-varying conditions; use as calibration/validity evidence, not a crystal outcome.
- **pp. 8–10, `VG-P-cycle-effect`.** Fig. 9 ends near roughness 0.6 after repeated cycles; the article reports roughness ratcheting and possibly reduced later growth, but explicitly says more experiments are needed for robust statistics. Do not elevate the memory-effect interpretation beyond these illustrated specimens.

## 8. `prm-2018-esem-sublimation.pdf`

Actual source: Nair et al. (2018), *In situ ESEM imaging of the vapor-pressure-dependent sublimation-induced morphology of ice*. Pages: **7/7 inspected**. Full-text verdict: complete Physical Review Materials Rapid Communication; data repository is cited but was not retrieved.

Provisional scope verdict: **exclude from the current individual atmospheric-crystal target.** Specimens are approximately 1 mm thick, melt-frozen polycrystalline ice fields on the ESEM stage. Retain as a primary sublimation/roughness analogue and a source-discovery lead.

### Display and candidate-unit inventory

- **p. 2, Fig. 1 — explicit protocol exclusion.** Seven-step pressure-cycle schematic at -20 C (35, 70, 80, 90, 95, 100, and 500 Pa); conditions, not observed outcomes.
- **p. 3, Fig. 2 — candidate `NA-F2-field`.** One polycrystalline field at -20 C and 100 Pa imaged through the pressure cycle at t0=0, then approximately 2:10, 7:19, 9:43, 13:04, 17:32, 22:03, 23:16, and 28:06. Observable is evolving pits/ridges/facets. Family `image-series`; field is not an individual crystal.
- **p. 4, Fig. 3 — mixed candidate/exclusion.** Crystallographic etch-pit schematic plus one measured Fig. 2 snapshot (t2), scale 100 micrometres. The snapshot is duplicate lineage; orientation interpretation is derived.
- **p. 4, Fig. 4 — three image-condition candidates `NA-F4-35Pa`, `NA-F4-100Pa`, `NA-F4-500Pa`.** Polycrystalline sublimation surfaces at -20 C with pressure deficits approximately +68.2, +3.2, and -396.8 Pa relative to equilibrium (sign convention as printed). Observable is wavelength/faceting morphology; 100 micrometre scale. Family `image-series`.
- **p. 5, Fig. 5 — six ensemble candidates `NA-F5-pressure1..6`.** Characteristic wavelength lambda0 versus vapor-pressure deficit for six sub-equilibrium pressures. Each point averages at least 20 ice crystals per pressure and at least four periods per crystal. Error bars show the distribution but the main caption does not give a standard-error/SD definition. Printed fit: lambda0=25*(Delta-P)^-0.4 with lambda0 in micrometres and Delta-P in Pa; R-squared=0.95. Family `native-first`, otherwise plot digitization.
- **p. 5, Fig. 6 — explicit mechanism/model exclusion.** Proposed ridge/facet mechanism schematic.
- **p. 6, Fig. 7 — explicit conceptual exclusion.** Cross-disciplinary application diagram, no measurements.

### Prose-only numerical-result candidates

- **pp. 4–5, `NA-P-orientation`.** Ridge/etch features are reported approximately 30 degrees from crystallographic a/b directions. Qualitative crystallographic result tied to Figs. 3–4.
- **Methods.** Mean sublimation velocities were calculated, but no numerical velocity series is printed in the main PDF; this is an unresolved native-data lead, not an extractable unit from the PDF.

## 9. `zhao-et-al-2021-aircraft-ice-growth.pdf`

Actual source: **Feng et al. (2021)**, *Aircraft Observations of Characteristics and Growth of Ice Particles of Two Different Snowfall Clouds in Shanxi Province, China*. Pages: **17/17 inspected**. Full-text verdict: complete main article. Filename-author mismatch must be corrected.

Provisional scope verdict: **exclude from current quantitative target.** This is bulk/ensemble aircraft and remote-sensing evidence from two clouds; particles are not tracked through growth and combine deposition, riming, aggregation, and melting. It is useful natural-cloud habit/context evidence only.

### Display and candidate-unit inventory

- **p. 3, Fig. 1a–b — bulk-context candidates `FE-F1-case1` and `FE-F1-case2`.** Synoptic meteorological maps for the 29 Nov 2009 and 3 Mar 2012 cases. Secondary/reanalysis-style context, not ice-crystal units.
- **p. 4, Fig. 2a–b — bulk-context candidates `FE-F2-case1` and `FE-F2-case2`.** Satellite infrared cloud-top imagery for the two cases. Remote sensing; excluded from individual target.
- **p. 5, Fig. 3a–b — bulk-context candidates `FE-F3-case1` and `FE-F3-case2`.** Radar PPI reflectivity for the two cases. Remote sensing; excluded.
- **p. 6, Fig. 4a–b — context candidates `FE-F4-case1` and `FE-F4-case2`.** Aircraft flight tracks/altitudes through each cloud, providing sampling lineage.
- **p. 7, Fig. 5a–b — two profile/image-block candidates `FE-F5-case1` and `FE-F5-case2`.** Vertical temperature and RH profiles plus CIP/PIP habit-image strips for each flight. Units degrees C, percent RH, altitude, and probe pixel/particle scale as shown. Habit images are sampled ensembles, not trajectories. Family `native-first`; qualitative habit indexing only.
- **pp. 9–10, Fig. 6a–g — seven bulk candidates for 29 Nov.** (a) CDP concentration and LWC versus altitude/time; (b) CIP particle concentration and IWC; (c) PIP concentration and effective diameter; (d) radar/flight/time linkage with particle images; (e) CIP time-size distribution; (f) PIP time-size distribution; (g) selected size spectra and images. Concentration units L^-1, water contents g m^-3, diameter micrometres, plus time/altitude/temperature. Family `native-first`; one flight/case, not seven independent experiments.
- **pp. 12–13, Fig. 7a–g — seven analogous bulk candidates for 3 Mar.** Same panel semantics and units as Fig. 6. One flight/case.
- **p. 14, Fig. 8a–b — candidates `FE-F8-case1` and `FE-F8-case2`.** Exponential-spectrum intercept N0 versus slope lambda, altitude-colored, with regime fits. Units m^-4 and m^-1. Derived from CIP/PIP spectra; family `native-first`.
- **p. 15, Fig. 9 — candidates `FE-F9-case1` and `FE-F9-case2`.** Correlation coefficient versus lambda for fitted particle spectra in each case. Derived fit-quality series, no independent uncertainty.

### Prose-only numerical-result candidates

- **pp. 1, 7–13, `FE-P-case1`.** 29 Nov cloud top approximately -19.5 C; peak CIP concentration **187 L^-1** and IWC **1.05 g m^-3** near -8.7 C; maximum LWC about **0.18 g m^-3**. Habits vary by altitude/temperature and include columns, capped columns, plates, dendrites, irregulars, rimed particles, and aggregates. Bulk case result, no point uncertainty.
- **pp. 1, 7–13, `FE-P-case2`.** 3 Mar cloud top approximately -12.6 C; maximum IWC **0.052 g m^-3**, with lower particle concentrations and effective diameter increasing toward roughly **2500 micrometres** near cloud base. Bulk case result.
- **pp. 14–15, `FE-P-spectra`.** Exponential particle-spectrum ranges are reported as N0 about 10^9–10^11 m^-4 and lambda 10^3–10^4 m^-1 for 29 Nov, versus N0 about 10^8–10^10 m^-4 and lambda around 10^4 m^-1 for 3 Mar; altitude-regime power fits and high correlations are displayed in Figs. 8–9. Use native records/table reconstruction before quoting exact coefficients.
- **Methods/probe limits.** CIP 25–1550 micrometres (62 bins), PIP 100–6200 micrometres (62 bins), CDP 2–50 micrometres (30 bins). Instrument metadata, not outcomes.

## Cross-source handoff

### Potentially eligible current-target sources

1. Fuchs et al. 2025: individual-classified natural-cloud crystals, but PDF units are aggregated and growth time is inferred; retrieve native Zenodo data before unit freeze.
2. Libbrecht 2013: two individual growth trajectories plus attachment-coefficient data; retain measurements but explicitly bind the 2016 interpretation supersession.
3. Libbrecht 2016: two detailed individual trajectories, high-supersaturation image case, and small multi-crystal axial-rate series.
4. Magee et al. 2014: condition-indexed individual ESEM image panels/sequences, mostly qualitative and substrate/pressure-confounded.
5. Voigtlaender et al. 2018: individual size/roughness trajectories and 15-experiment roughness-growth relationship; recover supplement/native series and preserve saturation-limit caveat.

### Out-of-current-target but useful discovery/context sources

1. Jambon-Puillet et al. 2018: frozen water drops; snowflake sequence secondary.
2. Lamb et al. 2017: chamber-population isotope fractionation, no individual morphology/growth trajectory.
3. Nair et al. 2018: melt-frozen polycrystalline substrate field.
4. Feng et al. 2021: two bulk aircraft/remote-sensing cloud cases, no tracked individual growth.

### Priority acquisition gaps before formal S3

- Fuchs et al. 2025 Zenodo data and plotting code, to determine whether individual-crystal rows and uncertainty inputs are present.
- Lamb et al. 2017 SI Appendix/native experiment table, if isotope evidence remains in the broader source scope.
- Jambon-Puillet et al. supplement/native movies only if the non-atmospheric analogue remains useful.
- Magee et al. linked videos/native ESEM frames for any quantitative image analysis.
- Voigtlaender et al. supplement, videos S1/S2, and calibration/growth data; this is the highest-value missing supplement among the direct individual-crystal sources.
- Nair et al. cited data repository if the polycrystalline analogue is retained.

### Formal-S3 cautions

- Freeze and hash the cumulative eligible source set before assigning independent passes.
- Resolve the four filename/citation mismatches first.
- Use shared lineage IDs so alternate views, threshold reprocessings, model overlays, and repeated figures do not inflate independent evidence counts.
- Make specimen identity and support state explicit: atmospheric/free, substrate-supported vapor-grown, transported, melt-frozen drop, or polycrystalline bulk field.
- Treat native data as authoritative when available; digitization is a fallback with a recorded calibration/error model.
