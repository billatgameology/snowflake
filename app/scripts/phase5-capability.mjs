#!/usr/bin/env node
// Phase 5 WP0 two-host capability probe. It launches the lockfile-pinned Chromium through
// Playwright, enables Chrome's development-only adapter provenance fields, requests the exact
// frozen limits, executes one timestamped compute dispatch, and proves validation errors are
// capturable. It prints JSON and writes no evidence by itself.

import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { createServer } from "node:http";
import os from "node:os";
import { resolve } from "node:path";
import process from "node:process";
import { chromium } from "playwright";
import {
  PHASE5_EXPECTED_METAL_BACKEND,
  PHASE5_EXPECTED_WINDOWS_BACKEND,
  PHASE5_HEADLESS_RUNTIME,
  PHASE5_HEADLESS_RUNTIME_VERSION,
  PHASE5_REQUIRED_FEATURES,
  PHASE5_REQUIRED_LIMITS,
} from "../../runner/src/phase5-protocol.ts";

const repoRoot = resolve(import.meta.dirname, "..", "..");

function defaultLane() {
  if (process.platform === "win32") return "windows-d3d12";
  if (process.platform === "darwin") return "macos-metal";
  return "unsupported";
}

function defaultExpectedBackend() {
  if (process.platform === "win32") return PHASE5_EXPECTED_WINDOWS_BACKEND;
  if (process.platform === "darwin") return PHASE5_EXPECTED_METAL_BACKEND;
  return "unsupported";
}

