// Phase 7 prep Track B (docs/plans/explore-phase7-prep.md): deterministic scene capture —
// the Developer-profile prototype. Serves the built static site, drives the viewer's
// window.__sceneSeek(t) frame by frame, and encodes an mp4:
//
//   node app/scripts/scene-capture.mjs --scene app/scenes/growth-B-intro.json \
//        --site out/gutcheck-gg-realism/site --out-dir out/gutcheck-gg-realism/p7/scene-run1 \
//        [--width 1280] [--height 720] [--port 8144] [--mp4 <path>]
//
// Prints an aggregate sha256 over all frame PNGs; two runs on the same host must match
// (the viewer renders each frame from an explicit virtual time, never wall clock).

import { createHash } from "node:crypto";
import { copyFileSync, mkdirSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { chromium } from "playwright";

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] !== undefined ? process.argv[i + 1] : fallback;
}

// Validate the RAW arguments before resolve(): resolve("") returns the cwd and is truthy,
// so a missing --out-dir would otherwise reach the rmSync below and delete the working
// directory. (Found by the 2026-08-05 adversarial review; reproduced before fixing.)
const rawScene = arg("scene", "");
const rawOutDir = arg("out-dir", "");
if (rawScene === "" || rawOutDir === "") {
  throw new Error("need --scene <file> and --out-dir <dir> (both non-empty)");
}
const scenePath = resolve(rawScene);
const siteDir = resolve(arg("site", "out/gutcheck-gg-realism/site"));
const outDir = resolve(rawOutDir);
const width = Number(arg("width", "1280"));
const height = Number(arg("height", "720"));
const port = Number(arg("port", "8144"));
const mp4Path = arg("mp4", null);

const scene = JSON.parse(readFileSync(scenePath, "utf8"));
if (scene.format !== "gutcheck-scene-v1") throw new Error(`bad scene format ${scene.format}`);
const fps = scene.fps ?? 30;
// A missing/NaN duration must fail closed: otherwise frameCount is NaN, the capture loop
// runs zero iterations, and two empty runs hash identically — a determinism check that
// passes without capturing anything.
if (typeof scene.duration !== "number" || !Number.isFinite(scene.duration) || scene.duration <= 0) {
  throw new Error(`scene.duration must be a positive number, got ${String(scene.duration)}`);
}
const frameCount = Math.round(scene.duration * fps);
if (!Number.isInteger(frameCount) || frameCount < 1) {
  throw new Error(`computed frameCount ${frameCount} is not a positive integer`);
}

// Stage the scene inside the served tree so relative sources resolve like production.
mkdirSync(join(siteDir, "scenes"), { recursive: true });
copyFileSync(scenePath, join(siteDir, "scenes", basename(scenePath)));
rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

const server = spawn("python3", ["-m", "http.server", "-d", siteDir, String(port)], {
  stdio: ["ignore", "pipe", "pipe"],
});
// Drain both pipes: python's http.server logs every GET to stderr, and an undrained pipe
// blocks the server once ~64 KB accumulates, deadlocking a long capture.
server.stdout.resume();
server.stderr.resume();
let serverExited = null;
server.on("error", (e) => {
  serverExited = `spawn failed: ${e.message}`;
});
server.on("exit", (code) => {
  serverExited ??= `server exited early with code ${code}`;
});
const waitFor = async (url, ms) => {
  const deadline = Date.now() + ms;
  while (Date.now() < deadline) {
    if (serverExited !== null) throw new Error(serverExited);
    try {
      const r = await fetch(url);
      // Confirm it is OUR server: a stale process on this port would silently serve old
      // content and the capture would render the wrong bundle.
      if (r.ok && r.headers.get("server")?.includes("Python")) return;
      if (r.ok) throw new Error(`port ${port} is held by a non-Python server; pick another --port`);
    } catch (e) {
      if (String(e.message).includes("is held by")) throw e;
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error("static server did not come up");
};

try {
  await waitFor(`http://localhost:${port}/spike-gg-realism.html`, 20000);
  const browser = await chromium.launch({
    headless: true,
    args: ["--enable-unsafe-webgpu", "--use-angle=metal"],
  });
  const page = await browser.newPage({ viewport: { width, height } });
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  const params = new URLSearchParams({
    scene: `scenes/${basename(scenePath)}`,
    capture: "1",
    ui: "0",
    look: scene.look ?? "footage-ice",
  });
  await page.goto(`http://localhost:${port}/spike-gg-realism.html?${params}`, {
    waitUntil: "domcontentloaded",
  });
  await page.waitForFunction(() => window.__spikeReady === true || window.__spikeError, {
    timeout: 120000,
  });
  const spikeError = await page.evaluate(() => window.__spikeError ?? null);
  if (spikeError) throw new Error(`viewer error: ${spikeError}`);

  const aggregate = createHash("sha256");
  for (let i = 0; i < frameCount; i++) {
    const t = i / fps;
    await page.evaluate((seconds) => window.__sceneSeek(seconds), t);
    const name = `frame-${String(i).padStart(5, "0")}.png`;
    const bytes = await page.screenshot({ path: join(outDir, name) });
    aggregate.update(bytes);
    if (i % 60 === 0) console.log(`frame ${i}/${frameCount}`);
  }
  await browser.close();
  if (errors.length) throw new Error(`page errors: ${errors.join(" | ")}`);
  console.log(`frames: ${frameCount}  aggregate sha256: ${aggregate.digest("hex")}`);

  if (mp4Path !== null) {
    const encode = spawnSync(
      "ffmpeg",
      ["-y", "-loglevel", "error", "-framerate", String(fps), "-i", join(outDir, "frame-%05d.png"),
        "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18", resolve(mp4Path)],
      { stdio: "inherit" },
    );
    if (encode.status !== 0) throw new Error("ffmpeg encode failed");
    console.log(`wrote ${mp4Path}`);
  }
} finally {
  server.kill("SIGTERM");
}
