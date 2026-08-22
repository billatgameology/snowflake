import { readFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { sha256Bytes } from "../src/gate4-evidence.ts";
import {
  type Phase10C0VArtifactIdentity,
  type Phase10C0VMovingReferenceCandidate,
  type Phase10C0VMovingReferenceInput,
  type Phase10C0VStaticProtocol,
  type Phase10C0VStaticRefusalCandidate,
  type Phase10C0VStaticSourceAudit,
} from "../src/phase10-c0v-contracts.ts";
import {
  derivePhase10C0VMovingReferenceFromInput,
} from "../src/phase10-c0v-moving-reference-derive.ts";
import {
  independentlyCheckPhase10C0VMovingReferenceFromInput,
} from "../src/phase10-c0v-moving-reference-check.ts";
import {
  constructPhase10C0VStaticSourceAudit,
  derivePhase10C0VStaticRefusal,
  phase10C0VStaticSourceAuditRequirements,
} from "../src/phase10-c0v-static-refusal.ts";
import {
  independentlyCheckPhase10C0VStaticRefusal,
  type Phase10C0VStaticSourceArtifactInput,
} from "../src/phase10-c0v-static-refusal-check.ts";

const REPOSITORY_ROOT = resolve(import.meta.dirname, "../..");
const SHA_A = "a".repeat(64);
const SHA_B = "b".repeat(64);
const SHA_C = "c".repeat(64);

function syntheticMovingInput(): Phase10C0VMovingReferenceInput {
  return Object.freeze({
    protocolId: "synthetic-moving-reference-v1",
    fixture: Object.freeze({
      surfacePolicy: "aggregate-hv-g1h1-v6",
      dimensions: Object.freeze([3, 3, 5] as const),
      center: Object.freeze([1, 1, 2] as const),
      domain: "hexPrism",
      farField: "dirichlet",
      seedRadius: 0,
      seedThickness: 1,
      tempC: -9,
      sigmaInfinity: 0.011,
      dxUm: 0.42,
      pressurePa: 90_000,
      paramSet: "CAK_A1",
      cflFill: 0.26,
      relaxTol: 1e-11,
      divTol: 1e-8,
      maxSweeps: 512,
      noiseEpsilon: 0,
      rngSeed: 0,
      physicalConstants: Object.freeze({
        kBoltzmannJPerK: 1.41e-23,
        celsiusZeroK: 274,
        waterMoleculeMassKg: 3.2e-26,
        iceNumberDensityPerM3: 2.9e28,
        diffusivityAir1AtmM2S: 1.8e-5,
        standardAtmospherePa: 100_000,
        saturationPressurePrefactorMbar: 3.5e10,
        saturationPressureExponentK: -5_900,
        mbarToPa: 99,
      }),
      kineticInputs: Object.freeze({
        basalPrefactor: 1,
        basalSigma0: 0.009,
        robinGeometry: 1,
        fillGeometry: 1,
      }),
    }),
    topology: Object.freeze({
      linearIndexRule: "i + ni * (j + nj * k)",
      neighborOffsets: Object.freeze([
        Object.freeze([1, 0, 0] as const),
        Object.freeze([-1, 0, 0] as const),
        Object.freeze([0, 1, 0] as const),
        Object.freeze([0, -1, 0] as const),
        Object.freeze([1, -1, 0] as const),
        Object.freeze([-1, 1, 0] as const),
        Object.freeze([0, 0, 1] as const),
        Object.freeze([0, 0, -1] as const),
      ]),
      initialAttachedIndices: Object.freeze([22]),
      initialBoundaryIndices: Object.freeze([13, 19, 20, 21, 23, 24, 25, 31]),
      tiedOrbitIndices: Object.freeze([13, 31]),
      postAttachedIndices: Object.freeze([13, 22, 31]),
      postBoundaryIndices: Object.freeze([
        4, 10, 11, 12, 14, 15, 16, 19, 20, 21, 23, 24, 25, 28, 29, 30, 32, 33, 34, 40,
      ]),
      eventOrdinal: 4,
      d6hClosureRule: "integer axial reflection and in-plane sixfold closure",
    }),
    formulas: Object.freeze({
      environmentEquations: "synthetic signed-exponent environment equations",
      inPlaneEquation: "synthetic sorted opposing-pair equation",
      verticalEquation: "synthetic vertical equation",
      opposingEquation: "synthetic immutable opposing equation",
      boundaryEquation: "synthetic self-consistent boundary equation",
      preEventScalarEquation: "synthetic monotone scalar equation",
      evaluationOrder: Object.freeze(["smooth", "replace", "clamp"]),
      bisection: Object.freeze({
        lowerBound: "zero",
        upperBound: "synthetic infinity value",
        maxIterations: 256,
        stopRule: "binary64 midpoint collapse",
        selectionRule: "smallest absolute residual endpoint",
      }),
      eventUpdate: Object.freeze({
        rateEquation: "synthetic rate equation",
        timeStepEquation: "synthetic time equation",
        fillEquation: "synthetic fill equation",
        attachmentRule: "simultaneous saturation",
        topologyRule: "rebuild after simultaneous attachment",
      }),
      ledgerIdentity: Object.freeze({
        iceCellEquation: "placed plus clipped equals demand",
        vaporEquation: "placed converted at the synthetic environment",
        holeFillRule: "zero for this synthetic fixture",
      }),
      driftBound: Object.freeze({
        nonzeroEquation: "binary64 roundoff envelope",
        zeroFieldValue: "zero",
      }),
    }),
    criteria: Object.freeze({
      allChecksRequired: true,
      scalarEquationResidualRelative: 1e-12,
      preEventFieldLInf: 1e-9,
      preEventFieldWeightedL2: 1e-9,
      axialRateRelative: 1e-8,
      axialRatesBitIdenticalPositive: true,
      otherInitialBoundaryRatesBitwiseZero: true,
      attachedNowByStep: Object.freeze([0, 0, 0, 2] as const),
      eventTimeRelative: 1e-8,
      maxKineticIncrementAbsolute: 1e-12,
      exactTopologyNeighborD6hSets: true,
      postFieldShellBitwiseSigmaInfinity: true,
      postFieldAttachedAndWallBitwiseZero: true,
      placedFillAbsolute: 1e-10,
      clippingAbsolute: 1e-10,
      vaporLedgerRelative: 1e-8,
      eventChainRelative: 1e-8,
      holeFillExact: Object.freeze({ count: 0, deficit: 0 }),
      postFieldFixedPointResidual: 1e-10,
      relaxationCriteria: Object.freeze({
        residualStrictlyLessThan: 1e-11,
        divergenceStrictlyLessThan: 1e-8,
        maxSweeps: 512,
        smootherDriftWithinRoundoffBound: true,
      }),
      comparisonOperators: Object.freeze({
        tolerance: "less-than-or-equal",
        relaxation: "strictly-less-than",
        exact: "strict-equality-or-bitwise-as-named",
      }),
    }),
  });
}

function identity(path: string, sha256 = SHA_A): Phase10C0VArtifactIdentity {
  return Object.freeze({ path, byteLength: 101, sha256 });
}

function staticPaths(): Phase10C0VStaticProtocol["artifactPaths"] {
  return Object.freeze({
    protocol: "research/phase10-c0v-static-protocol-v1.json",
    reference: "evidence/phase10-numerical-verification-v1/c0v-static-reference.json",
    referenceRefusal: "evidence/phase10-numerical-verification-v1/c0v-static-reference-refusal.json",
    witness: "evidence/phase10-numerical-verification-v1/c0v-static-witness.bin",
    evaluation: "evidence/phase10-numerical-verification-v1/c0v-static-evaluation.json",
    result: "evidence/phase10-numerical-verification-v1/c0v-static-result.json",
    attemptLedger: "evidence/phase10-numerical-verification-v1/c0v-static-attempts.jsonl",
  });
}

function syntheticStaticProtocol(): Phase10C0VStaticProtocol {
  const findingIds = [
    "public-one-sweep-reconstruction-available",
    "independent-static-spatial-reference-order-not-specified",
  ];
  const routeIds = [
    "public-one-sweep-reconstruction-plus-separate-discrete-replay",
    "tolerance-scaled-self-convergence",
  ];
  return Object.freeze({
    schema: "phase10-c0v-static-protocol-v1",
    protocolId: "synthetic-static-refusal-v1",
    layerId: "C0V-STATIC",
    frozenDate: "2026-08-21",
    branch: "reference-refusal",
    bindings: Object.freeze({
      foundation: identity("research/phase10-c0v-foundation-v1.json", SHA_A),
      obligationMatrix: identity("research/phase10-obligation-matrix-v1.json", SHA_B),
      schemaRegistry: identity("research/phase10-c0v-artifact-schema-registry-v1.json", SHA_C),
      schemaContracts: identity("research/phase10-c0v-schema-contracts-v1.json", "d".repeat(64)),
    }),
    artifactPaths: staticPaths(),
    referenceOnlyCode: Object.freeze([
      Object.freeze({
        role: "generator",
        modulePath: "runner/src/phase10-c0v-static-refusal.ts",
        exportName: "derivePhase10C0VStaticRefusal",
        byteLength: 101,
        sha256: SHA_A,
      }),
      Object.freeze({
        role: "independent-checker",
        modulePath: "runner/src/phase10-c0v-static-refusal-check.ts",
        exportName: "independentlyCheckPhase10C0VStaticRefusal",
        byteLength: 102,
        sha256: SHA_B,
      }),
      Object.freeze({
        role: "shared-parser",
        modulePath: "runner/src/phase10-c0v-contracts.ts",
        exportName: "parsePhase10C0VStaticProtocol",
        byteLength: 103,
        sha256: SHA_C,
      }),
    ]),
    refusalGrounds: Object.freeze({
      auditId: "phase10-c0v-static-current-contract-audit-v1",
      reasonCode: "current-contract-lacks-independent-static-spatial-reference-v1",
      currentContractScope: "accepted-current-public-solver-contract-only",
      unavailableOperands: Object.freeze([
        "analyticExpectedFieldOrder",
        "analyticExpectedFluxOrder",
        "independentContinuumBoundaryFluxReference",
        "independentContinuumFieldReference",
        "orderLowerBound",
      ]),
      forbiddenSubstitutes: Object.freeze([
        "same-discrete-replay-as-spatial-accuracy",
        "self-convergence-as-absolute-accuracy",
      ]),
      findings: Object.freeze([
        Object.freeze({
          findingId: findingIds[0],
          operandIds: Object.freeze([
            "acceptedFinalSweepPreCallField",
            "postSmootherCandidate",
            "relaxField",
            "relaxMaxSweeps",
            "sigma",
          ]),
          visibility: "public-accepted-state",
          contractChangeRequired: false,
          evidenceLocator: "solver-cpu/src/lk-solver.ts#LKSolver.relaxField-relaxMaxSweeps-incomplete-and-sigma",
          ground: "one-sweep call-boundary state is reconstructible through the public synthetic API",
        }),
        Object.freeze({
          findingId: findingIds[1],
          operandIds: Object.freeze([
            "analyticExpectedFieldOrder", "analyticExpectedFluxOrder",
            "independentContinuumBoundaryFluxReference", "independentContinuumFieldReference",
            "orderLowerBound",
          ]),
          visibility: "not-specified",
          contractChangeRequired: false,
          evidenceLocator: "docs/attachment-kinetics.md#4.4-the-surface-operator-specification",
          ground: "the synthetic contract specifies no independent continuum field/flux reference, orders, or justified lower bound",
        }),
      ]),
    }),
    attemptedRoutes: Object.freeze([
      Object.freeze({
        routeId: routeIds[0],
        route: "reconstruct each one-sweep call boundary and replay the discrete operator separately",
        disposition: "available-but-insufficient",
        reason: "the route remains the same discrete arithmetic without an independent spatial reference",
      }),
      Object.freeze({
        routeId: routeIds[1],
        route: "use tolerance-scaled self-convergence",
        disposition: "forbidden-substitute",
        reason: "the contract supplies no independent order or lower bound",
      }),
    ]),
    notApplicableObligations: Object.freeze({
      gridRoster: "not-instantiated",
      normThresholds: "not-instantiated",
      referenceValues: "not-instantiated",
      solverCalls: "not-instantiated",
      witnesses: "not-instantiated",
      numericalEvaluations: "not-instantiated",
    }),
    targetedCheck: Object.freeze({
      method: "independent-current-contract-ground-route-scope-and-zero-execution-check",
      requiredFindingIds: Object.freeze(findingIds),
      requiredRouteIds: Object.freeze(routeIds),
      zeroExecutionRequired: true,
      scopeRule: "current accepted contract only",
      universalImpossibilityClaim: false,
    }),
    resourceBoundary: Object.freeze({
      requiredRuntime: "v24.13.1",
      timeoutSeconds: 300,
      projectedScratchBytes: 8 * 1024 * 1024,
      projectedPublicationBytes: 2 * 1024 * 1024,
      minimumFreeBytes: 64 * 1024 * 1024,
      solverProcessConcurrency: 1,
      s5ScientificProcessHours: 0,
      automaticRefinementOrFanOut: false,
      capOutcome: "resource-refusal-and-maker-return",
    }),
    independence: Object.freeze({
      scientificArithmeticSeparation: "structural contract audit only",
      permittedSharedCode: Object.freeze(["strict JSON and identity parsing"]),
      sharedImportAllowlist: Object.freeze([
        "runner/src/gate4-evidence.ts",
        "runner/src/phase10-c0v-contracts.ts",
      ]),
      forbiddenImports: Object.freeze([
        "core/**",
        "runner/src/phase10-execution-preflight.ts",
        "runner/src/phase10-executor-worker.ts",
        "runner/src/phase10-executor.ts",
        "solver-cpu/**",
        "solver-gpu/**",
      ]),
      dependencyAudit: "recursive relative-import closure",
      testHooks: "none",
      productionImplementationPresent: false,
      solverExecutionPresent: false,
    }),
    terminalSemantics: Object.freeze({
      earlyReferenceArtifact: "publish the scoped refusal",
      packetCompletion: "static packet terminates after refusal validation",
      referenceReopener: "an accepted public-contract change",
      discrepancyOutcome: "return to maker",
      aggregateRule: "preserve the refusal without a witness or evaluation",
    }),
    claimBoundary: Object.freeze({
      allowed: Object.freeze(["current-contract scoped refusal"]),
      forbidden: Object.freeze(["scientific impossibility", "universal future-contract claim"]),
    }),
  }) as unknown as Phase10C0VStaticProtocol;
}

const SYNTHETIC_STATIC_API_SOURCE = `
export interface LKSolverOptions {
  readonly relaxMaxSweeps: number;
}

export class LKSolver {
  public readonly dims = [2, 2, 1] as const;
  public readonly a = new Uint8Array(4);
  public readonly sigma = new Float64Array(4);
  public readonly wall = new Uint8Array(4);
  public readonly dirichletCells = new Int32Array([0, 3]);
  private readonly relaxMaxSweeps: number;
  private phase: "boundary" | "incomplete" = "boundary";
  private readonly surfacePolicy = "aggregate-hv-g1h1-v6";

  public constructor(options: LKSolverOptions) {
    this.relaxMaxSweeps = options.relaxMaxSweeps;
  }

  private sweepAggregate(src: Float64Array, dst: Float64Array): void {
    for (let index = 0; index < src.length; index++) dst[index] = src[index]!;
  }

  private sweep(src: Float64Array, dst: Float64Array): void {
    if (this.surfacePolicy.startsWith("aggregate-")) this.sweepAggregate(src, dst);
  }

  public boundaryCells(): readonly number[] { return [1, 2]; }
  public neighborCounts(_index: number): [number, number] { return [1, 0]; }
  public boundaryState(_index: number): {
    readonly sigmaOpp: number;
    readonly sigmaBoundary: number;
    readonly alphaHKBoundary: number;
    readonly robinGeometry: number;
    readonly fillGeometry: number;
  } {
    return {
      sigmaOpp: 0.1,
      sigmaBoundary: 0.1,
      alphaHKBoundary: 0.2,
      robinGeometry: 1,
      fillGeometry: 1,
    };
  }

  public relaxField(): { readonly converged: boolean } {
    if (this.phase !== "boundary" && this.phase !== "incomplete") throw new Error("phase");
    let src = this.sigma;
    let dst = new Float64Array(src.length);
    let converged = false;
    for (let sweep = 0; sweep < this.relaxMaxSweeps; sweep++) {
      this.sweep(src, dst);
      const tmp = src;
      src = dst;
      dst = tmp;
      converged = sweep > 0;
      if (converged) break;
    }
    this.sigma.set(src);
    if (!converged) this.phase = "incomplete";
    return { converged };
  }
}
`;

const SYNTHETIC_STATIC_SPEC_SOURCE =
  "## 4.4 The surface-operator specification\n\n" +
  "The aggregate-hv-g1h1-v6 discrete operator uses the registered monopole boundary closure.\n";

function staticSourceArtifact(
  path: string,
  source: string | Uint8Array,
): Phase10C0VStaticSourceArtifactInput {
  const bytes = typeof source === "string" ? new TextEncoder().encode(source) : new Uint8Array(source);
  return Object.freeze({
    identity: Object.freeze({ path, byteLength: bytes.byteLength, sha256: sha256Bytes(bytes) }),
    bytes,
  });
}

function syntheticStaticSourceArtifacts(
  apiSource = SYNTHETIC_STATIC_API_SOURCE,
  specSource = SYNTHETIC_STATIC_SPEC_SOURCE,
): readonly Phase10C0VStaticSourceArtifactInput[] {
  return Object.freeze([
    staticSourceArtifact("solver-cpu/src/lk-solver.ts", apiSource),
    staticSourceArtifact("docs/attachment-kinetics.md", specSource),
  ]);
}

function sourceAudit(
  protocol: Phase10C0VStaticProtocol,
  artifacts: readonly Phase10C0VStaticSourceArtifactInput[] = syntheticStaticSourceArtifacts(),
): Phase10C0VStaticSourceAudit {
  return constructPhase10C0VStaticSourceAudit(
    protocol,
    artifacts.map((entry) => entry.identity),
  );
}

function changedCandidate(
  candidate: Phase10C0VMovingReferenceCandidate,
  change: (copy: Record<string, any>) => void,
): Phase10C0VMovingReferenceCandidate {
  const copy = structuredClone(candidate) as Record<string, any>;
  change(copy);
  return copy as unknown as Phase10C0VMovingReferenceCandidate;
}

function numericIdentity(value: number): { readonly decimal: string; readonly binary64Hex: string } {
  const bytes = Buffer.allocUnsafe(8);
  bytes.writeDoubleBE(value, 0);
  return Object.freeze({ decimal: value.toString(), binary64Hex: bytes.toString("hex") });
}

function importSpecifiers(source: string): readonly string[] {
  return [...source.matchAll(/(?:import|export)\s+(?:type\s+)?(?:[^"']+?\s+from\s+)?["']([^"']+)["']/gu)]
    .map((match) => match[1]!);
}

function relativeImportClosure(entryPath: string): ReadonlySet<string> {
  const closure = new Set<string>();
  const pending = [entryPath];
  while (pending.length > 0) {
    const current = pending.pop()!;
    if (closure.has(current)) continue;
    closure.add(current);
    const source = readFileSync(current, "utf8");
    for (const specifier of importSpecifiers(source)) {
      if (!specifier.startsWith(".")) continue;
      const dependency = resolve(dirname(current), specifier);
      if (!closure.has(dependency)) pending.push(dependency);
    }
  }
  return closure;
}

describe("Phase 10 C0V moving independent reference", () => {
  it("derives a deterministic synthetic event and passes the separately coded checker", () => {
    const input = syntheticMovingInput();
    const first = derivePhase10C0VMovingReferenceFromInput(input);
    const second = derivePhase10C0VMovingReferenceFromInput(input);
    expect(first).toEqual(second);
    expect(first.cycles.map((cycle) => cycle.attachedIndices.length)).toEqual([0, 0, 0, 2]);
    expect(first.event.attachedIndices).toEqual(input.topology.tiedOrbitIndices);
    expect(first.postState.attachedIndices).toEqual(input.topology.postAttachedIndices);
    expect(first.ledger.holeFillCount).toBe(0);
    const seed = first.initialState.fieldRows.find((row) => row.linearIndex === 22);
    expect(seed?.attached).toBe(true);
    expect(seed?.fill).toEqual(numericIdentity(1));
    const check = independentlyCheckPhase10C0VMovingReferenceFromInput(input, first);
    expect(check.verdict).toBe("pass");
    expect(check.errors).toEqual([]);
    expect(check.monotonicityBracketResidual.passed).toBe(true);
    expect(check.fieldEquationChecks.passed).toBe(true);
  });

  it("fails closed on independent scalar, topology, event, and ledger mutations", () => {
    const input = syntheticMovingInput();
    const candidate = derivePhase10C0VMovingReferenceFromInput(input);
    const mutations = [
      changedCandidate(candidate, (copy) => {
        copy.convergence.scalarRoot.selectedRoot = { decimal: "0", binary64Hex: "0000000000000000" };
      }),
      changedCandidate(candidate, (copy) => {
        copy.neighborTable[0].neighbors[0] = null;
      }),
      changedCandidate(candidate, (copy) => {
        copy.cycles[3].attachedIndices = [13];
      }),
      changedCandidate(candidate, (copy) => {
        copy.ledger.kineticDemandIceCells = { decimal: "2", binary64Hex: "4000000000000000" };
      }),
      changedCandidate(candidate, (copy) => {
        copy.ledger.holeFillCount = 1;
        copy.ledger.holeFillDeficitIceCells = numericIdentity(0.25);
      }),
    ];
    for (const mutation of mutations) {
      expect(independentlyCheckPhase10C0VMovingReferenceFromInput(input, mutation).verdict).toBe("fail");
    }
  });

  it("rejects a changed ordered-neighbor contract before deriving a candidate", () => {
    const input = syntheticMovingInput();
    const changed = {
      ...input,
      topology: {
        ...input.topology,
        neighborOffsets: [...input.topology.neighborOffsets].reverse(),
      },
    } as Phase10C0VMovingReferenceInput;
    expect(() => derivePhase10C0VMovingReferenceFromInput(changed)).toThrow(/ordered neighbor offsets/u);
  });

  it("rejects an inflated smoother-drift limit with drift above the independent bound", () => {
    const input = syntheticMovingInput();
    const candidate = derivePhase10C0VMovingReferenceFromInput(input);
    const trueLimit = Number(candidate.initialState.relaxation.smootherDriftLimit.decimal);
    expect(trueLimit).toBeGreaterThan(0);
    const mutation = changedCandidate(candidate, (copy) => {
      const changedRelaxation = {
        ...copy.initialState.relaxation,
        smootherDriftLimit: numericIdentity(trueLimit * 16),
        smootherDriftDiagnostic: numericIdentity(trueLimit * 2),
      };
      copy.initialState.relaxation = changedRelaxation;
      copy.convergence.preEvent = structuredClone(changedRelaxation);
    });
    const check = independentlyCheckPhase10C0VMovingReferenceFromInput(input, mutation);
    expect(check.verdict).toBe("fail");
    expect(check.fieldEquationChecks.details).toContain("pre relaxation criteria do not pass");
  });
});

describe("Phase 10 C0V static scoped reference refusal", () => {
  it("constructs a protocol-bound zero-execution audit and validates the refusal", () => {
    const protocol = syntheticStaticProtocol();
    const requirements = phase10C0VStaticSourceAuditRequirements(protocol);
    expect(requirements.inspectedPaths).toEqual([
      "docs/attachment-kinetics.md",
      "solver-cpu/src/lk-solver.ts",
    ]);
    const artifacts = syntheticStaticSourceArtifacts();
    const audit = sourceAudit(protocol, artifacts);
    expect(audit.auditId).toBe("phase10-c0v-static-current-contract-audit-v1");
    expect(Object.values(audit.executionRecord)).toEqual([0, 0, 0, 0, 0, 0]);
    const candidate = derivePhase10C0VStaticRefusal(protocol, audit);
    expect(candidate.contractEvidence).toEqual({
      auditId: audit.auditId,
      currentContractOnly: true,
      inspectedArtifacts: audit.inspectedArtifacts,
      publicApiFindings: audit.publicApiFindings,
      executionRecord: audit.executionRecord,
    });
    expect((candidate.contractEvidence as Record<string, unknown>).executionRecord)
      .toEqual(audit.executionRecord);
    const check = independentlyCheckPhase10C0VStaticRefusal(protocol, candidate, audit, artifacts);
    expect(check.verdict).toBe("pass");
    expect(check.errors).toEqual([]);
  });

  it("independently rejects one-sweep continuation and independent-spec-clause mutations", () => {
    const protocol = syntheticStaticProtocol();
    const continuationMutation = syntheticStaticSourceArtifacts(
      SYNTHETIC_STATIC_API_SOURCE.replace(
        "this.phase !== \"incomplete\"",
        "this.phase !== \"boundary\"",
      ),
    );
    const continuationAudit = sourceAudit(protocol, continuationMutation);
    const continuationCandidate = derivePhase10C0VStaticRefusal(protocol, continuationAudit);
    const continuationCheck = independentlyCheckPhase10C0VStaticRefusal(
      protocol,
      continuationCandidate,
      continuationAudit,
      continuationMutation,
    );
    expect(continuationCheck.verdict).toBe("fail");
    expect(continuationCheck.errors).toContain(
      "relaxField entry guard does not admit boundary and incomplete states",
    );

    const swapMutation = syntheticStaticSourceArtifacts(
      SYNTHETIC_STATIC_API_SOURCE.replace(
        "      src = dst;",
        "      src = tmp;",
      ),
    );
    const swapAudit = sourceAudit(protocol, swapMutation);
    const swapCandidate = derivePhase10C0VStaticRefusal(protocol, swapAudit);
    const swapCheck = independentlyCheckPhase10C0VStaticRefusal(
      protocol,
      swapCandidate,
      swapAudit,
      swapMutation,
    );
    expect(swapCheck.verdict).toBe("fail");
    expect(swapCheck.errors).toContain(
      "relaxField does not install the completed sweep into this.sigma",
    );

    const topologyMutation = syntheticStaticSourceArtifacts(
      SYNTHETIC_STATIC_API_SOURCE.replace(
        "  public boundaryCells(): readonly number[]",
        "  private boundaryCells(): readonly number[]",
      ),
    );
    const topologyAudit = sourceAudit(protocol, topologyMutation);
    const topologyCandidate = derivePhase10C0VStaticRefusal(protocol, topologyAudit);
    const topologyCheck = independentlyCheckPhase10C0VStaticRefusal(
      protocol,
      topologyCandidate,
      topologyAudit,
      topologyMutation,
    );
    expect(topologyCheck.verdict).toBe("fail");
    expect(topologyCheck.errors).toContain("exported LKSolver does not expose public boundaryCells");

    const specificationMutation = syntheticStaticSourceArtifacts(
      SYNTHETIC_STATIC_API_SOURCE,
      `${SYNTHETIC_STATIC_SPEC_SOURCE}analyticExpectedFieldOrder: 2\n`,
    );
    const specificationAudit = sourceAudit(protocol, specificationMutation);
    const specificationCandidate = derivePhase10C0VStaticRefusal(protocol, specificationAudit);
    const specificationCheck = independentlyCheckPhase10C0VStaticRefusal(
      protocol,
      specificationCandidate,
      specificationAudit,
      specificationMutation,
    );
    expect(specificationCheck.verdict).toBe("fail");
    expect(specificationCheck.errors).toContain(
      "frozen specification defines a structured independent spatial reference/order operand",
    );
  });

  it("matches the frozen current solver/spec source shape without reading a layer protocol", () => {
    const solverPath = "solver-cpu/src/lk-solver.ts";
    const specificationPath = "docs/attachment-kinetics.md";
    const protocol = syntheticStaticProtocol();
    const artifacts = Object.freeze([
      staticSourceArtifact(solverPath, readFileSync(resolve(REPOSITORY_ROOT, solverPath))),
      staticSourceArtifact(
        specificationPath,
        readFileSync(resolve(REPOSITORY_ROOT, specificationPath)),
      ),
    ]);
    const audit = sourceAudit(protocol, artifacts);
    const candidate = derivePhase10C0VStaticRefusal(protocol, audit);
    const check = independentlyCheckPhase10C0VStaticRefusal(protocol, candidate, audit, artifacts);
    expect(check.errors).toEqual([]);
    expect(check.verdict).toBe("pass");
  });

  it("rejects changed grounds and fails a nonzero or universal candidate", () => {
    const protocol = syntheticStaticProtocol();
    const artifacts = syntheticStaticSourceArtifacts();
    const audit = sourceAudit(protocol, artifacts);
    const changedAudit = {
      ...audit,
      publicApiFindings: audit.publicApiFindings.map((finding, index) => index === 0
        ? { ...finding, evidenceLocator: "synthetic/api.ts#wrong" }
        : finding),
    } as Phase10C0VStaticSourceAudit;
    expect(() => derivePhase10C0VStaticRefusal(protocol, changedAudit)).toThrow(/finding differs/u);

    const candidate = derivePhase10C0VStaticRefusal(protocol, audit);
    const nonzero = {
      ...candidate,
      executionRecord: { ...candidate.executionRecord, numericalEvaluations: 1 },
    } as unknown as Phase10C0VStaticRefusalCandidate;
    expect(independentlyCheckPhase10C0VStaticRefusal(protocol, nonzero, audit, artifacts).verdict).toBe("fail");
    const universal = {
      ...candidate,
      downstreamEffect: { statement: "universally impossible" },
    } as unknown as Phase10C0VStaticRefusalCandidate;
    expect(independentlyCheckPhase10C0VStaticRefusal(protocol, universal, audit, artifacts).verdict).toBe("fail");
    const changedSubstitute = {
      ...candidate,
      forbiddenSubstitutes: [...candidate.forbiddenSubstitutes, "invented-substitute"],
    } as Phase10C0VStaticRefusalCandidate;
    expect(independentlyCheckPhase10C0VStaticRefusal(protocol, changedSubstitute, audit, artifacts).verdict)
      .toBe("fail");
  });
});

describe("Phase 10 C0V moving/static reference import boundary", () => {
  it("keeps each recursive closure within the frozen shared allowlist and separates maker/checker", () => {
    const entries = [
      "runner/src/phase10-c0v-moving-reference-derive.ts",
      "runner/src/phase10-c0v-moving-reference-check.ts",
      "runner/src/phase10-c0v-static-refusal.ts",
      "runner/src/phase10-c0v-static-refusal-check.ts",
    ];
    const expectedShared = [
      "runner/src/gate4-evidence.ts",
      "runner/src/phase10-c0v-contracts.ts",
    ];
    for (const entry of entries) {
      const closure = [...relativeImportClosure(resolve(REPOSITORY_ROOT, entry))]
        .map((path) => relative(REPOSITORY_ROOT, path).replaceAll("\\", "/"));
      expect(closure.sort()).toEqual([entry, ...expectedShared].sort());
    }
    const movingMaker = readFileSync(resolve(REPOSITORY_ROOT, entries[0]!), "utf8");
    const movingChecker = readFileSync(resolve(REPOSITORY_ROOT, entries[1]!), "utf8");
    const staticMaker = readFileSync(resolve(REPOSITORY_ROOT, entries[2]!), "utf8");
    const staticChecker = readFileSync(resolve(REPOSITORY_ROOT, entries[3]!), "utf8");
    expect(movingMaker).not.toContain("phase10-c0v-moving-reference-check");
    expect(movingChecker).not.toContain("phase10-c0v-moving-reference-derive");
    expect(staticMaker).not.toContain("phase10-c0v-static-refusal-check");
    expect(staticChecker).not.toContain("from \"./phase10-c0v-static-refusal.ts\"");
  });
});
