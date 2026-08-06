# Phase 6 source-currency and held-out-target audit (Rule 12)

**Status:** reopened and corrected 2026-08-01; candidate bytes and extraction are locked, but no
held-out validation target is frozen. The first 2026-08-01 pass missed later Takahashi and
Harrison/Pokrifka papers that materially change target admissibility. The machine-checked
[`phase6-heldout-candidate-lock.json`](phase6-heldout-candidate-lock.json) now freezes the candidate
bytes, the independently reviewed manual transcription of corrected conditions, all usable
levitation traces, deterministic extraction, and rejected-row controls. Its verifier hashes the
source PDFs and archive bytes and independently re-executes the trace extraction; it does not parse
the corrected condition table from the PDF. Its `passEligible=false` field is load-bearing: the lock
prevents source drift but supplies no validation threshold.

This record supersedes the 2026-07-28 title/version-only pass and the earlier same-day statement that
Takahashi was conditionally admissible. It does not edit the historical frozen parameter table,
upgrade any evidence label, or authorize a production comparison. The science-first replacement
protocol may consume a target only after the missing geometry/transport systematic is bounded
without inspecting model output.

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
| Harrison et al. 2023, DOI `10.1175/JAS-D-22-0077.1` | journal article | effective-density and polycrystal qualification for frozen-droplet experiments |
| later columnar/substrate study, DOI `10.1175/JAS-D-25-0030.1` | journal article | geometry and support qualification; not a free-prism target |

No reviewed later paper justifies silently replacing the frozen CAK table. The dedicated −2 and
−5 °C measurement papers support its warm anchors; M1/M2 are distinct modelling alternatives. No
explicit correction/erratum relation superseding the frozen CAK extraction was found. This is not
an exhaustive publisher-book errata search.

### 1.1 Exact-metrology source currency

Checked 2026-08-02 against the current authoritative publications rather than relying on the
monograph for standards it does not define:

| adopted definition | current authority checked | result and provenance |
|---|---|---|
| `k = 1.380649 × 10⁻²³ J K⁻¹` | BIPM, *The International System of Units*, 9th ed., version 4.01 (June 2026), §2.2, printed pp. 124–125, Table 1; DOI `10.59161/AUEZ1291` | exact defining constant with no uncertainty; P1 authoritative exact definition |
| `T/K = t/°C + 273.15` | same brochure, §2.3.1, printed p. 130 | exact Celsius/kelvin relation; P1 authoritative exact definition |
| `1 atm = 101325 Pa` | 10th CGPM (1954), Resolution 4, Proceedings p. 79; DOI `10.59161/CGPM1954RES4E` | exact standard-atmosphere definition; P1 authoritative exact definition |

The BIPM landing page identifies version 4.01 as the June-2026 current revision. The exact decimal
definitions' binary64 representation is a P4 precision policy, not empirical uncertainty. The
separate diffusivity mapping remains composite: the monograph's `D_air ≈ 2 × 10⁻⁵ m²/s` is
an approximate P1 textbook property; `D ∼ P⁻¹` is a P2 source-stated relation; and associating
that approximate value specifically with exact one standard atmosphere is a P2
project-derived/model-inferred closure. The monograph says only "typical atmospheric conditions"
and does not print an exact 101325-Pa anchor.

### 1.2 Local source-cache inventory

The third-party bytes below were acquired on 2026-08-01. They live under ignored `research/` paths:
the tracked record is the stable identifier, byte count and digest, not redistribution of the source.
They were promoted from the mixed root `tmp/` cache after an inventory found no generated scientific
evidence there. To preserve useful local research work without mistaking it for evidence, the
remaining page renders, parse cache and one-off extraction dependencies were moved intact to ignored
`research/tmp/`. They remain transient/provenance-incomplete because their exact render/tool
environment was not recorded; nothing under that directory may support a claim or enter
`evidence/` without a new provenance record.

The post-promotion local-cache inventory was recomputed after the move (recursive regular files,
byte size from the filesystem):

| ignored local path | files | bytes | disposition |
|---|---:|---:|---|
| `research/tmp/pdfs/` | 12 | 18,213,837 | derivative audit/page renders; preserved, provenance-incomplete |
| `research/tmp/source-audit/heldout-search/rendered/` | 29 | 10,119,739 | derivative page renders; preserved, provenance-incomplete |
| `research/tmp/source-audit/heldout-search/extract-pdf.cjs` | 1 | 898 | one-off extractor; preserved as local tooling context |
| `research/tmp/source-audit/heldout-search/tooling/` | 789 | 33,376,804 | local extraction dependency/cache; preserved, not evidence |
| **remaining cache total** | **831** | **61,711,278** | ignored under `research/tmp/` |

Together with the nine promoted source inputs below (23,215,628 bytes), this reconciles the former
root cache to **840 files / 84,926,906 bytes**. No file in the 831-file remainder was classified as
generated scientific output.

| local cache path | stable acquisition identifier | bytes | pages / pinned members | SHA-256 | scientific role and status |
|---|---|---:|---:|---|---|
| `research/harrison-2016.zip` | Penn State Data Commons DOI `10.26208/dd1w-wa17` | 3,422,359 | 21 pinned members | `4901759b3f5f6d71759b31286db6103d9f7d9b23512c01237067c11da3be815c` | load-bearing candidate lock; not scoreable |
| `research/pokrifka-2020.pdf` | NSF accepted manuscript, DOI `10.1175/JAS-D-19-0303.1` | 4,016,872 | 56 pages | `5010ded8ee7c16178e5007c9228e2d0ab7785ec698ae77c2662cb3259b50fab1` | corrected conditions for candidate lock; manual table transcription |
| `research/takahashi1991.pdf` | J-STAGE DOI `10.2151/jmsj1965.69.1_15` | 8,910,942 | 16 pages | `2e5c6b492fcab7d1b3958be5a4c859fcd31174a1ac4865588ca48820bd4cd8eb` | non-gating size/mass diagnostic |
| `research/takahashi1991-corrigendum.pdf` | J-STAGE DOI `10.2151/jmsj1965.69.2_251` | 1,009,054 | 2 pages | `5297d387ee1c0e33944d9bdb0f6bd68a70a251e64f1f4b5f8e367e7b4c5946bb` | official correction; candidate lock |
| `research/harrington-pokrifka-2026.zip` | Penn State Data Commons DOI `10.26208/XJQK-R076` | 104,949 | 13 source members | `3fa016d36ae11dad221b2c9b300a5fe928ed253ac92dd8acdb2887291f32bc36` | history candidate; not scoreable |
| `research/takahashi-fukuta1988.pdf` | J-STAGE DOI `10.2151/jmsj1965.66.6_841` | 3,527,682 | 15 pages | `a4886bcc09ddfbc05d467a0b3ac5729e044723a2befcc05f20d5e77f18bc3659` | pressure context only; no matched target |
| `research/nelson-1998-soic-author-copy.pdf` | author PDF, DOI `10.1175/1520-0469(1998)055<0910:SOIC>2.0.CO;2` | 215,189 | 10 pages | `df67110fdb98eb29ce11512ac1ebc8019bddc72825fb14ce1dea94a7982cd060` | rejected current-model target |
| `research/bacon-baker-swanson-2003.pdf` | public PDF, DOI `10.1256/qj.02.04` | 1,270,112 | 25 pages | `f312a5a18889320c0be62d200c39db723bca2a1d68968b8ec308dc4789370530` | morphology reconnaissance only |
| `research/bailey-hallett-2002-conference-primary.pdf` | official AMS conference precursor | 738,469 | 10 pages | `7c2450c14aca3408b7ead8db243d0721979be1698cdad5c4479e3c8ffa3db38e` | context only; not the blocked 2004 journal article |

