import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const REPO = fileURLToPath(new URL("../..", import.meta.url));
const PROGRESS = resolve(REPO, "docs", "PROGRESS.md");
const HANDOFF = resolve(REPO, "docs", "HANDOFF.md");
const ARCHIVE = resolve(REPO, "docs", "progress-history-through-2026-08-02.md");
const ACTIVE_PLANS = [
  resolve(REPO, "docs", "plans", "phase-6-science-first-completion.md"),
  resolve(REPO, "docs", "plans", "phase-8-what-is-real.md"),
];
const ARCHIVE_MARKER = "<!-- BEGIN EXACT PRE-COMPACTION PROGRESS BODY -->\n";
const ARCHIVED_BODY_BYTES = 191_859;
const ARCHIVED_BODY_SHA256 = "2550319a3ac5d528c111875242419de91d2ed9b34f245f7a0364ede8b323f955";
const FORBIDDEN_SEQUENCING = [
  "Phase 7 waits for Phase 6",
  "Begins only after Phase 6 closes",
  "none may start before Phase 6 WP8",
  "Phase 8 waits for Phase 6",
];
const ARCHIVED_BODY_LF_BYTES = 190_074;
const ARCHIVED_BODY_LF_SHA256 = "9f7ee2ad0a7773740b8aff111b16aad236fb9555f7ae0cd861714681103b4a9d";

