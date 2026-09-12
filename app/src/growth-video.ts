import type { DendriteData } from "./dendrite-data.ts";
import { drawGrowthGraph } from "./growth-graphs.ts";
import type { GrowthGraph, GrowthStatistics } from "./growth-statistics.ts";

export function videoFrameProgress(frame: number, seconds: number, fps = 30): number {
  return Math.min(1, frame / ((seconds - 2) * fps));
}

export interface GrowthVideoOptions {
  seconds: number; height: number; title: string; style: string; composed: boolean;
  graphs: GrowthGraph[]; data: DendriteData; statistics: GrowthStatistics;
}

/** Explicit timestamps retain every planned frame even when rendering is slower than playback. */
export async function encodeGrowthVideo(options: GrowthVideoOptions, frame: (width: number, height: number, progress: number) => HTMLCanvasElement,
  signal: AbortSignal, onProgress: (progress: number) => void): Promise<Blob> {
  if (![10, 20, 30].includes(options.seconds) || ![720, 1080].includes(options.height)) throw new Error("Unsupported video size or duration.");
  if (typeof VideoEncoder === "undefined") throw new Error("MP4 export needs browser video encoding. Open this page in Chrome or Edge to export.");
  const { Output, Mp4OutputFormat, BufferTarget, CanvasSource, canEncodeVideo } = await import("mediabunny");
  signal.throwIfAborted();
  const width = options.height * 16 / 9, height = options.height, bitrate = height === 1080 ? 10000000 : 6000000;
  if (!await canEncodeVideo("avc", { width, height, bitrate })) throw new Error("H.264 MP4 encoding is unavailable in this browser. Try Chrome or Edge on this computer.");
  signal.throwIfAborted();
  const canvas = document.createElement("canvas"); canvas.width = width; canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  const output = new Output({ format: new Mp4OutputFormat({ fastStart: "in-memory" }), target: new BufferTarget() });
  const source = new CanvasSource(canvas, { codec: "avc", bitrate, keyFrameInterval: 2 });
  output.addVideoTrack(source, { frameRate: 30 });
  output.setMetadataTags({ title: `${options.title} · ${options.style}`, artist: "The Virtual Cloud Chamber" });
  const abort = () => { void output.cancel().catch(() => {}); };
  signal.addEventListener("abort", abort, { once: true });
  const scale = width / 1280, graphs = options.graphs;
  const region = { x: 32, y: 104, width: graphs.length ? 808 : 1216, height: 552 };
  try {
    await output.start();
    for (let index = 0; index < options.seconds * 30; index++) {
      signal.throwIfAborted();
      const progress = videoFrameProgress(index, options.seconds);
      const crystal = frame(Math.round(region.width * scale), Math.round(region.height * scale), progress);
      ctx.setTransform(scale, 0, 0, scale, 0, 0);
      ctx.fillStyle = "#080d12"; ctx.fillRect(0, 0, 1280, 720);
      ctx.drawImage(crystal, region.x, region.y, region.width, region.height);
      ctx.fillStyle = "#9fc8c2"; ctx.font = "11px 'Segoe UI', sans-serif"; ctx.fillText("THE VIRTUAL CLOUD CHAMBER  /  GROWTH RECORDINGS", 34, 32);
      ctx.fillStyle = "#e4efed"; ctx.font = "25px Georgia, serif";
      ctx.fillText(options.title, 34, 72, 860);
      ctx.textAlign = "right"; ctx.fillStyle = "#a7c6c4"; ctx.font = "20px Georgia, serif"; ctx.fillText(options.style, 1246, 72); ctx.textAlign = "left";
      const graphHeight = (552 - (graphs.length - 1) * 12) / Math.max(1, graphs.length);
      graphs.forEach((kind, i) => {
        ctx.save(); ctx.translate(868, 104 + i * (graphHeight + 12));
        drawGrowthGraph(ctx, 380, graphHeight, kind, options.data, options.statistics, progress, options.composed);
        ctx.restore();
      });
      ctx.fillStyle = "#354a52"; ctx.fillRect(34, 674, 1212, 2); ctx.fillStyle = "#abdccc"; ctx.fillRect(34, 674, 1212 * progress, 2);
      ctx.fillStyle = "#95acb5"; ctx.font = "10px 'Segoe UI', sans-serif";
      ctx.fillText(options.composed ? "COMPOSED MODEL RECORDING · Counts are instances; distances use the scene origin." : "MODEL RECORDING · Sites are not mass; distances are lattice units.", 34, 696);
      ctx.textAlign = "right"; ctx.fillText(`${Math.round(progress * 100)}%  ·  Artistic view / unvalidated model output`, 1246, 696); ctx.textAlign = "left";
      await source.add(index / 30, 1 / 30);
      onProgress((index + 1) / (options.seconds * 30));
      if (index % 6 === 0) await new Promise(resolve => setTimeout(resolve, 0));
    }
    signal.throwIfAborted();
    await output.finalize();
    signal.throwIfAborted();
    const bytes = output.target.buffer;
    if (!bytes || bytes.byteLength === 0) throw new Error("The video encoder returned an empty file.");
    return new Blob([bytes], { type: "video/mp4" });
  } catch (error) {
    if (output.state !== "finalized" && output.state !== "canceled") await output.cancel();
    throw error;
  } finally { signal.removeEventListener("abort", abort); canvas.width = canvas.height = 1; }
}