After promotion, the five-file verifier was re-executed from these `research/` paths and returned:

```text
SOURCE LOCK BYTES OK id=PHASE6_HELDOUT_CANDIDATES_2026_08_01 files=5 members=21 maxGap=0.9451000000000249s passEligible=false
```

That result proves byte/extraction continuity only. It does not make the candidate set pass-eligible.

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

## 3. Corrected candidate matrix

| charter family | strongest audited candidate | source independence | unresolved mismatch | verdict |
|---|---|---|---|---|
| growth versus T and supersaturation | Harrison et al. 2016 archive, corrected by Pokrifka et al. 2020 | direct single-particle mass ratios are not solver inputs | crystallography and shape were not observed; the present operator omits vapor-thermal latent-heat resistance | **candidate bytes locked; not scoreable** |
| size-dependent habit | Takahashi et al. 1991 −5.3 °C ensemble | mass/dimensions are external to CAK; category is partly in-sample for M1 | actual warm-run supersaturation, hollow rim width, seed state, and step-source location are unresolved | **diagnostic only** |
| pressure | Takahashi/Fukuta 860 mb versus Takahashi 1010 mb; Kuroda/Gonda/Gomi alternatives | external | pressure covaries with experiment, gas, substrate, liquid-water content, temperature drift, population, ventilation, or riming | **no quantitative target** |
| prescribed history | Harrington/Pokrifka 2026 step; Magee/Moyle/Lamb 2006 cycle | postdates or is independent of the solver inputs | supported/asymmetric growth for the first; sublimation, ventilation, latent heat, and unobserved crystallography for the second | **no current-model target** |

No audited dataset is presently apples-to-apples with the current single-crystal free-prism solver.
That is a source/model-scope result, not permission to widen an error bar until a comparison passes.

The classical morphology reference also does not supply WP2's required physical measurement size.
Libbrecht `1211.5555v1` Figure 1 defines regions only in temperature and ice supersaturation: it
reports no crystal size, growth time, scale bar, or size stratum. The later in-sample 206-observation
grid in `2306.13087v1` Figure 2 labels growth time and each panel's square field-of-view width
(164–2026 µm in the audited panels), but those widths are not reported crystal dimensions or a
common size stratum. The panels are subjectively selected 2-D projections with no stated span
uncertainty, and their c-axis needle seed is load-bearing. Borrowing a field-of-view width as crystal
extent or choosing a convenient common size is therefore forbidden. A future use would require a
pre-registered panel segmentation/digitization and matching e-needle implementation.

## 4. Locked levitation mass-growth candidate

Harrison et al. 2016, article DOI `10.1175/JAS-D-15-0234.1` and official archive DOI
`10.26208/dd1w-wa17`, contains direct mass-ratio histories for individually levitated
heterogeneously frozen droplets under constant reported temperature and pressure and modeled ice
supersaturation.
Pokrifka et al. 2020, DOI `10.1175/JAS-D-19-0303.1`, reanalyses those histories and corrects the
temperature, ice-supersaturation, and initial-radius table. The corrected source quotes a maximum
relative mass-ratio error of 5%; its condition ranges are marginal ranges, not probability
distributions. Their joint dependence is not reported, and ice-supersaturation uncertainty is partly
derived from plate-temperature uncertainty, so the lock does not define a scoreable Cartesian
prediction envelope or favorable corner.

The candidate lock includes all 16 archive traces that reconcile to the corrected heterogeneous
table. It fixes common observation times `{60,120,180,240,300} s`, finite six-column parsing,
nondecreasing time, positive mass ratio, median coalescing of equal timestamps, and linear
interpolation. The largest observed interpolation bracket is 0.9451 s. The verifier hashes the
accepted manuscript that supplied the manually transcribed condition table, but does not extract
that table from the PDF. It executes the
8,850-duplicate-timestamp `712k` case, rejects `heticegrowth_625.dat`, refuses to synthesize the
missing corrected −31.5 °C row, uses only direct mass ratio for the inconsistent `716d` absolute-mass
column, and pins the corrected `805l` radius.

This is the strongest growth-rate candidate, but it is not a frozen validation target. The particle
shape and crystallography were not imaged. The later 2020 and 2021 analyses report growth-mode and
lateral-facet behavior that a fixed D6h single-crystal seed does not represent. The printed
vapor-thermal/latent-heat resistance is source-specifiable without fitting and may be implemented in
a later numerical arm; the missing per-particle crystallography is not source-specifiable. A compact
isometric seed would be a sensitivity surrogate, not an observation.

The source particles were heterogeneously nucleated Snomax/HPLC-water frozen droplets, not observed
pristine faceted seeds. The apparatus review found no substrate or fall-ventilation mismatch: an
oscillatory button quadrupole traps each particle while a constant vertical electric field balances
gravity, the reported charge estimate is about an order of magnitude below the cited electrically
enhanced-growth threshold, and later work treats the slow-rotation correction as small. Those checks
make this candidate cleaner than the free-fall and substrate families; they do not identify the
frozen droplet's crystallography or shape.

## 5. Takahashi diagnostics and corrigendum

Takahashi et al. 1991, DOI `10.2151/jmsj1965.69.1_15`, used freely suspended crystals in a vertical
cloud tunnel over −3 to −23 °C. The official corrigendum DOI `10.2151/jmsj1965.69.2_251` changes
Figure 3 placement and issue metadata, not Table 2 or the reported pressure comparison. The source
reports roughly ±0.2 °C early temperature variation, mostly 5–15 µm droplets, and different ensemble
specimens at successive times.

The lock retains only a non-gating early-mass diagnostic at −5.3 °C. Table 2 gives
`m(t)=8.4e-9*t^2.00 g`, with `t` in minutes, hence `7.56e-8 g` at 3 minutes and `2.10e-7 g` at
5 minutes. Westbrook and Heymsfield 2011, DOI `10.1175/JAS-D-11-017.1`, supports ±10 s growth-time
uncertainty and typical ±20–30% experimental mass scatter. The lock uses the conservative 30% value
as a nonprobabilistic diagnostic range, composed explicitly as
`[0.7*m(t - 10 s), 1.3*m(t + 10 s)]`.

