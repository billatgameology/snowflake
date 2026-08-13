import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import {
  deriveDiagnosticReynoldsUpperBound,
  evaluateVentilationCompatibility,
  PHASE9_MV_SOURCE_RELATIVE_REGISTRY,
  PHASE9_MV_VENTILATION_CONFOUND_LABEL,
  TAKAHASHI_LOW_REYNOLDS_BOUND_EXCLUSIVE,
} from "../src/phase9-mv-eligibility.js";

describe("Phase 9 M-V runtime eligibility", () => {
  it("matches the protocol's final implementation identities", () => {
    const protocol = JSON.parse(readFileSync("research/phase9-mv-protocol-v1.json", "utf8")) as {
      implementation: {
        path: string;
        byteLength: number;
        sha256: string;
        preflightPath: string;
        preflightByteLength: number;
        preflightSha256: string;
      };
    };
    const implementation = readFileSync(protocol.implementation.path);
    const preflight = readFileSync(protocol.implementation.preflightPath);
    expect(implementation.byteLength).toBe(protocol.implementation.byteLength);
    expect(createHash("sha256").update(implementation).digest("hex")).toBe(protocol.implementation.sha256);
    expect(preflight.byteLength).toBe(protocol.implementation.preflightByteLength);
    expect(createHash("sha256").update(preflight).digest("hex")).toBe(protocol.implementation.preflightSha256);
  });

  it("keeps the Reynolds calculation analytic and unable to open eligibility", () => {
    expect(TAKAHASHI_LOW_REYNOLDS_BOUND_EXCLUSIVE).toBe(2);
    expect(deriveDiagnosticReynoldsUpperBound({
      airDensityUpper: { value: 1.3, unit: "kg/m3" },
      speedUpper: { value: 0.01, unit: "m/s" },
      aAxisLengthUpper: { value: 0.001, unit: "m" },
      dynamicViscosityLower: { value: 1.3e-5, unit: "Pa s" },
    })).toBeCloseTo(1, 14);
    expect(evaluateVentilationCompatibility({
      purpose: "absolute-score-under-low-re-approximation",
    })).toEqual({
      status: "ineligible",
      reasonCode: "absolute-byte-bound-record-unavailable",
      detail: expect.stringContaining("No frozen consuming-arm record"),
    });
    expect(evaluateVentilationCompatibility({
      purpose: "absolute-score-under-low-re-approximation",
      maximumReynoldsNumber: 1,
    })).toMatchObject({ status: "ineligible", reasonCode: "purpose-unknown" });
  });

  it("rejects malformed diagnostic operands and does not treat them as provenance", () => {
    const base = {
      airDensityUpper: { value: 1.3, unit: "kg/m3" },
      speedUpper: { value: 0.01, unit: "m/s" },
      aAxisLengthUpper: { value: 0.001, unit: "m" },
      dynamicViscosityLower: { value: 1.3e-5, unit: "Pa s" },
    };
    for (const value of [-0, Number.POSITIVE_INFINITY, Number.NaN]) {
      expect(() => deriveDiagnosticReynoldsUpperBound({
        ...base,
        speedUpper: { value, unit: "m/s" },
      })).toThrow();
    }
    expect(() => deriveDiagnosticReynoldsUpperBound({
      ...base,
      airDensityUpper: { value: Number.MAX_VALUE, unit: "kg/m3" },
      speedUpper: { value: Number.MAX_VALUE, unit: "m/s" },
    })).toThrow(/overflowed/u);
    expect(() => deriveDiagnosticReynoldsUpperBound({
      ...base,
      evidenceId: "caller-proof",
    })).toThrow(/keys differ/u);
  });

  it("accepts only exact closed-registry source-order records", () => {
    expect(PHASE9_MV_SOURCE_RELATIVE_REGISTRY).toHaveLength(10);
    expect(Object.isFrozen(PHASE9_MV_SOURCE_RELATIVE_REGISTRY)).toBe(true);
    expect(Object.isFrozen(PHASE9_MV_SOURCE_RELATIVE_REGISTRY[0])).toBe(true);
    expect(Object.isFrozen(PHASE9_MV_SOURCE_RELATIVE_REGISTRY[0]!.rowArtifactIdentity)).toBe(true);
    for (const record of PHASE9_MV_SOURCE_RELATIVE_REGISTRY) {
      expect(evaluateVentilationCompatibility({
        purpose: "source-reported-relative-order-span",
        sourceRelativeRecord: record,
      })).toMatchObject({
        status: "eligible-with-limitation",
        reasonCode: "source-reported-order-span-only",
        sourceRecordId: record.sourceRecordId,
      });
    }

    const base = structuredClone(PHASE9_MV_SOURCE_RELATIVE_REGISTRY[0]);
    const mutations: readonly [string, unknown][] = [
      ["sourceRecordId", "P8B-P1-SD71-M99"],
      ["rowArtifactIdentity", { ...base.rowArtifactIdentity, sha256: "0".repeat(64) }],
      ["interventionAxis", "gas-and-diffusivity"],
      ["orderSpanSemantics", "confidence-interval"],
      ["ventilationConfoundLabel", "unconfounded"],
    ];
    for (const [key, value] of mutations) {
      const changed = { ...base, [key]: value };
      expect(evaluateVentilationCompatibility({
        purpose: "source-reported-relative-order-span",
        sourceRelativeRecord: changed,
      }), key).toMatchObject({
        status: "ineligible",
        reasonCode: "source-relative-record-unavailable",
      });
    }
    expect(base.ventilationConfoundLabel).toBe(PHASE9_MV_VENTILATION_CONFOUND_LABEL);
  });

  it("keeps the private eligibility registry unchanged by attempted exported mutations", () => {
    const publicEntry = PHASE9_MV_SOURCE_RELATIVE_REGISTRY[0]! as {
      sourceRecordId: string;
      rowArtifactIdentity: { byteLength: number };
    };
    const original = structuredClone(PHASE9_MV_SOURCE_RELATIVE_REGISTRY[0]!);
    expect(() => {
      publicEntry.sourceRecordId = "P8B-P1-SD71-M99";
    }).toThrow(TypeError);
    expect(() => {
      publicEntry.rowArtifactIdentity.byteLength += 1;
    }).toThrow(TypeError);
    expect(PHASE9_MV_SOURCE_RELATIVE_REGISTRY[0]).toEqual(original);
    expect(evaluateVentilationCompatibility({
      purpose: "source-reported-relative-order-span",
      sourceRelativeRecord: original,
    })).toMatchObject({
      status: "eligible-with-limitation",
      reasonCode: "source-reported-order-span-only",
      sourceRecordId: original.sourceRecordId,
    });
  });

  it("blocks caller-asserted paired records and unqualified still-air transfer", () => {
    expect(evaluateVentilationCompatibility({
      purpose: "relative-intervention-direction",
    })).toMatchObject({
      status: "ineligible",
      reasonCode: "paired-byte-bound-record-unavailable",
    });
    expect(evaluateVentilationCompatibility({
      purpose: "relative-intervention-direction",
      pairedVentilationProtocolMatched: true,
    })).toMatchObject({ status: "ineligible", reasonCode: "purpose-unknown" });
    expect(evaluateVentilationCompatibility({
      purpose: "unqualified-still-air-transfer",
    })).toMatchObject({
      status: "ineligible",
      reasonCode: "unqualified-still-air-transfer-forbidden",
    });
    expect(evaluateVentilationCompatibility({ purpose: "unknown" })).toMatchObject({
      status: "ineligible",
      reasonCode: "purpose-unknown",
    });
  });
});
