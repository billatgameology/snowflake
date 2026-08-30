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
const PHASE_HISTORY = resolve(REPO, "docs", "progress-history-phases-6-8-9.md");
const STATE_PLANS = [
  resolve(REPO, "docs", "plans", "phase-6-science-first-completion.md"),
  resolve(REPO, "docs", "plans", "phase-8-what-is-real.md"),
  resolve(REPO, "docs", "plans", "phase-8-measurement-corpus.md"),
  resolve(REPO, "docs", "plans", "phase-9-execution.md"),
];
const ARCHIVE_MARKER = "<!-- BEGIN EXACT PRE-COMPACTION PROGRESS BODY -->\n";
const ARCHIVED_BODY_BYTES = 191_859;
const ARCHIVED_BODY_SHA256 = "2550319a3ac5d528c111875242419de91d2ed9b34f245f7a0364ede8b323f955";
const FORBIDDEN_SEQUENCING = [
  "Phase 7 waits for Phase 6",
  "Begins only after Phase 6 closes",
  "none may start before Phase 6 WP8",
  "Phase 8 waits for Phase 6",
  "No Phase 8 action remains",
  "### Phase 8 lane — complete",
  "Then freeze the source set and run the two zero-addition rounds",
  "Phase 9 remains unchartered",
  "Phase 9 is unauthorized",
  "maker adoption decision next",
  "### Phase 9 resume point — integrate the bounded all-no-pass tranche",
  "maker selected Options A + B (2026-08-20)",
];
const PHASE8_STATUS_LINE =
  "- **Phase 8 is COMPLETE (Phase 8A 2026-08-10; Phase 8B 2026-08-12).**";
const PHASE9_STATUS_LINE =
  "- **Phase 9 is COMPLETE (development-only, 2026-08-13).**";
