import { spawnSync } from "node:child_process";
import {
  closeSync,
  existsSync,
  fsyncSync,
  lstatSync,
  mkdirSync,
  openSync,
  readFileSync,
  realpathSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, isAbsolute, relative, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";
import ts from "typescript";
import {
  sha256Bytes,
  strictJsonSnapshot,
  type StrictJson,
} from "./gate4-evidence.ts";
import {
  parsePhase10C0VMovingProtocol,
  parsePhase10C0VMovingReferenceCandidate,
  parsePhase10C0VMovingReferenceCheck,
  parsePhase10C0VFinalCodeAndImportReceipt,
  parsePhase10C0VRadialReferenceCandidate,
  parsePhase10C0VRadialReferenceCheck,
  parsePhase10C0VRadialProtocol,
  parsePhase10C0VReferenceEnvelope,
  parsePhase10C0VReferenceRefusal,
  parsePhase10C0VStaticProtocol,
  parsePhase10C0VStaticRefusalCandidate,
  parsePhase10C0VStaticRefusalCheck,
  type Phase10C0VArtifactIdentity,
  type Phase10C0VCodeIdentity,
  type Phase10C0VMovingProtocol,
  type Phase10C0VRadialProtocol,
  type Phase10C0VStaticProtocol,
} from "./phase10-c0v-contracts.ts";

const EXPECTED_BRANCH = "phase10/evidence-verification" as const;
const EXPECTED_RUNTIME = "v24.13.1" as const;
export const PHASE10_C0V_REFERENCE_CANDIDATE_SCHEMA =
  "phase10-c0v-reference-candidate-v1" as const;
export const PHASE10_C0V_TARGETED_CHECK_SCHEMA =
  "phase10-c0v-targeted-check-v1" as const;

export type Phase10C0VReferenceLayer = "radial" | "moving" | "static";
export type Phase10C0VLayerProtocol =
  | Phase10C0VRadialProtocol
  | Phase10C0VMovingProtocol
  | Phase10C0VStaticProtocol;

interface JsonObject {
  readonly [key: string]: StrictJson;
}

export interface Phase10C0VImportClosureReceipt {
  readonly generator: readonly Phase10C0VArtifactIdentity[];
  readonly independentChecker: readonly Phase10C0VArtifactIdentity[];
  readonly sharedPaths: readonly string[];
  readonly allowedSharedPaths: readonly string[];
  readonly forbiddenPaths: readonly string[];
}

export interface Phase10C0VReferenceCandidate {
  readonly schema: typeof PHASE10_C0V_REFERENCE_CANDIDATE_SCHEMA;
  readonly candidateId: string;
  readonly attemptId: string;
  readonly layer: Phase10C0VReferenceLayer;
  readonly layerId: "C0V-RADIAL" | "C0V-MOVING-EVENT" | "C0V-STATIC";
  readonly branch: "independent-reference" | "reference-refusal";
  readonly protocolId: string;
  readonly protocol: Phase10C0VArtifactIdentity;
  readonly freezeCommit: string;
  readonly command: string;
  readonly runtime: string;
  readonly actualConcurrency: 1;
  readonly startedAt: string;
  readonly completedAt: string;
  readonly generator: Phase10C0VCodeIdentity;
  readonly generatorOutput: StrictJson;
  readonly codeAndImportReceipt: Phase10C0VImportClosureReceipt;
  readonly executionRecord: StrictJson;
}

export interface Phase10C0VTargetedCheckReceipt {
  readonly schema: typeof PHASE10_C0V_TARGETED_CHECK_SCHEMA;
  readonly checkId: string;
  readonly attemptId: string;
  readonly layer: Phase10C0VReferenceLayer;
  readonly layerId: "C0V-RADIAL" | "C0V-MOVING-EVENT" | "C0V-STATIC";
  readonly branch: "independent-reference" | "reference-refusal";
  readonly protocolId: string;
  readonly protocol: Phase10C0VArtifactIdentity;
  readonly freezeCommit: string;
  readonly command: string;
  readonly runtime: string;
  readonly actualConcurrency: 1;
  readonly candidate: Phase10C0VArtifactIdentity;
  readonly checker: Phase10C0VCodeIdentity;
  readonly independentOutput: StrictJson;
  readonly codeAndImportReceipt: Phase10C0VImportClosureReceipt;
  readonly comparison: StrictJson;
  readonly verdict: "pass" | "fail" | "refusal";
  readonly errors: readonly string[];
  readonly completedAt: string;
}

export interface Phase10C0VFreezeInspection {
  readonly root: string;
  readonly protocol: Phase10C0VLayerProtocol;
  readonly protocolBytes: Uint8Array;
  readonly protocolIdentity: Phase10C0VArtifactIdentity;
  readonly freezeCommit: string;
  readonly generator: Phase10C0VCodeIdentity;
  readonly checker: Phase10C0VCodeIdentity;
  readonly sharedParser: Phase10C0VCodeIdentity;
  readonly neutralDerive: Phase10C0VCodeIdentity;
  readonly neutralCheck: Phase10C0VCodeIdentity;
  readonly neutralPublish: Phase10C0VCodeIdentity;
  readonly importReceipt: Phase10C0VImportClosureReceipt;
}

export interface Phase10C0VPublishRequest {
  readonly repositoryRoot: string;
  readonly layer: Phase10C0VReferenceLayer;
  readonly protocolPath: string;
  readonly candidatePath: string;
  readonly checkPath: string;
  readonly outputPath: string;
  readonly command: string;
}

export function phase10C0VReferenceAttemptRoot(attemptId: string): string {
  if (!SAFE_ID.test(attemptId)) fail("attemptId must be a safe identifier");
  return `out/phase10-c0v-reference-v1/attempts/${attemptId}`;
}

export function phase10C0VReferenceDeriveCommand(
  layer: Phase10C0VReferenceLayer,
  protocolPath: string,
  attemptId: string,
): string {
  const protocol = safeRepositoryPath(protocolPath, "protocol path");
  const attemptRoot = phase10C0VReferenceAttemptRoot(attemptId);
  return (
    "node runner/src/phase10-c0v-reference-derive.ts derive --repository-root . " +
    `--layer ${layer} --protocol ${protocol} --attempt ${attemptId} --out ${attemptRoot}`
  );
}

export function phase10C0VReferenceCheckCommand(
  layer: Phase10C0VReferenceLayer,
  protocolPath: string,
  attemptId: string,
): string {
  const protocol = safeRepositoryPath(protocolPath, "protocol path");
  const attemptRoot = phase10C0VReferenceAttemptRoot(attemptId);
  return (
    "node runner/src/phase10-c0v-reference-check.ts verify --repository-root . " +
    `--layer ${layer} --protocol ${protocol} ` +
    `--candidate ${attemptRoot}/reference-candidate.json ` +
    `--receipt ${attemptRoot}/targeted-check.json`
  );
}

export function phase10C0VReferencePublishCommand(
  layer: Phase10C0VReferenceLayer,
  protocolPath: string,
  attemptId: string,
  outputPath: string,
): string {
  const protocol = safeRepositoryPath(protocolPath, "protocol path");
  const output = safeRepositoryPath(outputPath, "output path");
  const attemptRoot = phase10C0VReferenceAttemptRoot(attemptId);
  return (
    "node runner/src/phase10-c0v-reference-publish.ts publish --repository-root . " +
    `--layer ${layer} --protocol ${protocol} ` +
    `--candidate ${attemptRoot}/reference-candidate.json ` +
    `--check ${attemptRoot}/targeted-check.json --out ${output}`
  );
}

const SHA256 = /^[0-9a-f]{64}$/u;
const GIT_COMMIT = /^[0-9a-f]{40}$/u;
const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._-]*$/u;
const SAFE_PATH = /^[A-Za-z0-9][A-Za-z0-9._/-]*$/u;

