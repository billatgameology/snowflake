import { createHash } from "node:crypto";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  PHASE10_C0V_S6_PACKET_IDS,
  PHASE10_C0V_S6_RECOVERY_V2_GOVERNED_ABSENT_PATHS,
  PHASE10_C0V_S6_RECOVERY_V2_PREDECESSOR_ATTEMPT_ARTIFACTS,
  PHASE10_C0V_S6_RECOVERY_V2_PREDECESSOR_LOCK_ARTIFACTS,
  PHASE10_C0V_S6_RECOVERY_V2_PREDECESSOR_PUBLISHED_ARTIFACTS,
  PHASE10_C0V_S6_RECOVERY_V3_GOVERNED_ABSENT_PATHS,
  PHASE10_C0V_S6_RECOVERY_V3_PREDECESSOR_ATTEMPT_ARTIFACTS,
  PHASE10_C0V_S6_RECOVERY_V3_PREDECESSOR_LOCK_ARTIFACTS,
  PHASE10_C0V_S6_RECOVERY_V3_PREDECESSOR_PUBLISHED_ARTIFACTS,
  PHASE10_C0V_S6_RECOVERY_V4_GOVERNED_ABSENT_PATHS,
  PHASE10_C0V_S6_RECOVERY_V4_PREDECESSOR_ATTEMPT_ARTIFACTS,
  PHASE10_C0V_S6_RECOVERY_V4_PREDECESSOR_LOCK_ARTIFACTS,
  PHASE10_C0V_S6_RECOVERY_V4_PREDECESSOR_PUBLISHED_ARTIFACTS,
  PHASE10_C0V_S6_RECOVERY_V5_GOVERNED_ABSENT_PATHS,
  PHASE10_C0V_S6_RECOVERY_V5_PREDECESSOR_ATTEMPT_ARTIFACTS,
  PHASE10_C0V_S6_RECOVERY_V5_PREDECESSOR_LOCK_ARTIFACTS,
  PHASE10_C0V_S6_RECOVERY_V5_PREDECESSOR_PUBLISHED_ARTIFACTS,
  PHASE10_C0V_S6_RECOVERY_V6_ACCEPTED_AP_ARTIFACTS,
  PHASE10_C0V_S6_RECOVERY_V6_GOVERNED_ABSENT_PATHS,
  PHASE10_C0V_S6_RECOVERY_V6_PACKAGE_STORAGE_BASELINE,
  PHASE10_C0V_S6_RECOVERY_V6_PREDECESSOR_ATTEMPT_ARTIFACTS,
  PHASE10_C0V_S6_RECOVERY_V6_PREDECESSOR_LOCK_ARTIFACTS,
  PHASE10_C0V_S6_RECOVERY_V6_PREDECESSOR_PUBLISHED_ARTIFACTS,
  assertPhase10C0VS6ArtifactSchemaRegistryMatrixParity,
  parsePhase10C0VS6ArtifactSchemaRegistry,
  parsePhase10C0VS6CallableRegistry,
  parsePhase10C0VS6Matrix,
  parsePhase10C0VS6PacketCatalogue,
  parsePhase10C0VS6PacketProtocol,
  parsePhase10C0VS6PrettyJsonBytes,
  parsePhase10C0VS6RecoveryAuthority,
  parsePhase10C0VS6RecoveryV2Authority,
  parsePhase10C0VS6RecoveryV3Authority,
  parsePhase10C0VS6RecoveryV4Authority,
  parsePhase10C0VS6RecoveryV5Authority,
  parsePhase10C0VS6RecoveryV6Authority,
} from "../src/phase10-c0v-s6-contracts.ts";
import {
  independentlyReprovePhase10C0VS6ApNegativeControl,
  independentlyVerifyPhase10C0VS6ApArtifacts,
} from "../src/phase10-c0v-s6-ap-independent.ts";
import {
  runPhase10C0VS6MissingProducerControl,
  runPhase10C0VS6UncalledCheckControl,
} from "../src/phase10-c0v-s6-ap-negative-controls.ts";
import { producePhase10C0VS6ApArtifacts, verifyPhase10C0VS6ApArtifacts } from "../src/phase10-c0v-s6-ap.ts";
import {
  phase10C0VS6ArtifactIdentity,
} from "../src/phase10-c0v-s6-execution-contracts.ts";
import {
  phase10C0VS6AssertRuntimeEntrypointRegistration,
} from "../src/phase10-c0v-s6-import-audit.ts";

const ROOT = resolve(import.meta.dirname, "../..");
const AUTHORITY_PATHS = Object.freeze([
  "research/phase10-c0v-s6-obligation-matrix-v1.json",
  "research/phase10-c0v-s6-schema-contracts-v1.json",
  "research/phase10-c0v-s6-artifact-schema-registry-v1.json",
  "research/phase10-execution-v2/README.md",
  "research/phase10-execution-v2/recovery-v1/recovery-authority.json",
  "research/phase10-execution-v2/recovery-v1/packet-catalogue.json",
  ...PHASE10_C0V_S6_PACKET_IDS.flatMap((packetId) => [
    `research/phase10-execution-v2/recovery-v1/packets/${packetId}/protocol.json`,
    `research/phase10-execution-v2/recovery-v1/packets/${packetId}/callable-registry.json`,
  ]),
  "research/phase10-execution-v2/recovery-v2/recovery-authority.json",
  "research/phase10-execution-v2/recovery-v2/packet-catalogue.json",
  ...PHASE10_C0V_S6_PACKET_IDS.flatMap((packetId) => [
    `research/phase10-execution-v2/recovery-v2/packets/${packetId}/protocol.json`,
    `research/phase10-execution-v2/recovery-v2/packets/${packetId}/callable-registry.json`,
  ]),
  "research/phase10-execution-v2/recovery-v3/recovery-authority.json",
  "research/phase10-execution-v2/recovery-v3/packet-catalogue.json",
  ...PHASE10_C0V_S6_PACKET_IDS.flatMap((packetId) => [
    `research/phase10-execution-v2/recovery-v3/packets/${packetId}/protocol.json`,
    `research/phase10-execution-v2/recovery-v3/packets/${packetId}/callable-registry.json`,
  ]),
  "research/phase10-execution-v2/recovery-v4/recovery-authority.json",
  "research/phase10-execution-v2/recovery-v4/packet-catalogue.json",
  ...PHASE10_C0V_S6_PACKET_IDS.flatMap((packetId) => [
    `research/phase10-execution-v2/recovery-v4/packets/${packetId}/protocol.json`,
    `research/phase10-execution-v2/recovery-v4/packets/${packetId}/callable-registry.json`,
  ]),
  "research/phase10-execution-v2/recovery-v5/recovery-authority.json",
  "research/phase10-execution-v2/recovery-v5/packet-catalogue.json",
  ...PHASE10_C0V_S6_PACKET_IDS.flatMap((packetId) => [
    `research/phase10-execution-v2/recovery-v5/packets/${packetId}/protocol.json`,
    `research/phase10-execution-v2/recovery-v5/packets/${packetId}/callable-registry.json`,
  ]),
  "research/phase10-execution-v2/recovery-v6/recovery-authority.json",
  "research/phase10-execution-v2/recovery-v6/packet-catalogue.json",
  ...PHASE10_C0V_S6_PACKET_IDS.flatMap((packetId) => [
    `research/phase10-execution-v2/recovery-v6/packets/${packetId}/protocol.json`,
    `research/phase10-execution-v2/recovery-v6/packets/${packetId}/callable-registry.json`,
  ]),
]);

