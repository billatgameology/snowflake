// Maintains evidence/MANIFEST.json entries for evidence/gutcheck-gg-realism/** and owns the
// resume-identity contract shared by the gut-check growers.
//
// Every artifact below evidence/ except the two root control manifests (MANIFEST.json and
// OUT-TREES-MANIFEST.json) must be tracked and pinned by byte length + SHA-256. The gut-check
// subtree is a living set: gutcheck-grow-batch.mjs, gutcheck-sweep-specs.mjs, and
// gutcheck-archive-pack.ts call this updater after their high-level writes. A direct writer
// invocation or hand edit needs `npm run evidence:pin`; that command re-pins this subtree only,
// never a new artifact elsewhere under evidence/.
//
// Manifest publication is serialized across processes and uses unique temp + rename. Stale
// primary-lock recovery is serialized by a separate recovery mutex; that mutex is never
// auto-broken, so a crash in the tiny recovery section fails closed for manual inspection.

import {
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash, randomUUID } from "node:crypto";

const REPO = resolve(import.meta.dirname, "..");
const DEFAULT_MANIFEST = resolve(REPO, "evidence/MANIFEST.json");
const DEFAULT_SUBTREE = resolve(REPO, "evidence/gutcheck-gg-realism");
const DEFAULT_PREFIX = "gutcheck-gg-realism";

interface ManifestFile {
  bytes: number;
  sha256: string;
}
interface Manifest {
  fileCount: number;
  totalBytes: number;
  files: Record<string, ManifestFile>;
}

/** Production callers omit these; tests use fixture trees without touching real evidence. */
export interface PinTargets {
  manifestPath?: string;
  subtreeDir?: string;
  subtreePrefix?: string;
}

const sleepMs = (ms: number): void => {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
};

const LOCK_TIMEOUT_MS = 30_000;
const ORPHAN_GRACE_MS = 5_000;

interface LockOwner {
  pid: number;
  token: string;
}

const readOwner = (lockDir: string): LockOwner | null => {
  try {
    const parsed: unknown = JSON.parse(readFileSync(`${lockDir}/owner`, "utf8"));
    if (typeof parsed !== "object" || parsed === null) return null;
    const owner = parsed as { pid?: unknown; token?: unknown };
    if (
      typeof owner.pid !== "number" ||
      !Number.isInteger(owner.pid) ||
      owner.pid <= 0 ||
      typeof owner.token !== "string" ||
      owner.token === ""
    ) {
      return null;
    }
    return { pid: Number(owner.pid), token: owner.token };
  } catch {
    return null;
  }
};

const sameOwner = (left: LockOwner | null, right: LockOwner | null): boolean =>
  left !== null && right !== null && left.pid === right.pid && left.token === right.token;

const pidAlive = (pid: number): boolean => {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    // EPERM means the pid exists but is not ours. Only ESRCH proves it is gone.
    return (error as NodeJS.ErrnoException).code === "EPERM";
  }
};

const lockAgeMs = (lockDir: string): number | null => {
  try {
    return Date.now() - statSync(lockDir).mtimeMs;
  } catch {
    return null;
  }
};

const createOwnedDirectory = (dir: string, token: string): boolean => {
  try {
    mkdirSync(dir);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "EEXIST") return false;
    throw error;
  }
  try {
    writeFileSync(`${dir}/owner`, JSON.stringify({ pid: process.pid, token }));
  } catch (error) {
    // We know this directory is still ours: no compliant contender removes a live owner.
    rmSync(dir, { recursive: true, force: true });
    throw error;
  }
  return true;
};

/** Release only a directory whose current owner token is still ours. */
const releaseLock = (lockDir: string, token: string): void => {
  const owner = readOwner(lockDir);
  if (owner === null || owner.token !== token || owner.pid !== process.pid) {
    console.warn(`evidence-pin: lock ${lockDir} is no longer ours; leaving it in place`);
    return;
  }
  rmSync(lockDir, { recursive: true, force: true });
};

/**
 * Acquire the primary lock. Recovery is itself serialized so two contenders observing one
 * dead owner cannot delete each other's replacement. A contender that races the recovery
 * mutex after creating the primary notices the mutex and relinquishes its own token.
 */
