# Phase 8 S2 citation-title reconnaissance triage

Date: 2026-08-11. This is one offline, title-level reconnaissance pass over the captured citation-expansion metadata. It is not a formal source screen and does not establish source eligibility, currency, correction status, data availability, or scientific independence.

## Outcome

The 896 captured rows reduce to 852 OpenAlex identifier groups. Direction membership is retained on every output record. Conservative treatment leaves ambiguous, non-English, encoding-damaged, method-only, and metadata-thin titles in `needs-metadata-or-fulltext`.

| Disposition | Identifier groups |
|---|---:|
| `likely-eligible-primary` | 47 |
| `needs-metadata-or-fulltext` | 256 |
| `known-local-or-acquired` | 33 |
| `clearly-out-of-scope` | 516 |

The `known-local-or-acquired` bucket is an identity/reconciliation disposition, not an eligibility claim. It contains 15 identifier groups matching a frozen local container or its recorded work identity and 18 matching an acquired source; 0 groups matched both corpora.

## Inputs and immutable pins

| Input | Rows or role | SHA-256 |
|---|---:|---|
| `/Volumes/snowcrystal/research-cache/phase8b-search/citation-expansion-20260811-round0-v1/private-citation-leads.jsonl` | 896 captured lead rows | `fb36f20b5c7a48ddc22f9db81fc44961d5e12403f5610c6f8e0e9c157d674e1b` |
| `/Users/clipper/github/snowflake-phase8/evidence/phase8b-local-denominator/source-containers.jsonl` | 23 frozen local containers | `3f12256918c845cdf2f44a9029dc01ab06c774f7ac1df11e33d3667f8ef23106` |
| `/Users/clipper/github/snowflake-phase8/evidence/phase8b-s2-round0-reconnaissance/source-register.jsonl` | 28 acquired source screens | `3590804a3943bbe1594d6ec1feec58c45182d4f79cfc10b3c94d1f7ac068476f` |
| `/Users/clipper/github/snowflake-phase8/evidence/phase8b-s2-round0-reconnaissance/local-acquired-reconciliation.md` | acquired/local reconciliation crosswalk | `a097899a0570b495f0cf3badd95ffca29cee9e3e5de09db0bd059704c41cc858` |

## Deduplication and overlap accounting

| Quantity | Count |
|---|---:|
| Captured input rows | 896 |
| Backward rows | 301 |
| Forward rows | 595 |
| Unique OpenAlex identifiers | 852 |
| Unique identifiers in backward set | 301 |
| Unique identifiers in forward set | 595 |
| Backward/forward identifier overlap | 44 |
| Identifiers represented by more than one input row | 44 |
| Grouped identifiers with metadata conflicts | 0 |
| DOI collision groups left separate under identifier-level deduplication | 2 |
| Identifiers in those DOI collision groups | 4 |

All 44 duplicated identifiers are exactly the 44 backward/forward overlap groups. No same-direction duplicates occurred. Deduplication was deliberately by captured OpenAlex identifier, as requested; distinct identifiers sharing a DOI were not merged.

## Reason-code counts

Reason codes describe only what the captured title/type metadata supports. A policy-normalization flag may accompany one scientific disposition and therefore makes this table sum above the identifier count.

| Reason code | Identifier groups |
|---|---:|
| `ADJACENT_CONTENT_SCOPE_UNCLEAR` | 152 |
| `AGGREGATION_RIMING_MELTING_OR_FROST` | 47 |
| `BULK_REMOTE_SENSING_OR_FIELD_MICROPHYSICS` | 95 |
| `CONTROLLED_OR_OBSERVED_GROWTH_TITLE` | 15 |
| `DIRECT_GROWTH_MEASUREMENT_TITLE` | 32 |
| `KNOWN_ACQUIRED_IDENTIFIER` | 16 |
| `KNOWN_ACQUIRED_TITLE` | 16 |
| `KNOWN_LOCAL_IDENTIFIER` | 14 |
| `KNOWN_LOCAL_TITLE` | 4 |
| `METADATA_THIN_OR_GENERIC_TITLE` | 33 |
| `METHOD_OR_APPARATUS_CONTENT_UNCLEAR` | 5 |
| `MODEL_OR_REANALYSIS_PRIMARY_CONTENT_UNCLEAR` | 15 |
| `NON_ENGLISH_OR_ENCODING_AMBIGUITY` | 3 |
| `NON_TARGET_MEASUREMENT_OUTCOME` | 50 |
| `NUCLEATION_OR_FREEZING_ONLY` | 24 |
| `POSSIBLE_PRIMARY_GROWTH_CONTENT` | 48 |
| `REVIEW_BOOK_OR_SYNTHESIS` | 18 |
| `SECONDARY_OR_EDITORIAL_RECORD` | 30 |
| `SURFACE_OR_MOLECULAR_ANALOGUE` | 10 |
| `THEORY_SIMULATION_OR_PARAMETERIZATION` | 111 |
| `TITLE_POLICY_NORMALIZED` | 1 |
| `UNRELATED_MATERIAL_OR_SUBJECT` | 131 |

