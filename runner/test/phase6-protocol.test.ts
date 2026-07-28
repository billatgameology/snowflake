// Phase 6 pre-registration tests. Two jobs: the freeze cannot be declared complete while the
// charter still requires something, and the registered interpolation scheme cannot drift away
// from the solver it claims to describe.

import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { canonicalJsonSha256 } from "../src/gate4-evidence.ts";
import {
  alphaHK,
  isLKSurfacePolicy,
  metersSmootherDrift,
  nucleationABasal,
  nucleationAPrism,
  sigma0Basal,
  sigma0Prism,
  sigmaWater,
  usesCanonicalOpposingOrder,
  type LKSurfacePolicy,
} from "../../core/src/index.ts";
import {
  phase6FreezeComplete,
  phase6MeasureInterpolationError,
  phase6PendingFreezeItems,
  phase6AmbiguityHalfWidthC,
  phase6ProtocolManifest,
  PHASE6_REFERENCE_BOUNDARY_UNCERTAINTY_C,
  phase6SigmaWaterFromTable,
  PHASE6_FAR_FIELD,
  PHASE6_ENGINE_CONTROL,
  PHASE6_FREEZE_LIST,
  PHASE6_INTERPOLATION,
  PHASE6_INTERPOLATION_LEAVE_ONE_OUT,
  PHASE6_LATENT_HEATING,
  PHASE6_SIGMA0_ANCHORS_X,
  PHASE6_SIGMA_WATER_ANCHORS,
  PHASE6_SIGMA0_DIGITIZATION_BAND,
  PHASE6_SURFACE_POLICY,
  PHASE6_AMBIGUITY_HALF_WIDTH_C,
  PHASE6_NAKAYA_BOUNDARIES_C,
  PHASE6_EXTRAPOLATION_ORDER_WINDOW,
  phase6FitGridExtrapolation,
  PHASE6_HEADLINE_SCOPE_C,
  PHASE6_REFERENCE_REGIMES,
  phase6DetectFlips,
  phase6ReferenceRegime,
  phase6RegimeBudget,
  phase6ScoreHabit,
  PHASE6_PARAMETER_TABLE_SHA256,
  PHASE6_PROTOCOL_FREEZE_COMMIT,
  PHASE6_PROTOCOL_SHA256,
  PHASE6_PROTOCOL_REVISIONS,
  phase6ProtocolProvenance,
  type Phase6FreezeItem,
  PHASE6_T_GRID,
  phase6SigmaInf,
  phase6SweepGrid,
  phase6DistanceToNearestBoundaryC,
  phase6EvidencePartition,
  phase6IsInAmbiguityBand,
  phase6TemperatureGrid,
} from "../src/phase6-protocol.ts";

