// Phase 7 prep Track B (docs/plans/explore-phase7-prep.md): deterministic scene capture —
// the Developer-profile prototype. Serves the built static site, drives the viewer's
// window.__sceneSeek(t) frame by frame, and encodes an mp4:
//
//   node app/scripts/scene-capture.mjs --scene app/scenes/growth-B-intro.json \
//        --site out/gutcheck-gg-realism/site --out-dir out/gutcheck-gg-realism/p7/scene-run1 \
//        [--width 1280] [--height 720] [--port 8144] [--mp4 <path>] [--gl d3d11|swiftshader]
//
// Prints an aggregate sha256 over all frame PNGs; two runs on the same host must match
// (the viewer renders each frame from an explicit virtual time, never wall clock).
//
// Windows host (2026-08-06): serves in-process rather than shelling out to python3.
//
// --gl swiftshader (DEFAULT) renders in software. It is the only mode that satisfies the
// determinism claim above: measured on this host, two D3D11 runs of the same scene produced
// DIFFERENT aggregate hashes, while two swiftshader runs matched exactly. Hardware rendering
// is much faster, so `--gl d3d11` is the right choice when the output is a video for people
// to watch and the hash is not evidence — but it must not be the default, or the determinism
// check silently stops checking anything.

import { createHash } from "node:crypto";
import { copyFileSync, mkdirSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { createServer } from "node:http";
import { basename, extname, join, resolve, sep } from "node:path";
import { spawnSync } from "node:child_process";
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
// Default to the deterministic path; see the header note on the D3D11 hash mismatch.
const gl = arg("gl", "swiftshader");
if (gl !== "d3d11" && gl !== "swiftshader") {
  throw new Error(`--gl must be d3d11 or swiftshader, got ${gl}`);
}

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

// Serve the site in-process. This used to spawn `python3 -m http.server`, which does not
// exist on Windows (the `python3` on PATH there is the Store alias stub) — and the spawn
// brought its own hazards: draining the log pipes to avoid a deadlock, and sniffing the
// `Server:` header to prove a stale process was not holding the port. An in-process server
// has none of those: listen() fails loudly if the port is taken, and it dies with us.
const MIME = {
  ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript",
  ".css": "text/css", ".json": "application/json", ".png": "image/png",
  ".jpg": "image/jpeg", ".mp4": "video/mp4", ".bin": "application/octet-stream",
  ".svg": "image/svg+xml", ".ico": "image/x-icon",
};
const server = createServer((req, res) => {
  const url = new URL(req.url ?? "/", `http://localhost:${port}`);
  let pathname = decodeURIComponent(url.pathname);
  if (pathname.endsWith("/")) pathname += "index.html";
  // Refuse traversal out of the served tree before touching the filesystem.
  const target = resolve(join(siteDir, pathname));
  if (target !== siteDir && !target.startsWith(siteDir + sep)) {
    res.statusCode = 403;
    res.end("forbidden");
    return;
  }
  let data;
  try {
    data = readFileSync(target);
  } catch {
    res.statusCode = 404;
    res.end("not found");
    return;
  }
  res.setHeader("content-type", MIME[extname(target).toLowerCase()] ?? "application/octet-stream");
  res.end(data);
});
await new Promise((ready, fail) => {
  server.once("error", fail);
  server.listen(port, "127.0.0.1", ready);
});

try {
  const browser = await chromium.launch({
    headless: true,
    // `--use-angle=metal` was macOS-only and silently wrong on this Windows host.
    args:
      gl === "swiftshader"
        ? ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"]
        : ["--use-gl=angle", "--use-angle=d3d11"],
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
  server.close();
}
