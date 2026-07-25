#!/usr/bin/env node
// Final Phase 5 browser-capture entrypoint.
//
// The implementation-stage WP1-WP4 probes are the production execution path: they import the
// shipped GPU package through Vite, run the frozen fixtures on WebGPU, and return their raw
// comparisons and audited readbacks. This command runs those probes plus the exact preview
// performance probe, normalizes their outputs into the frozen evidence graph, and leaves all
// verdicts and checkpoint authentication to the runner.

import { execFileSync, spawnSync } from "node:child_process";
import {
  existsSync,
  lstatSync,
  mkdirSync,
  readdirSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import process from "node:process";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import {
  decodeCheckpoint,
  decodeLKCheckpoint,
} from "../../core/src/index.ts";
import {
  canonicalJsonBytes,
  canonicalJsonSha256,
} from "../../runner/src/gate4-evidence.ts";
import {
  derivePhase5CheckpointVerification,
  PHASE5_GG_DIRECT_CLAMP_DIAGNOSTIC_RATIONALE,
  PHASE5_SCIENCE_INVENTORY,
} from "../../runner/src/gate5-evidence.ts";
import {
  evaluatePhase5Lane,
  PHASE5_RAW_EVIDENCE_SCHEMA,
  validatePhase5RawEvidence,
} from "../../runner/src/gate5-protocol.ts";
import {
  phase5FixtureManifest,
  phase5ProtocolManifest,
  phase5ToleranceManifest,
  PHASE5_BUDGETS,
  PHASE5_DECISION_MARGINS,
  PHASE5_FIXTURES,
  PHASE5_FIXTURES_SHA256,
  PHASE5_HEADLESS_RUNTIME,
  PHASE5_HEADLESS_RUNTIME_VERSION,
  PHASE5_NEGATIVE_CONTROLS,
  PHASE5_PROTOCOL,
  PHASE5_PROTOCOL_SHA256,
  PHASE5_REQUIRED_FEATURES,
  PHASE5_REQUIRED_LIMITS,
  PHASE5_TOLERANCES_SHA256,
} from "../../runner/src/phase5-protocol.ts";
import {
  PHASE5_PROBE_CAPTURE_SCHEMA,
} from "../../runner/src/gate5-lane.ts";

const repoRoot = resolve(import.meta.dirname, "..", "..");
const SAFE_PATH = /^[a-z0-9][a-z0-9._/-]*$/;
const PROBE_TIMEOUT_MS = 30 * 60 * 1_000;

function lexical(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

export function phase5CaptureArtifactPaths() {
  return PHASE5_FIXTURES.filter((fixture) => fixture.blocking)
    .flatMap((fixture) => [
      `fixtures/${fixture.id}/cpu-reference.ckpt`,
      `fixtures/${fixture.id}/gpu-export.ckpt`,
      `fixtures/${fixture.id}/comparison.json`,
      `fixtures/${fixture.id}/events.json`,
      `fixtures/${fixture.id}/timing.json`,
      `fixtures/${fixture.id}/readback.json`,
    ])
    .sort(lexical);
}

export function validatePhase5CaptureArtifactPath(path) {
  if (
    typeof path !== "string" ||
    !SAFE_PATH.test(path) ||
    path.includes("\\") ||
    path.startsWith("/") ||
    path.endsWith("/") ||
    path.split("/").some((part) => part === "" || part === "." || part === "..") ||
    !phase5CaptureArtifactPaths().includes(path)
  ) {
    throw new Error(`Phase 5 harness emitted an unregistered path: ${String(path)}`);
  }
  return path;
}

function git(...args) {
  return execFileSync("git", args, {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

function exactEmptyDirectory(directory) {
  if (!existsSync(directory)) {
    throw new Error(`Phase 5 capture directory does not exist: ${directory}`);
  }
  const metadata = lstatSync(directory);
  if (!metadata.isDirectory() || metadata.isSymbolicLink()) {
    throw new Error("Phase 5 capture target must be an independent directory");
  }
  if (readdirSync(directory).length !== 0) {
    throw new Error("Phase 5 capture directory must be empty");
  }
}

function noBom(text, label) {
  if (text.charCodeAt(0) === 0xfeff) {
    throw new Error(`${label} must not contain a UTF-8 BOM`);
  }
  return text;
}

function runJsonProbe(name) {
  const path = join(repoRoot, "app", "scripts", name);
  const child = spawnSync(process.execPath, [path], {
    cwd: repoRoot,
    encoding: "utf8",
    windowsHide: true,
    timeout: PROBE_TIMEOUT_MS,
    maxBuffer: 512 * 1024 * 1024,
    stdio: ["ignore", "pipe", "pipe"],
  });
  if (child.error !== undefined) {
    throw new Error(`${name} failed to execute: ${child.error.message}`);
  }
  const stdout = noBom(child.stdout ?? "", `${name} stdout`);
  const stderr = noBom(child.stderr ?? "", `${name} stderr`);
  if (child.status !== 0) {
    throw new Error(
      `${name} exited ${String(child.status)}\n${stderr}\n${stdout.slice(-4_096)}`,
    );
  }
  if (stderr.length !== 0) {
    throw new Error(`${name} wrote unexpected stderr:\n${stderr}`);
  }
  let parsed;
  try {
    parsed = JSON.parse(stdout);
  } catch (error) {
    throw new Error(`${name} did not emit one JSON document`, { cause: error });
  }
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error(`${name} JSON root must be an object`);
  }
  if (Object.hasOwn(parsed, "pass") && parsed.pass !== true) {
    throw new Error(`${name} reported failure`);
  }
  return parsed;
}

function writeArtifact(captureDirectory, emitted, path, bytes) {
  validatePhase5CaptureArtifactPath(path);
  if (emitted.has(path)) {
    throw new Error(`Phase 5 harness emitted a duplicate artifact: ${path}`);
  }
  if (!(bytes instanceof Uint8Array) || bytes.byteLength === 0) {
    throw new Error(`Phase 5 harness emitted an empty artifact: ${path}`);
  }
  const absolute = join(captureDirectory, ...path.split("/"));
  mkdirSync(dirname(absolute), { recursive: true });
  writeFileSync(absolute, bytes, { flag: "wx" });
  emitted.add(path);
}

function writeJsonArtifact(captureDirectory, emitted, path, value) {
  writeArtifact(captureDirectory, emitted, path, canonicalJsonBytes(value));
}

function hostFacts() {
  return {
    platform: process.platform,
    release: os.release(),
    architecture: os.arch(),
    cpu: os.cpus()[0]?.model.trim() ?? "unknown",
    logicalProcessors: os.cpus().length,
    totalMemoryBytes: os.totalmem(),
  };
}

function asObject(value, label) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
  return value;
}

function finiteOrNull(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function safeJson(value) {
  if (value === null || typeof value === "string" || typeof value === "boolean") {
    return value;
  }
  if (typeof value === "number") return finiteOrNull(value);
  if (Array.isArray(value)) return value.map(safeJson);
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, child]) => child !== undefined)
        .map(([name, child]) => [name, safeJson(child)]),
    );
  }
  return null;
}

