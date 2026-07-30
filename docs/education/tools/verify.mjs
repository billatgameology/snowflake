/**
 * Fail-closed browser and model verifier for the complete education course.
 *
 *   node docs/education/tools/verify.mjs
 *   node docs/education/tools/verify.mjs --part-one
 *   node docs/education/tools/verify.mjs --public-only
 *   node docs/education/tools/verify.mjs --offline-only
 *
 * Screenshots are optional artifacts (`--screenshots`); no screenshot supplies
 * a verdict. The verifier checks the published bytes and independently
 * recomputes the load-bearing model invariants it participates in.
 */

import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { createServer } from "node:http";
import { basename, dirname, extname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { chromium } from "playwright";

const TOOL_DIR = fileURLToPath(new URL(".", import.meta.url));
const REPO = resolve(TOOL_DIR, "../../..");
const PUBLIC_ROOT = join(REPO, "docs/education");
const OFFLINE_ROOT = join(REPO, "out/education-local");
const OUT = join(REPO, "out/education-verify");
const REGISTERED_REAL_GROWTH_SHA256 =
  "6a8d4057e3e588714345eb156c8129f65037cfb0998e16b63618ffd5382fd7e4";
const MANIFEST = JSON.parse(readFileSync(join(TOOL_DIR, "site-manifest.json"), "utf8"));
const ALL_PAGE_PATHS = Object.freeze(Object.keys(MANIFEST));
const args = new Set(process.argv.slice(2));
const partOneOnly = args.has("--part-one");
const PAGE_PATHS = Object.freeze(
  ALL_PAGE_PATHS.filter((path) => {
    const match = /^chapters\/(\d\d)-/.exec(path);
    return !partOneOnly || !match || Number(match[1]) <= 13;
  }),
);
const EXPECTED_ROOTS = Object.freeze(
  PAGE_PATHS.reduce((count, path) => count + MANIFEST[path].length, 0),
);

const screenshots = args.has("--screenshots");
if (args.has("--public-only") && args.has("--offline-only")) {
  throw new Error("--public-only and --offline-only are mutually exclusive");
}
const modes = args.has("--public-only")
  ? ["public"]
  : args.has("--offline-only")
    ? ["offline"]
    : ["public", "offline"];

const failures = [];
const checks = [];

function pass(label) {
  checks.push(label);
  console.log(`PASS  ${label}`);
}

function fail(label, detail) {
  const message = `${label}: ${detail}`;
  failures.push(message);
  console.error(`FAIL  ${message}`);
}

function requireCheck(condition, label, detail) {
  if (condition) pass(label);
  else fail(label, detail);
}

function sha256(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function listFiles(root) {
  const out = [];
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    const path = join(root, entry.name);
    if (entry.isDirectory()) out.push(...listFiles(path));
    else out.push(path);
  }
  return out;
}

function staticChecks() {
  const actualPages = listFiles(PUBLIC_ROOT)
    .filter((path) => extname(path).toLowerCase() === ".html")
    .map((path) => relative(PUBLIC_ROOT, path).split(sep).join("/"))
    .sort();
  const expectedPages = [...ALL_PAGE_PATHS].sort();
  requireCheck(
    JSON.stringify(actualPages) === JSON.stringify(expectedPages),
    "manifest enumerates every served HTML page recursively",
    `expected ${expectedPages.length}, found ${actualPages.length}`,
  );

  const mediaExtensions = new Set([
    ".aac", ".avif", ".avi", ".bmp", ".flac", ".gif", ".heic", ".heif",
    ".jpeg", ".jpg", ".m4a", ".m4v", ".mkv", ".mov", ".mp3", ".mp4",
    ".oga", ".ogg", ".ogv", ".opus", ".pdf", ".png", ".svg", ".tif",
    ".tiff", ".wav", ".webm", ".webp",
  ]);
  const leaked = listFiles(PUBLIC_ROOT)
    .filter((path) => mediaExtensions.has(extname(path).toLowerCase()))
    .map((path) => relative(REPO, path));
  requireCheck(
    leaked.length === 0,
    "public source tree contains no image, audio, video, or PDF files",
    leaked.join(", "),
  );

  const authoredGrowth = readFileSync(
    join(PUBLIC_ROOT, "chapters/04-the-fuel-supply.html"),
    "utf8",
  );
  requireCheck(
    /\bdata-offline-video-source=/.test(authoredGrowth)
      && !/\bdata-local-video=/.test(authoredGrowth),
    "public real-growth page carries only an inert offline-media marker",
    "expected data-offline-video-source without an active data-local-video attribute",
  );

  const sourceFiles = partOneOnly
    ? selectedPublishedSources()
    : listFiles(PUBLIC_ROOT)
      .filter((path) => [".html", ".js", ".css", ".json", ".md"].includes(extname(path)));
  const randomCalls = [];
  for (const path of sourceFiles) {
    const text = readFileSync(path, "utf8");
    if (/\bMath\.random\s*\(/.test(text)) randomCalls.push(relative(REPO, path));
  }
  requireCheck(
    randomCalls.length === 0,
    `${partOneOnly ? "Part One" : "education"} sources contain no Math.random calls`,
    randomCalls.join(", "),
  );

  requireCheck(
    ALL_PAGE_PATHS.length === 33 && PAGE_PATHS.length === (partOneOnly ? 17 : 33) && EXPECTED_ROOTS > 0,
    `manifest pins the complete 33-page course and the ${partOneOnly ? "17-page Part One" : "full"} visual-root inventory`,
    `allPages=${ALL_PAGE_PATHS.length}, selectedPages=${PAGE_PATHS.length}, roots=${EXPECTED_ROOTS}`,
  );
}

function selectedPublishedSources() {
  const selected = new Set();
  for (const pagePath of PAGE_PATHS) {
    const absolutePage = join(PUBLIC_ROOT, pagePath);
    selected.add(absolutePage);
    const html = readFileSync(absolutePage, "utf8");
    for (const match of html.matchAll(/<script\b[^>]*\bsrc=["']([^"'?#]+)["'][^>]*>/gi)) {
      const script = resolve(absolutePage, "..", match[1]);
      if (script === PUBLIC_ROOT || script.startsWith(`${PUBLIC_ROOT}${sep}`)) selected.add(script);
    }
  }
  return [...selected];
}

function verifyOfflineMediaBytes() {
  const publicPage = join(PUBLIC_ROOT, "chapters/04-the-fuel-supply.html");
  const html = readFileSync(publicPage, "utf8");
  const marker = /\bdata-offline-video-source="([^"]+)"/.exec(html);
  if (!marker) {
    fail("offline real-growth source marker", "marker missing from authored chapter 04");
    return;
  }
  const source = resolve(dirname(publicPage), marker[1]);
  const copied = join(OFFLINE_ROOT, "media", basename(source));
  const sourceHash = existsSync(source) ? sha256(source) : "";
  const copiedHash = existsSync(copied) ? sha256(copied) : "";
  requireCheck(
    existsSync(source)
      && existsSync(copied)
      && sourceHash === REGISTERED_REAL_GROWTH_SHA256
      && copiedHash === REGISTERED_REAL_GROWTH_SHA256,
    "offline real-growth movie matches the independently registered source hash",
    `source=${sourceHash || "missing"}, copied=${copiedHash || "missing"}`,
  );
}

function collectAuthoredMediaReferences() {
  const figures = new Map();
  const videos = new Map();
  const note = (map, source, pagePath) => {
    if (!map.has(source)) map.set(source, new Set());
    map.get(source).add(pagePath);
  };
  for (const pagePath of ALL_PAGE_PATHS) {
    const html = readFileSync(join(PUBLIC_ROOT, pagePath), "utf8");
    for (const match of html.matchAll(/\bdata-src="([^"]+)"/g)) {
      note(figures, match[1], pagePath);
    }
    for (const match of html.matchAll(/\bdata-offline-video-source="([^"]+)"/g)) {
      note(videos, match[1], pagePath);
    }
  }
  return { figures, videos };
}

function verifyOfflineSourceMap() {
  const path = join(OFFLINE_ROOT, "source-media-map.json");
  if (!existsSync(path)) {
    fail("offline source-media map", `${path} is missing`);
    return;
  }
  let sourceMap;
  try {
    sourceMap = JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    fail("offline source-media map", `invalid JSON: ${error.message}`);
    return;
  }

  const expected = collectAuthoredMediaReferences();
  const problems = [];
  if (sourceMap.schemaVersion !== 1) problems.push(`schemaVersion=${sourceMap.schemaVersion}`);
  if (sourceMap.buildKind !== "personal-offline-education") {
    problems.push(`buildKind=${sourceMap.buildKind}`);
  }

  function verifyKind(kind, entries, expectedReferences, directory) {
    if (!Array.isArray(entries)) {
      problems.push(`${kind} entries are not an array`);
      return;
    }
    const bySource = new Map();
    const mappedOutputs = new Set();
    for (const entry of entries) {
      if (!entry || typeof entry.source !== "string" || bySource.has(entry.source)) {
        problems.push(`${kind} duplicate/invalid source ${entry?.source}`);
        continue;
      }
      bySource.set(entry.source, entry);
    }
    const actualSources = [...bySource.keys()].sort();
    const expectedSources = [...expectedReferences.keys()].sort();
    if (!sameList(actualSources, expectedSources)) {
      problems.push(`${kind} source set mismatch`);
    }

    for (const source of expectedSources) {
      const entry = bySource.get(source);
      if (!entry) continue;
      const pages = [...expectedReferences.get(source)].sort();
      if (!sameList(entry.pages, pages)) problems.push(`${kind}:${source}:page mapping`);
      if (entry.status !== "copied") problems.push(`${kind}:${source}:status=${entry.status}`);
      if (
        typeof entry.canonicalResearchPath !== "string"
        || !/^research\//.test(entry.canonicalResearchPath)
        || /(?:^|\/)\.\.(?:\/|$)/.test(entry.canonicalResearchPath)
      ) {
        problems.push(`${kind}:${source}:unsafe canonical identifier`);
      }
      const copiedFilename = basename(entry.copiedFilename || "");
      const expectedPrefix = `${directory}/`;
      const expectedMime = new Map([
        [".avif", "image/avif"],
        [".jpeg", "image/jpeg"],
        [".jpg", "image/jpeg"],
        [".png", "image/png"],
        [".webp", "image/webp"],
        [".m4v", "video/mp4"],
        [".mov", "video/quicktime"],
        [".mp4", "video/mp4"],
        [".webm", "video/webm"],
      ]).get(extname(copiedFilename).toLowerCase());
      if (
        !copiedFilename
        || entry.copiedFilename !== copiedFilename
        || entry.copiedPath !== `${expectedPrefix}${copiedFilename}`
        || !expectedMime
        || entry.mimeType !== expectedMime
      ) {
        problems.push(`${kind}:${source}:unsafe output mapping`);
        continue;
      }
      const output = resolve(OFFLINE_ROOT, entry.copiedPath);
      const expectedOutputRoot = resolve(OFFLINE_ROOT, directory);
      if (
        !(output.startsWith(`${expectedOutputRoot}${sep}`))
        || !existsSync(output)
        || !statSync(output).isFile()
      ) {
        problems.push(`${kind}:${source}:missing output`);
        continue;
      }
      mappedOutputs.add(copiedFilename);

      const authoredPage = join(PUBLIC_ROOT, pages[0]);
      const sourcePath = kind === "figure"
        ? resolve(REPO, source)
        : resolve(dirname(authoredPage), source);
      if (!existsSync(sourcePath) || !statSync(sourcePath).isFile()) {
        problems.push(`${kind}:${source}:missing source`);
        continue;
      }
      const sourceHash = sha256(sourcePath);
      const outputHash = sha256(output);
      const outputBytes = statSync(output).size;
      if (
        entry.sourceSha256 !== sourceHash
        || entry.outputSha256 !== outputHash
        || sourceHash !== outputHash
        || entry.bytes !== outputBytes
      ) {
        problems.push(`${kind}:${source}:byte identity`);
      }

      for (const pagePath of pages) {
        const offlineHtml = readFileSync(join(OFFLINE_ROOT, pagePath), "utf8");
        const mapped = kind === "figure"
          ? new RegExp(`\\bdata-src="${copiedFilename.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`).test(offlineHtml)
          : new RegExp(`\\bdata-local-video="[^"]*media/${copiedFilename.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`).test(offlineHtml);
        if (!mapped) problems.push(`${kind}:${source}:${pagePath}:HTML rewrite`);
      }
    }

    const actualOutputs = existsSync(join(OFFLINE_ROOT, directory))
      ? readdirSync(join(OFFLINE_ROOT, directory)).sort()
      : [];
    if (!sameList(actualOutputs, [...mappedOutputs].sort())) {
      problems.push(`${kind} output directory contains missing or unregistered files`);
    }
  }

  verifyKind("figure", sourceMap.figures, expected.figures, "figures");
  verifyKind("video", sourceMap.videos, expected.videos, "media");
  requireCheck(
    problems.length === 0,
    "offline source-media map independently binds every authored reference to byte-identical research and output files",
    problems.slice(0, 30).join(" | "),
  );
}

