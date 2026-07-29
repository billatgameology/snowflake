#!/usr/bin/env node
// Phase 5 WP1 transport conformance. This is deliberately not gate evidence: it validates
// the frozen transport ABI and blocking memory budgets on the local registered browser lane.

import { existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import os from "node:os";
import process from "node:process";
import { resolve } from "node:path";
import { chromium } from "playwright";
import { createServer as createViteServer } from "vite";
import {
  domainCenter,
  encodeCheckpoint,
  GG_PRESETS,
  hashCounter,
} from "../../core/src/index.ts";
import {
  coordinateHash,
  createGpuBufferPlan,
  createGpuGridLayout,
  encodeGpuGridUniforms,
  GPU_COORDINATE_HASH_WGSL,
  GPU_COPY_WORDS_WGSL,
  GPU_COUNTER_PRNG_WGSL,
  gpuCoords,
  gpuIndex,
  planGpuDispatchRanges,
  validateGpuAllocation,
  validateGpuRequirements,
} from "../../solver-gpu/src/index.ts";
import {
  PHASE5_BUDGETS,
  PHASE5_EXPECTED_WINDOWS_BACKEND,
  PHASE5_FIXTURES,
  PHASE5_HEADLESS_RUNTIME,
  PHASE5_HEADLESS_RUNTIME_VERSION,
  PHASE5_REQUIRED_FEATURES,
  PHASE5_REQUIRED_LIMITS,
} from "../../runner/src/phase5-protocol.ts";

const repoRoot = resolve(import.meta.dirname, "..", "..");

// Both frozen cell-buffer schemas are published per lane so the layout fixture's field-offset
// observation covers the whole registered ABI, not only the operator the probe happens to run.
const LANE_OBSERVATION_OPERATORS = ["gg", "lk"];

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

// The host plan's complete per-buffer schema for one budget/operator, in plan order. These are
// PLANNED values with no device observation in them: they cover every registered budget,
// including the bake budgets the lane never attempts. The per-buffer graph the device actually
// accepted is published per attempted budget as `checks.blockingAllocations[].buffers`.
function planAllocationGraph(plan) {
  let byteOffset = 0;
  const buffers = plan.buffers.map((descriptor, index) => {
    const entry = {
      index,
      name: descriptor.name,
      byteOffset,
      byteLength: descriptor.byteLength,
      scalarType: descriptor.scalarType,
      ownership: descriptor.ownership,
    };
    byteOffset += descriptor.byteLength;
    return entry;
  });
  return {
    buffers,
    totals: {
      bufferCount: buffers.length,
      cellCount: plan.layout.cellCount,
      bytesPerCell: plan.bytesPerCell,
      totalCellBytes: plan.totalCellBytes,
      summedBufferBytes: byteOffset,
      largestBufferBytes: Math.max(...buffers.map((entry) => entry.byteLength)),
    },
  };
}

// Lowercase SHA-256 over one lane's OWN bytes, so no comparison can agree because one side was
// copied from the other. WP1 compares in the Node process rather than in the page, so this uses
// node:crypto where the in-page probes use `crypto.subtle`.
function digestHex(values) {
  return createHash("sha256")
    .update(new Uint8Array(values.buffer, values.byteOffset, values.byteLength))
    .digest("hex");
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
  const layoutFixture = PHASE5_FIXTURES.find(
    (fixture) => fixture.id === "layout-noncubic-box-17x19x11",
  );
  if (layoutFixture === undefined || layoutFixture.kind !== "layout") {
    throw new Error("WP1 layout fixture is absent");
  }
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
    (budget) => !budget.id.startsWith("bake-"),
  ).flatMap((budget) =>
    ["gg", "lk"].map((operator) => {
      const plan = createGpuBufferPlan(budget.dims, operator);
      return {
        budget: budget.id,
        disposition: budget.disposition,
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
        // Observed adapter/device acquisition. Both entry points are wrapped before this probe
        // acquires anything, so every acquisition the run performs is counted and the
        // re-acquisition count derived below is measured rather than assumed.
        const acquisitions = [];
        const acquisitionCounts = { adapter: 0, device: 0 };
        const nativeRequestAdapter = navigator.gpu.requestAdapter.bind(navigator.gpu);
        navigator.gpu.requestAdapter = function requestAdapter(options) {
          acquisitionCounts.adapter++;
          acquisitions.push({
            kind: "adapter",
            ordinal: acquisitionCounts.adapter,
            label: String(options?.powerPreference ?? "default"),
          });
          return nativeRequestAdapter(options);
        };
        const nativeRequestDevice = GPUAdapter.prototype.requestDevice;
        GPUAdapter.prototype.requestDevice = function requestDevice(descriptor) {
          acquisitionCounts.device++;
          acquisitions.push({
            kind: "device",
            ordinal: acquisitionCounts.device,
            label: String(descriptor?.label ?? ""),
          });
          return nativeRequestDevice.call(this, descriptor);
        };
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
        // Device loss is observed from the moment the device exists, so the published loss
        // count is the length of a list this run actually recorded.
        const deviceLossRecords = [];
        void device.lost.then((info) => {
          deviceLossRecords.push({
            reason: String(info.reason),
            message: String(info.message),
          });
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

        // Every registered non-bake budget is attempted for BOTH operators, and the complete
        // per-buffer allocation graph the device accepted is preserved for each attempt: the
        // live arena's owned-buffer inventory, in arena order, with every byte length, usage,
        // label and map state read from the device buffer object rather than from the host
        // plan, beside the plan descriptor each buffer was created for.
        const allocations = [];
        for (const allocation of input.blockingAllocations) {
          let arena = null;
          try {
            arena = production.GpuBufferArena.create(device, 1, allocation.plan);
            const probeUpload = new Uint32Array([0]);
            for (const name of arena.names()) {
              arena.upload(device, name, probeUpload);
            }
            await device.queue.onSubmittedWorkDone();
            const names = arena.names();
            let byteOffset = 0;
            const buffers = names.map((name, index) => {
              const buffer = arena.get(name);
              const descriptor = allocation.plan.buffers[index] ?? null;
              const byteLength = Number(buffer.size);
              const entry = {
                index,
                name,
                byteOffset,
                byteLength,
                usage: Number(buffer.usage),
                label: String(buffer.label),
                mapState: String(buffer.mapState),
                uploadedBytes: probeUpload.byteLength,
                planName: descriptor === null ? null : descriptor.name,
                planByteLength: descriptor === null ? null : descriptor.byteLength,
                scalarType: descriptor === null ? null : descriptor.scalarType,
                ownership: descriptor === null ? null : descriptor.ownership,
                matchesPlan:
                  descriptor !== null &&
                  descriptor.name === name &&
                  descriptor.byteLength === byteLength,
              };
              byteOffset += byteLength;
              return entry;
            });
            allocations.push({
              budget: allocation.budget,
              disposition: allocation.disposition,
              operator: allocation.operator,
              totalCellBytes: allocation.totalCellBytes,
              bufferCount: names.length,
              pass: names.length === allocation.plan.buffers.length,
              buffers,
              totals: {
                bufferCount: names.length,
                planBufferCount: allocation.plan.buffers.length,
                cellCount: allocation.plan.layout.cellCount,
                bytesPerCell: allocation.plan.bytesPerCell,
                observedTotalBytes: byteOffset,
                planTotalCellBytes: allocation.plan.totalCellBytes,
                largestObservedBufferBytes: Math.max(
                  ...buffers.map((entry) => entry.byteLength),
                ),
                matchesPlan:
                  names.length === allocation.plan.buffers.length &&
                  byteOffset === allocation.plan.totalCellBytes &&
                  buffers.every((entry) => entry.matchesPlan),
              },
            });
          } finally {
            arena?.destroy();
          }
        }
        // GPU-lane view of the frozen cell-buffer layout at the layout fixture's own
        // dimensions: the live arena's owned-buffer inventory, in arena order, with every
        // byte length taken from the device buffer object instead of the host plan.
        const deviceFieldOffsets = {};
        let devicePingPong = null;
        for (const operator of input.laneOperators) {
          const laneArena = production.GpuBufferArena.create(
            device,
            1,
            production.createGpuBufferPlan(input.laneDims, operator),
          );
          try {
            let byteOffset = 0;
            deviceFieldOffsets[operator] = laneArena.names().map((name) => {
              const entry = {
                name,
                byteOffset,
                byteLength: Number(laneArena.get(name).size),
              };
              byteOffset += entry.byteLength;
              return entry;
            });
            if (operator === "gg") {
              const pingPongNames = laneArena
                .names()
                .filter((name) => name.startsWith("ggVapor"));
              devicePingPong = {
                ownership: operator,
                buffers: pingPongNames.map((name) => ({
                  name,
                  byteLength: Number(laneArena.get(name).size),
                })),
                distinctBuffers: new Set(
                  pingPongNames.map((name) => laneArena.get(name)),
                ).size,
              };
            }
          } finally {
            laneArena.destroy();
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
          deviceFieldOffsets,
          devicePingPong,
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
          // Re-acquisitions are the acquisitions beyond the first of their kind. The counted
          // requests and the acquisition inventory beside them are what make that a
          // measurement instead of an assumption.
          adapterRequests: acquisitionCounts.adapter,
          deviceRequests: acquisitionCounts.device,
          acquisitions,
          reacquisitions: acquisitions.filter((entry) => entry.ordinal > 1),
          deviceLossRecords,
          unexpectedDeviceLoss: submissionController.unexpectedLossReason(),
          uncapturedErrors,
        };
        submissionController.destroy();
        return result;
      },
      {
        productionModuleUrl: `${origin}/solver-gpu/src/index.ts`,
        requiredFeatures: [...PHASE5_REQUIRED_FEATURES],
        requiredLimits: { ...PHASE5_REQUIRED_LIMITS },
        laneOperators: [...LANE_OBSERVATION_OPERATORS],
        laneDims: { ...layoutFixture.dims },
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
    function layoutState(words) {
      const a = Uint8Array.from(words, (word) => word & 1);
      const b = new Float64Array(words.length);
      const d = Float64Array.from(
        words,
        (word, index) => a[index] === 1 ? 0 : Math.fround(word / 2 ** 32),
      );
      return {
        dims: layoutFixture.dims,
        tick: 0,
        rngSeed: layoutFixture.rngSeed,
        noiseEpsilon: layoutFixture.noiseEpsilon,
        farField: "reflecting",
        domain: layoutFixture.domain,
        params: GG_PRESETS.plate,
        center: domainCenter(layoutFixture.dims),
        a,
        b,
        d,
      };
    }
    // Per-lane observations for the registered layout science names. Every `cpu` value is
    // computed only from host-recomputed expected data and every `gpu` value only from the
    // device readbacks or the live device objects; a lane is never filled from the other.
    const coordinateObserved = kernelByLabel["coordinate-hash"].output;
    const copyObserved = kernelByLabel["copy-u32-f32-bits"].output;
    const prngObserved = kernelByLabel["counter-prng"].output;
    let cpuRoundTripCells = 0;
    for (let index = 0; index < layout.cellCount; index++) {
      const [i, j, k] = gpuCoords(layout, index);
      if (gpuIndex(layout, i, j, k) === index) cpuRoundTripCells++;
    }
    const cpuFieldOffsets = Object.fromEntries(
      LANE_OBSERVATION_OPERATORS.map((operator) => {
        let byteOffset = 0;
        return [
          operator,
          createGpuBufferPlan(layoutFixture.dims, operator).buffers.map(
            (descriptor) => {
              const entry = {
                name: descriptor.name,
                byteOffset,
                byteLength: descriptor.byteLength,
              };
              byteOffset += descriptor.byteLength;
              return entry;
            },
          ),
        ];
      }),
    );
    const cpuPingPongBuffers = createGpuBufferPlan(layoutFixture.dims, "gg")
      .buffers.filter((descriptor) => descriptor.name.startsWith("ggVapor"))
      .map((descriptor) => ({
        name: descriptor.name,
        byteLength: descriptor.byteLength,
      }));
    const cpuTerminal = {
      reason:
        cpuRoundTripCells === layout.cellCount ? "completed" : "incomplete",
      cells: cpuRoundTripCells,
    };
    const gpuTerminal = {
      reason:
        deviceResult.uncapturedErrors.length > 0
          ? "device-error"
          : coordinateObserved.length === layout.cellCount
            ? "completed"
            : "incomplete",
      cells: coordinateObserved.length,
    };
    const layoutObservations = {
      "layout.field-offsets": {
        cpu: cpuFieldOffsets,
        gpu: deviceResult.deviceFieldOffsets,
      },
      "layout.index-round-trip": {
        cpu: {
          cellCount: layout.cellCount,
          sha256: digestHex(Uint32Array.from(coordinateExpected)),
        },
        gpu: {
          cellCount: coordinateObserved.length,
          sha256: digestHex(Uint32Array.from(coordinateObserved)),
        },
      },
      "layout.ping-pong-ownership": {
        cpu: {
          ownership: "gg",
          buffers: cpuPingPongBuffers,
          distinctBuffers: new Set(
            cpuPingPongBuffers.map((entry) => entry.name),
          ).size,
        },
        gpu: deviceResult.devicePingPong,
      },
      "stop.reason": { cpu: cpuTerminal, gpu: gpuTerminal },
      "layout-round-trip": {
        cpu: {
          coordinateHashSha256: digestHex(Uint32Array.from(coordinateExpected)),
          copyWordsSha256: digestHex(copyWords),
          counterPrngSha256: digestHex(Uint32Array.from(prngExpected)),
          copyWordCount: copyWords.length,
        },
        gpu: {
          coordinateHashSha256: digestHex(Uint32Array.from(coordinateObserved)),
          copyWordsSha256: digestHex(Uint32Array.from(copyObserved)),
          counterPrngSha256: digestHex(Uint32Array.from(prngObserved)),
          copyWordCount: copyObserved.length,
        },
      },
      stop: { cpu: cpuTerminal, gpu: gpuTerminal },
    };
    const layoutCheckpoint = {
      cpuCheckpointBase64: Buffer.from(
        encodeCheckpoint(layoutState(coordinateExpected), null),
      ).toString("base64"),
      gpuCheckpointBase64: Buffer.from(
        encodeCheckpoint(
          layoutState(kernelByLabel["coordinate-hash"].output),
          null,
        ),
      ).toString("base64"),
      laneObservations: layoutObservations,
    };

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
        const graph = planAllocationGraph(plan);
        return {
          budget: budget.id,
          disposition: budget.disposition,
          operator,
          ...validateGpuAllocation(plan, {
            maxBufferSize: deviceResult.device.limits.maxBufferSize,
            maxStorageBufferBindingSize:
              deviceResult.device.limits.maxStorageBufferBindingSize,
          }),
          attempted: blockingAllocations.some(
            (entry) => entry.budget === budget.id && entry.operator === operator,
          ),
          plannedBuffers: graph.buffers,
          plannedTotals: graph.totals,
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
    // Observed runtime counters. Each one is the length of this probe's OWN observation list,
    // published beside that list, so a zero here always names the observations that produced
    // it instead of substituting for a quantity the run never measured.
    const deviceLossCount = deviceResult.deviceLossRecords.length;
    const uncapturedErrorCount = deviceResult.uncapturedErrors.length;
    const hiddenRetryCount = deviceResult.reacquisitions.length;
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
      deviceLossCount,
      uncapturedErrorCount,
      hiddenRetryCount,
      checks: {
        requirements: requirementCheck,
        requiredLimitNegative,
        coordinate,
        layoutCheckpoint,
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
        deviceAcquisition: {
          adapterRequests: deviceResult.adapterRequests,
          deviceRequests: deviceResult.deviceRequests,
          acquisitions: deviceResult.acquisitions,
          reacquisitions: deviceResult.reacquisitions,
        },
        deviceLossRecords: deviceResult.deviceLossRecords,
        unexpectedDeviceLoss: deviceResult.unexpectedDeviceLoss,
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
