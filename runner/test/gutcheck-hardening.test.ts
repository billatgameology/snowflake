// Regression tests for the 2026-08-12 adversarial review of the gutcheck NAS/evidence
// relocation (docs/plans/explore-gg-realism-gutcheck.md, dated entry). Every test here is a
// named finding from that review; none is speculative hardening. Repo-level guard tests live
// in runner/test by precedent (rule7-lint, evidence-integrity).

import { execFileSync, spawn, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { createServer, get } from "node:http";
import {
  chmodSync,
  closeSync,
  cpSync,
  existsSync,
  fstatSync,
  mkdirSync,
  mkdtempSync,
  openSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  statSync,
  symlinkSync,
  truncateSync,
  utimesSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import { afterAll, describe, expect, it } from "vitest";

import viteConfig, { pipeNasFile } from "../../app/vite.config.ts";
import {
  archiveEntryPathIsSafe,
  archiveMemberListSha256,
} from "../../scripts/gutcheck-archive-lib.ts";
import {
  detectNasMount,
  openNasResolution,
  pathIsWithinRoot,
  resolveNasRequest,
} from "../../scripts/nas-root.ts";
import { prepareSafePlacement } from "../../scripts/gutcheck-restore-lib.ts";
import {
  buildGutcheckRunIdentity,
  isCompleteRecord,
  isCompleteTimeline,
  updateGutcheckEvidenceManifest,
} from "../../scripts/gutcheck-evidence-lib.ts";

const REPO = resolve(import.meta.dirname, "..", "..");
// Creating file symlinks on Windows needs SeCreateSymbolicLinkPrivilege (admin or Developer
// Mode). Without it, every symlinkSync below throws EPERM during test SETUP, reporting the
// guards themselves as broken when they were never exercised. Probe once; hosts that can
// create symlinks (macOS/Linux, Developer-Mode Windows) still run every guard.
const CAN_SYMLINK = (() => {
  const probe = join(mkdtempSync(join(tmpdir(), "gutcheck-symlink-probe-")), "link");
  try {
    symlinkSync(join(dirname(probe), "missing-target"), probe);
    rmSync(probe);
    return true;
  } catch {
    return false;
  } finally {
    rmSync(dirname(probe), { recursive: true, force: true });
  }
})();
const tempRoots: string[] = [];
const makeTemp = (label: string): string => {
  const dir = mkdtempSync(join(tmpdir(), `gutcheck-${label}-`));
  tempRoots.push(dir);
  return dir;
};
const waitFor = async (predicate: () => boolean, label: string, timeoutMs = 10_000): Promise<void> => {
  const deadline = Date.now() + timeoutMs;
  while (!predicate()) {
    if (Date.now() > deadline) throw new Error(`timed out waiting for ${label}`);
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 10));
  }
};