const NEUTRAL_CODE = Object.freeze({
  neutralDerive: Object.freeze({
    role: "neutral-derive" as const,
    modulePath: "runner/src/phase10-c0v-reference-derive.ts",
    exportName: "derivePhase10C0VReferenceCandidate",
  }),
  neutralCheck: Object.freeze({
    role: "neutral-check" as const,
    modulePath: "runner/src/phase10-c0v-reference-check.ts",
    exportName: "verifyPhase10C0VReferenceCandidate",
  }),
  neutralPublish: Object.freeze({
    role: "neutral-publish" as const,
    modulePath: "runner/src/phase10-c0v-reference-publish.ts",
    exportName: "publishPhase10C0VReference",
  }),
});

function fail(message: string): never {
  throw new Error(`Phase 10 C0V reference lifecycle refused: ${message}`);
}

function object(value: StrictJson, label: string): JsonObject {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    fail(`${label} must be an object`);
  }
  return value as JsonObject;
}

function exactKeys(value: JsonObject, expected: readonly string[], label: string): void {
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  if (actual.length !== wanted.length || actual.some((entry, index) => entry !== wanted[index])) {
    fail(`${label} keys differ: got [${actual.join(", ")}], expected [${wanted.join(", ")}]`);
  }
}

function string(value: StrictJson, label: string): string {
  if (typeof value !== "string" || value.length === 0 || value !== value.trim()) {
    fail(`${label} must be a nonempty string without surrounding whitespace`);
  }
  return value;
}

function literal<T extends string>(value: StrictJson, expected: T, label: string): T {
  const result = string(value, label);
  if (result !== expected) fail(`${label} must equal ${expected}`);
  return expected;
}

function oneOf<T extends string>(value: StrictJson, expected: readonly T[], label: string): T {
  const result = string(value, label);
  if (!(expected as readonly string[]).includes(result)) {
    fail(`${label} must be one of ${expected.join(", ")}`);
  }
  return result as T;
}

function positiveInteger(value: StrictJson, label: string): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value <= 0) {
    fail(`${label} must be a positive safe integer`);
  }
  return value;
}

function exactOne(value: StrictJson, label: string): 1 {
  if (value !== 1) fail(`${label} must equal 1`);
  return 1;
}

function stringArray(value: StrictJson, label: string): readonly string[] {
  if (!Array.isArray(value)) fail(`${label} must be an array`);
  return Object.freeze(value.map((entry, index) => string(entry, `${label}[${index}]`)));
}

function assertSortedUnique(values: readonly string[], label: string): void {
  for (let index = 1; index < values.length; index++) {
    if ((values[index - 1] as string) >= (values[index] as string)) {
      fail(`${label} must be sorted and unique`);
    }
  }
}

function compareText(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function safeId(value: StrictJson, label: string): string {
  const result = string(value, label);
  if (!SAFE_ID.test(result)) fail(`${label} must be a safe identifier`);
  return result;
}

function safeRepositoryPath(value: StrictJson, label: string): string {
  const result = string(value, label);
  if (
    isAbsolute(result) ||
    !SAFE_PATH.test(result) ||
    result.includes("\\") ||
    result.startsWith("/") ||
    result.endsWith("/") ||
    result.split("/").some((part) => part === "" || part === "." || part === "..")
  ) {
    fail(`${label} must be a normalized repository-relative path`);
  }
  return result;
}

function isoInstant(value: StrictJson, label: string): string {
  const result = string(value, label);
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u.test(result) || Number.isNaN(Date.parse(result))) {
    fail(`${label} must be an ISO-8601 millisecond UTC instant`);
  }
  return result;
}

function assertNotFutureInstant(value: string, label: string): void {
  if (Date.parse(value) > Date.now()) fail(`${label} must not be in the future`);
}

function artifactIdentity(value: StrictJson, label: string): Phase10C0VArtifactIdentity {
  const row = object(value, label);
  exactKeys(row, ["path", "byteLength", "sha256"], label);
  const sha256 = string(row.sha256, `${label}.sha256`);
  if (!SHA256.test(sha256)) fail(`${label}.sha256 must be a lowercase SHA-256 digest`);
  return Object.freeze({
    path: safeRepositoryPath(row.path, `${label}.path`),
    byteLength: positiveInteger(row.byteLength, `${label}.byteLength`),
    sha256,
  });
}

function codeIdentity(value: StrictJson, label: string): Phase10C0VCodeIdentity {
  const row = object(value, label);
  exactKeys(row, ["role", "modulePath", "exportName", "byteLength", "sha256"], label);
  const sha256 = string(row.sha256, `${label}.sha256`);
  if (!SHA256.test(sha256)) fail(`${label}.sha256 must be a lowercase SHA-256 digest`);
  const modulePath = safeRepositoryPath(row.modulePath, `${label}.modulePath`);
  if (!modulePath.startsWith("runner/src/") || !modulePath.endsWith(".ts")) {
    fail(`${label}.modulePath must name a runner/src TypeScript module`);
  }
  return Object.freeze({
    role: oneOf(
      row.role,
      [
        "generator",
        "independent-checker",
        "shared-parser",
        "neutral-derive",
        "neutral-check",
        "neutral-publish",
      ],
      `${label}.role`,
    ),
    modulePath,
    exportName: string(row.exportName, `${label}.exportName`),
    byteLength: positiveInteger(row.byteLength, `${label}.byteLength`),
    sha256,
  });
}

export function phase10C0VArtifactIdentity(
  path: string,
  bytes: Uint8Array,
): Phase10C0VArtifactIdentity {
  return Object.freeze({ path, byteLength: bytes.byteLength, sha256: sha256Bytes(bytes) });
}

function sameIdentity(
  actual: Phase10C0VArtifactIdentity,
  expected: Phase10C0VArtifactIdentity,
  label: string,
): void {
  if (
    actual.path !== expected.path ||
    actual.byteLength !== expected.byteLength ||
    actual.sha256 !== expected.sha256
  ) {
    fail(`${label} identity differs`);
  }
}

function sameCodeIdentity(
  actual: Phase10C0VCodeIdentity,
  expected: Phase10C0VCodeIdentity,
  label: string,
): void {
  if (
    actual.role !== expected.role ||
    actual.modulePath !== expected.modulePath ||
    actual.exportName !== expected.exportName ||
    actual.byteLength !== expected.byteLength ||
    actual.sha256 !== expected.sha256
  ) {
    fail(`${label} identity differs`);
  }
}

function git(root: string, args: readonly string[]): string {
  const result = spawnSync("git", args, { cwd: root, encoding: "utf8" });
  if (result.error !== undefined || result.status !== 0) {
    fail(`git ${args.join(" ")} failed: ${(result.stderr || result.error?.message || "unknown error").trim()}`);
  }
  return result.stdout.trim();
}

function assertTrackedClean(root: string): void {
  if (git(root, ["diff", "--name-only"]).length !== 0 || git(root, ["diff", "--cached", "--name-only"]).length !== 0) {
    fail("tracked worktree and index must be clean");
  }
}

function assertRepositoryRoot(path: string): string {
  const resolved = realpathSync(resolve(path));
  if (!lstatSync(resolved).isDirectory()) fail("repository root must be a directory");
  if (git(resolved, ["rev-parse", "--show-toplevel"]) !== resolved.replaceAll("\\", "/")) {
    const gitRoot = realpathSync(git(resolved, ["rev-parse", "--show-toplevel"]));
    if (gitRoot !== resolved) fail("repository root must be the Git worktree root");
  }
  return resolved;
}

