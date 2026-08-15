# Phase 8B residual-backlog audit result

**Audited:** 2026-08-12  
**Registration:** `research/phase8b-residual-audit-registration.md`  
**Correction registration:** `research/phase8b-residual-audit-correction-registration.md`  
**Question:** Does the record contain, or credibly point to, a direct numeric measurement or
unique interpretive dependency meeting the frozen P0/P1/P2 criteria that would materially alter
the Phase 9 evidence draft?

## Verdict

The original fixed nine-record sample **fails with one benchmark miss**: the sampled
Bacon--Baker--Swanson 2003 container contains **two missed direct P1 aggregate measurement
units**. That historical result is preserved rather than relabeled.

After selection v2 promotes the Bacon container and those two units, the deterministically selected
replacement `P8B-CONT-0F75A9EA97A42AE73A947340` passes. The corrected fixed nine-record sample
therefore reports **zero misses (0/9)**. This is evidence about that registered sample only; it is
not a global literature-completeness or search-saturation claim.

## Record-level results

| Sample | Stratum | Identifier | Result and terminal disposition | Evidence locator | Rationale |
|---|---|---|---|---|---|
| original | local-container | `P8B-CONT-755B3746D3762F0BD610671A` — Bacon, Baker and Swanson 2003 | **FAIL — MISS; promote two direct P1 aggregates** | `research/bacon-baker-swanson-2003.md`, `P8X-BACON-DROPLET-ASPECT` and `P8X-BACON-SEED-ASPECT`, Table 1, PDF p. 10; `P8X-BACON-MASS-FACTOR-DROPLETS` and `P8X-BACON-MASS-FACTOR-SEEDS`, PDF p. 15 | Table 1 directly reports the initiation-conditioned aspect summaries: droplets `0.6–1.5`, seeds `0.4–8`, with few seed values in `0.8–1.2`. The prose separately reports droplet mass growth `11.2 +/- 4.5` on average, minimum `5.1`, versus seed growth factors above `100`. These are two direct aggregate measurement units that materially add the bounded M-S discriminator. |
| original and corrected | local-container | `P8B-CONT-40C423673EDA226443DC0337` — `2109.00098v1.pdf` | **PASS — NO MISS; defer as qualitative seed/apparatus context** | `evidence/phase8b-s2-round0-reconnaissance/local-visual-libbrecht-b.md`, “Libbrecht 2021 — taxonomy using c-axis needle seeds,” PDF pp. 11–14 and 19–23; `research/libbrecht-papers-extracts.md` §8C | The source supplies apparatus/seed semantics and a condition-labelled pictorial morphology matrix, but explicitly calls the images qualitative snapshots. It supplies no row-wise numeric observations, replicate counts, or uncertainty for the matrix. Its relevant seed and campaign semantics are already Phase 8A/context evidence and do not add a P0/P1/P2 benchmark that changes the Phase 9 draft. |
| original and corrected | local-container | `P8B-CONT-502C125EDEF7CE1F1BCDA257` — Takahashi and Fukuta 1988 | **PASS — NO MISS; retain as already captured, protocol-confounded context** | `research/takahashi-fukuta-1988.md`, `P8X-TF88-PROT-05` through `P8X-TF88-PROT-12`, PDF pp. 4–10; `P8X-TF88-LIM-01` through `P8X-TF88-INT-04`, PDF pp. 3–14 | Direct mass, dimension, density, habit, and fall-speed observations are already inventoried in Phase 8A. Their proposed pressure comparison is not a clean discriminator: the successor changes site, tunnel, fog production, liquid-water content, thermal stability, selection, and crystallinity, while these runs also mix ventilation, riming, graupel, polycrystals, temperature drift, and cross-sectional ensembles. No omitted clean P1 or unique P2 dependency materially changes the current Phase 9 draft. |
| original and corrected | acquired-context-exclude | `P8B-S2R0-13A1514FF5EE6F487C1F4788` — Feng et al. 2021 | **PASS — NO MISS; exclude from individual vapor-growth benchmark** | `evidence/phase8b-s2-round0-reconnaissance/modern-batch.md` §9, PDF pp. 3–15, especially Figs. 5–9; `source-register.jsonl:28` | The two aircraft cases provide natural-cloud ensemble, bulk, radar, satellite, spectrum, and habit context. They do not track individual growth, and deposition is inseparable from riming, aggregation, and melting. These data fall outside the current individual source-matched vapor-growth protocol and do not supply a unique P2 dependency for it. |
| original and corrected | acquired-context-exclude | `P8B-S2R0-02E73E6342C44351321AE5BE` — Jambon-Puillet et al. 2018 | **PASS — NO MISS; exclude primary measurements from current protocol and retain as analogue** | `evidence/phase8b-s2-round0-reconnaissance/modern-batch.md` §2, PDF pp. 2–4, Figs. 1–5; `source-register.jsonl:3` | The direct trajectories concern melt-frozen water drops attached to substrates during sublimation. The snowflake sequence is secondary and the other display is a model. The absent supplement is not needed to decide this protocol mismatch, so it is not inaccessible load-bearing evidence for the registered question. |
| original and corrected | acquired-context-exclude | `P8B-S2R0-5CB68C5C5A066C2EF110C026` — Lamb et al. 2017 | **PASS — NO MISS; exclude from individual morphology/growth benchmark and retain as physical context** | `evidence/phase8b-s2-round0-reconnaissance/modern-batch.md` §3, PDF pp. 2–5, Figs. 1–5; `source-register.jsonl:16` | The source measures chamber-population vapor-isotope evolution and derives fractionation over 28 expansions, not individual-crystal size, shape, habit, or trajectory. The absent SI prevents row-level isotope reconstruction but is not needed to answer the registered individual-growth benchmark question. |
| original and corrected | captured-clear-exclude | `https://openalex.org/W4406806038` | **PASS — NO MISS; clear secondary/administrative exclusion** | NAS `offline-title-triage-20260811-v1/focused-title-triage.jsonl:444` | Captured metadata identifies only “Comment on egusphere-2024-3859,” DOI suffix `rc1`. The explicit comment/review genre supports the clear exclusion; it is not a primary measurement report. |
| original and corrected | captured-clear-exclude | `https://openalex.org/W2093443039` | **PASS — NO MISS; clear bulk remote-sensing exclusion** | NAS `offline-title-triage-20260811-v1/focused-title-triage.jsonl:55` | The captured title explicitly concerns multimodel snow microwave emission and operational parameterization for CLPX 2003. It is a bulk remote-sensing/model study, not an individual vapor-grown-crystal measurement. |
| original and corrected | captured-clear-exclude | `https://openalex.org/W2741211956` | **PASS — NO MISS; clear unrelated-subject exclusion** | NAS `offline-title-triage-20260811-v1/citation-title-triage.jsonl:536` | The captured record is “33 IMPACT ON PRECIPITATION FROM CONVECTIVE CLOUDS,” with no DOI, no known local match, and no individual-crystal measurement indication. The metadata supports the registered clear unrelated-subject label without ambiguity. |
| corrected replacement | local-container | `P8B-CONT-0F75A9EA97A42AE73A947340` — `1211.5555v1.pdf` | **PASS — NO MISS; retain as already captured synthesis/input-lineage context** | PDF p. 2 Fig. 1; pp. 5–7 Figs. 2–3 and ref. [26] on p. 17; pp. 10–14 Figs. 4–5; `research/nakaya-morphology-diagram.md`; `docs/libbrecht-parameters.md` §3; `research/phase8b-targeted-gap-and-currency.md`, `CUR-P2-LIBBRECHT-INPUTS` | Complete inspection confirms a synthesis/model paper. Figure 1 is already Phase 8A morphology context. Figures 2–3 reproduce and derive the Libbrecht--Rickerby measurements cited as arXiv `1208.5982`, already retained by the frozen P2 attachment-input lineage. Figures 4–5 are a schematic and proposed model curves, not new direct rows. The p. 10 edge-radius/terrace-width estimate is same-author SDAK context, not a unique independent measurement. Nothing newly exposed materially changes the Phase 9 draft. |

