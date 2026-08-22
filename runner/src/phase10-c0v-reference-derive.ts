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
} from "./phase10-c0v-contracts.ts";
import { derivePhase10C0VMovingReference } from "./phase10-c0v-moving-reference-derive.ts";
import { derivePhase10C0VRadialReference } from "./phase10-c0v-radial-reference-derive.ts";
import {
  constructPhase10C0VStaticSourceAudit,
  derivePhase10C0VStaticRefusal,
  phase10C0VStaticSourceAuditRequirements,
} from "./phase10-c0v-static-refusal.ts";
import {
  inspectPhase10C0VReferenceFreeze,
  parsePhase10C0VReferenceCandidate,
  phase10C0VArtifactIdentity,
  phase10C0VFrozenArtifactIdentity,
  phase10C0VPrettyJsonBytes,
  phase10C0VReferenceAttemptRoot,
  phase10C0VReferenceDeriveCommand,
  writePhase10C0VStagingArtifact,
  type Phase10C0VReferenceCandidate,
  type Phase10C0VReferenceLayer,
} from "./phase10-c0v-reference-publish.ts";

interface Phase10C0VDeriveRequest {
  readonly repositoryRoot: string;
  readonly layer: Phase10C0VReferenceLayer;
  readonly protocolPath: string;
  readonly attemptId: string;
  readonly outputRoot: string;
  readonly command: string;
}

interface RetainedTimestamps {
  readonly startedAt: string;
  readonly completedAt: string;
}

const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._-]*$/u;
const ISO_INSTANT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u;

function fail(message: string): never {
  throw new Error(`Phase 10 C0V reference derivation refused: ${message}`);
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

function retainedTimestamps(
  root: string,
  candidatePath: string,
): RetainedTimestamps | undefined {
  const target = resolve(root, candidatePath);
  if (!existsSync(target)) return undefined;
  const bytes = readRegularContained(root, candidatePath);
  let parsed: unknown;
  try {
    parsed = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)) as unknown;
  } catch (error) {
    fail(`retained candidate is not valid UTF-8 JSON: ${error instanceof Error ? error.message : String(error)}`);
  }
  const candidate = parsePhase10C0VReferenceCandidate(parsed);
  if (!Buffer.from(bytes).equals(Buffer.from(phase10C0VPrettyJsonBytes(candidate)))) {
    fail("retained candidate is not exact two-space JSON plus one LF");
  }
  return Object.freeze({
    startedAt: candidate.startedAt,
    completedAt: candidate.completedAt,
  });
}

function staticSourceArtifacts(
  root: string,
  freezeCommit: string,
  protocol: Phase10C0VStaticProtocol,
): readonly Phase10C0VArtifactIdentity[] {
  const requirements = phase10C0VStaticSourceAuditRequirements(protocol);
  return Object.freeze(requirements.inspectedPaths.map((path) =>
    phase10C0VFrozenArtifactIdentity(root, freezeCommit, path)));
}

function generatorOutput(
  root: string,
  freezeCommit: string,
  layer: Phase10C0VReferenceLayer,
  protocol: Phase10C0VRadialProtocol | Phase10C0VMovingProtocol | Phase10C0VStaticProtocol,
): StrictJson {
  if (layer === "radial") {
    return strictJsonSnapshot(
      derivePhase10C0VRadialReference(
        phase10C0VRadialReferenceInput(protocol as Phase10C0VRadialProtocol),
      ),
    );
  }
  if (layer === "moving") {
    return strictJsonSnapshot(
      derivePhase10C0VMovingReference(protocol as Phase10C0VMovingProtocol),
    );
  }
  const staticProtocol = protocol as Phase10C0VStaticProtocol;
  const audit = constructPhase10C0VStaticSourceAudit(
    staticProtocol,
    staticSourceArtifacts(root, freezeCommit, staticProtocol),
  );
  return strictJsonSnapshot(derivePhase10C0VStaticRefusal(staticProtocol, audit));
}

/**
 * Execute exactly one registered reference-only derivation or scoped refusal derivation.
 * This wrapper adds provenance and staging only; all scientific arithmetic stays in the
 * separately registered generator module.
 */
