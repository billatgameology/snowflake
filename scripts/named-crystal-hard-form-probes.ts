// Deterministic four-variant follow-up for the six failed GG+ hard-form baseline probes.
// Each job is an independent single-threaded process; a fresh registered run uses all 24 host
// cores. Outputs are exploratory and stay under out/.
//
//   node scripts/named-crystal-hard-form-probes.ts plan
//   node scripts/named-crystal-hard-form-probes.ts run

import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { cpus } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import type { GGSeedGeometryV1, GGSeedOffset } from "@vcc/solver-cpu";

const REPO = resolve(import.meta.dirname, "..");
const DEFAULT_MANIFEST = join(REPO, "docs", "named-snow-crystal-hard-form-probes.json");
const DEFAULT_OUT = join(REPO, "out", "named-crystal-catalog", "hard-form-probes-v1");

const HARD_FORM_IDS = [
  "scrolls-on-plates",
  "triangular-forms",
  "cups",
  "multiply-capped-columns",
  "needle-clusters",
  "hollow-plates",
] as const;

type HardFormId = (typeof HARD_FORM_IDS)[number];
type SeedProfile = "scrollLip" | "triangle" | "cup" | "legacy" | "needleCluster" | "hollowPlate";
type ScheduleProfile = "source" | "sixStageAlternating";

interface FamilyWire {
  readonly typeId: HardFormId;
  readonly templateRecord: string;
  readonly seedProfile: SeedProfile;
  readonly scheduleProfile: ScheduleProfile;
  readonly driverName: string;
  readonly driverUnit: string;
  readonly driverValues: readonly number[];
  readonly rhoOverride: number | null;
  readonly dims: readonly [number, number, number];
  readonly tickCap: number | "sixIntervals";
  readonly reviewViews: readonly string[];
  readonly intent: string;
}

