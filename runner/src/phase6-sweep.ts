// Phase 6 WP2 — the validation sweep harness.
//
// This module turns the frozen protocol into runs and runs into a scored comparison. It does NOT
// decide anything: every threshold, every classification rule, every exclusion it applies comes
// from `phase6-protocol.ts`, which is hash-pinned. If a value is not registered there, this file
// must not invent it.
//
// **It fails closed.** Before a single point runs, `phase6SweepPreflight` requires that the
// protocol freeze is complete, that the manifest hashes to the registered value, that the freeze
// commit is an ancestor of HEAD, and that the tracked tree is clean. A sweep that cannot prove
// which protocol produced it is not evidence, and the charter's whole pre-registration argument
// rests on that being checkable rather than asserted.

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { canonicalJsonSha256, sha256Bytes } from "./gate4-evidence.ts";
import {
  GROW_LK_DEFAULTS,
  PHASE6_DEFAULT_KEY_FLAGS,
  PHASE6_EXPLICIT_FLAGS,
  PHASE6_RESULT_IRRELEVANT_DEFAULTS,
} from "./grow-lk-defaults.ts";
import {
  PHASE6_CROSSPLATFORM_FIXTURE,
} from "./phase6-crossplatform.ts";
import {
  PHASE6_ARM2_FREEZE_COMMIT,
  PHASE6_ARM2_ID,
  PHASE6_ARM2_PARAM_SET,
  PHASE6_ARM2_VALUES_SHA256,
  phase6Arm2InHeadlineScope,
  phase6Arm2IsBistable,
  phase6Arm2JustificationManifest,
  phase6Arm2ProtocolManifest,
  phase6Arm2ScoreHabit,
  phase6Arm2ValuesManifest,
} from "./phase6-arm2-protocol.ts";
import {
  PHASE6_DOMAIN_SPOT_CHECK,
  PHASE6_PARAM_SET,
  PHASE6_PROTOCOL_FREEZE_COMMIT,
  PHASE6_PROTOCOL_SHA256,
  PHASE6_REQUIRED_STOP_REASON,
  PHASE6_VALUES_SHA256,
  phase6ExpectedRunGeometry,
  phase6FreezeComplete,
  phase6IsExtentFragile,
  phase6IsInAmbiguityBand,
  phase6PendingFreezeItems,
  phase6JustificationManifest,
  phase6ProtocolManifest,
  phase6ProtocolProvenance,
  phase6ReferenceRegime,
  phase6ValuesManifest,
  phase6ScoreHabit,
  phase6SweepGrid,
  PHASE6_REFERENCE_REGIMES,
  type Phase6GridPoint,
  type Phase6ModelClass,
  type Phase6ReferenceRegime,
  type Phase6Score,
} from "./phase6-protocol.ts";

/** Registered habit thresholds — restated from the protocol, not re-chosen. */
const PLATE_CEILING = 1 / 1.5;
const COLUMN_FLOOR = 1.5;

/** Classify a measured aspect ratio under the registered thresholds. */
export function phase6ClassifyHabit(aspectRatioValue: number): Phase6ModelClass {
  if (!Number.isFinite(aspectRatioValue) || aspectRatioValue <= 0) return "invalid";
  if (aspectRatioValue <= PLATE_CEILING) return "plate";
  if (aspectRatioValue >= COLUMN_FLOOR) return "column";
  return "neutral";
}

/**
 * Which ARM a sweep is running — the one operand that must never be defaulted by accident.
 *
 * Phase 6 has two arms over the SAME grid: arm 1 (`CAK`, published, headline 3/90) and arm 2
 * (`M1`, the SDAK arm registered by ADR 0036). They differ in the parameter set, in the scoring of
 * the bistable band, and in nothing else — everything shared is what makes the comparison
 * controlled.
 *
 * Bundled into one object rather than passed as three arguments on purpose: a caller that supplied
 * arm 2's param set with arm 1's scorer would produce an artifact that is neither arm's, and WP5
 * control 3 showed a mixed artifact is indistinguishable from a clean one. One object cannot be
 * half-substituted.
 */
export interface Phase6Arm {
  readonly id: string;
  readonly paramSet: string;
  /** Directory under out/ this arm publishes to. Separate, so neither arm can overwrite the other. */
  readonly outDirName: string;
  readonly valuesSha256: () => string;
  /** REPORTED, never gated (ADR 0033). Per arm, because arm 1's was being printed for both. */
  readonly justificationSha256: () => string;
  readonly scoreHabit: (tempC: number, modelClass: Phase6ModelClass) => Phase6Score;
  readonly inHeadlineScope: (tempC: number) => boolean;
  /** True where the REFERENCE names two habits, so the point is reported with its own count. */
  readonly isBistable: (tempC: number) => boolean;
  /** Goes in the published diagram's title, so a figure that escapes names its own arm. */
  readonly diagramLabel: string;
  /**
   * The commit at which THIS arm's protocol froze. Preflight requires it to be an ancestor of the
   * execution HEAD, which is what makes "registered before it ran" checkable rather than asserted.
   */
  readonly freezeCommit: string;
  /** COMBINED hash, reported in the artifacts. Moves on prose; never gated. */
  readonly protocolSha256: () => string;
}

/** Arm 1 — the published no-SDAK arm. Its behaviour is the default everywhere, for that reason. */
export const PHASE6_ARM1: Phase6Arm = {
  id: "arm1-cak",
  paramSet: PHASE6_PARAM_SET,
  outDirName: "phase6-sweep",
  valuesSha256: () => canonicalJsonSha256(phase6ValuesManifest()),
  justificationSha256: () => canonicalJsonSha256(phase6JustificationManifest()),
  scoreHabit: phase6ScoreHabit,
  inHeadlineScope: (tempC) => {
    const spec = PHASE6_REFERENCE_REGIMES.find((c) => c.regime === phase6ReferenceRegime(tempC));
    return (spec?.inHeadline ?? false) && !phase6IsInAmbiguityBand(tempC);
  },
  // Arm 1 registers no bistable band: its scoring is single-valued everywhere by construction.
  isBistable: () => false,
  diagramLabel: "no-SDAK (CAK)",
  freezeCommit: PHASE6_PROTOCOL_FREEZE_COMMIT,
  protocolSha256: () => canonicalJsonSha256(phase6ProtocolManifest()),
};

