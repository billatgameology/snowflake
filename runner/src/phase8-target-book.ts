// Phase 8 target-book parser and fail-closed structural verifier.
//
// This is a Node-only evidence boundary because it resolves tracked research-index files. The
// scientific transforms themselves stay environment-neutral in @vcc/core.

import { readFileSync } from "node:fs";
import { resolve, sep } from "node:path";
import { canonicalJson, sha256Bytes, type StrictJson } from "./gate4-evidence.ts";

export const PHASE8_BOOK_SCHEMA = "phase8-target-book-v1" as const;

export const PHASE8_DERIVED_OPERATORS = [
  "none",
  "mass-law-exponent-v1",
  "power-exponent-p-v1",
  "scaled-mass-growth-trajectory-v1",
  "boundary-temperature-v1",
] as const;

export const PHASE8_SPLITS = [
  "model-development",
  "held-out",
  "out-of-model",
  "not-applicable",
] as const;

export const PHASE8_SUPERSATURATION_SEMANTICS = [
  "ice-relative-far-field",
  "ice-relative-surface",
  /** Positive magnitudes of a source-reported deficit below ice saturation. */
  "ice-relative-undersaturation",
  "at-water-saturation",
  "chamber-calibrated-ice-relative",
  /** A composite entry whose source-specific semantics remain separate in `detail`. */
  "mixed-source-specific",
  "not-reported",
] as const;

export interface Phase8Book {
  readonly entries: readonly Phase8Entry[];
  readonly status: Phase8BookStatus;
  readonly sha256: string;
  readonly byteLength: number;
}

export interface Phase8SourceRef {
  readonly path: string;
  readonly extractId: string;
}

export interface Phase8Witness {
  readonly laboratory: string;
  readonly method: string;
  readonly position: string;
  readonly sourceRef: Phase8SourceRef;
}

export interface Phase8Entry {
  readonly recordKind: "entry";
  readonly id: string;
  readonly role: "input" | "target";
  readonly observable: {
    readonly kind: string;
    readonly description: string;
  };
  readonly claim: string;
  readonly sourceRefs: readonly Phase8SourceRef[];
  /** Optional tracked machine-readable observations used by this entry. */
  readonly dataRefs: readonly string[];
  readonly protocol: {
    readonly seed: { readonly kind: string; readonly detail: string };
    readonly pressure: {
      readonly kind: string;
      readonly valuesPascal: readonly number[];
      readonly uncertainty: string;
      readonly detail: string;
    };
    readonly geometry: { readonly kind: string; readonly detail: string };
    readonly supersaturation: {
      readonly semantics: string;
      readonly valuesFraction: readonly number[];
      readonly uncertainty: string;
      readonly detail: string;
    };
    readonly growthHistory: { readonly kind: string; readonly detail: string };
    readonly ensemble: { readonly kind: string; readonly detail: string };
    readonly substrate: { readonly kind: string; readonly detail: string };
    readonly medium: string;
  };
  readonly uncertainty: string;
  readonly robustness: {
    readonly class: "A" | "B" | "C";
    readonly witnesses: readonly Phase8Witness[];
    readonly rationale: string;
    readonly reconciliationHypothesis: string | null;
  };
  readonly partition: {
    readonly split: typeof PHASE8_SPLITS[number];
    readonly inSample: boolean;
    readonly comparisonStatus: "scoreable" | "conditional" | "not-scoreable";
    readonly rationale: string;
  };
  readonly derivedOperator: typeof PHASE8_DERIVED_OPERATORS[number];
  readonly limits: readonly string[];
}

export interface Phase8BookStatus {
  readonly recordKind: "book-status";
  readonly schema: typeof PHASE8_BOOK_SCHEMA;
  readonly book: string;
  readonly entryCount: number;
  readonly targetCount: number;
  readonly inputCount: number;
  readonly leakageGuards: readonly Phase8LeakageGuard[];
  readonly sourceIndexes: readonly string[];
  readonly extends: {
    readonly path: string;
    readonly entryCount: number;
    readonly passEligible: false;
    readonly sha256: string;
  };
}

