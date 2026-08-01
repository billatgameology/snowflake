# Phase 6 source-currency and held-out-target audit (Rule 12)

**Status:** current primary-source audit completed 2026-08-01; target freeze still open. This record
supersedes the 2026-07-28 title/version-only pass, which explicitly had not read most later papers or
checked journal/errata sources. It does not edit the historical frozen table or upgrade any existing
artifact. The science-first replacement protocol must cite this audit and independently review the
selected target bytes, extraction and uncertainty before freezing.

## Method and cutoff

The audit checked current arXiv abstract/version pages, Libbrecht's official publication list
(observed last modified 2025-10-11), primary articles/PDFs where accessible, journal DOI metadata,
official corrigenda and data archives. It separated four questions that the old record conflated:

1. Is the cited source at its latest version?
2. Does later work supersede or qualify the extracted physical input?
3. Is a candidate observable structurally held out from CAK/M1 inputs?
4. Can the current free-crystal hex-prism solver make an apples-to-apples prediction?

“Held out” below means no explicit numerical reuse was found in the audited input derivation. It
cannot establish what an author informally knew. A later publication date is not sufficient if the
dataset reuses an input paper, shares M1's Nakaya tuning, or needs unimplemented geometry/physics.

## 1. Source currency

The repository's principal frozen arXiv sources are current at these versions:

| source | current version / publication | result |
|---|---|---|
| `1910.09067` morphology model | v2 | current |
| `1910.06389` *Snow Crystals* monograph | v2 | current |
| `1208.5982` attachment measurements | v1; J. Crystal Growth 377, 1–8, DOI `10.1016/j.jcrysgro.2013.04.037` | current |
| `1211.5555` comprehensive-model part 1 | v1 | current |

The official publication list contains no later Libbrecht snow-crystal paper after the June 2023
pair. Relevant later primary versions reviewed are:

| source | current | scientific bearing |
|---|---|---|
| `2004.06212` near −2 °C | v1 | dedicated warm-prism measurements; supports the digitized CAK anchors better than M2's simplified warm branch |
| `1912.03230` near −5 °C | v1 | reanalysis says the 2009 kinetic interpretation was largely incorrect and actual chamber supersaturation was not accurately known |
| `2009.08404` near −14 °C / broad CAK forms | v2 | primary SDAK/CAK forms and numeric anchors |
| `2011.02353` near −4 °C | v1 | warm SDAK qualification |
| `2012.12916` molecular SDAK | v1 | mechanism/scale qualification, not a replacement CAK table |
| `2109.00098` c-axis needle methods | v1 | geometry dependency for the 206-observation corpus |
| `2306.04042` faceting | v1 | later model qualification |
| `2306.13087` quantitative Nakaya / M1 | v1 | defines the Nakaya-tuned M1 model and shares the 206-observation needle corpus |

No reviewed later paper justifies silently replacing the frozen CAK table. The dedicated −2 and
−5 °C measurement papers support its warm anchors; M1/M2 are distinct modelling alternatives. No
explicit correction/erratum relation superseding the frozen CAK extraction was found. This is not
an exhaustive publisher-book errata search.

## 2. Dependency and circularity

- The CAK measurement paper `1208.5982` cites Takahashi et al. 1991 bibliographically, but fits its
  numeric parameters to its own low-pressure supported-facet measurements. Takahashi's quantitative
  `a(t)` and `c(t)` dimensions are therefore structurally held out from the CAK fit.
- M1 is explicitly chosen to reproduce the Nakaya habit sequence. Takahashi's numeric dimensions
  may be held-out observables for M1, but its plate/column category is not fully independent.
- Libbrecht and Arnold 2009 is not held-out CAK validation. The later −5 °C reanalysis says the
  original kinetic analysis was largely incorrect, actual supersaturation was not accurately known
  because of chamber depletion, and CAK is assumed in the reinterpretation. The −2 °C paper makes a
  related correction.