/** Arm 2 — the SDAK arm. ADR 0036. */
export const PHASE6_ARM2: Phase6Arm = {
  id: PHASE6_ARM2_ID,
  paramSet: PHASE6_ARM2_PARAM_SET,
  outDirName: "phase6-sweep-arm2",
  valuesSha256: () => canonicalJsonSha256(phase6Arm2ValuesManifest()),
  justificationSha256: () => canonicalJsonSha256(phase6Arm2JustificationManifest()),
  scoreHabit: phase6Arm2ScoreHabit,
  inHeadlineScope: phase6Arm2InHeadlineScope,
  isBistable: phase6Arm2IsBistable,
  diagramLabel: "SDAK (M1)",
  freezeCommit: PHASE6_ARM2_FREEZE_COMMIT,
  protocolSha256: () => canonicalJsonSha256(phase6Arm2ProtocolManifest()),
};

/**
 * Every registered value that reaches a sweep run through a CLI DEFAULT rather than the command
 * line, paired with the registered value it must equal.
 *
 * ADR 0031's defect was exactly this shape: `paramSet` was registered, was not passed, and the
 * default disagreed — so 204 runs violated a freeze row while every hash and test stayed green.
 * The audit of 2026-07-29 found seven more parameters in the same position, all of which happen to
 * agree today. This table converts that coincidence into something preflight can fail on.
 *
 * Four of them (`pressurePa`, `seedRadius`, `seedThickness`, `relaxMaxSweeps`) have no CLI flag at
 * all, so checking the default is the ONLY way to know what a run used.
 */
export function phase6DefaultBackedParameters(): readonly {
  name: string;
  /** The `GROW_LK_DEFAULTS` key this row covers, so the generic sweep below can match it. */
  defaultsKey: keyof typeof GROW_LK_DEFAULTS;
  fromDefault: unknown;
  registered: unknown;
  hasFlag: boolean;
}[] {
  const f = PHASE6_CROSSPLATFORM_FIXTURE;
  return [
    { name: "relaxTol", defaultsKey: "tol", fromDefault: GROW_LK_DEFAULTS.tol, registered: f.relaxTol, hasFlag: true },
    { name: "divTol", defaultsKey: "divTol", fromDefault: GROW_LK_DEFAULTS.divTol, registered: f.divTol, hasFlag: true },
    { name: "noiseEpsilon", defaultsKey: "noise", fromDefault: GROW_LK_DEFAULTS.noise, registered: f.noiseEpsilon, hasFlag: true },
    { name: "rngSeed", defaultsKey: "seed", fromDefault: GROW_LK_DEFAULTS.seed, registered: f.rngSeed, hasFlag: true },
    { name: "pressurePa", defaultsKey: "pressurePa", fromDefault: GROW_LK_DEFAULTS.pressurePa, registered: f.pressurePa, hasFlag: false },
    { name: "seedRadius", defaultsKey: "seedRadius", fromDefault: GROW_LK_DEFAULTS.seedRadius, registered: f.seedRadius, hasFlag: false },
    { name: "seedThickness", defaultsKey: "seedThickness", fromDefault: GROW_LK_DEFAULTS.seedThickness, registered: f.seedThickness, hasFlag: false },
    { name: "relaxMaxSweeps", defaultsKey: "relaxMaxSweeps", fromDefault: GROW_LK_DEFAULTS.relaxMaxSweeps, registered: f.relaxMaxSweeps, hasFlag: false },
    // ADR 0035. The step cap: registered nowhere until now, and the highest-harm hole the pin
    // register found. It has a flag, but the sweep does not pass it, so the default is the path.
    { name: "steps", defaultsKey: "steps", fromDefault: GROW_LK_DEFAULTS.steps, registered: f.steps, hasFlag: true },
  ];
}

/**
 * Every `GROW_LK_DEFAULTS` key that is neither passed explicitly, nor checked against a registered
 * value, nor named as provably result-irrelevant.
 *
 * Pin-register recommendation 14, and the structural half of recommendation 2. The point is the
 * direction of the iteration: this walks the DEFAULTS, so a value that reaches a run is discovered
 * by the check rather than remembered by a person. `steps` is the proof it was needed — two
 * hand-kept lists both omitted it, and no test could notice, because neither list claimed to be
 * complete.
 */
export function phase6UnaccountedDefaults(arm: Phase6Arm = PHASE6_ARM1): readonly string[] {
  const command = phase6PointCommand(phase6SweepGrid()[0] as Phase6GridPoint, arm);
  const checked = new Set(phase6DefaultBackedParameters().map((p) => p.defaultsKey as string));
  const out: string[] = [];
  for (const key of Object.keys(GROW_LK_DEFAULTS)) {
    if (key in PHASE6_RESULT_IRRELEVANT_DEFAULTS) continue;
    if (checked.has(key)) continue;
    const flag = PHASE6_DEFAULT_KEY_FLAGS[key];
    if (flag !== undefined) {
      // Claiming a key is covered by a flag is only true if the flag is actually on the line.
      if (!command.includes(flag)) {
        out.push(`${key} is mapped to ${flag}, but phase6PointCommand does not pass ${flag}`);
      }
      continue;
    }
    out.push(
      `${key} reaches every run from GROW_LK_DEFAULTS.${key} = ${JSON.stringify(GROW_LK_DEFAULTS[key as keyof typeof GROW_LK_DEFAULTS])} ` +
        "and is in NO bucket: not passed explicitly, not checked against a registered value, not " +
        "named result-irrelevant. Editing it would move no hash and fail no test",
    );
  }
  return out;
}

/**
 * Every flag the protocol requires on a child command line, checked against a command actually
 * built by `phase6PointCommand` rather than against a list someone maintained by hand.
 */
export function phase6CommandFlagFailures(
  command: readonly string[],
  arm: Phase6Arm = PHASE6_ARM1,
): readonly string[] {
  const failures: string[] = [];
  for (const flag of PHASE6_EXPLICIT_FLAGS) {
    const occurrences = command.filter((token) => token === flag).length;
    if (occurrences === 0) {
      failures.push(`the child command omits ${flag}, so that registered value would come from a CLI default`);
    } else if (occurrences > 1) {
      // Pin-register recommendation 7. `parseLKArgs` takes the LAST occurrence of a repeated flag,
      // and `indexOf` below takes the FIRST — so `--param-set CAK --param-set CAK_A1` passes a
      // presence check, passes a value check, and runs under CAK_A1. Rejecting duplicates outright
      // is the only version of this that cannot be reasoned around.
      failures.push(
        `the child command passes ${flag} ${occurrences} times; the parser honours the last ` +
          "occurrence and this check reads the first, so a duplicate can make them disagree",
      );
    }
  }
  // The one whose absence caused ADR 0031, checked by VALUE as well as by presence.
  const at = command.indexOf("--param-set");
  if (at >= 0 && command[at + 1] !== arm.paramSet) {
    failures.push(`the child command passes --param-set ${command[at + 1]}, not the registered ${arm.paramSet}`);
  }
  return failures;
}

/**
 * Each arm's registered VALUES hash, by arm id. Preflight gates on the entry for the arm it is
 * running, so an arm with no registered hash cannot produce evidence at all.
 */
