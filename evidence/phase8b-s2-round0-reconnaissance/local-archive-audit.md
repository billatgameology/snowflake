# Phase 8B offline audit of the two local ZIP source containers

Date: 2026-08-11. Scope: the two `application/zip` records in `evidence/phase8b-local-denominator/source-containers.jsonl` and their bytes under `/Volumes/snowcrystal/research-cache/content/`. This was read-only and offline. Members were streamed with `unzip -p`; nothing was persistently extracted. Temporary comparison files were confined to `/private/tmp`.

## Bottom line

- Both ZIPs are readable and byte-identical to their registered container size and SHA-256. Together they contain **34 regular archive members plus two directory entries**: 13+1 in Harrington–Pokrifka and 21+1 in Harrison.
- There are **19 locally primary, measurement-bearing numeric members**: two Penn State dimension histories in Harrington–Pokrifka and 17 one-particle mass histories in Harrison. Harrison's `heticegrowth_625.dat` is measurement-bearing but presently provenance-blocked, leaving **18 immediately usable candidates after the required lineage/condition joins**.
- Harrington–Pokrifka also contains **four secondary Takahashi digitization members**. Two small `5.3C-col` files are exact selected subsets of the two larger `TF1991-raw` files; they add no rows or witness. The two larger files contain unpaired ensemble a/c observations and inherit the Takahashi 1991 witness.
- The remaining Harrington–Pokrifka numeric arrays and code are **theory/model material**, not measurements: three source/generated shape-function inputs, two 500-row generated outputs, Fortran computation code, and a Python plotter. Neither archive contains a PDF, photograph, page image, or raster figure.
- NAS also has expanded sibling directories for both archives. All 34 regular-member hashes match the ZIP members exactly. They are storage duplicates, not extra source units or witnesses.
- Direct Phase 8 import should bind normalized rows to the **ZIP container hash and full member path/hash**, keep raw bytes on NAS, and await separate numeric-redistribution rights resolution before committing substantial source rows. The embedded Penn State terms allow local translation/value-add but are not a broad redistribution license.

## Container 1 — `harrington-pokrifka-2026.zip`

Registered ID `P8B-CONT-21F26713EF4DDC626CDFD820`; 104,949 bytes; SHA-256 `3fa016d36ae11dad221b2c9b300a5fe928ed253ac92dd8acdb2887291f32bc36`. `zip -t` passed. The archive has one directory and 13 regular members totaling 308,546 uncompressed bytes.

Archive identity is mixed. The companion archive is associated with Harrington and Pokrifka's 2026 theory paper, but the two local dimensional histories were first reported by Pokrifka, Moyle, and Harrington (2025), and four CSVs are derivative readings of Takahashi et al. (1991). The archive is therefore a container, not a single-witness measurement source.

### Exact member inventory and disposition

All paths below share `harrington-pokrifka-revisiting-theories-for-the-growth-of-single-crystalline-ice-2026/`.

| Member | Bytes / rows | Content class | Measurement/import disposition |
|---|---:|---|---|
| `README` | 2,296 / 52 lines | Documentation | Import as schema/provenance metadata; no measurement unit by itself. Defines member origins and dimension/error columns. |
| `dimensions-20231128.dat` | 1,692 / 26 numeric rows | Native primary numeric data | **Directly importable candidate.** One selected substrate-grown column at -50 C, 48% nominal supersaturation, 970 hPa; time, a, c, rim width, and source-defined min/max errors. |
| `dimensions-20240814.dat` | 4,100 / 68 numeric rows | Native primary numeric data | **Directly importable candidate.** One selected substrate-grown column at -50 C, 972 hPa; 48% nominal supersaturation stepped to 20% at 230 min; same 10-column schema. |
| `a-dimension-TF1991-raw.csv` | 985 / 44 numeric rows | Secondary digitized numeric data | Candidate only as Takahashi-1991-derived a-dimension ensemble readings at -5.3, -3.7, -8.6, and -10.6 C. Requires upstream figure/corrigendum and digitization-error audit; no new Penn State witness. |
| `c-dimension-TF1991-raw.csv` | 854 / 37 numeric rows | Secondary digitized numeric data | Same, for c dimension. a/c rows differ in times/counts and cannot be paired into per-crystal aspect ratios. |
| `a-dim-5.3C-col.csv` | 143 / 6 numeric rows | Duplicate selected subset | All six rows occur exactly in the -5.3 C column of `a-dimension-TF1991-raw.csv`; do not import as an independent unit. Preserve only as a selection/analysis view if the 2026 paper uses it. |
| `c-dim-5.3C-col.csv` | 126 / 5 numeric rows | Duplicate selected subset | All five rows occur exactly in the -5.3 C column of `c-dimension-TF1991-raw.csv`; same treatment. |
| `hfunctiondata.dat` | 507 / 10 data rows | Literature/model input | Nelson (1994) cylinder h-function data over aspect parameter 0.01–20. Not a local observation; may be imported only as model-input provenance if needed. |
| `Qfunctionsdata.dat` | 7,250 / 50 rows, 9 values/row | Computed model input | Hex-prism Q functions computed using Wood et al. (2001). No header in the file; column map comes from code/plotter. Not a measurement. |
| `hfunction-eqns-hex-jas2026.dat` | 136,500 / 500 rows, 17 values/row | Generated model output | Fortran-generated h/Q/capacitance arrays under one convention. No header; not a measurement or independent source. |
| `hfunction-eqns-hexconvQ-jas2026.dat` | 136,500 / 500 rows, 17 values/row | Generated model output | Alternative converted-Q convention. Same code lineage, different hash/values; not independent evidence. |
| `hfunctions-jas-2026.f90` | 11,935 / 394 lines | Source code | Generator for the two 500-row files. Reproducibility/model artifact, not measurement. Uses default single precision, `Pi=3.14159`, cosine factor 0.866, and a compile-time convention branch. |
| `hfunctions-jas-2026.py` | 5,658 / 110 lines | Plotting code | Loads the data/generated arrays and plots alternative conventions. Analysis/view code only; not measurement. |

