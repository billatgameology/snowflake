// Independent validity checker for the scoped Phase 10 C0V static refusal.
//
// This module does not import the refusal generator and has no numerical evaluation path. It
// independently matches current-contract findings, attempted routes, scope, and all zero counters.

import { createHash } from "node:crypto";
import ts from "typescript";
import {
  parsePhase10C0VStaticProtocol,
  type Phase10C0VArtifactIdentity,
  type Phase10C0VStaticProtocol,
  type Phase10C0VStaticPublicApiFinding,
  type Phase10C0VStaticRefusalCandidate,
  type Phase10C0VStaticRefusalCheck,
  type Phase10C0VStaticSourceAudit,
  type Phase10C0VZeroExecutionRecord,
} from "./phase10-c0v-contracts.ts";

/** Frozen source input reopened by the neutral checker wrapper. */
export interface Phase10C0VStaticSourceArtifactInput {
  readonly identity: Phase10C0VArtifactIdentity;
  readonly bytes: Uint8Array;
}

interface ExpectedFinding extends Phase10C0VStaticPublicApiFinding {
  readonly ground: string;
}

interface StaticExpectation {
  readonly auditId: string;
  readonly reasonCode: string;
  readonly currentContractScope: string;
  readonly unavailableOperands: readonly string[];
  readonly forbiddenSubstitutes: readonly string[];
  readonly findings: readonly ExpectedFinding[];
  readonly routeIds: readonly string[];
  readonly requiredFindingIds: readonly string[];
  readonly requiredRouteIds: readonly string[];
  readonly scopeRule: string;
  readonly universalImpossibilityClaim: false;
}

interface ParsedSourceArtifact {
  readonly identity: Phase10C0VArtifactIdentity;
  readonly text: string;
  readonly sourceFile?: ts.SourceFile;
}

const STATIC_FINDING_IDS = Object.freeze({
  publicOneSweepReconstruction: "public-one-sweep-reconstruction-available",
  missingIndependentOrder: "independent-static-spatial-reference-order-not-specified",
} as const);

const ZERO_FIELDS = Object.freeze([
  "solverInvocations",
  "referenceInvocations",
  "productionInvocations",
  "witnessesProduced",
  "numericalEvaluations",
  "scientificProcessHours",
] as const);

