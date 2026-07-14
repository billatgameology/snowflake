#!/usr/bin/env python3
"""Build a searchable, multimodal evidence bundle from the Snow Crystals PDF."""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import shutil
import sys
import tempfile
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterable

import fitz


GENERATOR_ID = "snowflake-pdf-llm-bundle-v1"
CAPTION_ID_RE = re.compile(r"^Figure\s+(\d+\.\d+[A-Za-z]?)\b", re.IGNORECASE)
CAPTION_LINE_RE = re.compile(r"^\s*Figure\s+(\d+\.\d+[A-Za-z]?)\b", re.IGNORECASE)
BODY_FONT = "CIDFont+F1"

TEMPERATURE_RE = re.compile(
    r"(?i)(?:(?:near|around|about|approximately|roughly|at|below|above|from|to)\s+)?"
    r"[−–-]?\s*\d+(?:\.\d+)?\s*(?:°\s*)?[CF]\b"
)
PRESSURE_RE = re.compile(
    r"(?i)\b\d+(?:\.\d+)?\s*(?:Pa|kPa|MPa|bar|mbar|atm|atmospheres?|Torr)\b"
)
DURATION_RE = re.compile(
    r"(?i)\b\d+(?:\.\d+)?\s*(?:milliseconds?|seconds?|minutes?|hours?|days?)\b"
)
PERCENT_RE = re.compile(r"(?i)\b\d+(?:\.\d+)?\s*(?:percent|%)")
QUALITATIVE_RE = re.compile(
    r"(?i)\b(?:colder|warmer|higher|lower|high|low|increasing|decreasing)\s+"
    r"(?:temperature|supersaturation|humidity|pressure|location|conditions?)\b"
)
MORPHOLOGY_TERMS = (
    "plate",
    "column",
    "dendrite",
    "needle",
    "prism",
    "rosette",
    "hollow",
    "stellar",
    "sectored",
    "branch",
    "flake",
    "crystal",
    "ridge",
    "groove",
    "facet",
)


@dataclass(frozen=True)
class Caption:
    figure_id: str
    page_number: int
    block_index: int
    bbox: tuple[float, float, float, float]
    raw_text: str
    text: str


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Generate page text, rendered evidence pages, figure crops, and condition-aware "
            "figure cards from a text-layer PDF."
        )
    )
    parser.add_argument("source_pdf", type=Path, help="Canonical source PDF")
    parser.add_argument("output_dir", type=Path, help="Generated bundle directory")
    parser.add_argument(
        "--page-dpi",
        type=int,
        default=144,
        help="DPI for complete evidence-page renders (default: 144)",
    )
    parser.add_argument(
        "--crop-dpi",
        type=int,
        default=216,
        help="DPI for figure and figure-plus-caption crops (default: 216)",
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Replace an existing bundle only when it carries this generator's marker",
    )
    return parser.parse_args()


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def collapse_whitespace(text: str) -> str:
    return re.sub(r"\s+", " ", text.replace("\u00a0", " ")).strip()


def line_text(line: dict[str, Any]) -> str:
    return "".join(span.get("text", "") for span in line.get("spans", []))


def block_raw_text(block: dict[str, Any]) -> str:
    return "\n".join(line_text(line).rstrip() for line in block.get("lines", [])).strip()


def first_nonempty_font(block: dict[str, Any]) -> str | None:
    for line in block.get("lines", []):
        for span in line.get("spans", []):
            if span.get("text", "").strip():
                return str(span.get("font", ""))
    return None


def bbox_union(boxes: Iterable[Iterable[float]]) -> tuple[float, float, float, float]:
    items = [tuple(float(value) for value in box) for box in boxes]
    if not items:
        raise ValueError("cannot union an empty set of boxes")
    return (
        min(box[0] for box in items),
        min(box[1] for box in items),
        max(box[2] for box in items),
        max(box[3] for box in items),
    )