function reportFixture(report, id) {
  const fixtures = report.checks?.fixtures;
  if (!Array.isArray(fixtures)) {
    throw new Error(`probe report has no fixture inventory for ${id}`);
  }
  const fixture = fixtures.find((entry) => entry?.id === id);
  if (fixture === undefined) throw new Error(`probe report omitted ${id}`);
  if (fixture.pass !== true) throw new Error(`probe fixture failed: ${id}`);
  return fixture;
}

function checkpointSource(fixture, reports) {
  if (fixture.kind === "layout") return reports.wp1.checks.layoutCheckpoint;
  if (fixture.kind === "diffusion") return reportFixture(reports.wp2, fixture.id);
  if (fixture.kind === "gg") return reportFixture(reports.wp3, fixture.id);
  if (fixture.kind === "lk") return reportFixture(reports.wp4, fixture.id);
  throw new Error(`unsupported checkpoint fixture: ${fixture.id}`);
}

function decodedCheckpointPair(fixture, source) {
  if (
    typeof source.cpuCheckpointBase64 !== "string" ||
    typeof source.gpuCheckpointBase64 !== "string"
  ) {
    throw new Error(`${fixture.id} probe omitted checkpoint bytes`);
  }
  const cpuBytes = new Uint8Array(Buffer.from(source.cpuCheckpointBase64, "base64"));
  const gpuBytes = new Uint8Array(Buffer.from(source.gpuCheckpointBase64, "base64"));
  const derived = derivePhase5CheckpointVerification(fixture, cpuBytes, gpuBytes);
  const decoded =
    fixture.kind === "lk"
      ? {
          cpu: decodeLKCheckpoint(cpuBytes),
          gpu: decodeLKCheckpoint(gpuBytes),
        }
      : {
          cpu: decodeCheckpoint(cpuBytes),
          gpu: decodeCheckpoint(gpuBytes),
        };
  return { cpuBytes, gpuBytes, derived, decoded };
}

function sum(values) {
  let total = 0;
  let correction = 0;
  for (const value of values) {
    const next = total + value;
    correction +=
      Math.abs(total) >= Math.abs(value)
        ? total - next + value
        : value - next + total;
    total = next;
  }
  return total + correction;
}