## High-priority likely-eligible titles

Priority here is a reconnaissance order only: direct title evidence of target growth, sublimation, or trajectory measurements ranks first; captured citation count is a secondary ordering signal. Known local/acquired records are omitted from this queue.

| Year | Captured title | Cited by | Reason | Identifier |
|---:|---|---:|---|---|
| 2022 | Effective Density Derived from Laboratory Measurements of the Vapor Growth Rates of Small Ice Crystals at −65° to −40°C | 5 | CONTROLLED_OR_OBSERVED_GROWTH_TITLE | https://openalex.org/W4306809528 |
| 1972 | Linear growth rates of ice crystals grown from the vapor phase | 83 | DIRECT_GROWTH_MEASUREMENT_TITLE | https://openalex.org/W1969459018 |
| 1982 | Growth rates and growth forms of ice crystals grown from the vapor phase | 27 | DIRECT_GROWTH_MEASUREMENT_TITLE | https://openalex.org/W2089489199 |
| 1983 | Growth rates and habits of ice crystals grown from the vapor phase | 17 | DIRECT_GROWTH_MEASUREMENT_TITLE | https://openalex.org/W1981201291 |
| 2008 | A Convection Chamber for Measuring Ice Crystal Growth Dynamics | 6 | DIRECT_GROWTH_MEASUREMENT_TITLE | https://openalex.org/W2145015730 |
| 2004 | Growth Rates and Habits of Ice Crystals between −20° and −70°C | 248 | DIRECT_GROWTH_MEASUREMENT_TITLE | https://openalex.org/W2180541107 |
| 1957 | Experimental Researches en the Snow Crystal Habit and Growth by Means of a Diffusion Cloud Chamber | 61 | CONTROLLED_OR_OBSERVED_GROWTH_TITLE | https://openalex.org/W2601053678 |
| 1994 | In situ observation of vapor-grown ice crystals by laser two-beam interferometry | 17 | CONTROLLED_OR_OBSERVED_GROWTH_TITLE | https://openalex.org/W2044122123 |
| 1976 | The Growth Rates and Densities of Ice Crystals between −3°C and −21°C | 115 | DIRECT_GROWTH_MEASUREMENT_TITLE | https://openalex.org/W1995486378 |
| 2005 | A Laboratory Investigation of Vapor-Grown Ice Crystals at Low Atmospheric Temperatures | 4 | CONTROLLED_OR_OBSERVED_GROWTH_TITLE | https://openalex.org/W163808485 |
| 2002 | Growth rates of the principal facets of ice between −10°C and −40°C | 51 | DIRECT_GROWTH_MEASUREMENT_TITLE | https://openalex.org/W2034134698 |
| 2011 | Ice Crystal Linear Growth Rates from −20° to −70°C: Confirmation from Wave Cloud Studies | 45 | DIRECT_GROWTH_MEASUREMENT_TITLE | https://openalex.org/W2113258649 |
| 2011 | Ice in Clouds Experiment—Layer Clouds. Part I: Ice Growth Rates Derived from Lenticular Wave Cloud Penetrations | 40 | CONTROLLED_OR_OBSERVED_GROWTH_TITLE | https://openalex.org/W2090999797 |
| 1974 | The Densities and Growth Rates of Ice Crystals between −5C and −9C | 16 | DIRECT_GROWTH_MEASUREMENT_TITLE | https://openalex.org/W2067359674 |
| 1976 | Growth rates of freely falling ice crystals | 8 | DIRECT_GROWTH_MEASUREMENT_TITLE | https://openalex.org/W2074725219 |
| 2025 | In-cloud characteristics observed in northeastern and midwestern US non-orographic winter storms with implications for ice particle mass growth and residence time | 0 | CONTROLLED_OR_OBSERVED_GROWTH_TITLE | https://openalex.org/W4411963321 |
| 2006 | Experimental determination of the deposition coefficient of small cirrus‐like ice crystals near −50°C | 82 | CONTROLLED_OR_OBSERVED_GROWTH_TITLE | https://openalex.org/W2018576160 |
| 1969 | Experimental Studies on the Growth of Small Ice Crystals | 78 | CONTROLLED_OR_OBSERVED_GROWTH_TITLE | https://openalex.org/W2176281127 |
| 2013 | Measurements of surface attachment kinetics for faceted ice crystal growth | 69 | CONTROLLED_OR_OBSERVED_GROWTH_TITLE | https://openalex.org/W1597967365 |
| 1977 | Measurements of the deposition coefficient for ice, and its application to cirrus seeding | 22 | CONTROLLED_OR_OBSERVED_GROWTH_TITLE | https://openalex.org/W2006021523 |
| 2015 | Toward a Comprehensive Model of Snow Crystal Growth: 4. Measurements of Diffusion-limited Growth at -15 C | 6 | CONTROLLED_OR_OBSERVED_GROWTH_TITLE | https://openalex.org/W2190277646 |
| 2015 | An experimental apparatus for observing deterministic structure formation in plate-on-pedestal ice crystal growth | 4 | CONTROLLED_OR_OBSERVED_GROWTH_TITLE | https://openalex.org/W2110205889 |
| 2016 | Measurements of Cylindrical Ice Crystal Growth Limited by Combined Particle and Heat Diffusion | 2 | CONTROLLED_OR_OBSERVED_GROWTH_TITLE | https://openalex.org/W2270889922 |
| 2006 | Measurements of the deposition coefficient for small cirrus-like ice crystals | 1 | CONTROLLED_OR_OBSERVED_GROWTH_TITLE | https://openalex.org/W2883846334 |
| 1958 | The influence of temperature and supersaturation on the habit of ice crystals grown from the vapour | 231 | DIRECT_GROWTH_MEASUREMENT_TITLE | https://openalex.org/W2098745717 |
| 1982 | Growth kinetics of ice from the vapour phase and its growth forms | 225 | DIRECT_GROWTH_MEASUREMENT_TITLE | https://openalex.org/W2027434787 |
| 1982 | Influence of air velocity on the habit of ice crystal growth from the vapor | 78 | DIRECT_GROWTH_MEASUREMENT_TITLE | https://openalex.org/W2085018287 |
| 1989 | The growth mechanism and the habit change of ice crystals growing from the vapor phase | 71 | DIRECT_GROWTH_MEASUREMENT_TITLE | https://openalex.org/W2041686581 |
| 1970 | Growth Mode of Ice Crystals in Natural Clouds | 60 | DIRECT_GROWTH_MEASUREMENT_TITLE | https://openalex.org/W1999284665 |
| 1982 | Interface kinetics of the growth and evaporation of ice single crystals from the vapour phase | 54 | DIRECT_GROWTH_MEASUREMENT_TITLE | https://openalex.org/W1536246457 |

