// Phase 6 WP8 — the flagless final gate.
//
// Re-derives every decision-0045-amended Phase 6 obligation from committed evidence (ADR 0045
// item 5): the WP1 strata freeze; the ladder's artifact-derived no-pass; the three measured-only
// arm artifacts with their labels; the narrative three-arm comparison; the decision 0043/0044
// deferral records; and the closure labels. A morphology miss does not change exit 0 — the gate
// verifies obligations, never agreement counts. Invalid provenance, artifacts, labels, or
// protocol violations THROW (main.ts prints the failure and exits 1); any flag exits 2.
//
// Shape follows gate5 (capture → pure evaluator → command wrapper), simplified where decision
// 0049 proportionality permits: gate6 publishes nothing durable — its out/ report is a derived
// convenience, written with gate4's single exclusive-verified write rather than gate5's staged
// lane machinery, because there is no multi-file evidence bundle to keep atomic here.

import { execFileSync } from "node:child_process";
import { lstatSync, readFileSync, writeFileSync, openSync, closeSync, readSync, fstatSync, mkdirSync } from "node:fs";
import { resolve, sep } from "node:path";

import { canonicalJsonBytes, sha256Bytes } from "./gate4-evidence.ts";
import {
  PHASE6_ARM1,
  PHASE6_ARM2,
  PHASE6_ARM3,
  phase6ClassifyHabit,
  type Phase6Arm,
} from "./phase6-sweep.ts";
import {
  PHASE6_CURRENT_PARAMETER_TABLE_SHA256,
  PHASE6_PROTOCOL_FREEZE_COMMIT,
  PHASE6_PROTOCOL_SHA256_AT_ARM1_EVIDENCE,
} from "./phase6-protocol.ts";
import { PHASE6_ARM2_FREEZE_COMMIT, PHASE6_ARM2_VALUES_SHA256 } from "./phase6-arm2-protocol.ts";
import { PHASE6_ARM3_FREEZE_COMMIT, PHASE6_ARM3_VALUES_SHA256 } from "./phase6-arm3-protocol.ts";

export const GATE6_REPORT_PATH = "out/phase6/gate6-report.json";

// ── The frozen expectations the criteria check against ──────────────────────────────────────

const STRATA_SHA256 = "aba93698ad6dcd72237a9c7ffa48588143533db315c059a29f6cd98c8d0288b6";
const HELDOUT_LOCK_SHA256 = "f245d9e6e4f899f1629c37376c2a4bf62475b5a705f9966aff816c36763f73a5";
const SOURCE_CURRENCY_SHA256 = "af045438ab2e4bb0de82aea4b289388d7d2c0448322298f7ecfe4ed21e5d2563";
const LADDER_ROWS_SHA256 = "c4fa70f7d8351f998f4800ff580ddaad0eb09fd2e2f2df7f606ca717e789cd14";
const LADDER_SANCTIONED_HEADS = [
  "f59d18702301155c0c2e7eaecc3442e6cf117123",
  "aa812952efbf5c4ef7152cc7595342092a51b000",
  "3827b7763e870da6a81f8dc3430cfc4be5ab3ec6",
] as const;
const CLOSURE_LABEL = "not computed by decision 0045";
/**
 * The exact phase6-* manifest path set: an entry swap (delete one, add a dummy) must fail, not
 * merely a count change (gate unit review 2026-08-20, concern 2).
 */
