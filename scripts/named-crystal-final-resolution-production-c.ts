// Final established-domain production for the last five direct source families plus a bounded
// Capped Bullets search.
//
//   node scripts/named-crystal-final-resolution-production-c.ts plan
//   node scripts/named-crystal-final-resolution-production-c.ts run

import { createHash } from "node:crypto";
import { existsSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { parseNamedCrystalCatalog } from "./named-crystal-catalog.ts";
import { loadProbePlan } from "./named-crystal-baseline-probes.ts";
import {
  type DirectProductionJob,
  type DirectProductionPlan,
  printDirectProductionPlan,
  runDirectProductionPlan,
} from "./named-crystal-direct-production.ts";
import { scaleSpecRho } from "./named-crystal-direct-production-2.ts";

const REPO = resolve(import.meta.dirname, "..");
const DEFAULT_MANIFEST = join(REPO, "docs", "named-snow-crystal-final-resolution-production-c.json");
const VARIANTS = [
  { slot: "lower" as const, value: 0.95 },
  { slot: "baseline" as const, value: 1 },
  { slot: "upper" as const, value: 1.05 },
] as const;

interface IdentityWire {
  readonly path: string;
  readonly byteLength: number;
  readonly sha256: string;
}

interface RhoFamilyWire {
  readonly typeId: string;
  readonly sourceId: string;
  readonly sourceRecord: string;
  readonly sourceSpecSha256: string;
  readonly dims: readonly [number, number, number];
  readonly tickCap: number;
  readonly reviewViews: readonly string[];
}

interface ManifestWire {
  readonly format: "named-crystal-final-resolution-production-c-v1";
  readonly catalog: string;
  readonly sources: {
    readonly currentAudit: IdentityWire;
    readonly supersession: IdentityWire;
    readonly baselineManifest: IdentityWire;
    readonly baselineReview: IdentityWire;
  };
  readonly outRoot: string;
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
  readonly rhoFamilies: readonly RhoFamilyWire[];
  readonly cappedBulletSearch: {
    readonly typeId: "capped-bullets";
    readonly sourceSpecSha256: string;
    readonly dims: readonly [number, number, number];
    readonly transitionTick: number;
    readonly stopTicks: readonly number[];
    readonly reviewViews: readonly string[];
  };
}

interface CurrentAuditWire {
  readonly assets: readonly {
    readonly id: string;
    readonly sourceRecord: string;
    readonly classification: { readonly typeId: string; readonly match: string };
  }[];
}

interface SourceRecordWire {
  readonly spec: Record<string, unknown>;
  readonly domain: string;
  readonly seed: number;
  readonly noise: number;
}

interface BaselineReviewWire {
  readonly reviews: readonly { readonly typeId: string; readonly status: string }[];
}

interface RecordWire {
  readonly dims: { readonly nx: number; readonly ny: number; readonly nz: number };
  readonly mesh: { readonly bboxCartesian: { readonly zMin: number; readonly zMax: number } };
}

export interface FinalResolutionPlanC {
  readonly production: DirectProductionPlan;
  readonly verticalClearance: ManifestWire["verticalClearance"];
}

const canonicalJson = (value: unknown): string => `${JSON.stringify(value, null, 2)}\n`;
const canonicalSpec = (value: unknown): string => `${JSON.stringify(value, null, 1)}\n`;
const sha256 = (bytes: Uint8Array | string): string => createHash("sha256").update(bytes).digest("hex");
const isSha256 = (value: string): boolean => /^[0-9a-f]{64}$/.test(value);
const cloneJson = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

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
  if (!isSha256(identity.sha256) || actual.byteLength !== identity.byteLength || actual.sha256 !== identity.sha256) {
    throw new Error(`${identity.path}: registered identity drift; got ${actual.byteLength} / ${actual.sha256}`);
  }
  return path;
};

const assertDimensions = (typeId: string, dims: readonly number[]): void => {
  if (dims.length !== 3 || !dims.every((value) => Number.isSafeInteger(value) && value > 0)) {
    throw new Error(`${typeId}: invalid Fleet C dimensions`);
  }
};

