# Phase 8B S2 full-text eligibility and measurement-unit reconnaissance — historical batch 2

Status: durable working draft, 2026-08-11. This is **S2 reconnaissance, not a formal S3 blind classification**: the cumulative source set is not frozen. It preserves a page-complete visual inventory so the later independent classifications can start from explicit locators without inheriting an eligibility verdict.

## Method and census

- Input was strictly the six already-acquired PDFs in `/Volumes/snowcrystal/research-cache/phase8b-search/acquired-sources-20260811-v1`; no network access or downloads were used and neither the NAS nor repository was edited.
- `pdftotext -layout` was run on every PDF. Every PDF page was also rendered to PNG with `pdftoppm` and inspected visually at full available resolution. Text extraction was used for search/transcription, never as a substitute for the page images.
- Visual completion: **66/66 PDF pages**: 8 + 8 + 8 + 15 + 19 + 8.
- Numbered-object census: **57 figures, 6 tables, and 13 separately numbered Photos = 76 numbered visual objects**. All are enumerated below, including apparatus/conceptual displays that are ultimately exclusions.
- Source-role headline: **five primary empirical papers** (Kobayashi 1960; Gonda 1976; Magono 1962; Murai et al. 2012; Sei & Gonda 1989) and **one review/theory synthesis** (Kuroda 1982). Several displays inside the primary papers are secondary literature compilations.
- Atomic-unit count is deliberately not frozen here. A later S2 corpus freeze must decide whether a condition-labeled image panel, frequency row, or plotted habit series is the atom or a child of a grouping record. The inventory below names each such child so no data disappear under either policy.

Field shorthand used below: `n` is the sample/ensemble information actually reported; `u` is reported uncertainty (not an uncertainty invented here); `family` is the likely extraction family. “Secondary” means the PDF is not the originating experimental report for that datum. A schematic, apparatus drawing, equation, fitted boundary, or literature comparison is still enumerated, but marked non-primary or exclusion rather than silently counted as a measurement.

## Filename and identity warnings

Three acquired filenames do not name the actual paper in the PDF:

| NAS filename | Actual paper in PDF |
|---|---|
| `imai-1960-convection-mixing-chamber.pdf` | T. Kobayashi (1960), “Experimental Researches on the Snow Crystal Habit and Growth Using a Convection-Mixing Chamber,” *JMSJ* 38(5), 231–238. |
| `keller-hallett-1976-high-low-pressure.pdf` | Takehiko Gonda (1976), “The Growth of Small Ice Crystals in Gases of High and Low Pressures,” *JMSJ* 54(4), 233–240. |
| `kobayashi-1962-temperature-conditions.pdf` | C. Magono (1962), “The Temperature Conditions for the Growth of Natural and Artificial Snow Crystals,” *JMSJ* 40(4), 185–192. |

Inventory/provenance records should key to verified article identity and retain the acquired filename only as an artifact locator.

---

## 1. `imai-1960-convection-mixing-chamber.pdf` — actually Kobayashi (1960)

**Visual confirmation:** PDF pp. 1–8 (printed pp. 231–238) inspected. All five figures, their micrograph panels, axes, legends, and captions were visually checked.

**Full-text scope verdict:** primary convection-mixing-chamber experiment and eligible for habit/condition and intervention-history measurements. Its Karl Fischer humidity data are **not clean local supersaturation measurements**: the author explicitly says the sample is a chamber mean, not the value at the crystal, calls the low-supersaturation values erroneous, and says the result is not accurate enough for a quantitative mechanism analysis. Preserve those warnings on every Fig. 3-derived unit. Figures 4–5 are particularly valuable intervention time series, but pressure-induced droplet formation confounds a simple vapor-only interpretation.

### Numbered displays and homogeneous children

- **Fig. 1 — PDF p. 2 / printed p. 232.** Apparatus schematic, not a target outcome measurement. It contains protocol/calibration candidates: chamber scale bar 10 cm; cotton filter length about 1.5 m; felt 5 mm; refrigerating capability to −40 °C; sampling flow about 100 cc/min. Related prose gives the predecessor chamber/sample as about 3 L/about 20 L and absorber dead mass about 100 g versus a 10–100 mg increment. `family=protocol transcription`; `n=apparatus`; `u=none except “about/ca.”`; no secondary-data issue for this apparatus, but these are methods, not crystal outcomes.
- **Fig. 2 — PDF p. 3 / printed p. 233.** Primary `Ta–Tw` scatter: air temperature `Ta` (°C) versus water-reservoir temperature `Tw` (°C). Seven separately extractable habit series are identified by symbols: needle, sheath, column, sector/plate, thick plate, dendritic, and side extension. Author-drawn region boundaries are derived overlays, not observations. Four accompanying primary exemplar micrographs **a–d**, each ×80, are separate condition-linked image children (needle/sheath/column/plate exemplars; exact plotted condition linkage is graphical). `conditions=convection-mixing chamber, rabbit-hair support`; `n=many experimental runs, total and per habit not reported`; `u=no point errors`; `family=plot digitization for seven series; calibrated/qualitative image reading for four panels`; primary.
- **Fig. 3 — PDF p. 4 / printed p. 234.** Primary `Ta–s` scatter: `Ta` (°C) versus supersaturation `s` (% with respect to ice), for the same seven habit-symbol series. The dashed `W` curve is the water-saturation reference and should be a non-observation child. Author-drawn habit-region boundaries are derived. `n=subset of Fig. 2 experiments in which total water was measured; count not reported`; instrument method has approximately 2% accuracy for dendritic and 5% for columnar growth near −20 °C, but no per-point error bars. `family=plot digitization`; primary observations with a mandatory **author-declared local-representativeness/error caveat**, while `W` is a reference calculation.
- **Fig. 4 — PDF p. 6 / printed p. 236.** One primary perturbation experiment. Four image frames **a–d**, each ×15, show dendrite → broadened/sector-like tip while air is removed and cloud drops fall/freeze → dendrite again. Three homogeneous traces share clock time (about 15:30–15:50): `Ta` (°C, about −11 to −12), `Tw` (°C, about +25 to +30), and chamber pressure `P` (mmHg, about 750 down to about 705 and back). Intervention markers identify guide-tube insertion and suction. `n=one crystal/one intervention history`; `u=none`; `family=time-series plot digitization plus four qualitative image frames`; primary, with droplet/adiabatic-expansion confounding explicitly discussed by the author.
- **Fig. 5 — PDF p. 7 / printed p. 237.** A second primary perturbation experiment. Four frames **a, b, c, d** (a,b,d ×15; c ×31) show habit evolution during suction. Three traces share time (about 17:20–17:40): `Ta` (°C, about −13 to −14), the plotted reservoir-temperature trace `Tw` (°C, about +25 to +30), and `P` (mmHg, about 750 down to about 695 and back). `n=one crystal/one intervention history`; `u=none`; `family=time-series plot digitization plus four qualitative image frames`. **Internal-source warning:** the printed caption says “Ta–s and pressure,” but the middle plotted axis is visibly `Tw`; preserve the discrepancy rather than silently choosing the caption.