describe("the Phase 6 freeze list", () => {
  it("carries every item the charter and its amendments name", () => {
    // Charter §3.2 Phase 6 item 1, expanded by ADR 0005 D4 and amended by 0006 and 0009. If a
    // row is ever dropped from the module, this test names the row that went missing.
    const required = [
      "t-sigma-grid",
      "habit-measurement-size",
      "metric-thresholds",
      "uncertainty-reporting",
      "boundary-ambiguity-band",
      "parameter-table",
      "parameter-interpolation",
      "pressure",
      "physical-seed-size",
      "noise-amplitude",
      "far-field",
      "domain-budgets",
      "dx",
      "surface-policy",
      "fill-cfl",
      "residual-tolerance",
      "div-tol",
      "relax-max-sweeps",
      "float-precision",
      "seed-ensemble-size",
      "code-version",
      "agreement-scoring",
    ];
    const registered = PHASE6_FREEZE_LIST.map((item) => item.id);
    for (const id of required) expect(registered).toContain(id);
    // No duplicates, and every item states where its value comes from.
    expect(new Set(registered).size).toBe(registered.length);
    for (const item of PHASE6_FREEZE_LIST) {
      expect(item.requirement.length).toBeGreaterThan(0);
      expect(item.source.length).toBeGreaterThan(0);
      expect(item.status === "registered" ? item.value !== null : item.value === null).toBe(true);
    }
  });

  it("is COMPLETE, so the manifest exists and carries a pinned hash", () => {
    expect(phase6FreezeComplete()).toBe(true);
    expect(phase6PendingFreezeItems()).toHaveLength(0);
    // Changing ANY registered value — a temperature, a fraction, a tolerance, even a
    // justification string — moves this hash and fails here, rather than silently producing
    // sweep evidence under a protocol nobody agreed to.
    expect(canonicalJsonSha256(phase6ProtocolManifest())).toBe(PHASE6_PROTOCOL_SHA256);
    // The hash must not be inside the thing it hashes.
    expect(JSON.stringify(phase6ProtocolManifest())).not.toContain(PHASE6_PROTOCOL_SHA256);
    // The current hash must be the newest registered revision, and the history must be kept:
    // the freeze is amended through ADRs, never edited in place.
    const revisions = PHASE6_PROTOCOL_REVISIONS;
    expect(revisions[revisions.length - 1]?.sha256).toBe(PHASE6_PROTOCOL_SHA256);
    expect(new Set(revisions.map((r) => r.sha256)).size).toBe(revisions.length);
  });

  it("hashes the SCORING rule, not only the grid", () => {
    // Caught while amending: the ADR 0025 content was registered but absent from the manifest,
    // so the protocol hash did not move when the accepted-class matrix was added. A hash that
    // pins the grid while leaving the rule that turns runs into a verdict editable is worse
    // than no hash, because it looks like protection.
    const manifest = JSON.stringify(phase6ProtocolManifest());
    expect(manifest).toContain("columns-and-plates");
    expect(manifest).toContain("headlineScopeC");
    const scoring = PHASE6_FREEZE_LIST.find((item) => item.id === "agreement-scoring");
    expect(scoring?.status).toBe("registered");
    expect(scoring?.value).toContain("neutral = DISAGREE");
    expect(scoring?.value).toContain("EXCLUDED from the headline");
  });

  it("still refuses to produce a manifest if anything is pending", () => {
    // The fail-closed property, kept under test now that nothing real is pending to exercise
    // it. A sweep must not be able to quote a protocol hash the freeze has not earned.
    const withPending: Phase6FreezeItem[] = [
      ...PHASE6_FREEZE_LIST,
      {
        id: "synthetic-unfrozen-item",
        group: "numerics",
        status: "pending",
        requirement: "a requirement nobody has answered",
        value: null,
        source: "test only",
      },
    ];
    expect(phase6FreezeComplete(withPending)).toBe(false);
    expect(() => phase6ProtocolManifest(withPending)).toThrow(/not frozen/);
    // The error names what is missing, so the failure is actionable rather than opaque.
    expect(() => phase6ProtocolManifest(withPending)).toThrow(/synthetic-unfrozen-item/);
  });

  it("names a freeze commit that is a real ancestor of HEAD", () => {
    // "The protocol was frozen before the sweep ran" has to be checkable, not asserted. The
    // commit named by code-version is the one where every substantive value became final; it is
    // recorded from the following commit because a commit cannot contain its own hash.
    expect(PHASE6_PROTOCOL_FREEZE_COMMIT).toMatch(/^[0-9a-f]{40}$/);
    const provenance = phase6ProtocolProvenance();
    expect(provenance.freezeIsAncestor).toBe(true);
    expect(provenance.head).toMatch(/^[0-9a-f]{40}$/);
    const codeVersion = PHASE6_FREEZE_LIST.find((item) => item.id === "code-version");
    expect(codeVersion?.value).toBe(PHASE6_PROTOCOL_FREEZE_COMMIT);
    // treeIsClean is NOT asserted here: a working tree is dirty during development by design.
    // It is a gate-time requirement on evidence production, not a condition on the test suite.
  });

  it("has the conditions the charter fixes outright already registered", () => {
    const byId = new Map(PHASE6_FREEZE_LIST.map((item) => [item.id, item]));
    expect(byId.get("far-field")?.status).toBe("registered");
    expect(byId.get("far-field")?.value).toBe(PHASE6_FAR_FIELD);
    // ADR 0024 moved this off fixed-σ Dirichlet; the plan and the module must not drift apart.
    expect(PHASE6_FAR_FIELD).toBe("monopole-matched");
    expect(byId.get("surface-policy")?.status).toBe("registered");
    expect(PHASE6_SURFACE_POLICY).toBe("aggregate-hv-g1h1-v6");
  });

  it("registers what WP3 measured, with each value tied to the study that produced it", () => {
    // WP0c registers these from WP3's convergence report. Each is pinned with the property that
    // makes it defensible, so a later edit that keeps the number but loses the reasoning fails.
    const byId = new Map(PHASE6_FREEZE_LIST.map((item) => [item.id, item]));

    // Measurement size: set by the SLOWEST-developing habit. The failure this avoids is not
    // subtle — extent 9 misclassifies the cold half of the diagram.
    expect(byId.get("habit-measurement-size")?.status).toBe("registered");
    expect(byId.get("habit-measurement-size")?.value).toContain("21");
    expect(byId.get("habit-measurement-size")?.source).toContain("slowest-developing");

    // Domain: measured AT the registered extent. WP3's whole sequencing lesson is in that word.
    expect(byId.get("domain-budgets")?.status).toBe("registered");
    expect(byId.get("domain-budgets")?.value).toContain("48");
    expect(byId.get("domain-budgets")?.source).toContain("registered measurement extent");
    // And it must carry the two limits on its own transferability.
    expect(byId.get("domain-budgets")?.source).toContain("re-measured");
    expect(byId.get("domain-budgets")?.source).toContain("fastest-growing");

    // fill-CFL: adequate for class, NOT for volume. Both halves must survive together.
    expect(byId.get("fill-cfl")?.value).toBe("0.1");
    expect(byId.get("fill-cfl")?.source).toContain("8.7%");
    expect(byId.get("fill-cfl")?.source).toContain("NOT adequate");

    // The charter asks for the residual tolerance AND ITS NORM.
    expect(byId.get("residual-tolerance")?.value).toContain("1e-9");
    expect(byId.get("residual-tolerance")?.value).toContain("SUCCESSIVE-ITERATE CHANGE");
    expect(byId.get("div-tol")?.value).toContain("RELATIVE");

    // Ensemble size 1 is a consequence of noise = 0, not an independent choice; if noise ever
    // becomes nonzero this pairing must be revisited, so they are asserted together.
    expect(byId.get("noise-amplitude")?.value).toContain("0");
    expect(byId.get("seed-ensemble-size")?.value).toContain("1");
    expect(byId.get("seed-ensemble-size")?.source).toContain("noise-amplitude = 0");

    // Δx is registered, but its row must keep saying that the value is not converged — the
    // number alone would read as a settled choice, which is exactly what it is not.
    expect(byId.get("dx")?.status).toBe("registered");
    expect(byId.get("dx")?.source).toContain("does not converge");
  });

  it("enforces the frozen parameter table by content, not by promise", () => {
    // The charter freezes docs/libbrecht-parameters.md in full. A freeze nothing checks is a
    // comment, so this recomputes the hash from the file on every run: an edit to the physics
    // inputs fails here rather than silently changing what a completed sweep was run against.
    const source = readFileSync(new URL("../../docs/libbrecht-parameters.md", import.meta.url), "utf8");
    // LF-normalized — this repo checks out CRLF, and the hash must describe the content rather
    // than the checking-out machine's git configuration. Without this the arm64 cross-platform
    // control would fail on a difference that has nothing to do with the physics.
    const normalized = source.replace(/\r\n/g, "\n");
    const digest = createHash("sha256").update(normalized, "utf8").digest("hex");
    expect(digest).toBe(PHASE6_PARAMETER_TABLE_SHA256);
    // The file must also SAY it is frozen, so a reader of the document alone is not misled.
    expect(normalized).toContain("FROZEN 2026-07-27");
    expect(normalized).toContain("invalidates every Phase 6 sweep result");
  });

  it("reports uncertainty as class robustness, not as an interval on the ratio", () => {
    const scheme = PHASE6_FREEZE_LIST.find((item) => item.id === "uncertainty-reporting");
    expect(scheme?.status).toBe("registered");
    // The unconverged grid is carried by reporting BOTH classes, not by widening a bar.
    expect(scheme?.value).toContain("classSurvivesGridExtrapolation");
    expect(scheme?.source).toContain("CLASS ROBUSTNESS");
    // The headline must be the CONSERVATIVE INTERSECTION. Counting agreement twice and quoting
    // the friendlier number is the failure mode a dual report invites.
    expect(scheme?.value).toContain("CONSERVATIVE INTERSECTION");
    expect(scheme?.value).toContain("BENEATH it, never as the top line");
    expect(scheme?.value).toContain("not-extrapolatable");
    const operator = PHASE6_FREEZE_LIST.find((i) => i.id === "grid-extrapolation-operator");
    expect(operator?.status).toBe("registered");
    expect(operator?.value).toContain(String(PHASE6_EXTRAPOLATION_ORDER_WINDOW.lowest));
    // The parameter-side uncertainties are swept, not folded in — they move the inputs, not
    // the measurement, so averaging them into one bar would hide a structural question.
    expect(scheme?.source).toContain("NOT folded in");
    expect(scheme?.source).toContain("WP4");
    // The global qualifiers that must travel with every table.
    for (const qualifier of ["8.7%", "latent heating", "arm64", "extent-31"]) {
      expect(scheme?.value, qualifier).toContain(qualifier);
    }
  });

  it("registers the D6h-equivariant policy and departs from the runner default deliberately", () => {
    // Two separate hazards, pinned together.
    //
    // The first is the one this test originally caught: a calibration probe printed
    // `surfacePolicy=aggregate-hv-g1h1-v5` while the freeze list had registered ADR 0009's
    // `-v4`, which no run uses since ADRs 0013/0014 added the metered smoother-drift term.
    // Freezing a policy nothing runs is precisely the drift this list exists to catch.
    //
    // The second is WP0b's: v4 and v5 sum the Eq. 5.35 opposing-vapor operands in gather order,
    // which is not D6h-equivariant in float64, so a noise-off `symErr = 0` under them means
    // "did not stop mid-split" rather than "was symmetric". Phase 6 therefore registers ADR
    // 0023's v6 and must NAME it: the runner default stays v5 so Phase 2b replays unchanged.
    // Pinning both values keeps that difference deliberate instead of letting either drift.
    const runnerSource = readFileSync(new URL("../src/main.ts", import.meta.url), "utf8");
    const runnerDefault = /surfacePolicy:\s*"([a-z0-9-]+)"/.exec(runnerSource)?.[1];
    expect(runnerDefault).toBe("aggregate-hv-g1h1-v5");
    expect(PHASE6_SURFACE_POLICY).not.toBe(runnerDefault);
    expect(isLKSurfacePolicy(PHASE6_SURFACE_POLICY)).toBe(true);
    expect(usesCanonicalOpposingOrder(PHASE6_SURFACE_POLICY)).toBe(true);
    expect(usesCanonicalOpposingOrder(runnerDefault as LKSurfacePolicy)).toBe(false);
    // v6 keeps v5's divergence identity, so the drift evidence Phase 6 collects is the same.
    expect(metersSmootherDrift(PHASE6_SURFACE_POLICY)).toBe(true);
  });
});

