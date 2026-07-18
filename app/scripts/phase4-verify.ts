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
// Real-evidence mode additionally pins the gate's frozen manifest hash, engine/backend,
// solver-source hashes, exact registered run set, and recorded freeze ancestry. Synthetic
// fixture bundles are accepted only through an explicit developer opt-in and retain their
// NOT GATE EVIDENCE identity through inspection and capture publication.

import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, lstatSync, readFileSync, readdirSync, realpathSync } from "node:fs";
import { basename, dirname, join, parse, relative, resolve, sep } from "node:path";
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

export const PASS_A_MANIFEST_SHA256 =
  "6d1ee3a262e8985930ded30f8ef490e1e47402dce6c55f2b3b16e4e80b0d9a98";
export const PASS_B_MANIFEST_SHA256 =
  "c0ceed5b0ebb68defee85b1d78d52c9563f5edd35ed415b8cfdad57dd7c3e812";
export const PHASE4_EVIDENCE_BACKEND = "float64-cpu-oracle";
export const PHASE4_NODE = "v24.13.1";
export const PHASE4_V8 = "13.6.233.17-node.40";
export const PHASE4_CRITERIA_FREEZE = "e567767";
export const PHASE4_RUNNER_FREEZE = "cd24365";
export const PHASE4_CADENCE_FREEZE = "7be4c5d";
export const PHASE4_GG_SOURCE_SHA256 =
  "e13cd4c487eb9918b5b68529cc6f0e5c80ce53319343d9f0e7c102f4cf65563b";
export const PHASE4_LK_SOURCE_SHA256 =
  "1b10e3b97103000746f02e5989828e8c83eab9014108949f8b0e5bd556c1ecbc";
export const SYNTHETIC_FIXTURE_NOTICE = "SYNTHETIC FIXTURE - NOT GATE EVIDENCE";

export const PASS_A_RUN_IDS = [
  "A-HABIT-U0",
  "A-HABIT-U0P25",
  "A-HABIT-U0P5",
  "A-HABIT-U0P75",
  "A-HABIT-U1",
  "A-DEPLETION",
  "A-HOLLOW-SEED-1",
  "A-HOLLOW-SEED-2",
  "A-HOLLOW-SEED-3",
  "A-HOLLOW-SEED-1-REPLAY",
  "A-TIMELINE",
  "A-BRANCH-DENDRITE",
  "A-BRANCH-COMPARATOR",
] as const;

export const PASS_B_RUN_IDS = [
  "B-HABIT-TM5",
  "B-HABIT-TM7P5",
  "B-HABIT-TM10",
  "B-HABIT-TM12P5",
  "B-HABIT-TM15",
  "B-HOLLOW-SEED-1",
  "B-HOLLOW-SEED-2",
  "B-HOLLOW-SEED-3",
  "B-HOLLOW-SEED-1-REPLAY",
  "B-TIMELINE",
  "B-BRANCH",
] as const;

export const PASS_A_EXECUTION_CRITERIA = [
  "A-EXEC-PROVENANCE",
  "A-EXEC-CONFIG",
  "A-EXEC-SYMMETRY",
  "A-EXEC-NOISE",
  "A-EXEC-MASS",
  "A-EXEC-DOMAIN",
  "A-EXEC-TERMINATION",
  "A-EXEC-NUMERIC",
] as const;

export const PASS_A_MORPHOLOGY_CRITERIA = [
  "A-HABIT-GROWTH",
  "A-HABIT-ENDPOINTS",
  "A-HABIT-SOLID",
  "A-HABIT-MONOTONE",
  "A-DEPLETION-COLUMN",
  "A-DEPLETION-DEFINED",
  "A-DEPLETION-WIDENING",
  "A-DEPLETION-SIGNAL",
  "A-HOLLOW-EACH",
  "A-HOLLOW-NONVACUOUS",
  "A-HOLLOW-STRUCTURAL",
  "A-TIMELINE-STAGE1",
  "A-TIMELINE-STATE",
  "A-TIMELINE-CAPS",
  "A-TIMELINE-VALID",
  "A-BRANCH",
] as const;