## High-priority metadata/full-text review titles

These titles have potentially relevant growth, habit, apparatus, surface, or controlled-cloud content, but the captured metadata is insufficient for a responsible primary-measurement disposition.

| Year | Captured title | Cited by | Reason | Identifier |
|---:|---|---:|---|---|
| 2011 | Water vapor measurements during snow crystal formations by the “FINEDEW” chilled mirror hygrometer | 2 | ADJACENT_CONTENT_SCOPE_UNCLEAR | https://openalex.org/W4290188754 |
| 2009 | A Comprehensive Habit Diagram for Atmospheric Ice Crystals: Confirmation from the Laboratory, AIRS II, and Other Field Studies | 534 | POSSIBLE_PRIMARY_GROWTH_CONTENT | https://openalex.org/W2108284535 |
| 1970 | The Dimension of Ice Crystals in Natural Clouds | 312 | POSSIBLE_PRIMARY_GROWTH_CONTENT | https://openalex.org/W2040024665 |
| 2014 | The growth of ice particles in a mixed phase environment based on laboratory observations | 11 | POSSIBLE_PRIMARY_GROWTH_CONTENT | https://openalex.org/W2092994608 |
| 2014 | A Dual Diffusion Chamber for Observing Ice Crystal Growth on c-Axis Ice Needles | 8 | METHOD_OR_APPARATUS_CONTENT_UNCLEAR | https://openalex.org/W1874941867 |
| 2010 | A BUTTON-ELECTRODE LEVITATION CHAMBER FOR THE STUDY OF ICE CRYSTAL GROWTH UNDER ATMOSPHERIC CONDITIONS | 2 | METHOD_OR_APPARATUS_CONTENT_UNCLEAR | https://openalex.org/W2595802276 |
| 2002 | Nucleation effects on the habit of vapour grown ice crystals from −18 to −42°C | 106 | POSSIBLE_PRIMARY_GROWTH_CONTENT | https://openalex.org/W2063900651 |
| 1971 | Roughness of the Crystal-Vapor Interface | 99 | ADJACENT_CONTENT_SCOPE_UNCLEAR | https://openalex.org/W2017504353 |
| 1974 | The growth of crystals of low supersaturation | 91 | ADJACENT_CONTENT_SCOPE_UNCLEAR | https://openalex.org/W1644550153 |
| 2008 | Effect of atmospheric water vapor on modification of stable isotopes in near‐surface snow on ice sheets | 83 | ADJACENT_CONTENT_SCOPE_UNCLEAR | https://openalex.org/W2143322569 |
| 2001 | New model for the vapor growth of hexagonal ice crystals in the atmosphere | 70 | MODEL_OR_REANALYSIS_PRIMARY_CONTENT_UNCLEAR | https://openalex.org/W2008575785 |
| 2005 | The Kinetics of H2O Vapor Condensation and Evaporation on Different Types of Ice in the Range 130−210 K | 54 | ADJACENT_CONTENT_SCOPE_UNCLEAR | https://openalex.org/W1999263068 |
| 2009 | Influence of Ice Crystal Aspect Ratio on the Evolution of Ice Size Spectra during Vapor Depositional Growth | 36 | POSSIBLE_PRIMARY_GROWTH_CONTENT | https://openalex.org/W2001636421 |
| 2013 | Including Surface Kinetic Effects in Simple Models of Ice Vapor Diffusion | 36 | ADJACENT_CONTENT_SCOPE_UNCLEAR | https://openalex.org/W2024461893 |
| 1984 | Rate Determining Processes of Growth of Ice Crystals from the Vapour Phase | 35 | MODEL_OR_REANALYSIS_PRIMARY_CONTENT_UNCLEAR | https://openalex.org/W2490384899 |
| 1984 | Rate Determining Processes of Growth of Ice Crystals from the Vapour Phase | 32 | MODEL_OR_REANALYSIS_PRIMARY_CONTENT_UNCLEAR | https://openalex.org/W2464072136 |
| 1982 | Morphological stability of polyhedral ice crystals growing from the vapor phase | 19 | MODEL_OR_REANALYSIS_PRIMARY_CONTENT_UNCLEAR | https://openalex.org/W2012226261 |
| 2020 | Approximate Models for Lateral Growth on Ice Crystal Surfaces during Vapor Depositional Growth | 16 | MODEL_OR_REANALYSIS_PRIMARY_CONTENT_UNCLEAR | https://openalex.org/W3114695583 |
| 1993 | Heat conduction problems in crystal growth from the vapor | 11 | ADJACENT_CONTENT_SCOPE_UNCLEAR | https://openalex.org/W2037851502 |
| 2023 | Ice Supersaturation Variability in Cirrus Clouds: Role of Vertical Wind Speeds and Deposition Coefficients | 9 | POSSIBLE_PRIMARY_GROWTH_CONTENT | https://openalex.org/W4388563399 |
| 2021 | Semianalytic Functions to Calculate the Deposition Coefficients for Ice Crystal Vapor Growth in Bin and Bulk Microphysical Models | 8 | POSSIBLE_PRIMARY_GROWTH_CONTENT | https://openalex.org/W3136988234 |
| 2021 | The ice–vapour interface during growth and sublimation | 6 | POSSIBLE_PRIMARY_GROWTH_CONTENT | https://openalex.org/W4200311762 |
| 2023 | An Approximate Criterion for Morphological Transformations in Small Vapor Grown Ice Crystals | 5 | POSSIBLE_PRIMARY_GROWTH_CONTENT | https://openalex.org/W4390267379 |
| 2015 | The Surface Diffusion Length of Water Molecules on Faceted Ice: A Reanalysis of "Roles of Surface/Volume Diffusion in the Growth Kinetics of Elementary Spiral Steps on Ice Basal Faces Grown from Water Vapor", by Asakawa et al | 3 | MODEL_OR_REANALYSIS_PRIMARY_CONTENT_UNCLEAR | https://openalex.org/W2300846237 |
| 2003 | A discussion of mechanisms proposed to explain habit changes of vapor-grown ice crystals | 2 | POSSIBLE_PRIMARY_GROWTH_CONTENT | https://openalex.org/W2023310134 |
| 1963 | Morphological Stability of a Particle Growing by Diffusion or Heat Flow | 2003 | MODEL_OR_REANALYSIS_PRIMARY_CONTENT_UNCLEAR | https://openalex.org/W2025739397 |
| 2009 | NOTES AND CORRESPONDENCE Influence of Ice Crystal Aspect Ratio on the Evolution of Ice Size Spectra during Vapor Depositional Growth | 0 | POSSIBLE_PRIMARY_GROWTH_CONTENT | https://openalex.org/W2185259910 |
| 2025 | Pathways and characteristics of water vapor-to-ice transformation on SiO2 surfaces | 0 | ADJACENT_CONTENT_SCOPE_UNCLEAR | https://openalex.org/W4408057931 |
| 1994 | Atomic processes in crystal growth | 414 | ADJACENT_CONTENT_SCOPE_UNCLEAR | https://openalex.org/W1998563353 |
| 2010 | Improved Representation of Ice Particle Masses Based on Observations in Natural Clouds | 204 | ADJACENT_CONTENT_SCOPE_UNCLEAR | https://openalex.org/W2095844902 |

