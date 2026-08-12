# Phase 8B S2 full-text eligibility and measurement-unit reconnaissance — historical batch 1

Status: detailed S2 reconnaissance only. This is **not** either formal S3 independent classification pass because the cumulative source set is not frozen. No target coordinate was extracted. The inventory intentionally preserves overlapping and derived representations so later reconciliation can choose the source-native extraction target without silently losing evidence.

## Method and scope

- Source directory (read-only): `/Volumes/snowcrystal/research-cache/phase8b-search/acquired-sources-20260811-v1/`.
- Offline only: no network requests or downloads.
- Every PDF was processed with `pdftotext -layout` and every page was rendered to PNG at 144 dpi and visually inspected. Select plot pages were rerendered at higher resolution solely to read labels.
- Eligibility rule used: include new primary measurements of individual atmospheric ice growth or sublimation under laboratory or controlled natural-cloud conditions; exclude theory/simulation/review/parameterization without new measurements, secondary reproductions, and non-ice experiments. A mixed paper can be included only for its eligible primary subset.
- Reconnaissance atomic unit: an individually condition-labelled panel/cell; a homogeneous plotted series; a homogeneous table/data block; or a prose numerical result not already fully represented by a source object. Counts below include overlapping/derived representations and therefore are **not** counts of independent evidence.
- Extraction families: `IMG-Q` = qualitative or image-metric extraction from a photograph; `PLOT-DIG` = coordinate digitization; `TAB-TRANS` = direct table transcription; `PROSE-TRANS` = direct prose transcription; `COND-ONLY` = apparatus/protocol/condition metadata, not a measurement unit; `MODEL/SECONDARY` = calculated, schematic, literature-derived, or otherwise ineligible as a new primary measurement.
- Unless explicitly stated otherwise, the papers report no sample count, replicate count, standard error, standard deviation, or instrumental uncertainty. A scale bar, magnification, percentile span, or plotted range is not silently recast as uncertainty.

## Batch audit and headline disposition

| PDF | SHA-256 | Pages visually inspected | Full-text scope verdict | Reconnaissance candidate units |
|---|---|---:|---|---:|
| `gonda-1957-hydrogen-carbon-dioxide.pdf` | `2e44238ca51a5dec2fb1d04871477cd42303dd38440928daf3f51160d86f9589` | 12/12 | INCLUDE — primary laboratory ice-growth experiments; one secondary table | 13 |
| `gonda-1958-low-pressure-habit.pdf` | `6a121a2582adc93b0f160ac7d1b799b483ad8335ab333bfb1b03e30be6e8a6b4` | 16/16 | INCLUDE — primary low-pressure laboratory measurements; mixed-source syntheses require separation | 34 |
| `gonda-1967-vapor-gradient-filaments.pdf` | `3c7c6605ccf74b39764353d76da691f9351fcdcf56516ff8980edcba98493cfc` | 11/11 | INCLUDE — primary laboratory growth/sublimation observations | 13 |
| `gonda-1969-radiative-cooling.pdf` | `6e03ad796d518897e91e338fa40b8f8418620666945a5949f19d808a909a7c6e` | 5/5 | EXCLUDE — theory/calculation and secondary comparisons only | 0 |
| `gonda-1970-helium-argon.pdf` | `2a20058fb79de5f0c854f010b91663168c1590acf3c5145a50284245c4286e1f` | 12/12 | INCLUDE — primary laboratory ice-growth measurements; physical-constants table is not new measurement | 29 |
| `gonda-1970-shape-instability.pdf` | `cddc5d8dd4697a8545aae0de5fdfa0d5516de8c003e49e1f017d969989fed3a8` | 17/17 | INCLUDE ELIGIBLE SUBSET — theory-dominant mixed-species paper; only Fig. 9 ice observations qualify | 2 |
| `gonda-1971-skeletal-dendritic.pdf` | `2ea39d1bd3d62f87101cf1041c43225e9bb24e3b0be25fc61df3228a7499dfd8` | 11/11 | INCLUDE — primary laboratory measurements with empirical percentile spans | 26 |
| `gonda-1973-electric-fields.pdf` | `f835471063be51c511ca3561026b170157e78ba1f4eaf849f507e4cb2ece011d` | 7/7 | INCLUDE — primary diffusion-chamber and epitaxial-growth measurements | 13 |

Batch totals: **8 PDFs, 91/91 pages visually inspected; 7 with eligible primary content (one subset-only), 1 theory-only exclusion, 0 unresolved source-level verdicts; 130 reconnaissance candidate units before overlap/lineage deduplication.**

## 1. Isono, Komabayasi & Ono (1957), hydrogen and carbon dioxide

PDF: `gonda-1957-hydrogen-carbon-dioxide.pdf`; visual inspection confirmed for pages 1–12 of 12.

Full-text verdict: **INCLUDE.** New primary chamber experiments compare ice habit in air, hydrogen, and carbon dioxide at water saturation and nominally -7 °C and -16 °C, plus gas-switch histories on a rabbit hair and trace-additive observations. Table 1 is a literature-derived physical-constants table and is not a new measurement.

### Complete source-object census and disposition

- p. 2, Fig. 1: cold-box/chamber/gas-generator apparatus drawing. `COND-ONLY`; water reservoir about 60 °C and other dimensions are setup metadata.
- p. 3, Fig. 2: five micrographs, air, -7 °C, water saturation, silver-iodide seeding, ×600. Eligible homogeneous image ensemble.
- p. 3, Fig. 3: one upper-chamber micrograph under the Fig. 2 conditions, ×600; droxtal/spherical forms. Eligible image ensemble distinct by sampling location.
- p. 3, Fig. 4: six micrographs, hydrogen, -7 °C, water saturation, silver-iodide seeding, ×600. Eligible.
- p. 4, Fig. 5: five micrographs, carbon dioxide, -7 °C, otherwise matching, ×600. Eligible.
- p. 4, Fig. 6: three micrographs, air, -16 °C, water saturation, ×600. Eligible.
- p. 5, Fig. 7: eight micrographs, hydrogen, -16 °C, water saturation, ×600. Eligible.
- p. 6, Fig. 8: three micrographs, carbon dioxide, -16 °C, water saturation, ×600. Eligible.
- pp. 6–7, Fig. 9a–t: one rabbit-hair crystal through alternating air/hydrogen exposures at -7 °C and water saturation, ×70. Eligible time-history image series.
- pp. 8–10, Fig. 10a–r: one rabbit-hair crystal through alternating air/hydrogen exposures at -16 °C and water saturation, ×100. Eligible time-history image series.
- p. 11, Table 1: diffusion coefficients of water vapour in hydrogen, air, and carbon dioxide at 1 atm and 0 °C, including ratios 3.4 and 0.7 relative to air. Values are attributed to Trautz and Müller through Dorsey (1940); `MODEL/SECONDARY`, not a current-source measurement.
- p. 11, Fig. 11: two ×600 micrographs after modification with isoamyl acetate at -16 °C; eligible trace-additive image block, but concentration, gas identity, sample count, and dosing uncertainty are not reported.
- No other numbered or unnumbered table/figure/graph appears. The remaining equations/discussion are interpretation or secondary physical-property reasoning.

### Candidate measurement units (13)

