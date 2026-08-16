// Strict, browser-safe boundary for the measured legacy-versus-compact Run B comparison.
// Keep this module independent of Node APIs: the page must reject a malformed record before it
// uses any measured value or constructs any media element.

export const GUTCHECK_GROWTH_COMPARISON_FORMAT =
  "gutcheck-growth-comparison-v1" as const;

export type GrowthComparisonDomain = "box" | "hexPrism";

export interface GrowthComparisonDims {
  readonly nx: number;
  readonly ny: number;
  readonly nz: number;
}

export interface GrowthComparisonRun {
  readonly label: string;
  readonly preset: string;
  readonly dims: GrowthComparisonDims;
  readonly domain: GrowthComparisonDomain;
  readonly rngSeed: number;
  readonly noiseEpsilon: number;
  readonly firstTick: number;
  readonly finalTick: number;
  readonly tickInterval: number;
}

/** Digests shared by the immutable legacy timeline and its independently validated replay. */
export interface GrowthComparisonSourceIdentity {
  readonly manifestSha256: string;
  readonly occupancySha256: string;
}

export interface GrowthComparisonSequenceMeasurement {
  readonly frameBytes: number;
  readonly manifestBytes: number;
  readonly totalBytes: number;
  readonly frameCount: number;
  readonly generationSeconds: number;
}

export interface GrowthComparisonPosterReference {
  readonly tick: number;
  readonly videoTimeSeconds: number;
  readonly url: string;
  readonly bytes: number;
  readonly sha256: string;
  readonly alt: string;
}

export type GrowthComparisonPosterReferences = readonly [
  GrowthComparisonPosterReference,
  GrowthComparisonPosterReference,
  GrowthComparisonPosterReference,
];

export interface GrowthComparisonVideoReference {
  readonly url: string;
  readonly bytes: number;
  readonly sha256: string;
  readonly durationSeconds: number;
  readonly frameCount: number;
}

export interface GrowthComparisonLightweightMedia {
  readonly totalBytes: number;
  readonly posters: GrowthComparisonPosterReferences;
  readonly derivedVideo: GrowthComparisonVideoReference;
}

export interface GrowthComparisonLegacy {
  readonly format: "gutcheck-anim-v1";
  readonly sourceIdentity: GrowthComparisonSourceIdentity;
  readonly rawSequence: GrowthComparisonSequenceMeasurement;
  readonly v2qSequence: GrowthComparisonSequenceMeasurement;
  readonly lightweightMedia: GrowthComparisonLightweightMedia;
}

export interface GrowthComparisonAssetReference {
  readonly url: string;
  readonly bytes: number;
  readonly sha256: string;
}

export interface GrowthComparisonCrop {
  readonly iMin: number;
  readonly iMax: number;
  readonly jMin: number;
  readonly jMax: number;
  readonly kMin: number;
  readonly kMax: number;
  readonly padding: number;
  readonly sampleCount: number;
  readonly r32uiBytes: number;
}

export interface GrowthComparisonCompact {
  readonly format: "gutcheck-growth-v1";
  readonly sourceIdentity: GrowthComparisonSourceIdentity;
  readonly asset: GrowthComparisonAssetReference;
  readonly bakeElapsedSeconds: number;
  readonly eventCount: number;
  readonly firstTick: number;
  readonly finalTick: number;
  readonly crop: GrowthComparisonCrop;
}

export interface GrowthComparisonRecord {
  readonly format: typeof GUTCHECK_GROWTH_COMPARISON_FORMAT;
  readonly recordedAt: string;
  readonly run: GrowthComparisonRun;
  readonly legacy: GrowthComparisonLegacy;
  readonly compact: GrowthComparisonCompact;
}