### Prose numerical-result candidates

- **KF calibration/method block — PDF pp. 2–4.** Reagent power factor 2 mg/cc water equivalent; detection/neutral-point resolution 0.05 mg; 1 L sample; about 100 cc/min; claimed water-content accuracy about 2% (dendritic) or 5% (columnar) near −20 °C. `n=method`; `u=those claimed accuracies`; `family=prose transcription`; primary calibration, not an outcome.
- **Erroneous low reading — PDF p. 5 / printed p. 235.** About 90% with respect to ice at about −14 °C while crystals still grew into columns/thick plates. `n=unspecified experiment(s)`; `u=author labels value erroneous/scattered`; `family=prose transcription`; primary but unsuitable as a physical local-humidity datum except as a method-failure record.
- **Revised region limits — PDF p. 5.** Author proposes lowest ice-relative values of 120% for dendrite and 110% for sector, with dendritic growth only at −12 to −14 °C and appreciable supersaturation relative to water. `n=derived from this experimental set`; `u=no formal uncertainty`; `family=prose/figure-boundary transcription`; primary-derived, not raw points.
- **Low-supersaturation column range — PDF p. 5.** Columns observed at low supersaturation across the studied temperature range except above −8 °C; failure to obtain columns from 0 to −8 °C is attributed to nucleation difficulty. `n=series unspecified`; `u=none`; `family=prose categorical boundary`; primary, with the non-observation not interpreted as impossibility.
- **Habit ordering — PDF p. 5.** Between −10 and −18 °C, increasing ambient supersaturation gives column → thick plate → sector → dendrite. `n=unspecified ensemble`; `u=none`; `family=prose categorical series`; primary, largely a prose interpretation of Figs. 2–3.
- **Cross-study size/supersaturation comparison — PDF p. 5.** Mason/Hallett low-supersaturation region below about 5%; their crystals several mm versus this paper’s hundreds of microns. `family=prose`; **secondary contextual comparison**, not a new primary measurement from this PDF.

No numbered tables or additional unnumbered data graphs occur.

---

## 2. `keller-hallett-1976-high-low-pressure.pdf` — actually Gonda (1976)

**Visual confirmation:** PDF pp. 1–8 (printed pp. 233–240) inspected. All eight figures, two tables, all pressure/temperature image panels, frequency matrices, and schematic panels were checked visually.

**Full-text scope verdict:** primary free-fall experiment at water saturation in helium and argon, eligible for habit frequency, size, and mean-axis-ratio units at −7 and −15 °C over high/normal/low pressure. Tables 1–2 are explicitly secondary physical constants from Hirschfelder et al. (1966). Figures 7–8 are author schematics/interpretations, not raw measurements. Experimental sample counts, dispersion, and point uncertainties are not reported.

### Tables

- **Table 1 — PDF p. 2 / printed p. 234.** Helium physical constants at 0 °C for eight pressure rows `15, 10, 5, 1, 1/2, 1/3, 1/4, 1/5 atm`. Three homogeneous columns: vapor diffusivity `0.051, 0.077, 0.154, 0.770, 1.540, 2.310, 3.080, 3.850 cm² sec⁻¹`; thermal conductivity `34.4×10⁻⁵ cal cm⁻¹ sec⁻¹ deg⁻¹` for every row; molecular viscosity `1.92×10⁻⁴ g cm⁻¹ sec⁻¹` for every row. `n=tabulated reference values`; `u=none`; `family=printed-table transcription`; **secondary (Hirschfelder et al. 1966)**.
- **Table 2 — PDF p. 2 / printed p. 234.** Argon, same eight pressure rows and units. Vapor diffusivity `0.013, 0.019, 0.038, 0.190, 0.380, 0.570, 0.760, 0.950 cm² sec⁻¹`; thermal conductivity `3.89×10⁻⁵ cal cm⁻¹ sec⁻¹ deg⁻¹`; molecular viscosity `2.09×10⁻⁴ g cm⁻¹ sec⁻¹`. `n/u/family` as Table 1; **secondary**.

### Figures and homogeneous children

