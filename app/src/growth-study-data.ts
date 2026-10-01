import { Euler, Matrix4, Quaternion, Vector3 } from "three";
import { readDendrite, type DendriteData } from "./dendrite-data.ts";

export interface StudyComponent {
  asset: number;
  transform: { translate: number[]; rotateDegrees: number[]; scale: number };
  phaseOffset: number;
}
export interface StudySceneHeader {
  format: "growth-study-scene-v1";
  sourceSha256: string;
  assets: number[];
  components: StudyComponent[];
  camera: { tiltDegrees: number; yawDegrees: number };
}

const adjacentBuffer = new ArrayBuffer(8);
const adjacentView = new DataView(adjacentBuffer);
function adjacentProgress(value: number, direction: 1 | -1): number {
  adjacentView.setFloat64(0, value);
  adjacentView.setBigUint64(0, adjacentView.getBigUint64(0) + BigInt(direction));
  return adjacentView.getFloat64(0);
}

/** First representable progress where the original player's local integer-tick test passes. */
export function sceneEventArrival(tick: number, finalTick: number, phase: number): number {
  if (tick === 0) return phase;
  let progress = phase + (1 - phase) * (tick / finalTick);
  const visible = (p: number): boolean => p >= phase && Math.floor((p - phase) / (1 - phase) * finalTick) >= tick;
  while (!visible(progress)) progress = adjacentProgress(progress, 1);
  while (visible(adjacentProgress(progress, -1))) progress = adjacentProgress(progress, -1);
  return progress;
}

/** Presentation adapter: source sites under explicit scene transforms, never a solver state. */
export function readGrowthStudy(buffer: ArrayBuffer): DendriteData {
  if (buffer.byteLength < 4) throw new Error("Missing study header");
  const length = new DataView(buffer).getUint32(0, true);
  if (length < 1 || length > 65536 || length + 4 > buffer.byteLength) throw new Error("Invalid study header");
  const h = JSON.parse(new TextDecoder().decode(new Uint8Array(buffer, 4, length))) as StudySceneHeader;
  if (h.format !== "growth-study-scene-v1") return readDendrite(buffer);
  if (!/^[a-f0-9]{64}$/u.test(h.sourceSha256) || !Array.isArray(h.assets) || h.assets.length < 1 || h.assets.length > 16 ||
      !Array.isArray(h.components) || h.components.length < 1 || h.components.length > 16 ||
      !h.camera || !Number.isFinite(h.camera.tiltDegrees) || !Number.isFinite(h.camera.yawDegrees)) throw new Error("Invalid study scene");
  let offset = 4 + length;
  const assets = h.assets.map(bytes => {
    if (!Number.isSafeInteger(bytes) || bytes < 4 || offset + bytes > buffer.byteLength) throw new Error("Invalid component size");
    const data = readDendrite(buffer.slice(offset, offset + bytes));
    offset += bytes;
    return data;
  });
  if (offset !== buffer.byteLength) throw new Error("Trailing scene bytes");
  const components = h.components.map(component => {
    const { transform: t, phaseOffset: phase, asset } = component;
    if (!Number.isInteger(asset) || !assets[asset] || !t || !Number.isFinite(t.scale) || t.scale <= 0 || t.scale > 100 ||
        ![t.translate, t.rotateDegrees].every(v => Array.isArray(v) && v.length === 3 && v.every(n => Number.isFinite(n) && Math.abs(n) <= 100000)) ||
        !Number.isFinite(phase) || phase < 0 || phase >= 1) throw new Error("Invalid scene transform or phase");
    const rotation = new Euler(...t.rotateDegrees.map(n => n * Math.PI / 180) as [number, number, number], "XYZ");
    const matrix = new Matrix4().compose(new Vector3(...t.translate as [number, number, number]), new Quaternion().setFromEuler(rotation), new Vector3(t.scale, t.scale, t.scale));
    const data = assets[asset]!;
    return { data, phase, matrix, cursor: 0, next: sceneEventArrival(data.ticks[0]!, data.finalTick, phase) };
  });
  const eventCount = components.reduce((sum, c) => sum + c.data.eventCount, 0);
  if (eventCount > 16000000) throw new Error("Scene exceeds display event limit");
  const positions = new Float32Array(eventCount * 3);
  // Keep the seek clock in float64; only the artistic shader attribute rounds to float32.
  const ticks = new Float64Array(eventCount);
  const point = new Vector3();
  let radius = 0, extent = 1, halfHeight = 0;
  // A bounded merge retains every instance/event and avoids a large object-based sort.
  for (let event = 0; event < eventCount; event++) {
    let chosen = -1, arrival = Infinity;
    for (let i = 0; i < components.length; i++) {
      const c = components[i]!;
      if (c.cursor === c.data.eventCount) continue;
      if (c.next < arrival) { arrival = c.next; chosen = i; }
    }
    const c = components[chosen]!;
    point.fromArray(c.data.positions, c.cursor++ * 3).applyMatrix4(c.matrix);
    if (c.cursor < c.data.eventCount && c.data.ticks[c.cursor] !== c.data.ticks[c.cursor - 1]) {
      c.next = sceneEventArrival(c.data.ticks[c.cursor]!, c.data.finalTick, c.phase);
    }
    point.toArray(positions, event * 3);
    ticks[event] = arrival;
    radius = Math.max(radius, Math.hypot(point.x, point.y));
    extent = Math.max(extent, point.length());
    halfHeight = Math.max(halfHeight, Math.abs(point.z));
  }
  return { positions, ticks, eventCount, finalTick: 1, sourceSha256: h.sourceSha256, radius, extent, vertical: halfHeight > radius, camera: h.camera };
}