export function loadFinalResolutionPlanC(
  manifestPath = DEFAULT_MANIFEST,
  outRootOverride?: string,
  repo = REPO,
): FinalResolutionPlanC {
  const absoluteManifest = resolve(manifestPath);
  const wire = JSON.parse(readFileSync(absoluteManifest, "utf8")) as ManifestWire;
  if (wire.format !== "named-crystal-final-resolution-production-c-v1") {
    throw new Error("unknown final-resolution Fleet C format");
  }
  if (
    wire.webPayloadLimitBytes !== 20_000_000 ||
    wire.scientificMeshStateTarget !== 120 ||
    wire.scientificMeshStateCountMinimum !== 100 ||
    wire.scientificMeshStateCountMaximum !== 122 ||
    wire.execution.processConcurrency !== 24 ||
    wire.execution.physicalCores !== 24 ||
    wire.execution.logicalProcessors !== 24
  ) {
    throw new Error("Fleet C execution/output contract drift");
  }
  if (
    wire.verticalClearance.minimumLayers !== 16 ||
    wire.verticalClearance.minimumFractionOfNz !== 0.05 ||
    wire.verticalClearance.typeIds.join(",") !== "columns-on-plates,capped-bullets"
  ) {
    throw new Error("Fleet C vertical-clearance contract drift");
  }
  verifyIdentity(repo, wire.sources.currentAudit);
  verifyIdentity(repo, wire.sources.supersession);
  verifyIdentity(repo, wire.sources.baselineManifest);
  verifyIdentity(repo, wire.sources.baselineReview);

  const targetTypeIds = [...wire.rhoFamilies.map(({ typeId }) => typeId), wire.cappedBulletSearch.typeId];
  if (wire.rhoFamilies.length !== 5 || new Set(targetTypeIds).size !== 6) {
    throw new Error("Fleet C requires five rho families and one capped-bullet search");
  }
  const catalog = parseNamedCrystalCatalog(
    JSON.parse(readFileSync(resolve(repo, wire.catalog), "utf8")) as unknown,
  );
  const names = new Map<string, string>();
  for (const typeId of targetTypeIds) {
    const entry = catalog.entries.find(({ id }) => id === typeId);
    if (entry === undefined || !["gg", "gg-plus"].includes(entry.route)) {
      throw new Error(`${typeId}: Fleet C target is not direct growth`);
    }
    if (Object.values(entry.variants).some((variant) => variant !== null)) {
      throw new Error(`${typeId}: Fleet C target already has an accepted slot`);
    }
    names.set(typeId, entry.name);
  }

  const audit = JSON.parse(
    readFileSync(resolve(repo, wire.sources.currentAudit.path), "utf8"),
  ) as CurrentAuditWire;
  const jobs: DirectProductionJob[] = [];
  for (const family of wire.rhoFamilies) {
    assertDimensions(family.typeId, family.dims);
    const asset = audit.assets.find(({ id }) => id === family.sourceId);
    if (
      asset === undefined ||
      asset.sourceRecord !== family.sourceRecord ||
      asset.classification.typeId !== family.typeId ||
      asset.classification.match !== "strong"
    ) {
      throw new Error(`${family.typeId}: Fleet C source is not the exact strong audit asset`);
    }
    const record = JSON.parse(readFileSync(resolve(repo, family.sourceRecord), "utf8")) as SourceRecordWire;
    if (
      record.domain !== wire.execution.domain ||
      record.seed !== wire.execution.rngSeed ||
      record.noise !== wire.execution.noiseEpsilon ||
      sha256(canonicalSpec(record.spec)) !== family.sourceSpecSha256
    ) {
      throw new Error(`${family.typeId}: Fleet C source execution/spec drift`);
    }
    for (const variant of VARIANTS) {
      const spec = scaleSpecRho(record.spec, variant.value, names.get(family.typeId)!);
      jobs.push({
        jobId: `${family.typeId}-${variant.slot}`,
        typeId: family.typeId,
        typeName: names.get(family.typeId)!,
        slot: variant.slot,
        sourceLane: "current-audit-rho-final-resolution-c",
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

  const baselinePlan = loadProbePlan(
    resolve(repo, wire.sources.baselineManifest.path),
    resolve(repo, "out", "final-resolution-c-baseline-source-only"),
    repo,
  );
  if (JSON.stringify(baselinePlan.execution) !== JSON.stringify(wire.execution)) {
    throw new Error("Capped Bullets baseline execution differs from Fleet C");
  }
  const review = JSON.parse(
    readFileSync(resolve(repo, wire.sources.baselineReview.path), "utf8"),
  ) as BaselineReviewWire;
  if (review.reviews.find(({ typeId }) => typeId === "capped-bullets")?.status !== "retune-candidate") {
    throw new Error("Capped Bullets baseline is not the registered retune candidate");
  }
  const source = baselinePlan.jobs.find(({ typeId }) => typeId === "capped-bullets");
  const search = wire.cappedBulletSearch;
  assertDimensions(search.typeId, search.dims);
  if (
    source === undefined ||
    source.specSha256 !== search.sourceSpecSha256 ||
    search.transitionTick !== 2500 ||
    search.stopTicks.length !== 9 ||
    new Set(search.stopTicks).size !== 9 ||
    search.stopTicks.some((tick) => !Number.isSafeInteger(tick) || tick <= search.transitionTick)
  ) {
    throw new Error("Capped Bullets source/search identity drift");
  }
  const sourceStages = source.spec.stages as readonly { readonly untilTick?: unknown }[] | undefined;
  if (!Array.isArray(sourceStages) || sourceStages[0]?.untilTick !== search.transitionTick) {
    throw new Error("Capped Bullets source transition drift");
  }
  for (const stopTick of search.stopTicks) {
    const spec = cloneJson(source.spec);
    spec.label = `${names.get(search.typeId)} — final-resolution stop ${stopTick}`;
    jobs.push({
      jobId: `capped-bullets-stop-${stopTick}`,
      typeId: search.typeId,
      typeName: names.get(search.typeId)!,
      slot: "baseline",
      sourceLane: "baseline-retune-stop-search-final-resolution-c",
      sourceJobId: "capped-bullets-baseline-probe",
      sourceSpecSha256: search.sourceSpecSha256,
      driverName: "stop-tick",
      driverValue: stopTick,
      dims: search.dims,
      tickCap: stopTick,
      framesEvery: Math.max(1, Math.ceil(stopTick / wire.scientificMeshStateTarget)),
      reviewViews: search.reviewViews,
      spec,
      specSha256: sha256(canonicalSpec(spec)),
    });
  }
  if (jobs.length !== 24 || new Set(jobs.map(({ jobId }) => jobId)).size !== 24) {
    throw new Error("Fleet C must materialize 24 unique jobs");
  }
  return {
    production: {
      manifestPath: absoluteManifest,
      outRoot: resolve(repo, outRootOverride ?? wire.outRoot),
      webPayloadLimitBytes: wire.webPayloadLimitBytes,
      scientificFrameTarget: wire.scientificMeshStateTarget,
      scientificFrameCountMinimum: wire.scientificMeshStateCountMinimum,
      scientificFrameCountMaximum: wire.scientificMeshStateCountMaximum,
      execution: wire.execution,
      jobs,
    },
    verticalClearance: wire.verticalClearance,
  };
}

export function verifyFinalResolutionVerticalClearanceC(plan: FinalResolutionPlanC): {
  readonly requiredResults: number;
  readonly results: readonly Record<string, unknown>[];
} {
  const types = new Set(plan.verticalClearance.typeIds);
  const results: Record<string, unknown>[] = [];
  for (const job of plan.production.jobs.filter(({ typeId }) => types.has(typeId))) {
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
      driverValue: job.driverValue,
      lowerClearanceLayers: lower,
      upperClearanceLayers: upper,
      requiredClearanceLayers: required,
      passed,
      recordByteLength: bytes.byteLength,
      recordSha256: sha256(bytes),
    });
    if (!passed) throw new Error(`${job.jobId}: vertical clearance ${lower}/${upper} is below ${required}`);
  }
  return { requiredResults: results.length, results };
}

const printPlan = (plan: FinalResolutionPlanC): void => {
  printDirectProductionPlan(plan.production);
  console.log(JSON.stringify({
    fleet: "c",
    jobs: plan.production.jobs.length,
    directVariantJobs: 15,
    cappedBulletSearchJobs: 9,
    processConcurrency: plan.production.execution.processConcurrency,
    verticalClearanceJobs: plan.production.jobs.filter(({ typeId }) =>
      plan.verticalClearance.typeIds.includes(typeId)
    ).length,
    outRoot: plan.production.outRoot,
  }));
};

const runPlan = async (plan: FinalResolutionPlanC): Promise<void> => {
  await runDirectProductionPlan(plan.production);
  const clearance = verifyFinalResolutionVerticalClearanceC(plan);
  writeFileSync(join(plan.production.outRoot, "vertical-clearance.json"), canonicalJson({
    format: "named-crystal-final-resolution-vertical-clearance-c-v1",
    fleet: "c",
    gate: plan.verticalClearance,
    ...clearance,
  }));
  console.log(`vertical-clearance complete: ${clearance.requiredResults}/${clearance.requiredResults} ok`);
};

const main = async (): Promise<void> => {
  const [command, ...argv] = process.argv.slice(2);
  const plan = loadFinalResolutionPlanC(
    argument(argv, "manifest", DEFAULT_MANIFEST),
    argument(argv, "out-root"),
  );
  if (command === "plan") printPlan(plan);
  else if (command === "run") await runPlan(plan);
  else throw new Error("usage: named-crystal-final-resolution-production-c.ts plan|run [--manifest file] [--out-root dir]");
};

if (process.argv[1] !== undefined && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}
