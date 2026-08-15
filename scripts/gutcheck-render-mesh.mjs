// Render gutcheck mesh binaries to PNG, headless — the missing piece between growing a
// crystal and putting it on the site. Batch mode reuses one browser and one page, which is
// what makes rendering hundreds of crystals practical.
//
//   node scripts/gutcheck-render-mesh.mjs --mesh <in.bin> --out <out.png> [--look glass]
//   node scripts/gutcheck-render-mesh.mjs --dir <meshdir> --out-dir <pngdir> [--look glass]
//
//   [--width 1200] [--height 1200] [--gl d3d11|swiftshader] [--tilt 0] [--zoom 1]
//   [--site out/gutcheck-gg-realism/site] [--port 8146] [--force]
//
// Serves the built site in-process and exposes the mesh under a fixed URL, so the viewer
// loads it exactly as it would in the browser — same shaders, same look presets, same
// geometry path. Requires the site build (node scripts/gutcheck-build-site.ts).
//
// --gl d3d11 (default) renders on the GPU. This is a picture-making tool, not the
// determinism harness that app/scripts/scene-capture.mjs is, so speed wins here; pass
// --gl swiftshader if you need byte-identical output across machines.

import { existsSync, mkdirSync, readFileSync, readdirSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { basename, extname, join, resolve, sep } from "node:path";
import { chromium } from "playwright";

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] !== undefined ? process.argv[i + 1] : fallback;
}
const flag = (name) => process.argv.includes(`--${name}`);

const meshArg = arg("mesh", null);
const dirArg = arg("dir", null);
const outArg = arg("out", null);
const outDirArg = arg("out-dir", null);
if ((meshArg === null) === (dirArg === null)) {
  throw new Error("need exactly one of --mesh <file> or --dir <dir>");
}
if (meshArg !== null && outArg === null) throw new Error("--mesh needs --out");
if (dirArg !== null && outDirArg === null) throw new Error("--dir needs --out-dir");

const siteDir = resolve(arg("site", "out/gutcheck-gg-realism/site"));
if (!existsSync(join(siteDir, "spike-gg-realism.html"))) {
  throw new Error(`no built site at ${siteDir} — run: node scripts/gutcheck-build-site.ts`);
}
const look = arg("look", "glass");
const width = Number(arg("width", "1200"));
const height = Number(arg("height", "1200"));
const tilt = arg("tilt", "0");
const zoom = arg("zoom", "1");
const port = Number(arg("port", "8146"));
const gl = arg("gl", "d3d11");
const force = flag("force");

// Build the job list. Cell-true meshes need style=ggview and are skipped unless asked for
// by name — the surface looks cannot draw them and would render an empty frame.
const jobs = [];
if (meshArg !== null) {
  jobs.push({ mesh: resolve(meshArg), out: resolve(outArg) });
} else {
  const dir = resolve(dirArg);
  const outDir = resolve(outDirArg);
  mkdirSync(outDir, { recursive: true });
  for (const f of readdirSync(dir).sort()) {
    if (!f.endsWith(".bin") || f.includes("cellmesh")) continue;
    const out = join(outDir, f.replace(/\.bin$/, ".png"));
    if (!force && existsSync(out)) continue; // resumable: a long batch can be re-run
    jobs.push({ mesh: join(dir, f), out });
  }
}
if (jobs.length === 0) {
  console.log("nothing to render (all outputs exist; pass --force to redo)");
  process.exit(0);
}

const MIME = {
  ".html": "text/html", ".js": "text/javascript", ".css": "text/css",
  ".json": "application/json", ".png": "image/png", ".bin": "application/octet-stream",
};
let currentMesh = jobs[0].mesh;
const server = createServer((req, res) => {
  const url = new URL(req.url ?? "/", `http://localhost:${port}`);
  let pathname = decodeURIComponent(url.pathname);
  // Fixed URL for whichever mesh is being rendered right now, so the page URL only has to
  // change by a cache-busting query and the bundle stays warm between jobs.
  const target =
    pathname === "/render-mesh.bin" ? currentMesh : resolve(join(siteDir, pathname.endsWith("/") ? pathname + "index.html" : pathname));
  if (target !== currentMesh && target !== siteDir && !target.startsWith(siteDir + sep)) {
    res.statusCode = 403;
    res.end("forbidden");
    return;
  }
  let body;
  try {
    body = readFileSync(target);
  } catch {
    res.statusCode = 404;
    res.end("not found");
    return;
  }
  res.setHeader("content-type", MIME[extname(target).toLowerCase()] ?? "application/octet-stream");
  res.end(body);
});
await new Promise((ok, fail) => {
  server.once("error", fail);
  server.listen(port, "127.0.0.1", ok);
});

const browser = await chromium.launch({
  args:
    gl === "swiftshader"
      ? ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"]
      : ["--use-gl=angle", "--use-angle=d3d11"],
});
const page = await browser.newPage({ viewport: { width, height } });

let done = 0;
let failed = 0;
try {
  for (const job of jobs) {
    currentMesh = job.mesh;
    const mb = (statSync(job.mesh).size / 1e6).toFixed(0);
    const params = new URLSearchParams({
      mesh: `/render-mesh.bin?j=${String(done)}`,
      look, ui: "0", tilt, zoom,
    });
    const errors = [];
    const onError = (e) => errors.push(String(e));
    page.on("pageerror", onError);
    try {
      await page.goto(`http://localhost:${port}/spike-gg-realism.html?${params}`, {
        waitUntil: "domcontentloaded",
      });
      // __spikeReady is set once the mesh is parsed and the first frame is drawn.
      await page.waitForFunction(() => window.__spikeReady === true || window.__spikeError, {
        timeout: 300000,
      });
      const err = await page.evaluate(() => window.__spikeError ?? null);
      if (err) throw new Error(String(err));
      await page.screenshot({ path: job.out, timeout: 300000 });
      done++;
      console.log(`ok   ${basename(job.mesh)} (${mb} MB) -> ${basename(job.out)}`);
    } catch (e) {
      failed++;
      console.error(`FAIL ${basename(job.mesh)}: ${String(e).split("\n")[0]}${errors.length ? ` | ${errors[0]}` : ""}`);
    } finally {
      page.off("pageerror", onError);
    }
  }
} finally {
  await browser.close();
  server.close();
}
console.log(`rendered ${done}/${jobs.length}${failed ? `, ${failed} failed` : ""}`);
process.exitCode = failed > 0 ? 1 : 0;