- **H57-M01 — p. 3, Fig. 2.** Observable: habit and image-measurable a/c dimensions of columnar crystals. Conditions: air, -7 °C, water saturation, silver-iodide nucleation. Source units: ×600 only; no scale bar. Sample: five displayed fields/panels, crystal count not stated. Uncertainty: none. Family: `IMG-Q`. Caveat: ensemble selection policy absent.
- **H57-M02 — p. 3, Fig. 3.** Observable: droxtal/spherical habit at the upper chamber. Conditions: otherwise Fig. 2. Units/sample: ×600, one displayed field, n unstated. Uncertainty: none. Family: `IMG-Q`. Caveat: differs in chamber location and should not be merged with Fig. 2 without a lineage decision.
- **H57-M03 — p. 3, Fig. 4.** Observable: habit and axis proportions, qualitatively thicker/near-equal-axis crystals. Conditions: hydrogen, -7 °C, water saturation. Units/sample: ×600, six displayed fields, n unstated. Uncertainty: none. Family: `IMG-Q`.
- **H57-M04 — p. 4, Fig. 5.** Observable: habit/skeletal development. Conditions: carbon dioxide, -7 °C, water saturation. Units/sample: ×600, five displayed fields, n unstated. Uncertainty: none. Family: `IMG-Q`.
- **H57-M05 — p. 4, Fig. 6.** Observable: plate habit and image dimensions. Conditions: air, -16 °C, water saturation. Units/sample: ×600, three displayed fields, n unstated. Uncertainty: none. Family: `IMG-Q`.
- **H57-M06 — p. 5, Fig. 7.** Observable: plate/column habit and thickness. Conditions: hydrogen, -16 °C, water saturation. Units/sample: ×600, eight displayed fields, n unstated. Uncertainty: none. Family: `IMG-Q`.
- **H57-M07 — p. 6, Fig. 8.** Observable: thin-plate habit. Conditions: carbon dioxide, -16 °C, water saturation. Units/sample: ×600, three displayed fields, n unstated. Uncertainty: none. Family: `IMG-Q`.
- **H57-M08 — pp. 6–7, Fig. 9a–t.** Observable: same-crystal geometry/habit response to gas switches. Conditions: -7 °C, water saturation; air panels a–d (times 0, 24, 54, 95), hydrogen e–i (140, 181, 184, 189, 221; early low-supply/sublimation noted), air j–m (224, 226, 232, 245), hydrogen n–q (255, 261, 267, 289), air r–t (295, 299, 318). Source units: elapsed time as printed, apparently seconds; ×70. Sample: one crystal. Uncertainty: none. Family: `IMG-Q` time-series digitization. Caveat: gas-switch and transient vapour-supply effects are inseparable; panels are repeated observations, not independent replicates.
- **H57-M09 — pp. 8–10, Fig. 10a–r.** Observable: same-crystal response to air/hydrogen switches. Conditions: -16 °C, water saturation; air a–i (0, 13, 26, 28, 32, 36, 38, 47, 65), hydrogen j–o (75, 82, 89, 93, 98, 151), air p–r (214, 243, 255). Source units: printed elapsed time, apparently seconds; ×100. Sample: one crystal. Uncertainty: none. Family: `IMG-Q` time series. Caveat: repeated-measure overlap and gas-change transients.
- **H57-M10 — p. 11, Fig. 11.** Observable: columnar habit after isoamyl-acetate modification. Conditions: -16 °C; other conditions and dose incompletely reported. Units/sample: ×600, two displayed images, n unstated. Uncertainty: none. Family: `IMG-Q`. Caveat: trace-contaminant experiment is primary but poorly conditioned.
- **H57-M11 — p. 3 prose.** Observable: seeding-to-first-ice appearance latency, reported as more than 15 s after direct silver-iodide introduction. Conditions: chamber experiment; temperature/gas not tied to a specific run. Units/sample: seconds, n unstated. Uncertainty: none. Family: `PROSE-TRANS`. Caveat: likely protocol timing rather than a preplanned outcome; retain for later disposition.
- **H57-M12 — p. 11 prose.** Observable: acetic-acid modification produced plates at -7 °C. Conditions/dose/sample: not reported. Units: habit category. Uncertainty: none. Family: `PROSE-TRANS`. Caveat: primary claim lacks a displayed image and concentration.
- **H57-M13 — p. 11 prose with Fig. 11 overlap.** Observable: isoamyl acetate produced columns at -7 °C and -16 °C. Conditions/dose/sample: not reported; the -16 °C statement overlaps Fig. 11. Units: habit category. Uncertainty: none. Family: `PROSE-TRANS`. Caveat: do not count the -16 °C prose and Fig. 11 as independent evidence.

Primary prose conclusions such as “major/minor ratio closer to unity” in hydrogen contain no source number and are already represented by the photographs. The 3.4×/0.7× diffusion statements inherit secondary Table 1 and are excluded.

## 2. Kobayashi (1958), snow crystals at low pressures

PDF: `gonda-1958-low-pressure-habit.pdf`; visual inspection confirmed for pages 1–16 of 16.

Full-text verdict: **INCLUDE.** The source reports new low-pressure chamber photographs, growth histories, and a temperature–pressure habit map. Several synthesis diagrams mix current observations with prior publications or transformations; their lineage must remain explicit.

### Complete source-object census and disposition

- p. 1, unnumbered `Ta–p`/excess-vapour graph and adjacent unnumbered temperature-range/habit table: abstract-level synthesis of the later habit diagrams. Eligible only as a derived overlap, not an independent unit.
- p. 3, Fig. 1 and Photo 1: diffusion-chamber schematic and apparatus photograph. `COND-ONLY`.
- p. 3, Photo 2 and Fig. 2: chamber hardware photograph and convection-chamber schematic. `COND-ONLY`.
- p. 5, Fig. 3: equivalent-sphere radius-squared versus time. Five current low-pressure series are eligible; the dashed 760 mmHg, -15 °C, water-saturation “ice sphere” reference uses published/model inputs and is `MODEL/SECONDARY`.
- p. 6, Figs. 4, 5, and 7: ambient temperature `Ta`, water-reservoir temperature `Tw`, and pressure histories for Photos 10, 11, and 12. Eligible primary condition histories.
- p. 6, Figs. 6 and 8: `Ta–p` growth-type trajectories derived from Fig. 5/Photo 11 and Fig. 7/Photo 12. Eligible derived current-data representations, but not independent evidence.
- p. 7, Fig. 9: `Ta–p` habit diagram from ten experiment series plus constant-pressure diffusion-chamber observations. Eligible compiled primary block; the source does not report the marker count or per-marker replicate count.
- p. 8, Fig. 10: idealized scroll/sheath models. `MODEL/SECONDARY` schematic.
- p. 9, Fig. 11: idealized solid and pyramidal-column models. `MODEL/SECONDARY` schematic.
- p. 10, Fig. 12: revised `Ta–s` diagram combining the current low-pressure results with the author’s previous work and Nakaya boundaries. Mixed-source/interpretive; retain as overlap, not a clean new-data unit unless provenance can be split.
- p. 10, Fig. 13: `Ta–Δrho` transformation of Fig. 12. Derived mixed-source overlap, not new evidence.
- p. 11, Fig. 14: constant-vapour-density/flow drawing for sheath formation. `MODEL/SECONDARY` schematic.
- p. 13, Photos 3 and 4: two labelled views/magnifications of crystals on glass at `Ta=-26 °C`, `p=0.65 mmHg` (×52 and ×34). Eligible.
- p. 13, Photos 5, 6, and 7: solid-column ensembles on treated filament at `Ta=-8.8 °C, p=31 mmHg, ×21`; `Ta=-18.7 °C, p=511 mmHg, ×21`; and `Ta=-13.8 °C, p=41 mmHg, ×33`. Three eligible units.
- p. 13, Photo 9: skeletal crystals at about 72 mmHg, ×33; temperature omitted. Eligible with incomplete conditions.
- p. 14, Photo 8a–d: odd-shape growth sequence at `T=-15 to -12 °C`, `p=38 mmHg`, ×26. Eligible repeated-measure sequence.
- p. 14, Photo 10a–d: varying-condition growth sequence corresponding to Fig. 4, diffusion chamber, ×33. Eligible.
- p. 14, Photos 13 and 14: two separately labelled sheath-crystal images, ×33 and ×10; temperature/pressure omitted. Eligible but poorly conditioned.
- p. 15, Photo 11a–f and Photo 12a–f: two varying-condition convection-chamber histories corresponding respectively to Figs. 5 and 7; a 500 µm scale is shown. Two eligible repeated-measure units.
- p. 16, Photo 15: column with apparent pyramidal faces, ×51; temperature/pressure omitted. Eligible qualitative unit.
- p. 16, Photos 16 and 17: apparent rhombohedral-system crystals at `T=-15.2 °C, p=38 mmHg, ×38` and `T=-16.0 °C, p=72 mmHg, ×38`. Two eligible units.
- p. 16, Photo 18: multilayer sheath structure, 1 mm scale; other conditions omitted. Eligible.
- p. 16, Photo 19a–d: same-crystal sector-to-dendrite sequence at pressures 178, 214, 285, and 310 mmHg; final `T=-16 °C`; ×23. Eligible repeated-measure sequence.
- p. 16, Photo 20: dendritic ensemble at `Ta=-14.7 °C`, 1 atm, ×27. Eligible.
- No numbered tables appear. Apparatus numerics (vacuum, filter, chamber dimensions, camera magnification, temperature limits) are `COND-ONLY`. The prose estimates 100.06% ice saturation at 9 mmHg and at most about 100.3% near 20 mmHg are model-conditioned estimates, not directly measured supersaturation.