export interface Phase8LeakageGuard {
  /** Model-input entry whose adoption changes the eligibility of the named held-out targets. */
  readonly inputId: string;
  /** Every held-out target sharing a source-index lineage with this input, in lexical order. */
  readonly targetIds: readonly string[];
  /** Fail-closed non-use or case-separation rule that preserves held-out eligibility. */
  readonly rule: string;
}

type JsonObject = { readonly [key: string]: StrictJson };

const ENTRY_KEYS = [
  "claim",
  "dataRefs",
  "derivedOperator",
  "id",
  "limits",
  "observable",
  "partition",
  "protocol",
  "recordKind",
  "robustness",
  "role",
  "sourceRefs",
  "uncertainty",
] as const;
const STATUS_KEYS = [
  "book",
  "entryCount",
  "extends",
  "inputCount",
  "leakageGuards",
  "recordKind",
  "schema",
  "sourceIndexes",
  "targetCount",
] as const;
const SOURCE_REF_KEYS = ["extractId", "path"] as const;
const KIND_DETAIL_KEYS = ["detail", "kind"] as const;
const PROTOCOL_KEYS = [
  "ensemble",
  "geometry",
  "growthHistory",
  "medium",
  "pressure",
  "seed",
  "substrate",
  "supersaturation",
] as const;
const PRESSURE_KEYS = ["detail", "kind", "uncertainty", "valuesPascal"] as const;
const SUPERSATURATION_KEYS = ["detail", "semantics", "uncertainty", "valuesFraction"] as const;
const ROBUSTNESS_KEYS = ["class", "rationale", "reconciliationHypothesis", "witnesses"] as const;
const WITNESS_KEYS = ["laboratory", "method", "position", "sourceRef"] as const;
const PARTITION_KEYS = ["comparisonStatus", "inSample", "rationale", "split"] as const;
const OBSERVABLE_KEYS = ["description", "kind"] as const;
const EXTENDS_KEYS = ["entryCount", "passEligible", "path", "sha256"] as const;
const LEAKAGE_GUARD_KEYS = ["inputId", "rule", "targetIds"] as const;

const SHA256 = /^[0-9a-f]{64}$/;
const ENTRY_ID = /^P8-[A-Z][A-Z0-9-]{2,}$/;
const EXTRACT_ID = /^P8X-[A-Z0-9-]{3,}$/;
const SOURCE_INDEX_PATH = /^research\/[A-Za-z0-9][A-Za-z0-9._/-]*\.md$/;
const DATA_PATH = /^research\/[A-Za-z0-9][A-Za-z0-9._/-]*\.jsonl?$/;

function asObject(value: StrictJson | undefined, label: string): JsonObject {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
  return value as JsonObject;
}

function exactKeys(value: JsonObject, expected: readonly string[], label: string): void {
  const actual = Object.keys(value).sort();
  if (actual.length !== expected.length || actual.some((key, index) => key !== expected[index])) {
    throw new Error(`${label} keys must be exactly ${expected.join(",")}`);
  }
}

function asString(value: StrictJson | undefined, label: string): string {
  if (typeof value !== "string" || value.trim() === "") throw new Error(`${label} must be a nonempty string`);
  return value;
}

function asBoolean(value: StrictJson | undefined, label: string): boolean {
  if (typeof value !== "boolean") throw new Error(`${label} must be boolean`);
  return value;
}

function asNonnegativeInteger(value: StrictJson | undefined, label: string): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
    throw new Error(`${label} must be a nonnegative integer`);
  }
  return value;
}

function asStringArray(value: StrictJson | undefined, label: string, allowEmpty = false): readonly string[] {
  if (!Array.isArray(value) || (!allowEmpty && value.length === 0)) {
    throw new Error(`${label} must be ${allowEmpty ? "an" : "a nonempty"} array`);
  }
  const result = value.map((item, index) => asString(item, `${label}[${index}]`));
  if (new Set(result).size !== result.length) throw new Error(`${label} must not contain duplicates`);
  return result;
}

function asPositiveNumberArray(
  value: StrictJson | undefined,
  label: string,
  allowEmpty: boolean,
): readonly number[] {
  if (!Array.isArray(value) || (!allowEmpty && value.length === 0)) {
    throw new Error(`${label} must be ${allowEmpty ? "an" : "a nonempty"} array`);
  }
  return value.map((item, index) => {
    if (typeof item !== "number" || !Number.isFinite(item) || item <= 0) {
      throw new Error(`${label}[${index}] must be finite and greater than zero`);
    }
    return item;
  });
}

