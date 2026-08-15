# Phase 8 S2 offline author-output title triage

## Result

All **325** captured author-output rows were screened offline. Deduplication by the registered work identifier produced **292 unique identifier records**. The **33 repeated appearances** occurred in **30 identifier groups** and were collapsed without losing author/date context.

Disposition counts:

| Disposition | Count |
|---|---:|
| `likely-eligible-primary` | 12 |
| `needs-metadata-or-fulltext` | 17 |
| `known-local-or-acquired` | 13 |
| `clearly-out-of-scope` | 250 |
| **Total unique identifiers** | **292** |

This is deliberately conservative title-level reconnaissance. “Known local or acquired” describes source/data availability, not scientific eligibility. Ambiguous mechanism, synthesis, apparatus, and sparse conference records remain in the review queue.

## Bound inputs

| Role | Rows | Bytes | SHA-256 |
|---|---:|---:|---|
| author-leads | 325 | 144567 | `950c50d31e06faa2c02c093472b8ad5b7f4a2bded4033040ad4ec375ed7ac756` |
| local-source-registry | 23 | 18688 | `3f12256918c845cdf2f44a9029dc01ab06c774f7ac1df11e33d3667f8ef23106` |
| acquired-source-registry | 28 | 42648 | `3590804a3943bbe1594d6ec1feec58c45182d4f79cfc10b3c94d1f7ac068476f` |

No live request or download was made.

## Deduplication accounting

- Deduplication key: exact captured `identifier`.
- Input rows: 325.
- Unique identifiers: 292.
- Repeated appearances collapsed: 33.
- Identifier groups with more than one appearance: 30.
- Duplicate-group-size histogram: 28 group(s) of size 2; 1 group(s) of size 3; 1 group(s) of size 4.
- Preserved distinct author contexts: 325; every output work record retains its input row numbers, author identity/name, author-search start date, and publication date.
- Cross-identifier normalized-title collision groups: 33; exact normalized-DOI collision groups: 3. These were not collapsed because the requested key is identifier. Each affected record carries an acquisition guard so metadata variants are identity-resolved before any source request.

The repeated identifier groups were:

| Identifier | Input appearances | Preserved author contexts |
|---|---:|---|
| https://openalex.org/W2180541107 | 2 | Matthew P. Bailey; John Hallett |
| https://openalex.org/W2134509629 | 2 | Matthew P. Bailey; John Hallett |
| https://openalex.org/W2067528767 | 2 | Matthew P. Bailey; John Hallett |
| https://openalex.org/W2102349375 | 2 | Matthew P. Bailey; John Hallett |
| https://openalex.org/W2108284535 | 2 | Matthew P. Bailey; John Hallett |
| https://openalex.org/W1973114733 | 2 | Matthew P. Bailey; John Hallett |
| https://openalex.org/W855920553 | 2 | Matthew P. Bailey; John Hallett |
| https://openalex.org/W843951168 | 2 | Matthew P. Bailey; John Hallett |
| https://openalex.org/W2075940077 | 2 | Matthew P. Bailey; John Hallett |
| https://openalex.org/W2053258692 | 2 | Matthew P. Bailey; John Hallett |
| https://openalex.org/W1971941054 | 2 | Matthew P. Bailey; John Hallett |
| https://openalex.org/W774593182 | 2 | Matthew P. Bailey; John Hallett |
| https://openalex.org/W2113258649 | 2 | Matthew P. Bailey; John Hallett |
| https://openalex.org/W2162690630 | 2 | Matthew P. Bailey; John Hallett |
| https://openalex.org/W7163161407 | 2 | Gwenore F. Pokrifka; Jerry Y. Harrington |
| https://openalex.org/W7120129957 | 2 | Gwenore F. Pokrifka duplicate identity; Jerry Y. Harrington duplicate identity |
| https://openalex.org/W7664799 | 4 | Tsuneya Takahashi; Tatsuo Endoh; Gorow Wakahama; Norihiko Fukuta |
| https://openalex.org/W2054949358 | 2 | Tsuneya Takahashi; Tatsuo Endoh |
| https://openalex.org/W356242540 | 2 | Tsuneya Takahashi; Tatsuo Endoh |
| https://openalex.org/W2179848989 | 2 | Tsuneya Takahashi; Norihiko Fukuta |
| https://openalex.org/W2909731839 | 2 | Tatsuo Endoh; Gorow Wakahama |
| https://openalex.org/W2937887554 | 2 | Jon Nelson; Brian D. Swanson |
| https://openalex.org/W2950055461 | 2 | Jon Nelson; Brian D. Swanson |
| https://openalex.org/W2995869669 | 2 | Jon Nelson; Brian D. Swanson |
| https://openalex.org/W2037880113 | 2 | Janko Gravner; David Griffeath |
| https://openalex.org/W2085433754 | 2 | Janko Gravner; David Griffeath |
| https://openalex.org/W2989689375 | 2 | Janko Gravner; David Griffeath |
| https://openalex.org/W2121150382 | 2 | Janko Gravner; David Griffeath |
| https://openalex.org/W1991395714 | 2 | Janko Gravner; David Griffeath |
| https://openalex.org/W2102420161 | 3 | Neil J. Bacon; Marcia B. Baker; Brian D. Swanson |

