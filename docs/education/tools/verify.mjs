/**
 * Fail-closed browser and model verifier for the complete education course.
 *
 *   node docs/education/tools/verify.mjs
 *   node docs/education/tools/verify.mjs --part-one
 *   node docs/education/tools/verify.mjs --public-only
 *   node docs/education/tools/verify.mjs --offline-only
 *   node docs/education/tools/verify.mjs --part-two-models-only
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
import {
  runCheckpointProductionOracle,
} from "./checkpoint-production-oracle.mjs";
import {
  checkpointViolations,
  crossingViolations,
  ledgerViolations,
  PHASE6_ARM2_PROTOCOL_SHA256,
  PHASE6_ARM2_VALUES_PIN_COMMIT,
  PHASE6_ARM2_VALUES_SHA256,
  PHASE6_STATUS_COMMIT,
  phase6StatusViolations,
  timelineViolations,
  TRANSFER_AXIS_COUNT,
  TRANSFER_SOURCE_AUTHORITY,
  transferabilityViolations,
} from "./part-two-oracles.mjs";

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
const partTwoModelsOnly = args.has("--part-two-models-only");
if (partOneOnly && partTwoModelsOnly) {
  throw new Error("--part-one and --part-two-models-only are mutually exclusive");
}
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

  if (!partOneOnly) {
    const provenanceProblems = [];
    const resolveCommit = (name) => {
      try {
        return execFileSync(
          "git",
          ["rev-parse", "--verify", `${name}^{commit}`],
          { cwd: REPO, encoding: "utf8" },
        ).trim();
      } catch {
        provenanceProblems.push(`missing commit ${name}`);
        return "";
      }
    };
    const currentCommit = resolveCommit(PHASE6_STATUS_COMMIT);
    const verifierCommit = resolveCommit("990840a");
    const inputRepairCommit = resolveCommit("b701285");
    const sourceFingerprintCommit = resolveCommit("154359d");
    const valuesFreezeCommit = resolveCommit("483f7ee");
    const valuesPinCommit = resolveCommit(PHASE6_ARM2_VALUES_PIN_COMMIT);
    const combinedProtocolCommit = resolveCommit("8c781b1");
    const arm2FreezeCommit =
      "483f7ee56cbbcd5017658aa4879a3a9b87c56809";
    if (currentCommit !== PHASE6_STATUS_COMMIT) {
      provenanceProblems.push("current status commit resolution");
    }
    if (combinedProtocolCommit !== PHASE6_STATUS_COMMIT) {
      provenanceProblems.push("combined protocol commit resolution");
    }
    if (
      [
        verifierCommit,
        inputRepairCommit,
        sourceFingerprintCommit,
        valuesFreezeCommit,
        valuesPinCommit,
      ].some((value) => value === "")
    ) {
      provenanceProblems.push("named safeguard/freeze commit resolution");
    }
    try {
      const isAncestor = (older, newer) => {
        try {
          execFileSync(
            "git",
            ["merge-base", "--is-ancestor", older, newer],
            { cwd: REPO, stdio: "ignore" },
          );
          return true;
        } catch {
          return false;
        }
      };
      if (
        valuesFreezeCommit !== arm2FreezeCommit
        || valuesPinCommit !== PHASE6_ARM2_VALUES_PIN_COMMIT
        || !isAncestor(valuesFreezeCommit, valuesPinCommit)
        || !isAncestor(valuesPinCommit, combinedProtocolCommit)
      ) {
        provenanceProblems.push("Arm 2 freeze/pin/combined ancestry");
      }
      const interimProtocol = execFileSync(
        "git",
        [
          "show",
          `${valuesFreezeCommit}:runner/src/phase6-arm2-protocol.ts`,
        ],
        { cwd: REPO, encoding: "utf8", maxBuffer: 4 * 1024 * 1024 },
      );
      if (
        !interimProtocol.includes(
          'PHASE6_ARM2_FREEZE_COMMIT = "PENDING_FREEZE_COMMIT"',
        )
        || !interimProtocol.includes(
          '"d8c4e799095e4db870b03c696bf40d2ec4f72f0c8e1396457b4bd257026cbd93"',
        )
      ) {
        provenanceProblems.push("Arm 2 freeze commit interim state");
      }
      const pinnedValuesProtocol = execFileSync(
        "git",
        [
          "show",
          `${valuesPinCommit}:runner/src/phase6-arm2-protocol.ts`,
        ],
        { cwd: REPO, encoding: "utf8", maxBuffer: 4 * 1024 * 1024 },
      );
      const pinPaths = execFileSync(
        "git",
        ["diff-tree", "--no-commit-id", "--name-only", "-r", valuesPinCommit],
        { cwd: REPO, encoding: "utf8" },
      ).trim().split(/\r?\n/).filter(Boolean);
      if (
        !pinnedValuesProtocol.includes(
          `PHASE6_ARM2_FREEZE_COMMIT = "${arm2FreezeCommit}"`,
        )
        || !pinnedValuesProtocol.includes(`"${PHASE6_ARM2_VALUES_SHA256}"`)
        || pinnedValuesProtocol.includes("PENDING_FREEZE_COMMIT")
        || pinnedValuesProtocol.includes(
          "d8c4e799095e4db870b03c696bf40d2ec4f72f0c8e1396457b4bd257026cbd93",
        )
        || pinPaths.length !== 1
        || pinPaths[0] !== "runner/src/phase6-arm2-protocol.ts"
      ) {
        provenanceProblems.push("Arm 2 values-pin bridge semantics");
      }
      const protocol = execFileSync(
        "git",
        [
          "show",
          `${PHASE6_STATUS_COMMIT}:runner/src/phase6-arm2-protocol.ts`,
        ],
        { cwd: REPO, encoding: "utf8", maxBuffer: 4 * 1024 * 1024 },
      );
      if (
        !protocol.includes(`"${PHASE6_ARM2_VALUES_SHA256}"`)
        || !protocol.includes(`"${PHASE6_ARM2_PROTOCOL_SHA256}"`)
        || !protocol.includes(
          `PHASE6_ARM2_FREEZE_COMMIT = "${arm2FreezeCommit}"`,
        )
        || !protocol.includes("pinned by revision history rather than treated as durable")
        || !protocol.includes("stopped one minute in")
      ) {
        provenanceProblems.push("Arm 2 protocol/hash semantics");
      }
      const progress = execFileSync(
        "git",
        ["show", `${PHASE6_STATUS_COMMIT}:docs/PROGRESS.md`],
        { cwd: REPO, encoding: "utf8", maxBuffer: 8 * 1024 * 1024 },
      );
      const nextStepIndex = progress.lastIndexOf("## Next step");
      const nextStep = nextStepIndex >= 0
        ? progress.slice(nextStepIndex)
        : "";
      if (
        nextStepIndex < 0
        || !/freeze/i.test(nextStep)
        || !/arm\s*2/i.test(nextStep)
      ) {
        provenanceProblems.push("recorded PROGRESS disagreement");
      }
    } catch (error) {
      provenanceProblems.push(`Git source read: ${error.message}`);
    }
    requireCheck(
      provenanceProblems.length === 0,
      "Phase 6 status provenance authenticates the 483f7ee interim freeze, 0cb52bf values-pin bridge, 8c781b1 combined hash, their ancestry, and the disclosed PROGRESS disagreement",
      provenanceProblems.join(" | "),
    );

    const transferSourceProblems = [];
    if (TRANSFER_SOURCE_AUTHORITY.revision !== PHASE6_STATUS_COMMIT) {
      transferSourceProblems.push("authority revision is not the registered status commit");
    }
    for (const [path, expectedBlob] of Object.entries(
      TRANSFER_SOURCE_AUTHORITY.blobs,
    )) {
      try {
        const actualBlob = execFileSync(
          "git",
          ["rev-parse", `${TRANSFER_SOURCE_AUTHORITY.revision}:${path}`],
          { cwd: REPO, encoding: "utf8" },
        ).trim();
        if (actualBlob !== expectedBlob) {
          transferSourceProblems.push(
            `${path}: expected ${expectedBlob}, got ${actualBlob}`,
          );
        }
      } catch (error) {
        transferSourceProblems.push(`${path}: ${error.message}`);
      }
    }
    try {
      const authorityRevision = TRANSFER_SOURCE_AUTHORITY.revision;
      const report = execFileSync(
        "git",
        ["show", `${authorityRevision}:research/phase6-convergence.md`],
        { cwd: REPO, encoding: "utf8", maxBuffer: 8 * 1024 * 1024 },
      );
      const protocol = execFileSync(
        "git",
        ["show", `${authorityRevision}:runner/src/phase6-protocol.ts`],
        { cwd: REPO, encoding: "utf8", maxBuffer: 8 * 1024 * 1024 },
      );
      const sweep = execFileSync(
        "git",
        ["show", `${authorityRevision}:runner/src/phase6-sweep.ts`],
        { cwd: REPO, encoding: "utf8", maxBuffer: 8 * 1024 * 1024 },
      );
      const crossPlatform = execFileSync(
        "git",
        ["show", `${authorityRevision}:runner/src/phase6-crossplatform.ts`],
        { cwd: REPO, encoding: "utf8", maxBuffer: 8 * 1024 * 1024 },
      );
      const wp3RecordCommit = execFileSync(
        "git",
        ["rev-parse", "--verify", "675288f^{commit}"],
        { cwd: REPO, encoding: "utf8" },
      ).trim();
      const phase6FreezeCommit = execFileSync(
        "git",
        ["rev-parse", "--verify", "e2f1bfc^{commit}"],
        { cwd: REPO, encoding: "utf8" },
      ).trim();
      const pointCommandStart = sweep.indexOf(
        "export function phase6PointCommand",
      );
      const pointCommandEnd = sweep.indexOf(
        "\nexport ",
        pointCommandStart + 1,
      );
      const pointCommand = pointCommandStart >= 0
        ? sweep.slice(
            pointCommandStart,
            pointCommandEnd >= 0 ? pointCommandEnd : undefined,
          )
        : "";
      let recordPredatesFreeze = false;
      try {
        execFileSync(
          "git",
          ["merge-base", "--is-ancestor", wp3RecordCommit, phase6FreezeCommit],
          { cwd: REPO, stdio: "ignore" },
        );
        recordPredatesFreeze = true;
      } catch {
        recordPredatesFreeze = false;
      }
      if (
        wp3RecordCommit
          !== "675288fce6e3d33dc6fb1c6d7d56d9818fb9b0bb"
        || phase6FreezeCommit
          !== "e2f1bfcab4cf605f5c9c44ad096d8b1bcc0fe967"
        || !recordPredatesFreeze
        || !report.includes("paramSet` CAK_A1")
        || !report.includes("### 1.2 At the registered measurement size")
        || /\b(?:Node|V8)\b/.test(report)
      ) {
        transferSourceProblems.push(
          "historical ladder parameter/runtime/code provenance",
        );
      }
      if (
        !protocol.includes(
          'PHASE6_PROTOCOL_FREEZE_COMMIT = "e2f1bfcab4cf605f5c9c44ad096d8b1bcc0fe967"',
        )
        || !protocol.includes('id: "code-version"')
        || !protocol.includes("node: process.version")
        || !protocol.includes("v8: process.versions.v8")
        || !protocol.includes("the sweep varies temperature and")
        || !protocol.includes("supersaturation only")
        || !crossPlatform.includes(
          "Host: win32 x64, Node v24.13.1, V8 13.6.233.17-node.40.",
        )
        || !pointCommand.includes('"--temp-c"')
        || !pointCommand.includes('"--sigma-inf"')
        || /--(?:timeline|schedule|event|ramp)/.test(pointCommand)
      ) {
        transferSourceProblems.push(
          "registered code/runtime/constant-environment contract",
        );
      }
      const transferAssetSource = readFileSync(
        join(PUBLIC_ROOT, "assets/anim-part2-transferability.js"),
        "utf8",
      );
      const transferOracleSource = readFileSync(
        join(TOOL_DIR, "part-two-oracles.mjs"),
        "utf8",
      );
      const inheritedAssetRows =
        /Object\.assign\(\{\},\s*target\s*,/.test(transferAssetSource);
      const inheritedOracleRows = [
        ...transferOracleSource.matchAll(/\.\.\.TRANSFER_TARGET/g),
      ].length;
      if (inheritedAssetRows || inheritedOracleRows !== 1) {
        transferSourceProblems.push(
          "evidence fixtures inherit unauthenticated target fields",
        );
      }
    } catch (error) {
      transferSourceProblems.push(`transfer source semantics: ${error.message}`);
    }
    requireCheck(
      transferSourceProblems.length === 0,
      "Part Two transferability contract resolves every pinned report, protocol, runtime-default, and test blob at main@8c781b1",
      transferSourceProblems.join(" | "),
    );
  }
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
    function canonicalNode(node) {
      if (node.nodeType !== Node.ELEMENT_NODE) {
        return [node.nodeType, node.nodeValue];
      }
      const attributes = [...node.attributes]
        .map((attribute) => [
          attribute.namespaceURI,
          attribute.name,
          attribute.value,
        ])
        .sort((left, right) => {
          const a = JSON.stringify(left);
          const b = JSON.stringify(right);
          return a < b ? -1 : a > b ? 1 : 0;
        });
      return [
        node.namespaceURI,
        node.localName,
        attributes,
        [...node.childNodes].map(canonicalNode),
      ];
    }
    return [...document.querySelectorAll("figure.anim, figure.chart")].map((root) => {
      // Chromium may serialize semantically identical SVG attributes in
      // insertion order (for example `fill` before or after `style`) across
      // otherwise equivalent contexts. Compare DOM structure with attributes
      // sorted instead, while retaining text, comments, values and child order.
      let material = JSON.stringify([...root.childNodes].map(canonicalNode));
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
    const visualRootOverflows = [];
    for (const root of roots) {
      const containers = [
        root,
        ...root.querySelectorAll(
          ".anim__head, .anim__body, .anim__controls, .chart__body",
        ),
      ];
      for (const container of containers) {
        if (
          container.clientWidth <= 0
          || container.scrollWidth <= container.clientWidth + 1
        ) continue;
        const overflowX = getComputedStyle(container).overflowX;
        if (overflowX === "auto" || overflowX === "scroll") continue;
        const identity = container === root
          ? "root"
          : container.className || container.tagName.toLowerCase();
        visualRootOverflows.push(
          `${root.id}:${identity}:${container.scrollWidth}>${container.clientWidth}`,
        );
      }
    }
    const inaccessibleScrollableTables = [
      ...document.querySelectorAll(".table-wrap"),
    ].filter((wrap) => wrap.scrollWidth > wrap.clientWidth + 1)
      .filter((wrap) =>
        wrap.getAttribute("role") !== "region"
        || wrap.tabIndex < 0
        || !(wrap.getAttribute("aria-label") || "").trim())
      .map((wrap, index) => {
        const table = wrap.querySelector("table");
        const caption = table?.querySelector("caption")?.textContent?.trim();
        return caption || `scrollable-table-${index + 1}`;
      });
    const sourcePlaceholderHeadings = [
      ...document.querySelectorAll(
        ".figure__missing h1, .figure__missing h2, .figure__missing h3, "
        + ".figure__missing h4, .figure__missing h5, .figure__missing h6",
      ),
    ].map((heading) => heading.textContent.trim());
    const headingSkips = [];
    const headings = [...document.querySelectorAll("main h1, main h2, main h3, main h4, main h5, main h6")];
    for (let index = 1; index < headings.length; index++) {
      const previous = Number(headings[index - 1].tagName.slice(1));
      const current = Number(headings[index].tagName.slice(1));
      if (current > previous + 1) {
        headingSkips.push(
          `${headings[index - 1].tagName}:${headings[index - 1].textContent.trim()}`
          + ` -> ${headings[index].tagName}:${headings[index].textContent.trim()}`,
        );
      }
    }
    function rgb(value) {
      const match = /^#([0-9a-f]{6})$/i.exec(value.trim());
      if (!match) return null;
      const integer = Number.parseInt(match[1], 16);
      return [
        (integer >> 16) & 255,
        (integer >> 8) & 255,
        integer & 255,
      ];
    }
    function luminance(color) {
      return color.map((channel) => {
        const value = channel / 255;
        return value <= 0.04045
          ? value / 12.92
          : ((value + 0.055) / 1.055) ** 2.4;
      }).reduce(
        (sum, value, index) =>
          sum + value * [0.2126, 0.7152, 0.0722][index],
        0,
      );
    }
    function ratio(left, right) {
      const a = luminance(left);
      const b = luminance(right);
      return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    }
    const rootStyle = getComputedStyle(document.documentElement);
    const token = (name) => rgb(rootStyle.getPropertyValue(name));
    const contrastPairs = [
      ["muted/surface", token("--ink-muted"), token("--surface-1")],
      ["muted/sunken", token("--ink-muted"), token("--surface-sunken")],
      ["good/surface", token("--status-good"), token("--surface-1")],
      ["critical/surface", token("--status-critical"), token("--surface-1")],
      ["critical/sunken", token("--status-critical"), token("--surface-sunken")],
      ["selected/white", token("--control-selected"), [255, 255, 255]],
    ];
    const lowContrastTokens = contrastPairs
      .filter(([, foreground, background]) =>
        !foreground || !background || ratio(foreground, background) < 4.5)
      .map(([label, foreground, background]) =>
        `${label}:${foreground && background ? ratio(foreground, background).toFixed(2) : "unparsed"}`);
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
      visualRootOverflows,
      inaccessibleScrollableTables,
      sourcePlaceholderHeadings,
      headingSkips,
      mainLandmarks: document.querySelectorAll("main").length,
      lowContrastTokens,
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
      for (const control of root.querySelectorAll("input, select, button")) {
        value += `|${control.tagName}:${control.type || ""}:${control.value || ""}`
          + `:${control.checked === true}:${control.disabled === true}`
          + `:${control.selectedIndex ?? ""}`;
      }
      return value;
    }

    function name(control) {
      return control.getAttribute("aria-label")
        || (control.labels?.length ? [...control.labels].map((label) => label.textContent).join(" ") : "")
        || control.closest(".control")?.querySelector("label")?.textContent
        || control.textContent
        || control.tagName;
    }

    function normalizedName(control) {
      return name(control).trim().replace(/\s+/g, " ");
    }

    function supportedControls(root) {
      return [...root.querySelectorAll("button")]
        .concat([...root.querySelectorAll("input, select")])
        .filter((control) =>
          control.tagName === "BUTTON"
          || control.tagName === "SELECT"
          || control.matches(
            'input[type="range"], input[type="checkbox"], input[type="radio"], '
            + 'input[type="text"], input[type="search"]',
          ));
    }

    // Several course interactives deliberately rebuild their controls while
    // changing state. Keep a stable description instead of retaining a
    // detached element and mistaking a click on that stale node for a broken
    // model.
    const identityDataKeys = [
      "control", "act", "action", "val", "run", "caseId", "viewId",
      "operator", "modeId", "dip", "field", "temp", "policy", "scenario",
      "target", "step", "kind", "choice", "preset", "surface",
    ];

    function describeControl(control, controls) {
      const tag = control.tagName;
      const type = control.type || "";
      const label = normalizedName(control);
      const peers = controls.filter((candidate) =>
        candidate.tagName === tag && (candidate.type || "") === type);
      const sameLabel = peers.filter((candidate) => normalizedName(candidate) === label);
      const data = {};
      for (const key of identityDataKeys) {
        if (control.dataset[key] != null) data[key] = control.dataset[key];
      }
      return {
        tag,
        type,
        id: control.id || "",
        label,
        ordinal: peers.indexOf(control),
        labelOrdinal: sameLabel.indexOf(control),
        data,
      };
    }

    function resolveControl(root, descriptor) {
      let candidates = supportedControls(root).filter((candidate) =>
        candidate.tagName === descriptor.tag
        && (candidate.type || "") === descriptor.type);
      if (descriptor.id) {
        const byId = candidates.find((candidate) => candidate.id === descriptor.id);
        if (byId) return byId;
      }
      const dataEntries = Object.entries(descriptor.data);
      if (dataEntries.length) {
        const byData = candidates.filter((candidate) =>
          dataEntries.every(([key, value]) => candidate.dataset[key] === value));
        if (byData.length === 1) return byData[0];
        if (byData.length > 1) candidates = byData;
      }
      const byLabel = candidates.filter((candidate) =>
        normalizedName(candidate) === descriptor.label);
      if (byLabel.length) {
        return byLabel[Math.max(0, descriptor.labelOrdinal)] || byLabel[0];
      }
      return candidates[Math.max(0, descriptor.ordinal)] || null;
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
      if (control.matches('input[type="text"], input[type="search"]')) {
        control.value = control.value === ""
          ? "verification probe"
          : `${control.value} verification probe`;
        control.dispatchEvent(new Event("input", { bubbles: true }));
        control.dispatchEvent(new Event("change", { bubbles: true }));
        return true;
      }
      return false;
    }

    for (const root of document.querySelectorAll("figure.anim, figure.chart")) {
      const initialControls = supportedControls(root);
      const controls = initialControls.map((control) =>
        describeControl(control, initialControls));
      const repeatedControlGroups = new Set();
      for (const descriptor of controls) {
        let control = resolveControl(root, descriptor);
        if (!control) continue;
        const refresh = () => {
          control = resolveControl(root, descriptor) || control;
          return control;
        };
        if (control.disabled) {
          // A disabled action may be truthful at the representative state
          // yet become available after a prerequisite input (for example,
          // the ESI feedback step below its illustrated threshold). Exercise
          // that reachable state instead of silently dropping the control.
          for (const setupControl of root.querySelectorAll("input, select")) {
            if (setupControl.disabled || !moveValueControl(setupControl)) continue;
            await settle();
            refresh();
            if (!control.disabled) break;
          }
          if (control.disabled) continue;
        }
        const repeatedGroup = control.dataset.control || "";
        if (repeatedGroup && repeatedControlGroups.has(repeatedGroup)) continue;
        if (repeatedGroup) repeatedControlGroups.add(repeatedGroup);
        eligible++;
        const label = descriptor.label;
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
                refresh();
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
              refresh();
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
                  refresh();
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
                  refresh();
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
              refresh();
            }
          }

          refresh();
          const before = effect(root);
          if (control.tagName === "BUTTON") {
            control.click();
          } else if (!moveValueControl(control)) {
            continue;
          }
          executed.push(`${root.id}:${label}`);
          await settle();
          refresh();
          let after = effect(root);
          let changed = before !== after;
          if (
            !changed
            && control.tagName === "BUTTON"
            && /\b(?:step|grow|advance)\b/i.test(label)
          ) {
            for (let attempt = 0; attempt < 7 && !changed; attempt++) {
              refresh();
              control.click();
              await settle();
              refresh();
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
                refresh();
                const prepared = effect(root);
                control.click();
                await settle();
                refresh();
                after = effect(root);
                if (after !== prepared) {
                  changed = true;
                  break;
                }
              }
            }
          }
          if (!changed && control.tagName === "BUTTON") {
            // Mode and choice buttons in older chapters do not all expose an
            // aria-pressed state. If the target is already selected, prepare
            // the same root with another live button and try the target again.
            // The comparison is against the prepared state so an inert target
            // cannot borrow the alternate's visible change.
            const alternates = [...root.querySelectorAll("button:not(:disabled)")]
              .filter((candidate) => candidate !== control);
            for (const alternate of alternates) {
              alternate.click();
              await settle();
              refresh();
              if (control.disabled) continue;
              const prepared = effect(root);
              control.click();
              await settle();
              refresh();
              after = effect(root);
              if (after !== prepared) {
                changed = true;
                break;
              }
            }
            if (!changed) {
              // A staged action can require both a reset and one prerequisite
              // action. Explore that two-step path while continuing to compare
              // the target only against the prepared state.
              const liveButtons = [...root.querySelectorAll("button:not(:disabled)")];
              const resets = liveButtons.filter((candidate) =>
                /\b(?:reset|restart|replay|start\s+(?:again|over)|back\s+to)\b/i
                  .test(normalizedName(candidate)));
              for (const reset of resets) {
                if (changed) break;
                reset.click();
                await settle();
                refresh();
                const prerequisites = [...root.querySelectorAll("button:not(:disabled)")]
                  .filter((candidate) =>
                    candidate !== control
                    && !/\b(?:reset|restart|replay|start\s+(?:again|over)|back\s+to)\b/i
                      .test(normalizedName(candidate)));
                for (const prerequisite of prerequisites) {
                  prerequisite.click();
                  await settle();
                  refresh();
                  if (control.disabled) continue;
                  const prepared = effect(root);
                  control.click();
                  await settle();
                  refresh();
                  after = effect(root);
                  if (after !== prepared) {
                    changed = true;
                    break;
                  }
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
  if (facts.visualRootOverflows.length) {
    add("visual-root internal layout", facts.visualRootOverflows.join(", "));
  }
  if (facts.inaccessibleScrollableTables.length) {
    add(
      "keyboard-accessible scroll tables",
      facts.inaccessibleScrollableTables.join(", "),
    );
  }
  if (facts.sourcePlaceholderHeadings.length) {
    add(
      "source-placeholder heading hierarchy",
      facts.sourcePlaceholderHeadings.join(", "),
    );
  }
  if (facts.headingSkips.length) {
    add("heading hierarchy", facts.headingSkips.join(" | "));
  }
  if (facts.mainLandmarks !== 1) {
    add("main landmark", `expected 1, got ${facts.mainLandmarks}`);
  }
  if (facts.lowContrastTokens.length) {
    add("text-token contrast", facts.lowContrastTokens.join(", "));
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

const capturedPartTwoEvidence = Object.create(null);

async function verifyPartTwoModels(browser, root) {
  const server = await serve(root);
  const context = await browser.newContext({
    reducedMotion: "reduce",
    colorScheme: "light",
    viewport: { width: 1100, height: 850 },
  });
  await installTheme(context, "light");
  const page = await context.newPage();
  try {
    await page.goto(
      `${server.baseUrl}/chapters/21-the-seam.html`,
      { waitUntil: "networkidle" },
    );
    const timelineHeader = await page.evaluate(() => {
      const hook = window.__educationTimelineEvents;
      if (!hook) return null;
      const fixture = hook.fixtures();
      return {
        version: hook.version,
        fixtures: fixture,
        formulaSamples: [-15, -5].map((tempC) => ({
          tempC,
          sigmaOld: 0.002,
          cSat: hook.cSat(tempC),
          vKin: hook.vKin(tempC),
          kineticLength: hook.kineticLength(tempC, fixture.lk.pressurePa),
          mIce: hook.mIce(tempC),
          transformedSigma: hook.transformSigma(
            0.002,
            fixture.lk.beforeEnvironment.tempC,
            fixture.lk.afterEnvironment.tempC,
          ),
        })),
      };
    });
    const timeline = timelineHeader
      ? {
          ...timelineHeader,
          ggBefore: null,
          ggApplied: null,
          ggReset: null,
          lkBefore: null,
          lkTransformed: null,
          lkReclamped: null,
          lkStepped: null,
          lkReset: null,
        }
      : null;
    const readTimeline = async () => page.evaluate(() => {
      const rootElement = document.getElementById("anim-timeline-events");
      const body = rootElement.querySelector(".anim__body");
      const isVisible = (element) => {
        if (!element) return false;
        const style = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return style.display !== "none"
          && style.visibility !== "hidden"
          && Number(style.opacity) !== 0
          && rect.width > 0
          && rect.height > 0;
      };
      const visibleTable = [...body.querySelectorAll("table")]
        .find((table) => isVisible(table));
      const snapshot = window.__educationTimelineEvents.snapshot();
      return {
        ...snapshot,
        dom: {
          operator: rootElement.dataset.timelineOperator,
          stage: rootElement.dataset.timelineStage,
          eventMode: rootElement.dataset.eventMode,
          visibleText: isVisible(body) ? body.innerText : "",
          visibleCellRows: visibleTable
            ? [...visibleTable.querySelectorAll("tbody tr")].map((row) =>
                [...row.querySelectorAll("th, td")].map((cell) =>
                  cell.innerText.trim().replace(/\s+/g, " ")))
            : [],
        },
      };
    });
    if (timeline) {
      timeline.ggBefore = await readTimeline();
      await page.click(
        '#anim-timeline-events [data-control="timeline-apply"]',
      );
      timeline.ggApplied = await readTimeline();
      await page.click(
        '#anim-timeline-events [data-control="timeline-reset"]',
      );
      timeline.ggReset = await readTimeline();
      await page.click(
        '#anim-timeline-events [data-control="timeline-operator"]'
        + '[data-operator="LibbrechtKinetics"]',
      );
      timeline.lkBefore = await readTimeline();
      await page.click(
        '#anim-timeline-events [data-control="timeline-apply"]',
      );
      timeline.lkTransformed = await readTimeline();
      await page.click(
        '#anim-timeline-events [data-control="timeline-solve"]',
      );
      timeline.lkReclamped = await readTimeline();
      await page.click(
        '#anim-timeline-events [data-control="timeline-step"]',
      );
      timeline.lkStepped = await readTimeline();
      await page.click(
        '#anim-timeline-events [data-control="timeline-reset"]',
      );
      timeline.lkReset = await readTimeline();
    }
    capturedPartTwoEvidence.timeline = structuredClone(timeline);
    const timelineProblems = timelineViolations(timeline);
    requireCheck(
      timelineProblems.length === 0,
      "timeline-event explorer independently preserves G-G state, conserves LK density, isolates shell re-clamp, and weights each fill segment at its own temperature",
      JSON.stringify(timelineProblems),
    );
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(100);
    const timelineScrollBefore = await page.evaluate(() => {
      const wrap = document.querySelector(
        "#anim-timeline-events .table-wrap",
      );
      if (!wrap) return null;
      wrap.focus();
      return {
        url: location.href,
        left: wrap.scrollLeft,
        clientWidth: wrap.clientWidth,
        scrollWidth: wrap.scrollWidth,
        role: wrap.getAttribute("role"),
        label: wrap.getAttribute("aria-label"),
        tabIndex: wrap.tabIndex,
      };
    });
    await page.keyboard.press("ArrowRight");
    await page.waitForTimeout(120);
    const timelineScrollAfter = await page.evaluate(() => {
      const wrap = document.querySelector(
        "#anim-timeline-events .table-wrap",
      );
      return wrap ? { url: location.href, left: wrap.scrollLeft } : null;
    });
    requireCheck(
      timelineScrollBefore !== null
        && timelineScrollAfter !== null
        && timelineScrollBefore.scrollWidth > timelineScrollBefore.clientWidth
        && timelineScrollBefore.role === "region"
        && timelineScrollBefore.tabIndex === 0
        && Boolean(timelineScrollBefore.label)
        && timelineScrollAfter.url === timelineScrollBefore.url
        && timelineScrollAfter.left > timelineScrollBefore.left,
      "keyboard focus pans the mobile timeline table without triggering chapter navigation",
      JSON.stringify({ timelineScrollBefore, timelineScrollAfter }),
    );
    await page.setViewportSize({ width: 1100, height: 850 });

    await page.goto(
      `${server.baseUrl}/chapters/22-when-the-numbers-stop-changing.html`,
      { waitUntil: "networkidle" },
    );
    const ledgerHeader = await page.evaluate(() => {
      const hook = window.EducationTestHooks?.part2LedgerSeparation;
      return hook
        ? {
            schema: hook.schema,
            fillUnitScale: hook.fillUnitScale,
            divergenceFloor: hook.divergenceFloor,
            scenarioIds: [...hook.scenarioIds],
          }
        : null;
    });
    const ledger = ledgerHeader
      ? { ...ledgerHeader, rows: [], crossAttempt: null }
      : null;
    if (ledger) {
      for (const scenarioId of ledger.scenarioIds) {
        await page.click(
          `#anim-part2-ledger-separation [data-control="ledger-scenario-${scenarioId}"]`,
        );
        ledger.rows.push(await page.evaluate((id) => {
          const rootElement =
            document.getElementById("anim-part2-ledger-separation");
          const hook = window.EducationTestHooks.part2LedgerSeparation;
          const body = rootElement.querySelector(".anim__body");
          const status = rootElement.querySelector(
            ".anim__head [role='status']",
          );
          const visibleText = (element) => {
            if (!element) return "";
            const style = getComputedStyle(element);
            const rect = element.getBoundingClientRect();
            if (
              style.display === "none"
              || style.visibility === "hidden"
              || Number(style.opacity) === 0
              || rect.width <= 0
              || rect.height <= 0
            ) return "";
            return element.innerText.trim().replace(/\s+/g, " ");
          };
          return {
            raw: hook.getRawScenario(id),
            dom: {
              scenarioId: rootElement.dataset.scenarioId,
              shellInjection: rootElement.dataset.shellInjection,
              smootherDrift: rootElement.dataset.smootherDrift,
              boundaryExchange: rootElement.dataset.boundaryExchange,
              divTol: rootElement.dataset.divTol,
              localExchangeSign: rootElement.dataset.localExchangeSign,
              placedFillUnits: rootElement.dataset.placedFillUnits,
              saturationExcessUnits: rootElement.dataset.saturationExcessUnits,
              kineticDemandUnits: rootElement.dataset.kineticDemandUnits,
              holeFillDeficitUnits: rootElement.dataset.holeFillDeficitUnits,
              fillUnitScale: rootElement.dataset.fillUnitScale,
              divergenceFloor: rootElement.dataset.divergenceFloor,
              crossLedgerPolicy: rootElement.dataset.crossLedgerPolicy,
              visibleText: visibleText(body),
              visibleStatusText: visibleText(status),
            },
          };
        }, scenarioId));
      }
      await page.click(
        '#anim-part2-ledger-separation [data-control="ledger-cross-cancel"]',
      );
      ledger.crossAttempt = await page.evaluate(() => {
        const rootElement =
          document.getElementById("anim-part2-ledger-separation");
        const body = rootElement.querySelector(".anim__body");
        return {
          attempted: rootElement.dataset.crossLedgerAttempted,
          policy: rootElement.dataset.crossLedgerPolicy,
          text: rootElement.textContent,
          visibleText: body?.innerText ?? "",
        };
      });
    }
    capturedPartTwoEvidence.ledger = structuredClone(ledger);
    const ledgerProblems = ledgerViolations(ledger);
    requireCheck(
      ledgerProblems.length === 0,
      "Part Two ledger explorer independently separates elliptic-solve balance, kinetic demand, clipping, and hole fill",
      JSON.stringify(ledgerProblems),
    );

    await page.goto(
      `${server.baseUrl}/chapters/23-walls-that-pretend-to-be-sky.html`,
      { waitUntil: "networkidle" },
    );
    const transferHeader = await page.evaluate(() => {
      const hook = window.EducationTestHooks?.part2Transferability;
      return hook
          ? {
            schema: hook.schema,
            axes: JSON.parse(JSON.stringify(hook.axes)),
            target: hook.getTargetConfig(),
            sourceAuthority: hook.getSourceAuthority(),
            evidenceIds: [...hook.evidenceIds],
          }
        : null;
    });
    const transfer = transferHeader
      ? { ...transferHeader, rows: [] }
      : null;
    if (transfer) {
      for (const evidenceId of transfer.evidenceIds) {
        await page.click(
          `#anim-part2-transferability [data-control="transfer-row-${evidenceId}"]`,
        );
        transfer.rows.push(await page.evaluate((id) => {
          const rootElement =
            document.getElementById("anim-part2-transferability");
          const hook = window.EducationTestHooks.part2Transferability;
          const visibleText = (element) => {
            if (!element) return "";
            const style = getComputedStyle(element);
            const rect = element.getBoundingClientRect();
            if (
              style.display === "none"
              || style.visibility === "hidden"
              || Number(style.opacity) === 0
              || rect.width <= 0
              || rect.height <= 0
            ) return "";
            return element.innerText.trim().replace(/\s+/g, " ");
          };
          return {
            raw: hook.getRawEvidence(id),
            dom: {
              selectedEvidenceId: rootElement.dataset.selectedEvidenceId,
              targetConfig: rootElement.dataset.targetConfig,
              selectedConfig: rootElement.dataset.selectedConfig,
              selectedSource: rootElement.dataset.selectedSource,
              selectedEvidenceStatus: rootElement.dataset.selectedEvidenceStatus,
              sourceAuthority: rootElement.dataset.sourceAuthority,
              tableRows: Array.from(
                rootElement.querySelectorAll("[data-config-key]"),
                (row) => {
                  const cells = row.querySelectorAll("th, td");
                  const evidence = row.querySelector("[data-config-match]");
                  return {
                    key: row.dataset.configKey,
                    label: visibleText(cells[0]),
                    target: visibleText(cells[1]),
                    evidence: visibleText(cells[2]),
                    match: evidence?.dataset.configMatch ?? "",
                  };
                },
              ),
              visibleSummaryText: visibleText(
                rootElement.querySelector(".transfer-summary"),
              ),
              visibleStatusText: visibleText(
                rootElement.querySelector(".anim__head [role='status']"),
              ),
              visibleScrollCueText: visibleText(
                rootElement.querySelector(".table-scroll-cue"),
              ),
              visibleAuthorityText: visibleText(
                rootElement.querySelector(".transfer-authority"),
              ),
              visibleCaptionText: visibleText(
                rootElement.querySelector("table caption"),
              ),
            },
          };
        }, evidenceId));
      }
    }
    capturedPartTwoEvidence.transferability = structuredClone(transfer);
    const transferProblems = transferabilityViolations(transfer);
    requireCheck(
      transferProblems.length === 0,
      `Part Two transferability matrix compares all ${TRANSFER_AXIS_COUNT} governing domain-study fields and refuses silent target inheritance and the CAK_A1-to-CAK shortcut`,
      JSON.stringify(transferProblems),
    );
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(100);
    const transferScrollBefore = await page.evaluate((axisCount) => {
      const rootElement =
        document.getElementById("anim-part2-transferability");
      const wrap = rootElement?.querySelector(".table-wrap");
      return wrap
        ? {
            left: wrap.scrollLeft,
            clientWidth: wrap.clientWidth,
            scrollWidth: wrap.scrollWidth,
            role: wrap.getAttribute("role"),
            tabIndex: wrap.tabIndex,
            label: wrap.getAttribute("aria-label"),
            rowCount: rootElement.querySelectorAll(
              "[data-config-key]",
            ).length,
            expectedRowCount: axisCount,
            pageOverflow:
              document.documentElement.scrollWidth - window.innerWidth,
            url: location.href,
          }
        : null;
    }, TRANSFER_AXIS_COUNT);
    await page.locator(
      "#anim-part2-transferability .table-wrap",
    ).focus();
    await page.keyboard.press("ArrowRight");
    await page.waitForTimeout(150);
    const transferScrollAfter = await page.evaluate(() => {
      const wrap = document.querySelector(
        "#anim-part2-transferability .table-wrap",
      );
      return wrap
        ? { left: wrap.scrollLeft, url: location.href }
        : null;
    });
    requireCheck(
      transferScrollBefore !== null
        && transferScrollAfter !== null
        && transferScrollBefore.scrollWidth
          > transferScrollBefore.clientWidth
        && transferScrollBefore.role === "region"
        && transferScrollBefore.tabIndex === 0
        && Boolean(transferScrollBefore.label)
        && transferScrollBefore.rowCount
          === transferScrollBefore.expectedRowCount
        && transferScrollBefore.pageOverflow <= 1
        && transferScrollAfter.url === transferScrollBefore.url
        && transferScrollAfter.left > transferScrollBefore.left,
      `the ${TRANSFER_AXIS_COUNT}-field transferability matrix stays inside an accessible, keyboard-pannable mobile region without page overflow or navigation`,
      JSON.stringify({ transferScrollBefore, transferScrollAfter }),
    );
    await page.setViewportSize({ width: 1100, height: 850 });

    await page.goto(
      `${server.baseUrl}/chapters/27-sealing-the-envelope.html`,
      { waitUntil: "networkidle" },
    );
    const checkpointHeader = await page.evaluate(() => {
      const hook = window.__VCC_EDU_CHECKPOINT_EXPLORER__;
      return hook
        ? {
            schemaVersion: hook.schemaVersion,
            cases: JSON.parse(JSON.stringify(hook.cases)),
          }
        : null;
    });
    const checkpoint = checkpointHeader
      ? { ...checkpointHeader, rendered: {}, reset: null }
      : null;
    if (checkpoint) {
      for (const record of checkpoint.cases) {
        await page.click(
          `#c27-checkpoint-mutations [data-control="checkpoint-case"]`
          + `[data-case-id="${record.id}"]`,
        );
        checkpoint.rendered[record.id] = await page.evaluate(() => {
          const rootElement = document.getElementById("c27-checkpoint-mutations");
          const visibleText = (element) => {
            if (!element) return "";
            const style = getComputedStyle(element);
            const rect = element.getBoundingClientRect();
            if (
              style.display === "none"
              || style.visibility === "hidden"
              || Number(style.opacity) === 0
              || rect.width <= 0
              || rect.height <= 0
            ) return "";
            return element.innerText.trim().replace(/\s+/g, " ");
          };
          const mutationCard = rootElement.querySelector(".ckx-card");
          return {
            selectedMutation: rootElement.dataset.selectedMutation,
            checkpointKind: rootElement.dataset.checkpointKind,
            codecOutcome: rootElement.dataset.codecOutcome,
            contextOutcome: rootElement.dataset.contextOutcome,
            failureStage: rootElement.dataset.failureStage,
            requiredFields: rootElement.dataset.requiredFields,
            visibleMutationRows: [...mutationCard.querySelectorAll(".ckx-code")]
              .map(visibleText),
            visibleRequiredFields: [
              ...mutationCard.querySelectorAll(".ckx-list li"),
            ].map(visibleText),
            visibleStages: [
              ...rootElement.querySelectorAll(".ckx-stage"),
            ].map((stage) => ({
              stage: stage.dataset.stage,
              disposition: stage.dataset.disposition,
              text: [
                visibleText(stage.querySelector("b")),
                visibleText(stage.querySelector("span")),
              ].filter(Boolean).join(" "),
            })),
            visibleResult: visibleText(
              rootElement.querySelector(".ckx-result"),
            ),
            visibleNote: visibleText(rootElement.querySelector(".ckx-note")),
          };
        });
      }
      await page.click(
        '#c27-checkpoint-mutations [data-control="checkpoint-reset"]',
      );
      checkpoint.reset = await page.evaluate(() => {
        const rootElement = document.getElementById("c27-checkpoint-mutations");
        const result = rootElement.querySelector(".ckx-result");
        return {
          selectedMutation: rootElement.dataset.selectedMutation,
          codecOutcome: rootElement.dataset.codecOutcome,
          contextOutcome: rootElement.dataset.contextOutcome,
          failureStage: rootElement.dataset.failureStage,
          visibleResult: result?.innerText ?? "",
        };
      });
    }
    capturedPartTwoEvidence.checkpoint = structuredClone(checkpoint);
    const checkpointProblems = checkpointViolations(checkpoint);
    requireCheck(
      checkpointProblems.length === 0,
      "checkpoint explorer independently derives fail-closed codec and evidence-context refusal stages from raw observations",
      JSON.stringify(checkpointProblems),
    );
    try {
      const productionCheckpoint = runCheckpointProductionOracle();
      const productionProblems = [];
      if (
        productionCheckpoint.pass !== true
        || productionCheckpoint.cases.length !== 10
        || productionCheckpoint.cases.some((record) =>
          JSON.stringify(record.expected) !== JSON.stringify(record.actual))
      ) {
        productionProblems.push("production outcomes");
      }
      if (
        productionCheckpoint.negativeControls.length !== 4
        || productionCheckpoint.negativeControls.some(
          (control) => control.refused !== true,
        )
      ) {
        productionProblems.push("production negative controls");
      }
      requireCheck(
        productionProblems.length === 0,
        "all ten checkpoint teaching cases execute through production codecs/context validation and all four production-oracle negative controls are refused",
        JSON.stringify(productionProblems),
      );
    } catch (error) {
      fail(
        "checkpoint production oracle",
        error.stack || error.message,
      );
    }

    await page.goto(
      `${server.baseUrl}/chapters/28-the-exam-result.html`,
      { waitUntil: "networkidle" },
    );
    const statusHeader = await page.evaluate(() => {
      const hook = window.__VCC_EDU_PHASE6_STATUS__;
      return hook
        ? {
            schemaVersion: hook.schemaVersion,
            records: JSON.parse(JSON.stringify(hook.records)),
          }
        : null;
    });
    const status = statusHeader
      ? { ...statusHeader, rendered: {}, reset: null }
      : null;
    if (status) {
      for (const view of ["historical", "current"]) {
        await page.click(
          `#c28-phase6-status [data-control="phase6-status-view"]`
          + `[data-view-id="${view}"]`,
        );
        status.rendered[view] = await page.evaluate(() => {
          const rootElement = document.getElementById("c28-phase6-status");
          const visibleText = (element) => {
            if (!element) return "";
            const style = getComputedStyle(element);
            const rect = element.getBoundingClientRect();
            if (
              style.display === "none"
              || style.visibility === "hidden"
              || Number(style.opacity) === 0
              || rect.width <= 0
              || rect.height <= 0
            ) return "";
            return element.innerText.trim().replace(/\s+/g, " ");
          };
          return {
            view: rootElement.dataset.view,
            recordId: rootElement.dataset.recordId,
            arm1Status: rootElement.dataset.arm1Status,
            arm2Status: rootElement.dataset.arm2Status,
            gateStatus: rootElement.dataset.gateStatus,
            reviewStatus: rootElement.dataset.reviewStatus,
            crossPlatformStatus: rootElement.dataset.crossPlatformStatus,
            arm1MeasuredHeadline: rootElement.dataset.arm1MeasuredHeadline,
            arm2Measurement: rootElement.dataset.arm2Measurement,
            visibleCards: [...rootElement.querySelectorAll(".p6s-card")]
              .map((card) => {
                const terms = [...card.querySelectorAll("dt")];
                const values = [...card.querySelectorAll("dd")];
                return {
                  title: visibleText(card.querySelector("h3")),
                  rows: terms.map((term, index) => ({
                    label: visibleText(term),
                    value: visibleText(values[index]),
                  })),
                };
              }),
            visibleStamp: visibleText(
              rootElement.querySelector(".p6s-stamp"),
            ),
            visibleBanner: visibleText(
              rootElement.querySelector(".p6s-banner"),
            ),
          };
        });
      }
      await page.click(
        '#c28-phase6-status [data-control="phase6-status-reset"]',
      );
      status.reset = await page.evaluate(() => {
        const rootElement = document.getElementById("c28-phase6-status");
        return {
          view: rootElement.dataset.view,
          visibleStamp:
            rootElement.querySelector(".p6s-stamp")?.innerText ?? "",
        };
      });
    }
    capturedPartTwoEvidence.status = structuredClone(status);
    const statusProblems = phase6StatusViolations(status);
    requireCheck(
      statusProblems.length === 0,
      "Phase 6 status control keeps Arm 1 history, current safeguards, incomplete Arm 2 execution, and its registered forecast separate",
      JSON.stringify(statusProblems),
    );

    const crossingHeader = await page.evaluate(() => {
      const hook = window.__VCC_EDU_CROSSINGS__;
      return hook
        ? {
            schemaVersion: hook.schemaVersion,
            constants: JSON.parse(JSON.stringify(hook.constants)),
          }
        : null;
    });
    const crossing = crossingHeader
      ? {
          ...crossingHeader,
          default: null,
          published: null,
          mutated: null,
          reset: null,
          controls: {},
        }
      : null;
    if (crossing) {
      const readCrossing = async () => page.evaluate(() => {
        const hook = window.__VCC_EDU_CROSSINGS__;
        const rootElement = document.getElementById("c28-crossings");
        const svg = rootElement.querySelector("svg");
        const isVisible = (element) => {
          if (!element) return false;
          const style = getComputedStyle(element);
          const rect = element.getBoundingClientRect();
          return style.display !== "none"
            && style.visibility !== "hidden"
            && Number(style.opacity) !== 0
            && rect.width > 0
            && rect.height > 0;
        };
        const evaluated = hook.state();
        return {
          state: JSON.parse(JSON.stringify(evaluated.state)),
          crossings: [...evaluated.crossings],
          publishedState: evaluated.publishedState,
          dom: {
            formulaMode: rootElement.dataset.formulaMode,
            basalDip: rootElement.dataset.basalDip,
            prismDip: rootElement.dataset.prismDip,
            basalCentre: rootElement.dataset.basalCentre,
            prismCentre: rootElement.dataset.prismCentre,
            depth: rootElement.dataset.depth,
            crossingCount: rootElement.dataset.crossingCount,
            crossings: rootElement.dataset.crossings,
            publishedState: rootElement.dataset.publishedState,
            verdictKind: rootElement.dataset.verdictKind,
            visibleReadout:
              rootElement.querySelector(".c28-readout")?.innerText ?? "",
            visibleBanner:
              rootElement.querySelector(".c28-banner")?.innerText ?? "",
            visibleSeriesCount:
              svg?.querySelectorAll("path.series-line").length ?? 0,
            visibleMarkerCount:
              svg?.querySelectorAll(
                'line[stroke-dasharray="3 3"][stroke-opacity="0.65"]',
              ).length ?? 0,
            visibleModelBandCount:
              svg?.querySelectorAll('rect[y="292"]').length ?? 0,
            visibleSvg: isVisible(svg),
          },
        };
      });
      await page.click('#c28-crossings [data-control="crossing-reset"]');
      crossing.default = await readCrossing();
      const readControlState = async () => page.evaluate(() => {
        const rootElement = document.getElementById("c28-crossings");
        const hook = window.__VCC_EDU_CROSSINGS__;
        const state = hook.state().state;
        const control = (selector) => rootElement.querySelector(selector);
        return {
          state: JSON.parse(JSON.stringify(state)),
          basalSliderDisabled: control(
            '[data-control="crossing-slider"][data-field="bC"]',
          )?.disabled,
          prismSliderDisabled: control(
            '[data-control="crossing-slider"][data-field="pC"]',
          )?.disabled,
          depthSliderDisabled: control(
            '[data-control="crossing-slider"][data-field="depth"]',
          )?.disabled,
          approximatePressed: control(
            '[data-control="crossing-mode"][data-mode-id="approx"]',
          )?.getAttribute("aria-pressed"),
          correctedPressed: control(
            '[data-control="crossing-mode"][data-mode-id="corrected"]',
          )?.getAttribute("aria-pressed"),
        };
      });
      crossing.controls.default = await readControlState();
      await page.click(
        '#c28-crossings [data-control="crossing-toggle"][data-dip="basal"]',
      );
      crossing.controls.basalOn = await readControlState();
      await page.click(
        '#c28-crossings [data-control="crossing-toggle"][data-dip="prism"]',
      );
      crossing.controls.bothOn = await readControlState();
      await page.locator(
        '#c28-crossings [data-control="crossing-slider"][data-field="bC"]',
      ).fill("6.2");
      crossing.controls.basalSlider = await readControlState();
      await page.locator(
        '#c28-crossings [data-control="crossing-slider"][data-field="pC"]',
      ).fill("16.1");
      crossing.controls.prismSlider = await readControlState();
      await page.locator(
        '#c28-crossings [data-control="crossing-slider"][data-field="depth"]',
      ).fill("0.5");
      crossing.controls.depthSlider = await readControlState();
      await page.click(
        '#c28-crossings [data-control="crossing-mode"][data-mode-id="corrected"]',
      );
      crossing.controls.correctedMode = await readControlState();
      await page.click(
        '#c28-crossings [data-control="crossing-mode"][data-mode-id="approx"]',
      );
      crossing.controls.approximateMode = await readControlState();
      await page.click('#c28-crossings [data-control="crossing-load-published"]');
      crossing.published = await readCrossing();
      await page.locator(
        '#c28-crossings [data-control="crossing-slider"][data-field="bC"]',
      ).fill("5.2");
      crossing.mutated = await readCrossing();
      await page.click('#c28-crossings [data-control="crossing-reset"]');
      crossing.reset = await readCrossing();
    }
    capturedPartTwoEvidence.crossing = structuredClone(crossing);
    const crossingProblems = crossingViolations(crossing);
    requireCheck(
      crossingProblems.length === 0,
      "crossing explorer derives roots from its actual state, gates the published-form verdict, and resets every control",
      JSON.stringify(crossingProblems),
    );
  } finally {
    await context.close();
    await server.close();
  }
}

async function negativeControls(
  browser,
  { partTwoModelControlsOnly = false } = {},
) {
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
    if (!partTwoModelControlsOnly) {
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

    await expectRejected(
      "clipped visual-root internal overflow",
      "visual-root internal layout",
      async () => {
        const result = await loadProfile(
          browser,
          server.baseUrl,
          "chapters/01-not-a-frozen-raindrop.html",
          { ...PROFILES.mobile, savedTheme: "dark" },
          "public",
        );
        const executed = await result.page.evaluate(() => {
          const body = document.querySelector("#anim-aggregate .anim__body");
          if (!body) return false;
          body.style.overflowX = "hidden";
          const probe = document.createElement("div");
          probe.style.width = "900px";
          probe.style.height = "1px";
          probe.dataset.overflowMutation = "true";
          body.appendChild(probe);
          return body.scrollWidth > body.clientWidth + 1;
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
      },
    );

    await expectRejected(
      "unlabeled keyboard-inaccessible scroll table",
      "keyboard-accessible scroll tables",
      async () => {
        const result = await loadProfile(
          browser,
          server.baseUrl,
          "chapters/01-not-a-frozen-raindrop.html",
          { ...PROFILES.mobile, savedTheme: "dark" },
          "public",
        );
        const executed = await result.page.evaluate(() => {
          const wrap = [...document.querySelectorAll(".table-wrap")]
            .find((candidate) =>
              candidate.scrollWidth > candidate.clientWidth + 1);
          if (!wrap) return false;
          wrap.removeAttribute("role");
          wrap.removeAttribute("tabindex");
          wrap.removeAttribute("aria-label");
          return wrap.tabIndex < 0 && !wrap.getAttribute("aria-label");
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
      },
    );

    await expectRejected(
      "low-contrast semantic text tokens",
      "text-token contrast",
      async () => {
        const result = await loadProfile(
          browser,
          server.baseUrl,
          "chapters/01-not-a-frozen-raindrop.html",
          PROFILES.storedLightOsLight,
          "public",
        );
        const executed = await result.page.evaluate(() => {
          document.documentElement.style.setProperty(
            "--ink-muted",
            "#eeeeee",
          );
          return getComputedStyle(document.documentElement)
            .getPropertyValue("--ink-muted").trim() === "#eeeeee";
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
      },
    );

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
    }

    if (!partOneOnly) {
      await expectRejected(
        "synchronized wrong timeline fixture",
        "timeline raw constants/fixtures",
        async () => {
          const evidence = structuredClone(capturedPartTwoEvidence.timeline);
          evidence.fixtures.gg.trigger = { kind: "tick", value: -999 };
          return {
            executed: evidence.fixtures.gg.trigger.value === -999,
            detections: timelineViolations(evidence),
          };
        },
      );

      await expectRejected(
        "blank timeline learner view",
        "timeline G-G before visible body",
        async () => {
          const evidence = structuredClone(capturedPartTwoEvidence.timeline);
          evidence.ggBefore.dom.visibleText = "";
          return {
            executed: evidence.ggBefore.dom.visibleText === "",
            detections: timelineViolations(evidence),
          };
        },
      );

      await expectRejected(
        "LK event density transform shifted",
        "timeline LK cell transform interior-low",
        async () => {
          const evidence = structuredClone(capturedPartTwoEvidence.timeline);
          evidence.lkTransformed.lk.cells[0].sigmaCurrent += 0.01;
          return {
            executed:
              evidence.lkTransformed.lk.cells[0].sigmaCurrent
              !== capturedPartTwoEvidence.timeline.lkTransformed.lk.cells[0]
                .sigmaCurrent,
            detections: timelineViolations(evidence),
          };
        },
      );

      await expectRejected(
        "LK event mutates completed state and clock",
        "timeline LK transformed state",
        async () => {
          const evidence = structuredClone(capturedPartTwoEvidence.timeline);
          evidence.lkTransformed.lk.state.tick += 1;
          evidence.lkTransformed.lk.state.f[1] += 0.125;
          return {
            executed:
              evidence.lkTransformed.lk.state.tick
                !== capturedPartTwoEvidence.timeline.lkTransformed.lk.state.tick
              && evidence.lkTransformed.lk.state.f[1]
                !== capturedPartTwoEvidence.timeline.lkTransformed.lk.state.f[1],
            detections: timelineViolations(evidence),
          };
        },
      );

      await expectRejected(
        "ledger rows deleted",
        "ledger row coverage",
        async () => {
          const evidence = structuredClone(capturedPartTwoEvidence.ledger);
          evidence.rows = [];
          return {
            executed: evidence.rows.length === 0,
            detections: ledgerViolations(evidence),
          };
        },
      );

      await expectRejected(
        "ledger witness coherently replaced",
        "ledger cold-fixed-point source-pinned fixture",
        async () => {
          const evidence = structuredClone(capturedPartTwoEvidence.ledger);
          const target = evidence.rows.find(
            (entry) => entry.raw.id === "cold-fixed-point",
          );
          target.raw.shellInjection = 1;
          target.raw.smootherDrift = 0;
          target.raw.boundaryExchange = 1;
          target.dom.shellInjection = "1";
          target.dom.smootherDrift = "0";
          target.dom.boundaryExchange = "1";
          return {
            executed: target.raw.shellInjection === 1,
            detections: ledgerViolations(evidence),
          };
        },
      );

      await expectRejected(
        "blank ledger learner view",
        "ledger cold-fixed-point visible teaching state",
        async () => {
          const evidence = structuredClone(capturedPartTwoEvidence.ledger);
          evidence.rows[0].dom.visibleText = "";
          return {
            executed: evidence.rows[0].dom.visibleText === "",
            detections: ledgerViolations(evidence),
          };
        },
      );

      await expectRejected(
        "cross-ledger substitution",
        "ledger missing-excess independent identities",
        async () => {
          const evidence = structuredClone(capturedPartTwoEvidence.ledger);
          const target = evidence.rows.find(
            (entry) => entry.raw.id === "missing-excess",
          );
          target.raw.saturationExcessUnits = 35_000;
          return {
            executed: target.raw.saturationExcessUnits === 35_000,
            detections: ledgerViolations(evidence),
          };
        },
      );

      await expectRejected(
        "transferability rows deleted",
        "transferability row coverage",
        async () => {
          const evidence = structuredClone(
            capturedPartTwoEvidence.transferability,
          );
          evidence.rows = [];
          return {
            executed: evidence.rows.length === 0,
            detections: transferabilityViolations(evidence),
          };
        },
      );

      await expectRejected(
        "transferability provenance coherently rewritten",
        "transferability cak-a1-domain source-pinned fixture",
        async () => {
          const evidence = structuredClone(
            capturedPartTwoEvidence.transferability,
          );
          const target = evidence.rows.find(
            (entry) => entry.raw.id === "cak-a1-domain",
          );
          target.raw.source = "invented source";
          target.dom.selectedSource = "invented source";
          return {
            executed: target.raw.source === "invented source",
            detections: transferabilityViolations(evidence),
          };
        },
      );

      await expectRejected(
        "transferability source authority coherently rewritten",
        "transferability source authority",
        async () => {
          const evidence = structuredClone(
            capturedPartTwoEvidence.transferability,
          );
          evidence.sourceAuthority.blobs[
            "research/phase6-convergence.md"
          ] = "0000000000000000000000000000000000000000";
          for (const entry of evidence.rows) {
            entry.dom.sourceAuthority = JSON.stringify(
              evidence.sourceAuthority,
            );
          }
          return {
            executed:
              evidence.sourceAuthority.blobs[
                "research/phase6-convergence.md"
              ] === "0000000000000000000000000000000000000000",
            detections: transferabilityViolations(evidence),
          };
        },
      );

      await expectRejected(
        "blank transferability learner view",
        "transferability cak-a1-domain visible teaching state",
        async () => {
          const evidence = structuredClone(
            capturedPartTwoEvidence.transferability,
          );
          const target = evidence.rows.find(
            (entry) => entry.raw.id === "cak-a1-domain",
          );
          target.dom.visibleSummaryText = "";
          return {
            executed: target.dom.visibleSummaryText === "",
            detections: transferabilityViolations(evidence),
          };
        },
      );

      await expectRejected(
        "off-configuration evidence relabeled transferable",
        "transferability cak-a1-domain mismatches",
        async () => {
          const evidence = structuredClone(
            capturedPartTwoEvidence.transferability,
          );
          const target = evidence.rows.find(
            (entry) => entry.raw.id === "cak-a1-domain",
          );
          target.raw.config.paramSet = "CAK";
          return {
            executed: target.raw.config.paramSet === "CAK",
            detections: transferabilityViolations(evidence),
          };
        },
      );

      await expectRejected(
        "historical omissions silently inherited from target",
        "transferability cak-a1-domain source-pinned fixture",
        async () => {
          const evidence = structuredClone(
            capturedPartTwoEvidence.transferability,
          );
          const target = evidence.rows.find(
            (entry) => entry.raw.id === "cak-a1-domain",
          );
          target.raw.config = structuredClone(evidence.target);
          target.dom.selectedConfig = JSON.stringify(target.raw.config);
          for (const row of target.dom.tableRows) {
            row.evidence = evidence.target[row.key];
            row.match = "true";
          }
          target.dom.visibleSummaryText =
            "Configuration match. All fields match.";
          target.dom.visibleStatusText =
            `${target.raw.label} — all configuration fields match.`;
          return {
            executed:
              target.raw.config.paramSet === evidence.target.paramSet
              && target.raw.config.runtimeIdentity
                === evidence.target.runtimeIdentity,
            detections: transferabilityViolations(evidence),
          };
        },
      );

      await expectRejected(
        "checkpoint teaching details erased",
        "checkpoint source-pinned teaching cases",
        async () => {
          const evidence = structuredClone(capturedPartTwoEvidence.checkpoint);
          const target = evidence.cases.find(
            (record) => record.id === "corrupt-magic",
          );
          delete target.mutation.operation;
          delete target.mutation.before;
          delete target.mutation.after;
          delete target.note;
          return {
            executed: target.mutation.operation === undefined,
            detections: checkpointViolations(evidence),
          };
        },
      );

      await expectRejected(
        "blank checkpoint learner view",
        "checkpoint clean-lk-v2 rendered state",
        async () => {
          const evidence = structuredClone(capturedPartTwoEvidence.checkpoint);
          evidence.rendered["clean-lk-v2"].visibleMutationRows = [];
          return {
            executed:
              evidence.rendered["clean-lk-v2"].visibleMutationRows.length === 0,
            detections: checkpointViolations(evidence),
          };
        },
      );

      await expectRejected(
        "checkpoint framing refusal erased",
        "checkpoint corrupt-magic outcome",
        async () => {
          const evidence = structuredClone(capturedPartTwoEvidence.checkpoint);
          const target = evidence.cases.find(
            (record) => record.id === "corrupt-magic",
          );
          target.observations[0].disposition = "accept";
          return {
            executed: target.observations[0].disposition === "accept",
            detections: checkpointViolations(evidence),
          };
        },
      );

      await expectRejected(
        "Phase 6 provenance and forecast coherently falsified",
        "Phase 6 source-pinned records",
        async () => {
          const evidence = structuredClone(capturedPartTwoEvidence.status);
          evidence.records.current.arm2.forecast =
            "99/90 measured and gate-passing";
          evidence.records.current.arm1.verifier = "no verifier exists";
          evidence.records.historical.arm1.evidenceClass =
            "validated gate evidence";
          evidence.records.current.authority.verifierCommit = "bogus";
          return {
            executed:
              evidence.records.current.authority.verifierCommit === "bogus",
            detections: phase6StatusViolations(evidence),
          };
        },
      );

      await expectRejected(
        "Arm 2 values-pin bridge omitted",
        "Phase 6 source-pinned records",
        async () => {
          const evidence = structuredClone(capturedPartTwoEvidence.status);
          evidence.records.current.authority.arm2ValuesPinCommit = "483f7ee";
          return {
            executed:
              evidence.records.current.authority.arm2ValuesPinCommit
                === "483f7ee",
            detections: phase6StatusViolations(evidence),
          };
        },
      );

      await expectRejected(
        "blank Phase 6 learner view",
        "Phase 6 current visible teaching state",
        async () => {
          const evidence = structuredClone(capturedPartTwoEvidence.status);
          evidence.rendered.current.visibleCards = [];
          return {
            executed: evidence.rendered.current.visibleCards.length === 0,
            detections: phase6StatusViolations(evidence),
          };
        },
      );

      await expectRejected(
        "incomplete Phase 6 arm relabeled complete",
        "Phase 6 current snapshot",
        async () => {
          const evidence = structuredClone(capturedPartTwoEvidence.status);
          evidence.records.current.arm2.runState = "complete";
          return {
            executed: evidence.records.current.arm2.runState === "complete",
            detections: phase6StatusViolations(evidence),
          };
        },
      );

      await expectRejected(
        "crossing control wiring falsified",
        "crossing actual control wiring",
        async () => {
          const evidence = structuredClone(capturedPartTwoEvidence.crossing);
          evidence.controls.default.state.bOn = true;
          return {
            executed: evidence.controls.default.state.bOn === true,
            detections: crossingViolations(evidence),
          };
        },
      );

      await expectRejected(
        "blank crossing learner chart",
        "crossing published visible chart state",
        async () => {
          const evidence = structuredClone(capturedPartTwoEvidence.crossing);
          evidence.published.dom.visibleReadout = "";
          return {
            executed: evidence.published.dom.visibleReadout === "",
            detections: crossingViolations(evidence),
          };
        },
      );

      await expectRejected(
        "published crossing location shifted",
        "crossing published independent roots",
        async () => {
          const evidence = structuredClone(capturedPartTwoEvidence.crossing);
          evidence.published.crossings[0] += 1;
          return {
            executed: evidence.published.crossings[0] > 4,
            detections: crossingViolations(evidence),
          };
        },
      );
    }
  } finally {
    await server.close();
  }
  const expectedNegativeControls = partTwoModelControlsOnly
    ? 24
    : partOneOnly
      ? 11
      : 35;
  requireCheck(
    passed === expectedNegativeControls,
    `all ${expectedNegativeControls} artifact-backed verifier negative controls executed and were rejected by production predicates`,
    `passed ${passed}/${expectedNegativeControls}`,
  );
}

mkdirSync(OUT, { recursive: true });
staticChecks();

if (!partTwoModelsOnly && modes.includes("offline")) {
  execFileSync("node", ["docs/education/tools/build-local.mjs"], {
    cwd: REPO,
    stdio: "inherit",
  });
  verifyOfflineSourceMap();
  verifyOfflineMediaBytes();
}

const browser = await chromium.launch();
try {
  if (partTwoModelsOnly) {
    await verifyPartTwoModels(browser, PUBLIC_ROOT);
    await negativeControls(browser, { partTwoModelControlsOnly: true });
  } else {
    for (const mode of modes) {
      const root = mode === "public" ? PUBLIC_ROOT : OFFLINE_ROOT;
      await verifySite(browser, mode, root);
    }
    const modelMode = modes.includes("public") ? "public" : "offline";
    const modelRoot = modelMode === "public" ? PUBLIC_ROOT : OFFLINE_ROOT;
    await verifyScientificModels(browser, modelRoot, modelMode);
    await verifyRibReplayControl(browser, modelRoot);
    if (!partOneOnly) await verifyPartTwoModels(browser, modelRoot);
    if (modes.includes("offline")) await verifyRealGrowthFailureStates(browser);
    await negativeControls(browser);
  }
} finally {
  await browser.close();
}

const report = {
  generatedAt: new Date().toISOString(),
  manifestSha256: sha256(join(TOOL_DIR, "site-manifest.json")),
  scope: partTwoModelsOnly
    ? "part-two-models"
    : partOneOnly
      ? "part-one"
      : "complete-course",
  pages: partTwoModelsOnly ? 6 : PAGE_PATHS.length,
  visualRoots: partTwoModelsOnly ? 6 : EXPECTED_ROOTS,
  modes: partTwoModelsOnly ? ["public"] : modes,
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