function oneOf<const T extends readonly string[]>(
  value: StrictJson | undefined,
  allowed: T,
  label: string,
): T[number] {
  const text = asString(value, label);
  if (!(allowed as readonly string[]).includes(text)) {
    throw new Error(`${label} must be one of ${allowed.join(",")}`);
  }
  return text as T[number];
}

function sourceRef(value: StrictJson | undefined, label: string): Phase8SourceRef {
  const object = asObject(value, label);
  exactKeys(object, SOURCE_REF_KEYS, label);
  const path = asString(object.path, `${label}.path`);
  const extractId = asString(object.extractId, `${label}.extractId`);
  if (!SOURCE_INDEX_PATH.test(path)) throw new Error(`${label}.path is not a tracked research index path`);
  if (!EXTRACT_ID.test(extractId)) throw new Error(`${label}.extractId has invalid syntax`);
  return { path, extractId };
}

function sourceRefKey(ref: Phase8SourceRef): string {
  return `${ref.path}#${ref.extractId}`;
}

function kindDetail(value: StrictJson | undefined, label: string): { kind: string; detail: string } {
  const object = asObject(value, label);
  exactKeys(object, KIND_DETAIL_KEYS, label);
  return {
    kind: asString(object.kind, `${label}.kind`),
    detail: asString(object.detail, `${label}.detail`),
  };
}

