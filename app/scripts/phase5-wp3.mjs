#!/usr/bin/env node
// Phase 5 WP3 complete G-G cycle conformance. This is implementation-stage evidence, not the
// final Phase 5 gate.

import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { existsSync } from "node:fs";
import os from "node:os";
import process from "node:process";
import { resolve } from "node:path";
import { chromium } from "playwright";
import { createServer as createViteServer } from "vite";
import { canonicalJsonSha256 } from "../../runner/src/gate4-evidence.ts";
import {
  PHASE5_EXPECTED_WINDOWS_BACKEND,
  PHASE5_HEADLESS_RUNTIME,
  PHASE5_HEADLESS_RUNTIME_VERSION,
  PHASE5_PROTOCOL,
  PHASE5_PROTOCOL_SHA256,
  PHASE5_REQUIRED_FEATURES,
  PHASE5_REQUIRED_LIMITS,
  phase5ProtocolManifest,
} from "../../runner/src/phase5-protocol.ts";

const repoRoot = resolve(import.meta.dirname, "..", "..");
const require = createRequire(import.meta.url);
const playwrightPackage = require("playwright/package.json");
const launchFlags = [
  "--enable-unsafe-webgpu",
  "--enable-webgpu-developer-features",
];
const expectedRuntime = {
  playwrightVersion: "1.61.1",
  chromiumRevision: "1228",
  product: "Chrome/149.0.7827.55",
  revision: "@3188f8a607ae7e067593be8aab7f02d2451fec07",
};
const expectedHost = {
  platform: "win32",
  cpu: "AMD Ryzen 7 5700G with Radeon Graphics",
};
const expectedAdapter = {
  vendor: "nvidia",
  architecture: "ampere",
  device: "0x2206",
  description: "NVIDIA GeForce RTX 3080",
  backend: "D3D12",
  type: "discrete GPU",
};

