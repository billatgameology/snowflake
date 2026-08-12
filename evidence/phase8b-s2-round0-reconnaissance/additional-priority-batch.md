# Phase 8B S2 full-text eligibility and measurement-unit reconnaissance — five acquired leads

This is page-complete S2 reconnaissance, not either formal S3 independent classification pass.
All 91 PDF pages were rendered and visually inspected offline, with `pdftotext` used only as a
second reading aid. No target coordinates were digitized and no extraction operator is implied.

## Colbeck 1983 — low supersaturation / high temperature

Source: `colbeck-1983-low-supersaturation-high-temperature.pdf`, DOI
`10.1063/1.332290`, 6 PDF pages. Scope verdict: **include primary controlled measurements**.
The experiment grew crystals on a hair midway between two ice plates in a 1 cm by 10 cm
diffusion cavity. Temperature and plate difference define the imposed vapor field; morphology is
the principal observed response. The paper mixes those direct observations with model-derived
surface-adjacent vapor density and mass-growth quantities.

Potential measurement units:

- PDF p1, Figs. 1 and 3: qualitative seasonal-snow equilibrium/surface-hoar morphologies and
  stated gradient regimes. These are contextual field photographs, not the controlled-run series;
  lineage and independence from the chamber runs must stay separate.
- PDF p2, Fig. 2: qualitative depth-hoar morphology at stated gradients of at least
  0.1–0.2 °C cm-1; contextual field observation, not the chamber series.
- PDF p2, Fig. 4: one chamber crystal (experiment XXXIII), morphology and growth orientation.
- PDF p3, Fig. 5: calculated vapor-density difference versus plate temperature difference at
  multiple crystal temperatures. Derived model series, not a direct measurement target.
- PDF p4, Table I: 31 listed experiments (I–XII, XIV, XVI–XXII, XXIV–XXXIII, XXXV–XXXVI),
  each with crystal temperature (°C), plate temperature difference (°C), calculated vapor-density
  difference (g cm-3), derived kinetic parameter, and derived surface-adjacent excess vapor density
  (g cm-3). Temperature inputs are measured; vapor-density and kinetic columns are calculated.
  Table morphology symbols are linked to Fig. 6/7. No row-level uncertainty column is reported.
- PDF p4, Fig. 6: one point per chamber experiment, crystal morphology versus temperature and
  calculated vapor-density difference; four points are explicitly imported from Rottner and Vali
  and must be separated from the local experiment ensemble.
- PDF p4, Fig. 7: photographs keyed by experiment number, qualitative morphology evidence from
  the same chamber rows as Table I/Fig. 6, not independent measurements.
- PDF p5, Fig. 8: temperature-dependent “inherent” mass-growth rate normalized from Lamb and
  Hobbs; secondary/model-derived, not a local chamber measurement.
- PDF p5, Fig. 9: dimensionless model curves separating surface-kinetic and diffusion control;
  theory only.
- PDF p6, Fig. 10: the Fig. 6 chamber ensemble replotted against model-derived surface-adjacent
  vapor density; same experimental lineage as Table I/Fig. 6, not a new witness.
- Prose result: transition near surface-adjacent excess vapor density 5–6 × 10-10 g cm-3
  (roughly 10-4 supersaturation) above about -6 °C; derived from the morphology ensemble and model,
  with no explicit statistical uncertainty.

Extraction families if later admitted: exact table transcription (Table I); categorical morphology
coding with image/legend QA (Figs. 6–7); plot digitization only for the two replots if Table I does
not fully reconstruct them. Reported uncertainty is generally absent; model/form uncertainty must
remain separate from extraction uncertainty.

## Libbrecht, Morrison and Faber 2008 — free-fall convection chamber

Source: `libbrecht-2008-freefall-growth-dynamics.pdf`, arXiv `0811.2994`, 23 PDF pages.
Scope verdict: **include primary controlled measurements**. Crystals grew in a free-fall convection
chamber in air/nitrogen/argon near one bar; optical diameter and thickness were measured from
ensembles collected at different growth times. The paper states roughly 20% overall uncertainty in
far-field supersaturation and derived quantities, dominated by systematic error.

