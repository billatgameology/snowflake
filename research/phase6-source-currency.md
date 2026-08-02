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
`User-Agent: VirtualCloudChamber-Phase6-WP1/1.0` and the exact route `Accept` value frozen below.
Crossref, OpenAlex, CiNii, Google Books and Internet Archive use `application/json`; NDL uses
`application/xml`; J-STAGE, WorldCat and `registered-version-url` use `text/html`. The supplemental
opaque search call has no HTTP headers exposed to this protocol, so both controlled-header values
are null and both semantic-header statuses are `not-applicable`. If a route requires a credential or
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

Identity is a union of every shared normalized strong identifier: DOI; arXiv versioned identifier;
OpenAlex work ID; PubMed/PMC ID; J-STAGE article ID; CiNii ID; NDL bibliographic ID; valid ISBN plus volume; Internet
Archive identifier; or OCLC number. A record carrying DOI plus OpenAlex ID therefore joins a later
record carrying only that OpenAlex ID. If one occurrence would bridge components containing
different nonempty DOIs or conflicting ISBN-plus-volume identities, do not union them: give the
occurrence a raw-hash identity and mark `identity-conflict` for review. Only when no strong ID exists
may Unicode-NFKC/case-folded title plus a nonmissing first-author family name and four-digit year
form a fallback key. A missing author or year forces a separate raw-record SHA-256 key, preventing
generic titles from merging.

That mark is closed data, not prose. Every occurrence has `identityStatus=resolved` with
`identityConflictWitness=null`, or `identityStatus=conflict` with a witness containing exactly
`conflictingComponentKeys`, `conflictingStrongIdentifiers`, and `triggerOccurrenceId`. The
trigger is that immutable occurrence ID; both arrays are UTF-16-sorted, duplicate-free and contain
the complete pre-union keys/normalized strong IDs that made the bridge contradictory. A conflict
never unions those components, makes effective candidate `admissibility.identity=fail`, publishes
`identity-conflict:OCCURRENCE_ID`, adds `resolve-identity`, and cannot be scoreable even after a
source assessment. A resolved component has effective identity `pass`; no producer-entered status
can override this derivation.

Every provider/query occurrence remains in the ledger. Duplicate occurrences point to one
canonical component. The component key is its lexicographically smallest type-prefixed strong ID,
otherwise its fallback or raw-hash key. The canonical display variant maximizes the number present
among the fixed fields `title`, `firstAuthor`, `publicationDate`, `venue`, `strongIdentifier`,
`abstractOrSubject`, and `acquisitionURL`, then minimizes the lexicographically joined normalized
strong IDs and finally the stored lowercase `rawRecordSha256`; route or arrival order never chooses
it. An occurrence's display `strongIdentifier` is the UTF-16-smallest type-prefixed normalized
strong identifier it carries, or null. No unstated JSON projection or terminal-LF choice enters
either tie-break. Metadata from
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

Initial parsing is a total function. Each ordinary occurrence first receives
`screenDispositionBeforeAlias` in the three-value science vocabulary without
`duplicate-alias`. The normalized metadata corpus is the exact entry-predicate corpus built only
from complete parsed title, abstract/subjects/topics and author strings. The six boolean
`screenWitness` members are the independently recomputed truth values of the entry's registered
Yamashita token, crystal token, pressure token and complete 200-second/dimension alternative;
`metadataSufficient=true` exactly when title is nonempty and abstract/subject metadata is present;
and `primaryExperimentClaim=true` exactly when the normalized corpus contains one of the complete
Latin tokens/phrases `experiment`, `experimental`, `measurement`, `measurements`, `observed`,
`observation`, `growth rate`, or `morphology`, or the CJK substrings `実験`, `測定`, `観測`,
or `形態`.

`excludedCategory` is null unless the pressure entry's sufficient corpus first matches, in this
fixed priority, `non-water-crystal`, `sublimation-only`, `atmospheric-remote-sensing`,
`bulk-cloud-statistics`, or `theory-or-simulation`. Those categories respectively require a
complete phrase `non water crystal`, `sodium chloride crystal`, `ammonium crystal`, or
`carbon dioxide crystal`; `sublimation` or `sublimate` without `deposition`, `growth`, `析出`,
or `成長`; `remote sensing`, `radar retrieval`, or `satellite retrieval`; `cloud statistics`
or `precipitation statistics`; or one of `theory`, `theoretical`, `simulation`, `numerical
model` without any primary-experiment-claim term. Complete Latin phrases use the registered
whitespace-token rule and CJK uses substring matching. The initial disposition priority is: a positive complete entry predicate plus
`primaryExperimentClaim=true` and null exclusion gives `include-acquire`; a positive predicate
without that claim, or any insufficient metadata, gives `include-citation-lead`; otherwise
sufficient metadata gives `exclude-out-of-scope`. Its initial acquisition state is respectively
`not-attempted`, `metadata-only-by-design`, or `not-required`, with null pointer.

Identity is then applied without erasing that science result. The occurrence retains
`screenDispositionBeforeAlias`; the current canonical occurrence's `screenDisposition` equals
that value and every other member's is `duplicate-alias`. A late merge re-runs only the registered
canonical selection and those alias labels; it never changes retained pre-alias screen,
acquisition, or assessment history. Candidate science is reduced over complete pre-alias states and
effective assessments, so an assessed occurrence does not lose evidence merely because a later
bridge makes it an alias. The version-link special case computes the same token booleans over
`documentTitle`, has `metadataSufficient` equal to title presence,
`primaryExperimentClaim=false`, and null exclusion except `post-cutoff-follow-up`; its
acquisition pointer is the exact reserved capture path/bytes/hash plus empty relevant pages.

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
OpenAlex author ID, and each `CANDIDATE_DATE` is one registered source-supported publication lower
bound below. Each placeholder is substituted and encoded under the one-pass rule above.

Only validated short-form `WID`/`AID` values from the normalization rule enter requests. For
`CANDIDATE_DATE`, preserve every reported publication/issued/print/online date variant, expand a
source-supported `YYYY` to `YYYY-01-01` and `YYYY-MM` to `YYYY-MM-01`. Deposit/index dates are
not publication operands. To make late source assessment and component merge append-only rather
than arrival-dependent, derived scheduling expands one complete request family for every distinct
supported expanded lower bound retained anywhere in the component or its assessment history;
existing request IDs remain required when another date arrives. The earliest value is the
candidate's display/coverage lower bound, but no later supported variant is discarded. If no
publication year is supported, use the entry's registered `FROM` date solely as a conservative
search lower bound, mark date identity unresolved, and prohibit quantitative target admission.
Every usable value survives as a `phase6-wp1-publication-date-witness-v1` object with exactly
`expandedLowerBound`, `kind`, `occurrenceId`, `rawValue`, and `sourceField`. `kind` is
`publication`, `issued`, `print`, or `online`; `rawValue` preserves the provider/source value
as a nonempty string or canonical JSON string; `sourceField` is its nonempty provider field or
source locator; and `expandedLowerBound` is the independently recomputed `YYYY-MM-DD` lower bound.
Witnesses sort by lower bound, kind, occurrence ID, source field, then raw value and are
duplicate-free. Each occurrence publishes its complete provider-derived witnesses, and assessment
scheduling inputs publish any additional acquired-source witnesses. Candidate scheduling inputs
are their complete append-only union. Each distinct lower bound is one `CANDIDATE_DATE` request
operand; the registered `FROM` fallback is the sole operand only when the union is empty. A later
revision may add but never delete a witness. The fallback forces effective
`admissibility.currency=unresolved` and therefore blocks scoreability independent of an imported
assessment; negative controls remove/add a witness and mutate a date operand.

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

Every initial Rule 12 version-link operand is parsed with pinned-Node WHATWG `new URL(value)`,
requires `http:` or `https:`, empty username/password, has its fragment cleared, and uses the
resulting `.href` as its sole request/loop identity—the same normalization used after redirects.
Valid duplicates collapse after that serialization. An observed value that cannot satisfy this rule
is not dispatched or silently dropped: its raw UTF-8 value is represented by lowercase SHA-256 in
the supplying scheduling witness and candidate `schedulingInputs.unusableVersionUrlSha256s`; any
nonnull member produces `invalid-version-url:SHA256`, an unresolved Rule 12 scope and the effective
currency clamp. Raw capture/source bytes remain the authority for the undistributed original value.

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
  page ordinal, prior-response hash when an opaque cursor is used, registered identity operands
  (with decoded parameters rederived rather than stored), exact final
  URL, non-secret headers, attempts, UTC times, HTTP/fetch terminal state, status, raw path/bytes/
  SHA-256, capture kind, provider total, returned count, next cursor/link, cap flag, and error;
- for each returned occurrence: immutable `occurrenceId`, provider rank, raw-record SHA-256,
  current component key plus alias history, canonical-variant pointer, both disposition axes, closed
  screen/cutoff fields, publication-date witnesses, citation-walk trigger, and acquisition pointer; and
- outstanding request IDs. Page/cursor progress is represented only by terminal request rows and
  their hash-bound continuation descendants; there is no independent producer-written progress
  pointer.

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

The route-to-adapter map is total and immutable. `crossref`, `openalex`, `cinii`, `ndl`,
`google-books`, and `internet-archive` use `captureMode=direct-http`. `jstage`, `worldcat`,
`supplemental-web`, and derived-only `registered-version-url` use
`captureMode=manual-export`. The intended request for every route except `supplemental-web` has
`kind=http` and its exact URL; the supplemental route has `kind=opaque-tool` and the exact registered tool-call
identity. Adapter selection is rederived from `route` and is never a CLI or checkpoint choice.

A successful `registered-version-url` inspection is deliberately one page observation, not a
provider result list. A confirmed-semantic-header `manual-page-source` capture with final HTTP status 200--299
must contain exactly one record at `sourceLocator=displayed-result-index:1`; that record's `fields`
object has exactly `cutoffDisposition`, `cutoffWitness`, `documentDate`, `documentTitle`,
`stableIdentifiers`, and `versionLabel`. `cutoffDisposition` is exactly `admissible-precutoff`,
`post-cutoff-follow-up`, or `public-by-cutoff-unresolved`; `cutoffWitness` is a nonempty string naming
the captured source field/date that supports the first two values and is null for unresolved.
`documentDate`, `documentTitle`, and `versionLabel` are nonempty strings or null; `stableIdentifiers` is the
UTF-16-sorted duplicate-free array of normalized type-prefixed identifiers actually displayed or
encoded in authoritative page metadata. The request has `providerTotal=1`, `returnedCount=1`,
`continuation=null`, `capTruncated=false`, one independently derived occurrence ID,
`terminalState=complete`, and `reasonCode=version-link-inspected`. Its occurrence has
`citationWalkTrigger=false`; its `screenDisposition` is `include-citation-lead` for
`admissible-precutoff` or `public-by-cutoff-unresolved` and `exclude-out-of-scope` for
`post-cutoff-follow-up`, with the exact cutoff disposition in `display.cutoffDisposition`. It has
`acquisitionStatus=acquired-and-verified`, the final URL as `display.acquisitionURL`, and the four
observed fields projected into the ordinary citation/identifier display plus
`display.cutoffDisposition`, `display.cutoffWitness`, and `display.versionLabel`; unavailable ordinary display fields are null and
`abstractOrSubjectPresent=false`. It schedules no descendant. `public-by-cutoff-unresolved` forces
the linked candidate's `admissibility.currency=unresolved` and cannot discharge Rule 12;
post-cutoff content is retained but cannot enter a target. A 2xx capture lacking that one exact
record is `provider-parse-failure`; non-2xx and header failures use the ordinary terminal rules.
Whether the observed page actually supersedes or qualifies a candidate remains an independently
reviewed source assessment and candidate disposition, never a fact inferred from HTTP success.

**Capture and terminal schemas.** Direct JSON/XML HTTP responses are fetched by the executor.
J-STAGE, WorldCat, saved manual pages and the supplemental opaque search provider enter only through
a canonical `phase6-wp1-manual-capture-v1` import. That import binds the registered request ID and
identity object, exact intended call/URL, capture kind, final URL where observable, stable response
headers/metadata, provider total, continuation/cap state, complete returned provider-record
envelopes, and either an ignored raw-page path plus bytes/hash or the canonical observable tool
result. It cannot create an unregistered request, change a query, substitute a provider, or mark an
uncaptured continuation complete.

The manual-capture object has exactly these keys, with explicit null rather than omission:
`attemptOrdinal`, `capTruncated`, `captureKind`, `continuation`, `endedUtc`, `error`, `finalUrl`,
`identity`, `intendedRequest`, `observableResult`, `providerTotal`, `records`, `redirects`,
`requestId`, `reservationId`, `responseHeaders`, `schema`, `semanticHeaderStatus`, `startedUtc`, and
`status`. `schema` is the literal above; `attemptOrdinal`, `reservationId`, `requestId`, and
`identity` must equal the one installed manual-export reservation and request. `startedUtc` is the
operator-recorded actual external-call start, must be no earlier than the reservation's
`reservedUtc` and no later than `endedUtc`, and is explicitly not replaced by export time.
`intendedRequest` has exactly `controlledHeaders`,
`kind`, and `urlOrCall`, where `controlledHeaders` has exactly `accept` and `userAgent` and `kind` is
`http` or `opaque-tool`; `semanticHeaderStatus` has exactly `accept` and `userAgent`, each one of
`confirmed`, `unobservable`, `uncontrollable`, or `not-applicable`; `continuation` is null or has
exactly `kind`, `value`, and `url`, where `kind` is exactly `cursor`, `next-link`, or `page-number`;
`value` is a nonempty string (ASCII canonical positive integer for `page-number`) and `url` is the
exact absolute next URL for `next-link`/`page-number` or null for an opaque cursor;
`redirects` uses the exact direct-hop row schema and is empty for an opaque-tool call; and every
`records` member has exactly `fields` and
`sourceLocator` under the non-JSON record rule. Exactly one of these capture representations is
used: `manual-page-source` names an ignored regular file in `observableResult` with exactly
`bytes`, `path`, and `sha256`; `observable-tool-result` stores the complete strict-JSON observable
tool result there; `no-response` stores the already registered no-response object. The importer
reopens and hashes any named file before acceptance. Extra/missing keys, a mismatched request ID,
wrong representation, noncanonical JSON, out-of-range count, or malformed continuation object is a
parse failure. An honestly transcribed provider-advertised total, cap flag, or continuation whose value conflicts
with the otherwise complete captured records is accepted as observed input and classified by the
registered `provider-count-inconsistent`/`provider-continuation-missing` precedence; it is not
rewritten into agreement. The checkpoint attempt always hashes the complete
canonical outer manual-capture envelope and uses `captureKind=manual-capture-envelope`; when its
`captureKind` member is `no-response`, the nested object must independently match the reservation
and outer timing/error/result facts but is not separately substituted as the attempt capture. A
direct adapter no-response still hashes its standalone no-response object and uses
`captureKind=no-response`.

An acquisition outcome and scientific assessment enter together only through canonical
`phase6-wp1-candidate-assessment-v1` with exactly `admissibility`, `acquisition`, `citation`,
`currencyLinks`, `independenceEvidence`, `methodsData`, `occurrenceId`, `review`,
`schedulingInputs`, `schedulingWitnesses`, `schema`, `screening`, and `source`.
`occurrenceId` is immutable even if its component later merges; citation/methods/admissibility/
scheduling objects use the exact published schemas below. `source` is null or has exactly `bytes`,
`path`, `relevantPages`, and `sha256` and is reopened before import.

`acquisition` has exactly `attempts` and `status`. Its status is one of
`acquired-and-verified`, `inaccessible-after-attempts`, `metadata-only-by-design`, or
`not-required`; an accepted assessment can never claim `not-attempted`. Each attempt has exactly
`detail`, `endedUtc`, `evidence`, `httpStatus`, `locator`, and `outcome`. `evidence` is null or
exactly `{bytes,path,sha256}`; `httpStatus` is null or a safe integer from 100 through 599; and
`locator` has exactly `kind`, `provenance`, and `value`. Its kind is `http`, `repository`, or
`opaque`; provenance is `candidate-acquisition-url`, `provider-fulltext-url`,
`publisher-version-url`, `repository-url`, `registered-source-path`, or
`operator-discovered-url`. HTTP values use the registered WHATWG http(s), empty-credential,
fragment-cleared serialization; repository values are governed repository-relative artifact paths;
opaque values are nonempty stable tool/catalog locators. A locator must be rederived from the
occurrence, a registered version/scheduling witness or source input; an operator-discovered value
requires nonnull evidence and an adequate review. `outcome` is one of
`acquired`, `authentication-required`, `forbidden`, `not-found`, `gone`,
`paywall-or-license-barrier`, `network-failure`, `format-unusable`, or
`other-access-failure`. `detail` is null for every closed outcome except
`other-access-failure`, where it is nonempty. HTTP status and outcome are constrained:
`authentication-required` uses 401/407, `forbidden` 403/451, `not-found` 404, `gone` 410,
`network-failure` null, and `acquired` a 2xx or null non-HTTP locator. A
`paywall-or-license-barrier` uses 402/403/a 2xx paywall page or null non-HTTP observation and
requires evidence; `format-unusable` uses a 2xx or null and requires evidence; only
`other-access-failure` permits another status/null combination and records its detail. Attempts
sort by end time, canonical locator object, outcome, null-first
status, then null-first evidence hash and are duplicate-free. `acquired-and-verified` requires a
nonnull source, a nonempty attempt list whose final member is `acquired`, and a reopened source
whose bytes/hash agree; no other status permits a nonnull source or an `acquired` attempt.
`inaccessible-after-attempts` requires no acquired attempt and either one evidence-bearing
authoritative HTTP terminal observation (401/403/404/407/410/451) or at least two distinct normalized
locators. It means inaccessible under exactly those recorded attempts, never globally inaccessible.
`metadata-only-by-design` and `not-required` require no attempt, with the former allowed only for
a retained citation lead and the latter only for an exclusion. These are scoped observations, not
claims that every possible access route was exhausted.

