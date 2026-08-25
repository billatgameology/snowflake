import { createHash } from "node:crypto";
import { strictJsonSnapshot, type StrictJson } from "./gate4-evidence.ts";

export const PHASE10_C0V_S6_MATRIX_SCHEMA = "phase10-c0v-s6-obligation-matrix-v1" as const;
export const PHASE10_C0V_S6_MATRIX_ID = "phase10-c0v-s6-obligations-v1" as const;
export const PHASE10_C0V_S6_PACKET_PROTOCOL_SCHEMA = "phase10-c0v-s6-packet-protocol-v1" as const;
export const PHASE10_C0V_S6_PACKET_CATALOGUE_SCHEMA = "phase10-c0v-s6-packet-catalogue-v1" as const;
export const PHASE10_C0V_S6_RECOVERY_PACKET_PROTOCOL_SCHEMA =
  "phase10-c0v-s6-packet-protocol-recovery-v1" as const;
export const PHASE10_C0V_S6_RECOVERY_PACKET_CATALOGUE_SCHEMA =
  "phase10-c0v-s6-packet-catalogue-recovery-v1" as const;
export const PHASE10_C0V_S6_RECOVERY_AUTHORITY_SCHEMA =
  "phase10-c0v-s6-recovery-authority-v1" as const;
export const PHASE10_C0V_S6_RECOVERY_AUTHORITY_ID =
  "phase10-c0v-s6-execution-v2-recovery-v1" as const;
export const PHASE10_C0V_S6_RECOVERY_AUTHORITY_ROOT =
  "research/phase10-execution-v2/recovery-v1" as const;
export const PHASE10_C0V_S6_RECOVERY_AUTHORITY_PATH =
  "research/phase10-execution-v2/recovery-v1/recovery-authority.json" as const;
export const PHASE10_C0V_S6_RECOVERY_PACKET_CATALOGUE_PATH =
  "research/phase10-execution-v2/recovery-v1/packet-catalogue.json" as const;
export const PHASE10_C0V_S6_RECOVERY_PACKET_CATALOGUE_ID =
  "phase10-c0v-s6-execution-v2-recovery-v1-packet-paths-v1" as const;
export const PHASE10_C0V_S6_RECOVERY_RUNTIME_ROOT =
  "out/phase10-execution-v2/recovery-v1" as const;
export const PHASE10_C0V_S6_RECOVERY_LOCK_ROOT =
  "out/phase10-execution-v2/recovery-v1/locks" as const;
export const PHASE10_C0V_S6_RECOVERY_ATTEMPT_ROOT =
  "out/phase10-execution-v2/recovery-v1/attempts" as const;
export const PHASE10_C0V_S6_RECOVERY_PACKAGE_LOCK_PATH =
  "out/phase10-execution-v2/recovery-v1/locks/package.lock" as const;
export const PHASE10_C0V_S6_RECOVERY_PACKAGE_LOCK_RULE =
  "predecessor-audit-before-successor-package-lock-then-packet-lock-before-any-observation" as const;
export const PHASE10_C0V_S6_RECOVERY_V2_PACKET_PROTOCOL_SCHEMA =
  "phase10-c0v-s6-recovery-v2-packet-protocol-v1" as const;
export const PHASE10_C0V_S6_RECOVERY_V2_PACKET_CATALOGUE_SCHEMA =
  "phase10-c0v-s6-recovery-v2-packet-catalogue-v1" as const;
export const PHASE10_C0V_S6_RECOVERY_V2_AUTHORITY_SCHEMA =
  "phase10-c0v-s6-recovery-authority-v2" as const;
export const PHASE10_C0V_S6_RECOVERY_V2_AUTHORITY_ID =
  "phase10-c0v-s6-execution-v2-recovery-v2" as const;
export const PHASE10_C0V_S6_RECOVERY_V2_AUTHORITY_ROOT =
  "research/phase10-execution-v2/recovery-v2" as const;
export const PHASE10_C0V_S6_RECOVERY_V2_AUTHORITY_PATH =
  "research/phase10-execution-v2/recovery-v2/recovery-authority.json" as const;
export const PHASE10_C0V_S6_RECOVERY_V2_PACKET_CATALOGUE_PATH =
  "research/phase10-execution-v2/recovery-v2/packet-catalogue.json" as const;
export const PHASE10_C0V_S6_RECOVERY_V2_PACKET_CATALOGUE_ID =
  "phase10-c0v-s6-execution-v2-recovery-v2-packet-paths-v1" as const;
export const PHASE10_C0V_S6_RECOVERY_V2_RUNTIME_ROOT =
  "out/phase10-execution-v2/recovery-v2" as const;
export const PHASE10_C0V_S6_RECOVERY_V2_LOCK_ROOT =
  "out/phase10-execution-v2/recovery-v2/locks" as const;
export const PHASE10_C0V_S6_RECOVERY_V2_ATTEMPT_ROOT =
  "out/phase10-execution-v2/recovery-v2/attempts" as const;
export const PHASE10_C0V_S6_RECOVERY_V2_PACKAGE_LOCK_PATH =
  "out/phase10-execution-v2/recovery-v2/locks/package.lock" as const;
export const PHASE10_C0V_S6_RECOVERY_V2_PACKAGE_LOCK_RULE =
  "both-predecessor-audits-before-successor-package-lock-then-packet-lock-before-any-observation" as const;
export const PHASE10_C0V_S6_RECOVERY_V3_PACKET_PROTOCOL_SCHEMA =
  "phase10-c0v-s6-recovery-v3-packet-protocol-v1" as const;
export const PHASE10_C0V_S6_RECOVERY_V3_PACKET_CATALOGUE_SCHEMA =
  "phase10-c0v-s6-recovery-v3-packet-catalogue-v1" as const;
export const PHASE10_C0V_S6_RECOVERY_V3_AUTHORITY_SCHEMA =
  "phase10-c0v-s6-recovery-authority-v3" as const;
export const PHASE10_C0V_S6_RECOVERY_V3_AUTHORITY_ID =
  "phase10-c0v-s6-execution-v2-recovery-v3" as const;
export const PHASE10_C0V_S6_RECOVERY_V3_AUTHORITY_ROOT =
  "research/phase10-execution-v2/recovery-v3" as const;
export const PHASE10_C0V_S6_RECOVERY_V3_AUTHORITY_PATH =
  "research/phase10-execution-v2/recovery-v3/recovery-authority.json" as const;
export const PHASE10_C0V_S6_RECOVERY_V3_PACKET_CATALOGUE_PATH =
  "research/phase10-execution-v2/recovery-v3/packet-catalogue.json" as const;
export const PHASE10_C0V_S6_RECOVERY_V3_PACKET_CATALOGUE_ID =
  "phase10-c0v-s6-execution-v2-recovery-v3-packet-paths-v1" as const;
export const PHASE10_C0V_S6_RECOVERY_V3_RUNTIME_ROOT =
  "out/phase10-execution-v2/recovery-v3" as const;
export const PHASE10_C0V_S6_RECOVERY_V3_LOCK_ROOT =
  "out/phase10-execution-v2/recovery-v3/locks" as const;
export const PHASE10_C0V_S6_RECOVERY_V3_ATTEMPT_ROOT =
  "out/phase10-execution-v2/recovery-v3/attempts" as const;
export const PHASE10_C0V_S6_RECOVERY_V3_PACKAGE_LOCK_PATH =
  "out/phase10-execution-v2/recovery-v3/locks/package.lock" as const;
export const PHASE10_C0V_S6_RECOVERY_V3_PACKAGE_LOCK_RULE =
  "all-predecessor-audits-before-successor-package-lock-then-packet-lock-before-any-observation" as const;
export const PHASE10_C0V_S6_RECOVERY_V4_PACKET_PROTOCOL_SCHEMA =
  "phase10-c0v-s6-recovery-v4-packet-protocol-v1" as const;
export const PHASE10_C0V_S6_RECOVERY_V4_PACKET_CATALOGUE_SCHEMA =
  "phase10-c0v-s6-recovery-v4-packet-catalogue-v1" as const;
export const PHASE10_C0V_S6_RECOVERY_V4_AUTHORITY_SCHEMA =
  "phase10-c0v-s6-recovery-authority-v4" as const;
export const PHASE10_C0V_S6_RECOVERY_V4_AUTHORITY_ID =
  "phase10-c0v-s6-execution-v2-recovery-v4" as const;
export const PHASE10_C0V_S6_RECOVERY_V4_AUTHORITY_ROOT =
  "research/phase10-execution-v2/recovery-v4" as const;
export const PHASE10_C0V_S6_RECOVERY_V4_AUTHORITY_PATH =
  "research/phase10-execution-v2/recovery-v4/recovery-authority.json" as const;
export const PHASE10_C0V_S6_RECOVERY_V4_PACKET_CATALOGUE_PATH =
  "research/phase10-execution-v2/recovery-v4/packet-catalogue.json" as const;
export const PHASE10_C0V_S6_RECOVERY_V4_PACKET_CATALOGUE_ID =
  "phase10-c0v-s6-execution-v2-recovery-v4-packet-paths-v1" as const;
export const PHASE10_C0V_S6_RECOVERY_V4_RUNTIME_ROOT =
  "out/phase10-execution-v2/recovery-v4" as const;
export const PHASE10_C0V_S6_RECOVERY_V4_LOCK_ROOT =
  "out/phase10-execution-v2/recovery-v4/locks" as const;
export const PHASE10_C0V_S6_RECOVERY_V4_ATTEMPT_ROOT =
  "out/phase10-execution-v2/recovery-v4/attempts" as const;
export const PHASE10_C0V_S6_RECOVERY_V4_PACKAGE_LOCK_PATH =
  "out/phase10-execution-v2/recovery-v4/locks/package.lock" as const;
export const PHASE10_C0V_S6_RECOVERY_V4_PACKAGE_LOCK_RULE =
  "all-predecessor-audits-before-successor-package-lock-then-packet-lock-before-any-observation" as const;
export const PHASE10_C0V_S6_RECOVERY_V5_PACKET_PROTOCOL_SCHEMA =
  "phase10-c0v-s6-recovery-v5-packet-protocol-v1" as const;
export const PHASE10_C0V_S6_RECOVERY_V5_PACKET_CATALOGUE_SCHEMA =
  "phase10-c0v-s6-recovery-v5-packet-catalogue-v1" as const;
export const PHASE10_C0V_S6_RECOVERY_V5_AUTHORITY_SCHEMA =
  "phase10-c0v-s6-recovery-authority-v5" as const;
export const PHASE10_C0V_S6_RECOVERY_V5_AUTHORITY_ID =
  "phase10-c0v-s6-execution-v2-recovery-v5" as const;
export const PHASE10_C0V_S6_RECOVERY_V5_AUTHORITY_ROOT =
  "research/phase10-execution-v2/recovery-v5" as const;
export const PHASE10_C0V_S6_RECOVERY_V5_AUTHORITY_PATH =
  "research/phase10-execution-v2/recovery-v5/recovery-authority.json" as const;
export const PHASE10_C0V_S6_RECOVERY_V5_PACKET_CATALOGUE_PATH =
  "research/phase10-execution-v2/recovery-v5/packet-catalogue.json" as const;
export const PHASE10_C0V_S6_RECOVERY_V5_PACKET_CATALOGUE_ID =
  "phase10-c0v-s6-execution-v2-recovery-v5-packet-paths-v1" as const;
export const PHASE10_C0V_S6_RECOVERY_V5_RUNTIME_ROOT =
  "out/phase10-execution-v2/recovery-v5" as const;
export const PHASE10_C0V_S6_RECOVERY_V5_LOCK_ROOT =
  "out/phase10-execution-v2/recovery-v5/locks" as const;
export const PHASE10_C0V_S6_RECOVERY_V5_ATTEMPT_ROOT =
  "out/phase10-execution-v2/recovery-v5/attempts" as const;
export const PHASE10_C0V_S6_RECOVERY_V5_PACKAGE_LOCK_PATH =
  "out/phase10-execution-v2/recovery-v5/locks/package.lock" as const;
export const PHASE10_C0V_S6_RECOVERY_V5_PACKAGE_LOCK_RULE =
  "all-predecessor-audits-before-successor-package-lock-then-packet-lock-before-any-observation" as const;
export const PHASE10_C0V_S6_RECOVERY_V6_PACKET_PROTOCOL_SCHEMA =
  "phase10-c0v-s6-recovery-v6-packet-protocol-v1" as const;
export const PHASE10_C0V_S6_RECOVERY_V6_PACKET_CATALOGUE_SCHEMA =
  "phase10-c0v-s6-recovery-v6-packet-catalogue-v1" as const;
export const PHASE10_C0V_S6_RECOVERY_V6_AUTHORITY_SCHEMA =
  "phase10-c0v-s6-recovery-authority-v6" as const;
export const PHASE10_C0V_S6_RECOVERY_V6_AUTHORITY_ID =
  "phase10-c0v-s6-execution-v2-recovery-v6" as const;
export const PHASE10_C0V_S6_RECOVERY_V6_AUTHORITY_ROOT =
  "research/phase10-execution-v2/recovery-v6" as const;
export const PHASE10_C0V_S6_RECOVERY_V6_AUTHORITY_PATH =
  "research/phase10-execution-v2/recovery-v6/recovery-authority.json" as const;
export const PHASE10_C0V_S6_RECOVERY_V6_PACKET_CATALOGUE_PATH =
  "research/phase10-execution-v2/recovery-v6/packet-catalogue.json" as const;
export const PHASE10_C0V_S6_RECOVERY_V6_PACKET_CATALOGUE_ID =
  "phase10-c0v-s6-execution-v2-recovery-v6-packet-paths-v1" as const;
export const PHASE10_C0V_S6_RECOVERY_V6_RUNTIME_ROOT =
  "out/phase10-execution-v2/recovery-v6" as const;
export const PHASE10_C0V_S6_RECOVERY_V6_LOCK_ROOT =
  "out/phase10-execution-v2/recovery-v6/locks" as const;
export const PHASE10_C0V_S6_RECOVERY_V6_ATTEMPT_ROOT =
  "out/phase10-execution-v2/recovery-v6/attempts" as const;
export const PHASE10_C0V_S6_RECOVERY_V6_PACKAGE_LOCK_PATH =
  "out/phase10-execution-v2/recovery-v6/locks/package.lock" as const;
export const PHASE10_C0V_S6_RECOVERY_V6_PACKAGE_LOCK_RULE =
  "all-predecessor-audits-before-successor-package-lock-then-packet-lock-before-any-observation" as const;
export const PHASE10_C0V_S6_RECOVERY_V7_PACKET_PROTOCOL_SCHEMA =
  "phase10-c0v-s6-recovery-v7-packet-protocol-v1" as const;
export const PHASE10_C0V_S6_RECOVERY_V7_PACKET_CATALOGUE_SCHEMA =
  "phase10-c0v-s6-recovery-v7-packet-catalogue-v1" as const;
export const PHASE10_C0V_S6_RECOVERY_V7_AUTHORITY_SCHEMA =
  "phase10-c0v-s6-recovery-authority-v7" as const;
export const PHASE10_C0V_S6_RECOVERY_V7_AUTHORITY_ID =
  "phase10-c0v-s6-execution-v2-recovery-v7" as const;
export const PHASE10_C0V_S6_RECOVERY_V7_AUTHORITY_ROOT =
  "research/phase10-execution-v2/recovery-v7" as const;
export const PHASE10_C0V_S6_RECOVERY_V7_AUTHORITY_PATH =
  "research/phase10-execution-v2/recovery-v7/recovery-authority.json" as const;
export const PHASE10_C0V_S6_RECOVERY_V7_PACKET_CATALOGUE_PATH =
  "research/phase10-execution-v2/recovery-v7/packet-catalogue.json" as const;
export const PHASE10_C0V_S6_RECOVERY_V7_PACKET_CATALOGUE_ID =
  "phase10-c0v-s6-execution-v2-recovery-v7-packet-paths-v1" as const;
export const PHASE10_C0V_S6_RECOVERY_V7_RUNTIME_ROOT =
  "out/phase10-execution-v2/recovery-v7" as const;
export const PHASE10_C0V_S6_RECOVERY_V7_LOCK_ROOT =
  "out/phase10-execution-v2/recovery-v7/locks" as const;
export const PHASE10_C0V_S6_RECOVERY_V7_ATTEMPT_ROOT =
  "out/phase10-execution-v2/recovery-v7/attempts" as const;
export const PHASE10_C0V_S6_RECOVERY_V7_PACKAGE_LOCK_PATH =
  "out/phase10-execution-v2/recovery-v7/locks/package.lock" as const;
export const PHASE10_C0V_S6_RECOVERY_V7_PACKAGE_LOCK_RULE =
  "all-predecessor-audits-before-successor-package-lock-then-packet-lock-before-any-observation" as const;
export const PHASE10_C0V_S6_RECOVERY_V8_PACKET_PROTOCOL_SCHEMA =
  "phase10-c0v-s6-recovery-v8-packet-protocol-v1" as const;
export const PHASE10_C0V_S6_RECOVERY_V8_PACKET_CATALOGUE_SCHEMA =
  "phase10-c0v-s6-recovery-v8-packet-catalogue-v1" as const;
export const PHASE10_C0V_S6_RECOVERY_V8_AUTHORITY_SCHEMA =
  "phase10-c0v-s6-recovery-authority-v8" as const;
export const PHASE10_C0V_S6_RECOVERY_V8_AUTHORITY_ID =
  "phase10-c0v-s6-execution-v2-recovery-v8" as const;
export const PHASE10_C0V_S6_RECOVERY_V8_AUTHORITY_ROOT =
  "research/phase10-execution-v2/recovery-v8" as const;
export const PHASE10_C0V_S6_RECOVERY_V8_AUTHORITY_PATH =
  "research/phase10-execution-v2/recovery-v8/recovery-authority.json" as const;
export const PHASE10_C0V_S6_RECOVERY_V8_PACKET_CATALOGUE_PATH =
  "research/phase10-execution-v2/recovery-v8/packet-catalogue.json" as const;
export const PHASE10_C0V_S6_RECOVERY_V8_PACKET_CATALOGUE_ID =
  "phase10-c0v-s6-execution-v2-recovery-v8-packet-paths-v1" as const;
export const PHASE10_C0V_S6_RECOVERY_V8_RUNTIME_ROOT =
  "out/phase10-execution-v2/recovery-v8" as const;
export const PHASE10_C0V_S6_RECOVERY_V8_LOCK_ROOT =
  "out/phase10-execution-v2/recovery-v8/locks" as const;
export const PHASE10_C0V_S6_RECOVERY_V8_ATTEMPT_ROOT =
  "out/phase10-execution-v2/recovery-v8/attempts" as const;
export const PHASE10_C0V_S6_RECOVERY_V8_PACKAGE_LOCK_PATH =
  "out/phase10-execution-v2/recovery-v8/locks/package.lock" as const;
export const PHASE10_C0V_S6_RECOVERY_V8_PACKAGE_LOCK_RULE =
  "all-predecessor-audits-before-successor-package-lock-then-packet-lock-before-any-observation" as const;
export const PHASE10_C0V_S6_RECOVERY_V9_PACKET_PROTOCOL_SCHEMA =
  "phase10-c0v-s6-recovery-v9-packet-protocol-v1" as const;
export const PHASE10_C0V_S6_RECOVERY_V9_PACKET_CATALOGUE_SCHEMA =
  "phase10-c0v-s6-recovery-v9-packet-catalogue-v1" as const;
export const PHASE10_C0V_S6_RECOVERY_V9_AUTHORITY_SCHEMA =
  "phase10-c0v-s6-recovery-authority-v9" as const;
export const PHASE10_C0V_S6_RECOVERY_V9_AUTHORITY_ID =
  "phase10-c0v-s6-execution-v2-recovery-v9" as const;
export const PHASE10_C0V_S6_RECOVERY_V9_AUTHORITY_ROOT =
  "research/phase10-execution-v2/recovery-v9" as const;
export const PHASE10_C0V_S6_RECOVERY_V9_AUTHORITY_PATH =
  "research/phase10-execution-v2/recovery-v9/recovery-authority.json" as const;
export const PHASE10_C0V_S6_RECOVERY_V9_PACKET_CATALOGUE_PATH =
  "research/phase10-execution-v2/recovery-v9/packet-catalogue.json" as const;
export const PHASE10_C0V_S6_RECOVERY_V9_PACKET_CATALOGUE_ID =
  "phase10-c0v-s6-execution-v2-recovery-v9-packet-paths-v1" as const;
export const PHASE10_C0V_S6_RECOVERY_V9_RUNTIME_ROOT =
  "out/phase10-execution-v2/recovery-v9" as const;
export const PHASE10_C0V_S6_RECOVERY_V9_LOCK_ROOT =
  "out/phase10-execution-v2/recovery-v9/locks" as const;
export const PHASE10_C0V_S6_RECOVERY_V9_ATTEMPT_ROOT =
  "out/phase10-execution-v2/recovery-v9/attempts" as const;
export const PHASE10_C0V_S6_RECOVERY_V9_PACKAGE_LOCK_PATH =
  "out/phase10-execution-v2/recovery-v9/locks/package.lock" as const;
export const PHASE10_C0V_S6_RECOVERY_V9_PACKAGE_LOCK_RULE =
  "all-predecessor-audits-before-successor-package-lock-then-packet-lock-before-any-observation" as const;
export const PHASE10_C0V_S6_CALLABLE_REGISTRY_SCHEMA = "phase10-c0v-s6-callable-registry-v1" as const;
export const PHASE10_C0V_S6_SCHEMA_CONTRACTS_SCHEMA = "phase10-c0v-s6-schema-contracts-v1" as const;
export const PHASE10_C0V_S6_ARTIFACT_SCHEMA_REGISTRY_SCHEMA =
  "phase10-c0v-s6-artifact-schema-registry-v1" as const;
export const PHASE10_C0V_S6_SUCCESSOR_SCHEMA_IDS = Object.freeze([
  "phase10-c0v-attempt-row-v2",
  "phase10-c0v-radial-result-v2",
  "phase10-c0v-s6-preflight-receipt-v2",
  "phase10-c0v-s6-terminal-receipt-v2",
  "phase10-packet-verification-v2",
] as const);

export const PHASE10_C0V_S6_PACKET_IDS = Object.freeze([
  "a-p-c0v-s6",
  "c0v-moving-produce",
  "c0v-moving-publish",
  "c0v-radial-produce",
  "c0v-radial-publish",
  "c0v-static-produce",
  "c0v-static-publish",
  "c0v-aggregate",
] as const);

export const PHASE10_C0V_S6_PACKAGE_LOCK_PATH =
  "out/phase10-execution-v2/locks/package.lock" as const;

export const PHASE10_C0V_S6_PREDECESSOR_LOCK_ROOT =
  "out/phase10-execution-v2/locks" as const;
export const PHASE10_C0V_S6_PREDECESSOR_PACKAGE_LOCK_PATH = PHASE10_C0V_S6_PACKAGE_LOCK_PATH;
export const PHASE10_C0V_S6_PREDECESSOR_AP_LOCK_PATH =
  "out/phase10-execution-v2/locks/a-p-c0v-s6.lock" as const;

export const PHASE10_C0V_S6_PACKET_LOCK_PATHS = Object.freeze(Object.fromEntries(
  PHASE10_C0V_S6_PACKET_IDS.map((packetId) => [
    packetId,
    `out/phase10-execution-v2/locks/${packetId}.lock`,
  ]),
) as Readonly<Record<(typeof PHASE10_C0V_S6_PACKET_IDS)[number], string>>);

export const PHASE10_C0V_S6_RECOVERY_PACKET_LOCK_PATHS = Object.freeze(Object.fromEntries(
  PHASE10_C0V_S6_PACKET_IDS.map((packetId) => [
    packetId,
    `${PHASE10_C0V_S6_RECOVERY_LOCK_ROOT}/${packetId}.lock`,
  ]),
) as Readonly<Record<(typeof PHASE10_C0V_S6_PACKET_IDS)[number], string>>);

export const PHASE10_C0V_S6_RECOVERY_ATTEMPT_IDS = Object.freeze(Object.fromEntries(
  PHASE10_C0V_S6_PACKET_IDS.map((packetId) => [
    packetId,
    `${packetId}-20260822-${packetId === "a-p-c0v-s6" ? "v2" : "v1"}`,
  ]),
) as Readonly<Record<(typeof PHASE10_C0V_S6_PACKET_IDS)[number], string>>);

export const PHASE10_C0V_S6_RECOVERY_V2_PACKET_LOCK_PATHS = Object.freeze(Object.fromEntries(
  PHASE10_C0V_S6_PACKET_IDS.map((packetId) => [
    packetId,
    `${PHASE10_C0V_S6_RECOVERY_V2_LOCK_ROOT}/${packetId}.lock`,
  ]),
) as Readonly<Record<(typeof PHASE10_C0V_S6_PACKET_IDS)[number], string>>);

export const PHASE10_C0V_S6_RECOVERY_V2_ATTEMPT_IDS = Object.freeze(Object.fromEntries(
  PHASE10_C0V_S6_PACKET_IDS.map((packetId) => [
    packetId,
    `${packetId}-20260822-${packetId === "a-p-c0v-s6" ? "v3" : "v1"}`,
  ]),
) as Readonly<Record<(typeof PHASE10_C0V_S6_PACKET_IDS)[number], string>>);

export const PHASE10_C0V_S6_RECOVERY_V3_PACKET_LOCK_PATHS = Object.freeze(Object.fromEntries(
  PHASE10_C0V_S6_PACKET_IDS.map((packetId) => [
    packetId,
    `${PHASE10_C0V_S6_RECOVERY_V3_LOCK_ROOT}/${packetId}.lock`,
  ]),
) as Readonly<Record<(typeof PHASE10_C0V_S6_PACKET_IDS)[number], string>>);

export const PHASE10_C0V_S6_RECOVERY_V3_ATTEMPT_IDS = Object.freeze(Object.fromEntries(
  PHASE10_C0V_S6_PACKET_IDS.map((packetId) => [
    packetId,
    `${packetId}-20260822-${packetId === "a-p-c0v-s6" ? "v4" : "v1"}`,
  ]),
) as Readonly<Record<(typeof PHASE10_C0V_S6_PACKET_IDS)[number], string>>);

export const PHASE10_C0V_S6_RECOVERY_V4_PACKET_LOCK_PATHS = Object.freeze(Object.fromEntries(
  PHASE10_C0V_S6_PACKET_IDS.map((packetId) => [
    packetId,
    `${PHASE10_C0V_S6_RECOVERY_V4_LOCK_ROOT}/${packetId}.lock`,
  ]),
) as Readonly<Record<(typeof PHASE10_C0V_S6_PACKET_IDS)[number], string>>);

export const PHASE10_C0V_S6_RECOVERY_V4_ATTEMPT_IDS = Object.freeze(Object.fromEntries(
  PHASE10_C0V_S6_PACKET_IDS.map((packetId) => [
    packetId,
    `${packetId}-20260822-${packetId === "a-p-c0v-s6" ? "v5" : "v1"}`,
  ]),
) as Readonly<Record<(typeof PHASE10_C0V_S6_PACKET_IDS)[number], string>>);

export const PHASE10_C0V_S6_RECOVERY_V5_PACKET_LOCK_PATHS = Object.freeze(Object.fromEntries(
  PHASE10_C0V_S6_PACKET_IDS.map((packetId) => [
    packetId,
    `${PHASE10_C0V_S6_RECOVERY_V5_LOCK_ROOT}/${packetId}.lock`,
  ]),
) as Readonly<Record<(typeof PHASE10_C0V_S6_PACKET_IDS)[number], string>>);

export const PHASE10_C0V_S6_RECOVERY_V5_ATTEMPT_IDS = Object.freeze(Object.fromEntries(
  PHASE10_C0V_S6_PACKET_IDS.map((packetId) => [
    packetId,
    `${packetId}-20260822-${packetId === "a-p-c0v-s6" ? "v6" : "v1"}`,
  ]),
) as Readonly<Record<(typeof PHASE10_C0V_S6_PACKET_IDS)[number], string>>);

export const PHASE10_C0V_S6_RECOVERY_V6_PACKET_LOCK_PATHS = Object.freeze(Object.fromEntries(
  PHASE10_C0V_S6_PACKET_IDS.map((packetId) => [
    packetId,
    `${PHASE10_C0V_S6_RECOVERY_V6_LOCK_ROOT}/${packetId}.lock`,
  ]),
) as Readonly<Record<(typeof PHASE10_C0V_S6_PACKET_IDS)[number], string>>);

export const PHASE10_C0V_S6_RECOVERY_V6_ATTEMPT_IDS = Object.freeze(Object.fromEntries(
  PHASE10_C0V_S6_PACKET_IDS.map((packetId) => [
    packetId,
    `${packetId}-20260822-${packetId === "a-p-c0v-s6" ? "v6" : packetId === "c0v-moving-produce" ? "v2" : "v1"}`,
  ]),
) as Readonly<Record<(typeof PHASE10_C0V_S6_PACKET_IDS)[number], string>>);

export const PHASE10_C0V_S6_RECOVERY_V8_MOVING_ATTEMPT_ID =
  "c0v-moving-produce-20260822-v4" as const;
export const PHASE10_C0V_S6_CURRENT_MOVING_ATTEMPT_ID =
  "c0v-moving-produce-20260822-v5" as const;

export const PHASE10_C0V_S6_RECOVERY_V7_PACKET_LOCK_PATHS = Object.freeze(Object.fromEntries(
  PHASE10_C0V_S6_PACKET_IDS.map((packetId) => [
    packetId,
    `${PHASE10_C0V_S6_RECOVERY_V7_LOCK_ROOT}/${packetId}.lock`,
  ]),
) as Readonly<Record<(typeof PHASE10_C0V_S6_PACKET_IDS)[number], string>>);

export const PHASE10_C0V_S6_RECOVERY_V7_ATTEMPT_IDS = Object.freeze(Object.fromEntries(
  PHASE10_C0V_S6_PACKET_IDS.map((packetId) => [
    packetId,
    packetId === "a-p-c0v-s6"
      ? "a-p-c0v-s6-20260822-v6"
      : packetId === "c0v-moving-produce"
        ? "c0v-moving-produce-20260822-v3"
        : `${packetId}-20260822-v1`,
  ]),
) as Readonly<Record<(typeof PHASE10_C0V_S6_PACKET_IDS)[number], string>>);

export const PHASE10_C0V_S6_RECOVERY_V8_PACKET_LOCK_PATHS = Object.freeze(Object.fromEntries(
  PHASE10_C0V_S6_PACKET_IDS.map((packetId) => [
    packetId,
    `${PHASE10_C0V_S6_RECOVERY_V8_LOCK_ROOT}/${packetId}.lock`,
  ]),
) as Readonly<Record<(typeof PHASE10_C0V_S6_PACKET_IDS)[number], string>>);

export const PHASE10_C0V_S6_RECOVERY_V8_ATTEMPT_IDS = Object.freeze(Object.fromEntries(
  PHASE10_C0V_S6_PACKET_IDS.map((packetId) => [
    packetId,
    packetId === "a-p-c0v-s6"
      ? "a-p-c0v-s6-20260822-v6"
      : packetId === "c0v-moving-produce"
        ? PHASE10_C0V_S6_RECOVERY_V8_MOVING_ATTEMPT_ID
        : `${packetId}-20260822-v1`,
  ]),
) as Readonly<Record<(typeof PHASE10_C0V_S6_PACKET_IDS)[number], string>>);

export const PHASE10_C0V_S6_RECOVERY_V9_PACKET_LOCK_PATHS = Object.freeze(Object.fromEntries(
  PHASE10_C0V_S6_PACKET_IDS.map((packetId) => [
    packetId,
    `${PHASE10_C0V_S6_RECOVERY_V9_LOCK_ROOT}/${packetId}.lock`,
  ]),
) as Readonly<Record<(typeof PHASE10_C0V_S6_PACKET_IDS)[number], string>>);

export const PHASE10_C0V_S6_RECOVERY_V9_ATTEMPT_IDS = Object.freeze(Object.fromEntries(
  PHASE10_C0V_S6_PACKET_IDS.map((packetId) => [
    packetId,
    packetId === "a-p-c0v-s6"
      ? "a-p-c0v-s6-20260822-v6"
      : packetId === "c0v-moving-produce"
        ? PHASE10_C0V_S6_CURRENT_MOVING_ATTEMPT_ID
        : `${packetId}-20260822-v1`,
  ]),
) as Readonly<Record<(typeof PHASE10_C0V_S6_PACKET_IDS)[number], string>>);

export function phase10C0VS6LockPathsForPacketId(packetId: string): Readonly<{
  packageLockPath: typeof PHASE10_C0V_S6_RECOVERY_V9_PACKAGE_LOCK_PATH;
  packetLockPath: string;
}> {
  if (!PHASE10_C0V_S6_PACKET_IDS.some((entry) => entry === packetId)) {
    throw new Error("Phase 10 C0V S6 CLI packet ID is not registered for pre-observation locking");
  }
  return Object.freeze({
    packageLockPath: PHASE10_C0V_S6_RECOVERY_V9_PACKAGE_LOCK_PATH,
    packetLockPath: PHASE10_C0V_S6_RECOVERY_V9_PACKET_LOCK_PATHS[packetId as Phase10C0VS6PacketId],
  });
}

export const PHASE10_C0V_S6_PREFLIGHT_OBSERVED_FIELDS = Object.freeze([
  "launchClass", "executionMode", "selectedRouteId", "branch", "head", "runtime", "command",
  "cwd", "repositoryBundleRoot", "compositeMatrix", "packetCatalogue", "successorSchemaRegistry", "evidenceManifest",
  "scienceProtocol", "referenceOrRefusal", "packetProtocol", "callableRegistry", "codeFreeze",
  "registeredAttemptRoot", "attemptDirectory", "candidateDirectory", "stdoutPath", "stderrPath",
  "exitStatusPath", "packageLockPath", "lockPath", "finalPreflightReceiptPath", "finalTerminalReceiptPath",
  "verificationPaths", "dependencyPacketIds", "dependencyArtifacts", "resources", "ancestry",
] as const);

export const PHASE10_C0V_S6_PREFLIGHT_RESOURCE_FIELDS = Object.freeze([
  "requiredRuntime", "processConcurrency", "solverProcessConcurrency", "solverWorkerTimeoutSeconds",
  "perExecutableControlInvocationWallHoursMaximum", "outerInfrastructureOrchestrationAllowanceSeconds",
  "outerInfrastructureSafetyTimeoutSeconds", "outerInfrastructureTimingRule",
  "packageElapsedNanosecondsMaximum", "packageProcessHoursMaximum",
  "currentPacketRegisteredElapsedNanosecondsMaximum", "currentPacketRegisteredProcessHoursMaximum",
  "attemptRootWritePolicy", "transientCopyAccounting", "filesystemObjectPolicy",
  "publicationTransitionPolicy", "lockLifetimePolicy", "lockAcquisitionPolicy",
  "packageStorageAccountingRule", "packageStorageBaselineArtifacts",
  "packageStorageBaselineBytes", "retainedStorageBytesMaximum", "projectedScratchBytes",
  "projectedPublicationBytes", "publicationFinalizationProjections", "minimumFreeBytes",
  "packageElapsedNanosecondsBeforeAttempt", "projectedPackageElapsedNanosecondsAfterAttempt",
  "packageProcessHoursBeforeAttempt", "projectedPackageProcessHoursAfterAttempt",
  "packageRetainedBytesBeforeAttempt", "projectedPackageBytesAfterAttempt", "observedFreeBytes", "automaticRetry",
  "automaticRefinementOrFanOut", "nasOrNetworkAccess",
] as const);

export const PHASE10_C0V_S6_PREFLIGHT_ANCESTRY_FIELDS = Object.freeze([
  "repositoryClean", "headMatchesLaunch", "requiredCommitsAreAncestors", "boundArtifactsMatch",
  "codeFreezeMatches", "verdict", "errors",
] as const);

export type Phase10C0VS6PacketId = (typeof PHASE10_C0V_S6_PACKET_IDS)[number];
export type Phase10C0VS6PackageLockPath =
  | typeof PHASE10_C0V_S6_PACKAGE_LOCK_PATH
  | typeof PHASE10_C0V_S6_RECOVERY_PACKAGE_LOCK_PATH
  | typeof PHASE10_C0V_S6_RECOVERY_V2_PACKAGE_LOCK_PATH
  | typeof PHASE10_C0V_S6_RECOVERY_V3_PACKAGE_LOCK_PATH
  | typeof PHASE10_C0V_S6_RECOVERY_V4_PACKAGE_LOCK_PATH
  | typeof PHASE10_C0V_S6_RECOVERY_V5_PACKAGE_LOCK_PATH
  | typeof PHASE10_C0V_S6_RECOVERY_V6_PACKAGE_LOCK_PATH
  | typeof PHASE10_C0V_S6_RECOVERY_V7_PACKAGE_LOCK_PATH
  | typeof PHASE10_C0V_S6_RECOVERY_V8_PACKAGE_LOCK_PATH
  | typeof PHASE10_C0V_S6_RECOVERY_V9_PACKAGE_LOCK_PATH;
export type Phase10C0VS6ExecutionMode =
  | "supplemental-ap"
  | "radial-production"
  | "discrepancy-match-only"
  | "preimplementation-refusal"
  | "layer-publish"
  | "aggregate";
export type Phase10C0VS6CleanTerminalClass =
  | "packet-resource-refusal"
  | "scientific-fail"
  | "scientific-pass"
  | "scientific-refusal"
  | "structural-complete";
export type Phase10C0VS6LayerId = "C0V-RADIAL" | "C0V-MOVING-EVENT" | "C0V-STATIC";
export type Phase10C0VS6DispositionCode =
  | "production-complete"
  | "preproduction-artifact-refusal"
  | "prelaunch-resource-refusal"
  | "registered-cap-resource-refusal"
  | "reference-discrepancy-refusal"
  | "preimplementation-reference-refusal";
export type Phase10C0VS6DependencyDispositionCode = Phase10C0VS6DispositionCode | null;

export const PHASE10_C0V_S6_RADIAL_HEADER_OFFSETS = Object.freeze({
  magic: Object.freeze([0, 8] as const),
  formatVersion: Object.freeze([8, 12] as const),
  endiannessMarker: Object.freeze([12, 16] as const),
  schemaByteLength: Object.freeze([16, 20] as const),
  schema: Object.freeze([20, 49] as const),
  protocolSha256: Object.freeze([49, 81] as const),
  referenceSha256: Object.freeze([81, 113] as const),
  payloadByteLength: Object.freeze([113, 121] as const),
  payloadSha256: Object.freeze([121, 153] as const),
  payload: Object.freeze([153, 5891] as const),
});

export const PHASE10_C0V_S6_RADIAL_GLOBAL_FLOAT_NAMES = Object.freeze([
  "radiusM", "farRadiusM", "sigmaInfinity", "tempC", "pressurePa", "alphaHKConst",
  "kBoltzmannJPerK", "celsiusZeroK", "waterMoleculeMassKg", "iceNumberDensityPerM3",
  "diffusivityAir1AtmM2S", "standardAtmospherePa", "saturationPressurePrefactorMbar",
  "saturationPressureExponentK", "mbarToPa", "temperatureK", "saturationPressurePa",
  "saturationNumberDensityPerM3", "diffusivityM2S", "thermalSpeedMS", "kineticVelocityMS",
  "kineticLengthM",
] as const);

export const PHASE10_C0V_S6_RADIAL_CASE_ORDER = Object.freeze([
  "radial-dr-0p7um", "radial-dr-0p35um", "radial-dr-0p175um", "radial-dr-0p0875um",
] as const);

export const PHASE10_C0V_S6_RADIAL_CASE_SCALAR_NAMES = Object.freeze([
  "requestedSpacingM", "actualSpacingM", "sigmaSurface", "sigmaShell",
  "growthVelocityKineticMS", "growthVelocityFluxMS", "surfaceGradientPerM", "robinLeft",
  "robinRight", "robinResidual", "uniformSigmaSurface", "uniformSigmaShell",
  "uniformGrowthVelocityKineticMS", "uniformGrowthVelocityFluxMS", "uniformSurfaceGradientPerM",
  "uniformRobinLeft", "uniformRobinRight", "uniformRobinResidual",
] as const);

export const PHASE10_C0V_S6_RADIAL_SHARED_RUNTIME_CLOSURE_PATHS = Object.freeze([
  "runner/src/gate4-evidence.ts",
  "runner/src/phase10-c0v-contracts.ts",
  "runner/src/phase10-c0v-s6-contracts.ts",
  "runner/src/phase10-c0v-s6-execution-contracts.ts",
] as const);

export const PHASE10_C0V_S6_PACKAGE_STORAGE_BASELINE = Object.freeze([
  Object.freeze({ path: "evidence/phase10-numerical-verification-v1/c0v-moving-reference.json", byteLength: 81026, sha256: "5419efd63ba03822159e573708637265ff6f09653e061ee7a4932e09f34e6386" }),
  Object.freeze({ path: "evidence/phase10-numerical-verification-v1/c0v-radial-reference.json", byteLength: 449978, sha256: "60800ae66160deedd96f21ecb982301546153057892e8fa68faa54b6251f31e2" }),
  Object.freeze({ path: "evidence/phase10-numerical-verification-v1/c0v-static-reference-refusal.json", byteLength: 13381, sha256: "6e1e10c54f0262bcaf701996dfde52953b52afa9f9dc918b31daa1b680c179ea" }),
  Object.freeze({ path: "out/phase10-c0v-reference-v1/attempts/c0v-moving-reference-20260821-v1/reference-candidate.json", byteLength: 73290, sha256: "89ebd7d39b843208c3cc804735fbcba96da7457cf9c667ff5a927a86a5776698" }),
  Object.freeze({ path: "out/phase10-c0v-reference-v1/attempts/c0v-moving-reference-20260821-v1/targeted-check.json", byteLength: 6289, sha256: "e5477f6943b062501d172596fb8f4ac00409d6bc95728653635a0a47433b4396" }),
  Object.freeze({ path: "out/phase10-c0v-reference-v1/attempts/c0v-radial-reference-20260821-v1/reference-candidate.json", byteLength: 215555, sha256: "9189038d0789cb77ac19266b8cc373fa7f25912d1842fd8e8ba03ff3a782fb9e" }),
  Object.freeze({ path: "out/phase10-c0v-reference-v1/attempts/c0v-radial-reference-20260821-v1/targeted-check.json", byteLength: 233158, sha256: "d53401b2ae488b37528fbc4ea82616bc49d7b1ea87974caebcf3073a8cd22162" }),
  Object.freeze({ path: "out/phase10-c0v-reference-v1/attempts/c0v-static-refusal-20260821-v1/reference-candidate.json", byteLength: 8536, sha256: "e6b1c3d4f27e3b451330026662baafb9a52e8742205eecb0be502a502fb84b34" }),
  Object.freeze({ path: "out/phase10-c0v-reference-v1/attempts/c0v-static-refusal-20260821-v1/targeted-check.json", byteLength: 4189, sha256: "e7945d533d36c8a7a008e7af8eab2e62c8f47901e8d9cccf5a504b4ea361b334" }),
  Object.freeze({ path: "out/phase10-c0v-reference-v1/superseded/cf0bd8b6ad12c79e38cb30ca0e50bcadab9cc6d9/published/c0v-moving-reference.json", byteLength: 80816, sha256: "38c4b3c15fdc4b9a32a8fd0371d47485551c18bf33f6db4d33c70050fe86d4f6" }),
  Object.freeze({ path: "out/phase10-c0v-reference-v1/superseded/cf0bd8b6ad12c79e38cb30ca0e50bcadab9cc6d9/published/c0v-radial-reference.json", byteLength: 449978, sha256: "9c654673db42267bc3297bce0593f4ce8e655e275d3ce982d9362752c124dda4" }),
  Object.freeze({ path: "out/phase10-c0v-reference-v1/superseded/cf0bd8b6ad12c79e38cb30ca0e50bcadab9cc6d9/published/c0v-static-reference-refusal.json", byteLength: 13381, sha256: "181b1bd3eb144d5ec44e180241be31dc273af0db9b82586d76f7b489bd98e084" }),
] satisfies readonly Phase10C0VS6ArtifactIdentity[]);
export const PHASE10_C0V_S6_PACKAGE_STORAGE_BASELINE_BYTES = 1629577 as const;

export const PHASE10_C0V_S6_PREDECESSOR_IMPLEMENTATION_FREEZE_COMMIT =
  "27ca0dea801be026f6b3729d5d898a8856c42722" as const;
export const PHASE10_C0V_S6_PREDECESSOR_PACKET_CATALOGUE = Object.freeze({
  path: "research/phase10-execution-v2/packet-catalogue.json",
  byteLength: 14858,
  sha256: "f939389cbaa9e408c63caa40a77f45b8e2ce1c6fe686fc697cc9cc16ad4a31d1",
} as const satisfies Phase10C0VS6ArtifactIdentity);
export const PHASE10_C0V_S6_PREDECESSOR_AP_PROTOCOL = Object.freeze({
  path: "research/phase10-execution-v2/packets/a-p-c0v-s6/protocol.json",
  byteLength: 72689,
  sha256: "5885d5f7677e9da56374b56a62babaf29e69f90a29caf7684e51f0b31e995f96",
} as const satisfies Phase10C0VS6ArtifactIdentity);
export const PHASE10_C0V_S6_PREDECESSOR_LOCK_ARTIFACTS = Object.freeze([
  Object.freeze({
    path: PHASE10_C0V_S6_PREDECESSOR_PACKAGE_LOCK_PATH,
    byteLength: 220,
    sha256: "8275c6d47285db6d671c1f0f75ad0b45c2081164550a5e31f111f03ec1522bfe",
    parsedContent: Object.freeze({
      schema: "phase10-c0v-s6-lock-v1" as const,
      packetId: "phase10-c0v-s6-execution-v2-packet-paths-v1" as const,
      attemptId: "a-p-c0v-s6:a-p-c0v-s6-20260822-v1" as const,
      processId: 53684 as const,
      acquiredAt: "2026-08-24T09:01:39.426Z" as const,
    }),
  }),
  Object.freeze({
    path: PHASE10_C0V_S6_PREDECESSOR_AP_LOCK_PATH,
    byteLength: 176,
    sha256: "b9805c9142115822fa9f36dd89f702b79c5abf9ffb44688ffa9e3584d5981f02",
    parsedContent: Object.freeze({
      schema: "phase10-c0v-s6-lock-v1" as const,
      packetId: "a-p-c0v-s6" as const,
      attemptId: "a-p-c0v-s6-20260822-v1" as const,
      processId: 53684 as const,
      acquiredAt: "2026-08-24T09:01:39.430Z" as const,
    }),
  }),
] as const);
export const PHASE10_C0V_S6_PREDECESSOR_FINAL_ABSENCE_PATHS = Object.freeze([
  "evidence/phase10-obligation-preflight-v2/artifact-index.json",
  "evidence/phase10-obligation-preflight-v2/missing-producer.json",
  "evidence/phase10-obligation-preflight-v2/packets/a-p-c0v-s6/preflight.json",
  "evidence/phase10-obligation-preflight-v2/packets/a-p-c0v-s6/terminal-receipt.json",
  "evidence/phase10-obligation-preflight-v2/uncalled-check.json",
  "evidence/phase10-obligation-preflight-v2/verification.json",
] as const);
export const PHASE10_C0V_S6_PREDECESSOR_STAGE_ABSENCE_PATHS = Object.freeze(
  PHASE10_C0V_S6_PREDECESSOR_FINAL_ABSENCE_PATHS.map((path) =>
    `${path}.stage-a-p-c0v-s6-20260822-v1`),
);
export const PHASE10_C0V_S6_PREDECESSOR_GOVERNED_ABSENT_PATHS = Object.freeze([
  "out/phase10-execution-v2/attempts/a-p-c0v-s6",
  ...PHASE10_C0V_S6_PREDECESSOR_FINAL_ABSENCE_PATHS,
  ...PHASE10_C0V_S6_PREDECESSOR_STAGE_ABSENCE_PATHS,
] as const);
export const PHASE10_C0V_S6_RECOVERY_PACKAGE_STORAGE_BASELINE = Object.freeze([
  ...PHASE10_C0V_S6_PACKAGE_STORAGE_BASELINE,
  ...[...PHASE10_C0V_S6_PREDECESSOR_LOCK_ARTIFACTS]
    .sort((left, right) => left.path < right.path ? -1 : left.path > right.path ? 1 : 0)
    .map(({ parsedContent: _parsedContent, ...identity }) => Object.freeze(identity)),
] satisfies readonly Phase10C0VS6ArtifactIdentity[]);
export const PHASE10_C0V_S6_RECOVERY_PACKAGE_STORAGE_BASELINE_BYTES = 1629973 as const;

export const PHASE10_C0V_S6_RECOVERY_V2_PREDECESSOR_IMPLEMENTATION_FREEZE_COMMIT =
  "df24330f878bda8b73e58875127736ee1a21684d" as const;
export const PHASE10_C0V_S6_RECOVERY_V2_PREDECESSOR_RECOVERY_AUTHORITY = Object.freeze({
  path: PHASE10_C0V_S6_RECOVERY_AUTHORITY_PATH,
  byteLength: 3275,
  sha256: "99dbc8f12488c65bbdfbff0a441ea4abbbe0157c9e83885437fb4749a41f0f2d",
} as const satisfies Phase10C0VS6ArtifactIdentity);
export const PHASE10_C0V_S6_RECOVERY_V2_PREDECESSOR_PACKET_CATALOGUE = Object.freeze({
  path: PHASE10_C0V_S6_RECOVERY_PACKET_CATALOGUE_PATH,
  byteLength: 15513,
  sha256: "f7834a1c0b529ab749e1501cd2072e6ecfef736349e6d0356d376cd09579960c",
} as const satisfies Phase10C0VS6ArtifactIdentity);
export const PHASE10_C0V_S6_RECOVERY_V2_PREDECESSOR_AP_PROTOCOL = Object.freeze({
  path: `${PHASE10_C0V_S6_RECOVERY_AUTHORITY_ROOT}/packets/a-p-c0v-s6/protocol.json`,
  byteLength: 73429,
  sha256: "59b16e35ebd06d0a42a50ca524c5bad7a18aff2eee8a4e6955f93ea4e2c730b1",
} as const satisfies Phase10C0VS6ArtifactIdentity);
export const PHASE10_C0V_S6_RECOVERY_V2_PREDECESSOR_LOCK_ARTIFACTS = Object.freeze([
  ...PHASE10_C0V_S6_PREDECESSOR_LOCK_ARTIFACTS,
  Object.freeze({
    path: PHASE10_C0V_S6_RECOVERY_PACKAGE_LOCK_PATH,
    byteLength: 232,
    sha256: "40a72d4270b6128da9485ca2e25442b6dfeef484b5a9fc1799cc7e58e42cf6de",
    parsedContent: Object.freeze({
      schema: "phase10-c0v-s6-lock-v1" as const,
      packetId: PHASE10_C0V_S6_RECOVERY_PACKET_CATALOGUE_ID,
      attemptId: "a-p-c0v-s6:a-p-c0v-s6-20260822-v2" as const,
      processId: 50756 as const,
      acquiredAt: "2026-08-24T10:45:09.585Z" as const,
    }),
  }),
  Object.freeze({
    path: PHASE10_C0V_S6_RECOVERY_PACKET_LOCK_PATHS["a-p-c0v-s6"],
    byteLength: 176,
    sha256: "da26c79f92fb9be021fa25b2c790ad1f9b23f91123ecc47806e32b6fff1a4399",
    parsedContent: Object.freeze({
      schema: "phase10-c0v-s6-lock-v1" as const,
      packetId: "a-p-c0v-s6" as const,
      attemptId: "a-p-c0v-s6-20260822-v2" as const,
      processId: 50756 as const,
      acquiredAt: "2026-08-24T10:45:09.590Z" as const,
    }),
  }),
] as const);
export const PHASE10_C0V_S6_RECOVERY_V2_PREDECESSOR_ATTEMPT_ARTIFACTS = Object.freeze([
  Object.freeze({
    path: `${PHASE10_C0V_S6_RECOVERY_ATTEMPT_ROOT}/a-p-c0v-s6/a-p-c0v-s6-20260822-v2/exit-status.json`,
    byteLength: 257,
    sha256: "cea268a67888283d8d58b5e883f5a8211b9d4c8fbf7b56815f89147ff9c32ca9",
  }),
  Object.freeze({
    path: `${PHASE10_C0V_S6_RECOVERY_ATTEMPT_ROOT}/a-p-c0v-s6/a-p-c0v-s6-20260822-v2/freeze-evaluation.json`,
    byteLength: 26430,
    sha256: "fa1dfc06212a9098fa534057026077bdfec65f65cd3ca525c9cbec1c45635a48",
  }),
  Object.freeze({
    path: `${PHASE10_C0V_S6_RECOVERY_ATTEMPT_ROOT}/a-p-c0v-s6/a-p-c0v-s6-20260822-v2/stderr.log`,
    byteLength: 114,
    sha256: "35c5268b7e8244549f387d66ca7eff45bd0bf557aa4139468ab9fff127ab4d04",
  }),
  Object.freeze({
    path: `${PHASE10_C0V_S6_RECOVERY_ATTEMPT_ROOT}/a-p-c0v-s6/a-p-c0v-s6-20260822-v2/stdout.log`,
    byteLength: 0,
    sha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  }),
  Object.freeze({
    path: `${PHASE10_C0V_S6_RECOVERY_ATTEMPT_ROOT}/a-p-c0v-s6/a-p-c0v-s6-20260822-v2/worker-invocations.jsonl`,
    byteLength: 637,
    sha256: "8eeaab4d250ec6eec364a287d36471755d79c05633b2b55c9cf51678dc02afe8",
  }),
] as const satisfies readonly Phase10C0VS6ArtifactIdentity[]);
export const PHASE10_C0V_S6_RECOVERY_V2_PREDECESSOR_PUBLISHED_ARTIFACTS = Object.freeze([
  Object.freeze({
    path: "evidence/phase10-obligation-preflight-v2/packets/a-p-c0v-s6/preflight.json",
    byteLength: 36074,
    sha256: "06bd4544d42b0719846de4c3f8b3d547469dc895ace9ee3555dd5212deebdac6",
  }),
] as const satisfies readonly Phase10C0VS6ArtifactIdentity[]);
export const PHASE10_C0V_S6_RECOVERY_V2_PREDECESSOR_REMAINING_FINAL_ABSENCE_PATHS = Object.freeze(
  PHASE10_C0V_S6_PREDECESSOR_FINAL_ABSENCE_PATHS.filter((path) =>
    path !== PHASE10_C0V_S6_RECOVERY_V2_PREDECESSOR_PUBLISHED_ARTIFACTS[0].path),
);
export const PHASE10_C0V_S6_RECOVERY_V2_PREDECESSOR_REMAINING_STAGE_ABSENCE_PATHS = Object.freeze(
  PHASE10_C0V_S6_PREDECESSOR_FINAL_ABSENCE_PATHS.map((path) =>
    `${path}.stage-a-p-c0v-s6-20260822-v2`),
);
export const PHASE10_C0V_S6_RECOVERY_V2_FINAL_PATHS = Object.freeze([
  "evidence/phase10-obligation-preflight-v3/artifact-index.json",
  "evidence/phase10-obligation-preflight-v3/missing-producer.json",
  "evidence/phase10-obligation-preflight-v3/packets/a-p-c0v-s6/preflight.json",
  "evidence/phase10-obligation-preflight-v3/packets/a-p-c0v-s6/terminal-receipt.json",
  "evidence/phase10-obligation-preflight-v3/uncalled-check.json",
  "evidence/phase10-obligation-preflight-v3/verification.json",
] as const);
export const PHASE10_C0V_S6_RECOVERY_V2_STAGE_PATHS = Object.freeze(
  PHASE10_C0V_S6_RECOVERY_V2_FINAL_PATHS.map((path) =>
    `${path}.stage-a-p-c0v-s6-20260822-v3`),
);
export const PHASE10_C0V_S6_RECOVERY_V2_GOVERNED_ABSENT_PATHS = Object.freeze([
  ...PHASE10_C0V_S6_RECOVERY_V2_PREDECESSOR_REMAINING_FINAL_ABSENCE_PATHS,
  ...PHASE10_C0V_S6_RECOVERY_V2_PREDECESSOR_REMAINING_STAGE_ABSENCE_PATHS,
  PHASE10_C0V_S6_RECOVERY_V2_RUNTIME_ROOT,
  `${PHASE10_C0V_S6_RECOVERY_V2_ATTEMPT_ROOT}/a-p-c0v-s6`,
  ...PHASE10_C0V_S6_RECOVERY_V2_FINAL_PATHS,
  ...PHASE10_C0V_S6_RECOVERY_V2_STAGE_PATHS,
] as const);
export const PHASE10_C0V_S6_RECOVERY_V2_PACKAGE_STORAGE_BASELINE:
  readonly Phase10C0VS6ArtifactIdentity[] = Object.freeze([
  ...PHASE10_C0V_S6_RECOVERY_PACKAGE_STORAGE_BASELINE,
  ...PHASE10_C0V_S6_RECOVERY_V2_PREDECESSOR_ATTEMPT_ARTIFACTS,
  ...PHASE10_C0V_S6_RECOVERY_V2_PREDECESSOR_PUBLISHED_ARTIFACTS,
  ...PHASE10_C0V_S6_RECOVERY_V2_PREDECESSOR_LOCK_ARTIFACTS.slice(2)
    .map(({ parsedContent: _parsedContent, ...identity }) => Object.freeze(identity)),
].sort((left, right) => left.path < right.path ? -1 : left.path > right.path ? 1 : 0));
export const PHASE10_C0V_S6_RECOVERY_V2_PACKAGE_STORAGE_BASELINE_BYTES = 1693893 as const;

export const PHASE10_C0V_S6_RECOVERY_V3_PREDECESSOR_IMPLEMENTATION_FREEZE_COMMIT =
  "d670494b863484f6130d09915ce7ecae64b0d867" as const;
export const PHASE10_C0V_S6_RECOVERY_V3_PREDECESSOR_RECOVERY_AUTHORITY = Object.freeze({
  path: PHASE10_C0V_S6_RECOVERY_V2_AUTHORITY_PATH,
  byteLength: 7040,
  sha256: "b950f41ba55e2414948cc4c3cf8af14ec80fcedf816a7fcd9a8fc84a74b2294f",
} as const satisfies Phase10C0VS6ArtifactIdentity);
export const PHASE10_C0V_S6_RECOVERY_V3_PREDECESSOR_PACKET_CATALOGUE = Object.freeze({
  path: PHASE10_C0V_S6_RECOVERY_V2_PACKET_CATALOGUE_PATH,
  byteLength: 16104,
  sha256: "c746a176dc539dd8202a69851e8845964eb9bd131673ca6b3e46bbabd76c0bc6",
} as const satisfies Phase10C0VS6ArtifactIdentity);
export const PHASE10_C0V_S6_RECOVERY_V3_PREDECESSOR_AP_PROTOCOL = Object.freeze({
  path: `${PHASE10_C0V_S6_RECOVERY_V2_AUTHORITY_ROOT}/packets/a-p-c0v-s6/protocol.json`,
  byteLength: 75334,
  sha256: "4ce0aa90a7e66e3d45a1e6f3be3fe2caaf55c8434cc61dad68164bedffaf29e4",
} as const satisfies Phase10C0VS6ArtifactIdentity);
export const PHASE10_C0V_S6_RECOVERY_V3_PREDECESSOR_LOCK_ARTIFACTS = Object.freeze([
  ...PHASE10_C0V_S6_RECOVERY_V2_PREDECESSOR_LOCK_ARTIFACTS,
  Object.freeze({
    path: PHASE10_C0V_S6_RECOVERY_V2_PACKAGE_LOCK_PATH,
    byteLength: 232,
    sha256: "d60b3dc3801d35673f0a3be2cd7816905112348e415cff80eaeda370c9e90424",
    parsedContent: Object.freeze({
      schema: "phase10-c0v-s6-lock-v1" as const,
      packetId: PHASE10_C0V_S6_RECOVERY_V2_PACKET_CATALOGUE_ID,
      attemptId: "a-p-c0v-s6:a-p-c0v-s6-20260822-v3" as const,
      processId: 51264 as const,
      acquiredAt: "2026-08-24T12:15:10.034Z" as const,
    }),
  }),
  Object.freeze({
    path: PHASE10_C0V_S6_RECOVERY_V2_PACKET_LOCK_PATHS["a-p-c0v-s6"],
    byteLength: 176,
    sha256: "b163ff257442dcee2489b619c6f7be61b2f3ceb8e03bfaca89cd0a6eaa34f93d",
    parsedContent: Object.freeze({
      schema: "phase10-c0v-s6-lock-v1" as const,
      packetId: "a-p-c0v-s6" as const,
      attemptId: "a-p-c0v-s6-20260822-v3" as const,
      processId: 51264 as const,
      acquiredAt: "2026-08-24T12:15:10.038Z" as const,
    }),
  }),
] as const);
export const PHASE10_C0V_S6_RECOVERY_V3_PREDECESSOR_ATTEMPT_ARTIFACTS = Object.freeze([
  ...PHASE10_C0V_S6_RECOVERY_V2_PREDECESSOR_ATTEMPT_ARTIFACTS,
  Object.freeze({
    path: `${PHASE10_C0V_S6_RECOVERY_V2_ATTEMPT_ROOT}/a-p-c0v-s6/a-p-c0v-s6-20260822-v3/candidate/artifact-index.json`,
    byteLength: 13210,
    sha256: "ca677825c471a5311062bd160231a5828c05fc17ceac1c3e0f2d20d10f82d0f7",
  }),
  Object.freeze({
    path: `${PHASE10_C0V_S6_RECOVERY_V2_ATTEMPT_ROOT}/a-p-c0v-s6/a-p-c0v-s6-20260822-v3/candidate/missing-producer.json`,
    byteLength: 30741,
    sha256: "0341289d0bd4431847609713f5ffc0a99d063fe6a13a8940d7536b28e864acff",
  }),
  Object.freeze({
    path: `${PHASE10_C0V_S6_RECOVERY_V2_ATTEMPT_ROOT}/a-p-c0v-s6/a-p-c0v-s6-20260822-v3/candidate/uncalled-check.json`,
    byteLength: 31382,
    sha256: "b62d26663cf8d7ed95eecbedbd2db2a7491bd3fcb3a3e9c5b4939b9e22059996",
  }),
  Object.freeze({
    path: `${PHASE10_C0V_S6_RECOVERY_V2_ATTEMPT_ROOT}/a-p-c0v-s6/a-p-c0v-s6-20260822-v3/exit-status.json`,
    byteLength: 243,
    sha256: "547f4797edc9f68964caa68e58375a10bd2c983b8b68dba5f14fed2556006f12",
  }),
  Object.freeze({
    path: `${PHASE10_C0V_S6_RECOVERY_V2_ATTEMPT_ROOT}/a-p-c0v-s6/a-p-c0v-s6-20260822-v3/freeze-evaluation.json`,
    byteLength: 27280,
    sha256: "8ca2c8806f56c84bdc20718cc3a95cb96e1ab9ec6e7e82db1c814f5bb759057a",
  }),
  Object.freeze({
    path: `${PHASE10_C0V_S6_RECOVERY_V2_ATTEMPT_ROOT}/a-p-c0v-s6/a-p-c0v-s6-20260822-v3/stderr.log`,
    byteLength: 0,
    sha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  }),
  Object.freeze({
    path: `${PHASE10_C0V_S6_RECOVERY_V2_ATTEMPT_ROOT}/a-p-c0v-s6/a-p-c0v-s6-20260822-v3/stdout.log`,
    byteLength: 283304,
    sha256: "a2e83c042fc5bfdb6025a8e5b3ba557284a7e95029a472d192a4aa9042b873b2",
  }),
  Object.freeze({
    path: `${PHASE10_C0V_S6_RECOVERY_V2_ATTEMPT_ROOT}/a-p-c0v-s6/a-p-c0v-s6-20260822-v3/worker-invocations.jsonl`,
    byteLength: 3903,
    sha256: "0559ded5fd38f56b9451389b3ea3d65c5fe8bb478b7044cb671eec214c61f244",
  }),
] as const satisfies readonly Phase10C0VS6ArtifactIdentity[]);
export const PHASE10_C0V_S6_RECOVERY_V3_PREDECESSOR_PUBLISHED_ARTIFACTS = Object.freeze([
  ...PHASE10_C0V_S6_RECOVERY_V2_PREDECESSOR_PUBLISHED_ARTIFACTS,
  Object.freeze({
    path: "evidence/phase10-obligation-preflight-v3/packets/a-p-c0v-s6/preflight.json",
    byteLength: 38701,
    sha256: "dd7d897043313fbfd439a264fb8435fe5c3e736e078aa7db8e84a5980826ed36",
  }),
] as const satisfies readonly Phase10C0VS6ArtifactIdentity[]);
export const PHASE10_C0V_S6_RECOVERY_V3_PREDECESSOR_REMAINING_FINAL_ABSENCE_PATHS = Object.freeze([
  ...PHASE10_C0V_S6_RECOVERY_V2_PREDECESSOR_REMAINING_FINAL_ABSENCE_PATHS,
  ...PHASE10_C0V_S6_RECOVERY_V2_FINAL_PATHS.filter((path) =>
    path !== PHASE10_C0V_S6_RECOVERY_V3_PREDECESSOR_PUBLISHED_ARTIFACTS[1].path),
] as const);
export const PHASE10_C0V_S6_RECOVERY_V3_PREDECESSOR_REMAINING_STAGE_ABSENCE_PATHS = Object.freeze([
  ...PHASE10_C0V_S6_RECOVERY_V2_PREDECESSOR_REMAINING_STAGE_ABSENCE_PATHS,
  ...PHASE10_C0V_S6_RECOVERY_V2_STAGE_PATHS,
] as const);
export const PHASE10_C0V_S6_RECOVERY_V3_PREDECESSOR_GOVERNED_ABSENT_PATHS = Object.freeze([
  ...PHASE10_C0V_S6_RECOVERY_V2_PREDECESSOR_REMAINING_FINAL_ABSENCE_PATHS,
  ...PHASE10_C0V_S6_RECOVERY_V2_PREDECESSOR_REMAINING_STAGE_ABSENCE_PATHS,
  ...PHASE10_C0V_S6_RECOVERY_V2_FINAL_PATHS.filter((path) =>
    path !== PHASE10_C0V_S6_RECOVERY_V3_PREDECESSOR_PUBLISHED_ARTIFACTS[1].path),
  ...PHASE10_C0V_S6_RECOVERY_V2_STAGE_PATHS,
] as const);
export const PHASE10_C0V_S6_RECOVERY_V3_FINAL_PATHS = Object.freeze([
  "evidence/phase10-obligation-preflight-v4/artifact-index.json",
  "evidence/phase10-obligation-preflight-v4/missing-producer.json",
  "evidence/phase10-obligation-preflight-v4/packets/a-p-c0v-s6/preflight.json",
  "evidence/phase10-obligation-preflight-v4/packets/a-p-c0v-s6/terminal-receipt.json",
  "evidence/phase10-obligation-preflight-v4/uncalled-check.json",
  "evidence/phase10-obligation-preflight-v4/verification.json",
] as const);
export const PHASE10_C0V_S6_RECOVERY_V3_STAGE_PATHS = Object.freeze(
  PHASE10_C0V_S6_RECOVERY_V3_FINAL_PATHS.map((path) =>
    `${path}.stage-a-p-c0v-s6-20260822-v4`),
);
export const PHASE10_C0V_S6_RECOVERY_V3_GOVERNED_ABSENT_PATHS = Object.freeze([
  ...PHASE10_C0V_S6_RECOVERY_V3_PREDECESSOR_GOVERNED_ABSENT_PATHS,
  PHASE10_C0V_S6_RECOVERY_V3_RUNTIME_ROOT,
  ...PHASE10_C0V_S6_RECOVERY_V3_FINAL_PATHS,
  ...PHASE10_C0V_S6_RECOVERY_V3_STAGE_PATHS,
] as const);
export const PHASE10_C0V_S6_RECOVERY_V3_RETAINED_BYTES = 493488 as const;
export const PHASE10_C0V_S6_RECOVERY_V3_CREDITED_GOVERNED_ELAPSED_NANOSECONDS =
  125289842000 as const;
export const PHASE10_C0V_S6_RECOVERY_V3_PACKAGE_STORAGE_BASELINE:
  readonly Phase10C0VS6ArtifactIdentity[] = Object.freeze([
  ...PHASE10_C0V_S6_RECOVERY_V2_PACKAGE_STORAGE_BASELINE,
  ...PHASE10_C0V_S6_RECOVERY_V3_PREDECESSOR_ATTEMPT_ARTIFACTS.slice(
    PHASE10_C0V_S6_RECOVERY_V2_PREDECESSOR_ATTEMPT_ARTIFACTS.length,
  ),
  ...PHASE10_C0V_S6_RECOVERY_V3_PREDECESSOR_PUBLISHED_ARTIFACTS.slice(
    PHASE10_C0V_S6_RECOVERY_V2_PREDECESSOR_PUBLISHED_ARTIFACTS.length,
  ),
  ...PHASE10_C0V_S6_RECOVERY_V3_PREDECESSOR_LOCK_ARTIFACTS.slice(4)
    .map(({ parsedContent: _parsedContent, ...identity }) => Object.freeze(identity)),
].sort((left, right) => left.path < right.path ? -1 : left.path > right.path ? 1 : 0));
export const PHASE10_C0V_S6_RECOVERY_V3_PACKAGE_STORAGE_BASELINE_BYTES = 2123065 as const;

export const PHASE10_C0V_S6_RECOVERY_V4_PREDECESSOR_IMPLEMENTATION_FREEZE_COMMIT =
  "4286c613df99f3d4c83652a008db5cde2f8a22e8" as const;
export const PHASE10_C0V_S6_RECOVERY_V4_PREDECESSOR_RECOVERY_AUTHORITY = Object.freeze({
  path: PHASE10_C0V_S6_RECOVERY_V3_AUTHORITY_PATH,
  byteLength: 11096,
  sha256: "1164764dc41712210bac1f9c5d8c1a742343c1e077159d76461332efa54d24b4",
} as const satisfies Phase10C0VS6ArtifactIdentity);
export const PHASE10_C0V_S6_RECOVERY_V4_PREDECESSOR_PACKET_CATALOGUE = Object.freeze({
  path: PHASE10_C0V_S6_RECOVERY_V3_PACKET_CATALOGUE_PATH,
  byteLength: 16104,
  sha256: "94001263d722fb95cdee6a1332c0718f055a0d5932c54b2cc0fa467e99b25a10",
} as const satisfies Phase10C0VS6ArtifactIdentity);
export const PHASE10_C0V_S6_RECOVERY_V4_PREDECESSOR_AP_PROTOCOL = Object.freeze({
  path: `${PHASE10_C0V_S6_RECOVERY_V3_AUTHORITY_ROOT}/packets/a-p-c0v-s6/protocol.json`,
  byteLength: 77983,
  sha256: "acb2e94a3aad2e34a6b89e75b565a68ce44def1df89c4a649fd3b5a9bfc70f6c",
} as const satisfies Phase10C0VS6ArtifactIdentity);
export const PHASE10_C0V_S6_RECOVERY_V4_PREDECESSOR_LOCK_ARTIFACTS = Object.freeze([
  ...PHASE10_C0V_S6_RECOVERY_V3_PREDECESSOR_LOCK_ARTIFACTS,
  Object.freeze({
    path: PHASE10_C0V_S6_RECOVERY_V3_PACKAGE_LOCK_PATH,
    byteLength: 232,
    sha256: "e305f40956a4076a8e45c15339fc34026288310fe34c5283f5d19496ef1f6543",
    parsedContent: Object.freeze({
      schema: "phase10-c0v-s6-lock-v1" as const,
      packetId: PHASE10_C0V_S6_RECOVERY_V3_PACKET_CATALOGUE_ID,
      attemptId: "a-p-c0v-s6:a-p-c0v-s6-20260822-v4" as const,
      processId: 49520 as const,
      acquiredAt: "2026-08-24T14:08:16.311Z" as const,
    }),
  }),
  Object.freeze({
    path: PHASE10_C0V_S6_RECOVERY_V3_PACKET_LOCK_PATHS["a-p-c0v-s6"],
    byteLength: 176,
    sha256: "90b1e66219e4ecfde43ebb96101164991444faea1021fa17ec621ef3e964e2ef",
    parsedContent: Object.freeze({
      schema: "phase10-c0v-s6-lock-v1" as const,
      packetId: "a-p-c0v-s6" as const,
      attemptId: "a-p-c0v-s6-20260822-v4" as const,
      processId: 49520 as const,
      acquiredAt: "2026-08-24T14:08:16.315Z" as const,
    }),
  }),
] as const);
export const PHASE10_C0V_S6_RECOVERY_V4_PREDECESSOR_ATTEMPT_ARTIFACTS = Object.freeze([
  ...PHASE10_C0V_S6_RECOVERY_V3_PREDECESSOR_ATTEMPT_ARTIFACTS,
  Object.freeze({
    path: `${PHASE10_C0V_S6_RECOVERY_V3_ATTEMPT_ROOT}/a-p-c0v-s6/a-p-c0v-s6-20260822-v4/candidate/artifact-index.json`,
    byteLength: 13211,
    sha256: "58f0262ebb5d98af09ed96f336a285458e83f172741a2dce85ead4b9e740514c",
  }),
  Object.freeze({
    path: `${PHASE10_C0V_S6_RECOVERY_V3_ATTEMPT_ROOT}/a-p-c0v-s6/a-p-c0v-s6-20260822-v4/candidate/missing-producer.json`,
    byteLength: 30741,
    sha256: "4f02570b34cb17aeb883bd5f3f384c5dbd577e3b614b6c0c480d3ef655bcc76d",
  }),
  Object.freeze({
    path: `${PHASE10_C0V_S6_RECOVERY_V3_ATTEMPT_ROOT}/a-p-c0v-s6/a-p-c0v-s6-20260822-v4/candidate/uncalled-check.json`,
    byteLength: 31382,
    sha256: "8279c4a6dce6fd3eeb2a0a7212e2830b259007460bf216bdcfccb1d6ec6153b7",
  }),
  Object.freeze({
    path: `${PHASE10_C0V_S6_RECOVERY_V3_ATTEMPT_ROOT}/a-p-c0v-s6/a-p-c0v-s6-20260822-v4/exit-status.json`,
    byteLength: 243,
    sha256: "1e9884cd1632148532bf0f48839bd07671363452edbe8ad90a41f12980d58b3a",
  }),
  Object.freeze({
    path: `${PHASE10_C0V_S6_RECOVERY_V3_ATTEMPT_ROOT}/a-p-c0v-s6/a-p-c0v-s6-20260822-v4/freeze-evaluation.json`,
    byteLength: 28131,
    sha256: "8fbdf83b3b46c3bf31dd57b45a3b38c96655a7103e2f5b30a74bf36a546a1f5a",
  }),
  Object.freeze({
    path: `${PHASE10_C0V_S6_RECOVERY_V3_ATTEMPT_ROOT}/a-p-c0v-s6/a-p-c0v-s6-20260822-v4/stderr.log`,
    byteLength: 0,
    sha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  }),
  Object.freeze({
    path: `${PHASE10_C0V_S6_RECOVERY_V3_ATTEMPT_ROOT}/a-p-c0v-s6/a-p-c0v-s6-20260822-v4/stdout.log`,
    byteLength: 283305,
    sha256: "f44912834fece99c439629ded32efe4eb793e15564c1724021233f7a25f32e5b",
  }),
  Object.freeze({
    path: `${PHASE10_C0V_S6_RECOVERY_V3_ATTEMPT_ROOT}/a-p-c0v-s6/a-p-c0v-s6-20260822-v4/worker-invocations.jsonl`,
    byteLength: 3903,
    sha256: "7630a2392754401d4e71da36998c9c002e4878e2fe12313b0815ca3714133435",
  }),
] as const satisfies readonly Phase10C0VS6ArtifactIdentity[]);
export const PHASE10_C0V_S6_RECOVERY_V4_PREDECESSOR_PUBLISHED_ARTIFACTS = Object.freeze([
  ...PHASE10_C0V_S6_RECOVERY_V3_PREDECESSOR_PUBLISHED_ARTIFACTS,
  Object.freeze({
    path: "evidence/phase10-obligation-preflight-v4/packets/a-p-c0v-s6/preflight.json",
    byteLength: 42189,
    sha256: "131f576278df328896c761de9a204f11967804410efe67b68ed1efc971a4a025",
  }),
] as const satisfies readonly Phase10C0VS6ArtifactIdentity[]);
export const PHASE10_C0V_S6_RECOVERY_V4_PREDECESSOR_REMAINING_FINAL_ABSENCE_PATHS = Object.freeze([
  ...PHASE10_C0V_S6_RECOVERY_V3_PREDECESSOR_REMAINING_FINAL_ABSENCE_PATHS,
  ...PHASE10_C0V_S6_RECOVERY_V3_FINAL_PATHS.filter((path) =>
    path !== PHASE10_C0V_S6_RECOVERY_V4_PREDECESSOR_PUBLISHED_ARTIFACTS[2].path),
] as const);
export const PHASE10_C0V_S6_RECOVERY_V4_PREDECESSOR_REMAINING_STAGE_ABSENCE_PATHS = Object.freeze([
  ...PHASE10_C0V_S6_RECOVERY_V3_PREDECESSOR_REMAINING_STAGE_ABSENCE_PATHS,
  ...PHASE10_C0V_S6_RECOVERY_V3_STAGE_PATHS,
] as const);
export const PHASE10_C0V_S6_RECOVERY_V4_PREDECESSOR_GOVERNED_ABSENT_PATHS = Object.freeze([
  ...PHASE10_C0V_S6_RECOVERY_V3_PREDECESSOR_GOVERNED_ABSENT_PATHS,
  ...PHASE10_C0V_S6_RECOVERY_V3_FINAL_PATHS.filter((path) =>
    path !== PHASE10_C0V_S6_RECOVERY_V4_PREDECESSOR_PUBLISHED_ARTIFACTS[2].path),
  ...PHASE10_C0V_S6_RECOVERY_V3_STAGE_PATHS,
] as const);
export const PHASE10_C0V_S6_RECOVERY_V4_FINAL_PATHS = Object.freeze([
  "evidence/phase10-obligation-preflight-v5/artifact-index.json",
  "evidence/phase10-obligation-preflight-v5/missing-producer.json",
  "evidence/phase10-obligation-preflight-v5/packets/a-p-c0v-s6/preflight.json",
  "evidence/phase10-obligation-preflight-v5/packets/a-p-c0v-s6/terminal-receipt.json",
  "evidence/phase10-obligation-preflight-v5/uncalled-check.json",
  "evidence/phase10-obligation-preflight-v5/verification.json",
] as const);
export const PHASE10_C0V_S6_RECOVERY_V4_STAGE_PATHS = Object.freeze(
  PHASE10_C0V_S6_RECOVERY_V4_FINAL_PATHS.map((path) =>
    `${path}.stage-a-p-c0v-s6-20260822-v5`),
);
export const PHASE10_C0V_S6_RECOVERY_V4_GOVERNED_ABSENT_PATHS = Object.freeze([
  ...PHASE10_C0V_S6_RECOVERY_V4_PREDECESSOR_GOVERNED_ABSENT_PATHS,
  PHASE10_C0V_S6_RECOVERY_V4_RUNTIME_ROOT,
  ...PHASE10_C0V_S6_RECOVERY_V4_FINAL_PATHS,
  ...PHASE10_C0V_S6_RECOVERY_V4_STAGE_PATHS,
] as const);
export const PHASE10_C0V_S6_RECOVERY_V4_RETAINED_BYTES = 927001 as const;
export const PHASE10_C0V_S6_RECOVERY_V4_CREDITED_GOVERNED_ELAPSED_NANOSECONDS =
  131997897300 as const;
export const PHASE10_C0V_S6_RECOVERY_V4_PACKAGE_CARRY_FORWARD_ELAPSED_NANOSECONDS =
  257287739300 as const;
export const PHASE10_C0V_S6_RECOVERY_V4_PACKAGE_STORAGE_BASELINE:
  readonly Phase10C0VS6ArtifactIdentity[] = Object.freeze([
  ...PHASE10_C0V_S6_RECOVERY_V3_PACKAGE_STORAGE_BASELINE,
  ...PHASE10_C0V_S6_RECOVERY_V4_PREDECESSOR_ATTEMPT_ARTIFACTS.slice(
    PHASE10_C0V_S6_RECOVERY_V3_PREDECESSOR_ATTEMPT_ARTIFACTS.length,
  ),
  ...PHASE10_C0V_S6_RECOVERY_V4_PREDECESSOR_PUBLISHED_ARTIFACTS.slice(
    PHASE10_C0V_S6_RECOVERY_V3_PREDECESSOR_PUBLISHED_ARTIFACTS.length,
  ),
  ...PHASE10_C0V_S6_RECOVERY_V4_PREDECESSOR_LOCK_ARTIFACTS.slice(6)
    .map(({ parsedContent: _parsedContent, ...identity }) => Object.freeze(identity)),
].sort((left, right) => left.path < right.path ? -1 : left.path > right.path ? 1 : 0));
export const PHASE10_C0V_S6_RECOVERY_V4_PACKAGE_STORAGE_BASELINE_BYTES = 2556578 as const;

export const PHASE10_C0V_S6_RECOVERY_V5_PREDECESSOR_IMPLEMENTATION_FREEZE_COMMIT =
  "7ff83eaf9312ebc3bf23d6f5ef5a56d6f65a912a" as const;
export const PHASE10_C0V_S6_RECOVERY_V5_PREDECESSOR_RECOVERY_AUTHORITY = Object.freeze({
  path: PHASE10_C0V_S6_RECOVERY_V4_AUTHORITY_PATH,
  byteLength: 15144,
  sha256: "d4589800fa2f49a25e75012498397f377d3fa69ca5f7127985ed97eb7513a1f7",
} as const satisfies Phase10C0VS6ArtifactIdentity);
export const PHASE10_C0V_S6_RECOVERY_V5_PREDECESSOR_PACKET_CATALOGUE = Object.freeze({
  path: PHASE10_C0V_S6_RECOVERY_V4_PACKET_CATALOGUE_PATH,
  byteLength: 16104,
  sha256: "35ca2463f2f6fc0668c32144a59081d2243f783d1d3b1b55d34baff720b9ed30",
} as const satisfies Phase10C0VS6ArtifactIdentity);
export const PHASE10_C0V_S6_RECOVERY_V5_PREDECESSOR_AP_PROTOCOL = Object.freeze({
  path: `${PHASE10_C0V_S6_RECOVERY_V4_AUTHORITY_ROOT}/packets/a-p-c0v-s6/protocol.json`,
  byteLength: 80632,
  sha256: "d332a7b113d56fa5f9a1f278ab4491837efba2b55ead7929d78c4d20399ff94c",
} as const satisfies Phase10C0VS6ArtifactIdentity);
export const PHASE10_C0V_S6_RECOVERY_V5_PREDECESSOR_LOCK_ARTIFACTS = Object.freeze([
  ...PHASE10_C0V_S6_RECOVERY_V4_PREDECESSOR_LOCK_ARTIFACTS,
  Object.freeze({
    path: PHASE10_C0V_S6_RECOVERY_V4_PACKAGE_LOCK_PATH,
    byteLength: 232,
    sha256: "f13f46397b7e47dae02777d9d4acc9495a7db57dd520c856366d9f12dd9c44f6",
    parsedContent: Object.freeze({
      schema: "phase10-c0v-s6-lock-v1" as const,
      packetId: PHASE10_C0V_S6_RECOVERY_V4_PACKET_CATALOGUE_ID,
      attemptId: "a-p-c0v-s6:a-p-c0v-s6-20260822-v5" as const,
      processId: 41460 as const,
      acquiredAt: "2026-08-24T15:41:09.953Z" as const,
    }),
  }),
  Object.freeze({
    path: PHASE10_C0V_S6_RECOVERY_V4_PACKET_LOCK_PATHS["a-p-c0v-s6"],
    byteLength: 176,
    sha256: "42ef915d09fabfffc810a2852f4db1d63847b60a942f5fe690a3e304b7c26d20",
    parsedContent: Object.freeze({
      schema: "phase10-c0v-s6-lock-v1" as const,
      packetId: "a-p-c0v-s6" as const,
      attemptId: "a-p-c0v-s6-20260822-v5" as const,
      processId: 41460 as const,
      acquiredAt: "2026-08-24T15:41:09.957Z" as const,
    }),
  }),
] as const);
export const PHASE10_C0V_S6_RECOVERY_V5_PREDECESSOR_ATTEMPT_ARTIFACTS = Object.freeze([
  ...PHASE10_C0V_S6_RECOVERY_V4_PREDECESSOR_ATTEMPT_ARTIFACTS,
  Object.freeze({
    path: `${PHASE10_C0V_S6_RECOVERY_V4_ATTEMPT_ROOT}/a-p-c0v-s6/a-p-c0v-s6-20260822-v5/candidate/artifact-index.json`,
    byteLength: 13211,
    sha256: "910b3f92f0e35b2a82735a03e41771327ae6e97b44557a7e0d1271e4c5624e0a",
  }),
  Object.freeze({
    path: `${PHASE10_C0V_S6_RECOVERY_V4_ATTEMPT_ROOT}/a-p-c0v-s6/a-p-c0v-s6-20260822-v5/candidate/missing-producer.json`,
    byteLength: 30741,
    sha256: "8e4b2936dfd8ffd6b2c262f388f962b8b81045d788b43db6b12fbe4903e8f31c",
  }),
  Object.freeze({
    path: `${PHASE10_C0V_S6_RECOVERY_V4_ATTEMPT_ROOT}/a-p-c0v-s6/a-p-c0v-s6-20260822-v5/candidate/uncalled-check.json`,
    byteLength: 31382,
    sha256: "28e9546598da3cec5dfc09a0c5de207fea2f0e513d57df5f6a23f2814a7fd6f2",
  }),
  Object.freeze({
    path: `${PHASE10_C0V_S6_RECOVERY_V4_ATTEMPT_ROOT}/a-p-c0v-s6/a-p-c0v-s6-20260822-v5/exit-status.json`,
    byteLength: 243,
    sha256: "a63e702621d100b4b7a87586b98474743f01b4d7926881c98fb2552adcf38ae5",
  }),
  Object.freeze({
    path: `${PHASE10_C0V_S6_RECOVERY_V4_ATTEMPT_ROOT}/a-p-c0v-s6/a-p-c0v-s6-20260822-v5/freeze-evaluation.json`,
    byteLength: 28982,
    sha256: "56a2c2b7f18c4dd04a842681d405ece360d21f1060f6795ea1a17b67bd6e9cfd",
  }),
  Object.freeze({
    path: `${PHASE10_C0V_S6_RECOVERY_V4_ATTEMPT_ROOT}/a-p-c0v-s6/a-p-c0v-s6-20260822-v5/stderr.log`,
    byteLength: 0,
    sha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  }),
  Object.freeze({
    path: `${PHASE10_C0V_S6_RECOVERY_V4_ATTEMPT_ROOT}/a-p-c0v-s6/a-p-c0v-s6-20260822-v5/stdout.log`,
    byteLength: 283305,
    sha256: "c604aeee1c187577a0637583831345df9f2f83aca5f358baa19fb4a02e2e7915",
  }),
  Object.freeze({
    path: `${PHASE10_C0V_S6_RECOVERY_V4_ATTEMPT_ROOT}/a-p-c0v-s6/a-p-c0v-s6-20260822-v5/worker-invocations.jsonl`,
    byteLength: 3903,
    sha256: "8e0aae815890654b6e71320d6a95fd5f065e419952994c5a72eee58fb39070e4",
  }),
] as const satisfies readonly Phase10C0VS6ArtifactIdentity[]);
export const PHASE10_C0V_S6_RECOVERY_V5_PREDECESSOR_PUBLISHED_ARTIFACTS = Object.freeze([
  ...PHASE10_C0V_S6_RECOVERY_V4_PREDECESSOR_PUBLISHED_ARTIFACTS,
  Object.freeze({
    path: "evidence/phase10-obligation-preflight-v5/packets/a-p-c0v-s6/preflight.json",
    byteLength: 45634,
    sha256: "5810af1e49041134ae8de171c4219b3fc0293b91922be63aa7249a23f6090f0a",
  }),
] as const satisfies readonly Phase10C0VS6ArtifactIdentity[]);
export const PHASE10_C0V_S6_RECOVERY_V5_PREDECESSOR_REMAINING_FINAL_ABSENCE_PATHS = Object.freeze([
  ...PHASE10_C0V_S6_RECOVERY_V4_PREDECESSOR_REMAINING_FINAL_ABSENCE_PATHS,
  ...PHASE10_C0V_S6_RECOVERY_V4_FINAL_PATHS.filter((path) =>
    path !== PHASE10_C0V_S6_RECOVERY_V5_PREDECESSOR_PUBLISHED_ARTIFACTS[3].path),
] as const);
export const PHASE10_C0V_S6_RECOVERY_V5_PREDECESSOR_REMAINING_STAGE_ABSENCE_PATHS = Object.freeze([
  ...PHASE10_C0V_S6_RECOVERY_V4_PREDECESSOR_REMAINING_STAGE_ABSENCE_PATHS,
  ...PHASE10_C0V_S6_RECOVERY_V4_STAGE_PATHS,
] as const);
export const PHASE10_C0V_S6_RECOVERY_V5_PREDECESSOR_GOVERNED_ABSENT_PATHS = Object.freeze([
  ...PHASE10_C0V_S6_RECOVERY_V4_PREDECESSOR_GOVERNED_ABSENT_PATHS,
  ...PHASE10_C0V_S6_RECOVERY_V4_FINAL_PATHS.filter((path) =>
    path !== PHASE10_C0V_S6_RECOVERY_V5_PREDECESSOR_PUBLISHED_ARTIFACTS[3].path),
  ...PHASE10_C0V_S6_RECOVERY_V4_STAGE_PATHS,
] as const);
export const PHASE10_C0V_S6_RECOVERY_V5_FINAL_PATHS = Object.freeze([
  "evidence/phase10-obligation-preflight-v6/artifact-index.json",
  "evidence/phase10-obligation-preflight-v6/missing-producer.json",
  "evidence/phase10-obligation-preflight-v6/packets/a-p-c0v-s6/preflight.json",
  "evidence/phase10-obligation-preflight-v6/packets/a-p-c0v-s6/terminal-receipt.json",
  "evidence/phase10-obligation-preflight-v6/uncalled-check.json",
  "evidence/phase10-obligation-preflight-v6/verification.json",
] as const);
export const PHASE10_C0V_S6_RECOVERY_V5_STAGE_PATHS = Object.freeze(
  PHASE10_C0V_S6_RECOVERY_V5_FINAL_PATHS.map((path) =>
    `${path}.stage-a-p-c0v-s6-20260822-v6`),
);
export const PHASE10_C0V_S6_RECOVERY_V5_GOVERNED_ABSENT_PATHS = Object.freeze([
  ...PHASE10_C0V_S6_RECOVERY_V5_PREDECESSOR_GOVERNED_ABSENT_PATHS,
  PHASE10_C0V_S6_RECOVERY_V5_RUNTIME_ROOT,
  ...PHASE10_C0V_S6_RECOVERY_V5_FINAL_PATHS,
  ...PHASE10_C0V_S6_RECOVERY_V5_STAGE_PATHS,
] as const);
export const PHASE10_C0V_S6_RECOVERY_V5_RETAINED_BYTES = 1364810 as const;
export const PHASE10_C0V_S6_RECOVERY_V5_CREDITED_GOVERNED_ELAPSED_NANOSECONDS =
  133870512700 as const;
export const PHASE10_C0V_S6_RECOVERY_V5_PACKAGE_CARRY_FORWARD_ELAPSED_NANOSECONDS =
  391158252000 as const;
export const PHASE10_C0V_S6_RECOVERY_V5_PACKAGE_STORAGE_BASELINE:
  readonly Phase10C0VS6ArtifactIdentity[] = Object.freeze([
  ...PHASE10_C0V_S6_RECOVERY_V4_PACKAGE_STORAGE_BASELINE,
  ...PHASE10_C0V_S6_RECOVERY_V5_PREDECESSOR_ATTEMPT_ARTIFACTS.slice(
    PHASE10_C0V_S6_RECOVERY_V4_PREDECESSOR_ATTEMPT_ARTIFACTS.length,
  ),
  ...PHASE10_C0V_S6_RECOVERY_V5_PREDECESSOR_PUBLISHED_ARTIFACTS.slice(
    PHASE10_C0V_S6_RECOVERY_V4_PREDECESSOR_PUBLISHED_ARTIFACTS.length,
  ),
  ...PHASE10_C0V_S6_RECOVERY_V5_PREDECESSOR_LOCK_ARTIFACTS.slice(8)
    .map(({ parsedContent: _parsedContent, ...identity }) => Object.freeze(identity)),
].sort((left, right) => left.path < right.path ? -1 : left.path > right.path ? 1 : 0));
export const PHASE10_C0V_S6_RECOVERY_V5_PACKAGE_STORAGE_BASELINE_BYTES = 2994387 as const;

export const PHASE10_C0V_S6_RECOVERY_V6_PREDECESSOR_IMPLEMENTATION_FREEZE_COMMIT =
  "d47b80373b1fec5ecc79d349046cfbf2a28fa58e" as const;
export const PHASE10_C0V_S6_RECOVERY_V6_PREDECESSOR_ACCEPTED_PACKET_COMMIT =
  "e092259b8d4c3099b569febc08944bf99bfef31a" as const;
export const PHASE10_C0V_S6_RECOVERY_V6_PREDECESSOR_RECOVERY_AUTHORITY = Object.freeze({
  path: PHASE10_C0V_S6_RECOVERY_V5_AUTHORITY_PATH,
  byteLength: 19190,
  sha256: "5bd192d2a1a316008f682499e43c7c8d3cc2140bc02ab0e38773707c7365dd9b",
} as const satisfies Phase10C0VS6ArtifactIdentity);
export const PHASE10_C0V_S6_RECOVERY_V6_PREDECESSOR_PACKET_CATALOGUE = Object.freeze({
  path: PHASE10_C0V_S6_RECOVERY_V5_PACKET_CATALOGUE_PATH,
  byteLength: 16104,
  sha256: "d0a393c92c169bea3acd0e51abfb38bafd122a87fc180ea928204e1cc63416d6",
} as const satisfies Phase10C0VS6ArtifactIdentity);
export const PHASE10_C0V_S6_RECOVERY_V6_PREDECESSOR_AP_PROTOCOL = Object.freeze({
  path: `${PHASE10_C0V_S6_RECOVERY_V5_AUTHORITY_ROOT}/packets/a-p-c0v-s6/protocol.json`,
  byteLength: 83281,
  sha256: "ea15bf75ef406b81c92e8d178f440985334edbc6a0f8994880cca50982fe0565",
} as const satisfies Phase10C0VS6ArtifactIdentity);
export const PHASE10_C0V_S6_RECOVERY_V6_PREDECESSOR_AUTHORIZED_PACKET_PROTOCOL = Object.freeze({
  path: `${PHASE10_C0V_S6_RECOVERY_V5_AUTHORITY_ROOT}/packets/c0v-moving-produce/protocol.json`,
  byteLength: 85606,
  sha256: "9514a8a3a03fe0de79d8de875c8034069952ff693dbe5ed86eac59cae10c2cec",
} as const satisfies Phase10C0VS6ArtifactIdentity);
export const PHASE10_C0V_S6_RECOVERY_V6_PREDECESSOR_MOVING_LOCK_ARTIFACTS = Object.freeze([
  Object.freeze({
    path: PHASE10_C0V_S6_RECOVERY_V5_PACKAGE_LOCK_PATH,
    byteLength: 248,
    sha256: "6d049c5b60f38dedefea22b1ae32cdddbda6852680d346693533a3a8082182b4",
    parsedContent: Object.freeze({
      schema: "phase10-c0v-s6-lock-v1" as const,
      packetId: PHASE10_C0V_S6_RECOVERY_V5_PACKET_CATALOGUE_ID,
      attemptId: "c0v-moving-produce:c0v-moving-produce-20260822-v1" as const,
      processId: 52792 as const,
      acquiredAt: "2026-08-24T20:00:30.299Z" as const,
    }),
  }),
  Object.freeze({
    path: PHASE10_C0V_S6_RECOVERY_V5_PACKET_LOCK_PATHS["c0v-moving-produce"],
    byteLength: 192,
    sha256: "009ae20742a764e0eec701574207046c317c2eba52324fe8b231572ba2b44cf7",
    parsedContent: Object.freeze({
      schema: "phase10-c0v-s6-lock-v1" as const,
      packetId: "c0v-moving-produce" as const,
      attemptId: "c0v-moving-produce-20260822-v1" as const,
      processId: 52792 as const,
      acquiredAt: "2026-08-24T20:00:30.303Z" as const,
    }),
  }),
] as const);
export const PHASE10_C0V_S6_RECOVERY_V6_PREDECESSOR_LOCK_ARTIFACTS = Object.freeze([
  ...PHASE10_C0V_S6_RECOVERY_V5_PREDECESSOR_LOCK_ARTIFACTS,
  ...PHASE10_C0V_S6_RECOVERY_V6_PREDECESSOR_MOVING_LOCK_ARTIFACTS,
] as const);
export const PHASE10_C0V_S6_RECOVERY_V6_ACCEPTED_AP_ATTEMPT_ARTIFACTS = Object.freeze([
  Object.freeze({
    path: `${PHASE10_C0V_S6_RECOVERY_V5_ATTEMPT_ROOT}/a-p-c0v-s6/a-p-c0v-s6-20260822-v6/candidate/artifact-index.json`,
    byteLength: 13211,
    sha256: "7fd3d46e9edc33b60142c2fdf04f1eb6f468482941898137b521d496d61cfd31",
  }),
  Object.freeze({
    path: `${PHASE10_C0V_S6_RECOVERY_V5_ATTEMPT_ROOT}/a-p-c0v-s6/a-p-c0v-s6-20260822-v6/candidate/missing-producer.json`,
    byteLength: 30741,
    sha256: "3266dc73696ec749a60eb83e18be922ef46ff93e4b4779208597768080f145e7",
  }),
  Object.freeze({
    path: `${PHASE10_C0V_S6_RECOVERY_V5_ATTEMPT_ROOT}/a-p-c0v-s6/a-p-c0v-s6-20260822-v6/candidate/uncalled-check.json`,
    byteLength: 31382,
    sha256: "a6ecba80cc9289666a364da94b95d26599a823adbf6cfe2c9292c6654f511050",
  }),
  Object.freeze({
    path: `${PHASE10_C0V_S6_RECOVERY_V5_ATTEMPT_ROOT}/a-p-c0v-s6/a-p-c0v-s6-20260822-v6/exit-status.json`,
    byteLength: 243,
    sha256: "87fa0b6182650fe60895c9127a89153eb0ccfb29b5cd9aba129b63d8b0c26d8d",
  }),
  Object.freeze({
    path: `${PHASE10_C0V_S6_RECOVERY_V5_ATTEMPT_ROOT}/a-p-c0v-s6/a-p-c0v-s6-20260822-v6/freeze-evaluation.json`,
    byteLength: 30078,
    sha256: "f9a5605e2e58be906bf7025f6a049f6aecd0e3c8d449774c03f6d0ddafde5550",
  }),
  Object.freeze({
    path: `${PHASE10_C0V_S6_RECOVERY_V5_ATTEMPT_ROOT}/a-p-c0v-s6/a-p-c0v-s6-20260822-v6/stderr.log`,
    byteLength: 0,
    sha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  }),
  Object.freeze({
    path: `${PHASE10_C0V_S6_RECOVERY_V5_ATTEMPT_ROOT}/a-p-c0v-s6/a-p-c0v-s6-20260822-v6/stdout.log`,
    byteLength: 283305,
    sha256: "0767db5f0d91edfe9ff9d72361762002fb9ccb857518bdc808e063e93c301ff5",
  }),
  Object.freeze({
    path: `${PHASE10_C0V_S6_RECOVERY_V5_ATTEMPT_ROOT}/a-p-c0v-s6/a-p-c0v-s6-20260822-v6/terminal-success-candidate.json`,
    byteLength: 9519,
    sha256: "19d7d23e6ec16af894e8f0e8ab164bea4f7e14f5bf6a984ad4b5cc3f7381bc3a",
  }),
  Object.freeze({
    path: `${PHASE10_C0V_S6_RECOVERY_V5_ATTEMPT_ROOT}/a-p-c0v-s6/a-p-c0v-s6-20260822-v6/worker-invocations.jsonl`,
    byteLength: 3903,
    sha256: "89bcb35abc4fa3b124c28735e0593e07c7e9537a78a281d3925df0ec19f12e12",
  }),
] as const satisfies readonly Phase10C0VS6ArtifactIdentity[]);
export const PHASE10_C0V_S6_RECOVERY_V6_ACCEPTED_AP_PUBLISHED_ARTIFACTS = Object.freeze([
  Object.freeze({
    path: "evidence/phase10-obligation-preflight-v6/artifact-index.json",
    byteLength: 13211,
    sha256: "7fd3d46e9edc33b60142c2fdf04f1eb6f468482941898137b521d496d61cfd31",
  }),
  Object.freeze({
    path: "evidence/phase10-obligation-preflight-v6/missing-producer.json",
    byteLength: 30741,
    sha256: "3266dc73696ec749a60eb83e18be922ef46ff93e4b4779208597768080f145e7",
  }),
  Object.freeze({
    path: "evidence/phase10-obligation-preflight-v6/packets/a-p-c0v-s6/preflight.json",
    byteLength: 49270,
    sha256: "03ff669a927700f39714db87524e9946636be8afc3e455051332764f93a3fd14",
  }),
  Object.freeze({
    path: "evidence/phase10-obligation-preflight-v6/packets/a-p-c0v-s6/terminal-receipt.json",
    byteLength: 10127,
    sha256: "11bf3112732fdcb8673a30644c0a2290a462e3452d01d07e8f6b174b156bffc2",
  }),
  Object.freeze({
    path: "evidence/phase10-obligation-preflight-v6/uncalled-check.json",
    byteLength: 31382,
    sha256: "a6ecba80cc9289666a364da94b95d26599a823adbf6cfe2c9292c6654f511050",
  }),
  Object.freeze({
    path: "evidence/phase10-obligation-preflight-v6/verification.json",
    byteLength: 100562,
    sha256: "c4e32051bbd754c9263dc408df58e6f3d7d3e2fa1033f408b0beba4745dc6210",
  }),
] as const satisfies readonly Phase10C0VS6ArtifactIdentity[]);
export const PHASE10_C0V_S6_RECOVERY_V6_ACCEPTED_AP_ARTIFACTS:
  readonly Phase10C0VS6ArtifactIdentity[] = Object.freeze([
  ...PHASE10_C0V_S6_RECOVERY_V6_ACCEPTED_AP_ATTEMPT_ARTIFACTS,
  ...PHASE10_C0V_S6_RECOVERY_V6_ACCEPTED_AP_PUBLISHED_ARTIFACTS,
].sort((left, right) => left.path < right.path ? -1 : left.path > right.path ? 1 : 0));
export const PHASE10_C0V_S6_RECOVERY_V6_ACCEPTED_AP_BYTES = 637675 as const;
export const PHASE10_C0V_S6_RECOVERY_V6_ACCEPTED_AP_GOVERNED_ELAPSED_NANOSECONDS =
  141142452500 as const;
export const PHASE10_C0V_S6_RECOVERY_V6_PREDECESSOR_ATTEMPT_ARTIFACTS = Object.freeze([
  ...PHASE10_C0V_S6_RECOVERY_V5_PREDECESSOR_ATTEMPT_ARTIFACTS,
  ...PHASE10_C0V_S6_RECOVERY_V6_ACCEPTED_AP_ATTEMPT_ARTIFACTS,
] as const satisfies readonly Phase10C0VS6ArtifactIdentity[]);
export const PHASE10_C0V_S6_RECOVERY_V6_PREDECESSOR_PUBLISHED_ARTIFACTS = Object.freeze([
  ...PHASE10_C0V_S6_RECOVERY_V5_PREDECESSOR_PUBLISHED_ARTIFACTS,
  ...PHASE10_C0V_S6_RECOVERY_V6_ACCEPTED_AP_PUBLISHED_ARTIFACTS,
] as const satisfies readonly Phase10C0VS6ArtifactIdentity[]);
export const PHASE10_C0V_S6_RECOVERY_V6_PREDECESSOR_GOVERNED_ABSENT_PATHS = Object.freeze([
  ...PHASE10_C0V_S6_RECOVERY_V5_PREDECESSOR_GOVERNED_ABSENT_PATHS,
  ...PHASE10_C0V_S6_RECOVERY_V5_STAGE_PATHS,
] as const);
export const PHASE10_C0V_S6_RECOVERY_V6_PREDECESSOR_AUTHORIZED_ATTEMPT_ROOT =
  `${PHASE10_C0V_S6_RECOVERY_V5_ATTEMPT_ROOT}/c0v-moving-produce/c0v-moving-produce-20260822-v1` as const;
export const PHASE10_C0V_S6_RECOVERY_V6_FINAL_PATHS = Object.freeze([
  "evidence/phase10-numerical-verification-v1/c0v-moving-attempts.jsonl",
  "evidence/phase10-obligation-preflight-v2/packets/c0v-moving-produce/preflight.json",
  "evidence/phase10-obligation-preflight-v2/packets/c0v-moving-produce/terminal-receipt.json",
  "evidence/phase10-obligation-preflight-v2/packets/c0v-moving-produce/verification.json",
] as const);
export const PHASE10_C0V_S6_RECOVERY_V6_PREDECESSOR_AUTHORIZED_STAGE_PATHS = Object.freeze(
  PHASE10_C0V_S6_RECOVERY_V6_FINAL_PATHS.map((path) =>
    `${path}.stage-c0v-moving-produce-20260822-v1`),
);
export const PHASE10_C0V_S6_RECOVERY_V6_STAGE_PATHS = Object.freeze(
  PHASE10_C0V_S6_RECOVERY_V6_FINAL_PATHS.map((path) =>
    `${path}.stage-c0v-moving-produce-20260822-v2`),
);
export const PHASE10_C0V_S6_RECOVERY_V6_GOVERNED_ABSENT_PATHS = Object.freeze([
  ...PHASE10_C0V_S6_RECOVERY_V6_PREDECESSOR_GOVERNED_ABSENT_PATHS,
  PHASE10_C0V_S6_RECOVERY_V6_PREDECESSOR_AUTHORIZED_ATTEMPT_ROOT,
  ...PHASE10_C0V_S6_RECOVERY_V6_PREDECESSOR_AUTHORIZED_STAGE_PATHS,
  PHASE10_C0V_S6_RECOVERY_V6_RUNTIME_ROOT,
  ...PHASE10_C0V_S6_RECOVERY_V6_FINAL_PATHS,
  ...PHASE10_C0V_S6_RECOVERY_V6_STAGE_PATHS,
] as const);
export const PHASE10_C0V_S6_RECOVERY_V6_RETAINED_BYTES = 2002925 as const;
export const PHASE10_C0V_S6_RECOVERY_V6_CREDITED_GOVERNED_ELAPSED_NANOSECONDS = 0 as const;
export const PHASE10_C0V_S6_RECOVERY_V6_PACKAGE_CARRY_FORWARD_ELAPSED_NANOSECONDS =
  PHASE10_C0V_S6_RECOVERY_V5_PACKAGE_CARRY_FORWARD_ELAPSED_NANOSECONDS;
export const PHASE10_C0V_S6_RECOVERY_V6_PREATTEMPT_ELAPSED_NANOSECONDS = 532300704500 as const;
export const PHASE10_C0V_S6_RECOVERY_V6_PREATTEMPT_PROCESS_HOURS = 0.14786130680555556 as const;
export const PHASE10_C0V_S6_RECOVERY_V6_PROJECTED_ELAPSED_NANOSECONDS = 14932300704500 as const;
export const PHASE10_C0V_S6_RECOVERY_V6_PROJECTED_PROCESS_HOURS = 4.147861306805556 as const;
export const PHASE10_C0V_S6_RECOVERY_V6_PROJECTED_BYTES = 79129974 as const;
export const PHASE10_C0V_S6_RECOVERY_V6_PACKAGE_STORAGE_BASELINE:
  readonly Phase10C0VS6ArtifactIdentity[] = Object.freeze([
  ...PHASE10_C0V_S6_RECOVERY_V5_PACKAGE_STORAGE_BASELINE,
  ...PHASE10_C0V_S6_RECOVERY_V6_PREDECESSOR_MOVING_LOCK_ARTIFACTS
    .map(({ parsedContent: _parsedContent, ...identity }) => Object.freeze(identity)),
].sort((left, right) => left.path < right.path ? -1 : left.path > right.path ? 1 : 0));
export const PHASE10_C0V_S6_RECOVERY_V6_PACKAGE_STORAGE_BASELINE_BYTES = 2994827 as const;

export const PHASE10_C0V_S6_RECOVERY_V7_PREDECESSOR_IMPLEMENTATION_FREEZE_COMMIT =
  "e65ca441b45795e3793daff0191b5d86b30802bd" as const;
export const PHASE10_C0V_S6_RECOVERY_V7_PREDECESSOR_ACCEPTED_PACKET_COMMIT =
  "e092259b8d4c3099b569febc08944bf99bfef31a" as const;
export const PHASE10_C0V_S6_RECOVERY_V7_PREDECESSOR_RECOVERY_AUTHORITY = Object.freeze({
  path: PHASE10_C0V_S6_RECOVERY_V6_AUTHORITY_PATH,
  byteLength: 24915,
  sha256: "3ca90817b7e7ff1e3ab05681f5f25448cdb0cbaba2603bb740e43de1cac223cd",
} as const satisfies Phase10C0VS6ArtifactIdentity);
export const PHASE10_C0V_S6_RECOVERY_V7_PREDECESSOR_PACKET_CATALOGUE = Object.freeze({
  path: PHASE10_C0V_S6_RECOVERY_V6_PACKET_CATALOGUE_PATH,
  byteLength: 16104,
  sha256: "4bc5fc245cde709706a3191b73270b94ac52467d18187fad0e08d45f0c17c8a5",
} as const satisfies Phase10C0VS6ArtifactIdentity);
export const PHASE10_C0V_S6_RECOVERY_V7_PREDECESSOR_AP_PROTOCOL =
  PHASE10_C0V_S6_RECOVERY_V6_PREDECESSOR_AP_PROTOCOL;
export const PHASE10_C0V_S6_RECOVERY_V7_PREDECESSOR_AUTHORIZED_PACKET_PROTOCOL = Object.freeze({
  path: `${PHASE10_C0V_S6_RECOVERY_V6_AUTHORITY_ROOT}/packets/c0v-moving-produce/protocol.json`,
  byteLength: 86025,
  sha256: "7b32efafbb7ea84610f5501d923681eb99c2377d79ed489b35183018fe3f7cb4",
} as const satisfies Phase10C0VS6ArtifactIdentity);
export const PHASE10_C0V_S6_RECOVERY_V7_PREDECESSOR_MOVING_LOCK_ARTIFACTS = Object.freeze([
  Object.freeze({
    path: PHASE10_C0V_S6_RECOVERY_V6_PACKAGE_LOCK_PATH,
    byteLength: 248,
    sha256: "9c0b1020b7e785156320a5b322e9431ca7cc4bd7e3c3b9ddff2d79ae9d58503a",
    parsedContent: Object.freeze({
      schema: "phase10-c0v-s6-lock-v1" as const,
      packetId: PHASE10_C0V_S6_RECOVERY_V6_PACKET_CATALOGUE_ID,
      attemptId: "c0v-moving-produce:c0v-moving-produce-20260822-v2" as const,
      processId: 52588 as const,
      acquiredAt: "2026-08-24T22:46:04.887Z" as const,
    }),
  }),
  Object.freeze({
    path: PHASE10_C0V_S6_RECOVERY_V6_PACKET_LOCK_PATHS["c0v-moving-produce"],
    byteLength: 192,
    sha256: "d6cb1993563e1cdbe0f6a9f2602e9860acc46d68049a37bc9e01873c52dc99ab",
    parsedContent: Object.freeze({
      schema: "phase10-c0v-s6-lock-v1" as const,
      packetId: "c0v-moving-produce" as const,
      attemptId: "c0v-moving-produce-20260822-v2" as const,
      processId: 52588 as const,
      acquiredAt: "2026-08-24T22:46:04.891Z" as const,
    }),
  }),
] as const);
export const PHASE10_C0V_S6_RECOVERY_V7_PREDECESSOR_LOCK_ARTIFACTS = Object.freeze([
  ...PHASE10_C0V_S6_RECOVERY_V6_PREDECESSOR_LOCK_ARTIFACTS,
  ...PHASE10_C0V_S6_RECOVERY_V7_PREDECESSOR_MOVING_LOCK_ARTIFACTS,
] as const);
export const PHASE10_C0V_S6_RECOVERY_V7_PREDECESSOR_ATTEMPT_ARTIFACTS =
  PHASE10_C0V_S6_RECOVERY_V6_PREDECESSOR_ATTEMPT_ARTIFACTS;
export const PHASE10_C0V_S6_RECOVERY_V7_PREDECESSOR_PUBLISHED_ARTIFACTS =
  PHASE10_C0V_S6_RECOVERY_V6_PREDECESSOR_PUBLISHED_ARTIFACTS;
export const PHASE10_C0V_S6_RECOVERY_V7_ACCEPTED_AP_ARTIFACTS =
  PHASE10_C0V_S6_RECOVERY_V6_ACCEPTED_AP_ARTIFACTS;
export const PHASE10_C0V_S6_RECOVERY_V7_ACCEPTED_AP_PUBLISHED_ARTIFACTS =
  PHASE10_C0V_S6_RECOVERY_V6_ACCEPTED_AP_PUBLISHED_ARTIFACTS;
export const PHASE10_C0V_S6_RECOVERY_V7_ACCEPTED_AP_BYTES =
  PHASE10_C0V_S6_RECOVERY_V6_ACCEPTED_AP_BYTES;
export const PHASE10_C0V_S6_RECOVERY_V7_ACCEPTED_AP_GOVERNED_ELAPSED_NANOSECONDS =
  PHASE10_C0V_S6_RECOVERY_V6_ACCEPTED_AP_GOVERNED_ELAPSED_NANOSECONDS;
export const PHASE10_C0V_S6_RECOVERY_V7_PREDECESSOR_STILL_ABSENT_PATHS = Object.freeze(
  PHASE10_C0V_S6_RECOVERY_V6_GOVERNED_ABSENT_PATHS.filter((path) =>
    path !== PHASE10_C0V_S6_RECOVERY_V6_RUNTIME_ROOT),
);
export const PHASE10_C0V_S6_RECOVERY_V7_PREDECESSOR_AUTHORIZED_ATTEMPT_ROOT =
  `${PHASE10_C0V_S6_RECOVERY_V6_ATTEMPT_ROOT}/c0v-moving-produce/c0v-moving-produce-20260822-v2` as const;
export const PHASE10_C0V_S6_RECOVERY_V7_FINAL_PATHS = PHASE10_C0V_S6_RECOVERY_V6_FINAL_PATHS;
export const PHASE10_C0V_S6_RECOVERY_V7_STAGE_PATHS = Object.freeze(
  PHASE10_C0V_S6_RECOVERY_V7_FINAL_PATHS.map((path) =>
    `${path}.stage-c0v-moving-produce-20260822-v3`),
);
export const PHASE10_C0V_S6_RECOVERY_V7_GOVERNED_ABSENT_PATHS = Object.freeze([
  ...PHASE10_C0V_S6_RECOVERY_V7_PREDECESSOR_STILL_ABSENT_PATHS,
  PHASE10_C0V_S6_RECOVERY_V7_PREDECESSOR_AUTHORIZED_ATTEMPT_ROOT,
  PHASE10_C0V_S6_RECOVERY_V7_RUNTIME_ROOT,
  ...PHASE10_C0V_S6_RECOVERY_V7_STAGE_PATHS,
] as const);
export const PHASE10_C0V_S6_RECOVERY_V7_RETAINED_BYTES = 2003365 as const;
export const PHASE10_C0V_S6_RECOVERY_V7_CREDITED_GOVERNED_ELAPSED_NANOSECONDS = 0 as const;
export const PHASE10_C0V_S6_RECOVERY_V7_PACKAGE_CARRY_FORWARD_ELAPSED_NANOSECONDS =
  PHASE10_C0V_S6_RECOVERY_V6_PACKAGE_CARRY_FORWARD_ELAPSED_NANOSECONDS;
export const PHASE10_C0V_S6_RECOVERY_V7_PREATTEMPT_ELAPSED_NANOSECONDS = 532300704500 as const;
export const PHASE10_C0V_S6_RECOVERY_V7_PREATTEMPT_PROCESS_HOURS = 0.14786130680555556 as const;
export const PHASE10_C0V_S6_RECOVERY_V7_PROJECTED_ELAPSED_NANOSECONDS = 14932300704500 as const;
export const PHASE10_C0V_S6_RECOVERY_V7_PROJECTED_PROCESS_HOURS = 4.147861306805556 as const;
export const PHASE10_C0V_S6_RECOVERY_V7_PROJECTED_BYTES = 79130414 as const;
export const PHASE10_C0V_S6_RECOVERY_V7_PACKAGE_STORAGE_BASELINE:
  readonly Phase10C0VS6ArtifactIdentity[] = Object.freeze([
  ...PHASE10_C0V_S6_RECOVERY_V6_PACKAGE_STORAGE_BASELINE,
  ...PHASE10_C0V_S6_RECOVERY_V7_PREDECESSOR_MOVING_LOCK_ARTIFACTS
    .map(({ parsedContent: _parsedContent, ...identity }) => Object.freeze(identity)),
].sort((left, right) => left.path < right.path ? -1 : left.path > right.path ? 1 : 0));
export const PHASE10_C0V_S6_RECOVERY_V7_PACKAGE_STORAGE_BASELINE_BYTES = 2995267 as const;

export const PHASE10_C0V_S6_RECOVERY_V8_PREDECESSOR_IMPLEMENTATION_FREEZE_COMMIT =
  "af72b00814ee3d0a28499296b144a35585157dba" as const;
export const PHASE10_C0V_S6_RECOVERY_V8_PREDECESSOR_ACCEPTED_PACKET_COMMIT =
  "e092259b8d4c3099b569febc08944bf99bfef31a" as const;
export const PHASE10_C0V_S6_RECOVERY_V8_PREDECESSOR_RECOVERY_AUTHORITY = Object.freeze({
  path: PHASE10_C0V_S6_RECOVERY_V7_AUTHORITY_PATH,
  byteLength: 26481,
  sha256: "3ffde7e830de8f3c1a660a3e2a81f89defddbae0ca1c24bf0c3010f8d84ede2c",
} as const satisfies Phase10C0VS6ArtifactIdentity);
export const PHASE10_C0V_S6_RECOVERY_V8_PREDECESSOR_PACKET_CATALOGUE = Object.freeze({
  path: PHASE10_C0V_S6_RECOVERY_V7_PACKET_CATALOGUE_PATH,
  byteLength: 16104,
  sha256: "783d8ba945857ff60609f924bc213e1d7e5f3abbe037d67577c77b36255cd98e",
} as const satisfies Phase10C0VS6ArtifactIdentity);
export const PHASE10_C0V_S6_RECOVERY_V8_PREDECESSOR_AP_PROTOCOL =
  PHASE10_C0V_S6_RECOVERY_V7_PREDECESSOR_AP_PROTOCOL;
export const PHASE10_C0V_S6_RECOVERY_V8_PREDECESSOR_AUTHORIZED_PACKET_PROTOCOL = Object.freeze({
  path: `${PHASE10_C0V_S6_RECOVERY_V7_AUTHORITY_ROOT}/packets/c0v-moving-produce/protocol.json`,
  byteLength: 86444,
  sha256: "74938e872e4ee087c584c3f599e7b410247b96265b24ae9256d9601bbae67155",
} as const satisfies Phase10C0VS6ArtifactIdentity);
export const PHASE10_C0V_S6_RECOVERY_V8_PREDECESSOR_MOVING_LOCK_ARTIFACTS = Object.freeze([
  Object.freeze({
    path: PHASE10_C0V_S6_RECOVERY_V7_PACKAGE_LOCK_PATH,
    byteLength: 248,
    sha256: "624606cab0c1ddc64d6e856d97544ae4a1891bb26c8e98ff9157aa5f3dc725aa",
    parsedContent: Object.freeze({
      schema: "phase10-c0v-s6-lock-v1" as const,
      packetId: PHASE10_C0V_S6_RECOVERY_V7_PACKET_CATALOGUE_ID,
      attemptId: "c0v-moving-produce:c0v-moving-produce-20260822-v3" as const,
      processId: 54488 as const,
      acquiredAt: "2026-08-24T23:59:39.002Z" as const,
    }),
  }),
  Object.freeze({
    path: PHASE10_C0V_S6_RECOVERY_V7_PACKET_LOCK_PATHS["c0v-moving-produce"],
    byteLength: 192,
    sha256: "11496f1dd8d7c196159f67dec85993e59a507a3490eec2394002cf45db39f9f5",
    parsedContent: Object.freeze({
      schema: "phase10-c0v-s6-lock-v1" as const,
      packetId: "c0v-moving-produce" as const,
      attemptId: "c0v-moving-produce-20260822-v3" as const,
      processId: 54488 as const,
      acquiredAt: "2026-08-24T23:59:39.007Z" as const,
    }),
  }),
] as const);
export const PHASE10_C0V_S6_RECOVERY_V8_PREDECESSOR_LOCK_ARTIFACTS = Object.freeze([
  ...PHASE10_C0V_S6_RECOVERY_V7_PREDECESSOR_LOCK_ARTIFACTS,
  ...PHASE10_C0V_S6_RECOVERY_V8_PREDECESSOR_MOVING_LOCK_ARTIFACTS,
] as const);
export const PHASE10_C0V_S6_RECOVERY_V8_PREDECESSOR_ATTEMPT_ARTIFACTS =
  PHASE10_C0V_S6_RECOVERY_V7_PREDECESSOR_ATTEMPT_ARTIFACTS;
export const PHASE10_C0V_S6_RECOVERY_V8_PREDECESSOR_PUBLISHED_ARTIFACTS =
  PHASE10_C0V_S6_RECOVERY_V7_PREDECESSOR_PUBLISHED_ARTIFACTS;
export const PHASE10_C0V_S6_RECOVERY_V8_ACCEPTED_AP_ARTIFACTS =
  PHASE10_C0V_S6_RECOVERY_V7_ACCEPTED_AP_ARTIFACTS;
export const PHASE10_C0V_S6_RECOVERY_V8_ACCEPTED_AP_PUBLISHED_ARTIFACTS =
  PHASE10_C0V_S6_RECOVERY_V7_ACCEPTED_AP_PUBLISHED_ARTIFACTS;
export const PHASE10_C0V_S6_RECOVERY_V8_ACCEPTED_AP_BYTES =
  PHASE10_C0V_S6_RECOVERY_V7_ACCEPTED_AP_BYTES;
export const PHASE10_C0V_S6_RECOVERY_V8_ACCEPTED_AP_GOVERNED_ELAPSED_NANOSECONDS =
  PHASE10_C0V_S6_RECOVERY_V7_ACCEPTED_AP_GOVERNED_ELAPSED_NANOSECONDS;
export const PHASE10_C0V_S6_RECOVERY_V8_PREDECESSOR_STILL_ABSENT_PATHS = Object.freeze(
  PHASE10_C0V_S6_RECOVERY_V7_GOVERNED_ABSENT_PATHS.filter((path) =>
    path !== PHASE10_C0V_S6_RECOVERY_V7_RUNTIME_ROOT),
);
export const PHASE10_C0V_S6_RECOVERY_V8_PREDECESSOR_AUTHORIZED_ATTEMPT_ROOT =
  `${PHASE10_C0V_S6_RECOVERY_V7_ATTEMPT_ROOT}/c0v-moving-produce/c0v-moving-produce-20260822-v3` as const;
export const PHASE10_C0V_S6_RECOVERY_V8_FINAL_PATHS = PHASE10_C0V_S6_RECOVERY_V7_FINAL_PATHS;
export const PHASE10_C0V_S6_RECOVERY_V8_STAGE_PATHS = Object.freeze(
  PHASE10_C0V_S6_RECOVERY_V8_FINAL_PATHS.map((path) =>
    `${path}.stage-${PHASE10_C0V_S6_RECOVERY_V8_MOVING_ATTEMPT_ID}`),
);
export const PHASE10_C0V_S6_RECOVERY_V8_GOVERNED_ABSENT_PATHS = Object.freeze([
  ...PHASE10_C0V_S6_RECOVERY_V8_PREDECESSOR_STILL_ABSENT_PATHS,
  PHASE10_C0V_S6_RECOVERY_V8_PREDECESSOR_AUTHORIZED_ATTEMPT_ROOT,
  PHASE10_C0V_S6_RECOVERY_V8_RUNTIME_ROOT,
  ...PHASE10_C0V_S6_RECOVERY_V8_STAGE_PATHS,
] as const);
export const PHASE10_C0V_S6_RECOVERY_V8_RETAINED_BYTES = 2003805 as const;
export const PHASE10_C0V_S6_RECOVERY_V8_CREDITED_GOVERNED_ELAPSED_NANOSECONDS = 0 as const;
export const PHASE10_C0V_S6_RECOVERY_V8_PACKAGE_CARRY_FORWARD_ELAPSED_NANOSECONDS =
  PHASE10_C0V_S6_RECOVERY_V7_PACKAGE_CARRY_FORWARD_ELAPSED_NANOSECONDS;
export const PHASE10_C0V_S6_RECOVERY_V8_PREATTEMPT_ELAPSED_NANOSECONDS = 532300704500 as const;
export const PHASE10_C0V_S6_RECOVERY_V8_PREATTEMPT_PROCESS_HOURS = 0.14786130680555556 as const;
export const PHASE10_C0V_S6_RECOVERY_V8_PROJECTED_ELAPSED_NANOSECONDS = 14932300704500 as const;
export const PHASE10_C0V_S6_RECOVERY_V8_PROJECTED_PROCESS_HOURS = 4.147861306805556 as const;
export const PHASE10_C0V_S6_RECOVERY_V8_PROJECTED_BYTES = 79130854 as const;
export const PHASE10_C0V_S6_RECOVERY_V8_PACKAGE_STORAGE_BASELINE:
  readonly Phase10C0VS6ArtifactIdentity[] = Object.freeze([
  ...PHASE10_C0V_S6_RECOVERY_V7_PACKAGE_STORAGE_BASELINE,
  ...PHASE10_C0V_S6_RECOVERY_V8_PREDECESSOR_MOVING_LOCK_ARTIFACTS
    .map(({ parsedContent: _parsedContent, ...identity }) => Object.freeze(identity)),
].sort((left, right) => left.path < right.path ? -1 : left.path > right.path ? 1 : 0));
export const PHASE10_C0V_S6_RECOVERY_V8_PACKAGE_STORAGE_BASELINE_BYTES = 2995707 as const;

export const PHASE10_C0V_S6_RECOVERY_V9_PREDECESSOR_IMPLEMENTATION_FREEZE_COMMIT =
  "0abc4b5245aaed2cfe9a0b4084d76a72f2315894" as const;
export const PHASE10_C0V_S6_RECOVERY_V9_PREDECESSOR_ACCEPTED_PACKET_COMMIT =
  "e092259b8d4c3099b569febc08944bf99bfef31a" as const;
export const PHASE10_C0V_S6_RECOVERY_V9_PREDECESSOR_RECOVERY_AUTHORITY = Object.freeze({
  path: PHASE10_C0V_S6_RECOVERY_V8_AUTHORITY_PATH,
  byteLength: 28047,
  sha256: "725deb532bfdbe7105b31f4d9cafbcd92648f1e8efdacc34b97bd6f2e4e95940",
} as const satisfies Phase10C0VS6ArtifactIdentity);
export const PHASE10_C0V_S6_RECOVERY_V9_PREDECESSOR_PACKET_CATALOGUE = Object.freeze({
  path: PHASE10_C0V_S6_RECOVERY_V8_PACKET_CATALOGUE_PATH,
  byteLength: 16104,
  sha256: "88c66a7f2ade93a3ce61199016b281fc1aa056ed36e9bc55e29ffd95eb2f0e02",
} as const satisfies Phase10C0VS6ArtifactIdentity);
export const PHASE10_C0V_S6_RECOVERY_V9_PREDECESSOR_AP_PROTOCOL =
  PHASE10_C0V_S6_RECOVERY_V8_PREDECESSOR_AP_PROTOCOL;
export const PHASE10_C0V_S6_RECOVERY_V9_PREDECESSOR_AUTHORIZED_PACKET_PROTOCOL = Object.freeze({
  path: `${PHASE10_C0V_S6_RECOVERY_V8_AUTHORITY_ROOT}/packets/c0v-moving-produce/protocol.json`,
  byteLength: 86863,
  sha256: "e1811e1815773be682e9e948e6774305327c06c853833829f4fec86396116908",
} as const satisfies Phase10C0VS6ArtifactIdentity);
export const PHASE10_C0V_S6_RECOVERY_V9_PREDECESSOR_MOVING_LOCK_ARTIFACTS = Object.freeze([
  Object.freeze({
    path: PHASE10_C0V_S6_RECOVERY_V8_PACKAGE_LOCK_PATH,
    byteLength: 248,
    sha256: "757ce64d0aee51c2f878175e186b3e7169adf9325faee5175b71d78e5b398de6",
    parsedContent: Object.freeze({
      schema: "phase10-c0v-s6-lock-v1" as const,
      packetId: PHASE10_C0V_S6_RECOVERY_V8_PACKET_CATALOGUE_ID,
      attemptId: "c0v-moving-produce:c0v-moving-produce-20260822-v4" as const,
      processId: 13920 as const,
      acquiredAt: "2026-08-25T01:26:58.030Z" as const,
    }),
  }),
  Object.freeze({
    path: PHASE10_C0V_S6_RECOVERY_V8_PACKET_LOCK_PATHS["c0v-moving-produce"],
    byteLength: 192,
    sha256: "20ca902e0a7a35fca03e09c77b3aadc962856dd76e1f4d4ecafa9cbc24a34487",
    parsedContent: Object.freeze({
      schema: "phase10-c0v-s6-lock-v1" as const,
      packetId: "c0v-moving-produce" as const,
      attemptId: PHASE10_C0V_S6_RECOVERY_V8_MOVING_ATTEMPT_ID,
      processId: 13920 as const,
      acquiredAt: "2026-08-25T01:26:58.034Z" as const,
    }),
  }),
] as const);
export const PHASE10_C0V_S6_RECOVERY_V9_PREDECESSOR_LOCK_ARTIFACTS = Object.freeze([
  ...PHASE10_C0V_S6_RECOVERY_V8_PREDECESSOR_LOCK_ARTIFACTS,
  ...PHASE10_C0V_S6_RECOVERY_V9_PREDECESSOR_MOVING_LOCK_ARTIFACTS,
] as const);
export const PHASE10_C0V_S6_RECOVERY_V9_PREDECESSOR_MOVING_ATTEMPT_ARTIFACTS = Object.freeze([
  Object.freeze({ path: `${PHASE10_C0V_S6_RECOVERY_V8_ATTEMPT_ROOT}/c0v-moving-produce/${PHASE10_C0V_S6_RECOVERY_V8_MOVING_ATTEMPT_ID}/cause-evaluation.json`, byteLength: 7106, sha256: "c6e4474bd84c3695b060f897f68d80f1f37494acaaae2377ed74d044c1f4a956" }),
  Object.freeze({ path: `${PHASE10_C0V_S6_RECOVERY_V8_ATTEMPT_ROOT}/c0v-moving-produce/${PHASE10_C0V_S6_RECOVERY_V8_MOVING_ATTEMPT_ID}/exit-status.json`, byteLength: 259, sha256: "8f35616bbd42c8d988741f50b30e14d6ab0e16cfce08d809687a5c9b677e6ff1" }),
  Object.freeze({ path: `${PHASE10_C0V_S6_RECOVERY_V8_ATTEMPT_ROOT}/c0v-moving-produce/${PHASE10_C0V_S6_RECOVERY_V8_MOVING_ATTEMPT_ID}/freeze-evaluation.json`, byteLength: 34437, sha256: "a68c8420849e6ed4561247e895d97a4ac9ab9169130bb9d1d931c0b511e207cd" }),
  Object.freeze({ path: `${PHASE10_C0V_S6_RECOVERY_V8_ATTEMPT_ROOT}/c0v-moving-produce/${PHASE10_C0V_S6_RECOVERY_V8_MOVING_ATTEMPT_ID}/stderr.log`, byteLength: 0, sha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855" }),
  Object.freeze({ path: `${PHASE10_C0V_S6_RECOVERY_V8_ATTEMPT_ROOT}/c0v-moving-produce/${PHASE10_C0V_S6_RECOVERY_V8_MOVING_ATTEMPT_ID}/stdout.log`, byteLength: 4505, sha256: "bd30c7ca9fd7efd0738dfc0457be439ba3ecc3dcf564f574b0d5481eb736e702" }),
  Object.freeze({ path: `${PHASE10_C0V_S6_RECOVERY_V8_ATTEMPT_ROOT}/c0v-moving-produce/${PHASE10_C0V_S6_RECOVERY_V8_MOVING_ATTEMPT_ID}/worker-invocations.jsonl`, byteLength: 1413, sha256: "da02dd8f0fd34cb117147e8303c0a0371a543b796bd1610a3ade2081b9d3efd7" }),
] as const satisfies readonly Phase10C0VS6ArtifactIdentity[]);
export const PHASE10_C0V_S6_RECOVERY_V9_PREDECESSOR_ATTEMPT_ARTIFACTS = Object.freeze([
  ...PHASE10_C0V_S6_RECOVERY_V8_PREDECESSOR_ATTEMPT_ARTIFACTS,
  ...PHASE10_C0V_S6_RECOVERY_V9_PREDECESSOR_MOVING_ATTEMPT_ARTIFACTS,
].sort((left, right) => left.path < right.path ? -1 : left.path > right.path ? 1 : 0));
export const PHASE10_C0V_S6_RECOVERY_V9_PREDECESSOR_MOVING_PREFLIGHT = Object.freeze({
  path: "evidence/phase10-obligation-preflight-v2/packets/c0v-moving-produce/preflight.json",
  byteLength: 54825,
  sha256: "2b175094f905d3495b71c8b32d8979b6ce6337e61134e4cef13f0bc8021d40c4",
} as const satisfies Phase10C0VS6ArtifactIdentity);
export const PHASE10_C0V_S6_RECOVERY_V9_PREDECESSOR_PUBLISHED_ARTIFACTS = Object.freeze([
  ...PHASE10_C0V_S6_RECOVERY_V8_PREDECESSOR_PUBLISHED_ARTIFACTS,
  PHASE10_C0V_S6_RECOVERY_V9_PREDECESSOR_MOVING_PREFLIGHT,
].sort((left, right) => left.path < right.path ? -1 : left.path > right.path ? 1 : 0));
export const PHASE10_C0V_S6_RECOVERY_V9_ACCEPTED_AP_ARTIFACTS =
  PHASE10_C0V_S6_RECOVERY_V8_ACCEPTED_AP_ARTIFACTS;
export const PHASE10_C0V_S6_RECOVERY_V9_ACCEPTED_AP_PUBLISHED_ARTIFACTS =
  PHASE10_C0V_S6_RECOVERY_V8_ACCEPTED_AP_PUBLISHED_ARTIFACTS;
export const PHASE10_C0V_S6_RECOVERY_V9_ACCEPTED_AP_BYTES =
  PHASE10_C0V_S6_RECOVERY_V8_ACCEPTED_AP_BYTES;
export const PHASE10_C0V_S6_RECOVERY_V9_ACCEPTED_AP_GOVERNED_ELAPSED_NANOSECONDS =
  PHASE10_C0V_S6_RECOVERY_V8_ACCEPTED_AP_GOVERNED_ELAPSED_NANOSECONDS;
export const PHASE10_C0V_S6_RECOVERY_V9_PREDECESSOR_STILL_ABSENT_PATHS = Object.freeze(
  PHASE10_C0V_S6_RECOVERY_V8_GOVERNED_ABSENT_PATHS.filter((path) =>
    path !== PHASE10_C0V_S6_RECOVERY_V8_RUNTIME_ROOT &&
    path !== PHASE10_C0V_S6_RECOVERY_V9_PREDECESSOR_MOVING_PREFLIGHT.path),
);
export const PHASE10_C0V_S6_RECOVERY_V9_FINAL_PATHS = Object.freeze([
  "evidence/phase10-obligation-preflight-v3/packets/c0v-moving-produce/preflight.json",
  "evidence/phase10-obligation-preflight-v3/packets/c0v-moving-produce/terminal-receipt.json",
  "evidence/phase10-obligation-preflight-v3/packets/c0v-moving-produce/verification.json",
] as const);
export const PHASE10_C0V_S6_RECOVERY_V9_STAGE_PATHS = Object.freeze([
  `evidence/phase10-numerical-verification-v1/c0v-moving-attempts.jsonl.stage-${PHASE10_C0V_S6_CURRENT_MOVING_ATTEMPT_ID}`,
  ...PHASE10_C0V_S6_RECOVERY_V9_FINAL_PATHS.map((path) =>
    `${path}.stage-${PHASE10_C0V_S6_CURRENT_MOVING_ATTEMPT_ID}`),
] as const);
export const PHASE10_C0V_S6_RECOVERY_V9_GOVERNED_ABSENT_PATHS = Object.freeze([
  ...PHASE10_C0V_S6_RECOVERY_V9_PREDECESSOR_STILL_ABSENT_PATHS,
  PHASE10_C0V_S6_RECOVERY_V9_RUNTIME_ROOT,
  ...PHASE10_C0V_S6_RECOVERY_V9_FINAL_PATHS,
  ...PHASE10_C0V_S6_RECOVERY_V9_STAGE_PATHS,
] as const);
export const PHASE10_C0V_S6_RECOVERY_V9_RETAINED_BYTES = 2106790 as const;
export const PHASE10_C0V_S6_RECOVERY_V9_OBSERVED_WORKER_LIFETIME_NANOSECONDS = 453469200 as const;
export const PHASE10_C0V_S6_RECOVERY_V9_CREDITED_GOVERNED_ELAPSED_NANOSECONDS = 35198500 as const;
export const PHASE10_C0V_S6_RECOVERY_V9_CREDITED_GOVERNED_PROCESS_HOURS =
  0.000009777361111111111 as const;
export const PHASE10_C0V_S6_RECOVERY_V9_PACKAGE_CARRY_FORWARD_ELAPSED_NANOSECONDS =
  391193450500 as const;
export const PHASE10_C0V_S6_RECOVERY_V9_PREATTEMPT_ELAPSED_NANOSECONDS = 532335903000 as const;
export const PHASE10_C0V_S6_RECOVERY_V9_PREATTEMPT_PROCESS_HOURS = 0.14787108416666667 as const;
export const PHASE10_C0V_S6_RECOVERY_V9_PROJECTED_ELAPSED_NANOSECONDS = 14932335903000 as const;
export const PHASE10_C0V_S6_RECOVERY_V9_PROJECTED_PROCESS_HOURS = 4.147871084166667 as const;
export const PHASE10_C0V_S6_RECOVERY_V9_PROJECTED_BYTES = 79233839 as const;
export const PHASE10_C0V_S6_RECOVERY_V9_PACKAGE_STORAGE_BASELINE:
  readonly Phase10C0VS6ArtifactIdentity[] = Object.freeze([
  ...PHASE10_C0V_S6_RECOVERY_V8_PACKAGE_STORAGE_BASELINE,
  ...PHASE10_C0V_S6_RECOVERY_V9_PREDECESSOR_MOVING_LOCK_ARTIFACTS
    .map(({ parsedContent: _parsedContent, ...identity }) => Object.freeze(identity)),
  ...PHASE10_C0V_S6_RECOVERY_V9_PREDECESSOR_MOVING_ATTEMPT_ARTIFACTS,
  PHASE10_C0V_S6_RECOVERY_V9_PREDECESSOR_MOVING_PREFLIGHT,
].sort((left, right) => left.path < right.path ? -1 : left.path > right.path ? 1 : 0));
export const PHASE10_C0V_S6_RECOVERY_V9_PACKAGE_STORAGE_BASELINE_BYTES = 3098692 as const;

export const PHASE10_C0V_S6_PREOBSERVATION_PRODUCTION_CLOSURE = Object.freeze([
  Object.freeze({ path: "app/package.json", byteLength: 725, sha256: "dadd38a6f4727ca9a0834e5cff6fddf906843033e11689ca1eb953d91eee752f" }),
  Object.freeze({ path: "core/package.json", byteLength: 264, sha256: "f59378c0d94e96d0eeb8cc8b43d2eb08f690a202fafe37c45f3aaecfd77cd73b" }),
  Object.freeze({ path: "core/src/checkpoint.ts", byteLength: 36270, sha256: "4c24a055b39fa5fb8283304eaf42d16aa7da51823cb6d102b9ba107d66e363d7" }),
  Object.freeze({ path: "core/src/index.ts", byteLength: 324, sha256: "c9c08f7649fb4fa2d5a8c76d2e36fffd05de28edea8e730de3e64964a72bfe6c" }),
  Object.freeze({ path: "core/src/lattice.ts", byteLength: 5311, sha256: "fe654c30be71e0f26cf27d52b14f38f6c9496dea538dafc945c8229f33776fdb" }),
  Object.freeze({ path: "core/src/libbrecht.ts", byteLength: 23328, sha256: "d18d30868a20424cacc49f89e8a417583e2aa60e876c9bc775db66529bdacb38" }),
  Object.freeze({ path: "core/src/lk-resume-checkpoint.ts", byteLength: 67807, sha256: "52ca2068ecfcff23d3ff4f42b0cd6f72dd72d71950c8691f0521d3d4a00c3616" }),
  Object.freeze({ path: "core/src/metrics.ts", byteLength: 30010, sha256: "51d51d6bad0c177514292f3a46e7f03efbff63cb5b7d9f2fd54dde7e09e78080" }),
  Object.freeze({ path: "core/src/params.ts", byteLength: 7791, sha256: "9184786bb60cbf0f72b538d4fd79cdd9e28e7cfbf59d196d0891aea41ecdb118" }),
  Object.freeze({ path: "core/src/prng.ts", byteLength: 2089, sha256: "da5d3ec7e80957bba472ae8e68fca17bca10f44b815daabeef025470e9114b0c" }),
  Object.freeze({ path: "core/src/state.ts", byteLength: 2823, sha256: "af069eb888a161f78a811ab06a7bbb43ef2bb6177c815bffdba8ab75773addeb" }),
  Object.freeze({ path: "core/src/target-observables.ts", byteLength: 24467, sha256: "dcd9b546d975d341eb4bde202f1d041a46fd5e14f17a0d07f84fbb324dd4eeb8" }),
  Object.freeze({ path: "core/src/timeline.ts", byteLength: 30376, sha256: "8c70d8691bd43c718114ab3e3b4364cf539aa6c73bc41696b506e8813080af6b" }),
  Object.freeze({ path: "package-lock.json", byteLength: 59052, sha256: "c7f89b10cf71fa16ef75f7e4a3a619551d7dad39b50a4d27d34fac3ffa5470b6" }),
  Object.freeze({ path: "package.json", byteLength: 1131, sha256: "1158c0528e11f37928ecedc2104fed45fd447879567485148cccd5ea149092b8" }),
  Object.freeze({ path: "runner/package.json", byteLength: 348, sha256: "05be8d1290586f556b11fe38b635421a34e5d358a503e4e29502e32f9c664146" }),
  Object.freeze({ path: "runner/src/gate4-evidence.ts", byteLength: 23835, sha256: "784a8c54741988903f258dc38f711f21afe516441794abd38a1f7eff28d28a87" }),
  Object.freeze({ path: "runner/src/phase10-c0v-contracts.ts", byteLength: 144599, sha256: "95cd7f83a612afd4220b14967fe78f3b200e3d52fa604794a96689b3adf8f653" }),
  Object.freeze({ path: "solver-cpu/package.json", byteLength: 335, sha256: "07891a59e7a4a6b3325faef6d85ffeac8393c3bca447765b29509730c936ca6e" }),
  Object.freeze({ path: "solver-cpu/src/spherical-reference.ts", byteLength: 15057, sha256: "4ac3d9ee17430056702f85581d040d1378753c2592b7bfdeff7e074fc5f29481" }),
  Object.freeze({ path: "solver-gpu/package.json", byteLength: 289, sha256: "f44d0f64b2a8d2c95bd5b972a5a5f1edb0269a18981c04876a30040f6c65382a" }),
  Object.freeze({ path: "tsconfig.base.json", byteLength: 412, sha256: "8750c1593fc364431077ce5286c106615b326f187a0f5cbf18d858fea2189ead" }),
  Object.freeze({ path: "tsconfig.json", byteLength: 374, sha256: "c4bdca8abee0d3ca445e1a23f373c2ef7cb8330d52f651dfe6a0118a1521ce25" }),
] satisfies readonly Phase10C0VS6ArtifactIdentity[]);

export interface Phase10C0VS6ArtifactIdentity {
  readonly path: string;
  readonly byteLength: number;
  readonly sha256: string;
}

export interface Phase10C0VS6RecoveryPredecessorLockContent {
  readonly schema: "phase10-c0v-s6-lock-v1";
  readonly packetId: string;
  readonly attemptId: string;
  readonly processId: number;
  readonly acquiredAt: string;
}

export interface Phase10C0VS6RecoveryPredecessorLockArtifact extends Phase10C0VS6ArtifactIdentity {
  readonly parsedContent: Phase10C0VS6RecoveryPredecessorLockContent;
}

export interface Phase10C0VS6RecoveryAuthorizedAttempt {
  readonly packetId: Phase10C0VS6PacketId;
  readonly predecessorAttemptId: string;
  readonly successorAttemptId: string;
}

export interface Phase10C0VS6RecoveryAuthority {
  readonly schema: typeof PHASE10_C0V_S6_RECOVERY_AUTHORITY_SCHEMA;
  readonly recoveryAuthorityId: typeof PHASE10_C0V_S6_RECOVERY_AUTHORITY_ID;
  readonly automaticRetry: false;
  readonly predecessorImplementationFreezeCommit:
    typeof PHASE10_C0V_S6_PREDECESSOR_IMPLEMENTATION_FREEZE_COMMIT;
  readonly predecessorPacketCatalogue: Phase10C0VS6ArtifactIdentity;
  readonly predecessorApProtocol: Phase10C0VS6ArtifactIdentity;
  readonly predecessorLockArtifacts: readonly [
    Phase10C0VS6RecoveryPredecessorLockArtifact,
    Phase10C0VS6RecoveryPredecessorLockArtifact,
  ];
  readonly predecessorGovernedAbsentPaths: readonly string[];
  readonly retainedBytes: 396;
  readonly creditedWorkerInvocationCount: 0;
  readonly creditedGovernedProcessHours: 0;
  readonly successor: {
    readonly packetCatalogueId: typeof PHASE10_C0V_S6_RECOVERY_PACKET_CATALOGUE_ID;
    readonly packetCataloguePath: typeof PHASE10_C0V_S6_RECOVERY_PACKET_CATALOGUE_PATH;
    readonly maximumAuthorizedNewAttempts: 1;
    readonly authorizedAttempts: readonly [Phase10C0VS6RecoveryAuthorizedAttempt];
  };
}

export interface Phase10C0VS6RecoveryV2Authority {
  readonly schema: typeof PHASE10_C0V_S6_RECOVERY_V2_AUTHORITY_SCHEMA;
  readonly recoveryAuthorityId: typeof PHASE10_C0V_S6_RECOVERY_V2_AUTHORITY_ID;
  readonly automaticRetry: false;
  readonly predecessorImplementationFreezeCommit:
    typeof PHASE10_C0V_S6_RECOVERY_V2_PREDECESSOR_IMPLEMENTATION_FREEZE_COMMIT;
  readonly predecessorRecoveryAuthority: Phase10C0VS6ArtifactIdentity;
  readonly predecessorPacketCatalogue: Phase10C0VS6ArtifactIdentity;
  readonly predecessorApProtocol: Phase10C0VS6ArtifactIdentity;
  readonly predecessorLockArtifacts: readonly [
    Phase10C0VS6RecoveryPredecessorLockArtifact,
    Phase10C0VS6RecoveryPredecessorLockArtifact,
    Phase10C0VS6RecoveryPredecessorLockArtifact,
    Phase10C0VS6RecoveryPredecessorLockArtifact,
  ];
  readonly predecessorAttemptArtifacts: readonly Phase10C0VS6ArtifactIdentity[];
  readonly predecessorPublishedArtifacts: readonly Phase10C0VS6ArtifactIdentity[];
  readonly predecessorGovernedAbsentPaths: readonly string[];
  readonly retainedBytes: 64316;
  readonly observedWorkerProcessCount: 1;
  readonly observedWorkerLifetimeNanoseconds: 384945300;
  readonly creditedGovernedInvocationCount: 0;
  readonly creditedGovernedProcessHours: 0;
  readonly successor: {
    readonly packetCatalogueId: typeof PHASE10_C0V_S6_RECOVERY_V2_PACKET_CATALOGUE_ID;
    readonly packetCataloguePath: typeof PHASE10_C0V_S6_RECOVERY_V2_PACKET_CATALOGUE_PATH;
    readonly maximumAuthorizedNewAttempts: 1;
    readonly authorizedAttempts: readonly [Phase10C0VS6RecoveryAuthorizedAttempt];
  };
}

export interface Phase10C0VS6RecoveryV3Authority {
  readonly schema: typeof PHASE10_C0V_S6_RECOVERY_V3_AUTHORITY_SCHEMA;
  readonly recoveryAuthorityId: typeof PHASE10_C0V_S6_RECOVERY_V3_AUTHORITY_ID;
  readonly automaticRetry: false;
  readonly predecessorImplementationFreezeCommit:
    typeof PHASE10_C0V_S6_RECOVERY_V3_PREDECESSOR_IMPLEMENTATION_FREEZE_COMMIT;
  readonly predecessorRecoveryAuthority: Phase10C0VS6ArtifactIdentity;
  readonly predecessorPacketCatalogue: Phase10C0VS6ArtifactIdentity;
  readonly predecessorApProtocol: Phase10C0VS6ArtifactIdentity;
  readonly predecessorLockArtifacts: readonly [
    Phase10C0VS6RecoveryPredecessorLockArtifact,
    Phase10C0VS6RecoveryPredecessorLockArtifact,
    Phase10C0VS6RecoveryPredecessorLockArtifact,
    Phase10C0VS6RecoveryPredecessorLockArtifact,
    Phase10C0VS6RecoveryPredecessorLockArtifact,
    Phase10C0VS6RecoveryPredecessorLockArtifact,
  ];
  readonly predecessorAttemptArtifacts: readonly Phase10C0VS6ArtifactIdentity[];
  readonly predecessorPublishedArtifacts: readonly Phase10C0VS6ArtifactIdentity[];
  readonly predecessorGovernedAbsentPaths: readonly string[];
  readonly retainedBytes: typeof PHASE10_C0V_S6_RECOVERY_V3_RETAINED_BYTES;
  readonly observedWorkerProcessCount: 1;
  readonly observedWorkerLifetimeNanoseconds: 125776629700;
  readonly creditedGovernedInvocationCount: 4;
  readonly creditedGovernedElapsedNanoseconds:
    typeof PHASE10_C0V_S6_RECOVERY_V3_CREDITED_GOVERNED_ELAPSED_NANOSECONDS;
  readonly creditedGovernedProcessHours: 0.0348027338888889;
  readonly successor: {
    readonly packetCatalogueId: typeof PHASE10_C0V_S6_RECOVERY_V3_PACKET_CATALOGUE_ID;
    readonly packetCataloguePath: typeof PHASE10_C0V_S6_RECOVERY_V3_PACKET_CATALOGUE_PATH;
    readonly maximumAuthorizedNewAttempts: 1;
    readonly authorizedAttempts: readonly [Phase10C0VS6RecoveryAuthorizedAttempt];
  };
}

export interface Phase10C0VS6RecoveryV4Authority {
  readonly schema: typeof PHASE10_C0V_S6_RECOVERY_V4_AUTHORITY_SCHEMA;
  readonly recoveryAuthorityId: typeof PHASE10_C0V_S6_RECOVERY_V4_AUTHORITY_ID;
  readonly automaticRetry: false;
  readonly predecessorImplementationFreezeCommit:
    typeof PHASE10_C0V_S6_RECOVERY_V4_PREDECESSOR_IMPLEMENTATION_FREEZE_COMMIT;
  readonly predecessorRecoveryAuthority: Phase10C0VS6ArtifactIdentity;
  readonly predecessorPacketCatalogue: Phase10C0VS6ArtifactIdentity;
  readonly predecessorApProtocol: Phase10C0VS6ArtifactIdentity;
  readonly predecessorLockArtifacts: readonly [
    Phase10C0VS6RecoveryPredecessorLockArtifact,
    Phase10C0VS6RecoveryPredecessorLockArtifact,
    Phase10C0VS6RecoveryPredecessorLockArtifact,
    Phase10C0VS6RecoveryPredecessorLockArtifact,
    Phase10C0VS6RecoveryPredecessorLockArtifact,
    Phase10C0VS6RecoveryPredecessorLockArtifact,
    Phase10C0VS6RecoveryPredecessorLockArtifact,
    Phase10C0VS6RecoveryPredecessorLockArtifact,
  ];
  readonly predecessorAttemptArtifacts: readonly Phase10C0VS6ArtifactIdentity[];
  readonly predecessorPublishedArtifacts: readonly Phase10C0VS6ArtifactIdentity[];
  readonly predecessorGovernedAbsentPaths: readonly string[];
  readonly retainedBytes: typeof PHASE10_C0V_S6_RECOVERY_V4_RETAINED_BYTES;
  readonly observedWorkerProcessCount: 1;
  readonly observedWorkerLifetimeNanoseconds: 132474672300;
  readonly creditedGovernedInvocationCount: 4;
  readonly creditedGovernedElapsedNanoseconds:
    typeof PHASE10_C0V_S6_RECOVERY_V4_CREDITED_GOVERNED_ELAPSED_NANOSECONDS;
  readonly creditedGovernedProcessHours: 0.036666082583333336;
  readonly successor: {
    readonly packetCatalogueId: typeof PHASE10_C0V_S6_RECOVERY_V4_PACKET_CATALOGUE_ID;
    readonly packetCataloguePath: typeof PHASE10_C0V_S6_RECOVERY_V4_PACKET_CATALOGUE_PATH;
    readonly maximumAuthorizedNewAttempts: 1;
    readonly authorizedAttempts: readonly [Phase10C0VS6RecoveryAuthorizedAttempt];
  };
}

export interface Phase10C0VS6RecoveryV5Authority {
  readonly schema: typeof PHASE10_C0V_S6_RECOVERY_V5_AUTHORITY_SCHEMA;
  readonly recoveryAuthorityId: typeof PHASE10_C0V_S6_RECOVERY_V5_AUTHORITY_ID;
  readonly automaticRetry: false;
  readonly predecessorImplementationFreezeCommit:
    typeof PHASE10_C0V_S6_RECOVERY_V5_PREDECESSOR_IMPLEMENTATION_FREEZE_COMMIT;
  readonly predecessorRecoveryAuthority: Phase10C0VS6ArtifactIdentity;
  readonly predecessorPacketCatalogue: Phase10C0VS6ArtifactIdentity;
  readonly predecessorApProtocol: Phase10C0VS6ArtifactIdentity;
  readonly predecessorLockArtifacts: readonly [
    Phase10C0VS6RecoveryPredecessorLockArtifact,
    Phase10C0VS6RecoveryPredecessorLockArtifact,
    Phase10C0VS6RecoveryPredecessorLockArtifact,
    Phase10C0VS6RecoveryPredecessorLockArtifact,
    Phase10C0VS6RecoveryPredecessorLockArtifact,
    Phase10C0VS6RecoveryPredecessorLockArtifact,
    Phase10C0VS6RecoveryPredecessorLockArtifact,
    Phase10C0VS6RecoveryPredecessorLockArtifact,
    Phase10C0VS6RecoveryPredecessorLockArtifact,
    Phase10C0VS6RecoveryPredecessorLockArtifact,
  ];
  readonly predecessorAttemptArtifacts: readonly Phase10C0VS6ArtifactIdentity[];
  readonly predecessorPublishedArtifacts: readonly Phase10C0VS6ArtifactIdentity[];
  readonly predecessorGovernedAbsentPaths: readonly string[];
  readonly retainedBytes: typeof PHASE10_C0V_S6_RECOVERY_V5_RETAINED_BYTES;
  readonly observedWorkerProcessCount: 1;
  readonly observedWorkerLifetimeNanoseconds: 134346732400;
  readonly creditedGovernedInvocationCount: 4;
  readonly creditedGovernedElapsedNanoseconds:
    typeof PHASE10_C0V_S6_RECOVERY_V5_CREDITED_GOVERNED_ELAPSED_NANOSECONDS;
  readonly creditedGovernedProcessHours: 0.037186253527777775;
  readonly successor: {
    readonly packetCatalogueId: typeof PHASE10_C0V_S6_RECOVERY_V5_PACKET_CATALOGUE_ID;
    readonly packetCataloguePath: typeof PHASE10_C0V_S6_RECOVERY_V5_PACKET_CATALOGUE_PATH;
    readonly maximumAuthorizedNewAttempts: 1;
    readonly authorizedAttempts: readonly [Phase10C0VS6RecoveryAuthorizedAttempt];
  };
}

export interface Phase10C0VS6RecoveryV6Authority {
  readonly schema: typeof PHASE10_C0V_S6_RECOVERY_V6_AUTHORITY_SCHEMA;
  readonly recoveryAuthorityId: typeof PHASE10_C0V_S6_RECOVERY_V6_AUTHORITY_ID;
  readonly automaticRetry: false;
  readonly predecessorImplementationFreezeCommit:
    typeof PHASE10_C0V_S6_RECOVERY_V6_PREDECESSOR_IMPLEMENTATION_FREEZE_COMMIT;
  readonly predecessorAcceptedPacketCommit:
    typeof PHASE10_C0V_S6_RECOVERY_V6_PREDECESSOR_ACCEPTED_PACKET_COMMIT;
  readonly predecessorRecoveryAuthority: Phase10C0VS6ArtifactIdentity;
  readonly predecessorPacketCatalogue: Phase10C0VS6ArtifactIdentity;
  readonly predecessorApProtocol: Phase10C0VS6ArtifactIdentity;
  readonly predecessorAuthorizedPacketProtocol: Phase10C0VS6ArtifactIdentity;
  readonly predecessorLockArtifacts: readonly [
    Phase10C0VS6RecoveryPredecessorLockArtifact,
    Phase10C0VS6RecoveryPredecessorLockArtifact,
    Phase10C0VS6RecoveryPredecessorLockArtifact,
    Phase10C0VS6RecoveryPredecessorLockArtifact,
    Phase10C0VS6RecoveryPredecessorLockArtifact,
    Phase10C0VS6RecoveryPredecessorLockArtifact,
    Phase10C0VS6RecoveryPredecessorLockArtifact,
    Phase10C0VS6RecoveryPredecessorLockArtifact,
    Phase10C0VS6RecoveryPredecessorLockArtifact,
    Phase10C0VS6RecoveryPredecessorLockArtifact,
    Phase10C0VS6RecoveryPredecessorLockArtifact,
    Phase10C0VS6RecoveryPredecessorLockArtifact,
  ];
  readonly predecessorAttemptArtifacts: readonly Phase10C0VS6ArtifactIdentity[];
  readonly predecessorPublishedArtifacts: readonly Phase10C0VS6ArtifactIdentity[];
  readonly predecessorGovernedAbsentPaths: readonly string[];
  readonly retainedBytes: typeof PHASE10_C0V_S6_RECOVERY_V6_RETAINED_BYTES;
  readonly observedWorkerProcessCount: 0;
  readonly observedWorkerLifetimeNanoseconds: 0;
  readonly creditedGovernedInvocationCount: 0;
  readonly creditedGovernedElapsedNanoseconds:
    typeof PHASE10_C0V_S6_RECOVERY_V6_CREDITED_GOVERNED_ELAPSED_NANOSECONDS;
  readonly creditedGovernedProcessHours: 0;
  readonly successor: {
    readonly packetCatalogueId: typeof PHASE10_C0V_S6_RECOVERY_V6_PACKET_CATALOGUE_ID;
    readonly packetCataloguePath: typeof PHASE10_C0V_S6_RECOVERY_V6_PACKET_CATALOGUE_PATH;
    readonly maximumAuthorizedNewAttempts: 1;
    readonly authorizedAttempts: readonly [Phase10C0VS6RecoveryAuthorizedAttempt];
  };
}

export interface Phase10C0VS6RecoveryV7Authority {
  readonly schema: typeof PHASE10_C0V_S6_RECOVERY_V7_AUTHORITY_SCHEMA;
  readonly recoveryAuthorityId: typeof PHASE10_C0V_S6_RECOVERY_V7_AUTHORITY_ID;
  readonly automaticRetry: false;
  readonly predecessorImplementationFreezeCommit:
    typeof PHASE10_C0V_S6_RECOVERY_V7_PREDECESSOR_IMPLEMENTATION_FREEZE_COMMIT;
  readonly predecessorAcceptedPacketCommit:
    typeof PHASE10_C0V_S6_RECOVERY_V7_PREDECESSOR_ACCEPTED_PACKET_COMMIT;
  readonly predecessorRecoveryAuthority: Phase10C0VS6ArtifactIdentity;
  readonly predecessorPacketCatalogue: Phase10C0VS6ArtifactIdentity;
  readonly predecessorApProtocol: Phase10C0VS6ArtifactIdentity;
  readonly predecessorAuthorizedPacketProtocol: Phase10C0VS6ArtifactIdentity;
  readonly predecessorLockArtifacts: readonly [
    Phase10C0VS6RecoveryPredecessorLockArtifact,
    Phase10C0VS6RecoveryPredecessorLockArtifact,
    Phase10C0VS6RecoveryPredecessorLockArtifact,
    Phase10C0VS6RecoveryPredecessorLockArtifact,
    Phase10C0VS6RecoveryPredecessorLockArtifact,
    Phase10C0VS6RecoveryPredecessorLockArtifact,
    Phase10C0VS6RecoveryPredecessorLockArtifact,
    Phase10C0VS6RecoveryPredecessorLockArtifact,
    Phase10C0VS6RecoveryPredecessorLockArtifact,
    Phase10C0VS6RecoveryPredecessorLockArtifact,
    Phase10C0VS6RecoveryPredecessorLockArtifact,
    Phase10C0VS6RecoveryPredecessorLockArtifact,
    Phase10C0VS6RecoveryPredecessorLockArtifact,
    Phase10C0VS6RecoveryPredecessorLockArtifact,
  ];
  readonly predecessorAttemptArtifacts: readonly Phase10C0VS6ArtifactIdentity[];
  readonly predecessorPublishedArtifacts: readonly Phase10C0VS6ArtifactIdentity[];
  readonly predecessorGovernedAbsentPaths: readonly string[];
  readonly retainedBytes: typeof PHASE10_C0V_S6_RECOVERY_V7_RETAINED_BYTES;
  readonly observedWorkerProcessCount: 0;
  readonly observedWorkerLifetimeNanoseconds: 0;
  readonly creditedGovernedInvocationCount: 0;
  readonly creditedGovernedElapsedNanoseconds:
    typeof PHASE10_C0V_S6_RECOVERY_V7_CREDITED_GOVERNED_ELAPSED_NANOSECONDS;
  readonly creditedGovernedProcessHours: 0;
  readonly successor: {
    readonly packetCatalogueId: typeof PHASE10_C0V_S6_RECOVERY_V7_PACKET_CATALOGUE_ID;
    readonly packetCataloguePath: typeof PHASE10_C0V_S6_RECOVERY_V7_PACKET_CATALOGUE_PATH;
    readonly maximumAuthorizedNewAttempts: 1;
    readonly authorizedAttempts: readonly [Phase10C0VS6RecoveryAuthorizedAttempt];
  };
}

export interface Phase10C0VS6RecoveryV8Authority {
  readonly schema: typeof PHASE10_C0V_S6_RECOVERY_V8_AUTHORITY_SCHEMA;
  readonly recoveryAuthorityId: typeof PHASE10_C0V_S6_RECOVERY_V8_AUTHORITY_ID;
  readonly automaticRetry: false;
  readonly predecessorImplementationFreezeCommit:
    typeof PHASE10_C0V_S6_RECOVERY_V8_PREDECESSOR_IMPLEMENTATION_FREEZE_COMMIT;
  readonly predecessorAcceptedPacketCommit:
    typeof PHASE10_C0V_S6_RECOVERY_V8_PREDECESSOR_ACCEPTED_PACKET_COMMIT;
  readonly predecessorRecoveryAuthority: Phase10C0VS6ArtifactIdentity;
  readonly predecessorPacketCatalogue: Phase10C0VS6ArtifactIdentity;
  readonly predecessorApProtocol: Phase10C0VS6ArtifactIdentity;
  readonly predecessorAuthorizedPacketProtocol: Phase10C0VS6ArtifactIdentity;
  readonly predecessorLockArtifacts: readonly [
    Phase10C0VS6RecoveryPredecessorLockArtifact,
    Phase10C0VS6RecoveryPredecessorLockArtifact,
    Phase10C0VS6RecoveryPredecessorLockArtifact,
    Phase10C0VS6RecoveryPredecessorLockArtifact,
    Phase10C0VS6RecoveryPredecessorLockArtifact,
    Phase10C0VS6RecoveryPredecessorLockArtifact,
    Phase10C0VS6RecoveryPredecessorLockArtifact,
    Phase10C0VS6RecoveryPredecessorLockArtifact,
    Phase10C0VS6RecoveryPredecessorLockArtifact,
    Phase10C0VS6RecoveryPredecessorLockArtifact,
    Phase10C0VS6RecoveryPredecessorLockArtifact,
    Phase10C0VS6RecoveryPredecessorLockArtifact,
    Phase10C0VS6RecoveryPredecessorLockArtifact,
    Phase10C0VS6RecoveryPredecessorLockArtifact,
    Phase10C0VS6RecoveryPredecessorLockArtifact,
    Phase10C0VS6RecoveryPredecessorLockArtifact,
  ];
  readonly predecessorAttemptArtifacts: readonly Phase10C0VS6ArtifactIdentity[];
  readonly predecessorPublishedArtifacts: readonly Phase10C0VS6ArtifactIdentity[];
  readonly predecessorGovernedAbsentPaths: readonly string[];
  readonly retainedBytes: typeof PHASE10_C0V_S6_RECOVERY_V8_RETAINED_BYTES;
  readonly observedWorkerProcessCount: 0;
  readonly observedWorkerLifetimeNanoseconds: 0;
  readonly creditedGovernedInvocationCount: 0;
  readonly creditedGovernedElapsedNanoseconds:
    typeof PHASE10_C0V_S6_RECOVERY_V8_CREDITED_GOVERNED_ELAPSED_NANOSECONDS;
  readonly creditedGovernedProcessHours: 0;
  readonly successor: {
    readonly packetCatalogueId: typeof PHASE10_C0V_S6_RECOVERY_V8_PACKET_CATALOGUE_ID;
    readonly packetCataloguePath: typeof PHASE10_C0V_S6_RECOVERY_V8_PACKET_CATALOGUE_PATH;
    readonly maximumAuthorizedNewAttempts: 1;
    readonly authorizedAttempts: readonly [Phase10C0VS6RecoveryAuthorizedAttempt];
  };
}

export interface Phase10C0VS6RecoveryV9Authority {
  readonly schema: typeof PHASE10_C0V_S6_RECOVERY_V9_AUTHORITY_SCHEMA;
  readonly recoveryAuthorityId: typeof PHASE10_C0V_S6_RECOVERY_V9_AUTHORITY_ID;
  readonly automaticRetry: false;
  readonly predecessorImplementationFreezeCommit:
    typeof PHASE10_C0V_S6_RECOVERY_V9_PREDECESSOR_IMPLEMENTATION_FREEZE_COMMIT;
  readonly predecessorAcceptedPacketCommit:
    typeof PHASE10_C0V_S6_RECOVERY_V9_PREDECESSOR_ACCEPTED_PACKET_COMMIT;
  readonly predecessorRecoveryAuthority: Phase10C0VS6ArtifactIdentity;
  readonly predecessorPacketCatalogue: Phase10C0VS6ArtifactIdentity;
  readonly predecessorApProtocol: Phase10C0VS6ArtifactIdentity;
  readonly predecessorAuthorizedPacketProtocol: Phase10C0VS6ArtifactIdentity;
  readonly predecessorLockArtifacts: readonly Phase10C0VS6RecoveryPredecessorLockArtifact[];
  readonly predecessorAttemptArtifacts: readonly Phase10C0VS6ArtifactIdentity[];
  readonly predecessorPublishedArtifacts: readonly Phase10C0VS6ArtifactIdentity[];
  readonly predecessorGovernedAbsentPaths: readonly string[];
  readonly retainedBytes: typeof PHASE10_C0V_S6_RECOVERY_V9_RETAINED_BYTES;
  readonly observedWorkerProcessCount: 1;
  readonly observedWorkerLifetimeNanoseconds:
    typeof PHASE10_C0V_S6_RECOVERY_V9_OBSERVED_WORKER_LIFETIME_NANOSECONDS;
  readonly creditedGovernedInvocationCount: 1;
  readonly creditedGovernedElapsedNanoseconds:
    typeof PHASE10_C0V_S6_RECOVERY_V9_CREDITED_GOVERNED_ELAPSED_NANOSECONDS;
  readonly creditedGovernedProcessHours:
    typeof PHASE10_C0V_S6_RECOVERY_V9_CREDITED_GOVERNED_PROCESS_HOURS;
  readonly successor: {
    readonly packetCatalogueId: typeof PHASE10_C0V_S6_RECOVERY_V9_PACKET_CATALOGUE_ID;
    readonly packetCataloguePath: typeof PHASE10_C0V_S6_RECOVERY_V9_PACKET_CATALOGUE_PATH;
    readonly maximumAuthorizedNewAttempts: 1;
    readonly authorizedAttempts: readonly [Phase10C0VS6RecoveryAuthorizedAttempt];
  };
}


export interface Phase10C0VS6OutputDefinition {
  readonly outputId: string;
  readonly packetId: Phase10C0VS6PacketId;
  readonly producerCallableId: string;
  readonly artifact: {
    readonly path: string;
    readonly field: string | null;
    readonly schemaId: string;
  };
  readonly terminalStates: readonly ("complete" | "pass" | "fail" | "refusal")[];
  readonly dependsOnOutputIds: readonly string[];
}

export interface Phase10C0VS6CheckDefinition {
  readonly checkId: string;
  readonly packetId: Phase10C0VS6PacketId;
  readonly callerCallableId: string;
  readonly independentEvaluatorCallableId: string;
  readonly negativeControlIds: readonly string[];
  readonly dependsOnOutputIds: readonly string[];
  readonly dependsOnCheckIds: readonly string[];
}

export interface Phase10C0VS6NegativeControlDefinition {
  readonly negativeControlId: string;
  readonly packetId: Phase10C0VS6PacketId;
  readonly ownerCheckId: string;
  readonly callableId: string;
  readonly mutation: string;
}

export interface Phase10C0VS6PacketDefinition {
  readonly packetId: Phase10C0VS6PacketId;
  readonly launchClass: "static-contract" | "solver-control" | "non-solver";
  readonly executionMode: Phase10C0VS6ExecutionMode;
  readonly outputIds: readonly string[];
  readonly checkIds: readonly string[];
  readonly negativeControlIds: readonly string[];
  readonly dependencyPacketIds: readonly string[];
}

export interface Phase10C0VS6RouteSubroute {
  readonly subrouteId: string;
  readonly dispositionCode: Phase10C0VS6DispositionCode;
  readonly requiredOutputIds: readonly string[];
  readonly forbiddenOutputIds: readonly string[];
  readonly requiredCheckIds: readonly string[];
  readonly forbiddenCheckIds: readonly string[];
  readonly requiredNegativeControlIds: readonly string[];
  readonly forbiddenNegativeControlIds: readonly string[];
}

export type Phase10C0VS6PacketTerminalSubrouteAuthority = Omit<
  Phase10C0VS6RouteSubroute,
  "dispositionCode"
> & {
  readonly dispositionCode: Phase10C0VS6DispositionCode | null;
  readonly classificationConditionIds: readonly string[];
};

export interface Phase10C0VS6RouteDefinition {
  readonly routeId: string;
  readonly layerId: Phase10C0VS6LayerId;
  readonly executionMode: "radial-production" | "discrepancy-match-only" | "preimplementation-refusal";
  readonly selectedByDisposition: "reference-frozen" | "reference-discrepancy-refusal" | "reference-refusal";
  readonly active: boolean;
  readonly allowedAttemptDispositionCodes: readonly Phase10C0VS6DispositionCode[];
  readonly terminalSubroutes: readonly Phase10C0VS6RouteSubroute[] | null;
  readonly requiredOutputIds: readonly string[] | null;
  readonly forbiddenOutputIds: readonly string[] | null;
  readonly requiredCheckIds: readonly string[] | null;
  readonly forbiddenCheckIds: readonly string[] | null;
  readonly requiredNegativeControlIds: readonly string[] | null;
  readonly forbiddenNegativeControlIds: readonly string[] | null;
  readonly retryableRule: string | null;
  readonly inactiveReason: string | null;
}

export interface Phase10C0VS6LayerAuthority {
  readonly layerId: Phase10C0VS6LayerId;
  readonly scienceBranch: "independent-reference" | "reference-refusal";
  readonly scienceProtocol: Phase10C0VS6ArtifactIdentity;
  readonly referenceOrRefusal: Phase10C0VS6ArtifactIdentity;
  readonly s5ArtifactDisposition: "reference-frozen" | "reference-discrepancy-refusal" | "reference-refusal";
  readonly selectedRouteId: string;
}

export interface Phase10C0VS6ObligationMatrix {
  readonly schema: typeof PHASE10_C0V_S6_MATRIX_SCHEMA;
  readonly matrixId: typeof PHASE10_C0V_S6_MATRIX_ID;
  readonly frozenDate: "2026-08-22";
  readonly bindings: StrictJson;
  readonly overridePolicy: StrictJson;
  readonly s5Layers: readonly Phase10C0VS6LayerAuthority[];
  readonly routes: readonly Phase10C0VS6RouteDefinition[];
  readonly packets: readonly Phase10C0VS6PacketDefinition[];
  readonly outputs: readonly Phase10C0VS6OutputDefinition[];
  readonly checks: readonly Phase10C0VS6CheckDefinition[];
  readonly negativeControls: readonly Phase10C0VS6NegativeControlDefinition[];
}

export interface Phase10C0VS6ExecutionRecordTuple {
  readonly tupleId: string;
  readonly dispositionCode: Phase10C0VS6DispositionCode;
  readonly terminalStatus: "pass" | "fail" | "refusal";
  readonly lifecycleStage: string;
  readonly record: {
    readonly protocolReopenCount: number;
    readonly referenceOrRefusalReopenCount: number;
    readonly workerProcessInvocationCount: number;
    readonly solverWorkerInvocationCount: number;
    readonly productionInvocationCount: number;
    readonly discrepancyOrRefusalEvaluatorInvocationCount: number;
    readonly freezeEvaluatorInvocationCount: number;
    readonly resourceEvaluatorInvocationCount: number;
    readonly attemptCensusEvaluatorInvocationCount: number;
    readonly checkCallerInvocationCount: number;
    readonly numericalEvaluatorInvocationCount: number;
    readonly numericalNegativeControlInvocationCount: number;
    readonly acceptedValidWitnessCount: number;
    readonly acceptedNumericalVerdictCount: number;
  };
  readonly governedInvocationElapsedNanosecondsRule: "exact-zero" | "measured-sum";
  readonly partialExecutionRule: "must-be-null" | "must-be-present";
}

export interface Phase10C0VS6ResourceObservationPointRoster {
  readonly tupleId: string;
  readonly observationPointIds: readonly string[];
}

export interface Phase10C0VS6InternalArtifactRoster {
  readonly rosterId: string;
  readonly relativePaths: readonly string[];
}

export interface Phase10C0VS6RegisteredCapBinding {
  readonly tupleId: string;
  readonly invocationId: string;
  readonly conditionId: string;
  readonly observedValueSource: "capped-invocation-wall";
}

export type Phase10C0VS6ExecutableInvocationClass =
  | "solver-production"
  | "numerical-evaluator"
  | "numerical-negative-control"
  | "route-cause-evaluator";

export interface Phase10C0VS6ExecutableInvocationAuthority {
  readonly invocationId: string;
  readonly callableId: string;
  readonly negativeControlId: string | null;
  readonly invocationClass: Phase10C0VS6ExecutableInvocationClass;
  readonly registeredWallSecondsMaximum: 300 | 14400;
  readonly terminalState: "complete" | "registered-cap";
}

export interface Phase10C0VS6ExecutableInvocationRoster {
  readonly tupleId: string;
  readonly completionRule: "complete-roster" | "registered-cap-prefix";
  readonly prefixOfTupleId: string | null;
  readonly invocations: readonly Phase10C0VS6ExecutableInvocationAuthority[];
}

export type Phase10C0VS6PacketVerificationInvocationClass =
  | "packet-producer"
  | "packet-evaluator"
  | "packet-negative-control";

export interface Phase10C0VS6PacketVerificationInvocationAuthority {
  readonly invocationId: string;
  readonly callableId: string;
  readonly negativeControlId: string | null;
  readonly invocationClass: Phase10C0VS6PacketVerificationInvocationClass;
  readonly registeredWallSecondsMaximum: 14400;
}

export interface Phase10C0VS6ClassificationCondition {
  readonly conditionId: string;
  readonly kind:
    | "artifact-identity"
    | "artifact-filesystem-policy"
    | "artifact-presence"
    | "available-bytes"
    | "retained-bytes"
    | "scratch-bytes"
    | "wall-seconds"
    | "process-hours"
    | "process-exit"
    | "reference-disposition"
    | "reference-check-outcome"
    | "negative-control-outcome"
    | "refusal-ground"
    | "lifecycle-classification";
  readonly comparator:
    | "equal"
    | "not-equal"
    | "less-than"
    | "less-than-or-equal"
    | "greater-than"
    | "greater-than-or-equal"
    | "identity-equal"
    | "present"
    | "classified-as";
  readonly registeredValue: string | boolean | number | null;
  readonly unit:
    | "bytes"
    | "seconds"
    | "hours"
    | "count"
    | "artifact-identity"
    | "disposition"
    | "outcome"
    | "reason-code"
    | "exit-code"
    | "classification"
    | null;
  readonly routeSelecting: boolean;
}

export type Phase10C0VS6ClassificationMethod =
  | "independent-artifact-precondition-classification"
  | "independent-prelaunch-resource-classification"
  | "independent-registered-cap-classification"
  | "independent-reference-discrepancy-classification"
  | "independent-preimplementation-refusal-classification";

export interface Phase10C0VS6ClassificationProjectionObservationAuthority {
  readonly conditionId: string;
  readonly kind: Phase10C0VS6ClassificationCondition["kind"];
  readonly comparator: Phase10C0VS6ClassificationCondition["comparator"];
  readonly registeredValue: string | boolean | number | null;
  readonly unit: Phase10C0VS6ClassificationCondition["unit"];
  readonly observedValueSource: string;
  readonly observedValueDerivation: "identity" | "elapsed-nanoseconds-divided-by-1000000000";
  readonly finalizedValueBinding: string | null;
  readonly conditionPassRule: "must-pass" | "exactly-one-selected-pass";
  readonly evidenceIds: readonly string[];
}

export interface Phase10C0VS6ClassificationProjectionEvidenceAuthority {
  readonly evidenceId: string;
  readonly evidenceRole:
    | "packet-protocol" | "science-protocol" | "reference-or-refusal" | "preflight-receipt"
    | "exit-record" | "classification-input";
  readonly retentionClass:
    | "tracked-authority" | "tracked-evidence" | "embedded-preflight-observation" | "embedded-attempt-record"
    | "embedded-terminal-record" | "ignored-staging-corroboration";
  readonly artifactSource:
    | "bindings.packetProtocol" | "bindings.scienceProtocol" | "bindings.referenceOrRefusal"
    | "retainedPreflight" | "internal.exitStatus" | "internal.workerInvocations"
    | "internal.workerProgress" | null;
  readonly artifactRelativePath: string | null;
  readonly inlineObservationPath: string | null;
}

export interface Phase10C0VS6ClassificationProjectionRoster {
  readonly subrouteId: string;
  readonly validationId: string;
  readonly assemblerCallableId: string;
  readonly componentEvaluatorCallableIds: readonly string[];
  readonly method: Phase10C0VS6ClassificationMethod;
  readonly selectedConditionCardinality: "all" | "exactly-one";
  readonly observations: readonly Phase10C0VS6ClassificationProjectionObservationAuthority[];
  readonly evidence: readonly Phase10C0VS6ClassificationProjectionEvidenceAuthority[];
  readonly projectionRule: "cause-evaluation-attempt-classification-and-final-rerun-exactly-equal";
}

export interface Phase10C0VS6DependencyArtifactContract {
  readonly packetId: string;
  readonly artifactPath: string;
  readonly schemaId: string;
  readonly retentionClass: "tracked-evidence";
  readonly applicableDispositionCodes: readonly Phase10C0VS6DependencyDispositionCode[];
}

export interface Phase10C0VS6RadialBinaryLayoutAuthority {
  readonly magic: "C0VRAD01";
  readonly formatVersion: 1;
  readonly endiannessMarker: 16909060;
  readonly schemaId: "phase10-c0v-radial-witness-v1";
  readonly schemaByteLength: 29;
  readonly headerByteLength: 153;
  readonly payloadByteLength: 5738;
  readonly fileByteLength: 5891;
  readonly protocolDigestSource: "s5-science-protocol";
  readonly referenceDigestSource: "s5-reference";
  readonly producerEvaluatorSharedRuntimeClosurePaths: readonly string[];
  readonly headerOffsets: Readonly<Record<string, readonly [number, number]>>;
  readonly globalFloatNames: readonly string[];
  readonly caseOrder: readonly string[];
  readonly caseNodeCounts: readonly number[];
  readonly caseScalarNames: readonly string[];
  readonly caseRecordByteLengths: readonly number[];
  readonly payloadPrefixByteLength: 184;
  readonly recordByteLengthPrefixPresent: false;
  readonly numericEncoding: "float64-le-finite-no-negative-zero";
  readonly exactZeroEncoding: "positive-zero";
  readonly trailingBytesAllowed: false;
}

export interface Phase10C0VS6RadialProducerSummaryAuthority {
  readonly schema: "phase10-c0v-radial-producer-summary-v1";
  readonly authority: "non-authoritative";
  readonly exactFields: readonly string[];
  readonly caseCount: 4;
  readonly totalNumericFieldValues: 300;
  readonly totalUniformFieldValues: 300;
  readonly reportedMaximumRule: string;
  readonly evaluatorUse: "inventory-and-parse-only-never-metrics-or-verdict";
}

export interface Phase10C0VS6ControlOperatorAuthority {
  readonly negativeControlId: string;
  readonly operator: string;
  readonly invariantBindings: readonly string[];
  readonly expected: string;
}

export interface Phase10C0VS6PacketResources {
  readonly requiredRuntime: "Node v24.13.1";
  readonly solverWorkerTimeoutSeconds: 300 | null;
  readonly perExecutableControlInvocationWallHoursMaximum: 4;
  readonly outerInfrastructureOrchestrationAllowanceSeconds: 3600;
  readonly outerInfrastructureSafetyTimeoutSeconds: number;
  readonly outerInfrastructureTimingRule: "parent-monotonic-nanoseconds-limit-plus-one-millisecond-fail-stop-stale-lock-invalidates-claims";
  readonly packageElapsedNanosecondsMaximum: 86400000000000;
  readonly packageProcessHoursMaximum: 24;
  readonly currentPacketRegisteredElapsedNanosecondsMaximum: number;
  readonly currentPacketRegisteredProcessHoursMaximum: number;
  readonly attemptRootWritePolicy: "exclusive-create-append-only-no-delete-no-overwrite";
  readonly transientCopyAccounting: "all-physical-staging-copies-counted";
  readonly filesystemObjectPolicy: "regular-file-single-link-unaliased-parent";
  readonly publicationTransitionPolicy: "registered-stage-to-final-hardlink-window-no-credit-final-single-link";
  readonly lockLifetimePolicy: "held-through-awaited-worker-and-rejected-action-until-governed-recovery";
  readonly lockAcquisitionPolicy: "compiled-package-then-packet-before-authority-read-stale-global-halts-all";
  readonly packageStorageAccountingRule: "physical-path-copies-no-content-deduplication";
  readonly packageStorageBaselineArtifacts: readonly Phase10C0VS6ArtifactIdentity[];
  readonly packageStorageBaselineBytes:
    1629577 | 1629973 | 1693893 | 2123065 | 2556578 | 2994387 | 2994827 | 2995267 | 2995707 |
    3098692;
  readonly processConcurrency: 1;
  readonly solverProcessConcurrency: 0 | 1;
  readonly retainedStorageBytesMaximum: 68719476736;
  readonly projectedScratchBytes: number;
  readonly projectedPublicationBytes: number;
  readonly publicationFinalizationProjections: readonly Phase10C0VS6PublicationFinalizationProjection[];
  readonly minimumFreeBytes: number;
  readonly automaticRetry: false;
  readonly automaticRefinementOrFanOut: false;
}

export interface Phase10C0VS6PublicationFinalizationProjection {
  readonly artifactRole: "packet-verification" | "terminal-receipt";
  readonly path: string;
  readonly stagingPath: string;
  readonly maximumByteLength: 524288 | 131072;
}

export interface Phase10C0VS6PublicationStagingPath {
  readonly finalPath: string;
  readonly stagingPath: string;
}

export interface Phase10C0VS6AncestryAuthority {
  readonly launchBranch: "phase10/evidence-verification";
  readonly governanceCommit: "fdb829b7a31e9e2573d8217d317ad7f5ffbc54fc";
  readonly s5ScienceFreezeCommit: "cf0bd8b6ad12c79e38cb30ca0e50bcadab9cc6d9";
  readonly s5InfrastructureCorrectionCommit: "cd331b75be4527bab11f3139d968626914a87694";
  readonly s5EvidenceFreezeCommit: "a14d9049751d561629a6fdc6bf85fdc9cc99e870";
  readonly cleanWorktreeRequired: true;
  readonly headMustEqualLaunchCommit: true;
  readonly launchCleanObservationRule: "preflight-observes-empty-status-before-first-generated-write";
  readonly indexConcealmentRule: "git-ls-files-t-v-roster-equals-launch-head-and-every-tag-is-uppercase-H";
  readonly postLaunchRevalidationRule: "launch-head-authority-bytes-exact-with-stage-selected-generated-dirt-only";
  readonly postLaunchDirtyAllowlistRule: "freeze-preflight-only-packet-verification-selected-required-publications-minus-current-verification-and-terminal-final-reopen-selected-required-publications";
  readonly implementationFreezeRule:
    | "common-first-introduction-commit-of-execution-v2-authority-and-callable-closure"
    | "first-introduction-commit-of-recovery-v1-authority-and-current-successor-closure"
    | "first-introduction-commit-of-recovery-v2-authority-with-both-predecessor-freezes-ancestor-and-current-successor-closure"
    | "first-introduction-commit-of-recovery-v3-authority-with-all-predecessor-freezes-ancestor-and-current-successor-closure"
    | "first-introduction-commit-of-recovery-v4-authority-with-all-predecessor-freezes-ancestor-and-current-successor-closure"
    | "first-introduction-commit-of-recovery-v5-authority-with-all-predecessor-freezes-ancestor-and-current-successor-closure"
    | "first-introduction-commit-of-recovery-v6-authority-with-all-predecessor-freezes-ancestor-and-current-successor-closure"
    | "first-introduction-commit-of-recovery-v7-authority-with-all-predecessor-freezes-ancestor-and-current-successor-closure"
    | "first-introduction-commit-of-recovery-v8-authority-with-all-predecessor-freezes-ancestor-and-current-successor-closure"
    | "first-introduction-commit-of-recovery-v9-authority-with-all-predecessor-freezes-ancestor-and-current-successor-closure";
  readonly codeFreezeSource: "git-first-introduction-plus-current-byte-match";
}

export interface Phase10C0VS6PreObservationProductionClosureAuthority {
  readonly schema: "phase10-c0v-s6-preobservation-production-closure-v1";
  readonly commit: "cf0bd8b6ad12c79e38cb30ca0e50bcadab9cc6d9";
  readonly artifacts: readonly Phase10C0VS6ArtifactIdentity[];
  readonly membershipRule: "producer-import-closure-and-resolution-artifacts-existing-at-s5-science-freeze";
  readonly comparisonRule: "live-and-implementation-blobs-equal-cf0-raw-bytes";
}

export interface Phase10C0VS6PreflightObservedContract {
  readonly schema: "phase10-c0v-s6-preflight-observed-contract-v1";
  readonly observedFieldOrder: readonly string[];
  readonly resourceFieldOrder: readonly string[];
  readonly ancestryFieldOrder: readonly string[];
  readonly selectedBranchesFieldOrder: readonly ["selectedRouteId", "s5ArtifactDisposition"];
  readonly stage: "run";
  readonly commandTemplateId: "run";
  readonly launchClass: "static-contract" | "solver-control" | "non-solver";
  readonly cwd: ".";
  readonly repositoryBundleRoot: ".";
  readonly packetCataloguePath:
    | "research/phase10-execution-v2/packet-catalogue.json"
    | typeof PHASE10_C0V_S6_RECOVERY_PACKET_CATALOGUE_PATH
    | typeof PHASE10_C0V_S6_RECOVERY_V2_PACKET_CATALOGUE_PATH
    | typeof PHASE10_C0V_S6_RECOVERY_V3_PACKET_CATALOGUE_PATH
      | typeof PHASE10_C0V_S6_RECOVERY_V4_PACKET_CATALOGUE_PATH
      | typeof PHASE10_C0V_S6_RECOVERY_V5_PACKET_CATALOGUE_PATH
      | typeof PHASE10_C0V_S6_RECOVERY_V6_PACKET_CATALOGUE_PATH
      | typeof PHASE10_C0V_S6_RECOVERY_V7_PACKET_CATALOGUE_PATH
      | typeof PHASE10_C0V_S6_RECOVERY_V8_PACKET_CATALOGUE_PATH
      | typeof PHASE10_C0V_S6_RECOVERY_V9_PACKET_CATALOGUE_PATH;
  readonly cleanWorktreeRequired: true;
  readonly nasOrNetworkAccess: false;
  readonly allowedRefusalDispositionCodes: readonly ("preproduction-artifact-refusal" | "prelaunch-resource-refusal")[];
}

export interface Phase10C0VS6WorkerProgressContract {
  readonly schema: "phase10-c0v-worker-progress-contract-v1";
  readonly filename: "worker-progress.jsonl";
  readonly rowSchema: "phase10-c0v-worker-progress-row-v1";
  readonly exactFields: readonly string[];
  readonly eventValues: readonly string[];
  readonly eventStateTransitions: readonly {
    readonly transitionId: string;
    readonly event: string;
    readonly positionRule: string;
    readonly invocationRule: string;
    readonly caseRule: string;
    readonly terminalStateValues: readonly string[];
    readonly progressRule: string;
  }[];
  readonly caseOrder: readonly string[];
  readonly completedFieldValueCounts: readonly number[];
  readonly writer: "parent-executor-from-structured-child-messages";
  readonly sequenceRule: "zero-based-contiguous";
  readonly timestampRule: "canonical-millisecond-utc-nondecreasing-within-attempt";
  readonly prefixRule: "started-and-completed-case-lists-are-exact-roster-prefixes";
  readonly countRule: "numeric-and-uniform-counts-equal-sum-of-completed-case-node-counts";
  readonly candidateRule: "zero-and-null-until-exact-retained-candidate-exists";
  readonly embeddedRule: "compact-jsonl-lf-reserialization-matches-artifact-identity";
}

export interface Phase10C0VS6WorkerInvocationContract {
  readonly schema: "phase10-c0v-worker-invocation-contract-v1";
  readonly filename: "worker-invocations.jsonl";
  readonly rowSchema: "phase10-c0v-worker-invocation-row-v1";
  readonly exactFields: readonly string[];
  readonly eventValues: readonly string[];
  readonly eventStateTransitions: readonly {
    readonly transitionId: string;
    readonly event: string;
    readonly positionRule: string;
    readonly invocationRule: string;
    readonly terminalStateValues: readonly string[];
  }[];
  readonly writer: "parent-executor-from-structured-child-messages";
  readonly sequenceRule: "zero-based-contiguous";
  readonly timestampRule: "canonical-millisecond-utc-nondecreasing-within-attempt";
  readonly monotonicClockRule: "parent-owned-zero-based-safe-integer-nanoseconds-nondecreasing";
  readonly durationRule: "elapsed-nanoseconds-from-invocation-offset-difference-wall-seconds-derived-only-from-elapsed";
  readonly rosterRule: "exact-protocol-leaf-roster-or-registered-prefix";
  readonly embeddedDerivationRule: "attempt-or-verification-records-derived-from-raw-parent-events";
}

export interface Phase10C0VS6ExitStatusContract {
  readonly schema: "phase10-c0v-exit-status-contract-v1";
  readonly filename: "exit-status.json";
  readonly rowSchema: "phase10-c0v-exit-status-v1";
  readonly exactFields: readonly string[];
  readonly classificationValues: readonly ["no-worker", "complete", "registered-cap", "infrastructure-failure"];
  readonly exitCodeRule: "no-worker-both-null-worker-exactly-one-code-or-signal";
  readonly signalRule: "raw-child-signal-never-route-selecting";
  readonly ownership: "parent-executor";
}

export interface Phase10C0VS6FreezeEvaluationContract {
  readonly schema: "phase10-c0v-s6-freeze-evaluation-contract-v1";
  readonly filename: "freeze-evaluation.json";
  readonly rowSchema: "phase10-c0v-s6-freeze-evaluation-v1";
  readonly evaluationIdRule: "freeze-packet-registered-attempt-v1";
  readonly exactFields: readonly string[];
  readonly artifactFailureExactFields: readonly string[];
  readonly artifactFailureRule: "null-except-radial-preproduction-artifact-refusal";
  readonly verdictRule: "pass-means-freeze-and-selected-artifact-observation-independently-rederived";
  readonly constructionRule: "immutable-before-terminal-candidate-no-overwrite";
}

export interface Phase10C0VS6CauseEvaluationContract {
  readonly schema: "phase10-c0v-s6-cause-evaluation-contract-v1";
  readonly filename: "cause-evaluation.json";
  readonly rowSchema: "phase10-c0v-s6-cause-evaluation-v1";
  readonly evaluationIdRule: "cause-packet-registered-attempt-subroute-v1";
  readonly exactFields: readonly string[];
  readonly observationExactFields: readonly string[];
  readonly evidenceExactFields: readonly ["evidenceId", "evidenceRole", "retentionClass", "artifact", "inlineObservationPath"];
  readonly workerInvocationsRule: "null-iff-worker-process-count-zero-otherwise-exact-attempt-local-identity";
  readonly selectionRule: "exact-terminal-subroute-condition-roster-and-raw-observations";
  readonly evidenceRule: "condition-specific-tracked-identities-or-inline-observations-no-self-identity";
  readonly routeRule: "cross-route-extra-missing-or-relabelled-observation-refuses";
  readonly constructionRule: "immutable-before-terminal-candidate-no-overwrite";
}

export interface Phase10C0VS6DecisionAuthority {
  readonly decisionRole: "freeze" | "cause";
  readonly fieldName: "freezeDecision" | "causeDecision";
  readonly decisionId: string;
  readonly evaluatorCallableId: string;
  readonly invokedCheckIds: readonly string[];
  readonly expectedVerdict: "pass" | "fail";
  readonly evidence: readonly Phase10C0VS6DecisionEvidenceAuthority[];
}

export interface Phase10C0VS6DecisionEvidenceAuthority {
  readonly evidenceRole: "freeze-evaluation" | "cause-evaluation";
  readonly artifactRelativePath: "freeze-evaluation.json" | "cause-evaluation.json";
}

export interface Phase10C0VS6DecisionRosterAuthority {
  readonly subrouteId: string;
  readonly candidateFilename: "terminal-success-candidate.json";
  readonly candidateVerdict: "accepted-route-candidate";
  readonly candidateProducedOutputIds: readonly string[];
  readonly candidateExecutedCheckIds: readonly string[];
  readonly candidateExecutedNegativeControlIds: readonly string[];
  readonly candidateReasonCodes: readonly string[];
  readonly candidateCallerInvocationIds: readonly string[];
  readonly decisions: readonly Phase10C0VS6DecisionAuthority[];
}

export interface Phase10C0VS6CallerResultSourceAuthority {
  readonly artifactRole: string;
  readonly sourceKind: "registered-output" | "attempt-internal";
  readonly outputId: string | null;
  readonly artifactRelativePath: string | null;
}

export interface Phase10C0VS6CallerInvocationResultAuthority {
  readonly callerInvocationId: string;
  readonly stage: "pre-candidate" | "post-candidate";
  readonly callerCallableId: string;
  readonly evaluatorCallableId: string;
  readonly terminalState: "complete" | "child-registered-cap";
  readonly executedCheckIds: readonly string[];
  readonly evaluatedCheckIds: readonly string[];
  readonly executedNegativeControlIds: readonly string[];
  readonly evaluatorResultRule: "canonical-rerun-exact" | "null-child-registered-cap";
  readonly sourceArtifactAuthorities: readonly Phase10C0VS6CallerResultSourceAuthority[];
}

export interface Phase10C0VS6CallerInvocationResultRosterAuthority {
  readonly subrouteId: string;
  readonly callerInvocationResults: readonly Phase10C0VS6CallerInvocationResultAuthority[];
}

export interface Phase10C0VS6AggregateNegativeControlContract {
  readonly schema: "phase10-c0v-any-layer-nonpass-control-contract-v1";
  readonly filename: "any-layer-nonpass-control.json";
  readonly rowSchema: "phase10-c0v-any-layer-nonpass-control-v1";
  readonly exactFields: readonly [
    "schema", "negativeControlId", "ownerCheckId", "callableId", "cleanTable", "mutatedLayerId",
    "mutatedTable", "mutation", "cleanOutcome", "attackedOutcome", "result",
  ];
  readonly mutationExactFields: readonly ["field", "before", "after", "changedRowCount", "otherRowsUnchanged"];
  readonly outcomeExactFields: readonly ["aggregateStatus", "packageCompletionEligible", "dependentQualificationBlocked"];
  readonly resultExactFields: readonly [
    "negativeControlId", "mutationExecuted", "witnessMoved", "cleanCapturePreserved",
    "attackedCheckFailed", "pass",
  ];
  readonly mutationRule: "three-row-all-independent-pass-radial-scientific-disposition-pass-to-refusal-only";
  readonly reproofRule: "producer-embeds-result-only-verifier-rederives-full-receipt-and-exact-compares";
}

export interface Phase10C0VS6TerminalCandidateContract {
  readonly schema: "phase10-c0v-terminal-candidate-contract-v1";
  readonly rowSchema: "phase10-c0v-terminal-candidate-v1";
  readonly successFilename: "terminal-success-candidate.json";
  readonly exactFields: readonly string[];
  readonly decisionExactFields: readonly string[];
  readonly decisionEvidenceExactFields: readonly ["evidenceRole", "artifact"];
  readonly decisionRosters: readonly Phase10C0VS6DecisionRosterAuthority[];
  readonly verdictRule: "accepted-route-candidate-for-every-current-materializable-subroute";
  readonly forbiddenFields: readonly ["attemptLedger", "packetVerification", "terminalReceipt"];
  readonly constructionRule: "immutable-preledger-candidate-no-overwrite";
}

export interface Phase10C0VS6TerminalReceiptContract {
  readonly schema: "phase10-c0v-s6-terminal-receipt-contract-v1";
  readonly receiptSchema: "phase10-c0v-s6-terminal-receipt-v2";
  readonly receiptIdRule: "phase10-packet-attempt-terminal-v2";
  readonly constructionOrder: "terminal-candidate-then-ledger-then-verification-then-final-terminal";
  readonly radialValidatedRefusalCreditRule: "artifact-prelaunch-and-five-cap-refusals-require-verification-and-dependency-credit";
  readonly makerReturnRule: "moving-static-route-cap-and-nonproduce-cap-have-null-verification-zero-credit";
  readonly infrastructureFailStopRule: "retain-ignored-root-and-lock-no-candidate-ledger-verification-or-final-receipt-successor-required";
  readonly callerInvocationResultExactFields: readonly [
    "callerInvocationId", "stage", "callerCallableId", "evaluatorCallableId", "terminalState",
    "executedCheckIds", "evaluatedCheckIds", "executedNegativeControlIds", "evaluatorResult",
    "sourceArtifactIdentities",
  ];
  readonly callerResultSourceIdentityExactFields: readonly ["artifactRole", "artifact"];
  readonly callerInvocationResultRosters: readonly Phase10C0VS6CallerInvocationResultRosterAuthority[];
  readonly callerResultRule: "candidate-prestage-subsequence-verification-full-rerun-terminal-exact-copy";
}

export interface Phase10C0VS6VerificationRegisteredCapBinding {
  readonly invocationId: string;
  readonly conditionId: string;
  readonly observedValueSource: "capped-verification-invocation-wall";
}

export interface Phase10C0VS6RetainedPreflightPass {
  readonly schema: "phase10-c0v-s6-preflight-receipt-v2";
  readonly receiptId: string;
  readonly matrixId: typeof PHASE10_C0V_S6_MATRIX_ID;
  readonly protocolId: string;
  readonly registryId: string;
  readonly packetId: Phase10C0VS6PacketId;
  readonly attemptId: string;
  readonly stage: "run";
  readonly observed: {
    readonly launchClass: "static-contract" | "solver-control" | "non-solver";
    readonly executionMode: Phase10C0VS6ExecutionMode;
    readonly selectedRouteId: string | null;
    readonly branch: "phase10/evidence-verification";
    readonly head: string;
    readonly runtime: "Node v24.13.1";
    readonly command: string;
    readonly cwd: ".";
    readonly repositoryBundleRoot: ".";
    readonly compositeMatrix: Phase10C0VS6ArtifactIdentity;
    readonly packetCatalogue: Phase10C0VS6ArtifactIdentity;
    readonly successorSchemaRegistry: Phase10C0VS6ArtifactIdentity;
    readonly evidenceManifest: Phase10C0VS6ArtifactIdentity;
    readonly scienceProtocol: Phase10C0VS6ArtifactIdentity | null;
    readonly referenceOrRefusal: Phase10C0VS6ArtifactIdentity | null;
    readonly packetProtocol: Phase10C0VS6ArtifactIdentity;
    readonly callableRegistry: Phase10C0VS6ArtifactIdentity;
    readonly codeFreeze: { readonly commit: string; readonly artifacts: readonly Phase10C0VS6ArtifactIdentity[] };
    readonly registeredAttemptRoot: string;
    readonly attemptDirectory: string;
    readonly candidateDirectory: string;
    readonly stdoutPath: string;
    readonly stderrPath: string;
    readonly exitStatusPath: string;
    readonly packageLockPath: Phase10C0VS6PackageLockPath;
    readonly lockPath: string;
    readonly finalPreflightReceiptPath: string;
    readonly finalTerminalReceiptPath: string;
    readonly verificationPaths: readonly string[];
    readonly dependencyPacketIds: readonly string[];
    readonly dependencyArtifacts: readonly Phase10C0VS6ArtifactIdentity[];
    readonly resources: Phase10C0VS6PacketResources & {
      readonly packageElapsedNanosecondsBeforeAttempt: number;
      readonly projectedPackageElapsedNanosecondsAfterAttempt: number;
      readonly packageProcessHoursBeforeAttempt: number;
      readonly projectedPackageProcessHoursAfterAttempt: number;
      readonly packageRetainedBytesBeforeAttempt: number;
      readonly projectedPackageBytesAfterAttempt: number;
      readonly observedFreeBytes: number;
      readonly nasOrNetworkAccess: false;
    };
    readonly ancestry: {
      readonly repositoryClean: true;
      readonly headMatchesLaunch: true;
      readonly requiredCommitsAreAncestors: true;
      readonly boundArtifactsMatch: true;
      readonly codeFreezeMatches: true;
      readonly verdict: "pass";
      readonly errors: readonly string[];
    };
  };
  readonly outputIds: readonly string[];
  readonly checkIds: readonly string[];
  readonly negativeControlIds: readonly string[];
  readonly callableIds: readonly string[];
  readonly selectedBranches: {
    readonly selectedRouteId: string | null;
    readonly s5ArtifactDisposition: "reference-frozen" | "reference-discrepancy-refusal" | "reference-refusal" | null;
  };
  readonly refusalCandidate: null;
  readonly verdict: "pass";
  readonly reasons: readonly string[];
}

export interface Phase10C0VS6PreflightClassificationEvidence {
  readonly evidenceId: string;
  readonly evidenceRole: "packet-protocol" | "science-protocol" | "reference-or-refusal" | "classification-input";
  readonly retentionClass: "tracked-authority" | "inline-observation";
  readonly artifact: Phase10C0VS6ArtifactIdentity | null;
  readonly inlineObservationPath: string | null;
}

export interface Phase10C0VS6PreflightRefusalCandidate {
  readonly dispositionCode: "preproduction-artifact-refusal" | "prelaunch-resource-refusal";
  readonly observation: {
    readonly conditionId: string;
    readonly kind: "artifact-filesystem-policy" | "available-bytes" | "retained-bytes" | "process-hours";
    readonly comparator: "not-equal" | "less-than" | "greater-than";
    readonly registeredValue: string | boolean | number | null;
    readonly observedValue: string | boolean | number | null;
    readonly unit: "bytes" | "hours" | "classification" | null;
    readonly routeConditionMatched: true;
    readonly preconditionPassed: false;
    readonly evidenceIds: readonly string[];
  };
  readonly failedArtifact: {
    readonly artifactRole: "science-protocol" | "reference-or-refusal";
    readonly expected: Phase10C0VS6ArtifactIdentity;
    readonly observed: Phase10C0VS6ArtifactIdentity;
    readonly filesystemObservation: {
      readonly path: string;
      readonly lstatObjectType: "regular-file";
      readonly lstatByteLength: number;
      readonly lstatLinkCount: number;
      readonly fileResolvedRelativePath: string;
      readonly lexicalParentRelativePath: string;
      readonly resolvedParentRelativePath: string;
      readonly resolvedInsideRepository: true;
      readonly parentAliased: boolean;
      readonly fstatBefore: {
        readonly deviceIdDecimal: string;
        readonly fileIdDecimal: string;
        readonly byteLength: number;
        readonly linkCount: number;
      };
      readonly fstatAfter: {
        readonly deviceIdDecimal: string;
        readonly fileIdDecimal: string;
        readonly byteLength: number;
        readonly linkCount: number;
      };
      readonly failureReasons: readonly ("link-count-not-one" | "parent-path-aliased")[];
      readonly readMethod: "descriptor-hash-fstat-before-after";
    };
    readonly failureClass: "filesystem-object-policy-failure";
  } | null;
  readonly evidence: readonly Phase10C0VS6PreflightClassificationEvidence[];
  readonly solverLaunched: false;
  readonly verdict: "refusal";
}

export interface Phase10C0VS6RetainedPreflightRefusal extends Omit<
  Phase10C0VS6RetainedPreflightPass,
  "refusalCandidate" | "verdict" | "reasons"
> {
  readonly refusalCandidate: Phase10C0VS6PreflightRefusalCandidate;
  readonly verdict: "refusal";
  readonly reasons: readonly [string];
}

export type Phase10C0VS6RetainedPreflight =
  | Phase10C0VS6RetainedPreflightPass
  | Phase10C0VS6RetainedPreflightRefusal;

export interface Phase10C0VS6PacketProtocol {
  readonly schema:
    | typeof PHASE10_C0V_S6_PACKET_PROTOCOL_SCHEMA
    | typeof PHASE10_C0V_S6_RECOVERY_PACKET_PROTOCOL_SCHEMA
    | typeof PHASE10_C0V_S6_RECOVERY_V2_PACKET_PROTOCOL_SCHEMA
    | typeof PHASE10_C0V_S6_RECOVERY_V3_PACKET_PROTOCOL_SCHEMA
    | typeof PHASE10_C0V_S6_RECOVERY_V4_PACKET_PROTOCOL_SCHEMA
    | typeof PHASE10_C0V_S6_RECOVERY_V5_PACKET_PROTOCOL_SCHEMA
    | typeof PHASE10_C0V_S6_RECOVERY_V6_PACKET_PROTOCOL_SCHEMA
    | typeof PHASE10_C0V_S6_RECOVERY_V7_PACKET_PROTOCOL_SCHEMA
    | typeof PHASE10_C0V_S6_RECOVERY_V8_PACKET_PROTOCOL_SCHEMA
    | typeof PHASE10_C0V_S6_RECOVERY_V9_PACKET_PROTOCOL_SCHEMA;
  readonly protocolId: string;
  readonly matrixId: typeof PHASE10_C0V_S6_MATRIX_ID;
  readonly packetId: Phase10C0VS6PacketId;
  readonly registryId: string;
  readonly registeredAttemptId: string;
  readonly executionMode: Phase10C0VS6ExecutionMode;
  readonly bindings: {
    readonly matrix: Phase10C0VS6ArtifactIdentity;
    readonly packetCatalogue: Phase10C0VS6ArtifactIdentity;
    readonly callableRegistry: Phase10C0VS6ArtifactIdentity;
    readonly predecessorSchemaRegistry: Phase10C0VS6ArtifactIdentity;
    readonly predecessorSchemaContracts: Phase10C0VS6ArtifactIdentity;
    readonly successorSchemaRegistry: Phase10C0VS6ArtifactIdentity;
    readonly successorSchemaContracts: Phase10C0VS6ArtifactIdentity;
    readonly scienceProtocol: Phase10C0VS6ArtifactIdentity | null;
    readonly referenceOrRefusal: Phase10C0VS6ArtifactIdentity | null;
    readonly originalApEvidence: readonly Phase10C0VS6ArtifactIdentity[];
    readonly recoveryAuthority?: Phase10C0VS6ArtifactIdentity;
  };
  readonly selectedRouteId: string | null;
  readonly s5ArtifactDisposition: "reference-frozen" | "reference-discrepancy-refusal" | "reference-refusal" | null;
  readonly registeredOutputIds: readonly string[];
  readonly registeredCheckIds: readonly string[];
  readonly registeredNegativeControlIds: readonly string[];
  readonly boundDependencyPacketIds: readonly string[];
  readonly dependencyArtifactContracts: readonly Phase10C0VS6DependencyArtifactContract[];
  readonly commandTemplates: readonly { readonly commandId: string; readonly command: string }[];
  readonly paths: {
    readonly attemptRoot: string;
    readonly packageLockPath: Phase10C0VS6PackageLockPath;
    readonly lockPath: string;
    readonly preflightReceiptPath: string;
    readonly terminalReceiptPath: string;
    readonly allowedPublicationPaths: readonly string[];
    readonly publicationStagingPaths: readonly Phase10C0VS6PublicationStagingPath[];
    readonly internalOnlyFilenames: readonly string[];
  };
  readonly candidateFilenameRosters: Readonly<Record<string, readonly string[]>>;
  readonly internalArtifactRosters: readonly Phase10C0VS6InternalArtifactRoster[];
  readonly verification: {
    readonly filename: string;
    readonly schemaId: string;
    readonly verificationIdRule: "phase10-packet-attempt-verification-v2";
    readonly executionProvenanceRule: "nonnull-completed-main-evaluator-for-normal-credit-route-null-exactly-radial-validated-refusal-no-verification-on-other-maker-return";
  };
  readonly allowedCleanTerminalClasses: readonly Phase10C0VS6CleanTerminalClass[];
  readonly terminalSubroutes: readonly Phase10C0VS6PacketTerminalSubrouteAuthority[];
  readonly resources: Phase10C0VS6PacketResources;
  readonly ancestryAuthority: Phase10C0VS6AncestryAuthority;
  readonly preObservationProductionClosure: Phase10C0VS6PreObservationProductionClosureAuthority | null;
  readonly preflightObservedContract: Phase10C0VS6PreflightObservedContract;
  readonly workerInvocationContract: Phase10C0VS6WorkerInvocationContract;
  readonly workerProgressContract: Phase10C0VS6WorkerProgressContract | null;
  readonly exitStatusContract: Phase10C0VS6ExitStatusContract;
  readonly freezeEvaluationContract: Phase10C0VS6FreezeEvaluationContract;
  readonly causeEvaluationContract: Phase10C0VS6CauseEvaluationContract;
  readonly terminalCandidateContract: Phase10C0VS6TerminalCandidateContract;
  readonly terminalReceiptContract: Phase10C0VS6TerminalReceiptContract;
  readonly executionRecordTuples: readonly Phase10C0VS6ExecutionRecordTuple[];
  readonly executableInvocationRosters: readonly Phase10C0VS6ExecutableInvocationRoster[];
  readonly verificationInvocationRoster: readonly Phase10C0VS6PacketVerificationInvocationAuthority[];
  readonly verificationRegisteredCapBindings: readonly Phase10C0VS6VerificationRegisteredCapBinding[];
  readonly resourceObservationPointRosters: readonly Phase10C0VS6ResourceObservationPointRoster[];
  readonly registeredCapBindings: readonly Phase10C0VS6RegisteredCapBinding[];
  readonly classificationConditions: readonly Phase10C0VS6ClassificationCondition[];
  readonly classificationProjectionRosters: readonly Phase10C0VS6ClassificationProjectionRoster[];
  readonly radialBinaryLayout: Phase10C0VS6RadialBinaryLayoutAuthority | null;
  readonly radialProducerSummary: Phase10C0VS6RadialProducerSummaryAuthority | null;
  readonly controlOperators: readonly Phase10C0VS6ControlOperatorAuthority[];
  readonly aggregateNegativeControlContract: Phase10C0VS6AggregateNegativeControlContract | null;
  readonly claimBoundary: { readonly allowed: readonly string[]; readonly forbidden: readonly string[] };
}

export type Phase10C0VS6RadialPacketAuthority = Phase10C0VS6PacketProtocol & {
  readonly packetId: "c0v-radial-produce";
  readonly executionMode: "radial-production";
  readonly radialBinaryLayout: Phase10C0VS6RadialBinaryLayoutAuthority;
  readonly radialProducerSummary: Phase10C0VS6RadialProducerSummaryAuthority;
};

export interface Phase10C0VS6CataloguePacket {
  readonly packetId: Phase10C0VS6PacketId;
  readonly protocolPath: string;
  readonly callableRegistryPath: string;
  readonly attemptRoot: string;
  readonly lockPath: string;
  readonly preflightReceiptPath: string;
  readonly terminalReceiptPath: string;
  readonly verificationPath: string;
  readonly verificationFilename: string;
  readonly verificationSchemaId: string;
  readonly maximumStdoutBytes: number;
  readonly maximumOtherAttemptRootBytes: number;
  readonly stdoutMessageByteBudget: {
    readonly lifecycleLineBytesMaximum: number;
    readonly boundaryOrProgressLineBytesMaximum: number;
    readonly artifactLineBytesMaximum: number;
    readonly resultLineBytesMaximum: number;
    readonly lifecycleLineCountMaximum: number;
    readonly boundaryOrProgressLineCountMaximum: number;
    readonly artifactLineCountMaximum: number;
    readonly resultLineCountMaximum: number;
    readonly derivedMaximumBytes: number;
  };
}

export interface Phase10C0VS6RuntimeEntrypointAuthority {
  readonly role: "parent-executor" | "worker-dispatcher";
  readonly modulePath:
    | "runner/src/phase10-c0v-s6-executor.ts"
    | "runner/src/phase10-c0v-s6-executor-worker.ts";
  readonly exportName: "phase10C0VS6RunExecutor" | "phase10C0VS6ExecutorWorker";
}

export interface Phase10C0VS6RuntimeLoaderContract {
  readonly schema: "phase10-c0v-s6-runtime-loader-contract-v1";
  readonly execArgvRule: "parent-and-worker-process-exec-argv-exact-empty-array";
  readonly forbiddenEnvironmentKeyRule: "ascii-uppercase-equals-NODE-or-TS_NODE-or-starts-NODE_-or-TS_NODE_";
  readonly exactWorkerEnvironment: readonly Readonly<{ readonly key: string; readonly value: string }>[];
  readonly workerEnvironmentRule: "parent-materializes-exact-clean-environment-worker-independently-exact-compares-complete-environment-no-ambient-clone";
  readonly preflightRecordingRule: "frozen-code-rejection-no-ambient-environment-values-serialized";
  readonly entryObservationScopeRule: "visible-at-entry-loader-state-enforced-deliberate-trace-erasure-outside-registered-threat-model";
}

export interface Phase10C0VS6WorkerTransportContract {
  readonly schema: "phase10-c0v-s6-worker-transport-contract-v1";
  readonly transport: "blocking-fd0-command-fd1-message-canonical-compact-jsonl";
  readonly maximumLineBytes: 33554432;
  readonly maximumStderrBytes: 33554432;
  readonly parentToChild: {
    readonly schema: "phase10-c0v-s6-worker-command-v1";
    readonly exactFields: readonly [
      "schema", "sequence", "packetId", "attemptId", "kind", "invocationId",
      "acknowledgedWorkerSequence",
    ];
    readonly kindValues: readonly ["invoke", "acknowledge", "stop"];
    readonly nullabilityRule: "invoke-id-nonnull-ack-null_acknowledge-both-nonnull_stop-both-null";
  };
  readonly childToParent: {
    readonly schema: "phase10-c0v-s6-worker-message-v1";
    readonly exactFields: readonly [
      "schema", "sequence", "packetId", "attemptId", "kind", "invocationId", "payload",
    ];
    readonly kindValues: readonly [
      "ready", "boundary", "progress", "artifact", "result", "stopped", "error",
    ];
    readonly nullabilityRule: "ready-stopped-both-null_boundary-progress-artifact-result-both-nonnull_error-payload-nonnull-id-nullable";
  };
  readonly sequenceRule: "independent-zero-based-contiguous-safe-integer-per-direction";
  readonly bytePayloadMarkerKey: "$phase10C0VS6Bytes";
  readonly bytePayloadRule: "uint8array-only-one-key-canonical-base64-object-recursive-finite-json";
  readonly acknowledgementRule: "boundary-and-artifact-callback-return-only-after-exact-scoped-parent-acknowledgement";
  readonly retainedAuthorityRule: "parent-synthesizes-all-retained-time-timing-terminal-fields-child-stdout-never-authoritative";
  readonly stderrRule: "diagnostics-only-never-evidence-or-route-authority";
}

export interface Phase10C0VS6PacketCatalogue {
  readonly schema:
    | typeof PHASE10_C0V_S6_PACKET_CATALOGUE_SCHEMA
    | typeof PHASE10_C0V_S6_RECOVERY_PACKET_CATALOGUE_SCHEMA
    | typeof PHASE10_C0V_S6_RECOVERY_V2_PACKET_CATALOGUE_SCHEMA
    | typeof PHASE10_C0V_S6_RECOVERY_V3_PACKET_CATALOGUE_SCHEMA
    | typeof PHASE10_C0V_S6_RECOVERY_V4_PACKET_CATALOGUE_SCHEMA
    | typeof PHASE10_C0V_S6_RECOVERY_V5_PACKET_CATALOGUE_SCHEMA
    | typeof PHASE10_C0V_S6_RECOVERY_V6_PACKET_CATALOGUE_SCHEMA
    | typeof PHASE10_C0V_S6_RECOVERY_V7_PACKET_CATALOGUE_SCHEMA
    | typeof PHASE10_C0V_S6_RECOVERY_V8_PACKET_CATALOGUE_SCHEMA
    | typeof PHASE10_C0V_S6_RECOVERY_V9_PACKET_CATALOGUE_SCHEMA;
  readonly catalogueId: string;
  readonly matrixId: typeof PHASE10_C0V_S6_MATRIX_ID;
  readonly packageLockPath: Phase10C0VS6PackageLockPath;
  readonly packageLockRule:
    | "acquire-before-packet-lock-and-any-observation-stale-halts-all-s6"
    | typeof PHASE10_C0V_S6_RECOVERY_PACKAGE_LOCK_RULE
    | typeof PHASE10_C0V_S6_RECOVERY_V2_PACKAGE_LOCK_RULE
    | typeof PHASE10_C0V_S6_RECOVERY_V3_PACKAGE_LOCK_RULE
    | typeof PHASE10_C0V_S6_RECOVERY_V4_PACKAGE_LOCK_RULE
    | typeof PHASE10_C0V_S6_RECOVERY_V5_PACKAGE_LOCK_RULE
    | typeof PHASE10_C0V_S6_RECOVERY_V6_PACKAGE_LOCK_RULE
    | typeof PHASE10_C0V_S6_RECOVERY_V7_PACKAGE_LOCK_RULE
    | typeof PHASE10_C0V_S6_RECOVERY_V8_PACKAGE_LOCK_RULE
    | typeof PHASE10_C0V_S6_RECOVERY_V9_PACKAGE_LOCK_RULE;
  readonly recoveryAuthority?: Phase10C0VS6ArtifactIdentity;
  readonly runtimeEntrypoints: readonly [
    Phase10C0VS6RuntimeEntrypointAuthority,
    Phase10C0VS6RuntimeEntrypointAuthority,
  ];
  readonly runtimeLoaderContract: Phase10C0VS6RuntimeLoaderContract;
  readonly workerTransportContract: Phase10C0VS6WorkerTransportContract;
  readonly packets: readonly Phase10C0VS6CataloguePacket[];
}

export interface Phase10C0VS6CallableBinding {
  readonly callableId: string;
  readonly role: "producer" | "check-caller" | "independent-evaluator" | "negative-control";
  readonly resolution: "planned" | "resolved";
  readonly modulePath: string;
  readonly exportName: string;
  readonly identity: { readonly byteLength: number; readonly sha256: string } | null;
  readonly producedOutputIds: readonly string[];
  readonly invokedCheckIds: readonly string[];
  readonly evaluatedCheckIds: readonly string[];
  readonly executedNegativeControlIds: readonly string[];
}

export interface Phase10C0VS6CallableRegistry {
  readonly schema: typeof PHASE10_C0V_S6_CALLABLE_REGISTRY_SCHEMA;
  readonly registryId: string;
  readonly matrixId: typeof PHASE10_C0V_S6_MATRIX_ID;
  readonly protocolId: string;
  readonly packetId: Phase10C0VS6PacketId;
  readonly callables: readonly Phase10C0VS6CallableBinding[];
}

export interface Phase10C0VS6SuccessorSchemaOutputBinding {
  readonly bindingKind: "added" | "supersedes";
  readonly packetId: Phase10C0VS6PacketId;
  readonly outputId: string;
  readonly path: string;
  readonly previousSchemaId: string | null;
}

export interface Phase10C0VS6SuccessorSchemaDefinition {
  readonly schemaId: (typeof PHASE10_C0V_S6_SUCCESSOR_SCHEMA_IDS)[number];
  readonly state: "defined";
  readonly format: "json" | "jsonl-row";
  readonly contract: Phase10C0VS6ArtifactIdentity & { readonly pointer: string };
  readonly outputBindings: readonly Phase10C0VS6SuccessorSchemaOutputBinding[];
  readonly requiredBeforePacketIds: readonly Phase10C0VS6PacketId[];
}

export interface Phase10C0VS6ArtifactSchemaRegistry {
  readonly schema: typeof PHASE10_C0V_S6_ARTIFACT_SCHEMA_REGISTRY_SCHEMA;
  readonly registryId: "phase10-c0v-s6-successor-artifact-schemas-v1";
  readonly createdOn: "2026-08-22";
  readonly bindings: {
    readonly predecessorRegistry: Phase10C0VS6ArtifactIdentity;
    readonly predecessorContracts: Phase10C0VS6ArtifactIdentity;
    readonly successorContracts: Phase10C0VS6ArtifactIdentity;
  };
  readonly overridePolicy: {
    readonly mode: "scoped-output-schema-replacement-and-addition";
    readonly allowedPacketIds: readonly Phase10C0VS6PacketId[];
    readonly addedOutputIds: readonly string[];
    readonly overriddenOutputIds: readonly string[];
    readonly pathMutationAllowed: false;
    readonly predecessorMutationAllowed: false;
    readonly otherDuplicateSchemaIdsAllowed: false;
  };
  readonly publicationSchemaRule: "every-s6-published-output-schema-and-binding-registered-exactly-once";
  readonly schemas: readonly Phase10C0VS6SuccessorSchemaDefinition[];
}

type JsonObject = { readonly [key: string]: StrictJson };
const SHA256 = /^[0-9a-f]{64}$/u;
const COMMIT = /^[0-9a-f]{40}$/u;
// Root metadata such as `.gitattributes` and `.gitignore` is part of the frozen code roster.
// Dot segments remain forbidden below, but a dot-prefixed filename is a valid relative path.
const SAFE_PATH = /^[A-Za-z0-9.][A-Za-z0-9._/-]*$/u;
const ATTEMPT_ID = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/u;
const WINDOWS_DEVICE_BASENAME = /^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])$/iu;

function windowsDeviceSegment(segment: string): boolean {
  return WINDOWS_DEVICE_BASENAME.test(segment.split(".", 1)[0]!);
}

function fail(label: string, detail: string): never {
  throw new Error(`Phase 10 C0V S6 ${label} ${detail}`);
}

function object(value: unknown, label: string): JsonObject {
  const frozen = strictJsonSnapshot(value);
  if (frozen === null || typeof frozen !== "object" || Array.isArray(frozen)) {
    fail(label, "must be an object");
  }
  return frozen as JsonObject;
}

function exactKeys(row: JsonObject, keys: readonly string[], label: string): void {
  const actual = Object.keys(row).sort();
  const expected = [...keys].sort();
  if (actual.length !== expected.length || actual.some((entry, index) => entry !== expected[index])) {
    fail(label, `keys must equal ${expected.join(",")}`);
  }
}

function exactOrderedKeys(row: JsonObject, keys: readonly string[], label: string): void {
  const actual = Object.keys(row);
  if (actual.length !== keys.length || actual.some((entry, index) => entry !== keys[index])) {
    fail(label, `ordered keys must equal ${keys.join(",")}`);
  }
}

function stringValue(value: StrictJson, label: string): string {
  if (typeof value !== "string" || value.length === 0) fail(label, "must be a nonempty string");
  return value;
}

function literal<const T extends string>(value: StrictJson, expected: T, label: string): T {
  if (value !== expected) fail(label, `must equal ${expected}`);
  return expected;
}

function enumValue<const T extends readonly string[]>(value: StrictJson, allowed: T, label: string): T[number] {
  const parsed = stringValue(value, label);
  if (!allowed.includes(parsed)) fail(label, `must be one of ${allowed.join(",")}`);
  return parsed as T[number];
}

function booleanValue(value: StrictJson, label: string): boolean {
  if (typeof value !== "boolean") fail(label, "must be boolean");
  return value;
}

function safeInteger(value: StrictJson, label: string, minimum = 0): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < minimum || Object.is(value, -0)) {
    fail(label, `must be a safe integer >= ${minimum}`);
  }
  return value;
}

function finiteNumber(value: StrictJson, label: string, minimum = 0): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < minimum || Object.is(value, -0)) {
    fail(label, `must be finite and >= ${minimum}`);
  }
  return value;
}

function arrayValue(value: StrictJson, label: string): readonly StrictJson[] {
  if (!Array.isArray(value)) fail(label, "must be an array");
  return value;
}

function stringArray(value: StrictJson, label: string, sorted = true): readonly string[] {
  const values = arrayValue(value, label).map((entry, index) => stringValue(entry, `${label}[${index}]`));
  if (new Set(values).size !== values.length) fail(label, "must contain unique values");
  if (sorted && values.some((entry, index) => index > 0 && values[index - 1]! > entry)) {
    fail(label, "must be code-point sorted");
  }
  return Object.freeze(values);
}

function exactStringArray(value: StrictJson, expected: readonly string[], label: string): readonly string[] {
  const values = stringArray(value, label, false);
  if (values.length !== expected.length || values.some((entry, index) => entry !== expected[index])) {
    fail(label, "differs from exact protocol order");
  }
  return values;
}

function exactIntegerArray(value: StrictJson, expected: readonly number[], label: string): readonly number[] {
  const values = arrayValue(value, label).map((entry, index) => safeInteger(entry, `${label}[${index}]`));
  if (values.length !== expected.length || values.some((entry, index) => entry !== expected[index])) {
    fail(label, "differs from exact protocol order");
  }
  return Object.freeze(values);
}

function safePath(value: StrictJson, label: string): string {
  const parsed = stringValue(value, label);
  const segments = parsed.split("/");
  if (!SAFE_PATH.test(parsed) || parsed.includes("//") || parsed.includes("\\") || parsed.includes(":") ||
    segments.some((segment) => segment === "." || segment === ".." || segment.endsWith(".") ||
      segment.endsWith(" ") || windowsDeviceSegment(segment))) {
    fail(label, "must be a safe normalized cross-platform repository-relative path");
  }
  return parsed;
}

function safeFilename(value: StrictJson, label: string): string {
  const parsed = stringValue(value, label);
  if (!/^[a-z0-9][a-z0-9.-]*$/u.test(parsed) || parsed.includes("..") || parsed.endsWith(".") ||
    windowsDeviceSegment(parsed)) {
    fail(label, "must be a lowercase safe non-device filename without a path separator");
  }
  return parsed;
}

export function parsePhase10C0VS6AttemptId(value: unknown, label = "attemptId"): string {
  if (typeof value !== "string" || !ATTEMPT_ID.test(value) || WINDOWS_DEVICE_BASENAME.test(value)) {
    fail(label, "must be a lowercase alphanumeric/hyphen canonical non-device path segment");
  }
  return value;
}

export function parsePhase10C0VS6ArtifactIdentity(
  value: unknown,
  label = "artifact identity",
): Phase10C0VS6ArtifactIdentity {
  const row = object(value, label);
  exactKeys(row, ["path", "byteLength", "sha256"], label);
  const sha256 = stringValue(row.sha256, `${label}.sha256`);
  if (!SHA256.test(sha256)) fail(`${label}.sha256`, "must be lowercase 64-hex");
  return Object.freeze({
    path: safePath(row.path, `${label}.path`),
    byteLength: safeInteger(row.byteLength, `${label}.byteLength`),
    sha256,
  });
}

function parsePacketId(value: StrictJson, label: string): Phase10C0VS6PacketId {
  return enumValue(value, PHASE10_C0V_S6_PACKET_IDS, label);
}

function parseOutput(value: StrictJson, label: string): Phase10C0VS6OutputDefinition {
  const row = object(value, label);
  exactKeys(row, ["outputId", "packetId", "producerCallableId", "artifact", "terminalStates", "dependsOnOutputIds"], label);
  const artifact = object(row.artifact, `${label}.artifact`);
  exactKeys(artifact, ["path", "field", "schemaId"], `${label}.artifact`);
  const field = artifact.field === null ? null : stringValue(artifact.field, `${label}.artifact.field`);
  const states = arrayValue(row.terminalStates, `${label}.terminalStates`).map((entry, index) =>
    enumValue(entry, ["complete", "pass", "fail", "refusal"] as const, `${label}.terminalStates[${index}]`));
  return Object.freeze({
    outputId: stringValue(row.outputId, `${label}.outputId`),
    packetId: parsePacketId(row.packetId, `${label}.packetId`),
    producerCallableId: stringValue(row.producerCallableId, `${label}.producerCallableId`),
    artifact: Object.freeze({
      path: safePath(artifact.path, `${label}.artifact.path`),
      field,
      schemaId: stringValue(artifact.schemaId, `${label}.artifact.schemaId`),
    }),
    terminalStates: Object.freeze(states),
    dependsOnOutputIds: stringArray(row.dependsOnOutputIds, `${label}.dependsOnOutputIds`),
  });
}

function parseCheck(value: StrictJson, label: string): Phase10C0VS6CheckDefinition {
  const row = object(value, label);
  exactKeys(row, ["checkId", "packetId", "callerCallableId", "independentEvaluatorCallableId", "negativeControlIds", "dependsOnOutputIds", "dependsOnCheckIds"], label);
  return Object.freeze({
    checkId: stringValue(row.checkId, `${label}.checkId`),
    packetId: parsePacketId(row.packetId, `${label}.packetId`),
    callerCallableId: stringValue(row.callerCallableId, `${label}.callerCallableId`),
    independentEvaluatorCallableId: stringValue(row.independentEvaluatorCallableId, `${label}.independentEvaluatorCallableId`),
    negativeControlIds: stringArray(row.negativeControlIds, `${label}.negativeControlIds`),
    dependsOnOutputIds: stringArray(row.dependsOnOutputIds, `${label}.dependsOnOutputIds`),
    dependsOnCheckIds: stringArray(row.dependsOnCheckIds, `${label}.dependsOnCheckIds`),
  });
}

function parseNegativeControl(value: StrictJson, label: string): Phase10C0VS6NegativeControlDefinition {
  const row = object(value, label);
  exactKeys(row, ["negativeControlId", "packetId", "ownerCheckId", "callableId", "mutation"], label);
  return Object.freeze({
    negativeControlId: stringValue(row.negativeControlId, `${label}.negativeControlId`),
    packetId: parsePacketId(row.packetId, `${label}.packetId`),
    ownerCheckId: stringValue(row.ownerCheckId, `${label}.ownerCheckId`),
    callableId: stringValue(row.callableId, `${label}.callableId`),
    mutation: stringValue(row.mutation, `${label}.mutation`),
  });
}

function parsePacket(value: StrictJson, label: string): Phase10C0VS6PacketDefinition {
  const row = object(value, label);
  exactKeys(row, ["packetId", "launchClass", "executionMode", "outputIds", "checkIds", "negativeControlIds", "dependencyPacketIds"], label);
  return Object.freeze({
    packetId: parsePacketId(row.packetId, `${label}.packetId`),
    launchClass: enumValue(row.launchClass, ["static-contract", "solver-control", "non-solver"] as const, `${label}.launchClass`),
    executionMode: enumValue(row.executionMode, ["supplemental-ap", "radial-production", "discrepancy-match-only", "preimplementation-refusal", "layer-publish", "aggregate"] as const, `${label}.executionMode`),
    outputIds: stringArray(row.outputIds, `${label}.outputIds`),
    checkIds: stringArray(row.checkIds, `${label}.checkIds`),
    negativeControlIds: stringArray(row.negativeControlIds, `${label}.negativeControlIds`),
    dependencyPacketIds: stringArray(row.dependencyPacketIds, `${label}.dependencyPacketIds`),
  });
}

function routeRoster(row: JsonObject, field: string, label: string): readonly string[] {
  const roster = stringArray(row[field] as StrictJson, `${label}.${field}`);
  if (new Set(roster).size !== roster.length) fail(`${label}.${field}`, "contains duplicate IDs");
  return roster;
}

function assertDisjointRouteRosters(
  required: readonly string[],
  forbidden: readonly string[],
  label: string,
): void {
  const overlap = required.find((entry) => forbidden.includes(entry));
  if (overlap !== undefined) fail(label, `requires and forbids ${overlap}`);
}

function parseSubroute(value: StrictJson, label: string): Phase10C0VS6RouteSubroute {
  const row = object(value, label);
  exactKeys(row, ["subrouteId", "dispositionCode", "requiredOutputIds", "forbiddenOutputIds", "requiredCheckIds", "forbiddenCheckIds", "requiredNegativeControlIds", "forbiddenNegativeControlIds"], label);
  const parsed = Object.freeze({
    subrouteId: stringValue(row.subrouteId, `${label}.subrouteId`),
    dispositionCode: enumValue(row.dispositionCode, ["production-complete", "preproduction-artifact-refusal", "prelaunch-resource-refusal", "registered-cap-resource-refusal", "reference-discrepancy-refusal", "preimplementation-reference-refusal"] as const, `${label}.dispositionCode`),
    requiredOutputIds: routeRoster(row, "requiredOutputIds", label),
    forbiddenOutputIds: routeRoster(row, "forbiddenOutputIds", label),
    requiredCheckIds: routeRoster(row, "requiredCheckIds", label),
    forbiddenCheckIds: routeRoster(row, "forbiddenCheckIds", label),
    requiredNegativeControlIds: routeRoster(row, "requiredNegativeControlIds", label),
    forbiddenNegativeControlIds: routeRoster(row, "forbiddenNegativeControlIds", label),
  });
  assertDisjointRouteRosters(parsed.requiredOutputIds, parsed.forbiddenOutputIds, label);
  assertDisjointRouteRosters(parsed.requiredCheckIds, parsed.forbiddenCheckIds, label);
  assertDisjointRouteRosters(parsed.requiredNegativeControlIds, parsed.forbiddenNegativeControlIds, label);
  return parsed;
}

function parsePacketTerminalSubroute(
  value: StrictJson,
  label: string,
): Phase10C0VS6PacketTerminalSubrouteAuthority {
  const row = object(value, label);
  exactKeys(row, ["subrouteId", "dispositionCode", "classificationConditionIds", "requiredOutputIds", "forbiddenOutputIds", "requiredCheckIds", "forbiddenCheckIds", "requiredNegativeControlIds", "forbiddenNegativeControlIds"], label);
  const parsed = Object.freeze({
    subrouteId: stringValue(row.subrouteId, `${label}.subrouteId`),
    dispositionCode: row.dispositionCode === null ? null : enumValue(
      row.dispositionCode,
      ["production-complete", "preproduction-artifact-refusal", "prelaunch-resource-refusal", "registered-cap-resource-refusal", "reference-discrepancy-refusal", "preimplementation-reference-refusal"] as const,
      `${label}.dispositionCode`,
    ),
    classificationConditionIds: stringArray(
      row.classificationConditionIds,
      `${label}.classificationConditionIds`,
      false,
    ),
    requiredOutputIds: routeRoster(row, "requiredOutputIds", label),
    forbiddenOutputIds: routeRoster(row, "forbiddenOutputIds", label),
    requiredCheckIds: routeRoster(row, "requiredCheckIds", label),
    forbiddenCheckIds: routeRoster(row, "forbiddenCheckIds", label),
    requiredNegativeControlIds: routeRoster(row, "requiredNegativeControlIds", label),
    forbiddenNegativeControlIds: routeRoster(row, "forbiddenNegativeControlIds", label),
  });
  assertDisjointRouteRosters(parsed.requiredOutputIds, parsed.forbiddenOutputIds, label);
  assertDisjointRouteRosters(parsed.requiredCheckIds, parsed.forbiddenCheckIds, label);
  assertDisjointRouteRosters(parsed.requiredNegativeControlIds, parsed.forbiddenNegativeControlIds, label);
  return parsed;
}

function parseRoute(value: StrictJson, label: string): Phase10C0VS6RouteDefinition {
  const row = object(value, label);
  const conditionalTerminalRoute = Object.prototype.hasOwnProperty.call(row, "terminalSubroutes");
  const inactive = row.active === false;
  const common = ["routeId", "layerId", "executionMode", "selectedByDisposition", "active", "allowedAttemptDispositionCodes"];
  const keys = conditionalTerminalRoute
    ? [...common, "terminalSubroutes", "retryableRule"]
    : [...common, "requiredOutputIds", "forbiddenOutputIds", "requiredCheckIds", "forbiddenCheckIds", "requiredNegativeControlIds", "forbiddenNegativeControlIds", ...(inactive ? ["inactiveReason"] : [])];
  exactKeys(row, keys, label);
  const allowed = arrayValue(row.allowedAttemptDispositionCodes, `${label}.allowedAttemptDispositionCodes`).map((entry, index) =>
    enumValue(entry, ["production-complete", "preproduction-artifact-refusal", "prelaunch-resource-refusal", "registered-cap-resource-refusal", "reference-discrepancy-refusal", "preimplementation-reference-refusal"] as const, `${label}.allowedAttemptDispositionCodes[${index}]`));
  const subroutes = conditionalTerminalRoute
    ? arrayValue(row.terminalSubroutes, `${label}.terminalSubroutes`).map((entry, index) => parseSubroute(entry, `${label}.terminalSubroutes[${index}]`))
    : null;
  const parsed = Object.freeze({
    routeId: stringValue(row.routeId, `${label}.routeId`),
    layerId: enumValue(row.layerId, ["C0V-RADIAL", "C0V-MOVING-EVENT", "C0V-STATIC"] as const, `${label}.layerId`),
    executionMode: enumValue(row.executionMode, ["radial-production", "discrepancy-match-only", "preimplementation-refusal"] as const, `${label}.executionMode`),
    selectedByDisposition: enumValue(row.selectedByDisposition, ["reference-frozen", "reference-discrepancy-refusal", "reference-refusal"] as const, `${label}.selectedByDisposition`),
    active: booleanValue(row.active, `${label}.active`),
    allowedAttemptDispositionCodes: Object.freeze(allowed),
    terminalSubroutes: subroutes === null ? null : Object.freeze(subroutes),
    requiredOutputIds: conditionalTerminalRoute ? null : routeRoster(row, "requiredOutputIds", label),
    forbiddenOutputIds: conditionalTerminalRoute ? null : routeRoster(row, "forbiddenOutputIds", label),
    requiredCheckIds: conditionalTerminalRoute ? null : routeRoster(row, "requiredCheckIds", label),
    forbiddenCheckIds: conditionalTerminalRoute ? null : routeRoster(row, "forbiddenCheckIds", label),
    requiredNegativeControlIds: conditionalTerminalRoute ? null : routeRoster(row, "requiredNegativeControlIds", label),
    forbiddenNegativeControlIds: conditionalTerminalRoute ? null : routeRoster(row, "forbiddenNegativeControlIds", label),
    retryableRule: conditionalTerminalRoute ? stringValue(row.retryableRule, `${label}.retryableRule`) : null,
    inactiveReason: inactive ? stringValue(row.inactiveReason, `${label}.inactiveReason`) : null,
  });
  if (parsed.terminalSubroutes === null) {
    assertDisjointRouteRosters(parsed.requiredOutputIds!, parsed.forbiddenOutputIds!, label);
    assertDisjointRouteRosters(parsed.requiredCheckIds!, parsed.forbiddenCheckIds!, label);
    assertDisjointRouteRosters(parsed.requiredNegativeControlIds!, parsed.forbiddenNegativeControlIds!, label);
  }
  return parsed;
}

function parseLayer(value: StrictJson, label: string): Phase10C0VS6LayerAuthority {
  const row = object(value, label);
  exactKeys(row, ["layerId", "scienceBranch", "scienceProtocol", "referenceOrRefusal", "s5ArtifactDisposition", "selectedRouteId"], label);
  return Object.freeze({
    layerId: enumValue(row.layerId, ["C0V-RADIAL", "C0V-MOVING-EVENT", "C0V-STATIC"] as const, `${label}.layerId`),
    scienceBranch: enumValue(row.scienceBranch, ["independent-reference", "reference-refusal"] as const, `${label}.scienceBranch`),
    scienceProtocol: parsePhase10C0VS6ArtifactIdentity(row.scienceProtocol, `${label}.scienceProtocol`),
    referenceOrRefusal: parsePhase10C0VS6ArtifactIdentity(row.referenceOrRefusal, `${label}.referenceOrRefusal`),
    s5ArtifactDisposition: enumValue(row.s5ArtifactDisposition, ["reference-frozen", "reference-discrepancy-refusal", "reference-refusal"] as const, `${label}.s5ArtifactDisposition`),
    selectedRouteId: stringValue(row.selectedRouteId, `${label}.selectedRouteId`),
  });
}

function uniqueBy<T>(rows: readonly T[], key: (row: T) => string, label: string): void {
  const ids = rows.map(key);
  if (new Set(ids).size !== ids.length) fail(label, "contains duplicate IDs");
}

export function parsePhase10C0VS6Matrix(value: unknown): Phase10C0VS6ObligationMatrix {
  const label = "obligation matrix";
  const row = object(value, label);
  exactKeys(row, ["schema", "matrixId", "frozenDate", "bindings", "overridePolicy", "s5Layers", "routes", "packets", "outputs", "checks", "negativeControls"], label);
  const packets = arrayValue(row.packets, `${label}.packets`).map((entry, index) => parsePacket(entry, `${label}.packets[${index}]`));
  const outputs = arrayValue(row.outputs, `${label}.outputs`).map((entry, index) => parseOutput(entry, `${label}.outputs[${index}]`));
  const checks = arrayValue(row.checks, `${label}.checks`).map((entry, index) => parseCheck(entry, `${label}.checks[${index}]`));
  const controls = arrayValue(row.negativeControls, `${label}.negativeControls`).map((entry, index) => parseNegativeControl(entry, `${label}.negativeControls[${index}]`));
  const routes = arrayValue(row.routes, `${label}.routes`).map((entry, index) => parseRoute(entry, `${label}.routes[${index}]`));
  const layers = arrayValue(row.s5Layers, `${label}.s5Layers`).map((entry, index) => parseLayer(entry, `${label}.s5Layers[${index}]`));
  uniqueBy(packets, (entry) => entry.packetId, `${label}.packets`);
  uniqueBy(outputs, (entry) => entry.outputId, `${label}.outputs`);
  uniqueBy(checks, (entry) => entry.checkId, `${label}.checks`);
  uniqueBy(controls, (entry) => entry.negativeControlId, `${label}.negativeControls`);
  uniqueBy(routes, (entry) => entry.routeId, `${label}.routes`);
  uniqueBy(layers, (entry) => entry.layerId, `${label}.s5Layers`);
  const packetIds = packets.map((entry) => entry.packetId);
  if (packetIds.length !== PHASE10_C0V_S6_PACKET_IDS.length || packetIds.some((entry, index) => entry !== PHASE10_C0V_S6_PACKET_IDS[index])) {
    fail(`${label}.packets`, "must equal the exact protocol-order S6 packet roster");
  }
  const outputById = new Map(outputs.map((entry) => [entry.outputId, entry]));
  const checkById = new Map(checks.map((entry) => [entry.checkId, entry]));
  const controlById = new Map(controls.map((entry) => [entry.negativeControlId, entry]));
  for (const packet of packets) {
    for (const id of packet.outputIds) if (outputById.get(id)?.packetId !== packet.packetId) fail(packet.packetId, `output ${id} is undefined or foreign`);
    for (const id of packet.checkIds) if (checkById.get(id)?.packetId !== packet.packetId) fail(packet.packetId, `check ${id} is undefined or foreign`);
    for (const id of packet.negativeControlIds) if (controlById.get(id)?.packetId !== packet.packetId) fail(packet.packetId, `negative control ${id} is undefined or foreign`);
  }
  for (const check of checks) {
    for (const id of check.negativeControlIds) if (controlById.get(id)?.ownerCheckId !== check.checkId) fail(check.checkId, `negative control ${id} is missing or has another owner`);
    for (const id of check.dependsOnOutputIds) if (!outputById.has(id)) fail(check.checkId, `output dependency ${id} is undefined`);
    for (const id of check.dependsOnCheckIds) if (!checkById.has(id)) fail(check.checkId, `check dependency ${id} is undefined`);
  }
  return Object.freeze({
    schema: literal(row.schema, PHASE10_C0V_S6_MATRIX_SCHEMA, `${label}.schema`),
    matrixId: literal(row.matrixId, PHASE10_C0V_S6_MATRIX_ID, `${label}.matrixId`),
    frozenDate: literal(row.frozenDate, "2026-08-22", `${label}.frozenDate`),
    bindings: strictJsonSnapshot(row.bindings),
    overridePolicy: strictJsonSnapshot(row.overridePolicy),
    s5Layers: Object.freeze(layers),
    routes: Object.freeze(routes),
    packets: Object.freeze(packets),
    outputs: Object.freeze(outputs),
    checks: Object.freeze(checks),
    negativeControls: Object.freeze(controls),
  });
}

function nullableIdentity(value: StrictJson, label: string): Phase10C0VS6ArtifactIdentity | null {
  return value === null ? null : parsePhase10C0VS6ArtifactIdentity(value, label);
}

type Phase10C0VS6AuthorityGeneration =
  | "base"
  | "recovery-v1"
  | "recovery-v2"
  | "recovery-v3"
  | "recovery-v4"
  | "recovery-v5"
  | "recovery-v6"
  | "recovery-v7"
  | "recovery-v8"
  | "recovery-v9";

function parseResources(
  value: StrictJson,
  label: string,
  generation: Phase10C0VS6AuthorityGeneration,
): Phase10C0VS6PacketResources {
  const row = object(value, label);
  exactKeys(row, ["requiredRuntime", "solverWorkerTimeoutSeconds", "perExecutableControlInvocationWallHoursMaximum", "outerInfrastructureOrchestrationAllowanceSeconds", "outerInfrastructureSafetyTimeoutSeconds", "outerInfrastructureTimingRule", "packageElapsedNanosecondsMaximum", "packageProcessHoursMaximum", "currentPacketRegisteredElapsedNanosecondsMaximum", "currentPacketRegisteredProcessHoursMaximum", "attemptRootWritePolicy", "transientCopyAccounting", "filesystemObjectPolicy", "publicationTransitionPolicy", "lockLifetimePolicy", "lockAcquisitionPolicy", "packageStorageAccountingRule", "packageStorageBaselineArtifacts", "packageStorageBaselineBytes", "processConcurrency", "solverProcessConcurrency", "retainedStorageBytesMaximum", "projectedScratchBytes", "projectedPublicationBytes", "publicationFinalizationProjections", "minimumFreeBytes", "automaticRetry", "automaticRefinementOrFanOut"], label);
  if (row.automaticRetry !== false || row.automaticRefinementOrFanOut !== false) fail(label, "automatic work must be false");
  const solverWorkerTimeoutSeconds = row.solverWorkerTimeoutSeconds === null
    ? null
    : safeInteger(row.solverWorkerTimeoutSeconds, `${label}.solverWorkerTimeoutSeconds`, 1);
  if (solverWorkerTimeoutSeconds !== null && solverWorkerTimeoutSeconds !== 300) {
    fail(`${label}.solverWorkerTimeoutSeconds`, "must equal the frozen S5 radial worker cap of 300 or null");
  }
  const perExecutableControlInvocationWallHoursMaximum = safeInteger(row.perExecutableControlInvocationWallHoursMaximum, `${label}.perExecutableControlInvocationWallHoursMaximum`, 1);
  const outerInfrastructureOrchestrationAllowanceSeconds = safeInteger(
    row.outerInfrastructureOrchestrationAllowanceSeconds,
    `${label}.outerInfrastructureOrchestrationAllowanceSeconds`,
    1,
  );
  const outerInfrastructureSafetyTimeoutSeconds = safeInteger(
    row.outerInfrastructureSafetyTimeoutSeconds,
    `${label}.outerInfrastructureSafetyTimeoutSeconds`,
    1,
  );
  const packageProcessHoursMaximum = safeInteger(row.packageProcessHoursMaximum, `${label}.packageProcessHoursMaximum`, 1);
  const packageElapsedNanosecondsMaximum = safeInteger(
    row.packageElapsedNanosecondsMaximum,
    `${label}.packageElapsedNanosecondsMaximum`,
    1,
  );
  const currentPacketRegisteredElapsedNanosecondsMaximum = safeInteger(
    row.currentPacketRegisteredElapsedNanosecondsMaximum,
    `${label}.currentPacketRegisteredElapsedNanosecondsMaximum`,
    1,
  );
  const currentPacketRegisteredProcessHoursMaximum = finiteNumber(
    row.currentPacketRegisteredProcessHoursMaximum,
    `${label}.currentPacketRegisteredProcessHoursMaximum`,
  );
  if (outerInfrastructureOrchestrationAllowanceSeconds !== 3600 ||
    outerInfrastructureSafetyTimeoutSeconds !== currentPacketRegisteredElapsedNanosecondsMaximum / 1_000_000_000 + 3600 ||
    currentPacketRegisteredProcessHoursMaximum !== currentPacketRegisteredElapsedNanosecondsMaximum / 3_600_000_000_000) {
    fail(`${label}.outerInfrastructureSafetyTimeoutSeconds`, "must equal governed leaf maxima sum plus the exact 3600-second infrastructure-only allowance");
  }
  const processConcurrency = safeInteger(row.processConcurrency, `${label}.processConcurrency`, 1);
  const solverProcessConcurrency = safeInteger(row.solverProcessConcurrency, `${label}.solverProcessConcurrency`);
  const retainedStorageBytesMaximum = safeInteger(row.retainedStorageBytesMaximum, `${label}.retainedStorageBytesMaximum`, 1);
  const packageStorageBaselineBytes = safeInteger(row.packageStorageBaselineBytes, `${label}.packageStorageBaselineBytes`, 1);
  const packageStorageBaselineArtifacts = parseIdentityRoster(
    row.packageStorageBaselineArtifacts,
    `${label}.packageStorageBaselineArtifacts`,
  );
  const publicationFinalizationProjections = arrayValue(
    row.publicationFinalizationProjections,
    `${label}.publicationFinalizationProjections`,
  ).map((entry, index) => {
    const projectionLabel = `${label}.publicationFinalizationProjections[${index}]`;
    const projection = object(entry, projectionLabel);
    exactKeys(projection, ["artifactRole", "path", "stagingPath", "maximumByteLength"], projectionLabel);
    const expectedRole = index === 0 ? "packet-verification" : index === 1 ? "terminal-receipt" : null;
    if (expectedRole === null) fail(projectionLabel, "is extra");
    const maximumByteLength = safeInteger(projection.maximumByteLength, `${projectionLabel}.maximumByteLength`, 1);
    const expectedMaximum = index === 0 ? 524288 : 131072;
    if (maximumByteLength !== expectedMaximum) fail(projectionLabel, "maximum differs from exact finalization projection");
    return Object.freeze({
      artifactRole: literal(projection.artifactRole, expectedRole, `${projectionLabel}.artifactRole`),
      path: safePath(projection.path, `${projectionLabel}.path`),
      stagingPath: safePath(projection.stagingPath, `${projectionLabel}.stagingPath`),
      maximumByteLength: maximumByteLength as 524288 | 131072,
    });
  });
  if (publicationFinalizationProjections.length !== 2 ||
    publicationFinalizationProjections[0]!.path === publicationFinalizationProjections[1]!.path ||
    publicationFinalizationProjections.some((entry) => entry.path === entry.stagingPath)) {
    fail(`${label}.publicationFinalizationProjections`, "must contain exact distinct verification then terminal paths");
  }
  const expectedPackageStorageBaseline = generation === "recovery-v9"
    ? PHASE10_C0V_S6_RECOVERY_V9_PACKAGE_STORAGE_BASELINE
    : generation === "recovery-v8"
    ? PHASE10_C0V_S6_RECOVERY_V8_PACKAGE_STORAGE_BASELINE
    : generation === "recovery-v7"
    ? PHASE10_C0V_S6_RECOVERY_V7_PACKAGE_STORAGE_BASELINE
    : generation === "recovery-v6"
    ? PHASE10_C0V_S6_RECOVERY_V6_PACKAGE_STORAGE_BASELINE
    : generation === "recovery-v5"
    ? PHASE10_C0V_S6_RECOVERY_V5_PACKAGE_STORAGE_BASELINE
    : generation === "recovery-v4"
      ? PHASE10_C0V_S6_RECOVERY_V4_PACKAGE_STORAGE_BASELINE
    : generation === "recovery-v3"
      ? PHASE10_C0V_S6_RECOVERY_V3_PACKAGE_STORAGE_BASELINE
    : generation === "recovery-v2"
      ? PHASE10_C0V_S6_RECOVERY_V2_PACKAGE_STORAGE_BASELINE
    : generation === "recovery-v1"
      ? PHASE10_C0V_S6_RECOVERY_PACKAGE_STORAGE_BASELINE
      : PHASE10_C0V_S6_PACKAGE_STORAGE_BASELINE;
  const expectedPackageStorageBaselineBytes = generation === "recovery-v9"
    ? PHASE10_C0V_S6_RECOVERY_V9_PACKAGE_STORAGE_BASELINE_BYTES
    : generation === "recovery-v8"
    ? PHASE10_C0V_S6_RECOVERY_V8_PACKAGE_STORAGE_BASELINE_BYTES
    : generation === "recovery-v7"
    ? PHASE10_C0V_S6_RECOVERY_V7_PACKAGE_STORAGE_BASELINE_BYTES
    : generation === "recovery-v6"
    ? PHASE10_C0V_S6_RECOVERY_V6_PACKAGE_STORAGE_BASELINE_BYTES
    : generation === "recovery-v5"
    ? PHASE10_C0V_S6_RECOVERY_V5_PACKAGE_STORAGE_BASELINE_BYTES
    : generation === "recovery-v4"
      ? PHASE10_C0V_S6_RECOVERY_V4_PACKAGE_STORAGE_BASELINE_BYTES
    : generation === "recovery-v3"
      ? PHASE10_C0V_S6_RECOVERY_V3_PACKAGE_STORAGE_BASELINE_BYTES
    : generation === "recovery-v2"
      ? PHASE10_C0V_S6_RECOVERY_V2_PACKAGE_STORAGE_BASELINE_BYTES
    : generation === "recovery-v1"
      ? PHASE10_C0V_S6_RECOVERY_PACKAGE_STORAGE_BASELINE_BYTES
      : PHASE10_C0V_S6_PACKAGE_STORAGE_BASELINE_BYTES;
  if (perExecutableControlInvocationWallHoursMaximum !== 4 || packageProcessHoursMaximum !== 24 ||
    packageElapsedNanosecondsMaximum !== 86_400_000_000_000 || processConcurrency !== 1 ||
    (solverProcessConcurrency !== 0 && solverProcessConcurrency !== 1) || retainedStorageBytesMaximum !== 68719476736 ||
    packageStorageBaselineBytes !== expectedPackageStorageBaselineBytes ||
    packageStorageBaselineArtifacts.length !== expectedPackageStorageBaseline.length ||
    packageStorageBaselineArtifacts.some((entry, index) =>
      !sameArtifactIdentity(entry, expectedPackageStorageBaseline[index]!))) {
    fail(label, "foundation resource literals differ");
  }
  return Object.freeze({
    requiredRuntime: literal(row.requiredRuntime, "Node v24.13.1", `${label}.requiredRuntime`),
    solverWorkerTimeoutSeconds: solverWorkerTimeoutSeconds as 300 | null,
    perExecutableControlInvocationWallHoursMaximum: perExecutableControlInvocationWallHoursMaximum as 4,
    outerInfrastructureOrchestrationAllowanceSeconds: 3600,
    outerInfrastructureSafetyTimeoutSeconds,
    outerInfrastructureTimingRule: literal(
      row.outerInfrastructureTimingRule,
      "parent-monotonic-nanoseconds-limit-plus-one-millisecond-fail-stop-stale-lock-invalidates-claims",
      `${label}.outerInfrastructureTimingRule`,
    ),
    packageElapsedNanosecondsMaximum: packageElapsedNanosecondsMaximum as 86400000000000,
    packageProcessHoursMaximum: packageProcessHoursMaximum as 24,
    currentPacketRegisteredElapsedNanosecondsMaximum,
    currentPacketRegisteredProcessHoursMaximum,
    attemptRootWritePolicy: literal(
      row.attemptRootWritePolicy,
      "exclusive-create-append-only-no-delete-no-overwrite",
      `${label}.attemptRootWritePolicy`,
    ),
    transientCopyAccounting: literal(
      row.transientCopyAccounting,
      "all-physical-staging-copies-counted",
      `${label}.transientCopyAccounting`,
    ),
    filesystemObjectPolicy: literal(
      row.filesystemObjectPolicy,
      "regular-file-single-link-unaliased-parent",
      `${label}.filesystemObjectPolicy`,
    ),
    publicationTransitionPolicy: literal(
      row.publicationTransitionPolicy,
      "registered-stage-to-final-hardlink-window-no-credit-final-single-link",
      `${label}.publicationTransitionPolicy`,
    ),
    lockLifetimePolicy: literal(
      row.lockLifetimePolicy,
      "held-through-awaited-worker-and-rejected-action-until-governed-recovery",
      `${label}.lockLifetimePolicy`,
    ),
    lockAcquisitionPolicy: literal(
      row.lockAcquisitionPolicy,
      "compiled-package-then-packet-before-authority-read-stale-global-halts-all",
      `${label}.lockAcquisitionPolicy`,
    ),
    packageStorageAccountingRule: literal(
      row.packageStorageAccountingRule,
      "physical-path-copies-no-content-deduplication",
      `${label}.packageStorageAccountingRule`,
    ),
    packageStorageBaselineArtifacts,
    packageStorageBaselineBytes: packageStorageBaselineBytes as
      1629577 | 1629973 | 1693893 | 2123065 | 2556578 | 2994387 | 2994827 | 2995707 | 3098692,
    processConcurrency: processConcurrency as 1,
    solverProcessConcurrency: solverProcessConcurrency as 0 | 1,
    retainedStorageBytesMaximum: retainedStorageBytesMaximum as 68719476736,
    projectedScratchBytes: safeInteger(row.projectedScratchBytes, `${label}.projectedScratchBytes`),
    projectedPublicationBytes: safeInteger(row.projectedPublicationBytes, `${label}.projectedPublicationBytes`),
    publicationFinalizationProjections: Object.freeze(publicationFinalizationProjections),
    minimumFreeBytes: safeInteger(row.minimumFreeBytes, `${label}.minimumFreeBytes`, 1),
    automaticRetry: false,
    automaticRefinementOrFanOut: false,
  });
}

function parseAncestryAuthority(
  value: StrictJson,
  label: string,
  generation: Phase10C0VS6AuthorityGeneration,
): Phase10C0VS6AncestryAuthority {
  const row = object(value, label);
  exactKeys(row, [
    "launchBranch", "governanceCommit", "s5ScienceFreezeCommit", "s5InfrastructureCorrectionCommit",
    "s5EvidenceFreezeCommit", "cleanWorktreeRequired", "headMustEqualLaunchCommit",
    "launchCleanObservationRule", "indexConcealmentRule", "postLaunchRevalidationRule", "postLaunchDirtyAllowlistRule",
    "implementationFreezeRule", "codeFreezeSource",
  ], label);
  if (row.cleanWorktreeRequired !== true || row.headMustEqualLaunchCommit !== true) {
    fail(label, "clean launch and exact head are mandatory");
  }
  return Object.freeze({
    launchBranch: literal(row.launchBranch, "phase10/evidence-verification", `${label}.launchBranch`),
    governanceCommit: literal(row.governanceCommit, "fdb829b7a31e9e2573d8217d317ad7f5ffbc54fc", `${label}.governanceCommit`),
    s5ScienceFreezeCommit: literal(row.s5ScienceFreezeCommit, "cf0bd8b6ad12c79e38cb30ca0e50bcadab9cc6d9", `${label}.s5ScienceFreezeCommit`),
    s5InfrastructureCorrectionCommit: literal(row.s5InfrastructureCorrectionCommit, "cd331b75be4527bab11f3139d968626914a87694", `${label}.s5InfrastructureCorrectionCommit`),
    s5EvidenceFreezeCommit: literal(row.s5EvidenceFreezeCommit, "a14d9049751d561629a6fdc6bf85fdc9cc99e870", `${label}.s5EvidenceFreezeCommit`),
    cleanWorktreeRequired: true,
    headMustEqualLaunchCommit: true,
    launchCleanObservationRule: literal(
      row.launchCleanObservationRule,
      "preflight-observes-empty-status-before-first-generated-write",
      `${label}.launchCleanObservationRule`,
    ),
    indexConcealmentRule: literal(
      row.indexConcealmentRule,
      "git-ls-files-t-v-roster-equals-launch-head-and-every-tag-is-uppercase-H",
      `${label}.indexConcealmentRule`,
    ),
    postLaunchRevalidationRule: literal(
      row.postLaunchRevalidationRule,
      "launch-head-authority-bytes-exact-with-stage-selected-generated-dirt-only",
      `${label}.postLaunchRevalidationRule`,
    ),
    postLaunchDirtyAllowlistRule: literal(
      row.postLaunchDirtyAllowlistRule,
      "freeze-preflight-only-packet-verification-selected-required-publications-minus-current-verification-and-terminal-final-reopen-selected-required-publications",
      `${label}.postLaunchDirtyAllowlistRule`,
    ),
    implementationFreezeRule: literal(
      row.implementationFreezeRule,
      generation === "recovery-v9"
        ? "first-introduction-commit-of-recovery-v9-authority-with-all-predecessor-freezes-ancestor-and-current-successor-closure"
        : generation === "recovery-v8"
        ? "first-introduction-commit-of-recovery-v8-authority-with-all-predecessor-freezes-ancestor-and-current-successor-closure"
        : generation === "recovery-v7"
        ? "first-introduction-commit-of-recovery-v7-authority-with-all-predecessor-freezes-ancestor-and-current-successor-closure"
        : generation === "recovery-v6"
        ? "first-introduction-commit-of-recovery-v6-authority-with-all-predecessor-freezes-ancestor-and-current-successor-closure"
        : generation === "recovery-v5"
        ? "first-introduction-commit-of-recovery-v5-authority-with-all-predecessor-freezes-ancestor-and-current-successor-closure"
        : generation === "recovery-v4"
          ? "first-introduction-commit-of-recovery-v4-authority-with-all-predecessor-freezes-ancestor-and-current-successor-closure"
        : generation === "recovery-v3"
          ? "first-introduction-commit-of-recovery-v3-authority-with-all-predecessor-freezes-ancestor-and-current-successor-closure"
          : generation === "recovery-v2"
            ? "first-introduction-commit-of-recovery-v2-authority-with-both-predecessor-freezes-ancestor-and-current-successor-closure"
            : generation === "recovery-v1"
              ? "first-introduction-commit-of-recovery-v1-authority-and-current-successor-closure"
              : "common-first-introduction-commit-of-execution-v2-authority-and-callable-closure",
      `${label}.implementationFreezeRule`,
    ),
    codeFreezeSource: literal(row.codeFreezeSource, "git-first-introduction-plus-current-byte-match", `${label}.codeFreezeSource`),
  });
}

function parsePreflightObservedContract(
  value: StrictJson,
  label: string,
  packetCataloguePath: Phase10C0VS6PreflightObservedContract["packetCataloguePath"],
): Phase10C0VS6PreflightObservedContract {
  const row = object(value, label);
  exactKeys(row, ["schema", "observedFieldOrder", "resourceFieldOrder", "ancestryFieldOrder", "selectedBranchesFieldOrder", "stage", "commandTemplateId", "launchClass", "cwd", "repositoryBundleRoot", "packetCataloguePath", "cleanWorktreeRequired", "nasOrNetworkAccess", "allowedRefusalDispositionCodes"], label);
  if (row.cleanWorktreeRequired !== true || row.nasOrNetworkAccess !== false) {
    fail(label, "must require a clean worktree and forbid NAS/network access");
  }
  return Object.freeze({
    schema: literal(row.schema, "phase10-c0v-s6-preflight-observed-contract-v1", `${label}.schema`),
    observedFieldOrder: exactStringArray(row.observedFieldOrder, PHASE10_C0V_S6_PREFLIGHT_OBSERVED_FIELDS, `${label}.observedFieldOrder`),
    resourceFieldOrder: exactStringArray(row.resourceFieldOrder, PHASE10_C0V_S6_PREFLIGHT_RESOURCE_FIELDS, `${label}.resourceFieldOrder`),
    ancestryFieldOrder: exactStringArray(row.ancestryFieldOrder, PHASE10_C0V_S6_PREFLIGHT_ANCESTRY_FIELDS, `${label}.ancestryFieldOrder`),
    selectedBranchesFieldOrder: exactStringArray(row.selectedBranchesFieldOrder, ["selectedRouteId", "s5ArtifactDisposition"], `${label}.selectedBranchesFieldOrder`) as readonly ["selectedRouteId", "s5ArtifactDisposition"],
    stage: literal(row.stage, "run", `${label}.stage`),
    commandTemplateId: literal(row.commandTemplateId, "run", `${label}.commandTemplateId`),
    launchClass: enumValue(row.launchClass, ["static-contract", "solver-control", "non-solver"] as const, `${label}.launchClass`),
    cwd: literal(row.cwd, ".", `${label}.cwd`),
    repositoryBundleRoot: literal(row.repositoryBundleRoot, ".", `${label}.repositoryBundleRoot`),
    packetCataloguePath: literal(row.packetCataloguePath, packetCataloguePath, `${label}.packetCataloguePath`),
    cleanWorktreeRequired: true,
    nasOrNetworkAccess: false,
    allowedRefusalDispositionCodes: Object.freeze(arrayValue(
      row.allowedRefusalDispositionCodes,
      `${label}.allowedRefusalDispositionCodes`,
    ).map((entry, index) => enumValue(
      entry,
      ["preproduction-artifact-refusal", "prelaunch-resource-refusal"] as const,
      `${label}.allowedRefusalDispositionCodes[${index}]`,
    ))),
  });
}

function parseWorkerProgressContract(
  value: StrictJson,
  label: string,
): Phase10C0VS6WorkerProgressContract {
  const row = object(value, label);
  exactKeys(row, ["schema", "filename", "rowSchema", "exactFields", "eventValues", "eventStateTransitions", "caseOrder", "completedFieldValueCounts", "writer", "sequenceRule", "timestampRule", "prefixRule", "countRule", "candidateRule", "embeddedRule"], label);
  const transitionAuthority = Object.freeze([
    Object.freeze({ transitionId: "worker-started", event: "worker-started", positionRule: "first-record-only", invocationRule: "invocation-id-null", caseRule: "case-and-active-null-empty-prefixes", terminalStateValues: Object.freeze(["running"]), progressRule: "zero-counts-zero-candidate" }),
    Object.freeze({ transitionId: "invocation-started", event: "invocation-started", positionRule: "next-unfinished-protocol-invocation", invocationRule: "exact-open-invocation-id", caseRule: "case-id-null-progress-unchanged", terminalStateValues: Object.freeze(["running"]), progressRule: "candidate-state-monotone" }),
    Object.freeze({ transitionId: "case-started", event: "case-started", positionRule: "inside-solver-production-only", invocationRule: "exact-open-solver-production-id", caseRule: "append-next-case-to-started-and-set-active", terminalStateValues: Object.freeze(["running"]), progressRule: "completed-counts-unchanged" }),
    Object.freeze({ transitionId: "case-completed", event: "case-completed", positionRule: "inside-solver-production-only", invocationRule: "exact-open-solver-production-id", caseRule: "append-active-case-to-completed-and-clear-active", terminalStateValues: Object.freeze(["running"]), progressRule: "counts-advance-by-completed-case-node-count" }),
    Object.freeze({ transitionId: "invocation-finished", event: "invocation-finished", positionRule: "closes-exact-open-invocation", invocationRule: "same-open-invocation-id", caseRule: "case-id-null-started-completed-active-and-cumulative-progress-preserved", terminalStateValues: Object.freeze(["complete", "registered-cap", "infrastructure-failure"]), progressRule: "candidate-state-monotone" }),
    Object.freeze({ transitionId: "worker-stopped", event: "worker-stopped", positionRule: "final-record-only", invocationRule: "invocation-id-null-no-open-invocation", caseRule: "case-id-null-started-completed-active-and-cumulative-progress-preserved", terminalStateValues: Object.freeze(["complete", "registered-cap", "infrastructure-failure"]), progressRule: "terminal-state-matches-final-invocation-and-candidate-state" }),
  ]);
  const transitions = arrayValue(row.eventStateTransitions, `${label}.eventStateTransitions`).map((entry, index) => {
    const transitionLabel = `${label}.eventStateTransitions[${index}]`;
    const transition = object(entry, transitionLabel);
    exactKeys(transition, ["transitionId", "event", "positionRule", "invocationRule", "caseRule", "terminalStateValues", "progressRule"], transitionLabel);
    const expected = transitionAuthority[index];
    if (expected === undefined) fail(transitionLabel, "is extra");
    return Object.freeze({
      transitionId: literal(transition.transitionId, expected.transitionId, `${transitionLabel}.transitionId`),
      event: literal(transition.event, expected.event, `${transitionLabel}.event`),
      positionRule: literal(transition.positionRule, expected.positionRule, `${transitionLabel}.positionRule`),
      invocationRule: literal(transition.invocationRule, expected.invocationRule, `${transitionLabel}.invocationRule`),
      caseRule: literal(transition.caseRule, expected.caseRule, `${transitionLabel}.caseRule`),
      terminalStateValues: exactStringArray(transition.terminalStateValues, expected.terminalStateValues, `${transitionLabel}.terminalStateValues`),
      progressRule: literal(transition.progressRule, expected.progressRule, `${transitionLabel}.progressRule`),
    });
  });
  if (transitions.length !== transitionAuthority.length) fail(`${label}.eventStateTransitions`, "must cover every exact event transition");
  return Object.freeze({
    schema: literal(row.schema, "phase10-c0v-worker-progress-contract-v1", `${label}.schema`),
    filename: literal(row.filename, "worker-progress.jsonl", `${label}.filename`),
    rowSchema: literal(row.rowSchema, "phase10-c0v-worker-progress-row-v1", `${label}.rowSchema`),
    exactFields: exactStringArray(row.exactFields, [
      "schema", "sequence", "observedAt", "event", "invocationId", "caseId", "startedCaseIds",
      "completedCaseIds", "activeCaseId", "completedNumericFieldValueCount",
      "completedUniformFieldValueCount", "candidateByteLength", "candidateSha256", "terminalState",
    ], `${label}.exactFields`),
    eventValues: exactStringArray(row.eventValues, [
      "worker-started", "invocation-started", "case-started", "case-completed",
      "invocation-finished", "worker-stopped",
    ], `${label}.eventValues`),
    eventStateTransitions: Object.freeze(transitions),
    caseOrder: exactStringArray(row.caseOrder, PHASE10_C0V_S6_RADIAL_CASE_ORDER, `${label}.caseOrder`),
    completedFieldValueCounts: exactIntegerArray(row.completedFieldValueCounts, [21, 40, 80, 159], `${label}.completedFieldValueCounts`),
    writer: literal(row.writer, "parent-executor-from-structured-child-messages", `${label}.writer`),
    sequenceRule: literal(row.sequenceRule, "zero-based-contiguous", `${label}.sequenceRule`),
    timestampRule: literal(row.timestampRule, "canonical-millisecond-utc-nondecreasing-within-attempt", `${label}.timestampRule`),
    prefixRule: literal(row.prefixRule, "started-and-completed-case-lists-are-exact-roster-prefixes", `${label}.prefixRule`),
    countRule: literal(row.countRule, "numeric-and-uniform-counts-equal-sum-of-completed-case-node-counts", `${label}.countRule`),
    candidateRule: literal(row.candidateRule, "zero-and-null-until-exact-retained-candidate-exists", `${label}.candidateRule`),
    embeddedRule: literal(row.embeddedRule, "compact-jsonl-lf-reserialization-matches-artifact-identity", `${label}.embeddedRule`),
  });
}

function parseWorkerInvocationContract(
  value: StrictJson,
  label: string,
): Phase10C0VS6WorkerInvocationContract {
  const row = object(value, label);
  exactKeys(row, [
    "schema", "filename", "rowSchema", "exactFields", "eventValues", "eventStateTransitions",
    "writer", "sequenceRule", "timestampRule", "monotonicClockRule", "durationRule",
    "rosterRule", "embeddedDerivationRule",
  ], label);
  const expectedFields = [
    "schema", "sequence", "observedAt", "monotonicOffsetNanoseconds", "event", "invocationId", "callableId",
    "negativeControlId", "invocationClass", "registeredWallSecondsMaximum", "terminalState",
  ];
  const expectedTransitions = [
    ["worker-started", "worker-started", "first-record-only", "all-invocation-fields-null", ["running"]],
    ["invocation-started", "invocation-started", "next-unfinished-protocol-invocation", "exact-open-protocol-invocation", ["running"]],
    ["invocation-finished", "invocation-finished", "closes-exact-open-invocation", "same-open-protocol-invocation", ["complete", "registered-cap", "infrastructure-failure"]],
    ["worker-stopped", "worker-stopped", "final-record-only", "all-invocation-fields-null-no-open-invocation", ["complete", "registered-cap", "infrastructure-failure"]],
  ] as const;
  const transitions = arrayValue(row.eventStateTransitions, `${label}.eventStateTransitions`).map((entry, index) => {
    const transitionLabel = `${label}.eventStateTransitions[${index}]`;
    const transition = object(entry, transitionLabel);
    exactKeys(transition, ["transitionId", "event", "positionRule", "invocationRule", "terminalStateValues"], transitionLabel);
    const expected = expectedTransitions[index];
    if (expected === undefined) fail(transitionLabel, "is extra");
    return Object.freeze({
      transitionId: literal(transition.transitionId, expected[0], `${transitionLabel}.transitionId`),
      event: literal(transition.event, expected[1], `${transitionLabel}.event`),
      positionRule: literal(transition.positionRule, expected[2], `${transitionLabel}.positionRule`),
      invocationRule: literal(transition.invocationRule, expected[3], `${transitionLabel}.invocationRule`),
      terminalStateValues: exactStringArray(
        transition.terminalStateValues,
        expected[4],
        `${transitionLabel}.terminalStateValues`,
      ),
    });
  });
  if (transitions.length !== expectedTransitions.length) fail(`${label}.eventStateTransitions`, "is incomplete");
  return Object.freeze({
    schema: literal(row.schema, "phase10-c0v-worker-invocation-contract-v1", `${label}.schema`),
    filename: literal(row.filename, "worker-invocations.jsonl", `${label}.filename`),
    rowSchema: literal(row.rowSchema, "phase10-c0v-worker-invocation-row-v1", `${label}.rowSchema`),
    exactFields: exactStringArray(row.exactFields, expectedFields, `${label}.exactFields`),
    eventValues: exactStringArray(
      row.eventValues,
      ["worker-started", "invocation-started", "invocation-finished", "worker-stopped"],
      `${label}.eventValues`,
    ) as readonly ["worker-started", "invocation-started", "invocation-finished", "worker-stopped"],
    eventStateTransitions: Object.freeze(transitions),
    writer: literal(row.writer, "parent-executor-from-structured-child-messages", `${label}.writer`),
    sequenceRule: literal(row.sequenceRule, "zero-based-contiguous", `${label}.sequenceRule`),
    timestampRule: literal(row.timestampRule, "canonical-millisecond-utc-nondecreasing-within-attempt", `${label}.timestampRule`),
    monotonicClockRule: literal(
      row.monotonicClockRule,
      "parent-owned-zero-based-safe-integer-nanoseconds-nondecreasing",
      `${label}.monotonicClockRule`,
    ),
    durationRule: literal(
      row.durationRule,
      "elapsed-nanoseconds-from-invocation-offset-difference-wall-seconds-derived-only-from-elapsed",
      `${label}.durationRule`,
    ),
    rosterRule: literal(row.rosterRule, "exact-protocol-leaf-roster-or-registered-prefix", `${label}.rosterRule`),
    embeddedDerivationRule: literal(
      row.embeddedDerivationRule,
      "attempt-or-verification-records-derived-from-raw-parent-events",
      `${label}.embeddedDerivationRule`,
    ),
  });
}

function parseExitStatusContract(value: StrictJson, label: string): Phase10C0VS6ExitStatusContract {
  const row = object(value, label);
  exactKeys(row, [
    "schema", "filename", "rowSchema", "exactFields", "classificationValues",
    "exitCodeRule", "signalRule", "ownership",
  ], label);
  return Object.freeze({
    schema: literal(row.schema, "phase10-c0v-exit-status-contract-v1", `${label}.schema`),
    filename: literal(row.filename, "exit-status.json", `${label}.filename`),
    rowSchema: literal(row.rowSchema, "phase10-c0v-exit-status-v1", `${label}.rowSchema`),
    exactFields: exactStringArray(row.exactFields, [
      "schema", "packetId", "attemptId", "workerProcessInvocationCount", "workerStarted",
      "exitCode", "signal", "classification",
    ], `${label}.exactFields`),
    classificationValues: exactStringArray(
      row.classificationValues,
      ["no-worker", "complete", "registered-cap", "infrastructure-failure"],
      `${label}.classificationValues`,
    ) as readonly ["no-worker", "complete", "registered-cap", "infrastructure-failure"],
    exitCodeRule: literal(
      row.exitCodeRule,
      "no-worker-both-null-worker-exactly-one-code-or-signal",
      `${label}.exitCodeRule`,
    ),
    signalRule: literal(row.signalRule, "raw-child-signal-never-route-selecting", `${label}.signalRule`),
    ownership: literal(row.ownership, "parent-executor", `${label}.ownership`),
  });
}

function parseFreezeEvaluationContract(
  value: StrictJson,
  label: string,
): Phase10C0VS6FreezeEvaluationContract {
  const row = object(value, label);
  exactKeys(row, [
    "schema", "filename", "rowSchema", "evaluationIdRule", "exactFields", "artifactFailureExactFields",
    "artifactFailureRule", "verdictRule", "constructionRule",
  ], label);
  return Object.freeze({
    schema: literal(row.schema, "phase10-c0v-s6-freeze-evaluation-contract-v1", `${label}.schema`),
    filename: literal(row.filename, "freeze-evaluation.json", `${label}.filename`),
    rowSchema: literal(row.rowSchema, "phase10-c0v-s6-freeze-evaluation-v1", `${label}.rowSchema`),
    evaluationIdRule: literal(
      row.evaluationIdRule,
      "freeze-packet-registered-attempt-v1",
      `${label}.evaluationIdRule`,
    ),
    exactFields: exactStringArray(row.exactFields, [
      "schema", "evaluationId", "packetId", "attemptId", "protocol", "preflight",
      "implementationFreezeCommit", "launchHead", "launchBranch", "anchorPaths", "artifacts",
      "parserRuntimeArtifacts", "artifactFailure", "invokedCheckIds", "verdict", "reasons",
    ], `${label}.exactFields`),
    artifactFailureExactFields: exactStringArray(row.artifactFailureExactFields, [
      "artifactRole", "expected", "observed", "filesystemObservation", "failureClass",
    ], `${label}.artifactFailureExactFields`),
    artifactFailureRule: literal(
      row.artifactFailureRule,
      "null-except-radial-preproduction-artifact-refusal",
      `${label}.artifactFailureRule`,
    ),
    verdictRule: literal(
      row.verdictRule,
      "pass-means-freeze-and-selected-artifact-observation-independently-rederived",
      `${label}.verdictRule`,
    ),
    constructionRule: literal(
      row.constructionRule,
      "immutable-before-terminal-candidate-no-overwrite",
      `${label}.constructionRule`,
    ),
  });
}

function parseCauseEvaluationContract(
  value: StrictJson,
  label: string,
): Phase10C0VS6CauseEvaluationContract {
  const row = object(value, label);
  exactKeys(row, [
    "schema", "filename", "rowSchema", "evaluationIdRule", "exactFields", "observationExactFields",
    "evidenceExactFields", "workerInvocationsRule", "selectionRule", "evidenceRule", "routeRule", "constructionRule",
  ], label);
  return Object.freeze({
    schema: literal(row.schema, "phase10-c0v-s6-cause-evaluation-contract-v1", `${label}.schema`),
    filename: literal(row.filename, "cause-evaluation.json", `${label}.filename`),
    rowSchema: literal(row.rowSchema, "phase10-c0v-s6-cause-evaluation-v1", `${label}.rowSchema`),
    evaluationIdRule: literal(
      row.evaluationIdRule,
      "cause-packet-registered-attempt-subroute-v1",
      `${label}.evaluationIdRule`,
    ),
    exactFields: exactStringArray(row.exactFields, [
      "schema", "evaluationId", "packetId", "attemptId", "selectedSubrouteId", "dispositionCode",
      "protocol", "preflight", "exitStatus", "workerInvocations", "classificationConditionIds",
      "observations", "evidence", "evaluatorCallableId", "invokedCheckIds", "verdict", "reasons",
    ], `${label}.exactFields`),
    observationExactFields: exactStringArray(row.observationExactFields, [
      "conditionId", "kind", "comparator", "registeredValue", "observedValue", "unit",
      "routeConditionMatched", "preconditionPassed", "evidenceIds",
    ], `${label}.observationExactFields`),
    evidenceExactFields: exactStringArray(row.evidenceExactFields, [
      "evidenceId", "evidenceRole", "retentionClass", "artifact", "inlineObservationPath",
    ], `${label}.evidenceExactFields`) as readonly [
      "evidenceId", "evidenceRole", "retentionClass", "artifact", "inlineObservationPath",
    ],
    workerInvocationsRule: literal(
      row.workerInvocationsRule,
      "null-iff-worker-process-count-zero-otherwise-exact-attempt-local-identity",
      `${label}.workerInvocationsRule`,
    ),
    selectionRule: literal(
      row.selectionRule,
      "exact-terminal-subroute-condition-roster-and-raw-observations",
      `${label}.selectionRule`,
    ),
    evidenceRule: literal(
      row.evidenceRule,
      "condition-specific-tracked-identities-or-inline-observations-no-self-identity",
      `${label}.evidenceRule`,
    ),
    routeRule: literal(
      row.routeRule,
      "cross-route-extra-missing-or-relabelled-observation-refuses",
      `${label}.routeRule`,
    ),
    constructionRule: literal(
      row.constructionRule,
      "immutable-before-terminal-candidate-no-overwrite",
      `${label}.constructionRule`,
    ),
  });
}

function parseTerminalCandidateContract(
  value: StrictJson,
  label: string,
): Phase10C0VS6TerminalCandidateContract {
  const row = object(value, label);
  exactKeys(row, [
    "schema", "rowSchema", "successFilename", "exactFields",
    "decisionExactFields", "decisionEvidenceExactFields", "decisionRosters", "verdictRule",
    "forbiddenFields", "constructionRule",
  ], label);
  const decisionRosters = arrayValue(row.decisionRosters, `${label}.decisionRosters`).map((entry, rosterIndex) => {
    const rosterLabel = `${label}.decisionRosters[${rosterIndex}]`;
    const roster = object(entry, rosterLabel);
    exactKeys(roster, [
      "subrouteId", "candidateFilename", "candidateVerdict", "candidateProducedOutputIds",
      "candidateExecutedCheckIds", "candidateExecutedNegativeControlIds", "candidateReasonCodes",
      "candidateCallerInvocationIds", "decisions",
    ], rosterLabel);
    const decisions = arrayValue(roster.decisions, `${rosterLabel}.decisions`).map((decisionEntry, decisionIndex) => {
      const decisionLabel = `${rosterLabel}.decisions[${decisionIndex}]`;
      const decision = object(decisionEntry, decisionLabel);
      exactKeys(decision, [
        "decisionRole", "fieldName", "decisionId", "evaluatorCallableId", "invokedCheckIds",
        "expectedVerdict", "evidence",
      ], decisionLabel);
      const decisionRole = enumValue(decision.decisionRole, ["freeze", "cause"] as const, `${decisionLabel}.decisionRole`);
      const expectedFieldName = `${decisionRole}Decision` as const;
      const fieldName = enumValue(decision.fieldName, ["freezeDecision", "causeDecision"] as const, `${decisionLabel}.fieldName`);
      if (fieldName !== expectedFieldName) fail(`${decisionLabel}.fieldName`, "does not match decisionRole");
      const evidence = arrayValue(decision.evidence, `${decisionLabel}.evidence`).map((evidenceEntry, evidenceIndex) => {
        const evidenceLabel = `${decisionLabel}.evidence[${evidenceIndex}]`;
        const evidenceRow = object(evidenceEntry, evidenceLabel);
        exactKeys(evidenceRow, ["evidenceRole", "artifactRelativePath"], evidenceLabel);
        return Object.freeze({
          evidenceRole: enumValue(
            evidenceRow.evidenceRole,
            ["freeze-evaluation", "cause-evaluation"] as const,
            `${evidenceLabel}.evidenceRole`,
          ),
          artifactRelativePath: enumValue(
            evidenceRow.artifactRelativePath,
            ["freeze-evaluation.json", "cause-evaluation.json"] as const,
            `${evidenceLabel}.artifactRelativePath`,
          ),
        });
      });
      if (evidence.length !== 1 || evidence[0]?.evidenceRole !== `${decisionRole}-evaluation` ||
        evidence[0]?.artifactRelativePath !== `${decisionRole}-evaluation.json`) {
        fail(`${decisionLabel}.evidence`, "must contain the exact single role/path pair for the decision");
      }
      return Object.freeze({
        decisionRole,
        fieldName,
        decisionId: stringValue(decision.decisionId, `${decisionLabel}.decisionId`),
        evaluatorCallableId: stringValue(decision.evaluatorCallableId, `${decisionLabel}.evaluatorCallableId`),
        invokedCheckIds: stringArray(decision.invokedCheckIds, `${decisionLabel}.invokedCheckIds`),
        expectedVerdict: enumValue(decision.expectedVerdict, ["pass", "fail"] as const, `${decisionLabel}.expectedVerdict`),
        evidence: Object.freeze(evidence),
      });
    });
    const decisionOrder = ["freeze", "cause"] as const;
    const decisionRanks = decisions.map((decision) => decisionOrder.indexOf(decision.decisionRole));
    if (new Set(decisions.map((decision) => decision.decisionRole)).size !== decisions.length ||
      decisionRanks.some((rank, decisionIndex) => decisionIndex > 0 && rank <= decisionRanks[decisionIndex - 1]!)) {
      fail(`${rosterLabel}.decisions`, "must be the unique applicable freeze/cause subsequence in exact role order");
    }
    return Object.freeze({
      subrouteId: stringValue(roster.subrouteId, `${rosterLabel}.subrouteId`),
      candidateFilename: literal(
        roster.candidateFilename,
        "terminal-success-candidate.json",
        `${rosterLabel}.candidateFilename`,
      ),
      candidateVerdict: literal(
        roster.candidateVerdict,
        "accepted-route-candidate",
        `${rosterLabel}.candidateVerdict`,
      ),
      candidateProducedOutputIds: stringArray(
        roster.candidateProducedOutputIds,
        `${rosterLabel}.candidateProducedOutputIds`,
      ),
      candidateExecutedCheckIds: stringArray(
        roster.candidateExecutedCheckIds,
        `${rosterLabel}.candidateExecutedCheckIds`,
      ),
      candidateExecutedNegativeControlIds: stringArray(
        roster.candidateExecutedNegativeControlIds,
        `${rosterLabel}.candidateExecutedNegativeControlIds`,
      ),
      candidateReasonCodes: stringArray(
        roster.candidateReasonCodes,
        `${rosterLabel}.candidateReasonCodes`,
      ),
      candidateCallerInvocationIds: stringArray(
        roster.candidateCallerInvocationIds,
        `${rosterLabel}.candidateCallerInvocationIds`,
      ),
      decisions: Object.freeze(decisions),
    });
  });
  return Object.freeze({
    schema: literal(row.schema, "phase10-c0v-terminal-candidate-contract-v1", `${label}.schema`),
    rowSchema: literal(row.rowSchema, "phase10-c0v-terminal-candidate-v1", `${label}.rowSchema`),
    successFilename: literal(row.successFilename, "terminal-success-candidate.json", `${label}.successFilename`),
    exactFields: exactStringArray(row.exactFields, [
      "schema", "packetId", "attemptId", "selectedSubrouteId", "dispositionCode", "preflight",
      "exitStatus", "producedOutputIds", "executedCheckIds", "executedNegativeControlIds",
      "callerInvocationResults", "freezeDecision", "causeDecision", "verdict", "reasons",
    ], `${label}.exactFields`),
    decisionExactFields: exactStringArray(row.decisionExactFields, [
      "decisionId", "evaluatorCallableId", "invokedCheckIds", "verdict", "reasons", "evidence",
    ], `${label}.decisionExactFields`),
    decisionEvidenceExactFields: exactStringArray(
      row.decisionEvidenceExactFields,
      ["evidenceRole", "artifact"],
      `${label}.decisionEvidenceExactFields`,
    ) as readonly ["evidenceRole", "artifact"],
    decisionRosters: Object.freeze(decisionRosters),
    verdictRule: literal(
      row.verdictRule,
      "accepted-route-candidate-for-every-current-materializable-subroute",
      `${label}.verdictRule`,
    ),
    forbiddenFields: exactStringArray(
      row.forbiddenFields,
      ["attemptLedger", "packetVerification", "terminalReceipt"],
      `${label}.forbiddenFields`,
    ) as readonly ["attemptLedger", "packetVerification", "terminalReceipt"],
    constructionRule: literal(row.constructionRule, "immutable-preledger-candidate-no-overwrite", `${label}.constructionRule`),
  });
}

function parseTerminalReceiptContract(
  value: StrictJson,
  label: string,
): Phase10C0VS6TerminalReceiptContract {
  const row = object(value, label);
  exactKeys(row, [
    "schema", "receiptSchema", "receiptIdRule", "constructionOrder",
    "radialValidatedRefusalCreditRule", "makerReturnRule", "infrastructureFailStopRule",
    "callerInvocationResultExactFields", "callerResultSourceIdentityExactFields",
    "callerInvocationResultRosters", "callerResultRule",
  ], label);
  const callerInvocationResultRosters = arrayValue(
    row.callerInvocationResultRosters,
    `${label}.callerInvocationResultRosters`,
  ).map((rosterEntry, rosterIndex) => {
    const rosterLabel = `${label}.callerInvocationResultRosters[${rosterIndex}]`;
    const roster = object(rosterEntry, rosterLabel);
    exactKeys(roster, ["subrouteId", "callerInvocationResults"], rosterLabel);
    const callerInvocationResults = arrayValue(
      roster.callerInvocationResults,
      `${rosterLabel}.callerInvocationResults`,
    ).map((resultEntry, resultIndex) => {
      const resultLabel = `${rosterLabel}.callerInvocationResults[${resultIndex}]`;
      const result = object(resultEntry, resultLabel);
      exactKeys(result, [
        "callerInvocationId", "stage", "callerCallableId", "evaluatorCallableId", "terminalState",
        "executedCheckIds", "evaluatedCheckIds", "executedNegativeControlIds", "evaluatorResultRule",
        "sourceArtifactAuthorities",
      ], resultLabel);
      const terminalState = enumValue(
        result.terminalState,
        ["complete", "child-registered-cap"] as const,
        `${resultLabel}.terminalState`,
      );
      const evaluatorResultRule = enumValue(
        result.evaluatorResultRule,
        ["canonical-rerun-exact", "null-child-registered-cap"] as const,
        `${resultLabel}.evaluatorResultRule`,
      );
      if ((terminalState === "complete") !== (evaluatorResultRule === "canonical-rerun-exact")) {
        fail(resultLabel, "terminalState and evaluatorResultRule differ");
      }
      const sourceArtifactAuthorities = arrayValue(
        result.sourceArtifactAuthorities,
        `${resultLabel}.sourceArtifactAuthorities`,
      ).map((sourceEntry, sourceIndex) => {
        const sourceLabel = `${resultLabel}.sourceArtifactAuthorities[${sourceIndex}]`;
        const source = object(sourceEntry, sourceLabel);
        exactKeys(source, ["artifactRole", "sourceKind", "outputId", "artifactRelativePath"], sourceLabel);
        const sourceKind = enumValue(
          source.sourceKind,
          ["registered-output", "attempt-internal"] as const,
          `${sourceLabel}.sourceKind`,
        );
        const outputId = source.outputId === null
          ? null
          : stringValue(source.outputId, `${sourceLabel}.outputId`);
        const artifactRelativePath = source.artifactRelativePath === null
          ? null
          : stringValue(source.artifactRelativePath, `${sourceLabel}.artifactRelativePath`);
        if ((sourceKind === "registered-output") !== (outputId !== null) ||
          (sourceKind === "attempt-internal") !== (artifactRelativePath !== null)) {
          fail(sourceLabel, "source kind must select exactly one output ID or internal relative path");
        }
        return Object.freeze({
          artifactRole: stringValue(source.artifactRole, `${sourceLabel}.artifactRole`),
          sourceKind,
          outputId,
          artifactRelativePath,
        });
      });
      uniqueBy(sourceArtifactAuthorities, (entry) => entry.artifactRole, `${resultLabel}.sourceArtifactAuthorities`);
      const executedCheckIds = stringArray(result.executedCheckIds, `${resultLabel}.executedCheckIds`);
      const evaluatedCheckIds = stringArray(result.evaluatedCheckIds, `${resultLabel}.evaluatedCheckIds`);
      if (executedCheckIds.length !== evaluatedCheckIds.length ||
        executedCheckIds.some((entry, index) => entry !== evaluatedCheckIds[index]) ||
        (terminalState === "child-registered-cap" &&
          (executedCheckIds.length !== 0 || stringArray(
            result.executedNegativeControlIds,
            `${resultLabel}.executedNegativeControlIds`,
          ).length !== 0))) {
        fail(resultLabel, "caller result check/control roster differs from terminal-state authority");
      }
      return Object.freeze({
        callerInvocationId: stringValue(result.callerInvocationId, `${resultLabel}.callerInvocationId`),
        stage: enumValue(result.stage, ["pre-candidate", "post-candidate"] as const, `${resultLabel}.stage`),
        callerCallableId: stringValue(result.callerCallableId, `${resultLabel}.callerCallableId`),
        evaluatorCallableId: stringValue(result.evaluatorCallableId, `${resultLabel}.evaluatorCallableId`),
        terminalState,
        executedCheckIds,
        evaluatedCheckIds,
        executedNegativeControlIds: stringArray(
          result.executedNegativeControlIds,
          `${resultLabel}.executedNegativeControlIds`,
        ),
        evaluatorResultRule,
        sourceArtifactAuthorities: Object.freeze(sourceArtifactAuthorities),
      });
    });
    uniqueBy(callerInvocationResults, (entry) => entry.callerInvocationId, `${rosterLabel}.callerInvocationResults`);
    return Object.freeze({
      subrouteId: stringValue(roster.subrouteId, `${rosterLabel}.subrouteId`),
      callerInvocationResults: Object.freeze(callerInvocationResults),
    });
  });
  uniqueBy(callerInvocationResultRosters, (entry) => entry.subrouteId, `${label}.callerInvocationResultRosters`);
  return Object.freeze({
    schema: literal(row.schema, "phase10-c0v-s6-terminal-receipt-contract-v1", `${label}.schema`),
    receiptSchema: literal(row.receiptSchema, "phase10-c0v-s6-terminal-receipt-v2", `${label}.receiptSchema`),
    receiptIdRule: literal(row.receiptIdRule, "phase10-packet-attempt-terminal-v2", `${label}.receiptIdRule`),
    constructionOrder: literal(
      row.constructionOrder,
      "terminal-candidate-then-ledger-then-verification-then-final-terminal",
      `${label}.constructionOrder`,
    ),
    radialValidatedRefusalCreditRule: literal(
      row.radialValidatedRefusalCreditRule,
      "artifact-prelaunch-and-five-cap-refusals-require-verification-and-dependency-credit",
      `${label}.radialValidatedRefusalCreditRule`,
    ),
    makerReturnRule: literal(
      row.makerReturnRule,
      "moving-static-route-cap-and-nonproduce-cap-have-null-verification-zero-credit",
      `${label}.makerReturnRule`,
    ),
    infrastructureFailStopRule: literal(
      row.infrastructureFailStopRule,
      "retain-ignored-root-and-lock-no-candidate-ledger-verification-or-final-receipt-successor-required",
      `${label}.infrastructureFailStopRule`,
    ),
    callerInvocationResultExactFields: exactStringArray(row.callerInvocationResultExactFields, [
      "callerInvocationId", "stage", "callerCallableId", "evaluatorCallableId", "terminalState",
      "executedCheckIds", "evaluatedCheckIds", "executedNegativeControlIds", "evaluatorResult",
      "sourceArtifactIdentities",
    ], `${label}.callerInvocationResultExactFields`) as Phase10C0VS6TerminalReceiptContract["callerInvocationResultExactFields"],
    callerResultSourceIdentityExactFields: exactStringArray(
      row.callerResultSourceIdentityExactFields,
      ["artifactRole", "artifact"],
      `${label}.callerResultSourceIdentityExactFields`,
    ) as readonly ["artifactRole", "artifact"],
    callerInvocationResultRosters: Object.freeze(callerInvocationResultRosters),
    callerResultRule: literal(
      row.callerResultRule,
      "candidate-prestage-subsequence-verification-full-rerun-terminal-exact-copy",
      `${label}.callerResultRule`,
    ),
  });
}

function parseExecutionTuple(value: StrictJson, label: string): Phase10C0VS6ExecutionRecordTuple {
  const row = object(value, label);
  exactKeys(row, ["tupleId", "dispositionCode", "terminalStatus", "lifecycleStage", "record", "governedInvocationElapsedNanosecondsRule", "partialExecutionRule"], label);
  const record = object(row.record, `${label}.record`);
  const countFields = ["protocolReopenCount", "referenceOrRefusalReopenCount", "workerProcessInvocationCount", "solverWorkerInvocationCount", "productionInvocationCount", "discrepancyOrRefusalEvaluatorInvocationCount", "freezeEvaluatorInvocationCount", "resourceEvaluatorInvocationCount", "attemptCensusEvaluatorInvocationCount", "checkCallerInvocationCount", "numericalEvaluatorInvocationCount", "numericalNegativeControlInvocationCount", "acceptedValidWitnessCount", "acceptedNumericalVerdictCount"] as const;
  exactKeys(record, countFields, `${label}.record`);
  const counts = Object.fromEntries(countFields.map((field) => [field, safeInteger(record[field], `${label}.record.${field}`)])) as unknown as Phase10C0VS6ExecutionRecordTuple["record"];
  return Object.freeze({
    tupleId: stringValue(row.tupleId, `${label}.tupleId`),
    dispositionCode: enumValue(row.dispositionCode, ["production-complete", "preproduction-artifact-refusal", "prelaunch-resource-refusal", "registered-cap-resource-refusal", "reference-discrepancy-refusal", "preimplementation-reference-refusal"] as const, `${label}.dispositionCode`),
    terminalStatus: enumValue(row.terminalStatus, ["pass", "fail", "refusal"] as const, `${label}.terminalStatus`),
    lifecycleStage: stringValue(row.lifecycleStage, `${label}.lifecycleStage`),
    record: Object.freeze(counts),
    governedInvocationElapsedNanosecondsRule: enumValue(row.governedInvocationElapsedNanosecondsRule, ["exact-zero", "measured-sum"] as const, `${label}.governedInvocationElapsedNanosecondsRule`),
    partialExecutionRule: enumValue(row.partialExecutionRule, ["must-be-null", "must-be-present"] as const, `${label}.partialExecutionRule`),
  });
}

function parseExecutableInvocationRoster(
  value: StrictJson,
  label: string,
): Phase10C0VS6ExecutableInvocationRoster {
  const row = object(value, label);
  exactKeys(row, ["tupleId", "completionRule", "prefixOfTupleId", "invocations"], label);
  const completionRule = enumValue(row.completionRule, [
    "complete-roster", "registered-cap-prefix",
  ] as const, `${label}.completionRule`);
  const prefixOfTupleId = row.prefixOfTupleId === null ? null : stringValue(row.prefixOfTupleId, `${label}.prefixOfTupleId`);
  if ((completionRule === "complete-roster") !== (prefixOfTupleId === null)) {
    fail(label, "prefixOfTupleId must be null exactly for a complete roster");
  }
  const invocations = arrayValue(row.invocations, `${label}.invocations`).map((entry, index) => {
    const invocationLabel = `${label}.invocations[${index}]`;
    const invocation = object(entry, invocationLabel);
    exactKeys(invocation, ["invocationId", "callableId", "negativeControlId", "invocationClass", "registeredWallSecondsMaximum", "terminalState"], invocationLabel);
    const invocationClass = enumValue(invocation.invocationClass, [
      "solver-production", "numerical-evaluator", "numerical-negative-control", "route-cause-evaluator",
    ] as const, `${invocationLabel}.invocationClass`);
    const negativeControlId = invocation.negativeControlId === null
      ? null
      : stringValue(invocation.negativeControlId, `${invocationLabel}.negativeControlId`);
    if ((invocationClass === "numerical-negative-control") !== (negativeControlId !== null)) {
      fail(invocationLabel, "negativeControlId must be non-null exactly for numerical-negative-control");
    }
    const maximum = safeInteger(invocation.registeredWallSecondsMaximum, `${invocationLabel}.registeredWallSecondsMaximum`, 1);
    if ((invocationClass === "solver-production" && maximum !== 300) ||
      (invocationClass !== "solver-production" && maximum !== 14400)) {
      fail(invocationLabel, "registered wall cap differs from invocation-class authority");
    }
    return Object.freeze({
      invocationId: stringValue(invocation.invocationId, `${invocationLabel}.invocationId`),
      callableId: stringValue(invocation.callableId, `${invocationLabel}.callableId`),
      negativeControlId,
      invocationClass,
      registeredWallSecondsMaximum: maximum as 300 | 14400,
      terminalState: enumValue(invocation.terminalState, [
        "complete", "registered-cap",
      ] as const, `${invocationLabel}.terminalState`),
    });
  });
  uniqueBy(invocations, (entry) => entry.invocationId, `${label}.invocations`);
  return Object.freeze({
    tupleId: stringValue(row.tupleId, `${label}.tupleId`),
    completionRule,
    prefixOfTupleId,
    invocations: Object.freeze(invocations),
  });
}

const PHASE10_C0V_S6_PACKET_VERIFICATION_INVOCATION_ROSTERS: Readonly<
  Record<Phase10C0VS6PacketId, readonly Phase10C0VS6PacketVerificationInvocationAuthority[]>
> = Object.freeze({
  "a-p-c0v-s6": Object.freeze([
    Object.freeze({ invocationId: "inv-a-p-c0v-s6-nc-missing-producer", callableId: "phase10-nc-a-p-c0v-s6-missing-producer", negativeControlId: "nc-ap-c0v-s6-missing-producer", invocationClass: "packet-negative-control", registeredWallSecondsMaximum: 14400 }),
    Object.freeze({ invocationId: "inv-a-p-c0v-s6-nc-uncalled-check", callableId: "phase10-nc-a-p-c0v-s6-uncalled-check", negativeControlId: "nc-ap-c0v-s6-uncalled-check", invocationClass: "packet-negative-control", registeredWallSecondsMaximum: 14400 }),
    Object.freeze({ invocationId: "inv-a-p-c0v-s6-producer", callableId: "phase10-a-p-c0v-s6-producer", negativeControlId: null, invocationClass: "packet-producer", registeredWallSecondsMaximum: 14400 }),
    Object.freeze({ invocationId: "inv-a-p-c0v-s6-check-caller", callableId: "phase10-a-p-c0v-s6-check-caller", negativeControlId: null, invocationClass: "packet-evaluator", registeredWallSecondsMaximum: 14400 }),
  ]),
  "c0v-moving-produce": Object.freeze([]),
  "c0v-moving-publish": Object.freeze([
    Object.freeze({ invocationId: "inv-c0v-moving-publish-producer", callableId: "phase10-c0v-moving-publish-producer", negativeControlId: null, invocationClass: "packet-producer", registeredWallSecondsMaximum: 14400 }),
    Object.freeze({ invocationId: "inv-c0v-moving-publish-check-caller", callableId: "phase10-c0v-moving-publish-check-caller", negativeControlId: null, invocationClass: "packet-evaluator", registeredWallSecondsMaximum: 14400 }),
  ]),
  "c0v-radial-produce": Object.freeze([]),
  "c0v-radial-publish": Object.freeze([
    Object.freeze({ invocationId: "inv-c0v-radial-publish-producer", callableId: "phase10-c0v-radial-publish-producer", negativeControlId: null, invocationClass: "packet-producer", registeredWallSecondsMaximum: 14400 }),
    Object.freeze({ invocationId: "inv-c0v-radial-publish-check-caller", callableId: "phase10-c0v-radial-publish-check-caller", negativeControlId: null, invocationClass: "packet-evaluator", registeredWallSecondsMaximum: 14400 }),
  ]),
  "c0v-static-produce": Object.freeze([]),
  "c0v-static-publish": Object.freeze([
    Object.freeze({ invocationId: "inv-c0v-static-publish-producer", callableId: "phase10-c0v-static-publish-producer", negativeControlId: null, invocationClass: "packet-producer", registeredWallSecondsMaximum: 14400 }),
    Object.freeze({ invocationId: "inv-c0v-static-publish-check-caller", callableId: "phase10-c0v-static-publish-check-caller", negativeControlId: null, invocationClass: "packet-evaluator", registeredWallSecondsMaximum: 14400 }),
  ]),
  "c0v-aggregate": Object.freeze([
    Object.freeze({ invocationId: "inv-c0v-aggregate-nc-any-layer-nonpass", callableId: "phase10-nc-c0v-any-layer-nonpass", negativeControlId: "nc-c0v-any-layer-nonpass", invocationClass: "packet-negative-control", registeredWallSecondsMaximum: 14400 }),
    Object.freeze({ invocationId: "inv-c0v-aggregate-producer", callableId: "phase10-c0v-aggregate-producer", negativeControlId: null, invocationClass: "packet-producer", registeredWallSecondsMaximum: 14400 }),
    Object.freeze({ invocationId: "inv-c0v-aggregate-check-caller", callableId: "phase10-c0v-aggregate-check-caller", negativeControlId: null, invocationClass: "packet-evaluator", registeredWallSecondsMaximum: 14400 }),
  ]),
});

function parsePacketVerificationInvocationRoster(
  value: StrictJson,
  packetId: Phase10C0VS6PacketId,
  label: string,
): readonly Phase10C0VS6PacketVerificationInvocationAuthority[] {
  const expected = PHASE10_C0V_S6_PACKET_VERIFICATION_INVOCATION_ROSTERS[packetId];
  const parsed = arrayValue(value, label).map((entry, index) => {
    const invocationLabel = `${label}[${index}]`;
    const invocation = object(entry, invocationLabel);
    exactKeys(invocation, ["invocationId", "callableId", "negativeControlId", "invocationClass", "registeredWallSecondsMaximum"], invocationLabel);
    const invocationClass = enumValue(invocation.invocationClass, [
      "packet-producer", "packet-evaluator", "packet-negative-control",
    ] as const, `${invocationLabel}.invocationClass`);
    const negativeControlId = invocation.negativeControlId === null
      ? null
      : stringValue(invocation.negativeControlId, `${invocationLabel}.negativeControlId`);
    if ((invocationClass === "packet-negative-control") !== (negativeControlId !== null)) {
      fail(invocationLabel, "negativeControlId must be non-null exactly for packet-negative-control");
    }
    const maximum = safeInteger(invocation.registeredWallSecondsMaximum, `${invocationLabel}.registeredWallSecondsMaximum`, 1);
    if (maximum !== 14400) fail(invocationLabel, "registered wall cap must equal 14400 seconds");
    return Object.freeze({
      invocationId: stringValue(invocation.invocationId, `${invocationLabel}.invocationId`),
      callableId: stringValue(invocation.callableId, `${invocationLabel}.callableId`),
      negativeControlId,
      invocationClass,
      registeredWallSecondsMaximum: 14400 as const,
    });
  });
  if (parsed.length !== expected.length || parsed.some((entry, index) => {
    const authority = expected[index];
    return authority === undefined || entry.invocationId !== authority.invocationId ||
      entry.callableId !== authority.callableId || entry.negativeControlId !== authority.negativeControlId ||
      entry.invocationClass !== authority.invocationClass ||
      entry.registeredWallSecondsMaximum !== authority.registeredWallSecondsMaximum;
  })) {
    fail(label, "differs from the exact packet-governed verification leaf order");
  }
  return Object.freeze(parsed);
}

function parseRadialLayout(value: StrictJson, label: string): Phase10C0VS6RadialBinaryLayoutAuthority {
  const row = object(value, label);
  exactKeys(row, ["magic", "formatVersion", "endiannessMarker", "schemaId", "schemaByteLength", "headerByteLength", "payloadByteLength", "fileByteLength", "protocolDigestSource", "referenceDigestSource", "producerEvaluatorSharedRuntimeClosurePaths", "headerOffsets", "globalFloatNames", "caseOrder", "caseNodeCounts", "caseScalarNames", "caseRecordByteLengths", "payloadPrefixByteLength", "recordByteLengthPrefixPresent", "numericEncoding", "exactZeroEncoding", "trailingBytesAllowed"], label);
  if (row.recordByteLengthPrefixPresent !== false || row.trailingBytesAllowed !== false) fail(label, "record prefix and trailing bytes must be false");
  const headerOffsets = object(row.headerOffsets, `${label}.headerOffsets`);
  const expectedOffsetNames = Object.keys(PHASE10_C0V_S6_RADIAL_HEADER_OFFSETS);
  exactKeys(headerOffsets, expectedOffsetNames, `${label}.headerOffsets`);
  const parsedOffsets: Record<string, readonly [number, number]> = {};
  for (const offsetName of expectedOffsetNames) {
    const range = arrayValue(headerOffsets[offsetName]!, `${label}.headerOffsets.${offsetName}`);
    if (range.length !== 2) fail(`${label}.headerOffsets.${offsetName}`, "must contain two offsets");
    const parsed = Object.freeze([
      safeInteger(range[0]!, `${label}.headerOffsets.${offsetName}[0]`),
      safeInteger(range[1]!, `${label}.headerOffsets.${offsetName}[1]`),
    ] as const);
    const expected = PHASE10_C0V_S6_RADIAL_HEADER_OFFSETS[offsetName as keyof typeof PHASE10_C0V_S6_RADIAL_HEADER_OFFSETS];
    if (parsed[0] !== expected[0] || parsed[1] !== expected[1]) {
      fail(`${label}.headerOffsets.${offsetName}`, "differs from exact end-exclusive byte range");
    }
    parsedOffsets[offsetName] = parsed;
  }
  const formatVersion = safeInteger(row.formatVersion, `${label}.formatVersion`, 1);
  const endiannessMarker = safeInteger(row.endiannessMarker, `${label}.endiannessMarker`, 1);
  const schemaByteLength = safeInteger(row.schemaByteLength, `${label}.schemaByteLength`, 1);
  const headerByteLength = safeInteger(row.headerByteLength, `${label}.headerByteLength`, 1);
  const payloadByteLength = safeInteger(row.payloadByteLength, `${label}.payloadByteLength`, 1);
  const fileByteLength = safeInteger(row.fileByteLength, `${label}.fileByteLength`, 1);
  const payloadPrefixByteLength = safeInteger(row.payloadPrefixByteLength, `${label}.payloadPrefixByteLength`, 1);
  if (formatVersion !== 1 || endiannessMarker !== 16909060 || schemaByteLength !== 29 ||
    headerByteLength !== 153 || payloadByteLength !== 5738 || fileByteLength !== 5891 ||
    payloadPrefixByteLength !== 184) fail(label, "fixed layout literals differ");
  return Object.freeze({
    magic: literal(row.magic, "C0VRAD01", `${label}.magic`),
    formatVersion: formatVersion as 1,
    endiannessMarker: endiannessMarker as 16909060,
    schemaId: literal(row.schemaId, "phase10-c0v-radial-witness-v1", `${label}.schemaId`),
    schemaByteLength: schemaByteLength as 29,
    headerByteLength: headerByteLength as 153,
    payloadByteLength: payloadByteLength as 5738,
    fileByteLength: fileByteLength as 5891,
    protocolDigestSource: literal(row.protocolDigestSource, "s5-science-protocol", `${label}.protocolDigestSource`),
    referenceDigestSource: literal(row.referenceDigestSource, "s5-reference", `${label}.referenceDigestSource`),
    producerEvaluatorSharedRuntimeClosurePaths: exactStringArray(
      row.producerEvaluatorSharedRuntimeClosurePaths,
      PHASE10_C0V_S6_RADIAL_SHARED_RUNTIME_CLOSURE_PATHS,
      `${label}.producerEvaluatorSharedRuntimeClosurePaths`,
    ),
    headerOffsets: Object.freeze(parsedOffsets),
    globalFloatNames: exactStringArray(row.globalFloatNames, PHASE10_C0V_S6_RADIAL_GLOBAL_FLOAT_NAMES, `${label}.globalFloatNames`),
    caseOrder: exactStringArray(row.caseOrder, PHASE10_C0V_S6_RADIAL_CASE_ORDER, `${label}.caseOrder`),
    caseNodeCounts: exactIntegerArray(row.caseNodeCounts, [21, 40, 80, 159], `${label}.caseNodeCounts`),
    caseScalarNames: exactStringArray(row.caseScalarNames, PHASE10_C0V_S6_RADIAL_CASE_SCALAR_NAMES, `${label}.caseScalarNames`),
    caseRecordByteLengths: exactIntegerArray(row.caseRecordByteLengths, [523, 828, 1469, 2734], `${label}.caseRecordByteLengths`),
    payloadPrefixByteLength: payloadPrefixByteLength as 184,
    recordByteLengthPrefixPresent: false,
    numericEncoding: literal(row.numericEncoding, "float64-le-finite-no-negative-zero", `${label}.numericEncoding`),
    exactZeroEncoding: literal(row.exactZeroEncoding, "positive-zero", `${label}.exactZeroEncoding`),
    trailingBytesAllowed: false,
  });
}

function parseRadialProducerSummary(
  value: StrictJson,
  label: string,
): Phase10C0VS6RadialProducerSummaryAuthority {
  const row = object(value, label);
  exactKeys(row, ["schema", "authority", "exactFields", "caseCount", "totalNumericFieldValues", "totalUniformFieldValues", "reportedMaximumRule", "evaluatorUse"], label);
  const caseCount = safeInteger(row.caseCount, `${label}.caseCount`, 1);
  const numericCount = safeInteger(row.totalNumericFieldValues, `${label}.totalNumericFieldValues`, 1);
  const uniformCount = safeInteger(row.totalUniformFieldValues, `${label}.totalUniformFieldValues`, 1);
  if (caseCount !== 4 || numericCount !== 300 || uniformCount !== 300) fail(label, "fixed summary counts differ");
  return Object.freeze({
    schema: literal(row.schema, "phase10-c0v-radial-producer-summary-v1", `${label}.schema`),
    authority: literal(row.authority, "non-authoritative", `${label}.authority`),
    exactFields: exactStringArray(row.exactFields, [
      "schema", "authority", "caseCount", "totalNumericFieldValues", "totalUniformFieldValues",
      "allFinite", "reportedDisposition", "reportedMaximum",
    ], `${label}.exactFields`),
    caseCount: caseCount as 4,
    totalNumericFieldValues: numericCount as 300,
    totalUniformFieldValues: uniformCount as 300,
    reportedMaximumRule: literal(
      row.reportedMaximumRule,
      "maximum-absolute-stored-robin-residual-without-reference-comparison",
      `${label}.reportedMaximumRule`,
    ),
    evaluatorUse: literal(
      row.evaluatorUse,
      "inventory-and-parse-only-never-metrics-or-verdict",
      `${label}.evaluatorUse`,
    ),
  });
}

const RADIAL_CONTROL_AUTHORITY = Object.freeze({
  "nc-radial-finite-shell-term": Object.freeze({
    operator: "coherent-first-case-missing-shell-constant",
    invariantBindings: Object.freeze([
      "all-other-cases-unchanged", "global-operands-unchanged", "reference-identity-unchanged",
      "uniform-records-unchanged",
    ]),
    expected: "independent-radial-evaluator-fail",
  }),
  "nc-radial-forged-summary": Object.freeze({
    operator: "flip-external-summary-disposition-and-set-maximum-one",
    invariantBindings: Object.freeze([
      "reference-identity-unchanged", "witness-bytes-unchanged", "witness-digest-unchanged",
    ]),
    expected: "clean-independent-evaluation-identical",
  }),
  "nc-radial-robin-coefficient": Object.freeze({
    operator: "coherent-all-numeric-cases-half-robin-coefficient",
    invariantBindings: Object.freeze([
      "global-operands-unchanged", "header-bindings-unchanged", "reference-identity-unchanged",
      "uniform-records-unchanged",
    ]),
    expected: "independent-radial-evaluator-fail",
  }),
});

function parseControlOperators(value: StrictJson, label: string): readonly Phase10C0VS6ControlOperatorAuthority[] {
  const values = arrayValue(value, label);
  const expectedIds = Object.keys(RADIAL_CONTROL_AUTHORITY).sort();
  if (values.length !== 0 && values.length !== expectedIds.length) fail(label, "must be empty or contain all radial controls");
  const parsed = values.map((entry, index) => {
    const row = object(entry, `${label}[${index}]`);
    exactKeys(row, ["negativeControlId", "operator", "invariantBindings", "expected"], `${label}[${index}]`);
    const negativeControlId = stringValue(row.negativeControlId, `${label}[${index}].negativeControlId`);
    if (negativeControlId !== expectedIds[index]) fail(`${label}[${index}].negativeControlId`, "differs from exact control order");
    const authority = RADIAL_CONTROL_AUTHORITY[negativeControlId as keyof typeof RADIAL_CONTROL_AUTHORITY];
    return Object.freeze({
      negativeControlId,
      operator: literal(row.operator, authority.operator, `${label}[${index}].operator`),
      invariantBindings: exactStringArray(row.invariantBindings, authority.invariantBindings, `${label}[${index}].invariantBindings`),
      expected: literal(row.expected, authority.expected, `${label}[${index}].expected`),
    });
  });
  return Object.freeze(parsed);
}

function parseAggregateNegativeControlContract(
  value: StrictJson,
  label: string,
): Phase10C0VS6AggregateNegativeControlContract | null {
  if (value === null) return null;
  const row = object(value, label);
  exactKeys(row, [
    "schema", "filename", "rowSchema", "exactFields", "mutationExactFields", "outcomeExactFields",
    "resultExactFields", "mutationRule", "reproofRule",
  ], label);
  return Object.freeze({
    schema: literal(
      row.schema,
      "phase10-c0v-any-layer-nonpass-control-contract-v1",
      `${label}.schema`,
    ),
    filename: literal(row.filename, "any-layer-nonpass-control.json", `${label}.filename`),
    rowSchema: literal(row.rowSchema, "phase10-c0v-any-layer-nonpass-control-v1", `${label}.rowSchema`),
    exactFields: exactStringArray(row.exactFields, [
      "schema", "negativeControlId", "ownerCheckId", "callableId", "cleanTable", "mutatedLayerId",
      "mutatedTable", "mutation", "cleanOutcome", "attackedOutcome", "result",
    ], `${label}.exactFields`) as Phase10C0VS6AggregateNegativeControlContract["exactFields"],
    mutationExactFields: exactStringArray(row.mutationExactFields, [
      "field", "before", "after", "changedRowCount", "otherRowsUnchanged",
    ], `${label}.mutationExactFields`) as Phase10C0VS6AggregateNegativeControlContract["mutationExactFields"],
    outcomeExactFields: exactStringArray(row.outcomeExactFields, [
      "aggregateStatus", "packageCompletionEligible", "dependentQualificationBlocked",
    ], `${label}.outcomeExactFields`) as Phase10C0VS6AggregateNegativeControlContract["outcomeExactFields"],
    resultExactFields: exactStringArray(row.resultExactFields, [
      "negativeControlId", "mutationExecuted", "witnessMoved", "cleanCapturePreserved",
      "attackedCheckFailed", "pass",
    ], `${label}.resultExactFields`) as Phase10C0VS6AggregateNegativeControlContract["resultExactFields"],
    mutationRule: literal(
      row.mutationRule,
      "three-row-all-independent-pass-radial-scientific-disposition-pass-to-refusal-only",
      `${label}.mutationRule`,
    ),
    reproofRule: literal(
      row.reproofRule,
      "producer-embeds-result-only-verifier-rederives-full-receipt-and-exact-compares",
      `${label}.reproofRule`,
    ),
  });
}

function phase10C0VS6CallerEvaluatorForCheck(checkId: string): readonly [string, string] {
  if (checkId.startsWith("chk-ap-c0v-s6-") && !checkId.endsWith("resource-refusal-validity")) {
    return ["phase10-a-p-c0v-s6-check-caller", "phase10-a-p-c0v-s6-evaluator"];
  }
  if (checkId.endsWith("resource-refusal-validity") ||
    checkId.endsWith("artifact-refusal-validity") || checkId === "chk-c0v-radial-discrepancy-validity") {
    return ["phase10-c0v-s6-refusal-check-caller", "phase10-c0v-s6-refusal-evaluator"];
  }
  if (checkId.endsWith("freeze-ancestry")) {
    return ["phase10-c0v-s6-freeze-check-caller", "phase10-c0v-s6-freeze-evaluator"];
  }
  if (checkId.endsWith("attempt-census")) {
    return ["phase10-c0v-s6-attempt-census-check-caller", "phase10-c0v-s6-attempt-census-evaluator"];
  }
  if (checkId.endsWith("resource-boundary")) {
    return ["phase10-c0v-s6-resource-check-caller", "phase10-c0v-s6-resource-evaluator"];
  }
  if (checkId === "chk-c0v-moving-discrepancy-validity") {
    return ["phase10-c0v-moving-produce-check-caller", "phase10-c0v-moving-evaluator"];
  }
  if (checkId === "chk-c0v-static-refusal-validity") {
    return ["phase10-c0v-static-produce-check-caller", "phase10-c0v-static-refusal-evaluator"];
  }
  if (checkId === "chk-c0v-radial-numeric" || checkId === "chk-c0v-radial-reference-independence") {
    return ["phase10-c0v-radial-produce-check-caller", "phase10-c0v-radial-evaluator"];
  }
  for (const layer of ["moving", "radial", "static"] as const) {
    if (checkId === `chk-c0v-${layer}-artifact-graph` ||
      checkId === `chk-c0v-${layer}-terminal-disposition` ||
      checkId === `chk-c0v-${layer}-verdict-rederived`) {
      return [
        `phase10-c0v-${layer}-publish-check-caller`,
        `phase10-c0v-${layer}-publication-verifier`,
      ];
    }
  }
  if ([
    "chk-c0v-all-three-terminal", "chk-c0v-any-layer-nonpass", "chk-c0v-resource-ledger",
    "chk-c0v-verdict-rederived",
  ].includes(checkId)) {
    return ["phase10-c0v-aggregate-check-caller", "phase10-c0v-aggregate-evaluator"];
  }
  fail(`packet protocol check ${checkId}`, "has no exact caller/evaluator authority");
}

export function parsePhase10C0VS6PacketProtocol(value: unknown): Phase10C0VS6PacketProtocol {
  const label = "packet protocol";
  const row = object(value, label);
  const schema = enumValue(
    row.schema,
    [
      PHASE10_C0V_S6_PACKET_PROTOCOL_SCHEMA,
      PHASE10_C0V_S6_RECOVERY_PACKET_PROTOCOL_SCHEMA,
      PHASE10_C0V_S6_RECOVERY_V2_PACKET_PROTOCOL_SCHEMA,
      PHASE10_C0V_S6_RECOVERY_V3_PACKET_PROTOCOL_SCHEMA,
      PHASE10_C0V_S6_RECOVERY_V4_PACKET_PROTOCOL_SCHEMA,
      PHASE10_C0V_S6_RECOVERY_V5_PACKET_PROTOCOL_SCHEMA,
      PHASE10_C0V_S6_RECOVERY_V6_PACKET_PROTOCOL_SCHEMA,
      PHASE10_C0V_S6_RECOVERY_V7_PACKET_PROTOCOL_SCHEMA,
      PHASE10_C0V_S6_RECOVERY_V8_PACKET_PROTOCOL_SCHEMA,
      PHASE10_C0V_S6_RECOVERY_V9_PACKET_PROTOCOL_SCHEMA,
    ] as const,
    `${label}.schema`,
  );
  const generation: Phase10C0VS6AuthorityGeneration =
    schema === PHASE10_C0V_S6_RECOVERY_V9_PACKET_PROTOCOL_SCHEMA
      ? "recovery-v9"
      : schema === PHASE10_C0V_S6_RECOVERY_V8_PACKET_PROTOCOL_SCHEMA
      ? "recovery-v8"
      : schema === PHASE10_C0V_S6_RECOVERY_V7_PACKET_PROTOCOL_SCHEMA
      ? "recovery-v7"
      : schema === PHASE10_C0V_S6_RECOVERY_V6_PACKET_PROTOCOL_SCHEMA
      ? "recovery-v6"
      : schema === PHASE10_C0V_S6_RECOVERY_V5_PACKET_PROTOCOL_SCHEMA
      ? "recovery-v5"
      : schema === PHASE10_C0V_S6_RECOVERY_V4_PACKET_PROTOCOL_SCHEMA
        ? "recovery-v4"
      : schema === PHASE10_C0V_S6_RECOVERY_V3_PACKET_PROTOCOL_SCHEMA
        ? "recovery-v3"
      : schema === PHASE10_C0V_S6_RECOVERY_V2_PACKET_PROTOCOL_SCHEMA
        ? "recovery-v2"
      : schema === PHASE10_C0V_S6_RECOVERY_PACKET_PROTOCOL_SCHEMA
        ? "recovery-v1"
        : "base";
  const recovery = generation !== "base";
  const recoveryV2 = generation === "recovery-v2";
  const recoveryV3 = generation === "recovery-v3";
  const recoveryV4 = generation === "recovery-v4";
  const recoveryV5 = generation === "recovery-v5";
  const recoveryV6 = generation === "recovery-v6";
  const recoveryV7 = generation === "recovery-v7";
  const recoveryV8 = generation === "recovery-v8";
  const recoveryV9 = generation === "recovery-v9";
  exactKeys(row, ["schema", "protocolId", "matrixId", "packetId", "registryId", "registeredAttemptId", "executionMode", "bindings", "selectedRouteId", "s5ArtifactDisposition", "registeredOutputIds", "registeredCheckIds", "registeredNegativeControlIds", "boundDependencyPacketIds", "dependencyArtifactContracts", "commandTemplates", "paths", "candidateFilenameRosters", "internalArtifactRosters", "verification", "allowedCleanTerminalClasses", "terminalSubroutes", "resources", "ancestryAuthority", "preObservationProductionClosure", "preflightObservedContract", "workerInvocationContract", "workerProgressContract", "exitStatusContract", "freezeEvaluationContract", "causeEvaluationContract", "terminalCandidateContract", "terminalReceiptContract", "executionRecordTuples", "executableInvocationRosters", "verificationInvocationRoster", "verificationRegisteredCapBindings", "resourceObservationPointRosters", "registeredCapBindings", "classificationConditions", "classificationProjectionRosters", "radialBinaryLayout", "radialProducerSummary", "controlOperators", "aggregateNegativeControlContract", "claimBoundary"], label);
  const bindings = object(row.bindings, `${label}.bindings`);
  exactKeys(bindings, [
    "matrix", "packetCatalogue", "callableRegistry", "predecessorSchemaRegistry",
    "predecessorSchemaContracts", "successorSchemaRegistry", "successorSchemaContracts",
    "scienceProtocol", "referenceOrRefusal", "originalApEvidence",
    ...(recovery ? ["recoveryAuthority"] : []),
  ], `${label}.bindings`);
  const paths = object(row.paths, `${label}.paths`);
  exactKeys(paths, ["attemptRoot", "packageLockPath", "lockPath", "preflightReceiptPath", "terminalReceiptPath", "allowedPublicationPaths", "publicationStagingPaths", "internalOnlyFilenames"], `${label}.paths`);
  const verification = object(row.verification, `${label}.verification`);
  exactKeys(
    verification,
    ["filename", "schemaId", "verificationIdRule", "executionProvenanceRule"],
    `${label}.verification`,
  );
  const commands = arrayValue(row.commandTemplates, `${label}.commandTemplates`).map((entry, index) => {
    const command = object(entry, `${label}.commandTemplates[${index}]`);
    exactKeys(command, ["commandId", "command"], `${label}.commandTemplates[${index}]`);
    return Object.freeze({ commandId: stringValue(command.commandId, `${label}.commandTemplates[${index}].commandId`), command: stringValue(command.command, `${label}.commandTemplates[${index}].command`) });
  });
  const dependencyArtifactContracts = arrayValue(row.dependencyArtifactContracts, `${label}.dependencyArtifactContracts`).map((entry, index) => {
    const contractLabel = `${label}.dependencyArtifactContracts[${index}]`;
    const contract = object(entry, contractLabel);
    exactKeys(contract, ["packetId", "artifactPath", "schemaId", "retentionClass", "applicableDispositionCodes"], contractLabel);
    const applicableDispositionCodes = arrayValue(
      contract.applicableDispositionCodes,
      `${contractLabel}.applicableDispositionCodes`,
    ).map((entry, dispositionIndex) => entry === null
      ? null
      : enumValue(entry, [
        "production-complete", "preproduction-artifact-refusal", "prelaunch-resource-refusal",
        "registered-cap-resource-refusal", "reference-discrepancy-refusal",
        "preimplementation-reference-refusal",
      ] as const, `${contractLabel}.applicableDispositionCodes[${dispositionIndex}]`));
    const dispositionSortKeys = applicableDispositionCodes.map((disposition) => disposition === null ? "" : disposition);
    if (applicableDispositionCodes.length === 0 || new Set(dispositionSortKeys).size !== dispositionSortKeys.length ||
      dispositionSortKeys.some((entry, dispositionIndex) => dispositionIndex > 0 &&
        dispositionSortKeys[dispositionIndex - 1]! >= entry)) {
      fail(`${contractLabel}.applicableDispositionCodes`, "must be nonempty unique with null first then code-point disposition order");
    }
    return Object.freeze({
      packetId: stringValue(contract.packetId, `${contractLabel}.packetId`),
      artifactPath: safePath(contract.artifactPath, `${contractLabel}.artifactPath`),
      schemaId: stringValue(contract.schemaId, `${contractLabel}.schemaId`),
      retentionClass: literal(contract.retentionClass, "tracked-evidence", `${contractLabel}.retentionClass`),
      applicableDispositionCodes: Object.freeze(applicableDispositionCodes),
    });
  });
  const terminalSubroutes = arrayValue(row.terminalSubroutes, `${label}.terminalSubroutes`).map((entry, index) =>
    parsePacketTerminalSubroute(entry, `${label}.terminalSubroutes[${index}]`));
  const tuples = arrayValue(row.executionRecordTuples, `${label}.executionRecordTuples`).map((entry, index) => parseExecutionTuple(entry, `${label}.executionRecordTuples[${index}]`));
  const invocationRosters = arrayValue(row.executableInvocationRosters, `${label}.executableInvocationRosters`).map((entry, index) => parseExecutableInvocationRoster(entry, `${label}.executableInvocationRosters[${index}]`));
  const observationRosters = arrayValue(row.resourceObservationPointRosters, `${label}.resourceObservationPointRosters`).map((entry, index) => {
    const roster = object(entry, `${label}.resourceObservationPointRosters[${index}]`);
    exactKeys(roster, ["tupleId", "observationPointIds"], `${label}.resourceObservationPointRosters[${index}]`);
    return Object.freeze({ tupleId: stringValue(roster.tupleId, `${label}.resourceObservationPointRosters[${index}].tupleId`), observationPointIds: stringArray(roster.observationPointIds, `${label}.resourceObservationPointRosters[${index}].observationPointIds`, false) });
  });
  const registeredCapBindings = arrayValue(row.registeredCapBindings, `${label}.registeredCapBindings`).map((entry, index) => {
    const bindingLabel = `${label}.registeredCapBindings[${index}]`;
    const binding = object(entry, bindingLabel);
    exactKeys(binding, ["tupleId", "invocationId", "conditionId", "observedValueSource"], bindingLabel);
    return Object.freeze({
      tupleId: stringValue(binding.tupleId, `${bindingLabel}.tupleId`),
      invocationId: stringValue(binding.invocationId, `${bindingLabel}.invocationId`),
      conditionId: stringValue(binding.conditionId, `${bindingLabel}.conditionId`),
      observedValueSource: literal(
        binding.observedValueSource,
        "capped-invocation-wall",
        `${bindingLabel}.observedValueSource`,
      ),
    });
  });
  const verificationRegisteredCapBindings = arrayValue(
    row.verificationRegisteredCapBindings,
    `${label}.verificationRegisteredCapBindings`,
  ).map((entry, index) => {
    const bindingLabel = `${label}.verificationRegisteredCapBindings[${index}]`;
    const binding = object(entry, bindingLabel);
    exactKeys(binding, ["invocationId", "conditionId", "observedValueSource"], bindingLabel);
    return Object.freeze({
      invocationId: stringValue(binding.invocationId, `${bindingLabel}.invocationId`),
      conditionId: stringValue(binding.conditionId, `${bindingLabel}.conditionId`),
      observedValueSource: literal(
        binding.observedValueSource,
        "capped-verification-invocation-wall",
        `${bindingLabel}.observedValueSource`,
      ),
    });
  });
  const conditions = arrayValue(row.classificationConditions, `${label}.classificationConditions`).map((entry, index) => {
    const condition = object(entry, `${label}.classificationConditions[${index}]`);
    exactKeys(condition, ["conditionId", "kind", "comparator", "registeredValue", "unit", "routeSelecting"], `${label}.classificationConditions[${index}]`);
    const scalar = condition.registeredValue;
    if (!(scalar === null || typeof scalar === "string" || typeof scalar === "boolean" || (typeof scalar === "number" && Number.isFinite(scalar) && !Object.is(scalar, -0)))) fail(`${label}.classificationConditions[${index}].registeredValue`, "must be scalar");
    return Object.freeze({
      conditionId: stringValue(condition.conditionId, `${label}.classificationConditions[${index}].conditionId`),
      kind: enumValue(condition.kind, [
        "artifact-identity", "artifact-filesystem-policy", "artifact-presence", "available-bytes", "retained-bytes", "scratch-bytes",
        "wall-seconds", "process-hours", "process-exit", "reference-disposition",
        "reference-check-outcome", "negative-control-outcome", "refusal-ground", "lifecycle-classification",
      ] as const, `${label}.classificationConditions[${index}].kind`),
      comparator: enumValue(condition.comparator, [
        "equal", "not-equal", "less-than", "less-than-or-equal", "greater-than",
        "greater-than-or-equal", "identity-equal", "present", "classified-as",
      ] as const, `${label}.classificationConditions[${index}].comparator`),
      registeredValue: scalar as string | boolean | number | null,
      unit: condition.unit === null ? null : enumValue(condition.unit, [
        "bytes", "seconds", "hours", "count", "artifact-identity", "disposition", "outcome",
        "reason-code", "exit-code", "classification",
      ] as const, `${label}.classificationConditions[${index}].unit`),
      routeSelecting: booleanValue(condition.routeSelecting, `${label}.classificationConditions[${index}].routeSelecting`),
    });
  });
  const classificationProjectionRosters = arrayValue(
    row.classificationProjectionRosters,
    `${label}.classificationProjectionRosters`,
  ).map((entry, rosterIndex) => {
    const rosterLabel = `${label}.classificationProjectionRosters[${rosterIndex}]`;
    const roster = object(entry, rosterLabel);
    exactKeys(roster, [
      "subrouteId", "validationId", "assemblerCallableId", "componentEvaluatorCallableIds",
      "method", "selectedConditionCardinality", "observations", "evidence", "projectionRule",
    ], rosterLabel);
    const evidence = arrayValue(roster.evidence, `${rosterLabel}.evidence`).map((evidenceEntry, evidenceIndex) => {
      const evidenceLabel = `${rosterLabel}.evidence[${evidenceIndex}]`;
      const evidenceRow = object(evidenceEntry, evidenceLabel);
      exactKeys(evidenceRow, [
        "evidenceId", "evidenceRole", "retentionClass", "artifactSource",
        "artifactRelativePath", "inlineObservationPath",
      ], evidenceLabel);
      const retentionClass = enumValue(evidenceRow.retentionClass, [
        "tracked-authority", "tracked-evidence", "embedded-preflight-observation", "embedded-attempt-record",
        "embedded-terminal-record", "ignored-staging-corroboration",
      ] as const, `${evidenceLabel}.retentionClass`);
      const artifactSource = evidenceRow.artifactSource === null ? null : enumValue(
        evidenceRow.artifactSource,
        [
          "bindings.packetProtocol", "bindings.scienceProtocol", "bindings.referenceOrRefusal",
          "retainedPreflight", "internal.exitStatus", "internal.workerInvocations",
          "internal.workerProgress",
        ] as const,
        `${evidenceLabel}.artifactSource`,
      );
      const artifactRelativePath = evidenceRow.artifactRelativePath === null ? null : safePath(
        evidenceRow.artifactRelativePath,
        `${evidenceLabel}.artifactRelativePath`,
      );
      const inlineObservationPath = evidenceRow.inlineObservationPath === null ? null : stringValue(
        evidenceRow.inlineObservationPath,
        `${evidenceLabel}.inlineObservationPath`,
      );
      if (retentionClass === "tracked-authority" &&
        !["bindings.packetProtocol", "bindings.scienceProtocol", "bindings.referenceOrRefusal"].includes(artifactSource ?? "") ||
        retentionClass === "tracked-evidence" && artifactSource !== "retainedPreflight" ||
        retentionClass.startsWith("embedded-") && (artifactSource !== null || artifactRelativePath !== null || inlineObservationPath === null) ||
        retentionClass === "ignored-staging-corroboration" &&
          (!(artifactSource?.startsWith("internal.")) || artifactRelativePath === null || inlineObservationPath !== null) ||
        !retentionClass.startsWith("embedded-") && inlineObservationPath !== null) {
        fail(evidenceLabel, "retention class differs from the exact artifact/inline source shape");
      }
      return Object.freeze({
        evidenceId: stringValue(evidenceRow.evidenceId, `${evidenceLabel}.evidenceId`),
        evidenceRole: enumValue(evidenceRow.evidenceRole, [
          "packet-protocol", "science-protocol", "reference-or-refusal", "preflight-receipt",
          "exit-record", "classification-input",
        ] as const, `${evidenceLabel}.evidenceRole`),
        retentionClass,
        artifactSource,
        artifactRelativePath,
        inlineObservationPath,
      });
    });
    if (evidence.some((evidenceEntry, evidenceIndex) => evidenceIndex > 0 &&
      evidence[evidenceIndex - 1]!.evidenceId >= evidenceEntry.evidenceId) ||
      new Set(evidence.map((evidenceEntry) => evidenceEntry.evidenceId)).size !== evidence.length) {
      fail(`${rosterLabel}.evidence`, "must be unique code-point evidenceId order");
    }
    const observations = arrayValue(roster.observations, `${rosterLabel}.observations`).map((observationEntry, observationIndex) => {
      const observationLabel = `${rosterLabel}.observations[${observationIndex}]`;
      const observation = object(observationEntry, observationLabel);
      exactKeys(observation, [
        "conditionId", "kind", "comparator", "registeredValue", "unit", "observedValueSource",
        "observedValueDerivation", "finalizedValueBinding", "conditionPassRule", "evidenceIds",
      ], observationLabel);
      const registeredValue = observation.registeredValue;
      if (!(registeredValue === null || typeof registeredValue === "string" || typeof registeredValue === "boolean" ||
        typeof registeredValue === "number" && Number.isFinite(registeredValue) && !Object.is(registeredValue, -0))) {
        fail(`${observationLabel}.registeredValue`, "must be a finite scalar");
      }
      const evidenceIds = stringArray(observation.evidenceIds, `${observationLabel}.evidenceIds`, false);
      if (evidenceIds.some((evidenceId) => !evidence.some((entry) => entry.evidenceId === evidenceId))) {
        fail(`${observationLabel}.evidenceIds`, "contains an ID outside the exact projection evidence roster");
      }
      return Object.freeze({
        conditionId: stringValue(observation.conditionId, `${observationLabel}.conditionId`),
        kind: enumValue(observation.kind, [
          "artifact-identity", "artifact-filesystem-policy", "artifact-presence", "available-bytes", "retained-bytes", "scratch-bytes",
          "wall-seconds", "process-hours", "process-exit", "reference-disposition",
          "reference-check-outcome", "negative-control-outcome", "refusal-ground", "lifecycle-classification",
        ] as const, `${observationLabel}.kind`),
        comparator: enumValue(observation.comparator, [
          "equal", "not-equal", "less-than", "less-than-or-equal", "greater-than",
          "greater-than-or-equal", "identity-equal", "present", "classified-as",
        ] as const, `${observationLabel}.comparator`),
        registeredValue: registeredValue as string | boolean | number | null,
        unit: observation.unit === null ? null : enumValue(observation.unit, [
          "bytes", "seconds", "hours", "count", "artifact-identity", "disposition", "outcome",
          "reason-code", "exit-code", "classification",
        ] as const, `${observationLabel}.unit`),
        observedValueSource: stringValue(observation.observedValueSource, `${observationLabel}.observedValueSource`),
        observedValueDerivation: enumValue(
          observation.observedValueDerivation,
          ["identity", "elapsed-nanoseconds-divided-by-1000000000"] as const,
          `${observationLabel}.observedValueDerivation`,
        ),
        finalizedValueBinding: observation.finalizedValueBinding === null ? null : stringValue(
          observation.finalizedValueBinding,
          `${observationLabel}.finalizedValueBinding`,
        ),
        conditionPassRule: enumValue(
          observation.conditionPassRule,
          ["must-pass", "exactly-one-selected-pass"] as const,
          `${observationLabel}.conditionPassRule`,
        ),
        evidenceIds,
      });
    });
    return Object.freeze({
      subrouteId: stringValue(roster.subrouteId, `${rosterLabel}.subrouteId`),
      validationId: stringValue(roster.validationId, `${rosterLabel}.validationId`),
      assemblerCallableId: stringValue(roster.assemblerCallableId, `${rosterLabel}.assemblerCallableId`),
      componentEvaluatorCallableIds: stringArray(
        roster.componentEvaluatorCallableIds,
        `${rosterLabel}.componentEvaluatorCallableIds`,
        false,
      ),
      method: enumValue(roster.method, [
        "independent-artifact-precondition-classification",
        "independent-prelaunch-resource-classification",
        "independent-registered-cap-classification",
        "independent-reference-discrepancy-classification",
        "independent-preimplementation-refusal-classification",
      ] as const, `${rosterLabel}.method`),
      selectedConditionCardinality: enumValue(
        roster.selectedConditionCardinality,
        ["all", "exactly-one"] as const,
        `${rosterLabel}.selectedConditionCardinality`,
      ),
      observations: Object.freeze(observations),
      evidence: Object.freeze(evidence),
      projectionRule: literal(
        roster.projectionRule,
        "cause-evaluation-attempt-classification-and-final-rerun-exactly-equal",
        `${rosterLabel}.projectionRule`,
      ),
    });
  });
  const radialLayout = row.radialBinaryLayout === null ? null : parseRadialLayout(row.radialBinaryLayout, `${label}.radialBinaryLayout`);
  const summary = row.radialProducerSummary === null ? null : parseRadialProducerSummary(row.radialProducerSummary, `${label}.radialProducerSummary`);
  const controls = parseControlOperators(row.controlOperators, `${label}.controlOperators`);
  const aggregateNegativeControlContract = parseAggregateNegativeControlContract(
    row.aggregateNegativeControlContract,
    `${label}.aggregateNegativeControlContract`,
  );
  const claim = object(row.claimBoundary, `${label}.claimBoundary`);
  exactKeys(claim, ["allowed", "forbidden"], `${label}.claimBoundary`);
  const originalApEvidence = arrayValue(bindings.originalApEvidence, `${label}.bindings.originalApEvidence`).map((entry, index) => parsePhase10C0VS6ArtifactIdentity(entry, `${label}.bindings.originalApEvidence[${index}]`));
  const parsedBindings = Object.freeze({
    matrix: parsePhase10C0VS6ArtifactIdentity(bindings.matrix, `${label}.bindings.matrix`),
    packetCatalogue: parsePhase10C0VS6ArtifactIdentity(bindings.packetCatalogue, `${label}.bindings.packetCatalogue`),
    callableRegistry: parsePhase10C0VS6ArtifactIdentity(bindings.callableRegistry, `${label}.bindings.callableRegistry`),
    predecessorSchemaRegistry: parsePhase10C0VS6ArtifactIdentity(bindings.predecessorSchemaRegistry, `${label}.bindings.predecessorSchemaRegistry`),
    predecessorSchemaContracts: parsePhase10C0VS6ArtifactIdentity(bindings.predecessorSchemaContracts, `${label}.bindings.predecessorSchemaContracts`),
    successorSchemaRegistry: parsePhase10C0VS6ArtifactIdentity(bindings.successorSchemaRegistry, `${label}.bindings.successorSchemaRegistry`),
    successorSchemaContracts: parsePhase10C0VS6ArtifactIdentity(bindings.successorSchemaContracts, `${label}.bindings.successorSchemaContracts`),
    scienceProtocol: nullableIdentity(bindings.scienceProtocol, `${label}.bindings.scienceProtocol`),
    referenceOrRefusal: nullableIdentity(bindings.referenceOrRefusal, `${label}.bindings.referenceOrRefusal`),
    originalApEvidence: Object.freeze(originalApEvidence),
    ...(recovery ? {
      recoveryAuthority: parsePhase10C0VS6ArtifactIdentity(
        bindings.recoveryAuthority,
        `${label}.bindings.recoveryAuthority`,
      ),
    } : {}),
  });
  const rosters = object(row.candidateFilenameRosters, `${label}.candidateFilenameRosters`);
  const candidateFilenameRosters = Object.freeze(Object.fromEntries(Object.entries(rosters).map(([key, raw]) => {
    const filenames = arrayValue(raw, `${label}.candidateFilenameRosters.${key}`).map((entry, index) =>
      safeFilename(entry, `${label}.candidateFilenameRosters.${key}[${index}]`));
    if (new Set(filenames).size !== filenames.length || filenames.some((entry, index) => index > 0 && filenames[index - 1]! >= entry)) {
      fail(`${label}.candidateFilenameRosters.${key}`, "must be unique code-point filename order");
    }
    return [key, Object.freeze(filenames)];
  })));
  const internalArtifactRosters = Object.freeze(arrayValue(
    row.internalArtifactRosters,
    `${label}.internalArtifactRosters`,
  ).map((entry, index) => {
    const rosterLabel = `${label}.internalArtifactRosters[${index}]`;
    const roster = object(entry, rosterLabel);
    exactKeys(roster, ["rosterId", "relativePaths"], rosterLabel);
    const relativePaths = arrayValue(roster.relativePaths, `${rosterLabel}.relativePaths`).map(
      (relativePath, pathIndex) => safePath(relativePath, `${rosterLabel}.relativePaths[${pathIndex}]`),
    );
    if (new Set(relativePaths).size !== relativePaths.length ||
      relativePaths.some((relativePath, pathIndex) => pathIndex > 0 && relativePaths[pathIndex - 1]! >= relativePath)) {
      fail(`${rosterLabel}.relativePaths`, "must be unique code-point path order");
    }
    return Object.freeze({
      rosterId: stringValue(roster.rosterId, `${rosterLabel}.rosterId`),
      relativePaths: Object.freeze(relativePaths),
    });
  }));
  uniqueBy(internalArtifactRosters, (entry) => entry.rosterId, `${label}.internalArtifactRosters`);
  const selectedRouteId = row.selectedRouteId === null ? null : stringValue(row.selectedRouteId, `${label}.selectedRouteId`);
  const disposition = row.s5ArtifactDisposition === null ? null : enumValue(row.s5ArtifactDisposition, ["reference-frozen", "reference-discrepancy-refusal", "reference-refusal"] as const, `${label}.s5ArtifactDisposition`);
  const packetId = parsePacketId(row.packetId, `${label}.packetId`);
  if ((packetId === "c0v-aggregate") !== (aggregateNegativeControlContract !== null)) {
    fail(`${label}.aggregateNegativeControlContract`, "must be non-null exactly on c0v-aggregate");
  }
  const registeredOutputIds = stringArray(row.registeredOutputIds, `${label}.registeredOutputIds`);
  const registeredCheckIds = stringArray(row.registeredCheckIds, `${label}.registeredCheckIds`);
  const registeredNegativeControlIds = stringArray(row.registeredNegativeControlIds, `${label}.registeredNegativeControlIds`);
  const verificationInvocationRoster = parsePacketVerificationInvocationRoster(
    row.verificationInvocationRoster,
    packetId,
    `${label}.verificationInvocationRoster`,
  );
  const protocolId = stringValue(row.protocolId, `${label}.protocolId`);
  const registryId = stringValue(row.registryId, `${label}.registryId`);
  const registeredAttemptId = parsePhase10C0VS6AttemptId(row.registeredAttemptId, `${label}.registeredAttemptId`);
  const expectedProtocolId = recoveryV9
    ? `phase10-${packetId}-execution-v2-recovery-v9`
    : recoveryV8
    ? `phase10-${packetId}-execution-v2-recovery-v8`
    : recoveryV7
    ? `phase10-${packetId}-execution-v2-recovery-v7`
    : recoveryV6
    ? `phase10-${packetId}-execution-v2-recovery-v6`
    : recoveryV5
    ? `phase10-${packetId}-execution-v2-recovery-v5`
    : recoveryV4
      ? `phase10-${packetId}-execution-v2-recovery-v4`
    : recoveryV3
      ? `phase10-${packetId}-execution-v2-recovery-v3`
    : recoveryV2
      ? `phase10-${packetId}-execution-v2-recovery-v2`
    : recovery
      ? `phase10-${packetId}-execution-v2-recovery-v1`
      : `phase10-${packetId}-execution-v2-v1`;
  const expectedRegistryId = recoveryV9
    ? `phase10-${packetId}-execution-v2-recovery-v9-callables-v1`
    : recoveryV8
    ? `phase10-${packetId}-execution-v2-recovery-v8-callables-v1`
    : recoveryV7
    ? `phase10-${packetId}-execution-v2-recovery-v7-callables-v1`
    : recoveryV6
    ? `phase10-${packetId}-execution-v2-recovery-v6-callables-v1`
    : recoveryV5
    ? `phase10-${packetId}-execution-v2-recovery-v5-callables-v1`
    : recoveryV4
      ? `phase10-${packetId}-execution-v2-recovery-v4-callables-v1`
    : recoveryV3
      ? `phase10-${packetId}-execution-v2-recovery-v3-callables-v1`
    : recoveryV2
      ? `phase10-${packetId}-execution-v2-recovery-v2-callables-v1`
    : recovery
      ? `phase10-${packetId}-execution-v2-recovery-v1-callables-v1`
      : `phase10-${packetId}-execution-v2-callables-v1`;
  const expectedAttemptId = recoveryV9
    ? PHASE10_C0V_S6_RECOVERY_V9_ATTEMPT_IDS[packetId]
    : recoveryV8
    ? PHASE10_C0V_S6_RECOVERY_V8_ATTEMPT_IDS[packetId]
    : recoveryV7
    ? PHASE10_C0V_S6_RECOVERY_V7_ATTEMPT_IDS[packetId]
    : recoveryV6
    ? PHASE10_C0V_S6_RECOVERY_V6_ATTEMPT_IDS[packetId]
    : recoveryV5
    ? PHASE10_C0V_S6_RECOVERY_V5_ATTEMPT_IDS[packetId]
    : recoveryV4
      ? PHASE10_C0V_S6_RECOVERY_V4_ATTEMPT_IDS[packetId]
    : recoveryV3
      ? PHASE10_C0V_S6_RECOVERY_V3_ATTEMPT_IDS[packetId]
    : recoveryV2
      ? PHASE10_C0V_S6_RECOVERY_V2_ATTEMPT_IDS[packetId]
    : recovery
      ? PHASE10_C0V_S6_RECOVERY_ATTEMPT_IDS[packetId]
      : `${packetId}-20260822-v1`;
  if (protocolId !== expectedProtocolId || registryId !== expectedRegistryId ||
    registeredAttemptId !== expectedAttemptId) {
    fail(label, "protocolId, registryId, or registeredAttemptId differs from exact packet identity");
  }
  const protocolRoot = recoveryV9
    ? `${PHASE10_C0V_S6_RECOVERY_V9_AUTHORITY_ROOT}/packets`
    : recoveryV8
    ? `${PHASE10_C0V_S6_RECOVERY_V8_AUTHORITY_ROOT}/packets`
    : recoveryV7
    ? `${PHASE10_C0V_S6_RECOVERY_V7_AUTHORITY_ROOT}/packets`
    : recoveryV6
    ? `${PHASE10_C0V_S6_RECOVERY_V6_AUTHORITY_ROOT}/packets`
    : recoveryV5
    ? `${PHASE10_C0V_S6_RECOVERY_V5_AUTHORITY_ROOT}/packets`
    : recoveryV4
      ? `${PHASE10_C0V_S6_RECOVERY_V4_AUTHORITY_ROOT}/packets`
    : recoveryV3
      ? `${PHASE10_C0V_S6_RECOVERY_V3_AUTHORITY_ROOT}/packets`
    : recoveryV2
      ? `${PHASE10_C0V_S6_RECOVERY_V2_AUTHORITY_ROOT}/packets`
    : recovery
      ? `${PHASE10_C0V_S6_RECOVERY_AUTHORITY_ROOT}/packets`
      : "research/phase10-execution-v2/packets";
  const commandBase = `--packet ${packetId} --protocol ${protocolRoot}/${packetId}/protocol.json --attempt ${registeredAttemptId}`;
  const expectedCheckCommand = `node runner/src/phase10-c0v-s6-executor.ts check ${commandBase}`;
  const expectedRunCommand = `node runner/src/phase10-c0v-s6-executor.ts run ${commandBase}`;
  if (commands.length !== 2 || commands[0]?.commandId !== "check" || commands[0].command !== expectedCheckCommand ||
    commands[1]?.commandId !== "run" || commands[1].command !== expectedRunCommand) {
    fail(`${label}.commandTemplates`, "must contain exact check then run commands");
  }
  const expectedAttemptRoot = recoveryV9
    ? `${PHASE10_C0V_S6_RECOVERY_V9_ATTEMPT_ROOT}/${packetId}`
    : recoveryV8
    ? `${PHASE10_C0V_S6_RECOVERY_V8_ATTEMPT_ROOT}/${packetId}`
    : recoveryV7
    ? `${PHASE10_C0V_S6_RECOVERY_V7_ATTEMPT_ROOT}/${packetId}`
    : recoveryV6
    ? `${PHASE10_C0V_S6_RECOVERY_V6_ATTEMPT_ROOT}/${packetId}`
    : recoveryV5
    ? `${PHASE10_C0V_S6_RECOVERY_V5_ATTEMPT_ROOT}/${packetId}`
    : recoveryV4
      ? `${PHASE10_C0V_S6_RECOVERY_V4_ATTEMPT_ROOT}/${packetId}`
    : recoveryV3
      ? `${PHASE10_C0V_S6_RECOVERY_V3_ATTEMPT_ROOT}/${packetId}`
    : recoveryV2
      ? `${PHASE10_C0V_S6_RECOVERY_V2_ATTEMPT_ROOT}/${packetId}`
    : recovery
      ? `${PHASE10_C0V_S6_RECOVERY_ATTEMPT_ROOT}/${packetId}`
      : `out/phase10-execution-v2/attempts/${packetId}`;
  const expectedPackageLockPath = recoveryV9
    ? PHASE10_C0V_S6_RECOVERY_V9_PACKAGE_LOCK_PATH
    : recoveryV8
    ? PHASE10_C0V_S6_RECOVERY_V8_PACKAGE_LOCK_PATH
    : recoveryV7
    ? PHASE10_C0V_S6_RECOVERY_V7_PACKAGE_LOCK_PATH
    : recoveryV6
    ? PHASE10_C0V_S6_RECOVERY_V6_PACKAGE_LOCK_PATH
    : recoveryV5
    ? PHASE10_C0V_S6_RECOVERY_V5_PACKAGE_LOCK_PATH
    : recoveryV4
      ? PHASE10_C0V_S6_RECOVERY_V4_PACKAGE_LOCK_PATH
    : recoveryV3
      ? PHASE10_C0V_S6_RECOVERY_V3_PACKAGE_LOCK_PATH
    : recoveryV2
      ? PHASE10_C0V_S6_RECOVERY_V2_PACKAGE_LOCK_PATH
    : recovery
      ? PHASE10_C0V_S6_RECOVERY_PACKAGE_LOCK_PATH
      : PHASE10_C0V_S6_PACKAGE_LOCK_PATH;
  const expectedLockPath = recoveryV9
    ? PHASE10_C0V_S6_RECOVERY_V9_PACKET_LOCK_PATHS[packetId]
    : recoveryV8
    ? PHASE10_C0V_S6_RECOVERY_V8_PACKET_LOCK_PATHS[packetId]
    : recoveryV7
    ? PHASE10_C0V_S6_RECOVERY_V7_PACKET_LOCK_PATHS[packetId]
    : recoveryV6
    ? PHASE10_C0V_S6_RECOVERY_V6_PACKET_LOCK_PATHS[packetId]
    : recoveryV5
    ? PHASE10_C0V_S6_RECOVERY_V5_PACKET_LOCK_PATHS[packetId]
    : recoveryV4
      ? PHASE10_C0V_S6_RECOVERY_V4_PACKET_LOCK_PATHS[packetId]
    : recoveryV3
      ? PHASE10_C0V_S6_RECOVERY_V3_PACKET_LOCK_PATHS[packetId]
    : recoveryV2
      ? PHASE10_C0V_S6_RECOVERY_V2_PACKET_LOCK_PATHS[packetId]
    : recovery
      ? PHASE10_C0V_S6_RECOVERY_PACKET_LOCK_PATHS[packetId]
      : `out/phase10-execution-v2/locks/${packetId}.lock`;
  const structuralEvidenceRoot = recoveryV9 && packetId === "c0v-moving-produce"
    ? "evidence/phase10-obligation-preflight-v3"
    : recoveryV9 && packetId === "a-p-c0v-s6"
    ? "evidence/phase10-obligation-preflight-v6"
    : recoveryV8 && packetId === "a-p-c0v-s6"
    ? "evidence/phase10-obligation-preflight-v6"
    : recoveryV7 && packetId === "a-p-c0v-s6"
    ? "evidence/phase10-obligation-preflight-v6"
    : recoveryV6 && packetId === "a-p-c0v-s6"
    ? "evidence/phase10-obligation-preflight-v6"
    : recoveryV5 && packetId === "a-p-c0v-s6"
    ? "evidence/phase10-obligation-preflight-v6"
    : recoveryV4 && packetId === "a-p-c0v-s6"
      ? "evidence/phase10-obligation-preflight-v5"
    : recoveryV3 && packetId === "a-p-c0v-s6"
      ? "evidence/phase10-obligation-preflight-v4"
    : recoveryV2 && packetId === "a-p-c0v-s6"
      ? "evidence/phase10-obligation-preflight-v3"
    : "evidence/phase10-obligation-preflight-v2";
  const expectedPreflightPath = `${structuralEvidenceRoot}/packets/${packetId}/preflight.json`;
  const expectedTerminalPath = `${structuralEvidenceRoot}/packets/${packetId}/terminal-receipt.json`;
  if (paths.attemptRoot !== expectedAttemptRoot ||
    paths.packageLockPath !== expectedPackageLockPath ||
    paths.lockPath !== expectedLockPath ||
    paths.preflightReceiptPath !== expectedPreflightPath || paths.terminalReceiptPath !== expectedTerminalPath) {
    fail(`${label}.paths`, "attempt, lock, or receipt path differs from exact execution-v2 mapping");
  }
  const expectedBindingPaths = {
    matrix: "research/phase10-c0v-s6-obligation-matrix-v1.json",
    packetCatalogue: recoveryV9
      ? PHASE10_C0V_S6_RECOVERY_V9_PACKET_CATALOGUE_PATH
      : recoveryV8
      ? PHASE10_C0V_S6_RECOVERY_V8_PACKET_CATALOGUE_PATH
      : recoveryV7
      ? PHASE10_C0V_S6_RECOVERY_V7_PACKET_CATALOGUE_PATH
      : recoveryV6
      ? PHASE10_C0V_S6_RECOVERY_V6_PACKET_CATALOGUE_PATH
      : recoveryV5
      ? PHASE10_C0V_S6_RECOVERY_V5_PACKET_CATALOGUE_PATH
      : recoveryV4
        ? PHASE10_C0V_S6_RECOVERY_V4_PACKET_CATALOGUE_PATH
      : recoveryV3
        ? PHASE10_C0V_S6_RECOVERY_V3_PACKET_CATALOGUE_PATH
      : recoveryV2
        ? PHASE10_C0V_S6_RECOVERY_V2_PACKET_CATALOGUE_PATH
      : recovery
        ? PHASE10_C0V_S6_RECOVERY_PACKET_CATALOGUE_PATH
        : "research/phase10-execution-v2/packet-catalogue.json",
    callableRegistry: `${protocolRoot}/${packetId}/callable-registry.json`,
    predecessorSchemaRegistry: "research/phase10-c0v-artifact-schema-registry-v1.json",
    predecessorSchemaContracts: "research/phase10-c0v-schema-contracts-v1.json",
    successorSchemaRegistry: "research/phase10-c0v-s6-artifact-schema-registry-v1.json",
    successorSchemaContracts: "research/phase10-c0v-s6-schema-contracts-v1.json",
  } as const;
  for (const [key, expectedPath] of Object.entries(expectedBindingPaths)) {
    if (parsedBindings[key as keyof typeof expectedBindingPaths].path !== expectedPath) {
      fail(`${label}.bindings.${key}`, "path differs from exact authority surface");
    }
  }
  const expectedRecoveryAuthorityPath = recoveryV9
    ? PHASE10_C0V_S6_RECOVERY_V9_AUTHORITY_PATH
    : recoveryV8
    ? PHASE10_C0V_S6_RECOVERY_V8_AUTHORITY_PATH
    : recoveryV7
    ? PHASE10_C0V_S6_RECOVERY_V7_AUTHORITY_PATH
    : recoveryV6
    ? PHASE10_C0V_S6_RECOVERY_V6_AUTHORITY_PATH
    : recoveryV5
    ? PHASE10_C0V_S6_RECOVERY_V5_AUTHORITY_PATH
    : recoveryV4
      ? PHASE10_C0V_S6_RECOVERY_V4_AUTHORITY_PATH
    : recoveryV3
      ? PHASE10_C0V_S6_RECOVERY_V3_AUTHORITY_PATH
    : recoveryV2
      ? PHASE10_C0V_S6_RECOVERY_V2_AUTHORITY_PATH
    : PHASE10_C0V_S6_RECOVERY_AUTHORITY_PATH;
  if (recovery && parsedBindings.recoveryAuthority?.path !== expectedRecoveryAuthorityPath) {
    fail(`${label}.bindings.recoveryAuthority`, "path differs from exact recovery authority");
  }
  const layerBindingPaths: Partial<Record<Phase10C0VS6PacketId, readonly [string, string]>> = {
    "c0v-moving-produce": ["research/phase10-c0v-moving-protocol-v1.json", "evidence/phase10-numerical-verification-v1/c0v-moving-reference.json"],
    "c0v-moving-publish": ["research/phase10-c0v-moving-protocol-v1.json", "evidence/phase10-numerical-verification-v1/c0v-moving-reference.json"],
    "c0v-radial-produce": ["research/phase10-c0v-radial-protocol-v1.json", "evidence/phase10-numerical-verification-v1/c0v-radial-reference.json"],
    "c0v-radial-publish": ["research/phase10-c0v-radial-protocol-v1.json", "evidence/phase10-numerical-verification-v1/c0v-radial-reference.json"],
    "c0v-static-produce": ["research/phase10-c0v-static-protocol-v1.json", "evidence/phase10-numerical-verification-v1/c0v-static-reference-refusal.json"],
    "c0v-static-publish": ["research/phase10-c0v-static-protocol-v1.json", "evidence/phase10-numerical-verification-v1/c0v-static-reference-refusal.json"],
  };
  const expectedLayerBindings = layerBindingPaths[packetId];
  if (expectedLayerBindings === undefined) {
    if (parsedBindings.scienceProtocol !== null || parsedBindings.referenceOrRefusal !== null) fail(`${label}.bindings`, "non-layer packet cannot bind layer artifacts");
  } else if (parsedBindings.scienceProtocol?.path !== expectedLayerBindings[0] ||
    parsedBindings.referenceOrRefusal?.path !== expectedLayerBindings[1]) {
    fail(`${label}.bindings`, "layer science/reference paths differ");
  }
  const expectedOriginalApPaths = [
    "evidence/phase10-obligation-preflight-v1/artifact-index.json",
    "evidence/phase10-obligation-preflight-v1/missing-producer.json",
    "evidence/phase10-obligation-preflight-v1/packets/a-p/preflight.json",
    "evidence/phase10-obligation-preflight-v1/packets/a-p/terminal-receipt.json",
    "evidence/phase10-obligation-preflight-v1/uncalled-check.json",
    "evidence/phase10-obligation-preflight-v1/verification.json",
  ];
  if (parsedBindings.originalApEvidence.length !== expectedOriginalApPaths.length ||
    parsedBindings.originalApEvidence.some((entry, index) => entry.path !== expectedOriginalApPaths[index])) {
    fail(`${label}.bindings.originalApEvidence`, "differs from exact original A-P evidence roster");
  }
  const workerProgressContract = row.workerProgressContract === null
    ? null
    : parseWorkerProgressContract(row.workerProgressContract, `${label}.workerProgressContract`);
  const workerInvocationContract = parseWorkerInvocationContract(
    row.workerInvocationContract,
    `${label}.workerInvocationContract`,
  );
  const exitStatusContract = parseExitStatusContract(row.exitStatusContract, `${label}.exitStatusContract`);
  const freezeEvaluationContract = parseFreezeEvaluationContract(
    row.freezeEvaluationContract,
    `${label}.freezeEvaluationContract`,
  );
  const causeEvaluationContract = parseCauseEvaluationContract(
    row.causeEvaluationContract,
    `${label}.causeEvaluationContract`,
  );
  const terminalCandidateContract = parseTerminalCandidateContract(
    row.terminalCandidateContract,
    `${label}.terminalCandidateContract`,
  );
  const terminalReceiptContract = parseTerminalReceiptContract(
    row.terminalReceiptContract,
    `${label}.terminalReceiptContract`,
  );
  const expectedVerificationFilename: Record<Phase10C0VS6PacketId, string> = {
    "a-p-c0v-s6": "verification.json",
    "c0v-moving-produce": "verification.json",
    "c0v-moving-publish": "c0v-moving-publish-verification.json",
    "c0v-radial-produce": "verification.json",
    "c0v-radial-publish": "c0v-radial-publish-verification.json",
    "c0v-static-produce": "verification.json",
    "c0v-static-publish": "c0v-static-publish-verification.json",
    "c0v-aggregate": "c0v-aggregate-verification.json",
  };
  const verificationFilename = safeFilename(verification.filename, `${label}.verification.filename`);
  if (verificationFilename !== expectedVerificationFilename[packetId] || verification.schemaId !== "phase10-packet-verification-v2") {
    fail(`${label}.verification`, "differs from exact packet verification contract");
  }
  const boundDependencyPacketIds = stringArray(row.boundDependencyPacketIds, `${label}.boundDependencyPacketIds`);
  if (dependencyArtifactContracts.some((entry, index) =>
    !boundDependencyPacketIds.includes(entry.packetId) ||
    (index > 0 && `${dependencyArtifactContracts[index - 1]!.packetId}\u0000${dependencyArtifactContracts[index - 1]!.artifactPath}` >= `${entry.packetId}\u0000${entry.artifactPath}`)) ||
    boundDependencyPacketIds.some((dependencyId) => !dependencyArtifactContracts.some((entry) => entry.packetId === dependencyId))) {
    fail(`${label}.dependencyArtifactContracts`, "must be unique packet/path order with at least one artifact per dependency");
  }
  if ((packetId === "c0v-radial-produce") !== (radialLayout !== null && summary !== null)) fail(label, "radial layout/summary must exist exactly on radial produce");
  if ((packetId === "c0v-radial-produce") !== (controls.length === 3)) fail(label, "radial controls must exist exactly on radial produce");
  if ((packetId === "c0v-radial-produce") !== (workerProgressContract !== null)) fail(label, "worker progress contract must exist exactly on radial produce");
  uniqueBy(tuples, (entry) => entry.tupleId, `${label}.executionRecordTuples`);
  uniqueBy(invocationRosters, (entry) => entry.tupleId, `${label}.executableInvocationRosters`);
  uniqueBy(observationRosters, (entry) => entry.tupleId, `${label}.resourceObservationPointRosters`);
  uniqueBy(registeredCapBindings, (entry) => entry.tupleId, `${label}.registeredCapBindings`);
  if (tuples.length !== invocationRosters.length || tuples.length !== observationRosters.length ||
    tuples.some((entry, index) => entry.tupleId !== invocationRosters[index]?.tupleId || entry.tupleId !== observationRosters[index]?.tupleId)) {
    fail(label, "execution tuple, invocation-roster, and observation-roster IDs/order differ");
  }
  if (observationRosters.some((entry) => entry.observationPointIds.length !== 1 ||
    entry.observationPointIds[0] !== `obs-${packetId.includes("moving") ? "moving" : packetId.includes("radial") ? "radial" : "static"}-terminal-retention`)) {
    fail(`${label}.resourceObservationPointRosters`, "must contain the sole honest append-only terminal-retention census point");
  }
  if (tuples.some((entry, index) =>
    (entry.governedInvocationElapsedNanosecondsRule === "exact-zero") !==
      (invocationRosters[index]!.invocations.length === 0))) {
    fail(label, "governed invocation wall rule must be exact-zero exactly for an empty worker roster");
  }
  const capTuples = tuples.filter((entry) => entry.dispositionCode === "registered-cap-resource-refusal");
  const expectedCapTupleCount = packetId === "c0v-radial-produce"
    ? 5
    : packetId === "c0v-moving-produce" || packetId === "c0v-static-produce" ? 1 : 0;
  if (capTuples.length !== expectedCapTupleCount ||
    (expectedCapTupleCount === 0 && registeredCapBindings.length !== 0) ||
    registeredCapBindings.length !== capTuples.length ||
    registeredCapBindings.some((binding, index) => {
      const tuple = capTuples[index];
      const roster = invocationRosters.find((candidate) => candidate.tupleId === binding.tupleId);
      const capped = roster?.invocations.filter((invocation) => invocation.terminalState === "registered-cap") ?? [];
      const condition = conditions.find((candidate) => candidate.conditionId === binding.conditionId);
      return tuple === undefined || binding.tupleId !== tuple.tupleId ||
        roster?.completionRule !== "registered-cap-prefix" || capped.length !== 1 ||
        capped[0]!.invocationId !== binding.invocationId || condition === undefined ||
        condition.kind !== "wall-seconds" || condition.comparator !== "greater-than" ||
        condition.unit !== "seconds" || condition.registeredValue !== capped[0]!.registeredWallSecondsMaximum ||
        condition.routeSelecting !== true;
    })) {
    fail(`${label}.registeredCapBindings`, "must exactly bind each packet cap tuple, invocation, and strictly-greater route-selecting wall condition");
  }
  if (verificationRegisteredCapBindings.length !== verificationInvocationRoster.length ||
    verificationRegisteredCapBindings.some((binding, index) => {
      const invocation = verificationInvocationRoster[index];
      const condition = conditions.find((candidate) => candidate.conditionId === binding.conditionId);
      return invocation === undefined || binding.invocationId !== invocation.invocationId ||
        binding.conditionId !== `cond-cap-${invocation.invocationId.slice(4)}` ||
        condition === undefined || condition.kind !== "wall-seconds" ||
        condition.comparator !== "greater-than" || condition.registeredValue !== 14400 ||
        condition.unit !== "seconds" || condition.routeSelecting !== true;
    })) {
    fail(`${label}.verificationRegisteredCapBindings`, "must exactly bind every nonproduce governed leaf to a strictly-greater four-hour cap condition");
  }
  const candidateRosterKeys = Object.keys(candidateFilenameRosters);
  const expectedCandidateRosterKeys = packetId.endsWith("-produce")
    ? tuples.map((entry) => entry.tupleId)
    : terminalSubroutes.map((entry) => entry.subrouteId);
  if (candidateRosterKeys.length !== expectedCandidateRosterKeys.length ||
    candidateRosterKeys.some((entry, index) => entry !== expectedCandidateRosterKeys[index])) {
    fail(`${label}.candidateFilenameRosters`, "keys/order must equal execution tuple order or the single complete roster");
  }
  const expectedInternalRosterIds = packetId.endsWith("-produce")
    ? tuples.map((entry) => entry.tupleId)
    : terminalSubroutes.map((entry) => entry.subrouteId);
  if (internalArtifactRosters.length !== expectedInternalRosterIds.length ||
    internalArtifactRosters.some((entry, index) => entry.rosterId !== expectedInternalRosterIds[index])) {
    fail(`${label}.internalArtifactRosters`, "must cover the exact tuple/subroute roster once in protocol order");
  }
  const publicationCandidateByPacket: Record<Exclude<Phase10C0VS6PacketId, "c0v-radial-produce">, readonly string[]> = {
    "a-p-c0v-s6": ["artifact-index.json", "missing-producer.json", "uncalled-check.json"],
    "c0v-moving-produce": ["c0v-moving-attempts.jsonl"],
    "c0v-moving-publish": ["c0v-moving-artifact-index.json", "c0v-moving-result.json"],
    "c0v-radial-publish": ["c0v-radial-artifact-index.json", "c0v-radial-result.json"],
    "c0v-static-produce": ["c0v-static-attempts.jsonl"],
    "c0v-static-publish": ["c0v-static-artifact-index.json", "c0v-static-result.json"],
    "c0v-aggregate": ["c0v-aggregate.json", "c0v-artifact-index.json", "c0v-resource-ledger.json", "c0v-terminal-table.json"],
  };
  for (const key of candidateRosterKeys) {
    const tuple = tuples.find((entry) => entry.tupleId === key);
    const terminalSubroute = terminalSubroutes.find((entry) => entry.subrouteId === key);
    const expected = packetId === "c0v-radial-produce"
      ? tuple?.dispositionCode === "production-complete"
        ? ["c0v-radial-attempts.jsonl", "c0v-radial-evaluation.json", "c0v-radial-witness.bin"]
        : ["c0v-radial-attempts.jsonl"]
      : packetId.endsWith("-produce") || terminalSubroute?.dispositionCode === null
        ? publicationCandidateByPacket[packetId]
        : [];
    const actual = candidateFilenameRosters[key]!;
    if (actual.length !== expected.length || actual.some((entry, index) => entry !== expected[index])) {
      fail(`${label}.candidateFilenameRosters.${key}`, "differs from exact publication-candidate roster");
    }
  }
  for (const roster of invocationRosters) {
    if (roster.completionRule === "complete-roster") continue;
    const full = invocationRosters.find((candidate) => candidate.tupleId === roster.prefixOfTupleId);
    if (full === undefined || full.completionRule !== "complete-roster" || roster.invocations.length > full.invocations.length ||
      roster.invocations.some((entry, index) => {
        const expected = full.invocations[index];
        return expected === undefined || entry.invocationId !== expected.invocationId || entry.callableId !== expected.callableId ||
          entry.negativeControlId !== expected.negativeControlId || entry.invocationClass !== expected.invocationClass ||
          entry.registeredWallSecondsMaximum !== expected.registeredWallSecondsMaximum ||
          (index < roster.invocations.length - 1 && entry.terminalState !== expected.terminalState) ||
          (index === roster.invocations.length - 1 && entry.terminalState !== "registered-cap");
      })) fail(`${label}.executableInvocationRosters`, `${roster.tupleId} is not an exact registered-cap prefix`);
  }
  const resources = parseResources(row.resources, `${label}.resources`, generation);
  const fullAttemptRosterRegisteredSeconds = invocationRosters
    .filter((entry) => entry.completionRule === "complete-roster")
    .reduce((maximum, entry) => Math.max(
      maximum,
      entry.invocations.reduce((sum, invocation) => sum + invocation.registeredWallSecondsMaximum, 0),
    ), 0);
  const verificationRosterRegisteredSeconds = verificationInvocationRoster.reduce(
    (sum, invocation) => sum + invocation.registeredWallSecondsMaximum,
    0,
  );
  const expectedRegisteredProcessHoursMaximum = (
    packetId.endsWith("-produce") ? fullAttemptRosterRegisteredSeconds : verificationRosterRegisteredSeconds
  ) / 3600;
  const expectedRegisteredElapsedNanosecondsMaximum = (
    packetId.endsWith("-produce") ? fullAttemptRosterRegisteredSeconds : verificationRosterRegisteredSeconds
  ) * 1_000_000_000;
  if (resources.currentPacketRegisteredElapsedNanosecondsMaximum !== expectedRegisteredElapsedNanosecondsMaximum) {
    fail(`${label}.resources.currentPacketRegisteredElapsedNanosecondsMaximum`, "differs from the exact full governed-leaf roster cap sum");
  }
  if (resources.currentPacketRegisteredProcessHoursMaximum !== expectedRegisteredProcessHoursMaximum) {
    fail(`${label}.resources.currentPacketRegisteredProcessHoursMaximum`, "differs from the exact full governed-leaf roster cap sum");
  }
  const ancestryAuthority = parseAncestryAuthority(row.ancestryAuthority, `${label}.ancestryAuthority`, generation);
  const preObservationProductionClosure = row.preObservationProductionClosure === null
    ? null
    : (() => {
      const closureLabel = `${label}.preObservationProductionClosure`;
      const closure = object(row.preObservationProductionClosure, closureLabel);
      exactKeys(closure, ["schema", "commit", "artifacts", "membershipRule", "comparisonRule"], closureLabel);
      const artifacts = parseIdentityRoster(closure.artifacts, `${closureLabel}.artifacts`);
      if (artifacts.length !== PHASE10_C0V_S6_PREOBSERVATION_PRODUCTION_CLOSURE.length ||
        artifacts.some((entry, index) => !sameArtifactIdentity(
          entry,
          PHASE10_C0V_S6_PREOBSERVATION_PRODUCTION_CLOSURE[index]!,
        ))) {
        fail(`${closureLabel}.artifacts`, "differs from the exact cf0 producer/import-resolution closure");
      }
      return Object.freeze({
        schema: literal(
          closure.schema,
          "phase10-c0v-s6-preobservation-production-closure-v1",
          `${closureLabel}.schema`,
        ),
        commit: literal(
          closure.commit,
          "cf0bd8b6ad12c79e38cb30ca0e50bcadab9cc6d9",
          `${closureLabel}.commit`,
        ),
        artifacts,
        membershipRule: literal(
          closure.membershipRule,
          "producer-import-closure-and-resolution-artifacts-existing-at-s5-science-freeze",
          `${closureLabel}.membershipRule`,
        ),
        comparisonRule: literal(
          closure.comparisonRule,
          "live-and-implementation-blobs-equal-cf0-raw-bytes",
          `${closureLabel}.comparisonRule`,
        ),
      });
    })();
  if ((packetId === "c0v-radial-produce") !== (preObservationProductionClosure !== null)) {
    fail(`${label}.preObservationProductionClosure`, "must exist exactly on radial produce");
  }
  const preflightObservedContract = parsePreflightObservedContract(
    row.preflightObservedContract,
    `${label}.preflightObservedContract`,
    recoveryV9
      ? PHASE10_C0V_S6_RECOVERY_V9_PACKET_CATALOGUE_PATH
      : recoveryV8
      ? PHASE10_C0V_S6_RECOVERY_V8_PACKET_CATALOGUE_PATH
      : recoveryV7
      ? PHASE10_C0V_S6_RECOVERY_V7_PACKET_CATALOGUE_PATH
      : recoveryV6
      ? PHASE10_C0V_S6_RECOVERY_V6_PACKET_CATALOGUE_PATH
      : recoveryV5
      ? PHASE10_C0V_S6_RECOVERY_V5_PACKET_CATALOGUE_PATH
      : recoveryV4
        ? PHASE10_C0V_S6_RECOVERY_V4_PACKET_CATALOGUE_PATH
      : recoveryV3
        ? PHASE10_C0V_S6_RECOVERY_V3_PACKET_CATALOGUE_PATH
      : recoveryV2
        ? PHASE10_C0V_S6_RECOVERY_V2_PACKET_CATALOGUE_PATH
      : recovery
        ? PHASE10_C0V_S6_RECOVERY_PACKET_CATALOGUE_PATH
        : "research/phase10-execution-v2/packet-catalogue.json",
  );
  const expectedLaunchClass = packetId === "a-p-c0v-s6"
    ? "static-contract"
    : packetId === "c0v-radial-produce" ? "solver-control" : "non-solver";
  if (preflightObservedContract.launchClass !== expectedLaunchClass) fail(label, "launch class differs from packet authority");
  const expectedPreflightRefusalDispositions = packetId === "c0v-radial-produce"
    ? ["prelaunch-resource-refusal", "preproduction-artifact-refusal"]
    : ["prelaunch-resource-refusal"];
  if (preflightObservedContract.allowedRefusalDispositionCodes.length !== expectedPreflightRefusalDispositions.length ||
    preflightObservedContract.allowedRefusalDispositionCodes.some((entry, index) =>
      entry !== expectedPreflightRefusalDispositions[index])) {
    fail(label, "preflight refusal dispositions differ from the exact all-packet resource/radial-artifact authority");
  }
  if ((packetId === "c0v-radial-produce") !== (resources.solverWorkerTimeoutSeconds === 300 && resources.solverProcessConcurrency === 1)) {
    fail(label, "the 300-second solver-worker cap/concurrency must exist exactly on radial produce");
  }
  const expectedRouteAndDisposition: Partial<Record<Phase10C0VS6PacketId, readonly [string, NonNullable<Phase10C0VS6PacketProtocol["s5ArtifactDisposition"]>]>> = {
    "c0v-moving-produce": ["route-c0v-moving-discrepancy-match-only", "reference-discrepancy-refusal"],
    "c0v-moving-publish": ["route-c0v-moving-discrepancy-match-only", "reference-discrepancy-refusal"],
    "c0v-radial-produce": ["route-c0v-radial-independent-reference", "reference-frozen"],
    "c0v-radial-publish": ["route-c0v-radial-independent-reference", "reference-frozen"],
    "c0v-static-produce": ["route-c0v-static-preimplementation-refusal", "reference-refusal"],
    "c0v-static-publish": ["route-c0v-static-preimplementation-refusal", "reference-refusal"],
  };
  const expectedRoute = expectedRouteAndDisposition[packetId];
  if (expectedRoute === undefined) {
    if (selectedRouteId !== null || disposition !== null) fail(label, "non-produce packet cannot select a science route");
  } else if (selectedRouteId !== expectedRoute[0] || disposition !== expectedRoute[1]) {
    fail(label, "selected route or S5 disposition differs from the pinned packet mapping");
  }
  const executionMode = enumValue(row.executionMode, ["supplemental-ap", "radial-production", "discrepancy-match-only", "preimplementation-refusal", "layer-publish", "aggregate"] as const, `${label}.executionMode`);
  const expectedExecutionMode: Record<Phase10C0VS6PacketId, Phase10C0VS6ExecutionMode> = {
    "a-p-c0v-s6": "supplemental-ap",
    "c0v-moving-produce": "discrepancy-match-only",
    "c0v-moving-publish": "layer-publish",
    "c0v-radial-produce": "radial-production",
    "c0v-radial-publish": "layer-publish",
    "c0v-static-produce": "preimplementation-refusal",
    "c0v-static-publish": "layer-publish",
    "c0v-aggregate": "aggregate",
  };
  if (executionMode !== expectedExecutionMode[packetId]) fail(label, "execution mode differs from packet mapping");
  const allowedCleanTerminalClasses = arrayValue(row.allowedCleanTerminalClasses, `${label}.allowedCleanTerminalClasses`).map((entry, index) =>
    enumValue(entry, ["packet-resource-refusal", "scientific-fail", "scientific-pass", "scientific-refusal", "structural-complete"] as const, `${label}.allowedCleanTerminalClasses[${index}]`));
  const expectedTerminalClasses: readonly Phase10C0VS6CleanTerminalClass[] = packetId === "c0v-radial-produce"
    ? ["packet-resource-refusal", "scientific-fail", "scientific-pass", "scientific-refusal"]
    : packetId === "c0v-moving-produce" || packetId === "c0v-static-produce"
      ? ["packet-resource-refusal", "scientific-refusal"]
      : ["packet-resource-refusal", "structural-complete"];
  if (allowedCleanTerminalClasses.length !== expectedTerminalClasses.length ||
    allowedCleanTerminalClasses.some((entry, index) => entry !== expectedTerminalClasses[index])) {
    fail(`${label}.allowedCleanTerminalClasses`, "differs from exact packet mapping");
  }
  const resourceConditionIds = [
    `cond-${packetId}-prelaunch-free-space`, `cond-${packetId}-prelaunch-process-hours`,
    `cond-${packetId}-prelaunch-storage`,
  ];
  const routeCauseConditionIds: readonly string[] = packetId === "c0v-moving-produce"
    ? [
      "cond-c0v-moving-science-protocol-identity", "cond-c0v-moving-reference-identity",
      "cond-c0v-moving-expected-outcome", "cond-c0v-moving-observed-outcome",
      "cond-c0v-moving-disposition", "cond-c0v-moving-independent-errors-present",
      "cond-c0v-moving-code-import-receipt", "cond-c0v-moving-claim-boundary",
    ]
    : packetId === "c0v-static-produce" ? [
      "cond-c0v-static-science-protocol-identity", "cond-c0v-static-refusal-identity",
      "cond-c0v-static-reason-code", "cond-c0v-static-attempted-routes",
      "cond-c0v-static-independent-check", "cond-c0v-static-zero-execution",
      "cond-c0v-static-code-import-receipt", "cond-c0v-static-claim-boundary",
    ] : [];
  const expectedSubroutes: readonly (readonly [
    string,
    Phase10C0VS6PacketTerminalSubrouteAuthority["dispositionCode"],
    readonly string[],
  ])[] = packetId.endsWith("-produce")
    ? tuples.map((tuple) => {
      let conditionIds: readonly string[] = [];
      if (tuple.dispositionCode === "prelaunch-resource-refusal") conditionIds = resourceConditionIds;
      else if (tuple.dispositionCode === "preproduction-artifact-refusal") conditionIds = ["cond-c0v-radial-artifact-precondition-failed"];
      else if (tuple.dispositionCode === "registered-cap-resource-refusal") {
        const binding = registeredCapBindings.find((entry) => entry.tupleId === tuple.tupleId);
        conditionIds = binding === undefined ? [] : [binding.conditionId];
      } else if (tuple.dispositionCode === "reference-discrepancy-refusal" ||
        tuple.dispositionCode === "preimplementation-reference-refusal") conditionIds = routeCauseConditionIds;
      return [tuple.tupleId, tuple.dispositionCode, conditionIds] as const;
    })
    : [
      [`${packetId}-structural-complete`, null, []] as const,
      [`${packetId}-prelaunch-resource-refusal`, "prelaunch-resource-refusal", resourceConditionIds] as const,
      ...verificationRegisteredCapBindings.map((binding) => [
        `${packetId}-registered-cap-${binding.invocationId.slice(4)}`,
        "registered-cap-resource-refusal",
        [binding.conditionId],
      ] as const),
    ];
  if (terminalSubroutes.length !== expectedSubroutes.length || terminalSubroutes.some((entry, index) => {
    const expected = expectedSubroutes[index];
    return expected === undefined || entry.subrouteId !== expected[0] || entry.dispositionCode !== expected[1] ||
      entry.classificationConditionIds.length !== expected[2].length ||
      entry.classificationConditionIds.some((conditionId, conditionIndex) => conditionId !== expected[2][conditionIndex]);
  })) {
    fail(`${label}.terminalSubroutes`, "identity, disposition, order, or classification-condition roster differs");
  }
  for (const subroute of terminalSubroutes) {
    if (new Set(subroute.classificationConditionIds).size !== subroute.classificationConditionIds.length ||
      subroute.classificationConditionIds.some((conditionId) =>
        !conditions.some((condition) => condition.conditionId === conditionId))) {
      fail(`${label}.terminalSubroutes.${subroute.subrouteId}`, "classification conditions must be unique registered protocol conditions");
    }
    for (const [required, forbidden, rosterLabel] of [
      [subroute.requiredOutputIds, subroute.forbiddenOutputIds, "outputs"],
      [subroute.requiredCheckIds, subroute.forbiddenCheckIds, "checks"],
      [subroute.requiredNegativeControlIds, subroute.forbiddenNegativeControlIds, "negative controls"],
    ] as const) {
      if (required.some((entry) => forbidden.includes(entry))) {
        fail(`${label}.terminalSubroutes.${subroute.subrouteId}`, `required/forbidden ${rosterLabel} overlap`);
      }
    }
  }
  const decisionRosters = terminalCandidateContract.decisionRosters;
  if (decisionRosters.length !== terminalSubroutes.length) {
    fail(`${label}.terminalCandidateContract.decisionRosters`, "must cover every terminal subroute exactly once");
  }
  for (const [subrouteIndex, subroute] of terminalSubroutes.entries()) {
    const decisionRoster = decisionRosters[subrouteIndex];
    if (decisionRoster === undefined || decisionRoster.subrouteId !== subroute.subrouteId) {
      fail(`${label}.terminalCandidateContract.decisionRosters`, "must follow exact terminal-subroute order");
    }
    if (decisionRoster.candidateFilename !== "terminal-success-candidate.json" ||
      decisionRoster.candidateVerdict !== "accepted-route-candidate") {
      fail(`${label}.terminalCandidateContract.decisionRosters.${subroute.subrouteId}`, "every current materializable subroute must use the accepted terminal candidate");
    }
    const expectedCandidateOutputIds = subroute.requiredOutputIds.filter((outputId) =>
      !outputId.endsWith("-attempt-ledger") && !outputId.endsWith("-verification") &&
      !outputId.endsWith("-terminal-receipt"));
    const expectedCandidateCheckIds = subroute.requiredCheckIds.filter((checkId) =>
      !checkId.endsWith("-attempt-census") && !checkId.endsWith("-resource-boundary"));
    const expectedCandidateReasonCodes: readonly string[] = [];
    if (decisionRoster.candidateProducedOutputIds.length !== expectedCandidateOutputIds.length ||
      decisionRoster.candidateProducedOutputIds.some((outputId, outputIndex) => outputId !== expectedCandidateOutputIds[outputIndex]) ||
      decisionRoster.candidateExecutedCheckIds.length !== expectedCandidateCheckIds.length ||
      decisionRoster.candidateExecutedCheckIds.some((checkId, checkIndex) => checkId !== expectedCandidateCheckIds[checkIndex]) ||
      decisionRoster.candidateExecutedNegativeControlIds.length !== subroute.requiredNegativeControlIds.length ||
      decisionRoster.candidateExecutedNegativeControlIds.some((controlId, controlIndex) =>
        controlId !== subroute.requiredNegativeControlIds[controlIndex]) ||
      decisionRoster.candidateReasonCodes.length !== expectedCandidateReasonCodes.length ||
      decisionRoster.candidateReasonCodes.some((reasonCode, reasonIndex) => reasonCode !== expectedCandidateReasonCodes[reasonIndex])) {
      fail(`${label}.terminalCandidateContract.decisionRosters.${subroute.subrouteId}`, "pre-census candidate roster differs from exact construction stage");
    }
    const tuple = tuples.find((entry) => entry.tupleId === subroute.subrouteId);
    const layer = packetId.includes("moving") ? "moving" : packetId.includes("radial") ? "radial" :
      packetId.includes("static") ? "static" : null;
    const freezeCheckId = layer === null ? null : `chk-c0v-${layer}-freeze-ancestry`;
    const expectedFreezeCheckIds = freezeCheckId !== null && subroute.requiredCheckIds.includes(freezeCheckId)
      ? [freezeCheckId]
      : [];
    const expectedDecisions: Phase10C0VS6DecisionAuthority[] = [];
    if (expectedFreezeCheckIds.length !== 0) {
      expectedDecisions.push({
        decisionRole: "freeze",
        fieldName: "freezeDecision",
        decisionId: `decision-${packetId}-${subroute.subrouteId}-freeze-v1`,
        evaluatorCallableId: "phase10-c0v-s6-freeze-evaluator",
        invokedCheckIds: Object.freeze(expectedFreezeCheckIds),
        expectedVerdict: "pass",
        evidence: Object.freeze([Object.freeze({
          evidenceRole: "freeze-evaluation" as const,
          artifactRelativePath: "freeze-evaluation.json" as const,
        })]),
      });
    }
    if (subroute.dispositionCode !== null && subroute.dispositionCode !== "production-complete") {
      let evaluatorCallableId = "phase10-c0v-s6-refusal-evaluator";
      if (packetId === "c0v-moving-produce" && tuple !== undefined &&
        tuple.dispositionCode === "reference-discrepancy-refusal") {
        evaluatorCallableId = "phase10-c0v-moving-evaluator";
      } else if (packetId === "c0v-static-produce" && tuple !== undefined &&
        tuple.dispositionCode === "preimplementation-reference-refusal") {
        evaluatorCallableId = "phase10-c0v-static-refusal-evaluator";
      }
      const expectedCauseCheckIds = subroute.requiredCheckIds.filter((checkId) => evaluatorCallableId === "phase10-c0v-moving-evaluator"
        ? checkId === "chk-c0v-moving-discrepancy-validity"
        : evaluatorCallableId === "phase10-c0v-static-refusal-evaluator"
          ? checkId === "chk-c0v-static-refusal-validity"
          : checkId.endsWith("artifact-refusal-validity") || checkId.endsWith("resource-refusal-validity"));
      expectedDecisions.push({
        decisionRole: "cause",
        fieldName: "causeDecision",
        decisionId: `decision-${packetId}-${subroute.subrouteId}-cause-v1`,
        evaluatorCallableId,
        invokedCheckIds: Object.freeze(expectedCauseCheckIds),
        expectedVerdict: "pass",
        evidence: Object.freeze([Object.freeze({
          evidenceRole: "cause-evaluation" as const,
          artifactRelativePath: "cause-evaluation.json" as const,
        })]),
      });
    }
    if (decisionRoster.decisions.length !== expectedDecisions.length || decisionRoster.decisions.some((decision, decisionIndex) => {
      const expected = expectedDecisions[decisionIndex];
      return expected === undefined || decision.decisionRole !== expected.decisionRole ||
        decision.fieldName !== expected.fieldName || decision.decisionId !== expected.decisionId ||
        decision.evaluatorCallableId !== expected.evaluatorCallableId ||
        decision.expectedVerdict !== expected.expectedVerdict ||
        decision.invokedCheckIds.length !== expected.invokedCheckIds.length ||
        decision.invokedCheckIds.some((checkId, checkIndex) => checkId !== expected.invokedCheckIds[checkIndex]) ||
        decision.evidence.length !== expected.evidence.length ||
        decision.evidence.some((evidence, evidenceIndex) => {
          const expectedEvidence = expected.evidence[evidenceIndex];
          return expectedEvidence === undefined || evidence.evidenceRole !== expectedEvidence.evidenceRole ||
            evidence.artifactRelativePath !== expectedEvidence.artifactRelativePath;
        });
    })) {
      fail(`${label}.terminalCandidateContract.decisionRosters.${subroute.subrouteId}`, "differs from exact acyclic freeze/cause decision authority");
    }
  }
  const classifiedSubroutes = terminalSubroutes.filter((subroute) =>
    subroute.dispositionCode !== null && subroute.dispositionCode !== "production-complete");
  if (classificationProjectionRosters.length !== classifiedSubroutes.length) {
    fail(`${label}.classificationProjectionRosters`, "must cover every and only classified terminal subroute");
  }
  const classificationMethodFor = (
    dispositionCode: Exclude<Phase10C0VS6PacketTerminalSubrouteAuthority["dispositionCode"], null | "production-complete">,
  ): Phase10C0VS6ClassificationMethod => {
    const methods: Readonly<Record<typeof dispositionCode, Phase10C0VS6ClassificationMethod>> = {
      "preproduction-artifact-refusal": "independent-artifact-precondition-classification",
      "prelaunch-resource-refusal": "independent-prelaunch-resource-classification",
      "registered-cap-resource-refusal": "independent-registered-cap-classification",
      "reference-discrepancy-refusal": "independent-reference-discrepancy-classification",
      "preimplementation-reference-refusal": "independent-preimplementation-refusal-classification",
    };
    return methods[dispositionCode];
  };
  for (const [projectionIndex, subroute] of classifiedSubroutes.entries()) {
    const projection = classificationProjectionRosters[projectionIndex];
    if (projection === undefined || projection.subrouteId !== subroute.subrouteId) {
      fail(`${label}.classificationProjectionRosters`, "must follow exact classified terminal-subroute order");
    }
    const expectedValidationId = `classification-${packetId}-${registeredAttemptId}-${subroute.subrouteId}-v1`;
    const layer = packetId.includes("moving") ? "moving" : packetId.includes("radial") ? "radial" :
      packetId.includes("static") ? "static" : null;
    const expectedAssembler = packetId.endsWith("-produce")
      ? `phase10-c0v-${layer}-attempt-receipt-writer`
      : "phase10-c0v-s6-terminal-receipt-writer";
    const decisionRoster = terminalCandidateContract.decisionRosters.find((entry) => entry.subrouteId === subroute.subrouteId)!;
    const expectedComponents = [
      ...decisionRoster.decisions.filter((entry) => entry.decisionRole === "cause").map((entry) => entry.evaluatorCallableId),
      ...decisionRoster.decisions.filter((entry) => entry.decisionRole === "freeze").map((entry) => entry.evaluatorCallableId),
      ...(subroute.requiredCheckIds.some((entry) => entry.endsWith("attempt-census"))
        ? ["phase10-c0v-s6-attempt-census-evaluator"] : []),
      ...(subroute.requiredCheckIds.some((entry) => entry.endsWith("resource-boundary"))
        ? ["phase10-c0v-s6-resource-evaluator"] : []),
    ];
    const expectedCardinality = subroute.dispositionCode === "prelaunch-resource-refusal" ? "exactly-one" : "all";
    const classifiedDisposition = subroute.dispositionCode as Exclude<
      Phase10C0VS6PacketTerminalSubrouteAuthority["dispositionCode"],
      null | "production-complete"
    >;
    if (projection.validationId !== expectedValidationId || projection.assemblerCallableId !== expectedAssembler ||
      projection.method !== classificationMethodFor(classifiedDisposition) ||
      projection.selectedConditionCardinality !== expectedCardinality ||
      projection.componentEvaluatorCallableIds.length !== expectedComponents.length ||
      projection.componentEvaluatorCallableIds.some((entry, index) => entry !== expectedComponents[index]) ||
      projection.observations.length !== subroute.classificationConditionIds.length) {
      fail(`${label}.classificationProjectionRosters.${subroute.subrouteId}`, "identity, method, cardinality, or component provenance differs");
    }
    const expectedEvidence = new Map<string, Phase10C0VS6ClassificationProjectionEvidenceAuthority>();
    const addEvidence = (entry: Phase10C0VS6ClassificationProjectionEvidenceAuthority): void => {
      expectedEvidence.set(entry.evidenceId, entry);
    };
    const packetEvidenceId = `evidence-${packetId}-packet-protocol`;
    addEvidence(Object.freeze({
      evidenceId: packetEvidenceId,
      evidenceRole: "packet-protocol",
      retentionClass: "tracked-authority",
      artifactSource: "bindings.packetProtocol",
      artifactRelativePath: null,
      inlineObservationPath: null,
    }));
    for (const [observationIndex, conditionId] of subroute.classificationConditionIds.entries()) {
      const condition = conditions.find((entry) => entry.conditionId === conditionId)!;
      const actual = projection.observations[observationIndex]!;
      const evidenceIds = [packetEvidenceId];
      let observedValueSource: string;
      let observedValueDerivation: Phase10C0VS6ClassificationProjectionObservationAuthority["observedValueDerivation"] = "identity";
      let finalizedValueBinding: string | null = null;
      const preflightEvidenceId = `evidence-${packetId}-preflight`;
      const scienceEvidenceId = `evidence-${packetId}-science-protocol`;
      const referenceEvidenceId = `evidence-${packetId}-reference-or-refusal`;
      const exitRawEvidenceId = `evidence-${packetId}-${subroute.subrouteId}-exit-raw`;
      const invocationRawEvidenceId = `evidence-${packetId}-${subroute.subrouteId}-invocations-raw`;
      const progressRawEvidenceId = `evidence-${packetId}-${subroute.subrouteId}-progress-raw`;
      const filesystemInlineEvidenceId = `evidence-${packetId}-${subroute.subrouteId}-filesystem-inline`;
      if (conditionId.endsWith("prelaunch-free-space")) {
        observedValueSource = "preflight.observed.resources.observedFreeBytes";
      } else if (conditionId.endsWith("prelaunch-process-hours")) {
        observedValueSource = "preflight.observed.resources.projectedPackageProcessHoursAfterAttempt";
      } else if (conditionId.endsWith("prelaunch-storage")) {
        observedValueSource = "preflight.observed.resources.projectedPackageBytesAfterAttempt";
      } else if (conditionId === "cond-c0v-radial-artifact-precondition-failed") {
        observedValueSource = "preflight.refusalCandidate.failedArtifact.failureClass";
        addEvidence(Object.freeze({
          evidenceId: filesystemInlineEvidenceId,
          evidenceRole: "classification-input",
          retentionClass: "embedded-preflight-observation",
          artifactSource: null,
          artifactRelativePath: null,
          inlineObservationPath: "preflight.refusalCandidate.failedArtifact.filesystemObservation",
        }));
        evidenceIds.push(filesystemInlineEvidenceId);
      } else if (condition.kind === "wall-seconds") {
        const capBinding = [...registeredCapBindings, ...verificationRegisteredCapBindings]
          .find((entry) => entry.conditionId === conditionId)!;
        observedValueSource = `internal.workerInvocations.${capBinding.invocationId}.elapsedNanoseconds`;
        observedValueDerivation = "elapsed-nanoseconds-divided-by-1000000000";
        finalizedValueBinding = packetId.endsWith("-produce")
          ? `attempt.executableInvocationRecords.${capBinding.invocationId}.wallSeconds`
          : `terminalReceipt.invocationRecords.${capBinding.invocationId}.wallSeconds`;
        addEvidence(Object.freeze({
          evidenceId: exitRawEvidenceId,
          evidenceRole: "exit-record",
          retentionClass: "ignored-staging-corroboration",
          artifactSource: "internal.exitStatus",
          artifactRelativePath: "exit-status.json",
          inlineObservationPath: null,
        }));
        addEvidence(Object.freeze({
          evidenceId: invocationRawEvidenceId,
          evidenceRole: "classification-input",
          retentionClass: "ignored-staging-corroboration",
          artifactSource: "internal.workerInvocations",
          artifactRelativePath: "worker-invocations.jsonl",
          inlineObservationPath: null,
        }));
        evidenceIds.push(exitRawEvidenceId, invocationRawEvidenceId);
        if (packetId === "c0v-radial-produce") {
          addEvidence(Object.freeze({
            evidenceId: progressRawEvidenceId,
            evidenceRole: "classification-input",
            retentionClass: "ignored-staging-corroboration",
            artifactSource: "internal.workerProgress",
            artifactRelativePath: "worker-progress.jsonl",
            inlineObservationPath: null,
          }));
          evidenceIds.push(progressRawEvidenceId);
        }
      } else if (conditionId.includes("science-protocol-identity")) {
        observedValueSource = "bindings.scienceProtocol";
        addEvidence(Object.freeze({
          evidenceId: scienceEvidenceId,
          evidenceRole: "science-protocol",
          retentionClass: "tracked-authority",
          artifactSource: "bindings.scienceProtocol",
          artifactRelativePath: null,
          inlineObservationPath: null,
        }));
        evidenceIds.push(scienceEvidenceId);
      } else {
        observedValueSource = `bindings.referenceOrRefusal.${conditionId.replace(/^cond-c0v-(?:moving|static)-/u, "")}`;
        addEvidence(Object.freeze({
          evidenceId: referenceEvidenceId,
          evidenceRole: "reference-or-refusal",
          retentionClass: "tracked-authority",
          artifactSource: "bindings.referenceOrRefusal",
          artifactRelativePath: null,
          inlineObservationPath: null,
        }));
        evidenceIds.push(referenceEvidenceId);
      }
      if (conditionId.includes("prelaunch-") || conditionId === "cond-c0v-radial-artifact-precondition-failed") {
        addEvidence(Object.freeze({
          evidenceId: preflightEvidenceId,
          evidenceRole: "preflight-receipt",
          retentionClass: "tracked-evidence",
          artifactSource: "retainedPreflight",
          artifactRelativePath: null,
          inlineObservationPath: null,
        }));
        evidenceIds.push(preflightEvidenceId);
      }
      const expectedEvidenceIds = [...new Set(evidenceIds)].sort();
      if (actual.conditionId !== condition.conditionId || actual.kind !== condition.kind ||
        actual.comparator !== condition.comparator || actual.registeredValue !== condition.registeredValue ||
        actual.unit !== condition.unit || actual.observedValueSource !== observedValueSource ||
        actual.observedValueDerivation !== observedValueDerivation ||
        actual.finalizedValueBinding !== finalizedValueBinding ||
        actual.conditionPassRule !== (expectedCardinality === "exactly-one" ? "exactly-one-selected-pass" : "must-pass") ||
        actual.evidenceIds.length !== expectedEvidenceIds.length ||
        actual.evidenceIds.some((entry, index) => entry !== expectedEvidenceIds[index])) {
        fail(`${label}.classificationProjectionRosters.${subroute.subrouteId}.observations[${observationIndex}]`, "differs from the exact raw route projection");
      }
    }
    const orderedExpectedEvidence = [...expectedEvidence.values()].sort((left, right) =>
      left.evidenceId < right.evidenceId ? -1 : left.evidenceId > right.evidenceId ? 1 : 0);
    if (projection.evidence.length !== orderedExpectedEvidence.length || projection.evidence.some((entry, index) => {
      const expected = orderedExpectedEvidence[index];
      return expected === undefined || entry.evidenceId !== expected.evidenceId ||
        entry.evidenceRole !== expected.evidenceRole || entry.retentionClass !== expected.retentionClass ||
        entry.artifactSource !== expected.artifactSource || entry.artifactRelativePath !== expected.artifactRelativePath ||
        entry.inlineObservationPath !== expected.inlineObservationPath;
    })) {
      fail(`${label}.classificationProjectionRosters.${subroute.subrouteId}.evidence`, "differs from the exact tracked/embedded/corroborating evidence projection");
    }
  }
  if (packetId !== "c0v-radial-produce" && packetId !== "c0v-moving-produce" && packetId !== "c0v-static-produce") {
    const subroute = terminalSubroutes[0]!;
    const resourceRefusalCheckId = registeredCheckIds.find((entry) =>
      entry.endsWith("resource-refusal-validity"));
    const normalCheckIds = registeredCheckIds.filter((entry) => entry !== resourceRefusalCheckId);
    if (subroute.requiredOutputIds.length !== registeredOutputIds.length ||
      subroute.requiredOutputIds.some((entry, index) => entry !== registeredOutputIds[index]) ||
      subroute.requiredCheckIds.length !== normalCheckIds.length ||
      subroute.requiredCheckIds.some((entry, index) => entry !== normalCheckIds[index]) ||
      subroute.forbiddenCheckIds.length !== 1 || subroute.forbiddenCheckIds[0] !== resourceRefusalCheckId ||
      subroute.requiredNegativeControlIds.length !== registeredNegativeControlIds.length ||
      subroute.requiredNegativeControlIds.some((entry, index) => entry !== registeredNegativeControlIds[index])) {
      fail(`${label}.terminalSubroutes`, "single active terminal roster differs from the packet registration");
    }
    const structuralOutputIds = registeredOutputIds.filter((entry) =>
      entry.endsWith("-preflight") || entry.endsWith("-terminal-receipt"));
    if (structuralOutputIds.length !== 2 || resourceRefusalCheckId === undefined) {
      fail(`${label}.terminalSubroutes`, "nonproduce packet lacks exact maker-return structural authority");
    }
    for (const makerReturn of terminalSubroutes.slice(1)) {
      const expectedRequiredChecks = [resourceRefusalCheckId];
      if (makerReturn.requiredOutputIds.length !== structuralOutputIds.length ||
        makerReturn.requiredOutputIds.some((entry, index) => entry !== structuralOutputIds[index]) ||
        makerReturn.requiredCheckIds.length !== expectedRequiredChecks.length ||
        makerReturn.requiredCheckIds.some((entry, index) => entry !== expectedRequiredChecks[index]) ||
        makerReturn.requiredNegativeControlIds.length !== 0 ||
        [...makerReturn.requiredOutputIds, ...makerReturn.forbiddenOutputIds].sort().some(
          (entry, index) => entry !== registeredOutputIds[index],
        ) ||
        [...makerReturn.requiredCheckIds, ...makerReturn.forbiddenCheckIds].sort().some(
          (entry, index) => entry !== registeredCheckIds[index],
        ) ||
        [...makerReturn.requiredNegativeControlIds, ...makerReturn.forbiddenNegativeControlIds].sort().some(
          (entry, index) => entry !== registeredNegativeControlIds[index],
        )) {
        fail(`${label}.terminalSubroutes.${makerReturn.subrouteId}`, "maker-return roster differs from exact structural-only authority");
      }
    }
  } else {
    const routeUniverses = {
      "c0v-moving-produce": {
        outputs: ["out-c0v-moving-attempt-ledger", "out-c0v-moving-evaluation", "out-c0v-moving-produce-preflight", "out-c0v-moving-produce-terminal-receipt", "out-c0v-moving-produce-verification", "out-c0v-moving-protocol", "out-c0v-moving-reference", "out-c0v-moving-reference-refusal", "out-c0v-moving-witness"],
        checks: ["chk-c0v-moving-attempt-census", "chk-c0v-moving-discrepancy-validity", "chk-c0v-moving-freeze-ancestry", "chk-c0v-moving-numeric", "chk-c0v-moving-reference-independence", "chk-c0v-moving-refusal-validity", "chk-c0v-moving-resource-boundary", "chk-c0v-moving-resource-refusal-validity"],
        controls: ["nc-event-event-time", "nc-event-topology-orbit"],
      },
      "c0v-radial-produce": {
        outputs: ["out-c0v-radial-attempt-ledger", "out-c0v-radial-evaluation", "out-c0v-radial-produce-preflight", "out-c0v-radial-produce-terminal-receipt", "out-c0v-radial-produce-verification", "out-c0v-radial-protocol", "out-c0v-radial-reference", "out-c0v-radial-reference-refusal", "out-c0v-radial-witness"],
        checks: ["chk-c0v-radial-artifact-refusal-validity", "chk-c0v-radial-attempt-census", "chk-c0v-radial-discrepancy-validity", "chk-c0v-radial-freeze-ancestry", "chk-c0v-radial-numeric", "chk-c0v-radial-reference-independence", "chk-c0v-radial-refusal-validity", "chk-c0v-radial-resource-boundary", "chk-c0v-radial-resource-refusal-validity"],
        controls: ["nc-radial-finite-shell-term", "nc-radial-forged-summary", "nc-radial-robin-coefficient"],
      },
      "c0v-static-produce": {
        outputs: ["out-c0v-static-attempt-ledger", "out-c0v-static-evaluation", "out-c0v-static-produce-preflight", "out-c0v-static-produce-terminal-receipt", "out-c0v-static-produce-verification", "out-c0v-static-protocol", "out-c0v-static-reference", "out-c0v-static-reference-refusal", "out-c0v-static-witness"],
        checks: ["chk-c0v-static-attempt-census", "chk-c0v-static-freeze-ancestry", "chk-c0v-static-numeric", "chk-c0v-static-reference-independence", "chk-c0v-static-refusal-validity", "chk-c0v-static-resource-boundary", "chk-c0v-static-resource-refusal-validity"],
        controls: ["nc-static-boundary-stencil", "nc-static-forged-norms", "nc-static-missing-level", "nc-static-shared-operator"],
      },
    } as const;
    const universe = routeUniverses[packetId];
    for (const subroute of terminalSubroutes) {
      for (const [required, forbidden, expectedUniverse, rosterLabel] of [
        [subroute.requiredOutputIds, subroute.forbiddenOutputIds, universe.outputs, "outputs"],
        [subroute.requiredCheckIds, subroute.forbiddenCheckIds, universe.checks, "checks"],
        [subroute.requiredNegativeControlIds, subroute.forbiddenNegativeControlIds, universe.controls, "negative controls"],
      ] as const) {
        const actualUniverse = [...required, ...forbidden].sort();
        if (actualUniverse.length !== expectedUniverse.length || actualUniverse.some((entry, index) => entry !== expectedUniverse[index])) {
          fail(`${label}.terminalSubroutes.${subroute.subrouteId}`, `${rosterLabel} do not conserve the exact preserved definition universe`);
        }
      }
      if (packetId === "c0v-radial-produce") {
        const expectedCompletedControls = subroute.dispositionCode === "production-complete"
          ? universe.controls
          : [];
        if (subroute.requiredNegativeControlIds.length !== expectedCompletedControls.length ||
          subroute.requiredNegativeControlIds.some((entry, index) =>
            entry !== expectedCompletedControls[index])) {
          fail(
            `${label}.terminalSubroutes.${subroute.subrouteId}`,
            "radial routes grant completed negative-control credit only after the full production campaign",
          );
        }
      }
    }
  }
  const internalOnlyFilenames = arrayValue(paths.internalOnlyFilenames, `${label}.paths.internalOnlyFilenames`).map((entry, index) =>
    safeFilename(entry, `${label}.paths.internalOnlyFilenames[${index}]`));
  const baseInternal = [
    "cause-evaluation.json", "exit-status.json", "freeze-evaluation.json",
    "stderr.log", "stdout.log", "terminal-success-candidate.json",
    "worker-invocations.jsonl",
  ];
  const produceInternal = [...baseInternal].sort();
  const radialInternal = [
    ...produceInternal, "c0v-radial-producer-summary.json", "nc-radial-finite-shell-term-witness.bin",
    "nc-radial-forged-summary.json", "nc-radial-robin-coefficient-witness.bin", "worker-progress.jsonl",
  ].sort();
  const expectedInternal = packetId === "c0v-radial-produce"
    ? radialInternal
    : packetId === "c0v-moving-produce" || packetId === "c0v-static-produce"
      ? produceInternal
      : packetId === "c0v-aggregate"
        ? [...baseInternal, "any-layer-nonpass-control.json"].sort()
        : baseInternal;
  if (new Set(internalOnlyFilenames).size !== internalOnlyFilenames.length ||
    internalOnlyFilenames.some((entry, index) => index > 0 && internalOnlyFilenames[index - 1]! >= entry)) {
    fail(`${label}.paths.internalOnlyFilenames`, "must be a unique code-point filename order");
  }
  if (internalOnlyFilenames.length !== expectedInternal.length ||
    internalOnlyFilenames.some((entry, index) => entry !== expectedInternal[index])) {
    fail(`${label}.paths.internalOnlyFilenames`, "differs from exact packet internal-only roster");
  }
  const expectedInternalPaths = (rosterId: string): readonly string[] => {
    if (!packetId.endsWith("-produce")) {
      const subroute = terminalSubroutes.find((entry) => entry.subrouteId === rosterId);
      if (subroute === undefined) fail(`${label}.internalArtifactRosters`, `unknown subroute ${rosterId}`);
      const pathsForSubroute = [
        "exit-status.json", "freeze-evaluation.json", "stderr.log", "stdout.log",
        "terminal-success-candidate.json",
      ];
      if (subroute.dispositionCode !== null) pathsForSubroute.push("cause-evaluation.json");
      if (subroute.dispositionCode !== "prelaunch-resource-refusal") {
        pathsForSubroute.push("worker-invocations.jsonl");
      }
      if (packetId === "c0v-aggregate" && (subroute.dispositionCode === null ||
        subroute.subrouteId.endsWith("aggregate-producer") ||
        subroute.subrouteId.endsWith("aggregate-check-caller"))) {
        pathsForSubroute.push("any-layer-nonpass-control.json");
      }
      return Object.freeze(pathsForSubroute.sort());
    }
    const tuple = tuples.find((entry) => entry.tupleId === rosterId);
    const invocationRoster = invocationRosters.find((entry) => entry.tupleId === rosterId);
    if (tuple === undefined || invocationRoster === undefined) {
      fail(`${label}.internalArtifactRosters`, `unknown execution tuple ${rosterId}`);
    }
    const pathsForTuple = [
      "exit-status.json", "freeze-evaluation.json", "stderr.log", "stdout.log",
      "terminal-success-candidate.json",
    ];
    if (tuple.record.workerProcessInvocationCount > 0) pathsForTuple.push("worker-invocations.jsonl");
    if (tuple.record.discrepancyOrRefusalEvaluatorInvocationCount > 0) {
      pathsForTuple.push("cause-evaluation.json");
    }
    if (packetId === "c0v-radial-produce" && tuple.record.solverWorkerInvocationCount > 0) {
      pathsForTuple.push("worker-progress.jsonl");
      const completedIds = new Set(invocationRoster.invocations
        .filter((entry) => entry.terminalState === "complete")
        .map((entry) => entry.invocationId));
      const acceptedProduction = tuple.dispositionCode === "production-complete";
      if (completedIds.has("inv-c0v-radial-production")) {
        pathsForTuple.push("candidate/c0v-radial-producer-summary.json");
        if (!acceptedProduction) pathsForTuple.push("candidate/c0v-radial-witness.bin");
      }
      if (completedIds.has("inv-c0v-radial-nc-finite-shell-term")) {
        pathsForTuple.push("candidate/nc-radial-finite-shell-term-witness.bin");
      }
      if (completedIds.has("inv-c0v-radial-nc-forged-summary")) {
        pathsForTuple.push("candidate/nc-radial-forged-summary.json");
      }
      if (completedIds.has("inv-c0v-radial-nc-robin-coefficient")) {
        pathsForTuple.push("candidate/nc-radial-robin-coefficient-witness.bin");
      }
    }
    return Object.freeze([...new Set(pathsForTuple)].sort());
  };
  for (const roster of internalArtifactRosters) {
    const expectedPaths = expectedInternalPaths(roster.rosterId);
    if (roster.relativePaths.length !== expectedPaths.length ||
      roster.relativePaths.some((entry, index) => entry !== expectedPaths[index])) {
      fail(`${label}.internalArtifactRosters.${roster.rosterId}`, "differs from exact route physical-artifact roster");
    }
    const decisionRoster = terminalCandidateContract.decisionRosters.find((entry) => entry.subrouteId === roster.rosterId);
    if (decisionRoster === undefined || decisionRoster.decisions.some((decision) =>
      decision.evidence.some((evidence) => !roster.relativePaths.includes(evidence.artifactRelativePath)))) {
      fail(`${label}.internalArtifactRosters.${roster.rosterId}`, "does not retain every exact terminal-decision evidence artifact");
    }
  }
  const callerResultRosters = terminalReceiptContract.callerInvocationResultRosters;
  if (callerResultRosters.length !== terminalSubroutes.length) {
    fail(`${label}.terminalReceiptContract.callerInvocationResultRosters`, "must cover every terminal subroute once");
  }
  const preflightOutputId = registeredOutputIds.find((entry) => entry.endsWith("-preflight"));
  if (preflightOutputId === undefined) fail(`${label}.registeredOutputIds`, "preflight output is absent");
  const sourceOutput = (outputId: string): Phase10C0VS6CallerResultSourceAuthority => Object.freeze({
    artifactRole: `output:${outputId}`,
    sourceKind: "registered-output",
    outputId,
    artifactRelativePath: null,
  });
  const sourceInternal = (artifactRelativePath: string): Phase10C0VS6CallerResultSourceAuthority => Object.freeze({
    artifactRole: `internal:${artifactRelativePath}`,
    sourceKind: "attempt-internal",
    outputId: null,
    artifactRelativePath,
  });
  const mainCallerIds = new Set([
    "phase10-a-p-c0v-s6-check-caller",
    "phase10-c0v-radial-produce-check-caller",
    "phase10-c0v-moving-publish-check-caller",
    "phase10-c0v-radial-publish-check-caller",
    "phase10-c0v-static-publish-check-caller",
    "phase10-c0v-aggregate-check-caller",
  ]);
  for (const [subrouteIndex, subroute] of terminalSubroutes.entries()) {
    const roster = callerResultRosters[subrouteIndex];
    if (roster === undefined || roster.subrouteId !== subroute.subrouteId) {
      fail(`${label}.terminalReceiptContract.callerInvocationResultRosters`, "must follow terminal-subroute order");
    }
    type ExpectedCallerRow = {
      callerCallableId: string;
      evaluatorCallableId: string;
      checkIds: string[];
      rank: number;
      terminalState: "complete" | "child-registered-cap";
    };
    const expectedGroups = new Map<string, ExpectedCallerRow>();
    const rankFor = (checkId: string): number => checkId.endsWith("freeze-ancestry") ? 0
      : checkId.endsWith("attempt-census") ? 20
        : checkId.endsWith("resource-boundary") ? 30
          : 10;
    for (const checkId of subroute.requiredCheckIds) {
      const [callerCallableId, evaluatorCallableId] = phase10C0VS6CallerEvaluatorForCheck(checkId);
      const key = `${callerCallableId}\0${evaluatorCallableId}`;
      const existing = expectedGroups.get(key);
      if (existing === undefined) {
        expectedGroups.set(key, {
          callerCallableId,
          evaluatorCallableId,
          checkIds: [checkId],
          rank: rankFor(checkId),
          terminalState: "complete",
        });
      } else {
        existing.checkIds.push(checkId);
      }
    }
    const expectedRows = [...expectedGroups.values()].sort((left, right) =>
      left.rank - right.rank || (left.checkIds[0]! < right.checkIds[0]! ? -1 : 1));
    if (subroute.dispositionCode === "registered-cap-resource-refusal") {
      let cappedInvocation: Phase10C0VS6ExecutableInvocationAuthority |
        Phase10C0VS6PacketVerificationInvocationAuthority | undefined;
      if (packetId.endsWith("-produce")) {
        const binding = registeredCapBindings.find((entry) => entry.tupleId === subroute.subrouteId);
        cappedInvocation = binding === undefined
          ? undefined
          : invocationRosters.find((entry) => entry.tupleId === subroute.subrouteId)
            ?.invocations.find((entry) => entry.invocationId === binding.invocationId);
      } else {
        const binding = verificationRegisteredCapBindings.find((entry) =>
          subroute.subrouteId === `${packetId}-registered-cap-${entry.invocationId.slice(4)}`);
        cappedInvocation = binding === undefined
          ? undefined
          : verificationInvocationRoster.find((entry) => entry.invocationId === binding.invocationId);
      }
      let cappedCallerPair: readonly [string, string] | null = null;
      if (cappedInvocation !== undefined && packetId === "c0v-radial-produce" &&
        cappedInvocation.invocationClass !== "solver-production") {
        cappedCallerPair = ["phase10-c0v-radial-produce-check-caller", "phase10-c0v-radial-evaluator"];
      } else if (cappedInvocation !== undefined &&
        (packetId === "c0v-moving-produce" || packetId === "c0v-static-produce" ||
          cappedInvocation.callableId.endsWith("check-caller"))) {
        const checkId = registeredCheckIds.find((entry) =>
          phase10C0VS6CallerEvaluatorForCheck(entry)[0] === cappedInvocation!.callableId);
        if (checkId !== undefined) cappedCallerPair = phase10C0VS6CallerEvaluatorForCheck(checkId);
      }
      if (cappedCallerPair !== null) {
        const insertion = expectedRows.findIndex((entry) => entry.rank >= 10);
        expectedRows.splice(insertion < 0 ? expectedRows.length : insertion, 0, {
          callerCallableId: cappedCallerPair[0],
          evaluatorCallableId: cappedCallerPair[1],
          checkIds: [],
          rank: 10,
          terminalState: "child-registered-cap",
        });
      }
    }
    const decisionRoster = terminalCandidateContract.decisionRosters[subrouteIndex]!;
    const expectedSources = (
      evaluatorCallableId: string,
      terminalState: "complete" | "child-registered-cap",
    ): readonly Phase10C0VS6CallerResultSourceAuthority[] => {
      const sources: Phase10C0VS6CallerResultSourceAuthority[] = [sourceOutput(preflightOutputId)];
      if (terminalState === "child-registered-cap") {
        sources.push(sourceInternal("worker-invocations.jsonl"));
        if (packetId === "c0v-radial-produce") sources.push(sourceInternal("worker-progress.jsonl"));
      } else if (evaluatorCallableId === "phase10-c0v-s6-freeze-evaluator") {
        sources.push(sourceInternal("freeze-evaluation.json"));
      } else if (evaluatorCallableId === "phase10-c0v-s6-attempt-census-evaluator" ||
        evaluatorCallableId === "phase10-c0v-s6-resource-evaluator") {
        sources.push(sourceInternal("terminal-success-candidate.json"));
        const attemptLedgerId = subroute.requiredOutputIds.find((entry) => entry.endsWith("-attempt-ledger"));
        if (attemptLedgerId !== undefined) sources.push(sourceOutput(attemptLedgerId));
      } else if (evaluatorCallableId === "phase10-c0v-s6-refusal-evaluator" ||
        evaluatorCallableId === "phase10-c0v-moving-evaluator" ||
        evaluatorCallableId === "phase10-c0v-static-refusal-evaluator") {
        sources.push(sourceInternal("cause-evaluation.json"));
      } else {
        for (const outputId of decisionRoster.candidateProducedOutputIds) {
          if (outputId !== preflightOutputId) sources.push(sourceOutput(outputId));
        }
        if (packetId === "c0v-aggregate") sources.push(sourceInternal("any-layer-nonpass-control.json"));
      }
      return Object.freeze([...new Map(sources.map((entry) => [entry.artifactRole, entry])).values()]);
    };
    if (roster.callerInvocationResults.length !== expectedRows.length) {
      fail(`${label}.terminalReceiptContract.callerInvocationResultRosters.${subroute.subrouteId}`, "caller count differs");
    }
    for (const [resultIndex, actual] of roster.callerInvocationResults.entries()) {
      const expected = expectedRows[resultIndex]!;
      const expectedStage = expected.rank >= 20 ? "post-candidate" : "pre-candidate";
      const expectedControls = expected.terminalState === "complete" && mainCallerIds.has(expected.callerCallableId)
        ? subroute.requiredNegativeControlIds
        : [];
      const sources = expectedSources(expected.evaluatorCallableId, expected.terminalState);
      if (actual.callerInvocationId !== `caller-${subroute.subrouteId}-${resultIndex + 1}` ||
        actual.stage !== expectedStage || actual.callerCallableId !== expected.callerCallableId ||
        actual.evaluatorCallableId !== expected.evaluatorCallableId || actual.terminalState !== expected.terminalState ||
        actual.executedCheckIds.length !== expected.checkIds.length ||
        actual.executedCheckIds.some((entry, index) => entry !== expected.checkIds[index]) ||
        actual.evaluatedCheckIds.length !== expected.checkIds.length ||
        actual.evaluatedCheckIds.some((entry, index) => entry !== expected.checkIds[index]) ||
        actual.executedNegativeControlIds.length !== expectedControls.length ||
        actual.executedNegativeControlIds.some((entry, index) => entry !== expectedControls[index]) ||
        actual.evaluatorResultRule !== (expected.terminalState === "complete"
          ? "canonical-rerun-exact" : "null-child-registered-cap") ||
        actual.sourceArtifactAuthorities.length !== sources.length ||
        actual.sourceArtifactAuthorities.some((entry, index) => {
          const source = sources[index];
          return source === undefined || entry.artifactRole !== source.artifactRole ||
            entry.sourceKind !== source.sourceKind || entry.outputId !== source.outputId ||
            entry.artifactRelativePath !== source.artifactRelativePath;
        })) {
        fail(`${label}.terminalReceiptContract.callerInvocationResultRosters.${subroute.subrouteId}[${resultIndex}]`, "differs from exact caller/evaluator/result-source authority");
      }
    }
    const expectedCandidateCallerIds = roster.callerInvocationResults
      .filter((entry) => entry.stage === "pre-candidate")
      .map((entry) => entry.callerInvocationId);
    if (decisionRoster.candidateCallerInvocationIds.length !== expectedCandidateCallerIds.length ||
      decisionRoster.candidateCallerInvocationIds.some((entry, index) =>
        entry !== expectedCandidateCallerIds[index])) {
      fail(`${label}.terminalCandidateContract.decisionRosters.${subroute.subrouteId}.candidateCallerInvocationIds`, "differs from exact pre-candidate caller-result subsequence");
    }
    const tuple = tuples.find((entry) => entry.tupleId === subroute.subrouteId);
    if (tuple !== undefined && tuple.record.checkCallerInvocationCount !== expectedRows.length) {
      fail(`${label}.executionRecordTuples.${subroute.subrouteId}.checkCallerInvocationCount`, "differs from exact terminal caller-result roster");
    }
  }
  const terminalDecisionIds = terminalCandidateContract.decisionRosters.flatMap((roster) =>
    roster.decisions.map((decision) => decision.decisionId));
  if (new Set(terminalDecisionIds).size !== terminalDecisionIds.length) {
    fail(`${label}.terminalCandidateContract.decisionRosters`, "decision IDs must be globally unique within the packet");
  }
  const allowedPublicationPaths = stringArray(paths.allowedPublicationPaths, `${label}.paths.allowedPublicationPaths`);
  const publicationStagingPaths = arrayValue(
    paths.publicationStagingPaths,
    `${label}.paths.publicationStagingPaths`,
  ).map((entry, index) => {
    const stagingLabel = `${label}.paths.publicationStagingPaths[${index}]`;
    const staging = object(entry, stagingLabel);
    exactKeys(staging, ["finalPath", "stagingPath"], stagingLabel);
    return Object.freeze({
      finalPath: safePath(staging.finalPath, `${stagingLabel}.finalPath`),
      stagingPath: safePath(staging.stagingPath, `${stagingLabel}.stagingPath`),
    });
  });
  const structuralBase = [
    safePath(paths.preflightReceiptPath, `${label}.paths.preflightReceiptPath`),
    safePath(paths.terminalReceiptPath, `${label}.paths.terminalReceiptPath`),
  ];
  const expectedAllowedByPacket: Record<Phase10C0VS6PacketId, readonly string[]> = {
    "a-p-c0v-s6": [
      `${structuralEvidenceRoot}/artifact-index.json`,
      `${structuralEvidenceRoot}/missing-producer.json`,
      ...structuralBase,
      `${structuralEvidenceRoot}/uncalled-check.json`,
      `${structuralEvidenceRoot}/verification.json`,
    ].sort(),
    "c0v-moving-produce": [
      "evidence/phase10-numerical-verification-v1/c0v-moving-attempts.jsonl",
      ...structuralBase,
      `${structuralEvidenceRoot}/packets/c0v-moving-produce/verification.json`,
    ].sort(),
    "c0v-moving-publish": [
      "evidence/phase10-numerical-verification-v1/c0v-moving-artifact-index.json",
      "evidence/phase10-numerical-verification-v1/c0v-moving-publish-verification.json",
      "evidence/phase10-numerical-verification-v1/c0v-moving-result.json",
      ...structuralBase,
    ].sort(),
    "c0v-radial-produce": [
      "evidence/phase10-numerical-verification-v1/c0v-radial-attempts.jsonl",
      "evidence/phase10-numerical-verification-v1/c0v-radial-evaluation.json",
      "evidence/phase10-numerical-verification-v1/c0v-radial-witness.bin",
      ...structuralBase,
      "evidence/phase10-obligation-preflight-v2/packets/c0v-radial-produce/verification.json",
    ].sort(),
    "c0v-radial-publish": [
      "evidence/phase10-numerical-verification-v1/c0v-radial-artifact-index.json",
      "evidence/phase10-numerical-verification-v1/c0v-radial-publish-verification.json",
      "evidence/phase10-numerical-verification-v1/c0v-radial-result.json",
      ...structuralBase,
    ].sort(),
    "c0v-static-produce": [
      "evidence/phase10-numerical-verification-v1/c0v-static-attempts.jsonl",
      ...structuralBase,
      "evidence/phase10-obligation-preflight-v2/packets/c0v-static-produce/verification.json",
    ].sort(),
    "c0v-static-publish": [
      "evidence/phase10-numerical-verification-v1/c0v-static-artifact-index.json",
      "evidence/phase10-numerical-verification-v1/c0v-static-publish-verification.json",
      "evidence/phase10-numerical-verification-v1/c0v-static-result.json",
      ...structuralBase,
    ].sort(),
    "c0v-aggregate": [
      "evidence/phase10-numerical-verification-v1/c0v-aggregate-verification.json",
      "evidence/phase10-numerical-verification-v1/c0v-aggregate.json",
      "evidence/phase10-numerical-verification-v1/c0v-artifact-index.json",
      "evidence/phase10-numerical-verification-v1/c0v-resource-ledger.json",
      "evidence/phase10-numerical-verification-v1/c0v-terminal-table.json",
      ...structuralBase,
    ].sort(),
  };
  const expectedAllowed = expectedAllowedByPacket[packetId];
  if (allowedPublicationPaths.length !== expectedAllowed.length ||
    allowedPublicationPaths.some((entry, index) => entry !== expectedAllowed[index])) {
    fail(`${label}.paths.allowedPublicationPaths`, "differs from exact no-overwrite publication surface");
  }
  if (publicationStagingPaths.length !== allowedPublicationPaths.length ||
    publicationStagingPaths.some((entry, index) => entry.finalPath !== allowedPublicationPaths[index] ||
      entry.stagingPath !== `${entry.finalPath}.stage-${registeredAttemptId}`)) {
    fail(`${label}.paths.publicationStagingPaths`, "must map every allowed final path to its exact attempt-bound sibling stage");
  }
  const expectedVerificationPath = expectedAllowed.find((entry) => entry.endsWith(`/${verificationFilename}`));
  const projections = resources.publicationFinalizationProjections;
  const maximumOtherAttemptRootBytesByPacket: Readonly<Record<Phase10C0VS6PacketId, number>> =
    Object.freeze({
      "a-p-c0v-s6": 12_582_912,
      "c0v-moving-produce": 29_360_128,
      "c0v-moving-publish": 12_582_912,
      "c0v-radial-produce": 4_194_304,
      "c0v-radial-publish": 12_582_912,
      "c0v-static-produce": 4_194_304,
      "c0v-static-publish": 12_582_912,
      "c0v-aggregate": 12_582_912,
  });
  if (resources.projectedScratchBytes !== 4_194_304 + 33_554_432 +
    maximumOtherAttemptRootBytesByPacket[packetId]) {
    fail(
      `${label}.resources.projectedScratchBytes`,
      "must equal exact aggregate stdout plus stderr plus all-other-attempt-root byte maxima",
    );
  }
  if (expectedVerificationPath === undefined || projections[0]?.path !== expectedVerificationPath ||
    projections[1]?.path !== paths.terminalReceiptPath || projections.some((projection) =>
      publicationStagingPaths.find((entry) => entry.finalPath === projection.path)?.stagingPath !== projection.stagingPath) ||
    projections.reduce((sum, entry) => sum + 2 * entry.maximumByteLength, 0) > resources.projectedPublicationBytes) {
    fail(`${label}.resources.publicationFinalizationProjections`, "differs from exact verification/terminal paths or exceeds the packet publication projection");
  }
  const parsedPaths = Object.freeze({
    attemptRoot: safePath(paths.attemptRoot, `${label}.paths.attemptRoot`),
    packageLockPath: literal(paths.packageLockPath, expectedPackageLockPath, `${label}.paths.packageLockPath`),
    lockPath: safePath(paths.lockPath, `${label}.paths.lockPath`),
    preflightReceiptPath: safePath(paths.preflightReceiptPath, `${label}.paths.preflightReceiptPath`),
    terminalReceiptPath: safePath(paths.terminalReceiptPath, `${label}.paths.terminalReceiptPath`),
    allowedPublicationPaths,
    publicationStagingPaths: Object.freeze(publicationStagingPaths),
    internalOnlyFilenames: Object.freeze(internalOnlyFilenames),
  });
  return Object.freeze({
    schema,
    protocolId,
    matrixId: literal(row.matrixId, PHASE10_C0V_S6_MATRIX_ID, `${label}.matrixId`),
    packetId,
    registryId,
    registeredAttemptId,
    executionMode,
    bindings: parsedBindings,
    selectedRouteId,
    s5ArtifactDisposition: disposition,
    registeredOutputIds,
    registeredCheckIds,
    registeredNegativeControlIds,
    boundDependencyPacketIds,
    dependencyArtifactContracts: Object.freeze(dependencyArtifactContracts),
    commandTemplates: Object.freeze(commands),
    paths: parsedPaths,
    candidateFilenameRosters,
    internalArtifactRosters,
    verification: Object.freeze({
      filename: verificationFilename,
      schemaId: "phase10-packet-verification-v2",
      verificationIdRule: literal(
        verification.verificationIdRule,
        "phase10-packet-attempt-verification-v2",
        `${label}.verification.verificationIdRule`,
      ),
      executionProvenanceRule: literal(
        verification.executionProvenanceRule,
        "nonnull-completed-main-evaluator-for-normal-credit-route-null-exactly-radial-validated-refusal-no-verification-on-other-maker-return",
        `${label}.verification.executionProvenanceRule`,
      ),
    }),
    allowedCleanTerminalClasses: Object.freeze(allowedCleanTerminalClasses),
    terminalSubroutes: Object.freeze(terminalSubroutes),
    resources,
    ancestryAuthority,
    preObservationProductionClosure,
    preflightObservedContract,
    workerInvocationContract,
    workerProgressContract,
    exitStatusContract,
    freezeEvaluationContract,
    causeEvaluationContract,
    terminalCandidateContract,
    terminalReceiptContract,
    executionRecordTuples: Object.freeze(tuples),
    executableInvocationRosters: Object.freeze(invocationRosters),
    verificationInvocationRoster,
    verificationRegisteredCapBindings: Object.freeze(verificationRegisteredCapBindings),
    resourceObservationPointRosters: Object.freeze(observationRosters),
    registeredCapBindings: Object.freeze(registeredCapBindings),
    classificationConditions: Object.freeze(conditions),
    classificationProjectionRosters: Object.freeze(classificationProjectionRosters),
    radialBinaryLayout: radialLayout,
    radialProducerSummary: summary,
    controlOperators: Object.freeze(controls),
    aggregateNegativeControlContract,
    claimBoundary: Object.freeze({ allowed: stringArray(claim.allowed, `${label}.claimBoundary.allowed`), forbidden: stringArray(claim.forbidden, `${label}.claimBoundary.forbidden`) }),
  });
}

function sameArtifactIdentity(
  actual: Phase10C0VS6ArtifactIdentity | null,
  expected: Phase10C0VS6ArtifactIdentity | null,
): boolean {
  return actual === null || expected === null
    ? actual === expected
    : actual.path === expected.path && actual.byteLength === expected.byteLength && actual.sha256 === expected.sha256;
}

function parseIdentityRoster(value: StrictJson, label: string): readonly Phase10C0VS6ArtifactIdentity[] {
  const identities = arrayValue(value, label).map((entry, index) =>
    parsePhase10C0VS6ArtifactIdentity(entry, `${label}[${index}]`));
  if (identities.some((entry, index) => index > 0 && identities[index - 1]!.path >= entry.path)) {
    fail(label, "must have unique code-point path order");
  }
  return Object.freeze(identities);
}

export function parsePhase10C0VS6PrettyJsonBytes(bytes: Uint8Array, label: string): StrictJson {
  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    fail(label, "must be valid UTF-8");
  }
  if (text.includes("\r")) fail(label, "must contain LF rather than CR bytes");
  let value: unknown;
  try {
    value = JSON.parse(text) as unknown;
  } catch {
    fail(label, "must be valid JSON");
  }
  const snapshot = strictJsonSnapshot(value);
  if (text !== `${JSON.stringify(snapshot, null, 2)}\n`) fail(label, "must be exact two-space JSON plus terminal LF");
  return snapshot;
}

export function phase10C0VS6ArtifactIdentityFromBytes(
  path: string,
  bytes: Uint8Array,
): Phase10C0VS6ArtifactIdentity {
  return Object.freeze({
    path: safePath(path, "artifact identity path"),
    byteLength: bytes.byteLength,
    sha256: createHash("sha256").update(bytes).digest("hex"),
  });
}

export interface Phase10C0VS6DependencyDispositionSelection {
  readonly packetId: string;
  readonly dispositionCode: Phase10C0VS6DependencyDispositionCode;
}

export function resolvePhase10C0VS6DependencyArtifactContracts(
  protocol: Phase10C0VS6PacketProtocol,
  selections: readonly Phase10C0VS6DependencyDispositionSelection[],
): readonly Phase10C0VS6DependencyArtifactContract[] {
  if (selections.length !== protocol.boundDependencyPacketIds.length || selections.some((selection, index) =>
    selection.packetId !== protocol.boundDependencyPacketIds[index])) {
    fail("dependency disposition selections", "must cover the exact bound packet roster in protocol order");
  }
  const selected = protocol.dependencyArtifactContracts.filter((contract) => {
    const selection = selections.find((entry) => entry.packetId === contract.packetId);
    return selection !== undefined && contract.applicableDispositionCodes.includes(selection.dispositionCode);
  });
  for (const selection of selections) {
    if (!selected.some((contract) => contract.packetId === selection.packetId)) {
      fail(
        "dependency disposition selections",
        `${selection.packetId} has no artifact roster for disposition ${selection.dispositionCode ?? "null"}`,
      );
    }
  }
  return Object.freeze(selected);
}

export function phase10C0VS6DependencyArtifactRosterVariants(
  protocol: Phase10C0VS6PacketProtocol,
): readonly (readonly Phase10C0VS6DependencyArtifactContract[])[] {
  let selections: readonly (readonly Phase10C0VS6DependencyDispositionSelection[])[] = [Object.freeze([])];
  for (const packetId of protocol.boundDependencyPacketIds) {
    const dispositionCodes = [...new Set(protocol.dependencyArtifactContracts
      .filter((contract) => contract.packetId === packetId)
      .flatMap((contract) => contract.applicableDispositionCodes))];
    selections = Object.freeze(selections.flatMap((prefix) => dispositionCodes.map((dispositionCode) =>
      Object.freeze([...prefix, Object.freeze({ packetId, dispositionCode })]))));
  }
  const variants = selections.map((selection) =>
    resolvePhase10C0VS6DependencyArtifactContracts(protocol, selection));
  const unique = new Map<string, readonly Phase10C0VS6DependencyArtifactContract[]>();
  for (const variant of variants) {
    const key = variant.map((contract) => `${contract.packetId}\u0000${contract.artifactPath}`).join("\u0001");
    if (!unique.has(key)) unique.set(key, variant);
  }
  return Object.freeze([...unique.values()]);
}

export function validatePhase10C0VS6RetainedPreflightDependencies(
  preflight: Phase10C0VS6RetainedPreflight,
  protocol: Phase10C0VS6PacketProtocol,
  selections: readonly Phase10C0VS6DependencyDispositionSelection[],
  reopenedArtifacts: readonly Phase10C0VS6ArtifactIdentity[],
): readonly Phase10C0VS6DependencyArtifactContract[] {
  const selectedContracts = resolvePhase10C0VS6DependencyArtifactContracts(protocol, selections);
  const expectedPaths = selectedContracts.map((contract) => contract.artifactPath).sort();
  const reopened = [...reopenedArtifacts].sort((left, right) => left.path < right.path ? -1 : left.path > right.path ? 1 : 0);
  const observed = [...preflight.observed.dependencyArtifacts].sort((left, right) => left.path < right.path ? -1 : left.path > right.path ? 1 : 0);
  if (reopened.length !== expectedPaths.length || observed.length !== expectedPaths.length ||
    reopened.some((artifact, index) => artifact.path !== expectedPaths[index] ||
      index > 0 && reopened[index - 1]!.path >= artifact.path) ||
    observed.some((artifact, index) => artifact.path !== expectedPaths[index] ||
      !sameArtifactIdentity(artifact, reopened[index]!))) {
    fail(
      "retained preflight dependency artifacts",
      "must raw-match the full path/byteLength/SHA identities for the dependent terminal-disposition-selected roster",
    );
  }
  return selectedContracts;
}

export function validatePhase10C0VS6RetainedPreflightEvidenceManifest(
  preflight: Phase10C0VS6RetainedPreflight,
  manifestAtRecordedLaunchHead: Phase10C0VS6ArtifactIdentity,
  reopenedLiveManifest: Phase10C0VS6ArtifactIdentity,
): void {
  const expectedPath = "evidence/MANIFEST.json";
  if (manifestAtRecordedLaunchHead.path !== expectedPath || reopenedLiveManifest.path !== expectedPath ||
    preflight.observed.evidenceManifest.path !== expectedPath ||
    !sameArtifactIdentity(preflight.observed.evidenceManifest, manifestAtRecordedLaunchHead) ||
    !sameArtifactIdentity(reopenedLiveManifest, manifestAtRecordedLaunchHead)) {
    fail(
      "retained preflight evidence manifest",
      "must raw-match both git-show at the recorded launch HEAD and the reopened live evidence manifest before dependency pins are used",
    );
  }
}

function preflightScalar(value: StrictJson, label: string): string | boolean | number | null {
  if (value === null || typeof value === "string" || typeof value === "boolean" ||
    (typeof value === "number" && Number.isFinite(value) && !Object.is(value, -0))) {
    return value;
  }
  fail(label, "must be a finite JSON scalar without negative zero");
}

function parsePreflightRefusalCandidate(
  value: StrictJson,
  protocol: Phase10C0VS6PacketProtocol,
  packetProtocolIdentity: Phase10C0VS6ArtifactIdentity,
  label: string,
): Phase10C0VS6PreflightRefusalCandidate {
  const row = object(value, label);
  exactOrderedKeys(row, ["dispositionCode", "observation", "failedArtifact", "evidence", "solverLaunched", "verdict"], label);
  const dispositionCode = enumValue(
    row.dispositionCode,
    ["preproduction-artifact-refusal", "prelaunch-resource-refusal"] as const,
    `${label}.dispositionCode`,
  );
  if (!protocol.preflightObservedContract.allowedRefusalDispositionCodes.includes(dispositionCode)) {
    fail(`${label}.dispositionCode`, "is not authorized by this packet");
  }
  const observation = object(row.observation, `${label}.observation`);
  exactOrderedKeys(observation, [
    "conditionId", "kind", "comparator", "registeredValue", "observedValue", "unit",
    "routeConditionMatched", "preconditionPassed", "evidenceIds",
  ], `${label}.observation`);
  const conditionId = stringValue(observation.conditionId, `${label}.observation.conditionId`);
  const condition = protocol.classificationConditions.find((entry) => entry.conditionId === conditionId);
  if (condition === undefined || !condition.routeSelecting) {
    fail(`${label}.observation.conditionId`, "is not one exact route-selecting protocol condition");
  }
  const kind = enumValue(
    observation.kind,
    ["artifact-filesystem-policy", "available-bytes", "retained-bytes", "process-hours"] as const,
    `${label}.observation.kind`,
  );
  const comparator = enumValue(
    observation.comparator,
    ["not-equal", "less-than", "greater-than"] as const,
    `${label}.observation.comparator`,
  );
  const registeredValue = preflightScalar(observation.registeredValue, `${label}.observation.registeredValue`);
  const observedValue = preflightScalar(observation.observedValue, `${label}.observation.observedValue`);
  const unit = observation.unit === null
    ? null
    : enumValue(observation.unit, ["bytes", "hours", "classification"] as const, `${label}.observation.unit`);
  if (kind !== condition.kind || comparator !== condition.comparator ||
    registeredValue !== condition.registeredValue || unit !== condition.unit) {
    fail(`${label}.observation`, "does not exactly reproduce the registered condition");
  }
  const routeConditionMatched = comparator === "not-equal"
    ? observedValue !== registeredValue
    : typeof observedValue === "number" && typeof registeredValue === "number" &&
      (comparator === "less-than" ? observedValue < registeredValue : observedValue > registeredValue);
  if (!routeConditionMatched || observation.routeConditionMatched !== true || observation.preconditionPassed !== false) {
    fail(`${label}.observation`, "raw value does not select the registered refusal condition");
  }
  const evidence = arrayValue(row.evidence, `${label}.evidence`).map((entry, index) => {
    const evidenceLabel = `${label}.evidence[${index}]`;
    const evidenceRow = object(entry, evidenceLabel);
    exactOrderedKeys(evidenceRow, ["evidenceId", "evidenceRole", "retentionClass", "artifact", "inlineObservationPath"], evidenceLabel);
    return Object.freeze({
      evidenceId: stringValue(evidenceRow.evidenceId, `${evidenceLabel}.evidenceId`),
      evidenceRole: enumValue(evidenceRow.evidenceRole, [
        "packet-protocol", "science-protocol", "reference-or-refusal", "classification-input",
      ] as const, `${evidenceLabel}.evidenceRole`),
      retentionClass: enumValue(
        evidenceRow.retentionClass,
        ["tracked-authority", "inline-observation"] as const,
        `${evidenceLabel}.retentionClass`,
      ),
      artifact: nullableIdentity(evidenceRow.artifact, `${evidenceLabel}.artifact`),
      inlineObservationPath: evidenceRow.inlineObservationPath === null
        ? null
        : stringValue(evidenceRow.inlineObservationPath, `${evidenceLabel}.inlineObservationPath`),
    });
  });
  if (evidence.length === 0 || evidence.some((entry, index) =>
    index > 0 && evidence[index - 1]!.evidenceId >= entry.evidenceId)) {
    fail(`${label}.evidence`, "must be nonempty unique evidenceId code-point order");
  }
  const evidenceIds = stringArray(observation.evidenceIds, `${label}.observation.evidenceIds`, false);
  if (evidenceIds.length !== evidence.length ||
    evidenceIds.some((entry, index) => entry !== evidence[index]!.evidenceId)) {
    fail(`${label}.observation.evidenceIds`, "must exactly resolve the tracked evidence roster");
  }
  let failedArtifact: Phase10C0VS6PreflightRefusalCandidate["failedArtifact"] = null;
  if (dispositionCode === "preproduction-artifact-refusal") {
    if (protocol.packetId !== "c0v-radial-produce" || kind !== "artifact-filesystem-policy" || comparator !== "not-equal" ||
      registeredValue !== "regular-single-link-unaliased" || observedValue !== "filesystem-object-policy-failure" ||
      unit !== "classification" || row.failedArtifact === null) {
      fail(label, "artifact refusal differs from the radial-only exact-byte filesystem-policy condition");
    }
    const failed = object(row.failedArtifact, `${label}.failedArtifact`);
    exactOrderedKeys(failed, [
      "artifactRole", "expected", "observed", "filesystemObservation", "failureClass",
    ], `${label}.failedArtifact`);
    const artifactRole = enumValue(failed.artifactRole, [
      "science-protocol", "reference-or-refusal",
    ] as const, `${label}.failedArtifact.artifactRole`);
    const expected = parsePhase10C0VS6ArtifactIdentity(failed.expected, `${label}.failedArtifact.expected`);
    const expectedByRole = artifactRole === "science-protocol"
      ? protocol.bindings.scienceProtocol
      : protocol.bindings.referenceOrRefusal;
    if (expectedByRole === null || !sameArtifactIdentity(expected, expectedByRole)) {
      fail(`${label}.failedArtifact.expected`, "differs from the exact packet-bound artifact");
    }
    const observedArtifact = parsePhase10C0VS6ArtifactIdentity(
      failed.observed,
      `${label}.failedArtifact.observed`,
    );
    if (!sameArtifactIdentity(observedArtifact, expected)) {
      fail(`${label}.failedArtifact.observed`, "must remain exact-byte identical to packet and launch-HEAD authority");
    }
    const filesystem = object(failed.filesystemObservation, `${label}.failedArtifact.filesystemObservation`);
    exactOrderedKeys(filesystem, [
      "path", "lstatObjectType", "lstatByteLength", "lstatLinkCount", "fileResolvedRelativePath",
      "lexicalParentRelativePath", "resolvedParentRelativePath", "resolvedInsideRepository",
      "parentAliased", "fstatBefore", "fstatAfter", "failureReasons", "readMethod",
    ], `${label}.failedArtifact.filesystemObservation`);
    const parseFstat = (value: StrictJson, field: "fstatBefore" | "fstatAfter") => {
      const fstatLabel = `${label}.failedArtifact.filesystemObservation.${field}`;
      const fstat = object(value, fstatLabel);
      exactOrderedKeys(fstat, ["deviceIdDecimal", "fileIdDecimal", "byteLength", "linkCount"], fstatLabel);
      const deviceIdDecimal = stringValue(fstat.deviceIdDecimal, `${fstatLabel}.deviceIdDecimal`);
      const fileIdDecimal = stringValue(fstat.fileIdDecimal, `${fstatLabel}.fileIdDecimal`);
      if (!/^(?:0|[1-9][0-9]*)$/u.test(deviceIdDecimal) || !/^(?:0|[1-9][0-9]*)$/u.test(fileIdDecimal)) {
        fail(fstatLabel, "device/file IDs must be canonical nonnegative decimal strings");
      }
      return Object.freeze({
        deviceIdDecimal,
        fileIdDecimal,
        byteLength: safeInteger(fstat.byteLength, `${fstatLabel}.byteLength`),
        linkCount: safeInteger(fstat.linkCount, `${fstatLabel}.linkCount`, 1),
      });
    };
    const fstatBefore = parseFstat(filesystem.fstatBefore, "fstatBefore");
    const fstatAfter = parseFstat(filesystem.fstatAfter, "fstatAfter");
    if (JSON.stringify(fstatBefore) !== JSON.stringify(fstatAfter) ||
      fstatBefore.byteLength !== expected.byteLength) {
      fail(`${label}.failedArtifact.filesystemObservation`, "descriptor fstat must remain exact before and after hashing");
    }
    const path = safePath(filesystem.path, `${label}.failedArtifact.filesystemObservation.path`);
    const lstatByteLength = safeInteger(
      filesystem.lstatByteLength,
      `${label}.failedArtifact.filesystemObservation.lstatByteLength`,
    );
    const lstatLinkCount = safeInteger(
      filesystem.lstatLinkCount,
      `${label}.failedArtifact.filesystemObservation.lstatLinkCount`,
      1,
    );
    const fileResolvedRelativePath = safePath(
      filesystem.fileResolvedRelativePath,
      `${label}.failedArtifact.filesystemObservation.fileResolvedRelativePath`,
    );
    const lexicalParentRelativePath = safePath(
      filesystem.lexicalParentRelativePath,
      `${label}.failedArtifact.filesystemObservation.lexicalParentRelativePath`,
    );
    const resolvedParentRelativePath = safePath(
      filesystem.resolvedParentRelativePath,
      `${label}.failedArtifact.filesystemObservation.resolvedParentRelativePath`,
    );
    const parentAliased = booleanValue(
      filesystem.parentAliased,
      `${label}.failedArtifact.filesystemObservation.parentAliased`,
    );
    const failureReasons = arrayValue(
      filesystem.failureReasons,
      `${label}.failedArtifact.filesystemObservation.failureReasons`,
    ).map((entry, index) => enumValue(
      entry,
      ["link-count-not-one", "parent-path-aliased"] as const,
      `${label}.failedArtifact.filesystemObservation.failureReasons[${index}]`,
    ));
    const expectedFailureReasons = [
      ...(lstatLinkCount !== 1 ? ["link-count-not-one" as const] : []),
      ...(parentAliased ? ["parent-path-aliased" as const] : []),
    ];
    const finalSeparator = expected.path.lastIndexOf("/");
    const expectedLexicalParent = expected.path.slice(0, finalSeparator);
    const expectedFilename = expected.path.slice(finalSeparator + 1);
    const expectedResolvedFile = `${resolvedParentRelativePath}/${expectedFilename}`;
    if (path !== expected.path || lstatByteLength !== expected.byteLength ||
      lstatLinkCount !== fstatBefore.linkCount || lexicalParentRelativePath !== expectedLexicalParent ||
      fileResolvedRelativePath !== expectedResolvedFile ||
      parentAliased !== (lexicalParentRelativePath !== resolvedParentRelativePath) ||
      failureReasons.length !== expectedFailureReasons.length ||
      failureReasons.some((entry, index) => entry !== expectedFailureReasons[index]) ||
      failureReasons.length === 0) {
      fail(`${label}.failedArtifact.filesystemObservation`, "does not prove the exact selected filesystem-object-policy failure");
    }
    const filesystemObservation = Object.freeze({
      path,
      lstatObjectType: literal(
        filesystem.lstatObjectType,
        "regular-file",
        `${label}.failedArtifact.filesystemObservation.lstatObjectType`,
      ),
      lstatByteLength,
      lstatLinkCount,
      fileResolvedRelativePath,
      lexicalParentRelativePath,
      resolvedParentRelativePath,
      resolvedInsideRepository: filesystem.resolvedInsideRepository === true
        ? true as const
        : fail(`${label}.failedArtifact.filesystemObservation.resolvedInsideRepository`, "must be true before any read"),
      parentAliased,
      fstatBefore,
      fstatAfter,
      failureReasons: Object.freeze(failureReasons),
      readMethod: literal(
        filesystem.readMethod,
        "descriptor-hash-fstat-before-after",
        `${label}.failedArtifact.filesystemObservation.readMethod`,
      ),
    });
    const failureClass = literal(
      failed.failureClass,
      "filesystem-object-policy-failure",
      `${label}.failedArtifact.failureClass`,
    );
    failedArtifact = Object.freeze({
      artifactRole,
      expected,
      observed: observedArtifact,
      filesystemObservation,
      failureClass,
    });
  } else if (row.failedArtifact !== null || kind === "artifact-filesystem-policy") {
    fail(`${label}.failedArtifact`, "must be null exactly for prelaunch resource refusal");
  }
  const inlinePathByCondition: Readonly<Record<string, string>> = Object.freeze({
    [`cond-${protocol.packetId}-prelaunch-free-space`]: "observed.resources.observedFreeBytes",
    [`cond-${protocol.packetId}-prelaunch-process-hours`]: "observed.resources.projectedPackageProcessHoursAfterAttempt",
    [`cond-${protocol.packetId}-prelaunch-storage`]: "observed.resources.projectedPackageBytesAfterAttempt",
  });
  const expectedEvidence: readonly Phase10C0VS6PreflightClassificationEvidence[] = failedArtifact === null
    ? [
      Object.freeze({
        evidenceId: `evidence-${conditionId}-inline`,
        evidenceRole: "classification-input" as const,
        retentionClass: "inline-observation" as const,
        artifact: null,
        inlineObservationPath: inlinePathByCondition[conditionId] ?? "",
      }),
      Object.freeze({
        evidenceId: "evidence-packet-protocol",
        evidenceRole: "packet-protocol" as const,
        retentionClass: "tracked-authority" as const,
        artifact: packetProtocolIdentity,
        inlineObservationPath: null,
      }),
    ]
    : [
      Object.freeze({
        evidenceId: `evidence-${conditionId}-filesystem-inline`,
        evidenceRole: "classification-input" as const,
        retentionClass: "inline-observation" as const,
        artifact: null,
        inlineObservationPath: "refusalCandidate.failedArtifact.filesystemObservation",
      }),
      Object.freeze({
        evidenceId: "evidence-packet-protocol",
        evidenceRole: "packet-protocol" as const,
        retentionClass: "tracked-authority" as const,
        artifact: packetProtocolIdentity,
        inlineObservationPath: null,
      }),
      Object.freeze({
        evidenceId: `evidence-${failedArtifact.artifactRole}-authority`,
        evidenceRole: failedArtifact.artifactRole,
        retentionClass: "tracked-authority" as const,
        artifact: failedArtifact.expected,
        inlineObservationPath: null,
      }),
    ].sort((left, right) => left.evidenceId < right.evidenceId ? -1 : 1);
  if (expectedEvidence.some((entry) => entry.inlineObservationPath === "") ||
    evidence.length !== expectedEvidence.length || evidence.some((entry, index) => {
      const expected = expectedEvidence[index]!;
      return entry.evidenceId !== expected.evidenceId || entry.evidenceRole !== expected.evidenceRole ||
        entry.retentionClass !== expected.retentionClass ||
        !sameArtifactIdentity(entry.artifact, expected.artifact) ||
        entry.inlineObservationPath !== expected.inlineObservationPath;
    })) {
    fail(`${label}.evidence`, "differs from the exact condition-specific authority/inline-observation roster");
  }
  if (row.solverLaunched !== false || row.verdict !== "refusal") {
    fail(label, "must be a no-solver refusal candidate");
  }
  return Object.freeze({
    dispositionCode,
    observation: Object.freeze({
      conditionId, kind, comparator, registeredValue, observedValue, unit,
      routeConditionMatched: true, preconditionPassed: false, evidenceIds,
    }),
    failedArtifact,
    evidence: Object.freeze(evidence),
    solverLaunched: false,
    verdict: "refusal",
  });
}

export function parsePhase10C0VS6RetainedPreflight(
  value: unknown,
  protocol: Phase10C0VS6PacketProtocol,
  packetProtocolIdentity: Phase10C0VS6ArtifactIdentity,
): Phase10C0VS6RetainedPreflight {
  const label = `${protocol.packetId} retained preflight`;
  const row = object(value, label);
  exactOrderedKeys(row, [
    "schema", "receiptId", "matrixId", "protocolId", "registryId", "packetId", "attemptId",
    "stage", "observed", "outputIds", "checkIds", "negativeControlIds", "callableIds",
    "selectedBranches", "refusalCandidate", "verdict", "reasons",
  ], label);
  const verdict = enumValue(row.verdict, ["pass", "refusal"] as const, `${label}.verdict`);
  const refusalCandidate = row.refusalCandidate === null
    ? null
    : parsePreflightRefusalCandidate(
      row.refusalCandidate,
      protocol,
      packetProtocolIdentity,
      `${label}.refusalCandidate`,
    );
  if ((verdict === "pass") !== (refusalCandidate === null)) {
    fail(label, "refusalCandidate must be null exactly on pass");
  }
  const attemptId = parsePhase10C0VS6AttemptId(row.attemptId, `${label}.attemptId`);
  const observed = object(row.observed, `${label}.observed`);
  exactOrderedKeys(observed, protocol.preflightObservedContract.observedFieldOrder, `${label}.observed`);
  const resources = object(observed.resources, `${label}.observed.resources`);
  exactOrderedKeys(resources, protocol.preflightObservedContract.resourceFieldOrder, `${label}.observed.resources`);
  const ancestry = object(observed.ancestry, `${label}.observed.ancestry`);
  exactOrderedKeys(ancestry, protocol.preflightObservedContract.ancestryFieldOrder, `${label}.observed.ancestry`);
  const selectedBranches = object(row.selectedBranches, `${label}.selectedBranches`);
  exactOrderedKeys(selectedBranches, protocol.preflightObservedContract.selectedBranchesFieldOrder, `${label}.selectedBranches`);
  const codeFreeze = object(observed.codeFreeze, `${label}.observed.codeFreeze`);
  exactOrderedKeys(codeFreeze, ["commit", "artifacts"], `${label}.observed.codeFreeze`);
  const head = stringValue(observed.head, `${label}.observed.head`);
  if (!COMMIT.test(head)) fail(`${label}.observed.head`, "must be a lowercase 40-hex commit");
  const codeFreezeCommit = stringValue(codeFreeze.commit, `${label}.observed.codeFreeze.commit`);
  if (!COMMIT.test(codeFreezeCommit)) {
    fail(`${label}.observed.codeFreeze.commit`, "must be a lowercase 40-hex implementation-freeze commit");
  }
  const codeFreezeArtifacts = parseIdentityRoster(codeFreeze.artifacts, `${label}.observed.codeFreeze.artifacts`);
  if (codeFreezeArtifacts.length === 0) fail(`${label}.observed.codeFreeze.artifacts`, "must be nonempty");
  const scienceProtocol = nullableIdentity(observed.scienceProtocol, `${label}.observed.scienceProtocol`);
  const referenceOrRefusal = nullableIdentity(observed.referenceOrRefusal, `${label}.observed.referenceOrRefusal`);
  const parsedPacketProtocol = parsePhase10C0VS6ArtifactIdentity(observed.packetProtocol, `${label}.observed.packetProtocol`);
  if (!sameArtifactIdentity(parsedPacketProtocol, packetProtocolIdentity)) fail(`${label}.observed.packetProtocol`, "differs from exact packet bytes");
  const compositeMatrix = parsePhase10C0VS6ArtifactIdentity(observed.compositeMatrix, `${label}.observed.compositeMatrix`);
  const successorSchemaRegistry = parsePhase10C0VS6ArtifactIdentity(observed.successorSchemaRegistry, `${label}.observed.successorSchemaRegistry`);
  const evidenceManifest = parsePhase10C0VS6ArtifactIdentity(
    observed.evidenceManifest,
    `${label}.observed.evidenceManifest`,
  );
  if (evidenceManifest.path !== "evidence/MANIFEST.json") {
    fail(`${label}.observed.evidenceManifest`, "must identify the exact tracked evidence manifest at launch HEAD");
  }
  const failedArtifact = refusalCandidate?.failedArtifact ?? null;
  const observedScienceExpected = failedArtifact?.artifactRole === "science-protocol"
    ? failedArtifact.observed
    : protocol.bindings.scienceProtocol;
  const observedReferenceExpected = failedArtifact?.artifactRole === "reference-or-refusal"
    ? failedArtifact.observed
    : protocol.bindings.referenceOrRefusal;
  if (!sameArtifactIdentity(compositeMatrix, protocol.bindings.matrix) ||
    !sameArtifactIdentity(successorSchemaRegistry, protocol.bindings.successorSchemaRegistry) ||
    !sameArtifactIdentity(scienceProtocol, observedScienceExpected) ||
    !sameArtifactIdentity(referenceOrRefusal, observedReferenceExpected)) {
    fail(`${label}.observed`, "bound artifact identity differs from packet protocol");
  }
  const packetCatalogue = parsePhase10C0VS6ArtifactIdentity(observed.packetCatalogue, `${label}.observed.packetCatalogue`);
  if (!sameArtifactIdentity(packetCatalogue, protocol.bindings.packetCatalogue) ||
    packetCatalogue.path !== protocol.preflightObservedContract.packetCataloguePath) {
    fail(`${label}.observed.packetCatalogue`, "differs from packet catalogue authority");
  }
  const callableRegistry = parsePhase10C0VS6ArtifactIdentity(observed.callableRegistry, `${label}.observed.callableRegistry`);
  const expectedRegistryRoot = protocol.schema === PHASE10_C0V_S6_RECOVERY_V9_PACKET_PROTOCOL_SCHEMA
    ? `${PHASE10_C0V_S6_RECOVERY_V9_AUTHORITY_ROOT}/packets`
    : protocol.schema === PHASE10_C0V_S6_RECOVERY_V8_PACKET_PROTOCOL_SCHEMA
    ? `${PHASE10_C0V_S6_RECOVERY_V8_AUTHORITY_ROOT}/packets`
    : protocol.schema === PHASE10_C0V_S6_RECOVERY_V7_PACKET_PROTOCOL_SCHEMA
    ? `${PHASE10_C0V_S6_RECOVERY_V7_AUTHORITY_ROOT}/packets`
    : protocol.schema === PHASE10_C0V_S6_RECOVERY_V6_PACKET_PROTOCOL_SCHEMA
    ? `${PHASE10_C0V_S6_RECOVERY_V6_AUTHORITY_ROOT}/packets`
    : protocol.schema === PHASE10_C0V_S6_RECOVERY_V5_PACKET_PROTOCOL_SCHEMA
    ? `${PHASE10_C0V_S6_RECOVERY_V5_AUTHORITY_ROOT}/packets`
    : protocol.schema === PHASE10_C0V_S6_RECOVERY_V4_PACKET_PROTOCOL_SCHEMA
      ? `${PHASE10_C0V_S6_RECOVERY_V4_AUTHORITY_ROOT}/packets`
    : protocol.schema === PHASE10_C0V_S6_RECOVERY_V3_PACKET_PROTOCOL_SCHEMA
      ? `${PHASE10_C0V_S6_RECOVERY_V3_AUTHORITY_ROOT}/packets`
    : protocol.schema === PHASE10_C0V_S6_RECOVERY_V2_PACKET_PROTOCOL_SCHEMA
      ? `${PHASE10_C0V_S6_RECOVERY_V2_AUTHORITY_ROOT}/packets`
    : protocol.schema === PHASE10_C0V_S6_RECOVERY_PACKET_PROTOCOL_SCHEMA
      ? `${PHASE10_C0V_S6_RECOVERY_AUTHORITY_ROOT}/packets`
      : "research/phase10-execution-v2/packets";
  const expectedRegistryPath = `${expectedRegistryRoot}/${protocol.packetId}/callable-registry.json`;
  if (!sameArtifactIdentity(callableRegistry, protocol.bindings.callableRegistry) || callableRegistry.path !== expectedRegistryPath) {
    fail(`${label}.observed.callableRegistry`, "differs from packet registry authority");
  }
  const expectedAttemptDirectory = `${protocol.paths.attemptRoot}/${attemptId}`;
  const expectedCandidateDirectory = `${expectedAttemptDirectory}/candidate`;
  const expectedVerificationPaths = protocol.paths.allowedPublicationPaths.filter((path) =>
    path.endsWith(`/${protocol.verification.filename}`));
  if (expectedVerificationPaths.length !== 1) fail(label, "protocol must expose exactly one allowed verification path");
  const verificationPaths = stringArray(observed.verificationPaths, `${label}.observed.verificationPaths`, false);
  if (verificationPaths.length !== 1 || verificationPaths[0] !== expectedVerificationPaths[0]) {
    fail(`${label}.observed.verificationPaths`, "differs from registered verification path");
  }
  const dependencyPacketIds = stringArray(observed.dependencyPacketIds, `${label}.observed.dependencyPacketIds`);
  if (dependencyPacketIds.length !== protocol.boundDependencyPacketIds.length ||
    dependencyPacketIds.some((entry, index) => entry !== protocol.boundDependencyPacketIds[index])) {
    fail(`${label}.observed.dependencyPacketIds`, "differs from packet protocol");
  }
  const dependencyArtifacts = parseIdentityRoster(observed.dependencyArtifacts, `${label}.observed.dependencyArtifacts`);
  const observedDependencyPaths = dependencyArtifacts.map((entry) => entry.path);
  const dependencyRosterMatches = phase10C0VS6DependencyArtifactRosterVariants(protocol).some((variant) => {
    const expectedDependencyPaths = variant.map((entry) => entry.artifactPath).sort();
    return observedDependencyPaths.length === expectedDependencyPaths.length &&
      observedDependencyPaths.every((entry, index) => entry === expectedDependencyPaths[index]);
  });
  if (!dependencyRosterMatches) {
    fail(`${label}.observed.dependencyArtifacts`, "differs from every exact outcome-selected dependency artifact path roster");
  }
  const packageRetainedBytesBeforeAttempt = safeInteger(
    resources.packageRetainedBytesBeforeAttempt,
    `${label}.observed.resources.packageRetainedBytesBeforeAttempt`,
  );
  const projectedPackageBytesAfterAttempt = safeInteger(
    resources.projectedPackageBytesAfterAttempt,
    `${label}.observed.resources.projectedPackageBytesAfterAttempt`,
  );
  const observedFreeBytes = safeInteger(resources.observedFreeBytes, `${label}.observed.resources.observedFreeBytes`);
  const packageElapsedNanosecondsBeforeAttempt = safeInteger(
    resources.packageElapsedNanosecondsBeforeAttempt,
    `${label}.observed.resources.packageElapsedNanosecondsBeforeAttempt`,
  );
  const projectedPackageElapsedNanosecondsAfterAttempt = safeInteger(
    resources.projectedPackageElapsedNanosecondsAfterAttempt,
    `${label}.observed.resources.projectedPackageElapsedNanosecondsAfterAttempt`,
  );
  const packageProcessHoursBeforeAttempt = finiteNumber(
    resources.packageProcessHoursBeforeAttempt,
    `${label}.observed.resources.packageProcessHoursBeforeAttempt`,
  );
  const projectedPackageProcessHoursAfterAttempt = finiteNumber(
    resources.projectedPackageProcessHoursAfterAttempt,
    `${label}.observed.resources.projectedPackageProcessHoursAfterAttempt`,
  );
  const expectedProjectedPackageElapsedNanoseconds = packageElapsedNanosecondsBeforeAttempt +
    protocol.resources.currentPacketRegisteredElapsedNanosecondsMaximum;
  if (!Number.isSafeInteger(expectedProjectedPackageElapsedNanoseconds) ||
    projectedPackageElapsedNanosecondsAfterAttempt !== expectedProjectedPackageElapsedNanoseconds ||
    packageProcessHoursBeforeAttempt !== packageElapsedNanosecondsBeforeAttempt / 3_600_000_000_000 ||
    projectedPackageProcessHoursAfterAttempt !== projectedPackageElapsedNanosecondsAfterAttempt / 3_600_000_000_000) {
    fail(`${label}.observed.resources`, "package monotonic elapsed-nanosecond projection differs");
  }
  const observedPackageStorageBaselineArtifacts = parseIdentityRoster(
    resources.packageStorageBaselineArtifacts,
    `${label}.observed.resources.packageStorageBaselineArtifacts`,
  );
  if (observedPackageStorageBaselineArtifacts.length !== protocol.resources.packageStorageBaselineArtifacts.length ||
    observedPackageStorageBaselineArtifacts.some((entry, index) =>
      !sameArtifactIdentity(entry, protocol.resources.packageStorageBaselineArtifacts[index]!))) {
    fail(`${label}.observed.resources.packageStorageBaselineArtifacts`, "differs from exact physical-copy baseline roster");
  }
  const projectedPacketBytes = protocol.resources.projectedScratchBytes + protocol.resources.projectedPublicationBytes;
  const expectedProjectedPackageBytes = packageRetainedBytesBeforeAttempt + projectedPacketBytes;
  if (!Number.isSafeInteger(projectedPacketBytes) || !Number.isSafeInteger(expectedProjectedPackageBytes) ||
    packageRetainedBytesBeforeAttempt < protocol.resources.packageStorageBaselineBytes ||
    projectedPackageBytesAfterAttempt !== expectedProjectedPackageBytes) {
    fail(`${label}.observed.resources`, "package-retained/projection/free-byte arithmetic differs");
  }
  const resourcePairs: readonly [keyof Phase10C0VS6PacketResources, unknown][] = [
    ["requiredRuntime", resources.requiredRuntime],
    ["processConcurrency", resources.processConcurrency],
    ["solverProcessConcurrency", resources.solverProcessConcurrency],
    ["solverWorkerTimeoutSeconds", resources.solverWorkerTimeoutSeconds],
    ["perExecutableControlInvocationWallHoursMaximum", resources.perExecutableControlInvocationWallHoursMaximum],
    ["outerInfrastructureOrchestrationAllowanceSeconds", resources.outerInfrastructureOrchestrationAllowanceSeconds],
    ["outerInfrastructureSafetyTimeoutSeconds", resources.outerInfrastructureSafetyTimeoutSeconds],
    ["outerInfrastructureTimingRule", resources.outerInfrastructureTimingRule],
    ["packageElapsedNanosecondsMaximum", resources.packageElapsedNanosecondsMaximum],
    ["packageProcessHoursMaximum", resources.packageProcessHoursMaximum],
    ["currentPacketRegisteredElapsedNanosecondsMaximum", resources.currentPacketRegisteredElapsedNanosecondsMaximum],
    ["currentPacketRegisteredProcessHoursMaximum", resources.currentPacketRegisteredProcessHoursMaximum],
    ["attemptRootWritePolicy", resources.attemptRootWritePolicy],
    ["transientCopyAccounting", resources.transientCopyAccounting],
    ["filesystemObjectPolicy", resources.filesystemObjectPolicy],
    ["publicationTransitionPolicy", resources.publicationTransitionPolicy],
    ["lockLifetimePolicy", resources.lockLifetimePolicy],
    ["lockAcquisitionPolicy", resources.lockAcquisitionPolicy],
    ["packageStorageAccountingRule", resources.packageStorageAccountingRule],
    ["packageStorageBaselineBytes", resources.packageStorageBaselineBytes],
    ["retainedStorageBytesMaximum", resources.retainedStorageBytesMaximum],
    ["projectedScratchBytes", resources.projectedScratchBytes],
    ["projectedPublicationBytes", resources.projectedPublicationBytes],
    ["minimumFreeBytes", resources.minimumFreeBytes],
    ["automaticRetry", resources.automaticRetry],
    ["automaticRefinementOrFanOut", resources.automaticRefinementOrFanOut],
  ];
  if (resourcePairs.some(([key, actual]) => actual !== protocol.resources[key]) ||
    !Array.isArray(resources.publicationFinalizationProjections) ||
    JSON.stringify(resources.publicationFinalizationProjections) !==
      JSON.stringify(protocol.resources.publicationFinalizationProjections) ||
    resources.nasOrNetworkAccess !== false) {
    fail(`${label}.observed.resources`, "differs from packet authority");
  }
  const failedResourceConditionIds = Object.freeze([
    ...(observedFreeBytes < protocol.resources.minimumFreeBytes || observedFreeBytes < projectedPacketBytes
      ? [`cond-${protocol.packetId}-prelaunch-free-space`] : []),
    ...(projectedPackageElapsedNanosecondsAfterAttempt > protocol.resources.packageElapsedNanosecondsMaximum
      ? [`cond-${protocol.packetId}-prelaunch-process-hours`] : []),
    ...(projectedPackageBytesAfterAttempt > protocol.resources.retainedStorageBytesMaximum
      ? [`cond-${protocol.packetId}-prelaunch-storage`] : []),
  ]);
  if (verdict === "pass" && failedResourceConditionIds.length !== 0) {
    fail(`${label}.observed.resources`, "a passing receipt has a failed registered resource condition");
  }
  if (refusalCandidate?.dispositionCode === "prelaunch-resource-refusal" &&
    (failedResourceConditionIds.length !== 1 ||
      failedResourceConditionIds[0] !== refusalCandidate.observation.conditionId)) {
    fail(`${label}.refusalCandidate.observation`, "must select the sole failed registered resource condition");
  }
  if (refusalCandidate?.dispositionCode === "preproduction-artifact-refusal" &&
    failedResourceConditionIds.length !== 0) {
    fail(`${label}.refusalCandidate`, "artifact refusal requires every resource condition to pass");
  }
  if (refusalCandidate !== null) {
    const conditionId = refusalCandidate.observation.conditionId;
    const expectedObservedValue = conditionId === `cond-${protocol.packetId}-prelaunch-free-space`
      ? observedFreeBytes
      : conditionId === `cond-${protocol.packetId}-prelaunch-process-hours`
        ? projectedPackageProcessHoursAfterAttempt
        : conditionId === `cond-${protocol.packetId}-prelaunch-storage`
          ? projectedPackageBytesAfterAttempt
          : conditionId === "cond-c0v-radial-artifact-precondition-failed"
            ? "filesystem-object-policy-failure"
            : undefined;
    if (expectedObservedValue === undefined || refusalCandidate.observation.observedValue !== expectedObservedValue) {
      fail(`${label}.refusalCandidate.observation`, "does not reproduce the exact raw observed preflight value");
    }
  }
  if (ancestry.repositoryClean !== true || ancestry.headMatchesLaunch !== true ||
    ancestry.requiredCommitsAreAncestors !== true || ancestry.boundArtifactsMatch !== true ||
    ancestry.codeFreezeMatches !== true || ancestry.verdict !== "pass" ||
    !Array.isArray(ancestry.errors) || ancestry.errors.length !== 0) {
    fail(`${label}.observed.ancestry`, "must be an independently checked empty-error pass");
  }
  const commandTemplate = protocol.commandTemplates.filter((entry) =>
    entry.commandId === protocol.preflightObservedContract.commandTemplateId);
  if (commandTemplate.length !== 1) fail(label, "must register exactly one run command template");
  const expectedCommand = commandTemplate[0]!.command;
  if (expectedCommand.includes("{") || expectedCommand.includes("}") || observed.command !== expectedCommand) {
    fail(`${label}.observed.command`, "differs from the exact registered run command");
  }
  const outputIds = stringArray(row.outputIds, `${label}.outputIds`);
  const checkIds = stringArray(row.checkIds, `${label}.checkIds`);
  const negativeControlIds = stringArray(row.negativeControlIds, `${label}.negativeControlIds`);
  const refusalSubroute = refusalCandidate === null ? null : protocol.terminalSubroutes.find((entry) =>
    entry.dispositionCode === refusalCandidate.dispositionCode);
  if (refusalCandidate !== null && refusalSubroute === undefined) {
    fail(`${label}.refusalCandidate.dispositionCode`, "has no exact packet terminal subroute");
  }
  for (const [actual, expected, rosterLabel] of [
    [outputIds, refusalSubroute?.requiredOutputIds ?? protocol.registeredOutputIds, "outputIds"],
    [checkIds, refusalSubroute?.requiredCheckIds ?? protocol.registeredCheckIds, "checkIds"],
    [negativeControlIds, refusalSubroute?.requiredNegativeControlIds ?? protocol.registeredNegativeControlIds, "negativeControlIds"],
  ] as const) {
    if (actual.length !== expected.length || actual.some((entry, index) => entry !== expected[index])) {
      fail(`${label}.${rosterLabel}`, "differs from packet protocol");
    }
  }
  const callableIds = stringArray(row.callableIds, `${label}.callableIds`);
  if (callableIds.length === 0) fail(`${label}.callableIds`, "must be nonempty");
  const reasons = stringArray(row.reasons, `${label}.reasons`, false);
  if ((verdict === "pass" && reasons.length !== 0) ||
    (verdict === "refusal" && (reasons.length !== 1 || reasons[0] !== refusalCandidate!.observation.conditionId))) {
    fail(`${label}.reasons`, "must be empty on pass or the sole exact refusal condition ID");
  }
  const retainedReasons: readonly [] | readonly [string] = verdict === "pass"
    ? Object.freeze([])
    : Object.freeze([reasons[0]!]);
  const receiptId = stringValue(row.receiptId, `${label}.receiptId`);
  if (receiptId !== `phase10-${protocol.packetId}-${attemptId}-preflight-v2`) {
    fail(`${label}.receiptId`, "differs from packet/attempt-derived identity");
  }
  const parsedDisposition = selectedBranches.s5ArtifactDisposition === null ? null : enumValue(
    selectedBranches.s5ArtifactDisposition,
    ["reference-frozen", "reference-discrepancy-refusal", "reference-refusal"] as const,
    `${label}.selectedBranches.s5ArtifactDisposition`,
  );
  const parsedRoute = selectedBranches.selectedRouteId === null
    ? null
    : stringValue(selectedBranches.selectedRouteId, `${label}.selectedBranches.selectedRouteId`);
  if (parsedRoute !== protocol.selectedRouteId || parsedDisposition !== protocol.s5ArtifactDisposition) {
    fail(`${label}.selectedBranches`, "differs from packet route authority");
  }
  if (row.schema !== "phase10-c0v-s6-preflight-receipt-v2" || row.matrixId !== protocol.matrixId ||
    row.protocolId !== protocol.protocolId || row.registryId !== protocol.registryId ||
    row.packetId !== protocol.packetId || attemptId !== protocol.registeredAttemptId ||
    row.stage !== "run" ||
    observed.launchClass !== protocol.preflightObservedContract.launchClass ||
    observed.executionMode !== protocol.executionMode || observed.selectedRouteId !== protocol.selectedRouteId ||
    observed.branch !== protocol.ancestryAuthority.launchBranch || observed.runtime !== protocol.resources.requiredRuntime ||
    observed.cwd !== "." || observed.repositoryBundleRoot !== "." ||
    observed.registeredAttemptRoot !== protocol.paths.attemptRoot || observed.attemptDirectory !== expectedAttemptDirectory ||
    observed.candidateDirectory !== expectedCandidateDirectory || observed.stdoutPath !== `${expectedAttemptDirectory}/stdout.log` ||
    observed.stderrPath !== `${expectedAttemptDirectory}/stderr.log` || observed.exitStatusPath !== `${expectedAttemptDirectory}/exit-status.json` ||
    observed.packageLockPath !== protocol.paths.packageLockPath || observed.lockPath !== protocol.paths.lockPath ||
    observed.finalPreflightReceiptPath !== protocol.paths.preflightReceiptPath ||
    observed.finalTerminalReceiptPath !== protocol.paths.terminalReceiptPath) {
    fail(label, "identity, route, runtime, or path authority differs");
  }
  const normalizedResourceValues: Readonly<Record<string, unknown>> = Object.freeze({
    ...protocol.resources,
    packageStorageBaselineArtifacts: observedPackageStorageBaselineArtifacts,
    packageElapsedNanosecondsBeforeAttempt,
    projectedPackageElapsedNanosecondsAfterAttempt,
    packageProcessHoursBeforeAttempt,
    projectedPackageProcessHoursAfterAttempt,
    packageRetainedBytesBeforeAttempt,
    projectedPackageBytesAfterAttempt,
    observedFreeBytes,
    nasOrNetworkAccess: false,
  });
  const normalizedResources = Object.freeze(Object.fromEntries(
    protocol.preflightObservedContract.resourceFieldOrder.map((field) => {
      if (!(field in normalizedResourceValues)) {
        fail(`${label}.observed.resources`, `normalization lacks ${field}`);
      }
      return [field, normalizedResourceValues[field]];
    }),
  )) as unknown as Phase10C0VS6RetainedPreflight["observed"]["resources"];
  return Object.freeze({
    schema: "phase10-c0v-s6-preflight-receipt-v2",
    receiptId,
    matrixId: protocol.matrixId,
    protocolId: protocol.protocolId,
    registryId: protocol.registryId,
    packetId: protocol.packetId,
    attemptId,
    stage: "run",
    observed: Object.freeze({
      launchClass: protocol.preflightObservedContract.launchClass,
      executionMode: protocol.executionMode,
      selectedRouteId: protocol.selectedRouteId,
      branch: protocol.ancestryAuthority.launchBranch,
      head,
      runtime: protocol.resources.requiredRuntime,
      command: expectedCommand,
      cwd: ".",
      repositoryBundleRoot: ".",
      compositeMatrix,
      packetCatalogue,
      successorSchemaRegistry,
      evidenceManifest,
      scienceProtocol,
      referenceOrRefusal,
      packetProtocol: parsedPacketProtocol,
      callableRegistry,
      codeFreeze: Object.freeze({ commit: codeFreezeCommit, artifacts: codeFreezeArtifacts }),
      registeredAttemptRoot: protocol.paths.attemptRoot,
      attemptDirectory: expectedAttemptDirectory,
      candidateDirectory: expectedCandidateDirectory,
      stdoutPath: `${expectedAttemptDirectory}/stdout.log`,
      stderrPath: `${expectedAttemptDirectory}/stderr.log`,
      exitStatusPath: `${expectedAttemptDirectory}/exit-status.json`,
      packageLockPath: protocol.paths.packageLockPath,
      lockPath: protocol.paths.lockPath,
      finalPreflightReceiptPath: protocol.paths.preflightReceiptPath,
      finalTerminalReceiptPath: protocol.paths.terminalReceiptPath,
      verificationPaths,
      dependencyPacketIds,
      dependencyArtifacts,
      resources: normalizedResources,
      ancestry: Object.freeze({
        repositoryClean: true, headMatchesLaunch: true, requiredCommitsAreAncestors: true,
        boundArtifactsMatch: true, codeFreezeMatches: true, verdict: "pass", errors: Object.freeze([]),
      }),
    }),
    outputIds,
    checkIds,
    negativeControlIds,
    callableIds,
    selectedBranches: Object.freeze({ selectedRouteId: parsedRoute, s5ArtifactDisposition: parsedDisposition }),
    refusalCandidate,
    verdict,
    reasons: retainedReasons,
  }) as Phase10C0VS6RetainedPreflight;
}

export function derivePhase10C0VS6RadialLifecycleAuthority(
  packetProtocolIdentity: Phase10C0VS6ArtifactIdentity,
  packetProtocolBytes: Uint8Array,
  preflightBytes: Uint8Array,
): Readonly<{
  packet: Phase10C0VS6RadialPacketAuthority;
  preflight: Phase10C0VS6RetainedPreflight;
}> {
  const actualPacketIdentity = phase10C0VS6ArtifactIdentityFromBytes(packetProtocolIdentity.path, packetProtocolBytes);
  if (!sameArtifactIdentity(actualPacketIdentity, packetProtocolIdentity)) fail("radial packet protocol", "identity differs from raw bytes");
  const parsed = parsePhase10C0VS6PacketProtocol(
    parsePhase10C0VS6PrettyJsonBytes(packetProtocolBytes, "radial packet protocol"),
  );
  if (parsed.packetId !== "c0v-radial-produce" || parsed.executionMode !== "radial-production" ||
    parsed.radialBinaryLayout === null || parsed.radialProducerSummary === null) {
    fail("radial packet protocol", "does not select exact radial production authority");
  }
  const packet = parsed as Phase10C0VS6RadialPacketAuthority;
  const preflight = parsePhase10C0VS6RetainedPreflight(
    parsePhase10C0VS6PrettyJsonBytes(preflightBytes, "radial retained preflight"),
    packet,
    packetProtocolIdentity,
  );
  if (preflight.verdict !== "pass") {
    fail("radial packet preflight", "must be a retained pass before numerical evaluation");
  }
  return Object.freeze({ packet, preflight });
}

export function validatePhase10C0VS6RetainedPreflightRegistryContext(
  preflight: Phase10C0VS6RetainedPreflight,
  registry: Phase10C0VS6CallableRegistry,
  registryIdentity: Phase10C0VS6ArtifactIdentity,
  expectedImplementationFreezeCommit: string,
  implementationFreezeIsAncestorOfLaunchHead: boolean,
  expectedCodeFreezeArtifacts: readonly Phase10C0VS6ArtifactIdentity[],
): void {
  const label = `${preflight.packetId} retained preflight registry context`;
  if (!COMMIT.test(expectedImplementationFreezeCommit) ||
    preflight.observed.codeFreeze.commit !== expectedImplementationFreezeCommit) {
    fail(label, "implementation-freeze commit differs from independently derived first-introduction commit");
  }
  if (!implementationFreezeIsAncestorOfLaunchHead) {
    fail(label, "implementation-freeze commit is not an ancestor of the independently observed launch head");
  }
  if (!sameArtifactIdentity(preflight.observed.callableRegistry, registryIdentity) ||
    !sameArtifactIdentity(registryIdentity, preflight.observed.callableRegistry) ||
    registry.registryId !== preflight.registryId || registry.protocolId !== preflight.protocolId ||
    registry.packetId !== preflight.packetId || registry.callables.some((entry) => entry.resolution !== "resolved")) {
    fail(label, "registry identity, scope, or resolution differs");
  }
  const callableIds = registry.callables.map((entry) => entry.callableId).sort();
  if (callableIds.length !== preflight.callableIds.length ||
    callableIds.some((entry, index) => entry !== preflight.callableIds[index])) {
    fail(label, "callable roster differs");
  }
  const expected = [...expectedCodeFreezeArtifacts].sort((left, right) => left.path < right.path ? -1 : left.path > right.path ? 1 : 0);
  if (expected.length === 0 || expected.some((entry, index) =>
    index > 0 && expected[index - 1]!.path === entry.path)) fail(label, "expected code-freeze roster is empty or duplicated");
  const observed = preflight.observed.codeFreeze.artifacts;
  if (observed.length !== expected.length || observed.some((entry, index) => !sameArtifactIdentity(entry, expected[index]!))) {
    fail(label, "code-freeze import closure differs");
  }
  for (const callable of registry.callables) {
    if (callable.identity === null || !observed.some((artifact) =>
      artifact.path === callable.modulePath && artifact.byteLength === callable.identity!.byteLength &&
      artifact.sha256 === callable.identity!.sha256)) {
      fail(label, `${callable.callableId} module identity is absent from the code-freeze closure`);
    }
  }
}

export function parsePhase10C0VS6PacketCatalogue(value: unknown): Phase10C0VS6PacketCatalogue {
  const label = "packet catalogue";
  const row = object(value, label);
  const schema = enumValue(
    row.schema,
    [
      PHASE10_C0V_S6_PACKET_CATALOGUE_SCHEMA,
      PHASE10_C0V_S6_RECOVERY_PACKET_CATALOGUE_SCHEMA,
      PHASE10_C0V_S6_RECOVERY_V2_PACKET_CATALOGUE_SCHEMA,
      PHASE10_C0V_S6_RECOVERY_V3_PACKET_CATALOGUE_SCHEMA,
      PHASE10_C0V_S6_RECOVERY_V4_PACKET_CATALOGUE_SCHEMA,
      PHASE10_C0V_S6_RECOVERY_V5_PACKET_CATALOGUE_SCHEMA,
      PHASE10_C0V_S6_RECOVERY_V6_PACKET_CATALOGUE_SCHEMA,
      PHASE10_C0V_S6_RECOVERY_V7_PACKET_CATALOGUE_SCHEMA,
      PHASE10_C0V_S6_RECOVERY_V8_PACKET_CATALOGUE_SCHEMA,
      PHASE10_C0V_S6_RECOVERY_V9_PACKET_CATALOGUE_SCHEMA,
    ] as const,
    `${label}.schema`,
  );
  const generation: Phase10C0VS6AuthorityGeneration =
    schema === PHASE10_C0V_S6_RECOVERY_V9_PACKET_CATALOGUE_SCHEMA
      ? "recovery-v9"
      : schema === PHASE10_C0V_S6_RECOVERY_V8_PACKET_CATALOGUE_SCHEMA
      ? "recovery-v8"
      : schema === PHASE10_C0V_S6_RECOVERY_V7_PACKET_CATALOGUE_SCHEMA
      ? "recovery-v7"
      : schema === PHASE10_C0V_S6_RECOVERY_V6_PACKET_CATALOGUE_SCHEMA
      ? "recovery-v6"
      : schema === PHASE10_C0V_S6_RECOVERY_V5_PACKET_CATALOGUE_SCHEMA
      ? "recovery-v5"
      : schema === PHASE10_C0V_S6_RECOVERY_V4_PACKET_CATALOGUE_SCHEMA
        ? "recovery-v4"
      : schema === PHASE10_C0V_S6_RECOVERY_V3_PACKET_CATALOGUE_SCHEMA
        ? "recovery-v3"
      : schema === PHASE10_C0V_S6_RECOVERY_V2_PACKET_CATALOGUE_SCHEMA
        ? "recovery-v2"
      : schema === PHASE10_C0V_S6_RECOVERY_PACKET_CATALOGUE_SCHEMA
        ? "recovery-v1"
        : "base";
  const recovery = generation !== "base";
  const recoveryV2 = generation === "recovery-v2";
  const recoveryV3 = generation === "recovery-v3";
  const recoveryV4 = generation === "recovery-v4";
  const recoveryV5 = generation === "recovery-v5";
  const recoveryV6 = generation === "recovery-v6";
  const recoveryV7 = generation === "recovery-v7";
  const recoveryV8 = generation === "recovery-v8";
  const recoveryV9 = generation === "recovery-v9";
  const modernRecovery = recoveryV2 || recoveryV3 || recoveryV4 || recoveryV5 || recoveryV6 || recoveryV7 || recoveryV8 || recoveryV9;
  exactKeys(row, [
    "schema", "catalogueId", "matrixId", "packageLockPath", "packageLockRule",
    "runtimeEntrypoints", "runtimeLoaderContract", "workerTransportContract", "packets",
    ...(recovery ? ["recoveryAuthority"] : []),
  ], label);
  const recoveryAuthority = recovery
    ? parsePhase10C0VS6ArtifactIdentity(row.recoveryAuthority, `${label}.recoveryAuthority`)
    : null;
  const expectedRecoveryAuthorityPath = recoveryV9
    ? PHASE10_C0V_S6_RECOVERY_V9_AUTHORITY_PATH
    : recoveryV8
    ? PHASE10_C0V_S6_RECOVERY_V8_AUTHORITY_PATH
    : recoveryV7
    ? PHASE10_C0V_S6_RECOVERY_V7_AUTHORITY_PATH
    : recoveryV6
    ? PHASE10_C0V_S6_RECOVERY_V6_AUTHORITY_PATH
    : recoveryV5
    ? PHASE10_C0V_S6_RECOVERY_V5_AUTHORITY_PATH
    : recoveryV4
      ? PHASE10_C0V_S6_RECOVERY_V4_AUTHORITY_PATH
    : recoveryV3
      ? PHASE10_C0V_S6_RECOVERY_V3_AUTHORITY_PATH
    : recoveryV2
      ? PHASE10_C0V_S6_RECOVERY_V2_AUTHORITY_PATH
    : PHASE10_C0V_S6_RECOVERY_AUTHORITY_PATH;
  if (recoveryAuthority !== null && recoveryAuthority.path !== expectedRecoveryAuthorityPath) {
    fail(`${label}.recoveryAuthority`, "path differs from exact recovery authority");
  }
  const expectedPackageLockPath = recoveryV9
    ? PHASE10_C0V_S6_RECOVERY_V9_PACKAGE_LOCK_PATH
    : recoveryV8
    ? PHASE10_C0V_S6_RECOVERY_V8_PACKAGE_LOCK_PATH
    : recoveryV7
    ? PHASE10_C0V_S6_RECOVERY_V7_PACKAGE_LOCK_PATH
    : recoveryV6
    ? PHASE10_C0V_S6_RECOVERY_V6_PACKAGE_LOCK_PATH
    : recoveryV5
    ? PHASE10_C0V_S6_RECOVERY_V5_PACKAGE_LOCK_PATH
    : recoveryV4
      ? PHASE10_C0V_S6_RECOVERY_V4_PACKAGE_LOCK_PATH
    : recoveryV3
      ? PHASE10_C0V_S6_RECOVERY_V3_PACKAGE_LOCK_PATH
    : recoveryV2
      ? PHASE10_C0V_S6_RECOVERY_V2_PACKAGE_LOCK_PATH
    : recovery
      ? PHASE10_C0V_S6_RECOVERY_PACKAGE_LOCK_PATH
      : PHASE10_C0V_S6_PACKAGE_LOCK_PATH;
  const packageLockPath = literal(
    row.packageLockPath,
    expectedPackageLockPath,
    `${label}.packageLockPath`,
  );
  const expectedPackageLockRule = recoveryV9
    ? PHASE10_C0V_S6_RECOVERY_V9_PACKAGE_LOCK_RULE
    : recoveryV8
    ? PHASE10_C0V_S6_RECOVERY_V8_PACKAGE_LOCK_RULE
    : recoveryV7
    ? PHASE10_C0V_S6_RECOVERY_V7_PACKAGE_LOCK_RULE
    : recoveryV6
    ? PHASE10_C0V_S6_RECOVERY_V6_PACKAGE_LOCK_RULE
    : recoveryV5
    ? PHASE10_C0V_S6_RECOVERY_V5_PACKAGE_LOCK_RULE
    : recoveryV4
      ? PHASE10_C0V_S6_RECOVERY_V4_PACKAGE_LOCK_RULE
    : recoveryV3
      ? PHASE10_C0V_S6_RECOVERY_V3_PACKAGE_LOCK_RULE
    : recoveryV2
      ? PHASE10_C0V_S6_RECOVERY_V2_PACKAGE_LOCK_RULE
    : recovery
      ? PHASE10_C0V_S6_RECOVERY_PACKAGE_LOCK_RULE
      : "acquire-before-packet-lock-and-any-observation-stale-halts-all-s6";
  const packageLockRule = literal(
    row.packageLockRule,
    expectedPackageLockRule,
    `${label}.packageLockRule`,
  );
  const runtimeEntrypoints = arrayValue(
    row.runtimeEntrypoints,
    `${label}.runtimeEntrypoints`,
  ).map((entry, index) => {
    const entrypoint = object(entry, `${label}.runtimeEntrypoints[${index}]`);
    exactKeys(
      entrypoint,
      ["role", "modulePath", "exportName"],
      `${label}.runtimeEntrypoints[${index}]`,
    );
    return Object.freeze({
      role: enumValue(
        entrypoint.role,
        ["parent-executor", "worker-dispatcher"] as const,
        `${label}.runtimeEntrypoints[${index}].role`,
      ),
      modulePath: safePath(
        entrypoint.modulePath,
        `${label}.runtimeEntrypoints[${index}].modulePath`,
      ),
      exportName: stringValue(
        entrypoint.exportName,
        `${label}.runtimeEntrypoints[${index}].exportName`,
      ),
    });
  });
  const expectedRuntimeEntrypoints = Object.freeze([
    Object.freeze({
      role: "parent-executor" as const,
      modulePath: "runner/src/phase10-c0v-s6-executor.ts" as const,
      exportName: "phase10C0VS6RunExecutor" as const,
    }),
    Object.freeze({
      role: "worker-dispatcher" as const,
      modulePath: "runner/src/phase10-c0v-s6-executor-worker.ts" as const,
      exportName: "phase10C0VS6ExecutorWorker" as const,
    }),
  ] as const);
  if (runtimeEntrypoints.length !== expectedRuntimeEntrypoints.length ||
    runtimeEntrypoints.some((entry, index) => {
      const expected = expectedRuntimeEntrypoints[index]!;
      return entry.role !== expected.role || entry.modulePath !== expected.modulePath ||
        entry.exportName !== expected.exportName;
    })) {
    fail(`${label}.runtimeEntrypoints`, "differs from exact parent-executor then worker-dispatcher authority");
  }
  const runtimeLoader = object(row.runtimeLoaderContract, `${label}.runtimeLoaderContract`);
  exactKeys(runtimeLoader, [
    "schema", "execArgvRule", "forbiddenEnvironmentKeyRule", "exactWorkerEnvironment",
    "workerEnvironmentRule", "preflightRecordingRule", "entryObservationScopeRule",
  ], `${label}.runtimeLoaderContract`);
  const recoveryV1WorkerEnvironment = Object.freeze([
    Object.freeze({ key: "GIT_CONFIG_GLOBAL", value: "NUL" }),
    Object.freeze({ key: "GIT_CONFIG_NOSYSTEM", value: "1" }),
    Object.freeze({ key: "GIT_OPTIONAL_LOCKS", value: "0" }),
    Object.freeze({ key: "GIT_TERMINAL_PROMPT", value: "0" }),
    Object.freeze({ key: "LC_ALL", value: "C" }),
    Object.freeze({ key: "PATH", value: "C:\\Program Files\\Git\\cmd" }),
    Object.freeze({ key: "PATHEXT", value: ".COM;.EXE" }),
    Object.freeze({ key: "SYSTEMROOT", value: "C:\\WINDOWS" }),
  ]);
  const expectedWorkerEnvironment = modernRecovery
    ? Object.freeze([
      ...recoveryV1WorkerEnvironment.slice(0, 4),
      Object.freeze({ key: "HOMEDRIVE", value: "" }),
      Object.freeze({ key: "HOMEPATH", value: "" }),
      recoveryV1WorkerEnvironment[4]!,
      Object.freeze({ key: "LOGONSERVER", value: "" }),
      ...recoveryV1WorkerEnvironment.slice(5, 7),
      Object.freeze({ key: "SYSTEMDRIVE", value: "" }),
      recoveryV1WorkerEnvironment[7]!,
      Object.freeze({ key: "TEMP", value: "" }),
      Object.freeze({ key: "USERDOMAIN", value: "" }),
      Object.freeze({ key: "USERNAME", value: "" }),
      Object.freeze({ key: "USERPROFILE", value: "" }),
      Object.freeze({ key: "WINDIR", value: "" }),
    ])
    : recoveryV1WorkerEnvironment;
  const exactWorkerEnvironment = arrayValue(
    runtimeLoader.exactWorkerEnvironment,
    `${label}.runtimeLoaderContract.exactWorkerEnvironment`,
  ).map((entry, index) => {
    const environmentLabel = `${label}.runtimeLoaderContract.exactWorkerEnvironment[${index}]`;
    const environmentRow = object(entry, environmentLabel);
    exactKeys(environmentRow, ["key", "value"], environmentLabel);
    if (typeof environmentRow.value !== "string") {
      fail(`${environmentLabel}.value`, "must be a string");
    }
    return Object.freeze({
      key: stringValue(environmentRow.key, `${environmentLabel}.key`),
      value: modernRecovery
        ? environmentRow.value
        : stringValue(environmentRow.value, `${environmentLabel}.value`),
    });
  });
  if (exactWorkerEnvironment.length !== expectedWorkerEnvironment.length ||
    exactWorkerEnvironment.some((entry, index) =>
      entry.key !== expectedWorkerEnvironment[index]!.key ||
      entry.value !== expectedWorkerEnvironment[index]!.value)) {
    fail(`${label}.runtimeLoaderContract.exactWorkerEnvironment`,
      "differs from the exact clean child environment");
  }
  const runtimeLoaderContract: Phase10C0VS6RuntimeLoaderContract = Object.freeze({
    schema: literal(
      runtimeLoader.schema,
      "phase10-c0v-s6-runtime-loader-contract-v1",
      `${label}.runtimeLoaderContract.schema`,
    ),
    execArgvRule: literal(
      runtimeLoader.execArgvRule,
      "parent-and-worker-process-exec-argv-exact-empty-array",
      `${label}.runtimeLoaderContract.execArgvRule`,
    ),
    forbiddenEnvironmentKeyRule: literal(
      runtimeLoader.forbiddenEnvironmentKeyRule,
      "ascii-uppercase-equals-NODE-or-TS_NODE-or-starts-NODE_-or-TS_NODE_",
      `${label}.runtimeLoaderContract.forbiddenEnvironmentKeyRule`,
    ),
    exactWorkerEnvironment: Object.freeze(exactWorkerEnvironment),
    workerEnvironmentRule: literal(
      runtimeLoader.workerEnvironmentRule,
      "parent-materializes-exact-clean-environment-worker-independently-exact-compares-complete-environment-no-ambient-clone",
      `${label}.runtimeLoaderContract.workerEnvironmentRule`,
    ),
    preflightRecordingRule: literal(
      runtimeLoader.preflightRecordingRule,
      "frozen-code-rejection-no-ambient-environment-values-serialized",
      `${label}.runtimeLoaderContract.preflightRecordingRule`,
    ),
    entryObservationScopeRule: literal(
      runtimeLoader.entryObservationScopeRule,
      "visible-at-entry-loader-state-enforced-deliberate-trace-erasure-outside-registered-threat-model",
      `${label}.runtimeLoaderContract.entryObservationScopeRule`,
    ),
  });
  const workerTransport = object(
    row.workerTransportContract,
    `${label}.workerTransportContract`,
  );
  exactKeys(workerTransport, [
    "schema", "transport", "maximumLineBytes", "maximumStderrBytes", "parentToChild", "childToParent",
    "sequenceRule", "bytePayloadMarkerKey", "bytePayloadRule", "acknowledgementRule",
    "retainedAuthorityRule", "stderrRule",
  ], `${label}.workerTransportContract`);
  const parentToChild = object(
    workerTransport.parentToChild,
    `${label}.workerTransportContract.parentToChild`,
  );
  exactKeys(parentToChild, [
    "schema", "exactFields", "kindValues", "nullabilityRule",
  ], `${label}.workerTransportContract.parentToChild`);
  const childToParent = object(
    workerTransport.childToParent,
    `${label}.workerTransportContract.childToParent`,
  );
  exactKeys(childToParent, [
    "schema", "exactFields", "kindValues", "nullabilityRule",
  ], `${label}.workerTransportContract.childToParent`);
  const workerTransportContract: Phase10C0VS6WorkerTransportContract = Object.freeze({
    schema: literal(
      workerTransport.schema,
      "phase10-c0v-s6-worker-transport-contract-v1",
      `${label}.workerTransportContract.schema`,
    ),
    transport: literal(
      workerTransport.transport,
      "blocking-fd0-command-fd1-message-canonical-compact-jsonl",
      `${label}.workerTransportContract.transport`,
    ),
    maximumLineBytes: (() => {
      const value = safeInteger(
        workerTransport.maximumLineBytes,
        `${label}.workerTransportContract.maximumLineBytes`,
        1,
      );
      if (value !== 33_554_432) {
        fail(`${label}.workerTransportContract.maximumLineBytes`, "must equal 33554432");
      }
      return 33_554_432 as const;
    })(),
    maximumStderrBytes: (() => {
      const value = safeInteger(
        workerTransport.maximumStderrBytes,
        `${label}.workerTransportContract.maximumStderrBytes`,
        1,
      );
      if (value !== 33_554_432) {
        fail(`${label}.workerTransportContract.maximumStderrBytes`, "must equal 33554432");
      }
      return 33_554_432 as const;
    })(),
    parentToChild: Object.freeze({
      schema: literal(
        parentToChild.schema,
        "phase10-c0v-s6-worker-command-v1",
        `${label}.workerTransportContract.parentToChild.schema`,
      ),
      exactFields: exactStringArray(
        parentToChild.exactFields,
        [
          "schema", "sequence", "packetId", "attemptId", "kind", "invocationId",
          "acknowledgedWorkerSequence",
        ] as const,
        `${label}.workerTransportContract.parentToChild.exactFields`,
      ) as Phase10C0VS6WorkerTransportContract["parentToChild"]["exactFields"],
      kindValues: exactStringArray(
        parentToChild.kindValues,
        ["invoke", "acknowledge", "stop"] as const,
        `${label}.workerTransportContract.parentToChild.kindValues`,
      ) as Phase10C0VS6WorkerTransportContract["parentToChild"]["kindValues"],
      nullabilityRule: literal(
        parentToChild.nullabilityRule,
        "invoke-id-nonnull-ack-null_acknowledge-both-nonnull_stop-both-null",
        `${label}.workerTransportContract.parentToChild.nullabilityRule`,
      ),
    }),
    childToParent: Object.freeze({
      schema: literal(
        childToParent.schema,
        "phase10-c0v-s6-worker-message-v1",
        `${label}.workerTransportContract.childToParent.schema`,
      ),
      exactFields: exactStringArray(
        childToParent.exactFields,
        ["schema", "sequence", "packetId", "attemptId", "kind", "invocationId", "payload"] as const,
        `${label}.workerTransportContract.childToParent.exactFields`,
      ) as Phase10C0VS6WorkerTransportContract["childToParent"]["exactFields"],
      kindValues: exactStringArray(
        childToParent.kindValues,
        ["ready", "boundary", "progress", "artifact", "result", "stopped", "error"] as const,
        `${label}.workerTransportContract.childToParent.kindValues`,
      ) as Phase10C0VS6WorkerTransportContract["childToParent"]["kindValues"],
      nullabilityRule: literal(
        childToParent.nullabilityRule,
        "ready-stopped-both-null_boundary-progress-artifact-result-both-nonnull_error-payload-nonnull-id-nullable",
        `${label}.workerTransportContract.childToParent.nullabilityRule`,
      ),
    }),
    sequenceRule: literal(
      workerTransport.sequenceRule,
      "independent-zero-based-contiguous-safe-integer-per-direction",
      `${label}.workerTransportContract.sequenceRule`,
    ),
    bytePayloadMarkerKey: literal(
      workerTransport.bytePayloadMarkerKey,
      "$phase10C0VS6Bytes",
      `${label}.workerTransportContract.bytePayloadMarkerKey`,
    ),
    bytePayloadRule: literal(
      workerTransport.bytePayloadRule,
      "uint8array-only-one-key-canonical-base64-object-recursive-finite-json",
      `${label}.workerTransportContract.bytePayloadRule`,
    ),
    acknowledgementRule: literal(
      workerTransport.acknowledgementRule,
      "boundary-and-artifact-callback-return-only-after-exact-scoped-parent-acknowledgement",
      `${label}.workerTransportContract.acknowledgementRule`,
    ),
    retainedAuthorityRule: literal(
      workerTransport.retainedAuthorityRule,
      "parent-synthesizes-all-retained-time-timing-terminal-fields-child-stdout-never-authoritative",
      `${label}.workerTransportContract.retainedAuthorityRule`,
    ),
    stderrRule: literal(
      workerTransport.stderrRule,
      "diagnostics-only-never-evidence-or-route-authority",
      `${label}.workerTransportContract.stderrRule`,
    ),
  });
  const packets = arrayValue(row.packets, `${label}.packets`).map((entry, index) => {
    const packet = object(entry, `${label}.packets[${index}]`);
    exactKeys(packet, ["packetId", "protocolPath", "callableRegistryPath", "attemptRoot", "lockPath", "preflightReceiptPath", "terminalReceiptPath", "verificationPath", "verificationFilename", "verificationSchemaId", "maximumStdoutBytes", "maximumOtherAttemptRootBytes", "stdoutMessageByteBudget"], `${label}.packets[${index}]`);
    const stdoutBudgetRow = object(
      packet.stdoutMessageByteBudget,
      `${label}.packets[${index}].stdoutMessageByteBudget`,
    );
    exactKeys(stdoutBudgetRow, [
      "lifecycleLineBytesMaximum", "boundaryOrProgressLineBytesMaximum",
      "artifactLineBytesMaximum", "resultLineBytesMaximum", "lifecycleLineCountMaximum",
      "boundaryOrProgressLineCountMaximum", "artifactLineCountMaximum",
      "resultLineCountMaximum", "derivedMaximumBytes",
    ], `${label}.packets[${index}].stdoutMessageByteBudget`);
    const stdoutMessageByteBudget = Object.freeze({
      lifecycleLineBytesMaximum: safeInteger(
        stdoutBudgetRow.lifecycleLineBytesMaximum,
        `${label}.packets[${index}].stdoutMessageByteBudget.lifecycleLineBytesMaximum`,
        1,
      ),
      boundaryOrProgressLineBytesMaximum: safeInteger(
        stdoutBudgetRow.boundaryOrProgressLineBytesMaximum,
        `${label}.packets[${index}].stdoutMessageByteBudget.boundaryOrProgressLineBytesMaximum`,
        1,
      ),
      artifactLineBytesMaximum: safeInteger(
        stdoutBudgetRow.artifactLineBytesMaximum,
        `${label}.packets[${index}].stdoutMessageByteBudget.artifactLineBytesMaximum`,
        1,
      ),
      resultLineBytesMaximum: safeInteger(
        stdoutBudgetRow.resultLineBytesMaximum,
        `${label}.packets[${index}].stdoutMessageByteBudget.resultLineBytesMaximum`,
        1,
      ),
      lifecycleLineCountMaximum: safeInteger(
        stdoutBudgetRow.lifecycleLineCountMaximum,
        `${label}.packets[${index}].stdoutMessageByteBudget.lifecycleLineCountMaximum`,
        1,
      ),
      boundaryOrProgressLineCountMaximum: safeInteger(
        stdoutBudgetRow.boundaryOrProgressLineCountMaximum,
        `${label}.packets[${index}].stdoutMessageByteBudget.boundaryOrProgressLineCountMaximum`,
      ),
      artifactLineCountMaximum: safeInteger(
        stdoutBudgetRow.artifactLineCountMaximum,
        `${label}.packets[${index}].stdoutMessageByteBudget.artifactLineCountMaximum`,
      ),
      resultLineCountMaximum: safeInteger(
        stdoutBudgetRow.resultLineCountMaximum,
        `${label}.packets[${index}].stdoutMessageByteBudget.resultLineCountMaximum`,
        1,
      ),
      derivedMaximumBytes: safeInteger(
        stdoutBudgetRow.derivedMaximumBytes,
        `${label}.packets[${index}].stdoutMessageByteBudget.derivedMaximumBytes`,
        1,
      ),
    });
    return Object.freeze({
      packetId: parsePacketId(packet.packetId, `${label}.packets[${index}].packetId`),
      protocolPath: safePath(packet.protocolPath, `${label}.packets[${index}].protocolPath`),
      callableRegistryPath: safePath(packet.callableRegistryPath, `${label}.packets[${index}].callableRegistryPath`),
      attemptRoot: safePath(packet.attemptRoot, `${label}.packets[${index}].attemptRoot`),
      lockPath: safePath(packet.lockPath, `${label}.packets[${index}].lockPath`),
      preflightReceiptPath: safePath(packet.preflightReceiptPath, `${label}.packets[${index}].preflightReceiptPath`),
      terminalReceiptPath: safePath(packet.terminalReceiptPath, `${label}.packets[${index}].terminalReceiptPath`),
      verificationPath: safePath(packet.verificationPath, `${label}.packets[${index}].verificationPath`),
      verificationFilename: stringValue(packet.verificationFilename, `${label}.packets[${index}].verificationFilename`),
      verificationSchemaId: stringValue(packet.verificationSchemaId, `${label}.packets[${index}].verificationSchemaId`),
      maximumStdoutBytes: safeInteger(
        packet.maximumStdoutBytes,
        `${label}.packets[${index}].maximumStdoutBytes`,
        1,
      ),
      maximumOtherAttemptRootBytes: safeInteger(
        packet.maximumOtherAttemptRootBytes,
        `${label}.packets[${index}].maximumOtherAttemptRootBytes`,
        1,
      ),
      stdoutMessageByteBudget,
    });
  });
  if (packets.length !== PHASE10_C0V_S6_PACKET_IDS.length || packets.some((entry, index) => entry.packetId !== PHASE10_C0V_S6_PACKET_IDS[index])) fail(`${label}.packets`, "must equal exact packet order");
  const verificationByPacket: Readonly<Record<Phase10C0VS6PacketId, readonly [string, string]>> = Object.freeze({
    "a-p-c0v-s6": [
      recoveryV9
        ? "evidence/phase10-obligation-preflight-v6/verification.json"
        : recoveryV8
        ? "evidence/phase10-obligation-preflight-v6/verification.json"
        : recoveryV7
        ? "evidence/phase10-obligation-preflight-v6/verification.json"
        : recoveryV6
        ? "evidence/phase10-obligation-preflight-v6/verification.json"
        : recoveryV5
        ? "evidence/phase10-obligation-preflight-v6/verification.json"
        : recoveryV4
          ? "evidence/phase10-obligation-preflight-v5/verification.json"
        : recoveryV3
          ? "evidence/phase10-obligation-preflight-v4/verification.json"
        : recoveryV2
          ? "evidence/phase10-obligation-preflight-v3/verification.json"
        : "evidence/phase10-obligation-preflight-v2/verification.json",
      "verification.json",
    ],
    "c0v-moving-produce": [recoveryV9
      ? "evidence/phase10-obligation-preflight-v3/packets/c0v-moving-produce/verification.json"
      : "evidence/phase10-obligation-preflight-v2/packets/c0v-moving-produce/verification.json", "verification.json"],
    "c0v-moving-publish": ["evidence/phase10-numerical-verification-v1/c0v-moving-publish-verification.json", "c0v-moving-publish-verification.json"],
    "c0v-radial-produce": ["evidence/phase10-obligation-preflight-v2/packets/c0v-radial-produce/verification.json", "verification.json"],
    "c0v-radial-publish": ["evidence/phase10-numerical-verification-v1/c0v-radial-publish-verification.json", "c0v-radial-publish-verification.json"],
    "c0v-static-produce": ["evidence/phase10-obligation-preflight-v2/packets/c0v-static-produce/verification.json", "verification.json"],
    "c0v-static-publish": ["evidence/phase10-numerical-verification-v1/c0v-static-publish-verification.json", "c0v-static-publish-verification.json"],
    "c0v-aggregate": ["evidence/phase10-numerical-verification-v1/c0v-aggregate-verification.json", "c0v-aggregate-verification.json"],
  });
  const maximumOtherAttemptRootBytesByPacket: Readonly<Record<Phase10C0VS6PacketId, number>> =
    Object.freeze({
      "a-p-c0v-s6": 12_582_912,
      "c0v-moving-produce": 29_360_128,
      "c0v-moving-publish": 12_582_912,
      "c0v-radial-produce": 4_194_304,
      "c0v-radial-publish": 12_582_912,
      "c0v-static-produce": 4_194_304,
      "c0v-static-publish": 12_582_912,
      "c0v-aggregate": 12_582_912,
    });
  const stdoutMessageCountsByPacket: Readonly<
    Record<Phase10C0VS6PacketId, readonly [number, number, number]>
  > = Object.freeze({
    "a-p-c0v-s6": [0, 0, 4],
    "c0v-moving-produce": [0, 0, 1],
    "c0v-moving-publish": [0, 0, 2],
    "c0v-radial-produce": [28, 3, 2],
    "c0v-radial-publish": [0, 0, 2],
    "c0v-static-produce": [0, 0, 1],
    "c0v-static-publish": [0, 0, 2],
    "c0v-aggregate": [0, 0, 3],
  });
  for (const packet of packets) {
    const packetId = packet.packetId;
    const expectedVerification = verificationByPacket[packetId];
    const authorityPacketRoot = recoveryV9
      ? `${PHASE10_C0V_S6_RECOVERY_V9_AUTHORITY_ROOT}/packets`
      : recoveryV8
      ? `${PHASE10_C0V_S6_RECOVERY_V8_AUTHORITY_ROOT}/packets`
      : recoveryV7
      ? `${PHASE10_C0V_S6_RECOVERY_V7_AUTHORITY_ROOT}/packets`
      : recoveryV6
      ? `${PHASE10_C0V_S6_RECOVERY_V6_AUTHORITY_ROOT}/packets`
      : recoveryV5
      ? `${PHASE10_C0V_S6_RECOVERY_V5_AUTHORITY_ROOT}/packets`
      : recoveryV4
        ? `${PHASE10_C0V_S6_RECOVERY_V4_AUTHORITY_ROOT}/packets`
      : recoveryV3
        ? `${PHASE10_C0V_S6_RECOVERY_V3_AUTHORITY_ROOT}/packets`
      : recoveryV2
        ? `${PHASE10_C0V_S6_RECOVERY_V2_AUTHORITY_ROOT}/packets`
      : recovery
        ? `${PHASE10_C0V_S6_RECOVERY_AUTHORITY_ROOT}/packets`
        : "research/phase10-execution-v2/packets";
    const expectedAttemptRoot = recoveryV9
      ? `${PHASE10_C0V_S6_RECOVERY_V9_ATTEMPT_ROOT}/${packetId}`
      : recoveryV8
      ? `${PHASE10_C0V_S6_RECOVERY_V8_ATTEMPT_ROOT}/${packetId}`
      : recoveryV7
      ? `${PHASE10_C0V_S6_RECOVERY_V7_ATTEMPT_ROOT}/${packetId}`
      : recoveryV6
      ? `${PHASE10_C0V_S6_RECOVERY_V6_ATTEMPT_ROOT}/${packetId}`
      : recoveryV5
      ? `${PHASE10_C0V_S6_RECOVERY_V5_ATTEMPT_ROOT}/${packetId}`
      : recoveryV4
        ? `${PHASE10_C0V_S6_RECOVERY_V4_ATTEMPT_ROOT}/${packetId}`
      : recoveryV3
        ? `${PHASE10_C0V_S6_RECOVERY_V3_ATTEMPT_ROOT}/${packetId}`
      : recoveryV2
        ? `${PHASE10_C0V_S6_RECOVERY_V2_ATTEMPT_ROOT}/${packetId}`
      : recovery
        ? `${PHASE10_C0V_S6_RECOVERY_ATTEMPT_ROOT}/${packetId}`
        : `out/phase10-execution-v2/attempts/${packetId}`;
    const expectedLockPath = recoveryV9
      ? PHASE10_C0V_S6_RECOVERY_V9_PACKET_LOCK_PATHS[packetId]
      : recoveryV8
      ? PHASE10_C0V_S6_RECOVERY_V8_PACKET_LOCK_PATHS[packetId]
      : recoveryV7
      ? PHASE10_C0V_S6_RECOVERY_V7_PACKET_LOCK_PATHS[packetId]
      : recoveryV6
      ? PHASE10_C0V_S6_RECOVERY_V6_PACKET_LOCK_PATHS[packetId]
      : recoveryV5
      ? PHASE10_C0V_S6_RECOVERY_V5_PACKET_LOCK_PATHS[packetId]
      : recoveryV4
        ? PHASE10_C0V_S6_RECOVERY_V4_PACKET_LOCK_PATHS[packetId]
      : recoveryV3
        ? PHASE10_C0V_S6_RECOVERY_V3_PACKET_LOCK_PATHS[packetId]
      : recoveryV2
        ? PHASE10_C0V_S6_RECOVERY_V2_PACKET_LOCK_PATHS[packetId]
      : recovery
        ? PHASE10_C0V_S6_RECOVERY_PACKET_LOCK_PATHS[packetId]
        : `out/phase10-execution-v2/locks/${packetId}.lock`;
    const structuralEvidenceRoot = recoveryV9 && packetId === "c0v-moving-produce"
      ? "evidence/phase10-obligation-preflight-v3"
      : recoveryV9 && packetId === "a-p-c0v-s6"
      ? "evidence/phase10-obligation-preflight-v6"
      : recoveryV8 && packetId === "a-p-c0v-s6"
      ? "evidence/phase10-obligation-preflight-v6"
      : recoveryV7 && packetId === "a-p-c0v-s6"
      ? "evidence/phase10-obligation-preflight-v6"
      : recoveryV6 && packetId === "a-p-c0v-s6"
      ? "evidence/phase10-obligation-preflight-v6"
      : recoveryV5 && packetId === "a-p-c0v-s6"
      ? "evidence/phase10-obligation-preflight-v6"
      : recoveryV4 && packetId === "a-p-c0v-s6"
        ? "evidence/phase10-obligation-preflight-v5"
      : recoveryV3 && packetId === "a-p-c0v-s6"
        ? "evidence/phase10-obligation-preflight-v4"
      : recoveryV2 && packetId === "a-p-c0v-s6"
        ? "evidence/phase10-obligation-preflight-v3"
      : "evidence/phase10-obligation-preflight-v2";
    if (packet.protocolPath !== `${authorityPacketRoot}/${packetId}/protocol.json` ||
      packet.callableRegistryPath !== `${authorityPacketRoot}/${packetId}/callable-registry.json` ||
      packet.attemptRoot !== expectedAttemptRoot || packet.lockPath !== expectedLockPath ||
      packet.preflightReceiptPath !== `${structuralEvidenceRoot}/packets/${packetId}/preflight.json` ||
      packet.terminalReceiptPath !== `${structuralEvidenceRoot}/packets/${packetId}/terminal-receipt.json` ||
      packet.verificationPath !== expectedVerification[0] || packet.verificationFilename !== expectedVerification[1] ||
      packet.maximumStdoutBytes !== 4_194_304 ||
      packet.maximumOtherAttemptRootBytes !== maximumOtherAttemptRootBytesByPacket[packetId]) {
      fail(`${label}.packets.${packetId}`, "differs from exact packet-derived protocol/registry/attempt/lock/receipt/verification mapping");
    }
    const [boundaryOrProgressCount, artifactCount, resultCount] =
      stdoutMessageCountsByPacket[packetId];
    const stdoutBudget = packet.stdoutMessageByteBudget;
    const derivedMaximumBytes = stdoutBudget.lifecycleLineBytesMaximum *
        stdoutBudget.lifecycleLineCountMaximum +
      stdoutBudget.boundaryOrProgressLineBytesMaximum * boundaryOrProgressCount +
      stdoutBudget.artifactLineBytesMaximum * artifactCount +
      stdoutBudget.resultLineBytesMaximum * resultCount;
    if (stdoutBudget.lifecycleLineBytesMaximum !== 4_096 ||
      stdoutBudget.boundaryOrProgressLineBytesMaximum !== 16_384 ||
      stdoutBudget.artifactLineBytesMaximum !== 262_144 ||
      stdoutBudget.resultLineBytesMaximum !== 917_504 ||
      stdoutBudget.lifecycleLineCountMaximum !== 2 ||
      stdoutBudget.boundaryOrProgressLineCountMaximum !== boundaryOrProgressCount ||
      stdoutBudget.artifactLineCountMaximum !== artifactCount ||
      stdoutBudget.resultLineCountMaximum !== resultCount ||
      stdoutBudget.derivedMaximumBytes !== derivedMaximumBytes ||
      derivedMaximumBytes > packet.maximumStdoutBytes) {
      fail(`${label}.packets.${packetId}.stdoutMessageByteBudget`,
        "differs from the exact packet message-shape budget or exceeds aggregate stdout");
    }
  }
  const governedPaths = [packageLockPath, ...packets.flatMap((packet) => [
    packet.protocolPath, packet.callableRegistryPath, packet.attemptRoot, packet.lockPath,
    packet.preflightReceiptPath, packet.terminalReceiptPath, packet.verificationPath,
  ])];
  if (new Set(governedPaths).size !== governedPaths.length || governedPaths.some((path, index) =>
    governedPaths.some((other, otherIndex) => index !== otherIndex &&
      (path.startsWith(`${other}/`) || other.startsWith(`${path}/`))))) {
    fail(`${label}.packets`, "governed catalogue paths must be globally unique with no cross-packet ancestor overlap");
  }
  if (packets.some((entry) => entry.verificationSchemaId !== "phase10-packet-verification-v2")) {
    fail(`${label}.packets`, "every S6 packet must use phase10-packet-verification-v2");
  }
  return Object.freeze({
    schema,
    catalogueId: literal(row.catalogueId, recoveryV9
      ? PHASE10_C0V_S6_RECOVERY_V9_PACKET_CATALOGUE_ID
      : recoveryV8
      ? PHASE10_C0V_S6_RECOVERY_V8_PACKET_CATALOGUE_ID
      : recoveryV7
      ? PHASE10_C0V_S6_RECOVERY_V7_PACKET_CATALOGUE_ID
      : recoveryV6
      ? PHASE10_C0V_S6_RECOVERY_V6_PACKET_CATALOGUE_ID
      : recoveryV5
      ? PHASE10_C0V_S6_RECOVERY_V5_PACKET_CATALOGUE_ID
      : recoveryV4
        ? PHASE10_C0V_S6_RECOVERY_V4_PACKET_CATALOGUE_ID
      : recoveryV3
        ? PHASE10_C0V_S6_RECOVERY_V3_PACKET_CATALOGUE_ID
      : recoveryV2
        ? PHASE10_C0V_S6_RECOVERY_V2_PACKET_CATALOGUE_ID
      : recovery
        ? PHASE10_C0V_S6_RECOVERY_PACKET_CATALOGUE_ID
        : "phase10-c0v-s6-execution-v2-packet-paths-v1", `${label}.catalogueId`),
    matrixId: literal(row.matrixId, PHASE10_C0V_S6_MATRIX_ID, `${label}.matrixId`),
    packageLockPath,
    packageLockRule,
    runtimeEntrypoints: Object.freeze(runtimeEntrypoints) as Phase10C0VS6PacketCatalogue["runtimeEntrypoints"],
    runtimeLoaderContract,
    workerTransportContract,
    packets: Object.freeze(packets),
    ...(recovery ? { recoveryAuthority: recoveryAuthority! } : {}),
  });
}

export function parsePhase10C0VS6RecoveryAuthority(value: unknown): Phase10C0VS6RecoveryAuthority {
  const label = "recovery authority";
  const row = object(value, label);
  exactKeys(row, [
    "schema", "recoveryAuthorityId", "automaticRetry", "predecessorImplementationFreezeCommit",
    "predecessorPacketCatalogue", "predecessorApProtocol", "predecessorLockArtifacts",
    "predecessorGovernedAbsentPaths", "retainedBytes", "creditedWorkerInvocationCount",
    "creditedGovernedProcessHours", "successor",
  ], label);
  if (row.automaticRetry !== false) fail(`${label}.automaticRetry`, "must be false");
  const predecessorPacketCatalogue = parsePhase10C0VS6ArtifactIdentity(
    row.predecessorPacketCatalogue,
    `${label}.predecessorPacketCatalogue`,
  );
  const predecessorApProtocol = parsePhase10C0VS6ArtifactIdentity(
    row.predecessorApProtocol,
    `${label}.predecessorApProtocol`,
  );
  if (!sameArtifactIdentity(predecessorPacketCatalogue, PHASE10_C0V_S6_PREDECESSOR_PACKET_CATALOGUE) ||
    !sameArtifactIdentity(predecessorApProtocol, PHASE10_C0V_S6_PREDECESSOR_AP_PROTOCOL)) {
    fail(label, "predecessor catalogue or A-P protocol identity differs from exact v1 authority");
  }
  const predecessorLockArtifacts = arrayValue(
    row.predecessorLockArtifacts,
    `${label}.predecessorLockArtifacts`,
  ).map((entry, index): Phase10C0VS6RecoveryPredecessorLockArtifact => {
    const lockLabel = `${label}.predecessorLockArtifacts[${index}]`;
    const lock = object(entry, lockLabel);
    exactKeys(lock, ["path", "byteLength", "sha256", "parsedContent"], lockLabel);
    const identity = parsePhase10C0VS6ArtifactIdentity({
      path: lock.path,
      byteLength: lock.byteLength,
      sha256: lock.sha256,
    }, lockLabel);
    const contentRow = object(lock.parsedContent, `${lockLabel}.parsedContent`);
    exactKeys(
      contentRow,
      ["schema", "packetId", "attemptId", "processId", "acquiredAt"],
      `${lockLabel}.parsedContent`,
    );
    const parsedContent = Object.freeze({
      schema: literal(
        contentRow.schema,
        "phase10-c0v-s6-lock-v1",
        `${lockLabel}.parsedContent.schema`,
      ),
      packetId: stringValue(contentRow.packetId, `${lockLabel}.parsedContent.packetId`),
      attemptId: stringValue(contentRow.attemptId, `${lockLabel}.parsedContent.attemptId`),
      processId: safeInteger(contentRow.processId, `${lockLabel}.parsedContent.processId`, 1),
      acquiredAt: stringValue(contentRow.acquiredAt, `${lockLabel}.parsedContent.acquiredAt`),
    });
    return Object.freeze({ ...identity, parsedContent });
  });
  if (predecessorLockArtifacts.length !== PHASE10_C0V_S6_PREDECESSOR_LOCK_ARTIFACTS.length ||
    predecessorLockArtifacts.some((entry, index) => {
      const expected = PHASE10_C0V_S6_PREDECESSOR_LOCK_ARTIFACTS[index]!;
      return !sameArtifactIdentity(entry, expected) ||
        entry.parsedContent.schema !== expected.parsedContent.schema ||
        entry.parsedContent.packetId !== expected.parsedContent.packetId ||
        entry.parsedContent.attemptId !== expected.parsedContent.attemptId ||
        entry.parsedContent.processId !== expected.parsedContent.processId ||
        entry.parsedContent.acquiredAt !== expected.parsedContent.acquiredAt;
    })) {
    fail(`${label}.predecessorLockArtifacts`, "differs from the exact two retained v1 locks");
  }
  const predecessorGovernedAbsentPaths = arrayValue(
    row.predecessorGovernedAbsentPaths,
    `${label}.predecessorGovernedAbsentPaths`,
  ).map((entry, index) => safePath(entry, `${label}.predecessorGovernedAbsentPaths[${index}]`));
  if (predecessorGovernedAbsentPaths.length !== PHASE10_C0V_S6_PREDECESSOR_GOVERNED_ABSENT_PATHS.length ||
    predecessorGovernedAbsentPaths.some((entry, index) =>
      entry !== PHASE10_C0V_S6_PREDECESSOR_GOVERNED_ABSENT_PATHS[index])) {
    fail(`${label}.predecessorGovernedAbsentPaths`, "differs from the complete v1 A-P absence roster");
  }
  const retainedBytes = safeInteger(row.retainedBytes, `${label}.retainedBytes`);
  const creditedWorkerInvocationCount = safeInteger(
    row.creditedWorkerInvocationCount,
    `${label}.creditedWorkerInvocationCount`,
  );
  const creditedGovernedProcessHours = finiteNumber(
    row.creditedGovernedProcessHours,
    `${label}.creditedGovernedProcessHours`,
  );
  if (retainedBytes !== 396 || retainedBytes !== predecessorLockArtifacts.reduce(
    (sum, entry) => sum + entry.byteLength,
    0,
  ) || creditedWorkerInvocationCount !== 0 || creditedGovernedProcessHours !== 0) {
    fail(label, "retained bytes or zero-credit predecessor accounting differs");
  }
  const successorRow = object(row.successor, `${label}.successor`);
  exactKeys(successorRow, [
    "packetCatalogueId", "packetCataloguePath", "maximumAuthorizedNewAttempts", "authorizedAttempts",
  ], `${label}.successor`);
  const authorizedAttempts = arrayValue(
    successorRow.authorizedAttempts,
    `${label}.successor.authorizedAttempts`,
  ).map((entry, index): Phase10C0VS6RecoveryAuthorizedAttempt => {
    const attemptLabel = `${label}.successor.authorizedAttempts[${index}]`;
    const attempt = object(entry, attemptLabel);
    exactKeys(attempt, ["packetId", "predecessorAttemptId", "successorAttemptId"], attemptLabel);
    return Object.freeze({
      packetId: parsePacketId(attempt.packetId, `${attemptLabel}.packetId`),
      predecessorAttemptId: parsePhase10C0VS6AttemptId(
        attempt.predecessorAttemptId,
        `${attemptLabel}.predecessorAttemptId`,
      ),
      successorAttemptId: parsePhase10C0VS6AttemptId(
        attempt.successorAttemptId,
        `${attemptLabel}.successorAttemptId`,
      ),
    });
  });
  const maximumAuthorizedNewAttempts = safeInteger(
    successorRow.maximumAuthorizedNewAttempts,
    `${label}.successor.maximumAuthorizedNewAttempts`,
    1,
  );
  if (maximumAuthorizedNewAttempts !== 1 || authorizedAttempts.length !== 1 ||
    authorizedAttempts[0]!.packetId !== "a-p-c0v-s6" ||
    authorizedAttempts[0]!.predecessorAttemptId !== "a-p-c0v-s6-20260822-v1" ||
    authorizedAttempts[0]!.successorAttemptId !== "a-p-c0v-s6-20260822-v2") {
    fail(`${label}.successor.authorizedAttempts`, "must authorize only the A-P v1-to-v2 successor");
  }
  return Object.freeze({
    schema: literal(row.schema, PHASE10_C0V_S6_RECOVERY_AUTHORITY_SCHEMA, `${label}.schema`),
    recoveryAuthorityId: literal(
      row.recoveryAuthorityId,
      PHASE10_C0V_S6_RECOVERY_AUTHORITY_ID,
      `${label}.recoveryAuthorityId`,
    ),
    automaticRetry: false,
    predecessorImplementationFreezeCommit: literal(
      row.predecessorImplementationFreezeCommit,
      PHASE10_C0V_S6_PREDECESSOR_IMPLEMENTATION_FREEZE_COMMIT,
      `${label}.predecessorImplementationFreezeCommit`,
    ),
    predecessorPacketCatalogue,
    predecessorApProtocol,
    predecessorLockArtifacts: Object.freeze(predecessorLockArtifacts) as unknown as
      Phase10C0VS6RecoveryAuthority["predecessorLockArtifacts"],
    predecessorGovernedAbsentPaths: Object.freeze(predecessorGovernedAbsentPaths),
    retainedBytes: retainedBytes as 396,
    creditedWorkerInvocationCount: creditedWorkerInvocationCount as 0,
    creditedGovernedProcessHours: creditedGovernedProcessHours as 0,
    successor: Object.freeze({
      packetCatalogueId: literal(
        successorRow.packetCatalogueId,
        PHASE10_C0V_S6_RECOVERY_PACKET_CATALOGUE_ID,
        `${label}.successor.packetCatalogueId`,
      ),
      packetCataloguePath: literal(
        successorRow.packetCataloguePath,
        PHASE10_C0V_S6_RECOVERY_PACKET_CATALOGUE_PATH,
        `${label}.successor.packetCataloguePath`,
      ),
      maximumAuthorizedNewAttempts: maximumAuthorizedNewAttempts as 1,
      authorizedAttempts: Object.freeze(authorizedAttempts) as unknown as
        Phase10C0VS6RecoveryAuthority["successor"]["authorizedAttempts"],
    }),
  });
}

export function parsePhase10C0VS6RecoveryV2Authority(value: unknown): Phase10C0VS6RecoveryV2Authority {
  const label = "recovery-v2 authority";
  const row = object(value, label);
  exactKeys(row, [
    "schema", "recoveryAuthorityId", "automaticRetry", "predecessorImplementationFreezeCommit",
    "predecessorRecoveryAuthority", "predecessorPacketCatalogue", "predecessorApProtocol",
    "predecessorLockArtifacts", "predecessorAttemptArtifacts", "predecessorPublishedArtifacts",
    "predecessorGovernedAbsentPaths", "retainedBytes", "observedWorkerProcessCount",
    "observedWorkerLifetimeNanoseconds", "creditedGovernedInvocationCount",
    "creditedGovernedProcessHours", "successor",
  ], label);
  if (row.automaticRetry !== false) fail(`${label}.automaticRetry`, "must be false");
  const predecessorRecoveryAuthority = parsePhase10C0VS6ArtifactIdentity(
    row.predecessorRecoveryAuthority,
    `${label}.predecessorRecoveryAuthority`,
  );
  const predecessorPacketCatalogue = parsePhase10C0VS6ArtifactIdentity(
    row.predecessorPacketCatalogue,
    `${label}.predecessorPacketCatalogue`,
  );
  const predecessorApProtocol = parsePhase10C0VS6ArtifactIdentity(
    row.predecessorApProtocol,
    `${label}.predecessorApProtocol`,
  );
  if (!sameArtifactIdentity(
    predecessorRecoveryAuthority,
    PHASE10_C0V_S6_RECOVERY_V2_PREDECESSOR_RECOVERY_AUTHORITY,
  ) || !sameArtifactIdentity(
    predecessorPacketCatalogue,
    PHASE10_C0V_S6_RECOVERY_V2_PREDECESSOR_PACKET_CATALOGUE,
  ) || !sameArtifactIdentity(
    predecessorApProtocol,
    PHASE10_C0V_S6_RECOVERY_V2_PREDECESSOR_AP_PROTOCOL,
  )) {
    fail(label, "recovery-v1 authority, catalogue, or A-P protocol identity differs");
  }
  const predecessorLockArtifacts = arrayValue(
    row.predecessorLockArtifacts,
    `${label}.predecessorLockArtifacts`,
  ).map((entry, index): Phase10C0VS6RecoveryPredecessorLockArtifact => {
    const lockLabel = `${label}.predecessorLockArtifacts[${index}]`;
    const lock = object(entry, lockLabel);
    exactKeys(lock, ["path", "byteLength", "sha256", "parsedContent"], lockLabel);
    const identity = parsePhase10C0VS6ArtifactIdentity({
      path: lock.path,
      byteLength: lock.byteLength,
      sha256: lock.sha256,
    }, lockLabel);
    const contentRow = object(lock.parsedContent, `${lockLabel}.parsedContent`);
    exactKeys(
      contentRow,
      ["schema", "packetId", "attemptId", "processId", "acquiredAt"],
      `${lockLabel}.parsedContent`,
    );
    return Object.freeze({
      ...identity,
      parsedContent: Object.freeze({
        schema: literal(
          contentRow.schema,
          "phase10-c0v-s6-lock-v1",
          `${lockLabel}.parsedContent.schema`,
        ),
        packetId: stringValue(contentRow.packetId, `${lockLabel}.parsedContent.packetId`),
        attemptId: stringValue(contentRow.attemptId, `${lockLabel}.parsedContent.attemptId`),
        processId: safeInteger(contentRow.processId, `${lockLabel}.parsedContent.processId`, 1),
        acquiredAt: stringValue(contentRow.acquiredAt, `${lockLabel}.parsedContent.acquiredAt`),
      }),
    });
  });
  if (predecessorLockArtifacts.length !== PHASE10_C0V_S6_RECOVERY_V2_PREDECESSOR_LOCK_ARTIFACTS.length ||
    predecessorLockArtifacts.some((entry, index) => {
      const expected = PHASE10_C0V_S6_RECOVERY_V2_PREDECESSOR_LOCK_ARTIFACTS[index]!;
      return !sameArtifactIdentity(entry, expected) ||
        entry.parsedContent.schema !== expected.parsedContent.schema ||
        entry.parsedContent.packetId !== expected.parsedContent.packetId ||
        entry.parsedContent.attemptId !== expected.parsedContent.attemptId ||
        entry.parsedContent.processId !== expected.parsedContent.processId ||
        entry.parsedContent.acquiredAt !== expected.parsedContent.acquiredAt;
    })) {
    fail(`${label}.predecessorLockArtifacts`, "differs from the exact four retained locks");
  }
  const predecessorAttemptArtifacts = parseIdentityRoster(
    row.predecessorAttemptArtifacts,
    `${label}.predecessorAttemptArtifacts`,
  );
  if (predecessorAttemptArtifacts.length !==
      PHASE10_C0V_S6_RECOVERY_V2_PREDECESSOR_ATTEMPT_ARTIFACTS.length ||
    predecessorAttemptArtifacts.some((entry, index) => !sameArtifactIdentity(
      entry,
      PHASE10_C0V_S6_RECOVERY_V2_PREDECESSOR_ATTEMPT_ARTIFACTS[index]!,
    ))) {
    fail(`${label}.predecessorAttemptArtifacts`, "differs from the exact five recovery-v1 attempt files");
  }
  const predecessorPublishedArtifacts = parseIdentityRoster(
    row.predecessorPublishedArtifacts,
    `${label}.predecessorPublishedArtifacts`,
  );
  if (predecessorPublishedArtifacts.length !==
      PHASE10_C0V_S6_RECOVERY_V2_PREDECESSOR_PUBLISHED_ARTIFACTS.length ||
    predecessorPublishedArtifacts.some((entry, index) => !sameArtifactIdentity(
      entry,
      PHASE10_C0V_S6_RECOVERY_V2_PREDECESSOR_PUBLISHED_ARTIFACTS[index]!,
    ))) {
    fail(`${label}.predecessorPublishedArtifacts`, "differs from the exact pinned recovery-v1 preflight");
  }
  const predecessorGovernedAbsentPaths = arrayValue(
    row.predecessorGovernedAbsentPaths,
    `${label}.predecessorGovernedAbsentPaths`,
  ).map((entry, index) => safePath(entry, `${label}.predecessorGovernedAbsentPaths[${index}]`));
  if (predecessorGovernedAbsentPaths.length !== PHASE10_C0V_S6_RECOVERY_V2_GOVERNED_ABSENT_PATHS.length ||
    predecessorGovernedAbsentPaths.some((entry, index) =>
      entry !== PHASE10_C0V_S6_RECOVERY_V2_GOVERNED_ABSENT_PATHS[index])) {
    fail(`${label}.predecessorGovernedAbsentPaths`, "differs from the exact recovery-v1/v3 absence roster");
  }
  const retainedBytes = safeInteger(row.retainedBytes, `${label}.retainedBytes`, 1);
  const observedWorkerProcessCount = safeInteger(
    row.observedWorkerProcessCount,
    `${label}.observedWorkerProcessCount`,
    1,
  );
  const observedWorkerLifetimeNanoseconds = safeInteger(
    row.observedWorkerLifetimeNanoseconds,
    `${label}.observedWorkerLifetimeNanoseconds`,
    1,
  );
  const creditedGovernedInvocationCount = safeInteger(
    row.creditedGovernedInvocationCount,
    `${label}.creditedGovernedInvocationCount`,
  );
  const creditedGovernedProcessHours = finiteNumber(
    row.creditedGovernedProcessHours,
    `${label}.creditedGovernedProcessHours`,
  );
  const retainedIdentityBytes = predecessorLockArtifacts.reduce((sum, entry) => sum + entry.byteLength, 0) +
    predecessorAttemptArtifacts.reduce((sum, entry) => sum + entry.byteLength, 0) +
    predecessorPublishedArtifacts.reduce((sum, entry) => sum + entry.byteLength, 0);
  if (retainedBytes !== 64316 || retainedBytes !== retainedIdentityBytes ||
    observedWorkerProcessCount !== 1 || observedWorkerLifetimeNanoseconds !== 384945300 ||
    creditedGovernedInvocationCount !== 0 || creditedGovernedProcessHours !== 0) {
    fail(label, "retained bytes, observed worker, or zero-credit accounting differs");
  }
  const successorRow = object(row.successor, `${label}.successor`);
  exactKeys(successorRow, [
    "packetCatalogueId", "packetCataloguePath", "maximumAuthorizedNewAttempts", "authorizedAttempts",
  ], `${label}.successor`);
  const authorizedAttempts = arrayValue(
    successorRow.authorizedAttempts,
    `${label}.successor.authorizedAttempts`,
  ).map((entry, index): Phase10C0VS6RecoveryAuthorizedAttempt => {
    const attemptLabel = `${label}.successor.authorizedAttempts[${index}]`;
    const attempt = object(entry, attemptLabel);
    exactKeys(attempt, ["packetId", "predecessorAttemptId", "successorAttemptId"], attemptLabel);
    return Object.freeze({
      packetId: parsePacketId(attempt.packetId, `${attemptLabel}.packetId`),
      predecessorAttemptId: parsePhase10C0VS6AttemptId(
        attempt.predecessorAttemptId,
        `${attemptLabel}.predecessorAttemptId`,
      ),
      successorAttemptId: parsePhase10C0VS6AttemptId(
        attempt.successorAttemptId,
        `${attemptLabel}.successorAttemptId`,
      ),
    });
  });
  const maximumAuthorizedNewAttempts = safeInteger(
    successorRow.maximumAuthorizedNewAttempts,
    `${label}.successor.maximumAuthorizedNewAttempts`,
    1,
  );
  if (maximumAuthorizedNewAttempts !== 1 || authorizedAttempts.length !== 1 ||
    authorizedAttempts[0]!.packetId !== "a-p-c0v-s6" ||
    authorizedAttempts[0]!.predecessorAttemptId !== "a-p-c0v-s6-20260822-v2" ||
    authorizedAttempts[0]!.successorAttemptId !== "a-p-c0v-s6-20260822-v3") {
    fail(`${label}.successor.authorizedAttempts`, "must authorize only the A-P v2-to-v3 successor");
  }
  return Object.freeze({
    schema: literal(row.schema, PHASE10_C0V_S6_RECOVERY_V2_AUTHORITY_SCHEMA, `${label}.schema`),
    recoveryAuthorityId: literal(
      row.recoveryAuthorityId,
      PHASE10_C0V_S6_RECOVERY_V2_AUTHORITY_ID,
      `${label}.recoveryAuthorityId`,
    ),
    automaticRetry: false,
    predecessorImplementationFreezeCommit: literal(
      row.predecessorImplementationFreezeCommit,
      PHASE10_C0V_S6_RECOVERY_V2_PREDECESSOR_IMPLEMENTATION_FREEZE_COMMIT,
      `${label}.predecessorImplementationFreezeCommit`,
    ),
    predecessorRecoveryAuthority,
    predecessorPacketCatalogue,
    predecessorApProtocol,
    predecessorLockArtifacts: Object.freeze(predecessorLockArtifacts) as unknown as
      Phase10C0VS6RecoveryV2Authority["predecessorLockArtifacts"],
    predecessorAttemptArtifacts: Object.freeze(predecessorAttemptArtifacts),
    predecessorPublishedArtifacts: Object.freeze(predecessorPublishedArtifacts),
    predecessorGovernedAbsentPaths: Object.freeze(predecessorGovernedAbsentPaths),
    retainedBytes: retainedBytes as 64316,
    observedWorkerProcessCount: observedWorkerProcessCount as 1,
    observedWorkerLifetimeNanoseconds: observedWorkerLifetimeNanoseconds as 384945300,
    creditedGovernedInvocationCount: creditedGovernedInvocationCount as 0,
    creditedGovernedProcessHours: creditedGovernedProcessHours as 0,
    successor: Object.freeze({
      packetCatalogueId: literal(
        successorRow.packetCatalogueId,
        PHASE10_C0V_S6_RECOVERY_V2_PACKET_CATALOGUE_ID,
        `${label}.successor.packetCatalogueId`,
      ),
      packetCataloguePath: literal(
        successorRow.packetCataloguePath,
        PHASE10_C0V_S6_RECOVERY_V2_PACKET_CATALOGUE_PATH,
        `${label}.successor.packetCataloguePath`,
      ),
      maximumAuthorizedNewAttempts: maximumAuthorizedNewAttempts as 1,
      authorizedAttempts: Object.freeze(authorizedAttempts) as unknown as
        Phase10C0VS6RecoveryV2Authority["successor"]["authorizedAttempts"],
    }),
  });
}

export function parsePhase10C0VS6RecoveryV3Authority(value: unknown): Phase10C0VS6RecoveryV3Authority {
  const label = "recovery-v3 authority";
  const row = object(value, label);
  exactKeys(row, [
    "schema", "recoveryAuthorityId", "automaticRetry", "predecessorImplementationFreezeCommit",
    "predecessorRecoveryAuthority", "predecessorPacketCatalogue", "predecessorApProtocol",
    "predecessorLockArtifacts", "predecessorAttemptArtifacts", "predecessorPublishedArtifacts",
    "predecessorGovernedAbsentPaths", "retainedBytes", "observedWorkerProcessCount",
    "observedWorkerLifetimeNanoseconds", "creditedGovernedInvocationCount",
    "creditedGovernedElapsedNanoseconds", "creditedGovernedProcessHours", "successor",
  ], label);
  if (row.automaticRetry !== false) fail(`${label}.automaticRetry`, "must be false");
  const predecessorRecoveryAuthority = parsePhase10C0VS6ArtifactIdentity(
    row.predecessorRecoveryAuthority,
    `${label}.predecessorRecoveryAuthority`,
  );
  const predecessorPacketCatalogue = parsePhase10C0VS6ArtifactIdentity(
    row.predecessorPacketCatalogue,
    `${label}.predecessorPacketCatalogue`,
  );
  const predecessorApProtocol = parsePhase10C0VS6ArtifactIdentity(
    row.predecessorApProtocol,
    `${label}.predecessorApProtocol`,
  );
  if (!sameArtifactIdentity(
    predecessorRecoveryAuthority,
    PHASE10_C0V_S6_RECOVERY_V3_PREDECESSOR_RECOVERY_AUTHORITY,
  ) || !sameArtifactIdentity(
    predecessorPacketCatalogue,
    PHASE10_C0V_S6_RECOVERY_V3_PREDECESSOR_PACKET_CATALOGUE,
  ) || !sameArtifactIdentity(
    predecessorApProtocol,
    PHASE10_C0V_S6_RECOVERY_V3_PREDECESSOR_AP_PROTOCOL,
  )) {
    fail(label, "recovery-v2 authority, catalogue, or A-P protocol identity differs");
  }
  const predecessorLockArtifacts = arrayValue(
    row.predecessorLockArtifacts,
    `${label}.predecessorLockArtifacts`,
  ).map((entry, index): Phase10C0VS6RecoveryPredecessorLockArtifact => {
    const lockLabel = `${label}.predecessorLockArtifacts[${index}]`;
    const lock = object(entry, lockLabel);
    exactKeys(lock, ["path", "byteLength", "sha256", "parsedContent"], lockLabel);
    const identity = parsePhase10C0VS6ArtifactIdentity({
      path: lock.path,
      byteLength: lock.byteLength,
      sha256: lock.sha256,
    }, lockLabel);
    const contentRow = object(lock.parsedContent, `${lockLabel}.parsedContent`);
    exactKeys(
      contentRow,
      ["schema", "packetId", "attemptId", "processId", "acquiredAt"],
      `${lockLabel}.parsedContent`,
    );
    return Object.freeze({
      ...identity,
      parsedContent: Object.freeze({
        schema: literal(
          contentRow.schema,
          "phase10-c0v-s6-lock-v1",
          `${lockLabel}.parsedContent.schema`,
        ),
        packetId: stringValue(contentRow.packetId, `${lockLabel}.parsedContent.packetId`),
        attemptId: stringValue(contentRow.attemptId, `${lockLabel}.parsedContent.attemptId`),
        processId: safeInteger(contentRow.processId, `${lockLabel}.parsedContent.processId`, 1),
        acquiredAt: stringValue(contentRow.acquiredAt, `${lockLabel}.parsedContent.acquiredAt`),
      }),
    });
  });
  if (predecessorLockArtifacts.length !== PHASE10_C0V_S6_RECOVERY_V3_PREDECESSOR_LOCK_ARTIFACTS.length ||
    predecessorLockArtifacts.some((entry, index) => {
      const expected = PHASE10_C0V_S6_RECOVERY_V3_PREDECESSOR_LOCK_ARTIFACTS[index]!;
      return !sameArtifactIdentity(entry, expected) ||
        entry.parsedContent.schema !== expected.parsedContent.schema ||
        entry.parsedContent.packetId !== expected.parsedContent.packetId ||
        entry.parsedContent.attemptId !== expected.parsedContent.attemptId ||
        entry.parsedContent.processId !== expected.parsedContent.processId ||
        entry.parsedContent.acquiredAt !== expected.parsedContent.acquiredAt;
    })) {
    fail(`${label}.predecessorLockArtifacts`, "differs from the exact six retained locks");
  }
  const predecessorAttemptArtifacts = parseIdentityRoster(
    row.predecessorAttemptArtifacts,
    `${label}.predecessorAttemptArtifacts`,
  );
  if (predecessorAttemptArtifacts.length !==
      PHASE10_C0V_S6_RECOVERY_V3_PREDECESSOR_ATTEMPT_ARTIFACTS.length ||
    predecessorAttemptArtifacts.some((entry, index) => !sameArtifactIdentity(
      entry,
      PHASE10_C0V_S6_RECOVERY_V3_PREDECESSOR_ATTEMPT_ARTIFACTS[index]!,
    ))) {
    fail(`${label}.predecessorAttemptArtifacts`, "differs from the exact thirteen predecessor attempt files");
  }
  const predecessorPublishedArtifacts = parseIdentityRoster(
    row.predecessorPublishedArtifacts,
    `${label}.predecessorPublishedArtifacts`,
  );
  if (predecessorPublishedArtifacts.length !==
      PHASE10_C0V_S6_RECOVERY_V3_PREDECESSOR_PUBLISHED_ARTIFACTS.length ||
    predecessorPublishedArtifacts.some((entry, index) => !sameArtifactIdentity(
      entry,
      PHASE10_C0V_S6_RECOVERY_V3_PREDECESSOR_PUBLISHED_ARTIFACTS[index]!,
    ))) {
    fail(`${label}.predecessorPublishedArtifacts`, "differs from the exact two pinned predecessor preflights");
  }
  const predecessorGovernedAbsentPaths = arrayValue(
    row.predecessorGovernedAbsentPaths,
    `${label}.predecessorGovernedAbsentPaths`,
  ).map((entry, index) => safePath(entry, `${label}.predecessorGovernedAbsentPaths[${index}]`));
  if (predecessorGovernedAbsentPaths.length !== PHASE10_C0V_S6_RECOVERY_V3_GOVERNED_ABSENT_PATHS.length ||
    predecessorGovernedAbsentPaths.some((entry, index) =>
      entry !== PHASE10_C0V_S6_RECOVERY_V3_GOVERNED_ABSENT_PATHS[index])) {
    fail(`${label}.predecessorGovernedAbsentPaths`, "differs from the exact predecessor/v4 absence roster");
  }
  const retainedBytes = safeInteger(row.retainedBytes, `${label}.retainedBytes`, 1);
  const observedWorkerProcessCount = safeInteger(
    row.observedWorkerProcessCount,
    `${label}.observedWorkerProcessCount`,
    1,
  );
  const observedWorkerLifetimeNanoseconds = safeInteger(
    row.observedWorkerLifetimeNanoseconds,
    `${label}.observedWorkerLifetimeNanoseconds`,
    1,
  );
  const creditedGovernedInvocationCount = safeInteger(
    row.creditedGovernedInvocationCount,
    `${label}.creditedGovernedInvocationCount`,
    1,
  );
  const creditedGovernedElapsedNanoseconds = safeInteger(
    row.creditedGovernedElapsedNanoseconds,
    `${label}.creditedGovernedElapsedNanoseconds`,
    1,
  );
  const creditedGovernedProcessHours = finiteNumber(
    row.creditedGovernedProcessHours,
    `${label}.creditedGovernedProcessHours`,
  );
  const retainedIdentityBytes = predecessorLockArtifacts.reduce((sum, entry) => sum + entry.byteLength, 0) +
    predecessorAttemptArtifacts.reduce((sum, entry) => sum + entry.byteLength, 0) +
    predecessorPublishedArtifacts.reduce((sum, entry) => sum + entry.byteLength, 0);
  if (retainedBytes !== PHASE10_C0V_S6_RECOVERY_V3_RETAINED_BYTES ||
    retainedBytes !== retainedIdentityBytes || observedWorkerProcessCount !== 1 ||
    observedWorkerLifetimeNanoseconds !== 125776629700 || creditedGovernedInvocationCount !== 4 ||
    creditedGovernedElapsedNanoseconds !==
      PHASE10_C0V_S6_RECOVERY_V3_CREDITED_GOVERNED_ELAPSED_NANOSECONDS ||
    creditedGovernedProcessHours !== 0.0348027338888889) {
    fail(label, "retained bytes, observed worker, or governed-credit accounting differs");
  }
  const successorRow = object(row.successor, `${label}.successor`);
  exactKeys(successorRow, [
    "packetCatalogueId", "packetCataloguePath", "maximumAuthorizedNewAttempts", "authorizedAttempts",
  ], `${label}.successor`);
  const authorizedAttempts = arrayValue(
    successorRow.authorizedAttempts,
    `${label}.successor.authorizedAttempts`,
  ).map((entry, index): Phase10C0VS6RecoveryAuthorizedAttempt => {
    const attemptLabel = `${label}.successor.authorizedAttempts[${index}]`;
    const attempt = object(entry, attemptLabel);
    exactKeys(attempt, ["packetId", "predecessorAttemptId", "successorAttemptId"], attemptLabel);
    return Object.freeze({
      packetId: parsePacketId(attempt.packetId, `${attemptLabel}.packetId`),
      predecessorAttemptId: parsePhase10C0VS6AttemptId(
        attempt.predecessorAttemptId,
        `${attemptLabel}.predecessorAttemptId`,
      ),
      successorAttemptId: parsePhase10C0VS6AttemptId(
        attempt.successorAttemptId,
        `${attemptLabel}.successorAttemptId`,
      ),
    });
  });
  const maximumAuthorizedNewAttempts = safeInteger(
    successorRow.maximumAuthorizedNewAttempts,
    `${label}.successor.maximumAuthorizedNewAttempts`,
    1,
  );
  if (maximumAuthorizedNewAttempts !== 1 || authorizedAttempts.length !== 1 ||
    authorizedAttempts[0]!.packetId !== "a-p-c0v-s6" ||
    authorizedAttempts[0]!.predecessorAttemptId !== "a-p-c0v-s6-20260822-v3" ||
    authorizedAttempts[0]!.successorAttemptId !== "a-p-c0v-s6-20260822-v4") {
    fail(`${label}.successor.authorizedAttempts`, "must authorize only the A-P v3-to-v4 successor");
  }
  return Object.freeze({
    schema: literal(row.schema, PHASE10_C0V_S6_RECOVERY_V3_AUTHORITY_SCHEMA, `${label}.schema`),
    recoveryAuthorityId: literal(
      row.recoveryAuthorityId,
      PHASE10_C0V_S6_RECOVERY_V3_AUTHORITY_ID,
      `${label}.recoveryAuthorityId`,
    ),
    automaticRetry: false,
    predecessorImplementationFreezeCommit: literal(
      row.predecessorImplementationFreezeCommit,
      PHASE10_C0V_S6_RECOVERY_V3_PREDECESSOR_IMPLEMENTATION_FREEZE_COMMIT,
      `${label}.predecessorImplementationFreezeCommit`,
    ),
    predecessorRecoveryAuthority,
    predecessorPacketCatalogue,
    predecessorApProtocol,
    predecessorLockArtifacts: Object.freeze(predecessorLockArtifacts) as unknown as
      Phase10C0VS6RecoveryV3Authority["predecessorLockArtifacts"],
    predecessorAttemptArtifacts: Object.freeze(predecessorAttemptArtifacts),
    predecessorPublishedArtifacts: Object.freeze(predecessorPublishedArtifacts),
    predecessorGovernedAbsentPaths: Object.freeze(predecessorGovernedAbsentPaths),
    retainedBytes: retainedBytes as typeof PHASE10_C0V_S6_RECOVERY_V3_RETAINED_BYTES,
    observedWorkerProcessCount: observedWorkerProcessCount as 1,
    observedWorkerLifetimeNanoseconds: observedWorkerLifetimeNanoseconds as 125776629700,
    creditedGovernedInvocationCount: creditedGovernedInvocationCount as 4,
    creditedGovernedElapsedNanoseconds: creditedGovernedElapsedNanoseconds as
      typeof PHASE10_C0V_S6_RECOVERY_V3_CREDITED_GOVERNED_ELAPSED_NANOSECONDS,
    creditedGovernedProcessHours: creditedGovernedProcessHours as 0.0348027338888889,
    successor: Object.freeze({
      packetCatalogueId: literal(
        successorRow.packetCatalogueId,
        PHASE10_C0V_S6_RECOVERY_V3_PACKET_CATALOGUE_ID,
        `${label}.successor.packetCatalogueId`,
      ),
      packetCataloguePath: literal(
        successorRow.packetCataloguePath,
        PHASE10_C0V_S6_RECOVERY_V3_PACKET_CATALOGUE_PATH,
        `${label}.successor.packetCataloguePath`,
      ),
      maximumAuthorizedNewAttempts: maximumAuthorizedNewAttempts as 1,
      authorizedAttempts: Object.freeze(authorizedAttempts) as unknown as
        Phase10C0VS6RecoveryV3Authority["successor"]["authorizedAttempts"],
    }),
  });
}

export function parsePhase10C0VS6RecoveryV4Authority(value: unknown): Phase10C0VS6RecoveryV4Authority {
  const label = "recovery-v4 authority";
  const row = object(value, label);
  exactKeys(row, [
    "schema", "recoveryAuthorityId", "automaticRetry", "predecessorImplementationFreezeCommit",
    "predecessorRecoveryAuthority", "predecessorPacketCatalogue", "predecessorApProtocol",
    "predecessorLockArtifacts", "predecessorAttemptArtifacts", "predecessorPublishedArtifacts",
    "predecessorGovernedAbsentPaths", "retainedBytes", "observedWorkerProcessCount",
    "observedWorkerLifetimeNanoseconds", "creditedGovernedInvocationCount",
    "creditedGovernedElapsedNanoseconds", "creditedGovernedProcessHours", "successor",
  ], label);
  if (row.automaticRetry !== false) fail(`${label}.automaticRetry`, "must be false");
  const predecessorRecoveryAuthority = parsePhase10C0VS6ArtifactIdentity(
    row.predecessorRecoveryAuthority,
    `${label}.predecessorRecoveryAuthority`,
  );
  const predecessorPacketCatalogue = parsePhase10C0VS6ArtifactIdentity(
    row.predecessorPacketCatalogue,
    `${label}.predecessorPacketCatalogue`,
  );
  const predecessorApProtocol = parsePhase10C0VS6ArtifactIdentity(
    row.predecessorApProtocol,
    `${label}.predecessorApProtocol`,
  );
  if (!sameArtifactIdentity(
    predecessorRecoveryAuthority,
    PHASE10_C0V_S6_RECOVERY_V4_PREDECESSOR_RECOVERY_AUTHORITY,
  ) || !sameArtifactIdentity(
    predecessorPacketCatalogue,
    PHASE10_C0V_S6_RECOVERY_V4_PREDECESSOR_PACKET_CATALOGUE,
  ) || !sameArtifactIdentity(
    predecessorApProtocol,
    PHASE10_C0V_S6_RECOVERY_V4_PREDECESSOR_AP_PROTOCOL,
  )) {
    fail(label, "recovery-v3 authority, catalogue, or A-P protocol identity differs");
  }
  const predecessorLockArtifacts = arrayValue(
    row.predecessorLockArtifacts,
    `${label}.predecessorLockArtifacts`,
  ).map((entry, index): Phase10C0VS6RecoveryPredecessorLockArtifact => {
    const lockLabel = `${label}.predecessorLockArtifacts[${index}]`;
    const lock = object(entry, lockLabel);
    exactKeys(lock, ["path", "byteLength", "sha256", "parsedContent"], lockLabel);
    const identity = parsePhase10C0VS6ArtifactIdentity({
      path: lock.path,
      byteLength: lock.byteLength,
      sha256: lock.sha256,
    }, lockLabel);
    const contentRow = object(lock.parsedContent, `${lockLabel}.parsedContent`);
    exactKeys(
      contentRow,
      ["schema", "packetId", "attemptId", "processId", "acquiredAt"],
      `${lockLabel}.parsedContent`,
    );
    return Object.freeze({
      ...identity,
      parsedContent: Object.freeze({
        schema: literal(
          contentRow.schema,
          "phase10-c0v-s6-lock-v1",
          `${lockLabel}.parsedContent.schema`,
        ),
        packetId: stringValue(contentRow.packetId, `${lockLabel}.parsedContent.packetId`),
        attemptId: stringValue(contentRow.attemptId, `${lockLabel}.parsedContent.attemptId`),
        processId: safeInteger(contentRow.processId, `${lockLabel}.parsedContent.processId`, 1),
        acquiredAt: stringValue(contentRow.acquiredAt, `${lockLabel}.parsedContent.acquiredAt`),
      }),
    });
  });
  if (predecessorLockArtifacts.length !== PHASE10_C0V_S6_RECOVERY_V4_PREDECESSOR_LOCK_ARTIFACTS.length ||
    predecessorLockArtifacts.some((entry, index) => {
      const expected = PHASE10_C0V_S6_RECOVERY_V4_PREDECESSOR_LOCK_ARTIFACTS[index]!;
      return !sameArtifactIdentity(entry, expected) ||
        entry.parsedContent.schema !== expected.parsedContent.schema ||
        entry.parsedContent.packetId !== expected.parsedContent.packetId ||
        entry.parsedContent.attemptId !== expected.parsedContent.attemptId ||
        entry.parsedContent.processId !== expected.parsedContent.processId ||
        entry.parsedContent.acquiredAt !== expected.parsedContent.acquiredAt;
    })) {
    fail(`${label}.predecessorLockArtifacts`, "differs from the exact eight retained locks");
  }
  const predecessorAttemptArtifacts = parseIdentityRoster(
    row.predecessorAttemptArtifacts,
    `${label}.predecessorAttemptArtifacts`,
  );
  if (predecessorAttemptArtifacts.length !==
      PHASE10_C0V_S6_RECOVERY_V4_PREDECESSOR_ATTEMPT_ARTIFACTS.length ||
    predecessorAttemptArtifacts.some((entry, index) => !sameArtifactIdentity(
      entry,
      PHASE10_C0V_S6_RECOVERY_V4_PREDECESSOR_ATTEMPT_ARTIFACTS[index]!,
    ))) {
    fail(`${label}.predecessorAttemptArtifacts`, "differs from the exact twenty-one predecessor attempt files");
  }
  const predecessorPublishedArtifacts = parseIdentityRoster(
    row.predecessorPublishedArtifacts,
    `${label}.predecessorPublishedArtifacts`,
  );
  if (predecessorPublishedArtifacts.length !==
      PHASE10_C0V_S6_RECOVERY_V4_PREDECESSOR_PUBLISHED_ARTIFACTS.length ||
    predecessorPublishedArtifacts.some((entry, index) => !sameArtifactIdentity(
      entry,
      PHASE10_C0V_S6_RECOVERY_V4_PREDECESSOR_PUBLISHED_ARTIFACTS[index]!,
    ))) {
    fail(`${label}.predecessorPublishedArtifacts`, "differs from the exact three pinned predecessor preflights");
  }
  const predecessorGovernedAbsentPaths = arrayValue(
    row.predecessorGovernedAbsentPaths,
    `${label}.predecessorGovernedAbsentPaths`,
  ).map((entry, index) => safePath(entry, `${label}.predecessorGovernedAbsentPaths[${index}]`));
  if (predecessorGovernedAbsentPaths.length !== PHASE10_C0V_S6_RECOVERY_V4_GOVERNED_ABSENT_PATHS.length ||
    predecessorGovernedAbsentPaths.some((entry, index) =>
      entry !== PHASE10_C0V_S6_RECOVERY_V4_GOVERNED_ABSENT_PATHS[index])) {
    fail(`${label}.predecessorGovernedAbsentPaths`, "differs from the exact predecessor/v5 absence roster");
  }
  const retainedBytes = safeInteger(row.retainedBytes, `${label}.retainedBytes`, 1);
  const observedWorkerProcessCount = safeInteger(
    row.observedWorkerProcessCount,
    `${label}.observedWorkerProcessCount`,
    1,
  );
  const observedWorkerLifetimeNanoseconds = safeInteger(
    row.observedWorkerLifetimeNanoseconds,
    `${label}.observedWorkerLifetimeNanoseconds`,
    1,
  );
  const creditedGovernedInvocationCount = safeInteger(
    row.creditedGovernedInvocationCount,
    `${label}.creditedGovernedInvocationCount`,
    1,
  );
  const creditedGovernedElapsedNanoseconds = safeInteger(
    row.creditedGovernedElapsedNanoseconds,
    `${label}.creditedGovernedElapsedNanoseconds`,
    1,
  );
  const creditedGovernedProcessHours = finiteNumber(
    row.creditedGovernedProcessHours,
    `${label}.creditedGovernedProcessHours`,
  );
  const retainedIdentityBytes = predecessorLockArtifacts.reduce((sum, entry) => sum + entry.byteLength, 0) +
    predecessorAttemptArtifacts.reduce((sum, entry) => sum + entry.byteLength, 0) +
    predecessorPublishedArtifacts.reduce((sum, entry) => sum + entry.byteLength, 0);
  if (retainedBytes !== PHASE10_C0V_S6_RECOVERY_V4_RETAINED_BYTES ||
    retainedBytes !== retainedIdentityBytes || observedWorkerProcessCount !== 1 ||
    observedWorkerLifetimeNanoseconds !== 132474672300 || creditedGovernedInvocationCount !== 4 ||
    creditedGovernedElapsedNanoseconds !==
      PHASE10_C0V_S6_RECOVERY_V4_CREDITED_GOVERNED_ELAPSED_NANOSECONDS ||
    creditedGovernedProcessHours !== 0.036666082583333336) {
    fail(label, "retained bytes, observed worker, or governed-credit accounting differs");
  }
  const successorRow = object(row.successor, `${label}.successor`);
  exactKeys(successorRow, [
    "packetCatalogueId", "packetCataloguePath", "maximumAuthorizedNewAttempts", "authorizedAttempts",
  ], `${label}.successor`);
  const authorizedAttempts = arrayValue(
    successorRow.authorizedAttempts,
    `${label}.successor.authorizedAttempts`,
  ).map((entry, index): Phase10C0VS6RecoveryAuthorizedAttempt => {
    const attemptLabel = `${label}.successor.authorizedAttempts[${index}]`;
    const attempt = object(entry, attemptLabel);
    exactKeys(attempt, ["packetId", "predecessorAttemptId", "successorAttemptId"], attemptLabel);
    return Object.freeze({
      packetId: parsePacketId(attempt.packetId, `${attemptLabel}.packetId`),
      predecessorAttemptId: parsePhase10C0VS6AttemptId(
        attempt.predecessorAttemptId,
        `${attemptLabel}.predecessorAttemptId`,
      ),
      successorAttemptId: parsePhase10C0VS6AttemptId(
        attempt.successorAttemptId,
        `${attemptLabel}.successorAttemptId`,
      ),
    });
  });
  const maximumAuthorizedNewAttempts = safeInteger(
    successorRow.maximumAuthorizedNewAttempts,
    `${label}.successor.maximumAuthorizedNewAttempts`,
    1,
  );
  if (maximumAuthorizedNewAttempts !== 1 || authorizedAttempts.length !== 1 ||
    authorizedAttempts[0]!.packetId !== "a-p-c0v-s6" ||
    authorizedAttempts[0]!.predecessorAttemptId !== "a-p-c0v-s6-20260822-v4" ||
    authorizedAttempts[0]!.successorAttemptId !== "a-p-c0v-s6-20260822-v5") {
    fail(`${label}.successor.authorizedAttempts`, "must authorize only the A-P v4-to-v5 successor");
  }
  return Object.freeze({
    schema: literal(row.schema, PHASE10_C0V_S6_RECOVERY_V4_AUTHORITY_SCHEMA, `${label}.schema`),
    recoveryAuthorityId: literal(
      row.recoveryAuthorityId,
      PHASE10_C0V_S6_RECOVERY_V4_AUTHORITY_ID,
      `${label}.recoveryAuthorityId`,
    ),
    automaticRetry: false,
    predecessorImplementationFreezeCommit: literal(
      row.predecessorImplementationFreezeCommit,
      PHASE10_C0V_S6_RECOVERY_V4_PREDECESSOR_IMPLEMENTATION_FREEZE_COMMIT,
      `${label}.predecessorImplementationFreezeCommit`,
    ),
    predecessorRecoveryAuthority,
    predecessorPacketCatalogue,
    predecessorApProtocol,
    predecessorLockArtifacts: Object.freeze(predecessorLockArtifacts) as unknown as
      Phase10C0VS6RecoveryV4Authority["predecessorLockArtifacts"],
    predecessorAttemptArtifacts: Object.freeze(predecessorAttemptArtifacts),
    predecessorPublishedArtifacts: Object.freeze(predecessorPublishedArtifacts),
    predecessorGovernedAbsentPaths: Object.freeze(predecessorGovernedAbsentPaths),
    retainedBytes: retainedBytes as typeof PHASE10_C0V_S6_RECOVERY_V4_RETAINED_BYTES,
    observedWorkerProcessCount: observedWorkerProcessCount as 1,
    observedWorkerLifetimeNanoseconds: observedWorkerLifetimeNanoseconds as 132474672300,
    creditedGovernedInvocationCount: creditedGovernedInvocationCount as 4,
    creditedGovernedElapsedNanoseconds: creditedGovernedElapsedNanoseconds as
      typeof PHASE10_C0V_S6_RECOVERY_V4_CREDITED_GOVERNED_ELAPSED_NANOSECONDS,
    creditedGovernedProcessHours: creditedGovernedProcessHours as 0.036666082583333336,
    successor: Object.freeze({
      packetCatalogueId: literal(
        successorRow.packetCatalogueId,
        PHASE10_C0V_S6_RECOVERY_V4_PACKET_CATALOGUE_ID,
        `${label}.successor.packetCatalogueId`,
      ),
      packetCataloguePath: literal(
        successorRow.packetCataloguePath,
        PHASE10_C0V_S6_RECOVERY_V4_PACKET_CATALOGUE_PATH,
        `${label}.successor.packetCataloguePath`,
      ),
      maximumAuthorizedNewAttempts: maximumAuthorizedNewAttempts as 1,
      authorizedAttempts: Object.freeze(authorizedAttempts) as unknown as
        Phase10C0VS6RecoveryV4Authority["successor"]["authorizedAttempts"],
    }),
  });
}

export function parsePhase10C0VS6RecoveryV5Authority(value: unknown): Phase10C0VS6RecoveryV5Authority {
  const label = "recovery-v5 authority";
  const row = object(value, label);
  exactKeys(row, [
    "schema", "recoveryAuthorityId", "automaticRetry", "predecessorImplementationFreezeCommit",
    "predecessorRecoveryAuthority", "predecessorPacketCatalogue", "predecessorApProtocol",
    "predecessorLockArtifacts", "predecessorAttemptArtifacts", "predecessorPublishedArtifacts",
    "predecessorGovernedAbsentPaths", "retainedBytes", "observedWorkerProcessCount",
    "observedWorkerLifetimeNanoseconds", "creditedGovernedInvocationCount",
    "creditedGovernedElapsedNanoseconds", "creditedGovernedProcessHours", "successor",
  ], label);
  if (row.automaticRetry !== false) fail(`${label}.automaticRetry`, "must be false");
  const predecessorRecoveryAuthority = parsePhase10C0VS6ArtifactIdentity(
    row.predecessorRecoveryAuthority,
    `${label}.predecessorRecoveryAuthority`,
  );
  const predecessorPacketCatalogue = parsePhase10C0VS6ArtifactIdentity(
    row.predecessorPacketCatalogue,
    `${label}.predecessorPacketCatalogue`,
  );
  const predecessorApProtocol = parsePhase10C0VS6ArtifactIdentity(
    row.predecessorApProtocol,
    `${label}.predecessorApProtocol`,
  );
  if (!sameArtifactIdentity(
    predecessorRecoveryAuthority,
    PHASE10_C0V_S6_RECOVERY_V5_PREDECESSOR_RECOVERY_AUTHORITY,
  ) || !sameArtifactIdentity(
    predecessorPacketCatalogue,
    PHASE10_C0V_S6_RECOVERY_V5_PREDECESSOR_PACKET_CATALOGUE,
  ) || !sameArtifactIdentity(
    predecessorApProtocol,
    PHASE10_C0V_S6_RECOVERY_V5_PREDECESSOR_AP_PROTOCOL,
  )) {
    fail(label, "recovery-v4 authority, catalogue, or A-P protocol identity differs");
  }
  const predecessorLockArtifacts = arrayValue(
    row.predecessorLockArtifacts,
    `${label}.predecessorLockArtifacts`,
  ).map((entry, index): Phase10C0VS6RecoveryPredecessorLockArtifact => {
    const lockLabel = `${label}.predecessorLockArtifacts[${index}]`;
    const lock = object(entry, lockLabel);
    exactKeys(lock, ["path", "byteLength", "sha256", "parsedContent"], lockLabel);
    const identity = parsePhase10C0VS6ArtifactIdentity({
      path: lock.path,
      byteLength: lock.byteLength,
      sha256: lock.sha256,
    }, lockLabel);
    const contentRow = object(lock.parsedContent, `${lockLabel}.parsedContent`);
    exactKeys(
      contentRow,
      ["schema", "packetId", "attemptId", "processId", "acquiredAt"],
      `${lockLabel}.parsedContent`,
    );
    return Object.freeze({
      ...identity,
      parsedContent: Object.freeze({
        schema: literal(
          contentRow.schema,
          "phase10-c0v-s6-lock-v1",
          `${lockLabel}.parsedContent.schema`,
        ),
        packetId: stringValue(contentRow.packetId, `${lockLabel}.parsedContent.packetId`),
        attemptId: stringValue(contentRow.attemptId, `${lockLabel}.parsedContent.attemptId`),
        processId: safeInteger(contentRow.processId, `${lockLabel}.parsedContent.processId`, 1),
        acquiredAt: stringValue(contentRow.acquiredAt, `${lockLabel}.parsedContent.acquiredAt`),
      }),
    });
  });
  if (predecessorLockArtifacts.length !== PHASE10_C0V_S6_RECOVERY_V5_PREDECESSOR_LOCK_ARTIFACTS.length ||
    predecessorLockArtifacts.some((entry, index) => {
      const expected = PHASE10_C0V_S6_RECOVERY_V5_PREDECESSOR_LOCK_ARTIFACTS[index]!;
      return !sameArtifactIdentity(entry, expected) ||
        entry.parsedContent.schema !== expected.parsedContent.schema ||
        entry.parsedContent.packetId !== expected.parsedContent.packetId ||
        entry.parsedContent.attemptId !== expected.parsedContent.attemptId ||
        entry.parsedContent.processId !== expected.parsedContent.processId ||
        entry.parsedContent.acquiredAt !== expected.parsedContent.acquiredAt;
    })) {
    fail(`${label}.predecessorLockArtifacts`, "differs from the exact ten retained locks");
  }
  const predecessorAttemptArtifacts = parseIdentityRoster(
    row.predecessorAttemptArtifacts,
    `${label}.predecessorAttemptArtifacts`,
  );
  if (predecessorAttemptArtifacts.length !==
      PHASE10_C0V_S6_RECOVERY_V5_PREDECESSOR_ATTEMPT_ARTIFACTS.length ||
    predecessorAttemptArtifacts.some((entry, index) => !sameArtifactIdentity(
      entry,
      PHASE10_C0V_S6_RECOVERY_V5_PREDECESSOR_ATTEMPT_ARTIFACTS[index]!,
    ))) {
    fail(`${label}.predecessorAttemptArtifacts`, "differs from the exact twenty-nine predecessor attempt files");
  }
  const predecessorPublishedArtifacts = parseIdentityRoster(
    row.predecessorPublishedArtifacts,
    `${label}.predecessorPublishedArtifacts`,
  );
  if (predecessorPublishedArtifacts.length !==
      PHASE10_C0V_S6_RECOVERY_V5_PREDECESSOR_PUBLISHED_ARTIFACTS.length ||
    predecessorPublishedArtifacts.some((entry, index) => !sameArtifactIdentity(
      entry,
      PHASE10_C0V_S6_RECOVERY_V5_PREDECESSOR_PUBLISHED_ARTIFACTS[index]!,
    ))) {
    fail(`${label}.predecessorPublishedArtifacts`, "differs from the exact four pinned predecessor preflights");
  }
  const predecessorGovernedAbsentPaths = arrayValue(
    row.predecessorGovernedAbsentPaths,
    `${label}.predecessorGovernedAbsentPaths`,
  ).map((entry, index) => safePath(entry, `${label}.predecessorGovernedAbsentPaths[${index}]`));
  if (predecessorGovernedAbsentPaths.length !== PHASE10_C0V_S6_RECOVERY_V5_GOVERNED_ABSENT_PATHS.length ||
    predecessorGovernedAbsentPaths.some((entry, index) =>
      entry !== PHASE10_C0V_S6_RECOVERY_V5_GOVERNED_ABSENT_PATHS[index])) {
    fail(`${label}.predecessorGovernedAbsentPaths`, "differs from the exact predecessor/v6 absence roster");
  }
  const retainedBytes = safeInteger(row.retainedBytes, `${label}.retainedBytes`, 1);
  const observedWorkerProcessCount = safeInteger(
    row.observedWorkerProcessCount,
    `${label}.observedWorkerProcessCount`,
    1,
  );
  const observedWorkerLifetimeNanoseconds = safeInteger(
    row.observedWorkerLifetimeNanoseconds,
    `${label}.observedWorkerLifetimeNanoseconds`,
    1,
  );
  const creditedGovernedInvocationCount = safeInteger(
    row.creditedGovernedInvocationCount,
    `${label}.creditedGovernedInvocationCount`,
    1,
  );
  const creditedGovernedElapsedNanoseconds = safeInteger(
    row.creditedGovernedElapsedNanoseconds,
    `${label}.creditedGovernedElapsedNanoseconds`,
    1,
  );
  const creditedGovernedProcessHours = finiteNumber(
    row.creditedGovernedProcessHours,
    `${label}.creditedGovernedProcessHours`,
  );
  const retainedIdentityBytes = predecessorLockArtifacts.reduce((sum, entry) => sum + entry.byteLength, 0) +
    predecessorAttemptArtifacts.reduce((sum, entry) => sum + entry.byteLength, 0) +
    predecessorPublishedArtifacts.reduce((sum, entry) => sum + entry.byteLength, 0);
  if (retainedBytes !== PHASE10_C0V_S6_RECOVERY_V5_RETAINED_BYTES ||
    retainedBytes !== retainedIdentityBytes || observedWorkerProcessCount !== 1 ||
    observedWorkerLifetimeNanoseconds !== 134346732400 || creditedGovernedInvocationCount !== 4 ||
    creditedGovernedElapsedNanoseconds !==
      PHASE10_C0V_S6_RECOVERY_V5_CREDITED_GOVERNED_ELAPSED_NANOSECONDS ||
    creditedGovernedProcessHours !== 0.037186253527777775) {
    fail(label, "retained bytes, observed worker, or governed-credit accounting differs");
  }
  const successorRow = object(row.successor, `${label}.successor`);
  exactKeys(successorRow, [
    "packetCatalogueId", "packetCataloguePath", "maximumAuthorizedNewAttempts", "authorizedAttempts",
  ], `${label}.successor`);
  const authorizedAttempts = arrayValue(
    successorRow.authorizedAttempts,
    `${label}.successor.authorizedAttempts`,
  ).map((entry, index): Phase10C0VS6RecoveryAuthorizedAttempt => {
    const attemptLabel = `${label}.successor.authorizedAttempts[${index}]`;
    const attempt = object(entry, attemptLabel);
    exactKeys(attempt, ["packetId", "predecessorAttemptId", "successorAttemptId"], attemptLabel);
    return Object.freeze({
      packetId: parsePacketId(attempt.packetId, `${attemptLabel}.packetId`),
      predecessorAttemptId: parsePhase10C0VS6AttemptId(
        attempt.predecessorAttemptId,
        `${attemptLabel}.predecessorAttemptId`,
      ),
      successorAttemptId: parsePhase10C0VS6AttemptId(
        attempt.successorAttemptId,
        `${attemptLabel}.successorAttemptId`,
      ),
    });
  });
  const maximumAuthorizedNewAttempts = safeInteger(
    successorRow.maximumAuthorizedNewAttempts,
    `${label}.successor.maximumAuthorizedNewAttempts`,
    1,
  );
  if (maximumAuthorizedNewAttempts !== 1 || authorizedAttempts.length !== 1 ||
    authorizedAttempts[0]!.packetId !== "a-p-c0v-s6" ||
    authorizedAttempts[0]!.predecessorAttemptId !== "a-p-c0v-s6-20260822-v5" ||
    authorizedAttempts[0]!.successorAttemptId !== "a-p-c0v-s6-20260822-v6") {
    fail(`${label}.successor.authorizedAttempts`, "must authorize only the A-P v5-to-v6 successor");
  }
  return Object.freeze({
    schema: literal(row.schema, PHASE10_C0V_S6_RECOVERY_V5_AUTHORITY_SCHEMA, `${label}.schema`),
    recoveryAuthorityId: literal(
      row.recoveryAuthorityId,
      PHASE10_C0V_S6_RECOVERY_V5_AUTHORITY_ID,
      `${label}.recoveryAuthorityId`,
    ),
    automaticRetry: false,
    predecessorImplementationFreezeCommit: literal(
      row.predecessorImplementationFreezeCommit,
      PHASE10_C0V_S6_RECOVERY_V5_PREDECESSOR_IMPLEMENTATION_FREEZE_COMMIT,
      `${label}.predecessorImplementationFreezeCommit`,
    ),
    predecessorRecoveryAuthority,
    predecessorPacketCatalogue,
    predecessorApProtocol,
    predecessorLockArtifacts: Object.freeze(predecessorLockArtifacts) as unknown as
      Phase10C0VS6RecoveryV5Authority["predecessorLockArtifacts"],
    predecessorAttemptArtifacts: Object.freeze(predecessorAttemptArtifacts),
    predecessorPublishedArtifacts: Object.freeze(predecessorPublishedArtifacts),
    predecessorGovernedAbsentPaths: Object.freeze(predecessorGovernedAbsentPaths),
    retainedBytes: retainedBytes as typeof PHASE10_C0V_S6_RECOVERY_V5_RETAINED_BYTES,
    observedWorkerProcessCount: observedWorkerProcessCount as 1,
    observedWorkerLifetimeNanoseconds: observedWorkerLifetimeNanoseconds as 134346732400,
    creditedGovernedInvocationCount: creditedGovernedInvocationCount as 4,
    creditedGovernedElapsedNanoseconds: creditedGovernedElapsedNanoseconds as
      typeof PHASE10_C0V_S6_RECOVERY_V5_CREDITED_GOVERNED_ELAPSED_NANOSECONDS,
    creditedGovernedProcessHours: creditedGovernedProcessHours as 0.037186253527777775,
    successor: Object.freeze({
      packetCatalogueId: literal(
        successorRow.packetCatalogueId,
        PHASE10_C0V_S6_RECOVERY_V5_PACKET_CATALOGUE_ID,
        `${label}.successor.packetCatalogueId`,
      ),
      packetCataloguePath: literal(
        successorRow.packetCataloguePath,
        PHASE10_C0V_S6_RECOVERY_V5_PACKET_CATALOGUE_PATH,
        `${label}.successor.packetCataloguePath`,
      ),
      maximumAuthorizedNewAttempts: maximumAuthorizedNewAttempts as 1,
      authorizedAttempts: Object.freeze(authorizedAttempts) as unknown as
        Phase10C0VS6RecoveryV5Authority["successor"]["authorizedAttempts"],
    }),
  });
}

export function parsePhase10C0VS6RecoveryV6Authority(value: unknown): Phase10C0VS6RecoveryV6Authority {
  const label = "recovery-v6 authority";
  const row = object(value, label);
  exactKeys(row, [
    "schema", "recoveryAuthorityId", "automaticRetry", "predecessorImplementationFreezeCommit",
    "predecessorAcceptedPacketCommit", "predecessorRecoveryAuthority", "predecessorPacketCatalogue",
    "predecessorApProtocol", "predecessorAuthorizedPacketProtocol", "predecessorLockArtifacts",
    "predecessorAttemptArtifacts", "predecessorPublishedArtifacts", "predecessorGovernedAbsentPaths",
    "retainedBytes", "observedWorkerProcessCount", "observedWorkerLifetimeNanoseconds",
    "creditedGovernedInvocationCount", "creditedGovernedElapsedNanoseconds",
    "creditedGovernedProcessHours", "successor",
  ], label);
  if (row.automaticRetry !== false) fail(`${label}.automaticRetry`, "must be false");
  const predecessorRecoveryAuthority = parsePhase10C0VS6ArtifactIdentity(
    row.predecessorRecoveryAuthority,
    `${label}.predecessorRecoveryAuthority`,
  );
  const predecessorPacketCatalogue = parsePhase10C0VS6ArtifactIdentity(
    row.predecessorPacketCatalogue,
    `${label}.predecessorPacketCatalogue`,
  );
  const predecessorApProtocol = parsePhase10C0VS6ArtifactIdentity(
    row.predecessorApProtocol,
    `${label}.predecessorApProtocol`,
  );
  const predecessorAuthorizedPacketProtocol = parsePhase10C0VS6ArtifactIdentity(
    row.predecessorAuthorizedPacketProtocol,
    `${label}.predecessorAuthorizedPacketProtocol`,
  );
  if (!sameArtifactIdentity(
    predecessorRecoveryAuthority,
    PHASE10_C0V_S6_RECOVERY_V6_PREDECESSOR_RECOVERY_AUTHORITY,
  ) || !sameArtifactIdentity(
    predecessorPacketCatalogue,
    PHASE10_C0V_S6_RECOVERY_V6_PREDECESSOR_PACKET_CATALOGUE,
  ) || !sameArtifactIdentity(
    predecessorApProtocol,
    PHASE10_C0V_S6_RECOVERY_V6_PREDECESSOR_AP_PROTOCOL,
  ) || !sameArtifactIdentity(
    predecessorAuthorizedPacketProtocol,
    PHASE10_C0V_S6_RECOVERY_V6_PREDECESSOR_AUTHORIZED_PACKET_PROTOCOL,
  )) {
    fail(label, "recovery-v5 authority, catalogue, A-P protocol, or authorized moving protocol identity differs");
  }
  const predecessorLockArtifacts = arrayValue(
    row.predecessorLockArtifacts,
    `${label}.predecessorLockArtifacts`,
  ).map((entry, index): Phase10C0VS6RecoveryPredecessorLockArtifact => {
    const lockLabel = `${label}.predecessorLockArtifacts[${index}]`;
    const lock = object(entry, lockLabel);
    exactKeys(lock, ["path", "byteLength", "sha256", "parsedContent"], lockLabel);
    const identity = parsePhase10C0VS6ArtifactIdentity({
      path: lock.path,
      byteLength: lock.byteLength,
      sha256: lock.sha256,
    }, lockLabel);
    const contentRow = object(lock.parsedContent, `${lockLabel}.parsedContent`);
    exactKeys(
      contentRow,
      ["schema", "packetId", "attemptId", "processId", "acquiredAt"],
      `${lockLabel}.parsedContent`,
    );
    return Object.freeze({
      ...identity,
      parsedContent: Object.freeze({
        schema: literal(
          contentRow.schema,
          "phase10-c0v-s6-lock-v1",
          `${lockLabel}.parsedContent.schema`,
        ),
        packetId: stringValue(contentRow.packetId, `${lockLabel}.parsedContent.packetId`),
        attemptId: stringValue(contentRow.attemptId, `${lockLabel}.parsedContent.attemptId`),
        processId: safeInteger(contentRow.processId, `${lockLabel}.parsedContent.processId`, 1),
        acquiredAt: stringValue(contentRow.acquiredAt, `${lockLabel}.parsedContent.acquiredAt`),
      }),
    });
  });
  if (predecessorLockArtifacts.length !== PHASE10_C0V_S6_RECOVERY_V6_PREDECESSOR_LOCK_ARTIFACTS.length ||
    predecessorLockArtifacts.some((entry, index) => {
      const expected = PHASE10_C0V_S6_RECOVERY_V6_PREDECESSOR_LOCK_ARTIFACTS[index]!;
      return !sameArtifactIdentity(entry, expected) ||
        entry.parsedContent.schema !== expected.parsedContent.schema ||
        entry.parsedContent.packetId !== expected.parsedContent.packetId ||
        entry.parsedContent.attemptId !== expected.parsedContent.attemptId ||
        entry.parsedContent.processId !== expected.parsedContent.processId ||
        entry.parsedContent.acquiredAt !== expected.parsedContent.acquiredAt;
    })) {
    fail(`${label}.predecessorLockArtifacts`, "differs from the exact twelve retained locks");
  }
  const predecessorAttemptArtifacts = parseIdentityRoster(
    row.predecessorAttemptArtifacts,
    `${label}.predecessorAttemptArtifacts`,
  );
  if (predecessorAttemptArtifacts.length !==
      PHASE10_C0V_S6_RECOVERY_V6_PREDECESSOR_ATTEMPT_ARTIFACTS.length ||
    predecessorAttemptArtifacts.some((entry, index) => !sameArtifactIdentity(
      entry,
      PHASE10_C0V_S6_RECOVERY_V6_PREDECESSOR_ATTEMPT_ARTIFACTS[index]!,
    ))) {
    fail(`${label}.predecessorAttemptArtifacts`, "differs from the exact thirty-eight predecessor attempt files");
  }
  const predecessorPublishedArtifacts = parseIdentityRoster(
    row.predecessorPublishedArtifacts,
    `${label}.predecessorPublishedArtifacts`,
  );
  if (predecessorPublishedArtifacts.length !==
      PHASE10_C0V_S6_RECOVERY_V6_PREDECESSOR_PUBLISHED_ARTIFACTS.length ||
    predecessorPublishedArtifacts.some((entry, index) => !sameArtifactIdentity(
      entry,
      PHASE10_C0V_S6_RECOVERY_V6_PREDECESSOR_PUBLISHED_ARTIFACTS[index]!,
    ))) {
    fail(`${label}.predecessorPublishedArtifacts`, "differs from the exact ten pinned predecessor publications");
  }
  const predecessorGovernedAbsentPaths = arrayValue(
    row.predecessorGovernedAbsentPaths,
    `${label}.predecessorGovernedAbsentPaths`,
  ).map((entry, index) => safePath(entry, `${label}.predecessorGovernedAbsentPaths[${index}]`));
  if (predecessorGovernedAbsentPaths.length !== PHASE10_C0V_S6_RECOVERY_V6_GOVERNED_ABSENT_PATHS.length ||
    predecessorGovernedAbsentPaths.some((entry, index) =>
      entry !== PHASE10_C0V_S6_RECOVERY_V6_GOVERNED_ABSENT_PATHS[index])) {
    fail(`${label}.predecessorGovernedAbsentPaths`, "differs from the exact sixty-four predecessor/successor absences");
  }
  const retainedBytes = safeInteger(row.retainedBytes, `${label}.retainedBytes`, 1);
  const observedWorkerProcessCount = safeInteger(
    row.observedWorkerProcessCount,
    `${label}.observedWorkerProcessCount`,
  );
  const observedWorkerLifetimeNanoseconds = safeInteger(
    row.observedWorkerLifetimeNanoseconds,
    `${label}.observedWorkerLifetimeNanoseconds`,
  );
  const creditedGovernedInvocationCount = safeInteger(
    row.creditedGovernedInvocationCount,
    `${label}.creditedGovernedInvocationCount`,
  );
  const creditedGovernedElapsedNanoseconds = safeInteger(
    row.creditedGovernedElapsedNanoseconds,
    `${label}.creditedGovernedElapsedNanoseconds`,
  );
  const creditedGovernedProcessHours = finiteNumber(
    row.creditedGovernedProcessHours,
    `${label}.creditedGovernedProcessHours`,
  );
  const retainedIdentityBytes = predecessorLockArtifacts.reduce((sum, entry) => sum + entry.byteLength, 0) +
    predecessorAttemptArtifacts.reduce((sum, entry) => sum + entry.byteLength, 0) +
    predecessorPublishedArtifacts.reduce((sum, entry) => sum + entry.byteLength, 0);
  if (retainedBytes !== PHASE10_C0V_S6_RECOVERY_V6_RETAINED_BYTES ||
    retainedBytes !== retainedIdentityBytes || observedWorkerProcessCount !== 0 ||
    observedWorkerLifetimeNanoseconds !== 0 || creditedGovernedInvocationCount !== 0 ||
    creditedGovernedElapsedNanoseconds !== PHASE10_C0V_S6_RECOVERY_V6_CREDITED_GOVERNED_ELAPSED_NANOSECONDS ||
    creditedGovernedProcessHours !== 0) {
    fail(label, "retained bytes or zero latest-stop execution credit differs");
  }
  const successorRow = object(row.successor, `${label}.successor`);
  exactKeys(successorRow, [
    "packetCatalogueId", "packetCataloguePath", "maximumAuthorizedNewAttempts", "authorizedAttempts",
  ], `${label}.successor`);
  const authorizedAttempts = arrayValue(
    successorRow.authorizedAttempts,
    `${label}.successor.authorizedAttempts`,
  ).map((entry, index): Phase10C0VS6RecoveryAuthorizedAttempt => {
    const attemptLabel = `${label}.successor.authorizedAttempts[${index}]`;
    const attempt = object(entry, attemptLabel);
    exactKeys(attempt, ["packetId", "predecessorAttemptId", "successorAttemptId"], attemptLabel);
    return Object.freeze({
      packetId: parsePacketId(attempt.packetId, `${attemptLabel}.packetId`),
      predecessorAttemptId: parsePhase10C0VS6AttemptId(
        attempt.predecessorAttemptId,
        `${attemptLabel}.predecessorAttemptId`,
      ),
      successorAttemptId: parsePhase10C0VS6AttemptId(
        attempt.successorAttemptId,
        `${attemptLabel}.successorAttemptId`,
      ),
    });
  });
  const maximumAuthorizedNewAttempts = safeInteger(
    successorRow.maximumAuthorizedNewAttempts,
    `${label}.successor.maximumAuthorizedNewAttempts`,
    1,
  );
  if (maximumAuthorizedNewAttempts !== 1 || authorizedAttempts.length !== 1 ||
    authorizedAttempts[0]!.packetId !== "c0v-moving-produce" ||
    authorizedAttempts[0]!.predecessorAttemptId !== "c0v-moving-produce-20260822-v1" ||
    authorizedAttempts[0]!.successorAttemptId !== "c0v-moving-produce-20260822-v2") {
    fail(`${label}.successor.authorizedAttempts`, "must authorize only the moving-produce v1-to-v2 successor");
  }
  return Object.freeze({
    schema: literal(row.schema, PHASE10_C0V_S6_RECOVERY_V6_AUTHORITY_SCHEMA, `${label}.schema`),
    recoveryAuthorityId: literal(
      row.recoveryAuthorityId,
      PHASE10_C0V_S6_RECOVERY_V6_AUTHORITY_ID,
      `${label}.recoveryAuthorityId`,
    ),
    automaticRetry: false,
    predecessorImplementationFreezeCommit: literal(
      row.predecessorImplementationFreezeCommit,
      PHASE10_C0V_S6_RECOVERY_V6_PREDECESSOR_IMPLEMENTATION_FREEZE_COMMIT,
      `${label}.predecessorImplementationFreezeCommit`,
    ),
    predecessorAcceptedPacketCommit: literal(
      row.predecessorAcceptedPacketCommit,
      PHASE10_C0V_S6_RECOVERY_V6_PREDECESSOR_ACCEPTED_PACKET_COMMIT,
      `${label}.predecessorAcceptedPacketCommit`,
    ),
    predecessorRecoveryAuthority,
    predecessorPacketCatalogue,
    predecessorApProtocol,
    predecessorAuthorizedPacketProtocol,
    predecessorLockArtifacts: Object.freeze(predecessorLockArtifacts) as unknown as
      Phase10C0VS6RecoveryV6Authority["predecessorLockArtifacts"],
    predecessorAttemptArtifacts: Object.freeze(predecessorAttemptArtifacts),
    predecessorPublishedArtifacts: Object.freeze(predecessorPublishedArtifacts),
    predecessorGovernedAbsentPaths: Object.freeze(predecessorGovernedAbsentPaths),
    retainedBytes: retainedBytes as typeof PHASE10_C0V_S6_RECOVERY_V6_RETAINED_BYTES,
    observedWorkerProcessCount: observedWorkerProcessCount as 0,
    observedWorkerLifetimeNanoseconds: observedWorkerLifetimeNanoseconds as 0,
    creditedGovernedInvocationCount: creditedGovernedInvocationCount as 0,
    creditedGovernedElapsedNanoseconds: creditedGovernedElapsedNanoseconds as
      typeof PHASE10_C0V_S6_RECOVERY_V6_CREDITED_GOVERNED_ELAPSED_NANOSECONDS,
    creditedGovernedProcessHours: creditedGovernedProcessHours as 0,
    successor: Object.freeze({
      packetCatalogueId: literal(
        successorRow.packetCatalogueId,
        PHASE10_C0V_S6_RECOVERY_V6_PACKET_CATALOGUE_ID,
        `${label}.successor.packetCatalogueId`,
      ),
      packetCataloguePath: literal(
        successorRow.packetCataloguePath,
        PHASE10_C0V_S6_RECOVERY_V6_PACKET_CATALOGUE_PATH,
        `${label}.successor.packetCataloguePath`,
      ),
      maximumAuthorizedNewAttempts: maximumAuthorizedNewAttempts as 1,
      authorizedAttempts: Object.freeze(authorizedAttempts) as unknown as
        Phase10C0VS6RecoveryV6Authority["successor"]["authorizedAttempts"],
    }),
  });
}

export function parsePhase10C0VS6RecoveryV7Authority(value: unknown): Phase10C0VS6RecoveryV7Authority {
  const label = "recovery-v7 authority";
  const row = object(value, label);
  exactKeys(row, [
    "schema", "recoveryAuthorityId", "automaticRetry", "predecessorImplementationFreezeCommit",
    "predecessorAcceptedPacketCommit", "predecessorRecoveryAuthority", "predecessorPacketCatalogue",
    "predecessorApProtocol", "predecessorAuthorizedPacketProtocol", "predecessorLockArtifacts",
    "predecessorAttemptArtifacts", "predecessorPublishedArtifacts", "predecessorGovernedAbsentPaths",
    "retainedBytes", "observedWorkerProcessCount", "observedWorkerLifetimeNanoseconds",
    "creditedGovernedInvocationCount", "creditedGovernedElapsedNanoseconds",
    "creditedGovernedProcessHours", "successor",
  ], label);
  if (row.automaticRetry !== false) fail(`${label}.automaticRetry`, "must be false");
  const predecessorRecoveryAuthority = parsePhase10C0VS6ArtifactIdentity(
    row.predecessorRecoveryAuthority,
    `${label}.predecessorRecoveryAuthority`,
  );
  const predecessorPacketCatalogue = parsePhase10C0VS6ArtifactIdentity(
    row.predecessorPacketCatalogue,
    `${label}.predecessorPacketCatalogue`,
  );
  const predecessorApProtocol = parsePhase10C0VS6ArtifactIdentity(
    row.predecessorApProtocol,
    `${label}.predecessorApProtocol`,
  );
  const predecessorAuthorizedPacketProtocol = parsePhase10C0VS6ArtifactIdentity(
    row.predecessorAuthorizedPacketProtocol,
    `${label}.predecessorAuthorizedPacketProtocol`,
  );
  if (!sameArtifactIdentity(
    predecessorRecoveryAuthority,
    PHASE10_C0V_S6_RECOVERY_V7_PREDECESSOR_RECOVERY_AUTHORITY,
  ) || !sameArtifactIdentity(
    predecessorPacketCatalogue,
    PHASE10_C0V_S6_RECOVERY_V7_PREDECESSOR_PACKET_CATALOGUE,
  ) || !sameArtifactIdentity(
    predecessorApProtocol,
    PHASE10_C0V_S6_RECOVERY_V7_PREDECESSOR_AP_PROTOCOL,
  ) || !sameArtifactIdentity(
    predecessorAuthorizedPacketProtocol,
    PHASE10_C0V_S6_RECOVERY_V7_PREDECESSOR_AUTHORIZED_PACKET_PROTOCOL,
  )) {
    fail(label, "recovery-v6 authority, catalogue, A-P protocol, or authorized moving protocol identity differs");
  }
  const predecessorLockArtifacts = arrayValue(
    row.predecessorLockArtifacts,
    `${label}.predecessorLockArtifacts`,
  ).map((entry, index): Phase10C0VS6RecoveryPredecessorLockArtifact => {
    const lockLabel = `${label}.predecessorLockArtifacts[${index}]`;
    const lock = object(entry, lockLabel);
    exactKeys(lock, ["path", "byteLength", "sha256", "parsedContent"], lockLabel);
    const identity = parsePhase10C0VS6ArtifactIdentity({
      path: lock.path,
      byteLength: lock.byteLength,
      sha256: lock.sha256,
    }, lockLabel);
    const contentRow = object(lock.parsedContent, `${lockLabel}.parsedContent`);
    exactKeys(
      contentRow,
      ["schema", "packetId", "attemptId", "processId", "acquiredAt"],
      `${lockLabel}.parsedContent`,
    );
    return Object.freeze({
      ...identity,
      parsedContent: Object.freeze({
        schema: literal(
          contentRow.schema,
          "phase10-c0v-s6-lock-v1",
          `${lockLabel}.parsedContent.schema`,
        ),
        packetId: stringValue(contentRow.packetId, `${lockLabel}.parsedContent.packetId`),
        attemptId: stringValue(contentRow.attemptId, `${lockLabel}.parsedContent.attemptId`),
        processId: safeInteger(contentRow.processId, `${lockLabel}.parsedContent.processId`, 1),
        acquiredAt: stringValue(contentRow.acquiredAt, `${lockLabel}.parsedContent.acquiredAt`),
      }),
    });
  });
  if (predecessorLockArtifacts.length !== PHASE10_C0V_S6_RECOVERY_V7_PREDECESSOR_LOCK_ARTIFACTS.length ||
    predecessorLockArtifacts.some((entry, index) => {
      const expected = PHASE10_C0V_S6_RECOVERY_V7_PREDECESSOR_LOCK_ARTIFACTS[index]!;
      return !sameArtifactIdentity(entry, expected) ||
        entry.parsedContent.schema !== expected.parsedContent.schema ||
        entry.parsedContent.packetId !== expected.parsedContent.packetId ||
        entry.parsedContent.attemptId !== expected.parsedContent.attemptId ||
        entry.parsedContent.processId !== expected.parsedContent.processId ||
        entry.parsedContent.acquiredAt !== expected.parsedContent.acquiredAt;
    })) {
    fail(`${label}.predecessorLockArtifacts`, "differs from the exact fourteen retained locks");
  }
  const predecessorAttemptArtifacts = parseIdentityRoster(
    row.predecessorAttemptArtifacts,
    `${label}.predecessorAttemptArtifacts`,
  );
  if (predecessorAttemptArtifacts.length !==
      PHASE10_C0V_S6_RECOVERY_V7_PREDECESSOR_ATTEMPT_ARTIFACTS.length ||
    predecessorAttemptArtifacts.some((entry, index) => !sameArtifactIdentity(
      entry,
      PHASE10_C0V_S6_RECOVERY_V7_PREDECESSOR_ATTEMPT_ARTIFACTS[index]!,
    ))) {
    fail(`${label}.predecessorAttemptArtifacts`, "differs from the exact thirty-eight predecessor attempt files");
  }
  const predecessorPublishedArtifacts = parseIdentityRoster(
    row.predecessorPublishedArtifacts,
    `${label}.predecessorPublishedArtifacts`,
  );
  if (predecessorPublishedArtifacts.length !==
      PHASE10_C0V_S6_RECOVERY_V7_PREDECESSOR_PUBLISHED_ARTIFACTS.length ||
    predecessorPublishedArtifacts.some((entry, index) => !sameArtifactIdentity(
      entry,
      PHASE10_C0V_S6_RECOVERY_V7_PREDECESSOR_PUBLISHED_ARTIFACTS[index]!,
    ))) {
    fail(`${label}.predecessorPublishedArtifacts`, "differs from the exact ten pinned predecessor publications");
  }
  const predecessorGovernedAbsentPaths = arrayValue(
    row.predecessorGovernedAbsentPaths,
    `${label}.predecessorGovernedAbsentPaths`,
  ).map((entry, index) => safePath(entry, `${label}.predecessorGovernedAbsentPaths[${index}]`));
  if (predecessorGovernedAbsentPaths.length !== PHASE10_C0V_S6_RECOVERY_V7_GOVERNED_ABSENT_PATHS.length ||
    predecessorGovernedAbsentPaths.some((entry, index) =>
      entry !== PHASE10_C0V_S6_RECOVERY_V7_GOVERNED_ABSENT_PATHS[index])) {
    fail(`${label}.predecessorGovernedAbsentPaths`, "differs from the exact sixty-nine predecessor/successor absences");
  }
  const retainedBytes = safeInteger(row.retainedBytes, `${label}.retainedBytes`, 1);
  const observedWorkerProcessCount = safeInteger(
    row.observedWorkerProcessCount,
    `${label}.observedWorkerProcessCount`,
  );
  const observedWorkerLifetimeNanoseconds = safeInteger(
    row.observedWorkerLifetimeNanoseconds,
    `${label}.observedWorkerLifetimeNanoseconds`,
  );
  const creditedGovernedInvocationCount = safeInteger(
    row.creditedGovernedInvocationCount,
    `${label}.creditedGovernedInvocationCount`,
  );
  const creditedGovernedElapsedNanoseconds = safeInteger(
    row.creditedGovernedElapsedNanoseconds,
    `${label}.creditedGovernedElapsedNanoseconds`,
  );
  const creditedGovernedProcessHours = finiteNumber(
    row.creditedGovernedProcessHours,
    `${label}.creditedGovernedProcessHours`,
  );
  const retainedIdentityBytes = predecessorLockArtifacts.reduce((sum, entry) => sum + entry.byteLength, 0) +
    predecessorAttemptArtifacts.reduce((sum, entry) => sum + entry.byteLength, 0) +
    predecessorPublishedArtifacts.reduce((sum, entry) => sum + entry.byteLength, 0);
  if (retainedBytes !== PHASE10_C0V_S6_RECOVERY_V7_RETAINED_BYTES ||
    retainedBytes !== retainedIdentityBytes || observedWorkerProcessCount !== 0 ||
    observedWorkerLifetimeNanoseconds !== 0 || creditedGovernedInvocationCount !== 0 ||
    creditedGovernedElapsedNanoseconds !== PHASE10_C0V_S6_RECOVERY_V7_CREDITED_GOVERNED_ELAPSED_NANOSECONDS ||
    creditedGovernedProcessHours !== 0) {
    fail(label, "retained bytes or zero latest-stop execution credit differs");
  }
  const successorRow = object(row.successor, `${label}.successor`);
  exactKeys(successorRow, [
    "packetCatalogueId", "packetCataloguePath", "maximumAuthorizedNewAttempts", "authorizedAttempts",
  ], `${label}.successor`);
  const authorizedAttempts = arrayValue(
    successorRow.authorizedAttempts,
    `${label}.successor.authorizedAttempts`,
  ).map((entry, index): Phase10C0VS6RecoveryAuthorizedAttempt => {
    const attemptLabel = `${label}.successor.authorizedAttempts[${index}]`;
    const attempt = object(entry, attemptLabel);
    exactKeys(attempt, ["packetId", "predecessorAttemptId", "successorAttemptId"], attemptLabel);
    return Object.freeze({
      packetId: parsePacketId(attempt.packetId, `${attemptLabel}.packetId`),
      predecessorAttemptId: parsePhase10C0VS6AttemptId(
        attempt.predecessorAttemptId,
        `${attemptLabel}.predecessorAttemptId`,
      ),
      successorAttemptId: parsePhase10C0VS6AttemptId(
        attempt.successorAttemptId,
        `${attemptLabel}.successorAttemptId`,
      ),
    });
  });
  const maximumAuthorizedNewAttempts = safeInteger(
    successorRow.maximumAuthorizedNewAttempts,
    `${label}.successor.maximumAuthorizedNewAttempts`,
    1,
  );
  if (maximumAuthorizedNewAttempts !== 1 || authorizedAttempts.length !== 1 ||
    authorizedAttempts[0]!.packetId !== "c0v-moving-produce" ||
    authorizedAttempts[0]!.predecessorAttemptId !== "c0v-moving-produce-20260822-v2" ||
    authorizedAttempts[0]!.successorAttemptId !== "c0v-moving-produce-20260822-v3") {
    fail(`${label}.successor.authorizedAttempts`, "must authorize only the moving-produce v2-to-v3 successor");
  }
  return Object.freeze({
    schema: literal(row.schema, PHASE10_C0V_S6_RECOVERY_V7_AUTHORITY_SCHEMA, `${label}.schema`),
    recoveryAuthorityId: literal(
      row.recoveryAuthorityId,
      PHASE10_C0V_S6_RECOVERY_V7_AUTHORITY_ID,
      `${label}.recoveryAuthorityId`,
    ),
    automaticRetry: false,
    predecessorImplementationFreezeCommit: literal(
      row.predecessorImplementationFreezeCommit,
      PHASE10_C0V_S6_RECOVERY_V7_PREDECESSOR_IMPLEMENTATION_FREEZE_COMMIT,
      `${label}.predecessorImplementationFreezeCommit`,
    ),
    predecessorAcceptedPacketCommit: literal(
      row.predecessorAcceptedPacketCommit,
      PHASE10_C0V_S6_RECOVERY_V7_PREDECESSOR_ACCEPTED_PACKET_COMMIT,
      `${label}.predecessorAcceptedPacketCommit`,
    ),
    predecessorRecoveryAuthority,
    predecessorPacketCatalogue,
    predecessorApProtocol,
    predecessorAuthorizedPacketProtocol,
    predecessorLockArtifacts: Object.freeze(predecessorLockArtifacts) as unknown as
      Phase10C0VS6RecoveryV7Authority["predecessorLockArtifacts"],
    predecessorAttemptArtifacts: Object.freeze(predecessorAttemptArtifacts),
    predecessorPublishedArtifacts: Object.freeze(predecessorPublishedArtifacts),
    predecessorGovernedAbsentPaths: Object.freeze(predecessorGovernedAbsentPaths),
    retainedBytes: retainedBytes as typeof PHASE10_C0V_S6_RECOVERY_V7_RETAINED_BYTES,
    observedWorkerProcessCount: observedWorkerProcessCount as 0,
    observedWorkerLifetimeNanoseconds: observedWorkerLifetimeNanoseconds as 0,
    creditedGovernedInvocationCount: creditedGovernedInvocationCount as 0,
    creditedGovernedElapsedNanoseconds: creditedGovernedElapsedNanoseconds as
      typeof PHASE10_C0V_S6_RECOVERY_V7_CREDITED_GOVERNED_ELAPSED_NANOSECONDS,
    creditedGovernedProcessHours: creditedGovernedProcessHours as 0,
    successor: Object.freeze({
      packetCatalogueId: literal(
        successorRow.packetCatalogueId,
        PHASE10_C0V_S6_RECOVERY_V7_PACKET_CATALOGUE_ID,
        `${label}.successor.packetCatalogueId`,
      ),
      packetCataloguePath: literal(
        successorRow.packetCataloguePath,
        PHASE10_C0V_S6_RECOVERY_V7_PACKET_CATALOGUE_PATH,
        `${label}.successor.packetCataloguePath`,
      ),
      maximumAuthorizedNewAttempts: maximumAuthorizedNewAttempts as 1,
      authorizedAttempts: Object.freeze(authorizedAttempts) as unknown as
        Phase10C0VS6RecoveryV7Authority["successor"]["authorizedAttempts"],
    }),
  });
}

export function parsePhase10C0VS6RecoveryV8Authority(value: unknown): Phase10C0VS6RecoveryV8Authority {
  const label = "recovery-v8 authority";
  const row = object(value, label);
  exactKeys(row, [
    "schema", "recoveryAuthorityId", "automaticRetry", "predecessorImplementationFreezeCommit",
    "predecessorAcceptedPacketCommit", "predecessorRecoveryAuthority", "predecessorPacketCatalogue",
    "predecessorApProtocol", "predecessorAuthorizedPacketProtocol", "predecessorLockArtifacts",
    "predecessorAttemptArtifacts", "predecessorPublishedArtifacts", "predecessorGovernedAbsentPaths",
    "retainedBytes", "observedWorkerProcessCount", "observedWorkerLifetimeNanoseconds",
    "creditedGovernedInvocationCount", "creditedGovernedElapsedNanoseconds",
    "creditedGovernedProcessHours", "successor",
  ], label);
  if (row.automaticRetry !== false) fail(`${label}.automaticRetry`, "must be false");
  const predecessorRecoveryAuthority = parsePhase10C0VS6ArtifactIdentity(
    row.predecessorRecoveryAuthority,
    `${label}.predecessorRecoveryAuthority`,
  );
  const predecessorPacketCatalogue = parsePhase10C0VS6ArtifactIdentity(
    row.predecessorPacketCatalogue,
    `${label}.predecessorPacketCatalogue`,
  );
  const predecessorApProtocol = parsePhase10C0VS6ArtifactIdentity(
    row.predecessorApProtocol,
    `${label}.predecessorApProtocol`,
  );
  const predecessorAuthorizedPacketProtocol = parsePhase10C0VS6ArtifactIdentity(
    row.predecessorAuthorizedPacketProtocol,
    `${label}.predecessorAuthorizedPacketProtocol`,
  );
  if (!sameArtifactIdentity(
    predecessorRecoveryAuthority,
    PHASE10_C0V_S6_RECOVERY_V8_PREDECESSOR_RECOVERY_AUTHORITY,
  ) || !sameArtifactIdentity(
    predecessorPacketCatalogue,
    PHASE10_C0V_S6_RECOVERY_V8_PREDECESSOR_PACKET_CATALOGUE,
  ) || !sameArtifactIdentity(
    predecessorApProtocol,
    PHASE10_C0V_S6_RECOVERY_V8_PREDECESSOR_AP_PROTOCOL,
  ) || !sameArtifactIdentity(
    predecessorAuthorizedPacketProtocol,
    PHASE10_C0V_S6_RECOVERY_V8_PREDECESSOR_AUTHORIZED_PACKET_PROTOCOL,
  )) {
    fail(label, "recovery-v7 authority, catalogue, A-P protocol, or authorized moving protocol identity differs");
  }
  const predecessorLockArtifacts = arrayValue(
    row.predecessorLockArtifacts,
    `${label}.predecessorLockArtifacts`,
  ).map((entry, index): Phase10C0VS6RecoveryPredecessorLockArtifact => {
    const lockLabel = `${label}.predecessorLockArtifacts[${index}]`;
    const lock = object(entry, lockLabel);
    exactKeys(lock, ["path", "byteLength", "sha256", "parsedContent"], lockLabel);
    const identity = parsePhase10C0VS6ArtifactIdentity({
      path: lock.path,
      byteLength: lock.byteLength,
      sha256: lock.sha256,
    }, lockLabel);
    const contentRow = object(lock.parsedContent, `${lockLabel}.parsedContent`);
    exactKeys(
      contentRow,
      ["schema", "packetId", "attemptId", "processId", "acquiredAt"],
      `${lockLabel}.parsedContent`,
    );
    return Object.freeze({
      ...identity,
      parsedContent: Object.freeze({
        schema: literal(
          contentRow.schema,
          "phase10-c0v-s6-lock-v1",
          `${lockLabel}.parsedContent.schema`,
        ),
        packetId: stringValue(contentRow.packetId, `${lockLabel}.parsedContent.packetId`),
        attemptId: stringValue(contentRow.attemptId, `${lockLabel}.parsedContent.attemptId`),
        processId: safeInteger(contentRow.processId, `${lockLabel}.parsedContent.processId`, 1),
        acquiredAt: stringValue(contentRow.acquiredAt, `${lockLabel}.parsedContent.acquiredAt`),
      }),
    });
  });
  if (predecessorLockArtifacts.length !== PHASE10_C0V_S6_RECOVERY_V8_PREDECESSOR_LOCK_ARTIFACTS.length ||
    predecessorLockArtifacts.some((entry, index) => {
      const expected = PHASE10_C0V_S6_RECOVERY_V8_PREDECESSOR_LOCK_ARTIFACTS[index]!;
      return !sameArtifactIdentity(entry, expected) ||
        entry.parsedContent.schema !== expected.parsedContent.schema ||
        entry.parsedContent.packetId !== expected.parsedContent.packetId ||
        entry.parsedContent.attemptId !== expected.parsedContent.attemptId ||
        entry.parsedContent.processId !== expected.parsedContent.processId ||
        entry.parsedContent.acquiredAt !== expected.parsedContent.acquiredAt;
    })) {
    fail(`${label}.predecessorLockArtifacts`, "differs from the exact sixteen retained locks");
  }
  const predecessorAttemptArtifacts = parseIdentityRoster(
    row.predecessorAttemptArtifacts,
    `${label}.predecessorAttemptArtifacts`,
  );
  if (predecessorAttemptArtifacts.length !==
      PHASE10_C0V_S6_RECOVERY_V8_PREDECESSOR_ATTEMPT_ARTIFACTS.length ||
    predecessorAttemptArtifacts.some((entry, index) => !sameArtifactIdentity(
      entry,
      PHASE10_C0V_S6_RECOVERY_V8_PREDECESSOR_ATTEMPT_ARTIFACTS[index]!,
    ))) {
    fail(`${label}.predecessorAttemptArtifacts`, "differs from the exact thirty-eight predecessor attempt files");
  }
  const predecessorPublishedArtifacts = parseIdentityRoster(
    row.predecessorPublishedArtifacts,
    `${label}.predecessorPublishedArtifacts`,
  );
  if (predecessorPublishedArtifacts.length !==
      PHASE10_C0V_S6_RECOVERY_V8_PREDECESSOR_PUBLISHED_ARTIFACTS.length ||
    predecessorPublishedArtifacts.some((entry, index) => !sameArtifactIdentity(
      entry,
      PHASE10_C0V_S6_RECOVERY_V8_PREDECESSOR_PUBLISHED_ARTIFACTS[index]!,
    ))) {
    fail(`${label}.predecessorPublishedArtifacts`, "differs from the exact ten pinned predecessor publications");
  }
  const predecessorGovernedAbsentPaths = arrayValue(
    row.predecessorGovernedAbsentPaths,
    `${label}.predecessorGovernedAbsentPaths`,
  ).map((entry, index) => safePath(entry, `${label}.predecessorGovernedAbsentPaths[${index}]`));
  if (predecessorGovernedAbsentPaths.length !== PHASE10_C0V_S6_RECOVERY_V8_GOVERNED_ABSENT_PATHS.length ||
    predecessorGovernedAbsentPaths.some((entry, index) =>
      entry !== PHASE10_C0V_S6_RECOVERY_V8_GOVERNED_ABSENT_PATHS[index])) {
    fail(`${label}.predecessorGovernedAbsentPaths`, "differs from the exact seventy-four predecessor/successor absences");
  }
  const retainedBytes = safeInteger(row.retainedBytes, `${label}.retainedBytes`, 1);
  const observedWorkerProcessCount = safeInteger(
    row.observedWorkerProcessCount,
    `${label}.observedWorkerProcessCount`,
  );
  const observedWorkerLifetimeNanoseconds = safeInteger(
    row.observedWorkerLifetimeNanoseconds,
    `${label}.observedWorkerLifetimeNanoseconds`,
  );
  const creditedGovernedInvocationCount = safeInteger(
    row.creditedGovernedInvocationCount,
    `${label}.creditedGovernedInvocationCount`,
  );
  const creditedGovernedElapsedNanoseconds = safeInteger(
    row.creditedGovernedElapsedNanoseconds,
    `${label}.creditedGovernedElapsedNanoseconds`,
  );
  const creditedGovernedProcessHours = finiteNumber(
    row.creditedGovernedProcessHours,
    `${label}.creditedGovernedProcessHours`,
  );
  const retainedIdentityBytes = predecessorLockArtifacts.reduce((sum, entry) => sum + entry.byteLength, 0) +
    predecessorAttemptArtifacts.reduce((sum, entry) => sum + entry.byteLength, 0) +
    predecessorPublishedArtifacts.reduce((sum, entry) => sum + entry.byteLength, 0);
  if (retainedBytes !== PHASE10_C0V_S6_RECOVERY_V8_RETAINED_BYTES ||
    retainedBytes !== retainedIdentityBytes || observedWorkerProcessCount !== 0 ||
    observedWorkerLifetimeNanoseconds !== 0 || creditedGovernedInvocationCount !== 0 ||
    creditedGovernedElapsedNanoseconds !== PHASE10_C0V_S6_RECOVERY_V8_CREDITED_GOVERNED_ELAPSED_NANOSECONDS ||
    creditedGovernedProcessHours !== 0) {
    fail(label, "retained bytes or zero latest-stop execution credit differs");
  }
  const successorRow = object(row.successor, `${label}.successor`);
  exactKeys(successorRow, [
    "packetCatalogueId", "packetCataloguePath", "maximumAuthorizedNewAttempts", "authorizedAttempts",
  ], `${label}.successor`);
  const authorizedAttempts = arrayValue(
    successorRow.authorizedAttempts,
    `${label}.successor.authorizedAttempts`,
  ).map((entry, index): Phase10C0VS6RecoveryAuthorizedAttempt => {
    const attemptLabel = `${label}.successor.authorizedAttempts[${index}]`;
    const attempt = object(entry, attemptLabel);
    exactKeys(attempt, ["packetId", "predecessorAttemptId", "successorAttemptId"], attemptLabel);
    return Object.freeze({
      packetId: parsePacketId(attempt.packetId, `${attemptLabel}.packetId`),
      predecessorAttemptId: parsePhase10C0VS6AttemptId(
        attempt.predecessorAttemptId,
        `${attemptLabel}.predecessorAttemptId`,
      ),
      successorAttemptId: parsePhase10C0VS6AttemptId(
        attempt.successorAttemptId,
        `${attemptLabel}.successorAttemptId`,
      ),
    });
  });
  const maximumAuthorizedNewAttempts = safeInteger(
    successorRow.maximumAuthorizedNewAttempts,
    `${label}.successor.maximumAuthorizedNewAttempts`,
    1,
  );
  if (maximumAuthorizedNewAttempts !== 1 || authorizedAttempts.length !== 1 ||
    authorizedAttempts[0]!.packetId !== "c0v-moving-produce" ||
    authorizedAttempts[0]!.predecessorAttemptId !== "c0v-moving-produce-20260822-v3" ||
    authorizedAttempts[0]!.successorAttemptId !== PHASE10_C0V_S6_RECOVERY_V8_MOVING_ATTEMPT_ID) {
    fail(`${label}.successor.authorizedAttempts`, "must authorize only the moving-produce v3-to-v4 successor");
  }
  return Object.freeze({
    schema: literal(row.schema, PHASE10_C0V_S6_RECOVERY_V8_AUTHORITY_SCHEMA, `${label}.schema`),
    recoveryAuthorityId: literal(
      row.recoveryAuthorityId,
      PHASE10_C0V_S6_RECOVERY_V8_AUTHORITY_ID,
      `${label}.recoveryAuthorityId`,
    ),
    automaticRetry: false,
    predecessorImplementationFreezeCommit: literal(
      row.predecessorImplementationFreezeCommit,
      PHASE10_C0V_S6_RECOVERY_V8_PREDECESSOR_IMPLEMENTATION_FREEZE_COMMIT,
      `${label}.predecessorImplementationFreezeCommit`,
    ),
    predecessorAcceptedPacketCommit: literal(
      row.predecessorAcceptedPacketCommit,
      PHASE10_C0V_S6_RECOVERY_V8_PREDECESSOR_ACCEPTED_PACKET_COMMIT,
      `${label}.predecessorAcceptedPacketCommit`,
    ),
    predecessorRecoveryAuthority,
    predecessorPacketCatalogue,
    predecessorApProtocol,
    predecessorAuthorizedPacketProtocol,
    predecessorLockArtifacts: Object.freeze(predecessorLockArtifacts) as unknown as
      Phase10C0VS6RecoveryV8Authority["predecessorLockArtifacts"],
    predecessorAttemptArtifacts: Object.freeze(predecessorAttemptArtifacts),
    predecessorPublishedArtifacts: Object.freeze(predecessorPublishedArtifacts),
    predecessorGovernedAbsentPaths: Object.freeze(predecessorGovernedAbsentPaths),
    retainedBytes: retainedBytes as typeof PHASE10_C0V_S6_RECOVERY_V8_RETAINED_BYTES,
    observedWorkerProcessCount: observedWorkerProcessCount as 0,
    observedWorkerLifetimeNanoseconds: observedWorkerLifetimeNanoseconds as 0,
    creditedGovernedInvocationCount: creditedGovernedInvocationCount as 0,
    creditedGovernedElapsedNanoseconds: creditedGovernedElapsedNanoseconds as
      typeof PHASE10_C0V_S6_RECOVERY_V8_CREDITED_GOVERNED_ELAPSED_NANOSECONDS,
    creditedGovernedProcessHours: creditedGovernedProcessHours as 0,
    successor: Object.freeze({
      packetCatalogueId: literal(
        successorRow.packetCatalogueId,
        PHASE10_C0V_S6_RECOVERY_V8_PACKET_CATALOGUE_ID,
        `${label}.successor.packetCatalogueId`,
      ),
      packetCataloguePath: literal(
        successorRow.packetCataloguePath,
        PHASE10_C0V_S6_RECOVERY_V8_PACKET_CATALOGUE_PATH,
        `${label}.successor.packetCataloguePath`,
      ),
      maximumAuthorizedNewAttempts: maximumAuthorizedNewAttempts as 1,
      authorizedAttempts: Object.freeze(authorizedAttempts) as unknown as
        Phase10C0VS6RecoveryV8Authority["successor"]["authorizedAttempts"],
    }),
  });
}


export function parsePhase10C0VS6RecoveryV9Authority(value: unknown): Phase10C0VS6RecoveryV9Authority {
  const label = "recovery-v9 authority";
  const row = object(value, label);
  exactKeys(row, [
    "schema", "recoveryAuthorityId", "automaticRetry", "predecessorImplementationFreezeCommit",
    "predecessorAcceptedPacketCommit", "predecessorRecoveryAuthority", "predecessorPacketCatalogue",
    "predecessorApProtocol", "predecessorAuthorizedPacketProtocol", "predecessorLockArtifacts",
    "predecessorAttemptArtifacts", "predecessorPublishedArtifacts", "predecessorGovernedAbsentPaths",
    "retainedBytes", "observedWorkerProcessCount", "observedWorkerLifetimeNanoseconds",
    "creditedGovernedInvocationCount", "creditedGovernedElapsedNanoseconds",
    "creditedGovernedProcessHours", "successor",
  ], label);
  if (row.automaticRetry !== false) fail(`${label}.automaticRetry`, "must be false");
  const predecessorRecoveryAuthority = parsePhase10C0VS6ArtifactIdentity(
    row.predecessorRecoveryAuthority,
    `${label}.predecessorRecoveryAuthority`,
  );
  const predecessorPacketCatalogue = parsePhase10C0VS6ArtifactIdentity(
    row.predecessorPacketCatalogue,
    `${label}.predecessorPacketCatalogue`,
  );
  const predecessorApProtocol = parsePhase10C0VS6ArtifactIdentity(
    row.predecessorApProtocol,
    `${label}.predecessorApProtocol`,
  );
  const predecessorAuthorizedPacketProtocol = parsePhase10C0VS6ArtifactIdentity(
    row.predecessorAuthorizedPacketProtocol,
    `${label}.predecessorAuthorizedPacketProtocol`,
  );
  if (!sameArtifactIdentity(
    predecessorRecoveryAuthority,
    PHASE10_C0V_S6_RECOVERY_V9_PREDECESSOR_RECOVERY_AUTHORITY,
  ) || !sameArtifactIdentity(
    predecessorPacketCatalogue,
    PHASE10_C0V_S6_RECOVERY_V9_PREDECESSOR_PACKET_CATALOGUE,
  ) || !sameArtifactIdentity(
    predecessorApProtocol,
    PHASE10_C0V_S6_RECOVERY_V9_PREDECESSOR_AP_PROTOCOL,
  ) || !sameArtifactIdentity(
    predecessorAuthorizedPacketProtocol,
    PHASE10_C0V_S6_RECOVERY_V9_PREDECESSOR_AUTHORIZED_PACKET_PROTOCOL,
  )) {
    fail(label, "recovery-v8 authority, catalogue, A-P protocol, or authorized moving protocol identity differs");
  }
  const predecessorLockArtifacts = arrayValue(
    row.predecessorLockArtifacts,
    `${label}.predecessorLockArtifacts`,
  ).map((entry, index): Phase10C0VS6RecoveryPredecessorLockArtifact => {
    const lockLabel = `${label}.predecessorLockArtifacts[${index}]`;
    const lock = object(entry, lockLabel);
    exactKeys(lock, ["path", "byteLength", "sha256", "parsedContent"], lockLabel);
    const identity = parsePhase10C0VS6ArtifactIdentity({
      path: lock.path,
      byteLength: lock.byteLength,
      sha256: lock.sha256,
    }, lockLabel);
    const contentRow = object(lock.parsedContent, `${lockLabel}.parsedContent`);
    exactKeys(
      contentRow,
      ["schema", "packetId", "attemptId", "processId", "acquiredAt"],
      `${lockLabel}.parsedContent`,
    );
    return Object.freeze({
      ...identity,
      parsedContent: Object.freeze({
        schema: literal(
          contentRow.schema,
          "phase10-c0v-s6-lock-v1",
          `${lockLabel}.parsedContent.schema`,
        ),
        packetId: stringValue(contentRow.packetId, `${lockLabel}.parsedContent.packetId`),
        attemptId: stringValue(contentRow.attemptId, `${lockLabel}.parsedContent.attemptId`),
        processId: safeInteger(contentRow.processId, `${lockLabel}.parsedContent.processId`, 1),
        acquiredAt: stringValue(contentRow.acquiredAt, `${lockLabel}.parsedContent.acquiredAt`),
      }),
    });
  });
  if (predecessorLockArtifacts.length !== PHASE10_C0V_S6_RECOVERY_V9_PREDECESSOR_LOCK_ARTIFACTS.length ||
    predecessorLockArtifacts.some((entry, index) => {
      const expected = PHASE10_C0V_S6_RECOVERY_V9_PREDECESSOR_LOCK_ARTIFACTS[index]!;
      return !sameArtifactIdentity(entry, expected) ||
        entry.parsedContent.schema !== expected.parsedContent.schema ||
        entry.parsedContent.packetId !== expected.parsedContent.packetId ||
        entry.parsedContent.attemptId !== expected.parsedContent.attemptId ||
        entry.parsedContent.processId !== expected.parsedContent.processId ||
        entry.parsedContent.acquiredAt !== expected.parsedContent.acquiredAt;
    })) {
    fail(`${label}.predecessorLockArtifacts`, "differs from the exact eighteen retained locks");
  }
  const predecessorAttemptArtifacts = parseIdentityRoster(
    row.predecessorAttemptArtifacts,
    `${label}.predecessorAttemptArtifacts`,
  );
  if (predecessorAttemptArtifacts.length !==
      PHASE10_C0V_S6_RECOVERY_V9_PREDECESSOR_ATTEMPT_ARTIFACTS.length ||
    predecessorAttemptArtifacts.some((entry, index) => !sameArtifactIdentity(
      entry,
      PHASE10_C0V_S6_RECOVERY_V9_PREDECESSOR_ATTEMPT_ARTIFACTS[index]!,
    ))) {
    fail(`${label}.predecessorAttemptArtifacts`, "differs from the exact forty-four predecessor attempt files");
  }
  const predecessorPublishedArtifacts = parseIdentityRoster(
    row.predecessorPublishedArtifacts,
    `${label}.predecessorPublishedArtifacts`,
  );
  if (predecessorPublishedArtifacts.length !==
      PHASE10_C0V_S6_RECOVERY_V9_PREDECESSOR_PUBLISHED_ARTIFACTS.length ||
    predecessorPublishedArtifacts.some((entry, index) => !sameArtifactIdentity(
      entry,
      PHASE10_C0V_S6_RECOVERY_V9_PREDECESSOR_PUBLISHED_ARTIFACTS[index]!,
    ))) {
    fail(`${label}.predecessorPublishedArtifacts`, "differs from the exact eleven pinned predecessor publications");
  }
  const predecessorGovernedAbsentPaths = arrayValue(
    row.predecessorGovernedAbsentPaths,
    `${label}.predecessorGovernedAbsentPaths`,
  ).map((entry, index) => safePath(entry, `${label}.predecessorGovernedAbsentPaths[${index}]`));
  if (predecessorGovernedAbsentPaths.length !== PHASE10_C0V_S6_RECOVERY_V9_GOVERNED_ABSENT_PATHS.length ||
    predecessorGovernedAbsentPaths.some((entry, index) =>
      entry !== PHASE10_C0V_S6_RECOVERY_V9_GOVERNED_ABSENT_PATHS[index])) {
    fail(`${label}.predecessorGovernedAbsentPaths`, "differs from the exact eighty predecessor/successor absences");
  }
  const retainedBytes = safeInteger(row.retainedBytes, `${label}.retainedBytes`, 1);
  const observedWorkerProcessCount = safeInteger(
    row.observedWorkerProcessCount,
    `${label}.observedWorkerProcessCount`,
  );
  const observedWorkerLifetimeNanoseconds = safeInteger(
    row.observedWorkerLifetimeNanoseconds,
    `${label}.observedWorkerLifetimeNanoseconds`,
  );
  const creditedGovernedInvocationCount = safeInteger(
    row.creditedGovernedInvocationCount,
    `${label}.creditedGovernedInvocationCount`,
  );
  const creditedGovernedElapsedNanoseconds = safeInteger(
    row.creditedGovernedElapsedNanoseconds,
    `${label}.creditedGovernedElapsedNanoseconds`,
  );
  const creditedGovernedProcessHours = finiteNumber(
    row.creditedGovernedProcessHours,
    `${label}.creditedGovernedProcessHours`,
  );
  const retainedIdentityBytes = predecessorLockArtifacts.reduce((sum, entry) => sum + entry.byteLength, 0) +
    predecessorAttemptArtifacts.reduce((sum, entry) => sum + entry.byteLength, 0) +
    predecessorPublishedArtifacts.reduce((sum, entry) => sum + entry.byteLength, 0);
  if (retainedBytes !== PHASE10_C0V_S6_RECOVERY_V9_RETAINED_BYTES ||
    retainedBytes !== retainedIdentityBytes || observedWorkerProcessCount !== 1 ||
    observedWorkerLifetimeNanoseconds !== PHASE10_C0V_S6_RECOVERY_V9_OBSERVED_WORKER_LIFETIME_NANOSECONDS ||
    creditedGovernedInvocationCount !== 1 ||
    creditedGovernedElapsedNanoseconds !== PHASE10_C0V_S6_RECOVERY_V9_CREDITED_GOVERNED_ELAPSED_NANOSECONDS ||
    creditedGovernedProcessHours !== PHASE10_C0V_S6_RECOVERY_V9_CREDITED_GOVERNED_PROCESS_HOURS) {
    fail(label, "retained bytes or retained moving-v4 execution observation differs");
  }
  const successorRow = object(row.successor, `${label}.successor`);
  exactKeys(successorRow, [
    "packetCatalogueId", "packetCataloguePath", "maximumAuthorizedNewAttempts", "authorizedAttempts",
  ], `${label}.successor`);
  const authorizedAttempts = arrayValue(
    successorRow.authorizedAttempts,
    `${label}.successor.authorizedAttempts`,
  ).map((entry, index): Phase10C0VS6RecoveryAuthorizedAttempt => {
    const attemptLabel = `${label}.successor.authorizedAttempts[${index}]`;
    const attempt = object(entry, attemptLabel);
    exactKeys(attempt, ["packetId", "predecessorAttemptId", "successorAttemptId"], attemptLabel);
    return Object.freeze({
      packetId: parsePacketId(attempt.packetId, `${attemptLabel}.packetId`),
      predecessorAttemptId: parsePhase10C0VS6AttemptId(
        attempt.predecessorAttemptId,
        `${attemptLabel}.predecessorAttemptId`,
      ),
      successorAttemptId: parsePhase10C0VS6AttemptId(
        attempt.successorAttemptId,
        `${attemptLabel}.successorAttemptId`,
      ),
    });
  });
  const maximumAuthorizedNewAttempts = safeInteger(
    successorRow.maximumAuthorizedNewAttempts,
    `${label}.successor.maximumAuthorizedNewAttempts`,
    1,
  );
  if (maximumAuthorizedNewAttempts !== 1 || authorizedAttempts.length !== 1 ||
    authorizedAttempts[0]!.packetId !== "c0v-moving-produce" ||
    authorizedAttempts[0]!.predecessorAttemptId !== PHASE10_C0V_S6_RECOVERY_V8_MOVING_ATTEMPT_ID ||
    authorizedAttempts[0]!.successorAttemptId !== PHASE10_C0V_S6_CURRENT_MOVING_ATTEMPT_ID) {
    fail(`${label}.successor.authorizedAttempts`, "must authorize only the moving-produce v4-to-v5 successor");
  }
  return Object.freeze({
    schema: literal(row.schema, PHASE10_C0V_S6_RECOVERY_V9_AUTHORITY_SCHEMA, `${label}.schema`),
    recoveryAuthorityId: literal(
      row.recoveryAuthorityId,
      PHASE10_C0V_S6_RECOVERY_V9_AUTHORITY_ID,
      `${label}.recoveryAuthorityId`,
    ),
    automaticRetry: false,
    predecessorImplementationFreezeCommit: literal(
      row.predecessorImplementationFreezeCommit,
      PHASE10_C0V_S6_RECOVERY_V9_PREDECESSOR_IMPLEMENTATION_FREEZE_COMMIT,
      `${label}.predecessorImplementationFreezeCommit`,
    ),
    predecessorAcceptedPacketCommit: literal(
      row.predecessorAcceptedPacketCommit,
      PHASE10_C0V_S6_RECOVERY_V9_PREDECESSOR_ACCEPTED_PACKET_COMMIT,
      `${label}.predecessorAcceptedPacketCommit`,
    ),
    predecessorRecoveryAuthority,
    predecessorPacketCatalogue,
    predecessorApProtocol,
    predecessorAuthorizedPacketProtocol,
    predecessorLockArtifacts: Object.freeze(predecessorLockArtifacts) as unknown as
      Phase10C0VS6RecoveryV9Authority["predecessorLockArtifacts"],
    predecessorAttemptArtifacts: Object.freeze(predecessorAttemptArtifacts),
    predecessorPublishedArtifacts: Object.freeze(predecessorPublishedArtifacts),
    predecessorGovernedAbsentPaths: Object.freeze(predecessorGovernedAbsentPaths),
    retainedBytes: retainedBytes as typeof PHASE10_C0V_S6_RECOVERY_V9_RETAINED_BYTES,
    observedWorkerProcessCount: observedWorkerProcessCount as 1,
    observedWorkerLifetimeNanoseconds: observedWorkerLifetimeNanoseconds as
      typeof PHASE10_C0V_S6_RECOVERY_V9_OBSERVED_WORKER_LIFETIME_NANOSECONDS,
    creditedGovernedInvocationCount: creditedGovernedInvocationCount as 1,
    creditedGovernedElapsedNanoseconds: creditedGovernedElapsedNanoseconds as
      typeof PHASE10_C0V_S6_RECOVERY_V9_CREDITED_GOVERNED_ELAPSED_NANOSECONDS,
    creditedGovernedProcessHours: creditedGovernedProcessHours as
      typeof PHASE10_C0V_S6_RECOVERY_V9_CREDITED_GOVERNED_PROCESS_HOURS,
    successor: Object.freeze({
      packetCatalogueId: literal(
        successorRow.packetCatalogueId,
        PHASE10_C0V_S6_RECOVERY_V9_PACKET_CATALOGUE_ID,
        `${label}.successor.packetCatalogueId`,
      ),
      packetCataloguePath: literal(
        successorRow.packetCataloguePath,
        PHASE10_C0V_S6_RECOVERY_V9_PACKET_CATALOGUE_PATH,
        `${label}.successor.packetCataloguePath`,
      ),
      maximumAuthorizedNewAttempts: maximumAuthorizedNewAttempts as 1,
      authorizedAttempts: Object.freeze(authorizedAttempts) as unknown as
        Phase10C0VS6RecoveryV9Authority["successor"]["authorizedAttempts"],
    }),
  });
}

export function parsePhase10C0VS6CallableRegistry(value: unknown): Phase10C0VS6CallableRegistry {
  const label = "callable registry";
  const row = object(value, label);
  exactKeys(row, ["schema", "registryId", "matrixId", "protocolId", "packetId", "callables"], label);
  const callables = arrayValue(row.callables, `${label}.callables`).map((entry, index) => {
    const callable = object(entry, `${label}.callables[${index}]`);
    exactKeys(callable, ["callableId", "role", "resolution", "modulePath", "exportName", "identity", "producedOutputIds", "invokedCheckIds", "evaluatedCheckIds", "executedNegativeControlIds"], `${label}.callables[${index}]`);
    const resolution = enumValue(callable.resolution, ["planned", "resolved"] as const, `${label}.callables[${index}].resolution`);
    const identity = callable.identity === null ? null : object(callable.identity, `${label}.callables[${index}].identity`);
    if ((resolution === "resolved") !== (identity !== null)) fail(`${label}.callables[${index}]`, "resolution/identity disagree");
    let parsedIdentity: { readonly byteLength: number; readonly sha256: string } | null = null;
    if (identity !== null) {
      exactKeys(identity, ["byteLength", "sha256"], `${label}.callables[${index}].identity`);
      const sha256 = stringValue(identity.sha256, `${label}.callables[${index}].identity.sha256`);
      if (!SHA256.test(sha256)) fail(`${label}.callables[${index}].identity.sha256`, "must be lowercase 64-hex");
      parsedIdentity = Object.freeze({ byteLength: safeInteger(identity.byteLength, `${label}.callables[${index}].identity.byteLength`, 1), sha256 });
    }
    return Object.freeze({
      callableId: stringValue(callable.callableId, `${label}.callables[${index}].callableId`),
      role: enumValue(callable.role, ["producer", "check-caller", "independent-evaluator", "negative-control"] as const, `${label}.callables[${index}].role`),
      resolution,
      modulePath: safePath(callable.modulePath, `${label}.callables[${index}].modulePath`),
      exportName: stringValue(callable.exportName, `${label}.callables[${index}].exportName`),
      identity: parsedIdentity,
      producedOutputIds: stringArray(callable.producedOutputIds, `${label}.callables[${index}].producedOutputIds`),
      invokedCheckIds: stringArray(callable.invokedCheckIds, `${label}.callables[${index}].invokedCheckIds`),
      evaluatedCheckIds: stringArray(callable.evaluatedCheckIds, `${label}.callables[${index}].evaluatedCheckIds`),
      executedNegativeControlIds: stringArray(callable.executedNegativeControlIds, `${label}.callables[${index}].executedNegativeControlIds`),
    });
  });
  uniqueBy(callables, (entry) => entry.callableId, `${label}.callables`);
  return Object.freeze({
    schema: literal(row.schema, PHASE10_C0V_S6_CALLABLE_REGISTRY_SCHEMA, `${label}.schema`),
    registryId: stringValue(row.registryId, `${label}.registryId`),
    matrixId: literal(row.matrixId, PHASE10_C0V_S6_MATRIX_ID, `${label}.matrixId`),
    protocolId: stringValue(row.protocolId, `${label}.protocolId`),
    packetId: parsePacketId(row.packetId, `${label}.packetId`),
    callables: Object.freeze(callables),
  });
}

export function parsePhase10C0VS6ArtifactSchemaRegistry(
  value: unknown,
): Phase10C0VS6ArtifactSchemaRegistry {
  const label = "successor artifact schema registry";
  const row = object(value, label);
  exactKeys(row, [
    "schema", "registryId", "createdOn", "bindings", "overridePolicy",
    "publicationSchemaRule", "schemas",
  ], label);
  const bindingsRow = object(row.bindings, `${label}.bindings`);
  exactKeys(
    bindingsRow,
    ["predecessorRegistry", "predecessorContracts", "successorContracts"],
    `${label}.bindings`,
  );
  const bindings = Object.freeze({
    predecessorRegistry: parsePhase10C0VS6ArtifactIdentity(
      bindingsRow.predecessorRegistry,
      `${label}.bindings.predecessorRegistry`,
    ),
    predecessorContracts: parsePhase10C0VS6ArtifactIdentity(
      bindingsRow.predecessorContracts,
      `${label}.bindings.predecessorContracts`,
    ),
    successorContracts: parsePhase10C0VS6ArtifactIdentity(
      bindingsRow.successorContracts,
      `${label}.bindings.successorContracts`,
    ),
  });
  if (bindings.predecessorRegistry.path !== "research/phase10-c0v-artifact-schema-registry-v1.json" ||
    bindings.predecessorContracts.path !== "research/phase10-c0v-schema-contracts-v1.json" ||
    bindings.successorContracts.path !== "research/phase10-c0v-s6-schema-contracts-v1.json") {
    fail(`${label}.bindings`, "paths differ from the exact predecessor/successor schema authority");
  }
  const policyRow = object(row.overridePolicy, `${label}.overridePolicy`);
  exactKeys(policyRow, [
    "mode", "allowedPacketIds", "addedOutputIds", "overriddenOutputIds",
    "pathMutationAllowed", "predecessorMutationAllowed", "otherDuplicateSchemaIdsAllowed",
  ], `${label}.overridePolicy`);
  const allowedPacketIds = arrayValue(
    policyRow.allowedPacketIds,
    `${label}.overridePolicy.allowedPacketIds`,
  ).map((entry, index) => parsePacketId(entry, `${label}.overridePolicy.allowedPacketIds[${index}]`));
  if (allowedPacketIds.length !== PHASE10_C0V_S6_PACKET_IDS.length ||
    allowedPacketIds.some((entry, index) => entry !== PHASE10_C0V_S6_PACKET_IDS[index])) {
    fail(`${label}.overridePolicy.allowedPacketIds`, "must equal the exact S6 packet order");
  }
  const addedOutputIds = stringArray(policyRow.addedOutputIds, `${label}.overridePolicy.addedOutputIds`);
  const overriddenOutputIds = stringArray(
    policyRow.overriddenOutputIds,
    `${label}.overridePolicy.overriddenOutputIds`,
  );
  for (const [ids, idsLabel] of [
    [addedOutputIds, `${label}.overridePolicy.addedOutputIds`],
    [overriddenOutputIds, `${label}.overridePolicy.overriddenOutputIds`],
  ] as const) {
    if (new Set(ids).size !== ids.length || ids.some((entry, index) => index > 0 && ids[index - 1]! >= entry)) {
      fail(idsLabel, "must be unique code-point order");
    }
  }
  if (addedOutputIds.some((entry) => overriddenOutputIds.includes(entry)) ||
    policyRow.pathMutationAllowed !== false || policyRow.predecessorMutationAllowed !== false ||
    policyRow.otherDuplicateSchemaIdsAllowed !== false) {
    fail(`${label}.overridePolicy`, "must be a disjoint, mutation-forbidden scoped override");
  }
  const schemas = arrayValue(row.schemas, `${label}.schemas`).map((entry, schemaIndex) => {
    const schemaLabel = `${label}.schemas[${schemaIndex}]`;
    const schemaRow = object(entry, schemaLabel);
    exactKeys(schemaRow, [
      "schemaId", "state", "format", "contract", "outputBindings", "requiredBeforePacketIds",
    ], schemaLabel);
    const expectedSchemaId = PHASE10_C0V_S6_SUCCESSOR_SCHEMA_IDS[schemaIndex];
    if (expectedSchemaId === undefined) fail(schemaLabel, "is an extra successor schema");
    const schemaId = literal(schemaRow.schemaId, expectedSchemaId, `${schemaLabel}.schemaId`);
    const contractRow = object(schemaRow.contract, `${schemaLabel}.contract`);
    exactKeys(contractRow, ["path", "byteLength", "sha256", "pointer"], `${schemaLabel}.contract`);
    const contractIdentity = parsePhase10C0VS6ArtifactIdentity({
      path: contractRow.path,
      byteLength: contractRow.byteLength,
      sha256: contractRow.sha256,
    }, `${schemaLabel}.contract`);
    const contract = Object.freeze({
      ...contractIdentity,
      pointer: literal(contractRow.pointer, `/schemas/${schemaId}`, `${schemaLabel}.contract.pointer`),
    });
    if (!sameArtifactIdentity(contract, bindings.successorContracts)) {
      fail(`${schemaLabel}.contract`, "does not bind the exact successor contracts bytes");
    }
    const outputBindings = arrayValue(schemaRow.outputBindings, `${schemaLabel}.outputBindings`).map(
      (bindingEntry, bindingIndex) => {
        const bindingLabel = `${schemaLabel}.outputBindings[${bindingIndex}]`;
        const bindingRow = object(bindingEntry, bindingLabel);
        exactKeys(bindingRow, [
          "bindingKind", "packetId", "outputId", "path", "previousSchemaId",
        ], bindingLabel);
        const bindingKind = enumValue(
          bindingRow.bindingKind,
          ["added", "supersedes"] as const,
          `${bindingLabel}.bindingKind`,
        );
        const previousSchemaId = bindingRow.previousSchemaId === null ? null : stringValue(
          bindingRow.previousSchemaId,
          `${bindingLabel}.previousSchemaId`,
        );
        if ((bindingKind === "added") !== (previousSchemaId === null)) {
          fail(bindingLabel, "added/supersedes state disagrees with previousSchemaId nullability");
        }
        return Object.freeze({
          bindingKind,
          packetId: parsePacketId(bindingRow.packetId, `${bindingLabel}.packetId`),
          outputId: stringValue(bindingRow.outputId, `${bindingLabel}.outputId`),
          path: safePath(bindingRow.path, `${bindingLabel}.path`),
          previousSchemaId,
        });
      },
    );
    if (outputBindings.length === 0 ||
      new Set(outputBindings.map((binding) => binding.outputId)).size !== outputBindings.length) {
      fail(`${schemaLabel}.outputBindings`, "must be nonempty with unique output IDs");
    }
    const requiredBeforePacketIds = arrayValue(
      schemaRow.requiredBeforePacketIds,
      `${schemaLabel}.requiredBeforePacketIds`,
    ).map((packetEntry, packetIndex) => parsePacketId(
      packetEntry,
      `${schemaLabel}.requiredBeforePacketIds[${packetIndex}]`,
    ));
    const boundPacketIds = new Set(outputBindings.map((binding) => binding.packetId));
    const expectedRequired = PHASE10_C0V_S6_PACKET_IDS.filter((packetId) =>
      packetId === "a-p-c0v-s6" || boundPacketIds.has(packetId));
    if (requiredBeforePacketIds.length !== expectedRequired.length ||
      requiredBeforePacketIds.some((packetId, index) => packetId !== expectedRequired[index])) {
      fail(`${schemaLabel}.requiredBeforePacketIds`, "differs from A-P plus exact bound packet order");
    }
    return Object.freeze({
      schemaId,
      state: literal(schemaRow.state, "defined", `${schemaLabel}.state`),
      format: literal(
        schemaRow.format,
        schemaId === "phase10-c0v-attempt-row-v2" ? "jsonl-row" : "json",
        `${schemaLabel}.format`,
      ),
      contract,
      outputBindings: Object.freeze(outputBindings),
      requiredBeforePacketIds: Object.freeze(requiredBeforePacketIds),
    });
  });
  if (schemas.length !== PHASE10_C0V_S6_SUCCESSOR_SCHEMA_IDS.length) {
    fail(`${label}.schemas`, "must equal the exact successor schema roster");
  }
  const allBindings = schemas.flatMap((schema) => schema.outputBindings);
  if (new Set(allBindings.map((binding) => binding.outputId)).size !== allBindings.length) {
    fail(`${label}.schemas`, "binds a published output more than once");
  }
  const policyOutputIds = [...addedOutputIds, ...overriddenOutputIds].sort();
  const boundOutputIds = allBindings.map((binding) => binding.outputId).sort();
  if (policyOutputIds.length !== boundOutputIds.length ||
    policyOutputIds.some((entry, index) => entry !== boundOutputIds[index])) {
    fail(`${label}.schemas`, "omits or duplicates an output named by the exact override policy");
  }
  return Object.freeze({
    schema: literal(row.schema, PHASE10_C0V_S6_ARTIFACT_SCHEMA_REGISTRY_SCHEMA, `${label}.schema`),
    registryId: literal(
      row.registryId,
      "phase10-c0v-s6-successor-artifact-schemas-v1",
      `${label}.registryId`,
    ),
    createdOn: literal(row.createdOn, "2026-08-22", `${label}.createdOn`),
    bindings,
    overridePolicy: Object.freeze({
      mode: literal(
        policyRow.mode,
        "scoped-output-schema-replacement-and-addition",
        `${label}.overridePolicy.mode`,
      ),
      allowedPacketIds: Object.freeze(allowedPacketIds),
      addedOutputIds: Object.freeze(addedOutputIds),
      overriddenOutputIds: Object.freeze(overriddenOutputIds),
      pathMutationAllowed: false,
      predecessorMutationAllowed: false,
      otherDuplicateSchemaIdsAllowed: false,
    }),
    publicationSchemaRule: literal(
      row.publicationSchemaRule,
      "every-s6-published-output-schema-and-binding-registered-exactly-once",
      `${label}.publicationSchemaRule`,
    ),
    schemas: Object.freeze(schemas),
  });
}

export function assertPhase10C0VS6ArtifactSchemaRegistryMatrixParity(
  registry: Phase10C0VS6ArtifactSchemaRegistry,
  matrix: Phase10C0VS6ObligationMatrix,
): void {
  const label = "successor artifact schema registry/matrix parity";
  const schemaIds = new Set<string>(PHASE10_C0V_S6_SUCCESSOR_SCHEMA_IDS);
  const matrixOutputs = matrix.outputs.filter((output) => schemaIds.has(output.artifact.schemaId));
  const registered = registry.schemas.flatMap((schema) => schema.outputBindings.map((binding) => ({
    schemaId: schema.schemaId,
    binding,
  })));
  if (matrixOutputs.length !== registered.length) {
    fail(label, "does not cover every and only successor-schema matrix output exactly once");
  }
  const previousSchemas = Object.freeze({
    "out-c0v-moving-attempt-ledger": "phase10-c0v-attempt-row-v1",
    "out-c0v-radial-attempt-ledger": "phase10-c0v-attempt-row-v1",
    "out-c0v-static-attempt-ledger": "phase10-c0v-attempt-row-v1",
    "out-c0v-radial-result": "phase10-c0v-radial-result-v1",
    "out-c0v-moving-publish-verification": "phase10-packet-verification-v1",
    "out-c0v-radial-publish-verification": "phase10-packet-verification-v1",
    "out-c0v-static-publish-verification": "phase10-packet-verification-v1",
    "out-c0v-aggregate-verification": "phase10-packet-verification-v1",
  } as const);
  const added = new Set(registry.overridePolicy.addedOutputIds);
  const overridden = new Set(registry.overridePolicy.overriddenOutputIds);
  for (const output of matrixOutputs) {
    const matches = registered.filter((entry) => entry.binding.outputId === output.outputId);
    if (matches.length !== 1) fail(label, `${output.outputId} is omitted or duplicated`);
    const { schemaId, binding } = matches[0]!;
    const expectedPrevious = previousSchemas[output.outputId as keyof typeof previousSchemas] ?? null;
    if (schemaId !== output.artifact.schemaId || binding.packetId !== output.packetId ||
      binding.path !== output.artifact.path || binding.previousSchemaId !== expectedPrevious ||
      binding.bindingKind !== (expectedPrevious === null ? "added" : "supersedes") ||
      (expectedPrevious === null ? !added.has(output.outputId) : !overridden.has(output.outputId))) {
      fail(label, `${output.outputId} binding differs from exact matrix/predecessor scope`);
    }
  }
}

export function assertPhase10C0VS6Commit(value: unknown, label: string): string {
  const parsed = typeof value === "string" ? value : "";
  if (!COMMIT.test(parsed)) fail(label, "must be a lowercase 40-hex commit");
  return parsed;
}
