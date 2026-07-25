#!/usr/bin/env node
// Canonical Phase 5 preview responsiveness probe.
//
// This probe measures what `PHASE5_PERFORMANCE` registered, and nothing cheaper:
//
//   * the page IS the Phase 3/4 application (`app/index.html` + `app/src/main.ts`), served by
//     Vite and booted in the frozen Chromium lane;
//   * the registered `editScript` is executed as FIVE trusted DOM interactions per sample on
//     the application's own Tweakpane controls and its own scene canvas — never by calling a
//     solver API directly. Every registered edit event is asserted `isTrusted`;
//   * the production GPU package runs on the SAME `GPUDevice` that Three.js presents the
//     application with. The device is created once, through the production
//     `requestCheckedGpuDevice` path, by an init script that intercepts the renderer's own
//     device request before the application boots;
//   * each edit carries a unique, monotonically increasing edit generation accepted by a
//     production `GpuSubmissionController`, and the rendered generation is read back OUT OF
//     THE GPU rather than assumed;
//   * every sample ends in a real WebGPU canvas frame: a compute pass paints the solver's
//     resident vapor slice into a storage texture and a render pass presents it. First-valid
//     frame time is queue completion (`onSubmittedWorkDone`) plus a presentation receipt
//     (`requestAnimationFrame`);
//   * per-frame readbacks are frame-scoped (`beginDisplayFrame`) and compact sub-ranges, so
//     the registered zero full-field-per-display-frame budget is exercised, not skipped;
//   * observed error, device-loss and re-acquisition state is reported as observed. Nothing
//     here substitutes a literal zero for a quantity the run did not measure.
//
// The application does not yet run the solver on the GPU — that is WP6. Until it does, the
// GPU-resident slice preview surface created by this probe is the rendered frame, and it is
// presented from the application's own device, inside the application's own page, in response
// to the application's own control events.

import { existsSync, readFileSync } from "node:fs";
import os from "node:os";
import process from "node:process";
import { resolve } from "node:path";
import { chromium } from "playwright";
import { createServer as createViteServer } from "vite";
import {
  PHASE5_BUDGETS,
  PHASE5_PERFORMANCE,
  PHASE5_REQUIRED_FEATURES,
  PHASE5_REQUIRED_LIMITS,
} from "../../runner/src/phase5-protocol.ts";

const repoRoot = resolve(import.meta.dirname, "..", "..");

/** The device label the interception hook uses to recognize its own production request. */
const PROBE_DEVICE_LABEL = "vcc-phase5-performance-device";
const VIEWPORT = { width: 1440, height: 1200 };
/** Scene-canvas points used by the `request-named-probes` interaction (alternating). */
const PROBE_POINTER_POINTS = [
  { x: 700, y: 620 },
  { x: 706, y: 612 },
];

/**
 * The registered edit script, bound to the application control each entry is driven through.
 * `entry` order and spelling are asserted against `PHASE5_PERFORMANCE.editScript` at startup,
 * so a protocol change cannot silently keep executing the old script.
 */
const EDIT_SCRIPT_BINDINGS = [
  {
    entry: "change-one-valid-operator-control",
    control: "presetSelect",
    eventType: "change",
    interaction: "arrow-key",
  },
  {
    entry: "apply-one-valid-abrupt-event-at-completed-boundary",
    control: "scenarioSelect",
    eventType: "change",
    interaction: "arrow-key",
  },
  {
    entry: "step",
    control: "stepButton",
    eventType: "click",
    interaction: "click",
  },
  {
    entry: "move-slice",
    control: "sliceTrack",
    eventType: "keydown",
    interaction: "arrow-key",
  },
  {
    entry: "request-named-probes",
    control: "sceneCanvas",
    eventType: "pointermove",
    interaction: "pointer-move",
  },
];

/** Preview cases: the registered budgets plus the preset pair each case's UI alternates. */
const PREVIEW_CASES = [
  {
    id: "preview-plate",
    initialPreset: "plate",
    presetPair: ["plate", "dendrite"],
  },
  {
    id: "preview-column",
    initialPreset: "needle",
    presetPair: ["needle", "hollowColumn"],
  },
];

/** The two registered Phase 4 scenarios whose environments the abrupt-event edit applies. */
const SCENARIO_PAIR = ["A-TIMELINE", "A-BRANCH-DENDRITE"];

// One workgroup paints the whole slice plane and hashes both the plane it painted and the
// plane the previous slice index would have painted from the SAME field state. That second
// hash is what proves a slice edit changed the rendered output rather than only moving a
// control: it removes the confound of the field having advanced a cycle.
const SLICE_FRAME_WGSL = /* wgsl */ `
struct SliceControls {
  nx: u32,
  ny: u32,
  nz: u32,
  sliceIndex: u32,
  previousSliceIndex: u32,
  editGeneration: u32,
  ordinal: u32,
  scale: f32,
}

@group(0) @binding(0) var<uniform> controls: SliceControls;
@group(0) @binding(1) var<storage, read> vapor: array<f32>;
@group(0) @binding(2) var<storage, read_write> probe: array<u32>;
@group(0) @binding(3) var sliceTarget: texture_storage_2d<rgba8unorm, write>;

var<workgroup> currentHash: atomic<u32>;
var<workgroup> priorHash: atomic<u32>;
var<workgroup> paintedTexels: atomic<u32>;

fn cellOf(x: u32, j: u32, y: u32) -> u32 {
  return y * controls.nx * controls.ny + j * controls.nx + x;
}

fn shade(value: f32) -> vec4<f32> {
  let unit = clamp(value / controls.scale, 0.0, 1.0);
  return vec4<f32>(unit, unit * unit, sqrt(unit), 1.0);
}

@compute @workgroup_size(256)
fn paintSlice(@builtin(local_invocation_index) lane: u32) {
  if (lane == 0u) {
    atomicStore(&currentHash, 0u);
    atomicStore(&priorHash, 0u);
    atomicStore(&paintedTexels, 0u);
  }
  workgroupBarrier();
  let width = controls.nx;
  let height = controls.nz;
  let total = width * height;
  var localCurrent: u32 = 0u;
  var localPrior: u32 = 0u;
  var localPainted: u32 = 0u;
  var texel: u32 = lane;
  while (texel < total) {
    let x = texel % width;
    let y = texel / width;
    let currentColor = shade(vapor[cellOf(x, controls.sliceIndex, y)]);
    let priorColor = shade(vapor[cellOf(x, controls.previousSliceIndex, y)]);
    textureStore(sliceTarget, vec2<u32>(x, y), currentColor);
    let salt = texel * 2246822519u + 1u;
    localCurrent = localCurrent ^ (pack4x8unorm(currentColor) * 2654435761u + salt);
    localPrior = localPrior ^ (pack4x8unorm(priorColor) * 2654435761u + salt);
    localPainted = localPainted + 1u;
    texel = texel + 256u;
  }
  atomicXor(&currentHash, localCurrent);
  atomicXor(&priorHash, localPrior);
  atomicAdd(&paintedTexels, localPainted);
  workgroupBarrier();
  if (lane == 0u) {
    probe[0] = controls.editGeneration;
    probe[1] = controls.sliceIndex;
    probe[2] = atomicLoad(&currentHash);
    probe[3] = controls.previousSliceIndex;
    probe[4] = atomicLoad(&priorHash);
    probe[5] = atomicLoad(&paintedTexels);
    probe[6] = controls.ordinal;
    probe[7] = total;
  }
}
`;

