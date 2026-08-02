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

## 11. WP1 source-search and extraction register

**Registration state:** `REGISTERED; ALL THREE ENTRIES UNEXECUTED` on 2026-08-02. This section is a
prospective execution contract, not a report of searches or measurements already performed. It
does not authorize a validation target, change
`PHASE6_HELDOUT_CANDIDATES_2026_08_01`, or change that lock's `passEligible=false` value. A known
pointer, search-engine result, catalog record, abstract, or inaccessible stable identifier is a
lead, not quantitative evidence.

The execution cutoff is 2026-08-02 23:59:59 UTC. Searches may execute later, but they admit only
records first published, deposited, or publicly indexed on or before that cutoff. A source with an
earlier publication date but a catalog record first discovered after the cutoff is admissible only
if the execution record establishes that the underlying source was public by the cutoff; otherwise
it is logged as post-cutoff follow-up. Each execution records its actual UTC start/end time, exact
request or manual route, response status, returned and screened counts, cursor/page completion,
every returned record's inclusion/exclusion disposition, acquisition result, and the SHA-256 and
byte count of every raw response or source snapshot where preservation is legally and technically
possible. Raw catalog responses and third-party source bytes stay under `research/tmp/`; the
tracked record binds their identities but does not redistribute them.

All query text below is Unicode NFC. The executor substitutes decoded parameter values first and
then applies UTF-8 percent-encoding exactly once; spaces encode as `%20`. DOI query/path values and
opaque cursors receive the same one-pass encoding, including `<`, `>`, parentheses, semicolons and
slashes. The executor performs no stemming, synonym expansion, date change, or unregistered query
addition; provider-native matching or normalization may still occur and is recorded as a provider
limit.

Every direct HTTP or manual-fetch endpoint is requested without authentication with
`User-Agent: VirtualCloudChamber-Phase6-WP1/1.0` and the route-appropriate
`Accept: application/json`, `application/xml`, or `text/html`. If a route requires a credential or
rejects anonymous volume, that is a terminal access limitation; no secret or alternative credential
class is improvised. An unavailable endpoint is not replaced without a new dated registration
amendment. HTTP redirects, status codes, rate-limit retries, exact request/response headers excluding
volatile transport fields, and the final URL are recorded. At most three retries are allowed for a
transient `429` or `5xx`, using the server's `Retry-After` value or, if absent, deterministic waits
of 5, 20, and 60 seconds. No retry changes the query or cap. The opaque supplemental search tool
does not expose or promise those headers; its exact tool-call arguments, returned blocks, provider
metadata that is observable, and canonical tool-result hash are recorded instead.

### Shared bibliographic routes and deterministic screen

The two literature entries use these registered routes. `Q` means one exact entry-specific query
below and `FROM`/`TO` mean that entry's inclusive publication-date range.

| route | exact request and returned fields | cap and pagination |
|---|---|---|
| Crossref REST | `GET https://api.crossref.org/works?query.bibliographic=Q&filter=from-pub-date:FROM,until-pub-date:TO&rows=100&offset=OFFSET`; retain the complete returned work objects rather than a selected-field projection | offsets 0 and 100; 200 per query; record `total-results` and whether it exceeds 200 |
| OpenAlex | `GET https://api.openalex.org/works?search=Q&filter=from_publication_date:FROM,to_publication_date:TO&per-page=100&cursor=CURSOR`; retain the complete returned work objects, including available abstract, topic, keyword and relation fields | cursor from `*` through 200 records; stop earlier only on an empty page; record whether another cursor existed at the cap |
| CiNii Research | `GET https://cir.nii.ac.jp/opensearch/all?q=Q&format=json&count=200&start=1` | one 200-record page; record advertised total and cap truncation |
| NDL Search SRU | let `Q_CQL` replace `\` with `\\` and `"` with `\"` in decoded `Q`, let decoded `CQL` be `anywhere="Q_CQL"`, then request `GET https://ndlsearch.ndl.go.jp/api/sru?operation=searchRetrieve&version=1.2&recordSchema=dcndl&recordPacking=xml&query=CQL&maximumRecords=200&startRecord=1`, applying the common one-pass encoding to the complete `CQL` parameter value | one 200-record response; record `numberOfRecords` and cap truncation |
| J-STAGE | manual HTML search at `https://www.jstage.jst.go.jp/result/global/-char/en?globalSearchKey=Q` | follow only the server-displayed next-page control through 200 results; record each final page URL, result count, and inaccessible continuation |
| Google Books | `GET https://www.googleapis.com/books/v1/volumes?q=Q&printType=books&orderBy=relevance&maxResults=40&startIndex=START` | starts 0, 40, 80, 120, 160; 200 per query; record `totalItems` and cap truncation |
| Internet Archive | `GET https://archive.org/advancedsearch.php?q=Q&fl[]=identifier&fl[]=title&fl[]=creator&fl[]=date&fl[]=description&fl[]=subject&fl[]=mediatype&rows=200&page=1&output=json` | one 200-record page; record `numFound` and cap truncation |
| WorldCat | manual search at `https://search.worldcat.org/search?q=Q` | follow only the server-displayed next-page control and screen at most 100 records in displayed order; record every final page URL and access limitation |
| supplemental web index | one configured `search_query` call with exact `Q` and no recency filter | screen every result returned by that one opaque provider call, up to 50; record when the tool returns fewer and offers no continuation; this route can discover a lead but cannot establish source conditions |

Only Crossref and OpenAlex apply `FROM`/`TO` server-side. The other seven routes return their
provider-ranked, relevance-capped sets; the executor then applies the inclusive date range locally.
An out-of-range row is retained with that reason. A search-negative conclusion is explicitly
bounded by those mixed-date provider caps and cannot be restated as a complete date-range census.

DOIs normalize by trimming Unicode whitespace, stripping one case-insensitive leading `doi:`,
`https://doi.org/`, `http://doi.org/`, or `http://dx.doi.org/`, percent-decoding a URL-derived value
exactly once when valid, Unicode-normalizing to NFC, and ASCII-lowercasing. An OpenAlex work/author
ID normalizes by trimming, removing one case-insensitive `https://openalex.org/` prefix, uppercasing
the prefix letter, and requiring `W[1-9][0-9]*` or `A[1-9][0-9]*`; malformed IDs are unresolved and
never placed in a path/filter. ISBN removes hyphens/spaces, uppercases `X`, and must pass an ISBN-10
or ISBN-13 checksum; convert every valid ISBN-10 to its `978` ISBN-13 equivalent with a recomputed
check digit before identity comparison, retain original forms as aliases, and leave valid `979`
ISBN-13 values unchanged. OCLC removes one leading `ocm`, `ocn`, `on`, or `OCLC` label and leading zeros,
then requires nonzero decimal digits. Other named identifiers are Unicode-NFC trimmed and use their
provider's case convention.

Identity is a union of every shared normalized strong identifier: DOI; OpenAlex work ID;
PubMed/PMC ID; J-STAGE article ID; CiNii ID; NDL bibliographic ID; valid ISBN plus volume; Internet
Archive identifier; or OCLC number. A record carrying DOI plus OpenAlex ID therefore joins a later
record carrying only that OpenAlex ID. If one occurrence would bridge components containing
different nonempty DOIs or conflicting ISBN-plus-volume identities, do not union them: give the
occurrence a raw-hash identity and mark `identity-conflict` for review. Only when no strong ID exists
may Unicode-NFKC/case-folded title plus a nonmissing first-author family name and four-digit year
form a fallback key. A missing author or year forces a separate raw-record SHA-256 key, preventing
generic titles from merging.

Every provider/query occurrence remains in the ledger. Duplicate occurrences point to one
canonical component. The component key is its lexicographically smallest type-prefixed strong ID,
otherwise its fallback or raw-hash key. The canonical display variant maximizes the number present
among the fixed fields `title`, `firstAuthor`, `publicationDate`, `venue`, `strongIdentifier`,
`abstractOrSubject`, and `acquisitionURL`, then minimizes the lexicographically joined normalized
strong IDs and SHA-256 of sorted-key UTF-8 JSON; route or arrival order never chooses it. Metadata from
all variants remains available. Each occurrence has two independent axes:
`screenDisposition` is one of `include-acquire`, `include-citation-lead`,
`exclude-out-of-scope`, or `duplicate-alias`; `acquisitionStatus` is one of `not-attempted`,
`acquired-and-verified`, `inaccessible-after-attempts`, `metadata-only-by-design`, or
`not-required`. Thus a relevant inaccessible source remains included and still triggers its
registered citation/currency work. A missing abstract cannot by itself exclude a record; it becomes
an acquisition or citation lead. `metadata-only-by-design` is allowed only with
`include-citation-lead`, `exclude-out-of-scope`, or `duplicate-alias`; an `include-acquire` record
must end `acquired-and-verified` or `inaccessible-after-attempts` and is never pass-eligible under
the latter.

Identity components may merge as later routes reveal bridging IDs, so their display/component key
is not a scheduling identity. Each occurrence gets immutable `occurrenceId = sha256(requestId |
providerRank | rawRecordSha256)`. A relation subject gets immutable `subjectScheduleId` equal to the
type-prefixed normalized DOI/OpenAlex/other external identifier actually used in that request, or
`occurrence:occurrenceId` for a title-only route. Component merges append an alias/pointer history;
they never rename an `occurrenceId`, `subjectScheduleId`, completed request, or raw file. Final
evidence maps all immutable IDs to the final component graph.

