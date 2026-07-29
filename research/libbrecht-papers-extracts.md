# Consolidated extraction — all ten post-monograph Libbrecht papers

## Provenance and limits (Rule 10)

**How this was produced.** A 14-agent extraction run on 2026-07-28: ten agents, one per paper,
each reading every page and returning structured extracts under a rule that every number carry a
verbatim quote and a page citation, and that **no value be read off a plotted curve**. Three
independent verifier agents then re-opened the cited pages for the 381 items flagged
high-consequence and checked, for each, that the quoted sentence actually appears there and that
the value is transcribed correctly. **381 of 381 passed; none failed.** A synthesis agent then
assembled this document.

**What that does and does not buy.** The verification covers high-consequence parameters,
equations and cross-source conflicts. Section 9D of this document states plainly what was *not*
verified — no caveat quote, no figure description, and no lower-consequence parameter. Read §9C
and §9D before citing anything from §3, §5, §6, §7 or §8.

**What I checked personally**, against the source PDFs rather than through an agent:

- `2306.13087v1` Figure 1 p6, and pp. 4–9 and the Figure 2 plates pp. 11–14
- `2009.08404v2` Eqs. (2)–(5) p3 and Figure 18 p15
- `2011.02353v1` Figure 1 p2 and Figure 5 p7
- `2306.04042v1` Table 1 p9 and Figures 2–3 p10
- `1912.03230v1` p10 and p13 — the two statements §7B rests on, verified verbatim
- the supersaturation convention, verified in `1211.5555v1` p2 and `1910.06389v2` p59

Everything else in this document carries the workflow's own verification and no more.

**Nothing here has been read into a frozen artifact.** The Phase 6 parameter table and protocol
are frozen and a 204-point sweep has run against them. Charter §3.2 Phase 6 item 1: any post-freeze
edit to parameters or protocol requires a logged ADR and invalidates prior sweep results. Acting on
any of this is an ADR-level decision.

**Companion documents.** [`libbrecht-figure-findings.md`](libbrecht-figure-findings.md) is the
figures read as images, and is the place to start. [`figures.md`](figures.md) indexes the chart
crops. [`libbrecht-later-papers.md`](libbrecht-later-papers.md) records what was obtained.

---


This document consolidates ten Libbrecht snow-crystal papers, each read page by page in full by a
separate extraction agent, with the high-consequence items re-opened and checked against the source
pages by an independent verifier. Every number below carries the verbatim sentence or table row it
came from and the page it appears on. Nothing here was read off a plotted curve: quantities that
exist only as figures are listed in section 6 as digitizable, with their axes described and no value
invented. Nothing here is a recommendation, a decision, or an interpolation between printed values;
where two papers print different numbers for the same quantity, both are printed and the
disagreement is named. Where the extractions are silent, section 9 says so.

The ten papers:

| Key | arXiv | Title | Pages read |
|---|---|---|---|
| TAX2 | 2306.13087v1 | A Taxonomy of Snow Crystal Growth Behaviors: 2. Quantifying the Nakaya Diagram | 1-14 (all) |
| FACET | 2306.04042v1 | A Comprehensive Model of Snow Crystal Faceting (Libbrecht & Walkling) | 1-20 (all) |
| TAX1 | 2109.00098v1 | A Taxonomy of Snow Crystal Growth Behaviors: 1. Using c-axis Ice Needles as Seed Crystals | 1-23 (all) |
| TRIG | 2106.09809v1 | Triangular Snowflakes: Growing Structures with Three-fold Symmetry using a Hexagonal Ice Crystal Lattice | 1-19 (all) |
| CM10 | 2012.12916v1 | Toward a Comprehensive Model ... 10. On the Molecular Dynamics of Structure Dependent Attachment Kinetics | 1-14 (all) |
| CM9 | 2011.02353v1 | Toward a Comprehensive Model ... 9. Characterizing SDAK near -4 C | 1-12 (all) |
| CM8 | 2009.08404v2 | Toward a Comprehensive Model ... 8. Characterizing SDAK near -14 C | 1-18 (all) |
| CM7 | 2004.06212v1 | Toward a Comprehensive Model ... 7. Ice Attachment Kinetics near -2 C | 1-13 (all) |
| CM6 | 1912.03230v1 | Toward a Comprehensive Model ... 6. Ice Attachment Kinetics near -5 C | 1-24 (all) |
| APP | 1912.09440v1 | A Versatile Apparatus for Measuring the Growth Rates of Small Ice Prisms from the Vapor Phase | 1-13 (all) |

**Verification status.** 381 high-consequence items were re-opened at source. All 381 returned
`quoteFoundOnCitedPage: true` and `valueTranscribedCorrectly: true`. **No item failed verification.**
The verifier did, however, attach substantive notes to eleven items - page-boundary straddles, one
confirmed internal arithmetic gap, one confirmed missing minus sign, one mis-cited page for half of a
composite quote, and several places where part of a stated value came from a page adjacent to the one
cited. Those notes are reproduced in section 9 and, where they bear on a number, inline at the point
of use.

---

## 1. What conflicts with what the project currently uses

79 conflicts were recorded across the ten papers: **34 high severity, 32 medium, 13 low**. They are
listed below by severity, grouped by theme within each severity band.

### 1A. High severity (34)

| # | Topic | Our value | Their value | Paper | Page | Verbatim |
|---|---|---|---|---|---|---|
| H1 | Broad-facet kinetics alone cannot make columns in the -3 to -10 C band | 204-point sweep with broad-facet CAK only produced ZERO columns in -3.3..-9.9 C | Broad-facet behaviour alone explains only plates at T > -3 C and columns at T < -30 C; the basal SDAK dip is what yields columns near -4 C | CM9 | 11 | "The broad-facet behavior alone is sufficient to explain the formation of plates at T>-3C and columns at T<-30C, as seen from the plot of sigma_0,basal and sigma_0,prism in Figure 1. The fact that A_prism < 1 at high temperatures complicates the picture, but only to a minor extent. Adding the basal SDAK dip yields strong columnar growth near -4 C, while the prism SDAK dip produces strong platelike growth near -14 C." |
| H2 | SDAK is required, not optional, for both missing habits | SDAK not implemented; proposed next arm | SDAK on basal surfaces is stated NECESSARY for columns at -4 to -6 C; SDAK on prism surfaces RESPONSIBLE for plates at -11 to -18 C | CM10 | 3 | "More generally, the CAK model suggests that the SDAK effect on basal surfaces is necessary to produce columnar morphologies between -4 C to -6 C, while a similar phenomenon on prism surfaces is responsible for platelike forms between -11 C to -18 C. In both cases, the attachment kinetics is markedly different on narrow and broad facet surfaces." |
| H3 | Which sigma_0 curves apply to a narrow-faceted crystal | One broad-facet sigma_0 curve pair used for all crystals at all times | Two distinct curve pairs exist; the SDAK-dipped pair "apply only to narrow facet structures", and it is that pair that reproduces the Nakaya morphologies | CM10 | 5 | "Figure 3: The CAK model incorporates the SDAK effect to add "SDAK dips" to the sigma_0 plots in Figure 1, yielding the two curves shown here, which apply only to narrow facet structures. Together, these curves explain the platelike/columnar morphologies in Nakaya diagram as being strongly shaped by edge-dependent surface diffusion [2021Lib]." |
| H4 | SDAK enters as a parameter substitution keyed on facet structure | sigma_0 depends only on facet type and temperature | Replace sigma_0,x by sigma_0,x,SDAK whenever the surface is not broadly faceted | CM9 | 4 | "For reasons that are only partly understood at present [2019Lib1], it seems to work reasonably well to approximate the resulting growth behavior by replacing sigma_0,x by sigma_0,x,SDAK whenever the surface in question does not exhibit a broadly faceted structure." |
| H5 | Existence and location of a dip in sigma_0,basal | No basal dip; sigma_0,basal monotonic in (Tm - T); A_basal identically 1 | A dip in sigma_0,basal near -4 C is postulated and stated confirmed by growth-rate measurement | CM10 | 4 | "The CAK model additionally postulates a corresponding dip in sigma_0,basal near -4 C, and the combined effect yields columnar from -4 C to -6 C and platelike growth from -11 C to -18 C, as seen in the Nakaya diagram. Growth-rate measurements confirm the existence of SDAK dips at both -14 C [2020Lib1] and -4 C [2020Lib2]" |
| H6 | Magnitude of the SDAK dip in sigma_0,prism at -14 C | No dip at all (factor 1.0) | Measured: sigma_0,prism on a narrow facet at -14 C is about one-tenth of its broad-facet value | CM10 | 9 | "A factor-of-two reduction in the effective sigma_0,prism is perhaps too small to reproduce the actual SDAK dip at -14 C, where sigma_0,prism is about one-tenth of its broad-facet value [2020Lib1]." |
| H7 | Facet-width dependence of alpha_prism | alpha depends on facet type, T, sigma_surf only - no width dependence | alpha_prism depends "quite strongly on facet width w" in addition to T and sigma_surf | CM8 | 12 | "In this picture, the value of alpha_prism depends on temperature T, surface supersaturation sigma_surf, and also quite strongly on facet width w. In Figure 12, it is the large change in w that brings about the rapid change in alpha_prism,SDAK observed." |
| H8 | Facet-width dependence of alpha_prism (independent restatement) | as above | alpha_prism at -14 C increases roughly 100-fold as thin plate edges develop | TRIG | 12 | "Nevertheless, the measurements in [2020Lib1] show that alpha_prism at -14 C increases roughly 100-fold as thin edges of platelike crystals develop, so it would not be surprising to see a 60% increase in alpha_prism between the short and long facets in Figure 15." |
| H9 | Magnitude of the prism nucleation-barrier reduction at -14 C | single digitized large-facet sigma0_prism anchor; no narrow-facet variant | alpha_prism,SDAK >> alpha_prism,LF at -14 C | CM8 | 11 | "Note the large increase in alpha_prism on narrow prism facets relative to large facets (alpha_prism,SDAK >> alpha_prism,LF), resulting from an especially strong SDAK effect at this temperature." |
| H10 | alpha_basal is not a single-valued function of sigma_surf | one alpha law per facet | Two simultaneously valid basal branches at -5 C, selected by mesoscopic width/curvature R_basal | CM6 | 3 / 4 | p.3: "Note that single-valued functions alpha_basal(sigma_surf) and alpha_prism(sigma_surf) are not sufficient to encompass all aspects of ice/vapor growth near -5 C, so several different "branches" of this (semi-empirical) theory are illustrated in Figures 1 and 2"; p.4: "The narrow-basal-surface curve in Figure 1 is defined by Equation (2) with A_basal = 1 and sigma_0,basal = 0.1%" |
| H11 | Columns at -5 C require SDAK plus a fast-growth transient | zero columns at -5 C treated as unexplained failure | Without SDAK, plate-like prisms are the predicted AND observed form at -5 C at low sigma_surf | CM6 | 10 | "While supporting the model in Figure 1 for broad-facet growth, the new data directly confirm the growth of plate-like simple prisms at -5 C when sigma_surf is low, as this morphological behavior is unambiguously observed in the imaging data. This direct observation of plate-like prismatic crystals at -5 C provides an important confirmation of our attachment-kinetics model. Producing columnar crystals at -5 C then requires the SDAK effect to increase alpha_basal compared to its value on broad basal facets." |
| H12 | The Nakaya "columns at -5 C" rule the project scores against is asserted wrong at low sigma | Nakaya diagram is the validation target; -3.3..-9.9 C labelled Columns | Model predicts and imaging shows plate-like growth at -5 C at low sigma_surf, explicitly contradicting the morphology diagram | CM6 | 11 | "At this juncture I would like to again call attention to the fact that the model in Figure 1 predicts plate-like growth for prismatic crystals at low sigma_surf. This prediction contradicts a well-established rule from the morphology diagram, suggesting that only columnar crystals are produced at -5 C." |
| H13 | Habit expected at -5 C when facets are broad | seed is a broad-basal-faceted plate; -3.3..-9.9 C scored as Columns | With broad basal and prism facets, plates are predicted and confirmed at -5 C; columns need narrow basal facets | CM10 | 3 | "The model predicted that platelike morphologies at -5 C should appear both in vacuum and in air at low supersaturations, provided the crystals exhibit relatively broad basal and prism facets. This behavior was confirmed in targeted experiments [2012Kni, 2019Lib2], while columnar forms near -5 C generally emerge only when the basal facets are quite narrow." |
| H14 | A_prism ceiling: alpha_prism -> 1 at high sigma_surf | A_prism <= 0.18 at (Tm-T)=5, so alpha_prism can never exceed that | A_prism ~ 0.2 at low sigma_surf but alpha_prism -> 1 at high sigma_surf; author states the two are inconsistent | CM6 | 5 | "Nevertheless, the data presented below suggest that alpha_prism -> 1 at sufficiently high sigma_surf, which is inconsistent with A_prism ~= 0.2 measured at lower sigma_surf." |
| H15 | Single-branch prism attachment kinetics | one (A_prism, sigma0_prism) pair per temperature | Prism requires TWO branches at -2 C, selected by facet width (~1-2 um) and/or velocity (~1 um/sec) | CM7 | 4 | "For smaller facet dimensions and/or faster growth velocities, the prism behavior transitions to the "prism kinetic roughening" curve in Figure 1, defined by A_prism = 1 and sigma0,prism = 0.15%." |
| H16 | Functional form of alpha for the prism facet | single term alpha = A exp(-sigma0/sigma_surf) | Sum of TWO nucleation terms with independent (A, sigma0) pairs and a Gibbs-Thomson-corrected driving supersaturation | FACET | 8 | "alpha_facet = A_1 e^(-sigma_0,1/(sigma_surf - d_sv kappa_facet)) + A_2 e^(-sigma_0,2/(sigma_surf - d_sv kappa_facet))   (32)" |
| H17 | A_prism prefactor values (two-branch table) | A_PRISM_CAK = [0.45, 0.28, 0.21, 0.18, 0.83, 1, 1, 1, 1] | Two prefactors per temperature, summing to 1.0 at every tabulated T | FACET | 9 | Table 1 rows: "-1 \| 690 \| 0.3 \| 3e-5 \| 0.7 \| 1e-3"; "-2 \| 635 \| 0.25 \| 3e-4 \| 0.75 \| 1.5e-3"; "-3 \| 585 \| 0.2 \| 1e-3 \| 0.8 \| 3e-3"; "-5 \| 496 \| 0.2 \| 2e-3 \| 0.8 \| 5.5e-3"; "-7 \| 419 \| 0.5 \| 8e-3 \| 0.5 \| 1e-2"; "-15 \| 208 \| 1 \| 3e-2 \| - \| -" |
| H18 | A_prism temperature dependence (M1) | piecewise-linear digitized anchors | A = 1 everywhere, both facets, all conditions; Eq 6 printed with no A prefactor at all | TAX2 | 6 | "To keep M1 relatively simple, we chose to set A = 1 in Equation 3 for all growth conditions, even though our data suggest that this is not entirely accurate for broad prism facets at high temperatures [2013Lib, 2021Lib]. In air, however, narrow prism facets do exhibit alpha -> 1 at high growth rates [2020Lib]. Setting A = 1 for all prism facets should not yield horribly inaccurate results, therefore, and it substantially reduces the overall complexity of this starter model." |
| H19 | Which parameter set is the author's own current model | CAK (piecewise A_prism) primary; CAK_A1 an alternate simplification | A = 1 IS the model (M1); the sub-unity prism prefactor is the thing dropped | TAX2 | 6 | "For all non-faceted surfaces, the M1 model assumes alpha = 1." |
| H20 | A_prism identically 1 (CAK_A1) is ruled out at -2 C | CAK_A1 sets A_prism = 1 at all T | A_prism = 1 explicitly cannot fit either -2 C data set; A_prism = 0.25 required | CM7 | 6 | "If we try to fit either of the data sets in Figures 3 and 4 while constraining the fit to have A_prism = 1, we cannot obtain satisfactory agreement with the observations from either experiment. The light-green dashed curves in Figures 3 and 4 are about the best one can do with a constrained model, and in both data sets these curves yield substantially stronger changes in alpha_prism(sigma_surf) with sigma_surf than are shown in the data. Taken together, I believe that these two experiments provide quite convincing evidence that a terrace nucleation model with A_prism ~= 1 cannot describe the growth of large prism facets at temperatures near -2 C." |
| H21 | A_prism identically 1 (CAK_A1) near -4 C | CAK_A1 sets A_prism = 1 | A_prism substantially less than unity near -4 C on broad facets; -> 1 only on narrow facets at high sigma_surf (SDAK-2) | CM9 | 4 | "The situation is more complicated near -4 C, however, because A_prism is substantially less than unity in that temperature range, as seen in Figure 1. Moreover, numerous experiments suggest that A_prism -> 1 on narrow prism facets at high sigma_surf in this temperature range, which we attribute to a second SDAK effect, which I call SDAK-2 [2019Lib2, 2020Lib]." |
| H22 | Source of the sigma0 anchors (M1/M2 closed forms) | digitized from a figure in the 2019 monograph; no later measurement incorporated | Explicit printed closed forms for sigma0_basal(T) and sigma0_prism(T), M1 (with dips) and M2 (without), published 2023 | TAX2 | 6 | "Our "best current guess" for the nucleation parameter sigma_0(T) is shown in Figure 1 for the basal and prism facets, these curves being defined by ... with temperature here in degrees Celsius." |
| H23 | sigma0 anchors: digitized figure values vs printed closed forms | digitized figure anchors | Closed forms printed: sigma_0,basal(T*) = 0.02 T*^1.75 + 0.3 and sigma_0,prism(T*) = 0.02 T*^1.9 - 0.025(T* - 0.3), T* = (Tm-T) in C, sigma_0 in percent | CM8 | 3 | "sigma_0,basal(T_*) = 0.02T_*^1.75 + 0.3          (2)      sigma_0,prism(T_*) = 0.02T_*^1.9  -0.025(T_* - 0.3)          (3)" |
| H24 | Source of sigma0,prism anchors (numeric table) | digitized figure anchors | A printed numerical table of prism sigma0 at six temperatures, stated chosen from experimental measurements | FACET | 9 | "Table 1 shows the parameters we used for the prism attachment kinetics, which were chosen from experimental measurements of ice growth rates as a function of temperature and supersaturation [2021Lib]." |
| H25 | SDAK is already baked into M1's sigma0, not an optional extra | SDAK not implemented | The SDAK dips are already inside the M1 sigma0(T) forms; removing them gives a different model (M2) | TAX2 | 6 | "The overall shapes of the curves come from measurements of the growth of faceted ice crystals in near vacuum [2013Lib, 2021Lib], and we have additionally added the "SDAK dips" presented in [2020Lib1, 2020Lib2, 2021Lib]." |
| H26 | SDAK governs thin plates AND hollow columns | SDAK not implemented | SDAK is stated to govern the formation of both habits the sweep failed to produce | TAX1 | 8 | "Together, these molecular-scale phenomena all factor importantly into the structure-dependent attachment kinetics that governs the formation of thin plates and hollow columnar crystals [2019Lib1, 2021Lib]." |
| H27 | Edge-sharpening instability (ESI) is required, and is pressure-gated | diffusion-limited faceted growth with no ESI and no facet-width feedback | Thin plates near -14 C come from the ESI, a positive-feedback loop between diffusion-limited growth and SDAK; no SDAK means no ESI | CM10 | 11 | "The primary answer to this question appears to be that the SDAK effect leads to a new kind of diffusion-limited growth phenomenon I have called the edge-sharpening instability (ESI) [2017Lib, 2021Lib]. This mechanism naturally yields thin plates with narrow prism facets near -14 C, but it only operates when the growth is substantially limited by particle diffusion through an inert background gas. ... The positive feedback inherent in the ESI drives the formation of thin plates, greatly enhancing the SDAK effect in the process." |
| H28 | Seed crystal geometry (206-observation set) | small hexagonal PLATE | tip of a slender c-axis ice NEEDLE, all 206 observations | TAX2 | 8 | "Using slender ice needles as seed crystals provides a well-defined initial condition, while revealing the emerging structural features in far greater detail than previous observations." |
| H29 | Seed crystal geometry (methodological argument) | small hexagonal PLATE (two basal faces) | Needle tip presents ONLY A SINGLE basal facet; this is the paper's entire methodological argument | TAX1 | 10 | "Growth on ice needles. Using a slender ice needle as a seed crystal nicely avoids the double-plate problem, as the needle tip presents only a single basal facet. When plate formation is favored, only a single plate emerges from the tip, providing a relatively simply geometry for comparison with computational models." |
| H30 | Consequence of a two-basal-face seed | plate seed used with no stated treatment of two-basal-face symmetry | A two-basal-face seed produces a double-plate crystal whose two plates interfere; "typically not included in computational models" | TAX1 | 9 | "In short, the presence of two basal surfaces on the seed crystal can lead to the formation of a double-plate crystal, and this form is frequently observed in 3D snow-crystal models, as illustrated in Figure 14. The problem here is that the two sides of a double plate tend to interfere with one another's growth, often yielding split plates and split stars as described in Figure 5. This type of growth instability is typically not included in computational models, and it significantly complicates quantitative analyses." |
| H31 | Seed / initial condition determines habit at the same (T, sigma) | habit assumed a function of (T, sigma) alone | Both platelike and columnar crystals observed simultaneously at -5 C, brought about by different initial conditions | CM9 | 5 | "It is possible, however, when sigma_surf ~= 0.1 percent, to observe the growth of both platelike and columnar crystals simultaneously (brought about by different initial conditions), as was reported by Knight [2012Kni]." |
| H32 | Seed shape / growth history as the dominant systematic | seed shape logged as largest measured systematic | Initial growth conditions determine which basal branch the crystal follows for the rest of its life | CM6 | 22 | "The data presented above show that the initial growth conditions are an important factor in the development of sharp basal features, especially during periods of relatively fast growth. In the most extreme cases documented above, either thin plates or slender columns may develop under quite similar conditions, depending on the initial growth history." |
| H33 | Latent heating is mandatory for near-vacuum prisms on a substrate | latent heating NOT applied | Stated mandatory; implemented as a series-resistance factor alpha_therm | FACET | 7 | "When evaluating these equations in realistic experimental situations, one result that quickly appears is that latent heating must be incorporated into any model of the growth of simple ice prisms on a substrate in a near-vacuum environment [1972Lamb, 2021Lib]." |
| H34 | A_prism at -5 C | A_prism = 0.18 at (Tm - T) = 5 C (digitized anchor) | A_prism = 0.25, fitted at -5 C, 0.08 bar, from a single test crystal | APP | 11 | "The model shown in Figure 6 used alpha_basal(sigma_surf) = exp(sigma0,basal/sigma_surf) and alpha_prism(sigma_surf) = A_prism exp(sigma0,prism/sigma_surf) with sigma0,basal = 0.73%, sigma0,prism = 0.20%, and A_prism = 0.25." |