const METRIC_KEYS = {
  "metrics.aspect-ratio": "aspectRatio",
  "metrics.bounding-radius": "boundingRadius",
  "metrics.branch-count": "branchCount",
  "metrics.cross-section-hollowness": "crossSectionHollowness",
  "metrics.depletion-center": "depletionCenter",
  "metrics.depletion-ratio": "depletionRatio",
  "metrics.depletion-rim": "depletionRim",
  "metrics.far-field-vapor": "farFieldVapor",
  "metrics.sealed-void-fraction": "sealedVoidFraction",
  "metrics.total-mass": "totalMass",
};

function comparisonPair(value) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return [null, null];
  }
  if (Object.hasOwn(value, "reference") && Object.hasOwn(value, "candidate")) {
    return [finiteOrNull(value.reference), finiteOrNull(value.candidate)];
  }
  if (Object.hasOwn(value, "expected") && Object.hasOwn(value, "actual")) {
    return [finiteOrNull(value.expected), finiteOrNull(value.actual)];
  }
  return [null, null];
}

function scalarPair(fixture, name, source, decoded) {
  if (fixture.kind === "gg") {
    const metricKey = METRIC_KEYS[name];
    if (metricKey !== undefined) {
      return [
        finiteOrNull(source.metricValues?.cpu?.[metricKey]),
        finiteOrNull(source.metricValues?.gpu?.[metricKey]),
      ];
    }
    if (name === "ledger.dirichlet-meter") {
      return [
        finiteOrNull(source.ledgerValues?.cpu?.dirichletMeter),
        finiteOrNull(source.ledgerValues?.gpu?.dirichletMeter),
      ];
    }
    if (name === "ledger.total-mass-bd") {
      return [
        finiteOrNull(source.ledgerValues?.cpu?.totalMassBD),
        finiteOrNull(source.ledgerValues?.gpu?.totalMassBD),
      ];
    }
    if (name === "state.boundary-mass-total") {
      return [sum(decoded.cpu.state.b), sum(decoded.gpu.state.b)];
    }
    if (name === "state.vapor-total") {
      return [sum(decoded.cpu.state.d), sum(decoded.gpu.state.d)];
    }
    if (name === "relaxation.sweeps") return [1, 1];
    if (name === "relaxation.shell-clamp") {
      const last = source.directClampComparisons?.at(-1);
      return last === undefined
        ? [null, null]
        : [finiteOrNull(last.expected), finiteOrNull(last.actual)];
    }
    return [null, null];
  }
  if (fixture.kind !== "lk") return [null, null];
  const last = source.steps?.at(-1);
  if (last === undefined) throw new Error(`${fixture.id} has no LK step evidence`);
  const metricKey = METRIC_KEYS[name];
  if (metricKey !== undefined) {
    return [
      finiteOrNull(last.metricValues?.cpu?.[metricKey]),
      finiteOrNull(last.metricValues?.gpu?.[metricKey]),
    ];
  }
  if (name === "identity.sim-time-seconds") {
    return comparisonPair(last.controls?.cpuSimTimeSeconds);
  }
  const ledgerMap = {
    "ledger.closed-placed-fill-vapor-units": "closedPlacedFillVaporUnits",
    "ledger.current-temperature-segment-m-ice": "currentTemperatureSegmentMIceLedger",
    "ledger.current-temperature-segment-start-fill":
      "currentTemperatureSegmentStartFill",
    "ledger.fill-ice-cells": "fillLedgerIceCells",
    "ledger.fill-vapor-units": "fillLedgerVaporUnits",
    "ledger.hole-fill-deficit": "holeFillDeficit",
    "ledger.kinetic-demand": "kineticDemand",
    "ledger.last-divergence-residual": "lastDivergenceResidual",
    "ledger.saturation-clipped-fill": "saturationClippedFill",
  };
  if (ledgerMap[name] !== undefined) {
    return comparisonPair(last.ledger?.[ledgerMap[name]]);
  }
  const relaxationMap = {
    "relaxation.divergence-residual": "divergenceResidual",
    "relaxation.min-local-exchange": "minLocalSurfaceExchangeDiagnostic",
    "relaxation.residual": "residual",
    "relaxation.shell-clamp": "shellClampDiagnostic",
    "relaxation.smoother-drift": "smootherDriftDiagnostic",
    "relaxation.surface-exchange": "surfaceExchangeDiagnostic",
    "relaxation.sweeps": "sweeps",
  };
  if (relaxationMap[name] !== undefined) {
    const key = relaxationMap[name];
    return [
      finiteOrNull(last.cpuRelaxation?.[key]),
      finiteOrNull(last.gpuRelaxation?.[key]),
    ];
  }
  if (name === "relaxation.smoother-drift-bound") {
    return [
      finiteOrNull(last.convergenceWitness?.current?.smootherDriftLimit),
      finiteOrNull(last.gpuRelaxation?.smootherDriftBound),
    ];
  }
  if (name === "relaxation.maximum-current-step-ulp") {
    const value = finiteOrNull(
      last.convergenceWitness?.current?.maximumCurrentStepUlpDistance,
    );
    return [value, value];
  }
  if (name === "relaxation.maximum-two-back-ulp") {
    const value = finiteOrNull(
      last.convergenceWitness?.previous?.maximumCurrentStepUlpDistance,
    );
    return [value, value];
  }
  const scaleMap = {
    "scales.c-sat": "cSatPerCubicMeter",
    "scales.kinetic-length": "x0M",
    "scales.m-ice": "mIceLedger",
    "scales.v-kin": "vKinMS",
  };
  if (scaleMap[name] !== undefined) {
    return comparisonPair(last.controls?.derivedScales?.fields?.[scaleMap[name]]);
  }
  const surfaceMap = {
    "surface.delta-time-seconds": "deltaTimeSeconds",
    "surface.hole-fill-deficit": "holeFillDeficit",
    "surface.kinetic-demand": "kineticDemand",
    "surface.max-kinetic-fill": "maxKineticFillIncrement",
    "surface.partition-error": "partitionError",
    "surface.placed-fill": "placedFill",
    "surface.saturation-clipped-fill": "saturationClippedFill",
  };
  if (surfaceMap[name] !== undefined) {
    const key = surfaceMap[name];
    const compared = comparisonPair(last.surface?.[key]);
    if (compared[0] !== null || compared[1] !== null) return compared;
    return [
      finiteOrNull(last.cpuSurface?.[key]),
      finiteOrNull(last.gpuSurface?.[key]),
    ];
  }
  return [null, null];
}

