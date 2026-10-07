// Historical re-derivation fixtures use registered Git bytes, never today's mutable source.
// CRLF reconstruction is permitted only when it reproduces an existing exact identity.
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { gunzipSync } from "node:zlib";
import { afterAll } from "vitest";

export const FIXTURE_REPOSITORY = resolve(import.meta.dirname, "../..");
export const PHASE9_FREEZE_COMMIT = "1efe127068e5ba271fa76deda4765ecb8383a5a2";
export const HOUSEKEEPING_BASE_COMMIT = "7c58f8be643dad76fb84e5f7df9299c0ff27e583";
export const NAMED_CATALOG_COMMIT = "674bf15fdcda1b2a93ba3fcc2347436c74773817";
const sha256 = (value: Uint8Array): string => createHash("sha256").update(value).digest("hex");
export interface HistoricalIdentity {
  readonly path: string;
  readonly byteLength: number;
  readonly sha256: string;
}

export function historicalGitBytes(path: string, commit: string, identity?: HistoricalIdentity): Buffer {
  const raw = execFileSync("git", ["show", `${commit}:${path}`], {
    cwd: FIXTURE_REPOSITORY, windowsHide: true, maxBuffer: 32 * 1024 * 1024,
  });
  if (identity === undefined) return raw;
  const lf = Buffer.from(raw.toString("utf8").replaceAll("\r\n", "\n"));
  const candidates = [raw, lf, Buffer.from(lf.toString("utf8").replaceAll("\n", "\r\n"))];
  const exact = candidates.find((bytes) => bytes.byteLength === identity.byteLength && sha256(bytes) === identity.sha256);
  if (exact === undefined) throw new Error(`${commit}:${path}: cannot reconstruct registered historical byte identity`);
  return exact;
}

export function temporaryFixture(label: string): string {
  const root = mkdtempSync(join(tmpdir(), label));
  afterAll(() => rmSync(root, { recursive: true, force: true }));
  return root;
}

export function writeFixtureFile(root: string, path: string, bytes: Uint8Array): void {
  const target = resolve(root, path);
  if (!target.startsWith(`${resolve(root)}\\`) && !target.startsWith(`${resolve(root)}/`)) {
    throw new Error(`historical fixture path escapes root: ${path}`);
  }
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, bytes);
}

/** Retained refused attempts are test data, never an executable recovery queue. */
function restoreRetiredPhase10Archive(root: string, archiveName: string, byteLength: number, digest: string, prefixName: string, expectedFiles: number): void {
  const compressed = readFileSync(join(FIXTURE_REPOSITORY, "runner/test/fixtures", archiveName));
  if (compressed.byteLength !== byteLength || sha256(compressed) !== digest) {
    throw new Error("retired Phase 10 test archive differs from its original owner pin");
  }
  const archive = gunzipSync(compressed);
  const paths = new Set<string>();
  let paxPath: string | undefined;
  let files = 0;
  for (let offset = 0; offset + 512 <= archive.length;) {
    const header = archive.subarray(offset, offset + 512);
    if (header.every((value) => value === 0)) break;
    const field = (start: number, end: number): string => header.subarray(start, end).toString("utf8").split("\0")[0]!;
    const size = Number.parseInt(field(124, 136).trim(), 8) || 0;
    const type = field(156, 157);
    const prefix = field(345, 500);
    const name = paxPath ?? `${prefix.length === 0 ? "" : `${prefix}/`}${field(0, 100)}`;
    if (!Number.isSafeInteger(size) || size < 0 || offset + 512 + size > archive.length) {
      throw new Error("retired Phase 10 tar member size is invalid");
    }
    if (type === "x") {
      const records = archive.subarray(offset + 512, offset + 512 + size).toString("utf8");
      paxPath = records.split("\n").find((line) => /^\d+ path=/u.test(line))?.replace(/^\d+ path=/u, "");
      offset += 512 + Math.ceil(size / 512) * 512;
      continue;
    }
    if (type !== "5" && type !== "0" && type !== "") throw new Error(`unsupported retired tar member: ${type}`);
    if (!name.startsWith(`${prefixName}/`) || name.split("/").includes("..") || paths.has(name)) {
      throw new Error(`invalid or repeated retired tar member: ${name}`);
    }
    paths.add(name);
    if (type !== "5") {
      const destination = `out/${prefixName.slice("evidence-".length)}/${name.slice(prefixName.length + 1)}`;
      writeFixtureFile(root, destination, archive.subarray(offset + 512, offset + 512 + size));
      files += 1;
    }
    paxPath = undefined;
    offset += 512 + Math.ceil(size / 512) * 512;
  }
  if (files !== expectedFiles) throw new Error("retired Phase 10 archive regular-file inventory differs");
}