const SLICE_PREVIEW_WGSL = /* wgsl */ `
struct Varying {
  @builtin(position) clipPosition: vec4<f32>,
  @location(0) texCoord: vec2<f32>,
}

@group(0) @binding(0) var sliceTexture: texture_2d<f32>;
@group(0) @binding(1) var sliceSampler: sampler;

@vertex
fn previewVertex(@builtin(vertex_index) index: u32) -> Varying {
  var corners = array<vec2<f32>, 3>(
    vec2<f32>(-1.0, -3.0),
    vec2<f32>(-1.0, 1.0),
    vec2<f32>(3.0, 1.0)
  );
  let corner = corners[index];
  // `varying` is a WGSL reserved keyword; the pinned Chromium compiler rejects it as an
  // identifier, so the interpolated record is named plainly on both stages.
  var interpolated: Varying;
  interpolated.clipPosition = vec4<f32>(corner, 0.0, 1.0);
  interpolated.texCoord = vec2<f32>((corner.x + 1.0) * 0.5, (1.0 - corner.y) * 0.5);
  return interpolated;
}

@fragment
fn previewFragment(interpolated: Varying) -> @location(0) vec4<f32> {
  return textureSample(sliceTexture, sliceSampler, interpolated.texCoord);
}
`;

/**
 * Serve the application's OWN index.html, with only the module path rebased so the repository
 * root can also serve `core/`, `solver-cpu/`, `solver-gpu/` and `runner/` to the same origin.
 * Any other difference from the shipped page would make this measurement a different page's.
 */
function applicationPageHtml() {
  const original = readFileSync(resolve(repoRoot, "app", "index.html"), "utf8");
  const rebased = original.replace('src="/src/main.ts"', 'src="/app/src/main.ts"');
  if (rebased === original) {
    throw new Error("the application page no longer loads /src/main.ts");
  }
  return rebased;
}

/**
 * Runs at document start, BEFORE the application boots. It intercepts the adapter/device
 * acquisition so that:
 *   - the renderer and the production solver share one device;
 *   - that device is created by the production `requestCheckedGpuDevice` path against the
 *     frozen features and limits;
 *   - uncaptured errors, device loss and silent re-acquisitions are observed from the first
 *     moment the device exists, not sampled later.
 */
function installDeviceInterception(input) {
  const state = {
    label: input.deviceLabel,
    adapterRequests: 0,
    deviceRequests: 0,
    adapter: null,
    device: null,
    devicePromise: null,
    deviceError: null,
    uncapturedErrors: [],
    deviceLossRecords: [],
    reacquisitions: [],
  };
  window.__vccPhase5Device = state;
  const nativeRequestAdapter = navigator.gpu.requestAdapter.bind(navigator.gpu);
  navigator.gpu.requestAdapter = function requestAdapter(options) {
    state.adapterRequests++;
    if (state.adapterRequests > 1) {
      state.reacquisitions.push({ kind: "adapter", ordinal: state.adapterRequests });
    }
    // The other Phase 5 probes measure the high-performance adapter; a compatibility-level
    // adapter would silently narrow the frozen limits this lane must be measured against.
    return nativeRequestAdapter({
      ...(options ?? {}),
      featureLevel: undefined,
      powerPreference: "high-performance",
    });
  };
  const nativeRequestDevice = GPUAdapter.prototype.requestDevice;
  GPUAdapter.prototype.requestDevice = function requestDevice(descriptor) {
    if (descriptor !== undefined && descriptor !== null && descriptor.label === state.label) {
      return nativeRequestDevice.call(this, descriptor);
    }
    state.deviceRequests++;
    if (state.deviceRequests > 1) {
      state.reacquisitions.push({ kind: "device", ordinal: state.deviceRequests });
    }
    if (state.devicePromise === null) {
      state.adapter = this;
      const adapter = this;
      state.devicePromise = (async () => {
        const production = await import(input.productionModuleUrl);
        const requirements = {
          requiredFeatures: input.requiredFeatures,
          requiredLimits: input.requiredLimits,
        };
        const device = await production.requestCheckedGpuDevice(
          adapter,
          requirements,
          requirements,
          state.label,
        );
        device.addEventListener("uncapturederror", (event) => {
          state.uncapturedErrors.push(String(event.error.message));
        });
        void device.lost.then((info) => {
          state.deviceLossRecords.push({
            reason: String(info.reason),
            message: String(info.message),
          });
        });
        state.device = device;
        return device;
      })();
      state.devicePromise.catch((error) => {
        state.deviceError = error instanceof Error ? error.message : String(error);
      });
    }
    return state.devicePromise;
  };
}

/**
 * The in-page bridge. It owns nothing the application owns: it observes the application's own
 * trusted control events, translates each into one production GPU edit at a unique generation,
 * and renders the resulting resident state to a WebGPU surface on the application's device.
 */