### 1B. Medium severity (32)

| # | Topic | Our value | Their value | Paper | Page | Verbatim |
|---|---|---|---|---|---|---|
| M1 | Nakaya regime temperature boundaries | Columns -3.3 to -9.9 C; Plates -9.9 to -21.5 C | platelike above -3 C; columnar -4 to -6 C; platelike -11 to -18 C; columnar below -30 C (-6 to -11 C and -18 to -30 C left unassigned) | CM10 | 1 | "observations of snow crystal growth in air can be characterized (in broad terms) as being platelike above -3 C, columnar from -4 C to -6 C, platelike again from -11 C to -18 C, and columnar again below -30 C." |
| M2 | Where the columnar-to-platelike crossover sits | Columns/Plates boundary at -9.9 C | basal and prism growth rates nearly identical at -8 C; thin plates emerge just a few degrees below -8 C | TAX1 | 21 | "The basal and prism growth rates are nearly identical at -8 C, yielding blocky forms and weak sidebranching at high supersaturations. Thin plates emerge as temperatures drop just a few degrees below -8 C." |
| M3 | Expected habit at -10 C (inside the failing Plates band) | -9.9..-21.5 C scored Plates; sweep produced zero plates | Nakaya diagram associates blocky crystals with -10 C, but free-fall observation shows thin plates are the norm there; this paper's -10 C e-needle data agree with the free-fall data | CM8 | 14 | "Note that although blocky crystals are generally associated with snow-crystal growth at -10 C in the Nakaya diagram (Figure 1), direct observations of freely falling crystals reveal that thin plates are the norm at this temperature [2009Lib]. These free-fall data are in quite good agreement with the current results, as seen in Figure 17." |
| M4 | Morphology at -14 C is not uniquely platelike; it is sigma-dependent | -9.9..-21.5 C treated as the Plates regime | At fixed -14 C in air at 1 atm, below sigma_inf = 6% plates stop growing entirely and needles become blocky forms or simple columns | TRIG | 7 | "When sigma_inf was reduced below 6 percent, platelike crystals no longer grew from the ice needles, and the initially slender ice needles grew slowly into blocky forms or into simple columns." |
| M5 | A_prism functional form: digitized anchors vs printed closed form | piecewise-linear through A_PRISM_CAK anchors | Closed form printed: A_prism = (0.4 + 0.04 abs(T* - 4)^3)/(2.2 + 0.04 abs(T* - 4)^3) | CM8 | 3 | "A_prism = (0.4 + 0.04\|T_* - 4\|^3) /(2.2 + 0.04\|T_* - 4\|^3)          (5)" |
| M6 | Validity of the "A_prism = 1" simplification (CAK_A1) | A_prism = 1 at all temperatures | A_prism ~ 1 endorsed ONLY in the -10 C to -30 C band | CM8 | 3 | "The present paper focuses on temperatures between -10 C and -30 C, where A_basal ~ A_prism ~ 1." |
| M7 | A_prism value at -4 C | A_PRISM_CAK anchors 0.21 at T*=3 and 0.18 at T*=5 bracket T*=4 | 0.25 | CM9 | 9 | "so I assumed the CAK model with no SDAK effects, taking alpha_prism = 0.25exp (-0.14/sigma_surf) at -4 C, shown as the solid green curve in Figure 8." |
| M8 | sigma_0,prism value at -4 C | digitized anchor from 1910.06389v2; value not restated in the project brief | 0.14 (unit not printed in the expression; the associated figure axes are labelled percent) | CM9 | 9 | "taking alpha_prism = 0.25exp (-0.14/sigma_surf) at -4 C" |
| M9 | A_prism at -2 C | A_PRISM_CAK anchor = 0.28 at (Tm-T) = 2 C | A_prism = 0.25 | CM7 | 3 | "the "large prism surfaces" curve in Figure 1 is again defined by a nucleation-limited model, this time using sigma0,prism = 0.03% and A_prism = 0.25 at -2 C." |
| M10 | sigma0,prism at -2 C | digitized figure anchor | sigma0,prism = 0.03% (3e-4), printed in a dedicated -2 C paper post-dating the monograph | CM7 | 3 | "this time using sigma0,prism = 0.03% and A_prism = 0.25 at -2 C" |
| M11 | sigma0,basal at -2 C | digitized figure anchor | sigma0,basal ~ 0.004 = 0.4%, stated to come from measurements | CM7 | 3 | "Measurements indicate (see below) that sigma0,basal ~= 0.004 = 0.4% and A_basal ~= 1 so these values were used to define the basal curve in Figure 1." |
| M12 | sigma0,basal and sigma0,prism at -5 C | digitized figure anchors | sigma0,basal = 0.73%, sigma0,prism = 0.20% at -5 C, 0.08 bar, from a direct forward-model fit | APP | 11 | "with sigma0,basal = 0.73%, sigma0,prism = 0.20%, and A_prism = 0.25. Additional results of this nature can be found in [2019Lib2]." |
| M13 | Provenance/value of the sigma0 anchors at -5 C | digitized from 1910.06389v2 | sigma0,basal ~ 0.007 = 0.7% (A_basal ~ 1) and sigma0,prism ~ 0.2% (A_prism ~ 0.2), re-confirmed by a terrace-nucleation fit at both 0.03 bar and 1 bar | CM6 | 5 | "Here again, measurements have determined sigma_0,prism ~= 0.2% and A_prism ~= 0.2 near -5 C [2013Lib], and these values have been used in Figure 1." |
| M14 | Internal arithmetic: Eq (3) at -25 C vs the quoted large-facet value | n/a - no project equivalent | Eq (3) and the quoted -25 C large-facet value do not agree to the precision quoted (see section 9, note V6) | CM8 | 13 | "with sigma_0,prism,SDAK ~ 6.6%, while the large-facet value is sigma_0,prism,LF ~ 9.2%." |
| M15 | Basal facet treatment | A_basal = 1 at all T; basal grows with its own alpha_HK | Basal growth set to approximately zero for the modelled regime; no basal (A, sigma0) table printed | FACET | 6 | "For this reason, we typically assume dR_thick/dt ~= 0  in the discussion that follows. Removing this assumption would not change our overall conclusions appreciably, as the interesting faceting behaviors are generally restricted to the prism facets at high temperatures." |
| M16 | Gibbs-Thomson correction inside the nucleation exponent | alpha = A exp(-sigma0/sigma_surf), no curvature correction to the driving supersaturation | alpha_facet = A exp(-sigma0/(sigma_surf - d_sv kappa_facet)), d_sv ~ 1 nm, kappa_facet = 2/R | FACET | 4 | "Nevertheless, we approximate the resulting changes by modifying the attachment kinetics on faceted surfaces to be alpha_facet(sigma_surf) = A e^(-sigma_0/(sigma_surf - d_sv kappa_facet))   (7)" |
| M17 | Gibbs-Thomson / surface-energy term as a lattice regulariser | not listed among project model ingredients | Stated a required ingredient, with d_sv ~ 1 nm, specifically to prevent one-pixel-wide plates | TAX2 | 7 | "In addition to this model for the attachment kinetics, surface energy effects must also be included in the numerical calculations to incorporate the Gibbs-Thomson effect. This is necessary to prevent the growth of one-pixel-wide plates and other unphysical structures, as demonstrated in [2013Lib1]." |
| M18 | Latent heating as a bounded, quantified correction | latent heating not applied | Closed-form correction supplied with all constants at -5 C; stated NOT reducible by lowering pressure | APP | 8 | "correction is often negligible compared to particle diffusion effects. However, delta-sigma_therm cannot be reduced by operating at a low background gas pressure, so this can become an important correction factor at low pressures." |
| M19 | Latent heating at high sigma_surf | latent heating not applied | Named as the primary difficulty preventing faceted/columnar growth at high sigma_surf at -5 C | CM6 | 10 | "The primary difficulty at high sigma_surf is that thermal effects become quite large in this region of parameter space, as latent heat generated at the crystal surface is not conducted to the substrate at a sufficient rate to prevent significant heating at the crystal extremities. This problem becomes especially severe at high growth rates, as the crystal size increases rapidly, exacerbating these unwanted thermal effects." |
| M20 | Background gas pressure of the validating observations | a chamber pressure is fixed in the sweep | No numeric pressure printed anywhere in TAX2; conditions described only as "normal air", while background air pressure is named as an extrinsic variable a model must be validated against | TAX2 | 2 | "Developing a physically realistic model of natural snow crystal growth requires a quantitative reproduction of observed morphologies and growth rates as a function of all relevant extrinsic variables, including temperature, supersaturation, background air pressure, etc." |
| M21 | Sensitivity of the alpha branches to chamber pressure | habit scored from a single fixed chamber configuration | The alpha(sigma_surf) SDAK branches arise from self-assembly in air and are expected to shift at different air pressures | CM9 | 5 | "As described above, these specific "branches" in alpha(sigma_surf) space arise from self-assembly effects, so they apply mainly to snow crystal growth in air. At different air pressures, for example, we would expect these branches to shift somewhat." |
| M22 | Habit / aspect-ratio criterion | AR <= 0.6667 plate, AR >= 1.5 column, else neutral | No numeric aspect-ratio threshold printed anywhere in the paper; only the qualitative kinetics inequality | TAX2 | 4 | "The overall basal/prism aspect ratio of a growing snow crystal is largely determined by the anisotropy of the attachment kinetics [2021Lib]. For example, thin snow-crystal plates only form when alpha_basal << alpha_pri  , while slender columns only appear when alpha_prism << alpha_basal." |
| M23 | Habit classification thresholds and aspect-ratio definition | plate AR <= 0.6667, column AR >= 1.5, neutral band between | rho_aspect = H/R with 1 as the dividing line and no neutral band; measured values ~0.5 (thick plates), ~1 (isometric), 3.7-5.8 (free-fall columns) | CM6 | 13 | "Doing this experiment yielded mixed results, producing a diversity of prismatic crystals with aspect ratios throughout the range 0.1 < rho_aspect < 1. Columnar crystals (with rho_aspect > 1) were absent, and Figure 9 shows some examples of thin-plate crystals that formed." |
| M24 | Aspect ratio as a proxy for the alpha ratio | habit scored directly from final AR | rho_aspect explicitly NOT a reliable indicator of alpha_basal/alpha_prism because it encodes the whole growth history | CM6 | 10 | "As described in [2020Lib], rho_aspect is not always a good indicator of alpha_basal/alpha_prism, however, as sigma_surf generally becomes smaller as a crystal grows. Thus rho_aspect depends on the entire growth history of a particular crystal, and detailed modeling is required to measure alpha_basal and alpha_prism with high accuracy [2020Lib]." |
| M25 | Habit scoring by overall aspect ratio can invert the facet ratio | habit scored purely by AR = z/transverse | A -10 C, 8% crystal has prism growth ~7x faster than basal yet "appears quite blocky in overall form", because the blockiness comes from the LOWER basal surfaces | CM8 | 15 | "Although the prism growth is about 7x faster than the basal growth for this data point, the 8% crystal morphology appears quite blocky in overall form. A close look at the time series of images explains this, as the blocky morphology mainly results from growth of the lower basal surfaces of the block." |
| M26 | Applicability of the fitted parameters to plate and column habits | project scores strongly non-isometric crystals | The 1.5D model that produced the printed alpha parameters "will give somewhat distorted results for thin plates or slender columns" | APP | 9 | "The model works best for nearly isometric prisms with R ~= H, and will give somewhat distorted results for thin plates or slender columns." |
| M27 | Seed geometry in the -14 C validating measurements | small hexagonal plate | Every crystal grew on the tip of a 2-3 mm c-axis ice needle | CM8 | 7 | "After the e-needles grew out to lengths of 2-3 mm, the wire was moved to an adjoining second vertical diffusion chamber, where the temperature and supersaturation could be controlled separately." |
| M28 | Seed crystal geometry (trigonal paper) | small hexagonal plate | Slender c-axis needles; a normal seed with two basal surfaces has "significantly complicated" diffusion-limited dynamics | TRIG | 6 | "Using slender ice needles as seed crystals has a distinct experimental advantage compared to normal seed crystals, in that there is only a single basal surface initially present at the needle tip, accompanied by a single set of basal/prism corners [2021Lib]. This provides a simpler platform for investigating the formation of thin platelike crystals, as the diffusion-limited growth dynamics on a typical small seed crystal is significantly complicated by the presence of two basal surfaces with competing sets of basal/prism corners." |
| M29 | alpha on non-faceted sites, extended to vicinal surfaces | rough sites have alpha = 1 | Agrees for rough sites, and additionally asserts alpha_vicinal ~ 1 on vicinal (slightly tapered, apparently flat) surfaces - surfaces that would look faceted in an image | CM7 | 10 | "in part because the negative needle taper (with the tip thicker than the base) gives a vicinal surface with alpha_vicinal ~= 1 over most of the sides of the needle [2019Lib]." |
| M30 | SDAK at -2 C | SDAK a proposed next arm | At -2 C specifically SDAK is stated essentially absent, so a -2 C benchmark would not test an SDAK implementation | CM7 | 12 | "Comparing [2019Lib2] with the present paper, we see that the SDAK phenomenon that was so important on basal surfaces at -5 C is essentially absent at -2 C. The double-branched basal model at -5 C has been replaced by a remarkably simple basal curve at -2 C." |
| M31 | Whether diffusion-limited faceted growth alone can generate large-scale anisotropy | habit anisotropy expected to emerge from basal/prism alpha contrast plus diffusion | Large-scale morphological anisotropy is stated to REQUIRE a corresponding anisotropy in the attachment kinetics; diffusion alone drives evolution toward a basic hexagonal shape | TRIG | 11 | "This overall behavior reflects the general maxim in diffusion-limited snow-crystal growth that anisotropic growth morphologies on large scales require anisotropic attachment kinetics [2021Lib]. As discussed with Figure 12, diffusion alone, specifically the Berg effect, will not promote the growth of triangular plates, but will instead result in evolution toward a basic hexagonal shape." |
| M32 | Ambient pressure regime in which particle diffusion may be neglected | project solves diffusion-limited growth (diffusion always active) | Particle diffusion neglected in FACET because targets are low pressure; the tip/facet sigma_surf difference is roughly proportional to pressure, and at one atmosphere the analytic model UNDERestimates R_facet/r_corner | FACET | 7 | "Moreover, this difference was roughly proportional to pressure, while our main interest was comparing with crystal growth experiments done at low pressure. For these reasons, we found that the attachment kinetics and heat diffusion were the main drivers of faceting behavior (at low pressures), to the point that particle diffusion effects could be neglected without changing our main scientific conclusions." |

### 1C. Low severity (13)