/** Preserve Git ancestry and the original canonical tree without relying on retired branch names. */
export function historicalCheckout(commit: string, label: string): string {
  const root = temporaryFixture(label);
  execFileSync("git", ["clone", "--quiet", "--shared", "--no-checkout", "--config", "core.autocrlf=false", FIXTURE_REPOSITORY, root], {
    windowsHide: true, maxBuffer: 8 * 1024 * 1024,
  });
  execFileSync("git", ["checkout", "--quiet", "--detach", commit], {
    cwd: root, windowsHide: true, maxBuffer: 8 * 1024 * 1024,
  });
  return root;
}

/** Use a private Git checkout so evolving root config cannot change registered historical tests. */
export function phase10RetiredFixture(): string {
  const root = historicalCheckout(HOUSEKEEPING_BASE_COMMIT, "phase10-retired-history-");
  cpSync(join(FIXTURE_REPOSITORY, "node_modules/typescript"), join(root, "node_modules/typescript"), { recursive: true });
  restoreRetiredPhase10Archive(root, "phase10-retired-recovery.tar.gz", 214_961,
    "73260d23836866bd5c47ca871e60ab3e6f12938eaf722ca70dc5b7f4370b5e25", "evidence-phase10-execution-v2", 70);
  restoreRetiredPhase10Archive(root, "phase10-retired-references.tar.gz", 100_651,
    "e34e5abb9bdcd621f879f5cf6a68e9d658741446c02b86a83931fbd228298b5a", "evidence-phase10-c0v-reference-v1", 9);
  return root;
}

/** Exercise current planning code with the exact pre-final-acceptance catalog, not the live 99 slots. */
export function namedCrystalPlanningFixture(): string {
  const root = temporaryFixture("named-planning-history-");
  cpSync(join(FIXTURE_REPOSITORY, "scripts"), join(root, "scripts"), { recursive: true });
  cpSync(join(FIXTURE_REPOSITORY, "app/src"), join(root, "app/src"), { recursive: true });
  cpSync(join(FIXTURE_REPOSITORY, "package.json"), join(root, "package.json"));
  symlinkSync(join(FIXTURE_REPOSITORY, "node_modules"), join(root, "node_modules"), process.platform === "win32" ? "junction" : "dir");
  const files = readdirSync(join(FIXTURE_REPOSITORY, "docs"))
    .filter((name) => name.startsWith("named-snow-crystal-") && name.endsWith(".json"));
  for (const name of files) writeFixtureFile(root, `docs/${name}`, historicalGitBytes(`docs/${name}`, HOUSEKEEPING_BASE_COMMIT));
  for (const lane of ["fig-records", "gen-records"]) {
    cpSync(join(FIXTURE_REPOSITORY, "evidence/gutcheck-gg-realism", lane), join(root, "evidence/gutcheck-gg-realism", lane), { recursive: true });
  }
  writeFixtureFile(root, "docs/named-snow-crystal-catalog.json", historicalGitBytes("docs/named-snow-crystal-catalog.json", NAMED_CATALOG_COMMIT, {
    path: "docs/named-snow-crystal-catalog.json", byteLength: 21_034,
    sha256: "b83290632544b877126fdb0d36280b8f2bf43702b21875aa769616858719c95d",
  }));
  // The registered planning manifests bind the original Windows checkout's exact review bytes.
  for (const name of files) {
    const value = JSON.parse(readFileSync(join(root, "docs", name), "utf8")) as unknown;
    const visit = (candidate: unknown): void => {
      if (candidate === null || typeof candidate !== "object") return;
      const wire = candidate as Record<string, unknown>;
      if (typeof wire.path === "string" && wire.path.startsWith("docs/named-snow-crystal-") &&
          typeof wire.byteLength === "number" && typeof wire.sha256 === "string" &&
          existsSync(join(root, wire.path))) {
        writeFixtureFile(root, wire.path, historicalGitBytes(wire.path, HOUSEKEEPING_BASE_COMMIT, wire as unknown as HistoricalIdentity));
      }
      for (const child of Object.values(wire)) visit(child);
    };
    visit(value);
  }
  return root;
}
