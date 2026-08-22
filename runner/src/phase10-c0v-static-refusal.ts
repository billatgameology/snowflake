// Scoped Phase 10 C0V static reference-refusal derivation.
//
// This module performs contract/API evidence matching only. It contains no grid, solver,
// reference-field, witness, norm, or numerical-evaluation route.

import {
  parsePhase10C0VStaticProtocol,
  type Phase10C0VArtifactIdentity,
  type Phase10C0VStaticProtocol,
  type Phase10C0VStaticPublicApiFinding,
  type Phase10C0VStaticRefusalCandidate,
  type Phase10C0VStaticSourceAudit,
  type Phase10C0VZeroExecutionRecord,
} from "./phase10-c0v-contracts.ts";

interface ProtocolFinding extends Phase10C0VStaticPublicApiFinding {
  readonly ground: string;
}

interface ParsedStaticProtocol {
  readonly auditId: string;
  readonly reasonCode: string;
  readonly currentContractScope: string;
  readonly unavailableOperands: readonly string[];
  readonly forbiddenSubstitutes: readonly string[];
  readonly findings: readonly ProtocolFinding[];
  readonly routeIds: readonly string[];
  readonly requiredFindingIds: readonly string[];
  readonly requiredRouteIds: readonly string[];
  readonly universalImpossibilityClaim: false;
  readonly scopeRule: string;
}

export interface Phase10C0VStaticSourceAuditRequirements {
  readonly inspectedPaths: readonly string[];
  readonly findings: readonly Phase10C0VStaticPublicApiFinding[];
}

const ZERO_EXECUTION: Phase10C0VZeroExecutionRecord = Object.freeze({
  solverInvocations: 0,
  referenceInvocations: 0,
  productionInvocations: 0,
  witnessesProduced: 0,
  numericalEvaluations: 0,
  scientificProcessHours: 0,
});

function fail(detail: string): never {
  throw new Error(`Phase 10 C0V static refusal derivation refused: ${detail}`);
}

function object(value: unknown, label: string): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    fail(`${label} must be an object`);
  }
  return value as Record<string, unknown>;
}

function exactKeys(value: Record<string, unknown>, expected: readonly string[], label: string): void {
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  if (actual.length !== wanted.length || actual.some((entry, index) => entry !== wanted[index])) {
    fail(`${label} fields differ`);
  }
}

function string(value: unknown, label: string): string {
  if (typeof value !== "string" || value.length === 0 || value !== value.trim()) {
    fail(`${label} must be a nonempty trimmed string`);
  }
  return value;
}

function strings(value: unknown, label: string): readonly string[] {
  if (!Array.isArray(value) || value.length === 0) fail(`${label} must be a nonempty array`);
  return Object.freeze(value.map((entry, index) => string(entry, `${label}[${index}]`)));
}

function sortedUnique(values: readonly string[], label: string): void {
  for (let index = 1; index < values.length; index++) {
    if ((values[index - 1] as string) >= (values[index] as string)) {
      fail(`${label} must be sorted and unique`);
    }
  }
}

function finding(value: unknown, label: string): ProtocolFinding {
  const row = object(value, label);
  exactKeys(
    row,
    ["findingId", "operandIds", "visibility", "contractChangeRequired", "evidenceLocator", "ground"],
    label,
  );
  const operandIds = strings(row.operandIds, `${label}.operandIds`);
  sortedUnique(operandIds, `${label}.operandIds`);
  const visibility = string(row.visibility, `${label}.visibility`);
  if (!["public-accepted-state", "not-specified"].includes(visibility)) {
    fail(`${label}.visibility is not recognized`);
  }
  if (row.contractChangeRequired !== false) {
    fail(`${label}.contractChangeRequired must be false`);
  }
  return Object.freeze({
    findingId: string(row.findingId, `${label}.findingId`),
    operandIds,
    visibility: visibility as ProtocolFinding["visibility"],
    contractChangeRequired: false,
    evidenceLocator: string(row.evidenceLocator, `${label}.evidenceLocator`),
    ground: string(row.ground, `${label}.ground`),
  });
}