This row is not validation. Takahashi 2014, DOI `10.1175/JAS-D-14-0043.1`, leaves the actual warm-run
water supersaturation unresolved. The 2026 analysis also shows hollow-crystal growth depending on
unobserved rim width and step-source location. The paper's `a` and `c` digitizations are unpaired
ensemble rows, so combining them into a per-crystal aspect ratio would manufacture an observation.

## 6. Pressure candidates remain rejected

The same free-fall-tunnel lineage compares the present 1010 mb results with Takahashi and Fukuta
1988, DOI `10.2151/jmsj1965.66.6_841`, at 860 mb
and reports the lower-pressure crystals about 30% heavier on average at ten minutes. The comparison
is recorded as `TAKAHASHI91_PRESSURE_CONTEXT_V1`, not as a target: liquid-water content, temperature
drift, apparatus/run population, polycrystallinity, ventilation, and riming differ between studies.
Neither the ratio nor its direction isolates the implemented `D(P)` term, so no pass interval is
derived.

Kuroda and Gonda 1984 (DOI `10.2151/jmsj1965.62.3_563`) is substrate-grown; Gonda 1976 (DOI
`10.2151/jmsj1965.54.4_233`) changes helium/argon as well as pressure; Gonda and Gomi 1985 (DOI
`10.3189/1985AoG6-1-222-224`) is substrate-grown and its instability-threshold definition does not
reconcile with the later archive transcription. These are useful scientific context, not a matched
air-pressure experiment.

## 7. Prescribed-history candidates remain rejected

Harrington and Pokrifka 2026, DOI `10.1175/JAS-D-26-0016.1` and archive
`10.26208/XJQK-R076`, provides an exact −50 °C, about 972 hPa schedule with ice supersaturation
changing from 48% to 20% at 230 minutes. Its substrate, asymmetric vapor/thermal transport, rim-width
state, and step-source mechanism are quantitatively load-bearing. Selecting the source mechanism
whose prediction resembles its outcome would be circular.

The strongest omitted challenge found in a separate search is Magee, Moyle and Lamb 2006, DOI
`10.1029/2006GL026665`: 35 relative-mass observations of one freely levitated particle through a
cyclic humidity history near −50 °C and 973 hPa. It still cannot score the current solver. The cycle
alternates growth and evaporation while the operator returns zero for nonpositive surface
supersaturation; the schedule is figure-only; crystallography was unobserved and likely
polycrystalline; and vertical flow, ventilation, and latent heat are omitted. Selecting only a later
supersaturated suffix would inherit an unknown state produced by the unsupported evaporation.

The targeted search also checked supported cyclic-growth work, qualitative filament experiments,
constant-environment free-particle experiments, cloud-chamber trajectories, and Libbrecht videos.
None combined compatible free-single-crystal geometry, an exact schedule, in-domain conditions, and
longitudinal observables with usable uncertainty. This is the measured scope of the search, not a
theorem about every experiment that could exist.

## 8. Second candidate audit — Nelson, Bailey–Hallett and Bacon (2026-08-01)

A second non-author primary-source search tested three apparently cleaner candidates. Publicly
available primary bytes were acquired into the local source cache and checked completely where
available:

| source | acquired bytes | pages | SHA-256 | result |
|---|---:|---:|---|---|
| Nelson 1998, DOI `10.1175/1520-0469(1998)055<0910:SOIC>2.0.CO;2`, author PDF `https://www.redmondphysicalsciences.com/nelson1998Subl.pdf` | 215,189 | 10 | `df67110fdb98eb29ce11512ac1ebc8019bddc72825fb14ce1dea94a7982cd060` | rejected for current growth solver |
| Bacon, Baker & Swanson 2003, DOI `10.1256/qj.02.04`, public PDF `https://www.laucksfoundation.org/articles/baconqjrms2003.pdf` | 1,270,112 | 25 | `f312a5a18889320c0be62d200c39db723bca2a1d68968b8ec308dc4789370530` | closest independent morphology reconnaissance; not a gate target |
| Bailey & Hallett 2002 official AMS conference precursor, `https://ams.confex.com/ams/pdfpapers/42237.pdf` | 738,469 | 10 | `7c2450c14aca3408b7ead8db243d0721979be1698cdad5c4479e3c8ffa3db38e` | context for the 2004 journal study; not substituted for it |

The Bailey–Hallett 2004 journal article is DOI
`10.1175/1520-0469(2004)061<0514:GRAHOI>2.0.CO;2`. The publisher PDF returned HTTP 403 and no
repository copy was found, so this audit makes no byte/hash claim for that article. Its indexed
publisher full text was reviewed alongside, but not conflated with, the hashed official precursor.

**Nelson 1998.** Roughly 10 µm crystals were frozen onto roughly 5 µm glass capillaries, grown to
about 100 µm, then sublimated while stationary in unstirred air. The reported sublimation domain is
−18 to −0.1 °C and 0.05–5% undersaturation, with temperature ±0.03 °C and undersaturation ±0.03%; no
quantitative pressure is reported. Its dimension-versus-time figures are useful future benchmarks,
but the present solver forbids nonpositive far-field supersaturation, cannot remove ice, and omits
capillary support and latent heat. The approximately 100 µm preparation size is not a growth target.

**Bailey–Hallett 2004.** Crystals grew on 50–70 µm soda-lime glass filaments in a static diffusion
chamber. Temperature and pressure covary from about −20 °C/550 hPa to −70 °C/150 hPa. Habit-specific
growth fits use 10–50 measurements and generally span 150–300 µm, but many observations are
polycrystals, twins, rosettes or defect-controlled layered structures; substrate stimulation is
unresolved, thermal effects are included, and several temperatures lie outside the solver domain.
This is neither a single-crystal LK target nor an independent pressure experiment. The 150–300 µm
fit support is not one common endpoint.

**Bacon et al. 2003.** More than 100 particles were electrodynamically levitated in 1 atm air from
−4 to −38 °C, typically to 100–200 µm. Optical size accuracy is about ±5%, resolution about 2 µm,
and aspect-ratio uncertainty about ±0.2. Initial particles were frozen droplets, irregular frost,
or unresolved frost remnants and could be polycrystalline. Decisively, chamber supersaturation was
not independently imposed/measured at the particle: it was inferred by fitting the particle's own
mass-growth curve to a spherical heat/vapor model. That mass curve therefore cannot independently
validate a solver given the inferred supersaturation. Morphology conditional on that drive remains
reconnaissance, but needs recovered per-particle data, set-valued initial-state treatment and an
explicit thermal bound/model before it could become a statistical target.

These sources justify only labeled, non-transferable planning probes at 100, 150, 200 and 300 µm.
They do **not** justify freezing any one of those values as the charter's apples-to-apples habit
measurement size. No target in this second audit closes any of the four held-out families for the
current solver.

## 9. Freeze consequences

