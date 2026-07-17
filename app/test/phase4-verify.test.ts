// Phase 4 harness bundle verification (V4-5 + the plan's visual adversarial bullet):
// artifact metadata / array-length / hash mismatches, operator/field label mismatches, and a
// screenshot manifest missing a required view must ALL fail by name BEFORE capture
// acceptance. Fixture bundles are independently hand-assembled (phase4-fixture.ts) and each
// integrity seam is mutated in isolation; several mutations are COHERENT rewrites (report +
// index + descriptors all updated together), so passing them would mean the verifier trusts
// a self-consistent forgery — exactly the WP2b review exploit this layer must also refuse.

import { mkdtempSync, readFileSync, rmSync, writeFileSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  PASS_A_IDENTITY,
  PASS_B_IDENTITY,
  PASS_B_COUNTERPART_VIEWS,
  PHASE4_INDEX_FILE,
  REQUIRED_PASS_A_VIEWS,
  assertViewManifestComplete,
  canonicalJsonBytesOf,
  parseCanonicalJsonBytes,
  planPassBViews,
  sha256HexNode,
  verifyPhase4Bundle,
  type VerifiedPhase4Bundle,
} from "../scripts/phase4-verify.ts";
import { buildFixturePassA, buildFixturePassB } from "../scripts/phase4-fixture.ts";

let root: string;
let counter = 0;

beforeAll(() => {
  root = mkdtempSync(join(tmpdir(), "wp3-phase4-verify-"));
});

afterAll(() => {
  rmSync(root, { recursive: true, force: true });
});

function freshPassA(): string {
  const dir = join(root, `pass-a-${counter++}`);
  buildFixturePassA(dir);
  return dir;
}

function freshPassB(): string {
  const dir = join(root, `pass-b-${counter++}`);
  buildFixturePassB(dir);
  return dir;
}

/** Coherent report rewrite: report bytes, report descriptor, and index all stay consistent. */
function rewriteReport(
  dir: string,
  reportPath: string,
  mutate: (report: Record<string, unknown>) => void,
): void {
  const report = JSON.parse(readFileSync(join(dir, reportPath), "utf8")) as Record<
    string,
    unknown
  >;
  mutate(report);
  const reportBytes = canonicalJsonBytesOf(report);
  writeFileSync(join(dir, reportPath), reportBytes);
  const index = JSON.parse(readFileSync(join(dir, PHASE4_INDEX_FILE), "utf8")) as {
    report: Record<string, unknown>;
    artifacts: Record<string, unknown>[];
  };
  const descriptor = {
    path: reportPath,
    kind: "phase4-evidence-report+json",
    byteLength: reportBytes.byteLength,
    sha256: sha256HexNode(reportBytes),
  };
  index.report = descriptor;
  index.artifacts[0] = descriptor;
  writeFileSync(join(dir, PHASE4_INDEX_FILE), canonicalJsonBytesOf(index));
}

describe("coherent fixture bundles verify cleanly", () => {
  it("pass-a: 5 runs, identity, run summaries bound to real checkpoints", () => {
    const dir = freshPassA();
    const bundle = verifyPhase4Bundle(dir, PASS_A_IDENTITY);
    expect([...bundle.runs.keys()]).toEqual([
      "A-HABIT-U0",
      "A-HABIT-U1",
      "A-DEPLETION",
      "A-TIMELINE",
      "A-BRANCH-DENDRITE",
    ]);
    expect(bundle.identity.operator).toBe("GGThreshold");
  });

  it("pass-b: 4 runs under the LK identity", () => {
    const dir = freshPassB();
    const bundle = verifyPhase4Bundle(dir, PASS_B_IDENTITY);
    expect([...bundle.runs.keys()]).toEqual([
      "B-HABIT-TM5",
      "B-HABIT-TM15",
      "B-TIMELINE",
      "B-BRANCH",
    ]);
  });
});