const UINT32_MAX = 0xffff_ffff;
const UINT32_CELL_CAP = UINT32_MAX + 1;
const R32UI_BYTES_PER_SAMPLE = 4;
const COMPACT_EVENT_BYTES = 8;
const MIN_COMPACT_HEADER_PREFIX_BYTES = 8;
const RUN_B_MANIFEST_SHA256 = "a06bf93000ab948cd72617649530bcf96d39dbcd01badb22d5617a1b73d17c4d";
const RUN_B_OCCUPANCY_SHA256 = "9c98fe41e5ea2f6b2020063218b37255877548bdeb49dadf4235a4cf039cf9f7";
const RUN_B_VIDEO_SHA256 = "a5ead695add684791f2cd2c02dc650a64d14e37a78df22606b4675f72f6a4c1f";

const isRecord = (value: unknown): value is Record<string, unknown> => {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value) as unknown;
  return prototype === Object.prototype || prototype === null;
};

function fail(message: string): never {
  throw new Error(`gutcheck growth comparison: ${message}`);
}

function record(value: unknown, label: string): Record<string, unknown> {
  if (!isRecord(value)) fail(`${label} must be a plain object`);
  return value;
}

function exactKeys(value: Record<string, unknown>, expected: readonly string[], label: string): void {
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  if (actual.length !== wanted.length || actual.some((key, index) => key !== wanted[index])) {
    fail(`${label} keys must be exactly ${wanted.join(", ")}`);
  }
}

function nonEmptyString(value: unknown, label: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    fail(`${label} must be a non-empty string`);
  }
  return value;
}

function safeInteger(value: unknown, min: number, max: number, label: string): number {
  if (!Number.isSafeInteger(value) || (value as number) < min || (value as number) > max) {
    fail(`${label} must be a safe integer in [${min}, ${max}]`);
  }
  return value as number;
}

function positiveFinite(value: unknown, label: string): number {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    value <= 0 ||
    value > Number.MAX_SAFE_INTEGER
  ) {
    fail(`${label} must be finite, positive, and no greater than Number.MAX_SAFE_INTEGER`);
  }
  return value;
}

function nonnegativeFinite(value: unknown, label: string): number {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    value < 0 ||
    value > Number.MAX_SAFE_INTEGER
  ) {
    fail(`${label} must be finite, nonnegative, and no greater than Number.MAX_SAFE_INTEGER`);
  }
  return value;
}

function checkedAdd(values: readonly number[], label: string): number {
  let total = 0;
  for (const value of values) {
    if (total > Number.MAX_SAFE_INTEGER - value) fail(`${label} exceeds the safe-integer range`);
    total += value;
  }
  return total;
}

function checkedProduct(values: readonly number[], limit: number, label: string): number {
  let product = 1;
  for (const value of values) {
    if (value !== 0 && product > Math.floor(limit / value)) fail(`${label} exceeds ${limit}`);
    product *= value;
  }
  return product;
}

function sha256(value: unknown, label: string): string {
  if (typeof value !== "string" || !/^[0-9a-f]{64}$/u.test(value)) {
    fail(`${label} must be a lowercase 64-character SHA-256 digest`);
  }
  return value;
}

function strictIsoTimestamp(value: unknown): string {
  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u.test(value)
  ) {
    fail("recordedAt must be an ISO 8601 UTC timestamp with millisecond precision");
  }
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp) || new Date(timestamp).toISOString() !== value) {
    fail("recordedAt must name a real ISO 8601 UTC instant");
  }
  return value;
}

/**
 * Accept only paths whose resolution is intrinsically same-origin. An absolute origin cannot be
 * authenticated from an offline JSON decoder, so v1 deliberately permits root-relative and
 * relative references and rejects every scheme, protocol-relative authority, and credential form.
 */
