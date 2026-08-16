import {
  existsSync,
  linkSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  realpathSync,
  renameSync,
  rmSync,
  symlinkSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterAll, describe, expect, it } from "vitest";

import {
  NAS_LOCAL_PRUNE_PLAN_FORMAT,
  NAS_PUBLICATION_RECEIPT_FORMAT,
  NAS_RESTORE_RECEIPT_FORMAT,
  computeLocalPrunePlan,
  publishCollectionFixture,
  restoreCollectionFixture,
  validateForwardPublishIntent,
  writeLocalPrunePlanNoReplace,
  writeTransactionJsonNoReplace,
  type PublishCollectionResult,
} from "../../scripts/nas-asset-transaction-lib.ts";
import type { NasAssetCollectionV1 } from "../../scripts/nas-asset-lib.ts";

const roots: string[] = [];

const fixtureRoot = (label: string): string => {
  const root = mkdtempSync(join(tmpdir(), `nas-transaction-${label}-`));
  roots.push(root);
  return root;
};

const CAN_SYMLINK = (() => {
  const root = fixtureRoot("symlink-probe");
  try {
    symlinkSync(join(root, "missing"), join(root, "link"));
    return true;
  } catch {
    return false;
  }
})();

const CAN_HARDLINK = (() => {
  const root = fixtureRoot("hardlink-probe");
  try {
    writeFileSync(join(root, "source"), "probe");
    linkSync(join(root, "source"), join(root, "alias"));
    return true;
  } catch {
    return false;
  }
})();

const CAN_MACOS_CASE_ALIAS = (() => {
  if (process.platform !== "darwin") return false;
  const root = fixtureRoot("case-alias-probe");
  const canonical = join(root, "case-alias-parent");
  mkdirSync(canonical);
  try {
    return realpathSync.native(join(root, "CASE-ALIAS-PARENT")) === realpathSync.native(canonical);
  } catch {
    return false;
  }
})();

afterAll(() => {
  for (const root of roots) rmSync(root, { recursive: true, force: true });
});

const intentCollection = (
  overrides: Partial<NasAssetCollectionV1> = {},
): NasAssetCollectionV1 => ({
  assetId: "fixture-generated",
  version: "v1",
  state: "provisional",
  ownerWorkstream: "repository-infrastructure",
  locator: "collections/fixture-generated/v1/payload",
  historicalRepoPath: null,
  legacyAliases: [],
  storageClass: "generated-cache",
  aggregate: { files: 0, bytes: 0 },
  ownerManifest: null,
  rights: { kind: "project-owned", redistribution: "allowed" },
  privacy: "public",
  serve: { policy: "deny", prefixes: [] },
  retention: {
    policy: "regenerable",
    garbageCollection: { policy: "plan-only", graceDays: null, approver: "maker" },
  },
  mutability: "immutable",
  externalEvidenceAuthority: null,
  provenance: {
    record: "docs/plans/nas-asset-governance.md",
    producerCommit: null,
    command: "fixture generator",
  },
  reproducibility: {
    kind: "exact-recipe",
    record: "docs/plans/nas-asset-governance.md",
  },
  restore: {
    status: "documented",
    command: "assets:restore fixture-generated@v1",
    verifyCommand: "assets:verify-restored fixture-generated@v1",
    record: "docs/plans/nas-asset-governance.md",
  },
  verification: {
    status: "unavailable",
    at: null,
    host: null,
    receipt: null,
    limits: ["publication pending"],
  },
  storageDomains: ["fixture-share"],
  backup: { status: "not-required", independentDomains: [], receipts: [] },
  supersedes: [],
  unresolved: ["publication and restore verification pending"],
  ...overrides,
});

const activeCollection = (
  intent: NasAssetCollectionV1,
  publication: PublishCollectionResult,
  overrides: Partial<NasAssetCollectionV1> = {},
): NasAssetCollectionV1 => ({
  ...intent,
  state: "active",
  aggregate: {
    files: publication.receipt.final.fileCount,
    bytes: publication.receipt.final.totalBytes,
  },
  ownerManifest: {
    storage: "tracked",
    path: "docs/nas-assets/manifests/fixture-generated-v1.json",
    format: "snowflake-nas-owner-manifest-v1",
    bytes: 1,
    sha256: "a".repeat(64),
    selector: { kind: "all" },
  },
  restore: {
    ...intent.restore,
    status: "tested",
    record: "docs/nas-assets/receipts/fixture-generated-v1-restore.json",
  },
  verification: {
    status: "full-hash",
    at: "2026-08-15",
    host: "fixture",
    receipt: "docs/nas-assets/receipts/fixture-generated-v1-publication.json",
    limits: [],
  },
  unresolved: [],
  ...overrides,
});

interface TreeFixture {
  readonly root: string;
  readonly share: string;
  readonly source: string;
}

const writeFixturePayload = (root: string): void => {
  mkdirSync(join(root, "nested"), { recursive: true });
  writeFileSync(join(root, "root.bin"), "root bytes");
  writeFileSync(join(root, "nested", "secret-project-name.bin"), "private fixture bytes");
};

const treeFixture = (label: string): TreeFixture => {
  const root = fixtureRoot(label);
  const share = join(root, "share");
  const source = join(root, "source");
  mkdirSync(share);
  writeFixturePayload(source);
  return { root, share, source };
};

const publish = (
  fixture: TreeFixture,
  collection = intentCollection(),
  transactionId = "publish-fixture",
): PublishCollectionResult => publishCollectionFixture({
  shareRoot: fixture.share,
  sourceRoot: fixture.source,
  collection,
  catalogueCollections: [collection],
  transactionId,
  now: () => new Date("2026-08-15T12:00:00.000Z"),
});

const receiptDirectory = (fixture: TreeFixture, kind: "publication" | "restore"): string =>
  join(fixture.share, "_control", "receipts", kind, "fixture-generated", "v1");