function entryFromJson(value: StrictJson, label: string): Phase8Entry {
  const object = asObject(value, label);
  exactKeys(object, ENTRY_KEYS, label);
  if (object.recordKind !== "entry") throw new Error(`${label}.recordKind must be entry`);
  const id = asString(object.id, `${label}.id`);
  if (!ENTRY_ID.test(id)) throw new Error(`${label}.id has invalid syntax`);
  const role = oneOf(object.role, ["input", "target"] as const, `${label}.role`);

  const observableObject = asObject(object.observable, `${label}.observable`);
  exactKeys(observableObject, OBSERVABLE_KEYS, `${label}.observable`);
  const observable = {
    kind: asString(observableObject.kind, `${label}.observable.kind`),
    description: asString(observableObject.description, `${label}.observable.description`),
  };

  if (!Array.isArray(object.sourceRefs) || object.sourceRefs.length === 0) {
    throw new Error(`${label}.sourceRefs must be a nonempty array`);
  }
  const sourceRefs = object.sourceRefs.map((ref, index) => sourceRef(ref, `${label}.sourceRefs[${index}]`));
  const sourceKeys = sourceRefs.map(sourceRefKey);
  if (new Set(sourceKeys).size !== sourceKeys.length) throw new Error(`${label}.sourceRefs must be unique`);
  if ([...sourceKeys].sort().some((key, index) => key !== sourceKeys[index])) {
    throw new Error(`${label}.sourceRefs must be in lexical path-and-anchor order`);
  }
  const dataRefs = asStringArray(object.dataRefs, `${label}.dataRefs`, true);
  if (dataRefs.some((path) => !DATA_PATH.test(path))) {
    throw new Error(`${label}.dataRefs contains an invalid tracked research-data path`);
  }
  if ([...dataRefs].sort().some((path, index) => path !== dataRefs[index])) {
    throw new Error(`${label}.dataRefs must be in lexical order`);
  }

  const protocolObject = asObject(object.protocol, `${label}.protocol`);
  exactKeys(protocolObject, PROTOCOL_KEYS, `${label}.protocol`);
  const pressureObject = asObject(protocolObject.pressure, `${label}.protocol.pressure`);
  exactKeys(pressureObject, PRESSURE_KEYS, `${label}.protocol.pressure`);
  const pressureKind = asString(pressureObject.kind, `${label}.protocol.pressure.kind`);
  const pressureForbidsAggregateValue = pressureKind === "not-reported"
    || pressureKind === "mixed-source-specific";
  const pressureValues = asPositiveNumberArray(
    pressureObject.valuesPascal,
    `${label}.protocol.pressure.valuesPascal`,
    pressureForbidsAggregateValue,
  );
  if (pressureForbidsAggregateValue && pressureValues.length !== 0) {
    throw new Error(`${label}.protocol.pressure ${pressureKind} must have no aggregate values`);
  }
  const supersaturationObject = asObject(
    protocolObject.supersaturation,
    `${label}.protocol.supersaturation`,
  );
  exactKeys(supersaturationObject, SUPERSATURATION_KEYS, `${label}.protocol.supersaturation`);
  const sigmaSemantics = oneOf(
    supersaturationObject.semantics,
    PHASE8_SUPERSATURATION_SEMANTICS,
    `${label}.protocol.supersaturation.semantics`,
  );
  const sigmaForbidsAggregateValue = sigmaSemantics === "not-reported"
    || sigmaSemantics === "at-water-saturation"
    || sigmaSemantics === "mixed-source-specific";
  const sigmaValues = asPositiveNumberArray(
    supersaturationObject.valuesFraction,
    `${label}.protocol.supersaturation.valuesFraction`,
    true,
  );
  if (sigmaForbidsAggregateValue && sigmaValues.length !== 0) {
    throw new Error(`${label}.protocol.supersaturation ${sigmaSemantics} must not invent values`);
  }

  const protocol = {
    seed: kindDetail(protocolObject.seed, `${label}.protocol.seed`),
    pressure: {
      kind: pressureKind,
      valuesPascal: pressureValues,
      uncertainty: asString(pressureObject.uncertainty, `${label}.protocol.pressure.uncertainty`),
      detail: asString(pressureObject.detail, `${label}.protocol.pressure.detail`),
    },
    geometry: kindDetail(protocolObject.geometry, `${label}.protocol.geometry`),
    supersaturation: {
      semantics: sigmaSemantics,
      valuesFraction: sigmaValues,
      uncertainty: asString(
        supersaturationObject.uncertainty,
        `${label}.protocol.supersaturation.uncertainty`,
      ),
      detail: asString(supersaturationObject.detail, `${label}.protocol.supersaturation.detail`),
    },
    growthHistory: kindDetail(protocolObject.growthHistory, `${label}.protocol.growthHistory`),
    ensemble: kindDetail(protocolObject.ensemble, `${label}.protocol.ensemble`),
    substrate: kindDetail(protocolObject.substrate, `${label}.protocol.substrate`),
    medium: asString(protocolObject.medium, `${label}.protocol.medium`),
  };

  const robustnessObject = asObject(object.robustness, `${label}.robustness`);
  exactKeys(robustnessObject, ROBUSTNESS_KEYS, `${label}.robustness`);
  const robustnessClass = oneOf(robustnessObject.class, ["A", "B", "C"] as const, `${label}.robustness.class`);
  if (!Array.isArray(robustnessObject.witnesses) || robustnessObject.witnesses.length === 0) {
    throw new Error(`${label}.robustness.witnesses must be a nonempty array`);
  }
  const witnesses = robustnessObject.witnesses.map((witnessValue, index): Phase8Witness => {
    const witnessObject = asObject(witnessValue, `${label}.robustness.witnesses[${index}]`);
    exactKeys(witnessObject, WITNESS_KEYS, `${label}.robustness.witnesses[${index}]`);
    const ref = sourceRef(witnessObject.sourceRef, `${label}.robustness.witnesses[${index}].sourceRef`);
    if (!sourceKeys.includes(sourceRefKey(ref))) {
      throw new Error(`${label}.robustness witness ${index} sourceRef is absent from entry sourceRefs`);
    }
    return {
      laboratory: asString(witnessObject.laboratory, `${label}.robustness.witnesses[${index}].laboratory`),
      method: asString(witnessObject.method, `${label}.robustness.witnesses[${index}].method`),
      position: asString(witnessObject.position, `${label}.robustness.witnesses[${index}].position`),
      sourceRef: ref,
    };
  });
  if (robustnessClass === "A") {
    const hasIndependentPair = witnesses.some((left, leftIndex) => witnesses.some((right, rightIndex) => (
      rightIndex > leftIndex && left.laboratory !== right.laboratory && left.method !== right.method
    )));
    if (!hasIndependentPair) {
      throw new Error(`${label} Class A requires witnesses from different laboratories and methods`);
    }
  }
  const hypothesisValue = robustnessObject.reconciliationHypothesis;
  const reconciliationHypothesis = hypothesisValue === null
    ? null
    : asString(hypothesisValue, `${label}.robustness.reconciliationHypothesis`);
  if (robustnessClass === "C" && reconciliationHypothesis === null) {
    throw new Error(`${label} Class C requires a testable reconciliation hypothesis`);
  }
  if (robustnessClass === "C"
      && (witnesses.length < 2 || new Set(witnesses.map((witness) => witness.position)).size < 2)) {
    throw new Error(`${label} Class C requires at least two explicitly different witness positions`);
  }
  if (robustnessClass !== "C" && reconciliationHypothesis !== null) {
    throw new Error(`${label} only Class C may carry a reconciliation hypothesis`);
  }

  const partitionObject = asObject(object.partition, `${label}.partition`);
  exactKeys(partitionObject, PARTITION_KEYS, `${label}.partition`);
  const split = oneOf(partitionObject.split, PHASE8_SPLITS, `${label}.partition.split`);
  const inSample = asBoolean(partitionObject.inSample, `${label}.partition.inSample`);
  const comparisonStatus = oneOf(
    partitionObject.comparisonStatus,
    ["scoreable", "conditional", "not-scoreable"] as const,
    `${label}.partition.comparisonStatus`,
  );
  if (role === "input" && (split !== "not-applicable" || !inSample || comparisonStatus !== "not-scoreable")) {
    throw new Error(`${label} input must be in-sample, not-scoreable, and outside the target split`);
  }
  if (role === "target" && split === "not-applicable") {
    throw new Error(`${label} target must belong to the pre-registered split`);
  }
  if (role === "target" && ((split === "model-development") !== inSample)) {
    throw new Error(`${label} target inSample must agree with model-development membership`);
  }
  if (split === "out-of-model" && comparisonStatus !== "not-scoreable") {
    throw new Error(`${label} out-of-model target must be not-scoreable`);
  }

  const derivedOperator = oneOf(
    object.derivedOperator,
    PHASE8_DERIVED_OPERATORS,
    `${label}.derivedOperator`,
  );
  return {
    recordKind: "entry",
    id,
    role,
    observable,
    claim: asString(object.claim, `${label}.claim`),
    sourceRefs,
    dataRefs,
    protocol,
    uncertainty: asString(object.uncertainty, `${label}.uncertainty`),
    robustness: {
      class: robustnessClass,
      witnesses,
      rationale: asString(robustnessObject.rationale, `${label}.robustness.rationale`),
      reconciliationHypothesis,
    },
    partition: {
      split,
      inSample,
      comparisonStatus,
      rationale: asString(partitionObject.rationale, `${label}.partition.rationale`),
    },
    derivedOperator,
    limits: asStringArray(object.limits, `${label}.limits`),
  };
}

