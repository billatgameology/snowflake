import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { resolve, sep } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { verifyPhase10ApArtifacts } from "../src/phase10-ap-verify.ts";
import { independentlyVerifyPhase10ApArtifacts } from "../src/phase10-ap-independent.ts";
import { writePhase10ExecutionReceipt } from "../src/phase10-execution-receipt.ts";

const SOURCE_ROOT = resolve(import.meta.dirname, "../..");
const CANDIDATE = "out/phase10-obligation-preflight-v1-candidate";
const PUBLICATION = "evidence/phase10-obligation-preflight-v1";
const PRODUCE_ARGS = Object.freeze([
  "runner/src/phase10-ap-publish.ts",
  "produce", "--repository-root", ".", "--out", CANDIDATE,
]);
const VERIFY_ARGS = Object.freeze([
  "runner/src/phase10-ap-independent.ts",
  "verify", "--repository-root", ".", "--bundle", CANDIDATE,
  "--receipt", `${CANDIDATE}/verification.json`,
]);
const PUBLISH_ARGS = Object.freeze([
  "runner/src/phase10-ap-publish.ts",
  "publish", "--repository-root", ".", "--candidate", CANDIDATE,
  "--out", PUBLICATION,
]);
const COMMANDS = Object.freeze([
  "node runner/src/phase10-ap-publish.ts produce --repository-root . --out out/phase10-obligation-preflight-v1-candidate",
  "node runner/src/phase10-ap-independent.ts verify --repository-root . --bundle out/phase10-obligation-preflight-v1-candidate --receipt out/phase10-obligation-preflight-v1-candidate/verification.json",
  "node runner/src/phase10-ap-publish.ts publish --repository-root . --candidate out/phase10-obligation-preflight-v1-candidate --out evidence/phase10-obligation-preflight-v1",
]);
const RESEARCH_FILES = Object.freeze([
  "research/phase10-artifact-schema-registry-v1.json",
  "research/phase10-c0-protocol-v1.json",
  "research/phase10-c0v-foundation-v1.json",
  "research/phase10-execution-v1/README.md",
  "research/phase10-execution-v1/packet-catalogue.json",
  "research/phase10-execution-v1/packets/a-p/protocol.json",
  "research/phase10-execution-v1/packets/a-p/callable-registry.json",
  "research/phase10-foundation-freeze-v1.json",
  "research/phase10-obligation-matrix-v1.json",
]);
const MODULE_FILES = Object.freeze([
  "runner/src/gate4-evidence.ts",
  "runner/src/phase10-ap-independent.ts",
  "runner/src/phase10-ap-negative-controls.ts",
  "runner/src/phase10-ap-publish.ts",
  "runner/src/phase10-ap-verify.ts",
  "runner/src/phase10-contracts.ts",
  "runner/src/phase10-execution-receipt.ts",
  "runner/src/phase10-obligation-preflight.ts",
  "runner/src/phase10-static-packet-receipts.ts",
  "runner/src/phase10-verification-receipt.ts",
  "runner/src/.gitattributes",
]);

const temporaryRoots: string[] = [];

function run(root: string, command: string, args: readonly string[]): string {
  const result = spawnSync(command, args, { cwd: root, encoding: "utf8" });
  if (result.error !== undefined || result.status !== 0) {
    throw new Error(
      `${command} ${args.join(" ")} failed (${String(result.status)}):\n${result.stdout}\n${result.stderr}`,
    );
  }
  return result.stdout.trim();
}

function runRefusal(root: string, command: string, args: readonly string[]): ReturnType<typeof spawnSync> {
  return spawnSync(command, args, { cwd: root, encoding: "utf8" });
}

function copy(root: string, path: string): void {
  const destination = resolve(root, path);
  mkdirSync(resolve(destination, ".."), { recursive: true });
  cpSync(resolve(SOURCE_ROOT, path), destination);
}

