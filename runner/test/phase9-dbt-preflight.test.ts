import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  PHASE9_DBT_PREFLIGHT_MUTATIONS,
  phase9DbtRunLaunchPreflight,
  type Phase9DbtArtifactIdentity,
  type Phase9DbtLaunchManifest,
  type Phase9DbtPreflightProtocol,
} from "../src/phase9-dbt-preflight.ts";

const PROTOCOL_PATH = "research/phase9-dbt-protocol-v1.json";
const MODEL_PATH = "runner/src/phase9-dbt-model.ts";
const TEST_PATH = "runner/test/phase9-dbt-model.test.ts";
const PREFLIGHT_PATH = "runner/src/phase9-dbt-preflight.ts";
const PREFLIGHT_TEST_PATH = "runner/test/phase9-dbt-preflight.test.ts";

function identity(path: string): Phase9DbtArtifactIdentity {
  const bytes = readFileSync(path);
  return {
    path,
    byteLength: bytes.byteLength,
    sha256: createHash("sha256").update(bytes).digest("hex"),
  };
}

function protocol(): Phase9DbtPreflightProtocol {
  return JSON.parse(readFileSync(PROTOCOL_PATH, "utf8")) as Phase9DbtPreflightProtocol;
}

function normalizedActualMappings(frozen: Phase9DbtPreflightProtocol) {
  const records = readFileSync("research/phase9-adapter-registry-v1.jsonl", "utf8")
    .trim()
    .split("\n")
    .map((line) => JSON.parse(line) as {
      readonly selectionId: string;
      readonly adapterKind: string;
      readonly bindingKind: string;
      readonly requestedUses: readonly {
        readonly purpose: string;
        readonly status: string;
      }[];
    });
  return frozen.primaryRoster.map((entry) => {
    const record = records.find((candidate) => candidate.selectionId === entry.selectionId);
    if (record === undefined) throw new Error(`missing actual S1 record ${entry.selectionId}`);
    return {
      selectionId: record.selectionId,
      adapterKind: record.adapterKind,
      bindingKind: record.bindingKind,
      scalarMassHistoryDevelopmentStatus: record.requestedUses.find(
        (use) => use.purpose === "scalar-mass-history-development",
      )?.status,
      unqualifiedFreeParticleTransferStatus: record.requestedUses.find(
        (use) => use.purpose === "unqualified-free-particle-transfer",
      )?.status,
    };
  });
}

function actualSourceOverlayShelf(frozen: Phase9DbtPreflightProtocol) {
  const published = JSON.parse(
    readFileSync(frozen.upstreamBindings.sourceOverlay.shelfFreezePath, "utf8"),
  ) as {
    readonly schema: string;
    readonly shelf: readonly Record<string, unknown>[];
  };
  const row = published.shelf.find((entry) => entry.item === "D-BT");
  if (row === undefined) throw new Error("published S0B shelf lacks D-BT");
  return { schema: published.schema, row } as unknown as
    Phase9DbtLaunchManifest["sourceOverlayShelf"];
}

function registration(frozen: Phase9DbtPreflightProtocol): Phase9DbtLaunchManifest {
  const sourceOverlayIdentity = identity(frozen.upstreamBindings.sourceOverlay.shelfFreezePath);
  return {
    schema: "phase9-dbt-launch-manifest-v1",
    identities: {
      protocol: identity(PROTOCOL_PATH),
      implementation: identity(MODEL_PATH),
      test: identity(TEST_PATH),
      preflightImplementation: identity(PREFLIGHT_PATH),
      preflightTest: identity(PREFLIGHT_TEST_PATH),
      sourceOverlayShelfFreeze: sourceOverlayIdentity,
      adapterRegistry: identity(frozen.upstreamBindings.measurementAdapters.identity.path),
    },
    sourceOverlayShelf: actualSourceOverlayShelf(frozen),
    adapterMappings: normalizedActualMappings(frozen) as Phase9DbtLaunchManifest["adapterMappings"],
    primaryRoster: frozen.primaryRoster,
    operatorPins: frozen.launchPreflight.requiredOperatorPins,
  };
}

function clone<T>(value: T): T {
  return structuredClone(value);
}

