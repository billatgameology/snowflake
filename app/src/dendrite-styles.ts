import * as THREE from "three";
import { visibleEventCount, type DendriteData } from "./dendrite-data.ts";
import { loadGrowthStudy } from "./growth-study-loader.ts";
import { installGrowthPicker } from "./growth-study-picker.ts";
import { growthStudyLabel, type GrowthStudyEntry } from "./growth-study-library.ts";
import { dendriteVertex, dendriteFragment } from "./dendrite-shaders.ts";
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
const names = ["Ion Bloom", "Timeglass", "Darkfield", "Chronograph"];
const motion = matchMedia("(prefers-reduced-motion: reduce)");
let playing = !motion.matches;
let selected = Math.max(0, Math.min(3, Math.floor(Number(query.get("style") ?? "1") || 0)));
let focused = query.get("focus") !== "0";
let progress = motion.matches ? 0.82 : 0;
let yaw = 0;
let tilt = 0;
let previous = performance.now();
let hold = 0;
let disposed = false;
let frameId = 0;
let dirty = true;
addEventListener("resize", () => { dirty = true; });
addEventListener("scroll", () => { dirty = true; }, { passive: true });
addEventListener("pageshow", () => { dirty = true; previous = performance.now(); });
document.addEventListener("input", () => { dirty = true; });
document.addEventListener("visibilitychange", () => { dirty = true; previous = performance.now(); });