const REQUIRED_MANIFEST_PATHS = [
  "phase6-columns-ladder/ladder-BACKUP-20260731-162007.json",
  "phase6-columns-ladder/ladder.json",
  "phase6-crossplatform/arm64-libm-fingerprint.txt",
  "phase6-crossplatform/x64-libm-fingerprint.txt",
  "phase6-domain-escalation/escalation-n80.json",
  "phase6-domain-spot-check/spot-check.json",
  "phase6-host/observation-20260803T033028Z.json",
  "phase6-size-strata/strata.json",
  "phase6-sweep-6995868-cak-a1-superseded/diagram.svg",
  "phase6-sweep-6995868-cak-a1-superseded/points.json",
  "phase6-sweep-6995868-cak-a1-superseded/report.json",
  "phase6-sweep-arm2-STRANDED-8c781b1/points.json",
  "phase6-sweep-arm2/diagram.svg",
  "phase6-sweep-arm2/points.json",
  "phase6-sweep-arm2/regeneration.json",
  "phase6-sweep-arm2/report.json",
  "phase6-sweep-arm3/diagram.svg",
  "phase6-sweep-arm3/points.json",
  "phase6-sweep-arm3/report.json",
  "phase6-sweep/diagram.svg",
  "phase6-sweep/points.json",
  "phase6-sweep/report.json",
  "phase6-three-arm-report/report.md",
  "phase6-throughput-probe/probe.json",
  "phase6-wp2-ladder/report.json",
  "phase6-wp2-ladder/rows.jsonl",
] as const;
/**
 * Code-frozen byte identities for every closure-evidence file whose CONTENT the gate reasons
 * about. The gate unit review (2026-08-20, blocker 1) executed an end-to-end escape: an
 * additive contradiction committed into the manifest-pinned narrative with a self-consistently
 * refreshed pin passed every criterion, because prose checks are presence-only and the pin was
 * attacker-refreshable. Freezing the hash in gate SOURCE means any narrative or arm-artifact
 * edit — legitimate or not — requires a gate code change, which is exactly the auditability the
 * closure demands: this evidence is complete and immutable.
 */
const GATE6_FROZEN_EVIDENCE: Readonly<Record<string, string>> = {
  "phase6-size-strata/strata.json": STRATA_SHA256,
  "phase6-sweep/points.json": "0ed613bce61e44829f722e069a818e0da4981ecd34829b0b49eaba15e11cf89a",
  "phase6-sweep/report.json": "71ae094c38778b0d2c62f3952e4ca641c0bc8f5d91b350248c5c78800830f2a9",
  "phase6-sweep/diagram.svg": "40458703061af5b54d6629484aa84762fb995a15f5443904c3462d2ff5939234",
  "phase6-sweep-arm2/points.json": "b3fb4616d6413520f6505bfb6e1e068544622fee76bbca743f2aa01a7549a520",
  "phase6-sweep-arm2/report.json": "8d02741da298781b0675e1b75dc0b26ccb46a54e65d831ae9117f7f6633a9d42",
  "phase6-sweep-arm2/diagram.svg": "9de7a43ac024f11684ce5cd37a3abe86f0ba9116e2a348630030c9f458dbc7a2",
  "phase6-sweep-arm3/points.json": "08ec59ee47965abab414d339f1c39ce53e5b0dbf01aa6859185a087b243b9d73",
  "phase6-sweep-arm3/report.json": "32d18a1dc3b3b30d3b868b91125d2aa85e18b7e03319d9e9b60b66565c57740e",
  "phase6-sweep-arm3/diagram.svg": "bf229f942b043dc58b9bcca079516694fb1d824b2888c6a6191e09b372468709",
  "phase6-three-arm-report/report.md": "8834cf3745e6eaa642f2a963cfc76cf00a70ba1bc6071d4d2b81e10b29cca8cf",
  "phase6-wp2-ladder/report.json": "fd20f7018dbe2e4a09634c076ff274a017dafe6600321a983836bb8ab1b1ebb7",
  "phase6-wp2-ladder/rows.jsonl": LADDER_ROWS_SHA256,
};
const NARRATIVE_REQUIRED_SENTENCES = [
  "The three arms are reported separately throughout; no-SDAK and SDAK results are never merged.",
  "not computed by\n  decision 0045",
  "cannot establish physical SDAK causality or necessity\nin nature",
  "No arm produces a single columns-regime agreement",
  "does not reproduce\nNakaya's",
  "No Phase 6 evidence label is upgraded to quantitatively validated",
  "in-sample reproduction, not independent validation",
  "deferred to named Phase 7 ownership; they are not executed, not passed, not\n  waived",
] as const;
const LADDER_SCOPE_REQUIRED_CLAUSES = [
  "the S2-ceiling stratum's numerics are UNVERIFIED",
  "A pass authorizes no production campaign (decision 0045)",
  "untested transfer assumption, not a measurement",
] as const;

// ── Capture ─────────────────────────────────────────────────────────────────────────────────