- The candidate-source lock is complete and machine-verified against five external files and 21
  Harrison archive members. The PDF checks are byte/hash checks; corrected conditions are a
  digest-pinned manual transcription, not a machine extraction from the PDF. It remains
  `passEligible=false`.
- WP1's validation-target freeze remains open. No R15 or held-out production row may start from this
  lock alone.
- WP2's physical-size freeze is independently source-blocked for the current free-prism/classical-
  Nakaya geometry; the reference supplies no maximum dimension or size stratum.
- A source-specifiable latent-heat arm can narrow the Harrison mismatch, but cannot infer the missing
  per-particle crystallography. Substrate or sublimation work similarly does not erase the other
  candidates' unobserved initial state.
- The pressure and history obligations must be reported as scientifically blocked unless a matched
  source or independently specified new geometry/physics is frozen before execution. They are not
  resource-deferred and must not be marked passed.
- Any new physics is an ADR/spec/implementation decision with its own numerical and evidence review.

## 10. Review provenance and limits

The principal WP1 reviewer was OpenAI `gpt-5.6-sol` at ultra reasoning, non-author but sharing the
full repository context. It independently rendered the official J-STAGE paper/corrigendum and NSF
accepted manuscript, hashed and parsed every Harrison archive member, recomputed the 16 trace
interpolations and Takahashi diagnostic ranges, inspected the later 1999/2011/2014/2020/2021 and
2024–2026 source lineage, and traced circularity against CAK and M1. A second non-author reviewer
searched independently for prescribed-history candidates and identified Magee 2006 as the strongest
omitted challenge.

The reviewers did not run the solver, recover the missing experimental trace, prove particle
crystallography, resolve `716d`'s radius/absolute-mass inconsistency, derive probability
distributions, exhaust every world publication, contact authors, digitize the Magee figures, or
implement latent heat, sublimation, ventilation, substrate, polycrystal, rim, or step-source physics.
The required source-byte verifier was then executed locally by the integrating reviewer; its pass
does not resolve any of those scientific limits.

The second candidate reviewer was OpenAI `gpt-5.6-sol` at ultra reasoning, non-author with full
repository context. It independently downloaded and hashed the three public PDFs above, checked
their page counts, extracted the complete relevant text, visually reviewed methods/apparatus/images/
tables/results, and inspected the Bailey–Hallett indexed publisher rendering. It did not digitize
plots, recover unpublished/raw particle tables, contact authors, acquire the blocked 2004 journal
PDF, run the solver, or implement thermal, sublimation, substrate, polycrystal or defect physics.

## 11. WP1 source-search and extraction register — rejected V4/V4.x history

**Execution state:** `CLOSED AS REJECTED HISTORY; DO NOT EXECUTE, REPAIR, REPIN, OR DISPATCH; NO
REQUEST, IMPORT, ACQUISITION, PUBLICATION, PRODUCTION SOLVER ROW, OR TAX2 MEASUREMENT AUTHORIZED`.
Rejected v2, v3, catalog-v2, catalog-v3, and v4 identities remain immutable failed-design provenance
in `research/phase6-wp1-review-findings.json` and their recorded recovery bundles. V4.1 corrects the
scientific register while exact payload/request/attempt schemas, parsers, crash states, fixture bytes
and publication wrappers remain part of the one combined committed freeze. An author correction is
not an acceptance verdict, and no prose or review-record status can self-authorize execution.

The registry deliberately has `currencyAsOfUtc=null`: the prospective currency-search upper cutoff
has not yet been clock-stamped. Design review may inspect these null candidate bytes, but final
combined-freeze acceptance and dispatch remain impossible. Before those acceptance reviews, observe
UTC, replace null with that exact instant, and review the changed protocol/code bytes; this requires
no provider request and does not claim a search ran. After authorized execution,
`currencyCoverageAsOfUtc` is independently derived for each closed subject universe and may remain
null/unresolved. It means only that every registered provider/route member was observed through the
stated instant; it is never an exhaustive-world-literature theorem. Filling the cutoff after an
accepting review would change the reviewed protocol and is forbidden.

### 11.1 Governed inputs and authority

The active candidate has four inputs with different jobs:

| input | authority |
|---|---|
| this Section 11 | scientific meaning, admissible claims, evidence and review boundary |
| `research/phase6-wp1-search-registry.json` | exact routes, queries, finite caps, eligibility/currency dates, source conversions, scientific admission rules, checks and negative-control intent |
| `research/phase6-wp1-independence-operands.json` | exact CAK, M1 and M1-no-dip source/data operand universes |
| `research/phase6-wp1-review-findings.json` | immutable rejected-candidate identities, individual finding text, originating-review provenance/limits, and the exact finding universe every successor review must disposition |

The two base plans are separate. Yamashita has `12 × 9 = 108` query/route combinations and 168
initial page requests: each query expands to 14 fixed/first pages. Pressure has `15 × 9 = 135`
combinations and 210 base-page requests, plus two fixed resolution requests for each of six DOI
seeds, for 222 initial requests. Response-derived continuations are not miscounted as initial
requests. The registry carries those integers and every finite page/record/author/version/acquisition
cap. Exact byte/hash identities are computed by the combined-freeze record from the then-current
files; this mutable candidate does not report its own stale size or digest. The registry pins the
v4.1 catalog candidate and its exact hash domain. Both remain unaccepted until a fresh mapping-by-
mapping non-author review closes with zero blockers and zero should-fixes.

If prose and a machine-readable input disagree, execution stops; neither silently wins. Correct the
proper authority, obtain a new exact-byte review, and re-freeze before a request. A later provider
API change may produce an access limitation, but it does not authorize a changed route, query, cap,
date, scientific rule, or parser.

The common publication/index implementation is the existing
`runner/src/gate4-evidence.ts` `canonicalJsonBytes`, `publishEvidenceBundle`, and
`verifyEvidenceBundle` seam. WP1 may share those byte/hash/canonical-JSON primitives between producer
and verifier. It may not share screening, scheduling, identity, assessment, currency, independence,
pressure, uncertainty, source/model-compatibility, or verdict reducers.

### 11.2 Cutoff, request construction and bounded scope

Two dates answer different questions. `historicalEligibilityCutoffUtc=2026-08-02T23:59:59Z` fixes
which primary experiments may enter the historical source result. `currencyAsOfUtc` is the
prospectively frozen upper instant through which corrections, retractions, versions and later
same-author work will be searched after authorization; it is not a coverage claim. A
primary item made public after the historical cutoff is retained as `post-cutoff-follow-up` but is
not an eligible experiment. A currency-derived item may postdate that cutoff and affect the older
source's currency through the reviewed as-of instant, but it never becomes a candidate and never
recurses into citation traversal or another Rule 12 family. A null, post-review-filled, or
freeze-inconsistent currency-as-of value forbids dispatch. The result-side
`currencyCoverageAsOfUtc` is earned separately for candidate-primary, catalog-empirical, and exact-
authority subjects only when every required route/subject/bound/family supports that coverage.
Missing or earlier coverage makes the affected component unresolved but is not a pre-dispatch
cycle. Even a complete registered result describes bounded observations of the named providers and
source links, not guaranteed completeness of their indexes or of all literature.

