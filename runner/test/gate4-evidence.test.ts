import { createHash } from "node:crypto";
import {
  mkdtempSync,
  mkdirSync,
  existsSync,
  readFileSync,
  rmSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  PHASE4_ARTIFACT_INDEX,
  canonicalJson,
  canonicalJsonBytes,
  parseCanonicalJson,
  publishEvidenceBundle,
  rawTypedArraySha256,
  sha256Bytes,
  strictJsonSnapshot,
  verifyEvidenceBundle,
} from "../src/gate4-evidence.ts";

const tempRoots: string[] = [];

function tempRoot(): string {
  const root = mkdtempSync(join(tmpdir(), "vcc-gate4-evidence-"));
  tempRoots.push(root);
  return root;
}

afterEach(() => {
  while (tempRoots.length > 0) rmSync(tempRoots.pop() as string, { recursive: true, force: true });
});

function publishFixture(root: string, hooks?: Parameters<typeof publishEvidenceBundle>[0]["hooks"]): string {
  const canonicalDirectory = join(root, "pass-a");
  publishEvidenceBundle({
    canonicalDirectory,
    reportPath: "gate4a-report.json",
    protocol: "phase4-pass-a-v1",
    pass: "A",
    operator: "GGThreshold",
    payload: { verdict: { gatePass: true }, runIds: ["run-a", "run-b"] },
    artifacts: [
      { path: "runs/a.csv", kind: "text/csv", bytes: new TextEncoder().encode("cycle\n1\n") },
      { path: "runs/b.ckpt", kind: "gg-checkpoint-v1", bytes: new Uint8Array([1, 2, 3]) },
    ],
    attemptId: "fixture",
    hooks,
  });
  return canonicalDirectory;
}

describe("Phase 4 strict canonical JSON", () => {
  it("sorts recursively and round-trips only its byte-canonical form", () => {
    const value = { z: [3, { b: false, a: "ice" }], a: null };
    const text = canonicalJson(value);
    expect(text).toBe('{"a":null,"z":[3,{"a":"ice","b":false}]}');
    expect(parseCanonicalJson(canonicalJsonBytes(value))).toEqual(JSON.parse(text));
    expect(() => parseCanonicalJson(new TextEncoder().encode(`${text}  \n`))).toThrow(
      /not canonical/,
    );
    expect(() =>
      parseCanonicalJson(new TextEncoder().encode('{"a":1,"a":1}\n')),
    ).toThrow(/not canonical/);
  });

  it.each([
    ["NaN", { value: Number.NaN }],
    ["infinity", { value: Number.POSITIVE_INFINITY }],
    ["negative zero", { value: -0 }],
    ["undefined", { value: undefined }],
    ["function", { value: () => 1 }],
    ["non-plain", new Date(0)],
    ["sparse array", new Array(2)],
  ])("rejects %s without coercion", (_name, value) => {
    expect(() => strictJsonSnapshot(value)).toThrow();
  });

  it("rejects accessors and symbolic/non-enumerable hiding places without invoking them", () => {
    let reads = 0;
    const accessor: Record<string, unknown> = {};
    Object.defineProperty(accessor, "value", {
      enumerable: true,
      get: () => {
        reads++;
        return 1;
      },
    });
    expect(() => strictJsonSnapshot(accessor)).toThrow(/data property/);
    expect(reads).toBe(0);

    const symbol = { value: 1 } as Record<PropertyKey, unknown>;
    symbol[Symbol("hidden")] = 2;
    expect(() => strictJsonSnapshot(symbol)).toThrow(/symbolic/);

    const hidden = { value: 1 };
    Object.defineProperty(hidden, "extra", { value: 2, enumerable: false });
    expect(() => strictJsonSnapshot(hidden)).toThrow(/enumerable/);
  });
});

describe("Phase 4 raw byte hashing", () => {
  it("hashes only the exact typed-array view bytes", () => {
    const buffer = new Uint8Array([99, 1, 2, 3, 88]);
    const view = buffer.subarray(1, 4);
    const independent = createHash("sha256").update(new Uint8Array([1, 2, 3])).digest("hex");
    expect(rawTypedArraySha256(view)).toBe(independent);
    expect(rawTypedArraySha256(view)).toBe(sha256Bytes(view));
    expect(rawTypedArraySha256(buffer)).not.toBe(independent);
  });
});

