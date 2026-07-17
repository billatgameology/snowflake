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
import { dirname, join } from "node:path";
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
  type EvidenceArtifactIndex,
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

function publishOptions(
  root: string,
  overrides: Partial<Parameters<typeof publishEvidenceBundle>[0]> = {},
): Parameters<typeof publishEvidenceBundle>[0] {
  return {
    canonicalDirectory: join(root, "pass-a"),
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
    ...overrides,
  };
}

function publishFixture(root: string, hooks?: Parameters<typeof publishEvidenceBundle>[0]["hooks"]): string {
  const canonicalDirectory = join(root, "pass-a");
  publishEvidenceBundle(publishOptions(root, { hooks }));
  return canonicalDirectory;
}

interface ForgedFile {
  readonly path: string;
  readonly bytes: Uint8Array;
}

/**
 * A self-consistent alternative bundle graph for the fixture's file set: every internal hash
 * and byte length is correct, so graph verification alone accepts it. Only the publisher's
 * immutable in-memory expected root can tell it apart from the staged truth.
 */
function coherentForgedFiles(): readonly ForgedFile[] {
  const payloads = [
    { path: "runs/a.csv", kind: "text/csv", bytes: new TextEncoder().encode("cycle\n999\n") },
    { path: "runs/b.ckpt", kind: "gg-checkpoint-v1", bytes: new Uint8Array([1, 2, 3]) },
  ];
  const descriptors = payloads.map((item) => ({
    path: item.path,
    kind: item.kind,
    byteLength: item.bytes.byteLength,
    sha256: sha256Bytes(item.bytes),
  }));
  const reportBytes = canonicalJsonBytes({
    version: 1,
    protocol: "phase4-pass-a-v1",
    pass: "A",
    operator: "GGThreshold",
    artifacts: descriptors,
    payload: { verdict: { gatePass: true }, runIds: ["run-a", "run-b"], forged: true },
  });
  const reportDescriptor = {
    path: "gate4a-report.json",
    kind: "phase4-evidence-report+json",
    byteLength: reportBytes.byteLength,
    sha256: sha256Bytes(reportBytes),
  };
  const indexBytes = canonicalJsonBytes({
    version: 1,
    publication: "complete",
    report: reportDescriptor,
    artifacts: [reportDescriptor, ...descriptors],
  });
  return [
    ...payloads.map((item) => ({ path: item.path, bytes: item.bytes })),
    { path: "gate4a-report.json", bytes: reportBytes },
    { path: PHASE4_ARTIFACT_INDEX, bytes: indexBytes },
  ];
}