- **Fig. 1 — PDF p. 3 / printed p. 235.** Six primary micrograph panels: helium at `10 atm`, `1 atm`, and `380 mmHg`, crossed with `−7 °C` (left; 30 µm scale) and `−15 °C` (right; 40 µm scale). Each panel is a condition-labeled predominant-morphology ensemble, not one asserted representative specimen. `conditions=water saturation, crystals falling within 2 min after seeding`; `n=not reported`; `u=none`; `family=calibrated image/qualitative morphology`; primary.
- **Fig. 2 — PDF p. 3 / printed p. 235.** Two primary stacked-frequency panels, helium at −7 and −15 °C. Each has five pressure rows (`15, 10, 5, 1, and combined 1/3–1/2 atm`) and frequency in %. Preserve the **10 pressure×temperature matrix cells** as candidate children. At −7 °C the categorical components are needle, sheath, skeleton column, solid column; at −15 °C dendrite, stellar+sector, skeleton plate, solid plate. `n=denominators not reported`; `u=no sampling intervals`; `family=matrix/plot digitization`; primary.
- **Fig. 3 — PDF p. 4 / printed p. 236.** Four primary habit series—dendrite, stellar, skeleton plate, solid plate—of length along the a-axis (µm) versus water-vapor diffusion coefficient (`cm² sec⁻¹`, logarithmic x-axis), in helium. `n=points/series visible but denominators not stated`; `u=none`; `family=plot digitization`. **Internal-source warning:** the caption prints −7 °C, while the surrounding prose twice says −15 °C and the plotted habits are the −15 °C plate/dendrite set. Record condition as unresolved `caption −7 / prose −15`, not silently corrected.
- **Fig. 4 — PDF p. 4 / printed p. 236.** Six primary micrograph panels: argon at `15 atm`, `1 atm`, and `190 mmHg`, crossed with `−7 °C` (left; 30 µm scale) and `−15 °C` (right; 40 µm scale). Same ensemble/sample caveats as Fig. 1. `family=calibrated image/qualitative morphology`; primary.
- **Fig. 5 — PDF p. 5 / printed p. 237.** Argon counterpart to Fig. 2: two temperature panels × five pressure rows = **10 condition-matrix children**, with the same categorical components and frequency %. `n=not reported`; `u=none`; `family=matrix/plot digitization`; primary.
- **Fig. 6 — PDF p. 5 / printed p. 237.** Mean `c/a` versus vapor diffusivity (`cm² sec⁻¹`, log x). Four primary series: helium −7 °C (open, upper branch), argon −7 °C (solid, upper); helium −15 °C (open, lower), argon −15 °C (solid, lower). `n per mean=not reported`; `u=no dispersion/error bars`; `family=plot digitization`; primary means, not individual-crystal values.
- **Fig. 7 — PDF p. 6 / printed p. 238.** Derived schematic of habit/growth feature versus temperature (−7 and −15 °C rows) and diffusivity; two condition rows. `n=not applicable`; `u=none`; `family=schematic categorical extraction`; author-derived from the experiment, not raw observations.
- **Fig. 8a–b — PDF p. 6 / printed p. 238.** Two derived schematics, at −7 and −15 °C, locating morphology in vapor-diffusivity (`cm² sec⁻¹`) × thermal-conductivity (`×10⁻⁵ cal cm⁻¹ sec⁻¹ deg⁻¹`) space. `family=schematic categorical extraction`; author-derived. The text supplies a specific comparison at `D≈0.9 cm² sec⁻¹`: helium produces skeleton column/plate whereas argon produces a more solid form with `c/a` near 1.

### Prose numerical-result candidates

- **Protocol ensemble — PDF p. 2.** Preliminary fog cycles 2–3; vapor above 90% relative to ice; at −15 °C water vapor supplied 8–10 min at 1 atm and about 15 min at high/low pressure; stirrer about 10 s; water saturation sustained about 2 min; early fog 2–3 min; chamber hygrometer about 115% relative to ice at −15 °C. Only crystals falling within 2 min after seeding were retained. `family=protocol transcription`; no formal uncertainty.
- **Mean-size calibration — PDF p. 2.** Helium, 1 atm, −15 °C, water saturation: mean crystal size about 50 µm. `n=not reported`; `u=“about” only`; `family=prose`; primary.
- **Primary reported size domain — abstract/pp. 233, 238.** Studied small-crystal range about 20–50 µm; later discussion repeatedly contrasts crystals below about 50 µm with natural crystals above about 1 mm. `family=prose`; first is primary scope, second is a literature/contextual comparison.
- **Pressure-regime categorical results — printed pp. 234–237.** Candidate condition blocks: helium −7 (>10 atm hollow/sheath/needle; 1–5 atm skeletal prisms; <1 atm solid prisms); helium −15 (>5 atm dendritic double plates; <1 atm thick single solid plates); corresponding argon regimes with normal-pressure differences. These restate Figs. 1–5 and should be linked as prose interpretations, not duplicated as independent samples.
- **Planetary numbers — printed p. 238.** About 20 atm at −15 °C for Jupiter and about 15 atm at −15 °C for Saturn. These are explicitly thermodynamic/speculative values from Weidenschilling and Lewis (1973), **secondary and not experimental results of this paper**.

---

## 3. `kobayashi-1962-temperature-conditions.pdf` — actually Magono (1962)

**Visual confirmation:** PDF pp. 1–8 (printed pp. 185–192) inspected. Figures 1–7, Table 1, and Photos 1–13 were all visually checked, including scale bars and the primary/secondary strata in Figs. 2–5.

**Full-text scope verdict:** mixed but eligible. The bottom histograms in Figs. 2–5, vertical profiles in Figs. 6–7, and Photos 1–13 are primary Mt. Teine natural-snow observations from winter 1959. The artificial and earlier-natural range bars above the histograms are secondary comparisons. The paper reports no total `n`, per-bin uncertainty, or temperature-error estimate; histogram bin width is 0.5 °C. The profile data combine local psychrometer observations, remote radiosonde data, and an interpolated gap, so each segment needs distinct provenance.

### Apparatus/classification displays

- **Fig. 1 — PDF p. 2 / printed p. 186.** Conceptual schematic of growth paths through cloud layers and the difference among actual/artificial/practical classification. Axes show altitude/temperature reference lines (`2 km/−20 °C`, `1 km/−10 °C`, `−5 °C`). `family=conceptual schematic`; exclusion as a measurement unless retained as classification-method documentation.
- **Table 1 — PDF pp. 2–3 / printed pp. 186–187.** Qualitative classification rows: needle (Photo 1), sheath (Photo 2), column and plate (Photo 3), dendritic (Photo 4), sector (Photo 5). Two numerical decision rules may be calibration units: column length > half its diameter; plate diameter > twice thickness. `n=classification rule`; `u=none`; `family=table/prose transcription`; primary terminology, not a sampled outcome.

### Temperature-distribution figures

For **each of Figs. 2–5**, preserve seven provenance-distinct blocks: four artificial-study range bars (Nakaya; Aufm Kampe, Weickmann & Kelly; Hallett & Mason; Kobayashi), two earlier natural-study range bars (Gold & Power; Murai), and the current Mt. Teine 0.5 °C-bin histogram. The bars are secondary; only the bottom histogram is primary here.

