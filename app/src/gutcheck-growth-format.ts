// Compact, browser-safe G-G attachment-history format for the gutcheck replay. The file is
// intentionally independent of Three.js and Node APIs so the offline baker and browser viewer
// share one strict interpretation of the bytes.

export const GUTCHECK_GROWTH_FORMAT = "gutcheck-growth-v1" as const;
export const GUTCHECK_GROWTH_NEVER_TICK = 0xffff_ffff;
export const GUTCHECK_GROWTH_MAX_TICK = GUTCHECK_GROWTH_NEVER_TICK - 1;
export const GUTCHECK_GROWTH_MIN_PADDING = 2;
export const GUTCHECK_GROWTH_MAX_HEADER_BYTES = 1024 * 1024;
export const GUTCHECK_GROWTH_MAX_EVENTS = 8 * 1024 * 1024;
export const GUTCHECK_GROWTH_MAX_VOLUME_CELLS = 128 * 1024 * 1024;

const UINT32_MAX = 0xffff_ffff;
const UINT32_CELL_CAP = UINT32_MAX + 1;
const EVENT_BYTES = 8;

export type GrowthDomain = "box" | "hexPrism";
export type GrowthFarField = "reflecting" | "dirichlet";
export type GrowthTerminationReason = "tick-cap" | "far-field" | "domain-contact";
export type GrowthVec3 = readonly [number, number, number];
export type GrowthJson =
  | null
  | boolean
  | number
  | string
  | readonly GrowthJson[]
  | { readonly [key: string]: GrowthJson };

export interface GrowthDims {
  readonly nx: number;
  readonly ny: number;
  readonly nz: number;
}

/** Slot zero is unused by G-G and is serialized as null because JSON has no NaN value. */
export type GrowthParamVector = readonly (number | null)[];

export interface GrowthParamsJson {
  readonly rho: number;
  readonly phi: number;
  readonly kappa: GrowthParamVector;
  readonly mu: GrowthParamVector;
  readonly ggThreshBeta: GrowthParamVector;
}

export interface GrowthReplayConfig {
  readonly preset: string;
  readonly dims: GrowthDims;
  readonly domain: GrowthDomain;
  readonly tickCap: number;
  readonly rngSeed: number;
  readonly noiseEpsilon: number;
  readonly farField: GrowthFarField;
  readonly seedRadius: number;
  readonly seedThickness: number;
  readonly center: GrowthVec3;
  readonly params: GrowthParamsJson;
}

export interface GrowthCrop {
  readonly iMin: number;
  readonly iMax: number;
  readonly jMin: number;
  readonly jMax: number;
  readonly kMin: number;
  readonly kMax: number;
  /** Empty lattice samples required between the event bounds and every crop face. */
  readonly padding: number;
}

export interface GrowthLatticeDescription {
  readonly indexOrder: "i-fastest-j-next-k-slowest";
  readonly embedding: "x=i+j/2;y=sqrt(3)*j/2;z=k";
}

export const GUTCHECK_GROWTH_LATTICE: GrowthLatticeDescription = Object.freeze({
  indexOrder: "i-fastest-j-next-k-slowest",
  embedding: "x=i+j/2;y=sqrt(3)*j/2;z=k",
});

export interface GrowthSourceProvenance {
  readonly label: string;
  readonly [key: string]: GrowthJson;
}

export interface GrowthHeaderV1 {
  readonly format: typeof GUTCHECK_GROWTH_FORMAT;
  readonly eventCount: number;
  readonly attachedCount: number;
  readonly seedCount: number;
  readonly finalTick: number;
  readonly terminationReason: GrowthTerminationReason;
  readonly config: GrowthReplayConfig;
  readonly lattice: GrowthLatticeDescription;
  readonly crop: GrowthCrop;
  readonly source: GrowthSourceProvenance;
}

export interface GrowthEventColumns {
  readonly flatIndices: ArrayLike<number>;
  readonly attachTicks: ArrayLike<number>;
}

export interface DecodedGrowthAsset {
  readonly header: GrowthHeaderV1;
  readonly flatIndices: Uint32Array;
  readonly attachTicks: Uint32Array;
}

