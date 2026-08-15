# Phase 8 round-0 acquired-source impact on the draft Phase 9 consumer

Status: **offline, read-only consumer audit; preliminary impact assessment, not a Phase 9 redesign or a Phase 8 classification/extraction result.**

Date: 2026-08-11

## Scope and evidence boundary

This audit compares the current draft `docs/plans/phase-9-modular-physics-arms.md` with the 28 acquired PDFs represented by:

- `evidence/phase8b-s2-round0-reconnaissance/source-register.jsonl`;
- `historical-batch-1.md`, `historical-batch-2.md`, `modern-batch.md`, and `additional-priority-batch.md`; and
- the bundle `report.json`.

The audited Phase 9 plan SHA-256 is `e41569198a09d2e849208152672b1e6434cca42ed608dcaa128af1a2cda0f8ca`. The acquired-source register SHA-256 is `3590804a3943bbe1594d6ec1feec58c45182d4f79cfc10b3c94d1f7ac068476f`.

The Phase 8 evidence boundary is load-bearing: this is page-complete S2 reconnaissance over 28 PDFs / 362 pages, but the cumulative source set is not frozen, the search remains `BOUNDED_OPEN`, no formal S3 classification pass has run, and zero numeric measurement rows have been extracted. Therefore the findings below may guide the later S6 consumer review, but they cannot yet select targets, change a registered arm, or support a Phase 9 score.

“Direct” below means that the source reports an observed crystal dimension, image, count, condition, or time series. It does **not** mean that the physical cause attributed to that outcome is directly identified. “Model-conditioned” covers inferred surface supersaturation, attachment coefficients, equal-mass transforms, fitted mechanism parameters, residence-time-derived rates, and causal interpretation. “Qualitative” covers images or prose outcomes without a calibrated numerical operator or usable uncertainty.

## Executive finding

The newly acquired material has four material consequences for the draft consumer:

1. **Pressure transport is no longer represented adequately by one pressure-ratio mass check alone.** Direct experiments separately vary reported vapor diffusivity and carrier-gas thermal conductivity, vary pressure and gas, and observe habit, size, axis ratio, branching, and hollowing. They add strong confrontation evidence for M-P, while also challenging the premise that a pressure result can automatically be attributed to `D proportional to 1/p` with unchanged kinetics and thermal behavior.
2. **History dependence has much stronger direct support than the draft reflects.** Same-crystal gas switches, pressure/suction histories, supersaturation ramps with hysteresis, abrupt growth transitions, and repeated growth-sublimation-regrowth cycles add dynamic observables beyond a single fast-start-versus-constant endpoint comparison.
3. **The acquired set adds unusually useful direct kinetic and morphology observables, but not clean evidence for every proposed module.** It strengthens M-K2 confrontation and behavioural scoring. It does not supply a matched seed-geometry experiment, a direct Gibbs–Thomson on/off measurement, or an isolated ventilation-factor experiment.
4. **The current split cannot be paper- or panel-based.** Many displayed curves, images, fitted coefficients, and summaries reuse the same crystals or campaign rows. Any source that changes a Phase 9 premise becomes development evidence, and all of its linked re-expressions must remain with it.

## Arm-by-arm impact

