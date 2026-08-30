// First dual-output named-crystal production tranche. Every job emits the compact web growth
// asset and the full scientific products from one identical replay.
//
//   node scripts/named-crystal-direct-production.ts plan
//   node scripts/named-crystal-direct-production.ts run

import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import {
  createReadStream,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { cpus } from "node:os";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { decodeCheckpoint } from "@vcc/core";

import { decodeGrowthAssetV1 } from "../app/src/growth-asset.ts";
import { loadProbePlan } from "./named-crystal-baseline-probes.ts";
import { loadEarlyStopPlan } from "./named-crystal-early-stop-probes.ts";
import { loadHardFormPlan } from "./named-crystal-hard-form-probes.ts";

const REPO = resolve(import.meta.dirname, "..");
const DEFAULT_MANIFEST = join(REPO, "docs", "named-snow-crystal-direct-production.json");
const DEFAULT_OUT = join(REPO, "out", "named-crystal-catalog", "direct-production-v1");
const REQUIRED_TYPES = [
  "solid-columns",
  "sheaths",
  "split-plates-and-stars",
  "isolated-bullets",
  "scrolls-on-plates",
  "triangular-forms",
  "cups",
  "hollow-plates",
] as const;
const VARIANT_SLOTS = ["lower", "baseline", "upper"] as const;

type RequiredType = (typeof REQUIRED_TYPES)[number];
export type VariantSlot = (typeof VARIANT_SLOTS)[number];
type SourceLane = "baseline-rho" | "early-stop" | "hard-form";

interface VariantWire {
  readonly slot: VariantSlot;
  readonly driverValue: number;
  readonly sourceJobId?: string;
  readonly sourceSpecSha256?: string;
}

interface FamilyWire {
  readonly typeId: RequiredType;
  readonly sourceLane: SourceLane;
  readonly sourceSpecSha256?: string;
  readonly driverName: "rho-scale" | "stop-tick" | "cavity-radius";
  readonly variants: readonly VariantWire[];
}

interface ManifestWire {
  readonly format: "named-crystal-direct-production-v1";
  readonly catalog: string;
  readonly sources: {
    readonly baselineManifest: string;
    readonly baselineReview: string;
    readonly earlyStopManifest: string;
    readonly earlyStopReview: string;
    readonly hardFormManifest: string;
    readonly hardFormReview: string;
  };
  readonly webPayloadLimitBytes: number;
  readonly scientificFrameTarget: number;
  readonly scientificFrameCountMinimum: number;
  readonly scientificFrameCountMaximum: number;
  readonly execution: {
    readonly processConcurrency: number;
    readonly hostProcessor: string;
    readonly physicalCores: number;
    readonly logicalProcessors: number;
    readonly rngSeed: number;
    readonly noiseEpsilon: number;
    readonly domain: "hexPrism";
    readonly spacing: number;
    readonly sigma: number;
    readonly normalDelta: number;
  };
  readonly families: readonly FamilyWire[];
}

interface BaselineReviewWire {
  readonly reviews: readonly { readonly typeId: string; readonly status: string }[];
}

interface EarlyReviewWire {
  readonly families: readonly {
    readonly typeId: string;
    readonly status: string;
    readonly selected?: readonly {
      readonly jobId: string;
      readonly stopTick: number;
      readonly specSha256: string;
    }[];
  }[];
}

interface HardReviewWire {
  readonly families: readonly { readonly typeId: string; readonly status: string }[];
}

interface CatalogWire {
  readonly entries: readonly { readonly id: string; readonly name: string; readonly route: string }[];
}

export interface DirectProductionJob {
  readonly jobId: string;
  readonly typeId: string;
  readonly typeName: string;
  readonly slot: VariantSlot;
  readonly sourceLane: string;
  readonly sourceJobId: string;
  readonly sourceSpecSha256: string;
  readonly driverName: string;
  readonly driverValue: number;
  readonly dims: readonly [number, number, number];
  readonly tickCap: number;
  readonly framesEvery: number;
  readonly reviewViews: readonly string[];
  readonly spec: Record<string, unknown>;
  readonly specSha256: string;
}

export interface DirectProductionPlan {
  readonly manifestPath: string;
  readonly outRoot: string;
  readonly webPayloadLimitBytes: number;
  readonly scientificFrameTarget: number;
  readonly scientificFrameCountMinimum: number;
  readonly scientificFrameCountMaximum: number;
  readonly execution: ManifestWire["execution"];
  readonly jobs: readonly DirectProductionJob[];
}

interface FileIdentity {
  readonly path: string;
  readonly byteLength: number;
  readonly sha256: string;
}

const canonicalJson = (value: unknown): string => `${JSON.stringify(value, null, 1)}\n`;
const cloneJson = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const sha256Text = (value: string): string => createHash("sha256").update(value).digest("hex");
const isSha256 = (value: unknown): value is string =>
  typeof value === "string" && /^[0-9a-f]{64}$/.test(value);

const parseArgument = (argv: readonly string[], name: string, fallback: string): string => {
  const index = argv.indexOf(`--${name}`);
  if (index < 0) return fallback;
  const value = argv[index + 1];
  if (value === undefined) throw new Error(`--${name} wants a value`);
  return value;
};

const roundMaterialized = (value: number): number => Number(value.toPrecision(15));

const sameExecution = (left: unknown, right: unknown): boolean =>
  JSON.stringify(left) === JSON.stringify(right);

export function loadDirectProductionPlan(
  manifestPath = DEFAULT_MANIFEST,
  outRoot = DEFAULT_OUT,
  repo = REPO,
): DirectProductionPlan {
  const absoluteManifest = resolve(manifestPath);
  const wire = JSON.parse(readFileSync(absoluteManifest, "utf8")) as ManifestWire;
  if (wire.format !== "named-crystal-direct-production-v1") {
    throw new Error("unknown direct-production format");
  }
  if (wire.webPayloadLimitBytes !== 20_000_000) {
    throw new Error("web payload limit must be exactly 20,000,000 bytes");
  }
  if (
    wire.scientificFrameTarget !== 120 ||
    wire.scientificFrameCountMinimum !== 100 ||
    wire.scientificFrameCountMaximum !== 122
  ) {
    throw new Error("scientific frame contract must be target 120 and accepted count 100..122");
  }
  if (
    wire.execution.processConcurrency !== 24 ||
    wire.execution.physicalCores !== 24 ||
    wire.execution.logicalProcessors !== 24
  ) {
    throw new Error("direct production must register exactly 24 processes on 24/24 cores");
  }
  if (wire.families.length !== 8) throw new Error("direct production must contain eight families");

  const baseline = loadProbePlan(
    resolve(repo, wire.sources.baselineManifest),
    resolve(repo, "out", "direct-production-baseline-source-only"),
    repo,
  );
  const early = loadEarlyStopPlan(
    resolve(repo, wire.sources.earlyStopManifest),
    resolve(repo, "out", "direct-production-early-source-only"),
    repo,
  );
  const hard = loadHardFormPlan(
    resolve(repo, wire.sources.hardFormManifest),
    resolve(repo, "out", "direct-production-hard-source-only"),
    repo,
  );
  for (const [label, execution] of [
    ["baseline", baseline.execution],
    ["early-stop", early.execution],
    ["hard-form", hard.execution],
  ] as const) {
    if (!sameExecution(wire.execution, execution)) {
      throw new Error(`${label} execution differs from direct-production execution`);
    }
  }

  const baselineReview = JSON.parse(
    readFileSync(resolve(repo, wire.sources.baselineReview), "utf8"),
  ) as BaselineReviewWire;
  const earlyReview = JSON.parse(
    readFileSync(resolve(repo, wire.sources.earlyStopReview), "utf8"),
  ) as EarlyReviewWire;
  const hardReview = JSON.parse(
    readFileSync(resolve(repo, wire.sources.hardFormReview), "utf8"),
  ) as HardReviewWire;
  const catalog = JSON.parse(readFileSync(resolve(repo, wire.catalog), "utf8")) as CatalogWire;
  const names = new Map(catalog.entries.map(({ id, name }) => [id, name]));
  const routes = new Map(catalog.entries.map(({ id, route }) => [id, route]));
  const baselineStatuses = new Map(
    baselineReview.reviews.map(({ typeId, status }) => [typeId, status]),
  );
  const earlySelected = new Map(
    earlyReview.families.flatMap((family) =>
      (family.selected ?? []).map((selected) => [selected.jobId, selected] as const),
    ),
  );
  const hardStatuses = new Map(hardReview.families.map(({ typeId, status }) => [typeId, status]));

  const required = new Set<string>(REQUIRED_TYPES);
  const seenTypes = new Set<string>();
  const seenJobs = new Set<string>();
  const jobs: DirectProductionJob[] = [];
  for (const family of wire.families) {
    if (!required.has(family.typeId)) throw new Error(`${family.typeId}: not a registered tranche type`);
    if (seenTypes.has(family.typeId)) throw new Error(`${family.typeId}: duplicate production family`);
    seenTypes.add(family.typeId);
    if (routes.get(family.typeId) !== "gg-plus") {
      throw new Error(`${family.typeId}: direct production route must be gg-plus`);
    }
    const typeName = names.get(family.typeId);
    if (typeName === undefined) throw new Error(`${family.typeId}: catalog row is missing`);
    if (
      family.variants.length !== 3 ||
      new Set(family.variants.map(({ slot }) => slot)).size !== 3 ||
      !VARIANT_SLOTS.every((slot) => family.variants.some((variant) => variant.slot === slot))
    ) {
      throw new Error(`${family.typeId}: lower/baseline/upper variants are required exactly once`);
    }

    for (const variant of family.variants) {
      if (!Number.isFinite(variant.driverValue) || variant.driverValue <= 0) {
        throw new Error(`${family.typeId}.${variant.slot}: driver value must be positive and finite`);
      }
      const jobId = `${family.typeId}-${variant.slot}`;
      if (seenJobs.has(jobId)) throw new Error(`${jobId}: duplicate production job`);
      seenJobs.add(jobId);

      let sourceJobId: string;
      let sourceSpecSha256: string;
      let dims: readonly [number, number, number];
      let tickCap: number;
      let reviewViews: readonly string[];
      let spec: Record<string, unknown>;

      if (family.sourceLane === "baseline-rho") {
        if (family.driverName !== "rho-scale") {
          throw new Error(`${family.typeId}: baseline lane must vary rho-scale`);
        }
        if (!isSha256(family.sourceSpecSha256)) {
          throw new Error(`${family.typeId}: baseline source hash is missing`);
        }
        if (baselineStatuses.get(family.typeId) !== "advance-candidate") {
          throw new Error(`${family.typeId}: baseline review is not advance-candidate`);
        }
        const source = baseline.jobs.find(({ typeId }) => typeId === family.typeId);
        if (source === undefined) throw new Error(`${family.typeId}: baseline source job is missing`);
        if (source.specSha256 !== family.sourceSpecSha256) {
          throw new Error(`${family.typeId}: baseline source hash drift`);
        }
        if (!Number.isFinite(source.spec.rho) || (source.spec.rho as number) <= 0) {
          throw new Error(`${family.typeId}: baseline source must have positive static rho`);
        }
        sourceJobId = family.typeId;
        sourceSpecSha256 = source.specSha256;
        dims = source.dims;
        tickCap = source.tickCap;
        reviewViews = source.reviewViews;
        spec = cloneJson(source.spec);
        spec.rho = roundMaterialized((source.spec.rho as number) * variant.driverValue);
        spec.label = `${typeName} — ${variant.slot} production, rho scale ${variant.driverValue}`;
      } else if (family.sourceLane === "early-stop") {
        if (family.driverName !== "stop-tick") {
          throw new Error(`${family.typeId}: early-stop lane must vary stop-tick`);
        }
        if (variant.sourceJobId === undefined || !isSha256(variant.sourceSpecSha256)) {
          throw new Error(`${jobId}: early-stop source identity is missing`);
        }
        const source = early.jobs.find(({ jobId: candidate }) => candidate === variant.sourceJobId);
        const reviewed = earlySelected.get(variant.sourceJobId);
        if (source === undefined || reviewed === undefined) {
          throw new Error(`${jobId}: early-stop source is not selected by the tracked review`);
        }
        if (
          source.typeId !== family.typeId ||
          source.stopTick !== variant.driverValue ||
          reviewed.stopTick !== variant.driverValue ||
          source.specSha256 !== variant.sourceSpecSha256 ||
          reviewed.specSha256 !== variant.sourceSpecSha256
        ) {
          throw new Error(`${jobId}: early-stop source identity drift`);
        }
        sourceJobId = source.jobId;
        sourceSpecSha256 = source.specSha256;
        dims = source.dims;
        tickCap = source.stopTick;
        reviewViews = source.reviewViews;
        spec = cloneJson(source.spec);
      } else {
        if (family.driverName !== "cavity-radius" || family.typeId !== "hollow-plates") {
          throw new Error(`${family.typeId}: hard-form lane must be Hollow Plates cavity-radius`);
        }
        if (hardStatuses.get(family.typeId) !== "advance-candidate") {
          throw new Error(`${family.typeId}: hard-form review is not advance-candidate`);
        }
        if (variant.sourceJobId === undefined || !isSha256(variant.sourceSpecSha256)) {
          throw new Error(`${jobId}: hard-form source identity is missing`);
        }
        const source = hard.jobs.find(({ jobId: candidate }) => candidate === variant.sourceJobId);
        if (
          source === undefined ||
          source.typeId !== family.typeId ||
          source.driverName !== family.driverName ||
          source.driverValue !== variant.driverValue ||
          source.specSha256 !== variant.sourceSpecSha256
        ) {
          throw new Error(`${jobId}: hard-form source identity drift`);
        }
        sourceJobId = source.jobId;
        sourceSpecSha256 = source.specSha256;
        dims = source.dims;
        tickCap = source.tickCap;
        reviewViews = source.reviewViews;
        spec = cloneJson(source.spec);
      }

      const framesEvery = Math.max(1, Math.ceil(tickCap / wire.scientificFrameTarget));
      jobs.push({
        jobId,
        typeId: family.typeId,
        typeName,
        slot: variant.slot,
        sourceLane: family.sourceLane,
        sourceJobId,
        sourceSpecSha256,
        driverName: family.driverName,
        driverValue: variant.driverValue,
        dims,
        tickCap,
        framesEvery,
        reviewViews,
        spec,
        specSha256: sha256Text(canonicalJson(spec)),
      });
    }
  }
  for (const typeId of required) {
    if (!seenTypes.has(typeId)) throw new Error(`${typeId}: production family is missing`);
  }
  if (jobs.length !== 24) throw new Error("direct production must materialize exactly 24 jobs");
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

const jobPaths = (plan: DirectProductionPlan, job: DirectProductionJob) => {
  const root = join(plan.outRoot, job.jobId);
  return {
    root,
    spec: join(root, "spec.json"),
    mesh: join(root, "mesh.bin"),
    state: join(root, "state.bin"),
    record: join(root, "record.json"),
    growth: join(root, "growth-v1.bin"),
    frames: join(root, "frames"),
    frameManifest: join(root, "frames", "manifest.json"),
    stdout: join(root, "stdout.log"),
    stderr: join(root, "stderr.log"),
    exit: join(root, "exit-status.json"),
  };
};

export const buildProductionArgv = (
  plan: DirectProductionPlan,
  job: DirectProductionJob,
  repo = REPO,
): string[] => {
  const paths = jobPaths(plan, job);
  const execution = plan.execution;
  return [
    "--max-old-space-size=4096",
    join(repo, "scripts", "gutcheck-grow-params.ts"),
    "--spec-file", paths.spec,
    "--dims", job.dims.join(","),
    "--ticks", String(job.tickCap),
    "--seed", String(execution.rngSeed),
    "--noise", String(execution.noiseEpsilon),
    "--domain", execution.domain,
    "--spacing", String(execution.spacing),
    "--sigma", String(execution.sigma),
    "--normal-delta", String(execution.normalDelta),
    "--out-mesh", paths.mesh,
    "--out-state", paths.state,
    "--record", paths.record,
    "--growth-out", paths.growth,
    "--frames-dir", paths.frames,
    "--frames-every", String(job.framesEvery),
    "--metrics-every", String(Math.max(100, job.framesEvery * 10)),
  ];
};

const jobDone = (plan: DirectProductionPlan, job: DirectProductionJob): boolean => {
  const paths = jobPaths(plan, job);
  if (
    ![paths.mesh, paths.state, paths.record, paths.growth, paths.frameManifest, paths.exit].every(
      existsSync,
    )
  ) return false;
  const status = JSON.parse(readFileSync(paths.exit, "utf8")) as Record<string, unknown>;
  return status.exitCode === 0 && status.specSha256 === job.specSha256 &&
    statSync(paths.growth).size < plan.webPayloadLimitBytes;
};

const writeJsonAtomic = (path: string, value: unknown): void => {
  mkdirSync(dirname(path), { recursive: true });
  const temporary = `${path}.${String(process.pid)}.tmp`;
  writeFileSync(temporary, canonicalJson(value));
  renameSync(temporary, path);
};

const sha256File = async (path: string): Promise<string> => {
  const hash = createHash("sha256");
  await new Promise<void>((done, reject) => {
    const stream = createReadStream(path);
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("error", reject);
    stream.on("end", done);
  });
  return hash.digest("hex");
};

const filesBelow = (root: string): string[] => {
  const paths: string[] = [];
  const visit = (directory: string): void => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) visit(path);
      else if (entry.isFile() && entry.name !== "exit-status.json") paths.push(path);
    }
  };
  visit(root);
  return paths.sort((left, right) => left.localeCompare(right));
};