export function installVideoExport(hooks: {
  describe: () => Omit<GrowthVideoOptions, "seconds" | "height"> & { id: string };
  begin: () => void;
  frame: (width: number, height: number, progress: number) => HTMLCanvasElement;
  restore: () => void;
}) {
  const dialog = document.querySelector<HTMLDialogElement>("#video-export")!;
  const button = document.querySelector<HTMLButtonElement>("#export-mp4")!;
  const start = document.querySelector<HTMLButtonElement>("#start-export")!;
  const cancel = document.querySelector<HTMLButtonElement>("#close-export")!;
  const message = document.querySelector<HTMLElement>("#export-message")!;
  const meter = document.querySelector<HTMLProgressElement>("#export-progress")!;
  const download = document.querySelector<HTMLAnchorElement>("#download-mp4")!;
  const settings = document.querySelector<HTMLFieldSetElement>("#export-settings")!;
  const include = document.querySelector<HTMLInputElement>("#export-graphs")!;
  let controller: AbortController | null = null, objectUrl: string | null = null;
  const release = () => { if (objectUrl) URL.revokeObjectURL(objectUrl); objectUrl = null; };
  const close = () => { if (controller) controller.abort(); else { dialog.close(); button.focus(); } };
  button.onclick = () => {
    const description = hooks.describe(); include.checked = description.graphs.length > 0; include.disabled = description.graphs.length === 0;
    release(); download.hidden = true;
    message.textContent = description.graphs.length ? `${description.graphs.length} selected graphs can be included beside the animation.` : "Export the animation on its own, or close this dialog and turn on Graphs to include them.";
    dialog.showModal(); start.focus();
  };
  cancel.onclick = close;
  dialog.addEventListener("cancel", event => { event.preventDefault(); close(); });
  dialog.addEventListener("keydown", event => {
    if (event.key !== "Tab") return;
    const controls = [...dialog.querySelectorAll<HTMLElement>("button:not(:disabled), input:not(:disabled), select:not(:disabled), a[href]")].filter(el => el.getClientRects().length > 0 && !el.closest("fieldset:disabled"));
    if (event.shiftKey && document.activeElement === controls[0]) { event.preventDefault(); controls.at(-1)?.focus(); }
    else if (!event.shiftKey && document.activeElement === controls.at(-1)) { event.preventDefault(); controls[0]?.focus(); }
  });
  start.onclick = async () => {
    if (controller) return;
    controller = new AbortController();
    release(); download.hidden = true; meter.hidden = false; meter.value = 0;
    settings.disabled = start.disabled = true; cancel.textContent = "Cancel export";
    message.textContent = "Preparing MP4…";
    try {
      const description = hooks.describe();
      const options = { ...description, graphs: include.checked ? description.graphs : [],
        seconds: Number(document.querySelector<HTMLSelectElement>("#export-duration")!.value), height: Number(document.querySelector<HTMLSelectElement>("#export-resolution")!.value) };
      hooks.begin();
      const blob = await encodeGrowthVideo(options, hooks.frame, controller.signal, fraction => {
        meter.value = fraction; message.textContent = fraction < 1 ? `Rendering video · ${Math.round(fraction * 100)}%` : "Finishing MP4…";
      });
      objectUrl = URL.createObjectURL(blob); download.href = objectUrl;
      download.download = `${description.id}-${description.style.toLowerCase().replaceAll(" ", "-")}.mp4`;
      download.hidden = false; download.click();
      message.textContent = `MP4 ready · ${(blob.size / 1048576).toFixed(1)} MB. Your view has been restored.`;
    } catch (error) {
      message.textContent = controller.signal.aborted ? "Export cancelled. Your view has been restored." : error instanceof Error ? error.message : "Unable to export MP4.";
    } finally {
      hooks.restore(); controller = null; settings.disabled = start.disabled = false;
      cancel.textContent = "Close"; meter.hidden = true;
    }
  };
  addEventListener("pagehide", () => { controller?.abort(); release(); });
}