function resolveContained(root: string, repositoryPath: string, label: string): string {
  const relativePath = safeRepositoryPath(repositoryPath, label);
  const target = resolve(root, relativePath);
  const rel = relative(root, target);
  if (rel === "" || rel === ".." || rel.startsWith(`..${sep}`) || isAbsolute(rel)) {
    fail(`${label} must resolve below the repository root`);
  }
  return target;
}

function readRegular(root: string, repositoryPath: string, label: string): Uint8Array {
  const target = resolveContained(root, repositoryPath, label);
  if (!existsSync(target)) fail(`${label} is missing: ${repositoryPath}`);
  const stat = lstatSync(target);
  if (!stat.isFile() || stat.isSymbolicLink()) fail(`${label} must be a regular non-symlink file`);
  const real = realpathSync(target);
  const rel = relative(root, real);
  if (rel === "" || rel === ".." || rel.startsWith(`..${sep}`) || isAbsolute(rel)) {
    fail(`${label} resolves outside the repository root`);
  }
  return readFileSync(real);
}

export function phase10C0VPrettyJsonBytes(value: unknown): Uint8Array {
  return new TextEncoder().encode(`${JSON.stringify(strictJsonSnapshot(value), null, 2)}\n`);
}

function parsePrettyJsonBytes(bytes: Uint8Array, label: string): StrictJson {
  const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  let parsed: unknown;
  try {
    parsed = JSON.parse(text) as unknown;
  } catch (error) {
    fail(`${label} is not valid JSON: ${error instanceof Error ? error.message : String(error)}`);
  }
  const snapshot = strictJsonSnapshot(parsed);
  const expected = phase10C0VPrettyJsonBytes(snapshot);
  if (!Buffer.from(bytes).equals(Buffer.from(expected))) {
    fail(`${label} must use exact two-space JSON plus one LF`);
  }
  return snapshot;
}

function parseLayerProtocol(layer: Phase10C0VReferenceLayer, value: unknown): Phase10C0VLayerProtocol {
  if (layer === "radial") return parsePhase10C0VRadialProtocol(value);
  if (layer === "moving") return parsePhase10C0VMovingProtocol(value);
  return parsePhase10C0VStaticProtocol(value);
}

function expectedLayerId(layer: Phase10C0VReferenceLayer): Phase10C0VReferenceCandidate["layerId"] {
  return layer === "radial" ? "C0V-RADIAL" : layer === "moving" ? "C0V-MOVING-EVENT" : "C0V-STATIC";
}

function expectedBranch(layer: Phase10C0VReferenceLayer): Phase10C0VReferenceCandidate["branch"] {
  return layer === "static" ? "reference-refusal" : "independent-reference";
}

function protocolIndependenceAllowlist(protocol: Phase10C0VLayerProtocol): readonly string[] {
  const row = object(protocol.independence, "protocol.independence");
  const raw = row.sharedImportAllowlist;
  const paths = stringArray(raw, "protocol.independence.sharedImportAllowlist").map((entry, index) =>
    safeRepositoryPath(entry, `protocol.independence.sharedImportAllowlist[${index}]`));
  assertSortedUnique(paths, "protocol.independence.sharedImportAllowlist");
  return Object.freeze(paths);
}

function localImports(
  path: string,
  bytes: Uint8Array,
  allowedExternalPackages: ReadonlySet<string>,
): readonly string[] {
  const source = ts.createSourceFile(
    path,
    new TextDecoder("utf-8", { fatal: true }).decode(bytes),
    ts.ScriptTarget.ESNext,
    true,
    ts.ScriptKind.TS,
  );
  const parseDiagnostics = (
    source as ts.SourceFile & { readonly parseDiagnostics?: readonly ts.Diagnostic[] }
  ).parseDiagnostics ?? [];
  if (parseDiagnostics.length > 0) fail(`TypeScript parse diagnostics in ${path}`);
  const imports: string[] = [];
  const collect = (specifier: ts.Node | undefined, label: string): void => {
    if (specifier === undefined || !ts.isStringLiteralLike(specifier)) {
      fail(`${label} in ${path} must use a literal module specifier`);
    }
    if (specifier.text.startsWith(".")) {
      imports.push(specifier.text);
    } else if (
      !specifier.text.startsWith("node:") &&
      !allowedExternalPackages.has(specifier.text)
    ) {
      fail(`${label} in ${path} uses an unpinned external package: ${specifier.text}`);
    }
  };
  const visit = (node: ts.Node): void => {
    if (ts.isImportDeclaration(node)) collect(node.moduleSpecifier, "import declaration");
    if (ts.isExportDeclaration(node) && node.moduleSpecifier !== undefined) {
      collect(node.moduleSpecifier, "export declaration");
    }
    if (
      ts.isImportEqualsDeclaration(node) &&
      ts.isExternalModuleReference(node.moduleReference)
    ) {
      collect(node.moduleReference.expression, "import-equals declaration");
    }
    if (ts.isCallExpression(node)) {
      const dynamicImport = node.expression.kind === ts.SyntaxKind.ImportKeyword;
      const commonJsRequire = ts.isIdentifier(node.expression) && node.expression.text === "require";
      if (dynamicImport || commonJsRequire) {
        if (node.arguments.length !== 1) {
          fail(`${dynamicImport ? "dynamic import" : "require"} in ${path} must have one literal argument`);
        }
        collect(
          node.arguments[0],
          dynamicImport ? "dynamic import" : "require",
        );
      }
    }
    if (ts.isImportTypeNode(node)) {
      const argument = node.argument;
      if (!ts.isLiteralTypeNode(argument)) {
        fail(`import type in ${path} must use a literal module specifier`);
      }
      collect(argument.literal, "import type");
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return Object.freeze([...new Set(imports)].sort());
}

function resolveLocalImport(root: string, fromPath: string, specifier: string): string {
  const base = resolve(root, dirname(fromPath), specifier);
  const candidates = specifier.endsWith(".ts") ? [base] : [`${base}.ts`, resolve(base, "index.ts")];
  for (const candidate of candidates) {
    if (!existsSync(candidate)) continue;
    const stat = lstatSync(candidate);
    if (!stat.isFile() || stat.isSymbolicLink()) fail(`local import ${specifier} from ${fromPath} is not a regular file`);
    const real = realpathSync(candidate);
    const rel = relative(root, real);
    if (rel === "" || rel === ".." || rel.startsWith(`..${sep}`) || isAbsolute(rel)) {
      fail(`local import ${specifier} from ${fromPath} escapes the repository`);
    }
    return rel.replaceAll("\\", "/");
  }
  fail(`local import ${specifier} from ${fromPath} does not resolve to tracked TypeScript`);
}

function importClosure(
  root: string,
  rootPath: string,
  allowedExternalPackages: ReadonlySet<string> = new Set<string>(),
): readonly Phase10C0VArtifactIdentity[] {
  const pending = [rootPath];
  const seen = new Set<string>();
  const result: Phase10C0VArtifactIdentity[] = [];
  while (pending.length > 0) {
    const path = pending.pop() as string;
    if (seen.has(path)) continue;
    seen.add(path);
    const bytes = readRegular(root, path, `import closure ${path}`);
    result.push(phase10C0VArtifactIdentity(path, bytes));
    for (const imported of localImports(path, bytes, allowedExternalPackages)) {
      pending.push(resolveLocalImport(root, path, imported));
    }
  }
  return Object.freeze(result.sort((left, right) => compareText(left.path, right.path)));
}

function neutralImportClosure(root: string): readonly Phase10C0VArtifactIdentity[] {
  const byPath = new Map<string, Phase10C0VArtifactIdentity>();
  const allowedExternalPackages = new Set(["typescript"]);
  for (const registration of Object.values(NEUTRAL_CODE)) {
    for (const identity of importClosure(root, registration.modulePath, allowedExternalPackages)) {
      byPath.set(identity.path, identity);
    }
  }
  return Object.freeze([...byPath.values()].sort((left, right) => compareText(left.path, right.path)));
}

function assertTypeScriptRuntime(root: string): void {
  if (ts.version !== "5.9.3") fail("TypeScript runtime must equal the frozen 5.9.3 parser version");
  const lockBytes = readRegular(root, "package-lock.json", "package lock");
  let lock: unknown;
  try {
    lock = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(lockBytes)) as unknown;
  } catch (error) {
    fail(`package lock is not valid UTF-8 JSON: ${error instanceof Error ? error.message : String(error)}`);
  }
  const lockRoot = lock as { readonly packages?: Readonly<Record<string, { readonly version?: unknown }>> };
  if (lockRoot.packages?.["node_modules/typescript"]?.version !== "5.9.3") {
    fail("package lock must pin TypeScript 5.9.3");
  }
  readRegular(root, "package.json", "package manifest");
}

function forbiddenImportPaths(paths: readonly string[]): readonly string[] {
  return Object.freeze(paths.filter((path) =>
    path.startsWith("core/") ||
    path.startsWith("solver-cpu/") ||
    path.startsWith("solver-gpu/") ||
    path === "runner/src/phase10-executor-worker.ts" ||
    path === "runner/src/phase10-executor.ts" ||
    path === "runner/src/phase10-execution-preflight.ts",
  ));
}

function directCode(protocol: Phase10C0VLayerProtocol, role: Phase10C0VCodeIdentity["role"]): Phase10C0VCodeIdentity {
  const matches = protocol.referenceOnlyCode.filter((entry) => entry.role === role);
  if (matches.length !== 1) fail(`protocol must register exactly one ${role}`);
  return matches[0] as Phase10C0VCodeIdentity;
}

function assertCodeIdentity(root: string, registered: Phase10C0VCodeIdentity): void {
  const bytes = readRegular(root, registered.modulePath, `${registered.role} module`);
  if (bytes.byteLength !== registered.byteLength || sha256Bytes(bytes) !== registered.sha256) {
    fail(`${registered.role} module identity differs from protocol`);
  }
  const source = ts.createSourceFile(
    registered.modulePath,
    new TextDecoder("utf-8", { fatal: true }).decode(bytes),
    ts.ScriptTarget.ESNext,
    true,
    ts.ScriptKind.TS,
  );
  const parseDiagnostics = (
    source as ts.SourceFile & { readonly parseDiagnostics?: readonly ts.Diagnostic[] }
  ).parseDiagnostics ?? [];
  if (parseDiagnostics.length > 0) fail(`${registered.role} module has parse diagnostics`);
  let found = false;
  for (const statement of source.statements) {
    if (
      ts.isFunctionDeclaration(statement) &&
      statement.body !== undefined &&
      statement.name?.text === registered.exportName &&
      statement.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword) === true &&
      statement.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.DefaultKeyword) !== true
    ) {
      found = true;
    }
  }
  if (!found) fail(`${registered.role} export ${registered.exportName} is not a direct named function`);
}