function crc32(value: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of value) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) {
      crc = (crc >>> 1) ^ ((crc & 1) === 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

interface StoredZipEntry {
  readonly name: string;
  readonly value: Uint8Array;
  readonly externalAttributes?: number;
}

/** A deterministic store-mode ZIP fixture writer; duplicate central-directory names are allowed. */
function storedZip(entries: readonly StoredZipEntry[]): Uint8Array {
  const localParts: Buffer[] = [];
  const centralParts: Buffer[] = [];
  let localOffset = 0;
  for (const entry of entries) {
    const name = Buffer.from(entry.name, "utf8");
    const value = Buffer.from(entry.value);
    const declaredCrc = crc32(value);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0x0800, 6);
    local.writeUInt16LE(0, 8);
    local.writeUInt32LE(declaredCrc, 14);
    local.writeUInt32LE(value.length, 18);
    local.writeUInt32LE(value.length, 22);
    local.writeUInt16LE(name.length, 26);
    localParts.push(local, name, value);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE((3 << 8) | 20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0x0800, 8);
    central.writeUInt16LE(0, 10);
    central.writeUInt32LE(declaredCrc, 16);
    central.writeUInt32LE(value.length, 20);
    central.writeUInt32LE(value.length, 24);
    central.writeUInt16LE(name.length, 28);
    central.writeUInt32LE(entry.externalAttributes ?? 0x81a40000, 38);
    central.writeUInt32LE(localOffset, 42);
    centralParts.push(central, name);
    localOffset += local.length + name.length + value.length;
  }
  const localBytes = Buffer.concat(localParts);
  const centralBytes = Buffer.concat(centralParts);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(centralBytes.length, 12);
  end.writeUInt32LE(localBytes.length, 16);
  return new Uint8Array(Buffer.concat([localBytes, centralBytes, end]));
}

const FIXTURE_SPEC = { label: "identity fixture", stages: [{ untilTick: 100, rho: 0.5 }] };
const FIXTURE_DIMS = { nx: 500, ny: 500, nz: 96 };
const fixtureExpected = (framesEvery = 10) => ({
  id: "t1",
  framesEvery,
  run: buildGutcheckRunIdentity({
    spec: FIXTURE_SPEC,
    dims: FIXTURE_DIMS,
    domain: "hexPrism",
    tickCap: 30_000,
    rngSeed: 1,
    noiseEpsilon: 0,
    seedThickness: 1,
    extraction: { spacing: 0.6, sigma: 0.45, iso: 0.5, margin: 4, normalDelta: 3 },
  }),
});
const fixtureRecord = () => ({
  tick: 95,
  stopReason: "tick-cap",
  spec: structuredClone(FIXTURE_SPEC),
  dims: { ...FIXTURE_DIMS },
  domain: "hexPrism",
  tickCap: 30_000,
  seed: 1,
  noise: 0,
  seedThickness: 1,
  mesh: {
    path: "out/gutcheck-gg-realism/large/gen/t1-mesh.bin",
    extraction: { spacing: 0.6, sigma: 0.45, iso: 0.5, margin: 4, normalDelta: 3 },
  },
});
const fixtureTimeline = () => ({
  format: "gutcheck-anim-v1",
  complete: true,
  config: {
    spec: structuredClone(FIXTURE_SPEC),
    dims: { ...FIXTURE_DIMS },
    domain: "hexPrism",
    ticks: 30_000,
    every: 10,
    seed: 1,
    noise: 0,
    seedThickness: 1,
    extraction: { spacing: 0.6, sigma: 0.45, iso: 0.5, margin: 4, normalDelta: 3 },
  },
  frames: [...Array.from({ length: 10 }, (_, index) => index * 10), 95].map((tick) => ({
    file: `mesh-t${String(tick).padStart(6, "0")}.bin`,
    tick,
  })),
});
const writeFixtureTimeline = (
  manifestPath: string,
  timeline: ReturnType<typeof fixtureTimeline> = fixtureTimeline(),
): void => {
  mkdirSync(dirname(manifestPath), { recursive: true });
  for (const frame of timeline.frames) writeFileSync(join(dirname(manifestPath), frame.file), `mesh-${String(frame.tick)}`);
  writeFileSync(manifestPath, JSON.stringify(timeline));
};
afterAll(() => {
  for (const dir of tempRoots) rmSync(dir, { recursive: true, force: true });
});

// ── /nas route containment (review item: symlink escape served /etc/hosts) ────────────────

describe("resolveNasRequest containment", () => {
  const share = (): string => {
    const root = makeTemp("share");
    mkdirSync(join(root, "sub"));
    writeFileSync(join(root, "sub", "file.bin"), "payload");
    return root;
  };

  it("serves a contained regular file", () => {
    const root = share();
    const r = resolveNasRequest("/sub/file.bin", root);
    expect(r.kind).toBe("ok");
    if (r.kind === "ok") {
      expect(r.size).toBe(7);
      expect(readFileSync(r.path, "utf8")).toBe("payload");
      const opened = openNasResolution(r);
      expect(opened.kind).toBe("ok");
      if (opened.kind === "ok") {
        expect(readFileSync(opened.fd, "utf8")).toBe("payload");
        closeSync(opened.fd);
      }
    }
  });

  it("refuses dot-dot traversal, raw and percent-encoded", () => {
    const root = share();
    expect(resolveNasRequest("/../../etc/hosts", root).kind).toBe("forbidden");
    expect(resolveNasRequest("/%2e%2e/%2e%2e/etc/hosts", root).kind).toBe("forbidden");
  });

  it.skipIf(!CAN_SYMLINK)("refuses a symlink inside the share that points outside it", () => {
    const root = share();
    const outside = makeTemp("outside");
    writeFileSync(join(outside, "secret.txt"), "secret");
    symlinkSync(join(outside, "secret.txt"), join(root, "sub", "leak.bin"));
    expect(resolveNasRequest("/sub/leak.bin", root).kind).toBe("forbidden");
  });

  it.skipIf(!CAN_SYMLINK)("refuses traversal through a symlinked directory", () => {
    const root = share();
    const outside = makeTemp("outside-dir");
    writeFileSync(join(outside, "hosts"), "x");
    symlinkSync(outside, join(root, "sub", "door"), "dir");
    expect(resolveNasRequest("/sub/door/hosts", root).kind).toBe("forbidden");
  });

  it.skipIf(!CAN_SYMLINK)("still serves a symlink that stays inside the share", () => {
    const root = share();
    symlinkSync(join(root, "sub", "file.bin"), join(root, "alias.bin"));
    expect(resolveNasRequest("/alias.bin", root).kind).toBe("ok");
  });

  it.skipIf(!CAN_SYMLINK)("404s directories, missing files, dangling links, and malformed encoding", () => {
    const root = share();
    symlinkSync(join(root, "gone"), join(root, "dangling.bin"));
    expect(resolveNasRequest("/sub", root).kind).toBe("notfound");
    expect(resolveNasRequest("/nope.bin", root).kind).toBe("notfound");
    expect(resolveNasRequest("/dangling.bin", root).kind).toBe("notfound");
    expect(resolveNasRequest("/%zz", root).kind).toBe("notfound");
  });

  it.skipIf(!CAN_SYMLINK)("refuses a persistent ancestor swap between containment and open", () => {
    const root = share();
    const resolution = resolveNasRequest("/sub/file.bin", root);
    expect(resolution.kind).toBe("ok");
    if (resolution.kind !== "ok") return;
    const held = join(root, "held-sub");
    renameSync(join(root, "sub"), held);
    const outside = makeTemp("nas-open-swap");
    writeFileSync(join(outside, "file.bin"), "outside");
    symlinkSync(outside, join(root, "sub"), "dir");
    const opened = openNasResolution(resolution);
    if (opened.kind === "ok") closeSync(opened.fd);
    expect(opened.kind).toBe("forbidden");
  });

  it("treats a Windows drive root as the parent of its children", () => {
    expect(pathIsWithinRoot("S:\\", "S:\\out\\gutcheck-gg-realism", "win32")).toBe(true);
    expect(pathIsWithinRoot("S:\\", "s:\\OUT\\gutcheck-gg-realism", "win32")).toBe(true);
    expect(pathIsWithinRoot("S:\\", "T:\\out\\gutcheck-gg-realism", "win32")).toBe(false);
  });

  it("does not expose the NAS through Vite's lexical /@fs allow-list", () => {
    const config = viteConfig as { server?: { fs?: { allow?: string[] } } };
    expect(config.server?.fs?.allow).toEqual([REPO]);
  });
});

describe("/nas stream lifecycle", () => {
  it("closes the source descriptor when the client aborts", async () => {
    const root = makeTemp("nas-abort");
    const file = join(root, "large.bin");
    writeFileSync(file, "");
    truncateSync(file, 256 * 1024 * 1024);
    let servedFd: number | null = null;
    const server = createServer((_request, response) => {
      servedFd = openSync(file, "r");
      pipeNasFile(response, file, servedFd);
    });
    await new Promise<void>((resolvePromise, rejectPromise) => {
      server.once("error", rejectPromise);
      server.listen(0, "127.0.0.1", () => resolvePromise());
    });
    try {
      const address = server.address();
      if (address === null || typeof address === "string") throw new Error("test server has no TCP address");
      await new Promise<void>((resolvePromise, rejectPromise) => {
        const request = get({ hostname: "127.0.0.1", port: address.port, path: "/large.bin" }, (response) => {
          response.once("data", () => {
            response.destroy();
            resolvePromise();
          });
          response.once("error", () => resolvePromise());
        });
        request.once("error", rejectPromise);
      });
      await waitFor(() => {
        if (servedFd === null) return false;
        try {
          fstatSync(servedFd);
          return false;
        } catch (error) {
          return (error as NodeJS.ErrnoException).code === "EBADF";
        }
      }, "aborted NAS stream descriptor close");
    } finally {
      await new Promise<void>((resolvePromise) => server.close(() => resolvePromise()));
    }
  });
});

describe("NAS mount detection", () => {
  it("rejects an override whose marker is a regular file rather than the artifact directory", () => {
    const root = makeTemp("nas-marker-file");
    mkdirSync(join(root, "out", "gutcheck-gg-realism"), { recursive: true });
    writeFileSync(join(root, "out", "gutcheck-gg-realism", "large"), "not a directory");
    const previous = process.env.GUTCHECK_NAS_ROOT;
    process.env.GUTCHECK_NAS_ROOT = root;
    try {
      expect(() => detectNasMount()).toThrow(/does not contain/);
    } finally {
      if (previous === undefined) delete process.env.GUTCHECK_NAS_ROOT;
      else process.env.GUTCHECK_NAS_ROOT = previous;
    }
  });

  it.skipIf(!CAN_SYMLINK)("rejects an override whose marker symlinks outside the share", () => {
    const root = makeTemp("nas-marker-escape");
    const outside = makeTemp("nas-marker-outside");
    mkdirSync(join(root, "out", "gutcheck-gg-realism"), { recursive: true });
    symlinkSync(outside, join(root, "out", "gutcheck-gg-realism", "large"), "dir");
    const previous = process.env.GUTCHECK_NAS_ROOT;
    process.env.GUTCHECK_NAS_ROOT = root;
    try {
      expect(() => detectNasMount()).toThrow(/does not contain/);
    } finally {
      if (previous === undefined) delete process.env.GUTCHECK_NAS_ROOT;
      else process.env.GUTCHECK_NAS_ROOT = previous;
    }
  });

  it.skipIf(!CAN_SYMLINK)("accepts a marker symlink whose target remains inside the share", () => {
    const root = makeTemp("nas-marker-contained");
    const actual = join(root, "actual-large");
    mkdirSync(actual);
    mkdirSync(join(root, "out", "gutcheck-gg-realism"), { recursive: true });
    symlinkSync(actual, join(root, "out", "gutcheck-gg-realism", "large"), "dir");
    const previous = process.env.GUTCHECK_NAS_ROOT;
    process.env.GUTCHECK_NAS_ROOT = root;
    try {
      expect(detectNasMount()).toBe(`${root}/`);
    } finally {
      if (previous === undefined) delete process.env.GUTCHECK_NAS_ROOT;
      else process.env.GUTCHECK_NAS_ROOT = previous;
    }
  });
});

// ── restore placement (review item: dest/figs symlink wrote outside --dest, exit 0) ───────

describe("prepareSafePlacement destination guard", () => {
  it("places through real directories and creates missing parents", () => {
    const dest = makeTemp("dest");
    const target = prepareSafePlacement(dest, "figs/deep/fig10.err");
    expect(target.startsWith(dest)).toBe(true);
    expect(existsSync(join(dest, "figs", "deep"))).toBe(true);
  });

  it.skipIf(!CAN_SYMLINK)("refuses the reviewed control: dest/figs symlinked elsewhere", () => {
    const dest = makeTemp("dest");
    const elsewhere = makeTemp("elsewhere");
    symlinkSync(elsewhere, join(dest, "figs"), "dir");
    expect(() => prepareSafePlacement(dest, "figs/fig10.err")).toThrow(/symlink/);
    expect(existsSync(join(elsewhere, "fig10.err"))).toBe(false);
  });

  it.skipIf(!CAN_SYMLINK)("refuses a symlinked final target and a file where a directory is needed", () => {
    const dest = makeTemp("dest");
    const outside = makeTemp("outside");
    writeFileSync(join(outside, "victim"), "x");
    symlinkSync(join(outside, "victim"), join(dest, "link.bin"));
    expect(() => prepareSafePlacement(dest, "link.bin")).toThrow(/symlink/);
    writeFileSync(join(dest, "flat"), "x");
    expect(() => prepareSafePlacement(dest, "flat/nested.bin")).toThrow(/not a directory/);
  });
});

// ── evidence manifest publication (review item: unlocked read/modify/write; truncation) ────

describe("evidence manifest pinning", () => {
  const fixture = (): { manifestPath: string; subtreeDir: string } => {
    const root = makeTemp("manifest");
    const manifestPath = join(root, "MANIFEST.json");
    const subtreeDir = join(root, "subtree");
    mkdirSync(subtreeDir);
    writeFileSync(
      manifestPath,
      JSON.stringify({ fileCount: 1, totalBytes: 3, files: { "other/tree.json": { bytes: 3, sha256: "0".repeat(64) } } }, null, 1),
    );
    return { manifestPath, subtreeDir };
  };

  it("pins the subtree, preserves other trees' entries, and leaves no residue", () => {
    const { manifestPath, subtreeDir } = fixture();
    writeFileSync(join(subtreeDir, "README.md"), "read me");
    mkdirSync(join(subtreeDir, "dialin"));
    writeFileSync(join(subtreeDir, "dialin", "a-record.json"), "{}");
    writeFileSync(join(subtreeDir, ".hidden.tmp"), "in-flight"); // must never be pinned
    const { pinned } = updateGutcheckEvidenceManifest({ manifestPath, subtreeDir, subtreePrefix: "sub" });
    expect(pinned).toBe(2);
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as {
      fileCount: number;
      files: Record<string, { bytes: number }>;
    };
    expect(manifest.files["sub/dialin/a-record.json"]).toBeDefined();
    expect(manifest.files["sub/README.md"]).toBeDefined();
    expect(manifest.files["other/tree.json"]).toBeDefined();
    expect(manifest.fileCount).toBe(3);
    expect(Object.keys(manifest.files)).toEqual([
      "other/tree.json",
      "sub/dialin/a-record.json",
      "sub/README.md",
    ]);
    expect(existsSync(`${manifestPath}.lock`)).toBe(false);
    expect(Object.keys(manifest.files).some((k) => k.includes(".tmp"))).toBe(false);
  });

  it("does not mistake an eval import with the library at argv[1] for direct CLI execution", () => {
    const root = makeTemp("eval-import");
    const scriptDir = join(root, "scripts");
    const evidenceDir = join(root, "evidence");
    const subtreeDir = join(evidenceDir, "gutcheck-gg-realism");
    mkdirSync(scriptDir, { recursive: true });
    mkdirSync(subtreeDir, { recursive: true });
    const lib = join(scriptDir, "gutcheck-evidence-lib.ts");
    cpSync(join(REPO, "scripts", "gutcheck-evidence-lib.ts"), lib);
    const manifestPath = join(evidenceDir, "MANIFEST.json");
    writeFileSync(manifestPath, JSON.stringify({ fileCount: 0, totalBytes: 0, files: {} }, null, 1));
    writeFileSync(join(subtreeDir, "would-be-pinned.json"), "{}");
    const before = readFileSync(manifestPath, "utf8");

    const imported = spawnSync(
      process.execPath,
      [
        "--input-type=module",
        "-e",
        'const { pathToFileURL } = await import("node:url"); await import(pathToFileURL(process.argv[1]).href);',
        lib,
      ],
      { encoding: "utf8" },
    );

    expect(imported.status, String(imported.stderr)).toBe(0);
    expect(imported.stdout).toBe("");
    expect(readFileSync(manifestPath, "utf8")).toBe(before);
  });

  const startLockChild = (manifestPath: string, attempted: string, acquired: string, release: string) => {
    const lib = join(REPO, "scripts", "gutcheck-evidence-lib.ts");
    const proc = spawn(process.execPath, [
      "--input-type=module",
      "-e",
      `import { existsSync, writeFileSync } from "node:fs";
       import { pathToFileURL } from "node:url";
       const [lib, manifest, attempted, acquired, release] = process.argv.slice(1);
       const { withGutcheckEvidenceManifestLock } = await import(pathToFileURL(lib).href);
       writeFileSync(attempted, "attempted");
       withGutcheckEvidenceManifestLock(manifest, () => {
         writeFileSync(acquired, "acquired");
         if (release !== "-") {
           const waitArray = new Int32Array(new SharedArrayBuffer(4));
           while (!existsSync(release)) Atomics.wait(waitArray, 0, 0, 10);
         }
       });`,
      lib,
      manifestPath,
      attempted,
      acquired,
      release,
    ]);
    let stderr = "";
    proc.stderr.on("data", (chunk: Buffer) => (stderr += chunk.toString()));
    const done = new Promise<{ code: number | null; stderr: string }>((resolvePromise) => {
      proc.on("exit", (code) => resolvePromise({ code, stderr }));
    });
    return { proc, done };
  };

  const startPinChild = (manifestPath: string, subtreeDir: string, attempted: string, finished: string) => {
    const lib = join(REPO, "scripts", "gutcheck-evidence-lib.ts");
    const proc = spawn(process.execPath, [
      "--input-type=module",
      "-e",
      `import { writeFileSync } from "node:fs";
       import { pathToFileURL } from "node:url";
       const [lib, manifest, subtree, attempted, finished] = process.argv.slice(1);
       const { updateGutcheckEvidenceManifest } = await import(pathToFileURL(lib).href);
       writeFileSync(attempted, "attempted");
       updateGutcheckEvidenceManifest({ manifestPath: manifest, subtreeDir: subtree, subtreePrefix: "sub" });
       writeFileSync(finished, "finished");`,
      lib,
      manifestPath,
      subtreeDir,
      attempted,
      finished,
    ]);
    let stderr = "";
    proc.stderr.on("data", (chunk: Buffer) => (stderr += chunk.toString()));
    const done = new Promise<{ code: number | null; stderr: string }>((resolvePromise) => {
      proc.on("exit", (code) => resolvePromise({ code, stderr }));
    });
    return { proc, done };
  };

  it("makes a live manifest update wait until the current lock holder exits its action", async () => {
    const { manifestPath, subtreeDir } = fixture();
    const root = makeTemp("live-lock");
    writeFileSync(join(subtreeDir, "contended.json"), "{}");
    const firstRelease = join(root, "release-first");
    const first = startLockChild(manifestPath, join(root, "first-attempted"), join(root, "first-acquired"), firstRelease);
    await waitFor(() => existsSync(join(root, "first-acquired")), "first lock acquisition");

    const second = startPinChild(manifestPath, subtreeDir, join(root, "second-attempted"), join(root, "second-finished"));
    await waitFor(() => existsSync(join(root, "second-attempted")), "second lock attempt");
    // The second child has imported the module and is immediately before the updater call. If
    // the updater stops taking the shared lock, it publishes second-finished while the first
    // action is still live; with serialization it cannot finish until firstRelease appears.
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 250));
    try {
      expect(existsSync(join(root, "second-finished"))).toBe(false);
      expect(second.proc.exitCode).toBe(null);
    } finally {
      writeFileSync(firstRelease, "release");
    }

    const firstResult = await first.done;
    const secondResult = await second.done;
    expect(firstResult.code, firstResult.stderr).toBe(0);
    expect(secondResult.code, secondResult.stderr).toBe(0);
    expect(existsSync(join(root, "second-finished"))).toBe(true);
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as { files: Record<string, unknown> };
    expect(manifest.files["sub/contended.json"]).toBeDefined();
    expect(existsSync(`${manifestPath}.lock`)).toBe(false);
  });

  it.each(["ownerless", "different-token"] as const)(
    "does not delete an %s replacement lock when the old holder releases",
    async (replacementKind) => {
      const { manifestPath } = fixture();
      const root = makeTemp(`replacement-${replacementKind}`);
      const release = join(root, "release");
      const child = startLockChild(manifestPath, join(root, "attempted"), join(root, "acquired"), release);
      await waitFor(() => existsSync(join(root, "acquired")), "child lock acquisition");

      const lockDir = `${manifestPath}.lock`;
      rmSync(lockDir, { recursive: true, force: true });
      mkdirSync(lockDir);
      if (replacementKind === "different-token") {
        writeFileSync(join(lockDir, "owner"), JSON.stringify({ pid: process.pid, token: "replacement-token" }));
      }
      writeFileSync(release, "release");
      const result = await child.done;

      expect(result.code, result.stderr).toBe(0);
      expect(result.stderr).toMatch(/is no longer ours; leaving it in place/);
      expect(existsSync(lockDir)).toBe(true);
      if (replacementKind === "different-token") {
        expect(JSON.parse(readFileSync(join(lockDir, "owner"), "utf8"))).toEqual({
          pid: process.pid,
          token: "replacement-token",
        });
      } else {
        expect(existsSync(join(lockDir, "owner"))).toBe(false);
      }
      rmSync(lockDir, { recursive: true, force: true });
    },
  );

  it("recovers a lock owned by a process that has exited", async () => {
    const { manifestPath, subtreeDir } = fixture();
    writeFileSync(join(subtreeDir, "after-dead-owner.json"), "{}");
    const departed = spawn(process.execPath, ["-e", ""]);
    const deadPid = departed.pid;
    expect(deadPid).toBeDefined();
    await new Promise<void>((resolvePromise) => departed.on("exit", () => resolvePromise()));
    const lockDir = `${manifestPath}.lock`;
    mkdirSync(lockDir);
    writeFileSync(join(lockDir, "owner"), JSON.stringify({ pid: deadPid, token: "departed" }));

    expect(updateGutcheckEvidenceManifest({ manifestPath, subtreeDir, subtreePrefix: "sub" }).pinned).toBe(1);
    expect(existsSync(lockDir)).toBe(false);
  });

  it("recovers an ownerless lock only after its grace period", () => {
    const { manifestPath, subtreeDir } = fixture();
    writeFileSync(join(subtreeDir, "after-ownerless.json"), "{}");
    const lockDir = `${manifestPath}.lock`;
    mkdirSync(lockDir);
    const stale = new Date(Date.now() - 10_000);
    utimesSync(lockDir, stale, stale);

    expect(updateGutcheckEvidenceManifest({ manifestPath, subtreeDir, subtreePrefix: "sub" }).pinned).toBe(1);
    expect(existsSync(lockDir)).toBe(false);
  });

  it("validates legacy record schema and canonical invocation identity, not bare JSON", () => {
    const dir = makeTemp("records");
    const good = join(dir, "t1-record.json");
    const torn = join(dir, "torn-record.json");
    const bare = join(dir, "bare-record.json");
    writeFileSync(good, JSON.stringify(fixtureRecord()));
    writeFileSync(torn, '{"stopReason": "tickCap", "tick": 1'); // killed mid-write
    writeFileSync(bare, "{}"); // round-2 review: this used to pass
    expect(isCompleteRecord(good)).toBe(true);
    expect(isCompleteRecord(good, fixtureExpected())).toBe(true);
    expect(isCompleteRecord(good, "t2"), "identity mismatch must fail").toBe(false);
    expect(isCompleteRecord(torn)).toBe(false);
    expect(isCompleteRecord(bare)).toBe(false);
    expect(isCompleteRecord(join(dir, "absent-record.json"))).toBe(false);
  });

  it("accepts matching embedded run identities and rejects stale self-descriptions", () => {
    const dir = makeTemp("embedded-identity");
    const recordPath = join(dir, "t1-record.json");
    const timelinePath = join(dir, "manifest.json");
    const expected = fixtureExpected();
    const record = { ...fixtureRecord(), runIdentity: structuredClone(expected.run) };
    writeFileSync(recordPath, JSON.stringify(record));
    expect(isCompleteRecord(recordPath, expected)).toBe(true);

    record.runIdentity.tickCap--;
    writeFileSync(recordPath, JSON.stringify(record));
    expect(isCompleteRecord(recordPath, expected), "stale record runIdentity").toBe(false);

    writeFileSync(
      recordPath,
      JSON.stringify({ ...fixtureRecord(), runIdentity: structuredClone(expected.run) }),
    );
    const timeline = fixtureTimeline();
    const currentTimeline = {
      ...timeline,
      config: { ...timeline.config, runIdentity: structuredClone(expected.run) },
    };
    writeFixtureTimeline(timelinePath, currentTimeline);
    expect(isCompleteTimeline(timelinePath, recordPath, expected)).toBe(true);
    currentTimeline.config.runIdentity.extraction.spacing = 0.8;
    writeFixtureTimeline(timelinePath, currentTimeline);
    expect(isCompleteTimeline(timelinePath, recordPath, expected), "stale timeline runIdentity").toBe(false);
  });

  it("rejects every result-affecting record and timeline identity mismatch", () => {
    const dir = makeTemp("identity-mutations");
    const recordPath = join(dir, "t1-record.json");
    const timelinePath = join(dir, "manifest.json");
    const expected = fixtureExpected();

    writeFileSync(recordPath, JSON.stringify(fixtureRecord()));
    writeFixtureTimeline(timelinePath);
    expect(isCompleteRecord(recordPath, expected)).toBe(true);
    expect(isCompleteTimeline(timelinePath, recordPath, expected)).toBe(true);

    const recordMutations: Array<[string, (record: ReturnType<typeof fixtureRecord>) => void]> = [
      ["spec", (record) => (record.spec.stages[0].rho = 0.6)],
      ["dimensions", (record) => (record.dims.nx = 501)],
      ["domain", (record) => (record.domain = "box")],
      ["tick cap", (record) => (record.tickCap = 29_999)],
      ["seed", (record) => (record.seed = 2)],
      ["noise", (record) => (record.noise = 0.01)],
      ["extraction spacing", (record) => (record.mesh.extraction.spacing = 0.8)],
      ["extraction smoothing", (record) => (record.mesh.extraction.sigma = 0.5)],
      ["extraction normal delta", (record) => (record.mesh.extraction.normalDelta = 4)],
      ["extraction iso", (record) => (record.mesh.extraction.iso = 0.6)],
      ["extraction margin", (record) => (record.mesh.extraction.margin = 5)],
    ];
    for (const [label, mutate] of recordMutations) {
      const record = fixtureRecord();
      mutate(record);
      writeFileSync(recordPath, JSON.stringify(record));
      expect(isCompleteRecord(recordPath, expected), label).toBe(false);
    }

    writeFileSync(recordPath, JSON.stringify(fixtureRecord()));
    const timelineMutations: Array<[string, (timeline: ReturnType<typeof fixtureTimeline>) => void]> = [
      ["spec", (timeline) => (timeline.config.spec.stages[0].rho = 0.6)],
      ["dimensions", (timeline) => (timeline.config.dims.nz = 95)],
      ["domain", (timeline) => (timeline.config.domain = "box")],
      ["tick cap", (timeline) => (timeline.config.ticks = 29_999)],
      ["seed", (timeline) => (timeline.config.seed = 2)],
      ["noise", (timeline) => (timeline.config.noise = 0.01)],
      ["extraction spacing", (timeline) => (timeline.config.extraction.spacing = 0.8)],
      ["extraction smoothing", (timeline) => (timeline.config.extraction.sigma = 0.5)],
      ["extraction normal delta", (timeline) => (timeline.config.extraction.normalDelta = 4)],
      ["extraction iso", (timeline) => (timeline.config.extraction.iso = 0.6)],
      ["extraction margin", (timeline) => (timeline.config.extraction.margin = 5)],
      ["cadence", (timeline) => (timeline.config.every = 20)],
      ["final tick", (timeline) => (timeline.frames[timeline.frames.length - 1].tick = 99)],
    ];
    for (const [label, mutate] of timelineMutations) {
      const timeline = fixtureTimeline();
      mutate(timeline);
      writeFileSync(timelinePath, JSON.stringify(timeline));
      expect(isCompleteTimeline(timelinePath, recordPath, expected), label).toBe(false);
    }
  });

  it.skipIf(!CAN_SYMLINK)("requires a safe, nonempty regular frame file for every canonical timeline tick", () => {
    const dir = makeTemp("timeline-files");
    const recordPath = join(dir, "t1-record.json");
    const timelinePath = join(dir, "manifest.json");
    const expected = fixtureExpected();
    writeFileSync(recordPath, JSON.stringify(fixtureRecord()));
    writeFixtureTimeline(timelinePath);
    expect(isCompleteTimeline(timelinePath, recordPath, expected)).toBe(true);

    const missing = fixtureTimeline().frames[2];
    rmSync(join(dir, missing.file));
    expect(isCompleteTimeline(timelinePath, recordPath, expected), "missing frame").toBe(false);
    writeFileSync(join(dir, missing.file), "restored");

    const empty = fixtureTimeline().frames[3];
    writeFileSync(join(dir, empty.file), "");
    expect(isCompleteTimeline(timelinePath, recordPath, expected), "empty frame").toBe(false);
    writeFileSync(join(dir, empty.file), "restored");

    const directory = fixtureTimeline().frames[4];
    rmSync(join(dir, directory.file));
    mkdirSync(join(dir, directory.file));
    expect(isCompleteTimeline(timelinePath, recordPath, expected), "directory in place of frame").toBe(false);
    rmSync(join(dir, directory.file), { recursive: true });
    writeFileSync(join(dir, directory.file), "restored");

    for (const unsafe of ["../escape.bin", resolve(dir, "absolute.bin")]) {
      const timeline = fixtureTimeline();
      timeline.frames[0].file = unsafe;
      writeFileSync(unsafe === "../escape.bin" ? join(dir, "..", "escape.bin") : unsafe, "outside");
      writeFileSync(timelinePath, JSON.stringify(timeline));
      expect(isCompleteTimeline(timelinePath, recordPath, expected), `unsafe path ${unsafe}`).toBe(false);
    }

    const outside = makeTemp("timeline-outside");
    writeFileSync(join(outside, "frame.bin"), "outside");
    const linkedFile = fixtureTimeline();
    linkedFile.frames[0].file = "linked-frame.bin";
    symlinkSync(join(outside, "frame.bin"), join(dir, "linked-frame.bin"));
    writeFileSync(timelinePath, JSON.stringify(linkedFile));
    expect(isCompleteTimeline(timelinePath, recordPath, expected), "symlink frame").toBe(false);

    const linkedParent = fixtureTimeline();
    linkedParent.frames[0].file = "linked-parent/frame.bin";
    symlinkSync(outside, join(dir, "linked-parent"), "dir");
    writeFileSync(timelinePath, JSON.stringify(linkedParent));
    expect(isCompleteTimeline(timelinePath, recordPath, expected), "symlinked parent directory").toBe(false);

    const cadenceMutations: Array<[string, (timeline: ReturnType<typeof fixtureTimeline>) => void]> = [
      ["missing frame zero", (timeline) => timeline.frames.shift()],
      ["missing cadence frame", (timeline) => timeline.frames.splice(2, 1)],
      ["duplicate tick", (timeline) => (timeline.frames[2].tick = timeline.frames[1].tick)],
      ["off-cadence interior tick", (timeline) => (timeline.frames[2].tick = 21)],
    ];
    for (const [label, mutate] of cadenceMutations) {
      const timeline = fixtureTimeline();
      mutate(timeline);
      writeFileSync(timelinePath, JSON.stringify(timeline));
      expect(isCompleteTimeline(timelinePath, recordPath, expected), label).toBe(false);
    }
  });
});

