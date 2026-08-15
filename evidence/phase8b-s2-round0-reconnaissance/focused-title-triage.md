# Focused discovery title triage — offline reconnaissance

Status: **reconnaissance only; not a formal terminal source disposition**. This artifact screens the already captured lead metadata. It does not open source full text, search the web, download files, adjudicate S3 eligibility, or close the bounded-open focused search.

## Inputs and integrity

| Input | Rows / role | SHA-256 |
|---|---:|---|
| `/Volumes/snowcrystal/research-cache/phase8b-search/focused-discovery-20260811-v1/private-leads.jsonl` | 538 captured lead rows | `2c28188d6b9219b4286e77bc0142590c83453b504e242e64a26c8bd9c0116331` |
| `/Volumes/snowcrystal/research-cache/phase8b-search/focused-discovery-20260811-v1/run-report.json` | focused discovery run report | `a8eb7db70b734a95f09106062bde02e51bd8eb506cf0b463f8cf05d85dd40988` |
| `/Users/clipper/github/snowflake-phase8/evidence/phase8b-local-denominator/source-containers.jsonl` | 23 local source containers | `3f12256918c845cdf2f44a9029dc01ab06c774f7ac1df11e33d3667f8ef23106` |
| `/Users/clipper/github/snowflake-phase8/evidence/phase8b-s2-round0-reconnaissance/source-register.jsonl` | 28 acquired source records | `3590804a3943bbe1594d6ec1feec58c45182d4f79cfc10b3c94d1f7ac068476f` |
| `/Users/clipper/github/snowflake-phase8/evidence/phase8b-s2-round0-reconnaissance/local-acquired-reconciliation.md` | inventory identity crosswalk | `a097899a0570b495f0cf3badd95ffca29cee9e3e5de09db0bd059704c41cc858` |

Companion JSONL: `/Volumes/snowcrystal/research-cache/phase8b-search/offline-title-triage-20260811-v1/focused-title-triage.jsonl`; SHA-256 `e08923b4d636c86099eb33682d8d0bb654c461b26a2d09dfc2e1f900c8700e89` (439828 bytes, 513 records).

Two captured titles contained project qualification-sensitive terminology. Their displayed title text is redacted at the token level; `titleSha256` preserves an exact fingerprint of the captured title without reproducing the token. All other titles are decoded only for common captured entities and literal line-break escapes.

## Accounting

- 538 captured rows collapse to 513 exact identifiers: 507 openalex and 6 cinii.
- OpenAlex: 531 rows collapse to 507 exact work identifiers.
- CiNii: 7 rows collapse to 6 CRID locators; CRIDs are kept because no OpenAlex identifier was captured for those rows.
- 25 duplicate rows were removed. 23 identifiers carry multiple query memberships; 21 have two and 2 have three. Maximum memberships: 3.
- Eight DOI groups contain more than one exact OpenAlex identifier. Those identifiers are intentionally not merged because the requested deduplication key is OpenAlex identifier.
- 30 OpenAlex identifiers match 28 inventory records: 12 IDs across 11 of 23 local containers and 18 IDs across 17 of 28 acquired records.
- All 538 original memberships and positions are retained in `queryMemberships`, together with each captured raw-response hash and the one-based source row ordinal.

### Captured query memberships

| Query | Rows |
|---|---:|
| `snow-growth` | 233 |
| `ice-sublimation` | 139 |
| `ice-growth-supersaturation` | 100 |
| `artificial-snow` | 59 |
| `habit-growth-ja` | 4 |
| `artificial-snow-ja` | 2 |
| `facet-rate-ja` | 1 |

The `ice-growth-supersaturation` query remains bounded-open: the run report records 582 expected results but only 100 retained rows because the focused precision cap was exceeded. This triage cannot close that search.

### Conservative dispositions

| Disposition | Unique identifiers |
|---|---:|
| `clearly-out-of-scope` | 306 |
| `needs-metadata-or-fulltext` | 141 |
| `likely-eligible-primary` | 36 |
| `known-local-or-acquired` | 30 |