const acquireLock = (lockDir: string, token: string): void => {
  const deadline = Date.now() + LOCK_TIMEOUT_MS;
  const recoveryDir = `${lockDir}.recovery`;

  for (;;) {
    if (existsSync(recoveryDir)) {
      if (Date.now() > deadline) {
        throw new Error(
          `evidence-pin: recovery mutex ${recoveryDir} did not clear within ${String(LOCK_TIMEOUT_MS)} ms; ` +
            `inspect its owner and remove it manually only when no publisher is running`,
        );
      }
      sleepMs(100);
      continue;
    }

    if (createOwnedDirectory(lockDir, token)) {
      if (!existsSync(recoveryDir)) return;
      releaseLock(lockDir, token);
      sleepMs(100);
      continue;
    }

    const observed = readOwner(lockDir);
    const observedAge = observed === null ? lockAgeMs(lockDir) : null;
    const stale =
      (observed !== null && !pidAlive(observed.pid)) ||
      (observed === null && observedAge !== null && observedAge > ORPHAN_GRACE_MS);

    if (stale) {
      const recoveryToken = `${String(process.pid)}-${randomUUID()}`;
      if (!createOwnedDirectory(recoveryDir, recoveryToken)) {
        sleepMs(100);
        continue;
      }
      try {
        const current = readOwner(lockDir);
        const stillStale =
          observed !== null
            ? sameOwner(current, observed) && !pidAlive(observed.pid)
            : current === null && (lockAgeMs(lockDir) ?? 0) > ORPHAN_GRACE_MS;
        if (!stillStale) continue;

        const quarantine = `${lockDir}.stale-${randomUUID()}`;
        try {
          renameSync(lockDir, quarantine);
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code === "ENOENT") continue;
          throw error;
        }
        console.warn(
          observed === null
            ? `evidence-pin: recovering an ownerless lock at ${lockDir}`
            : `evidence-pin: recovering lock ${lockDir} left by dead pid ${String(observed.pid)}`,
        );
        rmSync(quarantine, { recursive: true, force: true });

        // Hold the recovery mutex until this process owns the replacement primary. A contender
        // that passed the initial mutex check will create, notice recoveryDir, and relinquish.
        while (!createOwnedDirectory(lockDir, token)) {
          if (Date.now() > deadline) {
            throw new Error(`evidence-pin: could not publish a replacement lock at ${lockDir}`);
          }
          sleepMs(25);
        }
        return;
      } finally {
        releaseLock(recoveryDir, recoveryToken);
      }
    }

    if (Date.now() > deadline) {
      throw new Error(
        `evidence-pin: could not acquire ${lockDir} within ${String(LOCK_TIMEOUT_MS)} ms ` +
          `(held by live pid ${String(observed?.pid ?? "unknown")})`,
      );
    }
    sleepMs(100);
  }
};

/** Shared lock seam used by the updater and deterministic cross-process regression tests. */
export const withGutcheckEvidenceManifestLock = <T>(manifestPath: string, action: () => T): T => {
  const resolvedManifest = resolve(manifestPath);
  const lockDir = `${resolvedManifest}.lock`;
  const token = `${String(process.pid)}-${randomUUID()}`;
  acquireLock(lockDir, token);
  try {
    return action();
  } finally {
    releaseLock(lockDir, token);
  }
};

/** Async form used when a publication transaction includes child processes or streaming I/O. */
export const withExclusivePublicationLockAsync = async <T>(
  targetPath: string,
  action: () => Promise<T>,
): Promise<T> => {
  const resolvedTarget = resolve(targetPath);
  const lockDir = `${resolvedTarget}.lock`;
  const token = `${String(process.pid)}-${randomUUID()}`;
  acquireLock(lockDir, token);
  try {
    return await action();
  } finally {
    releaseLock(lockDir, token);
  }
};

const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((entry) => {
    const path = `${dir}/${entry}`;
    return statSync(path).isDirectory() ? walk(path) : [path];
  });