function mediaUrl(value: unknown, label: string): string {
  if (
    typeof value !== "string" ||
    value === "" ||
    value !== value.trim() ||
    /[\u0000-\u001f\u007f\\]/u.test(value) ||
    value.startsWith("//") ||
    /^[A-Za-z][A-Za-z\d+.-]*:/u.test(value)
  ) {
    fail(`${label} must be a same-origin root-relative or relative URL without credentials`);
  }
  let parsed: URL;
  try {
    parsed = new URL(value, "https://gutcheck-comparison.invalid/base/");
  } catch {
    fail(`${label} must be a valid URL`);
  }
  if (
    parsed.origin !== "https://gutcheck-comparison.invalid" ||
    parsed.username !== "" ||
    parsed.password !== ""
  ) {
    fail(`${label} must be a same-origin root-relative or relative URL without credentials`);
  }
  return value;
}

function validateDims(value: unknown): GrowthComparisonDims {
  const object = record(value, "run.dims");
  exactKeys(object, ["nx", "ny", "nz"], "run.dims");
  const dims = {
    nx: safeInteger(object["nx"], 1, UINT32_MAX, "run.dims.nx"),
    ny: safeInteger(object["ny"], 1, UINT32_MAX, "run.dims.ny"),
    nz: safeInteger(object["nz"], 1, UINT32_MAX, "run.dims.nz"),
  };
  checkedProduct([dims.nx, dims.ny, dims.nz], UINT32_CELL_CAP, "run lattice cell count");
  return dims;
}

function validateRun(value: unknown): GrowthComparisonRun {
  const object = record(value, "run");
  exactKeys(
    object,
    [
      "label",
      "preset",
      "dims",
      "domain",
      "rngSeed",
      "noiseEpsilon",
      "firstTick",
      "finalTick",
      "tickInterval",
    ],
    "run",
  );
  const firstTick = safeInteger(object["firstTick"], 0, UINT32_MAX - 1, "run.firstTick");
  if (firstTick !== 0) fail("run.firstTick must be zero for the v1 Run B timeline");
  const finalTick = safeInteger(object["finalTick"], 1, UINT32_MAX - 1, "run.finalTick");
  const tickInterval = safeInteger(
    object["tickInterval"],
    1,
    UINT32_MAX - 1,
    "run.tickInterval",
  );
  if (finalTick <= firstTick) fail("run.finalTick must be greater than run.firstTick");
  if ((finalTick - firstTick) % tickInterval !== 0) {
    fail("run tick range must be evenly divisible by run.tickInterval");
  }
  const domain = object["domain"];
  if (domain !== "box" && domain !== "hexPrism") {
    fail("run.domain must be box or hexPrism");
  }
  const noiseEpsilon = object["noiseEpsilon"];
  if (
    typeof noiseEpsilon !== "number" ||
    !Number.isFinite(noiseEpsilon) ||
    noiseEpsilon < 0 ||
    noiseEpsilon > 1
  ) {
    fail("run.noiseEpsilon must be finite and in [0, 1]");
  }
  return {
    label: nonEmptyString(object["label"], "run.label"),
    preset: nonEmptyString(object["preset"], "run.preset"),
    dims: validateDims(object["dims"]),
    domain,
    rngSeed: safeInteger(object["rngSeed"], 0, UINT32_MAX, "run.rngSeed"),
    noiseEpsilon,
    firstTick,
    finalTick,
    tickInterval,
  };
}

function validateSourceIdentity(value: unknown, label: string): GrowthComparisonSourceIdentity {
  const object = record(value, label);
  exactKeys(object, ["manifestSha256", "occupancySha256"], label);
  return {
    manifestSha256: sha256(object["manifestSha256"], `${label}.manifestSha256`),
    occupancySha256: sha256(object["occupancySha256"], `${label}.occupancySha256`),
  };
}

function expectedLegacyFrameCount(run: GrowthComparisonRun): number {
  return (run.finalTick - run.firstTick) / run.tickInterval + 1;
}