/** Exact attachment ticks for the web renderer; UINT32_MAX exclusively means never attached. */
export interface DenseExactGrowthVolume {
  readonly data: Uint32Array;
  readonly crop: GrowthCrop;
  readonly size: GrowthVec3;
  readonly finalTick: number;
  readonly neverTick: typeof GUTCHECK_GROWTH_NEVER_TICK;
}

const isRecord = (value: unknown): value is Record<string, unknown> => {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value) as unknown;
  return prototype === Object.prototype || prototype === null;
};

function fail(message: string): never {
  throw new Error(`gutcheck growth: ${message}`);
}

function exactKeys(value: Record<string, unknown>, expected: readonly string[], label: string): void {
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  if (actual.length !== wanted.length || actual.some((key, index) => key !== wanted[index])) {
    fail(`${label} keys must be exactly ${wanted.join(", ")}`);
  }
}

function integerInRange(value: unknown, min: number, max: number, label: string): number {
  if (!Number.isSafeInteger(value) || (value as number) < min || (value as number) > max) {
    fail(`${label} must be an integer in [${min}, ${max}]`);
  }
  return value as number;
}

function finiteInRange(
  value: unknown,
  min: number,
  max: number,
  label: string,
  minInclusive = true,
  maxInclusive = true,
): number {
  if (typeof value !== "number" || !Number.isFinite(value)) fail(`${label} must be finite`);
  if ((minInclusive ? value < min : value <= min) || (maxInclusive ? value > max : value >= max)) {
    fail(`${label} is outside its allowed range`);
  }
  return value;
}

function nonEmptyString(value: unknown, label: string): string {
  if (typeof value !== "string" || value.trim() === "") fail(`${label} must be a non-empty string`);
  return value;
}

function checkedProduct(values: readonly number[], limit: number, label: string): number {
  let product = 1;
  for (const value of values) {
    if (value !== 0 && product > Math.floor(limit / value)) fail(`${label} exceeds ${limit}`);
    product *= value;
  }
  return product;
}

function validateDims(value: unknown): GrowthDims {
  if (!isRecord(value)) fail("config.dims must be an object");
  exactKeys(value, ["nx", "ny", "nz"], "config.dims");
  const dims = {
    nx: integerInRange(value["nx"], 1, UINT32_MAX, "config.dims.nx"),
    ny: integerInRange(value["ny"], 1, UINT32_MAX, "config.dims.ny"),
    nz: integerInRange(value["nz"], 1, UINT32_MAX, "config.dims.nz"),
  };
  checkedProduct([dims.nx, dims.ny, dims.nz], UINT32_CELL_CAP, "lattice cell count");
  return dims;
}

function validateVector(
  value: unknown,
  label: string,
  range: readonly [number, number],
  positive: boolean,
): GrowthParamVector {
  if (!Array.isArray(value) || value.length !== 8) fail(`${label} must be a plain length-8 array`);
  if (value[0] !== null) fail(`${label}[0] must be null for the unused G-G slot`);
  for (let slot = 1; slot < value.length; slot++) {
    const item = value[slot];
    if (positive) finiteInRange(item, 0, Number.MAX_VALUE, `${label}[${slot}]`, false);
    else finiteInRange(item, range[0], range[1], `${label}[${slot}]`);
  }
  return value as GrowthParamVector;
}

function validateParams(value: unknown): GrowthParamsJson {
  if (!isRecord(value)) fail("config.params must be an object");
  exactKeys(value, ["rho", "phi", "kappa", "mu", "ggThreshBeta"], "config.params");
  return {
    rho: finiteInRange(value["rho"], 0, Number.MAX_VALUE, "config.params.rho", false),
    phi: finiteInRange(value["phi"], 0, 1, "config.params.phi", true, false),
    kappa: validateVector(value["kappa"], "config.params.kappa", [0, 1], false),
    mu: validateVector(value["mu"], "config.params.mu", [0, 1], false),
    ggThreshBeta: validateVector(
      value["ggThreshBeta"],
      "config.params.ggThreshBeta",
      [0, Number.MAX_VALUE],
      true,
    ),
  };
}