### Candidate measurement units (34)

- **L58-M01 through M05 — p. 5, Fig. 3 current series.** Observable: equivalent-sphere `r²(t)` and slope `dr²/dt`. Conditions by homogeneous plotted series: **M01** 72 mmHg, -11 to -15 °C; **M02** 56 mmHg, -17 to -12 °C; **M03** 38 mmHg, -15 to -12 °C; **M04** 36 mmHg, -13 to -10 °C; **M05** 9 mmHg, -13 to -9 °C. Source axes: `r²` in `10² µm²`, time in s. Sample: multiple plotted observations per series; number of crystals/replicates unstated. Uncertainty: no bars or reported instrumental uncertainty. Family: `PLOT-DIG`. Caveats: radius is an equal-mass-sphere transformation assuming ice density 0.92; do not extract the dashed 760 mmHg reference as new data.
- **L58-M06 — p. 6, Fig. 4.** Observable: `Ta`, `Tw`, and `p` versus clock time for Photo 10. Units: °C, mmHg, clock time. Sample: one varying-condition run. Uncertainty: none. Family: `PLOT-DIG`. Caveat: Photo 10 is the same run.
- **L58-M07 — p. 6, Fig. 5.** Same observables/units for Photo 11. Sample: one run. Uncertainty: none. Family: `PLOT-DIG`; overlaps Photo 11.
- **L58-M08 — p. 6, Fig. 6.** Observable: growth-type trajectory in `Ta–p` space for Photo 11. Units: °C, mmHg, categorical habit. Sample: same run as M07/Photo 11. Uncertainty: none. Family: `PLOT-DIG`. Caveat: derived overlap, not independent.
- **L58-M09 — p. 6, Fig. 7.** `Ta`, `Tw`, and `p` versus clock time for Photo 12. Units/sample/uncertainty: as M06; one run. Family: `PLOT-DIG`; overlaps Photo 12.
- **L58-M10 — p. 6, Fig. 8.** Growth-type trajectory in `Ta–p` space for Photo 12. Units: °C, mmHg, habit. Sample: same run as M09/Photo 12. Uncertainty: none. Family: `PLOT-DIG`; derived overlap.
- **L58-M11 — p. 7, Fig. 9.** Observable: crystal-habit category versus `Ta` and total pressure. Conditions: low-pressure diffusion/convection experiments; ten varying-condition series plus constant-pressure observations. Axes: °C and mmHg (log pressure); symbol legend distinguishes needle, sheath, scroll/cup, column, thick plate, sector plate, dendritic, and side extension. Sample: individual plotted conditions, exact marker and replicate counts unstated. Uncertainty: no bars/boundary uncertainty. Family: `PLOT-DIG`. Caveat: compiled overlap with M06–M10 and photographs; diagram boundaries are interpretive.
- **L58-M12 and M13 — p. 13, Photos 3 and 4.** Observable: crystal dimensions/habit on glass; prose says crystals on the cooling surface reached several millimetres in diameter in a short time. Conditions: `Ta=-26 °C`, `p=0.65 mmHg`. Units: ×52 (**M12**) and ×34 (**M13**), no scale bar; prose size is approximate. Sample: displayed ensembles, n unstated. Uncertainty: none. Family: `IMG-Q`. Caveat: same nominal condition and likely same experiment; treat as overlapping views until established otherwise.
- **L58-M14 — p. 13, Photo 5.** Solid-column morphology at `Ta=-8.8 °C`, `p=31 mmHg`, ×21. Sample: ensemble, n unstated. Uncertainty: none. Family: `IMG-Q`.
- **L58-M15 — p. 13, Photo 6.** Solid-column morphology at `Ta=-18.7 °C`, `p=511 mmHg`, ×21. Sample/uncertainty: ensemble, n unstated/none. Family: `IMG-Q`.
- **L58-M16 — p. 13, Photo 7.** Solid-column morphology at `Ta=-13.8 °C`, `p=41 mmHg`, ×33. Sample/uncertainty: ensemble, n unstated/none. Family: `IMG-Q`.
- **L58-M17 — p. 13, Photo 9.** Skeletal morphology at about 72 mmHg, ×33. Temperature/sample count/uncertainty: unreported. Family: `IMG-Q`.
- **L58-M18 — p. 14, Photo 8a–d.** Observable: odd-shape formation through successive stages. Conditions: `T=-15 to -12 °C`, `p=38 mmHg`; ×26. Sample: one displayed history or closely related crystals; exact identity/n not stated. Uncertainty: none. Family: `IMG-Q`. Caveat: repeated stages are not replicates.
- **L58-M19 — p. 14, Photo 10a–d.** Observable: habit history under Fig. 4 conditions. Units: ×33 plus Fig. 4 °C/mmHg/time. Sample: one varying-condition sequence. Uncertainty: none. Family: `IMG-Q`; overlaps M06.
- **L58-M20 and M21 — p. 14, Photos 13 and 14.** Observable: sheath morphology. Units: ×33 (**M20**) and ×10 (**M21**). Conditions/sample/uncertainty: not reported, displayed crystals only/none. Family: `IMG-Q`. Caveat: likely related views; independence unknown.
- **L58-M22 — p. 15, Photo 11a–f.** Observable: same-run habit transitions under Fig. 5 conditions. Units: 500 µm scale plus Fig. 5 °C/mmHg/time. Sample: one sequence. Uncertainty: none. Family: `IMG-Q`; overlaps M07–M08.
- **L58-M23 — p. 15, Photo 12a–f.** Same fields for Fig. 7 conditions. Sample: one sequence. Uncertainty: none. Family: `IMG-Q`; overlaps M09–M10.
- **L58-M24 — p. 16, Photo 15.** Apparent pyramidal-face column morphology, ×51. Prose conditions: about -24 °C while pressure increased from 20 to 200 mmHg. Sample/uncertainty: displayed crystal/none. Family: `IMG-Q`; crystallographic assignment is explicitly tentative.
- **L58-M25 — p. 16, Photo 16.** Apparent rhombohedral morphology at `T=-15.2 °C`, `p=38 mmHg`, ×38. Sample: one displayed crystal. Uncertainty: none. Family: `IMG-Q`; classification tentative.
- **L58-M26 — p. 16, Photo 17.** Same observable at `T=-16.0 °C`, `p=72 mmHg`, ×38. Sample: one displayed crystal. Uncertainty: none. Family: `IMG-Q`; classification tentative.
- **L58-M27 — p. 16, Photo 18.** Multilayer sheath morphology; source scale 1 mm. Other conditions/sample count/uncertainty: omitted. Family: `IMG-Q`.
- **L58-M28 — p. 16, Photo 19a–d.** Observable: same-sequence sector-to-dendrite transition. Conditions: `p=178, 214, 285, 310 mmHg`; final `T=-16 °C`; ×23. Sample: one crystal history. Uncertainty: none. Family: `IMG-Q`. Caveat: intermediate temperatures are not printed.
- **L58-M29 — p. 16, Photo 20.** Dendritic morphology at `Ta=-14.7 °C`, `p=1 atm`, ×27. Sample: ensemble, n unstated. Uncertainty: none. Family: `IMG-Q`.
- **L58-M30 — pp. 5, 7 prose.** Observable: low-pressure habit threshold: below about 70 mmHg only solid hexagonal columns without cavity/skeletal/dendritic form were observed, over the tested range down to -30 °C; skeletal hollows appeared above about 70 mmHg. Units: mmHg, °C, habit. Sample: aggregate experiment set, n unstated. Uncertainty: “about”; no interval. Family: `PROSE-TRANS`. Overlaps Fig. 9/Photos 5–9.
- **L58-M31 — p. 7 prose.** Sector/dendritic onset above about 300 mmHg for `Ta=-10 to -20 °C`. Units: mmHg, °C, habit. Sample/n: aggregate, unstated. Uncertainty: approximate threshold only. Family: `PROSE-TRANS`; overlaps Fig. 9 and varying-condition histories.
- **L58-M32 — pp. 7–8 prose.** Sheath/scroll did not appear before pressure recovered to about 200 mmHg under near-water-equilibrium conditions. Units: mmHg, habit. Sample/n: aggregate, unstated. Uncertainty: approximate. Family: `PROSE-TRANS`; overlaps Fig. 9/Photos 13–14/18.
- **L58-M33 — p. 7 prose.** Needle transition block: ordinary-pressure needles at -4 to -6 °C; at 30 mmHg thin tips were lost; near 100 mmHg thick plates sometimes formed at needle ends. Units: °C, mmHg, habit. Sample/n: aggregate and explicitly insufficient for a firm conclusion at about 100 mmHg. Uncertainty: none beyond “about/sometimes.” Family: `PROSE-TRANS`. Caveat: retain the author’s uncertainty rather than converting this to a boundary.
- **L58-M34 — p. 5 prose, derived from current photomicrographs.** Observable: limiting habit `Gamma=sqrt[(dc²/dt)/(da²/dt)]` for solid low-pressure columns, reported scattered around an average nearly equal to 1 with no systematic temperature/pressure trend. Units: dimensionless. Sample/n: photomicrographic growth histories, unstated. Uncertainty: qualitative scatter only. Family: `PROSE-TRANS`. Caveat: same underlying histories as Fig. 3 and possibly Photo 8; formula-derived, not an independent replicate set.

