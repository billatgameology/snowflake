import * as THREE from "three";
import { visibleEventCount, type DendriteData } from "./dendrite-data.ts";
import { loadGrowthStudy } from "./growth-study-loader.ts";
import { installGrowthPicker } from "./growth-study-picker.ts";
import { growthStudyLabel, growthStudyTilt, type GrowthStudyEntry } from "./growth-study-library.ts";
import { dendriteVertex, dendriteFragment } from "./dendrite-shaders.ts";
import { GrowthSculpture } from "./growth-sculpture.ts";
import { studyFrame, studyPanes, drawStudyOverlay, type StudyPane, type StudyFrame, type ViewBox } from "./three-views.ts";
import { buildBranchJourney, journeyPose, type BranchJourney } from "./branch-journey.ts";
import { installGrowthGraphs } from "./growth-graphs.ts";
import { installVideoExport } from "./growth-video.ts";
import { recordingStatsAt } from "./growth-statistics.ts";
import "./dendrite-styles.css";

const query = new URLSearchParams(location.search);
const el = <T extends HTMLElement>(id: string): T => {
  const found = document.getElementById(id);
  if (!found) throw new Error(`Missing interface element: ${id}`);
  return found as T;
};
const status = el("status");
const play = el<HTMLButtonElement>("play");
const replay = el<HTMLButtonElement>("replay");
const timeline = el<HTMLInputElement>("timeline");
const layout = el<HTMLButtonElement>("layout");
const speed = el<HTMLSelectElement>("speed");
const cards = [...document.querySelectorAll<HTMLElement>(".study")];
const views = [...document.querySelectorAll<HTMLElement>(".viewport")];
const names = ["Ion Bloom", "Timeglass", "Three Views", "Crystal Cast"];
const motion = matchMedia("(prefers-reduced-motion: reduce)");
let playing = !motion.matches;
let selected = Math.max(0, Math.min(3, Math.floor(Number(query.get("style") ?? "1") || 0)));
let focused = query.get("focus") !== "0";
let progress = motion.matches ? 0.82 : 0;
let yaw = 0;
let tilt = 0;
const paneAngles: Record<StudyPane, { yaw: number; tilt: number }> = {
  top: { yaw: 0, tilt: 0 }, journey: { yaw: 0, tilt: 0 }, detail: { yaw: 0, tilt: 0 },
};
function resetCameras(): void {
  yaw = tilt = 0;
  for (const angle of Object.values(paneAngles)) angle.yaw = angle.tilt = 0;
}
let previous = performance.now();
let hold = 0;
let disposed = false;
let frameId = 0;
let dirty = true;
let graphs: ReturnType<typeof installGrowthGraphs> | undefined;
addEventListener("resize", () => { dirty = true; });
addEventListener("scroll", () => { dirty = true; }, { passive: true });
addEventListener("pageshow", () => { dirty = true; previous = performance.now(); });
document.addEventListener("input", () => { dirty = true; });
document.addEventListener("visibilitychange", () => { dirty = true; previous = performance.now(); });