Potential measurement units (each figure may contain several homogeneous condition-series):

- PDF p2, Fig. 1: coverage map of temperature/supersaturation settings; experimental-design
  inventory, not an outcome series.
- PDF p3, Fig. 2: diameter and thickness versus growth time at -2 °C for far-field
  supersaturation 1.1% and 2.4%; each point is one plate crystal.
- PDF p6, Fig. 3: -5.5 °C crystal diameter versus time under two nucleation-pressure conditions;
  competition/sampling control series.
- PDF p7, Fig. 4: diameter and thickness versus time at -5.5 °C for several supersaturations,
  including model overlays. Preserve individual-crystal points and distinguish plate-only subsets.
- PDF p8, Fig. 5: aspect-ratio distribution at -8 °C; categorical/ensemble histogram.
- PDF p9, Fig. 6: -8 °C plate-crystal diameter/thickness versus time for multiple
  supersaturations with model curves.
- PDF p10, Fig. 7: -10 °C diameter/thickness versus time across the measured supersaturation
  ladder; records the abrupt thickness transition.
- PDF p11, Fig. 8: diameter and thickness at 200 s versus supersaturation at -10 °C; repeated
  summary of Fig. 7 lineage, not an independent witness.
- PDF p12, Fig. 9: high-supersaturation subset at -10 °C with model overlays; subset of Fig. 7.
- PDF p14, Fig. 10: fraction plate-like versus supersaturation at -10, -12, -15, -20 and -25 °C;
  categorical ensemble fractions whose denominators must be recovered from text/raw points where
  possible.
- PDF p15, Fig. 11: diameter/thickness versus time at -12 °C and 1.6%, separating plates from
  blocks/columns.
- PDF p16, Fig. 12: -12 °C plate-only diameter/thickness versus time across supersaturations;
  overlaps the plate subset in Fig. 11 at 1.6%.
- PDF p17, Fig. 13: -15 °C diameter/thickness versus time over multiple supersaturations,
  with two representative model curves.
- PDF p18, Fig. 14: thickness after 200 s and inferred attachment coefficients versus
  supersaturation at -15 °C. The upper panel summarizes Fig. 13; the lower panel is model-derived.
- PDF p19, Fig. 15: -15 °C diameter/thickness versus time comparing nitrogen and argon at three
  supersaturations; direct background-gas transport comparison with error bars.
- PDF p20, Fig. 16: -20 °C plate/block diameter/thickness versus time at 5.8%.
- PDF p21, Fig. 17: fitted attachment coefficient `alphaHKBasal` and `alphaHKPrism` versus
  temperature; project-relevant derived summary, sharing all underlying growth-series lineage.
- PDF p23, Appendix table: model parameters keyed to the figure series, including temperature,
  supersaturation, chosen attachment parameters, diffusion length and basal/prism surface values;
  derived fit inputs/results rather than a second experiment set.

Extraction families: plot digitization for individual points/error bars; exact appendix-table
transcription; categorical histogram/fraction extraction; qualitative image coding only where the
text defines morphology. Each temperature/supersaturation/gas combination is a separate series,
but summary/subset panels remain linked to the same underlying crystals.

## Libbrecht and Arnold 2009 — rates in air at -5 and -10 °C

Source: `libbrecht-2009-growth-rates-minus5-minus10.pdf`, arXiv `0912.2518`, 12 PDF pages.
Scope verdict: **include primary controlled measurements**. Free-fall chamber measurements are
ensemble samples at successive collection times. Temperature is reported as -5.0 ± 0.15 °C or
-10.0 ± 0.2 °C; thermometer accuracy is ±0.1 °C and far-field supersaturation approximately ±20%.
The paper also discusses sampling, competition, substrate and model errors, with substrate effects
bounded only approximately at ±20%.

Potential measurement units:

- PDF p2, Fig. 1: mean column length and diameter after 120 s versus temperature at 2.3%
  far-field supersaturation; ensemble means across a temperature sweep.