describe("the registered temperature axis", () => {
  it("is uniform 1 C over the digitized figure's own range", () => {
    const grid = phase6TemperatureGrid();
    expect(grid.length).toBe(34);
    expect(grid[0]).toBe(-2);
    expect(grid[grid.length - 1]).toBe(-35);
    // Uniform, and uniform is load-bearing: phase6AmbiguityHalfWidthC takes ONE spacing, so a
    // mixed grid would leave no honest value to hand it.
    for (let i = 1; i < grid.length; i++) {
      expect((grid[i - 1] as number) - (grid[i] as number)).toBeCloseTo(PHASE6_T_GRID.spacingC, 12);
    }
    // It must reach past the coldest boundary far enough to test the caption's sub-30 claim.
    expect(grid[grid.length - 1]).toBeLessThan(-30);
  });

  it("publishes its evidence budget before any run happens", () => {
    // Registering this pre-sweep is the point: afterwards, "the disagreeing points happened to
    // be near a boundary" is exactly the post-hoc move the charter freeze exists to prevent.
    const { counting, ambiguous } = phase6EvidencePartition();
    expect(counting.length + ambiguous.length).toBe(phase6TemperatureGrid().length);
    expect(ambiguous).toEqual([-3, -4, -9, -10, -21, -22]);
    expect(counting.length).toBe(28);
    // Every boundary is flanked, so no boundary is scored more leniently than another.
    for (const boundary of PHASE6_NAKAYA_BOUNDARIES_C) {
      const flanking = ambiguous.filter(
        (t) => Math.abs(t - boundary) <= PHASE6_AMBIGUITY_HALF_WIDTH_C,
      );
      expect(flanking.length, `boundary ${boundary}`).toBe(2);
    }
    // Most of the axis must still count, or the comparison could not conclude anything.
    expect(counting.length / phase6TemperatureGrid().length).toBeGreaterThan(0.75);
  });

  it("cuts both ways — the band suppresses agreement as well as disagreement", () => {
    // A model that agreed with the diagram only near boundaries would have demonstrated
    // nothing, so membership is a pure function of temperature and knows nothing about outcome.
    expect(phase6IsInAmbiguityBand(-10)).toBe(true);
    expect(phase6IsInAmbiguityBand(-15)).toBe(false);
    expect(phase6DistanceToNearestBoundaryC(-10)).toBeCloseTo(0.1, 12);
    expect(phase6DistanceToNearestBoundaryC(-15)).toBeCloseTo(5.1, 12);
    // Exactly on the band edge counts as ambiguous — the inclusive side is the cautious one.
    expect(phase6IsInAmbiguityBand(-9.9 - PHASE6_AMBIGUITY_HALF_WIDTH_C)).toBe(true);
  });
});

