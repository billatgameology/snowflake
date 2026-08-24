import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, lstatSync, readFileSync, realpathSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, isAbsolute, relative, resolve, sep } from "node:path";
import type * as TypeScript from "typescript";
import {
  phase10C0VS6ArtifactIdentity,
  phase10C0VS6SafeRelativePath,
  type Phase10C0VS6ArtifactIdentity,
} from "./phase10-c0v-s6-execution-contracts.ts";

export interface Phase10C0VS6CallableRegistration {
  readonly callableId: string;
  readonly modulePath: string;
  readonly exportName: string;
  readonly identity: Phase10C0VS6ArtifactIdentity;
}

export interface Phase10C0VS6RuntimeEntrypointRegistration {
  readonly role: "parent-executor" | "worker-dispatcher";
  readonly modulePath: string;
  readonly exportName: string;
  readonly identity: Phase10C0VS6ArtifactIdentity;
}

export interface Phase10C0VS6ImportAuditReceipt {
  readonly rootModule: Phase10C0VS6ArtifactIdentity;
  readonly closure: readonly Phase10C0VS6ArtifactIdentity[];
  readonly resolutionArtifacts: readonly Phase10C0VS6ArtifactIdentity[];
  readonly parserRuntimeArtifacts: readonly Phase10C0VS6ArtifactIdentity[];
  readonly externalPackages: readonly string[];
  readonly builtinModules: readonly string[];
  readonly forbiddenPaths: readonly string[];
  readonly forbiddenIdentifiers: readonly string[];
}

const FORBIDDEN_OLD_EXECUTOR_PATHS = Object.freeze([
  "runner/src/phase10-c0-contracts.ts",
  "runner/src/phase10-c0-derive-verification-receipt.ts",
  "runner/src/phase10-c0-derive.ts",
  "runner/src/phase10-c0-independent.ts",
  "runner/src/phase10-c0-publish-verification-receipt.ts",
  "runner/src/phase10-c0-publication-verifier.ts",
  "runner/src/phase10-c0-publish.ts",
  "runner/src/phase10-execution-receipt.ts",
  "runner/src/phase10-execution-preflight.ts",
  "runner/src/phase10-executor-worker.ts",
  "runner/src/phase10-executor.ts",
  "runner/src/phase10-obligation-preflight.ts",
]);

const FORBIDDEN_TEST_HOOK_IDENTIFIERS = Object.freeze([
  "testAlphaOverride",
  "testExtraSeedSites",
  "testMode",
]);
const FORBIDDEN_TEST_HOOK_SET: ReadonlySet<string> = new Set(FORBIDDEN_TEST_HOOK_IDENTIFIERS);
const LOADER_REFERENCE_NAMES: ReadonlySet<string> = new Set([
  "require", "eval", "Function", "createRequire", "getBuiltinModule", "constructor", "__proto__",
]);
const LOADER_CAPABLE_GLOBAL_NAMES: ReadonlySet<string> = new Set([
  "global", "globalThis", "module", "process", "Reflect",
]);
const PROTOTYPE_CONSTRUCTION_API_NAMES: ReadonlySet<string> = new Set([
  "create", "defineProperties", "defineProperty", "getPrototypeOf", "setPrototypeOf",
]);
const SAFE_GET_PROTOTYPE_PATHS: ReadonlySet<string> = new Set([
  "runner/src/gate4-evidence.ts",
  "runner/src/gate4-protocol.ts",
  // Parent accepts only the transport decoder's deliberately null-prototype payload objects.
  "runner/src/phase10-c0v-s6-executor.ts",
  // The strict parent/worker wire codec rejects inherited accessors, custom prototypes, and
  // extended byte views before converting an IPC payload into canonical inert JSON.
  "runner/src/phase10-c0v-s6-worker-transport.ts",
  "solver-cpu/src/gg-solver.ts",
]);
const SAFE_REFLECT_OWN_KEYS_PATHS: ReadonlySet<string> = new Set([
  "runner/src/gate4-evidence.ts",
  "runner/src/gate4-protocol.ts",
  "runner/src/phase10-c0v-s6-worker-transport.ts",
]);
const SAFE_PROCESS_PID_PATHS: ReadonlySet<string> = new Set([
  // This pre-S6 helper is byte-frozen by the radial anti-tuning rule.  Its sole direct pid read
  // is not a loader access; every new S6 module must use a named node:process import instead.
  "runner/src/gate4-evidence.ts",
]);
const IMPORT_AUDIT_MODULE_PATH = "runner/src/phase10-c0v-s6-import-audit.ts" as const;
const EXACT_TYPESCRIPT_VERSION = "5.9.3" as const;
const EXACT_TYPESCRIPT_RUNTIME = Object.freeze({
  modulePath: "node_modules/typescript/lib/typescript.js",
  moduleByteLength: 9_112_572,
  moduleSha256: "3ae902c92cc44dace175c0e69e13a4b0899f6983c6121d76b9ab8dd5795e7675",
  manifestPath: "node_modules/typescript/package.json",
  manifestByteLength: 3_620,
  manifestSha256: "822ef7ca6452205657b6288b066481ecf508bfbf43455d715cf7d3ec457561e6",
  lockResolved: "https://registry.npmjs.org/typescript/-/typescript-5.9.3.tgz",
  lockIntegrity: "sha512-jl1vZzPDinLr9eUt3J/t7V6FgNEw9QjvBPdysz9KfQDD41fQrC2Y4vKQdiaUpFT4bXlb1RHhLpp8wtm6M5TgSw==",
});
const DEFAULT_EXTERNAL_PACKAGES: ReadonlySet<string> = new Set(["typescript"]);
const CRYPTO_BUILTINS = Object.freeze(["node:crypto"] as const);
const STRUCTURAL_BUILTINS = Object.freeze(["node:crypto", "node:fs", "node:path"] as const);
const STRUCTURAL_PROCESS_BUILTINS = Object.freeze([
  "node:crypto", "node:fs", "node:path", "node:process",
] as const);
const PUBLICATION_BUILTINS = Object.freeze([
  "node:child_process", "node:crypto", "node:fs", "node:path", "node:process",
] as const);
const DEEP_PUBLICATION_VERIFIER_BUILTINS = Object.freeze([
  "node:child_process", "node:crypto", "node:fs", "node:module", "node:path", "node:process",
] as const);
const FREEZE_BUILTINS = Object.freeze([
  "node:child_process", "node:crypto", "node:fs", "node:module", "node:path",
] as const);
const FREEZE_PROCESS_BUILTINS = Object.freeze([
  "node:child_process", "node:crypto", "node:fs", "node:module", "node:path", "node:process",
] as const);
const AST_AUDIT_BUILTINS = Object.freeze([
  "node:child_process", "node:crypto", "node:fs", "node:module", "node:path",
] as const);
const PARENT_EXECUTOR_BUILTINS = Object.freeze([
  "node:buffer", "node:child_process", "node:crypto", "node:fs", "node:module", "node:path",
  "node:process", "node:url",
] as const);
const WORKER_DISPATCHER_BUILTINS = Object.freeze([
  "node:buffer", "node:child_process", "node:crypto", "node:fs", "node:module", "node:path",
  "node:process", "node:url",
] as const);

