#!/usr/bin/env python3
"""Verify structural integrity of a generated PDF LLM evidence bundle."""

from __future__ import annotations

import argparse
import hashlib
import json
import sys
from pathlib import Path
from typing import Any

import fitz


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Verify a generated PDF LLM evidence bundle")
    parser.add_argument("bundle_dir", type=Path, help="Bundle directory to verify")
    parser.add_argument("--source-pdf", type=Path, help="Optional canonical PDF for hash verification")
    parser.add_argument(
        "--require-qa",
        action="store_true",
        help="Require qa-review.json with a passing review for every deterministic sample item",
    )
    return parser.parse_args()


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def load_jsonl(path: Path) -> list[dict[str, Any]]:
    records: list[dict[str, Any]] = []
    with path.open("r", encoding="utf-8") as stream:
        for line_number, line in enumerate(stream, start=1):
            if not line.strip():
                continue
            try:
                records.append(json.loads(line))
            except json.JSONDecodeError as error:
                raise ValueError(f"{path}:{line_number}: invalid JSON: {error}") from error
    return records


def verify_png(path: Path, errors: list[str]) -> None:
    if not path.is_file():
        errors.append(f"missing PNG: {path}")
        return
    try:
        pixmap = fitz.Pixmap(path)
        if pixmap.width < 2 or pixmap.height < 2:
            errors.append(f"empty PNG dimensions: {path}")
    except Exception as error:  # PyMuPDF raises several format-specific exception types.
        errors.append(f"cannot decode PNG {path}: {error}")


def verify(args: argparse.Namespace) -> tuple[list[str], dict[str, int]]:
    bundle = args.bundle_dir.resolve()
    errors: list[str] = []
    required = ["manifest.json", "pages.jsonl", "figures.jsonl", "figure-index.md", "qa-sample.json"]
    for relative in required:
        if not (bundle / relative).is_file():
            errors.append(f"missing required file: {relative}")
    if errors:
        return errors, {}

    manifest = load_json(bundle / "manifest.json")
    pages = load_jsonl(bundle / "pages.jsonl")
    figures = load_jsonl(bundle / "figures.jsonl")
    sample = load_json(bundle / "qa-sample.json")

    expected_pages = int(manifest["source"]["pdf_pages"])
    if len(pages) != expected_pages:
        errors.append(f"page accounting mismatch: expected {expected_pages}, found {len(pages)}")
    if manifest["counts"]["pages"] != len(pages):
        errors.append("manifest page count does not match pages.jsonl")
    if manifest["counts"]["figures"] != len(figures):
        errors.append("manifest figure count does not match figures.jsonl")
    if manifest["counts"]["qa_sample"] != len(sample):
        errors.append("manifest QA sample count does not match qa-sample.json")

    page_numbers = {int(record["pdf_page"]) for record in pages}
    if page_numbers != set(range(1, expected_pages + 1)):
        errors.append("page identifiers are not a complete one-based sequence")
    for record in pages:
        text_path = bundle / record["text_file"]
        if not text_path.is_file():
            errors.append(f"missing page text: {record['text_file']}")
            continue
        marker = f"# PDF page {record['pdf_page']}"
        if marker not in text_path.read_text(encoding="utf-8"):
            errors.append(f"missing page marker in {record['text_file']}")

    figure_ids: set[str] = set()
    rendered_pages: set[str] = set()
    for record in figures:
        figure_id = str(record["figure_id"])
        if figure_id in figure_ids:
            errors.append(f"duplicate figure identifier: {figure_id}")
        figure_ids.add(figure_id)
        assets = record["assets"]
        for key in ("card", "evidence_json", "page_text"):
            if not (bundle / assets[key]).is_file():
                errors.append(f"figure {figure_id}: missing {key}: {assets[key]}")
        for key in ("full_page", "visual_crop", "evidence_crop"):
            verify_png(bundle / assets[key], errors)
        rendered_pages.add(assets["full_page"])
        if record["scientific_verification_status"] != "unverified":
            errors.append(f"figure {figure_id}: generated scientific status is not unverified")
        for mention in record["condition_mentions"]:
            if mention["verification_status"] != "machine-extracted":
                errors.append(f"figure {figure_id}: generated condition marked beyond machine-extracted")

    if len(rendered_pages) != manifest["counts"]["rendered_figure_pages"]:
        errors.append("rendered evidence-page count does not match manifest")
    if len(sample) < 12:
        errors.append(f"QA sample is too small: expected at least 12, found {len(sample)}")
    sample_ids = {str(item["figure_id"]) for item in sample}
    if not sample_ids.issubset(figure_ids):
        errors.append("QA sample references an unknown figure")

    if args.source_pdf:
        source = args.source_pdf.resolve()
        if not source.is_file():
            errors.append(f"source PDF does not exist: {source}")
        elif sha256_file(source) != manifest["source"]["sha256"]:
            errors.append("source PDF SHA-256 does not match manifest")

    if args.require_qa:
        review_path = bundle / "qa-review.json"
        if not review_path.is_file():
            errors.append("qa-review.json is required but missing")
        else:
            reviews = load_json(review_path)
            reviewed_ids = {
                str(item["figure_id"])
                for item in reviews
                if item.get("association_status") == "pass"
            }
            missing = sample_ids - reviewed_ids
            if missing:
                errors.append(f"QA review lacks passing associations for: {sorted(missing)}")

    counts = {
        "pages": len(pages),
        "figures": len(figures),
        "rendered_figure_pages": len(rendered_pages),
        "qa_sample": len(sample),
    }
    return errors, counts


def main() -> int:
    args = parse_args()
    try:
        errors, counts = verify(args)
    except (KeyError, TypeError, ValueError, json.JSONDecodeError) as error:
        print(f"error: malformed bundle: {error}", file=sys.stderr)
        return 1
    if errors:
        for error in errors:
            print(f"FAIL: {error}", file=sys.stderr)
        return 1
    print(
        "PASS: "
        f"{counts['pages']} pages, {counts['figures']} figures, "
        f"{counts['rendered_figure_pages']} rendered pages, "
        f"{counts['qa_sample']} QA samples"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