export const PASS_B_EXECUTION_CRITERIA = [
  "B-EXEC-PROVENANCE",
  "B-EXEC-CONFIG",
  "B-EXEC-TERMINATION",
  "B-EXEC-SYMMETRY",
  "B-EXEC-NOISE",
  "B-EXEC-CONVERGENCE",
  "B-EXEC-SURFACE",
  "B-EXEC-LEDGER",
  "B-EXEC-PECLET",
  "B-EXEC-CHECKPOINT",
  "B-EXEC-NUMERIC",
  "B-EXEC-COMPLETE",
] as const;

export const PASS_B_MORPHOLOGY_CRITERIA = [
  "B-HABIT-ENDPOINTS",
  "B-HABIT-SOLID",
  "B-HABIT-MONOTONE",
  "B-DEPLETION",
  "B-DEPLETION-WIDENING",
  "B-HOLLOW",
  "B-TIMELINE",
  "B-BRANCH",
] as const;

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

function comparisonPath(path: string): string {
  return process.platform === "win32" ? path.toLowerCase() : path;
}

function sameOrInside(parent: string, candidate: string): boolean {
  const rel = relative(comparisonPath(parent), comparisonPath(candidate));
  return rel === "" || (rel !== ".." && !rel.startsWith(`..${sep}`));
}

function refuseOutputAliases(absolute: string): void {
  const parsed = parse(absolute);
  let current = parsed.root;
  for (const part of absolute.slice(parsed.root.length).split(sep).filter(Boolean)) {
    current = join(current, part);
    try {
      if (lstatSync(current).isSymbolicLink()) {
        throw new Error(
          `V4-OUTPUT-SAFETY: output path contains a symlink or junction component: ${current}`,
        );
      }
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (code === "ENOENT" || code === "ENOTDIR") return;
      throw error;
    }
  }
}

/** Resolve a possibly nonexistent path through the real path of its closest existing ancestor. */
function projectCanonicalPath(requested: string, refuseAliases: boolean): string {
  const absolute = resolve(requested);
  if (refuseAliases) refuseOutputAliases(absolute);

  let ancestor = absolute;
  const suffix: string[] = [];
  while (!existsSync(ancestor)) {
    const parent = dirname(ancestor);
    if (parent === ancestor) {
      throw new Error(`V4-OUTPUT-SAFETY: no existing ancestor for ${absolute}`);
    }
    suffix.unshift(basename(ancestor));
    ancestor = parent;
  }
  const canonicalAncestor = realpathSync.native(ancestor);
  return suffix.length === 0 ? canonicalAncestor : resolve(canonicalAncestor, ...suffix);
}