describe("forward publication intent", () => {
  it("accepts only the deterministic forward locator and rejects grandfathered roots", () => {
    const intent = intentCollection();
    expect(validateForwardPublishIntent(intent, [intent])).toMatchObject({
      identity: "fixture-generated@v1",
      locator: "collections/fixture-generated/v1/payload",
      envelope: "collections/fixture-generated/v1",
    });
    const grandfathered = intentCollection({ locator: "out/legacy/generated" });
    expect(() => validateForwardPublishIntent(grandfathered, [grandfathered])).toThrow(/grandfathered|non-forward/u);
  });

  it("rejects case-folded identity and locator aliases even between provisional entries", () => {
    const upper = intentCollection({ version: "V1", locator: "collections/fixture-generated/V1/payload" });
    const lower = intentCollection({ version: "v1", locator: "collections/fixture-generated/v1/payload" });
    expect(() => validateForwardPublishIntent(upper, [upper, lower])).toThrow(/case\/Unicode identity collision/u);

    const intent = intentCollection();
    const pathAlias = intentCollection({
      assetId: "another-fixture",
      locator: "COLLECTIONS/FIXTURE-GENERATED/V1/PAYLOAD",
    });
    expect(() => validateForwardPublishIntent(intent, [intent, pathAlias])).toThrow(/envelope collides/u);
  });

  it.each(["tracked-evidence", "scratch"] as const)("refuses the %s storage class", (storageClass) => {
    const intent = intentCollection({ storageClass });
    expect(() => validateForwardPublishIntent(intent, [intent])).toThrow(/not publishable/u);
  });
});