function neutralCodeIdentity(
  root: string,
  registration: (typeof NEUTRAL_CODE)[keyof typeof NEUTRAL_CODE],
): Phase10C0VCodeIdentity {
  const bytes = readRegular(root, registration.modulePath, `${registration.role} module`);
  const identity: Phase10C0VCodeIdentity = Object.freeze({
    ...registration,
    byteLength: bytes.byteLength,
    sha256: sha256Bytes(bytes),
  });
  assertCodeIdentity(root, identity);
  return identity;
}

function importReceipt(root: string, protocol: Phase10C0VLayerProtocol): Phase10C0VImportClosureReceipt {
  const generator = directCode(protocol, "generator");
  const checker = directCode(protocol, "independent-checker");
  const sharedParser = directCode(protocol, "shared-parser");
  for (const registered of [generator, checker, sharedParser]) assertCodeIdentity(root, registered);
  if (generator.modulePath === checker.modulePath) fail("generator and independent checker modules must differ");
  const generatorClosure = importClosure(root, generator.modulePath);
  // The static refusal checker performs its independent current-contract source audit with the
  // repository-pinned TypeScript AST parser. No numerical reference implementation may import
  // an external package. assertTypeScriptRuntime() and the HEAD-bound package files below bind
  // this single exception to TypeScript 5.9.3.
  const checkerExternalPackages = protocol.layerId === "C0V-STATIC"
    ? new Set(["typescript"])
    : new Set<string>();
  const checkerClosure = importClosure(root, checker.modulePath, checkerExternalPackages);
  const checkerSet = new Set(checkerClosure.map((entry) => entry.path));
  const sharedPaths = generatorClosure.map((entry) => entry.path).filter((path) => checkerSet.has(path)).sort();
  const allowedSharedPaths = [...protocolIndependenceAllowlist(protocol)];
  if (
    sharedPaths.length !== allowedSharedPaths.length ||
    sharedPaths.some((entry, index) => entry !== allowedSharedPaths[index])
  ) {
    fail(`generator/checker shared import closure differs: got [${sharedPaths.join(", ")}]`);
  }
  const forbiddenPaths = forbiddenImportPaths([
    ...generatorClosure.map((entry) => entry.path),
    ...checkerClosure.map((entry) => entry.path),
  ]).filter((entry, index, values) => values.indexOf(entry) === index).sort();
  if (forbiddenPaths.length !== 0) {
    fail(`reference closure contains forbidden production imports: ${forbiddenPaths.join(", ")}`);
  }
  return Object.freeze({
    generator: generatorClosure,
    independentChecker: checkerClosure,
    sharedPaths: Object.freeze(sharedPaths),
    allowedSharedPaths: Object.freeze(allowedSharedPaths),
    forbiddenPaths,
  });
}

function assertBoundIdentity(root: string, expected: Phase10C0VArtifactIdentity, label: string): void {
  const bytes = readRegular(root, expected.path, label);
  sameIdentity(phase10C0VArtifactIdentity(expected.path, bytes), expected, label);
}

function assertHeadBytes(root: string, head: string, paths: readonly string[]): void {
  for (const path of paths) {
    const current = readRegular(root, path, `current ${path}`);
    const result = spawnSync("git", ["show", `${head}:${path}`], { cwd: root, encoding: null });
    if (result.error !== undefined || result.status !== 0 || result.stdout === null) {
      fail(`freeze commit does not contain ${path}`);
    }
    if (!Buffer.from(current).equals(Buffer.from(result.stdout))) {
      fail(`${path} differs from freeze commit ${head}`);
    }
  }
}

function normalizeCrlfToLf(bytes: Uint8Array, label: string): Buffer {
  const source = Buffer.from(bytes);
  const normalized: number[] = [];
  for (let index = 0; index < source.length; index += 1) {
    const byte = source[index];
    if (byte === 0x0d) {
      if (source[index + 1] !== 0x0a) fail(`${label} contains a bare carriage return`);
      continue;
    }
    normalized.push(byte as number);
  }
  return Buffer.from(normalized);
}

function assertHeadGitTextBytes(root: string, head: string, paths: readonly string[]): void {
  for (const path of paths) {
    const current = readRegular(root, path, `current ${path}`);
    const result = spawnSync("git", ["show", `${head}:${path}`], { cwd: root, encoding: null });
    if (result.error !== undefined || result.status !== 0 || result.stdout === null) {
      fail(`freeze commit does not contain ${path}`);
    }
    const currentLf = normalizeCrlfToLf(current, `current ${path}`);
    const committedLf = normalizeCrlfToLf(result.stdout, `freeze commit ${path}`);
    if (!currentLf.equals(committedLf)) fail(`${path} differs from freeze commit ${head}`);
  }
}