export const PHASE6_ARM_VALUES_SHA256: Readonly<Record<string, string>> = {
  "arm1-cak": PHASE6_VALUES_SHA256,
  [PHASE6_ARM2_ID]: PHASE6_ARM2_VALUES_SHA256,
};

export interface Phase6PreflightReport {
  readonly ok: boolean;
  readonly failures: readonly string[];
  readonly protocolSha256: string;
  /** ADR 0033: the gating hash. */
  readonly valuesSha256: string;
  /** ADR 0033: reported, never gated. */
  readonly justificationSha256: string;
  readonly head: string;
  readonly node: string;
  readonly v8: string;
}

/**
 * Everything that must be true before a sweep may produce evidence. Returns the failures rather
 * than throwing, so a caller can print all of them at once — a preflight that reports one
 * problem per run wastes an operator's evening.
 */
export function phase6SweepPreflight(
  repoRoot: string = process.cwd(),
  arm: Phase6Arm = PHASE6_ARM1,
): Phase6PreflightReport {
  const failures: string[] = [];

  if (!phase6FreezeComplete()) {
    const pending = phase6PendingFreezeItems().map((item) => item.id).join(", ");
    failures.push(`protocol freeze incomplete: ${pending}`);
  }

  let protocolSha256 = "";
  let valuesSha256 = "";
  let justificationSha256 = "";
  try {
    // ADR 0033. The VALUES hash is the gate: editing a registered value invalidates prior sweep
    // results. The JUSTIFICATION hash is reported and NOT gated — a prose correction is ADR-logged
    // but costs no re-sweep, because no evidence-producing path reads prose. The legacy combined
    // hash is still checked, because published evidence cites it.
    valuesSha256 = arm.valuesSha256();
    justificationSha256 = arm.justificationSha256();
    protocolSha256 = arm.protocolSha256();
    if (valuesSha256 !== PHASE6_ARM_VALUES_SHA256[arm.id]) {
      failures.push(
        `${arm.id} values hash ${valuesSha256} does not match the registered ` +
          `${PHASE6_ARM_VALUES_SHA256[arm.id] ?? "(UNREGISTERED ARM)"} ` +
          "— a registered VALUE was edited without updating the pin, which invalidates prior sweeps",
      );
    }
    if (arm.id === PHASE6_ARM1.id && protocolSha256 !== PHASE6_PROTOCOL_SHA256) {
      failures.push(
        `combined hash ${protocolSha256} does not match the current pin ${PHASE6_PROTOCOL_SHA256} ` +
          "— it moves on any prose change, so the pin must be updated in the same ADR",
      );
    }
  } catch (error) {
    failures.push(`protocol manifest unavailable: ${error instanceof Error ? error.message : String(error)}`);
  }

  // ADR 0031's defect class, checked rather than assumed. Both of these would have caught it.
  for (const p of phase6DefaultBackedParameters()) {
    if (p.fromDefault !== p.registered) {
      failures.push(
        `${p.name} reaches every run from the grow-lk default ${String(p.fromDefault)}, but the ` +
          `protocol registers ${String(p.registered)}` +
          (p.hasFlag ? "" : " — and it has NO CLI flag, so the default is the only path"),
      );
    }
  }
  for (const failure of phase6CommandFlagFailures(phase6PointCommand(phase6SweepGrid()[0] as Phase6GridPoint, arm), arm)) {
    failures.push(failure);
  }
  // Pin-register recommendation 14. The generic version of the two checks above: it walks the
  // defaults object rather than a maintained list, so the NEXT `steps` is found by preflight
  // instead of by an audit.
  for (const failure of phase6UnaccountedDefaults(arm)) {
    failures.push(failure);
  }

  const provenance = phase6ProtocolProvenance(repoRoot);
  // The ARM's own freeze commit, checked against this working tree. Arm 1's is checked by
  // phase6ProtocolProvenance; arm 2's is checked here because its constant lives in the arm module.
  if (arm.freezeCommit !== PHASE6_PROTOCOL_FREEZE_COMMIT) {
    if (!/^[0-9a-f]{40}$/.test(arm.freezeCommit)) {
      failures.push(
        `${arm.id} has no freeze commit registered (it reads "${arm.freezeCommit}") — this arm ` +
          "cannot show that its protocol was frozen before the sweep ran",
      );
    } else {
      try {
        execFileSync("git", ["merge-base", "--is-ancestor", arm.freezeCommit, provenance.head], {
          cwd: repoRoot,
          stdio: "ignore",
        });
      } catch {
        failures.push(
          `${arm.id}'s freeze commit ${arm.freezeCommit} is not an ancestor of HEAD ` +
            `${provenance.head} — this tree cannot show the arm was frozen before the sweep ran`,
        );
      }
    }
  }
  if (!provenance.freezeIsAncestor) {
    failures.push(
      "the registered freeze commit is not an ancestor of HEAD — this working tree cannot show " +
        "that the protocol was frozen before the sweep ran",
    );
  }
  if (!provenance.treeIsClean) {
    failures.push(
      `tracked tree is dirty, so the evidence could not be reproduced from ${provenance.head}:\n` +
        provenance.trackedStatus,
    );
  }

  return {
    ok: failures.length === 0,
    failures,
    protocolSha256,
    valuesSha256,
    justificationSha256,
    head: provenance.head,
    node: provenance.node,
    v8: provenance.v8,
  };
}

// The canonical hash is IMPORTED, never reimplemented. A local copy would have to reproduce
// gate4-evidence's key ordering and encoding exactly, and any drift between the two would make
// preflight reject a protocol that is in fact correct — a fail-closed check that fails for the
// wrong reason is worse than none, because it trains an operator to bypass it.

/**
 * Every source file whose contents can change what a sweep computes, one sha256 each, plus a digest
 * over the sorted list.
 *
 * Pin-register recommendation 10. `phase6SweepPreflight` already refuses to run on a dirty tracked
 * tree — but it checks that ONCE, before the first point. The sweep then runs unattended for hours,
 * and an edit landing at hour three is invisible to a check that finished at hour zero. That is not
 * hypothetical: the WP5 negative controls include a mid-sweep solver edit, and this session found an
 * attacker mutation to `solver-cpu/src/lk-solver.ts` still sitting in the working tree after a crash.
 *
 * Three roots, and the reason for each: `core/src` holds the physics (`alphaHK`, σ₀, the saturation
 * tables), `solver-cpu/src` the growth loop, `runner/src` the harness and the protocol itself. A
 * change anywhere in them changes what the evidence means.
 */
export interface Phase6SourceGraph {
  readonly files: readonly { path: string; sha256: string }[];
  readonly digest: string;
}

