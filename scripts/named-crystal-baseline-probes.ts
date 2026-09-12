// Coverage-first baseline probes for the 24 direct GG/GG+ named-crystal rows. Each job is an
// independent single-threaded process; the registered tranche uses exactly 24 processes on the
// 24-physical-core / 24-logical-processor host. Outputs are exploratory and stay under out/.
//
//   node scripts/named-crystal-baseline-probes.ts plan
//   node scripts/named-crystal-baseline-probes.ts run

// `plan` is read-only. `run` writes exact materialized specs, separate stdout/stderr logs, an
// exit-status file per job, and a launch/final report that records actual concurrency and argv.

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
const DEFAULT_MANIFEST = join(REPO, "docs", "named-snow-crystal-baseline-probes.json");
const DEFAULT_OUT = join(REPO, "out", "named-crystal-catalog", "baseline-probes-v1");

type SeedProfile =
  | "legacy"
  | "simplePrism"
  | "solidColumn"
  | "sheath"
  | "scrollPlate"
  | "triangle"
  | "cup"
  | "splitPlate"
  | "bullet"
  | "needleCluster"
  | "hollowPlate";

type ScheduleProfile = "source" | "twoStage2500" | "multiplyCapped";

interface ProbeJobWire {
  readonly typeId: string;
  readonly templateRecord: string;
  readonly seedProfile: SeedProfile;
  readonly dims: readonly [number, number, number];
  readonly tickCap: number;
  readonly scheduleProfile: ScheduleProfile;
  readonly reviewViews: readonly string[];
  readonly intent: string;
}

interface ProbeManifestWire {
  readonly format: "named-crystal-baseline-probes-v1";
  readonly catalog: string;
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
  readonly jobs: readonly ProbeJobWire[];
}

interface CatalogWire {
  readonly entries: readonly {
    readonly id: string;
    readonly name: string;
    readonly route: string;
  }[];
}

interface TemplateRecordWire {
  readonly spec: Record<string, unknown>;
}

export interface MaterializedProbe {
  readonly typeId: string;
  readonly typeName: string;
  readonly route: "gg" | "gg-plus";
  readonly seedProfile: SeedProfile;
  readonly scheduleProfile: ScheduleProfile;
  readonly dims: readonly [number, number, number];
  readonly tickCap: number;
  readonly reviewViews: readonly string[];
  readonly intent: string;
  readonly templateRecord: string;
  readonly spec: Record<string, unknown>;
  readonly specSha256: string;
}

export interface ProbePlan {
  readonly manifestPath: string;
  readonly outRoot: string;
  readonly webPayloadLimitBytes: number;
  readonly execution: ProbeManifestWire["execution"];
  readonly jobs: readonly MaterializedProbe[];
}

const canonicalJson = (value: unknown): string => `${JSON.stringify(value, null, 1)}\n`;

const sha256Text = (textValue: string): string =>
  createHash("sha256").update(textValue).digest("hex");

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

export function seedGeometryForProfile(profile: SeedProfile): GGSeedGeometryV1 | undefined {
  if (profile === "legacy") return undefined;
  if (profile === "simplePrism") {
    return { version: 1, kind: "hexPrism", radius: 2, thickness: 3 };
  }
  if (profile === "solidColumn") {
    return { version: 1, kind: "hexPrism", radius: 1, thickness: 9 };
  }

  let offsets: GGSeedOffset[] = [];
  if (profile === "sheath") {
    for (let k = -4; k <= 4; k++) offsets.push(...hexLayer(2, k, true));
  } else if (profile === "scrollPlate") {
    offsets = [
      ...hexLayer(2, 0),
      [3, 0, 0],
      [4, 0, 0],
      [4, -1, 0],
      [4, -2, 0],
      [3, -2, 0],
    ];
  } else if (profile === "triangle") {
    for (let u = 0; u <= 6; u++) {
      for (let v = 0; v <= 6 - u; v++) offsets.push([u - 2, v - 2, 0]);
    }
  } else if (profile === "cup") {
    offsets.push(...hexLayer(2, -2));
    for (let k = -1; k <= 2; k++) offsets.push(...hexLayer(2, k, true));
  } else if (profile === "splitPlate") {
    for (const centerI of [-2, 2]) {
      for (const [di, dj, k] of hexLayer(2, 0)) offsets.push([di + centerI, dj, k]);
    }
  } else if (profile === "bullet") {
    for (let k = -4; k <= 0; k++) offsets.push(...hexLayer(1, k));
    offsets.push([0, 0, 1]);
  } else if (profile === "needleCluster") {
    offsets.push(...hexLayer(1, 0));
    const tips = hexLayer(1, 0, true);
    for (const [di, dj] of tips) {
      for (let k = 1; k <= 5; k++) offsets.push([di, dj, k]);
    }
    for (let k = -5; k < 0; k++) offsets.push([0, 0, k]);
  } else if (profile === "hollowPlate") {
    offsets.push(...hexLayer(2, 0, true), ...hexLayer(3, 0, true));
  } else {
    const exhaustive: never = profile;
    throw new Error(`unhandled seed profile ${String(exhaustive)}`);
  }
  return { version: 1, kind: "siteOffsets", offsets: uniqueOffsets(offsets) };
}