function git(...args) {
  return execFileSync("git", args, {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

async function listen(server) {
  await new Promise((resolvePromise, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolvePromise);
  });
  const address = server.address();
  if (address === null || typeof address === "string") {
    throw new Error("capability server did not receive an IPv4 port");
  }
  return address.port;
}

function stop(server) {
  return new Promise((resolvePromise, reject) => {
    server.close((error) => (error === undefined ? resolvePromise() : reject(error)));
  });
}

const LIMIT_NAMES = [
  "maxTextureDimension1D",
  "maxTextureDimension2D",
  "maxTextureDimension3D",
  "maxTextureArrayLayers",
  "maxBindGroups",
  "maxBindGroupsPlusVertexBuffers",
  "maxBindingsPerBindGroup",
  "maxDynamicUniformBuffersPerPipelineLayout",
  "maxDynamicStorageBuffersPerPipelineLayout",
  "maxSampledTexturesPerShaderStage",
  "maxSamplersPerShaderStage",
  "maxStorageBuffersPerShaderStage",
  "maxStorageTexturesPerShaderStage",
  "maxUniformBuffersPerShaderStage",
  "maxUniformBufferBindingSize",
  "maxStorageBufferBindingSize",
  "minUniformBufferOffsetAlignment",
  "minStorageBufferOffsetAlignment",
  "maxVertexBuffers",
  "maxBufferSize",
  "maxVertexAttributes",
  "maxVertexBufferArrayStride",
  "maxInterStageShaderVariables",
  "maxColorAttachments",
  "maxColorAttachmentBytesPerSample",
  "maxComputeWorkgroupStorageSize",
  "maxComputeInvocationsPerWorkgroup",
  "maxComputeWorkgroupSizeX",
  "maxComputeWorkgroupSizeY",
  "maxComputeWorkgroupSizeZ",
  "maxComputeWorkgroupsPerDimension",
  "minSubgroupSize",
  "maxSubgroupSize",
  "maxImmediateSize",
];

async function main() {
  if (process.argv.length !== 2) {
    throw new Error("the canonical capability probe accepts no options");
  }
  const browserPath = chromium.executablePath();
  const lane = defaultLane();
  const expectedBackend = defaultExpectedBackend();
  if (!existsSync(browserPath)) throw new Error(`Chrome executable is absent: ${browserPath}`);
  if (lane === "unsupported" || expectedBackend === "unsupported") {
    throw new Error(`unsupported capability-probe platform ${process.platform}`);
  }

  const server = createServer((_request, response) => {
    response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    response.end("<!doctype html><title>VCC Phase 5 capability probe</title>");
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
    const webgpu = await page.evaluate(
      async ({ limitNames, requiredFeatures, requiredLimits }) => {
        if (!isSecureContext) throw new Error("capability probe requires a secure context");
        if (navigator.gpu === undefined) throw new Error("navigator.gpu is unavailable");
        const adapter = await navigator.gpu.requestAdapter({
          powerPreference: "high-performance",
        });
        if (adapter === null) throw new Error("WebGPU returned no adapter");

        const limits = {};
        for (const name of limitNames) {
          const value = adapter.limits[name];
          if (value !== undefined) limits[name] = value;
        }
        const info = {};
        for (const name of [
          "vendor",
          "architecture",
          "device",
          "description",
          "backend",
          "type",
          "driver",
          "d3dShaderModel",
          "vkDriverVersion",
          "powerPreference",
          "subgroupMinSize",
          "subgroupMaxSize",
          "isFallbackAdapter",
        ]) {
          const value = adapter.info?.[name];
          if (value !== undefined) info[name] = value;
        }
        info.memoryHeaps = Array.from(adapter.info?.memoryHeaps ?? [], (heap) => ({
          size: heap.size,
          properties: heap.properties,
        }));

        const features = [...adapter.features].sort();
        for (const feature of requiredFeatures) {
          if (!adapter.features.has(feature)) {
            throw new Error(`adapter lacks required feature ${feature}`);
          }
        }
        for (const [name, minimum] of Object.entries(requiredLimits)) {
          if (Number(adapter.limits[name]) < Number(minimum)) {
            throw new Error(
              `adapter limit ${name}=${String(adapter.limits[name])} is below ${minimum}`,
            );
          }
        }

        const uncapturedErrors = [];
        const device = await adapter.requestDevice({
          requiredFeatures,
          requiredLimits,
        });
        device.addEventListener("uncapturederror", (event) => {
          uncapturedErrors.push(event.error.message);
        });

        const querySet = device.createQuerySet({ type: "timestamp", count: 2 });
        const queryBuffer = device.createBuffer({
          size: 16,
          usage: GPUBufferUsage.QUERY_RESOLVE | GPUBufferUsage.COPY_SRC,
        });
        const shader = device.createShaderModule({
          code: "@compute @workgroup_size(1) fn main() {}",
        });
        const compilation = await shader.getCompilationInfo();
        if (compilation.messages.some((message) => message.type === "error")) {
          throw new Error("valid capability shader did not compile");
        }
        const pipeline = await device.createComputePipelineAsync({
          layout: "auto",
          compute: { module: shader, entryPoint: "main" },
        });
        const encoder = device.createCommandEncoder();
        const pass = encoder.beginComputePass({
          timestampWrites: {
            querySet,
            beginningOfPassWriteIndex: 0,
            endOfPassWriteIndex: 1,
          },
        });
        pass.setPipeline(pipeline);
        pass.dispatchWorkgroups(1);
        pass.end();
        encoder.resolveQuerySet(querySet, 0, 2, queryBuffer, 0);
        device.queue.submit([encoder.finish()]);
        await device.queue.onSubmittedWorkDone();

        device.pushErrorScope("validation");
        device.createBuffer({
          size: Number(device.limits.maxBufferSize) + 4,
          usage: GPUBufferUsage.STORAGE,
        });
        const captured = await device.popErrorScope();
        const capturedValidation =
          captured === null
            ? null
            : { name: captured.constructor.name, message: captured.message };
        device.destroy();
        return {
          secureContext: isSecureContext,
          userAgent: navigator.userAgent,
          info,
          features,
          limits,
          deviceLimits: Object.fromEntries(
            Object.keys(requiredLimits).map((name) => [name, device.limits[name]]),
          ),
          timestampDispatchCompleted: true,
          capturedValidation,
          uncapturedErrors,
        };
      },
      {
        limitNames: LIMIT_NAMES,
        requiredFeatures: [...PHASE5_REQUIRED_FEATURES],
        requiredLimits: { ...PHASE5_REQUIRED_LIMITS },
      },
    );
    const cdp = await browser.newBrowserCDPSession();
    const [browserVersion, systemInfo] = await Promise.all([
      cdp.send("Browser.getVersion"),
      cdp.send("SystemInfo.getInfo"),
    ]);
    const actualBackend = String(webgpu.info.backend ?? "");
    const backendMatches =
      actualBackend.toLowerCase() === expectedBackend.toLowerCase();
    const validationCaptured =
      webgpu.capturedValidation?.name === "GPUValidationError";
    const clean = git("status", "--porcelain").length === 0;
    const report = {
      schema: "phase5-capability-v1",
      lane,
      pass:
        clean &&
        backendMatches &&
        validationCaptured &&
        webgpu.timestampDispatchCompleted &&
        webgpu.uncapturedErrors.length === 0,
      repository: {
        commit: git("rev-parse", "HEAD"),
        clean,
      },
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
        browserPath,
        product: browserVersion.product,
        revision: browserVersion.revision,
        userAgent: browserVersion.userAgent,
        protocolVersion: browserVersion.protocolVersion,
        playwrightVersion: "1.61.1",
        launchFlags: [
          "--enable-unsafe-webgpu",
          "--enable-webgpu-developer-features",
        ],
      },
      adapter: {
        expectedBackend,
        actualBackend,
        backendMatches,
        info: webgpu.info,
        features: webgpu.features,
        limits: webgpu.limits,
        deviceLimits: webgpu.deviceLimits,
        cdpDevices: systemInfo.gpu.devices,
      },
      checks: {
        timestampDispatchCompleted: webgpu.timestampDispatchCompleted,
        capturedValidation: webgpu.capturedValidation,
        validationCaptured,
        uncapturedErrors: webgpu.uncapturedErrors,
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