/** Output may neither overlap nor contain either immutable evidence bundle. */
export function assertSafePhase4OutputPaths(
  outputDirectory: string,
  evidenceDirectories: readonly string[],
): { readonly outputDirectory: string; readonly evidenceDirectories: readonly string[] } {
  const output = projectCanonicalPath(outputDirectory, true);
  const evidence = evidenceDirectories.map((directory) => projectCanonicalPath(directory, false));
  for (const directory of evidence) {
    if (sameOrInside(directory, output) || sameOrInside(output, directory)) {
      throw new Error(
        `V4-OUTPUT-SAFETY: output ${output} overlaps immutable evidence bundle ${directory}`,
      );
    }
  }
  return { outputDirectory: output, evidenceDirectories: evidence };
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

export type VerifiedEvidenceClass =
  | "published-gate-evidence"
  | "synthetic-fixture-not-gate-evidence";

export interface VerifiedCriterionRecord {
  readonly criterion: string;
  readonly passed: boolean;
  readonly summary: string;
}

export interface VerifiedPhase4Bundle {
  readonly directory: string;
  readonly identity: Phase4PassIdentity;
  readonly report: Record<string, unknown>;
  readonly payload: Record<string, unknown>;
  readonly verdict: Record<string, unknown>;
  readonly manifest: Record<string, unknown>;
  readonly runs: ReadonlyMap<string, VerifiedRun>;
  readonly manifestSha256: string;
  readonly evidenceClass: VerifiedEvidenceClass;
  readonly records: ReadonlyMap<string, VerifiedCriterionRecord>;
}

export interface VerifyPhase4BundleOptions {
  /** Dev-only: accept an exact synthetic NOT GATE EVIDENCE marker. */
  readonly allowSyntheticFixture?: boolean;
  /** Explicit repository whose immutable Git objects authenticate recorded evidence HEAD. */
  readonly repoRoot?: string;
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

function expectExactKeys(
  record: Record<string, unknown>,
  keys: readonly string[],
  label: string,
): void {
  const actual = Object.keys(record).sort(lexicalCompare);
  const expected = [...keys].sort(lexicalCompare);
  if (canonicalString(actual) !== canonicalString(expected)) {
    throw new Error(`V4-EVIDENCE-PROVENANCE: ${label} keys are invalid`);
  }
}

function expectedRunIds(identity: Phase4PassIdentity): readonly string[] {
  return identity.pass === "A" ? PASS_A_RUN_IDS : PASS_B_RUN_IDS;
}

function expectedManifestSha256(identity: Phase4PassIdentity): string {
  return identity.pass === "A" ? PASS_A_MANIFEST_SHA256 : PASS_B_MANIFEST_SHA256;
}

function validateExactRunSet(
  ids: readonly string[],
  identity: Phase4PassIdentity,
  label: string,
): void {
  if (new Set(ids).size !== ids.length) {
    throw new Error(`V4-RUN-COMPLETE: ${label} contains duplicate run IDs`);
  }
  if (canonicalString(ids) !== canonicalString(expectedRunIds(identity))) {
    throw new Error(
      `V4-RUN-COMPLETE: ${label} must equal the frozen Pass ${identity.pass} run set`,
    );
  }
}

function gitBytes(repoRoot: string, args: readonly string[], label: string): Uint8Array {
  try {
    return new Uint8Array(
      execFileSync("git", [...args], {
        cwd: repoRoot,
        stdio: ["ignore", "pipe", "pipe"],
      }),
    );
  } catch {
    throw new Error(`V4-EVIDENCE-PROVENANCE: Git could not verify ${label}`);
  }
}

function gitText(repoRoot: string, args: readonly string[], label: string): string {
  return new TextDecoder().decode(gitBytes(repoRoot, args, label)).trim();
}

function gitIsAncestor(repoRoot: string, ancestor: string, descendant: string): boolean {
  try {
    execFileSync("git", ["merge-base", "--is-ancestor", ancestor, descendant], {
      cwd: repoRoot,
      stdio: "ignore",
    });
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException & { status?: number }).status === 1) return false;
    throw new Error(
      `V4-EVIDENCE-PROVENANCE: Git could not verify ancestry ${ancestor} -> ${descendant}`,
    );
  }
}