function git(...args) {
  return execFileSync("git", args, {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

async function main() {
  if (process.argv.length !== 2) {
    throw new Error("WP3 G-G conformance accepts no options");
  }
  if (process.platform !== "win32") {
    throw new Error(`WP3 G-G conformance does not support ${process.platform}`);
  }
  const browserPath = chromium.executablePath();
  if (!existsSync(browserPath)) {
    throw new Error(`the frozen Chromium executable is absent: ${browserPath}`);
  }
  const vite = await createViteServer({
    root: repoRoot,
    appType: "custom",
    logLevel: "error",
    server: {
      host: "127.0.0.1",
      port: 0,
      strictPort: false,
      fs: { allow: [repoRoot] },
    },
    plugins: [{
      name: "vcc-phase5-wp3-page",
      configureServer(viteServer) {
        viteServer.middlewares.use((request, response, next) => {
          if (request.url?.split("?")[0] !== "/phase5-wp3") {
            next();
            return;
          }
          response.writeHead(200, {
            "content-type": "text/html; charset=utf-8",
          });
          response.end("<!doctype html><title>VCC Phase 5 WP3 G-G cycles</title>");
        });
      },
    }],
  });
  await vite.listen();
  const address = vite.httpServer?.address();
  if (address === null || address === undefined || typeof address === "string") {
    throw new Error("WP3 Vite server did not receive an IPv4 port");
  }
  const origin = `http://127.0.0.1:${address.port}`;
  let browser = null;
  try {
    browser = await chromium.launch({
      executablePath: browserPath,
      headless: true,
      args: launchFlags,
    });
    const page = await browser.newPage();
    await page.goto(`${origin}/phase5-wp3`, { waitUntil: "load" });
    const deviceResult = await page.evaluate(
      async (input) => {
        if (!isSecureContext) throw new Error("WP3 requires a secure context");
        if (navigator.gpu === undefined) throw new Error("navigator.gpu is unavailable");
        const [core, cpu, production, protocol] = await Promise.all([
          import(input.coreModuleUrl),
          import(input.cpuModuleUrl),
          import(input.productionModuleUrl),
          import(input.protocolModuleUrl),
        ]);
        const adapter = await navigator.gpu.requestAdapter({
          powerPreference: "high-performance",
        });
        if (adapter === null) throw new Error("WebGPU returned no adapter");
        const requirements = {
          requiredFeatures: input.requiredFeatures,
          requiredLimits: input.requiredLimits,
        };
        const device = await production.requestCheckedGpuDevice(
          adapter,
          requirements,
          requirements,
          "vcc-phase5-wp3-device",
        );
        const uncapturedErrors = [];
        device.addEventListener("uncapturederror", (event) => {
          uncapturedErrors.push(event.error.message);
        });
        const submissions = new production.GpuSubmissionController(device);
        submissions.acknowledgeEdit(1);
        const readbackAudit = new production.GpuReadbackAudit();

        function cloneParams(name, phi = null) {
          const source = core.GG_PRESETS[name];
          return {
            rho: source.rho,
            phi: phi ?? source.phi,
            kappa: new Float64Array(source.kappa),
            mu: new Float64Array(source.mu),
            ggThreshBeta: new Float64Array(source.ggThreshBeta),
          };
        }

        function makeOracle(fixture, farField = fixture.farField) {
          return new cpu.GGSolver({
            dims: fixture.dims,
            params: cloneParams(fixture.preset, fixture.phi),
            rngSeed: fixture.rngSeed,
            noiseEpsilon: fixture.noiseEpsilon,
            domain: fixture.domain,
            farField,
            seedRadius: fixture.seedRadius,
            seedThickness: fixture.seedThickness,
          });
        }

        function topologyFor(solver, includeBoundary) {
          const topology = new Uint32Array(solver.a.length);
          for (const index of solver.farFieldCells) {
            topology[index] |= production.GPU_TOPOLOGY_FAR_FIELD;
          }
          if (includeBoundary) {
            for (const index of solver.boundaryCells()) {
              topology[index] |= production.GPU_TOPOLOGY_BOUNDARY;
            }
          }
          return topology;
        }

        function makeGpuInput(solver) {
          return {
            initialVapor: Float32Array.from(solver.d, Math.fround),
            initialBoundaryMass: Float32Array.from(solver.b, Math.fround),
            occupancy: Uint32Array.from(solver.a),
            wall: Uint32Array.from(solver.wall),
            topology: topologyFor(solver, false),
            initialBoundaryIndices: Uint32Array.from(solver.boundaryCells()),
            params: solver.params,
            rngSeed: solver.rngSeed,
            noiseEpsilon: solver.noiseEpsilon,
            tick: solver.tick,
            farField: solver.farField,
            domain: solver.domain,
            center: solver.center,
          };
        }

        async function readBuffer(buffer, label, byteLength = buffer.size) {
          return production.readGpuBuffer(
            device,
            buffer,
            {
              purpose: "test",
              label,
              generation: 1,
              byteOffset: 0,
              byteLength,
            },
            readbackAudit,
          );
        }

        function compareArrays(reference, candidate, tolerance) {
          if (reference.length !== candidate.length) {
            throw new Error("WP3 comparison length mismatch");
          }
          let maxAbs = 0;
          let squareSum = 0;
          let maxRelative = 0;
          let relativeComparedCount = 0;
          for (let index = 0; index < reference.length; index++) {
            const expected = reference[index];
            const actual = candidate[index];
            if (!Number.isFinite(expected) || !Number.isFinite(actual)) {
              throw new Error(`WP3 comparison requires finite values at ${index}`);
            }
            const difference = Math.abs(actual - expected);
            maxAbs = Math.max(maxAbs, difference);
            squareSum += difference * difference;
            if (Math.abs(expected) >= tolerance.relativeDenominatorFloor) {
              maxRelative = Math.max(
                maxRelative,
                difference / Math.abs(expected),
              );
              relativeComparedCount++;
            }
          }
          const comparison = {
            maxAbs,
            rms: Math.sqrt(squareSum / reference.length),
            maxRelative,
            relativeComparedCount,
            length: reference.length,
          };
          return {
            ...comparison,
            pass:
              maxAbs <= tolerance.maxAbs &&
              comparison.rms <= tolerance.rms &&
              maxRelative <= tolerance.maxRelative,
          };
        }

        function scalarComparison(expected, actual) {
          const difference = Math.abs(actual - expected);
          const limit =
            protocol.PHASE5_SCALAR_TOLERANCES.maxAbs +
            protocol.PHASE5_SCALAR_TOLERANCES.maxRelative * Math.abs(expected);
          return {
            expected,
            actual,
            difference,
            limit,
            pass: Number.isFinite(actual) && difference <= limit,
          };
        }

        function base64(bytes) {
          let binary = "";
          const chunkSize = 0x8000;
          for (let offset = 0; offset < bytes.length; offset += chunkSize) {
            binary += String.fromCharCode(
              ...bytes.subarray(offset, offset + chunkSize),
            );
          }
          return btoa(binary);
        }

        function exactArrayMismatch(reference, candidate) {
          if (reference.length !== candidate.length) return Infinity;
          let mismatch = 0;
          for (let index = 0; index < reference.length; index++) {
            if (reference[index] !== candidate[index]) mismatch++;
          }
          return mismatch;
        }

        function minimumDecisionMargin(solver) {
          const params = solver.params;
          let minimum = Infinity;
          for (const index of solver.boundaryCells()) {
            const [rawNT, rawNZ] = solver.neighborCounts(index);
            if (rawNT >= 4 && rawNZ >= 1) continue;
            const slot = core.paramSlot(Math.min(rawNT, 3), rawNZ > 0 ? 1 : 0);
            const postFreeze =
              solver.b[index] + (1 - params.kappa[slot]) * solver.d[index];
            minimum = Math.min(
              minimum,
              Math.abs(postFreeze - params.ggThreshBeta[slot]),
            );
          }
          return minimum;
        }

        function expectedRenderFlags(solver, startBoundary) {
          const result = new Uint32Array(solver.a.length);
          const params = solver.params;
          for (const index of startBoundary) {
            const [rawNT, rawNZ] = solver.neighborCounts(index);
            const slot = core.paramSlot(
              Math.min(rawNT, 3),
              Math.min(rawNZ, 1),
            );
            const postFreeze =
              solver.b[index] + (1 - params.kappa[slot]) * solver.d[index];
            const holeFill = rawNT >= 4 && rawNZ >= 1;
            const attach =
              holeFill || postFreeze >= params.ggThreshBeta[slot];
            let packed =
              production.GPU_GG_RENDER_BOUNDARY |
              (rawNT << production.GPU_GG_RENDER_NT_SHIFT) |
              (rawNZ << production.GPU_GG_RENDER_NZ_SHIFT);
            if (attach) {
              packed |=
                production.GPU_GG_RENDER_ATTACH_DECISION |
                production.GPU_GG_RENDER_ATTACHED_NOW;
            }
            if (holeFill) packed |= production.GPU_GG_RENDER_HOLE_FILL;
            result[index] = packed;
          }
          return result;
        }

        function farFieldMean(occupancy, vapor, topology) {
          let sum = 0;
          let compensation = 0;
          let count = 0;
          for (let index = 0; index < occupancy.length; index++) {
            if (
              (topology[index] & production.GPU_TOPOLOGY_FAR_FIELD) === 0 ||
              occupancy[index] !== 0
            ) {
              continue;
            }
            const value = vapor[index];
            const next = sum + value;
            if (Math.abs(sum) >= Math.abs(value)) {
              compensation += sum - next + value;
            } else {
              compensation += value - next + sum;
            }
            sum = next;
            count++;
          }
          return count === 0 ? Number.NaN : (sum + compensation) / count;
        }

        function metricComparison(cpuMetrics, gpuMetrics) {
          const exactNames = [
            "tick",
            "attachedCount",
            "symmetryError",
            "aspectRatio",
            "crossSectionHollowness",
            "sealedVoidFraction",
            "branchCount",
            "boundingRadius",
            "domainContact",
          ];
          const fieldNames = [
            "farFieldVapor",
            "depletionCenter",
            "depletionRim",
            "depletionRatio",
          ];
          const exact = Object.fromEntries(
            exactNames.map((name) => [
              name,
              Object.is(cpuMetrics[name], gpuMetrics[name]),
            ]),
          );
          const field = Object.fromEntries(
            fieldNames.map((name) => {
              const expected = cpuMetrics[name];
              const actual = gpuMetrics[name];
              const bothNaN = Number.isNaN(expected) && Number.isNaN(actual);
              return [
                name,
                {
                  expected,
                  actual,
                  pass:
                    bothNaN ||
                    (Number.isFinite(expected) &&
                      Number.isFinite(actual) &&
                      Math.abs(actual - expected) <=
                        protocol.PHASE5_SCALAR_TOLERANCES
                          .fieldDerivedMetricMaxAbs),
                },
              ];
            }),
          );
          const totalMass = scalarComparison(
            cpuMetrics.totalMass,
            gpuMetrics.totalMass,
          );
          return {
            exact,
            field,
            totalMass,
            pass:
              Object.values(exact).every(Boolean) &&
              Object.values(field).every((entry) => entry.pass) &&
              totalMass.pass,
          };
        }

        async function readState(gpu, fixtureId, suffix) {
          const [
            occupancyBytes,
            wallBytes,
            boundaryMassBytes,
            vaporBytes,
            topologyBytes,
          ] =
            await Promise.all([
              readBuffer(
                gpu.occupancyBuffer(),
                `${fixtureId}:${suffix}:occupancy`,
              ),
              readBuffer(
                gpu.wallBuffer(),
                `${fixtureId}:${suffix}:wall`,
              ),
              readBuffer(
                gpu.boundaryMassBuffer(),
                `${fixtureId}:${suffix}:boundary-mass`,
              ),
              readBuffer(
                gpu.activeVaporBuffer(),
                `${fixtureId}:${suffix}:vapor`,
              ),
              readBuffer(
                gpu.topologyBuffer(),
                `${fixtureId}:${suffix}:topology`,
              ),
            ]);
          return {
            occupancy: new Uint32Array(occupancyBytes),
            wall: new Uint32Array(wallBytes),
            boundaryMass: new Float32Array(boundaryMassBytes),
            vapor: new Float32Array(vaporBytes),
            topology: new Uint32Array(topologyBytes),
          };
        }

        async function readEventSnapshot(gpu, fixtureId, suffix) {
          const [state, reportBytes, renderFlagBytes] = await Promise.all([
            readState(gpu, fixtureId, suffix),
            readBuffer(
              gpu.reportBuffer(),
              `${fixtureId}:${suffix}:report`,
            ),
            readBuffer(
              gpu.renderFlagsBuffer(),
              `${fixtureId}:${suffix}:render-flags`,
            ),
          ]);
          const report = production.decodeGpuGgCycleReport(reportBytes);
          const boundaryIndices = new Uint32Array(
            report.boundaryCount === 0
              ? new ArrayBuffer(0)
              : await readBuffer(
                  gpu.boundaryIndicesBuffer(),
                  `${fixtureId}:${suffix}:boundary-indices`,
                  report.boundaryCount * 4,
                ),
          );
          return {
            state,
            report,
            reportWords: new Uint32Array(reportBytes),
            renderFlags: new Uint32Array(renderFlagBytes),
            boundaryIndices,
            tick: gpu.tick(),
          };
        }

        const fixtures = protocol.PHASE5_FIXTURES.filter(
          (fixture) => fixture.kind === "gg",
        );
        const fixtureReports = [];
        for (const fixture of fixtures) {
          const oracle = makeOracle(fixture);
          const initialCpuLedger = oracle.ledger();
          const initialGpuMass = core.totalMass(
            Float64Array.from(Float32Array.from(oracle.b, Math.fround)),
            Float64Array.from(Float32Array.from(oracle.d, Math.fround)),
          );
          const arena = production.GpuBufferArena.create(
            device,
            1,
            production.createGpuBufferPlan(fixture.dims, "gg"),
          );
          let gpu = null;
          try {
            gpu = await production.GpuGgSolver.create(
              device,
              submissions,
              arena,
              makeGpuInput(oracle),
            );
            const cycleCap = Number(fixture.stop.value);
            let minimumMargin = Infinity;
            let reportMismatchCount = 0;
            const reportMismatchSamples = [];
            let clampOracleMaxAbs = 0;
            let clampOracleMaxRelative = 0;
            let clampOracleWithinMixedTolerance = true;
            let attachmentDeltaMismatchCount = 0;
            let noiseMismatchCount = 0;
            let renderFlagMismatchCount = 0;
            let surfaceReportMismatchCount = 0;
            let eventStateMismatchCount = 0;
            const directClampComparisons = [];
            const events = [];
            let lastExpectedRenderFlags = new Uint32Array(oracle.a.length);
            let lastSurfaceReport = {
              attachedNow: 0,
              maxKineticFillIncrement: null,
              holeFillCount: 0,
              deltaTimeSeconds: null,
              stalled: false,
              skippedUnconverged: false,
            };
            for (let cycle = 0; cycle < cycleCap; cycle++) {
              if (
                fixture.timeline !== null &&
                cycle === fixture.timeline.completedCycle
              ) {
                const compareEventSnapshot = (snapshot) => {
                  const occupancyMismatchCount = exactArrayMismatch(
                    Uint32Array.from(oracle.a),
                    snapshot.state.occupancy,
                  );
                  const wallMismatchCount = exactArrayMismatch(
                    Uint32Array.from(oracle.wall),
                    snapshot.state.wall,
                  );
                  const topologyMismatchCount = exactArrayMismatch(
                    topologyFor(oracle, true),
                    snapshot.state.topology,
                  );
                  const boundaryOrderMismatchCount = exactArrayMismatch(
                    Uint32Array.from(oracle.boundaryCells()),
                    snapshot.boundaryIndices,
                  );
                  const renderFlagMismatchCount = exactArrayMismatch(
                    lastExpectedRenderFlags,
                    snapshot.renderFlags,
                  );
                  const boundaryMass = compareArrays(
                    oracle.b,
                    snapshot.state.boundaryMass,
                    protocol.PHASE5_FIELD_TOLERANCES.ggBoundaryMass,
                  );
                  const vapor = compareArrays(
                    oracle.d,
                    snapshot.state.vapor,
                    protocol.PHASE5_FIELD_TOLERANCES.ggVapor,
                  );
                  const gpuSurfaceReport = {
                    attachedNow: snapshot.report.attachedNow,
                    maxKineticFillIncrement: null,
                    holeFillCount: snapshot.report.holeFillNow,
                    deltaTimeSeconds: null,
                    stalled: false,
                    skippedUnconverged: false,
                  };
                  const report = {
                    surfaceExact:
                      JSON.stringify(lastSurfaceReport) ===
                      JSON.stringify(gpuSurfaceReport),
                    boundaryCountExact:
                      snapshot.report.boundaryCount === oracle.boundarySize(),
                    attachedTotalExact:
                      snapshot.report.attachedTotal === oracle.attachedCount,
                    errorFlagsExact: snapshot.report.errorFlags === 0,
                  };
                  report.pass = Object.values(report).every(Boolean);
                  const tickExact = snapshot.tick === oracle.tick;
                  return {
                    occupancyMismatchCount,
                    wallMismatchCount,
                    topologyMismatchCount,
                    boundaryOrderMismatchCount,
                    renderFlagMismatchCount,
                    boundaryMass,
                    vapor,
                    report,
                    tickExact,
                    pass:
                      occupancyMismatchCount === 0 &&
                      wallMismatchCount === 0 &&
                      topologyMismatchCount === 0 &&
                      boundaryOrderMismatchCount === 0 &&
                      renderFlagMismatchCount === 0 &&
                      boundaryMass.pass &&
                      vapor.pass &&
                      report.pass &&
                      tickExact,
                  };
                };
                const beforeSnapshot = await readEventSnapshot(
                  gpu,
                  fixture.id,
                  `event-${cycle}:before`,
                );
                const beforeComparison = compareEventSnapshot(beforeSnapshot);
                const next = cloneParams(
                  fixture.timeline.nextPreset,
                  fixture.phi,
                );
                const environment = core.ggTimelineEnvironmentFromParams(next);
                const cpuEvent = oracle.applyTimelineEnvironment(environment);
                const gpuEvent = gpu.applyTimelineEnvironment(environment);
                const afterSnapshot = await readEventSnapshot(
                  gpu,
                  fixture.id,
                  `event-${cycle}:after`,
                );
                const afterComparison = compareEventSnapshot(afterSnapshot);
                const preservation = {
                  occupancyMismatchCount: exactArrayMismatch(
                    beforeSnapshot.state.occupancy,
                    afterSnapshot.state.occupancy,
                  ),
                  wallMismatchCount: exactArrayMismatch(
                    beforeSnapshot.state.wall,
                    afterSnapshot.state.wall,
                  ),
                  boundaryMassBitMismatchCount: exactArrayMismatch(
                    new Uint32Array(beforeSnapshot.state.boundaryMass.buffer),
                    new Uint32Array(afterSnapshot.state.boundaryMass.buffer),
                  ),
                  vaporBitMismatchCount: exactArrayMismatch(
                    new Uint32Array(beforeSnapshot.state.vapor.buffer),
                    new Uint32Array(afterSnapshot.state.vapor.buffer),
                  ),
                  topologyMismatchCount: exactArrayMismatch(
                    beforeSnapshot.state.topology,
                    afterSnapshot.state.topology,
                  ),
                  renderFlagMismatchCount: exactArrayMismatch(
                    beforeSnapshot.renderFlags,
                    afterSnapshot.renderFlags,
                  ),
                  boundaryOrderMismatchCount: exactArrayMismatch(
                    beforeSnapshot.boundaryIndices,
                    afterSnapshot.boundaryIndices,
                  ),
                  reportBitMismatchCount: exactArrayMismatch(
                    beforeSnapshot.reportWords,
                    afterSnapshot.reportWords,
                  ),
                  tickExact: beforeSnapshot.tick === afterSnapshot.tick,
                };
                preservation.pass =
                  Object.entries(preservation).every(([name, value]) =>
                    name === "tickExact" ? value === true : value === 0
                  );
                const transitionExact =
                  JSON.stringify(cpuEvent) === JSON.stringify(gpuEvent);
                const eventPass =
                  transitionExact &&
                  beforeComparison.pass &&
                  afterComparison.pass &&
                  preservation.pass;
                if (!eventPass) eventStateMismatchCount++;
                events.push({
                  cycle,
                  exact: eventPass,
                  transitionExact,
                  cpu: cpuEvent,
                  gpu: gpuEvent,
                  beforeComparison,
                  afterComparison,
                  preservation,
                });
              }
              const oldBoundaryCount = oracle.boundarySize();
              const tickBefore = oracle.tick;
              const startBoundary = oracle.boundaryCells();
              const relaxation = oracle.relaxField();
              minimumMargin = Math.min(
                minimumMargin,
                minimumDecisionMargin(oracle),
              );
              const expectedFlags = expectedRenderFlags(
                oracle,
                startBoundary,
              );
              const surface = oracle.advanceSurface();
              lastExpectedRenderFlags = expectedFlags;
              lastSurfaceReport = surface;
              await gpu.step(`${fixture.id}:cycle-${cycle + 1}`);
              const report = production.decodeGpuGgCycleReport(
                await readBuffer(
                  gpu.reportBuffer(),
                  `${fixture.id}:cycle-${cycle + 1}:report`,
                ),
              );
              const attachmentBytes =
                report.attachedNow === 0
                  ? new ArrayBuffer(0)
                  : await readBuffer(
                      gpu.attachmentIndicesBuffer(),
                      `${fixture.id}:cycle-${cycle + 1}:attachments`,
                      report.attachedNow * 4,
                    );
              const attachmentIndices = new Uint32Array(attachmentBytes);
              attachmentDeltaMismatchCount += exactArrayMismatch(
                Uint32Array.from(oracle.lastAttached),
                attachmentIndices,
              );
              const observedRenderFlags = new Uint32Array(
                await readBuffer(
                  gpu.renderFlagsBuffer(),
                  `${fixture.id}:cycle-${cycle + 1}:render-flags`,
                ),
              );
              renderFlagMismatchCount += exactArrayMismatch(
                expectedFlags,
                observedRenderFlags,
              );
              const expectedClamp =
                relaxation.shellClampDiagnostic === null
                  ? 0
                  : relaxation.shellClampDiagnostic;
              const clamp = scalarComparison(
                expectedClamp,
                report.lastClampDelta,
              );
              if (fixture.farField === "dirichlet") {
                directClampComparisons.push({
                  cycle: cycle + 1,
                  ...clamp,
                });
              }
              clampOracleMaxAbs = Math.max(
                clampOracleMaxAbs,
                clamp.difference,
              );
              clampOracleMaxRelative = Math.max(
                clampOracleMaxRelative,
                clamp.difference /
                  Math.max(
                    Math.abs(expectedClamp),
                    protocol.PHASE5_SCALAR_TOLERANCES
                      .relativeDenominatorFloor,
                  ),
              );
              if (!clamp.pass) clampOracleWithinMixedTolerance = false;
              const gpuSurfaceReport = {
                attachedNow: report.attachedNow,
                maxKineticFillIncrement: null,
                holeFillCount: report.holeFillNow,
                deltaTimeSeconds: null,
                stalled: false,
                skippedUnconverged: false,
              };
              const surfaceReportExact =
                JSON.stringify(surface) === JSON.stringify(gpuSurfaceReport);
              if (!surfaceReportExact) surfaceReportMismatchCount++;
              if (
                report.oldBoundaryCount !== oldBoundaryCount ||
                report.boundaryCount !== oracle.boundarySize() ||
                report.attachedTotal !== oracle.attachedCount ||
                report.attachedNow !== surface.attachedNow ||
                report.holeFillNow !== surface.holeFillCount ||
                report.errorFlags !== 0 ||
                gpu.tick() !== oracle.tick
              ) {
                reportMismatchCount++;
                if (reportMismatchSamples.length < 3) {
                  reportMismatchSamples.push({
                    cycle: cycle + 1,
                    expectedClamp,
                    observedClamp: report.lastClampDelta,
                    clamp,
                    oldBoundaryCount,
                    observedOldBoundaryCount: report.oldBoundaryCount,
                    expectedBoundaryCount: oracle.boundarySize(),
                    observedBoundaryCount: report.boundaryCount,
                    expectedAttachedTotal: oracle.attachedCount,
                    observedAttachedTotal: report.attachedTotal,
                    expectedAttachedNow: surface.attachedNow,
                    observedAttachedNow: report.attachedNow,
                    expectedHoleFillNow: surface.holeFillCount,
                    observedHoleFillNow: report.holeFillNow,
                    errorFlags: report.errorFlags,
                    expectedTick: oracle.tick,
                    observedTick: gpu.tick(),
                    expectedSurfaceReport: surface,
                    observedSurfaceReport: gpuSurfaceReport,
                    surfaceReportExact,
                  });
                }
              }
              if (fixture.noiseEpsilon > 0) {
                const observedNoise = new Float32Array(
                  await readBuffer(
                    gpu.noiseBuffer(),
                    `${fixture.id}:cycle-${cycle + 1}:noise`,
                  ),
                );
                const epsilon = Math.fround(fixture.noiseEpsilon);
                for (let index = 0; index < observedNoise.length; index++) {
                  const expected = Math.fround(
                    epsilon *
                      core.randomBit(
                        fixture.rngSeed,
                        index,
                        tickBefore,
                        core.STREAM_NOISE_XI,
                      ),
                  );
                  if (observedNoise[index] !== expected) noiseMismatchCount++;
                }
              }
            }
            const finalState = await readState(gpu, fixture.id, "final");
            const finalReport = production.decodeGpuGgCycleReport(
              await readBuffer(
                gpu.reportBuffer(),
                `${fixture.id}:final:report`,
              ),
            );
            const boundaryIndices = new Uint32Array(
              finalReport.boundaryCount === 0
                ? new ArrayBuffer(0)
                : await readBuffer(
                    gpu.boundaryIndicesBuffer(),
                    `${fixture.id}:final:boundary-indices`,
                    finalReport.boundaryCount * 4,
                  ),
            );
            const occupancyMismatchCount = exactArrayMismatch(
              Uint32Array.from(oracle.a),
              finalState.occupancy,
            );
            const wallMismatchCount = exactArrayMismatch(
              Uint32Array.from(oracle.wall),
              finalState.wall,
            );
            const boundaryOrderMismatchCount = exactArrayMismatch(
              Uint32Array.from(oracle.boundaryCells()),
              boundaryIndices,
            );
            const expectedTopology = topologyFor(oracle, true);
            const topologyMismatchCount = exactArrayMismatch(
              expectedTopology,
              finalState.topology,
            );
            const boundaryMass = compareArrays(
              oracle.b,
              finalState.boundaryMass,
              protocol.PHASE5_FIELD_TOLERANCES.ggBoundaryMass,
            );
            const vapor = compareArrays(
              oracle.d,
              finalState.vapor,
              protocol.PHASE5_FIELD_TOLERANCES.ggVapor,
            );
            const gpuA = Uint8Array.from(finalState.occupancy);
            const gpuB = Float64Array.from(finalState.boundaryMass);
            const gpuD = Float64Array.from(finalState.vapor);
            const gpuWall = Uint8Array.from(finalState.wall);
            const cpuMetrics = core.computeMetrics(
              oracle.a,
              oracle.b,
              oracle.d,
              oracle.dims,
              oracle.center,
              oracle.tick,
              oracle.farFieldMean(),
              oracle.wall,
            );
            const gpuFarField = farFieldMean(
              finalState.occupancy,
              finalState.vapor,
              finalState.topology,
            );
            const gpuMetrics = core.computeMetrics(
              gpuA,
              gpuB,
              gpuD,
              oracle.dims,
              oracle.center,
              gpu.tick(),
              gpuFarField,
              gpuWall,
            );
            const metrics = metricComparison(cpuMetrics, gpuMetrics);
            const cpuLedger = oracle.ledger();
            const mass = scalarComparison(cpuLedger.totalMassBD, gpuMetrics.totalMass);
            const directOracleMeterComparison =
              fixture.farField === "dirichlet"
                ? {
                    ...scalarComparison(
                      cpuLedger.dirichletMeter,
                      finalReport.dirichletMeter,
                    ),
                    blocking: false,
                    rationale:
                      "observational only: the signed source sum is cancellation-heavy across diverged binary32/binary64 fields",
                  }
                : {
                    expected: null,
                    actual: finalReport.dirichletMeter,
                    difference: Math.abs(finalReport.dirichletMeter),
                    limit: 0,
                    pass: finalReport.dirichletMeter === 0,
                    blocking: true,
                  };
            const cpuCorrectedMass =
              cpuLedger.totalMassBD - (cpuLedger.dirichletMeter ?? 0);
            const gpuCorrectedMass =
              gpuMetrics.totalMass - finalReport.dirichletMeter;
            const correctedMassLedger = {
              cpuWithinLane: scalarComparison(
                initialCpuLedger.totalMassBD,
                cpuCorrectedMass,
              ),
              gpuWithinLane: scalarComparison(
                initialGpuMass,
                gpuCorrectedMass,
              ),
              crossLane: scalarComparison(
                cpuCorrectedMass,
                gpuCorrectedMass,
              ),
            };
            correctedMassLedger.pass =
              correctedMassLedger.cpuWithinLane.pass &&
              correctedMassLedger.gpuWithinLane.pass &&
              correctedMassLedger.crossLane.pass;
            const stopReason = {
              cpu: {
                kind: "completed-cycle-cap",
                value: oracle.tick,
              },
              gpu: {
                kind: "completed-cycle-cap",
                value: gpu.tick(),
              },
              exact: oracle.tick === gpu.tick() && gpu.tick() === cycleCap,
            };
            const checkpointBase = {
              dims: oracle.dims,
              tick: oracle.tick,
              rngSeed: oracle.rngSeed,
              noiseEpsilon: oracle.noiseEpsilon,
              farField: oracle.farField,
              domain: oracle.domain,
              params: oracle.params,
              center: oracle.center,
            };
            const pass =
              occupancyMismatchCount === 0 &&
              wallMismatchCount === 0 &&
              boundaryOrderMismatchCount === 0 &&
              topologyMismatchCount === 0 &&
              boundaryMass.pass &&
              vapor.pass &&
              reportMismatchCount === 0 &&
              surfaceReportMismatchCount === 0 &&
              attachmentDeltaMismatchCount === 0 &&
              noiseMismatchCount === 0 &&
              renderFlagMismatchCount === 0 &&
              eventStateMismatchCount === 0 &&
              events.every((event) => event.exact) &&
              directClampComparisons.length ===
                (fixture.farField === "dirichlet" ? cycleCap : 0) &&
              (!directOracleMeterComparison.blocking ||
                directOracleMeterComparison.pass) &&
              minimumMargin >=
                protocol.PHASE5_DECISION_MARGINS.ggBoundaryMass &&
              metrics.pass &&
              mass.pass &&
              correctedMassLedger.pass &&
              stopReason.exact &&
              !cpuMetrics.domainContact &&
              !gpuMetrics.domainContact;
            fixtureReports.push({
              id: fixture.id,
              cycles: cycleCap,
              minimumDecisionMargin: minimumMargin,
              occupancyMismatchCount,
              wallMismatchCount,
              boundaryOrderMismatchCount,
              topologyMismatchCount,
              boundaryMass,
              vapor,
              reportMismatchCount,
              surfaceReportMismatchCount,
              reportMismatchSamples,
              clampOracleComparison: {
                maxAbs: clampOracleMaxAbs,
                maxRelative: clampOracleMaxRelative,
                withinFrozenMixedScalarTolerance:
                  clampOracleWithinMixedTolerance,
                blocking: false,
                rationale:
                  "the signed shell sum is cancellation-heavy and compounds permitted per-cell binary32 field differences; the meter reduction is pinned separately and the corrected-mass ledger is blocking",
              },
              attachmentDeltaMismatchCount,
              noiseMismatchCount,
              renderFlagMismatchCount,
              eventStateMismatchCount,
              events,
              metrics,
              metricValues: {
                cpu: cpuMetrics,
                gpu: gpuMetrics,
              },
              mass,
              ledgerValues: {
                cpu: cpuLedger,
                gpu: {
                  rule: "GGThreshold",
                  claim: cpuLedger.claim,
                  totalMassBD: gpuMetrics.totalMass,
                  dirichletMeter:
                    fixture.farField === "dirichlet"
                      ? finalReport.dirichletMeter
                      : null,
                  fillLedgerIceCells: null,
                  fillLedgerVaporUnits: null,
                  holeFillDeficit: null,
                  saturationClippedFill: null,
                  lastDivergenceResidual: null,
                },
              },
              directClampComparisons,
              directOracleMeterComparison,
              correctedMassLedger,
              stopReason,
              cpuDomainContact: cpuMetrics.domainContact,
              gpuDomainContact: gpuMetrics.domainContact,
              cpuCheckpointBase64: base64(
                core.encodeCheckpoint(
                  {
                    ...checkpointBase,
                    a: oracle.a,
                    b: oracle.b,
                    d: oracle.d,
                  },
                  null,
                ),
              ),
              gpuCheckpointBase64: base64(
                core.encodeCheckpoint(
                  {
                    ...checkpointBase,
                    a: gpuA,
                    b: gpuB,
                    d: gpuD,
                  },
                  null,
                ),
              ),
              pass,
            });
          } finally {
            gpu?.destroy();
            arena.destroy();
          }
        }

        function binary32TreeSum(values) {
          let source = new Float32Array(values);
          while (source.length > 1) {
            const output = new Float32Array(Math.ceil(source.length / 256));
            for (let group = 0; group < output.length; group++) {
              const lanes = new Float32Array(256);
              const base = group * 256;
              for (let lane = 0; lane < 256; lane++) {
                if (base + lane < source.length) {
                  lanes[lane] = source[base + lane];
                }
              }
              for (let stride = 128; stride >= 1; stride /= 2) {
                for (let lane = 0; lane < stride; lane++) {
                  lanes[lane] = Math.fround(
                    lanes[lane] + lanes[lane + stride],
                  );
                }
              }
              output[group] = lanes[0];
            }
            source = output;
          }
          return source[0] ?? 0;
        }

        async function runClampPathWitnessCase(
          id,
          initialValueInput,
          rhoInput,
        ) {
          const dims = { nx: 17, ny: 19, nz: 11 };
          const plan = production.createGpuBufferPlan(dims, "gg");
          const arena = production.GpuBufferArena.create(device, 1, plan);
          let diffusion = null;
          let surface = null;
          try {
            const count = plan.layout.cellCount;
            const initialValue = Math.fround(initialValueInput);
            const rho = Math.fround(rhoInput);
            const initialVapor = new Float32Array(count);
            initialVapor.fill(initialValue);
            const occupancy = new Uint32Array(count);
            const wall = new Uint32Array(count);
            const topology = new Uint32Array(count);
            const shellIndices = [];
            for (let index = 0; index < count; index++) {
              if (index % 11 === 3) {
                topology[index] = 1;
                shellIndices.push(index);
              }
            }
            const params = cloneParams("plate");
            params.rho = rho;
            diffusion = await production.GpuGgDiffusion.create(
              device,
              submissions,
              arena,
              {
                initialVapor,
                occupancy,
                wall,
                topology,
                phi: 0,
                rho,
                noiseEpsilon: 0,
                rngSeed: 1,
                tick: 0,
                farField: "dirichlet",
              },
            );
            surface = await production.GpuGgSurface.create(
              device,
              submissions,
              arena,
              {
                initialBoundaryMass: new Float32Array(count),
                initialBoundaryIndices: new Uint32Array(0),
                attachedCount: 0,
                params,
                tick: 0,
                farField: "dirichlet",
              },
            );
            await diffusion.runPasses(1, `${id}:diffusion-clamp`);
            const [deltaBytes, vaporBytes] = await Promise.all([
              readBuffer(
                arena.get("scratchScalarA"),
                `${id}:clamp-delta-field`,
              ),
              readBuffer(
                diffusion.activeVaporBuffer(),
                `${id}:clamped-vapor`,
              ),
            ]);
            const observedDeltas = new Float32Array(deltaBytes);
            const observedVapor = new Float32Array(vaporBytes);
            const delta = Math.fround(rho - initialValue);
            const expectedDeltas = new Float32Array(count);
            const expectedVapor = new Float32Array(count);
            expectedVapor.fill(initialValue);
            for (const index of shellIndices) {
              expectedDeltas[index] = delta;
              expectedVapor[index] = rho;
            }
            const expectedSum = binary32TreeSum(expectedDeltas);
            await surface.advance(
              diffusion.activeVaporName(),
              `${id}:reduce-accumulate`,
            );
            const report = production.decodeGpuGgCycleReport(
              await readBuffer(
                surface.reportBuffer(),
                `${id}:report`,
              ),
            );

            const wrongSign = Float32Array.from(
              expectedDeltas,
              (value) => Math.fround(-value),
            );
            const wrongMask = new Float32Array(count);
            wrongMask.fill(delta);
            const omittedDelta = new Float32Array(expectedDeltas);
            omittedDelta[shellIndices[0]] = 0;
            const scaledDeltas = Float32Array.from(
              expectedDeltas,
              (value) => Math.fround(value * 0.5),
            );
            return {
              id,
              dims,
              cellCount: count,
              shellCellCount: shellIndices.length,
              initialValue,
              rho,
              delta,
              deltaFieldMismatchCount: exactArrayMismatch(
                new Uint32Array(expectedDeltas.buffer),
                new Uint32Array(observedDeltas.buffer),
              ),
              clampedVaporMismatchCount: exactArrayMismatch(
                new Uint32Array(expectedVapor.buffer),
                new Uint32Array(observedVapor.buffer),
              ),
              expectedSum,
              actualSum: report.lastClampDelta,
              accumulatedActual: report.dirichletMeter,
              mutations: {
                wrongSignRejected:
                  report.lastClampDelta !== binary32TreeSum(wrongSign),
                wrongMaskRejected:
                  report.lastClampDelta !== binary32TreeSum(wrongMask),
                omittedDeltaRejected:
                  report.lastClampDelta !== binary32TreeSum(omittedDelta),
                scaledDeltaRejected:
                  report.lastClampDelta !== binary32TreeSum(scaledDeltas),
              },
              pass:
                exactArrayMismatch(
                  new Uint32Array(expectedDeltas.buffer),
                  new Uint32Array(observedDeltas.buffer),
                ) === 0 &&
                exactArrayMismatch(
                  new Uint32Array(expectedVapor.buffer),
                  new Uint32Array(observedVapor.buffer),
                ) === 0 &&
                report.lastClampDelta === expectedSum &&
                report.dirichletMeter === expectedSum &&
                report.errorFlags === 0 &&
                report.boundaryCount === 0 &&
                report.attachedNow === 0,
            };
          } finally {
            surface?.destroy();
            diffusion?.destroy();
            arena.destroy();
          }
        }

        const clampPathWitness = {
          policy: protocol.PHASE5_GG_DIRICHLET_LEDGER_POLICY,
          cases: [
            await runClampPathWitnessCase(
              "clamp-path-positive",
              0.125,
              0.25,
            ),
            await runClampPathWitnessCase(
              "clamp-path-negative",
              0.25,
              0.125,
            ),
          ],
        };
        clampPathWitness.pass =
          clampPathWitness.cases.every((entry) => entry.pass) &&
          clampPathWitness.cases.every((entry) =>
            Object.values(entry.mutations).every(Boolean)
          );

        const meterOracle = makeOracle(
          fixtures.find((fixture) => fixture.farField === "dirichlet"),
        );
        const meterArena = production.GpuBufferArena.create(
          device,
          1,
          production.createGpuBufferPlan(meterOracle.dims, "gg"),
        );
        let meterDiffusion = null;
        let meterSurface = null;
        let meterReductionWitness;
        try {
          const initial = makeGpuInput(meterOracle);
          meterDiffusion = await production.GpuGgDiffusion.create(
            device,
            submissions,
            meterArena,
            {
              initialVapor: initial.initialVapor,
              occupancy: initial.occupancy,
              wall: initial.wall,
              topology: topologyFor(meterOracle, true),
              phi: initial.params.phi,
              rho: initial.params.rho,
              noiseEpsilon: initial.noiseEpsilon,
              rngSeed: initial.rngSeed,
              tick: initial.tick,
              farField: initial.farField,
            },
          );
          meterSurface = await production.GpuGgSurface.create(
            device,
            submissions,
            meterArena,
            {
              initialBoundaryMass: initial.initialBoundaryMass,
              initialBoundaryIndices: initial.initialBoundaryIndices,
              attachedCount: meterOracle.attachedCount,
              params: initial.params,
              tick: initial.tick,
              farField: initial.farField,
            },
          );
          const first = new Float32Array(meterArena.plan.layout.cellCount);
          const second = new Float32Array(first.length);
          for (let index = 0; index < first.length; index++) {
            first[index] = Math.fround(
              ((index % 19) - 7) * 1e-6 + 2e-7,
            );
            second[index] = Math.fround(
              ((index % 23) - 13) * 3e-7 - 1e-7,
            );
          }
          const firstExpected = binary32TreeSum(first);
          meterArena.upload(device, "scratchScalarA", first);
          await meterSurface.advance(
            "ggVaporA",
            "meter-reduction-witness:first",
          );
          const firstReport = production.decodeGpuGgCycleReport(
            await readBuffer(
              meterSurface.reportBuffer(),
              "meter-reduction-witness:first:report",
            ),
          );
          const secondExpected = binary32TreeSum(second);
          meterArena.upload(device, "scratchScalarA", second);
          meterSurface.updateControls({
            params: initial.params,
            tick: initial.tick + 1,
          });
          await meterSurface.advance(
            "ggVaporA",
            "meter-reduction-witness:second",
          );
          const secondReport = production.decodeGpuGgCycleReport(
            await readBuffer(
              meterSurface.reportBuffer(),
              "meter-reduction-witness:second:report",
            ),
          );
          const accumulatedExpected = Math.fround(
            firstExpected + secondExpected,
          );
          meterReductionWitness = {
            cellCount: first.length,
            reductionDispatches:
              production.planGpuGgClampReduction(first.length).dispatches
                .length,
            firstExpected,
            firstActual: firstReport.lastClampDelta,
            secondExpected,
            secondActual: secondReport.lastClampDelta,
            accumulatedExpected,
            accumulatedActual: secondReport.dirichletMeter,
            exact:
              firstReport.lastClampDelta === firstExpected &&
              secondReport.lastClampDelta === secondExpected &&
              secondReport.dirichletMeter === accumulatedExpected &&
              firstReport.errorFlags === 0 &&
              secondReport.errorFlags === 0,
          };
        } finally {
          meterSurface?.destroy();
          meterDiffusion?.destroy();
          meterArena.destroy();
        }

        const negativeFixture = fixtures[0];
        const negativeOracle = makeOracle(negativeFixture);
        const negativeArena = production.GpuBufferArena.create(
          device,
          1,
          production.createGpuBufferPlan(negativeFixture.dims, "gg"),
        );
        let negativeDiffusion = null;
        let negativeSurface = null;
        let stalePingPong;
        try {
          const initial = makeGpuInput(negativeOracle);
          const combinedTopology = topologyFor(negativeOracle, true);
          negativeDiffusion = await production.GpuGgDiffusion.create(
            device,
            submissions,
            negativeArena,
            {
              initialVapor: initial.initialVapor,
              occupancy: initial.occupancy,
              wall: initial.wall,
              topology: combinedTopology,
              phi: initial.params.phi,
              rho: initial.params.rho,
              noiseEpsilon: initial.noiseEpsilon,
              rngSeed: initial.rngSeed,
              tick: initial.tick,
              farField: initial.farField,
            },
          );
          negativeSurface = await production.GpuGgSurface.create(
            device,
            submissions,
            negativeArena,
            {
              initialBoundaryMass: initial.initialBoundaryMass,
              initialBoundaryIndices: initial.initialBoundaryIndices,
              attachedCount: negativeOracle.attachedCount,
              params: initial.params,
              tick: initial.tick,
              farField: initial.farField,
            },
          );
          negativeOracle.step();
          await negativeDiffusion.runPasses(1, "stale-negative:cycle-1:diffusion");
          await negativeSurface.advance(
            negativeDiffusion.activeVaporName(),
            "stale-negative:cycle-1:surface",
          );
          negativeDiffusion.updateControls({
            tick: 1,
            rho: initial.params.rho,
            phi: initial.params.phi,
          });
          negativeSurface.updateControls({ params: initial.params, tick: 1 });
          negativeOracle.step();
          await negativeDiffusion.runPasses(1, "stale-negative:cycle-2:diffusion");
          await negativeSurface.advance(
            negativeDiffusion.inactiveVaporName(),
            "stale-negative:cycle-2:surface",
          );
          const candidateBoundaryMass = new Float32Array(
            await readBuffer(
              negativeSurface.boundaryMassBuffer(),
              "stale-negative:boundary-mass",
            ),
          );
          const candidateVapor = new Float32Array(
            await readBuffer(
              negativeDiffusion.activeVaporBuffer(),
              "stale-negative:vapor",
            ),
          );
          const boundaryMass = compareArrays(
            negativeOracle.b,
            candidateBoundaryMass,
            protocol.PHASE5_FIELD_TOLERANCES.ggBoundaryMass,
          );
          const vapor = compareArrays(
            negativeOracle.d,
            candidateVapor,
            protocol.PHASE5_FIELD_TOLERANCES.ggVapor,
          );
          stalePingPong = {
            mutation: "surface stage consumes the inactive diffusion buffer on cycle 2",
            boundaryMass,
            vapor,
            rejected: !boundaryMass.pass || !vapor.pass,
          };
        } finally {
          negativeSurface?.destroy();
          negativeDiffusion?.destroy();
          negativeArena.destroy();
        }

        const stress = protocol.PHASE5_FIXTURES.find(
          (fixture) =>
            fixture.kind === "stress" &&
            fixture.stress === "gg-attachment-margin",
        );
        if (stress === undefined) {
          throw new Error("G-G attachment stress fixture is absent");
        }
        const stressThreshold = Math.fround(stress.inputs.ggThreshBeta);
        const stressValues = stress.inputs.postFreezeBoundaryMass.map(Math.fround);
        const stressReport = {
          id: stress.id,
          threshold: stressThreshold,
          values: stressValues,
          decisions: stressValues.map((value) => value >= stressThreshold),
          straddles: stressValues[0] < stressThreshold &&
            stressValues[1] >= stressThreshold,
        };

        await new Promise((resolvePromise) => setTimeout(resolvePromise, 0));
        const limitNames = Object.keys(input.requiredLimits);
        const submissionRecords = submissions.records();
        const expectedSubmissionCount =
          fixtureReports.reduce(
            (total, fixture) => total + fixture.cycles * 2,
            0,
          ) +
          clampPathWitness.cases.length * 2 +
          2 +
          4;
        const submissionSummary = {
          expectedCount: expectedSubmissionCount,
          actualCount: submissionRecords.length,
          maxWallMs: Math.max(
            ...submissionRecords.map((record) => record.wallMs),
          ),
          limitMs: protocol.PHASE5_PERFORMANCE.maxSubmissionSegmentMs,
        };
        submissionSummary.pass =
          submissionSummary.actualCount === submissionSummary.expectedCount &&
          submissionSummary.maxWallMs <= submissionSummary.limitMs;
        const result = {
          adapter: {
            info: {
              vendor: adapter.info.vendor,
              architecture: adapter.info.architecture,
              device: adapter.info.device,
              description: adapter.info.description,
              backend: adapter.info.backend,
              type: adapter.info.type,
              driver: adapter.info.driver,
            },
            features: [...adapter.features].sort(),
            limits: Object.fromEntries(
              limitNames.map((name) => [name, adapter.limits[name]]),
            ),
          },
          device: {
            limits: Object.fromEntries(
              limitNames.map((name) => [name, device.limits[name]]),
            ),
          },
          fixtures: fixtureReports,
          clampPathWitness,
          meterReductionWitness,
          stalePingPong,
          stress: stressReport,
          submissions: submissionRecords,
          submissionSummary,
          readback: {
            records: readbackAudit.records(),
            fullFieldDisplayFrameCount:
              readbackAudit.fullFieldDisplayFrameCount(),
            totalBytes: readbackAudit.totalBytes(),
          },
          uncapturedErrors,
          unexpectedDeviceLoss: submissions.unexpectedLossReason(),
        };
        submissions.destroy();
        return result;
      },
      {
        coreModuleUrl: `${origin}/core/src/index.ts`,
        cpuModuleUrl: `${origin}/solver-cpu/src/index.ts`,
        productionModuleUrl: `${origin}/solver-gpu/src/index.ts`,
        protocolModuleUrl: `${origin}/runner/src/phase5-protocol.ts`,
        requiredFeatures: [...PHASE5_REQUIRED_FEATURES],
        requiredLimits: { ...PHASE5_REQUIRED_LIMITS },
      },
    );

    const repository = {
      commit: git("rev-parse", "HEAD"),
      clean: git("status", "--porcelain").length === 0,
    };
    const browserVersion = await (
      await browser.newBrowserCDPSession()
    ).send("Browser.getVersion");
    const backend = String(deviceResult.adapter.info.backend ?? "");
    const protocolManifest = phase5ProtocolManifest();
    const protocolSha256 = canonicalJsonSha256(protocolManifest);
    const host = {
      platform: process.platform,
      release: os.release(),
      architecture: os.arch(),
      cpu: os.cpus()[0]?.model.trim() ?? "unknown",
      logicalProcessors: os.cpus().length,
      totalMemoryBytes: os.totalmem(),
    };
    const protocolProvenancePass =
      PHASE5_PROTOCOL === "phase5-gpu-conformance-windows-v4" &&
      PHASE5_PROTOCOL_SHA256 ===
        "62f6f940a38a477dd34b6fd53687808708f7ccf89d6f59eccc8cb7960ccc8688" &&
      protocolSha256 === PHASE5_PROTOCOL_SHA256;
    const runtimeProvenancePass =
      PHASE5_HEADLESS_RUNTIME === "playwright-bundled-chromium" &&
      PHASE5_HEADLESS_RUNTIME_VERSION ===
        `playwright-${expectedRuntime.playwrightVersion}/chromium-${expectedRuntime.chromiumRevision}` &&
      playwrightPackage.version === expectedRuntime.playwrightVersion &&
      browserPath
        .toLowerCase()
        .includes(`\\chromium-${expectedRuntime.chromiumRevision}\\`) &&
      browserVersion.product === expectedRuntime.product &&
      browserVersion.revision === expectedRuntime.revision &&
      JSON.stringify(launchFlags) ===
        JSON.stringify([
          "--enable-unsafe-webgpu",
          "--enable-webgpu-developer-features",
        ]);
    const hostProvenancePass =
      host.platform === expectedHost.platform &&
      host.cpu === expectedHost.cpu;
    const adapterProvenancePass =
      Object.entries(expectedAdapter).every(
        ([name, expected]) => deviceResult.adapter.info[name] === expected,
      );
    const report = {
      schema: "phase5-wp3-gg-v2",
      protocol: PHASE5_PROTOCOL,
      protocolSha256: {
        expected: PHASE5_PROTOCOL_SHA256,
        actual: protocolSha256,
        pass: protocolProvenancePass,
      },
      lane: "windows-d3d12",
      pass:
        repository.clean &&
        protocolProvenancePass &&
        runtimeProvenancePass &&
        hostProvenancePass &&
        adapterProvenancePass &&
        backend.toLowerCase() === PHASE5_EXPECTED_WINDOWS_BACKEND.toLowerCase() &&
        deviceResult.fixtures.length === 2 &&
        deviceResult.fixtures.every((fixture) => fixture.pass) &&
        deviceResult.clampPathWitness.pass &&
        deviceResult.meterReductionWitness.exact &&
        deviceResult.stalePingPong.rejected &&
        deviceResult.stress.straddles &&
        deviceResult.submissionSummary.pass &&
        deviceResult.readback.fullFieldDisplayFrameCount === 0 &&
        deviceResult.uncapturedErrors.length === 0 &&
        deviceResult.unexpectedDeviceLoss === null,
      repository,
      host: {
        ...host,
        expected: expectedHost,
        provenancePass: hostProvenancePass,
      },
      runtime: {
        name: PHASE5_HEADLESS_RUNTIME,
        frozenVersion: PHASE5_HEADLESS_RUNTIME_VERSION,
        actualPlaywrightVersion: playwrightPackage.version,
        product: browserVersion.product,
        revision: browserVersion.revision,
        executablePath: browserPath,
        launchFlags,
        expected: expectedRuntime,
        provenancePass: runtimeProvenancePass,
      },
      adapter: {
        expectedBackend: PHASE5_EXPECTED_WINDOWS_BACKEND,
        actualBackend: backend,
        expected: expectedAdapter,
        provenancePass: adapterProvenancePass,
        ...deviceResult.adapter,
      },
      device: deviceResult.device,
      checks: {
        fixtures: deviceResult.fixtures,
        clampPathWitness: deviceResult.clampPathWitness,
        meterReductionWitness: deviceResult.meterReductionWitness,
        stalePingPong: deviceResult.stalePingPong,
        stress: deviceResult.stress,
        submissionSummary: deviceResult.submissionSummary,
        submissions: deviceResult.submissions,
        readback: deviceResult.readback,
        uncapturedErrors: deviceResult.uncapturedErrors,
        unexpectedDeviceLoss: deviceResult.unexpectedDeviceLoss,
      },
    };
    console.log(JSON.stringify(report, null, 2));
    if (!report.pass) process.exitCode = 1;
  } finally {
    if (browser !== null) await browser.close();
    await vite.close();
  }
}

await main();