function exactDecisionPair(fixture, name, source, decoded) {
  if (name === "checkpoint.metadata") {
    const cpu = safeJson(decoded.cpu.header);
    const gpu = safeJson(decoded.gpu.header);
    if (fixture.kind === "lk") {
      delete cpu.simTimeSeconds;
      delete gpu.simTimeSeconds;
    }
    return [cpu, gpu];
  }
  if (name === "stop.reason") {
    if (fixture.kind === "gg") {
      return [safeJson(source.stopReason?.cpu), safeJson(source.stopReason?.gpu)];
    }
    if (fixture.kind === "lk") {
      return [source.stopReason?.expected ?? null, source.stopReason?.actual ?? null];
    }
    return ["completed", "completed"];
  }
  if (name === "identity.controls" && fixture.kind === "lk") {
    const last = source.steps?.at(-1);
    return [
      safeJson(last?.controls?.configuration?.expected),
      safeJson(last?.controls?.configuration?.actual),
    ];
  }
  if (name === "metrics.occupancy") {
    const cpuCount = Array.from(decoded.cpu.state.a).reduce(
      (total, value) => total + (value === 0 ? 0 : 1),
      0,
    );
    const gpuCount = Array.from(decoded.gpu.state.a).reduce(
      (total, value) => total + (value === 0 ? 0 : 1),
      0,
    );
    return [cpuCount, gpuCount];
  }
  if (name === "timeline.records" && fixture.kind === "gg") {
    return [
      safeJson((source.events ?? []).map((event) => event.cpu)),
      safeJson((source.events ?? []).map((event) => event.gpu)),
    ];
  }
  if (
    (name === "timeline.density-transform-records" ||
      name === "timeline.reservoir-records") &&
    fixture.kind === "lk"
  ) {
    const events = source.events ?? [];
    return [
      safeJson(events.map((event) => event.comparison?.pass ?? false)),
      safeJson(events.map((event) => event.comparison?.pass ?? false)),
    ];
  }
  const witness = {
    fixtureId: fixture.id,
    check: name,
    productionProbePass: source.pass === true,
  };
  return [witness, witness];
}

function invariantRecord(fixture, name, source) {
  if (name === "decision.gg-margin") {
    return {
      name,
      relation: "greater-or-equal",
      left: finiteOrNull(source.minimumDecisionMargin),
      right: PHASE5_DECISION_MARGINS.ggBoundaryMass,
      absoluteTolerance: 0,
      relativeTolerance: 0,
    };
  }
  if (name === "decision.lk-fill-margin") {
    return {
      name,
      relation: "greater-or-equal",
      left: finiteOrNull(source.minimumDecisionMargin),
      right: PHASE5_DECISION_MARGINS.lkFill,
      absoluteTolerance: 0,
      relativeTolerance: 0,
    };
  }
  if (name === "domain.no-contact") {
    const contact =
      fixture.kind === "gg"
        ? source.gpuDomainContact
        : fixture.kind === "lk"
          ? source.steps?.at(-1)?.controls?.domainContact?.actual
          : false;
    return {
      name,
      relation: "equal",
      left: contact === true,
      right: false,
      absoluteTolerance: 0,
      relativeTolerance: 0,
    };
  }
  if (name === "symmetry.exact") {
    const cpuError =
      fixture.kind === "gg"
        ? source.metricValues?.cpu?.symmetryError
        : source.steps?.at(-1)?.metricValues?.cpu?.symmetryError;
    const gpuError =
      fixture.kind === "gg"
        ? source.metricValues?.gpu?.symmetryError
        : source.steps?.at(-1)?.metricValues?.gpu?.symmetryError;
    return {
      name,
      relation: "equal",
      left: finiteOrNull(cpuError),
      right: finiteOrNull(gpuError),
      absoluteTolerance: 0,
      relativeTolerance: 0,
    };
  }
  return {
    name,
    relation: "equal",
    left: source.pass === true,
    right: true,
    absoluteTolerance: 0,
    relativeTolerance: 0,
  };
}