function validateSequence(
  value: unknown,
  label: string,
  expectedFrameCount: number,
): GrowthComparisonSequenceMeasurement {
  const object = record(value, label);
  exactKeys(
    object,
    ["frameBytes", "manifestBytes", "totalBytes", "frameCount", "generationSeconds"],
    label,
  );
  const frameBytes = safeInteger(object["frameBytes"], 1, Number.MAX_SAFE_INTEGER, `${label}.frameBytes`);
  const manifestBytes = safeInteger(
    object["manifestBytes"],
    1,
    Number.MAX_SAFE_INTEGER,
    `${label}.manifestBytes`,
  );
  const totalBytes = safeInteger(object["totalBytes"], 1, Number.MAX_SAFE_INTEGER, `${label}.totalBytes`);
  const measuredTotal = checkedAdd([frameBytes, manifestBytes], `${label} byte total`);
  if (totalBytes !== measuredTotal) {
    fail(`${label}.totalBytes must equal frameBytes plus manifestBytes`);
  }
  const frameCount = safeInteger(
    object["frameCount"],
    1,
    Number.MAX_SAFE_INTEGER,
    `${label}.frameCount`,
  );
  if (frameCount !== expectedFrameCount) {
    fail(`${label}.frameCount must equal the Run B tick-range count ${expectedFrameCount}`);
  }
  return {
    frameBytes,
    manifestBytes,
    totalBytes,
    frameCount,
    generationSeconds: positiveFinite(object["generationSeconds"], `${label}.generationSeconds`),
  };
}

function validatePoster(
  value: unknown,
  index: number,
  expectedTick: number,
): GrowthComparisonPosterReference {
  const label = `legacy.lightweightMedia.posters[${index}]`;
  const object = record(value, label);
  exactKeys(object, ["tick", "videoTimeSeconds", "url", "bytes", "sha256", "alt"], label);
  const tick = safeInteger(object["tick"], 0, UINT32_MAX - 1, `${label}.tick`);
  if (tick !== expectedTick) fail(`${label}.tick must be ${expectedTick}`);
  return {
    tick,
    videoTimeSeconds: nonnegativeFinite(object["videoTimeSeconds"], `${label}.videoTimeSeconds`),
    url: mediaUrl(object["url"], `${label}.url`),
    bytes: safeInteger(object["bytes"], 1, Number.MAX_SAFE_INTEGER, `${label}.bytes`),
    sha256: sha256(object["sha256"], `${label}.sha256`),
    alt: nonEmptyString(object["alt"], `${label}.alt`),
  };
}

function validateVideo(value: unknown): GrowthComparisonVideoReference {
  const label = "legacy.lightweightMedia.derivedVideo";
  const object = record(value, label);
  exactKeys(object, ["url", "bytes", "sha256", "durationSeconds", "frameCount"], label);
  return {
    url: mediaUrl(object["url"], `${label}.url`),
    bytes: safeInteger(object["bytes"], 1, Number.MAX_SAFE_INTEGER, `${label}.bytes`),
    sha256: sha256(object["sha256"], `${label}.sha256`),
    durationSeconds: positiveFinite(object["durationSeconds"], `${label}.durationSeconds`),
    frameCount: safeInteger(
      object["frameCount"],
      1,
      Number.MAX_SAFE_INTEGER,
      `${label}.frameCount`,
    ),
  };
}

