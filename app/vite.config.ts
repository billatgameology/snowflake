import { closeSync, createReadStream, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig, type Plugin } from "vite";

import { detectNasMount, openNasResolution, resolveNasRequest } from "../scripts/nas-root.ts";

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
// (\\GameStation\snowcrystal; docs/nas-ledger.md). Vite's /@fs cannot serve a drive other
// than the workspace's on Windows — it falls through to the SPA page — so the NAS gets its
// own route: /nas/<share-relative path> streams from wherever this host has the share
// attached (S:\ on Windows, /Volumes/snowcrystal on macOS — scripts/nas-root.ts decides,
// GUTCHECK_NAS_ROOT overrides). The URL carries no mount prefix, making the construction
// mount-agnostic; end-to-end behavior was measured on macOS, while the current Windows S:/
// path remains unexecuted. Range requests are honored because the viewer's mp4 and large
// .bin fetches need them. index.json points here via
// scripts/gutcheck-build-index.ts (its FS() emits /nas/ URLs for paths under the mount).
const NAS_MOUNT = detectNasMount();
// resolve() gives the platform-native root ("S:\" or "/Volumes/snowcrystal") to join against
// and to bound the request path with.
const NAS_BASE = NAS_MOUNT === null ? null : resolve(NAS_MOUNT);
const NAS_TYPES: Record<string, string> = {
  ".png": "image/png",
  ".json": "application/json",
  ".bin": "application/octet-stream",
  ".mp4": "video/mp4",
};

export const pipeNasFile = (
  res: import("node:http").ServerResponse,
  path: string,
  fd: number,
  options?: { start: number; end: number },
): void => {
  const stream = createReadStream(path, { ...options, fd, autoClose: true });
  // The share can fail after the descriptor is safely opened. Handle that ordinary I/O error
  // on the response instead of emitting an unhandled stream error that can take down the dev
  // server.
  stream.on("error", () => {
    if (res.headersSent) {
      res.destroy();
      return;
    }
    res.removeHeader("content-length");
    res.removeHeader("content-range");
    res.statusCode = 503;
    res.end("NAS read failed (share detached?)");
  });
  // If the browser abandons a large/rate-limited response, pipe() does not automatically
  // destroy the source. Explicitly do so or its NAS descriptor can remain open indefinitely.
  const onResponseClose = (): void => {
    if (!res.writableFinished) stream.destroy();
  };
  res.once("close", onResponseClose);
  stream.once("close", () => res.off("close", onResponseClose));
  stream.pipe(res);
};
const nasStatic: Plugin = {
  name: "gutcheck-nas-static",
  apply: "serve",
  configureServer(server) {
    server.middlewares.use("/nas", (req, res) => {
      const method = req.method ?? "GET";
      if (method !== "GET" && method !== "HEAD") {
        res.statusCode = 405;
        res.setHeader("allow", "GET, HEAD");
        res.end();
        return;
      }
      if (NAS_BASE === null) {
        res.statusCode = 404;
        res.end("no NAS share attached (see docs/nas-ledger.md)");
        return;
      }
      // Path resolution and BOTH containment checks (lexical dot-dot + realpath symlink
      // escape) live in scripts/nas-root.ts so the adversarial tests exercise exactly the
      // code that serves.
      const resolution = openNasResolution(resolveNasRequest(req.url ?? "", NAS_BASE));
      if (resolution.kind === "forbidden") {
        res.statusCode = 403;
        res.end();
        return;
      }
      if (resolution.kind === "notfound") {
        res.statusCode = 404;
        res.end("not found (NAS attached?)");
        return;
      }
      const { path, size } = resolution;
      const ext = path.slice(path.lastIndexOf(".")).toLowerCase();
      res.setHeader("content-type", NAS_TYPES[ext] ?? "application/octet-stream");
      res.setHeader("accept-ranges", "bytes");
      const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range ?? "");
      if (range && (range[1] !== "" || range[2] !== "")) {
        // RFC 7233: a suffix longer than the file means "the whole file", not 416.
        const start = range[1] === "" ? Math.max(0, size - Number(range[2])) : Number(range[1]);
        const end = range[1] !== "" && range[2] !== "" ? Math.min(Number(range[2]), size - 1) : size - 1;
        if (start > end || start < 0 || start >= size) {
          closeSync(resolution.fd);
          res.statusCode = 416;
          res.setHeader("content-range", `bytes */${size}`);
          res.end();
          return;
        }
        res.statusCode = 206;
        res.setHeader("content-range", `bytes ${start}-${end}/${size}`);
        res.setHeader("content-length", end - start + 1);
        if (method === "HEAD") {
          closeSync(resolution.fd);
          res.end();
          return;
        }
        pipeNasFile(res, path, resolution.fd, { start, end });
        return;
      }
      res.setHeader("content-length", size);
      if (method === "HEAD") {
        closeSync(resolution.fd);
        res.end();
        return;
      }
      pipeNasFile(res, path, resolution.fd);
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
    // (\\GameStation\snowcrystal; see docs/nas-ledger.md). Those are served by the /nas
    // route above. Do NOT add the NAS mount to Vite's lexical /@fs allow-list: an in-share
    // symlink would then bypass /nas's realpath containment and expose its outside target.
    // Rebuild stale indexes so NAS URLs use /nas; only the repo itself belongs in /@fs.
    fs: { allow: [resolve(import.meta.dirname, "..")] },
  },
  preview: { port: 4173, strictPort: false },
});
