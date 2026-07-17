// Phase 4 visual-harness bundle verification (V4-5/V4-6 + the plan's visual adversarial
// bullet). Node-side dev tooling: nothing in app/src imports this module.
//
// This is a DELIBERATE thin reimplementation of the evidence-bundle integrity graph in the
// harness layer — the app territory may not import runner code (V4-7), so the harness
// re-derives the checks it needs from the published artifact shapes:
//
//   artifact-index.json  — canonical JSON; version 1; publication "complete"; report first.
//   <report>.json        — canonical JSON envelope {version, protocol, pass, operator,
//                          artifacts, payload}; payload.runs carries per-run summaries with
//                          raw field hashes; payload.manifestSha256 pins manifest.json.
//   payload artifacts    — byte-hashed by both report and index descriptors.
//   runs/<id>/final.ckpt — strict-decoded via the @vcc/core codecs and cross-checked against
//                          the manifest run config and the report run summary.
//
// EVERY failure throws by a stable name (V4-BUNDLE-*, V4-CHECKPOINT-*, V4-LABEL-MISMATCH,
// V4-VIEW-MANIFEST) BEFORE any capture is accepted. Checkpoint strict decode, canonical-JSON
// shape, SHA-256 of every artifact, file-set equality, report/index cross-links, and
// metadata/array-length consistency with the report's run summaries are all enforced here.
//
// Scope note (honest): this harness renders PUBLISHED evidence. It verifies the bundle's
// internal integrity graph and identity, including that manifest.json matches the report's
// recorded manifestSha256 — it does not re-assert the gate's hard-coded frozen manifest hash
// or provenance ancestry; those are gate4a/gate4b enforcement at evidence-generation time.

import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { join, relative, sep } from "node:path";
import {
  decodeCheckpoint,
  decodeLKCheckpoint,
  ggTimelineEnvironmentFromParams,
  type GGParams,
} from "@vcc/core";

export const PHASE4_INDEX_FILE = "artifact-index.json";

export interface Phase4PassIdentity {
  readonly pass: "A" | "B";
  readonly reportPath: string;
  readonly protocol: string;
  readonly operator: "GGThreshold" | "LibbrechtKinetics";
  readonly checkpointKind: string;
  readonly manifestKind: string;
}

export const PASS_A_IDENTITY: Phase4PassIdentity = {
  pass: "A",
  reportPath: "gate4a-report.json",
  protocol: "phase4-pass-a-v1",
  operator: "GGThreshold",
  checkpointKind: "gg-checkpoint-v1",
  manifestKind: "phase4-pass-a-manifest+json",
};

export const PASS_B_IDENTITY: Phase4PassIdentity = {
  pass: "B",
  reportPath: "gate4b-report.json",
  protocol: "phase4-pass-b-v1",
  operator: "LibbrechtKinetics",
  checkpointKind: "lk-checkpoint-v2",
  manifestKind: "phase4-pass-b-manifest+json",
};

export function sha256HexNode(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

function rawViewBytes(
  view: Uint8Array | Float64Array,
): Uint8Array {
  return new Uint8Array(view.buffer, view.byteOffset, view.byteLength);
}

// ── Canonical JSON (recursively sorted keys, no whitespace, trailing newline) ──────────────

function lexicalCompare(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function canonicalString(value: unknown): string {
  if (
    value === null ||
    typeof value === "boolean" ||
    typeof value === "number" ||
    typeof value === "string"
  ) {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) return `[${value.map(canonicalString).join(",")}]`;
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    const keys = Object.keys(record).sort(lexicalCompare);
    return `{${keys
      .map((key) => `${JSON.stringify(key)}:${canonicalString(record[key])}`)
      .join(",")}}`;
  }
  throw new Error(`V4-BUNDLE-CANONICAL: value is not JSON data (${typeof value})`);
}

export function canonicalJsonBytesOf(value: unknown): Uint8Array {
  return new TextEncoder().encode(`${canonicalString(value)}\n`);
}

function bytesEqual(left: Uint8Array, right: Uint8Array): boolean {
  if (left.byteLength !== right.byteLength) return false;
  for (let index = 0; index < left.byteLength; index++) {
    if (left[index] !== right[index]) return false;
  }
  return true;
}

/**
 * Parse only the canonical form: the original BYTES must equal a fresh canonical encoding of
 * the parsed value (this also rejects a UTF-8 BOM, duplicate keys, reordered keys, alternate
 * number spellings, whitespace, and trailing data).
 */
export function parseCanonicalJsonBytes(bytes: Uint8Array, label: string): unknown {
  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw new Error(`V4-BUNDLE-CANONICAL: ${label} is not valid UTF-8`);
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(text) as unknown;
  } catch {
    throw new Error(`V4-BUNDLE-CANONICAL: ${label} is not valid JSON`);
  }
  if (!bytesEqual(bytes, canonicalJsonBytesOf(parsed))) {
    throw new Error(`V4-BUNDLE-CANONICAL: ${label} is not canonical JSON`);
  }
  return parsed;
}