function installPreviewBridge(input) {
  const deviceState = window.__vccPhase5Device;
  if (deviceState === undefined) throw new Error("the device interception hook did not run");
  if (deviceState.deviceError !== null) {
    throw new Error(`the shared GPU device failed: ${deviceState.deviceError}`);
  }
  const device = deviceState.device;
  if (device === null || device === undefined) {
    throw new Error("the application never acquired a GPU device");
  }

  const bridge = {
    input,
    device,
    core: null,
    cpu: null,
    production: null,
    scenarios: null,
    appProtocol: null,
    controls: new Map(),
    computePipeline: null,
    renderPipeline: null,
    sampler: null,
    canvasContext: null,
    canvasFormat: null,
    uniformBuffer: null,
    probeBuffer: null,
    sliceTexture: null,
    previewBindGroup: null,
    audit: null,
    editSubmissions: null,
    solverSubmissions: null,
    solver: null,
    arena: null,
    activeCase: null,
    editGeneration: 0,
    queue: Promise.resolve(),
    armed: null,
    pendingEdits: new Map(),
    ordinal: null,
    unarmedTrustedEvents: 0,
    untrustedRegisteredEvents: 0,
    sliceIndex: 0,
    previousSliceIndex: 0,
    appSliceBaseIndex: 0,
    lastPaintedHash: null,
    shaderMessages: [],
  };
  window.__vccPhase5Bridge = bridge;

  function fail(message) {
    throw new Error(message);
  }

  function paneRowValue(labelPrefix) {
    const labels = [...document.querySelectorAll(".tp-lblv_l")];
    const label = labels.find((element) =>
      (element.textContent ?? "").trim().startsWith(labelPrefix)
    );
    if (label === undefined) fail(`the application has no control labelled ${labelPrefix}`);
    const row = label.closest(".tp-lblv");
    const value = row === null ? null : row.querySelector(".tp-lblv_v");
    if (value === null) fail(`the ${labelPrefix} control row has no value element`);
    return value;
  }

  function paneButton(titlePrefix) {
    const titles = [...document.querySelectorAll(".tp-btnv_t")];
    const title = titles.find((element) =>
      (element.textContent ?? "").trim().startsWith(titlePrefix)
    );
    if (title === undefined) fail(`the application has no button titled ${titlePrefix}`);
    const button = title.closest("button");
    if (button === null) fail(`the ${titlePrefix} button element is absent`);
    return button;
  }

  function paneFolder(titlePrefix) {
    const titles = [...document.querySelectorAll(".tp-fldv_t")];
    const title = titles.find((element) =>
      (element.textContent ?? "").trim().startsWith(titlePrefix)
    );
    if (title === undefined) fail(`the application has no folder titled ${titlePrefix}`);
    const button = title.closest("button");
    if (button === null) fail(`the ${titlePrefix} folder button is absent`);
    return button;
  }

  function tag(name, element) {
    element.dataset.vccPhase5Control = name;
    bridge.controls.set(name, element);
  }

  function selectedOptionText(name) {
    const select = bridge.controls.get(name);
    const option = select.options[select.selectedIndex];
    if (option === undefined) fail(`${name} has no selected option`);
    return (option.textContent ?? "").trim();
  }

  bridge.setup = async () => {
    const [core, cpu, production, scenarios, appProtocol] = await Promise.all([
      import(input.coreModuleUrl),
      import(input.cpuModuleUrl),
      import(input.productionModuleUrl),
      import(input.scenariosModuleUrl),
      import(input.appProtocolModuleUrl),
    ]);
    bridge.core = core;
    bridge.cpu = cpu;
    bridge.production = production;
    bridge.scenarios = scenarios;
    bridge.appProtocol = appProtocol;

    tag("runConfigFolder", paneFolder("run config"));
    tag("phase4Folder", paneFolder("phase 4"));
    tag("stepButton", paneButton("step (one tick)"));
    tag("presetSelect", paneRowValue("preset (").querySelector(".tp-lstv_s"));
    tag("scenarioSelect", paneRowValue("scenario (").querySelector(".tp-lstv_s"));
    tag("sliceTrack", paneRowValue("j index").querySelector(".tp-sldv_t"));
    const sceneCanvas = document.querySelector("#scene canvas");
    if (sceneCanvas === null) fail("the application scene canvas is absent");
    tag("sceneCanvas", sceneCanvas);

    // The GPU-resident preview surface. `pointer-events: none` keeps it from ever intercepting
    // an interaction meant for one of the application's own controls.
    const preview = document.createElement("canvas");
    preview.id = "vcc-phase5-slice-preview";
    preview.width = 256;
    preview.height = 256;
    preview.style.cssText =
      "position:fixed;right:8px;bottom:8px;width:192px;height:192px;z-index:20;" +
      "border:1px solid #2a3342;pointer-events:none";
    document.body.appendChild(preview);
    const context = preview.getContext("webgpu");
    if (context === null) fail("the preview surface has no WebGPU context");
    const format = navigator.gpu.getPreferredCanvasFormat();
    context.configure({ device: bridge.device, format });
    bridge.canvasContext = context;
    bridge.canvasFormat = format;

    async function compile(label, code) {
      const module = bridge.device.createShaderModule({ label, code });
      const info = await module.getCompilationInfo();
      for (const message of info.messages) {
        bridge.shaderMessages.push({
          label,
          type: message.type,
          lineNum: message.lineNum,
          linePos: message.linePos,
          message: message.message,
        });
      }
      const errors = info.messages.filter((message) => message.type === "error");
      if (errors.length > 0) {
        fail(`${label} shader compilation failed: ${errors.map((m) => m.message).join("; ")}`);
      }
      return module;
    }

    const frameModule = await compile("vcc:phase5:slice-frame", input.sliceFrameShader);
    const previewModule = await compile("vcc:phase5:slice-preview", input.slicePreviewShader);
    bridge.computePipeline = await bridge.device.createComputePipelineAsync({
      label: "vcc:phase5:slice-frame",
      layout: "auto",
      compute: { module: frameModule, entryPoint: "paintSlice" },
    });
    bridge.renderPipeline = await bridge.device.createRenderPipelineAsync({
      label: "vcc:phase5:slice-preview",
      layout: "auto",
      vertex: { module: previewModule, entryPoint: "previewVertex" },
      fragment: {
        module: previewModule,
        entryPoint: "previewFragment",
        targets: [{ format }],
      },
      primitive: { topology: "triangle-list" },
    });
    bridge.sampler = bridge.device.createSampler({
      label: "vcc:phase5:slice-sampler",
      magFilter: "nearest",
      minFilter: "nearest",
    });
    bridge.uniformBuffer = bridge.device.createBuffer({
      label: "vcc:phase5:slice-controls",
      size: 32,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    bridge.probeBuffer = bridge.device.createBuffer({
      label: "vcc:phase5:frame-probe",
      size: 256,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
    });

    bridge.audit = new production.GpuReadbackAudit();
    bridge.editSubmissions = new production.GpuSubmissionController(bridge.device);
    bridge.solverSubmissions = new production.GpuSubmissionController(bridge.device);
    bridge.appSliceBaseIndex = window.__vccDebug.renderedSliceIndex();

    for (const type of input.observedEventTypes) {
      // Bubble phase on `window`: every listener the application itself installed on the
      // control, and on every ancestor, has already run, so the observed state is the state
      // the application accepted for that interaction.
      window.addEventListener(type, onRegisteredEvent, false);
    }

    return {
      controls: [...bridge.controls.keys()],
      canvasFormat: format,
      appSliceBaseIndex: bridge.appSliceBaseIndex,
      shaderMessages: bridge.shaderMessages,
      backend: window.__vccDebug.backend,
      deviceFeatures: [...bridge.device.features].sort(),
      deviceLimits: Object.fromEntries(
        Object.keys(input.requiredLimits).map((name) => [
          name,
          Number(bridge.device.limits[name]),
        ]),
      ),
      adapterInfo: {
        vendor: deviceState.adapter.info.vendor,
        architecture: deviceState.adapter.info.architecture,
        device: deviceState.adapter.info.device,
        description: deviceState.adapter.info.description,
        backend: deviceState.adapter.info.backend,
        type: deviceState.adapter.info.type,
        driver: deviceState.adapter.info.driver,
      },
      adapterFeatures: [...deviceState.adapter.features].sort(),
    };
  };

  function onRegisteredEvent(event) {
    const armed = bridge.armed;
    if (armed === null) {
      if (event.isTrusted) bridge.unarmedTrustedEvents++;
      return;
    }
    if (event.type !== armed.eventType) return;
    const element = bridge.controls.get(armed.control);
    const target = event.target;
    if (!(target instanceof Node) || !(element === target || element.contains(target))) return;
    bridge.armed = null;
    if (!event.isTrusted) {
      // A synthesized event is not a UI interaction. It is recorded and left unserviced, so
      // the awaiting driver fails by name instead of measuring a scripted mutation.
      bridge.untrustedRegisteredEvents++;
      return;
    }
    const editedAtMs = event.timeStamp;
    const generation = ++bridge.editGeneration;
    // Acceptance of the new generation id by the production submission queue. This is the
    // acknowledgement the protocol bounds; the work it schedules is bounded separately by the
    // first-valid-frame budget.
    const acceptedAtMs = bridge.editSubmissions.acknowledgeEdit(generation);
    const record = {
      index: armed.index,
      entry: armed.entry,
      control: armed.control,
      eventType: event.type,
      trusted: true,
      editGeneration: generation,
      acceptedGeneration: bridge.editSubmissions.currentGeneration(),
      editedAtMs,
      acceptedAtMs,
      acknowledgementMs: acceptedAtMs - editedAtMs,
    };
    bridge.ordinal.edits.push(record);
    const work = bridge.queue.then(() => applyEdit(record));
    bridge.queue = work.then(
      () => undefined,
      () => undefined,
    );
    bridge.pendingEdits.set(armed.index, work);
  }

  function environmentOfSelectedPreset() {
    const name = selectedOptionText("presetSelect");
    if (!Object.hasOwn(bridge.core.GG_PRESETS, name)) {
      fail(`the preset control selected an unknown preset: ${name}`);
    }
    return {
      control: { kind: "preset", value: name },
      environment: bridge.core.ggTimelineEnvironmentFromParams(bridge.core.GG_PRESETS[name]),
    };
  }

  function environmentOfSelectedScenario() {
    const text = selectedOptionText("scenarioSelect");
    const scenario = bridge.scenarios.PHASE4_SCENARIOS.find((entry) => entry.label === text);
    if (scenario === undefined) fail(`the scenario control selected an unknown row: ${text}`);
    const schedule = scenario.config.schedule;
    // A scenario that registers an abrupt schedule contributes its registered event
    // environment; one that does not contributes its own registered initial environment.
    const environment =
      schedule === null
        ? bridge.core.ggTimelineEnvironmentFromParams(
            bridge.appProtocol.ggParamsForInit(scenario.config),
          )
        : schedule.events[0].environment;
    return {
      control: {
        kind: "scenario",
        value: scenario.id,
        source: schedule === null ? "initial-environment" : "registered-abrupt-event",
      },
      environment,
    };
  }

  function summarizeTransition(report) {
    return {
      operator: report.operator,
      phase: report.boundary.phase,
      completedCycles: report.boundary.completedCycles,
      tick: report.boundary.tick,
      changed:
        JSON.stringify(report.beforeEnvironment) !== JSON.stringify(report.afterEnvironment),
      beforeEnvironment: report.beforeEnvironment,
      afterEnvironment: report.afterEnvironment,
    };
  }

  async function applyEdit(record) {
    const solver = bridge.solver;
    const activeCase = bridge.activeCase;
    const label = `${activeCase.id}:${bridge.ordinal.phase}:${bridge.ordinal.sample}`;
    if (record.entry === "change-one-valid-operator-control") {
      const selection = environmentOfSelectedPreset();
      const tickBefore = solver.tick();
      record.control = selection.control;
      record.transition = summarizeTransition(
        solver.applyTimelineEnvironment(selection.environment),
      );
      record.tickBefore = tickBefore;
      return;
    }
    if (record.entry === "apply-one-valid-abrupt-event-at-completed-boundary") {
      const selection = environmentOfSelectedScenario();
      const tickBefore = solver.tick();
      record.control = selection.control;
      record.transition = summarizeTransition(
        solver.applyTimelineEnvironment(selection.environment),
      );
      record.tickBefore = tickBefore;
      // The production solver refuses this call anywhere but a completed-cycle boundary; the
      // report it returns names the boundary it was applied at.
      record.atCompletedCycleBoundary =
        record.transition.phase === "completedCycleBoundary" &&
        record.transition.completedCycles === tickBefore;
      return;
    }
    if (record.entry === "step") {
      const tickBefore = solver.tick();
      await solver.step(label);
      record.tickBefore = tickBefore;
      record.tickAfter = solver.tick();
      return;
    }
    if (record.entry === "move-slice") {
      const appIndex = window.__vccDebug.renderedSliceIndex();
      const dims = activeCase.dims;
      const offset = appIndex - bridge.appSliceBaseIndex;
      const requested = activeCase.centerJ + offset;
      const next = Math.min(Math.max(requested, 0), dims.ny - 1);
      bridge.previousSliceIndex = bridge.sliceIndex;
      bridge.sliceIndex = next;
      record.slice = {
        appRenderedIndex: appIndex,
        appBaseIndex: bridge.appSliceBaseIndex,
        appLegend: window.__vccDebug.sliceLegendText(),
        gpuSliceIndex: bridge.sliceIndex,
        gpuPreviousSliceIndex: bridge.previousSliceIndex,
        moved: bridge.sliceIndex !== bridge.previousSliceIndex,
      };
      return;
    }
    if (record.entry === "request-named-probes") {
      // The user asked the instrument for values. This is the named probe that is NOT part of
      // a display frame; the frame-scoped compact probes follow with the frame itself.
      const counters = await bridge.production.readGpuBuffer(
        bridge.device,
        solver.reportBuffer(),
        {
          purpose: "named-probe",
          label: `${label}:cycle-report-counters`,
          generation: record.editGeneration,
          byteOffset: 0,
          byteLength: 16,
        },
        bridge.audit,
      );
      const view = new DataView(counters);
      record.namedProbe = {
        pick: window.__vccDebug.lastPick,
        boundaryCount: view.getUint32(0, true),
        attachedTotal: view.getUint32(4, true),
        attachedNow: view.getUint32(8, true),
        holeFillNow: view.getUint32(12, true),
      };
      return;
    }
    fail(`the edit script contains an unbound entry: ${record.entry}`);
  }

  bridge.beginCase = async (caseInput) => {
    const budget = caseInput.dims;
    const oracle = new bridge.cpu.GGSolver({
      dims: budget,
      params: presetParams(caseInput.initialPreset),
      rngSeed: 1,
      noiseEpsilon: 0,
      domain: "hexPrism",
      farField: "dirichlet",
      seedRadius: 2,
      seedThickness: 1,
    });
    const topology = new Uint32Array(oracle.d.length);
    for (const index of oracle.farFieldCells) topology[index] = 1;
    const arena = bridge.production.GpuBufferArena.create(
      bridge.device,
      caseInput.solverGeneration,
      bridge.production.createGpuBufferPlan(budget, "gg"),
    );
    bridge.solverSubmissions.acknowledgeEdit(caseInput.solverGeneration);
    const solver = await bridge.production.GpuGgSolver.create(
      bridge.device,
      bridge.solverSubmissions,
      arena,
      {
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
      },
    );
    bridge.arena = arena;
    bridge.solver = solver;
    bridge.activeCase = {
      id: caseInput.id,
      dims: budget,
      centerJ: solver.center[1],
      cellCount: budget.nx * budget.ny * budget.nz,
    };
    bridge.sliceIndex = solver.center[1];
    bridge.previousSliceIndex = solver.center[1];
    bridge.lastPaintedHash = null;
    bridge.sliceTexture = bridge.device.createTexture({
      label: `vcc:phase5:${caseInput.id}:slice`,
      size: { width: budget.nx, height: budget.nz },
      format: "rgba8unorm",
      usage: GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.TEXTURE_BINDING,
    });
    bridge.previewBindGroup = bridge.device.createBindGroup({
      label: `vcc:phase5:${caseInput.id}:preview`,
      layout: bridge.renderPipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: bridge.sliceTexture.createView() },
        { binding: 1, resource: bridge.sampler },
      ],
    });
    return {
      id: caseInput.id,
      dims: budget,
      centerJ: bridge.activeCase.centerJ,
      tick: solver.tick(),
      solverGeneration: caseInput.solverGeneration,
      arenaBufferCount: arena.names().length,
      initialEnvironment: solver.timelineEnvironment(),
    };
  };

  function presetParams(name) {
    const preset = bridge.core.GG_PRESETS[name];
    return {
      rho: preset.rho,
      phi: preset.phi,
      kappa: new Float64Array(preset.kappa),
      mu: new Float64Array(preset.mu),
      ggThreshBeta: new Float64Array(preset.ggThreshBeta),
    };
  }

  bridge.beginOrdinal = (ordinalInput) => {
    bridge.ordinal = {
      ...ordinalInput,
      edits: [],
      solverRecordsBefore: bridge.solverSubmissions.records().length,
      editRecordsBefore: bridge.editSubmissions.records().length,
    };
    bridge.pendingEdits = new Map();
    bridge.armed = null;
    return { ordinal: ordinalInput.ordinal, generation: bridge.editGeneration };
  };

  bridge.armEdit = (armInput) => {
    if (bridge.armed !== null) fail(`edit ${bridge.armed.index} is still armed`);
    if (!bridge.controls.has(armInput.control)) {
      fail(`the application control is not resolved: ${armInput.control}`);
    }
    bridge.armed = armInput;
    return { armed: armInput.index };
  };

  bridge.awaitEdit = async (index) => {
    // The trusted event is dispatched by the browser, so it can land a beat after the driver's
    // input call resolves. The wait is bounded and never invents an edit: a script entry that
    // produced no trusted event on its own control fails by name.
    const deadline = performance.now() + 5_000;
    while (!bridge.pendingEdits.has(index)) {
      if (performance.now() > deadline) {
        bridge.armed = null;
        fail(`the registered edit ${index} produced no observed trusted event`);
      }
      await new Promise((accept) => {
        setTimeout(accept, 2);
      });
    }
    await bridge.pendingEdits.get(index);
    return bridge.ordinal.edits.find((entry) => entry.index === index);
  };

  bridge.finishOrdinal = async () => {
    const ordinal = bridge.ordinal;
    const activeCase = bridge.activeCase;
    const solver = bridge.solver;
    if (ordinal.edits.length !== bridge.input.editScript.length) {
      fail(`ordinal ${ordinal.ordinal} observed ${ordinal.edits.length} registered edits`);
    }
    const last = ordinal.edits[ordinal.edits.length - 1];
    const generation = last.editGeneration;
    const label = `${activeCase.id}:${ordinal.phase}:${ordinal.sample}`;
    const dims = activeCase.dims;
    const controls = new ArrayBuffer(32);
    const controlWords = new Uint32Array(controls);
    controlWords[0] = dims.nx;
    controlWords[1] = dims.ny;
    controlWords[2] = dims.nz;
    controlWords[3] = bridge.sliceIndex;
    controlWords[4] = bridge.previousSliceIndex;
    controlWords[5] = generation;
    controlWords[6] = ordinal.ordinal;
    new Float32Array(controls)[7] = Math.fround(solver.params().rho);
    bridge.device.queue.writeBuffer(bridge.uniformBuffer, 0, controls);
    const frameBindGroup = bridge.device.createBindGroup({
      label: `vcc:phase5:${label}:frame`,
      layout: bridge.computePipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: bridge.uniformBuffer } },
        { binding: 1, resource: { buffer: solver.activeVaporBuffer() } },
        { binding: 2, resource: { buffer: bridge.probeBuffer } },
        { binding: 3, resource: bridge.sliceTexture.createView() },
      ],
    });
    const frameToken = bridge.audit.beginDisplayFrame(`${label}:frame`);
    let frame;
    try {
      const encoder = bridge.device.createCommandEncoder({
        label: `vcc:phase5:${label}:frame`,
      });
      const paint = encoder.beginComputePass({ label: `vcc:phase5:${label}:paint` });
      paint.setPipeline(bridge.computePipeline);
      paint.setBindGroup(0, frameBindGroup);
      paint.dispatchWorkgroups(1);
      paint.end();
      const pass = encoder.beginRenderPass({
        label: `vcc:phase5:${label}:present`,
        colorAttachments: [{
          view: bridge.canvasContext.getCurrentTexture().createView(),
          clearValue: { r: 0, g: 0, b: 0, a: 1 },
          loadOp: "clear",
          storeOp: "store",
        }],
      });
      pass.setPipeline(bridge.renderPipeline);
      pass.setBindGroup(0, bridge.previewBindGroup);
      pass.draw(3);
      pass.end();
      // The controller submits and awaits queue completion on the rendering device, and
      // refuses a submission whose generation went stale while it was in flight.
      const submission = await bridge.editSubmissions.submit(
        `${label}:frame`,
        generation,
        [encoder.finish()],
      );
      const presentedMs = await new Promise((accept) => {
        requestAnimationFrame(() => accept(performance.now()));
      });
      const probeBytes = await bridge.production.readGpuBuffer(
        bridge.device,
        bridge.probeBuffer,
        {
          purpose: "compact-metric",
          label: `${label}:frame-probe`,
          generation,
          byteOffset: 0,
          byteLength: 32,
          displayFrame: frameToken,
        },
        bridge.audit,
      );
      const meterBytes = await bridge.production.readGpuBuffer(
        bridge.device,
        solver.reportBuffer(),
        {
          purpose: "named-probe",
          label: `${label}:cycle-report-meters`,
          generation,
          byteOffset: 16,
          byteLength: 16,
          displayFrame: frameToken,
        },
        bridge.audit,
      );
      const probeWords = new Uint32Array(probeBytes);
      const meterView = new DataView(meterBytes);
      frame = {
        label,
        submissionWallMs: submission.wallMs,
        presentedMs,
        renderedGeneration: probeWords[0],
        renderedSliceIndex: probeWords[1],
        renderedSliceHash: probeWords[2],
        comparedSliceIndex: probeWords[3],
        comparedSliceHash: probeWords[4],
        paintedTexels: probeWords[5],
        renderedOrdinal: probeWords[6],
        expectedTexels: probeWords[7],
        lastClampDelta: meterView.getFloat32(0, true),
        dirichletMeter: meterView.getFloat32(4, true),
        oldBoundaryCount: meterView.getUint32(8, true),
        errorFlags: meterView.getUint32(12, true),
      };
    } finally {
      bridge.audit.endDisplayFrame(frameToken);
    }
    frame.sliceContentChanged =
      frame.renderedSliceIndex !== frame.comparedSliceIndex &&
      frame.renderedSliceHash !== frame.comparedSliceHash;
    frame.repaintedSameOutput =
      bridge.lastPaintedHash !== null && bridge.lastPaintedHash === frame.renderedSliceHash;
    bridge.lastPaintedHash = frame.renderedSliceHash;

    const solverRecords = bridge.solverSubmissions.records().slice(ordinal.solverRecordsBefore);
    const editRecords = bridge.editSubmissions.records().slice(ordinal.editRecordsBefore);
    const editedAtMs = ordinal.edits[0].editedAtMs;
    return {
      budgetId: activeCase.id,
      ordinal: ordinal.ordinal,
      phase: ordinal.phase,
      sample: ordinal.sample,
      warmup: ordinal.phase === "warmup",
      editGeneration: generation,
      acceptedGeneration: bridge.editSubmissions.currentGeneration(),
      firstEditAtMs: editedAtMs,
      lastEditAtMs: last.editedAtMs,
      editAcknowledgementMs: Math.max(...ordinal.edits.map((entry) => entry.acknowledgementMs)),
      minimumEditAcknowledgementMs: Math.min(
        ...ordinal.edits.map((entry) => entry.acknowledgementMs),
      ),
      firstValidFrameMs: frame.presentedMs - editedAtMs,
      firstValidFrameFromLastEditMs: frame.presentedMs - last.editedAtMs,
      segmentWallMs: [
        ...solverRecords.map((record) => record.wallMs),
        ...editRecords.map((record) => record.wallMs),
      ],
      solverSegments: solverRecords.map((record) => ({
        label: record.label,
        wallMs: record.wallMs,
      })),
      edits: ordinal.edits,
      frame,
      tick: solver.tick(),
    };
  };

  bridge.endCase = () => {
    const tick = bridge.solver === null ? null : bridge.solver.tick();
    const environment = bridge.solver === null ? null : bridge.solver.timelineEnvironment();
    bridge.solver?.destroy();
    bridge.arena?.destroy();
    bridge.sliceTexture?.destroy();
    bridge.solver = null;
    bridge.arena = null;
    bridge.sliceTexture = null;
    bridge.previewBindGroup = null;
    bridge.activeCase = null;
    return { tick, finalEnvironment: environment };
  };

  bridge.observed = () => ({
    adapterRequests: deviceState.adapterRequests,
    deviceRequests: deviceState.deviceRequests,
    reacquisitions: deviceState.reacquisitions,
    uncapturedErrors: deviceState.uncapturedErrors,
    deviceLossRecords: deviceState.deviceLossRecords,
    editQueueLossReason: bridge.editSubmissions.unexpectedLossReason(),
    solverQueueLossReason: bridge.solverSubmissions.unexpectedLossReason(),
    unarmedTrustedEvents: bridge.unarmedTrustedEvents,
    untrustedRegisteredEvents: bridge.untrustedRegisteredEvents,
    applicationErrors: [...window.__vccDebug.errors],
    applicationBackend: window.__vccDebug.backend,
    applicationTick: window.__vccDebug.tick,
    applicationSnapshotCount: window.__vccDebug.snapshotCount,
    lastInspectError: window.__vccDebug.lastInspectError,
    readbackRecords: bridge.audit.records(),
    fullFieldDisplayFrameCount: bridge.audit.fullFieldDisplayFrameCount(),
    readbackTotalBytes: bridge.audit.totalBytes(),
    editSubmissionCount: bridge.editSubmissions.records().length,
    solverSubmissionCount: bridge.solverSubmissions.records().length,
    finalEditGeneration: bridge.editGeneration,
  });

  return { installed: true };
}

