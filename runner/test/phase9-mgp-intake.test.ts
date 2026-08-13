import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { canonicalJson } from "../src/gate4-evidence.js";
import {
  verifyPhase9MgpIntake,
  type Phase9MgpIntakeVerificationInputs,
} from "../src/phase9-mgp-intake-verify.js";
import {
  detectPhase9NasRoot,
  resolvePhase9NasFile,
} from "../src/phase9-nas.js";

const PATHS = {
  protocol: "research/phase9-mgp-intake-protocol-v1.json",
  registry: "research/phase9-mgp-development-registry-v1.jsonl",
  shelfFreeze: "evidence/phase9-source-overlay-v1/shelf-freeze.json",
  sourceOverlay: "evidence/phase9-source-overlay-v1/source-overlay.jsonl",
  sourceDispositions: "research/phase9-source-dispositions-v1.jsonl",
  sourceAudits: "research/phase9-source-audits-v1.jsonl",
  reconSourceRegister: "evidence/phase8b-s2-round0-reconnaissance/source-register.jsonl",
  historicalAuditBatch1: "evidence/phase8b-s2-round0-reconnaissance/historical-batch-1.md",
  historicalAuditBatch2: "evidence/phase8b-s2-round0-reconnaissance/historical-batch-2.md",
} as const;

function bytes(path: string): Uint8Array {
  return new Uint8Array(readFileSync(path));
}

function registeredInputs(): Phase9MgpIntakeVerificationInputs {
  return {
    protocolBytes: bytes(PATHS.protocol),
    registryBytes: bytes(PATHS.registry),
    shelfFreezeBytes: bytes(PATHS.shelfFreeze),
    sourceOverlayBytes: bytes(PATHS.sourceOverlay),
    sourceDispositionsBytes: bytes(PATHS.sourceDispositions),
    sourceAuditsBytes: bytes(PATHS.sourceAudits),
    reconSourceRegisterBytes: bytes(PATHS.reconSourceRegister),
    historicalAuditBatch1Bytes: bytes(PATHS.historicalAuditBatch1),
    historicalAuditBatch2Bytes: bytes(PATHS.historicalAuditBatch2),
  };
}

function parseProtocol(inputs: Phase9MgpIntakeVerificationInputs): Record<string, unknown> {
  return JSON.parse(new TextDecoder().decode(inputs.protocolBytes)) as Record<string, unknown>;
}

function protocolBytes(protocol: Record<string, unknown>): Uint8Array {
  return new TextEncoder().encode(`${JSON.stringify(protocol, null, 2)}\n`);
}

function registryRows(inputs: Phase9MgpIntakeVerificationInputs): Record<string, unknown>[] {
  return new TextDecoder().decode(inputs.registryBytes).trimEnd().split("\n")
    .map((line) => JSON.parse(line) as Record<string, unknown>);
}

function registryBytes(rows: readonly Record<string, unknown>[]): Uint8Array {
  return new TextEncoder().encode(`${rows.map((row) => canonicalJson(row)).join("\n")}\n`);
}

function coherentlyRepinRegistry(
  inputs: Phase9MgpIntakeVerificationInputs,
  mutate: (rows: Record<string, unknown>[]) => void,
  mutateProtocol: (protocol: Record<string, unknown>) => void = () => undefined,
): Phase9MgpIntakeVerificationInputs {
  const rows = registryRows(inputs);
  mutate(rows);
  const changedRegistryBytes = registryBytes(rows);
  const protocol = parseProtocol(inputs);
  const registry = protocol.registry as Record<string, unknown> | undefined;
  if (registry === undefined) throw new Error("fixture registry missing");
  registry.byteLength = changedRegistryBytes.byteLength;
  registry.sha256 = createHash("sha256").update(changedRegistryBytes).digest("hex");
  mutateProtocol(protocol);
  return {
    ...inputs,
    registryBytes: changedRegistryBytes,
    protocolBytes: protocolBytes(protocol),
  };
}