/** Authenticate provenance against immutable objects at the RECORDED head, not current HEAD. */
export function validateRealProvenance(
  payload: Record<string, unknown>,
  identity: Phase4PassIdentity,
  repoRoot = process.cwd(),
): void {
  const provenance = asRecord(payload.provenance, "payload.provenance");
  expectExactKeys(
    provenance,
    [
      "node",
      "v8",
      "head",
      "trackedStatus",
      "criteriaFreezeIsAncestor",
      "runnerFreezeIsAncestor",
      "cadenceFreezeIsAncestor",
    ],
    "payload.provenance",
  );
  if (provenance.node !== PHASE4_NODE || provenance.v8 !== PHASE4_V8) {
    throw new Error(
      "V4-EVIDENCE-PROVENANCE: recorded Node/V8 engine is invalid",
    );
  }
  const head = provenance.head;
  if (typeof head !== "string" || !/^[0-9a-f]{40}$/.test(head)) {
    throw new Error("V4-EVIDENCE-PROVENANCE: recorded head is not 40-hex");
  }
  if (provenance.trackedStatus !== "") {
    throw new Error("V4-EVIDENCE-PROVENANCE: recorded tracked worktree was not clean");
  }

  const root = realpathSync.native(resolve(repoRoot));
  const discoveredRoot = realpathSync.native(
    gitText(root, ["rev-parse", "--show-toplevel"], "repository root"),
  );
  if (comparisonPath(discoveredRoot) !== comparisonPath(root)) {
    throw new Error("V4-EVIDENCE-PROVENANCE: repoRoot is not the Git worktree root");
  }
  gitBytes(root, ["cat-file", "-e", `${head}^{commit}`], `recorded commit ${head}`);

  const ancestry = {
    criteriaFreezeIsAncestor: gitIsAncestor(root, PHASE4_CRITERIA_FREEZE, head),
    runnerFreezeIsAncestor: gitIsAncestor(root, PHASE4_RUNNER_FREEZE, head),
    cadenceFreezeIsAncestor: gitIsAncestor(root, PHASE4_CADENCE_FREEZE, head),
  } as const;
  for (const [field, actual] of Object.entries(ancestry)) {
    if (provenance[field] !== actual) {
      throw new Error(
        `V4-EVIDENCE-PROVENANCE: recorded ${field}=${String(provenance[field])} ` +
          `disagrees with Git (${String(actual)})`,
      );
    }
    if (!actual) {
      throw new Error(`V4-EVIDENCE-PROVENANCE: ${field} is false at recorded head ${head}`);
    }
  }

  const sourceHashes = {
    gg: sha256HexNode(
      gitBytes(root, ["show", `${head}:solver-cpu/src/gg-solver.ts`], "recorded G-G source"),
    ),
    lk: sha256HexNode(
      gitBytes(root, ["show", `${head}:solver-cpu/src/lk-solver.ts`], "recorded LK source"),
    ),
  };
  if (
    sourceHashes.gg !== PHASE4_GG_SOURCE_SHA256 ||
    sourceHashes.lk !== PHASE4_LK_SOURCE_SHA256
  ) {
    throw new Error(
      `V4-EVIDENCE-PROVENANCE: solver sources at recorded head ${head} do not match the freeze`,
    );
  }

  if (identity.pass === "A") {
    const sourceHashes = asRecord(payload.sourceHashes, "payload.sourceHashes");
    expectExactKeys(sourceHashes, ["gg", "lk"], "payload.sourceHashes");
    if (
      sourceHashes.gg !== PHASE4_GG_SOURCE_SHA256 ||
      sourceHashes.lk !== PHASE4_LK_SOURCE_SHA256
    ) {
      throw new Error("V4-EVIDENCE-PROVENANCE: Pass A solver-source hashes are invalid");
    }
  } else if (payload.sourceHashes !== undefined) {
    const recordedSourceHashes = asRecord(payload.sourceHashes, "payload.sourceHashes");
    expectExactKeys(recordedSourceHashes, ["gg", "lk"], "payload.sourceHashes");
    if (
      recordedSourceHashes.gg !== PHASE4_GG_SOURCE_SHA256 ||
      recordedSourceHashes.lk !== PHASE4_LK_SOURCE_SHA256
    ) {
      throw new Error("V4-EVIDENCE-PROVENANCE: Pass B solver-source hashes are invalid");
    }
  }
}

function expectedCriterionNames(identity: Phase4PassIdentity): readonly string[] {
  return identity.pass === "A"
    ? [...PASS_A_EXECUTION_CRITERIA, ...PASS_A_MORPHOLOGY_CRITERIA]
    : [...PASS_B_EXECUTION_CRITERIA, ...PASS_B_MORPHOLOGY_CRITERIA];
}