// ── workpack (review item: pack missing evidence-lib died ERR_MODULE_NOT_FOUND) ───────────

describe("workpack is self-contained", () => {
  it("builds a pack whose grow-batch resolves and dry-runs from inside the pack", () => {
    const packDir = join(makeTemp("workpack"), "pack");
    execFileSync(process.execPath, [join(REPO, "scripts", "gutcheck-make-workpack.mjs"), "--out", packDir], {
      encoding: "utf8",
    });
    // The generated launch command must keep records inside the pack's results tree.
    const run = readFileSync(join(packDir, "RUN.cmd"), "utf8");
    expect(run).toContain("--records-dir results/gen");
    // The review's exact failure: grow-batch's import graph must resolve inside the pack.
    const dryRun = spawnSync(
      process.execPath,
      [
        join("scripts", "gutcheck-grow-batch.mjs"),
        "--specs-dir", "specs",
        "--out-root", "results",
        "--records-dir", "results/gen",
        "--dry-run",
      ],
      { cwd: packDir, encoding: "utf8" },
    );
    expect(dryRun.status, String(dryRun.stderr)).toBe(0);
    expect(dryRun.stdout).toMatch(/spec\(s\) to grow/);
  }, 120_000);

  it("uses canonical invocation identity when deciding whether a fake-repo spec is already done", () => {
    const root = makeTemp("fake-workpack-repo");
    mkdirSync(join(root, "scripts"), { recursive: true });
    cpSync(join(REPO, "core", "src"), join(root, "core", "src"), { recursive: true });
    cpSync(join(REPO, "solver-cpu", "src"), join(root, "solver-cpu", "src"), { recursive: true });
    for (const file of [
      "gutcheck-make-workpack.mjs",
      "gutcheck-grow-params.ts",
      "gutcheck-mesh-lib.ts",
      "gutcheck-grow-batch.mjs",
      "gutcheck-evidence-lib.ts",
    ]) {
      cpSync(join(REPO, "scripts", file), join(root, "scripts", file));
    }

    const specsDir = join(root, "evidence", "gutcheck-gg-realism", "specs");
    const recordsDir = join(root, "evidence", "gutcheck-gg-realism", "gen-records");
    const recordPath = join(recordsDir, "t1-record.json");
    const timelinePath = join(root, "out", "gutcheck-gg-realism", "large", "anim", "t1", "manifest.json");
    mkdirSync(specsDir, { recursive: true });
    mkdirSync(recordsDir, { recursive: true });
    writeFileSync(join(specsDir, "t1.json"), JSON.stringify(FIXTURE_SPEC));
    writeFileSync(recordPath, JSON.stringify(fixtureRecord()));
    writeFixtureTimeline(timelinePath);

    const makePack = (out: string) =>
      spawnSync(
        process.execPath,
        [
          join(root, "scripts", "gutcheck-make-workpack.mjs"),
          "--out", out,
          "--only", "t1",
          "--dims", "500,500,96",
          "--ticks", "30000",
          "--frames-every", "10",
          "--spacing", "0.6",
        ],
        { cwd: root, encoding: "utf8" },
      );

    const matchingPack = join(root, "packs", "matching");
    const matching = makePack(matchingPack);
    expect(matching.status, String(matching.stderr)).toBe(0);
    expect(matching.stdout).toMatch(/0 specs packed, 1 skipped/);
    expect(existsSync(join(matchingPack, "specs", "t1.json"))).toBe(false);

    const staleRecord = fixtureRecord();
    staleRecord.dims.nz = 95;
    writeFileSync(recordPath, JSON.stringify(staleRecord));
    const stalePack = join(root, "packs", "stale");
    const stale = makePack(stalePack);
    expect(stale.status, String(stale.stderr)).toBe(0);
    expect(stale.stdout).toMatch(/1 specs packed/);
    expect(existsSync(join(stalePack, "specs", "t1.json"))).toBe(true);
  }, 120_000);
});

