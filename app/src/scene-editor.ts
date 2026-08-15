// Keyframe editor for gutcheck-scene-v1 (maker-directed, 2026-08-06: "select a tick location
// ... pause, manually adjust to how i like it, you remember the position, rotation").
//
// Enabled with ?edit=1 in timeline mode. The editor does NOT invent a format: it authors the
// exact JSON that app/scripts/scene-capture.mjs already renders to mp4, so the output drops
// straight into the existing pipeline:
//
//   node app/scripts/scene-capture.mjs --scene <exported.json> --out-dir <dir> --mp4 out.mp4
//
// The scene camera is a three-parameter orbit about the origin — tilt (elevation), yaw
// (rotation about Z), zoom — and the player rebuilds the camera from those three numbers
// alone. Capturing a pose therefore means inverting that construction out of the live
// OrbitControls camera, not storing a matrix. See poseFromCamera below.
//
// `crystal` is an additive optional track (roll about Z, the same axis the spin/upright
// buttons drive). Scenes without it behave exactly as before, so existing v1 files and the
// capture runner's `format === "gutcheck-scene-v1"` check are both unaffected.

import * as THREE from "three";

export interface CameraKey {
  t: number;
  tilt: number;
  yaw: number;
  zoom: number;
  ease?: "linear" | "inOutCubic";
}
export interface FrameKey {
  t: number;
  frame: number;
}
export interface CrystalKey {
  t: number;
  roll: number;
  ease?: "linear" | "inOutCubic";
}

export interface SceneDraft {
  format: "gutcheck-scene-v1";
  title: string;
  look: string;
  frameExtent: number;
  duration: number;
  fps: number;
  source: { manifest: string };
  frames: FrameKey[];
  camera: CameraKey[];
  crystal?: CrystalKey[];
  captions: Array<{ t0: number; t1: number; text: string }>;
}

export interface SceneEditorHost {
  camera: THREE.OrthographicCamera;
  group: THREE.Group;
  /** Frame index currently displayed. */
  currentFrame: () => number;
  /** Jump the timeline to a frame index (awaits the fetch). */
  showFrame: (index: number) => Promise<void>;
  frameCount: number;
  look: string;
  frameExtent: number;
  /** Manifest URL as the scene should record it. */
  manifestUrl: string;
  /** Stop any running playback/spin before the editor drives the scene itself. */
  pausePlayback: () => void;
  render: () => void;
  /**
   * Height in px of the chrome pinned to the bottom of the window (this panel plus the
   * viewer's own control bar). The caption preview sits just above it; a hardcoded offset
   * landed the text on top of the control bar.
   */
  occludedBottom: () => number;
}

/**
 * Invert the scene player's camera construction. The player places the camera at
 * (0, sin(tilt)·d, cos(tilt)·d) rotated by `yaw` about Z, so:
 *   z = cos(tilt)·d      -> tilt = acos(z / d)
 *   (x, y) = sin(tilt)·d · (−sin(yaw), cos(yaw))   -> yaw = atan2(−x, y)
 * Pan is not representable (the player always looks at the origin); the editor disables it.
 */
export function poseFromCamera(camera: THREE.OrthographicCamera): {
  tilt: number;
  yaw: number;
  zoom: number;
} {
  const p = camera.position;
  const d = p.length() || 1;
  const tilt = (Math.acos(THREE.MathUtils.clamp(p.z / d, -1, 1)) * 180) / Math.PI;
  // At tilt 0 the camera sits on +Z and yaw is degenerate; keep the previous value's sign
  // stable by reporting 0 rather than a value derived from float noise.
  const horizontal = Math.hypot(p.x, p.y);
  const yaw = horizontal < 1e-6 ? 0 : (Math.atan2(-p.x, p.y) * 180) / Math.PI;
  return {
    tilt: round(tilt),
    yaw: round(yaw),
    zoom: round(camera.zoom),
  };
}

const round = (n: number): number => Math.round(n * 1000) / 1000;
const clamp = (n: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, n));

/** Sort by time and drop an older key at the same instant, so a re-capture overwrites. */
function upsert<T extends { t: number }>(track: T[], key: T): T[] {
  const kept = track.filter((k) => Math.abs(k.t - key.t) > 1e-6);
  kept.push(key);
  kept.sort((a, b) => a.t - b.t);
  return kept;
}

