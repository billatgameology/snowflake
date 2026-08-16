// Measured Run B comparison page. The legacy sequence remains on the NAS and is never
// fetched by this page; lightweight derived media represents its appearance while one
// verified gutcheck-growth-v1 asset powers the interactive side.

import "./gutcheck-growth-comparison.css";

import {
  decodeGrowthComparisonRecord,
  type GrowthComparisonRecord,
} from "./gutcheck-growth-comparison-record.ts";
import { decodeGrowthAsset, growthCropSize, type DecodedGrowthAsset } from "./gutcheck-growth-format.ts";
import { sha256Hex } from "./sha256.ts";

interface EmbeddedGrowthDebug {
  readonly finalTick: number;
  readonly asset: {
    readonly config: {
      readonly preset: string;
      readonly dims: { readonly nx: number; readonly ny: number; readonly nz: number };
      readonly domain: string;
      readonly rngSeed: number;
      readonly noiseEpsilon: number;
    };
    readonly source: {
      readonly endpoint?: unknown;
      readonly legacyComparison?: unknown;
    };
  };
  readonly volume: {
    readonly size: readonly [number, number, number];
    readonly eventCount: number;
    readonly sourceBytes: number;
    readonly decodedUint32Bytes: number;
  };
}

interface EmbeddedGrowthWindow extends Window {
  readonly __spikeReady?: boolean;
  readonly __spikeError?: string;
  readonly __growthDebug?: EmbeddedGrowthDebug;
  readonly __growthSeek?: (tick: number) => Promise<void>;
}

interface ComparisonDebugState {
  readonly recordUrl: string;
  readonly reducedMotion: boolean;
  readonly record: GrowthComparisonRecord;
  iframeReady: boolean;
  iframeError: string | null;
  selectedTick: number;
}

interface ComparisonWindow extends Window {
  __growthComparisonReady?: boolean;
  __growthComparisonError?: string;
  __growthComparisonDebug?: ComparisonDebugState;
}

const comparisonWindow = window as ComparisonWindow;

function comparisonMain(): HTMLElement {
  const element = document.querySelector("#comparison-main");
  if (!(element instanceof HTMLElement)) throw new Error("comparison page main element is missing");
  return element;
}

const main = comparisonMain();

function sameOriginUrl(reference: string, base: URL, label: string): URL {
  const resolved = new URL(reference, base);
  if (resolved.origin !== window.location.origin || resolved.username !== "" || resolved.password !== "") {
    throw new Error(`${label} must resolve on this page's origin`);
  }
  return resolved;
}

function formatInteger(value: number): string {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value);
}

function formatBytes(bytes: number): string {
  const units = [
    [1_000_000_000, "GB"],
    [1_000_000, "MB"],
    [1_000, "KB"],
  ] as const;
  for (const [scale, label] of units) {
    if (bytes >= scale) {
      const value = bytes / scale;
      const digits = value >= 100 ? 0 : value >= 10 ? 1 : 2;
      return `${value.toFixed(digits)} ${label}`;
    }
  }
  return `${formatInteger(bytes)} B`;
}

function formatDuration(totalSeconds: number): string {
  const seconds = Math.round(totalSeconds);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainder = seconds % 60;
  if (hours > 0) return `${hours} h ${minutes} m ${remainder} s`;
  if (minutes > 0) return `${minutes} m ${remainder} s`;
  return `${remainder} s`;
}

function exactBytes(bytes: number): string {
  return `${formatBytes(bytes)} · ${formatInteger(bytes)} bytes`;
}

function setText(selector: string, value: string): void {
  const element = main.querySelector(selector);
  if (!(element instanceof HTMLElement)) throw new Error(`comparison element ${selector} is missing`);
  element.textContent = value;
}

function requiredElement<T extends Element>(selector: string, kind: { new(): T }): T {
  const element = main.querySelector(selector);
  if (!(element instanceof kind)) throw new Error(`comparison element ${selector} has the wrong type`);
  return element;
}

