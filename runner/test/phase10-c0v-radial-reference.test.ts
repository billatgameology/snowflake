import { readFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  derivePhase10C0VRadialReference,
  type Phase10C0VRadialReferenceCandidate,
  type Phase10C0VRadialReferenceInput,
} from "../src/phase10-c0v-radial-reference-derive.ts";
import {
  independentlyCheckPhase10C0VRadialReference,
  type Phase10C0VRadialCheckBinary64Identity,
} from "../src/phase10-c0v-radial-reference-check.ts";

const REPOSITORY_ROOT = resolve(import.meta.dirname, "../..");

function syntheticInput(): Phase10C0VRadialReferenceInput {
  const radiusM = 2.4e-6;
  const farRadiusM = 11.7e-6;
  const rosterItem = (
    caseId: string,
    requestedSpacingM: number,
    actualSpacingUmNumerator: number,
    actualSpacingUmDenominator: number,
  ): Phase10C0VRadialReferenceInput["roster"][number] => {
    const expectedIntervalCount = Math.max(
      2,
      Math.round((farRadiusM - radiusM) / requestedSpacingM),
    );
    return Object.freeze({
      caseId,
      requestedSpacingM,
      expectedIntervalCount,
      expectedNodeCount: expectedIntervalCount + 1,
      expectedActualSpacingM: (farRadiusM - radiusM) / expectedIntervalCount,
      actualSpacingUmNumerator,
      actualSpacingUmDenominator,
    });
  };
  return Object.freeze({
    protocolId: "synthetic-radial-reference-v1",
    operands: Object.freeze({
      radiusM,
      farRadiusM,
      sigmaInfinity: 0.013,
      tempC: -12,
      pressurePa: 85_000,
      alphaHKConst: 0.271,
      physicalConstants: Object.freeze({
        kBoltzmannJPerK: 1.42e-23,
        celsiusZeroK: 275,
        waterMoleculeMassKg: 3.2e-26,
        iceNumberDensityPerM3: 2.8e28,
        diffusivityAir1AtmM2S: 1.7e-5,
        standardAtmospherePa: 100_000,
        saturationPressurePrefactorMbar: 3.4e10,
        saturationPressureExponentK: -6_000,
        mbarToPa: 98,
      }),
    }),
    roster: Object.freeze([
      rosterItem("synthetic-coarse", 0.8e-6, 31, 40),
      rosterItem("synthetic-fine", 0.42e-6, 93, 220),
    ]),
    tolerances: Object.freeze({
      surfaceRelative: 1e-12,
      velocityRelative: 1e-12,
      fieldRelativeLInf: 1e-12,
      fieldWeightedRelativeL2: 1e-12,
      shellNormalized: 1e-12,
      uniformNormalizedLInf: 1e-12,
      robinResidualNormalized: 1e-12,
      generatorCheckerAgreement: 1e-12,
    }),
  });
}

function identified(value: number): Phase10C0VRadialCheckBinary64Identity {
  const view = new DataView(new ArrayBuffer(8));
  view.setFloat64(0, value, false);
  let binary64Hex = "";
  for (let offset = 0; offset < 8; offset++) {
    binary64Hex += view.getUint8(offset).toString(16).padStart(2, "0");
  }
  return Object.freeze({ decimal: Object.is(value, -0) ? "-0" : value.toString(), binary64Hex });
}