- The 206 c-axis-needle observations in `2306.13087` are in the paper that defines M1, hence in-sample
  for M1, and their needle seed is not the current regular hex-prism seed.
- Harrington and Pokrifka 2024 postdates M1, but its archive includes a Libbrecht 2013 row that is
  circular with P1. Any later use must freeze/reanalyse non-Libbrecht raw rows separately.
- Kuroda/Gonda and Gonda predate the current inputs and are external, but their geometry and omitted
  transport/thermal physics prevent current-model quantitative scoring.

## 3. Candidate matrix

| charter family | best audited primary target | independence | current-model compatibility | verdict |
|---|---|---|---|---|
| growth versus T and supersaturation | Takahashi et al. 1991, DOI `10.2151/jmsj1965.69.1_15`; corrigendum `10.2151/jmsj1965.69.2_251` | dimensions held out from CAK; habit partly in-sample for M1 | free fall and near-atmospheric air; water saturation only; different specimens at successive times; uncertain seeds; later riming/ventilation | **conditionally admissible partial target**, especially early −5.3 °C |
| size-dependent habit | Takahashi −5.3 °C hollow-column→sheath/needle sequence | dimensions external to CAK; categorical habit partly in-sample for M1 | ensemble at successive times rather than one trajectory; topology becomes load-bearing | **conditional**, with explicit ensemble/topology limits |
| pressure | Kuroda & Gonda 1984; Gonda 1976; Gonda & Gomi 1985 | external | substrate or gas-specific transport/thermal/supersaturation/size confounds | **no admissible current-model quantitative target** |
| prescribed history | Harrington & Pokrifka 2026 | postdates inputs; exact switch history | substrate-supported; rim width, step source and asymmetric transport absent | **no admissible target for current geometry**; leading future substrate-model target |

No one audited dataset currently satisfies all four families under the present geometry.

## 4. Conditional Takahashi target

Takahashi et al. 1991 used isolated crystals freely suspended in a vertical cloud tunnel near water
saturation and about 1010 mb, over −3 to −23 °C and 3–30 minutes. Reported temperature variation is
roughly ±0.2 °C early and ±0.4 °C later; cloud liquid water is about 0.1 g m⁻³ with mostly 5–15 µm
droplets. Specimens at successive times are different crystals, not longitudinal measurements of one
individual. The official corrigendum changes Figure 3 placement/issue metadata, not numeric results.

The −5.3 °C series is the leading present-model candidate: ventilation was reported unnoticeable
even at large size and the paper gives strong axial-ratio evolution. Hollow/sheath topology later
becomes important; failure to reproduce it must be reported, not hidden by scoring only dimensions.

The 2026 Penn State archive (DOI `10.26208/XJQK-R076`) contains machine-readable `a`/`c` values
digitized from Takahashi figures. Despite filenames containing `raw`, these are later digitizations,
not original instrument records, and they lack per-point dimensional uncertainty.

A defensible pre-registration must:

- compare `a(t)` and `c(t)` separately and describe the rows as an ensemble, not one-crystal history;
- independently redigitize or use the paper's ensemble fits, with digitization and temperature
  uncertainty propagated;
- convert water saturation through the registered Murphy–Koop-refereed table path, never the known
  invalid warm-end `sigmaWater()` difference form;
- freeze physical seed/initial-size mapping and stop before riming or ventilation invalidates the
  comparison;
- label M1's numeric dimension comparison as held-out observable under an in-sample habit class;
- state that this samples temperature along one physical water-saturation curve, not an independent
  two-dimensional `(T, sigma)` grid.

## 5. Pressure sources and unresolved discrepancy

Kuroda and Gonda 1984 (DOI `10.2151/jmsj1965.62.3_563`) measured substrate-grown crystals at −30 °C
in air at 0.3 and 250 Torr. At `sigmaInfinity = 3%`, low-pressure growth is nearly linear over roughly
10–160 µm while 250 Torr becomes nonlinear. Normal-rate comparisons use different reference sizes.
The plotted data are useful diagnostics, but the inferred pressure-dependent attachment coefficients
were challenged by later diffusion analysis; no electronic table or explicit plotted-point
uncertainty was found.