## High-priority likely-primary titles

These titles explicitly signal controlled growth, rate, mass, dimension, density, or gas-effect measurements. Full metadata and source bytes are still required before inclusion.

| Date | Title | Identifier | Reason code |
|---|---|---|---|
| 2004-03-01 | Growth Rates and Habits of Ice Crystals between −20° and −70°C | https://openalex.org/W2180541107 | `TITLE_PRIMARY_GROWTH_RATE` |
| 2004-04-01 | Laboratory and In Situ Observation of Deposition Growth of Frozen Drops | https://openalex.org/W2134509629 | `TITLE_PRIMARY_CONTROLLED_GROWTH` |
| 2010-06-09 | Ice particle growth under conditions of the upper troposphere | https://openalex.org/W2075940077 | `TITLE_PRIMARY_CONTROLLED_GROWTH` |
| 2010-06-28 | Laboratory measured ice crystal capacitances and mass dimensional relations | https://openalex.org/W2795859459 | `TITLE_PRIMARY_DIMENSION_MASS` |
| 2011-07-27 | Ice Crystal Linear Growth Rates from −20° to −70°C: Confirmation from Wave Cloud Studies | https://openalex.org/W2113258649 | `TITLE_PRIMARY_GROWTH_RATE` |
| 2004-08-25 | 27aD01 Ice crystal growth and evaporation rates under surface limited conditions(NCCG-34) | https://openalex.org/W1543736277 | `TITLE_PRIMARY_GROWTH_RATE` |
| 2010-06-30 | Measurement of growth and density of dendrite crystals | https://openalex.org/W2792178285 | `TITLE_PRIMARY_DIMENSION_MASS` |
| 2012-01-31 | Ice particle growth in the presence of nitric oxide | https://openalex.org/W2030897241 | `TITLE_PRIMARY_CONTROLLED_GAS_EFFECT` |
| 2014-07-07 | Supercooled Cloud Tunnel Studies on the Growth Conditions of Branched Planar Snow Crystals between -12°C and -17°C | https://openalex.org/W2804178585 | `TITLE_PRIMARY_CONTROLLED_GROWTH` |
| 2014-08-15 | Influence of Liquid Water Content and Temperature on the Form and Growth of Branched Planar Snow Crystals in a Cloud | https://openalex.org/W2129095956 | `TITLE_PRIMARY_CONTROLLED_GROWTH` |
| 2018-07-09 | Supercooled Cloud Tunnel Studies on the Growth of Branched Planar Snow Crystals below Water Saturation | https://openalex.org/W2801147923 | `TITLE_PRIMARY_CONTROLLED_GROWTH` |
| 2018-07-11 | Laboratory Study of Ice Crystal Growth Processes at -30C | https://openalex.org/W2799620233 | `TITLE_PRIMARY_CONTROLLED_GROWTH` |

