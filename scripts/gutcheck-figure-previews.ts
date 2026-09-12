// Regenerate safe, project-owned selection thumbnails for the pre-sweep figure meshes.
// Historical side-by-side composites include restricted source media and are never read here.
//
//   node scripts/gutcheck-figure-previews.ts [--force] [--port 5184]

import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import {
  closeSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { basename, join, resolve } from "node:path";

import { chromium } from "playwright";

import {
  decideNasCatalogServePath,
  openContainedRegularFile,
  parseNasAssetCatalogV1,
} from "./nas-asset-lib.ts";
import { detectNasMount } from "./nas-root.ts";

const REPO = resolve(import.meta.dirname, "..");
const APP = join(REPO, "app");
const OUTPUT = join(REPO, "out/gutcheck-figure-previews");
const RECORDS = join(REPO, "evidence/gutcheck-gg-realism/fig-records");
const PUBLIC_ROOT = "collections/gutcheck-generated-public/2026-08-15/payload";
const CATALOG = parseNasAssetCatalogV1(readFileSync(join(REPO, "docs/nas-assets.json"), "utf8"));
const VITE = join(REPO, "node_modules/vite/bin/vite.js");

const argv = process.argv.slice(2);
const force = argv.includes("--force");
const portAt = argv.indexOf("--port");
const port = Number(portAt < 0 ? "5184" : argv[portAt + 1]);
const recognized = new Set(["--force", "--port", ...(portAt < 0 ? [] : [argv[portAt + 1] as string])]);
if (argv.some((argument) => !recognized.has(argument)) || !Number.isInteger(port) || port < 1024 || port > 65_535) {
  throw new Error("usage: node scripts/gutcheck-figure-previews.ts [--force] [--port 5184]");
}

const ids = readdirSync(RECORDS)
  .map((name) => /^((?:fig)\d+(?:v\d+)?)-record\.json$/u.exec(name)?.[1])
  .filter((id): id is string => id !== undefined)
  .sort((left, right) => left.localeCompare(right, undefined, { numeric: true }));

const waitForServer = async (url: string): Promise<void> => {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    try {
      if ((await fetch(url)).ok) return;
    } catch {
      // Vite is still starting.
    }
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 200));
  }
  throw new Error(`preview Vite server did not answer within 30 seconds at ${url}`);
};

const sha256 = (bytes: Buffer): string => createHash("sha256").update(bytes).digest("hex");

const main = async (): Promise<void> => {
  const nasRoot = detectNasMount();
  if (nasRoot === null) throw new Error("the marked NAS share is not attached");
  mkdirSync(OUTPUT, { recursive: true });
  const server = spawn(
    process.execPath,
    [VITE, "--host", "127.0.0.1", "--port", String(port), "--strictPort"],
    { cwd: APP, stdio: ["ignore", "ignore", "inherit"] },
  );
  let browser: Awaited<ReturnType<typeof chromium.launch>> | null = null;
  const entries: Array<Record<string, unknown>> = [];
  try {
    await waitForServer(`http://127.0.0.1:${port}/spike-gg-realism.html`);
    browser = await chromium.launch({
      headless: true,
      args: process.platform === "darwin"
        ? ["--enable-unsafe-webgpu", "--use-angle=metal"]
        : ["--enable-unsafe-webgpu"],
    });
    for (const id of ids) {
      const logicalMesh = `${PUBLIC_ROOT}/large/figs/${id}-mesh.bin`;
      const decision = decideNasCatalogServePath(CATALOG, logicalMesh);
      if (decision.kind !== "allow") throw new Error(`${id}: public mesh is not catalogue-authorized`);
      const opened = openContainedRegularFile(nasRoot, logicalMesh, decision.matchedPrefix);
      if (opened.kind !== "ok") throw new Error(`${id}: public mesh cannot be opened: ${opened.reason}`);
      let mesh: Buffer;
      try {
        mesh = readFileSync(opened.fd);
      } finally {
        closeSync(opened.fd);
      }
      const output = join(OUTPUT, `${id}.png`);
      if (force || !statExists(output)) {
        const page = await browser.newPage({ viewport: { width: 640, height: 640 }, deviceScaleFactor: 1 });
        try {
          await page.route("**/gutcheck-mesh.bin", (route) =>
            route.fulfill({ body: mesh, contentType: "application/octet-stream" }),
          );
          await page.goto(`http://127.0.0.1:${port}/spike-gg-realism.html?look=glass`, {
            waitUntil: "load",
          });
          await page.waitForFunction(
            () => window.__spikeReady === true || window.__spikeError !== undefined,
            undefined,
            { timeout: 120_000 },
          );
          const pageError = await page.evaluate(() => window.__spikeError);
          if (pageError !== undefined) throw new Error(`${id}: viewer reported ${String(pageError)}`);
          await page.screenshot({ path: output, type: "png" });
        } finally {
          await page.close();
        }
        console.log(`wrote ${basename(output)}`);
      } else {
        console.log(`kept ${basename(output)}`);
      }
      const preview = readFileSync(output);
      entries.push({
        id,
        sourceMesh: `/nas/${logicalMesh}`,
        sourceMeshBytes: mesh.byteLength,
        preview: `${id}.png`,
        previewBytes: preview.byteLength,
        previewSha256: sha256(preview),
      });
    }
    writeFileSync(join(OUTPUT, "manifest.json"), `${JSON.stringify({
      format: "gutcheck-figure-previews-v1",
      generatedAt: new Date().toISOString(),
      renderer: "spike-gg-realism glass, 640x640",
      sourcePolicy: "public final meshes only; historical comparison composites not read",
      entries,
    }, null, 1)}\n`);
    console.log(`figure previews: ${entries.length}`);
  } finally {
    if (browser !== null) await browser.close();
    server.kill("SIGTERM");
  }
};

const statExists = (path: string): boolean => {
  try {
    return statSync(path).isFile() && statSync(path).size > 0;
  } catch {
    return false;
  }
};

await main();