/** Source roots hashed by `phase6SourceGraph`, in the order they are walked. */
export const PHASE6_SOURCE_ROOTS = ["core/src", "solver-cpu/src", "runner/src"] as const;

export function phase6SourceGraph(repoRoot: string = process.cwd()): Phase6SourceGraph {
  const files: { path: string; sha256: string }[] = [];
  for (const root of PHASE6_SOURCE_ROOTS) {
    const base = join(repoRoot, root);
    if (!existsSync(base)) {
      // Fail LOUD rather than hashing a smaller set: a missing root would silently shrink the
      // fingerprint to whatever remained, and two runs over different file sets would compare equal.
      throw new Error(`phase6SourceGraph: source root ${root} does not exist under ${repoRoot}`);
    }
    for (const entry of readdirSync(base, { withFileTypes: true, recursive: true })) {
      if (!entry.isFile() || !entry.name.endsWith(".ts")) continue;
      const absolute = join(entry.parentPath, entry.name);
      files.push({
        // Posix-separated and repo-relative, so a Windows run and a Linux run produce the same digest.
        path: relative(repoRoot, absolute).split(sep).join("/"),
        sha256: sha256Bytes(readFileSync(absolute)),
      });
    }
  }
  files.sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
  return { files, digest: canonicalJsonSha256(files) };
}

/** What was true about the repository at one instant of a sweep. */
export interface Phase6ExecutionFingerprint {
  readonly head: string;
  readonly trackedStatus: string;
  readonly treeIsClean: boolean;
  readonly sourceGraphSha256: string;
  readonly sourceFileCount: number;
}

export function phase6ExecutionFingerprint(repoRoot: string = process.cwd()): Phase6ExecutionFingerprint {
  const provenance = phase6ProtocolProvenance(repoRoot);
  const graph = phase6SourceGraph(repoRoot);
  return {
    head: provenance.head,
    trackedStatus: provenance.trackedStatus,
    treeIsClean: provenance.treeIsClean,
    sourceGraphSha256: graph.digest,
    sourceFileCount: graph.files.length,
  };
}

/**
 * Compare the repository at the start of a sweep against the repository at the end, and name every
 * way they differ.
 *
 * The maker's standing constraint that this exists to satisfy: *"no evidence run executes while
 * another session is committing to main until the completion-time provenance re-check exists — the
 * nine-commit hazard was luck, and we don't bank luck twice."* Arm 1 ran while nine commits landed on
 * main. Nothing detected it, because nothing looked twice.
 *
 * The source-graph digest is the part that catches what `head` alone cannot: a commit that lands
 * mid-sweep moves `head`, but an *uncommitted* edit to `lk-solver.ts` at hour three moves neither
 * `head` nor — once it is reverted before the sweep ends — `trackedStatus`. The digest is taken at
 * both ends and would still differ.
 */
export function phase6CompletionDrift(
  before: Phase6ExecutionFingerprint,
  after: Phase6ExecutionFingerprint,
): readonly string[] {
  const out: string[] = [];
  if (before.head !== after.head) {
    out.push(
      `HEAD moved during the sweep: ${before.head} → ${after.head}. The evidence cannot name one ` +
        "commit that produced it",
    );
  }
  if (before.sourceGraphSha256 !== after.sourceGraphSha256) {
    out.push(
      `the executed source graph changed during the sweep: ${before.sourceGraphSha256} → ` +
        `${after.sourceGraphSha256} (${before.sourceFileCount} → ${after.sourceFileCount} files). ` +
        "Earlier points and later points did not run the same code",
    );
  }
  if (before.trackedStatus !== after.trackedStatus) {
    out.push(
      "the tracked worktree changed during the sweep:\n  before: " +
        `${before.trackedStatus === "" ? "(clean)" : before.trackedStatus}\n  after:  ` +
        `${after.trackedStatus === "" ? "(clean)" : after.trackedStatus}`,
    );
  }
  if (!after.treeIsClean) {
    out.push(`the tracked worktree is dirty at completion, so the evidence is not reproducible from ${after.head}`);
  }
  return out;
}

/** One sweep point, measured. */
export interface Phase6PointResult {
  readonly tempC: number;
  readonly fraction: number;
  readonly sigmaInf: number;
  readonly steps: number;
  readonly attached: number;
  readonly aspectRatio: number;
  readonly largestExtent: number;
  readonly symmetryError: number;
  readonly deltaSymClean: boolean;
  readonly allConverged: boolean;
  readonly domainContact: boolean;
  readonly seconds: number;
  /**
   * The configuration the CHILD reported, parsed from its own echoed header — not what the parent
   * intended to pass. Recorded because WP5 negative control 3 showed that without it, 56 rows
   * spliced from a real sweep under a DIFFERENT parameter set are indistinguishable from clean
   * ones: the artifact could not prove which parameterization produced it. `null` only if the
   * child's header could not be parsed, which `phase6ConfigFailures` then reports.
   */
  readonly config: Phase6RunConfig | null;
}

/** What a child run reported about itself. Every field is echoed by grow-lk's own header line. */
export interface Phase6RunConfig {
  readonly paramSet: string;
  readonly surfacePolicy: string;
  readonly farField: string;
  readonly dxUm: number;
  readonly pressurePa: number;
  readonly cfl: number;
  readonly relaxTol: number;
  readonly divTol: number;
  readonly relaxMaxSweeps: number;
  readonly targetExtent: number;
  readonly rngSeed: number;
  readonly noiseEpsilon: number;
  readonly seedRadius: number;
  // --- Pin-register recommendation 2. All already printed; all previously read by nothing. ---
  /** The two quantities that DEFINE the grid point, confirmed from the run rather than assumed. */
  readonly tempC: number;
  readonly sigmaInf: number;
  /** Domain shape and size, via the solver's own cell counts. Pins `dims` AND `domain`. */
  readonly dimsN: number;
  readonly hexRadius: number;
  readonly zHalfExtent: number;
  readonly activeCells: number;
  /** Pins `seedRadius` and `seedThickness` — the latter has no CLI flag at all. */
  readonly seedSites: number;
  /**
   * From the child's FINAL line, not its header: how the run ended, and at what size. A run that
   * hit the step cap is not a smaller measurement of the same thing, it is a different crystal.
   */
  readonly stopReason: string;
  readonly finalExtent: number;
}

/**
 * Compare a run's SELF-REPORTED configuration against the registered protocol. Returns the
 * disagreements by name.
 *
 * This is the check ADR 0031's defect needed and did not have. The harness passing the right flag
 * and the child using the right value are two different propositions; only the second one produced
 * the evidence.
 */