- PDF p4, Figs. 2 and PDF p5, Fig. 3: -5 °C column length/diameter versus time for five
  supersaturations; Fig. 3 is the expanded-diameter view of the same data.
- PDF p6, Fig. 4: model-inferred `alphaHKPrism` and `alphaHKBasal` versus surface
  supersaturation at -5 °C, with error bars representing variation among modeled crystal shapes.
- PDF p7, Figs. 5 and PDF p8, Fig. 6: -10 °C plate diameter/thickness versus time for five
  supersaturations; Fig. 6 is the expanded-thickness view of the same data.
- PDF p9, Fig. 7: model-inferred `alphaHKPrism` and `alphaHKBasal` versus surface
  supersaturation at -10 °C, with model-variation error bars.
- PDF p10, Fig. 8: mean length and diameter at -5 °C and 4.5% versus crystal density in the
  chamber; competition control.
- PDF p11, Fig. 9: -10 °C `alphaHKBasal` data compared with three analytic/model curves;
  same underlying growth data as Figs. 5–7.

Extraction families: plot digitization with error-bar capture; prose transcription for systematic
uncertainty and conditions. Retain individual point versus ensemble-mean semantics and keep
model-inferred attachment quantities distinct from measured dimensions.

## Libbrecht 2011 — edge-enhancing instability near -15 °C

Source: `libbrecht-2011-edge-instability-minus15.pdf`, arXiv `1111.2786`, 14 PDF pages.
Scope verdict: **include primary controlled measurements**, but it is a very small, substrate-bound
case series. The main quantitative evidence is two individual crystals at -15 °C in one-bar air;
surface supersaturation and attachment parameters are inferred using the basal facet as a witness,
not directly measured. No explicit repeated-run statistical uncertainty is reported.

Potential measurement units:

- PDF p2, Fig. 1: literature morphology diagram; secondary context, not a new measurement.
- PDF p5, Fig. 2: crystal 1 radius, thickness, basal/prism growth velocities, imposed far-field
  supersaturation and inferred basal-surface supersaturation versus time. Initial radius 13.5 µm,
  thickness 2.5 µm; thin-plate onset near 160–166 s.
- PDF p6, Fig. 3: images of crystal 1 keyed to Fig. 2 times; morphology evidence from the same run.
- PDF p7, Fig. 4: basal versus prism velocity hysteresis for crystal 1; re-expression of Fig. 2.
- PDF p8, Fig. 5: inferred basal-surface and prism nucleation supersaturation versus time for
  crystal 1; model-derived from the same run. Prose reports an approximately threefold increase in
  `alphaHKPrism` while inferred surface supersaturation stayed roughly constant.
- PDF p9, Fig. 6: crystal 2 radius/thickness, growth velocities, far-field and inferred surface
  supersaturations versus time under a slower ramp.
- PDF p10, Fig. 7: velocity hysteresis and three images for crystal 2; same run as Fig. 6. Prose
  reports an approximately fourfold `alphaHKPrism` increase and fitted prism nucleation scale near
  0.8% around 450 s.
- PDF p12, Fig. 8: cellular-automaton parameter sweep only; exclude from measured-data set.
- Prose qualitative ensemble: similar behavior observed from -12 to -17 °C, strongest hysteresis at
  -15 °C, and roughly twice the minimum basal velocity for transition at -17 °C. Sample counts and
  statistical uncertainty are not given, so retain as qualitative/prose evidence only.

Extraction families: digitize the two time series once, then derive linked views rather than
double-counting Figs. 3–5 and 7; qualitative image-event coding; prose transcription for the broader
temperature observation. Explicitly tag substrate contact, single-crystal ensemble, inferred
surface field and missing uncertainty.

## Nelson and Swanson 2019 — lateral facet growth and secondary habits