def detect_captions(page: fitz.Page, page_number: int) -> list[Caption]:
    captions: list[Caption] = []
    page_dict = page.get_text("dict", sort=True)
    for block_index, block in enumerate(page_dict["blocks"]):
        if block.get("type") != 0:
            continue
        raw = block_raw_text(block)
        normalized = collapse_whitespace(raw)
        first_match = CAPTION_ID_RE.match(normalized)
        if not first_match or first_nonempty_font(block) == BODY_FONT:
            continue

        lines = block.get("lines", [])
        starts: list[tuple[int, str]] = [(0, first_match.group(1))]
        first_line_x = float(lines[0]["bbox"][0]) if lines else float(block["bbox"][0])
        for line_index, line in enumerate(lines[1:], start=1):
            match = CAPTION_LINE_RE.match(line_text(line))
            # A second caption can share one PDF text block when two figures sit in
            # separate columns. Wrapped caption prose can also begin with a figure
            # reference, so only split when the new line starts in another column.
            if match and abs(float(line["bbox"][0]) - first_line_x) >= page.rect.width * 0.25:
                starts.append((line_index, match.group(1)))

        for position, (start_index, figure_id) in enumerate(starts):
            end_index = starts[position + 1][0] if position + 1 < len(starts) else len(lines)
            segment = lines[start_index:end_index]
            segment_raw = "\n".join(line_text(line).rstrip() for line in segment).strip()
            segment_text = collapse_whitespace(segment_raw)
            segment_id = CAPTION_ID_RE.match(segment_text)
            if not segment_id:
                continue
            captions.append(
                Caption(
                    figure_id=segment_id.group(1),
                    page_number=page_number,
                    block_index=block_index,
                    bbox=bbox_union(line["bbox"] for line in segment),
                    raw_text=segment_raw,
                    text=segment_text,
                )
            )
    return captions


def printed_page_number(page: fitz.Page) -> int | None:
    threshold = page.rect.height * 0.86
    candidates: list[tuple[float, int]] = []
    for block in page.get_text("dict", sort=True)["blocks"]:
        if block.get("type") != 0 or block["bbox"][1] < threshold:
            continue
        text = collapse_whitespace(block_raw_text(block))
        if re.fullmatch(r"\d{1,4}", text):
            candidates.append((float(block["bbox"][1]), int(text)))
    return max(candidates)[1] if candidates else None


def markdown_page(page: fitz.Page, page_number: int, printed_page: int | None) -> str:
    header = ["---", f"pdf_page: {page_number}"]
    header.append(f"printed_page: {printed_page}" if printed_page is not None else "printed_page: null")
    header.extend(["---", "", f"# PDF page {page_number}", ""])

    blocks: list[str] = []
    text_index = 0
    for block in page.get_text("dict", sort=True)["blocks"]:
        if block.get("type") != 0:
            continue
        raw = block_raw_text(block)
        if not raw:
            continue
        text_index += 1
        bbox = ", ".join(f"{float(value):.1f}" for value in block["bbox"])
        blocks.extend([f"## Text block {text_index}", "", f"<!-- bbox: {bbox} -->", "", raw, ""])
    return "\n".join(header + blocks).rstrip() + "\n"


def horizontal_overlap_ratio(a: Iterable[float], b: Iterable[float]) -> float:
    aa = tuple(a)
    bb = tuple(b)
    overlap = max(0.0, min(aa[2], bb[2]) - max(aa[0], bb[0]))
    denominator = max(1.0, min(aa[2] - aa[0], bb[2] - bb[0]))
    return overlap / denominator


def vertical_overlap_ratio(a: Iterable[float], b: Iterable[float]) -> float:
    aa = tuple(a)
    bb = tuple(b)
    overlap = max(0.0, min(aa[3], bb[3]) - max(aa[1], bb[1]))
    denominator = max(1.0, min(aa[3] - aa[1], bb[3] - bb[1]))
    return overlap / denominator


