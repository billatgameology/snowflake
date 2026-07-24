#!/usr/bin/env node
// Phase 5 WP1 transport conformance. This is deliberately not gate evidence: it validates
// the frozen transport ABI and blocking memory budgets on the local registered browser lane.

import { existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import os from "node:os";
import process from "node:process";
import { resolve } from "node:path";
import { chromium } from "playwright";
import { createServer as createViteServer } from "vite";
import { hashCounter } from "../../core/src/index.ts";
import {
  coordinateHash,
  createGpuBufferPlan,
  createGpuGridLayout,
  encodeGpuGridUniforms,
  GPU_COORDINATE_HASH_WGSL,
  GPU_COPY_WORDS_WGSL,
  GPU_COUNTER_PRNG_WGSL,
  gpuCoords,
  planGpuDispatchRanges,
  validateGpuAllocation,
  validateGpuRequirements,
} from "../../solver-gpu/src/index.ts";
import {
  PHASE5_BUDGETS,
  PHASE5_EXPECTED_WINDOWS_BACKEND,
  PHASE5_HEADLESS_RUNTIME,
  PHASE5_HEADLESS_RUNTIME_VERSION,
  PHASE5_REQUIRED_FEATURES,
  PHASE5_REQUIRED_LIMITS,
} from "../../runner/src/phase5-protocol.ts";

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
    return { lane: "windows-d3d12", expectedBackend: PHASE5_EXPECTED_WINDOWS_BACKEND };
  }
  throw new Error(`WP1 transport conformance does not support ${process.platform}`);
}

function makeUniformWords(layout, options = {}) {
  return Array.from(
    new Uint32Array(
      encodeGpuGridUniforms({
        layout,
        baseCell: options.baseCell ?? 0,
        generation: options.generation ?? 1,
        rngSeed: options.rngSeed ?? 0,
        tick: options.tick ?? 0,
        streamId: options.streamId ?? 0,
      }),
    ),
  );
}

function exactComparison(expected, observed) {
  let mismatchCount = 0;
  let firstMismatch = null;
  for (let index = 0; index < expected.length; index++) {
    if (expected[index] !== observed[index]) {
      mismatchCount++;
      if (firstMismatch === null) {
        firstMismatch = {
          index,
          expected: expected[index],
          observed: observed[index],
        };
      }
    }
  }
  return { mismatchCount, firstMismatch };
}