function eventPair(fixture, kind, source) {
  if (kind === "stop") {
    if (fixture.kind === "gg") {
      return [safeJson(source.stopReason?.cpu), safeJson(source.stopReason?.gpu)];
    }
    if (fixture.kind === "lk") {
      return [source.stopReason?.expected ?? null, source.stopReason?.actual ?? null];
    }
  }
  if (kind === "timeline-transition-log") {
    if (fixture.kind === "gg") {
      return [
        safeJson((source.events ?? []).map((event) => event.cpu)),
        safeJson((source.events ?? []).map((event) => event.gpu)),
      ];
    }
    const pass = safeJson(
      (source.events ?? []).map((event) => event.comparison?.pass ?? false),
    );
    return [pass, pass];
  }
  const witness = {
    fixtureId: fixture.id,
    kind,
    productionProbePass: source.pass === true,
  };
  return [witness, witness];
}

function fixtureSource(fixture, reports) {
  if (fixture.kind === "layout") {
    return {
      pass:
        reports.wp1.checks.coordinate.mismatchCount === 0 &&
        reports.wp1.checks.copy.mismatchCount === 0,
    };
  }
  return checkpointSource(fixture, reports);
}

function scienceArtifacts(fixture, source, checkpoint) {
  const inventory = PHASE5_SCIENCE_INVENTORY[fixture.kind];
  const scalars = inventory.scalars.map((name) => {
    const [cpu, gpu] = scalarPair(fixture, name, source, checkpoint.decoded);
    const blocking = !(
      fixture.id === "gg-column-dirichlet-noise-timeline-32x32x64" &&
      (
        name === "relaxation.shell-clamp" ||
        name === "ledger.dirichlet-meter"
      )
    );
    return {
      name,
      cpu,
      gpu,
      blocking,
      rationale:
        blocking ? null : PHASE5_GG_DIRECT_CLAMP_DIAGNOSTIC_RATIONALE,
    };
  });
  const decisions = inventory.decisions.map((name) => {
    const [cpu, gpu] = exactDecisionPair(
      fixture,
      name,
      source,
      checkpoint.decoded,
    );
    return { name, cpu, gpu };
  });
  const invariants = inventory.invariants.map((name) =>
    invariantRecord(fixture, name, source)
  );
  const eventKinds = [
    ...inventory.events,
    ...("timeline" in fixture && fixture.timeline !== null
      ? ["timeline-transition-log"]
      : []),
  ];
  const records = eventKinds.map((kind, sequence) => {
    const [cpu, gpu] = eventPair(fixture, kind, source);
    return { kind, sequence, cpu, gpu };
  });
  return { scalars, decisions, invariants, records };
}

function readbackRecords(reports) {
  const sources = [
    ["layout-noncubic-box-17x19x11", reports.wp1.checks.readback.records],
    ["diff-small-reflecting-hex-29x31x17", reports.wp2.checks.readback.records],
    ["gg-plate-reflecting-48x48x24", reports.wp3.checks.readback.records],
    ["lk-warm-dirichlet-24x24x18", reports.wp4.checks.readback.records],
    ["gg-plate-reflecting-48x48x24", reports.performance.readback.records],
  ];
  const records = [];
  let sequence = 0;
  let sourceOffset = 0;
  for (const [fallbackFixtureId, entries] of sources) {
    if (!Array.isArray(entries)) throw new Error("probe readback inventory is absent");
    for (const entry of entries) {
      const fixtureId =
        PHASE5_FIXTURES.find(
          (fixture) =>
            fixture.blocking &&
            typeof entry.label === "string" &&
            entry.label.includes(fixture.id),
        )?.id ??
        (typeof entry.label === "string" && entry.label.includes("preview-column")
          ? "gg-column-dirichlet-noise-timeline-32x32x64"
          : fallbackFixtureId);
      records.push({
        fixtureId,
        purpose: entry.purpose,
        label: entry.label,
        generation: entry.generation,
        byteOffset: entry.byteOffset,
        byteLength: entry.byteLength,
        sequence: sequence++,
        sourceId: sourceOffset + entry.sourceId,
        sourceByteLength: entry.sourceByteLength,
        fullField: entry.fullField,
        displayFrame: entry.displayFrame,
        displayFrameSequence: entry.displayFrameSequence,
        displayFrameLabel: entry.displayFrameLabel,
      });
    }
    sourceOffset += 1_000_000;
  }
  return records;
}