| # | Topic | Our value | Their value | Paper | Page | Verbatim |
|---|---|---|---|---|---|---|
| L1 | Latent heating (TAX2) | not applied; known unapplied systematic | Also ignored for the whole paper, but with a stated boundary and a stated cheap substitute | TAX2 | 5 | "For snow crystal growth in air, thermal effects are generally negligible below -10 C, becoming progressively more important as one approaches the melting point [2016Lib]. Moreover, a rescaling of the far-away supersaturation sigma_infinity can be used to approximate the thermal effects to a reasonable approximation. For this reason, I will ignore latent heating and thermal diffusion for the remainder of this paper." |
| L2 | Latent heating / heat diffusion (TAX1) | not applied | Heat diffusion contributes "small effects" relative to particle diffusion and is "quite amenable to computational modeling"; no magnitude given | TAX1 | 8 | "Particle diffusion of water molecules through air is the primary player, although heat diffusion contributes small effects as well, and both are quite amenable to computational modeling." |
| L3 | Rough-surface attachment coefficient | rough sites have alpha = 1 | alpha_rough ~ 1 "under most conditions"; alpha_tip ~ 1 further multiplied by a thermal factor to give alpha_tip,tot < 1 | FACET | 3 | "For a non-faceted (a.k.a. rough) ice surface, measurements indicate alpha_rough ~= 1 under most conditions [2021Lib]" |
| L4 | A_basal = 1 at all temperatures | A_basal identically 1 at all T | A_basal ~ 1 stated only for -5 C, and only for the large-basal-surface branch; CM6 is a single-temperature snapshot | CM6 | 21 | "The -5 C model depicted in Figure 1 represents a single-temperature snapshot of the general temperature-dependent model described in [2019Lib1]." |
| L5 | A_basal (printed asymmetry) | A_basal identically 1 | The printed alpha_basal expression carries no prefactor at all (implicit 1), in contrast to alpha_prism which carries an explicit A_prism - agrees numerically, recorded because the asymmetry is explicit | APP | 11 | "alpha_basal(sigma_surf) = exp(sigma0,basal/sigma_surf) and alpha_prism(sigma_surf) = A_prism exp(sigma0,prism/sigma_surf)" |
| L6 | Sign of the exponent in the attachment-coefficient form | alpha = A exp(-sigma0/sigma_surf), negative exponent | AS PRINTED in APP: no minus sign is rendered in either exponent. Verifier independently re-checked at 3x zoom and confirmed the minus is genuinely absent on that page (section 9, note V7) | APP | 11 | "alpha_basal(sigma_surf) = exp(sigma0,basal/sigma_surf) and alpha_prism(sigma_surf) = A_prism exp(sigma0,prism/sigma_surf)" |
| L7 | A_prism at (Tm - T) = 10 C | 0.83 in A_PRISM_CAK | A_basal ~= A_prism ~= 1 at temperatures below -10 C | CM9 | 4 | "At temperatures below -10 C, precision ice-growth measurements indicate that A_basal ~= A_prism ~= 1, and this allows for a relatively simple discussion of the SDAK-1 effect near -14 C [2020Lib1]." |
| L8 | Aspect-ratio thresholds for habit classification | plate AR <= 0.6667, column AR >= 1.5 | Within the reproduced [1961Kob] panel, the printed limiting values are c/a -> 0.8 for "Very thick plate" and c/a -> 1.4 for "Solid column"; TAX1 prints no criterion of its own | TAX1 | 4 | "Very thick plate c/a -> 0.8 ... Solid column c/a -> 1.4  [printed labels inside the [1961Kob] panel of Figure 7]" |
| L9 | Aspect-ratio convention | AR = (z extent)/(transverse extent) | The paper's aspect ratio is diameter/thickness, i.e. the reciprocal of the project's AR | CM7 | 8 | "In particular, the model predicts that the crystal aspect ratio (diameter/thickness) should change rapidly with supersaturation, and this is observed in the data." |
| L10 | Seed crystal shape / initial size (APP) | small hexagonal plate; largest measured systematic | Crystals originate from an expansion nucleator "typically of order one micron in size", land randomly, and are then selected for analysis; initial R and H are free model inputs, not a fixed seed shape | APP | 7 | "The Gibbs-Thomson effect is most noticeable immediately after nucleation, as the expansion nucleator produces crystals that are typically of order one micron in size." |
| L11 | Pressure independence of the kinetic parameters | sigma0/A used without a pressure caveat | Pressure independence of the Figure 2 parameters is stated to be an assumption | CM8 | 4 | "Moreover, the model assumes that the parameters in Figure 2 are independent of background air pressure." |
| L12 | Symmetry of the growth outcome vs a six-fold lattice | habit scored by AR on a hexagonal lattice with six-fold symmetric facet treatment | A single crystal of hexagonal ice Ih routinely grows large-scale three-fold morphologies at -14 C with near-100% yield over a narrow sigma_inf range; the six prism facets have identical lattice structures yet grow at different rates | TRIG | 17 | "Basic crystallography tells us that the six prism facets on a trigonal crystal have identical lattice structures, yet the alternating long and short facets grow at different rates in trigonal crystals." |
| L13 | Ambient-pressure neglect of particle diffusion (restated) | diffusion always active | Analytic model's neglect of particle diffusion scoped to low pressure only, with the stated directional bias that the model UNDERestimates R_facet/r_corner when particle diffusion matters | FACET | 8 | "The main takeaway from these paragraphs is that our basic model of faceting described above will likely overestimate R/r_corner when significant heating is present, while underestimating R/r_corner when particle diffusion is important. However, full 3D diffusion calculations are needed to fully quantify these statements in both cases." |

---

## 2. Attachment-kinetics parameters, assembled across papers

Every sigma0 and A value printed as a number anywhere in the ten papers, keyed by temperature and
facet. **47 numeric sigma0/A entries** and **7 printed closed-form expressions** were found. Values
are reproduced exactly as printed, including the papers' own unit conventions (some in percent, some
as fractions, some with no unit printed at all). Nothing is converted, averaged, or interpolated.

Two papers (TAX1 2109.00098v1, TRIG 2106.09809v1) print no sigma0 or A values at all. CM10
(2012.12916v1) prints no numeric sigma0 or A - only the ratio statement that sigma_0,prism at -14 C is
"about one-tenth of its broad-facet value" (p.9).

### 2A. Numeric values, ordered warm to cold

| T | Facet / branch | Param | Value | Paper | Page | Verbatim |
|---|---|---|---|---|---|---|
| -1 C | prism, branch 1 | A_1 | 0.3 | FACET | 9 | Table 1 row: "-1 \| 690 \| 0.3 \| 3e-5 \| 0.7 \| 1e-3" |
| -1 C | prism, branch 1 | sigma_0,1 | 3e-5 | FACET | 9 | Table 1 row: "-1 \| 690 \| 0.3 \| 3e-5 \| 0.7 \| 1e-3" |
| -1 C | prism, branch 2 (SDAK-2) | A_2 | 0.7 | FACET | 9 | Table 1 row: "-1 \| 690 \| 0.3 \| 3e-5 \| 0.7 \| 1e-3" |
| -1 C | prism, branch 2 (SDAK-2) | sigma_0,2 | 1e-3 | FACET | 9 | Table 1 row: "-1 \| 690 \| 0.3 \| 3e-5 \| 0.7 \| 1e-3" |
| -2 C | basal (all basal surfaces) | sigma_0,basal | 0.004 = 0.4% | CM7 | 3 | "Measurements indicate (see below) that sigma0,basal ~= 0.004 = 0.4% and A_basal ~= 1 so these values were used to define the basal curve in Figure 1." |
| -2 C | basal (all basal surfaces) | A_basal | ~ 1 | CM7 | 3 | (same sentence) |
| -2 C | prism, large surfaces | sigma_0,prism | 0.03% | CM7 | 3 | "the "large prism surfaces" curve in Figure 1 is again defined by a nucleation-limited model, this time using sigma0,prism = 0.03% and A_prism = 0.25 at -2 C." |
| -2 C | prism, large surfaces | A_prism | 0.25 | CM7 | 3 | (same sentence) |
| -2 C | prism, kinetic roughening | sigma_0,prism | 0.15% | CM7 | 4 | "the prism behavior transitions to the "prism kinetic roughening" curve in Figure 1, defined by A_prism = 1 and sigma0,prism = 0.15%." |
| -2 C | prism, kinetic roughening | A_prism | 1 | CM7 | 4 | (same sentence) |
| -2 C | prism, branch 1 | A_1 | 0.25 | FACET | 9 | Table 1 row: "-2 \| 635 \| 0.25 \| 3e-4 \| 0.75 \| 1.5e-3" |
| -2 C | prism, branch 1 | sigma_0,1 | 3e-4 | FACET | 9 | Table 1 row: "-2 \| 635 \| 0.25 \| 3e-4 \| 0.75 \| 1.5e-3" |
| -2 C | prism, branch 2 | A_2 | 0.75 | FACET | 9 | Table 1 row: "-2 \| 635 \| 0.25 \| 3e-4 \| 0.75 \| 1.5e-3" |
| -2 C | prism, branch 2 | sigma_0,2 | 1.5e-3 | FACET | 9 | Table 1 row: "-2 \| 635 \| 0.25 \| 3e-4 \| 0.75 \| 1.5e-3" |
| -3 C | prism, branch 1 | A_1 | 0.2 | FACET | 9 | Table 1 row: "-3 \| 585 \| 0.2 \| 1e-3 \| 0.8 \| 3e-3" |
| -3 C | prism, branch 1 | sigma_0,1 | 1e-3 | FACET | 9 | Table 1 row: "-3 \| 585 \| 0.2 \| 1e-3 \| 0.8 \| 3e-3" |
| -3 C | prism, branch 2 | A_2 | 0.8 | FACET | 9 | Table 1 row: "-3 \| 585 \| 0.2 \| 1e-3 \| 0.8 \| 3e-3" |
| -3 C | prism, branch 2 | sigma_0,2 | 3e-3 | FACET | 9 | Table 1 row: "-3 \| 585 \| 0.2 \| 1e-3 \| 0.8 \| 3e-3" |
| -4 C | prism, broad facet (no SDAK) | A_prism | 0.25 | CM9 | 9 | "so I assumed the CAK model with no SDAK effects, taking alpha_prism = 0.25exp (-0.14/sigma_surf) at -4 C, shown as the solid green curve in Figure 8." |
| -4 C | prism, broad facet (no SDAK) | sigma_0,prism | 0.14 (unit not printed; figure axes are in percent) | CM9 | 9 | "taking alpha_prism = 0.25exp (-0.14/sigma_surf) at -4 C" |
| -5 C | prism, branch 1 | A_1 | 0.2 | FACET | 9 | Table 1 row: "-5 \| 496 \| 0.2 \| 2e-3 \| 0.8 \| 5.5e-3" |
| -5 C | prism, branch 1 | sigma_0,1 | 2e-3 | FACET | 9 | Table 1 row: "-5 \| 496 \| 0.2 \| 2e-3 \| 0.8 \| 5.5e-3" |
| -5 C | prism, branch 2 | A_2 | 0.8 | FACET | 9 | Table 1 row: "-5 \| 496 \| 0.2 \| 2e-3 \| 0.8 \| 5.5e-3" |
| -5 C | prism, branch 2 | sigma_0,2 | 5.5e-3 | FACET | 9 | Table 1 row: "-5 \| 496 \| 0.2 \| 2e-3 \| 0.8 \| 5.5e-3" |
| -5 C | basal, large surface | sigma_0,basal | ~ 0.007 = 0.7% | CM6 | 3 | "Measurements indicate (see below) that sigma_0,basal ~= 0.007 = 0.7% and A_basal ~= 1 so these values were used to define the large-basal-surface curve in Figure 1." |
| -5 C | basal, large surface | A_basal | ~ 1 | CM6 | 3 | (same sentence) |
| -5 C | basal, NARROW surface (SDAK) | sigma_0,basal | 0.1% | CM6 | 4 | "The narrow-basal-surface curve in Figure 1 is defined by Equation (2) with A_basal = 1 and sigma_0,basal = 0.1%, but this is meant to represent a rough approximation of reality, and even the functional form of this curve is not well known." |
| -5 C | basal, NARROW surface (SDAK) | A_basal | 1 | CM6 | 4 | (same sentence) |
| -5 C | prism, large surface | sigma_0,prism | ~ 0.2% | CM6 | 5 | "Here again, measurements have determined sigma_0,prism ~= 0.2% and A_prism ~= 0.2 near -5 C [2013Lib], and these values have been used in Figure 1." |
| -5 C | prism, large surface | A_prism | ~ 0.2 | CM6 | 5 | (same sentence) |
| -5 C | basal (0.08 bar fit) | sigma_0,basal | 0.73% | APP | 11 | "The model shown in Figure 6 used alpha_basal(sigma_surf) = exp(sigma0,basal/sigma_surf) and alpha_prism(sigma_surf) = A_prism exp(sigma0,prism/sigma_surf) with sigma0,basal = 0.73%, sigma0,prism = 0.20%, and A_prism = 0.25." |
| -5 C | prism (0.08 bar fit) | sigma_0,prism | 0.20% | APP | 11 | (same sentence) |
| -5 C | prism (0.08 bar fit) | A_prism | 0.25 | APP | 11 | (same sentence) |
| -5 C | basal (0.08 bar fit) | A_basal | no prefactor printed, i.e. implicit 1 | APP | 11 | (same sentence) |
| -7 C | prism, branch 1 | A_1 | 0.5 | FACET | 9 | Table 1 row: "-7 \| 419 \| 0.5 \| 8e-3 \| 0.5 \| 1e-2" |
| -7 C | prism, branch 1 | sigma_0,1 | 8e-3 | FACET | 9 | Table 1 row: "-7 \| 419 \| 0.5 \| 8e-3 \| 0.5 \| 1e-2" |
| -7 C | prism, branch 2 | A_2 | 0.5 | FACET | 9 | Table 1 row: "-7 \| 419 \| 0.5 \| 8e-3 \| 0.5 \| 1e-2" |
| -7 C | prism, branch 2 | sigma_0,2 | 1e-2 | FACET | 9 | Table 1 row: "-7 \| 419 \| 0.5 \| 8e-3 \| 0.5 \| 1e-2" |
| -10 C | prism, NARROW facet (SDAK) | sigma_0,prism,SDAK | ~ 0.85% | CM8 | 14 | "As with -25 C, the weaker SDAK effect yields as small reduction in the prism nucleation barrier on narrow prism facets, giving sigma_0,prism,SDAK ~ 0.85% while the large-facet value is sigma_0,prism,LF ~ 1.4%." |
| -10 C | prism, large facet | sigma_0,prism,LF | ~ 1.4% | CM8 | 14 | (same sentence) |
| below -10 C | basal and prism | A_basal, A_prism | both ~ 1 | CM9 | 4 | "At temperatures below -10 C, precision ice-growth measurements indicate that A_basal ~= A_prism ~= 1, and this allows for a relatively simple discussion of the SDAK-1 effect near -14 C [2020Lib1]." |
| -10 to -30 C | basal and prism | A_basal, A_prism | both ~ 1 | CM8 | 3 | "The present paper focuses on temperatures between -10 C and -30 C, where A_basal ~ A_prism ~ 1." |
| -14 C | basal | sigma_0,basal | 2.33 percent | CM8 | 10 | "alpha_basal v_kin sigma_surf with alpha_basal = exp (-sigma_0,basal/ sigma_surf) and sigma_0,basal = 2.33 percent at -14 C." |
| -15 C | prism, branch 1 | A_1 | 1 | FACET | 9 | Table 1 row: "-15 \| 208 \| 1 \| 3e-2 \| - \| -" |
| -15 C | prism, branch 1 | sigma_0,1 | 3e-2 | FACET | 9 | Table 1 row: "-15 \| 208 \| 1 \| 3e-2 \| - \| -" |
| -15 C | prism, branch 2 | A_2, sigma_0,2 | printed as "-" (no second branch at this T) | FACET | 9 | Table 1 row: "-15 \| 208 \| 1 \| 3e-2 \| - \| -" |
| -25 C | prism, NARROW facet (SDAK) | sigma_0,prism,SDAK | ~ 6.6% | CM8 | 13 | "Remarkably, the measurements in Figure 15 are well described by the functional form alpha_prism,SDAK(sigma_surf) ~ exp(-sigma_0,prism,SDAK/sigma_surf) with sigma_0,prism,SDAK ~ 6.6%, while the large-facet value is sigma_0,prism,LF ~ 9.2%." |
| -25 C | prism, large facet | sigma_0,prism,LF | ~ 9.2% | CM8 | 13 | (same sentence) |
| all T | basal | A_basal | 1 | CM8 | 3 | "A_basal = 1          (4)" |
| all T, both facets | both (M1 model) | A | 1 | TAX2 | 6 | "To keep M1 relatively simple, we chose to set A = 1 in Equation 3 for all growth conditions, even though our data suggest that this is not entirely accurate for broad prism facets at high temperatures [2013Lib, 2021Lib]." |

### 2B. Printed closed-form expressions (7)