interface Gate6PointRow {
  readonly point: { readonly tempC: number; readonly fraction: number };
  readonly result: {
    readonly aspectRatio: number;
    readonly largestExtent: number;
    readonly domainContact: boolean;
    readonly allConverged: boolean;
  };
  readonly modelClass: string;
  readonly score: string;
  readonly inHeadlineScope: boolean;
  readonly extentFragile: boolean;
}

interface Gate6ArmCapture {
  readonly points: readonly Gate6PointRow[];
  readonly report: Record<string, unknown>;
}

interface Gate6LadderRow {
  readonly rowId: string;
  readonly stopReason: string;
  readonly attachedCount: number;
  readonly aspectRatio: number;
  readonly gitHead: string;
  readonly farField: string;
  readonly rngSeed: number;
}

export interface Gate6EvidenceCapture {
  readonly headCommit: string;
  readonly treeClean: boolean;
  readonly freezeAncestryOk: readonly { readonly commit: string; readonly ancestor: boolean }[];
  /** Every phase6-* manifest entry with its recomputed identity. */
  readonly manifestPhase6: readonly {
    readonly path: string;
    readonly pinnedBytes: number;
    readonly pinnedSha256: string;
    readonly actualBytes: number;
    readonly actualSha256: string;
    readonly tracked: boolean;
  }[];
  readonly strata: Record<string, unknown>;
  readonly strataSha256: string;
  readonly arms: { readonly arm1: Gate6ArmCapture; readonly arm2: Gate6ArmCapture; readonly arm3: Gate6ArmCapture };
  readonly ladderReport: Record<string, unknown>;
  readonly ladderRows: readonly Gate6LadderRow[];
  readonly ladderRowsSha256: string;
  readonly narrative: string;
  readonly narrativeSha256Pinned: boolean;
  readonly decision0045: string;
  readonly progress: string;
  readonly charter: string;
  readonly heldoutLock: { readonly sha256: string; readonly passEligible: unknown };
  readonly sourceCurrencySha256: string;
  readonly parameterTableLfSha256: string;
  readonly supersededCakA1PointsSha256: string;
  readonly liveArm1PointsSha256: string;
  readonly strandedArm2PointsSha256: string;
  readonly liveArm2PointsSha256: string;
}