`clearly-out-of-scope` is used only when the title explicitly names an excluded process, non-measurement genre, bulk/remote-sensing focus, snowpack/firn/sea-ice process, engineering application, modeling-only work, or unrelated material/domain. Ambiguous titles remain `needs-metadata-or-fulltext`; neither category is a formal S3 terminal decision.

### Reason codes

| Reason code | Unique identifiers |
|---|---:|
| `title-explicit-engineering-or-unrelated-material-domain` | 76 |
| `title-ambiguous-primary-content-or-target-observable` | 71 |
| `title-explicit-bulk-remote-sensing-cloud-or-transport-focus` | 57 |
| `title-explicit-theory-model-or-simulation-only` | 50 |
| `title-explicit-snowpack-firn-or-sea-ice-process` | 38 |
| `known-inventory-identity-match` | 30 |
| `title-explicit-secondary-or-administrative-genre` | 30 |
| `title-explicit-excluded-growth-process` | 25 |
| `title-explicit-unrelated-domain` | 23 |
| `title-measurement-like-but-eligibility-ambiguous` | 21 |
| `title-relevant-but-primary-measurement-or-target-unclear` | 9 |
| `metadata-title-missing` | 7 |
| `title-relevant-growth-but-primary-content-unspecified` | 4 |
| `title-relevant-growth-process-but-primary-content-unspecified` | 4 |
| `title-mixed-measurement-and-model-content` | 3 |
| `title-explicit-artificial-snow-growth-experiment` | 2 |
| `title-explicit-controlled-growth-observation-apparatus` | 2 |
| `title-explicit-controlled-natural-cloud-growth-investigation` | 2 |
| `title-explicit-growing-and-ablating-crystal-observation` | 2 |
| `title-explicit-growth-morphology-measurement` | 2 |
| `title-explicit-growth-rate-response-measurement` | 2 |
| `title-explicit-quantitative-growth-study` | 2 |
| `title-explicit-vapor-growth-measurement-apparatus` | 2 |
| `title-natural-crystal-observation-but-growth-trajectory-unspecified` | 2 |
| `title-relevant-growth-mechanism-but-primary-content-unspecified` | 2 |
| `title-relevant-mechanism-but-primary-content-unspecified` | 2 |
| `non-english-title-needs-review` | 1 |
| `title-abstract-relevant-sublimation-ambiguous-measurement` | 1 |
| `title-artificial-snow-method-but-vapor-growth-scope-unclear` | 1 |
| `title-conditionless-static-imaging` | 1 |
| `title-controlled-ice-healing-but-specimen-scope-unclear` | 1 |
| `title-controlled-sublimation-but-specimen-scope-unclear` | 1 |
| `title-explicit-controlled-cloud-chamber-growth` | 1 |
| `title-explicit-controlled-growth-chamber-study` | 1 |
| `title-explicit-controlled-ice-deposition-experiment` | 1 |
| `title-explicit-controlled-vapor-growth-comparison` | 1 |
| `title-explicit-controlled-vapor-growth-experiment` | 1 |
| `title-explicit-controlled-vapor-growth-observation` | 1 |
| `title-explicit-fall-pattern-focus` | 1 |
| `title-explicit-frost-engineering` | 1 |
| `title-explicit-growth-condition-observation` | 1 |
| `title-explicit-growth-morphology-observation` | 1 |
| `title-explicit-growth-observation` | 1 |
| `title-explicit-growth-structure-observation` | 1 |
| `title-explicit-habit-supersaturation-study` | 1 |
| `title-explicit-habit-temperature-observation` | 1 |
| `title-explicit-in-situ-vapor-growth-observation` | 1 |
| `title-explicit-natural-cloud-crystal-observation` | 1 |
| `title-explicit-natural-crystal-growth-investigation` | 1 |
| `title-explicit-natural-crystal-habit-classification` | 1 |
| `title-explicit-nucleation-only` | 1 |
| `title-explicit-physical-growth-investigation` | 1 |
| `title-explicit-polycrystalline-artificial-snow-study` | 1 |
| `title-explicit-secondary-summary` | 1 |
| `title-explicit-substrate-confounded-growth-observation` | 1 |
| `title-explicit-supercooled-fog-crystal-observation` | 1 |
| `title-explicit-surface-frost` | 1 |
| `title-explicit-surface-hoar` | 1 |
| `title-growth-experiment-but-target-observable-unclear` | 1 |
| `title-natural-cloud-crystals-but-growth-trajectory-unspecified` | 1 |
| `title-natural-cloud-habits-but-growth-trajectory-unspecified` | 1 |
| `title-natural-crystal-distribution-but-growth-trajectory-unspecified` | 1 |
| `title-natural-crystal-morphology-but-growth-conditions-unspecified` | 1 |
| `title-natural-snow-particle-observation-but-growth-trajectory-unspecified` | 1 |
| `title-relevant-apparatus-measurement-content-unspecified` | 1 |
| `title-relevant-growth-diagram-but-primary-content-unspecified` | 1 |
| `title-relevant-ice-habit-but-primary-content-unspecified` | 1 |
| `title-relevant-morphology-but-growth-conditions-unspecified` | 1 |
| `title-relevant-techniques-measurement-content-unspecified` | 1 |

