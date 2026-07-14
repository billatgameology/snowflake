# Plan — LLM research bundle for the Snow Crystals monograph

- **Phase:** Phase 2b support — parameter and morphology evidence extraction
- **Status:** in progress
- **Started:** 2026-07-14
- **Last touched:** 2026-07-14 by Codex

## Goal

Turn the local 523-page `research/1910.06389v2.pdf` monograph into a searchable, multimodal
research bundle without replacing the canonical PDF. The bundle must let an LLM find relevant
text and figures, inspect the actual image, distinguish visual morphology from conditions stated
in captions or prose, and trace every extracted claim back to an exact PDF page.

## Done when

This supporting extraction has no charter phase gate of its own. It is done when an automated
integrity check exits 0 and reports all of the following:

- the manifest records the canonical PDF's SHA-256 and accounts for **523 of 523 PDF pages**;
- every page has searchable text with an explicit PDF-page marker;
- every detected numbered figure caption has a figure card, structured evidence record, rendered
  full-page image, and at least one associated visual crop or an explicit `no-crop` reason;
- every file reference in every figure card resolves, and every PNG decodes successfully;
- machine-extracted conditions retain their raw wording, source kind, and source location, and
  none is labeled human-verified automatically; and
- a deterministic sample of at least 12 figure cards spanning photographs, diagrams, plots, and
  multi-panel figures has been visually inspected, with **zero missing caption/image associations**
  in that sample. This is extraction QA, not a scientific milestone or physical validation.

## Approach

Use the PDF's existing text layer through PyMuPDF; do not OCR the whole book. Generate a local,
gitignored folder at `research/1910.06389v2-llm/` containing page-level Markdown, rendered evidence
pages, figure crops, Markdown figure cards, JSON evidence records, and searchable indexes. Keep a
tracked extraction script and a concise tracked source index outside that ignored folder so a fresh
clone can reproduce the local bundle after the source PDF is restored.

Treat evidence types separately:

- the image supports visual morphology observations;
- captions, labels, and nearby prose support stated growth conditions;
- the association between morphology and conditions is recorded with both source locations; and
- any machine interpretation begins unverified and preserves the author's raw wording alongside
  optional normalized values.

Render the complete page for layout context and create a tighter visual crop for multimodal use.
Do not rely on extracting embedded image objects alone: that can lose axes, labels, scale bars,
panel arrangement, and the caption-to-figure relationship.

## Steps

- [x] Inspect the PDF structure and confirm page count, text-layer quality, image prevalence, and
      canonical SHA-256.
- [ ] Add the reproducible extractor and bundle-integrity checker. Check: both expose `--help` and
      run without modifying tracked research-media policy.
- [ ] Generate `research/1910.06389v2-llm/`. Check: manifest and page index report 523 pages.
- [ ] Generate figure cards and condition-aware evidence JSON. Check: every detected numbered
      caption is represented and every asset reference resolves.
- [ ] Run automated integrity checks and a deterministic 12-card visual QA sample; repair crop or
      association failures and record any remaining limitations.
- [ ] Add a concise tracked source/index Markdown file with regeneration and query instructions,
      then update `docs/PROGRESS.md` without overwriting concurrent edits.

## Out of scope

- Replacing or deleting the canonical PDF.
- Committing the PDF, full extracted text, rendered pages, crops, or copied captions.
- Treating visual similarity as proof of temperature, supersaturation, pressure, or growth history.
- Filling `docs/libbrecht-parameters.md`; this bundle makes that later evidence extraction easier
  but does not perform or validate the scientific parameter extraction itself.
- Building embeddings or a vector database before plain text search proves insufficient.
- Human-verifying all figures or all physical claims in the monograph.

## Tried and rejected

- **Whole-book OCR.** Rejected because the PDF already contains about 1.3 million characters of
  native text. OCR would add errors, especially in equations and units, without solving context
  size or evidence linkage.
- **One giant Markdown transcription.** Rejected because it would still be roughly 300,000-plus
  tokens and would encourage tools to load too much context at once. Page files plus indexes are
  directly searchable and preserve citation boundaries.
- **Raw embedded-image extraction as the evidence artifact.** Rejected because important labels,
  captions, legends, and composite layout may be separate PDF objects. Page rendering plus a crop
  keeps the visual evidence intact.
- **Committing the generated bundle.** Rejected to remain consistent with decision 0004: the
  copyrighted source and full-content derivatives stay local; provenance and reproducible tooling
  are tracked.

## Open questions

- None blocking. Automatic crop association will be conservative: ambiguous layouts retain the
  full page and are labeled for later review rather than guessed into a false figure boundary.
