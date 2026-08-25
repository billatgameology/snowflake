// Regrow the maker's animation-queue selections with --growth-out, producing one
// gutcheck-growth-v1 attachment-event asset per snowflake for the website's growth stage
// (docs/plans/gutcheck-animation-selection-queue.md, "growth-event assets" follow-up).
//
//   node scripts/gutcheck-growth-fleet.ts plan --queue <selection.json> [--items id,id] [--scientific]
//   node scripts/gutcheck-growth-fleet.ts run  --queue <selection.json> [--items id,id] \
//        [--concurrency 3] [--out-dir out/growth-assets] [--scientific]
//
// --scientific keeps the identical replay but adds the heavy products per crystal — the full
// final GG state checkpoint and a ~120-frame gutcheck-anim-v1 mesh timeline — under
// out/growth-scientific/ (maker direction, 2026-08-25: a second full round with "a lot more
// data" after the web pass).
//
// Every job replays its item's PINNED run record (dims, tick cap, seed, noise, extraction),
// with the record's embedded spec written next to the outputs — the specs/ copies are not
// consulted, so a job cannot silently diverge from the run the maker selected. Jobs run
// longest-first (LPT): with many workers the makespan is set by when the longest job STARTS,
// so the 15-18 h items lead and the small ones fill the gaps. A job is
// skipped when its asset AND record already exist (resume by identity, same predicate shape
// as the batch renderer). Endpoint drift against the pinned tick/attachedCount is warn-only
// inside grow-params: the arm64/x64 control measured habit classes portable but trajectories
// not bitwise (d1a0978), and these are eyeball assets, not gate evidence.

