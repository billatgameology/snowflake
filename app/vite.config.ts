import { createReadStream, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig, type Plugin } from "vite";

// The gut-check index page reads out/gutcheck-gg-realism/index.json, which lives outside the
// Vite root. The page cannot know where the repo is, and the previous answer was to hardcode
// the author's macOS path in app/src/gutcheck-index.ts — dead on every other machine (found on
// the 2026-08-06 transfer). Serve it at a fixed URL instead: the path is resolved here, where
// the repo location is known, and the page just asks for /gutcheck-index.json.
//
// Only the index itself needs this. The artifacts it points at are /@fs URLs written into
// index.json by scripts/gutcheck-build-index.ts, and Vite's own /@fs handler serves those
// (with the range support the mp4 needs). Dev only — a static bundle from
// scripts/gutcheck-build-site.ts carries its own ./data/index.json next to the page.
const outIndexJson = resolve(import.meta.dirname, "..", "out/gutcheck-gg-realism/index.json");

const gutcheckIndexJson: Plugin = {
  name: "gutcheck-index-json",
  apply: "serve",
  configureServer(server) {
    server.middlewares.use("/gutcheck-index.json", (_req, res) => {
      let body: Buffer;
      try {
        body = readFileSync(outIndexJson);
      } catch {
        // Not generated yet: 404 so the page shows its "run gutcheck-build-index.ts" notice.
        res.statusCode = 404;
        res.end();
        return;
      }
      res.setHeader("content-type", "application/json");
      res.setHeader("cache-control", "no-cache");
      res.end(body);
    });
  },
};

// Bulk artifacts (meshes, growth timelines, renders) moved to the NAS on 2026-08-12
// (S: = \\GameStation\snowcrystal; docs/nas-ledger.md). Vite's /@fs cannot serve a drive
// other than the workspace's on Windows — it falls through to the SPA page — so the NAS
// gets its own route: /nas/<path> streams S:\<path>. Range requests are honored because
// the viewer's mp4 and large .bin fetches need them. index.json points here via
// scripts/gutcheck-build-index.ts (its FS() emits /nas/ URLs for S: paths).
const NAS_TYPES: Record<string, string> = {
  ".png": "image/png",
  ".json": "application/json",
  ".bin": "application/octet-stream",
  ".mp4": "video/mp4",
};
const nasStatic: Plugin = {
  name: "gutcheck-nas-static",
  apply: "serve",
  configureServer(server) {
    server.middlewares.use("/nas", (req, res) => {
      const rel = decodeURIComponent((req.url ?? "").split("?")[0] ?? "").replace(/^\/+/, "");
      // resolve() collapses any ../ so a crafted URL cannot escape the drive.
      const path = resolve("S:\\", rel);
      if (!path.toLowerCase().startsWith("s:\\")) {
        res.statusCode = 403;
        res.end();
        return;
      }
      let stat;
      try {
        stat = statSync(path);
        if (!stat.isFile()) throw new Error("not a file");
      } catch {
        res.statusCode = 404;
        res.end("not found (NAS attached?)");
        return;
      }
      const ext = path.slice(path.lastIndexOf(".")).toLowerCase();
      res.setHeader("content-type", NAS_TYPES[ext] ?? "application/octet-stream");
      res.setHeader("accept-ranges", "bytes");
      const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range ?? "");
      if (range && (range[1] !== "" || range[2] !== "")) {
        const start = range[1] === "" ? stat.size - Number(range[2]) : Number(range[1]);
        const end = range[1] !== "" && range[2] !== "" ? Math.min(Number(range[2]), stat.size - 1) : stat.size - 1;
        if (start > end || start < 0 || start >= stat.size) {
          res.statusCode = 416;
          res.setHeader("content-range", `bytes */${stat.size}`);
          res.end();
          return;
        }
        res.statusCode = 206;
        res.setHeader("content-range", `bytes ${start}-${end}/${stat.size}`);
        res.setHeader("content-length", end - start + 1);
        createReadStream(path, { start, end }).pipe(res);
        return;
      }
      res.setHeader("content-length", stat.size);
      createReadStream(path).pipe(res);
    });
  },
};

// Module workers only (the solver worker); "es" keeps import statements legal inside the
// bundled worker. Build target es2022 matches the repo's tsconfig target.
export default defineConfig({
  plugins: [gutcheckIndexJson, nasStatic],
  worker: { format: "es" },
  build: {
    target: "es2022",
    // three.js is a single large dependency; the default 500 kB warning is noise here.
    chunkSizeWarningLimit: 1500,
    // Multi-page: the Phase 3 instrument plus the gut-check spike pages, so `vite build`
    // emits a static site usable from any plain host (Phase 7 prep Track A,
    // docs/plans/explore-phase7-prep.md).
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, "index.html"),
        gutcheckIndex: resolve(import.meta.dirname, "gutcheck-index.html"),
        spike: resolve(import.meta.dirname, "spike-gg-realism.html"),
      },
    },
  },
  server: {
    port: 5173,
    strictPort: false,
    // Large artifacts (meshes, growth timelines, renders) live on the NAS as of 2026-08-12
    // (S: = \\GameStation\snowcrystal; see docs/nas-ledger.md), and index.json points /@fs
    // URLs at them. Listing fs.allow replaces Vite's default, so the repo root must be
    // restated alongside the NAS drive or every local /@fs asset 403s.
    fs: { allow: [resolve(import.meta.dirname, ".."), "S:/"] },
  },
  preview: { port: 4173, strictPort: false },
});