Member SHA-256 values already recorded one-for-one in `evidence/phase8b-local-denominator/source-units.jsonl` agree with the streamed bytes. The expanded sibling directory `/Volumes/snowcrystal/research-cache/content/harrington-pokrifka-revisiting-theories-for-the-growth-of-single-crystalline-ice-2026/` has the same 13 names and hashes; it must not enlarge the denominator.

### Candidate measurement units and import boundaries

1. **HP-2023 dimension history** — one atomic experiment/member containing three linked observables: a(t), c(t), and rim width(t), plus min and max error fields. It has 26 rows from 0 to 7,502 s. Error fields are source-defined camera-view/total-error constructions, not SDs or confidence intervals. Import the whole member as one experiment block with three quantity series; do not manufacture a population statistic or assume monotonicity.
2. **HP-2024 stepped dimension history** — one atomic experiment/member with the same observables, 68 rows from 0 to 20,106 s. The forcing changes nominally at 13,800 s, but the adjacent samples are 13,504 and 13,804 s. Preserve the declared schedule separately from the row times; do not move the step to a measurement row. Both forcing levels are positive, so this is reduced growth forcing, not sublimation.
3. **Takahashi a-dimension digitization block** — four temperature-labeled ensemble series in the large a CSV, with nonempty counts 13, 13, 8, and 10. Import only after auditing the Takahashi PDF/corrigendum and registering extraction uncertainty. Attribute witness/campaign to Takahashi 1991.
4. **Takahashi c-dimension digitization block** — four corresponding c series, counts 12, 10, 9, and 6. Keep separate from a; these are not paired crystal observations.

The archive provides no temperature uncertainty, pressure uncertainty, or explicit supersaturation semantic for the two dimension histories. Publication-level protocol review must establish whether the percentage is far-field ice supersaturation before it becomes a frozen input. It also provides only two selected substrate-supported specimens at one nominal temperature, so it supports no replication or free-crystal population claim.

### Duplication and lineage

- The 2025 paper is the first-report measurement lineage for the two `dimensions-*` files; the 2026 paper reuses them for theory comparison. The 2026 article is not a new witness.
- The two small `5.3C-col` CSVs are strict row subsets of their large TF1991 files (6/13 a rows and 5/12 c rows at -5.3 C). Their selection may matter to an analysis, but not measurement count.
- All four CSVs are re-digitizations of Takahashi 1991, not new measurements. They must be joined to `takahashi1991.pdf` and its corrigendum and cannot increase investigator/institution/campaign witness counts.
- Shape arrays descend from Nelson/Wood theory plus Harrington–Pokrifka code. Generated arrays and code outputs cannot be counted as observations or independent calibrations.
- The expanded NAS directory is byte duplication of the ZIP, not a second archive or witness.

## Container 2 — `harrison-2016.zip`

Registered ID `P8B-CONT-31C9AE8E361BC8BD92F402E3`; 3,422,359 bytes; SHA-256 `4901759b3f5f6d71759b31286db6103d9f7d9b23512c01237067c11da3be815c`. `zip -t` passed. The archive has one directory and 21 regular members totaling 25,977,140 uncompressed bytes.

