import {
  existsSync,
  lstatSync,
  readFileSync,
  realpathSync,
} from "node:fs";
import { isAbsolute, relative, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";
import {
  strictJsonSnapshot,
  type StrictJson,
} from "./gate4-evidence.ts";
import {
  phase10C0VRadialReferenceInput,
  type Phase10C0VArtifactIdentity,
  type Phase10C0VMovingProtocol,
  type Phase10C0VRadialProtocol,
  type Phase10C0VStaticProtocol,
  type Phase10C0VStaticRefusalCandidate,
} from "./phase10-c0v-contracts.ts";
import {
  independentlyCheckPhase10C0VMovingReference,
} from "./phase10-c0v-moving-reference-check.ts";
import type {
  Phase10C0VMovingReferenceCandidate,
} from "./phase10-c0v-contracts.ts";
import {
  independentlyCheckPhase10C0VRadialReference,
  type Phase10C0VRadialCheckCandidate,
} from "./phase10-c0v-radial-reference-check.ts";
import {
  constructPhase10C0VStaticSourceAudit,
  phase10C0VStaticSourceAuditRequirements,
} from "./phase10-c0v-static-refusal.ts";
import {
  independentlyCheckPhase10C0VStaticRefusal,
  type Phase10C0VStaticSourceArtifactInput,
} from "./phase10-c0v-static-refusal-check.ts";
import {
  inspectPhase10C0VReferenceFreeze,
  parsePhase10C0VReferenceCandidate,
  parsePhase10C0VTargetedCheckReceipt,
  phase10C0VArtifactIdentity,
  phase10C0VFrozenArtifactIdentity,
  phase10C0VPrettyJsonBytes,
  phase10C0VReferenceAttemptRoot,
  phase10C0VReferenceCheckCommand,
  validatePhase10C0VReferenceCandidate,
  writePhase10C0VStagingArtifact,
  type Phase10C0VReferenceCandidate,
  type Phase10C0VReferenceLayer,
  type Phase10C0VTargetedCheckReceipt,
} from "./phase10-c0v-reference-publish.ts";

interface Phase10C0VCheckRequest {
  readonly repositoryRoot: string;
  readonly layer: Phase10C0VReferenceLayer;
  readonly protocolPath: string;
  readonly candidatePath: string;
  readonly receiptPath: string;
  readonly command: string;
}

interface IndependentResult {
  readonly output: StrictJson;
  readonly verdict: "pass" | "fail" | "refusal";
  readonly errors: readonly string[];
}

const ISO_INSTANT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u;

function fail(message: string): never {
  throw new Error(`Phase 10 C0V targeted reference check refused: ${message}`);
}

function exactInstant(value: string, label: string): string {
  if (!ISO_INSTANT.test(value) || Number.isNaN(Date.parse(value))) {
    fail(`${label} must be an ISO-8601 millisecond UTC instant`);
  }
  if (Date.parse(value) > Date.now()) fail(`${label} must not be in the future`);
  return value;
}

function readRegularContained(root: string, repositoryPath: string): Uint8Array {
  const target = resolve(root, repositoryPath);
  const rel = relative(root, target);
  if (rel === "" || rel === ".." || rel.startsWith(`..${sep}`) || isAbsolute(rel)) {
    fail(`path escapes the repository: ${repositoryPath}`);
  }
  if (!existsSync(target)) fail(`required path is missing: ${repositoryPath}`);
  const stat = lstatSync(target);
  if (!stat.isFile() || stat.isSymbolicLink()) {
    fail(`required path must be a regular non-symlink file: ${repositoryPath}`);
  }
  const real = realpathSync(target);
  const realRel = relative(root, real);
  if (realRel === "" || realRel === ".." || realRel.startsWith(`..${sep}`) || isAbsolute(realRel)) {
    fail(`required path resolves outside the repository: ${repositoryPath}`);
  }
  return readFileSync(real);
}

function parsePretty<T>(
  bytes: Uint8Array,
  parser: (value: unknown) => T,
  label: string,
): T {
  let parsed: unknown;
  try {
    parsed = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)) as unknown;
  } catch (error) {
    fail(`${label} is not valid UTF-8 JSON: ${error instanceof Error ? error.message : String(error)}`);
  }
  const value = parser(parsed);
  if (!Buffer.from(bytes).equals(Buffer.from(phase10C0VPrettyJsonBytes(value)))) {
    fail(`${label} must use exact two-space JSON plus one LF`);
  }
  return value;
}