/** Runtime orchestrators are catalogue authority, not scientific/verification registry callables. */
const EXACT_RUNTIME_ENTRYPOINT_POLICY = Object.freeze({
  "parent-executor": Object.freeze({
    modulePath: "runner/src/phase10-c0v-s6-executor.ts",
    exportName: "phase10C0VS6RunExecutor",
    externalPackages: Object.freeze(["typescript"] as const),
    builtinModules: PARENT_EXECUTOR_BUILTINS,
  }),
  "worker-dispatcher": Object.freeze({
    modulePath: "runner/src/phase10-c0v-s6-executor-worker.ts",
    exportName: "phase10C0VS6ExecutorWorker",
    externalPackages: Object.freeze(["typescript"] as const),
    builtinModules: WORKER_DISPATCHER_BUILTINS,
  }),
} satisfies Readonly<Record<
  Phase10C0VS6RuntimeEntrypointRegistration["role"],
  Readonly<{
    readonly modulePath: string;
    readonly exportName: string;
    readonly externalPackages: readonly string[];
    readonly builtinModules: readonly string[];
  }>
>>);

/** Exact union of callable IDs registered by the eight execution-v2 packet registries. */
const EXACT_BUILTIN_MODULES_BY_CALLABLE = Object.freeze({
  "phase10-a-p-c0v-s6-check-caller": AST_AUDIT_BUILTINS,
  "phase10-a-p-c0v-s6-evaluator": AST_AUDIT_BUILTINS,
  "phase10-a-p-c0v-s6-producer": AST_AUDIT_BUILTINS,
  "phase10-a-p-c0v-s6-verification-receipt-writer": STRUCTURAL_BUILTINS,
  "phase10-c0v-aggregate-check-caller": DEEP_PUBLICATION_VERIFIER_BUILTINS,
  "phase10-c0v-aggregate-evaluator": DEEP_PUBLICATION_VERIFIER_BUILTINS,
  "phase10-c0v-aggregate-producer": PUBLICATION_BUILTINS,
  "phase10-c0v-aggregate-verification-receipt-writer": STRUCTURAL_BUILTINS,
  "phase10-c0v-moving-attempt-receipt-writer": STRUCTURAL_BUILTINS,
  "phase10-c0v-moving-evaluator": STRUCTURAL_PROCESS_BUILTINS,
  "phase10-c0v-moving-produce-check-caller": STRUCTURAL_PROCESS_BUILTINS,
  "phase10-c0v-moving-protocol-producer": STRUCTURAL_BUILTINS,
  "phase10-c0v-moving-publication-verifier": DEEP_PUBLICATION_VERIFIER_BUILTINS,
  "phase10-c0v-moving-publish-check-caller": DEEP_PUBLICATION_VERIFIER_BUILTINS,
  "phase10-c0v-moving-publish-producer": PUBLICATION_BUILTINS,
  "phase10-c0v-moving-publish-verification-receipt-writer": STRUCTURAL_BUILTINS,
  "phase10-c0v-moving-reference-producer": STRUCTURAL_BUILTINS,
  "phase10-c0v-radial-attempt-receipt-writer": STRUCTURAL_BUILTINS,
  "phase10-c0v-radial-evaluation-receipt-writer": STRUCTURAL_BUILTINS,
  "phase10-c0v-radial-evaluator": STRUCTURAL_BUILTINS,
  "phase10-c0v-radial-produce-check-caller": STRUCTURAL_BUILTINS,
  "phase10-c0v-radial-production-producer": CRYPTO_BUILTINS,
  "phase10-c0v-radial-protocol-producer": STRUCTURAL_BUILTINS,
  "phase10-c0v-radial-publication-verifier": DEEP_PUBLICATION_VERIFIER_BUILTINS,
  "phase10-c0v-radial-publish-check-caller": DEEP_PUBLICATION_VERIFIER_BUILTINS,
  "phase10-c0v-radial-publish-producer": PUBLICATION_BUILTINS,
  "phase10-c0v-radial-publish-verification-receipt-writer": STRUCTURAL_BUILTINS,
  "phase10-c0v-radial-reference-producer": STRUCTURAL_BUILTINS,
  "phase10-c0v-s6-attempt-census-check-caller": FREEZE_PROCESS_BUILTINS,
  "phase10-c0v-s6-attempt-census-evaluator": FREEZE_PROCESS_BUILTINS,
  "phase10-c0v-s6-freeze-check-caller": FREEZE_BUILTINS,
  "phase10-c0v-s6-freeze-evaluator": FREEZE_BUILTINS,
  "phase10-c0v-s6-preflight-receipt-writer": STRUCTURAL_BUILTINS,
  "phase10-c0v-s6-packet-verification-receipt-writer": STRUCTURAL_BUILTINS,
  "phase10-c0v-s6-refusal-check-caller": STRUCTURAL_PROCESS_BUILTINS,
  "phase10-c0v-s6-refusal-evaluator": STRUCTURAL_PROCESS_BUILTINS,
  "phase10-c0v-s6-resource-check-caller": STRUCTURAL_PROCESS_BUILTINS,
  "phase10-c0v-s6-resource-evaluator": STRUCTURAL_PROCESS_BUILTINS,
  "phase10-c0v-s6-terminal-receipt-writer": STRUCTURAL_BUILTINS,
  "phase10-c0v-static-attempt-receipt-writer": STRUCTURAL_BUILTINS,
  "phase10-c0v-static-produce-check-caller": STRUCTURAL_PROCESS_BUILTINS,
  "phase10-c0v-static-protocol-producer": STRUCTURAL_BUILTINS,
  "phase10-c0v-static-publication-verifier": DEEP_PUBLICATION_VERIFIER_BUILTINS,
  "phase10-c0v-static-publish-check-caller": DEEP_PUBLICATION_VERIFIER_BUILTINS,
  "phase10-c0v-static-publish-producer": PUBLICATION_BUILTINS,
  "phase10-c0v-static-publish-verification-receipt-writer": STRUCTURAL_BUILTINS,
  "phase10-c0v-static-refusal-evaluator": STRUCTURAL_PROCESS_BUILTINS,
  "phase10-c0v-static-refusal-receipt-writer": STRUCTURAL_BUILTINS,
  "phase10-nc-a-p-c0v-s6-missing-producer": STRUCTURAL_BUILTINS,
  "phase10-nc-a-p-c0v-s6-uncalled-check": STRUCTURAL_BUILTINS,
  "phase10-nc-c0v-any-layer-nonpass": PUBLICATION_BUILTINS,
  "phase10-nc-radial-finite-shell-term": CRYPTO_BUILTINS,
  "phase10-nc-radial-forged-summary": CRYPTO_BUILTINS,
  "phase10-nc-radial-robin-coefficient": CRYPTO_BUILTINS,
} satisfies Readonly<Record<string, readonly string[]>>);

