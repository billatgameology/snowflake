# Existing repository coverage of the frozen Phase 8B local denominator

## Scope and classification rule

This is an offline, read-only map of the 23 records in
`evidence/phase8b-local-denominator/source-containers.jsonl`. The denominator JSONL itself, its
`source-units.jsonl`, downstream target-book summaries, and mere citations were not counted as
measurement extraction.

The labels mean:

- **D — detailed measurement inventory/extract exists:** a tracked record provides a structured,
  source-located measurement/data/figure inventory or a substantive numerical extraction. `D` does
  **not** mean the whole container has been inspected or that Phase 8B's two-pass S3 requirement is
  satisfied; the scope column says whether the existing work is targeted, all-page text, all-page
  visual, or archive-member based.
- **C — bibliographic/context only:** the repository has source-specific narrative, an implementation
  summary, or selected illustrative material, but no systematic measurement inventory/extract.
- **N — no substantive coverage:** no source-specific research content beyond an identity/citation
  was found.

The most important guardrail is that machine-extracted all-page text, a prose synthesis, or a
solver specification is not page-complete visual inspection. None of the records below can simply
be inherited as a formal S3 pass: Phase 8B still requires two independent complete classifications,
at least one of which visually inspects every PDF page, plus field-level reconciliation.

## Result

| Category | Containers | Meaning in this map |
|---|---:|---|
| D | 22 | A substantive measurement/data extraction exists, with the limitations recorded per row. |
| C | 1 | Substantive context exists, but no measurement inventory/extract was found. |
| N | 0 | No frozen local container is wholly uncited/uncovered. |

At this map's initial creation, inspection depth among the 22 `D` records was uneven: 6 PDF
containers had an explicit all-page visual claim in a dedicated source index; 2 ZIP containers had
archive/member and numeric-data coverage; 12 PDFs had reported source-wide text extraction but not
all-page visual inspection; and 2 PDFs had only targeted detailed extraction. Subsequent offline S2
reconnaissance visually inspected every page of the remaining 15 PDFs and is recorded in the four
`local-visual-*.md` records in this bundle. Combined with the six prior page-complete source indexes,
the frozen local denominator now has visual coverage for all 21 PDFs / 880 pages. This is still
triage/S2 reconnaissance, not either independently frozen formal S3 pass.

## Container-by-container map