function bytes(path: string): Buffer {
  return readFileSync(resolve(ROOT, path));
}

function json(path: string): unknown {
  return parsePhase10C0VS6PrettyJsonBytes(bytes(path), path);
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function sha256(value: Uint8Array): string {
  return createHash("sha256").update(value).digest("hex");
}

function canonicalBytes(value: unknown): Uint8Array {
  return new TextEncoder().encode(`${JSON.stringify(value, null, 2)}\n`);
}

interface MutableWitness {
  byteLength: number;
  sha256: string;
  semanticFingerprint: {
    projection: unknown;
    sha256: string;
  };
}

function mutableObject(value: unknown): Record<string, unknown> {
  if (value === null || Array.isArray(value) || typeof value !== "object") {
    throw new Error("expected mutable object");
  }
  return value as Record<string, unknown>;
}

function rehashWitness(witness: MutableWitness): void {
  const encoded = canonicalBytes(witness.semanticFingerprint.projection);
  witness.byteLength = encoded.byteLength;
  witness.sha256 = sha256(encoded);
  witness.semanticFingerprint.sha256 = sha256(encoded);
}

describe("Phase 10 C0V S6 execution-v2 authority", () => {
  it("binds recovery-v1 to the exact predecessor catalogue and A-P protocol at commit 27ca", () => {
    const recovery = parsePhase10C0VS6RecoveryAuthority(json(
      "research/phase10-execution-v2/recovery-v1/recovery-authority.json",
    ));
    expect(recovery.predecessorImplementationFreezeCommit)
      .toBe("27ca0dea801be026f6b3729d5d898a8856c42722");
    for (const identity of [recovery.predecessorPacketCatalogue, recovery.predecessorApProtocol]) {
      const frozenBytes = execFileSync(
        "git",
        ["show", `${recovery.predecessorImplementationFreezeCommit}:${identity.path}`],
        { cwd: ROOT, windowsHide: true },
      );
      expect(bytes(identity.path), identity.path).toEqual(frozenBytes);
      expect(phase10C0VS6ArtifactIdentity(identity.path, frozenBytes), identity.path).toEqual(identity);
    }
    expect(recovery.successor.authorizedAttempts).toEqual([{
      packetId: "a-p-c0v-s6",
      predecessorAttemptId: "a-p-c0v-s6-20260822-v1",
      successorAttemptId: "a-p-c0v-s6-20260822-v2",
    }]);
  });

  it("binds recovery-v2 to the exact recovery-v1 stop and authorizes only A-P v3", () => {
    const recovery = parsePhase10C0VS6RecoveryV2Authority(json(
      "research/phase10-execution-v2/recovery-v2/recovery-authority.json",
    ));
    expect(recovery.predecessorImplementationFreezeCommit)
      .toBe("df24330f878bda8b73e58875127736ee1a21684d");
    for (const identity of [
      recovery.predecessorRecoveryAuthority,
      recovery.predecessorPacketCatalogue,
      recovery.predecessorApProtocol,
    ]) {
      const frozenBytes = execFileSync(
        "git",
        ["show", `${recovery.predecessorImplementationFreezeCommit}:${identity.path}`],
        { cwd: ROOT, windowsHide: true },
      );
      expect(bytes(identity.path), identity.path).toEqual(frozenBytes);
      expect(phase10C0VS6ArtifactIdentity(identity.path, frozenBytes), identity.path).toEqual(identity);
    }
    expect(recovery.predecessorLockArtifacts).toEqual(
      PHASE10_C0V_S6_RECOVERY_V2_PREDECESSOR_LOCK_ARTIFACTS,
    );
    expect(recovery.predecessorAttemptArtifacts).toEqual(
      PHASE10_C0V_S6_RECOVERY_V2_PREDECESSOR_ATTEMPT_ARTIFACTS,
    );
    expect(recovery.predecessorPublishedArtifacts).toEqual(
      PHASE10_C0V_S6_RECOVERY_V2_PREDECESSOR_PUBLISHED_ARTIFACTS,
    );
    expect(recovery.predecessorGovernedAbsentPaths).toEqual(
      PHASE10_C0V_S6_RECOVERY_V2_GOVERNED_ABSENT_PATHS,
    );
    expect(recovery).toMatchObject({
      retainedBytes: 64_316,
      observedWorkerProcessCount: 1,
      observedWorkerLifetimeNanoseconds: 384_945_300,
      creditedGovernedInvocationCount: 0,
      creditedGovernedProcessHours: 0,
    });
    expect(recovery.successor.authorizedAttempts).toEqual([{
      packetId: "a-p-c0v-s6",
      predecessorAttemptId: "a-p-c0v-s6-20260822-v2",
      successorAttemptId: "a-p-c0v-s6-20260822-v3",
    }]);
  });

  it("binds recovery-v3 to the exact recovery-v2 stop and authorizes only A-P v4", () => {
    const recovery = parsePhase10C0VS6RecoveryV3Authority(json(
      "research/phase10-execution-v2/recovery-v3/recovery-authority.json",
    ));
    expect(recovery.predecessorImplementationFreezeCommit)
      .toBe("d670494b863484f6130d09915ce7ecae64b0d867");
    for (const identity of [
      recovery.predecessorRecoveryAuthority,
      recovery.predecessorPacketCatalogue,
      recovery.predecessorApProtocol,
    ]) {
      const frozenBytes = execFileSync(
        "git",
        ["show", `${recovery.predecessorImplementationFreezeCommit}:${identity.path}`],
        { cwd: ROOT, windowsHide: true },
      );
      expect(bytes(identity.path), identity.path).toEqual(frozenBytes);
      expect(phase10C0VS6ArtifactIdentity(identity.path, frozenBytes), identity.path).toEqual(identity);
    }
    expect(recovery.predecessorLockArtifacts).toEqual(
      PHASE10_C0V_S6_RECOVERY_V3_PREDECESSOR_LOCK_ARTIFACTS,
    );
    expect(recovery.predecessorAttemptArtifacts).toEqual(
      PHASE10_C0V_S6_RECOVERY_V3_PREDECESSOR_ATTEMPT_ARTIFACTS,
    );
    expect(recovery.predecessorPublishedArtifacts).toEqual(
      PHASE10_C0V_S6_RECOVERY_V3_PREDECESSOR_PUBLISHED_ARTIFACTS,
    );
    expect(recovery.predecessorGovernedAbsentPaths).toEqual(
      PHASE10_C0V_S6_RECOVERY_V3_GOVERNED_ABSENT_PATHS,
    );
    expect(recovery).toMatchObject({
      retainedBytes: 493_488,
      observedWorkerProcessCount: 1,
      observedWorkerLifetimeNanoseconds: 125_776_629_700,
      creditedGovernedInvocationCount: 4,
      creditedGovernedElapsedNanoseconds: 125_289_842_000,
      creditedGovernedProcessHours: 0.0348027338888889,
    });
    expect(recovery.predecessorLockArtifacts).toHaveLength(6);
    expect(recovery.predecessorAttemptArtifacts).toHaveLength(13);
    expect(recovery.predecessorPublishedArtifacts).toHaveLength(2);
    expect(recovery.predecessorGovernedAbsentPaths).toHaveLength(35);
    expect(recovery.successor.authorizedAttempts).toEqual([{
      packetId: "a-p-c0v-s6",
      predecessorAttemptId: "a-p-c0v-s6-20260822-v3",
      successorAttemptId: "a-p-c0v-s6-20260822-v4",
    }]);
  });

  it("binds recovery-v4 to the exact recovery-v3 stop and authorizes only A-P v5", () => {
    const recovery = parsePhase10C0VS6RecoveryV4Authority(json(
      "research/phase10-execution-v2/recovery-v4/recovery-authority.json",
    ));
    expect(recovery.predecessorImplementationFreezeCommit)
      .toBe("4286c613df99f3d4c83652a008db5cde2f8a22e8");
    for (const identity of [
      recovery.predecessorRecoveryAuthority,
      recovery.predecessorPacketCatalogue,
      recovery.predecessorApProtocol,
    ]) {
      const frozenBytes = execFileSync(
        "git",
        ["show", `${recovery.predecessorImplementationFreezeCommit}:${identity.path}`],
        { cwd: ROOT, windowsHide: true },
      );
      expect(bytes(identity.path), identity.path).toEqual(frozenBytes);
      expect(phase10C0VS6ArtifactIdentity(identity.path, frozenBytes), identity.path).toEqual(identity);
    }
    expect(recovery.predecessorLockArtifacts).toEqual(
      PHASE10_C0V_S6_RECOVERY_V4_PREDECESSOR_LOCK_ARTIFACTS,
    );
    expect(recovery.predecessorAttemptArtifacts).toEqual(
      PHASE10_C0V_S6_RECOVERY_V4_PREDECESSOR_ATTEMPT_ARTIFACTS,
    );
    expect(recovery.predecessorPublishedArtifacts).toEqual(
      PHASE10_C0V_S6_RECOVERY_V4_PREDECESSOR_PUBLISHED_ARTIFACTS,
    );
    expect(recovery.predecessorGovernedAbsentPaths).toEqual(
      PHASE10_C0V_S6_RECOVERY_V4_GOVERNED_ABSENT_PATHS,
    );
    expect(recovery).toMatchObject({
      retainedBytes: 927_001,
      observedWorkerProcessCount: 1,
      observedWorkerLifetimeNanoseconds: 132_474_672_300,
      creditedGovernedInvocationCount: 4,
      creditedGovernedElapsedNanoseconds: 131_997_897_300,
      creditedGovernedProcessHours: 0.036666082583333336,
    });
    expect(recovery.predecessorLockArtifacts).toHaveLength(8);
    expect(recovery.predecessorAttemptArtifacts).toHaveLength(21);
    expect(recovery.predecessorPublishedArtifacts).toHaveLength(3);
    expect(recovery.predecessorGovernedAbsentPaths).toHaveLength(46);
    expect(recovery.successor.authorizedAttempts).toEqual([{
      packetId: "a-p-c0v-s6",
      predecessorAttemptId: "a-p-c0v-s6-20260822-v4",
      successorAttemptId: "a-p-c0v-s6-20260822-v5",
    }]);
  });

  it("binds recovery-v5 to the exact recovery-v4 stop and authorizes only A-P v6", () => {
    const recovery = parsePhase10C0VS6RecoveryV5Authority(json(
      "research/phase10-execution-v2/recovery-v5/recovery-authority.json",
    ));
    expect(recovery.predecessorImplementationFreezeCommit)
      .toBe("7ff83eaf9312ebc3bf23d6f5ef5a56d6f65a912a");
    for (const identity of [
      recovery.predecessorRecoveryAuthority,
      recovery.predecessorPacketCatalogue,
      recovery.predecessorApProtocol,
    ]) {
      const frozenBytes = execFileSync(
        "git",
        ["show", `${recovery.predecessorImplementationFreezeCommit}:${identity.path}`],
        { cwd: ROOT, windowsHide: true },
      );
      expect(bytes(identity.path), identity.path).toEqual(frozenBytes);
      expect(phase10C0VS6ArtifactIdentity(identity.path, frozenBytes), identity.path).toEqual(identity);
    }
    expect(recovery.predecessorLockArtifacts).toEqual(
      PHASE10_C0V_S6_RECOVERY_V5_PREDECESSOR_LOCK_ARTIFACTS,
    );
    expect(recovery.predecessorAttemptArtifacts).toEqual(
      PHASE10_C0V_S6_RECOVERY_V5_PREDECESSOR_ATTEMPT_ARTIFACTS,
    );
    expect(recovery.predecessorPublishedArtifacts).toEqual(
      PHASE10_C0V_S6_RECOVERY_V5_PREDECESSOR_PUBLISHED_ARTIFACTS,
    );
    expect(recovery.predecessorGovernedAbsentPaths).toEqual(
      PHASE10_C0V_S6_RECOVERY_V5_GOVERNED_ABSENT_PATHS,
    );
    expect(recovery).toMatchObject({
      retainedBytes: 1_364_810,
      observedWorkerProcessCount: 1,
      observedWorkerLifetimeNanoseconds: 134_346_732_400,
      creditedGovernedInvocationCount: 4,
      creditedGovernedElapsedNanoseconds: 133_870_512_700,
      creditedGovernedProcessHours: 0.037186253527777775,
    });
    expect(recovery.predecessorLockArtifacts).toHaveLength(10);
    expect(recovery.predecessorAttemptArtifacts).toHaveLength(29);
    expect(recovery.predecessorPublishedArtifacts).toHaveLength(4);
    expect(recovery.predecessorGovernedAbsentPaths).toHaveLength(57);
    expect(recovery.successor.authorizedAttempts).toEqual([{
      packetId: "a-p-c0v-s6",
      predecessorAttemptId: "a-p-c0v-s6-20260822-v5",
      successorAttemptId: "a-p-c0v-s6-20260822-v6",
    }]);
  });

  it("binds recovery-v6 to the accepted A-P checkpoint and authorizes only moving-produce v2", () => {
    const recovery = parsePhase10C0VS6RecoveryV6Authority(json(
      "research/phase10-execution-v2/recovery-v6/recovery-authority.json",
    ));
    expect(recovery.predecessorImplementationFreezeCommit)
      .toBe("d47b80373b1fec5ecc79d349046cfbf2a28fa58e");
    expect(recovery.predecessorAcceptedPacketCommit)
      .toBe("e092259b8d4c3099b569febc08944bf99bfef31a");
    for (const identity of [
      recovery.predecessorRecoveryAuthority,
      recovery.predecessorPacketCatalogue,
      recovery.predecessorApProtocol,
      recovery.predecessorAuthorizedPacketProtocol,
    ]) {
      const frozenBytes = execFileSync(
        "git",
        ["show", `${recovery.predecessorImplementationFreezeCommit}:${identity.path}`],
        { cwd: ROOT, windowsHide: true },
      );
      expect(bytes(identity.path), identity.path).toEqual(frozenBytes);
      expect(phase10C0VS6ArtifactIdentity(identity.path, frozenBytes), identity.path).toEqual(identity);
    }
    expect(recovery.predecessorLockArtifacts).toEqual(
      PHASE10_C0V_S6_RECOVERY_V6_PREDECESSOR_LOCK_ARTIFACTS,
    );
    expect(recovery.predecessorAttemptArtifacts).toEqual(
      PHASE10_C0V_S6_RECOVERY_V6_PREDECESSOR_ATTEMPT_ARTIFACTS,
    );
    expect(recovery.predecessorPublishedArtifacts).toEqual(
      PHASE10_C0V_S6_RECOVERY_V6_PREDECESSOR_PUBLISHED_ARTIFACTS,
    );
    expect(recovery.predecessorGovernedAbsentPaths).toEqual(
      PHASE10_C0V_S6_RECOVERY_V6_GOVERNED_ABSENT_PATHS,
    );
    expect(recovery).toMatchObject({
      retainedBytes: 2_002_925,
      observedWorkerProcessCount: 0,
      observedWorkerLifetimeNanoseconds: 0,
      creditedGovernedInvocationCount: 0,
      creditedGovernedElapsedNanoseconds: 0,
      creditedGovernedProcessHours: 0,
    });
    expect(recovery.predecessorLockArtifacts).toHaveLength(12);
    expect(recovery.predecessorAttemptArtifacts).toHaveLength(38);
    expect(recovery.predecessorPublishedArtifacts).toHaveLength(10);
    expect(recovery.predecessorGovernedAbsentPaths).toHaveLength(64);
    expect(PHASE10_C0V_S6_RECOVERY_V6_PACKAGE_STORAGE_BASELINE).toHaveLength(57);
    expect(PHASE10_C0V_S6_RECOVERY_V6_ACCEPTED_AP_ARTIFACTS).toHaveLength(15);
    expect(recovery.successor.authorizedAttempts).toEqual([{
      packetId: "c0v-moving-produce",
      predecessorAttemptId: "c0v-moving-produce-20260822-v1",
      successorAttemptId: "c0v-moving-produce-20260822-v2",
    }]);
  });

  it("independently closes all ten supplemental A-P graph checks", () => {
    const missing = runPhase10C0VS6MissingProducerControl({ repositoryRoot: ROOT });
    const uncalled = runPhase10C0VS6UncalledCheckControl({ repositoryRoot: ROOT });
    const negativeControlReceiptBytes = {
      missingProducer: canonicalBytes(missing),
      uncalledCheck: canonicalBytes(uncalled),
    } as const;
    const callerResult = verifyPhase10C0VS6ApArtifacts({ repositoryRoot: ROOT, negativeControlReceiptBytes });
    const evaluation = callerResult.evaluation;
    expect(evaluation.errors, evaluation.errors.join("\n")).toEqual([]);
    expect(evaluation.aggregateVerdict).toBe("pass");
    expect(evaluation.checkResults).toHaveLength(10);
    expect(evaluation.negativeControlReproofs.map((entry) => entry.verdict)).toEqual(["pass", "pass"]);
    expect(evaluation.checkResults.every((entry) => entry.verdict === "pass")).toBe(true);
    expect(callerResult.callerCallableId).toBe("phase10-a-p-c0v-s6-check-caller");
    expect(callerResult.evaluatorCallableId).toBe("phase10-a-p-c0v-s6-evaluator");
    expect(callerResult.executedCheckIds).toEqual(callerResult.evaluatedCheckIds);
    expect(callerResult.executedNegativeControlIds).toEqual([
      "nc-ap-c0v-s6-missing-producer",
      "nc-ap-c0v-s6-uncalled-check",
    ]);
    const produced = producePhase10C0VS6ApArtifacts({ repositoryRoot: ROOT, negativeControlReceiptBytes });
    expect(produced.artifactIndex.artifacts.some((entry) =>
      entry.artifactId === "out-ap-c0v-s6-missing-producer")).toBe(true);
    expect(produced.artifactIndex.artifacts.some((entry) =>
      entry.artifactId === "out-ap-c0v-s6-uncalled-check")).toBe(true);
  }, 300_000);

  it("rejects an aliased repository root at every supplemental A-P public entry point", () => {
    const missing = runPhase10C0VS6MissingProducerControl({ repositoryRoot: ROOT });
    const uncalled = runPhase10C0VS6UncalledCheckControl({ repositoryRoot: ROOT });
    const negativeControlReceiptBytes = {
      missingProducer: canonicalBytes(missing),
      uncalledCheck: canonicalBytes(uncalled),
    } as const;
    const temporary = mkdtempSync(join(tmpdir(), "phase10-c0v-s6-ap-alias-"));
    const alias = join(temporary, "repo-alias");
    try {
      symlinkSync(ROOT, alias, process.platform === "win32" ? "junction" : "dir");
      expect(() => runPhase10C0VS6MissingProducerControl({ repositoryRoot: alias }))
        .toThrow(/unalias/u);
      expect(() => producePhase10C0VS6ApArtifacts({
        repositoryRoot: alias,
        negativeControlReceiptBytes,
      })).toThrow(/unalias/u);
      expect(() => independentlyVerifyPhase10C0VS6ApArtifacts({
        repositoryRoot: alias,
        negativeControlReceiptBytes,
      })).toThrow(/unalias/u);
    } finally {
      rmSync(temporary, { recursive: true, force: true });
    }
  });

  it("executes the split missing-producer and uncalled-check mutations non-vacuously", () => {
    const missing = runPhase10C0VS6MissingProducerControl({ repositoryRoot: ROOT });
    const uncalled = runPhase10C0VS6UncalledCheckControl({ repositoryRoot: ROOT });
    expect(missing.refused).toBe(true);
    expect(missing.error.refusalClass).toBe("missing-producer");
    expect(missing.beforeWitness.sha256).not.toBe(missing.afterWitness.sha256);
    expect(uncalled.refused).toBe(true);
    expect(uncalled.error.refusalClass).toBe("uncalled-check");
    expect(uncalled.beforeWitness.semanticFingerprint.sha256)
      .not.toBe(uncalled.afterWitness.semanticFingerprint.sha256);
    expect(independentlyReprovePhase10C0VS6ApNegativeControl(ROOT, canonicalBytes(missing)).verdict).toBe("pass");
    expect(independentlyReprovePhase10C0VS6ApNegativeControl(ROOT, canonicalBytes(uncalled)).verdict).toBe("pass");

    const forgedMessage = clone(missing) as unknown as {
      error: { refusalClass: string; message: string };
    };
    forgedMessage.error = {
      refusalClass: forgedMessage.error.refusalClass,
      message: "mutator-authored acceptance",
    };
    expect(() => independentlyReprovePhase10C0VS6ApNegativeControl(
      ROOT,
      canonicalBytes(forgedMessage),
    )).toThrow(/owner-check refusal differs/u);

    const wrongMutation = clone(missing) as unknown as {
      beforeWitness: MutableWitness;
      afterWitness: MutableWitness;
    };
    wrongMutation.afterWitness.semanticFingerprint.projection = clone(
      wrongMutation.beforeWitness.semanticFingerprint.projection,
    );
    const wrongRegistry = mutableObject(wrongMutation.afterWitness.semanticFingerprint.projection);
    if (!Array.isArray(wrongRegistry.callables)) throw new Error("callable roster absent");
    const wrongIndex = wrongRegistry.callables.findIndex((entry) =>
      mutableObject(entry).callableId === "phase10-c0v-radial-evaluator");
    if (wrongIndex < 0) throw new Error("wrong-mutation target absent");
    wrongRegistry.callables.splice(wrongIndex, 1);
    rehashWitness(wrongMutation.afterWitness);
    expect(() => independentlyReprovePhase10C0VS6ApNegativeControl(
      ROOT,
      canonicalBytes(wrongMutation),
    )).toThrow(/embedded mutation differs/u);

    expect(() => independentlyVerifyPhase10C0VS6ApArtifacts({
      repositoryRoot: ROOT,
      requireResolvedCallables: false,
      negativeControlReceiptBytes: {
        missingProducer: canonicalBytes(uncalled),
        uncalledCheck: canonicalBytes(missing),
      },
    })).toThrow(/roles are swapped/u);
  });

  it("strict-parses the canonical graph and registers every successor output schema once", () => {
    const matrix = parsePhase10C0VS6Matrix(json(
      "research/phase10-c0v-s6-obligation-matrix-v1.json",
    ));
    const catalogue = parsePhase10C0VS6PacketCatalogue(json(
      "research/phase10-execution-v2/recovery-v6/packet-catalogue.json",
    ));
    const recoveryAuthorityPath = "research/phase10-execution-v2/recovery-v6/recovery-authority.json";
    expect(catalogue.recoveryAuthority).toEqual(phase10C0VS6ArtifactIdentity(
      recoveryAuthorityPath,
      bytes(recoveryAuthorityPath),
    ));
    const schemaRegistry = parsePhase10C0VS6ArtifactSchemaRegistry(json(
      "research/phase10-c0v-s6-artifact-schema-registry-v1.json",
    ));
    assertPhase10C0VS6ArtifactSchemaRegistryMatrixParity(schemaRegistry, matrix);
    expect(schemaRegistry.schemas).toHaveLength(5);
    expect(schemaRegistry.schemas.flatMap((entry) => entry.outputBindings)).toHaveLength(28);
    expect(catalogue.packets.map((entry) => entry.packetId)).toEqual(PHASE10_C0V_S6_PACKET_IDS);
    expect(catalogue.runtimeEntrypoints).toEqual([
      {
        role: "parent-executor",
        modulePath: "runner/src/phase10-c0v-s6-executor.ts",
        exportName: "phase10C0VS6RunExecutor",
      },
      {
        role: "worker-dispatcher",
        modulePath: "runner/src/phase10-c0v-s6-executor-worker.ts",
        exportName: "phase10C0VS6ExecutorWorker",
      },
    ]);
    expect(catalogue.runtimeLoaderContract).toEqual({
      schema: "phase10-c0v-s6-runtime-loader-contract-v1",
      execArgvRule: "parent-and-worker-process-exec-argv-exact-empty-array",
      forbiddenEnvironmentKeyRule:
        "ascii-uppercase-equals-NODE-or-TS_NODE-or-starts-NODE_-or-TS_NODE_",
      exactWorkerEnvironment: [
        { key: "GIT_CONFIG_GLOBAL", value: "NUL" },
        { key: "GIT_CONFIG_NOSYSTEM", value: "1" },
        { key: "GIT_OPTIONAL_LOCKS", value: "0" },
        { key: "GIT_TERMINAL_PROMPT", value: "0" },
        { key: "HOMEDRIVE", value: "" },
        { key: "HOMEPATH", value: "" },
        { key: "LC_ALL", value: "C" },
        { key: "LOGONSERVER", value: "" },
        { key: "PATH", value: "C:\\Program Files\\Git\\cmd" },
        { key: "PATHEXT", value: ".COM;.EXE" },
        { key: "SYSTEMDRIVE", value: "" },
        { key: "SYSTEMROOT", value: "C:\\WINDOWS" },
        { key: "TEMP", value: "" },
        { key: "USERDOMAIN", value: "" },
        { key: "USERNAME", value: "" },
        { key: "USERPROFILE", value: "" },
        { key: "WINDIR", value: "" },
      ],
      workerEnvironmentRule:
        "parent-materializes-exact-clean-environment-worker-independently-exact-compares-complete-environment-no-ambient-clone",
      preflightRecordingRule: "frozen-code-rejection-no-ambient-environment-values-serialized",
      entryObservationScopeRule:
        "visible-at-entry-loader-state-enforced-deliberate-trace-erasure-outside-registered-threat-model",
    });
    const runtimeClosurePaths = new Set<string>();
    for (const entrypoint of catalogue.runtimeEntrypoints) {
      const moduleBytes = bytes(entrypoint.modulePath);
      const audit = phase10C0VS6AssertRuntimeEntrypointRegistration(ROOT, {
        ...entrypoint,
        identity: phase10C0VS6ArtifactIdentity(entrypoint.modulePath, moduleBytes),
      });
      for (const identity of audit.closure) runtimeClosurePaths.add(identity.path);
    }
    const runtimePaths = [...runtimeClosurePaths].sort();
    const runtimeAttributes = execFileSync("git", ["check-attr", "text", "--", ...runtimePaths], {
      cwd: ROOT,
      encoding: "utf8",
    });
    for (const path of runtimePaths) {
      expect(runtimeAttributes, path).toContain(`${path}: text: unset`);
      expect(bytes(path), `${path} contains checkout-dependent CR bytes`).not.toContain(13);
    }
    expect(catalogue.workerTransportContract).toMatchObject({
      transport: "blocking-fd0-command-fd1-message-canonical-compact-jsonl",
      maximumLineBytes: 33_554_432,
      maximumStderrBytes: 33_554_432,
      bytePayloadMarkerKey: "$phase10C0VS6Bytes",
      acknowledgementRule:
        "boundary-and-artifact-callback-return-only-after-exact-scoped-parent-acknowledgement",
      retainedAuthorityRule:
        "parent-synthesizes-all-retained-time-timing-terminal-fields-child-stdout-never-authoritative",
    });
    expect(matrix.outputs.find((entry) => entry.outputId === "out-ap-c0v-s6-missing-producer")
      ?.producerCallableId).toBe("phase10-nc-a-p-c0v-s6-missing-producer");
    expect(matrix.outputs.find((entry) => entry.outputId === "out-ap-c0v-s6-uncalled-check")
      ?.producerCallableId).toBe("phase10-nc-a-p-c0v-s6-uncalled-check");

    for (const packetId of PHASE10_C0V_S6_PACKET_IDS) {
      const protocol = parsePhase10C0VS6PacketProtocol(json(
        `research/phase10-execution-v2/recovery-v6/packets/${packetId}/protocol.json`,
      ));
      const cataloguePacket = catalogue.packets.find((entry) => entry.packetId === packetId)!;
      const registry = parsePhase10C0VS6CallableRegistry(json(
        `research/phase10-execution-v2/recovery-v6/packets/${packetId}/callable-registry.json`,
      ));
      expect(protocol.packetId).toBe(packetId);
      expect(registry.packetId).toBe(packetId);
      expect(protocol.bindings.recoveryAuthority).toEqual(catalogue.recoveryAuthority);
      expect(protocol.registeredAttemptId).toBe(
        packetId === "a-p-c0v-s6"
          ? "a-p-c0v-s6-20260822-v6"
          : packetId === "c0v-moving-produce"
            ? "c0v-moving-produce-20260822-v2"
          : `${packetId}-20260822-v1`,
      );
      expect(protocol.terminalSubroutes.every((entry) =>
        String(entry.dispositionCode) !== "retryable-infrastructure")).toBe(true);
      expect(protocol.executionRecordTuples.every((entry) =>
        String(entry.dispositionCode) !== "retryable-infrastructure")).toBe(true);
      expect(cataloguePacket.maximumStdoutBytes).toBe(4_194_304);
      expect(cataloguePacket.stdoutMessageByteBudget.derivedMaximumBytes)
        .toBeLessThanOrEqual(cataloguePacket.maximumStdoutBytes);
      if (packetId === "c0v-radial-produce") {
        expect(cataloguePacket.stdoutMessageByteBudget.boundaryOrProgressLineCountMaximum).toBe(28);
        expect(cataloguePacket.stdoutMessageByteBudget.derivedMaximumBytes).toBe(3_088_384);
      }
      expect(protocol.resources.projectedScratchBytes).toBe(
        cataloguePacket.maximumStdoutBytes +
        catalogue.workerTransportContract.maximumStderrBytes +
        cataloguePacket.maximumOtherAttemptRootBytes,
      );
      expect(protocol.ancestryAuthority.launchCleanObservationRule).toBe(
        "preflight-observes-empty-status-before-first-generated-write",
      );
      expect(protocol.ancestryAuthority.indexConcealmentRule).toBe(
        "git-ls-files-t-v-roster-equals-launch-head-and-every-tag-is-uppercase-H",
      );
      if (packetId === "a-p-c0v-s6") {
        expect(protocol.verificationInvocationRoster.map((entry) => entry.invocationId)).toEqual([
          "inv-a-p-c0v-s6-nc-missing-producer",
          "inv-a-p-c0v-s6-nc-uncalled-check",
          "inv-a-p-c0v-s6-producer",
          "inv-a-p-c0v-s6-check-caller",
        ]);
        expect(protocol.verificationInvocationRoster.at(-1)?.callableId).toBe(
          "phase10-a-p-c0v-s6-check-caller",
        );
      }
      const expectedVerificationOrder: Partial<Record<typeof packetId, readonly string[]>> = {
        "c0v-moving-publish": [
          "phase10-c0v-moving-publish-producer",
          "phase10-c0v-moving-publish-check-caller",
        ],
        "c0v-radial-publish": [
          "phase10-c0v-radial-publish-producer",
          "phase10-c0v-radial-publish-check-caller",
        ],
        "c0v-static-publish": [
          "phase10-c0v-static-publish-producer",
          "phase10-c0v-static-publish-check-caller",
        ],
        "c0v-aggregate": [
          "phase10-nc-c0v-any-layer-nonpass",
          "phase10-c0v-aggregate-producer",
          "phase10-c0v-aggregate-check-caller",
        ],
      };
      const expectedOrder = expectedVerificationOrder[packetId];
      if (expectedOrder !== undefined) {
        expect(protocol.verificationInvocationRoster.map((entry) => entry.callableId)).toEqual(expectedOrder);
      }
      if (packetId === "c0v-moving-produce" || packetId === "c0v-static-produce") {
        const capTupleId = packetId === "c0v-moving-produce" ? "moving-cap-cause" : "static-cap-cause";
        expect(protocol.executionRecordTuples.find((entry) => entry.tupleId === capTupleId)
          ?.record.checkCallerInvocationCount).toBe(5);
        const capCallerRows = protocol.terminalReceiptContract.callerInvocationResultRosters
          .find((entry) => entry.subrouteId === capTupleId)?.callerInvocationResults;
        expect(capCallerRows?.filter((entry) => entry.terminalState === "child-registered-cap"))
          .toHaveLength(1);
      }
      if (packetId === "c0v-radial-produce") {
        for (const capSubroute of protocol.terminalSubroutes.filter((entry) =>
          entry.dispositionCode === "registered-cap-resource-refusal")) {
          expect(capSubroute.requiredCheckIds).not.toContain("chk-c0v-radial-numeric");
          expect(capSubroute.requiredCheckIds).not.toContain("chk-c0v-radial-reference-independence");
          expect(capSubroute.requiredNegativeControlIds).toEqual([]);
          expect(protocol.terminalCandidateContract.decisionRosters.find((entry) =>
            entry.subrouteId === capSubroute.subrouteId)?.candidateExecutedNegativeControlIds).toEqual([]);
        }
      }
      if (packetId === "c0v-aggregate") {
        expect(protocol.aggregateNegativeControlContract?.filename).toBe("any-layer-nonpass-control.json");
        const aggregateInternal = new Map(protocol.internalArtifactRosters.map((entry) => [
          entry.rosterId,
          entry.relativePaths,
        ]));
        expect(aggregateInternal.get("c0v-aggregate-registered-cap-c0v-aggregate-nc-any-layer-nonpass"))
          .not.toContain("any-layer-nonpass-control.json");
        expect(aggregateInternal.get("c0v-aggregate-registered-cap-c0v-aggregate-producer"))
          .toContain("any-layer-nonpass-control.json");
        expect(registry.callables.find((entry) => entry.callableId === "phase10-c0v-aggregate-check-caller")
          ?.modulePath).toBe("runner/src/phase10-c0v-s6-aggregate-checks.ts");
      }
      for (const roster of protocol.classificationProjectionRosters) {
        for (const observation of roster.observations.filter((entry) => entry.kind === "wall-seconds")) {
          expect(observation.observedValueSource).toMatch(
            /^internal\.workerInvocations\.[a-z0-9-]+\.elapsedNanoseconds$/u,
          );
          expect(observation.observedValueDerivation).toBe(
            "elapsed-nanoseconds-divided-by-1000000000",
          );
          expect(observation.finalizedValueBinding).toMatch(
            /^(?:attempt\.executableInvocationRecords|terminalReceipt\.invocationRecords)\.[a-z0-9-]+\.wallSeconds$/u,
          );
        }
      }
    }
  });

  it("rejects forged caller-result authority and post-candidate credit in a terminal candidate", () => {
    const path = "research/phase10-execution-v2/recovery-v6/packets/c0v-moving-produce/protocol.json";
    const raw = json(path) as {
      terminalReceiptContract: {
        callerInvocationResultRosters: Array<{
          subrouteId: string;
          callerInvocationResults: Array<{
            callerInvocationId: string;
            sourceArtifactAuthorities: Array<{
              artifactRole: string;
              artifactRelativePath: string | null;
            }>;
          }>;
        }>;
      };
      terminalCandidateContract: {
        decisionRosters: Array<{
          subrouteId: string;
          candidateCallerInvocationIds: string[];
        }>;
      };
    };
    const missing = clone(raw);
    missing.terminalReceiptContract.callerInvocationResultRosters[0]!
      .callerInvocationResults.splice(1, 1);
    expect(() => parsePhase10C0VS6PacketProtocol(missing)).toThrow(/caller count differs/u);

    const wrongSource = clone(raw);
    wrongSource.terminalReceiptContract.callerInvocationResultRosters[0]!
      .callerInvocationResults[0]!.sourceArtifactAuthorities[0]!.artifactRole =
        "internal:worker-invocations.jsonl";
    expect(() => parsePhase10C0VS6PacketProtocol(wrongSource)).toThrow(/result-source authority/u);

    const postCandidateCredit = clone(raw);
    const roster = postCandidateCredit.terminalReceiptContract.callerInvocationResultRosters[0]!;
    const candidate = postCandidateCredit.terminalCandidateContract.decisionRosters[0]!;
    candidate.candidateCallerInvocationIds.push(roster.callerInvocationResults.at(-1)!.callerInvocationId);
    expect(() => parsePhase10C0VS6PacketProtocol(postCandidateCredit))
      .toThrow(/pre-candidate caller-result subsequence/u);
  });

  it("rejects completed negative-control credit on a radial capped-control prefix", () => {
    const path = "research/phase10-execution-v2/recovery-v6/packets/c0v-radial-produce/protocol.json";
    const raw = json(path) as {
      terminalSubroutes: Array<{
        subrouteId: string;
        requiredNegativeControlIds: string[];
        forbiddenNegativeControlIds: string[];
      }>;
      terminalCandidateContract: {
        decisionRosters: Array<{
          subrouteId: string;
          candidateExecutedNegativeControlIds: string[];
        }>;
      };
    };
    const forged = clone(raw);
    const subroute = forged.terminalSubroutes.find((entry) =>
      entry.subrouteId === "radial-cap-nc-forged-summary")!;
    subroute.requiredNegativeControlIds = ["nc-radial-finite-shell-term"];
    subroute.forbiddenNegativeControlIds = subroute.forbiddenNegativeControlIds.filter((entry) =>
      entry !== "nc-radial-finite-shell-term");
    forged.terminalCandidateContract.decisionRosters.find((entry) =>
      entry.subrouteId === subroute.subrouteId)!.candidateExecutedNegativeControlIds = [
      "nc-radial-finite-shell-term",
    ];
    expect(() => parsePhase10C0VS6PacketProtocol(forged))
      .toThrow(/completed negative-control credit only after the full production campaign/u);
  });

  it("binds the live successor schema bytes from both registry and matrix", () => {
    const rawMatrix = json("research/phase10-c0v-s6-obligation-matrix-v1.json") as {
      bindings: Record<string, { path: string; byteLength: number; sha256: string }>;
    };
    for (const bindingName of ["successorSchemaRegistry", "successorSchemaContracts"] as const) {
      const identity = rawMatrix.bindings[bindingName]!;
      const artifact = bytes(identity.path);
      expect(identity.byteLength).toBe(artifact.byteLength);
      expect(identity.sha256).toBe(sha256(artifact));
    }
  });

  it("rejects omitted schema bindings and cross-packet catalogue paths", () => {
    const rawRegistry = json("research/phase10-c0v-s6-artifact-schema-registry-v1.json") as {
      schemas: Array<{ outputBindings: unknown[] }>;
    };
    const omitted = clone(rawRegistry);
    omitted.schemas[0]!.outputBindings.pop();
    expect(() => parsePhase10C0VS6ArtifactSchemaRegistry(omitted)).toThrow(/omits|differs/u);

    const rawCatalogue = json("research/phase10-execution-v2/recovery-v6/packet-catalogue.json") as {
      packageLockPath: string;
      runtimeEntrypoints: Array<{ role: string; modulePath: string; exportName: string }>;
      runtimeLoaderContract: {
        execArgvRule: string;
        forbiddenEnvironmentKeyRule: string;
        exactWorkerEnvironment: Array<{ key: string; value: string }>;
        workerEnvironmentRule: string;
        entryObservationScopeRule: string;
      };
      workerTransportContract: {
        maximumLineBytes: number;
        maximumStderrBytes: number;
        bytePayloadMarkerKey: string;
        childToParent: { nullabilityRule: string };
      };
      packets: Array<{
        attemptRoot: string;
        lockPath: string;
        maximumStdoutBytes: number;
        maximumOtherAttemptRootBytes: number;
        stdoutMessageByteBudget: {
          boundaryOrProgressLineCountMaximum: number;
          resultLineBytesMaximum: number;
          derivedMaximumBytes: number;
        };
      }>;
    };
    const swappedRuntimeEntrypoints = clone(rawCatalogue);
    swappedRuntimeEntrypoints.runtimeEntrypoints.reverse();
    expect(() => parsePhase10C0VS6PacketCatalogue(swappedRuntimeEntrypoints))
      .toThrow(/parent-executor then worker-dispatcher/u);
    const wrongWorkerExport = clone(rawCatalogue);
    wrongWorkerExport.runtimeEntrypoints[1]!.exportName = "phase10C0VS6ParseWorkerArguments";
    expect(() => parsePhase10C0VS6PacketCatalogue(wrongWorkerExport))
      .toThrow(/parent-executor then worker-dispatcher/u);
    const reintroducedLauncher = clone(rawCatalogue) as typeof rawCatalogue & {
      runtimeLauncherContract?: unknown;
    };
    reintroducedLauncher.runtimeLauncherContract = {};
    expect(() => parsePhase10C0VS6PacketCatalogue(reintroducedLauncher))
      .toThrow(/keys must equal|fields or field order/u);
    const inheritedExecArgv = clone(rawCatalogue);
    inheritedExecArgv.runtimeLoaderContract.execArgvRule = "allow-parent-loader";
    expect(() => parsePhase10C0VS6PacketCatalogue(inheritedExecArgv)).toThrow(/execArgvRule/u);
    const weakenedEnvironmentRule = clone(rawCatalogue);
    weakenedEnvironmentRule.runtimeLoaderContract.forbiddenEnvironmentKeyRule =
      "reject-NODE_OPTIONS-only";
    expect(() => parsePhase10C0VS6PacketCatalogue(weakenedEnvironmentRule))
      .toThrow(/forbiddenEnvironmentKeyRule/u);
    const ambientCloneWorkerEnvironment = clone(rawCatalogue);
    ambientCloneWorkerEnvironment.runtimeLoaderContract.workerEnvironmentRule =
      "parent-clones-environment-removes-forbidden-keys-worker-independently-rejects-remnants";
    expect(() => parsePhase10C0VS6PacketCatalogue(ambientCloneWorkerEnvironment))
      .toThrow(/workerEnvironmentRule/u);
    const mutatedWorkerEnvironment = clone(rawCatalogue);
    mutatedWorkerEnvironment.runtimeLoaderContract.exactWorkerEnvironment[0]!.value = "CON";
    expect(() => parsePhase10C0VS6PacketCatalogue(mutatedWorkerEnvironment))
      .toThrow(/exactWorkerEnvironment/u);
    const falsePreloadExclusion = clone(rawCatalogue);
    falsePreloadExclusion.runtimeLoaderContract.entryObservationScopeRule =
      "all-pre-entry-loaders-excluded";
    expect(() => parsePhase10C0VS6PacketCatalogue(falsePreloadExclusion))
      .toThrow(/entryObservationScopeRule/u);
    const wrongWireMarker = clone(rawCatalogue);
    wrongWireMarker.workerTransportContract.bytePayloadMarkerKey = "$bytes";
    expect(() => parsePhase10C0VS6PacketCatalogue(wrongWireMarker)).toThrow(/bytePayloadMarkerKey/u);
    const wrongWireNullability = clone(rawCatalogue);
    wrongWireNullability.workerTransportContract.childToParent.nullabilityRule =
      "ready-stopped-both-null";
    expect(() => parsePhase10C0VS6PacketCatalogue(wrongWireNullability)).toThrow(/nullabilityRule/u);
    const unboundedWire = clone(rawCatalogue);
    unboundedWire.workerTransportContract.maximumLineBytes += 1;
    expect(() => parsePhase10C0VS6PacketCatalogue(unboundedWire)).toThrow(/maximumLineBytes/u);
    const unboundedStderr = clone(rawCatalogue);
    unboundedStderr.workerTransportContract.maximumStderrBytes += 1;
    expect(() => parsePhase10C0VS6PacketCatalogue(unboundedStderr)).toThrow(/maximumStderrBytes/u);
    const unboundedStdout = clone(rawCatalogue);
    unboundedStdout.packets[0]!.maximumStdoutBytes += 1;
    expect(() => parsePhase10C0VS6PacketCatalogue(unboundedStdout)).toThrow(/mapping/u);
    const unboundedOtherAttemptRoot = clone(rawCatalogue);
    unboundedOtherAttemptRoot.packets[0]!.maximumOtherAttemptRootBytes += 1;
    expect(() => parsePhase10C0VS6PacketCatalogue(unboundedOtherAttemptRoot)).toThrow(/mapping/u);
    const oversizedResultShape = clone(rawCatalogue);
    oversizedResultShape.packets[0]!.stdoutMessageByteBudget.resultLineBytesMaximum += 1;
    oversizedResultShape.packets[0]!.stdoutMessageByteBudget.derivedMaximumBytes += 4;
    expect(() => parsePhase10C0VS6PacketCatalogue(oversizedResultShape))
      .toThrow(/stdoutMessageByteBudget/u);
    const radialBudgetPlusOne = clone(rawCatalogue);
    const radialPlusOne = radialBudgetPlusOne.packets.find((entry) =>
      entry.attemptRoot.endsWith("/c0v-radial-produce"))!;
    radialPlusOne.stdoutMessageByteBudget.derivedMaximumBytes += 1;
    expect(() => parsePhase10C0VS6PacketCatalogue(radialBudgetPlusOne))
      .toThrow(/stdoutMessageByteBudget/u);
    const radialCountSubstitution = clone(rawCatalogue);
    const radialSubstitution = radialCountSubstitution.packets.find((entry) =>
      entry.attemptRoot.endsWith("/c0v-radial-produce"))!;
    radialSubstitution.stdoutMessageByteBudget.boundaryOrProgressLineCountMaximum = 29;
    radialSubstitution.stdoutMessageByteBudget.derivedMaximumBytes += 16_384;
    expect(() => parsePhase10C0VS6PacketCatalogue(radialCountSubstitution))
      .toThrow(/stdoutMessageByteBudget/u);
    const duplicateRoot = clone(rawCatalogue);
    duplicateRoot.packets[1]!.attemptRoot = duplicateRoot.packets[0]!.attemptRoot;
    expect(() => parsePhase10C0VS6PacketCatalogue(duplicateRoot)).toThrow(/mapping|unique/u);
    const swappedLock = clone(rawCatalogue);
    [swappedLock.packets[1]!.lockPath, swappedLock.packets[2]!.lockPath] = [
      swappedLock.packets[2]!.lockPath,
      swappedLock.packets[1]!.lockPath,
    ];
    expect(() => parsePhase10C0VS6PacketCatalogue(swappedLock)).toThrow(/mapping/u);
    const collidedPackageLock = clone(rawCatalogue);
    collidedPackageLock.packageLockPath = collidedPackageLock.packets[0]!.lockPath;
    expect(() => parsePhase10C0VS6PacketCatalogue(collidedPackageLock)).toThrow(/packageLockPath/u);

    const rawProtocol = json(
      "research/phase10-execution-v2/recovery-v6/packets/a-p-c0v-s6/protocol.json",
    ) as {
      verification: { executionProvenanceRule: string };
      paths: {
        attemptRoot: string;
        allowedPublicationPaths: string[];
        publicationStagingPaths: Array<{ finalPath: string; stagingPath: string }>;
      };
    };
    const duplicateFinal = clone(rawProtocol);
    duplicateFinal.paths.allowedPublicationPaths[1] = duplicateFinal.paths.allowedPublicationPaths[0]!;
    expect(() => parsePhase10C0VS6PacketProtocol(duplicateFinal)).toThrow(/unique values/u);
    const attemptRootStage = clone(rawProtocol);
    attemptRootStage.paths.publicationStagingPaths[0]!.stagingPath =
      `${attemptRootStage.paths.attemptRoot}/forbidden.stage`;
    expect(() => parsePhase10C0VS6PacketProtocol(attemptRootStage)).toThrow(/sibling stage/u);
    const reintroducedLauncherBoundary = clone(rawProtocol) as typeof rawProtocol & {
      launcherBoundaryContract?: unknown;
    };
    reintroducedLauncherBoundary.launcherBoundaryContract = {};
    expect(() => parsePhase10C0VS6PacketProtocol(reintroducedLauncherBoundary))
      .toThrow(/keys must equal|fields or field order/u);
    const fabricatedRefusalExecution = clone(rawProtocol);
    fabricatedRefusalExecution.verification.executionProvenanceRule =
      "always-copy-a-completed-evaluator-interval";
    expect(() => parsePhase10C0VS6PacketProtocol(fabricatedRefusalExecution))
      .toThrow(/executionProvenanceRule/u);

    const rawRadialProtocol = json(
      "research/phase10-execution-v2/recovery-v6/packets/c0v-radial-produce/protocol.json",
    ) as {
      workerProgressContract: {
        eventStateTransitions: Array<{ transitionId: string; caseRule: string }>;
      };
    };
    for (const transitionId of ["invocation-finished", "worker-stopped"]) {
      expect(rawRadialProtocol.workerProgressContract.eventStateTransitions.find((entry) =>
        entry.transitionId === transitionId)?.caseRule)
        .toBe("case-id-null-started-completed-active-and-cumulative-progress-preserved");
    }
    const erasedMidCaseProgress = clone(rawRadialProtocol);
    erasedMidCaseProgress.workerProgressContract.eventStateTransitions.find((entry) =>
      entry.transitionId === "invocation-finished")!.caseRule = "case-id-null-active-null";
    expect(() => parsePhase10C0VS6PacketProtocol(erasedMidCaseProgress))
      .toThrow(/workerProgressContract.*caseRule/u);
  });

  it("rejects cyclic cap sources and missing raw-to-final joins", () => {
    const path = "research/phase10-execution-v2/recovery-v6/packets/c0v-radial-produce/protocol.json";
    const raw = json(path) as {
      classificationProjectionRosters: Array<{
        observations: Array<{
          kind: string;
          observedValueSource: string;
          observedValueDerivation: string;
          finalizedValueBinding: string | null;
        }>;
      }>;
    };
    const observation = raw.classificationProjectionRosters
      .flatMap((entry) => entry.observations)
      .find((entry) => entry.kind === "wall-seconds")!;
    const cyclic = clone(raw);
    cyclic.classificationProjectionRosters.flatMap((entry) => entry.observations)
      .find((entry) => entry.kind === "wall-seconds")!.observedValueSource =
        observation.finalizedValueBinding!;
    expect(() => parsePhase10C0VS6PacketProtocol(cyclic)).toThrow(/raw route projection/u);
    const wallClockDerived = clone(raw);
    wallClockDerived.classificationProjectionRosters.flatMap((entry) => entry.observations)
      .find((entry) => entry.kind === "wall-seconds")!.observedValueDerivation = "identity";
    expect(() => parsePhase10C0VS6PacketProtocol(wallClockDerived)).toThrow(/raw route projection/u);
    const unbound = clone(raw);
    unbound.classificationProjectionRosters.flatMap((entry) => entry.observations)
      .find((entry) => entry.kind === "wall-seconds")!.finalizedValueBinding = null;
    expect(() => parsePhase10C0VS6PacketProtocol(unbound)).toThrow(/raw route projection/u);
  });

  it("keeps every authority path unignored and byte-stable on checkout", () => {
    for (const path of AUTHORITY_PATHS) {
      const ignored = spawnSync("git", ["check-ignore", "-q", "--", path], {
        cwd: ROOT,
        encoding: "utf8",
      });
      expect(ignored.status, path).toBe(1);
    }
    const output = execFileSync("git", ["check-attr", "text", "--", ...AUTHORITY_PATHS], {
      cwd: ROOT,
      encoding: "utf8",
    });
    for (const path of AUTHORITY_PATHS) {
      expect(output).toContain(`${path}: text: unset`);
    }
  });
});
