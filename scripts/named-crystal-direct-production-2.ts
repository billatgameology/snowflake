// Second 24-entry direct-production tranche. Source selection is independent, while execution and
// dual-output verification reuse the first tranche's production runner.
//
//   node scripts/named-crystal-direct-production-2.ts plan
//   node scripts/named-crystal-direct-production-2.ts run

import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  type DirectProductionJob,
  type DirectProductionPlan,
  printDirectProductionPlan,
  runDirectProductionPlan,
} from "./named-crystal-direct-production.ts";
import { loadProbePlan } from "./named-crystal-baseline-probes.ts";

const REPO = resolve(import.meta.dirname, "..");
const DEFAULT_MANIFEST = join(REPO, "docs", "named-snow-crystal-direct-production-2.json");
const DEFAULT_OUT = join(REPO, "out", "named-crystal-catalog", "direct-production-v2");
const VARIANTS = [
  { slot: "lower" as const, value: 0.95 },
  { slot: "baseline" as const, value: 1 },
  { slot: "upper" as const, value: 1.05 },
] as const;

type SourceKind = "baseline" | "current-audit";

interface FamilyWire {
  readonly typeId: string;
  readonly sourceKind: SourceKind;
  readonly sourceId: string;
  readonly templateRecord: string;
  readonly sourceSpecSha256: string;
  readonly dims: readonly [number, number, number];
  readonly tickCap: number;
  readonly reviewViews: readonly string[];
}

interface ManifestWire {
  readonly format: "named-crystal-direct-production-2-v1";
  readonly catalog: string;
  readonly sources: {
    readonly baselineManifest: string;
    readonly baselineReview: string;
    readonly currentAudit: string;
  };
  readonly webPayloadLimitBytes: number;
  readonly scientificFrameTarget: number;
  readonly scientificFrameCountMinimum: number;
  readonly scientificFrameCountMaximum: number;
  readonly execution: DirectProductionPlan["execution"];
  readonly families: readonly FamilyWire[];
}

interface CatalogWire {
  readonly entries: readonly {
    readonly id: string;
    readonly name: string;
    readonly route: string;
    readonly variants: Readonly<Record<string, unknown>>;
  }[];
}

interface BaselineReviewWire {
  readonly reviews: readonly { readonly typeId: string; readonly status: string }[];
}

interface CurrentAuditWire {
  readonly assets: readonly {
    readonly id: string;
    readonly sourceRecord: string;
    readonly classification: {
      readonly typeId: string;
      readonly match: string;
      readonly visualBasis: string;
    };
  }[];
}

interface TemplateRecordWire {
  readonly spec: Record<string, unknown>;
  readonly domain: string;
  readonly seed: number;
  readonly noise: number;
}

const canonicalJson = (value: unknown): string => `${JSON.stringify(value, null, 1)}\n`;
const cloneJson = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const sha256Text = (value: string): string => createHash("sha256").update(value).digest("hex");
const sha256Spec = (spec: Record<string, unknown>): string => sha256Text(canonicalJson(spec));
const roundMaterialized = (value: number): number => Number(value.toPrecision(15));

const parseArgument = (argv: readonly string[], name: string, fallback: string): string => {
  const index = argv.indexOf(`--${name}`);
  if (index < 0) return fallback;
  const value = argv[index + 1];
  if (value === undefined) throw new Error(`--${name} wants a value`);
  return value;
};

export function scaleSpecRho(
  source: Record<string, unknown>,
  scale: number,
  label: string,
): Record<string, unknown> {
  const spec = cloneJson(source);
  let scaled = 0;
  if (typeof spec.rho === "number" && Number.isFinite(spec.rho) && spec.rho > 0) {
    spec.rho = roundMaterialized(spec.rho * scale);
    scaled++;
  }
  if (Array.isArray(spec.stages)) {
    spec.stages = spec.stages.map((stage, index) => {
      if (stage === null || typeof stage !== "object" || Array.isArray(stage)) {
        throw new Error(`${label}: stage ${index} is not an object`);
      }
      const copy = cloneJson(stage as Record<string, unknown>);
      if (typeof copy.rho !== "number" || !Number.isFinite(copy.rho) || copy.rho <= 0) {
        throw new Error(`${label}: stage ${index} rho is invalid`);
      }
      copy.rho = roundMaterialized(copy.rho * scale);
      scaled++;
      return copy;
    });
  }
  if (scaled === 0) throw new Error(`${label}: source has no static or staged rho`);
  spec.label = `${label} — direct production v2, rho scale ${scale}`;
  return spec;
}

