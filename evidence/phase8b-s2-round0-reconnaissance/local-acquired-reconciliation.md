# Phase 8B offline reconciliation: acquisition-audit v2 versus frozen local denominator

Date: 2026-08-11. This is a read-only, offline set reconciliation. It compares the 28 PDFs in `acquisition-audit-20260811-v2/pdf-register.jsonl` with the 23 frozen containers in `evidence/phase8b-local-denominator/source-containers.jsonl`, and additionally checks the 34 regular members of the two local ZIP containers from `source-units.jsonl`. Similar scientific subject matter was not treated as duplication.

## Result

| Question | Result |
|---|---:|
| Acquired PDF records | 28 |
| Frozen local source containers | 23 (21 PDFs + 2 ZIPs) |
| Local ZIP regular members additionally checked | 34 |
| Exact acquired-PDF ↔ local-container byte matches | **0** |
| Exact acquired-PDF ↔ local-archive-member byte matches | **0** |
| Probable same-work bibliographic overlaps in different versions | **0** |
| Acquired-only after exact and bibliographic reconciliation | **28** |
| Local-container-only after exact and bibliographic reconciliation | **23** |

The two sets are disjoint at both the exact-byte level and the identified-work level. This does **not** assert scientific independence: papers can cite, summarize, replot, or reuse data from other papers without being bibliographic duplicates.

## Evidence and comparison rules

- Manifest pins: acquisition register SHA-256 `9b0a52e66c4c4a203c14df531bce29ab831bf3bf0bdb419a88313c3c457d5e51`; frozen source-container register SHA-256 `3f12256918c845cdf2f44a9029dc01ab06c774f7ac1df11e33d3667f8ef23106`; frozen source-unit register SHA-256 `d806c220c6057eb0d80b44458c185acc61d25b9c7be6495e5c57f2a038a41178`.
- All 28 acquired live PDFs were rehashed against acquisition-audit v2: 28 checked, 0 mismatches. All 23 live local containers were rehashed against the frozen register: 23 checked, 0 mismatches.
- Joining the two manifests on full SHA-256 yielded zero matches. Joining acquired PDF SHA-256 values to all 34 archive-member `contentSha256` values also yielded zero. As a supporting negative check, there were zero equal-byte-length pairs in either join; byte length was not itself used to establish identity.
- Bibliographic reconciliation used the verified citations already recorded for all 28 acquired PDFs, the 13 exact arXiv identifiers in the local register, title-page text for the remaining local PDFs, and exact archive identity/member descriptions for the ZIPs. A same author, nearby year, shared series, shared experimental lineage, or similar title was not sufficient.

## Exact duplicates

None. No acquired PDF has the same SHA-256 as a frozen local PDF/ZIP container or any frozen archive member.

## Probable bibliographic overlaps with different bytes or versions

None found. There is no repeated root DOI, arXiv identifier, or exact normalized title across the acquired and local sets.

The strongest superficial candidates were checked and rejected as different works:

- **Libbrecht series:** acquired `libbrecht-2013-attachment-kinetics.pdf` is arXiv `1302.1231v1`, *Toward a Comprehensive Model ... 2. Structure Dependent Attachment Kinetics near -5 C*. Local `1211.5555v1.pdf` is series paper 1, *Overarching Features and Physical Origins*; local `1912.03230v1.pdf` is series paper 6, *Ice Attachment Kinetics near -5 C*. Their identifiers, titles, page counts, and bytes differ. The other acquired Libbrecht roots (`0811.2994`, `0912.2518`, `1111.2786`, `1602.08528`) are likewise absent from the 13 local arXiv roots.
- **Nelson works:** acquired `nelson-2019-lateral-facet-growth.pdf`, DOI `10.5194/acp-19-15285-2019`, is *Lateral facet growth of ice and snow – Part 1*. Local `nelson-1998-soic-author-copy.pdf` is *Sublimation of Ice Crystals*. Same author/topic, different works.
- **Recent cloud/data records:** acquired Fuchs et al. (2025), *Quantifying ice crystal growth rates in natural clouds from glaciogenic cloud seeding experiments*, DOI `10.5194/acp-25-12177-2025`, is not the local `harrington-pokrifka-2026.zip` data/code companion or the local `harrison-2016.zip` levitation dataset; authors, titles, identifiers, contents, and bytes differ.
- **Takahashi-derived archive members:** `harrington-pokrifka-2026.zip` contains CSV data explicitly extracted from Takahashi (1991), but the acquired set contains no Takahashi 1991 PDF. This is a local lineage relation, not an acquired/local duplicate.