const MIME = Object.freeze({
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".mp4": "video/mp4",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
});

async function serve(root) {
  const absoluteRoot = resolve(root);
  const server = createServer((request, response) => {
    const requestUrl = new URL(request.url || "/", "http://127.0.0.1");
    let pathname;
    try {
      pathname = decodeURIComponent(requestUrl.pathname);
    } catch {
      response.writeHead(400).end("bad path");
      return;
    }
    const requested = pathname.endsWith("/") ? `${pathname}index.html` : pathname;
    const path = resolve(absoluteRoot, `.${requested}`);
    const withinRoot = path === absoluteRoot || path.startsWith(`${absoluteRoot}${sep}`);
    if (!withinRoot || !existsSync(path) || !statSync(path).isFile()) {
      response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
      response.end("not found");
      return;
    }
    const bytes = readFileSync(path);
    const range = request.headers.range;
    if (range) {
      const match = /^bytes=(\d+)-(\d*)$/.exec(range);
      if (!match) {
        response.writeHead(416, { "content-range": `bytes */${bytes.length}` });
        response.end();
        return;
      }
      const start = Number(match[1]);
      const requestedEnd = match[2] ? Number(match[2]) : bytes.length - 1;
      const end = Math.min(requestedEnd, bytes.length - 1);
      if (!Number.isSafeInteger(start) || start < 0 || start > end) {
        response.writeHead(416, { "content-range": `bytes */${bytes.length}` });
        response.end();
        return;
      }
      response.writeHead(206, {
        "accept-ranges": "bytes",
        "cache-control": "no-store",
        "content-length": end - start + 1,
        "content-range": `bytes ${start}-${end}/${bytes.length}`,
        "content-type": MIME[extname(path).toLowerCase()] || "application/octet-stream",
      });
      response.end(bytes.subarray(start, end + 1));
      return;
    }
    response.writeHead(200, {
      "accept-ranges": "bytes",
      "cache-control": "no-store",
      "content-length": bytes.length,
      "content-type": MIME[extname(path).toLowerCase()] || "application/octet-stream",
    });
    response.end(bytes);
  });
  await new Promise((resolveReady) => server.listen(0, "127.0.0.1", resolveReady));
  const address = server.address();
  return {
    baseUrl: `http://127.0.0.1:${address.port}`,
    close: () => new Promise((resolveClosed) => server.close(resolveClosed)),
  };
}