- **Fig. 2 — PDF p. 3 / printed p. 187.** Dendritic-crystal temperature. Primary observable: number of crystals per 0.5 °C bin versus temperature (°C); almost all primary observations lie −13 to −16.5 °C, a 3.5 °C range. `n=bin counts visible; total not printed`; `u=none`; `family=histogram digitization`; primary histogram plus six secondary range series.
- **Fig. 3 — PDF p. 3 / printed p. 187.** Sector-and-plate temperature, same structure. Primary histogram has two groups, about −7.5 to −11 °C and −13 to −16 °C; prose notes the colder experimental range below −18 °C was not sampled because observed air stayed warmer than −18 °C. `family=histogram/range-bar digitization`; primary histogram plus secondary bars.
- **Fig. 4 — PDF p. 4 / printed p. 188.** Hollow prism, sheath, and column. Primary histogram contains separately labeled sheath and column contributions and therefore at least **two primary habit-series children**. Artificial and earlier-natural source bars remain secondary. Source prose gives the experimental warm column range −6 to −10 °C and cold range below about −20 °C as secondary artificial context. `n=bin counts visible, total absent`; `u=none`; `family=histogram digitization`.
- **Fig. 5 — PDF p. 4 / printed p. 188.** Needle temperature. Primary 0.5 °C-bin histogram concentrated in the warmer-than-−15 °C region, supporting an indicator near −5 °C. Same six source-bar children/caveat. `n=total absent`; `u=none`; `family=histogram digitization`.

### Atmospheric profiles

- **Fig. 6 — PDF p. 5 / printed p. 189.** Event at `21:00, 26 Jan 1959`. Three quantitative profile children versus altitude (m): air temperature (°C), relative humidity to water (%), and relative humidity to ice (%), plus a snow-crystal falling-path annotation. Below 1000 m temperature/humidity came from Assmann aspiration psychrometers at the stations; above 1500 m from a radiosonde station 8 miles away; 1000–1500 m is dotted/interpolated. Text identifies formation near −16 °C and a temperature inversion below. `n=one sounding/event`; `u=none`; `family=profile plot digitization`; primary/mixed-location with an interpolated segment.
- **Fig. 7 — PDF p. 5 / printed p. 189.** Event at `15:10, 31 Jan 1959`, same three quantitative profile children and provenance split. Weak inversion and moist layer at about 1500 m (−17 °C); interpreted formation near the −16 °C layer. `n=one sounding/event`; `u=none`; `family=profile plot digitization`; primary/mixed-location/interpolated.

### Numbered photographs

Each is a separately numbered primary image specimen and should remain a candidate child with morphology and scale, even if only qualitative morphology is extracted:

- **Photos 1–7 — PDF p. 7 / printed p. 191:** Photo 1 needle, 0.1 mm scale; Photo 2 sheath, 0.5 mm; Photo 3 plate and column, 0.1 mm; Photo 4 dendritic crystal, 0.5 mm; Photo 5 sector, 0.5 mm; Photo 6 stellar crystal with dendritic spatial branches, 0.5 mm; Photo 7 stellar crystal with spatial branches, 0.5 mm. `n=one photographed object/aggregate per photo`; `u=none`; `family=calibrated image/qualitative morphology`; primary.
- **Photos 8–13 — PDF p. 8 / printed p. 192:** Photo 8 stellar crystal with spatial sector branches, 0.5 mm; Photo 9 same class, 0.5 mm; Photos 10–11 dendritic crystal with attached hexagonal columns, 0.5 mm each; Photo 12 dendritic crystal with attached hexagonal plate, 0.5 mm; Photo 13 scattered snowflake with graupel-like crystals attached to a central dendritic crystal, 10 mm. Same `n/u/family`; primary. Photos 6–9 are tied by prose to the two dated profile events; Photos 10–13 are mixed-type aggregation examples.

### Prose numerical-result candidates

- **Station/selection protocol — PDF pp. 1–2.** Five elevations from summit to foot: 1023, 800, 560, 300, 100 m. Winter 1959; local Assmann temperature/RH; no data below −18 °C; only ice-saturated layers and specimens with sharp tips retained for growth-temperature identification. `family=protocol transcription`; primary.
- **Dendrite range/indicator — PDF p. 3.** Primary range −13 to −16.5 °C and indicator around −15 °C; no formal uncertainty. Link to Fig. 2 rather than duplicate as a new ensemble.
- **Sector/plate group ranges — PDF pp. 3–4.** Primary groups −7.5 to −11 and −13 to −16 °C; experimental literature ranges −9 to −13 and −18 to −20 °C are secondary. Link source roles explicitly.
- **Needle indicator — PDF pp. 4–5.** Narrow range supporting about −5 °C as a cloud-temperature indicator. `n/u` absent; primary prose interpretation of Fig. 5.
- **Spatial events — PDF p. 5.** Plane crystals with dendritic spatial branches at 21:00 on 26 Jan 1959 and sector spatial branches at 15:10 on 31 Jan 1959; primary categorical observations linked to Figs. 6–7 and Photos 6–9.

No additional unnumbered graphs occur.

---

## 4. `kuroda-1982-growth-kinetics.pdf` — Kuroda (1982)

**Visual confirmation:** PDF pp. 1–15 (printed pp. 520–534) inspected. Figures 1–12 and Table 1 were checked visually, including all Fig. 11 panels and the axes/parameter annotation in Fig. 12.

**Full-text scope verdict:** **not a new primary experimental campaign**. It is a review and theoretical synthesis. Keep it for model/theory outputs, cross-source lineage, and source-discovery, but do not classify its reproduced Kobayashi/Yamashita data or quoted literature numbers as Kuroda-1982 primary measurements. Figures 3–12 and Table 1 are schematic or calculated theory unless otherwise noted. The paper generally reports no propagated model uncertainty.

### Numbered displays and homogeneous children