describe("the grid-extrapolation operator (ADR 0026)", () => {
  // The spacings and values WP3 §4.2 measured at the REGISTERED measurement extent.
  const H = [0.7, 0.35, 0.2333333] as const;

  it("reproduces the measured cold fit and admits it", () => {
    const cold = phase6FitGridExtrapolation(H, [0.7246, 1.1053, 1.2222]);
    expect(cold.fittedOrder).toBeCloseTo(1.142, 2);
    expect(cold.admitted).toBe(true);
    expect(cold.extrapolatedAR).toBeCloseTo(1.456, 3);
    // The whole point of the cold result: it stays neutral in the grid limit.
    expect(cold.extrapolatedAR as number).toBeLessThan(1.5);
  });

  it("REFUSES warm, because its extrapolated class depends on the assumed order", () => {
    const warm = phase6FitGridExtrapolation(H, [0.3106, 0.3821, 0.4194]);
    expect(warm.fittedOrder).toBeCloseTo(0.207, 2);
    expect(warm.admitted).toBe(false);
    expect(warm.extrapolatedAR).toBeNull();
    expect(warm.reason).toContain("not-extrapolatable");
    // Why refusing matters: at the fitted order the limit is 0.84 (neutral), at first order
    // 0.49 (plate). Reporting either as "the extrapolated class" would be inventing a result.
    const atFirstOrder = 0.4194 + (0.4194 - 0.3821) / (0.35 / 0.2333333 - 1);
    expect(atFirstOrder).toBeLessThan(1 / 1.5); // plate
    const atFitted = 0.4194 + (0.4194 - 0.3821) / (Math.pow(0.35 / 0.2333333, 0.207) - 1);
    expect(atFitted).toBeGreaterThan(1 / 1.5); // neutral — a different class
  });

  it("fits the order rather than assuming it, which is what §4.1 got wrong", () => {
    // A synthetic exactly-first-order sequence must fit p = 1 on these non-uniform ratios.
    const exact = H.map((h) => 2 + 3 * h) as unknown as [number, number, number];
    const fit = phase6FitGridExtrapolation(H, exact);
    expect(fit.fittedOrder).toBeCloseTo(1, 2);
    expect(fit.admitted).toBe(true);
    expect(fit.extrapolatedAR as number).toBeCloseTo(2, 3); // recovers the true limit
  });

  it("rejects spacings that are not ordered coarsest to finest", () => {
    expect(() => phase6FitGridExtrapolation([0.2333, 0.35, 0.7], [1, 2, 3])).toThrow(
      /coarsest to finest/,
    );
  });
});