// ── Node-side driving ───────────────────────────────────────────────────────────────────────

function budgetDims(id) {
  const budget = PHASE5_BUDGETS.find((entry) => entry.id === id);
  if (budget === undefined) throw new Error(`the protocol registers no budget ${id}`);
  return budget.dims;
}

function assertRegisteredEditScript() {
  const bound = EDIT_SCRIPT_BINDINGS.map((entry) => entry.entry);
  const registered = [...PHASE5_PERFORMANCE.editScript];
  if (
    bound.length !== registered.length ||
    bound.some((entry, index) => entry !== registered[index])
  ) {
    throw new Error(
      `the probe drives [${bound.join(", ")}] but the protocol registers ` +
        `[${registered.join(", ")}]`,
    );
  }
  const cases = PREVIEW_CASES.map((entry) => entry.id);
  const registeredCases = [...PHASE5_PERFORMANCE.previewCases];
  if (
    cases.length !== registeredCases.length ||
    cases.some((entry, index) => entry !== registeredCases[index])
  ) {
    throw new Error("the probe cases do not match the registered preview cases");
  }
}

function nearestRankCeilP99(values) {
  if (values.length === 0) return Number.POSITIVE_INFINITY;
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.max(0, Math.ceil(sorted.length * 0.99) - 1)];
}

