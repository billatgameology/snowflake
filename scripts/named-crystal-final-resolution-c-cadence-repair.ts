// Bounded timeline-cadence repair for the three Fleet C jobs that stopped at domain contact
// before their tick caps and therefore emitted fewer than 100 scientific mesh states.
//
//   node scripts/named-crystal-final-resolution-c-cadence-repair.ts plan
//   node scripts/named-crystal-final-resolution-c-cadence-repair.ts run

import { createHash } from "node:crypto";
import {
  copyFileSync,
  createReadStream,
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { type GrowthAssetV1, decodeGrowthAssetV1 } from "../app/src/growth-asset.ts";
import {
  type DirectProductionJob,
  type DirectProductionPlan,
  directProductionJobPaths,
  runDirectProductionPlan,
  validateDirectProductionProducts,
} from "./named-crystal-direct-production.ts";
import {
  loadFinalResolutionPlanC,
  verifyFinalResolutionVerticalClearanceC,
} from "./named-crystal-final-resolution-production-c.ts";

const REPO = resolve(import.meta.dirname, "..");
const DEFAULT_MANIFEST = join(
  REPO,
  "docs",
  "named-snow-crystal-final-resolution-c-cadence-repair.json",
);
const INVARIANT_FILES = ["mesh.bin", "state.bin", "record.json", "growth-v1.bin"] as const;

interface IdentityWire {
  readonly path?: string;
  readonly byteLength: number;
  readonly sha256: string;
}

export interface RepairJobWire {
  readonly jobId: string;
  readonly finalTick: number;
  readonly firstFramesEvery: number;
  readonly firstFrameCount: number;
  readonly repairFramesEvery: number;
  readonly expectedRepairFrameCount: number;
  readonly invariantFiles: Readonly<Record<(typeof INVARIANT_FILES)[number], IdentityWire>>;
}

interface RepairManifestWire {
  readonly format: "named-crystal-final-resolution-c-cadence-repair-v1";
  readonly fleetManifest: string;
  readonly firstPassRoot: string;
  readonly repairRoot: string;
  readonly archiveRoot: string;
  readonly firstPass: {
    readonly report: IdentityWire & { readonly path: string };
    readonly launch: IdentityWire & { readonly path: string };
    readonly verticalClearance: IdentityWire & { readonly path: string };
  };
  readonly jobs: readonly RepairJobWire[];
}

interface ProductWire {
  readonly webByteLength: number;
  readonly webDecoder: string;
  readonly frameCount: number;
  readonly bundleBytes: number;
  readonly bundleFileCount: number;
  readonly finalTick: number;
}

interface ResultWire {
  readonly jobId: string;
  readonly exitCode: number;
  readonly framesEvery: number;
  readonly failure: string | null;
  readonly products: ProductWire | null;
}

interface ReportWire {
  readonly format: "named-crystal-direct-production-report-v1";
  readonly launch: {
    readonly requestedProcessConcurrency: number;
    readonly actualWorkerCount: number;
  } & Record<string, unknown>;
  readonly completed: number;
  readonly failed: number;
  readonly missing: number;
  readonly results: readonly ResultWire[];
}

export interface FleetCCadenceRepairPlan {
  readonly manifestPath: string;
  readonly wire: RepairManifestWire;
  readonly firstPassRoot: string;
  readonly repairRoot: string;
  readonly archiveRoot: string;
  readonly sourcePlan: ReturnType<typeof loadFinalResolutionPlanC>;
  readonly repairPlan: DirectProductionPlan;
  readonly jobs: readonly RepairJobWire[];
  readonly initialReportPath: string;
}

const canonicalJson = (value: unknown): string => `${JSON.stringify(value, null, 2)}\n`;
const sha256 = (bytes: Uint8Array | string): string => createHash("sha256").update(bytes).digest("hex");
const isSha256 = (value: string): boolean => /^[0-9a-f]{64}$/.test(value);

const argument = (argv: readonly string[], name: string, fallback?: string): string | undefined => {
  const index = argv.indexOf(`--${name}`);
  if (index < 0) return fallback;
  const value = argv[index + 1];
  if (value === undefined) throw new Error(`--${name} wants a value`);
  return value;
};

const assertContained = (parent: string, child: string): void => {
  const rel = relative(resolve(parent), resolve(child));
  if (rel === "" || rel.startsWith("..") || resolve(rel) === rel) {
    throw new Error(`${child}: repair target is not strictly below ${parent}`);
  }
};

const fileIdentity = (path: string): IdentityWire => {
  const bytes = readFileSync(path);
  return { byteLength: bytes.byteLength, sha256: sha256(bytes) };
};

const sameIdentity = (path: string, expected: IdentityWire): boolean => {
  if (!existsSync(path) || statSync(path).size !== expected.byteLength || !isSha256(expected.sha256)) {
    return false;
  }
  return fileIdentity(path).sha256 === expected.sha256;
};

export const requireFleetCRepairFileIdentity = (
  path: string,
  expected: IdentityWire,
  label: string,
): void => {
  if (!sameIdentity(path, expected)) {
    const actual = existsSync(path) ? fileIdentity(path) : null;
    throw new Error(`${label}: identity drift; got ${JSON.stringify(actual)}`);
  }
};

const readReport = (path: string): ReportWire => JSON.parse(readFileSync(path, "utf8")) as ReportWire;

export const materializeFleetCCadenceRepairJobs = (
  sourcePlan: ReturnType<typeof loadFinalResolutionPlanC>,
  jobs: readonly RepairJobWire[],
): DirectProductionJob[] => {
  if (jobs.length !== 3 || new Set(jobs.map(({ jobId }) => jobId)).size !== 3) {
    throw new Error("Fleet C cadence repair requires exactly three unique jobs");
  }
  return jobs.map((repair) => {
    const source = sourcePlan.production.jobs.find(({ jobId }) => jobId === repair.jobId);
    if (source === undefined) throw new Error(`${repair.jobId}: repair job is absent from Fleet C`);
    if (
      source.framesEvery !== repair.firstFramesEvery ||
      repair.firstFrameCount < 1 ||
      repair.firstFrameCount >= sourcePlan.production.scientificFrameCountMinimum ||
      repair.expectedRepairFrameCount !== 121 ||
      repair.repairFramesEvery < 1 ||
      repair.repairFramesEvery >= repair.firstFramesEvery
    ) {
      throw new Error(`${repair.jobId}: registered cadence/count contract drift`);
    }
    if (
      INVARIANT_FILES.some((name) => {
        const identity = repair.invariantFiles[name];
        return identity.byteLength < 1 || !isSha256(identity.sha256);
      })
    ) {
      throw new Error(`${repair.jobId}: invalid invariant product identity`);
    }
    return { ...source, framesEvery: repair.repairFramesEvery };
  });
};

export function loadFleetCCadenceRepairPlan(
  manifestPath = DEFAULT_MANIFEST,
  repo = REPO,
): FleetCCadenceRepairPlan {
  const absoluteManifest = resolve(manifestPath);
  const wire = JSON.parse(readFileSync(absoluteManifest, "utf8")) as RepairManifestWire;
  if (wire.format !== "named-crystal-final-resolution-c-cadence-repair-v1") {
    throw new Error("unknown Fleet C cadence-repair format");
  }
  const firstPassRoot = resolve(repo, wire.firstPassRoot);
  const repairRoot = resolve(repo, wire.repairRoot);
  const archiveRoot = resolve(repo, wire.archiveRoot);
  const outParent = resolve(repo, "out", "named-crystal-catalog");
  assertContained(outParent, firstPassRoot);
  assertContained(outParent, repairRoot);
  assertContained(outParent, archiveRoot);
  if (new Set([firstPassRoot, repairRoot, archiveRoot]).size !== 3) {
    throw new Error("Fleet C repair roots must be distinct");
  }

  const sourcePlan = loadFinalResolutionPlanC(resolve(repo, wire.fleetManifest), firstPassRoot, repo);
  const repairJobs = materializeFleetCCadenceRepairJobs(sourcePlan, wire.jobs);
  const archivedInitialReport = join(archiveRoot, "first-pass-report.json");
  const initialReportPath = sameIdentity(resolve(repo, wire.firstPass.report.path), wire.firstPass.report)
    ? resolve(repo, wire.firstPass.report.path)
    : archivedInitialReport;
  requireFleetCRepairFileIdentity(initialReportPath, wire.firstPass.report, "Fleet C first-pass report");
  requireFleetCRepairFileIdentity(
    resolve(repo, wire.firstPass.launch.path),
    wire.firstPass.launch,
    "Fleet C first-pass launch",
  );
  requireFleetCRepairFileIdentity(
    resolve(repo, wire.firstPass.verticalClearance.path),
    wire.firstPass.verticalClearance,
    "Fleet C first-pass clearance",
  );
  const initial = readReport(initialReportPath);
  const failures = initial.results.filter(({ exitCode }) => exitCode !== 0);
  if (
    initial.format !== "named-crystal-direct-production-report-v1" ||
    initial.completed !== 21 || initial.failed !== 3 || initial.missing !== 0 ||
    initial.launch.requestedProcessConcurrency !== 24 || initial.launch.actualWorkerCount !== 24 ||
    failures.map(({ jobId }) => jobId).sort().join(",") !== jobsSorted(wire.jobs)
  ) {
    throw new Error("Fleet C first-pass failure contract drift");
  }
  for (const repair of wire.jobs) {
    const failed = failures.find(({ jobId }) => jobId === repair.jobId)!;
    if (failed.framesEvery !== repair.firstFramesEvery || failed.failure === null) {
      throw new Error(`${repair.jobId}: first-pass failed status drift`);
    }
    const originalJobRoot = existsSync(join(archiveRoot, repair.jobId))
      ? join(archiveRoot, repair.jobId)
      : join(firstPassRoot, repair.jobId);
    for (const name of INVARIANT_FILES) {
      requireFleetCRepairFileIdentity(
        join(originalJobRoot, name),
        repair.invariantFiles[name],
        `${repair.jobId}/${name}`,
      );
    }
    const record = JSON.parse(readFileSync(join(originalJobRoot, "record.json"), "utf8")) as {
      readonly tick?: unknown;
    };
    if (record.tick !== repair.finalTick) throw new Error(`${repair.jobId}: first-pass final tick drift`);
  }
  return {
    manifestPath: absoluteManifest,
    wire,
    firstPassRoot,
    repairRoot,
    archiveRoot,
    sourcePlan,
    repairPlan: {
      ...sourcePlan.production,
      outRoot: repairRoot,
      jobs: repairJobs,
    },
    jobs: wire.jobs,
    initialReportPath,
  };
}

const jobsSorted = (jobs: readonly { readonly jobId: string }[]): string =>
  jobs.map(({ jobId }) => jobId).sort().join(",");

const completeRepairReport = (plan: FleetCCadenceRepairPlan): ReportWire | null => {
  const path = join(plan.repairRoot, "report.json");
  if (!existsSync(path)) return null;
  const report = readReport(path);
  if (
    report.format !== "named-crystal-direct-production-report-v1" ||
    report.completed !== 3 || report.failed !== 0 || report.missing !== 0 ||
    report.launch.requestedProcessConcurrency !== 24 || report.launch.actualWorkerCount !== 3 ||
    jobsSorted(report.results) !== jobsSorted(plan.jobs)
  ) return null;
  return report;
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

const normalizedRecord = (value: Record<string, unknown>): Record<string, unknown> => {
  const normalized = structuredClone(value);
  const mesh = normalized.mesh as Record<string, unknown> | undefined;
  const growth = normalized.growth as Record<string, unknown> | undefined;
  if (mesh !== undefined) mesh.path = "<generated-output-path>";
  if (growth !== undefined) {
    growth.path = "<generated-output-path>";
    growth.bytes = "<generated-web-byte-length>";
  }
  normalized.elapsedSeconds = "<wall-clock-duration>";
  return normalized;
};

export const assertFleetCRepairRecordsEquivalent = (
  firstPass: Record<string, unknown>,
  repaired: Record<string, unknown>,
  label: string,
): void => {
  if (JSON.stringify(normalizedRecord(firstPass)) !== JSON.stringify(normalizedRecord(repaired))) {
    throw new Error(`${label}: repaired record changed outside generated paths/web bytes/wall time`);
  }
};

export const assertFleetCRepairGrowthEquivalent = (
  firstPass: GrowthAssetV1,
  repaired: GrowthAssetV1,
  label: string,
): void => {
  const scalarEqual =
    firstPass.eventCount === repaired.eventCount &&
    firstPass.seedCount === repaired.seedCount &&
    firstPass.finalTick === repaired.finalTick &&
    firstPass.dims.join(",") === repaired.dims.join(",") &&
    firstPass.center.join(",") === repaired.center.join(",");
  const arraysEqual = (left: Uint32Array, right: Uint32Array): boolean => {
    if (left.length !== right.length) return false;
    for (let index = 0; index < left.length; index++) {
      if (left[index] !== right[index]) return false;
    }
    return true;
  };
  if (
    !scalarEqual ||
    !arraysEqual(firstPass.flatIndices, repaired.flatIndices) ||
    !arraysEqual(firstPass.attachTicks, repaired.attachTicks)
  ) {
    throw new Error(`${label}: repaired decoded growth events changed`);
  }
};

const decodeGrowthFile = (path: string): GrowthAssetV1 => {
  const bytes = readFileSync(path);
  return decodeGrowthAssetV1(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
};

const verifyRepairProducts = async (
  plan: FleetCCadenceRepairPlan,
  report: ReportWire,
): Promise<void> => {
  for (const repair of plan.jobs) {
    const job = plan.repairPlan.jobs.find(({ jobId }) => jobId === repair.jobId)!;
    const result = report.results.find(({ jobId }) => jobId === repair.jobId);
    if (
      result?.exitCode !== 0 || result.failure !== null ||
      result.framesEvery !== repair.repairFramesEvery ||
      result.products?.frameCount !== repair.expectedRepairFrameCount ||
      result.products.finalTick !== repair.finalTick ||
      result.products.webDecoder !== "decodeGrowthAssetV1" ||
      result.products.webByteLength >= plan.repairPlan.webPayloadLimitBytes
    ) {
      throw new Error(`${repair.jobId}: repaired result contract failed`);
    }
    const paths = directProductionJobPaths(plan.repairPlan, job);
    await validateDirectProductionProducts(plan.repairPlan, job);
    const originalRoot = existsSync(join(plan.archiveRoot, repair.jobId))
      ? join(plan.archiveRoot, repair.jobId)
      : join(plan.firstPassRoot, repair.jobId);
    for (const name of ["mesh.bin", "state.bin"] as const) {
      const path = join(paths.root, name);
      const expected = repair.invariantFiles[name];
      if (statSync(path).size !== expected.byteLength || await sha256File(path) !== expected.sha256) {
        throw new Error(`${repair.jobId}/${name}: repaired final solver identity changed`);
      }
    }
    assertFleetCRepairRecordsEquivalent(
      JSON.parse(readFileSync(join(originalRoot, "record.json"), "utf8")) as Record<string, unknown>,
      JSON.parse(readFileSync(join(paths.root, "record.json"), "utf8")) as Record<string, unknown>,
      repair.jobId,
    );
    assertFleetCRepairGrowthEquivalent(
      decodeGrowthFile(join(originalRoot, "growth-v1.bin")),
      decodeGrowthFile(join(paths.root, "growth-v1.bin")),
      repair.jobId,
    );
  }
};

const copyFirstPassControls = (plan: FleetCCadenceRepairPlan): void => {
  mkdirSync(plan.archiveRoot, { recursive: true });
  const copies = [
    [plan.initialReportPath, join(plan.archiveRoot, "first-pass-report.json")],
    [resolve(REPO, plan.wire.firstPass.launch.path), join(plan.archiveRoot, "first-pass-launch.json")],
    [
      resolve(REPO, plan.wire.firstPass.verticalClearance.path),
      join(plan.archiveRoot, "first-pass-vertical-clearance.json"),
    ],
    [join(plan.repairRoot, "launch.json"), join(plan.archiveRoot, "repair-launch.json")],
    [join(plan.repairRoot, "report.json"), join(plan.archiveRoot, "repair-report.json")],
  ] as const;
  for (const [source, destination] of copies) {
    if (!existsSync(destination)) copyFileSync(source, destination);
  }
  requireFleetCRepairFileIdentity(
    join(plan.archiveRoot, "first-pass-report.json"),
    plan.wire.firstPass.report,
    "archived report",
  );
};

const integrateRepairDirectories = (plan: FleetCCadenceRepairPlan): void => {
  for (const repair of plan.jobs) {
    const original = join(plan.firstPassRoot, repair.jobId);
    const archived = join(plan.archiveRoot, repair.jobId);
    const replacement = join(plan.repairRoot, repair.jobId);
    if (!existsSync(archived)) {
      if (!existsSync(original)) throw new Error(`${repair.jobId}: original failed directory is missing`);
      const status = JSON.parse(readFileSync(join(original, "exit-status.json"), "utf8")) as ResultWire;
      if (status.exitCode !== 1 || status.framesEvery !== repair.firstFramesEvery) {
        throw new Error(`${repair.jobId}: refusing to archive a non-failed first-pass directory`);
      }
      renameSync(original, archived);
    }
    if (existsSync(replacement)) {
      if (existsSync(original)) throw new Error(`${repair.jobId}: replacement target is occupied`);
      renameSync(replacement, original);
    }
    if (!existsSync(original)) throw new Error(`${repair.jobId}: repaired directory was not integrated`);
    const status = JSON.parse(readFileSync(join(original, "exit-status.json"), "utf8")) as ResultWire;
    if (status.exitCode !== 0 || status.framesEvery !== repair.repairFramesEvery) {
      throw new Error(`${repair.jobId}: integrated repaired status drift`);
    }
  }
};

const reportIdentity = (path: string): IdentityWire & { readonly path: string } => ({
  path: relative(REPO, path).replaceAll("\\", "/"),
  ...fileIdentity(path),
});

const replaceRootStrings = (value: unknown, from: string, to: string): unknown => {
  if (typeof value === "string") return value.replaceAll(from, to);
  if (Array.isArray(value)) return value.map((item) => replaceRootStrings(item, from, to));
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .map(([key, item]) => [key, replaceRootStrings(item, from, to)]),
    );
  }
  return value;
};

const relocateGrowthHeader = (path: string, from: string, to: string): number => {
  const input = readFileSync(path);
  const headerLength = input.readUInt32LE(0);
  const header = JSON.parse(input.subarray(4, 4 + headerLength).toString()) as Record<string, unknown>;
  const relocatedHeader = Buffer.from(JSON.stringify(replaceRootStrings(header, from, to)));
  const output = Buffer.allocUnsafe(4 + relocatedHeader.byteLength + input.byteLength - 4 - headerLength);
  output.writeUInt32LE(relocatedHeader.byteLength, 0);
  relocatedHeader.copy(output, 4);
  input.copy(output, 4 + relocatedHeader.byteLength, 4 + headerLength);
  writeFileSync(path, output);
  return output.byteLength;
};

const relocateRecord = (path: string, from: string, to: string, growthBytes: number): void => {
  const record = replaceRootStrings(
    JSON.parse(readFileSync(path, "utf8")) as Record<string, unknown>,
    from,
    to,
  ) as Record<string, unknown>;
  const growth = record.growth as Record<string, unknown> | undefined;
  if (growth === undefined) throw new Error(`${path}: relocated record has no growth summary`);
  growth.bytes = growthBytes;
  writeFileSync(path, `${JSON.stringify(record, null, 1)}\n`);
};

const finalizeIntegratedProducts = async (
  plan: FleetCCadenceRepairPlan,
): Promise<readonly ResultWire[]> => {
  const finalPlan: DirectProductionPlan = { ...plan.repairPlan, outRoot: plan.firstPassRoot };
  const results: ResultWire[] = [];
  for (const repair of plan.jobs) {
    const job = finalPlan.jobs.find(({ jobId }) => jobId === repair.jobId)!;
    const paths = directProductionJobPaths(finalPlan, job);
    const growthBytes = relocateGrowthHeader(paths.growth, plan.repairRoot, plan.firstPassRoot);
    relocateRecord(paths.record, plan.repairRoot, plan.firstPassRoot, growthBytes);
    const products = await validateDirectProductionProducts(finalPlan, job) as unknown as ProductWire;
    const status = JSON.parse(readFileSync(paths.exit, "utf8")) as ResultWire & Record<string, unknown>;
    const finalized = { ...status, products } as ResultWire & Record<string, unknown>;
    writeJsonAtomic(paths.exit, finalized);
    results.push(finalized);
  }
  return results;
};

const consolidateReport = (
  plan: FleetCCadenceRepairPlan,
  repairResults: readonly ResultWire[],
): Record<string, unknown> => {
  const initial = readReport(join(plan.archiveRoot, "first-pass-report.json"));
  const repairedById = new Map(repairResults.map((result) => [result.jobId, result]));
  const results = initial.results
    .map((result) => repairedById.get(result.jobId) ?? result)
    .sort((left, right) => left.jobId.localeCompare(right.jobId));
  const products = results.map(({ products: value }) => value);
  if (results.length !== 24 || products.some((value) => value === null)) {
    throw new Error("Fleet C consolidated report is incomplete");
  }
  const complete = products as ProductWire[];
  const webSizes = complete.map(({ webByteLength }) => webByteLength);
  return {
    format: "named-crystal-direct-production-report-v1",
    launch: initial.launch,
    repair: {
      format: "named-crystal-final-resolution-c-cadence-reconciliation-v1",
      manifest: reportIdentity(plan.manifestPath),
      firstPassReport: plan.wire.firstPass.report,
      repairLaunch: reportIdentity(join(plan.archiveRoot, "repair-launch.json")),
      repairReport: reportIdentity(join(plan.archiveRoot, "repair-report.json")),
      archiveRoot: relative(REPO, plan.archiveRoot).replaceAll("\\", "/"),
      jobs: plan.jobs.map(({ jobId, finalTick, firstFramesEvery, firstFrameCount, repairFramesEvery,
        expectedRepairFrameCount }) => ({
        jobId, finalTick, firstFramesEvery, firstFrameCount, repairFramesEvery,
        repairedFrameCount: expectedRepairFrameCount,
      })),
    },
    finishedAt: new Date().toISOString(),
    completed: 24,
    failed: 0,
    missing: 0,
    webSummary: {
      minimumBytes: Math.min(...webSizes),
      maximumBytes: Math.max(...webSizes),
      totalBytes: webSizes.reduce((total, value) => total + value, 0),
      limitBytes: plan.repairPlan.webPayloadLimitBytes,
      allDecoderVerified: complete.every(({ webDecoder }) => webDecoder === "decodeGrowthAssetV1"),
    },
    scientificSummary: {
      totalBundleBytes: complete.reduce((total, { bundleBytes }) => total + bundleBytes, 0),
      totalBundleFiles: complete.reduce((total, { bundleFileCount }) => total + bundleFileCount, 0),
      minimumFrameCount: Math.min(...complete.map(({ frameCount }) => frameCount)),
      maximumFrameCount: Math.max(...complete.map(({ frameCount }) => frameCount)),
    },
    results,
  };
};

const writeJsonAtomic = (path: string, value: unknown): void => {
  mkdirSync(dirname(path), { recursive: true });
  const temporary = `${path}.${String(process.pid)}.tmp`;
  writeFileSync(temporary, canonicalJson(value));
  renameSync(temporary, path);
};

const runRepair = async (plan: FleetCCadenceRepairPlan): Promise<void> => {
  let report = completeRepairReport(plan);
  if (report === null) {
    await runDirectProductionPlan(plan.repairPlan);
    report = completeRepairReport(plan);
  }
  if (report === null) throw new Error("Fleet C cadence repair did not complete 3/3");
  await verifyRepairProducts(plan, report);
  copyFirstPassControls(plan);
  integrateRepairDirectories(plan);
  const finalResults = await finalizeIntegratedProducts(plan);
  writeJsonAtomic(join(plan.firstPassRoot, "report.json"), consolidateReport(plan, finalResults));
  const clearance = verifyFinalResolutionVerticalClearanceC(plan.sourcePlan);
  if (clearance.requiredResults !== 12 || clearance.results.some((row) => row.passed !== true)) {
    throw new Error("Fleet C clearance changed after cadence repair");
  }
  console.log("Fleet C cadence repair complete: 3/3 repaired; consolidated fleet 24/24 ok");
};

const printPlan = (plan: FleetCCadenceRepairPlan): void => {
  for (const job of plan.jobs) {
    console.log(
      `${job.jobId} tick=${job.finalTick} frames ${job.firstFrameCount}@${job.firstFramesEvery} ` +
      `-> ${job.expectedRepairFrameCount}@${job.repairFramesEvery}`,
    );
  }
  console.log(JSON.stringify({
    jobs: plan.jobs.length,
    actualRepairWorkers: plan.jobs.length,
    unchangedProducts: INVARIANT_FILES,
    repairRoot: plan.repairRoot,
    archiveRoot: plan.archiveRoot,
  }));
};

const main = async (): Promise<void> => {
  const [command, ...argv] = process.argv.slice(2);
  const plan = loadFleetCCadenceRepairPlan(argument(argv, "manifest", DEFAULT_MANIFEST));
  if (command === "plan") printPlan(plan);
  else if (command === "run") await runRepair(plan);
  else throw new Error("usage: named-crystal-final-resolution-c-cadence-repair.ts plan|run [--manifest file]");
};

if (process.argv[1] !== undefined && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}