export function phase6ConfigFailures(
  config: Phase6RunConfig | null,
  /**
   * The grid point the run was supposed to be. REQUIRED rather than optional: an optional operand
   * here would mean the two quantities that define a point go unchecked wherever a caller forgot to
   * pass it, which is the same silent-default shape as ADR 0031 itself.
   */
  point: Pick<Phase6GridPoint, "tempC" | "sigmaInf">,
  arm: Phase6Arm = PHASE6_ARM1,
): readonly string[] {
  if (config === null) return ["the child's configuration header could not be parsed"];
  const f = PHASE6_CROSSPLATFORM_FIXTURE;
  const out: string[] = [];
  const eq = (name: string, got: unknown, want: unknown): void => {
    if (got !== want) out.push(`${name}: run used ${String(got)}, protocol registers ${String(want)}`);
  };
  eq("paramSet", config.paramSet, arm.paramSet);
  eq("surfacePolicy", config.surfacePolicy, f.surfacePolicy);
  eq("farField", config.farField, f.farField);
  eq("dxUm", config.dxUm, f.dxUm);
  eq("pressurePa", config.pressurePa, f.pressurePa);
  eq("cfl", config.cfl, f.cflFill);
  eq("relaxTol", config.relaxTol, f.relaxTol);
  eq("divTol", config.divTol, f.divTol);
  eq("relaxMaxSweeps", config.relaxMaxSweeps, f.relaxMaxSweeps);
  eq("targetExtent", config.targetExtent, f.targetExtent);
  eq("rngSeed", config.rngSeed, f.rngSeed);
  eq("noiseEpsilon", config.noiseEpsilon, f.noiseEpsilon);
  eq("seedRadius", config.seedRadius, f.seedRadius);

  // Pin-register recommendation 2. The point's own identity: a run at the wrong temperature or the
  // wrong supersaturation is not a bad measurement of this point, it is a measurement of another.
  eq("tempC", config.tempC, point.tempC);
  // Compared against the value the COMMAND LINE carries, not the raw float: phase6PointCommand
  // emits `point.sigmaInf.toFixed(6)`, so the child can only ever echo the rounded value and
  // comparing against the unrounded one would fail every run.
  eq("sigmaInf", config.sigmaInf, Number(point.sigmaInf.toFixed(6)));

  // Geometry, against the closed form rather than a measured literal.
  const geometry = phase6ExpectedRunGeometry(f.dims.nx, f.seedRadius, f.seedThickness);
  eq("dimsN", config.dimsN, f.dims.nx);
  eq("hexRadius", config.hexRadius, geometry.hexRadius);
  eq("zHalfExtent", config.zHalfExtent, geometry.zHalfExtent);
  if (config.activeCells !== geometry.activeCells) {
    out.push(
      `activeCells: run had ${config.activeCells}, a ${f.domain} at N=${f.dims.nx} has ` +
        `${geometry.activeCells} — this is the only check that sees the domain SHAPE, which has no ` +
        "CLI flag and is hard-coded at the sweep's solver construction",
    );
  }
  if (config.seedSites !== geometry.seedSites) {
    out.push(
      `seedSites: run seeded ${config.seedSites} sites, seedRadius=${f.seedRadius} × ` +
        `seedThickness=${f.seedThickness} gives ${geometry.seedSites} — neither has a CLI flag, so ` +
        "this token is the only evidence of what was actually seeded",
    );
  }
  return out;
}

/**
 * Parse grow-lk's echoed header — the run describing itself.
 *
 * Two regions, deliberately separated. The HEADER is what the child was configured with, printed
 * before it takes a step. The FINAL line is how it ended. Reading both matters: a step-capped run
 * has a perfectly clean header, which is precisely why a header-only check certified one.
 */
export function phase6ParseRunConfig(stdout: string): Phase6RunConfig | null {
  const at = stdout.indexOf("stop reason");
  const head = at < 0 ? stdout : stdout.slice(0, at);
  // The last one, not the first: a progress line can never contain it, but neither should this be
  // the kind of parse that a second occurrence quietly changes the meaning of.
  const tail = at < 0 ? "" : stdout.slice(stdout.lastIndexOf("stop reason"));
  const from = (region: string, re: RegExp): string | null => {
    const hit = re.exec(region);
    return hit === null ? null : (hit[1] as string);
  };
  const str = (re: RegExp): string | null => from(head, re);
  const n = (re: RegExp): number => {
    const raw = str(re);
    return raw === null ? Number.NaN : Number(raw);
  };
  const paramSet = str(/paramSet=(\S+)/);
  const surfacePolicy = str(/surfacePolicy=(\S+)/);
  const farField = str(/farField=(\S+)/);
  const stopReason = from(tail, /stop reason=(\S+)/);
  if (paramSet === null || surfacePolicy === null || farField === null || stopReason === null) return null;
  const config: Phase6RunConfig = {
    paramSet,
    surfacePolicy,
    farField,
    dxUm: n(/dx=([0-9.e+-]+)um/),
    pressurePa: n(/P=([0-9.e+-]+)Pa/),
    cfl: n(/cfl=([0-9.e+-]+)/),
    relaxTol: n(/[^v]tol=([0-9.e+-]+)/),
    divTol: n(/divTol=([0-9.e+-]+)/),
    relaxMaxSweeps: n(/maxSweeps=([0-9]+)/),
    targetExtent: n(/targetExtent=([0-9]+)/),
    rngSeed: n(/seed=([0-9]+)/),
    noiseEpsilon: n(/noise=([0-9.e+-]+)/),
    seedRadius: n(/seedRadius=([0-9]+)/),
    tempC: n(/\bT=(-?[0-9.e+-]+)C/),
    sigmaInf: n(/sigmaInf=([0-9.e+-]+)/),
    dimsN: n(/dims=([0-9]+),/),
    // Signed on purpose. A `box` domain prints `hexRadius=-1`, and matching only digits there made
    // the whole parse fail — so the sweep aborted with "header could not be parsed" instead of
    // naming the domain. Fail-closed either way, but a check should say what it found.
    hexRadius: n(/hexRadius=(-?[0-9]+)/),
    zHalfExtent: n(/zHalfExtent=(-?[0-9]+)/),
    activeCells: n(/active=([0-9]+)/),
    seedSites: n(/seedSites=([0-9]+)/),
    stopReason,
    finalExtent: Number(from(tail, /extent=([0-9]+)/) ?? Number.NaN),
  };
  return Object.values(config).some((v) => typeof v === "number" && !Number.isFinite(v)) ? null : config;
}

/** One sweep point, scored under the registered rules. */
export interface Phase6ScoredPoint {
  readonly point: Phase6GridPoint;
  readonly result: Phase6PointResult;
  readonly modelClass: Phase6ModelClass;
  readonly regime: Phase6ReferenceRegime;
  readonly score: Phase6Score;
  readonly inAmbiguityBand: boolean;
  readonly inHeadlineScope: boolean;
  readonly extentFragile: boolean;
  /** Why a point was excluded, named rather than silently dropped. */
  readonly exclusionReason: string | null;
}