Crossref and OpenAlex apply each entry's historical date range server-side; other route cohorts are
screened locally from preserved source/provider dates. Missing or ambiguous dates remain leads and
make a negative claim unresolved. Every result is bounded by the registered finite caps and is never
called a complete literature census.

Registry query strings are Unicode NFC. Substitute decoded placeholder values, then UTF-8
percent-encode once with spaces as `%20`. No stemming, synonym addition, date adjustment, alternate
credential, or substitute endpoint is allowed. Direct endpoints use the registered `User-Agent` and
`Accept`; manual/opaque routes record the observable request and result. Redirects, final URL,
non-secret response headers, status, UTC times, returned/advertised counts, continuation and cap
state are retained. Authentication is forbidden. A credential requirement is a terminal access
limitation.

The registry fixes the nine route templates, query arrays, fixed/first pages and caps. The combined
code freeze owns exact request IDs, canonical keys, URL construction, provider projections/rank,
Unicode/identifier reduction and immutable stage/attempt schemas. It must reconstruct the two exact
initial sets above, reject unknown or duplicate inputs, and derive later stages only from complete
governing facts. No wall-clock, arrival, filesystem, locale or display order may change scheduling.

Each route starts from the exact fixed/first pages in the registry. Crossref's two offsets and Google
Books' five starts are always initial requests. OpenAlex, J-STAGE and WorldCat continuations are
children of the lowest-ordinal governing parent and bind its request ID, response-byte SHA-256, raw
continuation hash and resolved value. A missing/malformed/repeated/cyclic continuation is
`access-incomplete`; a remaining continuation beyond a record/page cap is `cap-incomplete`. Manual
next links remain on the registered origin. Every GET redirect is recorded, permits only the five
registered status codes, stays credential-free HTTP(S) on an allowed origin, and terminates within
ten hops; an invalid chain cannot create children. Fixed-page totals above the record cap are
`cap-incomplete`, not a negative result.

Citation traversal uses exact roots and two unmixed breadth-first graphs per entry. Every occurrence
and relation remains visible, but scheduling uses one canonical strong-ID or reviewed-title-SHA-256
subject identity at its global lowest depth across all roots in that entry/direction. A same-depth tie
uses the registry's exact parent tuple; a deeper recurrence never dispatches again. This applies to
title-only subjects as well as strong identifiers.

Before network traversal, the four Yamashita local segment roots execute the registered offline
`local-segment-relation-extraction-v1` stage against exact source bytes and locators. The reviewed
Figure 6.22/7.21 relations pass through bibliography key `[1987Kob]`, whose reviewed title-only
subject is the 1987 Kobayashi–Kuroda book; that resolved book becomes a depth-zero publication root.
The later 2004 Figure 8 root remains context-only. Missing, unreadable, unreviewed, or capped local
relation evidence makes the Yamashita lineage unresolved rather than letting a display key or an
unrelated publication substitute.

Pressure begins with all six DOI seeds—even when duplicated by base search—plus identity-pass
included base leads. A backward graph unions Crossref/OpenAlex references, sorts and caps them as
registered, and expands each globally first-depth subject through the entry depth. A forward graph
first obtains exactly one governed OpenAlex work identity, retains at most 200 publication-ordered
citing works, and expands only identity-pass included leads. No mixed backward/forward path is
allowed. Rule 12 results are terminal currency context and cannot enter either graph.

An identity-pass `include-acquire` assessment also creates one finite source-acquisition stage. Its
initial locator set is derived only from governing provider/source records and stable identifiers,
with at most 20 locators; reviewed source links from captured landing bodies may add at most 20
depth-one children, and deeper link traversal is forbidden. One immutable manual-import slot per
subject records either governed pre-obtained bytes or `not-provided`. Every locator, child, and slot
must terminate. No metadata occurrence is primary-admissible until readable source bytes, complete
inventory, evidence segments, and language review close; source-negative success cannot omit this
acquisition universe.

### 11.3 Restartable attempt journal

All working state and third-party bytes live under ignored
`research/tmp/phase6-wp1-source-search-01/ENTRY_ID/`. They are useful research material, but become
evidence only through the tracked descriptors and independent reduction below.

This register does not pretend to define exact file keys/discriminators or race behavior in prose.
The reviewed combined code freeze must supply strict schemas, create-exclusive reservation and
immutable-result reducers, terminal/retry classes, concurrency ordering, recovery, import formats and
fixtures. Until that exact code and transitive closure receive 0/0 reviews and freeze, the journal is
not executable and no directory may be prepared with real provider/source data.

For each request, the executor reserves the lowest unused attempt ordinal `0000` through `0003` by
create-exclusive canonical reservation file. Response bytes first write to a sibling `.partial`,
flush and close, rename to the final body path, then reopen/hash. A canonical result record is also
temporary-file + flush + rename and references that exact body descriptor. A no-response result has
canonical error bytes rather than a fabricated HTTP body. The initial attempt plus at most three
further attempts is the total bound.

A reservation without a valid result is `outcome-unknown`, consumes its ordinal, and may be followed
by another attempt. Orphaned partial/body/result files are retained, hashed in a subsequent recovery
observation, and never parsed as evidence. A repeated GET after an unknown outcome is explicitly
permitted and visible. If more than one valid terminal response exists, the lowest ordinal governs;
all others remain disclosed and cannot drive pagination. Retryable `429`/registered `5xx` responses
use an integer `Retry-After` only from 0 through 60 seconds, otherwise the registry's 5/20/60-second
wait for that retry ordinal. Exhaustion yields `access-incomplete`, never search-negative success.

`progress.json` may cache a view, but is disposable and carries no authority. Resume reconstructs
plans, reservations, results, bodies, recovery observations and outstanding requests from immutable
files. A request skips only when its governing terminal attempt and bytes reopen and validate. This
is ordinary idempotent read retry, not exactly-once transport. The implementation must prove these
properties with killed-child and concurrency fixtures rather than inheriting them from this prose.

### 11.4 Occurrences, identity and assessment revisions

Every returned record remains an occurrence; the combined code freeze owns its exact content-bound
identity and provider projection. Initial screening uses only complete parsed title,
abstract/subjects/topics and author strings under the registry vocabulary. Insufficient
metadata becomes `include-citation-lead`; it is never excluded merely for lacking an abstract.
Opaque supplemental results cannot exceed citation-lead status until inspectable primary bytes are
acquired. `include-acquire` is a scheduling disposition, not primary-source admission: it creates the
finite acquisition universe in §11.2, and the assessment remains non-admissible until every required
source-byte, inventory, evidence-segment and language-review condition closes.