The p. 1 summary objects, Figs. 12–13, and prose conclusions reproducing those syntheses are not additional independent units. The paper’s 10–20 mmHg evacuation/near-300 mmHg regrowth statements describe the same Photo 11/12 histories. Literature comparisons to hydrogen/carbon-dioxide work and Nakaya boundaries are secondary.

## 3. Levi & Kobayashi (1967), ice filaments in a vapour-pressure gradient

PDF: `gonda-1967-vapor-gradient-filaments.pdf`; visual inspection confirmed for pages 1–11 of 11.

Full-text verdict: **INCLUDE.** This is a primary low-pressure diffusion-chamber study of simultaneous deposition and sublimation that forms sheets, bead-and-neck filaments, and apparent crystal “rise.” The authors explicitly state that vapour-pressure gradient and relative humidity were not directly measured; later numerical profiles are estimates.

### Complete source-object census and disposition

- p. 2, Fig. 1: low-pressure chamber apparatus. `COND-ONLY`.
- p. 5, Table 1: calculated linear temperature/vapour-density/equilibrium profiles for an assumed 30 cm source-to-sink jar from +30 °C to -30 °C at 2.5 cm increments. `MODEL/SECONDARY`, not measured data.
- p. 6, Fig. 10: calculated temperature/vapour-density profiles at 58 and 5 mmHg plus three experimentally observed thermistor points. Only the experimental points are eligible; all curves/dashed vapour profiles are model estimates.
- p. 7, Fig. 11a–b: schematic constant-vapour-density lines around bead/neck and cylindrical filaments. `MODEL/SECONDARY`.
- p. 10, Fig. 2: initial ice growth on a fine thread, ×30. Eligible image ensemble.
- p. 10, Fig. 3a–e: isolated crystal apparently rising and leaving a filament, ×40. Eligible same-crystal sequence.
- p. 10, Fig. 4a–c: sheet-to-filament formation, ×20. Eligible sequence.
- p. 10, Fig. 5a–c: late-stage filament breakage/evaporation, ×20. Eligible sequence.
- p. 10, Fig. 6a–c: ice-sheet growth/separation, ×20. Eligible sequence.
- p. 11, Fig. 7a–d: bead-and-neck formation, ×100. Eligible timed sequence.
- p. 11, Fig. 8a–c: ice-filament growth, ×100. Eligible sequence at wider time spacing than Fig. 7.
- p. 11, Fig. 9a–c: filament breaking and post-break evaporation, ×100. Eligible sequence.
- No other numbered/unnumbered table, graph, or photograph appears.

### Candidate measurement units (13)

- **F67-M01 — p. 10, Fig. 2.** Observable: initial habit/nucleation distribution on fine thread. Conditions: nucleation near -5 °C, chamber evacuated to about 10 mmHg, directional vapour flux; source units ×30. Sample: displayed thread ensemble, n unstated. Uncertainty: none. Family: `IMG-Q`.
- **F67-M02 — p. 10, Fig. 3a–e.** Observable: same-crystal geometry during lower-face sublimation and filament formation. Conditions: isolated crystal in the low-pressure gradient; total process about 30 min. Units: ×40 and prose time. Sample: one crystal. Uncertainty: none. Family: `IMG-Q`; repeated observations are not replicates.
- **F67-M03 — p. 10, Fig. 4a–c.** Observable: sheet narrowing/separation into filaments. Conditions: same experimental regime; ×20. Sample: displayed crystal group/sequence, exact n unstated. Uncertainty: none. Family: `IMG-Q`.
- **F67-M04 — p. 10, Fig. 5a–c.** Observable: late-stage breakage and disappearance of filament fragments. Conditions: same regime; ×20. Sample: displayed sequence, n unstated. Uncertainty: none. Family: `IMG-Q`.
- **F67-M05 — p. 10, Fig. 6a–c.** Observable: sheet growth, thickness bands, grain-boundary separation, and necks to overlying crystals. Conditions: same regime; ×20. Sample: displayed sequence/group, n unstated. Uncertainty: none. Family: `IMG-Q`.
- **F67-M06 — p. 11, Fig. 7a–d.** Observable: bead-and-neck geometry versus time. Conditions: same regime; ×100. Timing: a→b 2 min, b→c 80 s, c→d 40 s; a new neck starts about 6 µm above the thread; the widest marked sheet B is 75 µm. Sample: one displayed group with tracked filament A. Uncertainty: none. Family: `IMG-Q` time series.
- **F67-M07 — p. 11, Fig. 8a–c.** Observable: tracked bead/neck positions and coalescence along filaments A–F. Conditions: same regime; ×100; intervals stated only to be longer than Fig. 7. Sample: one displayed structure. Uncertainty: none. Family: `IMG-Q`.
- **F67-M08 — p. 11, Fig. 9a–c.** Observable: break at a neck and subsequent evaporation. Conditions: same regime; ×100; filament disappears about 4 min after Fig. 9a. Sample: two nearby filaments A/B in one displayed history. Uncertainty: none. Family: `IMG-Q`.
- **F67-M09 — p. 6, Fig. 10 experimental points only.** Observable: chamber temperature at three thermistor heights (1 cm spacing) near the threads. Conditions: profiles shown for total pressures 58 and 5 mmHg; the exact point-to-curve association should be checked during extraction rather than inferred. Axes: height in cm, temperature in °C. Sample: three observed points; replicate count unstated. Uncertainty: none. Family: `PLOT-DIG`. Caveat: do not digitize the calculated solid/dashed curves as measurements.
- **F67-M10 — pp. 4–5 prose with Fig. 7 overlap.** Observable: filament microgeometry: bead maximum cross-section diameter about 10–30 µm, bead length about 50 µm, marked sheet B width 75 µm, new-neck offset about 6 µm, and typical curved-surface radius about 10–15 µm. Conditions: low-pressure directional-flux structures. Sample: aggregate observations, n unstated. Uncertainty: approximate ranges only. Family: `PROSE-TRANS`/image overlap. Caveat: 75 µm and 6 µm duplicate Fig. 7; curvature participates in later interpretation.
- **F67-M11 — pp. 4–5 prose with Figs. 7–9 overlap.** Observable: structure kinetics/turnover: total height order 1 mm after 1–2 h; corresponding growth velocity 8–17 µm/min; bead formation every 3–4 min; roughly one of every five new beads disappears/coalesces; a broken filament disappears in about 4 min. Sample: multiple film sequences, n unstated. Reported uncertainty: authors call average velocity indeterminate by a factor of two because conditions were not exactly reproducible and beads disappeared. Family: `PROSE-TRANS`. Caveat: the 4 min result duplicates Fig. 9; cadence and turnover are not independent if derived from the same films.
- **F67-M12 — p. 2 prose.** Observable: absence of crystals on suspended threads below about 10 mmHg. Conditions: low-pressure chamber with directional water-vapour flux. Units: mmHg, binary appearance. Sample/n: aggregate runs, unstated. Uncertainty: approximate threshold only. Family: `PROSE-TRANS`. Caveat: a null observation with an unknown run denominator; retain as an uncertain threshold candidate rather than a proved physical cutoff.
- **F67-M13 — p. 2 prose.** Observable: nucleation below -10 °C produced more spatially separated crystals on the threads than nucleation near -5 °C, without changing the main phenomenon. Units: °C and qualitative separation. Sample: described as only a few lower-temperature cases; n unstated. Uncertainty: none. Family: `PROSE-TRANS`. Caveat: sparse qualitative subset.

