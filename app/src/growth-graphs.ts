import type { DendriteData } from "./dendrite-data.ts";
import { graphSamples, recordingStatsAt, type GrowthGraph, type GrowthStatistics } from "./growth-statistics.ts";
import "./growth-insights.css";

const graphText: Record<GrowthGraph, { title: string; unit: string; color: string }> = {
  attached: { title: "Attached sites", unit: "recorded sites", color: "#9de4cd" },
  activity: { title: "New attachments", unit: "sites / 1% of recording", color: "#e9c894" },
  reach: { title: "Outward reach", unit: "lattice units from origin", color: "#aebdea" },
};
const compact = (value: number) => value >= 1000000 ? `${(value / 1000000).toFixed(1)}m` : value >= 1000 ? `${(value / 1000).toFixed(1)}k` : String(Math.round(value));

export function drawGrowthGraph(ctx: CanvasRenderingContext2D, width: number, height: number, kind: GrowthGraph,
  data: DendriteData, stats: GrowthStatistics, progress: number, composed: boolean): void {
  const text = graphText[kind], samples = graphSamples(stats, kind), now = recordingStatsAt(data, stats, progress);
  const value = now[kind], max = Math.max(1, ...samples);
  ctx.fillStyle = "#101e27"; ctx.fillRect(0, 0, width, height);
  ctx.textAlign = "left"; ctx.fillStyle = "#e1eceb"; ctx.font = "14px 'Segoe UI', sans-serif"; ctx.fillText(text.title, 17, 25);
  ctx.textAlign = "right"; ctx.fillStyle = text.color; ctx.font = "18px 'Segoe UI', sans-serif";
  ctx.fillText(kind === "reach" ? value.toFixed(2) : value.toLocaleString("en-US"), width - 17, 27);
  ctx.textAlign = "left"; ctx.fillStyle = "#8aa4b0"; ctx.font = "10px 'Segoe UI', sans-serif";
  const unit = composed ? text.unit.replace("sites", "instances").replace("origin", "scene origin") : text.unit;
  ctx.fillText(unit, 17, 44);
  const left = 46, right = width - 18, top = 62, bottom = height - 28, plotW = right - left, plotH = bottom - top;
  const x = (fraction: number) => left + fraction * plotW, y = (v: number) => bottom - v / max * plotH;
  ctx.strokeStyle = "#2b3b46"; ctx.lineWidth = 1;
  for (const ratio of [0, .5, 1]) {
    ctx.beginPath(); ctx.moveTo(left, y(max * ratio)); ctx.lineTo(right, y(max * ratio)); ctx.stroke();
    ctx.textAlign = "right"; ctx.fillText(kind === "reach" ? (max * ratio).toFixed(0) : compact(max * ratio), left - 7, y(max * ratio) + 3);
  }
  ctx.textAlign = "left"; ctx.fillText("0%", left, height - 10); ctx.textAlign = "right"; ctx.fillText("100% recording", right, height - 10);
  // Full history is a quiet reference; the brighter portion ends at the actual playhead.
  if (kind === "activity") {
    const bar = plotW / 100;
    for (let i = 1; i <= 100; i++) {
      ctx.fillStyle = "#2e414d"; ctx.fillRect(x((i - 1) / 100), y(samples[i]!), Math.max(.5, bar - 1), bottom - y(samples[i]!));
      const shown = i < now.interval ? samples[i]! : i === now.interval ? now.activity : 0;
      ctx.fillStyle = text.color; ctx.fillRect(x((i - 1) / 100), y(shown), Math.max(.5, bar - 1), bottom - y(shown));
    }
  } else {
    ctx.strokeStyle = "#344b57"; ctx.lineWidth = 1.4; ctx.beginPath();
    samples.forEach((v, i) => { if (i === 0) ctx.moveTo(x(0), y(v)); else ctx.lineTo(x(i / 100), y(v)); }); ctx.stroke();
    ctx.strokeStyle = text.color; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x(0), y(samples[0]!));
    for (let i = 1; i <= Math.floor(progress * 100); i++) ctx.lineTo(x(i / 100), y(samples[i]!));
    ctx.lineTo(x(progress), y(value)); ctx.stroke();
  }
  ctx.strokeStyle = "#c4ddd5"; ctx.lineWidth = 1; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(x(progress), top); ctx.lineTo(x(progress), bottom); ctx.stroke(); ctx.setLineDash([]);
  ctx.textAlign = "left";
}

