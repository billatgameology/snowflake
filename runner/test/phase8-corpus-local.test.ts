import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { canonicalJsonBytes, sha256Bytes } from "../src/gate4-evidence.ts";
import {
  PHASE8B_LOCAL_ARTIFACT_NAMES,
  derivePhase8bLocalBundle,
  parsePhase8bCacheManifest,
  phase8bReadZipInventory,
  readPhase8bLocalBundleDirectory,
  verifyPhase8bLocalBundleArtifacts,
  writePhase8bLocalBundleDirectory,
  type Phase8bLocalBundle,
  type Phase8bLocalCounts,
  type Phase8bLocalSnapshot,
} from "../src/phase8-corpus-local.ts";

const encoder = new TextEncoder();
const tempRoots: string[] = [];

afterEach(() => {
  while (tempRoots.length > 0) rmSync(tempRoots.pop() as string, { recursive: true, force: true });
});

function bytes(text: string): Uint8Array {
  return encoder.encode(text);
}

function crc32(value: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of value) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ ((crc & 1) === 1 ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

interface ZipEntry {
  readonly name: string;
  readonly value?: Uint8Array;
  readonly flags?: number;
  readonly versionMadeBy?: number;
  readonly externalAttributes?: number;
  readonly declaredCrc?: number;
  readonly localCrc?: number;
}

function storedZip(entries: readonly ZipEntry[]): Uint8Array {
  const localParts: Buffer[] = [];
  const centralParts: Buffer[] = [];
  let localOffset = 0;
  for (const entry of entries) {
    const name = Buffer.from(entry.name, "utf8");
    const value = Buffer.from(entry.value ?? new Uint8Array());
    const flags = entry.flags ?? 0x0800;
    const actualCrc = crc32(value);
    const declaredCrc = entry.declaredCrc ?? actualCrc;
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(flags, 6);
    local.writeUInt16LE(0, 8);
    local.writeUInt32LE(entry.localCrc ?? declaredCrc, 14);
    local.writeUInt32LE(value.length, 18);
    local.writeUInt32LE(value.length, 22);
    local.writeUInt16LE(name.length, 26);
    local.writeUInt16LE(0, 28);
    localParts.push(local, name, value);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(entry.versionMadeBy ?? ((3 << 8) | 20), 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(flags, 8);
    central.writeUInt16LE(0, 10);
    central.writeUInt32LE(declaredCrc, 16);
    central.writeUInt32LE(value.length, 20);
    central.writeUInt32LE(value.length, 24);
    central.writeUInt16LE(name.length, 28);
    central.writeUInt16LE(0, 30);
    central.writeUInt16LE(0, 32);
    central.writeUInt16LE(0, 34);
    central.writeUInt16LE(0, 36);
    central.writeUInt32LE(entry.externalAttributes ?? (entry.name.endsWith("/") ? 0x41ed0000 : 0x81a40000), 38);
    central.writeUInt32LE(localOffset, 42);
    centralParts.push(central, name);
    localOffset += local.length + name.length + value.length;
  }
  const localBytes = Buffer.concat(localParts);
  const centralBytes = Buffer.concat(centralParts);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(entries.length, 8);
  eocd.writeUInt16LE(entries.length, 10);
  eocd.writeUInt32LE(centralBytes.length, 12);
  eocd.writeUInt32LE(localBytes.length, 16);
  return new Uint8Array(Buffer.concat([localBytes, centralBytes, eocd]));
}

interface CacheFile {
  readonly recordType: "file";
  readonly path: string;
  readonly bytes: number;
  readonly sha256: string;
  readonly storageClass: string;
  readonly collection: string;
}

function cacheFile(path: string, value: Uint8Array, storageClass: string, collection: string): CacheFile {
  return { recordType: "file", path, bytes: value.length, sha256: sha256Bytes(value), storageClass, collection };
}

function cacheManifest(
  files: readonly CacheFile[],
  headerOverrides: Readonly<Record<string, unknown>> = {},
): Uint8Array {
  const volatileBytes = 6;
  const ordinaryFileBytes = files.reduce((sum, file) => sum + file.bytes, 0);
  const header = {
    recordType: "header",
    schemaVersion: 1,
    manifestKind: "vcc-research-cache",
    digestAlgorithm: "sha256",
    copyExitCode: 0,
    copyFlags: "fixture",
    copyTool: "fixture-copy",
    excludedReparsePointCount: 0,
    excludedVolatileFileCount: 1,
    generatedAtUtc: "2026-08-11T00:00:00Z",
    intendedRepoPath: "research/",
    nasContentRoot: "/fixture/content",
    ordinaryFileBytes,
    ordinaryFileCount: files.length,
    orderedSourceAndNasHashListSha256: "a".repeat(64),
    rawCopyFileBytes: ordinaryFileBytes + volatileBytes,
    rawCopyFileCount: files.length + 1,
    rightsNotice: "fixture only",
    sourceAbsoluteRoot: "/fixture/source",
    sourceLogicalRoot: "research",
    sourceRepoHead: "b".repeat(40),
    verificationStatus: "verified-fixture",
    ...headerOverrides,
  };
  const volatile = {
    recordType: "excludedVolatileFile",
    path: ".DS_Store",
    reason: "volatile",
    sourceBytes: volatileBytes,
    sourceSha256: "c".repeat(64),
    nasObservedSha256AfterRewrite: "d".repeat(64),
  };
  return bytes(`${[header, ...files, volatile].map((record) => JSON.stringify(record)).join("\n")}\n`);
}

interface Fixture {
  readonly snapshot: Phase8bLocalSnapshot;
  readonly files: readonly CacheFile[];
  readonly values: Readonly<Record<string, Uint8Array>>;
}

function fixture(): Fixture {
  const paper = bytes("%PDF fixture paper");
  const member = bytes("temperature,value\n-5,12\n");
  const archive = storedZip([
    { name: "dataset/" },
    { name: "dataset/values.csv", value: member },
  ]);
  const render = bytes("png fixture");
  const tar = bytes("fixture POSIX TAR bytes");
  const gitBundle = bytes("# v2 git bundle\nfixture\n");
  const gitPack = bytes("PACK fixture");
  const files = [
    cacheFile("paper.pdf", paper, "ignored-research-cache", "_root"),
    cacheFile("data.zip", archive, "ignored-research-cache", "_root"),
    cacheFile("paper/page-0001.png", render, "ignored-research-cache", "paper"),
    cacheFile("tmp/recovery/copy.pdf", paper, "recovery-or-scratch", "tmp"),
    cacheFile("tmp/recovery/archive.tar", tar, "recovery-or-scratch", "tmp"),
    cacheFile("tmp/recovery/history.bundle", gitBundle, "recovery-or-scratch", "tmp"),
    cacheFile("tmp/recovery/objects.pack", gitPack, "recovery-or-scratch", "tmp"),
  ];
  const expectedCounts: Phase8bLocalCounts = {
    recursiveContainerCandidateCount: 6,
    recursiveDocumentCandidateCount: 2,
    recursiveArchiveCandidateCount: 4,
    pdfCandidateCount: 2,
    zipCandidateCount: 1,
    tarCandidateCount: 1,
    gitBundleCandidateCount: 1,
    gitPackCandidateCount: 1,
    recursiveCandidateBytes: paper.length + archive.length + paper.length + tar.length + gitBundle.length + gitPack.length,
    excludedRecoveryCandidateCount: 4,
    excludedDocumentCandidateCount: 1,
    excludedArchiveCandidateCount: 3,
    excludedRecoveryCandidateBytes: paper.length + tar.length + gitBundle.length + gitPack.length,
    sourceContainerCount: 2,
    pdfContainerCount: 1,
    archiveContainerCount: 1,
    sourceContainerBytes: paper.length + archive.length,
    pdfPageCount: 2,
    archiveRegularMemberCount: 1,
    sourceUnitCount: 3,
    renderReferenceCount: 1,
    pageWithoutRenderReferenceCount: 1,
    externalMirrorCount: 1,
    missingManifestedFileCount: 0,
    substantiveUnresolvedExternalFileCount: 0,
    pendingClassificationCount: 3,
    measurementSetCount: 0,
  };
  const snapshot: Phase8bLocalSnapshot = {
    scope: "test-fixture",
    expectedCounts,
    cacheManifestBytes: cacheManifest(files),
    liveRelativePaths: [...files.map((file) => file.path), ".DS_Store", "dataset/values.csv"],
    freshBytes: new Map([
      ["paper.pdf", paper],
      ["data.zip", archive],
      ["paper/page-0001.png", render],
      ["tmp/recovery/copy.pdf", paper],
      ["tmp/recovery/archive.tar", tar],
      ["tmp/recovery/history.bundle", gitBundle],
      ["tmp/recovery/objects.pack", gitPack],
      ["dataset/values.csv", member],
    ]),
    pdfPageCounts: new Map([["paper.pdf", 2]]),
    tools: { node: "node fixture", pdfinfo: "pdfinfo fixture", ripgrep: "ripgrep fixture" },
    implementationPins: [
      {
        path: "runner/src/gate4-evidence.ts",
        byteLength: 10,
        sha256: "5".repeat(64),
        gitObjectId: "6".repeat(40),
      },
      {
        path: "runner/src/phase8-corpus-local.ts",
        byteLength: 11,
        sha256: "1".repeat(64),
        gitObjectId: "2".repeat(40),
      },
      {
        path: "runner/test/phase8-corpus-local.test.ts",
        byteLength: 12,
        sha256: "3".repeat(64),
        gitObjectId: "4".repeat(40),
      },
    ],
  };
  return { snapshot, files, values: { paper, archive, render, member, tar, gitBundle, gitPack } };
}

function changed(
  snapshot: Phase8bLocalSnapshot,
  overrides: Partial<Phase8bLocalSnapshot>,
): Phase8bLocalSnapshot {
  return { ...snapshot, ...overrides };
}

function mutableArtifacts(bundle: Phase8bLocalBundle): Map<string, Uint8Array> {
  return new Map([...bundle.artifacts].map(([name, value]) => [name, value.slice()]));
}

describe("Phase 8B cache manifest", () => {
  it("accepts the exact fixture keys and rejects duplicate, extra, and stale structure", () => {
    const { snapshot } = fixture();
    expect(parsePhase8bCacheManifest(snapshot.cacheManifestBytes).files).toHaveLength(7);

    const text = new TextDecoder().decode(snapshot.cacheManifestBytes);
    const duplicate = bytes(text.replace('{"recordType":"header"', '{"recordType":"header","recordType":"header"'));
    expect(() => parsePhase8bCacheManifest(duplicate)).toThrow(/duplicates key recordType/);

    const lines = text.trimEnd().split("\n");
    const header = JSON.parse(lines[0]) as Record<string, unknown>;
    lines[0] = JSON.stringify({ ...header, unexpected: true });
    expect(() => parsePhase8bCacheManifest(bytes(`${lines.join("\n")}\n`))).toThrow(/keys must be exactly/);

    const stale = { ...header, ordinaryFileCount: Number(header.ordinaryFileCount) + 1 };
    lines[0] = JSON.stringify(stale);
    expect(() => parsePhase8bCacheManifest(bytes(`${lines.join("\n")}\n`))).toThrow(/file count is stale/);
  });
});

describe("Phase 8B strict ZIP inventory", () => {
  it("preserves full member paths and excludes directory entries", () => {
    const archive = storedZip([
      { name: "nested/" },
      { name: "nested/table.csv", value: bytes("x,y\n1,2\n") },
    ]);
    const inventory = phase8bReadZipInventory(archive);
    expect(inventory.directoryEntryCount).toBe(1);
    expect(inventory.regularMembers.map((member) => member.path)).toEqual(["nested/table.csv"]);
  });

  it.each(["../escape.csv", "C:/escape.csv"])("rejects unsafe member path %s", (name) => {
    expect(() => phase8bReadZipInventory(storedZip([{ name, value: bytes("bad") }]))).toThrow(/unsafe/);
  });

  it("rejects exact duplicates and case-fold collisions", () => {
    expect(() => phase8bReadZipInventory(storedZip([
      { name: "same.csv", value: bytes("a") },
      { name: "same.csv", value: bytes("b") },
    ]))).toThrow(/duplicate member path/);
    expect(() => phase8bReadZipInventory(storedZip([
      { name: "Data.csv", value: bytes("a") },
      { name: "data.csv", value: bytes("b") },
    ]))).toThrow(/case-colliding/);
  });

  it("rejects symbolic links and encryption", () => {
    expect(() => phase8bReadZipInventory(storedZip([{
      name: "link",
      value: bytes("target"),
      externalAttributes: 0xa1ff0000,
    }]))).toThrow(/symbolic-link/);
    expect(() => phase8bReadZipInventory(storedZip([{
      name: "secret.csv",
      value: bytes("secret"),
      flags: 0x0801,
    }]))).toThrow(/encrypted/);
  });

  it("rejects payload CRC failure and local/central CRC disagreement", () => {
    expect(() => phase8bReadZipInventory(storedZip([{
      name: "bad-crc.csv",
      value: bytes("value"),
      declaredCrc: 1,
    }]))).toThrow(/fails CRC-32/);
    expect(() => phase8bReadZipInventory(storedZip([{
      name: "split-crc.csv",
      value: bytes("value"),
      localCrc: 1,
    }]))).toThrow(/local\/central size or CRC metadata disagree/);
  });
});

describe("Phase 8B local denominator derivation", () => {
  it("derives two containers and three pending units with the exact artifact set and no trusted pass", () => {
    const { snapshot } = fixture();
    const bundle = derivePhase8bLocalBundle(snapshot);
    expect(bundle.counts.sourceContainerCount).toBe(2);
    expect(bundle.counts.sourceUnitCount).toBe(3);
    expect(bundle.counts.measurementSetCount).toBe(0);
    expect([...bundle.artifacts.keys()].sort()).toEqual([...PHASE8B_LOCAL_ARTIFACT_NAMES].sort());
    const status = JSON.parse(new TextDecoder().decode(bundle.artifacts.get("inventory-status.jsonl"))) as Record<string, unknown>;
    expect(status).not.toHaveProperty("pass");
    expect(status).toMatchObject({
      state: "local-denominator-rederived-classification-open",
      grantsValidationClaim: false,
      permitsPhase9Execution: false,
    });
    expect(status.artifactPins).toBeDefined();
    const reconciliation = JSON.parse(
      new TextDecoder().decode(bundle.artifacts.get("cache-reconciliation.json")),
    ) as { recursiveContainerCandidates: readonly Record<string, unknown>[] };
    expect(reconciliation.recursiveContainerCandidates.filter((candidate) =>
      candidate.disposition === "excluded-vcs-transport-or-object-store")).toHaveLength(2);
    expect(reconciliation.recursiveContainerCandidates.some((candidate) => candidate.format === "tar")).toBe(true);
  });

  it("rejects a count registration mismatch", () => {
    const { snapshot } = fixture();
    const expectedCounts = { ...snapshot.expectedCounts, sourceUnitCount: 4 };
    expect(() => derivePhase8bLocalBundle(changed(snapshot, { expectedCounts }))).toThrow(/sourceUnitCount 3 != 4/);
  });

  it("rejects fixture bytes presented as the registered production corpus", () => {
    const { snapshot } = fixture();
    expect(() => derivePhase8bLocalBundle(changed(snapshot, {
      scope: "registered-local-corpus-v1",
    }))).toThrow(/registered research-cache manifest identity differs/);
  });

  it.each(["paper.pdf", "tmp/recovery/copy.pdf", "tmp/recovery/archive.tar"])("rejects fresh byte drift for %s", (path) => {
    const { snapshot } = fixture();
    const freshBytes = new Map(snapshot.freshBytes);
    const original = freshBytes.get(path) as Uint8Array;
    const drifted = original.slice();
    drifted[0] ^= 1;
    freshBytes.set(path, drifted);
    expect(() => derivePhase8bLocalBundle(changed(snapshot, { freshBytes }))).toThrow(/candidate bytes drifted/);
  });

  it("rejects a page-render byte mutation", () => {
    const { snapshot } = fixture();
    const freshBytes = new Map(snapshot.freshBytes);
    freshBytes.set("paper/page-0001.png", bytes("mutated render"));
    expect(() => derivePhase8bLocalBundle(changed(snapshot, { freshBytes })))
      .toThrow(/page-render bytes drifted/);
  });

  it("rejects a missing manifested path and duplicate live paths", () => {
    const { snapshot } = fixture();
    expect(() => derivePhase8bLocalBundle(changed(snapshot, {
      liveRelativePaths: snapshot.liveRelativePaths.filter((path) => path !== "paper/page-0001.png"),
    }))).toThrow(/manifested files are missing/);
    expect(() => derivePhase8bLocalBundle(changed(snapshot, {
      liveRelativePaths: [...snapshot.liveRelativePaths, "paper.pdf"],
    }))).toThrow(/duplicate paths/);
  });

  it("rejects an unrecognized external file and a non-identical archive mirror", () => {
    const { snapshot } = fixture();
    const extraBytes = new Map(snapshot.freshBytes).set("loose.txt", bytes("loose"));
    expect(() => derivePhase8bLocalBundle(changed(snapshot, {
      liveRelativePaths: [...snapshot.liveRelativePaths, "loose.txt"],
      freshBytes: extraBytes,
    }))).toThrow(/not an archive-member mirror/);

    const badMirror = new Map(snapshot.freshBytes).set("dataset/values.csv", bytes("different bytes"));
    expect(() => derivePhase8bLocalBundle(changed(snapshot, { freshBytes: badMirror }))).toThrow(/mirror bytes disagree/);
  });

  it("rejects invalid and extra PDF page-count keys", () => {
    const { snapshot } = fixture();
    expect(() => derivePhase8bLocalBundle(changed(snapshot, {
      pdfPageCounts: new Map([["paper.pdf", 0]]),
    }))).toThrow(/page count is missing or invalid/);
    expect(() => derivePhase8bLocalBundle(changed(snapshot, {
      pdfPageCounts: new Map([["paper.pdf", 2], ["extra.pdf", 1]]),
    }))).toThrow(/key set differs/);
  });

  it("rejects nonconforming and out-of-range render names", () => {
    const base = fixture();
    const addRender = (path: string): Phase8bLocalSnapshot => {
      const render = bytes("extra render");
      const files = [...base.files, cacheFile(path, render, "ignored-research-cache", "paper")];
      return changed(base.snapshot, {
        cacheManifestBytes: cacheManifest(files),
        liveRelativePaths: [...base.snapshot.liveRelativePaths, path],
        freshBytes: new Map(base.snapshot.freshBytes).set(path, render),
      });
    };
    expect(() => derivePhase8bLocalBundle(addRender("paper/figure.png"))).toThrow(/nonconforming PNG names/);
    expect(() => derivePhase8bLocalBundle(addRender("paper/page-0003.png"))).toThrow(/outside PDF extent/);
  });

  it("rejects an undispositioned recursive candidate and stale implementation registration", () => {
    const base = fixture();
    const stray = bytes("%PDF stray");
    const path = "other/stray.pdf";
    const files = [...base.files, cacheFile(path, stray, "ignored-research-cache", "other")];
    const freshBytes = new Map(base.snapshot.freshBytes).set(path, stray);
    expect(() => derivePhase8bLocalBundle(changed(base.snapshot, {
      cacheManifestBytes: cacheManifest(files),
      liveRelativePaths: [...base.snapshot.liveRelativePaths, path],
      freshBytes,
    }))).toThrow(/no registered disposition/);

    expect(() => derivePhase8bLocalBundle(changed(base.snapshot, {
      implementationPins: base.snapshot.implementationPins.slice(0, 1),
    }))).toThrow(/implementation pin path set differs/);
  });
});

describe("Phase 8B bundle verification and publication", () => {
  it("rejects artifact mutation, a caller-supplied pass, and an extra file", () => {
    const { snapshot } = fixture();
    const bundle = derivePhase8bLocalBundle(snapshot);
    const mutated = mutableArtifacts(bundle);
    const report = JSON.parse(new TextDecoder().decode(mutated.get("report.json"))) as Record<string, unknown>;
    mutated.set("report.json", canonicalJsonBytes({ ...report, claim: "changed" }));
    expect(() => verifyPhase8bLocalBundleArtifacts(mutated, snapshot)).toThrow(/artifact differs: report.json/);

    const callerPass = mutableArtifacts(bundle);
    const status = JSON.parse(new TextDecoder().decode(callerPass.get("inventory-status.jsonl"))) as Record<string, unknown>;
    callerPass.set("inventory-status.jsonl", bytes(`${JSON.stringify({ ...status, pass: true })}\n`));
    expect(() => verifyPhase8bLocalBundleArtifacts(callerPass, snapshot)).toThrow(/artifact differs/);

    const extra = mutableArtifacts(bundle);
    extra.set("extra.json", bytes("{}"));
    expect(() => verifyPhase8bLocalBundleArtifacts(extra, snapshot)).toThrow(/file set differs/);
  });

  it("writes and reopens the exact bundle", () => {
    const { snapshot } = fixture();
    const bundle = derivePhase8bLocalBundle(snapshot);
    const root = mkdtempSync(join(tmpdir(), "vcc-phase8b-local-"));
    tempRoots.push(root);
    const destination = join(root, "bundle");
    writePhase8bLocalBundleDirectory(destination, bundle);
    const reopened = readPhase8bLocalBundleDirectory(destination);
    expect([...reopened.keys()].sort()).toEqual([...PHASE8B_LOCAL_ARTIFACT_NAMES].sort());
    expect(readFileSync(join(destination, "report.json"))).toEqual(Buffer.from(bundle.artifacts.get("report.json") as Uint8Array));
  });

  it("refuses incomplete and unsafe bundle names", () => {
    const { snapshot } = fixture();
    const bundle = derivePhase8bLocalBundle(snapshot);
    const root = mkdtempSync(join(tmpdir(), "vcc-phase8b-writer-"));
    tempRoots.push(root);
    const incomplete = mutableArtifacts(bundle);
    incomplete.delete("report.json");
    expect(() => writePhase8bLocalBundleDirectory(join(root, "incomplete"), {
      ...bundle,
      artifacts: incomplete,
    })).toThrow(/unsafe or incomplete/);
    const unsafe = mutableArtifacts(bundle);
    unsafe.set("../escape", bytes("bad"));
    expect(() => writePhase8bLocalBundleDirectory(join(root, "unsafe"), {
      ...bundle,
      artifacts: unsafe,
    })).toThrow(/unsafe or incomplete/);
  });
});