The dataset accompanies Harrison et al. (2016), *Levitation Diffusion Chamber Measurements of the Mass Growth of Small Ice Crystals from Vapor*, and contains 17 selected-particle longitudinal records. Pokrifka et al. (2020) reanalyzes the same raw data and corrects conditions/radii; it is a correction/reanalysis lineage, not a second witness.

### Documentation/metadata members

All paths below share `harrison-et-al-electrodynamic-levitation-diffusion-heteroogeneously-nucleated-ice-crystals-2016/`.

| Member | Bytes | Content/use |
|---|---:|---|
| `DataDescription` | 1,496 | Dataset title, authors, specimen/protocol narrative, and statement that levitation voltage ratio equals particle mass ratio. Import as provenance/schema support. |
| `README-Data` | 1,228 | Six-column data schema and filename semantics. Import as schema support. |
| `Conditions.txt` | 1,931 | 17-row condition table: pressure, temperature, ambient ice supersaturation and estimated error, initial radius and asymmetric error. **Measurement-bearing condition/calibration block**, but archived values must be superseded where Pokrifka 2020 supplies corrected values. |
| `ElectrodynamicLevitationDiffusion_IceCrystals2016.xml` | 8,660 | Penn State metadata, citation, abstract, use constraints, and administrative duplication. Import identity/rights/protocol fields, not as another measurement. Contains legacy authorship/name anomalies; version-of-record author list controls. |

The archive contains no article PDF, image, or code.

### Exact raw numeric member inventory

Every `.dat` member has six numeric columns and finite, positive mass ratios. Across all 17 files there are **274,502 rows**. Directly interpretable columns are elapsed time (column 3) and normalized mass `m/m0` (column 5). Columns 1–2 and 4 are instrument/control fields; column 6 is labeled `mass(*10^9)` but has no base unit in any documentation and must not be imported as a physical mass observable.

| Member | Rows | Time range, s | Adjacent repeated times | Adjacent mass-ratio decreases | Disposition |
|---|---:|---:|---:|---:|---|
| `heticegrowth_625.dat` | 22,462 | 0.002665–1361.96 | 0 | 1 | Measurement-bearing but **blocked/exclude pending provenance**: archive condition is outside the corrected heterogeneous family and radius maps to a homogeneous row. |
| `heticegrowth_712a.dat` | 7,829 | 0.00301–473.558 | 0 | 45 | Direct candidate. |
| `heticegrowth_712k.dat` | 10,445 | 0–1050 | 8,850 | 41 | Direct candidate only with registered duplicate-time coalescing; 1,595 unique timestamps. |
| `heticegrowth_716a.dat` | 11,168 | 0.0001–688.054 | 0 | 0 | Direct candidate. |
| `heticegrowth_716d.dat` | 9,846 | 0.0028–611.034 | 0 | 15 | Direct `m/m0` candidate; do not use column 6 because of unresolved radius/absolute-mass mismatch and unspecified units. |
| `heticegrowth_716k.dat` | 19,268 | 0.0028–1164.39 | 0 | 22 | Direct candidate. |
| `heticegrowth_724b.dat` | 58,301 | 0.0031–3610.68 | 0 | 11 | Direct candidate; raw duration exceeds the article's nominal 5–15 min summary, so raw time controls. |
| `heticegrowth_724c.dat` | 9,577 | 0.0026–581.391 | 0 | 3 | Direct candidate. |
| `heticegrowth_725c.dat` | 16,694 | 0.0027–1036.72 | 0 | 26 | Direct candidate. |
| `heticegrowth_725e.dat` | 15,036 | 0.00265–920.709 | 0 | 0 | Direct candidate. |
| `heticegrowth_731a.dat` | 27,700 | 0.003–1725.54 | 0 | 0 | Direct candidate. |
| `heticegrowth_731b.dat` | 19,516 | 0.00264–1224.10 | 0 | 0 | Direct candidate. |
| `heticegrowth_802d.dat` | 21,191 | 0.002–1311.37 | 0 | 32 | Direct candidate. |
| `heticegrowth_805a.dat` | 7,337 | 0.0031–449.591 | 0 | 57 | Direct candidate. |
| `heticegrowth_805b.dat` | 7,767 | 0.0027–463.613 | 0 | 25 | Direct candidate. |
| `heticegrowth_805h.dat` | 5,246 | 0.3602–323.809 | 0 | 23 | Direct candidate. |
| `heticegrowth_805l.dat` | 5,119 | 0.0026–311.332 | 0 | 10 | Direct candidate; join corrected Pokrifka-2020 initial radius 8.9 +/-0.7 micrometres, not stale archive 8.29 with asymmetric errors. |

Mass-ratio decreases are observed raw variation; do not impose monotonic regression. The only repeated-time problem is 712k. The established Phase 6 candidate lock uses median coalescing, but Phase 8 still needs to register/freeze its own operator before normalizing the full histories.