## Fixed-input and replacement checks

- All six fixed-input hashes in the original registration were re-computed and matched.
- The four local source PDFs and three acquired PDFs above were re-hashed and matched their
  registered byte identities.
- The replacement selection digest was independently re-computed as
  `1e4869f7f10ae23b059499e57dfb243eeaa300d0aefdd16d7db576e615b60d81`.
- The replacement PDF matched SHA-256
  `56a1fe58167674455d776d63c04ddde5203c3776c168f44fd092b7cedf0b6d49`, 830,702 bytes and
  18 pages. All 18 pages, all five figure captions, and the complete reference list were read.

## Review provenance and limits

- **Reviewer:** OpenAI Codex (GPT-5), residual-audit subagent. It shared the Phase 8B root-task
  context with the implementing agent but did not author benchmark selection v1 or either audit
  registration. It did author this result after the frozen replacement was disclosed.
- **Independently re-executed:** all registration hashes; the deterministic local-container
  digests; all seven available PDF hashes; exact captured-title rows; the complete tracked
  page-by-page source/reconnaissance records for the original local and acquired samples; and a
  direct page-complete reading of the 18-page replacement PDF.
- **Not checked:** this audit did not re-run the global discovery search, independently establish
  global source currency, acquire Jambon-Puillet supplementary movies or the Lamb SI, or assert
  that the remaining residual backlog is measurement-free. Those omissions do not prevent the
  registered sampled dispositions because neither absent supplement is load-bearing to its
  protocol exclusion. This audit also did not verify downstream plot-digitization bytes, corpus
  assembly, or Phase 9 implementation.
