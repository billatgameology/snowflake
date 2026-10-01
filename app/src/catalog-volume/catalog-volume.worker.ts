import {
  buildGrowthVolume,
  buildRadiusTrack,
  decodeGrowthAsset,
  type GrowthCrop,
} from "./growthAsset.ts";

export interface CatalogVolumeWorkerRequest {
  readonly url: string;
  readonly sha256: string;
  readonly decimation: number;
}

export type CatalogVolumeWorkerResponse =
  | { readonly kind: "progress"; readonly received: number; readonly total: number }
  | { readonly kind: "error"; readonly message: string }
  | {
      readonly kind: "ready";
      readonly data: Uint32Array;
      readonly size: readonly [number, number, number];
      readonly crop: GrowthCrop;
      readonly dims: { readonly nx: number; readonly ny: number; readonly nz: number };
      readonly center: readonly [number, number, number];
      readonly finalTick: number;
      readonly seedCount: number;
      readonly radiusTrack: Float32Array;
      readonly ticksPerRadiusSample: number;
      readonly decimation: number;
  };

const digestHex = async (input: ArrayBuffer): Promise<string> => {
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", input));
  return Array.from(digest, (value) => value.toString(16).padStart(2, "0")).join("");
};

const post = (message: CatalogVolumeWorkerResponse, transfer: Transferable[] = []): void => {
  (self as unknown as Worker).postMessage(message, transfer);
};

const fetchWithProgress = async (url: string): Promise<ArrayBuffer> => {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`growth fetch failed: ${response.status}`);
  const total = Number(response.headers.get("content-length") ?? 0);
  if (response.body === null || total <= 0) return response.arrayBuffer();
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;
  for (;;) {
    const item = await reader.read();
    if (item.done) break;
    chunks.push(item.value);
    received += item.value.byteLength;
    post({ kind: "progress", received, total });
  }
  const merged = new Uint8Array(received);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return merged.buffer;
};

self.onmessage = (event: MessageEvent<CatalogVolumeWorkerRequest>): void => {
  const { url, sha256, decimation } = event.data;
  void (async () => {
    try {
      const bytes = await fetchWithProgress(url);
      if (await digestHex(bytes) !== sha256) throw new Error("growth SHA-256 mismatch");
      const asset = decodeGrowthAsset(bytes);
      const volume = buildGrowthVolume(asset, decimation);
      const ticksPerRadiusSample = Math.max(1, Math.ceil(asset.header.finalTick / 512));
      const radiusTrack = buildRadiusTrack(asset, ticksPerRadiusSample);
      post({
        kind: "ready",
        data: volume.data,
        size: volume.size,
        crop: asset.header.crop,
        dims: asset.header.config.dims,
        center: asset.header.config.center,
        finalTick: asset.header.finalTick,
        seedCount: asset.header.seedCount,
        radiusTrack,
        ticksPerRadiusSample,
        decimation: volume.decimation,
      }, [volume.data.buffer, radiusTrack.buffer]);
    } catch (error) {
      post({ kind: "error", message: error instanceof Error ? error.message : String(error) });
    }
  })();
};

export {};
