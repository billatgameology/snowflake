import { resolve } from "node:path";
import { defineConfig } from "vite";

// Module workers only (the solver worker); "es" keeps import statements legal inside the
// bundled worker. Build target es2022 matches the repo's tsconfig target.
export default defineConfig({
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