For every acquired candidate, the record gives complete citation, stable identifiers, acquisition
URL, ignored local path, bytes, pages or archive members, SHA-256, relevant pages, original-language
excerpt where applicable, and the exact OCR/translation tool and version. Machine translation is
marked unreviewed unless a named human reviewer checks it. The methods/data screen records
temperature, supersaturation definition and value, pressure and gas, duration/history, apparatus,
support/ventilation, seed or population/crystallography, sample size, quantitative observable,
uncertainty, and whether the current solver can predict the observable without fitting an
unobserved initial state or adding omitted load-bearing physics.

#### Registered citation-relation requests

The following derived requests are part of this registration; they are not unregistered searches.
`DOI` is the normalized DOI above, `WID` is the OpenAlex work ID returned by resolution, `AID` is an
OpenAlex author ID, and `CANDIDATE_DATE` is the candidate's earliest source-supported publication
date. Each placeholder is substituted and encoded under the one-pass rule above.

Only validated short-form `WID`/`AID` values from the normalization rule enter requests. For
`CANDIDATE_DATE`, preserve every reported publication/issued/print/online date variant, expand a
source-supported `YYYY` to `YYYY-01-01` and `YYYY-MM` to `YYYY-MM-01`, and use the earliest expanded
publication lower bound. Deposit/index dates do not override a supported publication date. If no
publication year is supported, use the entry's registered `FROM` date solely as a conservative
search lower bound, mark date identity unresolved, and prohibit quantitative target admission.

1. Resolve a DOI in Crossref with
   `GET https://api.crossref.org/works/DOI`; retain its complete work object. Its `reference` array
   is the Crossref backward relation. Sort the complete received array locally by normalized DOI,
   then by Unicode-NFKC/case-folded `article-title|author|year|unstructured`, with `<missing>`
   sentinels, then by canonical raw-reference SHA-256. Screen the first 200 after that sort and record the received count. Crossref's
   `is-referenced-by-count` is a count only and is never treated as a forward-citation list.
2. Resolve a DOI in OpenAlex with
   `GET https://api.openalex.org/works?filter=doi:https://doi.org/DOI&per-page=25`; require exactly
   one matching normalized DOI or record an ambiguous/missing resolution. A known `WID` may instead
   be fetched with `GET https://api.openalex.org/works/WID`. The complete `referenced_works` array
   is sorted lexicographically by OpenAlex ID; screen its first 200 and record its full length.
3. Retrieve OpenAlex forward citations with
   `GET https://api.openalex.org/works?filter=cites:WID,from_publication_date:CANDIDATE_DATE,to_publication_date:2026-08-02&sort=publication_date:asc&per-page=100&cursor=CURSOR`,
   starting at cursor `*` and stopping after two pages or an empty page. The provider's first 200 in
   that registered chronological ordering are the capped cohort; only after retrieval are they
   secondarily sorted by `publication_date|id` for screening. Record `count`, next-cursor presence,
   and cap truncation. No claim is made that these are the globally lowest 200 IDs.
4. Fetch an individual OpenAlex relation member with
   `GET https://api.openalex.org/works/WID`. A member lacking the entry-specific phrase/token match
   below but also lacking an abstract/subject/full text is retained as `include-citation-lead`, not
   excluded. Provider relation APIs do not supply citing prose; this protocol never claims they do.

A relation unavailable after the registered retries is `terminal-access-failure` for that direction
and remains an explicit limit. A Crossref reference without a resolvable stable ID remains a
bibliographic citation lead and is searched by its exact received title using the shared discovery
template on Crossref, OpenAlex, CiNii, NDL and the supplemental web route, with those routes' normal
caps. Relation depth and entry-specific text predicates are fixed in each entry below.

#### Rule 12 derived requests

Before any candidate freezes, its currency check executes these deterministic derived routes from
`CANDIDATE_DATE` through 2026-08-02:

1. Let `TOKEN` be the normalized DOI when present, otherwise the exact Unicode-NFC title without
   added quotation marks; the NDL template supplies and escapes its own CQL quotes. For each `TERM`
   in the fixed order `erratum`, `corrigendum`, `correction`, `retraction`, `正誤`, `正誤表`,
   `訂正`, `撤回`, build exact query `TOKEN TERM` and run it on Crossref, OpenAlex, CiNii, NDL,
   J-STAGE and the one-call supplemental web route using the shared templates and caps. Google
   Books, Internet Archive and WorldCat are not correction-index routes and are not silently added.
2. Inspect only publisher/repository/version URLs returned in the candidate's stable-ID metadata,
   Crossref `link`/`relation` fields, or OpenAlex `primary_location`, `locations`, and
   `best_oa_location`. Record every followed URL, redirect, version label and access failure. This
   is deterministic link traversal, not an added text query.
3. For every validated OpenAlex `AID` on the candidate, request
   `GET https://api.openalex.org/works?filter=authorships.author.id:AID,from_publication_date:CANDIDATE_DATE,to_publication_date:2026-08-02&sort=publication_date:asc&per-page=100&cursor=CURSOR`
   through two pages or an empty page. For an author without a resolved `AID`, request Crossref once
   for every distinct complete original-script and romanized display-name variant present in the
   acquired source and provider metadata, in Unicode-code-point sort order,
   `GET https://api.crossref.org/works?query.author=EXACT_AUTHOR&filter=from-pub-date:CANDIDATE_DATE,until-pub-date:2026-08-02&rows=100&offset=OFFSET`
   at offsets 0 and 100, where `EXACT_AUTHOR` is that Unicode-NFC display name. The resolved AID or
   exact-name query discharges any author-name clause in the entry predicate; screen only its topical/
   observable clauses. Rows missing enough metadata to apply them remain citation leads. An
   unresolved author identity leaves source currency unresolved.

Any remaining cursor or advertised/returned total above 200 makes that candidate's Rule 12 route
cap-incomplete. The record states whether a correction, version, or later same-author primary work
supersedes or qualifies the methods, values, or interpretation. An inaccessible primary source,
unresolved version/author identity, access-incomplete or cap-incomplete currency route cannot become
a quantitative target.

#### Cold-resume and durable-ledger contract

Before the first request for an entry, the executor creates
`research/tmp/phase6-wp1-source-search-01/ENTRY_ID/`. It writes one immutable raw-response file per
attempt and an entry-specific atomic `checkpoint.json` after every response: write a sibling
temporary file, flush and close it, then rename it over the prior checkpoint. Separate entry
directories prevent sequential overwrite and parallel races. The checkpoint's canonical sorted-key
JSON schema contains:

- `schema`, `entryId`, execution UTC start/cutoff, executor commit and tracked-dirty-state refusal,
  Git blob identity of this file plus SHA-256 of the exact registered section text, engine/OS, and
  non-secret environment;
- for each request: `requestId`, stage, route, query ordinal or immutable `subjectScheduleId`, hop/direction,
  page ordinal, prior-response hash when an opaque cursor is used, decoded parameters, exact final
  URL, non-secret headers, attempts, UTC times, HTTP/fetch terminal state, status, raw path/bytes/
  SHA-256, capture kind, provider total, returned count, next cursor/link, cap flag, and error;
- for each returned occurrence: immutable `occurrenceId`, provider rank, raw-record SHA-256,
  current component key plus alias history, canonical-variant pointer, both disposition axes, reason
  code, citation-walk trigger, and acquisition pointer; and
- outstanding request IDs plus the last fully published page/cursor.

`requestId` is lowercase SHA-256 of canonical sorted-key UTF-8 JSON containing
`entryId|stage|route|queryOrdinal|subjectScheduleId|hop|direction|pageOrdinal|requestUrl`; an opaque
cursor request additionally binds the prior raw-response SHA-256. On resume, only a request whose
terminal checkpoint entry and raw-response bytes/hash both validate may be skipped. A missing or
mismatched pair is re-executed and the mismatch is preserved in the audit log.

When DNS, TLS, connection, or tool failure yields no response body, write canonical sorted-key UTF-8
JSON containing request/attempt IDs, route, exact intended URL/call, UTC start/end, error name/code/
message and retry decision; set `captureKind=no-response` and hash those bytes. A terminal access
failure resumes only when that error artifact and checkpoint hash validate.

Execution refuses staged or unstaged modifications to tracked files, but records rather than
rejects unrelated untracked/ignored paths; this preserves the user's root `=` file and the named
ignored research inputs. It separately hashes every named ignored source input. For direct HTTP,
the raw hash covers the exact client-decoded response-body bytes before text parsing and records
`Content-Encoding`; for saved manual HTML it covers page-source bytes; when page source is
unavailable, and for the opaque search route, it covers canonical sorted-key UTF-8 JSON of the
observable tool result and marks that capture kind. No one representation is mislabeled as another.

Every request ends in exactly one of `complete`, `terminal-access-failure`,
`terminal-partial-at-cap`, or `terminal-no-results`; exhausting registered retries is completion of
an access-failure record, not success. Thus an inaccessible route cannot create an infinite stopping
condition, and every negative result names the missing/capped scope.

