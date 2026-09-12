// One-driver stop-time search for the three GG+ hard-form seeds whose feature was erased by growth.
// A fresh run launches all 24 independent jobs concurrently on the registered 24-core host.
//
//   node scripts/named-crystal-early-stop-probes.ts plan
//   node scripts/named-crystal-early-stop-probes.ts run

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

import { loadHardFormPlan } from "./named-crystal-hard-form-probes.ts";

const REPO = resolve(import.meta.dirname, "..");
const DEFAULT_MANIFEST = join(REPO, "docs", "named-snow-crystal-early-stop-probes.json");
const DEFAULT_OUT = join(REPO, "out", "named-crystal-catalog", "early-stop-probes-v1");
const REQUIRED_TYPES = ["scrolls-on-plates", "triangular-forms", "cups"] as const;
type EarlyStopType = (typeof REQUIRED_TYPES)[number];

interface FamilyWire {
  readonly typeId: EarlyStopType;
  readonly sourceDriverName: string;
  readonly sourceDriverValue: number;
  readonly tickValues: readonly number[];
  readonly reviewViews: readonly string[];
  readonly intent: string;
}

interface ManifestWire {
  readonly format: "named-crystal-early-stop-probes-v1";
  readonly sourceHardFormManifest: string;
  readonly sourceReview: string;
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

interface ReviewWire {
  readonly families: readonly { readonly typeId: string; readonly status: string }[];
}

export interface EarlyStopProbe {
  readonly jobId: string;
  readonly typeId: EarlyStopType;
  readonly typeName: string;
  readonly stopTick: number;
  readonly sourceDriverName: string;
  readonly sourceDriverValue: number;
  readonly sourceSpecSha256: string;
  readonly initialSeedSiteCount: number;
  readonly dims: readonly [number, number, number];
  readonly reviewViews: readonly string[];
  readonly intent: string;
  readonly spec: Record<string, unknown>;
  readonly specSha256: string;
}

export interface EarlyStopPlan {
  readonly manifestPath: string;
  readonly outRoot: string;
  readonly webPayloadLimitBytes: number;
  readonly execution: ManifestWire["execution"];
  readonly jobs: readonly EarlyStopProbe[];
}

const canonicalJson = (value: unknown): string => `${JSON.stringify(value, null, 1)}\n`;
const cloneJson = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const sha256Text = (value: string): string => createHash("sha256").update(value).digest("hex");
const assertPositiveInteger = (value: number, label: string): void => {
  if (!Number.isSafeInteger(value) || value < 1) throw new Error(`${label} must be a positive integer`);
};

export function loadEarlyStopPlan(
  manifestPath = DEFAULT_MANIFEST,
  outRoot = DEFAULT_OUT,
  repo = REPO,
): EarlyStopPlan {
  const absoluteManifest = resolve(manifestPath);
  const wire = JSON.parse(readFileSync(absoluteManifest, "utf8")) as ManifestWire;
  if (wire.format !== "named-crystal-early-stop-probes-v1") throw new Error("unknown early-stop format");
  if (wire.webPayloadLimitBytes !== 20_000_000) {
    throw new Error("web payload limit must be exactly 20,000,000 bytes");
  }
  if (
    wire.execution.processConcurrency !== 24 ||
    wire.execution.physicalCores !== 24 ||
    wire.execution.logicalProcessors !== 24
  ) {
    throw new Error("registered early-stop execution must be exactly 24 processes on 24/24 cores");
  }
  if (wire.families.length !== 3) throw new Error("early-stop manifest must contain three families");

  const sourcePlan = loadHardFormPlan(
    resolve(repo, wire.sourceHardFormManifest),
    resolve(repo, "out", "early-stop-source-plan-only"),
    repo,
  );
  if (JSON.stringify(sourcePlan.execution) !== JSON.stringify(wire.execution)) {
    throw new Error("early-stop execution must match its hard-form source execution exactly");
  }
  const review = JSON.parse(readFileSync(resolve(repo, wire.sourceReview), "utf8")) as ReviewWire;
  const eligible = new Set(
    review.families
      .filter(({ status }) => status === "early-stop-required")
      .map(({ typeId }) => typeId),
  );

  const required = new Set<string>(REQUIRED_TYPES);
  const seenFamilies = new Set<string>();
  const seenJobs = new Set<string>();
  const jobs: EarlyStopProbe[] = [];
  for (const family of wire.families) {
    if (!required.has(family.typeId)) throw new Error(`${family.typeId}: not a registered early-stop type`);
    if (!eligible.has(family.typeId)) throw new Error(`${family.typeId}: source review is not early-stop-required`);
    if (seenFamilies.has(family.typeId)) throw new Error(`${family.typeId}: duplicate family`);
    seenFamilies.add(family.typeId);
    if (family.tickValues.length !== 8 || new Set(family.tickValues).size !== 8) {
      throw new Error(`${family.typeId}: exactly eight unique stop ticks are required`);
    }
    if (family.reviewViews.length === 0) throw new Error(`${family.typeId}: reviewViews must be non-empty`);
    const source = sourcePlan.jobs.find((job) =>
      job.typeId === family.typeId &&
      job.driverName === family.sourceDriverName &&
      job.driverValue === family.sourceDriverValue
    );
    if (source === undefined) throw new Error(`${family.typeId}: registered hard-form source job is missing`);
    const geometry = source.spec.seedGeometry as
      | { readonly version?: unknown; readonly kind?: unknown; readonly offsets?: readonly unknown[] }
      | undefined;
    if (geometry?.version !== 1 || geometry.kind !== "siteOffsets" || !Array.isArray(geometry.offsets)) {
      throw new Error(`${family.typeId}: source must contain exact siteOffsets geometry`);
    }
    const initialSeedSiteCount = geometry.offsets.length;
    assertPositiveInteger(initialSeedSiteCount, `${family.typeId}.initialSeedSiteCount`);
    for (const stopTick of family.tickValues) {
      assertPositiveInteger(stopTick, `${family.typeId}.stopTick`);
      const jobId = `${family.typeId}-stop-${stopTick}`;
      if (seenJobs.has(jobId)) throw new Error(`${jobId}: duplicate job`);
      seenJobs.add(jobId);
      const spec = cloneJson(source.spec);
      spec.label = `${source.typeName} — early stop ${stopTick} ticks`;
      jobs.push({
        jobId,
        typeId: family.typeId,
        typeName: source.typeName,
        stopTick,
        sourceDriverName: family.sourceDriverName,
        sourceDriverValue: family.sourceDriverValue,
        sourceSpecSha256: source.specSha256,
        initialSeedSiteCount,
        dims: source.dims,
        reviewViews: family.reviewViews,
        intent: family.intent,
        spec,
        specSha256: sha256Text(canonicalJson(spec)),
      });
    }
  }
  for (const id of required) if (!seenFamilies.has(id)) throw new Error(`${id}: missing early-stop family`);
  if (jobs.length !== 24) throw new Error("early-stop plan must materialize exactly 24 jobs");
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

const jobPaths = (plan: EarlyStopPlan, job: EarlyStopProbe) => {
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

const jobDone = (plan: EarlyStopPlan, job: EarlyStopProbe): boolean => {
  const paths = jobPaths(plan, job);
  if (![paths.mesh, paths.record, paths.growth, paths.exit].every(existsSync)) return false;
  const status = JSON.parse(readFileSync(paths.exit, "utf8")) as Record<string, unknown>;
  return status.exitCode === 0 && status.specSha256 === job.specSha256 &&
    statSync(paths.growth).size < plan.webPayloadLimitBytes;
};

const argvForJob = (plan: EarlyStopPlan, job: EarlyStopProbe): string[] => {
  const paths = jobPaths(plan, job);
  const execution = plan.execution;
  return [
    "--max-old-space-size=4096",
    join(REPO, "scripts", "gutcheck-grow-params.ts"),
    "--spec-file", paths.spec,
    "--dims", job.dims.join(","),
    "--ticks", String(job.stopTick),
    "--seed", String(execution.rngSeed),
    "--noise", String(execution.noiseEpsilon),
    "--domain", execution.domain,
    "--spacing", String(execution.spacing),
    "--sigma", String(execution.sigma),
    "--normal-delta", String(execution.normalDelta),
    "--out-mesh", paths.mesh,
    "--record", paths.record,
    "--growth-out", paths.growth,
    "--metrics-every", "100",
  ];
};

const writeJsonAtomic = (path: string, value: unknown): void => {
  mkdirSync(dirname(path), { recursive: true });
  const temporary = `${path}.${String(process.pid)}.tmp`;
  writeFileSync(temporary, canonicalJson(value));
  renameSync(temporary, path);
};

const printPlan = (plan: EarlyStopPlan): void => {
  for (const job of plan.jobs) {
    console.log(
      `${jobDone(plan, job) ? "done   " : "pending"} ${job.jobId.padEnd(38)} ` +
        `${job.dims.join(",").padEnd(12)} seed=${job.initialSeedSiteCount}`,
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

const runPlan = async (plan: EarlyStopPlan): Promise<void> => {
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
    format: "named-crystal-early-stop-probe-launch-v1",
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
      stopTick: job.stopTick,
      sourceSpecSha256: job.sourceSpecSha256,
      specSha256: job.specSha256,
      argv: argvForJob(plan, job),
    })),
  };
  writeJsonAtomic(join(plan.outRoot, "launch.json"), launch);
  console.log(`launching ${pending.length} pending early-stop probes with ${actualWorkerCount} workers`);

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
      let attachedCount: number | null = null;
      let failure: string | null = null;
      if (childResult.exitCode === 0 && existsSync(paths.growth) && existsSync(paths.record)) {
        webBytes = statSync(paths.growth).size;
        if (webBytes >= plan.webPayloadLimitBytes) {
          failure = `web payload ${webBytes} is not below ${plan.webPayloadLimitBytes}`;
        }
        const record = JSON.parse(readFileSync(paths.record, "utf8")) as Record<string, unknown>;
        attachedCount = typeof record.attachedCount === "number" ? record.attachedCount : null;
        if (attachedCount === null) failure = failure ?? "record attachedCount is missing";
      } else {
        failure = `process exited ${String(childResult.exitCode)}`;
      }
      if (!existsSync(paths.mesh)) failure = failure ?? "required mesh is missing";
      const status = {
        format: "named-crystal-early-stop-probe-exit-v1",
        jobId: job.jobId,
        typeId: job.typeId,
        stopTick: job.stopTick,
        sourceSpecSha256: job.sourceSpecSha256,
        specSha256: job.specSha256,
        initialSeedSiteCount: job.initialSeedSiteCount,
        attachedCount,
        newAttachedSites: attachedCount === null ? null : attachedCount - job.initialSeedSiteCount,
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
          `${webBytes === null ? "" : ` web=${webBytes}`}` +
          `${status.newAttachedSites === null ? "" : ` new=${status.newAttachedSites}`}`,
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
    format: "named-crystal-early-stop-probe-report-v1",
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
  console.log(`early-stop probe fleet complete: ${results.length - failed.length}/${results.length} ok`);
  if (failed.length > 0) process.exitCode = 1;
};

const main = async (): Promise<void> => {
  const [command, ...argv] = process.argv.slice(2);
  const manifest = parseArgument(argv, "manifest", DEFAULT_MANIFEST);
  const outRoot = parseArgument(argv, "out-root", DEFAULT_OUT);
  const plan = loadEarlyStopPlan(manifest, outRoot);
  if (command === "plan") printPlan(plan);
  else if (command === "run") await runPlan(plan);
  else throw new Error("usage: named-crystal-early-stop-probes.ts plan|run [--manifest path] [--out-root path]");
};

if (process.argv[1] !== undefined && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}