| Draft arm | Direct acquired evidence that materially adds | Model-conditioned or qualitative evidence | Audit impact, without redesign |
|---|---|---|---|
| **M-P pressure-dependent transport** | Gonda & Komabayasi 1971 (`P8B-S2R0-2EA39D...`), PDF pp. 4–8, reports two controlled series: crystal images and mean axes/axis ratios while varying carrier-gas thermal conductivity at reported fixed vapor diffusivity, and while varying diffusivity at reported fixed conductivity, at -7 and -15 C. Gonda 1976 (`08C322...`), pp. 3–5, adds pressure-by-gas habit-frequency matrices, habit-specific size, and mean `c/a`. Gonda 1970 (`2A2005...`), pp. 3–9, adds one-atmosphere He-Ar mixture size, axis, branch-onset, hollowing, and habit-map observations. Libbrecht et al. 2008 (`FB6E5A...`), p. 19 Fig. 15, directly compares diameter/thickness histories in nitrogen and argon at -15 C. Isono et al. 1957 (`2E4423...`), pp. 6–10 Figs. 9–10, supplies two same-crystal air/hydrogen switch histories. | The gas-property values used to label fixed diffusivity/conductivity are adopted physical-property inputs, not measured crystal outcomes. Kobayashi 1958 (`6A121A...`) `r^2(t)` uses an equal-mass-sphere transform. Libbrecht 2013 (`D15EF2...`) pressure-dependent attachment quantities and Libbrecht 2016 (`909CDB...`) statements about pressure-dependent prism kinetics are inversion/interpretation evidence; the 2016 source explicitly supersedes the 2013 pressure-invariance interpretation. | **Strong add and material challenge.** The direct outcomes support a richer transport confrontation set. They also show that pressure, gas species, vapor diffusivity, thermal conductivity, transients, and possible surface kinetics cannot be assumed equivalent. A failure of the present Takahashi-only pair would not by itself localize the fault to the diffusion core, and a pass would not establish the broader gas/pressure behavior. |
| **M-GT Gibbs–Thomson** | No acquired source provides a matched vapor-grown crystal measurement that directly varies curvature or a Gibbs–Thomson term while holding the rest of the protocol fixed. | Nelson 2019 (`84BDC4...`), PDF pp. 6–14, supplies mostly qualitative -29 to -30 C growth-sublimation-regrowth and lateral-facet/corner-pocket sequences; its only curve is an eye-estimated radius from one crystal. Jambon-Puillet 2018 (`02E73E...`) measures curvature evolution in substrate-frozen drops, and Nair 2018 (`2C8EE1...`) measures ridge wavelength in melt-frozen polycrystalline ice; both are specimen mismatches. Magee 2014 (`1A0709...`) and Voigtlaender 2018 (`806280...`) add roughness imagery/trajectories, not a direct curvature-equilibrium test. | **No direct validation added.** These sources can later supply qualitative feature or refusal tests, but they do not presently support the M-GT causal expectation or its parameter value. The draft’s proposed GT probe remains a model discrimination exercise rather than an experiment-matched test on the acquired evidence. |
| **M-H history/schedule** | Libbrecht 2011 (`710072...`), PDF pp. 5–10 Figs. 2–7, gives two individual -15 C radius/thickness and growth-response histories under supersaturation ramps, including observed onset and hysteresis views. Libbrecht 2016 (`909CDB...`), pp. 4–7 Figs. 2–4, gives individual -5 C radius/height histories including an abrupt transition at roughly 100–160 s. Isono 1957 Figs. 9–10 supplies same-crystal gas switches. Kobayashi 1960 (`871819...`), pp. 6–7 Figs. 4–5, supplies two pressure/suction intervention histories with synchronized morphology. Voigtlaender 2018, pp. 9–10 Figs. 9–10, gives two repeated growth-sublimation cycles with size and roughness. Nelson 2019 adds several growth-sublimation-regrowth image histories. | Surface supersaturation and attachment changes in Libbrecht 2011/2016 are inferred; the broader -12 to -17 C hysteresis claim has no reported sample count. Kobayashi’s suction response is confounded by droplet formation and adiabatic effects. Nelson is mostly qualitative, and its quantitative radius is eye-estimated. Voigtlaender’s saturation is flow-inferred and poorly characterized at high values. | **Strong direct add.** The evidence supports scoring path, transition time, reversal, and state memory, not merely final habit. It does not establish that the draft’s particular fast-start schedule causes Knight-style -5 C bistability; that remains a separate confrontation. |
| **M-S seed geometry** | None of the 28 PDFs supplies a matched plate/needle/droxtal seed comparison at the same temperature, supersaturation, pressure, gas, support, and history. | The corpus contains many seed/support labels—silver iodide, rabbit hair, substrate-grown needles or plates, glass fiber, illite, free-fall nucleation, and frozen droplets—but their environments and protocols differ. Cross-paper morphology differences would confound seed with apparatus and condition. | **No clean add.** The acquired set improves seed/support metadata and may expose candidate protocols, but it does not independently support the M-S expected effect. Do not convert heterogeneous starting conditions into a seed-arm comparison. |
| **M-K2 FACET two-branch prism kinetics** | Sei & Gonda 1989 (`5EF679...`), PDF pp. 4–5 Figs. 3–5, directly reports basal- and prism-face normal growth rate versus supersaturation at -7, -15, and -30 C; the source states 40 Pa, +/-0.01 C temperature control, and 0.1% supersaturation calibration. Libbrecht 2008/2009 (`FB6E5A...`, `CFFEC6...`) add free-fall diameter/thickness versus time and supersaturation over -2 to -25 C, especially -5 and -10 C. Libbrecht 2011/2016 add direct size histories and observed growth transitions near -15 and -5 C. | Sei & Gonda Table 1 condensation coefficients and all fitted BCF/Hertz-Knudsen overlays are derived from the measured points. Libbrecht 2009, 2011, 2013, and 2016 surface supersaturations and attachment coefficients are model inversions, not direct facet measurements; the 2013 interpretation is explicitly superseded in 2016. Low-pressure Sei & Gonda points are not protocol-matched to one-bar FACET kinetics without transport reconciliation. | **Strong confrontation add.** The acquired direct rates and trajectories give M-K2 external behavioural targets beyond reproducing its own source table. They also require pressure/support matching and a strict separation between observed dimensions/velocities and inferred attachment parameters. |
| **M-LH cheap latent-heat form** | Gonda & Komabayasi 1971 directly observes size, axis ratio, skeletal structure, branching, and hollowing across carrier-gas thermal-conductivity conditions at reported fixed diffusivity, including -15 C (Figs. 1, 3–5). This is the clearest newly acquired thermal-transport confrontation. | The inference that those gas-conductivity effects are specifically latent-heat feedback, or that a far-field supersaturation rescaling is the correct closure, is model-conditioned. Libbrecht 2016’s 0.2 C and 0.06 C heating values are calculations, not thermometer observations at the crystal. | **Material challenge to the expected invariant.** A direct -15 C dependence on gas thermal conductivity makes “nothing changes below -10 C” a premise to confront, not an automatic negative control. It does not by itself prove or falsify the draft’s cheap rescaling. |
| **M-V ventilation** | No acquired experiment cleanly varies ventilation or Reynolds number while holding crystal, thermodynamics, and growth history fixed. | Fuchs 2025 (`5B3D8F...`) measures individually classified natural-cloud major-axis distributions, but converts length to rate using inferred plume residence time and remains affected by riming, concentration, sedimentation, and selection. Feng 2021 (`13A151...`) is bulk aircraft context with riming/aggregation/melting. Free-fall versus substrate comparisons across papers are not a ventilation experiment. | **No clean add; current restrict-versus-model decision remains open.** Fuchs can later inform protocol/contamination filters if its native data are acquired, but neither Fuchs nor Feng validates a ventilation factor. |