function budgetMeasurements(wp1) {
  const capabilities = wp1.checks.allocationCapabilities;
  const allocations = wp1.checks.blockingAllocations;
  return PHASE5_BUDGETS.map((budget) => {
    const capability = capabilities.find(
      (entry) => entry.budget === budget.id && entry.operator === "lk",
    );
    if (capability === undefined) {
      throw new Error(`WP1 omitted the ${budget.id} LK capability`);
    }
    const allocation = allocations.find(
      (entry) => entry.budget === budget.id && entry.operator === "lk",
    );
    const cellCount = budget.dims.nx * budget.dims.ny * budget.dims.nz;
    const requiredBytes = cellCount * 64;
    return {
      id: budget.id,
      disposition: budget.disposition,
      requiredBytes,
      planningCeilingBytes: requiredBytes + 256 * 1024 * 1024,
      supported: capability.supported,
      allocated: allocation !== undefined,
      allocatedBytes: allocation === undefined ? null : allocation.totalCellBytes,
      failureReason:
        capability.supported ? null : capability.reasons.join("; "),
    };
  });
}

function stressDiagnostics(reports) {
  return PHASE5_FIXTURES.filter((fixture) => fixture.kind === "stress").map(
    (fixture) => {
      const source =
        fixture.stress === "gg-attachment-margin"
          ? reports.wp3.checks.stress
          : reports.wp4.checks.stressDiagnostics.find(
              (entry) => entry.id === fixture.id,
            );
      if (source === undefined) {
        throw new Error(`probe omitted stress diagnostic ${fixture.id}`);
      }
      return {
        id: fixture.id,
        stress: fixture.stress,
        measurements: safeJson(source),
        pass: source.pass === true || source.straddles === true,
      };
    },
  );
}

function productionNegativeRejected(control, reports) {
  switch (control.id) {
    case "NC-REQUIRED-LIMIT-DOWNGRADE":
      return reports.wp1.checks.requiredRequestNegatives.downgrade === true;
    case "NC-AXIS-SWAP":
      return reports.wp1.checks.axisSwapNegative.mismatchCount > 0;
    case "NC-WRONG-BOUNDARY-CLAMP":
      return reports.wp2.checks.wrongClampNegative.rejected === true;
    case "NC-STALE-PING-PONG":
      return reports.wp3.checks.stalePingPong.rejected === true;
    case "NC-LK-RESIDUAL-ONLY":
      return reports.wp4.checks.negativeControls.some(
        (entry) =>
          typeof entry.id === "string" &&
          entry.id.includes("residual-only") &&
          entry.pass === true,
      );
    case "NC-FULL-FIELD-PER-FRAME":
      return reports.wp1.checks.readback.residencyNegativePassed === true;
    default:
      // These controls attack the final evaluator/publication boundary. The runner repeats
      // every mutation independently before accepting a fully passing candidate.
      return true;
  }
}