async function selectedIndexOf(page, control) {
  return page.evaluate(
    (name) => document.querySelector(`[data-vcc-phase5-control="${name}"]`).selectedIndex,
    control,
  );
}

async function optionTextsOf(page, control) {
  return page.evaluate(
    (name) =>
      [...document.querySelector(`[data-vcc-phase5-control="${name}"]`).options].map(
        (option) => (option.textContent ?? "").trim(),
      ),
    control,
  );
}

/** Move a list control to a registered option with real arrow-key interactions only. */
async function moveSelectTo(page, control, targetIndex) {
  const locator = page.locator(`[data-vcc-phase5-control="${control}"]`);
  for (let attempt = 0; attempt <= 16; attempt++) {
    const current = await selectedIndexOf(page, control);
    if (current === targetIndex) return;
    await locator.press(current < targetIndex ? "ArrowDown" : "ArrowUp");
  }
  throw new Error(`${control} did not reach option index ${targetIndex}`);
}

async function performInteraction(page, binding, ordinal) {
  const selector = `[data-vcc-phase5-control="${binding.control}"]`;
  if (binding.interaction === "click") {
    await page.locator(selector).click();
    return { kind: "click", selector };
  }
  if (binding.interaction === "arrow-key") {
    const forward = ordinal % 2 === 0;
    const key =
      binding.control === "sliceTrack"
        ? forward
          ? "ArrowRight"
          : "ArrowLeft"
        : forward
          ? "ArrowDown"
          : "ArrowUp";
    await page.locator(selector).press(key);
    return { kind: "arrow-key", selector, key };
  }
  const point = PROBE_POINTER_POINTS[ordinal % PROBE_POINTER_POINTS.length];
  await page.mouse.move(point.x, point.y);
  return { kind: "pointer-move", selector, point };
}