function sameList(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

async function installTheme(context, theme) {
  await context.addInitScript((savedTheme) => {
    try {
      localStorage.setItem("snow-crystals-theme", savedTheme);
    } catch {
      // The initial about:blank document has an opaque origin. The same init
      // script runs again on the served page, where storage is available.
    }
  }, theme);
}

async function rootSignatures(page) {
  return page.evaluate(() => {
    function hashString(text) {
      let h1 = 0x811c9dc5;
      let h2 = 0x9e3779b9;
      for (let i = 0; i < text.length; i++) {
        const code = text.charCodeAt(i);
        h1 = Math.imul(h1 ^ code, 0x01000193) >>> 0;
        h2 = Math.imul(h2 ^ code, 0x85ebca6b) >>> 0;
      }
      return `${h1.toString(16).padStart(8, "0")}${h2.toString(16).padStart(8, "0")}`;
    }
    return [...document.querySelectorAll("figure.anim, figure.chart")].map((root) => {
      let material = root.innerHTML;
      for (const canvas of root.querySelectorAll("canvas")) {
        const context = canvas.getContext("2d");
        if (!context) continue;
        const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
        let h = 0x811c9dc5;
        for (let i = 0; i < pixels.length; i++) h = Math.imul(h ^ pixels[i], 0x01000193);
        material += `|canvas:${canvas.width}x${canvas.height}:${h >>> 0}`;
      }
      for (const video of root.querySelectorAll("video")) {
        material += `|video:${video.currentSrc}:${video.duration}:${video.readyState}`;
      }
      return [root.id, hashString(material)];
    });
  });
}

async function pageFacts(page) {
  return page.evaluate(() => {
    function accessibleName(control) {
      const direct = control.getAttribute("aria-label");
      if (direct && direct.trim()) return direct.trim();
      const labelledBy = control.getAttribute("aria-labelledby");
      if (labelledBy) {
        const text = labelledBy
          .split(/\s+/)
          .map((id) => document.getElementById(id)?.textContent || "")
          .join(" ")
          .trim();
        if (text) return text;
      }
      if (control.labels?.length) {
        const text = [...control.labels].map((label) => label.textContent || "").join(" ").trim();
        if (text) return text;
      }
      if (control.tagName === "BUTTON") return (control.textContent || "").trim();
      return "";
    }

    const roots = [...document.querySelectorAll("figure.anim, figure.chart")];
    const ids = roots.map((root) => root.id);
    const duplicateIds = [...document.querySelectorAll("[id]")]
      .map((element) => element.id)
      .filter((id, index, all) => all.indexOf(id) !== index);
    const emptyRoots = roots
      .filter((root) => {
        const body = root.querySelector(".anim__body") || root;
        return !body.querySelector("svg, canvas, img, video, table") && !(body.textContent || "").trim();
      })
      .map((root) => root.id);
    const unlabeledControls = [];
    for (const root of roots) {
      for (const control of root.querySelectorAll("button, input, select, textarea")) {
        if (!accessibleName(control)) unlabeledControls.push(`${root.id}:${control.tagName}`);
      }
    }
    const inaccessibleGraphics = [];
    for (const root of roots) {
      for (const graphic of root.querySelectorAll("canvas, svg")) {
        const hidden = graphic.getAttribute("aria-hidden") === "true";
        const name = graphic.getAttribute("aria-label")
          || graphic.querySelector(":scope > title")?.textContent
          || "";
        if (!hidden && !name.trim()) inaccessibleGraphics.push(`${root.id}:${graphic.tagName}`);
      }
    }
    const documentElement = document.documentElement;
    const theme = documentElement.getAttribute("data-theme");
    const links = [...document.querySelectorAll("a[href]")].map((anchor) => ({
      href: anchor.getAttribute("href"),
      absolute: anchor.href,
    }));
    const sourceFigures = [...document.querySelectorAll("figure.figure[data-src]")].map((figure) => {
      const images = [...figure.querySelectorAll("img")];
      return {
        source: figure.getAttribute("data-src"),
        images: images.length,
        placeholders: figure.querySelectorAll(".figure__missing").length,
        naturalWidths: images.map((image) => image.naturalWidth),
        currentSources: images.map((image) => image.currentSrc || image.src || ""),
      };
    });
    const embeddedMedia = [
      ...document.querySelectorAll("img, video, audio, source, track, object, embed, iframe"),
    ].flatMap((element) => {
      const candidates = [
        element.getAttribute("src"),
        element.getAttribute("srcset"),
        element.getAttribute("data"),
        element.currentSrc,
      ].filter(Boolean);
      return candidates
        .filter((value) => /^(?:data|blob):/i.test(value.trim()))
        .map((value) => `${element.tagName.toLowerCase()}:${value.slice(0, 48)}`);
    });
    const growth = document.getElementById("anim-real-growth");
    const growthVideo = growth?.querySelector("video") || null;
    return {
      ids,
      duplicateIds: [...new Set(duplicateIds)],
      emptyRoots,
      unlabeledControls,
      inaccessibleGraphics,
      scrollWidth: documentElement.scrollWidth,
      clientWidth: documentElement.clientWidth,
      theme,
      figures: document.querySelectorAll("figure.figure[data-src]").length,
      figureImages: document.querySelectorAll("figure.figure[data-src] img").length,
      figurePlaceholders: document.querySelectorAll("figure.figure[data-src] .figure__missing").length,
      sourceFigures,
      embeddedMedia,
      realGrowth: growth ? {
        mediaMode: growth.dataset.mediaMode,
        videoReady: growth.dataset.videoReady,
        localPathConfigured: growth.dataset.localPathConfigured,
        activeLocalAttribute: growth.hasAttribute("data-local-video"),
        inertOfflineMarker: growth.hasAttribute("data-offline-video-source"),
        videoCount: growth.querySelectorAll("video").length,
        duration: growthVideo?.duration || 0,
        videoSrc: growthVideo?.currentSrc || "",
      } : null,
      links,
    };
  });
}

async function exerciseControls(page) {
  return page.evaluate(async () => {
    const unchanged = [];
    const errors = [];
    const executed = [];
    let eligible = 0;

    function effect(root) {
      let value = root.innerHTML;
      for (const canvas of root.querySelectorAll("canvas")) {
        try { value += canvas.toDataURL(); } catch { value += "|canvas-unreadable"; }
      }
      return value;
    }

    function name(control) {
      return control.getAttribute("aria-label")
        || (control.labels?.length ? [...control.labels].map((label) => label.textContent).join(" ") : "")
        || control.textContent
        || control.tagName;
    }

    async function settle() {
      await new Promise((resolveFrame) =>
        requestAnimationFrame(() => requestAnimationFrame(resolveFrame)));
      await new Promise((resolveDelay) => setTimeout(resolveDelay, 80));
    }

    function moveValueControl(control) {
      if (control.matches('input[type="range"]')) {
        const value = Number(control.value);
        const min = Number(control.min);
        const max = Number(control.max);
        // Range maxima need not lie on the declared step grid. Browsers then
        // quantize `value` (1.301 -> 1.3, for example), so string equality
        // can choose the already-active endpoint. Always move toward the
        // farther endpoint.
        const target = Math.abs(value - min) < Math.abs(max - value) ? max : min;
        control.value = String(target);
        control.dispatchEvent(new Event("input", { bubbles: true }));
        control.dispatchEvent(new Event("change", { bubbles: true }));
        return true;
      }
      if (control.matches('input[type="checkbox"], input[type="radio"]')) {
        control.click();
        return true;
      }
      if (control.tagName === "SELECT" && control.options.length > 1) {
        control.selectedIndex = control.selectedIndex === 0 ? control.options.length - 1 : 0;
        control.dispatchEvent(new Event("input", { bubbles: true }));
        control.dispatchEvent(new Event("change", { bubbles: true }));
        return true;
      }
      return false;
    }

    for (const root of document.querySelectorAll("figure.anim, figure.chart")) {
      const controls = [...root.querySelectorAll("button")]
        .concat([...root.querySelectorAll("input, select")]);
      const repeatedControlGroups = new Set();
      for (const control of controls) {
        if (control.disabled) {
          // A disabled action may be truthful at the representative state
          // yet become available after a prerequisite input (for example,
          // the ESI feedback step below its illustrated threshold). Exercise
          // that reachable state instead of silently dropping the control.
          for (const setupControl of root.querySelectorAll("input, select")) {
            if (setupControl.disabled || !moveValueControl(setupControl)) continue;
            await settle();
            if (!control.disabled) break;
          }
          if (control.disabled) continue;
        }
        const repeatedGroup = control.dataset.control || "";
        if (repeatedGroup && repeatedControlGroups.has(repeatedGroup)) continue;
        if (repeatedGroup) repeatedControlGroups.add(repeatedGroup);
        eligible++;
        const label = name(control).trim().replace(/\s+/g, " ");
        try {
          if (control.tagName === "BUTTON") {
            // A selected mode button is a legitimate no-op unless another mode
            // is selected first. A reset/replay button likewise needs a state
            // worth resetting. Establish that precondition before measuring.
            if (control.getAttribute("aria-pressed") === "true") {
              const alternates = [...root.querySelectorAll('button[aria-pressed="false"]:not(:disabled)')]
                .filter((button) => button !== control);
              for (const alternate of alternates) {
                alternate.click();
                await settle();
                if (control.getAttribute("aria-pressed") === "false") break;
              }
            } else if (
              /\b(?:reset|restart|replay|start\s+(?:again|over)|back\s+to|measured\s+ice|fresh\s+terrace|zoom\s+out|poke\s+it\s+again|release\s+the\s+surface)\b/i
                .test(label)
            ) {
              // Establish the control's own reset state first. Comparing setup
              // only with the page's representative frame is insufficient:
              // a terminal manual Step can wrap to the same state that Restart
              // will produce, falsely making a working Restart look inert.
              control.click();
              await settle();
              const resetState = effect(root);
              const advanceButtons = [...root.querySelectorAll("button:not(:disabled)")]
                .filter((button) =>
                  button !== control
                  && /\b(?:step|grow|advance|run|add|swap|flip|pulse|develop|zoom\s+in)\b/i
                    .test(name(button)));
              for (const advance of advanceButtons) {
                for (let attempt = 0; attempt < 4; attempt++) {
                  advance.click();
                  await settle();
                  if (effect(root) !== resetState) break;
                }
                if (effect(root) !== resetState) break;
              }
              if (effect(root) === resetState) {
                const setupControls = [...root.querySelectorAll("input, select")]
                  .filter((candidate) => !candidate.disabled)
                  .sort((left, right) =>
                    Number(right.dataset.control === "schedule-clock")
                    - Number(left.dataset.control === "schedule-clock"));
                for (const setupControl of setupControls) {
                  if (!moveValueControl(setupControl)) continue;
                  await settle();
                  if (effect(root) !== resetState) break;
                }
              }
            }
          } else if (
            control.matches('input[type="radio"]')
            && control.checked
          ) {
            const alternate = [...root.querySelectorAll('input[type="radio"]:not(:disabled)')]
              .find((candidate) =>
                candidate !== control
                && candidate.name === control.name);
            if (alternate) {
              alternate.click();
              await settle();
            }
          }

          const before = effect(root);
          if (control.tagName === "BUTTON") {
            control.click();
          } else if (!moveValueControl(control)) {
            continue;
          }
          executed.push(`${root.id}:${label}`);
          await settle();
          let after = effect(root);
          let changed = before !== after;
          if (
            !changed
            && control.tagName === "BUTTON"
            && /\b(?:step|grow|advance)\b/i.test(label)
          ) {
            for (let attempt = 0; attempt < 7 && !changed; attempt++) {
              control.click();
              await settle();
              after = effect(root);
              changed = before !== after;
            }
            // Some scientifically valid states are stationary: the ESI toy,
            // for example, should not grow below its drawn threshold. Move a
            // model input, then compare the Step itself against that prepared
            // state. Comparing against the pre-input frame would let an inert
            // Step borrow the slider's visible change and pass.
            if (!changed) {
              for (const setupControl of root.querySelectorAll("input, select")) {
                if (setupControl.disabled || !moveValueControl(setupControl)) continue;
                await settle();
                const prepared = effect(root);
                control.click();
                await settle();
                after = effect(root);
                if (after !== prepared) {
                  changed = true;
                  break;
                }
              }
            }
          }
          if (!changed) {
            unchanged.push(`${root.id}:${label}`);
          }
        } catch (error) {
          errors.push(`${root.id}:${label}:${error.message}`);
        }
      }
    }
    return { unchanged, errors, executed, eligible };
  });
}

async function loadProfile(browser, baseUrl, pagePath, profile, mode) {
  const context = await browser.newContext({
    viewport: profile.viewport,
    colorScheme: profile.colorScheme,
    reducedMotion: profile.reducedMotion,
    deviceScaleFactor: 1,
  });
  await installTheme(context, profile.savedTheme);
  const page = await context.newPage();
  const errors = [];
  const badResponses = [];
  const forbiddenPublicRequests = [];
  const deferredMediaAborts = [];
  let certifiedOfflineMediaUrl = "";
  page.on("console", (message) => {
    if (message.type() !== "error") return;
    errors.push(`console: ${message.text()}`);
  });
  page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
  page.on("requestfailed", (request) => {
    const errorText = request.failure()?.errorText || "unknown";
    const failure = `requestfailed: ${request.url()} (${errorText})`;
    const cancellableOfflineMetadataRead =
      mode === "offline"
      && request.resourceType() === "media"
      && errorText === "net::ERR_ABORTED";
    if (cancellableOfflineMetadataRead) {
      // Chromium cancels an open-ended MP4 range after it has enough bytes
      // for metadata, and reports that client cancellation as ERR_ABORTED.
      // Defer judgment until the page proves that this exact video reached
      // loadedmetadata. Source-map hashing plus the separate play/seek oracle
      // still authenticate and execute the complete registered artifact.
      if (request.url() !== certifiedOfflineMediaUrl) {
        deferredMediaAborts.push({ url: request.url(), failure });
      }
      return;
    }
    errors.push(failure);
  });
  page.on("request", (request) => {
    if (mode !== "public") return;
    const type = request.resourceType();
    const url = new URL(request.url());
    const allowedType = ["document", "script", "stylesheet", "font"].includes(type);
    if (url.origin !== baseUrl || !allowedType) {
      forbiddenPublicRequests.push(`${type}: ${request.url()}`);
    }
  });
  page.on("response", (response) => {
    if (response.status() < 400) return;
    const url = new URL(response.url());
    badResponses.push(`${response.status()} ${url.pathname}`);
  });
  await page.goto(`${baseUrl}/${pagePath}`, { waitUntil: "networkidle", timeout: 30_000 });
  await page.evaluate(() => document.fonts?.ready || Promise.resolve());
  await page.waitForTimeout(profile.reducedMotion === "reduce" ? 100 : 450);
  const facts = await pageFacts(page);
  if (
    mode === "offline"
    && facts.realGrowth?.mediaMode === "local-video"
    && facts.realGrowth.videoReady === "true"
    && facts.realGrowth.duration > 0
    && facts.realGrowth.videoSrc
  ) {
    certifiedOfflineMediaUrl = facts.realGrowth.videoSrc;
  }
  for (const abort of deferredMediaAborts) {
    if (abort.url !== certifiedOfflineMediaUrl) errors.push(abort.failure);
  }
  const signatures = profile.capture ? await rootSignatures(page) : null;
  return { context, page, facts, signatures, errors, badResponses, forbiddenPublicRequests };
}

function factViolations(facts, expectedIds, expectedTheme, mode) {
  const violations = [];
  const add = (name, detail) => violations.push({ name, detail });
  if (!sameList(facts.ids, expectedIds)) {
    add("root inventory", `expected ${JSON.stringify(expectedIds)}, got ${JSON.stringify(facts.ids)}`);
  }
  if (facts.duplicateIds.length) add("unique IDs", facts.duplicateIds.join(", "));
  if (facts.emptyRoots.length) add("mounted roots", `empty: ${facts.emptyRoots.join(", ")}`);
  if (facts.unlabeledControls.length) {
    add("accessible controls", facts.unlabeledControls.join(", "));
  }
  if (facts.inaccessibleGraphics.length) {
    add("accessible graphics", facts.inaccessibleGraphics.join(", "));
  }
  if (facts.scrollWidth > facts.clientWidth + 1) {
    add("horizontal layout", `${facts.scrollWidth} > ${facts.clientWidth}`);
  }
  if (facts.theme !== expectedTheme) {
    add("persisted theme", `expected ${expectedTheme}, got ${facts.theme}`);
  }
  if (mode === "public" && facts.embeddedMedia.length) {
    add("public embedded-media boundary", facts.embeddedMedia.join(", "));
  }
  const badSourceFigures = facts.sourceFigures.filter((figure) => {
    if (mode === "public") return figure.images !== 0 || figure.placeholders !== 1;
    return figure.images !== 1
      || figure.placeholders !== 0
      || figure.naturalWidths.length !== 1
      || !(figure.naturalWidths[0] > 0);
  });
  if (badSourceFigures.length) {
    add(
      mode === "public" ? "public source-card boundary" : "offline source-image resolution",
      JSON.stringify(badSourceFigures),
    );
  }
  if (facts.realGrowth && mode === "public") {
    const growth = facts.realGrowth;
    if (
      growth.mediaMode !== "source-card"
      || growth.videoReady !== "false"
      || growth.localPathConfigured !== "false"
      || growth.activeLocalAttribute
      || !growth.inertOfflineMarker
      || growth.videoCount !== 0
    ) {
      add("public real-growth boundary", JSON.stringify(growth));
    }
  }
  if (facts.realGrowth && mode === "offline") {
    const growth = facts.realGrowth;
    if (
      growth.mediaMode !== "local-video"
      || growth.videoReady !== "true"
      || growth.localPathConfigured !== "true"
      || !growth.activeLocalAttribute
      || growth.inertOfflineMarker
      || growth.videoCount !== 1
      || !(growth.duration > 0)
    ) {
      add("offline real-growth media", JSON.stringify(growth));
    }
  }
  return violations;
}

function checkFacts(label, facts, expectedIds, expectedTheme, mode) {
  for (const violation of factViolations(facts, expectedIds, expectedTheme, mode)) {
    fail(`${label} ${violation.name}`, violation.detail);
  }
}

function verifyInternalLinks(root, pagePath, baseUrl, facts) {
  for (const link of facts.links) {
    if (!link.href || /^(?:mailto:|javascript:)/i.test(link.href)) continue;
    const url = new URL(link.absolute);
    if (url.origin !== baseUrl) continue;
    const pathname = decodeURIComponent(url.pathname.replace(/^\/+/, ""));
    const target = pathname || "index.html";
    const absolute = resolve(root, target);
    const inside = absolute === resolve(root) || absolute.startsWith(`${resolve(root)}${sep}`);
    if (!inside || !existsSync(absolute)) {
      fail(`${pagePath} internal link`, `${link.href} resolves to missing ${target}`);
      continue;
    }
    if (url.hash && extname(absolute).toLowerCase() === ".html") {
      const id = decodeURIComponent(url.hash.slice(1));
      const html = readFileSync(absolute, "utf8");
      const escaped = id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      if (!new RegExp(`\\bid=["']${escaped}["']`).test(html)) {
        fail(`${pagePath} internal fragment`, `${link.href} targets missing #${id}`);
      }
    }
  }
}

const PROFILES = Object.freeze({
  desktop: {
    viewport: { width: 1440, height: 1000 },
    colorScheme: "light",
    savedTheme: "light",
    reducedMotion: "no-preference",
    capture: false,
  },
  mobile: {
    viewport: { width: 390, height: 844 },
    colorScheme: "dark",
    savedTheme: "dark",
    reducedMotion: "no-preference",
    capture: false,
  },
  storedDarkOsLight: {
    viewport: { width: 1100, height: 800 },
    colorScheme: "light",
    savedTheme: "dark",
    reducedMotion: "reduce",
    capture: true,
  },
  storedDarkOsDark: {
    viewport: { width: 1100, height: 800 },
    colorScheme: "dark",
    savedTheme: "dark",
    reducedMotion: "reduce",
    capture: true,
  },
  storedLightOsDark: {
    viewport: { width: 1100, height: 800 },
    colorScheme: "dark",
    savedTheme: "light",
    reducedMotion: "reduce",
    capture: true,
  },
  storedLightOsLight: {
    viewport: { width: 1100, height: 800 },
    colorScheme: "light",
    savedTheme: "light",
    reducedMotion: "reduce",
    capture: true,
  },
});

async function verifySite(browser, mode, root) {
  const server = await serve(root);
  const failuresAtStart = failures.length;
  try {
    let pageChecks = 0;
    for (const pagePath of PAGE_PATHS) {
      const expected = MANIFEST[pagePath];
      const loaded = {};
      for (const [profileName, profile] of Object.entries(PROFILES)) {
        const result = await loadProfile(browser, server.baseUrl, pagePath, profile, mode);
        loaded[profileName] = result;
        const label = `${mode}:${pagePath}:${profileName}`;
        checkFacts(label, result.facts, expected, profile.savedTheme, mode);
        if (result.errors.length) fail(`${label} runtime`, result.errors.join(" | "));
        if (result.badResponses.length) fail(`${label} responses`, result.badResponses.join(" | "));
        if (result.forbiddenPublicRequests.length) {
          fail(`${label} forbidden public request`, result.forbiddenPublicRequests.join(" | "));
        }
        result.checkedErrors = result.errors.length;
        result.checkedResponses = result.badResponses.length;
        result.checkedForbiddenRequests = result.forbiddenPublicRequests.length;
        if (profileName === "desktop") verifyInternalLinks(root, pagePath, server.baseUrl, result.facts);
        if (screenshots && profileName === "desktop") {
          const path = join(OUT, mode, pagePath.replace(/[\\/]/g, "--"));
          mkdirSync(resolve(path, ".."), { recursive: true });
          await result.page.screenshot({ path: `${path}.png`, fullPage: true });
        }
        pageChecks++;
      }

      const darkA = loaded.storedDarkOsLight.signatures;
      const darkB = loaded.storedDarkOsDark.signatures;
      if (!sameList(darkA, darkB)) {
        fail(`${mode}:${pagePath} stored-dark/OS mismatch`, "visual-root signatures differ");
      }
      const lightA = loaded.storedLightOsDark.signatures;
      const lightB = loaded.storedLightOsLight.signatures;
      if (!sameList(lightA, lightB)) {
        fail(`${mode}:${pagePath} stored-light/OS mismatch`, "visual-root signatures differ");
      }

      const repeat = await loadProfile(
        browser,
        server.baseUrl,
        pagePath,
        PROFILES.storedLightOsLight,
        mode,
      );
      if (!sameList(lightB, repeat.signatures)) {
        fail(`${mode}:${pagePath} deterministic reduced-motion load`, "visual-root signatures differ");
      }
      const controls = await exerciseControls(repeat.page);
      await repeat.page.waitForTimeout(150);
      if (controls.errors.length) fail(`${mode}:${pagePath} control execution`, controls.errors.join(" | "));
      if (controls.unchanged.length) {
        fail(`${mode}:${pagePath} controls change output`, controls.unchanged.join(", "));
      }
      if (controls.executed.length !== controls.eligible) {
        fail(
          `${mode}:${pagePath} control execution inventory`,
          `executed ${controls.executed.length}/${controls.eligible}`,
        );
      }
      const afterControlFacts = await pageFacts(repeat.page);
      checkFacts(
        `${mode}:${pagePath}:after-controls`,
        afterControlFacts,
        expected,
        PROFILES.storedLightOsLight.savedTheme,
        mode,
      );
      if (repeat.errors.length) {
        fail(`${mode}:${pagePath} post-control runtime`, repeat.errors.join(" | "));
      }
      if (repeat.badResponses.length) {
        fail(`${mode}:${pagePath} post-control responses`, repeat.badResponses.join(" | "));
      }
      if (repeat.forbiddenPublicRequests.length) {
        fail(
          `${mode}:${pagePath} post-control forbidden public request`,
          repeat.forbiddenPublicRequests.join(" | "),
        );
      }
      await repeat.context.close();
      for (const [profileName, result] of Object.entries(loaded)) {
        const label = `${mode}:${pagePath}:${profileName}:late`;
        const lateErrors = result.errors.slice(result.checkedErrors);
        const lateResponses = result.badResponses.slice(result.checkedResponses);
        const lateForbidden = result.forbiddenPublicRequests.slice(result.checkedForbiddenRequests);
        if (lateErrors.length) fail(`${label} runtime`, lateErrors.join(" | "));
        if (lateResponses.length) fail(`${label} responses`, lateResponses.join(" | "));
        if (lateForbidden.length) fail(`${label} forbidden public request`, lateForbidden.join(" | "));
        await result.context.close();
      }
    }
    if (failures.length === failuresAtStart) {
      pass(`${mode} browser matrix (${pageChecks} profile loads plus deterministic repeats)`);
    }
  } finally {
    await server.close();
  }
}

const capturedScientificEvidence = Object.create(null);

function diffusionEvidenceViolations(diffusion) {
  if (diffusion.missing) return ["missing hook"];
  const violations = [];
  if (diffusion.radius !== 58 || diffusion.width !== 117) violations.push("lattice constants");
  if (diffusion.actualLiveCount !== diffusion.expectedLiveCount) violations.push("live count");
  if (!diffusion.liveMatches) violations.push("published live set");
  if (!diffusion.arraysHaveExpectedLength) violations.push("array lengths");
  if (diffusion.jacobiMaxError !== 0 || diffusion.jacobiMismatches !== 0) {
    violations.push("Jacobi sweep");
  }
  if (!(diffusion.changedInterior > 0)) violations.push("non-vacuous sweep");
  if (
    diffusion.vapour !== 0
    || diffusion.fill !== 0
    || diffusion.solidMismatches !== 0
  ) {
    violations.push("D6 orbit");
  }
  if (
    !(diffusion.solidCount > 7)
    || !(diffusion.solidCount < diffusion.actualLiveCount)
    || !(diffusion.derivedRadius > 1)
  ) {
    violations.push("non-vacuous growth");
  }
  if (!diffusion.finite) violations.push("finite state");
  return violations;
}

function zooGrowthViolations(zoo) {
  if (zoo.missing) return ["missing hook"];
  const violations = [];
  if (
    zoo.constants.radius !== 46
    || zoo.constants.seedRadius !== 2
    || zoo.constants.edgeGuardRadius !== 42
    || zoo.constants.maxTicks !== 12000
  ) {
    violations.push("constants");
  }
  if (zoo.actualLiveCount !== zoo.expectedLiveCount) violations.push("live count");
  for (const row of zoo.rows) {
    const invalid = Math.abs(row.drift) > 2e-9
      || row.initial.attachedCount !== 19
      || row.terminal.attachedCount <= row.initial.attachedCount
      || !row.initial.liveMatches
      || !row.terminal.liveMatches
      || !row.initial.arraysHaveExpectedLength
      || !row.terminal.arraysHaveExpectedLength
      || !row.initial.finite
      || !row.terminal.finite
      || !row.initial.nonnegative
      || !row.terminal.nonnegative
      || !row.terminal.stopped
      || !(row.edgeGuardReached || row.workGuardReached)
      || row.terminal.tick <= 0
      || row.terminal.tick > zoo.constants.maxTicks
      || row.haltChangedCells !== 0
      || (row.edgeGuardReached
        ? !/edge guard/i.test(row.terminal.stopReason)
        : !/work guard/i.test(row.terminal.stopReason))
      || /vapou?r exhausted/i.test(row.terminal.stopReason)
      || !Number.isFinite(row.terminal.maxBoundary)
      || row.terminal.vapourOrbitError !== 0
      || row.terminal.boundaryOrbitError !== 0
      || row.terminal.attachedOrbitMismatches !== 0;
    if (invalid) violations.push(row.preset);
  }
  return violations;
}

function zooDensityViolations(zoo) {
  if (zoo.missing) return ["missing hook"];
  const density = zoo.density;
  const violations = [];
  if (density.beforeTick !== 80) violations.push("pre-reset execution");
  if (density.reset.tick !== 0 || density.reset.stopped) violations.push("reset state");
  if (density.reset.attachedCount !== 19 || density.reset.radius !== 2) {
    violations.push("canonical seed");
  }
  if (density.resetMismatches !== 0) violations.push("raw reset arrays");
  if (Math.abs(density.reset.mass - density.expectedMass) >= 1e-9) {
    violations.push("reset mass");
  }
  return violations;
}

async function verifyScientificModels(browser, root, mode) {
  const server = await serve(root);
  const context = await browser.newContext({
    reducedMotion: "reduce",
    colorScheme: "light",
    viewport: { width: 1000, height: 800 },
  });
  await installTheme(context, "light");
  const page = await context.newPage();
  try {
    await page.goto(`${server.baseUrl}/chapters/06-the-runaway-bump.html`, {
      waitUntil: "networkidle",
    });
    const diffusion = await page.evaluate(() => {
      const hook = window.EducationTestHooks?.diffusion;
      if (!hook) return { missing: true };
      const options = { seed: 1, pace: 0.015, stick: 0.5, sweeps: 4 };
      const R = hook.constants.radius;
      const W = hook.constants.width;
      const index = (q, r) => (r + R) * W + (q + R);
      const inside = (q, r) =>
        Math.max(Math.abs(q), Math.abs(r), Math.abs(q + r)) <= R;
      const directions = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, -1], [-1, 1]];
      const expectedLive = [];
      for (let r = -R; r <= R; r++) {
        for (let q = -R; q <= R; q++) {
          if (inside(q, r)) expectedLive.push(index(q, r));
        }
      }

      function pairInvariantSum(values) {
        const pairs = [
          values[0] + values[1],
          values[2] + values[3],
          values[4] + values[5],
        ].sort((a, b) => a - b);
        return (pairs[0] + pairs[1]) + pairs[2];
      }

      const sweepModel = hook.create(options);
      const initial = sweepModel.snapshot();
      const swept = sweepModel.settle(1);
      let jacobiMaxError = 0;
      let jacobiMismatches = 0;
      let changedInterior = 0;
      for (const i of expectedLive) {
        const q = (i % W) - R;
        const r = Math.floor(i / W) - R;
        const distance = Math.max(Math.abs(q), Math.abs(r), Math.abs(q + r));
        let expected;
        if (initial.solid[i]) {
          expected = 0;
        } else if (distance === R) {
          expected = 1;
        } else {
          const neighbours = directions.map(([dq, dr]) => {
            const nq = q + dq;
            const nr = r + dr;
            return inside(nq, nr) ? initial.vapour[index(nq, nr)] : 1;
          });
          expected = pairInvariantSum(neighbours) / 6;
        }
        const error = Math.abs(swept.vapour[i] - expected);
        jacobiMaxError = Math.max(jacobiMaxError, error);
        if (error !== 0) jacobiMismatches++;
        if (swept.vapour[i] !== initial.vapour[i]) changedInterior++;
      }

      const state = hook.create(options).advance(2000);
      const publishedLive = Array.from(state.live);
      const arraysHaveExpectedLength = [
        state.vapour, state.fill, state.solid,
      ].every((array) => array.length === W * W);
      const liveMatches = publishedLive.length === expectedLive.length
        && publishedLive.every((value, position) => value === expectedLive[position]);
      let vapour = 0;
      let fill = 0;
      let solidMismatches = 0;
      let solidCount = 0;
      let finite = true;
      let derivedRadius = 0;
      for (const i of expectedLive) {
        const q = (i % W) - R;
        const r = Math.floor(i / W) - R;
        if (!Number.isFinite(state.vapour[i]) || !Number.isFinite(state.fill[i])) finite = false;
        if (state.solid[i]) {
          solidCount++;
          derivedRadius = Math.max(
            derivedRadius,
            Math.max(Math.abs(q), Math.abs(r), Math.abs(q + r)),
          );
        }
        for (const j of [index(-r, q + r), index(r, q)]) {
          vapour = Math.max(vapour, Math.abs(state.vapour[i] - state.vapour[j]));
          fill = Math.max(fill, Math.abs(state.fill[i] - state.fill[j]));
          if (state.solid[i] !== state.solid[j]) solidMismatches++;
        }
      }
      return {
        missing: false,
        radius: R,
        width: W,
        expectedLiveCount: 1 + 3 * R * (R + 1),
        actualLiveCount: expectedLive.length,
        arraysHaveExpectedLength,
        liveMatches,
        jacobiMaxError,
        jacobiMismatches,
        changedInterior,
        vapour,
        fill,
        solidMismatches,
        solidCount,
        derivedRadius,
        finite,
      };
    });
    capturedScientificEvidence.diffusion = structuredClone(diffusion);
    const diffusionViolations = diffusionEvidenceViolations(diffusion);
    requireCheck(
      diffusionViolations.length === 0,
      "diffusion executes one exact double-buffered Jacobi sweep and remains D6-equivariant through 2,000 growth steps",
      JSON.stringify({ violations: diffusionViolations, evidence: diffusion }),
    );

    await page.goto(`${server.baseUrl}/chapters/09-the-menagerie.html`, {
      waitUntil: "networkidle",
    });
    const zoo = await page.evaluate(() => {
      const hook = window.EducationTestHooks?.ggZoo;
      if (!hook) return { missing: true };
      const presets = ["hexagon", "plate", "needles", "dendrite"];
      const R = hook.constants.radius;
      const W = 2 * R + 1;
      const index = (q, r) => (r + R) * W + (q + R);
      const inside = (q, r) =>
        Math.max(Math.abs(q), Math.abs(r), Math.abs(q + r)) <= R;
      const directions = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, -1], [-1, 1]];
      const expectedLive = [];
      for (let r = -R; r <= R; r++) {
        for (let q = -R; q <= R; q++) {
          if (inside(q, r)) expectedLive.push(index(q, r));
        }
      }

      function analyze(state) {
        let mass = 0;
        let correction = 0;
        let maxBoundary = 0;
        let attachedCount = 0;
        let radius = 0;
        let finite = true;
        let nonnegative = true;
        let vapourOrbitError = 0;
        let boundaryOrbitError = 0;
        let attachedOrbitMismatches = 0;
        for (const i of expectedLive) {
          const q = (i % W) - R;
          const r = Math.floor(i / W) - R;
          const vapour = state.vapour[i];
          const boundary = state.boundary[i];
          if (!Number.isFinite(vapour) || !Number.isFinite(boundary)) finite = false;
          if (vapour < 0 || boundary < 0) nonnegative = false;
          const y = vapour + boundary - correction;
          const next = mass + y;
          correction = (next - mass) - y;
          mass = next;
          if (state.attached[i]) {
            attachedCount++;
            radius = Math.max(
              radius,
              Math.max(Math.abs(q), Math.abs(r), Math.abs(q + r)),
            );
          } else if (boundary > maxBoundary) {
            const isBoundary = directions.some(([dq, dr]) => {
              const nq = q + dq;
              const nr = r + dr;
              return inside(nq, nr) && state.attached[index(nq, nr)] !== 0;
            });
            if (isBoundary) maxBoundary = boundary;
          }
          for (const j of [index(-r, q + r), index(r, q)]) {
            vapourOrbitError = Math.max(
              vapourOrbitError,
              Math.abs(vapour - state.vapour[j]),
            );
            boundaryOrbitError = Math.max(
              boundaryOrbitError,
              Math.abs(boundary - state.boundary[j]),
            );
            if (state.attached[i] !== state.attached[j]) attachedOrbitMismatches++;
          }
        }
        const publishedLive = Array.from(state.live);
        return {
          tick: state.tick,
          stopped: state.stopped,
          stopReason: state.stopReason,
          mass,
          maxBoundary,
          attachedCount,
          radius,
          finite,
          nonnegative,
          arraysHaveExpectedLength: [
            state.vapour, state.boundary, state.attached,
          ].every((array) => array.length === W * W),
          liveMatches: publishedLive.length === expectedLive.length
            && publishedLive.every((value, position) => value === expectedLive[position]),
          vapourOrbitError,
          boundaryOrbitError,
          attachedOrbitMismatches,
        };
      }

      function changedCells(a, b) {
        let changed = a.tick === b.tick ? 0 : 1;
        for (const i of expectedLive) {
          if (
            a.vapour[i] !== b.vapour[i]
            || a.boundary[i] !== b.boundary[i]
            || a.attached[i] !== b.attached[i]
          ) changed++;
        }
        return changed;
      }

      const rows = [];
      for (const preset of presets) {
        const model = hook.create({ preset });
        const initial = model.snapshot();
        const terminal = model.advance(hook.constants.maxTicks + 1);
        const afterGuard = model.advance(1);
        const initialAnalysis = analyze(initial);
        const terminalAnalysis = analyze(terminal);
        rows.push({
          preset,
          initial: initialAnalysis,
          terminal: terminalAnalysis,
          drift: terminalAnalysis.mass - initialAnalysis.mass,
          haltChangedCells: changedCells(terminal, afterGuard),
          edgeGuardReached: terminalAnalysis.radius >= hook.constants.edgeGuardRadius,
          workGuardReached: terminal.tick >= hook.constants.maxTicks,
        });
      }
      const densityModel = hook.create({ preset: "hexagon" });
      const densityBefore = densityModel.advance(80);
      const densityReset = densityModel.resetDensity(0.6);
      const densityAnalysis = analyze(densityReset);
      let densityResetMismatches = 0;
      for (const i of expectedLive) {
        const q = (i % W) - R;
        const r = Math.floor(i / W) - R;
        const seed = Math.max(Math.abs(q), Math.abs(r), Math.abs(q + r)) <= 2;
        if (
          densityReset.attached[i] !== Number(seed)
          || densityReset.boundary[i] !== 0
          || densityReset.vapour[i] !== (seed ? 0 : 0.6)
        ) {
          densityResetMismatches++;
        }
      }
      return {
        missing: false,
        constants: {
          radius: R,
          seedRadius: hook.constants.seedRadius,
          edgeGuardRadius: hook.constants.edgeGuardRadius,
          maxTicks: hook.constants.maxTicks,
        },
        expectedLiveCount: 1 + 3 * R * (R + 1),
        actualLiveCount: expectedLive.length,
        rows,
        density: {
          beforeTick: densityBefore.tick,
          reset: densityAnalysis,
          resetMismatches: densityResetMismatches,
          expectedMass: 0.6 * (expectedLive.length - 19),
        },
      };
    });
    capturedScientificEvidence.zoo = structuredClone(zoo);
    const zooViolations = zooGrowthViolations(zoo);
    requireCheck(
      zooViolations.length === 0,
      "G-G zoo conserves independently recomputed mass, remains D6-equivariant, and halts at a derived finite-domain/work guard",
      JSON.stringify(zooViolations),
    );
    const densityViolations = zooDensityViolations(zoo);
    requireCheck(
      densityViolations.length === 0,
      "G-G background-density change reconstructs the canonical seed and requested field from raw arrays",
      JSON.stringify(densityViolations),
    );

    await page.goto(`${server.baseUrl}/chapters/05-the-restless-surface.html`, {
      waitUntil: "networkidle",
    });
    const facet = await page.evaluate(() => {
      const hook = window.EducationTestHooks?.facetProcesses;
      if (!hook) return { missing: true };
      const temperatures = [-1, -2, -3, -5, -7, -15];
      return {
        missing: false,
        rows: temperatures.map((temperature) =>
          hook.evaluate("facet-additive", temperature, 0.2)),
        cm7Large: hook.evaluate("cm7-large", -2, 0.2),
        cm7Rough: hook.evaluate("cm7-rough", -2, 0.2),
      };
    });
    const sourceFacetRows = [
      { A1: 0.30, barrier1Percent: 0.003, A2: 0.70, barrier2Percent: 0.10 },
      { A1: 0.25, barrier1Percent: 0.030, A2: 0.75, barrier2Percent: 0.15 },
      { A1: 0.20, barrier1Percent: 0.100, A2: 0.80, barrier2Percent: 0.30 },
      { A1: 0.20, barrier1Percent: 0.200, A2: 0.80, barrier2Percent: 0.55 },
      { A1: 0.50, barrier1Percent: 0.800, A2: 0.50, barrier2Percent: 1.00 },
      { A1: 1.00, barrier1Percent: 3.000, A2: 0.00, barrier2Percent: 0 },
    ];
    const facetErrors = facet.missing
      ? ["missing hook"]
      : facet.rows.map((row, index) => {
        const source = sourceFacetRows[index];
        const expectedOne = source.A1 * Math.exp(-source.barrier1Percent / 0.2);
        const expectedTwo = source.A2
          ? source.A2 * Math.exp(-source.barrier2Percent / 0.2)
          : 0;
        return Math.max(
          Math.abs(row.component1 - expectedOne),
          Math.abs(row.component2 - expectedTwo),
          Math.abs(row.alphaHK - expectedOne - expectedTwo),
        );
      });
    requireCheck(
      facetErrors.length === 6 && Math.max(...facetErrors) < 1e-12,
      "FACET explorer independently reproduces all six Table 1 additive rows",
      JSON.stringify(facetErrors),
    );
    const expectedCm7Large = 0.25 * Math.exp(-0.03 / 0.2);
    const expectedCm7Rough = Math.exp(-0.15 / 0.2);
    requireCheck(
      !facet.missing
        && Math.abs(facet.cm7Large.alphaHK - expectedCm7Large) < 1e-12
        && Math.abs(facet.cm7Rough.alphaHK - expectedCm7Rough) < 1e-12
        && facet.cm7Large.component2 === 0
        && facet.cm7Rough.component1 === 0,
      "CM7 explorer keeps the two printed branches mutually exclusive",
      facet.missing ? "missing hook" : JSON.stringify({
        large: facet.cm7Large,
        rough: facet.cm7Rough,
      }),
    );

    await page.goto(`${server.baseUrl}/chapters/04-the-fuel-supply.html`, {
      waitUntil: "networkidle",
    });
    const aerodynamics = await page.evaluate(() => {
      const hook = window.EducationTestHooks?.aerodynamics;
      if (!hook) return { missing: true };
      const reynoldsControl =
        document.querySelector('#anim-aerodynamics [data-control="log10-reynolds"]');
      reynoldsControl.value = "2";
      reynoldsControl.dispatchEvent(new Event("input", { bubbles: true }));
      const baselineBar =
        document.querySelector('#anim-aerodynamics [data-role="still-air-bar"]');
      const flowBar =
        document.querySelector('#anim-aerodynamics [data-role="ventilated-air-bar"]');
      return {
        missing: false,
        factors: [0.5, 1, 4, 100].map((reynolds) => hook.ventilationFactor(reynolds)),
        orientations: [
          hook.evaluate("plate", 0.05, 0.5).orientation,
          hook.evaluate("plate", 0.45, 0.5).orientation,
          hook.evaluate("column", 0.45, 0.5).orientation,
          hook.evaluate("plate", 1.5, 0.5).orientation,
        ],
        renderedAtRe100: {
          baselineHeight: Number(baselineBar.getAttribute("height")),
          flowHeight: Number(flowBar.getAttribute("height")),
          flowY: Number(flowBar.getAttribute("y")),
        },
      };
    });
    const expectedFactors = [1.05, 1.1, 1.4, 3.8];
    requireCheck(
      !aerodynamics.missing
        && aerodynamics.factors.every((value, index) =>
          Math.abs(value - expectedFactors[index]) < 1e-12),
      "aerodynamics explorer reproduces both branches of source Eq. 3.53 without clipping",
      JSON.stringify(aerodynamics),
    );
    requireCheck(
      !aerodynamics.missing
        && Math.abs(aerodynamics.renderedAtRe100.baselineHeight - 47.5) < 1e-9
        && Math.abs(aerodynamics.renderedAtRe100.flowHeight - 180.5) < 1e-9
        && Math.abs(
          aerodynamics.renderedAtRe100.flowHeight
            / aerodynamics.renderedAtRe100.baselineHeight
          - 3.8,
        ) < 1e-12
        && aerodynamics.renderedAtRe100.flowY >= 82,
      "aerodynamics Re=100 bar renders the full 3.8-fold value inside its 4.0 scale",
      JSON.stringify(aerodynamics.renderedAtRe100),
    );
    requireCheck(
      !aerodynamics.missing
        && sameList(aerodynamics.orientations, [
          "turbulence-dominated",
          "basal-horizontal",
          "c-axis-horizontal",
          "flutter-or-tumble",
        ]),
      "aerodynamics explorer preserves its four explicitly qualitative orientation classes",
      JSON.stringify(aerodynamics),
    );

    await page.goto(`${server.baseUrl}/chapters/08-a-snowflake-is-a-record.html`, {
      waitUntil: "networkidle",
    });
    const ribs = await page.evaluate(() => {
      const hook = window.EducationTestHooks?.ribSchedule;
      if (!hook) return { missing: true };
      const schedule = hook.computeSchedule(0.5, 30, 50);
      return {
        missing: false,
        dipGrowthRate: schedule.dipGrowthRate,
        ribWidth: schedule.ribWidth,
        clearGap: schedule.clearGap,
        crestSpacing: schedule.crestSpacing,
        firstDipEnd: hook.stateAt(schedule, 80),
        terminal: hook.stateAt(schedule, schedule.totalTime),
      };
    });
    requireCheck(
      !ribs.missing
        && Math.abs(ribs.dipGrowthRate - 0.575) < 1e-12
        && Math.abs(ribs.ribWidth - 17.25) < 1e-12
        && Math.abs(ribs.clearGap - 50) < 1e-12
        && Math.abs(ribs.crestSpacing - 67.25) < 1e-12,
      "rib replay distinguishes clear gap, rib width, and crest-to-crest spacing",
      JSON.stringify(ribs),
    );
    requireCheck(
      !ribs.missing
        && ribs.firstDipEnd.kind === "restored"
        && ribs.firstDipEnd.completedRibs === 1
        && ribs.terminal.kind === "complete"
        && ribs.terminal.completedRibs === 4,
      "rib replay assigns shared segment endpoints and terminal state consistently",
      JSON.stringify(ribs),
    );

    await page.goto(`${server.baseUrl}/chapters/07-plates-columns-plates-columns.html`, {
      waitUntil: "networkidle",
    });
    const matrix = await page.evaluate(() => {
      const hook = window.EducationTestHooks?.morphologyMatrix;
      if (!hook) return { missing: true };
      const inventory = hook.inventory();
      const allCells = {};
      for (const [dataset, info] of Object.entries(inventory.datasets)) {
        allCells[dataset] = [];
        for (const temperature of info.temperatures) {
          for (const supersaturation of info.supersaturations) {
            const reason = hook.missingCell(dataset, temperature, supersaturation);
            if (reason) allCells[dataset].push(`${temperature}|${supersaturation}`);
          }
        }
      }
      const selections = [
        hook.selectPlate("tax1", -5),
        hook.selectPlate("tax1", -21),
        hook.selectPlate("tax2", -12),
        hook.selectPlate("tax2", -24),
      ];
      const metadata = {
        tax1: hook.metadata("tax1", -5, 32),
        tax2Shortest: hook.metadata("tax2", -4.5, 150),
        tax2Longest: hook.metadata("tax2", -12, 10),
        tax2Largest: hook.metadata("tax2", -16, 100),
        tax2Smallest: hook.metadata("tax2", -22, 15),
      };

      const dataset = document.querySelector(
        '#anim-morphology-matrix [data-control="matrix-dataset"]',
      );
      const temperature = document.querySelector(
        '#anim-morphology-matrix [data-control="matrix-temperature-c"]',
      );
      const supersaturation = document.querySelector(
        '#anim-morphology-matrix [data-control="matrix-sigma-infinity-percent"]',
      );
      dataset.value = "tax2";
      dataset.dispatchEvent(new Event("change", { bubbles: true }));
      temperature.value = "-12";
      temperature.dispatchEvent(new Event("change", { bubbles: true }));
      supersaturation.value = "10";
      supersaturation.dispatchEvent(new Event("change", { bubbles: true }));
      const root = document.getElementById("anim-morphology-matrix");
      const selectedPlate = root.querySelector("[data-matrix-source-plate]:not([hidden])");
      const zoomIn = root.querySelector('[data-control="matrix-zoom-in"]');
      return {
        missing: false,
        inventory,
        allCells,
        selections,
        metadata,
        rendered: {
          dataset: root.dataset.selectedDataset,
          temperature: root.dataset.selectedTemperature,
          supersaturation: root.dataset.selectedSupersaturation,
          missing: root.dataset.selectedCellMissing,
          page: selectedPlate?.getAttribute("data-page") || "",
          sourceImageAvailable: root.dataset.sourceImageAvailable,
          zoomDisabled: zoomIn.disabled,
          status: root.querySelector('[data-test-hook="matrix-selection-status"]')?.textContent || "",
        },
      };
    });
    const tax1Temperatures = [
      -0.5, -1, -2, -3, -4, -5, -6, -7, -8, -9,
      -10, -11, -12, -13, -14, -15, -16, -17, -18, -21,
    ];
    const tax2Temperatures = [
      -0.5, -1, -2, -3, -4, -4.5, -5, -6, -7, -8, -9, -10,
      -11, -12, -13, -14, -15, -16, -17, -18, -19, -20, -22, -24,
    ];
    const expectedTax2Blanks = [
      "-0.5|100", "-0.5|150", "-1|150", "-2|150", "-18|150",
      "-19|150", "-20|150", "-22|150", "-24|100", "-24|150",
    ].sort();
    requireCheck(
      !matrix.missing
        && sameList(matrix.inventory.datasets.tax1.temperatures, tax1Temperatures)
        && sameList(matrix.inventory.datasets.tax1.supersaturations, [128, 64, 32, 16, 8])
        && matrix.inventory.datasets.tax1.observationCount === 97
        && matrix.inventory.datasets.tax1.missingCellCount === 3
        && sameList(matrix.allCells.tax1.sort(), ["-0.5|128", "-18|128", "-21|128"].sort())
        && sameList(matrix.inventory.datasets.tax2.temperatures, tax2Temperatures)
        && sameList(matrix.inventory.datasets.tax2.supersaturations, [150, 100, 70, 45, 30, 20, 15, 10, 7])
        && matrix.inventory.datasets.tax2.observationCount === 206
        && matrix.inventory.datasets.tax2.missingCellCount === 10
        && sameList(matrix.allCells.tax2.sort(), expectedTax2Blanks)
        && matrix.inventory.plates.length === 9,
      "morphology browser exposes the complete 97/206 observation grids and exactly their 3/10 documented blank cells",
      JSON.stringify(matrix.missing ? matrix : {
        datasets: matrix.inventory.datasets,
        plates: matrix.inventory.plates.length,
        blanks: matrix.allCells,
      }),
    );
    requireCheck(
      !matrix.missing
        && matrix.selections[0]?.figure === "Figure 24b"
        && matrix.selections[0]?.page === "PDF p. 20"
        && matrix.selections[1]?.figure === "Figure 24e"
        && matrix.selections[1]?.page === "PDF p. 23"
        && matrix.selections[2]?.figure === "Figure 2, page 3 of 4"
        && matrix.selections[2]?.page === "PDF p. 13"
        && matrix.selections[3]?.figure === "Figure 2, page 4 of 4"
        && matrix.selections[3]?.page === "PDF p. 14"
        && /not published per cell/i.test(matrix.metadata.tax1["Growth time"])
        && matrix.metadata.tax2Shortest["Growth time"] === "54 seconds"
        && matrix.metadata.tax2Shortest["Physical scale"] === "789 \u00b5m field-of-view width"
        && matrix.metadata.tax2Longest["Growth time"] === "1334 seconds"
        && matrix.metadata.tax2Longest["Physical scale"] === "314 \u00b5m field-of-view width"
        && matrix.metadata.tax2Largest["Physical scale"] === "2026 \u00b5m field-of-view width"
        && matrix.metadata.tax2Smallest["Physical scale"] === "164 \u00b5m field-of-view width",
      "morphology browser maps representative temperatures to the cited plates and preserves printed time/field metadata",
      JSON.stringify(matrix.missing ? matrix : {
        selections: matrix.selections,
        metadata: matrix.metadata,
      }),
    );
    requireCheck(
      !matrix.missing
        && matrix.rendered.dataset === "tax2"
        && matrix.rendered.temperature === "-12"
        && matrix.rendered.supersaturation === "10"
        && matrix.rendered.missing === "false"
        && matrix.rendered.page === "PDF p. 13"
        && matrix.rendered.sourceImageAvailable === (mode === "public" ? "false" : "true")
        && matrix.rendered.zoomDisabled === (mode === "public")
        && /1334 seconds/.test(matrix.rendered.status),
      `${mode} morphology controls render the selected source metadata and expose only available zoom`,
      JSON.stringify(matrix.rendered),
    );

    await page.goto(`${server.baseUrl}/chapters/12-why-the-shape-flips.html`, {
      waitUntil: "networkidle",
    });
    const cm6 = await page.evaluate(() => {
      const hook = window.EducationTestHooks?.cm6History;
      if (!hook) return { missing: true };
      const cases = {
        gentle: hook.evaluate({ pulse: "gentle", surfaceMode: "history", sigmaSurfPercent: 0.2 }),
        fast: hook.evaluate({ pulse: "fast", surfaceMode: "history", sigmaSurfPercent: 0.2 }),
        forceBroad: hook.evaluate({ pulse: "fast", surfaceMode: "broad", sigmaSurfPercent: 0.2 }),
        forceNarrow: hook.evaluate({ pulse: "gentle", surfaceMode: "narrow", sigmaSurfPercent: 0.2 }),
      };
      let invalidPulseRejected = false;
      let invalidSigmaRejected = false;
      try { hook.evaluate({ pulse: "unknown" }); } catch (error) {
        invalidPulseRejected = error instanceof RangeError;
      }
      try { hook.evaluate({ sigmaSurfPercent: 0 }); } catch (error) {
        invalidSigmaRejected = error instanceof RangeError;
      }

      const root = document.getElementById("anim-cm6-history");
      root.querySelector('[data-control="cm6-pulse-fast"]').click();
      const fastRendered = {
        pulse: root.dataset.initialPulse,
        state: root.dataset.basalState,
        tendency: root.dataset.outcomeTendency,
        basal: Number(root.getAttribute("data-attachment-hk-basal")),
        prism: Number(root.getAttribute("data-attachment-hk-prism")),
      };
      root.querySelector('[data-control="cm6-state-broad"]').click();
      const broadRendered = {
        pulse: root.dataset.initialPulse,
        mode: root.dataset.surfaceMode,
        state: root.dataset.basalState,
        tendency: root.dataset.outcomeTendency,
      };
      return {
        missing: false,
        fixedSigmaSurfPercent: hook.fixedSigmaSurfPercent,
        broadBasal: hook.broadBasal,
        narrowBasal: hook.narrowBasal,
        prismReference: hook.prismReference,
        cases,
        invalidPulseRejected,
        invalidSigmaRejected,
        fastRendered,
        broadRendered,
      };
    });
    const expectedBroad = Math.exp(-0.7 / 0.2);
    const expectedNarrow = Math.exp(-0.1 / 0.2);
    const expectedPrism = 0.2 * Math.exp(-0.2 / 0.2);
    requireCheck(
      !cm6.missing
        && cm6.fixedSigmaSurfPercent === 0.2
        && cm6.broadBasal.sigma0Percent === 0.7
        && cm6.broadBasal.A === 1
        && cm6.narrowBasal.sigma0Percent === 0.1
        && cm6.narrowBasal.A === 1
        && cm6.prismReference.sigma0Percent === 0.2
        && cm6.prismReference.A === 0.2
        && Math.abs(cm6.cases.gentle.alphaHKBasal - expectedBroad) < 1e-12
        && Math.abs(cm6.cases.fast.alphaHKBasal - expectedNarrow) < 1e-12
        && Math.abs(cm6.cases.gentle.alphaHKPrism - expectedPrism) < 1e-12
        && Math.abs(cm6.cases.fast.alphaHKPrism - expectedPrism) < 1e-12
        && cm6.cases.gentle.basalState === "broad"
        && cm6.cases.gentle.tendency === "plate tendency"
        && cm6.cases.fast.basalState === "narrow"
        && cm6.cases.fast.tendency === "column tendency"
        && cm6.cases.forceBroad.tendency === "plate tendency"
        && cm6.cases.forceNarrow.tendency === "column tendency"
        && cm6.invalidPulseRejected
        && cm6.invalidSigmaRejected,
      "CM6 history explorer independently reproduces the printed broad/narrow/prism curves and branch-memory outcomes",
      JSON.stringify(cm6),
    );
    requireCheck(
      !cm6.missing
        && cm6.fastRendered.pulse === "fast"
        && cm6.fastRendered.state === "narrow"
        && cm6.fastRendered.tendency === "column"
        && Math.abs(cm6.fastRendered.basal - expectedNarrow) < 5e-7
        && Math.abs(cm6.fastRendered.prism - expectedPrism) < 5e-7
        && cm6.broadRendered.pulse === "fast"
        && cm6.broadRendered.mode === "broad"
        && cm6.broadRendered.state === "broad"
        && cm6.broadRendered.tendency === "plate",
      "CM6 controls render the same evaluated branch and allow an explicit history-independent override",
      JSON.stringify(cm6.missing ? cm6 : {
        fast: cm6.fastRendered,
        broad: cm6.broadRendered,
      }),
    );

    await page.goto(`${server.baseUrl}/chapters/02-four-hundred-years-of-looking.html`, {
      waitUntil: "networkidle",
    });
    const album = await page.evaluate(() => {
      const root = document.getElementById("anim-album");
      const crystals = [...root.querySelectorAll('[data-control="album-crystal"]')];
      const status = root.querySelector('[aria-live="polite"]');
      const initialBoard = crystals.map((button) => button.innerHTML).join("");
      crystals.slice(0, 6).forEach((button) => button.click());
      crystals[6].click();
      const capped = {
        selected: crystals.filter((button) => button.getAttribute("aria-pressed") === "true").length,
        seventhSelected: crystals[6].getAttribute("aria-pressed"),
        status: status.textContent,
      };
      crystals[0].click();
      crystals[6].click();
      const exchanged = {
        selected: crystals.filter((button) => button.getAttribute("aria-pressed") === "true").length,
        firstSelected: crystals[0].getAttribute("aria-pressed"),
        seventhSelected: crystals[6].getAttribute("aria-pressed"),
      };
      [...root.querySelectorAll(".anim__controls button")]
        .find((button) => button.textContent === "Develop the plates").click();
      const developed = {
        boardDisplay: root.querySelector(".anim__body > div:nth-of-type(1)")?.style.display,
        albumDisplay: root.querySelector(".anim__body > div:nth-of-type(2)")?.style.display,
        albumGraphics: root.querySelectorAll(".anim__body > div:nth-of-type(2) svg").length,
      };
      [...root.querySelectorAll(".anim__controls button")]
        .find((button) => button.textContent === "Back to the board").click();
      [...root.querySelectorAll(".anim__controls button")]
        .find((button) => button.textContent === "New snowfall").click();
      const newCrystals = [...root.querySelectorAll('[data-control="album-crystal"]')];
      const newBoard = newCrystals.map((button) => button.innerHTML).join("");
      return {
        count: crystals.length,
        capped,
        exchanged,
        developed,
        backToBoard: root.querySelector(".anim__body > div:nth-of-type(1)")?.style.display,
        newBoardChanged: initialBoard !== newBoard,
        newSelected: newCrystals.filter((button) =>
          button.getAttribute("aria-pressed") === "true").length,
      };
    });
    requireCheck(
      album.count === 60
        && album.capped.selected === 6
        && album.capped.seventhSelected === "false"
        && /No exposures left/.test(album.capped.status)
        && album.exchanged.selected === 6
        && album.exchanged.firstSelected === "false"
        && album.exchanged.seventhSelected === "true"
        && album.developed.boardDisplay === "none"
        && album.developed.albumDisplay === "grid"
        && album.developed.albumGraphics === 6
        && album.backToBoard === "grid"
        && album.newBoardChanged
        && album.newSelected === 0,
      "Bentley-album controls enforce six exposures, permit exchanges, develop exactly six picks, and deal a fresh board",
      JSON.stringify(album),
    );
  } finally {
    await context.close();
    await server.close();
  }
}

