import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { dirname, resolve, sep } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { phase10C0VFrozenArtifactIdentity } from "../src/phase10-c0v-reference-publish.ts";

const SOURCE_ROOT = resolve(import.meta.dirname, "../..");
const PROTOCOL = "research/synthetic-c0v-radial-protocol.json";
const ATTEMPT = "synthetic-radial-v1";
const ATTEMPT_ROOT = `out/phase10-c0v-reference-v1/attempts/${ATTEMPT}`;
const CANDIDATE = `${ATTEMPT_ROOT}/reference-candidate.json`;
const CHECK = `${ATTEMPT_ROOT}/targeted-check.json`;
const OUTPUT = "evidence/phase10-numerical-verification-v1/c0v-radial-reference.json";
const STATIC_PROTOCOL = "research/synthetic-c0v-static-protocol.json";
const STATIC_ATTEMPT = "synthetic-static-v1";
const STATIC_ATTEMPT_ROOT = `out/phase10-c0v-reference-v1/attempts/${STATIC_ATTEMPT}`;
const STATIC_CANDIDATE = `${STATIC_ATTEMPT_ROOT}/reference-candidate.json`;
const STATIC_CHECK = `${STATIC_ATTEMPT_ROOT}/targeted-check.json`;
const NEUTRAL_FILES = Object.freeze([
  "runner/src/phase10-c0v-reference-derive.ts",
  "runner/src/phase10-c0v-reference-check.ts",
  "runner/src/phase10-c0v-reference-publish.ts",
]);
const temporaryRoots: string[] = [];