// ── archive inventory (review item: sparse local tree reduced 1,640 entries to 1) ─────────

describe("archive-pack ledger semantics", () => {
  const PACK = join(REPO, "scripts", "gutcheck-archive-pack.ts");
  const PRESENT_BYTES = "bytes-here";
  const PRESENT_SHA = createHash("sha256").update(PRESENT_BYTES).digest("hex");

  const fixture = (opts?: { presentSha?: string; withAbsent?: boolean }): { outRoot: string; inventoryPath: string } => {
    const root = makeTemp("sparse");
    const outRoot = join(root, "out-tree");
    mkdirSync(join(outRoot, "large", "meshes"), { recursive: true });
    writeFileSync(join(outRoot, "large", "meshes", "present.bin"), PRESENT_BYTES);
    const inventoryPath = join(root, "inventory.json");
    const files = [
      { relPath: "meshes/present.bin", group: "meshes", bytes: 10, mtimeMs: 0, sha256: opts?.presentSha ?? PRESENT_SHA },
      ...(opts?.withAbsent === false
        ? []
        : [{ relPath: "anim-B/absent-frame.bin", group: "anim-B", bytes: 999, mtimeMs: 0, sha256: "2".repeat(64) }]),
    ];
    writeFileSync(
      inventoryPath,
      JSON.stringify(
        {
          format: "gutcheck-large-inventory-v1",
          generated: "2026-08-01T00:00:00.000Z",
          root: "out/gutcheck-gg-realism/large",
          files,
          archives: [],
        },
        null,
        1,
      ),
    );
    return { outRoot, inventoryPath };
  };

  const runPack = (
    outRoot: string,
    inventoryPath: string,
    extra: string[] = [],
    envExtra: NodeJS.ProcessEnv = {},
  ) =>
    spawnSync(process.execPath, [PACK, ...extra], {
      encoding: "utf8",
      env: {
        ...process.env,
        GUTCHECK_OUT_ROOT: outRoot,
        GUTCHECK_INVENTORY: inventoryPath,
        ...envExtra,
      },
    });

  interface InventoryShape {
    files: Array<{ relPath: string; sha256: string }>;
    archives: Array<{
      name: string;
      group: string;
      sha256: string;
      fileCount: number;
      memberListSha256?: string;
    }>;
  }

  it("accepts only portable, line-safe archive member names", () => {
    for (const path of ["large/meshes/a.bin", "root.json", "large/meshes/"]) {
      expect(archiveEntryPathIsSafe(path), path).toBe(true);
    }
    for (const path of [
      "/absolute",
      "../escape",
      "large/../escape",
      "large//double",
      "./relative",
      "C:/absolute/path",
      "file:stream",
      "back\\slash",
      "line\nbreak",
      "question?.bin",
      "trailing-dot.",
      "trailing-space ",
      "large/NUL.txt",
      "large/com1",
    ]) {
      expect(archiveEntryPathIsSafe(path), path).toBe(false);
    }
  });

  it("preserves ledger entries whose files are absent locally (round-1 repro)", () => {
    const { outRoot, inventoryPath } = fixture();
    const result = runPack(outRoot, inventoryPath);
    expect(result.status, String(result.stderr)).toBe(0);
    expect(`${result.stdout}`).toMatch(/1 ledger entr\(ies\) have no local file/);
    const inventory = JSON.parse(readFileSync(inventoryPath, "utf8")) as InventoryShape;
    const paths = inventory.files.map((f) => f.relPath).sort();
    expect(paths).toEqual(["anim-B/absent-frame.bin", "meshes/present.bin"]);
    expect(inventory.files.find((f) => f.relPath === "anim-B/absent-frame.bin")?.sha256).toBe("2".repeat(64));
    expect(inventory.files.find((f) => f.relPath === "meshes/present.bin")?.sha256).toBe(PRESENT_SHA);
  });

  it("--replace-inventory drops absent entries, and says so", () => {
    const { outRoot, inventoryPath } = fixture();
    const result = runPack(outRoot, inventoryPath, ["--replace-inventory"]);
    expect(result.status, String(result.stderr)).toBe(0);
    expect(`${result.stdout}${result.stderr}`).toMatch(/dropping 1 ledger entr/);
    const inventory = JSON.parse(readFileSync(inventoryPath, "utf8")) as InventoryShape;
    expect(inventory.files.map((f) => f.relPath)).toEqual(["meshes/present.bin"]);
  });

  it("reports a changed local digest instead of adopting it; --refresh adopts (round-2)", () => {
    const { outRoot, inventoryPath } = fixture({ presentSha: "1".repeat(64) });
    const before = readFileSync(inventoryPath, "utf8");
    const verify = runPack(outRoot, inventoryPath);
    expect(verify.status).not.toBe(0);
    expect(String(verify.stderr)).toMatch(/disagree with the ledger/);
    expect(readFileSync(inventoryPath, "utf8"), "verification must not write").toBe(before);
    const refresh = runPack(outRoot, inventoryPath, ["--refresh"]);
    expect(refresh.status, String(refresh.stderr)).toBe(0);
    const inventory = JSON.parse(readFileSync(inventoryPath, "utf8")) as InventoryShape;
    expect(inventory.files.find((f) => f.relPath === "meshes/present.bin")?.sha256).toBe(PRESENT_SHA);
  });

  it("hashes bytes even when corrupt content preserves size and mtime", () => {
    const { outRoot, inventoryPath } = fixture({ withAbsent: false });
    const local = join(outRoot, "large", "meshes", "present.bin");
    const stableTime = new Date("2026-08-01T00:00:00.000Z");
    utimesSync(local, stableTime, stableTime);
    const originalStat = statSync(local);
    const inventory = JSON.parse(readFileSync(inventoryPath, "utf8")) as {
      files: Array<{ mtimeMs: number }>;
    };
    inventory.files[0]!.mtimeMs = originalStat.mtimeMs;
    writeFileSync(inventoryPath, JSON.stringify(inventory));
    writeFileSync(local, "other-byte"); // same ten bytes as PRESENT_BYTES
    utimesSync(local, originalStat.atime, originalStat.mtime);
    expect(statSync(local).size).toBe(originalStat.size);
    expect(statSync(local).mtimeMs).toBe(originalStat.mtimeMs);

    const before = readFileSync(inventoryPath, "utf8");
    const result = runPack(outRoot, inventoryPath);
    expect(result.status).not.toBe(0);
    expect(String(result.stderr)).toMatch(/changed bytes/);
    expect(readFileSync(inventoryPath, "utf8")).toBe(before);
  });

  it("refuses an unledgered local file unless --refresh explicitly adopts it", () => {
    const { outRoot, inventoryPath } = fixture({ withAbsent: false });
    writeFileSync(join(outRoot, "large", "meshes", "new.bin"), "new");
    const before = readFileSync(inventoryPath, "utf8");
    const verify = runPack(outRoot, inventoryPath);
    expect(verify.status).not.toBe(0);
    expect(String(verify.stderr)).toMatch(/unledgered local files/);
    expect(readFileSync(inventoryPath, "utf8")).toBe(before);

    const refresh = runPack(outRoot, inventoryPath, ["--refresh"]);
    expect(refresh.status, String(refresh.stderr)).toBe(0);
    const inventory = JSON.parse(readFileSync(inventoryPath, "utf8")) as InventoryShape;
    expect(inventory.files.map((entry) => entry.relPath).sort()).toEqual([
      "meshes/new.bin",
      "meshes/present.bin",
    ]);
  });

  it("fails closed on malformed, wrong-format, and absent priors (round-2)", () => {
    const { outRoot, inventoryPath } = fixture();
    writeFileSync(inventoryPath, '{"format": "gutcheck-large-inv'); // truncated
    const malformed = runPack(outRoot, inventoryPath);
    expect(malformed.status).not.toBe(0);
    expect(String(malformed.stderr)).toMatch(/not valid JSON/);
    expect(readFileSync(inventoryPath, "utf8")).toBe('{"format": "gutcheck-large-inv'); // untouched

    writeFileSync(inventoryPath, JSON.stringify({ format: "something-else", files: [] }));
    const wrongFormat = runPack(outRoot, inventoryPath);
    expect(wrongFormat.status).not.toBe(0);
    expect(String(wrongFormat.stderr)).toMatch(/unrecognized format/);

    rmSync(inventoryPath);
    const absent = runPack(outRoot, inventoryPath);
    expect(absent.status).not.toBe(0);
    expect(String(absent.stderr)).toMatch(/--init-inventory/);
    const init = runPack(outRoot, inventoryPath, ["--init-inventory"]);
    expect(init.status, String(init.stderr)).toBe(0);
    const inventory = JSON.parse(readFileSync(inventoryPath, "utf8")) as InventoryShape;
    expect(inventory.files.map((f) => f.relPath)).toEqual(["meshes/present.bin"]);
  });

  it.skipIf(!CAN_SYMLINK)("refuses to inventory a symlink in the archive tree (round-2)", () => {
    const { outRoot, inventoryPath } = fixture();
    const outside = makeTemp("outside");
    writeFileSync(join(outside, "secret.txt"), "secret");
    symlinkSync(join(outside, "secret.txt"), join(outRoot, "large", "meshes", "leak"));
    const result = runPack(outRoot, inventoryPath);
    expect(result.status).not.toBe(0);
    expect(String(result.stderr)).toMatch(/symlink/);
  });

  it.skipIf(!CAN_SYMLINK)("refuses a symlink used as the large-tree root", () => {
    const { outRoot, inventoryPath } = fixture({ withAbsent: false });
    const outside = makeTemp("large-root-outside");
    mkdirSync(join(outside, "meshes"));
    writeFileSync(join(outside, "meshes", "secret.bin"), "outside-secret");
    rmSync(join(outRoot, "large"), { recursive: true });
    symlinkSync(outside, join(outRoot, "large"), "dir");
    const before = readFileSync(inventoryPath, "utf8");
    const result = runPack(outRoot, inventoryPath, ["--refresh", "--pack", "meshes"]);
    expect(result.status).not.toBe(0);
    expect(String(result.stderr)).toMatch(/large artifact root must be a real directory/);
    expect(readFileSync(inventoryPath, "utf8")).toBe(before);
    expect(existsSync(join(outRoot, "archives"))).toBe(false);
  });

  it("rejects inventory names that alias on Windows", () => {
    const { outRoot, inventoryPath } = fixture({ withAbsent: false });
    const inventory = JSON.parse(readFileSync(inventoryPath, "utf8")) as {
      files: Array<Record<string, unknown>>;
    };
    inventory.files.push({
      relPath: "meshes/Present.bin",
      group: "meshes",
      bytes: 1,
      mtimeMs: 0,
      sha256: "3".repeat(64),
    });
    writeFileSync(inventoryPath, JSON.stringify(inventory));
    const before = readFileSync(inventoryPath, "utf8");
    const result = runPack(outRoot, inventoryPath);
    expect(result.status).not.toBe(0);
    expect(String(result.stderr)).toMatch(/collide on a supported host/);
    expect(readFileSync(inventoryPath, "utf8")).toBe(before);
  });

  it("refuses to pack a group with absent ledger entries, leaving existing archives intact (round-2)", () => {
    const { outRoot, inventoryPath } = fixture(); // anim-B has an absent entry
    const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const priorZip = join(outRoot, "archives", `gutcheck-large-anim-B-${stamp}.zip`);
    mkdirSync(join(outRoot, "archives"), { recursive: true });
    writeFileSync(priorZip, "pretend-good-archive");
    const result = runPack(outRoot, inventoryPath, ["--pack", "anim-B"]);
    expect(result.status).not.toBe(0);
    expect(String(result.stderr)).toMatch(/not restored locally/);
    expect(readFileSync(priorZip, "utf8"), "existing archive must survive the refusal").toBe("pretend-good-archive");
  });

  // zip/unzip binaries ship with macOS; the Windows exec host grows crystals but does not
  // pack archives (all packs to date were made on macOS — docs/nas-ledger.md).
  it.skipIf(process.platform === "win32")("packs a group from the explicit member list (round-2 repro: --pack meshes)", () => {
    const { outRoot, inventoryPath } = fixture({ withAbsent: false });
    const emptyPath = join(outRoot, "large", "meshes", "empty.bin");
    writeFileSync(emptyPath, "");
    const before = JSON.parse(readFileSync(inventoryPath, "utf8")) as {
      files: Array<Record<string, unknown>>;
    };
    before.files.push({
      relPath: "meshes/empty.bin",
      group: "meshes",
      bytes: 0,
      mtimeMs: statSync(emptyPath).mtimeMs,
      sha256: createHash("sha256").update("").digest("hex"),
    });
    writeFileSync(inventoryPath, JSON.stringify(before));
    const result = runPack(outRoot, inventoryPath, ["--pack", "meshes"]);
    expect(result.status, String(result.stderr)).toBe(0);
    const inventory = JSON.parse(readFileSync(inventoryPath, "utf8")) as InventoryShape;
    const archive = inventory.archives[0]!;
    expect(archive.name).toMatch(new RegExp(`^gutcheck-large-meshes-\\d{8}-${archive.sha256}\\.zip$`));
    expect(archive.memberListSha256).toBe(
      archiveMemberListSha256(["large/meshes/empty.bin", "large/meshes/present.bin"]),
    );
    const zipPath = join(outRoot, "archives", archive.name);
    expect(existsSync(zipPath)).toBe(true);
    const listing = execFileSync("unzip", ["-Z1", zipPath], { encoding: "utf8" }).trim().split("\n").sort();
    expect(listing).toEqual(["large/meshes/empty.bin", "large/meshes/present.bin"]);
    expect(archive.fileCount).toBe(2);
  });

  it.skipIf(process.platform === "win32")(
    "never overwrites a pre-existing content-addressed archive",
    () => {
      const { outRoot, inventoryPath } = fixture({ withAbsent: false });
      const first = runPack(outRoot, inventoryPath, ["--pack", "meshes"]);
      expect(first.status, String(first.stderr)).toBe(0);
      const inventory = JSON.parse(readFileSync(inventoryPath, "utf8")) as InventoryShape;
      const archivePath = join(outRoot, "archives", inventory.archives[0]!.name);
      writeFileSync(archivePath, "CORRUPT-PREEXISTING-BYTES");
      const ledgerBefore = readFileSync(inventoryPath, "utf8");

      const second = runPack(outRoot, inventoryPath, ["--pack", "meshes"]);
      expect(second.status).not.toBe(0);
      expect(String(second.stderr)).toMatch(/EEXIST/);
      expect(readFileSync(archivePath, "utf8")).toBe("CORRUPT-PREEXISTING-BYTES");
      expect(readFileSync(inventoryPath, "utf8")).toBe(ledgerBefore);
    },
  );

  it.skipIf(process.platform === "win32")(
    "serializes overlapping group packs so neither archive ledger row is lost",
    async () => {
      const { outRoot, inventoryPath } = fixture({ withAbsent: false });
      const animBytes = "frame-bytes";
      const animPath = join(outRoot, "large", "anim-B", "frame.bin");
      mkdirSync(dirname(animPath), { recursive: true });
      writeFileSync(animPath, animBytes);
      const inventory = JSON.parse(readFileSync(inventoryPath, "utf8")) as {
        files: Array<Record<string, unknown>>;
      };
      inventory.files.push({
        relPath: "anim-B/frame.bin",
        group: "anim-B",
        bytes: Buffer.byteLength(animBytes),
        mtimeMs: statSync(animPath).mtimeMs,
        sha256: createHash("sha256").update(animBytes).digest("hex"),
      });
      writeFileSync(inventoryPath, JSON.stringify(inventory));

      const wrapperDir = makeTemp("zip-lock-wrapper");
      const entered = join(wrapperDir, "entered");
      const release = join(wrapperDir, "release");
      const wrapper = join(wrapperDir, "zip");
      writeFileSync(
        wrapper,
        `#!/usr/bin/env node\n` +
          `const fs = require("node:fs");\n` +
          `const cp = require("node:child_process");\n` +
          `fs.writeFileSync(process.env.GUTCHECK_LOCK_ENTERED, "entered");\n` +
          `while (!fs.existsSync(process.env.GUTCHECK_LOCK_RELEASE)) ` +
          `Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 10);\n` +
          `const result = cp.spawnSync(process.env.GUTCHECK_REAL_ZIP, process.argv.slice(2), { stdio: "inherit" });\n` +
          `process.exit(result.status ?? 1);\n`,
      );
      chmodSync(wrapper, 0o755);
      const realZip = execFileSync("which", ["zip"], { encoding: "utf8" }).trim();
      const baseEnv = {
        ...process.env,
        GUTCHECK_OUT_ROOT: outRoot,
        GUTCHECK_INVENTORY: inventoryPath,
      };
      const first = spawn(process.execPath, [PACK, "--pack", "meshes"], {
        env: {
          ...baseEnv,
          PATH: `${wrapperDir}:${process.env.PATH ?? ""}`,
          GUTCHECK_LOCK_ENTERED: entered,
          GUTCHECK_LOCK_RELEASE: release,
          GUTCHECK_REAL_ZIP: realZip,
        },
        stdio: ["ignore", "pipe", "pipe"],
      });
      let firstStderr = "";
      first.stderr.setEncoding("utf8");
      first.stderr.on("data", (chunk: string) => { firstStderr += chunk; });
      await waitFor(() => existsSync(entered), "first archive pack to enter zip");

      const second = spawn(process.execPath, [PACK, "--pack", "anim-B"], {
        env: baseEnv,
        stdio: ["ignore", "pipe", "pipe"],
      });
      let secondStderr = "";
      second.stderr.setEncoding("utf8");
      second.stderr.on("data", (chunk: string) => { secondStderr += chunk; });
      await new Promise((resolvePromise) => setTimeout(resolvePromise, 150));
      expect(second.exitCode, "second pack must still be waiting for the inventory lock").toBeNull();
      writeFileSync(release, "release");

      const waitExit = (child: ReturnType<typeof spawn>): Promise<number | null> =>
        new Promise((resolvePromise, rejectPromise) => {
          child.once("error", rejectPromise);
          child.once("exit", (code) => resolvePromise(code));
        });
      const [firstCode, secondCode] = await Promise.all([waitExit(first), waitExit(second)]);
      expect(firstCode, firstStderr).toBe(0);
      expect(secondCode, secondStderr).toBe(0);
      const finalInventory = JSON.parse(readFileSync(inventoryPath, "utf8")) as InventoryShape;
      expect(finalInventory.archives.map((entry) => entry.group).sort()).toEqual(["anim-B", "meshes"]);
    },
    15_000,
  );

  it.skipIf(process.platform === "win32")(
    "rejects a source mutation between scan and zip, publishing neither ledger nor archive",
    () => {
      const { outRoot, inventoryPath } = fixture({ withAbsent: false });
      const wrapperDir = makeTemp("zip-wrapper");
      const wrapper = join(wrapperDir, "zip");
      writeFileSync(
        wrapper,
        `#!/usr/bin/env node\n` +
          `const fs = require("node:fs");\n` +
          `const cp = require("node:child_process");\n` +
          `fs.writeFileSync(process.env.GUTCHECK_MUTATE_PATH, "other-byte");\n` +
          `const result = cp.spawnSync(process.env.GUTCHECK_REAL_ZIP, process.argv.slice(2), { stdio: "inherit" });\n` +
          `process.exit(result.status ?? 1);\n`,
      );
      chmodSync(wrapper, 0o755);
      const archivesDir = join(outRoot, "archives");
      mkdirSync(archivesDir, { recursive: true });
      writeFileSync(join(archivesDir, "keep.zip"), "published-before-test");
      const before = readFileSync(inventoryPath, "utf8");
      const realZip = execFileSync("which", ["zip"], { encoding: "utf8" }).trim();
      const result = runPack(outRoot, inventoryPath, ["--pack", "meshes"], {
        PATH: `${wrapperDir}:${process.env.PATH ?? ""}`,
        GUTCHECK_MUTATE_PATH: join(outRoot, "large", "meshes", "present.bin"),
        GUTCHECK_REAL_ZIP: realZip,
      });
      expect(result.status).not.toBe(0);
      expect(String(result.stderr)).toMatch(/archive payload mismatch/);
      expect(readFileSync(inventoryPath, "utf8")).toBe(before);
      expect(readFileSync(join(archivesDir, "keep.zip"), "utf8")).toBe("published-before-test");
      expect(readdirSync(archivesDir)).toEqual(["keep.zip"]);
    },
  );

  it.skipIf(process.platform === "win32")("allows --replace-inventory to redefine and pack a sparse group", () => {
    const { outRoot, inventoryPath } = fixture();
    const result = runPack(outRoot, inventoryPath, ["--replace-inventory", "--pack", "meshes"]);
    expect(result.status, String(result.stderr)).toBe(0);
    const inventory = JSON.parse(readFileSync(inventoryPath, "utf8")) as InventoryShape;
    expect(inventory.files.map((entry) => entry.relPath)).toEqual(["meshes/present.bin"]);
    expect(inventory.archives).toHaveLength(1);
    expect(existsSync(join(outRoot, "archives", inventory.archives[0]!.name))).toBe(true);
  });
});