## High-priority likely primary leads

These titles explicitly signal controlled or natural-cloud individual-crystal growth/sublimation observations or measurements and do not match the known inventories. Full text is still required before eligibility is formal.

- `W2601053678` — Experimental Researches en the Snow Crystal Habit and Growth by Means of a Diffusion Cloud Chamber — `title-explicit-controlled-vapor-growth-experiment`
- `W337392655` — Preliminary Investigation on the Growth of Natural Snow Crystals by the Use of Observation Points Distributed Vertically — `title-explicit-controlled-natural-cloud-growth-investigation`
- `W1557490663` — Investigation on the Growth and Distribution of Natural Snow Crystals by the Use of Observation Points Distributed Vertically, 3 — `title-explicit-controlled-natural-cloud-growth-investigation`
- `W134960406` — The Growth of Ice Crystals on Covellite and Lead Iodide Surfaces — `title-explicit-substrate-confounded-growth-observation`
- `W2313829578` — On snow crystals of double plate type grown from ice fragments — `title-explicit-controlled-vapor-growth-observation`
- `W189221337` — The Efect of Nucleation on the Morphology of Snow Crystals in Low Temperature Conditions — `title-explicit-growth-morphology-observation`
- `W2031320729` — Measurement of acidic ions and their qualitative effects on snow crystal morphology and the quasi-liquid layer — `title-explicit-growth-morphology-measurement`
- `W4239209806` — Scanning electron microscopy and molecular dynamics of surfaces of growing and ablating hexagonal ice crystals — `title-explicit-growing-and-ablating-crystal-observation`
- `W2141483979` — Gas phase acetic acid and its qualitative effects on snow crystal morphology and the quasi-liquid layer — `title-explicit-growth-morphology-measurement`
- `W2094566660` — Scanning electron microscopy and molecular dynamics of surfaces of growing and ablating hexagonal ice crystals — `title-explicit-growing-and-ablating-crystal-observation`
- `W1934403559` — An Improved Apparatus For Measuring the Growth of Ice Crystals from Water Vapor — `title-explicit-vapor-growth-measurement-apparatus`
- `W4300588786` — An Improved Apparatus For Measuring the Growth of Ice Crystals from Water Vapor — `title-explicit-vapor-growth-measurement-apparatus`
- `W2110205889` — An experimental apparatus for observing deterministic structure formation in plate-on-pedestal ice crystal growth — `title-explicit-controlled-growth-observation-apparatus`
- `W4295007066` — An experimental apparatus for observing deterministic structure formation in plate-on-pedestal ice crystal growth — `title-explicit-controlled-growth-observation-apparatus`
- `W2895180669` — <i>In Situ</i> Observation of Ice Formation from Water Vapor by Environmental SEM — `title-explicit-in-situ-vapor-growth-observation`
- `W2937887554` — Air pockets and secondary habits in ice from lateral-type growth — `title-explicit-growth-structure-observation`
- `W326276796` — On the Variation of Ice Crystal Habit with Temperatur — `title-explicit-habit-temperature-observation`
- `W2606380217` — Observation of Ice Crystals in Supercooled Fog — `title-explicit-supercooled-fog-crystal-observation`
- `W2605962384` — A High-Pressure Cold Chamber for the Study of Ice Crystal Growth in Compressed Gases — `title-explicit-controlled-growth-chamber-study`
- `W1680421573` — Comparison of Ice Crystals Grown from Vapour in Varying Conditions — `title-explicit-controlled-vapor-growth-comparison`
- `W2073044190` — A quantitative study on the growth law of ice crystals — `title-explicit-quantitative-growth-study`
- `W2322865507` — The quantitative growth law of ice crystals and its new model — `title-explicit-quantitative-growth-study`
- `W2103143552` — Influence of the ice growth rate on the incorporation of gaseous HCl — `title-explicit-growth-rate-response-measurement`
- `W4213470615` — Influence of the ice growth rate on the incorporation of gaseous HCl — `title-explicit-growth-rate-response-measurement`
- `W39507338` — Isotopic fractionation of water during snow formation: Experimental evidence of kinetic effect — `title-explicit-controlled-ice-deposition-experiment`
- `W54609748` — Preliminary Experiments on the artificial Production of Snow Crystals — `title-explicit-artificial-snow-growth-experiment`
- `W274853005` — Further Experiments on the artificial Production of Snow Crystals — `title-explicit-artificial-snow-growth-experiment`
- `W406227534` — Physical Investigations on the Growth of Snow Crystals — `title-explicit-physical-growth-investigation`
- `W327194476` — Investigation on the Growth and Distribution of Natural Snow Crystals, 4 — `title-explicit-natural-crystal-growth-investigation`
- `W147959768` — An Observation of Snow Crystals and Their Mother Cloud : (Investigation of Natural Snow Crystals 5) — `title-explicit-natural-cloud-crystal-observation`
- `W145469896` — Meteorological Classification of Natural Snow Crystals — `title-explicit-natural-crystal-habit-classification`
- `W2607494835` — On the Meteorological Conditions for the Growth of Snow Crystals in Colder Temperature Regions, as Revealed by Radiosonde Data in the Antarctica — `title-explicit-growth-condition-observation`
- `W1990582826` — Snow Crystal Habit at Small Excesses of Vapor Density over Ice Saturation — `title-explicit-habit-supersaturation-study`
- `W2405107208` — Ice Crystals Grown in an Unforced Air Flow Cloud Chamber — `title-explicit-controlled-cloud-chamber-growth`
- `W7146399719` — 多結晶雪の研究(第1報)-巨大多結晶人工雪について- — `title-explicit-polycrystalline-artificial-snow-study`
- `W2049697144` — Observation of ice crystal growth — `title-explicit-growth-observation`