## Scope basis and limits

- Likely eligible means the title itself strongly signals primary laboratory or controlled natural-cloud measurements of vapor-grown or sublimating individual atmospheric ice crystals, including growth rates, dimensions, habit transitions, controlled gas/pressure/temperature conditions, or time-dependent sublimation. It remains provisional.
- Needs metadata or full text includes ambiguous, non-English, encoding-damaged, generic, apparatus-only, morphology-only, and otherwise adjacent titles. No inference from author reputation, citation context, or nearby records was used.
- Clearly out of scope is reserved for explicit title/type evidence of theory or simulation without new measurements, reviews/editorial records, bulk remote sensing or cloud microphysics, nucleation/freezing-only work, aggregation/riming/melting/frost work, surface/molecular analogues without a target growth outcome, or unrelated materials and subjects.
- Known local or acquired records were matched by normalized DOI/arXiv-style identifier and/or conservative normalized-title equality against the frozen local register, acquired source register, and reconciliation crosswalk. Matching does not imply inclusion, independence, or that the locally held artifact is the latest version.
- No abstracts, authors, reference contexts, full text, supplements, corrections, later versions, or external catalogs were consulted. No network access or downloads occurred.
- The input exposes two DOI collisions spanning four distinct OpenAlex identifiers. They remain separate because the requested deduplication key is identifier. Later work-level reconciliation may merge aliases only with explicit provenance.
- One unrelated materials title contained an unqualified phase marker prohibited by project terminology policy. The output display title omits that marker and carries `TITLE_POLICY_NORMALIZED`; the pinned input retains the captured bytes.

## Output integrity

| Output | Records | SHA-256 |
|---|---:|---|
| `/Volumes/snowcrystal/research-cache/phase8b-search/offline-title-triage-20260811-v1/citation-title-triage.jsonl` | 852 / 532659 bytes | `dfff67624d720af0baae8c0e4e6c9131b632c92482cf8579c7c03c6f9b9b7d0e` |

The exact SHA-256 of this Markdown file is reported in the handoff after the final bytes are written; embedding a file's own hash would change those bytes.