/**
 * Apply the registered rules to a measured point. All of the judgement lives in the protocol;
 * this function only routes.
 *
 * A run is `invalid` — and therefore EXCLUDED BY NAME, never dropped — if it failed to converge,
 * broke D6h symmetry with noise off, or tripped the domain-contact guard. Those are runs that did
 * not happen properly, not statements about the model.
 */
export function phase6ScorePoint(
  point: Phase6GridPoint,
  result: Phase6PointResult,
  arm: Phase6Arm = PHASE6_ARM1,
): Phase6ScoredPoint {
  const invalidReasons: string[] = [];
  if (!result.allConverged) invalidReasons.push("a relaxation did not converge");
  if (!result.deltaSymClean) invalidReasons.push("a per-tick attachment delta broke D6h invariance");
  if (result.symmetryError !== 0) invalidReasons.push(`symmetryError = ${result.symmetryError} with noise off`);
  if (result.domainContact) invalidReasons.push("tripped the 65% domain-contact guard");
  // ADR 0035. The `habit-measurement-size` freeze row has registered "largest extent 21 lattice
  // cells" since WP0c, and nothing enforced it. Written as `!(x >= target)` rather than `x < target`
  // so a NaN extent — an over-budget or unparseable run — is caught rather than passed by the
  // comparison being false either way.
  const measurementSize = PHASE6_CROSSPLATFORM_FIXTURE.targetExtent;
  if (!(result.largestExtent >= measurementSize)) {
    invalidReasons.push(
      `stopped at extent ${result.largestExtent}, short of the registered measurement size ` +
        `${measurementSize} — habit is size-dependent, so this is not a smaller measurement of the ` +
        "same crystal",
    );
  }
  if (result.config !== null && result.config.stopReason !== PHASE6_REQUIRED_STOP_REASON) {
    invalidReasons.push(
      `stop reason "${result.config.stopReason}", not the registered "${PHASE6_REQUIRED_STOP_REASON}"`,
    );
  }

  const modelClass: Phase6ModelClass =
    invalidReasons.length > 0 ? "invalid" : phase6ClassifyHabit(result.aspectRatio);
  const regime = phase6ReferenceRegime(point.tempC);
  const spec = PHASE6_REFERENCE_REGIMES.find((candidate) => candidate.regime === regime);
  const inAmbiguityBand = phase6IsInAmbiguityBand(point.tempC);

  return {
    point,
    result,
    modelClass,
    regime,
    score: arm.scoreHabit(point.tempC, modelClass),
    inAmbiguityBand,
    // A point counts toward the headline only if it is in a single-habit regime AND outside the
    // ambiguity band. Both conditions were registered pre-sweep.
    inHeadlineScope: arm.inHeadlineScope(point.tempC),
    extentFragile: modelClass !== "invalid" && phase6IsExtentFragile(result.aspectRatio),
    exclusionReason: invalidReasons.length > 0 ? invalidReasons.join("; ") : null,
  };
}

export interface Phase6RegimeTally {
  readonly regime: Phase6ReferenceRegime;
  readonly inHeadline: boolean;
  readonly agree: number;
  readonly disagree: number;
  readonly excluded: number;
  readonly neutralCount: number;
  readonly extentFragile: number;
}

export interface Phase6SweepReport {
  /**
   * WHICH ARM produced this artifact. Added by the arm-2 freeze review: without it, arm 2's
   * report.json is field-for-field indistinguishable from arm 1's except by directory name, and a
   * directory name is not evidence.
   */
  readonly arm: string;
  readonly paramSet: string;
  /** The GATED hash of the arm that produced this. Previously computed and written nowhere. */
  readonly valuesSha256: string;
  readonly justificationSha256: string;
  readonly protocolSha256: string;
  readonly head: string;
  /** Historical measured-only agreement. This is not ADR 0026's registered R15 headline. */
  readonly headlineAgree: number;
  readonly headlineTotal: number;
  /**
   * The SAME points scored under arm 1's unmodified rules — the common denominator.
   *
   * ADR 0036 forecloses "reporting arm 2's headline under a denominator arm 1 was not scored
   * against, without also reporting the common one". For arm 1 these equal the headline above.
   */
  readonly headlineAgreeCommonDenominator: number;
  readonly headlineTotalCommonDenominator: number;
  /** Published beneath the headline, never above it. */
  readonly neutralCount: number;
  readonly excludedCount: number;
  readonly extentFragileCount: number;
  readonly perRegime: readonly Phase6RegimeTally[];
  /**
   * Points the arm excluded from the headline because the REFERENCE names two habits there —
   * arm 2's bistable band. Registered as "reported with its own count", which needs a field to be
   * reported in. Empty for arm 1.
   */
  readonly bistable: {
    readonly temperaturesC: readonly number[];
    readonly points: number;
    readonly agree: number;
    readonly neutralCount: number;
  };
  readonly excludedPoints: readonly { tempC: number; fraction: number; reason: string }[];
}

/**
 * Aggregate scored points into the registered report shape.
 *
 * The headline is deliberately narrow — headline-scope points only — and the counts that could
 * inflate it travel with it rather than beneath a fold: neutrals (which score disagree), named
 * exclusions, and extent-fragile flags.
 *
 * ARM-AWARE, and it was not. The arm-2 freeze review measured the defect: with arm 1's scoping the
 * `columns` row published 24 points and counted the twelve bistable agreements the exclusion exists
 * to remove — for a model that had produced no columns at all — while ADR 0036 registers that row as
 * n = 12, predicted agree 0, and calls it the arm's sharpest falsifiable claim. A per-regime table
 * scoped by a different rule than the headline it sits under is not a breakdown of that headline.
 */