function gitText(repoRoot: string, args: readonly string[]): string {
  return execFileSync("git", [...args], { cwd: repoRoot, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
}

/** Read a committed evidence file rejecting symlinks and hard links (gate5's discipline). */
function readIndependentArtifact(absolute: string, label: string): Buffer {
  const status = lstatSync(absolute);
  if (!status.isFile() || status.isSymbolicLink()) throw new Error(`GATE6: ${label} is not a regular file`);
  if (status.nlink !== 1) throw new Error(`GATE6: ${label} has ${status.nlink} hard links`);
  const fd = openSync(absolute, "r");
  try {
    const opened = fstatSync(fd);
    if (opened.dev !== status.dev || opened.ino !== status.ino) throw new Error(`GATE6: ${label} was replaced during read`);
    const bytes = Buffer.alloc(opened.size);
    let total = 0;
    while (total < bytes.length) {
      const count = readSync(fd, bytes, total, bytes.length - total, total);
      if (count === 0) break;
      total += count;
    }
    if (total !== bytes.length) throw new Error(`GATE6: ${label} short read`);
    return bytes;
  } finally {
    closeSync(fd);
  }
}

export interface CollectGate6Options {
  /** Test-only seam: the CLI never passes options; tests may pin repository identity. */
  readonly repositoryIdentity?: { readonly headCommit: string; readonly treeClean: boolean };
}

export function collectGate6Evidence(repoRoot: string, options: CollectGate6Options = {}): Gate6EvidenceCapture {
  const root = resolve(repoRoot);
  const read = (rel: string): Buffer => readIndependentArtifact(resolve(root, ...rel.split("/")), rel);
  const readText = (rel: string): string => read(rel).toString("utf8");
  const readJson = (rel: string): Record<string, unknown> => JSON.parse(readText(rel)) as Record<string, unknown>;

  const identity = options.repositoryIdentity ?? {
    headCommit: gitText(root, ["rev-parse", "HEAD"]).trim(),
    treeClean: gitText(root, ["status", "--porcelain=v1", "--untracked-files=all"]).trim() === "",
  };
  if (!/^[0-9a-f]{40}$/.test(identity.headCommit)) throw new Error("GATE6: HEAD is not a 40-hex commit");

  const freezeAncestryOk = [PHASE6_PROTOCOL_FREEZE_COMMIT, PHASE6_ARM2_FREEZE_COMMIT, PHASE6_ARM3_FREEZE_COMMIT].map(
    (commit) => {
      let ancestor = false;
      try {
        execFileSync("git", ["merge-base", "--is-ancestor", commit, identity.headCommit], { cwd: root });
        ancestor = true;
      } catch {
        ancestor = false;
      }
      return { commit, ancestor };
    },
  );

  const manifest = JSON.parse(readText("evidence/MANIFEST.json")) as {
    readonly files: Readonly<Record<string, { readonly bytes: number; readonly sha256: string }>>;
  };
  const trackedSet = new Set(
    gitText(root, ["ls-files", "-z", "--", "evidence/"]).split("\0").filter(Boolean),
  );
  const manifestPhase6 = Object.entries(manifest.files)
    .filter(([path]) => path.startsWith("phase6-"))
    .map(([path, pin]) => {
      const bytes = read(`evidence/${path}`);
      return {
        path,
        pinnedBytes: pin.bytes,
        pinnedSha256: pin.sha256,
        actualBytes: bytes.length,
        actualSha256: sha256Bytes(bytes),
        tracked: trackedSet.has(`evidence/${path}`),
      };
    });

  const strataBytes = read("evidence/phase6-size-strata/strata.json");
  const armCapture = (dir: string): Gate6ArmCapture => ({
    points: (JSON.parse(readText(`evidence/${dir}/points.json`)) as Gate6PointRow[]),
    report: readJson(`evidence/${dir}/report.json`),
  });

  const ladderRowsBytes = read("evidence/phase6-wp2-ladder/rows.jsonl");
  const heldoutLockBytes = read("research/phase6-heldout-candidate-lock.json");
  const heldoutLock = JSON.parse(heldoutLockBytes.toString("utf8")) as {
    readonly gateMeaning?: { readonly passEligible?: unknown };
  };

  const parameterTableLf = readText("docs/libbrecht-parameters.md").replace(/\r\n/g, "\n");

  const narrativePin = manifest.files["phase6-three-arm-report/report.md"];
  const narrativeBytes = read("evidence/phase6-three-arm-report/report.md");

  return {
    headCommit: identity.headCommit,
    treeClean: identity.treeClean,
    freezeAncestryOk,
    manifestPhase6,
    strata: JSON.parse(strataBytes.toString("utf8")) as Record<string, unknown>,
    strataSha256: sha256Bytes(strataBytes),
    arms: {
      arm1: armCapture("phase6-sweep"),
      arm2: armCapture("phase6-sweep-arm2"),
      arm3: armCapture("phase6-sweep-arm3"),
    },
    ladderReport: readJson("evidence/phase6-wp2-ladder/report.json"),
    ladderRows: ladderRowsBytes
      .toString("utf8")
      .trim()
      .split("\n")
      .map((line) => JSON.parse(line) as Gate6LadderRow),
    ladderRowsSha256: sha256Bytes(ladderRowsBytes),
    narrative: narrativeBytes.toString("utf8").replace(/\r\n/g, "\n"),
    narrativeSha256Pinned:
      narrativePin !== undefined &&
      narrativePin.sha256 === sha256Bytes(narrativeBytes) &&
      narrativePin.bytes === narrativeBytes.length,
    decision0045: readText("docs/decisions/0045-bound-phase6-closure-to-a-compute-week.md"),
    progress: readText("docs/PROGRESS.md"),
    charter: readText("project charter.md"),
    heldoutLock: { sha256: sha256Bytes(heldoutLockBytes), passEligible: heldoutLock.gateMeaning?.passEligible },
    sourceCurrencySha256: sha256Bytes(read("research/phase6-source-currency.md")),
    parameterTableLfSha256: sha256Bytes(Buffer.from(parameterTableLf, "utf8")),
    supersededCakA1PointsSha256: sha256Bytes(read("evidence/phase6-sweep-6995868-cak-a1-superseded/points.json")),
    liveArm1PointsSha256: sha256Bytes(read("evidence/phase6-sweep/points.json")),
    strandedArm2PointsSha256: sha256Bytes(read("evidence/phase6-sweep-arm2-STRANDED-8c781b1/points.json")),
    liveArm2PointsSha256: sha256Bytes(read("evidence/phase6-sweep-arm2/points.json")),
  };
}

// ── Pure evaluator ──────────────────────────────────────────────────────────────────────────

export interface Gate6CriterionResult {
  readonly id: string;
  readonly pass: boolean;
  readonly failures: readonly string[];
}

function recomputeArmTallies(capture: Gate6ArmCapture, arm: Phase6Arm) {
  const scored = capture.points;
  const headline = scored.filter((s) => s.inHeadlineScope);
  const common = scored.filter((s) => PHASE6_ARM1.inHeadlineScope(s.point.tempC));
  return {
    headlineAgree: headline.filter((s) => s.score === "agree").length,
    headlineTotal: headline.filter((s) => s.score !== "excluded").length,
    headlineAgreeCommonDenominator: common.filter((s) => PHASE6_ARM1.scoreHabit(s.point.tempC, s.modelClass as never) === "agree").length,
    headlineTotalCommonDenominator: common.filter((s) => PHASE6_ARM1.scoreHabit(s.point.tempC, s.modelClass as never) !== "excluded").length,
    neutralCount: scored.filter((s) => s.modelClass === "neutral").length,
    excludedCount: scored.filter((s) => s.score === "excluded").length,
    extentFragileCount: scored.filter((s) => s.extentFragile).length,
    // Row-level honesty: stored class must re-derive from the stored aspect ratio; a
    // domain-contacted or under-extent row may never carry a non-excluded score; the stored
    // score must re-derive from the arm's registered scoring rule.
    rowDefects: scored.flatMap((s, index) => {
      const defects: string[] = [];
      if (phase6ClassifyHabit(s.result.aspectRatio) !== s.modelClass)
        defects.push(`row ${index}: stored class ${s.modelClass} does not re-derive from aspectRatio ${s.result.aspectRatio}`);
      if ((s.result.domainContact || s.result.largestExtent < 21 || !s.result.allConverged) && s.score !== "excluded")
        defects.push(`row ${index}: invalid run (contact/extent/convergence) carries score ${s.score}`);
      // Bidirectional (review concern 4): an excluded score on a VALID run would launder a
      // scored disagreement out of the denominator.
      if (
        s.score === "excluded" &&
        !s.result.domainContact &&
        s.result.largestExtent >= 21 &&
        s.result.allConverged &&
        phase6ClassifyHabit(s.result.aspectRatio) !== "invalid"
      )
        defects.push(`row ${index}: valid run carries score excluded`);
      if (s.inHeadlineScope !== arm.inHeadlineScope(s.point.tempC))
        defects.push(`row ${index}: stored inHeadlineScope disagrees with the registered scope rule`);
      if (s.score !== "excluded" && s.score !== arm.scoreHabit(s.point.tempC, s.modelClass as never))
        defects.push(`row ${index}: stored score ${s.score} does not re-derive from the registered rule`);
      return defects;
    }),
  };
}

function armCriterion(
  id: string,
  capture: Gate6ArmCapture,
  arm: Phase6Arm,
  reportFields: readonly string[],
  extraChecks: readonly (readonly [string, boolean])[] = [],
): Gate6CriterionResult {
  const failures: string[] = [];
  if (capture.points.length !== 204) failures.push(`expected 204 points, found ${capture.points.length}`);
  const derived = recomputeArmTallies(capture, arm) as unknown as Record<string, unknown>;
  for (const field of reportFields) {
    if (capture.report[field] !== derived[field])
      failures.push(`${field}: report says ${String(capture.report[field])}, bytes re-derive ${String(derived[field])}`);
  }
  failures.push(...(derived.rowDefects as string[]));
  for (const [label, ok] of extraChecks) if (!ok) failures.push(label);
  return { id, pass: failures.length === 0, failures };
}

export function evaluateGate6(capture: Gate6EvidenceCapture): readonly Gate6CriterionResult[] {
  const results: Gate6CriterionResult[] = [];
  const simple = (id: string, checks: readonly (readonly [string, boolean])[]): void => {
    const failures = checks.filter(([, ok]) => !ok).map(([label]) => label);
    results.push({ id, pass: failures.length === 0, failures });
  };

  simple("G6-TREE-CLEAN", [["tracked tree must be clean at gate time", capture.treeClean]]);
  simple(
    "G6-FREEZE-ANCESTRY",
    capture.freezeAncestryOk.map((entry) => [`freeze commit ${entry.commit.slice(0, 7)} must be an ancestor of HEAD`, entry.ancestor] as const),
  );
  const presentPaths = capture.manifestPhase6.map((entry) => entry.path).sort();
  simple(
    "G6-MANIFEST-PHASE6",
    [
      [
        "phase6-* manifest paths are exactly the required set",
        JSON.stringify(presentPaths) === JSON.stringify([...REQUIRED_MANIFEST_PATHS]),
      ],
      ...capture.manifestPhase6.map(
        (entry) =>
          [
            `${entry.path}: tracked regular file matching its pin`,
            entry.tracked && entry.actualBytes === entry.pinnedBytes && entry.actualSha256 === entry.pinnedSha256,
          ] as const,
      ),
      ...capture.manifestPhase6
        .filter((entry) => entry.path in GATE6_FROZEN_EVIDENCE)
        .map(
          (entry) =>
            [
              `${entry.path}: bytes match the gate's code-frozen identity`,
              entry.actualSha256 === GATE6_FROZEN_EVIDENCE[entry.path],
            ] as const,
        ),
      [
        "every code-frozen identity is present in the manifest capture",
        Object.keys(GATE6_FROZEN_EVIDENCE).every((path) => presentPaths.includes(path)),
      ],
    ],
  );

  const s1 = ((capture.strata.strata as Record<string, unknown>)?.s1ObservedInitialSize as Record<string, unknown>)?.unionIntervalUm;
  const s2 = ((capture.strata.strata as Record<string, unknown>)?.s2GrownMassEquivalentSize300s as Record<string, unknown>)?.unionCentralIntervalUm;
  const lockRef = (capture.strata.lockProvenance as Record<string, unknown>)?.textSha256;
  simple("G6-STRATA", [
    ["strata.json bytes match the frozen identity", capture.strataSha256 === STRATA_SHA256],
    ["S1 union interval is the frozen value", JSON.stringify(s1) === JSON.stringify([5.8999999999999995, 12.1])],
    ["S2 union central interval is the frozen value", JSON.stringify(s2) === JSON.stringify([9.472732790460505, 20.459585775743665])],
    ["strata embeds the held-out lock identity", lockRef === HELDOUT_LOCK_SHA256],
  ]);

  const commonFields = ["headlineAgree", "headlineTotal", "neutralCount", "excludedCount", "extentFragileCount"];
  const cdFields = [...commonFields, "headlineAgreeCommonDenominator", "headlineTotalCommonDenominator"];
  results.push(
    armCriterion("G6-ARM1-CAK", capture.arms.arm1, PHASE6_ARM1, commonFields, [
      ["arm-1 report carries the protocol hash verified at its evidence commit", capture.arms.arm1.report.protocolSha256 === PHASE6_PROTOCOL_SHA256_AT_ARM1_EVIDENCE],
    ]),
    armCriterion("G6-ARM2-M1", capture.arms.arm2, PHASE6_ARM2, cdFields, [
      ["arm-2 report names its arm", capture.arms.arm2.report.arm === "arm2-sdak-m1"],
      ["arm-2 report names paramSet M1", capture.arms.arm2.report.paramSet === "M1"],
      ["arm-2 report carries the gated values hash", capture.arms.arm2.report.valuesSha256 === PHASE6_ARM2_VALUES_SHA256],
    ]),
    armCriterion("G6-ARM3-ABLATION", capture.arms.arm3, PHASE6_ARM3, cdFields, [
      ["arm-3 report names its arm", capture.arms.arm3.report.arm === "arm3-no-dip-ablation"],
      ["arm-3 report names paramSet M1_NO_DIP_ABLATION", capture.arms.arm3.report.paramSet === "M1_NO_DIP_ABLATION"],
      ["arm-3 report carries the gated values hash", capture.arms.arm3.report.valuesSha256 === PHASE6_ARM3_VALUES_SHA256],
    ]),
  );

  // The ladder: bytes bound by hash, verdict fields intact, scope clauses present, heads
  // sanctioned, fixed configuration echoed, and the no-pass RE-DERIVED from the rows (a forged
  // verdict field cannot stand in for a recomputed one).
  const ladderFailures: string[] = [];
  if (capture.ladderRowsSha256 !== LADDER_ROWS_SHA256) ladderFailures.push("rows.jsonl bytes do not match the frozen identity");
  if (capture.ladderReport.rowsSha256 !== capture.ladderRowsSha256) ladderFailures.push("report.rowsSha256 does not bind the rows bytes");
  if (capture.ladderReport.overallVerdict !== "no-pass") ladderFailures.push("report.overallVerdict is not the published no-pass");
  if (capture.ladderReport.overallNoPassClass !== "criterion") ladderFailures.push("report.overallNoPassClass is not criterion");
  if (capture.ladderRows.length !== 80) ladderFailures.push(`expected 80 ladder rows, found ${capture.ladderRows.length}`);
  const scope = String(capture.ladderReport.scopeStatement ?? "");
  for (const clause of LADDER_SCOPE_REQUIRED_CLAUSES)
    if (!scope.includes(clause)) ladderFailures.push(`scope statement is missing: "${clause}"`);
  const sanctioned = new Set<string>(LADDER_SANCTIONED_HEADS);
  for (const row of capture.ladderRows) {
    if (!sanctioned.has(row.gitHead)) ladderFailures.push(`${row.rowId}: unsanctioned head ${row.gitHead}`);
    if (row.farField !== "monopole-matched") ladderFailures.push(`${row.rowId}: farField ${row.farField} violates the frozen configuration`);
    if (row.rngSeed !== 1) ladderFailures.push(`${row.rowId}: rngSeed ${row.rngSeed} violates the frozen configuration`);
  }
  // Compact re-derivation of the selection function: any non-size-target row, or any registered
  // comparison outside 0.5%/class, forces no-pass. The full independent verifier is suite-pinned
  // separately; here the gate only needs to confirm the published no-pass re-derives.
  const byId = new Map(capture.ladderRows.map((row) => [row.rowId, row]));
  let anyFailure = capture.ladderRows.some((row) => row.stopReason !== "size-target");
  const compare = (a: Gate6LadderRow | undefined, b: Gate6LadderRow | undefined): void => {
    if (a === undefined || b === undefined) {
      anyFailure = true;
      return;
    }
    const rel = Math.abs(b.attachedCount - a.attachedCount) / a.attachedCount;
    if (rel > 0.005 || phase6ClassifyHabit(a.aspectRatio) !== phase6ClassifyHabit(b.aspectRatio)) anyFailure = true;
  };
  const points = ["-31C-f0.6", "-13C-f0.15", "-6C-f0.15", "-27C-f0.15"];
  for (const arm of ["M1", "CAK"])
    for (const pt of points) {
      for (const [dx, rungs] of [["0.7", [48, 64, 80]], ["0.35", [96, 112, 128]]] as const)
        for (let i = 0; i + 1 < rungs.length; i += 1)
          compare(byId.get(`dom-${dx}-n${rungs[i]}@${pt}-${arm}`), byId.get(`dom-${dx}-n${rungs[i + 1]}@${pt}-${arm}`));
      for (const aux of ["cfl0.05", "relaxTol1e-10", "seed16", "seed18"])
        compare(byId.get(`dom-0.35-n96@${pt}-${arm}`), byId.get(`aux-${aux}@${pt}-${arm}`));
    }
  if (!anyFailure) ladderFailures.push("the rows re-derive a PASS, contradicting the published no-pass verdict");
  results.push({ id: "G6-LADDER", pass: ladderFailures.length === 0, failures: ladderFailures });

  simple("G6-NARRATIVE", [
    ["the three-arm narrative is pinned in the manifest", capture.narrativeSha256Pinned],
    ...NARRATIVE_REQUIRED_SENTENCES.map(
      (sentence) => [`narrative must state: "${sentence.replace(/\n\s*/g, " ").slice(0, 60)}…"`, capture.narrative.includes(sentence)] as const,
    ),
    ["narrative states arm-1 CAK 3/90", capture.narrative.includes("**3/90**")],
    ["narrative states arm-2 M1 54/78 and 54/90", capture.narrative.includes("**54/78**") && capture.narrative.includes("**54/90**")],
    ["narrative states arm-3 5/78 and 5/90", capture.narrative.includes("**5/78**") && capture.narrative.includes("**5/90**")],
  ]);

  simple("G6-CLOSURE-LABELS", [
    ["decision 0045 carries the canonical closure sentence", capture.decision0045.includes(CLOSURE_LABEL)],
    ["PROGRESS carries the closure label", capture.progress.includes(CLOSURE_LABEL)],
    ["PROGRESS still distinguishes measured-only counts from the registered verdict", capture.progress.includes("They are not the registered conservative-intersection verdict")],
    ["the charter carries the v1.22 closure clause", capture.charter.includes(CLOSURE_LABEL)],
  ]);

  simple("G6-DEFERRALS", [
    ["held-out candidate lock bytes match decision 0043's identity", capture.heldoutLock.sha256 === HELDOUT_LOCK_SHA256],
    ["the lock remains passEligible=false", capture.heldoutLock.passEligible === false],
    ["source-currency record bytes match decision 0043's identity", capture.sourceCurrencySha256 === SOURCE_CURRENCY_SHA256],
    ["narrative names the deferrals as unexecuted Phase 7 property", capture.narrative.includes("decision\n  0044) are deferred")],
  ]);

  simple("G6-PARAMETER-TABLE", [
    ["the current parameter table's LF-normalized bytes match ADR 0040's pin", capture.parameterTableLfSha256 === PHASE6_CURRENT_PARAMETER_TABLE_SHA256],
  ]);

  simple("G6-HISTORY", [
    ["the superseded CAK_A1 artifact remains distinct from live arm 1", capture.supersededCakA1PointsSha256 !== capture.liveArm1PointsSha256],
    ["the stranded arm-2 points remain byte-identical to the live arm-2 points", capture.strandedArm2PointsSha256 === capture.liveArm2PointsSha256],
  ]);

  return results;
}

// ── Command wrapper ─────────────────────────────────────────────────────────────────────────

export interface Gate6Report {
  readonly gate: "phase6-wp8-final-gate";
  readonly headCommit: string;
  readonly criteria: readonly Gate6CriterionResult[];
  readonly gatePass: true;
  readonly exitCode: 0;
}

export function runGate6(repoRoot: string = process.cwd()): Gate6Report {
  const capture = collectGate6Evidence(repoRoot);
  const criteria = evaluateGate6(capture);
  const failing = criteria.filter((criterion) => !criterion.pass);
  if (failing.length > 0) {
    const detail = failing
      .map((criterion) => `${criterion.id}: ${criterion.failures.slice(0, 5).join("; ")}${criterion.failures.length > 5 ? ` (+${criterion.failures.length - 5} more)` : ""}`)
      .join("\n");
    throw new Error(`GATE6: ${failing.length} criterion(s) failed\n${detail}`);
  }
  const report: Gate6Report = {
    gate: "phase6-wp8-final-gate",
    headCommit: capture.headCommit,
    criteria,
    gatePass: true,
    exitCode: 0,
  };
  const absolute = resolve(repoRoot, ...GATE6_REPORT_PATH.split("/"));
  mkdirSync(resolve(repoRoot, "out", "phase6"), { recursive: true });
  const bytes = canonicalJsonBytes(report as unknown as Parameters<typeof canonicalJsonBytes>[0]);
  writeFileSync(absolute, bytes, { flag: "w" });
  const reread = readFileSync(absolute);
  if (sha256Bytes(reread) !== sha256Bytes(bytes)) throw new Error("GATE6: report readback mismatch");
  return report;
}

export function gate6(): 0 {
  const report = runGate6();
  console.log(`GATE6 HEAD ${report.headCommit}`);
  for (const criterion of report.criteria) console.log(`GATE6 CRITERION ${criterion.id}: pass`);
  console.log(`GATE6 REPORT ${GATE6_REPORT_PATH}`);
  console.log("GATE6 EXIT STATUS: 0");
  return 0;
}
