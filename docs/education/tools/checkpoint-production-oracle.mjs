#!/usr/bin/env node

/**
 * Production-backed oracle for the checkpoint mutation teaching explorer.
 *
 * The browser demo is intentionally a reconstruction: it cannot import the TypeScript codec or
 * runner. This helper executes the real core decoders and the real Gate 4b checkpoint-context
 * verifier against small deterministic fixtures, then compares their outcomes with every case
 * published by anim-checkpoint-mutations.js.
 */

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

import {
  CHECKPOINT_MAGIC,
  GG_PRESETS,
  cellCount,
  computeMetrics,
  decodeCheckpoint,
  decodeLKCheckpoint,
  domainCenter,
  encodeCheckpoint,
  encodeLKCheckpoint,
  hashCounter,
  hexDistance,
} from "../../../core/src/index.ts";
import { verifyGate4BCheckpoint } from "../../../runner/src/gate4b.ts";

export const CHECKPOINT_TEACHING_CASES_SHA256 =
  "f2cec56453a88929776af4befd7cc8170a11826bb054182bf5b935f1681868b8";

const TOOL_PATH = fileURLToPath(import.meta.url);
const REPOSITORY_ROOT = resolve(dirname(TOOL_PATH), "../../..");
const TEACHING_ASSET_PATH = resolve(
  REPOSITORY_ROOT,
  "docs/education/assets/anim-checkpoint-mutations.js",
);
const CHECKPOINT_SOURCE_PATH = resolve(REPOSITORY_ROOT, "core/src/checkpoint.ts");
const CONTEXT_SOURCE_PATH = resolve(REPOSITORY_ROOT, "runner/src/gate4b.ts");
const EXPECTED_CASE_IDS = [
  "clean-lk-v2",
  "corrupt-magic",
  "missing-surface-policy",
  "short-fill-descriptor",
  "negative-density",
  "reflecting-diagnostic",
  "legacy-v1-clean",
  "legacy-v1-policy-injected",
  "registered-config-mismatch",
  "unknown-gg-metric",
];

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function bytesEqual(left, right) {
  if (left.length !== right.length) return false;
  for (let index = 0; index < left.length; index += 1) {
    if (left[index] !== right[index]) return false;
  }
  return true;
}

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}

function readTeachingCases() {
  const source = readFileSync(TEACHING_ASSET_PATH, "utf8");
  const sandbox = {
    document: {
      querySelector() {
        return null;
      },
    },
    window: {},
  };
  vm.runInNewContext(source, sandbox, {
    filename: TEACHING_ASSET_PATH,
    timeout: 1_000,
  });
  const explorer = sandbox.window.__VCC_EDU_CHECKPOINT_EXPLORER__;
  if (
    explorer === null ||
    typeof explorer !== "object" ||
    explorer.schemaVersion !== 1 ||
    !Array.isArray(explorer.cases)
  ) {
    throw new Error("checkpoint teaching asset did not expose schemaVersion 1 cases");
  }
  const cases = cloneJson(explorer.cases);
  const caseHash = assertTeachingCaseHash(cases);
  const caseIds = cases.map((record) => record.id);
  if (JSON.stringify(caseIds) !== JSON.stringify(EXPECTED_CASE_IDS)) {
    throw new Error(`checkpoint teaching case order/identity shifted: ${caseIds.join(", ")}`);
  }
  return { cases, caseHash, source };
}

function assertTeachingCaseHash(cases) {
  const caseHash = sha256(JSON.stringify(cases));
  if (caseHash !== CHECKPOINT_TEACHING_CASES_SHA256) {
    throw new Error(
      "checkpoint teaching case JSON changed without review: " +
        `expected ${CHECKPOINT_TEACHING_CASES_SHA256}, got ${caseHash}`,
    );
  }
  return caseHash;
}

function parseHeader(bytes) {
  if (bytes.length < 12) throw new Error("oracle fixture is too short to contain a header");
  const headerLength = new DataView(
    bytes.buffer,
    bytes.byteOffset,
    bytes.byteLength,
  ).getUint32(8, true);
  const headerEnd = 12 + headerLength;
  if (headerEnd > bytes.length) throw new Error("oracle fixture header exceeds its byte length");
  return JSON.parse(new TextDecoder().decode(bytes.subarray(12, headerEnd)));
}

