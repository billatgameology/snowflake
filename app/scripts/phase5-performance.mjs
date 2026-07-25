#!/usr/bin/env node
// Canonical Phase 5 preview responsiveness probe. Both exact preview shapes execute the
// registered edit/event/step/slice/probe sequence through the production GPU solver.

import { existsSync } from "node:fs";
import process from "node:process";
import { resolve } from "node:path";
import { chromium } from "playwright";
import { createServer as createViteServer } from "vite";
import {
  PHASE5_PERFORMANCE,
  PHASE5_REQUIRED_FEATURES,
  PHASE5_REQUIRED_LIMITS,
} from "../../runner/src/phase5-protocol.ts";

const repoRoot = resolve(import.meta.dirname, "..", "..");

async function main() {
  if (process.argv.length !== 2) {
    throw new Error("Phase 5 performance probe accepts no options");
  }
  if (process.platform !== "win32") {
    throw new Error(`Phase 5 performance probe does not support ${process.platform}`);
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
      name: "vcc-phase5-performance-page",
      configureServer(viteServer) {
        viteServer.middlewares.use((request, response, next) => {
          if (request.url?.split("?")[0] !== "/phase5-performance") {
            next();
            return;
          }
          response.writeHead(200, {
            "content-type": "text/html; charset=utf-8",
          });
          response.end("<!doctype html><title>VCC Phase 5 performance</title>");
        });
      },
    }],
  });
  await vite.listen();
  const address = vite.httpServer?.address();
  if (address === null || address === undefined || typeof address === "string") {
    throw new Error("Phase 5 performance Vite server did not receive an IPv4 port");
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
    await page.goto(`${origin}/phase5-performance`, { waitUntil: "load" });
    const result = await page.evaluate(
      async (input) => {
        if (!isSecureContext) throw new Error("Phase 5 performance requires a secure context");
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
          "vcc-phase5-performance-device",
        );
        const uncapturedErrors = [];
        device.addEventListener("uncapturederror", (event) => {
          uncapturedErrors.push(event.error.message);
        });
        const submissions = new production.GpuSubmissionController(device);
        const audit = new production.GpuReadbackAudit();

        function params(presetName) {
          const preset = core.GG_PRESETS[presetName];
          return {
            rho: preset.rho,
            phi: preset.phi,
            kappa: new Float64Array(preset.kappa),
            mu: new Float64Array(preset.mu),
            ggThreshBeta: new Float64Array(preset.ggThreshBeta),
          };
        }

        function makeInput(oracle) {
          const topology = new Uint32Array(oracle.d.length);
          for (const index of oracle.farFieldCells) topology[index] = 1;
          return {
            initialVapor: Float32Array.from(oracle.d, Math.fround),
            initialBoundaryMass: Float32Array.from(oracle.b, Math.fround),
            occupancy: Uint32Array.from(oracle.a),
            wall: Uint32Array.from(oracle.wall),
            topology,
            initialBoundaryIndices: Uint32Array.from(oracle.boundaryCells()),
            params: oracle.params,
            rngSeed: oracle.rngSeed,
            noiseEpsilon: oracle.noiseEpsilon,
            tick: oracle.tick,
            farField: oracle.farField,
            domain: oracle.domain,
            center: oracle.center,
          };
        }

        const submissionSamples = [];
        const interactions = [];
        const cases = [
          {
            id: "preview-plate",
            dims: { nx: 400, ny: 400, nz: 50 },
            initialPreset: "plate",
            nextPreset: "dendrite",
          },
          {
            id: "preview-column",
            dims: { nx: 160, ny: 160, nz: 320 },
            initialPreset: "needle",
            nextPreset: "hollowColumn",
          },
        ];
        for (const performanceCase of cases) {
          const generation = cases.indexOf(performanceCase) + 1;
          submissions.acknowledgeEdit(generation);
          const oracle = new cpu.GGSolver({
            dims: performanceCase.dims,
            params: params(performanceCase.initialPreset),
            rngSeed: 1,
            noiseEpsilon: 0,
            domain: "hexPrism",
            farField: "dirichlet",
            seedRadius: 2,
            seedThickness: 1,
          });
          const arena = production.GpuBufferArena.create(
            device,
            generation,
            production.createGpuBufferPlan(performanceCase.dims, "gg"),
          );
          let solver = null;
          try {
            solver = await production.GpuGgSolver.create(
              device,
              submissions,
              arena,
              makeInput(oracle),
            );
            let nextPreset = performanceCase.nextPreset;
            let sliceIndex = 0;
            const total =
              protocol.PHASE5_PERFORMANCE.warmupCount +
              protocol.PHASE5_PERFORMANCE.sampleCount;
            for (let ordinal = 0; ordinal < total; ordinal++) {
              const warmup = ordinal < protocol.PHASE5_PERFORMANCE.warmupCount;
              const sample = warmup
                ? ordinal
                : ordinal - protocol.PHASE5_PERFORMANCE.warmupCount;
              const editStarted = performance.now();
              const environment = core.ggTimelineEnvironmentFromParams(
                params(nextPreset),
              );
              solver.applyTimelineEnvironment(environment);
              const editAcknowledgementMs = performance.now() - editStarted;
              const beforeSubmission = submissions.records().length;
              await solver.step(
                `${performanceCase.id}:${warmup ? "warmup" : "sample"}:${sample}`,
              );
              sliceIndex = (sliceIndex + 1) % performanceCase.dims.nz;
              await production.readGpuBuffer(
                device,
                solver.reportBuffer(),
                {
                  purpose: "named-probe",
                  label:
                    `${performanceCase.id}:${warmup ? "warmup" : "sample"}:` +
                    `${sample}:slice-${sliceIndex}`,
                  generation,
                  byteOffset: 0,
                  byteLength: production.GPU_GG_CYCLE_REPORT_BYTES,
                },
                audit,
              );
              const firstValidFrameMs = performance.now() - editStarted;
              const records = submissions.records().slice(beforeSubmission);
              submissionSamples.push({
                budgetId: performanceCase.id,
                sample,
                warmup,
                segmentWallMs: records.map((record) => record.wallMs),
              });
              if (!warmup) {
                interactions.push({
                  budgetId: performanceCase.id,
                  sample,
                  editAcknowledgementMs,
                  firstValidFrameMs,
                  editGeneration: generation,
                  acceptedGeneration: generation,
                  renderedGeneration: generation,
                });
              }
              nextPreset =
                nextPreset === performanceCase.initialPreset
                  ? performanceCase.nextPreset
                  : performanceCase.initialPreset;
            }
          } finally {
            solver?.destroy();
            arena.destroy();
          }
        }
        await new Promise((resolvePromise) => setTimeout(resolvePromise, 0));
        const result = {
          submissionSamples,
          interactions,
          readback: {
            records: audit.records(),
            fullFieldDisplayFrameCount: audit.fullFieldDisplayFrameCount(),
            totalBytes: audit.totalBytes(),
          },
          uncapturedErrors,
          unexpectedDeviceLoss: submissions.unexpectedLossReason(),
        };
        submissions.destroy();
        device.destroy();
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
    process.stdout.write(`${JSON.stringify(result)}\n`);
  } finally {
    await browser?.close();
    await vite.close();
  }
}

await main();
