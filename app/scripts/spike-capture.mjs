// Gut-check spike capture (docs/plans/explore-gg-realism-gutcheck.md): serve
// app/spike-gg-realism.html on a throwaway Vite dev server, fulfill the mesh request from
// a file on disk, render one deterministic frame, save a PNG. Mirrors the plumbing of
// app/scripts/visual.mjs but is deliberately separate: it must never touch that harness's
// evidence output directories (out/phase3-visual, out/phase4-visual).
//
//   node app/scripts/spike-capture.mjs --mesh out/gutcheck-gg-realism/mesh.bin \
//        --out out/gutcheck-gg-realism/render.png [--size 1200] [--params "tilt=0&zoom=1"]
//        [--port 4327]

import { spawn } from "node:child_process";
import { readFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const appDir = resolve(scriptDir, "..");
const repoRoot = resolve(appDir, "..");
const viteBin = resolve(repoRoot, "node_modules", "vite", "bin", "vite.js");

function parseArgs(argv) {
  const options = { mesh: null, out: null, size: 1200, params: "", port: 4327 };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const next = () => {
      const v = argv[++i];
      if (v === undefined) throw new Error(`${arg} wants a value`);
      return v;
    };
    switch (arg) {
      case "--mesh":
        options.mesh = next();
        break;
      case "--out":
        options.out = next();
        break;
      case "--size":
        options.size = Number(next());
        break;
      case "--params":
        options.params = next();
        break;
      case "--port":
        options.port = Number(next());
        break;
      default:
        throw new Error(`unknown argument: ${arg}`);
    }
  }
  if (options.mesh === null || options.out === null) {
    throw new Error("usage: spike-capture.mjs --mesh <mesh.bin> --out <render.png> [options]");
  }
  if (!Number.isInteger(options.size) || options.size < 256) {
    throw new Error("--size wants an integer >= 256");
  }
  return options;
}

async function waitForServer(url, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // not up yet
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error(`dev server did not answer at ${url} within ${timeoutMs} ms`);
}

function chromiumGpuArgs() {
  return process.platform === "darwin"
    ? ["--enable-unsafe-webgpu", "--use-angle=metal"]
    : ["--enable-unsafe-webgpu"];
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const meshBytes = readFileSync(options.mesh);
  mkdirSync(dirname(resolve(options.out)), { recursive: true });

  console.log(`spike-capture: vite dev on :${options.port}…`);
  const dev = spawn(
    process.execPath,
    [viteBin, "--port", String(options.port), "--strictPort"],
    { cwd: appDir, stdio: ["ignore", "pipe", "pipe"] },
  );
  dev.stderr.on("data", (chunk) => process.stderr.write(chunk));

  let browser = null;
  try {
    const pageUrl =
      `http://localhost:${options.port}/spike-gg-realism.html` +
      (options.params === "" ? "" : `?${options.params}`);
    await waitForServer(`http://localhost:${options.port}/spike-gg-realism.html`, 30_000);

    browser = await chromium.launch({ headless: true, args: chromiumGpuArgs() });
    const page = await browser.newPage({
      viewport: { width: options.size, height: options.size },
      deviceScaleFactor: 1,
    });
    const consoleErrors = [];
    const pageErrors = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });
    page.on("pageerror", (err) => pageErrors.push(String(err)));
    await page.route("**/gutcheck-mesh.bin", (route) =>
      route.fulfill({ body: meshBytes, contentType: "application/octet-stream" }),
    );

    console.log(`spike-capture: loading ${pageUrl} (mesh ${meshBytes.length} bytes)`);
    await page.goto(pageUrl, { waitUntil: "load" });
    await page.waitForFunction(
      () => window.__spikeReady === true || window.__spikeError !== undefined,
      undefined,
      { timeout: 120_000 },
    );
    const spikeError = await page.evaluate(() => window.__spikeError);
    if (spikeError !== undefined) throw new Error(`page reported failure: ${spikeError}`);
    if (pageErrors.length > 0) throw new Error(`page errors: ${pageErrors.join(" | ")}`);
    if (consoleErrors.length > 0) throw new Error(`console errors: ${consoleErrors.join(" | ")}`);

    await page.screenshot({ path: options.out, type: "png" });
    console.log(`spike-capture: wrote ${options.out} (${options.size}x${options.size})`);
  } finally {
    if (browser !== null) await browser.close();
    dev.kill("SIGTERM");
  }
}

main().catch((err) => {
  console.error(`spike-capture FAILED: ${err instanceof Error ? err.message : String(err)}`);
  process.exitCode = 1;
});
