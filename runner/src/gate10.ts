import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { closeSync, fsyncSync, lstatSync, mkdirSync, openSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, relative, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";

import { canonicalJson, strictJsonSnapshot, type StrictJson } from "./gate4-evidence.ts";

type JsonObject = { readonly [key: string]: StrictJson };

const REPORT_PATH = "evidence/phase10-closure-v1/report.json";
const SUITE_PATH = "evidence/phase10-closure-v1/npm-test.json";
const REVIEW_PATH = "evidence/phase10-closure-v1/review.json";
const GATE_PATH = "evidence/phase10-closure-v1/gate10-report.json";
const MANIFEST_PATH = "evidence/MANIFEST.json";
const EXPECTED_BRANCH = "phase10/evidence-verification";
const EXPECTED_RUNTIME = "v24.13.1";
const REPORT_FIELDS = Object.freeze([
  "schema", "phase", "closedOn", "producerCommit", "packageOutcome", "completionBasis", "workstreams",
  "c0vLayers", "c0vAggregate", "unresolvedOperands", "downstreamCandidates", "priorPhaseLabels", "inputs",
  "claimBoundary", "limits",
]);
const CHECK_IDS = Object.freeze([
  "phase10-selected-workstreams-terminal",
  "phase10-b-refusal-completion-basis",
  "phase10-c0v-incomplete-no-credit",
  "phase10-no-downstream-or-validation-credit",
  "phase10-prior-labels-preserved",
  "phase10-exact-suite-pass",
  "phase10-non-author-review-pass",
]);

function fail(message: string): never {
  throw new Error(`GATE10 FAILED: ${message}`);
}

function safePath(root: string, path: string): string {
  if (isAbsolute(path) || path.includes("\\") || path.startsWith("/") ||
      path.split("/").some((part) => part === "" || part === "." || part === "..")) fail(`unsafe path ${path}`);
  const absolute = resolve(root, path);
  const displacement = relative(root, absolute);
  if (displacement === "" || displacement === ".." || displacement.startsWith(`..${sep}`) || isAbsolute(displacement)) {
    fail(`path escapes repository root: ${path}`);
  }
  return absolute;
}

function bytes(root: string, path: string): Uint8Array {
  const absolute = safePath(root, path);
  const status = lstatSync(absolute);
  if (!status.isFile() || status.isSymbolicLink()) fail(`${path} is not an ordinary file`);
  return new Uint8Array(readFileSync(absolute));
}

function sha256(value: Uint8Array): string {
  return createHash("sha256").update(value).digest("hex");
}

function identity(root: string, path: string): JsonObject {
  const value = bytes(root, path);
  return strictJsonSnapshot({ path, byteLength: value.byteLength, sha256: sha256(value) }) as JsonObject;
}

function json(root: string, path: string): JsonObject {
  try {
    const value = strictJsonSnapshot(JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes(root, path))) as unknown);
    if (value === null || typeof value !== "object" || Array.isArray(value)) fail(`${path} must be an object`);
    return value as JsonObject;
  } catch (error) {
    fail(`${path} is invalid: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function exactKeys(value: JsonObject, keys: readonly string[], label: string): void {
  if (canonicalJson(Object.keys(value).sort()) !== canonicalJson([...keys].sort())) fail(`${label} fields differ`);
}

function asObjects(value: StrictJson, label: string): readonly JsonObject[] {
  if (!Array.isArray(value)) fail(`${label} must be an array`);
  return value.map((entry) => {
    if (entry === null || typeof entry !== "object" || Array.isArray(entry)) fail(`${label} contains a non-object`);
    return entry as JsonObject;
  });
}

function assertClaimBoundary(value: StrictJson): void {
  const row = value as JsonObject;
  if (row.scopeCensusOnlyForAS !== true || row.allOpenedSourceValuesArePhase10DevelopmentEvidence !== true ||
      row.priorPhaseLabelsAndArtifactsPreserved !== true) fail("claim boundary positive fields differ");
  for (const [key, entry] of Object.entries(row)) {
    if (!["scopeCensusOnlyForAS", "allOpenedSourceValuesArePhase10DevelopmentEvidence", "priorPhaseLabelsAndArtifactsPreserved"].includes(key) && entry !== false) {
      fail(`claim boundary ${key} must be false`);
    }
  }
}

function assertManifestPins(root: string, paths: readonly string[]): void {
  const manifest = json(root, MANIFEST_PATH);
  const files = manifest.files as JsonObject;
  for (const path of paths) {
    const relativePath = path.replace(/^evidence\//u, "");
    const pinned = files[relativePath] as JsonObject | undefined;
    const actual = identity(root, path);
    if (pinned === undefined || pinned.bytes !== actual.byteLength || pinned.sha256 !== actual.sha256) {
      fail(`${path} is not pinned exactly`);
    }
  }
}

function evaluate(root: string): { readonly report: JsonObject; readonly checks: StrictJson; readonly dispositions: StrictJson } {
  const report = json(root, REPORT_PATH);
  exactKeys(report, REPORT_FIELDS, "package report");
  if (report.schema !== "phase10-final-package-report-v1" || report.phase !== 10 ||
      report.packageOutcome !== "complete-negative" || report.completionBasis !== "terminal-b-source-refusal") {
    fail("package completion identity differs");
  }
  const workstreams = asObjects(report.workstreams, "workstreams");
  const workstreamIds = workstreams.map((row) => row.workstreamId);
  if (canonicalJson(workstreamIds) !== canonicalJson(["A-P", "A-S", "A-I", "B", "C0", "C0V"])) fail("workstream roster differs");
  const b = workstreams.find((row) => row.workstreamId === "B")!;
  const c0v = workstreams.find((row) => row.workstreamId === "C0V")!;
  if (b.completion !== "refusal" || !Array.isArray(b.branchOutcomes) || b.branchOutcomes.length !== 6) fail("B outcome differs");
  if (c0v.completion !== "maker-terminated-incomplete" || c0v.scientificDisposition !== "incomplete-no-pass") fail("C0V workstream differs");

  const layers = asObjects(report.c0vLayers, "C0V layers");
  if (layers.length !== 3 || layers.some((row) => row.s6PacketCredit !== false)) fail("C0V layer credit differs");
  const radial = layers.find((row) => row.layerId === "C0V-RADIAL");
  const moving = layers.find((row) => row.layerId === "C0V-MOVING");
  const staticLayer = layers.find((row) => row.layerId === "C0V-STATIC");
  if (radial?.productionDisposition !== "not-executed-infrastructure-stopped" || radial.scientificDisposition !== "no-verdict" ||
      moving?.s5Disposition !== "reference-discrepancy-refusal" || moving.scientificDisposition !== "refusal" ||
      staticLayer?.s5Disposition !== "preimplementation-reference-refusal" || staticLayer.scientificDisposition !== "refusal") {
    fail("C0V layer dispositions differ");
  }
  const aggregate = report.c0vAggregate as JsonObject;
  if (aggregate.disposition !== "incomplete-no-pass" || aggregate.packetCredit !== false || aggregate.pass !== false) fail("C0V aggregate differs");
  if (!Array.isArray(report.downstreamCandidates) || report.downstreamCandidates.length !== 0) fail("downstream candidates are not empty");
  const labels = asObjects(report.priorPhaseLabels, "prior phase labels");
  if (canonicalJson(labels.map((row) => [row.phase, row.label, row.artifactMutationAuthorized])) !== canonicalJson([
    [6, "complete", false], [7, "not-started-independently-eligible", false],
    [8, "complete-8a-plus-8b", false], [9, "complete-development-only", false],
  ])) fail("prior phase labels differ");
  assertClaimBoundary(report.claimBoundary);

  const bReceipt = json(root, "evidence/phase10-obligation-preflight-v1/packets/b-aggregate/terminal-receipt.json");
  const bReport = json(root, "evidence/phase10-observation-bridges-v1/report.json");
  const radialReference = json(root, "evidence/phase10-numerical-verification-v1/c0v-radial-reference.json");
  const movingReference = json(root, "evidence/phase10-numerical-verification-v1/c0v-moving-reference.json");
  const staticRefusal = json(root, "evidence/phase10-numerical-verification-v1/c0v-static-reference-refusal.json");
  if (bReceipt.terminalState !== "refusal" || !Array.isArray(bReport.terminalBranchOutcomes) || bReport.terminalBranchOutcomes.length !== 6) fail("B completion was not rederived");
  if (radialReference.disposition !== "reference-frozen" || movingReference.disposition !== "reference-discrepancy-refusal" ||
      staticRefusal.branch !== "reference-refusal") fail("C0V S5 bindings differ");

  const suite = json(root, SUITE_PATH);
  exactKeys(suite, ["schema", "command", "startedOn", "endedOn", "exitCode", "headCommit", "testFiles", "testsPassed", "testsSkipped", "verdict"], "suite receipt");
  if (suite.schema !== "phase10-final-suite-receipt-v1" || suite.command !== "npm test" || suite.exitCode !== 0 || suite.verdict !== "pass" ||
      !/^[0-9a-f]{40}$/u.test(String(suite.headCommit))) fail("exact suite receipt differs");

  const review = json(root, REVIEW_PATH);
  exactKeys(review, ["schema", "reviewId", "reviewerModel", "reviewDate", "artifactsInspected", "findings", "unresolvedBlockers", "limits", "verdict"], "review receipt");
  if (review.schema !== "phase10-final-review-v1" || typeof review.reviewerModel !== "string" || review.reviewerModel.length === 0 ||
      !Array.isArray(review.unresolvedBlockers) || review.unresolvedBlockers.length !== 0 || review.verdict !== "pass") fail("non-author review differs");

  assertManifestPins(root, [REPORT_PATH, SUITE_PATH, REVIEW_PATH]);
  const checks = strictJsonSnapshot(CHECK_IDS.map((checkId) => ({ checkId, verdict: "pass", reasons: [] })));
  const dispositions = strictJsonSnapshot({ package: "complete-negative", B: "refusal", C0: "criterion-no-pass", C0V: "incomplete-no-pass", radial: "no-verdict", moving: "refusal", static: "refusal" });
  return Object.freeze({ report, checks, dispositions });
}

function gateReport(root: string, headCommit: string): StrictJson {
  const result = evaluate(root);
  return strictJsonSnapshot({
    schema: "phase10-final-gate10-report-v1",
    gateId: "gate10",
    headCommit,
    inputArtifacts: [REPORT_PATH, SUITE_PATH, REVIEW_PATH].map((path) => identity(root, path)),
    packageCompletion: "complete-negative",
    scientificDispositions: result.dispositions,
    priorPhaseLabelsPreserved: true,
    claimBoundary: result.report.claimBoundary,
    checks: result.checks,
    evaluatorVerdict: "pass",
    limits: [
      "C0V remains incomplete/non-PASS and radial has no production verdict.",
      "Phase 10 grants no validation or prior-phase credit and authorizes no downstream work.",
    ],
  });
}

function pretty(value: StrictJson): Uint8Array {
  return new TextEncoder().encode(`${JSON.stringify(value, null, 2)}\n`);
}

export function publishGate10(rootInput: string): StrictJson {
  const root = resolve(rootInput);
  if (process.version !== EXPECTED_RUNTIME) fail(`runtime ${process.version} differs`);
  const branch = execFileSync("git", ["branch", "--show-current"], { cwd: root, encoding: "utf8" }).trim();
  const status = execFileSync("git", ["status", "--porcelain=v1", "--untracked-files=all"], { cwd: root, encoding: "utf8" }).trim();
  if (branch !== EXPECTED_BRANCH || status !== "") fail("gate receipt publication requires a clean Phase 10 worktree");
  const head = execFileSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).trim();
  const output = pretty(gateReport(root, head));
  const absolute = safePath(root, GATE_PATH);
  mkdirSync(dirname(absolute), { recursive: true });
  const fd = openSync(absolute, "wx");
  try { writeFileSync(fd, output); fsyncSync(fd); } finally { closeSync(fd); }
  return strictJsonSnapshot({ state: "gate10-report-published", output: { path: GATE_PATH, byteLength: output.byteLength, sha256: sha256(output) } });
}

export function gate10(rootInput = process.cwd()): number {
  const root = resolve(rootInput);
  const result = evaluate(root);
  const receipt = json(root, GATE_PATH);
  exactKeys(receipt, ["schema", "gateId", "headCommit", "inputArtifacts", "packageCompletion", "scientificDispositions", "priorPhaseLabelsPreserved", "claimBoundary", "checks", "evaluatorVerdict", "limits"], "gate10 receipt");
  if (receipt.schema !== "phase10-final-gate10-report-v1" || receipt.gateId !== "gate10" || receipt.packageCompletion !== "complete-negative" ||
      receipt.evaluatorVerdict !== "pass" || receipt.priorPhaseLabelsPreserved !== true || canonicalJson(receipt.checks) !== canonicalJson(result.checks) ||
      canonicalJson(receipt.scientificDispositions) !== canonicalJson(result.dispositions)) fail("gate10 receipt differs from rederivation");
  const expectedInputs = [REPORT_PATH, SUITE_PATH, REVIEW_PATH].map((path) => identity(root, path));
  if (canonicalJson(receipt.inputArtifacts) !== canonicalJson(expectedInputs)) fail("gate10 input identities differ");
  assertManifestPins(root, [REPORT_PATH, SUITE_PATH, REVIEW_PATH, GATE_PATH]);
  console.log("GATE10 PASS - Phase 10 package complete-negative; B refusal is the completion basis.");
  console.log("C0V INCOMPLETE/NO-PASS - radial not executed; moving/static retain S5 refusals; no S6 packet credit.");
  console.log("No validation, prior-phase credit, target score, solver change, C1-C5, or E/F/H execution.");
  return 0;
}

async function main(): Promise<void> {
  try {
    const argv = process.argv.slice(2);
    if (argv.length !== 3 || argv[0] !== "publish" || argv[1] !== "--repository-root") fail("usage: publish --repository-root <path>");
    const root = realpathSync.native(resolve(argv[2]!));
    console.log(JSON.stringify(publishGate10(root)));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) await main();