function assertProtocolIntroductionHead(
  root: string,
  head: string,
  protocolPath: string,
): void {
  const result = spawnSync(
    "git",
    ["log", "--format=%H", "--reverse", "--", protocolPath],
    { cwd: root, encoding: "utf8" },
  );
  if (result.error !== undefined || result.status !== 0) {
    fail(`cannot inspect protocol introduction history: ${(result.stderr || result.error?.message || "unknown error").trim()}`);
  }
  const commits = result.stdout.split(/\r?\n/u).filter((entry) => entry.length > 0);
  if (commits.length !== 1 || commits[0] !== head) {
    fail("HEAD must be the single protocol-introduction commit before reference derivation");
  }
}

function assertArtifactAbsentAtHead(root: string, head: string, path: string): void {
  const result = spawnSync("git", ["cat-file", "-e", `${head}:${path}`], {
    cwd: root,
    encoding: "utf8",
  });
  if (result.error !== undefined) {
    fail(`cannot inspect frozen artifact absence: ${result.error.message}`);
  }
  if (result.status === 0) fail(`reference/refusal artifact already exists in freeze commit: ${path}`);
}

export function phase10C0VFrozenArtifactIdentity(
  root: string,
  head: string,
  repositoryPath: string,
): Phase10C0VArtifactIdentity {
  const path = safeRepositoryPath(repositoryPath, "frozen artifact path");
  if (!GIT_COMMIT.test(head)) fail("frozen artifact head must be a Git commit identity");
  assertHeadBytes(root, head, [path]);
  return phase10C0VArtifactIdentity(path, readRegular(root, path, `frozen artifact ${path}`));
}

export function inspectPhase10C0VReferenceFreeze(options: {
  readonly repositoryRoot: string;
  readonly layer: Phase10C0VReferenceLayer;
  readonly protocolPath: string;
  readonly requireTrackedClean?: boolean;
}): Phase10C0VFreezeInspection {
  const root = assertRepositoryRoot(options.repositoryRoot);
  if (options.requireTrackedClean !== false) assertTrackedClean(root);
  if (git(root, ["branch", "--show-current"]) !== EXPECTED_BRANCH) fail(`branch must equal ${EXPECTED_BRANCH}`);
  if (process.version !== EXPECTED_RUNTIME) fail(`runtime must equal ${EXPECTED_RUNTIME}`);
  const freezeCommit = git(root, ["rev-parse", "HEAD"]);
  if (!GIT_COMMIT.test(freezeCommit)) fail("HEAD must be a full Git commit identity");
  const protocolPath = safeRepositoryPath(options.protocolPath, "protocol path");
  const protocolBytes = readRegular(root, protocolPath, "layer protocol");
  const protocolValue = parsePrettyJsonBytes(protocolBytes, "layer protocol");
  const protocol = parseLayerProtocol(options.layer, protocolValue);
  if (protocol.layerId !== expectedLayerId(options.layer) || protocol.branch !== expectedBranch(options.layer)) {
    fail("layer, layerId, and branch disagree");
  }
  if (protocol.artifactPaths.protocol !== protocolPath) fail("protocol artifact path does not name itself");
  assertProtocolIntroductionHead(root, freezeCommit, protocolPath);
  assertArtifactAbsentAtHead(
    root,
    freezeCommit,
    options.layer === "static"
      ? protocol.artifactPaths.referenceRefusal
      : protocol.artifactPaths.reference,
  );
  for (const [label, expected] of Object.entries(protocol.bindings)) {
    assertBoundIdentity(root, expected, `protocol binding ${label}`);
  }
  const receipt = importReceipt(root, protocol);
  const generator = directCode(protocol, "generator");
  const checker = directCode(protocol, "independent-checker");
  const sharedParser = directCode(protocol, "shared-parser");
  assertTypeScriptRuntime(root);
  const neutralDerive = neutralCodeIdentity(root, NEUTRAL_CODE.neutralDerive);
  const neutralCheck = neutralCodeIdentity(root, NEUTRAL_CODE.neutralCheck);
  const neutralPublish = neutralCodeIdentity(root, NEUTRAL_CODE.neutralPublish);
  const neutralClosure = neutralImportClosure(root);
  const commitPaths = [
    protocolPath,
    ...Object.values(protocol.bindings).map((entry) => entry.path),
    ...receipt.generator.map((entry) => entry.path),
    ...receipt.independentChecker.map((entry) => entry.path),
    neutralDerive.modulePath,
    neutralCheck.modulePath,
    neutralPublish.modulePath,
    ...neutralClosure.map((entry) => entry.path),
  ].filter((entry, index, values) => values.indexOf(entry) === index).sort();
  assertHeadBytes(root, freezeCommit, commitPaths);
  // Git's checkout policy may expose these two tracked JSON files as CRLF on Windows while their
  // committed blobs remain LF. Permit only that reversible Git text transform; all protocols,
  // callables, and transitive local imports above remain raw-byte exact.
  assertHeadGitTextBytes(root, freezeCommit, ["package.json", "package-lock.json"]);
  return Object.freeze({
    root,
    protocol,
    protocolBytes,
    protocolIdentity: phase10C0VArtifactIdentity(protocolPath, protocolBytes),
    freezeCommit,
    generator,
    checker,
    sharedParser,
    neutralDerive,
    neutralCheck,
    neutralPublish,
    importReceipt: receipt,
  });
}

function importReceiptValue(value: StrictJson, label: string): Phase10C0VImportClosureReceipt {
  const row = object(value, label);
  exactKeys(row, ["generator", "independentChecker", "sharedPaths", "allowedSharedPaths", "forbiddenPaths"], label);
  const parseClosure = (raw: StrictJson, closureLabel: string): readonly Phase10C0VArtifactIdentity[] => {
    if (!Array.isArray(raw) || raw.length === 0) fail(`${closureLabel} must be a nonempty array`);
    const parsed = raw.map((entry, index) => artifactIdentity(entry, `${closureLabel}[${index}]`));
    const paths = parsed.map((entry) => entry.path);
    assertSortedUnique(paths, closureLabel);
    return Object.freeze(parsed);
  };
  const sharedPaths = stringArray(row.sharedPaths, `${label}.sharedPaths`);
  const allowedSharedPaths = stringArray(row.allowedSharedPaths, `${label}.allowedSharedPaths`);
  const forbiddenPaths = stringArray(row.forbiddenPaths, `${label}.forbiddenPaths`);
  assertSortedUnique(sharedPaths, `${label}.sharedPaths`);
  assertSortedUnique(allowedSharedPaths, `${label}.allowedSharedPaths`);
  assertSortedUnique(forbiddenPaths, `${label}.forbiddenPaths`);
  return Object.freeze({
    generator: parseClosure(row.generator, `${label}.generator`),
    independentChecker: parseClosure(row.independentChecker, `${label}.independentChecker`),
    sharedPaths,
    allowedSharedPaths,
    forbiddenPaths,
  });
}

const CANDIDATE_FIELDS = [
  "schema",
  "candidateId",
  "attemptId",
  "layer",
  "layerId",
  "branch",
  "protocolId",
  "protocol",
  "freezeCommit",
  "command",
  "runtime",
  "actualConcurrency",
  "startedAt",
  "completedAt",
  "generator",
  "generatorOutput",
  "codeAndImportReceipt",
  "executionRecord",
] as const;