describe("canonical JSON (goldens pinned by literal bytes, not by the encoder)", () => {
  it("encodes sorted keys, no whitespace, trailing newline — exact literal", () => {
    const bytes = canonicalJsonBytesOf({ b: 1, a: [1, 2], c: { z: true, y: "s" } });
    expect(new TextDecoder().decode(bytes)).toBe('{"a":[1,2],"b":1,"c":{"y":"s","z":true}}\n');
  });

  it("rejects whitespace, BOM, missing newline, and duplicate keys", () => {
    const canonical = '{"a":1}\n';
    expect(() =>
      parseCanonicalJsonBytes(new TextEncoder().encode('{ "a": 1 }\n'), "x"),
    ).toThrow(/not canonical JSON/);
    expect(() =>
      parseCanonicalJsonBytes(new TextEncoder().encode(`﻿${canonical}`), "x"),
    ).toThrow(/not canonical JSON/);
    expect(() =>
      parseCanonicalJsonBytes(new TextEncoder().encode('{"a":1}'), "x"),
    ).toThrow(/not canonical JSON/);
    expect(() =>
      parseCanonicalJsonBytes(new TextEncoder().encode('{"a":1,"a":2}\n'), "x"),
    ).toThrow(/not canonical JSON/);
    expect(parseCanonicalJsonBytes(new TextEncoder().encode(canonical), "x")).toEqual({ a: 1 });
  });
});

describe("artifact hash / file-set mutations fail by name", () => {
  it("a single flipped payload byte -> V4-BUNDLE-HASH", () => {
    const dir = freshPassA();
    const path = join(dir, "runs/A-HABIT-U0/final.ckpt");
    const bytes = new Uint8Array(readFileSync(path));
    bytes[bytes.length >> 1] ^= 0x01;
    writeFileSync(path, bytes);
    expect(() => verifyPhase4Bundle(dir, PASS_A_IDENTITY)).toThrow(
      /V4-BUNDLE-HASH: artifact hash mismatch: runs\/A-HABIT-U0\/final\.ckpt/,
    );
  });

  it("a deleted indexed file -> V4-BUNDLE-FILESET", () => {
    const dir = freshPassA();
    unlinkSync(join(dir, "runs/A-DEPLETION/final.ckpt"));
    expect(() => verifyPhase4Bundle(dir, PASS_A_IDENTITY)).toThrow(/V4-BUNDLE-FILESET/);
  });

  it("an extra unindexed file -> V4-BUNDLE-FILESET", () => {
    const dir = freshPassA();
    writeFileSync(join(dir, "extra.bin"), new Uint8Array([1, 2, 3]));
    expect(() => verifyPhase4Bundle(dir, PASS_A_IDENTITY)).toThrow(/V4-BUNDLE-FILESET/);
  });

  it("a non-canonical index (added whitespace) -> V4-BUNDLE-CANONICAL", () => {
    const dir = freshPassA();
    const path = join(dir, PHASE4_INDEX_FILE);
    const text = readFileSync(path, "utf8");
    writeFileSync(path, text.replace('"version":1', '"version": 1'));
    expect(() => verifyPhase4Bundle(dir, PASS_A_IDENTITY)).toThrow(/V4-BUNDLE-CANONICAL/);
  });
});