function rewriteHeader(bytes, mutate) {
  const headerLength = new DataView(
    bytes.buffer,
    bytes.byteOffset,
    bytes.byteLength,
  ).getUint32(8, true);
  const header = parseHeader(bytes);
  mutate(header);
  const encodedHeader = new TextEncoder().encode(JSON.stringify(header));
  const payload = bytes.subarray(12 + headerLength);
  const output = new Uint8Array(12 + encodedHeader.length + payload.length);
  output.set(bytes.subarray(0, 8), 0);
  new DataView(output.buffer).setUint32(8, encodedHeader.length, true);
  output.set(encodedHeader, 12);
  output.set(payload, 12 + encodedHeader.length);
  return output;
}

function isActiveLKCell(state, index) {
  if (state.domain === "box") return true;
  const [centerI, centerJ, centerK] = state.center;
  const plane = state.dims.nx * state.dims.ny;
  const k = Math.floor(index / plane);
  const inPlane = index - k * plane;
  const j = Math.floor(inPlane / state.dims.nx);
  const i = inPlane - j * state.dims.nx;
  const radius = Math.min(
    centerI,
    state.dims.nx - 1 - centerI,
    centerJ,
    state.dims.ny - 1 - centerJ,
  );
  const halfZ = Math.min(centerK, state.dims.nz - 1 - centerK);
  return (
    hexDistance(i - centerI, j - centerJ) <= radius &&
    Math.abs(k - centerK) <= halfZ
  );
}

function syntheticLKState() {
  const dims = { nx: 5, ny: 4, nz: 3 };
  const count = cellCount(dims);
  const a = new Uint8Array(count);
  const f = new Float64Array(count);
  const sigma = new Float64Array(count);
  const center = domainCenter(dims);
  for (let index = 0; index < count; index += 1) {
    const provisional = {
      dims,
      domain: "hexPrism",
      center,
    };
    if (!isActiveLKCell(provisional, index)) continue;
    a[index] = hashCounter(2, index, 0, 20) & 1;
    f[index] = a[index] === 1 ? 1 : hashCounter(2, index, 0, 21) / 2 ** 32;
    sigma[index] = a[index] === 1 ? 0 : hashCounter(2, index, 0, 22) / 2 ** 33;
  }
  const activeUnattachedIndex = a.findIndex(
    (attached, index) => attached === 0 && isActiveLKCell({ dims, domain: "hexPrism", center }, index),
  );
  if (activeUnattachedIndex < 0) {
    throw new Error("LK oracle fixture has no active unattached cell");
  }
  sigma[activeUnattachedIndex] = -0.375;
  return {
    state: {
      dims,
      tick: 77,
      simTimeSeconds: 1.25,
      rngSeed: 9,
      noiseEpsilon: 0,
      domain: "hexPrism",
      center,
      tempC: -15,
      sigmaInfinity: 0.002,
      dxUm: 0.35,
      pressurePa: 101325,
      paramSet: "CAK_A1",
      cflFill: 0.1,
      relaxTol: 1e-9,
      divTol: 1e-7,
      relaxMaxSweeps: 200_000,
      surfacePolicy: "aggregate-hv-g1h1-v6",
      farField: "dirichlet",
      a,
      f,
      sigma,
    },
    activeUnattachedIndex,
  };
}

function syntheticGGCheckpoint() {
  const dims = { nx: 7, ny: 6, nz: 5 };
  const count = cellCount(dims);
  const a = new Uint8Array(count);
  const b = new Float64Array(count);
  const d = new Float64Array(count);
  for (let index = 0; index < count; index += 1) {
    a[index] = hashCounter(1, index, 0, 10) & 1;
    b[index] = hashCounter(1, index, 0, 11) / 2 ** 32;
    d[index] = a[index] === 1 ? 0 : hashCounter(1, index, 0, 12) / 2 ** 32;
  }
  const state = {
    dims,
    tick: 1234,
    rngSeed: 42,
    noiseEpsilon: 1e-5,
    farField: "reflecting",
    domain: "box",
    params: GG_PRESETS.hollowColumn,
    a,
    b,
    d,
    center: domainCenter(dims),
  };
  const metrics = computeMetrics(a, b, d, dims, state.center, state.tick);
  return encodeCheckpoint(state, metrics);
}