| Frozen local container | Category | Existing repository evidence | Actual demonstrated scope; do not over-read it |
|---|---|---|---|
| `1211.5555v1.pdf` (`P8B-CONT-0F75A9EA97A42AE73A947340`) | **D** | `research/nakaya-morphology-diagram.md`; targeted convention check in `research/libbrecht-papers-extracts.md` | **Targeted detailed extract only.** The Nakaya record measures and calibrates Figure 1 on PDF p. 2, with explicit read uncertainty and limitations. The separate extract checks the supersaturation wording on p. 2. No tracked record says all 18 pages were inspected or inventories every measurement-bearing page. |
| `1910.06389v2.pdf` (`P8B-CONT-877187D621A5797051F759A6`) | **D** | `research/lab-validation-dataset.md`; `research/lab-validation-dataset.jsonl`; `research/1910.06389v2-llm.md`; targeted parameter extraction in `docs/libbrecht-parameters.md` | **Large but selective detailed extract.** The JSONL has 122 condition-annotated entries from selected monograph figures/panels, and the Markdown names remaining gaps. The LLM bundle indexes machine-extracted text for 523/523 pages and 376 figure cards, but reports only a 12-card QA sample and requires source-page verification. Targeted parameter pages/plots were also inspected. This is not a human/visual page-complete monograph inventory. |
| `1910.09067v2.pdf` (`P8B-CONT-4A57AA49C4AF96F3FB4D0A3B`) | **D** | `docs/libbrecht-parameters.md`; operator context in `docs/attachment-kinetics.md`; explicit deferred-figure note in `research/lab-validation-dataset.md` | **Source-wide text, focused numerical extraction.** `docs/libbrecht-parameters.md` records that all 17 pages were read through text extraction and extracts equations, printed measurements, and selected plot-derived parameters with provenance. It used targeted renders, not visual inspection of every page; the historical lab index explicitly says this paper's figures were deferred. |
| `1912.03230v1.pdf` (`P8B-CONT-CB6029667CA7818F7C970F29`) | **D** | `research/libbrecht-papers-extracts.md`; selected visual work in `research/libbrecht-figure-findings.md` | **Reported all-page structured text extraction (24/24), not all-page visual.** The consolidated record gives source/page-located quantities, caveats, and a plot-only inventory; it says no plotted curve was digitized. Its historical 381-item verification provenance is explicitly incomplete under current Rule 10. The visual companion says only selected figure pages were read as images. |
| `1912.09440v1.pdf` (`P8B-CONT-27884BC340AEFFBA5E13D9E4`) | **D** | `research/libbrecht-papers-extracts.md`; acquisition/context index `research/libbrecht-later-papers.md` | **Reported all-page structured text extraction (13/13), not all-page visual.** Apparatus quantities, uncertainty limits, and figure candidates are extracted/inventoried. `research/libbrecht-figure-findings.md` explicitly says this apparatus paper was not read there as images; no plot values were digitized. |
| `2004.06212v1.pdf` (`P8B-CONT-605BBE8517384DFFBBD9C473`) | **D** | `research/libbrecht-papers-extracts.md`; selected visual/context work in `research/libbrecht-figure-findings.md` | **Reported all-page structured text extraction (13/13), not all-page visual.** Measurement/model-inversion statements, caveats, and digitizable plots are inventoried with page locators; plot-only series remain undigitized and current-Rule-10 provenance remains incomplete. |
| `2009.08404v2.pdf` (`P8B-CONT-34871027C82A284B4D62AC29`) | **D** | `research/libbrecht-papers-extracts.md`; `research/libbrecht-figure-findings.md`; selected crop index `research/figures.md` | **Reported all-page structured text extraction (18/18) plus selected visual pages, not all-page visual.** Equations and prose values are extracted; the source's plot-only SDAK series is explicitly inventoried but not digitized. The companion image review covers named pages/figures only. |
| `2011.02353v1.pdf` (`P8B-CONT-70E59057A5B750DCBAF1AF71`) | **D** | `research/libbrecht-papers-extracts.md`; `research/libbrecht-figure-findings.md`; selected crop index `research/figures.md` | **Reported all-page structured text extraction (12/12) plus selected visual pages, not all-page visual.** The plot-only basal SDAK series is located and described but not digitized. |
| `2012.12916v1.pdf` (`P8B-CONT-0545457DAE00987EA3F69CEA`) | **D** | `research/libbrecht-papers-extracts.md`; contextual synthesis in `research/libbrecht-figure-findings.md` | **Reported all-page structured text extraction (14/14), not all-page visual.** The record notes that the paper is numerically thin and extracts its molecular estimates, ratios, assumptions, and caveats rather than inventing absent measurements. |
| `2106.09809v1.pdf` (`P8B-CONT-25511FD034596DAFEF0CF883`) | **D** | `research/libbrecht-papers-extracts.md`; acquisition/context index `research/libbrecht-later-papers.md` | **Reported all-page structured text extraction (19/19), not all-page visual.** Geometry, measured facet-velocity ratio, chamber/morphology statements, and limitations are extracted; the record explicitly says the paper is thin in attachment-kinetics numbers. |
| `2109.00098v1.pdf` (`P8B-CONT-40C423673EDA226443DC0337`) | **D** | `research/libbrecht-papers-extracts.md`; selected whole-page matrix crops in `research/figures.md` | **Reported all-page structured text extraction (23/23) plus selected page images, not all-page visual.** Seed/chamber geometry, matrix labels, morphology content, and limits are inventoried. The separate figure-reading record explicitly says it did not read this source as a whole. |
| `2306.04042v1.pdf` (`P8B-CONT-3953FE9A14DC13EC535C9FA7`) | **D** | `research/libbrecht-papers-extracts.md`; `research/libbrecht-figure-findings.md`; selected crop index `research/figures.md` | **Reported all-page structured text extraction (20/20) plus selected visual pages, not all-page visual.** Table 1, printed forms, figure candidates, and source limits are inventoried; plot-only material is not silently converted to numbers. |
| `2306.13087v1.pdf` (`P8B-CONT-DB5A9BC9012364401BC770F0`) | **D** | dedicated extract `research/2306.13087v1.md`; source-wide consolidation `research/libbrecht-papers-extracts.md`; visual findings `research/libbrecht-figure-findings.md`; selected crops `research/figures.md` | **Reported all-page structured text extraction (14/14) and extensive selected visual inspection, not an all-page visual pass.** The records identify the 206-panel matrix, conditions/uncertainties, closed forms, figure locators, and unperformed digitization. The 206 panels have not been converted into a complete measurement-unit inventory. |
| `GravnerGriffeath_PhysRevE09.pdf` (`P8B-CONT-545BEE96DA0D2F5D93DB1204`) | **C** | implementation/source synthesis `docs/gg-machinery.md`; one source-plate description/crop in `research/figures.md` | **Context, not a measurement inventory.** The solver spec substantively reconstructs the lattice/update machinery and cites paper sections, and the figure index describes printed p. 13 / Figures 23–31. No dedicated page-by-page source index, measurement-unit inventory, or source-wide visual audit was found. As a computational/model paper it may ultimately be out of measurement scope, but that disposition still has to be made formally rather than inherited from the implementation spec. |
| `bacon-baker-swanson-2003.pdf` (`P8B-CONT-755B3746D3762F0BD610671A`) | **D** | `research/bacon-baker-swanson-2003.md` | **Explicit all-page visual/source extraction.** The index says text and every rendered page were inspected (25/25), then supplies protocol tags, page-cited outcomes/numerical candidates, a figures/tables inventory, conflicts, and non-digitized plot status. It is still only one prior pass, not the required two-pass S3 result. |
| `bailey-hallett-2002-conference-primary.pdf` (`P8B-CONT-62B010B277455A6AEC8F0C6D`) | **D** | `research/bailey-hallett-2002.md` | **Explicit all-page visual/source extraction (10/10).** The record inventories protocol, reported outcomes, and every graph-bearing page. It also establishes that these bytes are only a conference precursor and cannot govern numeric Phase 8 targets without the 2004/2009/2012 lineage; that source gap does not erase the detailed coverage of this local container. |
| `harrington-pokrifka-2026.zip` (`P8B-CONT-21F26713EF4DDC626CDFD820`) | **D** | `research/harrington-pokrifka-2026.md` | **Detailed archive/member extraction.** The index binds all 13 regular members, parses every numeric data member, records dimensional histories/anomalies and Takahashi-derived CSV semantics, and separates data from generated arrays/code. The archive contains no article PDF, so there is no article page inspection to credit; completeness here is archive-member based and still not an independent S3 pair. |
| `harrison-2016.zip` (`P8B-CONT-31C9AE8E361BC8BD92F402E3`) | **D** | `research/harrison-2016.md` | **Detailed archive/member extraction.** The index binds all 21 regular members, says the complete archive was inspected member by member and every numeric file parsed, and records column semantics, direct observations, exclusions, and figure/data inventory. The article PDF is absent from the local container; no article-page completeness is claimed. |
| `nelson-1998-soic-author-copy.pdf` (`P8B-CONT-FEC14CA8A8AD17E37E206E0A`) | **D** | `research/nelson-1998.md` | **Explicit all-page visual/source extraction (10/10).** The index uses layout text plus a complete rendered-page contact sheet, checks data-bearing pages at full resolution, and inventories page-cited outcomes, numeric candidates, figures/tables, conflicts, and undigitized values. It remains one prior pass. |
| `pokrifka-2020.pdf` (`P8B-CONT-1034F981B47FACA23A038372`) | **D** | `research/pokrifka-2020.md`; related native-data context in `research/harrison-2016.md` | **Source-wide text and detailed measurement extraction, but not all-page visual.** All 56 accepted-manuscript pages were text-extracted; only p. 1 and pp. 37–56 (including every figure page) were visually inspected. The record supplies corrected conditions, direct-mass candidates, derived-observable semantics, figure inventory, and exclusions. Pages 2–36 therefore cannot inherit visual-inspection credit. |
| `takahashi-fukuta1988.pdf` (`P8B-CONT-502C125EDEF7CE1F1BCDA257`) | **D** | `research/takahashi-fukuta-1988.md` | **Explicit all-page visual/source extraction (15/15).** The index records page mapping, protocol tags, page-cited candidate observations, raster-only figure/table inventory, and OCR-sensitive exponent checks. Raster tables/plots are inventoried rather than numerically transcribed. It remains one prior pass. |
| `takahashi1991-corrigendum.pdf` (`P8B-CONT-CFC271AC45CC9CF11AC259DD`) | **D** | integrated correction record in `research/takahashi-1991.md` | **Explicit all-page visual/source extraction (2/2).** The index binds the corrigendum bytes, maps both pages without inventing a printed p. 252, and integrates each correction with the main article. It remains one prior pass. |
| `takahashi1991.pdf` (`P8B-CONT-71B94B2DC804DA17163284BD`) | **D** | `research/takahashi-1991.md` | **Explicit all-page visual/source extraction (16/16).** The index supplies protocol tags, page-cited observations, raster-only figures/tables, limits, and integrated corrigendum effects. Raster numeric bodies remain undigitized. It remains one prior pass. |

## Practical handoff for formal S3

1. Use the six explicit all-page visual PDF indexes and the two archive indexes as high-value prior
   annotations, but independently reclassify their pages/members; do not copy their dispositions as
   one of the two required independent passes.
2. Use the four page-complete `local-visual-*.md` S2 records as candidate-unit seeds for the 15
   formerly incomplete PDFs, but independently classify every page and semantic field rather than
   inheriting these labels as an S3 pass.
3. Resolve the newly exposed version, panel-semantics, table-denominator and native-data lineage
   discrepancies before target selection; the visual coverage closes page discovery, not those
   source questions.
4. Treat `GravnerGriffeath_PhysRevE09.pdf` as computational machinery/context rather than a
   measurement source unless formal S3 reconciliation finds a direct observation; its 47 figures
   are model or algorithm displays.