`screening` has exactly `basis`, `disposition`, and `witness`. `basis` is `metadata-only` or
`acquired-source`; disposition is one of `include-acquire`, `include-citation-lead`, or
`exclude-out-of-scope`; and witness uses the exact closed screen-witness schema below. An
assessment of an occurrence currently marked `duplicate-alias` is refused and names its current
canonical occurrence instead. With null source, basis must be `metadata-only` and disposition/
witness must preserve the independently rebuilt pre-assessment screen. With nonnull source, basis
must be `acquired-source` and the importer re-executes the entry-specific full-text inclusion rule;
only that path may promote an `include-citation-lead` occurrence to `include-acquire` or otherwise
change its screen. The accepted transition deterministically replaces that occurrence's
`screenDisposition`, `screenWitness`, `acquisitionStatus`, and `acquisitionPointer`; every other
occurrence field remains rederived from captures and the final identity graph.

`review` has exactly `humanReviewed`, `humanReviewUncertainty`, `ocrTool`,
`originalLanguageExcerptSha256`, `reviewDisposition`, `reviewer`, `reviewLimits`,
`translationTool`, and `utc`, with explicit nulls. Its three states are exact biconditionals:
`adequate` iff `humanReviewed=true` and uncertainty is null; `limited` iff
`humanReviewed=true` and uncertainty is nonempty; and `unreviewed` iff
`humanReviewed=false` and uncertainty is nonempty. `reviewer` is nonempty and `reviewLimits` is a
UTF-16-sorted duplicate-free array of nonempty strings. Machine translation without named human
review must be `unreviewed`.

`currencyLinks` is a sorted duplicate-free array of exact objects
`{effect,relationRequestId,subjectOccurrenceId,witness}`. `effect` is `not-relevant`,
`confirms-current-version`, `corrects-without-superseding`, `supersedes`, or `unresolved`;
the two IDs are immutable registered IDs and witness is nonempty source-supported text or a stable
locator. A link is accepted only when the assessed occurrence was returned by that Rule 12 request
and its relation row names the subject occurrence; unrelated/base-search assessments use an empty
array. Links sort by subject occurrence ID, relation request ID, effect, then witness using UTF-16
code-unit order. `independenceEvidence` has exactly `CAK`, `M1`, and `M1_NO_DIP_ABLATION`. Each arm has
exactly `paths`, `rationales`, and `status`, with status equal to its corresponding admissibility
field and nonempty UTF-16-sorted duplicate-free path and rationale arrays. `independent` records the
complete checked source/data chain, `overlap` names the exact shared data or citation path, and
`unresolved` names the unresolved seam; a bare status is invalid.

Only manual `observableResult.path`, assessment `source.path`, acquisition-attempt
`evidence.path`, and accepted import/archive paths are governed by the following repository-artifact
rule; entry-relative raw/reservation paths and separately recorded certificate paths retain their
own rules. Each governed path is slash-normalized and repository-relative with no empty, dot or
dot-dot segment. A manual page source must lie under
`research/tmp/phase6-wp1-source-search-01/ENTRY_ID/source-pages/`; a source must be an exact
pre-existing registered input or lie under
`research/tmp/phase6-wp1-source-search-01/ENTRY_ID/sources/`; acquisition evidence must lie under
`research/tmp/phase6-wp1-source-search-01/ENTRY_ID/acquisition-evidence/`. Resolution walks each
component without following a symlink or reparse point, requires a regular file and exact on-disk
component spelling, and reopens/rehashes before and after parsing. Absolute or out-of-repository
paths are refused.

An accepted assessment is preserved by exact
`phase6-wp1-assessment-descriptor-v1` with exactly `admissibility`, `acquisition`,
`assessmentBytes`, `assessmentPath`, `assessmentSha256`, `citation`, `currencyLinks`,
`importedUtc`, `independenceEvidence`, `methodsData`, `occurrenceId`, `review`, `schedulingInputs`,
`schedulingWitnesses`, `schema`, `screening`, and `source`. Except for its three archive
descriptor fields, importer-sampled `importedUtc`, and descriptor schema, it copies every canonical
assessment member unchanged;
`assessmentPath` is the accepted ignored canonical assessment archive below. The checkpoint
retains these complete descriptors in `assessments`, and each tracked candidate publishes the
complete descriptor subset for its final component. A clean verifier can therefore rebuild the
projection from tracked descriptors, while initial root-bearing acceptance additionally requires
an independent reviewer to reopen every named assessment, source, and acquisition-evidence artifact.
That review still does not make the scientific content self-verifying.

Exactly one assessment is accepted per immutable occurrence ID. After the second source/archive
reopen and before mutation, the first import samples one strict injected UTC; it must be no earlier
than execution start, every acquisition-attempt end, review UTC, and the current retained
observational maximum, and becomes descriptor `importedUtc`. Re-import of the same canonical
assessment hash is idempotent and retains that original time; a second different assessment for that occurrence is rejected before
mutation. If later identity union merges components containing multiple assessed occurrences, all
descriptors remain. Candidate projection is conservative and order-independent: citation author and
stable-ID arrays are sorted unions; each scalar citation or methods field is the sole distinct
nonnull value or null when none/multiple, with every multiple-value field named in
`dispositionReasons` as `assessment-conflict:OBJECT.FIELD`. Each ordinary admissibility status
reduces `fail` before `unresolved` before `pass` before `not-applicable`; each independence status
reduces `overlap` before `unresolved` before `independent`. Each final independence-evidence arm
has that reduced status and the sorted union of every path/rationale. Currency links and scheduling
inputs/witnesses are complete sorted unions rederived from all component occurrences and
assessments. A component with no assessment is `lead`; any conflict or nonpassing load-bearing
status is `blocked`; only the exact acquired-source/all-pass/all-independent rule below is
`scoreable`. Arrival order and later canonical-variant change therefore cannot select scientific
admissibility.

Operator inputs use a closed inbox lifecycle. `import-capture` accepts only
`imports/inbox/capture-SHA256.json` and `import-assessment` only
`imports/inbox/assessment-SHA256.json`, with the filename digest equal to the canonical file bytes.
After the raw-attempt or assessment-descriptor checkpoint transition is durable, the importer
installs the unchanged inbox bytes by no-replace hard link/reopen validation at respectively
`imports/accepted-captures/SHA256.json` or `imports/accepted-assessments/SHA256.json`, then removes
only the authenticated inbox hard-link name. `EEXIST` requires identical bytes; both names must be
same-file identical before inbox unlink. The raw-attempt commit is made through a separately copied
temporary inode; it must not remain hard-linked to either inbox or accepted archive. A crash before
checkpoint leaves an inbox input for the
same explicit import; a crash after checkpoint deterministically finishes the accepted archive.
Every accepted capture archive must match exactly one attempt capture hash and every accepted
assessment archive exactly one descriptor; no accepted archive may be changed or removed. A single
valid pending inbox input is allowed during read-only `status` and stale-owner `recover-owner`;
every other non-import action still refuses, and more than one
inbox file, an unreferenced accepted archive, wrong prefix/hash, partial/noncanonical input, symlink,
reparse point, or nonregular file fails closed. This inventory prevents an accepted operator review
from disappearing while keeping manual response bytes duplicated only as ignored provenance and the
registered raw-attempt authority.

Owner recovery never interprets or imports inbox bytes: an owner record does not bind the action that
crashed, and a queued input may be unrelated. `recover-owner` is the sole mutating command exempt
from the one-pending-inbox refusal. It journals and replaces stale ownership exactly as registered,
leaves every inbox and accepted-archive byte untouched, and normally releases its authenticated live
successor after the recovery event is durable. A dead-claim continuation likewise leaves the inbox
unchanged and exits 78. The operator then invokes the explicit matching `import-capture --input` or
`import-assessment --input`; that importer idempotently distinguishes and completes the pre-checkpoint,
post-checkpoint/pre-archive, and post-archive/pre-unlink states from the checkpoint descriptor and
content-addressed archive. No recovery silently selects scientific input merely because it shares a
directory with a stale owner.

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
and proves its exact nonce and SHA-256 still match the in-memory owner it created. Before removal it
installs those unchanged bytes by no-replace hard link at exact
`audit/released-owners/OWNER_SHA256.json`, reopens both names, requires same-file identity and the
registered hash, and only then removes the authenticated `owner.json` name. An existing archive is
accepted only when it has the exact bytes and both current names are same-file hard links. A crash
with both names leaves an ordinary stale owner recoverable under the registered path; the release
archive does not authorize ownership or suppress recovery. Failure to authenticate, archive, or
remove is an error and leaves the owner for explicit recovery; it is never reported as a successful
clean release. Every retained audit-event `ownerSha256` must resolve to exactly one valid current,
released, or orphaned-owner byte identity, so later root-bearing verification never relies on an
unpreserved owner assertion. `prepare`, `run-direct`,
`import-capture`, `import-assessment`, `publish`, and `recover-owner` all use this acquire/release rule. Tests cover clean
handoff to the next invocation separately from crashed-owner recovery. The sole exception is the
registered dead-claim continuation: that actor never owns the claim-derived successor, exits 78 by
design, and must leave it for the next serialized recovery rather than falsely authenticate/remove
another PID's owner.

The checkpoint contains a canonical `auditEvents` array. A missing/tampered raw-checkpoint pair,
stale-owner recovery, parse failure, or publication recovery appends an event with UTC time, event
kind, request ID when applicable, prior path/hash facts and the prescribed action. An interrupted
attempt never overwrites or renames an earlier attempt. The checkpoint write is sibling create-new,
write, file flush, close, reopen/canonical-parse/hash, then atomic rename over `checkpoint.json`;
the temporary name is owner/sequence-specific. Only a terminal checkpoint entry whose capture bytes
and hash revalidate may be skipped.

Its top-level object has exactly `assessments`, `auditEvents`, `candidates`, `dispatchReservation`, `entryId`,
`execution`, `manifestStartSha256`, `occurrences`, `outstandingRequestIds`, `provenance`,
`publicationPlan`, `relations`, `requests`, `schema`, and `sourceInputs`.
`execution` has exactly `cutoffUtc`, `endedUtc`, and `startedUtc`, with `endedUtc=null` until
the science/import freeze; `provenance` is byte-for-byte the same
exact 14-key object later required in `summary.json`, and top-level `manifestStartSha256` must equal
`provenance.manifestStartSha256`. Checkpoint `sourceInputs` starts as the exact sorted registered
input set and, after each accepted assessment, becomes the independently rebuilt UTF-16-path-sorted
union of that initial set, every accepted assessment archive, and every source or acquisition-evidence
artifact named by those assessments; it must equal the summary projection at publication.
Request/occurrence/candidate/relation members
use the corresponding versioned row schemas below, with attempt `rawPath` additionally present only
in the ignored checkpoint form. The former independent last-page/cursor pointer is removed: terminal
request rows and hash-bound continuation identities are the only progress authority.
An audit event has exactly `action`, `eventId`, `kind`, `priorFacts`, `requestId`, and `utc`;
`eventId` is independently recomputed from the other five canonical fields. `publicationPlan` is
null or the latest exact closed object registered below. Outstanding IDs are sorted and rederived. This
closed key set, every nested row schema and all cross-references are validated before a checkpoint
can resume or publish.

#### 2026-08-02 implementation-readiness correction: captured retry state

The first executor skeleton, before HTTP/retry implementation and before any live request, exposed
two impossible crash-safe transitions: the published request schema allows terminal states only,
but the cold-resume contract requires a checkpoint immediately after a transient response whose
registered retry wait has not completed; and the four-attempt dispatch cap needs a durable reservation
before a transport call whose outcome may become unknowable in a hard crash.

A checkpoint-form request row therefore has one additional `terminalState` value,
`pending-retry`, with `reasonCode=retry-pending`. All of its ordinary identity and
intended-request fields remain exact. Its result fields are exactly `capTruncated=false`,
`continuation=null`, `providerTotal=null`, `returnedCount=0`, `occurrenceIds=[]`, and
`schedulingWitnesses=[]`. It remains in `outstandingRequestIds`. Its `attempts` array has consecutive
ordinals one through `n`, where `n` is one, two or three; every retained attempt is a captured HTTP
`429` or `5xx` response with `error=null`, `retryDecision=retry`, and the exact wait derived for that
ordinal from its own `retry-after` header or the 5/20/60-second fallback. The last attempt's wait is
the pending wait; earlier waits have completed. Attempt four, a non-retryable status, a missing or
invalid capture, a mismatched wait, or any nonempty parsed-result field rejects this state. The
tracked evidence form rejects `pending-retry` and publishes only a later terminal row.

Retry eligibility is decided before interpreting `Retry-After`: only a captured `429` or `5xx` at
ordinal one, two or three enters the following header rule. The same status at ordinal four is
`terminalState=terminal-access-failure`, `reasonCode=retry-exhausted`,
`retryDecision=terminal`, and `waitMs=0` regardless of its header; a non-retryable status follows its
registered terminal/success rule and likewise does not interpret this header. For an eligible
response, `Retry-After` is bounded before it can enter a pending row. Its only input is the one exact stored
lowercase `responseHeaders["retry-after"]` string after trimming leading/trailing HTTP optional
whitespace without changing internal bytes. A numeric value is syntactically valid only when the
remainder is ASCII decimal integer seconds and is parsed without a binary64 intermediate. A date is
syntactically valid only when the remainder is one IMF-fixdate value of exact form
`ddd, DD Mon YYYY HH:mm:ss GMT`; the pinned engine must parse it to an integral UTC millisecond. Any
duplicate/comma-joined value, alternate date form or other remainder matches neither grammar and is
invalid. A valid date's delay is computed relative to that attempt's same recorded `endedUtc`, not
to a later resume clock. A valid non-past value is accepted only when the resulting `waitMs` is a
safe integer from zero through `604800000` inclusive and `endedUtc + waitMs` is a safe,
representable UTC epoch millisecond. A null header, invalid syntax, unparseable date or past date
uses the registered ordinal's fallback; thus `1.5` is invalid and unambiguously falls back. A
syntactically valid numeric value over 604800 seconds, a valid future date more than 604800000
milliseconds after `endedUtc`, or an unsafe deadline is not truncated or replaced by a fallback.
That captured attempt has `retryDecision=terminal` and `waitMs=0`; attempts have no reason-code
field. The enclosing request is removed from `outstandingRequestIds` and becomes
`terminalState=terminal-access-failure` with `reasonCode=retry-after-out-of-range`, plus exactly
`capTruncated=false`, `continuation=null`, `providerTotal=null`, `returnedCount=0`,
`occurrenceIds=[]`, and `schedulingWitnesses=[]`.

On resume, the executor reopens and verifies the pending attempt capture, derives
`retryNotBeforeUtc = endedUtc + waitMs`, and uses only its recorded injected UTC clock. Before it
computes a remaining wait or applies the 60,000-millisecond threshold, it checks whether the first
resume-clock epoch is less than the pending attempt's `endedUtc` epoch. A later observed epoch is
also a regression when it is less than the immediately preceding epoch in the same invocation. On
either exact predicate the
executor appends an audit event carrying both epochs (`state=resume-clock-before-attempt` for the
first predicate or `state=invocation-clock-regressed` for the later predicate), leaves the verified `pending-retry` row and its
attempt array byte-for-byte unchanged, flushes the checkpoint, normally releases the owner, and exits
74 with machine-readable `injected-clock-regression`; it appends no synthetic attempt and performs no
transport call. Only after the first regression check, if more than 60,000 milliseconds remain,
`run-direct` flushes the unchanged pending checkpoint, normally releases the authenticated owner and
exits 75 with machine-readable `retry-pending`; it performs no transport call. Otherwise it issues
exactly one sleep for the nonnegative remaining duration and rechecks the injected UTC clock once. A
positive sleep after which the clock has not advanced uses `state=post-sleep-clock-stalled` and the
same nonterminal exit with reason `injected-clock-stalled`. If the clock advanced but remains before the deadline, the
executor instead repeats the already specified clean checkpoint/owner release and exit 75
`retry-pending`; it does not sleep or loop again in that invocation. A later invocation may continue
only after its clock is at least the captured `endedUtc`; it executes the next consecutive attempt
ordinal only after that clock reaches the deadline. These no-repeat/no-skip guarantees are relative
to the recorded injected UTC clock; an external wall-clock step does not support a stronger
elapsed-time claim.

The checkpoint top-level schema additionally has exact key `dispatchReservation`. It is null except
immediately around one direct transport call, when it is the exact object `attemptOrdinal`,
`rawPath`, `requestId`, `reservationId`, and `startedUtc`; `reservationId` is lowercase SHA-256 of
the canonical other four fields. Immediately before crossing the transport boundary, the executor
sets the next consecutive ordinal, exclusive raw path and start time, flushes this checkpoint, and
reopens and validates it. Only then may it call the transport.

A direct response is preserved as canonical sorted-key UTF-8 JSON with schema
`phase6-wp1-direct-http-capture-v1` and exactly `attemptOrdinal`, `bodyBase64`, `bodyBytes`,
`bodySha256`, `endedUtc`, `error`, `finalUrl`, `redirects`, `requestId`, `responseHeaders`, `schema`,
`startedUtc`, and `status`. `bodyBase64` is canonical RFC 4648 base64 with padding of the exact
registered client-decoded response-body bytes before text parsing, not compressed/wire octets;
decoded length/hash must equal `bodyBytes`/`bodySha256`; `error` is null and all other values obey the
attempt schemas. JSON, XML and any other registered response media therefore retain that exact
pre-parse representation without requiring the body itself to be canonical or JSON. The attempt's
`captureBytes`/`captureSha256` describe this complete envelope and `captureKind` is
`direct-http-envelope`. A caught transport failure uses the already registered canonical
`no-response` object instead.