- **Fig. 1 — PDF p. 2 / printed p. 521.** Reproduction/synthesis of the Kobayashi (1961) habit diagram: temperature `Ta` (°C) versus absolute supersaturation/excess vapor density `Δρ` (g m⁻³), with conversion `Δp[Torr]=(T/288)Δρ[g m⁻³]`; habit regions/curves. `family=secondary plot digitization`; **secondary (Kobayashi 1961)**; no `n/u`.
- **Fig. 2 — PDF p. 3 / printed p. 522.** Length (mm) of c- and a-axes at 200 s after seeding versus temperature (°C), water saturation, large cloud chamber. Legend distinguishes five nucleants—AgI colloidal droplets about 5 µm, minute ice crystals produced by rapid cooling, AgI smoke, bentonite, kaolin—each with a- and c-axis line styles: up to **10 secondary homogeneous trace children**. `n/u=not reported`; `family=secondary plot digitization`; **secondary (Yamashita 1974)**.
- **Fig. 3 — PDF p. 5 / printed p. 524.** Schematic surface structure/kinetics versus temperature: regimes I vapor–quasi-liquid–solid, II adhesive growth, III two-dimensional nucleation. `family=theory schematic`; exclusion as empirical measurement.
- **Fig. 4 — PDF p. 6 / printed p. 525.** Calculated/schematic equilibrium vapor pressure `p(δ)` versus quasi-liquid-layer thickness `δ`, with `pI`, `pW`, `δeq`. One model curve. `family=model-curve digitization`; theoretical, no empirical `n/u`.
- **Fig. 5 — PDF p. 6 / printed p. 525.** Two model-rate children, `RIa(δ)` and `RIb(δ)`, plus `Rmax`, `RI`, `δeq`, `δst`. `family=model-curve digitization`; theoretical.
- **Table 1 — PDF p. 7 / printed p. 526.** Model assignment matrix, two faces × four temperature regions: A `0>T>−4 °C`, B `−4>T>−10 °C`, C `−10>T>−20 °C`, D `T<−20 °C`; mechanisms V-QL-S (`coverage>1`), adhesive (`1>coverage>0.02`), or 2-D nucleation (`coverage<0.02`). Preserve eight face×region cells. `family=theory-table transcription`; theoretical.
- **Fig. 6 — PDF p. 7 / printed p. 526.** Schematic equivalent of Table 1 for basal `{0001}` and prism `{10-10}` faces, with four habit regions A–D and transition markers. `family=theory schematic`; duplicate/model summary, not an independent measurement.
- **Fig. 7 — PDF p. 7 / printed p. 526.** Three calculated series versus temperature (°C) at water saturation: `R(0001)`, `R(10-10)`, and `Rmax`, in µm s⁻¹. Volume diffusion is explicitly ignored; equations/inputs come from Kuroda (1979) and Kuroda & Lacmann (1982). `n=calculation`; `u=none propagated`; `family=model-curve digitization`; theory/derived, not primary experiment.
- **Fig. 8 — PDF p. 8 / printed p. 527.** Theoretical habit diagram: temperature (°C) versus absolute supersaturation `Δp` (Torr), habit regions A–D, water-saturation curve, and `TCD(Δp)`. `family=model-region digitization`; theoretical.
- **Fig. 9a–b — PDF p. 9 / printed p. 528.** Two schematic children: equiconcentration surfaces around a crystal and surface supersaturation `σ(x)` from center to corners. `family=theory schematic`; no empirical data.
- **Fig. 10 — PDF p. 9 / printed p. 528.** Schematic step distribution used to compensate surface supersaturation inhomogeneity. `family=theory schematic`; no empirical data.
- **Fig. 11a–c — PDF p. 10 / printed p. 529.** Calculated cube, side `L=10⁻¹ cm`, versus bulk supersaturation `σ∞` (%): (a) stable growth-rate branches (growth rate scale `×10⁻⁷ cm sec⁻¹`) and screw/nucleation/stability regions; (b) local supersaturations `σ(1)` corner and `σ(0)` center (%); (c) local slopes `p(1)` and `p(0)` (`×10⁻³`). Preserve each named curve/branch as a model-series child and stability thresholds as derived boundaries. `n=calculation`; `u=none`; `family=model-curve digitization`; theoretical.
- **Fig. 12 — PDF p. 10 / printed p. 529.** Model phase/stability diagram: crystal size `L` (cm, log) versus `σ∞` (%), screw/nucleation mechanisms, stable/unstable regions, two boundary curves, and equi-growth-rate lines `5×10⁻⁸`, `1×10⁻⁷`, `5×10⁻⁷ cm sec⁻¹`. Printed parameters: surface diffusion length `λs=100a`, molecular volume `Ω=7.1×10⁻²³ cm³`, `D=10⁻⁵ cm² sec⁻¹`. `family=model-region/curve digitization`; theoretical.

### Prose numerical-result candidates, all lineage-tagged

- **Observed habit transitions summarized from Kobayashi — PDF p. 2.** `TAB=−4 °C`, `TBC=−10 °C` (each within intervals <1 °C), `TCD=−22 °C` and less sharp. `family=prose`; **secondary (Kobayashi 1961 / other cited observations)**.
- **Low-temperature small-crystal studies — PDF p. 2.** Gonda: crystals `<30 µm` at −30 °C/about 4% over ice and at −44 °C/near ice saturation were almost plates; Anderson et al.: at −30 °C habit changed plate→column by 25% over-ice supersaturation. `family=prose`; secondary.
- **Yamashita protocol/result block — PDF p. 3.** Axes measured 200 s after seeding at water saturation. This is secondary and represented by Fig. 2.
- **Vacuum growth block — PDF p. 4 / printed p. 523.** Lamb/Hobbs and Lamb/Scott used `Δp=0.01 Torr`, relative supersaturation <1% for `T>−17 °C`, with rates of order `10⁻¹ µm s⁻¹` just below 0 °C. `family=prose`; secondary.
- **Quasi-liquid consensus — PDF p. 4.** Stable above about `−20±10 °C`. This is a literature consensus with an explicit approximate uncertainty/range, not a measurement by Kuroda 1982.
- **Model transition assignments — PDF p. 6.** `TI/II(0001)=−4 °C`, `TII/III(0001)=−10 °C`, `TI/II(10-10)=−10 °C`, `TII/III(10-10)=−20 °C`. `family=prose/model parameter transcription`; theoretical assumptions feeding Table 1/Figs. 6–8.
- **Low-temperature calculated crossover — PDF p. 8.** Basal 2-D-nucleation rate begins increasing near −23 °C and meets the prism rate at −32 °C; at −32 °C/water saturation `Δp=0.09 Torr`; model predicts columns for `T<−32 °C` at 0.09 Torr or at −32 °C for `Δp>0.09 Torr`. `family=model-result prose`; theoretical.
- **Stability-model scale — PDF pp. 10–11.** Fig. 11 cube `L=10⁻¹ cm`; `λs` assigned 100 lattice constants; limiting local slope `p1` order `10⁻²`. `family=model parameter/result`; theoretical.
- **Later comparisons — printed pp. 530–531.** Gonda & Koike crystals 15 µm at −30/−35 °C versus larger 100 µm skeleton-dominated crystals; constant vapor diffusivity `D=0.77 cm² s⁻¹` carrier-gas comparison; Lamb/Scott prism growth at −16.8 °C proportional to `Δp`; estimated surface-diffusion contribution about 15× direct volume diffusion at −14 °C. All are secondary literature results quoted in this review.