function validateLightweightMedia(
  value: unknown,
  run: GrowthComparisonRun,
): GrowthComparisonLightweightMedia {
  const label = "legacy.lightweightMedia";
  const object = record(value, label);
  exactKeys(object, ["totalBytes", "posters", "derivedVideo"], label);
  const rawPosters = object["posters"];
  if (!Array.isArray(rawPosters) || rawPosters.length !== 3) {
    fail(`${label}.posters must contain exactly the first, midpoint, and final poster`);
  }
  const midpoint = run.firstTick + (run.finalTick - run.firstTick) / 2;
  if (!Number.isSafeInteger(midpoint)) {
    fail("run tick range must have an integer arithmetic midpoint for the three v1 posters");
  }
  const posters: GrowthComparisonPosterReferences = [
    validatePoster(rawPosters[0], 0, run.firstTick),
    validatePoster(rawPosters[1], 1, midpoint),
    validatePoster(rawPosters[2], 2, run.finalTick),
  ];
  const urls = posters.map((poster) => poster.url);
  if (new Set(urls).size !== urls.length) fail(`${label}.posters must use three distinct URLs`);
  const derivedVideo = validateVideo(object["derivedVideo"]);
  if (posters[0].videoTimeSeconds !== 0) {
    fail(`${label}.posters[0].videoTimeSeconds must be zero`);
  }
  if (
    posters[1].videoTimeSeconds <= posters[0].videoTimeSeconds ||
    posters[2].videoTimeSeconds <= posters[1].videoTimeSeconds
  ) {
    fail(`${label} poster video times must be strictly increasing`);
  }
  if (posters[2].videoTimeSeconds > derivedVideo.durationSeconds) {
    fail(`${label} final poster video time cannot exceed the derived video duration`);
  }
  const measuredTotal = checkedAdd(
    [derivedVideo.bytes, ...posters.map((poster) => poster.bytes)],
    `${label} byte total`,
  );
  const totalBytes = safeInteger(
    object["totalBytes"],
    1,
    Number.MAX_SAFE_INTEGER,
    `${label}.totalBytes`,
  );
  if (totalBytes !== measuredTotal) {
    fail(`${label}.totalBytes must equal the derived video and three poster byte counts`);
  }
  return { totalBytes, posters, derivedVideo };
}

function validateLegacy(value: unknown, run: GrowthComparisonRun): GrowthComparisonLegacy {
  const object = record(value, "legacy");
  exactKeys(
    object,
    ["format", "sourceIdentity", "rawSequence", "v2qSequence", "lightweightMedia"],
    "legacy",
  );
  if (object["format"] !== "gutcheck-anim-v1") {
    fail("legacy.format must be gutcheck-anim-v1");
  }
  const frameCount = expectedLegacyFrameCount(run);
  return {
    format: "gutcheck-anim-v1",
    sourceIdentity: validateSourceIdentity(object["sourceIdentity"], "legacy.sourceIdentity"),
    rawSequence: validateSequence(object["rawSequence"], "legacy.rawSequence", frameCount),
    v2qSequence: validateSequence(object["v2qSequence"], "legacy.v2qSequence", frameCount),
    lightweightMedia: validateLightweightMedia(object["lightweightMedia"], run),
  };
}

function validateAsset(value: unknown): GrowthComparisonAssetReference {
  const object = record(value, "compact.asset");
  exactKeys(object, ["url", "bytes", "sha256"], "compact.asset");
  return {
    url: mediaUrl(object["url"], "compact.asset.url"),
    bytes: safeInteger(object["bytes"], 1, Number.MAX_SAFE_INTEGER, "compact.asset.bytes"),
    sha256: sha256(object["sha256"], "compact.asset.sha256"),
  };
}