function mutateSigmaPayload(bytes, index, value) {
  const output = bytes.slice();
  const view = new DataView(output.buffer, output.byteOffset, output.byteLength);
  const headerLength = view.getUint32(8, true);
  const header = parseHeader(output);
  let fieldOffset = 12 + headerLength;
  let sigmaOffset = null;
  for (const field of header.fields) {
    const width = field.dtype === "u8" ? 1 : field.dtype === "f64" ? 8 : field.dtype === "f32" ? 4 : 0;
    if (width === 0) throw new Error(`oracle fixture has unknown dtype ${String(field.dtype)}`);
    if (field.name === "sigma") {
      sigmaOffset = fieldOffset;
      break;
    }
    fieldOffset += width * field.length;
  }
  if (sigmaOffset === null) throw new Error("oracle fixture has no sigma field");
  view.setFloat64(sigmaOffset + 8 * index, value, true);
  return output;
}

function makeContextResult(state) {
  const rows = Array.from({ length: state.tick }, (_unused, index) => ({
    simTimeSeconds: index === state.tick - 1 ? state.simTimeSeconds : 0,
  }));
  return {
    config: {
      id: "EDU-CHECKPOINT-CONTROL",
      surfacePolicy: state.surfacePolicy,
      dims: state.dims,
      rngSeed: state.rngSeed,
      noiseEpsilon: state.noiseEpsilon,
      domain: state.domain,
      tempC: state.tempC,
      sigmaInfinity: state.sigmaInfinity,
      dxUm: state.dxUm,
      pressurePa: state.pressurePa,
      paramSet: state.paramSet,
      cflFill: state.cflFill,
      relaxTol: state.relaxTol,
      divTol: state.divTol,
      relaxMaxSweeps: state.relaxMaxSweeps,
      farField: state.farField,
    },
    rows,
    finalA: state.a,
    finalF: state.f,
    finalSigma: state.sigma,
  };
}

function buildCaseBytes() {
  const { state, activeUnattachedIndex } = syntheticLKState();
  const lkBaseline = encodeLKCheckpoint(state);
  const lkV5Baseline = encodeLKCheckpoint({
    ...state,
    surfacePolicy: "aggregate-hv-g1h1-v5",
  });
  const ggBaseline = syntheticGGCheckpoint();
  const cases = new Map();

  cases.set("clean-lk-v2", { bytes: lkBaseline.slice(), baseline: lkBaseline, kind: "lk" });

  const corruptMagic = lkBaseline.slice();
  corruptMagic[0] = "X".charCodeAt(0);
  cases.set("corrupt-magic", { bytes: corruptMagic, baseline: lkBaseline, kind: "lk" });

  cases.set("missing-surface-policy", {
    bytes: rewriteHeader(lkV5Baseline, (header) => {
      delete header.surfacePolicy;
    }),
    baseline: lkV5Baseline,
    kind: "lk",
  });

  cases.set("short-fill-descriptor", {
    bytes: rewriteHeader(lkBaseline, (header) => {
      header.fields[1].length -= 1;
    }),
    baseline: lkBaseline,
    kind: "lk",
  });

  cases.set("negative-density", {
    bytes: mutateSigmaPayload(lkBaseline, activeUnattachedIndex, -1.000_001),
    baseline: lkBaseline,
    kind: "lk",
  });

  cases.set("reflecting-diagnostic", {
    bytes: rewriteHeader(lkBaseline, (header) => {
      header.farField = "reflecting";
    }),
    baseline: lkBaseline,
    kind: "lk",
  });

  const legacyV1 = rewriteHeader(lkBaseline, (header) => {
    header.version = 1;
    delete header.surfacePolicy;
  });
  cases.set("legacy-v1-clean", { bytes: legacyV1, baseline: lkBaseline, kind: "lk" });
  cases.set("legacy-v1-policy-injected", {
    bytes: rewriteHeader(legacyV1, (header) => {
      header.surfacePolicy = "legacy-v3";
    }),
    baseline: legacyV1,
    kind: "lk",
  });

  cases.set("registered-config-mismatch", {
    bytes: rewriteHeader(lkBaseline, (header) => {
      header.surfacePolicy = "aggregate-hv-g1h1-v5";
    }),
    baseline: lkBaseline,
    kind: "lk",
  });

  cases.set("unknown-gg-metric", {
    bytes: rewriteHeader(ggBaseline, (header) => {
      header.metrics.depletionRatio = 0.5;
    }),
    baseline: ggBaseline,
    kind: "gg",
  });

  return { cases, contextResult: makeContextResult(state), activeUnattachedIndex };
}