describe("transactional publication", () => {
  it("rejects a source that overlaps the governed share before creating transaction state", () => {
    const fixture = treeFixture("publish-overlapping-source");
    const collection = intentCollection();
    expect(() => publishCollectionFixture({
      shareRoot: fixture.share,
      sourceRoot: fixture.share,
      collection,
      catalogueCollections: [collection],
      transactionId: "overlapping-source",
    })).toThrow(/must not overlap/u);
    expect(readdirSync(fixture.share)).toEqual([]);
  });

  it("copies with exact source/stage/final inventories and writes a sanitized unique receipt", () => {
    const fixture = treeFixture("publish-success");
    const result = publish(fixture);
    expect(result.receipt.format).toBe(NAS_PUBLICATION_RECEIPT_FORMAT);
    expect(result.receipt.source).toEqual(result.receipt.staged);
    expect(result.receipt.source).toEqual(result.receipt.final);
    expect(readFileSync(join(result.finalPayloadPath, "root.bin"), "utf8")).toBe("root bytes");
    expect(readFileSync(join(result.finalPayloadPath, "nested", "secret-project-name.bin"), "utf8")).toBe(
      "private fixture bytes",
    );
    const receiptSource = readFileSync(join(fixture.share, result.publicationReceiptPath), "utf8");
    expect(receiptSource).not.toContain("secret-project-name.bin");
    expect(receiptSource).not.toContain("private fixture bytes");
    expect(receiptSource).not.toContain(fixture.root);
    expect(existsSync(join(fixture.share, "_control", "locks", "publish", "fixture-generated@v1.lock"))).toBe(false);
    expect(readdirSync(join(fixture.share, "_control", "staging", "publish"))).toEqual([]);
  });

  it("detects a same-length source mutation after inventory and leaves no final or receipt", () => {
    const fixture = treeFixture("publish-source-mutation");
    const collection = intentCollection();
    let mutationRan = false;
    expect(() => publishCollectionFixture({
      shareRoot: fixture.share,
      sourceRoot: fixture.source,
      collection,
      catalogueCollections: [collection],
      transactionId: "source-mutation",
      hooks: {
        afterPhase: (phase) => {
          if (phase !== "publish-source-inventoried") return;
          writeFileSync(join(fixture.source, "root.bin"), "ROOT BYTES");
          mutationRan = true;
        },
      },
    })).toThrow(/mutated|disagrees/u);
    expect(mutationRan).toBe(true);
    expect(readFileSync(join(fixture.source, "root.bin"), "utf8")).toBe("ROOT BYTES");
    expect(existsSync(join(fixture.share, "collections", "fixture-generated", "v1"))).toBe(false);
    expect(existsSync(receiptDirectory(fixture, "publication"))).toBe(false);
    expect(existsSync(join(fixture.share, "_control", "locks", "publish", "fixture-generated@v1.lock"))).toBe(true);
  });

  it("bounds a concurrently grown source read to its inventoried length plus one byte", () => {
    const fixture = treeFixture("publish-source-growth-bound");
    const collection = intentCollection();
    let stagedRootFile = "";
    let growthRan = false;
    expect(() => publishCollectionFixture({
      shareRoot: fixture.share,
      sourceRoot: fixture.source,
      collection,
      catalogueCollections: [collection],
      transactionId: "source-growth-bound",
      hooks: {
        afterPhase: (phase, context) => {
          if (phase !== "publish-source-inventoried") return;
          stagedRootFile = join(context.stagePayloadPath as string, "root.bin");
          writeFileSync(join(fixture.source, "root.bin"), Buffer.concat([
            Buffer.from("root bytes", "utf8"),
            Buffer.alloc(2 * 1024 * 1024, 0x78),
          ]));
          growthRan = true;
        },
      },
    })).toThrow(/grew beyond/u);
    expect(growthRan).toBe(true);
    expect(readFileSync(stagedRootFile).byteLength).toBe(Buffer.byteLength("root bytes") + 1);
    expect(existsSync(join(fixture.share, "collections", "fixture-generated", "v1"))).toBe(false);
  });

  it("detects an undeclared staged extra before publication", () => {
    const fixture = treeFixture("publish-stage-extra");
    const collection = intentCollection();
    let extraPath = "";
    expect(() => publishCollectionFixture({
      shareRoot: fixture.share,
      sourceRoot: fixture.source,
      collection,
      catalogueCollections: [collection],
      transactionId: "stage-extra",
      hooks: {
        afterPhase: (phase, context) => {
          if (phase !== "publish-stage-verified") return;
          extraPath = join(context.stagePayloadPath as string, "undeclared-extra.bin");
          writeFileSync(extraPath, "extra");
        },
      },
    })).toThrow(/stage immediately before publication/u);
    expect(readFileSync(extraPath, "utf8")).toBe("extra");
    expect(existsSync(join(fixture.share, "collections", "fixture-generated", "v1"))).toBe(false);
  });

  it.skipIf(!CAN_SYMLINK)("rejects a replaced staging root before copying any outside byte", () => {
    const fixture = treeFixture("publish-stage-symlink-swap");
    const collection = intentCollection();
    const movedStage = join(fixture.root, "moved-original-stage");
    const outside = join(fixture.root, "outside-stage");
    mkdirSync(join(outside, "payload"), { recursive: true });
    writeFileSync(join(outside, "payload", "outside-witness.bin"), "outside witness");
    let swapRan = false;
    expect(() => publishCollectionFixture({
      shareRoot: fixture.share,
      sourceRoot: fixture.source,
      collection,
      catalogueCollections: [collection],
      transactionId: "stage-symlink-swap",
      hooks: {
        afterPhase: (phase, context) => {
          if (phase !== "publish-source-inventoried") return;
          renameSync(context.stageRoot as string, movedStage);
          symlinkSync(outside, context.stageRoot as string, "dir");
          swapRan = true;
        },
      },
    })).toThrow(/copy destination root changed/u);
    expect(swapRan).toBe(true);
    expect(readdirSync(join(outside, "payload"))).toEqual(["outside-witness.bin"]);
    expect(existsSync(join(fixture.share, "collections", "fixture-generated", "v1"))).toBe(false);
  });

  it("rejects a byte-identical replacement of the verified staging envelope", () => {
    const fixture = treeFixture("publish-stage-envelope-replaced");
    const collection = intentCollection();
    const hijacked = join(fixture.root, "hijacked-original-stage");
    let replacement = "";
    expect(() => publishCollectionFixture({
      shareRoot: fixture.share,
      sourceRoot: fixture.source,
      collection,
      catalogueCollections: [collection],
      transactionId: "stage-envelope-replaced",
      hooks: {
        afterPhase: (phase, context) => {
          if (phase !== "publish-final-absent") return;
          renameSync(context.stageRoot as string, hijacked);
          replacement = context.stagePayloadPath as string;
          writeFixturePayload(replacement);
        },
      },
    })).toThrow(/owned tree root changed/u);
    expect(readFileSync(join(hijacked, "payload", "root.bin"), "utf8")).toBe("root bytes");
    expect(readFileSync(join(replacement, "root.bin"), "utf8")).toBe("root bytes");
    expect(existsSync(join(fixture.share, "collections", "fixture-generated", "v1"))).toBe(false);
    expect(existsSync(receiptDirectory(fixture, "publication"))).toBe(false);
  });

  it("does not clobber a collision inserted at the final publication boundary", () => {
    const fixture = treeFixture("publish-collision");
    const collection = intentCollection();
    const collision = join(fixture.share, "collections", "fixture-generated", "v1");
    expect(() => publishCollectionFixture({
      shareRoot: fixture.share,
      sourceRoot: fixture.source,
      collection,
      catalogueCollections: [collection],
      transactionId: "collision",
      hooks: {
        afterPhase: (phase) => {
          if (phase !== "publish-final-absent") return;
          mkdirSync(collision);
          writeFileSync(join(collision, "sentinel"), "do not replace");
        },
      },
    })).toThrow(/already exists/u);
    expect(readFileSync(join(collision, "sentinel"), "utf8")).toBe("do not replace");
    expect(existsSync(receiptDirectory(fixture, "publication"))).toBe(false);
  });

  it("does not replace an empty directory inserted at the final publication boundary", () => {
    const fixture = treeFixture("publish-empty-collision");
    const collection = intentCollection();
    const collision = join(fixture.share, "collections", "fixture-generated", "v1");
    expect(() => publishCollectionFixture({
      shareRoot: fixture.share,
      sourceRoot: fixture.source,
      collection,
      catalogueCollections: [collection],
      transactionId: "empty-collision",
      hooks: {
        afterPhase: (phase) => {
          if (phase === "publish-final-absent") mkdirSync(collision);
        },
      },
    })).toThrow(/already exists/u);
    expect(existsSync(collision)).toBe(true);
    expect(readdirSync(collision)).toEqual([]);
    expect(existsSync(receiptDirectory(fixture, "publication"))).toBe(false);
  });

  it.skipIf(!CAN_SYMLINK)("refuses a final-parent symlink swap before any byte escapes the share", () => {
    const fixture = treeFixture("publish-final-parent-swap");
    const collection = intentCollection();
    const movedParent = join(fixture.root, "moved-collection-parent");
    const outside = join(fixture.root, "outside-publication");
    mkdirSync(outside);
    let swapRan = false;
    expect(() => publishCollectionFixture({
      shareRoot: fixture.share,
      sourceRoot: fixture.source,
      collection,
      catalogueCollections: [collection],
      transactionId: "final-parent-swap",
      hooks: {
        afterPhase: (phase, context) => {
          if (phase !== "publish-final-absent") return;
          const parent = dirname(context.finalEnvelopePath as string);
          renameSync(parent, movedParent);
          symlinkSync(outside, parent, "dir");
          swapRan = true;
        },
      },
    })).toThrow(/parent changed/u);
    expect(swapRan).toBe(true);
    expect(readdirSync(outside)).toEqual([]);
    expect(readFileSync(join(fixture.source, "root.bin"), "utf8")).toBe("root bytes");
  });

  it("leaves an auditable orphan and no receipt when interrupted after final rename", () => {
    const fixture = treeFixture("publish-post-rename-crash");
    const collection = intentCollection();
    expect(() => publishCollectionFixture({
      shareRoot: fixture.share,
      sourceRoot: fixture.source,
      collection,
      catalogueCollections: [collection],
      transactionId: "post-rename-crash",
      hooks: {
        afterPhase: (phase) => {
          if (phase === "publish-final-published") throw new Error("fixture crash after final rename");
        },
      },
    })).toThrow(/fixture crash/u);
    expect(readFileSync(join(fixture.share, "collections", "fixture-generated", "v1", "payload", "root.bin"), "utf8"))
      .toBe("root bytes");
    expect(readFileSync(join(fixture.source, "root.bin"), "utf8")).toBe("root bytes");
    expect(existsSync(receiptDirectory(fixture, "publication"))).toBe(false);
    expect(existsSync(join(fixture.share, "_control", "locks", "publish", "fixture-generated@v1.lock"))).toBe(true);
  });

  it("rechecks final bytes after the verification seam before writing a receipt", () => {
    const fixture = treeFixture("publish-late-final-mutation");
    const collection = intentCollection();
    let lateExtra = "";
    expect(() => publishCollectionFixture({
      shareRoot: fixture.share,
      sourceRoot: fixture.source,
      collection,
      catalogueCollections: [collection],
      transactionId: "late-final-mutation",
      hooks: {
        afterPhase: (phase, context) => {
          if (phase !== "publish-final-verified") return;
          lateExtra = join(context.finalPayloadPath as string, "late-extra.bin");
          writeFileSync(lateExtra, "late mutation");
        },
      },
    })).toThrow(/final payload at publication receipt boundary/u);
    expect(readFileSync(lateExtra, "utf8")).toBe("late mutation");
    expect(existsSync(receiptDirectory(fixture, "publication"))).toBe(false);
  });

  it("never auto-breaks an interrupted per-identity lock", () => {
    const fixture = treeFixture("publish-lock-contention");
    const collection = intentCollection();
    expect(() => publishCollectionFixture({
      shareRoot: fixture.share,
      sourceRoot: fixture.source,
      collection,
      catalogueCollections: [collection],
      transactionId: "first-publisher",
      hooks: {
        afterPhase: (phase) => {
          if (phase === "publish-lock-acquired") throw new Error("publisher stopped");
        },
      },
    })).toThrow(/publisher stopped/u);
    expect(() => publishCollectionFixture({
      shareRoot: fixture.share,
      sourceRoot: fixture.source,
      collection,
      catalogueCollections: [collection],
      transactionId: "second-publisher",
    })).toThrow(/lock already exists|never broken automatically/u);
    const owner = readFileSync(
      join(fixture.share, "_control", "locks", "publish", "fixture-generated@v1.lock", "owner.json"),
      "utf8",
    );
    expect(owner).toContain("first-publisher");
    expect(owner).not.toContain("second-publisher");
  });

  it("never releases a lock whose owner file was replaced", () => {
    const fixture = treeFixture("publish-lock-owner-replaced");
    const collection = intentCollection();
    const ownerPath = join(
      fixture.share,
      "_control",
      "locks",
      "publish",
      "fixture-generated@v1.lock",
      "owner.json",
    );
    let replacementRan = false;
    expect(() => publishCollectionFixture({
      shareRoot: fixture.share,
      sourceRoot: fixture.source,
      collection,
      catalogueCollections: [collection],
      transactionId: "owner-replaced",
      hooks: {
        afterPhase: (phase) => {
          if (phase !== "publish-lock-acquired") return;
          unlinkSync(ownerPath);
          writeFileSync(ownerPath, "replacement owner\n", { mode: 0o600 });
          replacementRan = true;
        },
      },
    })).toThrow(/lock owner changed/u);
    expect(replacementRan).toBe(true);
    expect(readFileSync(ownerPath, "utf8")).toBe("replacement owner\n");
    expect(existsSync(dirname(ownerPath))).toBe(true);
  });

  it("does not treat a written receipt as complete while its publication lock remains", () => {
    const fixture = treeFixture("publish-receipt-before-unlock");
    const collection = intentCollection();
    expect(() => publishCollectionFixture({
      shareRoot: fixture.share,
      sourceRoot: fixture.source,
      collection,
      catalogueCollections: [collection],
      transactionId: "receipt-before-unlock",
      hooks: {
        afterPhase: (phase) => {
          if (phase === "publish-receipt-written") throw new Error("fixture crash before unlock");
        },
      },
    })).toThrow(/fixture crash before unlock/u);
    const receipts = readdirSync(receiptDirectory(fixture, "publication"));
    expect(receipts).toEqual(["receipt-before-unlock.json"]);
    const restoreParent = join(fixture.root, "restores");
    mkdirSync(restoreParent);
    expect(() => restoreCollectionFixture({
      shareRoot: fixture.share,
      destinationPath: join(restoreParent, "target"),
      collection,
      publicationReceiptPath: `_control/receipts/publication/fixture-generated/v1/${receipts[0] as string}`,
      transactionId: "restore-must-refuse-publish-lock",
    })).toThrow(/outstanding publish transaction lock/u);
    expect(readdirSync(restoreParent)).toEqual([]);
  });

  it.skipIf(!CAN_SYMLINK)("refuses a symbolic-link source member", () => {
    const fixture = treeFixture("publish-source-symlink");
    symlinkSync(join(fixture.source, "root.bin"), join(fixture.source, "linked.bin"));
    const collection = intentCollection();
    expect(() => publishCollectionFixture({
      shareRoot: fixture.share,
      sourceRoot: fixture.source,
      collection,
      catalogueCollections: [collection],
      transactionId: "source-symlink",
    })).toThrow(/symbolic link/u);
  });

  it.skipIf(!CAN_HARDLINK)("refuses hard-linked source members", () => {
    const fixture = treeFixture("publish-source-hardlink");
    linkSync(join(fixture.source, "root.bin"), join(fixture.source, "alias.bin"));
    const collection = intentCollection();
    expect(() => publishCollectionFixture({
      shareRoot: fixture.share,
      sourceRoot: fixture.source,
      collection,
      catalogueCollections: [collection],
      transactionId: "source-hardlink",
    })).toThrow(/hard-linked/u);
  });
});

