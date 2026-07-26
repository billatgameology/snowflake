#!/usr/bin/env node
// Canonical Phase 5 preview responsiveness probe — WP6 S6: reconciled onto the REAL app path.
//
// This probe measures what `PHASE5_PERFORMANCE` registered, and nothing cheaper:
//
//   * the page IS the Phase 3/4/5 application (`app/index.html` + `app/src/main.ts`), served
//     by Vite from the app root and booted in the frozen Chromium lane;
//   * the application acquires its OWN production device (S2 `acquireProductionGpuDevice`:
//     the high-performance adapter through `requestCheckedGpuDevice` against the frozen
//     Phase 5 features/limits) and shares it with its renderer — the probe intercepts
//     nothing and injects nothing; a passive document-start hook only COUNTS adapter/device
//     requests so silent re-acquisitions are observed from the first moment;
//   * the solver is the application's OWN `GpuEngine` (WP6 S3) at the registered frozen
//     preview budgets, selected through the application's real budget pane row;
//   * the registered `editScript` is executed as FIVE trusted DOM interactions per sample on
//     the application's own Tweakpane controls and its own scene canvas — never by calling a
//     solver API directly. Every registered edit event is asserted `isTrusted`;
//   * every registered edit advances a unique, monotonically increasing generation
//     acknowledged by the application's PRODUCTION edit submission controller (D3): the
//     preset edit through the app's own live preset→environment handler, the slice edit
//     through the app's own display-controls sync, the abrupt event through the production
//     decision-0011 queue seam (`gpuQueueEnvironmentEdit`), and step / named-probe requests
//     through the `gpuRegisterProbeEdit` seam — all four routes acknowledge on the SAME
//     app-owned controller, and acknowledgement timestamps are at-or-after observations of
//     the controller's acceptance (a conservative bound, never an earlier claim);
//   * solver and display work submit through the application's OWN bounded submission
//     controllers: `segmentWallMs` is the app solver controller's completed-record wall
//     times for the sample window (G-G cycle work, instrument reads, S4 extraction/overlay/
//     slice display passes, and the slice-repaint display edit);
//   * first-valid-frame is taken from the application's OWN rendered frame: the app's Three
//     animation loop redraws the S4 GPU view every frame from the display-owned buffers, so
//     the receipt is a double-rAF presentation timestamp AFTER every production submission
//     of the sample completed, with validity evidenced by audited compact reads of the very
//     buffers that frame drew (`gpuViewSample`), the app-rendered slice index, the app's
//     posted snapshot tick, and the production edit controller's generation;
//   * the audit is the application's own production `GpuReadbackAudit`
//     (`__vccDebug.gpuAuditRecords`): the app's render path opens NO display frames and
//     performs NO readbacks per frame, so the registered zero full-field-per-display-frame
//     budget is exercised over the app's real audit rather than a probe-owned one;
//   * observed error, device-loss and re-acquisition state is reported as observed. Nothing
//     here substitutes a literal zero for a quantity the run did not measure.
//
// The registered editScript entries, preview cases, warmup/sample counts, and every frozen
// threshold (`editAcknowledgementMs`, `firstValidPostEditFrameMs`, `p99SubmissionSegmentMs`,
// `maxSubmissionSegmentMs`, permitted losses/errors/retries/full-field reads) are
// byte-identical to the accepted protocol; `PHASE5_PROTOCOL_SHA256` is untouched.

import { existsSync } from "node:fs";
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
const appDir = resolve(repoRoot, "app");

/** The label the app's production shared device is created under (gpudevice.ts
 * APP_GPU_DEVICE_LABEL; asserted against the observed device status, never assumed). */
const APP_DEVICE_LABEL = "vcc-app-shared-device";
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

/** Preview cases: the registered budgets plus the preset pair each case's UI alternates.
 * The run configuration matches the accepted probe's preview cases exactly: seed 1,
 * noiseEpsilon 0, hexPrism domain, dirichlet far field, radius-2/thickness-1 seed (the
 * app's own initial-state factory constructs it). */
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

/**
 * Runs at document start, BEFORE the application boots. It changes NOTHING about how the
 * application acquires its device — the app's own S2 production path runs untouched — it
 * only counts adapter/device requests so a silent re-acquisition is observed from the first
 * moment any code could make one, and retains the first adapter's info for provenance.
 */
function installDeviceObservation() {
  const state = {
    adapterRequests: 0,
    deviceRequests: 0,
    reacquisitions: [],
    adapterInfo: null,
    adapterFeatures: null,
  };
  window.__vccPhase5DeviceObserver = state;
  if (navigator.gpu === undefined) return;
  const nativeRequestAdapter = navigator.gpu.requestAdapter.bind(navigator.gpu);
  navigator.gpu.requestAdapter = async function requestAdapter(options) {
    state.adapterRequests++;
    if (state.adapterRequests > 1) {
      state.reacquisitions.push({ kind: "adapter", ordinal: state.adapterRequests });
    }
    const adapter = await nativeRequestAdapter(options);
    if (adapter !== null && state.adapterInfo === null) {
      state.adapterInfo = {
        vendor: adapter.info.vendor,
        architecture: adapter.info.architecture,
        device: adapter.info.device,
        description: adapter.info.description,
        backend: adapter.info.backend,
        type: adapter.info.type,
        driver: adapter.info.driver,
      };
      state.adapterFeatures = [...adapter.features].sort();
    }
    return adapter;
  };
  const nativeRequestDevice = GPUAdapter.prototype.requestDevice;
  GPUAdapter.prototype.requestDevice = function requestDevice(descriptor) {
    state.deviceRequests++;
    if (state.deviceRequests > 1) {
      state.reacquisitions.push({ kind: "device", ordinal: state.deviceRequests });
    }
    return nativeRequestDevice.call(this, descriptor);
  };
}

