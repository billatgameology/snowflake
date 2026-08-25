import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { closeSync, fsyncSync, lstatSync, mkdirSync, openSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, relative, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";

import { strictJsonSnapshot, type StrictJson } from "./gate4-evidence.ts";

type JsonObject = { readonly [key: string]: StrictJson };

const EXPECTED_BRANCH = "phase10/evidence-verification";
const EXPECTED_RUNTIME = "v24.13.1";
const OUTPUT_PATH = "evidence/phase10-closure-v1/report.json";
const INPUT_PATHS = Object.freeze([
  "docs/decisions/0054-close-phase10-after-maker-terminated-c0v-infrastructure.md",
  "evidence/phase10-numerical-verification-v1/c0-report.json",
  "evidence/phase10-numerical-verification-v1/c0-verification.json",
  "evidence/phase10-numerical-verification-v1/c0v-moving-reference.json",
  "evidence/phase10-numerical-verification-v1/c0v-radial-reference.json",
  "evidence/phase10-numerical-verification-v1/c0v-static-reference-refusal.json",
  "evidence/phase10-obligation-preflight-v1/packets/a-i/terminal-receipt.json",
  "evidence/phase10-obligation-preflight-v1/packets/a-p/terminal-receipt.json",
  "evidence/phase10-obligation-preflight-v1/packets/a-s/terminal-receipt.json",
  "evidence/phase10-obligation-preflight-v1/packets/b-aggregate/terminal-receipt.json",
  "evidence/phase10-obligation-preflight-v1/packets/c0-publish/terminal-receipt.json",
  "evidence/phase10-obligation-preflight-v6/packets/a-p-c0v-s6/terminal-receipt.json",
  "evidence/phase10-observation-bridges-v1/report.json",
  "evidence/phase10-observation-bridges-v1/return-proposals.json",
  "evidence/phase10-observation-bridges-v1/verification.json",
  "evidence/phase10-scope-intake-v1/intake-report.json",
  "evidence/phase10-scope-intake-v1/scope-report.json",
] as const);

const CLAIM_BOUNDARY = Object.freeze({
  scopeCensusOnlyForAS: true,
  allOpenedSourceValuesArePhase10DevelopmentEvidence: true,
  quantitativeValidationEarned: false,
  phase7CreditEarned: false,
  phase8CreditEarned: false,
  phase9CreditEarned: false,
  heldOutComparisonExecuted: false,
  targetScoreProduced: false,
  solverPhysicsChanged: false,
  c1ThroughC5RowsProduced: false,
  habitRowsProduced: false,
  eObservationOperatorImplemented: false,
  fExternalRequestWrittenOrSent: false,
  hTransportImplemented: false,
  downstreamExecutionAuthorized: false,
  priorPhaseLabelsAndArtifactsPreserved: true,
} as const);

function fail(message: string): never {
  throw new Error(`Phase 10 final package refused: ${message}`);
}

function safePath(root: string, path: string): string {
  if (isAbsolute(path) || path.includes("\\") || path.startsWith("/") ||
      path.split("/").some((part) => part === "" || part === "." || part === "..")) {
    fail(`unsafe path ${path}`);
  }
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

function json(root: string, path: string): JsonObject {
  try {
    const value = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes(root, path))) as unknown;
    const snapshot = strictJsonSnapshot(value);
    if (snapshot === null || typeof snapshot !== "object" || Array.isArray(snapshot)) fail(`${path} is not an object`);
    return snapshot as JsonObject;
  } catch (error) {
    fail(`${path} is not strict JSON: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function sha256(value: Uint8Array): string {
  return createHash("sha256").update(value).digest("hex");
}

function identity(root: string, path: string): StrictJson {
  const value = bytes(root, path);
  return strictJsonSnapshot({ path, byteLength: value.byteLength, sha256: sha256(value) });
}

function receipt(root: string, path: string, packetId: string, terminalState: string): void {
  const value = json(root, path);
  if (value.packetId !== packetId || value.terminalState !== terminalState) {
    fail(`${path} does not bind ${packetId}/${terminalState}`);
  }
}

function assertInputs(root: string): {
  readonly bReport: JsonObject;
  readonly bReturns: JsonObject;
  readonly c0Report: JsonObject;
  readonly radial: JsonObject;
  readonly moving: JsonObject;
  readonly staticRefusal: JsonObject;
} {
  receipt(root, "evidence/phase10-obligation-preflight-v1/packets/a-p/terminal-receipt.json", "a-p", "pass");
  receipt(root, "evidence/phase10-obligation-preflight-v1/packets/a-s/terminal-receipt.json", "a-s", "pass");
  receipt(root, "evidence/phase10-obligation-preflight-v1/packets/a-i/terminal-receipt.json", "a-i", "complete");
  receipt(root, "evidence/phase10-obligation-preflight-v1/packets/b-aggregate/terminal-receipt.json", "b-aggregate", "refusal");
  receipt(root, "evidence/phase10-obligation-preflight-v1/packets/c0-publish/terminal-receipt.json", "c0-publish", "complete");
  const s6 = json(root, "evidence/phase10-obligation-preflight-v6/packets/a-p-c0v-s6/terminal-receipt.json");
  if (s6.packetId !== "a-p-c0v-s6" || s6.terminalState !== "complete" || s6.acceptedPacketCredit !== true) {
    fail("supplemental C0V A-P is not accepted complete");
  }

  const bReport = json(root, "evidence/phase10-observation-bridges-v1/report.json");
  const bReturns = json(root, "evidence/phase10-observation-bridges-v1/return-proposals.json");
  const c0Report = json(root, "evidence/phase10-numerical-verification-v1/c0-report.json");
  const radial = json(root, "evidence/phase10-numerical-verification-v1/c0v-radial-reference.json");
  const moving = json(root, "evidence/phase10-numerical-verification-v1/c0v-moving-reference.json");
  const staticRefusal = json(root, "evidence/phase10-numerical-verification-v1/c0v-static-reference-refusal.json");

  if (!Array.isArray(bReport.terminalBranchOutcomes) || bReport.terminalBranchOutcomes.length !== 6) fail("B branch census differs");
  if (!Array.isArray(bReturns.proposals) || bReturns.proposals.length !== 6 ||
      bReturns.proposals.some((value) => (value as JsonObject).candidate !== null) || bReturns.authorization !== "none") {
    fail("B return-only boundary differs");
  }
  const c0Disposition = c0Report.scientificDisposition as JsonObject;
  if (c0Disposition.status !== "diagnostic-complete" || c0Disposition.solverExecuted !== false ||
      c0Disposition.targetScoreProduced !== false || c0Disposition.quantitativeValidationClaim !== false) {
    fail("C0 disposition differs");
  }
  if (radial.disposition !== "reference-frozen" || (radial.comparison as JsonObject).observedOutcome !== "pass") {
    fail("radial S5 reference is not accepted");
  }
  if (moving.disposition !== "reference-discrepancy-refusal" || (moving.comparison as JsonObject).observedOutcome !== "fail") {
    fail("moving S5 discrepancy differs");
  }
  if (staticRefusal.branch !== "reference-refusal" || (staticRefusal.independentCheck as JsonObject).verdict !== "pass") {
    fail("static S5 refusal differs");
  }
  return Object.freeze({ bReport, bReturns, c0Report, radial, moving, staticRefusal });
}

export function derivePhase10FinalPackageReport(rootInput: string, producerCommit: string, closedOn = "2026-08-25"): StrictJson {
  const root = resolve(rootInput);
  if (!/^[0-9a-f]{40}$/u.test(producerCommit)) fail("producer commit differs");
  const inputs = assertInputs(root);
  const branchOutcomes = inputs.bReport.terminalBranchOutcomes as readonly StrictJson[];
  const unresolvedOperands = inputs.bReport.unresolvedOperands as readonly StrictJson[];
  return strictJsonSnapshot({
    schema: "phase10-final-package-report-v1",
    phase: 10,
    closedOn,
    producerCommit,
    packageOutcome: "complete-negative",
    completionBasis: "terminal-b-source-refusal",
    workstreams: [
      { workstreamId: "A-P", completion: "pass", scientificDisposition: "obligation-completeness-only" },
      { workstreamId: "A-S", completion: "pass", scientificDisposition: "scope-overlay-only" },
      { workstreamId: "A-I", completion: "complete", scientificDisposition: "terminal-source-intake" },
      { workstreamId: "B", completion: "refusal", scientificDisposition: "six-terminal-negative-branches", branchOutcomes },
      { workstreamId: "C0", completion: "complete", scientificDisposition: "criterion-no-pass" },
      { workstreamId: "C0V", completion: "maker-terminated-incomplete", scientificDisposition: "incomplete-no-pass" },
    ],
    c0vLayers: [
      { layerId: "C0V-RADIAL", s5Disposition: "reference-frozen", productionDisposition: "not-executed-infrastructure-stopped", scientificDisposition: "no-verdict", s6PacketCredit: false },
      { layerId: "C0V-MOVING", s5Disposition: "reference-discrepancy-refusal", productionDisposition: "not-executed", scientificDisposition: "refusal", s6PacketCredit: false },
      { layerId: "C0V-STATIC", s5Disposition: "preimplementation-reference-refusal", productionDisposition: "not-executed", scientificDisposition: "refusal", s6PacketCredit: false },
    ],
    c0vAggregate: { disposition: "incomplete-no-pass", packetCredit: false, pass: false },
    unresolvedOperands,
    downstreamCandidates: [],
    priorPhaseLabels: [
      { phase: 6, label: "complete", artifactMutationAuthorized: false },
      { phase: 7, label: "not-started-independently-eligible", artifactMutationAuthorized: false },
      { phase: 8, label: "complete-8a-plus-8b", artifactMutationAuthorized: false },
      { phase: 9, label: "complete-development-only", artifactMutationAuthorized: false },
    ],
    inputs: INPUT_PATHS.map((path) => identity(root, path)),
    claimBoundary: CLAIM_BOUNDARY,
    limits: [
      "Phase 10 completed on the terminal B source refusal; completion is not a scientific PASS.",
      "C0V is incomplete/non-PASS: radial production did not run and no S6 layer or aggregate packet earned credit.",
      "Moving and static retain only their pinned S5 refusal meanings; no infrastructure stop is a scientific result.",
      "No C1-C5 row, habit row, target score, held-out comparison, solver change, E/F/H execution, validation label, or prior-phase credit was produced.",
    ],
  });
}

function pretty(value: StrictJson): Uint8Array {
  return new TextEncoder().encode(`${JSON.stringify(value, null, 2)}\n`);
}

function publish(root: string): StrictJson {
  if (process.version !== EXPECTED_RUNTIME) fail(`runtime ${process.version} differs`);
  const branch = execFileSync("git", ["branch", "--show-current"], { cwd: root, encoding: "utf8" }).trim();
  const status = execFileSync("git", ["status", "--porcelain=v1", "--untracked-files=all"], { cwd: root, encoding: "utf8" }).trim();
  if (branch !== EXPECTED_BRANCH || status !== "") fail("publication requires the clean Phase 10 worktree");
  const head = execFileSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).trim();
  const output = pretty(derivePhase10FinalPackageReport(root, head));
  const absolute = safePath(root, OUTPUT_PATH);
  mkdirSync(dirname(absolute), { recursive: true });
  const fd = openSync(absolute, "wx");
  try {
    writeFileSync(fd, output);
    fsyncSync(fd);
  } finally {
    closeSync(fd);
  }
  return strictJsonSnapshot({ state: "package-report-published", output: { path: OUTPUT_PATH, byteLength: output.byteLength, sha256: sha256(output) } });
}

async function main(): Promise<void> {
  try {
    const argv = process.argv.slice(2);
    if (argv.length !== 4 || argv[0] !== "publish" || argv[1] !== "--repository-root" || argv[3] !== "--out-default") {
      fail("usage: publish --repository-root <path> --out-default");
    }
    const root = realpathSync.native(resolve(argv[2]!));
    console.log(JSON.stringify(publish(root)));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) await main();