function comparisonMarkup(): string {
  return `
    <article class="comparison-page">
      <header class="hero">
        <p class="eyebrow">The Virtual Cloud Chamber · Run B · measured comparison</p>
        <h1>One crystal.<br />Two timelines.</h1>
        <p class="hero-deck">
          The original workflow saved a complete 3D surface every 100 solver ticks. The compact
          workflow saves each cell once—at the tick it attached—and reconstructs a smooth surface
          while you watch. Both replay the same registered deterministic G–G configuration and reproduce
          the same endpoint; they preserve different things.
        </p>
        <div class="ratio-line" aria-label="Sequence-size comparison">
          <strong class="ratio-number" data-value="ratio"></strong>
          <span class="ratio-copy" data-value="ratio-copy"></span>
        </div>
      </header>

      <section class="section" aria-labelledby="watch-heading">
        <div class="section-header">
          <div>
            <p class="section-kicker">Look first</p>
            <h2 id="watch-heading">The same growth, carried differently</h2>
          </div>
          <p class="section-intro">
            The left video is a lightweight viewing derivative of the legacy mesh timeline—not the
            multi-gigabyte sequence itself. The right side is the actual compact Run B asset rendered
            live. Drag, orbit, pause, and reverse it in the browser.
          </p>
        </div>

        <div class="comparison-stage">
          <figure class="media-panel">
            <figcaption class="panel-heading">
              <div>
                <span class="panel-tag">Legacy representation</span>
                <h3>701 independent mesh frames</h3>
              </div>
              <span class="status-pill legacy">source not loaded</span>
            </figcaption>
            <div class="media-shell">
              <span class="media-badge">Encoded video proxy · not the mesh payload</span>
              <video data-role="legacy-video" controls playsinline preload="metadata"
                aria-describedby="legacy-media-description"></video>
              <div class="media-error" data-role="legacy-error" role="status" hidden>
                <p><strong>Legacy viewing proxy unavailable</strong><span data-role="legacy-error-text"></span></p>
              </div>
            </div>
            <div class="seek-row" data-role="poster-controls" aria-label="Compare recorded ticks"></div>
            <p class="panel-copy" id="legacy-media-description">
              <strong>What it keeps:</strong> a fully extracted surface at each sampled tick. Any sampled
              state can stand alone, but almost all geometry is repeated from one frame to the next.
            </p>
          </figure>

          <figure class="media-panel">
            <figcaption class="panel-heading">
              <div>
                <span class="panel-tag">Compact representation</span>
                <h3>One attachment-time volume</h3>
              </div>
              <span class="status-pill" data-role="compact-status" role="status" aria-live="polite">loading</span>
            </figcaption>
            <div class="media-shell">
              <iframe data-role="compact-frame" title="Interactive compact Run B growth replay"></iframe>
              <div class="media-error" data-role="compact-error" role="status" hidden>
                <p>
                  <strong>Interactive replay unavailable</strong>
                  <span data-role="compact-error-text"></span><br />
                  <button class="seek-button" type="button" data-role="retry">Retry replay</button>
                </p>
              </div>
            </div>
            <div class="seek-row">
              <a data-role="open-player" href="#" target="_blank" rel="noopener">
                Open raw replay alone (outside this page's integrity check)
              </a>
            </div>
            <p class="panel-copy">
              <strong>What it keeps:</strong> the exact lattice index and attachment tick for every ultimately
              attached cell. The continuous shell between those events is an explicitly labeled visual interpolation.
            </p>
          </figure>
        </div>
      </section>

      <section class="section" aria-labelledby="measure-heading">
        <div class="section-header">
          <div>
            <p class="section-kicker">Measure second</p>
            <h2 id="measure-heading">Where the bytes went</h2>
          </div>
          <p class="section-intro">
            Most values are re-derived from the completed legacy manifests and checked against the compact
            asset when the replay loads. Timing rows distinguish retained log measurements from a rounded
            project record. Nominal storage is separate from transfer size and unmeasured device memory.
          </p>
        </div>

        <div class="metrics-grid" aria-label="Key measured values">
          <div class="metric">
            <span class="metric-label">Legacy web sequence</span>
            <span class="metric-value" data-value="legacy-size"></span>
            <span class="metric-note" data-value="legacy-size-note"></span>
          </div>
          <div class="metric">
            <span class="metric-label">Compact asset</span>
            <span class="metric-value" data-value="compact-size"></span>
            <span class="metric-note" data-value="compact-size-note"></span>
          </div>
          <div class="metric">
            <span class="metric-label">Decoded tick field</span>
            <span class="metric-value" data-value="decoded-size"></span>
            <span class="metric-note">Exact nominal R32UI data; measured VRAM is unknown</span>
          </div>
          <div class="metric">
            <span class="metric-label">Recorded events</span>
            <span class="metric-value" data-value="event-count"></span>
            <span class="metric-note">One index/tick pair per ultimately attached site</span>
          </div>
        </div>

        <div class="table-wrap">
          <table class="comparison-table">
            <thead>
              <tr><th scope="col">Question</th><th scope="col">Per-frame meshes</th><th scope="col">Compact replay</th></tr>
            </thead>
            <tbody data-role="comparison-rows"></tbody>
          </table>
        </div>

        <aside class="provenance" aria-label="Measurement provenance">
          <strong>Identity check.</strong> Both columns name the same source manifest and final occupancy digest.
          Legacy manifest SHA-256: <code data-value="manifest-sha"></code>.<br />
          Final occupancy SHA-256: <code data-value="occupancy-sha"></code>.<br />
          Compact asset SHA-256: <code data-value="asset-sha"></code>.
        </aside>
      </section>

      <footer class="footer">
        MODEL · UNVALIDATED. This is a media-representation comparison, not a scientific gate.
        G–G ticks have no physical-time interpretation. Record timestamp:
        <time data-value="recorded-at"></time>.
      </footer>
    </article>`;
}