Protocol/context numerics retained but not counted as outcomes: fine threads a few millimetres apart about 3 cm above the bottom; bottom about -30 °C; time-lapse one frame per 2.5 s; and observed range mostly 0 to -20 °C. Calculated vapour density/flux values, Table 1, and non-point portions of Fig. 10 are excluded as model-conditioned.

## 4. Higuchi (1969), radiative cooling

PDF: `gonda-1969-radiative-cooling.pdf`; visual inspection confirmed for pages 1–5 of 5.

Full-text verdict: **EXCLUDE.** The paper derives radiative-cooling equilibrium and critical supersaturation. It contains no new ice-growth experiment, observational table, or primary image.

### Complete source-object and numerical-result census

- p. 2, Fig. 1: calculated critical supersaturation versus surface temperature for idealized radii (including 0.01 through 1000 µm), with water-saturation/relative-humidity reference lines. `MODEL/SECONDARY`; no sample or uncertainty.
- p. 3, Fig. 2: calculated relative humidity and ice–air temperature difference versus surface temperature for 10, 100, and 1000 µm radii. `MODEL/SECONDARY`; no sample or uncertainty.
- No tables, photographs, or other graphs occur. Equations 1–10 are theoretical derivations.
- Prose numerical examples are all derived or secondary: a 10–20 °C inversion-ground difference from Banks/Partanen/Flowers, assumed `ΔTe=15 °C`; growth-rate comparison values about 0.04 µm/s at 0 °C, 0.006 µm/s at -100 °C, and a Kobayashi value near -50 °C; and the computed example of a 1000 µm particle at -50 °C equilibrating near -48 °C in 81% relative humidity. None qualifies as a new primary measurement unit.

Candidate measurement units: **0**.

## 5. Gonda & Komabayasi (1970), helium–argon mixtures

PDF: `gonda-1970-helium-argon.pdf`; visual inspection confirmed for pages 1–12 of 12.

Full-text verdict: **INCLUDE.** This is a primary one-atmosphere cold-chamber comparison across helium–argon mixtures at water saturation. It reports image ensembles, size summaries, growth-time scatter, surface-structure/branch thresholds, and a temperature–mixture habit map. Table 1 contains calculated/interpolated physical properties and is not a new outcome measurement.

### Complete source-object census and disposition

- p. 2, Fig. 1: chamber apparatus. `COND-ONLY`.
- pp. 3–4, Figs. 2, 3, and 4: image ensembles at -15 °C in argon, 1:1 helium–argon by volume (mean molecular weight 22), and helium; 20 µm scale bars. Three eligible units.
- p. 4, Fig. 5: individual a-axis length versus elapsed time in helium at -15 °C. Eligible plot.
- p. 4, Fig. 6: largest and mean a-axis length at -15 °C versus gas-mixture mean molecular weight; air controls are full circles at 29. Two eligible homogeneous series.
- p. 5, Fig. 7: largest and mean c-axis length at -15 °C versus mean molecular weight. Two eligible series.
- p. 5, Fig. 8: largest and mean `c/a` versus mean molecular weight. Two eligible derived series overlapping Figs. 6–7.
- p. 5, Fig. 9a–b: argon and helium image ensembles at -15 °C, 20 µm scale, emphasizing surface structure. Two eligible panels.
- p. 6, Fig. 10: central unstructured a-axis size versus mean molecular weight, reported as 25th-from-smallest, 12.5th-from-smallest, and minimum series; air controls shown. Three eligible empirical-order-statistic series.
- p. 6, Fig. 11a–b: argon and helium ensembles at -15 °C illustrating first branch traces, 20 µm scale. Two eligible panels.
- p. 7, Fig. 12: critical a-axis size at first branch versus mean molecular weight, using the same three order statistics and air controls. Three eligible series.
- p. 7, Fig. 13a–b: air and helium–argon (mean molecular weight 29) image ensembles at -15 °C, 20 µm scale. Two eligible control/comparison panels.
- p. 8, Fig. 14a–b: helium and argon image ensembles at -7 °C, 20 µm scale, showing hollow versus non-hollow columns. Two eligible panels.
- p. 8, Figs. 15 and 16: largest and mean a-axis and c-axis lengths at -7 °C versus mean molecular weight. Four eligible homogeneous series.
- p. 9, Fig. 17: habit markers versus temperature and mixture mean molecular weight at one atmosphere and water saturation. Eligible compiled primary block, except the solid air boundary attributed to Kobayashi is secondary; dashed regime borders are interpretive.
- p. 10, Table 1: gas molecular weight, water-vapour diffusion coefficient, thermal conductivity, and viscosity at 0 °C/normal pressure. Values are calculated/interpolated or taken from physical tables; `MODEL/SECONDARY`.
- No other numbered or unnumbered figure/table/graph occurs.

### Candidate measurement units (29)