function parseProtocol(protocol: Phase10C0VStaticProtocol): ParsedStaticProtocol {
  const grounds = object(protocol.refusalGrounds, "static protocol.refusalGrounds");
  exactKeys(
    grounds,
    ["auditId", "reasonCode", "currentContractScope", "unavailableOperands", "forbiddenSubstitutes", "findings"],
    "static protocol.refusalGrounds",
  );
  const unavailableOperands = strings(
    grounds.unavailableOperands,
    "static protocol.refusalGrounds.unavailableOperands",
  );
  sortedUnique(unavailableOperands, "static protocol.refusalGrounds.unavailableOperands");
  const forbiddenSubstitutes = strings(
    grounds.forbiddenSubstitutes,
    "static protocol.refusalGrounds.forbiddenSubstitutes",
  );
  sortedUnique(forbiddenSubstitutes, "static protocol.refusalGrounds.forbiddenSubstitutes");
  if (!Array.isArray(grounds.findings) || grounds.findings.length !== 2) {
    fail("static protocol.refusalGrounds.findings must contain the exact two scoped findings");
  }
  const findings = Object.freeze(grounds.findings.map((entry, index) =>
    finding(entry, `static protocol.refusalGrounds.findings[${index}]`)));
  const findingIds = findings.map((entry) => entry.findingId);
  if (new Set(findingIds).size !== findingIds.length) fail("static protocol finding IDs must be unique");

  if (!Array.isArray(protocol.attemptedRoutes) || protocol.attemptedRoutes.length !== 2) {
    fail("static protocol.attemptedRoutes must contain the exact two scoped routes");
  }
  const routeIds = Object.freeze(protocol.attemptedRoutes.map((entry, index) => {
    const row = object(entry, `static protocol.attemptedRoutes[${index}]`);
    exactKeys(row, ["routeId", "route", "disposition", "reason"], `static protocol.attemptedRoutes[${index}]`);
    string(row.route, `static protocol.attemptedRoutes[${index}].route`);
    string(row.disposition, `static protocol.attemptedRoutes[${index}].disposition`);
    string(row.reason, `static protocol.attemptedRoutes[${index}].reason`);
    return string(row.routeId, `static protocol.attemptedRoutes[${index}].routeId`);
  }));
  if (new Set(routeIds).size !== routeIds.length) fail("static attempted-route IDs must be unique");

  const notApplicable = object(
    protocol.notApplicableObligations,
    "static protocol.notApplicableObligations",
  );
  const notApplicableFields = [
    "gridRoster", "normThresholds", "referenceValues", "solverCalls", "witnesses",
    "numericalEvaluations",
  ] as const;
  exactKeys(notApplicable, notApplicableFields, "static protocol.notApplicableObligations");
  for (const field of notApplicableFields) {
    if (notApplicable[field] !== "not-instantiated") {
      fail(`static protocol.notApplicableObligations.${field} must be not-instantiated`);
    }
  }

  const targeted = object(protocol.targetedCheck, "static protocol.targetedCheck");
  exactKeys(
    targeted,
    [
      "method", "requiredFindingIds", "requiredRouteIds", "zeroExecutionRequired", "scopeRule",
      "universalImpossibilityClaim",
    ],
    "static protocol.targetedCheck",
  );
  string(targeted.method, "static protocol.targetedCheck.method");
  const requiredFindingIds = strings(
    targeted.requiredFindingIds,
    "static protocol.targetedCheck.requiredFindingIds",
  );
  const requiredRouteIds = strings(
    targeted.requiredRouteIds,
    "static protocol.targetedCheck.requiredRouteIds",
  );
  if (targeted.zeroExecutionRequired !== true) fail("static targeted check must require zero execution");
  if (targeted.universalImpossibilityClaim !== false) {
    fail("static targeted check must explicitly deny a universal impossibility claim");
  }
  if (!sameSet(requiredFindingIds, findingIds)) fail("static required finding IDs differ");
  if (!sameSet(requiredRouteIds, routeIds)) fail("static required route IDs differ");
  return Object.freeze({
    auditId: string(grounds.auditId, "static protocol.refusalGrounds.auditId"),
    reasonCode: string(grounds.reasonCode, "static protocol.refusalGrounds.reasonCode"),
    currentContractScope: string(
      grounds.currentContractScope,
      "static protocol.refusalGrounds.currentContractScope",
    ),
    unavailableOperands,
    forbiddenSubstitutes,
    findings,
    routeIds,
    requiredFindingIds,
    requiredRouteIds,
    universalImpossibilityClaim: false,
    scopeRule: string(targeted.scopeRule, "static protocol.targetedCheck.scopeRule"),
  });
}