function fail(detail: string): never {
  throw new Error(`Phase 10 C0V static refusal check refused: ${detail}`);
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

function text(value: unknown, label: string): string {
  if (typeof value !== "string" || value.length === 0 || value !== value.trim()) {
    fail(`${label} must be a nonempty trimmed string`);
  }
  return value;
}

function textArray(value: unknown, label: string): readonly string[] {
  if (!Array.isArray(value) || value.length === 0) fail(`${label} must be a nonempty array`);
  return Object.freeze(value.map((entry, index) => text(entry, `${label}[${index}]`)));
}

function deepEqual(left: unknown, right: unknown): boolean {
  if (Object.is(left, right)) return true;
  if (Array.isArray(left) || Array.isArray(right)) {
    return Array.isArray(left) && Array.isArray(right) && left.length === right.length &&
      left.every((entry, index) => deepEqual(entry, right[index]));
  }
  if (left !== null && right !== null && typeof left === "object" && typeof right === "object") {
    const leftRecord = left as Record<string, unknown>;
    const rightRecord = right as Record<string, unknown>;
    const leftKeys = Object.keys(leftRecord).sort();
    const rightKeys = Object.keys(rightRecord).sort();
    return leftKeys.length === rightKeys.length && leftKeys.every((key, index) =>
      key === rightKeys[index] && deepEqual(leftRecord[key], rightRecord[key]));
  }
  return false;
}

function sameSet(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((entry) => right.includes(entry));
}

function expectedFinding(value: unknown, label: string): ExpectedFinding {
  const row = object(value, label);
  exactKeys(
    row,
    ["findingId", "operandIds", "visibility", "contractChangeRequired", "evidenceLocator", "ground"],
    label,
  );
  const visibility = text(row.visibility, `${label}.visibility`);
  if (!["public-accepted-state", "not-specified"].includes(visibility)) {
    fail(`${label}.visibility is unrecognized`);
  }
  if (row.contractChangeRequired !== false) {
    fail(`${label}.contractChangeRequired must be false`);
  }
  return Object.freeze({
    findingId: text(row.findingId, `${label}.findingId`),
    operandIds: textArray(row.operandIds, `${label}.operandIds`),
    visibility: visibility as ExpectedFinding["visibility"],
    contractChangeRequired: false,
    evidenceLocator: text(row.evidenceLocator, `${label}.evidenceLocator`),
    ground: text(row.ground, `${label}.ground`),
  });
}

function expectation(protocol: Phase10C0VStaticProtocol): StaticExpectation {
  const grounds = object(protocol.refusalGrounds, "static protocol.refusalGrounds");
  exactKeys(
    grounds,
    ["auditId", "reasonCode", "currentContractScope", "unavailableOperands", "forbiddenSubstitutes", "findings"],
    "static protocol.refusalGrounds",
  );
  if (!Array.isArray(grounds.findings) || grounds.findings.length !== 2) {
    fail("static protocol must register exactly two narrowed source findings");
  }
  const findings = Object.freeze(grounds.findings.map((entry, index) =>
    expectedFinding(entry, `static protocol finding[${index}]`)));
  const findingIds = findings.map((entry) => entry.findingId);
  if (!sameSet(findingIds, Object.values(STATIC_FINDING_IDS))) {
    fail("static protocol finding IDs differ from the narrowed source audit");
  }
  if (!Array.isArray(protocol.attemptedRoutes) || protocol.attemptedRoutes.length === 0) {
    fail("static protocol attempted routes must be nonempty");
  }
  const routeIds = Object.freeze(protocol.attemptedRoutes.map((entry, index) => {
    const row = object(entry, `static protocol route[${index}]`);
    exactKeys(row, ["routeId", "route", "disposition", "reason"], `static protocol route[${index}]`);
    text(row.route, `static protocol route[${index}].route`);
    text(row.disposition, `static protocol route[${index}].disposition`);
    text(row.reason, `static protocol route[${index}].reason`);
    return text(row.routeId, `static protocol route[${index}].routeId`);
  }));
  const targeted = object(protocol.targetedCheck, "static protocol.targetedCheck");
  exactKeys(
    targeted,
    [
      "method", "requiredFindingIds", "requiredRouteIds", "zeroExecutionRequired", "scopeRule",
      "universalImpossibilityClaim",
    ],
    "static protocol.targetedCheck",
  );
  if (targeted.zeroExecutionRequired !== true || targeted.universalImpossibilityClaim !== false) {
    fail("static protocol targeted check does not bind zero execution and scoped refusal");
  }
  const requiredFindingIds = textArray(targeted.requiredFindingIds, "requiredFindingIds");
  const requiredRouteIds = textArray(targeted.requiredRouteIds, "requiredRouteIds");
  if (!sameSet(requiredFindingIds, findings.map((entry) => entry.findingId))) {
    fail("required static finding IDs differ");
  }
  if (!sameSet(requiredRouteIds, routeIds)) fail("required static route IDs differ");
  const notApplicable = object(protocol.notApplicableObligations, "static protocol.notApplicableObligations");
  const notApplicableFields = [
    "gridRoster", "normThresholds", "referenceValues", "solverCalls", "witnesses",
    "numericalEvaluations",
  ] as const;
  exactKeys(notApplicable, notApplicableFields, "static protocol.notApplicableObligations");
  for (const field of notApplicableFields) {
    if (notApplicable[field] !== "not-instantiated") {
      fail(`static refusal improperly instantiates ${field}`);
    }
  }
  return Object.freeze({
    auditId: text(grounds.auditId, "static auditId"),
    reasonCode: text(grounds.reasonCode, "static reasonCode"),
    currentContractScope: text(grounds.currentContractScope, "static currentContractScope"),
    unavailableOperands: textArray(grounds.unavailableOperands, "static unavailableOperands"),
    forbiddenSubstitutes: textArray(grounds.forbiddenSubstitutes, "static forbiddenSubstitutes"),
    findings,
    routeIds,
    requiredFindingIds,
    requiredRouteIds,
    scopeRule: text(targeted.scopeRule, "static scopeRule"),
    universalImpossibilityClaim: false,
  });
}

function locatorPath(locator: string): string | null {
  const separator = locator.indexOf("#");
  return separator > 0 && separator < locator.length - 1 ? locator.slice(0, separator) : null;
}

function locatorFragment(locator: string): string | null {
  const separator = locator.indexOf("#");
  return separator > 0 && separator < locator.length - 1 ? locator.slice(separator + 1) : null;
}

function zeroRecord(record: Phase10C0VZeroExecutionRecord): boolean {
  return ZERO_FIELDS.every((field) => record[field] === 0);
}

function validIdentity(identity: Phase10C0VArtifactIdentity): boolean {
  return Number.isSafeInteger(identity.byteLength) && identity.byteLength > 0 &&
    /^[0-9a-f]{64}$/u.test(identity.sha256) &&
    !identity.path.includes("\\") && !identity.path.startsWith("/") &&
    !identity.path.split("/").some((part) => part === "" || part === "." || part === "..");
}

function sameIdentity(
  left: Phase10C0VArtifactIdentity,
  right: Phase10C0VArtifactIdentity,
): boolean {
  return left.path === right.path && left.byteLength === right.byteLength &&
    left.sha256 === right.sha256;
}

function parseSourceArtifacts(
  expected: StaticExpectation,
  sourceAudit: Phase10C0VStaticSourceAudit,
  inputs: readonly Phase10C0VStaticSourceArtifactInput[],
): { readonly artifacts: ReadonlyMap<string, ParsedSourceArtifact>; readonly errors: readonly string[] } {
  const errors: string[] = [];
  const requiredPaths = [...new Set(expected.findings.map((entry) => locatorPath(entry.evidenceLocator)))];
  if (requiredPaths.some((path) => path === null)) {
    return Object.freeze({ artifacts: new Map(), errors: Object.freeze(["protocol evidence locator is malformed"]) });
  }
  const normalizedRequired = requiredPaths.filter((path): path is string => path !== null).sort();
  const auditByPath = new Map<string, Phase10C0VArtifactIdentity>();
  for (const identity of sourceAudit.inspectedArtifacts) {
    if (auditByPath.has(identity.path)) errors.push(`source audit repeats artifact path: ${identity.path}`);
    auditByPath.set(identity.path, identity);
  }
  const artifacts = new Map<string, ParsedSourceArtifact>();
  for (const [index, input] of inputs.entries()) {
    const label = `source artifact input[${index}]`;
    if (!validIdentity(input.identity)) {
      errors.push(`${label} identity is invalid`);
      continue;
    }
    if (artifacts.has(input.identity.path)) {
      errors.push(`source artifact inputs repeat path: ${input.identity.path}`);
      continue;
    }
    const auditedIdentity = auditByPath.get(input.identity.path);
    if (auditedIdentity === undefined || !sameIdentity(input.identity, auditedIdentity)) {
      errors.push(`${label} identity differs from source audit`);
    }
    if (!(input.bytes instanceof Uint8Array)) {
      errors.push(`${label}.bytes must be Uint8Array`);
      continue;
    }
    const digest = createHash("sha256").update(input.bytes).digest("hex");
    if (input.bytes.byteLength !== input.identity.byteLength || digest !== input.identity.sha256) {
      errors.push(`${label} bytes differ from identity`);
      continue;
    }
    let sourceText: string;
    try {
      sourceText = new TextDecoder("utf-8", { fatal: true }).decode(input.bytes);
    } catch {
      errors.push(`${label} is not valid UTF-8`);
      continue;
    }
    let sourceFile: ts.SourceFile | undefined;
    if (/\.(?:cts|mts|tsx?)$/u.test(input.identity.path)) {
      sourceFile = ts.createSourceFile(
        input.identity.path,
        sourceText,
        ts.ScriptTarget.ESNext,
        true,
        input.identity.path.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
      );
      const diagnostics = (
        sourceFile as ts.SourceFile & { readonly parseDiagnostics?: readonly ts.Diagnostic[] }
      ).parseDiagnostics ?? [];
      if (diagnostics.length > 0) errors.push(`${label} has TypeScript parse diagnostics`);
    }
    artifacts.set(input.identity.path, Object.freeze({
      identity: input.identity,
      text: sourceText,
      ...(sourceFile === undefined ? {} : { sourceFile }),
    }));
  }
  const actualPaths = [...artifacts.keys()].sort();
  if (
    actualPaths.length !== normalizedRequired.length ||
    actualPaths.some((path, index) => path !== normalizedRequired[index])
  ) errors.push("source artifact input paths differ from protocol locator paths");
  return Object.freeze({ artifacts, errors: Object.freeze(errors) });
}

function hasModifier(node: ts.Node, kind: ts.SyntaxKind): boolean {
  return ts.canHaveModifiers(node) &&
    ts.getModifiers(node)?.some((modifier) => modifier.kind === kind) === true;
}

function nameText(name: ts.PropertyName | ts.BindingName | undefined): string | null {
  if (name === undefined) return null;
  if (ts.isIdentifier(name) || ts.isPrivateIdentifier(name) || ts.isStringLiteralLike(name)) {
    return name.text;
  }
  return null;
}

function exportedLocalNames(source: ts.SourceFile): ReadonlySet<string> {
  const names = new Set<string>();
  for (const statement of source.statements) {
    if (!ts.isExportDeclaration(statement) || statement.exportClause === undefined ||
      !ts.isNamedExports(statement.exportClause)) continue;
    for (const specifier of statement.exportClause.elements) {
      names.add((specifier.propertyName ?? specifier.name).text);
    }
  }
  return names;
}

function declarationIsExported(
  declaration: ts.DeclarationStatement,
  exportedNames: ReadonlySet<string>,
): boolean {
  if (hasModifier(declaration, ts.SyntaxKind.ExportKeyword)) return true;
  const name = "name" in declaration && declaration.name !== undefined && ts.isIdentifier(declaration.name)
    ? declaration.name.text
    : null;
  return name !== null && exportedNames.has(name);
}

function visitOwnFunctionBody(
  body: ts.ConciseBody,
  visitor: (node: ts.Node) => void,
): void {
  const visit = (node: ts.Node): void => {
    if (node !== body && ts.isFunctionLike(node)) return;
    visitor(node);
    ts.forEachChild(node, visit);
  };
  visit(body);
}

function classIsExported(
  declaration: ts.ClassDeclaration,
  exportedNames: ReadonlySet<string>,
): boolean {
  return declarationIsExported(declaration, exportedNames);
}


function referencesIdentifier(node: ts.Node, identifier: string): boolean {
  let found = false;
  const visit = (current: ts.Node): void => {
    if (found) return;
    if (ts.isIdentifier(current) && current.text === identifier) {
      found = true;
      return;
    }
    ts.forEachChild(current, visit);
  };
  visit(node);
  return found;
}

function classMember(
  declaration: ts.ClassDeclaration,
  memberName: string,
): ts.ClassElement | undefined {
  return declaration.members.find((member) =>
    "name" in member && nameText(member.name as ts.PropertyName | undefined) === memberName);
}

function publicClassMember(member: ts.ClassElement | undefined): boolean {
  return member !== undefined && !hasModifier(member, ts.SyntaxKind.PrivateKeyword) &&
    !hasModifier(member, ts.SyntaxKind.ProtectedKeyword) &&
    !("name" in member && member.name !== undefined &&
      ts.isPrivateIdentifier(member.name as ts.PropertyName));
}

function hasStringLiteral(node: ts.Node, value: string): boolean {
  let found = false;
  const visit = (current: ts.Node): void => {
    if (found) return;
    if (ts.isStringLiteralLike(current) && current.text === value) {
      found = true;
      return;
    }
    ts.forEachChild(current, visit);
  };
  visit(node);
  return found;
}

function parentConditionReferences(node: ts.Node, identifier: string, boundary: ts.Node): boolean {
  let current: ts.Node | undefined = node.parent;
  while (current !== undefined && current !== boundary) {
    if (ts.isIfStatement(current) && referencesIdentifier(current.expression, identifier)) return true;
    current = current.parent;
  }
  return false;
}

function oneSweepReconstructionErrors(source: ts.SourceFile): readonly string[] {
  const errors: string[] = [];
  const exportedNames = exportedLocalNames(source);
  const options = source.statements.find((statement): statement is ts.InterfaceDeclaration =>
    ts.isInterfaceDeclaration(statement) && statement.name.text === "LKSolverOptions" &&
    declarationIsExported(statement, exportedNames));
  if (options === undefined || !options.members.some((member) => nameText(member.name) === "relaxMaxSweeps")) {
    errors.push("exported LKSolverOptions does not expose relaxMaxSweeps");
  }

  const solver = source.statements.find((statement): statement is ts.ClassDeclaration =>
    ts.isClassDeclaration(statement) && statement.name?.text === "LKSolver" &&
    classIsExported(statement, exportedNames));
  if (solver === undefined) {
    errors.push("frozen solver source does not export LKSolver");
    return Object.freeze(errors);
  }
  if (!publicClassMember(classMember(solver, "sigma"))) {
    errors.push("exported LKSolver does not expose public sigma state");
  }
  for (const field of ["dims", "a", "wall", "dirichletCells"] as const) {
    if (!publicClassMember(classMember(solver, field))) {
      errors.push(`exported LKSolver does not expose public ${field} topology state`);
    }
  }
  for (const method of ["boundaryCells", "neighborCounts"] as const) {
    const member = classMember(solver, method);
    if (member === undefined || !publicClassMember(member) || !ts.isMethodDeclaration(member)) {
      errors.push(`exported LKSolver does not expose public ${method}`);
    }
  }
  const boundaryState = classMember(solver, "boundaryState");
  if (boundaryState === undefined || !publicClassMember(boundaryState) ||
    !ts.isMethodDeclaration(boundaryState) || boundaryState.body === undefined) {
    errors.push("exported LKSolver does not expose public boundaryState");
  } else {
    const requiredKeys = [
      "sigmaOpp", "sigmaBoundary", "alphaHKBoundary", "robinGeometry", "fillGeometry",
    ] as const;
    const returnTypeKeys = boundaryState.type !== undefined && ts.isTypeLiteralNode(boundaryState.type)
      ? new Set(boundaryState.type.members.map((member) => nameText(member.name)))
      : new Set<string | null>();
    const returnedKeys = new Set<string>();
    visitOwnFunctionBody(boundaryState.body, (node) => {
      if (!ts.isReturnStatement(node) || node.expression === undefined ||
        !ts.isObjectLiteralExpression(node.expression)) return;
      for (const property of node.expression.properties) {
        const key = nameText(property.name);
        if (key !== null) returnedKeys.add(key);
      }
    });
    for (const key of requiredKeys) {
      if (!returnTypeKeys.has(key) || !returnedKeys.has(key)) {
        errors.push(`public boundaryState does not return ${key}`);
      }
    }
  }
  const constructor = solver.members.find((member): member is ts.ConstructorDeclaration =>
    ts.isConstructorDeclaration(member) && member.body !== undefined);
  if (constructor?.body === undefined || !referencesIdentifier(constructor, "relaxMaxSweeps")) {
    errors.push("LKSolver constructor does not bind relaxMaxSweeps");
  }

  const relaxField = classMember(solver, "relaxField");
  if (relaxField === undefined || !publicClassMember(relaxField) ||
    !ts.isMethodDeclaration(relaxField) || relaxField.body === undefined) {
    errors.push("exported LKSolver does not expose public relaxField");
  } else {
    const body = relaxField.body;
    let admitsBoundaryAndIncomplete = false;
    let oneSweepBound = false;
    let sourceFromSigma = false;
    let sweepPosition = Number.POSITIVE_INFINITY;
    let swapPosition = Number.POSITIVE_INFINITY;
    let swapTemporary: string | undefined;
    let temporaryCapturePosition = Number.POSITIVE_INFINITY;
    let sourceTakesDestinationPosition = Number.POSITIVE_INFINITY;
    let installPosition = Number.POSITIVE_INFINITY;
    let returnsConverged = false;
    let recordsIncomplete = false;
    const convergedReportBindings = new Set<string>();
    visitOwnFunctionBody(body, (node) => {
      if (ts.isIfStatement(node) && hasStringLiteral(node.expression, "boundary") &&
        hasStringLiteral(node.expression, "incomplete")) admitsBoundaryAndIncomplete = true;
      if (
        (
          (ts.isForStatement(node) && node.condition !== undefined &&
            referencesIdentifier(node.condition, "relaxMaxSweeps")) ||
          (ts.isWhileStatement(node) && referencesIdentifier(node.expression, "relaxMaxSweeps")) ||
          (ts.isDoStatement(node) && referencesIdentifier(node.expression, "relaxMaxSweeps"))
        )
      ) oneSweepBound = true;
      if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.name.text === "src" &&
        node.initializer?.getText(source) === "this.sigma") sourceFromSigma = true;
      if (
        ts.isCallExpression(node) && node.expression.getText(source) === "this.sweep" &&
        node.arguments.length >= 2 && referencesIdentifier(node.arguments[0]!, "src") &&
        referencesIdentifier(node.arguments[1]!, "dst")
      ) sweepPosition = Math.min(sweepPosition, node.getStart(source));
      if (
        ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) &&
        node.initializer !== undefined && ts.isIdentifier(node.initializer) &&
        node.initializer.text === "src" && node.getStart(source) > sweepPosition
      ) {
        swapTemporary = node.name.text;
        temporaryCapturePosition = Math.min(temporaryCapturePosition, node.getStart(source));
      }
      if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
        node.getStart(source) > sweepPosition) {
        const left = node.left.getText(source).replaceAll(/\s/gu, "");
        const right = node.right.getText(source).replaceAll(/\s/gu, "");
        if (left === "[src,dst]" && right === "[dst,src]") {
          swapPosition = Math.min(swapPosition, node.getStart(source));
        }
        if (left === "src" && right === "dst" && node.getStart(source) > temporaryCapturePosition) {
          sourceTakesDestinationPosition = Math.min(sourceTakesDestinationPosition, node.getStart(source));
        }
        if (
          left === "dst" && swapTemporary !== undefined && right === swapTemporary &&
          node.getStart(source) > sourceTakesDestinationPosition
        ) swapPosition = Math.min(swapPosition, node.getStart(source));
        if (
          node.left.getText(source).startsWith("this.") && hasStringLiteral(node.right, "incomplete") &&
          (referencesIdentifier(node.right, "converged") || parentConditionReferences(node, "converged", body))
        ) recordsIncomplete = true;
      }
      if (
        ts.isCallExpression(node) && node.getStart(source) > sweepPosition &&
        ts.isPropertyAccessExpression(node.expression) && node.expression.name.text === "set" &&
        node.expression.expression.getText(source) === "this.sigma" &&
        (
          node.arguments.some((argument) => referencesIdentifier(argument, "dst")) ||
          (Number.isFinite(swapPosition) && node.getStart(source) > swapPosition &&
            node.arguments.some((argument) => referencesIdentifier(argument, "src")))
        )
      ) installPosition = Math.min(installPosition, node.getStart(source));
      if (
        ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) &&
        node.initializer !== undefined && ts.isObjectLiteralExpression(node.initializer) &&
        node.initializer.properties.some((property) => nameText(property.name) === "converged")
      ) convergedReportBindings.add(node.name.text);
      if (ts.isReturnStatement(node) && node.expression !== undefined &&
        (
          referencesIdentifier(node.expression, "converged") ||
          (ts.isIdentifier(node.expression) && convergedReportBindings.has(node.expression.text))
        )) returnsConverged = true;
    });
    if (!admitsBoundaryAndIncomplete) errors.push("relaxField entry guard does not admit boundary and incomplete states");
    if (!oneSweepBound) errors.push("relaxField loop does not read this.relaxMaxSweeps");
    if (!sourceFromSigma) errors.push("relaxField does not initialize src from public sigma state");
    if (!Number.isFinite(sweepPosition)) errors.push("relaxField does not invoke this.sweep(src, dst)");
    if (!Number.isFinite(installPosition)) errors.push("relaxField does not install the completed sweep into this.sigma");
    if (!returnsConverged) errors.push("relaxField does not return public converged status");
    if (!recordsIncomplete) errors.push("relaxField does not retain nonconverged state as incomplete");
  }

  const sweep = classMember(solver, "sweep");
  const sweepAggregate = classMember(solver, "sweepAggregate");
  if (sweep === undefined || !ts.isMethodDeclaration(sweep) || sweep.body === undefined ||
    sweepAggregate === undefined || !ts.isMethodDeclaration(sweepAggregate) ||
    !hasModifier(sweepAggregate, ts.SyntaxKind.PrivateKeyword)) {
    errors.push("LKSolver does not retain a private sweepAggregate behind sweep dispatch");
  } else {
    let aggregateDispatch = false;
    visitOwnFunctionBody(sweep.body, (node) => {
      if (ts.isCallExpression(node) && node.expression.getText(source) === "this.sweepAggregate" &&
        /aggregate/iu.test(sweep.body?.getText(source) ?? "")) aggregateDispatch = true;
    });
    if (!aggregateDispatch) errors.push("LKSolver sweep does not dispatch aggregate policies to sweepAggregate");
  }
  return Object.freeze(errors);
}