export function phase6Aggregate(
  scored: readonly Phase6ScoredPoint[],
  protocolSha256: string,
  head: string,
  arm: Phase6Arm = PHASE6_ARM1,
): Phase6SweepReport {
  const headline = scored.filter((s) => s.inHeadlineScope);
  const perRegime = PHASE6_REFERENCE_REGIMES.map((spec) => {
    // Scoped by the ARM's own headline rule, so `sum(perRegime[inHeadline]) === headlineTotal` is
    // an invariant of the report rather than a coincidence of arm 1's rules. Asserted in the tests.
    const inRegime = scored.filter(
      (s) => s.regime === spec.regime && !s.inAmbiguityBand && (!spec.inHeadline || s.inHeadlineScope),
    );
    return {
      regime: spec.regime,
      inHeadline: spec.inHeadline,
      agree: inRegime.filter((s) => s.score === "agree").length,
      disagree: inRegime.filter((s) => s.score === "disagree").length,
      excluded: inRegime.filter((s) => s.score === "excluded").length,
      neutralCount: inRegime.filter((s) => s.modelClass === "neutral").length,
      extentFragile: inRegime.filter((s) => s.extentFragile).length,
    };
  });

  // The common denominator: the same measured classes, scored by arm 1's frozen rules. No free
  // choice is involved — both rules are registered — so this is a re-scoring, not a second result.
  const common = scored.filter((s) => PHASE6_ARM1.inHeadlineScope(s.point.tempC));
  const bistablePoints = scored.filter((s) => arm.isBistable(s.point.tempC));

  return {
    arm: arm.id,
    paramSet: arm.paramSet,
    valuesSha256: arm.valuesSha256(),
    justificationSha256: arm.justificationSha256(),
    protocolSha256,
    head,
    headlineAgree: headline.filter((s) => s.score === "agree").length,
    headlineTotal: headline.filter((s) => s.score !== "excluded").length,
    headlineAgreeCommonDenominator: common.filter(
      (s) => PHASE6_ARM1.scoreHabit(s.point.tempC, s.modelClass) === "agree",
    ).length,
    headlineTotalCommonDenominator: common.filter(
      (s) => PHASE6_ARM1.scoreHabit(s.point.tempC, s.modelClass) !== "excluded",
    ).length,
    neutralCount: scored.filter((s) => s.modelClass === "neutral").length,
    excludedCount: scored.filter((s) => s.score === "excluded").length,
    extentFragileCount: scored.filter((s) => s.extentFragile).length,
    perRegime,
    bistable: {
      temperaturesC: [...new Set(bistablePoints.map((s) => s.point.tempC))].sort((a, b) => b - a),
      points: bistablePoints.length,
      agree: bistablePoints.filter((s) => s.score === "agree").length,
      neutralCount: bistablePoints.filter((s) => s.modelClass === "neutral").length,
    },
    excludedPoints: scored
      .filter((s) => s.exclusionReason !== null)
      .map((s) => ({
        tempC: s.point.tempC,
        fraction: s.point.fraction,
        reason: s.exclusionReason as string,
      })),
  };
}

/** The registered grid, as the harness will execute it. */
export function phase6SweepPlan(): readonly Phase6GridPoint[] {
  return phase6SweepGrid();
}

/**
 * The `grow-lk` argument vector for one registered grid point. Built from the protocol so a
 * sweep command cannot drift from the frozen configuration, and exported so the runbook and the
 * tests can assert they are the same thing.
 */
export function phase6PointCommand(
  point: Phase6GridPoint,
  arm: Phase6Arm = PHASE6_ARM1,
): readonly string[] {
  const fixture = PHASE6_CROSSPLATFORM_FIXTURE;
  return [
    "runner/src/main.ts", "grow-lk",
    "--temp-c", String(point.tempC),
    "--sigma-inf", point.sigmaInf.toFixed(6),
    "--dims", `${fixture.dims.nx},${fixture.dims.ny},${fixture.dims.nz}`,
    "--dx-um", String(fixture.dxUm),
    "--cfl", String(fixture.cflFill),
    "--target-extent", String(fixture.targetExtent),
    "--surface-policy", fixture.surfacePolicy,
    "--far-field", fixture.farField,
    // ADR 0031. Passed EXPLICITLY from the protocol constant, never inherited from a CLI default.
    // The sweep of 6995868 omitted this flag; `runner/src/main.ts` defaults `paramSet` to
    // "CAK_A1", so every one of its 204 runs used A_prism ≡ 1 while the registered interpolation
    // row said A_prism is interpolated. The fixture even declared `paramSet` — it was simply
    // never emitted, and the default happened to match, so nothing failed loudly.
    "--param-set", arm.paramSet,
    "--metrics-every", "100000",
  ];
}

/** Domain spot-check verdict at the sweep's fastest-growing point. */
export function phase6DomainSpotCheckPasses(
  coarse: { attached: number; modelClass: Phase6ModelClass },
  fine: { attached: number; modelClass: Phase6ModelClass },
): { passed: boolean; reason: string } {
  if (PHASE6_DOMAIN_SPOT_CHECK.requireIdenticalClass && coarse.modelClass !== fine.modelClass) {
    return {
      passed: false,
      reason: `habit class differs between N=${PHASE6_DOMAIN_SPOT_CHECK.coarseN} (${coarse.modelClass}) ` +
        `and N=${PHASE6_DOMAIN_SPOT_CHECK.fineN} (${fine.modelClass})`,
    };
  }
  const relative = Math.abs(fine.attached - coarse.attached) / coarse.attached;
  if (relative > PHASE6_DOMAIN_SPOT_CHECK.attachedCountTolerance) {
    return {
      passed: false,
      reason: `attached counts differ by ${(relative * 100).toFixed(2)}%, over the registered ` +
        `${(PHASE6_DOMAIN_SPOT_CHECK.attachedCountTolerance * 100).toFixed(1)}%`,
    };
  }
  return { passed: true, reason: "class identical and attached counts within the registered tolerance" };
}

/** Exposed for the runner's preflight command. */
export function phase6GitHead(repoRoot: string = process.cwd()): string {
  return execFileSync("git", ["rev-parse", "HEAD"], { cwd: repoRoot, encoding: "utf8" }).trim();
}

/** Registered domain-contact guard: charter §3.1, 65% of any domain extent. */
export const PHASE6_DOMAIN_CONTACT_FRACTION = 0.65;

/**
 * Parse one `grow-lk` stdout into a measured point. Returns null when the run produced no
 * parseable summary at all, which the caller records as an excluded point rather than a zero.
 */
export function phase6ParseRun(
  point: Phase6GridPoint,
  stdout: string,
  seconds: number,
  domainN: number,
): Phase6PointResult | null {
  const tail = stdout.split("stop reason")[1];
  if (tail === undefined) return null;
  const num = (re: RegExp): number => {
    const hit = re.exec(tail);
    return hit === null ? Number.NaN : Number(hit[1]);
  };
  const largestExtent = num(/extent=(\d+)/);
  const aspectRatioValue = num(/AR=([0-9.e+-]+)/);
  if (!Number.isFinite(largestExtent) || !Number.isFinite(aspectRatioValue)) return null;
  return {
    tempC: point.tempC,
    fraction: point.fraction,
    sigmaInf: point.sigmaInf,
    steps: num(/step=(\d+)/),
    attached: num(/attached=(\d+)/),
    aspectRatio: aspectRatioValue,
    largestExtent,
    symmetryError: num(/symErr=([0-9.e+-]+)/),
    deltaSymClean: /deltaSymClean=true/.test(tail),
    allConverged: /allConverged=true/.test(tail),
    // Computed rather than parsed: the guard is a property of the geometry, and a run that
    // reached it must be excluded whether or not the runner happened to print it.
    domainContact: largestExtent / domainN > PHASE6_DOMAIN_CONTACT_FRACTION,
    seconds,
    config: phase6ParseRunConfig(stdout),
  };
}