function assertNamedMutation(caseId, fixture, activeUnattachedIndex) {
  const changed = !bytesEqual(fixture.bytes, fixture.baseline);
  if (caseId === "clean-lk-v2") {
    if (changed) throw new Error("clean LK control unexpectedly changed its encoded bytes");
    return { changed: false, witness: "encoded bytes unchanged" };
  }
  if (!changed) throw new Error(`${caseId} named mutation did not change its fixture bytes`);

  const header = parseHeader(fixture.bytes);
  switch (caseId) {
    case "corrupt-magic":
      if (new TextDecoder().decode(fixture.bytes.subarray(0, 8)) !== "XCCCKPT1") {
        throw new Error("corrupt-magic did not write the named magic witness");
      }
      return { changed: true, witness: "magic=XCCCKPT1" };
    case "missing-surface-policy":
      if (Object.hasOwn(header, "surfacePolicy")) {
        throw new Error("missing-surface-policy retained the named field");
      }
      return { changed: true, witness: "surfacePolicy absent" };
    case "short-fill-descriptor": {
      const expected = cellCount(header.dims) - 1;
      if (header.fields[1].name !== "f" || header.fields[1].length !== expected) {
        throw new Error("short-fill-descriptor did not shorten the f field by one");
      }
      return { changed: true, witness: `f.length=${expected}` };
    }
    case "negative-density": {
      const decodedHeaderLength = new DataView(
        fixture.bytes.buffer,
        fixture.bytes.byteOffset,
        fixture.bytes.byteLength,
      ).getUint32(8, true);
      const count = cellCount(header.dims);
      const sigmaOffset = 12 + decodedHeaderLength + count + 8 * count;
      const value = new DataView(
        fixture.bytes.buffer,
        fixture.bytes.byteOffset,
        fixture.bytes.byteLength,
      ).getFloat64(sigmaOffset + 8 * activeUnattachedIndex, true);
      if (!Object.is(value, -1.000_001)) {
        throw new Error(`negative-density wrote ${String(value)} instead of -1.000001`);
      }
      return { changed: true, witness: `sigma[${activeUnattachedIndex}]=-1.000001` };
    }
    case "reflecting-diagnostic":
      if (header.farField !== "reflecting") {
        throw new Error("reflecting-diagnostic did not shift farField");
      }
      return { changed: true, witness: "farField=reflecting" };
    case "legacy-v1-clean":
      if (header.version !== 1 || Object.hasOwn(header, "surfacePolicy")) {
        throw new Error("legacy-v1-clean did not produce a policy-free v1 header");
      }
      return { changed: true, witness: "version=1; surfacePolicy absent" };
    case "legacy-v1-policy-injected":
      if (header.version !== 1 || header.surfacePolicy !== "legacy-v3") {
        throw new Error("legacy-v1-policy-injected did not add the forbidden policy");
      }
      return { changed: true, witness: "version=1; surfacePolicy=legacy-v3" };
    case "registered-config-mismatch":
      if (header.surfacePolicy !== "aggregate-hv-g1h1-v5") {
        throw new Error("registered-config-mismatch did not shift v6 to v5");
      }
      return { changed: true, witness: "surfacePolicy=aggregate-hv-g1h1-v5" };
    case "unknown-gg-metric":
      if (header.metrics.depletionRatio !== 0.5) {
        throw new Error("unknown-gg-metric did not add depletionRatio");
      }
      return { changed: true, witness: "metrics.depletionRatio=0.5" };
    default:
      throw new Error(`no named-mutation witness for ${caseId}`);
  }
}

function errorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}

function classifyCodecFailure(message) {
  if (/magic/i.test(message)) return "framing";
  if (/field table|payload|field descriptor/i.test(message)) return "fields";
  if (
    /sigma\[\d+\].*>= -1|attached cell|masked wall cell|a\[\d+\]|f\[\d+\]/i.test(message)
  ) {
    return "state";
  }
  if (/surfacePolicy|version 1|unknown key ".*"|checkpoint .*metadata/i.test(message)) {
    return "header";
  }
  throw new Error(`unclassified production checkpoint refusal: ${message}`);
}