Either capture kind is committed without overwrite on the same volume: create an owner/sequence-
specific sibling temporary file with Node `open(...,"wx")`, write and file-sync all bytes, close,
reopen and validate the complete canonical envelope/object and hash, then call Node `link(temp,
reservedPath)`. The hard-link operation is the no-replace publication primitive: `EEXIST` is never
overwritten or treated as success, and any unsupported/cross-device/other failure is a hard executor
error with the reservation retained. After a successful link, reopen and byte/hash-validate the
reserved path before unlinking the temporary name. A temporary file alone is never a committed
capture; existence of the linked reserved path plus successful schema/body/hash/request/ordinal
validation is the recovery predicate. The next checkpoint atomically appends the captured attempt
and clears the reservation.

After owner recovery, a nonnull reservation is never redispatched. If its exact reserved raw path
contains a complete, canonical capture for that request and ordinal, the executor reopens it and
performs the normal attempt transition. If the path is absent, partial, invalid or mismatched, the
executor preserves the original path and facts in an audit event and uses the deterministic sibling
path formed by inserting `.dispatch-unknown` immediately before the reserved path's `.json` suffix.
That recovery path is also exclusive and contains the same immutable request and attempt ordinals.
The executor creates there the registered canonical `no-response` object and attempt. Its error is
exactly `{code:"DISPATCH_OUTCOME_UNKNOWN",message:"Reserved direct request may have crossed the transport boundary before durable capture.",name:"DispatchOutcomeUnknownError"}`;
`status=null`, `finalUrl` is the exact intended URL, `redirects=[]`, every allow-listed response
header is null, `startedUtc` is the reservation's nonnull `dispatchStartedUtc`, `endedUtc` is the recovery clock,
`captureKind=no-response`, `retryDecision=terminal`, and `waitMs=0`; capture bytes/hash are rederived
from that object. The request is removed from `outstandingRequestIds`, has
`terminalState=terminal-access-failure` and
`reasonCode=dispatch-outcome-unknown-after-crash`, and has exactly `capTruncated=false`,
`continuation=null`, `providerTotal=null`, `returnedCount=0`, `occurrenceIds=[]`, and
`schedulingWitnesses=[]`; the same checkpoint transition clears the reservation. If a crash leaves an already complete canonical recovery
capture at that sibling path, the next recovery reuses it; an invalid or mismatched recovery path is
a hard error that preserves the reservation and both files. This conservative recovery can stop a
request that had not actually crossed the transport boundary, but it never repeats a possibly
dispatched attempt. Thus at most four registered attempt transport dispatches are possible,
including crash-ambiguous reservations, and every one consumes one of the four ordinals; each HTTP
attempt may still follow the separately recorded maximum of ten redirect hops, so this is not a cap
on underlying wire requests.

Mutation of the pending state, its closed result fields, captured bytes, attempt ordinal,
`endedUtc`, `waitMs`, retry decision, deadline bound, dispatch reservation, reservation ID or orphan
recovery is a focused negative control. This correction changes no endpoint, query, search cap or
scientific screen, and no result has been executed. It prospectively adds fail-closed access outcomes
for an over-seven-day server delay, clock failure and crash-ambiguous dispatch; those outcomes can
make a future search incomplete but cannot create a candidate or validation pass. All entries remain
unexecuted.

#### 2026-08-02 implementation-readiness correction: initialization and bounded transport

The next offline checkpoint/transport design pass, still before transport implementation or any live
request, exposed additional closed-schema and finite-liveness choices. This correction supersedes
only the conflicting operational sentences named below. It changes no endpoint, query, date, search
cap, relation depth, scientific screen, candidate, evidence outcome or executed result.

**Entry-local schedule and checkpoint initialization.** The root-wide 243-combination invariant is
the sum across the two literature entries, not the row count of either entry bundle. For
`YAMASHITA-FREEFALL-LINEAGE-01`, `verify` independently expands exactly 12 queries times nine routes
= 108 base query-route combinations and rejects a row for another entry. For
`MATCHED-AIR-PRESSURE-01`, it expands exactly 15 times nine = 135 and likewise rejects cross-entry
rows. Each summary's `counts.baseQueryRouteCombinations` is respectively 108 or 135. A root-wide
check over both published entry bundles rederives `108 + 135 = 243`. Required fixed pages, the 12
Crossref/OpenAlex resolutions of the six registered pressure DOI seeds, continuations and dynamic
descendants are additional requests and do not change that combination count. The fixed base-page
request counts are 168 and 210 respectively; the pressure entry's initial required-request count is
therefore 222 after adding its 12 seed resolutions.

The checkpoint `requests` array contains only requests with at least one durably captured attempt;
there is no invented pre-attempt terminal state. A terminal row is absent from
`outstandingRequestIds`; a `pending-retry` row remains there. A required request with no row yet also
remains outstanding, and `dispatchReservation` may name either such a request or the next attempt of
a verified pending-retry row. The initial Yamashita checkpoint therefore has `requests=[]` and the
168 fixed base-request IDs outstanding. The initial pressure checkpoint has `requests=[]` and the 210
fixed base-request plus 12 seed-resolution IDs outstanding. On every validation, the executor
independently expands the entry's fixed register plus complete scheduling witnesses/candidate inputs,
then requires `outstandingRequestIds` to equal exactly the sorted required IDs without terminal rows.
The initial and resumed forms use the same rule.

The two entry lifecycles are repository-serialized in the fixed order
`YAMASHITA-FREEFALL-LINEAGE-01` then `MATCHED-AIR-PRESSURE-01`; entry-local owner files do not imply
cross-entry concurrency. `prepare` for the first refuses any state directory for the second.
`prepare` for the second requires the first entry's exact six files and manifest descriptors to be
present in the current **committed HEAD**, to pass tracked-only clean structural verification, and
to contain the accepted `verification.json` record of the original independent root-bearing
publication review. Those committed tracked bytes and the manifest, not an ignored cache, are the
cross-entry authority. If
the first entry's ignored checkpoint still exists, it must validate as completed/published with no
owner, recovery claim, reservation, temporary, inbox input, or unfinished publication state; its
absence after a clean clone or deliberate cache retirement is allowed and does not block the second
entry. Any active or unpublished checkpoint for either entry causes every live/import/publish
mutation to refuse. Thus only one entry can bind a given HEAD/starting manifest, and the first
evidence commit necessarily precedes the second checkpoint. Checkpoint-HEAD migration is not
authorized.

Dispatch is not producer-selected. Before every attempt/export, the executor fully expands and
validates the currently knowable required schedule, then chooses the one outstanding request with
the least tuple under these frozen orders: stage by the nine-item stage table order; numeric hop
null-first then ascending; direction null-first then `resolution`, `backward`, `forward`,
`correction`, `version-link`, `same-author`; route by the nine base-route table order followed by
`registered-version-url`; query ordinal null-first then ascending; subject schedule ID null-first by
UTF-16 code units; page ordinal ascending; prior-response hash null-first by UTF-16; and request ID
as the final tie-breaker. A nonnull reservation always takes precedence and no other request is
eligible. If the least request is `pending-retry` before its recorded deadline, the invocation makes
no later request. `run-direct` executes exactly one eligible direct attempt and then checkpoints,
releases ownership and exits; it refuses when the least request is manual. Conversely,
`export-pending-captures` reserves/reprints exactly the least manual request and refuses when the
least request is direct. An imported manual HTTP 429/5xx at ordinals one through three uses the same
registered pending-retry/deadline rule; an opaque-tool result has one terminal attempt and no
invented retry. This order/stopping policy is rederived from the checkpoint and makes provider
timing unable to authorize bypass of a waiting earlier request.

Every new checkpoint additionally initializes `assessments=[]`, `candidates=[]`, `dispatchReservation=null`,
`execution.endedUtc=null`, `publicationPlan=null`, and `relations=[]`; its
`manifestStartSha256`, provenance, execution object and sorted source-input pins are the freshly
reopened registered values. There are exactly two admissible initial forms. A **fresh** form has no
recovery archive/journal and initializes `auditEvents=[]`. A **recovered-preinitial** form contains
only authenticated stale-owner and/or checkpoint-temporary recovery archive/journal pairs and
initializes `auditEvents` to the event-ID-sorted exact events independently reconstructed from those
pairs. No other nullable or collection field is producer-chosen.

The pressure entry initializes `occurrences=[]`. The Yamashita entry instead installs exactly two
deterministic local-root occurrences before deriving candidates and the dynamic schedule. Local root
`YAMASHITA-MONOGRAPH-ROOT-01` binds `research/1910.06389v2.pdf`, 25,611,913 bytes, SHA-256
`f6cd58ab841f841bcc310d2f722459122f7850cda9681ae0c7d1877bf21ef471`, arXiv
`1910.06389v2`, title *Snow Crystals*, author Kenneth G. Libbrecht, relevant pages `235`, `269`, and
`508`, including the Figure 6.22/Figure 7.21/`[1987Kob]` citation lead. Local root
`YAMASHITA-CM7-ROOT-01` binds `research/2004.06212v1.pdf`, 1,562,618 bytes, SHA-256
`6e450a1c2969e5cd074b2282ed727c25cb56858347246350c4e0e487b592f49e`, arXiv
`2004.06212v1`, title *Toward a Comprehensive Model of Snow Crystal Growth: 7. Ice Attachment
Kinetics near -2 C*, relevant page `8`, and its Figure 8 later-reproduction lead. The executor opens
and rehashes both registered source inputs at preparation; the published occurrence pointer uses the
same exact path/bytes/hash and relevant-page array.

Each root's canonical local descriptor has exactly `arxivId`, `entryId`, `localRootId`, `path`,
`relevantPages`, `schema`, and `sha256`, with schema `phase6-wp1-local-root-v1`. Its virtual
`requestId` is SHA-256 of canonical `{entryId,localRootId,schema}` with
`schema=phase6-wp1-local-root-request-v1`; that ID deliberately has no `requests.jsonl` row and is
excluded from fixed/dynamic request counts. Its ordinary `rawRecordSha256` hashes the complete
canonical local descriptor, and its `occurrenceId` uses the registered occurrence formula with
provider rank `local-root`. The occurrence has the arXiv versioned strong ID, resolved identity,
`screenDispositionBeforeAlias=include-citation-lead`, `acquisitionStatus=acquired-and-verified`, the
bound pointer, empty provider-date witnesses, and a citation-walk trigger. It therefore makes the
starting chain reachable even if every network route returns zero records. Both roots require an
effective adequately reviewed assessment before publication; the monograph assessment must carry at
least one source-supported local citation witness for `[1987Kob]`. Root occurrences participate in
identity union, candidate projection and dynamic relation scheduling exactly like captured
occurrences; only their absence from the request ledger/counts is special.

Every checkpoint rewrite restores the tracked product orders before canonical serialization:
`assessments` by occurrence ID, `requests` by request ID, `occurrences` by occurrence ID,
`candidates` by final component key, and
`relations` by the complete field-by-field tuple registered below. `auditEvents` and
`outstandingRequestIds` use their separately frozen UTF-16 ID orders. Duplicate sort keys or a row
whose independently rederived key differs are rejected; canonical object-key sorting alone is not
treated as array canonicalization.

This correction also supersedes direct writes to ownership/recovery authority paths. An owner record
has exactly `host`, `nonce`, `pid`, `schema`, and `startedUtc`, with
`schema=phase6-wp1-owner-v1`, a nonempty host, 32-character lowercase hexadecimal nonce, positive
safe PID and strict UTC instant. Acquisition writes/file-syncs/reopens a unique
`owner.json.tmp-NONCE`, then no-replace hard-links it to `owner.json`, reopens the installed bytes,
and removes only the authenticated temporary hard-link name. Only installed `owner.json` is
authority. A partial candidate or a complete candidate that lost the link race is nonauthoritative,
never blocks another link attempt, and is retained as an inventoried precommit diagnostic; it is
never promoted without complete validation.

Stale-owner recovery keeps `owner.json` installed until one serialized recovery atomically replaces
it. After reopening the expected owner hash and proving its recorded PID absent on the same host, a
contender builds `phase6-wp1-owner-recovery-claim-v1` with exactly `claimantHost`, `claimantNonce`,
`claimantPid`, `recoveryUtc`, `schema`, and `staleOwnerSha256`, then commits it from a synced/reopened
unique temporary by no-replace hard link to `owner-recovery-claim.json`. `EEXIST` refuses a second
contender. Every ordinary acquisition refuses while either stale `owner.json` or that claim exists,
so there is no owner-name gap.

The installed claim, not the continued process identity, is the recovery authority. If its claimant
crashes, a later `recover-owner --claim-sha256 CLAIM_SHA256` may continue only after reopening that
exact claim, proving its recorded claimant PID absent on the same host, and proving any already
installed claim-derived successor PID absent. It does not replace, rewrite, or temporarily unlink
the claim and does not sample a new recovery UTC. It may perform only the deterministic recovery
action already authorized by those claim bytes; cross-host continuation is forbidden. Thus a crash
at any recovery step leaves the same installed authority and cannot fork the event or create a
claim-name gap.

The recovery actor journals the recovery and installs the stale owner bytes at exact ignored
`audit/orphaned-owners/SHA256.json` by no-replace hard link/reopen validation **without unlinking
`owner.json`**. The successor owner is not producer-selected: it is exactly
`{host:claimantHost,nonce:claimantNonce,pid:claimantPid,schema:"phase6-wp1-owner-v1",startedUtc:recoveryUtc}`
from the installed claim. Before replacement, `owner.json` must be either the exact stale bytes or
that exact successor; any third value fails. The actor prepares/reopens the successor candidate,
reauthenticates the claim and current owner, and atomically renames the candidate over the stale
owner while the claim remains installed. It reopens the successor bytes and archive, completes and
reopens the event-bearing checkpoint transition, and installs the claim bytes without change at
`audit/orphaned-recovery-claims/CLAIM_SHA256.json` by no-replace hard link/reopen validation. Only
then does it remove the exact live claim. If the process PID equals `claimantPid`, it now owns the
successor and may continue. A continuation actor for a dead claimant may do no ordinary work: it
exits 78 with `recovery-successor-stale`, leaving the dead claim-derived successor installed for a
fresh, separately serialized owner recovery. Once the recovery event is durable and the claim is
absent, the old journal/archive pair is a completed historical action; later valid owners or normal
absence of `owner.json` do not reopen it. A crash anywhere before claim removal leaves stale or
claim-derived successor owner plus the same claim and is exactly resumable without an owner gap.

Every owner recovery, every checkpoint-temporary recovery, and every reserved **direct** capture
recovery whose reservation has a nonnull `dispatchStartedUtc` next derives its complete event and a closed recovery-journal envelope
before mutating the source. The envelope has exactly `archiveBytes`, `archivePath`, `archiveSha256`,
`event`, `schema`, `sourceBytes`, `sourcePath`, and `sourceSha256`, with
`schema=phase6-wp1-recovery-journal-v1` and `event` the exact six-key audit
event. For an owner, checkpoint temporary or present direct temporary, the source fields bind its
exact original path/bytes/hash and the archive fields bind the content-addressed destination with
the same bytes/hash. For an absent reserved direct path all six source/archive scalars are null; its
journal still binds the dispatch-unknown event and full replay. No other null combination is valid.
It writes/file-syncs/reopens the canonical envelope bytes at unique
`audit/recovery-journal/EVENT_ID.json.tmp-ACTOR_NONCE-SEQUENCE`, then no-replace hard-links them to
`audit/recovery-journal/EVENT_ID.json`, reopens the installed journal, and removes only the
authenticated temporary hard-link name. The actor nonce is the installed claim's `claimantNonce` for
stale-owner recovery and the current owner nonce otherwise. Only the installed journal authorizes
the named archive mutation. A crash-left complete temporary can finish the same link after exact
event rederivation. A partial or divergent temporary is preserved without byte change at
`audit/orphaned-journal-temporaries/EVENT_ID/SHA256.bin` by a no-replace link/reopen/unlink
transaction, after which a new sequence may commit the same derived event; this diagnostic archive
is not itself a recovery event or journal. If both temporary and installed journal names exist,
same-file identity plus exact bytes permits removal of only the temporary name; any mismatch fails
closed. The event UTC is exactly the installed claim's `recoveryUtc` for stale-owner recovery and
the authenticated current owner's `startedUtc` for the other two recoveries; the latter is also the
dispatch-unknown capture's `endedUtc`. It therefore remains rederivable after a crash rather than
being sampled again.