describe("the agreement-scoring rule (ADR 0025)", () => {
  it("maps every counting temperature onto exactly one reference regime", () => {
    const budget = phase6RegimeBudget();
    expect(budget.map((b) => b.regime)).toEqual([
      "plates-warm",
      "columns",
      "plates-cold",
      "columns-and-plates",
    ]);
    // The per-regime split must reconstruct the published 28/6 partition exactly, or the two
    // registrations disagree about what the evidence budget is.
    expect(budget.reduce((sum, b) => sum + b.counting.length, 0)).toBe(28);
    expect(budget.reduce((sum, b) => sum + b.ambiguous.length, 0)).toBe(6);
    expect(budget.map((b) => b.counting.length)).toEqual([1, 4, 10, 13]);
  });

  it("states the warmest regime's one-point limitation rather than hiding it", () => {
    // Registered as a known weakness: with a single counting temperature this regime can only
    // score 0% or 100%. Discovering that in the report would be far worse than declaring it.
    const warm = phase6RegimeBudget().find((b) => b.regime === "plates-warm");
    expect(warm?.counting).toEqual([-2]);
  });

  it("keeps the mixed cold regime OUT of the headline", () => {
    // 'Columns and Plates' accepts both pure classes, so a model producing anything but neutral
    // scores agreement almost for free — and those points are 46% of the counting budget.
    const cold = phase6RegimeBudget().find((b) => b.regime === "columns-and-plates");
    expect(cold?.inHeadline).toBe(false);
    expect(cold?.counting.length).toBe(13);
    expect(phase6ScoreHabit(-30, "plate")).toBe("agree");
    expect(phase6ScoreHabit(-30, "column")).toBe("agree");
    // Headline scope covers the three single-habit regimes only.
    const headline = phase6RegimeBudget().filter((b) => b.inHeadline);
    expect(headline.reduce((sum, b) => sum + b.counting.length, 0)).toBe(15);
    expect(PHASE6_HEADLINE_SCOPE_C.coldestC).toBe(-21.5);
  });

  it("scores neutral as disagreement and invalid as a named exclusion", () => {
    // The distinction that matters: the reference names a habit in every regime, so producing
    // neither is a failure to reproduce, not an abstention. A model that never commits must not
    // be able to report perfect agreement.
    expect(phase6ScoreHabit(-15, "plate")).toBe("agree");
    expect(phase6ScoreHabit(-15, "column")).toBe("disagree");
    expect(phase6ScoreHabit(-15, "neutral")).toBe("disagree");
    expect(phase6ScoreHabit(-6, "column")).toBe("agree");
    expect(phase6ScoreHabit(-6, "plate")).toBe("disagree");
    // Even in the permissive mixed regime, neutral is still a disagreement.
    expect(phase6ScoreHabit(-30, "neutral")).toBe("disagree");
    // A run that did not happen properly is not a statement about the model.
    for (const tempC of [-2, -15, -30]) {
      expect(phase6ScoreHabit(tempC, "invalid")).toBe("excluded");
    }
  });

  it("puts the regime edges on the reference's own boundaries", () => {
    expect(phase6ReferenceRegime(-2)).toBe("plates-warm");
    expect(phase6ReferenceRegime(-3.3)).toBe("columns"); // cold edge is inclusive
    expect(phase6ReferenceRegime(-9)).toBe("columns");
    expect(phase6ReferenceRegime(-9.9)).toBe("plates-cold");
    expect(phase6ReferenceRegime(-21.5)).toBe("columns-and-plates");
    // The edges must BE the digitized boundaries, not copies that could drift from them.
    for (const boundary of PHASE6_NAKAYA_BOUNDARIES_C) {
      expect(PHASE6_REFERENCE_REGIMES.some((spec) => spec.colderBoundC === boundary)).toBe(true);
    }
    // Total and single-valued over the whole registered axis, with no gaps or overlaps.
    for (const tempC of phase6TemperatureGrid()) {
      const matches = PHASE6_REFERENCE_REGIMES.filter((spec) => {
        const warmOk = spec.warmerBoundC === null || tempC <= spec.warmerBoundC;
        const coldOk = spec.colderBoundC === null || tempC > spec.colderBoundC;
        return warmOk && coldOk;
      });
      expect(matches, `T=${tempC}`).toHaveLength(1);
    }
  });

  it("brackets a flip instead of pinpointing it, and neutrals widen the bracket", () => {
    // Collapsing a flip to a midpoint would manufacture precision the grid does not have.
    const flips = phase6DetectFlips([
      { tempC: -5, modelClass: "plate" },
      { tempC: -10, modelClass: "neutral" },
      { tempC: -15, modelClass: "column" },
    ]);
    expect(flips).toHaveLength(1);
    expect(flips[0]).toMatchObject({ warmerC: -5, colderC: -15, from: "plate", to: "column" });
    expect(flips[0]?.widthC).toBe(10); // the neutral point widened it, as it should

    // Adjacent pure classes give a tight bracket.
    const tight = phase6DetectFlips([
      { tempC: -9, modelClass: "plate" },
      { tempC: -10, modelClass: "column" },
    ]);
    expect(tight[0]?.widthC).toBe(1);

    // Order of the input must not matter — the scan is defined warm to cold.
    expect(
      phase6DetectFlips([
        { tempC: -15, modelClass: "column" },
        { tempC: -5, modelClass: "plate" },
      ]),
    ).toEqual(tight.length ? flips.slice(0, 1) : flips.slice(0, 1));

    // No pure class change means no flip, however many neutrals are present.
    expect(
      phase6DetectFlips([
        { tempC: -5, modelClass: "plate" },
        { tempC: -15, modelClass: "neutral" },
        { tempC: -25, modelClass: "plate" },
      ]),
    ).toHaveLength(0);
  });
});

