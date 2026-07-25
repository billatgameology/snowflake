// Phase 5 negative-control execution.
//
// Every registered control's named mutation is applied to the evidence it actually names — a
// comparison operand, a field-comparison statistic, an adapter or protocol manifest entry, a
// timing sample, a readback record, a checkpoint declaration, an events report, or a published
// artifact byte. No control flips a `*FailureCount` summary, and no control declares its own
// verdict.
//
// Ownership is then observed rather than asserted. The mutated capture's raw evidence is
// re-derived from its own payload artifacts and handed to the production criterion evaluator,
// and the recorded `failedCriteria` is exactly the set that evaluator refused. A control is
// only satisfied when that observed set contains its registered owner.
//
// The re-derivation mirrors the payload-graph recomputation in `gate5-evidence.ts`. That
// module's `validateFixturePayloadGraph` is private, so the counting rules are restated here;
// `assertPhase5CaptureRederivationAgrees` fails loudly if the restatement ever disagrees with
// an accepted capture's own declared raw evidence, so drift cannot silently make a control
// vacuous.

import { GG_PRESETS } from "@vcc/core";
import {
  canonicalJson,
  canonicalJsonBytes,
  sha256Bytes,
  strictJsonSnapshot,
  type StrictJson,
} from "./gate4-evidence.ts";
import type { Phase5FixtureCapture, Phase5LaneCapture } from "./gate5-evidence.ts";
import {
  evaluatePhase5Lane,
  failedPhase5Criteria,
  validatePhase5RawEvidence,
  type Phase5LaneRawEvidence,
  type Phase5NegativeControlMeasurement,
} from "./gate5-protocol.ts";
import {
  PHASE5_EXPECTED_WINDOWS_BACKEND,
  PHASE5_FIELD_TOLERANCES,
  PHASE5_FIXTURES,
  PHASE5_NEGATIVE_CONTROLS,
  PHASE5_PERFORMANCE,
  PHASE5_REQUIRED_LIMITS,
  PHASE5_SCALAR_TOLERANCES,
  type Phase5Criterion,
  type Phase5DiffusionFixture,
  type Phase5GGFixture,
  type Phase5LKFixture,
  type Phase5LayoutFixture,
} from "./phase5-protocol.ts";
import { phase5ComparisonPasses } from "./phase5-shadow.ts";

/** Backend label a relabelling probe would publish in place of the observed one. */
const RELABELLED_BACKEND = "Vulkan";
/** Endianness a shifted conversion declaration would publish. */
const SHIFTED_ENDIANNESS = "big-endian";
/** One flipped attachment bit is one mismatching member of the registered D6h orbit. */
const FLIPPED_ATTACHMENT_BIT_COUNT = 1;
/** How far past its frozen bound a bypassed blocking field comparison is pushed. */
const TOLERANCE_BYPASS_FACTOR = 10;
/** One tolerance bypass reported while a blocking comparison exceeds its frozen bound. */
const REPORTED_TOLERANCE_BYPASS_COUNT = 1;

/**
 * Controls whose mutation happens *after* the artifact index is sealed.
 *
 * Publication seals a digest per indexed artifact and then re-reads the bytes. A mutation made
 * before the seal is simply republished and verifies; only a post-publication byte change
 * leaves the sealed index disagreeing with the bytes. That distinction is the control's own
 * definition, so it is registered here rather than inferred.
 */
const PHASE5_SEALED_INDEX_CONTROL_IDS: ReadonlySet<string> = new Set([
  "NC-ARTIFACT-BYTE-MUTATION",
]);

export interface Phase5NegativeControlOutcome
  extends Phase5NegativeControlMeasurement {
  /** How the mutated evidence was refused, if it was. */
  readonly rejection: "criteria" | "structural" | "none";
  /** The structural refusal message, when the verifier threw instead of scoring. */
  readonly structuralReason: string | null;
  /** Whether the observed failing set contains this control's registered owner. */
  readonly ownerObserved: boolean;
}

type MutableJson = Record<string, unknown>;
type ReadonlyJsonObject = Readonly<Record<string, StrictJson>>;