def expand_and_clip(box: Iterable[float], page_rect: fitz.Rect, padding: float) -> fitz.Rect:
    values = tuple(float(value) for value in box)
    return fitz.Rect(
        max(page_rect.x0, values[0] - padding),
        max(page_rect.y0, values[1] - padding),
        min(page_rect.x1, values[2] + padding),
        min(page_rect.y1, values[3] + padding),
    )


def crop_boxes(
    page: fitz.Page,
    caption: Caption,
    page_captions: list[Caption],
) -> tuple[fitz.Rect, fitz.Rect, str]:
    cap = fitz.Rect(caption.bbox)
    page_rect = page.rect
    page_dict = page.get_text("dict", sort=True)
    image_boxes = [fitz.Rect(block["bbox"]) for block in page_dict["blocks"] if block.get("type") == 1]

    previous_bottom = page_rect.y0 + 28.0
    next_top = page_rect.y1 - 28.0
    for other in page_captions:
        if other.figure_id == caption.figure_id and other.bbox == caption.bbox:
            continue
        other_box = fitz.Rect(other.bbox)
        if horizontal_overlap_ratio(cap, other_box) < 0.25:
            continue
        if other_box.y1 <= cap.y0:
            previous_bottom = max(previous_bottom, other_box.y1 + 3.0)
        elif other_box.y0 >= cap.y1:
            next_top = min(next_top, other_box.y0 - 3.0)

    above = [
        box
        for box in image_boxes
        if horizontal_overlap_ratio(cap, box) >= 0.25
        and box.y1 <= cap.y0 + 4.0
        and box.y0 >= previous_bottom - 8.0
        and box.width * box.height >= 400.0
    ]
    below = [
        box
        for box in image_boxes
        if horizontal_overlap_ratio(cap, box) >= 0.25
        and box.y0 >= cap.y1 - 4.0
        and box.y1 <= next_top + 8.0
        and box.width * box.height >= 400.0
    ]
    beside = [
        box
        for box in image_boxes
        if vertical_overlap_ratio(cap, box) >= 0.35
        and min(abs(box.x1 - cap.x0), abs(cap.x1 - box.x0)) <= page_rect.width * 0.18
        and box.width * box.height >= 400.0
    ]

    if above:
        visual = expand_and_clip(bbox_union(box for box in above), page_rect, 4.0)
        method = "associated-image-blocks-above-caption"
    elif below:
        visual = expand_and_clip(bbox_union(box for box in below), page_rect, 4.0)
        method = "associated-image-blocks-below-caption"
    elif beside:
        visual = expand_and_clip(bbox_union(box for box in beside), page_rect, 4.0)
        method = "associated-image-blocks-beside-caption"
    else:
        column_left = max(page_rect.x0 + 28.0, cap.x0 - 5.0)
        column_right = min(page_rect.x1 - 28.0, cap.x1 + 5.0)
        if cap.width > page_rect.width * 0.58:
            column_left = page_rect.x0 + 28.0
            column_right = page_rect.x1 - 28.0
        height_above = cap.y0 - previous_bottom
        height_below = next_top - cap.y1
        if height_above >= 48.0 or height_above >= height_below:
            visual = fitz.Rect(column_left, previous_bottom, column_right, max(previous_bottom + 1.0, cap.y0 - 3.0))
            method = "conservative-region-above-caption"
        else:
            visual = fitz.Rect(column_left, min(next_top - 1.0, cap.y1 + 3.0), column_right, next_top)
            method = "conservative-region-below-caption"

    if visual.width < 2.0 or visual.height < 2.0:
        visual = expand_and_clip(cap, page_rect, 12.0)
        method = "caption-region-fallback"
    evidence = expand_and_clip(bbox_union((visual, cap)), page_rect, 4.0)
    return visual, evidence, method


def render_png(page: fitz.Page, output: Path, dpi: int, clip: fitz.Rect | None = None) -> None:
    scale = dpi / 72.0
    pixmap = page.get_pixmap(matrix=fitz.Matrix(scale, scale), clip=clip)
    output.parent.mkdir(parents=True, exist_ok=True)
    pixmap.save(output)