Identity is recomputed from the complete graph, independent of arrival. Strong namespaces are those
listed in the registry. Each work-exclusive namespace permits one normalized value; arXiv permits
several explicit versions only for one base identifier. An overfull connected component quarantines
every occurrence separately with `identity=fail`. A component with a usable nonconflicting strong
identifier is `pass`. Title/first-author/year or raw-hash fallback is `unresolved`, never proof of
identity. Assessment can add evidenced strong identifiers but cannot erase captured identifiers or
conflicts. Component display keys never schedule requests.

Exact assessment/contributor schemas and stable identity fields belong to the combined code freeze,
not this prose. Scientifically, revisions form one immutable acyclic successor chain per candidate
with exactly one tip. A fork, gap, cycle, ambiguous merge or second tip makes the candidate
unresolved; no producer may choose a convenient branch. Only that unique effective tip schedules
work and governs science. A successor can add a correction but cannot delete requests, source bytes,
relations, segments, claims, limitations, failures or prior review findings.

A corrected, superseding or retracting publication is a new immutable source plus a reviewed
relation, never an in-place replacement. The original remains historical. A correction/supersession
becomes effective only after both sides and every changed load-bearing value are reviewed; otherwise
the result is unresolved. A reviewed retraction is definitive fail only for that fully inventoried
immutable source candidate or exact authority subject; it does not classify another candidate,
another arm, or undiscovered literature and does not stop discovery.

Candidate-global triggers require positive reviewed evidence about that source: wrong phenomenon or
gas, a complete matched-pressure experiment with fewer than two distinct pressures, a required-field
confound, unsupported physics, a fabricated/detached row, or candidate-global fitted/imputed source
input. Empirical-data reuse and outcome-based project selection are instead reduced separately for
CAK, M1 and `M1_NO_DIP_ABLATION`. An overlap affects only the arm whose operand, data family, source
node, or project-selection record is implicated; it cannot fail another arm by association. Missing,
inaccessible or incomplete evidence is unresolved at the same candidate/arm scope, never definitive.
A later revision cannot rehabilitate an immutable candidate or affected arm by erasing or relabeling
the trigger; a corrected/superseding source is a distinct candidate, and changing the rule requires a
reviewed protocol successor.

Each source descriptor has exact artifact bytes/hash/media type/stable identifier and availability.
An acquired container's inventory partitions every page/member into reviewed relevant, reviewed
irrelevant, or unreadable; counts and IDs must exactly cover the container. A quantitative claim
cannot use an authoritative-external/null-byte node, metadata-only lead, unreadable member, or
unreviewed machine output.

Each evidence segment binds one source artifact, structured page/table/figure/row/paragraph locator,
original extracted-text byte count/SHA-256, extraction tool/version, optional translation byte
count/SHA-256/tool/version, and reviewer/contributor ID. The ignored extracted bytes must reopen.
Every load-bearing citation, identity, scheduling, methods, condition, output, uncertainty,
currency, independence and solver-compatibility claim references a nonempty segment set. OCR or
translation is `adequate` only after the named reviewer compares it to the inspectable source with
the stated language competence. Citation evidence is claim-bearing; it has no metadata bypass.

For any non-English load-bearing segment, including numeric headers, captions, footnotes, legends,
apparatus descriptions and exclusion context, an adequacy reviewer with the exact attested BCP-47
language competence must inspect the original rendering. That reviewer has a different contributor
and session from the extractor/OCR/translator. OCR or machine translation may assist but cannot
attest itself, and a numeric table is not language-free. If competent original-byte review is
unavailable, retain the source/lead and mark its claims unresolved; do not exclude it from translated
metadata alone.

### 11.5 Currency and held-out independence

Rule 12 has three closed, non-substitutable subject universes: every unique effective included
primary-source candidate; the exact active catalog empirical-publication nodes; and the exact
definition-authority subjects required by the catalog. The authority universe is explicitly the BIPM
SI Brochure 9th edition version 4.01 subject (covering three descriptors) and 10th CGPM Resolution 4
subject (covering the standard-atmosphere descriptor). A generic candidate-currency result cannot
satisfy an authority subject, and an authority result cannot satisfy empirical-source currency.

For every distinct source-supported published/issued/print/online date, expand `YYYY` to January 1,
`YYYY-MM` to its first day, and retain `YYYY-MM-DD`; an absent, seasonal, quarterly, ranged or
malformed date uses the entry lower bound and forces unresolved. No supported bound may be deleted.
The upper date is the UTC date of the prospectively reviewed `currencyAsOfUtc`.

Each subject/bound constructs every registered family rather than relying on a template that an
executor may ignore:

- The exact title plus one ASCII space plus each correction term runs on every correction route.
- One governed OpenAlex work resolution exists for every subject. Every bound then has one forward
  cursor root and at most one continuation; absent or ambiguous work identity is a terminal
  unresolved family member, not an omitted request.
- Every source-listed author, up to 50 in source order, gets both fixed Crossref exact-author/title
  pages at every bound. Its OpenAlex author ID comes from the governed subject-work authorship or one
  exact `openalex-author-resolve-v1` request. ORCID is preferred; otherwise exact reviewed name,
  affiliation and source-order evidence must identify one result. Zero or multiple plausible IDs is
  terminal `author-id-unresolved`; no producer may choose or drop the author. Each evidenced ID gets
  one same-author cursor root and at most one continuation at every bound.
- Every reviewed source/provider publisher or repository version URL, up to 50 per subject, runs
  once with `version-link-direct-v1`, its frozen Accept header, captured origin, same-origin redirects,
  one raw-media descriptor and no continuation.
- Every exact-definition authority subject executes the same correction, forward, author and version
  construction independently and feeds only the authority-currentness component.

The registry gives the exact cardinality formula in terms of distinct bounds, selected authors and
version links. Every zero/ambiguous construction receives a terminal record. Exceeding a cap is
`cap-incomplete`; insufficient relation metadata is unresolved, not irrelevant. Currency-derived
records are terminal and never create a citation or second Rule 12 family. The reduction uses every
required subject/bound/family terminal and reviewed relation. A reviewed correction/supersession uses
§11.4; a reviewed retraction fails only its fully inventoried immutable subject. Verified coverage is
bounded registered-provider observation through the cutoff, not an exhaustive literature claim.

Independence is not a one-row or candidate-global assertion. First inventory the candidate's complete
reviewed source IDs, authors, experiment/apparatus/population IDs, raw and derived data families,
digitizations, transformations, selection history and proposed validation claims. For an arm, the
empirical edge universe is every operand in `catalog.arms[arm]`—12 CAK, 14 M1 and 12 no-dip—and every
mapped data-family/source-support edge. Separately, every affected arm must inspect and disposition
all six byte-bound project-selection records: ADRs 0030, 0036 and 0040, the current parameter table,
the executable parameter implementation, and the Phase 6 protocol implementation. Candidate data or
outcomes used in any affected input, interpretation, intervention, arm, domain or scoring choice are
overlap for that arm only. Missing review is unresolved.