- **HA70-M01 — p. 3, Fig. 2.** Observable: plate size/habit in argon. Conditions: -15 °C, normal pressure, water saturation, silver-iodide seeding; crystals fallen within 40 s. Units: 20 µm scale; prose mean a-axis 26 µm. Sample: displayed ensemble, n unstated. Uncertainty: none. Family: `IMG-Q`. Caveat: mean is a prose summary of the same ensemble.
- **HA70-M02 — p. 3, Fig. 3.** Same observable/conditions in 1:1 helium–argon by volume (mean molecular weight 22); prose mean a-axis about 32 µm. Units/sample/uncertainty: 20 µm scale, ensemble n unstated, none. Family: `IMG-Q`.
- **HA70-M03 — p. 4, Fig. 4.** Same in helium (mean molecular weight 4); prose mean a-axis about 38 µm. Units/sample/uncertainty: 20 µm scale, ensemble n unstated, none. Family: `IMG-Q`.
- **HA70-M04 and M05 — p. 5, Fig. 9a–b.** Observable: surface-structured versus central unstructured region. Conditions: -15 °C, normal pressure, water saturation, fallen within 40 s; argon (**M04**) and helium (**M05**). Units: 20 µm scale. Sample: displayed ensembles, n unstated. Uncertainty: none. Family: `IMG-Q`.
- **HA70-M06 and M07 — p. 6, Fig. 11a–b.** Observable: first trace of six-corner branching. Conditions: same -15 °C regime; argon (**M06**) and helium (**M07**). Units: 20 µm scale. Sample: ensembles, n unstated. Uncertainty: none. Family: `IMG-Q`. Caveat: images underlie the branch-size summaries in Fig. 12.
- **HA70-M08 and M09 — p. 7, Fig. 13a–b.** Observable: size/habit control comparison. Conditions: -15 °C, air (**M08**) and helium–argon mean molecular weight 29 (**M09**), fallen within 40 s. Units: 20 µm scale. Sample: ensembles, n unstated. Uncertainty: none. Family: `IMG-Q`.
- **HA70-M10 and M11 — p. 8, Fig. 14a–b.** Observable: column size and hollow structure at -7 °C; helium (**M10**) and argon (**M11**), water saturation/one atmosphere. Units: 20 µm scale. Sample: ensembles, n unstated. Uncertainty: none. Family: `IMG-Q`.
- **HA70-M12 — p. 4, Fig. 5.** Observable: individual a-axis length versus fall/elapsed time in helium at -15 °C and water saturation. Axes: µm and s. Sample: individual plotted crystals, count recoverable from plot; n not printed. Uncertainty: no bars. Family: `PLOT-DIG`. Caveat: points after 40 s are explicitly considered confounded by vapour depletion and nucleation-height selection; later analyses restrict to ≤40 s.
- **HA70-M13 and M14 — p. 4, Fig. 6.** Observable: largest (**M13**) and mean (**M14**) a-axis length versus mean molecular weight (4, 22, 29, 40, with intermediate mixture condition[s] as plotted) at -15 °C. Units: µm and dimensionless molecular weight. Sample: crystals fallen within 40 s, n per gas unstated. Uncertainty: none. Family: `PLOT-DIG`. Caveat: full-circle air controls at 29 are separate provenance but part of each series.
- **HA70-M15 and M16 — p. 5, Fig. 7.** Largest (**M15**) and mean (**M16**) c-axis length under the Fig. 6 conditions. Units: µm and molecular weight. Sample: n unstated; small-crystal thickness was accepted only when a prism face contacted the glass, while large-crystal thickness used 5 µm focus steps at 120 s. Uncertainty: no statistical bars; 5 µm is acquisition step, not stated error. Family: `PLOT-DIG`.
- **HA70-M17 and M18 — p. 5, Fig. 8.** Largest (**M17**) and mean (**M18**) `c/a` versus mean molecular weight. Units: dimensionless ratio. Sample/uncertainty: inherited from Figs. 6–7, n unstated/none. Family: `PLOT-DIG`. Caveat: derived overlap; do not treat as independent of axis-length series.
- **HA70-M19 through M21 — p. 6, Fig. 10.** Observable: a-axis extent of the central region without surface structure versus mean molecular weight: **M19** 25th percentile in order from smallest, **M20** 12.5th percentile, **M21** minimum. Units: µm and molecular weight. Sample: fallen-within-40-s ensembles, n unstated. Uncertainty: these are order statistics, not confidence intervals. Family: `PLOT-DIG`. Caveat: full-circle air controls have distinct carrier-gas composition.
- **HA70-M22 through M24 — p. 7, Fig. 12.** Observable: a-axis size at initial branch extension versus mean molecular weight: **M22** 25th-from-smallest, **M23** 12.5th-from-smallest, **M24** minimum. Units: µm and molecular weight. Sample: ensemble n unstated. Uncertainty: order statistics only. Family: `PLOT-DIG`. Prose summaries from the same data: argon mean onset about 14 µm, minimum about 12 µm, 12.5%-cut size about 13.5 µm; helium mean onset about 34 µm. These are overlaps, not extra units.
- **HA70-M25 and M26 — p. 8, Fig. 15.** Largest (**M25**) and mean (**M26**) a-axis length at -7 °C versus mean molecular weight. Units: µm and molecular weight. Sample: n unstated. Uncertainty: none. Family: `PLOT-DIG`.
- **HA70-M27 and M28 — p. 8, Fig. 16.** Largest (**M27**) and mean (**M28**) c-axis length at -7 °C versus mean molecular weight. Units/sample/uncertainty: as Fig. 15. Family: `PLOT-DIG`.
- **HA70-M29 — p. 9, Fig. 17.** Observable: habit category over `T` and gas-mixture mean molecular weight (nominal columns at 4, 10, 22, 29, 40). Conditions: -3 to -20 °C, water saturation, one atmosphere. Axes: °C and mean molecular weight; categorical markers distinguish hollow prism, skeleton/no-skeleton column, branched/skeletal/thick/thin plates. Sample: individual experimental conditions; marker and replicate counts unstated. Uncertainty: no boundary uncertainty. Family: `PLOT-DIG`. Caveat: exclude Kobayashi’s solid air line as secondary; dashed borders are author interpretation, and the current mean-weight-29 helium–argon markers are not equivalent provenance to air.

Protocol numerics that condition all units but are not outcomes include chamber 40 cm × 10 cm; gas-mixture preparation to one atmosphere; -15 °C target after cooling around -16.8 to -17.2 °C; heater/fan/settling schedule; photographs every 20 s; and 5 µm focus steps at 120 s. The paper reports no statistical uncertainty or replicate count. Physical constants in Table 1 must not be used as current experimental measurements.

## 6. Komabayasi (1970), shape instability of ice, carbon dioxide, and ammonia

PDF: `gonda-1970-shape-instability.pdf`; visual inspection confirmed for pages 1–17 of 17.

Full-text verdict: **INCLUDE ELIGIBLE SUBSET.** The paper is overwhelmingly perturbation theory and calculated sensitivity analysis, but its closing cold-chamber section contains new primary experiments. Only the water-ice observations in Fig. 9 are in scope; the carbon-dioxide and ammonia crystals are non-ice.

### Complete source-object census and disposition

- p. 6, Table 1: numerical gas/property inputs for Eq. 36 at -15 °C and 1 atm. Literature/calculated inputs; `MODEL/SECONDARY`.
- p. 6, Tables 2 and 3: calculated critical wave number versus crystal radius/carrier gas at supersaturation 0.10 and 0.01. `MODEL/SECONDARY`.
- p. 7, Fig. 1: calculated critical wave number versus ice-sphere radius in hydrogen, helium, air, argon, and carbon dioxide at -15 °C. `MODEL/SECONDARY`.
- p. 8, Fig. 2: calculated perturbation/sphere growth ratio versus wave number at -15 °C, supersaturation 0.10, `R=10 µm`, perturbation 1 µm. `MODEL/SECONDARY`.
- p. 9, Fig. 3 and Table 4: calculated pressure dependence at -15 °C, supersaturation 0.10. `MODEL/SECONDARY`.
- p. 9, Fig. 4 and p. 10, Table 5: corresponding supersaturation-0.01 calculations. `MODEL/SECONDARY`.
- p. 10, Fig. 5: calculated supersaturation sensitivity at -15 °C and `R=50 µm`. `MODEL/SECONDARY`.
- p. 10, Fig. 6: calculated diffusivity/pressure sensitivity at -15 °C and `R=50 µm`. `MODEL/SECONDARY`.
- p. 11, Fig. 7: calculated radius sensitivity at -15 °C, supersaturation 0.10, 1 atm. `MODEL/SECONDARY`.
- p. 14, Fig. 8a–b: primary carbon-dioxide crystals in nitrogen at normal pressure, -100 and -105 °C; horizontal photograph width 4 mm. **Exclude: non-ice.**
- p. 14, Fig. 9a: primary water-ice crystals in nitrogen at normal pressure and -110 °C; photograph width 4 mm. Eligible.
- p. 14, Fig. 9b: simultaneous carbon-dioxide and water-ice crystals in nitrogen at normal pressure and -110 °C; photograph width 4 mm. Eligible only for the ice crystal(s), with mixed-object segmentation caveat.
- p. 14, Fig. 10a–b: primary ammonia crystals in nitrogen at normal pressure, -140 and -130 °C; photograph width 4 mm. **Exclude: non-ice.**
- No other numbered/unnumbered figure, graph, table, or photograph appears. Equations and numerical sensitivity statements outside the experimental section are theoretical. Later helium/argon, low-pressure, and mesospheric-ice comparisons summarize other sources and are secondary.