function updateLayout(): void {
  dirty = true;
  document.body.classList.toggle("focused", focused);
  graphs?.setFocused(focused);
  document.querySelector<HTMLElement>(".detail-control")!.hidden = !focused || selected !== 2;
  document.querySelector<HTMLElement>(".light-control")!.hidden = !focused || selected !== 3;
  cards.forEach((card, index) => card.classList.toggle("selected", index === selected));
  el<HTMLSelectElement>("view").value = focused ? String(selected) : "all";
  layout.textContent = focused ? "← Compare all four" : `Focus on ${names[selected]} ↗`;
  const url = new URL(location.href);
  url.searchParams.set("style", String(selected));
  url.searchParams.set("focus", focused ? "1" : "0");
  history.replaceState(null, "", url);
}
function setPlaying(value: boolean): void {
  playing = value;
  play.textContent = playing ? "Pause" : "Play";
  play.setAttribute("aria-label", playing ? "Pause growth" : "Play growth");
}
function seek(value: number): void {
  dirty = true;
  progress = Math.max(0, Math.min(1, value));
  hold = 0;
  timeline.value = String(Math.round(progress * 1000));
  el("position").textContent = `${Math.round(progress * 100)}%`;
}
layout.onclick = () => { focused = !focused; updateLayout(); };
el<HTMLSelectElement>("view").onchange = () => {
  const value = el<HTMLSelectElement>("view").value;
  focused = value !== "all";
  if (focused) selected = Number(value);
  resetCameras();
  updateLayout();
};
cards.forEach((card, index) => {
  card.querySelector("button")!.onclick = () => {
    selected = index;
    focused = true;
    resetCameras();
    updateLayout();
  };
});
play.onclick = () => setPlaying(!playing);
replay.onclick = () => { seek(0); setPlaying(true); };
timeline.oninput = () => { setPlaying(false); seek(Number(timeline.value) / 1000); };
el("fullscreen").onclick = () => {
  const request = document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen();
  void request.catch(() => { status.textContent = "Fullscreen is unavailable in this browser. Focus view is still available."; status.classList.remove("ready"); });
};
document.addEventListener("keydown", event => {
  if (document.querySelector<HTMLDialogElement>("#crystal-browser")?.open || document.querySelector<HTMLDialogElement>("#video-export")?.open) return;
  if (play.disabled) return;
  if (event.target instanceof HTMLInputElement || event.target instanceof HTMLSelectElement || event.target instanceof HTMLButtonElement || event.target instanceof HTMLDetailsElement) return;
  if (event.code === "Space") { event.preventDefault(); setPlaying(!playing); }
  if (event.code === "KeyR") { seek(0); setPlaying(true); }
  if (event.code === "Escape") { focused = false; updateLayout(); }
});
motion.addEventListener("change", () => { if (motion.matches) setPlaying(false); });
for (const viewport of views) {
  let pointer: { x: number; y: number; pane?: StudyPane } | undefined;
  const paneAt = (event: PointerEvent | MouseEvent): StudyPane | undefined => {
    if (selected !== 2) return undefined;
    const rect = viewport.getBoundingClientRect();
    return (Object.entries(studyPanes(rect.width, rect.height)) as [StudyPane, ViewBox][])
      .find(([, box]) => event.clientX - rect.left >= box.left && event.clientX - rect.left <= box.left + box.width
        && event.clientY - rect.top >= box.top && event.clientY - rect.top <= box.top + box.height)?.[0];
  };
  viewport.onpointerdown = event => {
    if (!focused) return;
    pointer = { x: event.clientX, y: event.clientY, pane: paneAt(event) };
    dirty = true;
    viewport.setPointerCapture(event.pointerId);
  };
  viewport.onpointermove = event => {
    if (!pointer) return;
    const dx = (event.clientX - pointer.x) * .006, dy = (event.clientY - pointer.y) * .006;
    if (pointer.pane) {
      const angle = paneAngles[pointer.pane]; angle.yaw += dx;
      angle.tilt = Math.max(-1.2, Math.min(1.2, angle.tilt + dy));
    } else { yaw += dx; tilt = Math.max(-1.2, Math.min(1.2, tilt + dy)); }
    pointer = { ...pointer, x: event.clientX, y: event.clientY };
    dirty = true;
  };
  viewport.onpointerup = viewport.onpointercancel = () => { pointer = undefined; };
  viewport.ondblclick = event => {
    const pane = paneAt(event);
    if (pane) paneAngles[pane].yaw = paneAngles[pane].tilt = 0; else yaw = tilt = 0;
    dirty = true;
  };
}
updateLayout();
setPlaying(playing);