function pretty(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function sha256(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

function write(root: string, path: string, contents: string): void {
  const target = resolve(root, path);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, contents, "utf8");
}

function copy(root: string, path: string): void {
  const target = resolve(root, path);
  mkdirSync(dirname(target), { recursive: true });
  cpSync(resolve(SOURCE_ROOT, path), target);
}

function run(root: string, command: string, args: readonly string[]): string {
  const result = spawnSync(command, args, { cwd: root, encoding: "utf8" });
  if (result.error !== undefined || result.status !== 0) {
    throw new Error(
      `${command} ${args.join(" ")} failed (${String(result.status)}):\n${result.stdout}\n${result.stderr}`,
    );
  }
  return result.stdout.trim();
}

function refuse(root: string, command: string, args: readonly string[]) {
  return spawnSync(command, args, { cwd: root, encoding: "utf8" });
}

function identity(root: string, path: string): {
  readonly path: string;
  readonly byteLength: number;
  readonly sha256: string;
} {
  const bytes = new Uint8Array(readFileSync(resolve(root, path)));
  return Object.freeze({ path, byteLength: bytes.byteLength, sha256: sha256(bytes) });
}

function codeIdentity(
  root: string,
  role: "generator" | "independent-checker" | "shared-parser",
  modulePath: string,
  exportName: string,
) {
  const bytes = new Uint8Array(readFileSync(resolve(root, modulePath)));
  return Object.freeze({
    role,
    modulePath,
    exportName,
    byteLength: bytes.byteLength,
    sha256: sha256(bytes),
  });
}

const GATE_STUB = `import { createHash } from "node:crypto";
export type StrictJson = null | boolean | number | string | readonly StrictJson[] | { readonly [key: string]: StrictJson };
export function strictJsonSnapshot(value: unknown): StrictJson { return JSON.parse(JSON.stringify(value)) as StrictJson; }
export function sha256Bytes(bytes: Uint8Array): string { return createHash("sha256").update(bytes).digest("hex"); }
`;

const CONTRACT_STUB = `import { strictJsonSnapshot, type StrictJson } from "./gate4-evidence.ts";
export type Phase10C0VArtifactIdentity = { readonly path: string; readonly byteLength: number; readonly sha256: string };
export type Phase10C0VCodeIdentity = { readonly role: "generator"|"independent-checker"|"shared-parser"|"neutral-derive"|"neutral-check"|"neutral-publish"; readonly modulePath: string; readonly exportName: string; readonly byteLength: number; readonly sha256: string };
export type Phase10C0VRadialProtocol = any; export type Phase10C0VMovingProtocol = any; export type Phase10C0VStaticProtocol = any;
export type Phase10C0VMovingReferenceCandidate = any; export type Phase10C0VStaticRefusalCandidate = any;
export function parseSyntheticPhase10C0VProtocol(value: unknown): any { return strictJsonSnapshot(value); }
export function parsePhase10C0VRadialProtocol(value: unknown): any { return parseSyntheticPhase10C0VProtocol(value); }
export function parsePhase10C0VMovingProtocol(value: unknown): any { return parseSyntheticPhase10C0VProtocol(value); }
export function parsePhase10C0VStaticProtocol(value: unknown): any { return parseSyntheticPhase10C0VProtocol(value); }
export function phase10C0VRadialReferenceInput(protocol: any): any { return protocol.syntheticInput; }
export function parsePhase10C0VReferenceEnvelope(value: unknown): any { return strictJsonSnapshot(value); }
export function parsePhase10C0VReferenceRefusal(value: unknown): any { return strictJsonSnapshot(value); }
export function parsePhase10C0VFinalCodeAndImportReceipt(value: unknown): any { return strictJsonSnapshot(value); }
function exact(value: any, fields: readonly string[], label: string): any {
  const actual = Object.keys(value).sort(); const expected = [...fields].sort();
  if (actual.length !== expected.length || actual.some((entry, index) => entry !== expected[index])) throw new Error(label + " keys differ");
  return strictJsonSnapshot(value);
}
export function parsePhase10C0VRadialReferenceCandidate(value: any): any { return exact(value, ["schema", "protocolId", "forceFail", "value"], "synthetic radial candidate"); }
export function parsePhase10C0VRadialReferenceCheck(value: any): any { return exact(value, ["schema", "protocolId", "value", "errors", "pass"], "synthetic radial check"); }
export function parsePhase10C0VMovingReferenceCandidate(value: any): any { return strictJsonSnapshot(value); }
export function parsePhase10C0VMovingReferenceCheck(value: any): any { return strictJsonSnapshot(value); }
export function parsePhase10C0VStaticRefusalCandidate(value: any): any { return strictJsonSnapshot(value); }
export function parsePhase10C0VStaticRefusalCheck(value: any): any { return strictJsonSnapshot(value); }
`;

const RADIAL_DERIVE_STUB = `import type { Phase10C0VRadialProtocol } from "./phase10-c0v-contracts.ts";
export function derivePhase10C0VRadialReference(input: Phase10C0VRadialProtocol): unknown {
  return { schema: "synthetic-radial-candidate-v1", protocolId: input.protocolId, forceFail: input.forceFail, value: 7 };
}
`;

const RADIAL_CHECK_STUB = `import type { Phase10C0VRadialProtocol } from "./phase10-c0v-contracts.ts";
export type Phase10C0VRadialCheckCandidate = any;
export function independentlyCheckPhase10C0VRadialReference(input: Phase10C0VRadialProtocol, candidate: any): any {
  const pass = candidate.protocolId === input.protocolId && candidate.value === 7 && input.forceFail !== true;
  return { schema: "synthetic-radial-check-v1", protocolId: input.protocolId, value: candidate.value, errors: pass ? [] : ["synthetic discrepancy"], pass };
}
`;

const MOVING_DERIVE_STUB = `export function derivePhase10C0VMovingReference(protocol: any): any { return { protocolId: protocol.protocolId }; }
`;
const MOVING_CHECK_STUB = `export function independentlyCheckPhase10C0VMovingReference(protocol: any, candidate: any): any { return { protocolId: protocol.protocolId, candidate, verdict: "pass", errors: [] }; }
`;
const STATIC_DERIVE_STUB = `export function phase10C0VStaticSourceAuditRequirements(): any { return { inspectedPaths: ["research/synthetic-static-source.ts"], findings: [] }; }
export function constructPhase10C0VStaticSourceAudit(_protocol: any, inspectedArtifacts: any[]): any { return { auditId: "synthetic", currentContractOnly: true, inspectedArtifacts, publicApiFindings: [], executionRecord: { solverInvocations: 0, referenceInvocations: 0, productionInvocations: 0, witnessesProduced: 0, numericalEvaluations: 0, scientificProcessHours: 0 } }; }
export function derivePhase10C0VStaticRefusal(protocol: any, audit: any): any { return { schema: "synthetic-static-refusal", protocolId: protocol.protocolId, contractEvidence: audit }; }
`;
const STATIC_CHECK_STUB = `export type Phase10C0VStaticSourceArtifactInput = { readonly identity: any; readonly bytes: Uint8Array };
export function independentlyCheckPhase10C0VStaticRefusal(protocol: any, candidate: any, audit: any, sourceArtifacts: Phase10C0VStaticSourceArtifactInput[]): any {
  const first = sourceArtifacts[0];
  const pass = sourceArtifacts.length === 1 && first !== undefined && audit.inspectedArtifacts.length === 1 && first.identity.sha256 === audit.inspectedArtifacts[0].sha256 && new TextDecoder().decode(first.bytes).includes("syntheticStaticSourceMarker");
  return { protocolId: protocol.protocolId, candidate, verdict: pass ? "pass" : "fail", errors: pass ? [] : ["static source bytes were not independently supplied"] };
}
`;

function fixture(forceFail = false, forbiddenDynamicImport = false): string {
  mkdirSync(resolve(SOURCE_ROOT, "out"), { recursive: true });
  const root = mkdtempSync(resolve(SOURCE_ROOT, "out/phase10-c0v-lifecycle-test-"));
  temporaryRoots.push(root);
  for (const path of NEUTRAL_FILES) copy(root, path);
  write(root, "runner/src/gate4-evidence.ts", GATE_STUB);
  write(root, "runner/src/phase10-c0v-contracts.ts", CONTRACT_STUB);
  write(
    root,
    "runner/src/phase10-c0v-radial-reference-derive.ts",
    forbiddenDynamicImport
      ? `${RADIAL_DERIVE_STUB}\nexport async function syntheticHiddenLoad(): Promise<unknown> { return import("./phase10-executor.ts"); }\n`
      : RADIAL_DERIVE_STUB,
  );
  write(root, "runner/src/phase10-c0v-radial-reference-check.ts", RADIAL_CHECK_STUB);
  write(root, "runner/src/phase10-c0v-moving-reference-derive.ts", MOVING_DERIVE_STUB);
  write(root, "runner/src/phase10-c0v-moving-reference-check.ts", MOVING_CHECK_STUB);
  write(root, "runner/src/phase10-c0v-static-refusal.ts", STATIC_DERIVE_STUB);
  write(root, "runner/src/phase10-c0v-static-refusal-check.ts", STATIC_CHECK_STUB);
  write(root, "research/synthetic-static-source.ts", "export const syntheticStaticSourceMarker = true;\n");
  if (forbiddenDynamicImport) {
    write(root, "runner/src/phase10-executor.ts", "export const forbiddenProductionModule = true;\n");
  }
  write(root, ".gitignore", "out/\n");
  write(root, ".gitattributes", "research/synthetic-c0v-*.json -text\nrunner/src/phase10-* -text\n");
  write(root, "package.json", pretty({ name: "synthetic-c0v-fixture", private: true }));
  write(root, "package-lock.json", pretty({
    name: "synthetic-c0v-fixture",
    lockfileVersion: 3,
    packages: {
      "": { name: "synthetic-c0v-fixture" },
      "node_modules/typescript": { version: "5.9.3" },
    },
  }));
  for (const [path, value] of [
    ["research/foundation.json", { schema: "synthetic-foundation" }],
    ["research/matrix.json", { schema: "synthetic-matrix" }],
    ["research/schema-registry.json", { schema: "synthetic-registry" }],
    ["research/schema-contracts.json", { schema: "synthetic-contracts" }],
  ] as const) write(root, path, pretty(value));
  const protocol = {
    schema: "synthetic-radial-protocol-v1",
    protocolId: "synthetic-c0v-radial-protocol-v1",
    layerId: "C0V-RADIAL",
    branch: "independent-reference",
    bindings: {
      foundation: identity(root, "research/foundation.json"),
      obligationMatrix: identity(root, "research/matrix.json"),
      schemaRegistry: identity(root, "research/schema-registry.json"),
      schemaContracts: identity(root, "research/schema-contracts.json"),
    },
    artifactPaths: {
      protocol: PROTOCOL,
      reference: OUTPUT,
      referenceRefusal: "evidence/phase10-numerical-verification-v1/c0v-radial-refusal.json",
      witness: "evidence/phase10-numerical-verification-v1/c0v-radial-witness.bin",
      evaluation: "evidence/phase10-numerical-verification-v1/c0v-radial-evaluation.json",
      result: "evidence/phase10-numerical-verification-v1/c0v-radial-result.json",
      attemptLedger: "evidence/phase10-numerical-verification-v1/c0v-radial-attempts.jsonl",
    },
    referenceOnlyCode: [
      codeIdentity(root, "generator", "runner/src/phase10-c0v-radial-reference-derive.ts", "derivePhase10C0VRadialReference"),
      codeIdentity(root, "independent-checker", "runner/src/phase10-c0v-radial-reference-check.ts", "independentlyCheckPhase10C0VRadialReference"),
      codeIdentity(root, "shared-parser", "runner/src/phase10-c0v-contracts.ts", "parseSyntheticPhase10C0VProtocol"),
    ],
    independence: {
      sharedImportAllowlist: [
        "runner/src/gate4-evidence.ts",
        "runner/src/phase10-c0v-contracts.ts",
      ],
      forbiddenImports: [
        "core/**",
        "runner/src/phase10-execution-preflight.ts",
        "runner/src/phase10-executor-worker.ts",
        "runner/src/phase10-executor.ts",
        "solver-cpu/**",
        "solver-gpu/**",
      ],
    },
    claimBoundary: { allowed: ["synthetic plumbing"], forbidden: ["scientific claim"] },
    syntheticInput: { protocolId: "synthetic-c0v-radial-protocol-v1", forceFail },
  };
  write(root, PROTOCOL, pretty(protocol));
  write(root, STATIC_PROTOCOL, pretty({
    ...protocol,
    schema: "synthetic-static-protocol-v1",
    protocolId: "synthetic-c0v-static-protocol-v1",
    layerId: "C0V-STATIC",
    branch: "reference-refusal",
    artifactPaths: {
      ...protocol.artifactPaths,
      protocol: STATIC_PROTOCOL,
      reference: "evidence/phase10-numerical-verification-v1/c0v-static-reference.json",
      referenceRefusal: "evidence/phase10-numerical-verification-v1/c0v-static-reference-refusal.json",
      witness: "evidence/phase10-numerical-verification-v1/c0v-static-witness.bin",
      evaluation: "evidence/phase10-numerical-verification-v1/c0v-static-evaluation.json",
      result: "evidence/phase10-numerical-verification-v1/c0v-static-result.json",
      attemptLedger: "evidence/phase10-numerical-verification-v1/c0v-static-attempts.jsonl",
    },
    referenceOnlyCode: [
      codeIdentity(root, "generator", "runner/src/phase10-c0v-static-refusal.ts", "derivePhase10C0VStaticRefusal"),
      codeIdentity(root, "independent-checker", "runner/src/phase10-c0v-static-refusal-check.ts", "independentlyCheckPhase10C0VStaticRefusal"),
      codeIdentity(root, "shared-parser", "runner/src/phase10-c0v-contracts.ts", "parseSyntheticPhase10C0VProtocol"),
    ],
    independence: {
      ...protocol.independence,
      sharedImportAllowlist: [],
    },
    syntheticInput: undefined,
  }));
  run(root, "git", ["init", "-b", "phase10/evidence-verification"]);
  run(root, "git", ["config", "core.autocrlf", "true"]);
  run(root, "git", ["config", "user.name", "Phase 10 C0V Test"]);
  run(root, "git", ["config", "user.email", "phase10-c0v-test@example.invalid"]);
  run(root, "git", ["add", "-A"]);
  run(root, "git", ["commit", "-m", "synthetic reference freeze"]);
  return root;
}

const DERIVE_ARGS = Object.freeze([
  "runner/src/phase10-c0v-reference-derive.ts",
  "derive", "--repository-root", ".", "--layer", "radial", "--protocol", PROTOCOL,
  "--attempt", ATTEMPT, "--out", ATTEMPT_ROOT,
]);
const CHECK_ARGS = Object.freeze([
  "runner/src/phase10-c0v-reference-check.ts",
  "verify", "--repository-root", ".", "--layer", "radial", "--protocol", PROTOCOL,
  "--candidate", CANDIDATE, "--receipt", CHECK,
]);
const PUBLISH_ARGS = Object.freeze([
  "runner/src/phase10-c0v-reference-publish.ts",
  "publish", "--repository-root", ".", "--layer", "radial", "--protocol", PROTOCOL,
  "--candidate", CANDIDATE, "--check", CHECK, "--out", OUTPUT,
]);
const STATIC_DERIVE_ARGS = Object.freeze([
  "runner/src/phase10-c0v-reference-derive.ts",
  "derive", "--repository-root", ".", "--layer", "static", "--protocol", STATIC_PROTOCOL,
  "--attempt", STATIC_ATTEMPT, "--out", STATIC_ATTEMPT_ROOT,
]);
const STATIC_CHECK_ARGS = Object.freeze([
  "runner/src/phase10-c0v-reference-check.ts",
  "verify", "--repository-root", ".", "--layer", "static", "--protocol", STATIC_PROTOCOL,
  "--candidate", STATIC_CANDIDATE, "--receipt", STATIC_CHECK,
]);

function deriveCheck(root: string): void {
  expect(JSON.parse(run(root, process.execPath, DERIVE_ARGS))).toMatchObject({ status: "derived" });
  expect(JSON.parse(run(root, process.execPath, CHECK_ARGS))).toMatchObject({ status: "checked" });
}

afterEach(() => {
  while (temporaryRoots.length > 0) {
    const root = temporaryRoots.pop()!;
    expect(resolve(root).startsWith(resolve(SOURCE_ROOT, "out") + sep)).toBe(true);
    rmSync(root, { recursive: true, force: true });
  }
});

describe("Phase 10 C0V neutral S5 reference lifecycle", () => {
  it("supplies frozen static source bytes to the independent refusal checker", () => {
    const root = fixture();
    expect(JSON.parse(run(root, process.execPath, STATIC_DERIVE_ARGS))).toMatchObject({ status: "derived" });
    expect(JSON.parse(run(root, process.execPath, STATIC_CHECK_ARGS))).toMatchObject({ status: "checked" });
    const receipt = JSON.parse(readFileSync(resolve(root, STATIC_CHECK), "utf8"));
    expect(receipt.verdict).toBe("refusal");
    expect(receipt.independentOutput.verdict).toBe("pass");
    expect(receipt.independentOutput.errors).toEqual([]);
  });

  it("derives, independently checks, publishes, and retries exact synthetic bytes", () => {
    const root = fixture();
    deriveCheck(root);
    expect(JSON.parse(run(root, process.execPath, PUBLISH_ARGS))).toMatchObject({ status: "published", path: OUTPUT });
    const firstCandidate = readFileSync(resolve(root, CANDIDATE));
    const firstCheck = readFileSync(resolve(root, CHECK));
    const firstOutput = readFileSync(resolve(root, OUTPUT));
    deriveCheck(root);
    run(root, process.execPath, PUBLISH_ARGS);
    expect(readFileSync(resolve(root, CANDIDATE))).toEqual(firstCandidate);
    expect(readFileSync(resolve(root, CHECK))).toEqual(firstCheck);
    expect(readFileSync(resolve(root, OUTPUT))).toEqual(firstOutput);
    const published = JSON.parse(firstOutput.toString("utf8")) as {
      disposition: string;
      codeAndImportReceipt: {
        pass: boolean;
        codeIdentities: Record<string, { byteLength: number; sha256: string }>;
        timestamps: Record<string, string>;
      };
    };
    expect(published.disposition).toBe("reference-frozen");
    expect(published.codeAndImportReceipt.pass).toBe(true);
    expect(Object.keys(published.codeAndImportReceipt.codeIdentities)).toHaveLength(6);
    expect(Date.parse(published.codeAndImportReceipt.timestamps.publishCompletedAt)).toBeGreaterThanOrEqual(
      Date.parse(published.codeAndImportReceipt.timestamps.checkCompletedAt),
    );
  }, 30_000);

  it("publishes a registered discrepancy refusal instead of silently dropping the artifact", () => {
    const root = fixture(true);
    deriveCheck(root);
    run(root, process.execPath, PUBLISH_ARGS);
    const published = JSON.parse(readFileSync(resolve(root, OUTPUT), "utf8")) as {
      disposition: string;
      comparison: { observedOutcome: string; errors: string[] };
    };
    expect(published.disposition).toBe("reference-discrepancy-refusal");
    expect(published.comparison.observedOutcome).toBe("fail");
    expect(published.comparison.errors).toEqual(["synthetic discrepancy"]);
  }, 30_000);

  it("reexecutes the independent check and rejects a post-check receipt mutation", () => {
    const root = fixture();
    deriveCheck(root);
    const check = JSON.parse(readFileSync(resolve(root, CHECK), "utf8")) as { comparison: { method: string } };
    check.comparison.method = "forged-self-attestation";
    write(root, CHECK, pretty(check));
    const result = refuse(root, process.execPath, PUBLISH_ARGS);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("independent targeted check re-execution failed");
  }, 30_000);

  it("rejects an unknown field in a scientific candidate before independent checking", () => {
    const root = fixture();
    run(root, process.execPath, DERIVE_ARGS);
    const candidate = JSON.parse(readFileSync(resolve(root, CANDIDATE), "utf8")) as {
      generatorOutput: Record<string, unknown>;
    };
    candidate.generatorOutput.unregistered = true;
    write(root, CANDIDATE, pretty(candidate));
    const result = refuse(root, process.execPath, CHECK_ARGS);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("synthetic radial candidate keys differ");
  }, 30_000);

  it("rejects tracked code drift and untracked static source locators", () => {
    const root = fixture();
    write(root, "runner/src/phase10-c0v-radial-reference-derive.ts", `${RADIAL_DERIVE_STUB}\n// drift\n`);
    const drift = refuse(root, process.execPath, DERIVE_ARGS);
    expect(drift.status).not.toBe(0);
    expect(drift.stderr).toContain("tracked worktree and index must be clean");
    run(root, "git", ["restore", "runner/src/phase10-c0v-radial-reference-derive.ts"]);
    write(root, "research/untracked-static-source.ts", "export const publicAggregate = 1;\n");
    const head = run(root, "git", ["rev-parse", "HEAD"]);
    expect(() => phase10C0VFrozenArtifactIdentity(root, head, "research/untracked-static-source.ts"))
      .toThrow(/freeze commit does not contain/u);
  }, 30_000);

  it("accepts Git-equivalent CRLF only for package metadata and keeps protocol bytes exact", () => {
    const root = fixture();
    for (const path of ["package.json", "package-lock.json"]) {
      rmSync(resolve(root, path));
    }
    run(root, "git", ["checkout-index", "--force", "--", "package.json", "package-lock.json"]);
    for (const path of ["package.json", "package-lock.json"]) {
      const current = readFileSync(resolve(root, path));
      const committed = spawnSync("git", ["show", `HEAD:${path}`], { cwd: root, encoding: null });
      expect(committed.status).toBe(0);
      expect(current).not.toEqual(committed.stdout);
      expect(current.toString("utf8")).toContain("\r\n");
      expect(run(root, "git", ["hash-object", `--path=${path}`, path]))
        .toBe(run(root, "git", ["rev-parse", `HEAD:${path}`]));
    }
    // checkout-index does not refresh its synthetic stat cache on every Git build; hide only that
    // already-proved filter-equivalent pair so the production tracked-clean precondition is held.
    run(root, "git", ["update-index", "--assume-unchanged", "package.json", "package-lock.json"]);
    expect(run(root, "git", ["status", "--porcelain"])).toBe("");
    expect(JSON.parse(run(root, process.execPath, DERIVE_ARGS))).toMatchObject({ status: "derived" });

    const packageText = readFileSync(resolve(root, "package.json"), "utf8");
    writeFileSync(
      resolve(root, "package.json"),
      packageText.replace("synthetic-c0v-fixture", "tampered-c0v-fixture"),
      "utf8",
    );
    run(root, "git", ["update-index", "--assume-unchanged", "package.json"]);
    const packageResult = refuse(root, process.execPath, DERIVE_ARGS);
    expect(packageResult.status).not.toBe(0);
    expect(packageResult.stderr).toContain("package.json differs from freeze commit");

    const protocolRoot = fixture();
    const protocolLf = readFileSync(resolve(protocolRoot, PROTOCOL), "utf8");
    writeFileSync(resolve(protocolRoot, PROTOCOL), protocolLf.replace(/\n/gu, "\r\n"), "utf8");
    run(protocolRoot, "git", ["update-index", "--assume-unchanged", PROTOCOL]);
    expect(run(protocolRoot, "git", ["status", "--porcelain"])).toBe("");
    const protocolResult = refuse(protocolRoot, process.execPath, DERIVE_ARGS);
    expect(protocolResult.status).not.toBe(0);
    expect(protocolResult.stderr).toContain("layer protocol must use exact two-space JSON plus one LF");
  }, 30_000);

  it("recursively detects a forbidden dynamic local import", () => {
    const root = fixture(false, true);
    const result = refuse(root, process.execPath, DERIVE_ARGS);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("reference closure contains forbidden production imports");
    expect(result.stderr).toContain("runner/src/phase10-executor.ts");
  }, 30_000);

  it("rejects an aliased staging parent before writing an attempt", () => {
    const root = fixture();
    const aliasTarget = resolve(root, "alias-target");
    mkdirSync(aliasTarget);
    mkdirSync(resolve(root, "out"), { recursive: true });
    symlinkSync(aliasTarget, resolve(root, "out/phase10-c0v-reference-v1"), "junction");
    const result = refuse(root, process.execPath, DERIVE_ARGS);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("publication parent chain contains an alias");
    expect(readFileSync(resolve(root, "runner/src/phase10-c0v-reference-derive.ts")).byteLength).toBeGreaterThan(0);
  }, 30_000);

  it("rejects a retained publication timestamp that predates its independent check", () => {
    const root = fixture();
    deriveCheck(root);
    write(root, OUTPUT, pretty({
      schema: "synthetic-reference-v1",
      createdAt: "2000-01-01T00:00:00.000Z",
    }));
    const result = refuse(root, process.execPath, PUBLISH_ARGS);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("publication timestamp precedes targeted-check completion");
  }, 30_000);

  it("rejects future timestamps at the derive and check command boundaries", () => {
    const deriveRoot = fixture();
    run(deriveRoot, process.execPath, DERIVE_ARGS);
    const candidate = JSON.parse(readFileSync(resolve(deriveRoot, CANDIDATE), "utf8")) as {
      startedAt: string;
      completedAt: string;
    };
    candidate.startedAt = "2999-01-01T00:00:00.000Z";
    candidate.completedAt = "2999-01-01T00:00:01.000Z";
    write(deriveRoot, CANDIDATE, pretty(candidate));
    const deriveResult = refuse(deriveRoot, process.execPath, DERIVE_ARGS);
    expect(deriveResult.status).not.toBe(0);
    expect(deriveResult.stderr).toContain("startedAt must not be in the future");

    const checkRoot = fixture();
    deriveCheck(checkRoot);
    const check = JSON.parse(readFileSync(resolve(checkRoot, CHECK), "utf8")) as { completedAt: string };
    check.completedAt = "2999-01-01T00:00:00.000Z";
    write(checkRoot, CHECK, pretty(check));
    const checkResult = refuse(checkRoot, process.execPath, CHECK_ARGS);
    expect(checkResult.status).not.toBe(0);
    expect(checkResult.stderr).toContain("completedAt must not be in the future");
  }, 30_000);
});