## Needs metadata or full text

These remain open because title metadata cannot distinguish original measurement content from synthesis, mechanism interpretation, apparatus demonstration, conference duplication, or an ineligible observable.

| Date | Title | Identifier | Reason code |
|---|---|---|---|
| 2006-07-10 | Measured Ice Crystal Capacitances: the Failure of the Electrostatic Analogy | https://openalex.org/W2887395950 | `TITLE_AMBIGUOUS_MEASUREMENT_SCOPE` |
| 2009-02-13 | A Comprehensive Habit Diagram for Atmospheric Ice Crystals: Confirmation from the Laboratory, AIRS II, and Other Field Studies | https://openalex.org/W2108284535 | `TITLE_POSSIBLE_PRIMARY_OR_SYNTHESIS` |
| 2010-01-01 | Ice Particle Growth Rates Under Upper Troposphere Conditions | https://openalex.org/W855920553 | `TITLE_POSSIBLE_SAME_WORK_VARIANT` |
| 2010-04-29 | Ice Crystal Growth Rates Under Upper Troposphere Conditions | https://openalex.org/W843951168 | `TITLE_POSSIBLE_SAME_WORK_VARIANT` |
| 2005-01-10 | Measurement for Charactization of Mixed Phase Clouds | https://openalex.org/W2331475107 | `TITLE_AMBIGUOUS_MEASUREMENT_SCOPE` |
| 2006-07-10 | High resolution measurement of ice-supercooled water cloud interfaces | https://openalex.org/W2883945240 | `TITLE_AMBIGUOUS_MEASUREMENT_SCOPE` |
| 1999-06-01 | The Growth of Atmospheric Ice Crystals: A Summary of Findings in Vertical Supercooled Cloud Tunnel Studies | https://openalex.org/W2179848989 | `TITLE_POSSIBLE_PRIMARY_OR_SYNTHESIS` |
| 1991-03-25 | The Snow Crystals of "Double Gohei Twin Types" | https://openalex.org/W1517139805 | `TITLE_NONENGLISH_OR_SPARSE_METADATA` |
| 1998-04-01 | Snow Crystal Habit Changes Explained by Layer Nucleation | https://openalex.org/W2172974053 | `TITLE_POSSIBLE_MECHANISM_WITH_OBSERVATIONS` |
| 2001-10-01 | Growth mechanisms to explain the primary and secondary habits of snow crystals | https://openalex.org/W4245257950 | `TITLE_POSSIBLE_MECHANISM_WITH_OBSERVATIONS` |
| 2001-10-01 | Growth mechanisms to explain the primary and secondary habits of snow crystals | https://openalex.org/W2045864615 | `TITLE_POSSIBLE_MECHANISM_WITH_OBSERVATIONS` |
| 2005-05-18 | Branch Growth and Sidebranching in Snow Crystals | https://openalex.org/W1999903045 | `TITLE_POSSIBLE_MECHANISM_WITH_OBSERVATIONS` |
| 2008-09-26 | Origin of diversity in falling snow | https://openalex.org/W2167480302 | `TITLE_POSSIBLE_MECHANISM_WITH_OBSERVATIONS` |
| 2014-07-07 | New Apparatus for Laboratory Studies of Ice Nucleation, Growth and Sublimation Rates, and Habit of Ice Crystals | https://openalex.org/W2797644837 | `TITLE_POSSIBLE_APPARATUS_DATA` |
| 2018-07-09 | How the Protruding Growth Mechanism may Produce Corner Pockets and Other Features on Snow Crystals | https://openalex.org/W2801741741 | `TITLE_POSSIBLE_MECHANISM_WITH_OBSERVATIONS` |
| 2019-11-25 | Low-temperature triple-capillary cryostat for ice crystal growth studies | https://openalex.org/W2950055461 | `TITLE_POSSIBLE_APPARATUS_DATA` |
| 2019-06-11 | Low-Temperature Triple-Capillary Cryostat for Ice Crystal GrowthStudies | https://openalex.org/W4239358896 | `TITLE_POSSIBLE_APPARATUS_DATA` |