describe("Phase 9 D-BT pure launch preflight", () => {
  it("pins the exact roster, S0B/S1 discharge, and actual protocol/code/test identities", () => {
    const frozen = protocol();
    const registered = registration(frozen);
    expect(registered.identities.protocol).toEqual(identity(PROTOCOL_PATH));
    expect(registered.identities.implementation).toEqual(identity(MODEL_PATH));
    expect(registered.identities.test).toEqual(identity(TEST_PATH));
    expect(identity(PREFLIGHT_PATH).byteLength).toBeGreaterThan(0);
    expect(identity(PREFLIGHT_TEST_PATH).byteLength).toBeGreaterThan(0);
    expect(registered.identities.adapterRegistry).toEqual({
      path: "research/phase9-adapter-registry-v1.jsonl",
      byteLength: 48_946,
      sha256: "498e85471766294d812b3ef9d747381e92eb476e8a9b40a3f34f855b53e46337",
    });
    expect(normalizedActualMappings(frozen)).toEqual(
      frozen.upstreamBindings.measurementAdapters.requiredMappings,
    );
    expect(registered.sourceOverlayShelf.schema).toBe("phase9-source-shelf-freeze-v1");
    expect(registered.sourceOverlayShelf.row).toMatchObject({
      item: "D-BT",
      sourceBlocked: false,
      protocolDispositionState: "pending",
    });
    expect(registered.sourceOverlayShelf.row.protocolRestrictions).toHaveLength(9);
    expect(Object.keys(frozen.upstreamBindings.sourceOverlay.restrictionDischarges)).toHaveLength(9);
    expect(registered.identities.sourceOverlayShelfFreeze).toEqual({
      path: "evidence/phase9-source-overlay-v1/shelf-freeze.json",
      byteLength: 63_975,
      sha256: "b0bbab2e01eca61dfb2b807bda3614aaf803e5fd0457f2df02aa3e4b8c5d1a06",
    });
    expect(phase9DbtRunLaunchPreflight(frozen, registered, clone(registered))).toEqual({
      pass: true,
      rosterCount: 6,
      pinnedSelectionIds: frozen.primaryRoster.map((entry) => entry.selectionId),
      registeredNegativeControlNames: PHASE9_DBT_PREFLIGHT_MUTATIONS,
    });
  });

  it("executes the named source, roster, S0B, S1, identity, operator, and verdict negatives", () => {
    const frozen = protocol();
    const base = registration(frozen);
    const cases: readonly {
      readonly name: string;
      readonly mutateProtocol?: (value: Phase9DbtPreflightProtocol) => void;
      readonly mutateRegistration?: (value: Phase9DbtLaunchManifest) => void;
      readonly mutateObserved?: (value: Phase9DbtLaunchManifest) => void;
    }[] = [
      {
        name: "source-byte-change",
        mutateObserved: (value) => {
          (value.primaryRoster[0].rowArtifact as { sha256: string }).sha256 = "0".repeat(64);
        },
      },
      {
        name: "roster-shift",
        mutateRegistration: (value) => {
          (value.primaryRoster[0] as { selectionId: string }).selectionId =
            "P8B-P0-REPLACED-WITH-A-DIFFERENT-SIXTH-ROW";
        },
      },
      {
        name: "condition-shift",
        mutateRegistration: (value) => {
          (value.primaryRoster[0].conditions as { tempC: number }).tempC = -70;
        },
      },
      {
        name: "grid-shift-or-t500",
        mutateRegistration: (value) => {
          (value.primaryRoster[0].scoreGrid as { lastSecond: number }).lastSecond = 500;
        },
      },
      {
        name: "source-overlay-blocked",
        mutateRegistration: (value) => {
          (value.sourceOverlayShelf.row as { sourceBlocked: boolean }).sourceBlocked = true;
        },
      },
      {
        name: "source-overlay-blocker-present",
        mutateRegistration: (value) => {
          (value.sourceOverlayShelf.row as { sourceBlockerPresent: boolean })
            .sourceBlockerPresent = true;
          (value.sourceOverlayShelf.row.blockerIdentities as string[]).push(
            "simulated arm-freeze-blocking source identity",
          );
        },
      },
      {
        name: "source-overlay-blocker-id-injected",
        mutateRegistration: (value) => {
          (value.sourceOverlayShelf.row.sourceBlockerIds as string[]).push(
            "P9B-INJECTED-DOWNSTREAM-SEAM",
          );
        },
      },
      {
        name: "source-overlay-restriction-change",
        mutateRegistration: (value) => {
          (value.sourceOverlayShelf.row.protocolRestrictions[0] as { text: string }).text +=
            " mutated";
        },
      },
      {
        name: "local-discharge-missing",
        mutateProtocol: (value) => {
          const first = Object.values(
            value.upstreamBindings.sourceOverlay.restrictionDischarges,
          )[0] as { localDischarge: string };
          first.localDischarge = "";
        },
      },
      {
        name: "adapter-registry-byte-change",
        mutateObserved: (value) => {
          (value.identities.adapterRegistry as { sha256: string }).sha256 = "1".repeat(64);
        },
      },
      {
        name: "adapter-mapping-change",
        mutateRegistration: (value) => {
          (value.adapterMappings[0] as {
            scalarMassHistoryDevelopmentStatus: string;
          }).scalarMassHistoryDevelopmentStatus = "ineligible";
        },
      },
      {
        name: "protocol-code-or-test-byte-change",
        mutateObserved: (value) => {
          (value.identities.implementation as { sha256: string }).sha256 = "2".repeat(64);
        },
      },
      {
        name: "monotonic-observation-filter",
        mutateObserved: (value) => {
          (value.operatorPins as { observationDecreasePolicy: string })
            .observationDecreasePolicy = "force-monotonic";
        },
      },
      {
        name: "coefficient-change",
        mutateObserved: (value) => {
          (value.operatorPins.lamb as { exponent: number }).exponent = 1.3;
        },
      },
      {
        name: "verdict-change",
        mutateObserved: (value) => {
          (value.operatorPins.verdict as { requiredStrictPerHistoryWins: number })
            .requiredStrictPerHistoryWins = 3;
        },
      },
    ];
    expect(cases.map((entry) => entry.name)).toEqual(PHASE9_DBT_PREFLIGHT_MUTATIONS);
    for (const testCase of cases) {
      const testProtocol = clone(frozen);
      const registered = clone(base);
      const observed = clone(base);
      testCase.mutateProtocol?.(testProtocol);
      testCase.mutateRegistration?.(registered);
      testCase.mutateObserved?.(observed);
      expect(
        () => phase9DbtRunLaunchPreflight(testProtocol, registered, observed),
        testCase.name,
      ).toThrow(/D-BT preflight refused/);
    }
  });
});