// ── Shape helpers ──────────────────────────────────────────────────────────────────────────

function asRecord(value: unknown, label: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error(`V4-BUNDLE-CROSSLINK: ${label} must be an object`);
  }
  return value as Record<string, unknown>;
}

function asArray(value: unknown, label: string): unknown[] {
  if (!Array.isArray(value)) throw new Error(`V4-BUNDLE-CROSSLINK: ${label} must be an array`);
  return value;
}

function asString(value: unknown, label: string): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`V4-BUNDLE-CROSSLINK: ${label} must be a nonempty string`);
  }
  return value;
}

function asFinite(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`V4-BUNDLE-CROSSLINK: ${label} must be finite`);
  }
  return value;
}

export interface ArtifactDescriptor {
  readonly path: string;
  readonly kind: string;
  readonly byteLength: number;
  readonly sha256: string;
}

const SHA256_PATTERN = /^[0-9a-f]{64}$/;

function asDescriptor(value: unknown, label: string): ArtifactDescriptor {
  const record = asRecord(value, label);
  const keys = Object.keys(record).sort(lexicalCompare);
  if (keys.join(",") !== "byteLength,kind,path,sha256") {
    throw new Error(`V4-BUNDLE-CROSSLINK: ${label} descriptor keys are invalid`);
  }
  const path = asString(record.path, `${label}.path`);
  if (path.startsWith("/") || path.split("/").some((part) => part === "" || part === "." || part === "..")) {
    throw new Error(`V4-BUNDLE-CROSSLINK: ${label}.path is not a safe relative path`);
  }
  const sha256 = asString(record.sha256, `${label}.sha256`);
  if (!SHA256_PATTERN.test(sha256)) {
    throw new Error(`V4-BUNDLE-CROSSLINK: ${label}.sha256 is not lowercase SHA-256`);
  }
  const byteLength = record.byteLength;
  if (!Number.isSafeInteger(byteLength) || (byteLength as number) < 0) {
    throw new Error(`V4-BUNDLE-CROSSLINK: ${label}.byteLength is invalid`);
  }
  return {
    path,
    kind: asString(record.kind, `${label}.kind`),
    byteLength: byteLength as number,
    sha256,
  };
}

// ── Directory listing (no symlinks, files only) ────────────────────────────────────────────

function listFiles(root: string, current = root): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(current, { withFileTypes: true })) {
    const absolute = join(current, entry.name);
    if (entry.isSymbolicLink()) {
      throw new Error(`V4-BUNDLE-FILESET: evidence directory contains a symlink: ${absolute}`);
    }
    if (entry.isDirectory()) files.push(...listFiles(root, absolute));
    else if (entry.isFile()) files.push(relative(root, absolute).split(sep).join("/"));
    else throw new Error(`V4-BUNDLE-FILESET: non-file entry: ${absolute}`);
  }
  return files.sort(lexicalCompare);
}

// ── Run summaries and manifest configs (the fields this harness consumes) ──────────────────

export interface VerifiedRun {
  readonly runId: string;
  /** Completed cycles (A) / completed interface steps (B); equals the checkpoint tick. */
  readonly completedSteps: number;
  readonly checkpointSha256: string;
  readonly checkpointPath: string;
  /** Manifest run config (raw parsed record; scenario controls for the capture manifest). */
  readonly config: Record<string, unknown>;
  /** Report run summary (raw parsed record). */
  readonly summary: Record<string, unknown>;
}

export interface VerifiedPhase4Bundle {
  readonly directory: string;
  readonly identity: Phase4PassIdentity;
  readonly report: Record<string, unknown>;
  readonly payload: Record<string, unknown>;
  readonly verdict: Record<string, unknown>;
  readonly manifest: Record<string, unknown>;
  readonly runs: ReadonlyMap<string, VerifiedRun>;
}

