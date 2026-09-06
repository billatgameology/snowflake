import type { DendriteData } from "./dendrite-data.ts";

export async function loadGrowthStudy(url: URL, signal: AbortSignal): Promise<DendriteData> {
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error(`Growth replay could not load (${response.status}).`);
  const bytes = await response.arrayBuffer();
  signal.throwIfAborted();
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL("./growth-study.worker.ts", import.meta.url), { type: "module" });
    const dispose = (): void => { worker.terminate(); signal.removeEventListener("abort", abort); };
    const abort = (): void => { dispose(); reject(new DOMException("Selection changed", "AbortError")); };
    signal.addEventListener("abort", abort, { once: true });
    worker.onmessage = (event: MessageEvent<{ data?: DendriteData; error?: string }>) => {
      dispose();
      if (event.data.data) resolve(event.data.data);
      else reject(new Error(event.data.error ?? "Unable to decode growth replay"));
    };
    worker.onerror = (event) => { dispose(); reject(new Error(event.message)); };
    worker.postMessage(bytes, [bytes]);
  });
}
