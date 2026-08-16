import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

import { afterAll, describe, expect, it } from "vitest";

import { runNasAssetRestoreCli, type NasAssetRestoreCliIo } from "../../scripts/nas-asset-restore.ts";
import { parseNasAssetCatalogV1, type NasAssetCollectionV1 } from "../../scripts/nas-asset-lib.ts";
import { NAS_SHARE_MARKER, NAS_SHARE_MARKER_PATH } from "../../scripts/nas-root.ts";

const REPOSITORY_ROOT = resolve(import.meta.dirname, "..", "..");
const ENTRYPOINT = join(REPOSITORY_ROOT, "scripts", "nas-asset-restore.ts");
const REAL_CATALOGUE = parseNasAssetCatalogV1(
  readFileSync(join(REPOSITORY_ROOT, "docs", "nas-assets.json"), "utf8"),
);
const temporaryRoots: string[] = [];

const temporaryRoot = (label: string): string => {
  const root = mkdtempSync(join(tmpdir(), `nas-restore-cli-${label}-`));
  temporaryRoots.push(root);
  return root;
};

afterAll(() => {
  for (const root of temporaryRoots) rmSync(root, { recursive: true, force: true });
});

const sha256 = (value: string | Buffer): string =>
  createHash("sha256").update(value).digest("hex");

interface CliFixture {
  readonly repo: string;
  readonly share: string;
  readonly catalogPath: string;
  readonly secretName: string;
}

const makeFixture = (
  label: string,
  options: {
    readonly secretName?: string;
    readonly expected?: string;
    readonly actual?: string;
  } = {},
): CliFixture => {
  const repo = temporaryRoot(`${label}-repo`);
  const share = temporaryRoot(`${label}-share`);
  const secretName = options.secretName ?? "private-fixture-name.bin";
  const expected = options.expected ?? "one";
  const actual = options.actual ?? expected;
  writeFileSync(join(share, NAS_SHARE_MARKER_PATH), `${JSON.stringify(NAS_SHARE_MARKER)}\n`);
  mkdirSync(join(share, "payload"));
  writeFileSync(join(share, "payload", secretName), actual);
  const manifest = Buffer.from(JSON.stringify({
    files: [{
      path: `payload/${secretName}`,
      bytes: Buffer.byteLength(expected),
      sha256: sha256(expected),
    }],
  }));
  mkdirSync(join(repo, "manifests"));
  writeFileSync(join(repo, "manifests", "owner.json"), manifest);
  const template = REAL_CATALOGUE.collections.find((entry) => entry.assetId === "gutcheck-generated-public");
  if (template === undefined) throw new Error("missing generated collection template");
  const collection: NasAssetCollectionV1 = {
    ...structuredClone(template),
    assetId: "fixture-cli",
    version: "v1",
    ownerWorkstream: "fixture",
    locator: "payload",
    historicalRepoPath: "payload",
    legacyAliases: [],
    aggregate: { files: 1, bytes: Buffer.byteLength(expected) },
    ownerManifest: {
      storage: "tracked",
      path: "manifests/owner.json",
      format: "fixture-owner-v1",
      bytes: manifest.byteLength,
      sha256: sha256(manifest),
      selector: { kind: "all" },
    },
    serve: { policy: "deny", prefixes: [] },
    restore: {
      status: "documented",
      command: "npm run assets:restore -- --collection fixture-cli@v1 --to out/restores/fixture-cli-v1",
      verifyCommand: "npm run assets:verify-restored -- --collection fixture-cli@v1 --from out/restores/fixture-cli-v1",
      record: "docs/nas-inventory-audit-20260815.md",
    },
    verification: {
      status: "manifest-only",
      at: "2026-08-15",
      host: "fixture",
      receipt: "docs/nas-inventory-audit-20260815.md",
      limits: ["Fixture only."],
    },
    unresolved: [],
  };
  const catalogue = parseNasAssetCatalogV1(JSON.stringify({
    ...REAL_CATALOGUE,
    collections: [collection],
    overlays: [],
    systemExclusions: [],
  }));
  mkdirSync(join(repo, "docs"));
  const catalogPath = join(repo, "docs", "nas-assets.json");
  writeFileSync(catalogPath, `${JSON.stringify(catalogue, null, 2)}\n`);
  return { repo, share, catalogPath, secretName };
};

interface CliResult {
  readonly code: number;
  readonly raw: string;
  readonly report: Record<string, unknown>;
}