function deriveTeachingOutcome(record) {
  const firstReject = record.observations.find((observation) => observation.disposition === "reject");
  const reachedContext = record.observations.some(
    (observation) => observation.stage === "evidence-context",
  );
  const codecRejected = firstReject !== undefined && firstReject.stage !== "evidence-context";
  return {
    firstRejectStage: firstReject === undefined ? "none" : firstReject.stage,
    codecOutcome: codecRejected ? "rejected" : "accepted",
    contextOutcome: codecRejected
      ? "not-run"
      : reachedContext && firstReject !== undefined
        ? "rejected"
        : reachedContext
          ? "accepted"
          : "not-run",
  };
}

function compareOutcome(caseId, expected, actual) {
  for (const key of ["firstRejectStage", "codecOutcome", "contextOutcome"]) {
    if (actual[key] !== expected[key]) {
      throw new Error(
        `${caseId} production ${key}=${String(actual[key])}; teaching map says ${String(expected[key])}`,
      );
    }
  }
}

function executeCase(caseId, fixture, contextResult, mutation, teachingRecord) {
  let decoded;
  let codecError = null;
  try {
    decoded =
      fixture.kind === "lk"
        ? decodeLKCheckpoint(fixture.bytes)
        : decodeCheckpoint(fixture.bytes);
  } catch (error) {
    codecError = errorMessage(error);
  }

  let contextError = null;
  let contextOutcome = "not-run";
  if (codecError === null) {
    if (fixture.kind !== "lk") {
      throw new Error(`${caseId} reached an unsupported GG evidence-context path`);
    }
    contextOutcome = "accepted";
    try {
      verifyGate4BCheckpoint(fixture.bytes, contextResult);
    } catch (error) {
      contextOutcome = "rejected";
      contextError = errorMessage(error);
    }
  }

  const actual =
    codecError === null
      ? {
          firstRejectStage: contextOutcome === "rejected" ? "evidence-context" : "none",
          codecOutcome: "accepted",
          contextOutcome,
        }
      : {
          firstRejectStage: classifyCodecFailure(codecError),
          codecOutcome: "rejected",
          contextOutcome: "not-run",
        };
  const expected = deriveTeachingOutcome(teachingRecord);
  compareOutcome(caseId, expected, actual);

  let auxiliaryEvidence = null;
  if (caseId === "legacy-v1-clean") {
    const migrated = encodeLKCheckpoint(decoded.state);
    const migratedDecoded = decodeLKCheckpoint(migrated);
    if (
      bytesEqual(migrated, fixture.bytes) ||
      migratedDecoded.header.version !== 2 ||
      migratedDecoded.header.surfacePolicy !== "legacy-v3"
    ) {
      throw new Error("legacy-v1-clean did not migrate to explicit legacy-v3 LK v2 bytes");
    }
    auxiliaryEvidence = {
      productionWriter: "encodeLKCheckpoint",
      byteStable: false,
      migratedVersion: migratedDecoded.header.version,
      migratedSurfacePolicy: migratedDecoded.header.surfacePolicy,
    };
  }

  return {
    id: caseId,
    checkpointKind: teachingRecord.checkpointKind,
    mutation,
    expected,
    actual,
    production: {
      decoder: fixture.kind === "lk" ? "decodeLKCheckpoint" : "decodeCheckpoint",
      codecError,
      decodedVersion: decoded?.header.version ?? null,
      decodedSurfacePolicy:
        decoded !== undefined && "surfacePolicy" in decoded.state
          ? decoded.state.surfacePolicy
          : null,
      contextVerifier: codecError === null ? "verifyGate4BCheckpoint" : null,
      contextError,
      auxiliaryEvidence,
    },
  };
}

function expectRefusal(name, action) {
  try {
    action();
  } catch (error) {
    return { name, refused: true, error: errorMessage(error) };
  }
  throw new Error(`negative control ${name} was not refused`);
}