export function installGrowthGraphs(onSeek: (progress: number) => void, onChange: () => void) {
  const panel = document.querySelector<HTMLElement>("#growth-graphs")!;
  const button = document.querySelector<HTMLButtonElement>("#toggle-graphs")!;
  const toggles = [...document.querySelectorAll<HTMLInputElement>("[data-graph]")];
  let data: DendriteData | null = null, statistics: GrowthStatistics | null = null, composed = false, progress = 0;
  let open = false, focused = true;
  const chosen = () => toggles.filter(input => input.checked).map(input => input.dataset.graph as GrowthGraph);
  const update = () => {
    panel.hidden = !open || !focused;
    document.body.classList.toggle("graphs-open", open && focused && chosen().length > 0);
    button.setAttribute("aria-expanded", String(open));
    for (const kind of ["attached", "activity", "reach"] as const) document.querySelector<HTMLElement>(`[data-chart='${kind}']`)!.hidden = !chosen().includes(kind);
    document.querySelector<HTMLElement>("#graphs-empty")!.hidden = chosen().length > 0;
    onChange();
  };
  button.onclick = () => { open = !open; update(); };
  for (const input of toggles) input.onchange = update;
  const jump = (at: number) => { progress = Math.max(0, Math.min(1, at)); onSeek(progress); };
  for (const chart of document.querySelectorAll<HTMLCanvasElement>(".growth-graph canvas")) {
    chart.onclick = event => {
      if (!data) return;
      const box = chart.getBoundingClientRect();
      jump((event.clientX - box.left - 46) / (box.width - 64));
    };
    chart.onkeydown = event => {
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") { event.preventDefault(); jump(progress + (event.key === "ArrowLeft" ? -.01 : .01)); }
    };
  }
  return {
    clear() {
      data = null; statistics = null; panel.setAttribute("aria-busy", "true");
      document.querySelector("#graphs-provenance")!.textContent = "Loading the selected recording…";
      for (const chart of panel.querySelectorAll<HTMLCanvasElement>("canvas")) {
        chart.getContext("2d")!.clearRect(0, 0, chart.width, chart.height);
        chart.setAttribute("aria-label", "Loading recording statistics");
      }
    },
    setData(next: DendriteData, nextStatistics: GrowthStatistics, isComposed: boolean) {
      data = next; statistics = nextStatistics; composed = isComposed;
      panel.setAttribute("aria-busy", "false");
      const provenance = isComposed
        ? "Derived recording statistics · Unvalidated model output · Counts are scene instances; reach is from the scene origin."
        : "Derived recording statistics · Unvalidated model output · Sites are not mass; lattice units are not micrometres.";
      document.querySelector("#graphs-provenance")!.textContent = `${provenance} New attachments excludes the ${nextStatistics.counts[0]!.toLocaleString("en-US")} ${isComposed ? "instances" : "sites"} present at the start.`;
    },
    setFocused(value: boolean) { focused = value; update(); },
    get visibleKinds() { return open && focused ? chosen() : []; },
    get statistics() { return statistics; },
    draw(at: number) {
      progress = at;
      if (panel.hidden || !data || !statistics) return;
      const current = recordingStatsAt(data, statistics, progress);
      for (const kind of chosen()) {
        const chart = document.querySelector<HTMLCanvasElement>(`[data-chart='${kind}'] canvas`)!;
        const rect = chart.getBoundingClientRect(), ratio = Math.min(devicePixelRatio, 2);
        if (rect.width === 0) continue;
        if (chart.width !== Math.round(rect.width * ratio) || chart.height !== Math.round(rect.height * ratio)) { chart.width = Math.round(rect.width * ratio); chart.height = Math.round(rect.height * ratio); }
        const ctx = chart.getContext("2d")!; ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
        drawGrowthGraph(ctx, rect.width, rect.height, kind, data, statistics, progress, composed);
        chart.setAttribute("aria-label", `${graphText[kind].title}: ${current[kind].toLocaleString("en-US")}. ${Math.round(progress * 100)}% of recording. Use arrow keys to seek.`);
      }
    },
  };
}