## High-priority needs-review leads

These are the most domain-relevant ambiguous titles, measurement-like titles with unclear target observables, and title-missing records. They are intentionally retained rather than excluded from title alone.

- `W4243645988` — An Electron Microscope Study of Snow Crystal Nuclei — `title-relevant-but-primary-measurement-or-target-unclear`
- `W2605800981` — Observation of Snow Crystals in the Lower Atmosphere of Arctic Canada by Means of "Snow Crystal Sondes" — `title-measurement-like-but-eligibility-ambiguous`
- `W2041823995` — Scavenging of SO2 and HCl during growth of ice crystals by vapour diffusion — `title-growth-experiment-but-target-observable-unclear`
- `W2172974053` — Snow Crystal Habit Changes Explained by Layer Nucleation — `title-relevant-but-primary-measurement-or-target-unclear`
- `W2018136386` — Ventilation Coefficients for Falling Ice Crystals in the Atmosphere at Low–Intermediate Reynolds Numbers — `title-ambiguous-primary-content-or-target-observable`
- `W2144515200` — Morphogenesis on Ice: The Physics of Snow Crystals — `title-relevant-but-primary-measurement-or-target-unclear`
- `W1661954427` — Instability of quasi-liquid on the edges and vertices of snow crystals — `title-ambiguous-primary-content-or-target-observable`
- `W2123939692` — The physics of snow crystals — `title-relevant-but-primary-measurement-or-target-unclear`
- `W1660827291` — Investigation of the effects of topography on Colorado Front Range winter storms, An — `title-measurement-like-but-eligibility-ambiguous`
- `W2463686276` — The enigmatic snowflake — `title-relevant-but-primary-measurement-or-target-unclear`
- `W3008055135` — Measurement and modelling of snow properties in urban and suburban Montreal neighbourhoods — `title-mixed-measurement-and-model-content`
- `W619121951` — An Edge-Enhancing Crystal Growth Instability Caused by Structure-Dependent Attachment Kinetics — `title-relevant-mechanism-but-primary-content-unspecified`
- `W4297823067` — An Edge-Enhancing Crystal Growth Instability Caused by Structure-Dependent Attachment Kinetics — `title-relevant-mechanism-but-primary-content-unspecified`
- `W2329157121` — Experimental determination of the absorption enhancement parameter of snow — `title-measurement-like-but-eligibility-ambiguous`
- `W4247404030` — Experimental determination of the absorption enhancement parameter of snow — `title-measurement-like-but-eligibility-ambiguous`
- `1390574798847629312.rdf` — [title missing] — `metadata-title-missing`
- `1541135670276581376.rdf` — [title missing] — `metadata-title-missing`
- `W2228425257` — Experimental Applied Mathematics — `title-measurement-like-but-eligibility-ambiguous`
- `W2317337186` — Analysis of local ice crystal growth in snow — `title-ambiguous-primary-content-or-target-observable`
- `W2595010123` — Physical Dynamics of Ice Crystal Growth — `title-relevant-growth-but-primary-content-unspecified`
- `W3040030638` — Experimental study of carbon dioxide desublimation and sublimation process on low temperature surface — `title-measurement-like-but-eligibility-ambiguous`
- `W3027464895` — Surface phase transitions and crystal habits of ice in the atmosphere — `title-relevant-ice-habit-but-primary-content-unspecified`
- `W3125701811` — How ice grows from premelting films and water droplets — `title-relevant-growth-process-but-primary-content-unspecified`
- `W3121058787` — How ice grows from premelting films and water droplets — `title-relevant-growth-process-but-primary-content-unspecified`
- `W3173833243` — Experimental particle’s shapes reconstructions from their interferometric images using the Error-Reduction algorithm — `title-measurement-like-but-eligibility-ambiguous`
- `W3212218352` — Self-Healing Behavior of Ice — `title-controlled-ice-healing-but-specimen-scope-unclear`
- `W3215382188` — Design and preliminary experiment of snow making environment simulator — `title-measurement-like-but-eligibility-ambiguous`
- `W4293581083` — Investigation of the Behaviour of Supercooled Droplets Concerning Evaporation, Sublimation and Freezing Under Different Boundary Conditions — `title-measurement-like-but-eligibility-ambiguous`
- `W4205181732` — Scratch-Healing Behavior of Ice by Local Sublimation and Condensation — `title-controlled-sublimation-but-specimen-scope-unclear`
- `W4293767281` — Revisiting Diagrams of Ice Growth Environments — `title-relevant-growth-diagram-but-primary-content-unspecified`
- `W4388190544` — An Experimental Investigation on the Size Distribution of Snow Particles during Artificial Snow Making — `title-measurement-like-but-eligibility-ambiguous`
- `W4404505951` — How the Glaishers pictured snowflakes — `title-ambiguous-primary-content-or-target-observable`
- `W4402646485` — Multiscale modeling of heat and mass transfer in dry snow: influence of the condensation coefficient and comparison with experiments — `title-mixed-measurement-and-model-content`
- `W7165535058` — Bridging Observation and Modeling: Classroom Design Using Snow Crystal Growth Experiments and Excel-Based Simulations — `title-mixed-measurement-and-model-content`
- `W7167905649` — The Polymorphism of Snow Crystals: Advances in Understanding Vapor-Phase Ice Growth Dynamics via a Tripartite Coupling Framework — `title-measurement-like-but-eligibility-ambiguous`
- `1390001206504043136.rdf` — [title missing] — `metadata-title-missing`
- `W2605854436` — Ice Crystal Growth in the Atmosphere — `title-relevant-growth-but-primary-content-unspecified`
- `W3162814883` — Positive and negative-ion chemistry of the D-region incorporating enhanced water vapor and submicron dust — `title-ambiguous-primary-content-or-target-observable`
- `W2606796419` — Properties of Diamond Dust Type Ice Crystals Observed in Summer Season at Amundsen-Scott South Pole Station, Antarctica — `title-natural-cloud-crystals-but-growth-trajectory-unspecified`
- `W336853465` — Ice forming experiment — `title-measurement-like-but-eligibility-ambiguous`
- `W2477263179` — Three-Dimensional Structure of Plate-like Snow Crystals — `title-relevant-morphology-but-growth-conditions-unspecified`
- `W2490384899` — Rate Determining Processes of Growth of Ice Crystals from the Vapour Phase — `title-relevant-growth-process-but-primary-content-unspecified`
- `W2464072136` — Rate Determining Processes of Growth of Ice Crystals from the Vapour Phase — `title-relevant-growth-process-but-primary-content-unspecified`
- `W1624659788` — Experiments on Thermal Convection in Snow — `title-measurement-like-but-eligibility-ambiguous`
- `W4237172970` — Experiments on Thermal Convection in Snow — `title-measurement-like-but-eligibility-ambiguous`
- `W2891898754` — Distribution of liquid, vapor and ice in a phase budget of a Colorado orographic cloud system — `title-ambiguous-primary-content-or-target-observable`
- `W1560612574` — Ice Crystal Breeding — `title-relevant-growth-but-primary-content-unspecified`
- `W7172187826` — A geochemical and mineralogical investigation of calcite growth and its interactions with divalent cadmium, manganese, and zinc / — `title-measurement-like-but-eligibility-ambiguous`
- `W1998385648` — Ice particle habits in Arctic clouds — `title-natural-cloud-habits-but-growth-trajectory-unspecified`
- `W2172514146` — Radiative Effects on the Diffusional Growth of Ice Particles in Cirrus Clouds — `title-relevant-but-primary-measurement-or-target-unclear`
- `W2087839323` — Water vapor in the pore space of snow — `title-ambiguous-primary-content-or-target-observable`
- `W1670688617` — Observed microphysical and radiative structure of mid-level, mixed-phase clouds — `title-measurement-like-but-eligibility-ambiguous`
- `W4232657868` — Experimental investigation of homogeneous freezing of sulphuric acid particles in the aerosol chamber AIDA — `title-measurement-like-but-eligibility-ambiguous`
- `W2158137897` — Experimental investigation of homogeneous freezing of sulphuric acid particles in the aerosol chamber AIDA — `title-measurement-like-but-eligibility-ambiguous`
- `W1597844733` — Evaporation Decay Organic Nucleus of ice Particle — `title-ambiguous-primary-content-or-target-observable`
- `W2162058945` — Incidence of rough and irregular atmospheric ice particles from Small Ice Detector 3 measurements — `title-measurement-like-but-eligibility-ambiguous`
- `W2113666079` — The Ice Selective Inlet: a novel technique for exclusive extraction of pristine ice crystals in mixed-phase clouds — `title-ambiguous-primary-content-or-target-observable`
- `W2159281783` — Transport of Antarctic stratospheric strongly dehydrated air into the troposphere observed during the HALO-ESMVal campaign 2012 — `title-measurement-like-but-eligibility-ambiguous`
- `W4239358896` — Low-Temperature Triple-Capillary Cryostat for Ice Crystal GrowthStudies — `title-relevant-apparatus-measurement-content-unspecified`
- `W4385455692` — Microanalysis Techniques to Study Atmospheric Ice Nucleation and Ice Crystal Growth — `title-relevant-techniques-measurement-content-unspecified`
- `1390001206461789568.rdf` — [title missing] — `metadata-title-missing`
- `1390001206503882880.rdf` — [title missing] — `metadata-title-missing`
- `1390282681479918464.rdf` — [title missing] — `metadata-title-missing`
- `W7126096550` — Experimental Study on the Influence of Different Loading Weights and Placement Forms on Vacuum Sublimation–Rehydration Thawing of Large Yellow Croaker — `title-measurement-like-but-eligibility-ambiguous`
- `W2625217225` — Formation of snow crystals — `title-relevant-growth-but-primary-content-unspecified`
- `W210744847` — Snow Crystals. Ukichiro Nakaya. Harvard University Press, 1954, 510 pages, 514 text-figures, 188 plates. $10.00. — `title-ambiguous-primary-content-or-target-observable`
- `W4240771579` — Snow Crystals. Ukichiro Nakaya. Harvard University Press, 1954, 510 pages, 514 text-figures, 188 plates. $10.00. — `title-ambiguous-primary-content-or-target-observable`
- `W7711265` — Etching of Ice Crystals by the Use of Plastic Replica Film — `title-relevant-but-primary-measurement-or-target-unclear`
- `W56497181` — Snow Crystals Observed at Mauna Loa — `title-natural-crystal-observation-but-growth-trajectory-unspecified`
- `W4213108445` — Snow Crystals Observed at Mauna Loa — `title-natural-crystal-observation-but-growth-trajectory-unspecified`
- `W2093175629` — SNOW CRYSTALS AND THE IDENTIFICATION OF THE NUCLEI IN THE NORTHERN UNITED STATES OF AMERICA — `title-ambiguous-primary-content-or-target-observable`
- `W4233499832` — Horizontal Distribution of Snow Crystals during the Snowfall (II) — `title-natural-crystal-distribution-but-growth-trajectory-unspecified`
- `W296318558` — Unknown and Peculiar Shapes of Snow Crystals Observed at Syowa Station, Antarctica — `title-natural-crystal-morphology-but-growth-conditions-unspecified`
- `W2325309416` — Observation of Snow Particles at Hidden Valley, Mukut Himal — `title-natural-snow-particle-observation-but-growth-trajectory-unspecified`
- `W2515031294` — [title missing] — `metadata-title-missing`
- `W10966329` — Formation Mechanisms of Snow Crystals at Low Temperature — `title-relevant-growth-mechanism-but-primary-content-unspecified`
- `W4253629423` — Formation Mechanisms of Snow Crystals at Low Temperature — `title-relevant-growth-mechanism-but-primary-content-unspecified`
- `W614031926` — Evaporation of snow crystals and snowflakes (abstract) — `title-abstract-relevant-sublimation-ambiguous-measurement`
- `W2011299546` — A new method for producing artificial snow crystals using a mixture of salt and ice — `title-artificial-snow-method-but-vapor-growth-scope-unclear`
- `W3092091242` — Atomic force microscopy of rearranging ice surfaces — `title-relevant-but-primary-measurement-or-target-unclear`