describe("Phase 4 atomic evidence publication", () => {
  it("publishes an acyclic, complete, reopen-verified bundle", () => {
    const directory = publishFixture(tempRoot());
    const verified = verifyEvidenceBundle(directory);
    expect(verified.report.artifacts.map((item) => item.path)).toEqual([
      "runs/a.csv",
      "runs/b.ckpt",
    ]);
    expect(verified.index.artifacts[0].path).toBe("gate4a-report.json");
    expect(verified.index.artifacts.map((item) => item.path)).not.toContain(
      PHASE4_ARTIFACT_INDEX,
    );
    expect(verified.report.artifacts.map((item) => item.path)).not.toContain(
      "gate4a-report.json",
    );
  });

  it("orders mixed punctuation and case by locale-independent code units", () => {
    const canonicalDirectory = join(tempRoot(), "pass-a");
    publishEvidenceBundle({
      canonicalDirectory,
      reportPath: "gate4a-report.json",
      protocol: "phase4-pass-a-v1",
      pass: "A",
      operator: "GGThreshold",
      payload: { gatePass: true },
      artifacts: ["a-lower", "A-upper", "_underscore", "-dash", "0"].map((name, index) => ({
        path: `runs/${name}.bin`,
        kind: "application/octet-stream",
        bytes: new Uint8Array([index]),
      })),
      attemptId: "lexical-order",
    });
    expect(verifyEvidenceBundle(canonicalDirectory).report.artifacts.map((item) => item.path))
      .toEqual([
        "runs/-dash.bin",
        "runs/0.bin",
        "runs/A-upper.bin",
        "runs/_underscore.bin",
        "runs/a-lower.bin",
      ]);
  });

  it("refuses an existing canonical directory before creating an attempt", () => {
    const root = tempRoot();
    mkdirSync(join(root, "pass-a"));
    expect(() => publishFixture(root)).toThrow(/canonical evidence already exists/);
    expect(existsSync(join(root, "pass-a"))).toBe(true);
    expect(existsSync(join(root, ".pass-a.attempt-fixture"))).toBe(false);
  });

  it("a crash before rename leaves no canonical or staging evidence", () => {
    const root = tempRoot();
    expect(() =>
      publishFixture(root, {
        beforeRename: () => {
          throw new Error("injected publication crash");
        },
      }),
    ).toThrow(/injected publication crash/);
    expect(() => verifyEvidenceBundle(join(root, "pass-a"))).toThrow();
    expect(() => readFileSync(join(root, ".pass-a.attempt-fixture", PHASE4_ARTIFACT_INDEX))).toThrow();
  });

  it.each([
    ["payload", (directory: string) => writeFileSync(join(directory, "runs/a.csv"), "changed\n")],
    ["index", (directory: string) => writeFileSync(join(directory, PHASE4_ARTIFACT_INDEX), "{}\n")],
  ])("reverifies and removes a silently corrupted staging %s before rename", (_name, mutate) => {
    const root = tempRoot();
    expect(() => publishFixture(root, {
      beforeRename: (stagingDirectory) => mutate(stagingDirectory),
    })).toThrow();
    expect(existsSync(join(root, "pass-a"))).toBe(false);
    expect(existsSync(join(root, ".pass-a.attempt-fixture"))).toBe(false);
  });

  it.each([
    ["payload bytes", (directory: string) => writeFileSync(join(directory, "runs/a.csv"), "changed\n")],
    ["missing payload", (directory: string) => unlinkSync(join(directory, "runs/a.csv"))],
    ["extra payload", (directory: string) => writeFileSync(join(directory, "extra.bin"), "x")],
    ["report bytes", (directory: string) => writeFileSync(join(directory, "gate4a-report.json"), "{}\n")],
    ["index bytes", (directory: string) => writeFileSync(join(directory, PHASE4_ARTIFACT_INDEX), "{}\n")],
  ])("detects post-publication mutation: %s", (_name, mutate) => {
    const directory = publishFixture(tempRoot());
    mutate(directory);
    expect(() => verifyEvidenceBundle(directory)).toThrow();
  });
});