Each installed journal's `eventId`, source path, archive path and hashes are independently
recomputed. Its archive-install states are exactly source-only, both names as authenticated
same-file hard links or as separately opened byte-identical files with the same registered hash,
archive-only, or one action-only state with neither source nor archive path. That fourth state is
valid only for a nonnull-start reserved-direct recovery whose event state is
`reserved-path-absent`; all six source/archive fields must then be null and replay proceeds directly
to deterministic dispatch-unknown capture construction. Source-only completes the no-replace link;
the both-names state reopens both, validates
the archive, and removes only the authenticated source name for checkpoint/direct-capture recovery;
owner recovery deliberately retains `owner.json` until the atomic successor replacement above.
For owner recovery while its claim remains installed, exact successor-owner bytes at `owner.json`
plus the stale archive is the fourth, post-replacement state; any other changed owner fails. After
the event is durable and claim absent, the journal/archive action is complete and `owner.json` is
outside that historical source-state comparison: it may be absent or belong to any separately
authenticated later invocation. Archive-only proceeds where that recovery permits it. A crash with journal plus valid archive replays the **whole named action**, not merely event
insertion: checkpoint-temporary recovery appends its event exactly once and continues from the
installed checkpoint; reserved direct recovery creates or reuses the exact
dispatch-unknown capture, terminalizes the request, removes it from outstanding, clears the
reservation and appends the event in one checkpoint transition; stale-owner recovery completes the
event-bearing recovered-preinitial/resume transition and new owner acquisition. An already exact
event/action is not repeated. Neither path, nonidentical both names, an archive with no referencing
journal, divergent bytes, or a conflicting event/action is a hard fail, except for the one exact
action-only absent-reserved-path state above.
Every later resume requires complete bidirectional correspondence among journals, their recovery
events and archives, except that the action-only absent-path journal has no archive by definition.
More than one journal may reference the same content-addressed archive only
when each independently recomputed hash and the shared bytes are exact; each recovery event still
appears once. Ordinary parser, clock, integrity and publication events have no recovery journal.
The predispatch clock event has no recovery journal: the null-start reservation remains installed,
so the event and prior reservation facts remain independently rederivable from the checkpoint.
The checkpoint `auditEvents` array is always sorted by `eventId` in UTF-16 code-unit order and
duplicate IDs are rejected; “append” throughout this register means insert then restore that exact
order, not preserve invocation arrival order.

Fresh initial creation is allowed only when the entry directory contains the authenticated current
owner and no prior checkpoint, checkpoint temporary, raw/recovery capture, publication plan or audit
artifact. Recovered-preinitial creation additionally permits only the authenticated recovery pairs
above. Path-conforming nonauthoritative owner/claim candidates, authenticated content-addressed
orphaned recovery-claim archives, and orphaned journal-precommit diagnostics described above are
inventoried but are neither prior checkpoint state nor evidence and
do not change which of the two forms applies. Resume requires one complete canonical `checkpoint.json`; a missing or invalid checkpoint in
any other nonempty prior-state directory is a hard fail-closed error, never an empty schedule. Before
dispatch, resume recursively inventories the ignored raw-attempt subtree. Every committed capture
path must be referenced exactly once by a validated attempt, `dispatchReservation`, or its
deterministic dispatch-unknown recovery path and must validate completely. A capture temporary must
be the single exact owner/nonce/sequence sibling named by a live authenticated reservation; its
bytes may be partial because it is not a committed capture. An unreferenced or second temporary,
multiply referenced path, invalid committed capture, or identity mismatch is
`capture-integrity-failure`. No such state is interpreted as an unattempted request or redispatched.
Released/orphaned owner archives, recovery journals, the closed import tree and publication staging live outside the raw subtree and are
validated by their own registered recovery rules.

For this correction the checkpoint `dispatchReservation` supersedes the earlier direct-only
five-key form and applies to both automatic and operator-mediated calls. It has exactly
`attemptOrdinal`, `captureMode`, `dispatchStartedUtc`, `rawPath`, `requestId`, `reservationId`,
`reservedUtc`, and `temporaryPath`, where `captureMode` is `direct-http` or `manual-export` and `temporaryPath` is the
exact sibling capture-temporary path the adapter or importer must use.
`reservationId` is lowercase SHA-256 of the canonical object containing the other six immutable
fields (all except `dispatchStartedUtc` and `reservationId`). `dispatchStartedUtc` is initially null.
Where an audit rule below names the complete reservation hash, it is lowercase SHA-256 of the
canonical full eight-key reservation object, including its ID and current start value.
Every committed attempt copies that complete eight-key object into exact member `reservation`
before the live top-level reservation is cleared. The checkpoint and tracked request ledger both
retain it; checkpoint-only attempt `rawPath` equals `reservation.rawPath` for an ordinary committed
attempt and the independently derived `.dispatch-unknown.json` sibling for
`dispatch-outcome-unknown-after-crash`. Thus reservation-ID,
mode, paths, reserve/start chronology and audit hashes remain independently rederivable after the
live slot is null.
For direct mode, while that field is still null the executor first samples and validates every
monotonic epoch and safe deadline needed to dispatch the first hop. A failure there takes the
predispatch clock transition. Only after those checks pass does it sample the actual UTC start. That
reading must be a strict safe UTC instant no earlier than execution start, reservation time,
authenticated owner start, or any retained observational UTC other than the future eligibility
cutoff. An invalid or earlier reading takes the same no-dispatch predispatch transition, using the
already validated authenticated owner `startedUtc` as the event UTC rather than fabricating a
transport start. A valid reading sets
`dispatchStartedUtc`, flushes/reopens the same reservation without changing its ID, and invokes the
first-hop transport without another pre-boundary clock read. The already validated monotonic total/header
epochs include the flush time, conservatively shortening rather than lengthening the limits. The
direct capture and dispatch-unknown recovery use that exact UTC start. For manual
mode it remains null because actual external timing comes from the imported envelope. Each nonnull path is
entry-relative, exclusive, and independently rederived from the request, attempt, authenticated
owner nonce and positive safe write sequence. The reservation is flushed, reopened and validated
before direct temporary creation/transport dispatch or before a manual instruction is emitted, so
recovery never discovers a producer-selected temporary name by directory scan.

The exact committed capture path is `raw/REQUEST_ID/attempt-ATTEMPT_ORDINAL.json`, where the ID is
64 lowercase hexadecimal characters and the ordinal is canonical ASCII decimal without a leading
zero. The dispatch-unknown committed sibling is
`raw/REQUEST_ID/attempt-ATTEMPT_ORDINAL.dispatch-unknown.json`. Both are relative to the entry
execution directory; no request/provider text enters a path. Their precommit names append the exact
registered `.tmp-...` suffix to these full filenames. The validator derives these paths rather than
trusting any checkpoint string.

On resume, a `direct-http` reservation with `dispatchStartedUtc=null` proves the transport boundary
was not crossed. It remains installed byte-for-byte and `run-direct` resumes that same reserved
attempt through the predispatch clock/start sequence; no recovery event, new reservation, new raw
path or new attempt ordinal is created. A nonnull direct start means the boundary may have crossed
and uses the conservative rules below. For `manual-export`, null is the normal state awaiting import
and likewise remains installed until its exact import.

`export-pending-captures` is therefore a mutating, owned action. It either reprints the exact
instruction for the already installed `manual-export` reservation or installs exactly one new
reservation and then emits its canonical request/headers/reservation identity; it never exports a
second request while one is reserved. `import-capture` accepts exactly one outer manual envelope
matching that reservation, commits it to the reserved `rawPath` through the same temporary,
file-sync, reopen and no-replace-link primitive, appends the consecutive attempt and clears the
reservation in one checkpoint transition. A crash before instruction output is harmless because
the same export is reprinted; a crash after an external call cannot select a different request or
accepted result. The protocol authorizes one external call per exported attempt. A missing result
must be imported as its closed manual no-response envelope; it is never silently replaced by a new
export. Its error is exactly
`{code:"MANUAL_RESULT_UNAVAILABLE",message:"The exported manual request completed without an observable result.",name:"WP1ManualCaptureError"}`;
the enclosing reason is `manual-http-no-response` or `opaque-tool-no-response` from the intended
request kind.

The capture temporary for a reserved committed path is exactly
`raw/REQUEST_ID/attempt-ATTEMPT_ORDINAL.json.tmp-OWNER_NONCE-SEQUENCE`, where the nonce is the
creating owner's 32 lowercase hexadecimal characters and the sequence is a positive safe integer.
For a live `direct-http` reservation with `dispatchStartedUtc=null`, the only legal raw state is
neither path; any temporary or reserved path is `capture-integrity-failure` because the durable
chronology proves no transport dispatch. For a nonnull direct start, and for `manual-export`, the
only legal raw crash states are: neither path; one matching temporary only, whether complete or
partial; the complete committed reserved path only; or both paths as authenticated hard links to
the same complete canonical bytes. For a nonnull-start `direct-http` reservation, neither path
means dispatch outcome unknown. A direct temporary-only response is not committed: owner recovery hashes whatever bytes exist,
installs them without byte change at ignored `audit/orphaned-captures/SHA256.bin` by a no-replace
hard-link/reopen/unlink transaction, records whether the bytes were
`reserved-temporary-complete` or `reserved-temporary-partial`, and performs the registered
dispatch-unknown terminalization. Its exact reserved temporary path authenticates partial bytes;
complete capture validation is deliberately not required for this archival transition.

For `manual-export`, neither path means the reservation still awaits its one import. A complete
temporary-only outer envelope is fully revalidated, linked without replacement to `rawPath`, and
finishes the normal import transition; a partial temporary is preserved under
`audit/orphaned-manual-imports/RESERVATION_ID/SHA256.bin` by the same no-replace transaction and the
reservation remains available for re-import of the same captured envelope, not another external
call. A valid reserved path is the authority in either mode. When both names exist, recovery requires identical device/inode
identity plus bytes/hash, validates the reserved capture, then removes only that authenticated
temporary hard-link name; when only the reserved path exists it proceeds directly. An invalid
reserved path, multiple/mismatched temporaries, unavailable same-file identity when both names
exist, or any other state is `capture-integrity-failure` and preserves every file.

The deterministic dispatch-unknown recovery capture has its own exact precommit sibling
`RECOVERY_RAW_PATH.tmp-EVENT_ID-OWNER_NONCE-SEQUENCE`. Its legal states are neither path, one
temporary, the complete recovery path, or both names as same-file hard links. Neither creates the
registered canonical recovery bytes; a complete temporary finishes the no-replace link; a partial
temporary is preserved under
`audit/orphaned-dispatch-recovery-temporaries/EVENT_ID/SHA256.bin` and the same deterministic bytes
are regenerated; a valid final is reused; and authenticated both-names removes only the temporary.
The installed dispatch recovery journal and live reservation authorize these paths in the raw
inventory. A divergent complete temporary, invalid final, or non-hard-linked both-name state is
`capture-integrity-failure` and preserves all bytes. Thus a second crash during conservative
terminalization cannot create an unreferenced capture or authorize redispatch.

A checkpoint temporary is exactly `checkpoint.json.tmp-OWNER_NONCE-SEQUENCE`. When a valid installed
`checkpoint.json` exists, recovery journals and then installs every crash-left checkpoint temporary
without byte change at ignored `audit/orphaned-checkpoints/SHA256.bin` by a no-replace
hard-link/reopen/unlink transaction, appends
`kind=checkpoint-temp-recovery` with `action=archive-and-continue` exactly once, and then validates
raw state against the installed checkpoint. A hash collision at either archive destination is a
hard error unless the bytes are identical. Without an installed checkpoint, explicit owner recovery
uses the same journal-before-archive transaction and the next recovered-preinitial checkpoint
includes that event; because transport begins only after an installed reservation was reopened,
that state cannot have authorized a request. No checkpoint temporary is promoted to the installed
state.

**Closed no-response and incomplete-response captures.** A no-response capture has schema
`phase6-wp1-no-response-capture-v1` and exactly `attemptOrdinal`, `endedUtc`, `error`, `finalUrl`,
`intendedRequest`, `redirects`, `requestId`, `responseHeaders`, `retryDecision`, `route`, `schema`,
`startedUtc`, `status`, and `waitMs`. `intendedRequest` is the registered exact three-key object;
`error` is a nonnull exact `{code,message,name}` object. `status=null`, `redirects` is the exact
zero-to-ten prior-hop array (empty when no redirect completed), every final-response allow-listed
header value is null, `retryDecision=terminal`, and `waitMs=0`. For a direct failure `finalUrl` is
the exact current URL whose hop failed; for an opaque-tool failure it is null and the call remains in
`intendedRequest.urlOrCall`. The capture is `canonicalJsonBytes` of this
object. Its checkpoint attempt projects exactly `attemptOrdinal`, `endedUtc`, `error`, `finalUrl`,
`redirects`, `reservation`, `responseHeaders`, `retryDecision`, `startedUtc`, `status`, and `waitMs`, then adds
`captureBytes`, `captureKind=no-response`, `captureSha256`, and checkpoint-only `rawPath`; capture
`intendedRequest`, `requestId`, `route`, and `schema` are instead checked against the enclosing
request/capture schemas and are not extra attempt keys. A manual import with
`captureKind=no-response` stores this same exact object in `observableResult`. Extra/missing keys or
a mismatch between capture and attempt is invalid.

A response whose headers arrived but whose client-decoded body did not complete is not
`no-response`. It uses `captureKind=direct-http-incomplete-envelope` and schema
`phase6-wp1-incomplete-http-capture-v1`, with the same exact keys and body byte/hash/base64 rules as
`phase6-wp1-direct-http-capture-v1`; unlike the complete envelope, `error` is the nonnull exact
`{code,message,name}` transport/limit error. It retains the exact client-decoded pre-parse prefix
received up to the registered limit, including a zero-byte prefix, plus the received status, stable
headers, final URL and redirects. Its attempt has `retryDecision=terminal`, `waitMs=0`, and its
request is removed from outstanding as `terminal-access-failure` with one exact reason code from
`response-body-inactivity-timeout`, `response-total-timeout`, `response-body-limit`,
`response-body-stream-error`, `response-content-encoding-unsupported`, or
`response-content-decoding-error`; all parsed-result fields have the same false/null/zero/empty values as
the other access-failure rows. Neither complete nor partial response bytes are mislabeled as wire or
compressed bytes. The six corresponding normalized error codes are respectively
`HTTP_BODY_INACTIVITY_TIMEOUT`, `HTTP_TOTAL_TIMEOUT`, `HTTP_BODY_LIMIT`, `HTTP_BODY_STREAM_ERROR`,
`HTTP_CONTENT_ENCODING_UNSUPPORTED`, and `HTTP_CONTENT_DECODING_ERROR`, and all six use the exact
executor-generated error objects below. An underlying post-header stream error is not substituted
for that closed object; only the retained decoded prefix and fixed normalized failure are evidence.

**Finite direct transport.** One registered attempt has a 120,000-millisecond response-header
timeout on each hop, a 120,000-millisecond maximum interval between successive decoded body chunks,
and a 600,000-millisecond total deadline shared by every redirect hop and the final body read. It
retains at most 268435456 client-decoded body bytes (256 MiB); if the next chunk crosses that bound,
the capture retains exactly the first 268435456 bytes and terminates with `response-body-limit`.
There is no application-level truncation below that bound. Decoding stages stream into the next
stage with backpressure and do not accumulate an intermediate body artifact; the byte cap and
inactivity clock apply only to nonempty output from the complete decoding stack, which is the exact
representation retained by `bodyBase64`. A header or total timeout before final
response headers produces the closed no-response form with error code `HTTP_HEADER_TIMEOUT` or
`HTTP_TOTAL_TIMEOUT`; expiry after final headers produces the incomplete form. DNS, TLS and
connection failures before final headers also use no-response. All redirects share the attempt's
total deadline and remain separately capped at ten hops.

The total-attempt epoch is the validated monotonic reading taken while the first-hop reservation
start is still null, before its UTC-start checkpoint flush; the first header epoch is sampled in
that same predispatch block. Each later hop's header epoch is the reading immediately before that
hop dispatch. Deadline comparison is
`now >= epoch + duration`. The adapter batches callbacks/events bearing the same sampled monotonic
reading. A total deadline wins first and the current header/body-inactivity deadline second; a
deadline-winning transition does not append bytes from a tied chunk/end/error callback. Otherwise,
the adapter preserves source/callback causal order and processes every nonempty final decoded chunk
emitted before a tied decoder failure, stream failure or response end. Each such chunk is retained
and size-checked before the later event; crossing the exact body limit wins over that later event.
After all causally prior chunks, the remaining terminal priority is content-encoding/decoding
failure, body-stream failure, then response end. No callback emitted after a terminal event is
eligible. This retains a decoder's final emitted prefix while keeping deadlines and the body bound
decisive.

Before any terminal capture/checkpoint transition, the adapter fences every callback by the exact
reservation ID and a terminal generation, removes ordinary listeners, destroys/aborts the owned
request, socket and decoder stack as applicable, and waits for confirmed closure of every owned
transport/stream object. Fenced late callbacks may report closure only; they cannot append bytes,
change status, write a file or schedule work. Quiescence has one injected-monotonic 30,000-ms
deadline with the same safe-clock rules. If destroy/abort throws, or closure is not confirmed by
that deadline, the executor writes no response capture, retains the reservation, atomically flushes
an audit event, leaves `owner.json` installed, and exits the process 77 so the OS closes remaining
handles. The exact failures are respectively
`{code:"TRANSPORT_DESTROY_FAILURE",message:"The reserved transport could not be destroyed cleanly.",name:"WP1TransportQuiescenceError"}`
with `state=transport-destroy-failure`, or
`{code:"TRANSPORT_CLOSE_TIMEOUT",message:"The reserved transport did not quiesce within 30000 milliseconds.",name:"WP1TransportQuiescenceError"}`
with `state=transport-close-timeout`; both use `kind=transport-quiescence-failure` and
`action=retain-owner-and-exit`. A later same-host `recover-owner` proves the PID absent and handles
the still-reserved attempt as dispatch-unknown. No invocation releases ownership while an adapter
can still mutate state.

Executor-generated transport errors use these exact complete objects:

| code | name | message |
|---|---|---|
| `HTTP_HEADER_TIMEOUT` | `WP1TransportError` | `Response headers did not arrive within 120000 milliseconds.` |
| `HTTP_TOTAL_TIMEOUT` | `WP1TransportError` | `The registered 600000-millisecond total attempt deadline expired.` |
| `HTTP_BODY_INACTIVITY_TIMEOUT` | `WP1TransportError` | `No final decoded body bytes arrived within 120000 milliseconds.` |
| `HTTP_BODY_LIMIT` | `WP1TransportError` | `Final decoded response body exceeded 268435456 bytes.` |
| `HTTP_CONTENT_ENCODING_UNSUPPORTED` | `WP1TransportError` | `Response Content-Encoding is unsupported or malformed.` |
| `HTTP_CONTENT_DECODING_ERROR` | `WP1TransportError` | `Response Content-Encoding decoding failed.` |
| `HTTP_BODY_STREAM_ERROR` | `WP1TransportError` | `Response body stream failed.` |
| `MONOTONIC_TIMER_EARLY_REPEAT` | `WP1MonotonicTimerError` | `A registered monotonic timer fired early more than once.` |
| `MONOTONIC_CLOCK_RANGE` | `WP1MonotonicClockError` | `A registered monotonic deadline is not a nonnegative safe integer.` |
| `MONOTONIC_CLOCK_INVALID` | `WP1MonotonicClockError` | `The injected monotonic clock returned a nonfinite, negative, or non-safe-integer reading.` |
| `MONOTONIC_CLOCK_REGRESSION` | `WP1MonotonicClockError` | `The injected monotonic clock regressed during a reserved transport attempt.` |
| `INJECTED_UTC_INVALID` | `WP1InjectedUtcError` | `The injected UTC clock did not return a strict safe UTC instant.` |
| `INJECTED_UTC_REGRESSION` | `WP1InjectedUtcError` | `The injected UTC clock regressed during a reserved transport attempt.` |

The first seven appear in ordinary registered transport captures. A monotonic error appears in a
capture only in the quiescent crossed-boundary transition below; otherwise it is carried by the exact
audit/exit transition. Injected-UTC errors are audit/exit-only: the predispatch case uses the
no-dispatch transition below, and the post-response case uses the retained-owner transition.
Observed DNS/TLS/socket errors before headers remain the captured nonempty
transport-provided `{code,message,name}` instead.

These liveness limits use an injected monotonic-millisecond clock and timers; UTC remains the
separate recorded scientific/retry clock. Monotonic readings must be finite, safe nonnegative
integers and nondecreasing. Before installing any timer, the executor also requires
`epoch + duration` to be a safe nonnegative integer. A nonfinite, negative or non-safe-integer
reading is exact error `MONOTONIC_CLOCK_INVALID` with `state=monotonic-reading-invalid`; an unsafe
deadline is `MONOTONIC_CLOCK_RANGE` with `state=monotonic-deadline-unsafe`; and a later reading below
the immediately prior reading is `MONOTONIC_CLOCK_REGRESSION` with
`state=monotonic-reading-regressed`.

If the first transport call has not been invoked, the executor records
`kind=predispatch-clock-failure`, `action=retain-reservation-and-exit`, leaves the validated null-start
reservation and request outstanding with no attempt, normally releases the owner and exits 76. Its
state is the applicable monotonic state below, `dispatch-start-utc-invalid`, or
`dispatch-start-utc-regressed`; the two UTC states use authenticated owner start as event UTC.
A
later invocation revalidates and resumes the same reservation. If at least one
hop crossed the boundary but the adapter is now confirmed quiescent between redirect hops, it writes
the closed standalone no-response capture with the exact monotonic error, all completed redirects,
the next planned URL, `reasonCode=monotonic-clock-failure`, `retryDecision=terminal`, and zero wait;
it records `kind=injected-clock-invalid`, `action=preserve-and-terminalize`, commits that terminal
attempt, clears the reservation, releases ownership and exits 76. No monotonic reading is required
after final-response quiescence, so there is no post-response clock-fault state.

After final-response quiescence, the executor samples the separate injected UTC clock exactly once
for `endedUtc`. If that value is not a strict safe UTC instant or its epoch is less than the
reservation's `dispatchStartedUtc`, it writes no response capture and does not clear or alter the
reservation. It records `kind=attempt-utc-failure`, `action=retain-owner-and-exit`, with respectively
`state=attempt-utc-invalid` or `attempt-utc-regressed`, uses the valid dispatch start as event `utc`,
flushes the checkpoint, leaves `owner.json` installed, and exits 77. Any response temporary remains
bound to the reservation and the later same-host owner recovery handles the attempt as
dispatch-unknown. Thus a published attempt never contains an inverted interval or a fabricated end
time.

While any transport/decoder object is active, the same monotonic error instead fences callbacks, attempts immediate destruction, records
`kind=transport-quiescence-failure` with respective state `transport-clock-invalid`,
`transport-clock-regressed`, or `transport-clock-deadline-unsafe`, leaves `owner.json` installed and
exits 77 after the checkpoint flush; no untrusted clock is used to claim a timed close. A
timer firing early re-arms only the remaining registered interval until the monotonic deadline is
reached rather than shortening the limit. Each timer duration is the ceiling of the remaining
monotonic milliseconds; at most one early firing is re-armed, and a second early firing is hard
error `MONOTONIC_TIMER_EARLY_REPEAT`; because a registered timer exists only for an active hop/body,
it records `transport-quiescence-failure` with `state=transport-timer-early-repeat` and follows the
retained-owner exit-77 transition. Only the active-object exit-77 states leave an ambiguous
reservation whose next recovery becomes dispatch-unknown. Focused transport tests
must inject both clocks, timers and transport before any live request. The
production adapter owns one HTTP(S) hop at a time, preserves raw header multiplicity before building
the stable allow-list map, performs normal client content decoding, and lets the executor own the
redirect loop. Duplicate `Retry-After` fields are serialized in received order as one comma-joined
stable value and therefore fail the single-value grammar registered above.

For every allow-listed response header, the adapter ASCII-lowercases the field name, preserves
physical field occurrence order, removes only leading/trailing HTTP OWS bytes SP and HTAB from each
value, rejects CR/LF in a value, and joins duplicate values with the literal two bytes comma plus SP.
Node's raw-header Latin-1 mapping is used exactly: each received octet `0x00` through `0xFF` becomes
the same-valued Unicode code point before canonical JSON escaping. An absent field is null; absent
`Content-Encoding` means one implicit `identity` token. No internal byte is otherwise normalized. The stored `content-encoding`
value is parsed as a comma-separated, OWS-trimmed, ASCII-case-insensitive list. The supported tokens
are `identity`, `gzip`, `x-gzip`, `deflate`, and `br`; stacked encodings decode in reverse listed
order. `deflate` accepts only the RFC zlib-wrapped representation, not a raw-deflate fallback.
Unsupported/empty tokens produce `response-content-encoding-unsupported`; malformed decoding
produces `response-content-decoding-error`. Both use the incomplete envelope with the exact decoded
prefix available before failure, terminal retry decision and zero wait; their normalized error codes
are `HTTP_CONTENT_ENCODING_UNSUPPORTED` and `HTTP_CONTENT_DECODING_ERROR`. Encoded or intermediate
input that produces no final decoded output does not reset inactivity.

The total-attempt deadline is tested before a hop's header deadline, so simultaneous expiry is
`response-total-timeout`. Body inactivity starts at final-header completion before the first nonempty
decoded chunk and restarts after each later nonempty decoded chunk. Before final headers, normalized
error code `HTTP_HEADER_TIMEOUT` maps to `response-header-timeout`, and `HTTP_TOTAL_TIMEOUT` maps to
`response-total-timeout`. DNS codes `EAI_AGAIN`, `EAI_FAIL`, `ENODATA`, and `ENOTFOUND` map to
`dns-failure`. The adapter records phases `dns`, `tcp`, `tls`, and `headers`: any HTTPS failure after
TCP connection begins and before the `secureConnect` event is `tls-failure`, as is any later
`ERR_TLS_*`, `ERR_SSL_*`, `CERT_*`, or certificate-verification error; all other pre-header
socket/transport failures map to `connection-failure`. Invalid/missing redirect location, a repeated normalized URL,
and an eleventh redirect map respectively to `redirect-invalid-location`, `redirect-loop`, and
`redirect-limit`; each is terminal with the observed response captured under the complete envelope,
`retryDecision=terminal`, and `waitMs=0`.

Only HTTP statuses 301, 302, 303, 307, and 308 are followed; every hop remains GET. Any other 3xx is
terminal `redirect-status-unsupported`. Redirect selection requires exactly one physical `Location`
field after SP/HTAB edge trimming; zero or multiple fields is `redirect-invalid-location` even if the
stable joined value would parse. Resolve it with the pinned Node WHATWG
`new URL(location, currentUrl)`, require `http:` or `https:` with empty username/password, clear the
fragment, and use the resulting `.href` both as the next dispatched URL and loop key. The initial URL
under the same serialization is inserted into the visited set. A redirect row's `fromUrl` and
`location` are respectively the serialized current and resolved next URLs; its stable
`responseHeaders.location` still preserves the received field value. Ten completed redirect rows are
allowed; encountering another followed status is the eleventh-hop `redirect-limit` transition.

**Remaining closed evidence fields.** `componentAliasHistory` is the UTF-16-sorted, duplicate-free
union of every type-prefixed strong identifier key in the occurrence's final component plus the
fallback/raw base key of every component member that has no strong identifier, excluding
`finalComponentKey`; it is not an arrival-time narrative. An identity-conflict occurrence is its own
raw component and therefore has an empty history. `citationWalkTrigger` is a boolean, true exactly when the occurrence plus its
complete scheduling witnesses independently expands to at least one registered relation or
citation-title request under that entry's depth/predicate rule. `summary.limitations` is the sorted,
duplicate-free subset of literal `access-incomplete`, `cap-incomplete`,
`manual-call-count-unverifiable`, `outstanding-requests`, `source-search-pass-ineligible`, and
`unresolved-sources`; `source-search-pass-ineligible` is always present,
`manual-call-count-unverifiable` is present if and only if any `manual-export` attempt was authorized
(the executor can enforce one accepted envelope but cannot prove an operator made only one external
call), and each other literal is present if and only if its independently recomputed terminal
scope/count is nonempty.

Every field named `startedUtc`, `endedUtc`, `cutoffUtc`, `recoveryUtc`, or plain `utc` is one strict
ASCII UTC instant of exact form `YYYY-MM-DDTHH:mm:ss.sssZ`; parsing on the pinned engine must produce
a safe integral epoch millisecond and `new Date(epoch).toISOString()` must reproduce the identical
string. No offset, leap-second spelling, omitted milliseconds, extended year, or date-only value is
accepted.

Chronology is fail-closed. Checkpoint execution start is no later than every reservation time,
attempt start, accepted assessment review time, recovery time or audit-event time created for that
execution. A direct attempt start equals its nonnull reservation start and its end is no earlier; a
manual attempt satisfies `reservedUtc <= startedUtc <= endedUtc <= importInvocationUtc`, where the
last value is the importer's one validated injected-UTC reading before mutation. Summary execution
end closes scientific search/import work immediately before publication-plan construction and is no
earlier than execution start, any retained attempt/acquisition/review/import time, or any audit event already present at
that boundary. Every later post-freeze operational event, including owner, checkpoint-temporary and
publication recovery, is checkpoint history and is
explicitly outside the frozen summary interval; those events do not rewrite summary/report bytes.
The first durable candidate-product path (or later publication plan) proves that the science/import
freeze boundary was already crossed before any such post-freeze event. Before claim
installation, a fresh recovery UTC must be no earlier than the maximum of the checkpoint execution
start, stale-owner start, reservation `reservedUtc` and nonnull `dispatchStartedUtc`, every retained
attempt start/end, acquisition-attempt end, assessment-review/import time, audit-event time, and a frozen
summary end when one exists. `execution.cutoffUtc` is deliberately excluded because it is a future
eligibility boundary, not an observation. An invalid or lower reading refuses recovery without
mutation. A continued claim inherits its already validated time. Retry-clock ordering follows its stricter rules above. An imported manual or
assessment object violating chronology is rejected without checkpoint mutation. An invalid or
regressed publication/end clock causes a no-mutation refusal; the direct post-dispatch special case
uses the retained-owner transition above because its transport outcome would otherwise be
ambiguous. These are ordering checks on recorded observations, not a claim that wall-clock UTC is a
duration source.

The tracked/checkpoint attempt `captureKind` vocabulary is exactly `direct-http-envelope`,
`direct-http-incomplete-envelope`, `manual-capture-envelope`, or `no-response`; the outer manual
envelope's own representation member remains exactly `manual-page-source`,
`observable-tool-result`, or `no-response`. A nonnull continuation kind is exactly `cursor`,
`next-link`, or `page-number` as registered above.

A request `reasonCode` is exactly one of `complete`, `provider-terminal-no-cursor`,
`version-link-inspected`, `no-results`,
`result-cap-reached`, `retry-pending`, `retry-exhausted`, `retry-after-out-of-range`,
`dispatch-outcome-unknown-after-crash`, `response-header-timeout`, `response-total-timeout`,
`response-body-inactivity-timeout`, `response-body-limit`, `response-body-stream-error`,
`response-content-encoding-unsupported`, `response-content-decoding-error`, `dns-failure`,
`tls-failure`, `connection-failure`, `redirect-invalid-location`, `redirect-loop`,
`redirect-limit`, `redirect-status-unsupported`, `http-authorization-required`,
`http-informational-final-unsupported`, `http-access-forbidden`, `http-not-found`, `http-terminal-client-error`,
`provider-continuation-missing`, `provider-count-inconsistent`, `provider-parse-failure`,
`openalex-doi-resolution-missing`, `openalex-doi-resolution-ambiguous`,
`manual-request-header-unconfirmed`, `manual-http-no-response`, `opaque-tool-no-response`, or
`monotonic-clock-failure`.
`complete`, `provider-terminal-no-cursor`, and `version-link-inspected` belong only to
`terminalState=complete`; `no-results`
belongs only to `terminal-no-results`; `result-cap-reached` belongs only to
`terminal-partial-at-cap`; `retry-pending` belongs only to `pending-retry`; every other literal
belongs only to `terminal-access-failure` and is selected by the exact transport/parser/manual
condition already registered. HTTP 401/407, 403/451, 404/410, and other terminal 4xx map respectively
to the four `http-*` groups above. An unconfirmed/unobservable/uncontrollable required manual HTTP
semantic header maps to `manual-request-header-unconfirmed`; a captured manual no-response maps by
its intended-request kind to `manual-http-no-response` or `opaque-tool-no-response`. No free-form
request reason survives into a checkpoint or evidence row.

A terminal informational status or HTTP upgrade event maps to
`http-informational-final-unsupported`; informational callbacks preceding a later ordinary final
response are transport diagnostics only and do not become separate attempts. The unsupported final
status/upgrade is retained in the complete response envelope with terminal retry decision and zero
wait; it never enters provider parsing.

For a final 2xx capture the scalar failure precedence is exact: strict envelope/provider parsing
failure wins first; an applicable manual semantic-header failure second; provider count
inconsistency third; a required-but-missing continuation fourth; and, for an OpenAlex DOI-resolution
request, zero or more than one result carrying the exact normalized requested DOI fifth. Those last
two cases are respectively `openalex-doi-resolution-missing` and
`openalex-doi-resolution-ambiguous`; only exactly one matching result resolves the WID. Only when none applies may the
page use its registered complete/no-result/cap rule. A parser failure and every transport/HTTP/
no-response failure with no complete parsed provider records retain the attempt capture but project
the closed false/null/zero/empty result fields already specified.

Science-first retention applies when complete provider records did parse before
`manual-request-header-unconfirmed`, `provider-count-inconsistent`, or
`provider-continuation-missing`, or an ambiguous OpenAlex DOI resolution. Such a request remains `terminal-access-failure`, but
`returnedCount` is the exact parsed count, `occurrenceIds` and complete scheduling witnesses are
retained, `providerTotal` retains the observed valid nonnegative safe integer when one exists, and a
structurally valid observed continuation is retained and scheduled; only the missing-continuation
reason necessarily has `continuation=null`. Every occurrence derived from that page remains a
citation lead and may schedule the registered
descendants so an access defect does not erase observed leads. Its component and every descendant
reachable only through that tainted lineage have `admissibility.sourceBytes` and
`admissibility.currency` no stronger than `unresolved`, so they cannot become scoreable; the parent
route remains `access-incomplete`. This preserves every observed provider/query occurrence while
preventing a malformed request/completeness claim from becoming validation evidence.
An OpenAlex DOI resolution with zero matching result uses the closed zero/null projection and leaves
that relation/currency operand unresolved. An ambiguous result retains every parsed occurrence under
the rule above but schedules no resolved-WID child from that request; retained records may remain
citation leads through their other exact identifiers. Both reasons make the enclosing relation
`access-incomplete` and apply the same source-bytes/currency taint.

An audit event's `kind` and `action` are one exact pair from this table; its `priorFacts.state` is
one of only the literals in that row:

| kind | action | allowed `state` |
|---|---|---|
| `capture-integrity-failure` | `fail-closed` | `unreferenced-path`, `multiply-referenced-path`, `checkpoint-invalid`, `committed-capture-invalid`, `temporary-set-invalid`, `temporary-reserved-mismatch`, or `recovery-capture-invalid` |
| `attempt-utc-failure` | `retain-owner-and-exit` | `attempt-utc-invalid` or `attempt-utc-regressed` |
| `checkpoint-temp-recovery` | `archive-and-continue` | `installed-checkpoint-authoritative` or `recovered-preinitial` |
| `dispatch-outcome-unknown` | `preserve-and-terminalize` | `reserved-path-absent`, `reserved-temporary-complete`, or `reserved-temporary-partial` |
| `injected-clock-regression` | `retain-pending-and-exit` | `resume-clock-before-attempt` or `invocation-clock-regressed` |
| `injected-clock-stalled` | `retain-pending-and-exit` | `post-sleep-clock-stalled` |
| `predispatch-clock-failure` | `retain-reservation-and-exit` | `monotonic-reading-invalid`, `monotonic-reading-regressed`, `monotonic-deadline-unsafe`, `dispatch-start-utc-invalid`, or `dispatch-start-utc-regressed` |
| `injected-clock-invalid` | `preserve-and-terminalize` | `monotonic-reading-invalid`, `monotonic-reading-regressed`, or `monotonic-deadline-unsafe` |
| `owner-recovery` | `archive-and-reacquire` | `same-host-owner-pid-absent` |
| `provider-parse-failure` | `preserve-and-terminalize` | `provider-parse-failure` |
| `publication-recovery` | `complete-planned-publication` | `entry-installed-manifest-pending` or `manifest-installed-checkpoint-pending` |
| `transport-quiescence-failure` | `retain-owner-and-exit` | `transport-destroy-failure`, `transport-close-timeout`, `transport-clock-invalid`, `transport-clock-regressed`, `transport-clock-deadline-unsafe`, or `transport-timer-early-repeat` |

`priorFacts` always has exactly `actualSha256`, `currentEpochMs`, `expectedSha256`, `ownerSha256`,
`path`, `priorEpochMs`, `recoveryPath`, and `state`, using explicit null for every value not named
applicable below. Hashes and paths are lowercase-SHA-256/string-or-null, `state` is a nonnull table
literal, paths are slash-normalized entry-relative except the two named repository paths, and epochs
are safe nonnegative integer-or-null.

| kind | exact applicable `priorFacts` fields besides `state` |
|---|---|
| `capture-integrity-failure` | exactly the per-state projection below |
| `attempt-utc-failure` | `expectedSha256` is the complete nonnull-start reservation hash; `ownerSha256` is the installed owner hash; `path` is its `rawPath`; `priorEpochMs` is the valid dispatch-start epoch; `attempt-utc-invalid` has `currentEpochMs=null`, while `attempt-utc-regressed` has the observed regressed safe epoch |
| `checkpoint-temp-recovery` | `actualSha256` is the temporary hash; `ownerSha256` is the current owner hash; `path` is the temporary; `recoveryPath` is its content-addressed archive |
| `dispatch-outcome-unknown` | `actualSha256` is the archived temporary hash or null when absent; `expectedSha256` is the complete reservation hash; `ownerSha256` is the current owner hash; when a temporary exists, `path` is its exact reservation-bound `temporaryPath` and `recoveryPath` is its content-addressed archive; when neither reserved path exists, `path` is the reservation's `rawPath` and `recoveryPath` is the exact dispatch-unknown capture path. In the temporary case the terminal request attempt independently retains the dispatch-unknown recovery-capture path/hash. |
| `injected-clock-regression` | `currentEpochMs` and `priorEpochMs` are respectively the failing and immediately prior injected UTC readings; `ownerSha256` is the current owner hash; `path` is the pending attempt's `rawPath` |
| `injected-clock-stalled` | `currentEpochMs` and `priorEpochMs` are the equal post-sleep and pre-sleep injected UTC readings; `ownerSha256` is the current owner hash; `path` is the pending attempt's `rawPath` |
| `predispatch-clock-failure` | `expectedSha256` is the complete null-start reservation hash; `ownerSha256` is the current owner hash; `path` is its `rawPath`; for `monotonic-reading-regressed`, `currentEpochMs`/`priorEpochMs` are the failing/prior safe readings; for `monotonic-deadline-unsafe`, `currentEpochMs` is the last safe reading and `priorEpochMs=null`; for `monotonic-reading-invalid` or `dispatch-start-utc-invalid`, both are null; for `dispatch-start-utc-regressed`, `currentEpochMs` is the observed safe-but-early UTC epoch and `priorEpochMs` is the maximum required observational epoch |
| `injected-clock-invalid` | `expectedSha256` is the complete nonnull-start reservation hash; `ownerSha256` is the current owner hash; `path` is the reservation's `rawPath`; for `monotonic-reading-regressed`, `currentEpochMs`/`priorEpochMs` are the failing/prior safe monotonic readings; for `monotonic-deadline-unsafe`, `currentEpochMs` is the last safe reading and `priorEpochMs=null`; for `monotonic-reading-invalid`, both epochs are null because an invalid JSON number is never serialized |
| `owner-recovery` | `actualSha256`, `expectedSha256`, and `ownerSha256` all equal the independently reopened stale-owner hash; `path=owner.json`; `recoveryPath` is its content-addressed archive |
| `provider-parse-failure` | `actualSha256` and `expectedSha256` equal the verified attempt-capture hash; `ownerSha256` is the current owner hash; `path` is that attempt's `rawPath` |
| `publication-recovery` | `ownerSha256` is the current owner hash; for `entry-installed-manifest-pending`, `actualSha256`/`expectedSha256` are the installed/planned aggregate entry roots and `path` is the repository-relative canonical entry directory; for `manifest-installed-checkpoint-pending`, they are the installed/planned next-manifest hashes and `path=evidence/MANIFEST.json` |
| `transport-quiescence-failure` | `expectedSha256` is the complete reservation hash, `ownerSha256` is the installed owner hash, and `path` is the reservation's `rawPath`; `transport-clock-regressed` uses failing/current and immediately prior safe readings; `transport-clock-invalid` uses both epochs null; destroy, close-timeout, deadline-unsafe and timer-early-repeat use the last safe reading as `currentEpochMs` and null `priorEpochMs` |

Every capture-integrity failure is an external failure event, one event per offending path in UTF-16
path order; it never aggregates multiple paths into one event. `ownerSha256` is the authenticated
current-owner hash and `recoveryPath` is that event's exact external failure path. For
`unreferenced-path`, `multiply-referenced-path`, `checkpoint-invalid`, or
`temporary-set-invalid`, event `requestId=null`; `path` is respectively each unreferenced path, each
multiply referenced path, `checkpoint.json`, or each offending temporary path. For
`committed-capture-invalid`, `requestId` is the one authenticated referencing request and `path` is
its committed capture; for `temporary-reserved-mismatch`, both come from the live reservation; for
`recovery-capture-invalid`, both come from the live reservation and deterministic recovery path.
`actualSha256` is the exact observed-file hash when that one path is a readable regular file and is
otherwise null. `expectedSha256` is null for the first four aggregate-identity states, the registered
attempt capture hash for `committed-capture-invalid`, the complete reservation hash for
`temporary-reserved-mismatch`, and the independently constructed deterministic recovery-capture
hash for `recovery-capture-invalid`. If a supposed committed path has more than one authenticated
request reference, the state is `multiply-referenced-path` and request ID remains null; the
implementation never chooses one reference.

When invalid capture/checkpoint bytes make normal checkpoint validation impossible, a mutating
invocation does not pretend it appended an event there. It atomically commits the exact event bytes
through a unique temporary, file-sync/reopen and no-replace hard link to ignored
`audit/failures/FAILURE_ID.json`; `FAILURE_ID` is lowercase SHA-256 of the canonical object with
exactly `actualSha256`, `entryId`, `expectedSha256`, `ownerSha256`, `path`, `requestId`, `state`, and `utc`, so it
does not depend on the event or recovery path that contains it. `priorFacts.recoveryPath` names that
path and the ordinary `eventId` is then computed without a cycle. A crash-left partial
`audit/failures/FAILURE_ID.json.tmp-OWNER_NONCE-SEQUENCE` is preserved without byte change at
`audit/orphaned-failure-event-temporaries/FAILURE_ID/SHA256.bin` by a no-replace
link/reopen/unlink transaction, and a complete canonical temporary may finish its exact final link.
The executor then fails closed without changing the invalid
checkpoint. After the exact missing/tampered bytes are restored, resume first validates that external
events. Repeated failed invocations may legitimately have different owner hashes/UTCs and therefore
different failure IDs; restoration validates **every** conforming external event whose entry/path/
observed condition matches the repaired state, inserts all not-yet-present event IDs into the
checkpoint's canonical order, and retains every external file as an immutable witness. It neither
selects one event nor collapses distinct observations. It never fabricates a valid checkpoint merely to record its own failure.

A captured response that fails its
registered provider parser uses `provider-parse-failure`, `action=preserve-and-terminalize`, and
request `terminalState=terminal-access-failure` with `reasonCode=provider-parse-failure`; its enclosing
complete-capture attempt is changed only to `retryDecision=terminal` and `waitMs=0`, and request
result fields are exactly `capTruncated=false`, `continuation=null`, `providerTotal=null`,
`returnedCount=0`, `occurrenceIds=[]`, and `schedulingWitnesses=[]`. Its `priorFacts` has equal
actual/expected capture hashes, the authenticated current owner hash, the attempt raw path,
`state=provider-parse-failure`, and null recovery/epoch fields. A rejected
manual/assessment input changes no checkpoint and appends no event. The event's request ID is null for owner/publication recovery,
checkpoint-temporary recovery, and exactly the capture-integrity states declared null in the matrix
above; every other request-scoped event uses its one validated request ID.

The earlier instruction to re-execute a missing/tampered raw-checkpoint pair is superseded by the
four-attempt dispatch contract. A terminal or pending attempt whose committed capture no longer
validates produces `capture-integrity-failure` and a hard fail-closed stop: it is never skipped,
overwritten, republished, or redispatched. Execution can resume only after the exact captured bytes
are restored or a newly registered execution supersedes the damaged one. The dispatch-reservation
recovery rules above remain the sole exception because they define how an attempt not yet committed
to the checkpoint is completed without redispatch.

Direct JSON/XML records are re-parsed deterministically from their committed response envelope on
resume; the parser implementation/version is bound by the executor blob. This supersedes the earlier
ambiguous statement that a separate arbitrary provider-field projection is retained as checkpoint
metadata. The closed occurrence and scheduling-witness rows retain only their registered observed
fields. Manual captures retain their complete registered `records[].fields` objects and are bound to
the importer/executor blob. The ignored raw capture remains authoritative, and the tracked verifier's
already stated inability to recheck absent raw parser/source facts remains a limit requiring
independent source review before any successor candidate lock.

Finally, the flushed publication-plan root is mandatory for producer publication/recovery and for
the coherent-repin negative control. A clean-clone `verify` without that ignored checkpoint can
independently rederive the five tracked products, entry-local schedule, manifest and fail-closed
outcome, but cannot claim it re-established the prior local plan root; it reports
`structurallyVerified=true`, `publicationPlanRootChecked=false`, and
`publicationAcceptanceEligible=false`, then
the CLI exits 3 with reason `publication-plan-root-unavailable`. With the exact flushed root present
and all checks passing it reports all three booleans true and exits 0. Initial evidence acceptance
must run the root-bearing publication/recovery verifier before commit and record that result. This
mode distinction does not permit a producer-supplied gate verdict: both modes still independently
derive every tracked result and literal `passEligible=false`.

That initial result is durable in a sixth entry file, `verification.json`; this supersedes only the
earlier five-file directory count. The five science products and `summary.artifacts` relationship
remain unchanged. `verification.json` has exactly `entryId`, `evidenceArtifacts`,
`evidenceRootSha256`, `publicationAcceptanceEligible`, `publicationPlanRootChecked`,
`registerSectionSha256`, `schema`, `structurallyVerified`, `utc`, and `verifier`;
`schema=phase6-wp1-verification-report-v1`. `evidenceArtifacts` is the path-sorted five-product
descriptor array, `evidenceRootSha256` is its canonical-array SHA-256, and `verifier` has exactly
`blob`, `commit`, and `sha256` for the frozen executor/verifier source. The three booleans are literal
true in a publishable report. The verifier, not the producer reduction, builds this canonical report
from independently derived values. Its `utc` is exactly the already pinned
`summary.execution.endedUtc`; it is not a second injected time and is therefore reconstructible from
the five science products.

Publication preparation is permitted only after the full rederived stopping condition has executed:
`outstandingRequestIds=[]`, every request row is terminal, `dispatchReservation=null`, and the raw
inventory has no capture temporary or incomplete recovery action. A manual reservation whose result
is unavailable must first receive its registered no-response import. A `pending-retry` row cannot
be omitted as merely outstanding and cannot publish. Access failures, terminal cap states and
unresolved scheduling operands remain publishable only as their explicit fail-closed terminal
scope; never-attempted required work is not an abandonment mode in this protocol.
After that precondition, the owned `publish` preparation samples the one summary end, validates its
chronology, stores it as nonnull checkpoint `execution.endedUtc`, atomically flushes/reopens the
checkpoint, and only then creates any product path. A nonnull end freezes all live request, import,
assessment and scientific-state mutation; summary copies it exactly and it is never resampled.
An existing candidate-product path with null checkpoint end is invalid and preserved for diagnosis,
not adopted. Candidate-product construction begins only after that same precondition and summary
end are durable. Once the end or any candidate-product/publication temporary/final exists, the entry is publication-frozen:
only `publish`, `recover-owner`, read-only `status`, or read-only `verify` may run. Requests, manual
exports, captures and assessments are refused; there is no implicit invalidation/archive escape.
This prevents a crash-left pre-plan product prefix from becoming stale under later scientific
mutation.

All five science-product candidates are durable before report construction or plan flush at exact
ignored directory
`research/tmp/phase6-wp1-source-search-01/ENTRY_ID/publication-staging/candidate-entry/`. Each exact
filename is committed independently through a unique `.tmp-OWNER_NONCE-SEQUENCE`, file sync,
reopen, canonical/JSONL validation and no-replace hard link, using the same complete/partial/both
crash rules as the verification candidate below. The four JSONL products precede `summary.json` so
its descriptors are rederived from installed candidate bytes. With `publicationPlan=null`, any
installed subset is accepted only after exact producer-independent rederivation and the missing
files may then be generated; a divergent installed final fails closed, while an authenticated
partial temporary is preserved under sibling `orphaned-product-temporaries/FILENAME/SHA256.bin`
before retry. No tracked `evidence/` staging path is created before plan flush. The deterministic
next-manifest bytes exist before that flush only in memory and then as `nextManifestUtf8` inside the
atomically installed checkpoint plan, so there is no pre-plan next-manifest temporary to strand.

The plan builder deterministically constructs the **prospective** report bytes from the five
candidate products, but those bytes are not yet a verifier result and are not installed as a file.
The publication plan supersedes the earlier six-key form and has exactly
`aggregateRootSha256`, `artifacts`, `nextManifestByteLength`, `nextManifestSha256`,
`nextManifestUtf8`, `startingManifestSha256`, `verificationByteLength`, `verificationSha256`, and
`verificationUtf8`. The last three bind the complete prospective canonical report; its descriptor
is what enters `nextManifestUtf8`. Atomic plan flush therefore precedes the claim that the
publication-plan root was checked and makes the sixth bytes, descriptor and UTC reconstructible
after any later crash.

Only after reopening that nine-key plan does the owned `publish` action call the independent
verifier to recompute all report fields from the five products, the actual flushed plan root and
frozen identities. The verifier rejects
unless its canonical bytes exactly equal `verificationUtf8` and the registered byte/hash fields.
Then it commits those now-verified bytes at exact repository-relative ignored path
`research/tmp/phase6-wp1-source-search-01/ENTRY_ID/publication-staging/verification.json` by writing/
file-syncing/reopening unique sibling `verification.json.tmp-OWNER_NONCE-SEQUENCE`, no-replace
hard-linking it to the candidate path, reopening/hash-validating the final and removing only the
authenticated temporary name. A crash-left complete temporary can finish the link after the same
root-bearing verification; a partial temporary is preserved without byte change under
`publication-staging/orphaned-verification-temporaries/OWNER_NONCE-SEQUENCE/SHA256.bin` by the same
no-replace transaction before retry. If both names exist they must be same-file identical. With a
flushed plan, an absent report is safely reconstructed from its pinned bytes only after independent
verification; a divergent final fails closed.

Publication then uses exact repository-relative tracked staging directory
`evidence/phase6-wp1-source-search-01/.ENTRY_ID.staging-AGGREGATE_ROOT_SHA256`. After plan flush its
legal contents are one exact prefix, including the empty prefix, of
`requests.jsonl`, `occurrences.jsonl`, `candidates.jsonl`, `relations-and-currency.jsonl`,
`summary.json`, `verification.json` in that order. The publisher exclusively creates an absent
directory or reopens a crash-left prefix, rejects any extra name, gap, divergent byte, symlink,
reparse point or nonregular file, then fills only the next missing name by a no-replace hard link
from an independent copy temporary at
`publication-staging/tracked-entry-temporaries/FILENAME.tmp-OWNER_NONCE-SEQUENCE`. That ignored
temporary is exclusively created, copied from the verified candidate, file-synced, reopened and
byte/hash-validated before the link. The installed tracked link is reopened, then only the
authenticated temporary hard-link name is removed, leaving no ignored hard-link alias to tracked
evidence. A complete temp-only state may finish the link; authenticated both-names removes only the
temp; a partial temporary is preserved at
`publication-staging/orphaned-tracked-entry-temporaries/FILENAME/OWNER_NONCE-SEQUENCE/SHA256.bin`
before an independent copy is retried; a divergent temporary/final or non-same-file both state fails.
Thus an empty or one-through-five-file crash state is continuable; no partial tracked file is
possible and no installed final is overlaid or writable through an ignored alias. After all six exact files
and the directory are revalidated, one atomic directory rename installs
`evidence/phase6-wp1-source-search-01/ENTRY_ID/`. A preexisting canonical directory is accepted only
as the exact post-rename plan state; canonical plus staging together, or any divergent filesystem
identity, fails closed.