def numeric_value(raw: str) -> float | None:
    match = re.search(r"[−–-]?\s*\d+(?:\.\d+)?", raw)
    if not match:
        return None
    token = match.group(0).replace("−", "-").replace("–", "-").replace(" ", "")
    try:
        return float(token)
    except ValueError:
        return None


def condition_mentions(text: str, source_kind: str, bbox: Iterable[float]) -> list[dict[str, Any]]:
    patterns = (
        ("temperature", TEMPERATURE_RE),
        ("pressure", PRESSURE_RE),
        ("duration", DURATION_RE),
        ("percentage", PERCENT_RE),
        ("qualitative_condition", QUALITATIVE_RE),
    )
    mentions: list[dict[str, Any]] = []
    seen: set[tuple[str, str]] = set()
    for kind, pattern in patterns:
        for match in pattern.finditer(text):
            raw = match.group(0).strip()
            key = (kind, raw.casefold())
            if key in seen:
                continue
            seen.add(key)
            record: dict[str, Any] = {
                "kind": kind,
                "raw": raw,
                "source_kind": source_kind,
                "source_bbox_pdf_points": [round(float(value), 2) for value in bbox],
                "verification_status": "machine-extracted",
            }
            if kind == "temperature":
                record["normalized"] = {"value": numeric_value(raw), "unit": "C" if "C" in raw else "F"}
            elif kind in {"pressure", "duration", "percentage"}:
                record["normalized"] = {"value": numeric_value(raw), "unit": None}
            mentions.append(record)
    return mentions


def context_blocks(
    page: fitz.Page,
    caption: Caption,
    caption_block_indexes: set[int],
    limit: int = 3,
) -> list[dict[str, Any]]:
    cap = fitz.Rect(caption.bbox)
    candidates: list[tuple[float, int, dict[str, Any]]] = []
    for block_index, block in enumerate(page.get_text("dict", sort=True)["blocks"]):
        if block.get("type") != 0 or block_index in caption_block_indexes:
            continue
        text = collapse_whitespace(block_raw_text(block))
        if not text or re.fullmatch(r"\d{1,4}", text):
            continue
        box = fitz.Rect(block["bbox"])
        if horizontal_overlap_ratio(cap, box) < 0.12 and box.width < page.rect.width * 0.55:
            continue
        if box.y1 <= cap.y0:
            distance = cap.y0 - box.y1
        elif box.y0 >= cap.y1:
            distance = box.y0 - cap.y1
        else:
            distance = 0.0
        candidates.append((distance, block_index, {"block_index": block_index, "bbox": list(box), "text": text}))
    candidates.sort(key=lambda item: (item[0], item[1]))
    return [record for _, _, record in candidates[:limit]]


def morphology_keywords(text: str) -> list[str]:
    lowered = text.casefold()
    return sorted(term for term in MORPHOLOGY_TERMS if term in lowered)


def figure_category(caption: str) -> list[str]:
    lowered = caption.casefold()
    categories: list[str] = []
    if re.search(r"\b(photo|photograph|micrograph|image)\w*\b", lowered):
        categories.append("photograph")
    if re.search(r"\b(diagram|sketch|model|illustration|schematic)\w*\b", lowered):
        categories.append("diagram")
    if re.search(r"\b(plot|graph|curve|data|measurements?)\w*\b", lowered):
        categories.append("plot")
    if re.search(r"\b(left|right|top|bottom|panel|series|comparison)\b", lowered):
        categories.append("multi-panel")
    return categories or ["uncategorized"]