function runNegativeControls(teachingCases, caseResults, fixtures) {
  const controls = [];
  controls.push(
    expectRefusal("teaching-json-hash-mutation", () => {
      const mutated = cloneJson(teachingCases);
      mutated[0].label += " shifted";
      assertTeachingCaseHash(mutated);
    }),
  );
  controls.push(
    expectRefusal("named-mutation-no-op", () => {
      const fixture = fixtures.get("corrupt-magic");
      assertNamedMutation(
        "corrupt-magic",
        { ...fixture, bytes: fixture.baseline },
        0,
      );
    }),
  );
  controls.push(
    expectRefusal("published-outcome-flip", () => {
      const actual = {
        ...caseResults.find((record) => record.id === "negative-density").actual,
        codecOutcome: "accepted",
      };
      compareOutcome(
        "negative-density",
        deriveTeachingOutcome(
          teachingCases.find((record) => record.id === "negative-density"),
        ),
        actual,
      );
    }),
  );
  controls.push(
    expectRefusal("context-bypass", () => {
      const actual = {
        ...caseResults.find((record) => record.id === "registered-config-mismatch").actual,
        firstRejectStage: "none",
        contextOutcome: "accepted",
      };
      compareOutcome(
        "registered-config-mismatch",
        deriveTeachingOutcome(
          teachingCases.find((record) => record.id === "registered-config-mismatch"),
        ),
        actual,
      );
    }),
  );
  return controls;
}

export function runCheckpointProductionOracle() {
  const teaching = readTeachingCases();
  const built = buildCaseBytes();
  const results = [];
  for (const record of teaching.cases) {
    const fixture = built.cases.get(record.id);
    if (fixture === undefined) throw new Error(`no production fixture for ${record.id}`);
    const mutation = assertNamedMutation(record.id, fixture, built.activeUnattachedIndex);
    results.push(executeCase(record.id, fixture, built.contextResult, mutation, record));
  }
  if (results.length !== teaching.cases.length) {
    throw new Error(
      `executed ${results.length} checkpoint cases for ${teaching.cases.length} teaching records`,
    );
  }
  const negativeControls = runNegativeControls(teaching.cases, results, built.cases);
  return {
    schemaVersion: 1,
    pass: true,
    teachingCases: {
      count: teaching.cases.length,
      sha256: teaching.caseHash,
      pinnedSha256: CHECKPOINT_TEACHING_CASES_SHA256,
      records: teaching.cases,
    },
    production: {
      node: process.version,
      teachingAsset: {
        path: relative(REPOSITORY_ROOT, TEACHING_ASSET_PATH).replaceAll("\\", "/"),
        sha256: sha256(teaching.source),
      },
      checkpointCodec: {
        path: relative(REPOSITORY_ROOT, CHECKPOINT_SOURCE_PATH).replaceAll("\\", "/"),
        sha256: sha256(readFileSync(CHECKPOINT_SOURCE_PATH)),
        entryPoints: ["decodeCheckpoint", "decodeLKCheckpoint"],
      },
      evidenceContext: {
        path: relative(REPOSITORY_ROOT, CONTEXT_SOURCE_PATH).replaceAll("\\", "/"),
        sha256: sha256(readFileSync(CONTEXT_SOURCE_PATH)),
        entryPoint: "verifyGate4BCheckpoint",
      },
      fixture: {
        kind: "deterministic synthetic GG v1 and LK v2 encoded by production writers",
        lkMagic: CHECKPOINT_MAGIC,
        registeredSurfacePolicy: "aggregate-hv-g1h1-v6",
        registeredFarField: "dirichlet",
      },
    },
    cases: results,
    negativeControls,
    limits: [
      "Uses small deterministic synthetic checkpoints, not a previously published gate artifact.",
      "Executes the production codecs and Gate 4b metadata/field/re-encode/solver-reconstruction verifier; it does not authenticate Git provenance, process exits, or morphology summaries.",
      "Classifies the first codec stage from a fail-closed set of known production error messages; an unrecognized refusal aborts the oracle.",
      "Covers the ten teaching mutations, not every checkpoint validation branch in the production test suite.",
    ],
  };
}

if (process.argv[1] !== undefined && resolve(process.argv[1]) === TOOL_PATH) {
  try {
    process.stdout.write(`${JSON.stringify(runCheckpointProductionOracle(), null, 2)}\n`);
  } catch (error) {
    process.stderr.write(`${errorMessage(error)}\n`);
    process.exitCode = 1;
  }
}