function appendComparisonRow(label: string, legacy: string, compact: string): void {
  const body = requiredElement('[data-role="comparison-rows"]', HTMLTableSectionElement);
  const row = document.createElement("tr");
  const heading = document.createElement("th");
  heading.scope = "row";
  heading.textContent = label;
  const legacyCell = document.createElement("td");
  legacyCell.dataset.label = "Per-frame";
  legacyCell.textContent = legacy;
  const compactCell = document.createElement("td");
  compactCell.dataset.label = "Compact";
  compactCell.textContent = compact;
  if (legacy.startsWith("Not measured")) legacyCell.classList.add("unknown");
  if (compact.startsWith("Not measured")) compactCell.classList.add("unknown");
  row.append(heading, legacyCell, compactCell);
  body.append(row);
}

function sourceDigest(value: unknown, key: string): string | null {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return null;
  const candidate = (value as Record<string, unknown>)[key];
  return typeof candidate === "string" ? candidate : null;
}

function assertDecodedAssetIdentity(
  record: GrowthComparisonRecord,
  bytes: Uint8Array,
  decoded: DecodedGrowthAsset,
): void {
  const header = decoded.header;
  const mismatches: string[] = [];
  if (bytes.byteLength !== record.compact.asset.bytes) mismatches.push("asset bytes");
  if (sha256Hex(bytes) !== record.compact.asset.sha256) mismatches.push("asset SHA-256");
  if (header.eventCount !== record.compact.eventCount || header.attachedCount !== record.compact.eventCount) {
    mismatches.push("event count");
  }
  if (header.finalTick !== record.compact.finalTick) mismatches.push("final tick");
  if (header.config.preset !== record.run.preset) mismatches.push("preset");
  if (header.config.domain !== record.run.domain) mismatches.push("domain");
  if (header.config.rngSeed !== record.run.rngSeed) mismatches.push("seed");
  if (header.config.noiseEpsilon !== record.run.noiseEpsilon) mismatches.push("noise");
  if (
    header.config.dims.nx !== record.run.dims.nx ||
    header.config.dims.ny !== record.run.dims.ny ||
    header.config.dims.nz !== record.run.dims.nz
  ) mismatches.push("dimensions");
  const cropKeys = ["iMin", "iMax", "jMin", "jMax", "kMin", "kMax", "padding"] as const;
  if (cropKeys.some((key) => header.crop[key] !== record.compact.crop[key])) mismatches.push("crop");
  const size = growthCropSize(header.crop);
  if (size[0] * size[1] * size[2] * 4 !== record.compact.crop.r32uiBytes) mismatches.push("R32UI bytes");
  if (
    sourceDigest(header.source["endpoint"], "measuredOccupancySha256") !==
    record.compact.sourceIdentity.occupancySha256
  ) mismatches.push("occupancy SHA-256");
  if (
    sourceDigest(header.source["legacyComparison"], "sha256") !==
    record.compact.sourceIdentity.manifestSha256
  ) mismatches.push("legacy manifest SHA-256");
  if (mismatches.length > 0) {
    throw new Error(`compact asset differs from the pinned comparison record: ${mismatches.join(", ")}`);
  }
}

