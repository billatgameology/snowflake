// Artifact-derived Phase 8 freeze verifier.

import { execFileSync } from "node:child_process";
import { lstatSync, readFileSync } from "node:fs";
import { resolve, sep } from "node:path";
import {
  canonicalJson,
  parseCanonicalJson,
  sha256Bytes,
} from "./gate4-evidence.ts";
import {
  verifyPhase8TargetBookFile,
  type Phase8Book,
} from "./phase8-target-book.ts";

export const PHASE8_TARGET_BOOK_PATH = "research/phase8-target-book.jsonl" as const;
export const PHASE8_REPORT_PATH = "research/phase8-target-book.md" as const;
export const PHASE8_FREEZE_PATH = "evidence/phase8-target-book/freeze.json" as const;
export const PHASE8_FREEZE_SCHEMA = "phase8-target-book-freeze-v1" as const;
/**
 * Records needed to interpret an intentional source gap or a legacy index accurately, but which
 * are not extraction indexes cited by a machine-book entry.
 */
export const PHASE8_SUPPORTING_RECORD_PATHS = [
  "docs/libbrecht-parameters.md",
  "research/bailey-hallett-2002.md",
  "research/phase6-source-currency.md",
] as const;
export const PHASE8_OPERATOR_PATHS = [
  "core/src/index.ts",
  "core/src/target-observables.ts",
  "core/test/target-observables.test.ts",
  "docs/target-book-observables.md",
] as const;
export const PHASE8_VERIFIER_PATHS = [
  ".gitattributes",
  "runner/src/gate4-evidence.ts",
  "runner/src/phase8-target-book.ts",
  "runner/src/phase8-freeze.ts",
  "runner/src/phase8-verify.ts",
  "runner/test/phase8-target-book.test.ts",
] as const;

export interface Phase8FilePin {
  readonly path: string;
  readonly byteLength: number;
  readonly sha256: string;
}

export interface Phase8Freeze {
  readonly schema: typeof PHASE8_FREEZE_SCHEMA;
  readonly targetBook: Phase8FilePin & {
    readonly entryCount: number;
    readonly targetCount: number;
    readonly inputCount: number;
  };
  readonly report: Phase8FilePin;
  readonly sourceIndexes: readonly Phase8FilePin[];
  readonly supportingRecords: readonly Phase8FilePin[];
  readonly registeredData: readonly Phase8FilePin[];
  readonly operators: readonly Phase8FilePin[];
  readonly verifier: readonly Phase8FilePin[];
  readonly extendedDataset: Phase8FilePin & {
    readonly entryCount: number;
    readonly passEligible: false;
  };
  readonly split: {
    readonly inputIds: readonly string[];
    readonly modelDevelopmentIds: readonly string[];
    readonly heldOutIds: readonly string[];
    readonly outOfModelIds: readonly string[];
  };
  readonly scope: {
    readonly sourceCutoffDate: "2026-08-10";
    readonly grantsValidationClaim: false;
    readonly permitsSolverRun: false;
    readonly note: string;
  };
}

function checkedPath(repositoryRoot: string, relativePath: string): string {
  const root = resolve(repositoryRoot);
  const absolute = resolve(root, relativePath);
  if (!absolute.startsWith(`${root}${sep}`)) throw new Error(`Phase 8 freeze path escapes repository: ${relativePath}`);
  return absolute;
}

function pinFile(repositoryRoot: string, path: string): Phase8FilePin {
  const absolute = checkedPath(repositoryRoot, path);
  const stat = lstatSync(absolute);
  if (!stat.isFile() || stat.isSymbolicLink()) throw new Error(`Phase 8 freeze input is not a regular file: ${path}`);
  const bytes = readFileSync(absolute);
  return { path, byteLength: bytes.byteLength, sha256: sha256Bytes(bytes) };
}

function verifyTrackedRegularFiles(repositoryRoot: string, paths: readonly string[]): void {
  let output: string;
  try {
    output = execFileSync("git", ["ls-files", "-s", "-z", "--", ...paths], {
      cwd: repositoryRoot,
      encoding: "utf8",
      maxBuffer: 16 * 1024 * 1024,
    });
  } catch {
    throw new Error("Phase 8 freeze could not query the Git index");
  }
  const trackedEntries = new Map<string, { readonly mode: string; readonly objectId: string; readonly stage: string }[]>();
  for (const entry of output.split("\0").filter(Boolean)) {
    const tab = entry.indexOf("\t");
    if (tab < 0) throw new Error(`Phase 8 freeze found an unparseable Git index entry: ${entry}`);
    const [mode, objectId, stage, ...extra] = entry.slice(0, tab).split(" ");
    if (mode === undefined || objectId === undefined || stage === undefined || extra.length !== 0) {
      throw new Error(`Phase 8 freeze found an unparseable Git index entry: ${entry}`);
    }
    const path = entry.slice(tab + 1);
    const prior = trackedEntries.get(path) ?? [];
    trackedEntries.set(path, [...prior, { mode, objectId, stage }]);
  }
  for (const path of paths) {
    const entries = trackedEntries.get(path) ?? [];
    if (entries.length !== 1 || entries[0]?.stage !== "0") {
      throw new Error(`Phase 8 freeze input must have exactly one stage-0 Git index entry: ${path}`);
    }
    const mode = entries[0].mode;
    if (mode !== "100644" && mode !== "100755") {
      throw new Error(`Phase 8 freeze input must be a regular tracked file: ${path}`);
    }
    let indexedBytes: Buffer;
    try {
      indexedBytes = execFileSync("git", ["show", `:0:${path}`], {
        cwd: repositoryRoot,
        maxBuffer: 16 * 1024 * 1024,
      });
    } catch {
      throw new Error(`Phase 8 freeze could not read the indexed bytes for: ${path}`);
    }
    if (!indexedBytes.equals(readFileSync(checkedPath(repositoryRoot, path)))) {
      throw new Error(`Phase 8 freeze working bytes differ from the stage-0 Git index: ${path}`);
    }
  }
}