export function derivePhase10C0VReferenceCandidate(
  request: Phase10C0VDeriveRequest,
): Phase10C0VArtifactIdentity {
  if (!SAFE_ID.test(request.attemptId)) fail("attemptId must be a safe identifier");
  const expectedRoot = phase10C0VReferenceAttemptRoot(request.attemptId);
  if (request.outputRoot !== expectedRoot) fail("output root differs from the registered attempt root");
  const inspection = inspectPhase10C0VReferenceFreeze({
    repositoryRoot: request.repositoryRoot,
    layer: request.layer,
    protocolPath: request.protocolPath,
  });
  const expectedCommand = phase10C0VReferenceDeriveCommand(
    request.layer,
    inspection.protocolIdentity.path,
    request.attemptId,
  );
  if (request.command !== expectedCommand) fail("command differs from the registered derivation command");
  const candidatePath = `${expectedRoot}/reference-candidate.json`;
  const retained = retainedTimestamps(inspection.root, candidatePath);
  const startedAt = exactInstant(
    retained?.startedAt ?? new Date().toISOString(),
    "startedAt",
  );
  const output = generatorOutput(
    inspection.root,
    inspection.freezeCommit,
    request.layer,
    inspection.protocol,
  );
  const completedAt = exactInstant(
    retained?.completedAt ?? new Date().toISOString(),
    "completedAt",
  );
  if (completedAt < startedAt) fail("completedAt precedes startedAt");
  const candidate: Phase10C0VReferenceCandidate = Object.freeze({
    schema: "phase10-c0v-reference-candidate-v1",
    candidateId: `phase10-c0v-${request.layer}-${request.attemptId}-candidate-v1`,
    attemptId: request.attemptId,
    layer: request.layer,
    layerId: request.layer === "radial"
      ? "C0V-RADIAL"
      : request.layer === "moving"
        ? "C0V-MOVING-EVENT"
        : "C0V-STATIC",
    branch: request.layer === "static" ? "reference-refusal" : "independent-reference",
    protocolId: inspection.protocol.protocolId,
    protocol: inspection.protocolIdentity,
    freezeCommit: inspection.freezeCommit,
    command: expectedCommand,
    runtime: process.version,
    actualConcurrency: 1,
    startedAt,
    completedAt,
    generator: inspection.generator,
    generatorOutput: output,
    codeAndImportReceipt: inspection.importReceipt,
    executionRecord: strictJsonSnapshot({
      solverInvocations: 0,
      referenceInvocations: request.layer === "static" ? 0 : 1,
      refusalDerivations: request.layer === "static" ? 1 : 0,
      productionInvocations: 0,
      witnessesProduced: 0,
      numericalEvaluations: 0,
      scientificProcessHours: 0,
    }),
  });
  const validatedCandidate = parsePhase10C0VReferenceCandidate(candidate);
  const bytes = phase10C0VPrettyJsonBytes(validatedCandidate);
  writePhase10C0VStagingArtifact(inspection.root, candidatePath, bytes);
  return phase10C0VArtifactIdentity(candidatePath, bytes);
}

function cliArguments(argv: readonly string[]): Phase10C0VDeriveRequest {
  if (
    argv.length !== 11 ||
    argv[0] !== "derive" ||
    argv[1] !== "--repository-root" ||
    argv[3] !== "--layer" ||
    argv[5] !== "--protocol" ||
    argv[7] !== "--attempt" ||
    argv[9] !== "--out"
  ) {
    fail(
      "usage: derive --repository-root <root> --layer <radial|moving|static> " +
      "--protocol <path> --attempt <id> --out <attempt-root>",
    );
  }
  const layer = argv[4];
  if (layer !== "radial" && layer !== "moving" && layer !== "static") fail("layer is invalid");
  const attemptId = argv[8] as string;
  const protocolPath = argv[6] as string;
  return {
    repositoryRoot: argv[2] as string,
    layer,
    protocolPath,
    attemptId,
    outputRoot: argv[10] as string,
    command: phase10C0VReferenceDeriveCommand(layer, protocolPath, attemptId),
  };
}

function main(): void {
  const result = derivePhase10C0VReferenceCandidate(cliArguments(process.argv.slice(2)));
  process.stdout.write(`${JSON.stringify({ status: "derived", ...result })}\n`);
}

if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    main();
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}