Once an entry completes, publish normalized, non-copyrighted bibliographic/provenance data under
`evidence/phase6-wp1-source-search-01/`: canonical request ledger, occurrence/disposition ledger,
candidate table, currency/citation outcomes, and summary. Do not publish raw HTML/PDFs, full
abstracts, or source images. Serialize JSON/JSONL as UTF-8 with LF, sorted keys, deterministic row
orders and a terminal newline. Register every file's bytes and SHA-256 in `evidence/MANIFEST.json`
and make the evidence-integrity test reopen it. The ignored checkpoint is the interruption-resume
surface; the tracked evidence bundle is the durable scientific record. `docs/PROGRESS.md` and
`docs/HANDOFF.md` point to each entry-specific checkpoint while execution is active and to the evidence bundle when
complete, keeping those state indexes compact.

#### 2026-08-02 executor-identity and publication amendment

This amendment was registered before implementation and before the first live request. The initial
offline implementation audit found that the prose above fixed the scientific traversal but left
several byte identities and crash states with more than one conforming implementation. Those
choices are fixed here rather than allowed to become producer-selected protocol. They add no search
endpoint, traversal, query, candidate, measurement or source; `registered-version-url` below merely
names the Rule 12 publisher/repository link traversal already registered above. All three entries
remain unexecuted.

**Canonical identities.** Every identity below hashes the exact bytes returned by
`canonicalJsonBytes` in `runner/src/gate4-evidence.ts`: recursively sorted-key, strict UTF-8 JSON
with one terminal LF. All named keys are present; an inapplicable scalar is `null`, never omitted.

- A request identity object has exactly `direction`, `entryId`, `hop`, `pageOrdinal`,
  `priorResponseSha256`, `queryOrdinal`, `requestUrl`, `route`, `stage`, and
  `subjectScheduleId`. `pageOrdinal`, `providerRank`, and a non-null `queryOrdinal` are one-based
  safe integers; a non-null `hop` is a safe integer in 0--3. Exactly one of `queryOrdinal` and
  `subjectScheduleId` is non-null. `direction` and `hop` are both null for a base discovery request
  and both non-null for a derived request. `priorResponseSha256` is non-null if and only if this is
  a continuation request whose cursor/token/link came from the immediately prior page captured in
  that same request-pagination chain, never merely the temporally preceding request and never a
  Rule 12 version link;
  an initial literal OpenAlex `*` is not a continuation. The bound hash is that prior response's
  exact raw/canonical capture hash. `requestId` is the lowercase SHA-256 of the identity object.
- An occurrence identity object has exactly `providerRank`, `rawRecordSha256`, and `requestId`;
  `occurrenceId` is its lowercase SHA-256. Rank is the provider-displayed one-based rank within the
  response page, not a mutable global/component rank.
- For a returned JSON object, `rawRecordSha256` hashes
  `canonicalJsonBytes(parsedCompleteObject)`, not a selected projection; a provider result that is
  not one complete strict-JSON object is a parse failure. For XML, HTML, or an opaque/manual result,
  it hashes a canonical identity envelope with exactly `responseBodySha256`, `schema`, and
  `sourceLocator`. `schema` is `phase6-wp1-provider-record-v1`, and `sourceLocator` is exactly
  `xml-record-index:N`, `displayed-result-index:N`, or `tool-result-index:N`, with one-based safe
  integer `N` in source/display/tool order. The response hash plus ordinal alone defines the record
  identity without allowing two parsers' field projections to change it or pretending a projection
  is an exact XML/HTML byte slice. One complete strict-JSON object of observed fields is retained
  separately as non-identity checkpoint metadata with the parser/importer version. The raw response
  remains separately byte-hashed under `research/tmp/` and is the authority if that metadata is
  later questioned.
- `subjectScheduleId` is the exact type-prefixed normalized identifier used to create the request.
  A title-only subject is `occurrence:` plus the immutable occurrence ID. A late component merge
  may append aliases and final-component pointers only.

The nine base-route strings are exactly `crossref`, `openalex`, `cinii`, `ndl`, `jstage`,
`google-books`, `internet-archive`, `worldcat`, and `supplemental-web`. The derived-only
`registered-version-url` route represents the finite publisher/repository/version URLs authorized
by the Rule 12 link traversal; it is never a base query route. The complete stage contract is:

| stage | direction | hop | scheduling operand | allowed route |
|---|---|---:|---|---|
| `base-discovery` | null | null | one-based registered `queryOrdinal` | any of the nine base routes |
| `known-seed-resolution` | `resolution` | 0 | registered `doi:DOI` or `openalex-work:WID` | `crossref` for DOI; `openalex` for DOI or WID |
| `relation-resolution` | `resolution` | resolved node depth 0--3 | route-usable `doi:DOI` or `openalex-work:WID` | `crossref` for DOI; `openalex` for DOI or WID |
| `relation-backward` | `backward` | depth of members requested, 1--3 | resolved parent DOI for Crossref, or WID for OpenAlex | `crossref` or `openalex` |
| `relation-forward` | `forward` | depth of members requested, 1--2 | resolved parent WID | `openalex` |
| `citation-title-discovery` | `backward` | unresolved member depth 1--3 | `occurrence:ID` of a returned title-only reference or `local-member:ID` of a local-source title member | `crossref`, `openalex`, `cinii`, `ndl`, or `supplemental-web` |
| `currency-correction` | `correction` | 0 | `doi:DOI` when present, otherwise `occurrence:ID` of the candidate supplying the exact title | `crossref`, `openalex`, `cinii`, `ndl`, `jstage`, or `supplemental-web` |
| `currency-version-link` | `version-link` | 0 | `doi:DOI` when present, otherwise `occurrence:ID` of the candidate | `registered-version-url` |
| `currency-same-author` | `same-author` | 0 | `openalex-author:AID` or `author-name:SHA256` | `openalex` for AID; `crossref` for exact name |

`author-name:SHA256` uses lowercase hexadecimal SHA-256 of the canonical object with exactly
`displayName` and `schema`, where `schema=phase6-wp1-author-name-v1` and `displayName` is the exact
Unicode-NFC display name. A local source member without a strong identifier uses
`local-member:SHA256`, where the lowercase digest covers the canonical object with exactly
`memberOrdinal`, `parentOccurrenceId`, `rawMemberSha256`, `schema`, and `sourceSha256`, with
`schema=phase6-wp1-local-member-v1`; the occurrence ID is the immutable assessment/witness parent,
not a later canonical-variant selection. A supplemental request has canonical
`requestUrl = opaque:search_query?q=` plus the common one-pass encoding of decoded `Q`; that string
is an identity, not a claim that the opaque provider exposes an HTTP endpoint. OpenAlex pagination
terminates on an empty page. This amendment supersedes the earlier `stop earlier only on an empty
page` sentence only when the provider returns no next cursor: if the accumulated returned count
equals the advertised total and is below the 200 cap, record `provider-terminal-no-cursor` and
complete; otherwise the absent continuation is `terminal-access-failure`, or
`terminal-partial-at-cap` when 200 records were already captured. A request is never fabricated
without a provider cursor. An empty page completes only when accumulated records equal the
advertised total below cap; it is `terminal-partial-at-cap` after 200, and otherwise
`terminal-access-failure` because advertised records are missing. Every other route follows the
displayed/fixed continuation rules already registered above.

In every rule below, `control` means Unicode General Category `Cc` or `Cf` as matched by the pinned
engine's `/[\p{Cc}\p{Cf}]/u`; `Unicode whitespace` means `\p{White_Space}`; `punctuation` means
Unicode General Category `P` as matched by `/\p{P}/gu`; code-point length is `[...value].length`.
Folding replaces each punctuation code point with one ASCII space and collapses each nonempty run
of Unicode whitespace to one ASCII space after normalization/lowercasing.

After the already registered prefix stripping and one valid percent-decode, a DOI is usable as a
strong identifier or request operand only when it matches `10.` plus 4--9 ASCII digits, `/`, and a
nonempty suffix containing no control or Unicode-whitespace character. ASCII letters lowercase;
non-ASCII code points are preserved. PubMed is a nonzero decimal integer and PMC is `PMC` plus a
nonzero decimal integer. A J-STAGE, CiNii, NDL or Internet Archive provider ID is Unicode-NFC,
trimmed, nonempty, at most 512 code points, and contains no control/Unicode-whitespace character; provider
case is preserved. An ISBN becomes a strong key only together with a nonempty volume designator;
the volume is Unicode-NFKC, ECMAScript-lowercased, trimmed and internal Unicode whitespace is
collapsed to one ASCII space. Title/family-name folding uses Unicode NFKC followed by the pinned
Node/V8 engine's ECMAScript `toLowerCase`, punctuation-to-space and whitespace collapse; it is not
described as language-independent full Unicode case folding.

Type-prefixed component keys use exactly `doi:`, `openalex-work:`, `pubmed:`, `pmc:`, `jstage:`,
`cinii:`, `ndl:`, `isbn-volume:`, `internet-archive:`, and `oclc:`. An ISBN-volume value is
`ISBN13|` plus the normalized volume. Fallback keys are `title-author-year:` plus lowercase
hexadecimal SHA-256 of a canonical object with exactly `firstAuthorFamilyFolded`, `schema`,
`titleFolded`, and `year`, where `schema=phase6-wp1-title-author-year-v1` and `year` is the exact
four-digit string; the other values are the registered folds;
otherwise the key is `raw-sha256:` plus the record hash. These prefixes participate in the already
registered lexical component-key selection and prevent two identifier namespaces from colliding.
Every `lexicographic`, `lexically`, canonical path/row, identifier, component, variant and tie-break
sort in this register uses locale-independent ECMAScript UTF-16 code-unit order (`a < b`, `a > b`),
never locale collation; tests include non-ASCII operands.