Source: `nelson-2019-lateral-facet-growth.pdf`, DOI `10.5194/acp-19-15285-2019`, 36 PDF pages.
Scope verdict: **include a small primary CC2 measurement/observation subset; separate the extensive
mechanistic, model and external-image material**. The authors used a capillary cryostat (CC2) in
air, plus images supplied from Yamashita's 15 m cloud chamber and historical collections. The paper
states that the data are available on request, not as an attached numeric dataset.

Potential measurement units:

- PDF p2, Fig. 1: Yamashita cloud-chamber droxtal-to-prism image sequence (-6 to -12 °C,
  near-water saturation, 45–90 µm). External primary lineage; qualitative, not CC2.
- PDF p4, Fig. 2: conceptual lateral-growth diagrams; exclude as measured data.
- PDF p6, Fig. 3: one CC2 crystal growth–sublimation–growth sequence at -29 °C and about 0.5%,
  including time images, 12 corner pockets, approximate 30 µm corner radius and planar pockets.
- PDF p7, Fig. 4: proposed mechanism sketch for Fig. 3; exclude as measurement.
- PDF p8, Fig. 5: one CC2 crystal regrowth sequence at -30 °C and 1%; visually estimated basal
  perimeters at 5 min intervals.
- PDF p10, Fig. 6: quantitative normalized basal-facet radius versus time from Fig. 5, with error
  bars and three model fits; direct plotted observation is one-crystal/eye-estimated and shares
  lineage with Fig. 5.
- PDF p10, Fig. 7: one nonsymmetric CC2 crystal at -30 °C and 0.8% through sublimation/regrowth,
  corner-pocket and center-hollow sequence.
- PDF p11, Fig. 8: three natural/cloud-chamber crystal images from distinct external lineages,
  including one in-cloud at -24.9 °C; qualitative and not independent until source lineage is
  resolved.
- PDF p11, Fig. 9: one CC2 crystal at -30 °C and 1%, timed elongated-edge-pocket/lateral-facet
  sequence out to at least 8448 s.
- PDF p12, Fig. 10: mechanism sketches; exclude as measurement.
- PDF p13, Fig. 11: CC2 center-hollow/center-pocket time sequences for one or more crystals at
  stated growth conditions; qualitative original observations, with exact run grouping to recover
  from caption/text before S3.
- PDF p14, Fig. 12: two twinned CC2 crystals around -30 °C and 5%, center-hollow terracing;
  qualitative time-image series.
- Appendix Figs. B1, B2, B4, B6, B8, B9, B11, B14 and B16 are mechanism/model sketches, not
  measurements. Figs. B3, B5, B7, B10, B12, B13 and B15 are observational examples from
  Yamashita, Magono–Lee, Nakaya or other cited/external lineages; retain only as qualitative
  secondary/external observations until exact provenance and duplication are reconciled.
- Prose ensemble: ten CC2 crystals of varying aspect ratio reportedly underwent a
  growth–sublimation–growth cycle and all showed corner pockets; all were about 200–400 µm and
  near -29 °C. A historical comparison suggests a possible critical corner radius of 10–20 µm near
  -20 to -30 °C at about one atmosphere, but this is an interpretive bound mixing local and cited
  cases, not a clean direct measurement.

Extraction families: one quantitative plot digitization (Fig. 6) with eye-estimation error bars;
time/image-event transcription for CC2 sequences; qualitative feature coding for external images;
prose transcription for the ten-crystal observation. All mechanistic sketches and model curves are
excluded from the measurement set, while their links to the underlying observations remain in
provenance.

## Batch totals and immediate implications

- Five sources / 91 pages visually inspected.
- Five primary-measurement inclusions, but Nelson–Swanson contains a deliberately narrow local
  subset amid substantial secondary/model material.
- At least 50 figure/table-level candidate units before panel/condition expansion. Many are linked
  re-expressions of the same runs, so S3 must not count them as independent witnesses.
- The strongest Phase 9-ready quantitative additions are: Colbeck's experiment table and
  morphology boundary; the 2008 multi-temperature/multi-gas chamber series; the 2009 -5/-10 °C
  rate series with explicit systematic-error discussion; and the two -15 °C hysteresis runs.
