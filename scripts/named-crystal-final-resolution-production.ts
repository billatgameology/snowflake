// Established-domain direct production for the named crystal catalog.
//
//   node scripts/named-crystal-final-resolution-production.ts plan --fleet a
//   node scripts/named-crystal-final-resolution-production.ts run --fleet a
//
// Fleet A binds exact strong current-audit records and applies one schedule-wide rho scale.
// Fleet B rematerializes the first reviewed production recipes in their registered larger domains.

import { createHash } from "node:crypto";
import { existsSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { parseNamedCrystalCatalog } from "./named-crystal-catalog.ts";
import {
  type DirectProductionJob,
  type DirectProductionPlan,
  loadDirectProductionPlan,
  printDirectProductionPlan,
  runDirectProductionPlan,
} from "./named-crystal-direct-production.ts";
import { scaleSpecRho } from "./named-crystal-direct-production-2.ts";

const REPO = resolve(import.meta.dirname, "..");
const DEFAULT_MANIFEST = join(REPO, "docs", "named-snow-crystal-final-resolution-production.json");
const VARIANTS = [
  { slot: "lower" as const, value: 0.95 },
  { slot: "baseline" as const, value: 1 },
  { slot: "upper" as const, value: 1.05 },
] as const;

export type FinalResolutionFleetId = "a" | "b";

interface IdentityWire {
  readonly path: string;
  readonly byteLength: number;
  readonly sha256: string;
}

interface CurrentFamilyWire {
  readonly typeId: string;
  readonly sourceId: string;
  readonly sourceRecord: string;
  readonly sourceSpecSha256: string;
  readonly dims: readonly [number, number, number];
  readonly tickCap: number;
  readonly reviewViews: readonly string[];
}

interface ReviewedFamilyWire {
  readonly typeId: string;
  readonly dims: readonly [number, number, number];
}

interface ManifestWire {
  readonly format: "named-crystal-final-resolution-production-v1";
  readonly catalog: string;
  readonly sources: {
    readonly currentAudit: IdentityWire;
    readonly firstProductionManifest: IdentityWire;
    readonly supersession: IdentityWire;
  };
  readonly webPayloadLimitBytes: number;
  readonly scientificMeshStateTarget: number;
  readonly scientificMeshStateCountMinimum: number;
  readonly scientificMeshStateCountMaximum: number;
  readonly verticalClearance: {
    readonly minimumLayers: number;
    readonly minimumFractionOfNz: number;
    readonly typeIds: readonly string[];
  };
  readonly execution: DirectProductionPlan["execution"];
  readonly fleets: {
    readonly a: {
      readonly outRoot: string;
      readonly sourceKind: "current-audit-rho";
      readonly families: readonly CurrentFamilyWire[];
    };
    readonly b: {
      readonly outRoot: string;
      readonly sourceKind: "first-production-reviewed";
      readonly families: readonly ReviewedFamilyWire[];
    };
  };
}

interface CurrentAuditWire {
  readonly assets: readonly {
    readonly id: string;
    readonly sourceRecord: string;
    readonly classification: {
      readonly typeId: string;
      readonly match: string;
    };
  }[];
}

interface SourceRecordWire {
  readonly spec: Record<string, unknown>;
  readonly domain: string;
  readonly seed: number;
  readonly noise: number;
}

interface RecordWire {
  readonly dims: { readonly nx: number; readonly ny: number; readonly nz: number };
  readonly mesh: {
    readonly bboxCartesian: { readonly zMin: number; readonly zMax: number };
  };
}

export interface FinalResolutionPlan {
  readonly fleetId: FinalResolutionFleetId;
  readonly production: DirectProductionPlan;
  readonly verticalClearance: ManifestWire["verticalClearance"];
}

const canonicalJson = (value: unknown): string => `${JSON.stringify(value, null, 2)}\n`;
const canonicalSpec = (value: unknown): string => `${JSON.stringify(value, null, 1)}\n`;
const sha256 = (bytes: Uint8Array | string): string => createHash("sha256").update(bytes).digest("hex");
const isSha256 = (value: string): boolean => /^[0-9a-f]{64}$/.test(value);

const argument = (argv: readonly string[], name: string, fallback?: string): string | undefined => {
  const index = argv.indexOf(`--${name}`);
  if (index < 0) return fallback;
  const value = argv[index + 1];
  if (value === undefined) throw new Error(`--${name} wants a value`);
  return value;
};

const verifyIdentity = (repo: string, identity: IdentityWire): string => {
  const path = resolve(repo, identity.path);
  const bytes = readFileSync(path);
  const actual = { byteLength: statSync(path).size, sha256: sha256(bytes) };
  if (
    !isSha256(identity.sha256) ||
    actual.byteLength !== identity.byteLength ||
    actual.sha256 !== identity.sha256
  ) {
    throw new Error(`${identity.path}: registered identity drift; got ${actual.byteLength} / ${actual.sha256}`);
  }
  return path;
};

function validateDimensions(typeId: string, dims: readonly number[]): asserts dims is [number, number, number] {
  if (dims.length !== 3 || !dims.every((value) => Number.isSafeInteger(value) && value > 0)) {
    throw new Error(`${typeId}: invalid final-resolution dimensions`);
  }
}

const planEnvelope = (
  wire: ManifestWire,
  manifestPath: string,
  outRoot: string,
  jobs: readonly DirectProductionJob[],
): DirectProductionPlan => ({
  manifestPath,
  outRoot,
  webPayloadLimitBytes: wire.webPayloadLimitBytes,
  scientificFrameTarget: wire.scientificMeshStateTarget,
  scientificFrameCountMinimum: wire.scientificMeshStateCountMinimum,
  scientificFrameCountMaximum: wire.scientificMeshStateCountMaximum,
  execution: wire.execution,
  jobs,
});

const validateSharedContract = (wire: ManifestWire): void => {
  if (wire.format !== "named-crystal-final-resolution-production-v1") {
    throw new Error("unknown final-resolution production format");
  }
  if (
    wire.webPayloadLimitBytes !== 20_000_000 ||
    wire.scientificMeshStateTarget !== 120 ||
    wire.scientificMeshStateCountMinimum !== 100 ||
    wire.scientificMeshStateCountMaximum !== 122
  ) {
    throw new Error("final-resolution dual-output contract drift");
  }
  if (
    wire.execution.processConcurrency !== 24 ||
    wire.execution.physicalCores !== 24 ||
    wire.execution.logicalProcessors !== 24
  ) {
    throw new Error("final-resolution production must use 24 processes on the 24/24 host");
  }
  if (
    wire.verticalClearance.minimumLayers !== 16 ||
    wire.verticalClearance.minimumFractionOfNz !== 0.05 ||
    new Set(wire.verticalClearance.typeIds).size !== wire.verticalClearance.typeIds.length
  ) {
    throw new Error("final-resolution vertical-clearance contract drift");
  }
};

const validateCatalogTargets = (
  repo: string,
  catalogPath: string,
  typeIds: readonly string[],
): ReadonlyMap<string, string> => {
  const catalog = parseNamedCrystalCatalog(JSON.parse(readFileSync(resolve(repo, catalogPath), "utf8")) as unknown);
  const names = new Map<string, string>();
  for (const typeId of typeIds) {
    const entry = catalog.entries.find(({ id }) => id === typeId);
    if (entry === undefined || !["gg", "gg-plus"].includes(entry.route)) {
      throw new Error(`${typeId}: final-resolution target is not a direct-growth catalog entry`);
    }
    if (Object.values(entry.variants).some((variant) => variant !== null)) {
      throw new Error(`${typeId}: final-resolution target already has accepted catalog slots`);
    }
    names.set(typeId, entry.name);
  }
  return names;
};

const buildFleetA = (
  repo: string,
  wire: ManifestWire,
  manifestPath: string,
  outRootOverride?: string,
): DirectProductionPlan => {
  const fleet = wire.fleets.a;
  if (fleet.families.length !== 8) throw new Error("final-resolution Fleet A requires eight families");
  const names = validateCatalogTargets(repo, wire.catalog, fleet.families.map(({ typeId }) => typeId));
  const audit = JSON.parse(
    readFileSync(resolve(repo, wire.sources.currentAudit.path), "utf8"),
  ) as CurrentAuditWire;
  const seen = new Set<string>();
  const jobs: DirectProductionJob[] = [];
  for (const family of fleet.families) {
    if (seen.has(family.typeId)) throw new Error(`${family.typeId}: duplicate Fleet A family`);
    seen.add(family.typeId);
    validateDimensions(family.typeId, family.dims);
    if (!Number.isSafeInteger(family.tickCap) || family.tickCap < 1 || !isSha256(family.sourceSpecSha256)) {
      throw new Error(`${family.typeId}: invalid cap or source hash`);
    }
    const asset = audit.assets.find(({ id }) => id === family.sourceId);
    if (
      asset === undefined ||
      asset.sourceRecord !== family.sourceRecord ||
      asset.classification.typeId !== family.typeId ||
      asset.classification.match !== "strong"
    ) {
      throw new Error(`${family.typeId}: Fleet A source is not the exact strong current-audit asset`);
    }
    const record = JSON.parse(readFileSync(resolve(repo, family.sourceRecord), "utf8")) as SourceRecordWire;
    if (
      record.domain !== wire.execution.domain ||
      record.seed !== wire.execution.rngSeed ||
      record.noise !== wire.execution.noiseEpsilon ||
      sha256(canonicalSpec(record.spec)) !== family.sourceSpecSha256
    ) {
      throw new Error(`${family.typeId}: Fleet A source execution/spec identity drift`);
    }
    const name = names.get(family.typeId)!;
    for (const variant of VARIANTS) {
      const spec = scaleSpecRho(record.spec, variant.value, name);
      jobs.push({
        jobId: `${family.typeId}-${variant.slot}`,
        typeId: family.typeId,
        typeName: name,
        slot: variant.slot,
        sourceLane: fleet.sourceKind,
        sourceJobId: family.sourceId,
        sourceSpecSha256: family.sourceSpecSha256,
        driverName: "rho-scale",
        driverValue: variant.value,
        dims: family.dims,
        tickCap: family.tickCap,
        framesEvery: Math.max(1, Math.ceil(family.tickCap / wire.scientificMeshStateTarget)),
        reviewViews: family.reviewViews,
        spec,
        specSha256: sha256(canonicalSpec(spec)),
      });
    }
  }
  return planEnvelope(
    wire,
    manifestPath,
    resolve(repo, outRootOverride ?? fleet.outRoot),
    jobs,
  );
};

const buildFleetB = (
  repo: string,
  wire: ManifestWire,
  manifestPath: string,
  outRootOverride?: string,
): DirectProductionPlan => {
  const fleet = wire.fleets.b;
  if (fleet.families.length !== 8) throw new Error("final-resolution Fleet B requires eight families");
  validateCatalogTargets(repo, wire.catalog, fleet.families.map(({ typeId }) => typeId));
  const sourcePlan = loadDirectProductionPlan(
    resolve(repo, wire.sources.firstProductionManifest.path),
    resolve(repo, "out", "final-resolution-first-production-source-only"),
    repo,
  );
  if (JSON.stringify(sourcePlan.execution) !== JSON.stringify(wire.execution)) {
    throw new Error("Fleet B source execution differs from final-resolution execution");
  }
  const seen = new Set<string>();
  const jobs: DirectProductionJob[] = [];
  for (const family of fleet.families) {
    if (seen.has(family.typeId)) throw new Error(`${family.typeId}: duplicate Fleet B family`);
    seen.add(family.typeId);
    validateDimensions(family.typeId, family.dims);
    const sourceJobs = sourcePlan.jobs.filter(({ typeId }) => typeId === family.typeId);
    if (sourceJobs.length !== 3) throw new Error(`${family.typeId}: reviewed source trio is missing`);
    for (const source of sourceJobs) {
      jobs.push({
        ...source,
        sourceLane: fleet.sourceKind,
        dims: family.dims,
        framesEvery: Math.max(1, Math.ceil(source.tickCap / wire.scientificMeshStateTarget)),
      });
    }
  }
  return planEnvelope(
    wire,
    manifestPath,
    resolve(repo, outRootOverride ?? fleet.outRoot),
    jobs,
  );
};

export function loadFinalResolutionPlan(
  fleetId: FinalResolutionFleetId,
  manifestPath = DEFAULT_MANIFEST,
  outRootOverride?: string,
  repo = REPO,
): FinalResolutionPlan {
  const absoluteManifest = resolve(manifestPath);
  const wire = JSON.parse(readFileSync(absoluteManifest, "utf8")) as ManifestWire;
  validateSharedContract(wire);
  verifyIdentity(repo, wire.sources.currentAudit);
  verifyIdentity(repo, wire.sources.firstProductionManifest);
  verifyIdentity(repo, wire.sources.supersession);
  const production = fleetId === "a"
    ? buildFleetA(repo, wire, absoluteManifest, outRootOverride)
    : buildFleetB(repo, wire, absoluteManifest, outRootOverride);
  if (
    production.jobs.length !== 24 ||
    new Set(production.jobs.map(({ jobId }) => jobId)).size !== 24 ||
    new Set(production.jobs.map(({ typeId }) => typeId)).size !== 8
  ) {
    throw new Error(`final-resolution Fleet ${fleetId.toUpperCase()} must materialize 24 unique jobs`);
  }
  return { fleetId, production, verticalClearance: wire.verticalClearance };
}

export function verifyFinalResolutionVerticalClearance(plan: FinalResolutionPlan): {
  readonly requiredResults: number;
  readonly results: readonly Record<string, unknown>[];
} {
  const verticalTypes = new Set(plan.verticalClearance.typeIds);
  const results: Record<string, unknown>[] = [];
  for (const job of plan.production.jobs.filter(({ typeId }) => verticalTypes.has(typeId))) {
    const recordPath = join(plan.production.outRoot, job.jobId, "record.json");
    if (!existsSync(recordPath)) throw new Error(`${job.jobId}: vertical-clearance record is missing`);
    const bytes = readFileSync(recordPath);
    const record = JSON.parse(bytes.toString()) as RecordWire;
    if ([record.dims.nx, record.dims.ny, record.dims.nz].join(",") !== job.dims.join(",")) {
      throw new Error(`${job.jobId}: vertical-clearance dimension drift`);
    }
    const required = Math.max(
      plan.verticalClearance.minimumLayers,
      record.dims.nz * plan.verticalClearance.minimumFractionOfNz,
    );
    const lower = record.mesh.bboxCartesian.zMin;
    const upper = record.dims.nz - record.mesh.bboxCartesian.zMax;
    const passed = lower >= required && upper >= required;
    results.push({
      jobId: job.jobId,
      typeId: job.typeId,
      slot: job.slot,
      nz: record.dims.nz,
      zMin: record.mesh.bboxCartesian.zMin,
      zMax: record.mesh.bboxCartesian.zMax,
      lowerClearanceLayers: lower,
      upperClearanceLayers: upper,
      requiredClearanceLayers: required,
      passed,
      recordByteLength: bytes.byteLength,
      recordSha256: sha256(bytes),
    });
    if (!passed) {
      throw new Error(`${job.jobId}: vertical clearance ${lower}/${upper} is below ${required}`);
    }
  }
  return { requiredResults: results.length, results };
}

const printPlan = (plan: FinalResolutionPlan): void => {
  printDirectProductionPlan(plan.production);
  const verticalJobs = plan.production.jobs.filter(({ typeId }) =>
    plan.verticalClearance.typeIds.includes(typeId)
  ).length;
  console.log(JSON.stringify({
    fleet: plan.fleetId,
    finalResolution: true,
    verticalClearanceJobs: verticalJobs,
    minimumVerticalClearanceLayers: plan.verticalClearance.minimumLayers,
    minimumVerticalClearanceFractionOfNz: plan.verticalClearance.minimumFractionOfNz,
  }));
};

const runPlan = async (plan: FinalResolutionPlan): Promise<void> => {
  await runDirectProductionPlan(plan.production);
  const clearance = verifyFinalResolutionVerticalClearance(plan);
  const path = join(plan.production.outRoot, "vertical-clearance.json");
  writeFileSync(path, canonicalJson({
    format: "named-crystal-final-resolution-vertical-clearance-v1",
    fleet: plan.fleetId,
    gate: plan.verticalClearance,
    ...clearance,
  }));
  console.log(`vertical-clearance complete: ${clearance.requiredResults}/${clearance.requiredResults} ok`);
};

const main = async (): Promise<void> => {
  const [command, ...argv] = process.argv.slice(2);
  const fleet = argument(argv, "fleet");
  if (fleet !== "a" && fleet !== "b") throw new Error("--fleet must be a or b");
  const manifest = argument(argv, "manifest", DEFAULT_MANIFEST)!;
  const outRoot = argument(argv, "out-root");
  const plan = loadFinalResolutionPlan(fleet, manifest, outRoot);
  if (command === "plan") printPlan(plan);
  else if (command === "run") await runPlan(plan);
  else throw new Error("usage: named-crystal-final-resolution-production.ts plan|run --fleet a|b [--manifest file] [--out-root dir]");
};

if (process.argv[1] !== undefined && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}