function pretty(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function sha256(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

function fixture(): string {
  mkdirSync(resolve(SOURCE_ROOT, "out"), { recursive: true });
  const root = mkdtempSync(resolve(SOURCE_ROOT, "out/phase10-ap-lifecycle-test-"));
  temporaryRoots.push(root);
  for (const path of [...RESEARCH_FILES, ...MODULE_FILES]) copy(root, path);
  writeFileSync(resolve(root, ".gitignore"), "out/\n", "utf8");

  const readmePath = resolve(root, "research/phase10-execution-v1/README.md");
  const readme = readFileSync(readmePath, "utf8").trimEnd();
  writeFileSync(readmePath, `${readme}\n\n### A-P lifecycle\n\n${COMMANDS.join("\n")}\n`, "utf8");

  const registryPath = resolve(root, "research/phase10-execution-v1/packets/a-p/callable-registry.json");
  const registry = JSON.parse(readFileSync(registryPath, "utf8")) as {
    callables: Array<{ modulePath: string; resolution: string; identity: null | { byteLength: number; sha256: string } }>;
  };
  for (const callable of registry.callables) {
    const bytes = new Uint8Array(readFileSync(resolve(root, callable.modulePath)));
    callable.resolution = "resolved";
    callable.identity = { byteLength: bytes.byteLength, sha256: sha256(bytes) };
  }
  writeFileSync(registryPath, pretty(registry), "utf8");

  run(root, "git", ["init", "-b", "phase10/evidence-verification"]);
  run(root, "git", ["config", "user.name", "Phase 10 Test"]);
  run(root, "git", ["config", "user.email", "phase10-test@example.invalid"]);
  run(root, "git", ["add", "-A"]);
  run(root, "git", ["commit", "-m", "fixture"]);
  return root;
}

function produce(root: string): void {
  const stdout = run(root, process.execPath, PRODUCE_ARGS);
  expect(JSON.parse(stdout)).toMatchObject({ state: "candidate-awaiting-independent-verification" });
}

function exactPrettyJson(path: string): unknown {
  const text = readFileSync(path, "utf8");
  expect(text.includes("\r")).toBe(false);
  const parsed = JSON.parse(text) as unknown;
  expect(text).toBe(pretty(parsed));
  return parsed;
}

afterEach(() => {
  while (temporaryRoots.length > 0) {
    const root = temporaryRoots.pop()!;
    expect(resolve(root).startsWith(resolve(SOURCE_ROOT, "out") + sep)).toBe(true);
    rmSync(root, { recursive: true, force: true });
  }
});

describe("Phase 10 A-P retained lifecycle", () => {
  it("runs the exact produce/verify/publish commands and republishes only identical bytes", () => {
    const root = fixture();
    produce(root);

    const called = verifyPhase10ApArtifacts({ repositoryRoot: root, candidateDirectory: CANDIDATE });
    expect(called.executedCheckIds).toHaveLength(11);
    expect(called.checkResults.every((entry) => entry.verdict === "pass")).toBe(true);
    const independent = independentlyVerifyPhase10ApArtifacts({ repositoryRoot: root, candidateDirectory: CANDIDATE });
    expect(independent.verdict).toBe("pass");
    expect(independent.verifiedArtifacts).toHaveLength(12);
    expect(independent.checkResults).toHaveLength(11);
    expect(independent.executedNegativeControlIds).toEqual([
      "nc-ap-missing-producer",
      "nc-ap-uncalled-check",
    ]);
    expect(independent.negativeControlResults).toHaveLength(2);

    const verifyStdout = run(root, process.execPath, VERIFY_ARGS);
    expect(JSON.parse(verifyStdout)).toMatchObject({ state: "verified", verdict: "pass" });
    const verification = exactPrettyJson(resolve(root, CANDIDATE, "verification.json")) as {
      execution: { command: string; processConcurrency: number };
      checkResults: unknown[];
      negativeControlResults: unknown[];
    };
    expect(verification.execution.command).toBe(COMMANDS[1]);
    expect(verification.execution.processConcurrency).toBe(1);
    expect(verification.checkResults).toHaveLength(11);
    expect(verification.negativeControlResults).toHaveLength(2);

    const publishStdout = run(root, process.execPath, PUBLISH_ARGS);
    expect(JSON.parse(publishStdout)).toMatchObject({ state: "published", path: PUBLICATION });
    const first = new Map([
      "artifact-index.json", "missing-producer.json", "uncalled-check.json", "verification.json",
      "packets/a-p/preflight.json", "packets/a-p/terminal-receipt.json",
    ].map((path) => [path, readFileSync(resolve(root, PUBLICATION, path))]));
    const secondStdout = run(root, process.execPath, PUBLISH_ARGS);
    expect(JSON.parse(secondStdout)).toMatchObject({ state: "published", path: PUBLICATION });
    run(root, "git", ["add", PUBLICATION]);
    run(root, "git", ["commit", "-m", "retain A-P evidence"]);
    const historicalStdout = run(root, process.execPath, PUBLISH_ARGS);
    expect(JSON.parse(historicalStdout)).toMatchObject({ state: "published", path: PUBLICATION });
    for (const [path, bytes] of first) {
      expect(readFileSync(resolve(root, PUBLICATION, path))).toEqual(bytes);
      exactPrettyJson(resolve(root, PUBLICATION, path));
    }
  }, 30_000);

  it("refuses CLI omission and a receipt path outside the candidate", () => {
    const noArgs = runRefusal(SOURCE_ROOT, process.execPath, ["runner/src/phase10-ap-publish.ts"]);
    expect(noArgs.status).not.toBe(0);
    expect(noArgs.stderr).toContain("expected produce or publish subcommand");

    const root = fixture();
    produce(root);
    const wrongReceipt = runRefusal(root, process.execPath, [
      "runner/src/phase10-ap-independent.ts", "verify", "--repository-root", ".", "--bundle", CANDIDATE,
      "--receipt", "out/wrong-verification.json",
    ]);
    expect(wrongReceipt.status).not.toBe(0);
    expect(wrongReceipt.stderr).toContain("verify command differs from the frozen command");
  }, 30_000);

  it("rejects verification-path, duplicate-attempt-root, and packet-path catalogue mutations", () => {
    const root = fixture();
    produce(root);
    const path = resolve(root, "research/phase10-execution-v1/packet-catalogue.json");
    const original = readFileSync(path, "utf8");
    const mutate = (action: (catalogue: { packets: Array<Record<string, unknown>> }) => void): void => {
      const catalogue = JSON.parse(original) as { packets: Array<Record<string, unknown>> };
      action(catalogue);
      writeFileSync(path, pretty(catalogue), "utf8");
      const result = verifyPhase10ApArtifacts({ repositoryRoot: root, candidateDirectory: CANDIDATE });
      expect(result.checkResults.find((entry) => entry.checkId === "chk-ap-packet-catalogue")?.verdict).toBe("fail");
      writeFileSync(path, original, "utf8");
    };
    mutate((catalogue) => {
      const paths = catalogue.packets[0]!.verificationPaths as string[];
      paths.push(paths[0]!);
    });
    mutate((catalogue) => {
      catalogue.packets[1]!.attemptRoot = catalogue.packets[0]!.attemptRoot;
    });
    mutate((catalogue) => {
      catalogue.packets[1]!.protocolPath = "research/phase10-execution-v1/packets/a-s/protocol.json";
    });
  }, 30_000);

  it("rejects checkout-unstable callable bytes", () => {
    const root = fixture();
    produce(root);
    const attributes = resolve(root, "runner/src/.gitattributes");
    writeFileSync(attributes, "phase10-* text\n", "utf8");
    const evaluation = independentlyVerifyPhase10ApArtifacts({ repositoryRoot: root, candidateDirectory: CANDIDATE });
    const selfFreeze = evaluation.checkResults.find((entry) => entry.checkId === "chk-ap-self-freeze");
    expect(selfFreeze?.verdict).toBe("fail");
    expect(selfFreeze?.reasons.join("\n")).toContain("checkout-stable");
  }, 30_000);

  it("rejects post-verification control tampering and handcrafted execution provenance", () => {
    const root = fixture();
    produce(root);
    run(root, process.execPath, VERIFY_ARGS);
    const controlPath = resolve(root, CANDIDATE, "missing-producer.json");
    const originalControl = readFileSync(controlPath);
    const control = JSON.parse(originalControl.toString("utf8")) as { error: { message: string } };
    control.error.message = `${control.error.message} tampered`;
    writeFileSync(controlPath, pretty(control), "utf8");
    expect(() => writePhase10ExecutionReceipt({ repositoryRoot: root, candidateDirectory: CANDIDATE }))
      .toThrow(/independent byte re-execution|verification result\/witness sets/u);
    writeFileSync(controlPath, originalControl);

    const verificationPath = resolve(root, CANDIDATE, "verification.json");
    const originalVerification = readFileSync(verificationPath);
    const verification = JSON.parse(originalVerification.toString("utf8")) as {
      execution: { command: string; gitHead: string };
      checkResults: Array<{ witnessOutputIds: string[] }>;
    };
    verification.checkResults[0]!.witnessOutputIds = ["out-ap-foundation-freeze"];
    writeFileSync(verificationPath, pretty(verification), "utf8");
    expect(() => writePhase10ExecutionReceipt({ repositoryRoot: root, candidateDirectory: CANDIDATE }))
      .toThrow(/result\/witness sets/u);
    writeFileSync(verificationPath, originalVerification);

    const preflightPath = resolve(root, CANDIDATE, "preflight.json");
    const originalPreflight = readFileSync(preflightPath);
    const coordinatedVerification = JSON.parse(originalVerification.toString("utf8")) as {
      execution: { gitHead: string };
    };
    const coordinatedPreflight = JSON.parse(originalPreflight.toString("utf8")) as {
      observed: { head: string };
    };
    coordinatedVerification.execution.gitHead = "0".repeat(40);
    coordinatedPreflight.observed.head = "0".repeat(40);
    writeFileSync(verificationPath, pretty(coordinatedVerification), "utf8");
    writeFileSync(preflightPath, pretty(coordinatedPreflight), "utf8");
    expect(() => writePhase10ExecutionReceipt({ repositoryRoot: root, candidateDirectory: CANDIDATE }))
      .toThrow(/preflight provenance/u);
    writeFileSync(verificationPath, originalVerification);
    writeFileSync(preflightPath, originalPreflight);

    const forgedIdentity = JSON.parse(originalVerification.toString("utf8")) as {
      verificationId: string;
      limits: string[];
    };
    forgedIdentity.verificationId = "phase10-a-p-forged-verification-v1";
    writeFileSync(verificationPath, pretty(forgedIdentity), "utf8");
    expect(() => writePhase10ExecutionReceipt({ repositoryRoot: root, candidateDirectory: CANDIDATE }))
      .toThrow(/verificationId/u);
    forgedIdentity.verificationId = "phase10-a-p-verification-v1";
    forgedIdentity.limits = ["forged claim boundary"];
    writeFileSync(verificationPath, pretty(forgedIdentity), "utf8");
    expect(() => writePhase10ExecutionReceipt({ repositoryRoot: root, candidateDirectory: CANDIDATE }))
      .toThrow(/verification limits/u);
    writeFileSync(verificationPath, originalVerification);

    const forgedVerification = JSON.parse(originalVerification.toString("utf8")) as {
      execution: { command: string };
    };
    forgedVerification.execution.command = "node forged-evaluator.ts";
    writeFileSync(verificationPath, pretty(forgedVerification), "utf8");
    expect(() => writePhase10ExecutionReceipt({ repositoryRoot: root, candidateDirectory: CANDIDATE }))
      .toThrow(/execution provenance/u);
    writeFileSync(verificationPath, originalVerification);
  }, 30_000);
});
