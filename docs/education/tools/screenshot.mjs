/**
 * Reproducible visual-QA captures for the education site.
 *
 *   node docs/education/tools/screenshot.mjs [options] <page.html[#fragment]> [...]
 *
 * Options:
 *   --mode public|offline|both   Root to serve (default: public).
 *   --capture full|viewport|both Screenshot shape (default: full).
 *   --help                       Print this help.
 *
 * Public mode serves docs/education. Offline mode serves out/education-local,
 * which must already have been produced by build-local.mjs. Every requested
 * page is captured at desktop/mobile sizes in explicitly saved light/dark
 * themes. Screenshots and the machine-readable run report are QA artifacts,
 * never scientific evidence, and stay under out/education-visual-qa.
 */

import { createHash } from "node:crypto";
import {
  createReadStream,
  existsSync,
  mkdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { createServer } from "node:http";
import {
  extname,
  isAbsolute,
  join,
  relative,
  resolve,
} from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const TOOL_DIR = fileURLToPath(new URL(".", import.meta.url));
const REPO = resolve(TOOL_DIR, "../../..");
const ROOTS = Object.freeze({
  public: join(REPO, "docs/education"),
  offline: join(REPO, "out/education-local"),
});
const OUT = join(REPO, "out/education-visual-qa");

const PROFILES = Object.freeze([
  Object.freeze({
    name: "desktop-light",
    viewport: Object.freeze({ width: 1440, height: 1000 }),
    theme: "light",
    isMobile: false,
  }),
  Object.freeze({
    name: "desktop-dark",
    viewport: Object.freeze({ width: 1440, height: 1000 }),
    theme: "dark",
    isMobile: false,
  }),
  Object.freeze({
    name: "mobile-light",
    viewport: Object.freeze({ width: 390, height: 844 }),
    theme: "light",
    isMobile: true,
  }),
  Object.freeze({
    name: "mobile-dark",
    viewport: Object.freeze({ width: 390, height: 844 }),
    theme: "dark",
    isMobile: true,
  }),
]);

const MIME = Object.freeze({
  ".css": "text/css; charset=utf-8",
  ".csv": "text/csv; charset=utf-8",
  ".gif": "image/gif",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".mp4": "video/mp4",
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".webm": "video/webm",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
});

function usage() {
  return [
    "usage: node docs/education/tools/screenshot.mjs [options] <page.html[#fragment]> [...]",
    "",
    "options:",
    "  --mode public|offline|both   root to serve (default: public)",
    "  --capture full|viewport|both screenshot shape (default: full)",
    "  --help                       print this help",
    "",
    "examples:",
    "  node docs/education/tools/screenshot.mjs index.html chapters/28-the-exam-result.html",
    "  node docs/education/tools/screenshot.mjs --capture viewport chapters/28-the-exam-result.html#c28-sweep",
    "  node docs/education/tools/screenshot.mjs --mode offline glossary.html",
  ].join("\n");
}

function optionValue(argv, index, name) {
  const arg = argv[index];
  if (arg === name) {
    if (index + 1 >= argv.length) throw new Error(`${name} requires a value`);
    return { value: argv[index + 1], consumed: 2 };
  }
  if (arg.startsWith(`${name}=`)) {
    return { value: arg.slice(name.length + 1), consumed: 1 };
  }
  return null;
}

function parseArgs(argv) {
  let mode = "public";
  let capture = "full";
  let help = false;
  const targets = [];

  for (let i = 0; i < argv.length;) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") {
      help = true;
      i++;
      continue;
    }
    const modeOption = optionValue(argv, i, "--mode");
    if (modeOption) {
      mode = modeOption.value;
      i += modeOption.consumed;
      continue;
    }
    const captureOption = optionValue(argv, i, "--capture");
    if (captureOption) {
      capture = captureOption.value;
      i += captureOption.consumed;
      continue;
    }
    if (arg.startsWith("-")) throw new Error(`unknown option: ${arg}`);
    targets.push(arg);
    i++;
  }

  if (!new Set(["public", "offline", "both"]).has(mode)) {
    throw new Error(`--mode must be public, offline, or both; received ${mode}`);
  }
  if (!new Set(["full", "viewport", "both"]).has(capture)) {
    throw new Error(`--capture must be full, viewport, or both; received ${capture}`);
  }
  if (!help && targets.length === 0) throw new Error("at least one HTML page is required");
  return { mode, capture, help, targets };
}