export function parsePhase10C0VReferenceCandidate(value: unknown): Phase10C0VReferenceCandidate {
  const row = object(strictJsonSnapshot(value), "reference candidate");
  exactKeys(row, CANDIDATE_FIELDS, "reference candidate");
  const freezeCommit = string(row.freezeCommit, "reference candidate.freezeCommit");
  if (!GIT_COMMIT.test(freezeCommit)) fail("reference candidate.freezeCommit must be a Git commit");
  const layer = oneOf(row.layer, ["radial", "moving", "static"], "reference candidate.layer");
  const generatorOutput = layer === "radial"
    ? parsePhase10C0VRadialReferenceCandidate(row.generatorOutput)
    : layer === "moving"
      ? parsePhase10C0VMovingReferenceCandidate(row.generatorOutput)
      : parsePhase10C0VStaticRefusalCandidate(row.generatorOutput);
  return Object.freeze({
    schema: literal(
      row.schema,
      PHASE10_C0V_REFERENCE_CANDIDATE_SCHEMA,
      "reference candidate.schema",
    ),
    candidateId: safeId(row.candidateId, "reference candidate.candidateId"),
    attemptId: safeId(row.attemptId, "reference candidate.attemptId"),
    layer,
    layerId: oneOf(row.layerId, ["C0V-RADIAL", "C0V-MOVING-EVENT", "C0V-STATIC"], "reference candidate.layerId"),
    branch: oneOf(row.branch, ["independent-reference", "reference-refusal"], "reference candidate.branch"),
    protocolId: string(row.protocolId, "reference candidate.protocolId"),
    protocol: artifactIdentity(row.protocol, "reference candidate.protocol"),
    freezeCommit,
    command: string(row.command, "reference candidate.command"),
    runtime: string(row.runtime, "reference candidate.runtime"),
    actualConcurrency: exactOne(row.actualConcurrency, "reference candidate.actualConcurrency"),
    startedAt: isoInstant(row.startedAt, "reference candidate.startedAt"),
    completedAt: isoInstant(row.completedAt, "reference candidate.completedAt"),
    generator: codeIdentity(row.generator, "reference candidate.generator"),
    generatorOutput,
    codeAndImportReceipt: importReceiptValue(row.codeAndImportReceipt, "reference candidate.codeAndImportReceipt"),
    executionRecord: strictJsonSnapshot(row.executionRecord),
  });
}

const CHECK_FIELDS = [
  "schema",
  "checkId",
  "attemptId",
  "layer",
  "layerId",
  "branch",
  "protocolId",
  "protocol",
  "freezeCommit",
  "command",
  "runtime",
  "actualConcurrency",
  "candidate",
  "checker",
  "independentOutput",
  "codeAndImportReceipt",
  "comparison",
  "verdict",
  "errors",
  "completedAt",
] as const;

export function parsePhase10C0VTargetedCheckReceipt(value: unknown): Phase10C0VTargetedCheckReceipt {
  const row = object(strictJsonSnapshot(value), "targeted check receipt");
  exactKeys(row, CHECK_FIELDS, "targeted check receipt");
  const freezeCommit = string(row.freezeCommit, "targeted check receipt.freezeCommit");
  if (!GIT_COMMIT.test(freezeCommit)) fail("targeted check receipt.freezeCommit must be a Git commit");
  const errors = stringArray(row.errors, "targeted check receipt.errors");
  const verdict = oneOf(row.verdict, ["pass", "fail", "refusal"], "targeted check receipt.verdict");
  const layer = oneOf(row.layer, ["radial", "moving", "static"], "targeted check receipt.layer");
  const independentOutput = layer === "radial"
    ? parsePhase10C0VRadialReferenceCheck(row.independentOutput)
    : layer === "moving"
      ? parsePhase10C0VMovingReferenceCheck(row.independentOutput)
      : parsePhase10C0VStaticRefusalCheck(row.independentOutput);
  if ((verdict === "pass" || verdict === "refusal") && errors.length !== 0) {
    fail("pass/refusal targeted check receipt must have no errors");
  }
  if (verdict === "fail" && errors.length === 0) fail("failed targeted check receipt must name errors");
  return Object.freeze({
    schema: literal(
      row.schema,
      PHASE10_C0V_TARGETED_CHECK_SCHEMA,
      "targeted check receipt.schema",
    ),
    checkId: safeId(row.checkId, "targeted check receipt.checkId"),
    attemptId: safeId(row.attemptId, "targeted check receipt.attemptId"),
    layer,
    layerId: oneOf(row.layerId, ["C0V-RADIAL", "C0V-MOVING-EVENT", "C0V-STATIC"], "targeted check receipt.layerId"),
    branch: oneOf(row.branch, ["independent-reference", "reference-refusal"], "targeted check receipt.branch"),
    protocolId: string(row.protocolId, "targeted check receipt.protocolId"),
    protocol: artifactIdentity(row.protocol, "targeted check receipt.protocol"),
    freezeCommit,
    command: string(row.command, "targeted check receipt.command"),
    runtime: string(row.runtime, "targeted check receipt.runtime"),
    actualConcurrency: exactOne(row.actualConcurrency, "targeted check receipt.actualConcurrency"),
    candidate: artifactIdentity(row.candidate, "targeted check receipt.candidate"),
    checker: codeIdentity(row.checker, "targeted check receipt.checker"),
    independentOutput,
    codeAndImportReceipt: importReceiptValue(row.codeAndImportReceipt, "targeted check receipt.codeAndImportReceipt"),
    comparison: strictJsonSnapshot(row.comparison),
    verdict,
    errors,
    completedAt: isoInstant(row.completedAt, "targeted check receipt.completedAt"),
  });
}

function sameJson(left: unknown, right: unknown, label: string): void {
  if (!Buffer.from(phase10C0VPrettyJsonBytes(left)).equals(Buffer.from(phase10C0VPrettyJsonBytes(right)))) {
    fail(`${label} differs`);
  }
}

function readCandidate(root: string, path: string): { readonly bytes: Uint8Array; readonly value: Phase10C0VReferenceCandidate } {
  const bytes = readRegular(root, path, "reference candidate");
  return { bytes, value: parsePhase10C0VReferenceCandidate(parsePrettyJsonBytes(bytes, "reference candidate")) };
}

function readCheck(root: string, path: string): { readonly bytes: Uint8Array; readonly value: Phase10C0VTargetedCheckReceipt } {
  const bytes = readRegular(root, path, "targeted check receipt");
  return { bytes, value: parsePhase10C0VTargetedCheckReceipt(parsePrettyJsonBytes(bytes, "targeted check receipt")) };
}

export function validatePhase10C0VReferenceCandidate(
  inspection: Phase10C0VFreezeInspection,
  layer: Phase10C0VReferenceLayer,
  candidatePath: string,
  candidateBytes: Uint8Array,
  candidate: Phase10C0VReferenceCandidate,
): void {
  const attemptRoot = phase10C0VReferenceAttemptRoot(candidate.attemptId);
  if (candidatePath !== `${attemptRoot}/reference-candidate.json`) {
    fail("reference candidate path differs from its attemptId");
  }
  if (
    candidate.candidateId !== `phase10-c0v-${layer}-${candidate.attemptId}-candidate-v1` ||
    candidate.layer !== layer ||
    candidate.layerId !== expectedLayerId(layer) ||
    candidate.branch !== expectedBranch(layer) ||
    candidate.protocolId !== inspection.protocol.protocolId ||
    candidate.freezeCommit !== inspection.freezeCommit ||
    candidate.runtime !== EXPECTED_RUNTIME ||
    candidate.startedAt > candidate.completedAt
  ) {
    fail("reference candidate provenance differs from frozen launch");
  }
  assertNotFutureInstant(candidate.startedAt, "reference candidate.startedAt");
  assertNotFutureInstant(candidate.completedAt, "reference candidate.completedAt");
  sameIdentity(candidate.protocol, inspection.protocolIdentity, "reference candidate protocol");
  sameCodeIdentity(candidate.generator, inspection.generator, "reference candidate generator");
  sameJson(candidate.codeAndImportReceipt, inspection.importReceipt, "reference candidate import receipt");
  if (
    candidate.command !== phase10C0VReferenceDeriveCommand(
      layer,
      inspection.protocolIdentity.path,
      candidate.attemptId,
    )
  ) {
    fail("reference candidate command differs from the frozen command");
  }
  const execution = object(candidate.executionRecord, "reference candidate.executionRecord");
  exactKeys(
    execution,
    [
      "solverInvocations",
      "referenceInvocations",
      "refusalDerivations",
      "productionInvocations",
      "witnessesProduced",
      "numericalEvaluations",
      "scientificProcessHours",
    ],
    "reference candidate.executionRecord",
  );
  const expectedReferenceInvocations = layer === "static" ? 0 : 1;
  const expectedRefusalDerivations = layer === "static" ? 1 : 0;
  for (const [field, expected] of [
    ["solverInvocations", 0],
    ["referenceInvocations", expectedReferenceInvocations],
    ["refusalDerivations", expectedRefusalDerivations],
    ["productionInvocations", 0],
    ["witnessesProduced", 0],
    ["numericalEvaluations", 0],
    ["scientificProcessHours", 0],
  ] as const) {
    if (execution[field] !== expected) {
      fail(`reference candidate.executionRecord.${field} must equal ${expected}`);
    }
  }
  if (candidateBytes.byteLength === 0) fail("reference candidate bytes must be nonempty");
}