function fail(message: string): never {
  throw new Error(`Phase 10 C0V S6 import audit refused: ${message}`);
}

function exactInstalledRuntimeFile(
  repositoryRoot: string,
  relativePath: string,
  expectedByteLength: number,
  expectedSha256: string,
): Readonly<{ readonly absolutePath: string; readonly bytes: Uint8Array; readonly identity: Phase10C0VS6ArtifactIdentity }> {
  const absolutePath = resolve(repositoryRoot, relativePath);
  const stat = lstatSync(absolutePath);
  if (!stat.isFile() || stat.isSymbolicLink() || stat.nlink !== 1) {
    fail(`${relativePath} is not the exact unique installed runtime file`);
  }
  const physical = realpathSync(absolutePath);
  if (relative(absolutePath, physical) !== "" || relative(physical, absolutePath) !== "") {
    fail(`${relativePath} resolves through an installed-runtime alias or junction`);
  }
  const bytes = new Uint8Array(readFileSync(physical));
  const sha256 = createHash("sha256").update(bytes).digest("hex");
  if (bytes.byteLength !== expectedByteLength || sha256 !== expectedSha256) {
    fail(`${relativePath} differs from the exact pre-load TypeScript runtime identity`);
  }
  return Object.freeze({
    absolutePath,
    bytes,
    identity: phase10C0VS6ArtifactIdentity(relativePath, bytes),
  });
}

function loadTrustedTypeScriptRuntime(): Readonly<{
  readonly runtime: typeof TypeScript;
  readonly artifacts: readonly Phase10C0VS6ArtifactIdentity[];
}> {
  const repositoryRoot = resolve(import.meta.dirname, "../..");
  const physicalRoot = realpathSync(repositoryRoot);
  if (relative(repositoryRoot, physicalRoot) !== "" || relative(physicalRoot, repositoryRoot) !== "") {
    fail("installed TypeScript repository root resolves through an alias or junction");
  }
  const moduleFile = exactInstalledRuntimeFile(
    repositoryRoot,
    EXACT_TYPESCRIPT_RUNTIME.modulePath,
    EXACT_TYPESCRIPT_RUNTIME.moduleByteLength,
    EXACT_TYPESCRIPT_RUNTIME.moduleSha256,
  );
  const manifestFile = exactInstalledRuntimeFile(
    repositoryRoot,
    EXACT_TYPESCRIPT_RUNTIME.manifestPath,
    EXACT_TYPESCRIPT_RUNTIME.manifestByteLength,
    EXACT_TYPESCRIPT_RUNTIME.manifestSha256,
  );
  const manifest = jsonObject(manifestFile.bytes, EXACT_TYPESCRIPT_RUNTIME.manifestPath);
  if (manifest.version !== EXACT_TYPESCRIPT_VERSION) fail("installed TypeScript manifest version differs");
  const lock = jsonObject(
    new Uint8Array(readFileSync(resolve(repositoryRoot, "package-lock.json"))),
    "package-lock.json",
  );
  const packages = lock.packages;
  if (packages === null || typeof packages !== "object" || Array.isArray(packages)) {
    fail("package-lock.json packages is not an object");
  }
  const locked = (packages as Record<string, unknown>)["node_modules/typescript"];
  if (locked === null || typeof locked !== "object" || Array.isArray(locked)) {
    fail("package-lock.json lacks the exact TypeScript installation");
  }
  const lockRow = locked as Record<string, unknown>;
  if (lockRow.version !== EXACT_TYPESCRIPT_VERSION ||
    lockRow.resolved !== EXACT_TYPESCRIPT_RUNTIME.lockResolved ||
    lockRow.integrity !== EXACT_TYPESCRIPT_RUNTIME.lockIntegrity) {
    fail("package-lock.json TypeScript version/resolution/integrity differs");
  }
  const trustedLoader = createRequire(import.meta.url);
  const resolvedModule = trustedLoader.resolve("typescript");
  if (relative(resolvedModule, moduleFile.absolutePath) !== "" ||
    relative(moduleFile.absolutePath, resolvedModule) !== "") {
    fail("TypeScript resolution differs from the exact pre-hashed installed module");
  }
  if (trustedLoader.cache[resolvedModule] !== undefined) {
    fail("TypeScript runtime was prepopulated in require.cache before identity validation");
  }
  const runtime = trustedLoader(resolvedModule) as typeof TypeScript;
  if (runtime.version !== EXACT_TYPESCRIPT_VERSION) {
    fail(`TypeScript runtime ${runtime.version} differs from ${EXACT_TYPESCRIPT_VERSION}`);
  }
  return Object.freeze({
    runtime,
    artifacts: Object.freeze([moduleFile.identity, manifestFile.identity]),
  });
}

