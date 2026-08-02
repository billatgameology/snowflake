/*
 * Independent predicates for the Part Two teaching models.
 *
 * The browser widgets publish raw fixtures and rendered state. These functions
 * derive the verdict from those bytes; they never consume a widget-supplied
 * pass/fail flag.
 */

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { isAbsolute, join, relative, resolve, sep } from "node:path";
import {
  CHECKPOINT_TEACHING_CASES_SHA256,
} from "./checkpoint-production-oracle.mjs";

export const PHASE6_STATUS_COMMIT =
  "8c781b166db2c72d2fa86cef001e2e8c48ac96c3";
export const PHASE6_ARM2_VALUES_PIN_COMMIT =
  "0cb52bf821073b7bda79cddc0c47708cd6ecc239";
export const PHASE6_ARM2_PROTOCOL_SHA256 =
  "b09a932ec7345eddf838ee2de1c0ef4731212c625a1069e62193c06ae950fdec";
export const PHASE6_ARM2_VALUES_SHA256 =
  "13e678d5eec467a391958a18c71c8d170900d6efd0d5c23bb4362d863b9acd76";

const PHASE6_EXPECTED_EVIDENCE = Object.freeze([
  "phase6-crossplatform/arm64-libm-fingerprint.txt",
  "phase6-crossplatform/x64-libm-fingerprint.txt",
  "phase6-columns-ladder/ladder-BACKUP-20260731-162007.json",
  "phase6-columns-ladder/ladder.json",
  "phase6-domain-escalation/escalation-n80.json",
  "phase6-domain-spot-check/spot-check.json",
  "phase6-sweep-6995868-cak-a1-superseded/diagram.svg",
  "phase6-sweep/points.json",
  "phase6-sweep/report.json",
  "phase6-sweep/diagram.svg",
  "phase6-sweep-arm2-STRANDED-8c781b1/points.json",
  "phase6-sweep-arm2/diagram.svg",
  "phase6-sweep-arm2/points.json",
  "phase6-sweep-arm2/regeneration.json",
  "phase6-sweep-arm2/report.json",
  "phase6-sweep-6995868-cak-a1-superseded/points.json",
  "phase6-sweep-6995868-cak-a1-superseded/report.json",
  "phase6-throughput-probe/probe.json",
]);
const PHASE6_FRACTIONS = Object.freeze([0.10, 0.15, 0.25, 0.40, 0.60, 0.90]);
const PHASE6_TEMPS_C = Object.freeze(Array.from({ length: 34 }, (_, index) => -(index + 2)));
const PHASE6_BOUNDARIES = Object.freeze([3.3, 9.9, 21.5]);
const PHASE6_BISTABLE_C = Object.freeze([-4, -5, -6]);
const PHASE6_TARGET_EXTENT = 21;
const PHASE6_DOMAIN_N = 48;
const PHASE6_DOMAIN_CONTACT_FRACTION = 0.65;
const PHASE6_STEP_CAP = 100000;
const PHASE6_ACTIVE_CELLS = 77879;
const PHASE6_EXTENT_DRIFT_BOUND_AR = 0.135;
const PHASE6_FINGERPRINT_HOSTS = Object.freeze({
  x64: "host platform=win32 arch=x64 node=v24.13.1 v8=13.6.233.17-node.40",
  arm64: "host platform=darwin arch=arm64 node=v24.13.1 v8=13.6.233.17-node.40",
});
const PHASE6_FINGERPRINT_SHA256 = Object.freeze({
  x64: "c21fa3775360cfb910d524bf34eb2a6fef76059476805e50b9acb7531f6b53a4",
  arm64: "d6686f8e687bc4328cf693febe0325932077582f4fd3445bf6d6010e9bce0c02",
});
const PHASE6_SWEEP_ROW_KEYS = Object.freeze([
  "point", "result", "modelClass", "regime", "score", "inAmbiguityBand",
  "inHeadlineScope", "extentFragile", "exclusionReason",
]);
const PHASE6_SWEEP_RESULT_KEYS = Object.freeze([
  "tempC", "fraction", "sigmaInf", "steps", "attached", "aspectRatio",
  "largestExtent", "symmetryError", "deltaSymClean", "allConverged",
  "domainContact", "seconds",
]);
const PHASE6_SWEEP_REPORT_KEYS = Object.freeze([
  "protocolSha256", "head", "headlineAgree", "headlineTotal", "neutralCount",
  "excludedCount", "extentFragileCount", "perRegime", "excludedPoints",
]);
const PHASE6_M1_REPORT_KEYS = Object.freeze([
  "arm", "paramSet", "valuesSha256", "justificationSha256",
  ...PHASE6_SWEEP_REPORT_KEYS,
  "headlineAgreeCommonDenominator", "headlineTotalCommonDenominator", "bistable",
]);
const PHASE6_MANIFEST_KEYS = Object.freeze([
  "schema", "movedFrom", "movedTo", "note", "fileCount", "totalBytes", "files",
]);
const PHASE6_MANIFEST_METADATA = Object.freeze({
  movedFrom: "out/ (gitignored), plus the byte-identical tracked arm64 fingerprint formerly under docs/",
  movedTo: "evidence/ (tracked)",
  note: "Historical sweep digests were computed before their move and re-verified afterward. The arm64 fingerprint preserves the exact former docs/ Git blob (18398 bytes, SHA-256 d6686f8e...). The x64 fingerprint is the complete 2026-08-01 lightweight fixture re-execution backing the exact per-entry comparison; it reproduces registered digest 2a9f64b3. These are preserved claim-backing bytes, not regenerated production sweeps.",
});
const PHASE6_WATER_ANCHORS = Object.freeze([
  [0, 0], [-1, 0.01], [-2, 0.02], [-5, 0.05], [-10, 0.102],
  [-15, 0.157], [-20, 0.215], [-30, 0.34], [-40, 0.474],
]);
const PHASE6_M1_CONFIG = Object.freeze({
  paramSet: "M1",
  surfacePolicy: "aggregate-hv-g1h1-v6",
  farField: "monopole-matched",
  dxUm: 0.35,
  pressurePa: 101325,
  cfl: 0.1,
  relaxTol: 1e-9,
  divTol: 1e-7,
  relaxMaxSweeps: 200000,
  targetExtent: 21,
  rngSeed: 1,
  noiseEpsilon: 0,
  seedRadius: 2,
  dimsN: 48,
  hexRadius: 23,
  zHalfExtent: 23,
  activeCells: 77879,
  seedSites: 19,
});
const PHASE6_SWEEP_SPECS = Object.freeze({
  CAK: Object.freeze({
    name: "CAK",
    armSpecific: false,
    configMode: "legacy-absent",
    reportIdentity: Object.freeze({
      protocolSha256: "8aeb2b80a5d85357bca1ddbf7301e63ea7b53e714e4bc5ce290ac22e1b16698e",
      head: "390fe35a049e6da391c429c1f446fb2ca2cdb931",
    }),
  }),
  M1: Object.freeze({
    name: "M1",
    armSpecific: true,
    configMode: "required-m1",
    reportIdentity: Object.freeze({
      arm: "arm2-sdak-m1",
      paramSet: "M1",
      valuesSha256: PHASE6_ARM2_VALUES_SHA256,
      justificationSha256: "1b7faeb85fb9095931ef9294d65c619723ac389de24daddd8d9c173b833d00e8",
      protocolSha256: PHASE6_ARM2_PROTOCOL_SHA256,
      head: PHASE6_STATUS_COMMIT,
    }),
  }),
  CAK_A1: Object.freeze({
    name: "CAK_A1",
    armSpecific: false,
    configMode: "legacy-absent",
    reportIdentity: Object.freeze({
      protocolSha256: "9aa2e7c148aad117ba9ab7313bb36c55d4de3fccc3fbda4c2e43cc2af4974983",
      head: "3e3f75ceb1fa7a4afd473f16003c3e467d0a045e",
    }),
  }),
});