function assertEmbeddedIdentity(record: GrowthComparisonRecord, debug: EmbeddedGrowthDebug): void {
  const expectedSize = [
    record.compact.crop.iMax - record.compact.crop.iMin + 1,
    record.compact.crop.jMax - record.compact.crop.jMin + 1,
    record.compact.crop.kMax - record.compact.crop.kMin + 1,
  ];
  const mismatches: string[] = [];
  if (debug.finalTick !== record.compact.finalTick) mismatches.push("final tick");
  if (debug.volume.eventCount !== record.compact.eventCount) mismatches.push("event count");
  if (debug.volume.sourceBytes !== record.compact.asset.bytes) mismatches.push("asset bytes");
  if (debug.volume.decodedUint32Bytes !== record.compact.crop.r32uiBytes) mismatches.push("decoded bytes");
  if (debug.volume.size.some((value, axis) => value !== expectedSize[axis])) mismatches.push("crop size");
  if (debug.asset.config.preset !== record.run.preset) mismatches.push("preset");
  if (debug.asset.config.domain !== record.run.domain) mismatches.push("domain");
  if (debug.asset.config.rngSeed !== record.run.rngSeed) mismatches.push("seed");
  if (debug.asset.config.noiseEpsilon !== record.run.noiseEpsilon) mismatches.push("noise");
  const dims = debug.asset.config.dims;
  if (dims.nx !== record.run.dims.nx || dims.ny !== record.run.dims.ny || dims.nz !== record.run.dims.nz) {
    mismatches.push("dimensions");
  }
  if (
    sourceDigest(debug.asset.source.endpoint, "measuredOccupancySha256") !==
    record.compact.sourceIdentity.occupancySha256
  ) mismatches.push("occupancy SHA-256");
  if (
    sourceDigest(debug.asset.source.legacyComparison, "sha256") !==
    record.compact.sourceIdentity.manifestSha256
  ) mismatches.push("legacy manifest SHA-256");
  if (mismatches.length > 0) {
    throw new Error(`embedded replay differs from the comparison record: ${mismatches.join(", ")}`);
  }
}

