#!/usr/bin/env node
// Phase 5 WP1 transport conformance. This is deliberately not gate evidence: it validates
// the frozen transport ABI and blocking memory budgets on the local registered browser lane.

import { existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { createServer } from "node:http";
import os from "node:os";
import process from "node:process";
import { resolve } from "node:path";
import { chromium } from "playwright";
import { hashCounter } from "../../core/src/index.ts";
import {
  coordinateHash,
  createGpuBufferPlan,
  createGpuGridLayout,
  encodeGpuGridUniforms,
  GPU_COORDINATE_HASH_WGSL,
  GPU_COPY_WORDS_WGSL,
  GPU_COUNTER_PRNG_WGSL,
  GpuReadbackAudit,
  gpuCoords,
  planGpuDispatchRanges,
  validateGpuAllocation,
  validateGpuRequirements,
} from "../../solver-gpu/src/index.ts";
import {
  PHASE5_BUDGETS,
  PHASE5_EXPECTED_METAL_BACKEND,
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
  if (process.platform === "darwin") {
    return { lane: "macos-metal", expectedBackend: PHASE5_EXPECTED_METAL_BACKEND };
  }
  throw new Error(`WP1 transport conformance does not support ${process.platform}`);
}

async function listen(server) {
  await new Promise((resolvePromise, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolvePromise);
  });
  const address = server.address();
  if (address === null || typeof address === "string") {
    throw new Error("WP1 server did not receive an IPv4 port");
  }
  return address.port;
}

function stop(server) {
  return new Promise((resolvePromise, reject) => {
    server.close((error) => (error === undefined ? resolvePromise() : reject(error)));
  });
}