/** Re-pin every file of the gut-check evidence subtree. */
export const updateGutcheckEvidenceManifest = (targets?: PinTargets): { pinned: number } => {
  const manifestPath = resolve(targets?.manifestPath ?? DEFAULT_MANIFEST);
  const subtreeDir = resolve(targets?.subtreeDir ?? DEFAULT_SUBTREE);
  const prefix = targets?.subtreePrefix ?? DEFAULT_PREFIX;

  return withGutcheckEvidenceManifestLock(manifestPath, () => {
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as Manifest;
    for (const key of Object.keys(manifest.files)) {
      if (key.startsWith(`${prefix}/`)) delete manifest.files[key];
    }
    let pinned = 0;
    for (const path of walk(subtreeDir)) {
      const name = basename(path);
      if (name.startsWith(".") || name.endsWith(".tmp")) continue;
      if (resolve(path) === manifestPath) continue;
      const rel = `${prefix}/${path.slice(subtreeDir.length + 1).replace(/\\/g, "/")}`;
      manifest.files[rel] = {
        bytes: statSync(path).size,
        sha256: createHash("sha256").update(readFileSync(path)).digest("hex"),
      };
      pinned++;
    }
    manifest.fileCount = Object.keys(manifest.files).length;
    manifest.totalBytes = Object.values(manifest.files).reduce((sum, file) => sum + file.bytes, 0);
    const tmp = `${manifestPath}.${String(process.pid)}-${randomUUID()}.tmp`;
    writeFileSync(tmp, JSON.stringify(manifest, null, 1) + "\n");
    renameSync(tmp, manifestPath);
    return { pinned };
  });
};

export interface GutcheckRunIdentityV1 {
  format: "gutcheck-run-identity-v1";
  growProtocol: "gutcheck-gg-grow-v1";
  stopPolicy: "domain65-farfield-two-thirds-every25-v1";
  specSha256: string;
  dims: { nx: number; ny: number; nz: number };
  domain: "hexPrism" | "box";
  tickCap: number;
  rngSeed: number;
  noiseEpsilon: number;
  seedThickness: number;
  extraction: { spacing: number; sigma: number; iso: 0.5; margin: 4; normalDelta: number };
}

export interface GutcheckExpectedInvocation {
  id: string;
  run: GutcheckRunIdentityV1;
  /** Zero means final mesh only; a positive value requires a matching complete timeline. */
  framesEvery: number;
}

interface IdentityInputs {
  spec: unknown;
  dims: { nx: number; ny: number; nz: number };
  domain: "hexPrism" | "box";
  tickCap: number;
  rngSeed: number;
  noiseEpsilon: number;
  seedThickness?: number;
  extraction: { spacing: number; sigma: number; normalDelta: number; iso?: number; margin?: number };
}