### Candidate measurement units and import boundaries

- Treat each eligible `.dat` member as **one atomic selected-particle longitudinal measurement set**: `m/m0(t)` at a constant corrected chamber condition. Sixteen files currently form the reconciled heterogeneous family. Do not treat the hundreds of thousands of rows as independent specimens.
- Conditions are inputs and uncertainty records, not growth targets. Join pressure, corrected temperature, corrected ambient ice supersaturation, and corrected initial radius by explicit filename/run ID. Do not silently use `Conditions.txt` where Pokrifka 2020 supersedes a value.
- Do not infer or import habit, dimensions, facet orientation, grain count, fitted attachment coefficient, or shape factor from the raw files. Later BEL morphology work says frozen-droplet products are likely polycrystalline; the traces cannot be called observed single-prism growth.
- Do not import the sixth column as mass. Its unit is unresolved, and direct normalized mass is already present.
- Do not fabricate the corrected Pokrifka-2020 heterogeneous condition row at -31.5 C/5%/10.69 micrometres: it has no corresponding archive member.
- A full-history normalized table is directly possible after operator freeze. A reduced common-time view at 60, 120, 180, 240, and 300 s already exists in the Phase 6 candidate lock, but that is a downstream derived view, not a replacement for the source histories.

### Duplication and lineage

- Harrison 2016 raw archive + Pokrifka 2020 corrected conditions/reanalysis are one raw-data and apparatus witness. Count neither papers nor derived fits separately.
- Multiple letters on a date are distinct particles/runs at shared chamber settings, not duplicate files. They may provide within-condition replication but share apparatus, campaign, nucleation method, and condition calibration.
- The expanded NAS directory `/Volumes/snowcrystal/research-cache/content/harrison-et-al-electrodynamic-levitation-diffusion-heteroogeneously-nucleated-ice-crystals-2016/` has exactly the same 21 member names and hashes as the ZIP. Do not register it again.
- `DataDescription`, `README-Data`, and XML repeat parts of the same schema/metadata; they are corroborating documentation, not separate measurements.

## What Phase 8 can import directly

Subject to the still-open rights decision, the technically direct native-data path is:

1. **Harrison:** normalize full `time_s,mass_ratio` histories for the 16 reconciled heterogeneous members, with container/member byte hashes and complete full-member locators. Join corrected Pokrifka-2020 conditions and carry source condition uncertainty. Preserve raw row order; coalesce 712k duplicates only under the registered operator. Keep 625 terminally excluded/pending provenance and record the unmatched corrected table row as required absence.
2. **Harrington–Pokrifka/Pokrifka 2025:** normalize both entire dimension members as `time_s,a_um,c_um,rim_width_um` with all six source error fields retained and their nonprobabilistic meanings. Store the declared 2024 step schedule separately. These two files are native longitudinal measurement data; no plot digitization is justified.
3. **Takahashi-derived CSVs:** do not direct-import as exact primary rows yet. They are useful digitization leads, but Phase 8 must bind them to Takahashi 1991 and its corrigendum, identify the upstream panels/series, and assign extraction uncertainty. If admitted, use only the two large CSVs as canonical digitized blocks and represent the small files as derived selections.
4. **Theory arrays/code:** preserve hashes, full paths, code-to-output lineage, and perhaps local reproducibility references. Do not place these in the measurement table or witness denominator. They may serve as model-input or interpretation artifacts only if Phase 9 needs those exact shape functions.
5. **Documentation:** import small identity/schema/rights metadata fields or hashes, not wholesale bodies. The XML's local-network history is administrative noise and must not become provenance of the science data.

For all normalized numeric artifacts, Phase 8's plan requires native archive values to bind both container and full-member hashes. Source bytes stay on NAS. Git may store normalized numeric bytes only after a recorded rights decision permits redistribution; otherwise store identity, schema, locator, hash, NAS-local reference, and verifier metadata.

## Audit totals

| Category | Harrington–Pokrifka | Harrison | Total |
|---|---:|---:|---:|
| Regular members | 13 | 21 | 34 |
| Directory entries | 1 | 1 | 2 |
| Native primary measurement numeric members | 2 | 17 | 19 |
| Immediately usable after required condition/lineage join | 2 | 16 | 18 |
| Secondary digitization measurement members | 4 (2 canonical + 2 subset duplicates) | 0 | 4 |
| Documentation/metadata members | 1 | 4 | 5 |
| Model input/generated numeric members | 4 | 0 | 4 |
| Code members | 2 | 0 | 2 |
| Images/PDFs | 0 | 0 | 0 |

This report is an audit/reconnaissance result, not a formal S3 independent classification or an extraction-operator freeze.
