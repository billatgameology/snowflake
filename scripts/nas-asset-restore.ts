// Production entry point for exact legacy NAS restore and destination-aware verification.
// Output is one sanitized JSON document; private filenames and host paths are never emitted.

import {
  closeSync,
  constants,
  fstatSync,
  lstatSync,
  openSync,
} from "node:fs";
import { isAbsolute, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { parseNasAssetCatalogV1, type NasAssetCatalogV1 } from "./nas-asset-lib.ts";
import { readDescriptorCapped } from "./nas-asset-selection-lib.ts";
import {
  NAS_LEGACY_RESTORE_REPORT_FORMAT,
  NasLegacyRestoreError,
  restoreLegacyNasCollection,
  verifyLegacyNasRestore,
} from "./nas-asset-legacy-restore-lib.ts";
import { detectNasMount } from "./nas-root.ts";

const PROJECT_ROOT = resolve(import.meta.dirname, "..");
const MAX_CATALOG_BYTES = 4 * 1024 * 1024;

type RestoreCommand = "restore" | "verify";

interface RestoreCliOptions {
  readonly command: RestoreCommand;
  readonly collection: string;
  readonly repoRoot: string;
  readonly catalogPath: string;
  readonly explicitNasRoot: string | null;
  readonly destinationPath: string;
}

class RestoreCliInputError extends Error {
  override readonly name = "RestoreCliInputError";
}

const inputFail = (message: string): never => {
  throw new RestoreCliInputError(message);
};

const parseArguments = (
  argv: readonly string[],
  cwd: string,
  repoRoot: string,
  catalogPath: string,
): RestoreCliOptions => {
  const command = argv[0];
  if (command !== "restore" && command !== "verify") {
    return inputFail("first argument must be exactly restore or verify");
  }
  let collection: string | null = null;
  let explicitNasRoot: string | null = null;
  let destinationRaw: string | null = null;
  const seen = new Set<string>();
  for (let index = 1; index < argv.length; index += 1) {
    const argument = argv[index] as string;
    if (!["--collection", "--nas-root", "--to", "--from"].includes(argument)) {
      return inputFail("unknown argument");
    }
    if (seen.has(argument)) return inputFail("an option appeared more than once");
    seen.add(argument);
    const value = argv[index + 1];
    if (value === undefined || value === "" || value.startsWith("--")) {
      return inputFail("an option is missing its non-empty value");
    }
    index += 1;
    if (argument === "--collection") collection = value;
    else if (argument === "--nas-root") explicitNasRoot = resolve(cwd, value);
    else destinationRaw = value;
  }
  if (collection === null || !collection.includes("@") || /[\u0000-\u001f\u007f]/u.test(collection)) {
    return inputFail("--collection requires an exact control-free id@version");
  }
  if (command === "restore") {
    if (!seen.has("--to") || seen.has("--from")) {
      return inputFail("restore requires exactly --to and does not accept --from");
    }
  } else if (!seen.has("--from") || seen.has("--to")) {
    return inputFail("verify requires exactly --from and does not accept --to");
  }
  if (destinationRaw === null) return inputFail("destination is required");
  const destinationPath = isAbsolute(destinationRaw)
    ? resolve(destinationRaw)
    : resolve(repoRoot, destinationRaw);
  return { command, collection, repoRoot, catalogPath, explicitNasRoot, destinationPath };
};

const readCatalog = (catalogPath: string): NasAssetCatalogV1 => {
  const initial = lstatSync(catalogPath);
  if (!initial.isFile() || initial.isSymbolicLink() || initial.nlink !== 1 || initial.size > MAX_CATALOG_BYTES) {
    return inputFail("catalogue is not one bounded ordinary file");
  }
  const fd = openSync(
    catalogPath,
    constants.O_RDONLY | (typeof constants.O_NOFOLLOW === "number" ? constants.O_NOFOLLOW : 0),
  );
  try {
    const before = fstatSync(fd);
    if (
      !before.isFile() ||
      before.nlink !== 1 ||
      before.dev !== initial.dev ||
      before.ino !== initial.ino ||
      before.mode !== initial.mode ||
      before.size !== initial.size ||
      before.mtimeMs !== initial.mtimeMs ||
      before.ctimeMs !== initial.ctimeMs
    ) {
      return inputFail("catalogue changed before opening");
    }
    const bytes = readDescriptorCapped(fd, MAX_CATALOG_BYTES, "catalogue");
    const after = fstatSync(fd);
    const current = lstatSync(catalogPath);
    if (
      bytes.byteLength !== before.size ||
      after.dev !== before.dev ||
      after.ino !== before.ino ||
      after.mode !== before.mode ||
      after.size !== before.size ||
      after.mtimeMs !== before.mtimeMs ||
      after.ctimeMs !== before.ctimeMs ||
      current.isSymbolicLink() ||
      current.nlink !== 1 ||
      current.dev !== before.dev ||
      current.ino !== before.ino ||
      current.mode !== before.mode ||
      current.size !== before.size ||
      current.mtimeMs !== before.mtimeMs ||
      current.ctimeMs !== before.ctimeMs
    ) {
      return inputFail("catalogue changed while reading");
    }
    return parseNasAssetCatalogV1(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  } finally {
    closeSync(fd);
  }
};

const resolveMarkedShare = (
  options: RestoreCliOptions,
  environment: Readonly<Record<string, string | undefined>>,
  candidates: readonly string[] | undefined,
): string => {
  const scopedEnvironment = options.explicitNasRoot === null
    ? environment
    : { ...environment, VCC_NAS_ROOT: options.explicitNasRoot, GUTCHECK_NAS_ROOT: undefined };
  const mount = detectNasMount(
    scopedEnvironment,
    options.explicitNasRoot === null ? candidates : [],
  );
  if (mount === null) return inputFail("marked project share is detached");
  return mount;
};

export interface NasAssetRestoreCliIo {
  readonly cwd?: string;
  readonly environment?: Readonly<Record<string, string | undefined>>;
  /** Fixture-only repository root injection; never available as a CLI argument. */
  readonly repoRoot?: string;
  /** Fixture-only catalogue injection; never available as a CLI argument. */
  readonly catalogPath?: string;
  /** Fixture-only mount candidates; omitted in normal CLI use. */
  readonly nasCandidates?: readonly string[];
  readonly write?: (line: string) => void;
}

/** Run one restore/verify operation and emit exactly one path-free machine-readable document. */
export function runNasAssetRestoreCli(
  argv: readonly string[],
  io: NasAssetRestoreCliIo = {},
): number {
  const write = io.write ?? ((line: string) => console.log(line));
  let command: RestoreCommand | null = argv[0] === "restore" || argv[0] === "verify" ? argv[0] : null;
  try {
    const repoRoot = resolve(io.repoRoot ?? PROJECT_ROOT);
    const catalogPath = resolve(io.catalogPath ?? resolve(repoRoot, "docs", "nas-assets.json"));
    const options = parseArguments(argv, io.cwd ?? process.cwd(), repoRoot, catalogPath);
    command = options.command;
    const catalogue = readCatalog(options.catalogPath);
    const shareRoot = resolveMarkedShare(
      options,
      io.environment ?? process.env,
      io.nasCandidates,
    );
    const report = options.command === "restore"
      ? restoreLegacyNasCollection({
          catalogue,
          collection: options.collection,
          repoRoot: options.repoRoot,
          shareRoot,
          destinationPath: options.destinationPath,
        })
      : verifyLegacyNasRestore({
          catalogue,
          collection: options.collection,
          repoRoot: options.repoRoot,
          shareRoot,
          destinationPath: options.destinationPath,
        });
    write(JSON.stringify(report));
    return 0;
  } catch (error) {
    const failure = error instanceof NasLegacyRestoreError ? error : null;
    write(JSON.stringify({
      format: NAS_LEGACY_RESTORE_REPORT_FORMAT,
      command,
      ok: false,
      errorCode: failure?.code ?? "fatal-input-catalogue-or-share-error",
      destinationReserved: failure?.destinationReserved ?? false,
      durableReceiptWritten: false,
      pruneAuthorized: false,
    }));
    return 1;
  }
}

const invokedPath = process.argv[1];
if (invokedPath !== undefined && resolve(invokedPath) === fileURLToPath(import.meta.url)) {
  process.exitCode = runNasAssetRestoreCli(process.argv.slice(2));
}
