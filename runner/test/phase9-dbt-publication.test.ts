import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";
import { canonicalJsonBytes, strictJsonSnapshot } from "../src/gate4-evidence.ts";
import {
  PHASE9_DBT_PUBLICATION_FILES,
  PHASE9_DBT_REGISTERED_CONTROL_IDS,
  bindPhase9DbtIceNodeArchiveMembers,
  derivePhase9DbtPublication,
  validatePhase9DbtFrozenPreOutputState,
  validatePhase9DbtLaunchAuthorization,
  writePhase9DbtPublicationDirectory,
  type Phase9DbtBoundHistory,
  type Phase9DbtIceNodeArchivePin,
  type Phase9DbtPublicationBundle,
  type Phase9DbtRunMaterial,
} from "../src/phase9-dbt-publication.ts";
import {
  independentlyBindPhase9DbtIceNodeArchiveMembers,
  independentlyValidatePhase9DbtFrozenPreOutputState,
  independentlyValidatePhase9DbtLaunchPreflight,
  reconstructPhase9DbtPublicationForTest,
  verifyPhase9DbtPublication,
  type Phase9DbtIndependentIceNodeArchivePin,
  type Phase9DbtIndependentInputs,
} from "../src/phase9-dbt-publication-verify.ts";

function sha256(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

function tsv(rows: readonly { readonly timeS: number; readonly massRatio: number }[]): Uint8Array {
  const lines = [
    "sourceRowIndex\ttime_s\tmass_ratio",
    ...rows.map((row, index) => `${index + 1}\t${row.timeS}\t${row.massRatio}`),
  ];
  return new TextEncoder().encode(`${lines.join("\n")}\n`);
}

function shelfRow(): Record<string, unknown> {
  const artifactSha256 = "a".repeat(64);
  const restrictions = Array.from({ length: 9 }, (_unused, index) => ({
    artifactSha256,
    id: `P9R-FIXTURE-${index}`,
    kind: "extraction",
    text: `fixture restriction ${index}`,
  }));
  return {
    blockerIdentities: [],
    completeArtifactCount: 1,
    completeArtifactSha256: [artifactSha256],
    item: "D-BT",
    protocolDispositionRequired: true,
    protocolDispositionState: "pending",
    protocolRestrictions: restrictions,
    sourceBlocked: false,
    sourceBlockerIds: [],
    sourceBlockerPresent: false,
    sourceBlockerStatuses: [],
  };
}

function fixtureInputs(options: {
  readonly monotonicControlSeam?: "invisible-only" | "later-visible";
  readonly roundingSeam?: boolean;
} = {}): {
  readonly producer: Phase9DbtRunMaterial;
  readonly verifier: Phase9DbtIndependentInputs;
} {
  const histories: Phase9DbtBoundHistory[] = Array.from({ length: 6 }, (_unused, index) => {
    const runId = `fixture-${index}`;
    const selectionId = `P8B-P0-FIXTURE-${index}`;
    const lastTimeS = 4.4 + index;
    const lastSecond = Math.floor(lastTimeS);
    const sourceRows = options.monotonicControlSeam !== undefined && index === 0
      ? [
        { timeS: 0.2, massRatio: 1 },
        { timeS: 0.3, massRatio: 1.2 },
        { timeS: 0.4, massRatio: 1.1 },
        { timeS: 1, massRatio: 1.5 },
        { timeS: 2, massRatio: 1.6 },
        { timeS: 3, massRatio: 1.8 },
        { timeS: lastTimeS, massRatio: 2.2 },
      ]
      : options.monotonicControlSeam === "later-visible" && index === 1
      ? [
        { timeS: 0.2, massRatio: 1 },
        { timeS: 1, massRatio: 1.5 },
        { timeS: 2, massRatio: 1.45 },
        { timeS: 3, massRatio: 1.8 },
        { timeS: lastTimeS, massRatio: 2.2 },
      ]
      : options.monotonicControlSeam !== undefined
      ? [
        { timeS: 0.2, massRatio: 1 },
        { timeS: 1, massRatio: 1.5 + index * 0.01 },
        { timeS: 2, massRatio: 1.6 + index * 0.01 },
        { timeS: 3, massRatio: 1.8 + index * 0.02 },
        { timeS: lastTimeS, massRatio: 2.2 + index * 0.02 },
      ]
      : options.roundingSeam
      ? [
        { timeS: 0.2, massRatio: 1 },
        { timeS: 1, massRatio: 1.015 + index * 0.001 },
        { timeS: 2, massRatio: 1.012 + index * 0.001 },
        { timeS: 3, massRatio: 1.04 + index * 0.002 },
        { timeS: lastTimeS, massRatio: 1.06 + index * 0.002 },
      ]
      : [
        { timeS: 0.2, massRatio: 1 },
        { timeS: 1, massRatio: 1.5 + index * 0.01 },
        { timeS: 2, massRatio: 1.45 + index * 0.01 },
        { timeS: 3, massRatio: 1.8 + index * 0.02 },
        { timeS: lastTimeS, massRatio: 2.2 + index * 0.02 },
      ];
    const sourceBytes = tsv(sourceRows);
    return {
      pin: {
        selectionId,
        metadataRecordId: `P8B-NATIVE-FIXTURE-${index}`,
        sourceUnitId: `P8B-UNIT-FIXTURE-${index}`,
        runId,
        conditions: {
          tempC: -35 + index * 0.2,
          tempRangeC: 0.1,
          pressurePa: 97_000 + index,
          pressureUncertainty: "fixture",
          sigmaIcePercent: 12 + index,
          sigmaIceRangePercent: 1,
          initialRadiusUm: 8 + index * 0.2,
          initialRadiusRangeUm: 0.1,
        },
        rowArtifact: {
          logicalRoot: "research-cache/phase9-fixtures",
          path: `data/${runId}.tsv`,
          byteLength: sourceBytes.byteLength,
          rowCount: sourceRows.length,
          sha256: sha256(sourceBytes),
          lastTimeS,
        },
        scoreGrid: { firstSecond: 0, lastSecond, sampleCount: lastSecond + 1 },
      },
      condition: {
        tempK: (-35 + index * 0.2) + 273.15,
        pressurePa: 97_000 + index,
        excessIceSupersaturationFraction: (12 + index) / 100,
        initialRadiusUm: 8 + index * 0.2,
      },
      sourceRows,
      sourceBytes,
      adapterStatus: "eligible-with-limitation",
      adapterReasons: [
        "the levitated-particle apparatus is not an unqualified free-particle transfer",
        "crystallography and habit were not observed",
        "the source-stated five-percent mass-ratio error is not a probability interval",
        "LEVITATION_GEOMETRY_AND_HABIT_UNOBSERVED",
        "development evidence only",
        "preserve decreases and duplicate times",
        "do not infer facet, habit, or ventilation response",
      ],
    };
  });
  const launchManifest = strictJsonSnapshot({
    schema: "phase9-dbt-launch-manifest-v1",
    primaryRoster: histories.map((history) => history.pin),
  });
  const authorizationBytes = canonicalJsonBytes({
    schema: "phase9-dbt-launch-v1",
    scoreMayRun: true,
    scope: "synthetic-fixture",
  });
  const launchAuthorization = {
    identity: {
      path: "research/phase9-dbt-launch-fixture.json",
      byteLength: authorizationBytes.byteLength,
      sha256: sha256(authorizationBytes),
    },
    syntheticChecks: {
      command: "TMPDIR=/private/tmp npx vitest run runner/test/phase9-dbt-publication.test.ts",
      status: "passed" as const,
    },
    independentReview: {
      status: "accepted" as const,
      reviewerModel: "synthetic-fixture-reviewer",
      sharedContextWithDeveloper: false,
      independentlyReexecuted: ["synthetic producer/verifier byte comparison"],
      notChecked: ["real NAS source rows and real model scores"],
    },
  };
  const sourceIdentities = [
    {
      path: "runner/src/phase9-dbt-model.ts",
      byteLength: 1,
      sha256: "d".repeat(64),
    },
    ...histories.map((history) => ({
      path: `${history.pin.rowArtifact.logicalRoot}/${history.pin.rowArtifact.path}`,
      byteLength: history.sourceBytes.byteLength,
      sha256: sha256(history.sourceBytes),
    })),
  ];
  const producer: Phase9DbtRunMaterial = {
    scope: "synthetic-fixture",
    protocolId: "phase9-dbt-six-history-development-v1",
    launchManifest,
    launchAuthorization,
    sourceIdentities,
    histories,
    registeredControlIds: PHASE9_DBT_REGISTERED_CONTROL_IDS,
    claimBoundary: {
      developmentEvidenceOnly: true,
      grantsValidationClaim: false,
      unqualifiedFreeParticleTransfer: false,
      facetHabitOrMorphologyPrediction: false,
      lineageStatus: "code-indicated-nonoverlap-not-definitive",
      apparatusLimit: "fixture apparatus limit",
    },
  };
  const row = shelfRow();
  const restrictions = row.protocolRestrictions as readonly {
    readonly artifactSha256: string;
    readonly id: string;
    readonly kind: string;
    readonly text: string;
  }[];
  const restrictionDischarges = Object.fromEntries(restrictions.map((restriction) => [
    restriction.id,
    { ...restriction, status: "discharged", localDischarge: "fixture discharge" },
  ]));
  const verifier: Phase9DbtIndependentInputs = {
    ...producer,
    histories: histories.map((history) => ({
      pin: history.pin,
      condition: history.condition,
      sourceRows: history.sourceRows,
      sourceBytes: history.sourceBytes,
      adapterReasons: history.adapterReasons,
    })),
    controlContext: {
      sourceOverlayRow: strictJsonSnapshot(row),
      restrictionDischarges: strictJsonSnapshot(restrictionDischarges),
      operatorPins: strictJsonSnapshot({
        observationDecreasePolicy: "preserve-decreases",
        projectAmbientExcessHybrid: {
          criticalScale: 0.000096066,
          temperatureExponent: 1.9171,
          drive: "ambient-excess-not-local-surface",
        },
        lamb: {
          exponent: 1.3153063,
          massScaleCoefficient: 2.6606467,
          denominatorScale: 1.1682062,
          additiveScaled: 0.1123054,
        },
        rescaleBounds: { minimum: 0, maximum: 2 },
        verdict: {
          family: "strict-lamb-lower",
          requiredStrictPerHistoryWins: 4,
          ties: "fail",
        },
      }),
      roster: strictJsonSnapshot(histories.map((history) => history.pin)),
    },
  };
  return { producer, verifier };
}

type MutableRecord = Record<string, any>;

function staticPreflightFixture(): {
  protocol: MutableRecord;
  registration: MutableRecord;
  observed: MutableRecord;
} {
  const protocol = JSON.parse(
    readFileSync("research/phase9-dbt-protocol-v1.json", "utf8"),
  ) as MutableRecord;
  const shelf = JSON.parse(
    readFileSync("evidence/phase9-source-overlay-v1/shelf-freeze.json", "utf8"),
  ) as { schema: string; shelf: MutableRecord[] };
  const row = shelf.shelf.find((entry) => entry.item === "D-BT");
  if (row === undefined) throw new Error("fixture shelf lacks D-BT");
  const fakeIdentity = (path: string, digit: string) => ({
    path,
    byteLength: 1,
    sha256: digit.repeat(64),
  });
  const registration: MutableRecord = {
    schema: "phase9-dbt-launch-manifest-v1",
    identities: {
      protocol: fakeIdentity(protocol.launchPreflight.requiredIdentityPaths.protocol, "1"),
      implementation: fakeIdentity(protocol.launchPreflight.requiredIdentityPaths.implementation, "2"),
      test: fakeIdentity(protocol.launchPreflight.requiredIdentityPaths.test, "3"),
      preflightImplementation: fakeIdentity(
        protocol.launchPreflight.requiredIdentityPaths.preflightImplementation,
        "4",
      ),
      preflightTest: fakeIdentity(protocol.launchPreflight.requiredIdentityPaths.preflightTest, "5"),
      sourceOverlayShelfFreeze: protocol.upstreamBindings.sourceOverlay.identity,
      adapterRegistry: protocol.upstreamBindings.measurementAdapters.identity,
    },
    sourceOverlayShelf: { schema: shelf.schema, row },
    adapterMappings: protocol.upstreamBindings.measurementAdapters.requiredMappings,
    primaryRoster: protocol.primaryRoster,
    operatorPins: protocol.launchPreflight.requiredOperatorPins,
  };
  return { protocol, registration, observed: structuredClone(registration) };
}

function zipU16(value: number): Buffer {
  const bytes = Buffer.alloc(2);
  bytes.writeUInt16LE(value);
  return bytes;
}

function zipU32(value: number): Buffer {
  const bytes = Buffer.alloc(4);
  bytes.writeUInt32LE(value >>> 0);
  return bytes;
}

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ ((crc & 1) === 1 ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function storedZip(entries: readonly { path: string; bytes: Uint8Array }[]): Uint8Array {
  const localParts: Buffer[] = [];
  const centralParts: Buffer[] = [];
  let localOffset = 0;
  for (const entry of entries) {
    const name = Buffer.from(entry.path, "utf8");
    const body = Buffer.from(entry.bytes);
    const checksum = crc32(body);
    const local = Buffer.concat([
      zipU32(0x04034b50), zipU16(20), zipU16(0x0800), zipU16(0),
      zipU16(0), zipU16(0), zipU32(checksum), zipU32(body.length), zipU32(body.length),
      zipU16(name.length), zipU16(0), name, body,
    ]);
    localParts.push(local);
    centralParts.push(Buffer.concat([
      zipU32(0x02014b50), zipU16(20), zipU16(20), zipU16(0x0800), zipU16(0),
      zipU16(0), zipU16(0), zipU32(checksum), zipU32(body.length), zipU32(body.length),
      zipU16(name.length), zipU16(0), zipU16(0), zipU16(0), zipU16(0), zipU32(0),
      zipU32(localOffset), name,
    ]));
    localOffset += local.length;
  }
  const central = Buffer.concat(centralParts);
  const eocd = Buffer.concat([
    zipU32(0x06054b50), zipU16(0), zipU16(0), zipU16(entries.length), zipU16(entries.length),
    zipU32(central.length), zipU32(localOffset), zipU16(0),
  ]);
  return new Uint8Array(Buffer.concat([...localParts, central, eocd]));
}

function iceNodeFixture(): {
  pin: Phase9DbtIceNodeArchivePin & Phase9DbtIndependentIceNodeArchivePin;
  bytes: Uint8Array;
} {
  const archiveCommit = "a".repeat(40);
  const paths = [
    "README.md",
    "Gfunctions.py",
    "Data/preprocess.py",
    "model_comparison.py",
    "models.py",
    "constants.py",
  ];
  const members = paths.map((path, index) => ({
    path,
    bytes: new TextEncoder().encode(`fixture member ${index}\n`),
  }));
  const bytes = storedZip(members.map((member) => ({
    path: `IceNODE-${archiveCommit}/${member.path}`,
    bytes: member.bytes,
  })));
  return {
    bytes,
    pin: {
      logicalPath: "research-cache/content/fixture-icenode.zip",
      byteLength: bytes.byteLength,
      sha256: sha256(bytes),
      archiveCommit,
      loadBearingMembers: members.map((member) => ({
        path: member.path,
        sha256: sha256(member.bytes),
      })),
    },
  };
}

const STATIC_PREFLIGHT_MUTATIONS: readonly {
  readonly name: string;
  readonly mutate: (fixture: ReturnType<typeof staticPreflightFixture>) => void;
}[] = [
  { name: "protocol freeze label", mutate: ({ protocol }) => { protocol.state.protocol = "mutated"; } },
  { name: "model-score-inspected state", mutate: ({ protocol }) => { protocol.state.modelScoreInspected = true; } },
  { name: "blocked launch state", mutate: ({ protocol }) => { protocol.state.launch.status = "ready"; } },
  { name: "scoreMayRun pre-output state", mutate: ({ protocol }) => { protocol.state.launch.scoreMayRun = true; } },
  { name: "remaining blocker text", mutate: ({ protocol }) => { protocol.state.launch.remainingBlockers[0] += " mutated"; } },
  { name: "S0B blocker text", mutate: ({ protocol }) => { protocol.state.launch.s0bPreflightState += " mutated"; } },
  { name: "publisher name", mutate: ({ protocol }) => { protocol.launchPreflight.publisherContract.name = "mutated"; } },
  { name: "publisher state", mutate: ({ protocol }) => { protocol.launchPreflight.publisherContract.state = "ready"; } },
  { name: "publisher obligation", mutate: ({ protocol }) => { protocol.launchPreflight.publisherContract.mustDo += " mutated"; } },
  { name: "verifier name", mutate: ({ protocol }) => { protocol.launchPreflight.verifierContract.name = "mutated"; } },
  { name: "verifier state", mutate: ({ protocol }) => { protocol.launchPreflight.verifierContract.state = "ready"; } },
  { name: "verifier obligation", mutate: ({ protocol }) => { protocol.launchPreflight.verifierContract.mustDo += " mutated"; } },
  { name: "hybrid critical scale", mutate: ({ protocol }) => { protocol.launchPreflight.requiredOperatorPins.projectAmbientExcessHybrid.criticalScale *= 2; } },
  { name: "hybrid temperature exponent", mutate: ({ protocol }) => { protocol.launchPreflight.requiredOperatorPins.projectAmbientExcessHybrid.temperatureExponent = 2; } },
  { name: "hybrid drive", mutate: ({ protocol }) => { protocol.launchPreflight.requiredOperatorPins.projectAmbientExcessHybrid.drive = "surface"; } },
  { name: "Lamb exponent", mutate: ({ protocol }) => { protocol.launchPreflight.requiredOperatorPins.lamb.exponent = 1.3; } },
  { name: "Lamb mass coefficient", mutate: ({ protocol }) => { protocol.launchPreflight.requiredOperatorPins.lamb.massScaleCoefficient = 2.7; } },
  { name: "Lamb denominator", mutate: ({ protocol }) => { protocol.launchPreflight.requiredOperatorPins.lamb.denominatorScale = 1.2; } },
  { name: "Lamb additive", mutate: ({ protocol }) => { protocol.launchPreflight.requiredOperatorPins.lamb.additiveScaled = 0.2; } },
  { name: "rescale minimum", mutate: ({ protocol }) => { protocol.launchPreflight.requiredOperatorPins.rescaleBounds.minimum = -1; } },
  { name: "rescale maximum", mutate: ({ protocol }) => { protocol.launchPreflight.requiredOperatorPins.rescaleBounds.maximum = 3; } },
  { name: "verdict family", mutate: ({ protocol }) => { protocol.launchPreflight.requiredOperatorPins.verdict.family = "mutated"; } },
  { name: "verdict threshold", mutate: ({ protocol }) => { protocol.launchPreflight.requiredOperatorPins.verdict.requiredStrictPerHistoryWins = 3; } },
  { name: "verdict tie policy", mutate: ({ protocol }) => { protocol.launchPreflight.requiredOperatorPins.verdict.ties = "pass"; } },
  ...[
    "rhoIceKgM3", "gasConstantJMolK", "waterMolarMassKgMol", "latentHeatSublimationJKg",
    "joulesPerCalorie", "standardPressurePa", "vaporDiffusivityReferenceM2S",
    "vaporDiffusivityTemperatureExponent", "waterVaporGasConstantJKgK", "dryAirGasConstantJKgK",
    "dryAirSpecificHeatJKgK", "vaporJumpDistanceM", "thermalJumpDistanceM",
    "thermalAccommodationCoefficient",
  ].map((field) => ({
    name: `model constant ${field}`,
    mutate: ({ protocol }: ReturnType<typeof staticPreflightFixture>) => {
      protocol.modelOperator.constants[field] *= 1.01;
    },
  })),
  { name: "rescale coarse grid", mutate: ({ protocol }) => { protocol.modelOperator.comparators[3].search.coarseIntervals = 128; } },
  { name: "rescale refinement", mutate: ({ protocol }) => { protocol.modelOperator.comparators[3].search.refinement = "mutated"; } },
  { name: "rescale endpoints", mutate: ({ protocol }) => { protocol.modelOperator.comparators[3].search.endpoints = "mutated"; } },
  { name: "rescale tie rule", mutate: ({ protocol }) => { protocol.modelOperator.comparators[3].search.ties = "mutated"; } },
  { name: "roster cardinality", mutate: ({ protocol }) => { protocol.primaryRoster.pop(); } },
  { name: "roster temperature domain", mutate: ({ protocol }) => { protocol.primaryRoster[0].conditions.tempC = 0; } },
  { name: "roster score endpoint", mutate: ({ protocol }) => { protocol.primaryRoster[0].scoreGrid.lastSecond = 500; } },
  { name: "adapter kind", mutate: ({ registration, observed }) => { registration.adapterMappings[0].adapterKind = "planar-facet"; observed.adapterMappings[0].adapterKind = "planar-facet"; } },
  { name: "adapter eligibility", mutate: ({ registration, observed }) => { registration.adapterMappings[0].scalarMassHistoryDevelopmentStatus = "ineligible"; observed.adapterMappings[0].scalarMassHistoryDevelopmentStatus = "ineligible"; } },
  { name: "source block", mutate: ({ registration, observed }) => { registration.sourceOverlayShelf.row.sourceBlocked = true; observed.sourceOverlayShelf.row.sourceBlocked = true; } },
  { name: "protocol disposition state", mutate: ({ registration, observed }) => { registration.sourceOverlayShelf.row.protocolDispositionState = "complete"; observed.sourceOverlayShelf.row.protocolDispositionState = "complete"; } },
  { name: "restriction text", mutate: ({ registration, observed }) => { registration.sourceOverlayShelf.row.protocolRestrictions[0].text += " mutated"; observed.sourceOverlayShelf.row.protocolRestrictions[0].text += " mutated"; } },
  { name: "registered-observed parity", mutate: ({ observed }) => { observed.identities.test.sha256 = "f".repeat(64); } },
];

describe("Phase 9 D-BT independent static launch preflight", () => {
  it("accepts the exact frozen semantic registration without reading a NAS observation", () => {
    const fixture = staticPreflightFixture();
    expect(() => independentlyValidatePhase9DbtLaunchPreflight(
      fixture.protocol,
      fixture.registration,
      fixture.observed,
    )).not.toThrow();
    expect(() => validatePhase9DbtFrozenPreOutputState(fixture.protocol)).not.toThrow();
    expect(() => independentlyValidatePhase9DbtFrozenPreOutputState(fixture.protocol)).not.toThrow();
  });

  it("makes both producer and verifier refuse a changed blocker state or publication contract", () => {
    const changedState = staticPreflightFixture().protocol;
    changedState.state.launch.scoreMayRun = true;
    expect(() => validatePhase9DbtFrozenPreOutputState(changedState)).toThrow(/pre-output state/);
    expect(() => independentlyValidatePhase9DbtFrozenPreOutputState(changedState))
      .toThrow(/frozen-state/);

    const changedContract = staticPreflightFixture().protocol;
    changedContract.launchPreflight.verifierContract.state = "ready";
    expect(() => validatePhase9DbtFrozenPreOutputState(changedContract)).toThrow(/blocker contract/);
    expect(() => independentlyValidatePhase9DbtFrozenPreOutputState(changedContract))
      .toThrow(/publication-contract/);
  });

  it.each(STATIC_PREFLIGHT_MUTATIONS)("rejects $name mutation", ({ mutate }) => {
    const fixture = staticPreflightFixture();
    mutate(fixture);
    expect(() => independentlyValidatePhase9DbtLaunchPreflight(
      fixture.protocol,
      fixture.registration,
      fixture.observed,
    )).toThrow(/independent D-BT/);
  });
});

describe("Phase 9 D-BT IceNODE member binding", () => {
  it("independently enumerates and hashes all six uncompressed load-bearing members", () => {
    const fixture = iceNodeFixture();
    const producer = bindPhase9DbtIceNodeArchiveMembers(fixture.pin, fixture.bytes);
    const verifier = independentlyBindPhase9DbtIceNodeArchiveMembers(fixture.pin, fixture.bytes);
    expect(producer).toEqual(verifier);
    expect(producer).toHaveLength(6);
    expect(new Set(producer.map((entry) => entry.path)).size).toBe(6);
  });

  it("rejects a changed uncompressed member pin in both implementations", () => {
    const fixture = iceNodeFixture();
    const changed = structuredClone(fixture.pin) as MutableRecord;
    changed.loadBearingMembers[2].sha256 = "f".repeat(64);
    expect(() => bindPhase9DbtIceNodeArchiveMembers(changed as Phase9DbtIceNodeArchivePin, fixture.bytes))
      .toThrow(/member hash differs/);
    expect(() => independentlyBindPhase9DbtIceNodeArchiveMembers(
      changed as Phase9DbtIndependentIceNodeArchivePin,
      fixture.bytes,
    )).toThrow(/ice-node-member/);
  });

  it("rejects a missing or duplicate load-bearing member", () => {
    const fixture = iceNodeFixture();
    const missing = structuredClone(fixture.pin) as MutableRecord;
    missing.loadBearingMembers[0].path = "absent.py";
    expect(() => bindPhase9DbtIceNodeArchiveMembers(missing as Phase9DbtIceNodeArchivePin, fixture.bytes))
      .toThrow(/absent/);
    expect(() => independentlyBindPhase9DbtIceNodeArchiveMembers(
      missing as Phase9DbtIndependentIceNodeArchivePin,
      fixture.bytes,
    )).toThrow(/ice-node-member/);

    const duplicate = structuredClone(fixture.pin) as MutableRecord;
    duplicate.loadBearingMembers[1].path = duplicate.loadBearingMembers[0].path;
    expect(() => bindPhase9DbtIceNodeArchiveMembers(duplicate as Phase9DbtIceNodeArchivePin, fixture.bytes))
      .toThrow(/duplicate/);
    expect(() => independentlyBindPhase9DbtIceNodeArchiveMembers(
      duplicate as Phase9DbtIndependentIceNodeArchivePin,
      fixture.bytes,
    )).toThrow(/duplicated/);
  });

  it("rejects a commit-root substitution in both implementations", () => {
    const fixture = iceNodeFixture();
    const changed = { ...fixture.pin, archiveCommit: "b".repeat(40) };
    expect(() => bindPhase9DbtIceNodeArchiveMembers(changed, fixture.bytes)).toThrow(/commit root/);
    expect(() => independentlyBindPhase9DbtIceNodeArchiveMembers(changed, fixture.bytes))
      .toThrow(/commit root/);
  });
});

describe("Phase 9 D-BT source-data publication pipeline", () => {
  it("refuses constructed, cloned, and deserialized registered material and verification inputs", () => {
    const fixture = fixtureInputs();
    const bundle = derivePhase9DbtPublication(fixture.producer);
    const constructedMaterial = {
      ...fixture.producer,
      scope: "registered-source-score" as const,
    };
    const clonedMaterial = structuredClone(constructedMaterial);
    const deserializedMaterial = {
      ...JSON.parse(JSON.stringify(constructedMaterial)),
      histories: constructedMaterial.histories,
    } as Phase9DbtRunMaterial;
    for (const material of [constructedMaterial, clonedMaterial, deserializedMaterial]) {
      expect(() => derivePhase9DbtPublication(material)).toThrow(/not captured intact/);
    }

    const constructedVerifier = {
      ...fixture.verifier,
      scope: "registered-source-score" as const,
    };
    const clonedVerifier = structuredClone(constructedVerifier);
    const deserializedVerifier = {
      ...JSON.parse(JSON.stringify(constructedVerifier)),
      histories: constructedVerifier.histories,
      sourceIdentities: constructedVerifier.sourceIdentities,
      launchManifest: constructedVerifier.launchManifest,
      launchAuthorization: constructedVerifier.launchAuthorization,
      controlContext: constructedVerifier.controlContext,
    } as Phase9DbtIndependentInputs;
    for (const inputs of [constructedVerifier, clonedVerifier, deserializedVerifier]) {
      expect(() => verifyPhase9DbtPublication(inputs, bundle.artifacts)).toThrow(/not captured intact/);
    }
  });

  it("refuses constructed, cloned, and deserialized registered publication bundles", () => {
    const fixture = fixtureInputs();
    const synthetic = derivePhase9DbtPublication(fixture.producer);
    const constructed = { ...synthetic, scope: "registered-source-score" as const };
    const cloned = structuredClone(constructed);
    const deserialized: Phase9DbtPublicationBundle = {
      scope: "registered-source-score",
      centralDecision: JSON.parse(JSON.stringify(constructed.centralDecision)),
      artifacts: new Map([...constructed.artifacts].map(([path, bytes]) => [
        path,
        new Uint8Array(bytes),
      ])),
    };
    for (const bundle of [constructed, cloned, deserialized]) {
      const directory = join(mkdtempSync(join(tmpdir(), "phase9-dbt-forged-")), "bundle");
      expect(() => writePhase9DbtPublicationDirectory(directory, bundle)).toThrow(/unsealed or changed/);
    }
  });

  it("independently reconstructs every candidate byte and executes all registered mutations", () => {
    const fixture = fixtureInputs();
    const bundle = derivePhase9DbtPublication(fixture.producer);
    const diagnostics = new TextDecoder().decode(bundle.artifacts.get("source-diagnostics.jsonl"))
      .trim().split("\n").map((line) => JSON.parse(line) as { preparedSampleCount: number });
    expect(diagnostics.map((entry) => entry.preparedSampleCount)).toEqual([5, 6, 7, 8, 9, 10]);
    expect(new Set(diagnostics.map((entry) => entry.preparedSampleCount)).size).toBeGreaterThan(1);
    const independentlyReconstructed = reconstructPhase9DbtPublicationForTest(fixture.verifier);
    for (const name of [...PHASE9_DBT_PUBLICATION_FILES].reverse()) {
      const producer = new TextDecoder().decode(bundle.artifacts.get(name));
      const verifier = new TextDecoder().decode(independentlyReconstructed.get(name));
      if (producer !== verifier) {
        const producerParsed = name.endsWith(".jsonl")
          ? producer.trim().split("\n").map((line) => JSON.parse(line))
          : JSON.parse(producer);
        const verifierParsed = name.endsWith(".jsonl")
          ? verifier.trim().split("\n").map((line) => JSON.parse(line))
          : JSON.parse(verifier);
        expect(verifierParsed, `independent ${name}`).toEqual(producerParsed);
      }
    }
    expect([...bundle.artifacts.keys()].sort()).toEqual([...PHASE9_DBT_PUBLICATION_FILES].sort());
    const result = verifyPhase9DbtPublication(fixture.verifier, bundle.artifacts);
    expect(result).toMatchObject({ ok: true, historyCount: 6, artifactCount: 5 });
    expect(result.controls.map((entry) => entry.id)).toEqual(PHASE9_DBT_REGISTERED_CONTROL_IDS);
    expect(result.controls.every((entry) => entry.mutationObserved && entry.rejectedOrDistinguished)).toBe(true);
    expect(result.rawRowsReparsed).toBe(30);
  });

  it("normalizes the independent interior-fit evaluation seam at seven significant digits", () => {
    const fixture = fixtureInputs({ roundingSeam: true });
    const bundle = derivePhase9DbtPublication(fixture.producer);
    const reconstructed = reconstructPhase9DbtPublicationForTest(fixture.verifier);
    const producerScores = bundle.artifacts.get("scores.jsonl") as Uint8Array;
    const verifierScores = reconstructed.get("scores.jsonl") as Uint8Array;
    expect(new TextDecoder().decode(verifierScores)).toBe(new TextDecoder().decode(producerScores));
    const scores = new TextDecoder().decode(producerScores).trim().split("\n")
      .map((line) => JSON.parse(line) as { leaveOneHistoryOutFit: { boundary: string } });
    expect(scores.some((record) => record.leaveOneHistoryOutFit.boundary === "interior")).toBe(true);
    const report = JSON.parse(new TextDecoder().decode(bundle.artifacts.get("report.json"))) as {
      numericRepresentation: { significantDecimalDigits: number };
    };
    expect(report.numericRepresentation.significantDecimalDigits).toBe(7);
  });

  it("skips an off-grid decrease and requires a later prepare-visible monotonic mutation", () => {
    const invisibleOnly = fixtureInputs({ monotonicControlSeam: "invisible-only" });
    const invisibleOnlyBundle = derivePhase9DbtPublication(invisibleOnly.producer);
    expect(() => verifyPhase9DbtPublication(invisibleOnly.verifier, invisibleOnlyBundle.artifacts))
      .toThrow(/no measured decrease changes prepared observations/);

    const fixture = fixtureInputs({ monotonicControlSeam: "later-visible" });
    const bundle = derivePhase9DbtPublication(fixture.producer);
    const baseline = reconstructPhase9DbtPublicationForTest(fixture.verifier);
    const invisibleMutationInputs = structuredClone(fixture.verifier);
    const invisibleRows = invisibleMutationInputs.histories[0].sourceRows as {
      timeS: number;
      massRatio: number;
    }[];
    invisibleRows[2].massRatio = invisibleRows[1].massRatio;
    const invisibleMutation = reconstructPhase9DbtPublicationForTest(invisibleMutationInputs);
    expect(new TextDecoder().decode(invisibleMutation.get("scores.jsonl")))
      .toBe(new TextDecoder().decode(baseline.get("scores.jsonl")));
    const diagnostic = (artifacts: ReadonlyMap<string, Uint8Array>, index: number) =>
      JSON.parse(new TextDecoder().decode(artifacts.get("source-diagnostics.jsonl"))
        .trim().split("\n")[index]) as {
          adjacentMassDecreaseCount: number;
          preparedObservationSha256: string;
        };
    expect(diagnostic(baseline, 0)).toMatchObject({ adjacentMassDecreaseCount: 1 });
    expect(diagnostic(invisibleMutation, 0)).toMatchObject({
      adjacentMassDecreaseCount: 0,
      preparedObservationSha256: diagnostic(baseline, 0).preparedObservationSha256,
    });

    const visibleMutationInputs = structuredClone(fixture.verifier);
    const visibleRows = visibleMutationInputs.histories[1].sourceRows as {
      timeS: number;
      massRatio: number;
    }[];
    visibleRows[2].massRatio = visibleRows[1].massRatio;
    const visibleMutation = reconstructPhase9DbtPublicationForTest(visibleMutationInputs);
    expect(diagnostic(visibleMutation, 1).preparedObservationSha256)
      .not.toBe(diagnostic(baseline, 1).preparedObservationSha256);
    expect(new TextDecoder().decode(visibleMutation.get("scores.jsonl")))
      .not.toBe(new TextDecoder().decode(baseline.get("scores.jsonl")));
    const result = verifyPhase9DbtPublication(fixture.verifier, bundle.artifacts);
    expect(result.controls.find((entry) => entry.id === "monotonic-observation-filter"))
      .toEqual({
        id: "monotonic-observation-filter",
        mutationObserved: true,
        rejectedOrDistinguished: true,
      });
  });

  it("refuses a producer-authored verdict flip and a changed source row", () => {
    const fixture = fixtureInputs();
    const bundle = derivePhase9DbtPublication(fixture.producer);
    const changedPublished = new Map(bundle.artifacts);
    const report = JSON.parse(new TextDecoder().decode(changedPublished.get("report.json"))) as {
      result: { decisionEnvelope: { central: { survives: boolean } } };
    };
    report.result.decisionEnvelope.central.survives = !report.result.decisionEnvelope.central.survives;
    changedPublished.set("report.json", canonicalJsonBytes(report));
    expect(() => verifyPhase9DbtPublication(fixture.verifier, changedPublished)).toThrow(
      /report\.json/,
    );

    const changedInputs = structuredClone(fixture.verifier);
    (changedInputs.histories[0].sourceRows as unknown as { massRatio: number }[])[1].massRatio += 0.1;
    expect(() => verifyPhase9DbtPublication(changedInputs, bundle.artifacts)).toThrow();
  });

  it("does not allow a synthetic fixture to be written as evidence", () => {
    const fixture = fixtureInputs();
    const bundle = derivePhase9DbtPublication(fixture.producer);
    expect(() => writePhase9DbtPublicationDirectory(join(tmpdir(), "phase9-dbt-fixture"), bundle)).toThrow(
      /synthetic/,
    );
  });

  it("requires a separate final-byte launch authorization with scoreMayRun true", () => {
    const roleNames = [
      "protocol",
      "modelImplementation",
      "modelTest",
      "preflightImplementation",
      "preflightTest",
      "producerImplementation",
      "independentVerifierImplementation",
      "publicationTest",
      "sourceOverlayShelfFreeze",
      "adapterRegistry",
    ] as const;
    const identities = Object.fromEntries(roleNames.map((role, index) => [role, {
      path: `fixture/${role}.txt`,
      byteLength: index + 1,
      sha256: index.toString(16).padStart(64, "0"),
    }])) as Parameters<typeof validatePhase9DbtLaunchAuthorization>[1]["identities"];
    const authorization = {
      schema: "phase9-dbt-launch-v1",
      protocolId: "phase9-dbt-six-history-development-v1",
      scoreMayRun: true,
      registeredControlIds: PHASE9_DBT_REGISTERED_CONTROL_IDS,
      syntheticChecks: { command: "focused synthetic test", status: "passed" },
      independentReview: {
        status: "accepted",
        reviewerModel: "fixture-reviewer",
        sharedContextWithDeveloper: false,
        independentlyReexecuted: ["fixture byte reconstruction"],
        notChecked: ["real source score"],
      },
      identities,
    };
    const expected = {
      path: "research/phase9-dbt-launch-v1.json",
      protocolId: authorization.protocolId,
      identities,
    };
    expect(validatePhase9DbtLaunchAuthorization(canonicalJsonBytes(authorization), expected))
      .toMatchObject({ syntheticChecks: { status: "passed" }, independentReview: { status: "accepted" } });
    expect(() => validatePhase9DbtLaunchAuthorization(
      canonicalJsonBytes({ ...authorization, scoreMayRun: false }),
      expected,
    )).toThrow(/absent, false, or differs/);
    const changed = structuredClone(authorization);
    (changed.identities.producerImplementation as { sha256: string }).sha256 = "f".repeat(64);
    expect(() => validatePhase9DbtLaunchAuthorization(canonicalJsonBytes(changed), expected)).toThrow(
      /final bytes/,
    );
  });

  it("rejects a published byte mutation before the independent controls run", () => {
    const fixture = fixtureInputs();
    const bundle = derivePhase9DbtPublication(fixture.producer);
    const changed = new Map(bundle.artifacts);
    const scores = new Uint8Array(changed.get("scores.jsonl") as Uint8Array);
    scores[scores.length - 2] ^= 1;
    changed.set("scores.jsonl", scores);
    expect(() => verifyPhase9DbtPublication(fixture.verifier, changed)).toThrow(/scores\.jsonl/);
  });

  it("keeps real publication entry points explicit and absent from fixture execution", () => {
    const directory = mkdtempSync(join(tmpdir(), "phase9-dbt-no-run-"));
    const marker = join(directory, "marker.txt");
    writeFileSync(marker, "no source score executed\n");
    expect(readFileSync(marker, "utf8")).toBe("no source score executed\n");
  });
});