## Material additions to prerequisites

### 1. Environment and condition representation

The pressure/thermal corpus requires pressure, carrier gas, gas composition, reported diffusivity, reported thermal conductivity, temperature, saturation definition, and intervention history to remain distinct. Gonda 1971 is specifically useful because its two series attempt to separate diffusivity from conductivity; collapsing either to pressure alone would discard the experiment’s discrimination. Isono and Kobayashi further show that a gas or pressure transition has transients and history, not merely a new scalar endpoint.

This is a prerequisite finding, not a proposed schema.

### 2. Protocol and specimen matching

The acquired records span free-fall ensembles, individual substrate-bound crystals, transported crystals, ESEM specimens, natural-cloud populations, melt-frozen drops, and polycrystalline ice fields. Direct measurements are not mutually exchangeable merely because they share temperature and nominal supersaturation. Phase 9 target selection will need to retain support state, specimen class, gas/pressure, supersaturation definition, and longitudinal-versus-cross-sectional ensemble semantics.

Two examples are load-bearing:

- Libbrecht 2008/2009 size-versus-time points are ensembles collected at successive times, not repeated observations of one crystal. They can score population trajectories but not individual-crystal hysteresis.
- Libbrecht 2011/2013/2016 curves are individual substrate-supported histories. They can score path/transition behavior but carry support and inferred-field limitations.

### 3. Source currency and native-data closure

Libbrecht 2016 explicitly says the 2013 pressure-invariance premise and basal-terrace interpretation were wrong. The 2013 measured trajectories can remain evidence, but its superseded causal interpretation cannot be a Phase 9 premise or target.

Several high-value sources remain incomplete without native material: Fuchs 2025’s Zenodo data/code, Voigtlaender 2018’s supplement and videos, and native Libbrecht trajectory/rate values and uncertainty semantics. Their PDF plots can identify candidate observables now; they should not be treated as frozen coordinates.

### 4. No module promotion from this audit

Because formal S3 classification, lineage reconciliation, S4 operator calibration, and S5 extraction have not occurred, none of these findings satisfies the Phase 9 plan’s target selection, expected-effect commitment, or frozen-protocol prerequisites. The current evidence can only identify where the draft consumer is likely to change after Phase 8 closes.

## Material additions and challenges to observables