function validateVec3(value: unknown, dims: GrowthDims, label: string): GrowthVec3 {
  if (!Array.isArray(value) || value.length !== 3) fail(`${label} must be a three-number array`);
  return [
    integerInRange(value[0], 0, dims.nx - 1, `${label}[0]`),
    integerInRange(value[1], 0, dims.ny - 1, `${label}[1]`),
    integerInRange(value[2], 0, dims.nz - 1, `${label}[2]`),
  ];
}

function validateConfig(value: unknown): GrowthReplayConfig {
  if (!isRecord(value)) fail("config must be an object");
  exactKeys(
    value,
    [
      "preset",
      "dims",
      "domain",
      "tickCap",
      "rngSeed",
      "noiseEpsilon",
      "farField",
      "seedRadius",
      "seedThickness",
      "center",
      "params",
    ],
    "config",
  );
  const dims = validateDims(value["dims"]);
  const domain = value["domain"];
  if (domain !== "box" && domain !== "hexPrism") fail("config.domain must be box or hexPrism");
  const farField = value["farField"];
  if (farField !== "reflecting" && farField !== "dirichlet") {
    fail("config.farField must be reflecting or dirichlet");
  }
  const seedThickness = integerInRange(
    value["seedThickness"],
    1,
    UINT32_MAX,
    "config.seedThickness",
  );
  if (seedThickness % 2 === 0) fail("config.seedThickness must be odd");
  return {
    preset: nonEmptyString(value["preset"], "config.preset"),
    dims,
    domain,
    tickCap: integerInRange(value["tickCap"], 1, GUTCHECK_GROWTH_MAX_TICK, "config.tickCap"),
    rngSeed: integerInRange(value["rngSeed"], 0, UINT32_MAX, "config.rngSeed"),
    noiseEpsilon: finiteInRange(value["noiseEpsilon"], 0, 1, "config.noiseEpsilon"),
    farField,
    seedRadius: integerInRange(value["seedRadius"], 0, UINT32_MAX, "config.seedRadius"),
    seedThickness,
    center: validateVec3(value["center"], dims, "config.center"),
    params: validateParams(value["params"]),
  };
}

function validateCrop(value: unknown, dims: GrowthDims): GrowthCrop {
  if (!isRecord(value)) fail("crop must be an object");
  exactKeys(value, ["iMin", "iMax", "jMin", "jMax", "kMin", "kMax", "padding"], "crop");
  const crop = {
    iMin: integerInRange(value["iMin"], 0, dims.nx - 1, "crop.iMin"),
    iMax: integerInRange(value["iMax"], 0, dims.nx - 1, "crop.iMax"),
    jMin: integerInRange(value["jMin"], 0, dims.ny - 1, "crop.jMin"),
    jMax: integerInRange(value["jMax"], 0, dims.ny - 1, "crop.jMax"),
    kMin: integerInRange(value["kMin"], 0, dims.nz - 1, "crop.kMin"),
    kMax: integerInRange(value["kMax"], 0, dims.nz - 1, "crop.kMax"),
    padding: integerInRange(value["padding"], GUTCHECK_GROWTH_MIN_PADDING, UINT32_MAX, "crop.padding"),
  };
  if (crop.iMin > crop.iMax || crop.jMin > crop.jMax || crop.kMin > crop.kMax) {
    fail("crop minima must not exceed maxima");
  }
  checkedProduct(growthCropSize(crop), GUTCHECK_GROWTH_MAX_VOLUME_CELLS, "decoded volume cell count");
  return crop;
}

function canonicalJson(value: unknown): string {
  if (value === null || typeof value === "boolean" || typeof value === "string") {
    return JSON.stringify(value);
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) fail("header contains a non-finite number");
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) return `[${value.map((item) => canonicalJson(item)).join(",")}]`;
  if (isRecord(value)) {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`)
      .join(",")}}`;
  }
  fail(`header contains unsupported JSON value ${typeof value}`);
}