function hasStructuredIndependentSpatialContract(textValue: string): boolean {
  const meaningfulValue = String.raw`(?!(?:not[- ]specified|none|absent)\b)\S.*`;
  const patterns = [
    new RegExp(String.raw`^\s*(?:[-*]\s*)?["'\x60]?(?:independentContinuumFieldReference|independent continuum field reference)["'\x60]?\s*[:=]\s*${meaningfulValue}$`, "imu"),
    new RegExp(String.raw`^\s*(?:[-*]\s*)?["'\x60]?(?:independentContinuumBoundaryFluxReference|independent continuum boundary[- ]flux reference)["'\x60]?\s*[:=]\s*${meaningfulValue}$`, "imu"),
    new RegExp(String.raw`^\s*(?:[-*]\s*)?["'\x60]?(?:analyticExpectedFieldOrder|analytic expected field order)["'\x60]?\s*[:=]\s*${meaningfulValue}$`, "imu"),
    new RegExp(String.raw`^\s*(?:[-*]\s*)?["'\x60]?(?:analyticExpectedFluxOrder|analytic expected flux order)["'\x60]?\s*[:=]\s*${meaningfulValue}$`, "imu"),
    new RegExp(String.raw`^\s*(?:[-*]\s*)?["'\x60]?(?:orderLowerBound|justified (?:order )?lower bound)["'\x60]?\s*[:=]\s*${meaningfulValue}$`, "imu"),
  ];
  return patterns.some((pattern) => pattern.test(textValue));
}