describe("coherent forgeries still fail by name (no self-consistent-graph trust)", () => {
  it("run-summary field-hash rewrite -> V4-CHECKPOINT-METADATA (aSha256)", () => {
    const dir = freshPassA();
    rewriteReport(dir, "gate4a-report.json", (report) => {
      const payload = report.payload as { runs: Array<{ final: Record<string, unknown> }> };
      payload.runs[0].final.aSha256 = "0".repeat(64);
    });
    // The graph is fully self-consistent again; only the decoded checkpoint can expose it.
    expect(() => verifyPhase4Bundle(dir, PASS_A_IDENTITY)).toThrow(
      /V4-CHECKPOINT-METADATA: run A-HABIT-U0 aSha256/,
    );
  });

  it("metadata rewrite (completedCycles) -> V4-CHECKPOINT-METADATA (tick binding)", () => {
    const dir = freshPassA();
    rewriteReport(dir, "gate4a-report.json", (report) => {
      const payload = report.payload as { runs: Array<Record<string, unknown>> };
      payload.runs[0].completedCycles = 12345;
    });
    expect(() => verifyPhase4Bundle(dir, PASS_A_IDENTITY)).toThrow(
      /V4-CHECKPOINT-METADATA: run A-HABIT-U0 tick/,
    );
  });

  it("coherently truncated checkpoint (array-length shift) -> V4-CHECKPOINT-DECODE", () => {
    const dir = freshPassA();
    const runPath = "runs/A-HABIT-U1/final.ckpt";
    const truncated = new Uint8Array(readFileSync(join(dir, runPath))).subarray(0, -8);
    writeFileSync(join(dir, runPath), truncated);
    const truncatedSha = sha256HexNode(truncated);
    // Update EVERY descriptor and the run summary so only strict decode can catch it.
    rewriteReport(dir, "gate4a-report.json", (report) => {
      const artifacts = report.artifacts as Array<Record<string, unknown>>;
      for (const descriptor of artifacts) {
        if (descriptor.path === runPath) {
          descriptor.byteLength = truncated.byteLength;
          descriptor.sha256 = truncatedSha;
        }
      }
      const payload = report.payload as { runs: Array<{ runId: string; final: Record<string, unknown> }> };
      const summary = payload.runs.find((r) => r.runId === "A-HABIT-U1");
      (summary as { final: Record<string, unknown> }).final.checkpointSha256 = truncatedSha;
    });
    const index = JSON.parse(readFileSync(join(dir, PHASE4_INDEX_FILE), "utf8")) as {
      artifacts: Array<Record<string, unknown>>;
    };
    for (const descriptor of index.artifacts) {
      if (descriptor.path === runPath) {
        descriptor.byteLength = truncated.byteLength;
        descriptor.sha256 = truncatedSha;
      }
    }
    writeFileSync(join(dir, PHASE4_INDEX_FILE), canonicalJsonBytesOf(index));
    expect(() => verifyPhase4Bundle(dir, PASS_A_IDENTITY)).toThrow(
      /V4-CHECKPOINT-DECODE: run A-HABIT-U1/,
    );
  });

  it("operator relabeling of the report -> V4-LABEL-MISMATCH", () => {
    const dir = freshPassA();
    rewriteReport(dir, "gate4a-report.json", (report) => {
      report.operator = "LibbrechtKinetics";
    });
    expect(() => verifyPhase4Bundle(dir, PASS_A_IDENTITY)).toThrow(/V4-LABEL-MISMATCH/);
  });

  it("manifest bytes changed without updating manifestSha256 -> V4-BUNDLE-HASH", () => {
    const dir = freshPassB();
    const manifestPath = join(dir, "manifest.json");
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as Record<string, unknown>;
    manifest.surfacePolicy = "legacy-v3";
    const manifestBytes = canonicalJsonBytesOf(manifest);
    writeFileSync(manifestPath, manifestBytes);
    const manifestSha = sha256HexNode(manifestBytes);
    // Keep descriptors coherent but leave payload.manifestSha256 stale.
    rewriteReport(dir, "gate4b-report.json", (report) => {
      const artifacts = report.artifacts as Array<Record<string, unknown>>;
      for (const descriptor of artifacts) {
        if (descriptor.path === "manifest.json") {
          descriptor.byteLength = manifestBytes.byteLength;
          descriptor.sha256 = manifestSha;
        }
      }
    });
    const index = JSON.parse(readFileSync(join(dir, PHASE4_INDEX_FILE), "utf8")) as {
      artifacts: Array<Record<string, unknown>>;
    };
    for (const descriptor of index.artifacts) {
      if (descriptor.path === "manifest.json") {
        descriptor.byteLength = manifestBytes.byteLength;
        descriptor.sha256 = manifestSha;
      }
    }
    writeFileSync(join(dir, PHASE4_INDEX_FILE), canonicalJsonBytesOf(index));
    expect(() => verifyPhase4Bundle(dir, PASS_B_IDENTITY)).toThrow(
      /V4-BUNDLE-HASH: payload\.manifestSha256/,
    );
  });

  it("LK surfacePolicy shift in the manifest config -> V4-CHECKPOINT-METADATA", () => {
    const dir = freshPassB();
    // Coherent rewrite of manifest.json AND payload.manifestSha256: the config now claims
    // legacy-v3 while the checkpoint header still carries the v4 policy.
    const manifestPath = join(dir, "manifest.json");
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as {
      runs: Array<Record<string, unknown>>;
    };
    manifest.runs[0].surfacePolicy = "legacy-v3";
    const manifestBytes = canonicalJsonBytesOf(manifest);
    writeFileSync(manifestPath, manifestBytes);
    const manifestSha = sha256HexNode(manifestBytes);
    rewriteReport(dir, "gate4b-report.json", (report) => {
      const artifacts = report.artifacts as Array<Record<string, unknown>>;
      for (const descriptor of artifacts) {
        if (descriptor.path === "manifest.json") {
          descriptor.byteLength = manifestBytes.byteLength;
          descriptor.sha256 = manifestSha;
        }
      }
      (report.payload as Record<string, unknown>).manifestSha256 = manifestSha;
    });
    const index = JSON.parse(readFileSync(join(dir, PHASE4_INDEX_FILE), "utf8")) as {
      artifacts: Array<Record<string, unknown>>;
    };
    for (const descriptor of index.artifacts) {
      if (descriptor.path === "manifest.json") {
        descriptor.byteLength = manifestBytes.byteLength;
        descriptor.sha256 = manifestSha;
      }
    }
    writeFileSync(join(dir, PHASE4_INDEX_FILE), canonicalJsonBytesOf(index));
    expect(() => verifyPhase4Bundle(dir, PASS_B_IDENTITY)).toThrow(
      /V4-CHECKPOINT-METADATA: run B-HABIT-TM5 surfacePolicy/,
    );
  });

  it("a published pass-a bundle claiming a failed verdict is refused", () => {
    const dir = freshPassA();
    rewriteReport(dir, "gate4a-report.json", (report) => {
      (report.payload as { verdict: Record<string, unknown> }).verdict.gatePass = false;
    });
    expect(() => verifyPhase4Bundle(dir, PASS_A_IDENTITY)).toThrow(/gatePass=true/);
  });
});