## Acquired-only inventory (28)

Each row is absent from the frozen local container identities and archive-member hashes.

| Acquired PDF | Verified work identity | SHA-256 |
|---|---|---|
| `cloud-growth-2025.pdf` | Fuchs et al. (2025), *Quantifying ice crystal growth rates in natural clouds from glaciogenic cloud seeding experiments*; DOI `10.5194/acp-25-12177-2025` | `5b3d8f99ebfc602d7dbfdc8042198b6c368616f5f2d281f8a55e0389d557a7f6` |
| `colbeck-1983-low-supersaturation-high-temperature.pdf` | Colbeck (1983), *Ice crystal morphology and growth rates at low supersaturations and high temperatures*; DOI `10.1063/1.332290` | `31153c8d4f48de26080d14526212a58ee1ceec8f52978dde2ee35ac3fd73a2b5` |
| `demmenie-et-al-2018-singular-sublimation.pdf` | Jambon-Puillet et al. (2018), *Singular sublimation of ice and snow crystals*; DOI `10.1038/s41467-018-06689-x` | `02e73e6342c44351321ae5be406350121c0c0fdeaeed0abe138ed3db78788894` |
| `gonda-1957-hydrogen-carbon-dioxide.pdf` | Isono, Komabayasi & Ono (1957), *On the Habit of Ice-Crystals Grown in the Atmospheres of Hydrogen and Carbon Dioxide* | `2e44238ca51a5dec2fb1d04871477cd42303dd38440928daf3f51160d86f9589` |
| `gonda-1958-low-pressure-habit.pdf` | Kobayashi (1958), *On the Habit of Snow Crystals Artificially Produced at Low Pressures* | `6a121a2582adc93b0f160ac7d1b799b483ad8335ab333bfb1b03e30be6e8a6b4` |
| `gonda-1967-vapor-gradient-filaments.pdf` | Levi & Kobayashi (1967), *Ice Filaments Grown in a Gradient of Vapour Pressure* | `3c7c6605ccf74b39764353d76da691f9351fcdcf56516ff8980edcba98493cfc` |
| `gonda-1969-radiative-cooling.pdf` | Higuchi (1969), *Growth of Ice Crystals under Radiative Cooling* | `6e03ad796d518897e91e338fa40b8f8418620666945a5949f19d808a909a7c6e` |
| `gonda-1970-helium-argon.pdf` | Gonda & Komabayasi (1970), *Growth of Ice Crystals in the Atmospheres of Helium-Argon Mixture* | `2a20058fb79de5f0c854f010b91663168c1590acf3c5145a50284245c4286e1f` |
| `gonda-1970-shape-instability.pdf` | Komabayasi (1970), *Shape Instability of Crystals of Ice, Carbon Dioxide and Ammonia Grown in a Cold Chamber* | `cddc5d8dd4697a8545aae0de5fdfa0d5516de8c003e49e1f017d969989fed3a8` |
| `gonda-1971-skeletal-dendritic.pdf` | Gonda & Komabayasi (1971), *Skeletal and Dendritic Structures of Ice Crystal as a Function of Thermal Conductivity and Vapor Diffusivity* | `2ea39d1bd3d62f87101cf1041c43225e9bb24e3b0be25fc61df3228a7499dfd8` |
| `gonda-1973-electric-fields.pdf` | Crowther & Saunders (1973), *Ice Crystal Growth in Electric Fields* | `f835471063be51c511ca3561026b170157e78ba1f4eaf849f507e4cb2ece011d` |
| `imai-1960-convection-mixing-chamber.pdf` | Kobayashi (1960), *Experimental Researches on the Snow Crystal Habit and Growth Using a Convection-Mixing Chamber* | `871819b41478fccfffa2e52c0036ef57af7e9ae1ec8a83ab9fbe856cbc58fc1e` |
| `keller-hallett-1976-high-low-pressure.pdf` | Gonda (1976), *The Growth of Small Ice Crystals in Gases of High and Low Pressures* | `08c32270d74949c84ec9111a0deedb7c6395e6ceec4a445da2271bb07a05ad4c` |
| `kobayashi-1962-temperature-conditions.pdf` | Magono (1962), *The Temperature Conditions for the Growth of Natural and Artificial Snow Crystals* | `4fabb5a0c1ef39825f1e0ca697e445f14f87bbb826b39721051c90ad60eb742c` |
| `kuroda-1982-growth-kinetics.pdf` | Kuroda (1982), *Growth Kinetics of Ice Single Crystal from Vapour Phase and Variation of its Growth Form* | `414057e8a8fcbefc128f375e5c1a0d42dad531ac5a692173d8ce3dcf31ec395b` |
| `lamb-et-al-2017-isotopic-fractionation.pdf` | Lamb et al. (2017), *Laboratory measurements of HDO/H2O isotopic fractionation during ice deposition in simulated cirrus clouds*; DOI `10.1073/pnas.1618374114` | `5cb68c5c5a066c2ef110c0261261026cb28a17f4a0762ccdc492c2b8a46741cf` |
| `libbrecht-2008-freefall-growth-dynamics.pdf` | Libbrecht (2008), *Measurements of Snow Crystal Growth Dynamics in a Free-fall Convection Chamber*; arXiv `0811.2994v1` | `fb6e5a2ee814f619e1431aad231ce5a037db632b03b8f4be0ac6803ae26699ec` |
| `libbrecht-2009-growth-rates-minus5-minus10.pdf` | Libbrecht (2009), *Measurements of Ice Crystal Growth Rates in Air at -5 C and -10 C*; arXiv `0912.2518v1` | `cffec6fc5dc76dd047d94df100e3d31c3c6b8dea8ae97edeb33eb6a8663ca929` |
| `libbrecht-2011-edge-instability-minus15.pdf` | Libbrecht (2011), *Observations of an Edge-enhancing Instability in Snow Crystal Growth near -15 C*; arXiv `1111.2786v1` | `7100720eaa6b8458fb4bbdd2f961ddbe42b5f191a8055b84c83f165a9cacc00a` |
| `libbrecht-2013-attachment-kinetics.pdf` | Libbrecht (2013), *Toward a Comprehensive Model ... 2. Structure Dependent Attachment Kinetics near -5 C*; arXiv `1302.1231v1` | `d15ef2e38a0b1d94d4340292ca33d12822678b77df273863d68cabe6298c9fbf` |
| `libbrecht-2016-background-gas.pdf` | Libbrecht (2016), *The Effect of Background Gas on Snow Crystal Growth Dynamics: Observations and Theory*; arXiv `1602.08528v1` | `909cdb8504d9cfc72f70363436e5c796b99c7e107cab4331051e446255fc8ed4` |
| `murai-et-al-2012-morphology.pdf` | Murai et al. (2012), *Morphology of artificial snow crystals from -4 C to -40 C using a convection chamber with the FINEDew chilled mirror hygrometer* | `b1741202d41a356ef2de0c376a65c3a474dbfae19323c185e93170c223244fe8` |
| `nelson-2019-lateral-facet-growth.pdf` | Nelson (2019), *Lateral facet growth of ice and snow – Part 1: Observations and applications to secondary habits*; DOI `10.5194/acp-19-15285-2019` | `84bdc4f49db156160b52c6887e55080f547850e21c172b5794f47eeb34deac1f` |
| `neshyba-et-al-2014-mesoscopic-roughness.pdf` | Magee et al. (2014), *Mesoscopic surface roughness of ice crystals pervasive across a wide range of ice crystal conditions*; DOI `10.5194/acp-14-12357-2014` | `1a0709a42e70ad507e83239a92e29740b317755704f31076099a00aa8d643e41` |
| `pfalzgraff-et-al-2018-growth-sublimation-roughness.pdf` | Voigtländer et al. (2018), *Surface roughness during depositional growth and sublimation of ice crystals*; DOI `10.5194/acp-18-13687-2018` | `8062802f15b237ed51d0abd9589a22963539f9a27ed2e5596f7932852c08133c` |
| `prm-2018-esem-sublimation.pdf` | Nair et al. (2018), *In situ ESEM imaging of the vapor-pressure-dependent sublimation-induced morphology of ice*; DOI `10.1103/PhysRevMaterials.2.040401` | `2c8ee17a117b392baf017b26dbdcb5785ac31da944ed39a7f287cc663b0b731c` |
| `sei-gonda-1989-polyhedral-growth.pdf` | Sei & Gonda (1989), *Growth Rate of Polyhedral Ice Crystals Growing from the Vapor Phase and Their Habit Change* | `5ef679012e89a00b20aec8c7700952dade776b52ad517bb4bb250ea3c8a82a7d` |
| `zhao-et-al-2021-aircraft-ice-growth.pdf` | Feng et al. (2021), *Aircraft Observations of Characteristics and Growth of Ice Particles of Two Different Snowfall Clouds in Shanxi Province, China*; DOI `10.3390/atmos12040477` | `13a1514ff5ee6f487c1f4788a7f853f719709cb3569ae10742555876549b5771` |