function ggEnvironmentOfConfig(config: Record<string, unknown>): unknown {
  const schedule = config.schedule;
  if (schedule === null || schedule === undefined) return config.params;
  const events = asArray(asRecord(schedule, "config.schedule").events, "config.schedule.events");
  if (events.length === 0) return asRecord(schedule, "config.schedule").initialEnvironment;
  return asRecord(events[events.length - 1], "config.schedule last event").environment;
}

function lkFinalEnvironment(summary: Record<string, unknown>): Record<string, unknown> {
  const environment = asRecord(summary.environment, "summary.environment");
  return asRecord(environment.final, "summary.environment.final");
}

function expectEqual(actual: unknown, expected: unknown, label: string): void {
  // Canonical (key-order-independent) comparison: parsed canonical JSON carries sorted keys
  // while decoded checkpoint objects carry insertion order.
  if (canonicalString(actual) !== canonicalString(expected)) {
    throw new Error(
      `V4-CHECKPOINT-METADATA: ${label} mismatch (checkpoint ${canonicalString(actual)} vs ` +
        `recorded ${canonicalString(expected)})`,
    );
  }
}

/**
 * Verify one published pass bundle completely: canonical index/report, file-set equality,
 * every artifact's SHA-256 and byte length, report/index descriptor cross-links, the
 * manifest binding, and every run's checkpoint (strict decode + field hashes + metadata and
 * array-length consistency with the manifest config and report run summary).
 */