export interface Phase6SweepProgress {
  readonly done: number;
  readonly total: number;
  readonly scored: Phase6ScoredPoint;
  /**
   * Every point finished so far, including this one.
   *
   * Passed in rather than left for the caller to accumulate, because the obvious way to
   * accumulate — reading the binding that `await phase6RunSweep(...)` assigns — is a temporal
   * dead zone error: the callback fires while that await is still pending. It threw on the first
   * completed point of the first real sweep, after 814 seconds of compute. Handing the array to
   * the callback removes the mistake rather than documenting it.
   */
  readonly accumulated: readonly Phase6ScoredPoint[];
}

/**
 * Execute the registered grid, one child process per point, `concurrency` at a time.
 *
 * Independent processes rather than threads, the Phase 2b v5p pattern: a point that throws
 * cannot corrupt another, and each carries its own memory. Wall seconds are recorded per point
 * but are contended by construction and are NOT a cost measurement.
 */
export async function phase6RunSweep(options: {
  readonly concurrency: number;
  readonly repoRoot: string;
  readonly onPoint?: (progress: Phase6SweepProgress) => void;
  readonly points?: readonly Phase6GridPoint[];
  /** Per-point wall budget; default 3 h. Over-budget points are excluded by name. */
  readonly pointBudgetMs?: number;
  /** Which arm. Defaults to arm 1, whose behaviour is the published one. */
  readonly arm?: Phase6Arm;
}): Promise<readonly Phase6ScoredPoint[]> {
  const arm = options.arm ?? PHASE6_ARM1;
  const { execFile } = await import("node:child_process");
  const queue = options.points ?? phase6SweepPlan();
  const domainN = PHASE6_CROSSPLATFORM_FIXTURE.dims.nx;
  const scored: Phase6ScoredPoint[] = [];
  let next = 0;
  // Taken BEFORE the first child starts, and compared against the same measurement after the last
  // one finishes. Preflight's clean-tree check happens once at hour zero; this is what makes the
  // guarantee cover all of the hours after it.
  const before = phase6ExecutionFingerprint(options.repoRoot);

  const runOne = (point: Phase6GridPoint): Promise<Phase6ScoredPoint> =>
    new Promise((resolve, reject) => {
      const started = Date.now();
      // A per-point wall budget, because this runs unattended overnight and one pathological
      // point must not hold a worker forever. A point that exceeds it is killed and lands with
      // no parseable summary, which the path below already excludes BY NAME — so an over-budget
      // point is reported as excluded rather than silently missing from the denominator.
      let overBudget = false;
      const child = execFile(
        process.execPath,
        [...phase6PointCommand(point, arm)],
        { cwd: options.repoRoot, encoding: "utf8", maxBuffer: 128 * 1024 * 1024 },
        (error, stdout) => {
          clearTimeout(timer);
          const seconds = (Date.now() - started) / 1000;
          if (overBudget) {
            resolve(
              phase6ScorePoint(point, {
                tempC: point.tempC,
                fraction: point.fraction,
                sigmaInf: point.sigmaInf,
                steps: Number.NaN,
                attached: Number.NaN,
                aspectRatio: Number.NaN,
                largestExtent: Number.NaN,
                symmetryError: Number.NaN,
                deltaSymClean: false,
                allConverged: false,
                domainContact: false,
                config: null,
                seconds,
              }, arm),
            );
            return;
          }
          const parsed = phase6ParseRun(point, String(stdout ?? ""), seconds, domainN);
          // WP5 negative control 3. A run whose SELF-REPORTED configuration disagrees with the
          // registered protocol is not a bad data point — it means the harness is producing evidence
          // under a configuration nobody registered, which is ADR 0031 happening again. Abort the
          // whole sweep rather than continue and publish a mixed artifact, which control 3 showed is
          // indistinguishable from a clean one.
          if (parsed !== null) {
            const configFailures = phase6ConfigFailures(parsed.config, point, arm);
            if (configFailures.length > 0) {
              reject(
                new Error(
                  `T=${point.tempC} f=${point.fraction} ran under a configuration the protocol does ` +
                    "not register, so the sweep is aborted rather than producing mixed evidence:" +
                    configFailures.map((f) => `
  - ${f}`).join(""),
                ),
              );
              return;
            }
          }
          if (parsed === null) {
            // A point that produced no summary is EXCLUDED BY NAME, never silently skipped and
            // never scored as a habit. Encoded as an unconverged result so the single scoring
            // path in phase6ScorePoint handles it.
            resolve(
              phase6ScorePoint(point, {
                tempC: point.tempC,
                fraction: point.fraction,
                sigmaInf: point.sigmaInf,
                steps: Number.NaN,
                attached: Number.NaN,
                aspectRatio: Number.NaN,
                largestExtent: Number.NaN,
                symmetryError: Number.NaN,
                deltaSymClean: false,
                allConverged: false,
                domainContact: false,
                config: null,
                seconds,
              }, arm),
            );
            return;
          }
          if (error !== null && error !== undefined) {
            resolve(phase6ScorePoint(point, { ...parsed, allConverged: false }, arm));
            return;
          }
          resolve(phase6ScorePoint(point, parsed, arm));
        },
      );
      const timer = setTimeout(() => {
        overBudget = true;
        child.kill();
      }, options.pointBudgetMs ?? 3 * 60 * 60 * 1000);
      child.on("error", () => {
        /* the callback above already resolves this point */
      });
    });

  async function worker(): Promise<void> {
    while (next < queue.length) {
      const point = queue[next++] as Phase6GridPoint;
      const result = await runOne(point);
      scored.push(result);
      options.onPoint?.({
        done: scored.length,
        total: queue.length,
        scored: result,
        accumulated: scored,
      });
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(options.concurrency, queue.length) }, () => worker()),
  );

  // Pin-register recommendation 10. THROW rather than return: `main.ts` writes `report.json` and
  // `diagram.svg` after this resolves, so throwing means the artifact set is never completed. A
  // sweep whose code changed underneath it must not be able to publish, and a warning printed
  // beneath 204 lines of progress output is not a gate.
  const drift = phase6CompletionDrift(before, phase6ExecutionFingerprint(options.repoRoot));
  if (drift.length > 0) {
    throw new Error(
      "the repository changed between the start and the end of this sweep, so no artifact is " +
        "written — the evidence could not name one commit and one source tree that produced it:" +
        drift.map((d) => `\n  - ${d}`).join(""),
    );
  }
  return scored;
}