## Local-container-only inventory (23)

| Frozen local container | Identity | SHA-256 |
|---|---|---|
| `1211.5555v1.pdf` | Libbrecht, *Toward a Comprehensive Model ... 1. Overarching Features and Physical Origins*; arXiv `1211.5555v1` | `56a1fe58167674455d776d63c04ddde5203c3776c168f44fd092b7cedf0b6d49` |
| `1910.06389v2.pdf` | Libbrecht, *Snow Crystals*; arXiv `1910.06389v2` | `f6cd58ab841f841bcc310d2f722459122f7850cda9681ae0c7d1877bf21ef471` |
| `1910.09067v2.pdf` | Libbrecht, *A Quantitative Physical Model of the Snow Crystal Morphology Diagram*; arXiv `1910.09067v2` | `89ef4d1e3ed1c9b41379fdb26482fee7c932078d23e608541f2a16b5a37a76d5` |
| `1912.03230v1.pdf` | Libbrecht, *Toward a Comprehensive Model ... 6. Ice Attachment Kinetics near -5 C*; arXiv `1912.03230v1` | `79abfe821a8437601f1b8ded23d533c2ec1be1589d871f1644e61dace90d7477` |
| `1912.09440v1.pdf` | Libbrecht, *A Versatile Apparatus for Measuring the Growth Rates of Small Ice Prisms from the Vapor Phase*; arXiv `1912.09440v1` | `c4e755c51dd913322954fc2f0e57410f2a6e6937ce3fe256d6b705aac41fc2bc` |
| `2004.06212v1.pdf` | Libbrecht, *Toward a Comprehensive Model ... 7. Ice Attachment Kinetics near -2 C*; arXiv `2004.06212v1` | `6e450a1c2969e5cd074b2282ed727c25cb56858347246350c4e0e487b592f49e` |
| `2009.08404v2.pdf` | Libbrecht, *Toward a Comprehensive Model ... 8. Characterizing Structure-Dependent Attachment Kinetics near -14 C*; arXiv `2009.08404v2` | `d1fe8cb5a88560aba7855b802cf335f1f03f7f802c2f208d3b5d69e6004336dd` |
| `2011.02353v1.pdf` | Libbrecht, *Toward a Comprehensive Model ... 9. Characterizing Structure-Dependent Attachment Kinetics near -4 C*; arXiv `2011.02353v1` | `6bd9a8efff803a04d95a9a5046e91a5e7af5cf181b6a7dc41486b173af4f684c` |
| `2012.12916v1.pdf` | Libbrecht, *Toward a Comprehensive Model ... 10. On the Molecular Dynamics of Structure Dependent Attachment Kinetics*; arXiv `2012.12916v1` | `249d390ad509bd70f0fa3f4c0f242f2fd951a231d825741d77b3340236af82a2` |
| `2106.09809v1.pdf` | Libbrecht, *Triangular Snowflakes: Growing Structures with Three-fold Symmetry using a Hexagonal Ice Crystal Lattice*; arXiv `2106.09809v1` | `f53b9e64a1a6f149a06aba93474041335d8df0653c2615a1b8c90b6c8b1aaa87` |
| `2109.00098v1.pdf` | Libbrecht, *A Taxonomy of Snow Crystal Growth Behaviors: 1. Using c-axis Ice Needles as Seed Crystals*; arXiv `2109.00098v1` | `e382edbc61e706c4cdb88811bba2488f7d29baf8dd14d94b21e4a12f5d3fbbeb` |
| `2306.04042v1.pdf` | Libbrecht & Walkling, *A Comprehensive Model of Snow Crystal Faceting*; arXiv `2306.04042v1` | `1ff2c1f9699c2aefd26e5373f29c4fdd7a110620c136bd349d813947dacbcd1f` |
| `2306.13087v1.pdf` | Libbrecht, *A Taxonomy of Snow Crystal Growth Behaviors: 2. Quantifying the Nakaya Diagram*; arXiv `2306.13087v1` | `20f579e01777d51b81b527751b32c3e44b1d8ebe9f1d09a7f15554c2445381af` |
| `GravnerGriffeath_PhysRevE09.pdf` | Gravner & Griffeath (2009), *Modeling snow-crystal growth: A three-dimensional mesoscopic approach*; DOI `10.1103/PhysRevE.79.011601` | `5dbaf113df742de6c24e507a7961bfd50178d91481437cfd1625f6f5adddceb1` |
| `bacon-baker-swanson-2003.pdf` | Bacon, Baker & Swanson (2003), *Initial stages in the morphological evolution of vapour-grown ice crystals: A laboratory investigation*; DOI `10.1256/qj.02.04` | `f312a5a18889320c0be62d200c39db723bca2a1d68968b8ec308dc4789370530` |
| `bailey-hallett-2002-conference-primary.pdf` | Bailey & Hallett (2002), *Growth Characteristics of Laboratory Grown Ice Crystals Between -20 C and -70 C* | `7c2450c14aca3408b7ead8db243d0721979be1698cdad5c4479e3c8ffa3db38e` |
| `harrington-pokrifka-2026.zip` | Data/code companion to Harrington & Pokrifka (2026), *Revisiting Theories for the Growth of Solid and Hollow Single Crystals: The Importance of Step-Source Location*; data DOI `10.26208/XJQK-R076` | `3fa016d36ae11dad221b2c9b300a5fe928ed253ac92dd8acdb2887291f32bc36` |
| `harrison-2016.zip` | Data companion to Harrison et al. (2016), *Levitation Diffusion Chamber Measurements of the Mass Growth of Small Ice Crystals from Vapor*; article DOI `10.1175/JAS-D-15-0234.1`, data DOI `10.26208/dd1w-wa17` | `4901759b3f5f6d71759b31286db6103d9f7d9b23512c01237067c11da3be815c` |
| `nelson-1998-soic-author-copy.pdf` | Nelson (1998), *Sublimation of Ice Crystals* | `df67110fdb98eb29ce11512ac1ebc8019bddc72825fb14ce1dea94a7982cd060` |
| `pokrifka-2020.pdf` | Pokrifka et al. (2020), *Estimating Surface Attachment Kinetic and Growth Transition Influences on Vapor-Grown Ice Crystals*; DOI `10.1175/JAS-D-18-0319.1` | `5010ded8ee7c16178e5007c9228e2d0ab7785ec698ae77c2662cb3259b50fab1` |
| `takahashi-fukuta1988.pdf` | Takahashi & Fukuta (1988), *Supercooled Cloud Tunnel Studies on the Growth of Snow Crystals between -4 and -20 C* | `a4886bcc09ddfbc05d467a0b3ac5729e044723a2befcc05f20d5e77f18bc3659` |
| `takahashi1991-corrigendum.pdf` | Corrigendum to Takahashi et al. (1991), including replacement placement for Fig. 3 continuation | `5297d387ee1c0e33944d9bdb0f6bd68a70a251e64f1f4b5f8e367e7b4c5946bb` |
| `takahashi1991.pdf` | Takahashi et al. (1991), *Vapor Diffusional Growth of Free-Falling Snow Crystals between -3 and -23 C* | `2e5c6b492fcab7d1b3958be5a4c859fcd31174a1ac4865588ca48820bd4cd8eb` |

## Counting interpretation

- **Byte-set view:** 28 acquired-only PDFs; 23 local-only containers. The 34 local archive members are additional local-only bytes, not additional containers.
- **Bibliographic view:** no acquired record was merged with a local record. The two ZIPs are data companions rather than article PDFs, and remain local-only containers.
- **Lineage warning:** exact/bibliographic disjointness must not be promoted to independent-evidence status. Data reuse, replotting, citations, corrections, and shared laboratories require later lineage review.