function assertCandidateAndCheck(
  inspection: Phase10C0VFreezeInspection,
  layer: Phase10C0VReferenceLayer,
  candidatePath: string,
  checkPath: string,
  candidateBytes: Uint8Array,
  candidate: Phase10C0VReferenceCandidate,
  check: Phase10C0VTargetedCheckReceipt,
): void {
  validatePhase10C0VReferenceCandidate(
    inspection,
    layer,
    candidatePath,
    candidateBytes,
    candidate,
  );
  const attemptRoot = phase10C0VReferenceAttemptRoot(candidate.attemptId);
  if (checkPath !== `${attemptRoot}/targeted-check.json`) {
    fail("targeted check path differs from candidate attemptId");
  }
  if (
    check.checkId !== `phase10-c0v-${layer}-${candidate.attemptId}-targeted-check-v1` ||
    check.attemptId !== candidate.attemptId ||
    check.layer !== layer ||
    check.layerId !== candidate.layerId ||
    check.branch !== candidate.branch ||
    check.protocolId !== candidate.protocolId ||
    check.freezeCommit !== candidate.freezeCommit ||
    check.runtime !== EXPECTED_RUNTIME ||
    check.completedAt < candidate.completedAt
  ) {
    fail("targeted check provenance differs from candidate");
  }
  assertNotFutureInstant(check.completedAt, "targeted check.completedAt");
  sameIdentity(check.protocol, inspection.protocolIdentity, "targeted check protocol");
  sameIdentity(
    check.candidate,
    phase10C0VArtifactIdentity(candidatePath, candidateBytes),
    "targeted check candidate",
  );
  sameCodeIdentity(check.checker, inspection.checker, "targeted check checker");
  sameJson(check.codeAndImportReceipt, inspection.importReceipt, "targeted check import receipt");
  if (
    check.command !== phase10C0VReferenceCheckCommand(
      layer,
      inspection.protocolIdentity.path,
      candidate.attemptId,
    )
  ) {
    fail("targeted check command differs from the frozen command");
  }
  if (layer === "static") {
    if (check.verdict !== "refusal") fail("static targeted check must validate the registered refusal");
  } else if (check.verdict !== "pass" && check.verdict !== "fail") {
    fail(`${layer} targeted check must yield pass or discrepancy failure`);
  }
}

function ensureUnaliasedParent(root: string, target: string): void {
  const parent = dirname(target);
  const rel = relative(root, parent);
  if (rel === ".." || rel.startsWith(`..${sep}`) || isAbsolute(rel)) {
    fail("publication parent escapes the repository root");
  }
  let current = root;
  for (const part of rel.split(sep).filter((entry) => entry.length > 0)) {
    current = resolve(current, part);
    if (!existsSync(current)) mkdirSync(current);
    const stat = lstatSync(current);
    if (!stat.isDirectory() || stat.isSymbolicLink() || realpathSync(current) !== current) {
      fail("publication parent chain contains an alias, symlink, or non-directory");
    }
  }
}

function protocolForbiddenImportPatterns(
  protocol: Phase10C0VLayerProtocol,
): readonly string[] {
  const independence = object(protocol.independence, "protocol.independence");
  const patterns = stringArray(
    independence.forbiddenImports,
    "protocol.independence.forbiddenImports",
  );
  assertSortedUnique(patterns, "protocol.independence.forbiddenImports");
  return patterns;
}

function finalCodeAndImportReceipt(
  inspection: Phase10C0VFreezeInspection,
  candidate: Phase10C0VReferenceCandidate,
  check: Phase10C0VTargetedCheckReceipt,
  publishCommand: string,
  publishCompletedAt: string,
): StrictJson {
  return strictJsonSnapshot(parsePhase10C0VFinalCodeAndImportReceipt({
    protocolBindings: inspection.protocol.bindings,
    freezePreflight: {
      branch: EXPECTED_BRANCH,
      head: inspection.freezeCommit,
      runtime: EXPECTED_RUNTIME,
      trackedWorktreeClean: true,
      protocol: inspection.protocolIdentity,
    },
    commands: {
      derive: candidate.command,
      check: check.command,
      publish: publishCommand,
    },
    timestamps: {
      deriveStartedAt: candidate.startedAt,
      deriveCompletedAt: candidate.completedAt,
      checkCompletedAt: check.completedAt,
      publishCompletedAt,
    },
    codeIdentities: {
      generator: inspection.generator,
      independentChecker: inspection.checker,
      sharedParser: inspection.sharedParser,
      neutralDerive: inspection.neutralDerive,
      neutralCheck: inspection.neutralCheck,
      neutralPublish: inspection.neutralPublish,
    },
    observedImports: {
      generator: inspection.importReceipt.generator,
      independentChecker: inspection.importReceipt.independentChecker,
    },
    allowedSharedImports: inspection.importReceipt.allowedSharedPaths,
    forbiddenImportPatterns: protocolForbiddenImportPatterns(inspection.protocol),
    forbiddenImportsObserved: inspection.importReceipt.forbiddenPaths,
    generatorCheckerScientificImportOverlap: [],
    pass: true,
  }));
}

function fsyncFile(path: string): void {
  const descriptor = openSync(path, "r+");
  try {
    fsyncSync(descriptor);
  } finally {
    closeSync(descriptor);
  }
}

function writeOrMatchAtomic(root: string, target: string, bytes: Uint8Array): void {
  ensureUnaliasedParent(root, target);
  if (existsSync(target)) {
    const stat = lstatSync(target);
    if (!stat.isFile() || stat.isSymbolicLink()) fail("publication target must be a regular file");
    const real = realpathSync(target);
    const rel = relative(root, real);
    if (rel === "" || rel === ".." || rel.startsWith(`..${sep}`) || isAbsolute(rel)) {
      fail("publication target resolves outside the repository root");
    }
    if (!Buffer.from(readFileSync(target)).equals(Buffer.from(bytes))) {
      fail("publication target exists with different bytes");
    }
    return;
  }
  const temporary = `${target}.phase10-c0v-${process.pid}.tmp`;
  if (existsSync(temporary)) fail("publication staging path already exists");
  try {
    writeFileSync(temporary, bytes, { flag: "wx" });
    fsyncFile(temporary);
    renameSync(temporary, target);
    fsyncFile(target);
  } finally {
    if (existsSync(temporary)) rmSync(temporary, { force: true });
  }
}