### Candidate measurement units (2)

- **SI70-M01 — p. 14, Fig. 9a.** Observable: ice-crystal dendritic morphology, including branches described as meeting at nearly 90°. Conditions: water vapour supplied into nitrogen, normal pressure, -110 °C; unseeded/heterogeneous nucleation details are uncertain. Source units: horizontal field width 4 mm; categorical habit and image geometry. Sample: displayed ensemble, n unstated. Uncertainty: none. Family: `IMG-Q`. Caveat: the very low temperature is still a laboratory vapour-growth ice measurement, but its atmospheric-domain relevance should be decided later, not silently assumed.
- **SI70-M02 — p. 14, Fig. 9b.** Observable: ice dendritic morphology during simultaneous water-vapour/carbon-dioxide growth. Conditions: nitrogen, normal pressure, -110 °C; mixed vapours. Source units: horizontal field width 4 mm. Sample: one or more ice crystals among coexisting carbon-dioxide crystals, n unstated. Uncertainty: none. Family: `IMG-Q`. Caveat: object-type segmentation is mandatory and this panel is not an independent control for Fig. 9a unless run identity is established.

The experimental apparatus spans roughly -80 to -150 °C and used about 20 ml/min carbon-dioxide flow for the non-ice runs; these are condition metadata, not eligible outcomes. Fig. 9’s “nearly 90°” branch angle is a prose/image overlap, not a third unit.

## 7. Gonda & Komabayasi (1971), skeletal/dendritic structure versus conductivity and diffusivity

PDF: `gonda-1971-skeletal-dendritic.pdf`; visual inspection confirmed for pages 1–11 of 11.

Full-text verdict: **INCLUDE.** Two primary experiment series vary thermal conductivity at fixed water-vapour diffusivity and vary diffusivity at fixed conductivity. Photographs were taken 40 s after seeding while water fog persisted. Tables 1–2 are adopted condition matrices, not measured outcomes.

### Complete source-object census and disposition

- p. 2, Table 1: adopted helium–argon mixture mean molecular weights, pressures, fixed diffusivity 0.770 cm²/s, and conductivities 3.78–34.4 ×10^-5 cal cm^-1 s^-1 deg^-1. `COND-ONLY` design block; property values rely on prior gas-property information.
- p. 2, Table 2: adopted helium pressure (760, 380, 253, 190, 126 mmHg), diffusivity (0.77, 1.54, 2.31, 3.08, 4.62 cm²/s), and fixed conductivity 34.4 ×10^-5 cal cm^-1 s^-1 deg^-1. `COND-ONLY` design block.
- p. 4, Fig. 1a–e: -15 °C image ensembles across five conductivities at fixed diffusivity, 20 µm scales. Five eligible condition-labelled panels.
- p. 5, Fig. 2a–e: corresponding -7 °C ensembles. Five eligible panels.
- p. 6, Fig. 3: mean a-axis length versus conductivity at -15 and -7 °C. Two eligible homogeneous temperature series.
- p. 6, Fig. 4: mean c-axis length versus conductivity at -15 and -7 °C. Two eligible series.
- p. 6, Fig. 5: mean `c/a` versus conductivity at -15 and -7 °C. Two eligible derived series.
- p. 7, Fig. 6a–c: -15 °C image ensembles at diffusivities 0.770, 3.08, and 4.62 cm²/s under fixed conductivity, 20 µm scales. Three eligible panels.
- p. 7, Fig. 7a–c: -7 °C image ensembles at diffusivities 0.770, 1.54, and 2.31 cm²/s, 20 µm scales. Three eligible panels.
- p. 8, Fig. 8: mean c-axis length versus diffusivity at -15 and -7 °C. Two eligible series.
- p. 8, Fig. 9: mean `c/a` versus diffusivity at -15 and -7 °C. Two eligible derived series.
- No other numbered/unnumbered figure, table, graph, or photograph appears. Page 11 is a Japanese summary of the same results, not a new unit.

### Candidate measurement units (26)

- **SD71-M01 through M05 — p. 4, Fig. 1a–e.** Observable: plate size, skeletal structure, and branching at -15 °C. Common conditions: water saturation, fixed `D=0.770 cm²/s`, photographs 40 s after silver-iodide seeding. Panel conductivities in `10^-5 cal cm^-1 s^-1 deg^-1`: **M01** 3.78, **M02** 5.47, **M03** 10.22, **M04** 15.55, **M05** 34.4. Source units: 20 µm scales. Sample: ensemble per panel, n unstated and only described as kept nearly equal. Uncertainty: none. Family: `IMG-Q`.
- **SD71-M06 through M10 — p. 5, Fig. 2a–e.** Observable: column/sheath/hollow size and morphology at -7 °C. Same `D`, timing, saturation, conductivity sequence, scale, sample limitations, and uncertainty as M01–M05. Family: `IMG-Q`.
- **SD71-M11 and M12 — p. 6, Fig. 3.** Observable: mean a-axis length versus conductivity for -15 °C (**M11**) and -7 °C (**M12**) at fixed `D=0.770 cm²/s`. Axes: µm and `10^-5 cal cm^-1 s^-1 deg^-1`. Sample: repeated experiments pooled at each condition, n unstated. Dispersion: bar top/bottom are the observations at 1/4 and 3/4 in order from the largest (an empirical middle-range statistic), not a standard error. Family: `PLOT-DIG`; morphology icons are categorical annotations.
- **SD71-M13 and M14 — p. 6, Fig. 4.** Mean c-axis length versus conductivity for -15 °C (**M13**) and -7 °C (**M14**), same units/sample/empirical bars as Fig. 3. Family: `PLOT-DIG`.
- **SD71-M15 and M16 — p. 6, Fig. 5.** Mean `c/a` versus conductivity for -15 °C (**M15**) and -7 °C (**M16**). Units: ratio and conductivity. Sample/dispersion: inherited pooled ensembles and 1/4-to-3/4 order bars. Family: `PLOT-DIG`. Caveat: derived from axis dimensions; prose limits near 0.6 and 1.4 overlap this graph.
- **SD71-M17 through M19 — p. 7, Fig. 6a–c.** Observable: branching/skeletal morphology at -15 °C and fixed `k=34.4×10^-5 cal cm^-1 s^-1 deg^-1`; diffusivities **M17** 0.770, **M18** 3.08, **M19** 4.62 cm²/s. Units: 20 µm scales. Sample: ensemble per panel, n unstated. Uncertainty: none. Family: `IMG-Q`.
- **SD71-M20 through M22 — p. 7, Fig. 7a–c.** Observable: hollow/solid column morphology at -7 °C under the same fixed conductivity; diffusivities **M20** 0.770, **M21** 1.54, **M22** 2.31 cm²/s. Units/sample/uncertainty: 20 µm, ensemble n unstated, none. Family: `IMG-Q`.
- **SD71-M23 and M24 — p. 8, Fig. 8.** Mean c-axis length versus diffusivity for -15 °C (**M23**) and -7 °C (**M24**) at fixed conductivity. Axes: µm and cm²/s. Sample: pooled/repeated experiments, n unstated. Dispersion: 1/4-to-3/4 order bars, not inferential uncertainty. Family: `PLOT-DIG`.
- **SD71-M25 and M26 — p. 8, Fig. 9.** Mean `c/a` versus diffusivity for -15 °C (**M25**) and -7 °C (**M26**). Units: ratio and cm²/s. Sample/dispersion: as Fig. 8. Family: `PLOT-DIG`. Caveat: ratio approaches unity in prose; that prose is graph overlap.