Shared exact definitions do not count as empirical overlap, but their authority provenance and
currency are separate mandatory components. Local digitization/interpretation bytes and project
records have their own integrity/review component. Promotion is a seven-clause per-arm conjunction:
empirical independence, project-selection non-reuse, exact-definition authority, empirical-source
currency, authority currency, local-lineage integrity, and catalog integrity must all pass. One
unresolved clause blocks promotion without rewriting another component's measured verdict.

The catalog's `generatedFrom` hash domain is exact: the repository-root-relative path must name a
regular file at that spelling; symlink, junction, reparse, case and alternate-path substitution are
rejected. Decode strict UTF-8, reject BOM/malformed bytes/lone carriage returns, convert only CRLF
pairs to LF, perform no Unicode normalization, preserve terminal-LF presence, then SHA-256. At this
unexecuted candidate, CAK empirical independence remains unresolved on
`SRC-1208.5982V1-MISSING`; M1 and no-dip additionally remain unresolved on
`SRC-2109.00098V1-UNREADABLE`. BIPM/CGPM authority/currentness, empirical-source currency,
project-selection comparison and catalog acceptance are separate unresolved blockers. No arm is
promotion-eligible.

### 11.6 Matched-pressure quantitative contract

At least two mapped canonical pressure values in one match set must be unequal. They come from the same
experiment or source-demonstrated common protocol, with background gas explicitly air. Pressure is
the only allowed varied field. Gas composition; temperature and history; supersaturation
definition/value/history; duration/exposure; apparatus/chamber; initial particle, population and
crystallography; support/ventilation; observable; sampling; and censoring must have identical
canonical values or an explicit reviewed statement that the protocol held them constant. Overlapping
uncertainty intervals do not prove equality. A pressure-specific measured difference in any of those
fields is a confound, not an allowed adjustment.

Preserve every printed numeric lexeme and locator. A reviewed, traceable normalization may express
ordinary signed decimals, e/E notation, coefficient-times-ten-power notation or a source-explicit
decimal comma as the registry's exact rational; ambiguous punctuation/grouping is unresolved, never
guessed. Apply only registered affine unit conversions and rederive every normalized input/output
from the immutable transcription plus reviewed source segment. Fabricated, detached, silently
converted or differently aggregated rows are definitive fail.

Screening recognizes `mmHg`, `mm Hg`, and punctuation-normalized `mm-Hg`, so those ordinary forms
cannot be excluded as false negatives. They are deliberately `recognized-unmapped`: this protocol
does not establish that a source's applicable millimetres-of-mercury convention is exactly the
registered Torr conversion. The exact lexeme and evidence remain, but no canonical `pressurePa`,
distinct-pressure witness, matched-pressure verdict, or LK-compatibility result may be emitted from
that unit. Only a separately reviewed successor with an applicable authority, definition, conversion
and uncertainty may map it.

Pairing is one of three source-evidenced designs: complete same-unit pairs, independently sampled
populations with complete counts/censoring, or a shared-control/repeated-measures design with raw
values or sufficient covariance. Never assume covariance zero. Derive paired covariance/differences
from complete linked raw values, retain a source-stated covariance with type/coverage, or mark the
comparison uncertainty unresolved. Zero covariance is allowed only when reviewed design evidence
establishes independence. Source-stated intervals retain their type and coverage; any derived mean,
variance, standard error, covariance, paired difference or instrument combination uses exactly one
registry operator, complete observation IDs and no silent censoring. Model output never chooses an
uncertainty or tolerance.

The rejected `instrument-repeat-rss-v1` operator is retained only as failed-design provenance because
its variance sum silently set instrument/repeat covariance to zero. The active
`instrument-repeat-covariance-v2` operator includes twice the exact instrument-versus-repeat-mean
covariance. That operand must be source-stated with type/coverage, derived from complete linked raw
calibration/observation values, or set to zero only with reviewed design evidence of independence;
otherwise the uncertainty is unresolved. Its complete covariance matrix must pass the registered
exact positive-semidefinite test.

This search can record only source compatibility. Potential LK compatibility requires finite
`temperatureC` in `[-50,-1]`, finite positive ice-relative `sigmaInfinity`, finite positive
`pressurePa`, finite positive `durationSeconds`, and source-evidenced air. Water supersaturation
needs a prospectively frozen conversion. A future bridge must use Phase 6's monopole-matched far
field and establish continuum Fickian ordinary-air diffusion plus the specification's quasi-static
`v_n·L/D ≪ 1` condition from source-bound inputs. Because this repository has no registered
mean-free-path/Knudsen operator or numerical transport threshold for this comparison, the future
bridge must freeze cited evaluators, thresholds, run-wide maxima and refusal rules before model
output. It must refuse forced convection/ventilation, sublimation, substrate contact, liquid water/
riming, latent-heat control, needle/filament support, polycrystal, defect, step-source or unobserved-
crystallography dependence absent a reviewed physics extension. Missing inputs are unresolved, not
fitted, imputed or chosen from outcomes.

There is deliberately no registered source-to-model observable mapping. The five v3 mappings were
withdrawn: transverse trigger extent and its aspect-ratio denominator were nonobjective under 60°
rotation, while occupancy extents lacked a frozen partial-interface physical-span operator. Even a
complete, current, independent source record stops at `source-compatible-bridge-required`—never
`scoreable`, `passEligible`, target-ready, solver-ready or validation evidence. Before model output,
a successor must freeze exact observation IDs to CLI argv, arm, domain, far field, seed/population,
time, checkpoint, objective physical observable, aggregation, covariance, uncertainty and refusal
rules, then receive adversarial review. This is also a present implementation block: `grow-lk`
exposes no pressure flag and supplies 101325 Pa, so a varying-pressure source cannot be executed until
the successor binds pressure through argv, solver state, checkpoint header and independent verifier.

### 11.7 Entry-specific scientific questions and stopping

#### `YAMASHITA-FREEFALL-LINEAGE-01`

**Question.** Which original Yamashita primary publication or author-controlled dataset underlies
the diameter/thickness measurements after 200 seconds of free-fall growth reproduced through
`[1987Kob]`, and what pressure, temperature, supersaturation, growth time, apparatus/cloud,
seed/population/crystallography, dimension definition, sample size and uncertainty did it report?

The byte-locked roots are official `1910.06389v2` Figure 6.22 (printed p. 234 / PDF p. 235), Figure
7.21 (printed p. 268 / PDF p. 269) and bibliography `[1987Kob]` (PDF p. 508), plus later reproduction
`2004.06212v1` Figure 8. `[1987Kob]` resolves to T. Kobayashi and T. Kuroda, *Snow Crystals:
Morphology of Crystals—Part B* (1987); it is a backward-trace lead, not the original source.