function writeForgedBundle(directory: string): void {
  for (const file of coherentForgedFiles()) {
    const absolute = join(directory, file.path);
    mkdirSync(dirname(absolute), { recursive: true });
    writeFileSync(absolute, file.bytes);
  }
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

  it("compares the original bytes so a UTF-8 BOM cannot hide behind text decoding", () => {
    const canonical = canonicalJsonBytes({ pass: "A" });
    expect(() => parseCanonicalJson(canonical)).not.toThrow();
    expect(() =>
      parseCanonicalJson(Uint8Array.from([0xef, 0xbb, 0xbf, ...canonical]), "artifact index"),
    ).toThrow(/^artifact index is not canonical JSON$/);
    expect(() =>
      parseCanonicalJson(Uint8Array.from([0xef, 0xbb, 0xbf, ...canonical]), "evidence report"),
    ).toThrow(/^evidence report is not canonical JSON$/);
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

  it("a coherent last-moment rewrite of payload, report, and index cannot publish", () => {
    const root = tempRoot();
    const forgedRoot = join(root, "forged-graph");
    writeForgedBundle(forgedRoot);
    // The forged graph is internally complete: reopen/graph verification alone accepts it.
    expect(() => verifyEvidenceBundle(forgedRoot)).not.toThrow();
    expect(() =>
      publishFixture(root, {
        beforeRename: (stagingDirectory) => writeForgedBundle(stagingDirectory),
      }),
    ).toThrow(/evidence bytes differ from the immutable expected root/);
    expect(existsSync(join(root, "pass-a"))).toBe(false);
    expect(existsSync(join(root, ".pass-a.attempt-fixture"))).toBe(false);
  });

  it("a coherent rewrite during artifact staging cannot publish", () => {
    const root = tempRoot();
    expect(() =>
      publishFixture(root, {
        afterArtifactWrite: (path, stagingDirectory) => {
          if (path === "runs/a.csv") writeForgedBundle(stagingDirectory);
        },
      }),
    ).toThrow(/EEXIST/);
    expect(existsSync(join(root, "pass-a"))).toBe(false);
    expect(existsSync(join(root, ".pass-a.attempt-fixture"))).toBe(false);
  });

  it("rejects a BOM-prefixed artifact index in a completed bundle", () => {
    const directory = publishFixture(tempRoot());
    const indexFile = join(directory, PHASE4_ARTIFACT_INDEX);
    const original = new Uint8Array(readFileSync(indexFile));
    writeFileSync(indexFile, Uint8Array.from([0xef, 0xbb, 0xbf, ...original]));
    expect(() => verifyEvidenceBundle(directory)).toThrow(/^artifact index is not canonical JSON$/);
  });

  it("rejects a BOM-prefixed report even when the index descriptors are rewritten to match", () => {
    const directory = publishFixture(tempRoot());
    const reportFile = join(directory, "gate4a-report.json");
    const bomReport = Uint8Array.from([
      0xef, 0xbb, 0xbf,
      ...new Uint8Array(readFileSync(reportFile)),
    ]);
    writeFileSync(reportFile, bomReport);
    const indexFile = join(directory, PHASE4_ARTIFACT_INDEX);
    const index = parseCanonicalJson(
      new Uint8Array(readFileSync(indexFile)),
    ) as unknown as EvidenceArtifactIndex;
    const reportDescriptor = {
      ...index.report,
      byteLength: bomReport.byteLength,
      sha256: sha256Bytes(bomReport),
    };
    writeFileSync(indexFile, canonicalJsonBytes({
      ...index,
      report: reportDescriptor,
      artifacts: [reportDescriptor, ...index.artifacts.slice(1)],
    }));
    expect(() => verifyEvidenceBundle(directory)).toThrow(/^evidence report is not canonical JSON$/);
  });

  it("rejects an otherwise-valid index whose report descriptor kind shifted", () => {
    const directory = publishFixture(tempRoot());
    const indexFile = join(directory, PHASE4_ARTIFACT_INDEX);
    const index = parseCanonicalJson(
      new Uint8Array(readFileSync(indexFile)),
    ) as unknown as EvidenceArtifactIndex;
    const shifted = { ...index.report, kind: "application/json" };
    writeFileSync(indexFile, canonicalJsonBytes({
      ...index,
      report: shifted,
      artifacts: [shifted, ...index.artifacts.slice(1)],
    }));
    expect(() => verifyEvidenceBundle(directory)).toThrow(/^artifact index report kind is invalid$/);
  });

  it.each([
    ["absolute", "/etc/forged.bin"],
    ["parent traversal", "runs/../forged.bin"],
    ["backslash", "runs\\forged.bin"],
    ["empty segment", "runs//forged.bin"],
    ["trailing slash", "runs/forged.bin/"],
    ["leading dot", ".forged.bin"],
    ["dot segment", "runs/./forged.bin"],
  ])("rejects an unsafe artifact path before staging: %s", (_name, path) => {
    const root = tempRoot();
    expect(() => publishEvidenceBundle(publishOptions(root, {
      artifacts: [{ path, kind: "application/octet-stream", bytes: new Uint8Array([1]) }],
    }))).toThrow(/is not a safe normalized relative path/);
    expect(existsSync(join(root, "pass-a"))).toBe(false);
    expect(existsSync(join(root, ".pass-a.attempt-fixture"))).toBe(false);
  });

  it.each([
    ["report path", "gate4a-report.json"],
    ["artifact index path", PHASE4_ARTIFACT_INDEX],
  ])("rejects an artifact claiming a reserved path: %s", (_name, path) => {
    const root = tempRoot();
    expect(() => publishEvidenceBundle(publishOptions(root, {
      artifacts: [{ path, kind: "text/plain", bytes: new Uint8Array([1]) }],
    }))).toThrow(/reserved artifact path/);
    expect(existsSync(join(root, "pass-a"))).toBe(false);
    expect(existsSync(join(root, ".pass-a.attempt-fixture"))).toBe(false);
  });

  it("rejects a report path that collides with the artifact index", () => {
    const root = tempRoot();
    expect(() => publishEvidenceBundle(publishOptions(root, {
      reportPath: PHASE4_ARTIFACT_INDEX,
    }))).toThrow(/report path must differ from the artifact index/);
    expect(existsSync(join(root, "pass-a"))).toBe(false);
  });

  it("rejects duplicate artifact paths before staging", () => {
    const root = tempRoot();
    expect(() => publishEvidenceBundle(publishOptions(root, {
      artifacts: [
        { path: "runs/a.csv", kind: "text/csv", bytes: new Uint8Array([1]) },
        { path: "runs/a.csv", kind: "text/csv", bytes: new Uint8Array([2]) },
      ],
    }))).toThrow(/duplicate artifact path: runs\/a\.csv/);
    expect(existsSync(join(root, "pass-a"))).toBe(false);
    expect(existsSync(join(root, ".pass-a.attempt-fixture"))).toBe(false);
  });

  it("refuses a colliding staging attempt directory and leaves it intact", () => {
    const root = tempRoot();
    const staging = join(root, ".pass-a.attempt-fixture");
    mkdirSync(staging);
    writeFileSync(join(staging, "foreign.txt"), "foreign\n");
    expect(() => publishFixture(root)).toThrow(/staging evidence already exists/);
    expect(readFileSync(join(staging, "foreign.txt"), "utf8")).toBe("foreign\n");
    expect(existsSync(join(root, "pass-a"))).toBe(false);
  });

  it("a foreign canonical directory appearing before rename fails and is preserved", () => {
    const root = tempRoot();
    const canonical = join(root, "pass-a");
    expect(() =>
      publishFixture(root, {
        beforeRename: () => {
          mkdirSync(canonical);
          writeFileSync(join(canonical, "foreign.txt"), "foreign evidence\n");
        },
      }),
    ).toThrow(/canonical evidence appeared before publication/);
    expect(readFileSync(join(canonical, "foreign.txt"), "utf8")).toBe("foreign evidence\n");
    expect(existsSync(join(root, ".pass-a.attempt-fixture"))).toBe(false);
  });

  it.each([
    ["underscore", "bad_attempt"],
    ["traversal", "../escape"],
    ["empty", ""],
  ])("rejects an invalid attempt id before staging: %s", (_name, attemptId) => {
    const root = tempRoot();
    expect(() => publishEvidenceBundle(publishOptions(root, { attemptId })))
      .toThrow(/attempt id is invalid/);
    expect(existsSync(join(root, "pass-a"))).toBe(false);
  });

  it("rejects a canonical directory named like an attempt directory", () => {
    const root = tempRoot();
    expect(() => publishEvidenceBundle(publishOptions(root, {
      canonicalDirectory: join(root, ".pass-a"),
    }))).toThrow(/canonical evidence directory must not be an attempt directory/);
    expect(existsSync(join(root, ".pass-a"))).toBe(false);
  });
});