// ── restore refuses partial archives (round-2: sparse completeness) ───────────────────────

describe("archive-restore authenticated membership and placement", () => {
  const RESTORE = join(REPO, "scripts", "gutcheck-archive-restore.ts");
  const makeRestoreFixture = (
    actualMembers: readonly string[],
    allFiles: Readonly<Record<string, string>>,
    archiveGroup: string,
    declaredMembers: readonly string[] | null = actualMembers,
  ) => {
    const root = makeTemp("restore-members");
    for (const [path, bytes] of Object.entries(allFiles)) {
      mkdirSync(dirname(join(root, path)), { recursive: true });
      writeFileSync(join(root, path), bytes);
    }
    const zipPath = join(root, "fixture.zip");
    execFileSync("zip", ["-q", zipPath, ...actualMembers], { cwd: root });
    const zipBytes = readFileSync(zipPath);
    const inventoryPath = join(root, "inventory.json");
    const files = Object.entries(allFiles).map(([path, bytes]) => ({
      relPath: path.startsWith("large/") ? path.slice("large/".length) : path,
      ...(path.startsWith("large/") ? {} : { root: "out" as const }),
      bytes: Buffer.byteLength(bytes),
      sha256: createHash("sha256").update(bytes).digest("hex"),
    }));
    writeFileSync(
      inventoryPath,
      JSON.stringify({
        format: "gutcheck-large-inventory-v1",
        files,
        archives: [
          {
            name: basename(zipPath),
            group: archiveGroup,
            sha256: createHash("sha256").update(zipBytes).digest("hex"),
            bytes: zipBytes.length,
            fileCount: actualMembers.length,
            totalBytes: actualMembers.reduce((sum, path) => sum + Buffer.byteLength(allFiles[path]!), 0),
            ...(declaredMembers === null
              ? {}
              : { memberListSha256: archiveMemberListSha256(declaredMembers) }),
          },
        ],
      }),
    );
    const run = (dest: string) =>
      spawnSync(process.execPath, [RESTORE, zipPath, "--dest", dest], {
        encoding: "utf8",
        env: { ...process.env, GUTCHECK_INVENTORY: inventoryPath },
      });
    return { root, zipPath, inventoryPath, run };
  };

  it.skipIf(process.platform === "win32")("fails when the zip holds fewer files than the ledger declares", () => {
    const root = makeTemp("restore");
    mkdirSync(join(root, "large", "meshes"), { recursive: true });
    writeFileSync(join(root, "large", "meshes", "present.bin"), "bytes-here");
    const zipPath = join(root, "one-file.zip");
    execFileSync("zip", ["-q", zipPath, "large/meshes/present.bin"], { cwd: root });
    const zipSha = createHash("sha256").update(readFileSync(zipPath)).digest("hex");
    const inventoryPath = join(root, "inventory.json");
    writeFileSync(
      inventoryPath,
      JSON.stringify({
        format: "gutcheck-large-inventory-v1",
        files: [],
        archives: [{ name: "one-file.zip", group: "meshes", sha256: zipSha, bytes: 1, fileCount: 2, totalBytes: 2 }],
      }),
    );
    const result = spawnSync(
      process.execPath,
      [join(REPO, "scripts", "gutcheck-archive-restore.ts"), zipPath, "--dest", join(root, "dest")],
      { encoding: "utf8", env: { ...process.env, GUTCHECK_INVENTORY: inventoryPath } },
    );
    expect(result.status).not.toBe(0);
    expect(`${result.stdout}${result.stderr}`).toMatch(/declares/);
  });

  it.skipIf(process.platform === "win32")(
    "rejects a same-group, same-count member substitution before creating the destination",
    () => {
      const expected = ["large/meshes/a.bin", "large/meshes/b.bin"];
      const actual = ["large/meshes/a.bin", "large/meshes/c.bin"];
      const fixture = makeRestoreFixture(
        actual,
        {
          "large/meshes/a.bin": "a",
          "large/meshes/b.bin": "b",
          "large/meshes/c.bin": "c",
        },
        "meshes",
        expected,
      );
      const dest = join(fixture.root, "dest");
      const result = fixture.run(dest);
      expect(result.status).not.toBe(0);
      expect(`${result.stdout}${result.stderr}`).toMatch(/member-list mismatch/);
      expect(existsSync(dest)).toBe(false);
    },
  );

  it.skipIf(process.platform === "win32")("rejects a cross-group substitution before extraction", () => {
    const actual = ["large/meshes/a.bin", "large/anim/frame.bin"];
    const fixture = makeRestoreFixture(
      actual,
      { "large/meshes/a.bin": "a", "large/anim/frame.bin": "frame" },
      "meshes",
    );
    const dest = join(fixture.root, "dest");
    const result = fixture.run(dest);
    expect(result.status).not.toBe(0);
    expect(`${result.stdout}${result.stderr}`).toMatch(/ledgered as group "meshes"/);
    expect(existsSync(dest)).toBe(false);
  });

  it.skipIf(process.platform === "win32")(
    "restores a legacy ledgered archive without exact-member metadata, with an explicit warning",
    () => {
      const member = "large/meshes/present.bin";
      const fixture = makeRestoreFixture([member], { [member]: "bytes-here" }, "meshes", null);
      const dest = join(fixture.root, "dest-legacy");
      const result = fixture.run(dest);
      expect(result.status, `${String(result.stdout)}\n${String(result.stderr)}`).toBe(0);
      expect(String(result.stderr)).toMatch(/legacy ledger entry without memberListSha256/);
      expect(readFileSync(join(dest, member), "utf8")).toBe("bytes-here");
    },
  );

  it.skipIf(process.platform === "win32")("rejects duplicate archive members before extraction", () => {
    const root = makeTemp("restore-duplicates");
    const zipPath = join(root, "duplicates.zip");
    writeFileSync(zipPath, storedZip([
      { name: "x.bin", value: Buffer.from("x") },
      { name: "x.bin", value: Buffer.from("x") },
    ]));
    const zipBytes = readFileSync(zipPath);
    const inventoryPath = join(root, "inventory.json");
    writeFileSync(
      inventoryPath,
      JSON.stringify({
        format: "gutcheck-large-inventory-v1",
        files: [
          {
            relPath: "x.bin",
            root: "out",
            bytes: 1,
            sha256: createHash("sha256").update("x").digest("hex"),
          },
        ],
        archives: [
          {
            name: "duplicates.zip",
            group: "extras",
            sha256: createHash("sha256").update(zipBytes).digest("hex"),
            bytes: zipBytes.length,
            fileCount: 2,
            totalBytes: 2,
            memberListSha256: archiveMemberListSha256(["x.bin", "x.bin"]),
          },
        ],
      }),
    );
    const dest = join(root, "dest");
    const result = spawnSync(process.execPath, [RESTORE, zipPath, "--dest", dest], {
      encoding: "utf8",
      env: { ...process.env, GUTCHECK_INVENTORY: inventoryPath },
    });
    expect(result.status).not.toBe(0);
    expect(`${result.stdout}${result.stderr}`).toMatch(/duplicate file entries/);
    expect(existsSync(dest)).toBe(false);
  });

  it.skipIf(process.platform === "win32")("rejects symlink archive members before extraction", () => {
    const root = makeTemp("restore-symlink-member");
    const zipPath = join(root, "symlink.zip");
    writeFileSync(zipPath, storedZip([
      { name: "link.bin", value: Buffer.from("outside"), externalAttributes: 0xa1ff0000 },
    ]));
    const zipBytes = readFileSync(zipPath);
    const inventoryPath = join(root, "inventory.json");
    writeFileSync(
      inventoryPath,
      JSON.stringify({
        format: "gutcheck-large-inventory-v1",
        files: [],
        archives: [{
          name: basename(zipPath),
          group: "extras",
          sha256: createHash("sha256").update(zipBytes).digest("hex"),
          bytes: zipBytes.length,
          fileCount: 1,
          totalBytes: 7,
          memberListSha256: archiveMemberListSha256(["link.bin"]),
        }],
      }),
    );
    const dest = join(root, "dest");
    const result = spawnSync(process.execPath, [RESTORE, zipPath, "--dest", dest], {
      encoding: "utf8",
      env: { ...process.env, GUTCHECK_INVENTORY: inventoryPath },
    });
    expect(result.status).not.toBe(0);
    expect(`${result.stdout}${result.stderr}`).toMatch(/non-regular entries/);
    expect(existsSync(dest)).toBe(false);
  });

  it.skipIf(process.platform === "win32")(
    "rejects archive member names that collide on Windows before extraction",
    () => {
      const members = ["large/meshes/Foo.bin", "large/meshes/foo.bin"];
      const fixture = makeRestoreFixture(
        members,
        { [members[0]!]: "upper", [members[1]!]: "lower" },
        "meshes",
      );
      const dest = join(fixture.root, "dest-case-alias");
      const result = fixture.run(dest);
      expect(result.status).not.toBe(0);
      expect(`${result.stdout}${result.stderr}`).toMatch(/collide on a supported host/);
      expect(existsSync(dest)).toBe(false);
    },
  );

  it.skipIf(process.platform === "win32")(
    "exits nonzero for an unledgered partial archive even when each present file verifies",
    () => {
      const root = makeTemp("restore-unledgered-partial");
      mkdirSync(join(root, "large", "meshes"), { recursive: true });
      writeFileSync(join(root, "large", "meshes", "a.bin"), "a");
      const zipPath = join(root, "partial.zip");
      execFileSync("zip", ["-q", zipPath, "large/meshes/a.bin"], { cwd: root });
      const inventoryPath = join(root, "inventory.json");
      writeFileSync(
        inventoryPath,
        JSON.stringify({
          format: "gutcheck-large-inventory-v1",
          files: ["a", "b"].map((name) => ({
            relPath: `meshes/${name}.bin`,
            bytes: 1,
            sha256: createHash("sha256").update(name).digest("hex"),
          })),
          archives: [],
        }),
      );
      const dest = join(root, "dest");
      const result = spawnSync(process.execPath, [RESTORE, zipPath, "--dest", dest], {
        encoding: "utf8",
        env: { ...process.env, GUTCHECK_INVENTORY: inventoryPath },
      });
      expect(result.status).not.toBe(0);
      expect(`${result.stdout}${result.stderr}`).toMatch(/archive-level UNVERIFIED/);
      expect(readFileSync(join(dest, "large", "meshes", "a.bin"), "utf8")).toBe("a");
      expect(existsSync(join(dest, "large", "meshes", "b.bin"))).toBe(false);
    },
  );

  it.skipIf(process.platform === "win32").each(["ancestor", "final"] as const)(
    "rejects an identical external target through a %s symlink instead of SKIP",
    (kind) => {
      const member = "large/meshes/present.bin";
      const bytes = "bytes-here";
      const fixture = makeRestoreFixture([member], { [member]: bytes }, "meshes");
      const dest = join(fixture.root, `dest-${kind}`);
      const outside = makeTemp(`restore-skip-${kind}`);
      mkdirSync(dest, { recursive: true });
      let externalTarget: string;
      if (kind === "ancestor") {
        mkdirSync(join(outside, "meshes"), { recursive: true });
        externalTarget = join(outside, "meshes", "present.bin");
        writeFileSync(externalTarget, bytes);
        symlinkSync(outside, join(dest, "large"), "dir");
      } else {
        mkdirSync(join(dest, "large", "meshes"), { recursive: true });
        externalTarget = join(outside, "present.bin");
        writeFileSync(externalTarget, bytes);
        symlinkSync(externalTarget, join(dest, member));
      }
      const result = fixture.run(dest);
      expect(result.status).not.toBe(0);
      expect(`${result.stdout}${result.stderr}`).toMatch(/destination component is a symlink/);
      expect(readFileSync(externalTarget, "utf8")).toBe(bytes);
    },
  );
});