async function verifyRealGrowthFailureStates(browser) {
  const server = await serve(OFFLINE_ROOT);
  try {
    const positiveContext = await browser.newContext({
      viewport: { width: 1000, height: 800 },
      colorScheme: "light",
    });
    const positivePage = await positiveContext.newPage();
    await positivePage.goto(`${server.baseUrl}/chapters/04-the-fuel-supply.html`, {
      waitUntil: "networkidle",
    });
    await positivePage.waitForFunction(() =>
      document.getElementById("anim-real-growth")?.dataset.videoReady === "true");
    await positivePage.click('#anim-real-growth [data-control="play-pause"]');
    await positivePage.waitForFunction(() => {
      const video = document.querySelector("#anim-real-growth video");
      return video && !video.paused && video.currentTime > 0.05;
    });
    await positivePage.click('#anim-real-growth [data-control="play-pause"]');
    const positive = await positivePage.evaluate(async () => {
      const root = document.getElementById("anim-real-growth");
      const video = root.querySelector("video");
      const scrubber = root.querySelector('[data-control="movie-time"]');
      const midpoint = video.duration / 2;
      scrubber.value = String(midpoint);
      scrubber.dispatchEvent(new Event("input", { bubbles: true }));
      await new Promise((resolveSeek) => {
        if (Math.abs(video.currentTime - midpoint) < 0.2) resolveSeek();
        else video.addEventListener("seeked", resolveSeek, { once: true });
      });
      return {
        paused: video.paused,
        duration: video.duration,
        time: video.currentTime,
        rootTime: Number(root.dataset.videoTime),
        button: root.querySelector('[data-control="play-pause"]').textContent,
      };
    });
    requireCheck(
      positive.paused
        && positive.duration > 35
        && positive.duration < 36
        && Math.abs(positive.time - positive.duration / 2) < 0.2
        && Math.abs(positive.rootTime - positive.time) < 0.2
        && positive.button === "Play",
      "real-growth movie plays, pauses, and scrubs the registered local bytes",
      JSON.stringify(positive),
    );
    await positiveContext.close();

    const rejectedContext = await browser.newContext({
      viewport: { width: 1000, height: 800 },
      colorScheme: "light",
    });
    const rejectedPage = await rejectedContext.newPage();
    await rejectedPage.goto(`${server.baseUrl}/chapters/04-the-fuel-supply.html`, {
      waitUntil: "networkidle",
    });
    await rejectedPage.waitForFunction(() =>
      document.getElementById("anim-real-growth")?.dataset.videoReady === "true");
    await rejectedPage.evaluate(() => {
      const video = document.querySelector("#anim-real-growth video");
      video.pause();
      window.__educationRejectedPlayCalls = 0;
      video.play = () => {
        window.__educationRejectedPlayCalls++;
        return Promise.reject(new DOMException("denied", "NotAllowedError"));
      };
    });
    await rejectedPage.click('#anim-real-growth [data-control="play-pause"]');
    await rejectedPage.waitForTimeout(50);
    const rejected = await rejectedPage.evaluate(() => {
      const video = document.querySelector("#anim-real-growth video");
      const button = document.querySelector('#anim-real-growth [data-control="play-pause"]');
      return {
        calls: window.__educationRejectedPlayCalls,
        paused: video.paused,
        text: button.textContent,
        pressed: button.getAttribute("aria-pressed"),
      };
    });
    requireCheck(
      rejected.calls === 1
        && rejected.paused
        && rejected.text === "Play"
        && rejected.pressed === "false",
      "real-growth controls remain truthful when video playback is rejected",
      JSON.stringify(rejected),
    );
    await rejectedContext.close();

    const missingContext = await browser.newContext({
      viewport: { width: 1000, height: 800 },
      colorScheme: "light",
    });
    let missingRouteHits = 0;
    await missingContext.route("**/media/*.mp4", (route) => {
      missingRouteHits++;
      return route.abort("failed");
    });
    const missingPage = await missingContext.newPage();
    await missingPage.goto(`${server.baseUrl}/chapters/04-the-fuel-supply.html`, {
      waitUntil: "networkidle",
    });
    await missingPage.waitForFunction(() =>
      document.getElementById("anim-real-growth")?.dataset.fallbackReason
        === "local-video-unavailable");
    const missing = await missingPage.evaluate(() => {
      const root = document.getElementById("anim-real-growth");
      return {
        mode: root.dataset.mediaMode,
        ready: root.dataset.videoReady,
        reason: root.dataset.fallbackReason,
        videos: root.querySelectorAll("video").length,
        sourceCards: root.querySelectorAll(".callout--method").length,
      };
    });
    requireCheck(
      missingRouteHits > 0
        && missing.mode === "source-card"
        && missing.ready === "false"
        && missing.reason === "local-video-unavailable"
        && missing.videos === 0
        && missing.sourceCards === 1,
      "offline real-growth widget fails closed to its source card when media is missing",
      JSON.stringify({ routeHits: missingRouteHits, ...missing }),
    );
    await missingContext.close();
  } finally {
    await server.close();
  }
}