const TRUSTED_TYPESCRIPT_RUNTIME = loadTrustedTypeScriptRuntime();
const ts = TRUSTED_TYPESCRIPT_RUNTIME.runtime;
export const PHASE10_C0V_S6_TYPESCRIPT_RUNTIME_ARTIFACTS = TRUSTED_TYPESCRIPT_RUNTIME.artifacts;

function exactBuiltinModules(callableId: string): readonly string[] {
  const registered = EXACT_BUILTIN_MODULES_BY_CALLABLE[
    callableId as keyof typeof EXACT_BUILTIN_MODULES_BY_CALLABLE
  ];
  if (registered === undefined) fail(`${callableId} has no exact registered builtin-module allowlist`);
  return registered;
}

export function phase10C0VS6AssertBuiltinAllowlistRegistryCoverage(
  callableIds: readonly string[],
): void {
  const actual = [...new Set(callableIds)].sort(codePointCompare);
  const expected = Object.keys(EXACT_BUILTIN_MODULES_BY_CALLABLE).sort(codePointCompare);
  if (actual.length !== expected.length ||
    actual.some((entry, index) => entry !== expected[index])) {
    fail("registered callable-ID union differs from the exact builtin-module allowlist key roster");
  }
}

function safeRoot(value: string): string {
  const requested = resolve(value);
  const root = realpathSync(requested);
  const stat = lstatSync(root);
  if (
    !stat.isDirectory() || stat.isSymbolicLink() ||
    relative(requested, root) !== "" || relative(root, requested) !== ""
  ) fail("repository root must be a physical directory without an alias or junction");
  return root;
}

function codePointCompare(left: string, right: string): number {
  const leftPoints = Array.from(left, (entry) => entry.codePointAt(0) as number);
  const rightPoints = Array.from(right, (entry) => entry.codePointAt(0) as number);
  for (let index = 0; index < Math.min(leftPoints.length, rightPoints.length); index += 1) {
    const difference = (leftPoints[index] as number) - (rightPoints[index] as number);
    if (difference !== 0) return difference;
  }
  return leftPoints.length - rightPoints.length;
}

