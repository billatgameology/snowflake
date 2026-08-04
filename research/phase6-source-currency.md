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
- Decision 0043 records this lock's audited result as a Phase 6 finding, not a validation target or
  pass. All four held-out families—growth rates, size-dependent habit, pressure dependence, and
  growth-history responses—are deferred past Phase 6 with no validation credit. Their accountable
  owner is project maker `billatgameology` through the named Phase 7 held-out-validation work
  package; no Phase 6 held-out production row may start from this lock.
- The narrowed WP1 task is separate: freeze Nakaya-comparison physical-size **strata** from the
  already-locked observations and uncertainties through a new, simplest reviewable deterministic
  operator. The classical reference supplies no single maximum dimension, so WP1 may not promote
  one of the non-transferable 100/150/200/300 µm planning probes into a uniquely correct Nakaya
  measurement size. R15 still waits for that strata freeze and WP2's registered numerical result.
- A source-specifiable latent-heat arm can narrow the Harrison mismatch, but cannot infer the missing
  per-particle crystallography. Substrate or sublimation work similarly does not erase the other
  candidates' unobserved initial state.
- The pressure/history gaps and the corresponding gaps in the other two families remain scientific
  incompatibilities, not resource excuses. Phase 7 must make each comparison apples-to-apples or
  retain the non-comparable finding; deferral must never be marked as execution or a pass.
- Any post-Phase-6 new physics is an ADR/spec/implementation decision with its own numerical and
  evidence review.

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

## 11. Rejected WP1 V4/V4.x apparatus -- historical pointer

Maker direction on 2026-08-03 closed the source-search register, publisher, and control-batch
apparatus as rejected history. Nothing in the former Section 11 may be executed, repaired, repinned,
reviewed toward acceptance, imported, published, or dispatched. Its exact last live-path candidate
bytes are retained under [`research/rejected/phase6-wp1-v4x/`](rejected/phase6-wp1-v4x/):

- `phase6-source-currency-v4x-rejected.md`: 65,588 bytes / SHA-256
  `63f54e0a58ec515e54eb6b5c6e928a94a14956479c3a30c261f19aea97ec022d`;
- `phase6-wp1-independence-operands.json`: 99,033 bytes / SHA-256
  `9ffe4edf928bfa3416ecd064a594da259c0fcc24ad87b2cbc744906d3c2163cb`;
- `phase6-wp1-review-findings.json`: 98,730 bytes / SHA-256
  `8f08e251754f4e1e2833bd9555b47bdd15903d10b460698f41502eaccbc161b9`; and
- `phase6-wp1-search-registry.json`: 112,565 bytes / SHA-256
  `41a6d4cc3973ff92bd0ecd249cbb122bdf1a874b886f835f0ed1b21b6fc78f17`.

Those bytes preserve findings and failed approaches only; their embedded candidate statuses and
future-tense instructions have no current authority. The active parent plan now limits WP1 to one
new, separately planned task: freeze Nakaya-comparison physical-size strata from already-locked
sources through the simplest reviewable deterministic operator. No new literature search or TAX2
execution is authorized.