function validateHeader(value: unknown): GrowthHeaderV1 {
  if (!isRecord(value)) fail("header must be an object");
  exactKeys(
    value,
    [
      "format",
      "eventCount",
      "attachedCount",
      "seedCount",
      "finalTick",
      "terminationReason",
      "config",
      "lattice",
      "crop",
      "source",
    ],
    "header",
  );
  if (value["format"] !== GUTCHECK_GROWTH_FORMAT) fail(`format must be ${GUTCHECK_GROWTH_FORMAT}`);
  const eventCount = integerInRange(value["eventCount"], 1, GUTCHECK_GROWTH_MAX_EVENTS, "eventCount");
  const attachedCount = integerInRange(
    value["attachedCount"],
    1,
    GUTCHECK_GROWTH_MAX_EVENTS,
    "attachedCount",
  );
  if (attachedCount !== eventCount) fail("attachedCount must equal eventCount");
  const seedCount = integerInRange(value["seedCount"], 1, eventCount, "seedCount");
  const finalTick = integerInRange(value["finalTick"], 0, GUTCHECK_GROWTH_MAX_TICK, "finalTick");
  const terminationReason = value["terminationReason"];
  if (
    terminationReason !== "tick-cap" &&
    terminationReason !== "far-field" &&
    terminationReason !== "domain-contact"
  ) {
    fail("terminationReason is not recognized");
  }
  const config = validateConfig(value["config"]);
  if (finalTick > config.tickCap) fail("finalTick exceeds config.tickCap");
  if (terminationReason === "tick-cap" && finalTick !== config.tickCap) {
    fail("tick-cap termination requires finalTick to equal config.tickCap");
  }
  const lattice = value["lattice"];
  if (!isRecord(lattice)) fail("lattice must be an object");
  exactKeys(lattice, ["indexOrder", "embedding"], "lattice");
  if (
    lattice["indexOrder"] !== GUTCHECK_GROWTH_LATTICE.indexOrder ||
    lattice["embedding"] !== GUTCHECK_GROWTH_LATTICE.embedding
  ) {
    fail("lattice description does not match the v1 contract");
  }
  const crop = validateCrop(value["crop"], config.dims);
  const source = value["source"];
  if (!isRecord(source)) fail("source must be an object");
  nonEmptyString(source["label"], "source.label");
  // This also rejects undefined, symbols, typed arrays, and non-finite source numbers while
  // deliberately retaining arbitrary JSON provenance fields for later comparisons.
  canonicalJson(source);
  return {
    format: GUTCHECK_GROWTH_FORMAT,
    eventCount,
    attachedCount,
    seedCount,
    finalTick,
    terminationReason,
    config,
    lattice: GUTCHECK_GROWTH_LATTICE,
    crop,
    source: source as GrowthSourceProvenance,
  };
}

export function growthCellCount(dims: GrowthDims): number {
  return checkedProduct([dims.nx, dims.ny, dims.nz], UINT32_CELL_CAP, "lattice cell count");
}

export function growthFlatIndex(dims: GrowthDims, i: number, j: number, k: number): number {
  if (
    !Number.isSafeInteger(i) ||
    !Number.isSafeInteger(j) ||
    !Number.isSafeInteger(k) ||
    i < 0 ||
    i >= dims.nx ||
    j < 0 ||
    j >= dims.ny ||
    k < 0 ||
    k >= dims.nz
  ) {
    fail("lattice coordinates are out of range");
  }
  return k * dims.nx * dims.ny + j * dims.nx + i;
}

export function growthLatticeCoordinates(dims: GrowthDims, flatIndex: number): GrowthVec3 {
  const count = growthCellCount(dims);
  integerInRange(flatIndex, 0, count - 1, "flat index");
  const plane = dims.nx * dims.ny;
  const k = Math.floor(flatIndex / plane);
  const withinPlane = flatIndex - k * plane;
  const j = Math.floor(withinPlane / dims.nx);
  return [withinPlane - j * dims.nx, j, k];
}

function hexDistance(di: number, dj: number): number {
  return (Math.abs(di) + Math.abs(dj) + Math.abs(di + dj)) / 2;
}