function button(text: string, title?: string): HTMLButtonElement {
  const b = document.createElement("button");
  b.type = "button";
  b.textContent = text;
  if (title !== undefined) b.title = title;
  b.style.cssText =
    "background:#233250;color:#dfe7f4;border:1px solid #3a4c72;border-radius:4px;" +
    "padding:4px 9px;cursor:pointer;font:inherit";
  return b;
}

function numberField(value: number, width = "58px"): HTMLInputElement {
  const input = document.createElement("input");
  input.type = "number";
  input.value = String(value);
  input.style.cssText =
    `width:${width};background:#16203a;color:#dfe7f4;border:1px solid #3a4c72;` +
    "border-radius:4px;padding:3px 5px;font:inherit";
  return input;
}

/**
 * The scene is authored against a dev-server `/@fs/...` manifest URL, but it is *rendered* by
 * scene-capture.mjs against the built static site, where the same data sits at
 * `../data/<group>/manifest.json` (see app/scenes/growth-B-intro.json). Exporting the dev URL
 * would produce a scene that previews here and 404s in the capture run, so default to the
 * site-relative form and leave it editable.
 */
export function siteRelativeManifest(url: string): string {
  const parts = decodeURIComponent(url).split("/").filter((s) => s.length > 0);
  const file = parts[parts.length - 1] ?? "manifest.json";
  const group = parts[parts.length - 2];
  return group === undefined ? `../data/${file}` : `../data/${group}/${file}`;
}