const cloneJson = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

export function materializeSpec(
  typeName: string,
  source: Record<string, unknown>,
  seedProfile: SeedProfile,
  scheduleProfile: ScheduleProfile,
): Record<string, unknown> {
  const spec = cloneJson(source);
  spec.label = `${typeName} — named catalog baseline probe`;
  const seedGeometry = seedGeometryForProfile(seedProfile);
  if (seedGeometry === undefined) delete spec.seedGeometry;
  else spec.seedGeometry = seedGeometry;

  if (scheduleProfile !== "source") {
    const stages = spec.stages;
    if (!Array.isArray(stages) || stages.length !== 2) {
      throw new Error(`${typeName}: ${scheduleProfile} requires an exact two-stage source`);
    }
    const first = cloneJson(stages[0] as Record<string, unknown>);
    const second = cloneJson(stages[1] as Record<string, unknown>);
    if (scheduleProfile === "twoStage2500") {
      first.untilTick = 2500;
      second.untilTick = null;
      spec.stages = [first, second];
    } else {
      spec.stages = [
        { ...cloneJson(first), untilTick: 1400 },
        { ...cloneJson(second), untilTick: 2600 },
        { ...cloneJson(first), untilTick: 3800 },
        { ...cloneJson(second), untilTick: null },
      ];
    }
  }
  return spec;
}

const assertPositiveInteger = (value: number, label: string): void => {
  if (!Number.isSafeInteger(value) || value < 1) throw new Error(`${label} must be a positive integer`);
};

export function loadProbePlan(
  manifestPath = DEFAULT_MANIFEST,
  outRoot = DEFAULT_OUT,
  repo = REPO,
): ProbePlan {
  const absoluteManifest = resolve(manifestPath);
  const wire = JSON.parse(readFileSync(absoluteManifest, "utf8")) as ProbeManifestWire;
  if (wire.format !== "named-crystal-baseline-probes-v1") throw new Error("unknown probe format");
  if (wire.seedProfileVersion !== 1) throw new Error("seedProfileVersion must be 1");
  if (wire.webPayloadLimitBytes !== 20_000_000) {
    throw new Error("web payload limit must be exactly 20,000,000 bytes");
  }
  if (
    wire.execution.processConcurrency !== 24 ||
    wire.execution.physicalCores !== 24 ||
    wire.execution.logicalProcessors !== 24
  ) {
    throw new Error("registered baseline probe execution must be exactly 24 processes on 24/24 cores");
  }
  if (wire.jobs.length !== 24) throw new Error(`baseline probe manifest must contain 24 jobs`);

  const catalogPath = resolve(repo, wire.catalog);
  const catalog = JSON.parse(readFileSync(catalogPath, "utf8")) as CatalogWire;
  const directRows = catalog.entries.filter((entry) => entry.route === "gg" || entry.route === "gg-plus");
  const directIds = new Set(directRows.map((entry) => entry.id));
  const names = new Map(directRows.map((entry) => [entry.id, entry.name]));
  const routes = new Map(directRows.map((entry) => [entry.id, entry.route as "gg" | "gg-plus"]));
  if (directIds.size !== 24) throw new Error(`catalog must contain 24 direct-growth rows`);

  const seen = new Set<string>();
  const jobs: MaterializedProbe[] = [];
  for (const job of wire.jobs) {
    if (!directIds.has(job.typeId)) throw new Error(`${job.typeId}: not a direct-growth catalog row`);
    if (seen.has(job.typeId)) throw new Error(`${job.typeId}: duplicate probe job`);
    seen.add(job.typeId);
    if (job.dims.length !== 3) throw new Error(`${job.typeId}: dims must contain three integers`);
    for (const [axis, value] of job.dims.entries()) assertPositiveInteger(value, `${job.typeId}.dims[${axis}]`);
    assertPositiveInteger(job.tickCap, `${job.typeId}.tickCap`);
    if (job.reviewViews.length === 0) throw new Error(`${job.typeId}: reviewViews must be non-empty`);
    const templatePath = resolve(repo, job.templateRecord);
    if (!existsSync(templatePath)) throw new Error(`${job.typeId}: template record is missing`);
    const template = JSON.parse(readFileSync(templatePath, "utf8")) as TemplateRecordWire;
    if (template.spec === null || typeof template.spec !== "object") {
      throw new Error(`${job.typeId}: template record has no spec object`);
    }
    const typeName = names.get(job.typeId)!;
    const spec = materializeSpec(typeName, template.spec, job.seedProfile, job.scheduleProfile);
    const specBytes = canonicalJson(spec);
    jobs.push({
      typeId: job.typeId,
      typeName,
      route: routes.get(job.typeId)!,
      seedProfile: job.seedProfile,
      scheduleProfile: job.scheduleProfile,
      dims: job.dims,
      tickCap: job.tickCap,
      reviewViews: job.reviewViews,
      intent: job.intent,
      templateRecord: job.templateRecord,
      spec,
      specSha256: sha256Text(specBytes),
    });
  }
  for (const id of directIds) if (!seen.has(id)) throw new Error(`${id}: missing baseline probe`);
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
  return index < 0 ? fallback : (argv[index + 1] ?? (() => { throw new Error(`--${name} wants a value`); })());
};