function parseTarget(raw) {
  if (/^[a-z][a-z0-9+.-]*:/i.test(raw) || raw.startsWith("//")) {
    throw new Error(`page must be relative to the selected site root: ${raw}`);
  }
  const hashAt = raw.indexOf("#");
  const path = (hashAt >= 0 ? raw.slice(0, hashAt) : raw).replace(/\\/g, "/");
  const fragment = hashAt >= 0 ? raw.slice(hashAt + 1) : "";
  if (!path || !path.toLowerCase().endsWith(".html")) {
    throw new Error(`page must name an HTML file: ${raw}`);
  }
  const resolved = resolve("/qa-root", path);
  const guard = relative("/qa-root", resolved);
  if (guard.startsWith("..") || isAbsolute(guard)) {
    throw new Error(`page escapes the selected site root: ${raw}`);
  }
  return Object.freeze({ raw, path, fragment });
}

function modesFor(mode) {
  return mode === "both" ? ["public", "offline"] : [mode];
}

function capturesFor(capture) {
  return capture === "both" ? ["full", "viewport"] : [capture];
}

function safeStem(target) {
  const readablePath = target.path
    .replace(/\.html$/i, "")
    .replace(/[\\/]+/g, "--")
    .replace(/[^a-z0-9._-]+/gi, "-")
    .replace(/^-+|-+$/g, "") || "page";
  const readableFragment = target.fragment
    ? `--at-${target.fragment.replace(/[^a-z0-9._-]+/gi, "-").replace(/^-+|-+$/g, "")}`
    : "";
  const digest = createHash("sha256").update(target.raw).digest("hex").slice(0, 10);
  return `${readablePath}${readableFragment}--${digest}`;
}

function urlFor(baseUrl, target) {
  const encodedPath = target.path.split("/").map(encodeURIComponent).join("/");
  const hash = target.fragment ? `#${encodeURIComponent(target.fragment)}` : "";
  return `${baseUrl}/${encodedPath}${hash}`;
}

function pathInside(root, candidate) {
  const rel = relative(root, candidate);
  return rel === "" || (!rel.startsWith("..") && !isAbsolute(rel));
}

function requestedFile(root, requestUrl) {
  const url = new URL(requestUrl, "http://127.0.0.1");
  const rel = decodeURIComponent(url.pathname).replace(/^\/+/, "") || "index.html";
  const candidate = resolve(root, rel);
  if (!pathInside(root, candidate) || !existsSync(candidate) || !statSync(candidate).isFile()) {
    return null;
  }
  return candidate;
}

function sendFile(req, res, path) {
  const size = statSync(path).size;
  const type = MIME[extname(path).toLowerCase()] || "application/octet-stream";
  const baseHeaders = {
    "Accept-Ranges": "bytes",
    "Cache-Control": "no-store",
    "Content-Type": type,
  };
  const range = req.headers.range;
  if (range) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(range);
    if (!match) {
      res.writeHead(416, { ...baseHeaders, "Content-Range": `bytes */${size}` });
      res.end();
      return;
    }
    const suffixLength = match[1] === "" ? Number(match[2]) : null;
    const start = suffixLength == null
      ? Number(match[1])
      : Math.max(0, size - suffixLength);
    const end = suffixLength == null
      ? (match[2] === "" ? size - 1 : Math.min(size - 1, Number(match[2])))
      : size - 1;
    if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 0 || end < start || start >= size) {
      res.writeHead(416, { ...baseHeaders, "Content-Range": `bytes */${size}` });
      res.end();
      return;
    }
    res.writeHead(206, {
      ...baseHeaders,
      "Content-Length": end - start + 1,
      "Content-Range": `bytes ${start}-${end}/${size}`,
    });
    if (req.method === "HEAD") res.end();
    else createReadStream(path, { start, end }).pipe(res);
    return;
  }
  res.writeHead(200, { ...baseHeaders, "Content-Length": size });
  if (req.method === "HEAD") res.end();
  else createReadStream(path).pipe(res);
}

async function serve(root) {
  const server = createServer((req, res) => {
    try {
      const path = requestedFile(root, req.url || "/");
      if (!path) {
        res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
        res.end("not found");
        return;
      }
      sendFile(req, res, path);
    } catch (error) {
      res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
      res.end(error instanceof Error ? error.message : String(error));
    }
  });
  await new Promise((resolveListen, rejectListen) => {
    server.once("error", rejectListen);
    server.listen(0, "127.0.0.1", resolveListen);
  });
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("visual-QA server has no TCP address");
  return {
    baseUrl: `http://127.0.0.1:${address.port}`,
    close: () => new Promise((resolveClose, rejectClose) => {
      server.close((error) => error ? rejectClose(error) : resolveClose());
    }),
  };
}