function validateMeasurementRecord(value: unknown, criterion: string): void {
  const measurements = asRecord(value, `criterion ${criterion} measurements`);
  for (const [key, measurement] of Object.entries(measurements)) {
    if (
      measurement !== null &&
      typeof measurement !== "string" &&
      typeof measurement !== "boolean" &&
      !(
        typeof measurement === "number" &&
        Number.isFinite(measurement) &&
        !Object.is(measurement, -0)
      )
    ) {
      throw new Error(
        `V4-BUNDLE-CROSSLINK: criterion ${criterion} measurement ${key} is invalid`,
      );
    }
  }
}

function validatePublishedRecords(
  value: unknown,
  identity: Phase4PassIdentity,
): {
  readonly raw: readonly Record<string, unknown>[];
  readonly records: ReadonlyMap<string, VerifiedCriterionRecord>;
} {
  const raw = asArray(value, "payload.records").map((item, index) => {
    const record = asRecord(item, `payload.records[${index}]`);
    const criterion = asString(record.criterion, `payload.records[${index}].criterion`);
    const actualKeys = Object.keys(record).sort(lexicalCompare);
    const expectedKeys = ["criterion", "passed", "summary", "measurements"].sort(
      lexicalCompare,
    );
    if (canonicalString(actualKeys) !== canonicalString(expectedKeys)) {
      throw new Error(`V4-BUNDLE-CROSSLINK: criterion ${criterion} record keys are invalid`);
    }
    if (typeof record.passed !== "boolean") {
      throw new Error(`V4-BUNDLE-CROSSLINK: criterion ${criterion} passed must be boolean`);
    }
    if (asString(record.summary, `criterion ${criterion} summary`).trim().length === 0) {
      throw new Error(`V4-BUNDLE-CROSSLINK: criterion ${criterion} summary is blank`);
    }
    validateMeasurementRecord(record.measurements, criterion);
    return record;
  });
  const actualNames = raw.map((record) => record.criterion as string);
  if (new Set(actualNames).size !== actualNames.length) {
    throw new Error(`V4-RUN-COMPLETE: Pass ${identity.pass} criterion records are duplicated`);
  }
  if (canonicalString(actualNames) !== canonicalString(expectedCriterionNames(identity))) {
    throw new Error(
      `V4-RUN-COMPLETE: Pass ${identity.pass} criterion records must equal the exact frozen set`,
    );
  }
  return {
    raw,
    records: new Map(
      raw.map((record) => {
        const criterion = record.criterion as string;
        return [
          criterion,
          {
            criterion,
            passed: record.passed as boolean,
            summary: record.summary as string,
          },
        ];
      }),
    ),
  };
}

function validatePublishedVerdict(
  verdict: Record<string, unknown>,
  rawRecords: readonly Record<string, unknown>[],
  identity: Phase4PassIdentity,
): void {
  const byName = new Map(
    rawRecords.map((record) => [record.criterion as string, record.passed as boolean]),
  );
  if (identity.pass === "A") {
    const blockingFailures = expectedCriterionNames(identity).filter(
      (criterion) => byName.get(criterion) === false,
    );
    const executionValid = PASS_A_EXECUTION_CRITERIA.every(
      (criterion) => byName.get(criterion) === true,
    );
    const morphologyPass = PASS_A_MORPHOLOGY_CRITERIA.every(
      (criterion) => byName.get(criterion) === true,
    );
    const gatePass = executionValid && morphologyPass;
    const expected = {
      pass: "A",
      contractFailures: [],
      blockingFailures,
      executionValid,
      morphologyPass,
      gatePass,
      exitCode: gatePass ? 0 : 1,
      records: rawRecords,
    };
    if (canonicalString(verdict) !== canonicalString(expected)) {
      throw new Error(
        "V4-BUNDLE-CROSSLINK: Pass A verdict disagrees with independently recomputed records",
      );
    }
    if (!gatePass) {
      throw new Error("V4-BUNDLE-CROSSLINK: published Pass A records do not pass the gate");
    }
    return;
  }

  const executionFailures = PASS_B_EXECUTION_CRITERIA.filter(
    (criterion) => byName.get(criterion) === false,
  );
  const diagnosticFailures = PASS_B_MORPHOLOGY_CRITERIA.filter(
    (criterion) => byName.get(criterion) === false,
  );
  const executionValid = executionFailures.length === 0;
  const diagnosticPass = diagnosticFailures.length === 0;
  const expected = {
    pass: "B",
    contractFailures: [],
    executionFailures,
    diagnosticFailures,
    executionValid,
    diagnosticPass,
    gatePass: executionValid,
    exitCode: executionValid ? 0 : 1,
    records: rawRecords,
  };
  if (canonicalString(verdict) !== canonicalString(expected)) {
    throw new Error(
      "V4-BUNDLE-CROSSLINK: Pass B verdict disagrees with independently recomputed records",
    );
  }
  if (!executionValid) {
    throw new Error("V4-BUNDLE-CROSSLINK: published Pass B records are execution-invalid");
  }
}