function leakageGuardFromJson(value: StrictJson | undefined, label: string): Phase8LeakageGuard {
  const object = asObject(value, label);
  exactKeys(object, LEAKAGE_GUARD_KEYS, label);
  const inputId = asString(object.inputId, `${label}.inputId`);
  if (!ENTRY_ID.test(inputId)) throw new Error(`${label}.inputId has invalid syntax`);
  const targetIds = asStringArray(object.targetIds, `${label}.targetIds`);
  if (targetIds.some((id) => !ENTRY_ID.test(id))) {
    throw new Error(`${label}.targetIds contains an invalid entry id`);
  }
  if ([...targetIds].sort().some((id, index) => id !== targetIds[index])) {
    throw new Error(`${label}.targetIds must be in lexical order`);
  }
  return {
    inputId,
    targetIds,
    rule: asString(object.rule, `${label}.rule`),
  };
}

function statusFromJson(value: StrictJson, label: string): Phase8BookStatus {
  const object = asObject(value, label);
  exactKeys(object, STATUS_KEYS, label);
  if (object.recordKind !== "book-status") throw new Error(`${label}.recordKind must be book-status`);
  if (object.schema !== PHASE8_BOOK_SCHEMA) throw new Error(`${label}.schema must be ${PHASE8_BOOK_SCHEMA}`);
  const sourceIndexes = asStringArray(object.sourceIndexes, `${label}.sourceIndexes`);
  if (sourceIndexes.some((path) => !SOURCE_INDEX_PATH.test(path))) {
    throw new Error(`${label}.sourceIndexes contains an invalid research index path`);
  }
  if ([...sourceIndexes].sort().some((path, index) => path !== sourceIndexes[index])) {
    throw new Error(`${label}.sourceIndexes must be in lexical order`);
  }
  const extendsObject = asObject(object.extends, `${label}.extends`);
  exactKeys(extendsObject, EXTENDS_KEYS, `${label}.extends`);
  const extendsPath = asString(extendsObject.path, `${label}.extends.path`);
  const extendsSha256 = asString(extendsObject.sha256, `${label}.extends.sha256`);
  if (!SHA256.test(extendsSha256)) throw new Error(`${label}.extends.sha256 has invalid syntax`);
  if (extendsObject.passEligible !== false) throw new Error(`${label}.extends.passEligible must remain false`);
  if (!Array.isArray(object.leakageGuards)) {
    throw new Error(`${label}.leakageGuards must be an array`);
  }
  const leakageGuards = object.leakageGuards.map((guard, index) => (
    leakageGuardFromJson(guard, `${label}.leakageGuards[${index}]`)
  ));
  const guardInputIds = leakageGuards.map((guard) => guard.inputId);
  if (new Set(guardInputIds).size !== guardInputIds.length) {
    throw new Error(`${label}.leakageGuards must have unique inputId values`);
  }
  if ([...guardInputIds].sort().some((id, index) => id !== guardInputIds[index])) {
    throw new Error(`${label}.leakageGuards must be in lexical inputId order`);
  }
  return {
    recordKind: "book-status",
    schema: PHASE8_BOOK_SCHEMA,
    book: asString(object.book, `${label}.book`),
    entryCount: asNonnegativeInteger(object.entryCount, `${label}.entryCount`),
    targetCount: asNonnegativeInteger(object.targetCount, `${label}.targetCount`),
    inputCount: asNonnegativeInteger(object.inputCount, `${label}.inputCount`),
    leakageGuards,
    sourceIndexes,
    extends: {
      path: extendsPath,
      entryCount: asNonnegativeInteger(extendsObject.entryCount, `${label}.extends.entryCount`),
      passEligible: false,
      sha256: extendsSha256,
    },
  };
}

