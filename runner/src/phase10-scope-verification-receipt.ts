import {
  closeSync,
  fsyncSync,
  lstatSync,
  openSync,
  readFileSync,
  realpathSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { isAbsolute, join, relative, resolve } from "node:path";
import {
  canonicalJsonBytes,
  sha256Bytes,
  strictJsonSnapshot,
  type StrictJson,
} from "./gate4-evidence.ts";
import { parsePhase10CallableRegistry } from "./phase10-contracts.ts";
import { PHASE10_AS_CHECK_IDS } from "./phase10-scope-checks.ts";
import type {
  Phase10ScopeVerificationEvaluation,
} from "./phase10-scope-overlay-verify.ts";

const CALLABLE_REGISTRY_PATH =
  "research/phase10-execution-v1/packets/a-s/callable-registry.json";
const EVALUATOR_CALLABLE_ID = "phase10-as-verifier";
const EVALUATOR_MODULE_PATH = "runner/src/phase10-scope-overlay-verify.ts";
const EVALUATOR_EXPORT_NAME = "phase10ScopeOverlayVerify";
const WRITER_CALLABLE_ID = "phase10-as-verification-receipt-writer";
const WRITER_MODULE_PATH = "runner/src/phase10-scope-verification-receipt.ts";
const WRITER_EXPORT_NAME = "writePhase10ScopeVerificationReceipt";
const RECEIPT_FILE_NAME = "scope-verification.json";
const NEGATIVE_CONTROL_IDS = Object.freeze([
  "nc-as-collapse-multiple-blockers",
  "nc-as-drop-one-overlay-row",
  "nc-as-rewrite-frozen-role",
  "nc-as-upgrade-validation-credit",
]);
const EVALUATED_OUTPUTS: Readonly<Record<string, { readonly path: string; readonly fileName: string }>> = Object.freeze({
  "out-as-artifact-index": Object.freeze({
    path: "evidence/phase10-scope-intake-v1/scope-artifact-index.json",
    fileName: "scope-artifact-index.json",
  }),
  "out-as-phase8a-overlay": Object.freeze({
    path: "evidence/phase10-scope-intake-v1/phase8a-overlay.jsonl",
    fileName: "phase8a-overlay.jsonl",
  }),
  "out-as-phase8b-overlay": Object.freeze({
    path: "evidence/phase10-scope-intake-v1/phase8b-overlay.jsonl",
    fileName: "phase8b-overlay.jsonl",
  }),
  "out-as-report": Object.freeze({
    path: "evidence/phase10-scope-intake-v1/scope-report.json",
    fileName: "scope-report.json",
  }),
});
const INPUT_PATHS = Object.freeze([
  "evidence/phase8-target-book/freeze.json",
  "evidence/phase8b-benchmark-final-v1/successor-target-book.jsonl",
  "research/phase8-target-book.jsonl",
]);
const MATRIX_PATH = "research/phase10-obligation-matrix-v1.json";
const CLASSIFICATION_PROTOCOL_PATH = "research/phase10-scope-classification-protocol-v1.json";

interface ArtifactTuple {
  readonly path: string;
  readonly byteLength: number;
  readonly sha256: string;
}

interface EvaluatorIdentity {
  readonly callableId: typeof EVALUATOR_CALLABLE_ID;
  readonly modulePath: typeof EVALUATOR_MODULE_PATH;
  readonly exportName: typeof EVALUATOR_EXPORT_NAME;
  readonly byteLength: number;
  readonly sha256: string;
}

export interface Phase10ScopeVerificationReceipt {
  readonly schema: "phase10-as-verification-v1";
  readonly verificationId: "phase10-as-verification-v1";
  readonly packetId: "a-s";
  readonly obligationMatrix: ArtifactTuple;
  readonly classificationProtocol: ArtifactTuple;
  readonly callableRegistry: ArtifactTuple;
  readonly evaluator: EvaluatorIdentity;
  readonly inputArtifacts: Phase10ScopeVerificationEvaluation["inputArtifacts"];
  readonly evaluatedArtifacts: Phase10ScopeVerificationEvaluation["evaluatedArtifacts"];
  readonly executedCheckIds: Phase10ScopeVerificationEvaluation["executedCheckIds"];
  readonly checkResults: Phase10ScopeVerificationEvaluation["checkResults"];
  readonly executedNegativeControlIds: Phase10ScopeVerificationEvaluation["executedNegativeControlIds"];
  readonly negativeControlResults: Phase10ScopeVerificationEvaluation["negativeControlResults"];
  readonly startedOn: string;
  readonly endedOn: string;
  readonly verdict: Phase10ScopeVerificationEvaluation["verdict"];
}

export interface Phase10ScopeVerificationReceiptWriteRequest {
  readonly repositoryRoot: string;
  readonly bundleDirectory: string;
  readonly evaluation: Phase10ScopeVerificationEvaluation;
  readonly startedOn: string;
  readonly endedOn: string;
}

function fail(message: string): never {
  throw new Error(`Phase 10 A-S verification receipt refused: ${message}`);
}

function sameBytes(left: Uint8Array, right: Uint8Array): boolean {
  return left.byteLength === right.byteLength && left.every((value, index) => value === right[index]);
}

function compareText(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function exactKeys(value: object, expected: readonly string[], label: string): void {
  const actual = Object.keys(value).sort(compareText);
  const wanted = [...expected].sort(compareText);
  if (actual.length !== wanted.length || actual.some((key, index) => key !== wanted[index])) {
    fail(`${label} fields differ`);
  }
}

function exactSortedStrings(value: readonly string[], expected: readonly string[], label: string): void {
  if (
    value.some((entry) => typeof entry !== "string") ||
    new Set(value).size !== value.length ||
    value.some((entry, index) => index > 0 && value[index - 1]! >= entry) ||
    value.length !== expected.length ||
    value.some((entry, index) => entry !== expected[index])
  ) {
    fail(`${label} differs from the exact sorted roster`);
  }
}

function validTimestamp(value: string, label: string): void {
  if (
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u.test(value) ||
    Number.isNaN(Date.parse(value))
  ) {
    fail(`${label} must be an exact UTC ISO timestamp`);
  }
}

function safeRepositoryFile(repositoryRootValue: string, path: string): Uint8Array {
  if (
    isAbsolute(path) ||
    path.includes("\\") ||
    path.startsWith("/") ||
    path.endsWith("/") ||
    path.split("/").some((part) => part === "" || part === "." || part === "..")
  ) {
    fail(`${path} is not a safe repository-relative path`);
  }
  const repositoryRoot = realpathSync(resolve(repositoryRootValue));
  const absolute = resolve(repositoryRoot, path);
  const stat = lstatSync(absolute);
  if (!stat.isFile() || stat.isSymbolicLink()) fail(`${path} must be a regular non-symlink file`);
  const real = realpathSync(absolute);
  const fromRoot = relative(repositoryRoot, real);
  if (fromRoot === ".." || fromRoot.startsWith(`..${process.platform === "win32" ? "\\" : "/"}`) || isAbsolute(fromRoot)) {
    fail(`${path} resolves outside the repository root`);
  }
  return new Uint8Array(readFileSync(real));
}

function artifactTuple(path: string, bytes: Uint8Array): ArtifactTuple {
  return Object.freeze({ path, byteLength: bytes.byteLength, sha256: sha256Bytes(bytes) });
}

function assertArtifactTuple(actual: ArtifactTuple, expected: ArtifactTuple, label: string): void {
  if (
    actual.path !== expected.path ||
    actual.byteLength !== expected.byteLength ||
    actual.sha256 !== expected.sha256
  ) {
    fail(`${label} byte identity differs`);
  }
}

function safeBundleFile(bundleDirectory: string, fileName: string): Uint8Array {
  const absolute = resolve(bundleDirectory, fileName);
  const stat = lstatSync(absolute);
  if (!stat.isFile() || stat.isSymbolicLink()) fail(`${fileName} must be a regular candidate file`);
  const real = realpathSync(absolute);
  const fromBundle = relative(bundleDirectory, real);
  if (
    fromBundle !== fileName ||
    fromBundle === ".." ||
    fromBundle.startsWith(`..${process.platform === "win32" ? "\\" : "/"}`) ||
    isAbsolute(fromBundle)
  ) {
    fail(`${fileName} resolves outside the candidate bundle`);
  }
  return new Uint8Array(readFileSync(real));
}

function parsePrettyJson(bytes: Uint8Array, label: string): StrictJson {
  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    fail(`${label} is not valid UTF-8`);
  }
  if (text.includes("\r")) fail(`${label} must use LF line endings`);
  let parsed: unknown;
  try {
    parsed = JSON.parse(text) as unknown;
  } catch {
    fail(`${label} is not valid JSON`);
  }
  const snapshot = strictJsonSnapshot(parsed);
  if (text !== `${JSON.stringify(snapshot, null, 2)}\n`) {
    fail(`${label} is not exact two-space JSON with one terminal LF`);
  }
  return snapshot;
}

function prettyJsonBytes(value: unknown): Uint8Array {
  return new TextEncoder().encode(`${JSON.stringify(strictJsonSnapshot(value), null, 2)}\n`);
}

function resolvedCallableIdentity(
  repositoryRoot: string,
  callableId: string,
  modulePath: string,
  exportName: string,
  registryBytes: Uint8Array,
  expectedRole: "producer" | "independent-evaluator",
  expectedProducedOutputIds: readonly string[],
  expectedEvaluatedCheckIds: readonly string[],
): { readonly byteLength: number; readonly sha256: string } {
  const registry = parsePhase10CallableRegistry(
    parsePrettyJson(registryBytes, "A-S callable registry"),
  );
  if (registry.packetId !== "a-s") fail("callable registry packet differs");
  const matches = registry.callables.filter((entry) => entry.callableId === callableId);
  if (matches.length !== 1) fail(`callable registry has ${matches.length} ${callableId} bindings`);
  const binding = matches[0]!;
  if (
    binding.resolution !== "resolved" ||
    binding.identity === null ||
    binding.modulePath !== modulePath ||
    binding.exportName !== exportName ||
    binding.role !== expectedRole ||
    JSON.stringify(binding.producedOutputIds) !== JSON.stringify(expectedProducedOutputIds) ||
    binding.invokedCheckIds.length !== 0 ||
    JSON.stringify(binding.evaluatedCheckIds) !== JSON.stringify(expectedEvaluatedCheckIds) ||
    binding.executedNegativeControlIds.length !== 0
  ) {
    fail(`${callableId} registry binding is not the expected resolved callable`);
  }
  const moduleBytes = safeRepositoryFile(repositoryRoot, modulePath);
  const observed = artifactTuple(modulePath, moduleBytes);
  if (
    observed.byteLength !== binding.identity.byteLength ||
    observed.sha256 !== binding.identity.sha256
  ) {
    fail(`${callableId} module identity differs from the registry`);
  }
  return Object.freeze({ byteLength: observed.byteLength, sha256: observed.sha256 });
}

function validateEvaluation(evaluation: Phase10ScopeVerificationEvaluation): void {
  exactSortedStrings(evaluation.executedCheckIds, PHASE10_AS_CHECK_IDS, "executed check IDs");
  exactSortedStrings(
    evaluation.executedNegativeControlIds,
    NEGATIVE_CONTROL_IDS,
    "executed negative-control IDs",
  );
  if (
    evaluation.checkResults.length !== PHASE10_AS_CHECK_IDS.length ||
    evaluation.checkResults.some((result, index) => result.checkId !== PHASE10_AS_CHECK_IDS[index])
  ) {
    fail("check-result roster differs");
  }
  const allowedWitnessIds = new Set([
    "out-as-artifact-index",
    "out-as-classification-protocol",
    "out-as-phase8a-overlay",
    "out-as-phase8b-overlay",
    "out-as-report",
  ]);
  for (const result of evaluation.checkResults) {
    exactKeys(result, ["checkId", "verdict", "detail"], `${result.checkId} result`);
    exactKeys(result.detail, ["errors", "witnessOutputIds"], `${result.checkId} detail`);
    if (
      result.detail.errors.some((entry) => typeof entry !== "string") ||
      new Set(result.detail.errors).size !== result.detail.errors.length ||
      result.detail.errors.some((entry, index) => index > 0 && result.detail.errors[index - 1]! >= entry)
    ) {
      fail(`${result.checkId} errors are not sorted and unique`);
    }
    if ((result.verdict === "pass") !== (result.detail.errors.length === 0)) {
      fail(`${result.checkId} verdict does not follow its errors`);
    }
    if (
      result.detail.witnessOutputIds.length === 0 ||
      new Set(result.detail.witnessOutputIds).size !== result.detail.witnessOutputIds.length ||
      result.detail.witnessOutputIds.some(
        (entry, index) =>
          !allowedWitnessIds.has(entry) ||
          (index > 0 && result.detail.witnessOutputIds[index - 1]! >= entry),
      )
    ) {
      fail(`${result.checkId} witness-output roster is invalid`);
    }
  }
  if (
    evaluation.negativeControlResults.length !== NEGATIVE_CONTROL_IDS.length ||
    evaluation.negativeControlResults.some(
      (result, index) => result.negativeControlId !== NEGATIVE_CONTROL_IDS[index],
    )
  ) {
    fail("negative-control result roster differs");
  }
  const evaluatedById = new Map(evaluation.evaluatedArtifacts.map((entry) => [entry.outputId, entry]));
  for (const result of evaluation.negativeControlResults) {
    exactKeys(
      result,
      ["negativeControlId", "mutationExecuted", "rejected", "beforeWitness", "afterWitness", "errors"],
      `${result.negativeControlId} result`,
    );
    for (const [label, witness] of [
      ["before", result.beforeWitness],
      ["after", result.afterWitness],
    ] as const) {
      exactKeys(
        witness,
        ["artifactId", "path", "byteLength", "sha256", "semanticFingerprint"],
        `${result.negativeControlId} ${label} witness`,
      );
      exactKeys(
        witness.semanticFingerprint,
        ["projection", "sha256"],
        `${result.negativeControlId} ${label} semantic fingerprint`,
      );
      if (
        witness.semanticFingerprint.sha256 !==
          sha256Bytes(canonicalJsonBytes(witness.semanticFingerprint.projection))
      ) {
        fail(`${result.negativeControlId} ${label} semantic fingerprint digest differs`);
      }
    }
    const evaluated = evaluatedById.get(result.beforeWitness.artifactId);
    if (
      evaluated === undefined ||
      result.beforeWitness.path !== evaluated.path ||
      result.beforeWitness.byteLength !== evaluated.byteLength ||
      result.beforeWitness.sha256 !== evaluated.sha256 ||
      result.afterWitness.artifactId !== result.beforeWitness.artifactId ||
      result.afterWitness.sha256 === result.beforeWitness.sha256 ||
      result.afterWitness.semanticFingerprint.sha256 === result.beforeWitness.semanticFingerprint.sha256
    ) {
      fail(`${result.negativeControlId} mutation witness does not bind a changed evaluated artifact`);
    }
    if (
      result.errors.some((entry) => typeof entry !== "string") ||
      new Set(result.errors).size !== result.errors.length ||
      result.errors.some((entry, index) => index > 0 && result.errors[index - 1]! >= entry) ||
      ((result.mutationExecuted && result.rejected) !== (result.errors.length === 0))
    ) {
      fail(`${result.negativeControlId} errors or verdict flags differ`);
    }
  }
  const passed = evaluation.checkResults.every(
    (result) => result.verdict === "pass" && result.detail.errors.length === 0,
  );
  const controlled = evaluation.negativeControlResults.every(
    (result) => result.mutationExecuted && result.rejected && result.errors.length === 0,
  );
  if ((passed && controlled) !== (evaluation.verdict === "pass")) {
    fail("evaluation verdict does not follow its check and control results");
  }
  strictJsonSnapshot(evaluation);
}

function validateReopenedEvaluationArtifacts(
  repositoryRoot: string,
  bundleDirectory: string,
  evaluation: Phase10ScopeVerificationEvaluation,
): void {
  assertArtifactTuple(
    evaluation.obligationMatrix,
    artifactTuple(MATRIX_PATH, safeRepositoryFile(repositoryRoot, MATRIX_PATH)),
    "obligation matrix",
  );
  assertArtifactTuple(
    evaluation.classificationProtocol,
    artifactTuple(
      CLASSIFICATION_PROTOCOL_PATH,
      safeRepositoryFile(repositoryRoot, CLASSIFICATION_PROTOCOL_PATH),
    ),
    "classification protocol",
  );
  if (
    evaluation.inputArtifacts.length !== INPUT_PATHS.length ||
    evaluation.inputArtifacts.some((entry, index) => entry.path !== INPUT_PATHS[index])
  ) {
    fail("input artifact roster differs");
  }
  for (const input of evaluation.inputArtifacts) {
    assertArtifactTuple(
      input,
      artifactTuple(input.path, safeRepositoryFile(repositoryRoot, input.path)),
      `input artifact ${input.path}`,
    );
  }
  const outputIds = Object.keys(EVALUATED_OUTPUTS).sort(compareText);
  if (
    evaluation.evaluatedArtifacts.length !== outputIds.length ||
    evaluation.evaluatedArtifacts.some((entry, index) => entry.outputId !== outputIds[index])
  ) {
    fail("evaluated artifact roster differs");
  }
  for (const evaluated of evaluation.evaluatedArtifacts) {
    const expected = EVALUATED_OUTPUTS[evaluated.outputId];
    if (expected === undefined || evaluated.path !== expected.path) {
      fail(`${evaluated.outputId} registered path differs`);
    }
    assertArtifactTuple(
      evaluated,
      artifactTuple(expected.path, safeBundleFile(bundleDirectory, expected.fileName)),
      evaluated.outputId,
    );
  }
}

/**
 * Bind the independent evaluator and its reopened inputs, then exclusively retain only the
 * packet-specific A-S verification artifact. Generic packet receipts are owned elsewhere.
 */
export function writePhase10ScopeVerificationReceipt(
  request: Phase10ScopeVerificationReceiptWriteRequest,
): Phase10ScopeVerificationReceipt {
  validTimestamp(request.startedOn, "startedOn");
  validTimestamp(request.endedOn, "endedOn");
  if (Date.parse(request.endedOn) < Date.parse(request.startedOn)) {
    fail("endedOn precedes startedOn");
  }
  const repositoryRoot = realpathSync(resolve(request.repositoryRoot));
  const bundleDirectory = realpathSync(resolve(request.bundleDirectory));
  const bundleStat = lstatSync(bundleDirectory);
  if (!bundleStat.isDirectory() || bundleStat.isSymbolicLink()) {
    fail("bundle directory must be a non-symlink directory");
  }
  const bundleFromRoot = relative(repositoryRoot, bundleDirectory);
  if (
    bundleFromRoot === "" ||
    bundleFromRoot === ".." ||
    bundleFromRoot.startsWith(`..${process.platform === "win32" ? "\\" : "/"}`) ||
    isAbsolute(bundleFromRoot)
  ) {
    fail("bundle directory must be below the repository root");
  }
  validateEvaluation(request.evaluation);
  validateReopenedEvaluationArtifacts(repositoryRoot, bundleDirectory, request.evaluation);

  const registryBytes = safeRepositoryFile(repositoryRoot, CALLABLE_REGISTRY_PATH);
  const evaluatorIdentity = resolvedCallableIdentity(
    repositoryRoot,
    EVALUATOR_CALLABLE_ID,
    EVALUATOR_MODULE_PATH,
    EVALUATOR_EXPORT_NAME,
    registryBytes,
    "independent-evaluator",
    [],
    PHASE10_AS_CHECK_IDS,
  );
  resolvedCallableIdentity(
    repositoryRoot,
    WRITER_CALLABLE_ID,
    WRITER_MODULE_PATH,
    WRITER_EXPORT_NAME,
    registryBytes,
    "producer",
    ["out-as-verification-receipt"],
    [],
  );

  const receipt = Object.freeze({
    schema: "phase10-as-verification-v1" as const,
    verificationId: "phase10-as-verification-v1" as const,
    packetId: "a-s" as const,
    obligationMatrix: request.evaluation.obligationMatrix,
    classificationProtocol: request.evaluation.classificationProtocol,
    callableRegistry: artifactTuple(CALLABLE_REGISTRY_PATH, registryBytes),
    evaluator: Object.freeze({
      callableId: EVALUATOR_CALLABLE_ID,
      modulePath: EVALUATOR_MODULE_PATH,
      exportName: EVALUATOR_EXPORT_NAME,
      byteLength: evaluatorIdentity.byteLength,
      sha256: evaluatorIdentity.sha256,
    }),
    inputArtifacts: request.evaluation.inputArtifacts,
    evaluatedArtifacts: request.evaluation.evaluatedArtifacts,
    executedCheckIds: request.evaluation.executedCheckIds,
    checkResults: request.evaluation.checkResults,
    executedNegativeControlIds: request.evaluation.executedNegativeControlIds,
    negativeControlResults: request.evaluation.negativeControlResults,
    startedOn: request.startedOn,
    endedOn: request.endedOn,
    verdict: request.evaluation.verdict,
  }) satisfies Phase10ScopeVerificationReceipt;
  const receiptBytes = prettyJsonBytes(receipt);
  const receiptPath = join(bundleDirectory, RECEIPT_FILE_NAME);
  let descriptor: number | undefined;
  let created = false;
  try {
    descriptor = openSync(receiptPath, "wx");
    created = true;
    writeFileSync(descriptor, receiptBytes);
    fsyncSync(descriptor);
    closeSync(descriptor);
    descriptor = undefined;
    const reopened = new Uint8Array(readFileSync(receiptPath));
    if (!sameBytes(reopened, receiptBytes)) fail("receipt readback identity differs");
    parsePrettyJson(reopened, "A-S verification receipt readback");
  } catch (error) {
    if (descriptor !== undefined) closeSync(descriptor);
    if (created) unlinkSync(receiptPath);
    throw error;
  }
  return receipt;
}