export function growthSiteIsActive(config: GrowthReplayConfig, flatIndex: number): boolean {
  const [i, j, k] = growthLatticeCoordinates(config.dims, flatIndex);
  if (config.domain === "box") return true;
  const [ic, jc, kc] = config.center;
  const radius = Math.min(ic, config.dims.nx - 1 - ic, jc, config.dims.ny - 1 - jc);
  const halfZ = Math.min(kc, config.dims.nz - 1 - kc);
  return hexDistance(i - ic, j - jc) <= radius && Math.abs(k - kc) <= halfZ;
}

function expectedSeedIndices(config: GrowthReplayConfig): number[] {
  const [ic, jc, kc] = config.center;
  const half = (config.seedThickness - 1) / 2;
  const result: number[] = [];
  for (let k = kc - half; k <= kc + half; k++) {
    if (k < 0 || k >= config.dims.nz) fail("configured seed does not fit the z domain");
    for (let dj = -config.seedRadius; dj <= config.seedRadius; dj++) {
      for (let di = -config.seedRadius; di <= config.seedRadius; di++) {
        if (hexDistance(di, dj) > config.seedRadius) continue;
        const i = ic + di;
        const j = jc + dj;
        if (i < 0 || i >= config.dims.nx || j < 0 || j >= config.dims.ny) {
          fail("configured seed does not fit the xy domain");
        }
        const index = growthFlatIndex(config.dims, i, j, k);
        if (!growthSiteIsActive(config, index)) fail("configured seed enters an inactive domain wall");
        result.push(index);
      }
    }
  }
  result.sort((left, right) => left - right);
  return result;
}

export function buildPaddedGrowthCrop(
  flatIndices: ArrayLike<number>,
  dims: GrowthDims,
  padding = GUTCHECK_GROWTH_MIN_PADDING,
): GrowthCrop {
  const count = growthCellCount(dims);
  integerInRange(padding, GUTCHECK_GROWTH_MIN_PADDING, UINT32_MAX, "crop padding");
  if (!Number.isSafeInteger(flatIndices.length) || flatIndices.length < 1) {
    fail("at least one event is required to build a crop");
  }
  let iMin = Infinity;
  let iMax = -Infinity;
  let jMin = Infinity;
  let jMax = -Infinity;
  let kMin = Infinity;
  let kMax = -Infinity;
  for (let event = 0; event < flatIndices.length; event++) {
    const index = integerInRange(flatIndices[event], 0, count - 1, `flatIndices[${event}]`);
    const [i, j, k] = growthLatticeCoordinates(dims, index);
    iMin = Math.min(iMin, i);
    iMax = Math.max(iMax, i);
    jMin = Math.min(jMin, j);
    jMax = Math.max(jMax, j);
    kMin = Math.min(kMin, k);
    kMax = Math.max(kMax, k);
  }
  if (
    iMin < padding ||
    jMin < padding ||
    kMin < padding ||
    iMax + padding >= dims.nx ||
    jMax + padding >= dims.ny ||
    kMax + padding >= dims.nz
  ) {
    fail(`event bounds cannot retain ${padding} empty crop-padding cells on every face`);
  }
  const crop = {
    iMin: iMin - padding,
    iMax: iMax + padding,
    jMin: jMin - padding,
    jMax: jMax + padding,
    kMin: kMin - padding,
    kMax: kMax + padding,
    padding,
  };
  checkedProduct(growthCropSize(crop), GUTCHECK_GROWTH_MAX_VOLUME_CELLS, "decoded volume cell count");
  return crop;
}

export function growthCropSize(crop: GrowthCrop): GrowthVec3 {
  return [crop.iMax - crop.iMin + 1, crop.jMax - crop.jMin + 1, crop.kMax - crop.kMin + 1];
}

function sameCrop(left: GrowthCrop, right: GrowthCrop): boolean {
  return (
    left.iMin === right.iMin &&
    left.iMax === right.iMax &&
    left.jMin === right.jMin &&
    left.jMax === right.jMax &&
    left.kMin === right.kMin &&
    left.kMax === right.kMax &&
    left.padding === right.padding
  );
}