Gonda 1976 (DOI `10.2151/jmsj1965.54.4_233`) is free-fall but varies helium/argon across a broad
pressure range. The solver implements air through `D(P)`, not gas-specific diffusion and thermal
conductivity, and the article reports plot-level morphology frequencies rather than raw rates.

Gonda and Gomi 1985 (DOI `10.3189/1985AoG6-1-222-224`) gives a useful −30 °C instability boundary at
several pressures but is substrate-grown. Its primary prose reports lowest instability
supersaturations about 1.7%, 4.1% and 10.1% at `10^5`, `3.3×10^4` and `4×10^3 Pa`. The
Harrington/Pokrifka archive instead records 2.84±0.644% at “1000 hPa” and 5.83±0.84% at “300 hPa.”
The observable/definition/extraction mismatch is unresolved. **Do not freeze either archive threshold
until it is reconciled from primary figures and definitions.**

## 6. Prescribed-history result

The 2026 Harrington/Pokrifka article (DOI `10.1175/JAS-D-26-0016.1`) and archive
`10.26208/XJQK-R076` provide an exact schedule at −50 °C, about 972 hPa, 48% supersaturation followed
by 20% at 230 minutes, with `a`, `c`, min/max errors and rim width versus time. −50 °C is at the CAK
interpolation boundary. The blocker is physics/geometry: substrate-supported growth, rim width,
step-source location and asymmetric transport are quantitatively load-bearing and absent from the
current free-crystal solver.

The related 2025 paper (DOI `10.1175/JAS-D-25-0030.1`) also uses substrate/thermal-gradient growth;
only its −50 to −46 °C portion lies inside the current parameter domain. The 2024 article/DOI
`10.1175/JAS-D-23-0131.1` and archive `10.26208/YMMC-Z637` give compact/hollow transitions but no
crystal size in threshold rows, so cannot discharge size-dependent habit alone.

The targeted audit found no source combining all of:

1. free/isolated geometry compatible with the current seed;
2. exact time-varying T or supersaturation;
3. conditions inside the source-defined parameter domain;
4. dimensional/morphological time series with usable uncertainty.

This is a targeted-search result, not a theorem that no compatible experiment exists. Do not relabel
Takahashi's constant-environment ensemble or a qualitative movie as a prescribed-history target.
Science-first options are to implement and verify substrate/thermal/step-source physics, acquire a
compatible dataset, or leave this charter obligation explicitly incomplete.

## 7. Freeze consequences

- Freeze no held-out production target in this commit; the source audit precedes, rather than
  silently becoming, the protocol decision.
- Takahashi −5.3 °C is the leading conditional growth/size target and requires independent extraction
  plus uncertainty review.
- Pressure and prescribed-history targets are blocked for the current geometry. A diagnostic may run
  only if labelled non-transferable; it cannot discharge the charter obligation.
- Any new geometry/physics is an ADR/spec/implementation decision and requires its own numerical and
  evidence review before held-out scoring.

## 8. Review provenance and limits

Reviewer: OpenAI Sol-class Codex subagent with full shared request/handoff context, not involved in
Phase 6 authoring and not context-blind. It re-executed arXiv version queries, checked the official
publication list, read primary Takahashi/Gonda/Kuroda-Gonda/Gonda-Gomi sources, inspected DOI/archive
metadata and CSV rows for Harrington/Pokrifka 2024–2026, and traced dependencies against `1208.5982`,
CAK and M1.

It did not execute the solver, numerically reproduce any paper, perform an exhaustive world-literature
or publisher-book-errata search, contact authors, or access the full 2024 AMS article body. The 2024
archive and authoritative metadata were available; the threshold-definition discrepancy remains an
explicit blocker.