describe("Phase 9 M-GP source-only intake", () => {
  it("verifies the exact four-source registry and produces no score", () => {
    expect(verifyPhase9MgpIntake(registeredInputs())).toEqual({
      ok: true,
      protocolId: "phase9-mgp-four-source-development-intake-v1",
      sourceCount: 4,
      recordCount: 26,
      numericDigitizationCandidates: 14,
      categoricalImageConstraints: 7,
      printedNumericTranscriptions: 2,
      numericExtractionRefusals: 1,
      sourceDerivedExclusions: 2,
      digitizedCoordinateCount: 0,
      sourceDataScoresProduced: 0,
      mpkRemainsPending: true,
      grantsValidationClaim: false,
    });
  });

  it("resolves every source only through the portable NAS resolver when the share is present", () => {
    const nasRoot = detectPhase9NasRoot();
    if (nasRoot === null) return;
    const protocol = parseProtocol(registeredInputs()) as {
      sourceBindings?: readonly { shareRelativePath?: string; byteLength?: number }[];
    };
    expect(protocol.sourceBindings).toHaveLength(4);
    for (const binding of protocol.sourceBindings ?? []) {
      expect(typeof binding.shareRelativePath).toBe("string");
      const resolved = resolvePhase9NasFile(binding.shareRelativePath as string, nasRoot);
      expect(resolved).toMatchObject({ kind: "ok", byteLength: binding.byteLength });
    }
  });

  it("rejects an altered bound authority artifact", () => {
    const inputs = registeredInputs();
    const changed = new Uint8Array(inputs.shelfFreezeBytes.byteLength);
    changed.set(inputs.shelfFreezeBytes);
    changed[10] = (changed[10] as number) ^ 1;
    expect(() => verifyPhase9MgpIntake({ ...inputs, shelfFreezeBytes: changed }))
      .toThrow(/shelf freeze digest differs/u);
  });

  it("rejects source identity, page, and audit mutations", () => {
    const inputs = registeredInputs();
    for (const mutate of [
      (source: Record<string, unknown>) => { source.sha256 = "0".repeat(64); },
      (source: Record<string, unknown>) => { source.pageCount = 99; },
      (source: Record<string, unknown>) => {
        (source.auditEvidence as Record<string, unknown>).sha256 = "0".repeat(64);
      },
      (source: Record<string, unknown>) => { source.loadBearingPages = [0]; },
    ]) {
      const protocol = parseProtocol(inputs) as { sourceBindings?: Record<string, unknown>[] };
      mutate(protocol.sourceBindings?.[0] as Record<string, unknown>);
      expect(() => verifyPhase9MgpIntake({ ...inputs, protocolBytes: protocolBytes(protocol) }))
        .toThrow();
    }
  });

  it("rejects incomplete M-GP restriction handling and any attempted M-PK discharge", () => {
    const inputs = registeredInputs();
    const withoutRestriction = parseProtocol(inputs) as {
      restrictionDispositions?: Record<string, unknown>[];
    };
    withoutRestriction.restrictionDispositions?.pop();
    expect(() => verifyPhase9MgpIntake({
      ...inputs,
      protocolBytes: protocolBytes(withoutRestriction),
    })).toThrow(/restriction order differs|restriction disposition coverage differs/u);

    const discharged = parseProtocol(inputs) as {
      exactShelfBindings?: { mpk?: Record<string, unknown> };
    };
    if (discharged.exactShelfBindings?.mpk !== undefined) {
      discharged.exactShelfBindings.mpk.protocolDispositionState = "complete";
      discharged.exactShelfBindings.mpk.requiredRestrictionCount = 0;
    }
    expect(() => verifyPhase9MgpIntake({
      ...inputs,
      protocolBytes: protocolBytes(discharged),
    })).toThrow(/M-PK pending semantics exact semantic binding differs|M-PK protocol restriction count differs/u);
  });

  it("rejects invented plot coordinates, image numerics, and surface claims", () => {
    const inputs = registeredInputs();
    const mutations: readonly ((row: Record<string, unknown>) => void)[] = [
      (row) => {
        const digitization = row.digitization as Record<string, unknown>;
        digitization.authorized = true;
        digitization.coordinates = [{ x: 1, y: 2 }];
      },
      (row) => { row.directTranscription = { sizeMicrometres: 42 }; },
      (row) => {
        const boundary = row.claimBoundary as Record<string, unknown>;
        boundary.surfaceKineticsInferenceAuthorized = true;
      },
    ];
    for (const mutate of mutations) {
      const rows = registryRows(inputs);
      mutate(rows[0] as Record<string, unknown>);
      expect(() => verifyPhase9MgpIntake({ ...inputs, registryBytes: registryBytes(rows) }))
        .toThrow();
    }
  });

  it("pins Isono elapsed labels to minutes and strict source order", () => {
    const inputs = registeredInputs();
    for (const mutate of [
      (transcription: Record<string, unknown>) => { transcription.unit = "s"; },
      (transcription: Record<string, unknown>) => {
        const panels = transcription.panels as Record<string, unknown>[];
        (panels[1] as Record<string, unknown>).elapsed = 0;
      },
      (transcription: Record<string, unknown>) => {
        const panels = transcription.panels as Record<string, unknown>[];
        (panels[0] as Record<string, unknown>).gas = "carbon-dioxide";
      },
    ]) {
      const rows = registryRows(inputs);
      const timeline = rows.find((row) => row.recordId === "MGP-I57-F09-TIMELINE") as Record<string, unknown>;
      mutate(timeline.directTranscription as Record<string, unknown>);
      expect(() => verifyPhase9MgpIntake({ ...inputs, registryBytes: registryBytes(rows) }))
        .toThrow();
    }
  });

  it("keeps the Gonda 1976 Figure 3 condition conflict a hard refusal", () => {
    const inputs = registeredInputs();
    const rows = registryRows(inputs);
    const refused = rows.find((row) => row.recordId === "MGP-G76-F03-SIZE-REFUSED") as Record<string, unknown>;
    refused.intakeClass = "numeric-digitization-candidate";
    (refused.digitization as Record<string, unknown>).reasonCode = "OPERATOR_NOT_FROZEN";
    expect(() => verifyPhase9MgpIntake({ ...inputs, registryBytes: registryBytes(rows) }))
      .toThrow();
  });

  it("rejects any record with a collapsed or missing condition field", () => {
    const inputs = registeredInputs();
    const forged = coherentlyRepinRegistry(inputs, (rows) => {
      delete (rows[0]?.conditions as Record<string, unknown>).ventilation;
    });
    expect(() => verifyPhase9MgpIntake(forged))
      .toThrow(/exact semantic binding differs/u);
  });

  it("rejects coherently repinned row, source, locator, temperature, time, and observable forgeries", () => {
    const inputs = registeredInputs();
    const forgeries: readonly ((rows: Record<string, unknown>[]) => void)[] = [
      (rows) => { (rows[0] as Record<string, unknown>).recordId = "MGP-FORGED"; },
      (rows) => { (rows[0] as Record<string, unknown>).sourceRecordId = "P8B-S2R0-6A121A2582ADC93B0F160AC7"; },
      (rows) => { ((rows[0] as Record<string, unknown>).locator as Record<string, unknown>).pages = [5]; },
      (rows) => { ((rows[0] as Record<string, unknown>).conditions as Record<string, unknown>).temperatureC = "printed fixed -14"; },
      (rows) => { ((rows[0] as Record<string, unknown>).conditions as Record<string, unknown>).elapsedTime = "seconds; arbitrary"; },
      (rows) => { (rows[0] as Record<string, unknown>).observable = "forged observable"; },
    ];
    for (const forge of forgeries) {
      expect(() => verifyPhase9MgpIntake(coherentlyRepinRegistry(inputs, forge)))
        .toThrow(/exact semantic|record order/u);
    }
  });

  it("rejects coherently repinned complete Isono timeline forgeries", () => {
    const inputs = registeredInputs();
    for (const recordId of ["MGP-I57-F09-TIMELINE", "MGP-I57-F10-TIMELINE"]) {
      const forged = coherentlyRepinRegistry(inputs, (rows) => {
        const row = rows.find((value) => value.recordId === recordId) as Record<string, unknown>;
        const transcription = row.directTranscription as Record<string, unknown>;
        const panels = transcription.panels as Record<string, unknown>[];
        transcription.panels = panels.map((panel) => ({ ...panel, elapsed: (panel.elapsed as number) + 1 }));
      });
      expect(() => verifyPhase9MgpIntake(forged)).toThrow(/exact semantic binding differs/u);
    }
  });

  it("rejects a coherently repinned swap of the Figure 3 refusal and derived exclusion", () => {
    const inputs = registeredInputs();
    const forged = coherentlyRepinRegistry(inputs, (rows) => {
      const refused = rows.find((row) => row.recordId === "MGP-G76-F03-SIZE-REFUSED") as Record<string, unknown>;
      const excluded = rows.find((row) => row.recordId === "MGP-G76-F07F08-SCHEMATIC") as Record<string, unknown>;
      const refusedClass = refused.intakeClass;
      const refusedDigitization = refused.digitization;
      const refusedRefusals = refused.refusals;
      refused.intakeClass = excluded.intakeClass;
      refused.digitization = excluded.digitization;
      refused.refusals = excluded.refusals;
      excluded.intakeClass = refusedClass;
      excluded.digitization = refusedDigitization;
      excluded.refusals = refusedRefusals;
    });
    expect(() => verifyPhase9MgpIntake(forged)).toThrow(/exact semantic binding differs/u);
  });

  it("rejects exact source path, citation, load-bearing-page, audit, and visual-audit forgeries", () => {
    const inputs = registeredInputs();
    const protocolForgeries: readonly ((protocol: Record<string, unknown>) => void)[] = [
      (protocol) => { ((protocol.sourceBindings as Record<string, unknown>[])[0] as Record<string, unknown>).shareRelativePath = "research-cache/forged.pdf"; },
      (protocol) => { ((protocol.sourceBindings as Record<string, unknown>[])[0] as Record<string, unknown>).citation = "forged citation"; },
      (protocol) => { ((protocol.sourceBindings as Record<string, unknown>[])[0] as Record<string, unknown>).loadBearingPages = [1]; },
      (protocol) => { (((protocol.sourceBindings as Record<string, unknown>[])[0] as Record<string, unknown>).auditEvidence as Record<string, unknown>).registeredLocator = "pdf-pages:1-1"; },
      (protocol) => { ((protocol.visualAudit as Record<string, unknown>).resolvedFindings as string[])[0] = "forged finding"; },
    ];
    for (const forge of protocolForgeries) {
      const protocol = parseProtocol(inputs);
      forge(protocol);
      expect(() => verifyPhase9MgpIntake({ ...inputs, protocolBytes: protocolBytes(protocol) }))
        .toThrow(/exact semantic binding differs/u);
    }
  });

  it("rejects exact seven-disposition and M-PK pending-semantic forgeries", () => {
    const inputs = registeredInputs();
    for (const forge of [
      (protocol: Record<string, unknown>) => {
        ((protocol.restrictionDispositions as Record<string, unknown>[])[0] as Record<string, unknown>).handling = "forged handling";
      },
      (protocol: Record<string, unknown>) => {
        (((protocol.exactShelfBindings as Record<string, unknown>).mpk as Record<string, unknown>)).meaning = "M-PK is cleared";
      },
      (protocol: Record<string, unknown>) => {
        (((protocol.exactShelfBindings as Record<string, unknown>).mpk as Record<string, unknown>)).protocolDispositionState = "complete";
      },
    ]) {
      const protocol = parseProtocol(inputs);
      forge(protocol);
      expect(() => verifyPhase9MgpIntake({ ...inputs, protocolBytes: protocolBytes(protocol) }))
        .toThrow(/exact semantic binding differs/u);
    }
  });

  it("rejects coherently repinned validation-claim fields at every exact protocol container", () => {
    const inputs = registeredInputs();
    const forgeries = [
      {
        expectedError: /M-GP protocol key set differs/u,
        mutate: (protocol: Record<string, unknown>) => {
          protocol.validationClaimAuthorized = true;
        },
      },
      {
        expectedError: /upstream bindings key set differs/u,
        mutate: (protocol: Record<string, unknown>) => {
          (protocol.upstreamBindings as Record<string, unknown>).validationClaimAuthorized = true;
        },
      },
      {
        expectedError: /exact shelf bindings key set differs/u,
        mutate: (protocol: Record<string, unknown>) => {
          (protocol.exactShelfBindings as Record<string, unknown>).validationClaimAuthorized = true;
        },
      },
    ] as const;
    for (const forgery of forgeries) {
      const forged = coherentlyRepinRegistry(inputs, () => undefined, forgery.mutate);
      expect(() => verifyPhase9MgpIntake(forged)).toThrow(forgery.expectedError);
    }
  });
});