## Known local or acquired

These matches should be reconciled locally before any request. Companion-data matches explicitly do not claim that the article PDF is present.

| Date | Title | Identifier | Registry match | Relationship |
|---|---|---|---|---|
| 2026-06-02 | Revisiting Theories for the Growth of Solid and Hollow Single Crystals: The Importance of Step-Source Location | https://openalex.org/W7163161407 | P8B-CONT-21F26713EF4DDC626CDFD820 | data-companion; article PDF not present in the registered container |
| 2026-01-09 | Revisiting Theories for the Growth of Single Crystalline Ice: Laboratory Data and Code to Compute the Crystal Shape Functions | https://openalex.org/W7120129957 | P8B-CONT-21F26713EF4DDC626CDFD820 | exact registered data-archive identity; article PDF not present |
| 2025-08-06 | Columnar Ice Dimensional Growth Rates at Temperatures below −40°C: Measurements in a Novel Thermal Gradient Diffusion Chamber | https://openalex.org/W4413020701 | P8B-CONT-21F26713EF4DDC626CDFD820 | native dimensional histories from this observational lineage are present; article PDF not present |
| 2020-05-21 | Estimating Surface Attachment Kinetic and Growth Transition Influences on Vapor-Grown Ice Crystals | https://openalex.org/W3026141380 | P8B-CONT-1034F981B47FACA23A038372 | exact local accepted-manuscript work |
| 2016-04-18 | Levitation Diffusion Chamber Measurements of the Mass Growth of Small Ice Crystals from Vapor | https://openalex.org/W2338735635 | P8B-CONT-31C9AE8E361BC8BD92F402E3 | exact registered native-data companion; article PDF not present |
| 1991-01-01 | Vapor Diffusional Growth of Free-Falling Snow Crystals between -3 and -23&amp;deg;C | https://openalex.org/W7664799 | P8B-CONT-71B94B2DC804DA17163284BD, P8B-CONT-CFC271AC45CC9CF11AC259DD | exact local article plus official corrigendum |
| 1998-03-01 | Sublimation of Ice Crystals | https://openalex.org/W2178133689 | P8B-CONT-FEC14CA8A8AD17E37E206E0A | exact local author-copy work |
| 2019-04-09 | Air pockets and secondary habits in ice from lateral-type growth | https://openalex.org/W2937887554 | P8B-S2R0-84BDC4F49DB156160B52C688 | discussion/preprint-stage record for the acquired final lateral-facet work |
| 2019-12-16 | Lateral facet growth of ice and snow – Part 1: Observations and applications to secondary habits | https://openalex.org/W2995869669 | P8B-S2R0-84BDC4F49DB156160B52C688 | exact acquired final work |
| 2009-01-06 | Modeling snow-crystal growth: A three-dimensional mesoscopic approach | https://openalex.org/W2037880113 | P8B-CONT-545BEE96DA0D2F5D93DB1204 | exact local work; availability label does not imply measurement eligibility |
| 2003-04-01 | Initial stages in the morphological evolution of vapour‐grown ice crystals: A laboratory investigation | https://openalex.org/W2102420161 | P8B-CONT-755B3746D3762F0BD610671A | exact local work |
| 2023-06-22 | A Taxonomy of Snow Crystal Growth Behaviors: 2. Quantifying the Nakaya Diagram | https://openalex.org/W4381797976 | P8B-CONT-DB5A9BC9012364401BC770F0 | exact local arXiv work |
| 2023-06-06 | A Comprehensive Model of Snow Crystal Faceting | https://openalex.org/W4379933289 | P8B-CONT-3953FE9A14DC13EC535C9FA7 | exact local arXiv work; availability label does not imply measurement eligibility |