interface ManifestWire {
  readonly format: "named-crystal-hard-form-probes-v1";
  readonly catalog: string;
  readonly sourceReview: string;
  readonly seedProfileVersion: 1;
  readonly webPayloadLimitBytes: number;
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

interface CatalogWire {
  readonly entries: readonly { readonly id: string; readonly name: string; readonly route: string }[];
}

interface ReviewWire {
  readonly reviews: readonly { readonly typeId: string; readonly status: string }[];
}

interface TemplateRecordWire {
  readonly spec: Record<string, unknown>;
}

export interface HardFormProbe {
  readonly jobId: string;
  readonly typeId: HardFormId;
  readonly typeName: string;
  readonly seedProfile: SeedProfile;
  readonly scheduleProfile: ScheduleProfile;
  readonly driverName: string;
  readonly driverUnit: string;
  readonly driverValue: number;
  readonly dims: readonly [number, number, number];
  readonly tickCap: number;
  readonly reviewViews: readonly string[];
  readonly intent: string;
  readonly templateRecord: string;
  readonly spec: Record<string, unknown>;
  readonly specSha256: string;
}

export interface HardFormPlan {
  readonly manifestPath: string;
  readonly outRoot: string;
  readonly webPayloadLimitBytes: number;
  readonly execution: ManifestWire["execution"];
  readonly jobs: readonly HardFormProbe[];
}

const canonicalJson = (value: unknown): string => `${JSON.stringify(value, null, 1)}\n`;
const cloneJson = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const sha256Text = (value: string): string => createHash("sha256").update(value).digest("hex");
const offsetKey = (offset: GGSeedOffset): string => `${offset[0]},${offset[1]},${offset[2]}`;
const hexDistance = (di: number, dj: number): number =>
  Math.max(Math.abs(di), Math.abs(dj), Math.abs(di + dj));

const hexLayer = (radius: number, k: number, ringOnly = false): GGSeedOffset[] => {
  const offsets: GGSeedOffset[] = [];
  for (let di = -radius; di <= radius; di++) {
    for (let dj = -radius; dj <= radius; dj++) {
      const distance = hexDistance(di, dj);
      if (distance <= radius && (!ringOnly || distance === radius)) offsets.push([di, dj, k]);
    }
  }
  return offsets;
};

const uniqueOffsets = (values: readonly GGSeedOffset[]): GGSeedOffset[] => {
  const seen = new Set<string>();
  const out: GGSeedOffset[] = [];
  for (const offset of values) {
    const key = offsetKey(offset);
    if (!seen.has(key)) {
      seen.add(key);
      out.push(offset);
    }
  }
  return out;
};

export function seedGeometryForHardForm(
  profile: SeedProfile,
  driverValue: number,
): GGSeedGeometryV1 | undefined {
  if (profile === "legacy") return undefined;
  const offsets: GGSeedOffset[] = [];
  if (profile === "scrollLip") {
    offsets.push(...hexLayer(3, 0));
    for (let k = 1; k <= driverValue; k++) {
      offsets.push([3, 0, k], [3, -1, k], [3, -2, k]);
    }
    offsets.push([2, 0, driverValue], [1, 0, driverValue]);
  } else if (profile === "triangle") {
    const shift = Math.floor(driverValue / 3);
    for (let u = 0; u < driverValue; u++) {
      for (let v = 0; v < driverValue - u; v++) offsets.push([u - shift, v - shift, 0]);
    }
  } else if (profile === "cup") {
    offsets.push(...hexLayer(3, -1));
    for (let k = 0; k < driverValue; k++) offsets.push(...hexLayer(3, k, true));
  } else if (profile === "needleCluster") {
    const directions = [
      [1, 0], [0, 1], [-1, 1], [-1, 0], [0, -1], [1, -1],
    ] as const;
    for (let k = -4; k <= 0; k++) offsets.push([0, 0, k]);
    for (const [di, dj] of directions) {
      for (let radial = 1; radial <= driverValue; radial++) {
        offsets.push([di * radial, dj * radial, 0]);
      }
      for (let k = 1; k <= 8; k++) offsets.push([di * driverValue, dj * driverValue, k]);
    }
  } else if (profile === "hollowPlate") {
    for (let k = -1; k <= 1; k++) {
      for (const offset of hexLayer(6, k)) {
        if (hexDistance(offset[0], offset[1]) > driverValue) offsets.push(offset);
      }
    }
  } else {
    const exhaustive: never = profile;
    throw new Error(`unhandled seed profile ${String(exhaustive)}`);
  }
  return { version: 1, kind: "siteOffsets", offsets: uniqueOffsets(offsets) };
}

function materializeSpec(
  typeName: string,
  family: FamilyWire,
  driverValue: number,
  source: Record<string, unknown>,
): { readonly spec: Record<string, unknown>; readonly tickCap: number } {
  const spec = cloneJson(source);
  spec.label = `${typeName} — ${family.driverName} ${driverValue} ${family.driverUnit}`;
  const seedGeometry = seedGeometryForHardForm(family.seedProfile, driverValue);
  if (seedGeometry === undefined) delete spec.seedGeometry;
  else spec.seedGeometry = seedGeometry;

  if (family.rhoOverride !== null) {
    if (Array.isArray(spec.stages)) throw new Error(`${family.typeId}: rhoOverride wants a static spec`);
    spec.rho = family.rhoOverride;
  }

  let tickCap: number;
  if (family.scheduleProfile === "sixStageAlternating") {
    const stages = spec.stages;
    if (!Array.isArray(stages) || stages.length !== 2) {
      throw new Error(`${family.typeId}: sixStageAlternating wants exactly two source stages`);
    }
    const column = cloneJson(stages[0] as Record<string, unknown>);
    const plate = cloneJson(stages[1] as Record<string, unknown>);
    spec.stages = [
      { ...cloneJson(column), untilTick: driverValue },
      { ...cloneJson(plate), untilTick: driverValue * 2 },
      { ...cloneJson(column), untilTick: driverValue * 3 },
      { ...cloneJson(plate), untilTick: driverValue * 4 },
      { ...cloneJson(column), untilTick: driverValue * 5 },
      { ...cloneJson(plate), untilTick: null },
    ];
    if (family.tickCap !== "sixIntervals") {
      throw new Error(`${family.typeId}: alternating schedule tickCap must be sixIntervals`);
    }
    tickCap = driverValue * 6;
  } else {
    if (family.tickCap === "sixIntervals") {
      throw new Error(`${family.typeId}: source schedule requires an integer tickCap`);
    }
    tickCap = family.tickCap;
  }
  return { spec, tickCap };
}

const assertPositiveInteger = (value: number, label: string): void => {
  if (!Number.isSafeInteger(value) || value < 1) throw new Error(`${label} must be a positive integer`);
};

export function loadHardFormPlan(
  manifestPath = DEFAULT_MANIFEST,
  outRoot = DEFAULT_OUT,
  repo = REPO,
): HardFormPlan {
  const absoluteManifest = resolve(manifestPath);
  const wire = JSON.parse(readFileSync(absoluteManifest, "utf8")) as ManifestWire;
  if (wire.format !== "named-crystal-hard-form-probes-v1") throw new Error("unknown hard-form format");
  if (wire.seedProfileVersion !== 1) throw new Error("seedProfileVersion must be 1");
  if (wire.webPayloadLimitBytes !== 20_000_000) {
    throw new Error("web payload limit must be exactly 20,000,000 bytes");
  }
  if (
    wire.execution.processConcurrency !== 24 ||
    wire.execution.physicalCores !== 24 ||
    wire.execution.logicalProcessors !== 24
  ) {
    throw new Error("registered hard-form execution must be exactly 24 processes on 24/24 cores");
  }
  if (wire.families.length !== 6) throw new Error("hard-form manifest must contain six families");

  const catalog = JSON.parse(readFileSync(resolve(repo, wire.catalog), "utf8")) as CatalogWire;
  const names = new Map(catalog.entries.map((entry) => [entry.id, entry.name]));
  const routes = new Map(catalog.entries.map((entry) => [entry.id, entry.route]));
  const review = JSON.parse(readFileSync(resolve(repo, wire.sourceReview), "utf8")) as ReviewWire;
  const failedIds = new Set(
    review.reviews.filter(({ status }) => status === "failed-probe").map(({ typeId }) => typeId),
  );

  const required = new Set<string>(HARD_FORM_IDS);
  const seenFamilies = new Set<string>();
  const seenJobs = new Set<string>();
  const jobs: HardFormProbe[] = [];
  for (const family of wire.families) {
    if (!required.has(family.typeId)) throw new Error(`${family.typeId}: not a registered hard form`);
    if (!failedIds.has(family.typeId)) throw new Error(`${family.typeId}: source review is not failed-probe`);
    if (routes.get(family.typeId) !== "gg-plus") throw new Error(`${family.typeId}: catalog route must be gg-plus`);
    if (seenFamilies.has(family.typeId)) throw new Error(`${family.typeId}: duplicate family`);
    seenFamilies.add(family.typeId);
    if (family.driverValues.length !== 4 || new Set(family.driverValues).size !== 4) {
      throw new Error(`${family.typeId}: exactly four unique driver values are required`);
    }
    for (const [axis, value] of family.dims.entries()) {
      assertPositiveInteger(value, `${family.typeId}.dims[${axis}]`);
    }
    if (family.reviewViews.length === 0) throw new Error(`${family.typeId}: reviewViews must be non-empty`);
    const templatePath = resolve(repo, family.templateRecord);
    if (!existsSync(templatePath)) throw new Error(`${family.typeId}: template record is missing`);
    const template = JSON.parse(readFileSync(templatePath, "utf8")) as TemplateRecordWire;
    const typeName = names.get(family.typeId);
    if (typeName === undefined) throw new Error(`${family.typeId}: catalog row is missing`);
    for (const driverValue of family.driverValues) {
      assertPositiveInteger(driverValue, `${family.typeId}.${family.driverName}`);
      const jobId = `${family.typeId}-${family.driverName}-${driverValue}`;
      if (seenJobs.has(jobId)) throw new Error(`${jobId}: duplicate job`);
      seenJobs.add(jobId);
      const materialized = materializeSpec(typeName, family, driverValue, template.spec);
      const specBytes = canonicalJson(materialized.spec);
      jobs.push({
        jobId,
        typeId: family.typeId,
        typeName,
        seedProfile: family.seedProfile,
        scheduleProfile: family.scheduleProfile,
        driverName: family.driverName,
        driverUnit: family.driverUnit,
        driverValue,
        dims: family.dims,
        tickCap: materialized.tickCap,
        reviewViews: family.reviewViews,
        intent: family.intent,
        templateRecord: family.templateRecord,
        spec: materialized.spec,
        specSha256: sha256Text(specBytes),
      });
    }
  }
  for (const id of required) if (!seenFamilies.has(id)) throw new Error(`${id}: missing hard-form family`);
  if (jobs.length !== 24) throw new Error("hard-form plan must materialize exactly 24 jobs");
  return {
    manifestPath: absoluteManifest,
    outRoot: resolve(outRoot),
    webPayloadLimitBytes: wire.webPayloadLimitBytes,
    execution: wire.execution,
    jobs,
  };
}

const parseArgument = (argv: readonly string[], name: string, fallback: string): string => {
  const index = argv.indexOf(`--${name}`);
  if (index < 0) return fallback;
  const value = argv[index + 1];
  if (value === undefined) throw new Error(`--${name} wants a value`);
  return value;
};

const jobPaths = (plan: HardFormPlan, job: HardFormProbe) => {
  const root = join(plan.outRoot, job.jobId);
  return {
    root,
    spec: join(root, "spec.json"),
    mesh: join(root, "mesh.bin"),
    record: join(root, "record.json"),
    growth: join(root, "growth-v1.bin"),
    stdout: join(root, "stdout.log"),
    stderr: join(root, "stderr.log"),
    exit: join(root, "exit-status.json"),
  };
};

const jobDone = (plan: HardFormPlan, job: HardFormProbe): boolean => {
  const paths = jobPaths(plan, job);
  if (![paths.mesh, paths.record, paths.growth, paths.exit].every(existsSync)) return false;
  const status = JSON.parse(readFileSync(paths.exit, "utf8")) as Record<string, unknown>;
  return status.exitCode === 0 && status.specSha256 === job.specSha256 &&
    statSync(paths.growth).size < plan.webPayloadLimitBytes;
};

const argvForJob = (plan: HardFormPlan, job: HardFormProbe): string[] => {
  const paths = jobPaths(plan, job);
  const execution = plan.execution;
  return [
    "--max-old-space-size=4096",
    join(REPO, "scripts", "gutcheck-grow-params.ts"),
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
    "--record", paths.record,
    "--growth-out", paths.growth,
    "--metrics-every", "1000",
  ];
};

const writeJsonAtomic = (path: string, value: unknown): void => {
  mkdirSync(dirname(path), { recursive: true });
  const temporary = `${path}.${String(process.pid)}.tmp`;
  writeFileSync(temporary, canonicalJson(value));
  renameSync(temporary, path);
};

const printPlan = (plan: HardFormPlan): void => {
  for (const job of plan.jobs) {
    console.log(
      `${jobDone(plan, job) ? "done   " : "pending"} ${job.jobId.padEnd(60)} ` +
        `${job.dims.join(",").padEnd(12)} ticks<=${job.tickCap}`,
    );
  }
  console.log(JSON.stringify({
    jobs: plan.jobs.length,
    families: new Set(plan.jobs.map(({ typeId }) => typeId)).size,
    processConcurrency: plan.execution.processConcurrency,
    physicalCores: plan.execution.physicalCores,
    logicalProcessors: plan.execution.logicalProcessors,
    webPayloadLimitBytes: plan.webPayloadLimitBytes,
    outRoot: plan.outRoot,
  }));
};

const runPlan = async (plan: HardFormPlan): Promise<void> => {
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
    format: "named-crystal-hard-form-probe-launch-v1",
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
      driverName: job.driverName,
      driverValue: job.driverValue,
      specSha256: job.specSha256,
      argv: argvForJob(plan, job),
    })),
  };
  writeJsonAtomic(join(plan.outRoot, "launch.json"), launch);
  console.log(`launching ${pending.length} pending hard-form probes with ${actualWorkerCount} workers`);

  let next = 0;
  const results: Array<Record<string, unknown>> = [];
  const worker = async (): Promise<void> => {
    while (next < pending.length) {
      const job = pending[next++]!;
      const paths = jobPaths(plan, job);
      mkdirSync(paths.root, { recursive: true });
      writeFileSync(paths.spec, canonicalJson(job.spec));
      writeFileSync(paths.stdout, "");
      writeFileSync(paths.stderr, "");
      const argv = argvForJob(plan, job);
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
      let webBytes: number | null = null;
      let failure: string | null = null;
      if (childResult.exitCode === 0 && existsSync(paths.growth)) {
        webBytes = statSync(paths.growth).size;
        if (webBytes >= plan.webPayloadLimitBytes) {
          failure = `web payload ${webBytes} is not below ${plan.webPayloadLimitBytes}`;
        }
      } else {
        failure = `process exited ${String(childResult.exitCode)}`;
      }
      if (!existsSync(paths.record) || !existsSync(paths.mesh)) {
        failure = failure ?? "required record or mesh is missing";
      }
      const status = {
        format: "named-crystal-hard-form-probe-exit-v1",
        jobId: job.jobId,
        typeId: job.typeId,
        driverName: job.driverName,
        driverValue: job.driverValue,
        specSha256: job.specSha256,
        pid: childResult.pid,
        startedAt,
        finishedAt: new Date().toISOString(),
        elapsedSeconds: Math.round((Date.now() - startedMs) / 1000),
        exitCode: failure === null ? 0 : childResult.exitCode,
        webBytes,
        webPayloadLimitBytes: plan.webPayloadLimitBytes,
        failure,
      };
      writeJsonAtomic(paths.exit, status);
      results.push(status);
      console.log(
        `${failure === null ? "ok" : "FAIL"} ${job.jobId} ${status.elapsedSeconds}s` +
          `${webBytes === null ? "" : ` web=${webBytes}`}`,
      );
    }
  };
  await Promise.all(Array.from({ length: actualWorkerCount }, worker));
  results.sort((left, right) => String(left.jobId).localeCompare(String(right.jobId)));
  const failed = results.filter((result) => result.failure !== null);
  const webSizes = results
    .map((result) => result.webBytes)
    .filter((value): value is number => typeof value === "number");
  writeJsonAtomic(join(plan.outRoot, "report.json"), {
    format: "named-crystal-hard-form-probe-report-v1",
    launch,
    finishedAt: new Date().toISOString(),
    completed: results.length - failed.length,
    failed: failed.length,
    webSummary: {
      minimumBytes: webSizes.length === 0 ? null : Math.min(...webSizes),
      maximumBytes: webSizes.length === 0 ? null : Math.max(...webSizes),
      totalBytes: webSizes.reduce((sum, value) => sum + value, 0),
      limitBytes: plan.webPayloadLimitBytes,
    },
    results,
  });
  console.log(`hard-form probe fleet complete: ${results.length - failed.length}/${results.length} ok`);
  if (failed.length > 0) process.exitCode = 1;
};

const main = async (): Promise<void> => {
  const [command, ...argv] = process.argv.slice(2);
  const manifest = parseArgument(argv, "manifest", DEFAULT_MANIFEST);
  const outRoot = parseArgument(argv, "out-root", DEFAULT_OUT);
  const plan = loadHardFormPlan(manifest, outRoot);
  if (command === "plan") printPlan(plan);
  else if (command === "run") await runPlan(plan);
  else throw new Error("usage: named-crystal-hard-form-probes.ts plan|run [--manifest path] [--out-root path]");
};

if (process.argv[1] !== undefined && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}