describe("safe restore and receipts", () => {
  it("restores to one absent target, verifies the exact tree, and sanitizes its receipt", () => {
    const fixture = treeFixture("restore-success");
    const collection = intentCollection();
    const publication = publish(fixture, collection, "publication-for-restore");
    const restoreParent = join(fixture.root, "restores");
    const destination = join(restoreParent, "restored-tree");
    mkdirSync(restoreParent);
    const restored = restoreCollectionFixture({
      shareRoot: fixture.share,
      destinationPath: destination,
      collection,
      publicationReceiptPath: publication.publicationReceiptPath,
      transactionId: "restore-success",
      now: () => new Date("2026-08-15T12:30:00.000Z"),
    });
    expect(restored.receipt.format).toBe(NAS_RESTORE_RECEIPT_FORMAT);
    expect(restored.receipt.restored).toEqual(publication.receipt.final);
    expect(readFileSync(join(destination, "nested", "secret-project-name.bin"), "utf8")).toBe("private fixture bytes");
    const receiptSource = readFileSync(join(fixture.share, restored.restoreReceiptPath), "utf8");
    expect(receiptSource).not.toContain("secret-project-name.bin");
    expect(receiptSource).not.toContain(destination);
    expect(receiptSource).not.toContain(fixture.root);
    expect(existsSync(join(fixture.share, "_control", "locks", "restore", "fixture-generated@v1.lock"))).toBe(false);
    expect(readdirSync(restoreParent)).toEqual(["restored-tree"]);
  });

  it("rejects a restore destination inside the governed share before mutating the final", () => {
    const fixture = treeFixture("restore-overlapping-destination");
    const collection = intentCollection();
    const publication = publish(fixture, collection, "publication-before-overlap");
    const destination = join(publication.finalPayloadPath, "restored-inside-final");
    expect(() => restoreCollectionFixture({
      shareRoot: fixture.share,
      destinationPath: destination,
      collection,
      publicationReceiptPath: publication.publicationReceiptPath,
      transactionId: "restore-overlap",
    })).toThrow(/must not overlap/u);
    expect(existsSync(destination)).toBe(false);
    expect(readdirSync(publication.finalPayloadPath).sort()).toEqual(["nested", "root.bin"]);
  });

  it.skipIf(!CAN_MACOS_CASE_ALIAS)(
    "rejects a macOS case alias of the governed share before creating restore transaction state",
    () => {
      const fixture = treeFixture("restore-case-aliased-share");
      const collection = intentCollection();
      const publication = publish(fixture, collection, "publication-before-case-alias");
      const caseAliasedShare = join(dirname(fixture.share), "SHARE");
      expect(realpathSync.native(caseAliasedShare)).toBe(realpathSync.native(fixture.share));
      const destination = join(caseAliasedShare, "restored-through-case-alias");
      const restoreLockRoot = join(fixture.share, "_control", "locks", "restore");
      const restoreStageRoot = join(fixture.share, "_control", "staging", "restore");

      expect(() => restoreCollectionFixture({
        shareRoot: fixture.share,
        destinationPath: destination,
        collection,
        publicationReceiptPath: publication.publicationReceiptPath,
        transactionId: "restore-case-alias",
      })).toThrow(/must not overlap/u);

      expect(existsSync(destination)).toBe(false);
      expect(existsSync(restoreLockRoot)).toBe(false);
      expect(existsSync(restoreStageRoot)).toBe(false);
    },
  );

  it("refuses a published tree with an undeclared extra before restoring", () => {
    const fixture = treeFixture("restore-final-extra");
    const collection = intentCollection();
    const publication = publish(fixture, collection, "publication-before-extra");
    writeFileSync(join(publication.finalPayloadPath, "undeclared.bin"), "extra");
    const restoreParent = join(fixture.root, "restores");
    mkdirSync(restoreParent);
    const destination = join(restoreParent, "target");
    expect(() => restoreCollectionFixture({
      shareRoot: fixture.share,
      destinationPath: destination,
      collection,
      publicationReceiptPath: publication.publicationReceiptPath,
      transactionId: "restore-extra",
    })).toThrow(/published payload before restore/u);
    expect(existsSync(destination)).toBe(false);
  });

  it("detects a same-length final mutation during restore and places no target", () => {
    const fixture = treeFixture("restore-final-mutation");
    const collection = intentCollection();
    const publication = publish(fixture, collection, "publication-before-mutation");
    const restoreParent = join(fixture.root, "restores");
    mkdirSync(restoreParent);
    const destination = join(restoreParent, "target");
    let mutationRan = false;
    expect(() => restoreCollectionFixture({
      shareRoot: fixture.share,
      destinationPath: destination,
      collection,
      publicationReceiptPath: publication.publicationReceiptPath,
      transactionId: "restore-mutation",
      hooks: {
        afterPhase: (phase) => {
          if (phase !== "restore-source-inventoried") return;
          writeFileSync(join(publication.finalPayloadPath, "root.bin"), "ROOT BYTES");
          mutationRan = true;
        },
      },
    })).toThrow(/mutated|disagrees/u);
    expect(mutationRan).toBe(true);
    expect(readFileSync(join(publication.finalPayloadPath, "root.bin"), "utf8")).toBe("ROOT BYTES");
    expect(existsSync(destination)).toBe(false);
  });

  it("does not replace a target inserted at the final placement boundary", () => {
    const fixture = treeFixture("restore-target-collision");
    const collection = intentCollection();
    const publication = publish(fixture, collection, "publication-before-target-collision");
    const restoreParent = join(fixture.root, "restores");
    mkdirSync(restoreParent);
    const destination = join(restoreParent, "target");
    expect(() => restoreCollectionFixture({
      shareRoot: fixture.share,
      destinationPath: destination,
      collection,
      publicationReceiptPath: publication.publicationReceiptPath,
      transactionId: "restore-target-collision",
      hooks: {
        afterPhase: (phase) => {
          if (phase !== "restore-target-absent") return;
          mkdirSync(destination);
          writeFileSync(join(destination, "sentinel"), "keep me");
        },
      },
    })).toThrow(/already exists/u);
    expect(readFileSync(join(destination, "sentinel"), "utf8")).toBe("keep me");
    expect(existsSync(receiptDirectory(fixture, "restore"))).toBe(false);
  });

  it("does not replace an empty target inserted at the final placement boundary", () => {
    const fixture = treeFixture("restore-empty-target-collision");
    const collection = intentCollection();
    const publication = publish(fixture, collection, "publication-before-empty-target-collision");
    const restoreParent = join(fixture.root, "restores");
    mkdirSync(restoreParent);
    const destination = join(restoreParent, "target");
    expect(() => restoreCollectionFixture({
      shareRoot: fixture.share,
      destinationPath: destination,
      collection,
      publicationReceiptPath: publication.publicationReceiptPath,
      transactionId: "restore-empty-target-collision",
      hooks: {
        afterPhase: (phase) => {
          if (phase === "restore-target-absent") mkdirSync(destination);
        },
      },
    })).toThrow(/already exists/u);
    expect(existsSync(destination)).toBe(true);
    expect(readdirSync(destination)).toEqual([]);
    expect(existsSync(receiptDirectory(fixture, "restore"))).toBe(false);
  });

  it.skipIf(!CAN_SYMLINK)("refuses a restore-parent symlink swap before any byte escapes", () => {
    const fixture = treeFixture("restore-parent-swap");
    const collection = intentCollection();
    const publication = publish(fixture, collection, "publication-before-restore-parent-swap");
    const restoreParent = join(fixture.root, "restores");
    const movedParent = join(fixture.root, "moved-restores");
    const outside = join(fixture.root, "outside-restore");
    mkdirSync(restoreParent);
    mkdirSync(outside);
    const destination = join(restoreParent, "target");
    let swapRan = false;
    expect(() => restoreCollectionFixture({
      shareRoot: fixture.share,
      destinationPath: destination,
      collection,
      publicationReceiptPath: publication.publicationReceiptPath,
      transactionId: "restore-parent-swap",
      hooks: {
        afterPhase: (phase) => {
          if (phase !== "restore-target-absent") return;
          renameSync(restoreParent, movedParent);
          symlinkSync(outside, restoreParent, "dir");
          swapRan = true;
        },
      },
    })).toThrow(/parent changed/u);
    expect(swapRan).toBe(true);
    expect(readdirSync(outside)).toEqual([]);
  });

  it("refuses a byte-identical publication receipt copied to a noncanonical path", () => {
    const fixture = treeFixture("restore-noncanonical-publication-receipt");
    const collection = intentCollection();
    const publication = publish(fixture, collection, "canonical-publication");
    const copiedRelative = "_control/receipts/publication/fixture-generated/v1/copied.json";
    writeFileSync(
      join(fixture.share, copiedRelative),
      readFileSync(join(fixture.share, publication.publicationReceiptPath)),
    );
    const restoreParent = join(fixture.root, "restores");
    mkdirSync(restoreParent);
    expect(() => restoreCollectionFixture({
      shareRoot: fixture.share,
      destinationPath: join(restoreParent, "target"),
      collection,
      publicationReceiptPath: copiedRelative,
      transactionId: "restore-copied-receipt",
    })).toThrow(/canonical transaction path/u);
    expect(readdirSync(restoreParent)).toEqual([]);
  });

  it.skipIf(!CAN_SYMLINK)("rejects a symlinked destination ancestor", () => {
    const fixture = treeFixture("restore-destination-symlink");
    const collection = intentCollection();
    const publication = publish(fixture, collection, "publication-before-destination-link");
    const actualParent = join(fixture.root, "actual-parent");
    const linkedParent = join(fixture.root, "linked-parent");
    mkdirSync(actualParent);
    symlinkSync(actualParent, linkedParent, "dir");
    expect(() => restoreCollectionFixture({
      shareRoot: fixture.share,
      destinationPath: join(linkedParent, "target"),
      collection,
      publicationReceiptPath: publication.publicationReceiptPath,
      transactionId: "restore-destination-link",
    })).toThrow(/symlink|non-directory component/u);
    expect(readdirSync(actualParent)).toEqual([]);
  });

  it("leaves a receipt but no prune-eligible state when interrupted before restore unlock", () => {
    const fixture = treeFixture("restore-receipt-before-unlock");
    const intent = intentCollection();
    const publication = publish(fixture, intent, "publication-before-restore-lock-crash");
    const restoreParent = join(fixture.root, "restores");
    mkdirSync(restoreParent);
    expect(() => restoreCollectionFixture({
      shareRoot: fixture.share,
      destinationPath: join(restoreParent, "target"),
      collection: intent,
      publicationReceiptPath: publication.publicationReceiptPath,
      transactionId: "restore-receipt-before-unlock",
      hooks: {
        afterPhase: (phase) => {
          if (phase === "restore-receipt-written") throw new Error("fixture restore unlock crash");
        },
      },
    })).toThrow(/fixture restore unlock crash/u);
    const restoreReceiptPath =
      "_control/receipts/restore/fixture-generated/v1/restore-receipt-before-unlock.json";
    expect(existsSync(join(fixture.share, restoreReceiptPath))).toBe(true);
    expect(() => computeLocalPrunePlan({
      shareRoot: fixture.share,
      sourceRoot: fixture.source,
      collection: activeCollection(intent, publication),
      publicationReceiptPath: publication.publicationReceiptPath,
      restoreReceiptPath,
    })).toThrow(/outstanding restore transaction lock/u);
    expect(readFileSync(join(fixture.source, "root.bin"), "utf8")).toBe("root bytes");
  });

  it("rechecks the placed tree after the verification seam before writing a restore receipt", () => {
    const fixture = treeFixture("restore-late-target-mutation");
    const intent = intentCollection();
    const publication = publish(fixture, intent, "publication-before-late-restore-mutation");
    const restoreParent = join(fixture.root, "restores");
    const destination = join(restoreParent, "target");
    mkdirSync(restoreParent);
    expect(() => restoreCollectionFixture({
      shareRoot: fixture.share,
      destinationPath: destination,
      collection: intent,
      publicationReceiptPath: publication.publicationReceiptPath,
      transactionId: "late-restore-mutation",
      hooks: {
        afterPhase: (phase) => {
          if (phase === "restore-target-verified") writeFileSync(join(destination, "late-extra.bin"), "late mutation");
        },
      },
    })).toThrow(/restored tree at receipt boundary/u);
    expect(readFileSync(join(destination, "late-extra.bin"), "utf8")).toBe("late mutation");
    expect(existsSync(receiptDirectory(fixture, "restore"))).toBe(false);
  });

  it("refuses success and deletes neither tree when the restore stage is replaced before cleanup", () => {
    const fixture = treeFixture("restore-stage-replaced-before-cleanup");
    const intent = intentCollection();
    const publication = publish(fixture, intent, "publication-before-restore-stage-replacement");
    const restoreParent = join(fixture.root, "restores");
    const destination = join(restoreParent, "target");
    const hijacked = join(fixture.root, "hijacked-original-restore-stage");
    mkdirSync(restoreParent);
    let replacement = "";
    expect(() => restoreCollectionFixture({
      shareRoot: fixture.share,
      destinationPath: destination,
      collection: intent,
      publicationReceiptPath: publication.publicationReceiptPath,
      transactionId: "restore-stage-replaced",
      hooks: {
        afterPhase: (phase, context) => {
          if (phase !== "restore-target-verified") return;
          renameSync(context.stageRoot as string, hijacked);
          replacement = context.stageRoot as string;
          writeFixturePayload(replacement);
        },
      },
    })).toThrow(/owned tree root changed/u);
    expect(readFileSync(join(hijacked, "root.bin"), "utf8")).toBe("root bytes");
    expect(readFileSync(join(replacement, "root.bin"), "utf8")).toBe("root bytes");
    expect(readFileSync(join(destination, "root.bin"), "utf8")).toBe("root bytes");
    expect(existsSync(receiptDirectory(fixture, "restore"))).toBe(false);
  });
});

