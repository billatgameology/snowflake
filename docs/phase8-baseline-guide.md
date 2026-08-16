# Phase 8 baseline data — plain-English guide

## The short version

Phase 8 assembled laboratory measurements that Phase 9 can use to test different parts of the
snow-crystal model. It is not one uniform dataset. It combines several kinds of experiments:
crystals suspended in an electric field, crystals resting on substrates, crystals falling through
gas, direct measurements of individual facet growth, and a few reported group summaries.

If you remember only three things:

1. The baseline contains **51 records**: 18 native histories, 28 selected measurement records and 5
   interpretation safeguards.
2. Its numerical core is **252,134 native rows** plus **431 carefully digitized plot points**.
3. Every record is for **model development**. There is no held-out validation set, so Phase 9 can
   use these measurements to improve and reject ideas, but not to claim independent validation.

This guide describes the Phase 8B successor corpus. The earlier
[Phase 8A target book](../research/phase8-target-book.md) remains useful source-reconciliation
history, but the larger Phase 8B corpus is the practical baseline for Phase 9.

## A small glossary

- **a dimension:** crystal width in the plane of the hexagon.
- **c dimension:** crystal height along the main hexagonal axis.
- **Aspect ratio, c/a:** values below 1 are plate-like; values above 1 are column-like.
- **Mass ratio, m/m0:** a crystal's measured mass divided by its starting mass.
- **Supersaturation:** excess water vapour above ice equilibrium. Different experiments define or
  infer it differently, so equal-looking percentages are not automatically comparable.
- **Native history:** source data released as numerical rows, preserved without reading points from
  a graph.
- **Digitized point:** a data marker recovered from a published graph with a registered coordinate
  mapping and extraction uncertainty.
- **P0 / P1 / P2:** priority and record type, not quality grades. P0 is native longitudinal data,
  P1 is a direct module-discriminating measurement, and P2 preserves an interpretation or lineage
  rule needed to use P0/P1 correctly.

## What is in the baseline

The eight families below account for every final record.

| Data family | Exact contents | What was measured | Main Phase 9 use | Biggest caution |
|---|---:|---|---|---|
| Levitated-particle mass histories | 16 P0 histories; 252,040 rows | Time and single-particle `m/m0` | Growth-history and trajectory tests | Habit and crystallography were not observed |
| Cold-crystal dimension histories | 2 P0 histories; 94 rows | Time, a dimension, c dimension and rim width | Trajectory and change-point tests | The `48%` and `20%` forcing labels have unresolved semantics |
| Libbrecht 2011 supported crystals | 6 P1 series; 207 plot points | Radius, thickness and imposed forcing versus time | History/path response | Only two substrate-supported specimens |
| Libbrecht 2016 needles | 4 P1 series; 78 plot points | Needle height and tip radius versus time | Pressure-conditioned kinetics | One pressure; source height offsets must be retained |
| Direct facet growth | 6 P1 series; 96 plot points | Basal and prism normal-growth rate versus supersaturation | Direct facet-kinetics test | Specimen count and dispersion are not reported |
| Heat/vapour transport interventions | 10 P1 series; 50 plot points | Mean a, c and c/a as gas transport properties change | Heat and vapour transport tests | Free fall makes ventilation relevant |
| Initiation-state summaries | 2 P1 records; 4 reported group aggregates | Final aspect ranges and mass-growth-factor contrast | Seed/initiation-state probe | Groups also differed in starting size and exposure |
| Interpretation and lineage safeguards | 5 P2 records; 0 coordinate rows | Source semantics, dependencies and discrepancies | Prevent invalid comparisons | These are rules, not five extra experiments |

The arithmetic is deliberate:

- **51 records** = 18 P0 + 28 P1 + 5 P2.
- **28 P1 records** = 26 plotted series + 2 reported Bacon aggregate records.
- **252,134 native rows** = 252,040 mass-history rows + 94 dimension-history rows.
- **431 plot points** = 207 Libbrecht 2011 + 78 Libbrecht 2016 + 96 Sei–Gonda + 50
  Gonda–Komabayasi.