function lexical(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function mutableObject(value: unknown, label: string): MutableJson {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
  return value as MutableJson;
}

function mutableArray(value: unknown, label: string): unknown[] {
  if (!Array.isArray(value)) throw new Error(`${label} must be an array`);
  return value as unknown[];
}

function mutableEntryNamed(
  values: readonly unknown[],
  name: string,
  label: string,
): MutableJson {
  for (const value of values) {
    const entry = mutableObject(value, label);
    if (entry.name === name) return entry;
  }
  throw new Error(`${label} omits ${name}`);
}

function readonlyObject(value: StrictJson, label: string): ReadonlyJsonObject {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
  return value as ReadonlyJsonObject;
}

function readonlyArray(value: StrictJson, label: string): readonly StrictJson[] {
  if (!Array.isArray(value)) throw new Error(`${label} must be an array`);
  return value;
}

function finiteNumber(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${label} must be a finite number`);
  }
  return value;
}

// ---------------------------------------------------------------------------
// Frozen fixture selectors
// ---------------------------------------------------------------------------

function blockingFrozenFixtures(): readonly (typeof PHASE5_FIXTURES)[number][] {
  return PHASE5_FIXTURES.filter((fixture) => fixture.blocking);
}

function frozenLayoutFixture(): Phase5LayoutFixture {
  const fixture = PHASE5_FIXTURES.find(
    (entry) => entry.kind === "layout" && entry.blocking,
  );
  if (fixture === undefined || fixture.kind !== "layout") {
    throw new Error("the frozen blocking layout fixture is absent");
  }
  return fixture;
}

function frozenDirichletDiffusionFixture(): Phase5DiffusionFixture {
  const fixture = PHASE5_FIXTURES.find(
    (entry) =>
      entry.kind === "diffusion" &&
      entry.blocking &&
      entry.farField === "dirichlet",
  );
  if (fixture === undefined || fixture.kind !== "diffusion") {
    throw new Error("the frozen blocking fixed-sigma diffusion fixture is absent");
  }
  return fixture;
}

function frozenReflectingGgFixture(): Phase5GGFixture {
  const fixture = PHASE5_FIXTURES.find(
    (entry) =>
      entry.kind === "gg" &&
      entry.blocking &&
      entry.farField === "reflecting" &&
      entry.noiseEpsilon === 0,
  );
  if (fixture === undefined || fixture.kind !== "gg") {
    throw new Error("the frozen blocking noise-off reflecting G-G fixture is absent");
  }
  return fixture;
}

function frozenDirichletLkFixture(): Phase5LKFixture {
  const fixture = PHASE5_FIXTURES.find(
    (entry) =>
      entry.kind === "lk" && entry.blocking && entry.farField === "dirichlet",
  );
  if (fixture === undefined || fixture.kind !== "lk") {
    throw new Error("the frozen blocking fixed-sigma LK fixture is absent");
  }
  return fixture;
}

function captureFixture(
  capture: Phase5LaneCapture,
  id: string,
): Phase5FixtureCapture {
  const fixture = capture.fixtures.find((entry) => entry.id === id);
  if (fixture === undefined) {
    throw new Error(`the capture omits the ${id} fixture payload`);
  }
  return fixture;
}

function captureComparison(
  capture: Phase5LaneCapture,
  id: string,
): MutableJson {
  return mutableObject(captureFixture(capture, id).comparison, `${id} comparison`);
}

// ---------------------------------------------------------------------------
// Registered index-mapping witnesses
// ---------------------------------------------------------------------------

/**
 * The shipped coordinate hash, restated here rather than imported.
 *
 * `runner` does not depend on `solver-gpu`, and a negative control that called the
 * implementation it is supposed to catch could not falsify it. The published
 * `layout.index-round-trip` operand digests exactly this per-cell hash sequence.
 */
function registeredCoordinateHash(i: number, j: number, k: number): number {
  return (
    (Math.imul(i, 73_856_093) ^
      Math.imul(j, 19_349_663) ^
      Math.imul(k, 83_492_791)) >>>
    0
  );
}

function indexRoundTripWitness(
  dims: { readonly nx: number; readonly ny: number; readonly nz: number },
  swapJk: boolean,
): StrictJson {
  const plane = dims.nx * dims.ny;
  const cellCount = plane * dims.nz;
  if (!Number.isSafeInteger(cellCount) || cellCount <= 0) {
    throw new Error("the layout fixture has no positive cell count");
  }
  const hashes = new Uint32Array(cellCount);
  for (let index = 0; index < cellCount; index++) {
    const k = Math.floor(index / plane);
    const remainder = index - k * plane;
    const j = Math.floor(remainder / dims.nx);
    const i = remainder - j * dims.nx;
    hashes[index] = swapJk
      ? registeredCoordinateHash(i, k, j)
      : registeredCoordinateHash(i, j, k);
  }
  return {
    cellCount,
    sha256: sha256Bytes(
      new Uint8Array(hashes.buffer, hashes.byteOffset, hashes.byteLength),
    ),
  };
}

/** The index round-trip operand the registered non-cubic mapping produces. */
export function phase5RegisteredIndexRoundTripWitness(dims: {
  readonly nx: number;
  readonly ny: number;
  readonly nz: number;
}): StrictJson {
  return indexRoundTripWitness(dims, false);
}

/** The index round-trip operand the same mapping produces with j and k swapped. */
export function phase5AxisSwappedIndexRoundTripWitness(dims: {
  readonly nx: number;
  readonly ny: number;
  readonly nz: number;
}): StrictJson {
  return indexRoundTripWitness(dims, true);
}

/** The far-field membership operand a skipped Dirichlet clamp produces: no clamped cell. */
function skippedDirichletClampWitness(cellCount: number): StrictJson {
  return {
    shellCount: 0,
    sha256: sha256Bytes(new Uint8Array(cellCount * 4)),
  };
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

function differingOperand(right: unknown, label: string): StrictJson {
  if (typeof right === "boolean") return !right;
  if (typeof right === "number") return Number.isFinite(right) ? right + 1 : 0;
  if (typeof right === "string") return `${right}#mutated`;
  if (right === null) return true;
  throw new Error(`${label} has no scalar operand to disagree with`);
}

/**
 * Break one invariant at its own declared relation, so the same mutation lands on the
 * production operand shape and on any narrower one a fixture publishes.
 */
function breakInvariant(invariant: MutableJson, label: string): void {
  const relation = invariant.relation;
  const right = invariant.right;
  if (relation === "equal") {
    const left = differingOperand(right, label);
    if (canonicalJson(left) === canonicalJson(right)) {
      throw new Error(`${label} could not be made to disagree with itself`);
    }
    invariant.left = left;
    return;
  }
  const bound = finiteNumber(right, `${label} right`);
  const tolerance =
    finiteNumber(invariant.absoluteTolerance, `${label} absoluteTolerance`) +
    finiteNumber(invariant.relativeTolerance, `${label} relativeTolerance`) *
      Math.abs(bound);
  if (relation === "greater-or-equal") {
    invariant.left = bound - tolerance - 1;
    return;
  }
  if (relation === "less-or-equal" || relation === "mixed-tolerance") {
    invariant.left = bound + tolerance + 1;
    return;
  }
  throw new Error(`${label} carries an unregistered relation`);
}

function firstTimingPayloadWith(
  capture: Phase5LaneCapture,
  key: "submissionSamples" | "interactions",
): unknown[] {
  for (const frozen of blockingFrozenFixtures()) {
    const timing = mutableObject(
      captureFixture(capture, frozen.id).timing,
      `${frozen.id} timing`,
    );
    const values = mutableArray(timing[key], `${frozen.id} timing ${key}`);
    if (values.length > 0) return values;
  }
  throw new Error(`no fixture timing payload carries a ${key} sample`);
}

function firstReadbackPayloadWithRecords(
  capture: Phase5LaneCapture,
): { readonly fixtureId: string; readonly readback: MutableJson } {
  for (const frozen of blockingFrozenFixtures()) {
    const readback = mutableObject(
      captureFixture(capture, frozen.id).readback,
      `${frozen.id} readback`,
    );
    if (mutableArray(readback.records, `${frozen.id} readback records`).length > 0) {
      return { fixtureId: frozen.id, readback };
    }
  }
  throw new Error("no fixture readback payload carries an audited readback");
}

type Phase5NegativeControlMutation = (capture: Phase5LaneCapture) => void;

const PHASE5_NEGATIVE_CONTROL_MUTATIONS: Readonly<
  Record<string, Phase5NegativeControlMutation>
> = {
  // Relabel the observed backend on the adapter evidence itself.
  "NC-WINDOWS-BACKEND-RELABEL": (capture) => {
    const adapter = mutableObject(capture.raw.adapter, "adapter");
    if (adapter.backend !== PHASE5_EXPECTED_WINDOWS_BACKEND) {
      throw new Error("the capture does not carry the observed Windows backend");
    }
    adapter.backend = RELABELLED_BACKEND;
  },

  // Shift one frozen tolerance inside the published tolerance manifest while the recorded
  // manifest hash stays exactly what the probe wrote.
  "NC-PROTOCOL-HASH-SHIFT": (capture) => {
    const protocol = mutableObject(capture.raw.protocol, "protocol");
    const manifest = mutableObject(
      protocol.toleranceManifest,
      "protocol.toleranceManifest",
    );
    const scalarTolerances = mutableObject(
      manifest.scalarTolerances,
      "protocol.toleranceManifest.scalarTolerances",
    );
    const shifted = finiteNumber(
      scalarTolerances.maxAbs,
      "protocol.toleranceManifest.scalarTolerances.maxAbs",
    );
    scalarTolerances.maxAbs = shifted * 2;
  },

  // Omit one required limit from the observed device limits.
  "NC-REQUIRED-LIMIT-DOWNGRADE": (capture) => {
    const adapter = mutableObject(capture.raw.adapter, "adapter");
    const deviceLimits = mutableObject(
      adapter.deviceLimits,
      "adapter.deviceLimits",
    );
    const [omitted] = Object.keys(PHASE5_REQUIRED_LIMITS).sort(lexical);
    if (!Object.hasOwn(deviceLimits, omitted)) {
      throw new Error(`adapter.deviceLimits already omits ${omitted}`);
    }
    delete deviceLimits[omitted];
  },

  // Swap j and k in the non-cubic index mapping and publish the operand that mapping
  // actually produces on the layout fixture's own dimensions.
  "NC-AXIS-SWAP": (capture) => {
    const fixture = frozenLayoutFixture();
    const comparison = captureComparison(capture, fixture.id);
    const decision = mutableEntryNamed(
      mutableArray(comparison.decisions, `${fixture.id} decisions`),
      "layout.index-round-trip",
      `${fixture.id} decisions`,
    );
    decision.gpu = phase5AxisSwappedIndexRoundTripWitness(fixture.dims);
  },

  // Skip the Dirichlet clamp: no cell belongs to the clamped far-field set.
  "NC-WRONG-BOUNDARY-CLAMP": (capture) => {
    const fixture = frozenDirichletDiffusionFixture();
    const comparison = captureComparison(capture, fixture.id);
    const decision = mutableEntryNamed(
      mutableArray(comparison.decisions, `${fixture.id} decisions`),
      "state.far-field-set",
      `${fixture.id} decisions`,
    );
    decision.gpu = skippedDirichletClampWitness(
      fixture.dims.nx * fixture.dims.ny * fixture.dims.nz,
    );
  },

  // Reuse the stale diffusion source for a full G-G cycle: the exported vapor field is one
  // cycle behind the reference, so the measured deviation reaches the preset's reservoir.
  "NC-STALE-PING-PONG": (capture) => {
    const fixture = frozenReflectingGgFixture();
    const comparison = captureComparison(capture, fixture.id);
    const field = mutableEntryNamed(
      mutableArray(comparison.fields, `${fixture.id} fields`),
      "d",
      `${fixture.id} fields`,
    );
    const length = finiteNumber(field.length, `${fixture.id} field d length`);
    const staleVapor = GG_PRESETS[fixture.preset].rho;
    field.maxAbs = staleVapor;
    field.rms = staleVapor / Math.sqrt(length);
    field.maxRelative = 1;
  },

  // Accept fixed-sigma LK convergence from the iterate residual alone: the dual-criterion
  // invariant the fixture publishes no longer holds.
  "NC-LK-RESIDUAL-ONLY": (capture) => {
    const fixture = frozenDirichletLkFixture();
    const comparison = captureComparison(capture, fixture.id);
    const invariant = mutableEntryNamed(
      mutableArray(comparison.invariants, `${fixture.id} invariants`),
      "convergence.dual-or-reflecting",
      `${fixture.id} invariants`,
    );
    breakInvariant(invariant, `${fixture.id} convergence.dual-or-reflecting`);
  },

  // Flip one attachment bit in the registered noise-off orbit. The flip is in the shared
  // orbit, so both lanes measure the same nonzero orbit error and the cross-lane equality
  // still holds: only an independently derived symmetry measurement catches it.
  "NC-SYMMETRY-BIT": (capture) => {
    const fixture = frozenReflectingGgFixture();
    const comparison = captureComparison(capture, fixture.id);
    const invariant = mutableEntryNamed(
      mutableArray(comparison.invariants, `${fixture.id} invariants`),
      "symmetry.exact",
      `${fixture.id} invariants`,
    );
    invariant.left = FLIPPED_ATTACHMENT_BIT_COUNT;
    invariant.right = FLIPPED_ATTACHMENT_BIT_COUNT;
  },

  // Mark a contacting fixture as eligible comparison evidence: the measured contact operand
  // says the crystal reached its domain, and the invariant's own right-hand side is moved so
  // the invariant still reports agreement.
  "NC-DOMAIN-CONTACT": (capture) => {
    const fixture = frozenDirichletDiffusionFixture();
    const comparison = captureComparison(capture, fixture.id);
    const invariant = mutableEntryNamed(
      mutableArray(comparison.invariants, `${fixture.id} invariants`),
      "domain.no-contact",
      `${fixture.id} invariants`,
    );
    invariant.left = true;
    invariant.right = true;
  },

  // Inject one submission segment above the registered maximum.
  "NC-EXCESSIVE-DISPATCH": (capture) => {
    const samples = firstTimingPayloadWith(capture, "submissionSamples");
    const warmup = samples.find(
      (sample) => mutableObject(sample, "submission sample").warmup === true,
    );
    const sample = mutableObject(
      warmup ?? samples[0],
      "submission sample",
    );
    const segments = mutableArray(
      sample.segmentWallMs,
      "submission sample segmentWallMs",
    );
    if (segments.length === 0) {
      throw new Error("the selected submission sample has no bounded segment");
    }
    segments[0] = PHASE5_PERFORMANCE.maxSubmissionSegmentMs + 1;
  },

  // Inject one edit acknowledgement above the registered limit.
  "NC-LATE-EDIT-ACK": (capture) => {
    const interaction = mutableObject(
      firstTimingPayloadWith(capture, "interactions")[0],
      "interaction sample",
    );
    interaction.editAcknowledgementMs =
      PHASE5_PERFORMANCE.editAcknowledgementMs + 1;
  },

  // Inject one first-valid frame above the registered limit.
  "NC-LATE-FIRST-FRAME": (capture) => {
    const interaction = mutableObject(
      firstTimingPayloadWith(capture, "interactions")[0],
      "interaction sample",
    );
    interaction.firstValidFrameMs =
      PHASE5_PERFORMANCE.firstValidPostEditFrameMs + 1;
  },

  // Perform one full-field display-frame readback: one audited record now covers its whole
  // source buffer and carries a display-frame identity, and the record artifact's own totals
  // follow that record.
  "NC-FULL-FIELD-PER-FRAME": (capture) => {
    const { fixtureId, readback } = firstReadbackPayloadWithRecords(capture);
    const records = mutableArray(readback.records, `${fixtureId} readback records`);
    const record = mutableObject(records[0], `${fixtureId} readback record 0`);
    const sourceByteLength = finiteNumber(
      record.sourceByteLength,
      `${fixtureId} readback record 0 sourceByteLength`,
    );
    const sequence = finiteNumber(
      record.sequence,
      `${fixtureId} readback record 0 sequence`,
    );
    record.byteOffset = 0;
    record.byteLength = sourceByteLength;
    record.fullField = true;
    record.displayFrame = true;
    record.displayFrameSequence = sequence;
    record.displayFrameLabel = `${fixtureId}:display-frame`;
    readback.fullFieldDisplayFrameCount = records.filter((entry) => {
      const audited = mutableObject(entry, `${fixtureId} readback record`);
      return audited.fullField === true && audited.displayFrame === true;
    }).length;
    readback.totalBytes = records.reduce<number>(
      (sum, entry) =>
        sum +
        finiteNumber(
          mutableObject(entry, `${fixtureId} readback record`).byteLength,
          `${fixtureId} readback record byteLength`,
        ),
      0,
    );
  },

  // Shift one conversion declaration on the published checkpoint evidence.
  "NC-CHECKPOINT-DTYPE-SHIFT": (capture) => {
    const [frozen] = blockingFrozenFixtures();
    const comparison = captureComparison(capture, frozen.id);
    const checkpoint = mutableObject(
      comparison.checkpoint,
      `${frozen.id} comparison checkpoint`,
    );
    if (checkpoint.endianness === SHIFTED_ENDIANNESS) {
      throw new Error(`${frozen.id} checkpoint already declares a shifted endianness`);
    }
    checkpoint.endianness = SHIFTED_ENDIANNESS;
  },

  // Report pass while one blocking raw field comparison exceeds its frozen tolerance: the
  // measured deviation is pushed past the frozen field bound and the fixture's own events
  // artifact reports the bypass.
  "NC-TOLERANCE-BYPASS": (capture) => {
    const fixture = frozenLayoutFixture();
    const comparison = captureComparison(capture, fixture.id);
    const field = mutableEntryNamed(
      mutableArray(comparison.fields, `${fixture.id} fields`),
      "d",
      `${fixture.id} fields`,
    );
    const tolerance = field.tolerance;
    if (
      typeof tolerance !== "string" ||
      !Object.hasOwn(PHASE5_FIELD_TOLERANCES, tolerance)
    ) {
      throw new Error(`${fixture.id} field d names no frozen tolerance`);
    }
    field.maxAbs =
      PHASE5_FIELD_TOLERANCES[tolerance as keyof typeof PHASE5_FIELD_TOLERANCES]
        .maxAbs * TOLERANCE_BYPASS_FACTOR;
    const events = mutableObject(
      captureFixture(capture, fixture.id).events,
      `${fixture.id} events`,
    );
    events.toleranceBypassCount = REPORTED_TOLERANCE_BYPASS_COUNT;
  },

  // Mutate one indexed artifact byte after publication.
  "NC-ARTIFACT-BYTE-MUTATION": (capture) => {
    const [frozen] = blockingFrozenFixtures();
    const bytes = captureFixture(capture, frozen.id).cpuReferenceCheckpoint;
    if (bytes.byteLength === 0) {
      throw new Error(`${frozen.id} CPU checkpoint artifact is empty`);
    }
    bytes[0] = bytes[0] ^ 0xff;
  },
};

/**
 * Every control id this module registers a mutation for, sorted.
 *
 * It is the registry's own key set rather than a filtered copy of the frozen list, so a
 * mutation registered under a name no control uses is as visible as a missing one.
 */
export const PHASE5_NEGATIVE_CONTROL_MUTATION_IDS: readonly string[] =
  Object.keys(PHASE5_NEGATIVE_CONTROL_MUTATIONS).sort(lexical);

/**
 * Deep-clone `capture` and apply exactly the named control's registered mutation.
 *
 * The input capture is never touched, and an unregistered id is refused rather than treated
 * as a control with nothing to do.
 */
export function applyPhase5NegativeControlMutation(
  controlId: string,
  capture: Phase5LaneCapture,
): Phase5LaneCapture {
  const control = PHASE5_NEGATIVE_CONTROLS.find(
    (entry) => entry.id === controlId,
  );
  if (control === undefined) {
    throw new Error(`unregistered Phase 5 negative control: ${controlId}`);
  }
  const mutate = PHASE5_NEGATIVE_CONTROL_MUTATIONS[controlId];
  if (mutate === undefined) {
    throw new Error(`Phase 5 negative control ${controlId} has no mutation implementation`);
  }
  const mutated = structuredClone(capture) as Phase5LaneCapture;
  mutate(mutated);
  return mutated;
}

// ---------------------------------------------------------------------------
// Published artifact digests
// ---------------------------------------------------------------------------

/**
 * The digest of every artifact a lane publication indexes, keyed by its published path.
 *
 * This mirrors the artifact set `gate5-evidence.ts` writes: the three lane logs and, per
 * blocking fixture, the config, both checkpoints, and the four payload artifacts.
 */
export function phase5CaptureArtifactDigests(
  capture: Phase5LaneCapture,
): ReadonlyMap<string, string> {
  const digests = new Map<string, string>();
  digests.set("stdout.log", sha256Bytes(capture.stdout));
  digests.set("stderr.log", sha256Bytes(capture.stderr));
  digests.set(
    "exit-status.txt",
    sha256Bytes(new TextEncoder().encode(`${capture.exitStatus}\n`)),
  );
  for (const frozen of blockingFrozenFixtures()) {
    const fixture = captureFixture(capture, frozen.id);
    const base = `fixtures/${frozen.id}`;
    digests.set(
      `${base}/config.json`,
      sha256Bytes(canonicalJsonBytes(fixture.config)),
    );
    digests.set(
      `${base}/cpu-reference.ckpt`,
      sha256Bytes(fixture.cpuReferenceCheckpoint),
    );
    digests.set(
      `${base}/gpu-export.ckpt`,
      sha256Bytes(fixture.gpuExportCheckpoint),
    );
    digests.set(
      `${base}/comparison.json`,
      sha256Bytes(canonicalJsonBytes(fixture.comparison)),
    );
    digests.set(
      `${base}/events.json`,
      sha256Bytes(canonicalJsonBytes(fixture.events)),
    );
    digests.set(
      `${base}/timing.json`,
      sha256Bytes(canonicalJsonBytes(fixture.timing)),
    );
    digests.set(
      `${base}/readback.json`,
      sha256Bytes(canonicalJsonBytes(fixture.readback)),
    );
  }
  return digests;
}

function digestsAgree(
  sealed: ReadonlyMap<string, string>,
  observed: ReadonlyMap<string, string>,
): boolean {
  if (sealed.size !== observed.size) return false;
  for (const [path, digest] of sealed) {
    if (observed.get(path) !== digest) return false;
  }
  return true;
}

// ---------------------------------------------------------------------------
// Independent re-derivation of raw evidence from the payload graph
// ---------------------------------------------------------------------------

function rederivedFieldFailures(
  values: readonly StrictJson[],
  fixtureId: string,
): number {
  let failures = 0;
  for (const [index, value] of values.entries()) {
    const label = `${fixtureId} fields[${index}]`;
    const field = readonlyObject(value, label);
    const tolerance = field.tolerance;
    if (
      typeof tolerance !== "string" ||
      !Object.hasOwn(PHASE5_FIELD_TOLERANCES, tolerance)
    ) {
      throw new Error(`${label} names no frozen field tolerance`);
    }
    const comparison = {
      length: finiteNumber(field.length, `${label} length`),
      relativeComparedCount: finiteNumber(
        field.relativeComparedCount,
        `${label} relativeComparedCount`,
      ),
      maxAbs: finiteNumber(field.maxAbs, `${label} maxAbs`),
      rms: finiteNumber(field.rms, `${label} rms`),
      maxRelative: finiteNumber(field.maxRelative, `${label} maxRelative`),
    };
    if (
      !phase5ComparisonPasses(
        comparison,
        PHASE5_FIELD_TOLERANCES[
          tolerance as keyof typeof PHASE5_FIELD_TOLERANCES
        ],
      )
    ) {
      failures++;
    }
  }
  return failures;
}

function rederivedScalarFailures(
  values: readonly StrictJson[],
  fixtureId: string,
): number {
  let failures = 0;
  for (const [index, value] of values.entries()) {
    const label = `${fixtureId} scalars[${index}]`;
    const scalar = readonlyObject(value, label);
    const blocking = scalar.blocking;
    if (typeof blocking !== "boolean") {
      throw new Error(`${label} does not declare whether it blocks`);
    }
    const cpu = scalar.cpu;
    const gpu = scalar.gpu;
    if (cpu === null || gpu === null) {
      if (blocking && cpu !== gpu) failures++;
      continue;
    }
    const reference = finiteNumber(cpu, `${label} cpu`);
    const candidate = finiteNumber(gpu, `${label} gpu`);
    const limit =
      PHASE5_SCALAR_TOLERANCES.maxAbs +
      PHASE5_SCALAR_TOLERANCES.maxRelative * Math.abs(reference);
    if (blocking && Math.abs(candidate - reference) > limit) failures++;
  }
  return failures;
}

function rederivedDecisionFailures(
  values: readonly StrictJson[],
  fixtureId: string,
): number {
  let failures = 0;
  for (const [index, value] of values.entries()) {
    const decision = readonlyObject(value, `${fixtureId} decisions[${index}]`);
    if (canonicalJson(decision.cpu) !== canonicalJson(decision.gpu)) failures++;
  }
  return failures;
}

function rederivedInvariantFailures(
  values: readonly StrictJson[],
  fixtureId: string,
): number {
  let failures = 0;
  for (const [index, value] of values.entries()) {
    const label = `${fixtureId} invariants[${index}]`;
    const invariant = readonlyObject(value, label);
    const relation = invariant.relation;
    if (relation === "equal") {
      if (canonicalJson(invariant.left) !== canonicalJson(invariant.right)) {
        failures++;
      }
      continue;
    }
    if (
      relation !== "greater-or-equal" &&
      relation !== "less-or-equal" &&
      relation !== "mixed-tolerance"
    ) {
      throw new Error(`${label} carries an unregistered relation`);
    }
    const left = finiteNumber(invariant.left, `${label} left`);
    const right = finiteNumber(invariant.right, `${label} right`);
    const tolerance =
      finiteNumber(invariant.absoluteTolerance, `${label} absoluteTolerance`) +
      finiteNumber(invariant.relativeTolerance, `${label} relativeTolerance`) *
        Math.abs(right);
    if (
      (relation === "greater-or-equal" && left + tolerance < right) ||
      (relation === "less-or-equal" && left - tolerance > right) ||
      (relation === "mixed-tolerance" && Math.abs(left - right) > tolerance)
    ) {
      failures++;
    }
  }
  return failures;
}

function invariantNamed(
  values: readonly StrictJson[],
  name: string,
): ReadonlyJsonObject | null {
  for (const value of values) {
    const invariant = readonlyObject(value, `invariant ${name}`);
    if (invariant.name === name) return invariant;
  }
  return null;
}

/**
 * The orbit measurement the fixture published, not the count it declared.
 *
 * `symmetry.exact` relates the two lanes' measured D6h orbit errors. A flipped attachment bit
 * inside the registered orbit makes both errors nonzero while leaving them equal, so reading
 * the operands is the only way to see it.
 */
function derivedSymmetryMismatchCount(
  invariants: readonly StrictJson[],
  declared: number,
): number {
  const invariant = invariantNamed(invariants, "symmetry.exact");
  if (invariant === null) return declared;
  const left = invariant.left;
  const right = invariant.right;
  if (
    typeof left === "number" &&
    typeof right === "number" &&
    Number.isFinite(left) &&
    Number.isFinite(right)
  ) {
    return left === 0 && right === 0 ? 0 : 1;
  }
  return canonicalJson(left) === canonicalJson(right) ? 0 : 1;
}

/**
 * The contact measurement the fixture published, not the eligibility it declared.
 *
 * `domain.no-contact` carries the measured contact flag on its left operand, so a fixture that
 * reached its domain is visible even when the invariant's own right-hand side was moved to
 * make the comparison agree.
 */
function derivedDomainContact(
  invariants: readonly StrictJson[],
  declared: boolean,
): boolean {
  const invariant = invariantNamed(invariants, "domain.no-contact");
  if (invariant === null) return declared;
  const left = invariant.left;
  if (typeof left === "boolean") return left;
  if (typeof left === "number" && Number.isFinite(left)) return left !== 0;
  return canonicalJson(left) !== canonicalJson(invariant.right);
}

function payloadObject(
  value: unknown,
  label: string,
): ReadonlyJsonObject {
  return readonlyObject(strictJsonSnapshot(value), label);
}

/**
 * Rebuild the raw evidence a lane report would carry from the capture's own payload
 * artifacts. Every quantity the payload determines is recomputed here; adapter, protocol,
 * host, runtime, repository, and stress identity have no payload counterpart and are carried
 * through unchanged.
 */
export function rederivePhase5RawEvidence(
  capture: Phase5LaneCapture,
  publicationVerified: boolean,
): Phase5LaneRawEvidence {
  const fixtures: StrictJson[] = [];
  const checkpoints: StrictJson[] = [];
  const submissionSamples: StrictJson[] = [];
  const interactions: StrictJson[] = [];
  const readbackRecords: StrictJson[] = [];
  const negativeControls: StrictJson[] = [];
  let deviceLossCount = 0;
  let uncapturedErrorCount = 0;
  let hiddenRetryCount = 0;
  let fullFieldDisplayFrameCount = 0;
  let readbackTotalBytes = 0;
  let toleranceBypassCount = 0;

  for (const frozen of blockingFrozenFixtures()) {
    const fixture = captureFixture(capture, frozen.id);
    const declared = capture.raw.fixtures.find((entry) => entry.id === frozen.id);
    if (declared === undefined) {
      throw new Error(`${frozen.id} raw fixture measurement is absent`);
    }
    const comparison = payloadObject(fixture.comparison, `${frozen.id} comparison`);
    const fields = readonlyArray(comparison.fields, `${frozen.id} fields`);
    const scalars = readonlyArray(comparison.scalars, `${frozen.id} scalars`);
    const decisions = readonlyArray(comparison.decisions, `${frozen.id} decisions`);
    const invariants = readonlyArray(
      comparison.invariants,
      `${frozen.id} invariants`,
    );
    const fieldFailureCount = rederivedFieldFailures(fields, frozen.id);
    const scalarFailureCount = rederivedScalarFailures(scalars, frozen.id);
    const decisionFailureCount = rederivedDecisionFailures(decisions, frozen.id);
    const invariantFailureCount = rederivedInvariantFailures(
      invariants,
      frozen.id,
    );
    fixtures.push({
      id: frozen.id,
      kind: declared.kind,
      blocking: declared.blocking,
      comparisonFailureCount:
        fieldFailureCount +
        scalarFailureCount +
        decisionFailureCount +
        invariantFailureCount,
      fieldFailureCount,
      scalarFailureCount,
      decisionFailureCount,
      invariantFailureCount,
      symmetryChecked: declared.symmetryChecked,
      symmetryMismatchCount: derivedSymmetryMismatchCount(
        invariants,
        declared.symmetryMismatchCount,
      ),
      domainContact: derivedDomainContact(invariants, declared.domainContact),
      stopReasonMatch: declared.stopReasonMatch,
    });
    if (comparison.checkpoint === undefined) {
      throw new Error(`${frozen.id} comparison omits its checkpoint declaration`);
    }
    checkpoints.push(comparison.checkpoint);

    const timing = payloadObject(fixture.timing, `${frozen.id} timing`);
    submissionSamples.push(
      ...readonlyArray(timing.submissionSamples, `${frozen.id} submissionSamples`),
    );
    interactions.push(
      ...readonlyArray(timing.interactions, `${frozen.id} interactions`),
    );
    deviceLossCount += finiteNumber(
      timing.deviceLossCount,
      `${frozen.id} timing deviceLossCount`,
    );
    uncapturedErrorCount += finiteNumber(
      timing.uncapturedErrorCount,
      `${frozen.id} timing uncapturedErrorCount`,
    );
    hiddenRetryCount += finiteNumber(
      timing.hiddenRetryCount,
      `${frozen.id} timing hiddenRetryCount`,
    );

    const readback = payloadObject(fixture.readback, `${frozen.id} readback`);
    readbackRecords.push(
      ...readonlyArray(readback.records, `${frozen.id} readback records`),
    );
    fullFieldDisplayFrameCount += finiteNumber(
      readback.fullFieldDisplayFrameCount,
      `${frozen.id} readback fullFieldDisplayFrameCount`,
    );
    readbackTotalBytes += finiteNumber(
      readback.totalBytes,
      `${frozen.id} readback totalBytes`,
    );

    const events = payloadObject(fixture.events, `${frozen.id} events`);
    toleranceBypassCount += finiteNumber(
      events.toleranceBypassCount,
      `${frozen.id} events toleranceBypassCount`,
    );
    negativeControls.push(
      ...readonlyArray(events.negativeControls, `${frozen.id} negativeControls`),
    );
  }

  const orderedRecords = [...readbackRecords].sort((left, right) => {
    const leftSequence = finiteNumber(
      readonlyObject(left, "readback record").sequence,
      "readback record sequence",
    );
    const rightSequence = finiteNumber(
      readonlyObject(right, "readback record").sequence,
      "readback record sequence",
    );
    return leftSequence - rightSequence;
  });

  return validatePhase5RawEvidence({
    schema: capture.raw.schema,
    repository: strictJsonSnapshot(capture.raw.repository),
    host: strictJsonSnapshot(capture.raw.host),
    runtime: strictJsonSnapshot(capture.raw.runtime),
    adapter: strictJsonSnapshot(capture.raw.adapter),
    protocol: strictJsonSnapshot(capture.raw.protocol),
    fixtures,
    stressDiagnostics: strictJsonSnapshot(capture.raw.stressDiagnostics),
    submissions: {
      samples: submissionSamples,
      deviceLossCount,
      uncapturedErrorCount,
      hiddenRetryCount,
    },
    interactions,
    readback: {
      records: orderedRecords,
      fullFieldDisplayFrameCount,
      totalBytes: readbackTotalBytes,
    },
    checkpoints,
    toleranceBypassCount,
    negativeControls,
    publicationVerified,
  });
}

/**
 * Fail loudly when the re-derivation above disagrees with an accepted capture's own declared
 * raw evidence. Without this, a future change to the payload-graph contract could quietly
 * make every negative control score against a raw object the production path never builds.
 */
export function assertPhase5CaptureRederivationAgrees(
  capture: Phase5LaneCapture,
): void {
  const rederived = rederivePhase5RawEvidence(capture, true);
  const declared = validatePhase5RawEvidence({
    ...(strictJsonSnapshot(capture.raw) as ReadonlyJsonObject),
    publicationVerified: true,
  });
  if (canonicalJson(rederived) !== canonicalJson(declared)) {
    throw new Error(
      "Phase 5 payload re-derivation disagrees with the capture's declared raw evidence",
    );
  }
}

export interface Phase5CaptureVerification {
  readonly rejected: boolean;
  readonly failedCriteria: readonly Phase5Criterion[];
  readonly rejection: "criteria" | "structural" | "none";
  readonly structuralReason: string | null;
}

/**
 * Run the real verification path over one capture: re-derive its raw evidence from its own
 * payload, check its bytes against the sealed artifact index, and score the result with the
 * production criterion evaluator. A structural refusal is recorded as one, with no criterion
 * attributed to it, because an unattributable refusal proves nothing about ownership.
 */
export function verifyPhase5CaptureEvidence(
  capture: Phase5LaneCapture,
  sealedArtifactIndex: ReadonlyMap<string, string>,
): Phase5CaptureVerification {
  try {
    const publicationVerified = digestsAgree(
      sealedArtifactIndex,
      phase5CaptureArtifactDigests(capture),
    );
    const verdict = evaluatePhase5Lane(
      rederivePhase5RawEvidence(capture, publicationVerified),
    );
    const failedCriteria = failedPhase5Criteria(verdict);
    return {
      rejected: failedCriteria.length > 0,
      failedCriteria,
      rejection: failedCriteria.length > 0 ? "criteria" : "none",
      structuralReason: null,
    };
  } catch (error) {
    return {
      rejected: true,
      failedCriteria: [],
      rejection: "structural",
      structuralReason: error instanceof Error ? error.message : String(error),
    };
  }
}

function captureFingerprint(capture: Phase5LaneCapture): string {
  return canonicalJson({
    raw: strictJsonSnapshot(capture.raw),
    artifacts: [...phase5CaptureArtifactDigests(capture)]
      .sort((left, right) => lexical(left[0], right[0]))
      .map(([path, digest]) => ({ path, digest })),
  });
}

/**
 * Execute all sixteen registered negative controls against one accepted capture.
 *
 * Each control's named mutation is applied to the real evidence, the mutated capture is
 * verified by the same path that verifies the unmutated one, and the observed failing set is
 * recorded verbatim. Nothing here consults a control's registered owner while deciding what
 * failed; `ownerObserved` only reports afterwards whether the observation covered it.
 */
export function derivePhase5NegativeControlOutcomeDetails(
  capture: Phase5LaneCapture,
): readonly Phase5NegativeControlOutcome[] {
  assertPhase5CaptureRederivationAgrees(capture);
  const sealed = phase5CaptureArtifactDigests(capture);
  const baseline = verifyPhase5CaptureEvidence(capture, sealed);
  if (baseline.rejected) {
    throw new Error(
      "Phase 5 negative controls require an accepted baseline capture; it failed " +
        (baseline.structuralReason ?? baseline.failedCriteria.join(", ")),
    );
  }
  const fingerprint = captureFingerprint(capture);
  return PHASE5_NEGATIVE_CONTROLS.map((control) => {
    const mutated = applyPhase5NegativeControlMutation(control.id, capture);
    if (captureFingerprint(mutated) === fingerprint) {
      throw new Error(
        `${control.id} did not change any captured evidence: its mutation did not execute`,
      );
    }
    const verification = verifyPhase5CaptureEvidence(
      mutated,
      PHASE5_SEALED_INDEX_CONTROL_IDS.has(control.id)
        ? sealed
        : phase5CaptureArtifactDigests(mutated),
    );
    return {
      id: control.id,
      owner: control.owner,
      mutation: control.mutation,
      rejected: verification.rejected,
      failedCriteria: verification.failedCriteria,
      rejection: verification.rejection,
      structuralReason: verification.structuralReason,
      ownerObserved: verification.failedCriteria.includes(control.owner),
    };
  });
}

/** The lane-report projection of {@link derivePhase5NegativeControlOutcomeDetails}. */
export function derivePhase5NegativeControlOutcomes(
  capture: Phase5LaneCapture,
): readonly Phase5NegativeControlMeasurement[] {
  return derivePhase5NegativeControlOutcomeDetails(capture).map((outcome) => ({
    id: outcome.id,
    owner: outcome.owner,
    mutation: outcome.mutation,
    rejected: outcome.rejected,
    failedCriteria: outcome.failedCriteria,
  }));
}