During publication/recovery the verifier ignores prospective booleans or producer reductions,
recomputes every field from the five products/root/frozen identities, independently requires
`utc=summary.execution.endedUtc`, and requires exact byte equality before installation. In
`summary.artifacts`, the publication plan's `artifacts`, `verification.json.evidenceArtifacts`, and
the aggregate evidence-root input, paths are the five exact entry-relative filenames; the report's
own entry-relative descriptor path is `verification.json`. Only `nextManifestUtf8` uses the six full
repository-relative `evidence/phase6-wp1-source-search-01/ENTRY_ID/FILENAME` paths. Thus the plan's
`artifacts` remains the five descriptors while its exact `nextManifestUtf8` binds the sixth,
plan-reconstructible report descriptor. Publication refuses a false report, a report built without the
root, or a report whose descriptors, root, UTC, verifier identity or register identity differ.

The root-wide `108 + 135 = 243` verification is not a tenth CLI action. The existing
`runner/test/evidence-integrity.test.ts` always rederives the pure 243 registry invariant. While
exactly one entry is unpublished, that test reports the absent entry but passes when the pure
invariant and every present entry check pass; absence alone is not a test failure and the present
entry is never treated as 243. Once both entry directories are present, it additionally verifies
both exact entry subsets and their 108-plus-135 total. The owned `publish --entry ...` action
produces the canonical report; the read-only per-entry `verify --entry ...` action validates it and
emits a transient machine-readable result without writing. `docs/PROGRESS.md` and `docs/HANDOFF.md` must record the exact
root-bearing command, report path/hash, exit 0 and independent review before evidence acceptance;
the transient clean-clone exit-3 result is never written over the accepted tracked report.

Per-entry verification distinguishes recovery from later repository history. Using the plan's
pinned provenance HEAD, it reopens the historical starting manifest blob, verifies
`startingManifestSha256`, applies exactly that entry's six planned descriptors, and rederives the
exact historical next-manifest bytes/hash. `publish` recovery accepts only the same-HEAD old/next
states in the crash matrix and never treats a later superset as an in-flight transition. Read-only
`verify`, however, may validate an already completed older entry against a later live manifest only
after independently validating the entire live manifest and every referenced artifact, proving that
the entry's six path/byte/hash descriptors are exact members, and proving the live manifest is a
strict append/sort/recount successor of the rederived historical next manifest with no changed or
removed prior descriptor. That mode still checks the old flushed plan root when its checkpoint is
present, but it is reported as `completed-entry-successor-manifest`, not publication recovery. An
arbitrary superset, path replacement, historical-manifest mismatch or missing intervening artifact
fails closed.

At execution start, before every live direct request or manual export, and immediately before publication, the
executor rechecks the same HEAD and a tracked-only clean status. Before **every** later mutating
action—including owner/claim acquisition, recovery, import, parse, assessment, freeze and
publication—it also re-observes Node, V8, platform, architecture, every registered environment
value and every named certificate file, and requires byte-for-byte equality with checkpoint
provenance before external I/O or mutation. A value that drifts and is later restored cannot
contribute bytes: that invocation refuses. `prepare` records the initial observation before its
first checkpoint, and read-only `status` reports but does not repair a mismatch. It records Git blob IDs for this
register, the executor and CLI source, SHA-256 of the exact Section 11 Git-blob bytes, and SHA-256 of
the executor/CLI Git-blob bytes. The Section 11 slice begins at the first UTF-8 byte of the exact
heading `## 11. WP1 source-search and extraction register` and continues through end-of-file, with no
preceding newline; moving later material below that heading therefore moves the pin. This correction
supersedes the earlier statement that all unrelated untracked/ignored workspace paths are recorded:
they are neither traversed nor serialized and do not cause refusal. The user's root `=` is therefore
untouched. Only the entry-local ignored execution tree is exhaustively inventoried under the closed
checkpoint/recovery rules, and every explicitly registered ignored source input is separately
reopened, byte-counted and hashed into `sourceInputs`. There is no missing general-workspace
inventory field in checkpoint, provenance or summary.
Nonempty `NODE_OPTIONS`, `NODE_PATH`, `NODE_USE_ENV_PROXY`, `NODE_CHANNEL_FD`,
`NODE_TLS_REJECT_UNAUTHORIZED`, `SSL_CERT_DIR`, or `OPENSSL_CONF` is refused. The recorded non-secret
environment is the explicit set `LANG`, `LC_ALL`, `TZ`, `SSL_CERT_FILE`, `NODE_EXTRA_CA_CERTS`,
`NODE_TLS_REJECT_UNAUTHORIZED`, `SSL_CERT_DIR`, and `OPENSSL_CONF`; refused values are explicit null.
A named certificate file is recorded by path, bytes and SHA-256, while an
absent variable is explicit null. No other environment value or secret is serialized.

**Durable products and publication.** A completed entry publishes exactly one subdirectory
`evidence/phase6-wp1-source-search-01/ENTRY_ID/` containing the five science products below plus the
sixth `verification.json` registered above:
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
  `identity`, `intendedRequest`, `occurrenceIds`, `providerTotal`, `reasonCode`,
  `requestId`, `returnedCount`, `schedulingWitnesses`, `schema`, and `terminalState`; its schema is
  `phase6-wp1-request-ledger-row-v1`. `requestId` and identity are independently rederived.
  The earlier cold-resume phrase “decoded parameters” is superseded: decoded values are
  deterministically rederived from the registered identity and intended URL/call and are not a
  stored request key.
  `intendedRequest` has the three manual-schema keys above. `continuation` is the same null-or-three-
  key object above. An attempt has exactly `attemptOrdinal`, `captureBytes`, `captureKind`,
  `captureSha256`, `endedUtc`, `error`, `finalUrl`, `redirects`, `reservation`, `responseHeaders`, `retryDecision`, `startedUtc`,
  `status`, and `waitMs`; the ignored checkpoint form additionally has `rawPath`, while the tracked
  evidence form removes only that key. Ordinals are consecutive from one and retry/wait values must implement the
  registered rule. Each attempt's `reservation` is the exact validated eight-key snapshot registered
  above, matches its enclosing request/ordinal/adapter mode and ordinary or dispatch-recovery path
  rule, and is unique to that
  attempt. Attempt `error` is null or exactly `{code,message,name}`; `status` is an HTTP
  safe integer from 100 through 599 inclusive or null; `retryDecision` is `none`, `retry`, or `terminal`; and `responseHeaders` has every
  stable allow-list header key exactly once with string-or-null values. The row terminal state is
  one of the four registered terminal states, `reasonCode` is nonempty, and `occurrenceIds` sort by
  ID. `providerTotal` is null or a nonnegative safe integer and `returnedCount` is a nonnegative safe
  integer. In every non-access terminal row, `returnedCount` equals both the complete parsed record
  count and `occurrenceIds.length`; provider-specific advertised-total/page/cap equations must hold.
  Access rows use either the closed zero/null projection or the exact four-reason retained-record
  projection above; in the latter, `returnedCount=occurrenceIds.length`. The enclosing request
  retains the access-failure reason, and every affected candidate independently derives its
  `access-taint:REQUEST_ID:REASON_CODE` disposition reason; occurrence and scheduling-witness rows
  do not invent a free-form reason field.
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
  `selectedForScreening`,
  `subjectScheduleId`, `title`, `unusableVersionUrlSha256s`, `versionUrls`, and `year`; arrays are complete normalized and sorted
  within the member, and members retain the registered provider/local-sort order by consecutive
  one-based ordinal. For Crossref `reference` and OpenAlex `referenced_works` arrays,
  `selectedForScreening=true` exactly for ordinals 1 through `min(receivedCount,200)`; later
  members remain published with `predicateWitness=null` and schedule no request. Every member of
  another source kind is selected and has a nonnull witness. A selected `predicateWitness`
  uses the exact occurrence screen-witness keys. `membersSha256` hashes the canonical complete
  member array and `witnessId` is lowercase SHA-256 of the canonical witness without its own ID.
  Parent and member cardinality are source-kind-specific:

  | source kind | parent IDs | one member per | required nonempty member field(s) | subject ID |
  |---|---|---|---|---|
  | `crossref-references` | enclosing request; occurrence null | complete received reference after registered sort | any available IDs/names/title/year; AID/URL arrays empty | `doi:DOI` if present, else `openalex-work:WID` if present, else `occurrence:` plus lowercase SHA-256 of canonical `{memberOrdinal,parentRequestId,rawMemberSha256,schema:"phase6-wp1-crossref-title-subject-v1"}` |
  | `openalex-referenced-works` | enclosing request; occurrence null | received WID after registered sort | exactly one work ID; names/AIDs/URLs empty | `openalex-work:WID` |
  | `openalex-authors` | enclosing request; occurrence null | validated received AID | exactly one AID and available exact display names; IDs/URLs empty | `openalex-author:AID` |
  | `stable-version-urls` | immutable occurrence that supplied the metadata/assessment; request null | registered returned URL | exactly one URL; other arrays empty | candidate `doi:DOI` if present, else `occurrence:` plus that parent occurrence ID |
  | `exact-author-names` | immutable occurrence that supplied the metadata/assessment; request null | distinct Unicode-sorted exact name | exactly one name; other arrays empty | registered `author-name:SHA256` |
  | `local-source-citations` | assessment occurrence; request null | citation/credit in source order | available IDs/names/title/year; AID/URL arrays empty | `doi:DOI` if present, else `openalex-work:WID` if present, else registered `local-member:SHA256` |

  Here `enclosing request` means `parentRequestId` is that request and `parentOccurrenceId` is null;
  `candidate/assessment occurrence` means the inverse and always names the immutable occurrence
  that supplied those values, never a later component/canonical pointer. Both parent IDs non-null, or both null, is
  invalid. For a request-parent witness, `sourceCaptureSha256` equals that request's terminal
  successful attempt capture hash. Candidate-parent values are partitioned by their actual immutable
  source: provider-derived values produce one witness for the supplying occurrence and use that
  occurrence's terminal successful request capture; assessment-derived values produce a separate
  witness for the supplying assessment occurrence and use that effective assessment's source hash.
  A value appearing in both origins therefore produces both witnesses; there is no source priority
  or component-wide choice. A local citation always uses its assessment source hash. A
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
  The full received count must equal `memberCount` and array length. A received relation array
  longer than 200 sets the enclosing request's `capTruncated=true`,
  `terminalState=terminal-partial-at-cap`, and `reasonCode=result-cap-reached`; only selected
  ordinals enter schedule expansion. An inaccessible/unparseable relation
  is represented by the request's terminal failure, never an invented empty witness.
- An `occurrences.jsonl` row has exactly `acquisitionPointer`, `acquisitionStatus`,
  `canonicalVariantOccurrenceId`, `citationWalkTrigger`, `componentAliasHistory`, `display`,
  `finalComponentKey`, `identifiers`, `identityConflictWitness`, `identityStatus`,
  `occurrenceId`, `providerRank`, `publicationDateWitnesses`, `rawRecordSha256`,
  `requestId`, `schema`, `screenDisposition`, `screenDispositionBeforeAlias`, and `screenWitness`; its schema is
  `phase6-wp1-occurrence-ledger-row-v1`. `identifiers` is a sorted array of exact `{type,value}`
  objects using the registered identifier namespaces. `display` has exactly
  `abstractOrSubjectPresent`, `acquisitionURL`, `cutoffDisposition`, `cutoffWitness`, `firstAuthor`,
  `publicationDate`, `strongIdentifier`, `title`, `venue`, and `versionLabel`; only the presence
  boolean is published for abstract/subject content. The two cutoff fields and `versionLabel` are
  null except for the registered version-link observation above.
  `screenWitness` has exactly `crystalToken`, `durationDimensionAlternative`, `excludedCategory`,
  `metadataSufficient`, `pressureToken`, `primaryExperimentClaim`, and `yamashitaToken`.
  The six non-category witness values are booleans and `excludedCategory` is string or null.
  `publicationDateWitnesses` is the complete sorted provider-derived array in the exact schema
  above; `display.publicationDate` is presentation metadata and is never the scheduling authority.
  `acquisitionPointer` is null or has exactly `bytes`, `path`, `relevantPages`, and `sha256`; it binds
  ignored/source bytes without redistributing them. Display members are string or null except the
  required presence boolean; identifier values are nonempty strings; relevant
  pages are sorted strings. The prior free-form occurrence `reasonCodes` member is removed;
  screen/acquisition/cutoff facts are already closed fields and candidate reasons are derived below.
- `candidates.jsonl` contains exactly one row for every final identity component represented in
  `occurrences.jsonl`, including excluded components and unresolved leads; no component may be
  omitted as “not a candidate.” A row has exactly `admissibility`, `aliases`, `assessmentDescriptors`,
  `canonicalOccurrenceId`, `citation`, `componentKey`, `currencyLinks`, `dispositionReasons`,
  `identifiers`, `independenceEvidence`, `methodsData`, `nextActions`, `occurrenceIds`,
  `schedulingInputs`, `schedulingWitnesses`, and `schema`; its schema is
  `phase6-wp1-candidate-row-v1`. `citation` has exactly `authors`, `publicationDate`,
  `stableIdentifiers`, `title`, and `venue`. `methodsData` has exactly `apparatus`,
  `durationHistory`, `observable`, `pressureGas`, `sampleSize`,
  `seedPopulationCrystallography`, `solverPredictability`, `supersaturation`,
  `supportVentilation`, `temperature`, and `uncertainty`. `admissibility` has exactly
  `currency`, `geometry`, `identity`, `independenceCAK`, `independenceM1`, `independenceM1NoDip`,
  `observable`, `primarySource`, `sourceBytes`, `targetStatus`, `transport`, and `uncertainty`;
  statuses use the entry's registered fail-closed vocabulary. The three independence values are
  exactly `independent`, `overlap`, or `unresolved`; the other non-target statuses are exactly
  `pass`, `fail`, `unresolved`, or `not-applicable`; and `targetStatus` is one of `scoreable`,
  `blocked`, `lead`, or `excluded`.

  `targetStatus=scoreable` requires `currency`, `geometry`, `identity`, `observable`, `primarySource`,
  `sourceBytes`, `transport`, and `uncertainty` all `pass`, all three independence values
  `independent`, and every descriptor review to be
  `humanReviewed=true/reviewDisposition=adequate`. It additionally requires at least one
  non-duplicate occurrence with `screenDisposition=include-acquire`,
  `acquisitionStatus=acquired-and-verified`, a nonnull acquisition pointer, and an accepted
  descriptor for that same occurrence whose source path/bytes/hash agree exactly. Every other
  non-duplicate `include-acquire` occurrence must satisfy the same bound-source predicate, and no
  non-duplicate citation lead may remain. Effective target status ignores producer priority and is
  derived in this exact order: `excluded` iff every non-duplicate occurrence is
  `exclude-out-of-scope`; otherwise `lead` iff the component has no accepted assessment;
  otherwise `scoreable` iff the complete predicate above holds after every conflict and currency
  clamp; otherwise `blocked`. An imported assessment's own target status must equal `excluded`
  for an excluded screening, `scoreable` only when its source is acquired, review adequate and its
  own all-pass/all-independent predicate holds, and `blocked` otherwise; it can never self-label
  `lead`. Imported target-status strings are checked locally but never reduced or trusted.

  Effective `currency` is not accepted from the assessment reducer alone. For that final component,
  the verifier expands every required correction, version-link and same-author Rule 12 cohort from
  complete witnesses/inputs. Any `outstanding`, `access-incomplete`, `partial-at-cap`, or
  `unresolved-no-request` outcome clamps assessed `pass` or `not-applicable` to `unresolved`;
  assessed `fail` remains `fail`. `complete-no-results` discharges its cohort.
  `complete-results` discharges only when every returned pre-cutoff occurrence is either
  deterministically `exclude-out-of-scope` with `screenWitness.metadataSufficient=true`, or has an
  acquired-and-verified, adequately human-reviewed assessment descriptor carrying an exact
  `currencyLinks` edge for that request and subject. Edge effects `not-relevant` and
  `confirms-current-version` discharge that occurrence; `unresolved`, a retained citation lead,
  missing/inadequate review, or inaccessible source clamps currency to `unresolved`; and
  `corrects-without-superseding` or `supersedes` makes currency `fail` pending an explicit new
  source/version decision. Each `registered-version-url` observation is rederived:
  `admissible-precutoff` enters that same content-discharge rule,
  `public-by-cutoff-unresolved` independently clamps unresolved, and
  `post-cutoff-follow-up` is retained but does not govern the cutoff result. A zero-record failed
  route is therefore as disqualifying as an unresolved record-bearing route. The verifier and
  negative controls rederive this cross-component request/occurrence/assessment graph.

  `componentKey` is the shared `finalComponentKey`; `occurrenceIds` is the UTF-16-sorted complete
  component membership; `canonicalOccurrenceId` is the registered canonical display variant and
  every member points to it. `aliases` is the sorted duplicate-free union of every member's
  `componentAliasHistory` with `componentKey` removed. `identifiers` is the type-then-value
  UTF-16-sorted duplicate-free union of every member's exact `{type,value}` objects.
  `assessmentDescriptors` is the occurrence-ID-sorted complete descriptor subset for the
  component, with duplicate occurrence IDs rejected. `currencyLinks` is the complete sorted union
  from **all** descriptors whose subject occurrence is in the component, including descriptors for
  Rule 12 results in another component. `independenceEvidence` is the exact three-arm conservative
  status/path/rationale projection registered above.

  `dispositionReasons` is independently rebuilt as the sorted duplicate-free union of
  `assessment-conflict:OBJECT.FIELD` for each conflicting scalar;
  `admissibility:FIELD:STATUS` for every ordinary field not `pass`, every independence field not
  `independent`, and always `targetStatus`; `review:OCCURRENCE_ID:DISPOSITION` for each
  non-adequate review; `screen:OCCURRENCE_ID:VALUE` for each disposition other than
  `include-acquire`; `acquisition:OCCURRENCE_ID:VALUE` for each status other than
  `acquired-and-verified`; `currency-effect:REQUEST_ID:SUBJECT_ID:EFFECT` for each effect other than
  `not-relevant` or `confirms-current-version`; `cutoff:OCCURRENCE_ID:VALUE` for each nonnull
  cutoff disposition; `date-identity-unresolved` when the registered `FROM` fallback was needed;
  `invalid-version-url:SHA256` for each unusable version-URL witness;
  `identity-conflict:OCCURRENCE_ID` for each conflicting occurrence;
  and `access-taint:REQUEST_ID:REASON_CODE` for each retained-record access-tainted lineage. No
  imported prose, arrival-time label, or omitted status enters this array.

  Citation authors/identifiers and every reason array are sorted nonempty strings; other citation
  and every methods-data value are string or null. `schedulingInputs` has exactly
  `authorNameVariants`, `openalexAuthorIds`, `publicationDateWitnesses`, `relationIdentifiers`,
  `unusableVersionUrlSha256s`, and `versionUrls`. The five string arrays are sorted and
  duplicate-free; date witnesses use the
  exact object order above. Candidate `schedulingWitnesses` use the exact witness schema and carry
  acquired/local-source citations or credits that are not response children. Every scheduling
  input is independently rederived from occurrence fields, request/local witnesses, or complete
  assessment descriptors; a producer cannot add, omit, or substitute a later candidate date.

  `nextActions` is independently derived, never copied from an assessment. An excluded component is
  exactly `["none-out-of-scope"]`; a scoreable component is exactly `["none"]`. Otherwise it is the
  UTF-16-sorted duplicate-free union of `acquire-primary-source` for a non-duplicate
  `include-acquire/not-attempted` occurrence, `assess-acquired-source` for acquired source bytes
  lacking a bound descriptor, `resolve-source-access` for inaccessible acquisition,
  `resolve-citation-lead` for a non-duplicate citation lead, `obtain-independent-human-review` for
  a non-adequate descriptor, `resolve-assessment-conflict` for any scalar conflict,
  `resolve-identity` for any identity conflict,
  `resolve-currency` for nonpassing currency, `resolve-independence` for any non-independent arm,
  and `resolve-scientific-admissibility` for any other nonpassing load-bearing field. If none of
  those predicates fires for a nonexcluded nonscoreable component, the last action is the exact
  fallback. The array is never empty or arrival-selected.