describe("computation-only local prune plan", () => {
  it("binds exact publication/restore receipts and writes a no-replace plan without deleting", () => {
    const fixture = treeFixture("prune-plan-success");
    const intent = intentCollection();
    const publication = publish(fixture, intent, "publication-for-prune");
    const restoreParent = join(fixture.root, "restores");
    mkdirSync(restoreParent);
    const restore = restoreCollectionFixture({
      shareRoot: fixture.share,
      destinationPath: join(restoreParent, "target"),
      collection: intent,
      publicationReceiptPath: publication.publicationReceiptPath,
      transactionId: "restore-for-prune",
    });
    const active = activeCollection(intent, publication);
    const plan = computeLocalPrunePlan({
      shareRoot: fixture.share,
      sourceRoot: fixture.source,
      collection: active,
      publicationReceiptPath: publication.publicationReceiptPath,
      restoreReceiptPath: restore.restoreReceiptPath,
      planId: "prune-plan",
      now: () => new Date("2026-08-15T13:00:00.000Z"),
    });
    expect(plan.format).toBe(NAS_LOCAL_PRUNE_PLAN_FORMAT);
    expect(plan.executionSupported).toBe(false);
    expect(plan.final).toEqual(publication.receipt.final);
    expect(plan.files.map((file) => file.path)).toEqual(["nested/secret-project-name.bin", "root.bin"]);
    const planDirectory = join(fixture.root, "plans");
    const planPath = join(planDirectory, "prune.json");
    mkdirSync(planDirectory);
    writeLocalPrunePlanNoReplace(planPath, plan);
    expect(() => writeLocalPrunePlanNoReplace(planPath, plan)).toThrow(/already exists|EEXIST/u);
    expect(readFileSync(join(fixture.source, "root.bin"), "utf8")).toBe("root bytes");
    expect(readFileSync(join(fixture.source, "nested", "secret-project-name.bin"), "utf8")).toBe(
      "private fixture bytes",
    );
  });

  it("refuses changed local or final bytes instead of inheriting receipt verdicts", () => {
    const localChanged = treeFixture("prune-local-changed");
    const intent = intentCollection();
    const publication = publish(localChanged, intent, "publication-local-change");
    const restoreParent = join(localChanged.root, "restores");
    mkdirSync(restoreParent);
    const restore = restoreCollectionFixture({
      shareRoot: localChanged.share,
      destinationPath: join(restoreParent, "target"),
      collection: intent,
      publicationReceiptPath: publication.publicationReceiptPath,
      transactionId: "restore-local-change",
    });
    const active = activeCollection(intent, publication);
    writeFileSync(join(localChanged.source, "unexpected.bin"), "not published");
    expect(() => computeLocalPrunePlan({
      shareRoot: localChanged.share,
      sourceRoot: localChanged.source,
      collection: active,
      publicationReceiptPath: publication.publicationReceiptPath,
      restoreReceiptPath: restore.restoreReceiptPath,
    })).toThrow(/local prune source/u);
    expect(readFileSync(join(localChanged.source, "unexpected.bin"), "utf8")).toBe("not published");

    rmSync(join(localChanged.source, "unexpected.bin"));
    writeFileSync(join(publication.finalPayloadPath, "unexpected.bin"), "not receipted");
    expect(() => computeLocalPrunePlan({
      shareRoot: localChanged.share,
      sourceRoot: localChanged.source,
      collection: active,
      publicationReceiptPath: publication.publicationReceiptPath,
      restoreReceiptPath: restore.restoreReceiptPath,
    })).toThrow(/current published payload/u);
  });

  it("refuses a same-length publication-receipt mutation after the restore bound its digest", () => {
    const fixture = treeFixture("prune-receipt-mutation");
    const intent = intentCollection();
    const publication = publish(fixture, intent, "publication-receipt-mutation");
    const restoreParent = join(fixture.root, "restores");
    mkdirSync(restoreParent);
    const restore = restoreCollectionFixture({
      shareRoot: fixture.share,
      destinationPath: join(restoreParent, "target"),
      collection: intent,
      publicationReceiptPath: publication.publicationReceiptPath,
      transactionId: "restore-before-receipt-mutation",
    });
    const publicationReceiptAbsolute = join(fixture.share, publication.publicationReceiptPath);
    const original = readFileSync(publicationReceiptAbsolute, "utf8");
    const mutated = original.replace("2026-", "2025-");
    expect(Buffer.byteLength(mutated)).toBe(Buffer.byteLength(original));
    writeFileSync(publicationReceiptAbsolute, mutated);
    expect(readFileSync(publicationReceiptAbsolute, "utf8")).toBe(mutated);
    expect(() => computeLocalPrunePlan({
      shareRoot: fixture.share,
      sourceRoot: fixture.source,
      collection: activeCollection(intent, publication),
      publicationReceiptPath: publication.publicationReceiptPath,
      restoreReceiptPath: restore.restoreReceiptPath,
    })).toThrow(/not bound to the selected verified publication receipt/u);
    expect(readFileSync(join(fixture.source, "root.bin"), "utf8")).toBe("root bytes");
  });

  it("refuses a byte-identical restore receipt copied to a noncanonical path", () => {
    const fixture = treeFixture("prune-noncanonical-restore-receipt");
    const intent = intentCollection();
    const publication = publish(fixture, intent, "publication-before-copied-restore-receipt");
    const restoreParent = join(fixture.root, "restores");
    mkdirSync(restoreParent);
    const restore = restoreCollectionFixture({
      shareRoot: fixture.share,
      destinationPath: join(restoreParent, "target"),
      collection: intent,
      publicationReceiptPath: publication.publicationReceiptPath,
      transactionId: "canonical-restore",
    });
    const copiedRelative = "_control/receipts/restore/fixture-generated/v1/copied.json";
    writeFileSync(
      join(fixture.share, copiedRelative),
      readFileSync(join(fixture.share, restore.restoreReceiptPath)),
    );
    expect(() => computeLocalPrunePlan({
      shareRoot: fixture.share,
      sourceRoot: fixture.source,
      collection: activeCollection(intent, publication),
      publicationReceiptPath: publication.publicationReceiptPath,
      restoreReceiptPath: copiedRelative,
    })).toThrow(/canonical transaction path/u);
    expect(readFileSync(join(fixture.source, "root.bin"), "utf8")).toBe("root bytes");
  });

  it("applies conservative class and backup gates", () => {
    const fixture = treeFixture("prune-class-gates");
    const intent = intentCollection();
    const publication = publish(fixture, intent, "publication-class-gates");
    const restoreParent = join(fixture.root, "restores");
    mkdirSync(restoreParent);
    const restore = restoreCollectionFixture({
      shareRoot: fixture.share,
      destinationPath: join(restoreParent, "target"),
      collection: intent,
      publicationReceiptPath: publication.publicationReceiptPath,
      transactionId: "restore-class-gates",
    });
    const base = activeCollection(intent, publication);
    const compute = (collection: NasAssetCollectionV1): void => {
      computeLocalPrunePlan({
        shareRoot: fixture.share,
        sourceRoot: fixture.source,
        collection,
        publicationReceiptPath: publication.publicationReceiptPath,
        restoreReceiptPath: restore.restoreReceiptPath,
      });
    };
    expect(() => compute({ ...base, storageClass: "tracked-evidence" })).toThrow(/never receive/u);
    expect(() => compute({ ...base, storageClass: "scratch" })).toThrow(/never receive/u);
    expect(() => compute({
      ...base,
      reproducibility: { kind: "unknown", record: null },
    })).toThrow(/exact regeneration recipe/u);
    expect(() => compute({
      ...base,
      storageClass: "external-evidence",
      backup: {
        status: "verified",
        independentDomains: ["independent-object-store"],
        receipts: ["docs/nas-assets/receipts/external-backup.json"],
      },
    })).toThrow(/claim-specific restore verifier/u);
    for (const storageClass of ["private-source", "irreplaceable-master"] as const) {
      expect(() => compute({
        ...base,
        storageClass,
        backup: { status: "required-missing", independentDomains: [], receipts: [] },
      })).toThrow(/verified independent-domain backup/u);
    }
    expect(() => compute({
      ...base,
      storageClass: "private-source",
      backup: {
        status: "verified",
        independentDomains: ["independent-object-store"],
        receipts: ["docs/nas-assets/receipts/private-backup.json"],
      },
    })).not.toThrow();
  });

  it("refuses a grandfathered locator even when supplied otherwise valid receipts", () => {
    const fixture = treeFixture("prune-grandfathered");
    const intent = intentCollection();
    const publication = publish(fixture, intent, "publication-grandfathered-control");
    const restoreParent = join(fixture.root, "restores");
    mkdirSync(restoreParent);
    const restore = restoreCollectionFixture({
      shareRoot: fixture.share,
      destinationPath: join(restoreParent, "target"),
      collection: intent,
      publicationReceiptPath: publication.publicationReceiptPath,
      transactionId: "restore-grandfathered-control",
    });
    const grandfathered = activeCollection(intent, publication, { locator: "out/legacy/generated" });
    expect(() => computeLocalPrunePlan({
      shareRoot: fixture.share,
      sourceRoot: fixture.source,
      collection: grandfathered,
      publicationReceiptPath: publication.publicationReceiptPath,
      restoreReceiptPath: restore.restoreReceiptPath,
    })).toThrow(/grandfathered/u);
  });
});

describe("no-replace JSON primitive", () => {
  it("never overwrites an existing transaction document", () => {
    const root = fixtureRoot("json-no-replace");
    const target = join(root, "receipt.json");
    const first = writeTransactionJsonNoReplace(target, { format: "fixture-v1", value: 1 });
    expect(first.sha256).toMatch(/^[0-9a-f]{64}$/u);
    expect(() => writeTransactionJsonNoReplace(target, { format: "fixture-v1", value: 2 })).toThrow(/already exists|EEXIST/u);
    expect(JSON.parse(readFileSync(target, "utf8"))).toEqual({ format: "fixture-v1", value: 1 });
  });
});