export function verifyPhase4Bundle(
  directory: string,
  identity: Phase4PassIdentity,
): VerifiedPhase4Bundle {
  // 1. Canonical artifact index.
  const indexBytes = new Uint8Array(readFileSync(join(directory, PHASE4_INDEX_FILE)));
  const index = asRecord(
    parseCanonicalJsonBytes(indexBytes, "artifact index"),
    "artifact index",
  );
  if (index.version !== 1 || index.publication !== "complete") {
    throw new Error("V4-BUNDLE-CROSSLINK: artifact index version/publication is invalid");
  }
  const indexReport = asDescriptor(index.report, "artifact index report");
  if (indexReport.kind !== "phase4-evidence-report+json") {
    throw new Error("V4-BUNDLE-CROSSLINK: artifact index report kind is invalid");
  }
  if (indexReport.path !== identity.reportPath) {
    throw new Error(
      `V4-BUNDLE-CROSSLINK: pass ${identity.pass} report must be ${identity.reportPath}, ` +
        `index names ${indexReport.path}`,
    );
  }
  const indexArtifacts = asArray(index.artifacts, "artifact index artifacts").map((item, n) =>
    asDescriptor(item, `artifact index artifacts[${n}]`),
  );
  if (
    indexArtifacts.length === 0 ||
    JSON.stringify(indexArtifacts[0]) !== JSON.stringify(indexReport)
  ) {
    throw new Error("V4-BUNDLE-CROSSLINK: artifact index must list its report first");
  }
  const indexPaths = indexArtifacts.map((item) => item.path);
  if (new Set(indexPaths).size !== indexPaths.length) {
    throw new Error("V4-BUNDLE-CROSSLINK: artifact index has duplicate paths");
  }
  if (indexPaths.includes(PHASE4_INDEX_FILE)) {
    throw new Error("V4-BUNDLE-CROSSLINK: artifact index must not hash itself");
  }

  // 2. File-set equality with the index.
  const expectedFiles = [...indexPaths, PHASE4_INDEX_FILE].sort(lexicalCompare);
  const actualFiles = listFiles(directory);
  if (
    actualFiles.length !== expectedFiles.length ||
    actualFiles.some((path, n) => path !== expectedFiles[n])
  ) {
    throw new Error(
      `V4-BUNDLE-FILESET: directory file set does not match its artifact index ` +
        `(expected ${expectedFiles.length} files, found ${actualFiles.length})`,
    );
  }

  // 3. Byte length + SHA-256 of every indexed artifact.
  const bytesByPath = new Map<string, Uint8Array>();
  for (const descriptor of indexArtifacts) {
    const bytes = new Uint8Array(readFileSync(join(directory, descriptor.path)));
    if (bytes.byteLength !== descriptor.byteLength) {
      throw new Error(`V4-BUNDLE-HASH: artifact byte length mismatch: ${descriptor.path}`);
    }
    if (sha256HexNode(bytes) !== descriptor.sha256) {
      throw new Error(`V4-BUNDLE-HASH: artifact hash mismatch: ${descriptor.path}`);
    }
    bytesByPath.set(descriptor.path, bytes);
  }

  // 4. Canonical report envelope + identity + descriptor cross-links.
  const report = asRecord(
    parseCanonicalJsonBytes(
      bytesByPath.get(identity.reportPath) as Uint8Array,
      "evidence report",
    ),
    "evidence report",
  );
  if (report.version !== 1) throw new Error("V4-BUNDLE-CROSSLINK: report version must be 1");
  if (report.protocol !== identity.protocol || report.pass !== identity.pass) {
    throw new Error(
      `V4-BUNDLE-CROSSLINK: report identity is ${String(report.protocol)}/${String(report.pass)}, ` +
        `expected ${identity.protocol}/${identity.pass}`,
    );
  }
  if (report.operator !== identity.operator) {
    throw new Error(
      `V4-LABEL-MISMATCH: pass ${identity.pass} report operator is ${String(report.operator)}, ` +
        `expected ${identity.operator}`,
    );
  }
  const reportArtifacts = asArray(report.artifacts, "report artifacts").map((item, n) =>
    asDescriptor(item, `report artifacts[${n}]`),
  );
  const indexedPayloads = indexArtifacts.slice(1);
  if (JSON.stringify(reportArtifacts) !== JSON.stringify(indexedPayloads)) {
    throw new Error(
      "V4-BUNDLE-CROSSLINK: report payload descriptors do not match the artifact index",
    );
  }

  // 5. Manifest binding: payload.manifestSha256 must hash the actual manifest.json bytes.
  const payload = asRecord(report.payload, "report payload");
  const manifestBytes = bytesByPath.get("manifest.json");
  if (manifestBytes === undefined) {
    throw new Error("V4-BUNDLE-FILESET: bundle has no manifest.json");
  }
  const manifestDescriptor = indexedPayloads.find((item) => item.path === "manifest.json");
  if (manifestDescriptor === undefined || manifestDescriptor.kind !== identity.manifestKind) {
    throw new Error(`V4-BUNDLE-CROSSLINK: manifest.json kind must be ${identity.manifestKind}`);
  }
  if (asString(payload.manifestSha256, "payload.manifestSha256") !== sha256HexNode(manifestBytes)) {
    throw new Error("V4-BUNDLE-HASH: payload.manifestSha256 does not hash manifest.json");
  }
  const manifest = asRecord(
    parseCanonicalJsonBytes(manifestBytes, "pass manifest"),
    "pass manifest",
  );
  if (manifest.operator !== identity.operator) {
    throw new Error(
      `V4-LABEL-MISMATCH: pass manifest operator is ${String(manifest.operator)}, expected ` +
        identity.operator,
    );
  }

  // 6. Verdict identity: a published bundle exists only for a passing/execution-valid run.
  const verdict = asRecord(payload.verdict, "payload.verdict");
  if (identity.pass === "A" && verdict.gatePass !== true) {
    throw new Error("V4-BUNDLE-CROSSLINK: published Pass A bundle must record gatePass=true");
  }
  if (identity.pass === "B" && verdict.executionValid !== true) {
    throw new Error(
      "V4-BUNDLE-CROSSLINK: published Pass B bundle must record executionValid=true",
    );
  }

  // 7. Per-run checkpoint strict decode + metadata/array-length/field-hash consistency.
  const manifestRuns = new Map<string, Record<string, unknown>>();
  for (const item of asArray(manifest.runs, "manifest.runs")) {
    const config = asRecord(item, "manifest run");
    manifestRuns.set(asString(config.id, "manifest run id"), config);
  }
  const runs = new Map<string, VerifiedRun>();
  for (const item of asArray(payload.runs, "payload.runs")) {
    const summary = asRecord(item, "run summary");
    const runId = asString(summary.runId, "run summary runId");
    const config = manifestRuns.get(runId);
    if (config === undefined) {
      throw new Error(`V4-CHECKPOINT-METADATA: run ${runId} is absent from manifest.json`);
    }
    const checkpointPath = `runs/${runId}/final.ckpt`;
    const checkpointBytes = bytesByPath.get(checkpointPath);
    if (checkpointBytes === undefined) {
      throw new Error(`V4-BUNDLE-FILESET: missing checkpoint artifact ${checkpointPath}`);
    }
    const checkpointDescriptor = indexedPayloads.find((d) => d.path === checkpointPath);
    if (checkpointDescriptor === undefined || checkpointDescriptor.kind !== identity.checkpointKind) {
      throw new Error(
        `V4-BUNDLE-CROSSLINK: ${checkpointPath} kind must be ${identity.checkpointKind}`,
      );
    }
    const final = asRecord(summary.final, `run ${runId} summary.final`);
    const recordedSha = asString(final.checkpointSha256, `run ${runId} checkpointSha256`);
    if (sha256HexNode(checkpointBytes) !== recordedSha) {
      throw new Error(`V4-BUNDLE-HASH: run ${runId} checkpoint hash mismatch`);
    }

    const completedSteps =
      identity.pass === "A"
        ? asFinite(summary.completedCycles, `run ${runId} completedCycles`)
        : asFinite(summary.completedSteps, `run ${runId} completedSteps`);

    if (identity.pass === "A") {
      let decoded;
      try {
        decoded = decodeCheckpoint(checkpointBytes);
      } catch (error) {
        throw new Error(
          `V4-CHECKPOINT-DECODE: run ${runId}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
      const state = decoded.state;
      expectEqual(state.dims, config.dims, `run ${runId} dims`);
      expectEqual(state.tick, completedSteps, `run ${runId} tick/completedCycles`);
      expectEqual(state.rngSeed, config.rngSeed, `run ${runId} rngSeed`);
      expectEqual(state.noiseEpsilon, config.noiseEpsilon, `run ${runId} noiseEpsilon`);
      expectEqual(state.domain, config.domain, `run ${runId} domain`);
      expectEqual(state.farField, config.farField, `run ${runId} farField`);
      expectEqual(
        ggTimelineEnvironmentFromParams(state.params as GGParams),
        ggEnvironmentOfConfig(config),
        `run ${runId} final G-G environment`,
      );
      // Raw field hashes bind the decoded arrays (and therefore their exact lengths) to the
      // report's run summary.
      expectEqual(sha256HexNode(rawViewBytes(state.a)), final.aSha256, `run ${runId} aSha256`);
      expectEqual(sha256HexNode(rawViewBytes(state.b)), final.bSha256, `run ${runId} bSha256`);
      expectEqual(sha256HexNode(rawViewBytes(state.d)), final.dSha256, `run ${runId} dSha256`);
    } else {
      let decoded;
      try {
        decoded = decodeLKCheckpoint(checkpointBytes);
      } catch (error) {
        throw new Error(
          `V4-CHECKPOINT-DECODE: run ${runId}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
      const state = decoded.state;
      if (decoded.header.version !== 2) {
        throw new Error(`V4-CHECKPOINT-DECODE: run ${runId} must be an LK v2 checkpoint`);
      }
      expectEqual(state.dims, config.dims, `run ${runId} dims`);
      expectEqual(state.tick, completedSteps, `run ${runId} tick/completedSteps`);
      expectEqual(state.rngSeed, config.rngSeed, `run ${runId} rngSeed`);
      expectEqual(state.noiseEpsilon, config.noiseEpsilon, `run ${runId} noiseEpsilon`);
      expectEqual(state.domain, config.domain, `run ${runId} domain`);
      expectEqual(state.farField, config.farField, `run ${runId} farField`);
      expectEqual(state.surfacePolicy, config.surfacePolicy, `run ${runId} surfacePolicy`);
      expectEqual(state.dxUm, config.dxUm, `run ${runId} dxUm`);
      expectEqual(state.pressurePa, config.pressurePa, `run ${runId} pressurePa`);
      expectEqual(state.paramSet, config.paramSet, `run ${runId} paramSet`);
      expectEqual(state.cflFill, config.cflFill, `run ${runId} cflFill`);
      expectEqual(state.relaxTol, config.relaxTol, `run ${runId} relaxTol`);
      expectEqual(state.divTol, config.divTol, `run ${runId} divTol`);
      expectEqual(state.relaxMaxSweeps, config.relaxMaxSweeps, `run ${runId} relaxMaxSweeps`);
      const finalEnvironment = lkFinalEnvironment(summary);
      expectEqual(state.tempC, finalEnvironment.tempC, `run ${runId} tempC`);
      expectEqual(
        state.sigmaInfinity,
        finalEnvironment.sigmaInfinity,
        `run ${runId} sigmaInfinity`,
      );
      expectEqual(
        state.simTimeSeconds,
        summary.simTimeSeconds,
        `run ${runId} simTimeSeconds`,
      );
      expectEqual(sha256HexNode(rawViewBytes(state.a)), final.aSha256, `run ${runId} aSha256`);
      expectEqual(sha256HexNode(rawViewBytes(state.f)), final.fSha256, `run ${runId} fSha256`);
      expectEqual(
        sha256HexNode(rawViewBytes(state.sigma)),
        final.sigmaSha256,
        `run ${runId} sigmaSha256`,
      );
    }
    runs.set(runId, {
      runId,
      completedSteps,
      checkpointSha256: recordedSha,
      checkpointPath,
      config,
      summary,
    });
  }

  return { directory, identity, report, payload, verdict, manifest, runs };
}

// ── Required views (V4-5) ──────────────────────────────────────────────────────────────────

export type ViewStyle = "solid" | "column" | "slice" | "profile" | "top";

export interface RequiredView {
  readonly name: string;
  readonly pass: "A" | "B";
  readonly runId: string;
  readonly style: ViewStyle;
}

export const REQUIRED_PASS_A_VIEWS: readonly RequiredView[] = [
  { name: "pass-a-plate-endpoint", pass: "A", runId: "A-HABIT-U0", style: "solid" },
  { name: "pass-a-column-endpoint", pass: "A", runId: "A-HABIT-U1", style: "column" },
  { name: "pass-a-hollow-column-slice", pass: "A", runId: "A-DEPLETION", style: "slice" },
  { name: "pass-a-capped-column-profile", pass: "A", runId: "A-TIMELINE", style: "profile" },
  { name: "pass-a-dendrite-top", pass: "A", runId: "A-BRANCH-DENDRITE", style: "top" },
];

/** Pass B counterparts; B-HABIT-TM15 is also the registered B-DEPLETION run (plan §B). */
export const PASS_B_COUNTERPART_VIEWS: readonly RequiredView[] = [
  { name: "pass-b-plate-endpoint", pass: "B", runId: "B-HABIT-TM5", style: "solid" },
  { name: "pass-b-column-endpoint", pass: "B", runId: "B-HABIT-TM15", style: "column" },
  { name: "pass-b-hollow-column-slice", pass: "B", runId: "B-HABIT-TM15", style: "slice" },
  { name: "pass-b-capped-column-profile", pass: "B", runId: "B-TIMELINE", style: "profile" },
  { name: "pass-b-dendrite-top", pass: "B", runId: "B-BRANCH", style: "top" },
];

export interface AbsentView {
  readonly name: string;
  readonly reason: string;
}

/**
 * Which Pass B counterpart views are available in a verified bundle, and which are absent —
 * absent views carry an explicit reason and are never silently skipped.
 */
export function planPassBViews(bundle: VerifiedPhase4Bundle | null): {
  available: RequiredView[];
  absent: AbsentView[];
} {
  const available: RequiredView[] = [];
  const absent: AbsentView[] = [];
  for (const view of PASS_B_COUNTERPART_VIEWS) {
    if (bundle === null) {
      absent.push({
        name: view.name,
        reason: "pass-b evidence directory is absent (Pass A precedes Pass B in the phase plan)",
      });
    } else if (!bundle.runs.has(view.runId)) {
      absent.push({
        name: view.name,
        reason: `run ${view.runId} is absent from the pass-b report`,
      });
    } else {
      available.push(view);
    }
  }
  return { available, absent };
}

export interface CaptureManifestEntry {
  readonly name: string;
  readonly backendPass: string;
}

/**
 * Self-check before exit (V4-5): every required view must appear in the capture manifest for
 * every executed backend pass, and every absent Pass B view must be recorded with a reason.
 * Throws V4-VIEW-MANIFEST by name.
 */
export function assertViewManifestComplete(
  entries: readonly CaptureManifestEntry[],
  requiredViews: readonly RequiredView[],
  backendPasses: readonly string[],
  absences: readonly AbsentView[],
  expectedAbsent: readonly AbsentView[],
): void {
  for (const backendPass of backendPasses) {
    for (const view of requiredViews) {
      const found = entries.some(
        (entry) => entry.name === view.name && entry.backendPass === backendPass,
      );
      if (!found) {
        throw new Error(
          `V4-VIEW-MANIFEST: manifest is missing required view ${view.name} ` +
            `(backend pass ${backendPass})`,
        );
      }
    }
  }
  for (const expected of expectedAbsent) {
    const recorded = absences.some(
      (item) => item.name === expected.name && item.reason === expected.reason,
    );
    if (!recorded) {
      throw new Error(
        `V4-VIEW-MANIFEST: absent view ${expected.name} is not recorded with its reason`,
      );
    }
  }
}