function updateLayout(): void {
  dirty = true;
  document.body.classList.toggle("focused", focused);
  document.querySelector<HTMLElement>(".depth-control")!.hidden = !focused || selected !== 3;
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
  yaw = tilt = 0;
  updateLayout();
};
cards.forEach((card, index) => {
  card.querySelector("button")!.onclick = () => {
    selected = index;
    focused = true;
    yaw = tilt = 0;
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
  if (play.disabled) return;
  if (event.target instanceof HTMLInputElement || event.target instanceof HTMLSelectElement || event.target instanceof HTMLButtonElement || event.target instanceof HTMLDetailsElement) return;
  if (event.code === "Space") { event.preventDefault(); setPlaying(!playing); }
  if (event.code === "KeyR") { seek(0); setPlaying(true); }
  if (event.code === "Escape") { focused = false; updateLayout(); }
});
motion.addEventListener("change", () => { if (motion.matches) setPlaying(false); });
for (const viewport of views) {
  let pointer: { x: number; y: number } | undefined;
  viewport.onpointerdown = event => {
    if (!focused) return;
    pointer = { x: event.clientX, y: event.clientY };
    dirty = true;
    viewport.setPointerCapture(event.pointerId);
  };
  viewport.onpointermove = event => {
    if (!pointer) return;
    yaw += (event.clientX - pointer.x) * 0.006;
    tilt = Math.max(-1.2, Math.min(1.2, tilt + (event.clientY - pointer.y) * 0.006));
    pointer = { x: event.clientX, y: event.clientY };
    dirty = true;
  };
  viewport.onpointerup = viewport.onpointercancel = () => { pointer = undefined; };
  viewport.ondblclick = () => { yaw = tilt = 0; dirty = true; };
}
updateLayout();
setPlaying(playing);

async function start(): Promise<void> {
  const canvas = el<HTMLCanvasElement>("crystal-canvas");
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance", preserveDrawingBuffer: query.has("capture") });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.setClearColor(0x080d12);
  renderer.autoClear = false;
  let currentData: DendriteData | null = null;
  let currentEntry: GrowthStudyEntry | null = null;
  let geometry = new THREE.BufferGeometry();
  let loadVersion = 0;
  let pendingLoad: AbortController | null = null;
  let loading = true;
  let graphicsReady = true;
  let renderedData: DendriteData | null = null;
  const uniforms = {
    playhead: { value: 0 }, finalTick: { value: 1 },
    pixelsPerUnit: { value: 1 }, style: { value: 0 }, halo: { value: 0 },
    strength: { value: 1.2 }, spread: { value: 1 },
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
  function render(): void {
    if (!graphicsReady) return;
    if (width !== innerWidth || height !== innerHeight) {
      width = innerWidth; height = innerHeight;
      renderer.setSize(width, height, false);
    }
    renderer.setScissorTest(false);
    renderer.clear();
    const data = currentData;
    if (data === null || loading) return;
    geometry.setDrawRange(0, visibleEventCount(data.ticks, progress * data.finalTick));
    uniforms.playhead.value = progress * data.finalTick;
    const depthFraction = Number(el<HTMLInputElement>("depth").value) / 100;
    uniforms.spread.value = data.extent * 1.5 * depthFraction;
    renderer.setScissorTest(true);
    views.forEach((viewport, index) => {
      if (focused && selected !== index) return;
      const rect = viewport.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > height || rect.width === 0) return;
      const aspect = rect.width / rect.height;
      const extent = data.extent * (index === 3 ? 1 + 0.75 * depthFraction : 1) * 1.16 / Math.min(aspect, 1);
      camera.left = -extent * aspect;
      camera.right = extent * aspect;
      camera.top = extent;
      camera.bottom = -extent;
      camera.updateProjectionMatrix();
      const baseTilt = data.vertical ? Math.PI / 2 : index === 3 ? 0.65 : 0;
      group.rotation.set(baseTilt + tilt, index === 3 ? -0.12 : 0, Math.PI / 6 + yaw);
      uniforms.style.value = index;
      uniforms.pixelsPerUnit.value = rect.height / (extent * 2) * renderer.getPixelRatio();
      renderer.setViewport(rect.left, height - rect.bottom, rect.width, rect.height);
      renderer.setScissor(rect.left, Math.max(0, height - rect.bottom), rect.width, Math.min(height, rect.bottom) - Math.max(0, rect.top));
      renderer.render(scene, camera);
    });
    renderer.setScissorTest(false);
    if (!renderer.getContext().isContextLost()) renderedData = data;
  }
  const capture = {
    get ready() { return currentData !== null && renderedData === currentData && !loading && graphicsReady; },
    seek: (fraction: number) => { setPlaying(false); seek(fraction); render(); },
    focus: (index: number | null) => { focused = index !== null; selected = index ?? selected; yaw = tilt = 0; updateLayout(); render(); },
    get state() { return { progress, playing, selected, focused, loading, crystalId: currentEntry?.id, visible: currentData ? visibleEventCount(currentData.ticks, progress * currentData.finalTick) : 0, eventCount: currentData?.eventCount, sourceSha256: currentData?.sourceSha256, vertical: currentData?.vertical, geometries: renderer.info.memory.geometries }; },
  };
  if (query.has("capture")) (window as unknown as { dendriteStudy: typeof capture }).dendriteStudy = capture;
  async function selectCrystal(entry: GrowthStudyEntry): Promise<void> {
    const version = ++loadVersion;
    pendingLoad?.abort();
    pendingLoad = new AbortController();
    loading = true;
    dirty = true;
    setPlaying(false);
    play.disabled = replay.disabled = timeline.disabled = true;
    el("retry").hidden = true;
    status.classList.remove("ready");
    status.textContent = `Loading ${growthStudyLabel(entry)}…`;
    el("crystal-title").textContent = growthStudyLabel(entry);
    el("source").textContent = "";
    try {
      const data = await loadGrowthStudy(new URL(`./growth-studies/${entry.id}.bin`, document.baseURI), pendingLoad.signal);
      if (version !== loadVersion || disposed) return;
      if (data.sourceSha256 !== entry.sourceSha256 || data.eventCount !== entry.eventCount || data.finalTick !== entry.finalTick) throw new Error("The replay does not match the selected crystal.");
      const nextGeometry = new THREE.BufferGeometry();
      nextGeometry.setAttribute("position", new THREE.BufferAttribute(data.positions, 3));
      nextGeometry.setAttribute("attachTick", new THREE.BufferAttribute(data.ticks, 1));
      nextGeometry.computeBoundingSphere();
      body.geometry = glow.geometry = nextGeometry;
      geometry.dispose();
      geometry = nextGeometry;
      currentData = data;
      currentEntry = entry;
      uniforms.finalTick.value = data.finalTick;
      camera.far = data.extent * 12;
      camera.position.set(0, 0, data.extent * 5);
      yaw = tilt = 0;
      seek(motion.matches ? 0.82 : 0);
      loading = false;
      setPlaying(!motion.matches);
      play.disabled = replay.disabled = timeline.disabled = false;
      status.classList.add("ready");
      el("source").textContent = `Source: ${entry.id} · ${data.eventCount.toLocaleString()} attachment events · ${data.finalTick.toLocaleString()} model ticks · stop: ${entry.terminationReason} · original SHA-256 ${data.sourceSha256}. Visual replay, not gate evidence.`;
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
    if (playing && !document.hidden && !loading) {
      if (progress < 1) seek(progress + delta * Number(speed.value) / 22);
      else { hold += delta; if (hold > 3) seek(0); }
    }
    if (!document.hidden && dirty) { render(); dirty = false; }
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
    geometry.dispose(); material.dispose(); haloMaterial.dispose(); renderer.dispose();
  });
  frameId = requestAnimationFrame(animate);
  await installGrowthPicker(selectCrystal);
}

void start().catch((error: unknown) => {
  status.textContent = `${error instanceof Error ? error.message : String(error)} This study needs WebGL2. Try reloading in a current desktop browser.`;
  status.classList.remove("ready");
  setPlaying(false);
});