function makeUniformWords(layout, options = {}) {
  return Array.from(
    new Uint32Array(
      encodeGpuGridUniforms({
        layout,
        baseCell: 0,
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

  const blockingAllocations = PHASE5_BUDGETS.filter(
    (budget) => budget.disposition === "blocking",
  ).flatMap((budget) =>
    ["gg", "lk"].map((operator) => {
      const plan = createGpuBufferPlan(budget.dims, operator);
      return {
        budget: budget.id,
        operator,
        totalCellBytes: plan.totalCellBytes,
        buffers: plan.buffers.map((buffer) => ({
          name: buffer.name,
          byteLength: buffer.byteLength,
        })),
      };
    }),
  );

  const server = createServer((_request, response) => {
    response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    response.end("<!doctype html><title>VCC Phase 5 WP1 transport</title>");
  });
  const port = await listen(server);
  let browser = null;
  try {
    browser = await chromium.launch({
      executablePath: browserPath,
      headless: true,
      args: ["--enable-unsafe-webgpu", "--enable-webgpu-developer-features"],
    });
    const page = await browser.newPage();
    await page.goto(`http://127.0.0.1:${port}`, { waitUntil: "load" });
    const deviceResult = await page.evaluate(
      async (input) => {
        if (!isSecureContext) throw new Error("WP1 requires a secure context");
        if (navigator.gpu === undefined) throw new Error("navigator.gpu is unavailable");
        const adapter = await navigator.gpu.requestAdapter({
          powerPreference: "high-performance",
        });
        if (adapter === null) throw new Error("WebGPU returned no adapter");
        const uncapturedErrors = [];
        const device = await adapter.requestDevice({
          requiredFeatures: input.requiredFeatures,
          requiredLimits: input.requiredLimits,
        });
        device.addEventListener("uncapturederror", (event) => {
          uncapturedErrors.push(event.error.message);
        });

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
          const staging = device.createBuffer({
            label: `vcc:wp1:${kernel.label}:readback`,
            size: kernel.outputWordCount * 4,
            usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
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
            device.queue.writeBuffer(uniform, 0, new Uint32Array(kernel.uniformWords));
            const bindGroup = device.createBindGroup({
              layout: pipeline.getBindGroupLayout(0),
              entries,
            });
            const encoder = device.createCommandEncoder({
              label: `vcc:wp1:${kernel.label}`,
            });
            const pass = encoder.beginComputePass();
            pass.setPipeline(pipeline);
            pass.setBindGroup(0, bindGroup);
            pass.dispatchWorkgroups(kernel.workgroupCount);
            pass.end();
            encoder.copyBufferToBuffer(
              output,
              0,
              staging,
              0,
              kernel.outputWordCount * 4,
            );
            device.queue.submit([encoder.finish()]);
            await device.queue.onSubmittedWorkDone();
            await staging.mapAsync(GPUMapMode.READ);
            const copy = staging
              .getMappedRange(0, kernel.outputWordCount * 4)
              .slice(0);
            staging.unmap();
            return {
              output: Array.from(new Uint32Array(copy)),
              compilationMessages: compilation.messages.map((message) => ({
                type: message.type,
                lineNum: message.lineNum,
                linePos: message.linePos,
                message: message.message,
              })),
            };
          } finally {
            source?.destroy();
            staging.destroy();
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
          const buffers = [];
          try {
            for (const descriptor of allocation.buffers) {
              const buffer = device.createBuffer({
                label:
                  `vcc:wp1:${allocation.budget}:${allocation.operator}:` +
                  descriptor.name,
                size: descriptor.byteLength,
                usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
              });
              buffers.push(buffer);
              device.queue.writeBuffer(buffer, 0, new Uint32Array([0]));
            }
            await device.queue.onSubmittedWorkDone();
            allocations.push({
              budget: allocation.budget,
              operator: allocation.operator,
              totalCellBytes: allocation.totalCellBytes,
              bufferCount: buffers.length,
              pass: buffers.length === allocation.buffers.length,
            });
          } finally {
            for (const buffer of buffers) buffer.destroy();
          }
        }
        await new Promise((resolvePromise) => setTimeout(resolvePromise, 0));
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
            requiredLimits: Object.fromEntries(
              Object.keys(input.requiredLimits).map((name) => [
                name,
                adapter.limits[name],
              ]),
            ),
          },
          kernels,
          allocations,
          uncapturedErrors,
        };
        device.destroy();
        return result;
      },
      {
        requiredFeatures: [...PHASE5_REQUIRED_FEATURES],
        requiredLimits: { ...PHASE5_REQUIRED_LIMITS },
        kernels: [
          {
            label: "coordinate-hash",
            shader: GPU_COORDINATE_HASH_WGSL,
            entryPoint: "coordinateHash",
            uniformWords: makeUniformWords(layout),
            outputWordCount: layout.cellCount,
            sourceWords: null,
            workgroupCount: Math.ceil(layout.cellCount / 256),
          },
          {
            label: "coordinate-axis-swap-negative",
            shader: axisSwapShader,
            entryPoint: "coordinateHash",
            uniformWords: makeUniformWords(layout),
            outputWordCount: layout.cellCount,
            sourceWords: null,
            workgroupCount: Math.ceil(layout.cellCount / 256),
          },
          {
            label: "copy-u32-f32-bits",
            shader: GPU_COPY_WORDS_WGSL,
            entryPoint: "copyWords",
            uniformWords: makeUniformWords(copyLayout),
            outputWordCount: copyLayout.cellCount,
            sourceWords: Array.from(copyWords),
            workgroupCount: Math.ceil(copyLayout.cellCount / 256),
          },
          {
            label: "counter-prng",
            shader: GPU_COUNTER_PRNG_WGSL,
            entryPoint: "counterPrng",
            uniformWords: makeUniformWords(layout, prngOptions),
            outputWordCount: layout.cellCount,
            sourceWords: null,
            workgroupCount: Math.ceil(layout.cellCount / 256),
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

    const readbackAudit = new GpuReadbackAudit();
    for (const kernel of deviceResult.kernels) {
      readbackAudit.authorize({
        purpose: "test",
        label: kernel.label,
        generation: 1,
        byteOffset: 0,
        byteLength: kernel.output.length * 4,
        fullField: true,
        displayFrame: false,
      });
    }
    let residencyNegativePassed = false;
    try {
      readbackAudit.authorize({
        purpose: "test",
        label: "full-field-display-frame-negative",
        generation: 1,
        byteOffset: 0,
        byteLength: layout.cellCount * 4,
        fullField: true,
        displayFrame: true,
      });
    } catch {
      residencyNegativePassed = true;
    }

    const adapterCapability = {
      features: new Set(deviceResult.adapter.features),
      limits: deviceResult.adapter.requiredLimits,
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
            maxBufferSize: deviceResult.adapter.requiredLimits.maxBufferSize,
            maxStorageBufferBindingSize:
              deviceResult.adapter.requiredLimits.maxStorageBufferBindingSize,
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
        previewRanges.every(
          (entry) =>
            entry.contiguous &&
            entry.coveredCells === entry.cellCount &&
            entry.maxWorkgroupCount <= 16_384,
        ) &&
        residencyNegativePassed &&
        readbackAudit.fullFieldDisplayFrameCount() === 0 &&
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
        readback: {
          records: readbackAudit.records(),
          fullFieldDisplayFrameCount: readbackAudit.fullFieldDisplayFrameCount(),
          residencyNegativePassed,
        },
        uncapturedErrors: deviceResult.uncapturedErrors,
      },
    };
    console.log(JSON.stringify(report, null, 2));
    if (!report.pass) process.exitCode = 1;
  } finally {
    if (browser !== null) await browser.close();
    await stop(server);
  }
}

await main();