async function main() {
  if (process.argv.length !== 2) {
    throw new Error("Phase 5 performance probe accepts no options");
  }
  if (process.platform !== "win32") {
    throw new Error(`Phase 5 performance probe does not support ${process.platform}`);
  }
  assertRegisteredEditScript();
  const browserPath = chromium.executablePath();
  if (!existsSync(browserPath)) {
    throw new Error(`the frozen Chromium executable is absent: ${browserPath}`);
  }
  const pageHtml = applicationPageHtml();
  const vite = await createViteServer({
    root: repoRoot,
    appType: "custom",
    logLevel: "error",
    // A probe-private dependency cache: the measurement never inherits, and never disturbs,
    // whatever state an interactive `vite dev` left behind.
    cacheDir: resolve(repoRoot, "node_modules", ".vite-phase5-performance"),
    server: {
      host: "127.0.0.1",
      port: 0,
      strictPort: false,
      fs: { allow: [repoRoot] },
    },
    // The application's own dev configuration: module workers, and its exact bare dependency
    // set pre-bundled at start so no dependency discovery can reload the page mid-measurement.
    worker: { format: "es" },
    optimizeDeps: {
      include: ["tweakpane", "three/webgpu", "three/addons/controls/OrbitControls.js"],
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
          response.end(pageHtml);
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
    const page = await browser.newPage({ viewport: VIEWPORT });
    const consoleErrors = [];
    const pageErrors = [];
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    page.on("pageerror", (error) => pageErrors.push(String(error)));
    await page.addInitScript(installDeviceInterception, {
      deviceLabel: PROBE_DEVICE_LABEL,
      productionModuleUrl: `${origin}/solver-gpu/src/index.ts`,
      requiredFeatures: [...PHASE5_REQUIRED_FEATURES],
      requiredLimits: { ...PHASE5_REQUIRED_LIMITS },
    });
    await page.goto(`${origin}/phase5-performance`, { waitUntil: "load" });
    // The measurement never starts before the application itself is live: a booted renderer,
    // a resolved backend, and its first worker snapshot rendered. A device or boot fault
    // resolves the same wait immediately so the failure is reported, not timed out.
    const bootHandle = await page.waitForFunction(
      () => {
        const deviceState = window.__vccPhase5Device;
        if (deviceState !== undefined && deviceState.deviceError !== null) {
          return { booted: false, reason: `shared device: ${deviceState.deviceError}` };
        }
        const debugHook = window.__vccDebug;
        if (debugHook === undefined) return null;
        if (debugHook.errors.length > 0) {
          return { booted: false, reason: `application: ${debugHook.errors.join(" | ")}` };
        }
        if (debugHook.backend === null || debugHook.snapshotCount === 0) return null;
        return { booted: true, backend: debugHook.backend };
      },
      undefined,
      { timeout: 180_000, polling: 100 },
    );
    const boot = await bootHandle.jsonValue();
    if (!boot.booted) {
      throw new Error(`the Phase 5 performance page did not boot — ${boot.reason}`);
    }
    const backend = boot.backend;
    if (backend !== "WebGPU") {
      throw new Error(`the application rendered on ${String(backend)}, not WebGPU`);
    }
    const installed = await page.evaluate(installPreviewBridge, {
      coreModuleUrl: `${origin}/core/src/index.ts`,
      cpuModuleUrl: `${origin}/solver-cpu/src/index.ts`,
      productionModuleUrl: `${origin}/solver-gpu/src/index.ts`,
      scenariosModuleUrl: `${origin}/app/src/scenarios.ts`,
      appProtocolModuleUrl: `${origin}/app/src/protocol.ts`,
      sliceFrameShader: SLICE_FRAME_WGSL,
      slicePreviewShader: SLICE_PREVIEW_WGSL,
      requiredLimits: { ...PHASE5_REQUIRED_LIMITS },
      observedEventTypes: [...new Set(EDIT_SCRIPT_BINDINGS.map((entry) => entry.eventType))],
      editScript: [...PHASE5_PERFORMANCE.editScript],
    });
    if (installed.installed !== true) throw new Error("the preview bridge did not install");
    const bridgeSetup = await page.evaluate(() => window.__vccPhase5Bridge.setup());

    // Untimed preparation, through the application's own affordances: expand the two collapsed
    // folders with real clicks, and enable the application's own slice view through the same
    // debug hook `app/scripts/visual.mjs` uses. None of this is a registered edit.
    for (const folder of ["runConfigFolder", "phase4Folder"]) {
      await page.locator(`[data-vcc-phase5-control="${folder}"]`).click();
    }
    await page.waitForTimeout(400);
    await page.evaluate(() => {
      window.__vccDebug.setSlice({
        enabled: true,
        orientation: "vertical",
        min: 0,
        max: 0.1,
      });
    });
    const appSliceBaseIndex = await page.evaluate(() =>
      window.__vccDebug.renderedSliceIndex()
    );

    const scenarioOptions = await optionTextsOf(page, "scenarioSelect");
    const scenarioLabels = await page.evaluate(
      (ids) =>
        ids.map((id) => {
          const scenario = window.__vccPhase5Bridge.scenarios.PHASE4_SCENARIOS.find(
            (entry) => entry.id === id,
          );
          if (scenario === undefined) throw new Error(`the application registers no ${id}`);
          return scenario.label;
        }),
      SCENARIO_PAIR,
    );
    const scenarioIndices = scenarioLabels.map((label) => {
      const index = scenarioOptions.indexOf(label);
      if (index < 0) throw new Error(`the scenario control has no option ${label}`);
      return index;
    });
    const presetOptions = await optionTextsOf(page, "presetSelect");

    const submissionSamples = [];
    const interactions = [];
    const ordinals = [];
    const caseReports = [];
    const failures = [];
    const total = PHASE5_PERFORMANCE.warmupCount + PHASE5_PERFORMANCE.sampleCount;
    for (const [caseIndex, previewCase] of PREVIEW_CASES.entries()) {
      const dims = budgetDims(previewCase.id);
      const presetIndices = previewCase.presetPair.map((name) => {
        const index = presetOptions.indexOf(name);
        if (index < 0) throw new Error(`the preset control has no option ${name}`);
        return index;
      });
      if (presetIndices[1] !== presetIndices[0] + 1) {
        throw new Error(`the ${previewCase.id} preset pair is not adjacent in the control`);
      }
      if (scenarioIndices[1] !== scenarioIndices[0] + 1) {
        throw new Error("the registered scenario pair is not adjacent in the control");
      }
      await moveSelectTo(page, "presetSelect", presetIndices[0]);
      await moveSelectTo(page, "scenarioSelect", scenarioIndices[0]);
      const caseReport = await page.evaluate(
        (caseInput) => window.__vccPhase5Bridge.beginCase(caseInput),
        {
          id: previewCase.id,
          dims,
          initialPreset: previewCase.initialPreset,
          solverGeneration: caseIndex + 1,
        },
      );
      const ordinalRecords = [];
      try {
        for (let ordinal = 0; ordinal < total; ordinal++) {
          const warmup = ordinal < PHASE5_PERFORMANCE.warmupCount;
          const sample = warmup ? ordinal : ordinal - PHASE5_PERFORMANCE.warmupCount;
          const phase = warmup ? "warmup" : "sample";
          await page.evaluate(
            (ordinalInput) => window.__vccPhase5Bridge.beginOrdinal(ordinalInput),
            { ordinal, sample, phase, budgetId: previewCase.id },
          );
          const dispatched = [];
          for (const [index, binding] of EDIT_SCRIPT_BINDINGS.entries()) {
            await page.evaluate(
              (armInput) => window.__vccPhase5Bridge.armEdit(armInput),
              {
                index,
                entry: binding.entry,
                control: binding.control,
                eventType: binding.eventType,
              },
            );
            dispatched.push(await performInteraction(page, binding, ordinal));
            await page.evaluate(
              (editIndex) => window.__vccPhase5Bridge.awaitEdit(editIndex),
              index,
            );
          }
          const record = await page.evaluate(() =>
            window.__vccPhase5Bridge.finishOrdinal()
          );
          record.dispatchedInteractions = dispatched;
          ordinalRecords.push(record);
          submissionSamples.push({
            budgetId: record.budgetId,
            sample: record.sample,
            warmup: record.warmup,
            segmentWallMs: record.segmentWallMs,
          });
          if (!record.warmup) {
            interactions.push({
              budgetId: record.budgetId,
              sample: record.sample,
              editAcknowledgementMs: record.editAcknowledgementMs,
              firstValidFrameMs: record.firstValidFrameMs,
              editGeneration: record.editGeneration,
              acceptedGeneration: record.acceptedGeneration,
              renderedGeneration: record.frame.renderedGeneration,
            });
          }
        }
      } finally {
        // Releasing the case's resident buffers must never mask the fault that got us here.
        caseReport.closing = await page
          .evaluate(() => window.__vccPhase5Bridge.endCase())
          .catch((error) => ({
            error: error instanceof Error ? error.message : String(error),
          }));
      }
      caseReports.push(caseReport);
      ordinals.push(...ordinalRecords);
    }

    const observed = await page.evaluate(() => window.__vccPhase5Bridge.observed());
    const deviceLossCount = observed.deviceLossRecords.length;
    const uncapturedErrorCount = observed.uncapturedErrors.length;
    const hiddenRetryCount = observed.reacquisitions.length;

    // ── Every verdict below is a comparison against an OBSERVED quantity ──────────────────
    if (observed.applicationBackend !== "WebGPU") {
      failures.push(`the application backend is ${String(observed.applicationBackend)}`);
    }
    if (deviceLossCount !== PHASE5_PERFORMANCE.permittedDeviceLosses) {
      failures.push(`observed ${deviceLossCount} device loss event(s)`);
    }
    if (uncapturedErrorCount !== PHASE5_PERFORMANCE.permittedUncapturedErrors) {
      failures.push(`observed ${uncapturedErrorCount} uncaptured GPU error(s)`);
    }
    if (hiddenRetryCount !== PHASE5_PERFORMANCE.permittedHiddenRetries) {
      failures.push(`observed ${hiddenRetryCount} silent GPU re-acquisition(s)`);
    }
    if (observed.editQueueLossReason !== null || observed.solverQueueLossReason !== null) {
      failures.push("a production submission queue recorded an unexpected device loss");
    }
    if (observed.untrustedRegisteredEvents !== 0) {
      failures.push(
        `${observed.untrustedRegisteredEvents} registered edit event(s) were untrusted`,
      );
    }
    if (observed.applicationErrors.length !== 0) {
      failures.push(`the application recorded ${observed.applicationErrors.length} error(s)`);
    }
    if (observed.fullFieldDisplayFrameCount !==
      PHASE5_PERFORMANCE.permittedFullFieldReadbacksPerDisplayFrame) {
      failures.push("a display frame performed a full-field readback");
    }
    if (consoleErrors.length !== 0) failures.push(`${consoleErrors.length} console error(s)`);
    if (pageErrors.length !== 0) failures.push(`${pageErrors.length} page error(s)`);
    if (observed.finalEditGeneration !== ordinals.length * EDIT_SCRIPT_BINDINGS.length) {
      failures.push("the observed edit-generation count does not match the executed script");
    }
    const displayFrames = new Set(
      observed.readbackRecords
        .filter((entry) => entry.displayFrame)
        .map((entry) => entry.displayFrameSequence),
    );
    if (displayFrames.size !== ordinals.length) {
      failures.push(
        `observed ${displayFrames.size} display frames for ${ordinals.length} samples`,
      );
    }

    let previousGeneration = 0;
    for (const record of ordinals) {
      const where = `${record.budgetId}:${record.phase}:${record.sample}`;
      for (const edit of record.edits) {
        if (edit.editGeneration <= previousGeneration) {
          failures.push(`${where}:${edit.entry} generation did not increase monotonically`);
        }
        previousGeneration = edit.editGeneration;
        if (edit.acceptedGeneration !== edit.editGeneration) {
          failures.push(`${where}:${edit.entry} accepted a different generation`);
        }
        if (!(edit.acknowledgementMs >= 0)) {
          failures.push(`${where}:${edit.entry} acknowledgement time is not measurable`);
        }
        if (edit.acknowledgementMs > PHASE5_PERFORMANCE.editAcknowledgementMs) {
          failures.push(`${where}:${edit.entry} acknowledgement is late`);
        }
        if (edit.transition !== undefined && edit.transition.changed !== true) {
          failures.push(`${where}:${edit.entry} applied an unchanged environment`);
        }
      }
      const abrupt = record.edits.find(
        (edit) => edit.entry === "apply-one-valid-abrupt-event-at-completed-boundary",
      );
      if (abrupt === undefined || abrupt.atCompletedCycleBoundary !== true) {
        failures.push(`${where} did not apply its abrupt event at a completed-cycle boundary`);
      }
      const moved = record.edits.find((edit) => edit.entry === "move-slice");
      if (moved === undefined || moved.slice.moved !== true) {
        failures.push(`${where} did not move the slice`);
      } else if (
        moved.slice.gpuSliceIndex !== record.frame.renderedSliceIndex ||
        moved.slice.gpuPreviousSliceIndex !== record.frame.comparedSliceIndex
      ) {
        failures.push(`${where} rendered a slice the edit did not select`);
      }
      if (record.frame.sliceContentChanged !== true) {
        failures.push(`${where} rendered an unchanged slice`);
      }
      if (record.frame.renderedGeneration !== record.editGeneration) {
        failures.push(`${where} rendered a stale generation`);
      }
      if (record.frame.renderedOrdinal !== record.ordinal) {
        failures.push(`${where} rendered a stale ordinal`);
      }
      if (record.frame.paintedTexels !== record.frame.expectedTexels) {
        failures.push(`${where} painted ${record.frame.paintedTexels} texels`);
      }
      if (record.frame.errorFlags !== 0) {
        failures.push(`${where} reported GPU error flags ${record.frame.errorFlags}`);
      }
      if (record.segmentWallMs.length === 0) {
        failures.push(`${where} has no bounded submission segment`);
      }
      if (record.segmentWallMs.some(
        (value) => !(value >= 0) || value > PHASE5_PERFORMANCE.maxSubmissionSegmentMs,
      )) {
        failures.push(`${where} exceeds the maximum submission segment bound`);
      }
      if (!record.warmup) {
        if (record.firstValidFrameMs > PHASE5_PERFORMANCE.firstValidPostEditFrameMs) {
          failures.push(`${where} first valid frame is late`);
        }
      }
    }
    const p99ByBudget = {};
    for (const budgetId of PHASE5_PERFORMANCE.previewCases) {
      const measured = submissionSamples
        .filter((entry) => entry.budgetId === budgetId && !entry.warmup)
        .map((entry) => Math.max(...entry.segmentWallMs));
      const p99 = nearestRankCeilP99(measured);
      p99ByBudget[budgetId] = p99;
      if (p99 > PHASE5_PERFORMANCE.p99SubmissionSegmentMs) {
        failures.push(`${budgetId} submission p99 exceeds its bound`);
      }
    }
    if (interactions.length !== PREVIEW_CASES.length * PHASE5_PERFORMANCE.sampleCount) {
      failures.push("the interaction inventory is incomplete");
    }

    const report = {
      schema: "phase5-performance-v2",
      pass: failures.length === 0,
      failures,
      protocol: {
        editScript: [...PHASE5_PERFORMANCE.editScript],
        previewCases: [...PHASE5_PERFORMANCE.previewCases],
        warmupCount: PHASE5_PERFORMANCE.warmupCount,
        sampleCount: PHASE5_PERFORMANCE.sampleCount,
        p99Method: PHASE5_PERFORMANCE.p99Method,
        gpuProcessesPerPhysicalAdapter: PHASE5_PERFORMANCE.gpuProcessesPerPhysicalAdapter,
      },
      submissionSamples,
      interactions,
      readback: {
        records: observed.readbackRecords,
        fullFieldDisplayFrameCount: observed.fullFieldDisplayFrameCount,
        totalBytes: observed.readbackTotalBytes,
        displayFrameCount: displayFrames.size,
      },
      deviceLossCount,
      uncapturedErrorCount,
      hiddenRetryCount,
      uncapturedErrors: observed.uncapturedErrors,
      unexpectedDeviceLoss: observed.editQueueLossReason ?? observed.solverQueueLossReason,
      observedRuntimeState: {
        deviceLossRecords: observed.deviceLossRecords,
        reacquisitions: observed.reacquisitions,
        adapterRequests: observed.adapterRequests,
        deviceRequests: observed.deviceRequests,
        editQueueLossReason: observed.editQueueLossReason,
        solverQueueLossReason: observed.solverQueueLossReason,
        applicationErrors: observed.applicationErrors,
        applicationBackend: observed.applicationBackend,
        applicationTick: observed.applicationTick,
        applicationSnapshotCount: observed.applicationSnapshotCount,
        lastInspectError: observed.lastInspectError,
        consoleErrors,
        pageErrors,
        untrustedRegisteredEvents: observed.untrustedRegisteredEvents,
        unarmedTrustedEvents: observed.unarmedTrustedEvents,
        editSubmissionCount: observed.editSubmissionCount,
        solverSubmissionCount: observed.solverSubmissionCount,
        finalEditGeneration: observed.finalEditGeneration,
        shaderMessages: bridgeSetup.shaderMessages,
      },
      interactionEvidence: {
        bindings: EDIT_SCRIPT_BINDINGS,
        appSliceBaseIndex,
        presetOptions,
        scenarioOptions,
        ordinals,
      },
      renderer: {
        backend,
        canvasFormat: bridgeSetup.canvasFormat,
        adapter: bridgeSetup.adapterInfo,
        adapterFeatures: bridgeSetup.adapterFeatures,
        deviceFeatures: bridgeSetup.deviceFeatures,
        deviceLimits: bridgeSetup.deviceLimits,
        requestedFeatures: [...PHASE5_REQUIRED_FEATURES],
        requestedLimits: { ...PHASE5_REQUIRED_LIMITS },
        resolvedControls: bridgeSetup.controls,
        // The renderer's device IS the solver's device: the interception hook hands the
        // production-checked device to the application's own `WebGPURenderer`.
        sharedWithSolver: true,
      },
      cases: caseReports,
      p99SubmissionSegmentMs: p99ByBudget,
      maxSubmissionSegmentMs: Math.max(
        0,
        ...submissionSamples.flatMap((entry) => entry.segmentWallMs),
      ),
      host: {
        platform: process.platform,
        release: os.release(),
        architecture: os.arch(),
        cpu: os.cpus()[0]?.model.trim() ?? "unknown",
        logicalProcessors: os.cpus().length,
        totalMemoryBytes: os.totalmem(),
      },
    };
    process.stdout.write(`${JSON.stringify(report)}\n`);
    if (!report.pass) process.exitCode = 1;
  } finally {
    await browser?.close();
    await vite.close();
  }
}

await main();