export function loadDirectProductionPlan2(
  manifestPath = DEFAULT_MANIFEST,
  outRoot = DEFAULT_OUT,
  repo = REPO,
): DirectProductionPlan {
  const absoluteManifest = resolve(manifestPath);
  const wire = JSON.parse(readFileSync(absoluteManifest, "utf8")) as ManifestWire;
  if (wire.format !== "named-crystal-direct-production-2-v1") {
    throw new Error("unknown direct-production-2 format");
  }
  if (
    wire.webPayloadLimitBytes !== 20_000_000 ||
    wire.scientificFrameTarget !== 120 ||
    wire.scientificFrameCountMinimum !== 100 ||
    wire.scientificFrameCountMaximum !== 122
  ) {
    throw new Error("direct-production-2 output contract drift");
  }
  if (
    wire.execution.processConcurrency !== 24 ||
    wire.execution.physicalCores !== 24 ||
    wire.execution.logicalProcessors !== 24
  ) {
    throw new Error("direct-production-2 must use 24 processes on the 24/24 host");
  }
  if (wire.families.length !== 8) throw new Error("direct-production-2 requires eight families");

  const baseline = loadProbePlan(
    resolve(repo, wire.sources.baselineManifest),
    resolve(repo, "out", "direct-production-2-baseline-source-only"),
    repo,
  );
  if (JSON.stringify(baseline.execution) !== JSON.stringify(wire.execution)) {
    throw new Error("direct-production-2 execution differs from baseline source execution");
  }
  const baselineReview = JSON.parse(
    readFileSync(resolve(repo, wire.sources.baselineReview), "utf8"),
  ) as BaselineReviewWire;
  const baselineStatuses = new Map(
    baselineReview.reviews.map(({ typeId, status }) => [typeId, status]),
  );
  const audit = JSON.parse(readFileSync(resolve(repo, wire.sources.currentAudit), "utf8")) as CurrentAuditWire;
  const catalog = JSON.parse(readFileSync(resolve(repo, wire.catalog), "utf8")) as CatalogWire;
  const catalogById = new Map(catalog.entries.map((entry) => [entry.id, entry]));

  const seenTypes = new Set<string>();
  const jobs: DirectProductionJob[] = [];
  for (const family of wire.families) {
    if (seenTypes.has(family.typeId)) throw new Error(`${family.typeId}: duplicate production-2 family`);
    seenTypes.add(family.typeId);
    const catalogEntry = catalogById.get(family.typeId);
    if (catalogEntry === undefined || !["gg", "gg-plus"].includes(catalogEntry.route)) {
      throw new Error(`${family.typeId}: catalog route is not direct growth`);
    }
    if (Object.values(catalogEntry.variants).some((variant) => variant !== null)) {
      throw new Error(`${family.typeId}: catalog family already has an accepted variant`);
    }
    if (!family.dims.every((value) => Number.isSafeInteger(value) && value > 0)) {
      throw new Error(`${family.typeId}: dimensions are invalid`);
    }
    if (!Number.isSafeInteger(family.tickCap) || family.tickCap < 1) {
      throw new Error(`${family.typeId}: tick cap is invalid`);
    }
    if (!existsSync(resolve(repo, family.templateRecord))) {
      throw new Error(`${family.typeId}: template record is missing`);
    }

    let sourceSpec: Record<string, unknown>;
    if (family.sourceKind === "baseline") {
      if (baselineStatuses.get(family.typeId) !== "advance-candidate") {
        throw new Error(`${family.typeId}: baseline source is not advance-candidate`);
      }
      const source = baseline.jobs.find(({ typeId }) => typeId === family.typeId);
      if (
        source === undefined ||
        source.templateRecord !== family.templateRecord ||
        source.specSha256 !== family.sourceSpecSha256
      ) {
        throw new Error(`${family.typeId}: baseline source identity drift`);
      }
      sourceSpec = source.spec;
    } else {
      const asset = audit.assets.find(({ id }) => id === family.sourceId);
      if (
        asset === undefined ||
        asset.sourceRecord !== family.templateRecord ||
        asset.classification.typeId !== family.typeId ||
        asset.classification.match !== "strong"
      ) {
        throw new Error(`${family.typeId}: current-audit source is not an exact strong match`);
      }
      const record = JSON.parse(
        readFileSync(resolve(repo, family.templateRecord), "utf8"),
      ) as TemplateRecordWire;
      if (
        record.domain !== wire.execution.domain ||
        record.seed !== wire.execution.rngSeed ||
        record.noise !== wire.execution.noiseEpsilon
      ) {
        throw new Error(`${family.typeId}: current-audit execution identity drift`);
      }
      sourceSpec = record.spec;
    }
    if (sha256Spec(sourceSpec) !== family.sourceSpecSha256) {
      throw new Error(`${family.typeId}: source spec hash drift`);
    }

    for (const variant of VARIANTS) {
      const spec = scaleSpecRho(sourceSpec, variant.value, catalogEntry.name);
      jobs.push({
        jobId: `${family.typeId}-${variant.slot}`,
        typeId: family.typeId,
        typeName: catalogEntry.name,
        slot: variant.slot,
        sourceLane: `${family.sourceKind}-rho`,
        sourceJobId: family.sourceId,
        sourceSpecSha256: family.sourceSpecSha256,
        driverName: "rho-scale",
        driverValue: variant.value,
        dims: family.dims,
        tickCap: family.tickCap,
        framesEvery: Math.max(1, Math.ceil(family.tickCap / wire.scientificFrameTarget)),
        reviewViews: family.reviewViews,
        spec,
        specSha256: sha256Spec(spec),
      });
    }
  }
  if (jobs.length !== 24 || new Set(jobs.map(({ jobId }) => jobId)).size !== 24) {
    throw new Error("direct-production-2 must materialize 24 unique jobs");
  }
  return {
    manifestPath: absoluteManifest,
    outRoot: resolve(outRoot),
    webPayloadLimitBytes: wire.webPayloadLimitBytes,
    scientificFrameTarget: wire.scientificFrameTarget,
    scientificFrameCountMinimum: wire.scientificFrameCountMinimum,
    scientificFrameCountMaximum: wire.scientificFrameCountMaximum,
    execution: wire.execution,
    jobs,
  };
}

const main = async (): Promise<void> => {
  const [command, ...argv] = process.argv.slice(2);
  const plan = loadDirectProductionPlan2(
    parseArgument(argv, "manifest", DEFAULT_MANIFEST),
    parseArgument(argv, "out-root", DEFAULT_OUT),
  );
  if (command === "plan") printDirectProductionPlan(plan);
  else if (command === "run") await runDirectProductionPlan(plan);
  else throw new Error("usage: named-crystal-direct-production-2.ts plan|run [--manifest file] [--out-root dir]");
};

if (process.argv[1] !== undefined && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}