async function start(): Promise<void> {
  const canvas = el<HTMLCanvasElement>("crystal-canvas");
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance", preserveDrawingBuffer: query.has("capture") });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.setClearColor(0x080d12);
  renderer.autoClear = false;
  const sculpture = new GrowthSculpture(renderer);
  let currentData: DendriteData | null = null;
  let currentEntry: GrowthStudyEntry | null = null;
  let framing: StudyFrame | null = null;
  let journey: BranchJourney | null = null;
  let detailMarker: { x: number; y: number } | null = null;
  const overlay = el<HTMLCanvasElement>("study-overlay");
  const exportCanvas = document.createElement("canvas");
  let geometry = new THREE.BufferGeometry();
  let loadVersion = 0;
  let pendingLoad: AbortController | null = null;
  let loading = true;
  let resumeAfterBrowse = false;
  let graphicsReady = true;
  let renderedData: DendriteData | null = null;
  let exporting = false;
  let exportSnapshot: { progress: number; playing: boolean; pixelRatio: number } | null = null;
  graphs = installGrowthGraphs(value => { setPlaying(false); seek(value); }, () => { dirty = true; });
  graphs.setFocused(focused);
  const uniforms = {
    playhead: { value: 0 }, finalTick: { value: 1 },
    pixelsPerUnit: { value: 1 }, style: { value: 0 }, halo: { value: 0 },
    strength: { value: 1.2 },
  };
  const material = new THREE.ShaderMaterial({ vertexShader: dendriteVertex, fragmentShader: dendriteFragment, uniforms, depthTest: true, depthWrite: true });
  const haloUniforms = { ...uniforms, halo: { value: 1 } };
  const haloMaterial = new THREE.ShaderMaterial({ vertexShader: dendriteVertex, fragmentShader: dendriteFragment, uniforms: haloUniforms, transparent: true, blending: THREE.AdditiveBlending, depthTest: false, depthWrite: false });
  const scene = new THREE.Scene();
  const group = new THREE.Group();
  const body = new THREE.Points(geometry, material);
  const glow = new THREE.Points(geometry, haloMaterial);
  body.frustumCulled = glow.frustumCulled = false;
  glow.renderOrder = 1;
  group.add(body, glow);
  scene.add(group);
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10000);
  let width = 0;
  let height = 0;
  function render(outputSize?: { width: number; height: number }): void {
    if (!graphicsReady) return;
    // Scrollbars can reserve space inside the fixed canvas's containing block. innerWidth
    // would stretch a larger drawing buffer into that smaller box and shift every crop edge.
    const display = canvas.getBoundingClientRect();
    const targetWidth = outputSize?.width ?? display.width, targetHeight = outputSize?.height ?? display.height;
    if (width !== targetWidth || height !== targetHeight) {
      width = targetWidth; height = targetHeight;
      renderer.setSize(width, height, false);
    }
    renderer.setScissorTest(false);
    renderer.clear();
    const data = currentData;
    if (data === null || loading) return;
    geometry.setDrawRange(0, visibleEventCount(data.ticks, progress * data.finalTick));
    uniforms.playhead.value = progress * data.finalTick;
    renderer.setScissorTest(true);
    views.forEach((viewport, index) => {
      if (focused && selected !== index) return;
      const bounds = viewport.getBoundingClientRect();
      const rect = outputSize ? new DOMRect(0, 0, width, height)
        : new DOMRect(bounds.left - display.left, bounds.top - display.top, bounds.width, bounds.height);
      if (rect.bottom < 0 || rect.top > height || rect.width === 0) return;
      const baseTilt = data.camera ? data.camera.tiltDegrees * Math.PI / 180
        : growthStudyTilt(currentEntry) ?? (data.vertical ? Math.PI / 2 : 0);
      const baseYaw = data.camera ? data.camera.yawDegrees * Math.PI / 180 : Math.PI / 6;
      const draw = (box: DOMRect, turn: { tilt: number; yaw: number }, center: number[], span: number, style: number) => {
        const aspect = box.width / box.height, extent = span / Math.min(aspect, 1);
        camera.left = -extent * aspect; camera.right = extent * aspect;
        camera.top = extent; camera.bottom = -extent; camera.updateProjectionMatrix();
        group.rotation.set(turn.tilt, 0, turn.yaw);
        group.position.set(center[0]!, center[1]!, center[2]!).applyEuler(group.rotation).negate();
        if (style === 3) {
          sculpture.render(scene, camera, geometry, glow, data, box, height, extent, progress,
            Number(el<HTMLInputElement>("light-angle").value) * Math.PI / 180);
          return;
        }
        uniforms.style.value = style;
        uniforms.pixelsPerUnit.value = box.height / (extent * 2) * renderer.getPixelRatio();
        renderer.setViewport(box.left, height - box.bottom, box.width, box.height);
        renderer.setScissor(box.left, Math.max(0, height - box.bottom), box.width, Math.min(height, box.bottom) - Math.max(0, box.top));
        renderer.render(scene, camera);
      };
      if (index === 2 && framing && journey) {
        const panes = studyPanes(rect.width, rect.height);
        const flight = journeyPose(journey, progress);
        for (const kind of ["top", "journey", "detail"] as const) {
          const box = panes[kind], angle = paneAngles[kind];
          const pane = new DOMRect(rect.left + box.left, rect.top + box.top, box.width, box.height);
          if (pane.top >= height || pane.bottom <= 0) continue;
          const turn = { tilt: (kind === "top" ? 0 : kind === "journey" ? flight.tilt : .95) + angle.tilt,
            yaw: (kind === "journey" ? flight.yaw : kind === "detail" ? -.4 : Math.PI / 6) + angle.yaw };
          const span = kind === "journey" ? flight.span
            : data.extent * (kind === "detail" ? 1.16 / Number(el<HTMLInputElement>("detail-zoom").value) : 1.16);
          draw(pane, turn, kind === "journey" ? flight.center : kind === "detail" ? framing.detail : framing.center, span, 1);
          if (kind === "top") {
            const point = new THREE.Vector3(...framing.detail).applyMatrix4(group.matrixWorld).project(camera);
            detailMarker = { x: box.left + (point.x + 1) / 2 * box.width, y: box.top + (1 - point.y) / 2 * box.height };
          }
        }
        if (!outputSize) {
          const ratio = renderer.getPixelRatio();
          overlay.width = Math.round(rect.width * ratio); overlay.height = Math.round(rect.height * ratio);
          const ctx = overlay.getContext("2d")!; ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
          drawStudyOverlay(ctx, rect.width, rect.height, detailMarker, flight.stage);
        }
        return;
      }
      draw(rect, { tilt: baseTilt + tilt, yaw: baseYaw + yaw }, [0, 0, 0], data.extent * 1.16, index);
    });
    renderer.setScissorTest(false);
    if (!outputSize) graphs?.draw(progress);
    if (!renderer.getContext().isContextLost()) renderedData = data;
  }
  const capture = {
    get ready() { return currentData !== null && renderedData === currentData && !loading && graphicsReady; },
    seek: (fraction: number) => { setPlaying(false); seek(fraction); render(); },
    focus: (index: number | null) => { focused = index !== null; selected = index ?? selected; resetCameras(); updateLayout(); render(); },
    get state() { return { progress, playing, selected, focused, loading, exporting, crystalId: currentEntry?.id, visible: currentData ? visibleEventCount(currentData.ticks, progress * currentData.finalTick) : 0, eventCount: currentData?.eventCount, sourceSha256: currentData?.sourceSha256, vertical: currentData?.vertical, geometries: renderer.info.memory.geometries, framing, paneAngles, journey: journey ? journeyPose(journey, progress) : null, statistics: currentData && graphs?.statistics ? recordingStatsAt(currentData, graphs.statistics, progress) : null, graphs: graphs?.visibleKinds }; },
  };
  if (query.has("capture")) (window as unknown as { dendriteStudy: typeof capture }).dendriteStudy = capture;
  installVideoExport({
    describe: () => {
      if (!currentData || !currentEntry || !graphs?.statistics || loading || !focused) throw new Error("Choose a crystal in the single view before exporting.");
      return { id: currentEntry.id, title: growthStudyLabel(currentEntry), style: names[selected]!, composed: currentEntry.source === "named-compose", data: currentData, statistics: graphs.statistics, graphs: graphs.visibleKinds };
    },
    begin: () => {
      exportSnapshot = { progress, playing, pixelRatio: renderer.getPixelRatio() };
      exporting = true; setPlaying(false); renderer.setPixelRatio(1);
    },
    frame: (frameWidth, frameHeight, at) => {
      if (!graphicsReady || disposed) throw new Error("Graphics were interrupted. Restore the view and try exporting again.");
      seek(at); render({ width: frameWidth, height: frameHeight });
      if (selected === 2) {
        if (exportCanvas.width !== frameWidth || exportCanvas.height !== frameHeight) { exportCanvas.width = frameWidth; exportCanvas.height = frameHeight; }
        const ctx = exportCanvas.getContext("2d")!; ctx.drawImage(canvas, 0, 0);
        drawStudyOverlay(ctx, frameWidth, frameHeight, detailMarker, journey ? journeyPose(journey, at).stage : undefined);
        return exportCanvas;
      }
      return canvas;
    },
    restore: () => {
      const snapshot = exportSnapshot; exportSnapshot = null; exporting = false;
      if (!snapshot || disposed) return;
      renderer.setPixelRatio(snapshot.pixelRatio); width = height = 0;
      seek(snapshot.progress); setPlaying(snapshot.playing && graphicsReady && !motion.matches);
      previous = performance.now(); render(); dirty = false;
    },
  });
  async function selectCrystal(entry: GrowthStudyEntry): Promise<void> {
    const version = ++loadVersion;
    pendingLoad?.abort();
    pendingLoad = new AbortController();
    loading = true;
    dirty = true;
    setPlaying(false);
    el<HTMLButtonElement>("export-mp4").disabled = el<HTMLButtonElement>("toggle-graphs").disabled = true;
    play.disabled = replay.disabled = timeline.disabled = true;
    el("retry").hidden = true;
    status.classList.remove("ready");
    status.textContent = `Loading ${growthStudyLabel(entry)}…`;
    graphs!.clear();
    overlay.getContext("2d")!.clearRect(0, 0, overlay.width, overlay.height);
    el("crystal-title").textContent = growthStudyLabel(entry);
    el("source").textContent = "";
    el("recording-kind").textContent = "";
    try {
      const data = await loadGrowthStudy(new URL(`./growth-studies/${entry.id}.bin`, document.baseURI), pendingLoad.signal);
      if (version !== loadVersion || disposed) return;
      if (data.sourceSha256 !== entry.sourceSha256 || data.eventCount !== entry.eventCount || data.finalTick !== entry.finalTick) throw new Error("The replay does not match the selected crystal.");
      const nextGeometry = new THREE.BufferGeometry();
      nextGeometry.setAttribute("position", new THREE.BufferAttribute(data.positions, 3));
      nextGeometry.setAttribute("attachTick", new THREE.BufferAttribute(data.ticks instanceof Float32Array ? data.ticks : new Float32Array(data.ticks), 1));
      nextGeometry.computeBoundingSphere();
      body.geometry = glow.geometry = nextGeometry;
      geometry.dispose();
      geometry = nextGeometry;
      currentData = data;
      currentEntry = entry;
      framing = studyFrame(data);
      journey = buildBranchJourney(data, framing);
      graphs!.setData(data, data.statistics, entry.source === "named-compose");
      uniforms.finalTick.value = data.finalTick;
      camera.far = data.extent * 12;
      camera.position.set(0, 0, data.extent * 5);
      resetCameras();
      seek(motion.matches ? 0.82 : 0);
      loading = false;
      if (document.querySelector<HTMLDialogElement>("#crystal-browser")!.open) {
        resumeAfterBrowse = !motion.matches;
        setPlaying(false);
      } else setPlaying(!motion.matches);
      play.disabled = replay.disabled = timeline.disabled = false;
      el<HTMLButtonElement>("export-mp4").disabled = el<HTMLButtonElement>("toggle-graphs").disabled = false;
      status.classList.add("ready");
      const composed = entry.source === "named-compose";
      el("recording-kind").textContent = composed ? "COMPOSED VIEW · Independently grown crystals, with recorded scene orientations and timing" : "DIRECT GROWTH · Recorded attachment history";
      el("source").textContent = composed
        ? `Source scene: ${entry.id} · ${data.eventCount.toLocaleString()} instanced attachment events · normalized scene timeline, with each component's recorded phase offset · scene SHA-256 ${data.sourceSha256}. The composition is not one solver state.`
        : `Source: ${entry.id} · ${data.eventCount.toLocaleString()} attachment events · ${data.finalTick.toLocaleString()} model ticks · stop: ${entry.terminationReason} · original SHA-256 ${data.sourceSha256}. Visual replay, not gate evidence.`;
    } catch (error) {
      if (version !== loadVersion || disposed) return;
      // Keep old GPU data hidden until a new load succeeds; never relabel the old crystal.
      status.textContent = `${error instanceof Error ? error.message : String(error)} Choose another crystal or retry.`;
      el("retry").hidden = false;
    }
  }
  function animate(now: number): void {
    if (disposed) return;
    const delta = Math.min((now - previous) / 1000, 0.1);
    previous = now;
    if (playing && !document.hidden && !loading && !exporting) {
      if (progress < 1) seek(progress + delta * Number(speed.value) / 22);
      else { hold += delta; if (hold > 3) seek(0); }
    }
    if (!document.hidden && dirty && !exporting) { render(); dirty = false; }
    frameId = requestAnimationFrame(animate);
  }
  canvas.addEventListener("webglcontextlost", event => {
    event.preventDefault(); setPlaying(false); graphicsReady = false; renderedData = null;
    status.textContent = "Graphics were interrupted. Restoring the view…";
    status.classList.remove("ready");
  });
  canvas.addEventListener("webglcontextrestored", () => {
    renderer.setClearColor(0x080d12);
    renderer.autoClear = false;
    graphicsReady = true;
    dirty = true;
    if (currentData && !loading) status.classList.add("ready");
  });
  addEventListener("pagehide", (event: PageTransitionEvent) => {
    if (event.persisted) return;
    disposed = true; cancelAnimationFrame(frameId);
    pendingLoad?.abort();
    geometry.dispose(); material.dispose(); haloMaterial.dispose(); sculpture.dispose(); renderer.dispose();
  });
  frameId = requestAnimationFrame(animate);
  await installGrowthPicker(selectCrystal, open => {
    if (open) { resumeAfterBrowse = playing; setPlaying(false); }
    else if (resumeAfterBrowse && !loading && !motion.matches) setPlaying(true);
  });
}

void start().catch((error: unknown) => {
  status.textContent = `${error instanceof Error ? error.message : String(error)} This study needs WebGL2. Try reloading in a current desktop browser.`;
  status.classList.remove("ready");
  setPlaying(false);
});