/** Parse canonical, newline-terminated JSONL and enforce all book-level invariants. */
export function parsePhase8TargetBook(bytes: Uint8Array): Phase8Book {
  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw new Error("Phase 8 target book is not valid UTF-8");
  }
  if (text.includes("\r")) throw new Error("Phase 8 target book must use LF line endings");
  if (!text.endsWith("\n")) throw new Error("Phase 8 target book must end with a newline");
  const lines = text.slice(0, -1).split("\n");
  if (lines.length < 2 || lines.some((line) => line.length === 0)) {
    throw new Error("Phase 8 target book requires entries plus one terminal status and no blank lines");
  }
  const records = lines.map((line, index): StrictJson => {
    let parsed: unknown;
    try {
      parsed = JSON.parse(line) as unknown;
    } catch {
      throw new Error(`Phase 8 target book line ${index + 1} is not JSON`);
    }
    const canonical = canonicalJson(parsed);
    if (line !== canonical) throw new Error(`Phase 8 target book line ${index + 1} is not canonical JSON`);
    return JSON.parse(canonical) as StrictJson;
  });
  const status = statusFromJson(records[records.length - 1] as StrictJson, "Phase 8 target book status");
  const entries = records.slice(0, -1).map((record, index) => (
    entryFromJson(record, `Phase 8 target book entry ${index + 1}`)
  ));
  const ids = entries.map((entry) => entry.id);
  if (new Set(ids).size !== ids.length) throw new Error("Phase 8 target book entry ids must be unique");
  if ([...ids].sort().some((id, index) => id !== ids[index])) {
    throw new Error("Phase 8 target book entries must be in lexical id order");
  }
  const targetCount = entries.filter((entry) => entry.role === "target").length;
  const inputCount = entries.length - targetCount;
  if (
    status.entryCount !== entries.length ||
    status.targetCount !== targetCount ||
    status.inputCount !== inputCount
  ) {
    throw new Error("Phase 8 target book status counts do not match independently counted entries");
  }
  const referencedPaths = new Set(entries.flatMap((entry) => entry.sourceRefs.map((ref) => ref.path)));
  if (
    referencedPaths.size !== status.sourceIndexes.length ||
    status.sourceIndexes.some((path) => !referencedPaths.has(path))
  ) {
    throw new Error("Phase 8 target book sourceIndexes must exactly cover referenced indexes");
  }
  const entriesById = new Map(entries.map((entry) => [entry.id, entry] as const));
  const guardsByInputId = new Map(status.leakageGuards.map((guard) => [guard.inputId, guard] as const));
  for (const guard of status.leakageGuards) {
    const input = entriesById.get(guard.inputId);
    if (input === undefined || input.role !== "input") {
      throw new Error(`Phase 8 leakage guard inputId must name an input entry: ${guard.inputId}`);
    }
    const inputPaths = new Set(input.sourceRefs.map((ref) => ref.path));
    for (const targetId of guard.targetIds) {
      const target = entriesById.get(targetId);
      if (target === undefined || target.role !== "target") {
        throw new Error(`Phase 8 leakage guard targetId must name a target entry: ${targetId}`);
      }
      if (target.partition.split !== "held-out") {
        throw new Error(`Phase 8 leakage guard target must be held-out: ${targetId}`);
      }
      if (!target.sourceRefs.some((ref) => inputPaths.has(ref.path))) {
        throw new Error(
          `Phase 8 leakage guard target does not share a source index with ${guard.inputId}: ${targetId}`,
        );
      }
    }
  }
  for (const input of entries.filter((entry) => entry.role === "input")) {
    const inputPaths = new Set(input.sourceRefs.map((ref) => ref.path));
    const sharedHeldOutIds = entries
      .filter((entry) => entry.role === "target" && entry.partition.split === "held-out")
      .filter((entry) => entry.sourceRefs.some((ref) => inputPaths.has(ref.path)))
      .map((entry) => entry.id)
      .sort();
    if (sharedHeldOutIds.length === 0) continue;
    const guard = guardsByInputId.get(input.id);
    if (guard === undefined) {
      throw new Error(
        `Phase 8 leakage guard is required for input ${input.id} and shared-source held-out targets`,
      );
    }
    const guardedIds = new Set(guard.targetIds);
    const uncoveredIds = sharedHeldOutIds.filter((id) => !guardedIds.has(id));
    if (uncoveredIds.length > 0) {
      throw new Error(
        `Phase 8 leakage guard for ${input.id} leaves shared-source held-out targets uncovered: ${uncoveredIds.join(",")}`,
      );
    }
  }
  return { entries, status, sha256: sha256Bytes(bytes), byteLength: bytes.byteLength };
}

