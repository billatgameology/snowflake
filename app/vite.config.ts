import { readFileSync } from "node:fs";
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

// Module workers only (the solver worker); "es" keeps import statements legal inside the
// bundled worker. Build target es2022 matches the repo's tsconfig target.
export default defineConfig({
  plugins: [gutcheckIndexJson],
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
  server: { port: 5173, strictPort: false },
  preview: { port: 4173, strictPort: false },
});