function sameSet(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((entry) => right.includes(entry));
}

function pathFromLocator(locator: string): string {
  const separator = locator.indexOf("#");
  if (separator <= 0 || separator === locator.length - 1) {
    fail(`static evidence locator must be <repository-path>#<locator>: ${locator}`);
  }
  const path = locator.slice(0, separator);
  if (
    path.includes("\\") || path.startsWith("/") || path.endsWith("/") ||
    path.split("/").some((part) => part === "" || part === "." || part === "..")
  ) fail(`static evidence locator path is not normalized: ${path}`);
  return path;
}

function zeroExecution(record: Phase10C0VZeroExecutionRecord): boolean {
  return Object.keys(ZERO_EXECUTION).every((key) =>
    record[key as keyof Phase10C0VZeroExecutionRecord] === 0);
}

function sameFinding(
  actual: Phase10C0VStaticPublicApiFinding,
  expected: ProtocolFinding,
): boolean {
  return actual.findingId === expected.findingId &&
    actual.visibility === expected.visibility &&
    actual.contractChangeRequired === expected.contractChangeRequired &&
    actual.evidenceLocator === expected.evidenceLocator &&
    actual.operandIds.length === expected.operandIds.length &&
    actual.operandIds.every((entry, index) => entry === expected.operandIds[index]);
}

function validateIdentity(identity: Phase10C0VArtifactIdentity, label: string): void {
  if (!Number.isSafeInteger(identity.byteLength) || identity.byteLength <= 0) {
    fail(`${label}.byteLength must be a positive safe integer`);
  }
  if (!/^[0-9a-f]{64}$/u.test(identity.sha256)) fail(`${label}.sha256 must be lowercase SHA-256`);
  if (identity.path !== pathFromLocator(`${identity.path}#identity`)) {
    fail(`${label}.path must be normalized`);
  }
}

/**
 * Return the exact paths and protocol-authored findings a neutral wrapper must reopen/hash.
 * This projection does not read source bytes or interpret any scientific value.
 */
export function phase10C0VStaticSourceAuditRequirements(
  protocolValue: Phase10C0VStaticProtocol,
): Phase10C0VStaticSourceAuditRequirements {
  const protocol = parsePhase10C0VStaticProtocol(protocolValue);
  const parsed = parseProtocol(protocol);
  const inspectedPaths = Object.freeze(
    [...new Set(parsed.findings.map((entry) => pathFromLocator(entry.evidenceLocator)))].sort(),
  );
  const findings = Object.freeze(parsed.findings.map(({ ground: _ground, ...entry }) =>
    Object.freeze(entry)));
  return Object.freeze({ inspectedPaths, findings });
}