describe("the registered sweep grid", () => {
  it("is 34 temperatures by 6 fractions, with its evidence budget known in advance", () => {
    const grid = phase6SweepGrid();
    expect(grid.length).toBe(204);
    expect(grid.filter((p) => !p.inAmbiguityBand).length).toBe(168);
    expect(grid.filter((p) => p.inAmbiguityBand).length).toBe(36);
    // Every point carries its own distance to the nearest boundary, so the band decision is
    // attached to the point rather than recomputed later against a possibly-different rule.
    for (const point of grid) {
      expect(point.sigmaInf).toBeGreaterThan(0);
      expect(point.inAmbiguityBand).toBe(
        point.distanceToBoundaryC <= PHASE6_AMBIGUITY_HALF_WIDTH_C,
      );
    }
  });

  it("keeps every point out of the dead-facet regime", () => {
    // The low end of the sigma axis is bounded by physics, not preference: if both facet
    // coefficients collapse toward zero, habit is set by rough-site geometry rather than by the
    // CAK crossing under test, and the sweep would be measuring the wrong mechanism. Rough
    // sites are 1.0 by definition, so this asserts the facets are not effectively frozen.
    for (const point of phase6SweepGrid()) {
      const smaller = Math.min(
        alphaHK("basal", point.tempC, point.sigmaInf, "CAK_A1"),
        alphaHK("prism", point.tempC, point.sigmaInf, "CAK_A1"),
      );
      expect(smaller, `T=${point.tempC} f=${point.fraction}`).toBeGreaterThan(1e-2);
    }
  });

  it("spans a real contrast range, or the sigma axis would carry no information", () => {
    // If the basal/prism ratio were flat across the whole grid there would be nothing for the
    // sigma axis to resolve. This pins that the registered fractions actually span the
    // mechanism: strong contrast at the bottom, compressed at the top.
    const ratioAt = (tempC: number, fraction: number): number => {
      const sigma = phase6SigmaInf(tempC, fraction);
      return alphaHK("basal", tempC, sigma, "CAK_A1") / alphaHK("prism", tempC, sigma, "CAK_A1");
    };
    expect(ratioAt(-35, 0.1)).toBeGreaterThan(5); // strongly column-forming
    expect(ratioAt(-35, 0.9)).toBeLessThan(1.5); // compressed toward 1
    expect(ratioAt(-2, 0.1)).toBeLessThan(0.5); // strongly plate-forming
  });

  it("refuses a fraction that is not on the registered axis", () => {
    // A sweep point at an unregistered supersaturation would be outside the frozen protocol.
    expect(() => phase6SigmaInf(-15, 0.3)).toThrow(/not a registered sigma fraction/);
    expect(() => phase6SigmaInf(-15, 0.15)).not.toThrow();
  });

  it("registers Delta-x on cost, and says out loud that it is not converged", () => {
    const dx = PHASE6_FREEZE_LIST.find((item) => item.id === "dx");
    expect(dx?.status).toBe("registered");
    expect(dx?.value).toBe("0.35 µm");
    // The rule must be a COST rule, and must record that it was applied before any habit
    // result existed at the finer spacing — otherwise the choice is unfalsifiably tunable.
    expect(dx?.source).toContain("COST rule");
    expect(dx?.source).toContain("BEFORE any habit result");
    // And it must not be mistaken for a converged value.
    expect(dx?.source).toContain("NOT a converged value");
  });
});

describe("the near-boundary ambiguity band", () => {
  it("is registered as a number now that the T grid is frozen, and matches the formula", () => {
    const byId = new Map(PHASE6_FREEZE_LIST.map((item) => [item.id, item]));
    const band = byId.get("boundary-ambiguity-band");
    expect(band?.status).toBe("registered");
    expect(band?.group).toBe("comparison-design");
    // The registered number must BE the pre-registered formula's output at the frozen spacing,
    // not a value that merely resembles it. This is the whole guarantee: the band was fixed by
    // a rule written down before the grid, so it could not be chosen to suit any result.
    expect(PHASE6_AMBIGUITY_HALF_WIDTH_C).toBe(phase6AmbiguityHalfWidthC(PHASE6_T_GRID.spacingC));
    expect(band?.value).toContain("1.0 °C");
    expect(band?.value).toContain("28");
    // And it must record that it suppresses agreement too, not only disagreement.
    expect(band?.source).toContain("BOTH ways");
  });

  it("adds WP1's measured reference uncertainty to half the T-grid spacing", () => {
    expect(PHASE6_REFERENCE_BOUNDARY_UNCERTAINTY_C).toBe(0.5);
    expect(phase6AmbiguityHalfWidthC(1)).toBeCloseTo(1.0, 12);
    expect(phase6AmbiguityHalfWidthC(2)).toBeCloseTo(1.5, 12);
    expect(phase6AmbiguityHalfWidthC(0.5)).toBeCloseTo(0.75, 12);
    // A finer grid can never shrink the band below what the REFERENCE itself cannot resolve.
    expect(phase6AmbiguityHalfWidthC(1e-6)).toBeGreaterThan(
      PHASE6_REFERENCE_BOUNDARY_UNCERTAINTY_C,
    );
  });

  it("refuses a nonsensical grid spacing rather than returning a plausible band", () => {
    for (const bad of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(() => phase6AmbiguityHalfWidthC(bad)).toThrow(/positive T-grid spacing/);
    }
  });
});