---

## 5. `murai-et-al-2012-morphology.pdf` — Murai et al. (2012)

**Visual confirmation:** PDF pp. 1–19 (printed pp. 3–21) inspected. All 18 figures, all 33 condition-labeled crystal-image panels in Figs. 5–15, the Fig. 16 point labels, Fig. 17 lines, Fig. 18 study strata, and every Table 1 cell were visually checked.

**Full-text scope verdict:** primary, eligible, and unusually rich: approximately 200 convection-chamber experiments from about −4 to −40 °C with local vapor-phase relative humidity, condition scatter, individual calibrated images, count table, and crystal growth rates. Critical caveat: `RHi` is vapor-phase humidity relative to ice, whereas Nakaya-style “supersaturation” can include suspended droplets/total water; the paper explicitly says the quantities differ. Some reported sub-ice-saturation growth may reflect spatial inhomogeneity, droplet transport/curvature, or local surface temperature. Individual-series `n` is generally absent except Table 1. Instrument uncertainty is reported at the method level.

### Methods displays and calibration

- **Fig. 1 — PDF p. 2 / printed p. 4.** Apparatus schematic. Protocol numbers: controlled room 10 °C; three two-stage Peltier units, each 40×40 mm; cooling below −40 °C; water-vapor vessel diameter 40 mm; polyester support about 20 µm. `family=protocol transcription`; apparatus, not target outcome.
- **Fig. 2a–c — PDF p. 3 / printed p. 5.** Three apparatus images: full setup; FINEDEW sensor/probe with 2.0×2.5 mm mirror; lighting/magnification system. Sensor about 15 mm from the growth point; water thermocouple about 5 mm from vessel bottom. `family=protocol/calibrated image`; no crystal outcome.
- **Humidity calibration prose — PDF p. 3.** FINEDEW calibrated from +18 to −20 °C; expanded temperature uncertainty 0.18 °C, corresponding to ±1.7% humidity at −20 °C. Each humidity reading averages 60 measurements at 1 s intervals over 60 s. This uncertainty belongs on applicable `RHi` units; no per-point bars are plotted.

### Condition diagrams

- **Fig. 3 — PDF p. 4 / printed p. 6.** Primary `Ta` (°C) versus water-vessel temperature `Tw` (°C) scatter for about 200 runs, `Ta=−3.5…−39.6 °C` in the methods/results text. Preserve nine symbol-series children: plate/sector, dendritic, thick plate, needle, column, cup/scroll, crossed plates, combination, and `×` no crystal after 12 h. Curves are author-derived morphology boundaries; shaded lower-right is difficult-formation region. `n≈200 total, per series absent`; `u=temperature uncertainty not stated here`; `family=plot digitization`; primary.
- **Fig. 4 — PDF p. 5 / printed p. 7.** Primary `Ta` (°C) versus `RHi` (%) scatter for the humidity-measured subset, with the same eight morphology series plus failure crosses, ice-saturation 100% line, water-saturation curve, and author-drawn boundaries. Point center is the reported `(Ta,RHi)`. `n=subset not explicitly counted`; `u=method-level 0.18 °C expanded / ±1.7% RH at −20 °C, no point bars`; `family=plot digitization`; primary. The caption/nearby text says some Fig. 3 points lack `RHi`, hence their absence here.

### Condition-labeled crystal images (all primary; 1 mm scale)

Each panel below is a candidate image/specimen unit. Source units printed in the image are `Ta` in °C, `RHi` in %, and a 1 mm scale. `n=one displayed crystal or fiber ensemble per panel`; `u=method-level humidity uncertainty only`; `family=calibrated image plus qualitative morphology`.

- **Fig. 5a–b — PDF p. 6 / printed p. 8:** plate specimens `a (−4.4,101)`, `b (−5.1,100)`.
- **Fig. 6a–c — PDF p. 6 / printed p. 8:** needles `a (−7.9,103)`, `b (−6.9,101)`, `c (−7.0,100)`.
- **Fig. 7a–b — PDF p. 7 / printed p. 9:** scroll/cup structures `a (−9.3,103)`, `b (−9.1,101)`.
- **Fig. 8a–d — PDF p. 7 / printed p. 9:** scroll/cup structures `a (−11.9,105)`, `b (−13.1,104)`, `c (−12.3,102)`, `d (−12.2,98)`.
- **Fig. 9a–c — PDF p. 8 / printed p. 10:** sector/plate `a (−20.2,107)`, `b (−19.5,106)`, plate `c (−19.2,103)`.
- **Fig. 10a–c — PDF p. 8 / printed p. 10:** dendritic `a (−16.6,110)`, `b (−15.9,101)`, thick plate `c (−16.0,98)`. The prose reports Fig. 10a’s a-axis rate as **5.7 mm h⁻¹**; that is a linked prose numeric child, not readable from the still image alone.
- **Fig. 11a–d — PDF p. 9 / printed p. 11:** crossed plates `a (−25.0,114)`, `b (−25.4,109)`, `c (−24.2,104)`; column `d (−25.5,102)`.
- **Fig. 12a–c — PDF p. 10 / printed p. 12:** irregular thick-plate/crossed-plate assemblages `a (−28.4,110)`, `b (−29.1,105)`; column `c (−28.1,101)`.
- **Fig. 13a–c — PDF p. 10 / printed p. 12:** crossed-plate/hollow-bullet assemblage `a (−34.0,111)`; thick-plate/crossed-plate assemblage `b (−35.1,107)`; column `c (−34.8,106)`.
- **Fig. 14a–d — PDF p. 11 / printed p. 13:** spearhead/knife-like `a (−37.2,118)`; bullet-bearing rectangular-prism-face form `b (−39.3,113)`; needle-prism `c (−38.3,109)`; column `d (−39.3,105)`.
- **Fig. 15a–b — PDF p. 12 / printed p. 14:** gohei-like crystal `a (Ta=−39; RHi not printed)`; prism-face-developed/polycrystalline form `b (−39.0,109)`. Do not impute panel a humidity from panel b.