function copyEventColumns(columns: GrowthEventColumns): {
  flatIndices: Uint32Array;
  attachTicks: Uint32Array;
} {
  const length = columns.flatIndices.length;
  if (!Number.isSafeInteger(length) || length < 0 || columns.attachTicks.length !== length) {
    fail("event columns must have equal safe-integer lengths");
  }
  if (length > GUTCHECK_GROWTH_MAX_EVENTS) fail("event count exceeds the decoder allocation limit");
  const flatIndices = new Uint32Array(length);
  const attachTicks = new Uint32Array(length);
  for (let event = 0; event < length; event++) {
    flatIndices[event] = integerInRange(
      columns.flatIndices[event],
      0,
      UINT32_MAX,
      `flatIndices[${event}]`,
    );
    attachTicks[event] = integerInRange(
      columns.attachTicks[event],
      0,
      GUTCHECK_GROWTH_MAX_TICK,
      `attachTicks[${event}]`,
    );
  }
  return { flatIndices, attachTicks };
}

function validateEvents(
  header: GrowthHeaderV1,
  flatIndices: Uint32Array,
  attachTicks: Uint32Array,
): void {
  if (flatIndices.length !== header.eventCount || attachTicks.length !== header.eventCount) {
    fail("payload event count differs from the header");
  }
  const cellCount = growthCellCount(header.config.dims);
  let tickZeroCount = 0;
  let previousTick = -1;
  let previousIndex = -1;
  for (let event = 0; event < header.eventCount; event++) {
    const index = flatIndices[event];
    const tick = attachTicks[event];
    if (index >= cellCount) fail(`event ${event} flat index is outside the configured lattice`);
    if (!growthSiteIsActive(header.config, index)) fail(`event ${event} lies in an inactive domain wall`);
    if (tick > header.finalTick) fail(`event ${event} tick exceeds finalTick`);
    if (tick < previousTick || (tick === previousTick && index <= previousIndex)) {
      fail("events must be sorted by tick then strictly increasing flat index");
    }
    if (tick === 0) tickZeroCount++;
    previousTick = tick;
    previousIndex = index;
  }
  if (tickZeroCount !== header.seedCount) fail("seedCount differs from the number of tick-zero events");

  const expectedSeed = expectedSeedIndices(header.config);
  if (expectedSeed.length !== header.seedCount) fail("seedCount differs from the configured canonical seed");
  for (let event = 0; event < expectedSeed.length; event++) {
    if (attachTicks[event] !== 0 || flatIndices[event] !== expectedSeed[event]) {
      fail("tick-zero events do not equal the configured canonical seed");
    }
  }

  // Tick-major ordering cannot expose a duplicate index that reappears on a later tick. A
  // compact typed copy checks uniqueness without allocating a Set of a million boxed numbers.
  const sortedIndices = flatIndices.slice().sort();
  for (let event = 1; event < sortedIndices.length; event++) {
    if (sortedIndices[event] === sortedIndices[event - 1]) fail("event payload contains a duplicate flat index");
  }

  const derivedCrop = buildPaddedGrowthCrop(flatIndices, header.config.dims, header.crop.padding);
  if (!sameCrop(derivedCrop, header.crop)) fail("header crop differs from the event-derived padded crop");
}

export function encodeGrowthAsset(headerValue: GrowthHeaderV1, columns: GrowthEventColumns): Uint8Array {
  const header = validateHeader(headerValue);
  const copied = copyEventColumns(columns);
  validateEvents(header, copied.flatIndices, copied.attachTicks);
  const headerText = canonicalJson(header);
  const rawHeader = new TextEncoder().encode(headerText);
  const paddedHeaderLength = Math.ceil(rawHeader.length / 4) * 4;
  if (paddedHeaderLength < 1 || paddedHeaderLength > GUTCHECK_GROWTH_MAX_HEADER_BYTES) {
    fail("encoded header exceeds the header-size limit");
  }
  const totalBytes = 4 + paddedHeaderLength + header.eventCount * EVENT_BYTES;
  const bytes = new Uint8Array(totalBytes);
  bytes.fill(0x20, 4, 4 + paddedHeaderLength);
  bytes.set(rawHeader, 4);
  const view = new DataView(bytes.buffer);
  view.setUint32(0, paddedHeaderLength, true);
  let offset = 4 + paddedHeaderLength;
  for (let event = 0; event < header.eventCount; event++) {
    view.setUint32(offset, copied.flatIndices[event], true);
    view.setUint32(offset + 4, copied.attachTicks[event], true);
    offset += EVENT_BYTES;
  }
  return bytes;
}