The 28 P1 records comprise 20 direct-observation plot series, 2 imposed-forcing series, 4
source-derived ratio series and 2 directly reported Bacon aggregate records.

A record is not the same as an independent experiment. Several records can be two axes, an imposed
forcing trace and multiple views of the same specimen or campaign.

## 1. Levitated-particle mass histories

**Source family:** Harrison et al. 2016 raw archive with Pokrifka et al. 2020 corrected conditions.

There are 16 individual particles, each held in an electrodynamic levitation chamber. The source
provides mass ratio over time rather than a sequence of crystal dimensions or photographs.

- Temperature: **−35.7 to −30.9 °C**.
- Pressure: **96.715 to 97.999 kPa**.
- Source ice supersaturation: **4% to 28.6%**.
- Initial radius: **5.8 to 12 µm**.
- Longest history: **3,610.676 s**.
- Total: **252,040 rows**.

These histories are useful for asking whether the model reproduces the shape and rate of a complete
mass-growth trajectory rather than only its endpoint. Raw time order is preserved. Twelve of the
sixteen traces contain at least one local measured mass decrease; Phase 9 must not silently smooth
or force them to be monotonic.

Important limits:

- The particles were Snomax-frozen and their habit and crystallography were not observed.
- The source states a maximum relative mass error of **5%**; it is not a probability interval.
- The 2016 archive and 2020 reanalysis are one experimental lineage, not two confirmations.
- Sixteen histories have defensible corrected-condition joins. Archive-only run `625` and a
  table-only −31.5 °C condition remain excluded rather than being guessed into a match.

## 2. Two −50 °C dimension histories

**Source family:** Pokrifka, Moyle and Harrington measurement archive, later used by Harrington and
Pokrifka.

These are two individual columnar crystals resting on a substrate and observed from two camera
views. Each row contains elapsed time, a and c dimensions, rim width, and the source's minimum and
maximum error constructions.

- Both histories are at **−50 °C** and approximately **970–972 hPa**.
- One contains **26 rows over 7,502 s**.
- The other contains **68 rows over 20,106 s**.
- The second has a source-labelled forcing change at exactly **13,800 s**; measurements bracket it
  at 13,504 and 13,804 s.

They can test dimension-versus-time behaviour and whether the model responds in the right direction
after a known change point.

The major restriction is important: the available source does not define what its `48%` and `20%`
supersaturation labels are relative to. Phase 9 may retain those labels as two categorical forcing
states, but may not convert them to solver `sigmaInfinity`, assign a supersaturation uncertainty,
or score an absolute forcing response until the first-report Methods are obtained.

## 3. Libbrecht 2011 supported-crystal histories

This family follows two individual crystals on temperature-controlled sapphire at **−15 °C and
1 bar**. It contributes:

- radius versus time;
- thickness or height versus time; and
- the imposed far-field supersaturation schedule for each crystal.

The six series contain **207 points**: 138 observed size points and 69 imposed-forcing points. They
are useful for testing path dependence: does a changing environment produce the measured change in
growth, instead of merely reaching a plausible final size?

These are two specimens from one substrate-based campaign. The substrate and asymmetric transport
must be represented or explicitly treated as a transfer limitation. Inferred surface
supersaturation and fitted curves were deliberately excluded from the direct-observation series.

## 4. Libbrecht 2016 −5 °C needle trajectories

Four series follow height and tip radius for two substrate-grown needles at **−5 °C and 1 bar**.
The source gives approximate central supersaturations of **0.92%** and **1.8%**. Together the series
contain **78 points**.

These trajectories help test whether pressure-conditioned surface kinetics are needed in addition
to ordinary vapour transport. They must be read with the recorded 2013→2016 correction: the 2016
paper rejects the earlier pressure-invariant interpretation near −5 °C, but does not retract the
earlier raw measurements.

This is not itself a multi-pressure experiment. The plotted height series also include arbitrary
source offsets of about 15 and 10 µm, which must not be mistaken for physical initial heights.

## 5. Direct basal and prism facet-growth rates

**Source:** Sei and Gonda 1989.