No formal uncertainty or sample counts are reported. The explicit plotted bars preserve within-ensemble order spread only. Protocol facts—fog lasting about 1 min, photographs at 40 s, chamber 10 cm × 40 cm, and saturation over water—condition the units but are not additional measurement outcomes.

## 8. Crowther & Saunders (1973), ice growth in electric fields

PDF: `gonda-1973-electric-fields.pdf`; visual inspection confirmed for pages 1–7 of 7.

Full-text verdict: **INCLUDE.** The paper reports primary diffusion-chamber needle-growth and substrate epitaxial-growth measurements under electric fields. Its discussion includes secondary mechanisms/calculations, which are not measurement units.

### Complete source-object census and disposition

- p. 2, Fig. 1: small cold-chamber/electrode apparatus for epitaxial ice growth. `COND-ONLY`.
- p. 2, Fig. 2: time lag before field-enhanced growth versus electric-field strength for ice near -12 °C. Eligible plot.
- p. 2, Table 1: crystallographic growth-axis distribution in three chamber temperature ranges, with percentages and examined counts. Eligible primary table block.
- p. 3, Fig. 3: mean ice-needle growth rate versus electric field at -12 °C. Eligible plot.
- p. 3, Fig. 4: basal-face area versus time for three simultaneously growing hexagonal plates, with field application marked. Three eligible individual-crystal series.
- p. 4, Fig. 5: thickness versus time for two hexagonal plates, one no-field and one field-applied series. Two eligible individual-crystal series.
- No photographs or additional numbered/unnumbered table/graph appears. Discussion equations for field intensification and numerical molecular-orientation estimates are `MODEL/SECONDARY`.

### Candidate measurement units (13)

- **EF73-M01 — p. 2, Table 1.** Observable: growth-axis category distribution. Rows: -3 to -5 °C: 97% `<0001>`, 3% `<11-20>`, 0% `<10-10>`, `N=112`; -11 to -15 °C: 15%, 85%, 0%, `N=184`; -20 to -25 °C: 0%, 92%, 8% (one crystal), `N=12`. Conditions: diffusion chamber; habit determined by switching off the field and allowing needles to branch at -13 °C. Units: percent, count, °C, crystallographic direction. Sample: 308 crystals total across rows. Uncertainty: no binomial intervals or field-strength distribution reported. Family: `TAB-TRANS`. Caveat: pooled electric-field conditions are not stated per row.
- **EF73-M02 — p. 2, Fig. 2.** Observable: delay from field application to enhanced needle growth versus applied field. Conditions: ice growing at -12 °C. Axes: time lag in s, electric field in `10^5 V/m`. Sample: points/aggregates, n not stated. Uncertainty: vertical bars are drawn at several fields but their statistic is not defined in text; preserve them as “reported bar, semantics unstated.” Family: `PLOT-DIG`.
- **EF73-M03 — p. 3, Fig. 3.** Observable: needle growth rate versus applied field at -12 °C. Axes: growth rate in `10^-5 cm/s`, field in `10^5 V/m`. Sample: each point is the mean of measurements on about 12 crystals; only unbroken cine-film intervals were used because fragments were lost. Uncertainty: no bars/statistical interval. Family: `PLOT-DIG`. Caveat: survivor/unbroken-period selection is explicit.
- **EF73-M04 through M06 — p. 3, Fig. 4 series 1–3.** Observable: basal surface area versus time for three individual plates (**M04** curve 1, **M05** curve 2, **M06** curve 3). Conditions: simultaneous epitaxial growth at -12.1 °C, 17% supersaturation relative to ice; field `7.5×10^4 V/m` applied at the vertical line (about 175 s by the plot). Axes: surface area in `10^-10 m²`, time in s. Sample: one crystal per curve. Uncertainty: scatter around fitted lines, no formal error. Family: `PLOT-DIG`. Caveat: simultaneous crystals can interact; the authors say isolated crystals were selected but also report wide crystal-to-crystal rate variation.
- **EF73-M07 and M08 — p. 4, Fig. 5.** Observable: plate thickness versus time for two individual crystals: **M07** curve 1, no electric field; **M08** curve 2, `7.5×10^4 V/m` applied at the marked time. Axes: µm, s. Conditions: epitaxial apparatus; exact temperature/supersaturation are not repeated in the caption and should not be inherited from Fig. 4 without provenance confirmation. Sample: one crystal per curve. Uncertainty: no formal error; thickness points were read at minimum reflected intensity. Family: `PLOT-DIG`. Caveat: two different crystals, not before/after treatment of one specimen.
- **EF73-M09 — p. 2 prose.** Observable: minimum field for field-modified growth in the warm needle regime, about `4.9×10^4 V/m` at -3 to -5 °C. Sample/n: aggregate chamber observations, unstated. Uncertainty: “about,” no interval. Family: `PROSE-TRANS`.
- **EF73-M10 — p. 2 prose.** Minimum field `4.6×10^4 V/m` at -11 to -15 °C. Sample/n: aggregate, unstated. Uncertainty: no interval. Family: `PROSE-TRANS`. Caveat: abstract’s “more than thirty times” above 4.6×10^4 V/m overlaps this threshold and Fig. 3 rather than forming another unit.
- **EF73-M11 — p. 2 prose.** Observable: at -12 °C, ordinary side branches did not develop until field fell below `2.9×10^4 V/m`. Sample/n/uncertainty: not stated. Family: `PROSE-TRANS`. Caveat: threshold direction is tied to field reduction after modified growth, not necessarily onset from zero.
- **EF73-M12 — p. 3 prose.** Observable: epitaxial crystals grown with or without a field for 5–20 min developed concave upper surfaces/hexagonal cups. Units: min, habit. Sample/n: unstated aggregate. Uncertainty: range only. Family: `PROSE-TRANS`; no displayed image.
- **EF73-M13 — p. 5 prose with Fig. 4 context.** Observable: at constant temperature and supersaturation, fastest versus slowest epitaxial basal-area growth differed by a factor of 25. Sample/n: broader epitaxial observations, not stated. Uncertainty: no distribution. Family: `PROSE-TRANS`. Caveat: may include data beyond the three Fig. 4 crystals; keep lineage unresolved.

Protocol numerics retained as conditions, not extra outcomes: diffusion-chamber gradient 0 to -30 °C; cine rate 2–20 frames/min; uniform epitaxial field over the first 1.5 mm; and microscopy/interference-fringe thickness measurement. Secondary literature values (cloud fields, prior 10–100× acceleration) and calculated tip-field requirements/intensification are excluded.

## Cross-source cautions for later S3/S4

- The 130-unit count is deliberately pre-deduplication. Time/condition plots, morphology trajectories, photographs, and prose thresholds often describe the same run. Formal classification must retain lineage links and must not treat each representation as independent evidence.
- “Mean” curves without `n`, quartile/order bars, largest/minimum summaries, and visible but undefined bars must remain distinct uncertainty states. None licenses a fabricated standard error.
- Magnification-only photographs do not provide a physical calibration unless the original optical/print scale is independently recoverable; scale-bar and stated field-width images are stronger extraction candidates.
- Habit-map boundary curves are interpretations. Individual source markers/rows/images are the observational layer.
- Tables of carrier-gas properties and all calculated radiative/shape-instability curves are not primary ice-growth measurements even when they numerically condition a primary experiment.
- The 1970 shape-instability paper must be split by species: eligible water ice in Fig. 9 only; carbon dioxide/ammonia panels remain out of scope.
- No source in this batch reports a modern formal uncertainty budget. The only explicit uncertainty-like statements are the factor-of-two velocity indetermination in Levi & Kobayashi (1967), empirical order spans in Gonda & Komabayasi (1971), and undefined bars in Crowther & Saunders Fig. 2.