/** Construct a zero-execution source audit from wrapper-supplied identities only. */
export function constructPhase10C0VStaticSourceAudit(
  protocolValue: Phase10C0VStaticProtocol,
  inspectedArtifacts: readonly Phase10C0VArtifactIdentity[],
): Phase10C0VStaticSourceAudit {
  const protocol = parsePhase10C0VStaticProtocol(protocolValue);
  const parsed = parseProtocol(protocol);
  const requirements = phase10C0VStaticSourceAuditRequirements(protocolValue);
  const paths = inspectedArtifacts.map((entry, index) => {
    validateIdentity(entry, `static source audit inspectedArtifacts[${index}]`);
    return entry.path;
  });
  if (
    paths.length !== requirements.inspectedPaths.length ||
    [...paths].sort().some((path, index) => path !== requirements.inspectedPaths[index])
  ) fail("static source audit artifact paths differ from protocol evidence locators");
  return Object.freeze({
    auditId: parsed.auditId,
    currentContractOnly: true,
    inspectedArtifacts: Object.freeze([...inspectedArtifacts]),
    publicApiFindings: requirements.findings,
    executionRecord: ZERO_EXECUTION,
  });
}

function validateSourceAudit(parsed: ParsedStaticProtocol, sourceAudit: Phase10C0VStaticSourceAudit): void {
  if (sourceAudit.auditId !== parsed.auditId) fail("static source audit ID differs from protocol");
  if (sourceAudit.currentContractOnly !== true) fail("static source audit must be current-contract-only");
  if (!zeroExecution(sourceAudit.executionRecord)) fail("static source audit execution record is nonzero");
  const requiredPaths = [...new Set(parsed.findings.map((entry) => pathFromLocator(entry.evidenceLocator)))].sort();
  const actualPaths = sourceAudit.inspectedArtifacts.map((entry, index) => {
    validateIdentity(entry, `static source audit.inspectedArtifacts[${index}]`);
    return entry.path;
  }).sort();
  if (actualPaths.length !== requiredPaths.length || actualPaths.some((path, index) => path !== requiredPaths[index])) {
    fail("static source audit inspected paths differ from protocol locators");
  }
  if (sourceAudit.publicApiFindings.length !== parsed.findings.length) {
    fail("static source audit finding cardinality differs");
  }
  for (const expected of parsed.findings) {
    const actual = sourceAudit.publicApiFindings.find((entry) => entry.findingId === expected.findingId);
    if (actual === undefined || !sameFinding(actual, expected)) {
      fail(`static source audit finding differs: ${expected.findingId}`);
    }
  }
}

/** Produce the scoped, preimplementation static refusal without executing a numerical route. */
export function derivePhase10C0VStaticRefusal(
  protocolValue: Phase10C0VStaticProtocol,
  sourceAudit: Phase10C0VStaticSourceAudit,
): Phase10C0VStaticRefusalCandidate {
  const protocol = parsePhase10C0VStaticProtocol(protocolValue);
  const parsed = parseProtocol(protocol);
  validateSourceAudit(parsed, sourceAudit);
  const contractEvidence = {
    auditId: sourceAudit.auditId,
    currentContractOnly: sourceAudit.currentContractOnly,
    inspectedArtifacts: sourceAudit.inspectedArtifacts,
    publicApiFindings: sourceAudit.publicApiFindings,
    executionRecord: sourceAudit.executionRecord,
  } as unknown as Phase10C0VStaticRefusalCandidate["contractEvidence"];
  return Object.freeze({
    schema: "phase10-c0v-static-refusal-candidate-v1",
    protocolId: protocol.protocolId,
    reasonCode: parsed.reasonCode,
    currentContractScope: parsed.currentContractScope,
    unavailableOperands: parsed.unavailableOperands,
    attemptedRoutes: protocol.attemptedRoutes,
    forbiddenSubstitutes: parsed.forbiddenSubstitutes,
    contractEvidence,
    executionRecord: sourceAudit.executionRecord,
    downstreamEffect: protocol.terminalSemantics,
    claimBoundary: protocol.claimBoundary,
  });
}

/** Stable candidate-oriented alias used by the S5b neutral wrapper. */
export const derivePhase10C0VStaticRefusalCandidate = derivePhase10C0VStaticRefusal;