describe("the registered interpolation scheme", () => {
  it("is exact at every digitized anchor", () => {
    // Piecewise interpolation reproduces its anchors by construction; if this ever fails, the
    // anchor set in the protocol no longer matches the anchor set in the solver.
    for (const x of PHASE6_SIGMA0_ANCHORS_X) {
      expect(Number.isFinite(sigma0Basal(-x))).toBe(true);
      expect(Number.isFinite(sigma0Prism(-x))).toBe(true);
    }
    // Anchors are strictly increasing in (Tm − T) on both facets.
    for (let i = 1; i < PHASE6_SIGMA0_ANCHORS_X.length; i++) {
      const previous = PHASE6_SIGMA0_ANCHORS_X[i - 1] as number;
      const current = PHASE6_SIGMA0_ANCHORS_X[i] as number;
      expect(sigma0Basal(-current)).toBeGreaterThan(sigma0Basal(-previous));
      expect(sigma0Prism(-current)).toBeGreaterThan(sigma0Prism(-previous));
    }
  });

  it("is log-log linear between anchors, which is what the protocol registers", () => {
    // Sample the geometric midpoint of each interval and compare against the log-log linear
    // prediction. Exact agreement pins the scheme itself, not merely its endpoints.
    for (let i = 0; i < PHASE6_SIGMA0_ANCHORS_X.length - 1; i++) {
      const left = PHASE6_SIGMA0_ANCHORS_X[i] as number;
      const right = PHASE6_SIGMA0_ANCHORS_X[i + 1] as number;
      const middle = Math.sqrt(left * right);
      for (const at of [sigma0Basal, sigma0Prism]) {
        const predicted = Math.sqrt(at(-left) * at(-right));
        expect(at(-middle)).toBeCloseTo(predicted, 12);
      }
    }
    expect(PHASE6_INTERPOLATION.sigma0).toBe("piecewise-log-log-linear");
  });

  it("bans extrapolation at both ends of the digitized domain", () => {
    const { warmest, coldest } = PHASE6_INTERPOLATION.domainTempC;
    expect(warmest).toBe(-1);
    expect(coldest).toBe(-50);
    // Inside the domain: fine. Outside: refuses, rather than inventing physics.
    expect(() => sigma0Basal(warmest)).not.toThrow();
    expect(() => sigma0Basal(coldest)).not.toThrow();
    expect(() => sigma0Basal(-0.9)).toThrow(/outside the digitized domain/);
    expect(() => sigma0Prism(-50.1)).toThrow(/outside the digitized domain/);
    // This is a real constraint on the frozen T grid: the Nakaya diagram runs to 0 °C, and the
    // warmest temperature Phase 6 may sweep is −1 °C.
  });

  it("keeps A on its own registered scheme", () => {
    expect(PHASE6_INTERPOLATION.aBasal).toBe("constant-1");
    expect(nucleationABasal(-5, "CAK")).toBe(1);
    expect(nucleationABasal(-15, "CAK")).toBe(1);
    // A_prism is linear in (Tm − T), not log-log: it touches 1 and dips, so a log scheme is
    // wrong for it. Midpoint of [5, 10] must be the arithmetic mean of the endpoints.
    const predicted = (nucleationAPrism(-5, "CAK") + nucleationAPrism(-10, "CAK")) / 2;
    expect(nucleationAPrism(-7.5, "CAK")).toBeCloseTo(predicted, 12);
    // CAK_A1 is the flat-A set by definition.
    expect(nucleationAPrism(-5, "CAK_A1")).toBe(1);
  });

  it("registers an interpolation error the solver still reproduces", () => {
    // The justification for the scheme is measured, not asserted: leave-one-out error is
    // subdominant to the ±25% digitization band already carried on the anchors. Recomputing it
    // here from the live solver stops the registered number from drifting away from the code.
    const measured = phase6MeasureInterpolationError();
    expect(measured.basal).toBeCloseTo(PHASE6_INTERPOLATION_LEAVE_ONE_OUT.basal, 3);
    expect(measured.prism).toBeCloseTo(PHASE6_INTERPOLATION_LEAVE_ONE_OUT.prism, 3);
    expect(measured.basal).toBeLessThan(PHASE6_SIGMA0_DIGITIZATION_BAND);
    expect(measured.prism).toBeLessThan(PHASE6_SIGMA0_DIGITIZATION_BAND);
  });
});