async function verifyRibReplayControl(browser, root) {
  const server = await serve(root);
  const context = await browser.newContext({
    reducedMotion: "no-preference",
    colorScheme: "light",
    viewport: { width: 1000, height: 800 },
  });
  await installTheme(context, "light");
  const page = await context.newPage();
  try {
    await page.goto(`${server.baseUrl}/chapters/08-a-snowflake-is-a-record.html`, {
      waitUntil: "networkidle",
    });
    await page.evaluate(() => {
      const root = document.getElementById("rib-schedule");
      const clock = root.querySelector('[data-control="schedule-clock"]');
      root.scrollIntoView({ block: "center" });
      clock.value = String(Math.max(0, Number(clock.max) - 8));
      clock.dispatchEvent(new Event("input", { bubbles: true }));
    });
    const nearEnd = await page.evaluate(() => {
      const root = document.getElementById("rib-schedule");
      const button = root.querySelector('[data-control="play-pause"]');
      return {
        time: Number(root.dataset.scheduleTime),
        total: Number(root.dataset.scheduleTotalTime),
        text: button.textContent,
        pressed: button.getAttribute("aria-pressed"),
      };
    });
    await page.click('#rib-schedule [data-control="play-pause"]');
    await page.waitForFunction(() => {
      const root = document.getElementById("rib-schedule");
      return Number(root.dataset.scheduleTime) === Number(root.dataset.scheduleTotalTime);
    });
    const terminal = await page.evaluate(() => {
      const root = document.getElementById("rib-schedule");
      const button = root.querySelector('[data-control="play-pause"]');
      return {
        time: Number(root.dataset.scheduleTime),
        total: Number(root.dataset.scheduleTotalTime),
        text: button.textContent,
        pressed: button.getAttribute("aria-pressed"),
      };
    });
    await page.click('#rib-schedule [data-control="play-pause"]');
    await page.waitForFunction(() => {
      const root = document.getElementById("rib-schedule");
      const time = Number(root.dataset.scheduleTime);
      return time > 0 && time < Number(root.dataset.scheduleTotalTime);
    });
    const replaying = await page.evaluate(() => {
      const root = document.getElementById("rib-schedule");
      const button = root.querySelector('[data-control="play-pause"]');
      return {
        time: Number(root.dataset.scheduleTime),
        total: Number(root.dataset.scheduleTotalTime),
        text: button.textContent,
        pressed: button.getAttribute("aria-pressed"),
      };
    });
    requireCheck(
      nearEnd.time === nearEnd.total - 8
        && nearEnd.pressed === "false"
        && terminal.time === terminal.total
        && terminal.text === "Replay schedule"
        && terminal.pressed === "false"
        && replaying.time > 0
        && replaying.time < replaying.total
        && replaying.text === "Pause schedule"
        && replaying.pressed === "true",
      "rib replay reaches a natural near-end completion, then restarts and advances on the first click",
      JSON.stringify({ nearEnd, terminal, replaying }),
    );
  } finally {
    await context.close();
    await server.close();
  }
}