/** Returns the panel element so the caller can lift the viewer's own control bar clear of it. */
export function createSceneEditor(host: SceneEditorHost): HTMLElement {
  const draft: SceneDraft = {
    format: "gutcheck-scene-v1",
    title: "Untitled scene",
    look: host.look,
    frameExtent: host.frameExtent,
    duration: 16,
    fps: 30,
    source: { manifest: siteRelativeManifest(host.manifestUrl) },
    frames: [],
    camera: [],
    captions: [],
  };
  let crystal: CrystalKey[] = [];
  let playhead = 0;
  let previewing = false;
  let previewRaf = 0;

  // ── Panel ──────────────────────────────────────────────────────────────────────────
  const panel = document.createElement("div");
  panel.style.cssText =
    "position:fixed;left:0;right:0;bottom:0;z-index:20;padding:10px 14px;" +
    "background:rgba(8,12,22,0.93);border-top:1px solid #33476e;color:#dfe7f4;" +
    "font:12.5px/1.45 ui-monospace,monospace;display:flex;flex-direction:column;gap:8px";

  const row1 = document.createElement("div");
  row1.style.cssText = "display:flex;gap:8px;align-items:center;flex-wrap:wrap";
  const title = document.createElement("input");
  title.value = draft.title;
  title.style.cssText =
    "width:190px;background:#16203a;color:#dfe7f4;border:1px solid #3a4c72;" +
    "border-radius:4px;padding:3px 6px;font:inherit";
  title.addEventListener("input", () => (draft.title = title.value));
  const durationField = numberField(draft.duration);
  const fpsField = numberField(draft.fps, "48px");
  const playPreview = button("preview", "play the scene as authored");
  const addCamera = button("+ camera", "record the current view at the playhead");
  const addFrame = button("+ frame", "pin the current growth frame to the playhead");
  const addCrystal = button("+ crystal", "record the crystal's own rotation at the playhead");
  const captionText = document.createElement("input");
  captionText.placeholder = "caption text";
  captionText.style.cssText =
    "width:250px;background:#16203a;color:#dfe7f4;border:1px solid #3a4c72;" +
    "border-radius:4px;padding:3px 6px;font:inherit";
  const addCaption = button("+ caption", "add a caption starting at the playhead");
  const setOut = button("set out", "end the selected caption at the playhead");
  const exportButton = button("export .json", "download a scene the capture runner can render");
  const copyButton = button("copy");
  const importLabel = document.createElement("label");
  importLabel.textContent = "import";
  importLabel.style.cssText =
    "background:#233250;border:1px solid #3a4c72;border-radius:4px;padding:4px 9px;cursor:pointer";
  const importInput = document.createElement("input");
  importInput.type = "file";
  importInput.accept = "application/json,.json";
  importInput.style.display = "none";
  importLabel.appendChild(importInput);

  const tag = (text: string): HTMLSpanElement => {
    const s = document.createElement("span");
    s.textContent = text;
    s.style.color = "#93a5c4";
    return s;
  };
  // Editable because the render-time path differs from the authoring path (see
  // siteRelativeManifest) and only the person running the capture knows their layout.
  const manifestField = document.createElement("input");
  manifestField.value = draft.source.manifest;
  manifestField.title = "manifest path as the capture runner will see it";
  manifestField.style.cssText =
    "width:230px;background:#16203a;color:#dfe7f4;border:1px solid #3a4c72;" +
    "border-radius:4px;padding:3px 6px;font:inherit";
  manifestField.addEventListener("input", () => (draft.source.manifest = manifestField.value));

  row1.append(
    tag("scene"), title,
    tag("dur"), durationField, tag("s"),
    tag("fps"), fpsField,
    tag("manifest"), manifestField,
    playPreview, addCamera, addFrame, addCrystal,
    captionText, addCaption, setOut,
    exportButton, copyButton, importLabel,
  );

  // ── Timeline strip ─────────────────────────────────────────────────────────────────
  const strip = document.createElement("div");
  strip.style.cssText =
    "position:relative;height:76px;background:#111a2e;border:1px solid #2a3a58;" +
    "border-radius:5px;cursor:pointer;user-select:none";

  // Lane labels sit in a fixed gutter and the tracks are inset from both edges, so a marker
  // at t=0 does not land on top of its label and one at t=duration is not half off-panel
  // (both markers are centred on their time with translateX(-50%)).
  // Wide enough that a marker at t=0, centred on the track's left edge, still clears the label.
  const GUTTER_LEFT = 78;
  const GUTTER_RIGHT = 26;
  const laneLabels = ["camera", "frame", "crystal", "caption"];
  laneLabels.forEach((name, i) => {
    const text = document.createElement("span");
    text.textContent = name;
    text.style.cssText =
      `position:absolute;left:6px;top:${String(5 + i * 18)}px;color:#5f7095;` +
      "font-size:10.5px;pointer-events:none;z-index:4";
    strip.appendChild(text);
  });

  // Everything time-positioned lives in here, so percentages map to the track area only.
  const trackArea = document.createElement("div");
  trackArea.style.cssText =
    `position:absolute;left:${String(GUTTER_LEFT)}px;right:${String(GUTTER_RIGHT)}px;` +
    "top:0;bottom:0";
  strip.appendChild(trackArea);

  const playheadEl = document.createElement("div");
  playheadEl.style.cssText =
    "position:absolute;top:0;bottom:0;width:2px;background:#ffd98f;pointer-events:none;z-index:3";
  trackArea.appendChild(playheadEl);

  const lanes = laneLabels.map((_name, i) => {
    const lane = document.createElement("div");
    lane.style.cssText =
      `position:absolute;left:0;right:0;top:${String(4 + i * 18)}px;height:16px;`;
    trackArea.appendChild(lane);
    return lane;
  });

  const status = document.createElement("div");
  status.style.cssText = "color:#93a5c4;display:flex;gap:14px;flex-wrap:wrap";

  // Mirrors the caption element the scene player creates, so scrubbing and preview show the
  // caption exactly where the rendered video will put it. Sits above the panel, not in it.
  const captionOverlay = document.createElement("div");
  captionOverlay.style.cssText =
    "position:fixed;left:0;right:0;text-align:center;color:#f3f6fc;" +
    "font:20px/1.5 system-ui,sans-serif;text-shadow:0 1px 8px rgba(6,10,20,0.85);" +
    "pointer-events:none;padding:0 10vw;z-index:19";
  document.body.appendChild(captionOverlay);
  const captionAt = (t: number): string =>
    draft.captions.find((c) => t >= c.t0 && t < c.t1)?.text ?? "";

  panel.append(row1, strip, status);
  document.body.appendChild(panel);

  // ── Rendering the strip ────────────────────────────────────────────────────────────
  const pct = (t: number): number => (draft.duration <= 0 ? 0 : (t / draft.duration) * 100);

  // Lane 3 is captions, which are spans rather than instants and so are drawn and dragged
  // separately from the point-keyframe lanes.
  let selected: { lane: 0 | 1 | 2 | 3; index: number } | null = null;
  // Which caption the text field is *editing*, as opposed to composing a new one. Without
  // this the field rewrites whichever caption was last added, so typing the second caption's
  // text silently overwrote the first.
  let captionEditIndex: number | null = null;

  const marker = (lane: 0 | 1 | 2, index: number, t: number, label: string): HTMLElement => {
    const m = document.createElement("div");
    const isSel = selected?.lane === lane && selected.index === index;
    m.textContent = label;
    m.style.cssText =
      `position:absolute;left:${String(pct(t))}%;top:0;transform:translateX(-50%);` +
      `background:${isSel ? "#ffd98f" : "#2f4f8a"};color:${isSel ? "#101828" : "#cfe0ff"};` +
      "border:1px solid #4a628f;border-radius:3px;padding:0 4px;font-size:10.5px;" +
      "white-space:nowrap;cursor:grab;z-index:2";
    return m;
  };

  const redraw = (): void => {
    for (const lane of lanes) {
      for (const child of [...lane.children]) {
        if (child instanceof HTMLElement && child.dataset["marker"] === "1") child.remove();
      }
    }
    draft.camera.forEach((k, i) => {
      const m = marker(0, i, k.t, `${k.t.toFixed(2)}s`);
      m.dataset["marker"] = "1";
      m.title = `tilt ${String(k.tilt)}° yaw ${String(k.yaw)}° zoom ${String(k.zoom)}`;
      attachMarker(m, 0, i);
      lanes[0]!.appendChild(m);
    });
    draft.frames.forEach((k, i) => {
      const m = marker(1, i, k.t, `f${String(k.frame)}`);
      m.dataset["marker"] = "1";
      m.title = `${k.t.toFixed(2)}s -> frame ${String(k.frame)}`;
      attachMarker(m, 1, i);
      lanes[1]!.appendChild(m);
    });
    crystal.forEach((k, i) => {
      const m = marker(2, i, k.t, `${String(Math.round((k.roll * 180) / Math.PI))}°`);
      m.dataset["marker"] = "1";
      m.title = `${k.t.toFixed(2)}s -> roll ${String(round((k.roll * 180) / Math.PI))}°`;
      attachMarker(m, 2, i);
      lanes[2]!.appendChild(m);
    });
    draft.captions.forEach((c, i) => {
      const isSel = selected?.lane === 3 && selected.index === i;
      const bar = document.createElement("div");
      bar.dataset["marker"] = "1";
      bar.textContent = c.text;
      const left = pct(Math.min(c.t0, c.t1));
      const width = Math.max(pct(Math.abs(c.t1 - c.t0)), 1.2);
      bar.style.cssText =
        `position:absolute;left:${String(left)}%;width:${String(width)}%;top:0;height:15px;` +
        `background:${isSel ? "#ffd98f" : "#3c5a3f"};color:${isSel ? "#101828" : "#d6ecd8"};` +
        "border:1px solid #557a5a;border-radius:3px;padding:0 4px;font-size:10.5px;" +
        "overflow:hidden;text-overflow:ellipsis;white-space:nowrap;cursor:grab;" +
        "box-sizing:border-box;z-index:2";
      bar.title = `${c.t0.toFixed(2)}–${c.t1.toFixed(2)}s: ${c.text}`;
      attachCaption(bar, i);
      lanes[3]!.appendChild(bar);
    });
    playheadEl.style.left = `${String(pct(playhead))}%`;
    captionOverlay.textContent = captionAt(playhead);
    captionOverlay.style.bottom = `${String(host.occludedBottom() + 16)}px`;
    const pose = poseFromCamera(host.camera);
    status.textContent =
      `t ${playhead.toFixed(2)}s / ${draft.duration.toFixed(2)}s · ` +
      `frame ${String(host.currentFrame())}/${String(host.frameCount - 1)} · ` +
      `view tilt ${String(pose.tilt)}° yaw ${String(pose.yaw)}° zoom ${String(pose.zoom)} · ` +
      `roll ${String(round((host.group.rotation.z * 180) / Math.PI))}° · ` +
      `keys ${String(draft.camera.length)}c ${String(draft.frames.length)}f ` +
      `${String(crystal.length)}r ${String(draft.captions.length)}cap` +
      (selected === null ? " · (click a marker to select, Delete removes)" : " · Delete removes selected");
  };

  /** Captions drag as a whole span (both ends together); "set out" adjusts t1 precisely. */
  function attachCaption(el: HTMLElement, index: number): void {
    el.addEventListener("pointerdown", (event) => {
      event.stopPropagation();
      event.preventDefault();
      selected = { lane: 3, index };
      // Selecting a caption binds the field to it, so edits go where the user is looking.
      captionEditIndex = index;
      captionText.value = draft.captions[index]!.text;
      const startX = event.clientX;
      const rect = trackArea.getBoundingClientRect();
      const c = draft.captions[index]!;
      const span = c.t1 - c.t0;
      const startT0 = c.t0;
      el.setPointerCapture(event.pointerId);
      const move = (e: PointerEvent): void => {
        const dt = ((e.clientX - startX) / rect.width) * draft.duration;
        c.t0 = round(clamp(startT0 + dt, 0, Math.max(0, draft.duration - span)));
        c.t1 = round(c.t0 + span);
        redraw();
      };
      const up = (): void => {
        el.releasePointerCapture(event.pointerId);
        el.removeEventListener("pointermove", move);
        draft.captions.sort((a, b) => a.t0 - b.t0);
        redraw();
      };
      el.addEventListener("pointermove", move);
      el.addEventListener("pointerup", up, { once: true });
    });
  }

  // ── Marker drag / select ───────────────────────────────────────────────────────────
  function attachMarker(el: HTMLElement, lane: 0 | 1 | 2, index: number): void {
    el.addEventListener("pointerdown", (event) => {
      event.stopPropagation();
      event.preventDefault();
      selected = { lane, index };
      const startX = event.clientX;
      const rect = trackArea.getBoundingClientRect();
      const track = lane === 0 ? draft.camera : lane === 1 ? draft.frames : crystal;
      const startT = track[index]!.t;
      el.setPointerCapture(event.pointerId);
      const move = (e: PointerEvent): void => {
        const dt = ((e.clientX - startX) / rect.width) * draft.duration;
        track[index]!.t = round(clamp(startT + dt, 0, draft.duration));
        redraw();
      };
      const up = (): void => {
        el.releasePointerCapture(event.pointerId);
        el.removeEventListener("pointermove", move);
        // Re-sort after a drag so interpolation stays monotonic in time.
        track.sort((a, b) => a.t - b.t);
        selected = null;
        redraw();
      };
      el.addEventListener("pointermove", move);
      el.addEventListener("pointerup", up, { once: true });
    });
  }

  // ── Scrubbing ──────────────────────────────────────────────────────────────────────
  const seekTo = (t: number): void => {
    playhead = round(clamp(t, 0, draft.duration));
    // Scrubbing shows the growth frame this scene would show, so the timeline reads as the
    // finished video rather than as whatever frame happened to be loaded.
    if (draft.frames.length > 0) {
      const target = frameAtTime(draft.frames, playhead);
      if (target !== host.currentFrame()) void host.showFrame(target).then(redraw);
    }
    redraw();
  };

  strip.addEventListener("pointerdown", (event) => {
    // Measure against the track, not the strip, or clicks land off by the gutter width.
    const rect = trackArea.getBoundingClientRect();
    seekTo(((event.clientX - rect.left) / rect.width) * draft.duration);
  });

  durationField.addEventListener("change", () => {
    const next = Number(durationField.value);
    if (Number.isFinite(next) && next > 0) {
      draft.duration = next;
      playhead = Math.min(playhead, next);
    } else {
      durationField.value = String(draft.duration);
    }
    redraw();
  });
  fpsField.addEventListener("change", () => {
    const next = Number(fpsField.value);
    if (Number.isFinite(next) && next > 0) draft.fps = Math.round(next);
    else fpsField.value = String(draft.fps);
  });

  // ── Capture buttons ────────────────────────────────────────────────────────────────
  addCamera.addEventListener("click", () => {
    const pose = poseFromCamera(host.camera);
    draft.camera = upsert(draft.camera, { t: playhead, ...pose });
    redraw();
  });
  addFrame.addEventListener("click", () => {
    draft.frames = upsert(draft.frames, { t: playhead, frame: host.currentFrame() });
    redraw();
  });
  addCrystal.addEventListener("click", () => {
    crystal = upsert(crystal, { t: playhead, roll: round(host.group.rotation.z) });
    redraw();
  });
  addCaption.addEventListener("click", () => {
    const text = captionText.value.trim();
    if (text === "") {
      captionText.focus();
      return;
    }
    // Default to a 3 s span, clipped to the end of the scene; "set out" refines it.
    const t0 = playhead;
    const t1 = round(Math.min(playhead + 3, draft.duration));
    if (t1 <= t0) return;
    const added = { t0: round(t0), t1, text };
    draft.captions.push(added);
    draft.captions.sort((a, b) => a.t0 - b.t0);
    // Stay selected so "set out" applies to what was just added, but unbind the text field
    // and clear it — the next thing typed is a new caption, not an edit of this one.
    selected = { lane: 3, index: draft.captions.indexOf(added) };
    captionEditIndex = null;
    captionText.value = "";
    redraw();
  });
  setOut.addEventListener("click", () => {
    if (selected?.lane !== 3) return;
    const c = draft.captions[selected.index];
    if (c === undefined) return;
    if (playhead <= c.t0) return; // an end before the start would render as never shown
    c.t1 = round(playhead);
    redraw();
  });
  captionText.addEventListener("input", () => {
    if (captionEditIndex === null) return;
    const c = draft.captions[captionEditIndex];
    if (c !== undefined) {
      c.text = captionText.value;
      redraw();
    }
  });

  window.addEventListener("keydown", (event) => {
    if (event.key !== "Delete" && event.key !== "Backspace") return;
    if (document.activeElement instanceof HTMLInputElement) return;
    if (selected === null) return;
    const { lane, index } = selected;
    if (lane === 0) draft.camera.splice(index, 1);
    else if (lane === 1) draft.frames.splice(index, 1);
    else if (lane === 2) crystal.splice(index, 1);
    else {
      draft.captions.splice(index, 1);
      // Indices shifted; a stale binding would retarget edits at the wrong caption.
      captionEditIndex = null;
      captionText.value = "";
    }
    selected = null;
    event.preventDefault();
    redraw();
  });

  // ── Preview ────────────────────────────────────────────────────────────────────────
  playPreview.addEventListener("click", () => {
    previewing = !previewing;
    playPreview.textContent = previewing ? "stop" : "preview";
    if (!previewing) {
      cancelAnimationFrame(previewRaf);
      return;
    }
    host.pausePlayback();
    const startWall = performance.now();
    const startT = playhead >= draft.duration ? 0 : playhead;
    const step = (): void => {
      if (!previewing) return;
      const t = startT + (performance.now() - startWall) / 1000;
      if (t >= draft.duration) {
        previewing = false;
        playPreview.textContent = "preview";
        seekTo(draft.duration);
        return;
      }
      applyAt(t);
      previewRaf = requestAnimationFrame(step);
    };
    previewRaf = requestAnimationFrame(step);
  });

  /** Apply the authored tracks at time t — the same interpolation the player uses. */
  const applyAt = (t: number): void => {
    playhead = t;
    if (draft.frames.length > 0) {
      const target = frameAtTime(draft.frames, t);
      if (target !== host.currentFrame()) void host.showFrame(target);
    }
    if (draft.camera.length > 0) {
      const cam = sampleCamera(draft.camera, t);
      applyPose(host.camera, cam);
    }
    if (crystal.length > 0) host.group.rotation.z = sampleRoll(crystal, t);
    host.render();
    redraw();
  };

  // ── Export ─────────────────────────────────────────────────────────────────────────
  const buildScene = (): SceneDraft => ({
    ...draft,
    camera: [...draft.camera].sort((a, b) => a.t - b.t),
    frames: [...draft.frames].sort((a, b) => a.t - b.t),
    ...(crystal.length > 0 && { crystal: [...crystal].sort((a, b) => a.t - b.t) }),
  });

  exportButton.addEventListener("click", () => {
    const json = JSON.stringify(buildScene(), null, 1);
    const blob = new Blob([json], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${draft.title.replace(/[^\w.-]+/g, "-").toLowerCase() || "scene"}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  });

  copyButton.addEventListener("click", () => {
    void navigator.clipboard.writeText(JSON.stringify(buildScene(), null, 1)).then(
      () => {
        copyButton.textContent = "copied";
        setTimeout(() => (copyButton.textContent = "copy"), 1200);
      },
      () => {
        copyButton.textContent = "denied";
        setTimeout(() => (copyButton.textContent = "copy"), 1200);
      },
    );
  });

  importInput.addEventListener("change", () => {
    const file = importInput.files?.[0];
    if (file === undefined) return;
    void file.text().then((text) => {
      try {
        const loaded = JSON.parse(text) as Partial<SceneDraft>;
        if (loaded.format !== "gutcheck-scene-v1") throw new Error("not a gutcheck-scene-v1 file");
        draft.title = loaded.title ?? draft.title;
        draft.duration = loaded.duration ?? draft.duration;
        draft.fps = loaded.fps ?? draft.fps;
        draft.camera = loaded.camera ?? [];
        draft.frames = loaded.frames ?? [];
        draft.captions = loaded.captions ?? [];
        crystal = loaded.crystal ?? [];
        if (loaded.source?.manifest !== undefined) draft.source.manifest = loaded.source.manifest;
        title.value = draft.title;
        durationField.value = String(draft.duration);
        fpsField.value = String(draft.fps);
        manifestField.value = draft.source.manifest;
        playhead = 0;
        redraw();
      } catch (error) {
        status.textContent = `import failed: ${error instanceof Error ? error.message : "bad file"}`;
      }
    });
    importInput.value = "";
  });

  redraw();
  // The status line shows the live view numbers, so keep it current while the user orbits.
  const tick = (): void => {
    if (!previewing) redraw();
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
  return panel;
}

// ── Interpolation, matching the player in spike-gg-realism.ts ────────────────────────

const easeInOutCubic = (t: number): number =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

export function frameAtTime(track: FrameKey[], t: number): number {
  if (track.length === 0) return 0;
  if (t <= track[0]!.t) return track[0]!.frame;
  for (let i = 1; i < track.length; i++) {
    const a = track[i - 1]!;
    const b = track[i]!;
    if (t <= b.t) {
      const k = b.t === a.t ? 1 : (t - a.t) / (b.t - a.t);
      return Math.round(a.frame + (b.frame - a.frame) * k);
    }
  }
  return track[track.length - 1]!.frame;
}

function sampleCamera(track: CameraKey[], t: number): { tilt: number; yaw: number; zoom: number } {
  if (t <= track[0]!.t) return track[0]!;
  for (let i = 1; i < track.length; i++) {
    const a = track[i - 1]!;
    const b = track[i]!;
    if (t <= b.t) {
      const raw = b.t === a.t ? 1 : (t - a.t) / (b.t - a.t);
      const k = (b.ease ?? "inOutCubic") === "linear" ? raw : easeInOutCubic(raw);
      return {
        tilt: a.tilt + (b.tilt - a.tilt) * k,
        yaw: a.yaw + (b.yaw - a.yaw) * k,
        zoom: a.zoom + (b.zoom - a.zoom) * k,
      };
    }
  }
  return track[track.length - 1]!;
}

function sampleRoll(track: CrystalKey[], t: number): number {
  if (t <= track[0]!.t) return track[0]!.roll;
  for (let i = 1; i < track.length; i++) {
    const a = track[i - 1]!;
    const b = track[i]!;
    if (t <= b.t) {
      const raw = b.t === a.t ? 1 : (t - a.t) / (b.t - a.t);
      const k = (b.ease ?? "inOutCubic") === "linear" ? raw : easeInOutCubic(raw);
      return a.roll + (b.roll - a.roll) * k;
    }
  }
  return track[track.length - 1]!.roll;
}

/** Place the camera exactly as the scene player does, so preview matches capture. */
export function applyPose(
  camera: THREE.OrthographicCamera,
  pose: { tilt: number; yaw: number; zoom: number },
): void {
  const dist = camera.position.length() || 1;
  const tiltRad = (pose.tilt * Math.PI) / 180;
  const yawRad = (pose.yaw * Math.PI) / 180;
  const arc = new THREE.Vector3(0, Math.sin(tiltRad) * dist, Math.cos(tiltRad) * dist);
  arc.applyAxisAngle(new THREE.Vector3(0, 0, 1), yawRad);
  camera.position.copy(arc);
  camera.up.set(0, 1, 0).applyAxisAngle(new THREE.Vector3(0, 0, 1), yawRad);
  camera.lookAt(0, 0, 0);
  camera.zoom = pose.zoom;
  camera.updateProjectionMatrix();
}