## Same-DOI OpenAlex aliases retained

- `10.48550/arxiv.1109.1511`: `W1934403559`, `W4300588786`
- `10.48550/arxiv.1111.2786`: `W1811312046`, `W4300426578`
- `10.48550/arxiv.1201.1802`: `W2962810457`, `W4311896933`
- `10.48550/arxiv.1209.4932`: `W619121951`, `W4297823067`
- `10.48550/arxiv.1503.01019`: `W2110205889`, `W4295007066`
- `10.48550/arxiv.1509.08543`: `W2225289029`, `W4295327917`
- `10.48550/arxiv.2106.09809`: `W4287117326`, `W3175151251`
- `10.48550/arxiv.2109.01253`: `W4213471082`, `W4213403103`

Two alias groups point to one known inventory work each; the other six are not collapsed or identity-adjudicated here.

## Method and limits

- Grouping key: exact captured identifier. OpenAlex work URLs are deduplicated by work identifier; CiNii locators are deduplicated by exact CRID because no OpenAlex mapping was captured.
- Known-source matching used canonical DOI/arXiv roots or conservative normalized-title identity against the 23 local containers, 28 acquired records, and the existing reconciliation crosswalk. No author/year-only, filename-only, substring, or general fuzzy match was accepted.
- Screening used captured title, date, DOI, provider, query membership, and position only. It did not inspect abstracts, citations, full text, supplements, data, corrections, lineage, units, rights, or source currency.
- A title can only support a conservative routing judgment. `likely-eligible-primary` is not inclusion; `clearly-out-of-scope` is not a terminal exclusion; and `known-local-or-acquired` says only that an inventory identity match exists.
- Non-English or missing titles are never excluded for language or absence. Missing titles route to metadata/full-text review.
- Search completeness remains unresolved for the bounded-open focused query and for any broader systematic search work.