function relativeToRepo(path) {
  return relative(REPO, path).replace(/\\/g, "/");
}

async function inspectPage(page, expectedTheme, expectedFragment) {
  return page.evaluate(({ theme, fragment }) => {
    const root = document.documentElement;
    const text = document.body?.innerText || "";
    const mojibakePatterns = [
      /\uFFFD/u,
      /\u00C2[\u00A0-\u00BF]/u,
      /\u00C3[\u0080-\u00BF]/u,
      /\u00E2\u20AC/u,
      /\u00F0\u0178/u,
    ];
    const mojibakeLines = text.split(/\r?\n/)
      .filter((line) => mojibakePatterns.some((pattern) => pattern.test(line)))
      .slice(0, 8);
    const brokenImages = [...document.images]
      .filter((image) => image.complete && image.naturalWidth === 0)
      .map((image) => image.currentSrc || image.src);
    const clippedControls = [...document.querySelectorAll("button, input, select")]
      .flatMap((control) => {
        const style = getComputedStyle(control);
        const rect = control.getBoundingClientRect();
        if (
          style.display === "none"
          || style.visibility === "hidden"
          || Number(style.opacity) === 0
          || rect.width <= 0
          || rect.height <= 0
        ) return [];
        if (rect.left >= -1 && rect.right <= innerWidth + 1) return [];
        return [{
          element: control.tagName.toLowerCase(),
          label: (control.getAttribute("aria-label") || control.textContent || control.value || "")
            .trim().replace(/\s+/g, " ").slice(0, 160),
          left: rect.left,
          right: rect.right,
          width: rect.width,
        }];
      });
    return {
      title: document.title,
      theme: root.getAttribute("data-theme"),
      expectedTheme: theme,
      fragmentFound: fragment === "" || document.getElementById(fragment) !== null,
      documentWidth: { scroll: root.scrollWidth, client: root.clientWidth },
      documentHeight: { scroll: root.scrollHeight, client: root.clientHeight },
      brokenImages,
      clippedControls,
      missingSourceFigures: document.querySelectorAll(".figure__missing").length,
      mojibakeLines,
    };
  }, { theme: expectedTheme, fragment: expectedFragment });
}