Inspect book credits/captions/notes/references connected to those curves. A qualifying candidate's
publication date, and the date of the experiment or author-controlled dataset it reports, must be no
later than `1987-12-31`. Admission requires a reviewed source-byte chain beginning at Figure 6.22 or
Figure 7.21, passing through the `[1987Kob]` bibliography member and the reviewed 1987 book subject,
and terminating at that candidate. The candidate itself must contain inspectable experiment/method/
data or be an author-controlled dataset. The 2004 Figure 8 reproduction, a review, textbook, later
publication, unrelated Yamashita work or uncited curve cannot qualify by itself. A missing date or
missing lineage edge remains unresolved, never inferred from a title or outcome. Stop only after all
108 base combinations have their
168 fixed/first-page requests in terminal state, every response-driven child closes under §11.2, each
backward-only graph terminates through depth three, each forward-only graph terminates through depth
two, every one-shot Rule 12 family terminates, and every included source is reviewed or explicitly
inaccessible. The outcome is a source/conditions record requiring the future bridge, or a bounded
negative/access/cap limitation. Recovery alone never makes a validation target.

#### `MATCHED-AIR-PRESSURE-01`

**Question.** Is there a primary snow-crystal deposition-growth experiment varying numeric
background air pressure while controlling the matched fields above and reporting a potentially
solver-compatible quantitative observable with usable uncertainty?

The six DOI seeds remain candidates with provisional prior rejection reasons, not inherited verdicts.
Stop only after all 135 base combinations have their 210 fixed/first-page requests plus all 12 seed-
resolution requests in terminal state, every response-derived child closes, each backward-only and
forward-only graph terminates through depth two, every one-shot Rule 12 family terminates, and every
included primary is reviewed or explicitly inaccessible. A simulator-only pressure ladder cannot
close the search. The strongest permitted positive outcome is `source-compatible-bridge-required`;
otherwise report the scoped source, confound, model-physics, independence, access or cap blocker.

#### `TAX2-PANEL-SPAN-01`

**Status:** `QUESTION_ONLY; OPERATOR UNREGISTERED; NO NUMERIC SPANS EXTRACTED`.

The question is what two-dimensional projected span one uniform prospectively frozen operator can
measure at all 216 Figure 2 addresses in official `2306.13087v1` pages 11–14, retaining blanks,
refusals and censoring. The source reports 206 observations, but neither blank positions nor that
count is an accepted extraction result. Printed micrometre labels are square field-of-view widths,
not crystal sizes. The corpus uses c-axis electric needles, is in-sample for M1, and cannot become
held-out M1 evidence.

This source-search protocol does not register the image operator. Before extraction, commit and
independently review `research/phase6-tax2-panel-span-preregistration.md`, deterministic render/crop/
segmentation implementation, fixtures, exact 216-address universe, scale and sensitivity rules,
negative controls, uncertainty, complete failure retention, and independently selected
remeasurement sample. Every row must carry `inSampleForM1=true`, `geometry=c-axis-needle`,
`observable=2d-projected-span`, and `passEligible=false`. Copyrighted images/masks stay under
`research/tmp/`; derived numeric rows and audit metadata go under tracked `evidence/`.

### 11.8 Candidate bundle, independent review and publication

Exact bundle schemas, array order, commands, review records, contributor stable identity fields,
fixture paths/hashes, mutation bytes/witnesses, import-closure resolution and publisher wrapper inputs
belong to the combined committed code freeze. They are not open choices for an executor and are not
claimed complete by this prose. The offline implementation must use the existing shared evidence
publisher/verifier seam, adding only the smallest generally reusable hard-crash recovery extension;
WP1 cannot build a bespoke publisher. Any shared-seam change is reviewed and regression-tested for
all callers, including killed-child states before/after rename and manifest update.

Raw provider/source/extraction bytes remain content-addressed under ignored `research/tmp/`.
Candidate verification on the research host reopens those governed local bytes and independently
rederives normalized claims. Clean-checkout published verification can prove tracked bundle
integrity, internal semantics, review closure and manifest agreement; it cannot reconstruct omitted
copyrighted/provider bytes and must report that limitation rather than claim otherwise. Source
descriptors preserve exact hashes, media, availability and local-reverification state.

Every successor review receives the registry's exact sorted `priorFindingIds`, derived without a
caller-supplied subset from `research/phase6-wp1-review-findings.json`. The governed universe includes
the inherited v2/v3/v3-second-round findings, all six individually stated `CATV2-*` findings and every
registered V4 finding. Each carries its reviewed candidate identity, originating-review provenance,
independently executed checks, limits and current disposition. An author response is not closure: an
independent successor review must close each with evidence, explicitly retain it, or decline it with
rationale; omission, duplication or an unrecognized ID fails.
The semantic closure includes this register, registry, independence catalog, CLI, producer, separate
verifier, schemas/parsers, fixtures, shared publisher/recovery code and tests, evidence-integrity
test, package scripts, lockfile and complete transitive local imports. Producer/verifier semantic
reducers remain separate; only reviewed byte/hash/canonical-JSON/publication primitives may be
shared. Contributor identity/context/competence remains attested, not cryptographically authenticated.

All registry negative-control intents become exact governed fixtures in that freeze. A component
separate from the attacked verifier performs and records each mutation witness; the verifier must
detect the named criterion exactly once. The suite includes cutoff separation, currency nonrecursion,
entry counts, pagination/redirect closure, language separation, matching/distinct pressure,
covariance, LK compatibility, source-only ceiling, generated-from drift, missing operand nodes,
replacement history, effective-tip ambiguity and definitive-fail persistence. Existing shared-seam
controls remain shared rather than reimplemented.

Before the first request, one committed identity covering exact protocol, offline code, fixtures,
tests, dependencies, recovery and review records must receive independent schema, science and
publication 0-blocker/0-should-fix reviews. A record-only freeze then authorizes execution without
changing those bytes. Final evidence publication remains provisional until bundle and manifest are
committed, a clean checkout performs the honest tracked-byte verification, and exact `npm test`
passes. No published WP1 source result can flip `passEligible=false`; that requires the separately
reviewed source-to-model bridge frozen before model output.

### 11.9 Review-record boundary and stable execution limit

Mutable review observations do not live in this frozen scientific register. Every review round is
appended to `research/phase6-wp1-review-findings.json` with the exact candidate bytes it governed,
reviewer model/context provenance, independently executed checks and explicit limits. Historical
acceptance or rejection applies only to those exact bytes and cannot accept, reject or authorize a
changed successor by implication. Author corrections remain `pending-independent-review`; an author
cannot close the findings that motivated the correction.

This candidate's stable protocol state is unexecuted and unaccepted: the registry has
`currencyAsOfUtc=null`, no combined committed identity has a 0-blocker/0-should-fix schema, science
and publication review set, and no record-only freeze authorizes dispatch. Therefore no network/
transport request, provider call, manual import, source acquisition, source translation, production
solver row, evidence publication or TAX2 measurement is authorized by these bytes. This statement is
a derivation from frozen fields and required records, not a mutable claim about who has reviewed the
candidate. Execution limits and any completed checks belong in the separate review record.