**Capture and terminal schemas.** Direct JSON/XML HTTP responses are fetched by the executor.
J-STAGE, WorldCat, saved manual pages and the supplemental opaque search provider enter only through
a canonical `phase6-wp1-manual-capture-v1` import. That import binds the registered request ID and
identity object, exact intended call/URL, capture kind, final URL where observable, stable response
headers/metadata, provider total, continuation/cap state, complete returned provider-record
envelopes, and either an ignored raw-page path plus bytes/hash or the canonical observable tool
result. It cannot create an unregistered request, change a query, substitute a provider, or mark an
uncaptured continuation complete.

The manual-capture object has exactly these keys, with explicit null rather than omission:
`capTruncated`, `captureKind`, `endedUtc`, `error`, `finalUrl`, `identity`, `intendedRequest`,
`observableResult`, `providerTotal`, `records`, `requestId`, `responseHeaders`, `schema`,
`semanticHeaderStatus`, `startedUtc`, `status`, and `continuation`. `schema` is the literal above;
`identity` is the exact request identity object; `intendedRequest` has exactly `controlledHeaders`,
`kind`, and `urlOrCall`, where `controlledHeaders` has exactly `accept` and `userAgent` and `kind` is
`http` or `opaque-tool`; `semanticHeaderStatus` has exactly `accept` and `userAgent`, each one of
`confirmed`, `unobservable`, `uncontrollable`, or `not-applicable`; `continuation` is null or has
exactly `kind`, `value`, and `url`; and every `records` member has exactly `fields` and
`sourceLocator` under the non-JSON record rule. Exactly one of these capture representations is
used: `manual-page-source` names an ignored regular file in `observableResult` with exactly
`bytes`, `path`, and `sha256`; `observable-tool-result` stores the complete strict-JSON observable
tool result there; `no-response` stores the already registered no-response object. The importer
reopens and hashes any named file before acceptance. Extra/missing keys, a mismatched request ID,
wrong representation, noncanonical JSON, or a total/cap/continuation inconsistent with `records` is a
parse failure, not a partially accepted capture.

An acquired-source/operator assessment enters only through canonical
`phase6-wp1-candidate-assessment-v1` with exactly `admissibility`, `citation`, `methodsData`,
`occurrenceId`, `review`, `schedulingInputs`, `schedulingWitnesses`, `schema`, and `source`.
`occurrenceId` is immutable even if its component later merges; citation/methods/admissibility/
scheduling objects use the exact published schemas below. `source` has exactly `bytes`, `path`,
`relevantPages`, and `sha256` and is reopened before import. `review` has exactly `humanReviewed`,
`ocrTool`, `originalLanguageExcerptSha256`, `reviewer`, `translationTool`, and `utc`, with explicit
nulls. This records an operator/source assessment; it does not make its scientific content
self-verifying or pass-eligible.

Request terminal states describe one page/call. A valid parsed 2xx response is `complete`,
`terminal-no-results`, or `terminal-partial-at-cap` according to the registered page/cursor rule.
After redirects are recorded and followed for at most ten hops, 401, 403, 404, 407, 410, 451,
redirect failure/loop, any other terminal 4xx, exhausted 429/5xx retries, DNS/TLS/connection failure,
or a malformed/unparseable 2xx response is `terminal-access-failure` with a reason code and retained
capture. A malformed success is never silently zero results. Route/entry completion is derived from
the full registered schedule and dynamic relation schedule; it is not a producer-supplied boolean.

For direct or manual HTTP, the executor-controlled semantic request headers are exactly
`User-Agent` and route `Accept`; ordinary client/transport headers such as `Host` are neither
controlled nor claimed absent. A manual capture records which request headers the tool exposes and
whether the two registered semantic values were set; an unobservable or uncontrollable value is an
explicit `terminal-access-failure` for that manual HTTP page, not a fabricated fact or a completed
route. The opaque tool route is exempt because the original register explicitly states that it does
not expose those headers; it records no invented HTTP headers. The recorded stable response-header
allow-list is `content-type`, `content-encoding`, `content-length`, `content-range`, `etag`,
`last-modified`, `link`, `location`, `retry-after`, `x-ratelimit-limit`,
`x-ratelimit-remaining`, and `x-ratelimit-reset`; other response headers are transport/provider
diagnostics and are deliberately not evidence fields. Redirect status, allowed headers and target
are recorded per hop. A numeric `Retry-After` is seconds; an HTTP-date is converted against the
recorded injected clock and rounded up to whole nonnegative milliseconds. Invalid/past values use
the registered deterministic fallback. There are at most four attempts total: the initial attempt
plus waits of 5, 20 and 60 seconds before the three retries.

**Ownership, checkpoint and drift.** The checkpoint schema is
`phase6-wp1-source-search-checkpoint-v1`. One mutating invocation owns an entry through an exclusive
sibling `owner.json` created with create-new semantics; read-only `status` and `verify` do not claim
ownership. A second mutating owner is refused. A crashed owner is never silently stolen:
`recover-owner` requires the expected owner-file SHA-256, proves the recorded PID is absent on the
same host, preserves the old owner as an immutable audit artifact, and acquires a new owner. A
cross-host owner cannot be proven dead by this executor and automatic recovery is refused. Every raw
attempt path is exclusive and contains immutable request and attempt ordinals.

On normal exit, a mutating invocation first flushes its final checkpoint, reopens `owner.json`,
proves its exact nonce and SHA-256 still match the in-memory owner it created, and then removes that
one file. Failure to authenticate or remove it is an error and leaves the owner for explicit
recovery; it is never reported as a successful clean release. `prepare`, `run-direct`,
`import-capture`, `import-assessment`, `publish`, and `recover-owner` all use this acquire/release rule. Tests cover clean
handoff to the next invocation separately from crashed-owner recovery.

The checkpoint contains a canonical `auditEvents` array. A missing/tampered raw-checkpoint pair,
stale-owner recovery, parse failure, or publication recovery appends an event with UTC time, event
kind, request ID when applicable, prior path/hash facts and the prescribed action. An interrupted
attempt never overwrites or renames an earlier attempt. The checkpoint write is sibling create-new,
write, file flush, close, reopen/canonical-parse/hash, then atomic rename over `checkpoint.json`;
the temporary name is owner/sequence-specific. Only a terminal checkpoint entry whose capture bytes
and hash revalidate may be skipped.

Its top-level object has exactly `auditEvents`, `candidates`, `entryId`, `execution`,
`lastFullyPublished`, `manifestStartSha256`, `occurrences`, `outstandingRequestIds`,
`provenance`, `publicationPlan`, `relations`, `requests`, `schema`, and `sourceInputs`.
`execution` has exactly `cutoffUtc` and `startedUtc`; request/occurrence/candidate/relation members
use the corresponding versioned row schemas below, with attempt `rawPath` additionally present only
in the ignored checkpoint form. `lastFullyPublished` is null or exactly `{captureSha256,requestId}`.
An audit event has exactly `action`, `eventId`, `kind`, `priorFacts`, `requestId`, and `utc`;
`eventId` is independently recomputed from the other five canonical fields. `publicationPlan` is
null or the exact six-key object registered below. Outstanding IDs are sorted and rederived. This
closed key set, every nested row schema and all cross-references are validated before a checkpoint
can resume or publish.

At execution start, before every live direct request, and immediately before publication, the
executor rechecks the same HEAD and a tracked-only clean status. It records Git blob IDs for this
register, the executor and CLI source, SHA-256 of the exact Section 11 Git-blob bytes, and SHA-256 of
the executor/CLI Git-blob bytes. The Section 11 slice begins at the first UTF-8 byte of the exact
heading `## 11. WP1 source-search and extraction register` and continues through end-of-file, with no
preceding newline; moving later material below that heading therefore moves the pin. Untracked/
ignored paths are inventoried but do not cause refusal.
Nonempty `NODE_OPTIONS`, `NODE_PATH`, `NODE_USE_ENV_PROXY`, `NODE_CHANNEL_FD`,
`NODE_TLS_REJECT_UNAUTHORIZED`, `SSL_CERT_DIR`, or `OPENSSL_CONF` is refused. The recorded non-secret
environment is the explicit set `LANG`, `LC_ALL`, `TZ`, `SSL_CERT_FILE`, `NODE_EXTRA_CA_CERTS`,
`NODE_TLS_REJECT_UNAUTHORIZED`, `SSL_CERT_DIR`, and `OPENSSL_CONF`; refused values are explicit null.
A named certificate file is recorded by path, bytes and SHA-256, while an
absent variable is explicit null. No other environment value or secret is serialized.

**Durable products and publication.** A completed entry publishes exactly one subdirectory
`evidence/phase6-wp1-source-search-01/ENTRY_ID/` containing five products:
`requests.jsonl` ordered by request ID, `occurrences.jsonl` ordered by occurrence ID,
`candidates.jsonl` ordered by final component key, `relations-and-currency.jsonl` ordered by
the field-by-field tuple fixed below, and `summary.json`. Empty JSONL products are one empty
file of zero bytes; nonempty files contain one canonical JSON object plus LF per row. `summary.json`
is canonical JSON, binds the other four exact byte lengths/hashes, all register/executor/source/
environment provenance, terminal scope and a fail-closed target disposition, and contains no
abstract/full-text/source-image payload.