- A `relations-and-currency.jsonl` row has exactly `direction`, `hop`, `outcome`, `reasonCodes`,
  `requestIds`, `schema`, `stage`, `subjectScheduleId`, `triggerOccurrenceId`, and `witnessIds`; its schema is
  `phase6-wp1-relation-currency-row-v1`. There is exactly one row for each semantic tuple
  `{direction,hop,stage,subjectScheduleId,triggerOccurrenceId}`. The row has no route field:
  `requestIds` is the sorted complete set of every registered route, page and date-operand request
  required by the stage table for that tuple, and `witnessIds` is the sorted complete set of
  authorizing witnesses. `triggerOccurrenceId=null` only for a fixed known-seed resolution whose
  DOI/WID is registered directly; every dynamic row names the immutable occurrence whose
  screen/relation/Rule 12 rule caused that tuple, never its later canonical pointer. A
  `currencyLinks.subjectOccurrenceId` must equal that nonnull trigger and its
  `relationRequestId` must be one member of this row's request set; this is the exact meaning of a
  relation row “naming” the subject. `outcome` is exactly one of `complete-results`, `complete-no-results`, `partial-at-cap`,
  `access-incomplete`, `outstanding`, or `unresolved-no-request`, derived in this priority order:
  any absent or `pending-retry` required request gives `outstanding`; otherwise any
  `terminal-access-failure` gives `access-incomplete`; otherwise any `terminal-partial-at-cap` gives
  `partial-at-cap`; otherwise any `complete` request gives `complete-results`; otherwise a nonempty
  all-`terminal-no-results` cohort gives `complete-no-results`; and an empty request cohort is allowed
  only when its witnesses prove that no registered identifier/title operand can be formed, giving
  `unresolved-no-request`. `reasonCodes` is the sorted duplicate-free union of the cohort's nonnull
  request reason codes, except the empty cohort has exactly `unresolved-scheduling-operand`; no other
  outcome or producer-selected reason is allowed. Rows sort field-by-field by
  `subjectScheduleId`, `stage`, `direction`, numeric `hop`, null-first `triggerOccurrenceId`,
  canonical JSON of sorted `requestIds`, then canonical JSON of sorted `witnessIds`; duplicate full
  tuples are rejected.
- `summary.json` has exactly `artifacts`, `counts`, `cutoffUtc`, `entryId`, `execution`,
  `limitations`, `nextActions`, `outcome`, `passEligible`, `provenance`, `schema`, `sourceInputs`, and
  `terminalScope`; its schema is `phase6-wp1-source-search-summary-v1` and `passEligible` is literal
  false. `execution` has exactly `endedUtc` and `startedUtc`. `provenance` has exactly `arch`,
  `cliBlob`, `cliSha256`, `environment`, `executorBlob`, `executorCommit`, `executorSha256`, `head`,
  `manifestStartSha256`, `node`, `platform`, `registerBlob`, `registerSectionSha256`, and `v8`.
  `environment` has exactly `LANG`, `LC_ALL`, `NODE_EXTRA_CA_CERTS`, `NODE_TLS_REJECT_UNAUTHORIZED`,
  `OPENSSL_CONF`, `SSL_CERT_DIR`, `SSL_CERT_FILE`, and `TZ`; the
  `LANG`, `LC_ALL`, and `TZ` are string or null, while each certificate value is null or exactly
  `{bytes,path,sha256}`; the three refused TLS/config override keys are literal null.
  `sourceInputs` is the UTF-16-path-sorted duplicate-free `{bytes,path,sha256}` union of the registered ignored
  source inputs plus every accepted assessment archive and each named source or acquisition-evidence
  artifact. `artifacts` lists the other four products as sorted
  `{bytes,path,sha256}`. `counts` has exactly `baseQueryRouteCombinations`, `dynamicRequests`,
  `occurrences`, `outstandingRequests`, `requests`, and `terminalRequests`. `terminalScope` has
  exactly sorted `accessFailures`, `capIncomplete`, `noResults`, and `unresolvedSources` arrays.
  `nextActions` is the UTF-16-sorted duplicate-free union of all candidate next actions and is empty
  only when the candidate file is empty.
  `outcome` is exactly `incomplete`, `complete-candidate-found`, or
  `complete-no-admissible-candidate`, derived without changing `passEligible=false`.

The summary projections are exact. `counts.dynamicRequests` is the cardinality of the fully
rederived required request-ID set after subtracting the entry's frozen initial 168 or 222 IDs;
terminal versus outstanding state does not change membership. `counts.requests` is
`requests.jsonl` row count, `counts.terminalRequests` is the count of its terminal rows,
`counts.outstandingRequests` is the independently rederived outstanding-ID count, and
`counts.occurrences` is `occurrences.jsonl` row count. Publication below requires every request row
terminal and no outstanding ID, so the two request counts are equal and outstanding is zero in an
admissible bundle; the fields remain explicit negative-control seams.
`terminalScope.accessFailures`, `.capIncomplete`, and `.noResults` are respectively the UTF-16-sorted
request IDs in those three terminal states. Each `.unresolvedSources` member is
`relation-scope:SHA256`, where the digest is over the canonical object containing exactly
`direction`, `hop`, `schema`, `stage`, `subjectScheduleId`, `triggerOccurrenceId`, and `witnessIds`
for one `unresolved-no-request` relation row, with schema
`phase6-wp1-unresolved-relation-scope-v1`; members are sorted and duplicate-free. `outcome=incomplete`
if any outstanding, access-failure, cap-incomplete, or unresolved-source member exists. Otherwise it
is `complete-candidate-found` iff at least one independently rebuilt candidate has
`admissibility.targetStatus=scoreable`, and is `complete-no-admissible-candidate` otherwise.
`noResults` alone is a completed negative search result, not incompleteness.

`verify` strictly parses all six entry files and independently recomputes, rather than trusts: every
request/occurrence ID; the pure root-wide 243-combination registry invariant, the selected entry's
exact 108- or 135-combination subset, and every required fixed page for that entry;
continuation parent hashes and missing children; relation/Rule 12 triggers and the stage table;
request terminal/cap/access outcomes; identifier normalization, conflicts, union components,
aliases and canonical-variant selection; publication-date witness completeness and earliest
`CANDIDATE_DATE`; assessment/acquisition transition and descriptor completeness; conservative
multi-assessment, currency-link, independence-evidence and candidate/component cross-references;
the four artifact descriptors; every summary entry/cutoff/execution/count/scope/limitations/
`nextActions`/outcome/provenance/source-input field; and literal `passEligible=false`. It also reopens the global manifest and checks
exact path/byte/hash/count/total pins. The verifier derives structural
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

Those verifier claims split by available authority. Root-bearing publication verification reopens
the checkpoint, accepted assessment/capture archives, every named source/acquisition-evidence/
certificate file, current
frozen Git objects and the live environment, and requires them to match the recorded observations.
Tracked-only clean structural verification cannot re-observe historical clock, host, engine,
environment or absent ignored/copyrighted bytes; it checks schema, descriptor unions, chronology,
cross-references and Git-object/hash relationships and reports those observation limits rather than
claiming them re-executed. In both modes,
`summary.provenance.executorCommit = summary.provenance.head = verification.verifier.commit`;
`verification.verifier.blob = summary.provenance.executorBlob` and its SHA-256 equals
`summary.provenance.executorSha256`; each executor/CLI/register blob must be the Git blob at that
commit and registered path, and each stored SHA-256 must hash those exact blob bytes. Section and
starting-manifest hashes are then rederived from those objects. A current runtime value matching a
stored string is never substituted for unavailable historical observation.

Focused negative controls independently prove and then reject mutation of each of: an unknown
schema, an omitted registered request, a registered
query/route/page, request identity field, continuation-parent hash, terminal/cap/access state,
occurrence ID, publication-date witness/earliest lower bound, strong-ID bridge/conflict,
component/canonical variant, required relation/Rule 12 trigger or content-discharge edge,
accepted-assessment acquisition/screen/review/source/evidence hash, independence path,
multi-assessment conflict reduction, candidate admissibility/status/next action, summary
count/scope/limitations/next-actions/outcome/pass field (including a summary-only
verdict flip), combined removal of one witness-derived trigger and all its descendants, artifact byte/path/hash,
and global-manifest path/byte/hash/file-count/total. The coherent-repin negative control must mutate
and independently prove mutation of all five science products, regenerate/repin
`verification.json` to those mutations, and coherently repin all six manifest descriptors plus
file-count/total; only then does it demonstrate rejection by the unchanged flushed publication-plan
root. A stale sixth report is not accepted as exercising that control, and no producer-supplied
verdict is accepted.

Before changing tracked evidence, the checkpoint stores and atomically flushes a publication plan
containing exactly `aggregateRootSha256`, `artifacts`, `nextManifestByteLength`,
`nextManifestSha256`, `nextManifestUtf8`, `startingManifestSha256`, `verificationByteLength`,
`verificationSha256`, and `verificationUtf8`. `artifacts` is the five
path-sorted `{bytes,path,sha256}` descriptors and `aggregateRootSha256` hashes their canonical
array; `nextManifestUtf8` is the exact deterministic next-manifest text and its byte count/hash must
agree. `startingManifestSha256` must equal both `summary.provenance.manifestStartSha256` and SHA-256
of the exact `evidence/MANIFEST.json` blob at `summary.provenance.head`; the clean working manifest
must have those same bytes before the plan is built. After plan flush, the exact ignored next-manifest candidate is
`research/tmp/phase6-wp1-source-search-01/ENTRY_ID/publication-staging/next-manifest.json` and its
unique precommit is `next-manifest.json.tmp-OWNER_NONCE-SEQUENCE`. The publisher writes/syncs/
reopens the precommit, no-replace hard-links it to the candidate, reopens/hash-validates that final,
and removes only an authenticated same-file precommit name. A complete precommit may finish the
link; a partial one is preserved at
`publication-staging/orphaned-manifest-temporaries/OWNER_NONCE-SEQUENCE/SHA256.bin` by the registered
no-replace archive transaction and regenerated; both names must be same-file identical; a divergent
candidate fails closed. Publication verifies every old manifest pin, completes the exact six-file
tracked prefix and ignored next-manifest candidate, rechecks source drift, atomically renames the new entry directory,
then atomically renames the candidate over `evidence/MANIFEST.json` on the same repository volume.
The manifest keeps its existing schema and three metadata
strings verbatim, sorts file paths by UTF-16 code-unit order, recomputes `fileCount`/`totalBytes`,
and serializes as `JSON.stringify(value, null, 1)` plus LF with the existing top-level key order.
The complete crash matrix is: old manifest plus canonical entry absent plus an exact tracked staging
prefix and next-manifest candidate absent or exact; old manifest plus exact canonical entry and the
exact next-manifest candidate; or exact new manifest plus exact canonical entry and no candidate.
The first resumes prefix/candidate construction, the second records
`entry-installed-manifest-pending` then replaces the manifest, and the third records
`manifest-installed-checkpoint-pending` and completes the checkpoint. An exact precommit/candidate
substate follows the rules above. No publication-recovery event is added for a pre-rename prefix or
manifest-candidate resume because the flushed plan and still-installed precommit bytes independently
represent it; the two post-entry states use the registered events. Old manifest plus canonical entry
without its candidate, new manifest without canonical entry, both canonical and tracked staging,
new manifest plus candidate, any unexpected path, divergent byte, or coherent unregistered repin is
a hard fail.
The ordinary tracked-clean preflight has one narrow recovery exception: `publish` or root-bearing
`verify` may proceed at the same HEAD when the only Git differences are the exact planned canonical
six-file entry, an exact prefix of its plan-named tracked staging directory, and/or
`evidence/MANIFEST.json`, and
an independent byte comparison proves they are precisely one of the registered flushed-plan
staging/canonical/manifest crash states above. No live request, import, assessment, new
publication or unrelated command may use this exception; any extra path/byte fails. After recovery,
the intentional evidence/manifest change must be reviewed and committed before the strict clean
preflight permits further source execution.
After one
entry publishes, its intentional tracked manifest change and new evidence must be reviewed and
committed before another entry may make a live request.

The CLI actions are the exact finite set `prepare`, `run-direct`, `export-pending-captures`,
`import-capture`, `import-assessment`, `status`, `publish`, `verify`, and `recover-owner`. Every action
requires one explicit `--entry` whose value is exactly `YAMASHITA-FREEFALL-LINEAGE-01` or
`MATCHED-AIR-PRESSURE-01`; `TAX2-PANEL-SPAN-01` belongs to its separately pre-registered operator
and is rejected here. `import-capture` and `import-assessment` additionally require exactly one
`--input REPOSITORY_RELATIVE_PATH`; that slash-normalized path must have no dot/dot-dot segment and
must lie beneath
`research/tmp/phase6-wp1-source-search-01/ENTRY_ID/imports/inbox/` and have the exact
action-specific hash-bearing basename registered above. Stdin, absolute/out-of-tree paths,
symlinks, reparse points and nonregular files are refused; the importer opens, hashes, parses, then
reopens and rehashes the same bytes before mutation. `recover-owner` requires exactly one of
`--owner-sha256 SHA256` when no claim exists or `--claim-sha256 SHA256` when continuing an installed
claim; each is 64 lowercase hexadecimal characters and the wrong state/flag is refused. Every other
action forbids `--input`, `--owner-sha256`, and `--claim-sha256`. Unknown or duplicate flags/actions,
missing values and positional operands are errors. `run-direct` executes
the one dispatch-order-selected direct attempt and checkpoints afterward; it never treats a
manual/opaque request as completed. `export-pending-captures` is owned/mutating and only installs or
reprints the one selected manual reservation. These operational partitions change neither the
schedule nor the stopping condition.

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

The later captured-retry correction received two additional offline non-author reviews before its
record-only commit. An inherited/shared-context OpenAI Codex `gpt-5.6-sol` reviewer first found three
blockers and one should-fix in clock/retry precedence, crash-recovery serialization and response-byte
wording; after revision its current-byte subsection verdict was 0 blockers / 0 should-fixes. A second
OpenAI Codex `gpt-5.6-sol` reviewer had repository/task context but no author working-chat context. It
independently found three blockers and two should-fixes in binary-safe capture, no-replace commit,
bounded sleep, terminal serialization and header interpretation; after two correction rounds its
final narrow verdict was 0 blockers / 0 should-fixes, including agreement between the register's
`direct-http-envelope` value and the uncommitted skeleton enum. That reviewer independently read the
current subsection and surrounding schemas, inspected Git status/diff and the enum, and ran
`git diff --check` (clean except expected line-ending conversion warnings). Both reviews were
read-only and offline. Neither implemented or executed transport/recovery, created a checkpoint,
contacted an endpoint, ran focused tests or exact root `npm test`, inspected source content, or
reviewed unrelated Phase 6 claims.

On the record-only captured-retry landing candidate, the author executed exact
`npm.cmd run lint:rule7` (clean, 421 files),
`npx.cmd vitest run runner/test/progress-index.test.ts` (7/7),
`npx.cmd tsc --noEmit --pretty false` (exit 0), and `git diff --check` (exit 0 with line-ending
conversion warnings only). Exact root `npm test` did not run for this record-only correction, and no
full-suite claim is made.

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