function sha256(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

function countExactLine(text: string, heading: string): number {
  return text.split(/\r?\n/u).filter((line) => line === heading).length;
}

function currentIndexErrors(text: string): string[] {
  const errors: string[] = [];
  const required = [
    "Phase 6 is ACTIVE AND INCOMPLETE",
    "Phase 8 is ACTIVE IN PARALLEL WITH PHASE 6",
    "Phase 7 is completely standalone",
    "CAK 3/90, M1 54/90",
    "M1_NO_DIP_ABLATION",
    "cannot establish physical SDAK causality or necessity",
    "(plans/phase-6-science-first-completion.md)",
    "(plans/phase-8-what-is-real.md)",
    "- **Last updated:** 2026-08-10",
  ];
  for (const phrase of required) {
    if (!text.includes(phrase)) errors.push(`missing current-state phrase: ${phrase}`);
  }
  for (const phrase of FORBIDDEN_SEQUENCING) {
    if (text.includes(phrase)) errors.push(`stale sequencing phrase: ${phrase}`);
  }
  for (const heading of ["## Phase gates", "## Active plan", "## Next step"]) {
    if (countExactLine(text, heading) !== 1) errors.push(`expected exactly one ${heading}`);
  }
  if (text.includes("### Archival material below")) errors.push("archival chronology remained live");
  if (text.includes("### Superseded Phase 6 closure")) errors.push("retracted closure remained live");
  if (text.includes(ARCHIVE_MARKER.trim())) errors.push("byte archive was embedded in current index");
  return errors;
}

function localMarkdownTargets(markdown: string, sourcePath: string): string[] {
  const targets: string[] = [];
  const link = /\[[^\]]*\]\(([^)\s]+)(?:\s+["'][^)]*["'])?\)/gu;
  for (const match of markdown.matchAll(link)) {
    const raw = match[1]?.replace(/^<|>$/gu, "");
    if (raw === undefined || raw.startsWith("#") || /^[a-z][a-z0-9+.-]*:/iu.test(raw)) continue;
    const withoutFragment = raw.split("#", 1)[0]?.split("?", 1)[0];
    if (withoutFragment === undefined || withoutFragment.length === 0) continue;
    targets.push(resolve(dirname(sourcePath), decodeURIComponent(withoutFragment)));
  }
  return targets;
}

describe("compact progress index and byte-exact historical record", () => {
  it("preserves the complete pre-compaction body byte-for-byte", () => {
    const archive = readFileSync(ARCHIVE);
    const marker = Buffer.from(ARCHIVE_MARKER, "utf8");
    const markerOffset = archive.indexOf(marker);
    expect(markerOffset, "archive marker must occur once").toBeGreaterThanOrEqual(0);
    expect(archive.indexOf(marker, markerOffset + marker.length), "archive marker must be unique").toBe(-1);

    const body = archive.subarray(markerOffset + marker.length);
    expect(body.byteLength).toBe(ARCHIVED_BODY_BYTES);
    expect(sha256(body)).toBe(ARCHIVED_BODY_SHA256);

    const normalized = Buffer.from(body.toString("utf8").replace(/\r\n/gu, "\n"), "utf8");
    expect(normalized.byteLength).toBe(ARCHIVED_BODY_LF_BYTES);
    expect(sha256(normalized)).toBe(ARCHIVED_BODY_LF_SHA256);
  });

  it("disables Git line-ending conversion for the byte-exact mixed-ending archive", () => {
    const relativeArchive = "docs/progress-history-through-2026-08-02.md";
    const attributes = execFileSync("git", ["check-attr", "text", "whitespace", "--", relativeArchive], {
      cwd: REPO,
      encoding: "utf8",
    });
    expect(attributes).toBe(
      `${relativeArchive}: text: unset\n${relativeArchive}: whitespace: -trailing-space\n`,
    );

    const rawObject = execFileSync("git", ["hash-object", "--no-filters", relativeArchive], {
      cwd: REPO,
      encoding: "utf8",
    });
    const cleanObject = execFileSync(
      "git",
      ["hash-object", `--path=${relativeArchive}`, relativeArchive],
      { cwd: REPO, encoding: "utf8" },
    );
    expect(cleanObject).toBe(rawObject);
  });

  it("keeps the live authority compact, complete, and unambiguous", () => {
    const bytes = readFileSync(PROGRESS);
    const text = bytes.toString("utf8");
    expect(bytes.byteLength).toBeLessThanOrEqual(20_000);
    expect(text.split(/\r?\n/u).length).toBeLessThanOrEqual(250);
    expect(currentIndexErrors(text)).toEqual([]);

    const progressDate = text.match(/^- \*\*Last updated:\*\* (\d{4}-\d{2}-\d{2})/mu)?.[1];
    const handoffDate = readFileSync(HANDOFF, "utf8")
      .match(/^# Handoff .* \((\d{4}-\d{2}-\d{2})\)$/mu)?.[1];
    // HANDOFF.md is the last maker-triggered stop snapshot and moves only on maker request;
    // PROGRESS.md advances with ordinary work, so the two dates are pinned independently.
    expect(progressDate).toBe("2026-08-10");
    expect(handoffDate).toBe("2026-08-07");
    for (const activePlan of ACTIVE_PLANS) expect(existsSync(activePlan)).toBe(true);
    expect(existsSync(ARCHIVE)).toBe(true);
  });

  it("keeps every local Markdown target in the current index and archive resolvable", () => {
    const repoPrefix = `${resolve(REPO)}${sep}`;
    for (const sourcePath of [PROGRESS, ARCHIVE]) {
      const targets = localMarkdownTargets(readFileSync(sourcePath, "utf8"), sourcePath);
      expect(targets.length, `${sourcePath} should contain checked local links`).toBeGreaterThan(0);
      for (const target of targets) {
        expect(target.startsWith(repoPrefix), `local Markdown target escapes repository: ${target}`).toBe(true);
        expect(existsSync(target), `missing local Markdown target from ${sourcePath}: ${target}`).toBe(true);
      }
    }
  });

  it("labels the archive as historical rather than a second current authority", () => {
    const banner = readFileSync(ARCHIVE, "utf8").slice(0, 950);
    expect(banner).toContain("Historical snapshot — not current authority");
    expect(banner).toContain("[PROGRESS.md](PROGRESS.md)");
    expect(banner).toContain(`${ARCHIVED_BODY_BYTES.toLocaleString("en-US")} raw bytes`);
    expect(banner).toContain(ARCHIVED_BODY_SHA256);
  });

  it("rejects named current-index state-loss mutations", () => {
    const current = readFileSync(PROGRESS, "utf8");
    expect(currentIndexErrors(current.replace("Phase 6 is ACTIVE AND INCOMPLETE", "Phase 6 is complete")))
      .toContain("missing current-state phrase: Phase 6 is ACTIVE AND INCOMPLETE");
    const phase8StatusMutation = current.replace(
      "Phase 8 is ACTIVE IN PARALLEL WITH PHASE 6",
      "Phase 8 is inactive",
    );
    expect(phase8StatusMutation).not.toBe(current);
    expect(currentIndexErrors(phase8StatusMutation))
      .toContain("missing current-state phrase: Phase 8 is ACTIVE IN PARALLEL WITH PHASE 6");

    const phase7StatusMutation = current.replace(
      "Phase 7 is completely standalone",
      "Phase 7 waits for Phase 6",
    );
    expect(phase7StatusMutation).not.toBe(current);
    expect(currentIndexErrors(phase7StatusMutation))
      .toContain("missing current-state phrase: Phase 7 is completely standalone");
    for (const phrase of FORBIDDEN_SEQUENCING) {
      expect(currentIndexErrors(`${current}\n${phrase}\n`))
        .toContain(`stale sequencing phrase: ${phrase}`);
    }

    const phase8LinkMutation = current.replaceAll(
      "(plans/phase-8-what-is-real.md)",
      "(plans/missing-phase-8-plan.md)",
    );
    expect(phase8LinkMutation).not.toBe(current);
    expect(currentIndexErrors(phase8LinkMutation))
      .toContain("missing current-state phrase: (plans/phase-8-what-is-real.md)");
    expect(currentIndexErrors(`${current}\n## Next step\n`))
      .toContain("expected exactly one ## Next step");
    expect(currentIndexErrors(`${current}\n${ARCHIVE_MARKER}`))
      .toContain("byte archive was embedded in current index");
  });

  it("rejects a one-byte archived-body mutation independently of the archive producer", () => {
    const archive = readFileSync(ARCHIVE);
    const bodyOffset = archive.indexOf(Buffer.from(ARCHIVE_MARKER, "utf8")) + ARCHIVE_MARKER.length;
    const mutated = Buffer.from(archive.subarray(bodyOffset));
    mutated[mutated.length - 1] ^= 1;
    expect(sha256(mutated)).not.toBe(ARCHIVED_BODY_SHA256);
  });
});