/** Exact real-publication record/verdict contract, exported for adversarial harness tests. */
export function validatePublishedRecordVerdictContract(
  payload: Record<string, unknown>,
  identity: Phase4PassIdentity,
): ReadonlyMap<string, VerifiedCriterionRecord> {
  const verdict = asRecord(payload.verdict, "payload.verdict");
  const validated = validatePublishedRecords(payload.records, identity);
  validatePublishedVerdict(verdict, validated.raw, identity);
  return validated.records;
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
  options: VerifyPhase4BundleOptions = {},
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

  const manifestSha256 = sha256HexNode(manifestBytes);
  const syntheticMarked =
    manifest.fixture === SYNTHETIC_FIXTURE_NOTICE || payload.fixture === SYNTHETIC_FIXTURE_NOTICE;
  let evidenceClass: VerifiedEvidenceClass;
  if (syntheticMarked) {
    if (options.allowSyntheticFixture !== true) {
      throw new Error(
        "V4-EVIDENCE-PROVENANCE: synthetic fixture refused; use the explicit dev-only opt-in",
      );
    }
    if (
      manifest.fixture !== SYNTHETIC_FIXTURE_NOTICE ||
      payload.fixture !== SYNTHETIC_FIXTURE_NOTICE
    ) {
      throw new Error("V4-EVIDENCE-PROVENANCE: synthetic fixture marker is incomplete");
    }
    evidenceClass = "synthetic-fixture-not-gate-evidence";
  } else {
    if (manifest.fixture !== undefined || payload.fixture !== undefined) {
      throw new Error("V4-EVIDENCE-PROVENANCE: unrecognized fixture marker");
    }
    if (manifestSha256 !== expectedManifestSha256(identity)) {
      throw new Error(
        `V4-EVIDENCE-PROVENANCE: Pass ${identity.pass} manifest does not match its frozen SHA-256`,
      );
    }
    validateRealProvenance(payload, identity, options.repoRoot);
    evidenceClass = "published-gate-evidence";
  }
  if (manifest.backend !== PHASE4_EVIDENCE_BACKEND) {
    throw new Error(`V4-EVIDENCE-PROVENANCE: manifest backend must be ${PHASE4_EVIDENCE_BACKEND}`);
  }

  // 6. Verdict envelope. Real publication is recomputed from the exact record set below;
  // synthetic fixtures retain only the minimal explicit-dev contract.
  const verdict = asRecord(payload.verdict, "payload.verdict");
  if (evidenceClass === "synthetic-fixture-not-gate-evidence") {
    if (identity.pass === "A" && verdict.gatePass !== true) {
      throw new Error("V4-BUNDLE-CROSSLINK: synthetic Pass A fixture must record gatePass=true");
    }
    if (identity.pass === "B" && verdict.executionValid !== true) {
      throw new Error(
        "V4-BUNDLE-CROSSLINK: synthetic Pass B fixture must record executionValid=true",
      );
    }
  }

  // 7. Per-run checkpoint strict decode + metadata/array-length/field-hash consistency.
  const manifestRunItems = asArray(manifest.runs, "manifest.runs");
  const manifestRunIds = manifestRunItems.map((item) =>
    asString(asRecord(item, "manifest run").id, "manifest run id")
  );
  validateExactRunSet(manifestRunIds, identity, "manifest.runs");
  const manifestRuns = new Map<string, Record<string, unknown>>();
  for (const item of manifestRunItems) {
    const config = asRecord(item, "manifest run");
    if (config.backend !== PHASE4_EVIDENCE_BACKEND || config.operator !== identity.operator) {
      throw new Error(`V4-EVIDENCE-PROVENANCE: run ${String(config.id)} backend/operator is invalid`);
    }
    manifestRuns.set(asString(config.id, "manifest run id"), config);
  }
  const reportRunItems = asArray(payload.runs, "payload.runs");
  const reportRunIds = reportRunItems.map((item) =>
    asString(asRecord(item, "run summary").runId, "run summary runId")
  );
  validateExactRunSet(reportRunIds, identity, "payload.runs");
  if (canonicalString(reportRunIds) !== canonicalString(manifestRunIds)) {
    throw new Error("V4-RUN-COMPLETE: manifest/report run sets or order differ");
  }
  const runs = new Map<string, VerifiedRun>();
  const executionIds = new Set<string>();
  for (const item of reportRunItems) {
    const summary = asRecord(item, "run summary");
    const runId = asString(summary.runId, "run summary runId");
    const executionId = asString(summary.executionId, `run ${runId} executionId`);
    if (executionIds.has(executionId)) {
      throw new Error("V4-RUN-COMPLETE: report contains duplicate execution IDs");
    }
    executionIds.add(executionId);
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

    if (evidenceClass === "published-gate-evidence") {
      const configSha256 = asString(summary.configSha256, `run ${runId} configSha256`);
      if (configSha256 !== sha256HexNode(canonicalJsonBytesOf(config))) {
        throw new Error(`V4-EVIDENCE-PROVENANCE: run ${runId} config identity is invalid`);
      }
      const identityPayload =
        identity.pass === "A"
          ? {
              runId,
              configSha256,
              resolvedTargetTExtent: summary.resolvedTargetTExtent,
              tick: completedSteps,
              a: final.aSha256,
              b: final.bSha256,
              d: final.dSha256,
            }
          : {
              runId,
              configSha256,
              tick: completedSteps,
              a: final.aSha256,
              f: final.fSha256,
              sigma: final.sigmaSha256,
            };
      if (executionId !== sha256HexNode(canonicalJsonBytesOf(identityPayload))) {
        throw new Error(`V4-EVIDENCE-PROVENANCE: run ${runId} execution identity is invalid`);
      }
    }

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

  let records: ReadonlyMap<string, VerifiedCriterionRecord>;
  if (evidenceClass === "published-gate-evidence") {
    records = validatePublishedRecordVerdictContract(payload, identity);
  } else {
    const fixtureRecords = new Map<string, VerifiedCriterionRecord>();
    for (const item of asArray(payload.records, "payload.records")) {
      const record = asRecord(item, "criterion record");
      const criterion = asString(record.criterion, "criterion record name");
      if (fixtureRecords.has(criterion)) {
        throw new Error(`V4-RUN-COMPLETE: duplicate criterion record ${criterion}`);
      }
      if (typeof record.passed !== "boolean") {
        throw new Error(`V4-BUNDLE-CROSSLINK: criterion ${criterion} passed must be boolean`);
      }
      fixtureRecords.set(criterion, {
        criterion,
        passed: record.passed,
        summary: asString(record.summary, `criterion ${criterion} summary`),
      });
    }
    records = fixtureRecords;
  }
  const requiredCriteria =
    identity.pass === "A"
      ? ["A-HABIT-ENDPOINTS", "A-HABIT-SOLID", "A-DEPLETION-SIGNAL", "A-TIMELINE-CAPS", "A-BRANCH"]
      : ["B-HABIT-ENDPOINTS", "B-HABIT-SOLID", "B-HOLLOW", "B-TIMELINE", "B-BRANCH"];
  for (const criterion of requiredCriteria) {
    if (!records.has(criterion)) {
      throw new Error(`V4-VIEW-MANIFEST: report lacks required view criterion ${criterion}`);
    }
  }

  return {
    directory,
    identity,
    report,
    payload,
    verdict,
    manifest,
    runs,
    manifestSha256,
    evidenceClass,
    records,
  };
}

// ── Required views (V4-5) ──────────────────────────────────────────────────────────────────

export type ViewStyle = "solid" | "column" | "slice" | "profile" | "top";

export interface RequiredView {
  readonly name: string;
  readonly pass: "A" | "B";
  readonly runId: string;
  readonly style: ViewStyle;
  readonly verdictCriterion: string;
}

export const REQUIRED_PASS_A_VIEWS: readonly RequiredView[] = [
  { name: "pass-a-plate-endpoint", pass: "A", runId: "A-HABIT-U0", style: "solid", verdictCriterion: "A-HABIT-ENDPOINTS" },
  { name: "pass-a-column-endpoint", pass: "A", runId: "A-HABIT-U1", style: "column", verdictCriterion: "A-HABIT-SOLID" },
  { name: "pass-a-hollow-column-slice", pass: "A", runId: "A-DEPLETION", style: "slice", verdictCriterion: "A-DEPLETION-SIGNAL" },
  { name: "pass-a-capped-column-profile", pass: "A", runId: "A-TIMELINE", style: "profile", verdictCriterion: "A-TIMELINE-CAPS" },
  { name: "pass-a-dendrite-top", pass: "A", runId: "A-BRANCH-DENDRITE", style: "top", verdictCriterion: "A-BRANCH" },
];

/** Pass B counterparts; B-HABIT-TM15 is also the registered B-DEPLETION run (plan §B). */
export const PASS_B_COUNTERPART_VIEWS: readonly RequiredView[] = [
  { name: "pass-b-plate-endpoint", pass: "B", runId: "B-HABIT-TM5", style: "solid", verdictCriterion: "B-HABIT-ENDPOINTS" },
  { name: "pass-b-column-endpoint", pass: "B", runId: "B-HABIT-TM15", style: "column", verdictCriterion: "B-HABIT-SOLID" },
  { name: "pass-b-hollow-column-slice", pass: "B", runId: "B-HOLLOW-SEED-1", style: "slice", verdictCriterion: "B-HOLLOW" },
  { name: "pass-b-capped-column-profile", pass: "B", runId: "B-TIMELINE", style: "profile", verdictCriterion: "B-TIMELINE" },
  { name: "pass-b-dendrite-top", pass: "B", runId: "B-BRANCH", style: "top", verdictCriterion: "B-BRANCH" },
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
      throw new Error(`V4-RUN-COMPLETE: verified Pass B bundle is missing ${view.runId}`);
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
  if (new Set(backendPasses).size !== backendPasses.length) {
    throw new Error("V4-VIEW-MANIFEST: backend pass names are duplicated");
  }
  const entryKeys = entries.map((entry) => `${entry.backendPass}\u0000${entry.name}`);
  if (new Set(entryKeys).size !== entryKeys.length) {
    throw new Error("V4-VIEW-MANIFEST: capture entries are duplicated");
  }
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
  if (entries.length !== requiredViews.length * backendPasses.length) {
    throw new Error("V4-VIEW-MANIFEST: capture entry count is not exact");
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
  const absenceKey = (item: AbsentView) => `${item.name}\u0000${item.reason}`;
  const actualAbsences = absences.map(absenceKey).sort(lexicalCompare);
  const requiredAbsences = expectedAbsent.map(absenceKey).sort(lexicalCompare);
  if (canonicalString(actualAbsences) !== canonicalString(requiredAbsences)) {
    throw new Error("V4-VIEW-MANIFEST: absent-view set is not exact");
  }
}