def write_json(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def write_jsonl(path: Path, values: Iterable[dict[str, Any]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as stream:
        for value in values:
            stream.write(json.dumps(value, ensure_ascii=False, sort_keys=True) + "\n")


def card_markdown(record: dict[str, Any]) -> str:
    lines = [
        f"# Figure {record['figure_id']}",
        "",
        f"- PDF page: {record['pdf_page']}",
        f"- Printed page: {record['printed_page'] if record['printed_page'] is not None else 'unknown'}",
        f"- Crop method: `{record['crop']['method']}`",
        "- Interpretation status: machine-extracted; no scientific claim is human-verified",
        "",
        "[Full evidence page](../../page-images/" + Path(record["assets"]["full_page"]).name + ") · "
        "[Searchable page text](../../pages/" + Path(record["assets"]["page_text"]).name + ")",
        "",
        "## Visual evidence",
        "",
        "![Figure crop](visual.png)",
        "",
        "## Figure with caption",
        "",
        "![Figure and caption](evidence.png)",
        "",
        "## Extracted caption",
        "",
        record["caption"]["raw_text"],
        "",
        "## Candidate condition mentions",
        "",
    ]
    if record["condition_mentions"]:
        for mention in record["condition_mentions"]:
            association = "caption" if mention["source_kind"] == "caption" else "nearby text; proximity only"
            lines.append(
                f"- `{mention['kind']}`: {mention['raw']} — {association}; "
                f"`{mention['verification_status']}`"
            )
    else:
        lines.append("No condition phrase was detected automatically. Inspect the caption and full page.")

    lines.extend(["", "## Morphology search terms", ""])
    lines.append(", ".join(f"`{term}`" for term in record["morphology_keywords"]) or "None detected.")
    lines.extend(
        [
            "",
            "## Nearby page text",
            "",
            "These blocks are selected by layout proximity only; they are not automatically evidence for this figure.",
            "",
        ]
    )
    for context in record["nearby_text"]:
        lines.extend([f"### Text block {context['block_index']}", "", context["text"], ""])
    return "\n".join(lines).rstrip() + "\n"


def deterministic_qa_sample(figures: list[dict[str, Any]]) -> list[dict[str, str]]:
    selected: list[dict[str, str]] = []
    used: set[str] = set()
    for category in ("photograph", "diagram", "plot", "multi-panel"):
        candidates = [record for record in figures if category in record["categories"]]
        candidates.sort(
            key=lambda record: hashlib.sha256(
                f"{GENERATOR_ID}:{category}:{record['figure_id']}".encode("utf-8")
            ).hexdigest()
        )
        for record in candidates:
            if record["figure_id"] in used:
                continue
            selected.append(
                {
                    "category": category,
                    "figure_id": record["figure_id"],
                    "pdf_page": str(record["pdf_page"]),
                    "evidence_image": record["assets"]["evidence_crop"],
                    "card": record["assets"]["card"],
                }
            )
            used.add(record["figure_id"])
            if sum(item["category"] == category for item in selected) == 3:
                break
    return selected


def build_bundle(args: argparse.Namespace) -> None:
    source = args.source_pdf.resolve()
    output = args.output_dir.resolve()
    if not source.is_file():
        raise SystemExit(f"source PDF does not exist: {source}")
    if args.page_dpi < 72 or args.crop_dpi < 72:
        raise SystemExit("DPI values must be at least 72")

    if output.exists():
        marker = output / ".generated-by-build_pdf_llm_bundle"
        if not args.force:
            raise SystemExit(f"output exists; rerun with --force to replace it: {output}")
        if not marker.is_file() or marker.read_text(encoding="utf-8").strip() != GENERATOR_ID:
            raise SystemExit(f"refusing to replace an unmarked directory: {output}")

    output.parent.mkdir(parents=True, exist_ok=True)
    temporary = Path(tempfile.mkdtemp(prefix=f".{output.name}-", dir=output.parent))
    try:
        (temporary / ".generated-by-build_pdf_llm_bundle").write_text(GENERATOR_ID + "\n", encoding="utf-8")
        document = fitz.open(source)
        source_sha = sha256_file(source)
        all_captions: list[Caption] = []
        page_records: list[dict[str, Any]] = []
        captions_by_page: dict[int, list[Caption]] = {}
        printed_by_page: dict[int, int | None] = {}

        print(f"Extracting searchable text from {len(document)} pages...", flush=True)
        for page_index, page in enumerate(document):
            page_number = page_index + 1
            printed = printed_page_number(page)
            printed_by_page[page_number] = printed
            captions = detect_captions(page, page_number)
            captions_by_page[page_number] = captions
            all_captions.extend(captions)
            page_path = temporary / "pages" / f"pdf-page-{page_number:04d}.md"
            page_path.parent.mkdir(parents=True, exist_ok=True)
            page_path.write_text(markdown_page(page, page_number, printed), encoding="utf-8")
            page_records.append(
                {
                    "pdf_page": page_number,
                    "printed_page": printed,
                    "text_file": str(page_path.relative_to(temporary)),
                    "caption_count": len(captions),
                    "width_pdf_points": round(page.rect.width, 2),
                    "height_pdf_points": round(page.rect.height, 2),
                }
            )

        duplicate_ids: dict[str, list[int]] = {}
        for caption in all_captions:
            duplicate_ids.setdefault(caption.figure_id, []).append(caption.page_number)
        duplicate_ids = {key: pages for key, pages in duplicate_ids.items() if len(pages) > 1}
        if duplicate_ids:
            raise RuntimeError(f"duplicate caption identifiers after body-font filtering: {duplicate_ids}")

        figure_records: list[dict[str, Any]] = []
        rendered_pages: set[int] = set()
        print(f"Building {len(all_captions)} figure cards...", flush=True)
        for sequence, caption in enumerate(all_captions, start=1):
            page = document[caption.page_number - 1]
            printed = printed_by_page[caption.page_number]
            page_image_rel = Path("page-images") / f"pdf-page-{caption.page_number:04d}.png"
            page_image = temporary / page_image_rel
            if caption.page_number not in rendered_pages:
                render_png(page, page_image, args.page_dpi)
                rendered_pages.add(caption.page_number)

            visual_box, evidence_box, crop_method = crop_boxes(
                page, caption, captions_by_page[caption.page_number]
            )
            figure_dir_rel = Path("figures") / f"fig-{caption.figure_id}"
            figure_dir = temporary / figure_dir_rel
            visual_rel = figure_dir_rel / "visual.png"
            evidence_rel = figure_dir_rel / "evidence.png"
            render_png(page, temporary / visual_rel, args.crop_dpi, visual_box)
            render_png(page, temporary / evidence_rel, args.crop_dpi, evidence_box)

            caption_block_indexes = {item.block_index for item in captions_by_page[caption.page_number]}
            nearby = context_blocks(page, caption, caption_block_indexes)
            mentions = condition_mentions(caption.text, "caption", caption.bbox)
            for context in nearby:
                mentions.extend(condition_mentions(context["text"], "nearby_text", context["bbox"]))

            card_rel = figure_dir_rel / "evidence.md"
            json_rel = figure_dir_rel / "evidence.json"
            record: dict[str, Any] = {
                "sequence": sequence,
                "figure_id": caption.figure_id,
                "pdf_page": caption.page_number,
                "printed_page": printed,
                "caption": {
                    "raw_text": caption.raw_text,
                    "text": caption.text,
                    "bbox_pdf_points": [round(value, 2) for value in caption.bbox],
                    "block_index": caption.block_index,
                },
                "assets": {
                    "card": str(card_rel),
                    "evidence_json": str(json_rel),
                    "full_page": str(page_image_rel),
                    "page_text": f"pages/pdf-page-{caption.page_number:04d}.md",
                    "visual_crop": str(visual_rel),
                    "evidence_crop": str(evidence_rel),
                },
                "crop": {
                    "method": crop_method,
                    "visual_bbox_pdf_points": [round(value, 2) for value in visual_box],
                    "evidence_bbox_pdf_points": [round(value, 2) for value in evidence_box],
                    "verification_status": "machine-associated",
                },
                "condition_mentions": mentions,
                "morphology_keywords": morphology_keywords(caption.text),
                "categories": figure_category(caption.text),
                "nearby_text": nearby,
                "scientific_verification_status": "unverified",
            }
            write_json(temporary / json_rel, record)
            (temporary / card_rel).write_text(card_markdown(record), encoding="utf-8")
            figure_records.append(record)

        write_jsonl(temporary / "figures.jsonl", figure_records)
        write_jsonl(temporary / "pages.jsonl", page_records)
        qa_sample = deterministic_qa_sample(figure_records)
        write_json(temporary / "qa-sample.json", qa_sample)

        index_lines = [
            "# Figure index",
            "",
            "All condition mentions and visual associations are machine-extracted until reviewed.",
            "",
            "| Figure | PDF page | Printed page | Categories | Condition mentions | Card |",
            "|---|---:|---:|---|---|---|",
        ]
        for record in figure_records:
            conditions = ", ".join(mention["raw"] for mention in record["condition_mentions"] if mention["source_kind"] == "caption")
            conditions = conditions.replace("|", "\\|") or "—"
            categories = ", ".join(record["categories"])
            index_lines.append(
                f"| {record['figure_id']} | {record['pdf_page']} | "
                f"{record['printed_page'] if record['printed_page'] is not None else '—'} | "
                f"{categories} | {conditions} | [{record['assets']['card']}]({record['assets']['card']}) |"
            )
        (temporary / "figure-index.md").write_text("\n".join(index_lines) + "\n", encoding="utf-8")

        readme = f"""# LLM research bundle — Snow Crystals

Generated locally from `1910.06389v2.pdf`. This directory is intentionally gitignored.

- Source SHA-256: `{source_sha}`
- PDF pages: {len(document)}
- Detected numbered figures: {len(figure_records)}
- Rendered figure pages: {len(rendered_pages)}

## Query workflow

1. Search page text and figure cards with `rg -n -i '<terms>' pages figures figure-index.md`.
2. Open the matching figure's `evidence.md`.
3. Inspect `visual.png`, `evidence.png`, and the linked complete evidence page.
4. Treat image morphology, stated conditions, and their association as separate evidence.
5. Verify important formulas, units, and scientific claims against the canonical PDF page.

`condition_mentions` are retrieval hints, not validated experimental records. Nearby text is linked
by layout proximity only. No generated record is automatically human-verified.
"""
        (temporary / "README.md").write_text(readme, encoding="utf-8")

        manifest = {
            "schema_version": 1,
            "generator": GENERATOR_ID,
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "source": {
                "filename": source.name,
                "sha256": source_sha,
                "size_bytes": source.stat().st_size,
                "pdf_pages": len(document),
            },
            "settings": {"page_dpi": args.page_dpi, "crop_dpi": args.crop_dpi},
            "counts": {
                "pages": len(page_records),
                "figures": len(figure_records),
                "rendered_figure_pages": len(rendered_pages),
                "qa_sample": len(qa_sample),
            },
            "indexes": {
                "pages_jsonl": "pages.jsonl",
                "figures_jsonl": "figures.jsonl",
                "figure_markdown": "figure-index.md",
                "qa_sample": "qa-sample.json",
            },
            "copyright_policy": "Local generated cache; do not commit full-content derivatives.",
        }
        write_json(temporary / "manifest.json", manifest)

        document.close()
        if output.exists():
            shutil.rmtree(output)
        temporary.rename(output)
        print(
            f"Built {output}: {len(page_records)} pages, {len(figure_records)} figures, "
            f"{len(rendered_pages)} rendered pages.",
            flush=True,
        )
    except Exception:
        shutil.rmtree(temporary, ignore_errors=True)
        raise


def main() -> int:
    try:
        build_bundle(parse_args())
    except (RuntimeError, ValueError, fitz.FileDataError) as error:
        print(f"error: {error}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
