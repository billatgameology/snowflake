# Harrington and Pokrifka 2026 - Phase 8 source-extraction index

**Status:** S0 archive and official-record extraction complete 2026-08-10. This is a source
index, not a validation verdict. The supplied family contains data, generated shape-function
arrays, and model code, but no article PDF or page images. Every numeric data member was parsed;
no source figure, table body, or code body is reproduced here.

## 1. Current article identity, stale archive identity, and page map

<a id="P8X-HP26-ID-01"></a>
- **Current version of record:** Jerry Y. Harrington and Gwenore F. Pokrifka, *Revisiting Theories
  for the Growth of Solid and Hollow Single Crystals: The Importance of Step-Source Location*,
  *Journal of the Atmospheric Sciences* 83(7), 1175-1190, 2026. DOI
  [`10.1175/JAS-D-26-0016.1`](https://doi.org/10.1175/JAS-D-26-0016.1). The official record
  gives receipt 2026-01-19, final-form receipt 2026-05-05, acceptance 2026-05-21, and publication
  in the July 2026 issue.

<a id="P8X-HP26-ID-02"></a>
- **Stale companion metadata:** the
  [Penn State Data Commons record](https://www.datacommons.psu.edu/commonswizard/MetadataDisplay.aspx?Dataset=6511),
  DOI [`10.26208/XJQK-R076`](https://doi.org/10.26208/XJQK-R076), still describes a 2025
  submitted manuscript with the shorter title *Revisiting theories for the growth of single-
  crystalline ice*. That record identifies the archive but no longer controls article title,
  status, year, or version.

<a id="P8X-HP26-ID-03"></a>
- **Observational origin:** the two Penn State dimensional histories were first reported in Gwenore
  F. Pokrifka, Alfred M. Moyle, and Jerry Y. Harrington, *Columnar Ice Dimensional Growth Rates at
  Temperatures below -40 C: Measurements in a Novel Thermal Gradient Diffusion Chamber*, *JAS*
  82(10), 2255-2273, 2025. DOI
  [`10.1175/JAS-D-25-0030.1`](https://doi.org/10.1175/JAS-D-25-0030.1). The 2026 paper uses
  those observations for a theory/step-source comparison; it is not their first measurement report.

<a id="P8X-HP26-ID-04"></a>
- **Audited local archive:**
  `/Volumes/snowcrystal/research-cache/content/harrington-pokrifka-2026.zip`, 104,949 bytes,
  SHA-256 `3fa016d36ae11dad221b2c9b300a5fe928ed253ac92dd8acdb2887291f32bc36`.
  It has one root directory and 13 regular members totaling 308,546 uncompressed bytes.

<a id="P8X-HP26-ID-05"></a>
- **Extraction identity:** the supplied directory
  `/Volumes/snowcrystal/research-cache/content/harrington-pokrifka-revisiting-theories-for-the-growth-of-single-crystalline-ice-2026`
  contains the same 13 member names and no extras. Per-member SHA-256 comparison against the ZIP
  found every extracted member byte-identical.

<a id="P8X-HP26-ID-06"></a>
- **Page map:** no article PDF occurs in the archive or extracted directory. The version of record
  spans printed pp. 1175-1190, but no printed-page-to-PDF-page equation is available and no final
  article figure was visually audited. Article-level statements below are limited to the official
  record/abstract; data values cite exact archive members.

### Complete member inventory

<a id="P8X-HP26-ID-07"></a>

```text
member                                         bytes  sha256
Qfunctionsdata.dat                              7250  58217c962b3db427ff775d82ce1b63094f4e1f510235a3ca5860a66af02b8ee1
README                                          2296  ede97faf193a2adebb41e134bd9625a674c50914c2f6b2a26caf47aa8f5fa84a
a-dim-5.3C-col.csv                               143  1d45c34194b94aade2cc20f79e087846a66beba7be435e40dc8636b9f0069ba3
a-dimension-TF1991-raw.csv                       985  38ac124aa7485d0e1ad4d7fdb64cc420b34388e11c315f35d66c9d7a23e5d871
c-dim-5.3C-col.csv                               126  07cdf2e6fee89b533cdec83bd2c4a427db4b7796cc33eeb9afaaecc7c5f764f3
c-dimension-TF1991-raw.csv                       854  29efbc2d0e3cd1aaeace37361fc3d8723e5351446744d1c4a0a5ba1486fdb262
dimensions-20231128.dat                         1692  c4b8d3d5c674898b8e5bfa761e95933b251d59daa833dbd5fb27483238c57c48
dimensions-20240814.dat                         4100  8aff69945a47d383b708942bb0441768ddf2822f812495fea69e51aebf3f25e8
hfunction-eqns-hex-jas2026.dat                136500  3d321c12d9440b72a8a447e7d319f7524daca49d7b1f12695d3c8293d8a1e8b8
hfunction-eqns-hexconvQ-jas2026.dat           136500  4b72c97dbdbae48db1825832ddc7bb83afc1ec00f7a39c0c0c420e391d1d9431
hfunctiondata.dat                                507  bd7911622fc29cb10e2822def01e9690dcc4fead819fda137b732388fda9a043
hfunctions-jas-2026.f90                        11935  65d954a740cc448178a4478ff811d0c789b2c84cc17515db7872c8fd7cb57158
hfunctions-jas-2026.py                          5658  b0326246a4bcdd49d8430d520389546726b476b9e19684345026d9a4a0a6476d
```

## 2. Currency, lineage, and rights

<a id="P8X-HP26-CUR-01"></a>
- The final 2026 article supersedes the archive's submitted-paper bibliographic fields, but it does
  not supersede the archive bytes or the 2025 observational provenance. Cite the 2025 paper for
  measurement protocol and the 2026 paper for the later theory comparison.

<a id="P8X-HP26-CUR-02"></a>
- The four `TF1991`/`5.3C` CSVs derive from Takahashi et al. 1991, DOI
  [`10.2151/jmsj1965.69.1_15`](https://doi.org/10.2151/jmsj1965.69.1_15). They inherit that
  source's laboratory witness and cannot create a Penn State replication.

<a id="P8X-HP26-CUR-03"></a>
- This archive is not a 2016-to-2020 BEL successor dataset: it contains substrate-grown dimensional
  records and imported Takahashi digitizations, not levitated mass-ratio traces. The 2026 theory
  paper therefore extends the scientific lineage without recalibrating Harrison/Pokrifka `m/m0`.

<a id="P8X-HP26-CUR-04"></a>
- Official AMS and Penn State records searched through 2026-08-10 exposed no corrigendum or
  replacement of DOI `10.1175/JAS-D-26-0016.1`. This is scoped to the recorded publisher and
  author-lineage search.

<a id="P8X-HP26-RIGHTS-01"></a>
- The version of record is American Meteorological Society copyright under its standard reuse
  workflow. The Data Commons metadata has no access restriction, but its use constraint grants a
  narrow translation/value-add permission for use on the user's computer hardware and requests
  annual notification. It is not a broad code/data redistribution license. Do not commit the ZIP,
  arrays, source code, figures, or substantial data bodies without a separate rights determination.

## 3. Brief exact source fragments

<a id="P8X-HP26-Q-01"></a>
- “Raw data extracted from Takhashi (1991)” - archive `README`, including the source's misspelling
  of Takahashi.

<a id="P8X-HP26-Q-02"></a>
- “growth is very sensitive to hollowing once the rim width becomes relatively narrow” - final
  2026 article abstract, printed p. 1175.

## 4. Penn State observational protocol tags

<a id="P8X-HP26-PROT-01"></a>
- **Seed/specimen:** each `dimensions-*` member is a longitudinal record of one columnar ice crystal.
  The archive does not supply a population count, selection probability, seed crystallography
  uncertainty, or replication series. Treat each file as a selected specimen (`README`;
  `dimensions-20231128.dat`; `dimensions-20240814.dat`).

<a id="P8X-HP26-PROT-02"></a>
- **Transport/geometry:** growth occurred in the novel thermal-gradient diffusion chamber on a
  substrate, observed by two camera views. Substrate support and asymmetric transport are
  load-bearing protocol tags; this is neither free fall nor electrodynamic levitation (`README`;
  2025 observational paper identity).

<a id="P8X-HP26-PROT-03"></a>
- **Temperature:** both records are labeled -50 C. No temperature uncertainty is given in the
  archive `README`; do not infer one from the dimensional error columns.

<a id="P8X-HP26-PROT-04"></a>
- **Supersaturation semantics:** the archive labels a chamber supersaturation percentage but does
  not explicitly say ice-relative, water-relative, far-field, witness-surface, or surface value.
  The publication lineage strongly suggests ambient ice supersaturation, but S1 must verify that
  semantic in the 2025/2026 article before freezing an input (`README`).

<a id="P8X-HP26-PROT-05"></a>
- **Pressure:** the 2023-11-28 record is labeled 970 hPa and the 2024-08-14 record 972 hPa. No
  pressure uncertainty is stated (`README`).

<a id="P8X-HP26-PROT-06"></a>
- **2023 history:** `dimensions-20231128.dat` is labeled constant 48% supersaturation at -50 C and
  970 hPa. It has 26 numeric observations from 0 to 7502 s, with adjacent sampling intervals of
  300 or 301 s (`README`; complete member scan).

<a id="P8X-HP26-PROT-07"></a>
- **2024 history:** `dimensions-20240814.dat` is labeled 48% initially, stepped to 20% at 230 min
  = 13,800 s, at -50 C and 972 hPa. Both levels are positive: this is reduced growth forcing, not
  an evaporation or sublimation step. The file has 68 observations from 0 to 20,106 s, separated
  by 300 or 301 s (`README`; complete member scan).

<a id="P8X-HP26-PROT-08"></a>
- **Step alignment:** no 2024 row occurs exactly at 13,800 s. The adjacent observations are at
  13,504 and 13,804 s; a step-response operator must specify interval assignment rather than
  silently moving the forcing boundary (`dimensions-20240814.dat`).

<a id="P8X-HP26-PROT-09"></a>
- **Measured columns:** each dimensional row reports time; `a` dimension averaged over two camera
  views; minimum `a` error from the inter-view difference; maximum/total `a` error including
  per-camera error; corresponding `c` dimension fields; rim/ring width averaged across views; and
  analogous rim errors (`README`).

<a id="P8X-HP26-PROT-10"></a>
- **Uncertainty semantics:** minimum and maximum error columns are source-defined measurement-error
  constructions, not standard deviations or confidence intervals. The archive gives no temporal,
  cross-axis, or cross-view covariance. Phase 8 must preserve min/max provenance rather than
  collapsing them into a probabilistic interval (`README`).

## 5. Direct dimensional observations

Values below are direct numeric rows. The displayed uncertainty is the archive's maximum/total
error, not a confidence interval.

<a id="P8X-HP26-OBS-2023-START"></a>
- At 0 s in `dimensions-20231128.dat`: `a=11.14 +/- 1.85` micrometres,
  `c=34.91 +/- 2.56` micrometres, and rim width `6.75 +/- 0.73` micrometres.

<a id="P8X-HP26-OBS-2023-END"></a>
- At 7502 s in `dimensions-20231128.dat`: `a=37.64 +/- 2.23` micrometres,
  `c=221.01 +/- 17.33` micrometres, and rim width `6.71 +/- 0.90` micrometres.

<a id="P8X-HP26-OBS-2024-START"></a>
- At 0 s in `dimensions-20240814.dat`: `a=14.13 +/- 1.00` micrometres,
  `c=19.31 +/- 1.70` micrometres, and rim width `5.53 +/- 0.89` micrometres.

<a id="P8X-HP26-OBS-2024-PRESTEP"></a>
- At 13,504 s, before the nominal 13,800 s switch, `dimensions-20240814.dat` reports
  `a=51.50 +/- 1.53`, `c=174.54 +/- 10.01`, and rim width `6.37 +/- 1.49` micrometres.

<a id="P8X-HP26-OBS-2024-POSTSTEP1"></a>
- At 13,804 s, the first row after the nominal switch, `dimensions-20240814.dat` reports
  `a=51.70 +/- 1.45`, `c=176.07 +/- 9.97`, and rim width `7.87 +/- 1.64` micrometres.

<a id="P8X-HP26-OBS-2024-POSTSTEP2"></a>
- At 14,104 s, `dimensions-20240814.dat` reports `a=51.33 +/- 1.84`,
  `c=176.97 +/- 10.64`, and rim width `13.81 +/- 2.61` micrometres.

<a id="P8X-HP26-OBS-2024-END"></a>
- At 20,106 s in `dimensions-20240814.dat`: `a=54.71 +/- 2.69` micrometres,
  `c=194.95 +/- 5.27` micrometres, and rim width `31.65 +/- 1.88` micrometres.

## 6. Measured nonmonotonicity and anomalies

<a id="P8X-HP26-LIM-01"></a>
- A complete adjacent-difference scan of `dimensions-20231128.dat` found three decreases in `a`,
  largest -0.69 micrometres; no decrease in `c`; and three small rim-width decreases within the
  observed 6.71-6.75 micrometre range. These are measured-series facts, not a physical monotonicity
  claim.

<a id="P8X-HP26-LIM-02"></a>
- The corresponding scan of `dimensions-20240814.dat` found 16 decreases in `a`, largest -2.29
  micrometres; ten decreases in `c`, largest -1.56 micrometres; and 29 rim-width decreases. A
  target transform must not impose monotonicity.

<a id="P8X-HP26-LIM-03"></a>
- The largest adjacent 2024 rim-width drop is -7.33 micrometres, from 13.12 to 5.79 between 10,503
  and 10,803 s (`dimensions-20240814.dat`). Several jumps also exceed the overlap of adjacent
  maximum-error intervals. Rim-width extraction needs a registered robust operator and may need an
  observational-state ambiguity flag.

<a id="P8X-HP26-LIM-04"></a>
- The archive supplies only two Penn State longitudinal specimens, at one nominal temperature and
  substrate protocol. Endpoints or step response cannot be generalized into a population statistic
  or substrate-free law.

<a id="P8X-HP26-LIM-05"></a>
- A raw aspect ratio would combine uncertain, covarying `a` and `c` from the same camera system. The
  archive provides no covariance operator, so this index does not invent an aspect-ratio
  uncertainty or promote endpoint ratios into targets.

## 7. Takahashi-derived CSV semantics

<a id="P8X-HP26-TF-01"></a>
- `a-dimension-TF1991-raw.csv` contains 44 numeric rows. Nonempty counts at -5.3, -3.7, -8.6,
  and -10.6 C are 13, 13, 8, and 10, with time spanning 1.9882-30.536 min (complete member
  scan; source attribution in `README`).

<a id="P8X-HP26-TF-02"></a>
- `c-dimension-TF1991-raw.csv` contains 37 numeric rows. Corresponding nonempty counts are 12, 10,
  9, and 6, with time spanning 1.9338-29.624 min (complete member scan; source attribution in
  `README`).

<a id="P8X-HP26-TF-03"></a>
- `a-dim-5.3C-col.csv` contains six selected `a` points from 3.018 to 7.1022 min;
  `c-dim-5.3C-col.csv` contains five selected `c` points from 2.9849 to 7.0939 min (complete
  member scan).

<a id="P8X-HP26-TF-04"></a>
- The `a` and `c` CSV observations are unpaired ensemble points with different time coordinates and
  counts. They cannot form per-crystal aspect ratios or a synthetic two-axis trajectory.

<a id="P8X-HP26-TF-05"></a>
- These CSVs are derivative digitizations of Takahashi et al. 1991. The archive supplies no panel
  calibration, reader identity, repeated reads, or digitization uncertainty. Any Phase 8 use must
  assign the witness to Takahashi 1991, audit the upstream figure/corrigendum, and register read
  uncertainty; the CSVs create no new witness.

## 8. Shape-function arrays and code are model inputs

<a id="P8X-HP26-INPUT-01"></a>
- `hfunctiondata.dat` contains ten source records over shape parameter 0.01-0.20 with seven columns,
  described by `README` as Nelson 1994 cylindrical shape-function data. It is literature/model
  input, not a measurement from either Penn State crystal.

<a id="P8X-HP26-INPUT-02"></a>
- `Qfunctionsdata.dat` contains 50 records over shape parameter 0.01-1.00 with nine columns,
  described as computed using the Wood 2001 method. It is generated input, not an observational
  witness.

<a id="P8X-HP26-INPUT-03"></a>
- `hfunctions-jas-2026.f90` computes cylindrical and hexagonal functions over 0.01-1.00 with
  `np=500`, default single precision, hardcoded `Pi=3.14159`, hardcoded cosine factor 0.866, and a
  compile-time `iwd` branch. These numerical choices belong to reproducibility/provenance, not the
  target side of a comparison.

<a id="P8X-HP26-INPUT-04"></a>
- `hfunction-eqns-hex-jas2026.dat` and `hfunction-eqns-hexconvQ-jas2026.dat` each contain 500 rows
  by 17 unheaded numeric values and have different hashes despite equal byte counts. Column meaning
  is supplied by the Fortran code, so neither file should be interpreted by position without that
  code-level map.

<a id="P8X-HP26-INPUT-05"></a>
- `hfunctions-jas-2026.py` plots one selected convention by default. Plotting behavior and theory
  selection are implementation choices, not direct observations. This index records their existence
  without copying or evaluating the code body.

## 9. Visual/digitization inventory

<a id="P8X-HP26-DIG-01"></a>
- The supplied source family contains no PDF, page image, photograph, or raster figure. No final-
  article plot axes or visual point values were audited. A later figure extraction requires the
  version-of-record PDF, a page map, panel/axis inventory, and registered read uncertainty.

<a id="P8X-HP26-DIG-02"></a>
- The Takahashi CSVs are already derivative figure readings, but lack their own read-error record.
  They remain digitizable provenance leads, not exact tabular measurements and not permission to
  bypass the upstream source.

<a id="P8X-HP26-DIG-03"></a>
- The two `dimensions-*` files are machine-readable source data. Do not digitize a later plot of
  these histories where the archive row is available; retain the row's min/max error semantics.

## 10. Theory interpretation versus observation

<a id="P8X-HP26-INT-01"></a>
- The 2026 paper compares dislocation and corner step sources, surface location, and hollowing. Its
  warm free-fall, near-isometric, and cold substrate preferences are model-selection conclusions,
  not directly observed step-source locations (official abstract, printed p. 1175).

<a id="P8X-HP26-INT-02"></a>
- Hollowing sensitivity may motivate a rim-width target, but the source's theory fit, preferred
  step-source mechanism, and shape functions belong on the model-input/interpretation side. The
  observed fields are only time, dimensions, rim width, and their source-defined errors.

## 11. Provisional Phase 8 implications - project interpretation

<a id="P8X-HP26-P8-01"></a>
- **Witness/robustness:** the two Penn State substrate histories are provisional Class-B target
  candidates from a selected-specimen, substrate-supported, asymmetric-transport protocol at -50 C.
  They are separate from the Harrison/Pokrifka BEL witness and currently outside the solver's usual
  validated temperature/geometry domain.

<a id="P8X-HP26-P8-02"></a>
- **Inputs versus targets:** verified temperature/supersaturation semantics, pressure, substrate,
  seed/history, and the 48-to-20% schedule are inputs. Direct `a(t)`, `c(t)`, and rim-width histories
  with source min/max errors are candidate targets. Step-source location, hollowing mechanism,
  shape functions, and code outputs are inputs or interpretations.

<a id="P8X-HP26-P8-03"></a>
- **Positive step:** because both supersaturation levels are positive, this record can test response
  to reduced positive forcing but cannot test sublimation, reversibility, or a growth-to-evaporation
  transition.

<a id="P8X-HP26-P8-04"></a>
- **Operator dependency:** step alignment, error-field selection, nonmonotone-series treatment,
  dimensional interpolation, and any aspect or rim-growth derivative require S5 registration before
  extraction or scoring.

<a id="P8X-HP26-P8-05"></a>
- **No duplicate witness:** Takahashi CSVs retain the Takahashi-1991 witness identity; shape arrays
  and code carry no witness count. This family alone supplies neither a Class-A replicated target nor
  an internal Class-C conflict.

<a id="P8X-HP26-P8-06"></a>
- This extraction records source facts and candidates only. It does not freeze a target, resolve the
  supersaturation semantic, assign a held-out split, score a solver, or grant a validation claim.