/** Re-derive the complete freeze record from current published bytes. */
export function derivePhase8Freeze(repositoryRoot: string): { book: Phase8Book; freeze: Phase8Freeze } {
  const bookPath = checkedPath(repositoryRoot, PHASE8_TARGET_BOOK_PATH);
  const book = verifyPhase8TargetBookFile(bookPath, repositoryRoot);
  const targetPin = pinFile(repositoryRoot, PHASE8_TARGET_BOOK_PATH);
  if (targetPin.byteLength !== book.byteLength || targetPin.sha256 !== book.sha256) {
    throw new Error("Phase 8 target-book parser and raw-byte pin disagree");
  }
  const sourceIndexes = book.status.sourceIndexes.map((path) => pinFile(repositoryRoot, path));
  const dataPaths = [...new Set(book.entries.flatMap((entry) => entry.dataRefs))].sort();
  const registeredData = dataPaths.map((path) => pinFile(repositoryRoot, path));
  const operators = PHASE8_OPERATOR_PATHS.map((path) => pinFile(repositoryRoot, path));
  const extendedDataset = pinFile(repositoryRoot, book.status.extends.path);
  if (extendedDataset.sha256 !== book.status.extends.sha256) {
    throw new Error("Phase 8 extended-dataset pin disagrees with the target book");
  }
  const ids = (split: Phase8Book["entries"][number]["partition"]["split"]): readonly string[] => (
    book.entries.filter((entry) => entry.partition.split === split).map((entry) => entry.id)
  );
  const inputIds = book.entries.filter((entry) => entry.role === "input").map((entry) => entry.id);
  return {
    book,
    freeze: {
      schema: PHASE8_FREEZE_SCHEMA,
      targetBook: {
        ...targetPin,
        entryCount: book.status.entryCount,
        targetCount: book.status.targetCount,
        inputCount: book.status.inputCount,
      },
      report: pinFile(repositoryRoot, PHASE8_REPORT_PATH),
      sourceIndexes,
      supportingRecords: PHASE8_SUPPORTING_RECORD_PATHS.map((path) => pinFile(repositoryRoot, path)),
      registeredData,
      operators,
      verifier: PHASE8_VERIFIER_PATHS.map((path) => pinFile(repositoryRoot, path)),
      extendedDataset: {
        ...extendedDataset,
        entryCount: book.status.extends.entryCount,
        passEligible: false,
      },
      split: {
        inputIds,
        modelDevelopmentIds: ids("model-development"),
        heldOutIds: ids("held-out"),
        outOfModelIds: ids("out-of-model"),
      },
      scope: {
        sourceCutoffDate: "2026-08-10",
        grantsValidationClaim: false,
        permitsSolverRun: false,
        note: "Source reconciliation and pre-registered Phase 9 partition only; no model was run or scored.",
      },
    },
  };
}

/** A freeze verdict is recomputed from its named bytes; no status field is trusted. */
export function verifyPhase8FreezeBytes(
  bytes: Uint8Array,
  repositoryRoot: string,
): { book: Phase8Book; freeze: Phase8Freeze } {
  const parsed = parseCanonicalJson(bytes, "Phase 8 target-book freeze");
  const derived = derivePhase8Freeze(repositoryRoot);
  if (canonicalJson(parsed) !== canonicalJson(derived.freeze)) {
    throw new Error("Phase 8 target-book freeze differs from independently re-derived bytes and split");
  }
  verifyTrackedRegularFiles(repositoryRoot, [
    PHASE8_FREEZE_PATH,
    derived.freeze.targetBook.path,
    derived.freeze.report.path,
    derived.freeze.extendedDataset.path,
    ...derived.freeze.sourceIndexes.map((pin) => pin.path),
    ...derived.freeze.supportingRecords.map((pin) => pin.path),
    ...derived.freeze.registeredData.map((pin) => pin.path),
    ...derived.freeze.operators.map((pin) => pin.path),
    ...derived.freeze.verifier.map((pin) => pin.path),
  ]);
  return derived;
}

export function verifyPhase8FreezeFile(repositoryRoot: string): { book: Phase8Book; freeze: Phase8Freeze } {
  const path = checkedPath(repositoryRoot, PHASE8_FREEZE_PATH);
  return verifyPhase8FreezeBytes(readFileSync(path), repositoryRoot);
}