const jobPaths = (plan: ProbePlan, job: MaterializedProbe) => {
  const root = join(plan.outRoot, job.typeId);
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

const jobDone = (plan: ProbePlan, job: MaterializedProbe): boolean => {
  const paths = jobPaths(plan, job);
  if (![paths.mesh, paths.record, paths.growth, paths.exit].every(existsSync)) return false;
  const status = JSON.parse(readFileSync(paths.exit, "utf8")) as Record<string, unknown>;
  return status.exitCode === 0 &&
    status.specSha256 === job.specSha256 &&
    statSync(paths.growth).size < plan.webPayloadLimitBytes;
};

const argvForJob = (plan: ProbePlan, job: MaterializedProbe): string[] => {
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

const printPlan = (plan: ProbePlan): void => {
  for (const job of plan.jobs) {
    console.log(
      `${jobDone(plan, job) ? "done   " : "pending"} ${job.typeId.padEnd(29)} ` +
        `${job.route.padEnd(7)} ${job.dims.join(",").padEnd(12)} ticks<=${job.tickCap} ` +
        `seed=${job.seedProfile}`,
    );
  }
  console.log(
    JSON.stringify({
      jobs: plan.jobs.length,
      processConcurrency: plan.execution.processConcurrency,
      physicalCores: plan.execution.physicalCores,
      logicalProcessors: plan.execution.logicalProcessors,
      webPayloadLimitBytes: plan.webPayloadLimitBytes,
      outRoot: plan.outRoot,
    }),
  );
};

const runPlan = async (plan: ProbePlan): Promise<void> => {
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
  const launch = {
    format: "named-crystal-baseline-probe-launch-v1",
    startedAt: new Date().toISOString(),
    cwd: REPO,
    command: process.argv,
    requestedProcessConcurrency: plan.execution.processConcurrency,
    actualWorkerCount: Math.min(plan.execution.processConcurrency, pending.length),
    host: {
      processor: hostModel,
      physicalCores: plan.execution.physicalCores,
      logicalProcessors: hostLogical,
    },
    jobs: pending.map((job) => ({
      typeId: job.typeId,
      specSha256: job.specSha256,
      argv: argvForJob(plan, job),
    })),
  };
  writeJsonAtomic(join(plan.outRoot, "launch.json"), launch);
  console.log(
    `launching ${pending.length} pending baseline probes with ` +
      `${Math.min(24, pending.length)} process worker(s)`,
  );

  let next = 0;
  const results: Array<Record<string, unknown>> = [];
  const worker = async (): Promise<void> => {
    while (next < pending.length) {
      const job = pending[next++]!;
      const paths = jobPaths(plan, job);
      mkdirSync(paths.root, { recursive: true });
      writeFileSync(paths.spec, canonicalJson(job.spec));
      const argv = argvForJob(plan, job);
      const startedAt = new Date().toISOString();
      const startedMs = Date.now();
      console.log(`start ${job.typeId}`);
      const childResult = await new Promise<{ exitCode: number | null; pid: number }>((done) => {
        const stdout = writeFileSync(paths.stdout, "");
        void stdout;
        writeFileSync(paths.stderr, "");
        const child = spawn(process.execPath, argv, {
          cwd: REPO,
          stdio: ["ignore", "pipe", "pipe"],
        });
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
        format: "named-crystal-baseline-probe-exit-v1",
        typeId: job.typeId,
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
        `${failure === null ? "ok" : "FAIL"} ${job.typeId} ` +
          `${status.elapsedSeconds}s${webBytes === null ? "" : ` web=${webBytes}`}`,
      );
    }
  };
  await Promise.all(
    Array.from({ length: Math.min(plan.execution.processConcurrency, pending.length) }, worker),
  );
  results.sort((left, right) => String(left.typeId).localeCompare(String(right.typeId)));
  const failed = results.filter((result) => result.failure !== null);
  writeJsonAtomic(join(plan.outRoot, "report.json"), {
    format: "named-crystal-baseline-probe-report-v1",
    launch,
    finishedAt: new Date().toISOString(),
    completed: results.length - failed.length,
    failed: failed.length,
    results,
  });
  console.log(`baseline probe fleet complete: ${results.length - failed.length}/${results.length} ok`);
  if (failed.length > 0) process.exitCode = 1;
};

const main = async (): Promise<void> => {
  const [command, ...argv] = process.argv.slice(2);
  const manifest = parseArgument(argv, "manifest", DEFAULT_MANIFEST);
  const outRoot = parseArgument(argv, "out-root", DEFAULT_OUT);
  const plan = loadProbePlan(manifest, outRoot);
  if (command === "plan") printPlan(plan);
  else if (command === "run") await runPlan(plan);
  else throw new Error("usage: named-crystal-baseline-probes.ts plan|run [--manifest path] [--out-root path]");
};

if (process.argv[1] !== undefined && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}
