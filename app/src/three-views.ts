import type { DendriteData } from "./dendrite-data.ts";

export interface ViewBox { left: number; top: number; width: number; height: number }
export type StudyPane = "top" | "detail";
export interface StudyFrame { center: [number, number, number]; detail: [number, number, number]; halfSize: [number, number, number] }

/** Stable camera targets from the complete recording; never a change to the recorded sites. */
export function studyFrame(data: DendriteData): StudyFrame {
  const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < data.positions.length; i++) {
    const axis = i % 3, value = data.positions[i]!;
    min[axis] = Math.min(min[axis]!, value); max[axis] = Math.max(max[axis]!, value);
  }
  const center = min.map((value, axis) => (value + max[axis]!) / 2) as StudyFrame["center"];
  const target = [...center];
  const axis = data.vertical ? 2 : 0;
  target[axis] = center[axis]! + (max[axis]! - center[axis]!) * .56;
  let nearest = Infinity, chosen = 0;
  for (let i = 0; i < data.positions.length; i += 3) {
    const distance = (data.positions[i]! - target[0]!) ** 2 + (data.positions[i + 1]! - target[1]!) ** 2
      + (data.positions[i + 2]! - target[2]!) ** 2;
    if (distance < nearest) { nearest = distance; chosen = i; }
  }
  return { center, detail: [data.positions[chosen]!, data.positions[chosen + 1]!, data.positions[chosen + 2]!],
    halfSize: max.map((value, axis) => (value - min[axis]!) / 2) as StudyFrame["halfSize"] };
}

/** Camera rectangles are shared by on-screen rendering, pointer controls and MP4 framing. */
export function studyPanes(width: number, height: number): Record<StudyPane, ViewBox> {
  const gap = 10;
  if (width < 480 && height > width) {
    const topHeight = Math.round(height * .57);
    return {
      top: { left: 0, top: 0, width, height: topHeight },
      detail: { left: 0, top: topHeight + gap, width, height: height - topHeight - gap },
    };
  }
  const mainWidth = Math.round((width - gap) * .66);
  return {
    top: { left: 0, top: 0, width: mainWidth, height },
    detail: { left: mainWidth + gap, top: 0, width: width - mainWidth - gap, height },
  };
}

export function drawStudyOverlay(ctx: CanvasRenderingContext2D, width: number, height: number,
  marker: { x: number; y: number } | null): void {
  const panes = studyPanes(width, height);
  const labels: Record<StudyPane, string> = { top: "TOP VIEW", detail: "BRANCH DETAIL" };
  for (const kind of ["top", "detail"] as const) {
    const rect = panes[kind];
    ctx.strokeStyle = "#30434e"; ctx.lineWidth = 1;
    ctx.strokeRect(rect.left + .5, rect.top + .5, rect.width - 1, rect.height - 1);
    ctx.font = "10px 'Segoe UI', sans-serif";
    const label = labels[kind];
    ctx.fillStyle = "#0c1821e8"; ctx.fillRect(rect.left + 8, rect.top + 8, ctx.measureText(label).width + 16, 23);
    ctx.fillStyle = "#b5d8d2"; ctx.textAlign = "left"; ctx.fillText(label, rect.left + 16, rect.top + 23);
  }
  if (marker && marker.x > 18 && marker.x < panes.top.width - 18 && marker.y > 35 && marker.y < panes.top.height - 18) {
    ctx.strokeStyle = "#e6e2b9"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(marker.x, marker.y, 9, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(marker.x + 12, marker.y); ctx.lineTo(marker.x + 24, marker.y); ctx.stroke();
    ctx.fillStyle = "#e6e2b9"; ctx.font = "9px 'Segoe UI', sans-serif";
    ctx.fillText("DETAIL", marker.x + 28, marker.y + 3);
  }
}