/**
 * Accept only locators that identify source pages or concrete archive/data members. A DOI, title,
 * section heading, or bare extraction anchor is provenance context, but it cannot locate the
 * extracted claim in the source bytes. The table form covers the historical Libbrecht index, whose
 * extraction tables use explicit Paper/Page columns and compact paper-code/page rows.
 */
function hasExplicitSourceLocator(block: string): boolean {
  const prosePage = /\bpp?(?:\.\s*|\s+)\d+(?:\s*[-–]\s*\d+)?\b/u;
  const inlineConcreteMember = /`[A-Za-z0-9][A-Za-z0-9._/-]*\.(?:csv|dat|f90|json|jsonl|py|tsv|txt)`/iu;
  const linkedConcreteMember = /\]\([A-Za-z0-9][A-Za-z0-9._/-]*\.(?:csv|dat|f90|json|jsonl|py|tsv|txt)\)/iu;
  const inlineReadme = /`README`/u;
  const tableHasPageColumn = /\|\s*Page\s*\|/iu.test(block)
    && /(?:^|\n)\|[^\n]*\|\s*\d+(?:\s*[-–]\s*\d+)?\s*\|/u.test(block);
  const compactPaperPageRow = /(?:^|\n)\|[^\n]*\|\s*(?:APP|CM\d+|FACET|TAX\d+|TRIG)\s*\|\s*\d+[a-z]?(?:\s*[-–]\s*\d+[a-z]?)?\s*\|/iu;
  return prosePage.test(block)
    || inlineConcreteMember.test(block)
    || linkedConcreteMember.test(block)
    || inlineReadme.test(block)
    || tableHasPageColumn
    || compactPaperPageRow.test(block);
}