## Reason-code counts

| Reason code | Count |
|---|---:|
| `MATCH_ACQUIRED_EXACT_WORK` | 1 |
| `MATCH_ACQUIRED_SAME_WORK_VERSION` | 1 |
| `MATCH_LOCAL_DATA_COMPANION` | 4 |
| `MATCH_LOCAL_EXACT_WORK` | 6 |
| `MATCH_LOCAL_EXACT_WORK_PLUS_CORRIGENDUM` | 1 |
| `OUT_AGGREGATION_OR_COLLISION` | 4 |
| `OUT_BULK_CLOUD_PRECIPITATION_OR_REMOTE_SENSING` | 41 |
| `OUT_EDITORIAL_REPLY_OR_METADATA_ITEM` | 18 |
| `OUT_ELECTRICAL_CHEMICAL_OR_OPTICAL_ONLY` | 13 |
| `OUT_INSTRUMENT_OR_PROTOCOL_ONLY` | 14 |
| `OUT_LIQUID_DROPLET_OR_NONATMOSPHERIC` | 12 |
| `OUT_MODEL_THEORY_NO_NEW_MEASUREMENT` | 61 |
| `OUT_NUCLEATION_ONLY` | 7 |
| `OUT_REVIEW_SUMMARY_OR_REFERENCE` | 5 |
| `OUT_SEA_ICE_FIRN_GLACIER_OR_ICICLE` | 22 |
| `OUT_UNRELATED_FIELD` | 53 |
| `TITLE_AMBIGUOUS_MEASUREMENT_SCOPE` | 3 |
| `TITLE_NONENGLISH_OR_SPARSE_METADATA` | 1 |
| `TITLE_POSSIBLE_APPARATUS_DATA` | 3 |
| `TITLE_POSSIBLE_MECHANISM_WITH_OBSERVATIONS` | 6 |
| `TITLE_POSSIBLE_PRIMARY_OR_SYNTHESIS` | 2 |
| `TITLE_POSSIBLE_SAME_WORK_VARIANT` | 2 |
| `TITLE_PRIMARY_CONTROLLED_GAS_EFFECT` | 1 |
| `TITLE_PRIMARY_CONTROLLED_GROWTH` | 6 |
| `TITLE_PRIMARY_DIMENSION_MASS` | 2 |
| `TITLE_PRIMARY_GROWTH_RATE` | 3 |

## Limits

- This pass used captured titles, identifiers, DOI fields, author/date contexts, and the two named local/acquired registries only. It did not inspect new full text or query external services.
- Title-level classification cannot establish primary-measurement content, exact protocol, observables, uncertainty, rights, source currency, or witness independence.
- A clearly out-of-scope title can be reopened if authoritative metadata later establishes eligible primary measurements.
- Same titles under different identifiers remain separate here. Resolve DOI/version relationships first and make at most one deliberate source request per work lineage.
- No search-saturation, acquisition-completion, S3 inventory, or Phase 9 validation claim follows from this artifact.

## Output integrity

- Durable JSONL: `/Volumes/snowcrystal/research-cache/phase8b-search/offline-title-triage-20260811-v1/author-title-triage.jsonl`
- Working copy: `/private/tmp/phase8-author-title-triage.jsonl`
- JSONL records: 293 (292 work records plus one status record); 280654 bytes.
- JSONL SHA-256: `3e7015adc8e94a85262e47caff7283318cf2f3018aa54ff11153a7bf796513df`
- The Markdown report hash is recorded with delivery rather than embedded recursively in this file.
