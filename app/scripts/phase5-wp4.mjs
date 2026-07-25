#!/usr/bin/env node
// Phase 5 WP4 aggregate-v5 LK conformance. During implementation this executable also serves
// as the earliest real D3D12 shader-validation boundary; canonical publication is added only
// after the complete blocking fixture inventory passes.

import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { createRequire } from "node:module";
import os from "node:os";
import process from "node:process";
import { resolve } from "node:path";
import { chromium } from "playwright";
import { createServer as createViteServer } from "vite";
import { canonicalJsonSha256 } from "../../runner/src/gate4-evidence.ts";
import {
  PHASE5_EXPECTED_WINDOWS_BACKEND,
  PHASE5_FIXTURES_SHA256,
  PHASE5_HEADLESS_RUNTIME,
  PHASE5_HEADLESS_RUNTIME_VERSION,
  PHASE5_PROTOCOL,
  PHASE5_PROTOCOL_SHA256,
  PHASE5_REQUIRED_FEATURES,
  PHASE5_REQUIRED_LIMITS,
  PHASE5_TOLERANCES_SHA256,
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
    throw new Error("WP4 LK conformance accepts no options");
  }
  if (process.platform !== "win32") {
    throw new Error(`WP4 LK conformance does not support ${process.platform}`);
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
      name: "vcc-phase5-wp4-page",
      configureServer(viteServer) {
        viteServer.middlewares.use((request, response, next) => {
          if (request.url?.split("?")[0] !== "/phase5-wp4") {
            next();
            return;
          }
          response.writeHead(200, {
            "content-type": "text/html; charset=utf-8",
          });
          response.end("<!doctype html><title>VCC Phase 5 WP4 LK</title>");
        });
      },
    }],
  });
  await vite.listen();
  const address = vite.httpServer?.address();
  if (address === null || address === undefined || typeof address === "string") {
    throw new Error("WP4 Vite server did not receive an IPv4 port");
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
    await page.goto(`${origin}/phase5-wp4`, { waitUntil: "load" });
    const result = await page.evaluate(
      async (input) => {
        if (!isSecureContext) throw new Error("WP4 requires a secure context");
        if (navigator.gpu === undefined) {
          throw new Error("navigator.gpu is unavailable");
        }
        const [core, cpu, production, protocol, independent] = await Promise.all([
          import(input.coreModuleUrl),
          import(input.cpuModuleUrl),
          import(input.productionModuleUrl),
          import(input.protocolModuleUrl),
          import(input.independentModuleUrl),
        ]);
        const adapter = await navigator.gpu.requestAdapter({
          powerPreference: "high-performance",
        });
        if (adapter === null) throw new Error("WebGPU returned no adapter");
        const device = await production.requestCheckedGpuDevice(
          adapter,
          {
            requiredFeatures: input.requiredFeatures,
            requiredLimits: input.requiredLimits,
          },
          {
            requiredFeatures: input.requiredFeatures,
            requiredLimits: input.requiredLimits,
          },
          "vcc-phase5-wp4-device",
        );
        const uncapturedErrors = [];
        device.addEventListener("uncapturederror", (event) => {
          uncapturedErrors.push(event.error.message);
        });
        const submissions = new production.GpuSubmissionController(device);
        const audit = new production.GpuReadbackAudit();

        function makeOracle(fixture) {
          return new cpu.LKSolver({
            surfacePolicy: fixture.surfacePolicy,
            dims: fixture.dims,
            tempC: fixture.tempC,
            sigmaInfinity: fixture.sigmaInfinity,
            dxUm: fixture.dxUm,
            pressurePa: fixture.pressurePa,
            paramSet: fixture.paramSet,
            cflFill: fixture.cflFill,
            relaxTol: fixture.relaxTol,
            divTol: fixture.divTol,
            relaxMaxSweeps: fixture.relaxMaxSweeps,
            rngSeed: fixture.rngSeed,
            noiseEpsilon: fixture.noiseEpsilon,
            domain: fixture.domain,
            farField: fixture.farField,
            seedRadius: fixture.seedRadius,
            seedThickness: fixture.seedThickness,
          });
        }

        function topologyFor(oracle) {
          const topology = new Uint32Array(oracle.a.length);
          if (oracle.farField === "dirichlet") {
            for (const index of oracle.dirichletCells) {
              topology[index] |= production.GPU_LK_TOPOLOGY_FAR_FIELD;
            }
          }
          for (const index of oracle.boundaryCells()) {
            topology[index] |= production.GPU_LK_TOPOLOGY_BOUNDARY;
          }
          return topology;
        }

        function solverInput(oracle) {
          return {
            surfacePolicy: "aggregate-hv-g1h1-v5",
            initialSigma: Float32Array.from(oracle.sigma, Math.fround),
            initialFill: Float32Array.from(oracle.f, Math.fround),
            occupancy: Uint32Array.from(oracle.a),
            wall: Uint32Array.from(oracle.wall),
            topology: topologyFor(oracle),
            initialBoundaryIndices: Uint32Array.from(oracle.boundaryCells()),
            tempC: oracle.tempC,
            sigmaInfinity: oracle.sigmaInfinity,
            dxUm: oracle.dxM * 1e6,
            pressurePa: oracle.pressurePa,
            paramSet: oracle.paramSet,
            cflFill: oracle.cflFill,
            relaxTol: oracle.relaxTol,
            divTol: oracle.divTol,
            relaxMaxSweeps: oracle.relaxMaxSweeps,
            rngSeed: oracle.rngSeed,
            noiseEpsilon: oracle.noiseEpsilon,
            tick: oracle.tick,
            simTimeSeconds: oracle.simTimeSeconds,
            farField: oracle.farField,
            domain: oracle.domain,
            center: oracle.center,
            fillLedgerIceCells: 0,
            closedPlacedFillVaporUnits: 0,
            currentTemperatureSegmentStartFillIceCells: 0,
            kineticDemand: 0,
            saturationClippedFill: 0,
            holeFillDeficit: 0,
            holeFillCountTotal: 0,
            lastMaxFillVelocityMS: 0,
          };
        }

        function exactArray(reference, candidate) {
          if (reference.length !== candidate.length) {
            return {
              pass: false,
              mismatchCount: Math.max(reference.length, candidate.length),
              firstMismatch: "length",
            };
          }
          let mismatchCount = 0;
          let firstMismatch = null;
          for (let index = 0; index < reference.length; index++) {
            if (reference[index] !== candidate[index]) {
              mismatchCount++;
              if (firstMismatch === null) {
                firstMismatch = {
                  index,
                  reference: reference[index],
                  candidate: candidate[index],
                };
              }
            }
          }
          return { pass: mismatchCount === 0, mismatchCount, firstMismatch };
        }

        function fieldComparison(reference, candidate, tolerance) {
          if (reference.length !== candidate.length) {
            throw new Error(
              `field comparison length mismatch: ${reference.length} vs ${candidate.length}`,
            );
          }
          let maxAbs = 0;
          let maxAbsIndex = -1;
          let squareSum = 0;
          let maxRelative = 0;
          let relativeComparedCount = 0;
          for (let index = 0; index < reference.length; index++) {
            const expected = reference[index];
            const actual = candidate[index];
            if (!Number.isFinite(expected) || !Number.isFinite(actual)) {
              throw new Error(
                `field comparison requires finite values at ${index}`,
              );
            }
            const difference = Math.abs(actual - expected);
            if (difference > maxAbs) {
              maxAbs = difference;
              maxAbsIndex = index;
            }
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
            rms:
              reference.length === 0
                ? 0
                : Math.sqrt(squareSum / reference.length),
            maxRelative,
            relativeComparedCount,
            length: reference.length,
            maxAbsIndex,
            maxAbsReference:
              maxAbsIndex < 0 ? null : reference[maxAbsIndex],
            maxAbsCandidate:
              maxAbsIndex < 0 ? null : candidate[maxAbsIndex],
          };
          return {
            ...comparison,
            tolerance,
            pass:
              comparison.maxAbs <= tolerance.maxAbs &&
              comparison.rms <= tolerance.rms &&
              comparison.maxRelative <= tolerance.maxRelative,
          };
        }

        function scalarComparison(reference, candidate, extraAbs = 0) {
          const difference = Math.abs(candidate - reference);
          const limit =
            protocol.PHASE5_SCALAR_TOLERANCES.maxAbs +
            extraAbs +
            protocol.PHASE5_SCALAR_TOLERANCES.maxRelative *
              Math.abs(reference);
          return {
            reference,
            candidate,
            difference,
            limit,
            pass:
              Number.isFinite(reference) &&
              Number.isFinite(candidate) &&
              difference <= limit,
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

        // Lane observations never share an operand: each digest covers only its own lane's
        // bytes. Values are widened to one canonical unsigned 32-bit encoding first, so a
        // digest records the observed indices/flags rather than the lane's element width.
        async function laneDigest(values) {
          const digest = await crypto.subtle.digest(
            "SHA-256",
            new Uint8Array(
              Uint32Array.from(values, (value) => value >>> 0).buffer,
            ),
          );
          return Array.from(
            new Uint8Array(digest),
            (byte) => byte.toString(16).padStart(2, "0"),
          ).join("");
        }

        function activeCellTotal(occupancy, wall) {
          let total = 0;
          for (let index = 0; index < occupancy.length; index++) {
            if (occupancy[index] === 0 && wall[index] === 0) total++;
          }
          return total;
        }

        function attachedCellTotal(occupancy) {
          let total = 0;
          for (let index = 0; index < occupancy.length; index++) {
            if (occupancy[index] !== 0) total++;
          }
          return total;
        }

        function farFieldIndices(topology) {
          const indices = [];
          for (let index = 0; index < topology.length; index++) {
            if (
              (topology[index] & production.GPU_LK_TOPOLOGY_FAR_FIELD) !== 0
            ) {
              indices.push(index);
            }
          }
          return indices;
        }

        function finiteCount(values) {
          let total = 0;
          for (const value of values) {
            if (Number.isFinite(value)) total++;
          }
          return total;
        }

        function noiseMarkedBoundaryCount(indices, rngSeed, tick) {
          let total = 0;
          for (const index of indices) {
            if (
              core.randomBit(
                rngSeed,
                index,
                tick,
                core.STREAM_NOISE_ALPHA_HK,
              ) === 1
            ) total++;
          }
          return total;
        }

        function binary32ScalarComparison(reference, candidate) {
          const difference = Math.abs(candidate - reference);
          const limit =
            8 *
            2 ** -23 *
            Math.max(
              Math.abs(reference),
              Math.abs(candidate),
              1.1754943508222875e-38,
            );
          return {
            reference,
            candidate,
            difference,
            limit,
            pass:
              Number.isFinite(reference) &&
              Number.isFinite(candidate) &&
              difference <= limit,
          };
        }

        function expectedPrismBoundary(tempC, sigmaOppInput) {
          const sigmaOpp = Math.fround(sigmaOppInput);
          if (sigmaOpp <= 0) {
            return {
              sigmaOpp,
              coefficient: 0,
              sigmaBoundary: sigmaOpp,
            };
          }
          const sigma0 = Math.fround(core.sigma0Prism(tempC));
          const prefactor = Math.fround(
            core.nucleationAPrism(tempC, "CAK_A1"),
          );
          const coefficientAt = (sigmaSurface) =>
            prefactor * Math.exp(-sigma0 / sigmaSurface);
          let iterate = sigmaOpp;
          for (let iteration = 0; iteration < 60; iteration++) {
            const next = sigmaOpp / (1 + coefficientAt(iterate));
            iterate = 0.5 * (iterate + next);
          }
          const coefficient = coefficientAt(iterate);
          return {
            sigmaOpp,
            coefficient,
            sigmaBoundary: sigmaOpp / (1 + coefficient),
          };
        }

        const scalarFieldTolerance = {
          maxAbs: protocol.PHASE5_SCALAR_TOLERANCES.maxAbs,
          rms: protocol.PHASE5_SCALAR_TOLERANCES.maxAbs,
          maxRelative: protocol.PHASE5_SCALAR_TOLERANCES.maxRelative,
          relativeDenominatorFloor:
            protocol.PHASE5_SCALAR_TOLERANCES.relativeDenominatorFloor,
        };

        function nullableScalar(reference, candidate, extraAbs = 0) {
          if (reference === null || candidate === null) {
            return {
              reference,
              candidate,
              pass: reference === candidate,
            };
          }
          return scalarComparison(reference, candidate, extraAbs);
        }

        function cycleNegativeControls(classifierInput) {
          const bits = new ArrayBuffer(4);
          const bitsView = new DataView(bits);
          const valueAtBits = (value) => {
            bitsView.setUint32(0, value, true);
            return bitsView.getFloat32(0, true);
          };
          const base = 0x3a83_126f;
          const fromOffsets = (offsets) =>
            offsets.map((offset) => valueAtBits(base + offset));
          const historyCases = [
            {
              id: "monotonic-one-ulp-drift",
              twoBack: fromOffsets([0]),
              previous: fromOffsets([1]),
              current: fromOffsets([2]),
            },
            {
              id: "period-three",
              twoBack: fromOffsets([0]),
              previous: fromOffsets([2]),
              current: fromOffsets([1]),
            },
            {
              id: "two-ulp-transition",
              twoBack: fromOffsets([2]),
              previous: fromOffsets([0]),
              current: fromOffsets([2]),
            },
            {
              id: "one-active-cell-two-back-mismatch",
              twoBack: fromOffsets([0, 0]),
              previous: fromOffsets([1, 1]),
              current: fromOffsets([0, 1]),
            },
          ].map((history) => {
            let maximumCurrentStepUlpDistance = 0;
            let maximumTwoBackUlpDistance = 0;
            for (let index = 0; index < history.current.length; index++) {
              maximumCurrentStepUlpDistance = Math.max(
                maximumCurrentStepUlpDistance,
                protocol.phase5Float32UlpDistance(
                  history.previous[index],
                  history.current[index],
                ),
              );
              maximumTwoBackUlpDistance = Math.max(
                maximumTwoBackUlpDistance,
                protocol.phase5Float32UlpDistance(
                  history.twoBack[index],
                  history.current[index],
                ),
              );
            }
            const actual = protocol.classifyPhase5LkF32Convergence({
              ...classifierInput,
              maximumCurrentStepUlpDistance,
              maximumTwoBackUlpDistance,
            });
            return {
              id: history.id,
              expected: "incomplete",
              actual,
              history,
              maximumCurrentStepUlpDistance,
              maximumTwoBackUlpDistance,
              pass: actual === "incomplete",
            };
          });
          const cases = [
            ["stale-history-after-mutation", { completedSweepsAfterMutation: 1 }],
            [
              "current-divergence-failure",
              { currentDivergenceResidual: classifierInput.divTol },
            ],
            [
              "previous-divergence-failure",
              {
                previousDivergenceStatus: "zero-exchange-unconverged",
                previousDivergenceResidual: Infinity,
              },
            ],
            ["current-drift-failure", { currentDriftBoundPassed: false }],
            ["previous-drift-failure", { previousDriftBoundPassed: false }],
          ].map(([id, mutation]) => {
            const actual = protocol.classifyPhase5LkF32Convergence({
              ...classifierInput,
              ...mutation,
            });
            return {
              id,
              expected: "incomplete",
              actual,
              pass: actual === "incomplete",
            };
          });
          cases.unshift(...historyCases);
          let nonfiniteRejected = false;
          try {
            protocol.classifyPhase5LkF32Convergence({
              ...classifierInput,
              residual: Number.NaN,
            });
          } catch {
            nonfiniteRejected = true;
          }
          cases.push({
            id: "non-finite-value",
            expected: "throw",
            actual: nonfiniteRejected ? "throw" : "accepted",
            pass: nonfiniteRejected,
          });
          return cases;
        }

        function compareRelaxation(reference, candidate, farField) {
          const fields = {
            residual: scalarComparison(
              reference.residual,
              candidate.residual,
              protocol.PHASE5_SCALAR_TOLERANCES.relaxationResidualMaxAbs,
            ),
            divergence: nullableScalar(
              reference.divergenceResidual,
              candidate.divergenceResidual,
              protocol.PHASE5_SCALAR_TOLERANCES.divergenceResidualLimit,
            ),
            shell: nullableScalar(
              reference.shellClampDiagnostic,
              candidate.shellClampDiagnostic,
            ),
            exchange: nullableScalar(
              reference.surfaceExchangeDiagnostic,
              candidate.surfaceExchangeDiagnostic,
            ),
            drift: nullableScalar(
              reference.smootherDriftDiagnostic,
              candidate.smootherDriftDiagnostic,
            ),
            minimumExchange: nullableScalar(
              reference.minLocalSurfaceExchangeDiagnostic,
              candidate.minLocalSurfaceExchangeDiagnostic,
            ),
          };
          const positiveSourceExchange =
            farField === "dirichlet"
              ? candidate.shellClampDiagnostic > 0 &&
                candidate.surfaceExchangeDiagnostic > 0
              : null;
          return {
            exactConvergence:
              reference.converged === candidate.converged &&
              candidate.converged,
            fields,
            positiveSourceExchange,
            pass:
              reference.converged === candidate.converged &&
              candidate.converged &&
              Object.values(fields).every((field) => field.pass) &&
              positiveSourceExchange !== false,
          };
        }

        function exactOrFiniteScalar(reference, candidate, extraAbs = 0) {
          if (!Number.isFinite(reference) || !Number.isFinite(candidate)) {
            return {
              reference,
              candidate,
              pass: Object.is(reference, candidate),
            };
          }
          return scalarComparison(reference, candidate, extraAbs);
        }

        function binary32OrExactScalar(reference, candidate) {
          if (!Number.isFinite(reference) || !Number.isFinite(candidate)) {
            return {
              reference,
              candidate,
              pass: Object.is(reference, candidate),
            };
          }
          return binary32ScalarComparison(reference, candidate);
        }

        function exactBinary32Scalar(reference, candidate) {
          return {
            reference,
            candidate,
            pass: Object.is(reference, candidate),
          };
        }

        function compareIndependentRelaxation(
          fixture,
          tick,
          report,
          state,
        ) {
          const current = independent.replayRelaxationPhase(
            core,
            protocol,
            state.previousSigma,
            state.sigma,
            state,
            fixture,
            tick,
            state.boundarySupersaturation,
          );
          const previous = independent.replayRelaxationPhase(
            core,
            protocol,
            state.cycleReference,
            state.previousSigma,
            state,
            fixture,
            tick,
            state.previousBoundarySupersaturation,
          );
          const classification = independent.independentlyClassifyRelaxation(
            protocol,
            fixture,
            report,
            state,
            current,
            previous,
          );
          const currentTrace = report.trace.at(-1) ?? null;
          const traceAudit = report.trace.map((entry, index) => {
            const independentlyDerivedLimit =
              protocol.float32SmootherDriftAbsLimit(
                current.activeCellCount,
                entry.maxAbsSweepInput,
              );
            return {
              index,
              smootherDrift: entry.smootherDrift,
              maxAbsSweepInput: entry.maxAbsSweepInput,
              independentlyDerivedLimit,
              reportedLimit: entry.smootherDriftLimit,
              pass:
                Number.isFinite(entry.smootherDrift) &&
                Number.isFinite(entry.maxAbsSweepInput) &&
                entry.maxAbsSweepInput >= 0 &&
                Object.is(
                  independentlyDerivedLimit,
                  entry.smootherDriftLimit,
                ) &&
                Math.abs(entry.smootherDrift) <= independentlyDerivedLimit,
            };
          });
          const boundary = {
            membership: exactArray(
              Uint32Array.from(current.boundary).sort(),
              Uint32Array.from(state.boundaryIndices).sort(),
            ),
            topology: exactArray(
              Uint32Array.from(
                state.topology,
                (value) =>
                  (value & production.GPU_LK_TOPOLOGY_BOUNDARY) !== 0 ? 1 : 0,
              ),
              Uint32Array.from(state.topology, (_, index) =>
                current.boundary.includes(index) ? 1 : 0,
              ),
            ),
          };
          const arrays = {
            finalField: fieldComparison(
              current.predicted,
              state.sigma,
              protocol.PHASE5_FIELD_TOLERANCES.lkSigma,
            ),
            previousField: fieldComparison(
              previous.predicted,
              state.previousSigma,
              protocol.PHASE5_FIELD_TOLERANCES.lkSigma,
            ),
            coefficient: fieldComparison(
              current.coefficient,
              state.boundaryAttachmentCoefficient,
              scalarFieldTolerance,
            ),
            boundarySigma: fieldComparison(
              current.boundarySigma,
              state.boundarySupersaturation,
              protocol.PHASE5_FIELD_TOLERANCES.lkSigma,
            ),
            opposing: fieldComparison(
              current.opposing,
              state.opposingSupersaturation,
              protocol.PHASE5_FIELD_TOLERANCES.lkSigma,
            ),
            previousBoundarySigma: fieldComparison(
              previous.boundarySigma,
              state.previousBoundarySupersaturation ??
                new Float32Array(state.sigma.length),
              protocol.PHASE5_FIELD_TOLERANCES.lkSigma,
            ),
          };
          let cachePhaseScore = 0;
          let swappedCachePhaseScore = 0;
          let cachePhaseDifferenceCount = 0;
          let currentCacheFieldMismatchCount = 0;
          let previousCacheFieldMismatchCount = 0;
          if (state.previousBoundarySupersaturation !== null) {
            for (const index of current.boundary) {
              const previousCache =
                state.previousBoundarySupersaturation[index];
              const currentCache = state.boundarySupersaturation[index];
              cachePhaseScore +=
                protocol.phase5Float32UlpDistance(
                  previous.boundarySigma[index],
                  previousCache,
                ) +
                protocol.phase5Float32UlpDistance(
                  current.boundarySigma[index],
                  currentCache,
                );
              swappedCachePhaseScore +=
                protocol.phase5Float32UlpDistance(
                  previous.boundarySigma[index],
                  currentCache,
                ) +
                protocol.phase5Float32UlpDistance(
                  current.boundarySigma[index],
                  previousCache,
                );
              if (!Object.is(previousCache, currentCache)) {
                cachePhaseDifferenceCount++;
              }
              if (!Object.is(currentCache, state.sigma[index])) {
                currentCacheFieldMismatchCount++;
              }
              if (!Object.is(previousCache, state.previousSigma[index])) {
                previousCacheFieldMismatchCount++;
              }
            }
          }
          const cachePhaseAssignment = {
            cachePhaseScore,
            swappedCachePhaseScore,
            cachePhaseDifferenceCount,
            currentCacheFieldMismatchCount,
            previousCacheFieldMismatchCount,
            pass:
              report.convergenceMode !== "bounded-two-cycle" ||
              (state.previousBoundarySupersaturation !== null &&
                cachePhaseDifferenceCount > 0 &&
                currentCacheFieldMismatchCount === 0 &&
                previousCacheFieldMismatchCount === 0),
          };
          if (report.convergenceMode !== "bounded-two-cycle") {
            arrays.previousField = {
              ...arrays.previousField,
              required: false,
              observedPass: arrays.previousField.pass,
              pass: true,
            };
            arrays.previousBoundarySigma = {
              ...arrays.previousBoundarySigma,
              required: false,
              observedPass: arrays.previousBoundarySigma.pass,
              pass: true,
            };
          }
          const previousTrace =
            report.convergenceMode === "bounded-two-cycle"
              ? report.previousPhaseDriftTrace
              : null;
          const previousReference =
            report.convergenceMode === "bounded-two-cycle" ? previous : null;
          const scalars = {
            residual: binary32OrExactScalar(
              current.residual,
              report.residual,
            ),
            divergence: binary32OrExactScalar(
              current.divergenceResidual,
              report.divergenceResidual,
            ),
            shell: binary32OrExactScalar(
              current.shellInjection,
              report.shellClampDiagnostic,
            ),
            exchange: exactBinary32Scalar(
              current.surfaceExchange,
              report.surfaceExchangeDiagnostic,
            ),
            drift: binary32OrExactScalar(
              current.smootherDrift,
              report.smootherDriftDiagnostic,
            ),
            minimumExchange: binary32OrExactScalar(
              current.minLocalSurfaceExchange,
              report.minLocalSurfaceExchangeDiagnostic,
            ),
            currentTraceDrift: binary32OrExactScalar(
              current.smootherDrift,
              currentTrace?.smootherDrift ?? Number.NaN,
            ),
            currentTraceMaxInput: binary32OrExactScalar(
              current.maxAbsSweepInput,
              currentTrace?.maxAbsSweepInput ?? Number.NaN,
            ),
            currentTraceBound: binary32OrExactScalar(
              current.smootherDriftLimit,
              currentTrace?.smootherDriftLimit ?? Number.NaN,
            ),
            previousTraceDrift: binary32OrExactScalar(
              previousReference?.smootherDrift ?? null,
              previousTrace?.smootherDrift ?? null,
            ),
            previousTraceMaxInput: binary32OrExactScalar(
              previousReference?.maxAbsSweepInput ?? null,
              previousTrace?.maxAbsSweepInput ?? null,
            ),
            previousTraceBound: binary32OrExactScalar(
              previousReference?.smootherDriftLimit ?? null,
              previousTrace?.smootherDriftLimit ?? null,
            ),
          };
          const exact = {
            divergenceStatus:
              current.divergenceStatus === report.divergenceStatus,
            previousDivergenceStatus:
              report.convergenceMode !== "bounded-two-cycle" ||
              previous.divergenceStatus === report.previousDivergenceStatus,
            previousDivergence: binary32OrExactScalar(
              report.convergenceMode === "bounded-two-cycle"
                ? previous.divergenceResidual
                : null,
              report.convergenceMode === "bounded-two-cycle"
                ? report.previousDivergenceResidual
                : null,
            ).pass,
            mode: classification.classified === report.convergenceMode,
            currentUlp:
              classification.maximumCurrentStepUlpDistance ===
              report.maximumCurrentStepUlpDistance,
            twoBackUlp:
              classification.maximumTwoBackUlpDistance ===
              report.maximumTwoBackUlpDistance,
            historyReset:
              report.completedSweepsAfterMutation === report.sweeps,
            completeTrace:
              report.trace.length === report.sweeps &&
              report.trace.length > 0 &&
              traceAudit.every((entry) => entry.pass),
            previousBoundaryCache:
              report.convergenceMode !== "bounded-two-cycle" ||
              state.previousBoundarySupersaturation !== null,
            cachePhaseAssignment: cachePhaseAssignment.pass,
          };
          const positiveSourceExchange =
            fixture.farField === "dirichlet"
              ? current.shellInjection > 0 && current.surfaceExchange > 0
              : null;
          return {
            current,
            previous,
            classification,
            boundary,
            arrays,
            scalars,
            exact,
            cachePhaseAssignment,
            traceAudit,
            positiveSourceExchange,
            pass:
              Object.values(boundary).every((entry) => entry.pass) &&
              Object.values(arrays).every((entry) => entry.pass) &&
              Object.values(scalars).every((entry) => entry.pass) &&
              Object.values(exact).every(Boolean) &&
              positiveSourceExchange !== false,
          };
        }

        function expectedRenderFlags(occupancy, topology, dims) {
          const plane = dims.nx * dims.ny;
          const output = new Uint32Array(occupancy.length);
          const counts = (index) => {
            const k = Math.floor(index / plane);
            const remainder = index - k * plane;
            const j = Math.floor(remainder / dims.nx);
            const i = remainder - j * dims.nx;
            let nT = 0;
            let nZ = 0;
            if (i + 1 < dims.nx && occupancy[index + 1] !== 0) nT++;
            if (i > 0 && occupancy[index - 1] !== 0) nT++;
            if (j + 1 < dims.ny && occupancy[index + dims.nx] !== 0) nT++;
            if (j > 0 && occupancy[index - dims.nx] !== 0) nT++;
            if (
              i + 1 < dims.nx &&
              j > 0 &&
              occupancy[index + 1 - dims.nx] !== 0
            ) nT++;
            if (
              i > 0 &&
              j + 1 < dims.ny &&
              occupancy[index - 1 + dims.nx] !== 0
            ) nT++;
            if (k + 1 < dims.nz && occupancy[index + plane] !== 0) nZ++;
            if (k > 0 && occupancy[index - plane] !== 0) nZ++;
            return [nT, nZ];
          };
          for (let index = 0; index < occupancy.length; index++) {
            const [nT, nZ] = counts(index);
            if (
              occupancy[index] !== 0 ||
              (topology[index] & production.GPU_LK_TOPOLOGY_BOUNDARY) !== 0
            ) {
              output[index] =
                ((topology[index] & production.GPU_LK_TOPOLOGY_BOUNDARY) !== 0
                  ? production.GPU_LK_RENDER_BOUNDARY
                  : 0) |
                (nT << production.GPU_LK_RENDER_NT_SHIFT) |
                (nZ << production.GPU_LK_RENDER_NZ_SHIFT);
            }
          }
          return output;
        }

        function farFieldMean(occupancy, sigma, topology) {
          let sum = 0;
          let compensation = 0;
          let count = 0;
          for (let index = 0; index < occupancy.length; index++) {
            if (
              occupancy[index] !== 0 ||
              (topology[index] & production.GPU_LK_TOPOLOGY_FAR_FIELD) === 0
            ) {
              continue;
            }
            const value = sigma[index];
            const next = sum + value;
            compensation +=
              Math.abs(sum) >= Math.abs(value)
                ? sum - next + value
                : value - next + sum;
            sum = next;
            count++;
          }
          return count === 0 ? Number.NaN : (sum + compensation) / count;
        }

        function compareMetrics(reference, candidate) {
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
          const scalarNames = [
            "totalMass",
            "farFieldVapor",
            "depletionCenter",
            "depletionRim",
            "depletionRatio",
          ];
          const exact = Object.fromEntries(
            exactNames.map((name) => [
              name,
              {
                reference: reference[name],
                candidate: candidate[name],
                pass: Object.is(reference[name], candidate[name]),
              },
            ]),
          );
          const scalar = Object.fromEntries(
            scalarNames.map((name) => [
              name,
              Number.isNaN(reference[name]) && Number.isNaN(candidate[name])
                ? {
                    reference: reference[name],
                    candidate: candidate[name],
                    pass: true,
                  }
                : scalarComparison(
                    reference[name],
                    candidate[name],
                    protocol.PHASE5_SCALAR_TOLERANCES
                      .fieldDerivedMetricMaxAbs,
                  ),
            ]),
          );
          return {
            exact,
            scalar,
            pass:
              Object.values(exact).every((entry) => entry.pass) &&
              Object.values(scalar).every((entry) => entry.pass),
          };
        }

        function compareTimeline(reference, candidate) {
          const scalarPaths = [
            ["boundary", "simTimeSeconds"],
            ["densityTransform", "cSatRatioOldToNew"],
            ["densityTransform", "absoluteNumberDensitySumBefore"],
            ["densityTransform", "absoluteNumberDensitySumAfter"],
            ["densityTransform", "maxCellAbsoluteNumberDensityError"],
            ["densityTransform", "maxCellRelativeNumberDensityError"],
            ["reservoir", "shellClampTargetBefore"],
            ["reservoir", "shellClampTargetAfter"],
            ...[
              "cSatPerCubicMeter",
              "vKinMS",
              "x0M",
              "mIceLedger",
              "maximumKineticVelocityScaleMS",
              "maximumKineticFillRateScalePerSecond",
            ].flatMap((name) => [
              ["derivedBefore", name],
              ["derivedAfter", name],
            ]),
          ];
          const fields = Object.fromEntries(
            scalarPaths.map((path) => {
              const id = path.join(".");
              if (id.endsWith("maxCellAbsoluteNumberDensityError")) {
                const referenceValue = reference[path[0]][path[1]];
                const candidateValue = candidate[path[0]][path[1]];
                const cellScale =
                  Math.max(
                    Math.abs(
                      reference.densityTransform
                        .absoluteNumberDensitySumBefore,
                    ),
                    Math.abs(
                      candidate.densityTransform
                        .absoluteNumberDensitySumBefore,
                    ),
                  ) /
                  Math.max(
                    1,
                    reference.densityTransform
                      .activeUnattachedCellCount,
                  );
                const limit =
                  protocol.PHASE5_SCALAR_TOLERANCES
                    .eventDensityMaxRelative * cellScale;
                return [
                  id,
                  {
                    reference: referenceValue,
                    candidate: candidateValue,
                    difference: Math.abs(candidateValue - referenceValue),
                    limit,
                    pass:
                      Number.isFinite(referenceValue) &&
                      Number.isFinite(candidateValue) &&
                      referenceValue >= 0 &&
                      candidateValue >= 0 &&
                      Math.abs(candidateValue - referenceValue) <= limit,
                  },
                ];
              }
              return [
                id,
                scalarComparison(
                  reference[path[0]][path[1]],
                  candidate[path[0]][path[1]],
                  id.endsWith("maxCellRelativeNumberDensityError")
                    ? protocol.PHASE5_SCALAR_TOLERANCES.eventDensityMaxRelative
                    : 0,
                ),
              ];
            }),
          );
          const maxRelativePass =
            candidate.densityTransform.maxCellRelativeNumberDensityError <=
            protocol.PHASE5_SCALAR_TOLERANCES.eventDensityMaxRelative;
          const exact =
            reference.operator === candidate.operator &&
            reference.boundary.phase === candidate.boundary.phase &&
            reference.boundary.completedCycles ===
              candidate.boundary.completedCycles &&
            reference.boundary.tick === candidate.boundary.tick &&
            JSON.stringify(reference.beforeEnvironment) ===
              JSON.stringify(candidate.beforeEnvironment) &&
            JSON.stringify(reference.afterEnvironment) ===
              JSON.stringify(candidate.afterEnvironment) &&
            [
              "temperatureChanged",
              "activeUnattachedCellCount",
              "transformedCellCount",
              "transformedInteriorCellCount",
              "transformedDirichletShellCellCount",
            ].every(
              (name) =>
                reference.densityTransform[name] ===
                candidate.densityTransform[name],
            ) &&
            reference.reservoir.farField === candidate.reservoir.farField &&
            reference.reservoir.activeUnattachedShellCellCount ===
              candidate.reservoir.activeUnattachedShellCellCount &&
            reference.reservoir.shellReclampPending ===
              candidate.reservoir.shellReclampPending;
          return {
            exact,
            fields,
            maxRelativePass,
            pass:
              exact &&
              Object.values(fields).every((field) => field.pass) &&
              maxRelativePass,
          };
        }

        const fixtures = protocol.PHASE5_FIXTURES.filter(
          (fixture) => fixture.kind === "lk",
        );
        const stressFixtures = protocol.PHASE5_FIXTURES.filter(
          (fixture) =>
            fixture.kind === "stress" &&
            (
              fixture.stress.startsWith("lk-") ||
              fixture.stress === "signed-subsaturation"
            ),
        );
        const fixtureReports = [];
        const stressReports = [];
        const lifecycleControls = [];
        const productionMutationControls = [];
        let productionCycleControlsCaptured = false;
        let productionNoiseTickControlCaptured = false;
        let relaxationSnapshotControlCaptured = false;
        let cacheGrowthControlCaptured = false;
        let oneSidedNoiseGrowthControlCaptured = false;
        let checkpointResumeSnapshot = null;
        let positiveSourceControlsCaptured = false;
        let timelineControlsCaptured = false;
        let ledgerControlsCaptured = false;
        for (let fixtureOffset = 0; fixtureOffset < fixtures.length; fixtureOffset++) {
          const fixture = fixtures[fixtureOffset];
          const generation = fixtureOffset + 1;
          submissions.acknowledgeEdit(generation);
          const oracle = makeOracle(fixture);
          const arena = production.GpuBufferArena.create(
            device,
            generation,
            production.createGpuBufferPlan(fixture.dims, "lk"),
          );
          let solver = null;
          try {
            solver = await production.GpuLkSolver.create(
              device,
              submissions,
              arena,
              audit,
              solverInput(oracle),
            );
            const steps = [];
            const events = [];
            // Per-lane observations for the registered science inventory. Every `cpu` entry is
            // computed only from the float64 oracle or an independent host recomputation;
            // every `gpu` entry only from a GPU readback or the GPU operator's own report.
            const laneSteps = {
              attachmentDeltaLog: { cpu: [], gpu: [] },
              convergenceClassification: { cpu: [], gpu: [] },
              divergenceStatus: { cpu: [], gpu: [] },
              interfaceStepLog: { cpu: [], gpu: [] },
              noiseWitness: { cpu: [], gpu: [] },
              relaxationLog: { cpu: [], gpu: [] },
              surfaceDiscrete: { cpu: [], gpu: [] },
            };
            const laneTimeline = {
              cycleBoundary: { cpu: [], gpu: [] },
              densityTransform: { cpu: [], gpu: [] },
              reservoir: { cpu: [], gpu: [] },
            };
            let laneFinal = {
              boundaryMembershipOrder: { cpu: null, gpu: null },
              cachedBoundaryTuple: { cpu: null, gpu: null },
              domainExtents: { cpu: null, gpu: null },
              farFieldSet: { cpu: null, gpu: null },
              lastAttachmentDelta: { cpu: null, gpu: null },
              ledgerRule: { cpu: null, gpu: null },
              renderFlags: { cpu: null, gpu: null },
              surfacePolicy: { cpu: null, gpu: null },
              wallMask: { cpu: null, gpu: null },
            };
            const laneMeasures = {
              convergenceCriterion: 0,
              densityAfter: 0,
              densityBefore: 0,
              driftBound: { ratio: -1, left: 0, right: 0 },
              ledgerPartition: { left: 0, right: 0 },
              maxKineticFillIncrement: 0,
            };
            let independentPlacedFill = 0;
            let independentKineticDemand = 0;
            let independentClippedFill = 0;
            let independentHoleDeficit = 0;
            let independentSimTimeSeconds = 0;
            let independentClosedPlacedVaporUnits = 0;
            let independentSegmentStartFill = 0;
            let independentMIce = oracle.mIceLedger;
            let minimumDecisionMargin = Infinity;
            if (fixtureOffset === 0) {
              let advanceWithoutRelaxationRejected = false;
              try {
                await solver.advanceSurface(`${fixture.id}:invalid-advance`);
              } catch {
                advanceWithoutRelaxationRejected = true;
              }
              const atomicSnapshot = solver.readEvidenceState(
                "evidence-snapshot",
                `${fixture.id}:atomic-evidence`,
              );
              let evidenceOverlapRejected = false;
              try {
                await solver.relaxField(`${fixture.id}:overlap-relaxation`);
              } catch {
                evidenceOverlapRejected = true;
              }
              await atomicSnapshot;
              let innerReentry = null;
              const reentrantEnvironment = new Proxy(
                {
                  tempC: fixture.tempC,
                  sigmaInfinity: fixture.sigmaInfinity,
                },
                {
                  get(target, name, receiver) {
                    if (name === "tempC" && innerReentry === null) {
                      innerReentry = solver.relaxField(
                        `${fixture.id}:timeline-getter-reentry`,
                      );
                    }
                    if (name === "sigmaInfinity") {
                      throw new Error("intentional timeline staging failure");
                    }
                    return Reflect.get(target, name, receiver);
                  },
                },
              );
              let stagingFailureRejected = false;
              try {
                await solver.applyTimelineEnvironment(
                  reentrantEnvironment,
                  `${fixture.id}:timeline-staging-control`,
                );
              } catch {
                stagingFailureRejected = true;
              }
              let timelineReentryRejected = false;
              try {
                await innerReentry;
              } catch {
                timelineReentryRejected = true;
              }
              const usableAfterStagingFailure =
                JSON.stringify(solver.timelineEnvironment()) ===
                JSON.stringify({
                  tempC: fixture.tempC,
                  sigmaInfinity: fixture.sigmaInfinity,
                });
              let evidenceLabelGetterCalls = 0;
              const hostileEvidenceLabel = new Proxy(
                {},
                {
                  get() {
                    evidenceLabelGetterCalls++;
                    return 1;
                  },
                },
              );
              let hostileEvidenceLabelRejected = false;
              try {
                await solver.readEvidenceState(
                  "evidence-snapshot",
                  hostileEvidenceLabel,
                );
              } catch {
                hostileEvidenceLabelRejected = true;
              }
              let conversionLabelGetterCalls = 0;
              const hostileConversionLabel = new Proxy(
                {},
                {
                  get() {
                    conversionLabelGetterCalls++;
                    return 1;
                  },
                },
              );
              let hostileConversionLabelRejected = false;
              try {
                await solver.exportConversionSnapshot(
                  hostileConversionLabel,
                );
              } catch {
                hostileConversionLabelRejected = true;
              }
              let stepCoercionCalls = 0;
              const hostileStepLabel = {
                [Symbol.toPrimitive]() {
                  stepCoercionCalls++;
                  return "hostile-step";
                },
              };
              let hostileStepLabelRejected = false;
              try {
                await solver.step(hostileStepLabel);
              } catch {
                hostileStepLabelRejected = true;
              }
              let stressGetterCalls = 0;
              let stressInnerReentry = null;
              const hostileStressInput = new Proxy(
                { sigmaOpp: [fixture.sigmaInfinity] },
                {
                  get(target, name, receiver) {
                    if (name === "sigmaOpp") {
                      stressGetterCalls++;
                      if (stressInnerReentry === null) {
                        stressInnerReentry = solver.relaxField(
                          `${fixture.id}:stress-getter-reentry`,
                        );
                      }
                    }
                    return Reflect.get(target, name, receiver);
                  },
                },
              );
              await solver.runBoundaryStressDiagnostics(
                hostileStressInput,
                `${fixture.id}:stress-getter-control`,
              );
              let stressReentryRejected = false;
              try {
                await stressInnerReentry;
              } catch {
                stressReentryRejected = true;
              }
              lifecycleControls.push({
                id: "production-lifecycle-reentry-and-atomic-evidence",
                advanceWithoutRelaxationRejected,
                evidenceOverlapRejected,
                stagingFailureRejected,
                timelineReentryRejected,
                usableAfterStagingFailure,
                hostileEvidenceLabelRejected,
                evidenceLabelGetterCalls,
                hostileConversionLabelRejected,
                conversionLabelGetterCalls,
                hostileStepLabelRejected,
                stepCoercionCalls,
                stressGetterCalls,
                stressReentryRejected,
                pass:
                  advanceWithoutRelaxationRejected &&
                  evidenceOverlapRejected &&
                  stagingFailureRejected &&
                  timelineReentryRejected &&
                  usableAfterStagingFailure &&
                  hostileEvidenceLabelRejected &&
                  evidenceLabelGetterCalls === 0 &&
                  hostileConversionLabelRejected &&
                  conversionLabelGetterCalls === 0 &&
                  hostileStepLabelRejected &&
                  stepCoercionCalls === 0 &&
                  stressGetterCalls > 0 &&
                  stressReentryRejected,
              });
            }
            for (let step = 0; step < fixture.stop.value; step++) {
              if (
                fixture.timeline !== null &&
                step === fixture.timeline.completedStep
              ) {
                const environment = {
                  tempC: fixture.timeline.tempC,
                  sigmaInfinity: fixture.timeline.sigmaInfinity,
                };
                const beforeEventState = await solver.readEvidenceState(
                  "evidence-snapshot",
                  `${fixture.id}:event-${step}:before`,
                );
                const cpuEvent = oracle.applyTimelineEnvironment(environment);
                const gpuEvent = await solver.applyTimelineEnvironment(
                  environment,
                  `${fixture.id}:event-${step}`,
                );
                const eventState = await solver.readEvidenceState(
                  "evidence-snapshot",
                  `${fixture.id}:event-${step}:state`,
                );
                if (cpuEvent.densityTransform.temperatureChanged) {
                  independentClosedPlacedVaporUnits +=
                    (independentPlacedFill - independentSegmentStartFill) *
                    independentMIce;
                  independentSegmentStartFill = independentPlacedFill;
                  independentMIce = oracle.mIceLedger;
                }
                const eventPreservation = {
                  fill: exactArray(beforeEventState.fill, eventState.fill),
                  occupancy: exactArray(
                    beforeEventState.occupancy,
                    eventState.occupancy,
                  ),
                  wall: exactArray(beforeEventState.wall, eventState.wall),
                  topology: exactArray(
                    beforeEventState.topology,
                    eventState.topology,
                  ),
                  boundary: exactArray(
                    beforeEventState.boundaryIndices,
                    eventState.boundaryIndices,
                  ),
                  attachments: exactArray(
                    beforeEventState.attachmentIndices,
                    eventState.attachmentIndices,
                  ),
                  render: exactArray(
                    beforeEventState.renderFlags,
                    eventState.renderFlags,
                  ),
                  coefficientCleared: eventState.boundaryAttachmentCoefficient
                    .every((value) => value === 0),
                  boundarySigmaCleared: eventState.boundarySupersaturation
                    .every((value) => value === 0),
                  opposingCleared: eventState.opposingSupersaturation
                    .every((value) => value === 0),
                };
                if (!timelineControlsCaptured) {
                  const firstNegative = eventState.sigma.findIndex(
                    (value, index) =>
                      value < 0 &&
                      eventState.occupancy[index] === 0 &&
                      eventState.wall[index] === 0,
                  );
                  if (firstNegative < 0) {
                    throw new Error(
                      "timeline fixture lacks active signed transform witnesses",
                    );
                  }
                  const eventEvaluator = (candidate) =>
                    compareTimeline(cpuEvent, candidate.report).pass &&
                    fieldComparison(
                      oracle.sigma,
                      candidate.state.sigma,
                      protocol.PHASE5_FIELD_TOLERANCES.lkSigma,
                    ).pass &&
                    exactArray(
                      beforeEventState.fill,
                      candidate.state.fill,
                    ).pass &&
                    exactArray(
                      beforeEventState.occupancy,
                      candidate.state.occupancy,
                    ).pass &&
                    exactArray(
                      beforeEventState.topology,
                      candidate.state.topology,
                    ).pass;
                  const mutations = independent.mutateAndReject(
                    eventEvaluator,
                    {
                      report: structuredClone(gpuEvent),
                      state: structuredClone(eventState),
                    },
                    [
                      {
                        id: "production-signed-value-clamp",
                        mutate(candidate) {
                          candidate.state.sigma[firstNegative] = 0;
                        },
                      },
                      {
                        id: "production-skipped-shell-transform",
                        mutate(candidate) {
                          candidate.report.densityTransform
                            .transformedDirichletShellCellCount = 0;
                        },
                      },
                      {
                        id: "production-skipped-shell-reclamp",
                        mutate(candidate) {
                          candidate.report.reservoir.shellReclampPending =
                            false;
                        },
                      },
                    ],
                  );
                  productionMutationControls.push(...mutations);
                  timelineControlsCaptured = true;
                }
                events.push({
                  comparison: compareTimeline(cpuEvent, gpuEvent),
                  sigma: fieldComparison(
                    oracle.sigma,
                    eventState.sigma,
                    protocol.PHASE5_FIELD_TOLERANCES.lkSigma,
                  ),
                  preservation: eventPreservation,
                  controls: {
                    environment:
                      JSON.stringify(solver.timelineEnvironment()) ===
                      JSON.stringify(environment),
                    derived: Object.fromEntries(
                      Object.entries(solver.derivedScales()).map(
                        ([name, value]) => [
                          name,
                          scalarComparison(
                            name === "cSatPerCubicMeter"
                              ? core.cSat(oracle.tempC)
                              : name === "vKinMS"
                                ? oracle.vKinMS
                                : name === "x0M"
                                  ? oracle.x0M
                                  : name === "mIceLedger"
                                    ? oracle.mIceLedger
                                    : name ===
                                        "maximumKineticVelocityScaleMS"
                                      ? oracle.maximumKineticVelocityScaleMS
                                      : oracle
                                          .maximumKineticFillRateScalePerSecond,
                            value,
                          ),
                        ],
                      ),
                    ),
                  },
                });
                // Each lane's OWN timeline record. Only the discrete fields are published
                // here: the transform's real-valued sums are registered scalars compared
                // under their own tolerance, and binary64 and binary32 never agree exactly.
                const densityRecord = (report) => ({
                  temperatureChanged: report.densityTransform.temperatureChanged,
                  activeUnattachedCellCount:
                    report.densityTransform.activeUnattachedCellCount,
                  transformedCellCount:
                    report.densityTransform.transformedCellCount,
                  transformedInteriorCellCount:
                    report.densityTransform.transformedInteriorCellCount,
                  transformedDirichletShellCellCount:
                    report.densityTransform.transformedDirichletShellCellCount,
                });
                const reservoirRecord = (report) => ({
                  farField: report.reservoir.farField,
                  activeUnattachedShellCellCount:
                    report.reservoir.activeUnattachedShellCellCount,
                  shellReclampPending: report.reservoir.shellReclampPending,
                });
                const cycleBoundaryRecord = (report) => ({
                  operator: report.operator,
                  phase: report.boundary.phase,
                  completedCycles: report.boundary.completedCycles,
                  tick: report.boundary.tick,
                });
                laneTimeline.densityTransform.cpu.push(densityRecord(cpuEvent));
                laneTimeline.densityTransform.gpu.push(densityRecord(gpuEvent));
                laneTimeline.reservoir.cpu.push(reservoirRecord(cpuEvent));
                laneTimeline.reservoir.gpu.push(reservoirRecord(gpuEvent));
                laneTimeline.cycleBoundary.cpu.push(
                  cycleBoundaryRecord(cpuEvent),
                );
                laneTimeline.cycleBoundary.gpu.push(
                  cycleBoundaryRecord(gpuEvent),
                );
                laneMeasures.densityBefore +=
                  gpuEvent.densityTransform.absoluteNumberDensitySumBefore;
                laneMeasures.densityAfter +=
                  gpuEvent.densityTransform.absoluteNumberDensitySumAfter;
              }

              const cpuRelaxation = oracle.relaxField();
              const gpuRelaxation = await solver.relaxField(
                `${fixture.id}:relaxation-${step}`,
              );
              if (!gpuRelaxation.converged) {
                steps.push({
                  index: step,
                  cpuRelaxation,
                  gpuRelaxation,
                  pass: false,
                });
                break;
              }
              const publicCompactReport =
                production.decodeGpuLkCompactReport(
                  await production.readGpuBuffer(
                    device,
                    solver.reportBuffer(),
                    {
                      purpose: "compact-metric",
                      label: `${fixture.id}:public-report-${step}`,
                      generation,
                      byteOffset: 0,
                      byteLength: production.GPU_LK_REPORT_BYTES,
                    },
                    audit,
                  ),
                );
              const publicReportConsistency = {
                converged:
                  publicCompactReport.converged ===
                  gpuRelaxation.converged,
                convergenceMode:
                  publicCompactReport.convergenceMode ===
                  gpuRelaxation.convergenceMode,
                residual: Object.is(
                  publicCompactReport.residual,
                  gpuRelaxation.residual,
                ),
                divergence: Object.is(
                  publicCompactReport.divergence,
                  gpuRelaxation.divergenceResidual ?? 0,
                ),
                shellInjection: Object.is(
                  publicCompactReport.shellInjection,
                  gpuRelaxation.shellClampDiagnostic ?? 0,
                ),
                surfaceExchange: Object.is(
                  publicCompactReport.surfaceExchange,
                  gpuRelaxation.surfaceExchangeDiagnostic,
                ),
                smootherDrift: Object.is(
                  publicCompactReport.smootherDrift,
                  gpuRelaxation.smootherDriftDiagnostic,
                ),
                minimumExchange: Object.is(
                  publicCompactReport.minLocalSurfaceExchange,
                  gpuRelaxation.minLocalSurfaceExchangeDiagnostic,
                ),
                currentUlp:
                  publicCompactReport.maximumCurrentStepUlpDistance ===
                  gpuRelaxation.maximumCurrentStepUlpDistance,
                twoBackUlp:
                  publicCompactReport.maximumTwoBackUlpDistance ===
                  gpuRelaxation.maximumTwoBackUlpDistance,
                pass: false,
              };
              publicReportConsistency.pass = Object.entries(
                publicReportConsistency,
              ).every(
                ([name, value]) => name === "pass" || value === true,
              );
              if (!relaxationSnapshotControlCaptured) {
                const returnedConverged = gpuRelaxation.converged;
                gpuRelaxation.converged = false;
                const afterReturnedMutation =
                  solver.lastAcceptedRelaxation();
                gpuRelaxation.converged = returnedConverged;
                const getterSnapshot = solver.lastAcceptedRelaxation();
                if (
                  afterReturnedMutation === null ||
                  getterSnapshot === null ||
                  getterSnapshot.trace.length === 0
                ) {
                  throw new Error(
                    "accepted relaxation snapshot is unexpectedly absent",
                  );
                }
                const originalFirstDrift =
                  getterSnapshot.trace[0].smootherDrift;
                getterSnapshot.converged = false;
                getterSnapshot.trace[0].smootherDrift =
                  originalFirstDrift + 1;
                const afterGetterMutation =
                  solver.lastAcceptedRelaxation();
                lifecycleControls.push({
                  id: "production-last-relaxation-alias-mutation",
                  returnedMutationIsolated:
                    afterReturnedMutation.converged === true,
                  getterMutationIsolated:
                    afterGetterMutation?.converged === true &&
                    Object.is(
                      afterGetterMutation.trace[0]?.smootherDrift,
                      originalFirstDrift,
                    ),
                  pass:
                    afterReturnedMutation.converged === true &&
                    afterGetterMutation?.converged === true &&
                    Object.is(
                      afterGetterMutation.trace[0]?.smootherDrift,
                      originalFirstDrift,
                    ),
                });
                relaxationSnapshotControlCaptured = true;
              }
              const readyState = await solver.readEvidenceState(
                "evidence-snapshot",
                `${fixture.id}:ready-${step}`,
              );
              let checkpointConversion = {
                required: false,
                pass: true,
              };
              if (step === 0) {
                const conversion =
                  await solver.exportConversionSnapshot(
                    `${fixture.id}:conversion-${step}`,
                  );
                const encoded =
                  production.encodeGpuLkConversionSnapshot(conversion);
                const roundTrip =
                  production.gpuLkSnapshotFromDecodedCheckpoint(
                    core.decodeLKCheckpoint(encoded),
                  );
                checkpointConversion = {
                  required: true,
                  encodedBytes: encoded.byteLength,
                  metadata: {
                    expected: conversion.metadata,
                    actual: roundTrip.metadata,
                    pass:
                      JSON.stringify(conversion.metadata) ===
                      JSON.stringify(roundTrip.metadata),
                  },
                  occupancy: exactArray(
                    conversion.occupancy,
                    roundTrip.occupancy,
                  ),
                  fillBits: exactArray(
                    new Uint32Array(conversion.fill.buffer),
                    new Uint32Array(roundTrip.fill.buffer),
                  ),
                  sigmaBits: exactArray(
                    new Uint32Array(conversion.sigma.buffer),
                    new Uint32Array(roundTrip.sigma.buffer),
                  ),
                  state: {
                    occupancy: exactArray(
                      readyState.occupancy,
                      conversion.occupancy,
                    ),
                    fillBits: exactArray(
                      new Uint32Array(readyState.fill.buffer),
                      new Uint32Array(conversion.fill.buffer),
                    ),
                    sigmaBits: exactArray(
                      new Uint32Array(readyState.sigma.buffer),
                      new Uint32Array(conversion.sigma.buffer),
                    ),
                    pass: false,
                  },
                  pass: false,
                };
                checkpointConversion.state.pass =
                  checkpointConversion.state.occupancy.pass &&
                  checkpointConversion.state.fillBits.pass &&
                  checkpointConversion.state.sigmaBits.pass;
                checkpointConversion.pass =
                  checkpointConversion.metadata.pass &&
                  checkpointConversion.occupancy.pass &&
                  checkpointConversion.fillBits.pass &&
                  checkpointConversion.sigmaBits.pass &&
                  checkpointConversion.state.pass;
                if (checkpointResumeSnapshot === null) {
                  checkpointResumeSnapshot =
                    structuredClone(conversion);
                }
              }
              const stepFixture = {
                ...fixture,
                tempC: oracle.tempC,
                sigmaInfinity: oracle.sigmaInfinity,
              };
              const convergenceWitness = compareIndependentRelaxation(
                stepFixture,
                oracle.tick,
                gpuRelaxation,
                readyState,
              );
              const relaxationEvaluator = (candidate) =>
                compareIndependentRelaxation(
                  stepFixture,
                  oracle.tick,
                  candidate.report,
                  candidate.state,
                ).pass;
              if (
                gpuRelaxation.convergenceMode === "bounded-two-cycle" &&
                !productionCycleControlsCaptured
              ) {
                const boundaryIndex = readyState.boundaryIndices[0];
                if (boundaryIndex === undefined) {
                  throw new Error("bounded-cycle fixture has no boundary");
                }
                const captured = {
                  report: structuredClone(gpuRelaxation),
                  state: structuredClone(readyState),
                };
                if (gpuRelaxation.trace.length < 2) {
                  throw new Error(
                    "bounded-cycle mutation fixture lacks an earlier trace entry",
                  );
                }
                const changedReduction = independent.changedSumReduction(
                  convergenceWitness.current.exchangeTerms,
                  gpuRelaxation.surfaceExchangeDiagnostic,
                );
                if (changedReduction === null) {
                  throw new Error(
                    "bounded-cycle fixture lacks an order-sensitive raw reduction witness",
                  );
                }
                const mutations = independent.mutateAndReject(
                  relaxationEvaluator,
                  captured,
                  [
                    {
                      id: "production-residual-only-acceptance",
                      mutate(candidate) {
                        candidate.report.convergenceMode = "fixed-point";
                        candidate.report.residual = 0;
                        candidate.report.divergenceResidual =
                          stepFixture.divTol;
                      },
                    },
                    {
                      id: "production-inferred-smoother-drift",
                      mutate(candidate) {
                        candidate.report.smootherDriftDiagnostic = 0;
                      },
                    },
                    {
                      id: "production-omitted-smoother-drift",
                      mutate(candidate) {
                        candidate.report.previousPhaseDriftTrace = null;
                      },
                    },
                    {
                      id: "production-over-bound-smoother-drift",
                      mutate(candidate) {
                        const earlier = candidate.report.trace[0];
                        earlier.smootherDrift =
                          earlier.smootherDriftLimit * 2;
                      },
                    },
                    {
                      id: "production-unordered-reduction-shape",
                      mutate(candidate) {
                        candidate.report.surfaceExchangeDiagnostic =
                          changedReduction.value;
                      },
                    },
                    {
                      id: "production-in-place-boundary-replacement",
                      mutate(candidate) {
                        candidate.state.sigma[boundaryIndex] =
                          Math.fround(
                            candidate.state.sigma[boundaryIndex] + 0.01,
                          );
                      },
                    },
                    {
                      id: "production-wrong-aggregate-facet-mapping",
                      mutate(candidate) {
                        candidate.state
                          .boundaryAttachmentCoefficient[boundaryIndex] = 1;
                      },
                    },
                    {
                      id: "production-previous-boundary-cache-swap",
                      mutate(candidate) {
                        candidate.state.previousBoundarySupersaturation =
                          Float32Array.from(
                            candidate.state.boundarySupersaturation,
                          );
                      },
                    },
                    {
                      id: "production-boundary-membership-shift",
                      mutate(candidate) {
                        candidate.state.topology[boundaryIndex] &=
                          ~production.GPU_LK_TOPOLOGY_BOUNDARY;
                      },
                    },
                  ],
                );
                productionMutationControls.push(...mutations);
                productionMutationControls.push({
                  id: "production-unordered-reduction-raw-witness",
                  changedReduction,
                  pass:
                    !Object.is(
                      changedReduction.value,
                      gpuRelaxation.surfaceExchangeDiagnostic,
                    ),
                });
                productionCycleControlsCaptured = true;
              }
              if (
                fixture.noiseEpsilon > 0 &&
                !productionNoiseTickControlCaptured
              ) {
                const shiftedTickWitness = compareIndependentRelaxation(
                  stepFixture,
                  oracle.tick + 1,
                  gpuRelaxation,
                  readyState,
                );
                let changedCoefficientCount = 0;
                for (const index of readyState.boundaryIndices) {
                  if (
                    !Object.is(
                      convergenceWitness.current.coefficient[index],
                      shiftedTickWitness.current.coefficient[index],
                    )
                  ) {
                    changedCoefficientCount++;
                  }
                }
                productionMutationControls.push({
                  id: "production-one-tick-noise-shift",
                  originalTick: oracle.tick,
                  shiftedTick: oracle.tick + 1,
                  changedCoefficientCount,
                  rejected: !shiftedTickWitness.pass,
                  pass:
                    changedCoefficientCount > 0 &&
                    !shiftedTickWitness.pass,
                });
                productionNoiseTickControlCaptured = true;
              }
              if (
                fixture.farField === "dirichlet" &&
                convergenceWitness.positiveSourceExchange === true &&
                !positiveSourceControlsCaptured
              ) {
                const captured = {
                  report: structuredClone(gpuRelaxation),
                  state: structuredClone(readyState),
                };
                const mutations = independent.mutateAndReject(
                  relaxationEvaluator,
                  captured,
                  [
                    {
                      id: "production-zero-shell-source-accepted",
                      mutate(candidate) {
                        candidate.report.shellClampDiagnostic = 0;
                      },
                    },
                    {
                      id: "production-negative-shell-source-accepted",
                      mutate(candidate) {
                        candidate.report.shellClampDiagnostic = -1;
                      },
                    },
                    {
                      id: "production-zero-surface-exchange-accepted",
                      mutate(candidate) {
                        candidate.report.surfaceExchangeDiagnostic = 0;
                      },
                    },
                    {
                      id: "production-negative-surface-exchange-accepted",
                      mutate(candidate) {
                        candidate.report.surfaceExchangeDiagnostic = -1;
                      },
                    },
                  ],
                );
                productionMutationControls.push(...mutations);
                positiveSourceControlsCaptured = true;
              }
              const readySigma = fieldComparison(
                oracle.sigma,
                readyState.sigma,
                protocol.PHASE5_FIELD_TOLERANCES.lkSigma,
              );
              const readyFill = fieldComparison(
                oracle.f,
                readyState.fill,
                protocol.PHASE5_FIELD_TOLERANCES.lkFill,
              );
              const readyOccupancy = exactArray(
                oracle.a,
                readyState.occupancy,
              );
              const cpuReadyBoundary = oracle.boundaryCells();
              const readyBoundary = exactArray(
                cpuReadyBoundary,
                readyState.boundaryIndices,
              );
              // The relaxation-ready facts each lane holds on its own, captured before the
              // interface update mutates either one.
              const laneReadyCpu = {
                tick: oracle.tick,
                activeCellCount: activeCellTotal(oracle.a, oracle.wall),
                boundarySize: cpuReadyBoundary.length,
              };
              const laneReadyGpu = {
                tick: solver.tick,
                activeCellCount: solver.activeCellCount(),
                boundarySize: solver.boundarySize(),
              };
              laneSteps.noiseWitness.cpu.push({
                tick: laneReadyCpu.tick,
                epsilon: oracle.noiseEpsilon,
                markedBoundaryCellCount: noiseMarkedBoundaryCount(
                  cpuReadyBoundary,
                  oracle.rngSeed,
                  laneReadyCpu.tick,
                ),
              });
              laneSteps.noiseWitness.gpu.push({
                tick: laneReadyGpu.tick,
                epsilon: solver.configuration().noiseEpsilon,
                markedBoundaryCellCount: noiseMarkedBoundaryCount(
                  readyState.boundaryIndices,
                  solver.configuration().rngSeed,
                  laneReadyGpu.tick,
                ),
              });
              const coefficientReference = [];
              const boundarySigmaReference = [];
              const opposingReference = [];
              const coefficientCandidate = [];
              const boundarySigmaCandidate = [];
              const opposingCandidate = [];
              for (const index of oracle.boundaryCells()) {
                const boundary = oracle.boundaryState(index);
                coefficientReference.push(boundary.alphaHKBoundary);
                boundarySigmaReference.push(boundary.sigmaBoundary);
                opposingReference.push(boundary.sigmaOpp);
                coefficientCandidate.push(
                  readyState.boundaryAttachmentCoefficient[index],
                );
                boundarySigmaCandidate.push(
                  readyState.boundarySupersaturation[index],
                );
                opposingCandidate.push(
                  readyState.opposingSupersaturation[index],
                );
              }
              const caches = {
                coefficient: fieldComparison(
                  coefficientReference,
                  coefficientCandidate,
                  scalarFieldTolerance,
                ),
                boundarySigma: fieldComparison(
                  boundarySigmaReference,
                  boundarySigmaCandidate,
                  protocol.PHASE5_FIELD_TOLERANCES.lkSigma,
                ),
                opposing: fieldComparison(
                  opposingReference,
                  opposingCandidate,
                  protocol.PHASE5_FIELD_TOLERANCES.lkSigma,
                ),
              };
              const relaxation = compareRelaxation(
                cpuRelaxation,
                gpuRelaxation,
                fixture.farField,
              );
              const attachedTotalBefore = solver.attachedCount();
              const surfaceWitness = independent.replaySurface(
                readyState,
                stepFixture,
                oracle.vKinMS,
                attachedTotalBefore,
              );
              const surfaceGrowthMatches = (candidateState) => {
                const candidateSurface = independent.replaySurface(
                  candidateState,
                  stepFixture,
                  oracle.vKinMS,
                  attachedTotalBefore,
                );
                return (
                  exactArray(
                    surfaceWitness.rawDemand,
                    candidateSurface.rawDemand,
                  ).pass &&
                  exactArray(
                    surfaceWitness.fill,
                    candidateSurface.fill,
                  ).pass &&
                  Object.entries(surfaceWitness.report).every(
                    ([name, expected]) =>
                      Object.is(expected, candidateSurface.report[name]),
                  )
                );
              };
              if (!cacheGrowthControlCaptured) {
                const growthIndex = readyState.boundaryIndices.find(
                  (index) => surfaceWitness.rawDemand[index] > 0,
                );
                if (growthIndex === undefined) {
                  throw new Error(
                    "cache/growth mutation fixture lacks positive demand",
                  );
                }
                const candidateState = structuredClone(readyState);
                candidateState.boundarySupersaturation[growthIndex] =
                  Math.fround(
                    candidateState.boundarySupersaturation[growthIndex] *
                      0.9,
                  );
                const acceptedCacheRejected =
                  !compareIndependentRelaxation(
                    stepFixture,
                    oracle.tick,
                    gpuRelaxation,
                    candidateState,
                  ).pass;
                const growthRejected =
                  !surfaceGrowthMatches(candidateState);
                productionMutationControls.push({
                  id: "production-cache-growth-mismatch",
                  growthIndex,
                  acceptedCacheRejected,
                  growthRejected,
                  pass: acceptedCacheRejected && growthRejected,
                });
                cacheGrowthControlCaptured = true;
              }
              if (
                fixture.noiseEpsilon > 0 &&
                !oneSidedNoiseGrowthControlCaptured
              ) {
                const noiseFactor = Math.fround(
                  1 - Math.fround(fixture.noiseEpsilon),
                );
                const growthIndex = readyState.boundaryIndices.find(
                  (index) =>
                    core.randomBit(
                      fixture.rngSeed,
                      index,
                      oracle.tick,
                      core.STREAM_NOISE_ALPHA_HK,
                    ) === 1 &&
                    readyState.boundaryAttachmentCoefficient[index] > 0 &&
                    surfaceWitness.rawDemand[index] > 0,
                );
                if (growthIndex === undefined) {
                  throw new Error(
                    "one-sided noise mutation lacks a noisy growing boundary",
                  );
                }
                const candidateState = structuredClone(readyState);
                candidateState.boundaryAttachmentCoefficient[growthIndex] =
                  Math.fround(
                    candidateState.boundaryAttachmentCoefficient[
                      growthIndex
                    ] / noiseFactor,
                  );
                const acceptedCacheRejected =
                  !compareIndependentRelaxation(
                    stepFixture,
                    oracle.tick,
                    gpuRelaxation,
                    candidateState,
                  ).pass;
                const growthRejected =
                  !surfaceGrowthMatches(candidateState);
                productionMutationControls.push({
                  id: "production-noise-on-one-side",
                  growthIndex,
                  acceptedCacheRejected,
                  growthRejected,
                  pass: acceptedCacheRejected && growthRejected,
                });
                oneSidedNoiseGrowthControlCaptured = true;
              }
              minimumDecisionMargin = Math.min(
                minimumDecisionMargin,
                surfaceWitness.minimumDecisionMargin,
              );
              const cpuSurface = oracle.advanceSurface();
              const gpuSurface = await solver.advanceSurface(
                `${fixture.id}:surface-${step}`,
              );
              const finalState = await solver.readEvidenceState(
                "evidence-snapshot",
                `${fixture.id}:surface-${step}:state`,
              );
              const fields = {
                sigma: fieldComparison(
                  oracle.sigma,
                  finalState.sigma,
                  protocol.PHASE5_FIELD_TOLERANCES.lkSigma,
                ),
                fill: fieldComparison(
                  oracle.f,
                  finalState.fill,
                  protocol.PHASE5_FIELD_TOLERANCES.lkFill,
                ),
              };
              const exact = {
                occupancy: exactArray(
                  surfaceWitness.occupancy,
                  finalState.occupancy,
                ),
                wall: exactArray(oracle.wall, finalState.wall),
                topology: exactArray(
                  surfaceWitness.topology,
                  finalState.topology,
                ),
                boundaryOrder: exactArray(
                  surfaceWitness.boundaryIndices,
                  finalState.boundaryIndices,
                ),
                attachmentOrder: exactArray(
                  surfaceWitness.attachmentIndices,
                  finalState.attachmentIndices,
                ),
                renderFlags: exactArray(
                  surfaceWitness.renderFlags,
                  finalState.renderFlags,
                ),
                cpuOccupancy: exactArray(oracle.a, finalState.occupancy),
                cpuTopology: exactArray(
                  topologyFor(oracle),
                  finalState.topology,
                ),
                cpuBoundaryOrder: exactArray(
                  oracle.boundaryCells(),
                  finalState.boundaryIndices,
                ),
                cpuAttachmentOrder: exactArray(
                  oracle.lastAttached,
                  finalState.attachmentIndices,
                ),
              };
              const surface = Object.fromEntries(
                Object.entries(surfaceWitness.report).map(([name, expected]) => [
                  name,
                  typeof expected === "boolean"
                    ? {
                        expected,
                        actual: gpuSurface[name],
                        pass: expected === gpuSurface[name],
                      }
                    : Number.isInteger(expected) &&
                        ["attachedNow", "holeFillCount"].includes(name)
                      ? {
                          expected,
                          actual: gpuSurface[name],
                          pass: expected === gpuSurface[name],
                        }
                      : binary32ScalarComparison(
                          expected,
                          gpuSurface[name],
                        ),
                ]),
              );
              surface.cpuSecondary = {
                attachedNow:
                  cpuSurface.attachedNow === gpuSurface.attachedNow,
                holeFillCount:
                  cpuSurface.holeFillCount === gpuSurface.holeFillCount,
                stalled: cpuSurface.stalled === gpuSurface.stalled,
                maxKineticFillIncrement: scalarComparison(
                  cpuSurface.maxKineticFillIncrement,
                  gpuSurface.maxKineticFillIncrement,
                ).pass,
                deltaTimeSeconds: scalarComparison(
                  cpuSurface.deltaTimeSeconds,
                  gpuSurface.deltaTimeSeconds,
                ).pass,
                pass: false,
              };
              surface.cpuSecondary.pass = Object.entries(
                surface.cpuSecondary,
              ).every(([name, value]) => name === "pass" || value === true);
              independentPlacedFill += surfaceWitness.report.placedFill;
              independentKineticDemand +=
                surfaceWitness.report.kineticDemand;
              independentClippedFill +=
                surfaceWitness.report.saturationClippedFill;
              independentHoleDeficit +=
                surfaceWitness.report.holeFillDeficit;
              independentSimTimeSeconds +=
                surfaceWitness.report.deltaTimeSeconds;
              const cpuLedger = oracle.ledger();
              const gpuLedger = solver.ledger();
              const independentFillVaporUnits =
                independentClosedPlacedVaporUnits +
                (independentPlacedFill - independentSegmentStartFill) *
                  independentMIce;
              const ledger = {
                rule: {
                  expected: "LibbrechtKinetics",
                  actual: gpuLedger.rule,
                  pass: gpuLedger.rule === "LibbrechtKinetics",
                },
                claim: {
                  actual: gpuLedger.claim,
                  pass:
                    typeof gpuLedger.claim === "string" &&
                    gpuLedger.claim.includes("fill ledger") &&
                    gpuLedger.claim.includes("saturation clipping") &&
                    gpuLedger.claim.includes("signed"),
                },
                nullClaims: {
                  pass:
                    gpuLedger.totalMassBD === null &&
                    gpuLedger.dirichletMeter === null,
                },
                fillLedgerIceCells: scalarComparison(
                  independentPlacedFill,
                  gpuLedger.fillLedgerIceCells,
                ),
                fillLedgerVaporUnits: scalarComparison(
                  independentFillVaporUnits,
                  gpuLedger.fillLedgerVaporUnits,
                ),
                closedPlacedFillVaporUnits: scalarComparison(
                  independentClosedPlacedVaporUnits,
                  gpuLedger.closedPlacedFillVaporUnits,
                ),
                currentTemperatureSegmentStartFillIceCells:
                  scalarComparison(
                    independentSegmentStartFill,
                    gpuLedger
                      .currentTemperatureSegmentStartFillIceCells,
                  ),
                currentTemperatureSegmentMIceLedger: scalarComparison(
                  independentMIce,
                  gpuLedger.currentTemperatureSegmentMIceLedger,
                ),
                kineticDemand: scalarComparison(
                  independentKineticDemand,
                  gpuLedger.kineticDemand,
                ),
                holeFillDeficit: scalarComparison(
                  independentHoleDeficit,
                  gpuLedger.holeFillDeficit,
                ),
                saturationClippedFill: scalarComparison(
                  independentClippedFill,
                  gpuLedger.saturationClippedFill,
                ),
                lastDivergenceResidual: exactOrFiniteScalar(
                  fixture.farField === "dirichlet"
                    ? convergenceWitness.current.divergenceResidual
                    : null,
                  gpuLedger.lastDivergenceResidual,
                  protocol.PHASE5_SCALAR_TOLERANCES.divergenceResidualLimit,
                ),
                cpuSecondary: {
                  pass: [
                    "fillLedgerIceCells",
                    "fillLedgerVaporUnits",
                    "holeFillDeficit",
                    "saturationClippedFill",
                  ].every(
                    (name) =>
                      scalarComparison(
                        cpuLedger[name],
                        gpuLedger[name],
                      ).pass,
                  ),
                },
              };
              if (
                independentClosedPlacedVaporUnits > 0 &&
                !ledgerControlsCaptured
              ) {
                const ledgerEvaluator = (candidate) =>
                  binary32OrExactScalar(
                    independentPlacedFill,
                    candidate.fillLedgerIceCells,
                  ).pass &&
                  scalarComparison(
                    independentFillVaporUnits,
                    candidate.fillLedgerVaporUnits,
                  ).pass &&
                  scalarComparison(
                    independentKineticDemand,
                    candidate.kineticDemand,
                  ).pass &&
                  binary32OrExactScalar(
                    independentClippedFill,
                    candidate.saturationClippedFill,
                  ).pass &&
                  binary32OrExactScalar(
                    independentHoleDeficit,
                    candidate.holeFillDeficit,
                  ).pass;
                const mutations = independent.mutateAndReject(
                  ledgerEvaluator,
                  structuredClone(gpuLedger),
                  [
                    {
                      id: "production-final-temperature-ledger-rescaling",
                      mutate(candidate) {
                        candidate.fillLedgerVaporUnits =
                          independentPlacedFill * independentMIce;
                      },
                    },
                    {
                      id: "production-omitted-cumulative-kinetic-demand",
                      mutate(candidate) {
                        candidate.kineticDemand = 0;
                      },
                    },
                  ],
                );
                productionMutationControls.push(...mutations);
                ledgerControlsCaptured = true;
              }
              const cpuMetrics = core.computeMetrics(
                oracle.a,
                oracle.f,
                oracle.sigma,
                oracle.dims,
                oracle.center,
                oracle.tick,
                farFieldMean(
                  oracle.a,
                  oracle.sigma,
                  topologyFor(oracle),
                ),
                oracle.wall,
              );
              const gpuMetrics = core.computeMetrics(
                Uint8Array.from(finalState.occupancy),
                Float64Array.from(finalState.fill),
                Float64Array.from(finalState.sigma),
                oracle.dims,
                oracle.center,
                solver.tick,
                farFieldMean(
                  finalState.occupancy,
                  finalState.sigma,
                  finalState.topology,
                ),
                Uint8Array.from(finalState.wall),
              );
              const metrics = compareMetrics(cpuMetrics, gpuMetrics);
              const gpuDerived = solver.derivedScales();
              const expectedConfiguration = {
                surfacePolicy: fixture.surfacePolicy,
                dims: fixture.dims,
                dxUm: fixture.dxUm,
                pressurePa: fixture.pressurePa,
                paramSet: fixture.paramSet,
                cflFill: fixture.cflFill,
                relaxTol: fixture.relaxTol,
                divTol: fixture.divTol,
                relaxMaxSweeps: fixture.relaxMaxSweeps,
                rngSeed: fixture.rngSeed,
                noiseEpsilon: fixture.noiseEpsilon,
                farField: fixture.farField,
                domain: fixture.domain,
                center: oracle.center,
              };
              const expectedBounds = {
                iMin: fixture.dims.nx,
                iMax: 0,
                jMin: fixture.dims.ny,
                jMax: 0,
                kMin: fixture.dims.nz,
                kMax: 0,
              };
              let expectedActiveCellCount = 0;
              const plane = fixture.dims.nx * fixture.dims.ny;
              for (let index = 0; index < finalState.occupancy.length; index++) {
                if (
                  finalState.occupancy[index] === 0 &&
                  finalState.wall[index] === 0
                ) {
                  expectedActiveCellCount++;
                }
                if (finalState.occupancy[index] === 0) continue;
                const k = Math.floor(index / plane);
                const remainder = index - k * plane;
                const j = Math.floor(remainder / fixture.dims.nx);
                const i = remainder - j * fixture.dims.nx;
                expectedBounds.iMin = Math.min(expectedBounds.iMin, i);
                expectedBounds.iMax = Math.max(expectedBounds.iMax, i);
                expectedBounds.jMin = Math.min(expectedBounds.jMin, j);
                expectedBounds.jMax = Math.max(expectedBounds.jMax, j);
                expectedBounds.kMin = Math.min(expectedBounds.kMin, k);
                expectedBounds.kMax = Math.max(expectedBounds.kMax, k);
              }
              const controls = {
                checkpointConversion,
                configuration: {
                  expected: expectedConfiguration,
                  actual: solver.configuration(),
                  pass:
                    JSON.stringify(expectedConfiguration) ===
                    JSON.stringify(solver.configuration()),
                },
                tick: {
                  expected: oracle.tick,
                  actual: solver.tick,
                  pass: oracle.tick === solver.tick,
                },
                simTimeSeconds: scalarComparison(
                  independentSimTimeSeconds,
                  solver.simTimeSeconds,
                ),
                cpuSimTimeSeconds: scalarComparison(
                  oracle.simTimeSeconds,
                  solver.simTimeSeconds,
                ),
                tempC: {
                  expected: oracle.tempC,
                  actual: solver.tempC,
                  pass: Object.is(oracle.tempC, solver.tempC),
                },
                sigmaInfinity: {
                  expected: oracle.sigmaInfinity,
                  actual: solver.sigmaInfinity,
                  pass: Object.is(
                    oracle.sigmaInfinity,
                    solver.sigmaInfinity,
                  ),
                },
                timelineEnvironment: {
                  expected: oracle.timelineEnvironment(),
                  actual: solver.timelineEnvironment(),
                  pass:
                    JSON.stringify(oracle.timelineEnvironment()) ===
                    JSON.stringify(solver.timelineEnvironment()),
                },
                derivedScales: {
                  fields: {
                    cSatPerCubicMeter: scalarComparison(
                      core.cSat(oracle.tempC),
                      gpuDerived.cSatPerCubicMeter,
                    ),
                    vKinMS: scalarComparison(
                      oracle.vKinMS,
                      gpuDerived.vKinMS,
                    ),
                    x0M: scalarComparison(oracle.x0M, gpuDerived.x0M),
                    mIceLedger: scalarComparison(
                      oracle.mIceLedger,
                      gpuDerived.mIceLedger,
                    ),
                    maximumKineticVelocityScaleMS: scalarComparison(
                      oracle.maximumKineticVelocityScaleMS,
                      gpuDerived.maximumKineticVelocityScaleMS,
                    ),
                    maximumKineticFillRateScalePerSecond: scalarComparison(
                      oracle.maximumKineticFillRateScalePerSecond,
                      gpuDerived.maximumKineticFillRateScalePerSecond,
                    ),
                  },
                  pass: false,
                },
                lastMaxFillVelocityMS: scalarComparison(
                  surfaceWitness.lastMaxFillVelocityMS,
                  solver.lastMaxFillVelocityMS,
                ),
                boundarySize: {
                  expected: surfaceWitness.boundaryIndices.length,
                  actual: solver.boundarySize(),
                  pass:
                    surfaceWitness.boundaryIndices.length ===
                    solver.boundarySize(),
                },
                attachedCount: {
                  expected: surfaceWitness.attachedTotalAfter,
                  actual: solver.attachedCount(),
                  pass:
                    surfaceWitness.attachedTotalAfter ===
                    solver.attachedCount(),
                },
                activeCellCount: {
                  expected: expectedActiveCellCount,
                  actual: solver.activeCellCount(),
                  pass:
                    expectedActiveCellCount === solver.activeCellCount(),
                },
                bounds: {
                  expected: expectedBounds,
                  actual: solver.bounds(),
                  pass:
                    JSON.stringify(expectedBounds) ===
                    JSON.stringify(solver.bounds()),
                },
                cyclePhase: {
                  expected: "boundary",
                  actual: solver.cyclePhase(),
                  pass: solver.cyclePhase() === "boundary",
                },
                lastAttachmentDelta: {
                  expected: surfaceWitness.report.attachedNow,
                  actual: solver.lastAttachmentDelta(),
                  pass:
                    surfaceWitness.report.attachedNow ===
                    solver.lastAttachmentDelta(),
                },
                lastAcceptedRelaxation: {
                  expected: gpuRelaxation,
                  actual: solver.lastAcceptedRelaxation(),
                  pass:
                    JSON.stringify(gpuRelaxation) ===
                    JSON.stringify(solver.lastAcceptedRelaxation()),
                },
                holeFillCountTotal: {
                  expected: oracle.holeFillCountTotal,
                  actual: solver.holeFillCountTotal(),
                  pass:
                    oracle.holeFillCountTotal === solver.holeFillCountTotal(),
                },
                largestExtent: {
                  expected: oracle.largestExtent(),
                  actual: solver.largestExtent(),
                  pass: oracle.largestExtent() === solver.largestExtent(),
                },
                domainContact: {
                  expected: oracle.domainContact(),
                  actual: solver.domainContact(),
                  pass:
                    oracle.domainContact() === solver.domainContact() &&
                    !solver.domainContact(),
                },
              };
              controls.derivedScales.pass = Object.values(
                controls.derivedScales.fields,
              ).every((entry) => entry.pass);
              const noNoisePhase =
                fixture.noiseEpsilon > 0
                  ? independent.replayRelaxationPhase(
                      core,
                      protocol,
                      readyState.previousSigma,
                      readyState.sigma,
                      readyState,
                      { ...stepFixture, noiseEpsilon: 0 },
                      oracle.tick - 1,
                    )
                  : null;
              const noisyCells = [];
              if (noNoisePhase !== null) {
                for (const index of readyState.boundaryIndices) {
                  const bit = core.randomBit(
                    fixture.rngSeed,
                    index,
                    oracle.tick - 1,
                    core.STREAM_NOISE_ALPHA_HK,
                  );
                  if (
                    bit === 1 &&
                    convergenceWitness.current.coefficient[index] !==
                      noNoisePhase.coefficient[index]
                  ) {
                    noisyCells.push(index);
                  }
                }
              }
              const noiseWitness = {
                stream: core.STREAM_NOISE_ALPHA_HK,
                tick: oracle.tick - 1,
                epsilon: fixture.noiseEpsilon,
                changedBoundaryCellCount: noisyCells.length,
                sample: noisyCells[0] ?? null,
                pass:
                  fixture.noiseEpsilon === 0 || noisyCells.length > 0,
              };
              const compactPhase = (phase) => ({
                residual: phase.residual,
                divergenceResidual: phase.divergenceResidual,
                divergenceStatus: phase.divergenceStatus,
                shellInjection: phase.shellInjection,
                surfaceExchange: phase.surfaceExchange,
                smootherDrift: phase.smootherDrift,
                minLocalSurfaceExchange: phase.minLocalSurfaceExchange,
                maxAbsSweepInput: phase.maxAbsSweepInput,
                smootherDriftLimit: phase.smootherDriftLimit,
                driftBoundPassed: phase.driftBoundPassed,
                maximumCurrentStepUlpDistance:
                  phase.maximumCurrentStepUlpDistance,
                activeCellCount: phase.activeCellCount,
                boundaryCount: phase.boundary.length,
              });
              const convergenceRecord = {
                classification: convergenceWitness.classification,
                boundary: convergenceWitness.boundary,
                arrays: convergenceWitness.arrays,
                scalars: convergenceWitness.scalars,
                exact: convergenceWitness.exact,
                cachePhaseAssignment:
                  convergenceWitness.cachePhaseAssignment,
                traceAudit: convergenceWitness.traceAudit,
                positiveSourceExchange:
                  convergenceWitness.positiveSourceExchange,
                current: compactPhase(convergenceWitness.current),
                previous: compactPhase(convergenceWitness.previous),
                pass: convergenceWitness.pass,
              };
              const pass =
                relaxation.pass &&
                convergenceWitness.pass &&
                publicReportConsistency.pass &&
                readySigma.pass &&
                readyFill.pass &&
                readyOccupancy.pass &&
                readyBoundary.pass &&
                Object.values(caches).every((comparison) => comparison.pass) &&
                Object.values(fields).every((comparison) => comparison.pass) &&
                Object.values(exact).every((comparison) => comparison.pass) &&
                Object.values(surface).every((comparison) =>
                  typeof comparison === "boolean"
                    ? comparison
                    : comparison.pass,
                ) &&
                Object.values(ledger).every((comparison) => comparison.pass) &&
                metrics.pass &&
                Object.values(controls).every(
                  (comparison) => comparison.pass,
                ) &&
                noiseWitness.pass;
              steps.push({
                index: step,
                cpuRelaxation,
                gpuRelaxation,
                cpuSurface,
                gpuSurface,
                relaxation,
                convergenceWitness: convergenceRecord,
                publicReportConsistency,
                readySigma,
                readyFill,
                readyOccupancy,
                readyBoundary,
                caches,
                surface,
                fields,
                exact,
                ledger,
                ledgerValues: {
                  cpu: cpuLedger,
                  gpu: gpuLedger,
                },
                metrics,
                metricValues: {
                  cpu: cpuMetrics,
                  gpu: gpuMetrics,
                },
                controls,
                noiseWitness,
                pass,
              });
              laneSteps.convergenceClassification.cpu.push({
                mode: convergenceWitness.classification.classified,
                maximumCurrentStepUlpDistance:
                  convergenceWitness.classification
                    .maximumCurrentStepUlpDistance,
                maximumTwoBackUlpDistance:
                  convergenceWitness.classification.maximumTwoBackUlpDistance,
              });
              laneSteps.convergenceClassification.gpu.push({
                mode: gpuRelaxation.convergenceMode,
                maximumCurrentStepUlpDistance:
                  gpuRelaxation.maximumCurrentStepUlpDistance,
                maximumTwoBackUlpDistance:
                  gpuRelaxation.maximumTwoBackUlpDistance,
              });
              laneSteps.divergenceStatus.cpu.push(
                convergenceWitness.current.divergenceStatus,
              );
              laneSteps.divergenceStatus.gpu.push(
                gpuRelaxation.divergenceStatus,
              );
              // The relaxation log's sweep counts are a registered per-lane diagnostic, so the
              // published record carries each lane's converged state, its own relaxation
              // domain size, and which diagnostics its own far-field condition defines.
              laneSteps.relaxationLog.cpu.push({
                converged: cpuRelaxation.converged,
                activeCellCount: laneReadyCpu.activeCellCount,
                boundarySize: laneReadyCpu.boundarySize,
                divergenceApplicable: cpuRelaxation.divergenceResidual !== null,
                shellClampApplicable:
                  cpuRelaxation.shellClampDiagnostic !== null,
                smootherDriftApplicable:
                  cpuRelaxation.smootherDriftDiagnostic !== null,
              });
              laneSteps.relaxationLog.gpu.push({
                converged: gpuRelaxation.converged,
                activeCellCount: laneReadyGpu.activeCellCount,
                boundarySize: laneReadyGpu.boundarySize,
                divergenceApplicable: gpuRelaxation.divergenceResidual !== null,
                shellClampApplicable:
                  gpuRelaxation.shellClampDiagnostic !== null,
                smootherDriftApplicable:
                  gpuRelaxation.smootherDriftDiagnostic !== null,
              });
              laneSteps.surfaceDiscrete.cpu.push({
                attachedNow: cpuSurface.attachedNow,
                holeFillCount: cpuSurface.holeFillCount,
                stalled: cpuSurface.stalled,
                skippedUnconverged: cpuSurface.skippedUnconverged,
              });
              laneSteps.surfaceDiscrete.gpu.push({
                attachedNow: gpuSurface.attachedNow,
                holeFillCount: gpuSurface.holeFillCount,
                stalled: gpuSurface.stalled,
                skippedUnconverged: gpuSurface.skippedUnconverged,
              });
              laneSteps.interfaceStepLog.cpu.push({
                tick: oracle.tick,
                attachedCount: attachedCellTotal(oracle.a),
                boundarySize: oracle.boundaryCells().length,
              });
              laneSteps.interfaceStepLog.gpu.push({
                tick: solver.tick,
                attachedCount: solver.attachedCount(),
                boundarySize: solver.boundarySize(),
              });
              laneSteps.attachmentDeltaLog.cpu.push({
                attachedNow: cpuSurface.attachedNow,
                holeFillCount: cpuSurface.holeFillCount,
                orderDigest: await laneDigest(oracle.lastAttached),
              });
              laneSteps.attachmentDeltaLog.gpu.push({
                attachedNow: solver.lastAttachmentDelta(),
                holeFillCount: gpuSurface.holeFillCount,
                orderDigest: await laneDigest(finalState.attachmentIndices),
              });
              const cpuFarField = farFieldIndices(topologyFor(oracle));
              const gpuFarField = farFieldIndices(finalState.topology);
              laneFinal = {
                boundaryMembershipOrder: {
                  cpu: await laneDigest(oracle.boundaryCells()),
                  gpu: await laneDigest(finalState.boundaryIndices),
                },
                // The cached tuple's magnitudes are binary64 against binary32 and are compared
                // under the registered cache tolerances; what an exact decision can carry is
                // the set the tuple is defined over and its finiteness.
                cachedBoundaryTuple: {
                  cpu: {
                    entryCount: coefficientReference.length,
                    finiteCoefficientCount: finiteCount(coefficientReference),
                    finiteBoundarySigmaCount:
                      finiteCount(boundarySigmaReference),
                    finiteOpposingCount: finiteCount(opposingReference),
                    indexDigest: await laneDigest(cpuReadyBoundary),
                  },
                  gpu: {
                    entryCount: coefficientCandidate.length,
                    finiteCoefficientCount: finiteCount(coefficientCandidate),
                    finiteBoundarySigmaCount:
                      finiteCount(boundarySigmaCandidate),
                    finiteOpposingCount: finiteCount(opposingCandidate),
                    indexDigest: await laneDigest(readyState.boundaryIndices),
                  },
                },
                domainExtents: {
                  cpu: {
                    dims: oracle.dims,
                    largestExtent: oracle.largestExtent(),
                    activeCellCount: activeCellTotal(oracle.a, oracle.wall),
                  },
                  gpu: {
                    dims: solver.configuration().dims,
                    largestExtent: solver.largestExtent(),
                    activeCellCount: solver.activeCellCount(),
                  },
                },
                farFieldSet: {
                  cpu: {
                    count: cpuFarField.length,
                    digest: await laneDigest(cpuFarField),
                  },
                  gpu: {
                    count: gpuFarField.length,
                    digest: await laneDigest(gpuFarField),
                  },
                },
                lastAttachmentDelta: {
                  cpu: cpuSurface.attachedNow,
                  gpu: solver.lastAttachmentDelta(),
                },
                // The two rules word their prose claim differently by design, so only the
                // rule identity and its explicit null Sigma(b+d)/Dirichlet-meter claims are
                // published here.
                ledgerRule: {
                  cpu: {
                    rule: cpuLedger.rule,
                    totalMassBD: cpuLedger.totalMassBD,
                    dirichletMeter: cpuLedger.dirichletMeter,
                  },
                  gpu: {
                    rule: gpuLedger.rule,
                    totalMassBD: gpuLedger.totalMassBD,
                    dirichletMeter: gpuLedger.dirichletMeter,
                  },
                },
                renderFlags: {
                  cpu: await laneDigest(surfaceWitness.renderFlags),
                  gpu: await laneDigest(finalState.renderFlags),
                },
                surfacePolicy: {
                  cpu: oracle.surfacePolicy,
                  gpu: solver.configuration().surfacePolicy,
                },
                wallMask: {
                  cpu: await laneDigest(oracle.wall),
                  gpu: await laneDigest(finalState.wall),
                },
              };
              laneMeasures.maxKineticFillIncrement = Math.max(
                laneMeasures.maxKineticFillIncrement,
                gpuSurface.maxKineticFillIncrement,
              );
              laneMeasures.ledgerPartition = {
                left:
                  gpuLedger.fillLedgerIceCells +
                  gpuLedger.saturationClippedFill,
                right: gpuLedger.kineticDemand,
              };
              // ADR 0021: a fixed point answers to the configured residual tolerance and a
              // bounded two-cycle to the registered one-ULP current-step bound. Fixed-sigma
              // Dirichlet additionally answers to the divergence identity; reflecting makes
              // no divergence claim and contributes no divergence term.
              const residualCriterion =
                gpuRelaxation.convergenceMode === "bounded-two-cycle"
                  ? gpuRelaxation.maximumCurrentStepUlpDistance /
                    protocol.PHASE5_LK_BOUNDED_TWO_CYCLE_POLICY
                      .maximumCurrentStepUlpDistance
                  : gpuRelaxation.residual / fixture.relaxTol;
              const divergenceCriterion =
                gpuRelaxation.divergenceResidual === null
                  ? 0
                  : Math.abs(gpuRelaxation.divergenceResidual) /
                    fixture.divTol;
              laneMeasures.convergenceCriterion = Math.max(
                laneMeasures.convergenceCriterion,
                residualCriterion,
                divergenceCriterion,
              );
              for (const entry of convergenceWitness.traceAudit) {
                const measured = Math.abs(entry.smootherDrift);
                const bound = entry.independentlyDerivedLimit;
                const ratio =
                  bound > 0
                    ? measured / bound
                    : measured === 0
                      ? 0
                      : Number.POSITIVE_INFINITY;
                if (ratio >= laneMeasures.driftBound.ratio) {
                  laneMeasures.driftBound = {
                    ratio,
                    left: measured,
                    right: bound,
                  };
                }
              }
            }
            if (fixture.id === "lk-reflecting-diagnostic-17x19x15") {
              const fillFixture = stressFixtures.find(
                (entry) => entry.stress === "lk-fill-margin",
              );
              const nonlinearFixture = stressFixtures.find(
                (entry) => entry.stress === "lk-nonlinear-boundary",
              );
              const signedFixture = stressFixtures.find(
                (entry) => entry.stress === "signed-subsaturation",
              );
              if (
                fillFixture === undefined ||
                nonlinearFixture === undefined ||
                signedFixture === undefined
              ) {
                throw new Error("registered LK stress fixture is missing");
              }
              const stressSigmaOpp = [
                ...nonlinearFixture.inputs.sigmaOpp,
                ...signedFixture.inputs.sigmaOpp,
              ];
              const diagnostics = await solver.runBoundaryStressDiagnostics(
                {
                  sigmaOpp: stressSigmaOpp,
                },
                `${fixture.id}:registered-stress`,
              );
              const nonlinearCases =
                nonlinearFixture.inputs.sigmaOpp.map(
                  (sigmaOpp, index) => {
                    const expected = expectedPrismBoundary(
                      nonlinearFixture.inputs.tempC,
                      sigmaOpp,
                    );
                    const coefficient =
                      diagnostics.boundaryAttachmentCoefficient[index];
                    const sigmaBoundary =
                      diagnostics.boundarySupersaturation[index];
                    return {
                      sigmaOpp: expected.sigmaOpp,
                      expectedCoefficient: expected.coefficient,
                      coefficient: scalarComparison(
                        expected.coefficient,
                        coefficient,
                      ),
                      expectedSigmaBoundary: expected.sigmaBoundary,
                      sigmaBoundary: scalarComparison(
                        expected.sigmaBoundary,
                        sigmaBoundary,
                      ),
                      finiteAndBounded:
                        Number.isFinite(coefficient) &&
                        coefficient >= 0 &&
                        coefficient <= 1 &&
                        Number.isFinite(sigmaBoundary) &&
                        sigmaBoundary > 0 &&
                        sigmaBoundary <= expected.sigmaOpp,
                    };
                  },
                );
              const nonlinearSensitivity =
                nonlinearCases.every(
                  (entry, index) =>
                    index === 0 ||
                    entry.coefficient.candidate >=
                      nonlinearCases[index - 1].coefficient.candidate,
                ) &&
                new Set(
                  nonlinearCases.map(
                    (entry) => entry.sigmaBoundary.candidate,
                  ),
                ).size > 1;
              stressReports.push({
                id: nonlinearFixture.id,
                cases: nonlinearCases,
                nonlinearSensitivity,
                pass:
                  nonlinearCases.every(
                    (entry) =>
                      entry.coefficient.pass &&
                      entry.sigmaBoundary.pass &&
                      entry.finiteAndBounded,
                  ) &&
                  nonlinearSensitivity,
              });

              const signedOffset =
                nonlinearFixture.inputs.sigmaOpp.length;
              const signedCases = signedFixture.inputs.sigmaOpp.map(
                (sigmaOpp, index) => {
                  const expected = Math.fround(sigmaOpp);
                  const candidateCoefficient =
                    diagnostics.boundaryAttachmentCoefficient[
                      signedOffset + index
                    ];
                  const candidateSigma =
                    diagnostics.boundarySupersaturation[
                      signedOffset + index
                    ];
                  return {
                    sigmaOpp: expected,
                    candidateCoefficient,
                    candidateSigma,
                    exact:
                      candidateCoefficient === 0 &&
                      Object.is(candidateSigma, expected),
                  };
                },
              );
              stressReports.push({
                id: signedFixture.id,
                cases: signedCases,
                pass: signedCases.every((entry) => entry.exact),
              });
            }
            const decisionMarginPass =
              minimumDecisionMargin >=
              protocol.PHASE5_DECISION_MARGINS.lkFill;
            const stopReason = {
              expected: "completed-interface-step-cap",
              actual:
                solver.tick === fixture.stop.value
                  ? "completed-interface-step-cap"
                  : "incomplete",
              pass: solver.tick === fixture.stop.value,
            };
            const gpuConversion = await solver.exportConversionSnapshot(
              `${fixture.id}:final-checkpoint`,
            );
            const cpuCheckpoint = core.encodeLKCheckpoint({
              surfacePolicy: oracle.surfacePolicy,
              dims: oracle.dims,
              tick: oracle.tick,
              simTimeSeconds: oracle.simTimeSeconds,
              rngSeed: fixture.rngSeed,
              noiseEpsilon: fixture.noiseEpsilon,
              domain: oracle.domain,
              center: oracle.center,
              tempC: oracle.tempC,
              sigmaInfinity: oracle.sigmaInfinity,
              dxUm: fixture.dxUm,
              pressurePa: fixture.pressurePa,
              paramSet: fixture.paramSet,
              cflFill: fixture.cflFill,
              relaxTol: fixture.relaxTol,
              divTol: fixture.divTol,
              relaxMaxSweeps: fixture.relaxMaxSweeps,
              farField: fixture.farField,
              a: oracle.a,
              f: oracle.f,
              sigma: oracle.sigma,
            });
            // `state.cycle-phase` publishes each lane's own completed interface-step count
            // plus the interface-cycle phase its own timeline reports carry. The GPU's
            // end-of-run `cyclePhase()` has no CPU counterpart — `LKSolver.cycleState` is
            // private and unexported — so it is deliberately not published as a lane pair.
            const laneObservations = {
              "attachment-delta-log": laneSteps.attachmentDeltaLog,
              "interface-step-log": laneSteps.interfaceStepLog,
              "noise-witness": laneSteps.noiseWitness,
              "noise.witness": laneSteps.noiseWitness,
              "relaxation-log": laneSteps.relaxationLog,
              "reports.convergence-classification":
                laneSteps.convergenceClassification,
              "reports.divergence-status": laneSteps.divergenceStatus,
              "reports.ledger-rule": laneFinal.ledgerRule,
              "reports.surface-discrete": laneSteps.surfaceDiscrete,
              "state.boundary-membership-order":
                laneFinal.boundaryMembershipOrder,
              "state.cached-boundary-tuple": laneFinal.cachedBoundaryTuple,
              "state.cycle-phase": {
                cpu: {
                  completedInterfaceSteps: oracle.tick,
                  eventBoundaries: laneTimeline.cycleBoundary.cpu,
                },
                gpu: {
                  completedInterfaceSteps: solver.tick,
                  eventBoundaries: laneTimeline.cycleBoundary.gpu,
                },
              },
              "state.domain-extents": laneFinal.domainExtents,
              "state.far-field-set": laneFinal.farFieldSet,
              "state.last-attachment-delta": laneFinal.lastAttachmentDelta,
              "state.render-flags": laneFinal.renderFlags,
              "state.surface-policy": laneFinal.surfacePolicy,
              "state.wall-mask": laneFinal.wallMask,
              "timeline.density-transform-records":
                laneTimeline.densityTransform,
              "timeline.reservoir-records": laneTimeline.reservoir,
            };
            // Measured operands for the registered LK invariants. Each pair is the two
            // quantities the invariant actually relates; no operand is a probe verdict.
            const laneInvariants = {
              "convergence.dual-or-reflecting": {
                left: laneMeasures.convergenceCriterion,
                right: 1,
              },
              "fill.cfl": {
                left: laneMeasures.maxKineticFillIncrement,
                right: fixture.cflFill,
              },
              "ledger.partition": laneMeasures.ledgerPartition,
              "relaxation.smoother-drift-bound": {
                left: laneMeasures.driftBound.left,
                right: laneMeasures.driftBound.right,
              },
              "timeline.number-density-conservation": {
                left: laneMeasures.densityAfter,
                right: laneMeasures.densityBefore,
              },
            };
            fixtureReports.push({
              id: fixture.id,
              steps,
              events,
              minimumDecisionMargin,
              decisionMarginPass,
              stopReason,
              laneObservations,
              laneInvariants,
              cpuCheckpointBase64: base64(cpuCheckpoint),
              gpuCheckpointBase64: base64(
                production.encodeGpuLkConversionSnapshot(gpuConversion),
              ),
              pass:
                steps.length === fixture.stop.value &&
                steps.every((stepReport) => stepReport.pass) &&
                events.every((event) =>
                  event.comparison.pass &&
                  event.sigma.pass &&
                  Object.values(event.preservation).every((entry) =>
                    typeof entry === "boolean" ? entry : entry.pass,
                  ) &&
                  event.controls.environment &&
                  Object.values(event.controls.derived).every(
                    (entry) => entry.pass,
                  )
                ) &&
                decisionMarginPass &&
                stopReason.pass,
            });
          } finally {
            solver?.destroy();
            arena.destroy();
          }
        }

        const fillFixture = stressFixtures.find(
          (entry) => entry.stress === "lk-fill-margin",
        );
        const reflectingFixture = fixtures.find(
          (entry) => entry.id === "lk-reflecting-diagnostic-17x19x15",
        );
        if (fillFixture === undefined || reflectingFixture === undefined) {
          throw new Error("production fill stress prerequisites are missing");
        }
        {
          const oracle = makeOracle(reflectingFixture);
          const input = solverInput(oracle);
          const stressFixture = {
            ...reflectingFixture,
            cflFill: Math.fround(
              Math.max(...fillFixture.inputs.kineticIncrement),
            ),
            noiseEpsilon: 0,
          };
          const probeGeneration = fixtures.length + 1;
          submissions.acknowledgeEdit(probeGeneration);
          const probeArena = production.GpuBufferArena.create(
            device,
            probeGeneration,
            production.createGpuBufferPlan(reflectingFixture.dims, "lk"),
          );
          let selectedBoundaryIndex = null;
          let probeSolver = null;
          try {
            probeSolver = await production.GpuLkSolver.create(
              device,
              submissions,
              probeArena,
              audit,
              {
                ...input,
                cflFill: stressFixture.cflFill,
                noiseEpsilon: 0,
              },
            );
            const probeRelaxation = await probeSolver.relaxField(
              `${fillFixture.id}:selection-probe-relaxation`,
            );
            if (!probeRelaxation.converged) {
              throw new Error("fill stress selection probe did not converge");
            }
            const probeReady = await probeSolver.readEvidenceState(
              "evidence-snapshot",
              `${fillFixture.id}:selection-probe-ready`,
            );
            const probeSurface = independent.replaySurface(
              probeReady,
              stressFixture,
              oracle.vKinMS,
              probeSolver.attachedCount(),
            );
            let selectedDemand = 0;
            for (const index of probeReady.boundaryIndices) {
              if (probeSurface.rawDemand[index] > selectedDemand) {
                selectedDemand = probeSurface.rawDemand[index];
                selectedBoundaryIndex = index;
              }
            }
            if (selectedBoundaryIndex === null || selectedDemand <= 0) {
              throw new Error(
                "fill stress selection probe lacks a positive kinetic boundary",
              );
            }
          } finally {
            probeSolver?.destroy();
            probeArena.destroy();
          }
          const generation = fixtures.length + 2;
          submissions.acknowledgeEdit(generation);
          const arena = production.GpuBufferArena.create(
            device,
            generation,
            production.createGpuBufferPlan(reflectingFixture.dims, "lk"),
          );
          let solver = null;
          try {
            const stressFill = Float32Array.from(input.initialFill);
            stressFill[selectedBoundaryIndex] = Math.fround(
              fillFixture.inputs.fillBefore,
            );
            solver = await production.GpuLkSolver.create(
              device,
              submissions,
              arena,
              audit,
              {
                ...input,
                initialFill: stressFill,
                cflFill: stressFixture.cflFill,
                noiseEpsilon: 0,
              },
            );
            const relaxation = await solver.relaxField(
              `${fillFixture.id}:production-relaxation`,
            );
            const readyState = await solver.readEvidenceState(
              "evidence-snapshot",
              `${fillFixture.id}:production-ready`,
            );
            const relaxationWitness = compareIndependentRelaxation(
              stressFixture,
              0,
              relaxation,
              readyState,
            );
            const surfaceWitness = independent.replaySurface(
              readyState,
              stressFixture,
              oracle.vKinMS,
              solver.attachedCount(),
            );
            const surface = await solver.advanceSurface(
              `${fillFixture.id}:production-surface`,
            );
            const finalState = await solver.readEvidenceState(
              "evidence-snapshot",
              `${fillFixture.id}:production-final`,
            );
            const reportComparison = Object.fromEntries(
              Object.entries(surfaceWitness.report).map(([name, expected]) => [
                name,
                typeof expected === "boolean" ||
                ["attachedNow", "holeFillCount"].includes(name)
                  ? {
                      expected,
                      actual: surface[name],
                      pass: expected === surface[name],
                    }
                  : binary32ScalarComparison(expected, surface[name]),
              ]),
            );
            const stateComparison = {
              fill: exactArray(surfaceWitness.fill, finalState.fill),
              sigma: exactArray(surfaceWitness.sigma, finalState.sigma),
              wall: exactArray(surfaceWitness.wall, finalState.wall),
              occupancy: exactArray(
                surfaceWitness.occupancy,
                finalState.occupancy,
              ),
              topology: exactArray(
                surfaceWitness.topology,
                finalState.topology,
              ),
              boundary: exactArray(
                surfaceWitness.boundaryIndices,
                finalState.boundaryIndices,
              ),
              attachments: exactArray(
                surfaceWitness.attachmentIndices,
                finalState.attachmentIndices,
              ),
              render: exactArray(
                surfaceWitness.renderFlags,
                finalState.renderFlags,
              ),
            };
            const clippedCells = [];
            for (const index of readyState.boundaryIndices) {
              if (surfaceWitness.clipped[index] > 0) {
                clippedCells.push({
                  index,
                  clipped: surfaceWitness.clipped[index],
                  rawDemand: surfaceWitness.rawDemand[index],
                  placed: surfaceWitness.placed[index],
                });
              }
            }
            const oneE5ClippingWitness =
              clippedCells.some(
                (entry) =>
                  Math.abs(entry.clipped - 1e-5) <= 2e-7,
              ) &&
              surface.saturationClippedFill > 0 &&
              surface.attachedNow > 0;
            const attachedDecisions = new Set(
              surfaceWitness.attachmentIndices,
            );
            const nonAttachmentCount = Array.from(
              readyState.boundaryIndices,
            ).filter((index) => !attachedDecisions.has(index)).length;
            const mixedDecisionWitness = {
              selectedBoundaryIndex,
              attachmentCount: surfaceWitness.attachmentIndices.length,
              nonAttachmentCount,
              pass:
                surfaceWitness.attachmentIndices.length > 0 &&
                nonAttachmentCount > 0 &&
                attachedDecisions.has(selectedBoundaryIndex),
            };
            let staleAdvanceRejected = false;
            try {
              await solver.advanceSurface(
                `${fillFixture.id}:stale-surface-control`,
              );
            } catch {
              staleAdvanceRejected = true;
            }
            const attachmentEvidenceBefore =
              Uint32Array.from(finalState.attachmentIndices);
            const sameTemperatureLedgerBefore = solver.ledger();
            const sameTemperatureTickBefore = solver.tick;
            const sameTemperatureTimeBefore = solver.simTimeSeconds;
            const sameTemperatureEvent =
              await solver.applyTimelineEnvironment(
              {
                ...solver.timelineEnvironment(),
                sigmaInfinity: solver.sigmaInfinity * 1.01,
              },
              `${fillFixture.id}:attachment-persistence-event`,
            );
            const afterEvent = await solver.readEvidenceState(
              "evidence-snapshot",
              `${fillFixture.id}:attachment-persistence-state`,
            );
            const sameTemperatureLedgerAfter = solver.ledger();
            const attachmentEvidencePersistence = exactArray(
              attachmentEvidenceBefore,
              afterEvent.attachmentIndices,
            );
            const sameTemperatureLedgerFields = [
              "fillLedgerIceCells",
              "fillLedgerVaporUnits",
              "closedPlacedFillVaporUnits",
              "currentTemperatureSegmentStartFillIceCells",
              "currentTemperatureSegmentMIceLedger",
              "kineticDemand",
              "holeFillDeficit",
              "saturationClippedFill",
            ];
            const sameTemperatureContinuity = {
              event: {
                temperatureChanged:
                  sameTemperatureEvent.densityTransform.temperatureChanged,
                transformedCellCount:
                  sameTemperatureEvent.densityTransform.transformedCellCount,
                shellReclampPending:
                  sameTemperatureEvent.reservoir.shellReclampPending,
                pass:
                  !sameTemperatureEvent.densityTransform.temperatureChanged &&
                  sameTemperatureEvent.densityTransform.transformedCellCount ===
                    0 &&
                  sameTemperatureEvent.reservoir.shellReclampPending ===
                    (reflectingFixture.farField === "dirichlet"),
              },
              sigmaBits: exactArray(finalState.sigma, afterEvent.sigma),
              fill: exactArray(finalState.fill, afterEvent.fill),
              occupancy: exactArray(
                finalState.occupancy,
                afterEvent.occupancy,
              ),
              wall: exactArray(finalState.wall, afterEvent.wall),
              topology: exactArray(finalState.topology, afterEvent.topology),
              boundary: exactArray(
                finalState.boundaryIndices,
                afterEvent.boundaryIndices,
              ),
              attachments: attachmentEvidencePersistence,
              render: exactArray(
                finalState.renderFlags,
                afterEvent.renderFlags,
              ),
              cachesCleared:
                afterEvent.boundaryAttachmentCoefficient.every(
                  (value) => value === 0,
                ) &&
                afterEvent.boundarySupersaturation.every(
                  (value) => value === 0,
                ) &&
                afterEvent.opposingSupersaturation.every(
                  (value) => value === 0,
                ),
              ledgerFields: Object.fromEntries(
                sameTemperatureLedgerFields.map((name) => [
                  name,
                  {
                    before: sameTemperatureLedgerBefore[name],
                    after: sameTemperatureLedgerAfter[name],
                    pass: Object.is(
                      sameTemperatureLedgerBefore[name],
                      sameTemperatureLedgerAfter[name],
                    ),
                  },
                ]),
              ),
              tick: {
                before: sameTemperatureTickBefore,
                after: solver.tick,
                pass: sameTemperatureTickBefore === solver.tick,
              },
              simTimeSeconds: {
                before: sameTemperatureTimeBefore,
                after: solver.simTimeSeconds,
                pass: Object.is(
                  sameTemperatureTimeBefore,
                  solver.simTimeSeconds,
                ),
              },
            };
            sameTemperatureContinuity.pass =
              Object.entries(sameTemperatureContinuity).every(
                ([name, value]) =>
                  name === "pass" ||
                  (name === "cachesCleared"
                    ? value === true
                    : name === "ledgerFields"
                      ? Object.values(value).every((entry) => entry.pass)
                      : value.pass),
              );
            const sameTemperatureEvaluator = (candidate) =>
              candidate.event.densityTransform.temperatureChanged === false &&
              candidate.event.densityTransform.transformedCellCount === 0 &&
              exactArray(finalState.sigma, candidate.state.sigma).pass &&
              sameTemperatureLedgerFields.every((name) =>
                Object.is(
                  sameTemperatureLedgerBefore[name],
                  candidate.ledger[name],
                ),
              );
            const sameTemperatureMutations = independent.mutateAndReject(
              sameTemperatureEvaluator,
              {
                event: structuredClone(sameTemperatureEvent),
                state: structuredClone(afterEvent),
                ledger: structuredClone(sameTemperatureLedgerAfter),
              },
              [
                {
                  id: "production-sigma-infinity-only-field-rewrite",
                  mutate(candidate) {
                    candidate.state.sigma[selectedBoundaryIndex] =
                      Math.fround(
                        sameTemperatureEvent.afterEnvironment.sigmaInfinity,
                      );
                  },
                },
                {
                  id: "production-same-temperature-ledger-segment-split",
                  mutate(candidate) {
                    candidate.ledger
                      .currentTemperatureSegmentStartFillIceCells =
                      candidate.ledger.fillLedgerIceCells;
                  },
                },
              ],
            );
            productionMutationControls.push(...sameTemperatureMutations);
            const evaluateProductionCapture = (candidate) =>
              Object.entries(surfaceWitness.report).every(
                ([name, expected]) =>
                  typeof expected === "boolean" ||
                  ["attachedNow", "holeFillCount"].includes(name)
                    ? candidate.surface[name] === expected
                    : binary32ScalarComparison(
                        expected,
                        candidate.surface[name],
                      ).pass,
              ) &&
              exactArray(
                surfaceWitness.attachmentIndices,
                candidate.attachments,
              ).pass &&
              exactArray(
                surfaceWitness.boundaryIndices,
                candidate.boundary,
              ).pass;
            const productionCapture = {
              surface: { ...surface },
              attachments: Uint32Array.from(finalState.attachmentIndices),
              boundary: Uint32Array.from(finalState.boundaryIndices),
            };
            const mutations = independent.mutateAndReject(
              evaluateProductionCapture,
              productionCapture,
              [
                {
                  id: "silent-saturation-loss",
                  mutate(candidate) {
                    candidate.surface.saturationClippedFill = 0;
                  },
                },
                {
                  id: "per-contact-fill-demand",
                  mutate(candidate) {
                    candidate.surface.kineticDemand *= 2;
                  },
                },
                {
                  id: "wrong-neighbor-append-order",
                  mutate(candidate) {
                    candidate.boundary.reverse();
                  },
                },
              ],
            );
            productionMutationControls.push(...mutations);
            stressReports.push({
              id: fillFixture.id,
              source: "production-GpuLkSolver.advanceSurface",
              relaxationWitness: {
                classification: relaxationWitness.classification,
                boundary: relaxationWitness.boundary,
                arrays: relaxationWitness.arrays,
                scalars: relaxationWitness.scalars,
                exact: relaxationWitness.exact,
                cachePhaseAssignment:
                  relaxationWitness.cachePhaseAssignment,
                traceAudit: relaxationWitness.traceAudit,
                positiveSourceExchange:
                  relaxationWitness.positiveSourceExchange,
                pass: relaxationWitness.pass,
              },
              surface,
              reportComparison,
              stateComparison,
              clippedCells,
              oneE5ClippingWitness,
              mixedDecisionWitness,
              staleAdvanceRejected,
              attachmentEvidencePersistence,
              sameTemperatureContinuity,
              sameTemperatureMutations,
              mutations,
              pass:
                relaxation.converged &&
                relaxationWitness.pass &&
                Object.values(reportComparison).every(
                  (entry) => entry.pass,
                ) &&
                Object.values(stateComparison).every(
                  (entry) => entry.pass,
                ) &&
                oneE5ClippingWitness &&
                mixedDecisionWitness.pass &&
                staleAdvanceRejected &&
                attachmentEvidencePersistence.pass &&
                sameTemperatureContinuity.pass &&
                sameTemperatureMutations.every((entry) => entry.pass) &&
                mutations.every((entry) => entry.pass),
            });
          } finally {
            solver?.destroy();
            arena.destroy();
          }
        }

        {
          const generation = fixtures.length + 3;
          submissions.acknowledgeEdit(generation);
          const dims = { nx: 20, ny: 20, nz: 12 };
          const center = [10, 10, 6];
          const indexOf = (i, j, k) =>
            k * dims.nx * dims.ny + j * dims.nx + i;
          const ring = [
            indexOf(11, 10, 7),
            indexOf(9, 10, 7),
            indexOf(10, 11, 7),
            indexOf(10, 9, 7),
            indexOf(11, 9, 7),
            indexOf(9, 11, 7),
          ];
          const gap = indexOf(10, 10, 7);
          const oracle = new cpu.LKSolver({
            surfacePolicy: "aggregate-hv-g1h1-v5",
            dims,
            center,
            tempC: -15,
            sigmaInfinity: 0.002,
            dxUm: 0.35,
            pressurePa: 101_325,
            paramSet: "CAK_A1",
            cflFill: 0.1,
            relaxTol: 1,
            divTol: 1e-7,
            relaxMaxSweeps: 2_000,
            rngSeed: 0x51a7,
            noiseEpsilon: 0,
            domain: "box",
            farField: "reflecting",
            seedRadius: 2,
            seedThickness: 1,
            testExtraSeedSites: ring,
          });
          const arena = production.GpuBufferArena.create(
            device,
            generation,
            production.createGpuBufferPlan(dims, "lk"),
          );
          let solver = null;
          try {
            const input = solverInput(oracle);
            const fill = Float32Array.from(input.initialFill);
            for (const index of input.initialBoundaryIndices) {
              if (index !== gap) fill[index] = Math.fround(0.99999);
            }
            const fixture = {
              id: "production-combined-attachment-order",
              kind: "lk",
              surfacePolicy: "aggregate-hv-g1h1-v5",
              dims,
              tempC: -15,
              sigmaInfinity: 0.002,
              dxUm: 0.35,
              pressurePa: 101_325,
              paramSet: "CAK_A1",
              cflFill: 0.1,
              relaxTol: 1,
              divTol: 1e-7,
              relaxMaxSweeps: 2_000,
              rngSeed: 0x51a7,
              noiseEpsilon: 0,
              domain: "box",
              farField: "reflecting",
            };
            solver = await production.GpuLkSolver.create(
              device,
              submissions,
              arena,
              audit,
              { ...input, initialFill: fill },
            );
            const relaxation = await solver.relaxField(
              "combined-attachment-order:relaxation",
            );
            const ready = await solver.readEvidenceState(
              "evidence-snapshot",
              "combined-attachment-order:ready",
            );
            const witness = independent.replaySurface(
              ready,
              fixture,
              oracle.vKinMS,
              solver.attachedCount(),
            );
            const surface = await solver.advanceSurface(
              "combined-attachment-order:surface",
            );
            const finalState = await solver.readEvidenceState(
              "evidence-snapshot",
              "combined-attachment-order:final",
            );
            const kineticCount =
              witness.attachmentIndices.length -
              witness.report.holeFillCount;
            const gapPosition =
              witness.attachmentIndices.indexOf(gap);
            const exactOrder = exactArray(
              witness.attachmentIndices,
              finalState.attachmentIndices,
            );
            const mutatedOrder = Uint32Array.from(
              finalState.attachmentIndices,
            );
            if (mutatedOrder.length >= 2) {
              const first = mutatedOrder[0];
              mutatedOrder[0] = mutatedOrder[mutatedOrder.length - 1];
              mutatedOrder[mutatedOrder.length - 1] = first;
            }
            const reorderingRejected = !exactArray(
              witness.attachmentIndices,
              mutatedOrder,
            ).pass;
            const freshBoundaryIndex =
              witness.freshBoundaryIndices[0] ?? null;
            const combinedReportComparison = Object.fromEntries(
              Object.entries(witness.report).map(([name, expected]) => [
                name,
                {
                  expected,
                  actual: surface[name],
                  pass: Object.is(expected, surface[name]),
                },
              ]),
            );
            const combinedStateComparison = {
              sigma: exactArray(witness.sigma, finalState.sigma),
              fill: exactArray(witness.fill, finalState.fill),
              occupancy: exactArray(
                witness.occupancy,
                finalState.occupancy,
              ),
              wall: exactArray(witness.wall, finalState.wall),
              topology: exactArray(
                witness.topology,
                finalState.topology,
              ),
              boundary: exactArray(
                witness.boundaryIndices,
                finalState.boundaryIndices,
              ),
              attachments: exactArray(
                witness.attachmentIndices,
                finalState.attachmentIndices,
              ),
              render: exactArray(
                witness.renderFlags,
                finalState.renderFlags,
              ),
            };
            const combinedBaselinePass =
              Object.values(combinedReportComparison).every(
                (entry) => entry.pass,
              ) &&
              Object.values(combinedStateComparison).every(
                (entry) => entry.pass,
              );
            const combinedEvaluator = (candidate) =>
              Object.entries(witness.report).every(
                ([name, expected]) =>
                  Object.is(expected, candidate.surface[name]),
              ) &&
              exactArray(witness.sigma, candidate.state.sigma).pass &&
              exactArray(witness.fill, candidate.state.fill).pass &&
              exactArray(
                witness.occupancy,
                candidate.state.occupancy,
              ).pass &&
              exactArray(
                witness.topology,
                candidate.state.topology,
              ).pass &&
              exactArray(
                witness.boundaryIndices,
                candidate.state.boundaryIndices,
              ).pass &&
              exactArray(
                witness.attachmentIndices,
                candidate.state.attachmentIndices,
              ).pass &&
              exactArray(
                witness.renderFlags,
                candidate.state.renderFlags,
              ).pass;
            const combinedMutations = independent.mutateAndReject(
              combinedEvaluator,
              {
                surface: { ...surface },
                state: structuredClone(finalState),
              },
              [
                {
                  id: "hole-fill-counted-as-kinetic-cfl",
                  mutate(candidate) {
                    candidate.surface.maxKineticFillIncrement =
                      candidate.surface.holeFillDeficit;
                  },
                },
                {
                  id: "production-premature-fresh-neighbor-use",
                  mutate(candidate) {
                    if (freshBoundaryIndex === null) return;
                    candidate.state.occupancy[freshBoundaryIndex] = 1;
                    candidate.state.fill[freshBoundaryIndex] = 1;
                    candidate.state.sigma[freshBoundaryIndex] = 0;
                  },
                },
              ],
            );
            const holeCflMutation = combinedMutations.find(
              (entry) =>
                entry.id === "hole-fill-counted-as-kinetic-cfl",
            );
            const prematureFreshMutation = combinedMutations.find(
              (entry) =>
                entry.id ===
                "production-premature-fresh-neighbor-use",
            );
            productionMutationControls.push({
              ...holeCflMutation,
              holeFillCount: witness.report.holeFillCount,
              holeFillDeficit: witness.report.holeFillDeficit,
              kineticMaximum:
                witness.report.maxKineticFillIncrement,
              baselinePass: combinedBaselinePass,
              pass:
                combinedBaselinePass &&
                witness.report.holeFillCount > 0 &&
                witness.report.holeFillDeficit > 0 &&
                holeCflMutation?.pass === true,
            });
            productionMutationControls.push({
              ...prematureFreshMutation,
              freshBoundaryCount:
                witness.freshBoundaryIndices.length,
              freshBoundaryIndex,
              baselinePass: combinedBaselinePass,
              pass:
                combinedBaselinePass &&
                witness.freshBoundaryIndices.length > 0 &&
                prematureFreshMutation?.pass === true,
            });
            lifecycleControls.push({
              id: "production-kinetic-before-hole-attachment-order",
              relaxationConverged: relaxation.converged,
              kineticCount,
              holeFillCount: surface.holeFillCount,
              gap,
              gapPosition,
              attachmentCount: finalState.attachmentIndices.length,
              exactOrder,
              combinedReportComparison,
              combinedStateComparison,
              combinedBaselinePass,
              reorderingRejected,
              pass:
                relaxation.converged &&
                kineticCount > 0 &&
                surface.holeFillCount > 0 &&
                gapPosition >= kineticCount &&
                combinedBaselinePass &&
                exactOrder.pass &&
                reorderingRejected,
            });
          } finally {
            solver?.destroy();
            arena.destroy();
          }
        }

        {
          const generation = fixtures.length + 4;
          submissions.acknowledgeEdit(generation);
          const fixture = fixtures[0];
          const oracle = makeOracle(fixture);
          const arena = production.GpuBufferArena.create(
            device,
            generation,
            production.createGpuBufferPlan(fixture.dims, "lk"),
          );
          let solver = null;
          try {
            solver = await production.GpuLkSolver.create(
              device,
              submissions,
              arena,
              audit,
              {
                ...solverInput(oracle),
                relaxMaxSweeps: 1,
              },
            );
            const relaxation = await solver.relaxField(
              "unconverged-advance-control:relaxation",
            );
            let advanceRejected = false;
            try {
              await solver.advanceSurface(
                "unconverged-advance-control:surface",
              );
            } catch {
              advanceRejected = true;
            }
            lifecycleControls.push({
              id: "production-advance-after-unconverged-relaxation",
              converged: relaxation.converged,
              advanceRejected,
              pass: !relaxation.converged && advanceRejected,
            });
          } finally {
            solver?.destroy();
            arena.destroy();
          }
        }

        {
          const generation = fixtures.length + 5;
          submissions.acknowledgeEdit(generation);
          const arena = production.GpuBufferArena.create(
            device,
            generation,
            production.createGpuBufferPlan(
              reflectingFixture.dims,
              "lk",
            ),
          );
          let resumeRejected = false;
          let reuseSolver = null;
          try {
            if (checkpointResumeSnapshot === null) {
              throw new Error(
                "production conversion snapshot was not captured",
              );
            }
            try {
              await production.GpuLkSolver.create(
                device,
                submissions,
                arena,
                audit,
                checkpointResumeSnapshot,
              );
            } catch {
              resumeRejected = true;
            }
            productionMutationControls.push({
              id: "production-checkpoint-resume-claim",
              snapshotSchema: Object.keys(
                checkpointResumeSnapshot,
              ).sort(),
              resumeRejected,
              pass: resumeRejected,
            });
            let ledgerOverflowRejected = false;
            try {
              await production.GpuLkSolver.create(
                device,
                submissions,
                arena,
                audit,
                {
                  ...solverInput(makeOracle(reflectingFixture)),
                  fillLedgerIceCells: Number.MAX_VALUE,
                  closedPlacedFillVaporUnits: Number.MAX_VALUE,
                },
              );
            } catch {
              ledgerOverflowRejected = true;
            }
            lifecycleControls.push({
              id: "production-ledger-overflow-construction",
              ledgerOverflowRejected,
              pass: ledgerOverflowRejected,
            });
            const reusableInput = solverInput(
              makeOracle(reflectingFixture),
            );
            const inputAttachedCount = reusableInput.occupancy.reduce(
              (sum, value) => sum + (value === 0 ? 0 : 1),
              0,
            );
            let incoherentHoleCountRejected = false;
            try {
              await production.GpuLkSolver.create(
                device,
                submissions,
                arena,
                audit,
                {
                  ...reusableInput,
                  holeFillCountTotal: inputAttachedCount + 1,
                },
              );
            } catch {
              incoherentHoleCountRejected = true;
            }
            let constructorGetterTriggered = false;
            let innerCreateResult = null;
            const reentrantInput = new Proxy(reusableInput, {
              get(target, name, receiver) {
                if (
                  name === "surfacePolicy" &&
                  !constructorGetterTriggered
                ) {
                  constructorGetterTriggered = true;
                  innerCreateResult = production.GpuLkSolver.create(
                    device,
                    submissions,
                    arena,
                    audit,
                    reusableInput,
                  ).then(
                    (innerSolver) => {
                      innerSolver.destroy();
                      return {
                        accepted: true,
                        message: null,
                      };
                    },
                    (error) => ({
                      accepted: false,
                      message: String(error),
                    }),
                  );
                }
                return Reflect.get(target, name, receiver);
              },
            });
            reuseSolver = await production.GpuLkSolver.create(
              device,
              submissions,
              arena,
              audit,
              reentrantInput,
            );
            const innerResult = await innerCreateResult;
            lifecycleControls.push({
              id: "production-incoherent-hole-count-construction",
              inputAttachedCount,
              attemptedHoleFillCount: inputAttachedCount + 1,
              incoherentHoleCountRejected,
              arenaReusableAfterRejection: reuseSolver !== null,
              pass:
                incoherentHoleCountRejected &&
                reuseSolver !== null,
            });
            lifecycleControls.push({
              id: "production-constructor-getter-reentry",
              constructorGetterTriggered,
              outerAccepted: reuseSolver !== null,
              innerResult,
              pass:
                constructorGetterTriggered &&
                reuseSolver !== null &&
                innerResult?.accepted === false &&
                innerResult.message.includes("already claimed"),
            });
          } finally {
            reuseSolver?.destroy();
            arena.destroy();
          }
        }

        {
          const generation = fixtures.length + 6;
          submissions.acknowledgeEdit(generation);
          const oracle = makeOracle(reflectingFixture);
          const arena = production.GpuBufferArena.create(
            device,
            generation,
            production.createGpuBufferPlan(
              reflectingFixture.dims,
              "lk",
            ),
          );
          let solver = null;
          try {
            solver = await production.GpuLkSolver.create(
              device,
              submissions,
              arena,
              audit,
              {
                ...solverInput(oracle),
                tick: 0xffff_ffff,
                relaxTol: 1,
              },
            );
            const relaxation = await solver.relaxField(
              "tick-overflow-control:relaxation",
            );
            let advanceRejected = false;
            try {
              await solver.advanceSurface(
                "tick-overflow-control:surface",
              );
            } catch {
              advanceRejected = true;
            }
            lifecycleControls.push({
              id: "production-tick-overflow-advance",
              relaxationConverged: relaxation.converged,
              tick: solver.tick,
              advanceRejected,
              pass:
                relaxation.converged &&
                solver.tick === 0xffff_ffff &&
                advanceRejected,
            });
          } finally {
            solver?.destroy();
            arena.destroy();
          }
        }

        const acceptedCycle = fixtureReports
          .flatMap((fixture) => fixture.steps)
          .find(
            (step) =>
              step.gpuRelaxation.convergenceMode === "bounded-two-cycle",
          );
        const negativeControls =
          acceptedCycle === undefined
            ? [{
                id: "missing-bounded-cycle-witness",
                expected: "bounded-two-cycle",
                actual: "absent",
                pass: false,
              }]
            : cycleNegativeControls(
                acceptedCycle.convergenceWitness.classification
                  .classifierInput,
              );
        const allNegativeControls = [
          ...negativeControls,
          ...lifecycleControls,
          ...productionMutationControls,
        ];
        const requiredNegativeControlIds = [
          "monotonic-one-ulp-drift",
          "period-three",
          "two-ulp-transition",
          "one-active-cell-two-back-mismatch",
          "stale-history-after-mutation",
          "current-divergence-failure",
          "previous-divergence-failure",
          "current-drift-failure",
          "previous-drift-failure",
          "non-finite-value",
          "production-lifecycle-reentry-and-atomic-evidence",
          "production-last-relaxation-alias-mutation",
          "production-signed-value-clamp",
          "production-skipped-shell-transform",
          "production-skipped-shell-reclamp",
          "production-residual-only-acceptance",
          "production-inferred-smoother-drift",
          "production-omitted-smoother-drift",
          "production-over-bound-smoother-drift",
          "production-unordered-reduction-shape",
          "production-in-place-boundary-replacement",
          "production-wrong-aggregate-facet-mapping",
          "production-cache-growth-mismatch",
          "production-previous-boundary-cache-swap",
          "production-noise-on-one-side",
          "production-boundary-membership-shift",
          "production-unordered-reduction-raw-witness",
          "production-one-tick-noise-shift",
          "production-zero-shell-source-accepted",
          "production-negative-shell-source-accepted",
          "production-zero-surface-exchange-accepted",
          "production-negative-surface-exchange-accepted",
          "production-final-temperature-ledger-rescaling",
          "production-omitted-cumulative-kinetic-demand",
          "production-sigma-infinity-only-field-rewrite",
          "production-same-temperature-ledger-segment-split",
          "silent-saturation-loss",
          "per-contact-fill-demand",
          "hole-fill-counted-as-kinetic-cfl",
          "wrong-neighbor-append-order",
          "production-premature-fresh-neighbor-use",
          "production-kinetic-before-hole-attachment-order",
          "production-advance-after-unconverged-relaxation",
          "production-checkpoint-resume-claim",
          "production-ledger-overflow-construction",
          "production-incoherent-hole-count-construction",
          "production-constructor-getter-reentry",
          "production-tick-overflow-advance",
        ].sort();
        const actualNegativeControlIds = allNegativeControls
          .map((control) => control.id)
          .sort();
        const negativeControlCoverage = {
          expectedCount: requiredNegativeControlIds.length,
          actualCount: actualNegativeControlIds.length,
          requiredIds: requiredNegativeControlIds,
          actualIds: actualNegativeControlIds,
          pass:
            JSON.stringify(requiredNegativeControlIds) ===
            JSON.stringify(actualNegativeControlIds),
        };
        const submissionRecords = submissions.records();
        const sortedWall = submissionRecords
          .map((record) => record.wallMs)
          .sort((left, right) => left - right);
        const p99WallMs =
          sortedWall[
            Math.max(0, Math.ceil(sortedWall.length * 0.99) - 1)
          ] ?? 0;
        const submissionSummary = {
          count: submissionRecords.length,
          maxWallMs: Math.max(
            0,
            ...submissionRecords.map((record) => record.wallMs),
          ),
          p99WallMs,
          maxLimitMs: protocol.PHASE5_PERFORMANCE.maxSubmissionSegmentMs,
          p99LimitMs: protocol.PHASE5_PERFORMANCE.p99SubmissionSegmentMs,
        };
        submissionSummary.pass =
          submissionSummary.count > 0 &&
          submissionSummary.maxWallMs <= submissionSummary.maxLimitMs &&
          submissionSummary.p99WallMs <= submissionSummary.p99LimitMs;
        const limitNames = Object.keys(input.requiredLimits);
        const output = {
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
          stressDiagnostics: stressReports,
          negativeControls: allNegativeControls,
          negativeControlCoverage,
          submissions: submissionRecords,
          submissionSummary,
          readback: {
            records: audit.records(),
            fullFieldDisplayFrameCount:
              audit.fullFieldDisplayFrameCount(),
            totalBytes: audit.totalBytes(),
          },
          uncapturedErrors,
          unexpectedDeviceLoss: submissions.unexpectedLossReason(),
        };
        submissions.destroy();
        device.destroy();
        return output;
      },
      {
        coreModuleUrl: `${origin}/core/src/index.ts`,
        cpuModuleUrl: `${origin}/solver-cpu/src/index.ts`,
        productionModuleUrl: `${origin}/solver-gpu/src/index.ts`,
        protocolModuleUrl: `${origin}/runner/src/phase5-protocol.ts`,
        independentModuleUrl:
          `${origin}/app/scripts/phase5-wp4-independent.mjs`,
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
    const backend = String(result.adapter.info.backend ?? "");
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
      PHASE5_PROTOCOL === "phase5-gpu-conformance-windows-v5" &&
      PHASE5_PROTOCOL_SHA256 ===
        "bdc61bfe5cb48e9e29f5b79337036d7b23ec11e1677f1657595d00f5e7de91ec" &&
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
        ([name, expected]) => result.adapter.info[name] === expected,
      );
    const report = {
      schema: "phase5-wp4-lk-v1",
      encoding: "utf-8-without-bom",
      protocol: PHASE5_PROTOCOL,
      protocolSha256: {
        expected: PHASE5_PROTOCOL_SHA256,
        actual: protocolSha256,
        pass: protocolProvenancePass,
      },
      fixtureSha256: PHASE5_FIXTURES_SHA256,
      toleranceSha256: PHASE5_TOLERANCES_SHA256,
      lane: "windows-d3d12",
      pass:
        repository.clean &&
        protocolProvenancePass &&
        runtimeProvenancePass &&
        hostProvenancePass &&
        adapterProvenancePass &&
        backend.toLowerCase() ===
          PHASE5_EXPECTED_WINDOWS_BACKEND.toLowerCase() &&
        result.fixtures.length === 3 &&
        result.fixtures.every((fixture) => fixture.pass) &&
        result.stressDiagnostics.length === 3 &&
        result.stressDiagnostics.every((stress) => stress.pass) &&
        result.negativeControlCoverage.pass &&
        result.negativeControls.every((control) => control.pass) &&
        result.submissionSummary.pass &&
        result.readback.fullFieldDisplayFrameCount === 0 &&
        result.uncapturedErrors.length === 0 &&
        result.unexpectedDeviceLoss === null,
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
        ...result.adapter,
      },
      device: result.device,
      checks: {
        fixtures: result.fixtures,
        stressDiagnostics: result.stressDiagnostics,
        negativeControls: result.negativeControls,
        negativeControlCoverage: result.negativeControlCoverage,
        submissionSummary: result.submissionSummary,
        submissions: result.submissions,
        readback: result.readback,
        uncapturedErrors: result.uncapturedErrors,
        unexpectedDeviceLoss: result.unexpectedDeviceLoss,
      },
    };
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
    if (!report.pass) process.exitCode = 1;
  } finally {
    await browser?.close();
    await vite.close();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack : error);
  process.exitCode = 1;
});