All objects below reject extra/missing keys and use explicit nulls. Array members use the global
UTF-16 comparator on the named key; set-valued arrays reject duplicates.

- A `requests.jsonl` row has exactly `attempts`, `capTruncated`, `continuation`,
  `decodedParameters`, `identity`, `intendedRequest`, `occurrenceIds`, `providerTotal`, `reasonCode`,
  `requestId`, `returnedCount`, `schedulingWitnesses`, `schema`, and `terminalState`; its schema is
  `phase6-wp1-request-ledger-row-v1`. `requestId` and identity are independently rederived.
  `intendedRequest` has the three manual-schema keys above. `continuation` is the same null-or-three-
  key object above. An attempt has exactly `attemptOrdinal`, `captureBytes`, `captureKind`,
  `captureSha256`, `endedUtc`, `error`, `finalUrl`, `redirects`, `responseHeaders`, `retryDecision`, `startedUtc`,
  `status`, and `waitMs`; the ignored checkpoint form additionally has `rawPath`, while the tracked
  evidence form removes only that key. Ordinals are consecutive from one and retry/wait values must implement the
  registered rule. Attempt `error` is null or exactly `{code,message,name}`; `status` is an HTTP
  integer or null; `retryDecision` is `none`, `retry`, or `terminal`; and `responseHeaders` has every
  stable allow-list header key exactly once with string-or-null values. The row terminal state is
  one of the four registered terminal states, `reasonCode` is nonempty, and `occurrenceIds` sort by
  ID.
  Request and candidate `schedulingWitnesses` sort by `witnessId`; candidate scheduling inputs sort
  by their string value. Arrival order never selects published byte order.
  Each `redirects` member has exactly `fromUrl`, `location`, `responseHeaders`, and `status`, in hop
  order, with at most ten members. Each `schedulingWitnesses` member has exactly `memberCount`,
  `members`, `membersSha256`, `parentOccurrenceId`, `parentRequestId`, `schema`,
  `sourceCaptureSha256`, `sourceKind`, and `witnessId`; its schema is
  `phase6-wp1-scheduling-witness-v1`. `sourceKind` is one of `crossref-references`,
  `openalex-referenced-works`, `openalex-authors`, `stable-version-urls`, `exact-author-names`, or
  `local-source-citations`. A member has exactly `authorNameVariants`, `memberOrdinal`,
  `normalizedIdentifiers`, `openalexAuthorIds`, `predicateWitness`, `rawMemberSha256`,
  `subjectScheduleId`, `title`, `versionUrls`, and `year`; arrays are complete normalized and sorted
  within the member, and members retain the registered provider/local-sort order by consecutive one-based ordinal. `predicateWitness`
  uses the exact occurrence screen-witness keys. `membersSha256` hashes the canonical complete
  member array and `witnessId` is lowercase SHA-256 of the canonical witness without its own ID.
  Parent and member cardinality are source-kind-specific:

  | source kind | parent IDs | one member per | required nonempty member field(s) | subject ID |
  |---|---|---|---|---|
  | `crossref-references` | enclosing request; occurrence null | complete received reference after registered sort | any available IDs/names/title/year; AID/URL arrays empty | `doi:DOI` if present, else `openalex-work:WID` if present, else `occurrence:` plus ID derived from parent request, ordinal and raw-member hash |
  | `openalex-referenced-works` | enclosing request; occurrence null | received WID after registered sort | exactly one work ID; names/AIDs/URLs empty | `openalex-work:WID` |
  | `openalex-authors` | enclosing request; occurrence null | validated received AID | exactly one AID and available exact display names; IDs/URLs empty | `openalex-author:AID` |
  | `stable-version-urls` | immutable occurrence that supplied the metadata/assessment; request null | registered returned URL | exactly one URL; other arrays empty | candidate `doi:DOI` if present, else `occurrence:` plus that parent occurrence ID |
  | `exact-author-names` | immutable occurrence that supplied the metadata/assessment; request null | distinct Unicode-sorted exact name | exactly one name; other arrays empty | registered `author-name:SHA256` |
  | `local-source-citations` | assessment occurrence; request null | citation/credit in source order | available IDs/names/title/year; AID/URL arrays empty | `doi:DOI` if present, else `openalex-work:WID` if present, else registered `local-member:SHA256` |

  Here `enclosing request` means `parentRequestId` is that request and `parentOccurrenceId` is null;
  `candidate/assessment occurrence` means the inverse and always names the immutable occurrence
  that supplied those values, never a later component/canonical pointer. Both parent IDs non-null, or both null, is
  invalid. For a request-parent witness, `sourceCaptureSha256` equals that request's terminal
  successful attempt capture hash. For a candidate-parent version/name witness it equals either a
  terminal successful capture belonging to that candidate component or the imported assessment
  source hash; for a local citation it equals the assessment source hash. A
  Crossref reference `rawMemberSha256` hashes its complete received strict-JSON reference object. An
  OpenAlex referenced-work member hashes the canonical `{schema,workId}` object with
  `schema=phase6-wp1-openalex-work-member-v1`; an author member hashes canonical
  `{authorId,displayNames,schema}` with `schema=phase6-wp1-openalex-author-member-v1`; a version-URL
  member hashes canonical `{schema,url}` with `schema=phase6-wp1-version-url-member-v1`; and an exact
  author-name member hashes the registered author-name object. A local-source member hashes the canonical object with exactly
  `authorNameVariants`, `normalizedIdentifiers`, `schema`, `title`, and `year`, where
  `schema=phase6-wp1-local-citation-member-v1`. Fields unavailable from the source are explicit
  null/empty arrays, never omitted.
  Other strong identifiers remain identity aliases but are never substituted into Crossref/OpenAlex
  relation or Rule 12 query operands. A returned `occurrence:ID` or `local-member:ID` schedules
  title discovery only when its member has an exact nonempty title; without one it remains an
  explicit unresolved citation lead. Candidate correction uses normalized DOI as `TOKEN` when
  present, otherwise the exact title from its occurrence, regardless of any lexically smaller
  non-DOI component alias.
  The received count must equal `memberCount` and array length; an inaccessible/unparseable relation
  is represented by the request's terminal failure, never an invented empty witness.
- An `occurrences.jsonl` row has exactly `acquisitionPointer`, `acquisitionStatus`,
  `canonicalVariantOccurrenceId`, `citationWalkTrigger`, `componentAliasHistory`, `display`,
  `finalComponentKey`, `identifiers`, `occurrenceId`, `providerRank`, `rawRecordSha256`, `reasonCodes`,
  `requestId`, `schema`, `screenDisposition`, and `screenWitness`; its schema is
  `phase6-wp1-occurrence-ledger-row-v1`. `identifiers` is a sorted array of exact `{type,value}`
  objects using the registered identifier namespaces. `display` has exactly
  `abstractOrSubjectPresent`, `acquisitionURL`, `firstAuthor`, `publicationDate`, `strongIdentifier`,
  `title`, and `venue`; only the presence boolean is published for abstract/subject content.
  `screenWitness` has exactly `crystalToken`, `durationDimensionAlternative`, `excludedCategory`,
  `metadataSufficient`, `pressureToken`, `primaryExperimentClaim`, and `yamashitaToken`.
  The six non-category witness values are booleans and `excludedCategory` is string or null.
  `acquisitionPointer` is null or has exactly `bytes`, `path`, `relevantPages`, and `sha256`; it binds
  ignored/source bytes without redistributing them. Display members are string or null except the
  required presence boolean; identifier values and reason codes are nonempty strings; relevant
  pages are sorted strings.
- A `candidates.jsonl` row has exactly `admissibility`, `aliases`, `canonicalOccurrenceId`,
  `citation`, `componentKey`, `dispositionReasons`, `identifiers`, `methodsData`, `occurrenceIds`,
  `schedulingInputs`, `schedulingWitnesses`, and `schema`; its schema is `phase6-wp1-candidate-row-v1`. `citation` has exactly `authors`,
  `publicationDate`, `stableIdentifiers`, `title`, and `venue`. `methodsData` has exactly
  `apparatus`, `durationHistory`, `observable`, `pressureGas`, `sampleSize`,
  `seedPopulationCrystallography`, `solverPredictability`, `supersaturation`,
  `supportVentilation`, `temperature`, and `uncertainty`. `admissibility` has exactly `geometry`,
  `independenceCAK`, `independenceM1`, `independenceM1NoDip`, `observable`, `primarySource`,
  `sourceBytes`, `targetStatus`, `transport`, and `uncertainty`; statuses use the entry's registered
  fail-closed vocabulary. The three independence values are exactly `independent`, `overlap`, or
  `unresolved`; the other non-target statuses are exactly `pass`, `fail`, `unresolved`, or
  `not-applicable`; and `targetStatus` is one of `scoreable`, `blocked`, `lead`, or `excluded`.
  Citation authors/identifiers and every reason array are sorted nonempty strings; other citation and
  every methods-data value are string or null. `schedulingInputs` has exactly
  `authorNameVariants`, `openalexAuthorIds`, `relationIdentifiers`, and `versionUrls`, each a sorted,
  duplicate-free string array. Candidate `schedulingWitnesses` use the same exact witness schema and
  carry acquired/local-source citations or credits that are not response children. Each
  `schedulingInputs` array is the independently rederived sorted projection of the candidate plus
  its request/local witnesses; a producer cannot add or omit an input independently of its witness.