const run = (
  argv: readonly string[],
  overrides: NasAssetRestoreCliIo = {},
): CliResult => {
  const lines: string[] = [];
  const code = runNasAssetRestoreCli(argv, {
    cwd: REPOSITORY_ROOT,
    environment: {},
    nasCandidates: [],
    ...overrides,
    write: (line) => lines.push(line),
  });
  expect(lines).toHaveLength(1);
  const raw = lines[0] as string;
  return { code, raw, report: JSON.parse(raw) as Record<string, unknown> };
};

describe("legacy NAS restore CLI boundary", () => {
  it.each([
    { argv: [] },
    { argv: ["other"] },
    { argv: ["restore", "--collection", "fixture-cli@v1"] },
    { argv: ["restore", "--collection", "fixture-cli", "--to", "out/restores/x"] },
    { argv: ["restore", "--collection", "fixture-cli@v1", "--from", "out/restores/x"] },
    { argv: ["verify", "--collection", "fixture-cli@v1", "--to", "out/restores/x"] },
    { argv: ["verify", "--collection", "fixture-cli@v1", "--from", "out/restores/x", "--unknown", "x"] },
    { argv: ["restore", "--collection", "fixture-cli@v1", "--repo-root", "/tmp/other", "--to", "out/restores/x"] },
    { argv: ["restore", "--collection", "fixture-cli@v1", "--catalog", "/tmp/other.json", "--to", "out/restores/x"] },
  ])("rejects malformed argv with one sanitized JSON document: $argv", ({ argv }) => {
    const result = run(argv);
    expect(result.code).toBe(1);
    expect(result.report).toMatchObject({
      ok: false,
      errorCode: "fatal-input-catalogue-or-share-error",
      durableReceiptWritten: false,
      pruneAuthorized: false,
    });
    expect(result.raw.trim().startsWith("{")).toBe(true);
  });

  it("registers the exact production package command surface", () => {
    const pkg = JSON.parse(readFileSync(join(REPOSITORY_ROOT, "package.json"), "utf8")) as {
      scripts: Record<string, string>;
    };
    expect(pkg.scripts["assets:restore"]).toBe("node scripts/nas-asset-restore.ts restore");
    expect(pkg.scripts["assets:verify-restored"]).toBe("node scripts/nas-asset-restore.ts verify");
  });

  it("runs restore and destination verification through the exported CLI without path disclosure", () => {
    const fixture = makeFixture("api-success");
    const common = [
      "--collection", "fixture-cli@v1",
      "--nas-root", fixture.share,
    ];
    const fixtureIo = { repoRoot: fixture.repo, catalogPath: fixture.catalogPath };
    const restored = run(
      ["restore", ...common, "--to", "out/restores/fixture-cli-v1"],
      fixtureIo,
    );
    expect(restored.code).toBe(0);
    expect(restored.report).toMatchObject({
      command: "restore",
      ok: true,
      collection: "fixture-cli@v1",
      destinationScope: "repo-out-restores",
      fileCount: 1,
      durableReceiptWritten: false,
      pruneAuthorized: false,
    });
    expect(restored.raw).not.toContain(fixture.repo);
    expect(restored.raw).not.toContain(fixture.share);
    expect(restored.raw).not.toContain(fixture.secretName);

    const verified = run(
      ["verify", ...common, "--from", "out/restores/fixture-cli-v1"],
      fixtureIo,
    );
    expect(verified.code).toBe(0);
    expect(verified.report).toMatchObject({ command: "verify", ok: true });
    expect(verified.raw).not.toContain(fixture.secretName);
  });

  it("rejects child-process repo/catalog overrides before copying any byte", () => {
    const fixture = makeFixture("child-override");
    const environment = { ...process.env, VCC_NAS_ROOT: "", GUTCHECK_NAS_ROOT: "" };
    for (const [flag, value] of [
      ["--repo-root", fixture.repo],
      ["--catalog", fixture.catalogPath],
    ] as const) {
      const secretDestinationName = `override-must-not-copy-${flag.slice(2)}-${process.pid}`;
      const canonicalTarget = join(REPOSITORY_ROOT, "out", "restores", secretDestinationName);
      expect(existsSync(canonicalTarget)).toBe(false);
      const rejected = spawnSync(
        process.execPath,
        [
          ENTRYPOINT,
          "restore",
          "--collection", "fixture-cli@v1",
          flag, value,
          "--nas-root", fixture.share,
          "--to", `out/restores/${secretDestinationName}`,
        ],
        { cwd: REPOSITORY_ROOT, env: environment, encoding: "utf8" },
      );
      expect(rejected.status).toBe(1);
      expect(JSON.parse(rejected.stdout) as Record<string, unknown>).toMatchObject({
        command: "restore",
        ok: false,
        errorCode: "fatal-input-catalogue-or-share-error",
        destinationReserved: false,
      });
      expect(rejected.stderr).toBe("");
      expect(existsSync(canonicalTarget)).toBe(false);
      expect(rejected.stdout).not.toContain(value);
      expect(rejected.stdout).not.toContain(secretDestinationName);
    }
    expect(existsSync(join(fixture.repo, "out"))).toBe(false);
  });

  it("executes a real failing child without disclosing source/destination names or host paths", () => {
    const fixture = makeFixture("child-failure");
    const secretSourceIdentity = "confidential-source-title.pdf@v1";
    const secretDestinationName = "maker-secret-restore-target";
    const failed = spawnSync(
      process.execPath,
      [
        ENTRYPOINT,
        "restore",
        "--collection", secretSourceIdentity,
        "--nas-root", fixture.share,
        "--to", `out/restores/${secretDestinationName}`,
      ],
      {
        cwd: REPOSITORY_ROOT,
        env: { ...process.env, VCC_NAS_ROOT: "", GUTCHECK_NAS_ROOT: "" },
        encoding: "utf8",
      },
    );
    expect(failed.status).toBe(1);
    expect(JSON.parse(failed.stdout) as Record<string, unknown>).toMatchObject({
      command: "restore",
      ok: false,
      errorCode: "catalogue-selection-invalid",
      destinationReserved: false,
      durableReceiptWritten: false,
      pruneAuthorized: false,
    });
    const combined = `${failed.stdout}\n${failed.stderr}`;
    for (const secret of [
      secretSourceIdentity,
      secretDestinationName,
      fixture.share,
      "payload/",
    ]) {
      expect(combined).not.toContain(secret);
    }
    expect(failed.stderr).toBe("");
  });

  it("redacts private filenames and absolute roots on byte mismatch and exact-set failure", () => {
    const mismatch = makeFixture("privacy-mismatch", {
      secretName: "maker-private-source-title.pdf",
      expected: "one",
      actual: "wrong",
    });
    const mismatchResult = run([
      "restore",
      "--collection", "fixture-cli@v1",
      "--nas-root", mismatch.share,
      "--to", "out/restores/private",
    ], { repoRoot: mismatch.repo, catalogPath: mismatch.catalogPath });
    expect(mismatchResult.code).toBe(1);
    expect(mismatchResult.report).toMatchObject({
      ok: false,
      errorCode: "source-byte-mismatch",
      destinationReserved: true,
    });
    for (const secret of [mismatch.secretName, mismatch.repo, mismatch.share, "payload/"]) {
      expect(mismatchResult.raw).not.toContain(secret);
    }

    const extra = makeFixture("privacy-extra", { secretName: "another-private-name.pdf" });
    const common = [
      "--collection", "fixture-cli@v1",
      "--nas-root", extra.share,
    ];
    const fixtureIo = { repoRoot: extra.repo, catalogPath: extra.catalogPath };
    expect(run(["restore", ...common, "--to", "out/restores/extra"], fixtureIo).code).toBe(0);
    const extraName = "unregistered-private-extra.txt";
    writeFileSync(join(extra.repo, "out", "restores", "extra", extraName), "extra");
    const failedVerify = run(["verify", ...common, "--from", "out/restores/extra"], fixtureIo);
    expect(failedVerify.report).toMatchObject({ ok: false, errorCode: "destination-byte-mismatch" });
    expect(failedVerify.raw).not.toContain(extraName);
    expect(failedVerify.raw).not.toContain(extra.secretName);
    expect(failedVerify.raw).not.toContain(extra.repo);
  });

  it("fails closed on detached and wrong-marker shares", () => {
    const fixture = makeFixture("wrong-marker");
    writeFileSync(join(fixture.share, NAS_SHARE_MARKER_PATH), "{}\n");
    const wrong = run([
      "restore",
      "--collection", "fixture-cli@v1",
      "--nas-root", fixture.share,
      "--to", "out/restores/wrong",
    ], { repoRoot: fixture.repo, catalogPath: fixture.catalogPath });
    expect(wrong.code).toBe(1);
    expect(wrong.report).toMatchObject({
      ok: false,
      errorCode: "fatal-input-catalogue-or-share-error",
      destinationReserved: false,
    });

    const detached = run([
      "restore",
      "--collection", "fixture-cli@v1",
      "--to", "out/restores/detached",
    ], { repoRoot: fixture.repo, catalogPath: fixture.catalogPath });
    expect(detached.code).toBe(1);
    expect(detached.report).toMatchObject({ ok: false, destinationReserved: false });
  });
});