| Expression | Applies to | Paper | Page | Verbatim |
|---|---|---|---|---|
| sigma_0,basal(T*) = 0.02 T*^1.75 + 0.3 | large (broad) basal facet; T* = (Tm - T) in Celsius, sigma_0 in percent | CM8 | 3 | "sigma_0,basal(T_*) = 0.02T_*^1.75 + 0.3          (2)" |
| sigma_0,prism(T*) = 0.02 T*^1.9 - 0.025(T* - 0.3) | large (broad) prism facet | CM8 | 3 | "sigma_0,prism(T_*) = 0.02T_*^1.9\n-0.025(T_* - 0.3)          (3)" - printed on two lines; the exponent 1.9 sits on the first line so the subtraction is a separate additive term |
| A_prism = (0.4 + 0.04 abs(T* - 4)^3)/(2.2 + 0.04 abs(T* - 4)^3) | prism prefactor | CM8 | 3 | "A_prism = (0.4 + 0.04\|T_* - 4\|^3) /(2.2 + 0.04\|T_* - 4\|^3)          (5)" |
| sigma_0,basal(T) = (0.02 T^1.75 + 0.3) * (1 - 0.87 exp(-((log(T) - log(4.5))^2)/0.07 | M1, narrow facets, WITH SDAK dip. Closing parenthesis is MISSING as printed; log base unspecified | TAX2 | 6 | "sigma_0,basal(T) = (0.02T^1.75 + 0.3) * (1 - 0.87exp (-((log(T) - log(4.5))^2)/0.07 ... with temperature here in degrees Celsius." |
| sigma_0,prism(T) = (0.015 T^2 + 0.02 T^0.6) * (1 - 0.95 exp(-((log(T) - log(14.4))^2)/0.06 | M1, WITH SDAK dip. Closing parenthesis MISSING as printed; log base unspecified | TAX2 | 6 | "sigma_0,prism(T) = (0.015T^2 + 0.02T^0.6) * (1 - 0.95exp (-((log(T) - log(14.4))^2)/0.06" |
| sigma_0,basal(T) = (0.02 T^1.75 + 0.3) | M2, broad facets, SDAK dip removed | TAX2 | 7 | "In M2, the sigma_0(T) for broad facets could then be defined by:   sigma_0,basal(T) = (0.02T^1.75 + 0.3)" |
| sigma_0,prism(T) = (0.015 T^2 + 0.02 T^0.6) | M2, broad facets, SDAK dip removed | TAX2 | 7 | "sigma_0,prism(T) = (0.015T^2 + 0.02T^0.6)   which is the same as M1 except without the SDAK dips." |

### 2C. Where the papers disagree with each other

These are disagreements **between papers**, not between the papers and the project. They are stated
as printed-value comparisons only.

1. **sigma_0,basal at -5 C: 0.7% vs 0.73%.** CM6 p.3 prints "sigma_0,basal ~= 0.007 = 0.7%"; APP p.11
   prints "sigma0,basal = 0.73%". CM6 is a survey of all -5 C data; APP is a single-crystal fit at
   0.08 bar. Both are labelled -5 C.

2. **A_prism at -5 C: 0.2 vs 0.25 vs 0.2 (branch 1).** CM6 p.5 prints "A_prism ~= 0.2 near -5 C";
   APP p.11 prints "A_prism = 0.25"; FACET Table 1 p.9 prints A_1 = 0.2 at -5 C. The FACET value is
   only the first of two additive branches, so it is not the same quantity as the single-branch
   A_prism of CM6 and APP.

3. **The -2 C two-branch table and the -2 C two-branch paper print the same two numbers, but combine
   them differently.** FACET Table 1 at -2 C prints sigma_0,1 = 3e-4 and sigma_0,2 = 1.5e-3, i.e.
   0.03% and 0.15% in percent. CM7 p.3-4 prints sigma0,prism = 0.03% (large prism surfaces branch)
   and sigma0,prism = 0.15% (prism kinetic roughening branch). The values coincide; the structure
   does not. FACET adds the two terms (Eq 32, p.8: "alpha_facet = A_1 e^(...) + A_2 e^(...)"),
   whereas CM7 treats them as mutually exclusive branches selected by facet width and growth
   velocity ("For smaller facet dimensions and/or faster growth velocities, the prism behavior
   transitions to the "prism kinetic roughening" curve", p.4), with the switching point explicitly
   unconstrained: "the two prism branches overlap in the region 0.1 < sigma_surf < 1 percent. This is
   meant to indicate that the transition from one curve to the other will happen somewhere in this
   region, and it may be smooth or abrupt; the exact behavior is not yet constrained by either theory
   or experiment." (CM7 p.4)

4. **Location of the basal SDAK dip: -4 C vs -5 C.** CM10 p.4 prints "a corresponding dip in
   sigma_0,basal near -4 C"; CM9 p.7 prints "a substantial "SDAK dip" centered near -4 C"; but CM8
   p.5 prints "the dip in sigma_0,prism near -14 C is accompanied by a similar dip in sigma_0,basal
   near -5 C". The verifier flagged this explicitly (note V9, section 9): the -5 C wording is what
   CM8 p.5 prints, while the companion papers place it near -4 C.

5. **Eq (3) of CM8 and the -25 C large-facet value quoted in the same paper.** CM8 p.3 prints the
   closed form sigma_0,prism(T*) = 0.02 T*^1.9 - 0.025(T* - 0.3); CM8 p.13 prints
   "the large-facet value is sigma_0,prism,LF ~ 9.2%" at -25 C. The extraction flagged these as not
   agreeing to the precision quoted, and the verifier confirmed: "the flagged arithmetic gap is real
   (T*=25 gives ~8.4%, vs 9.2% quoted on p.13)". The 8.4% figure is the verifier's evaluation of the
   printed formula, not a printed value, and is recorded here as such. The verifier also confirmed
   that the same formula reproduces the printed -10 C value (1.4%) and that Eq (2) reproduces the
   printed -14 C basal value (2.33%) exactly, so the discrepancy is specific to the -25 C prism value.

6. **A_prism = 1 is asserted in one paper and explicitly excluded in another, at different
   temperatures.** TAX2 p.6 sets A = 1 for all facets and all conditions in M1. CM7 p.6 states that
   A_prism ~ 1 "cannot describe the growth of large prism facets at temperatures near -2 C". CM8 p.3
   endorses A_prism ~ 1 only between -10 C and -30 C. These are not in contradiction if scoped by
   temperature and facet width, but no paper prints a single reconciled A_prism(T, w).

7. **The exponent sign in APP.** APP p.11 prints both attachment coefficients with no minus sign in
   the exponent, whereas CM7 Eq (2) p.3, CM6 Eq (2) p.3, CM8 Eq (1) p.3, CM9 Eq (1) p.2, CM10 Eq (1)
   p.2 and FACET Eq (3) p.3 all print the minus. The verifier re-checked APP p.11 at 3x zoom and
   confirmed the minus is genuinely absent there. Recorded as printed; not corrected.

---

## 3. SDAK

Four papers carry SDAK content: CM10 (2012.12916v1, the molecular-mechanism paper), CM9
(2011.02353v1, the -4 C basal dip), CM8 (2009.08404v2, the -14 C prism dip), and FACET
(2306.04042v1, the faceting paper, which is where the two-branch SDAK-2 table lives). CM6 and CM7
also state SDAK's presence or absence at -5 C and -2 C respectively.

### 3A. Was an SDAK-2 two-branch table found?

**Yes.** FACET (2306.04042v1), Table 1, page 9. Six rows, T = -1, -2, -3, -5, -7, -15 C, columns
`T (C) | vkin (um/sec) | A1 | sig0,1 | A2 | sig0,2`. All 22 numeric entries were verified individually
at source (verifier indices 25-53, all passed). The table is introduced as the SDAK-2
parameterization:

> "Using the sum of two nucleation processes is a convenient parameterization to include what we have
> called the "SDAK-2" phenomenon at the higher temperatures [2021Lib]. This phenomenon is speculative
> at present, and more work is needed to sort out the prism attachment kinetics at high
> temperatures." (FACET p.9)

Its provenance:

> "Table 1 shows the parameters we used for the prism attachment kinetics, which were chosen from
> experimental measurements of ice growth rates as a function of temperature and supersaturation
> [2021Lib]." (FACET p.9)

Note that this table is **prism only**. No basal (A, sigma0) table is printed in FACET; the basal
facet is instead assumed static: "we typically assume dR_thick/dt ~= 0 in the discussion that
follows." (FACET p.6). Note also that at -15 C the second branch is printed as a dash, i.e. the
two-branch form is not used at that temperature.

### 3B. Fit forms

| Form | Applies to | Paper | Page | Verbatim |
|---|---|---|---|---|
| alpha_facet = A_1 exp(-sigma_0,1/(sigma_surf - d_sv kappa_facet)) + A_2 exp(-sigma_0,2/(sigma_surf - d_sv kappa_facet)) | SDAK-2, prism, additive two-branch | FACET | 8 | "alpha_facet = A_1 e^(- sigma_0,1/(sigma_surf - d_sv kappa_facet)) + A_2 e^(- sigma_0,2/(sigma_surf - d_sv kappa_facet)) (32)" |
| alpha_basal(sigma_surf) = exp(-sigma_0,basal,SDAK/sigma_surf) - NO A prefactor printed | SDAK-1, basal, used to extract sigma_0,basal,SDAK | CM9 | 7 | "As was done in [2020Lib1], I next extracted a value of sigma_0,basal,SDAK from each measurement of alpha_basal(sigma_surf), using the functional form   alpha_basal(sigma_surf) = e^(-sigma_0,basal,SDAK / sigma_surf)   (2)" |
| alpha_prism,SDAK(sigma_surf) ~ exp(-sigma_0,prism,SDAK/sigma_surf) | SDAK-1, prism, narrow facet | CM8 | 13 | "the measurements in Figure 15 are well described by the functional form alpha_prism,SDAK(sigma_surf) ~ exp(-sigma_0,prism,SDAK/sigma_surf) with sigma_0,prism,SDAK ~ 6.6%, while the large-facet value is sigma_0,prism,LF ~ 9.2%." |
| Substitution rule: replace sigma_0,x by sigma_0,x,SDAK when the surface is not broadly faceted | SDAK-1, both facets | CM9 | 4 | "For reasons that are only partly understood at present [2019Lib1], it seems to work reasonably well to approximate the resulting growth behavior by replacing sigma_0,x by sigma_0,x,SDAK whenever the surface in question does not exhibit a broadly faceted structure." |
| Collapse to a single T-dependent parameter, valid away from the -14 C peak | SDAK-1, prism | CM8 | 15 | "The preceding results at -10 C and -25 C show that the functional form alpha_prism,SDAK(sigma_surf) ~ exp(-sigma_0,prism,SDAK/sigma_surf) provides a good representation of the SDAK growth behavior, and this means that alpha_prism,SDAK(T, sigma_surf) can be reduced to a single temperature-dependent parameter sigma_0,prism,SDAK(T) over much of this temperature span. The measurements near the peak at -14 C do not fit the simple exponential functional form, but the fit is reasonable on either side of the peak." |
| sigma_0,basal = sigma_0,basal(R_basal) - the R_basal dependence is stated NOT to be defined | SDAK-1, basal | CM6 | 4 | "For a quantitative model, one should therefore write sigma_0,basal = sigma_0,basal(R_basal), where the R_basal dependence is not well defined at present [2015Lib2], requiring additional experimental and/or theoretical input." |

### 3C. Temperature windows

| Quantity | Value | Paper | Page | Verbatim |
|---|---|---|---|---|
| Prism SDAK dip centre | near -14 C | CM10 | 4 | "Putting all these pieces together yields an "SDAK dip" in the effective sigma_0,prism near -14 C, as illustrated in Figure 3." |
| Prism SDAK dip minimum, measured | T = -14.15 +/- 0.15 C | CM8 | 16 | "Figure 19: Measurements of the radial growth velocity of plates growing at sigma_far = 22% as a function of temperature. A simple quadratic fit yields the peak location at T = -14.15 +/- 0.15 C. This temperature also corresponds to the minimum of the prism SDAK dip seen in Figure 18." |
| Basal SDAK dip centre | near -4 C | CM10 | 4 | "The CAK model additionally postulates a corresponding dip in sigma_0,basal near -4 C" |
| Basal SDAK dip centre, measured | centered near -4 C | CM9 | 7 | "Measurements of the basal SDAK parameter sigma_0,basal,SDAK as a function of temperature, revealing a substantial "SDAK dip" centered near -4 C." |
| Basal SDAK dip centre (conflicting statement in a third paper) | near -5 C | CM8 | 5 | "As postulated in the CAK model, the dip in sigma_0,prism near -14 C is accompanied by a similar dip in sigma_0,basal near -5 C." |
| Dips confirmed by growth-rate measurement at | -14 C and -4 C | CM10 | 4 | "Growth-rate measurements confirm the existence of SDAK dips at both -14 C [2020Lib1] and -4 C [2020Lib2], providing a compelling validation of the overall model structure." |
| Columnar window produced by basal SDAK | -4 C to -6 C | CM10 | 3 | "the SDAK effect on basal surfaces is necessary to produce columnar morphologies between -4 C to -6 C" |
| Platelike window produced by prism SDAK | -11 C to -18 C | CM10 | 3 | "a similar phenomenon on prism surfaces is responsible for platelike forms between -11 C to -18 C" |
| SDAK at -2 C | essentially absent | CM7 | 12 | "Comparing [2019Lib2] with the present paper, we see that the SDAK phenomenon that was so important on basal surfaces at -5 C is essentially absent at -2 C." |
| Prism SDAK dip localization / absence at warm T | localized near -14 C; effects completely absent at -2 C | TRIG | 18 | "The "SDAK dip" on the prism facet is localized near -14 C [2020Lib1], and its effects are completely absent at -2 C." |
| ESI strength at -25 C | "not strong enough" to make thin plates | CM8 | 13 | "it appears that the Edge-Sharpening Instability is simply not strong enough at this temperature to yield the thin platelike forms seen at -14 C" |

### 3D. Mechanism

CM10 is the only paper that attempts a molecular mechanism. Its chain, in its own words:

1. An established thin plate rounds its edge to minimize edge surface energy; raising the
   supersaturation sharpens the corner to R ~= d_sv/sigma_surf (CM10 Eq 2, p.3: "R ~= d_sv/sigma_surf
   (2)"), giving R ~ 100 nm at 1 percent: "If the surface supersaturation is sigma_surf ~= 1 percent,
   Equation 2 gives a corner radius of R ~= 100 nm" (p.6).
2. The Gibbs-Thomson gradient in admolecule binding energy across that corner produces a lateral
   force, Eq 5 p.6: "f_SD,max ~= (gamma_sv/c_ice)(1/R^2)   (5)", which drives admolecules over the
   last terrace step onto the narrow prism facet.
3. The resulting density perturbation is Eq 12 p.8: "(delta_rho/rho_0)_max ~= gamma_sv/(c_ice kT) *
   x_SD^2/R^3   ~= 0.01 (100 nm/R)(x_SD/R)^2   ~= sigma_surf (x_SD/R)^2        (12)".
4. Higher admolecule density raises the nucleation rate, lowering effective sigma_0,prism.

Supporting constants printed in CM10: gamma_sv ~ 0.106 J/m^2 (p.3), c_ice ~ 3.1e28 m^-3 (p.3),
kT ~ 3.6e-21 J at -14 C (p.3), d_sv ~ 1 nm (p.3), D_facet ~ 1e-7 m^2/sec (p.7), x_SD ~ 100 nm on a
faceted prism facet (p.7), x_SD ~ 20 nm in a QLL (p.8), lambda_s ~ 0.1 (p.7), tau ~ 10 nsec (p.8).

**The paper states its own mechanism falls short of the measured dip depth by roughly a factor of
five:**

> "When sigma_surf ~= 1 percent and R ~= 100 nm, the nucleation dynamics will behave as if the
> supersaturation was double its normal value, meaning an effective sigma_0,prism of half its
> broad-facet value." (CM10 p.9)

> "A factor-of-two reduction in the effective sigma_0,prism is perhaps too small to reproduce the
> actual SDAK dip at -14 C, where sigma_0,prism is about one-tenth of its broad-facet value
> [2020Lib1]." (CM10 p.9)

> "Although the simple-surface model in the previous section defines the essential physics of how
> surface-tension-driven surface diffusion can alter the attachment kinetics, this basic picture is
> too simplistic to explain the observed SDAK phenomenon." (CM10 p.9)

### 3E. Trigger condition

The trigger is stated to be mesoscopic facet geometry, not temperature alone.

| Statement | Paper | Page | Verbatim |
|---|---|---|---|
| Requires a narrow facet; no numeric width threshold printed, only "sufficiently narrow" | CM10 | 9 | "If the prism facet is sufficiently narrow" |
| Enhancement confined to a boundary layer of width ~ x_SD from the facet edge | CM10 | 11 | "as a substantial increase in admolecule surface density will be found only within a distance of roughly x_SD from the facet edge. This covers most of the surface on a thin-plate crystal, but only a small fraction of the area on a large faceted surface." |
| Top prism terrace width for a thin plate at -14 C | CM8 | 6 | "the width of the top prism terrace is w ~ sqrt(8aR_edge), where a is the molecule size and R_edge is the radius of curvature of the plate edge shown in Figure 3." |
| Numeric width and edge radius at -14 C | CM8 | 6 | "For a typical thin-plate snow crystal growing near -14 C, we might have R_edge ~ 1 um and w ~ 50 nm." |
| "Narrow" basal surface radius of curvature at -5 C | CM6 | 4 | "In Figure 1, the "narrow basal surface" curve refers to the narrow edge of a hollow-column crystal or the sharp tip of a c-axis needle crystal, where the radius of curvature of the surface may be of order R_basal ~= 1 um." |
| "Large prism surfaces" width and velocity bounds at -2 C | CM7 | 4 | "As the label suggests, this curve applies when the faceted prism surfaces have large lateral dimensions, typically meaning greater than roughly 1-2 um." and "This usually also means that the prism growth velocities are relatively slow, less than about 1 um/sec." |
| Temperature gate is the Ehrlich-Schwoebel barrier softened by localized premelting | CM10 | 4 | "This inhibition is greatly reduced at the onset of surface premelting, however, which the model postulates as occurring near -14 C on the prism facet." |
| A full theory must depend on terrace width, not T alone | CM9 | 4 | "Put another way, a full theory of the SDAK phenomenon would provide a reduction of the nucleation barrier that depends on T, sigma_surf, and the mesoscopic structure of the crystal, especially the width of the uppermost terrace surfaces." |
| Why a single-valued sigma_0,SDAK(T) is usable at all | CM9 | 4 | "As a result, the facet widths are not independent variables in the equations but assume certain fixed values that arise from the structural self-assembly present in diffusion-limited growth." |

### 3F. SDAK-2 (the A_prism -> 1 effect), separately from the two-branch table

| Statement | Paper | Page | Verbatim |
|---|---|---|---|
| Definition and naming | CM9 | 4 | "Moreover, numerous experiments suggest that A_prism -> 1 on narrow prism facets at high sigma_surf in this temperature range, which we attribute to a second SDAK effect, which I call SDAK-2 [2019Lib2, 2020Lib]." |
| sigma_surf below which SDAK-2 is unimportant, -2 C | CM9 | 6 | "From our previous observations, we know that the SDAK-2 effect is relatively unimportant if sigma_surf <~ 0.1 percent at -2 C [2020Lib] and sigma_surf <~ 0.3 at -5 C [2019Lib2], as illustrated in Figure 3." (the second value is printed with no percent sign) |
| Status | FACET | 9 | "This phenomenon is speculative at present, and more work is needed to sort out the prism attachment kinetics at high temperatures." |
| Why it is hard to isolate | CM6 | 5 | "Unfortunately, the facet width is inexorably linked with sigma_surf in these experiments, so it becomes difficult to disentangle the effects of facet width and surface supersaturation on growth rates. The SDAK-2 phenomenon is thus rather poorly understood, but it is also a relatively minor part of the CAK model." |
| Hypothesized 3D extension at a triangular tip | TRIG | 10 | "Given that the 2D SDAK effect yields large increases in alpha_prism for prism edges at -14 C [2020Lib1], it would not be surprising to see an increase of a factor of two or more in alpha_prism on the sharp triangular tip, where the top prism terrace becomes a small island." |

---

## 4. The c-axis needle seed and the 206-observation data set

The project seeds with a small hexagonal plate. Every observation in the two Taxonomy papers, in CM8,
CM9, and in TRIG was grown on the tip of a slender c-axis "electric" ice needle instead. This section
collects the seed geometry and chamber conditions in full.

### 4A. Seed geometry

| Quantity | Value | Paper | Page | Verbatim |
|---|---|---|---|---|
| Seed for all 206 observations | tip of a slender c-axis ice needle | TAX2 | 7 | "Figure 2 shows a set of 206 snow crystal growth observations as a function of temperature and water vapor supersaturation in air, each showing the morphology and size of an ice crystal forming on the tip of a slender c-axis ice needle after a known growth time." |
| Why the needle is used | it gives a well-defined initial condition | TAX2 | 8 | "Using slender ice needles as seed crystals provides a well-defined initial condition, while revealing the emerging structural features in far greater detail than previous observations." |
| Facet count at the tip | a single basal facet, a single set of basal/prism corners | TAX1 | 10 | "Using a slender ice needle as a seed crystal nicely avoids the double-plate problem, as the needle tip presents only a single basal facet. When plate formation is favored, only a single plate emerges from the tip, providing a relatively simply geometry for comparison with computational models." |
| Needle tip radius, minimum during growth | as small as 100 nm | TAX1 | 11 | "Remarkably, the ice-needle tip radius can be as small as 100 nm during growth, yielding tip growth velocities above 150 um/sec in extreme cases." |
| Needle tip growth velocity | above 150 um/sec (extreme cases) | TAX1 | 11 | (same sentence) |
| Needle tip radius, photographed example | about 1.5 microns | TAX1 | 12 | "Diffraction effects can be seen near the needle tip, which has a tip radius of about 1.5 microns." |
| Needle length, longest in Figure 18 | approximately 3 mm | TAX1 | 12 | "The longest needle is approximately 3 mm long, and the inset image shows a magnified view of the tip of the tallest needle." |
| Needle length before transfer (CM8) | 2-3 mm | CM8 | 7 | "The e-needles shown here are about 2-3 mm in overall length." |
| Needle tip radius at start of observation (TRIG) | no more than a few microns | TRIG | 15 | "The radius of this initial column is no more than a few microns at its tip." |
| Voltage applied to the frost-covered wire | 2000 volts | TAX1 | 12 | "Figure 18: Several c-axis electric ice needles growing out from a frost-covered wire held at an electrical potential of 2000 volts." |
| Chemical additive forcing c-axis growth | "trace chemical impurities" - no species or concentration printed | TAX1 | 11 | "This laboratory curiosity developed into a productive research tool when my students and I discovered that trace chemical impurities could be added to promote ice needle growth along the crystalline c-axis [2002Lib]." |
| Additive named in CM8 | acetic acid | CM8 | 7 | "Applying 2000 volts to the wire stimulated the growth of thin ice needles, and a slight additional vapor of acetic acid caused the e-needles to grow out along the ice c-axis." |
| Needle-production conditions | wire tip near -6 C, local supersaturation somewhat above 100%, 2000 V | CM8 | 7 | "first a thin wire was placed inside a vertical diffusion chamber with the wire tip near -6 C in highly supersaturated air, with the local supersaturation being somewhat above 100%. Applying 2000 volts to the wire stimulated the growth of thin ice needles" |
| Needle-production temperature (TAX1) | -6 C | TRIG | 6 | "The first diffusion chamber was used to produce "electric" c-axis ice needles by applying a high voltage to a frost covered wire, with the wire tip placed at -6 C in highly supersaturated air." |
| The needle is NOT axially symmetric in its effect | top and bottom basal surfaces of the plate grow differently | TAX1 | 10 | "Moreover, the intrinsic axial symmetry-breaking at the needle tip means that the top and bottom surfaces of the platelike extension grow differently, often yielding one convex and one concave basal surface in the process." |
| The needle perturbs the diffusion field and must be modelled | stated | TAX1 | 10 | "Of course, the presence of the growing ice needle adds a nontrivial element to the analysis, but this can be incorporated into computational models." |

### 4B. Chamber conditions

| Quantity | Value | Paper | Page | Verbatim |
|---|---|---|---|---|
| Background gas, TAX2 | "normal air"; NO numeric pressure printed anywhere in the paper | TAX2 | 6 | "Focusing on growth in normal air, we define our starter model (call it M1) to have a normal growth velocity parameterized by" |
| Background gas, TAX1 | "normal air" / "in air"; no pressure value printed anywhere | TAX1 | 1 | "I describe a new approach to the classification of snow crystal morphologies that focuses on the most common growth behaviors that appear in normal air under conditions of constant applied temperature and water-vapor supersaturation." |
| Background pressure, CM8 | one bar, filtered laboratory air | CM8 | 7 | "Figure 7: Platelike snow crystals grow on the ends of "electric" ice needles at a temperature near -15 C in filtered laboratory air at a pressure one bar [2021Lib]." |
| Background pressure, TRIG | one atmosphere | TRIG | 6 | "...to observe their growth under adjustable and carefully controlled growth conditions, always in air at one atmosphere." |
| Inside height of the growth chamber (DC2) | 10 centimeters | TAX1 | 11 | "The inside height of DC2 is 10 centimeters [2014Lib1]." |
| Field removal before growth | fields removed in DC2 | TAX1 | 11-12 | "Once the ice needles grew to 1-2 mm in length, the voltage was removed and the needles were transported to an adjoining diffusion chamber" (TRIG p.6 wording) |
| Chamber conditions producing thin plates on needle tips | chamber centre -15 C, local supersaturation approximately 16% | CM8 | 8 | "the chamber center temperature (where the needles were located) was set to -15 C with a local supersaturation of approximately 16%. In these conditions, thin hexagonal plates grew on the tips of the e-needles." |
| Thermistor absolute accuracy (CM8) | about 0.1 C | CM8 | 15 | "Care was taken to determine the temperature at the crystal growth region using a calibrated thermistor with an absolute accuracy of about 0.1 C." |

### 4C. The 206-observation matrix (TAX2 Figure 2, pages 11-14)

| Quantity | Value | Paper | Page | Verbatim |
|---|---|---|---|---|
| Number of observations | 206 | TAX2 | 1 | "This paper presents a matrix of 206 snow crystal growth observations as a function of temperature and water vapor supersaturation in air, each illustrating the morphology and size of a crystal forming on the tip of an isolated c-axis ice needle after a known growth time." |
| What each panel is labelled with | temperature, supersaturation, growth time, field-of-view size | TAX2 | 10 | "Figure 2: (Following four pages) Laboratory observations of snow crystals growing on the ends of slender c-axis ice needles [2021Lib2]. Growth occurred in air under constant environmental conditions, and each of the 206 panels is labeled with the temperature, water-vapor supersaturation, growth time, and the physical size of the field-of-view of each square image." |
| Temperature axis, 24 columns | -0.5, -1, -2, -3, -4, -4.5, -5, -6, -7, -8, -9, -10, -11, -12, -13, -14, -15, -16, -17, -18, -19, -20, -22, -24 C | TAX2 | 11-14 | Printed panel labels. Verifier confirmed at source: "p.11 = -0.5,-1,-2,-3,-4,-4.5; p.12 = -5,-6,-7,-8,-9,-10; p.13 = -11,-12,-13,-14,-15,-16; p.14 = -17,-18,-19,-20,-22,-24. Exactly the 24 columns claimed." |
| Supersaturation axis, 9 rows | 150%, 100%, 70%, 45%, 30%, 20%, 15%, 10%, 7% | TAX2 | 11-14 | Printed row labels. Verifier confirmed: "the nine supersaturation row labels are on the figure pages (11-14), where they read, top to bottom, 150%, 100%, 70%, 45%, 30%, 20%, 15%, 10%, 7% - exactly as claimed. (216 cells minus 10 blank panels = 206, consistent.)" |
| Blank cells | 10 (p.11: 150% at -0.5, -1, -2 C and 100% at -0.5 C; p.14: 150% at -18, -19, -20, -22, -24 C and 100% at -24 C) | TAX2 | 11, 14 | No printed sentence states this; it is the count of empty cells needed to reconcile the 24 x 9 grid with the stated 206 panels. Flagged by the extraction as low-consequence and not independently verified. |
| Shortest growth time | 54sec (at -4.5 C, 150%, FOV 789 um) | TAX2 | 11 | "-4.5C  150%   54sec  789um" |
| Longest growth time | 1334sec (at -12 C, 10%, FOV 314 um) | TAX2 | 13 | "-12C 10%   1334sec 314um" |
| Largest field of view | 2026 um (at -16 C, 100%, 278sec) | TAX2 | 13 | "-16C 100%   278sec  2026um" |
| Smallest field of view | 164 um (at -22 C, 15%, 266sec) | TAX2 | 14 | "-22C 15%   266sec  164um" |
| Purpose of the data set | a validation target for modellers | TAX2 | 8 | "At present, it is not clear that any existing 3D computational models of snow crystal growth can adequately reproduce any of the structures seen in Figure 2 under prescribed growth conditions, let alone reproducing the entire set with even modest fidelity." |
| Panels are subjectively selected representatives | stated | TAX2 | 8 | "Each composite photo (after focus stacking) shows a representative example selected from several growing crystals in each multi-needle set, or from multiple sets. Some subjective preference was given to well-formed crystals exhibiting good symmetry and growing on isolated ice needles." |

### 4D. The companion TAX1 morphology grid (Figure 24a-e, pages 19-23)

A second, smaller needle-seeded grid: 20 temperatures from -0.5 C to -21 C at five far-away
supersaturations 8%, 16%, 32%, 64%, 128%, with three cells missing.

| Panel | Temperature columns | Page |
|---|---|---|
| 24a | -0.5C, -1C, -2C, -3C | 19 |
| 24b | -4C, -5C, -6C, -7C | 20 |
| 24c | -8C, -9C, -10C, -11C | 21 |
| 24d | -12C, -13C, -14C, -15C | 22 |
| 24e | -16C, -17C, -18C, -21C (note the axis skips -19C and -20C) | 23 |

Missing cells and why:
- (-0.5C, 128%): "The upper-left panel is missing because the fast growth rate at those conditions
  causes melting." (TAX1 p.19)
- (-18C, 128%) and (-21C, 128%): "Panels on the upper right are missing because it is difficult to
  reach high supersaturations at low temperatures in a linear diffusion chamber." (TAX1 p.23)

A third needle-seeded set is referenced but not reproduced in these ten papers: "These and similar
images illustrating growth at 20 different temperatures from -0.5 C to -21 C, each at these same
supersaturation levels, can be found in [2019Lib]." (CM7 p.9), and "at 20 different temperatures from
-0.5 C to -21 C, at these same supersaturation levels" (CM6 p.19).

---

## 5. Measurement uncertainty

What the apparatus paper (APP, 1912.09440v1) and the measurement papers (CM6-CM9, TAX2) say bounds
how well these numbers are known.

### 5A. The apparatus paper: what limits a sigma0 measurement

| Bound | Paper | Page | Verbatim |
|---|---|---|---|
| Base plate temperature control | APP | 3 | "The temperature of the base plate shown in Figure 1 is controlled to an absolute accuracy of better than 0.1 C using a precision thermistor and thermal-electric modules within the vacuum envelope." |
| The absolute zero of supersaturation is not measurable to high accuracy | APP | 5 | "It is not trivial to determine the absolute value of DeltaT with great precision in this apparatus, owing to small offsets in thermistor values at a fixed temperature." |
| Consequence: the offset is fitted per crystal, not measured | APP | 9 | "The value of Vmon,0 that defines the point at which the supersaturation sigma_subst,0 goes to zero. This value can be measured from independent measurements, but not to high accuracy. Therefore, Vmon,0 is usually treated as an adjustable parameter determined mainly from the onset of sublimation in the image data, for the specific test crystal being analyzed." |
| The calibration splits into a good slope and a poor offset | APP | 5 | "The value of Ccal is known to a reasonably high precision, but Vmon,0 is a somewhat critical parameter that is best determined by examining the crystal growth behavior, as I describe in the modeling section below." |
| The extraction procedure is subjective | APP | 12 | "While this overall analysis process is necessarily somewhat subjective, in practice it works quite well, and I have found that this strategy of examining many forward-modeling runs using different parameters is substantially superior to other analysis options." |
| The only uncertainty-estimation procedure described | APP | 12 | "For example, refitting the data (using different values of sigma0,basal, sigma0,prism, and other parameters) with different assumptions of Vmon,0 provides a good indication of how much the kinetic parameters change with the uncertainty in determining Vmon,0." |
| No uncertainty is actually published for the -5 C fit | APP | 12 | "By running many models using a variety of different input assumptions, it soon becomes fairly straightforward to extract a reasonable best-fit sigma0,basal +/- delta-sigma0,basal (for example) that includes a realistic uncertainty in the measured value." - the paper describes the procedure but prints no uncertainty on sigma0,basal = 0.73%, sigma0,prism = 0.20%, A_prism = 0.25 |
| The analysis model is distorted for the habits of interest | APP | 9 | "The model works best for nearly isometric prisms with R ~= H, and will give somewhat distorted results for thin plates or slender columns." |
| Substrate interaction is an unquantified systematic on every measurement | APP | 3 | "Whenever ice crystals are grown on a substrate, as they are in this apparatus, substrate interactions must be considered as a possible source of systematic errors in the growth measurements." |
| Hydrophobic coating effectiveness is unverified at temperature | APP | 3 | "I have been obtaining satisfactory results using Hendlex Nano Glass Pro and Glass Prepare Cleaner on the sapphire substrate, but it is difficult to ascertain the coating effectiveness at low temperatures." |
| The coating trades one systematic for another | APP | 8 | "The addition of surface coatings may therefore introduce large and difficult-to-calculate thermal corrections. Thus, while hydrophobic and superhydrophobic coatings can decrease unwanted substrate interactions, they may also increase unwanted thermal effects, so one should proceed with caution when using such coatings." |
| Chemical impurities cannot be eliminated or bounded | APP | 7 | "It is a practical impossibility to completely eliminate chemical impurities from any experimental apparatus, and it is difficult to know what impurity level is required before chemical effects are negligible." |
| The latent-heating geometric factor is an estimate | APP | 7 | "For hemispherical ice prisms as illustrated in Figure 3, one must add a dimensionless geometrical factor to this result that cannot be calculated analytically, but I estimate that this increases delta-sigma_therm by roughly a factor of two." |
| alpha cannot be measured at all when attachment is fast | APP | 9 | "Of course, when alpha >> alpha_diff, it becomes exceedingly difficult to glean much useful information about the attachment coefficients from growth measurements [2019Lib, 2019Lib2]." |
| Sublimation is unmodelled | APP | 11 | "In principle, the model could be extended to describe the subsequent sublimation, but I have not gotten satisfactory results in this regime. During sublimation, the morphology changes from that of a faceted prismatic crystal to a rounded figure, and I have not yet developed the model to the point that it adequately reproduces the sublimation behavior." |

Quantified correction magnitudes printed in APP, all at -5 C:

| Correction | Magnitude | Page | Verbatim |
|---|---|---|---|
| Small-scale diffusion (SSD) | ~ 1.4% x (R/10 um)(v/(0.1 um/sec)) | 6 | "delta-sigma_SSD ~= 1.4% . (R/10u)(v/0.1 um/sec)   (13)" |
| Latent heating | ~ 0.01% x (R/10 um)(v/(0.1 um/s)) | 7 | "delta-sigma_therm ~= 0.01% . (R/10u)(v/0.1 um/s)   (20)" |
| Characteristic diffusion length X0 | ~ 0.142 um | 6 | "For example, at -5 C in normal air, X0 ~= 0.142 um and vkin ~= 496 um/sec, giving" |
| Kinetic velocity v_kin | ~ 496 um/sec | 6 | (same sentence) |
| Gibbs-Thomson length d_sv | ~ 1.0 nm | 6 | "where d_sv ~= 1.0 nm and kappa is the local surface curvature, equal to kappa = 2/R for a spherical surface." |
| eta at -5 C | ~ 0.082 K^-1 | 7 | "For example, at -5 C, eta ~= 0.082 K-1, Lsv ~= 2.8 x 10^6 J/kg, rho_ice ~= 917 kg/m3, and kappa_ice ~= 2.3 Wm-1K-1, giving" |
| L_sv | ~ 2.8e6 J/kg | 7 | (same sentence) |
| kappa_ice | ~ 2.3 W/m/K | 7 | (same sentence) |
| rho_ice | ~ 917 kg/m^3 | 7 | (same sentence) |

### 5B. The measurement papers: what bounds the SDAK numbers

| Bound | Paper | Page | Verbatim |
|---|---|---|---|
| Only the RATIO of the two alphas is measured; absolutes are model-conditional | CM8 | 16 | "One important caveat is that these experimental tests are limited in their physics reach, as they do not determine sigma_surf in a separate, model-independent way. For this reason, we could not examine alpha_basal(sigma_surf) and alpha_prism(sigma_surf) individually, but could only examine their ratio while using alpha_basal(sigma_surf) to estimate sigma_surf from the model." |
| Factor-of-two systematic possible in sigma_surf | CM8 | 9 | "Systematic errors of perhaps a factor of two in sigma_surf may be present using the witness-surface analysis technique for some crystal morphologies, but we will see below that such uncertainties will not appreciably alter the overall conclusions reached in this paper." |
| Worst exactly for columnar morphologies | CM8 | 9 | "The assumption is less accurate on crystals with broad facets, and it can be quite poor with long columnar crystals (for example, see [2020Lib])." |
| The central assumption is unverifiable within the experiment | CM8 | 10 | "This analysis procedure assumes a fundamental tenet of the CAK model - that the basal growth rate at -14 C is independent of facet width while the prism growth rate is strongly affected by the SDAK effect at this temperature. There is no way to independently verify the accuracy of this assumption in the current experiment, as strong diffusion effects preclude a direct measurement of sigma_surf with any meaningful accuracy." |
| The low-supersaturation (columnar) points carry large uncertainties | CM8 | 12 | "The basal growth becomes quite difficult to measure in this regime, and the witness-surface analysis begins to lose it accuracy owing to large diffusion effects. As a result, the uncertainties in the 4% and 2% data points in Figure 12 are quite large." |
| The broad-facet curves are ASSUMED exact when extracting the SDAK curve | CM9 | 3 | "For the present discussion, however, these known uncertainties should not substantially affect our final conclusions. For this reason, we will assume that the parameter curves in Figure 1 are essentially perfect, as our focus in this paper is primarily on the basal SDAK effect near -4 C." |
| The extraction is explicitly a bootstrap | CM9 | 8 | "The witness-surface analysis gets around this problem to a large degree, but this analysis strategy requires using part of the CAK model (the broad-facet value of alpha_prism(sigma_surf), in this case) to examine the lesser-known SDAK effect contained in sigma_0,basal,SDAK(T). The exercise is thus something of a "bootstrap" process, by which we can slowly build a general understanding of the CAK model." |
| An ad hoc 1.3x correction was applied to sigma_surf | CM9 | 10 | "A detailed analysis suggested that sigma_surf at the tip is somewhat higher than the value given by the witness-surface analysis, so this systematic effect was offset by introducing a factor of 1.3 increase for all slanted-needle morphologies." |
| Droplet nucleation perturbed the far-field supersaturation | CM9 | 8 | "The change in sigma_surf with temperature was larger than expected in this experiment, apparently resulting from droplet nucleation in the diffusion chamber." |
| Air measurements at -5 C cannot constrain alpha | CM6 | 21 | "One clear lesson from this investigation is that it is exceedingly difficult to analyze growth data in normal air at -5 C, as diffusion effects tend to dominate the overall growth behavior and the growth velocities. The reason for this is that alpha_basal and alpha_prism are both quite high over the typically accessed range in sigma_surf. This means alpha_diff << alpha in many measurements, and the growth rates are therefore nearly independent of alpha." |
| Same conclusion at -2 C | CM7 | 12 | "One clear lesson from these investigations is that it is quite difficult to gain useful information pertaining to the attachment kinetics by analyzing ice growth data in normal air." |
| Two of the author's own earlier analyses are retracted | CM7 | 7 | "This fact was not sufficiently appreciated in [2008Lib1], and I now believe that the analysis for alpha_basal and alpha_prism in that paper was largely incorrect." |
| A third earlier analysis is retracted | CM6 | 18 | "I now believe that the analysis described in [2016Lib1] was flawed, and one cannot fully understand the growth behavior using these observations alone." |
| A fourth | CM6 | 15 | "This fact was not sufficiently appreciated in [2009Lib], and I now believe that the analysis for alpha_basal and alpha_prism in that paper was largely incorrect." |
| Older experiments' sigma_surf calibration is compromised generally | CM7 | 7 | "As I discussed in [2004Lib], systematic errors in estimating sigma_surf were a significant problem in many of the earlier ice-growth experiments." |
| Precision ice-growth experiments are hard | CM10 | 11 | "A final reason is simply that precision ice-growth experiments are quite difficult to perform and are often affected by subtle systematic effects." |

### 5C. Uncertainty on the 206-observation validation target itself

| Quantity | Value | Paper | Page | Verbatim |
|---|---|---|---|---|
| Temperature uncertainty | typically +/- 0.2 C | TAX2 | 7 | "We estimate that the temperature uncertainties in these data are typically +/-0.2 C, and that the water-vapor supersaturations are" |
| Supersaturation uncertainty | between 0.8 and 1.2 times the stated values | TAX2 | 8 | "between 0.8 and 1.2 times the stated values. The supersaturation is especially difficult to measure to this accuracy in situ, so we rely on diffusion-chamber modeling to determine sigma_infinity surrounding the growing crystals, as described in [2021Lib2]." |
| Supersaturation is model-derived, not measured | TAX2 | 8 | (same sentence) |
| Reading 3D structure from the 2D panels is non-trivial and deferred | TAX2 | 8 | "It takes some experience to understand the 3D morphological structures from the 2D image projections shown in Figure 2, and I will try to provide 3D sketches derived from my own experience (after years of observing thousands of crystals from various angles under different conditions) in subsequent papers in this series." |
| The Figure 24 grid is qualitative, by the author's own statement | TAX1 | 13 | "Moreover, these images only illustrate qualitative snapshots of crystal morphologies under different growth conditions. Quantitative observations of the full growth history can easily be recorded as well for detailed comparisons with computational models." |
| Imaging is transmitted-light silhouette | TAX1 | 13 | Figure 20 documents dark-field, plain-background and Rheinberg transmitted illumination, i.e. measured "extents" are projected silhouettes, not 3D reconstructions |

---

## 6. Figures worth digitizing

Only figures the extractions marked `digitizable: true` and that bear on this project. No value has
been read off any of them.

| Paper | Figure | Page | Axes | What it would give this project |
|---|---|---|---|---|
| CM8 | 18 | 15 | x = -Temp (C), log, 5 to 40; y = sigma_0,basal / sigma_0,prism (percent), log, ~0.1 to 20 | A MEASURED sigma_0,prism,SDAK(T) curve with error bars spanning roughly -8 C to -30 C, plus the two large-facet curves for reference. Only two of its points are stated numerically in text (0.85% at -10 C, 6.6% at -25 C). This is the temperature-resolved narrow-facet prism nucleation parameter across the whole band where the sweep produces no plates. |
| CM9 | 5 | 7 | x = -Temperature (C), log, 2 to 10; y = sigma_0 (percent), log, 0.01 to 1 | The first MEASURED sigma_0,basal,SDAK(T) near -4 C, with both horizontal and vertical error bars, on the same axes as the broad-facet basal and prism curves. No tabulated values are printed anywhere in the paper. This is the basal counterpart of CM8 Figure 18 and the only quantitative source for the basal dip depth. |
| CM9 | 6 (bottom panel) | 8 | x = -Temperature (C), log, 2 to 9; y = v_basal / v_prism, linear, 0 to 10, with a reference line at 1 | A model-independent MEASURED axial/transverse growth-velocity ratio versus temperature - the closest published analogue to the project's aspect-ratio habit score, and the direct evidence for columnar growth in the -3 to -8 C band. Data rise from near 0 at -2 C to a maximum around -4 to -5 C and fall below ~1 by -8 to -9 C. |
| CM8 | 12 | 11 | x = sigma_surf (percent), log, 0.3 to 3; y = alpha_prism, alpha_basal, log, ~0.004 to 1 | Paired (sigma_surf, alpha_prism,SDAK) measurements with error bars at -14 C, each point annotated with its sigma_far (2%, 4%, 8%, 16%, 32%, 64%, 128%), plus the large-facet alpha_basal and alpha_prism curves on the same axes. The direct measured magnitude of the SDAK enhancement at the temperature where the sweep produces no plates. |
| CM8 | 4 | 5 | Two stacked panels, x = (Tm - T) (C), log, 1 to 50; y = sigma_0,basal (percent) and sigma_0,prism (percent), log, ~0.05 to 20 | The CAK model's PREDICTED SDAK dips for narrow basal and narrow prism facets across the full temperature range. No closed form is printed for the dotted narrow-facet curves anywhere in the paper, so digitizing is the only way to obtain the model curve. |
| CM8 | 5 | 6 | x = (Tm - T) (C), log, 1 to 50; y = sigma_0 (percent), log, ~0.05 to 30 | Both narrow-facet curves overplotted with the morphology bands labelled "plates", "columns", "thin plates". Whichever curve is lower is the fast-growing facet: the author's own graphical statement of why columns form near -5 C and thin plates near -14 C. |
| CM10 | 3 | 5 | x = (Tm - T) (C), log, 1-50; y = sigma_0 (percent), log, 0.1-10 | The SDAK-modified sigma_0 curve pair (basal dip near (Tm-T) ~ 4-5, prism dip near ~14-15) with morphology-band annotations. Shape, width and depth of both dips as functions of (Tm - T). No numeric dip depths or widths are printed; the only printed dip-depth number anywhere is the "about one-tenth" statement on CM10 p.9. |
| CM6 | 1 | 3 | x = sigma_surface (percent), log, 0.01 to ~3; y = alpha, log, 0.001 to 1, labelled "-5 C" | The four-branch -5 C alpha(sigma_surf) model. Three of the four branches can be reconstructed analytically from the printed constants; the "prism kinetic roughening" dashed curve exists ONLY as a plotted curve and would have to be digitized. |
| CM6 | 8 | 12 | x = R, H (microns), 0 to 7; y = Number, 0 to ~21; two hatched histograms | A measured (R, H) distribution for -5 C simple prisms at sigma_inf ~ 0.2%, i.e. an empirical rho_aspect = H/R distribution including its width, directly comparable to the project's AR scoring. The caption states columnar crystals were entirely absent. |
| CM6 | 10 | 14 | Five stacked log-log panels; y = Length, Diameter (um), 1 to ~200; x = Growth Time (s), 40 to 400 | Measured columnar aspect ratios at -5 C versus sigma_inf. The aspect ratios and both velocities are printed as figure text (5.8, 5.0, 4.2, 3.7, 3.7 at sigma = 0.5%, 1.1%, 2.2%, 4.2%, 6.5%), so those need not be digitized; the time series themselves would still have to be. |
| CM6 | 15 | 18 | x = sigma_surface (percent), log, 0.01 to ~3; y = alpha, log, ~0.0005 to 1 | The only place where the prism kinetic-roughening branch is anchored to data points; gives empirical alpha_prism(sigma_surf) above ~0.3% at -5 C. Text stresses the analysis is model-dependent and speculative. |
| CM7 | 3 and 4 | 5, 6 | Two stacked panels each, x = sigma_surface (percent), log, 0.01 to ~3; y = alpha_basal (0.001-1) and alpha_prism (0.01-1) | Two independent measured alpha point clouds at -2 C with error bars, at 0.03 bar and 0.06 bar. Digitizing both gives a reproducibility envelope on the -2 C attachment coefficients, and shows how badly a constrained A_prism = 1 model misses (the light-green dashed curve on each). |
| CM7 | 8 | 8 | x = TEMPERATURE C, 0 to about -35; y = size in mm, 0 to ~0.55 (reproduced from [1987Kob]) | A measured size-versus-temperature curve for BOTH diameter and thickness after 200 s at water saturation - an experimental aspect-ratio-versus-temperature trace spanning roughly 0 to -30 C. Only the (40, 180) nm/sec pair at -2 C is quoted numerically in the text. |
| CM7 | 6 | 7 | Two stacked linear panels, x = growth time (s), 0 to ~450; y = diameter (um) 0-80+ and thickness (um) 0-~11 | Measured diameter AND thickness versus time for free-falling crystals at -2 C at two supersaturations in 1 bar air. Note the paper states these sigma_inf labels are too high by perhaps a factor of two. |
| APP | 6 | 12 | x = Time (s), 0 to 250; left y = R, H (microns), -2 to 10; right y = Supersaturation (percent), -0.1 to 0.5 | A full R(t) and H(t) growth-and-sublimation trajectory for a real faceted prism at -5 C and 0.08 bar, with sigma_subst,0(t), sigma_subst(t) and sigma_surf(t) traces. Gives a measured aspect-ratio history, the actual magnitude of the two diffusion corrections, and the data behind the sigma0,basal = 0.73% / sigma0,prism = 0.20% / A_prism = 0.25 fit. |
| CM8 | 9 | 8 | Top: y = R_needle, R_plate, H (microns), 0 to ~60; x = Time (s), 0 to 100 | A diffusion-limited forward-model comparison at -15 C with the prism nucleation parameter varied over a printed grid (sigma_0,prism = 0.1, 0.2, 0.4, 0.8), against measured R(t) and H(t). A ready-made benchmark for a diffusion solver. |
| CM8 | 11 | 10 | y = R, H (microns), 0 to ~160; x = Growth Time (s), 0 to ~220; note H is plotted as 10*H | The canonical -14 C "exceptionally thin plate" (30:1 prism:basal). Gives an aspect-ratio-versus-time target inside the band where the sweep currently produces neutral crystals. |
| CM8 | 14 | 13 | y = R, H (microns), 0 to ~60; x = Growth Time (s), 0 to 250 | Measured columnar morphology at -25 C with both R(t) and H(t), H growing faster than R - a quantitative columnar target, with an explicit morphology sketch (cone-with-fins) that is not a simple hexagonal prism. |
| CM8 | 19 | 16 | x = -Temperature (C), linear, ~11.7 to 16.3; y = Velocity (um/sec), ~0.3 to 1.25 | Measured radial (prism) plate growth velocity versus temperature at fixed sigma_far = 22%, pinning the SDAK dip minimum. The peak value -14.15 +/- 0.15 C is printed on the plot and in the caption, so only the curve shape would need digitizing. |
| TRIG | 8 | 7 | x = Supersaturation sigma_inf (percent), linear, 4 to 12; y = Triangularity Parameter T1, linear, 0 to 1; three symbol classes (plates on e-needles, blocky columns, simple columns) | Morphology class and triangularity versus background supersaturation at fixed -14 C in air at 1 atm, from needle seeds. The observed morphology-vs-sigma_inf transition sequence at a single temperature inside the Plates band. |
| TAX2 | 2 | 11-14 | 24 x 9 photographic matrix; each panel labelled with T, sigma, growth time, field-of-view width | Every panel supplies (T, sigma_infinity, growth time, physical scale) plus an image from which crystal extent can be measured against the printed field-of-view width. p.12 covers -5 to -10 C (the band with zero columns); p.13 covers -11 to -16 C (the band with zero plates). |
| TAX1 | 24a-e | 19-23 | 4 x 5 photographic grids; columns = temperature, rows = 8/16/32/64/128% | 97 labelled (T, sigma) morphology observations, needle-seeded, spanning -0.5 C to -21 C. 24b covers the columnar regime; 24d covers the thin-plate window near -14 C. |
| TAX1 | 11c | 7 | x = time (seconds), -40 to ~110; y = radius (microns), 0 to ~68; two series (plate radius, needle radius) with model curves | The only quantitative growth-rate data in TAX1: plate radius and needle radius versus time for plate-on-needle growth with a matched model curve. Usable as a growth-rate validation target for a needle-seeded run. |
| TAX1 | 16 | 12 | x = Height (mm), 30 to 130; y = Temperature (C), -22 to -8; ~17 points on a straight line | The actual vertical temperature gradient of the growth chamber, i.e. the linear gradient in C per mm that sets the far-field boundary condition. |
| TAX1 | 6, 7, 8 | 4, 5 | Various (T, supersaturation) morphology diagrams reproduced from [1954Nak], [1958Hal], [1961Kob], [1990Yok] | Independent sets of habit-regime boundaries, including Figure 7 middle ([1961Kob]) which is the only place in these ten papers where a numerical c/a aspect ratio appears at all, and Figure 8 whose four bands (Plates / Columns / Plates / Columns and Plates) the project's regime scoring mirrors. |
| FACET | 2 and 3 | 10 | x = Prism growth velocity v_facet (nm/sec), log, 0.1 to 1000; y = R/r_corner, log; black curves = latent heating ignored, red = included | R/r_corner vs v_facet at six temperatures with and without latent heating, at R = 20 um (Fig 2) and R = 500 um (Fig 3) - a direct numerical test of a latent-heating implementation against Libbrecht's own model, and the magnitude of the heating correction as a function of growth rate and temperature. |
| CM10 | 1 / CM9 | 1 / 2 | Two stacked panels, x = (Tm - T) (C), log, 1 to 50; y = sigma_0 (percent) log and A log 0.1-1 | The same broad-facet sigma_0(T) and A(T) figure family the project already digitized, republished with measured data points and vertical error bars. Re-digitizing would cross-check the existing sigma0 anchors and the A_PRISM_CAK anchor list against a second and third printing, and confirms the basal A line is drawn flat at 1 across all (Tm - T). |

---

## 7. What these papers say about columns

Every printed statement bearing on the open problem - the model produces no columns in the -3.3 to
-9.9 C regime - collected and quoted.

### 7A. Statements that broad-facet kinetics alone cannot produce columns there

> "The broad-facet behavior alone is sufficient to explain the formation of plates at T>-3C and
> columns at T<-30C, as seen from the plot of sigma_0,basal and sigma_0,prism in Figure 1. The fact
> that A_prism < 1 at high temperatures complicates the picture, but only to a minor extent. Adding
> the basal SDAK dip yields strong columnar growth near -4 C, while the prism SDAK dip produces
> strong platelike growth near -14 C. Putting these pieces together thus yields the main temperature
> trends seen in the Nakaya diagram." (CM9, 2011.02353v1, p.11)

> "More generally, the CAK model suggests that the SDAK effect on basal surfaces is necessary to
> produce columnar morphologies between -4 C to -6 C, while a similar phenomenon on prism surfaces is
> responsible for platelike forms between -11 C to -18 C. In both cases, the attachment kinetics is
> markedly different on narrow and broad facet surfaces." (CM10, 2012.12916v1, p.3)

> "Together, these molecular-scale phenomena all factor importantly into the structure-dependent
> attachment kinetics that governs the formation of thin plates and hollow columnar crystals
> [2019Lib1, 2021Lib]." (TAX1, 2109.00098v1, p.8)

> "Because a lower nucleation barrier means faster growth, we see that the CAK model explains the
> prevalence of platelike forms near -2 C, needle-like crystals near -5 C, especially thin plates
> near -14 C, and columnar forms around -40 C, reproducing the known growth behaviors in the Nakaya
> diagram." (CM8, 2009.08404v2, p.6)

> "the SDAK phenomenon provides the only viable option currently available that can adequately
> explain the Nakaya diagram together with a plethora of other ice-growth data." (TAX2,
> 2306.13087v1, p.5)

### 7B. Statements that a plate is the CORRECT output of a broad-facet model at -5 C

> "The model predicted that platelike morphologies at -5 C should appear both in vacuum and in air at
> low supersaturations, provided the crystals exhibit relatively broad basal and prism facets. This
> behavior was confirmed in targeted experiments [2012Kni, 2019Lib2], while columnar forms near -5 C
> generally emerge only when the basal facets are quite narrow." (CM10, p.3)

> "While supporting the model in Figure 1 for broad-facet growth, the new data directly confirm the
> growth of plate-like simple prisms at -5 C when sigma_surf is low, as this morphological behavior
> is unambiguously observed in the imaging data. This direct observation of plate-like prismatic
> crystals at -5 C provides an important confirmation of our attachment-kinetics model. Producing
> columnar crystals at -5 C then requires the SDAK effect to increase alpha_basal compared to its
> value on broad basal facets." (CM6, 1912.03230v1, p.10)

> "Thick plates were found to be the norm when sigma_surf ~= 0.15%, with prism aspect ratios of
> roughly rho_aspect = H/R ~= 0.5, where H is the half-thickness and R is the effective radius of the
> hexagonal prism." (CM6, p.10)

> "Doing this experiment yielded mixed results, producing a diversity of prismatic crystals with
> aspect ratios throughout the range 0.1 < rho_aspect < 1. Columnar crystals (with rho_aspect > 1)
> were absent, and Figure 9 shows some examples of thin-plate crystals that formed." (CM6, p.13)

> "At this juncture I would like to again call attention to the fact that the model in Figure 1
> predicts plate-like growth for prismatic crystals at low sigma_surf. This prediction contradicts a
> well-established rule from the morphology diagram, suggesting that only columnar crystals are
> produced at -5 C." (CM6, p.11)

### 7C. What is stated to be required to produce a column

**A width-dependent nucleation barrier.**

> "In this picture, the value of alpha_prism depends on temperature T, surface supersaturation
> sigma_surf, and also quite strongly on facet width w. In Figure 12, it is the large change in w
> that brings about the rapid change in alpha_prism,SDAK observed. This overall behavior is
> essentially that expected from the Edge-Sharpening Instability (ESI) that results from the SDAK
> effect." (CM8, p.12)

> "For reasons that are only partly understood at present [2019Lib1], it seems to work reasonably
> well to approximate the resulting growth behavior by replacing sigma_0,x by sigma_0,x,SDAK whenever
> the surface in question does not exhibit a broadly faceted structure." (CM9, p.4)

> "Put another way, a full theory of the SDAK phenomenon would provide a reduction of the nucleation
> barrier that depends on T, sigma_surf, and the mesoscopic structure of the crystal, especially the
> width of the uppermost terrace surfaces." (CM9, p.4)

**The width scale is tens of nanometres, i.e. below any plausible lattice cell.**

> "the width of the top prism terrace is w ~ sqrt(8aR_edge), where a is the molecule size and R_edge
> is the radius of curvature of the plate edge shown in Figure 3." (CM8, p.6)

> "For a typical thin-plate snow crystal growing near -14 C, we might have R_edge ~ 1 um and w ~ 50
> nm." (CM8, p.6)

> "as a substantial increase in admolecule surface density will be found only within a distance of
> roughly x_SD from the facet edge. This covers most of the surface on a thin-plate crystal, but only
> a small fraction of the area on a large faceted surface." (CM10, p.11)

**A fast-growth transient, i.e. history dependence.**

> "the model predicts that we should be able to observe columnar growth on a substrate in air at -5
> C, provided we just start the experiment with a sufficiently high sigma_inf when nucleating
> crystals" (CM6, p.16)

> "These observations (along with the discussion in the text) suggest that a brief interval of fast
> growth followed by a longer period of slower growth is the usual recipe for growing slender
> columnar snow crystals in air" (CM6, Figure 12 caption, p.16)

> "Because of this early rapid growth, basal sharpening put alpha_basal on the SDAK track, and this
> fast growth maintained the sharp edge and kept alpha_basal on that track. This is the nature of the
> edge-sharpening instability (ESI)." (CM6, p.15)

> "The data presented above show that the initial growth conditions are an important factor in the
> development of sharp basal features, especially during periods of relatively fast growth. In the
> most extreme cases documented above, either thin plates or slender columns may develop under quite
> similar conditions, depending on the initial growth history." (CM6, p.22)

> "the model does a good job explaining how plate-like and columnar crystals can both commonly appear
> at -5 C under ostensibly identical growth conditions, as the morphological development can be
> strongly influenced by initial growth conditions" (CM6, p.21)

> "It is possible, however, when sigma_surf ~= 0.1 percent, to observe the growth of both platelike
> and columnar crystals simultaneously (brought about by different initial conditions), as was
> reported by Knight [2012Kni]." (CM9, p.5)

> "For example, ice growth behaviors near -5 C in air illustrate how a change in starting conditions
> can lead to markedly different morphologies as a crystal develops. As demonstrated by Knight, both
> platelike and needlelike crystals can grow under essentially identical conditions at this
> temperature, presenting a remarkable juxtaposition of growth forms appearing side by side during a
> single experimental run [2012Kni]." (TAX1, p.8)

**A background gas: the ESI is pressure-gated.**

> "This mechanism naturally yields thin plates with narrow prism facets near -14 C, but it only
> operates when the growth is substantially limited by particle diffusion through an inert background
> gas. The ESI does not occur at low pressures, so thin plates do not appear in near-vacuum
> conditions." (CM10, p.11)

**Kinetics anisotropy, not diffusion.**

> "The overall basal/prism aspect ratio of a growing snow crystal is largely determined by the
> anisotropy of the attachment kinetics [2021Lib]. For example, thin snow-crystal plates only form
> when alpha_basal << alpha_pri  , while slender columns only appear when alpha_prism << alpha_basal.
> Neither diffusion-limited growth nor surface-energy effects produce growing snow crystals with high
> overall aspect ratios." (TAX2, p.4)

> "This overall behavior reflects the general maxim in diffusion-limited snow-crystal growth that
> anisotropic growth morphologies on large scales require anisotropic attachment kinetics [2021Lib].
> As discussed with Figure 12, diffusion alone, specifically the Berg effect, will not promote the
> growth of triangular plates, but will instead result in evolution toward a basic hexagonal shape."
> (TRIG, p.11)

> "Diffusion-limited growth in the absence of this kind of anisotropic attachment kinetics will not
> yield a stably growing tip structure." (TRIG, p.9)

### 7D. Measured columnar observations in and near the failing band

| Observation | Value | Paper | Page | Verbatim |
|---|---|---|---|---|
| Columnar growth at -4 C, radius/velocities | radius 14 um, radial 49 nm/sec, axial 490 nm/sec, significant basal hollowing | CM9 | 6 | "Near the end of the series, the columnar radius was 14 um, the radial growth velocity was 49 nm/sec, the axial velocity was 490 nm/sec, and the columnar tip exhibited significant basal hollowing." |
| Onset of SDAK / basal hollowing at -4 C | sigma_surf ~= 0.5 percent | CM9 | 10 | "Note the rapid rise in alpha_basal at sigma_surf ~= 0.5 percent, signifying the onset of the SDAK effect, also causing the onset of basal hollowing at this same sigma_surf." |
| Solid column at the lowest -4 C supersaturation | no basal hollowing at 0.5%, deep hollowing at 8-16% | CM9 | 9 | "Note the progression from no basal hollowing (0.5%) to deep basal hollowing (8-16%) and then to complex dendritic structures." |
| Only flat-basal case at -4 C | sigma_inf = 0.5% | CM9 | 9 | "Only at sigma_infinity = 0.5%, the lowest value measured, did the column exhibit what appeared to be a flat basal surface." |
| Residual SDAK even there | inferred alpha_basal still substantially above broad-facet expectation | CM9 | 9 | "Even then, it appears that the SDAK effect is not entirely absent, as the inferred alpha_basal in Figure 8 is substantially higher than that expected for broad basal facets." |
| Free-fall columns at -5 C, aspect ratios | r = 5.8, 5.0, 4.2, 3.7, 3.7 at sigma = 0.5%, 1.1%, 2.2%, 4.2%, 6.5% | CM6 | 14 | "-5C, sigma = 0.5% ... v = 75 nm/sec ... v =13 nm/sec ... r = aspect ratio = 5.8" (and the four companion panels) |
| Hollow columns at -5 C, 8% | hollow columns, branching into needles at 16% | TAX1 | 20 | "Hollow columns appear at (-5C, 8%), branching into needles at (-5C, 16%)." |
| Needle tip velocities at -5 C at high sigma_inf | (330, 50), (970, 190), (1950, 390), (3000, 1200), (6000, 4400) nm/sec | CM6 | 19 | "Measurements of these and other images yielded tip velocity measurements of (v_basal, v_prism) ~= (330, 50), (970, 190), (1950, 390), (3000, 1200), and (6000, 4400) nm/sec." |
| Knight's needles at -5 C | ~2 um/sec tip velocity implying sigma_surf ~= 0.4% at the tip | CM6 | 20 | "With the reported needle tip velocities of about 2 um/sec, this implies sigma_surf ~= 0.4% at the needle tip, which is again illustrated in Figure 17." |
| Columns grown on a substrate at -5 C by starting high | sigma_inf ~= 3% | CM6 | 16 | "I performed this experiment, and Figure 12 shows some example crystals using sigma_inf ~= 3% (the exact value was somewhat ill-determined, and sigma_inf rapidly decreased from diffusion effects as the deposited crystals grew larger)." |
| Basal/prism growth-rate equality | -8 C | TAX1 | 21 | "The basal and prism growth rates are nearly identical at -8 C, yielding blocky forms and weak sidebranching at high supersaturations." |
| Columnar morphology at -14 C at low sigma | at 4% and below | CM8 | 12 | "As sigma_far drops to 4% and below, the e-needle growth morphology changes to a long faceted columnar structure with nearly equal basal and prism growth rates." |
| Columnar morphology at -14 C in TRIG | below sigma_inf = 6% | TRIG | 7 | "When sigma_inf was reduced below 6 percent, platelike crystals no longer grew from the ice needles, and the initially slender ice needles grew slowly into blocky forms or into simple columns." |
| Columnar crystal at -25 C | blocky hollow column, R and H both measured, H > R | CM8 | 13 | "Figure 14: A blocky hollow columnar snow crystal growing on the end of an e-needle at -25 C in normal air at a supersaturation level of 45%, along with measurements of R(t) and H(t)." |

### 7E. Warnings about scoring habit from overall shape

> "Although the prism growth is about 7x faster than the basal growth for this data point, the 8%
> crystal morphology appears quite blocky in overall form. A close look at the time series of images
> explains this, as the blocky morphology mainly results from growth of the lower basal surfaces of
> the block." (CM8, p.15)

> "The important message from this example is that morphological observations do not always tell the
> whole story, which requires careful measurements of growth rates on the different surfaces." (CM8,
> p.15)

> "As described in [2020Lib], rho_aspect is not always a good indicator of alpha_basal/alpha_prism,
> however, as sigma_surf generally becomes smaller as a crystal grows. Thus rho_aspect depends on the
> entire growth history of a particular crystal, and detailed modeling is required to measure
> alpha_basal and alpha_prism with high accuracy [2020Lib]." (CM6, p.10)

### 7F. What the authors say about what any model can currently do

> "At present, it is not clear that any existing 3D computational models of snow crystal growth can
> adequately reproduce any of the structures seen in Figure 2 under prescribed growth conditions, let
> alone reproducing the entire set with even modest fidelity." (TAX2, p.8)

> "Unfortunately, all the 3D computational snow-crystal models presented in the literature to date
> suffer from two fundamental problems: 1) they all use physically incorrect or incomplete
> representations of the molecular attachment kinetics, and 2) none has been validated by
> quantitative comparisons with measurements of laboratory-grown snow crystals created in well-known
> environments." (TAX1, p.6)

> "As mentioned above, it is not possible at this time to simply choose the appropriate attachment
> kinetics for our model, because we do not yet know what is appropriate; our understanding of the
> underlying physics is not good enough, Instead, progress will likely be made via a "bootstrap"
> process, beginning with a best-guess parameterization of the attachment kinetics and making
> additional refinements based on how well the model predictions match growth experiments." (TAX2,
> p.7)

> "Unfortunately, such investigations are substantially hampered at present by the lack of adequate
> computational techniques that can model crystal growth in the presence of strongly anisotropic
> attachment kinetics in combination with particle and/or latent-heat diffusion." (FACET, p.18)

> "It is not clear at this time whether switching from M1 to M2 would yield many substantial
> differences in growth rates or morphological developments. Model testing is necessary to explore
> this question, along with detailed comparisons between model calculations and experimental data."
> (TAX2, p.7)

> "This model uses more accurate attachment kinetics than that in Figure 9, but it yielded generally
> similar structural features. This suggests that some morphological characteristics in snow crystal
> growth are rather insensitive to the details of the molecular surface physics and result mainly
> from diffusion-limited growth." (TAX1, p.6)

> "Adjusting ad hoc model parameters to fit a specific snow crystal type, especially one defined by
> still photographs, will simply not be sufficient to develop a comprehensive understanding of the
> essential physical processes involved." (TAX1, p.8)

### 7G. Statements that the SDAK prescription is itself incomplete near the dip

> "The measurements near the peak at -14 C do not fit the simple exponential functional form, but the
> fit is reasonable on either side of the peak." (CM8, p.15)

> "The full data set indicates, however, that this simple picture of sigma_0,prism,SDAK(T) is not
> adequate to fully describe the growth behavior near -14 C (Figure 12), when the SDAK effect is
> especially strong." (CM8, p.15)

> "While it is impossible to calculate such a complex surface behavior as a function of temperature,
> it seems possible that molecular-dynamics (MD) simulations could address many aspects of this
> phenomenon." (CM10, p.10)

> "An unfortunate feature of the SDAK phenomenon is that it becomes difficult to predict under
> precisely what conditions it will manifest itself. At -5 C, the prism growth is fairly well
> behaved, but alpha_basal is quite sensitive to the SDAK effect." (CM6, p.22)

> "In this respect, the ESI and the branching instability share an important feature - small
> inhomogeneities in the growth environment may yield dramatic changes is the final crystal
> morphologies." (CM6, p.22)

> "Our understanding of the molecular dynamics of the ice surface is not sufficient to realistically
> quantify the SDAK-1 effect on the principal facets, or even to roughly estimate the temperatures of
> the two SDAK dips." (CM9, p.4)

> "With little guidance from molecular theory, the positions and widths of the SDAK dips shown in
> Figure 4 were judiciously chosen to provide a reasonable explanation for the temperature-dependent
> behaviors seen in the Nakaya diagram [2021Lib, 2019Lib1]." (CM8, p.5)

> "The curves in Figure 2 were rough estimates based on morphological observations and related
> considerations, without quantitative confirmation." (CM9, p.8)

---

## 8. Stated limitations

The authors' own hedges, by paper. These are reported with the same weight as the results.

### 8A. TAX2 (2306.13087v1)

- "While these functional forms are completely ad hoc, the values of sigma_0(T) derive mainly from experimental data. The overall shapes of the curves come from measurements of the growth of faceted ice crystals in near vacuum [2013Lib, 2021Lib], and we have additionally added the "SDAK dips" presented in [2020Lib1, 2020Lib2, 2021Lib]." (p.6) - the closed forms are ad hoc, the underlying facet measurements were made in NEAR VACUUM, and the dips are grafted on from separate papers.
- "To keep M1 relatively simple, we chose to set A = 1 in Equation 3 for all growth conditions, even though our data suggest that this is not entirely accurate for broad prism facets at high temperatures [2013Lib, 2021Lib]." (p.6)
- "Setting A = 1 for all prism facets should not yield horribly inaccurate results, therefore, and it substantially reduces the overall complexity of this starter model." (p.6) - an unquantified "should not be horribly inaccurate", not a measurement.
- "The physical nature of the attachment kinetics on prism facets above -3 C remains somewhat puzzling, so it seemed prudent not to overthink M1 too much in this growth regime." (p.7)
- "In the formulation above, our starter model does not fully incorporate the SDAK effect, because M1 does not distinguish between broad and narrow facets. We made this choice because the Edge-Sharpening Instability (ESI) [2021Lib, 2017Lib] is quite efficient in air, quickly turning broad facets into narrow facets during growth." (p.7)
- "In these cases, therefore, it is a reasonable first approximation to assume that all faceted surfaces are described by the attachment kinetics on narrow facets." (p.7) - scoped to FAST-GROWING morphologies only.
- "That being said, a purely local model of the attachment coefficient may not adequately describe the attachment kinetics in all circumstances. For example, surface diffusion is an intrinsically non-local process that can alter the effective attachment coefficient, depending on surface morphology and other factors." (p.4)
- "Given this mismatch in resolution, it remains to be seen if the concept of a purely local attachment coefficient is adequate for accurately modeling the molecular physics underlying the attachment kinetics for snow crystal growth." (p.4) - directly relevant to a lattice model with cells far above molecular scale.
- "Although the surface-energy anisotropy in ice has not been definitively measured, the evidence suggests that it is small, and that the equilibrium shape of an isolated ice crystal is nearly spherical [2012Lib2]." (p.5)
- "Moreover, a rescaling of the far-away supersaturation sigma_infinity can be used to approximate the thermal effects to a reasonable approximation. For this reason, I will ignore latent heating and thermal diffusion for the remainder of this paper." (p.5)
- "We still treat the SDAK phenomenon as a working hypothesis, and one of the best ways to further test this hypothesis is by comparing computational growth models with laboratory observations." (p.5)
- "As a result, physically realistic models of structure formation that simultaneously exhibit both faceting and branching behaviors do not yet exist, and the snow-crystal problem has proven especially troublesome." (p.1)

### 8B. FACET (2306.04042v1)

- "We believe that these parameters are fairly accurate at the lowest temperatures but become more uncertain at the temperature increases." (p.9) - the accuracy of all of Table 1, degrading as temperature rises toward 0 C.
- "Using the sum of two nucleation processes is a convenient parameterization to include what we have called the "SDAK-2" phenomenon at the higher temperatures [2021Lib]. This phenomenon is speculative at present, and more work is needed to sort out the prism attachment kinetics at high temperatures." (p.9)
- "The overall trend in sigma_0,prism is well supported by experiments at temperatures below -2 C, while measurements at higher temperatures are more uncertain." (p.9)
- "However, the parameters in Table 1 yield reasonable representations of the available measurements, and we believe that the remaining uncertainties in the details do not greatly affect the model results." (p.9)
- "The evidence suggests that this is an excellent approximation at temperatures above -15 C, although there have been no definitive measurements of the ice ECS at any temperature to date (in our opinion)." (p.4) - the isotropic-surface-energy assumption on which the whole paper rests.
- "Once again, Equation 27 is not meant to be an exact expression, as we made several rather crude approximations regarding the Gibbs-Thomson effect and latent heating." (p.7)
- "We found that the red curves were sensitive to our choice of alpha_therm, meaning that our model of latent heating confirms our expectations that 1) thermal effects can be quite significant, and 2) our model only gives a rough estimate for how heating affects the degree of faceting." (p.10)
- "The main takeaway from these paragraphs is that our basic model of faceting described above will likely overestimate R/r_corner when significant heating is present, while underestimating R/r_corner when particle diffusion is important. However, full 3D diffusion calculations are needed to fully quantify these statements in both cases." (p.8)
- "The minor differences between the crystals in Figures 5 and 6 should not be taken too seriously at this point because the growth conditions and other parameters varied somewhat from crystal to crystal. As described in the figure captions, the crystals have different sizes and growth velocities, plus the initial conditions were not carefully noted at the time." (p.13) - INITIAL CONDITIONS (seed shape) were not recorded.
- "Our model cannot make detailed predictions of R_facet/r_corner for this plate, as we have essentially no measurements of the attachment kinetics at such high temperatures." (p.14)
- "Adding to the mystery, the step energies on prism facets tend toward zero at 0 C for both ice/vapor and ice/liquid. We have postulated a "frustrated" growth model that might explain the observations [2021Lib], but additional work will be needed to fully explain prism faceting in these two systems near the triple point." (p.14)

### 8C. TAX1 (2109.00098v1)

- "Moreover, these images only illustrate qualitative snapshots of crystal morphologies under different growth conditions." (p.13) - the Figure 24 grid is qualitative, by the author's own statement.
- "While our recent model of the attachment kinetics provides a compelling semi-quantitative explanation of the overall temperature structure seen in the Nakaya diagram [2019Lib2, 2020Lib1, 2020Lib2], the overall state of our understanding of the molecular dynamics of ice crystal growth from water vapor remains quite rudimentary." (p.5)
- "Unfortunately, all the 3D computational snow-crystal models presented in the literature to date suffer from two fundamental problems: 1) they all use physically incorrect or incomplete representations of the molecular attachment kinetics, and 2) none has been validated by quantitative comparisons with measurements of laboratory-grown snow crystals created in well-known environments." (p.6)
- "The molecular attachment kinetics are the most difficult aspect of snow crystal growth to model, as several molecular processes act together in subtle and poorly understood ways. Surface premelting, terrace nucleation dynamics, and surface transport effects all contribute to determining the growth rates of faceted ice surfaces." (p.8)
- "Importantly, one can generally assume an isotropic surface energy in snow crystal growth models with little ill effect, because any small anisotropy in the surface energy is completely dwarfed by the enormous anisotropy in the molecular attachment kinetics. This statement has not yet been fully embraced by researchers, but it is supported by substantial experimental and theoretical evidence [2012Lib2]." (p.8) - flagged by the author as contested in the field.
- "Of course, not all prisms develop into double plates, but this does occur over substantial and quite interesting regions of parameter space." (p.9)
- "Moreover, the intrinsic axial symmetry-breaking at the needle tip means that the top and bottom surfaces of the platelike extension grow differently, often yielding one convex and one concave basal surface in the process." (p.10)
- "This two-dimensional (2D) cylindrically symmetrical model used a physically derived parameterization of the attachment kinetics, with the parameters adjusted (within reasonable limits) to fit the experimental data." (p.7) - the Figure 11 agreement is a fit, not a prediction.
- "To date, experimenters have simply not developed the tools needed to make observations that connect well to modeling efforts, yielding both 3D morphologies and growth rates." (p.7)

### 8D. CM10 (2012.12916v1)

- "The A parameter depends on admolecule surface transport and other factors that are difficult to determine accurately." (p.2)
- "Although the functions sigma_0,basal(T) and sigma_0,prism(T) are only known empirically at present, they are related to the terrace step energies, which are fundamental equilibrium properties of the basal and prism surfaces." (p.3)
- "If the ice/vapor ECS is faceted with sharp facet corners (possible, give the paucity of relevant experimental data, but unlikely), then the results presented in this paper would require major modification." (p.5)
- "To my knowledge, D on faceted surfaces is not well known from either experiments or theory, but we can make some rough approximations based on limiting cases." (p.6)
- "Given the substantial uncertainties, we choose D_facet ~= 1 x 10^-7 m^2/sec for a faceted prism surface at -14 C, knowing that this value could easily be off by an order of magnitude or more." (p.7)
- "In this expression, only c_sat and v_th are well known, so rho and tau are quite uncertain." (p.7)
- "Our value for lambda_s is little more than a guess" (p.7)
- "It appears than a rough estimate of x_SD ~= 100 nm is reasonable for a prism facet at -14 C, albeit with a large uncertainty." (p.7) - the single most leveraged parameter in Eq 12, which goes as x_SD^2.
- "Specifically, this basic model assumes essentially constant values of x_SD, D, and tau at all points on the surface, independent of surface structure." (p.8) - the model deliberately ignores the structure dependence SDAK is named for.
- "Although the simple-surface model in the previous section defines the essential physics of how surface-tension-driven surface diffusion can alter the attachment kinetics, this basic picture is too simplistic to explain the observed SDAK phenomenon." (p.9)
- "Unfortunately, it is a challenge to choose realistic estimates of several quantities, and these often come with significant uncertainties. Nevertheless, our rough estimates clearly suggest that edge-related surface diffusion effects could possibly be substantial in size, perhaps enough to explain the SDAK effect to a large degree." (p.11) - hedged three ways in one sentence.
- "Clearly, the physics underlying ice growth from water vapor is complex and rather poorly understood at present, but the outlook for making rapid progress looks good." (p.12)
- One transcription flag raised by the extraction and left unresolved: "Moreover, the two factors cancel to some degree in the diffusion length, with the result that x_SD does change by an extremely large factor with the addition of surface premelting." (p.8) - as printed the sentence appears to be missing a negation; flagged as a possible typographic omission rather than corrected.

### 8E. CM9 (2011.02353v1)

- "There is no theory in condensed-matter physics that provides these parameters from first principles, so the four curves in Figure 1 were all estimated from smoothed experimental data, as is discussed in detail in [2021Lib]." (p.2)
- "Of course, because these model parameters were all derived from measurements, the curves in Figure 1 come with some degree of uncertainty, and not every corner of parameter space has been thoroughly examined by existing experiments." (p.3)
- "For this reason, we will assume that the parameter curves in Figure 1 are essentially perfect, as our focus in this paper is primarily on the basal SDAK effect near -4 C." (p.3)
- "Our understanding of the molecular dynamics of the ice surface is not sufficient to realistically quantify the SDAK-1 effect on the principal facets, or even to roughly estimate the temperatures of the two SDAK dips." (p.4)
- "This is clearly something of an oversimplification" (p.4), and "Although this must be an incomplete formulation of the problem, it gives us a useful starting platform for discussing experimental data." (p.4)
- "Note that it is not possible to fully isolate the different parts of the CAK model using these experimental measurements, because of the inherent difficulty in determining sigma_surf accurately around a growing crystal in air." (p.8)
- "The curves in Figure 2 were rough estimates based on morphological observations and related considerations, without quantitative confirmation." (p.8)
- "The SDAK-2 effect introduces a significant complication in the analysis, however, limiting what can be learned at high sigma_surf." (p.10)
- "A suitable comprehensive numerical model of snow crystal growth has not yet been demonstrated but achieving this goal may be possible in the not-too-distant future" (p.9)

### 8F. CM8 (2009.08404v2)

- "In both cases, smooth curves were drawn as approximate fits to the data, and these curves specify the CAK model." (p.3) - Eqs (2)-(5) are hand-drawn approximate fits; the curves ARE the model definition.
- "These functional forms were chosen solely to provide reasonable fits to the available data." (p.4)
- "Once again, these results apply only to faceted surfaces that are effectively of infinite extent, so they are not affected by edge effects implicit in the SDAK mechanism described below. Moreover, the model assumes that the parameters in Figure 2 are independent of background air pressure." (p.4)
- "With little guidance from molecular theory, the positions and widths of the SDAK dips shown in Figure 4 were judiciously chosen to provide a reasonable explanation for the temperature-dependent behaviors seen in the Nakaya diagram [2021Lib, 2019Lib1]." (p.5) - a fitted postulate, not an independent prediction.
- "While the CAK model, including the SDAK mechanism, contains many speculative features, it appears to be (in my opinion) the only existing model that can reasonably explain this aspect of snow crystal growth while remaining consistent with a substantial body of ice-growth measurements." (p.6)
- "Systematic errors of perhaps a factor of two in sigma_surf may be present using the witness-surface analysis technique for some crystal morphologies" (p.9)
- "There is no way to independently verify the accuracy of this assumption in the current experiment, as strong diffusion effects preclude a direct measurement of sigma_surf with any meaningful accuracy." (p.10)
- "As a result, the uncertainties in the 4% and 2% data points in Figure 12 are quite large." (p.12)
- "As a result, this additional prediction of the CAK model cannot be tested with the measurements presented here." (p.14)
- "While this experimental strategy leads to somewhat model-dependent conclusions, the data nevertheless provide an important test of the overall applicability of the CAK model in snow crystal growth." (p.16)
- "This is true with good accuracy at -5 C [2019Lib2, 2021Lib], but it has not yet been tested thoroughly at other temperatures." (p.16)

### 8G. CM7 (2004.06212v1)

- "While the model is certainly speculative to some degree, so far it seems to be holding up to critical examination using precision ice-growth measurements, and the present paper provides additional confirmation in this regard." (p.1)
- "Thus I assume that both sigma0,basal and A_basal are constant at -2 C, independent of sigma_surf." (p.3) - an assumption justified only by the size of the experimental uncertainties.
- "For the present, therefore, I take A_prism < 1 on large prism facets at higher temperatures to be a largely unexplained empirical fact." (p.4)
- "Although drawn as a well-defined curve in Figure 1, this should be considered as a rough approximation for a poorly understood growth regime. The physical nature of this branch likely has little connection to terrace nucleation theory, in spite of the chosen functional form." (p.4)
- "I speculate that this behavior may be related to the phenomenon of kinetic roughening [1996Sai, 1999Pim, 2002Mut], but that is little more than a guess at this point." (p.4)
- "The transition between these two behaviors has received little study, so the two prism branches overlap in the region 0.1 < sigma_surf < 1 percent. This is meant to indicate that the transition from one curve to the other will happen somewhere in this region, and it may be smooth or abrupt; the exact behavior is not yet constrained by either theory or experiment." (p.4)
- "In particular, I ignore any dependence of the attachment kinetics on background gas pressure (for air and other similarly inert gases), as there is little evidence for gas-related effects in the data." (p.4)
- "Subsequent analysis suggested that these quoted sigma_infinity values from [2008Lib1] were too high by perhaps a factor of two" (p.7)
- "This fact was not sufficiently appreciated in [2008Lib1], and I now believe that the analysis for alpha_basal and alpha_prism in that paper was largely incorrect." (p.7)
- "The physical nature of this behavior is not known at present, but these data clearly indicate that the dendrite tip growth is not well described by the "large prism surfaces" curve in Figure 1." (p.10)
- "The potential for model-dependent systematic errors in this analysis is clearly large, so the low-sigma_surf data point shown in Figure 10 cannot be considered a solid result, even with the large error bars shown." (p.10)
- "It is a somewhat complicated model overall, still not fully developed in spots, and the underlying physics is only partially understood." (p.13)

### 8H. CM6 (1912.03230v1)

- "Our relatively poor understanding of the ice attachment kinetics at present thus reflects our generally poor understanding of the ice surface structure and the complex molecular dynamics that takes place on growing ice/vapor interfaces." (p.2)
- "The narrow-basal-surface curve in Figure 1 is defined by Equation (2) with A_basal = 1 and sigma_0,basal = 0.1%, but this is meant to represent a rough approximation of reality, and even the functional form of this curve is not well known." (p.4)
- "That being said, "narrow" is a somewhat subjective term in this context. The actual value of alpha_basal for a particular crystal may lie anywhere between the two basal curves in Figure 1, depending on the width of the basal surface." (p.4) - alpha_basal bounded only between two curves differing by more than an order of magnitude.
- "While this deficiency renders the model somewhat incomplete and ill-determined, this is the best we can do at present." (p.4)
- "The SDAK model is a novel idea and is certainly not well established at present." (p.4)
- "The prism-kinetic-roughening curve in Figure 1 is little more than a rough guess at present, based mainly on the limited data presented below." (p.5)
- "Clearly the model in Figure 1 is more complicated than one would like, with an uncomfortably large component of speculation as to the relevant physical processes taking place at the basal and prism surfaces under different conditions." (p.5)
- "It is necessary, therefore, to choose which experimental data to accept and which to reject." (p.6) - the data set is curated by the author's judgement.
- "in this paper I assume that background gas pressure (for air and other inert gases) has no direct effect on the ice/vapor attachment kinetics." (p.6)
- "These selected crystals are not representative of the entire sample, however, suggesting that residual substrate interactions may have nucleated higher-than-natural basal growth on many crystals" (p.12)
- "The crystal measurements themselves were somewhat biased as well, selecting well-formed columnar crystals and rejecting blockier morphologies. Columnar crystals were the most likely form observed, but information pertaining to the entire rho_aspect distribution was not recorded." (p.13)
- "In our previous analysis [2009Lib], we assumed that the measured sigma_inf values were correct, but I now believe that the actual supersaturation was somewhat lower." (p.13)
- "Put another way, this is an imperfect data set, but we will try to see what we can learn from it nevertheless." (p.14)
- "There is little theoretical or experimental guidance from which to interpret this observation, so I speculate that alpha_basal remains high in this regime" (p.19)
- "The model is clearly highly speculative in this regime, but it can be considered as perhaps a first step toward understanding the full phenomenon of snow crystal growth dynamics." (p.20)
- "Although the data are limited in many respects, and the data analysis includes numerous caveats and uncertainties, overall I believe that the model does a remarkably good job of explaining the diverse collection of crystal morphologies that appear under different growth conditions at -5 C." (p.21)

### 8I. APP (1912.09440v1)

Collected in section 5A above. The load-bearing ones for parameter provenance: the supersaturation
zero point is fitted per crystal rather than measured (p.9), the analysis process is "necessarily
somewhat subjective" (p.12), the 1.5D model "will give somewhat distorted results for thin plates or
slender columns" (p.9), and no uncertainty is published for the three printed -5 C values (p.11-12).

### 8J. TRIG (2106.09809v1)

- "Unfortunately, the relative paucity of laboratory data does not provide an especially clear picture of how trigonal growth varies with temperature and perhaps nucleation, and there are little data investigating growth as a function of supersaturation." (p.4)
- "Explaining a factor-of-two difference in the attachment coefficients on these surfaces is a nontrivial challenge, however, because the molecular structures of all three of these top prism terraces are identical. This is the crux of the trigonal-growth problem - explaining how ostensibly identical prism surfaces can have markedly different attachment kinetics." (p.9)
- "Developing a comprehensive model of this new 3D SDAK effect is a nontrivial task but hypothesizing its existence to explain the growth of triangular plates at -14 C seems like a reasonable next step" (p.10)
- "As with my previous efforts to understand the CAK model including the SDAK effect, creating an unambiguous molecular model of all the underlying physical processes will likely remain an unsolved problem for many decades." (p.10)
- "A better analysis would require full 3D numerical modeling of this complex structure, which is not yet possible with existing techniques." (p.11)
- "My main conclusion from this example is that a substantial series of quite careful measurements would be required to draw any quantitative conclusions along these lines." (p.13)
- "Understanding this better would thus require a full 3D numerical analysis of the growing crystals, which is not technically possible at present." (p.13)
- "While the chain of events in this model is speculative, it provides at least one plausible mechanism by which triangular and trigonal forms can emerge in a predictable fashion." (p.17)
- "The investigations presented here all focused on trigonal plates growing on ice needles at -14 C, and the ideas presented in this paper are somewhat limited to this experimental circumstance." (p.18)
- "To explain the growth data, I have hypothesized the existence of a second SDAK effect on prism facets at high temperatures, a phenomenon that is, unfortunately, only poorly understood at present." (p.18)

---

## 9. What was NOT covered

An honest statement of the limits of this sweep.

### 9A. Scope limits

1. **Only arXiv preprints were read.** Journal versions of all ten papers were not checked. Where a
   journal version differs in its parameter values, table contents, or equations, this document would
   not know. The specific versions read are the ones listed in the header table (v1 for eight papers,
   v2 for CM8 2009.08404 and for the CM7 file, as recorded).

2. **No figure was digitized.** Section 6 lists 27 digitizable figures. Every one of them is listed
   with its axes described and no value extracted. In particular, the two figures that carry the
   measured SDAK dip curves - CM8 Figure 18 (sigma_0,prism,SDAK(T) from about -8 C to -30 C) and CM9
   Figure 5 (sigma_0,basal,SDAK(T) near -4 C) - exist ONLY as plots. Between them, only three points
   are stated numerically anywhere in the text: 0.85% at -10 C and 6.6% at -25 C (CM8 p.14, p.13),
   and the ratio statement "about one-tenth of its broad-facet value" at -14 C (CM10 p.9). The dip
   depths, widths, and shapes are therefore NOT available as numbers from this sweep.

3. **No closed form for the SDAK dip exists in any of the ten papers.** CM10 p.10 states directly:
   "While it is impossible to calculate such a complex surface behavior as a function of
   temperature". CM6 p.4 states the required functional dependence is undefined: "sigma_0,basal =
   sigma_0,basal(R_basal), where the R_basal dependence is not well defined at present [2015Lib2]".
   No interpolation law between the broad-facet and narrow-facet endpoint values is printed anywhere.

4. **The 2019 monograph itself (arXiv:1910.06389v2), the source of the project's current digitized
   anchors, was not re-read in this sweep.** Several of these papers cite it as [2021Lib] or
   [2019Lib] for the broad-facet parameter curves. Whether the anchors as digitized match what that
   document prints was not checked here.

5. **Several referenced companion data sets were not obtained.** CM7 p.9 and CM6 p.19 both point to
   an image set at "20 different temperatures from -0.5 C to -21 C" in [2019Lib] that is not one of
   these ten papers. CM8 p.14 and CM7 p.7 reference free-fall data sets [2008Lib1], [2009Lib] that
   were only partially reproduced.

6. **No paper in this set gives a numeric aspect-ratio habit threshold that matches the project's
   convention.** The only numeric c/a values found anywhere are the labels inside a diagram
   reproduced from [1961Kob] in TAX1 Figure 7 (p.4): "Very thick plate c/a -> 0.8" and "Solid column
   c/a -> 1.4". CM6 uses rho_aspect = H/R with 1 as the divider and no neutral band. TAX2 prints no
   numeric threshold at all.

7. **No numeric chamber pressure is printed in either Taxonomy paper.** TAX2 and TAX1 describe
   conditions only as "normal air" / "in air". The pressures used elsewhere (one bar in CM8 and TRIG,
   0.03-0.1 bar in CM7 and CM6, 0.08 bar in APP, 50 Torr and 20 Torr in FACET) belong to different
   experiments.

### 9B. Extractions that look thin

- **TAX1 (2109.00098v1)** contains no equations, no attachment-kinetics parameters, no growth-rate
  tables, and no measured aspect ratios. Its extraction is correspondingly light on numbers: the
  quantitative content is seed geometry, chamber geometry, and morphology labels. This is a property
  of the paper, not of the extraction.
- **TRIG (2106.09809v1)** prints no sigma0 and no A anywhere. Its only quantitative kinetics
  statements are a geometric requirement (alpha_prism,tip > 2 alpha_prism,large) and one measured
  facet-velocity ratio (60%). Thin by nature.
- **CM10 (2012.12916v1)** prints no numeric sigma0 or A at all - only the one-tenth ratio. Its
  numbers are all molecular-scale estimates that the author repeatedly labels guesses.
- **APP (1912.09440v1)** is an instrument paper; it contributes exactly three attachment-kinetics
  numbers, all from a single test crystal, all without published uncertainties.
- The **blank-cell count for TAX2 Figure 2** (10 cells) is the one item in this document with no
  printed sentence behind it. It is the count needed to reconcile the 24 x 9 grid with the stated 206
  panels. It was flagged low-consequence by the extraction and was not independently verified.

### 9C. Verification notes

All 381 verified items passed both checks. **No item failed verification.** The verifier attached
substantive notes to the following, which are recorded here because they qualify how a citation
should be read:

- **V1** (index 4, 5): The TAX2 Figure 2 caption is on p.10, but the 24 temperature labels and 9
  supersaturation labels are panel labels on pp.11-14. The verifier re-derived all 33 labels at
  source and confirmed them exactly. Cite p.10 for the caption, pp.11-14 for the axis values.
- **V2** (index 100-105): Same pattern for the TAX1 Figure 24a-e grids - row and column labels are on
  the figure pages themselves.
- **V3** (index 219): "A crystal radius of 10 um" is the last line of CM8 p.16 and "gives alpha_diff
  ~ 0.015..." is the first line of p.17. The sentence straddles the page break.
- **V4** (index 248, 258, 355, 7, 130): Further page-boundary straddles in CM7 p.3/p.4, CM7 p.8/p.9,
  CM6 p.14/p.15, TAX2 p.6/p.7, and CM10 p.4/p.5.
- **V5** (index 357): The composite quote cited to CM6 p.4 spans two pages - the first clause ("Note
  that single-valued functions...") is on **p.3, not p.4**. Both fragments are verbatim accurate and
  all four numbers check out, but the page attribution for the first clause is wrong as originally
  cited. Corrected in section 1A (H10) and section 2A of this document.
- **V6** (index 230): CM8 Eq (3) is transcribed correctly and is genuinely printed on two lines with
  the exponent 1.9 confined to the first line. The verifier independently confirmed the flagged
  arithmetic gap is real: evaluating the printed formula at T* = 25 gives approximately 8.4%, against
  the 9.2% quoted on p.13. The verifier also confirmed the same formula reproduces the printed -10 C
  value and that Eq (2) reproduces the printed -14 C basal value exactly. **The 8.4% figure is the
  verifier's evaluation of a printed formula, not a printed value.**
- **V7** (index 314): The missing minus sign in APP p.11 is real. The verifier re-checked at 3x zoom
  and confirmed the page prints alpha_basal = exp(sigma0,basal/sigma_surf) and alpha_prism = A_prism
  exp(sigma0,prism/sigma_surf) with **no minus sign in either exponent**, in contrast to CM7 Eq (2),
  CM6 Eq (2), CM8 Eq (1), CM9 Eq (1), CM10 Eq (1) and FACET Eq (3), which all print the minus.
  Reported as printed; not corrected.
- **V8** (index 292): Confirmed independently that APP p.11 prints alpha_basal with no prefactor
  while alpha_prism carries an explicit A_prism - the asymmetry is in the source.
- **V9** (index 227): CM8 p.5 genuinely places the basal SDAK dip "near -5 C", which the verifier
  noted differs from the companion papers' "near -4 C" (CM10 p.4, CM9 p.7). This is a real
  disagreement between papers, not a transcription error.
- **V10** (index 220, 348, 380): In three cases part of a stated value came from a page adjacent to
  the quoted sentence rather than from the sentence itself - the "normal air" gloss on CM8 p.7 (the
  caption says "filtered laboratory air at a pressure one bar"), the "with alpha_basal ~= 1" clause
  on CM6 p.20 (supported by the preceding sentence), and the facet-width clause on TRIG p.12
  (supported by p.6 and p.10). All three underlying claims are accurate; the quote does not carry
  them alone.
- **V11** (index 366, 379, 211, 202, 134, 351): Several quotes reproduce the papers' own typographic
  errors, correctly: "as is observed above below sigma_inf = 8%" (TRIG p.16), "as is broad-facet
  neighbors" (TRIG p.17), "the ratio of prism to basal growth rates to about 10:1" (CM8 p.12),
  "yields as small reduction" (CM8 p.14), "It appears than a rough estimate" (CM10 p.7), and
  "polynucleation" as one word in CM6 p.3.

### 9D. What was not verified

The verifier re-opened 381 high-consequence items. The following categories were **not** verified and
rest on the single-agent extraction alone:

- **No caveat or limitation quote was verified.** All of section 8, and the caveat quotes used in
  sections 3, 5 and 7, come from the extraction pass only.
- **No figure description was verified.** All of section 6 - axes, ranges, curve labels, data-point
  counts - rests on the extraction pass only.
- **Lower-consequence parameters were not verified**, including most of the TAX1 morphology labels,
  the FACET geometric constants (G0, G1, S), the CM10 molecular-scale estimates beyond the ones
  listed in the flagged set, and the APP apparatus dimensions.
- The **TAX2 blank-cell count** was not verified (see 9B).