- A `relations-and-currency.jsonl` row has exactly `direction`, `hop`, `outcome`, `reasonCodes`,
  `requestIds`, `schema`, `stage`, `subjectScheduleId`, `triggerOccurrenceId`, and `witnessIds`; its schema is
  `phase6-wp1-relation-currency-row-v1`. Its stage/direction/hop/route cohort must match the stage
  table, and `outcome` is derived from its request terminal states. Rows sort field-by-field by
  `subjectScheduleId`, `stage`, `direction`, numeric `hop`, null-first `triggerOccurrenceId`,
  canonical JSON of sorted `requestIds`, then canonical JSON of sorted `witnessIds`; duplicate full
  tuples are rejected.
- `summary.json` has exactly `artifacts`, `counts`, `cutoffUtc`, `entryId`, `execution`,
  `limitations`, `outcome`, `passEligible`, `provenance`, `schema`, `sourceInputs`, and
  `terminalScope`; its schema is `phase6-wp1-source-search-summary-v1` and `passEligible` is literal
  false. `execution` has exactly `endedUtc` and `startedUtc`. `provenance` has exactly `arch`,
  `cliBlob`, `cliSha256`, `environment`, `executorBlob`, `executorCommit`, `executorSha256`, `head`,
  `manifestStartSha256`, `node`, `platform`, `registerBlob`, `registerSectionSha256`, and `v8`.
  `environment` has exactly `LANG`, `LC_ALL`, `NODE_EXTRA_CA_CERTS`, `NODE_TLS_REJECT_UNAUTHORIZED`,
  `OPENSSL_CONF`, `SSL_CERT_DIR`, `SSL_CERT_FILE`, and `TZ`; the
  `LANG`, `LC_ALL`, and `TZ` are string or null, while each certificate value is null or exactly
  `{bytes,path,sha256}`; the three refused TLS/config override keys are literal null.
  `sourceInputs` is sorted `{bytes,path,sha256}`. `artifacts` lists the other four products as sorted
  `{bytes,path,sha256}`. `counts` has exactly `baseQueryRouteCombinations`, `dynamicRequests`,
  `occurrences`, `outstandingRequests`, `requests`, and `terminalRequests`. `terminalScope` has
  exactly sorted `accessFailures`, `capIncomplete`, `noResults`, and `unresolvedSources` arrays.
  `outcome` is exactly `incomplete`, `complete-candidate-found`, or
  `complete-no-admissible-candidate`, derived without changing `passEligible=false`.

`verify` strictly parses all five files and independently recomputes, rather than trusts: every
request/occurrence ID; the complete 243-combination base schedule and every required fixed page;
continuation parent hashes and missing children; relation/Rule 12 triggers and the stage table;
request terminal/cap/access outcomes; identifier normalization, conflicts, union components,
aliases and canonical-variant selection; candidate/component cross-references; the four artifact
descriptors; every summary count/scope/outcome; and literal `passEligible=false`. It also reopens the
global manifest and checks exact path/byte/hash/count/total pins. The verifier derives structural
search completion and fail-closed disposition without reading `summary.outcome` or
`summary.passEligible`, then requires the stored values to equal the independent result. It cannot
accept the producer-selected relation rows as the schedule: it expands every complete request-side
scheduling witness and candidate scheduling input into the required relation/currency rows and
descendant requests, rejects an unreferenced row, and rejects any missing witness, trigger or
descendant. It cannot establish completeness/correctness of parser-entered scheduling/screen
witnesses, relation members, or methods facts, or that a copyrighted source actually supports those
facts, when the raw source/response bytes are intentionally absent;
a successor candidate lock remains forbidden until an independent reviewer reopens the acquired
source and records that scientific review.

Focused negative controls independently prove and then reject mutation of each of: an unknown
schema, an omitted registered request, a registered
query/route/page, request identity field, continuation-parent hash, terminal/cap/access state,
occurrence ID, strong-ID bridge/conflict, component/canonical variant, required relation/Rule 12
trigger, candidate admissibility/status, summary count/outcome/pass field (including a summary-only
verdict flip), combined removal of one witness-derived trigger and all its descendants, artifact byte/path/hash,
and global-manifest path/byte/hash/file-count/total. A coherent repin of the five files and manifest
still fails against the flushed publication-plan root; no producer-supplied verdict is accepted.

Before changing tracked evidence, the checkpoint stores and atomically flushes a publication plan
containing exactly `aggregateRootSha256`, `artifacts`, `nextManifestByteLength`,
`nextManifestSha256`, `nextManifestUtf8`, and `startingManifestSha256`. `artifacts` is the five
path-sorted `{bytes,path,sha256}` descriptors and `aggregateRootSha256` hashes their canonical
array; `nextManifestUtf8` is the exact deterministic next-manifest text and its byte count/hash must
agree. Publication verifies every old manifest pin, stages/reopens the
five files and next manifest, rechecks source drift, atomically renames the new entry directory,
then atomically replaces the manifest. The manifest keeps its existing schema and three metadata
strings verbatim, sorts file paths by UTF-16 code-unit order, recomputes `fileCount`/`totalBytes`,
and serializes as `JSON.stringify(value, null, 1)` plus LF with the existing top-level key order.
If interruption leaves a canonical entry absent from the old manifest, recovery may finish only
when every canonical byte matches the flushed publication plan and the old manifest still has its
recorded hash. If manifest replacement completed before the final checkpoint, recovery accepts only
the exact planned next-manifest hash/bytes together with the exact planned entry bytes and then
records completion; any third state, divergent byte, or coherent unregistered repin fails closed.
After one
entry publishes, its intentional tracked manifest change and new evidence must be reviewed and
committed before another entry may make a live request.

The CLI actions are the exact finite set `prepare`, `run-direct`, `export-pending-captures`,
`import-capture`, `import-assessment`, `status`, `publish`, `verify`, and `recover-owner`. Every action requires one
explicit registered `--entry`; unknown or duplicate flags/actions are errors. `run-direct` executes
registered pending direct requests only and checkpoints after every attempt; it never treats a
manual/opaque request as completed. These operational partitions change neither the schedule nor
the stopping condition.

The implementation-ambiguity audit used OpenAI Codex `gpt-5.6-sol` at inherited reasoning/context,
read the accepted register and existing evidence/provenance machinery offline, and independently
identified the identity, raw-record, manual-capture, ownership, terminal-state, header, drift and
publication choices fixed above. The amendment acceptance review used OpenAI Codex
`gpt-5.6-terra` at high reasoning with no inherited chat context. That read-only non-author reviewed
the current amendment against the surrounding register and WP1 executor step and challenged
implementability, crash recovery, identity uniqueness, ordering and pre-execution truth. Its first
round found two blockers and two should-fixes; its next round found one blocker and one should-fix;
its scoped re-review returned 0 blockers / 0 should-fixes after the corrections above. A later,
broader read-only `gpt-5.6-sol` audit reopened that verdict for exact stage/identity construction,
version-link routing, Unicode ordering, five-product schemas, Rule 9 recomputation and the
post-manifest crash state. After also closing scheduling-witness, local-member, route-usable operand,
source-kind cardinality and total-order findings, that non-author's final current-byte verdict is
0 blockers / 0 should-fixes. It checked the amended identities, stage/route operands, local-member
and witness derivation, source-kind cardinalities, ordering, capture/checkpoint schemas, Rule 9
verifier independence, negative controls and publication crash recovery. Its model was OpenAI Codex
`gpt-5.6-sol` with inherited parent context/reasoning; it independently re-executed no command.
All preceding amendment/schema reviews were offline, read-only, changed no file, and independently
re-executed no test or command. They did not inspect implementation or Git/commit ordering; inspect
live endpoint behavior, execute a request, validate a future checkpoint/evidence bundle, inspect the
1987 source, or perform TAX2 extraction, solver, GPU or education work. Those remain explicit limits,
not evidence that execution passed.

On the record candidate immediately before this provenance append, the same offline/read-only/
no-network non-author independently re-executed
`npm.cmd run lint:rule7` (clean, 420 files),
`npx.cmd vitest run runner/test/progress-index.test.ts` (7/7), and `git diff --check` (exit 0,
conversion warnings only). It also verified the four-file diff/status, preserved untracked `=`,
absence of the three planned executor/test files, and exact `docs/PROGRESS.md` identity: 14,338
bytes, 169 LF-only lines, terminal LF, SHA-256
`6ba5be29f5f9d92c13e0f014f77b6d77688236fc133099ddda7a89ab85982943`.
It inherited the scientific limits above and did not run exact root `npm test`; no full-suite claim
is made for this registration amendment.

### `YAMASHITA-FREEFALL-LINEAGE-01`

- **Status:** `UNEXECUTED`.
- **Exact question:** Which original Yamashita primary publication or dataset underlies the
  diameter and thickness measurements after 200 seconds of free-fall growth reproduced through
  `[1987Kob]`, and what pressure, temperature, supersaturation, growth time, apparatus/cloud,
  seed/population/crystallography, dimension definition, sample size, and uncertainty did it
  report?