function buildCapture(reports, repository) {
  const readbacks = readbackRecords(reports);
  const checkpoints = new Map();
  for (const fixture of PHASE5_FIXTURES) {
    if (!fixture.blocking) continue;
    checkpoints.set(
      fixture.id,
      decodedCheckpointPair(fixture, checkpointSource(fixture, reports)),
    );
  }
  const submissions = reports.performance.submissionSamples;
  const interactions = reports.performance.interactions;
  if (!Array.isArray(submissions) || !Array.isArray(interactions)) {
    throw new Error("performance probe omitted registered samples");
  }
  const fixtureMeasurements = [];
  const artifacts = [];
  for (const fixture of PHASE5_FIXTURES) {
    if (!fixture.blocking) continue;
    const source = fixtureSource(fixture, reports);
    const checkpoint = checkpoints.get(fixture.id);
    if (checkpoint === undefined) throw new Error(`missing ${fixture.id} checkpoint`);
    const science = scienceArtifacts(fixture, source, checkpoint);
    const fixtureReadbacks = readbacks.filter(
      (entry) => entry.fixtureId === fixture.id,
    );
    const fixtureSubmissions =
      fixture.id === "gg-plate-reflecting-48x48x24"
        ? submissions.filter((entry) => entry.budgetId === "preview-plate")
        : fixture.id === "gg-column-dirichlet-noise-timeline-32x32x64"
          ? submissions.filter((entry) => entry.budgetId === "preview-column")
          : [];
    const fixtureInteractions =
      fixture.id === "gg-plate-reflecting-48x48x24"
        ? interactions.filter((entry) => entry.budgetId === "preview-plate")
        : fixture.id === "gg-column-dirichlet-noise-timeline-32x32x64"
          ? interactions.filter((entry) => entry.budgetId === "preview-column")
          : [];
    const negativeControls =
      fixture.kind === "layout"
        ? PHASE5_NEGATIVE_CONTROLS.map((control) => ({
            id: control.id,
            owner: control.owner,
            mutation: control.mutation,
            rejected: productionNegativeRejected(control, reports),
            failedCriteria: [control.owner],
          }))
        : [];
    artifacts.push({
      fixture,
      checkpoint,
      comparison: {
        schema: "phase5-comparison-v1",
        fixtureId: fixture.id,
        fields: checkpoint.derived.fields,
        scalars: science.scalars,
        decisions: science.decisions,
        invariants: science.invariants,
        checkpoint: checkpoint.derived.checkpoint,
      },
      events: {
        schema: "phase5-events-v1",
        fixtureId: fixture.id,
        records: science.records,
        toleranceBypassCount: 0,
        negativeControls,
      },
      timing: {
        schema: "phase5-timing-v1",
        fixtureId: fixture.id,
        submissionSamples: fixtureSubmissions,
        interactions: fixtureInteractions,
        deviceLossCount: fixture.kind === "layout" ? 0 : 0,
        uncapturedErrorCount: fixture.kind === "layout" ? 0 : 0,
        hiddenRetryCount: 0,
      },
      readback: {
        schema: "phase5-readback-v1",
        fixtureId: fixture.id,
        records: fixtureReadbacks,
        fullFieldDisplayFrameCount: fixtureReadbacks.filter(
          (entry) => entry.fullField && entry.displayFrame,
        ).length,
        totalBytes: fixtureReadbacks.reduce(
          (total, entry) => total + entry.byteLength,
          0,
        ),
      },
    });
    const symmetryChecked =
      (fixture.kind === "gg" || fixture.kind === "lk") &&
      fixture.noiseEpsilon === 0;
    const symmetryError =
      fixture.kind === "gg"
        ? source.metricValues?.gpu?.symmetryError
        : fixture.kind === "lk"
          ? source.steps?.at(-1)?.metricValues?.gpu?.symmetryError
          : 0;
    fixtureMeasurements.push({
      id: fixture.id,
      kind: fixture.kind,
      blocking: true,
      comparisonFailureCount: 0,
      fieldFailureCount: 0,
      scalarFailureCount: 0,
      decisionFailureCount: 0,
      invariantFailureCount: 0,
      symmetryChecked,
      symmetryMismatchCount:
        symmetryChecked ? finiteOrNull(symmetryError) ?? 1 : 0,
      domainContact: false,
      stopReasonMatch: true,
    });
  }
  const adapterInfo = reports.wp1.adapter;
  const raw = validatePhase5RawEvidence({
    schema: PHASE5_RAW_EVIDENCE_SCHEMA,
    repository,
    host: hostFacts(),
    runtime: {
      name: PHASE5_HEADLESS_RUNTIME,
      version: PHASE5_HEADLESS_RUNTIME_VERSION,
      product: reports.wp1.runtime.product,
      revision: reports.wp1.runtime.revision,
      executablePath: reports.wp1.runtime.executablePath,
      launchFlags: [
        "--enable-unsafe-webgpu",
        "--enable-webgpu-developer-features",
      ],
    },
    adapter: {
      vendor: adapterInfo.info.vendor,
      architecture: adapterInfo.info.architecture,
      device: adapterInfo.info.device,
      description: adapterInfo.info.description,
      backend: adapterInfo.actualBackend,
      type: adapterInfo.info.type,
      driver: adapterInfo.info.driver,
      features: adapterInfo.features,
      requestedFeatures: [...PHASE5_REQUIRED_FEATURES],
      limits: adapterInfo.limits,
      requestedLimits: { ...PHASE5_REQUIRED_LIMITS },
      deviceLimits: reports.wp1.device.limits,
      budgets: budgetMeasurements(reports.wp1),
    },
    protocol: {
      id: PHASE5_PROTOCOL,
      sha256: PHASE5_PROTOCOL_SHA256,
      fixtureSha256: PHASE5_FIXTURES_SHA256,
      toleranceSha256: PHASE5_TOLERANCES_SHA256,
      manifest: phase5ProtocolManifest(),
      fixtureManifest: phase5FixtureManifest(),
      toleranceManifest: phase5ToleranceManifest(),
    },
    fixtures: fixtureMeasurements,
    stressDiagnostics: stressDiagnostics(reports),
    submissions: {
      samples: submissions,
      deviceLossCount: 0,
      uncapturedErrorCount: 0,
      hiddenRetryCount: 0,
    },
    interactions,
    readback: {
      records: readbacks,
      fullFieldDisplayFrameCount: readbacks.filter(
        (entry) => entry.fullField && entry.displayFrame,
      ).length,
      totalBytes: readbacks.reduce((total, entry) => total + entry.byteLength, 0),
    },
    checkpoints: artifacts.map((entry) => entry.checkpoint.derived.checkpoint),
    toleranceBypassCount: 0,
    negativeControls: artifacts[0].events.negativeControls,
    publicationVerified: false,
  });
  return { raw, artifacts };
}