async function negativeControls(browser) {
  const server = await serve(PUBLIC_ROOT);
  let passed = 0;

  async function expectRejected(name, expectedDetection, action) {
    let result;
    try {
      result = await action();
    } catch (error) {
      fail(`negative control ${name}`, `unexpected harness error: ${error.stack || error.message}`);
      return;
    }
    const detected = result.executed
      && result.detections.some((detection) => detection.includes(expectedDetection));
    if (detected) {
      passed++;
      pass(`negative control ${name}`);
    } else {
      fail(
        `negative control ${name}`,
        `executed=${result.executed}; expected=${expectedDetection}; detections=${JSON.stringify(result.detections)}`,
      );
    }
  }

  try {
    await expectRejected("deleted served visual root", "root inventory", async () => {
      const result = await loadProfile(
        browser,
        server.baseUrl,
        "chapters/01-not-a-frozen-raindrop.html",
        PROFILES.storedLightOsLight,
        "public",
      );
      const executed = await result.page.evaluate(() => {
        const root = document.getElementById("anim-aggregate");
        if (!root) return false;
        root.remove();
        return !document.getElementById("anim-aggregate");
      });
      const facts = await pageFacts(result.page);
      const detections = factViolations(
        facts,
        MANIFEST["chapters/01-not-a-frozen-raindrop.html"],
        "light",
        "public",
      ).map((violation) => violation.name);
      await result.context.close();
      return { executed, detections };
    });

    await expectRejected("served-page horizontal overflow", "horizontal layout", async () => {
      const result = await loadProfile(
        browser,
        server.baseUrl,
        "chapters/01-not-a-frozen-raindrop.html",
        { ...PROFILES.mobile, savedTheme: "dark" },
        "public",
      );
      const executed = await result.page.evaluate(() => {
        const main = document.querySelector("main");
        if (!main) return false;
        main.style.minWidth = "900px";
        return true;
      });
      const facts = await pageFacts(result.page);
      const detections = factViolations(
        facts,
        MANIFEST["chapters/01-not-a-frozen-raindrop.html"],
        "dark",
        "public",
      ).map((violation) => violation.name);
      await result.context.close();
      return { executed, detections };
    });

    await expectRejected("post-interaction page error", "interaction-only failure", async () => {
      const result = await loadProfile(
        browser,
        server.baseUrl,
        "chapters/01-not-a-frozen-raindrop.html",
        PROFILES.storedLightOsLight,
        "public",
      );
      await result.page.evaluate(() => {
        window.__educationInteractionMutation = 0;
        const button = document.querySelector("figure.anim button");
        button.addEventListener("click", () => {
          window.__educationInteractionMutation++;
          throw new Error("interaction-only failure");
        }, { once: true });
      });
      await exerciseControls(result.page);
      await result.page.waitForTimeout(100);
      const executed = await result.page.evaluate(() => window.__educationInteractionMutation === 1);
      const detections = result.errors.slice();
      await result.context.close();
      return { executed, detections };
    });

    await expectRejected("console error through production listener", "negative-control console", async () => {
      const result = await loadProfile(
        browser,
        server.baseUrl,
        "chapters/01-not-a-frozen-raindrop.html",
        PROFILES.storedLightOsLight,
        "public",
      );
      const executed = await result.page.evaluate(() => {
        console.error("negative-control console");
        return true;
      });
      await result.page.waitForTimeout(50);
      const detections = result.errors.slice();
      await result.context.close();
      return { executed, detections };
    });

    await expectRejected("same-origin fetch from public page", "fetch:", async () => {
      const result = await loadProfile(
        browser,
        server.baseUrl,
        "chapters/01-not-a-frozen-raindrop.html",
        PROFILES.storedLightOsLight,
        "public",
      );
      const executed = await result.page.evaluate(async () => {
        const response = await fetch("../assets/viz.js");
        const body = await response.text();
        return response.ok && body.includes("window.Viz");
      });
      const detections = result.forbiddenPublicRequests.slice();
      await result.context.close();
      return { executed, detections };
    });

    await expectRejected("embedded data image", "public embedded-media boundary", async () => {
      const result = await loadProfile(
        browser,
        server.baseUrl,
        "chapters/01-not-a-frozen-raindrop.html",
        PROFILES.storedLightOsLight,
        "public",
      );
      const executed = await result.page.evaluate(async () => {
        const image = new Image();
        image.alt = "negative-control image";
        image.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";
        document.body.appendChild(image);
        await image.decode();
        return image.naturalWidth === 1;
      });
      const facts = await pageFacts(result.page);
      const detections = factViolations(
        facts,
        MANIFEST["chapters/01-not-a-frozen-raindrop.html"],
        "light",
        "public",
      ).map((violation) => violation.name);
      await result.context.close();
      return { executed, detections };
    });

    await expectRejected("tampered diffusion evidence", "Jacobi sweep", async () => {
      const evidence = structuredClone(capturedScientificEvidence.diffusion);
      evidence.jacobiMaxError = 0.125;
      return {
        executed: evidence.jacobiMaxError === 0.125,
        detections: diffusionEvidenceViolations(evidence),
      };
    });

    await expectRejected("tampered G-G mass evidence", "hexagon", async () => {
      const evidence = structuredClone(capturedScientificEvidence.zoo);
      evidence.rows[0].drift = 1;
      return {
        executed: evidence.rows[0].drift === 1,
        detections: zooGrowthViolations(evidence),
      };
    });
  } finally {
    await server.close();
  }
  requireCheck(
    passed === 8,
    "all eight artifact-backed verifier negative controls executed and were rejected by production predicates",
    `passed ${passed}/8`,
  );
}