This is the cleanest direct test of the model's local attachment rule. It contains normal-growth
rate versus supersaturation for both basal and prism facets at:

- **−7 °C**;
- **−15 °C**; and
- **−30 °C**;

all in **40 Pa stagnant air**. The six series contain **96 digitized observation points**. Published
fit curves, asymptotes and Hertz–Knudsen limit lines were excluded.

Phase 9 can first ask whether a planar-facet calculation reproduces both measured facet-rate curves
before involving whole-crystal morphology. The main limitation is that the paper does not report a
per-series specimen count or point dispersion. The points are direct observations, but they are
digitized rather than native rows.

## 6. Controlled heat and vapour-transport interventions

**Source:** Gonda and Komabayasi 1971.

Crystals fell through a fog chamber and were photographed **40 s after seeding** at **−7 and
−15 °C**. Each series contains five condition-group points.

- Six series vary carrier-gas thermal conductivity while reported vapour diffusivity stays fixed
  at 0.77 cm²/s. They measure mean a length, mean c length and mean c/a at both temperatures.
- Four series vary reported vapour diffusivity while thermal conductivity stays fixed. They
  measure mean c length and mean c/a at both temperatures.

Together: **10 series and 50 digitized points**.

This is unusually useful because it perturbs heat transport and vapour transport separately. It
can distinguish those effects and test a low-cost latent-heat approximation. However, the two
one-factor families are not a crossed factorial experiment, so they cannot identify a heat–vapour
interaction term.

The crystals were in free fall, making ventilation part of the experimental protocol. The source
does not report sample denominators or formal statistical uncertainty. Its vertical bars are
one-quarter/three-quarter observation-order spans with an unstated denominator, not standard errors
or confidence intervals.

## 7. Initiation-state summaries

**Primary numeric source:** Bacon, Baker and Swanson 2003.

Two P1 records preserve four directly reported group aggregates, plus the source's aspect-ratio
measurement error:

- Droplet-initiated final aspect ratio: **0.6–1.5**.
- Seed-initiated final aspect ratio: **0.4–8**, with few reported in the 0.8–1.2 band.
- Reported aspect-ratio measurement error: **±0.2**.
- Frozen-droplet mass-growth factor: average **11.2 ± 4.5**, minimum **5.1**.
- Seed-initiated mass-growth factor: **greater than 100**.

The final particles were reported at approximately 100–200 µm. This supports a bounded test of
whether formation history matters.

It does not isolate a causal “seed effect.” The compared groups differed in initial size and total
mass-growth exposure, no population denominator is reported, and the meaning of `±4.5` is not
identified. Phase 9 must first reproduce those size and exposure differences before adding a
special initiation-state mechanism.

A later 93-row archive classifying 71 solid and 22 florid cases is preserved on the NAS as context.
It is a third-party digitization, not native seed/history data, and is not counted as another P1
trajectory family.

## 8. Five interpretation safeguards

P2 records do not add measurement coordinates. They prevent apparently reasonable but invalid
uses of the numerical data:

1. Preserve the unresolved `48%`/`20%` forcing semantics for the two −50 °C histories.
2. Keep fitted or inferred attachment inputs separate from independent observations.
3. Preserve the Libbrecht 2013→2016 interpretation correction without discarding raw data.
4. Enforce the 16 valid heterogeneous-history joins and the two unmatched exclusions.
5. Preserve the discrepancy between 18 printed homogeneous rows and a 17-experiment analysis;
   no row-level homogeneous target is authorized.

These records are part of the baseline because using a number correctly requires knowing what it
means, where it came from, and which other numbers are dependent on it.

## What Phase 9 could test

The Phase 9 arms are a proposed, unchartered draft. This baseline makes the following experiments
possible to design; it does not authorize Phase 9 execution.