const inventoryJob = async (root: string): Promise<{
  readonly files: readonly FileIdentity[];
  readonly fileCount: number;
  readonly byteLength: number;
  readonly treeSha256: string;
}> => {
  const files: FileIdentity[] = [];
  for (const path of filesBelow(root)) {
    files.push({
      path: relative(root, path).replaceAll("\\", "/"),
      byteLength: statSync(path).size,
      sha256: await sha256File(path),
    });
  }
  const byteLength = files.reduce((total, file) => total + file.byteLength, 0);
  return {
    files,
    fileCount: files.length,
    byteLength,
    treeSha256: sha256Text(canonicalJson(files)),
  };
};

const validateProducts = async (
  plan: DirectProductionPlan,
  job: DirectProductionJob,
): Promise<Record<string, unknown>> => {
  const paths = jobPaths(plan, job);
  for (const [label, path] of Object.entries({
    mesh: paths.mesh,
    state: paths.state,
    record: paths.record,
    growth: paths.growth,
    frameManifest: paths.frameManifest,
  })) {
    if (!existsSync(path) || statSync(path).size < 1) throw new Error(`${label} output is missing or empty`);
  }

  const growthBytes = readFileSync(paths.growth);
  if (growthBytes.byteLength >= plan.webPayloadLimitBytes) {
    throw new Error(
      `web payload ${growthBytes.byteLength} is not below ${plan.webPayloadLimitBytes}`,
    );
  }
  const growthBuffer = Uint8Array.from(growthBytes).buffer;
  const growth = decodeGrowthAssetV1(growthBuffer);
  const record = JSON.parse(readFileSync(paths.record, "utf8")) as Record<string, unknown>;
  const recordTick = record.tick;
  const attachedCount = record.attachedCount;
  if (!Number.isSafeInteger(recordTick) || (recordTick as number) < 1) {
    throw new Error("record tick is invalid");
  }
  if (!Number.isSafeInteger(attachedCount) || (attachedCount as number) < 1) {
    throw new Error("record attachedCount is invalid");
  }
  if (growth.finalTick !== recordTick || growth.eventCount !== attachedCount) {
    throw new Error("growth asset disagrees with the final record");
  }
  const checkpoint = decodeCheckpoint(readFileSync(paths.state));
  if (checkpoint.state.tick !== recordTick) throw new Error("checkpoint tick disagrees with record");
  if (checkpoint.state.a.reduce((total, value) => total + value, 0) !== attachedCount) {
    throw new Error("checkpoint attached field disagrees with record");
  }

  const frameManifest = JSON.parse(readFileSync(paths.frameManifest, "utf8")) as {
    readonly format?: unknown;
    readonly complete?: unknown;
    readonly frames?: readonly { readonly tick?: unknown; readonly file?: unknown }[];
  };
  if (
    frameManifest.format !== "gutcheck-anim-v1" ||
    frameManifest.complete !== true ||
    !Array.isArray(frameManifest.frames)
  ) {
    throw new Error("scientific frame manifest is not a complete gutcheck-anim-v1 timeline");
  }
  const frameCount = frameManifest.frames.length;
  if (
    frameCount < plan.scientificFrameCountMinimum ||
    frameCount > plan.scientificFrameCountMaximum
  ) {
    throw new Error(
      `scientific frame count ${frameCount} is outside ` +
      `${plan.scientificFrameCountMinimum}..${plan.scientificFrameCountMaximum}`,
    );
  }
  const finalFrame = frameManifest.frames.at(-1);
  if (finalFrame?.tick !== recordTick) throw new Error("final scientific frame tick disagrees with record");
  for (const [index, frame] of frameManifest.frames.entries()) {
    if (typeof frame.file !== "string" || !existsSync(join(paths.frames, frame.file))) {
      throw new Error(`scientific frame ${index} file is missing`);
    }
  }

  const inventory = await inventoryJob(paths.root);
  const growthIdentity = inventory.files.find(({ path }) => path === "growth-v1.bin");
  const stateIdentity = inventory.files.find(({ path }) => path === "state.bin");
  const frameBytes = inventory.files
    .filter(({ path }) => path.startsWith("frames/"))
    .reduce((total, file) => total + file.byteLength, 0);
  if (growthIdentity === undefined || stateIdentity === undefined) {
    throw new Error("bundle inventory omitted growth or state identity");
  }
  return {
    webDecoder: "decodeGrowthAssetV1",
    webByteLength: growthIdentity.byteLength,
    webSha256: growthIdentity.sha256,
    eventCount: growth.eventCount,
    seedCount: growth.seedCount,
    finalTick: growth.finalTick,
    attachedCount,
    stateByteLength: stateIdentity.byteLength,
    stateSha256: stateIdentity.sha256,
    frameCount,
    frameBytes,
    bundleFileCount: inventory.fileCount,
    bundleBytes: inventory.byteLength,
    bundleTreeSha256: inventory.treeSha256,
    files: inventory.files,
  };
};