/**
 * The in-page bridge. It owns NO GPU resources and steps NO solver: it observes the
 * application's own trusted control events, verifies each registered edit's effect from the
 * application's own posted state, and reads the application's own production controllers,
 * audit, and rendered-frame source buffers through the S6 debug seams.
 */
function installAppProbeBridge(input) {
  const dbg = window.__vccDebug;
  if (dbg === undefined) throw new Error("__vccDebug is absent");
  if (dbg.engine() !== "gpu") {
    throw new Error(`the application engine is ${dbg.engine()}, not the GPU engine`);
  }

  const bridge = {
    input,
    core: null,
    scenarios: null,
    appProtocol: null,
    controls: new Map(),
    activeCase: null,
    ordinal: null,
    queue: Promise.resolve(),
    armed: null,
    pendingEdits: new Map(),
    unarmedTrustedEvents: 0,
    untrustedRegisteredEvents: 0,
  };
  window.__vccPhase5Bridge = bridge;

  function fail(message) {
    throw new Error(message);
  }

  function sleep(ms) {
    return new Promise((accept) => {
      setTimeout(accept, ms);
    });
  }

  async function waitFor(label, predicate, timeoutMs, intervalMs = 5) {
    const deadline = performance.now() + timeoutMs;
    for (;;) {
      const value = predicate();
      if (value) return value;
      if (performance.now() > deadline) fail(`probe wait timed out: ${label}`);
      await sleep(intervalMs);
    }
  }

  function controllerReport() {
    const report = dbg.gpuSubmissionRecords();
    if (report === null) fail("the application has no GPU submission controllers");
    return report;
  }

  function editGenerationNow() {
    return controllerReport().editGeneration;
  }

  function snapshotNow() {
    const snapshot = dbg.gpuSnapshot();
    if (snapshot === null) fail("the application has posted no GPU snapshot");
    return snapshot;
  }

  /** Key-order-independent environment identity (snapshot envs and scenario/preset envs
   * are built by different code paths; values, not key order, are the comparison). */
  function environmentKey(environment) {
    return JSON.stringify([
      environment.rho,
      environment.phi,
      [...environment.kappa],
      [...environment.mu],
      [...environment.ggThreshBeta],
    ]);
  }

  function readoutText() {
    return document.getElementById("readout")?.textContent ?? "";
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
    if (element === null || element === undefined) {
      fail(`the application control element is absent: ${name}`);
    }
    element.dataset.vccPhase5Control = name;
    bridge.controls.set(name, element);
  }

  function selectedOptionText(name) {
    const select = bridge.controls.get(name);
    const option = select.options[select.selectedIndex];
    if (option === undefined) fail(`${name} has no selected option`);
    return (option.textContent ?? "").trim();
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

  bridge.setup = async () => {
    const [core, scenarios, appProtocol] = await Promise.all([
      import(input.coreModuleUrl),
      import(input.scenariosModuleUrl),
      import(input.appProtocolModuleUrl),
    ]);
    bridge.core = core;
    bridge.scenarios = scenarios;
    bridge.appProtocol = appProtocol;

    tag("runConfigFolder", paneFolder("run config"));
    tag("phase4Folder", paneFolder("phase 4"));
    tag("stepButton", paneButton("step (one tick)"));
    tag("presetSelect", paneRowValue("preset (").querySelector(".tp-lstv_s"));
    tag("scenarioSelect", paneRowValue("scenario (").querySelector(".tp-lstv_s"));
    tag("budgetSelect", paneRowValue("gpu budget (").querySelector(".tp-lstv_s"));
    // D2 guarantee: the `#scene canvas` FIRST match is Three's pointer/orbit canvas; the S4
    // GPU view canvas sits after it with pointer-events: none.
    const sceneCanvas = document.querySelector("#scene canvas");
    if (sceneCanvas === null) fail("the application scene canvas is absent");
    tag("sceneCanvas", sceneCanvas);

    for (const type of input.observedEventTypes) {
      // Bubble phase on `window`: every listener the application itself installed on the
      // control, and on every ancestor, has already run, so the observed state is the state
      // the application accepted for that interaction.
      window.addEventListener(type, onRegisteredEvent, false);
    }

    const deviceStatus = dbg.gpuDeviceStatus();
    return {
      controls: [...bridge.controls.keys()],
      backend: dbg.backend,
      engine: dbg.engine(),
      budget: dbg.gpuBudget(),
      canvasFormat: navigator.gpu.getPreferredCanvasFormat(),
      deviceStatus,
    };
  };

  /**
   * Per-entry acknowledgement, SYNCHRONOUS in the bubble listener. Two routes exist, both
   * ending at the application's production edit controller:
   *   - app-native (preset → queueEnvironmentEdit; slice → registerViewEdit via the
   *     display-controls sync): the app's own handler acknowledged during dispatch, so the
   *     listener observes the advanced generation and stamps an at-or-after time;
   *   - seam-routed (scenario → gpuQueueEnvironmentEdit; step and named probes →
   *     gpuRegisterProbeEdit): the seam acknowledges NOW and returns the accepted
   *     generation with its at-or-after acceptance time.
   */
  function acknowledgeRegisteredEdit(record) {
    if (
      record.entry === "change-one-valid-operator-control" ||
      record.entry === "move-slice"
    ) {
      if (record.entry === "change-one-valid-operator-control") {
        const selection = environmentOfSelectedPreset();
        record.control = selection.control;
        record.expectedEnvironment = selection.environment;
      }
      const generation = editGenerationNow();
      if (generation === record.generationBefore + 1) {
        record.editGeneration = generation;
        record.acceptedGeneration = generation;
        record.acceptedAtMs = performance.now();
        record.acknowledgementMs = record.acceptedAtMs - record.editedAtMs;
        record.acknowledgementSource =
          "application-handler (production edit controller; observed at bubble listener)";
      } else {
        // Deferred handler emission: the bounded applyEdit poll observes the acceptance.
        record.pendingAcknowledgement = true;
      }
      return;
    }
    if (record.entry === "apply-one-valid-abrupt-event-at-completed-boundary") {
      const selection = environmentOfSelectedScenario();
      record.control = selection.control;
      record.expectedEnvironment = selection.environment;
      const accepted = dbg.gpuQueueEnvironmentEdit(selection.environment);
      if (accepted === null) fail("the application refused the environment edit (no GPU engine)");
      record.editGeneration = accepted.generation;
      record.acceptedGeneration = editGenerationNow();
      record.acceptedAtMs = accepted.acceptedAtMs;
      record.acknowledgementMs = accepted.acceptedAtMs - record.editedAtMs;
      record.acknowledgementSource =
        "gpuQueueEnvironmentEdit (production decision-0011 environment queue)";
      return;
    }
    const accepted = dbg.gpuRegisterProbeEdit();
    if (accepted === null) fail("the application refused the probe edit (no GPU engine)");
    record.editGeneration = accepted.generation;
    record.acceptedGeneration = editGenerationNow();
    record.acceptedAtMs = accepted.acceptedAtMs;
    record.acknowledgementMs = accepted.acceptedAtMs - record.editedAtMs;
    record.acknowledgementSource = "gpuRegisterProbeEdit (production edit controller)";
  }

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
    const record = {
      index: armed.index,
      entry: armed.entry,
      control: armed.control,
      eventType: event.type,
      trusted: true,
      editedAtMs: event.timeStamp,
      generationBefore: armed.generationBefore,
      tickBefore: armed.tickBefore,
      environmentBefore: armed.environmentBefore,
      sliceIndexBefore: armed.sliceIndexBefore,
      expectedSliceIndex: armed.expectedSliceIndex,
      solverRecordsBefore: armed.solverRecordsBefore,
    };
    acknowledgeRegisteredEdit(record);
    bridge.ordinal.edits.push(record);
    const work = bridge.queue.then(() => applyEdit(record));
    bridge.queue = work.then(
      () => undefined,
      () => undefined,
    );
    bridge.pendingEdits.set(record.index, work);
  }

  async function applyEdit(record) {
    const activeCase = bridge.activeCase;
    const label = `${activeCase.id}:${bridge.ordinal.phase}:${bridge.ordinal.sample}:${record.entry}`;
    if (record.pendingAcknowledgement === true) {
      await waitFor(
        `${label} acknowledgement`,
        () => editGenerationNow() >= record.generationBefore + 1,
        10_000,
        1,
      );
      record.editGeneration = record.generationBefore + 1;
      record.acceptedGeneration = editGenerationNow();
      record.acceptedAtMs = performance.now();
      record.acknowledgementMs = record.acceptedAtMs - record.editedAtMs;
      record.acknowledgementSource =
        "application-handler (production edit controller; observed by bounded poll)";
      record.pendingAcknowledgement = false;
    }
    if (
      record.entry === "change-one-valid-operator-control" ||
      record.entry === "apply-one-valid-abrupt-event-at-completed-boundary"
    ) {
      const expectedKey = environmentKey(record.expectedEnvironment);
      await waitFor(
        `${label} applied environment`,
        () =>
          controllerReport().pendingEnvironmentEdits === 0 &&
          environmentKey(snapshotNow().environment) === expectedKey,
        30_000,
        2,
      );
      const after = snapshotNow();
      record.tickAfter = after.tick;
      record.transition = {
        beforeEnvironment: record.environmentBefore,
        afterEnvironment: after.environment,
        changed: environmentKey(record.environmentBefore) !== expectedKey,
      };
      if (record.entry === "apply-one-valid-abrupt-event-at-completed-boundary") {
        // The production engine applies queued environment edits ONLY at completed-cycle
        // boundaries (decision 0011; `GpuGgSolver.applyTimelineEnvironment` refuses any
        // other seam). Applied-with-tick-unchanged == applied at THIS completed boundary.
        record.atCompletedCycleBoundary =
          after.tick === record.tickBefore &&
          controllerReport().pendingEnvironmentEdits === 0;
      }
      delete record.expectedEnvironment;
      return;
    }
    if (record.entry === "step") {
      await waitFor(
        `${label} tick`,
        () => dbg.tick === record.tickBefore + 1 && snapshotNow().tick === record.tickBefore + 1,
        60_000,
        2,
      );
      record.tickAfter = dbg.tick;
      return;
    }
    if (record.entry === "move-slice") {
      await waitFor(
        `${label} rendered index`,
        () => dbg.renderedSliceIndex() === record.expectedSliceIndex,
        10_000,
        2,
      );
      // The display repaint for this control edit is a bounded submission through the
      // application's SOLVER controller (the display passes read solver buffers).
      await waitFor(
        `${label} repaint submission`,
        () => {
          const report = controllerReport();
          return report.solver
            .slice(record.solverRecordsBefore)
            .some((entry) => entry.label.startsWith("app:view:controls-"));
        },
        30_000,
        2,
      );
      record.slice = {
        appRenderedIndex: dbg.renderedSliceIndex(),
        appBaseIndex: activeCase.appSliceBaseIndex,
        appLegend: dbg.sliceLegendText(),
        movedFromIndex: record.sliceIndexBefore,
        moved: dbg.renderedSliceIndex() !== record.sliceIndexBefore,
      };
      return;
    }
    if (record.entry === "request-named-probes") {
      // The user asked the instrument for values: the app's named-probe picking floor reads
      // exactly the probed cells through the production audit (never a full field).
      const target = activeCase.pickTarget;
      const accepted = dbg.pickCell(target.i, target.j, target.k);
      if (accepted !== true) fail(`${label}: the application refused the named-probe pick`);
      await waitFor(
        `${label} readout`,
        () => {
          const text = readoutText();
          return (
            !text.includes("reading GPU-resident state") &&
            text.includes("float32 GPU-resident state via audited named probes")
          );
        },
        30_000,
        5,
      );
      const text = readoutText();
      const bMatch = /b = ([-\d.]+)/.exec(text);
      const dMatch = /d = ([-\d.]+)/.exec(text);
      record.namedProbe = {
        pick: dbg.lastPick,
        cell: { ...target },
        b: bMatch === null ? null : Number(bMatch[1]),
        d: dMatch === null ? null : Number(dMatch[1]),
        provenanceLinePresent: true,
      };
      return;
    }
    fail(`the edit script contains an unbound entry: ${record.entry}`);
  }

  bridge.beginCase = (caseInput) => {
    // The application just (re)initialized at this case's frozen budget: re-resolve the
    // rebuilt slice slider (init disposes and recreates the index bindings) and record the
    // case baselines from the app's own posted state.
    tag("sliceTrack", paneRowValue("j index").querySelector(".tp-sldv_t"));
    const snapshot = snapshotNow();
    const viewInfo = dbg.gpuViewInfo();
    if (viewInfo === null) fail("the application GPU view has no display state");
    const dims = viewInfo.dims;
    if (
      dims.nx !== caseInput.dims.nx ||
      dims.ny !== caseInput.dims.ny ||
      dims.nz !== caseInput.dims.nz
    ) {
      fail(
        `the application is at ${dims.nx}x${dims.ny}x${dims.nz}, not the ${caseInput.id} ` +
          `budget ${caseInput.dims.nx}x${caseInput.dims.ny}x${caseInput.dims.nz}`,
      );
    }
    if (dbg.gpuBudget() !== caseInput.id) {
      fail(`the application budget is ${dbg.gpuBudget()}, not ${caseInput.id}`);
    }
    if (snapshot.tick !== 0) fail(`the ${caseInput.id} case did not begin at tick 0`);
    const bbox = snapshot.bbox;
    if (bbox === null) fail("the initial snapshot has no seed bbox");
    // Deterministic named-probe target: the seed's bbox midpoint — attached at tick 0 and
    // (G-G attachment being permanent) at every later tick.
    const pickTarget = {
      i: (bbox.iMin + bbox.iMax) >> 1,
      j: (bbox.jMin + bbox.jMax) >> 1,
      k: (bbox.kMin + bbox.kMax) >> 1,
    };
    const report = controllerReport();
    bridge.activeCase = {
      id: caseInput.id,
      dims: { nx: dims.nx, ny: dims.ny, nz: dims.nz },
      appSliceBaseIndex: dbg.renderedSliceIndex(),
      pickTarget,
      cellCount: dims.nx * dims.ny * dims.nz,
    };
    return {
      id: caseInput.id,
      dims: bridge.activeCase.dims,
      budget: dbg.gpuBudget(),
      tick: snapshot.tick,
      attachedCount: snapshot.attachedCount,
      boundarySize: snapshot.boundarySize,
      appSliceBaseIndex: bridge.activeCase.appSliceBaseIndex,
      pickTarget,
      initialEnvironment: snapshot.environment,
      viewGeneration: viewInfo.generation,
      solverSubmissionsAtStart: report.solver.length,
      editGenerationAtStart: report.editGeneration,
      auditRecordsAtStart: (dbg.gpuAuditRecords() ?? []).length,
    };
  };

  bridge.beginOrdinal = (ordinalInput) => {
    const report = controllerReport();
    bridge.ordinal = {
      ...ordinalInput,
      edits: [],
      solverRecordsBefore: report.solver.length,
      editRecordsBefore: report.edit.length,
      editGenerationBefore: report.editGeneration,
    };
    bridge.pendingEdits = new Map();
    bridge.armed = null;
    return { ordinal: ordinalInput.ordinal, generation: report.editGeneration };
  };

  bridge.armEdit = (armInput) => {
    if (bridge.armed !== null) fail(`edit ${bridge.armed.index} is still armed`);
    if (!bridge.controls.has(armInput.control)) {
      fail(`the application control is not resolved: ${armInput.control}`);
    }
    const report = controllerReport();
    const snapshot = snapshotNow();
    const sliceIndexBefore = dbg.renderedSliceIndex();
    const dims = bridge.activeCase.dims;
    const expectedSliceIndex =
      armInput.entry === "move-slice"
        ? Math.min(Math.max(sliceIndexBefore + (armInput.forward ? 1 : -1), 0), dims.ny - 1)
        : null;
    bridge.armed = {
      index: armInput.index,
      entry: armInput.entry,
      control: armInput.control,
      eventType: armInput.eventType,
      generationBefore: report.editGeneration,
      solverRecordsBefore: report.solver.length,
      tickBefore: snapshot.tick,
      environmentBefore: JSON.parse(JSON.stringify(snapshot.environment)),
      sliceIndexBefore,
      expectedSliceIndex,
    };
    return { armed: armInput.index };
  };

  bridge.awaitEdit = async (index) => {
    // The trusted event is dispatched by the browser, so it can land a beat after the
    // driver's input call resolves. The wait is bounded and never invents an edit: a script
    // entry that produced no trusted event on its own control fails by name.
    const deadline = performance.now() + 5_000;
    while (!bridge.pendingEdits.has(index)) {
      if (performance.now() > deadline) {
        bridge.armed = null;
        fail(`the registered edit ${index} produced no observed trusted event`);
      }
      await sleep(2);
    }
    await bridge.pendingEdits.get(index);
    return bridge.ordinal.edits.find((entry) => entry.index === index);
  };

  bridge.finishOrdinal = async () => {
    const ordinal = bridge.ordinal;
    const activeCase = bridge.activeCase;
    if (ordinal.edits.length !== bridge.input.editScript.length) {
      fail(`ordinal ${ordinal.ordinal} observed ${ordinal.edits.length} registered edits`);
    }
    const last = ordinal.edits[ordinal.edits.length - 1];
    const generation = last.editGeneration;
    const label = `${activeCase.id}:${ordinal.phase}:${ordinal.sample}`;
    // Settle: the engine idle with nothing pending, and the app's bounded submission stream
    // quiescent (a display submission still in flight would misattribute its wall time to
    // the next sample's window).
    let stableCount = 0;
    let stableRecords = -1;
    await waitFor(
      `${label} settled`,
      () => {
        const report = dbg.gpuSubmissionRecords();
        if (report === null || report.pendingEnvironmentEdits !== 0 || dbg.running) {
          stableCount = 0;
          return false;
        }
        if (report.solver.length === stableRecords) stableCount++;
        else {
          stableRecords = report.solver.length;
          stableCount = 1;
        }
        return stableCount >= 3;
      },
      30_000,
      15,
    );
    // Presentation receipt from the application's OWN render loop: the app redraws the S4
    // GPU view every Three frame from the display-owned buffers. The first rAF may belong
    // to a frame whose draw was encoded before the last submission completed; the second
    // receipt is a frame whose draw began strictly after it.
    const presentedMs = await new Promise((accept) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => accept(performance.now()));
      });
    });
    const report = controllerReport();
    const solverRecords = report.solver.slice(ordinal.solverRecordsBefore);
    const editRecords = report.edit.slice(ordinal.editRecordsBefore);
    const renderedGeneration = report.editGeneration;
    // Audited compact reads of the very display buffers the presented frame drew.
    const sample = await dbg.gpuViewSample(64);
    if (sample === null) fail(`${label}: the application view sample is unavailable`);
    const viewInfo = dbg.gpuViewInfo();
    const snapshot = snapshotNow();
    const moveEdit = ordinal.edits.find((entry) => entry.entry === "move-slice");
    const frame = {
      label,
      presentedMs,
      // The application's production edit controller generation observed with the frame
      // receipt — no other actor advances it, so it equals the last registered edit's.
      renderedGeneration,
      renderedSliceIndex: dbg.renderedSliceIndex(),
      comparedSliceIndex: moveEdit === undefined ? null : moveEdit.slice.movedFromIndex,
      sampleTick: sample.tick,
      instanceCount: sample.instanceCount,
      sampledEntries: sample.cells.length,
      attachedCount: snapshot.attachedCount,
      viewGeneration: viewInfo === null ? null : viewInfo.generation,
      sliceEnabled: viewInfo === null ? null : viewInfo.sliceEnabled,
      controlsRepaintSubmitted: solverRecords.some((entry) =>
        entry.label.startsWith("app:view:controls-"),
      ),
      stateSyncSubmitted: solverRecords.some((entry) =>
        entry.label.startsWith("app:view:state-t"),
      ),
    };
    const editedAtMs = ordinal.edits[0].editedAtMs;
    return {
      budgetId: activeCase.id,
      ordinal: ordinal.ordinal,
      phase: ordinal.phase,
      sample: ordinal.sample,
      warmup: ordinal.phase === "warmup",
      editGeneration: generation,
      acceptedGeneration: report.editGeneration,
      editGenerationAtStart: ordinal.editGenerationBefore,
      firstEditAtMs: editedAtMs,
      lastEditAtMs: last.editedAtMs,
      editAcknowledgementMs: Math.max(...ordinal.edits.map((entry) => entry.acknowledgementMs)),
      minimumEditAcknowledgementMs: Math.min(
        ...ordinal.edits.map((entry) => entry.acknowledgementMs),
      ),
      firstValidFrameMs: presentedMs - editedAtMs,
      firstValidFrameFromLastEditMs: presentedMs - last.editedAtMs,
      segmentWallMs: [
        ...solverRecords.map((entry) => entry.wallMs),
        ...editRecords.map((entry) => entry.wallMs),
      ],
      solverSegments: solverRecords.map((entry) => ({
        label: entry.label,
        wallMs: entry.wallMs,
      })),
      edits: ordinal.edits,
      frame,
      tick: snapshot.tick,
    };
  };

  bridge.endCase = () => {
    const snapshot = snapshotNow();
    const report = controllerReport();
    const closing = {
      tick: snapshot.tick,
      stopReason: snapshot.stopReason,
      finalEnvironment: snapshot.environment,
      solverSubmissionsAtEnd: report.solver.length,
      editGenerationAtEnd: report.editGeneration,
      auditRecordsAtEnd: (dbg.gpuAuditRecords() ?? []).length,
    };
    bridge.activeCase = null;
    return closing;
  };

  bridge.observed = () => {
    const device = dbg.gpuDeviceStatus();
    const audit = dbg.gpuAuditSummary();
    const auditRecords = dbg.gpuAuditRecords() ?? [];
    const report = dbg.gpuSubmissionRecords();
    const hook = window.__vccPhase5DeviceObserver ?? null;
    return {
      deviceState: device === null ? null : device.state,
      deviceLabel: device === null ? null : device.label,
      deviceStatusLine: device === null ? null : device.statusLine,
      requiredFeatures: device === null ? null : device.requiredFeatures,
      requiredLimits: device === null ? null : device.requiredLimits,
      observedFeatures: device === null ? null : device.observedFeatures,
      observedLimits: device === null ? null : device.observedLimits,
      uncapturedErrors: device === null ? [] : [...device.uncapturedErrors],
      deviceLossRecords: device === null ? [] : [...device.deviceLossRecords],
      adapterRequests: hook === null ? null : hook.adapterRequests,
      deviceRequests: hook === null ? null : hook.deviceRequests,
      reacquisitions: hook === null ? null : [...hook.reacquisitions],
      adapterInfo: hook === null ? null : hook.adapterInfo,
      adapterFeatures: hook === null ? null : hook.adapterFeatures,
      unarmedTrustedEvents: bridge.unarmedTrustedEvents,
      untrustedRegisteredEvents: bridge.untrustedRegisteredEvents,
      applicationErrors: [...dbg.errors],
      applicationBackend: dbg.backend,
      applicationTick: dbg.tick,
      applicationSnapshotCount: dbg.snapshotCount,
      lastInspectError: dbg.lastInspectError,
      auditSummary: audit,
      readbackRecords: auditRecords,
      fullFieldDisplayFrameCount: audit === null ? null : audit.fullFieldDisplayFrameReadCount,
      readbackTotalBytes: audit === null ? null : audit.totalBytes,
      editSubmissionCount: report === null ? null : report.edit.length,
      solverSubmissionCount: report === null ? null : report.solver.length,
      finalEditGeneration: report === null ? null : report.editGeneration,
      pendingEnvironmentEdits: report === null ? null : report.pendingEnvironmentEdits,
    };
  };

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
  const vite = await createViteServer({
    // The application's OWN root and dev configuration (app/vite.config.ts adds the module
    // worker format); fs.allow lets the same origin serve core/, solver-cpu/, solver-gpu/
    // and runner/ sources to the page.
    root: appDir,
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
    // The app's exact bare dependency set pre-bundled at start so no dependency discovery
    // can reload the page mid-measurement.
    optimizeDeps: {
      include: ["tweakpane", "three/webgpu", "three/addons/controls/OrbitControls.js"],
    },
    plugins: [{
      name: "vcc-phase5-performance-favicon",
      configureServer(viteServer) {
        viteServer.middlewares.use((request, response, next) => {
          // Chromium requests a favicon for every top-level page. The application does not
          // ship one, so without this the browser logs a 404 that has nothing to do with
          // the measurement. Answering only this exact path keeps every other missing
          // resource a real, reported console error.
          if (request.url?.split("?")[0] === "/favicon.ico") {
            response.writeHead(204);
            response.end();
            return;
          }
          next();
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
  const fsUrl = (...segments) =>
    `${origin}/@fs/${encodeURI(resolve(repoRoot, ...segments).replaceAll("\\", "/"))}`;
  let browser = null;
  try {
    browser = await chromium.launch({
      executablePath: browserPath,
      headless: true,
      args: ["--enable-unsafe-webgpu", "--enable-webgpu-developer-features"],
    });
    const page = await browser.newPage({ viewport: VIEWPORT });
    page.setDefaultTimeout(180_000);
    const consoleErrors = [];
    const pageErrors = [];
    page.on("console", (message) => {
      if (message.type() !== "error") return;
      // Record where the error came from, not just its text: a bare "404 (Not Found)"
      // names no resource, which makes an observed failure unauditable.
      const location = message.location();
      consoleErrors.push({
        text: message.text(),
        url: location.url,
        lineNumber: location.lineNumber,
      });
    });
    page.on("pageerror", (error) => pageErrors.push(String(error)));
    await page.addInitScript(installDeviceObservation);
    await page.goto(`${origin}/`, { waitUntil: "load" });
    // The measurement never starts before the application itself is live ON ITS GPU ENGINE:
    // a booted WebGPU renderer, the acquired production shared device (D4 default), and its
    // first GPU snapshot posted. A device fallback or boot fault resolves the same wait
    // immediately so the failure is reported, not timed out.
    const bootHandle = await page.waitForFunction(
      () => {
        const debugHook = window.__vccDebug;
        if (debugHook === undefined) return null;
        if (debugHook.errors.length > 0) {
          return { booted: false, reason: `application: ${debugHook.errors.join(" | ")}` };
        }
        const device = debugHook.gpuDeviceStatus === undefined
          ? null
          : debugHook.gpuDeviceStatus();
        if (device !== null && device.state === "fallback") {
          return { booted: false, reason: `device fallback: ${device.statusLine}` };
        }
        if (debugHook.backend === null || debugHook.snapshotCount === 0) return null;
        if (debugHook.engine() !== "gpu") {
          return { booted: false, reason: `active engine: ${debugHook.engine()}` };
        }
        if (debugHook.gpuSnapshot === undefined || debugHook.gpuSnapshot() === null) {
          return null;
        }
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
    const installed = await page.evaluate(installAppProbeBridge, {
      coreModuleUrl: fsUrl("core", "src", "index.ts"),
      scenariosModuleUrl: `${origin}/src/scenarios.ts`,
      appProtocolModuleUrl: `${origin}/src/protocol.ts`,
      observedEventTypes: [...new Set(EDIT_SCRIPT_BINDINGS.map((entry) => entry.eventType))],
      editScript: [...PHASE5_PERFORMANCE.editScript],
    });
    if (installed.installed !== true) throw new Error("the probe bridge did not install");
    const bridgeSetup = await page.evaluate(() => window.__vccPhase5Bridge.setup());
    const deviceStatus = bridgeSetup.deviceStatus;
    if (deviceStatus === null || deviceStatus.state !== "acquired") {
      throw new Error("the application did not acquire its production shared device");
    }
    if (deviceStatus.label !== APP_DEVICE_LABEL) {
      throw new Error(
        `the application device label is ${String(deviceStatus.label)}, ` +
          `not ${APP_DEVICE_LABEL}`,
      );
    }
    if (
      JSON.stringify(deviceStatus.requiredFeatures) !==
        JSON.stringify([...PHASE5_REQUIRED_FEATURES]) ||
      JSON.stringify(deviceStatus.requiredLimits) !==
        JSON.stringify({ ...PHASE5_REQUIRED_LIMITS })
    ) {
      throw new Error(
        "the application checked its device against a different frozen requirement set",
      );
    }

    // Untimed preparation, through the application's own affordances: expand the two
    // collapsed folders with real clicks, and enable the application's own slice view
    // through the same debug hook `app/scripts/visual.mjs` uses. None of this is a
    // registered edit.
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
    const budgetOptions = await optionTextsOf(page, "budgetSelect");

    const submissionSamples = [];
    const interactions = [];
    const ordinals = [];
    const caseReports = [];
    const failures = [];
    const appSliceBaseIndexByCase = {};
    const total = PHASE5_PERFORMANCE.warmupCount + PHASE5_PERFORMANCE.sampleCount;
    for (const previewCase of PREVIEW_CASES) {
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

      // ── Untimed case preparation, through the application's own controls/seams ─────────
      // Position the scenario select at the pair's base row (its change handler routes
      // nothing live; the probe's armed listener is what the registered edit uses).
      await page
        .locator('[data-vcc-phase5-control="scenarioSelect"]')
        .selectOption({ label: scenarioLabels[0] });
      // The case's run configuration through the app's own config path (pane + Reset
      // semantics): the accepted probe's exact preview-case parameters.
      await page.evaluate(
        (config) => window.__vccDebug.applyConfig(config),
        {
          preset: previewCase.initialPreset,
          seed: 1,
          noiseEpsilon: 0,
          domain: "hexPrism",
          farField: "dirichlet",
        },
      );
      await page.waitForFunction(
        () => {
          const debugHook = window.__vccDebug;
          const snapshot = debugHook.gpuSnapshot();
          return snapshot !== null && snapshot.tick === 0 && !debugHook.running;
        },
        undefined,
        { timeout: 300_000, polling: 100 },
      );
      // The frozen budget through the application's REAL budget pane row (re-inits at the
      // budget's dims through the app's own fail-closed selection path).
      const budgetLabel = `${previewCase.id} (${dims.nx}x${dims.ny}x${dims.nz})`;
      if (!budgetOptions.includes(budgetLabel)) {
        throw new Error(`the budget control has no option ${budgetLabel}`);
      }
      await page
        .locator('[data-vcc-phase5-control="budgetSelect"]')
        .selectOption({ label: budgetLabel });
      await page.waitForFunction(
        (input) => {
          const debugHook = window.__vccDebug;
          const info = debugHook.gpuViewInfo();
          const snapshot = debugHook.gpuSnapshot();
          return (
            debugHook.gpuBudget() === input.id &&
            info !== null &&
            info.dims.nx === input.dims.nx &&
            info.dims.ny === input.dims.ny &&
            info.dims.nz === input.dims.nz &&
            snapshot !== null &&
            snapshot.tick === 0 &&
            !debugHook.running &&
            debugHook.errors.length === 0
          );
        },
        { id: previewCase.id, dims },
        { timeout: 300_000, polling: 100 },
      );
      // Confirm the preset select landed on the case's initial preset (applyConfig syncs
      // the pane), so the in-sample arrow alternation starts from the registered pair base.
      const presetIndex = await selectedIndexOf(page, "presetSelect");
      if (presetIndex !== presetIndices[0]) {
        throw new Error(
          `the preset control is at index ${presetIndex}, not the ${previewCase.id} base`,
        );
      }

      const caseReport = await page.evaluate(
        (caseInput) => window.__vccPhase5Bridge.beginCase(caseInput),
        { id: previewCase.id, dims },
      );
      appSliceBaseIndexByCase[previewCase.id] = caseReport.appSliceBaseIndex;
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
                forward: ordinal % 2 === 0,
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
        // Closing the case must never mask the fault that got us here.
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
    const hiddenRetryCount =
      observed.reacquisitions === null ? null : observed.reacquisitions.length;
    const unexpectedDeviceLoss =
      observed.deviceLossRecords.length === 0
        ? null
        : `${observed.deviceLossRecords[0].reason}:${observed.deviceLossRecords[0].message}`;

    // ── Every verdict below is a comparison against an OBSERVED quantity ──────────────────
    if (observed.applicationBackend !== "WebGPU") {
      failures.push(`the application backend is ${String(observed.applicationBackend)}`);
    }
    if (observed.deviceState !== "acquired") {
      failures.push(`the application device state is ${String(observed.deviceState)}`);
    }
    if (deviceLossCount !== PHASE5_PERFORMANCE.permittedDeviceLosses) {
      failures.push(`observed ${deviceLossCount} device loss event(s)`);
    }
    if (uncapturedErrorCount !== PHASE5_PERFORMANCE.permittedUncapturedErrors) {
      failures.push(`observed ${uncapturedErrorCount} uncaptured GPU error(s)`);
    }
    if (hiddenRetryCount !== PHASE5_PERFORMANCE.permittedHiddenRetries) {
      failures.push(
        hiddenRetryCount === null
          ? "the adapter/device request observation hook did not run"
          : `observed ${hiddenRetryCount} silent GPU re-acquisition(s)`,
      );
    }
    if (observed.untrustedRegisteredEvents !== 0) {
      failures.push(
        `${observed.untrustedRegisteredEvents} registered edit event(s) were untrusted`,
      );
    }
    if (observed.applicationErrors.length !== 0) {
      failures.push(`the application recorded ${observed.applicationErrors.length} error(s)`);
    }
    if (observed.pendingEnvironmentEdits !== 0) {
      failures.push(
        `${String(observed.pendingEnvironmentEdits)} environment edit(s) never applied`,
      );
    }
    // Residency over the APPLICATION's own audit: the app's render path opens no display
    // frames and reads nothing back per frame, so both the summary count and the records
    // recomputation must equal the registered zero budget.
    const fullFieldDisplayReads = observed.readbackRecords.filter(
      (entry) => entry.fullField === true && entry.displayFrame === true,
    ).length;
    if (
      observed.fullFieldDisplayFrameCount !==
        PHASE5_PERFORMANCE.permittedFullFieldReadbacksPerDisplayFrame ||
      fullFieldDisplayReads !==
        PHASE5_PERFORMANCE.permittedFullFieldReadbacksPerDisplayFrame
    ) {
      failures.push("a display frame performed a full-field readback");
    }
    const displayFrames = new Set(
      observed.readbackRecords
        .filter((entry) => entry.displayFrame === true)
        .map((entry) => entry.displayFrameSequence),
    );
    if (displayFrames.size !== 0) {
      failures.push(
        "the application render path opened display-frame readbacks (D6 forbids them)",
      );
    }
    if (consoleErrors.length !== 0) failures.push(`${consoleErrors.length} console error(s)`);
    if (pageErrors.length !== 0) failures.push(`${pageErrors.length} page error(s)`);

    let previousGeneration = 0;
    for (const record of ordinals) {
      const where = `${record.budgetId}:${record.phase}:${record.sample}`;
      if (record.edits[0].editGeneration !== record.editGenerationAtStart + 1) {
        failures.push(
          `${where} an unregistered edit generation intervened before the first edit`,
        );
      }
      let expectedNext = null;
      for (const edit of record.edits) {
        if (edit.editGeneration <= previousGeneration) {
          failures.push(`${where}:${edit.entry} generation did not increase monotonically`);
        }
        if (expectedNext !== null && edit.editGeneration !== expectedNext) {
          failures.push(
            `${where}:${edit.entry} generation is not consecutive within the sample`,
          );
        }
        expectedNext = edit.editGeneration + 1;
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
      const stepped = record.edits.find((edit) => edit.entry === "step");
      if (stepped === undefined || stepped.tickAfter !== stepped.tickBefore + 1) {
        failures.push(`${where} did not advance exactly one tick`);
      }
      const moved = record.edits.find((edit) => edit.entry === "move-slice");
      if (moved === undefined || moved.slice.moved !== true) {
        failures.push(`${where} did not move the slice`);
      } else if (moved.slice.appRenderedIndex !== record.frame.renderedSliceIndex) {
        failures.push(`${where} rendered a slice the edit did not select`);
      }
      const probed = record.edits.find((edit) => edit.entry === "request-named-probes");
      if (
        probed === undefined ||
        probed.namedProbe.provenanceLinePresent !== true ||
        probed.namedProbe.b === null ||
        probed.namedProbe.d === null
      ) {
        failures.push(`${where} did not read its named probes`);
      }
      if (record.frame.renderedGeneration !== record.editGeneration) {
        failures.push(`${where} rendered a stale generation`);
      }
      if (record.frame.sampleTick !== record.tick) {
        failures.push(`${where} sampled display buffers at a stale tick`);
      }
      if (!(record.frame.instanceCount > 0) || !(record.frame.sampledEntries > 0)) {
        failures.push(`${where} presented no extracted surface instances`);
      }
      if (record.frame.controlsRepaintSubmitted !== true) {
        failures.push(`${where} has no completed slice-repaint display submission`);
      }
      if (record.frame.stateSyncSubmitted !== true) {
        failures.push(`${where} has no completed post-state display sync submission`);
      }
      if (record.frame.sliceEnabled !== true) {
        failures.push(`${where} rendered without the slice enabled`);
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
      schema: "phase5-performance-v3",
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
      unexpectedDeviceLoss,
      observedRuntimeState: {
        deviceLossRecords: observed.deviceLossRecords,
        reacquisitions: observed.reacquisitions,
        adapterRequests: observed.adapterRequests,
        deviceRequests: observed.deviceRequests,
        deviceStatusLine: observed.deviceStatusLine,
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
        pendingEnvironmentEdits: observed.pendingEnvironmentEdits,
        auditSummary: observed.auditSummary,
      },
      interactionEvidence: {
        bindings: EDIT_SCRIPT_BINDINGS,
        appSliceBaseIndexByCase,
        presetOptions,
        scenarioOptions,
        budgetOptions,
        ordinals,
      },
      renderer: {
        backend,
        canvasFormat: bridgeSetup.canvasFormat,
        adapter: observed.adapterInfo,
        adapterFeatures: observed.adapterFeatures,
        deviceLabel: observed.deviceLabel,
        deviceFeatures: observed.observedFeatures,
        deviceLimits: observed.observedLimits,
        requestedFeatures: [...PHASE5_REQUIRED_FEATURES],
        requestedLimits: { ...PHASE5_REQUIRED_LIMITS },
        resolvedControls: bridgeSetup.controls,
        // The renderer's device IS the solver's device: the application acquires ONE
        // production-checked device (S2) and hands it to its own WebGPURenderer while the
        // GPU engine (S3) and GPU view (S4) run on the same device.
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