function markdownSection(textValue: string, sectionNumber: string): string | null {
  const lines = textValue.split(/\r?\n/u);
  const headingPattern = /^(#{1,6})\s+([^#].*)$/u;
  let start = -1;
  let level = 0;
  for (const [index, line] of lines.entries()) {
    const match = headingPattern.exec(line);
    if (match !== null && match[2]?.startsWith(`${sectionNumber} `)) {
      start = index;
      level = match[1]?.length ?? 0;
      break;
    }
  }
  if (start < 0 || level === 0) return null;
  let end = lines.length;
  for (let index = start + 1; index < lines.length; index++) {
    const match = headingPattern.exec(lines[index] ?? "");
    if (match !== null && (match[1]?.length ?? 7) <= level) {
      end = index;
      break;
    }
  }
  return lines.slice(start, end).join("\n");
}

function sourceArtifactForFinding(
  expected: StaticExpectation,
  artifacts: ReadonlyMap<string, ParsedSourceArtifact>,
  findingId: string,
): ParsedSourceArtifact | undefined {
  const finding = expected.findings.find((entry) => entry.findingId === findingId);
  if (finding === undefined || locatorFragment(finding.evidenceLocator) === null) return undefined;
  const path = locatorPath(finding.evidenceLocator);
  return path === null ? undefined : artifacts.get(path);
}

function independentSourceGroundErrors(
  expected: StaticExpectation,
  sourceAudit: Phase10C0VStaticSourceAudit,
  inputs: readonly Phase10C0VStaticSourceArtifactInput[],
): readonly string[] {
  const parsed = parseSourceArtifacts(expected, sourceAudit, inputs);
  const errors = [...parsed.errors];
  const findingIds = new Set(expected.findings.map((entry) => entry.findingId));
  for (const required of Object.values(STATIC_FINDING_IDS)) {
    if (!findingIds.has(required)) errors.push(`required semantic source finding is missing: ${required}`);
  }

  const reconstructionArtifact = sourceArtifactForFinding(
    expected,
    parsed.artifacts,
    STATIC_FINDING_IDS.publicOneSweepReconstruction,
  );
  if (reconstructionArtifact?.sourceFile === undefined) {
    errors.push("public one-sweep reconstruction locator does not identify parseable TypeScript");
  } else {
    errors.push(...oneSweepReconstructionErrors(reconstructionArtifact.sourceFile));
  }

  const specificationArtifact = sourceArtifactForFinding(
    expected,
    parsed.artifacts,
    STATIC_FINDING_IDS.missingIndependentOrder,
  );
  if (specificationArtifact === undefined) {
    errors.push("independent-reference/order locator does not identify frozen specification bytes");
  } else {
    const specificationSection = markdownSection(specificationArtifact.text, "4.4");
    if (specificationSection === null) {
      errors.push("frozen specification locator does not identify section 4.4");
      return Object.freeze(errors);
    }
    for (const requiredClause of ["aggregate-hv-g1h1-v6", "monopole", "operator"] as const) {
      if (!specificationSection.toLowerCase().includes(requiredClause.toLowerCase())) {
        errors.push(`frozen specification locator omits the load-bearing ${requiredClause} clause`);
      }
    }
    if (hasStructuredIndependentSpatialContract(specificationSection)) {
      errors.push("frozen specification defines a structured independent spatial reference/order operand");
    }
  }
  return Object.freeze(errors);
}

function publicFindingMatches(
  actual: Phase10C0VStaticPublicApiFinding,
  expected: ExpectedFinding,
): boolean {
  return actual.findingId === expected.findingId && actual.visibility === expected.visibility &&
    actual.contractChangeRequired === expected.contractChangeRequired &&
    actual.evidenceLocator === expected.evidenceLocator &&
    deepEqual(actual.operandIds, expected.operandIds);
}

function auditGroundErrors(
  expected: StaticExpectation,
  sourceAudit: Phase10C0VStaticSourceAudit,
): readonly string[] {
  const errors: string[] = [];
  if (sourceAudit.auditId !== expected.auditId) errors.push("source audit ID differs from protocol");
  if (sourceAudit.currentContractOnly !== true) errors.push("source audit is not current-contract-only");
  if (sourceAudit.publicApiFindings.length !== expected.findings.length) {
    errors.push("source audit finding cardinality differs");
  }
  for (const finding of expected.findings) {
    const actual = sourceAudit.publicApiFindings.find((entry) => entry.findingId === finding.findingId);
    if (actual === undefined || !publicFindingMatches(actual, finding)) {
      errors.push(`source audit finding differs: ${finding.findingId}`);
    }
  }
  const requiredPaths = [...new Set(expected.findings.map((entry) => locatorPath(entry.evidenceLocator)))];
  if (requiredPaths.some((path) => path === null)) errors.push("protocol evidence locator is malformed");
  const actualPaths = sourceAudit.inspectedArtifacts.map((entry) => entry.path);
  if (
    sourceAudit.inspectedArtifacts.some((identity) => !validIdentity(identity)) ||
    !sameSet(actualPaths, requiredPaths.filter((path): path is string => path !== null))
  ) errors.push("source audit artifact identities differ from protocol locator paths");
  return Object.freeze(errors);
}

function containsUniversalClaim(value: unknown): boolean {
  if (typeof value === "string") {
    return /\b(?:universally impossible|impossible under all|no (?:future )?implementation can|can never be derived|under any contract)\b/iu.test(value);
  }
  if (Array.isArray(value)) return value.some(containsUniversalClaim);
  if (value !== null && typeof value === "object") {
    return Object.values(value as Record<string, unknown>).some(containsUniversalClaim);
  }
  return false;
}

function evidenceObject(sourceAudit: Phase10C0VStaticSourceAudit): Record<string, unknown> {
  return {
    auditId: sourceAudit.auditId,
    currentContractOnly: sourceAudit.currentContractOnly,
    inspectedArtifacts: sourceAudit.inspectedArtifacts,
    publicApiFindings: sourceAudit.publicApiFindings,
    executionRecord: sourceAudit.executionRecord,
  };
}

/** Independently validate the mandatory scoped-refusal branch and its zero-execution record. */
export function independentlyCheckPhase10C0VStaticRefusal(
  protocolValue: Phase10C0VStaticProtocol,
  candidate: Phase10C0VStaticRefusalCandidate,
  sourceAudit: Phase10C0VStaticSourceAudit,
  sourceArtifacts: readonly Phase10C0VStaticSourceArtifactInput[],
): Phase10C0VStaticRefusalCheck {
  const protocol = parsePhase10C0VStaticProtocol(protocolValue);
  const expected = expectation(protocol);

  const groundErrors = [
    ...auditGroundErrors(expected, sourceAudit),
    ...independentSourceGroundErrors(expected, sourceAudit, sourceArtifacts),
  ];
  if (candidate.schema !== "phase10-c0v-static-refusal-candidate-v1") {
    groundErrors.push("candidate schema differs");
  }
  if (candidate.protocolId !== protocol.protocolId) groundErrors.push("candidate protocolId differs");
  if (candidate.reasonCode !== expected.reasonCode) groundErrors.push("candidate reasonCode differs");
  if (!deepEqual(candidate.unavailableOperands, expected.unavailableOperands)) {
    groundErrors.push("candidate unavailable operands differ");
  }
  if (!deepEqual(candidate.contractEvidence, evidenceObject(sourceAudit))) {
    groundErrors.push("candidate contract evidence differs from supplied source audit");
  }

  const routeErrors: string[] = [];
  if (!deepEqual(candidate.attemptedRoutes, protocol.attemptedRoutes)) {
    routeErrors.push("candidate attempted routes differ from protocol");
  }
  if (!deepEqual(candidate.forbiddenSubstitutes, expected.forbiddenSubstitutes)) {
    routeErrors.push("candidate forbidden substitutes differ from protocol grounds");
  }

  const scopeErrors: string[] = [];
  if (candidate.currentContractScope !== expected.currentContractScope) {
    scopeErrors.push("candidate current-contract scope differs");
  }
  if (!deepEqual(candidate.claimBoundary, protocol.claimBoundary)) {
    scopeErrors.push("candidate claim boundary differs from protocol");
  }
  if (!deepEqual(candidate.downstreamEffect, protocol.terminalSemantics)) {
    scopeErrors.push("candidate downstream effect differs from protocol terminal semantics");
  }
  if (containsUniversalClaim(candidate) || expected.universalImpossibilityClaim !== false) {
    scopeErrors.push("candidate contains a universal impossibility claim");
  }
  if (!expected.scopeRule.toLowerCase().includes("current")) {
    scopeErrors.push("protocol scope rule is not explicitly current-contract scoped");
  }

  const zeroErrors: string[] = [];
  if (!zeroRecord(sourceAudit.executionRecord)) zeroErrors.push("source audit execution record is nonzero");
  if (!zeroRecord(candidate.executionRecord)) zeroErrors.push("candidate execution record is nonzero");
  if (!deepEqual(candidate.executionRecord, sourceAudit.executionRecord)) {
    zeroErrors.push("candidate did not preserve the source audit zero record exactly");
  }

  const groundChecks = Object.freeze({
    passed: groundErrors.length === 0,
    details: Object.freeze(groundErrors.length === 0
      ? ["frozen source bytes independently establish same-discrete one-sweep reconstruction and the missing independent spatial reference/order contract"]
      : groundErrors),
  });
  const routeChecks = Object.freeze({
    passed: routeErrors.length === 0,
    details: Object.freeze(routeErrors.length === 0
      ? ["all attempted routes and forbidden substitutes match"]
      : routeErrors),
  });
  const scopeChecks = Object.freeze({
    passed: scopeErrors.length === 0,
    details: Object.freeze(scopeErrors.length === 0
      ? ["refusal is limited to the current frozen contract and makes no universal claim"]
      : scopeErrors),
  });
  const zeroExecutionChecks = Object.freeze({
    passed: zeroErrors.length === 0,
    details: Object.freeze(zeroErrors.length === 0
      ? ["solver, reference, production, witness, numerical-evaluation, and process-hour counters are zero"]
      : zeroErrors),
  });
  const errors = Object.freeze([
    ...groundErrors,
    ...routeErrors,
    ...scopeErrors,
    ...zeroErrors,
  ]);
  return Object.freeze({
    schema: "phase10-c0v-static-refusal-check-v1",
    protocolId: protocol.protocolId,
    method: "independent-current-contract-ground-route-scope-and-zero-execution-check",
    groundChecks,
    routeChecks,
    scopeChecks,
    zeroExecutionChecks,
    verdict: errors.length === 0 ? "pass" : "fail",
    errors,
  });
}

/** Stable candidate-oriented alias used by the S5b neutral wrapper. */
export const checkPhase10C0VStaticRefusalCandidate =
  independentlyCheckPhase10C0VStaticRefusal;