function byteView(input: ArrayBuffer | Uint8Array): Uint8Array {
  return input instanceof Uint8Array ? input : new Uint8Array(input);
}

export function decodeGrowthAsset(input: ArrayBuffer | Uint8Array): DecodedGrowthAsset {
  const bytes = byteView(input);
  if (bytes.byteLength < 4) fail("file is shorter than the header-length word");
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const headerLength = view.getUint32(0, true);
  if (headerLength < 1 || headerLength % 4 !== 0) fail("padded header length must be a positive multiple of four");
  if (headerLength > GUTCHECK_GROWTH_MAX_HEADER_BYTES) fail("padded header exceeds the header-size limit");
  if (4 + headerLength > bytes.byteLength) fail("file is truncated inside the header");
  let headerText: string;
  try {
    headerText = new TextDecoder("utf-8", { fatal: true }).decode(bytes.subarray(4, 4 + headerLength));
  } catch {
    fail("header is not valid UTF-8");
  }
  const unpadded = headerText.replace(/ +$/u, "");
  if (unpadded === "" || headerText.slice(unpadded.length).split("").some((char) => char !== " ")) {
    fail("header padding must contain spaces only");
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(unpadded);
  } catch {
    fail("header is not valid JSON");
  }
  if (canonicalJson(parsed) !== unpadded) fail("header JSON is not canonical");
  const header = validateHeader(parsed);
  const expectedBytes = 4 + headerLength + header.eventCount * EVENT_BYTES;
  if (bytes.byteLength < expectedBytes) fail("file is truncated inside the event payload");
  if (bytes.byteLength > expectedBytes) fail("file has trailing bytes after the event payload");
  const flatIndices = new Uint32Array(header.eventCount);
  const attachTicks = new Uint32Array(header.eventCount);
  let offset = 4 + headerLength;
  for (let event = 0; event < header.eventCount; event++) {
    flatIndices[event] = view.getUint32(offset, true);
    attachTicks[event] = view.getUint32(offset + 4, true);
    offset += EVENT_BYTES;
  }
  validateEvents(header, flatIndices, attachTicks);
  return { header, flatIndices, attachTicks };
}

export function buildDenseExactTickVolume(asset: DecodedGrowthAsset): DenseExactGrowthVolume {
  const size = growthCropSize(asset.header.crop);
  const cells = checkedProduct(size, GUTCHECK_GROWTH_MAX_VOLUME_CELLS, "decoded volume cell count");
  const data = new Uint32Array(cells);
  data.fill(GUTCHECK_GROWTH_NEVER_TICK);
  for (let event = 0; event < asset.header.eventCount; event++) {
    const [i, j, k] = growthLatticeCoordinates(asset.header.config.dims, asset.flatIndices[event]);
    const offset = growthVolumeOffset(asset.header.crop, i, j, k);
    if (offset === null) fail(`event ${event} lies outside the decoded crop`);
    data[offset] = asset.attachTicks[event];
  }
  return {
    data,
    crop: asset.header.crop,
    size,
    finalTick: asset.header.finalTick,
    neverTick: GUTCHECK_GROWTH_NEVER_TICK,
  };
}

export function growthVolumeOffset(crop: GrowthCrop, i: number, j: number, k: number): number | null {
  if (i < crop.iMin || i > crop.iMax || j < crop.jMin || j > crop.jMax || k < crop.kMin || k > crop.kMax) {
    return null;
  }
  const [nx, ny] = growthCropSize(crop);
  return (k - crop.kMin) * nx * ny + (j - crop.jMin) * nx + (i - crop.iMin);
}