const PHASE8_GATE_PREFIX = "| 8 | **Complete (8A + 8B)** |";
const PHASE7_GATE_PREFIX = "| 7 | Not started; independently eligible |";
const PHASE9_GATE_PREFIX = "| 9 | **Complete (development-only)** |";
const CONTRADICTORY_STATE_PATTERNS = [
  /Phase 8B (?:is |remains )?(?:active|incomplete|pending)\b/iu,
  /Phase 8B.*\b(?:may|can|will|must) (?:rewrite|mutate|replace|overwrite)\b.*\b(?:8A|v1|phase8-target-book)\b/iu,
  /Phase 7 (?:is(?: now)?|becomes) (?:active|started|complete|completed|done|closed)\b/iu,
  /Phase 9 is (?:active|incomplete|pending|ongoing)\b/iu,
  /Phase 9 (?:may|can|will|does) grant\b.*\bvalidation\b/iu,
  /Phase 9 (?:has|contains|uses) [1-9][0-9]* held[- ]out rows?\b/iu,
  /Phase 9 (?:may|can|will) (?:use|run on)\b.*\bWindows Phase 6\b/iu,
  /Phase 9 (?:may|can|will) score\b.*\bbefore S0B\b/iu,
  /Phase 6 (?:is|remains) (?:active|incomplete|pending)\b/iu,
  /ladder is executing\b/iu,
  /pending ladder verdict\b/iu,
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
    "Phase 6 is COMPLETE (2026-08-20)",
    "gate6` exit 0 at `44488ab",
    "NO-PASS (criterion)",
    "Phase 8 is COMPLETE (Phase 8A 2026-08-10; Phase 8B 2026-08-12)",
    "47a75f3fcc499d74d36cd08eeaed7f4e839bf991deb179fa19ce809d57e171ec",
    "Phase 8B writes separate artifacts",
    "Decision [0048]",
    "51 model-development records (18 P0 / 28 P1 / 5 P2)",
    "252,134 native history rows",
    "431 adjudicated plot points",
    "corrected residual sample is 0/9 misses",
    "exact full suite passed",
    "97/97",
    "detached clean-checkout verifier and 51 focused tests passed",
    "final non-author audit",
    "Phase 8B record — closed; external search remains stopped",
    "Preserve `evidence/phase8-target-book/`",
    "byte-for-byte, along with rejected plot-adjudication history",
    "Phase 7 is completely",
    "standalone, unstarted",
    "Phase 9 is COMPLETE (development-only, 2026-08-13)",
    "The all-no-pass branch closed:",
    "Exact `TMPDIR=/private/tmp npm test` passed",
    "[Phase 9 execution plan](plans/phase-9-execution.md) is complete",
    "Decision [0050]",
    "charter v1.27",
    "(plans/phase-9-execution.md)",
    "detailed S0B and scored-result bytes first entered Git together",
    "Git ordering cannot independently prove that sequence",
    "All 51 Phase 8B records remain development evidence",
    "Phase 9 cannot grant a quantitative-validation label",
    "Phase 6's Windows evidence",
    "host, processes, artifacts, and then-unpublished verdict remained isolated",
    "CAK 3/90, M1 54/90",
    "M1_NO_DIP_ABLATION",
    "cannot establish physical SDAK causality or necessity",
    "(plans/phase-6-science-first-completion.md)",
    "(plans/phase-8-what-is-real.md)",
    "(plans/phase-8-measurement-corpus.md)",
    "(progress-history-phases-6-8-9.md)",
    "selected no Phase 10 package (2026-08-20)",
    "- **Last updated:** 2026-08-30",
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
  if (countExactLine(text, PHASE8_STATUS_LINE) !== 1) {
    errors.push("expected exactly one structured Phase 8A/8B status line");
  }
  if (countExactLine(text, PHASE9_STATUS_LINE) !== 1) {
    errors.push("expected exactly one structured Phase 9 status line");
  }
  const lines = text.split(/\r?\n/u);
  const phase8GateLines = lines.filter((line) => line.startsWith("| 8 |"));
  if (phase8GateLines.length !== 1 || !phase8GateLines[0]?.startsWith(PHASE8_GATE_PREFIX)) {
    errors.push("expected exactly one completed Phase 8 gate row");
  }
  const phase7GateLines = lines.filter((line) => line.startsWith("| 7 |"));
  if (phase7GateLines.length !== 1 || !phase7GateLines[0]?.startsWith(PHASE7_GATE_PREFIX)) {
    errors.push("expected exactly one not-started Phase 7 gate row");
  }
  const phase9GateLines = lines.filter((line) => line.startsWith("| 9 |"));
  if (phase9GateLines.length !== 1 || !phase9GateLines[0]?.startsWith(PHASE9_GATE_PREFIX)) {
    errors.push("expected exactly one completed Phase 9 gate row");
  }
  for (const line of lines) {
    if (CONTRADICTORY_STATE_PATTERNS.some((pattern) => pattern.test(line))) {
      errors.push(`contradictory current-state claim: ${line.trim()}`);
    }
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

  it("keeps the live authority complete and unambiguous", () => {
    // Compactness is a manual prune discipline (maker direction 2026-08-16), not an enforced
    // ceiling: prune stale entries as work lands; do not reintroduce a byte or line cap here.
    const text = readFileSync(PROGRESS, "utf8");
    expect(currentIndexErrors(text)).toEqual([]);

    const progressDate = text.match(/^- \*\*Last updated:\*\* (\d{4}-\d{2}-\d{2})/mu)?.[1];
    expect(progressDate).toBe("2026-08-30");
    // The handoff mechanism is retired (maker direction 2026-08-20). docs/HANDOFF.md remains
    // only as a tombstone so the byte-frozen archive's HANDOFF.md links keep resolving; it
    // must never carry a live dated snapshot heading again.
    const handoff = readFileSync(HANDOFF, "utf8");
    expect(handoff).toContain("retired");
    expect(handoff).not.toMatch(/^# Handoff .* \(\d{4}-\d{2}-\d{2}\)$/mu);
    for (const statePlan of STATE_PLANS) expect(existsSync(statePlan)).toBe(true);
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

  it("labels the phase 6/8/9 history file as historical rather than a second current authority", () => {
    const banner = readFileSync(PHASE_HISTORY, "utf8").slice(0, 700);
    expect(banner).toContain("Historical snapshot — not current authority");
    expect(banner).toContain("[PROGRESS.md](PROGRESS.md)");
    expect(banner).toContain("preserved as last written");
  });

  it("rejects named current-index state-loss mutations", () => {
    const current = readFileSync(PROGRESS, "utf8");
    expect(currentIndexErrors(current.replace("Phase 6 is COMPLETE (2026-08-20)", "Phase 6 is ACTIVE AND INCOMPLETE")))
      .toContain("missing current-state phrase: Phase 6 is COMPLETE (2026-08-20)");
    const phase8StatusMutation = current.replace(
      "Phase 8 is COMPLETE (Phase 8A 2026-08-10; Phase 8B 2026-08-12)",
      "Phase 8 is inactive",
    );
    expect(phase8StatusMutation).not.toBe(current);
    expect(currentIndexErrors(phase8StatusMutation))
      .toContain(
        "missing current-state phrase: "
          + "Phase 8 is COMPLETE (Phase 8A 2026-08-10; Phase 8B 2026-08-12)",
      );
    const phase8IdentityMutation = current.replace(
      "47a75f3fcc499d74d36cd08eeaed7f4e839bf991deb179fa19ce809d57e171ec",
      "07a75f3fcc499d74d36cd08eeaed7f4e839bf991deb179fa19ce809d57e171ec",
    );
    expect(phase8IdentityMutation).not.toBe(current);
    expect(currentIndexErrors(phase8IdentityMutation))
      .toContain(
        "missing current-state phrase: "
          + "47a75f3fcc499d74d36cd08eeaed7f4e839bf991deb179fa19ce809d57e171ec",
      );
    const phase8BoundaryMutation = current
      .replace("Phase 8B writes separate artifacts", "Phase 8B rewrites v1 artifacts")
      .replace(
        "Preserve `evidence/phase8-target-book/`",
        "Revise `evidence/phase8-target-book/` in place",
      );
    expect(phase8BoundaryMutation).not.toBe(current);
    expect(currentIndexErrors(phase8BoundaryMutation))
      .toContain("missing current-state phrase: Phase 8B writes separate artifacts");
    expect(currentIndexErrors(phase8BoundaryMutation))
      .toContain(
        "missing current-state phrase: Preserve `evidence/phase8-target-book/`",
      );

    const phase7StatusMutation = current
      .replace("Phase 7 is completely", "Phase 7 waits for Phase 6 and is not completely")
      .replace("standalone, unstarted", "dependent, unstarted");
    expect(phase7StatusMutation).not.toBe(current);
    expect(currentIndexErrors(phase7StatusMutation))
      .toContain("missing current-state phrase: Phase 7 is completely");
    const phase9StatusMutation = current.replace(
      PHASE9_STATUS_LINE,
      "- **Phase 9 is ACTIVE AND INCOMPLETE.**",
    );
    expect(phase9StatusMutation).not.toBe(current);
    expect(currentIndexErrors(phase9StatusMutation))
      .toContain("missing current-state phrase: Phase 9 is COMPLETE (development-only, 2026-08-13)");
    const phase9CompletionMutation = current
      .replace("The all-no-pass branch closed:", "The Phase 9 branch remains open:")
      .replaceAll("Exact `TMPDIR=/private/tmp npm test` passed", "The final suite remains pending");
    expect(phase9CompletionMutation).not.toBe(current);
    expect(currentIndexErrors(phase9CompletionMutation))
      .toContain("missing current-state phrase: The all-no-pass branch closed:");
    expect(currentIndexErrors(phase9CompletionMutation))
      .toContain("missing current-state phrase: Exact `TMPDIR=/private/tmp npm test` passed");
    expect(currentIndexErrors(`${current}\nPhase 8B is ACTIVE AND INCOMPLETE.\n`))
      .toContain("contradictory current-state claim: Phase 8B is ACTIVE AND INCOMPLETE.");
    expect(currentIndexErrors(`${current}\nPhase 8B may rewrite target-book v1 artifacts in place.\n`))
      .toContain(
        "contradictory current-state claim: Phase 8B may rewrite target-book v1 artifacts in place.",
      );
    expect(currentIndexErrors(`${current}\nPhase 7 is ACTIVE.\n`))
      .toContain("contradictory current-state claim: Phase 7 is ACTIVE.");
    expect(currentIndexErrors(`${current}\nPhase 9 is ACTIVE AND INCOMPLETE.\n`))
      .toContain("contradictory current-state claim: Phase 9 is ACTIVE AND INCOMPLETE.");
    expect(currentIndexErrors(`${current}\nPhase 9 may grant quantitative validation.\n`))
      .toContain("contradictory current-state claim: Phase 9 may grant quantitative validation.");
    expect(currentIndexErrors(`${current}\nPhase 9 has 1 held-out row.\n`))
      .toContain("contradictory current-state claim: Phase 9 has 1 held-out row.");
    expect(currentIndexErrors(`${current}\nPhase 9 may run on the live Windows Phase 6 evidence host.\n`))
      .toContain(
        "contradictory current-state claim: "
          + "Phase 9 may run on the live Windows Phase 6 evidence host.",
      );
    expect(currentIndexErrors(`${current}\nPhase 9 may score models before S0B.\n`))
      .toContain("contradictory current-state claim: Phase 9 may score models before S0B.");
    expect(currentIndexErrors(`${current}\n${PHASE8_STATUS_LINE}\n`))
      .toContain("expected exactly one structured Phase 8A/8B status line");
    expect(currentIndexErrors(`${current}\n${PHASE8_GATE_PREFIX} contradictory |\n`))
      .toContain("expected exactly one completed Phase 8 gate row");
    expect(currentIndexErrors(`${current}\n${PHASE9_STATUS_LINE}\n`))
      .toContain("expected exactly one structured Phase 9 status line");
    expect(currentIndexErrors(`${current}\n${PHASE9_GATE_PREFIX} contradictory |\n`))
      .toContain("expected exactly one completed Phase 9 gate row");
    for (const phrase of FORBIDDEN_SEQUENCING) {
      expect(currentIndexErrors(`${current}\n${phrase}\n`))
        .toContain(`stale sequencing phrase: ${phrase}`);
    }

    const phase8LinkMutation = current.replaceAll(
      "(plans/phase-8-measurement-corpus.md)",
      "(plans/missing-phase-8-plan.md)",
    );
    expect(phase8LinkMutation).not.toBe(current);
    expect(currentIndexErrors(phase8LinkMutation))
      .toContain("missing current-state phrase: (plans/phase-8-measurement-corpus.md)");
    const phase9LinkMutation = current.replaceAll(
      "(plans/phase-9-execution.md)",
      "(plans/missing-phase-9-plan.md)",
    );
    expect(phase9LinkMutation).not.toBe(current);
    expect(currentIndexErrors(phase9LinkMutation))
      .toContain("missing current-state phrase: (plans/phase-9-execution.md)");
    const phase10DecisionMutation = current.replace(
      "selected no Phase 10 package (2026-08-20)",
      "maker selected Options A + B (2026-08-20)",
    );
    expect(phase10DecisionMutation).not.toBe(current);
    expect(currentIndexErrors(phase10DecisionMutation))
      .toContain("missing current-state phrase: selected no Phase 10 package (2026-08-20)");
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