function sha256Bytes(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function utf8(bytes) {
  return Buffer.from(bytes).toString("utf8");
}

function parseJsonBytes(bytes, label, violations) {
  try {
    return JSON.parse(utf8(bytes));
  } catch (error) {
    violations.push(`${label} JSON: ${error.message}`);
    return null;
  }
}

function hasExactKeys(value, expectedKeys) {
  return value !== null
    && typeof value === "object"
    && !Array.isArray(value)
    && sameRecord(Object.keys(value).sort(), [...expectedKeys].sort());
}

const PHASE6_HELDOUT_LOCK = Object.freeze({
  schema: "phase6-heldout-candidate-lock-v1",
  lockId: "PHASE6_HELDOUT_CANDIDATES_2026_08_01",
  cutoffDate: "2026-08-01",
  status: "candidate-only-no-validation-target-frozen",
  passEligible: false,
  reason: "No audited family is presently apples-to-apples with the current single-crystal free-prism solver. This lock prevents source and extraction drift; it supplies no validation threshold.",
  pressureStatus: "source-locked-context-only",
  pressureScoreable: false,
  pressureReason: "Pressure is confounded with liquid-water content, temperature drift, apparatus/run population, polycrystallinity, ventilation, and riming; no pass interval may be derived.",
  canonicalSha256: "3d25dabd0c60f416f5d5337bfc5b6e63c6e70efe186839af4449d92261e9a0a7",
  normalizedTextSha256: "f245d9e6e4f899f1629c37376c2a4bf62475b5a705f9966aff816c36763f73a5",
});

const PHASE6_TIER2_HISTORICAL_ROWS = Object.freeze([
  Object.freeze({ point: "robust-plate", steps: "175", attached: "1313", aspectRatio: "0.263158", habit: "plate", arm64Wall: "697 s (11.6 min)", x64Wall: "20.9 min" }),
  Object.freeze({ point: "robust-column", steps: "195", attached: "1171", aspectRatio: "2.33333", habit: "column", arm64Wall: "810 s (13.5 min)", x64Wall: "22.1 min" }),
  Object.freeze({ point: "fragile-plate-ceiling", steps: "198", attached: "3157", aspectRatio: "0.684211", habit: "neutral", arm64Wall: "780 s (13.0 min)", x64Wall: "23.6 min" }),
  Object.freeze({ point: "fragile-column-floor", steps: "248", attached: "3037", aspectRatio: "1.50000", habit: "column", arm64Wall: "1197 s (20.0 min)", x64Wall: "33.4 min" }),
]);
const PHASE6_TIER2_BASELINE_BINDINGS = Object.freeze([
  Object.freeze({ point: "robust-plate", tempC: -2, fraction: 0.10, sigmaInf: "0.002000" }),
  Object.freeze({ point: "robust-column", tempC: -28, fraction: 0.10, sigmaInf: "0.031500" }),
  Object.freeze({ point: "fragile-plate-ceiling", tempC: -3, fraction: 0.25, sigmaInf: "0.007500" }),
  Object.freeze({ point: "fragile-column-floor", tempC: -23, fraction: 0.15, sigmaInf: "0.037875" }),
]);

function derivePhase6HeldOutLock(bytes) {
  const violations = [];
  const normalizedTextSha256 = sha256Bytes(
    Buffer.from(utf8(bytes).replace(/\r\n/g, "\n"), "utf8"),
  );
  if (normalizedTextSha256 !== PHASE6_HELDOUT_LOCK.normalizedTextSha256) {
    violations.push("held-out lock normalized-text SHA-256");
  }
  const lock = parseJsonBytes(bytes, "research/phase6-heldout-candidate-lock.json", violations);
  if (!lock || typeof lock !== "object" || Array.isArray(lock)) {
    return { violations, lock: null, status: "unavailable", passEligible: "unknown", reason: "lock unavailable" };
  }
  if (lock.schema !== PHASE6_HELDOUT_LOCK.schema) violations.push("held-out lock schema");
  if (lock.lockId !== PHASE6_HELDOUT_LOCK.lockId) violations.push("held-out lock identity");
  if (lock.cutoffDate !== PHASE6_HELDOUT_LOCK.cutoffDate) violations.push("held-out lock cutoff date");
  if (lock.status !== PHASE6_HELDOUT_LOCK.status) violations.push("held-out lock status");
  if (lock.gateMeaning?.passEligible !== PHASE6_HELDOUT_LOCK.passEligible) {
    violations.push("held-out lock pass eligibility");
  }
  if (lock.gateMeaning?.reason !== PHASE6_HELDOUT_LOCK.reason) {
    violations.push("held-out lock reason");
  }
  if (lock.pressureContext?.status !== PHASE6_HELDOUT_LOCK.pressureStatus) {
    violations.push("held-out lock pressure status");
  }
  if (lock.pressureContext?.scoreable !== PHASE6_HELDOUT_LOCK.pressureScoreable) {
    violations.push("held-out lock pressure eligibility");
  }
  if (lock.pressureContext?.reason !== PHASE6_HELDOUT_LOCK.pressureReason) {
    violations.push("held-out lock pressure reason");
  }
  const canonical = (value) => {
    if (value === null || typeof value !== "object") return JSON.stringify(value);
    if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
    return `{${Object.keys(value).sort().map(
      (key) => `${JSON.stringify(key)}:${canonical(value[key])}`,
    ).join(",")}}`;
  };
  const canonicalSha256 = sha256Bytes(Buffer.from(`${canonical(lock)}\n`, "utf8"));
  if (canonicalSha256 !== PHASE6_HELDOUT_LOCK.canonicalSha256) {
    violations.push("held-out lock canonical SHA-256");
  }
  return {
    violations,
    lock,
    status: String(lock.status ?? "unknown"),
    passEligible: String(lock.gateMeaning?.passEligible ?? "unknown"),
    reason: String(lock.gateMeaning?.reason ?? "reason unavailable"),
    pressureStatus: String(lock.pressureContext?.status ?? "unknown"),
    pressureScoreable: String(lock.pressureContext?.scoreable ?? "unknown"),
    pressureReason: String(lock.pressureContext?.reason ?? "reason unavailable"),
    canonicalSha256,
    normalizedTextSha256,
  };
}

function derivePhase6Tier2HistoricalReport(text, manifest, cakComparisonByKey) {
  const violations = [];
  const sourceText = String(text ?? "");
  const normalized = sourceText.replace(/\s+/g, " ");
  const sourceLines = sourceText.split(/\r?\n/);
  const tableRows = (header, separator, label) => {
    const headerIndexes = sourceLines.flatMap((line, index) => line === header ? [index] : []);
    if (headerIndexes.length !== 1) {
      violations.push(`${label} header inventory`);
      return [];
    }
    const headerIndex = headerIndexes[0];
    const block = [];
    for (let index = headerIndex; index < sourceLines.length; index += 1) {
      const line = sourceLines[index];
      if (!line.startsWith("|")) break;
      block.push(line);
    }
    if (block[1] !== separator) violations.push(`${label} separator`);
    const rowsInBlock = block.slice(2);
    if (rowsInBlock.length !== 4) violations.push(`${label} row inventory`);
    return rowsInBlock;
  };
  const numericCell = (cell) => {
    let value = String(cell).trim();
    if (value.startsWith("**") && value.endsWith("**")) value = value.slice(2, -2);
    if (value.startsWith("`") && value.endsWith("`")) value = value.slice(1, -1);
    return /^[0-9]+(?:\.[0-9]+)?$/.test(value) ? value : null;
  };
  const historicalRawRows = tableRows(
    "| point | steps | attached | `AR` | habit | arm64 wall | x64 wall |",
    "|---|---|---|---|---|---|---|",
    "Tier 2 historical table",
  );
  const rowPattern = /^\| `([^`]+)` \| (\d+) \| (\d+) \| ([^|]+) \| \*\*(plate|column|neutral)\*\* \| ([^|]+) \| ([^|]+) \|$/;
  const rows = historicalRawRows.flatMap((line) => {
    const match = rowPattern.exec(line);
    const aspectRatio = match === null ? null : numericCell(match[4]);
    if (match === null || aspectRatio === null) {
      violations.push("Tier 2 historical table malformed row");
      return [];
    }
    return [{
      point: match[1],
      steps: match[2],
      attached: match[3],
      aspectRatio,
      habit: match[5],
      arm64Wall: match[6].trim(),
      x64Wall: match[7].trim(),
    }];
  });
  const rowsMatch = sameRecord(rows, PHASE6_TIER2_HISTORICAL_ROWS);
  if (!rowsMatch) violations.push("Tier 2 historical table");
  const x64RawRows = tableRows(
    "| point | T | σ∞ | steps | attached | `AR` | **habit** |",
    "|---|---|---|---|---|---|---|",
    "Tier 2 x64 baseline table",
  );
  const x64RowPattern = /^\| `([^`]+)` \| ([−-]\d+) °C \| ([0-9.]+) \| (\d+) \| (\d+) \| ([^|]+) \| \*\*(plate|column|neutral)\*\* \|$/;
  const x64Rows = x64RawRows.flatMap((line) => {
    const match = x64RowPattern.exec(line);
    const aspectRatio = match === null ? null : numericCell(match[6]);
    if (match === null || aspectRatio === null) {
      violations.push("Tier 2 x64 baseline table malformed row");
      return [];
    }
    return [{
      point: match[1],
      tempC: Number(match[2].replace("−", "-")),
      sigmaInf: match[3],
      steps: Number(match[4]),
      attached: Number(match[5]),
      aspectRatio: Number(aspectRatio),
      habit: match[7],
    }];
  });
  const expectedX64Rows = PHASE6_TIER2_BASELINE_BINDINGS.map((binding, index) => ({
    point: binding.point,
    tempC: binding.tempC,
    sigmaInf: binding.sigmaInf,
    steps: Number(PHASE6_TIER2_HISTORICAL_ROWS[index].steps),
    attached: Number(PHASE6_TIER2_HISTORICAL_ROWS[index].attached),
    aspectRatio: Number(PHASE6_TIER2_HISTORICAL_ROWS[index].aspectRatio),
    habit: PHASE6_TIER2_HISTORICAL_ROWS[index].habit,
  }));
  const x64TableMatch = sameRecord(x64Rows, expectedX64Rows);
  if (!x64TableMatch) violations.push("Tier 2 x64 baseline table");
  const historicalSemantics = rows.map((row) => ({
    point: row.point,
    steps: Number(row.steps),
    attached: Number(row.attached),
    aspectRatio: Number(row.aspectRatio),
    habit: row.habit,
  }));
  const derivedX64Semantics = PHASE6_TIER2_BASELINE_BINDINGS.map((binding) => {
    const row = cakComparisonByKey?.[`${binding.tempC}|${binding.fraction.toFixed(2)}`];
    if (!row) return { point: binding.point, missing: true };
    if (row.sigmaInf.toFixed(6) !== binding.sigmaInf) {
      violations.push(`Tier 2 x64 baseline sigmaInf ${binding.point}`);
    }
    return {
      point: binding.point,
      steps: row.steps,
      attached: row.attached,
      aspectRatio: row.aspectRatio,
      habit: row.habit,
    };
  });
  const matchesTrackedCak = sameRecord(historicalSemantics, derivedX64Semantics);
  if (!matchesTrackedCak) {
    violations.push("Tier 2 historical rows do not match tracked CAK baseline");
  }
  const disclosurePresent = /underlying arm64 logs and exit-status bytes were not tracked and are unavailable to this repository; the arm64 output rows are therefore a historical report, not independently rederivable evidence/i.test(normalized);
  if (!disclosurePresent) violations.push("Tier 2 raw-evidence limit");
  const fingerprintPaths = new Set([
    "phase6-crossplatform/arm64-libm-fingerprint.txt",
    "phase6-crossplatform/x64-libm-fingerprint.txt",
  ]);
  const publishedRawPaths = Object.keys(manifest?.files || {}).filter(
    (path) => path.startsWith("phase6-crossplatform/") && !fingerprintPaths.has(path),
  );
  if (publishedRawPaths.length > 0) {
    violations.push("Tier 2 raw evidence appeared without an education-oracle parser");
  }
  return {
    violations,
    rows,
    rowsMatch,
    x64Rows,
    x64TableMatch,
    matchesTrackedCak,
    rawEvidencePublished: publishedRawPaths.length > 0,
  };
}

function phase6FingerprintDigest(entries) {
  let hash = 0x811c9dc5;
  for (const entry of entries) {
    for (const character of `${entry.name}|${entry.argument}|${entry.bits}\n`) {
      hash ^= character.codePointAt(0);
      hash = Math.imul(hash, 0x01000193) >>> 0;
    }
  }
  return hash.toString(16).padStart(8, "0");
}

function parsePhase6Fingerprint(bytes, label, expectedHost, violations) {
  const text = utf8(bytes);
  const lines = text.split(/\r?\n/);
  const hostLines = lines.filter((line) => line.startsWith("host platform="));
  const countIndexes = lines.flatMap((line, index) => line.startsWith("entries=") ? [index] : []);
  const digestIndexes = lines.flatMap(
    (line, index) => line.startsWith("PHASE6 LIBM DIGEST:") ? [index] : [],
  );
  const selfReportedHost = hostLines.length === 1 ? hostLines[0] : "";
  if (hostLines.length !== 1 || selfReportedHost !== expectedHost) {
    violations.push(`${label} self-reported host identity`);
  }
  if (countIndexes.length !== 1) violations.push(`${label} entries header inventory`);
  if (digestIndexes.length !== 1) violations.push(`${label} digest inventory`);
  const headerIndex = countIndexes.length === 1 ? countIndexes[0] : -1;
  const digestIndex = digestIndexes.length === 1 ? digestIndexes[0] : -1;
  const countMatch = headerIndex >= 0 ? /^entries=(\d+)$/.exec(lines[headerIndex]) : null;
  const digestMatch = digestIndex >= 0
    ? /^PHASE6 LIBM DIGEST: ([0-9a-f]{8})$/.exec(lines[digestIndex])
    : null;
  const declaredCount = countMatch === null ? Number.NaN : Number(countMatch[1]);
  const declaredDigest = digestMatch?.[1] || "";
  if (headerIndex < 0 || digestIndex <= headerIndex) violations.push(`${label} section ordering`);
  const entryLines = headerIndex >= 0 && digestIndex > headerIndex
    ? lines.slice(headerIndex + 1, digestIndex)
    : [];
  if (entryLines.length !== 448) violations.push(`${label} entry-row inventory`);
  const entries = new Map();
  const orderedEntries = [];
  for (const line of entryLines) {
    const match = /^  ([^\t]+)\t([^\t]+)\t([0-9a-f]{16})$/.exec(line);
    if (!match) {
      violations.push(`${label} malformed entry row`);
      continue;
    }
    const key = `${match[1]}|${match[2]}`;
    if (entries.has(key)) violations.push(`${label} duplicate ${key}`);
    entries.set(key, match[3]);
    orderedEntries.push({ name: match[1], argument: match[2], bits: match[3] });
  }
  if (declaredCount !== 448 || entries.size !== 448 || declaredCount !== entries.size) {
    violations.push(`${label} entry inventory`);
  }
  const computedDigest = phase6FingerprintDigest(orderedEntries);
  if (declaredDigest !== computedDigest) violations.push(`${label} independently derived digest`);
  return { declaredDigest, computedDigest, entries, selfReportedHost };
}

function comparePhase6Fingerprints(x64Bytes, arm64Bytes) {
  const violations = [];
  if (sha256Bytes(x64Bytes) !== PHASE6_FINGERPRINT_SHA256.x64) {
    violations.push("x64 fingerprint full-file SHA-256");
  }
  if (sha256Bytes(arm64Bytes) !== PHASE6_FINGERPRINT_SHA256.arm64) {
    violations.push("arm64 fingerprint full-file SHA-256");
  }
  const x64 = parsePhase6Fingerprint(
    x64Bytes,
    "x64 fingerprint",
    PHASE6_FINGERPRINT_HOSTS.x64,
    violations,
  );
  const arm64 = parsePhase6Fingerprint(
    arm64Bytes,
    "arm64 fingerprint",
    PHASE6_FINGERPRINT_HOSTS.arm64,
    violations,
  );
  if (x64.computedDigest !== "2a9f64b3") violations.push("x64 fingerprint digest");
  if (arm64.computedDigest !== "3662b9e2") violations.push("arm64 fingerprint digest");
  const sampledTemperatureArguments = [...x64.entries.keys()]
    .filter((key) => key.startsWith("pSatIce|"))
    .map((key) => key.slice("pSatIce|".length))
    .sort();
  const expectedTemperatureArguments = [
    ...Array.from({ length: 29 }, (_, index) => (-2 - index).toFixed(1)),
    "-3.3",
    "-9.9",
    "-21.5",
  ].sort();
  if (!sameRecord(sampledTemperatureArguments, expectedTemperatureArguments)) {
    violations.push("cross-platform fingerprint temperature coverage");
  }
  const keys = new Set([...x64.entries.keys(), ...arm64.entries.keys()]);
  let differing = 0;
  let maxUlp = 0n;
  for (const key of keys) {
    const left = x64.entries.get(key);
    const right = arm64.entries.get(key);
    if (left === undefined || right === undefined) {
      violations.push(`cross-platform fingerprint key set ${key}`);
      continue;
    }
    if (left !== right) {
      differing += 1;
      const distance = BigInt(`0x${left}`) >= BigInt(`0x${right}`)
        ? BigInt(`0x${left}`) - BigInt(`0x${right}`)
        : BigInt(`0x${right}`) - BigInt(`0x${left}`);
      if (distance > maxUlp) maxUlp = distance;
    }
  }
  if (keys.size !== 448 || differing !== 9 || maxUlp !== 31n) {
    violations.push("cross-platform independently derived difference summary");
  }
  return {
    violations,
    entries: keys.size,
    differing,
    maxUlp: Number(maxUlp),
    selfReportedHosts: {
      x64: x64.selfReportedHost,
      arm64: arm64.selfReportedHost,
    },
    temperatureCoverage: "integer -2..-30 C plus boundaries -3.3/-9.9/-21.5 C",
    missingRegisteredColdTailC: [-31, -32, -33, -34, -35],
  };
}

function phase6Regime(tempC) {
  const supercooling = -tempC;
  if (supercooling <= 3.3) return { key: "plates-warm", habit: "plate", headline: true };
  if (supercooling <= 9.9) return { key: "columns", habit: "column", headline: true };
  if (supercooling <= 21.5) return { key: "plates-cold", habit: "plate", headline: true };
  return { key: "columns-and-plates", habit: "either", headline: false };
}

function phase6DistanceToBoundary(tempC) {
  return Math.min(...PHASE6_BOUNDARIES.map((boundary) => Math.abs(-tempC - boundary)));
}

function phase6SigmaWater(tempC) {
  for (let index = 0; index < PHASE6_WATER_ANCHORS.length - 1; index += 1) {
    const [leftT, leftSigma] = PHASE6_WATER_ANCHORS[index];
    const [rightT, rightSigma] = PHASE6_WATER_ANCHORS[index + 1];
    if (tempC <= leftT && tempC >= rightT) {
      const position = (tempC - leftT) / (rightT - leftT);
      return leftSigma + position * (rightSigma - leftSigma);
    }
  }
  return Number.NaN;
}

function phase6HabitClass(aspectRatio) {
  if (!Number.isFinite(aspectRatio) || aspectRatio <= 0) return "invalid";
  if (aspectRatio <= 1 / 1.5) return "plate";
  if (aspectRatio >= 1.5) return "column";
  return "neutral";
}

function phase6Score(tempC, modelClass, armSpecific) {
  if (modelClass === "invalid") return "excluded";
  if (armSpecific && PHASE6_BISTABLE_C.includes(tempC)) {
    return modelClass === "neutral" ? "disagree" : "agree";
  }
  const regime = phase6Regime(tempC);
  const agrees = modelClass !== "neutral"
    && (regime.habit === "either" || modelClass === regime.habit);
  return agrees ? "agree" : "disagree";
}

function phase6ExtentFragile(aspectRatio) {
  return [1 / 1.5, 1.5].some(
    (threshold) => aspectRatio < threshold
      && aspectRatio >= threshold - PHASE6_EXTENT_DRIFT_BOUND_AR,
  );
}

function phase6ClosedExtentFragile(aspectRatio) {
  return [1 / 1.5, 1.5].some(
    (threshold) => Math.abs(aspectRatio - threshold) <= PHASE6_EXTENT_DRIFT_BOUND_AR,
  );
}

function phase6InvalidReasons(result, derivedDomainContact) {
  const reasons = [];
  if (!Number.isSafeInteger(result.steps) || result.steps < 0) {
    reasons.push("step count was not a nonnegative safe integer");
  } else if (result.steps > PHASE6_STEP_CAP) {
    reasons.push(`step count ${result.steps} exceeded the registered safety cap ${PHASE6_STEP_CAP}`);
  }
  if (!Number.isSafeInteger(result.attached) || result.attached < 0) {
    reasons.push("attached count was not a nonnegative safe integer");
  } else if (result.attached > PHASE6_ACTIVE_CELLS) {
    reasons.push(
      `attached count ${result.attached} exceeded the registered active-cell count ${PHASE6_ACTIVE_CELLS}`,
    );
  }
  if (!Number.isFinite(result.seconds) || result.seconds < 0) {
    reasons.push("wall seconds was not finite and nonnegative");
  }
  const extentTelemetryValid = Number.isSafeInteger(result.largestExtent)
    && result.largestExtent >= 0;
  if (!extentTelemetryValid) {
    reasons.push("largest extent was not a nonnegative safe integer");
  }
  if (result.allConverged !== true) {
    reasons.push(
      result.allConverged === false
        ? "a relaxation did not converge"
        : "allConverged telemetry was not exactly boolean true",
    );
  }
  if (result.deltaSymClean !== true) {
    reasons.push(
      result.deltaSymClean === false
        ? "a per-tick attachment delta broke D6h invariance"
        : "deltaSymClean telemetry was not exactly boolean true",
    );
  }
  if (result.symmetryError !== 0) {
    reasons.push(`symmetryError = ${result.symmetryError} with noise off`);
  }
  if (result.domainContact !== derivedDomainContact) {
    reasons.push("domain-contact telemetry did not match the independently derived geometry");
  }
  if (derivedDomainContact) reasons.push("tripped the 65% domain-contact guard");
  if (extentTelemetryValid && result.largestExtent < PHASE6_TARGET_EXTENT) {
    reasons.push(
      `stopped at extent ${result.largestExtent}, short of the registered measurement size `
      + `${PHASE6_TARGET_EXTENT} — habit is size-dependent, so this is not a smaller measurement of the same crystal`,
    );
  }
  if (result.config != null && result.config.stopReason !== "size-target") {
    reasons.push(`stop reason "${result.config.stopReason}", not the registered "size-target"`);
  }
  if (!Number.isFinite(result.aspectRatio) || result.aspectRatio <= 0) {
    reasons.push("aspect ratio was not finite and positive");
  }
  return reasons;
}

function phase6M1ConfigViolations(config, point, result) {
  const violations = [];
  if (!config || typeof config !== "object" || Array.isArray(config)) {
    return ["missing per-row self-reported configuration"];
  }
  const expected = {
    ...PHASE6_M1_CONFIG,
    tempC: point.tempC,
    sigmaInf: Number(point.sigmaInf.toFixed(6)),
    finalExtent: result.largestExtent,
  };
  const actualKeys = Object.keys(config).sort();
  const expectedKeys = [...Object.keys(expected), "stopReason"].sort();
  if (!sameRecord(actualKeys, expectedKeys)) violations.push("configuration key set");
  for (const [key, value] of Object.entries(expected)) {
    if (config[key] !== value) violations.push(`configuration ${key}`);
  }
  if (typeof config.stopReason !== "string" || config.stopReason.length === 0) {
    violations.push("configuration stopReason");
  }
  return violations;
}

function derivePhase6Sweep(pointsBytes, reportBytes, spec) {
  const { name, armSpecific } = spec;
  const violations = [];
  const points = parseJsonBytes(pointsBytes, `${name} points`, violations);
  const report = parseJsonBytes(reportBytes, `${name} report`, violations);
  const classes = { plate: 0, neutral: 0, column: 0, invalid: 0 };
  const byKey = new Map();
  const derivedByKey = new Map();
  let configRows = 0;
  let commonAgree = 0;
  let commonTotal = 0;
  let armAgree = 0;
  let armTotal = 0;

  if (!Array.isArray(points) || points.length !== 204) {
    violations.push(`${name} point inventory`);
  } else {
    for (const row of points) {
      if (!hasExactKeys(row, PHASE6_SWEEP_ROW_KEYS)) {
        violations.push(`${name} row key set`);
      }
      const tempC = row?.point?.tempC;
      const fraction = row?.point?.fraction;
      const key = `${tempC}|${Number(fraction).toFixed(2)}`;
      if (
        !PHASE6_TEMPS_C.includes(tempC)
        || !PHASE6_FRACTIONS.includes(fraction)
        || byKey.has(key)
      ) {
        violations.push(`${name} grid key ${key}`);
        continue;
      }
      byKey.set(key, row);
      const sigmaInf = phase6SigmaWater(tempC) * fraction;
      const distanceToBoundaryC = phase6DistanceToBoundary(tempC);
      const inAmbiguityBand = distanceToBoundaryC <= 1;
      const expectedPoint = {
        tempC,
        fraction,
        sigmaInf,
        inAmbiguityBand,
        distanceToBoundaryC,
      };
      if (!sameRecord(row.point, expectedPoint)) violations.push(`${name} point identity ${key}`);

      const result = row?.result;
      if (!result || typeof result !== "object" || Array.isArray(result)) {
        violations.push(`${name} result record ${key}`);
        continue;
      }
      const expectedResultKeys = spec.configMode === "required-m1"
        ? [...PHASE6_SWEEP_RESULT_KEYS, "config"]
        : PHASE6_SWEEP_RESULT_KEYS;
      if (!hasExactKeys(result, expectedResultKeys)) {
        violations.push(`${name} result key set ${key}`);
      }
      if (
        result.tempC !== tempC
        || result.fraction !== fraction
        || result.sigmaInf !== sigmaInf
      ) violations.push(`${name} result point identity ${key}`);
      if (
        !Number.isSafeInteger(result.steps) || result.steps < 0 || result.steps > PHASE6_STEP_CAP
        || !Number.isSafeInteger(result.attached) || result.attached < 0
        || result.attached > PHASE6_ACTIVE_CELLS
        || !Number.isFinite(result.seconds) || result.seconds < 0
        || !Number.isSafeInteger(result.largestExtent) || result.largestExtent < 0
      ) violations.push(`${name} result telemetry ${key}`);

      const derivedDomainContact = result.largestExtent / PHASE6_DOMAIN_N
        > PHASE6_DOMAIN_CONTACT_FRACTION;
      if (result.domainContact !== derivedDomainContact) {
        violations.push(`${name} independently derived domain contact ${key}`);
      }
      let configValid = true;
      if (spec.configMode === "required-m1") {
        const configProblems = phase6M1ConfigViolations(result.config, expectedPoint, result);
        if (configProblems.length > 0) {
          configValid = false;
          violations.push(...configProblems.map((problem) => `${name} ${problem} ${key}`));
        } else {
          configRows += 1;
        }
      } else if (Object.hasOwn(result, "config")) {
        configValid = false;
        violations.push(`${name} legacy row unexpectedly carries config ${key}`);
      }

      const invalidReasons = phase6InvalidReasons(result, derivedDomainContact);
      const expectedExclusionReason = configValid
        ? (invalidReasons.length > 0 ? invalidReasons.join("; ") : null)
        : "configuration identity did not match the registered M1 configuration";
      const modelClass = configValid && invalidReasons.length === 0
        ? phase6HabitClass(result.aspectRatio)
        : "invalid";
      classes[modelClass] += 1;
      const regime = phase6Regime(tempC);
      const commonProtocolScope = regime.headline && !inAmbiguityBand;
      const armProtocolScope = commonProtocolScope
        && (!armSpecific || !PHASE6_BISTABLE_C.includes(tempC));
      const commonScore = phase6Score(tempC, modelClass, false);
      const expectedScore = phase6Score(tempC, modelClass, armSpecific);
      if (commonProtocolScope && commonScore !== "excluded") {
        commonTotal += 1;
        if (commonScore === "agree") commonAgree += 1;
      }
      if (armProtocolScope && expectedScore !== "excluded") {
        armTotal += 1;
        if (expectedScore === "agree") armAgree += 1;
      }

      const extentFragile = modelClass !== "invalid" && phase6ExtentFragile(result.aspectRatio);
      const closedExtentFragile = modelClass !== "invalid"
        && phase6ClosedExtentFragile(result.aspectRatio);
      const exactThreshold = modelClass !== "invalid"
        && [1 / 1.5, 1.5].includes(result.aspectRatio);
      if (
        row.modelClass !== modelClass
        || row.regime !== regime.key
        || row.inAmbiguityBand !== inAmbiguityBand
        || row.point.inAmbiguityBand !== inAmbiguityBand
        || row.inHeadlineScope !== armProtocolScope
        || row.score !== expectedScore
        || row.extentFragile !== extentFragile
        || row.exclusionReason !== expectedExclusionReason
      ) {
        violations.push(`${name} producer labels ${key}`);
      }
      derivedByKey.set(key, {
        row,
        modelClass,
        regime,
        inAmbiguityBand,
        armProtocolScope,
        expectedScore,
        extentFragile,
        closedExtentFragile,
        exactThreshold,
        expectedExclusionReason,
      });
    }
  }

  for (const tempC of PHASE6_TEMPS_C) {
    for (const fraction of PHASE6_FRACTIONS) {
      if (!byKey.has(`${tempC}|${fraction.toFixed(2)}`)) {
        violations.push(`${name} missing ${tempC}|${fraction.toFixed(2)}`);
      }
    }
  }

  const grid = Object.fromEntries(PHASE6_FRACTIONS.map((fraction) => [
    String(fraction),
    PHASE6_TEMPS_C.map((tempC) => {
      const row = byKey.get(`${tempC}|${fraction.toFixed(2)}`);
      return ({ plate: "P", column: "C", neutral: ".", invalid: "X" })[
        derivedByKey.get(`${tempC}|${fraction.toFixed(2)}`)?.modelClass || "invalid"
      ];
    }).join(""),
  ]));

  const reportIsRecord = report !== null && typeof report === "object" && !Array.isArray(report);
  if (!reportIsRecord) {
    violations.push(`${name} report record`);
  } else {
    const expectedReportKeys = armSpecific ? PHASE6_M1_REPORT_KEYS : PHASE6_SWEEP_REPORT_KEYS;
    if (!hasExactKeys(report, expectedReportKeys)) {
      violations.push(`${name} report key set`);
    }
    const reportAgree = armSpecific ? armAgree : commonAgree;
    const reportTotal = armSpecific ? armTotal : commonTotal;
    for (const [field, value] of Object.entries(spec.reportIdentity)) {
      if (report[field] !== value) violations.push(`${name} report identity ${field}`);
    }
    const derivedRows = [...derivedByKey.values()];
    const perRegime = ["plates-warm", "columns", "plates-cold", "columns-and-plates"].map(
      (regimeKey) => {
        const regime = phase6Regime(
          regimeKey === "plates-warm" ? -2
            : regimeKey === "columns" ? -5
              : regimeKey === "plates-cold" ? -15 : -30,
        );
        const rows = derivedRows.filter((entry) => (
          entry.regime.key === regimeKey
          && !entry.inAmbiguityBand
          && (!regime.headline || entry.armProtocolScope)
        ));
        return {
          regime: regimeKey,
          inHeadline: regime.headline,
          agree: rows.filter((entry) => entry.expectedScore === "agree").length,
          disagree: rows.filter((entry) => entry.expectedScore === "disagree").length,
          excluded: rows.filter((entry) => entry.expectedScore === "excluded").length,
          neutralCount: rows.filter((entry) => entry.modelClass === "neutral").length,
          extentFragile: rows.filter((entry) => entry.extentFragile).length,
        };
      },
    );
    const expectedExcludedPoints = derivedRows
      .filter((entry) => entry.expectedExclusionReason !== null)
      .map((entry) => ({
        tempC: entry.row.point.tempC,
        fraction: entry.row.point.fraction,
        reason: entry.expectedExclusionReason,
      }));
    if (
      report.headlineAgree !== reportAgree
      || report.headlineTotal !== reportTotal
      || report.neutralCount !== classes.neutral
      || report.excludedCount !== classes.invalid
      || report.extentFragileCount !== derivedRows.filter((entry) => entry.extentFragile).length
      || !sameRecord(report.perRegime, perRegime)
      || !Array.isArray(report.excludedPoints)
      || !sameRecord(report.excludedPoints, expectedExcludedPoints)
      || expectedExcludedPoints.length !== classes.invalid
    ) {
      violations.push(`${name} independently derived report`);
    }
    if (armSpecific && (
      report.headlineAgreeCommonDenominator !== commonAgree
      || report.headlineTotalCommonDenominator !== commonTotal
    )) {
      violations.push(`${name} common-denominator report totals`);
    }
    if (armSpecific) {
      const bistable = derivedRows.filter((entry) => PHASE6_BISTABLE_C.includes(entry.row.point.tempC));
      const expectedBistable = {
        temperaturesC: [...PHASE6_BISTABLE_C],
        points: bistable.length,
        agree: bistable.filter((entry) => entry.expectedScore === "agree").length,
        neutralCount: bistable.filter((entry) => entry.modelClass === "neutral").length,
      };
      if (!sameRecord(report.bistable, expectedBistable)) {
        violations.push(`${name} independently derived bistable report`);
      }
    }
  }

  const derivedRows = [...derivedByKey.values()];
  const exactThresholdRows = derivedRows
    .filter((entry) => entry.exactThreshold)
    .map((entry) => ({
      tempC: entry.row.point.tempC,
      fraction: entry.row.point.fraction,
      aspectRatio: entry.row.result.aspectRatio,
    }));
  const extentFragility = {
    historicalOneSided: derivedRows.filter((entry) => entry.extentFragile).length,
    closedSymmetric: derivedRows.filter((entry) => entry.closedExtentFragile).length,
    additional: derivedRows.filter(
      (entry) => entry.closedExtentFragile && !entry.extentFragile,
    ).length,
    exactThresholdRows,
  };
  const comparisonByKey = Object.fromEntries([...derivedByKey].map(([key, entry]) => [
    key,
    {
      sigmaInf: entry.row.point.sigmaInf,
      steps: entry.row.result.steps,
      attached: entry.row.result.attached,
      aspectRatio: entry.row.result.aspectRatio,
      habit: entry.modelClass,
    },
  ]));

  return {
    violations,
    points: Array.isArray(points) ? points.length : 0,
    classes,
    commonAgree,
    commonTotal,
    armAgree,
    armTotal,
    configRows,
    extentFragility,
    comparisonByKey,
    grid,
    report,
  };
}

export function loadPhase6TrackedInputs(repoRoot) {
  const manifestBytes = readFileSync(join(repoRoot, "evidence/MANIFEST.json"));
  const manifest = JSON.parse(utf8(manifestBytes));
  const files = {};
  const evidenceRoot = resolve(repoRoot, "evidence");
  for (const path of Object.keys(manifest.files || {})) {
    const resolvedPath = resolve(evidenceRoot, path);
    if (
      !/^[A-Za-z0-9._/-]+$/.test(path)
      || isAbsolute(path)
      || path.includes("\\")
      || path.includes("//")
      || /(?:^|\/)\.{1,2}(?:\/|$)/.test(path)
      || !resolvedPath.startsWith(`${evidenceRoot}${sep}`)
      || relative(evidenceRoot, resolvedPath).replace(/\\/g, "/") !== path
    ) {
      throw new Error(`unsafe Phase 6 evidence manifest path: ${path}`);
    }
    files[path] = readFileSync(resolvedPath);
  }
  return {
    manifestBytes,
    files,
    handoff: readFileSync(join(repoRoot, "docs/HANDOFF.md"), "utf8"),
    progress: readFileSync(join(repoRoot, "docs/PROGRESS.md"), "utf8"),
    twoArmReport: readFileSync(join(repoRoot, "research/phase6-two-arm-report.md"), "utf8"),
    heldOutCandidateLockBytes: readFileSync(
      join(repoRoot, "research/phase6-heldout-candidate-lock.json"),
    ),
    crossPlatformReportText: readFileSync(
      join(repoRoot, "docs/phase6-cross-platform-control.md"),
      "utf8",
    ),
    activePlan: readFileSync(join(repoRoot, "docs/plans/phase-6-science-first-completion.md"), "utf8"),
    charter: readFileSync(join(repoRoot, "project charter.md"), "utf8"),
  };
}

export function derivePhase6TrackedAuthority(inputs) {
  const violations = [];
  const manifest = parseJsonBytes(inputs?.manifestBytes, "evidence/MANIFEST.json", violations);
  let actualBytes = 0;
  let actualFiles = 0;
  if (!manifest || manifest.schema !== "phase6-evidence-manifest-v1") {
    violations.push("Phase 6 manifest schema");
  } else {
    if (!hasExactKeys(manifest, PHASE6_MANIFEST_KEYS)) {
      violations.push("Phase 6 manifest key set");
    }
    for (const [field, expected] of Object.entries(PHASE6_MANIFEST_METADATA)) {
      if (manifest[field] !== expected) violations.push(`Phase 6 manifest provenance ${field}`);
    }
    if (
      typeof manifest.movedFrom !== "string"
      || typeof manifest.movedTo !== "string"
      || typeof manifest.note !== "string"
      || !Number.isInteger(manifest.fileCount) || manifest.fileCount < 0
      || !Number.isInteger(manifest.totalBytes) || manifest.totalBytes < 0
      || manifest.files === null || typeof manifest.files !== "object" || Array.isArray(manifest.files)
    ) {
      violations.push("Phase 6 manifest field types");
    }
    for (const [path, pin] of Object.entries(manifest.files || {})) {
      const bytes = inputs.files?.[path];
      actualFiles += 1;
      if (
        !hasExactKeys(pin, ["bytes", "sha256"])
        || !Number.isInteger(pin?.bytes) || pin.bytes < 0
        || typeof pin?.sha256 !== "string" || !/^[0-9a-f]{64}$/.test(pin.sha256)
      ) {
        violations.push(`Phase 6 manifest pin schema ${path}`);
      }
      if (!bytes) {
        violations.push(`Phase 6 manifest missing bytes ${path}`);
        continue;
      }
      const length = bytes.byteLength;
      actualBytes += length;
      if (length !== pin?.bytes || sha256Bytes(bytes) !== pin?.sha256) {
        violations.push(`Phase 6 manifest pin ${path}`);
      }
    }
    if (manifest.fileCount !== actualFiles || manifest.totalBytes !== actualBytes) {
      violations.push("Phase 6 manifest aggregate");
    }
    const actualPaths = Object.keys(manifest.files || {}).sort();
    const expectedPaths = [...PHASE6_EXPECTED_EVIDENCE].sort();
    if (!sameRecord(actualPaths, expectedPaths)) {
      violations.push("Phase 6 evidence manifest inventory");
    }
  }

  const file = (path) => inputs.files?.[path] || Buffer.from("null");
  const crossPlatform = comparePhase6Fingerprints(
    file("phase6-crossplatform/x64-libm-fingerprint.txt"),
    file("phase6-crossplatform/arm64-libm-fingerprint.txt"),
  );
  const heldOutLock = derivePhase6HeldOutLock(inputs?.heldOutCandidateLockBytes);
  const cak = derivePhase6Sweep(
    file("phase6-sweep/points.json"),
    file("phase6-sweep/report.json"),
    PHASE6_SWEEP_SPECS.CAK,
  );
  const m1 = derivePhase6Sweep(
    file("phase6-sweep-arm2/points.json"),
    file("phase6-sweep-arm2/report.json"),
    PHASE6_SWEEP_SPECS.M1,
  );
  const cakA1 = derivePhase6Sweep(
    file("phase6-sweep-6995868-cak-a1-superseded/points.json"),
    file("phase6-sweep-6995868-cak-a1-superseded/report.json"),
    PHASE6_SWEEP_SPECS.CAK_A1,
  );
  const tier2Historical = derivePhase6Tier2HistoricalReport(
    inputs?.crossPlatformReportText,
    manifest,
    cak.comparisonByKey,
  );
  violations.push(
    ...crossPlatform.violations,
    ...heldOutLock.violations,
    ...tier2Historical.violations,
    ...cak.violations,
    ...m1.violations,
    ...cakA1.violations,
  );

  const handoff = inputs?.handoff || "";
  const progress = inputs?.progress || "";
  const reportText = inputs?.twoArmReport || "";
  const plan = inputs?.activePlan || "";
  const charter = inputs?.charter || "";
  const handoffDate = /^# Handoff[^\n]*\((\d{4}-\d{2}-\d{2})\)\s*$/m.exec(handoff)?.[1] || "";
  const progressDate = /^- \*\*Last updated:\*\* (\d{4}-\d{2}-\d{2})\b/m.exec(progress)?.[1] || "";
  const authorityChecks = [
    [handoffDate !== "" && handoffDate === progressDate, "state-index date agreement"],
    [/Phase 6 is ACTIVE AND INCOMPLETE/i.test(handoff), "HANDOFF phase status"],
    [/R15 has no production\s+caller or complete artifact\/gate/i.test(handoff), "HANDOFF R15 status"],
    [/historical table reports four CAK output rows matching the x64 baseline/i.test(handoff), "HANDOFF portability scope"],
    [/raw arm64 logs[\s\S]{0,120}unavailable/i.test(handoff), "HANDOFF portability provenance limit"],
    [/no end-to-end, M1 or full-grid[\s\S]{0,80}independently rederivable/i.test(handoff), "HANDOFF portability limit"],
    [/passEligible=false/i.test(handoff), "HANDOFF source lock"],
    [/Phase 6 is ACTIVE AND INCOMPLETE/i.test(progress), "PROGRESS phase status"],
    [/CAK 3\/90, M1 54\/90/i.test(progress), "PROGRESS measured counts"],
    [/matched `?M1_NO_DIP_ABLATION`?/i.test(progress), "PROGRESS no-dip obligation"],
    [/cannot establish physical SDAK causality or necessity/i.test(progress), "PROGRESS causal limit"],
    [/measured-only[\s\S]{0,120}not ADR 0026/i.test(reportText), "two-arm report gate status"],
    [/R15[\s\S]{0,120}GPU[\s\S]{0,120}held-out obligations remain open/i.test(reportText), "two-arm report open work"],
    [/M1_NO_DIP_ABLATION/i.test(plan), "active plan no-dip arm"],
    [/growth rates vs \(T, σ\), size-dependent habit, pressure dependence, and growth-history responses/i.test(charter), "charter four held-out families"],
  ];
  for (const [ok, label] of authorityChecks) if (!ok) violations.push(label);

  const record = {
    id: "current",
    label: "Current Phase 6 authority",
    authority: {
      stateDate: `${handoffDate || "unknown-date"} tracked authority`,
      stateIndex: "docs/HANDOFF.md and docs/PROGRESS.md",
      resultArtifact: "research/phase6-two-arm-report.md",
      evidenceManifest: `evidence/MANIFEST.json: ${actualFiles} files / ${actualBytes} bytes`,
      historicalArm2ExecutionCommit: m1.report?.head || "",
      arm2ValuesSha256: m1.report?.valuesSha256 || "",
      snapshotMeaning: "both historical arms measured; replacement-gate obligations remain open",
    },
    arm1: {
      runState: "complete historical measurement",
      points: `${cak.points}/204`,
      measuredHeadline: `${cak.commonAgree}/${cak.commonTotal}`,
      classes: `${cak.classes.plate} plate / ${cak.classes.neutral} neutral / ${cak.classes.column} column`,
      modelInvalidRows: `${cak.classes.invalid}/${cak.points}`,
      evidenceClass: "measured-only; not the registered replacement gate",
      historicalScope: "reported broad-facet CAK arm; legacy rows predate per-row self-reported config",
      extentFragility: `historical one-sided=${cak.extentFragility.historicalOneSided}; closed symmetric |AR-threshold| <= ${PHASE6_EXTENT_DRIFT_BOUND_AR}=${cak.extentFragility.closedSymmetric}; additional=${cak.extentFragility.additional}; exact-threshold witnesses=${cak.extentFragility.exactThresholdRows.map((row) => `${row.tempC}C/f=${row.fraction}/AR=${row.aspectRatio}`).join(",")}`,
    },
    arm2: {
      runState: "complete historical measurement",
      points: `${m1.points}/204`,
      measurement: `${m1.commonAgree}/${m1.commonTotal} common scope; ${m1.armAgree}/${m1.armTotal} arm-specific scope`,
      classes: `${m1.classes.plate} plate / ${m1.classes.neutral} neutral / ${m1.classes.column} column`,
      modelInvalidRows: `${m1.classes.invalid}/${m1.points}`,
      model: `M1 everywhere-narrow starter approximation; ${m1.configRows}/${m1.points} rows self-report the registered M1 configuration`,
      evidenceClass: "measured-only and in-sample; not the registered replacement gate",
      comparisonLimit: "historical CAK to M1 changes broad curves, A prefactors, and dip factors; causal attribution is confounded",
      futureMatchedPairLimit: "under one frozen sampled configuration, isolates only the implemented dip-factor intervention effect; not physical SDAK causality or necessity",
      extentFragility: `historical one-sided=${m1.extentFragility.historicalOneSided}; closed symmetric |AR-threshold| <= ${PHASE6_EXTENT_DRIFT_BOUND_AR}=${m1.extentFragility.closedSymmetric}; additional=${m1.extentFragility.additional}; exact-threshold witnesses=${m1.extentFragility.exactThresholdRows.map((row) => `${row.tempC}C/f=${row.fraction}/AR=${row.aspectRatio}`).join(",")}`,
    },
    closure: {
      registeredScoringRule: "ADR 0026 conservative-intersection rule registered",
      registeredReplacementGate: "R15 planned; unfrozen; unimplemented; unexecuted",
      numericalAdequacy: "open",
      previewGpuCohort: "open",
      matchedNoDipAblation: "M1_NO_DIP_ABLATION planned; unfrozen; unimplemented; unexecuted",
      heldOutValidation: `all four charter families open; source lock status=${heldOutLock.status}; passEligible=${heldOutLock.passEligible}; ${heldOutLock.reason}`,
      pressureValidation: `no quantitative pressure target; source lock pressure status=${heldOutLock.pressureStatus}; scoreable=${heldOutLock.pressureScoreable}; ${heldOutLock.pressureReason}`,
      sourceSnapshotObligation: "immutable R15 snapshot, environment allowlist, and child source identity verification remain required",
      crossPlatformControl: `${crossPlatform.differing}/${crossPlatform.entries} Tier 1 entries differ (maximum ${crossPlatform.maxUlp} ULP); coverage=${crossPlatform.temperatureCoverage}, with registered sweep cold tail ${crossPlatform.missingRegisteredColdTailC.join(",")} C absent and required in the new R15 fingerprint; preserved fixtures self-report ${crossPlatform.selfReportedHosts.x64} and ${crossPlatform.selfReportedHosts.arm64}, but those headers are not hardware authentication; Tier 2 tracked historical table reports ${tier2Historical.rows.length} CAK rows matching the x64 baseline, but raw logs/exit records are not published in evidence/ and the arm64 outputs are not independently rederivable; no M1, full-grid, or digit-level portability claim`,
      phaseStatus: "active and incomplete",
    },
  };

  return {
    violations,
    record,
    manifest,
    crossPlatform,
    heldOutLock,
    tier2Historical,
    sweeps: { cak, m1, cakA1 },
  };
}

const TIMELINE_GG_FIXTURE = Object.freeze({
  trigger: { kind: "zExtent", value: 25 },
  beforeEnvironment: {
    rho: 0.1,
    phi: 0,
    kappa: [0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1],
    mu: [0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01],
    ggThreshBeta: [1, 2, 0.5, 2, 0.5, 0.5, 1],
  },
  afterEnvironment: {
    rho: 0.1,
    phi: 0,
    kappa: [0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1],
    mu: [0.001, 0.001, 0.001, 0.001, 0.001, 0.001, 0.001],
    ggThreshBeta: [5, 2.4, 2.4, 2.4, 1, 1, 1],
  },
  state: {
    tick: 42,
    a: [1, 0, 0, 1, 0, 0],
    b: [1, 0.25, 0.5, 1, 0.125, 0.375],
    d: [0, 0.75, 0.5, 0, 0.875, 0.625],
  },
});

const TIMELINE_LK_FIXTURE = Object.freeze({
  trigger: { kind: "tick", value: 42 },
  beforeEnvironment: { tempC: -15, sigmaInfinity: 0.002 },
  afterEnvironment: { tempC: -5, sigmaInfinity: 0.003 },
  paramSet: "CAK",
  facetParametersByTempC: [
    {
      tempC: -15,
      basal: { sigma0: 0.024, prefactor: 1 },
      prism: { sigma0: 0.032, prefactor: 1 },
    },
    {
      tempC: -5,
      basal: { sigma0: 0.007, prefactor: 1 },
      prism: { sigma0: 0.0027, prefactor: 0.18 },
    },
  ],
  pressurePa: 101325,
  dxM: 0.35e-6,
  state: {
    tick: 42,
    simTimeSeconds: 6.25,
    a: [0, 0, 0, 1, 0],
    f: [0.125, 0.25, 0.5, 1, 0],
  },
  exampleInterfaceStep: {
    deltaTimeSeconds: 0.2,
  },
  cells: [
    {
      id: "interior-low",
      kind: "active interior",
      active: true,
      attached: false,
      wall: false,
      shell: false,
      sigmaOld: 0.002,
    },
    {
      id: "interior-high",
      kind: "active interior",
      active: true,
      attached: false,
      wall: false,
      shell: false,
      sigmaOld: 0.25,
    },
    {
      id: "dirichlet-shell",
      kind: "active Dirichlet shell",
      active: true,
      attached: false,
      wall: false,
      shell: true,
      sigmaOld: 0.002,
    },
    {
      id: "attached-ice",
      kind: "attached ice",
      active: false,
      attached: true,
      wall: false,
      shell: false,
      sigmaOld: 0,
    },
    {
      id: "inactive-wall",
      kind: "inactive wall",
      active: false,
      attached: false,
      wall: true,
      shell: false,
      sigmaOld: 0.4,
    },
  ],
  fillSegments: [
    {
      label: "interface step before event",
      tempC: -15,
      placedFillIceCells: 0.18,
    },
    {
      label: "interface step after event",
      tempC: -5,
      placedFillIceCells: 0.07,
    },
  ],
});

const CHECKPOINT_STAGES = Object.freeze([
  "framing",
  "header",
  "fields",
  "state",
  "evidence-context",
]);

const CHECKPOINT_EXPECTATIONS = Object.freeze({
  "clean-lk-v2": Object.freeze({
    failureStage: "none",
    codecOutcome: "accepted",
    contextOutcome: "accepted",
    target: "none",
  }),
  "corrupt-magic": Object.freeze({
    failureStage: "framing",
    codecOutcome: "rejected",
    contextOutcome: "not-run",
    target: "bytes[0]",
  }),
  "missing-surface-policy": Object.freeze({
    failureStage: "header",
    codecOutcome: "rejected",
    contextOutcome: "not-run",
    target: "header.surfacePolicy",
  }),
  "short-fill-descriptor": Object.freeze({
    failureStage: "fields",
    codecOutcome: "rejected",
    contextOutcome: "not-run",
    target: "header.fields[1].length",
  }),
  "negative-density": Object.freeze({
    failureStage: "state",
    codecOutcome: "rejected",
    contextOutcome: "not-run",
    target: "payload.sigma[activeUnattachedCell]",
  }),
  "reflecting-diagnostic": Object.freeze({
    failureStage: "evidence-context",
    codecOutcome: "accepted",
    contextOutcome: "rejected",
    target: "header.farField",
  }),
  "legacy-v1-clean": Object.freeze({
    failureStage: "evidence-context",
    codecOutcome: "accepted",
    contextOutcome: "rejected",
    target: "none",
  }),
  "legacy-v1-policy-injected": Object.freeze({
    failureStage: "header",
    codecOutcome: "rejected",
    contextOutcome: "not-run",
    target: "header.surfacePolicy",
  }),
  "registered-config-mismatch": Object.freeze({
    failureStage: "evidence-context",
    codecOutcome: "accepted",
    contextOutcome: "rejected",
    target: "header.surfacePolicy",
  }),
  "unknown-gg-metric": Object.freeze({
    failureStage: "header",
    codecOutcome: "rejected",
    contextOutcome: "not-run",
    target: "header.metrics.depletionRatio",
  }),
});

const TRANSFER_AXES = Object.freeze([
  "claim",
  "modelArm",
  "paramSet",
  "temperatureCases",
  "sigmaCases",
  "waterFraction",
  "farField",
  "surfacePolicy",
  "domainShape",
  "domainStudy",
  "registeredDomain",
  "dxUm",
  "measurementExtent",
  "stopValidity",
  "domainContactGuard",
  "cflFill",
  "pressurePa",
  "latentHeating",
  "timelineSchedule",
  "noiseEpsilon",
  "rngSeed",
  "seedShape",
  "seedRadius",
  "seedThickness",
  "seedSites",
  "seedEnsemble",
  "relaxTol",
  "divTol",
  "relaxMaxSweeps",
  "stepCap",
  "habitMetric",
  "codeVersion",
  "engine",
  "runtimeIdentity",
  "hostScope",
  "workload",
]);
export const TRANSFER_AXIS_COUNT = TRANSFER_AXES.length;

const TRANSFER_AXIS_RECORDS = Object.freeze([
  { key: "claim", label: "claim · requested inference" },
  { key: "modelArm", label: "physics · model arm" },
  { key: "paramSet", label: "physics · parameter set" },
  { key: "temperatureCases", label: "cases · temperatures" },
  { key: "sigmaCases", label: "cases · far-field supersaturations" },
  { key: "waterFraction", label: "cases · water-relative fraction" },
  { key: "farField", label: "boundary · far field" },
  { key: "surfacePolicy", label: "surface · coupled policy" },
  { key: "domainShape", label: "domain · shape" },
  { key: "domainStudy", label: "domain · ladder" },
  { key: "registeredDomain", label: "domain · budget being supported" },
  { key: "dxUm", label: "grid · spacing" },
  { key: "measurementExtent", label: "measurement · extent" },
  { key: "stopValidity", label: "measurement · valid stop" },
  { key: "domainContactGuard", label: "measurement · contact guard" },
  { key: "cflFill", label: "numerics · fill-CFL" },
  { key: "pressurePa", label: "physics · pressure" },
  { key: "latentHeating", label: "physics · latent heating" },
  { key: "timelineSchedule", label: "environment · within-run history" },
  { key: "noiseEpsilon", label: "stochastic · noise amplitude" },
  { key: "rngSeed", label: "stochastic · RNG seed" },
  { key: "seedShape", label: "initial state · seed shape" },
  { key: "seedRadius", label: "initial state · seed radius" },
  { key: "seedThickness", label: "initial state · seed thickness" },
  { key: "seedSites", label: "initial state · seeded sites" },
  { key: "seedEnsemble", label: "statistics · seed ensemble" },
  { key: "relaxTol", label: "numerics · iterate tolerance and norm" },
  { key: "divTol", label: "numerics · divergence tolerance and norm" },
  { key: "relaxMaxSweeps", label: "numerics · relaxation cap" },
  { key: "stepCap", label: "execution · interface-step safety cap" },
  { key: "habitMetric", label: "claim · habit metric" },
  { key: "codeVersion", label: "provenance · executed code" },
  { key: "engine", label: "execution · engine / arithmetic" },
  { key: "runtimeIdentity", label: "provenance · Node/V8 identity" },
  { key: "hostScope", label: "execution · portability scope" },
  { key: "workload", label: "execution · study workload" },
]);

const TRANSFER_TARGET = Object.freeze({
  claim: "domain convergence for the registered no-SDAK Phase 6 habit-class sweep",
  modelArm: "no SDAK",
  paramSet: "CAK",
  temperatureCases: "warm -5 °C; cold -15 °C",
  sigmaCases: "warm 0.007500; cold 0.023550",
  waterFraction: "f=0.15 of Table 2.1 water saturation at each temperature",
  farField: "monopole-matched",
  surfacePolicy: "aggregate-hv-g1h1-v6",
  domainShape: "centred hexPrism active domain in a cubic N×N×N lattice",
  domainStudy: "N=40,48,56,64,80",
  registeredDomain: "N=48 (48×48×48)",
  dxUm: "0.35 µm",
  measurementExtent: "largestExtent=max(tExtent,zExtent)=21 (7.35 µm)",
  stopValidity: "size-target; final largestExtent >=21; every other stop reason is invalid",
  domainContactGuard: "exclude largestExtent/N >0.65; collision guard only",
  cflFill: "0.1",
  pressurePa: "101325 Pa (1 atm)",
  latentHeating: "not applied; carried as a stated systematic",
  timelineSchedule: "none; temperature and sigmaInfinity stay constant within each run; no events or ramps",
  noiseEpsilon: "0 (off)",
  rngSeed: "1 (pinned although noise is off)",
  seedShape: "centred canonical hexagonal plate",
  seedRadius: "2 lattice cells (0.7 µm at registered dx)",
  seedThickness: "1 layer",
  seedSites: "19",
  seedEnsemble: "1 deterministic run per (temperature, supersaturation, N)",
  relaxTol: "1e-9 relative max-norm of successive-iterate change / sigmaInfinity",
  divTol: "1e-7 relative |injection + smoother drift - surface exchange| / |surface exchange|",
  relaxMaxSweeps: "200000 (refusal cap)",
  stepCap: "100000 (safety cap; a valid run must stop earlier on size-target)",
  habitMetric: "AR=zExtent/tExtent; plate <=1/1.5; column >=1.5; otherwise neutral",
  codeVersion: "record execution commit; require Phase 6 freeze e2f1bfc as its ancestor",
  engine: "CPU float64 oracle",
  runtimeIdentity: "recorded per run: Node v24.13.1; V8 13.6.233.17-node.40",
  hostScope: "registered win32 x64 host; cross-platform reproducibility not established",
  workload: "2 cases × 5 domain sizes = 10 runs; grow each to size-target extent 21",
});

export const TRANSFER_SOURCE_AUTHORITY = Object.freeze({
  revision: PHASE6_STATUS_COMMIT,
  blobs: Object.freeze({
    "research/phase6-convergence.md": "a509b0d5111368c01281a9d0b359fb89ae6bc03c",
    "runner/src/phase6-protocol.ts": "6d1e1b7a390b0b6b4de4d722e1d6e64306f7d8d2",
    "runner/src/phase6-crossplatform.ts": "2840d4c287503e9cf24ab543b83afb5274a1daf4",
    "runner/src/phase6-sweep.ts": "5cb0cfa48380695fdc6ffcbd91a08d9516b41861",
    "runner/src/grow-lk-defaults.ts": "51844d02d3c9e7d59be2156cc2a3ddc6160eba4c",
    "runner/test/phase6-protocol.test.ts": "84b3d879bac37fd5ecf59f3269bc28ee43481baa",
    "runner/test/phase6-sweep.test.ts": "4a5e93c1de898a08dc24690fb76e7391f457504d",
  }),
});

const TRANSFER_ROWS = Object.freeze({
  "required-shape": Object.freeze({
    id: "required-shape",
    label: "Exact-config study shape",
    evidenceStatus: "requirement example, not executed evidence",
    source: "AGENTS.md Rule 11",
    config: { ...TRANSFER_TARGET },
  }),
  "cak-a1-domain": Object.freeze({
    id: "cak-a1-domain",
    label: "Historical extent-21 domain ladder",
    evidenceStatus: "measured under superseded inputs; execution revision and runtime were not recorded",
    source: "research/phase6-convergence.md §§opening, 1.2, 5 (result recorded at 675288f); ADR 0031",
    config: {
      claim: "domain convergence for the registered no-SDAK Phase 6 habit-class sweep",
      modelArm: "no SDAK",
      paramSet: "CAK_A1",
      temperatureCases: "warm -5 °C; cold -15 °C",
      sigmaCases: "warm 0.007500; cold 0.023550",
      waterFraction: "f=0.15 of Table 2.1 water saturation at each temperature",
      farField: "monopole-matched",
      surfacePolicy: "aggregate-hv-g1h1-v6",
      domainShape: "centred hexPrism active domain in a cubic N×N×N lattice",
      domainStudy: "N=40,48,56,64,80",
      registeredDomain: "N=48 (48×48×48)",
      dxUm: "0.35 µm",
      measurementExtent: "largestExtent=max(tExtent,zExtent)=21 (7.35 µm)",
      stopValidity: "size-target; final largestExtent >=21; every other stop reason is invalid",
      domainContactGuard: "exclude largestExtent/N >0.65; collision guard only",
      cflFill: "0.1",
      pressurePa: "not recorded by cited evidence (pressure unknown)",
      latentHeating: "not recorded by cited evidence",
      timelineSchedule: "not recorded by cited evidence (within-run history unknown)",
      noiseEpsilon: "0 (off)",
      rngSeed: "not recorded by cited evidence (noise is off)",
      seedShape: "centred canonical hexagonal plate",
      seedRadius: "2 lattice cells (0.7 µm at registered dx)",
      seedThickness: "1 layer",
      seedSites: "19",
      seedEnsemble: "1 deterministic run per (temperature, supersaturation, N)",
      relaxTol: "1e-9 relative max-norm of successive-iterate change / sigmaInfinity",
      divTol: "1e-7 relative |injection + smoother drift - surface exchange| / |surface exchange|",
      relaxMaxSweeps: "not recorded by cited evidence",
      stepCap: "not recorded by cited evidence",
      habitMetric: "AR=zExtent/tExtent; plate <=1/1.5; column >=1.5; otherwise neutral",
      codeVersion: "results recorded at 675288f; execution commit not recorded; freeze ancestry unverified",
      engine: "not recorded by cited evidence (arithmetic/runtime unknown)",
      runtimeIdentity: "not recorded by cited evidence (Node/V8 unknown)",
      hostScope: "registered win32 x64 host; cross-platform reproducibility not established",
      workload: "2 cases × 5 domain sizes = 10 runs; grow each to size-target extent 21",
    },
  }),
  "extent-15-domain": Object.freeze({
    id: "extent-15-domain",
    label: "Earlier convenient-size ladder",
    evidenceStatus: "superseded and off measurement size",
    source: "research/phase6-convergence.md §1.1",
    config: {
      claim: "domain convergence at a convenient, later-superseded measurement size",
      modelArm: "no SDAK",
      paramSet: "CAK_A1",
      temperatureCases: "warm -5 °C; cold -15 °C",
      sigmaCases: "warm 0.007500; cold 0.023550",
      waterFraction: "f=0.15 of Table 2.1 water saturation at each temperature",
      farField: "monopole-matched",
      surfacePolicy: "aggregate-hv-g1h1-v6",
      domainShape: "centred hexPrism active domain in a cubic N×N×N lattice",
      domainStudy: "N=28,32,40,48,64",
      registeredDomain: "no budget result at the target configuration",
      dxUm: "0.35 µm",
      measurementExtent: "largestExtent=max(tExtent,zExtent)=15 (5.25 µm)",
      stopValidity: "size-target at largestExtent >=15; not the registered measurement size",
      domainContactGuard: "exclude largestExtent/N >0.65; collision guard only",
      cflFill: "not recorded by cited evidence",
      pressurePa: "not recorded by cited evidence (pressure unknown)",
      latentHeating: "not recorded by cited evidence",
      timelineSchedule: "not recorded by cited evidence (within-run history unknown)",
      noiseEpsilon: "0 (off)",
      rngSeed: "not recorded by cited evidence (noise is off)",
      seedShape: "centred canonical hexagonal plate",
      seedRadius: "2 lattice cells (0.7 µm at registered dx)",
      seedThickness: "1 layer",
      seedSites: "19",
      seedEnsemble: "1 deterministic run per (temperature, supersaturation, N)",
      relaxTol: "1e-9 relative max-norm of successive-iterate change / sigmaInfinity",
      divTol: "1e-7 relative |injection + smoother drift - surface exchange| / |surface exchange|",
      relaxMaxSweeps: "not recorded by cited evidence",
      stepCap: "not recorded by cited evidence",
      habitMetric: "AR=zExtent/tExtent; plate <=1/1.5; column >=1.5; otherwise neutral",
      codeVersion: "execution commit not recorded in cited extent-15 study; freeze ancestry unverified",
      engine: "not recorded by cited evidence (arithmetic/runtime unknown)",
      runtimeIdentity: "not recorded by cited evidence (Node/V8 unknown)",
      hostScope: "registered win32 x64 host; cross-platform reproducibility not established",
      workload: "2 cases × 5 domain sizes = 10 runs; grow each to size-target extent 15",
    },
  }),
  "dirichlet-calibration": Object.freeze({
    id: "dirichlet-calibration",
    label: "Fixed-value-wall calibration",
    evidenceStatus: "different boundary experiment",
    source: "ADR 0024; solver-cpu/test/monopole-far-field.test.ts at 8c781b1",
    config: {
      claim: "far-field domain-dependence A/B after a fixed step count",
      modelArm: "no SDAK",
      paramSet: "CAK_A1",
      temperatureCases: "warm -5 °C only",
      sigmaCases: "0.007500 only",
      waterFraction: "not recorded by cited evidence; raw sigmaInfinity=0.007500",
      farField: "dirichlet versus monopole-matched A/B",
      surfacePolicy: "aggregate-hv-g1h1-v6",
      domainShape: "centred hexPrism active domain in a cubic N×N×N lattice",
      domainStudy: "N=28,40",
      registeredDomain: "no registered sweep-domain budget",
      dxUm: "0.35 µm",
      measurementExtent: "not size-controlled; sampled after 60 interface steps",
      stopValidity: "completed-interface-step cap at 60; not size-target",
      domainContactGuard: "not the registered size-target/contact experiment",
      cflFill: "0.1",
      pressurePa: "101325 Pa (1 atm)",
      latentHeating: "not represented in cited fixture",
      timelineSchedule: "none; temperature and sigmaInfinity stay constant within each run; no events or ramps",
      noiseEpsilon: "0 (off)",
      rngSeed: "1 (pinned although noise is off)",
      seedShape: "centred canonical hexagonal plate",
      seedRadius: "2 lattice cells (0.7 µm at registered dx)",
      seedThickness: "1 layer",
      seedSites: "19",
      seedEnsemble: "1 deterministic run per (far field, N)",
      relaxTol: "1e-8 relative max-norm of successive-iterate change / sigmaInfinity",
      divTol: "1e-6 relative divergence identity",
      relaxMaxSweeps: "200000 (refusal cap)",
      stepCap: "60 completed interface steps",
      habitMetric: "attached count and AR after 60 steps; not the registered habit measurement",
      codeVersion: "test source at main@8c781b1; no evidence execution commit recorded",
      engine: "CPU float64 oracle",
      runtimeIdentity: "not recorded for cited test execution (Node/V8 unknown)",
      hostScope: "host/runtime not pinned by the cited test result",
      workload: "2 far fields × 2 domain sizes × 60 interface steps = 4 runs",
    },
  }),
  "gpu-four-step": Object.freeze({
    id: "gpu-four-step",
    label: "Phase 5 GPU fixture",
    evidenceStatus: "certified only for its four-step fixture",
    source: "runner/src/phase5-protocol.ts; Phase 6 plan",
    config: {
      claim: "Phase 5 CPU/GPU conformance for one four-step fixture",
      modelArm: "no SDAK",
      paramSet: "CAK_A1",
      temperatureCases: "warm -5 °C only",
      sigmaCases: "0.002000 only",
      waterFraction: "not a registered Table 2.1 fraction",
      farField: "dirichlet",
      surfacePolicy: "aggregate-hv-g1h1-v5",
      domainShape: "hexPrism active domain in a 24×24×18 lattice",
      domainStudy: "24×24×18 single fixture",
      registeredDomain: "no Phase 6 domain budget",
      dxUm: "0.35 µm",
      measurementExtent: "not measured",
      stopValidity: "completed-interface-step cap at 4; not size-target",
      domainContactGuard: "not the registered Phase 6 contact experiment",
      cflFill: "0.1",
      pressurePa: "101325 Pa (1 atm)",
      latentHeating: "not represented in cited fixture",
      timelineSchedule: "none; temperature and sigmaInfinity stay constant within each run; no events or ramps",
      noiseEpsilon: "0 (off)",
      rngSeed: "1 (pinned although noise is off)",
      seedShape: "centred canonical hexagonal plate",
      seedRadius: "2 lattice cells (0.7 µm at registered dx)",
      seedThickness: "1 layer",
      seedSites: "19",
      seedEnsemble: "1 deterministic fixture run per engine",
      relaxTol: "1e-9 relative max-norm of successive-iterate change / sigmaInfinity",
      divTol: "1e-7 relative |injection + smoother drift - surface exchange| / |surface exchange|",
      relaxMaxSweeps: "200000 (refusal cap)",
      stepCap: "4 completed interface steps",
      habitMetric: "CPU/GPU conformance observables; not a domain-habit measurement",
      codeVersion: "Phase 5 evidence revision; not the Phase 6 freeze/execution identity",
      engine: "GPU float32 against CPU float64",
      runtimeIdentity: "Playwright 1.61.1 / Chromium 1228; not the Phase 6 Node/V8 identity",
      hostScope: "Phase 5 Windows D3D12 fixture scope",
      workload: "one 24×24×18 fixture for 4 interface steps",
    },
  }),
});

const TRANSFER_EXPECTED_MISMATCHES = Object.freeze({
  "required-shape": Object.freeze([]),
  "cak-a1-domain": Object.freeze([
    "paramSet",
    "pressurePa",
    "latentHeating",
    "timelineSchedule",
    "rngSeed",
    "relaxMaxSweeps",
    "stepCap",
    "codeVersion",
    "engine",
    "runtimeIdentity",
  ]),
  "extent-15-domain": Object.freeze([
    "claim",
    "paramSet",
    "domainStudy",
    "registeredDomain",
    "measurementExtent",
    "stopValidity",
    "cflFill",
    "pressurePa",
    "latentHeating",
    "timelineSchedule",
    "rngSeed",
    "relaxMaxSweeps",
    "stepCap",
    "codeVersion",
    "engine",
    "runtimeIdentity",
    "workload",
  ]),
  "dirichlet-calibration": Object.freeze([
    "claim",
    "paramSet",
    "temperatureCases",
    "sigmaCases",
    "waterFraction",
    "farField",
    "domainStudy",
    "registeredDomain",
    "measurementExtent",
    "stopValidity",
    "domainContactGuard",
    "latentHeating",
    "seedEnsemble",
    "relaxTol",
    "divTol",
    "stepCap",
    "habitMetric",
    "codeVersion",
    "runtimeIdentity",
    "hostScope",
    "workload",
  ]),
  "gpu-four-step": Object.freeze([
    "claim",
    "paramSet",
    "temperatureCases",
    "sigmaCases",
    "waterFraction",
    "farField",
    "surfacePolicy",
    "domainShape",
    "domainStudy",
    "registeredDomain",
    "measurementExtent",
    "stopValidity",
    "domainContactGuard",
    "latentHeating",
    "seedEnsemble",
    "stepCap",
    "habitMetric",
    "codeVersion",
    "engine",
    "runtimeIdentity",
    "hostScope",
    "workload",
  ]),
});

const LEDGER_EXPECTATIONS = Object.freeze({
  "cold-fixed-point": Object.freeze({
    numericalCloses: true,
    demandCloses: true,
    holeFillSeparate: false,
  }),
  "clipped-demand": Object.freeze({
    numericalCloses: true,
    demandCloses: true,
    holeFillSeparate: false,
  }),
  "hole-fill-separate": Object.freeze({
    numericalCloses: true,
    demandCloses: true,
    holeFillSeparate: true,
  }),
  "missing-excess": Object.freeze({
    numericalCloses: true,
    demandCloses: false,
    holeFillSeparate: false,
  }),
  "numerical-mismatch": Object.freeze({
    numericalCloses: false,
    demandCloses: true,
    holeFillSeparate: false,
  }),
});

const LEDGER_FIXTURES = Object.freeze({
  "cold-fixed-point": Object.freeze({
    id: "cold-fixed-point",
    label: "Cold fixed point",
    note: "The numerical terms are the retained ADR 0013 checkpoint witness.",
    shellInjection: 3.679402302324622e-7,
    smootherDrift: -1.1395225041344048e-13,
    boundaryExchange: 3.679401162802118e-7,
    divTol: 1e-7,
    localExchangeSign: -1,
    placedFillUnits: 80000,
    saturationExcessUnits: 20000,
    kineticDemandUnits: 100000,
    holeFillDeficitUnits: 0,
  }),
  "clipped-demand": Object.freeze({
    id: "clipped-demand",
    label: "Saturating cell",
    note: "The interface example records the part of demand that cannot be placed.",
    shellInjection: 3.679402302324622e-7,
    smootherDrift: -1.1395225041344048e-13,
    boundaryExchange: 3.679401162802118e-7,
    divTol: 1e-7,
    localExchangeSign: -1,
    placedFillUnits: 65000,
    saturationExcessUnits: 35000,
    kineticDemandUnits: 100000,
    holeFillDeficitUnits: 0,
  }),
  "hole-fill-separate": Object.freeze({
    id: "hole-fill-separate",
    label: "Hole-fill event",
    note: "Geometric hole fill is reported beside, never inside, the kinetic identity.",
    shellInjection: 3.679402302324622e-7,
    smootherDrift: -1.1395225041344048e-13,
    boundaryExchange: 3.679401162802118e-7,
    divTol: 1e-7,
    localExchangeSign: -1,
    placedFillUnits: 100000,
    saturationExcessUnits: 0,
    kineticDemandUnits: 100000,
    holeFillDeficitUnits: 250000,
  }),
  "missing-excess": Object.freeze({
    id: "missing-excess",
    label: "Drop the excess",
    note: "Negative control: the numerical solve still closes while demand bookkeeping fails.",
    shellInjection: 3.679402302324622e-7,
    smootherDrift: -1.1395225041344048e-13,
    boundaryExchange: 3.679401162802118e-7,
    divTol: 1e-7,
    localExchangeSign: -1,
    placedFillUnits: 65000,
    saturationExcessUnits: 0,
    kineticDemandUnits: 100000,
    holeFillDeficitUnits: 0,
  }),
  "numerical-mismatch": Object.freeze({
    id: "numerical-mismatch",
    label: "Break the solve",
    note: "Negative control: demand bookkeeping closes while the numerical identity fails.",
    shellInjection: 4e-6,
    smootherDrift: 0,
    boundaryExchange: 3e-6,
    divTol: 1e-7,
    localExchangeSign: -1,
    placedFillUnits: 80000,
    saturationExcessUnits: 20000,
    kineticDemandUnits: 100000,
    holeFillDeficitUnits: 0,
  }),
});

const PHASE6_HISTORICAL_RECORD = Object.freeze({
    id: "historical",
    label: "Arm 1 report snapshot",
    authority: {
      artifact: "research/phase6-sweep-report.md",
      executionCommit: "390fe35",
      snapshotMeaning: "what the published Arm 1 report said when written",
    },
    arm1: {
      runState: "complete",
      points: "204/204",
      measuredHeadline: "3/90",
      evidenceClass: "measured result with verified provenance; not gate evidence",
      reportInventory: "report text says no independent verifier and six controls not executed",
    },
    arm2: {
      runState: "not present in this snapshot",
      measurement: "none",
    },
    closure: {
      flaglessCanonicalGate: "not run",
      independentReview: "not complete",
      crossPlatformArm64: "not run",
    },
});

const K_BOLTZMANN = 1.380649e-23;
const WATER_MOLECULE_MASS_KG = 3.0e-26;
const ICE_NUMBER_DENSITY = 3.1e28;
const AIR_DIFFUSIVITY_ONE_ATMOSPHERE = 2.0e-5;
const ONE_ATMOSPHERE_PA = 101325;

function sameJson(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.keys(value).sort().reduce((record, key) => {
    record[key] = canonicalize(value[key]);
    return record;
  }, {});
}

function sameRecord(left, right) {
  return JSON.stringify(canonicalize(left))
    === JSON.stringify(canonicalize(right));
}

function jsonSha256(value) {
  return createHash("sha256")
    .update(JSON.stringify(value))
    .digest("hex");
}

function sorted(values) {
  return [...values].sort();
}

function finiteNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function near(left, right, relative = 1e-12, absolute = 1e-15) {
  return Math.abs(left - right) <= Math.max(
    absolute,
    relative * Math.max(Math.abs(left), Math.abs(right)),
  );
}

function ownKeysDeep(value, out = []) {
  if (!value || typeof value !== "object") return out;
  for (const key of Object.keys(value)) {
    out.push(key);
    ownKeysDeep(value[key], out);
  }
  return out;
}

function saturationDensity(tempC) {
  const tempK = tempC + 273.15;
  const pressurePa = 3.7e10 * Math.exp(-6150 / tempK) * 100;
  return pressurePa / (K_BOLTZMANN * tempK);
}

function kineticVelocity(tempC) {
  const tempK = tempC + 273.15;
  return (saturationDensity(tempC) / ICE_NUMBER_DENSITY)
    * Math.sqrt(
      (K_BOLTZMANN * tempK)
      / (2 * Math.PI * WATER_MOLECULE_MASS_KG),
    );
}

function kineticLength(tempC, pressurePa) {
  const diffusivity =
    AIR_DIFFUSIVITY_ONE_ATMOSPHERE * ONE_ATMOSPHERE_PA / pressurePa;
  return (saturationDensity(tempC) / ICE_NUMBER_DENSITY)
    * diffusivity / kineticVelocity(tempC);
}

function iceCellVaporUnits(tempC) {
  return ICE_NUMBER_DENSITY / saturationDensity(tempC);
}

function transformedSigma(sigmaOld, oldTempC, newTempC) {
  return (1 + sigmaOld)
    * saturationDensity(oldTempC)
    / saturationDensity(newTempC)
    - 1;
}

function timelineDatasetMatches(state, dom) {
  return dom
    && dom.operator === state.operator
    && dom.stage === state.stage
    && dom.eventMode === "abrupt";
}

function teachingNumber(value) {
  if (typeof value !== "number") return String(value);
  if (value === 0) return "0";
  if (Math.abs(value) >= 0.001 && Math.abs(value) < 1000) {
    return value.toPrecision(8).replace(/0+$/, "").replace(/\.$/, "");
  }
  return value.toExponential(6);
}

function normalizedText(value) {
  return String(value ?? "").trim().replace(/\s+/g, " ");
}

function includesEvery(text, fragments) {
  const normalized = normalizedText(text);
  return fragments.every((fragment) => normalized.includes(fragment));
}

function timelineVisibleViolations(label, snapshot, fixture) {
  const violations = [];
  const visibleText = snapshot?.dom?.visibleText;
  if (!visibleText) return [`timeline ${label} visible body`];
  if (snapshot.operator === "GGThreshold") {
    const environment = snapshot.stage === "before"
      ? fixture.beforeEnvironment
      : fixture.afterEnvironment;
    const title = snapshot.stage === "before"
      ? "Before event"
      : "After event";
    if (!includesEvery(visibleText, [
      title,
      `z extent = ${fixture.trigger.value}`,
      `completed tick ${fixture.state.tick}`,
      `[${environment.mu.map(teachingNumber).join(", ")}]`,
      `[${fixture.state.a.map(teachingNumber).join(", ")}]`,
      "State bytes around the event",
    ])) {
      violations.push(`timeline ${label} visible G-G values`);
    }
    return violations;
  }

  const expectedRows = snapshot.lk.cells.map((cell) => {
    const density = cell.active && !cell.attached && !cell.wall
      ? (1 + cell.sigmaCurrent)
        * saturationDensity(snapshot.lk.environment.tempC)
      : null;
    return [
      cell.id,
      cell.kind,
      teachingNumber(cell.sigmaOld),
      teachingNumber(cell.sigmaCurrent),
      density === null ? "excluded" : teachingNumber(density),
    ];
  });
  if (!sameJson(snapshot.dom.visibleCellRows, expectedRows)) {
    violations.push(`timeline ${label} visible LK cell table`);
  }
  const fragments = [
    `stage ${snapshot.stage}`,
    `temperature ${teachingNumber(snapshot.lk.environment.tempC)}`,
    "interior-low",
    "interior-high",
    "dirichlet-shell",
    "attached-ice",
    "inactive-wall",
    "Topology, fill, time and completed ledgers",
    `[${snapshot.lk.state.a.map(teachingNumber).join(", ")}]`,
    `[${snapshot.lk.state.f.map(teachingNumber).join(", ")}]`,
    `completed tick ${snapshot.lk.state.tick}`,
    `physical time ${teachingNumber(snapshot.lk.state.simTimeSeconds)} s`,
    `completed ledger segments ${snapshot.lk.fillSegments.length}`,
    "Step-local vapor-equivalent fill bookkeeping",
  ];
  if (snapshot.stage === "stepped") {
    const weighted = fixture.fillSegments.reduce(
      (sum, segment) =>
        sum + segment.placedFillIceCells * iceCellVaporUnits(segment.tempC),
      0,
    );
    const shortcut = fixture.fillSegments.reduce(
      (sum, segment) => sum + segment.placedFillIceCells,
      0,
    ) * iceCellVaporUnits(fixture.afterEnvironment.tempC);
    fragments.push(
      "step-local weighted total",
      teachingNumber(weighted),
      "counterfactual",
      teachingNumber(shortcut),
      "deposited its 0.07-cell increment into f[0]",
      "No cell saturated",
      "a stayed unchanged",
    );
  } else {
    fragments.push("byte-for-byte unchanged");
  }
  if (!includesEvery(visibleText, fragments)) {
    violations.push(`timeline ${label} visible LK values`);
  }
  return violations;
}

function timelineScaleViolations(label, snapshot, fixture) {
  const violations = [];
  const tempC = snapshot.lk.environment.tempC;
  const expected = {
    cSatPerCubicMeter: saturationDensity(tempC),
    vKinMS: kineticVelocity(tempC),
    x0M: kineticLength(tempC, fixture.pressurePa),
    mIceLedger: iceCellVaporUnits(tempC),
  };
  for (const [key, value] of Object.entries(expected)) {
    if (!near(snapshot.lk.derived[key], value, 1e-14, 0)) {
      violations.push(`timeline ${label} ${key}`);
    }
  }
  const expectedFacets = tempC === -15
    ? {
        paramSet: "CAK",
        basal: { sigma0: 0.024, prefactor: 1 },
        prism: { sigma0: 0.032, prefactor: 1 },
      }
    : tempC === -5
      ? {
          paramSet: "CAK",
          basal: { sigma0: 0.007, prefactor: 1 },
          prism: { sigma0: 0.0027, prefactor: 0.18 },
        }
      : null;
  if (
    !expectedFacets
    || !sameJson(snapshot.lk.derived.facetParameters, expectedFacets)
  ) {
    violations.push(`timeline ${label} facet kinetics`);
  }
  return violations;
}

export function timelineViolations(evidence) {
  const violations = [];
  if (!evidence || evidence.version !== 1) return ["timeline hook/schema"];
  const constants = evidence.fixtures?.constants;
  const ggFixture = evidence.fixtures?.gg;
  const lkFixture = evidence.fixtures?.lk;
  if (
    constants?.kBoltzmann !== K_BOLTZMANN
    || constants?.waterMoleculeMassKg !== WATER_MOLECULE_MASS_KG
    || constants?.iceNumberDensityPerCubicMeter !== ICE_NUMBER_DENSITY
    || constants?.airDiffusivityAtOneAtmosphereM2PerS
      !== AIR_DIFFUSIVITY_ONE_ATMOSPHERE
    || constants?.referencePressurePa !== ONE_ATMOSPHERE_PA
    || !sameRecord(ggFixture, TIMELINE_GG_FIXTURE)
    || !sameRecord(lkFixture, TIMELINE_LK_FIXTURE)
  ) {
    return ["timeline raw constants/fixtures"];
  }
  if (
    !Array.isArray(evidence.formulaSamples)
    || !sameJson(
      evidence.formulaSamples.map((sample) => [sample.tempC, sample.sigmaOld]),
      [[-15, 0.002], [-5, 0.002]],
    )
  ) {
    return ["timeline formula sample inventory"];
  }

  const ggBefore = evidence.ggBefore;
  const ggApplied = evidence.ggApplied;
  const ggReset = evidence.ggReset;
  const lkBefore = evidence.lkBefore;
  const lkTransformed = evidence.lkTransformed;
  const lkReclamped = evidence.lkReclamped;
  const lkStepped = evidence.lkStepped;
  const lkReset = evidence.lkReset;
  const expectedSteppedState = {
    tick: lkFixture.state.tick + 1,
    simTimeSeconds:
      lkFixture.state.simTimeSeconds
      + lkFixture.exampleInterfaceStep.deltaTimeSeconds,
    a: [...lkFixture.state.a],
    f: lkFixture.state.f.map((value, index) =>
      index === 0
        ? value + lkFixture.fillSegments[1].placedFillIceCells
        : value),
  };
  if (
    !ggBefore?.gg
    || !ggApplied?.gg
    || !ggReset?.gg
    || !lkBefore?.lk
    || !lkTransformed?.lk
    || !lkReclamped?.lk
    || !lkStepped?.lk
    || !lkReset?.lk
  ) {
    return ["timeline snapshot inventory"];
  }
  if (
    !timelineDatasetMatches(ggBefore, ggBefore.dom)
    || ggBefore.operator !== "GGThreshold"
    || ggBefore.stage !== "before"
    || !sameJson(ggBefore.gg.environment, ggFixture.beforeEnvironment)
    || ggBefore.gg.tick !== ggFixture.state.tick
    || !sameJson(ggBefore.gg.a, ggFixture.state.a)
    || !sameJson(ggBefore.gg.b, ggFixture.state.b)
    || !sameJson(ggBefore.gg.d, ggFixture.state.d)
  ) {
    violations.push("timeline G-G initial state");
  }
  violations.push(
    ...timelineVisibleViolations("G-G before", ggBefore, ggFixture),
  );
  if (
    !timelineDatasetMatches(ggApplied, ggApplied.dom)
    || ggApplied.operator !== "GGThreshold"
    || ggApplied.stage !== "applied"
    || !sameJson(ggApplied.gg.environment, ggFixture.afterEnvironment)
    || ggApplied.gg.tick !== ggBefore.gg.tick
    || !sameJson(ggApplied.gg.a, ggBefore.gg.a)
    || !sameJson(ggApplied.gg.b, ggBefore.gg.b)
    || !sameJson(ggApplied.gg.d, ggBefore.gg.d)
  ) {
    violations.push("timeline G-G event preservation");
  }
  violations.push(
    ...timelineVisibleViolations("G-G applied", ggApplied, ggFixture),
  );
  if (
    !sameJson(ggReset.gg, ggBefore.gg)
    || ggReset.stage !== "before"
    || !timelineDatasetMatches(ggReset, ggReset.dom)
  ) {
    violations.push("timeline G-G reset");
  }
  violations.push(
    ...timelineVisibleViolations("G-G reset", ggReset, ggFixture),
  );
  if (
    !timelineDatasetMatches(lkBefore, lkBefore.dom)
    || lkBefore.operator !== "LibbrechtKinetics"
    || lkBefore.stage !== "before"
    || !sameJson(lkBefore.lk.environment, lkFixture.beforeEnvironment)
    || lkBefore.lk.cells.some(
      (cell, index) => cell.sigmaCurrent !== lkFixture.cells[index].sigmaOld,
    )
    || !sameJson(lkBefore.lk.state, lkFixture.state)
    || !sameJson(lkBefore.lk.fillSegments, [lkFixture.fillSegments[0]])
    || lkBefore.lk.shellClampDelta !== null
  ) {
    violations.push("timeline LK initial state");
  }
  violations.push(...timelineScaleViolations("before", lkBefore, lkFixture));
  violations.push(
    ...timelineVisibleViolations("LK before", lkBefore, lkFixture),
  );

  let observedNegative = false;
  for (let index = 0; index < lkFixture.cells.length; index++) {
    const source = lkFixture.cells[index];
    const transformed = lkTransformed.lk.cells[index];
    const eligible = source.active && !source.attached && !source.wall;
    const expectedSigma = eligible
      ? transformedSigma(
          source.sigmaOld,
          lkFixture.beforeEnvironment.tempC,
          lkFixture.afterEnvironment.tempC,
        )
      : source.sigmaOld;
    if (!near(transformed.sigmaCurrent, expectedSigma, 1e-14, 0)) {
      violations.push(`timeline LK cell transform ${source.id}`);
    }
    if (eligible) {
      const densityBefore =
        (1 + source.sigmaOld)
        * saturationDensity(lkFixture.beforeEnvironment.tempC);
      const densityAfter =
        (1 + transformed.sigmaCurrent)
        * saturationDensity(lkFixture.afterEnvironment.tempC);
      if (!near(densityBefore, densityAfter, 2e-15, 0)) {
        violations.push(`timeline LK density conservation ${source.id}`);
      }
      if (transformed.sigmaCurrent < 0) observedNegative = true;
    }
  }
  if (
    !timelineDatasetMatches(lkTransformed, lkTransformed.dom)
    || lkTransformed.stage !== "transformed"
    || !sameJson(lkTransformed.lk.environment, lkFixture.afterEnvironment)
    || !sameJson(lkTransformed.lk.state, lkFixture.state)
    || lkTransformed.lk.shellClampDelta !== null
    || !sameJson(
      lkTransformed.lk.fillSegments,
      [lkFixture.fillSegments[0]],
    )
    || !observedNegative
  ) {
    violations.push("timeline LK transformed state");
  }
  violations.push(
    ...timelineScaleViolations("transformed", lkTransformed, lkFixture),
    ...timelineVisibleViolations(
      "LK transformed",
      lkTransformed,
      lkFixture,
    ),
  );

  let expectedClampDelta = 0;
  for (let index = 0; index < lkFixture.cells.length; index++) {
    const source = lkFixture.cells[index];
    const transformed = lkTransformed.lk.cells[index];
    const reclamped = lkReclamped.lk.cells[index];
    const clamped = source.active
      && !source.attached
      && !source.wall
      && source.shell;
    const expectedSigma = clamped
      ? lkFixture.afterEnvironment.sigmaInfinity
      : transformed.sigmaCurrent;
    if (clamped) {
      expectedClampDelta += expectedSigma - transformed.sigmaCurrent;
    }
    if (!near(reclamped.sigmaCurrent, expectedSigma, 1e-14, 0)) {
      violations.push(`timeline LK shell clamp ${source.id}`);
    }
  }
  if (
    !timelineDatasetMatches(lkReclamped, lkReclamped.dom)
    || lkReclamped.stage !== "reclamped"
    || !sameJson(lkReclamped.lk.environment, lkFixture.afterEnvironment)
    || !sameJson(lkReclamped.lk.state, lkFixture.state)
    || !near(lkReclamped.lk.shellClampDelta, expectedClampDelta, 1e-14, 0)
    || !sameJson(
      lkReclamped.lk.fillSegments,
      [lkFixture.fillSegments[0]],
    )
  ) {
    violations.push("timeline LK reclamped state");
  }
  violations.push(
    ...timelineScaleViolations("reclamped", lkReclamped, lkFixture),
    ...timelineVisibleViolations("LK reclamped", lkReclamped, lkFixture),
  );

  const expectedSegments = lkFixture.fillSegments;
  const weighted = expectedSegments.reduce(
    (sum, segment) =>
      sum + segment.placedFillIceCells * iceCellVaporUnits(segment.tempC),
    0,
  );
  const finalTemperatureShortcut = expectedSegments.reduce(
    (sum, segment) => sum + segment.placedFillIceCells,
    0,
  ) * iceCellVaporUnits(lkFixture.afterEnvironment.tempC);
  if (
    !timelineDatasetMatches(lkStepped, lkStepped.dom)
    || lkStepped.stage !== "stepped"
    || !sameJson(lkStepped.lk.environment, lkFixture.afterEnvironment)
    || !sameJson(lkStepped.lk.state, expectedSteppedState)
    || !sameJson(lkStepped.lk.fillSegments, expectedSegments)
    || !sameJson(lkStepped.lk.cells, lkReclamped.lk.cells)
    || !near(
      lkStepped.lk.shellClampDelta,
      lkReclamped.lk.shellClampDelta,
      1e-14,
      0,
    )
    || !finiteNumber(weighted)
    || near(weighted, finalTemperatureShortcut, 1e-12, 0)
  ) {
    violations.push("timeline step-local ledger");
  }
  violations.push(
    ...timelineScaleViolations("stepped", lkStepped, lkFixture),
    ...timelineVisibleViolations("LK stepped", lkStepped, lkFixture),
  );
  if (
    lkReset.stage !== "before"
    || !timelineDatasetMatches(lkReset, lkReset.dom)
    || !sameJson(lkReset.lk, lkBefore.lk)
  ) {
    violations.push("timeline LK reset");
  }
  violations.push(
    ...timelineVisibleViolations("LK reset", lkReset, lkFixture),
  );

  for (const sample of evidence.formulaSamples) {
    if (
      !near(sample.cSat, saturationDensity(sample.tempC), 1e-14, 0)
      || !near(sample.vKin, kineticVelocity(sample.tempC), 1e-14, 0)
      || !near(
        sample.kineticLength,
        kineticLength(sample.tempC, lkFixture.pressurePa),
        1e-14,
        0,
      )
      || !near(sample.mIce, iceCellVaporUnits(sample.tempC), 1e-14, 0)
      || !near(
        sample.transformedSigma,
        transformedSigma(
          sample.sigmaOld,
          lkFixture.beforeEnvironment.tempC,
          lkFixture.afterEnvironment.tempC,
        ),
        1e-14,
        0,
      )
    ) {
      violations.push(`timeline formula sample ${sample.tempC}`);
    }
  }
  return violations;
}

export function deriveCheckpointOutcome(record) {
  const firstReject = record.observations.find(
    (observation) => observation.disposition === "reject",
  );
  const failureStage = firstReject?.stage ?? "none";
  const codecRejected =
    firstReject !== undefined && failureStage !== "evidence-context";
  const reachedContext = record.observations.some(
    (observation) => observation.stage === "evidence-context",
  );
  return {
    failureStage,
    codecOutcome: codecRejected ? "rejected" : "accepted",
    contextOutcome: codecRejected
      ? "not-run"
      : reachedContext && firstReject
        ? "rejected"
        : reachedContext
          ? "accepted"
          : "not-run",
  };
}

export function checkpointViolations(evidence) {
  const violations = [];
  if (!evidence || evidence.schemaVersion !== 1) return ["checkpoint hook/schema"];
  const expectedIds = Object.keys(CHECKPOINT_EXPECTATIONS);
  if (!Array.isArray(evidence.cases)) return ["checkpoint case inventory"];
  const actualIds = evidence.cases.map((record) => record.id);
  if (
    !sameJson(actualIds, expectedIds)
    || new Set(actualIds).size !== expectedIds.length
    || evidence.cases.length !== expectedIds.length
  ) {
    violations.push("checkpoint case inventory");
  }
  if (jsonSha256(evidence.cases) !== CHECKPOINT_TEACHING_CASES_SHA256) {
    violations.push("checkpoint source-pinned teaching cases");
  }

  for (const record of evidence.cases) {
    const expected = CHECKPOINT_EXPECTATIONS[record.id];
    if (!expected) {
      violations.push(`checkpoint unknown case ${record.id}`);
      continue;
    }
    if (
      typeof record.label !== "string"
      || typeof record.checkpointKind !== "string"
      || !record.mutation
      || record.mutation.target !== expected.target
      || !Array.isArray(record.requiredFields)
      || record.requiredFields.length === 0
      || !Array.isArray(record.observations)
      || record.observations.length === 0
    ) {
      violations.push(`checkpoint ${record.id} raw record`);
      continue;
    }
    let priorStage = -1;
    let rejected = false;
    for (const observation of record.observations) {
      const stage = CHECKPOINT_STAGES.indexOf(observation.stage);
      if (
        stage < 0
        || stage <= priorStage
        || !["accept", "reject"].includes(observation.disposition)
        || rejected
      ) {
        violations.push(`checkpoint ${record.id} fail-closed stage order`);
        break;
      }
      priorStage = stage;
      rejected = observation.disposition === "reject";
    }
    const derived = deriveCheckpointOutcome(record);
    if (
      derived.failureStage !== expected.failureStage
      || derived.codecOutcome !== expected.codecOutcome
      || derived.contextOutcome !== expected.contextOutcome
    ) {
      violations.push(`checkpoint ${record.id} outcome`);
    }
    const rendered = evidence.rendered?.[record.id];
    const observedByStage = Object.fromEntries(
      record.observations.map((observation) => [
        observation.stage,
        observation,
      ]),
    );
    let stopped = false;
    const expectedVisibleStages = CHECKPOINT_STAGES.map((stage) => {
      const observation = observedByStage[stage];
      let disposition = observation?.disposition ?? "not-run";
      if (stopped) disposition = "not-run";
      const text = disposition === "not-run"
        ? `${stage.replace("-", " ").toUpperCase()} not reached`
        : `${stage.replace("-", " ").toUpperCase()} ${observation.requirement} → `
          + `${observation.observed} [${disposition.toUpperCase()}]`;
      if (disposition === "reject") stopped = true;
      return { stage, disposition, text: normalizedText(text) };
    });
    const expectedMutationRows = [
      `checkpoint: ${record.checkpointKind}`,
      `target: ${record.mutation.target}`,
      `operation: ${record.mutation.operation}`,
      `before: ${record.mutation.before}`,
      `after: ${record.mutation.after}`,
    ];
    if (
      !rendered
      || rendered.selectedMutation !== record.id
      || rendered.checkpointKind !== record.checkpointKind
      || rendered.codecOutcome !== derived.codecOutcome
      || rendered.contextOutcome !== derived.contextOutcome
      || rendered.failureStage !== derived.failureStage
      || rendered.requiredFields !== record.requiredFields.join("|")
      || !sameJson(rendered.visibleMutationRows, expectedMutationRows)
      || !sameJson(rendered.visibleRequiredFields, record.requiredFields)
      || !sameRecord(rendered.visibleStages, expectedVisibleStages)
      || !includesEvery(rendered.visibleResult, [
        `Codec: ${derived.codecOutcome}`,
        `evidence context: ${derived.contextOutcome}`,
      ])
      || normalizedText(rendered.visibleNote) !== normalizedText(record.note)
    ) {
      violations.push(`checkpoint ${record.id} rendered state`);
    }
  }

  if (
    evidence.reset?.selectedMutation !== "clean-lk-v2"
    || evidence.reset?.codecOutcome !== "accepted"
    || evidence.reset?.contextOutcome !== "accepted"
    || evidence.reset?.failureStage !== "none"
    || !includesEvery(evidence.reset?.visibleResult, [
      "Codec: accepted",
      "evidence context: accepted",
    ])
  ) {
    violations.push("checkpoint reset");
  }
  return violations;
}

function ledgerNumerical(row, floor) {
  const numerator =
    row.shellInjection + row.smootherDrift - row.boundaryExchange;
  return {
    numerator,
    residual:
      Math.abs(numerator) / Math.max(Math.abs(row.boundaryExchange), floor),
  };
}

function ledgerDemand(row) {
  return row.placedFillUnits
    + row.saturationExcessUnits
    - row.kineticDemandUnits;
}

export function ledgerViolations(evidence) {
  const violations = [];
  if (
    !evidence
    || evidence.schema !== "part2-ledger-separation-v1"
    || evidence.fillUnitScale !== 1_000_000
    || evidence.divergenceFloor !== 1e-300
  ) {
    return ["ledger hook/schema"];
  }
  const expectedIds = Object.keys(LEDGER_EXPECTATIONS);
  if (!sameJson(evidence.scenarioIds, expectedIds)) {
    violations.push("ledger scenario inventory");
  }
  if (
    !Array.isArray(evidence.rows)
    || evidence.rows.length !== expectedIds.length
    || !sameJson(
      evidence.rows.map((entry) => entry?.raw?.id),
      expectedIds,
    )
    || new Set(evidence.rows.map((entry) => entry?.raw?.id)).size
      !== expectedIds.length
  ) {
    violations.push("ledger row coverage");
  }

  for (const entry of evidence.rows ?? []) {
    const row = entry.raw;
    const expected = LEDGER_EXPECTATIONS[row?.id];
    const expectedFixture = LEDGER_FIXTURES[row?.id];
    if (!expected) {
      violations.push(`ledger unknown scenario ${row?.id}`);
      continue;
    }
    if (!sameRecord(row, expectedFixture)) {
      violations.push(`ledger ${row.id} source-pinned fixture`);
    }
    const numericFields = [
      "shellInjection",
      "smootherDrift",
      "boundaryExchange",
      "divTol",
      "localExchangeSign",
      "placedFillUnits",
      "saturationExcessUnits",
      "kineticDemandUnits",
      "holeFillDeficitUnits",
    ];
    if (!numericFields.every((field) => finiteNumber(row[field]))) {
      violations.push(`ledger ${row.id} finite raw terms`);
      continue;
    }
    const numerical = ledgerNumerical(row, evidence.divergenceFloor);
    const demandClosure = ledgerDemand(row);
    const numericalCloses = numerical.residual < row.divTol;
    const demandCloses = demandClosure === 0;
    if (
      numericalCloses !== expected.numericalCloses
      || demandCloses !== expected.demandCloses
      || (row.holeFillDeficitUnits > 0) !== expected.holeFillSeparate
      || row.localExchangeSign >= 0
    ) {
      violations.push(`ledger ${row.id} independent identities`);
    }
    const dom = entry.dom;
    if (
      !dom
      || dom.scenarioId !== row.id
      || Number(dom.shellInjection) !== row.shellInjection
      || Number(dom.smootherDrift) !== row.smootherDrift
      || Number(dom.boundaryExchange) !== row.boundaryExchange
      || Number(dom.divTol) !== row.divTol
      || Number(dom.localExchangeSign) !== row.localExchangeSign
      || Number(dom.placedFillUnits) !== row.placedFillUnits
      || Number(dom.saturationExcessUnits) !== row.saturationExcessUnits
      || Number(dom.kineticDemandUnits) !== row.kineticDemandUnits
      || Number(dom.holeFillDeficitUnits) !== row.holeFillDeficitUnits
      || Number(dom.fillUnitScale) !== evidence.fillUnitScale
      || Number(dom.divergenceFloor) !== evidence.divergenceFloor
      || dom.crossLedgerPolicy !== "forbidden"
    ) {
      violations.push(`ledger ${row.id} rendered raw terms`);
    }
    const numericalClosesText = expected.numericalCloses
      ? "CLOSES"
      : "FAILS";
    const demandClosesText = expected.demandCloses
      ? "CLOSES"
      : "FAILS";
    if (
      !includesEvery(dom?.visibleText, [
        "Elliptic-solve diagnostics",
        "Interface-demand bookkeeping",
        row.shellInjection === 0
          ? "0"
          : row.shellInjection.toExponential(6),
        row.boundaryExchange === 0
          ? "0"
          : row.boundaryExchange.toExponential(6),
        (row.placedFillUnits / evidence.fillUnitScale).toFixed(6),
        (row.saturationExcessUnits / evidence.fillUnitScale).toFixed(6),
        (row.kineticDemandUnits / evidence.fillUnitScale).toFixed(6),
        (row.holeFillDeficitUnits / evidence.fillUnitScale).toFixed(6),
        numericalClosesText,
        demandClosesText,
        "Ledger firewall",
      ])
      || !includesEvery(dom?.visibleStatusText, [row.label, "Numerical residual"])
    ) {
      violations.push(`ledger ${row.id} visible teaching state`);
    }
  }

  if (
    evidence.crossAttempt?.attempted !== "true"
    || evidence.crossAttempt?.policy !== "forbidden"
    || !/REFUSED:/i.test(evidence.crossAttempt?.text ?? "")
    || !/REFUSED:/i.test(evidence.crossAttempt?.visibleText ?? "")
  ) {
    violations.push("ledger cross-ledger refusal");
  }
  return violations;
}

export function transferabilityViolations(evidence) {
  const violations = [];
  if (!evidence || evidence.schema !== "part2-transferability-v1") {
    return ["transferability hook/schema"];
  }
  if (!sameRecord(evidence.sourceAuthority, TRANSFER_SOURCE_AUTHORITY)) {
    violations.push("transferability source authority");
  }
  const axisKeys = evidence.axes.map((axis) => axis.key);
  if (
    !sameJson(axisKeys, TRANSFER_AXES)
    || !sameRecord(evidence.axes, TRANSFER_AXIS_RECORDS)
  ) {
    violations.push("transferability axis inventory");
  }
  if (!sameRecord(evidence.target, TRANSFER_TARGET)) {
    violations.push("transferability target configuration");
  }

  const expectedIds = Object.keys(TRANSFER_EXPECTED_MISMATCHES);
  if (!sameJson(evidence.evidenceIds, expectedIds)) {
    violations.push("transferability evidence inventory");
  }
  if (
    !Array.isArray(evidence.rows)
    || evidence.rows.length !== expectedIds.length
    || !sameJson(
      evidence.rows.map((entry) => entry?.raw?.id),
      expectedIds,
    )
    || new Set(evidence.rows.map((entry) => entry?.raw?.id)).size
      !== expectedIds.length
  ) {
    violations.push("transferability row coverage");
  }
  for (const entry of evidence.rows ?? []) {
    const row = entry.raw;
    const expectedMismatches = TRANSFER_EXPECTED_MISMATCHES[row?.id];
    const expectedRow = TRANSFER_ROWS[row?.id];
    if (!expectedMismatches) {
      violations.push(`transferability unknown evidence ${row?.id}`);
      continue;
    }
    if (!sameRecord(row, expectedRow)) {
      violations.push(`transferability ${row.id} source-pinned fixture`);
    }
    if (
      !row.config
      || !sameJson(sorted(Object.keys(row.config)), sorted(TRANSFER_AXES))
    ) {
      violations.push(`transferability ${row.id} configuration shape`);
      continue;
    }
    const mismatches = TRANSFER_AXES.filter(
      (key) => row.config[key] !== evidence.target[key],
    );
    if (!sameJson(mismatches, expectedMismatches)) {
      violations.push(`transferability ${row.id} mismatches`);
    }
    if (
      row.id === "required-shape"
      && !/not executed evidence/i.test(row.evidenceStatus)
    ) {
      violations.push("transferability matching shape is not evidence");
    }
    if (
      row.id === "cak-a1-domain"
      && (
        row.config.paramSet !== "CAK_A1"
        || row.config.codeVersion
          !== "results recorded at 675288f; execution commit not recorded; freeze ancestry unverified"
        || row.config.runtimeIdentity
          !== "not recorded by cited evidence (Node/V8 unknown)"
        || !["paramSet", "codeVersion", "runtimeIdentity"].every(
          (key) => mismatches.includes(key),
        )
      )
    ) {
      violations.push("transferability CAK_A1 ladder");
    }
    const dom = entry.dom;
    if (
      !dom
      || dom.selectedEvidenceId !== row.id
      || !sameJson(JSON.parse(dom.targetConfig), evidence.target)
      || !sameJson(JSON.parse(dom.selectedConfig), row.config)
      || dom.selectedSource !== row.source
      || dom.selectedEvidenceStatus !== row.evidenceStatus
      || !sameJson(
        JSON.parse(dom.sourceAuthority),
        TRANSFER_SOURCE_AUTHORITY,
      )
      || !sameJson(
        dom.tableRows.map((item) => item.key),
        TRANSFER_AXES,
      )
      || dom.tableRows.some(
        (item, index) =>
          item.label !== TRANSFER_AXIS_RECORDS[index].label
          ||
          item.target !== evidence.target[item.key]
          || item.evidence !== row.config[item.key]
          || item.match !== String(
            evidence.target[item.key] === row.config[item.key],
          ),
      )
    ) {
      violations.push(`transferability ${row.id} rendered matrix`);
    }
    const exact = expectedMismatches.length === 0;
    if (
      !includesEvery(dom?.visibleSummaryText, [
        exact ? "Configuration match." : "NON-TRANSFERABLE.",
      ])
      || !includesEvery(dom?.visibleStatusText, [row.label, row.source])
      || !includesEvery(dom?.visibleScrollCueText, [
        "swipe the table sideways",
        "selected evidence column",
      ])
      || !includesEvery(dom?.visibleAuthorityText, [
        `${TRANSFER_AXES.length} governing fields`,
        "main@8c781b1",
        "not itself evidence",
      ])
      || !includesEvery(dom?.visibleCaptionText, [
        `All ${TRANSFER_AXES.length} governing fields`,
        "exact match still needs executed evidence",
      ])
    ) {
      violations.push(`transferability ${row.id} visible teaching state`);
    }
  }
  return violations;
}

export function phase6StatusViolations(evidence, authority) {
  const violations = [];
  if (!evidence || evidence.schemaVersion !== 2) {
    return ["Phase 6 status hook/schema"];
  }
  if (!authority || !Array.isArray(authority.violations)) {
    violations.push("Phase 6 tracked authority unavailable");
  } else {
    violations.push(...authority.violations.map((item) => `Phase 6 tracked authority: ${item}`));
  }
  if (!sameRecord(evidence.records?.historical, PHASE6_HISTORICAL_RECORD)) {
    violations.push("Phase 6 historical source-pinned record");
  }
  if (!sameRecord(evidence.records?.current, authority?.record)) {
    violations.push("Phase 6 current tracked-evidence record");
  }
  const historical = evidence.records?.historical;
  const current = evidence.records?.current;
  if (
    !historical
    || historical.id !== "historical"
    || historical.authority.executionCommit !== "390fe35"
    || historical.arm1.runState !== "complete"
    || historical.arm1.points !== "204/204"
    || historical.arm1.measuredHeadline !== "3/90"
    || historical.arm2.measurement !== "none"
    || historical.closure.flaglessCanonicalGate !== "not run"
    || !/six controls not executed/i.test(historical.arm1.reportInventory)
  ) {
    violations.push("Phase 6 historical snapshot");
  }
  if (
    !current
    || current.id !== "current"
    || current.authority.historicalArm2ExecutionCommit !== PHASE6_STATUS_COMMIT
    || current.authority.arm2ValuesSha256 !== PHASE6_ARM2_VALUES_SHA256
    || current.arm1.points !== "204/204"
    || current.arm1.measuredHeadline !== "3/90"
    || current.arm1.evidenceClass !== "measured-only; not the registered replacement gate"
    || !/legacy rows predate per-row self-reported config/i.test(current.arm1.historicalScope)
    || current.arm1.extentFragility !== "historical one-sided=16; closed symmetric |AR-threshold| <= 0.135=59; additional=43; exact-threshold witnesses=-23C/f=0.15/AR=1.5"
    || current.arm2.runState !== "complete historical measurement"
    || current.arm2.points !== "204/204"
    || current.arm2.measurement !== "54/90 common scope; 54/78 arm-specific scope"
    || !/M1 everywhere-narrow starter approximation/i.test(current.arm2.model)
    || !/204\/204 rows self-report the registered M1 configuration/i.test(current.arm2.model)
    || !/measured-only and in-sample/i.test(current.arm2.evidenceClass)
    || !/causal attribution is confounded/i.test(current.arm2.comparisonLimit)
    || !/only the implemented dip-factor intervention effect/i.test(current.arm2.futureMatchedPairLimit)
    || !/not physical SDAK causality or necessity/i.test(current.arm2.futureMatchedPairLimit)
    || current.arm2.extentFragility !== "historical one-sided=33; closed symmetric |AR-threshold| <= 0.135=85; additional=52; exact-threshold witnesses=-32C/f=0.15/AR=1.5"
    || current.closure.registeredScoringRule !== "ADR 0026 conservative-intersection rule registered"
    || current.closure.registeredReplacementGate !== "R15 planned; unfrozen; unimplemented; unexecuted"
    || current.closure.numericalAdequacy !== "open"
    || current.closure.previewGpuCohort !== "open"
    || current.closure.matchedNoDipAblation !== "M1_NO_DIP_ABLATION planned; unfrozen; unimplemented; unexecuted"
    || !/all four charter families open/i.test(current.closure.heldOutValidation)
    || !/status=candidate-only-no-validation-target-frozen/i.test(current.closure.heldOutValidation)
    || !/passEligible=false/i.test(current.closure.heldOutValidation)
    || !/No audited family is presently apples-to-apples/i.test(current.closure.heldOutValidation)
    || !/supplies no validation threshold/i.test(current.closure.heldOutValidation)
    || !/no quantitative pressure target/i.test(current.closure.pressureValidation)
    || !/status=source-locked-context-only/i.test(current.closure.pressureValidation)
    || !/scoreable=false/i.test(current.closure.pressureValidation)
    || !/no pass interval may be derived/i.test(current.closure.pressureValidation)
    || !/immutable R15 snapshot/i.test(current.closure.sourceSnapshotObligation)
    || !/environment allowlist/i.test(current.closure.sourceSnapshotObligation)
    || !/child source identity verification/i.test(current.closure.sourceSnapshotObligation)
    || current.closure.phaseStatus !== "active and incomplete"
    || !/9\/448 Tier 1 entries differ/i.test(current.closure.crossPlatformControl)
    || !/maximum 31 ULP/i.test(current.closure.crossPlatformControl)
    || !/coverage=integer -2\.\.-30 C plus boundaries -3\.3\/-9\.9\/-21\.5 C/i.test(current.closure.crossPlatformControl)
    || !/registered sweep cold tail -31,-32,-33,-34,-35 C absent/i.test(current.closure.crossPlatformControl)
    || !/required in the new R15 fingerprint/i.test(current.closure.crossPlatformControl)
    || !/fixtures self-report host platform=win32 arch=x64 node=v24\.13\.1 v8=13\.6\.233\.17-node\.40/i.test(current.closure.crossPlatformControl)
    || !/host platform=darwin arch=arm64 node=v24\.13\.1 v8=13\.6\.233\.17-node\.40/i.test(current.closure.crossPlatformControl)
    || !/not hardware authentication/i.test(current.closure.crossPlatformControl)
    || !/Tier 2 tracked historical table reports 4 CAK rows matching the x64 baseline/i.test(current.closure.crossPlatformControl)
    || !/raw logs\/exit records are not published in evidence\//i.test(current.closure.crossPlatformControl)
    || !/arm64 outputs are not independently rederivable/i.test(current.closure.crossPlatformControl)
    || !/no M1, full-grid, or digit-level portability claim/i.test(current.closure.crossPlatformControl)
  ) {
    violations.push("Phase 6 current snapshot");
  }

  const forbiddenKeys = ownKeysDeep(evidence.records).filter(
    (key) => /^(?:combinedScore|gatePass|overallPass|totalScore)$/i.test(key),
  );
  if (forbiddenKeys.length > 0) {
    violations.push("Phase 6 arms remain unmerged");
  }

  for (const view of ["historical", "current"]) {
    const record = evidence.records[view];
    const dom = evidence.rendered?.[view];
    if (
      !dom
      || dom.view !== view
      || dom.recordId !== record.id
      || dom.arm1Status !== record.arm1.runState
      || dom.arm2Status !== record.arm2.runState
      || dom.gateStatus !== (record.closure.registeredReplacementGate || record.closure.flaglessCanonicalGate)
      || dom.reviewStatus !== (record.closure.phaseStatus || record.closure.independentReview)
      || dom.crossPlatformStatus !== (record.closure.crossPlatformControl || record.closure.crossPlatformArm64)
      || dom.arm1MeasuredHeadline !== record.arm1.measuredHeadline
      || dom.arm2Measurement !== (record.arm2.measurement || "none")
    ) {
      violations.push(`Phase 6 ${view} rendered state`);
    }
    const visibleRows = (values) => Object.keys(values).map((key) => ({
      label: key
        .replace(/([A-Z])/g, " $1")
        .replace(/^./, (character) => character.toUpperCase()),
      value: values[key],
    }));
    const expectedVisibleCards = [
      {
        title: "ARM 1 — MEASURED CONTROL",
        rows: visibleRows(record.arm1),
      },
      {
        title: "ARM 2 — SEPARATE TREATMENT",
        rows: visibleRows(record.arm2),
      },
      {
        title: "CLOSURE STILL OWED",
        rows: visibleRows(record.closure),
      },
      {
        title: "PROVENANCE FOR THIS VIEW",
        rows: visibleRows(record.authority),
      },
    ];
    if (
      !sameRecord(dom?.visibleCards, expectedVisibleCards)
      || !includesEvery(dom?.visibleStamp, [
        record.label,
        record.authority.snapshotMeaning,
      ])
      || !includesEvery(
        dom?.visibleBanner,
        view === "historical"
          ? ["Historical wording, preserved", "not a claim about the repository now"]
          : [
              "Current scope",
              "historical measured-only comparisons",
              "not pooled",
              "active and incomplete",
            ],
      )
    ) {
      violations.push(`Phase 6 ${view} visible teaching state`);
    }
  }
  if (
    evidence.reset?.view !== "current"
    || !includesEvery(evidence.reset?.visibleStamp, [
      "Current Phase 6 authority",
      "both historical arms measured",
    ])
  ) {
    violations.push("Phase 6 status reset");
  }
  return violations;
}

function expectedSigma0Sample(t) {
  const basalBroad = 0.02 * Math.pow(t, 1.75) + 0.3;
  const prismBroad = 0.015 * t * t + 0.02 * Math.pow(t, 0.6);
  const basalDip = 1 - 0.87 * Math.exp(
    -Math.pow(Math.log10(t) - Math.log10(4.5), 2) / 0.07,
  );
  const prismDip = 1 - 0.95 * Math.exp(
    -Math.pow(Math.log10(t) - Math.log10(14.4), 2) / 0.06,
  );
  const prism2009 = 0.02 * Math.pow(t, 1.9) - 0.025 * (t - 0.3);
  const prismCube = 0.04 * Math.pow(Math.abs(t - 4), 3);
  const aPrism = (0.4 + prismCube) / (2.2 + prismCube);
  return {
    basalBroad,
    prismBroad,
    basalDip,
    prismDip,
    basalSigma0: basalBroad * basalDip,
    prismSigma0: prismBroad * prismDip,
    basalAlphaHK: Math.exp(-basalBroad / 0.20),
    prismAlphaHK: aPrism * Math.exp(-prism2009 / 0.20),
  };
}

function expectedPreregisterSample(t, cB = 4.5, cP = 14.4) {
  const basalBroad = 0.02 * Math.pow(t, 1.75) + 0.3;
  const prismBroad = 0.015 * t * t + 0.02 * Math.pow(t, 0.6);
  const basalDip = 1 - 0.87 * Math.exp(
    -Math.pow(Math.log10(t) - Math.log10(cB), 2) / 0.07,
  );
  const prismDip = 1 - 0.95 * Math.exp(
    -Math.pow(Math.log10(t) - Math.log10(cP), 2) / 0.06,
  );
  const order = basalBroad * basalDip < prismBroad * prismDip
    ? "basal-lower"
    : "prism-lower";
  return {
    basalBroad,
    prismBroad,
    basalDip,
    prismDip,
    order,
    proxyLabel: order === "basal-lower" ? "C" : "P",
  };
}

function sameNumericRecord(actual, expected) {
  return actual && Object.entries(expected).every(([key, value]) => (
    typeof value === "number"
      ? near(actual[key], value, 1e-12, 1e-14)
      : actual[key] === value
  ));
}

const EDUCATION_DIP_SAMPLE_T = Object.freeze([4.5, 8, 14.4]);

export function sigma0AssetViolations(evidence) {
  const violations = [];
  if (!evidence || evidence.schemaVersion !== 1) return ["sigma0 asset hook/schema"];
  if (
    evidence.semanticContract?.quantity !== "coefficient-order-diagnostic"
    || evidence.semanticContract?.habitBoundary !== false
    || evidence.semanticContract?.habitClassification !== false
    || evidence.semanticContract?.habitProxy !== false
    || evidence.semanticContract?.dipLogBase !== 10
  ) violations.push("sigma0 semantic contract");
  if (
    evidence.constants?.basalCentreC !== 4.5
    || evidence.constants?.prismCentreC !== 14.4
    || evidence.constants?.basalDepth !== 0.87
    || evidence.constants?.prismDepth !== 0.95
    || evidence.constants?.basalWidth !== 0.07
    || evidence.constants?.prismWidth !== 0.06
  ) violations.push("sigma0 dip constants");
  if (
    !Array.isArray(evidence.samples)
    || !sameRecord(evidence.samples.map((sample) => sample?.t), EDUCATION_DIP_SAMPLE_T)
  ) {
    violations.push("sigma0 sample inventory");
  } else {
    for (const sample of evidence.samples) {
      if (!sameNumericRecord(sample.values, expectedSigma0Sample(sample.t))) {
        violations.push(`sigma0 base-10 formula sample ${sample.t}`);
      }
    }
  }
  if (
    !Array.isArray(evidence.sigmaRootsDipped)
    || evidence.sigmaRootsDipped.length !== 3
    || !near(evidence.sigmaRootsDipped[0], 3.08, 0.01, 0.03)
    || !near(evidence.sigmaRootsDipped[1], 8.07, 0.01, 0.03)
    || !near(evidence.sigmaRootsDipped[2], 24.73, 0.01, 0.03)
  ) violations.push("sigma0 dipped equality roots");
  if (
    !Array.isArray(evidence.alphaHKRoots)
    || evidence.alphaHKRoots.length !== 3
    || !near(evidence.alphaHKRoots[0], 3.9, 0.03, 0.15)
    || !near(evidence.alphaHKRoots[1], 5.0, 0.03, 0.15)
    || !near(evidence.alphaHKRoots[2], 10.6, 0.03, 0.2)
  ) violations.push("alphaHK equality roots");
  for (const id of ["broad", "dipped", "alphaHK"]) {
    if (!includesEvery(evidence.visible?.[id], [
      "Diagnostic only",
      "not a habit boundary",
      "habit classification",
    ])) violations.push(`sigma0 ${id} visible diagnostic limit`);
  }
  return violations;
}

export function preregisterAssetViolations(evidence) {
  const violations = [];
  if (!evidence || evidence.schemaVersion !== 1) return ["preregister asset hook/schema"];
  const semantic = evidence.semanticContract || {};
  if (
    semantic.quantity !== "temperature-only-equal-field-coefficient-order-proxy"
    || semantic.fieldSweep !== false
    || semantic.habitProxy !== true
    || semantic.proxyIsValid !== false
    || semantic.implementsAdr0025 !== false
    || semantic.tokenIsContentHash !== false
    || semantic.tokenIsProtocolHash !== false
  ) violations.push("preregister semantic contract");
  if (
    evidence.constants?.basalCentreC !== 4.5
    || evidence.constants?.prismCentreC !== 14.4
    || evidence.constants?.logBase !== 10
  ) violations.push("preregister dip constants");
  if (
    !Array.isArray(evidence.samples)
    || !sameRecord(evidence.samples.map((sample) => sample?.t), EDUCATION_DIP_SAMPLE_T)
  ) {
    violations.push("preregister sample inventory");
  } else {
    for (const sample of evidence.samples) {
      if (!sameNumericRecord(sample.values, expectedPreregisterSample(sample.t))) {
        violations.push(`preregister base-10 formula sample ${sample.t}`);
      }
    }
  }
  if (
    evidence.scores?.default?.agree !== 15
    || evidence.scores?.default?.n !== 15
    || evidence.scores?.noDips?.agree !== 1
    || evidence.scores?.noDips?.n !== 15
    || evidence.scores?.nonDefault?.agree !== 15
    || evidence.scores?.nonDefault?.n !== 15
  ) violations.push("preregister proxy scores");
  if (!/^[0-9a-f]{16}$/.test(evidence.illustrativeToken || "")) {
    violations.push("preregister illustrative token");
  }
  if (!includesEvery(evidence.visible?.free, ["invalid proxy", "target is visible"])) {
    violations.push("preregister free visible state");
  }
  if (!includesEvery(evidence.visible?.frozen, [
    "illustrative token",
    "not a content hash",
    "protocol hash",
    "ADR 0025 implementation",
  ])) violations.push("preregister frozen visible state");
  if (!includesEvery(evidence.visible?.revealed, ["invalid proxy scored", "not evidence"])) {
    violations.push("preregister revealed visible state");
  }
  if (!includesEvery(evidence.visible?.nonDefaultRevealed, [
    "Many different centre pairs",
    "same proxy score",
    "not nature",
  ])) violations.push("preregister non-default revealed visible state");
  return violations;
}

export function sweepAssetViolations(evidence, authority) {
  const violations = [];
  if (!evidence || evidence.schemaVersion !== 1) return ["sweep asset hook/schema"];
  const semantic = evidence.semanticContract || {};
  if (
    semantic.fractionMeaning !== "fraction-of-water-saturation-supersaturation-ceiling"
    || semantic.relativeHumidity !== false
    || semantic.referenceMeaning !== "registered-reference-expectation"
    || semantic.cakModelInvalidRows !== 0
    || semantic.cakA1ModelInvalidRows !== 0
    || semantic.cakA1ProtocolInadmissibleRows !== 204
  ) violations.push("sweep semantic contract");
  if (!sameRecord(evidence.grids?.cak, authority?.sweeps?.cak?.grid)) {
    violations.push("sweep CAK grid from tracked evidence");
  }
  if (!sameRecord(evidence.grids?.cakA1, authority?.sweeps?.cakA1?.grid)) {
    violations.push("sweep CAK_A1 grid from tracked evidence");
  }
  if (
    evidence.scores?.cak?.headlineAgree !== authority?.sweeps?.cak?.commonAgree
    || evidence.scores?.cak?.headlineN !== authority?.sweeps?.cak?.commonTotal
  ) violations.push("sweep CAK independently derived score");
  if (
    evidence.scores?.cakA1?.headlineAgree !== authority?.sweeps?.cakA1?.commonAgree
    || evidence.scores?.cakA1?.headlineN !== authority?.sweeps?.cakA1?.commonTotal
  ) violations.push("sweep CAK_A1 independently derived score");
  if (!includesEvery(evidence.visible?.cak, [
    "fraction of the water-saturation supersaturation ceiling",
    "registered reference",
    "Zero of 204 CAK rows was model-invalid",
  ])) violations.push("sweep CAK visible semantics");
  if (!includesEvery(evidence.visible?.cakA1, [
    "Zero of 204 CAK_A1 rows was model-invalid",
    "all 204 are protocol-inadmissible",
  ])) violations.push("sweep CAK_A1 visible validity distinction");
  return violations;
}

export function cm6VisibleLimitViolations(evidence) {
  const violations = [];
  for (const view of ["fastRendered", "broadRendered"]) {
    if (!includesEvery(evidence?.[view]?.visibleStatus, [
      "Diagnostic only",
      "not a habit boundary",
      "habit classification",
    ])) violations.push(`CM6 ${view} visible diagnostic limit`);
  }
  return violations;
}

function equalityDifference(state, temperature) {
  const baseBasal =
    0.02 * Math.pow(temperature, 1.75) + 0.3;
  const basePrism = state.mode === "corrected"
    ? 0.015 * temperature * temperature + 0.02 * Math.pow(temperature, 0.6)
    : 0.02 * Math.pow(temperature, 1.9) - 0.025 * (temperature - 0.3);

  let basalFactor = 1;
  let prismFactor = 1;
  if (state.mode === "corrected") {
    if (state.bOn) {
      basalFactor = 1 - 0.87 * Math.exp(
        -Math.pow(
          Math.log10(temperature) - Math.log10(state.bC),
          2,
        ) / 0.07,
      );
    }
    if (state.pOn) {
      prismFactor = 1 - 0.95 * Math.exp(
        -Math.pow(
          Math.log10(temperature) - Math.log10(state.pC),
          2,
        ) / 0.06,
      );
    }
  } else {
    if (state.bOn) {
      const basalZ = (temperature - state.bC) / 1.6;
      basalFactor = 1 - state.depth * Math.exp(-basalZ * basalZ);
    }
    if (state.pOn) {
      const prismZ = (temperature - state.pC) / 1.6;
      prismFactor = 1 - state.depth * Math.exp(-prismZ * prismZ);
    }
  }
  return baseBasal * basalFactor - basePrism * prismFactor;
}

const EQUALITY_DEFAULT_STATE = Object.freeze({
  bOn: false,
  pOn: false,
  bC: 4.5,
  pC: 14.4,
  depth: 0.7,
  mode: "approx",
});

const REGISTERED_BASE10_EQUALITY_STATE = Object.freeze({
  bOn: true,
  pOn: true,
  bC: 4.5,
  pC: 14.4,
  depth: 0.7,
  mode: "corrected",
});

export function independentEqualityLocations(state, range = [2, 35], step = 0.05) {
  const equalities = [];
  let previous = null;
  let previousTemperature = null;
  const count = Math.round((range[1] - range[0]) / step);
  for (let index = 0; index <= count; index++) {
    const temperature = range[0] + index * step;
    const difference = equalityDifference(state, temperature);
    if (
      previous !== null
      && (previous > 0) !== (difference > 0)
    ) {
      equalities.push(
        previousTemperature
        + (temperature - previousTemperature)
          * (Math.abs(previous) / (Math.abs(previous) + Math.abs(difference))),
      );
    }
    previous = difference;
    previousTemperature = temperature;
  }
  return equalities;
}

// Retain the old export name for callers outside this verifier while making its
// restricted quantity explicit everywhere the education site presents it.
export const independentCrossings = independentEqualityLocations;

function independentOrderBands(state, equalities, range) {
  const edges = [range[0], ...equalities, range[1]];
  return edges.slice(0, -1).map((left, index) => {
    const right = edges[index + 1];
    const midpoint = (left + right) / 2;
    return [
      left,
      right,
      equalityDifference(state, midpoint) > 0
        ? "prism-higher"
        : "basal-higher",
    ];
  });
}

function sameOrderBands(actual, expected) {
  return Array.isArray(actual)
    && actual.length === expected.length
    && actual.every((band, index) => (
      Array.isArray(band)
      && band.length === 3
      && near(band[0], expected[index][0], 1e-12, 1e-12)
      && near(band[1], expected[index][1], 1e-12, 1e-12)
      && band[2] === expected[index][2]
    ));
}

function isRegisteredBase10EqualityState(state) {
  return state.mode === "corrected"
    && state.bOn === true
    && state.pOn === true
    && state.bC === 4.5
    && state.pC === 14.4;
}

function independentlyVerifyDipCentreInvariance() {
  const profiles = [
    { centre: 4.5, depth: 0.87, width: 0.07 },
    { centre: 14.4, depth: 0.95, width: 0.06 },
  ];
  const logs = [Math.log10, Math.log];
  return profiles.every(({ centre, depth, width }) => logs.every((log) => {
    const factor = (temperature) => 1 - depth * Math.exp(
      -Math.pow(log(temperature) - log(centre), 2) / width,
    );
    const atCentre = factor(centre);
    return near(atCentre, 1 - depth, 0, 1e-15)
      && factor(centre * 0.999) > atCentre
      && factor(centre * 1.001) > atCentre;
  }));
}

function equalityStateViolations(label, stateEvidence, constants) {
  const violations = [];
  if (!stateEvidence || !stateEvidence.state) {
    return [`equality ${label} state`];
  }
  const expected = independentEqualityLocations(
    stateEvidence.state,
    constants.range,
    constants.sampleStep,
  );
  const expectedBands = independentOrderBands(
    stateEvidence.state,
    expected,
    constants.range,
  );
  if (
    !Array.isArray(stateEvidence.equalityLocations)
    || stateEvidence.equalityLocations.length !== expected.length
    || stateEvidence.equalityLocations.some(
      (value, index) => !near(value, expected[index], 1e-12, 1e-12),
    )
  ) {
    violations.push(`equality ${label} independent roots`);
  }
  if (!sameOrderBands(stateEvidence.orderBands, expectedBands)) {
    violations.push(`equality ${label} independent order bands`);
  }
  const shouldBeRegistered = isRegisteredBase10EqualityState(stateEvidence.state);
  if (stateEvidence.registeredBase10State !== shouldBeRegistered) {
    violations.push(`equality ${label} registered-base10-state gate`);
  }
  if (
    stateEvidence.dipCentreLogBaseInvariant !== true
    || stateEvidence.habitProxy !== false
  ) {
    violations.push(`equality ${label} semantic state`);
  }
  if (
    stateEvidence.dom.formulaMode !== stateEvidence.state.mode
    || stateEvidence.dom.basalDip
      !== (stateEvidence.state.bOn ? "on" : "off")
    || stateEvidence.dom.prismDip
      !== (stateEvidence.state.pOn ? "on" : "off")
    || Number(stateEvidence.dom.basalCentre) !== stateEvidence.state.bC
    || Number(stateEvidence.dom.prismCentre) !== stateEvidence.state.pC
    || Number(stateEvidence.dom.depth) !== stateEvidence.state.depth
    || Number(stateEvidence.dom.equalityCount) !== expected.length
    || Number(stateEvidence.dom.orderBandCount) !== expectedBands.length
    || stateEvidence.dom.equalitySemantics
      !== "sigma0-equality-equal-A-shared-positive-sigmaSurf-only"
    || stateEvidence.dom.dipCentres !== "4.5,14.4"
    || stateEvidence.dom.dipCentreLogBaseInvariant !== "true"
    || stateEvidence.dom.dipLogBaseProvenance
      !== "P4-registered-base10-source-log-unspecified"
    || stateEvidence.dom.habitProxy !== "false"
    || stateEvidence.dom.registeredBase10State !== String(shouldBeRegistered)
    || (
      shouldBeRegistered
      && stateEvidence.dom.verdictKind !== "registered-base10-diagnostic"
    )
    || (
      !shouldBeRegistered
      && stateEvidence.dom.verdictKind !== "current-order-diagnostic"
    )
  ) {
    violations.push(`equality ${label} rendered state`);
  }
  const domEqualities = stateEvidence.dom.equalityLocations
    ? stateEvidence.dom.equalityLocations.split(",").map(Number)
    : [];
  if (
    domEqualities.length !== expected.length
    || domEqualities.some(
      (value, index) => !near(value, expected[index], 0, 5e-7),
    )
  ) {
    violations.push(`equality ${label} rendered roots`);
  }
  const roundedText = expected.length
    ? expected.map((value) => `−${value.toFixed(2)}°C`)
    : [];
  if (
    !includesEvery(stateEvidence.dom.visibleReadout, [
      `${expected.length} sigma0 equalit`,
      ...roundedText,
      "log-base-invariant",
    ])
    || !stateEvidence.dom.visibleBanner
    || stateEvidence.dom.visibleSeriesCount !== 2
    || stateEvidence.dom.visibleMarkerCount !== expected.length
    || stateEvidence.dom.visibleOrderBandCount !== expected.length + 1
    || stateEvidence.dom.visibleSvg !== true
  ) {
    violations.push(`equality ${label} visible chart state`);
  }
  return violations;
}

export function crossingViolations(evidence) {
  if (!evidence || evidence.schemaVersion !== 2) {
    return ["equality hook/schema"];
  }
  const violations = [];
  const constants = evidence.constants;
  const expectedSemanticContract = {
    quantity: "sigma0-equality-and-restricted-alphaHK-order",
    constraint: "equal-A-shared-positive-sigmaSurf",
    labels: ["basal-higher", "prism-higher", "tie"],
    broadCurveProvenance: "P2-source-fit",
    dipFormProvenanceForNakaya: "P3-Nakaya-informed",
    dipLogBaseProvenance: "P4-registered-base10-source-log-unspecified",
    m1WidthPolicy: "everywhere-narrow-approximation",
    widthDependentM2Implemented: false,
    habitProxy: false,
  };
  if (!sameRecord(evidence.semanticContract, expectedSemanticContract)) {
    violations.push("equality semantic contract");
  }
  if (
    !constants
    || !sameJson(constants.range, [2, 35])
    || constants.sampleStep !== 0.05
    || constants.approximateWidth !== 1.6
    || !sameRecord(
      constants.dipCentres,
      { basal: 4.5, prism: 14.4, logBaseInvariant: true },
    )
    || !sameRecord(constants.defaultState, EQUALITY_DEFAULT_STATE)
    || !sameRecord(
      constants.registeredBase10State,
      REGISTERED_BASE10_EQUALITY_STATE,
    )
  ) {
    violations.push("equality constants");
    return violations;
  }
  if (!independentlyVerifyDipCentreInvariance()) {
    violations.push("equality dip-centre log-base invariance");
  }
  if (!sameRecord(evidence.default.state, EQUALITY_DEFAULT_STATE)) {
    violations.push("equality default state");
  }
  if (!sameRecord(
    evidence.registeredBase10.state,
    REGISTERED_BASE10_EQUALITY_STATE,
  )) {
    violations.push("equality registered base-10 state");
  }
  const expectedControlStates = {
    default: {
      state: { ...EQUALITY_DEFAULT_STATE },
      basalSliderDisabled: true,
      prismSliderDisabled: true,
      depthSliderDisabled: true,
      approximatePressed: "true",
      correctedPressed: "false",
    },
    basalOn: {
      state: { ...EQUALITY_DEFAULT_STATE, bOn: true },
      basalSliderDisabled: false,
      prismSliderDisabled: true,
      depthSliderDisabled: false,
      approximatePressed: "true",
      correctedPressed: "false",
    },
    bothOn: {
      state: { ...EQUALITY_DEFAULT_STATE, bOn: true, pOn: true },
      basalSliderDisabled: false,
      prismSliderDisabled: false,
      depthSliderDisabled: false,
      approximatePressed: "true",
      correctedPressed: "false",
    },
    basalSlider: {
      state: {
        ...EQUALITY_DEFAULT_STATE,
        bOn: true,
        pOn: true,
        bC: 6.2,
      },
      basalSliderDisabled: false,
      prismSliderDisabled: false,
      depthSliderDisabled: false,
      approximatePressed: "true",
      correctedPressed: "false",
    },
    prismSlider: {
      state: {
        ...EQUALITY_DEFAULT_STATE,
        bOn: true,
        pOn: true,
        bC: 6.2,
        pC: 16.1,
      },
      basalSliderDisabled: false,
      prismSliderDisabled: false,
      depthSliderDisabled: false,
      approximatePressed: "true",
      correctedPressed: "false",
    },
    depthSlider: {
      state: {
        ...EQUALITY_DEFAULT_STATE,
        bOn: true,
        pOn: true,
        bC: 6.2,
        pC: 16.1,
        depth: 0.5,
      },
      basalSliderDisabled: false,
      prismSliderDisabled: false,
      depthSliderDisabled: false,
      approximatePressed: "true",
      correctedPressed: "false",
    },
    correctedMode: {
      state: {
        ...EQUALITY_DEFAULT_STATE,
        bOn: true,
        pOn: true,
        bC: 6.2,
        pC: 16.1,
        depth: 0.5,
        mode: "corrected",
      },
      basalSliderDisabled: false,
      prismSliderDisabled: false,
      depthSliderDisabled: true,
      approximatePressed: "false",
      correctedPressed: "true",
    },
    approximateMode: {
      state: {
        ...EQUALITY_DEFAULT_STATE,
        bOn: true,
        pOn: true,
        bC: 6.2,
        pC: 16.1,
        depth: 0.5,
      },
      basalSliderDisabled: false,
      prismSliderDisabled: false,
      depthSliderDisabled: false,
      approximatePressed: "true",
      correctedPressed: "false",
    },
  };
  if (!sameRecord(evidence.controls, expectedControlStates)) {
    violations.push("equality actual control wiring");
  }
  violations.push(
    ...equalityStateViolations("default", evidence.default, constants),
    ...equalityStateViolations(
      "registered base-10",
      evidence.registeredBase10,
      constants,
    ),
    ...equalityStateViolations("mutated", evidence.mutated, constants),
  );
  const expectedRegisteredBase10 = independentEqualityLocations(
    constants.registeredBase10State,
    constants.range,
    constants.sampleStep,
  );
  const rounded = expectedRegisteredBase10.map((value) => Number(value.toFixed(2)));
  if (!sameJson(rounded, [3.08, 8.07, 24.73])) {
    violations.push("equality registered base-10 locations");
  }
  if (!sameRecord(evidence.reset.state, EQUALITY_DEFAULT_STATE)) {
    violations.push("equality reset");
  }
  return violations;
}