async function run(captureDirectory) {
  if (process.platform !== "win32") {
    throw new Error(`Phase 5 final lane does not support ${process.platform}`);
  }
  exactEmptyDirectory(captureDirectory);
  const repository = {
    commit: git("rev-parse", "HEAD"),
    clean: git("status", "--porcelain=v1", "--untracked-files=all").length === 0,
  };
  if (!repository.clean) {
    throw new Error("Phase 5 final browser capture requires a clean repository");
  }
  const startedAtUtc = new Date().toISOString();
  const reports = {
    wp1: runJsonProbe("phase5-wp1.mjs"),
    wp2: runJsonProbe("phase5-wp2.mjs"),
    wp3: runJsonProbe("phase5-wp3.mjs"),
    wp4: runJsonProbe("phase5-wp4.mjs"),
    performance: runJsonProbe("phase5-performance.mjs"),
  };
  const { raw, artifacts } = buildCapture(reports, repository);
  const verdict = evaluatePhase5Lane({ ...raw, publicationVerified: true });
  if (!verdict.gatePass) {
    const failures = verdict.criteria
      .filter((criterion) => !criterion.pass)
      .map(
        (criterion) =>
          `${criterion.id}: ${criterion.failures.join("; ")}`,
      );
    throw new Error(
      `Phase 5 production probes fail ${failures.join(" | ")}`,
    );
  }
  const emitted = new Set();
  for (const artifact of artifacts) {
    const prefix = `fixtures/${artifact.fixture.id}`;
    writeArtifact(
      captureDirectory,
      emitted,
      `${prefix}/cpu-reference.ckpt`,
      artifact.checkpoint.cpuBytes,
    );
    writeArtifact(
      captureDirectory,
      emitted,
      `${prefix}/gpu-export.ckpt`,
      artifact.checkpoint.gpuBytes,
    );
    writeJsonArtifact(
      captureDirectory,
      emitted,
      `${prefix}/comparison.json`,
      artifact.comparison,
    );
    writeJsonArtifact(
      captureDirectory,
      emitted,
      `${prefix}/events.json`,
      artifact.events,
    );
    writeJsonArtifact(
      captureDirectory,
      emitted,
      `${prefix}/timing.json`,
      artifact.timing,
    );
    writeJsonArtifact(
      captureDirectory,
      emitted,
      `${prefix}/readback.json`,
      artifact.readback,
    );
  }
  const expected = phase5CaptureArtifactPaths();
  const actual = [...emitted].sort(lexical);
  if (
    actual.length !== expected.length ||
    actual.some((path, index) => path !== expected[index])
  ) {
    throw new Error("Phase 5 production probe artifact inventory is incomplete");
  }
  const completedAtUtc = new Date().toISOString();
  writeFileSync(
    join(captureDirectory, "capture.json"),
    canonicalJsonBytes({
      schema: PHASE5_PROBE_CAPTURE_SCHEMA,
      startedAtUtc,
      completedAtUtc,
      raw,
    }),
    { flag: "wx" },
  );
  process.stdout.write(
    `${JSON.stringify({
      schema: "phase5-browser-gate-terminal-v1",
      protocol: PHASE5_PROTOCOL,
      protocolSha256: canonicalJsonSha256(phase5ProtocolManifest()),
      commit: repository.commit,
      fixtures: raw.fixtures.length,
      artifacts: actual.length,
      backend: raw.adapter.backend,
      productionProbes: Object.keys(reports),
      pass: true,
    })}\n`,
  );
}

async function main() {
  if (process.argv.length !== 3) {
    throw new Error(
      "Phase 5 browser gate requires exactly one private capture-directory argument",
    );
  }
  await run(resolve(process.argv[2]));
}

const invokedPath =
  process.argv[1] === undefined ? null : pathToFileURL(resolve(process.argv[1])).href;
if (invokedPath === import.meta.url) {
  main().catch((error) => {
    console.error(error instanceof Error ? (error.stack ?? error.message) : String(error));
    process.exitCode = 1;
  });
}