describe("the water-saturation ladder reference", () => {
  it("uses printed Table 2.1 anchors, which an independent standard confirms", () => {
    // Murphy & Koop (2005) — not used by the solver, here only to referee the printed anchors.
    const mkIce = (T: number) =>
      Math.exp(9.550426 - 5723.265 / T + 3.53068 * Math.log(T) - 0.00728332 * T);
    const mkLiquid = (T: number) =>
      Math.exp(
        54.842763 - 6763.22 / T - 4.21 * Math.log(T) + 0.000367 * T +
          Math.tanh(0.0415 * (T - 218.8)) *
            (53.878 - 1331.22 / T - 9.44523 * Math.log(T) + 0.014025 * T),
      );
    // Measured worst deviation is 1.78%, at the -1 C anchor; every anchor from -5 C to -40 C
    // agrees to within 0.5%. The two bounds are asserted separately so a regression at the warm
    // end cannot hide inside a single loose tolerance.
    for (const { tempC, sigmaWater } of PHASE6_SIGMA_WATER_ANCHORS) {
      if (tempC === 0) continue; // the anchor is exactly 0 by definition
      const kelvin = tempC + 273.15;
      const reference = (mkLiquid(kelvin) - mkIce(kelvin)) / mkIce(kelvin);
      const deviation = Math.abs(sigmaWater / reference - 1);
      expect(deviation).toBeLessThan(0.02);
      if (tempC <= -5) expect(deviation).toBeLessThan(0.005);
    }
  });

  it("is not the sigmaWater() difference form, which is unusable across the whole range", () => {
    // Two independent reasons the ladder does not call sigmaWater(), pinned so nobody
    // 'simplifies' the ladder back onto it.

    // 1. It goes negative, where water saturation over ice is strictly positive below 0 C. The
    //    crossing is at -1.969 C — NOT "about -3 C", as this file and phase6-protocol.ts both
    //    used to claim; it is positive at both -3 C and -2 C.
    expect(sigmaWater(-1)).toBeLessThan(0);
    expect(sigmaWater(-2)).toBeGreaterThan(0);
    expect(sigmaWater(-3)).toBeGreaterThan(0);
    let lo = -5;
    let hi = -0.001;
    for (let i = 0; i < 200; i++) {
      const mid = (lo + hi) / 2;
      if (sigmaWater(mid) > 0) lo = mid;
      else hi = mid;
    }
    expect(lo).toBeCloseTo(-1.969, 3);

    // 2. The disqualifying one: its error against the anchors is not an offset but a strong
    //    function of temperature, so a ladder built on it would make a fixed water-relative
    //    fraction mean wildly different physical fractions at different temperatures — the
    //    sweep's temperature axis would be confounded with a systematic spanning ~65x.
    const ratio = (T: number) => sigmaWater(T) / phase6SigmaWaterFromTable(T);
    expect(ratio(-2)).toBeLessThan(0.02);
    expect(ratio(-30)).toBeGreaterThan(0.95);
    expect(ratio(-30) / ratio(-2)).toBeGreaterThan(60);

    expect(phase6SigmaWaterFromTable(-1)).toBeGreaterThan(0);
    expect(phase6SigmaWaterFromTable(-1)).toBeCloseTo(0.01, 6);
  });

  it("interpolates between anchors and refuses to extrapolate", () => {
    // Exact at anchors.
    expect(phase6SigmaWaterFromTable(-15)).toBeCloseTo(0.157, 9);
    expect(phase6SigmaWaterFromTable(-2)).toBeCloseTo(0.02, 9);
    // Linear between them.
    expect(phase6SigmaWaterFromTable(-25)).toBeCloseTo((0.215 + 0.34) / 2, 9);
    // Monotone increasing as it gets colder.
    let previous = 0;
    for (let T = -1; T >= -40; T--) {
      const value = phase6SigmaWaterFromTable(T);
      expect(value).toBeGreaterThan(previous);
      previous = value;
    }
    expect(() => phase6SigmaWaterFromTable(0.5)).toThrow(/extrapolation is banned/);
    expect(() => phase6SigmaWaterFromTable(-40.5)).toThrow(/extrapolation is banned/);
  });
});

describe("the engine decision", () => {
  it("runs sweeps on the float64 oracle and demotes the GPU to a labelled diagnostic", () => {
    // Revised on measurement: the GPU is 6x slower at 28^3 and cannot satisfy the frozen
    // divTol in sustained runs at all. It keeps a cross-check role at a relaxed,
    // separately-labelled tolerance, which is why it can never be a gate criterion.
    //
    // divTol is RELATIVE on both engines (|injection + drift - exchange| / |exchange|), and the
    // registered justification must say so: the earlier text called it absolute, which made the
    // float32 argument sound like a coincidence of scale rather than what it is. 1e-7 is below
    // one float32 epsilon, so no float32 implementation can ever satisfy it.
    expect(Math.fround(1.19e-7)).toBeGreaterThan(1e-7); // the frozen tolerance < 1 f32 epsilon
    expect(PHASE6_ENGINE_CONTROL.sweepEngine).toBe("cpu-float64");
    expect(PHASE6_ENGINE_CONTROL.diagnosticEngine).toContain("relaxed");
    expect(PHASE6_ENGINE_CONTROL.comparedQuantity).toContain("habit-classification");
    // Control points are chosen with the grid, so this stays null until the grid is registered.
    expect(PHASE6_ENGINE_CONTROL.controlPoints).toBeNull();
    const floatItem = PHASE6_FREEZE_LIST.find((item) => item.id === "float-precision");
    expect(floatItem?.status).toBe("registered");
    expect(floatItem?.value).toContain("float64 CPU oracle");
    expect(floatItem?.value).toContain("never a gate criterion");
    // The source must carry WHY it was revised, so the retraction cannot quietly become a
    // preference: the measured numbers and the tolerance floor both belong in the record.
    expect(floatItem?.source).toContain("32.9 s");
    expect(floatItem?.source).toContain("below ONE float32 epsilon");
    expect(floatItem?.source).toContain("RELATIVE");
  });

  it("registers a cross-platform reproducibility control", () => {
    // Math.exp/log/pow are not specified to be correctly rounded and this solver depends on
    // them, so a habit class that differs between arm64 and x64 is a fragility finding.
    expect(PHASE6_ENGINE_CONTROL.reproducibilityControl).toContain("arm64");
    expect(PHASE6_ENGINE_CONTROL.reproducibilityControl).toContain("habit class");
  });
});

describe("the latent-heating decision", () => {
  it("is carried as a stated systematic rather than applied", () => {
    expect(PHASE6_LATENT_HEATING.treatment).toBe("stated-systematic");
    expect(PHASE6_LATENT_HEATING.applied).toBe(false);
    // Both printed anchors, and nothing invented between or beyond them.
    expect(PHASE6_LATENT_HEATING.anchors).toEqual([
      { tempC: -1, chi0: 0.8 },
      { tempC: -10, chi0: 0.4 },
    ]);
    expect(PHASE6_LATENT_HEATING.correctionIfApplied).toContain("1 + chi_0");
  });
});