function retainedCompletedAt(root: string, receiptPath: string): string | undefined {
  const target = resolve(root, receiptPath);
  if (!existsSync(target)) return undefined;
  const bytes = readRegularContained(root, receiptPath);
  return parsePretty(bytes, parsePhase10C0VTargetedCheckReceipt, "retained targeted check").completedAt;
}

function staticSourceArtifacts(
  root: string,
  freezeCommit: string,
  protocol: Phase10C0VStaticProtocol,
): readonly Phase10C0VStaticSourceArtifactInput[] {
  const requirements = phase10C0VStaticSourceAuditRequirements(protocol);
  return Object.freeze(requirements.inspectedPaths.map((path) => {
    const identity = phase10C0VFrozenArtifactIdentity(root, freezeCommit, path);
    const bytes = readRegularContained(root, path);
    const reopened = phase10C0VArtifactIdentity(path, bytes);
    if (
      identity.path !== reopened.path ||
      identity.byteLength !== reopened.byteLength ||
      identity.sha256 !== reopened.sha256
    ) {
      fail(`static source artifact changed during frozen reopen: ${path}`);
    }
    return Object.freeze({ identity, bytes });
  }));
}

function independentResult(
  root: string,
  layer: Phase10C0VReferenceLayer,
  protocol: Phase10C0VRadialProtocol | Phase10C0VMovingProtocol | Phase10C0VStaticProtocol,
  candidate: Phase10C0VReferenceCandidate,
): IndependentResult {
  if (layer === "radial") {
    const checked = independentlyCheckPhase10C0VRadialReference(
      phase10C0VRadialReferenceInput(protocol as Phase10C0VRadialProtocol),
      candidate.generatorOutput as unknown as Phase10C0VRadialCheckCandidate,
    );
    return Object.freeze({
      output: strictJsonSnapshot(checked),
      verdict: checked.pass ? "pass" : "fail",
      errors: checked.errors,
    });
  }
  if (layer === "moving") {
    const checked = independentlyCheckPhase10C0VMovingReference(
      protocol as Phase10C0VMovingProtocol,
      candidate.generatorOutput as unknown as Phase10C0VMovingReferenceCandidate,
    );
    return Object.freeze({
      output: strictJsonSnapshot(checked),
      verdict: checked.verdict,
      errors: checked.errors,
    });
  }
  const staticProtocol = protocol as Phase10C0VStaticProtocol;
  const sourceArtifacts = staticSourceArtifacts(root, candidate.freezeCommit, staticProtocol);
  const audit = constructPhase10C0VStaticSourceAudit(
    staticProtocol,
    sourceArtifacts.map((entry) => entry.identity),
  );
  const checked = independentlyCheckPhase10C0VStaticRefusal(
    staticProtocol,
    candidate.generatorOutput as unknown as Phase10C0VStaticRefusalCandidate,
    audit,
    sourceArtifacts,
  );
  return Object.freeze({
    output: strictJsonSnapshot(checked),
    verdict: checked.verdict === "pass" ? "refusal" : "fail",
    errors: checked.errors,
  });
}

/**
 * Reopen a bound candidate and independently rederive its targeted check. The wrapper never
 * imports a generator and preserves an existing receipt timestamp only after re-execution.
 */