// ── grow-batch resume predicate (round-2: complete timeline, no record, skipped forever) ──

describe("grow-batch frame-enabled resume", () => {
  const BATCH = join(REPO, "scripts", "gutcheck-grow-batch.mjs");

  const fixture = () => {
    const root = makeTemp("resume");
    const specsDir = join(root, "specs");
    const outRoot = join(root, "out-tree");
    const recordsDir = join(root, "records");
    const recordPath = join(recordsDir, "t1-record.json");
    const timelinePath = join(outRoot, "large", "anim", "t1", "manifest.json");
    mkdirSync(specsDir, { recursive: true });
    mkdirSync(recordsDir, { recursive: true });
    writeFileSync(join(specsDir, "t1.json"), JSON.stringify(FIXTURE_SPEC));
    writeFileSync(recordPath, JSON.stringify(fixtureRecord()));
    writeFixtureTimeline(timelinePath);
    return { specsDir, outRoot, recordsDir, recordPath, timelinePath };
  };

  const dryRun = ({ specsDir, outRoot, recordsDir }: ReturnType<typeof fixture>) =>
    spawnSync(
      process.execPath,
      [
        BATCH,
        "--specs-dir", specsDir,
        "--out-root", outRoot,
        "--records-dir", recordsDir,
        "--dims", "500,500,96",
        "--ticks", "30000",
        "--frames-every", "10",
        "--spacing", "0.6",
        "--dry-run",
      ],
      { encoding: "utf8" },
    );

  it("regrows a complete-marked timeline that has no record (the round-2 repro)", () => {
    const paths = fixture();
    rmSync(paths.recordPath);
    const result = dryRun(paths);
    expect(result.status, String(result.stderr)).toBe(0);
    expect(result.stdout).toMatch(/1 spec\(s\) to grow/);
    expect(result.stdout).toMatch(/would grow t1/);
  });

  it("skips only when the identity-matched record AND complete timeline both exist", () => {
    const paths = fixture();
    const result = dryRun(paths);
    expect(result.status, String(result.stderr)).toBe(0);
    expect(result.stdout).toMatch(/0 spec\(s\) to grow/);
  });

  it("does not skip wrong spec, dimensions, domain, ticks, seed, noise, extraction, cadence, or final tick", () => {
    const cases: Array<[string, (paths: ReturnType<typeof fixture>) => void]> = [
      ["spec", (paths) => {
        const record = fixtureRecord();
        record.spec.stages[0].rho = 0.6;
        writeFileSync(paths.recordPath, JSON.stringify(record));
      }],
      ["dimensions", (paths) => {
        const timeline = fixtureTimeline();
        timeline.config.dims.nx = 501;
        writeFixtureTimeline(paths.timelinePath, timeline);
      }],
      ["domain", (paths) => {
        const record = fixtureRecord();
        record.domain = "box";
        writeFileSync(paths.recordPath, JSON.stringify(record));
      }],
      ["ticks", (paths) => {
        const timeline = fixtureTimeline();
        timeline.config.ticks = 29_999;
        writeFixtureTimeline(paths.timelinePath, timeline);
      }],
      ["seed", (paths) => {
        const record = fixtureRecord();
        record.seed = 2;
        writeFileSync(paths.recordPath, JSON.stringify(record));
      }],
      ["noise", (paths) => {
        const timeline = fixtureTimeline();
        timeline.config.noise = 0.01;
        writeFixtureTimeline(paths.timelinePath, timeline);
      }],
      ["extraction", (paths) => {
        const record = fixtureRecord();
        record.mesh.extraction.spacing = 0.8;
        writeFileSync(paths.recordPath, JSON.stringify(record));
      }],
      ["cadence", (paths) => {
        const timeline = fixtureTimeline();
        timeline.config.every = 20;
        writeFixtureTimeline(paths.timelinePath, timeline);
      }],
      ["final tick", (paths) => {
        const timeline = fixtureTimeline();
        timeline.frames[timeline.frames.length - 1].tick = 94;
        writeFixtureTimeline(paths.timelinePath, timeline);
      }],
    ];

    for (const [label, mutate] of cases) {
      const paths = fixture();
      mutate(paths);
      const result = dryRun(paths);
      expect(result.status, `${label}: ${String(result.stderr)}`).toBe(0);
      expect(result.stdout, label).toMatch(/1 spec\(s\) to grow/);
      expect(result.stdout, label).toMatch(/would grow t1/);
    }
  });
});