import { spawn } from "node:child_process";
import { createWriteStream, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { parseAnimationQueueManifest } from "../app/src/gutcheck-animation-queue.ts";

const REPO = resolve(import.meta.dirname, "..");
/** The website decoder refuses more events than this; refuse the job up front instead. */
const MAX_EVENTS = 8 * 1024 * 1024;

interface PinnedRecord {
  readonly spec: unknown;
  readonly dims: { readonly nx: number; readonly ny: number; readonly nz: number };
  readonly domain: string;
  readonly seed: number;
  readonly noise: number;
  readonly seedThickness?: number;
  readonly tickCap: number;
  readonly tick: number;
  readonly attachedCount: number;
  readonly elapsedSeconds: number;
  readonly mesh: {
    readonly extraction: {
      readonly spacing: number;
      readonly sigma: number;
      readonly normalDelta: number;
    };
  };
}

export interface GrowthJob {
  readonly id: string;
  readonly recordPath: string;
  readonly dims: string;
  readonly tickCap: number;
  readonly recordedSeconds: number;
  readonly expectTick: number;
  readonly expectAttached: number;
  readonly argv: readonly string[];
}

const argument = (argv: readonly string[], name: string, fallback?: string): string | undefined => {
  const index = argv.indexOf(`--${name}`);
  return index >= 0 ? argv[index + 1] : fallback;
};

/** The pinned record for a queue item: fig items' spec field IS the record; sweep/staged/bentley
 * items point at specs/<id>.json and are recorded in gen-records/<id>-record.json. */
export const pinnedRecordPath = (id: string, specField: string): string => {
  if (specField === `evidence/gutcheck-gg-realism/fig-records/${id}-record.json`) return specField;
  if (specField === `evidence/gutcheck-gg-realism/specs/${id}.json`) {
    return `evidence/gutcheck-gg-realism/gen-records/${id}-record.json`;
  }
  throw new Error(`${id}: unrecognized tracked source record ${specField}`);
};

export const jobForItem = (
  id: string,
  specField: string,
  outDir: string,
  repo: string = REPO,
  scientific = false,
): GrowthJob => {
  const recordPath = pinnedRecordPath(id, specField);
  const absolute = resolve(repo, recordPath);
  if (!existsSync(absolute)) throw new Error(`${id}: pinned record missing at ${recordPath}`);
  const record = JSON.parse(readFileSync(absolute, "utf8")) as PinnedRecord;
  for (const [field, value] of Object.entries({
    tick: record.tick,
    attachedCount: record.attachedCount,
    tickCap: record.tickCap,
    elapsedSeconds: record.elapsedSeconds,
  })) {
    if (!Number.isSafeInteger(value) || (value as number) < 0) {
      throw new Error(`${id}: pinned record field ${field} is not a non-negative integer`);
    }
  }
  if (record.attachedCount > MAX_EVENTS) {
    throw new Error(`${id}: pinned attachedCount ${record.attachedCount} exceeds the decoder cap`);
  }
  const specPath = join(outDir, `${id}-spec.json`);
  const extraction = record.mesh.extraction;
  // Scientific pass: aim for ~120 timeline frames per crystal regardless of run length,
  // never denser than every 100 ticks (the anim-B hero cadence).
  const framesEvery = Math.max(100, Math.ceil(record.tick / 120 / 10) * 10);
  return {
    id,
    recordPath,
    dims: `${record.dims.nx},${record.dims.ny},${record.dims.nz}`,
    tickCap: record.tickCap,
    recordedSeconds: record.elapsedSeconds,
    expectTick: record.tick,
    expectAttached: record.attachedCount,
    argv: [
      "--max-old-space-size=8192",
      join(repo, "scripts/gutcheck-grow-params.ts"),
      "--spec-file", specPath,
      "--dims", `${record.dims.nx},${record.dims.ny},${record.dims.nz}`,
      "--ticks", String(record.tickCap),
      "--seed", String(record.seed),
      "--noise", String(record.noise),
      "--domain", record.domain,
      "--seed-thickness", String(record.seedThickness ?? 1),
      "--spacing", String(extraction.spacing),
      "--sigma", String(extraction.sigma),
      "--normal-delta", String(extraction.normalDelta),
      "--out-mesh", join(outDir, `${id}-mesh.bin`),
      "--record", join(outDir, `${id}-record.json`),
      "--growth-out", join(outDir, `${id}-growth-v1.bin`),
      "--expect-tick", String(record.tick),
      "--expect-attached", String(record.attachedCount),
      "--metrics-every", "2000",
      ...(scientific
        ? [
            "--out-state", join(outDir, `${id}-state.bin`),
            "--frames-dir", join(outDir, `${id}-frames`),
            "--frames-every", String(framesEvery),
          ]
        : []),
    ],
  };
};

const loadJobs = (
  argv: readonly string[],
): { jobs: GrowthJob[]; outDir: string; scientific: boolean } => {
  const queueArg = argument(argv, "queue");
  if (queueArg === undefined) throw new Error("--queue <selection.json> is required");
  const queue = parseAnimationQueueManifest(
    JSON.parse(readFileSync(resolve(queueArg), "utf8")) as unknown,
  );
  // --scientific: same replay, richer products — full final state checkpoint plus the
  // gutcheck-anim-v1 mesh timeline — in its own output root so the web pass stays lean.
  const scientific = argv.includes("--scientific");
  const defaultOut = scientific ? "out/growth-scientific" : "out/growth-assets";
  const outDir = resolve(argument(argv, "out-dir", join(REPO, defaultOut)) as string);
  mkdirSync(outDir, { recursive: true });
  const only = argument(argv, "items");
  const wanted = only === undefined ? null : new Set(only.split(",").map((s) => s.trim()));
  if (wanted !== null) {
    const known = new Set(queue.items.map((item) => item.id));
    for (const id of wanted) {
      if (!known.has(id)) throw new Error(`--items names ${id}, which is not in the queue`);
    }
  }
  const jobs = queue.items
    .filter((item) => wanted === null || wanted.has(item.id))
    .map((item) => jobForItem(item.id, item.spec, outDir, REPO, scientific));
  jobs.sort((left, right) => right.recordedSeconds - left.recordedSeconds);
  return { jobs, outDir, scientific };
};

const jobDone = (job: GrowthJob, outDir: string, scientific: boolean): boolean =>
  existsSync(join(outDir, `${job.id}-growth-v1.bin`)) &&
  existsSync(join(outDir, `${job.id}-record.json`)) &&
  (!scientific ||
    (existsSync(join(outDir, `${job.id}-state.bin`)) &&
      existsSync(join(outDir, `${job.id}-frames`, "manifest.json"))));

const writeSpec = (job: GrowthJob, outDir: string, repo: string = REPO): void => {
  const record = JSON.parse(readFileSync(resolve(repo, job.recordPath), "utf8")) as PinnedRecord;
  writeFileSync(join(outDir, `${job.id}-spec.json`), `${JSON.stringify(record.spec, null, 1)}\n`);
};

const plan = (argv: readonly string[]): void => {
  const { jobs, outDir, scientific } = loadJobs(argv);
  let pendingSeconds = 0;
  for (const job of jobs) {
    const done = jobDone(job, outDir, scientific);
    if (!done) pendingSeconds += job.recordedSeconds;
    console.log(
      `${done ? "done   " : "pending"} ${job.id.padEnd(40)} ${job.dims.padEnd(12)} ` +
        `ticks<=${String(job.tickCap).padEnd(7)} recorded ${(job.recordedSeconds / 3600).toFixed(2)} h`,
    );
  }
  console.log(
    `${jobs.length} job(s); pending recorded compute ${(pendingSeconds / 3600).toFixed(1)} h ` +
      `(original host; scale by this host's measured ratio)`,
  );
};

const run = async (argv: readonly string[]): Promise<void> => {
  const { jobs, outDir, scientific } = loadJobs(argv);
  const concurrency = Number(argument(argv, "concurrency", "3"));
  if (!Number.isInteger(concurrency) || concurrency < 1 || concurrency > 24) {
    throw new Error("--concurrency must be an integer in [1, 24]");
  }
  const pending = jobs.filter((job) => !jobDone(job, outDir, scientific));
  for (const job of jobs) {
    if (!pending.includes(job)) console.log(`skip ${job.id} — complete outputs exist`);
  }
  const failures: string[] = [];
  let next = 0;
  const worker = async (): Promise<void> => {
    while (next < pending.length) {
      const job = pending[next++]!;
      writeSpec(job, outDir);
      const log = createWriteStream(join(outDir, `${job.id}.log`), { flags: "a" });
      const started = Date.now();
      console.log(`start ${job.id} (recorded ${(job.recordedSeconds / 3600).toFixed(2)} h)`);
      const code = await new Promise<number | null>((resolveExit) => {
        const child = spawn(process.execPath, [...job.argv], { cwd: REPO, stdio: ["ignore", "pipe", "pipe"] });
        child.stdout.pipe(log);
        child.stderr.pipe(log);
        child.on("error", () => resolveExit(null));
        child.on("close", (exit) => resolveExit(exit));
      });
      const minutes = ((Date.now() - started) / 60000).toFixed(1);
      if (code === 0) {
        console.log(`ok ${job.id} in ${minutes} min`);
      } else {
        failures.push(job.id);
        console.error(`FAIL ${job.id} after ${minutes} min (exit ${String(code)}); see ${job.id}.log`);
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(concurrency, pending.length) }, worker));
  console.log(`fleet complete: ${pending.length - failures.length}/${pending.length} ok`);
  if (failures.length > 0) {
    console.error(`failed: ${failures.join(", ")}`);
    process.exitCode = 1;
  }
};

const main = async (): Promise<void> => {
  const [command, ...argv] = process.argv.slice(2);
  if (command === "plan") plan(argv);
  else if (command === "run") await run(argv);
  else throw new Error("usage: gutcheck-growth-fleet.ts plan|run --queue <selection.json> [options]");
};

if (process.argv[1] !== undefined && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}