### Growth-rate and comparison displays

- **Fig. 16a — PDF p. 12 / printed p. 14.** Needle c-axis growth rate (mm h⁻¹) versus `RHi` (%), individual points labeled by `Ta` (°C), with fitted/guide line ①. `n=individual crystals visible, total not printed`; `u=no rate/RH error bars`; `family=plot digitization`; primary.
- **Fig. 16b — same page.** Three primary morphology point series—dendritic, sector, plate—of a-axis rate (mm h⁻¹) versus `RHi`, each point labeled `Ta`. Guide line ② applies to dendrites; line ③ summarizes the near-constant sector/plate group. `n=points visible, total absent`; `u=none`; `family=plot digitization`.
- **Fig. 16c — same page.** Crossed-plate and “combination” tip rates (mm h⁻¹) versus `RHi`, point labels `Ta`; preserve the above-−30 °C relation (line ④) and below-−30 °C near-flat relation (line ⑤) as condition-stratified children. `n=points visible, total absent`; `u=none`; `family=plot digitization`; primary. Rate definition: whole-growth-interval average of length change/time from interval images, selecting branches/specimens parallel to the image plane.
- **Fig. 17 — PDF p. 13 / printed p. 15.** Summary overlay of lines ①–⑤ from Fig. 16, growth rate (mm h⁻¹, log) versus `RHi` (%). Five line children (needle, dendritic, sector/plate, crossed plates above −30, combination/below −30) are **within-source derived duplicates**, useful for comparison but not new observations.
- **Fig. 18 — PDF p. 14 / printed p. 16.** Temperature-range comparison from 0 to −40 °C across five study strata: current convection study; Nakaya (1954) convection; Mason (1958) diffusion; Kobayashi (1961) diffusion; Bailey & Hallett (2009) diffusion. Preserve each study×habit band if extracting the diagram. Current-study bands are derived from this paper’s data; all other strata are **secondary literature compilation**, with authors’ original terminology and classification non-equivalence explicitly noted.
- **Table 1 — PDF p. 14 / printed p. 16.** Primary count matrix for `Ta=−6…−19 °C`, with three humidity classes: below ice saturation; ice-saturated but below water saturation; at/above water saturation. Rows: `−6…−9 °C needle = 6,9,1; total 16`; `−9…−14 °C cup/scroll = 4,23,0; total 27`; `−14…−19 °C dendritic/sector/plate = 2,28,0; total 30`. Preserve the **nine non-total temperature×humidity cells** as atomic candidates; totals are derived checks (`n=73` overall). `u=counting uncertainty not reported`; `family=printed-table transcription`; primary.

### Prose numerical-result candidates

- **Campaign scope discrepancy — PDF pp. 1, 4, 17, 19.** About 200 experiments. Section 3.1 gives `Ta=−3.5…−39.6 °C`; conclusion gives `−3.5…−39.4 °C`; title/abstract round to −4…−40 °C. Preserve the exact-location discrepancy.
- **Warm forms — printed pp. 8–9.** Plates at about −4.4…−5.1 °C / RHi 100–103%; needles in the narrow −5.5…−7.9 °C range; scrolls about −8…−13 °C, with low-RHi hollow column and clearer scroll at higher humidity. These are primary range summaries linked to Figs. 5–8.
- **Cold-form thresholds — printed pp. 12–13.** Below −34 °C, bullet forms are characteristic at `RHi≥105%`; below −38 °C forms diversify; gohei-like forms observed below −38 °C. `n=not stated`; `u=method level`; `family=prose categorical boundary`; primary.
- **Growth-rate relation — printed pp. 14–15.** Needle/dendrite rates depend on RHi; sector/plate rates are about `1/5–1/10` dendrite and nearly constant; crossed-plate rate correlates with RHi above −30 °C but not clearly below. Primary-derived interpretation of Fig. 16.
- **Nakaya growth-rate comparison — printed p. 19.** Needle `0.55–2.3 mm h⁻¹`, dendritic `1.0–5.0 mm h⁻¹`, broad/sector/plate `0.145–1.20 mm h⁻¹`, with Murai applying a 1/2 diameter-to-radius normalization for comparison. **Secondary (Nakaya 1954) and transformed by Murai**, not a new primary series.
- **High-humidity conclusion — printed p. 19/English abstract p. 21.** Below −35 °C and above 105% RHi, diverse forms including polycrystals occur. Link as derived categorical summary; no separate `n/u`.

---

## 6. `sei-gonda-1989-polyhedral-growth.pdf` — Sei & Gonda (1989)

**Visual confirmation:** PDF pp. 1–8 (printed pp. 495–502) inspected. Figures 1–7, all 24 timed image frames, all six empirical plot series in Figs. 3–5, theoretical overlays, and every Table 1 value were visually checked.

**Full-text scope verdict:** primary low-pressure substrate-growth experiment and eligible for facet-normal growth-rate versus supersaturation, in-situ surface sequences, single-crystal habit ratios, and derived facet condensation coefficients at −7, −15, and −30 °C. The authors select crystals `<300 µm` and `c/a=0.6…3.0`; per-series `n` and statistical dispersion are absent. Temperature is controlled to ±0.01 °C and supersaturation calibration accuracy is 0.1%. Table 1 coefficients are derived from plotted fits/curves, not independently measured raw values.