function validateCrop(
  value: unknown,
  dims: GrowthComparisonDims,
  eventCount: number,
): GrowthComparisonCrop {
  const object = record(value, "compact.crop");
  exactKeys(
    object,
    [
      "iMin",
      "iMax",
      "jMin",
      "jMax",
      "kMin",
      "kMax",
      "padding",
      "sampleCount",
      "r32uiBytes",
    ],
    "compact.crop",
  );
  const crop = {
    iMin: safeInteger(object["iMin"], 0, dims.nx - 1, "compact.crop.iMin"),
    iMax: safeInteger(object["iMax"], 0, dims.nx - 1, "compact.crop.iMax"),
    jMin: safeInteger(object["jMin"], 0, dims.ny - 1, "compact.crop.jMin"),
    jMax: safeInteger(object["jMax"], 0, dims.ny - 1, "compact.crop.jMax"),
    kMin: safeInteger(object["kMin"], 0, dims.nz - 1, "compact.crop.kMin"),
    kMax: safeInteger(object["kMax"], 0, dims.nz - 1, "compact.crop.kMax"),
    padding: safeInteger(object["padding"], 2, UINT32_MAX, "compact.crop.padding"),
  };
  if (crop.iMin > crop.iMax || crop.jMin > crop.jMax || crop.kMin > crop.kMax) {
    fail("compact.crop minima must not exceed maxima");
  }
  const measuredSamples = checkedProduct(
    [
      crop.iMax - crop.iMin + 1,
      crop.jMax - crop.jMin + 1,
      crop.kMax - crop.kMin + 1,
    ],
    Number.MAX_SAFE_INTEGER,
    "compact.crop sample count",
  );
  const sampleCount = safeInteger(
    object["sampleCount"],
    1,
    Number.MAX_SAFE_INTEGER,
    "compact.crop.sampleCount",
  );
  if (sampleCount !== measuredSamples) {
    fail("compact.crop.sampleCount must equal the inclusive crop-dimension product");
  }
  if (eventCount > sampleCount) {
    fail("compact.eventCount cannot exceed compact.crop.sampleCount");
  }
  const measuredR32uiBytes = checkedProduct(
    [sampleCount, R32UI_BYTES_PER_SAMPLE],
    Number.MAX_SAFE_INTEGER,
    "compact.crop R32UI bytes",
  );
  const r32uiBytes = safeInteger(
    object["r32uiBytes"],
    1,
    Number.MAX_SAFE_INTEGER,
    "compact.crop.r32uiBytes",
  );
  if (r32uiBytes !== measuredR32uiBytes) {
    fail("compact.crop.r32uiBytes must equal sampleCount times four bytes");
  }
  return { ...crop, sampleCount, r32uiBytes };
}

function validateCompact(value: unknown, run: GrowthComparisonRun): GrowthComparisonCompact {
  const object = record(value, "compact");
  exactKeys(
    object,
    [
      "format",
      "sourceIdentity",
      "asset",
      "bakeElapsedSeconds",
      "eventCount",
      "firstTick",
      "finalTick",
      "crop",
    ],
    "compact",
  );
  if (object["format"] !== "gutcheck-growth-v1") {
    fail("compact.format must be gutcheck-growth-v1");
  }
  const firstTick = safeInteger(object["firstTick"], 0, UINT32_MAX - 1, "compact.firstTick");
  const finalTick = safeInteger(object["finalTick"], 0, UINT32_MAX - 1, "compact.finalTick");
  if (firstTick !== run.firstTick || finalTick !== run.finalTick) {
    fail("compact first/final ticks must match the shared Run B tick range");
  }
  const eventCount = safeInteger(
    object["eventCount"],
    1,
    Number.MAX_SAFE_INTEGER,
    "compact.eventCount",
  );
  const asset = validateAsset(object["asset"]);
  const minimumAssetBytes = checkedAdd(
    [MIN_COMPACT_HEADER_PREFIX_BYTES, checkedProduct([eventCount, COMPACT_EVENT_BYTES], Number.MAX_SAFE_INTEGER, "compact event payload bytes")],
    "compact minimum asset bytes",
  );
  if (asset.bytes < minimumAssetBytes) {
    fail("compact.asset.bytes is too small to contain its declared event payload and header");
  }
  return {
    format: "gutcheck-growth-v1",
    sourceIdentity: validateSourceIdentity(object["sourceIdentity"], "compact.sourceIdentity"),
    asset,
    bakeElapsedSeconds: positiveFinite(object["bakeElapsedSeconds"], "compact.bakeElapsedSeconds"),
    eventCount,
    firstTick,
    finalTick,
    crop: validateCrop(object["crop"], run.dims, eventCount),
  };
}