async function captureProfile(browser, mode, server, target, profile, shapes) {
  const context = await browser.newContext({
    viewport: profile.viewport,
    colorScheme: profile.theme,
    reducedMotion: "reduce",
    deviceScaleFactor: 1,
    isMobile: profile.isMobile,
    hasTouch: profile.isMobile,
  });
  const result = {
    mode,
    target: target.raw,
    profile: profile.name,
    viewport: profile.viewport,
    theme: profile.theme,
    screenshots: [],
    runtimeErrors: [],
    badResponses: [],
    failedRequests: [],
    facts: null,
    problems: [],
  };
  try {
    await context.addInitScript((theme) => {
      try { localStorage.setItem("snow-crystals-theme", theme); } catch { /* unavailable origin */ }
    }, profile.theme);
    const page = await context.newPage();
    page.on("console", (message) => {
      if (message.type() === "error") result.runtimeErrors.push(`console: ${message.text()}`);
    });
    page.on("pageerror", (error) => result.runtimeErrors.push(`pageerror: ${error.message}`));
    page.on("response", (response) => {
      if (response.status() >= 400) {
        result.badResponses.push(`${response.status()} ${response.url()}`);
      }
    });
    page.on("requestfailed", (request) => {
      const reason = request.failure()?.errorText || "unknown failure";
      if (request.resourceType() === "media" && reason === "net::ERR_ABORTED") return;
      result.failedRequests.push(`${reason} ${request.url()}`);
    });

    try {
      await page.goto(urlFor(server.baseUrl, target), { waitUntil: "networkidle", timeout: 30_000 });
      await page.evaluate(async () => {
        if (document.fonts?.ready) await document.fonts.ready;
      });
      if (target.fragment) {
        await page.evaluate((fragment) => {
          document.getElementById(fragment)?.scrollIntoView({ block: "start" });
        }, target.fragment);
      }
      await page.waitForTimeout(300);
    } catch (error) {
      result.runtimeErrors.push(`navigation: ${error instanceof Error ? error.message : String(error)}`);
    }

    result.facts = await inspectPage(page, profile.theme, target.fragment);
    const stem = `${mode}--${safeStem(target)}--${profile.name}`;
    for (const shape of shapes) {
      const path = join(OUT, `${stem}--${shape}.png`);
      try {
        if (shape === "viewport") {
          await page.evaluate((fragment) => {
            if (!fragment) {
              scrollTo(0, 0);
              return;
            }
            const targetElement = document.getElementById(fragment);
            if (!targetElement) return;
            targetElement.scrollIntoView({ block: "start" });
            const topbar = document.querySelector(".topbar")?.getBoundingClientRect().height || 0;
            scrollBy(0, -(topbar + 12));
          }, target.fragment);
          await page.waitForTimeout(100);
        }
        await page.screenshot({
          path,
          fullPage: shape === "full",
          animations: "disabled",
        });
        result.screenshots.push(relativeToRepo(path));
      } catch (error) {
        result.runtimeErrors.push(`screenshot ${shape}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    if (result.runtimeErrors.length) result.problems.push("runtime errors");
    if (result.badResponses.length) result.problems.push("HTTP responses with status >= 400");
    if (result.failedRequests.length) result.problems.push("failed requests");
    if (result.facts.theme !== result.facts.expectedTheme) result.problems.push("saved theme mismatch");
    if (!result.facts.fragmentFound) result.problems.push("requested fragment is absent");
    if (result.facts.documentWidth.scroll > result.facts.documentWidth.client + 1) {
      result.problems.push("document-level horizontal overflow");
    }
    if (result.facts.brokenImages.length) result.problems.push("broken images");
    if (result.facts.clippedControls.length) result.problems.push("horizontally clipped controls");
    if (result.facts.mojibakeLines.length) result.problems.push("possible mojibake");
  } finally {
    await context.close();
  }
  return result;
}

let options;
try {
  options = parseArgs(process.argv.slice(2));
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  console.error(`\n${usage()}`);
  process.exit(2);
}

if (options.help) {
  console.log(usage());
  process.exit(0);
}

const targets = options.targets.map(parseTarget);
const modes = modesFor(options.mode);
const shapes = capturesFor(options.capture);
for (const mode of modes) {
  if (!existsSync(ROOTS[mode])) {
    throw new Error(
      mode === "offline"
        ? "offline root is absent; run node docs/education/tools/build-local.mjs first"
        : `site root is absent: ${ROOTS[mode]}`,
    );
  }
  for (const target of targets) {
    const pagePath = resolve(ROOTS[mode], target.path);
    if (!pathInside(ROOTS[mode], pagePath) || !existsSync(pagePath) || !statSync(pagePath).isFile()) {
      throw new Error(`${mode} page is absent: ${target.path}`);
    }
  }
}

mkdirSync(OUT, { recursive: true });
const startedAt = new Date().toISOString();
const results = [];
let browser = null;
try {
  browser = await chromium.launch();
  for (const mode of modes) {
    const server = await serve(ROOTS[mode]);
    try {
      for (const target of targets) {
        for (const profile of PROFILES) {
          const result = await captureProfile(browser, mode, server, target, profile, shapes);
          results.push(result);
          const marker = result.problems.length ? "PROBLEM" : "PASS";
          console.log(
            `${marker} ${mode}:${target.raw}:${profile.name} -> ${result.screenshots.join(", ")}`,
          );
          for (const problem of result.problems) console.log(`  ${problem}`);
        }
      }
    } finally {
      await server.close();
    }
  }
} finally {
  if (browser) await browser.close();
}

const problemProfiles = results.filter((result) => result.problems.length > 0);
const report = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  startedAt,
  command: process.argv,
  playwrightVersion: JSON.parse(readFileSync(resolve(REPO, "node_modules/playwright/package.json"), "utf8")).version,
  chromiumExecutable: chromium.executablePath(),
  scope: {
    modes,
    captures: shapes,
    targets: targets.map((target) => target.raw),
    profiles: PROFILES,
  },
  result: {
    profiles: results.length,
    problemProfiles: problemProfiles.length,
    pass: problemProfiles.length === 0,
  },
  results,
};
const reportPath = join(OUT, "report.json");
writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

if (problemProfiles.length) {
  console.error(`\n${problemProfiles.length}/${results.length} profile(s) had problems. Report: ${reportPath}`);
  process.exitCode = 1;
} else {
  console.log(`\nPASS ${results.length} profile(s). Report: ${reportPath}`);
}