/** Resolve source references to unique extraction anchors and require source-byte locators. */
export function verifyPhase8SourceReferences(book: Phase8Book, repositoryRoot: string): void {
  const root = resolve(repositoryRoot);
  const sourceText = new Map<string, string>();
  for (const path of book.status.sourceIndexes) {
    const absolute = resolve(root, path);
    if (!absolute.startsWith(`${root}${sep}`)) throw new Error(`source index escapes repository: ${path}`);
    let text: string;
    try {
      text = readFileSync(absolute, "utf8");
    } catch {
      throw new Error(`source index is missing or unreadable: ${path}`);
    }
    sourceText.set(path, text);
  }
  for (const entry of book.entries) {
    const locatorBearingRefs = new Set<string>();
    for (const ref of entry.sourceRefs) {
      const text = sourceText.get(ref.path);
      if (text === undefined) throw new Error(`${entry.id} source index is absent from status: ${ref.path}`);
      const anchor = `<a id="${ref.extractId}"></a>`;
      const first = text.indexOf(anchor);
      if (first < 0) throw new Error(`${entry.id} extraction anchor is missing: ${ref.path}#${ref.extractId}`);
      if (text.indexOf(anchor, first + anchor.length) >= 0) {
        throw new Error(`${entry.id} extraction anchor is duplicated: ${ref.path}#${ref.extractId}`);
      }
      const nextAnchor = text.indexOf('<a id="', first + anchor.length);
      const block = text.slice(first + anchor.length, nextAnchor < 0 ? text.length : nextAnchor);
      if (hasExplicitSourceLocator(block)) locatorBearingRefs.add(sourceRefKey(ref));
    }
    if (locatorBearingRefs.size === 0) {
      throw new Error(`${entry.id} has no source reference with an explicit page/archive/data locator`);
    }
    for (const [index, witness] of entry.robustness.witnesses.entries()) {
      if (!locatorBearingRefs.has(sourceRefKey(witness.sourceRef))) {
        throw new Error(
          `${entry.id} robustness witness ${index} lacks an explicit page/archive/data locator: ${sourceRefKey(witness.sourceRef)}`,
        );
      }
    }
  }
}

/** Verify the historical Libbrecht-scoped dataset identity and fail-closed status named by the book. */
export function verifyPhase8ExtendedDataset(book: Phase8Book, repositoryRoot: string): void {
  const root = resolve(repositoryRoot);
  const absolute = resolve(root, book.status.extends.path);
  if (!absolute.startsWith(`${root}${sep}`)) throw new Error("extended dataset path escapes repository");
  const bytes = readFileSync(absolute);
  if (bytes.byteLength === 0 || sha256Bytes(bytes) !== book.status.extends.sha256) {
    throw new Error("extended dataset byte identity differs from the target-book registration");
  }
  const lines = bytes.toString("utf8").trimEnd().split("\n");
  const records = lines.map((line, index) => {
    try {
      return JSON.parse(line) as Record<string, unknown>;
    } catch {
      throw new Error(`extended dataset line ${index + 1} is not JSON`);
    }
  });
  const statusRecords = records.filter((record) => record.record_kind === "dataset-status");
  const entries = records.filter((record) => typeof record.id === "string" && record.record_kind === undefined);
  if (statusRecords.length !== 1 || records[records.length - 1] !== statusRecords[0]) {
    throw new Error("extended dataset requires one terminal status record");
  }
  const status = statusRecords[0];
  if (
    status?.passEligible !== false ||
    status?.entry_count !== entries.length ||
    entries.length !== book.status.extends.entryCount
  ) {
    throw new Error("extended dataset count or fail-closed status differs from the registration");
  }
}

export function verifyPhase8TargetBookFile(path: string, repositoryRoot: string): Phase8Book {
  const book = parsePhase8TargetBook(readFileSync(path));
  verifyPhase8SourceReferences(book, repositoryRoot);
  verifyPhase8ExtendedDataset(book, repositoryRoot);
  return book;
}