function gitOutput(
  root: string,
  args: readonly string[],
  label: string,
  input?: Uint8Array,
): Uint8Array {
  try {
    return new Uint8Array(execFileSync("git", [...args], {
      cwd: root,
      input,
      encoding: "buffer",
      maxBuffer: 128 * 1024 * 1024,
      windowsHide: true,
      stdio: [input === undefined ? "ignore" : "pipe", "pipe", "pipe"],
    }));
  } catch (error) {
    fail(`${label}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function lowercaseCommitOrBlobId(bytes: Uint8Array, label: string): string {
  const value = new TextDecoder("utf-8", { fatal: true }).decode(bytes).trim();
  if (!/^[0-9a-f]{40}$/u.test(value)) fail(`${label} is not one lowercase 40-hex Git object ID`);
  return value;
}

/**
 * Returns the canonical HEAD blob identity for tracked resolution/rule metadata after proving the
 * physical checkout bytes clean-filter to that exact blob. This preserves Git's cross-platform
 * EOL semantics without treating a checkout-specific CRLF representation as frozen authority.
 */
export function phase10C0VS6GitCanonicalWorktreeIdentity(
  repositoryRoot: string,
  pathValue: string,
  suppliedLiveBytes?: Uint8Array,
): Phase10C0VS6ArtifactIdentity {
  const root = safeRoot(repositoryRoot);
  const path = phase10C0VS6SafeRelativePath(pathValue, "Git-canonical worktree path");
  const liveBytes = suppliedLiveBytes === undefined ? readRegular(root, path) : suppliedLiveBytes;
  const liveFilteredId = lowercaseCommitOrBlobId(
    gitOutput(root, ["hash-object", `--path=${path}`, "--stdin"], `${path} worktree Git filter`, liveBytes),
    `${path} filtered worktree blob ID`,
  );
  const headBlobId = lowercaseCommitOrBlobId(
    gitOutput(root, ["rev-parse", `HEAD:${path}`], `${path} launch-HEAD blob`),
    `${path} launch-HEAD blob ID`,
  );
  if (liveFilteredId !== headBlobId) {
    fail(`${path} physical worktree bytes do not Git-normalize to the exact launch-HEAD blob`);
  }
  const blobBytes = gitOutput(root, ["show", `HEAD:${path}`], `${path} launch-HEAD bytes`);
  return phase10C0VS6ArtifactIdentity(path, blobBytes);
}

/**
 * Proves that every raw-hashed TypeScript closure member is tracked as exact LF bytes and is
 * protected from checkout conversion. Call this only at implementation freeze, after the new
 * closure has been committed; pre-freeze tests separately inspect live LF bytes and attributes.
 */
export function phase10C0VS6AssertRawClosureEolAuthority(
  repositoryRoot: string,
  closurePaths: readonly string[],
): void {
  const root = safeRoot(repositoryRoot);
  const paths = [...new Set(closurePaths.map((entry) =>
    phase10C0VS6SafeRelativePath(entry, "raw closure EOL path")))].sort(codePointCompare);
  if (paths.length === 0) fail("raw closure EOL authority roster is empty");
  const decoder = new TextDecoder("utf-8", { fatal: true });
  for (const path of paths) {
    const attributeFields = decoder.decode(gitOutput(
      root,
      ["check-attr", "-z", "text", "--", path],
      `${path} text attribute`,
    )).split("\0");
    if (attributeFields.length !== 4 || attributeFields[0] !== path ||
      attributeFields[1] !== "text" || attributeFields[2] !== "unset" ||
      attributeFields[3] !== "") {
      fail(`${path} lacks exact -text checkout authority`);
    }
    const eolRecords = decoder.decode(gitOutput(
      root,
      ["ls-files", "--eol", "-z", "--", path],
      `${path} tracked EOL state`,
    )).split("\0").filter((entry) => entry.length !== 0);
    if (eolRecords.length !== 1) fail(`${path} is not exactly one tracked closure path`);
    const separator = eolRecords[0]!.indexOf("\t");
    const fields = separator < 0
      ? []
      : eolRecords[0]!.slice(0, separator).trim().split(/\s+/u);
    const observedPath = separator < 0 ? "" : eolRecords[0]!.slice(separator + 1);
    if (observedPath !== path || fields.length !== 3 || fields[0] !== "i/lf" ||
      fields[1] !== "w/lf" || fields[2] !== "attr/-text") {
      fail(`${path} is not exact tracked i/lf w/lf attr/-text authority`);
    }
  }
}

function readRegular(root: string, path: string): Uint8Array {
  const safe = phase10C0VS6SafeRelativePath(path, "module path");
  const absolute = resolve(root, safe);
  const displacement = relative(root, absolute);
  if (displacement === "" || displacement === ".." || displacement.startsWith(`..${sep}`) || isAbsolute(displacement)) {
    fail(`${path} escapes repository root`);
  }
  const stat = lstatSync(absolute);
  if (!stat.isFile() || stat.isSymbolicLink() || stat.nlink !== 1) {
    fail(`${path} is not a unique regular file`);
  }
  const physical = realpathSync(absolute);
  if (relative(absolute, physical) !== "" || relative(physical, absolute) !== "") {
    fail(`${path} resolves through an alias or junction`);
  }
  return new Uint8Array(readFileSync(physical));
}

interface WorkspaceResolution {
  readonly moduleBySpecifier: ReadonlyMap<string, string>;
  readonly artifacts: readonly Phase10C0VS6ArtifactIdentity[];
}

function jsonObject(bytes: Uint8Array, label: string): Record<string, unknown> {
  let value: unknown;
  try {
    value = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  } catch {
    fail(`${label} is not valid UTF-8 JSON`);
  }
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    fail(`${label} must be a JSON object`);
  }
  return value as Record<string, unknown>;
}

function workspaceResolution(root: string): WorkspaceResolution {
  const rootManifestPath = "package.json";
  const lockPath = "package-lock.json";
  const tsconfigPath = "tsconfig.json";
  const baseTsconfigPath = "tsconfig.base.json";
  const rootManifestBytes = readRegular(root, rootManifestPath);
  const lockBytes = readRegular(root, lockPath);
  const tsconfigBytes = readRegular(root, tsconfigPath);
  const baseTsconfigBytes = readRegular(root, baseTsconfigPath);
  const rootManifest = jsonObject(rootManifestBytes, rootManifestPath);
  if (!Array.isArray(rootManifest.workspaces) || rootManifest.workspaces.length === 0 ||
    rootManifest.workspaces.some((entry) => typeof entry !== "string" || entry.includes("*") || entry.includes("?"))) {
    fail("package.json workspaces must be a nonempty literal directory roster");
  }
  const moduleBySpecifier = new Map<string, string>();
  const artifacts: Phase10C0VS6ArtifactIdentity[] = [
    phase10C0VS6GitCanonicalWorktreeIdentity(root, rootManifestPath, rootManifestBytes),
    phase10C0VS6GitCanonicalWorktreeIdentity(root, lockPath, lockBytes),
    phase10C0VS6GitCanonicalWorktreeIdentity(root, tsconfigPath, tsconfigBytes),
    phase10C0VS6GitCanonicalWorktreeIdentity(root, baseTsconfigPath, baseTsconfigBytes),
  ];
  for (const [index, workspaceValue] of rootManifest.workspaces.entries()) {
    const workspace = phase10C0VS6SafeRelativePath(workspaceValue as string, `package.json workspaces[${index}]`);
    const manifestPath = `${workspace}/package.json`;
    const manifestBytes = readRegular(root, manifestPath);
    const manifest = jsonObject(manifestBytes, manifestPath);
    if (typeof manifest.name !== "string" || manifest.name.length === 0) {
      fail(`${manifestPath} lacks a package name`);
    }
    artifacts.push(phase10C0VS6GitCanonicalWorktreeIdentity(root, manifestPath, manifestBytes));
    if (manifest.exports !== undefined) {
      if (manifest.exports === null || typeof manifest.exports !== "object" || Array.isArray(manifest.exports)) {
        fail(`${manifestPath} exports must be an exact object`);
      }
      const rootExport = (manifest.exports as Record<string, unknown>)["."];
      if (typeof rootExport !== "string" || !rootExport.startsWith("./")) {
        fail(`${manifestPath} must expose one literal root TypeScript export`);
      }
      const exportPath = phase10C0VS6SafeRelativePath(
        `${workspace}/${rootExport.slice(2)}`,
        `${manifestPath} root export`,
      );
      if (moduleBySpecifier.has(manifest.name)) fail(`duplicate workspace package ${manifest.name}`);
      moduleBySpecifier.set(manifest.name, exportPath);
    }
  }
  artifacts.sort((left, right) => codePointCompare(left.path, right.path));
  return Object.freeze({
    moduleBySpecifier,
    artifacts: Object.freeze(artifacts),
  });
}

function sourceFile(path: string, bytes: Uint8Array): TypeScript.SourceFile {
  const source = ts.createSourceFile(
    path,
    new TextDecoder("utf-8", { fatal: true }).decode(bytes),
    ts.ScriptTarget.ESNext,
    true,
    ts.ScriptKind.TS,
  );
  const diagnostics = (
    source as TypeScript.SourceFile & { readonly parseDiagnostics?: readonly TypeScript.Diagnostic[] }
  ).parseDiagnostics ?? [];
  if (diagnostics.length !== 0) fail(`${path} has TypeScript parse diagnostics`);
  return source;
}

/**
 * Enforces the registered static-import and obvious reflective-loader policy. This is a
 * fail-closed AST policy over frozen source bytes, not a theorem against arbitrary hostile
 * JavaScript metaprogramming; closure byte freezing and callable-specific builtin rosters are
 * independent boundaries.
 */
function importedSpecifiers(
  path: string,
  bytes: Uint8Array,
  allowedExternalPackages: ReadonlySet<string>,
  includeTypeOnly: boolean,
): {
  readonly local: readonly string[];
  readonly external: readonly string[];
  readonly builtins: readonly string[];
  readonly forbiddenIdentifiers: readonly string[];
} {
  const source = sourceFile(path, bytes);
  const local: string[] = [];
  const external: string[] = [];
  const builtins: string[] = [];
  const forbidden = new Set<string>();
  const staticStrings = new Map<string, string>();
  const staticString = (node: TypeScript.Expression, seen: ReadonlySet<string> = new Set()): string | null => {
    if (ts.isStringLiteralLike(node)) return node.text;
    if (ts.isParenthesizedExpression(node)) return staticString(node.expression, seen);
    if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.PlusToken) {
      const left = staticString(node.left, seen);
      const right = staticString(node.right, seen);
      return left === null || right === null ? null : `${left}${right}`;
    }
    if (ts.isIdentifier(node) && !seen.has(node.text)) {
      return staticStrings.get(node.text) ?? null;
    }
    return null;
  };
  for (let pass = 0; pass < 2; pass += 1) {
    const collectStaticStrings = (node: TypeScript.Node): void => {
      if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer !== undefined &&
        ts.isVariableDeclarationList(node.parent) && (node.parent.flags & ts.NodeFlags.Const) !== 0) {
        const value = staticString(node.initializer);
        if (value !== null) staticStrings.set(node.name.text, value);
      }
      ts.forEachChild(node, collectStaticStrings);
    };
    collectStaticStrings(source);
  }
  const collect = (specifier: TypeScript.Node | undefined, label: string): void => {
    if (specifier === undefined || !ts.isStringLiteralLike(specifier)) {
      fail(`${label} in ${path} must use a literal module specifier`);
    }
    const exactAuditBootstrap = path === IMPORT_AUDIT_MODULE_PATH && specifier.text === "node:module";
    if ((!exactAuditBootstrap && specifier.text === "node:module") || specifier.text === "node:vm" ||
      specifier.text === "module" || specifier.text === "vm") {
      fail(`${label} in ${path} uses a forbidden alternate code loader ${specifier.text}`);
    }
    if (specifier.text.startsWith(".")) local.push(specifier.text);
    else if (specifier.text.startsWith("node:")) builtins.push(specifier.text);
    else {
      if (!allowedExternalPackages.has(specifier.text)) {
        fail(`${label} in ${path} uses unregistered external package ${specifier.text}`);
      }
      external.push(specifier.text);
    }
  };
  const visit = (node: TypeScript.Node): void => {
    if (ts.isIdentifier(node) && FORBIDDEN_TEST_HOOK_SET.has(node.text)) {
      forbidden.add(node.text);
    }
    if (ts.isImportDeclaration(node)) {
      const clause = node.importClause;
      const named = clause?.namedBindings !== undefined && ts.isNamedImports(clause.namedBindings)
        ? clause.namedBindings.elements
        : undefined;
      const typeOnly = clause?.isTypeOnly === true ||
        (clause !== undefined && clause.name === undefined && named !== undefined && named.length > 0 &&
          named.every((entry) => entry.isTypeOnly));
      if (includeTypeOnly || !typeOnly) collect(node.moduleSpecifier, "import declaration");
    }
    if (ts.isExportDeclaration(node) && node.moduleSpecifier !== undefined) {
      if (includeTypeOnly || !node.isTypeOnly) collect(node.moduleSpecifier, "export declaration");
    }
    if (ts.isImportEqualsDeclaration(node) && ts.isExternalModuleReference(node.moduleReference)) {
      collect(node.moduleReference.expression, "import-equals declaration");
    }
    if (ts.isCallExpression(node)) {
      const dynamicImport = node.expression.kind === ts.SyntaxKind.ImportKeyword;
      const commonJsRequire = ts.isIdentifier(node.expression) && node.expression.text === "require";
      if (dynamicImport || commonJsRequire) {
        if (node.arguments.length !== 1) fail(`${dynamicImport ? "dynamic import" : "require"} in ${path} must have one argument`);
        collect(node.arguments[0], dynamicImport ? "dynamic import" : "require");
      }
    }
    if (ts.isIdentifier(node)) {
      const exactAuditBootstrapReference =
        path === IMPORT_AUDIT_MODULE_PATH && node.text === "createRequire";
      if (LOADER_REFERENCE_NAMES.has(node.text) && !exactAuditBootstrapReference) {
        fail(`alternate code loader reference ${node.text} in ${path} is forbidden`);
      }
    }
    if (ts.isElementAccessExpression(node) && node.argumentExpression !== undefined) {
      const elementName = staticString(node.argumentExpression);
      if (elementName !== null && LOADER_REFERENCE_NAMES.has(elementName)) {
        fail(`alternate code loader reference ${elementName} in ${path} is forbidden`);
      }
    }
    if (ts.isIdentifier(node) && LOADER_CAPABLE_GLOBAL_NAMES.has(node.text)) {
      const parent = node.parent;
      const soleFrozenPidReference = node.text === "process" &&
        SAFE_PROCESS_PID_PATHS.has(path) && ts.isPropertyAccessExpression(parent) &&
        parent.expression === node && parent.name.text === "pid";
      const soleSafeReflectOwnKeys = node.text === "Reflect" &&
        ts.isPropertyAccessExpression(parent) && parent.expression === node &&
        parent.name.text === "ownKeys" && ts.isCallExpression(parent.parent) &&
        parent.parent.expression === parent && SAFE_REFLECT_OWN_KEYS_PATHS.has(path);
      if (!soleFrozenPidReference && !soleSafeReflectOwnKeys) {
        fail(`loader-capable global reference ${node.text} in ${path} is forbidden`);
      }
    }
    if (ts.isPropertyAccessExpression(node) && ts.isIdentifier(node.expression) &&
      node.expression.text === "Object" && PROTOTYPE_CONSTRUCTION_API_NAMES.has(node.name.text)) {
      const directCall = ts.isCallExpression(node.parent) && node.parent.expression === node;
      const safeNullPrototypeCreate = node.name.text === "create" && directCall &&
        node.parent.arguments.length === 1 && node.parent.arguments[0]!.kind === ts.SyntaxKind.NullKeyword;
      const safeFrozenPrototypeInspection = node.name.text === "getPrototypeOf" && directCall &&
        SAFE_GET_PROTOTYPE_PATHS.has(path);
      if (!safeNullPrototypeCreate && !safeFrozenPrototypeInspection) {
        fail(`prototype-construction API Object.${node.name.text} in ${path} is forbidden`);
      }
    }
    if (ts.isElementAccessExpression(node) && ts.isIdentifier(node.expression) &&
      node.expression.text === "Object" && node.argumentExpression !== undefined) {
      const elementName = staticString(node.argumentExpression);
      if (elementName !== null && PROTOTYPE_CONSTRUCTION_API_NAMES.has(elementName)) {
        fail(`computed prototype-construction API Object.${elementName} in ${path} is forbidden`);
      }
    }
    if (includeTypeOnly && ts.isImportTypeNode(node)) {
      if (!ts.isLiteralTypeNode(node.argument)) fail(`import type in ${path} must use a literal specifier`);
      collect(node.argument.literal, "import type");
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return Object.freeze({
    local: Object.freeze([...new Set(local)].sort(codePointCompare)),
    external: Object.freeze([...new Set(external)].sort(codePointCompare)),
    builtins: Object.freeze([...new Set(builtins)].sort(codePointCompare)),
    forbiddenIdentifiers: Object.freeze([...forbidden].sort(codePointCompare)),
  });
}

function resolveLocalImport(root: string, fromPath: string, specifier: string): string {
  const base = resolve(root, dirname(fromPath), specifier);
  const candidates = specifier.endsWith(".ts") ? [base] : [`${base}.ts`, resolve(base, "index.ts")];
  for (const candidate of candidates) {
    if (!existsSync(candidate)) continue;
    const stat = lstatSync(candidate);
    if (!stat.isFile() || stat.isSymbolicLink() || stat.nlink !== 1) {
      fail(`local import ${specifier} from ${fromPath} is not a unique regular file`);
    }
    const real = realpathSync(candidate);
    const displacement = relative(root, real);
    if (
      displacement === "" || displacement === ".." || displacement.startsWith(`..${sep}`) || isAbsolute(displacement) ||
      relative(candidate, real) !== "" || relative(real, candidate) !== ""
    ) {
      fail(`local import ${specifier} from ${fromPath} escapes repository root`);
    }
    return displacement.replaceAll("\\", "/");
  }
  fail(`local import ${specifier} from ${fromPath} does not resolve to TypeScript`);
}

export function phase10C0VS6ImportClosure(
  repositoryRoot: string,
  rootModulePath: string,
  allowedExternalPackages: ReadonlySet<string> = DEFAULT_EXTERNAL_PACKAGES,
): Phase10C0VS6ImportAuditReceipt {
  if (ts.version !== EXACT_TYPESCRIPT_VERSION) {
    fail(`TypeScript runtime ${ts.version} differs from ${EXACT_TYPESCRIPT_VERSION}`);
  }
  const root = safeRoot(repositoryRoot);
  const rootPath = phase10C0VS6SafeRelativePath(rootModulePath, "root module path");
  const workspace = workspaceResolution(root);
  const pending = [rootPath];
  const seen = new Set<string>();
  const identities: Phase10C0VS6ArtifactIdentity[] = [];
  const external = new Set<string>();
  const builtins = new Set<string>();
  const forbiddenIdentifiers = new Set<string>();
  const allowedImports = new Set([...allowedExternalPackages, ...workspace.moduleBySpecifier.keys()]);
  while (pending.length !== 0) {
    const path = pending.pop() as string;
    if (seen.has(path)) continue;
    seen.add(path);
    const bytes = readRegular(root, path);
    identities.push(phase10C0VS6ArtifactIdentity(path, bytes));
    const imports = importedSpecifiers(path, bytes, allowedImports, true);
    for (const packageName of imports.external) {
      const workspaceModule = workspace.moduleBySpecifier.get(packageName);
      if (workspaceModule !== undefined) pending.push(workspaceModule);
      else external.add(packageName);
    }
    for (const identifier of imports.forbiddenIdentifiers) forbiddenIdentifiers.add(identifier);
    for (const specifier of imports.local) pending.push(resolveLocalImport(root, path, specifier));
  }
  const runtimeSeen = new Set<string>();
  const runtimePending = [rootPath];
  while (runtimePending.length !== 0) {
    const path = runtimePending.pop() as string;
    if (runtimeSeen.has(path)) continue;
    runtimeSeen.add(path);
    const imports = importedSpecifiers(path, readRegular(root, path), allowedImports, false);
    for (const builtin of imports.builtins) builtins.add(builtin);
    for (const packageName of imports.external) {
      const workspaceModule = workspace.moduleBySpecifier.get(packageName);
      if (workspaceModule !== undefined) runtimePending.push(workspaceModule);
    }
    for (const specifier of imports.local) runtimePending.push(resolveLocalImport(root, path, specifier));
  }
  identities.sort((left, right) => codePointCompare(left.path, right.path));
  const forbiddenPaths = identities
    .map((identity) => identity.path)
    .filter((path) => FORBIDDEN_OLD_EXECUTOR_PATHS.includes(path))
    .sort(codePointCompare);
  return Object.freeze({
    rootModule: identities.find((identity) => identity.path === rootPath) as Phase10C0VS6ArtifactIdentity,
    closure: Object.freeze(identities),
    resolutionArtifacts: workspace.artifacts,
    parserRuntimeArtifacts: PHASE10_C0V_S6_TYPESCRIPT_RUNTIME_ARTIFACTS,
    externalPackages: Object.freeze([...external].sort(codePointCompare)),
    builtinModules: Object.freeze([...builtins].sort(codePointCompare)),
    forbiddenPaths: Object.freeze(forbiddenPaths),
    forbiddenIdentifiers: Object.freeze([...forbiddenIdentifiers].sort(codePointCompare)),
  });
}

export function phase10C0VS6AssertCallableRegistration(
  repositoryRoot: string,
  registration: Phase10C0VS6CallableRegistration,
  allowedExternalPackages: ReadonlySet<string> = DEFAULT_EXTERNAL_PACKAGES,
): Phase10C0VS6ImportAuditReceipt {
  const receipt = phase10C0VS6ImportClosure(repositoryRoot, registration.modulePath, allowedExternalPackages);
  if (
    receipt.rootModule.path !== registration.identity.path ||
    receipt.rootModule.byteLength !== registration.identity.byteLength ||
    receipt.rootModule.sha256 !== registration.identity.sha256
  ) fail(`${registration.callableId} module identity differs`);
  const root = safeRoot(repositoryRoot);
  const source = sourceFile(registration.modulePath, readRegular(root, registration.modulePath));
  const hasExport = source.statements.some((statement) =>
    ts.isFunctionDeclaration(statement) &&
    statement.body !== undefined &&
    statement.name?.text === registration.exportName &&
    statement.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword) === true &&
    statement.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.DefaultKeyword) !== true);
  if (!hasExport) fail(`${registration.callableId} lacks direct named export ${registration.exportName}`);
  const expectedBuiltins = exactBuiltinModules(registration.callableId);
  if (receipt.builtinModules.length !== expectedBuiltins.length ||
    receipt.builtinModules.some((entry, index) => entry !== expectedBuiltins[index])) {
    fail(`${registration.callableId} builtin-module closure differs from exact allowlist`);
  }
  if (receipt.forbiddenPaths.length !== 0) fail(`${registration.callableId} imports the retired C0 executor closure`);
  if (receipt.forbiddenIdentifiers.length !== 0) fail(`${registration.callableId} reaches forbidden test hooks`);
  return receipt;
}

/**
 * Applies the same raw-module/export/import-closure boundary to the two catalogue-owned runtime
 * orchestrators without pretending that either is a claim-graph callable registration.
 */
export function phase10C0VS6AssertRuntimeEntrypointRegistration(
  repositoryRoot: string,
  registration: Phase10C0VS6RuntimeEntrypointRegistration,
): Phase10C0VS6ImportAuditReceipt {
  const policy = EXACT_RUNTIME_ENTRYPOINT_POLICY[registration.role];
  if (registration.modulePath !== policy.modulePath || registration.exportName !== policy.exportName) {
    fail(`${registration.role} module/export differs from exact runtime-entrypoint authority`);
  }
  const receipt = phase10C0VS6ImportClosure(
    repositoryRoot,
    registration.modulePath,
    new Set(policy.externalPackages),
  );
  if (
    receipt.rootModule.path !== registration.identity.path ||
    receipt.rootModule.byteLength !== registration.identity.byteLength ||
    receipt.rootModule.sha256 !== registration.identity.sha256
  ) fail(`${registration.role} module identity differs`);
  const root = safeRoot(repositoryRoot);
  const source = sourceFile(registration.modulePath, readRegular(root, registration.modulePath));
  const hasExport = source.statements.some((statement) =>
    ts.isFunctionDeclaration(statement) &&
    statement.body !== undefined &&
    statement.name?.text === registration.exportName &&
    statement.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword) === true &&
    statement.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.DefaultKeyword) !== true);
  if (!hasExport) fail(`${registration.role} lacks direct named export ${registration.exportName}`);
  if (receipt.externalPackages.length !== policy.externalPackages.length ||
    receipt.externalPackages.some((entry, index) => entry !== policy.externalPackages[index])) {
    fail(`${registration.role} external-package closure differs from exact allowlist`);
  }
  if (receipt.builtinModules.length !== policy.builtinModules.length ||
    receipt.builtinModules.some((entry, index) => entry !== policy.builtinModules[index])) {
    fail(`${registration.role} builtin-module closure differs from exact allowlist`);
  }
  if (receipt.forbiddenPaths.length !== 0) {
    fail(`${registration.role} imports the retired C0 executor closure`);
  }
  if (receipt.forbiddenIdentifiers.length !== 0) {
    fail(`${registration.role} reaches forbidden test hooks`);
  }
  return receipt;
}

export function phase10C0VS6AssertScientificClosureSeparation(
  producer: Phase10C0VS6ImportAuditReceipt,
  evaluator: Phase10C0VS6ImportAuditReceipt,
  allowedSharedPaths: readonly string[],
): readonly string[] {
  const evaluatorPaths = new Set(evaluator.closure.map((identity) => identity.path));
  const shared = producer.closure
    .map((identity) => identity.path)
    .filter((path) => evaluatorPaths.has(path))
    .sort(codePointCompare);
  const allowed = [...allowedSharedPaths].sort(codePointCompare);
  if (shared.length !== allowed.length || shared.some((path, index) => path !== allowed[index])) {
    fail(`producer/evaluator shared closure differs: got [${shared.join(", ")}]`);
  }
  return Object.freeze(shared);
}