export function latticeToGrowthWorld(point: GrowthVec3): GrowthVec3 {
  return [point[0] + point[1] / 2, (Math.sqrt(3) * point[1]) / 2, point[2]];
}

export function growthWorldToLattice(point: GrowthVec3): GrowthVec3 {
  const j = (2 * point[1]) / Math.sqrt(3);
  return [point[0] - j / 2, j, point[2]];
}

/** Bounds of lattice sample centers, not prism-face or ray-box padding. */
export function growthCropSampleWorldBounds(crop: GrowthCrop): {
  readonly min: GrowthVec3;
  readonly max: GrowthVec3;
} {
  return {
    min: latticeToGrowthWorld([crop.iMin, crop.jMin, crop.kMin]),
    max: latticeToGrowthWorld([crop.iMax, crop.jMax, crop.kMax]),
  };
}

export interface GrowthPlayheadParts {
  readonly wholeTick: number;
  /** Fraction within a tick, or the post-final visual tail once wholeTick reaches finalTick. */
  readonly offsetTicks: number;
}

/** Split display time so the shader compares exact uint ticks before doing any float math. */
export function splitGrowthPlayhead(displayTick: number, finalTick: number): GrowthPlayheadParts {
  if (!Number.isFinite(displayTick)) fail("display tick must be finite");
  integerInRange(finalTick, 0, GUTCHECK_GROWTH_MAX_TICK, "final tick");
  const clampedDisplay = Math.max(0, displayTick);
  const wholeTick = Math.floor(Math.min(clampedDisplay, finalTick));
  return { wholeTick, offsetTicks: clampedDisplay - wholeTick };
}

export function growthRevealWeight(
  arrivalTick: number,
  playheadTick: number,
  transitionTicks: number,
): number {
  if (!(Number.isFinite(playheadTick) && Number.isFinite(transitionTicks) && transitionTicks >= 0)) {
    fail("reveal shadow inputs must be finite and transitionTicks non-negative");
  }
  if (arrivalTick === GUTCHECK_GROWTH_NEVER_TICK) return 0;
  integerInRange(arrivalTick, 0, GUTCHECK_GROWTH_MAX_TICK, "arrival tick");
  if (arrivalTick === 0) return playheadTick >= 0 ? 1 : 0;
  const age = playheadTick - arrivalTick;
  if (transitionTicks === 0) return age >= 0 ? 1 : 0;
  const t = Math.max(0, Math.min(1, age / transitionTicks));
  return t * t * (3 - 2 * t);
}

/** CPU shadow of the shader's D6h-equivariant triangular-prism reveal field. */
export function sampleGrowthReveal(
  volume: DenseExactGrowthVolume,
  latticePoint: GrowthVec3,
  playheadTick: number,
  transitionTicks: number,
): number {
  const i0 = Math.floor(latticePoint[0]);
  const j0 = Math.floor(latticePoint[1]);
  const k0 = Math.floor(latticePoint[2]);
  const fi = latticePoint[0] - i0;
  const fj = latticePoint[1] - j0;
  const fk = latticePoint[2] - k0;
  const at = (i: number, j: number, k: number): number => {
    const offset = growthVolumeOffset(volume.crop, i, j, k);
    const tick = offset === null ? GUTCHECK_GROWTH_NEVER_TICK : volume.data[offset];
    return growthRevealWeight(tick, playheadTick, transitionTicks);
  };
  const plane = (k: number): number => {
    const c00 = at(i0, j0, k);
    const c10 = at(i0 + 1, j0, k);
    const c01 = at(i0, j0 + 1, k);
    if (fi + fj <= 1) return c00 + (c10 - c00) * fi + (c01 - c00) * fj;
    const c11 = at(i0 + 1, j0 + 1, k);
    return c10 * (1 - fj) + c01 * (1 - fi) + c11 * (fi + fj - 1);
  };
  return plane(k0) * (1 - fk) + plane(k0 + 1) * fk;
}