describe("pass identity cross-checks", () => {
  it("a pass-b bundle under the pass-a identity fails (report path first)", () => {
    const dir = freshPassB();
    expect(() => verifyPhase4Bundle(dir, PASS_A_IDENTITY)).toThrow(/V4-BUNDLE-CROSSLINK/);
  });
});

describe("required views and manifest completeness (V4-5 self-check)", () => {
  it("registers exactly the five required Pass A views and five B counterparts", () => {
    expect(REQUIRED_PASS_A_VIEWS.map((v) => v.name)).toEqual([
      "pass-a-plate-endpoint",
      "pass-a-column-endpoint",
      "pass-a-hollow-column-slice",
      "pass-a-capped-column-profile",
      "pass-a-dendrite-top",
    ]);
    expect(PASS_B_COUNTERPART_VIEWS.map((v) => v.runId)).toEqual([
      "B-HABIT-TM5",
      "B-HABIT-TM15",
      "B-HABIT-TM15",
      "B-TIMELINE",
      "B-BRANCH",
    ]);
  });

  it("planPassBViews: absent bundle -> every counterpart absent WITH a reason", () => {
    const plan = planPassBViews(null);
    expect(plan.available).toHaveLength(0);
    expect(plan.absent).toHaveLength(PASS_B_COUNTERPART_VIEWS.length);
    for (const absent of plan.absent) {
      expect(absent.reason).toContain("absent");
    }
  });

  it("planPassBViews: a run missing from the report -> that view absent-with-reason", () => {
    const bundle = {
      runs: new Map([["B-HABIT-TM5", {}]]),
    } as unknown as VerifiedPhase4Bundle;
    const plan = planPassBViews(bundle);
    expect(plan.available.map((v) => v.name)).toEqual(["pass-b-plate-endpoint"]);
    const branch = plan.absent.find((v) => v.name === "pass-b-dendrite-top");
    expect(branch?.reason).toContain("B-BRANCH");
  });

  it("a manifest missing one required view fails by name (per backend pass)", () => {
    const backends = ["primary", "forced-webgl2"];
    const complete = backends.flatMap((backendPass) =>
      REQUIRED_PASS_A_VIEWS.map((view) => ({ name: view.name, backendPass })),
    );
    expect(() =>
      assertViewManifestComplete(complete, REQUIRED_PASS_A_VIEWS, backends, [], []),
    ).not.toThrow();
    const missing = complete.filter(
      (entry) =>
        !(entry.name === "pass-a-dendrite-top" && entry.backendPass === "forced-webgl2"),
    );
    expect(() =>
      assertViewManifestComplete(missing, REQUIRED_PASS_A_VIEWS, backends, [], []),
    ).toThrow(/V4-VIEW-MANIFEST: manifest is missing required view pass-a-dendrite-top/);
  });

  it("an unrecorded absent view fails by name", () => {
    const absent = [{ name: "pass-b-dendrite-top", reason: "run B-BRANCH is absent" }];
    expect(() => assertViewManifestComplete([], [], [], [], absent)).toThrow(
      /V4-VIEW-MANIFEST: absent view pass-b-dendrite-top/,
    );
    expect(() => assertViewManifestComplete([], [], [], absent, absent)).not.toThrow();
  });
});