mkdirSync(OUT, { recursive: true });
staticChecks();

if (modes.includes("offline")) {
  execFileSync("node", ["docs/education/tools/build-local.mjs"], {
    cwd: REPO,
    stdio: "inherit",
  });
  verifyOfflineSourceMap();
  verifyOfflineMediaBytes();
}

const browser = await chromium.launch();
try {
  for (const mode of modes) {
    const root = mode === "public" ? PUBLIC_ROOT : OFFLINE_ROOT;
    await verifySite(browser, mode, root);
  }
  const modelMode = modes.includes("public") ? "public" : "offline";
  const modelRoot = modelMode === "public" ? PUBLIC_ROOT : OFFLINE_ROOT;
  await verifyScientificModels(browser, modelRoot, modelMode);
  await verifyRibReplayControl(browser, modelRoot);
  if (modes.includes("offline")) await verifyRealGrowthFailureStates(browser);
  await negativeControls(browser);
} finally {
  await browser.close();
}

const report = {
  generatedAt: new Date().toISOString(),
  manifestSha256: sha256(join(TOOL_DIR, "site-manifest.json")),
  scope: partOneOnly ? "part-one" : "complete-course",
  pages: PAGE_PATHS.length,
  visualRoots: EXPECTED_ROOTS,
  modes,
  checks: checks.length,
  failures,
};
const reportPath = join(OUT, "report.json");
writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

if (failures.length) {
  console.error(`\n${failures.length} verification failure(s). Report: ${reportPath}`);
  process.exit(1);
}
console.log(`\nEducation verification passed. Report: ${reportPath}`);