async function main() {
  if (process.argv.length !== 2) {
    throw new Error("WP1 transport conformance accepts no options");
  }
  const browserPath = chromium.executablePath();
  if (!existsSync(browserPath)) {
    throw new Error(`the frozen Chromium executable is absent: ${browserPath}`);
  }
  const platform = platformContract();
  const layout = createGpuGridLayout({ nx: 17, ny: 19, nz: 11 });
  const coordinateExpected = Array.from(
    { length: layout.cellCount },
    (_, index) => coordinateHash(...gpuCoords(layout, index)),
  );
  const coordinateAxisSwapExpected = Array.from(
    { length: layout.cellCount },
    (_, index) => {
      const [i, j, k] = gpuCoords(layout, index);
      return coordinateHash(i, k, j);
    },
  );
  const copyWords = new Uint32Array(4_096);
  const copyFloats = new Float32Array(copyWords.buffer);
  for (let index = 0; index < copyWords.length; index++) {
    if (index % 2 === 0) {
      copyWords[index] = hashCounter(0x1357_9bdf, index, 0, 7);
    } else {
      copyFloats[index] = Math.fround((index - 2_048) / 137);
    }
  }
  const copyLayout = createGpuGridLayout({ nx: 16, ny: 16, nz: 16 });
  const prngOptions = {
    rngSeed: 0x2468_ace0,
    tick: 0x1020_3040,
    streamId: 17,
  };
  const prngExpected = Array.from(
    { length: layout.cellCount },
    (_, index) =>
      hashCounter(
        prngOptions.rngSeed,
        index,
        prngOptions.tick,
        prngOptions.streamId,
      ),
  );
  const axisSwapShader = GPU_COORDINATE_HASH_WGSL.replace(
    "(j * 19349663u) ^\n    (k * 83492791u)",
    "(k * 19349663u) ^\n    (j * 83492791u)",
  );
  if (axisSwapShader === GPU_COORDINATE_HASH_WGSL) {
    throw new Error("registered axis-swap shader mutation was not applied");
  }
  const coordinateDispatchRanges = planGpuDispatchRanges(layout.cellCount, 1);

  const blockingAllocations = PHASE5_BUDGETS.filter(
    (budget) => budget.disposition === "blocking",
  ).flatMap((budget) =>
    ["gg", "lk"].map((operator) => {
      const plan = createGpuBufferPlan(budget.dims, operator);
      return {
        budget: budget.id,
        operator,
        totalCellBytes: plan.totalCellBytes,
        plan,
      };
    }),
  );

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
      name: "vcc-phase5-wp1-page",
      configureServer(viteServer) {
        viteServer.middlewares.use((request, response, next) => {
          if (request.url?.split("?")[0] !== "/phase5-wp1") {
            next();
            return;
          }
          response.writeHead(200, {
            "content-type": "text/html; charset=utf-8",
          });
          response.end("<!doctype html><title>VCC Phase 5 WP1 transport</title>");
        });
      },
    }],
  });
  await vite.listen();
  const address = vite.httpServer?.address();
  if (address === null || address === undefined || typeof address === "string") {
    throw new Error("WP1 Vite server did not receive an IPv4 port");
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
    await page.goto(`${origin}/phase5-wp1`, { waitUntil: "load" });
    const deviceResult = await page.evaluate(
      async (input) => {
        if (!isSecureContext) throw new Error("WP1 requires a secure context");
        if (navigator.gpu === undefined) throw new Error("navigator.gpu is unavailable");
        const production = await import(input.productionModuleUrl);
        const adapter = await navigator.gpu.requestAdapter({
          powerPreference: "high-performance",
        });
        if (adapter === null) throw new Error("WebGPU returned no adapter");
        const uncapturedErrors = [];
        const requirements = {
          requiredFeatures: input.requiredFeatures,
          requiredLimits: input.requiredLimits,
        };
        const device = await production.requestCheckedGpuDevice(
          adapter,
          requirements,
          requirements,
          "vcc-phase5-wp1-device",
        );
        device.addEventListener("uncapturederror", (event) => {
          uncapturedErrors.push(event.error.message);
        });
        const submissionController = new production.GpuSubmissionController(device);
        submissionController.acknowledgeEdit(1);
        const readbackAudit = new production.GpuReadbackAudit();
        let residencyNegativePassed = false;
        let omittedFrameTokenNegativePassed = false;
        let chunkedResidencyNegativePassed = false;
        let invalidPurposeNegativePassed = false;
        let requiredLimitOmissionNegativePassed = false;
        let requiredLimitDowngradeNegativePassed = false;
        const omittedLimits = { ...input.requiredLimits };
        delete omittedLimits.maxBufferSize;
        try {
          const unexpectedDevice = await production.requestCheckedGpuDevice(
            adapter,
            {
              requiredFeatures: input.requiredFeatures,
              requiredLimits: omittedLimits,
            },
            requirements,
            "vcc-phase5-wp1-omitted-limit-negative",
          );
          unexpectedDevice.destroy();
        } catch (error) {
          requiredLimitOmissionNegativePassed =
            error instanceof Error &&
            error.message.includes(
              "GPU limit request does not match the frozen policy",
            );
        }
        try {
          const unexpectedDevice = await production.requestCheckedGpuDevice(
            adapter,
            {
              requiredFeatures: input.requiredFeatures,
              requiredLimits: {
                ...input.requiredLimits,
                maxBufferSize: input.requiredLimits.maxBufferSize - 1,
              },
            },
            requirements,
            "vcc-phase5-wp1-downgraded-limit-negative",
          );
          unexpectedDevice.destroy();
        } catch (error) {
          requiredLimitDowngradeNegativePassed =
            error instanceof Error &&
            error.message.includes(
              "GPU limit request does not match the frozen policy",
            );
        }

        async function runKernel(kernel) {
          const shader = device.createShaderModule({
            label: `vcc:wp1:${kernel.label}`,
            code: kernel.shader,
          });
          const compilation = await shader.getCompilationInfo();
          const compilationErrors = compilation.messages
            .filter((message) => message.type === "error")
            .map((message) => `${message.lineNum}:${message.linePos}:${message.message}`);
          if (compilationErrors.length > 0) {
            throw new Error(
              `${kernel.label} shader compilation failed: ${compilationErrors.join("; ")}`,
            );
          }
          const pipeline = await device.createComputePipelineAsync({
            label: `vcc:wp1:${kernel.label}`,
            layout: "auto",
            compute: { module: shader, entryPoint: kernel.entryPoint },
          });
          const uniform = device.createBuffer({
            label: `vcc:wp1:${kernel.label}:uniform`,
            size: 48,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
          });
          const output = device.createBuffer({
            label: `vcc:wp1:${kernel.label}:output`,
            size: kernel.outputWordCount * 4,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
          });
          let source = null;
          try {
            const entries = [
              { binding: 0, resource: { buffer: uniform } },
            ];
            if (kernel.sourceWords === null) {
              entries.push({ binding: 1, resource: { buffer: output } });
            } else {
              source = device.createBuffer({
                label: `vcc:wp1:${kernel.label}:source`,
                size: kernel.sourceWords.length * 4,
                usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
              });
              device.queue.writeBuffer(source, 0, new Uint32Array(kernel.sourceWords));
              entries.push(
                { binding: 1, resource: { buffer: source } },
                { binding: 2, resource: { buffer: output } },
              );
            }
            const bindGroup = device.createBindGroup({
              layout: pipeline.getBindGroupLayout(0),
              entries,
            });
            for (let index = 0; index < kernel.dispatches.length; index++) {
              const dispatch = kernel.dispatches[index];
              device.queue.writeBuffer(
                uniform,
                0,
                new Uint32Array(dispatch.uniformWords),
              );
              const encoder = device.createCommandEncoder({
                label: `vcc:wp1:${kernel.label}:${index}`,
              });
              const pass = encoder.beginComputePass();
              pass.setPipeline(pipeline);
              pass.setBindGroup(0, bindGroup);
              pass.dispatchWorkgroups(dispatch.workgroupCount);
              pass.end();
              await submissionController.submit(
                `vcc:wp1:${kernel.label}:${index}`,
                1,
                [encoder.finish()],
              );
            }
            const readbackIntent = {
              purpose: "test",
              label: kernel.label,
              generation: 1,
              byteOffset: 0,
              byteLength: kernel.outputWordCount * 4,
            };
            const copy = await production.readGpuBuffer(
              device,
              output,
              readbackIntent,
              readbackAudit,
            );
            if (kernel.label === "coordinate-hash") {
              const omittedTokenFrame =
                readbackAudit.beginDisplayFrame("omitted-token-negative");
              try {
                await production.readGpuBuffer(
                  device,
                  output,
                  {
                    ...readbackIntent,
                    label: "omitted-active-frame-token-negative",
                  },
                  readbackAudit,
                );
              } catch (error) {
                omittedFrameTokenNegativePassed =
                  error instanceof Error &&
                  error.message.includes(
                    "active display frame requires its token",
                  );
              } finally {
                readbackAudit.endDisplayFrame(omittedTokenFrame);
              }
              const fullFieldFrame =
                readbackAudit.beginDisplayFrame("full-field-negative");
              try {
                await production.readGpuBuffer(
                  device,
                  output,
                  {
                    ...readbackIntent,
                    label: "full-field-display-frame-negative",
                    displayFrame: fullFieldFrame,
                  },
                  readbackAudit,
                );
              } catch (error) {
                residencyNegativePassed =
                  error instanceof Error &&
                  error.message.includes(
                    "cumulative full-field display-frame readback is forbidden",
                  );
              } finally {
                readbackAudit.endDisplayFrame(fullFieldFrame);
              }
              const chunkedFrame =
                readbackAudit.beginDisplayFrame("chunked-field-negative");
              const firstChunkBytes =
                Math.floor(kernel.outputWordCount / 2) * 4;
              try {
                await production.readGpuBuffer(
                  device,
                  output,
                  {
                    ...readbackIntent,
                    label: "chunked-field-first-half",
                    byteLength: firstChunkBytes,
                    displayFrame: chunkedFrame,
                  },
                  readbackAudit,
                );
                try {
                  await production.readGpuBuffer(
                    device,
                    output,
                    {
                      ...readbackIntent,
                      label: "chunked-field-second-half",
                      byteOffset: firstChunkBytes,
                      byteLength:
                        readbackIntent.byteLength - firstChunkBytes,
                      displayFrame: chunkedFrame,
                    },
                    readbackAudit,
                  );
                } catch (error) {
                  chunkedResidencyNegativePassed =
                    error instanceof Error &&
                    error.message.includes(
                      "cumulative full-field display-frame readback is forbidden",
                    );
                }
              } finally {
                readbackAudit.endDisplayFrame(chunkedFrame);
              }
              try {
                await production.readGpuBuffer(
                  device,
                  output,
                  { ...readbackIntent, purpose: "arbitrary-purpose",
                    label: "invalid-purpose-negative" },
                  readbackAudit,
                );
              } catch {
                invalidPurposeNegativePassed = true;
              }
            }
            return {
              output: Array.from(new Uint32Array(copy)),
              dispatches: kernel.dispatches.map((dispatch) => ({
                baseCell: dispatch.baseCell,
                workgroupCount: dispatch.workgroupCount,
              })),
              compilationMessages: compilation.messages.map((message) => ({
                type: message.type,
                lineNum: message.lineNum,
                linePos: message.linePos,
                message: message.message,
              })),
            };
          } finally {
            source?.destroy();
            output.destroy();
            uniform.destroy();
          }
        }

        const kernels = [];
        for (const kernel of input.kernels) {
          kernels.push({
            label: kernel.label,
            ...(await runKernel(kernel)),
          });
        }

        const allocations = [];
        for (const allocation of input.blockingAllocations) {
          let arena = null;
          try {
            arena = production.GpuBufferArena.create(device, 1, allocation.plan);
            for (const name of arena.names()) {
              arena.upload(device, name, new Uint32Array([0]));
            }
            await device.queue.onSubmittedWorkDone();
            allocations.push({
              budget: allocation.budget,
              operator: allocation.operator,
              totalCellBytes: allocation.totalCellBytes,
              bufferCount: arena.names().length,
              pass: arena.names().length === allocation.plan.buffers.length,
            });
          } finally {
            arena?.destroy();
          }
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
              limitNames.map((name) => [
                name,
                adapter.limits[name],
              ]),
            ),
          },
          device: {
            limits: Object.fromEntries(
              limitNames.map((name) => [
                name,
                device.limits[name],
              ]),
            ),
          },
          kernels,
          allocations,
          submissionRecords: submissionController.records(),
          readbackRecords: readbackAudit.records(),
          fullFieldDisplayFrameCount:
            readbackAudit.fullFieldDisplayFrameCount(),
          residencyNegativePassed,
          omittedFrameTokenNegativePassed,
          chunkedResidencyNegativePassed,
          invalidPurposeNegativePassed,
          requiredLimitOmissionNegativePassed,
          requiredLimitDowngradeNegativePassed,
          uncapturedErrors,
        };
        submissionController.destroy();
        return result;
      },
      {
        productionModuleUrl: `${origin}/solver-gpu/src/index.ts`,
        requiredFeatures: [...PHASE5_REQUIRED_FEATURES],
        requiredLimits: { ...PHASE5_REQUIRED_LIMITS },
        kernels: [
          {
            label: "coordinate-hash",
            shader: GPU_COORDINATE_HASH_WGSL,
            entryPoint: "coordinateHash",
            outputWordCount: layout.cellCount,
            sourceWords: null,
            dispatches: coordinateDispatchRanges.map((range) => ({
              baseCell: range.baseCell,
              uniformWords: makeUniformWords(layout, {
                baseCell: range.baseCell,
              }),
              workgroupCount: range.workgroupCount,
            })),
          },
          {
            label: "coordinate-axis-swap-negative",
            shader: axisSwapShader,
            entryPoint: "coordinateHash",
            outputWordCount: layout.cellCount,
            sourceWords: null,
            dispatches: [{
              baseCell: 0,
              uniformWords: makeUniformWords(layout),
              workgroupCount: Math.ceil(layout.cellCount / 256),
            }],
          },
          {
            label: "copy-u32-f32-bits",
            shader: GPU_COPY_WORDS_WGSL,
            entryPoint: "copyWords",
            outputWordCount: copyLayout.cellCount,
            sourceWords: Array.from(copyWords),
            dispatches: [{
              baseCell: 0,
              uniformWords: makeUniformWords(copyLayout),
              workgroupCount: Math.ceil(copyLayout.cellCount / 256),
            }],
          },
          {
            label: "counter-prng",
            shader: GPU_COUNTER_PRNG_WGSL,
            entryPoint: "counterPrng",
            outputWordCount: layout.cellCount,
            sourceWords: null,
            dispatches: [{
              baseCell: 0,
              uniformWords: makeUniformWords(layout, prngOptions),
              workgroupCount: Math.ceil(layout.cellCount / 256),
            }],
          },
        ],
        blockingAllocations,
      },
    );

    const kernelByLabel = Object.fromEntries(
      deviceResult.kernels.map((kernel) => [kernel.label, kernel]),
    );
    const coordinate = exactComparison(
      coordinateExpected,
      kernelByLabel["coordinate-hash"].output,
    );
    const axisSwap = exactComparison(
      coordinateExpected,
      kernelByLabel["coordinate-axis-swap-negative"].output,
    );
    const axisSwapMutationIntegrity = exactComparison(
      coordinateAxisSwapExpected,
      kernelByLabel["coordinate-axis-swap-negative"].output,
    );
    const copy = exactComparison(
      Array.from(copyWords),
      kernelByLabel["copy-u32-f32-bits"].output,
    );
    const prng = exactComparison(
      prngExpected,
      kernelByLabel["counter-prng"].output,
    );

    const adapterCapability = {
      features: new Set(deviceResult.adapter.features),
      limits: deviceResult.adapter.limits,
    };
    const requirements = {
      requiredFeatures: [...PHASE5_REQUIRED_FEATURES],
      requiredLimits: { ...PHASE5_REQUIRED_LIMITS },
    };
    const requirementCheck = validateGpuRequirements(adapterCapability, requirements);
    const firstLimit = Object.keys(PHASE5_REQUIRED_LIMITS)[0];
    const insufficientCapability = {
      features: adapterCapability.features,
      limits: {
        ...adapterCapability.limits,
        [firstLimit]: PHASE5_REQUIRED_LIMITS[firstLimit] - 1,
      },
    };
    const requiredLimitNegative = validateGpuRequirements(
      insufficientCapability,
      requirements,
    );

    const allocationCapabilities = PHASE5_BUDGETS.flatMap((budget) =>
      ["gg", "lk"].map((operator) => {
        const plan = createGpuBufferPlan(budget.dims, operator);
        return {
          budget: budget.id,
          disposition: budget.disposition,
          operator,
          ...validateGpuAllocation(plan, {
            maxBufferSize: deviceResult.device.limits.maxBufferSize,
            maxStorageBufferBindingSize:
              deviceResult.device.limits.maxStorageBufferBindingSize,
          }),
        };
      }),
    );
    const previewRanges = PHASE5_BUDGETS.filter((budget) =>
      budget.id.startsWith("preview-"),
    ).map((budget) => {
      const budgetLayout = createGpuGridLayout(budget.dims);
      const ranges = planGpuDispatchRanges(budgetLayout.cellCount);
      return {
        budget: budget.id,
        cellCount: budgetLayout.cellCount,
        rangeCount: ranges.length,
        maxWorkgroupCount: Math.max(...ranges.map((range) => range.workgroupCount)),
        contiguous:
          ranges[0]?.baseCell === 0 &&
          ranges.every(
            (range, index) =>
              index === 0 ||
              range.baseCell ===
                ranges[index - 1].baseCell + ranges[index - 1].cellCount,
          ),
        coveredCells: ranges.reduce((sum, range) => sum + range.cellCount, 0),
      };
    });
    const backend = String(deviceResult.adapter.info.backend ?? "");
    const coordinateDispatches =
      kernelByLabel["coordinate-hash"].dispatches;
    const coordinateMultiRangePassed =
      coordinateDispatches.length === coordinateDispatchRanges.length &&
      coordinateDispatches.length > 1 &&
      coordinateDispatches.some((dispatch) => dispatch.baseCell > 0) &&
      coordinateDispatches.every(
        (dispatch, index) =>
          dispatch.baseCell === coordinateDispatchRanges[index].baseCell &&
          dispatch.workgroupCount ===
            coordinateDispatchRanges[index].workgroupCount,
      );
    const repository = {
      commit: git("rev-parse", "HEAD"),
      clean: git("status", "--porcelain").length === 0,
    };
    const browserVersion = await (
      await browser.newBrowserCDPSession()
    ).send("Browser.getVersion");
    const report = {
      schema: "phase5-wp1-transport-v1",
      lane: platform.lane,
      pass:
        repository.clean &&
        backend.toLowerCase() === platform.expectedBackend.toLowerCase() &&
        requirementCheck.supported &&
        !requiredLimitNegative.supported &&
        requiredLimitNegative.insufficientLimits.length === 1 &&
        coordinate.mismatchCount === 0 &&
        axisSwap.mismatchCount > 0 &&
        axisSwapMutationIntegrity.mismatchCount === 0 &&
        copy.mismatchCount === 0 &&
        prng.mismatchCount === 0 &&
        deviceResult.allocations.every((allocation) => allocation.pass) &&
        allocationCapabilities
          .filter((entry) => entry.disposition === "blocking")
          .every((entry) => entry.supported) &&
        allocationCapabilities
          .filter((entry) => entry.budget.startsWith("bake-"))
          .every((entry) => !entry.supported) &&
        previewRanges.every(
          (entry) =>
            entry.contiguous &&
            entry.coveredCells === entry.cellCount &&
            entry.maxWorkgroupCount <= 16_384,
        ) &&
        coordinateMultiRangePassed &&
        deviceResult.submissionRecords.length >=
          coordinateDispatchRanges.length + 3 &&
        deviceResult.readbackRecords.length === 5 &&
        deviceResult.residencyNegativePassed &&
        deviceResult.omittedFrameTokenNegativePassed &&
        deviceResult.chunkedResidencyNegativePassed &&
        deviceResult.invalidPurposeNegativePassed &&
        deviceResult.requiredLimitOmissionNegativePassed &&
        deviceResult.requiredLimitDowngradeNegativePassed &&
        deviceResult.fullFieldDisplayFrameCount === 0 &&
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
        requirements: requirementCheck,
        requiredLimitNegative,
        coordinate,
        axisSwapNegative: axisSwap,
        axisSwapMutationIntegrity,
        copy,
        prng,
        blockingAllocations: deviceResult.allocations,
        allocationCapabilities,
        previewRanges,
        coordinateMultiRange: {
          expected: coordinateDispatchRanges,
          observed: coordinateDispatches,
          pass: coordinateMultiRangePassed,
        },
        submissions: deviceResult.submissionRecords,
        readback: {
          records: deviceResult.readbackRecords,
          fullFieldDisplayFrameCount:
            deviceResult.fullFieldDisplayFrameCount,
          residencyNegativePassed: deviceResult.residencyNegativePassed,
          omittedFrameTokenNegativePassed:
            deviceResult.omittedFrameTokenNegativePassed,
          chunkedResidencyNegativePassed:
            deviceResult.chunkedResidencyNegativePassed,
          invalidPurposeNegativePassed:
            deviceResult.invalidPurposeNegativePassed,
        },
        requiredRequestNegatives: {
          omission: deviceResult.requiredLimitOmissionNegativePassed,
          downgrade: deviceResult.requiredLimitDowngradeNegativePassed,
        },
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