const canonicalJson = (value: unknown): string => {
  if (value === null || typeof value === "boolean" || typeof value === "string") return JSON.stringify(value);
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error("non-finite JSON number");
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (typeof value === "object") {
    const object = value as Record<string, unknown>;
    return `{${Object.keys(object)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalJson(object[key])}`)
      .join(",")}}`;
  }
  throw new Error(`unsupported JSON value: ${typeof value}`);
};

const sameJson = (left: unknown, right: unknown): boolean => {
  try {
    return canonicalJson(left) === canonicalJson(right);
  } catch {
    return false;
  }
};

export const buildGutcheckRunIdentity = (inputs: IdentityInputs): GutcheckRunIdentityV1 => {
  const numbers = [
    inputs.dims.nx,
    inputs.dims.ny,
    inputs.dims.nz,
    inputs.tickCap,
    inputs.rngSeed,
    inputs.noiseEpsilon,
    inputs.seedThickness ?? 1,
    inputs.extraction.spacing,
    inputs.extraction.sigma,
    inputs.extraction.normalDelta,
  ];
  if (numbers.some((value) => !Number.isFinite(value))) {
    throw new Error("gutcheck run identity contains a non-finite number");
  }
  if (inputs.extraction.iso !== undefined && inputs.extraction.iso !== 0.5) {
    throw new Error("gutcheck grow protocol v1 requires extraction iso 0.5");
  }
  if (inputs.extraction.margin !== undefined && inputs.extraction.margin !== 4) {
    throw new Error("gutcheck grow protocol v1 requires extraction margin 4");
  }
  return {
    format: "gutcheck-run-identity-v1",
    growProtocol: "gutcheck-gg-grow-v1",
    stopPolicy: "domain65-farfield-two-thirds-every25-v1",
    specSha256: createHash("sha256").update(canonicalJson(inputs.spec)).digest("hex"),
    dims: inputs.dims,
    domain: inputs.domain,
    tickCap: inputs.tickCap,
    rngSeed: inputs.rngSeed,
    noiseEpsilon: inputs.noiseEpsilon,
    seedThickness: inputs.seedThickness ?? 1,
    extraction: {
      spacing: inputs.extraction.spacing,
      sigma: inputs.extraction.sigma,
      iso: 0.5,
      margin: 4,
      normalDelta: inputs.extraction.normalDelta,
    },
  };
};

const isFiniteNumber = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);

const deriveRecordIdentity = (record: Record<string, unknown>): GutcheckRunIdentityV1 | null => {
  const dims = record.dims as { nx?: unknown; ny?: unknown; nz?: unknown } | undefined;
  const mesh = record.mesh as { extraction?: unknown } | undefined;
  const extraction = mesh?.extraction as
    | { spacing?: unknown; sigma?: unknown; iso?: unknown; margin?: unknown; normalDelta?: unknown }
    | undefined;
  if (
    record.spec === undefined ||
    dims === undefined ||
    !isFiniteNumber(dims.nx) ||
    !isFiniteNumber(dims.ny) ||
    !isFiniteNumber(dims.nz) ||
    (record.domain !== "hexPrism" && record.domain !== "box") ||
    !isFiniteNumber(record.tickCap) ||
    !isFiniteNumber(record.seed) ||
    !isFiniteNumber(record.noise) ||
    extraction === undefined ||
    !isFiniteNumber(extraction.spacing) ||
    !isFiniteNumber(extraction.sigma) ||
    !isFiniteNumber(extraction.normalDelta)
  ) {
    return null;
  }
  try {
    return buildGutcheckRunIdentity({
      spec: record.spec,
      dims: { nx: dims.nx, ny: dims.ny, nz: dims.nz },
      domain: record.domain,
      tickCap: record.tickCap,
      rngSeed: record.seed,
      noiseEpsilon: record.noise,
      seedThickness: isFiniteNumber(record.seedThickness) ? record.seedThickness : 1,
      extraction: {
        spacing: extraction.spacing,
        sigma: extraction.sigma,
        iso: isFiniteNumber(extraction.iso) ? extraction.iso : 0.5,
        margin: isFiniteNumber(extraction.margin) ? extraction.margin : 4,
        normalDelta: extraction.normalDelta,
      },
    });
  } catch {
    return null;
  }
};

const parseRecord = (path: string): Record<string, unknown> | null => {
  try {
    const parsed: unknown = JSON.parse(readFileSync(path, "utf8"));
    return typeof parsed === "object" && parsed !== null ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
};

/** A complete record whose result-affecting identity matches the requested invocation. */
export const isCompleteRecord = (
  path: string,
  expected?: string | GutcheckExpectedInvocation,
): boolean => {
  const record = parseRecord(path);
  if (
    record === null ||
    !isFiniteNumber(record.tick) ||
    !Number.isInteger(record.tick) ||
    record.tick < 0 ||
    typeof record.stopReason !== "string" ||
    record.stopReason === "" ||
    record.spec === undefined
  ) {
    return false;
  }
  const mesh = record.mesh as { path?: unknown } | undefined;
  if (typeof mesh?.path !== "string") return false;
  const expectedId = typeof expected === "string" ? expected : expected?.id;
  if (expectedId !== undefined) {
    const meshName = mesh.path.replace(/\\/g, "/").split("/").pop() ?? "";
    if (meshName !== `${expectedId}-mesh.bin`) return false;
  }
  const derived = deriveRecordIdentity(record);
  if (derived === null) return false;
  if (record.runIdentity !== undefined && !sameJson(record.runIdentity, derived)) return false;
  return typeof expected !== "object" || sameJson(derived, expected.run);
};

/** Matching complete timeline, including cadence and the record's final tick. */
export const isCompleteTimeline = (
  manifestPath: string,
  recordPath: string,
  expected: GutcheckExpectedInvocation,
): boolean => {
  if (expected.framesEvery <= 0 || !isCompleteRecord(recordPath, expected)) return false;
  const record = parseRecord(recordPath);
  try {
    const parsed: unknown = JSON.parse(readFileSync(manifestPath, "utf8"));
    if (typeof parsed !== "object" || parsed === null) return false;
    const manifest = parsed as { format?: unknown; complete?: unknown; config?: unknown; frames?: unknown };
    if (manifest.format !== "gutcheck-anim-v1" || manifest.complete !== true || !Array.isArray(manifest.frames)) return false;
    if (manifest.frames.length === 0 || typeof manifest.config !== "object" || manifest.config === null) return false;
    const config = manifest.config as Record<string, unknown>;
    const dims = config.dims as { nx?: unknown; ny?: unknown; nz?: unknown } | undefined;
    const extraction = config.extraction as
      | { spacing?: unknown; sigma?: unknown; iso?: unknown; margin?: unknown; normalDelta?: unknown }
      | undefined;
    if (
      config.spec === undefined ||
      dims === undefined ||
      !isFiniteNumber(dims.nx) ||
      !isFiniteNumber(dims.ny) ||
      !isFiniteNumber(dims.nz) ||
      (config.domain !== "hexPrism" && config.domain !== "box") ||
      !isFiniteNumber(config.ticks) ||
      !isFiniteNumber(config.seed) ||
      !isFiniteNumber(config.noise) ||
      config.every !== expected.framesEvery ||
      extraction === undefined ||
      !isFiniteNumber(extraction.spacing) ||
      !isFiniteNumber(extraction.sigma) ||
      !isFiniteNumber(extraction.normalDelta)
    ) {
      return false;
    }
    const derived = buildGutcheckRunIdentity({
      spec: config.spec,
      dims: { nx: dims.nx, ny: dims.ny, nz: dims.nz },
      domain: config.domain,
      tickCap: config.ticks,
      rngSeed: config.seed,
      noiseEpsilon: config.noise,
      seedThickness: isFiniteNumber(config.seedThickness) ? config.seedThickness : 1,
      extraction: {
        spacing: extraction.spacing,
        sigma: extraction.sigma,
        iso: isFiniteNumber(extraction.iso) ? extraction.iso : 0.5,
        margin: isFiniteNumber(extraction.margin) ? extraction.margin : 4,
        normalDelta: extraction.normalDelta,
      },
    });
    if (config.runIdentity !== undefined && !sameJson(config.runIdentity, derived)) return false;
    if (!sameJson(derived, expected.run)) return false;
    const timelineDir = dirname(manifestPath);
    const seenFiles = new Set<string>();
    for (let index = 0; index < manifest.frames.length; index++) {
      const frame = manifest.frames[index] as { file?: unknown; tick?: unknown } | undefined;
      if (
        frame === undefined ||
        typeof frame.file !== "string" ||
        frame.file === "" ||
        frame.file.includes("/") ||
        frame.file.includes("\\") ||
        frame.file.startsWith("/") ||
        /^[A-Za-z]:/.test(frame.file) ||
        frame.file.split("/").includes("..") ||
        !isFiniteNumber(frame.tick) ||
        !Number.isInteger(frame.tick)
      ) {
        return false;
      }
      if (seenFiles.has(frame.file)) return false;
      seenFiles.add(frame.file);
      const isFinal = index === manifest.frames.length - 1;
      if (isFinal ? frame.tick !== record?.tick : frame.tick !== index * expected.framesEvery) {
        return false;
      }
      if (index === 0 && frame.tick !== 0) return false;
      if (isFinal && index > 0 && frame.tick <= (index - 1) * expected.framesEvery) return false;
      const frameStat = lstatSync(join(timelineDir, frame.file));
      if (!frameStat.isFile() || frameStat.size === 0) return false;
    }
    return true;
  } catch {
    return false;
  }
};

// `node scripts/gutcheck-evidence-lib.ts` (or `npm run evidence:pin`) re-pins the real tree.
if (process.argv[1] !== undefined && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { pinned } = updateGutcheckEvidenceManifest();
  console.log(`evidence-pin: ${String(pinned)} files pinned under ${DEFAULT_PREFIX}/ in evidence/MANIFEST.json`);
}