- **Authoritative starting chain:** local `1910.06389v2`, Figure 6.22 (printed p. 234 / PDF p. 235),
  Figure 7.21 (printed p. 268 / PDF p. 269), and bibliography `[1987Kob]` (PDF p. 508).
  `[1987Kob]` is T. Kobayashi and T. Kuroda, *Snow Crystals: Morphology of Crystals — Part B*,
  Terra Scientific, Tokyo, 1987. The local monograph identifies the reproduced points as Yamashita
  measurements after 200 seconds; it does not establish a figure number inside the 1987 book or
  the original Yamashita citation. `2004.06212v1` Figure 8 is a second later reproduction, not an
  independent primary source.
- **Tracked pointer identities:** `research/1910.06389v2.pdf` is the 523-page official
  `https://arxiv.org/abs/1910.06389v2` source, 25,611,913 bytes, SHA-256
  `f6cd58ab841f841bcc310d2f722459122f7850cda9681ae0c7d1877bf21ef471`.
  `research/2004.06212v1.pdf` is the 13-page official
  `https://arxiv.org/abs/2004.06212v1` source, 1,562,618 bytes, SHA-256
  `6e450a1c2969e5cd074b2282ed727c25cb56858347246350c4e0e487b592f49e`.
- **Publication range:** 1930-01-01 through 1987-12-31 for the original source search. Rule 12 and
  forward-citation searches for each recovered candidate run from that candidate's earliest
  source-supported publication date through the common 2026-08-02 cutoff; no pre-book correction
  interval is omitted.
- **Exact discovery queries, each run on every shared route:**
  1. `Yamashita snow crystal growth`
  2. `A. Yamashita ice crystal growth`
  3. `Akira Yamashita snow crystal`
  4. `Yamashita snow crystal 200 seconds`
  5. `Yamashita diameter thickness snow crystal`
  6. `Yamashita free fall snow crystal`
  7. `山下 雪結晶 成長`
  8. `山下 雪結晶 200秒`
  9. `山下 氷晶 成長`
  10. `人工雪 結晶 山下`
  11. `Snow Crystals Morphology of Crystals Part B Kobayashi Kuroda 1987`
  12. `雪結晶 結晶成長 山下 明`
- **Normalized relation predicate:** concatenate the available title, abstract, subjects/topics,
  author display/family names, Crossref reference `author`/`unstructured` strings, and inspectable
  acquired full text before Unicode NFKC plus case-folding. That corpus must contain `yamashita` or
  `山下`, and at least one of `snow`, `ice`, `crystal`, `雪`, `氷`, or `結晶`; alternatively it
  must contain `200` plus one of `second`, `seconds`, `sec`, or `秒` and one of `diameter`,
  `thickness`, `dimension`, `直径`, or `厚`. Punctuation becomes spaces and runs of Unicode
  whitespace collapse before matching. Latin alternatives match complete whitespace-delimited
  tokens; CJK alternatives match substrings. In the Rule 12 same-author route, resolved AID or exact
  author-name matching discharges `yamashita`/`山下`; the topical clause is the crystal-term half
  or the complete 200-second/dimension alternative. A row missing title, abstract/subject and
  inspectable full text is `include-citation-lead`, never a predicate-negative exclusion.
- **Citation-chain rule:** inspect the 1987 book's figure credits, captions, notes, and reference
  entries explicitly connected to the Yamashita curves. The finite backward roots are the book
  citations/credits connected to those curves plus canonical discovery records assigned either
  `include-acquire` or `include-citation-lead` and carrying a resolvable relation identifier;
  each is depth 0. Retrieve its backward members as depth 1, expand predicate-passing or
  metadata-missing depth-1/2 members to maximum depth 3, and never expand a depth-3 member. The
  finite forward roots are canonical `include-acquire` records whose source/metadata explicitly
  attributes the 200-second dimensions to Yamashita; each is depth 0. Retrieve direct citers as
  depth 1, expand only predicate-passing or metadata-missing depth-1 members to depth 2, and never
  expand depth 2 or promote any relation member to a new root. Rule 12 triggers for every forward
  root and every backward node assigned `screenDisposition=include-acquire`. The registered
  provider-order/cap rules govern cohort selection; a larger or inaccessible relation is scoped.
- **Inclusion rule:** include any work authored by a Yamashita whose title/metadata concerns snow
  or ice-crystal growth, or any source that explicitly credits Yamashita for the 200-second
  diameter/thickness data. Name ambiguity stays unresolved until authorship is reconciled.
- **Primary-source admission rule:** the inspectable source must present the experiment, methods,
  data/table/graph, or an author-controlled dataset. A later reproduction, review, textbook, or
  uncited curve is retained as a citation lead only. No missing condition or uncertainty may be
  inferred from plot shape or a later author's apparatus.
- **Deterministic stopping condition:** stop only after all 12 queries reach a registered terminal
  state on all nine routes;
  the connected book chain reaches a primary source, dead end, inaccessible record, or three
  backward hops; every finite forward root executes the registered walk through maximum depth two,
  terminating a branch on no results, access failure or cap; and every triggered Rule 12 check
  reaches a registered terminal state. Any cap or inaccessible source is named in the terminal scope. The permitted outcomes
  are a byte/stable-ID-provenanced primary identity and conditions, or a bounded search-negative/
  inaccessible record. Neither outcome by itself makes the source a scoreable target.
- **Execution:** `UNEXECUTED`; **execution/outcome reviewer:** `UNASSIGNED`. The offline
  pre-execution register review is recorded at the end of this section.

### `MATCHED-AIR-PRESSURE-01`

- **Status:** `UNEXECUTED`.
- **Exact question:** Is there a primary snow-crystal growth experiment that varies numeric
  background air pressure while sufficiently controlling apparatus, gas composition, temperature,
  supersaturation, growth duration/history, seed/crystallography or population definition,
  ventilation/support state, and a quantitative observable with usable uncertainty?
- **Publication range:** 1930-01-01 through the common 2026-08-02 cutoff.
- **Exact discovery queries, each run on every shared route:**
  1. `snow crystal growth pressure experiment air`
  2. `ice crystal growth air pressure supersaturation experiment`
  3. `snow crystals reduced pressure growth`
  4. `ice crystals pressure dependence air temperature supersaturation`
  5. `snow crystal low pressure air growth rate`
  6. `artificial snow crystals pressure experiment`
  7. `snow crystal growth different pressures same temperature`
  8. `ice crystal growth pressure chamber morphology`
  9. `雪結晶 成長 気圧 空気`
  10. `氷晶 成長 圧力 空気`
  11. `人工雪 結晶 気圧`
  12. `Gonda snow crystal pressure growth`
  13. `Takahashi Fukuta snow crystal pressure`
  14. `Bailey Hallett ice crystal pressure growth`
  15. `Yamashita snow crystal pressure`
- **Known seed records, retained rather than silently rediscovered:** Takahashi/Fukuta 1988 DOI
  `10.2151/jmsj1965.66.6_841`; Takahashi et al. 1991 DOI
  `10.2151/jmsj1965.69.1_15`; Kuroda and Gonda 1984 DOI
  `10.2151/jmsj1965.62.3_563`; Gonda 1976 DOI `10.2151/jmsj1965.54.4_233`; Gonda and Gomi 1985 DOI
  `10.3189/1985AoG6-1-222-224`; and Bailey and Hallett 2004 DOI
  `10.1175/1520-0469(2004)061<0514:GRAHOI>2.0.CO;2`. Their current rejection reasons in §6 remain
  provisional inputs to this fresh screen, not inherited verdicts.
- **Citation-chain rule:** for every known seed and every canonical discovery record assigned
  `include-acquire` or `include-citation-lead` and carrying a resolvable relation identifier, traverse
  the registered Crossref-backward/OpenAlex-backward/forward routes one hop. Normalize Unicode NFKC,
  case-fold, replace punctuation with spaces and collapse whitespace; continue a relation member
  only when its available title/abstract/subjects contain at least one of `snow`, `ice`, `crystal`,
  `雪`, `氷`, or `結晶` and at least one of `pressure`, `pressures`, `hpa`, `mb`, `mbar`, `bar`,
  `atm`, `気圧`, or `圧力`. Missing title plus abstract/subject/full text remains
  `include-citation-lead`. Latin alternatives match complete whitespace-delimited tokens and CJK
  alternatives match substrings. A passing or metadata-missing member receives one additional hop. The
  registered provider-order/cap rules govern each direction/candidate/hop. This is maximum depth
  two from the originating seed, not an unbounded snowball search. Rule 12 triggers for every node
  assigned `screenDisposition=include-acquire`; citation-lead-only nodes do not become quantitative
  candidates unless full screening changes that disposition under the frozen rule.
- **Inclusion rule:** include an experimental primary work if its title, abstract, metadata, or
  inspectable full text reports snow/ice deposition growth or morphology at a numeric gas
  pressure, or compares two pressures. Retain uncertain metadata for acquisition. Theory,
  simulation, sublimation-only, atmospheric remote sensing, bulk cloud statistics, and non-water
  crystals are excluded with reasons, but any paper that supplies a citation to a potentially
  qualifying experiment remains a citation lead.