async function render(record: GrowthComparisonRecord, recordUrl: URL): Promise<void> {
  main.innerHTML = comparisonMarkup();
  const ratio = record.legacy.v2qSequence.totalBytes / record.compact.asset.bytes;
  setText('[data-value="ratio"]', `${formatInteger(Math.round(ratio))}× smaller`);
  setText(
    '[data-value="ratio-copy"]',
    `One measured ${formatBytes(record.compact.asset.bytes)} asset replaces a ` +
      `${formatBytes(record.legacy.v2qSequence.totalBytes)} quantized web sequence.`,
  );
  setText('[data-value="legacy-size"]', formatBytes(record.legacy.v2qSequence.totalBytes));
  setText(
    '[data-value="legacy-size-note"]',
    `${formatInteger(record.legacy.v2qSequence.frameCount)} frames plus manifest · ` +
      `${formatInteger(record.legacy.v2qSequence.totalBytes)} bytes`,
  );
  setText('[data-value="compact-size"]', formatBytes(record.compact.asset.bytes));
  setText(
    '[data-value="compact-size-note"]',
    `One measured file · ${formatInteger(record.compact.asset.bytes)} bytes`,
  );
  setText('[data-value="decoded-size"]', formatBytes(record.compact.crop.r32uiBytes));
  setText('[data-value="event-count"]', formatInteger(record.compact.eventCount));
  setText('[data-value="manifest-sha"]', record.compact.sourceIdentity.manifestSha256);
  setText('[data-value="occupancy-sha"]', record.compact.sourceIdentity.occupancySha256);
  setText('[data-value="asset-sha"]', record.compact.asset.sha256);
  setText('[data-value="recorded-at"]', record.recordedAt);
  const time = requiredElement('[data-value="recorded-at"]', HTMLTimeElement);
  time.dateTime = record.recordedAt;

  appendComparisonRow(
    "Complete sequence",
    `${exactBytes(record.legacy.v2qSequence.totalBytes)} across ` +
      `${formatInteger(record.legacy.v2qSequence.frameCount)} quantized mesh frames and one manifest.`,
    `${exactBytes(record.compact.asset.bytes)} in one attachment-event asset.`,
  );
  appendComparisonRow(
    "Before web quantization",
    `${exactBytes(record.legacy.rawSequence.totalBytes)} for the original float mesh sequence.`,
    "No mesh-quantization pass is required; the attachment-event asset is already the web representation.",
  );
  appendComparisonRow(
    "Lightweight viewing derivative",
    `${exactBytes(record.legacy.lightweightMedia.derivedVideo.bytes)} for the displayed MP4. It is easy to play, but gives up 3D orbit and exact-tick interaction.`,
    "The same compact asset can autoplay in the page while retaining orbit, pause, reverse, and exact-tick scrub; a fixed MP4 export remains optional.",
  );
  appendComparisonRow(
    "Observed generation wall clock",
    `${formatDuration(record.legacy.rawSequence.generationSeconds)} in the retained replay/extraction manifest; ` +
      `the later web quantization was recorded as approximately ${formatDuration(record.legacy.v2qSequence.generationSeconds)} ` +
      `(rounded project record; its timing log was not retained).`,
    `${formatDuration(record.compact.bakeElapsedSeconds)} from this bake's final log while recording attachment events; no mesh extraction. ` +
      "These separate executions are not a controlled performance benchmark.",
  );
  appendComparisonRow(
    "Temporal sampling",
    `One complete extracted surface every ${formatInteger(record.run.tickInterval)} ticks, including both endpoints.`,
    "Every ultimately attached cell carries its exact uint32 attachment tick.",
  );
  appendComparisonRow(
    "Between recorded events",
    "The artifact retained no intermediate surface snapshots between adjacent mesh frames; a player steps or visually blends them.",
    "The shader reveals exact discrete events, then spatially and temporally smooths the presentation surface.",
  );
  appendComparisonRow(
    "Independent snapshots",
    "Yes. Any mesh frame is a complete, independently renderable surface snapshot.",
    "No. A requested tick is reconstructed from the cumulative event timeline.",
  );
  appendComparisonRow(
    "Topology and reversibility",
    "Arbitrary sampled topology and non-monotonic changes can be stored because every frame is complete.",
    "Version 1 is specialized for terminal G–G attachment; reverse playback reconstructs earlier occupancy but does not encode a general melting field.",
  );
  appendComparisonRow(
    "Web interaction",
    "Orbit and scrub are possible, but each uncached state requires another frame fetch and decode. Quantized frames range from 2,144 bytes to 23,310,604 bytes.",
    "One fetch supports continuous play, pause, exact-tick scrub, reverse, and a free 3D camera.",
  );
  appendComparisonRow(
    "Decoded/device memory",
    "Not measured for the complete sequence; the legacy viewer keeps a bounded frame cache rather than all 701 decoded meshes.",
    `${exactBytes(record.compact.crop.r32uiBytes)} is the exact nominal decoded R32UI tick field; actual browser overhead and VRAM were not measured.`,
  );
  appendComparisonRow(
    "Network compression",
    "Not measured as a production/CDN transfer for the complete sequence.",
    "Not measured as a production/CDN transfer. The comparison uses verified uncompressed asset bytes.",
  );
  appendComparisonRow(
    "Scientific meaning",
    "A sampled visualization artifact derived from model state; not scientific gate evidence.",
    "Exact attachment timing with an interpolated display shell; MODEL / UNVALIDATED and not scientific gate evidence.",
  );

  const resolveRecordMedia = (reference: string, label: string): URL =>
    sameOriginUrl(reference, recordUrl, label);
  const video = requiredElement('[data-role="legacy-video"]', HTMLVideoElement);
  const videoUrl = resolveRecordMedia(record.legacy.lightweightMedia.derivedVideo.url, "legacy video URL");
  video.src = videoUrl.href;
  video.poster = resolveRecordMedia(record.legacy.lightweightMedia.posters[0].url, "legacy poster URL").href;
  const legacyError = requiredElement('[data-role="legacy-error"]', HTMLDivElement);
  video.addEventListener("error", () => {
    legacyError.hidden = false;
    setText('[data-role="legacy-error-text"]', "The measured comparison remains available below.");
  });

  const iframe = requiredElement('[data-role="compact-frame"]', HTMLIFrameElement);
  const iframeError = requiredElement('[data-role="compact-error"]', HTMLDivElement);
  const iframeStatus = requiredElement('[data-role="compact-status"]', HTMLSpanElement);
  const openPlayer = requiredElement('[data-role="open-player"]', HTMLAnchorElement);
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const assetUrl = resolveRecordMedia(record.compact.asset.url, "compact asset URL");
  const makePlayerUrl = (growthUrl: string, attempt?: number): URL => {
    const player = new URL("spike-gg-realism.html", window.location.href);
    player.searchParams.set("growth", growthUrl);
    player.searchParams.set("look", "bold-ice");
    player.searchParams.set("quality", "medium");
    player.searchParams.set("duration", "18");
    player.searchParams.set("autoplay", reducedMotion ? "0" : "1");
    if (attempt !== undefined) player.searchParams.set("comparisonAttempt", String(attempt));
    return player;
  };
  openPlayer.href = makePlayerUrl(assetUrl.href).href;
  openPlayer.title = "This opens the raw player outside the comparison page's runtime SHA-256 check";

  const debugState: ComparisonDebugState = {
    recordUrl: recordUrl.href,
    reducedMotion,
    record,
    iframeReady: false,
    iframeError: null,
    selectedTick: record.run.firstTick,
  };
  comparisonWindow.__growthComparisonDebug = debugState;
  comparisonWindow.__growthComparisonReady = false;

  const showIframeError = (message: string): void => {
    debugState.iframeReady = false;
    debugState.iframeError = message;
    comparisonWindow.__growthComparisonError = message;
    iframeStatus.textContent = "unavailable";
    iframeError.hidden = false;
    setText('[data-role="compact-error-text"]', message);
  };

  let monitorGeneration = 0;
  let blobUrl: string | null = null;
  const monitorIframe = async (generation: number): Promise<void> => {
    const started = performance.now();
    while (generation === monitorGeneration && performance.now() - started < 120_000) {
      const embedded = iframe.contentWindow as EmbeddedGrowthWindow | null;
      if (embedded?.__spikeError !== undefined) {
        showIframeError(embedded.__spikeError);
        return;
      }
      if (embedded?.__spikeReady === true && embedded.__growthDebug !== undefined) {
        try {
          assertEmbeddedIdentity(record, embedded.__growthDebug);
        } catch (error) {
          showIframeError(error instanceof Error ? error.message : String(error));
          return;
        }
        debugState.iframeReady = true;
        debugState.iframeError = null;
        comparisonWindow.__growthComparisonError = undefined;
        comparisonWindow.__growthComparisonReady = true;
        iframeStatus.textContent = "live · one asset";
        iframeError.hidden = true;
        if (blobUrl !== null) {
          URL.revokeObjectURL(blobUrl);
          blobUrl = null;
        }
        if (debugState.selectedTick !== record.run.firstTick) {
          await embedded.__growthSeek?.(debugState.selectedTick);
        }
        return;
      }
      await new Promise<void>((resolve) => window.setTimeout(resolve, 50));
    }
    if (generation === monitorGeneration) showIframeError("The replay did not become ready within 120 seconds.");
  };

  const loadIframe = async (): Promise<void> => {
    const generation = ++monitorGeneration;
    comparisonWindow.__growthComparisonReady = false;
    comparisonWindow.__growthComparisonError = undefined;
    debugState.iframeReady = false;
    debugState.iframeError = null;
    iframeStatus.textContent = "loading";
    iframeError.hidden = true;
    let verifiedBuffer: ArrayBuffer;
    try {
      const response = await fetch(assetUrl, { cache: "no-store" });
      if (!response.ok) throw new Error(`compact asset fetch failed: ${response.status}`);
      verifiedBuffer = await response.arrayBuffer();
      const bytes = new Uint8Array(verifiedBuffer);
      if (bytes.byteLength !== record.compact.asset.bytes) {
        throw new Error("compact asset differs from the pinned comparison record: asset bytes");
      }
      if (sha256Hex(bytes) !== record.compact.asset.sha256) {
        throw new Error("compact asset differs from the pinned comparison record: asset SHA-256");
      }
      const decoded = decodeGrowthAsset(bytes);
      assertDecodedAssetIdentity(record, bytes, decoded);
    } catch (error) {
      if (generation === monitorGeneration) {
        showIframeError(error instanceof Error ? error.message : String(error));
      }
      return;
    }
    if (generation !== monitorGeneration) return;
    if (blobUrl !== null) URL.revokeObjectURL(blobUrl);
    blobUrl = URL.createObjectURL(new Blob([verifiedBuffer], { type: "application/octet-stream" }));
    const playerUrl = makePlayerUrl(blobUrl, generation);
    iframe.addEventListener("load", () => {
      if (generation === monitorGeneration) void monitorIframe(generation);
    }, { once: true });
    iframe.src = playerUrl.href;
  };
  requiredElement('[data-role="retry"]', HTMLButtonElement).addEventListener("click", () => void loadIframe());

  const posterControls = requiredElement('[data-role="poster-controls"]', HTMLDivElement);
  const selectTick = async (tick: number, button: HTMLButtonElement): Promise<void> => {
    debugState.selectedTick = tick;
    for (const candidate of posterControls.querySelectorAll("button")) {
      candidate.setAttribute("aria-pressed", String(candidate === button));
    }
    video.pause();
    const seekVideo = (): void => {
      const poster = record.legacy.lightweightMedia.posters.find((candidate) => candidate.tick === tick);
      if (poster === undefined) throw new Error(`comparison tick ${tick} has no legacy poster binding`);
      video.currentTime = poster.videoTimeSeconds;
    };
    if (video.readyState >= HTMLMediaElement.HAVE_METADATA) seekVideo();
    else video.addEventListener("loadedmetadata", seekVideo, { once: true });
    const embedded = iframe.contentWindow as EmbeddedGrowthWindow | null;
    await embedded?.__growthSeek?.(tick);
  };
  const labels = ["start", "middle", "final"] as const;
  record.legacy.lightweightMedia.posters.forEach((poster, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "seek-button";
    button.setAttribute("aria-pressed", String(index === 0));
    button.textContent = `${labels[index]} · tick ${formatInteger(poster.tick)}`;
    button.title = poster.alt;
    button.addEventListener("click", () => void selectTick(poster.tick, button));
    posterControls.append(button);
  });

  await loadIframe();
}

function showFatal(error: unknown): void {
  const message = error instanceof Error ? error.message : String(error);
  comparisonWindow.__growthComparisonReady = false;
  comparisonWindow.__growthComparisonError = message;
  main.innerHTML = "";
  const card = document.createElement("section");
  card.className = "fatal-card";
  card.setAttribute("role", "alert");
  const title = document.createElement("h1");
  title.textContent = "Comparison unavailable";
  const body = document.createElement("p");
  body.textContent = message;
  card.append(title, body);
  main.append(card);
}

async function run(): Promise<void> {
  const query = new URLSearchParams(window.location.search);
  const reference = query.get("record");
  if (reference === null || reference === "") {
    throw new Error("A verified comparison record is required. Add ?record=<comparison-record.json>.");
  }
  const recordUrl = sameOriginUrl(reference, new URL(window.location.href), "comparison record URL");
  const response = await fetch(recordUrl);
  if (!response.ok) throw new Error(`comparison record fetch failed: ${response.status}`);
  let raw: unknown;
  try {
    raw = await response.json();
  } catch {
    throw new Error("comparison record is not valid JSON");
  }
  const record = decodeGrowthComparisonRecord(raw);
  await render(record, recordUrl);
}

void run().catch(showFatal);