function replaceFirstCase(
  candidate: Phase10C0VRadialReferenceCandidate,
  replacement: Partial<Phase10C0VRadialReferenceCandidate["cases"][number]>,
): Phase10C0VRadialReferenceCandidate {
  return {
    ...candidate,
    cases: [{ ...candidate.cases[0]!, ...replacement }, ...candidate.cases.slice(1)],
  };
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

describe("Phase 10 C0V independent radial reference", () => {
  it("derives complete deterministic fields and passes the separate closed-form check", () => {
    const input = syntheticInput();
    const first = derivePhase10C0VRadialReference(input);
    const second = derivePhase10C0VRadialReference(input);
    expect(first).toEqual(second);
    expect(first.method).toBe("independent-2x2-harmonic-coefficients");
    expect(first.cases).toHaveLength(input.roster.length);
    expect(first.uniformFieldControl.cases).toHaveLength(input.roster.length);
    const expectedSaturationPressurePa =
      input.operands.physicalConstants.saturationPressurePrefactorMbar *
      Math.exp(
        input.operands.physicalConstants.saturationPressureExponentK /
        (input.operands.tempC + input.operands.physicalConstants.celsiusZeroK),
      ) * input.operands.physicalConstants.mbarToPa;
    expect(first.derivedPhysics.saturationPressurePa).toEqual(identified(expectedSaturationPressurePa));
    expect(Number(first.derivedPhysics.saturationPressurePa.decimal)).toBeLessThan(
      input.operands.physicalConstants.saturationPressurePrefactorMbar *
      input.operands.physicalConstants.mbarToPa,
    );
    for (const [index, result] of first.cases.entries()) {
      const expectedNodes = Math.max(
        3,
        Math.round((input.operands.farRadiusM - input.operands.radiusM) /
          input.roster[index]!.requestedSpacingM) + 1,
      );
      expect(result.nodeCount).toBe(expectedNodes);
      expect(result.samples).toHaveLength(expectedNodes);
      expect(result.samples[0]!.radiusM).toEqual(identified(input.operands.radiusM));
      expect(result.samples.at(-1)!.radiusM).toEqual(identified(input.operands.farRadiusM));
      expect(result.samples[0]!.sigma).toEqual(result.sigmaSurface);
      expect(result.samples.at(-1)!.sigma).toEqual(result.sigmaShell);
    }
    const check = independentlyCheckPhase10C0VRadialReference(input, first);
    expect(check.method).toBe("independent-closed-form-lambda");
    expect(check.exactOperandEcho).toBe(true);
    expect(check.exactRoster).toBe(true);
    expect(check.allFinite).toBe(true);
    expect(check.errors).toEqual([]);
    expect(check.cases.every((result) =>
      result.independentUniformFieldControl.samples.length === result.independent.nodeCount)).toBe(true);
    expect(check.cases.every((result) =>
      result.independentUniformFieldControl.samples.every((sample) =>
        sample.sigma.binary64Hex === identified(input.operands.sigmaInfinity).binary64Hex))).toBe(true);
    expect(check.cases.every((result) => result.pass)).toBe(true);
    expect(check.pass).toBe(true);
  });

  it("encodes every floating operand and result as a round-trippable big-endian binary64 identity", () => {
    const candidate = derivePhase10C0VRadialReference(syntheticInput());
    const visit = (value: unknown, path: string): void => {
      if (typeof value === "number") {
        expect(path).toMatch(/\.(?:nodeCount|nodeIndex)$/u);
        expect(Number.isSafeInteger(value)).toBe(true);
        return;
      }
      if (value === null || typeof value !== "object") return;
      if (
        Object.keys(value).length === 2 &&
        "decimal" in value && "binary64Hex" in value
      ) {
        const identity = value as Phase10C0VRadialCheckBinary64Identity;
        expect(identity.binary64Hex).toMatch(/^[0-9a-f]{16}$/u);
        expect(identified(Number(identity.decimal))).toEqual(identity);
        return;
      }
      if (Array.isArray(value)) {
        value.forEach((entry, index) => visit(entry, `${path}[${index}]`));
        return;
      }
      for (const [key, nested] of Object.entries(value)) visit(nested, `${path}.${key}`);
    };
    visit(candidate, "candidate");
  });

  it("binds actual spacing to the frozen node-rule evaluation rather than a nearby rational rounding", () => {
    const input = syntheticInput();
    const firstRoster = input.roster[0]!;
    const rationalConvertedM =
      (firstRoster.actualSpacingUmNumerator / firstRoster.actualSpacingUmDenominator) * 1e-6;
    // This synthetic fixture deliberately preserves the same one-ulp seam as the frozen roster:
    // the rational is the exact mathematical micrometre value, while binary64 actual spacing is
    // evaluated from (farRadiusM - radiusM) / intervalCount in that exact order.
    expect(Object.is(firstRoster.expectedActualSpacingM, rationalConvertedM)).toBe(false);
    const candidate = derivePhase10C0VRadialReference(input);
    expect(candidate.cases[0]!.actualSpacingM).toEqual(identified(firstRoster.expectedActualSpacingM));
    const wrongBinary64 = {
      ...input,
      roster: [{ ...firstRoster, expectedActualSpacingM: rationalConvertedM }, ...input.roster.slice(1)],
    };
    expect(() => derivePhase10C0VRadialReference(wrongBinary64)).toThrow(
      /frozen node count or actual spacing differs/u,
    );
    const wrongRational = {
      ...input,
      roster: [{ ...firstRoster, actualSpacingUmNumerator: 32 }, ...input.roster.slice(1)],
    };
    expect(() => derivePhase10C0VRadialReference(wrongRational)).toThrow(
      /micrometre rational differs/u,
    );
  });

  it("rejects a changed attachment coefficient instead of accepting a coherent second candidate", () => {
    const input = syntheticInput();
    const changed = {
      ...input,
      operands: { ...input.operands, alphaHKConst: input.operands.alphaHKConst * 1.05 },
    };
    const candidate = derivePhase10C0VRadialReference(changed);
    const check = independentlyCheckPhase10C0VRadialReference(input, candidate);
    expect(check.exactOperandEcho).toBe(false);
    expect(check.pass).toBe(false);
    expect(check.errors).toContain("candidate exact operand echo differs");
  });

  it("requires the saturation-pressure exponent operand to carry its signed negative value", () => {
    const input = syntheticInput();
    const wrongSign = {
      ...input,
      operands: {
        ...input.operands,
        physicalConstants: {
          ...input.operands.physicalConstants,
          saturationPressureExponentK: Math.abs(
            input.operands.physicalConstants.saturationPressureExponentK,
          ),
        },
      },
    };
    expect(() => derivePhase10C0VRadialReference(wrongSign)).toThrow(/signed negative exponent/u);
    expect(() => independentlyCheckPhase10C0VRadialReference(wrongSign, derivePhase10C0VRadialReference(input)))
      .toThrow(/signed negative exponent/u);
  });

  it("detects a removed finite-shell contribution in the harmonic field", () => {
    const input = syntheticInput();
    const candidate = derivePhase10C0VRadialReference(input);
    const first = candidate.cases[0]!;
    const harmonicConstant = Number(first.harmonicConstant.decimal);
    const inverseCoefficient = Number(first.harmonicInverseRadiusCoefficientM.decimal);
    const removedShellTermConstant = harmonicConstant - inverseCoefficient / input.operands.farRadiusM;
    const samples = first.samples.map((sample) => ({
      ...sample,
      sigma: identified(removedShellTermConstant + inverseCoefficient / Number(sample.radiusM.decimal)),
    }));
    const mutated = replaceFirstCase(candidate, {
      harmonicConstant: identified(removedShellTermConstant),
      sigmaSurface: samples[0]!.sigma,
      sigmaShell: samples.at(-1)!.sigma,
      samples,
    });
    const check = independentlyCheckPhase10C0VRadialReference(input, mutated);
    expect(check.cases[0]!.metrics.shellNormalized.pass).toBe(false);
    expect(check.cases[0]!.metrics.fieldRelativeLInf.pass).toBe(false);
    expect(check.pass).toBe(false);
  });

  it("pins the standard field Linf and spherical-trapezoid weighted relative L2 formulas", () => {
    const input = syntheticInput();
    const candidate = derivePhase10C0VRadialReference(input);
    const cleanCheck = independentlyCheckPhase10C0VRadialReference(input, candidate);
    const first = candidate.cases[0]!;
    const samples = first.samples.map((sample, index) => {
      const offset = index === 0 ? 2e-6 : index === 1 ? -1e-6 : 0;
      return { ...sample, sigma: identified(Number(sample.sigma.decimal) + offset) };
    });
    const mutated = replaceFirstCase(candidate, { samples });
    const check = independentlyCheckPhase10C0VRadialReference(input, mutated);
    const referenceSamples = cleanCheck.cases[0]!.independent.samples;
    const actualSpacingM = Number(cleanCheck.cases[0]!.independent.actualSpacingM.decimal);
    let weightedErrorSquared = 0;
    let weightedReferenceSquared = 0;
    let maxAbsoluteError = 0;
    let maxAbsoluteReference = 0;
    for (const [index, referenceSample] of referenceSamples.entries()) {
      const radiusM = Number(referenceSample.radiusM.decimal);
      const referenceSigma = Number(referenceSample.sigma.decimal);
      const observedSigma = Number(samples[index]!.sigma.decimal);
      const endpointFactor = index === 0 || index === referenceSamples.length - 1 ? 0.5 : 1;
      const weight = endpointFactor * radiusM * radiusM * actualSpacingM;
      weightedErrorSquared += weight * (observedSigma - referenceSigma) ** 2;
      weightedReferenceSquared += weight * referenceSigma ** 2;
      maxAbsoluteError = Math.max(maxAbsoluteError, Math.abs(observedSigma - referenceSigma));
      maxAbsoluteReference = Math.max(maxAbsoluteReference, Math.abs(referenceSigma));
    }
    const expectedL2 = Math.sqrt(weightedErrorSquared / weightedReferenceSquared);
    const expectedLInf = maxAbsoluteError / maxAbsoluteReference;
    expect(Number(check.cases[0]!.metrics.fieldWeightedRelativeL2.value.decimal)).toBeCloseTo(expectedL2, 15);
    expect(Number(check.cases[0]!.metrics.fieldRelativeLInf.value.decimal)).toBeCloseTo(expectedLInf, 15);
    expect(check.cases[0]!.metrics.fieldWeightedRelativeL2.pass).toBe(false);
    expect(check.cases[0]!.metrics.fieldRelativeLInf.pass).toBe(false);
  });

  it("detects independently targeted surface, field, velocity, Robin, and uniform mutations", () => {
    const input = syntheticInput();
    const candidate = derivePhase10C0VRadialReference(input);
    const first = candidate.cases[0]!;
    const mutations: readonly [string, Phase10C0VRadialReferenceCandidate, (check: ReturnType<typeof independentlyCheckPhase10C0VRadialReference>) => boolean][] = [
      [
        "surface",
        replaceFirstCase(candidate, { sigmaSurface: identified(Number(first.sigmaSurface.decimal) * 1.001) }),
        (check) => !check.cases[0]!.metrics.surfaceRelative.pass,
      ],
      [
        "field",
        replaceFirstCase(candidate, {
          samples: [
            first.samples[0]!,
            { ...first.samples[1]!, sigma: identified(Number(first.samples[1]!.sigma.decimal) * 1.001) },
            ...first.samples.slice(2),
          ],
        }),
        (check) => !check.cases[0]!.metrics.fieldRelativeLInf.pass,
      ],
      [
        "velocity",
        replaceFirstCase(candidate, {
          growthVelocityFluxMS: identified(Number(first.growthVelocityFluxMS.decimal) * 1.001),
        }),
        (check) => !check.cases[0]!.metrics.velocityRelative.pass,
      ],
      [
        "Robin residual",
        replaceFirstCase(candidate, { robinResidual: identified(1e-5) }),
        (check) => !check.cases[0]!.metrics.robinResidualNormalized.pass,
      ],
      [
        "uniform field",
        {
          ...candidate,
          uniformFieldControl: {
            ...candidate.uniformFieldControl,
            cases: [{
              ...candidate.uniformFieldControl.cases[0]!,
              samples: [
                { ...candidate.uniformFieldControl.cases[0]!.samples[0]!, sigma: identified(input.operands.sigmaInfinity * 1.001) },
                ...candidate.uniformFieldControl.cases[0]!.samples.slice(1),
              ],
            }, ...candidate.uniformFieldControl.cases.slice(1)],
          },
        },
        (check) => !check.cases[0]!.metrics.uniformNormalizedLInf.pass,
      ],
    ];
    for (const [label, mutated, attacked] of mutations) {
      const check = independentlyCheckPhase10C0VRadialReference(input, mutated);
      expect(attacked(check), label).toBe(true);
      expect(check.pass, label).toBe(false);
    }
  });

  it("refuses malformed decimal/binary64 pairs", () => {
    const input = syntheticInput();
    const candidate = derivePhase10C0VRadialReference(input);
    const malformed = {
      ...candidate,
      operands: {
        ...candidate.operands,
        radiusM: { ...candidate.operands.radiusM, binary64Hex: "0000000000000000" },
      },
    };
    expect(() => independentlyCheckPhase10C0VRadialReference(input, malformed)).toThrow(
      /decimal\/binary64 identity differs/u,
    );
  });

  it("keeps both scientific paths outside production/core imports and outside each other", () => {
    const derivePath = join(REPOSITORY_ROOT, "runner/src/phase10-c0v-radial-reference-derive.ts");
    const checkPath = join(REPOSITORY_ROOT, "runner/src/phase10-c0v-radial-reference-check.ts");
    const deriveSource = readFileSync(derivePath, "utf8");
    const checkSource = readFileSync(checkPath, "utf8");
    expect(importSpecifiers(deriveSource)).toEqual(["./phase10-c0v-contracts.ts"]);
    expect(importSpecifiers(checkSource)).toEqual(["./phase10-c0v-contracts.ts"]);
    for (const source of [deriveSource, checkSource]) {
      expect(source).not.toMatch(/from\s+["'][^"']*(?:solver-cpu|@vcc\/core|lk-solver|spherical-reference|production)[^"']*["']/u);
      expect(source).not.toMatch(/import\s*\([^)]*(?:solver-cpu|@vcc\/core|lk-solver|spherical-reference|production)/u);
    }
    expect(deriveSource).not.toContain("phase10-c0v-radial-reference-check.ts");
    expect(checkSource).not.toContain("phase10-c0v-radial-reference-derive.ts");
    const deriveClosure = relativeImportClosure(derivePath);
    const checkClosure = relativeImportClosure(checkPath);
    const sharedClosure = [...deriveClosure]
      .filter((path) => path !== derivePath && path !== checkPath && checkClosure.has(path))
      .map((path) => relative(REPOSITORY_ROOT, path).replaceAll("\\", "/"))
      .sort();
    expect(sharedClosure).toEqual([
      "runner/src/gate4-evidence.ts",
      "runner/src/phase10-c0v-contracts.ts",
    ]);
    for (const path of new Set([...deriveClosure, ...checkClosure])) {
      expect(relative(REPOSITORY_ROOT, path)).not.toMatch(/(?:^|[\\/])(?:core|solver-cpu)(?:[\\/]|$)/u);
    }
  });
});