- **Matched-target rule:** at least two numeric pressures must come from the same experiment or a
  source-demonstrated identical apparatus/protocol. Gas composition, temperature, supersaturation
  definition, duration/history, initial particle/population, support/ventilation, and observable
  must either be identical by design within stated uncertainty or have pressure-specific measured
  values that can be supplied to the solver without fitting. The source must provide paired or
  distribution-compatible outputs and source-stated uncertainty, raw repeat data, or sufficient
  instrument/repeat information for a prospectively registered uncertainty operator. A change in
  gas species, substrate, liquid-water/riming population, temperature regime, or unobserved
  crystallography is a mismatch, not a pressure effect.
- **Prediction-side rule:** the current solver must predict the reported observable without
  selecting an unobserved initial state, tuning to that outcome, or adding an unregistered mapping
  for substrate, ventilation, latent heat, polycrystallinity, riming, sublimation, or defect/step
  physics. A source may be scientifically valuable yet blocked for the present model.
- **Held-out independence rule:** before `scoreable`, trace every candidate dataset, apparatus
  lineage, calibration, observable and derived input against every P1–P4 source/value in
  `docs/libbrecht-parameters.md`, the CAK source chain, and the M1/TAX2 source chain in ADRs 0030,
  0036 and 0040. Record `independenceStatus` separately for `CAK`, `M1`, and
  `M1_NO_DIP_ABLATION` as `independent`, `overlap`, or `unresolved`, with the exact shared data or
  citation path. Shared authorship alone is disclosed but is not data reuse. `overlap` or
  `unresolved` is fail-closed for that arm; no target/tolerance may be derived from data that
  supplied, calibrated, selected, or evaluated the same model input.
- **Deterministic stopping condition:** stop only after all 15 queries reach a registered terminal
  state on all nine routes;
  all seed/candidate citation walks and Rule 12 checks complete; every `include-acquire` work is
  acquired or explicitly marked inaccessible; and citation-lead-only metadata rows remain visible
  and pass-ineligible. Any cap is part of the result's scope. The permitted outcomes
  are a source-locked candidate that passes matching, model physics, uncertainty and held-out
  independence with a separately predeclared uncertainty operator, or a scoped source/model-physics/
  independence blocker. A simulator-only pressure ladder cannot close this search.
- **Execution:** `UNEXECUTED`; **execution/outcome reviewer:** `UNASSIGNED`. The offline
  pre-execution register review is recorded at the end of this section.

### `TAX2-PANEL-SPAN-01`

- **Status:** `REGISTERED; OPERATOR NOT YET PRE-REGISTERED; NO NUMERIC SPANS EXTRACTED`.
- **Exact question:** Under one prospectively frozen operator that consumes no model result, what
  two-dimensional projected crystal span can be measured at each panel's reported growth-time
  snapshot across all 216 candidate TAX2 Figure 2 addresses, retaining operator-classified blanks,
  refusals and censoring?
- **Source identity:** `research/2306.13087v1.pdf`, the 14-page official
  `https://arxiv.org/abs/2306.13087v1` source, 12,317,042 bytes, SHA-256
  `20f579e01777d51b81b527751b32c3e44b1d8ebe9f1d09a7f15554c2445381af`. Source PDF pages 11–14
  (one-based PDF pages, also the page numbers in `research/figures.md`) contain the registered grid.
- **Existing inspection-render leads, not yet authorized measurement inputs:**

  | file under ignored `research/figures/` | bytes | pixels | SHA-256 |
  |---|---:|---:|---|
  | `nakaya-206-observations-p1-minus0.5-to-4.5C.png` | 4,403,023 | 2550×3300 | `0043b9d1a9375c84970b972c3dc45e117a8f3c939c0818834228ef94c28d7af8` |
  | `nakaya-206-observations-p2-minus5-to-10C.png` | 4,353,465 | 2550×3300 | `366bfd0b10465673a850d4bc0086611e323e1482190ab3e69a969e30c090e797` |
  | `nakaya-206-observations-p3-minus11-to-16C.png` | 5,514,953 | 2550×3300 | `b1f9e270facadeb0641f454bd569113456850be5d342aca36e45644af3e6ed5b` |
  | `nakaya-206-observations-p4-minus17-to-24C.png` | 4,493,705 | 2550×3300 | `fe22dadd963b8f16aa3110b2ffc6b1a15cb9fa625bec59c6c936d79fe0a3f9c1` |

  The operator pre-registration must either bind these exact PNG bytes as inputs or define and bind
  a new deterministic render. It must record renderer/tool/version, exact arguments, PDF page and
  crop boxes, DPI, output pixels, color/transparency handling, resampling, and a render/hash check,
  plus a predeclared renderer/resampling sensitivity. This register does not choose between them.
- **Panel universe:** the candidate address space is the complete 24-temperature by 9-row grid,
  216 addresses in source order. The source reports 206 observations and prior visual review found
  ten apparent blank cells (four on page 11 and six on page 14), but neither the blank positions nor
  the count is an accepted extraction result. The pre-registered operator must rederive every
  address and blank/refusal/censor status uniformly; no failure may silently reduce the denominator.
- **Known scientific scope:** each printed micrometre label is a square field-of-view width, not a
  crystal dimension. The crystals grow on c-axis electric needles and are observed in a
  two-dimensional projection. TAX2 co-publishes this corpus with M1 and does not document that the
  panels were prospectively held out from M1's construction or evaluation. The project therefore
  applies the conservative `inSampleForM1=true` label; it does not claim that these observations
  caused or selected M1. Prior human/model inspection of these pages and historical CAK/M1 output is
  disclosed; no personnel blindness is claimed.
- **Pre-extraction gate:** commit
  `research/phase6-tax2-panel-span-preregistration.md`, its deterministic implementation, fixtures,
  canonical schema, negative controls, uncertainty/sensitivity protocol, and independently selected
  remeasurement sample before exact page paths are supplied to its extraction entry point. Any later render, crop,
  scale, segmentation, threshold, rule, or code change creates a new operator ID, preserves the old
  output, receives new review, and forces all panels to be re-extracted. Panel-specific fixes after
  seeing spans are forbidden.
- **Required fail-closed labels:** every row and published bundle records
  `inSampleForM1=true`, `geometry=c-axis-needle`, `observable=2d-projected-span`, and
  `passEligible=false`. Refused and censored rows remain present with reason codes.
- **Evidence boundary:** transient masks, crops, and diagnostics remain under `research/tmp/`.
  Copyrighted source/render bytes are not published. Derived canonical numeric rows, provenance,
  negative-control results, remeasurement results, and summaries go under the tracked
  `evidence/phase6-tax2-panel-span-01/` bundle. Every published file is byte-counted and SHA-256
  registered in `evidence/MANIFEST.json`, and the evidence-integrity test must reopen it.
- **Admissible claim:** measured two-dimensional projected spans for the TAX2 c-axis-needle corpus,
  with stated refusals/censoring and uncertainty. Success does not establish a three-dimensional
  maximum dimension, source-match the current regular-prism seed, or make the data held out for M1.
- **Operator registration:** `UNEXECUTED`; **numeric extraction:** `UNEXECUTED`;
  **operator/outcome reviewers:** `UNASSIGNED`. The offline pre-execution register review is
  recorded below.

### Pre-execution register review provenance and limits

Three read-only non-author review slices used OpenAI Codex `gpt-5.6-sol` with inherited repository
context and known historical CAK/M1 output. The full acceptance reviewer used ultra reasoning and
read the complete candidate then under review, its surrounding source-currency record, the WP1 and parent
plans, handoff, progress index, Phase 6 charter clauses, lessons, and exact diff. It independently
checked the request/date/cap rules, finite citation and Rule 12 expansion, two-axis dispositions,
identity union/conflicts, immutable schedule IDs, checkpoints and hashes, evidence publication,
pressure-arm independence, and TAX2 anti-tuning/scope. It recomputed the three registered PDF
identities/page counts and all four TAX2 render identities, dimensions and RGB format; independently
extracted the monograph PDF-page 235/269/508 pointers and later Figure 8 reproduction; ran Rule 7
clean over 420 files, progress-index 7/7, and `git diff --check`; and returned 0 blockers / 0
should-fixes after the corrections above.

The endpoint-focused reviewer separately attacked encoding, request syntax, caps, relation ordering,
Rule 12 construction, identifier/date normalization, union/conflict behavior, immutable scheduling,
restart artifacts and terminal states. It returned 0 blockers / 0 should-fixes on the final bytes.
The local-source reviewer independently inspected the PDFs/renders, recomputed their sizes, hashes,
page counts and image dimensions, checked the 24×9 candidate universe and apparent 4+6 blank
pattern as prior inspection rather than extraction, and corrected the unsupported claim that the
panels constructed M1 plus the unsupported word `terminal`. Its final scientific re-review was
clean; its sole remaining recordkeeping request was this provenance section.

All three reviews were offline. They did not inspect the 1987 book; call or verify live provider
endpoints; execute or screen the searches; implement/test the executor, checkpoint or evidence
publisher; acquire/translate the original Yamashita source; pre-register or execute TAX2 spans;
inspect every observation; run the source-lock/evidence-integrity verifiers or exact root
`npm test`; or inspect R15, solver, GPU, education or later Phase 6 work. Live endpoint behavior and
all execution outcomes therefore remain open and fail closed under this register.