export const printDirectProductionPlan = (plan: DirectProductionPlan): void => {
  for (const job of plan.jobs) {
    console.log(
      `${jobDone(plan, job) ? "done   " : "pending"} ${job.jobId.padEnd(38)} ` +
      `${job.dims.join(",").padEnd(12)} ticks<=${String(job.tickCap).padEnd(5)} ` +
      `framesEvery=${job.framesEvery}`,
    );
  }
  console.log(JSON.stringify({
    jobs: plan.jobs.length,
    families: new Set(plan.jobs.map(({ typeId }) => typeId)).size,
    processConcurrency: plan.execution.processConcurrency,
    physicalCores: plan.execution.physicalCores,
    logicalProcessors: plan.execution.logicalProcessors,
    webPayloadLimitBytes: plan.webPayloadLimitBytes,
    scientificFrameTarget: plan.scientificFrameTarget,
    outRoot: plan.outRoot,
  }));
};

export const runDirectProductionPlan = async (plan: DirectProductionPlan): Promise<void> => {
  const hostLogical = cpus().length;
  const hostModel = cpus()[0]?.model.trim() ?? "unknown";
  if (hostLogical !== plan.execution.logicalProcessors) {
    throw new Error(`host exposes ${hostLogical} logical processors; registered run requires 24`);
  }
  if (!hostModel.includes("285K")) {
    throw new Error(`host processor differs from registered Intel Core Ultra 9 285K: ${hostModel}`);
  }
  mkdirSync(plan.outRoot, { recursive: true });
  const pending = plan.jobs.filter((job) => !jobDone(plan, job));
  const actualWorkerCount = Math.min(plan.execution.processConcurrency, pending.length);
  const launch = {
    format: "named-crystal-direct-production-launch-v1",
    startedAt: new Date().toISOString(),
    cwd: REPO,
    command: process.argv,
    requestedProcessConcurrency: plan.execution.processConcurrency,
    actualWorkerCount,
    host: {
      processor: hostModel,
      physicalCores: plan.execution.physicalCores,
      logicalProcessors: hostLogical,
    },
    jobs: pending.map((job) => ({
      jobId: job.jobId,
      typeId: job.typeId,
      slot: job.slot,
      sourceLane: job.sourceLane,
      sourceJobId: job.sourceJobId,
      sourceSpecSha256: job.sourceSpecSha256,
      specSha256: job.specSha256,
      driverName: job.driverName,
      driverValue: job.driverValue,
      argv: buildProductionArgv(plan, job),
    })),
  };
  writeJsonAtomic(join(plan.outRoot, "launch.json"), launch);
  console.log(
    `launching ${pending.length} pending direct-production jobs with ${actualWorkerCount} workers`,
  );

  let next = 0;
  const newResults: Array<Record<string, unknown>> = [];
  const worker = async (): Promise<void> => {
    while (next < pending.length) {
      const job = pending[next++]!;
      const paths = jobPaths(plan, job);
      mkdirSync(paths.root, { recursive: true });
      writeFileSync(paths.spec, canonicalJson(job.spec));
      writeFileSync(paths.stdout, "");
      writeFileSync(paths.stderr, "");
      const argv = buildProductionArgv(plan, job);
      const startedAt = new Date().toISOString();
      const startedMs = Date.now();
      console.log(`start ${job.jobId}`);
      const childResult = await new Promise<{ exitCode: number | null; pid: number }>((done) => {
        const child = spawn(process.execPath, argv, { cwd: REPO, stdio: ["ignore", "pipe", "pipe"] });
        child.stdout.on("data", (chunk: Buffer) => writeFileSync(paths.stdout, chunk, { flag: "a" }));
        child.stderr.on("data", (chunk: Buffer) => writeFileSync(paths.stderr, chunk, { flag: "a" }));
        child.on("error", () => done({ exitCode: null, pid: child.pid ?? -1 }));
        child.on("close", (exitCode) => done({ exitCode, pid: child.pid ?? -1 }));
      });

      let products: Record<string, unknown> | null = null;
      let failure: string | null = null;
      if (childResult.exitCode === 0) {
        try {
          products = await validateProducts(plan, job);
        } catch (error) {
          failure = error instanceof Error ? error.message : String(error);
        }
      } else {
        failure = `process exited ${String(childResult.exitCode)}`;
      }
      const status = {
        format: "named-crystal-direct-production-exit-v1",
        jobId: job.jobId,
        typeId: job.typeId,
        typeName: job.typeName,
        slot: job.slot,
        sourceLane: job.sourceLane,
        sourceJobId: job.sourceJobId,
        sourceSpecSha256: job.sourceSpecSha256,
        specSha256: job.specSha256,
        driverName: job.driverName,
        driverValue: job.driverValue,
        dims: job.dims,
        tickCap: job.tickCap,
        framesEvery: job.framesEvery,
        reviewViews: job.reviewViews,
        pid: childResult.pid,
        startedAt,
        finishedAt: new Date().toISOString(),
        elapsedSeconds: Math.round((Date.now() - startedMs) / 1000),
        childExitCode: childResult.exitCode,
        exitCode: failure === null ? 0 : 1,
        products,
        failure,
      };
      writeJsonAtomic(paths.exit, status);
      newResults.push(status);
      console.log(
        `${failure === null ? "ok" : "FAIL"} ${job.jobId} ${status.elapsedSeconds}s` +
        `${products === null ? "" : ` web=${String(products.webByteLength)} frames=${String(products.frameCount)}`}`,
      );
    }
  };
  await Promise.all(Array.from({ length: actualWorkerCount }, worker));

  const results = plan.jobs
    .filter((job) => existsSync(jobPaths(plan, job).exit))
    .map((job) => JSON.parse(readFileSync(jobPaths(plan, job).exit, "utf8")) as Record<string, unknown>)
    .sort((left, right) => String(left.jobId).localeCompare(String(right.jobId)));
  const failed = results.filter((result) => result.exitCode !== 0);
  const completed = results.filter((result) => result.exitCode === 0);
  const productRecords = completed.map((result) => result.products as Record<string, unknown>);
  const webSizes = productRecords.map((product) => product.webByteLength as number);
  const report = {
    format: "named-crystal-direct-production-report-v1",
    launch,
    finishedAt: new Date().toISOString(),
    completed: completed.length,
    failed: failed.length,
    missing: plan.jobs.length - results.length,
    webSummary: webSizes.length === 0 ? null : {
      minimumBytes: Math.min(...webSizes),
      maximumBytes: Math.max(...webSizes),
      totalBytes: webSizes.reduce((total, value) => total + value, 0),
      limitBytes: plan.webPayloadLimitBytes,
      allDecoderVerified: productRecords.every((product) => product.webDecoder === "decodeGrowthAssetV1"),
    },
    scientificSummary: productRecords.length === 0 ? null : {
      totalBundleBytes: productRecords.reduce(
        (total, product) => total + (product.bundleBytes as number),
        0,
      ),
      totalBundleFiles: productRecords.reduce(
        (total, product) => total + (product.bundleFileCount as number),
        0,
      ),
      minimumFrameCount: Math.min(...productRecords.map((product) => product.frameCount as number)),
      maximumFrameCount: Math.max(...productRecords.map((product) => product.frameCount as number)),
    },
    results,
  };
  writeJsonAtomic(join(plan.outRoot, "report.json"), report);
  console.log(`direct-production fleet complete: ${completed.length}/${plan.jobs.length} ok`);
  if (failed.length > 0 || results.length !== plan.jobs.length) process.exitCode = 1;
};

const main = async (): Promise<void> => {
  const [command, ...argv] = process.argv.slice(2);
  const manifest = parseArgument(argv, "manifest", DEFAULT_MANIFEST);
  const outRoot = parseArgument(argv, "out-root", DEFAULT_OUT);
  const plan = loadDirectProductionPlan(manifest, outRoot);
  if (command === "plan") printDirectProductionPlan(plan);
  else if (command === "run") await runDirectProductionPlan(plan);
  else throw new Error("usage: named-crystal-direct-production.ts plan|run [--manifest file] [--out-root dir]");
};

if (process.argv[1] !== undefined && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}
