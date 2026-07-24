#!/usr/bin/env node
// Phase 5 WP2 diffusion conformance. This is implementation-stage evidence, not the final
// Phase 5 gate: it exercises the production GPU package against every frozen diffusion fixture.

import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import os from "node:os";
import process from "node:process";
import { resolve } from "node:path";
import { chromium } from "playwright";
import { createServer as createViteServer } from "vite";
import { GG_PRESETS } from "../../core/src/index.ts";
import { GGSolver } from "../../solver-cpu/src/index.ts";
import {
  PHASE5_EXPECTED_WINDOWS_BACKEND,
  PHASE5_FIELD_TOLERANCES,
  PHASE5_FIXTURES,
  PHASE5_HEADLESS_RUNTIME,
  PHASE5_HEADLESS_RUNTIME_VERSION,
  PHASE5_PROTOCOL,
  PHASE5_REQUIRED_FEATURES,
  PHASE5_REQUIRED_LIMITS,
} from "../../runner/src/phase5-protocol.ts";
import {
  comparePhase5Arrays,
  phase5Binary32DiffusionPass,
} from "../../runner/src/phase5-shadow.ts";

const repoRoot = resolve(import.meta.dirname, "..", "..");

function git(...args) {
  return execFileSync("git", args, {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

function platformContract() {
  if (process.platform === "win32") {
    return {
      lane: "windows-d3d12",
      expectedBackend: PHASE5_EXPECTED_WINDOWS_BACKEND,
    };
  }
  throw new Error(`WP2 diffusion conformance does not support ${process.platform}`);
}

async function main() {
  if (process.argv.length !== 2) {
    throw new Error("WP2 diffusion conformance accepts no options");
  }
  const browserPath = chromium.executablePath();
  if (!existsSync(browserPath)) {
    throw new Error(`the frozen Chromium executable is absent: ${browserPath}`);
  }
  const platform = platformContract();
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
      name: "vcc-phase5-wp2-page",
      configureServer(viteServer) {
        viteServer.middlewares.use((request, response, next) => {
          if (request.url?.split("?")[0] !== "/phase5-wp2") {
            next();
            return;
          }
          response.writeHead(200, {
            "content-type": "text/html; charset=utf-8",
          });
          response.end("<!doctype html><title>VCC Phase 5 WP2 diffusion</title>");
        });
      },
    }],
  });
  await vite.listen();
  const address = vite.httpServer?.address();
  if (address === null || address === undefined || typeof address === "string") {
    throw new Error("WP2 Vite server did not receive an IPv4 port");
  }
  const origin = `http://127.0.0.1:${address.port}`;
  let browser = null;
  try {
    browser = await chromium.launch({
      executablePath: browserPath,
      headless: true,
      args: ["--enable-unsafe-webgpu", "--enable-webgpu-developer-features"],
    });
    const page = await browser.newPage();
    await page.goto(`${origin}/phase5-wp2`, { waitUntil: "load" });
    const deviceResult = await page.evaluate(
      async (input) => {
        if (!isSecureContext) throw new Error("WP2 requires a secure context");
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
          "vcc-phase5-wp2-device",
        );
        const uncapturedErrors = [];
        device.addEventListener("uncapturederror", (event) => {
          uncapturedErrors.push(event.error.message);
        });
        const submissions = new production.GpuSubmissionController(device);
        submissions.acknowledgeEdit(1);
        const readbackAudit = new production.GpuReadbackAudit();

        function compareArrays(reference, candidate, denominatorFloor) {
          if (reference.length !== candidate.length) {
            throw new Error("WP2 comparison length mismatch");
          }
          let maxAbs = 0;
          let squareSum = 0;
          let maxRelative = 0;
          let relativeComparedCount = 0;
          for (let index = 0; index < reference.length; index++) {
            const expected = reference[index];
            const actual = candidate[index];
            if (!Number.isFinite(expected) || !Number.isFinite(actual)) {
              throw new Error(`WP2 comparison requires finite values at ${index}`);
            }
            const difference = Math.abs(actual - expected);
            maxAbs = Math.max(maxAbs, difference);
            squareSum += difference * difference;
            if (Math.abs(expected) >= denominatorFloor) {
              maxRelative = Math.max(
                maxRelative,
                difference / Math.abs(expected),
              );
              relativeComparedCount++;
            }
          }
          return {
            maxAbs,
            rms: Math.sqrt(squareSum / reference.length),
            maxRelative,
            relativeComparedCount,
            length: reference.length,
          };
        }

        function comparisonPasses(comparison, tolerance) {
          return (
            comparison.maxAbs <= tolerance.maxAbs &&
            comparison.rms <= tolerance.rms &&
            comparison.maxRelative <= tolerance.maxRelative
          );
        }

        function paramsFor(fixture) {
          const preset = core.GG_PRESETS[fixture.preset];
          return {
            rho: preset.rho,
            phi: fixture.phi,
            kappa: new Float64Array(preset.kappa),
            mu: new Float64Array(preset.mu),
            ggThreshBeta: new Float64Array(preset.ggThreshBeta),
          };
        }

        function makeSolver(fixture, farField = fixture.farField) {
          return new cpu.GGSolver({
            dims: fixture.dims,
            params: paramsFor(fixture),
            rngSeed: fixture.rngSeed,
            noiseEpsilon: fixture.noiseEpsilon,
            domain: fixture.domain,
            farField,
            seedRadius: fixture.seedRadius,
            seedThickness: fixture.seedThickness,
          });
        }

        function makeGpuInput(solver, farField = solver.farField) {
          const topology = new Uint32Array(solver.d.length);
          for (const index of solver.farFieldCells) topology[index] = 1;
          return {
            initialVapor: Float32Array.from(solver.d, Math.fround),
            occupancy: Uint32Array.from(solver.a),
            wall: Uint32Array.from(solver.wall),
            topology,
            phi: solver.params.phi,
            rho: solver.params.rho,
            noiseEpsilon: solver.noiseEpsilon,
            rngSeed: solver.rngSeed,
            tick: solver.tick,
            farField,
          };
        }

        async function readActive(diffusion, fixtureId, passCount) {
          const source = diffusion.activeVaporBuffer();
          const copy = await production.readGpuBuffer(
            device,
            source,
            {
              purpose: "test",
              label: `${fixtureId}:pass-${passCount}`,
              generation: 1,
              byteOffset: 0,
              byteLength: source.size,
            },
            readbackAudit,
          );
          return new Float32Array(copy);
        }

        const fixtureReports = [];
        const fixtures = protocol.PHASE5_FIXTURES.filter(
          (fixture) => fixture.kind === "diffusion",
        );
        for (const fixture of fixtures) {
          const oracle = makeSolver(fixture);
          const arena = production.GpuBufferArena.create(
            device,
            1,
            production.createGpuBufferPlan(fixture.dims, "gg"),
          );
          let diffusion = null;
          try {
            diffusion = await production.GpuGgDiffusion.create(
              device,
              submissions,
              arena,
              makeGpuInput(oracle),
            );
            const comparisons = [];
            let finalObserved = null;
            let completedPasses = 0;
            for (const targetPass of fixture.passes) {
              const delta = targetPass - completedPasses;
              for (let pass = 0; pass < delta; pass++) oracle.relaxField();
              await diffusion.runPasses(
                delta,
                `${fixture.id}:through-${targetPass}`,
              );
              const observed = await readActive(diffusion, fixture.id, targetPass);
              const comparison = compareArrays(
                oracle.d,
                observed,
                protocol.PHASE5_FIELD_TOLERANCES.diffusionD
                  .relativeDenominatorFloor,
              );
              comparisons.push({
                passCount: targetPass,
                activeVapor: diffusion.activeVaporName(),
                comparison,
                pass: comparisonPasses(
                  comparison,
                  protocol.PHASE5_FIELD_TOLERANCES.diffusionD,
                ),
              });
              if (
                fixture.id ===
                  "diff-small-dirichlet-noise-drift-31x29x21" &&
                targetPass === 64
              ) {
                finalObserved = Array.from(observed);
              }
              completedPasses = targetPass;
            }
            fixtureReports.push({
              id: fixture.id,
              farField: fixture.farField,
              comparisons,
              finalObserved,
              pass: comparisons.every((comparison) => comparison.pass),
            });
          } finally {
            diffusion?.destroy();
            arena.destroy();
          }
        }

        const negativeFixture = fixtures.find(
          (fixture) =>
            fixture.id === "diff-small-dirichlet-noise-drift-31x29x21",
        );
        if (negativeFixture === undefined) {
          throw new Error("registered wrong-clamp fixture is absent");
        }
        const negativeOracle = makeSolver(negativeFixture);
        const negativeArena = production.GpuBufferArena.create(
          device,
          1,
          production.createGpuBufferPlan(negativeFixture.dims, "gg"),
        );
        let negativeDiffusion = null;
        let wrongClampNegative;
        try {
          negativeDiffusion = await production.GpuGgDiffusion.create(
            device,
            submissions,
            negativeArena,
            makeGpuInput(negativeOracle, "reflecting"),
          );
          for (let pass = 0; pass < 64; pass++) negativeOracle.relaxField();
          await negativeDiffusion.runPasses(64, "wrong-clamp-negative");
          const observed = await readActive(
            negativeDiffusion,
            "wrong-clamp-negative",
            64,
          );
          const comparison = compareArrays(
            negativeOracle.d,
            observed,
            protocol.PHASE5_FIELD_TOLERANCES.diffusionD
              .relativeDenominatorFloor,
          );
          wrongClampNegative = {
            mutation: "skip the post-pass Dirichlet clamp",
            comparison,
            rejected: !comparisonPasses(
              comparison,
              protocol.PHASE5_FIELD_TOLERANCES.diffusionD,
            ),
          };
        } finally {
          negativeDiffusion?.destroy();
          negativeArena.destroy();
        }

        await new Promise((resolvePromise) => setTimeout(resolvePromise, 0));
        const limitNames = Object.keys(input.requiredLimits);
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
          wrongClampNegative,
          submissions: submissions.records(),
          readback: {
            records: readbackAudit.records(),
            fullFieldDisplayFrameCount:
              readbackAudit.fullFieldDisplayFrameCount(),
            totalBytes: readbackAudit.totalBytes(),
          },
          uncapturedErrors,
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

    const backend = String(deviceResult.adapter.info.backend ?? "");
    const debugFixture = PHASE5_FIXTURES.find(
      (fixture) =>
        fixture.id === "diff-small-dirichlet-noise-drift-31x29x21",
    );
    const debugGpuFixture = deviceResult.fixtures.find(
      (fixture) => fixture.id === debugFixture?.id,
    );
    if (
      debugFixture === undefined ||
      debugFixture.kind !== "diffusion" ||
      debugGpuFixture?.finalObserved === null ||
      debugGpuFixture?.finalObserved === undefined
    ) {
      throw new Error("WP2 noisy diffusion diagnostic fixture is absent");
    }
    const debugPreset = GG_PRESETS[debugFixture.preset];
    const debugOracle = new GGSolver({
      dims: debugFixture.dims,
      params: {
        rho: debugPreset.rho,
        phi: debugFixture.phi,
        kappa: new Float64Array(debugPreset.kappa),
        mu: new Float64Array(debugPreset.mu),
        ggThreshBeta: new Float64Array(debugPreset.ggThreshBeta),
      },
      rngSeed: debugFixture.rngSeed,
      noiseEpsilon: debugFixture.noiseEpsilon,
      domain: debugFixture.domain,
      farField: debugFixture.farField,
      seedRadius: debugFixture.seedRadius,
      seedThickness: debugFixture.seedThickness,
    });
    let debugShadow = Float32Array.from(debugOracle.d, Math.fround);
    for (let pass = 0; pass < 64; pass++) {
      debugOracle.relaxField();
      debugShadow = phase5Binary32DiffusionPass(debugOracle, debugShadow);
    }
    const gpuVsShadow = comparePhase5Arrays(
      debugShadow,
      debugGpuFixture.finalObserved,
      PHASE5_FIELD_TOLERANCES.diffusionD.relativeDenominatorFloor,
    );
    for (const fixture of deviceResult.fixtures) delete fixture.finalObserved;
    const repository = {
      commit: git("rev-parse", "HEAD"),
      clean: git("status", "--porcelain").length === 0,
    };
    const browserVersion = await (
      await browser.newBrowserCDPSession()
    ).send("Browser.getVersion");
    const expectedComparisonCount = deviceResult.fixtures.reduce(
      (sum, fixture) => sum + fixture.comparisons.length,
      0,
    );
    const report = {
      schema: "phase5-wp2-diffusion-v1",
      protocol: PHASE5_PROTOCOL,
      lane: platform.lane,
      pass:
        repository.clean &&
        backend.toLowerCase() === platform.expectedBackend.toLowerCase() &&
        deviceResult.fixtures.length === 4 &&
        deviceResult.fixtures.every((fixture) => fixture.pass) &&
        deviceResult.wrongClampNegative.rejected &&
        deviceResult.submissions.length === expectedComparisonCount + 1 &&
        deviceResult.readback.records.length === expectedComparisonCount + 1 &&
        deviceResult.readback.fullFieldDisplayFrameCount === 0 &&
        deviceResult.uncapturedErrors.length === 0,
      repository,
      host: {
        platform: process.platform,
        release: os.release(),
        architecture: os.arch(),
        cpu: os.cpus()[0]?.model ?? "unknown",
        logicalProcessors: os.cpus().length,
        totalMemoryBytes: os.totalmem(),
      },
      runtime: {
        name: PHASE5_HEADLESS_RUNTIME,
        frozenVersion: PHASE5_HEADLESS_RUNTIME_VERSION,
        product: browserVersion.product,
        revision: browserVersion.revision,
        executablePath: browserPath,
      },
      adapter: {
        expectedBackend: platform.expectedBackend,
        actualBackend: backend,
        ...deviceResult.adapter,
      },
      device: deviceResult.device,
      checks: {
        fixtures: deviceResult.fixtures,
        gpuVsBinary32ShadowDiagnostic: gpuVsShadow,
        wrongClampNegative: deviceResult.wrongClampNegative,
        submissions: deviceResult.submissions,
        readback: deviceResult.readback,
        uncapturedErrors: deviceResult.uncapturedErrors,
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