export function verifyPhase10C0VReferenceCandidate(
  request: Phase10C0VCheckRequest,
): Phase10C0VArtifactIdentity {
  const inspection = inspectPhase10C0VReferenceFreeze({
    repositoryRoot: request.repositoryRoot,
    layer: request.layer,
    protocolPath: request.protocolPath,
  });
  const candidateBytes = readRegularContained(inspection.root, request.candidatePath);
  const candidate = parsePretty(
    candidateBytes,
    parsePhase10C0VReferenceCandidate,
    "reference candidate",
  );
  const attemptRoot = phase10C0VReferenceAttemptRoot(candidate.attemptId);
  if (request.candidatePath !== `${attemptRoot}/reference-candidate.json`) {
    fail("candidate path differs from its attemptId");
  }
  if (request.receiptPath !== `${attemptRoot}/targeted-check.json`) {
    fail("receipt path differs from the candidate attemptId");
  }
  validatePhase10C0VReferenceCandidate(
    inspection,
    request.layer,
    request.candidatePath,
    candidateBytes,
    candidate,
  );
  const expectedCommand = phase10C0VReferenceCheckCommand(
    request.layer,
    inspection.protocolIdentity.path,
    candidate.attemptId,
  );
  if (request.command !== expectedCommand) fail("command differs from the registered check command");
  const result = independentResult(
    inspection.root,
    request.layer,
    inspection.protocol,
    candidate,
  );
  const retained = retainedCompletedAt(inspection.root, request.receiptPath);
  const completedAt = exactInstant(
    retained ?? new Date().toISOString(),
    "completedAt",
  );
  if (completedAt < candidate.completedAt) fail("check completedAt precedes candidate completion");
  const receipt: Phase10C0VTargetedCheckReceipt = Object.freeze({
    schema: "phase10-c0v-targeted-check-v1",
    checkId: `phase10-c0v-${request.layer}-${candidate.attemptId}-targeted-check-v1`,
    attemptId: candidate.attemptId,
    layer: request.layer,
    layerId: candidate.layerId,
    branch: candidate.branch,
    protocolId: candidate.protocolId,
    protocol: candidate.protocol,
    freezeCommit: candidate.freezeCommit,
    command: expectedCommand,
    runtime: process.version,
    actualConcurrency: 1,
    candidate: phase10C0VArtifactIdentity(request.candidatePath, candidateBytes),
    checker: inspection.checker,
    independentOutput: result.output,
    codeAndImportReceipt: inspection.importReceipt,
    comparison: strictJsonSnapshot({
      method: "independent-reexecution",
      expectedOutcome: request.layer === "static" ? "refusal" : "pass",
      observedOutcome: result.verdict,
      errors: result.errors,
    }),
    verdict: result.verdict,
    errors: result.errors,
    completedAt,
  });
  const validatedReceipt = parsePhase10C0VTargetedCheckReceipt(receipt);
  const bytes = phase10C0VPrettyJsonBytes(validatedReceipt);
  writePhase10C0VStagingArtifact(inspection.root, request.receiptPath, bytes);
  return phase10C0VArtifactIdentity(request.receiptPath, bytes);
}

function cliArguments(argv: readonly string[]): Phase10C0VCheckRequest {
  if (
    argv.length !== 11 ||
    argv[0] !== "verify" ||
    argv[1] !== "--repository-root" ||
    argv[3] !== "--layer" ||
    argv[5] !== "--protocol" ||
    argv[7] !== "--candidate" ||
    argv[9] !== "--receipt"
  ) {
    fail(
      "usage: verify --repository-root <root> --layer <radial|moving|static> " +
      "--protocol <path> --candidate <path> --receipt <path>",
    );
  }
  const layer = argv[4];
  if (layer !== "radial" && layer !== "moving" && layer !== "static") fail("layer is invalid");
  const candidatePath = argv[8] as string;
  const match = /^out\/phase10-c0v-reference-v1\/attempts\/([A-Za-z0-9][A-Za-z0-9._-]*)\/reference-candidate\.json$/u.exec(
    candidatePath,
  );
  if (match === null) fail("candidate path does not identify the registered attempt root");
  const attemptId = match[1] as string;
  const protocolPath = argv[6] as string;
  return {
    repositoryRoot: argv[2] as string,
    layer,
    protocolPath,
    candidatePath,
    receiptPath: argv[10] as string,
    command: phase10C0VReferenceCheckCommand(layer, protocolPath, attemptId),
  };
}

function main(): void {
  const result = verifyPhase10C0VReferenceCandidate(cliArguments(process.argv.slice(2)));
  process.stdout.write(`${JSON.stringify({ status: "checked", ...result })}\n`);
}

if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    main();
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}