### Numbered figures and homogeneous children

- **Fig. 1a–f — PDF p. 2 / printed p. 496.** One primary crystal time series at `40 Pa`, `−7 °C`, `2.7%` supersaturation: 0, 71, 80, 90, 101, 120 s; 200 µm scale. Preserve six timed frames under one specimen grouping. Prose reports `c/b=1.9`, `c/a=1.7` (hexagonal column). `n=one crystal`; `u=no image dimensional uncertainty`; `family=calibrated image/time sequence`; primary.
- **Fig. 2a–f — PDF p. 3 / printed p. 497.** One crystal at `40 Pa`, `−15 °C`, `2.8%`: 0, 11, 21, 31, 41, 61 s; 200 µm scale. Prose `c/b≈0.5`, `c/a≈0.4` (hexagonal plate). Same `n/u/family`; primary.
- **Fig. 3 — PDF p. 4 / printed p. 498.** Two empirical point series, normal growth rate (µm s⁻¹) versus supersaturation (%) at `40 Pa, −7 °C`: open `{10-10}` prism-face and solid `{0001}` basal-face points. Overlays include fitted BCF curves, asymptotes, a light comparison curve, and Hertz–Knudsen maximum line; preserve empirical series separately from model overlays. `n=one selected crystal per experiment/point implied, exact counts not stated`; `u=no point bars; calibration 0.1% supersaturation`; `family=plot digitization for points, model-curve digitization for overlays`; primary points/derived fits.
- **Fig. 4 — PDF p. 4 / printed p. 498.** Same two empirical facet series and theoretical overlays at `40 Pa, −15 °C`. Same `n/u/family`.
- **Fig. 5 — PDF p. 5 / printed p. 499.** Same two empirical facet series and theoretical overlays at `40 Pa, −30 °C`. Same `n/u/family`.
- **Fig. 6a–f — PDF p. 6 / printed p. 500.** Two primary face-specific surface time series at `40 Pa, −7 °C, about 2%`: basal `{0001}` frames a–c at 0, 28, 58 s; prism `{10-10}` frames d–f at 0, 3, 8 s; 300 µm scale. Preserve six frames grouped into two face series. `n=one face/specimen view per group`; `u=none`; `family=calibrated image/time sequence`; primary qualitative surface-structure evidence.
- **Fig. 7a–f — PDF p. 6 / printed p. 500.** Same two face series at `40 Pa, −15 °C, about 2%`: basal 0, 13, 19 s; prism 0, 3, 5 s; 300 µm. Same `n/u/family`; primary.
- **Table 1 — PDF p. 7 / printed p. 501.** Derived subscript-1 BCF/Hertz–Knudsen adsorption-probability coefficient, by face and temperature. `{0001}`: `0.17` at −7, `0.14` at −15, `0.39` at −30 °C. `{10-10}`: `0.13`, `0.16`, `0.32`. Preserve six face×temperature cells. Dimensionless; `n=derived from Figs. 3–5`; `u=none reported`; `family=printed-table transcription`; primary-derived/model-fit result, not independent observations.

### Prose numerical-result candidates

- **Method/selection block — PDF pp. 1–3.** Low air pressure 40 Pa; temperatures −7, −15, −30 °C; thermoelectric current 2–5 A; temperature accuracy ±0.01 °C; supersaturation calibration accuracy 0.1%; retained crystals below 300 µm and `c/a=0.6…3.0`; only one crystal formed in the microscope field for a rate experiment. `family=protocol transcription`; primary method.
- **Third habit ratio — PDF p. 3.** At −30 °C, `c/b≈1.6`, `c/a≈1.4`, hexagonal column. `n=one example implied`; `u=approximate only`; `family=prose`; primary, no numbered image attached in this PDF.
- **Large-crystal comparison — PDF p. 5.** Crystals larger than several hundred µm at low pressure described as column at −7, plate at −15, column at −30 °C. This is a categorical result but partly references the authors’ previous paper; retain the citation lineage rather than assuming all three observations originate in this PDF.
- **Atmospheric pressure context — PDF p. 1.** Upper-atmosphere 1–0.1 Pa and lower atmosphere `1.0×10⁵ Pa` are contextual literature values, not experiment results.

No additional unnumbered data tables or graphs occur.

---

## Cross-source handoff notes for the eventual freeze/classification

1. **Do not use acquired filenames as bibliographic truth.** Three of six are misnamed, as recorded above.
2. **Preserve lineage at child level.** Gonda’s Tables 1–2, Magono’s range bars, Murai Fig. 18/Nakaya rate ranges, and nearly all experimental data quoted by Kuroda are secondary.
3. **Kobayashi Fig. 3 needs a method-failure flag, not merely a large error bar.** The author says the chamber-average sample is not local to the crystal and calls low values erroneous.
4. **Record internal contradictions verbatim.** Gonda Fig. 3 caption says −7 °C while prose says −15 °C; Kobayashi Fig. 5 caption says `Ta–s` while the plotted middle trace is `Tw`; Murai gives both −39.6 and −39.4 °C campaign minima.
5. **Do not infer missing ensemble sizes.** “Predominant,” a mean, a frequency %, or a plotted point is not evidence of the denominator. Only Murai Table 1 supplies explicit counts in this batch.
6. **Keep source units.** These papers mix `s` percent relative to ice, vapor-phase `RHi` percent, excess vapor density g m⁻³, `Δp` Torr, mmHg/atm/Pa, µm s⁻¹, mm h⁻¹, and several cgs transport units. Conversion can be a later derived field, never a silent replacement.
7. **Suggested extraction-family vocabulary:** `printed-table`, `plot-digitization`, `histogram-digitization`, `profile-digitization`, `matrix-frequency-digitization`, `calibrated-image`, `time-series-image`, `prose-transcription`, `author-derived-boundary`, `model-curve`, `theory-schematic`, `protocol-only`, with separate `primary/secondary/within-source-derived` lineage.