function assertRunBContract(recordValue: GrowthComparisonRecord): void {
  const { run, legacy, compact } = recordValue;
  if (
    run.label !== "Run B — G-G plate" ||
    run.preset !== "plate" ||
    run.dims.nx !== 1200 ||
    run.dims.ny !== 1200 ||
    run.dims.nz !== 48 ||
    run.domain !== "hexPrism" ||
    run.rngSeed !== 1 ||
    run.noiseEpsilon !== 0 ||
    run.firstTick !== 0 ||
    run.finalTick !== 70_000 ||
    run.tickInterval !== 100
  ) {
    fail("v1 is locked to the exact Run B plate configuration and 100-tick timeline");
  }
  if (
    legacy.sourceIdentity.manifestSha256 !== RUN_B_MANIFEST_SHA256 ||
    legacy.sourceIdentity.occupancySha256 !== RUN_B_OCCUPANCY_SHA256
  ) {
    fail("v1 source identity must equal the pinned Run B manifest and occupancy digests");
  }
  const raw = legacy.rawSequence;
  if (
    raw.frameBytes !== 9_986_535_068 ||
    raw.manifestBytes !== 97_503 ||
    raw.totalBytes !== 9_986_632_571 ||
    raw.frameCount !== 701 ||
    raw.generationSeconds !== 41_194
  ) {
    fail("v1 raw sequence measurements must equal the pinned Run B manifest bytes and runtime");
  }
  const v2q = legacy.v2qSequence;
  if (
    v2q.frameBytes !== 6_622_097_200 ||
    v2q.manifestBytes !== 97_503 ||
    v2q.totalBytes !== 6_622_194_703 ||
    v2q.frameCount !== 701 ||
    v2q.generationSeconds !== 25
  ) {
    fail("v1 quantized sequence measurements must equal the pinned Run B bytes and runtime");
  }
  const video = legacy.lightweightMedia.derivedVideo;
  if (
    video.bytes !== 5_592_795 ||
    video.sha256 !== RUN_B_VIDEO_SHA256 ||
    video.durationSeconds !== 16 ||
    video.frameCount !== 480
  ) {
    fail("v1 derived video must equal the pinned Run B viewing derivative");
  }
  if (
    compact.eventCount !== 961_597 ||
    compact.firstTick !== 0 ||
    compact.finalTick !== 70_000 ||
    compact.crop.iMin !== 304 || compact.crop.iMax !== 896 ||
    compact.crop.jMin !== 304 || compact.crop.jMax !== 896 ||
    compact.crop.kMin !== 16 || compact.crop.kMax !== 32 ||
    compact.crop.padding !== 2 ||
    compact.crop.sampleCount !== 5_978_033 ||
    compact.crop.r32uiBytes !== 23_912_132
  ) {
    fail("v1 compact measurements must equal the pinned Run B endpoint and padded crop");
  }
}

function sameSourceIdentity(
  left: GrowthComparisonSourceIdentity,
  right: GrowthComparisonSourceIdentity,
): boolean {
  return (
    left.manifestSha256 === right.manifestSha256 &&
    left.occupancySha256 === right.occupancySha256
  );
}

/** Validate and copy an untrusted JSON value into the exact v1 comparison-record contract. */
export function decodeGrowthComparisonRecord(value: unknown): GrowthComparisonRecord {
  const object = record(value, "record");
  exactKeys(object, ["format", "recordedAt", "run", "legacy", "compact"], "record");
  if (object["format"] !== GUTCHECK_GROWTH_COMPARISON_FORMAT) {
    fail(`format must be ${GUTCHECK_GROWTH_COMPARISON_FORMAT}`);
  }
  const run = validateRun(object["run"]);
  const legacy = validateLegacy(object["legacy"], run);
  const compact = validateCompact(object["compact"], run);
  if (!sameSourceIdentity(legacy.sourceIdentity, compact.sourceIdentity)) {
    fail("legacy and compact source identities must match exactly");
  }
  const decoded: GrowthComparisonRecord = {
    format: GUTCHECK_GROWTH_COMPARISON_FORMAT,
    recordedAt: strictIsoTimestamp(object["recordedAt"]),
    run,
    legacy,
    compact,
  };
  assertRunBContract(decoded);
  return decoded;
}
