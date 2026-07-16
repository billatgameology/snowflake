import { defineConfig } from "vite";

// Module workers only (the solver worker); "es" keeps import statements legal inside the
// bundled worker. Build target es2022 matches the repo's tsconfig target.
export default defineConfig({
  worker: { format: "es" },
  build: {
    target: "es2022",
    // three.js is a single large dependency; the default 500 kB warning is noise here.
    chunkSizeWarningLimit: 1500,
  },
  server: { port: 5173, strictPort: false },
  preview: { port: 4173, strictPort: false },
});