| Proposed Phase 9 arm | Best baseline evidence | Evidence strength |
|---|---|---|
| Direct facet kinetics | 96 Sei–Gonda basal/prism rate points | Direct quantitative development test |
| Heat and vapour transport | 50 Gonda–Komabayasi intervention points | Direct one-factor development test |
| Pressure-conditioned kinetics | 78 Libbrecht needle points plus the interpretation correction | Quantitative trajectory test with lineage limits |
| Forcing and history | 252,134 native rows plus 207 Libbrecht path points | Rich quantitative development evidence |
| Ventilation | Keller–Hallett controlled-velocity contextual lead plus free-fall protocol | Qualitative gate only; no admitted numeric series |
| Initiation state | Bacon ranges/contrasts plus Sato–Kikuchi contextual categorical evidence | Bounded development evidence; causal effect unmeasured |
| Latent-heat approximation | Thermal-conductivity intervention family | Quantitative direction-and-scale probe |
| Gibbs–Thomson curvature | No matched laboratory intervention found | Numerical diagnostic only |
| Printed two-branch kinetics annex | Source-fitted Libbrecht-lineage input | In-sample input, not independent evidence |

This ordering suggests starting with direct facet rates and controlled transport interventions. They
confront a single part of the model more cleanly than whole-crystal shape does.

Keller–Hallett and Sato–Kikuchi informed the proposed experiment boundaries but are not two of the
51 successor records. Keller–Hallett remains an abstract-level ventilation lead without an admitted
numeric series. Sato–Kikuchi is qualitative contextual evidence; the two Bacon P1 records are the
selected numeric initiation-state evidence.

## What this baseline does not prove

- It is **not a validation set**. All 51 records influenced Phase 9 planning and are therefore
  development evidence. Future confirmation requires genuinely unseen evidence frozen before its
  values are inspected.
- It is **not one scoreable table**. Substrate-supported, free-fall and levitated crystals are
  different experimental systems and need separate source-to-model adapters.
- It is **not a count of independent experiments**. Shared raw data, apparatus, investigator and
  calibration lineages count once.
- It is **not a complete survey of all snow-crystal literature**. The original registered
  nine-item residual sample found one missed Bacon container. Its two useful aggregates were
  promoted, a registered replacement was reviewed, and only then did the corrected fixed sample
  reach 0/9 misses. That result applies to the sample, not the whole literature.
- It does **not supply a matched Gibbs–Thomson experiment**, a quantitative ventilation series, or
  a matched seed-versus-droplet causal effect.
- It does **not make fitted attachment inputs independent observations**.

## Where the files are

The Git repository contains the small metadata, hashes, restrictions and pointer book:

- [Final machine-readable report](../evidence/phase8b-benchmark-final-v1/report.json)
- [The 51-record successor target book](../evidence/phase8b-benchmark-final-v1/successor-target-book.jsonl)
- [Native-history metadata](../evidence/phase8b-native-histories-v1/report.json)
- [Digitized-series metadata](../evidence/phase8b-plot-digitization-v3/report.json)
- [Bacon aggregate metadata](../evidence/phase8b-bacon-seed-history-v1/report.json)
- [P2 safeguard metadata](../evidence/phase8b-p2-terminal-v1/report.json)
- [Source currency and remaining gaps](../research/phase8b-targeted-gap-and-currency.md)
- [Proposed Phase 9 consumer plan](plans/phase-9-modular-physics-arms.md)

The substantial data and source material remain on the NAS because broad redistribution rights were
not established. These are canonical share-relative locations; resolve the host mount with
`scripts/nas-root.ts`:

```text
collections/research-private-freeze/2026-08-11/payload/
collections/phase8b-search/2026-08-15/payload/acquired-sources-20260811-v1/
collections/phase8b-search/2026-08-15/payload/targeted-sources-20260812-v1/
collections/phase8b-derived/2026-08-15/payload/native-histories-20260812-v1/
collections/phase8b-derived/2026-08-15/payload/plot-extraction-20260812-v3/
collections/phase8b-derived/2026-08-15/payload/plot-renders-20260812-v1/
collections/phase8b-derived/2026-08-15/payload/plot-reads-20260812-v2/
collections/phase8b-derived/2026-08-15/payload/bacon-20260812-v1/
```

The NAS is required to reproduce or run experiments against the complete baseline. Git alone is
enough to understand its inventory, provenance, hashes and restrictions.