| Observable area | What the acquired measurements add | Evidence class and limit |
|---|---|---|
| **Facet and axis growth** | Sei & Gonda 1989 basal/prism normal rates; Libbrecht 2008/2009 diameter/thickness series; Libbrecht 2011/2013/2016 radius/height histories. | Direct dimensions/rates are the strongest additions. Surface supersaturation and attachment coefficients must remain separately marked as inferred. |
| **Dynamic transitions and hysteresis** | Libbrecht 2011 two ramp histories; Libbrecht 2016 abrupt -5 C transition; Isono gas switches; Kobayashi suction histories; Voigtlaender and Nelson growth-sublimation-regrowth cycles. | Direct time-linked size or images, but causal interpretation ranges from model-conditioned to qualitative. These expose behavior not summarized by final AR. |
| **Population distributions** | Libbrecht 2008 habit fractions and aspect-ratio distribution; Gonda 1976 pressure/gas habit-frequency matrices; Murai 2012 approximately 200-run condition scatter and 73-crystal humidity-class count table; Magono 1962 natural-crystal temperature histograms. | Direct categorical counts/fractions where denominators exist; some historical plots omit denominators. These are broader than the draft’s bistability-only distributions. |
| **Boundary/transition coordinates** | Murai `Ta-RHi` and `Ta-Tw` scatters, Magono 0.5 C habit histograms, Colbeck 31 chamber experiments, and the Libbrecht multi-temperature sets. | Temperature and observed habit are direct; local supersaturation may be absent, method-limited, or model-derived. Murai explicitly warns that vapor-phase `RHi` differs from total-water/Nakaya-style conditions. Cross-protocol boundaries cannot be pooled silently. |
| **Morphological event structure** | Gonda 1970 branch-onset size and hollowing; Kobayashi 1958 pressure-linked skeletal/dendritic transitions; Voigtlaender roughness trajectories; Nelson lateral facets/corner pockets; Magee inhibited old-crystal growth beside new nucleation. | Mix of direct quantitative series and qualitative images. These expose candidate behavioural features currently absent from the listed Phase 9 score operators, but no operator should be added before S4/S6. |
| **Mass-law and `P` exponents** | No newly acquired PDF contributes a clean, direct individual-crystal mass trajectory suitable for the draft’s mass-law or supersaturation-free `P` scoring. | Kobayashi’s equivalent-sphere `r^2` is transformed/model-conditioned; Fuchs growth rate uses inferred residence time; Feng is bulk and mixed-process. The draft’s mass observables are not strengthened by this acquired set. |

## Split and leakage consequences

The newly found material makes four split constraints explicit:

1. **Premise-shaping sources are development evidence.** If Gonda 1971 changes how M-P/M-LH is framed, Libbrecht 2011/2016 changes M-H/M-K2 expectations, or Murai/Magono changes a boundary operator, the used measurements and all linked re-expressions cannot later be called held out.
2. **Split by underlying experiment/specimen lineage, not figure or table.** Examples: Libbrecht 2011 Figs. 2–5 are one crystal and Figs. 6–7 another; Libbrecht 2013 Figs. 4–5 and 6–7 are two reused histories; Libbrecht 2016 Figs. 2–3 and Figs. 4–7 are shared specimens; Fuchs threshold figures and Table B1 reuse the same pooled rows; Colbeck Table I and Figs. 6, 7, and 10 reuse the same 31-run ensemble; Nelson’s model panels and external images are not independent local measurements.
3. **Keep direct observations and their model inversions in the same split.** A measured R/H curve cannot be held out while its fitted attachment coefficient or inferred surface supersaturation is used for development. That is the same evidence expressed through a model.
4. **Resolve cross-source laboratory and reuse lineage before claiming independence.** The acquired Gonda/Kobayashi series share apparatus traditions, gas-property tables, and comparison material; the Libbrecht series share apparatus/model families and sometimes cite/replot prior quantities. Exact specimen reuse should not be inferred without evidence, but neither family should be randomized paper-by-paper until S3 lineage reconciliation establishes the actual dependency units. Imported Rottner/Vali points in Colbeck, secondary comparison bands in Magono/Murai, and external images in Nelson must follow their originating sources.

## Sources that do not materially change a current Phase 9 arm

- Higuchi 1969 and Kuroda 1982 contain no new primary experimental campaign; they are theory/review/secondary lineage sources.
- Lamb 2017 measures isotope fractionation in chamber populations, not the draft’s individual morphology or growth observables.
- Komabayasi 1970 at -110 C, Crowther 1973 electric-field growth, and Levi 1967 low-pressure filaments are primary but outside the present module shelf or protocol domain. They should remain visible as out-of-model evidence, not be forced into an arm.
- Jambon-Puillet 2018 and Nair 2018 are specimen mismatches for present atmospheric individual-crystal scoring.
- Feng 2021 is bulk natural-cloud context rather than a tracked deposition-growth experiment.

These dispositions are provisional S2 consumer judgments, not terminal Phase 8 exclusions.

## Provisional consumer disposition

Do not redesign or register Phase 9 from round 0. Preserve the draft, and carry these findings forward to Phase 8 S6:

- **pressure/thermal and history arms need re-audit against the direct acquired experiments;**
- **M-K2 and behavioural scoring have strong new direct confrontation candidates;**
- **M-GT, M-S, and M-V still lack clean matched direct evidence in the acquired set;**
- **mass-law and `P` scoring are not newly supported;** and
- **the eventual split must be specimen/campaign/lineage-aware and must place premise-shaping evidence in development.**

No model score, target selection, arm promotion, or physical attribution is earned by this audit.
