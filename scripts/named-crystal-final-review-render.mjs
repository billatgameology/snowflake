// Render face, oblique, and axial views plus one contact sheet for a completed direct-production
// report. This is presentation-only review tooling; it never changes a solver product.
//
// node scripts/named-crystal-final-review-render.mjs --root out/... --port 5203 --title "Fleet A"

import { spawn } from "node:child_process";
import { mkdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { chromium } from "playwright";

const argument = (name, fallback) => {
  const index = process.argv.indexOf(`--${name}`);
  if (index < 0) return fallback;
  const value = process.argv[index + 1];
  if (value === undefined) throw new Error(`--${name} wants a value`);
  return value;
};

const repo = resolve(import.meta.dirname, "..");
const root = resolve(repo, argument("root"));
const outputRoot = join(root, "review-renders");
const report = JSON.parse(readFileSync(join(root, "report.json"), "utf8"));
if (report.format !== "named-crystal-direct-production-report-v1" || report.failed !== 0) {
  throw new Error("review root does not contain a successful direct-production report");
}
const jobs = report.results.map((result) => ({
  id: result.jobId,
  typeName: result.typeName,
  slot: result.slot,
  driver: `${result.driverName}=${result.driverValue}`,
}));
const tilts = [0, 55, 85];
const port = Number(argument("port", "5203"));
const title = argument("title", "Named crystal final-resolution review");
if (!Number.isSafeInteger(port) || port < 1024 || port > 65535) throw new Error("--port is invalid");
mkdirSync(outputRoot, { recursive: true });

const vite = spawn(
  process.execPath,
  [join(repo, "node_modules/vite/bin/vite.js"), "--host", "127.0.0.1", "--port", String(port), "--strictPort"],
  { cwd: join(repo, "app"), stdio: ["ignore", "ignore", "inherit"] },
);
const deadline = Date.now() + 30_000;
while (true) {
  try {
    if ((await fetch(`http://127.0.0.1:${port}/spike-gg-realism.html`)).ok) break;
  } catch {}
  if (Date.now() >= deadline) throw new Error("Vite did not start");
  await new Promise((resolveWait) => setTimeout(resolveWait, 200));
}

const browser = await chromium.launch({ headless: true, args: ["--enable-unsafe-webgpu"] });
try {
  for (const job of jobs) {
    const mesh = readFileSync(join(root, job.id, "mesh.bin"));
    for (const tilt of tilts) {
      const page = await browser.newPage({ viewport: { width: 560, height: 560 } });
      try {
        await page.route("**/gutcheck-mesh.bin", (route) =>
          route.fulfill({ body: mesh, contentType: "application/octet-stream" }),
        );
        await page.goto(
          `http://127.0.0.1:${port}/spike-gg-realism.html?look=glass&tilt=${tilt}&zoom=0.88`,
          { waitUntil: "load" },
        );
        await page.waitForFunction(
          () => window.__spikeReady === true || window.__spikeError !== undefined,
          undefined,
          { timeout: 120_000 },
        );
        const error = await page.evaluate(() => window.__spikeError);
        if (error !== undefined) throw new Error(`${job.id}: ${String(error)}`);
        await page.screenshot({ path: join(outputRoot, `${job.id}-tilt${tilt}.png`) });
      } finally {
        await page.close();
      }
    }
    console.log(job.id);
  }
} finally {
  await browser.close();
  vite.kill("SIGTERM");
}

const rows = jobs.map((job) => {
  const figures = tilts.map((tilt) => {
    const data = readFileSync(join(outputRoot, `${job.id}-tilt${tilt}.png`)).toString("base64");
    return `<figure><img src="data:image/png;base64,${data}"><figcaption>${tilt}°</figcaption></figure>`;
  }).join("");
  return `<section><header><strong>${job.typeName} — ${job.id}</strong><span>${job.driver}</span></header>${figures}</section>`;
}).join("");
const html = `<!doctype html><style>
body{margin:0;padding:16px;background:#08111f;color:#eef5ff;font:14px system-ui}
h1{font-size:25px;margin:0 0 14px}section{display:grid;grid-template-columns:300px repeat(3,1fr);gap:8px;align-items:center;margin-bottom:9px}
header{padding:8px}strong,span{display:block}strong{font-size:14px}span{color:#aebed1;font-size:11px;margin-top:5px}
figure{margin:0;background:#14243a;padding:4px}img{display:block;width:100%}figcaption{text-align:center;padding:2px}
</style><h1>${title} — face / oblique / axial</h1>${rows}`;
const sheetBrowser = await chromium.launch({ headless: true });
try {
  const page = await sheetBrowser.newPage({ viewport: { width: 1880, height: 1000 } });
  await page.setContent(html, { waitUntil: "load" });
  await page.screenshot({ path: join(root, "contact-sheet.png"), fullPage: true });
} finally {
  await sheetBrowser.close();
}
console.log(join(root, "contact-sheet.png"));