export function writePhase10C0VStagingArtifact(
  repositoryRoot: string,
  repositoryPath: string,
  bytes: Uint8Array,
): void {
  const root = assertRepositoryRoot(repositoryRoot);
  const path = safeRepositoryPath(repositoryPath, "staging artifact path");
  if (!path.startsWith("out/phase10-c0v-reference-v1/attempts/")) {
    fail("staging artifact path must stay below the registered C0V reference attempt root");
  }
  writeOrMatchAtomic(root, resolveContained(root, path, "staging artifact path"), bytes);
}

function finalReference(
  inspection: Phase10C0VFreezeInspection,
  candidate: Phase10C0VReferenceCandidate,
  check: Phase10C0VTargetedCheckReceipt,
  publishedAt: string,
  publishCommand: string,
): StrictJson {
  const codeAndImportReceipt = finalCodeAndImportReceipt(
    inspection,
    candidate,
    check,
    publishCommand,
    publishedAt,
  );
  if (candidate.layer === "static") {
    const staticOutput = object(candidate.generatorOutput, "static generator output");
    return strictJsonSnapshot({
      schema: "phase10-c0v-reference-refusal-v1",
      refusalId: "phase10-c0v-static-reference-refusal-v1",
      protocolId: candidate.protocolId,
      layerId: candidate.layerId,
      branch: "reference-refusal",
      protocol: candidate.protocol,
      freezeCommit: candidate.freezeCommit,
      createdAt: publishedAt,
      reasonCode: staticOutput.reasonCode,
      unavailableOperands: staticOutput.unavailableOperands,
      attemptedRoutes: staticOutput.attemptedRoutes,
      forbiddenSubstitutes: staticOutput.forbiddenSubstitutes,
      contractEvidence: {
        sourceAudit: staticOutput.contractEvidence,
        codeAndImportReceipt,
      },
      independentCheck: check.independentOutput,
      executionRecord: staticOutput.executionRecord,
      downstreamEffect: staticOutput.downstreamEffect,
      claimBoundary: staticOutput.claimBoundary,
    });
  }
  return strictJsonSnapshot({
    schema: candidate.layer === "radial" ? "phase10-c0v-radial-reference-v1" : "phase10-c0v-moving-reference-v1",
    referenceId: `phase10-c0v-${candidate.layer}-reference-v1`,
    protocolId: candidate.protocolId,
    layerId: candidate.layerId,
    branch: "independent-reference",
    protocol: candidate.protocol,
    freezeCommit: candidate.freezeCommit,
    createdAt: publishedAt,
    generatorOutput: candidate.generatorOutput,
    independentCheck: check.independentOutput,
    codeAndImportReceipt,
    comparison: check.comparison,
    disposition: check.verdict === "pass"
      ? "reference-frozen"
      : "reference-discrepancy-refusal",
    claimBoundary: object(inspection.protocol.claimBoundary, "protocol claimBoundary"),
  });
}

function existingPublicationTimestamp(
  root: string,
  outputPath: string,
  layer: Phase10C0VReferenceLayer,
): string | undefined {
  const target = resolveContained(root, outputPath, "output path");
  if (!existsSync(target)) return undefined;
  const bytes = readRegular(root, outputPath, "existing publication");
  const parsed = parsePrettyJsonBytes(bytes, "existing publication");
  const value = layer === "static"
    ? parsePhase10C0VReferenceRefusal(parsed)
    : parsePhase10C0VReferenceEnvelope(parsed);
  return isoInstant(value.createdAt, "existing publication.createdAt");
}

export function publishPhase10C0VReference(request: Phase10C0VPublishRequest): Phase10C0VArtifactIdentity {
  const inspection = inspectPhase10C0VReferenceFreeze({
    repositoryRoot: request.repositoryRoot,
    layer: request.layer,
    protocolPath: request.protocolPath,
  });
  const candidatePath = safeRepositoryPath(request.candidatePath, "candidate path");
  const checkPath = safeRepositoryPath(request.checkPath, "check path");
  const outputPath = safeRepositoryPath(request.outputPath, "output path");
  const expectedOutput = request.layer === "static"
    ? inspection.protocol.artifactPaths.referenceRefusal
    : inspection.protocol.artifactPaths.reference;
  if (outputPath !== expectedOutput) fail("publication output path differs from protocol");
  const candidateRead = readCandidate(inspection.root, candidatePath);
  const expectedPublishCommand = phase10C0VReferencePublishCommand(
    request.layer,
    inspection.protocolIdentity.path,
    candidateRead.value.attemptId,
    outputPath,
  );
  if (request.command !== expectedPublishCommand) {
    fail("publication command differs from the frozen command");
  }
  const recheck = spawnSync(
    process.execPath,
    [
      "runner/src/phase10-c0v-reference-check.ts",
      "verify",
      "--repository-root",
      ".",
      "--layer",
      request.layer,
      "--protocol",
      inspection.protocolIdentity.path,
      "--candidate",
      candidatePath,
      "--receipt",
      checkPath,
    ],
    { cwd: inspection.root, encoding: "utf8" },
  );
  if (recheck.error !== undefined || recheck.status !== 0) {
    fail(
      `independent targeted check re-execution failed: ${(
        recheck.stderr || recheck.error?.message || "unknown error"
      ).trim()}`,
    );
  }
  const checkRead = readCheck(inspection.root, checkPath);
  assertCandidateAndCheck(
    inspection,
    request.layer,
    candidatePath,
    checkPath,
    candidateRead.bytes,
    candidateRead.value,
    checkRead.value,
  );
  const retainedPublishedAt = existingPublicationTimestamp(
    inspection.root,
    outputPath,
    request.layer,
  );
  const publishedAt = isoInstant(
    retainedPublishedAt ?? new Date().toISOString(),
    "publication timestamp",
  );
  if (publishedAt < checkRead.value.completedAt) {
    fail("publication timestamp precedes targeted-check completion");
  }
  assertNotFutureInstant(publishedAt, "publication timestamp");
  const finalValue = finalReference(
    inspection,
    candidateRead.value,
    checkRead.value,
    publishedAt,
    expectedPublishCommand,
  );
  if (request.layer === "static") parsePhase10C0VReferenceRefusal(finalValue);
  else parsePhase10C0VReferenceEnvelope(finalValue);
  const bytes = phase10C0VPrettyJsonBytes(finalValue);
  writeOrMatchAtomic(
    inspection.root,
    resolveContained(inspection.root, outputPath, "output path"),
    bytes,
  );
  return phase10C0VArtifactIdentity(outputPath, bytes);
}

function cliArguments(argv: readonly string[]): Phase10C0VPublishRequest {
  if (
    argv.length !== 13 ||
    argv[0] !== "publish" ||
    argv[1] !== "--repository-root" ||
    argv[3] !== "--layer" ||
    argv[5] !== "--protocol" ||
    argv[7] !== "--candidate" ||
    argv[9] !== "--check" ||
    argv[11] !== "--out"
  ) {
    fail(
      "usage: publish --repository-root <root> --layer <radial|moving|static> " +
      "--protocol <path> --candidate <path> --check <path> --out <path>",
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
  const checkPath = argv[10] as string;
  if (checkPath !== `${phase10C0VReferenceAttemptRoot(attemptId)}/targeted-check.json`) {
    fail("check path does not identify the same registered attempt root");
  }
  const protocolPath = argv[6] as string;
  const outputPath = argv[12] as string;
  return {
    repositoryRoot: argv[2] as string,
    layer,
    protocolPath,
    candidatePath,
    checkPath,
    outputPath,
    command: phase10C0VReferencePublishCommand(layer, protocolPath, attemptId, outputPath),
  };
}

function main(): void {
  const result = publishPhase10C0VReference(cliArguments(process.argv.slice(2)));
  process.stdout.write(`${JSON.stringify({ status: "published", ...result })}\n`);
}

if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    main();
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}