describe("grow-batch startup manifest healing", () => {
  const fakeRepo = () => {
    const root = makeTemp("fake-batch-repo");
    mkdirSync(join(root, "scripts"), { recursive: true });
    cpSync(join(REPO, "scripts", "gutcheck-grow-batch.mjs"), join(root, "scripts", "gutcheck-grow-batch.mjs"));
    cpSync(join(REPO, "scripts", "gutcheck-evidence-lib.ts"), join(root, "scripts", "gutcheck-evidence-lib.ts"));
    const evidenceRoot = join(root, "evidence", "gutcheck-gg-realism");
    const specsDir = join(evidenceRoot, "specs");
    const recordsDir = join(evidenceRoot, "gen-records");
    const outRoot = join(root, "out", "gutcheck-gg-realism");
    mkdirSync(specsDir, { recursive: true });
    mkdirSync(recordsDir, { recursive: true });
    writeFileSync(join(specsDir, "t1.json"), JSON.stringify(FIXTURE_SPEC));
    writeFileSync(join(recordsDir, "t1-record.json"), JSON.stringify(fixtureRecord()));
    writeFixtureTimeline(join(outRoot, "large", "anim", "t1", "manifest.json"));
    const manifestPath = join(root, "evidence", "MANIFEST.json");
    writeFileSync(manifestPath, JSON.stringify({ fileCount: 0, totalBytes: 0, files: {} }, null, 1) + "\n");
    return { root, outRoot, manifestPath };
  };

  const run = (paths: ReturnType<typeof fakeRepo>, dryRun: boolean) =>
    spawnSync(
      process.execPath,
      [
        join(paths.root, "scripts", "gutcheck-grow-batch.mjs"),
        "--out-root", paths.outRoot,
        "--dims", "500,500,96",
        "--ticks", "30000",
        "--frames-every", "10",
        "--spacing", "0.6",
        ...(dryRun ? ["--dry-run"] : []),
      ],
      { cwd: paths.root, encoding: "utf8" },
    );

  it("re-pins evidence on startup even when there are zero jobs", () => {
    const paths = fakeRepo();
    const result = run(paths, false);
    expect(result.status, String(result.stderr)).toBe(0);
    expect(result.stdout).toMatch(/0 spec\(s\) to grow/);
    const manifest = JSON.parse(readFileSync(paths.manifestPath, "utf8")) as { files: Record<string, unknown> };
    expect(manifest.files["gutcheck-gg-realism/specs/t1.json"]).toBeDefined();
    expect(manifest.files["gutcheck-gg-realism/gen-records/t1-record.json"]).toBeDefined();
  });

  it("keeps a zero-job dry run read-only with respect to the evidence manifest", () => {
    const paths = fakeRepo();
    const before = readFileSync(paths.manifestPath, "utf8");
    const result = run(paths, true);
    expect(result.status, String(result.stderr)).toBe(0);
    expect(result.stdout).toMatch(/0 spec\(s\) to grow/);
    expect(readFileSync(paths.manifestPath, "utf8")).toBe(before);
    expect(existsSync(`${paths.manifestPath}.lock`)).toBe(false);
  });
});
