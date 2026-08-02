// Phase 6 arm 2's freeze, checked. ADR 0030 item 5, ADR 0036.
//
// The single most important property here is NEGATIVE: arm 1 must be bit-unchanged. Its 204 rows
// and its headline of 3/90 are published evidence naming a protocol hash, and a second arm that
// perturbed the first would invalidate work that cost 89 core-hours. Every test in the first block
// exists to make that checkable rather than hoped for.

import { describe, expect, it } from "vitest";
import { canonicalJsonSha256 } from "../src/gate4-evidence.ts";
import { sigma0BasalM1, sigma0PrismM1 } from "@vcc/core";
import { phase6RenderDiagram } from "../src/phase6-diagram.ts";
import {
  PHASE6_ARM1,
  PHASE6_ARM2,
  PHASE6_ARM_VALUES_SHA256,
  phase6CommandFlagFailures,
  phase6PointCommand,
  phase6Aggregate,
  phase6ScorePoint,
  phase6SweepPreflight,
} from "../src/phase6-sweep.ts";
import {
  PHASE6_ARM2_ADDED_ROWS,
  PHASE6_ARM2_BISTABLE_TEMPERATURES_C,
  PHASE6_ARM2_ID,
  PHASE6_ARM2_JUSTIFICATION_SHA256,
  PHASE6_ARM2_JUSTIFICATION_REVISIONS,
  PHASE6_ARM2_PARAM_SET,
  PHASE6_ARM2_ROW_OVERRIDES,
  PHASE6_ARM2_FREEZE_COMMIT,
  PHASE6_ARM2_PROTOCOL_SHA256,
  PHASE6_ARM2_PROTOCOL_REVISIONS,
  PHASE6_ARM2_SDAK_ANCHORS,
  PHASE6_ARM2_SOURCE_INFERRED_REFERENCES,
  PHASE6_ARM2_SOURCE_REFERENCE_TIERS,
  PHASE6_ARM2_VALUES_SHA256,
  PHASE6_ARM2_VALUES_REVISIONS,
  phase6Arm2FreezeList,
  phase6Arm2InHeadlineScope,
  phase6Arm2IsBistable,
  phase6Arm2JustificationManifest,
  phase6Arm2ProtocolManifest,
  phase6Arm2ScoreHabit,
  phase6Arm2SourceReferenceTier,
  phase6Arm2SourcingTier,
  phase6Arm2ValuesManifest,
} from "../src/phase6-arm2-protocol.ts";
import {
  PHASE6_FREEZE_LIST,
  PHASE6_JUSTIFICATION_SHA256,
  PHASE6_PARAM_SET,
  PHASE6_PROTOCOL_SHA256,
  PHASE6_VALUES_SHA256,
  phase6IsInAmbiguityBand,
  phase6JustificationManifest,
  phase6ProtocolManifest,
  phase6ReferenceRegime,
  phase6ScoreHabit,
  phase6SweepGrid,
  phase6ValuesManifest,
  type Phase6GridPoint,
} from "../src/phase6-protocol.ts";

const TEMPERATURES = [...new Set(phase6SweepGrid().map((p) => p.tempC))].sort((a, b) => b - a);

describe("arm 1 is untouched by arm 2 existing", () => {
  it("keeps all three of arm 1's registered hashes", () => {
    // If any of these move, published evidence stops verifying against the commit it names.
    expect(canonicalJsonSha256(phase6ValuesManifest())).toBe(PHASE6_VALUES_SHA256);
    expect(canonicalJsonSha256(phase6JustificationManifest())).toBe(PHASE6_JUSTIFICATION_SHA256);
    expect(canonicalJsonSha256(phase6ProtocolManifest())).toBe(PHASE6_PROTOCOL_SHA256);
  });

  it("keeps arm 1's param set and its scoring rule", () => {
    expect(PHASE6_PARAM_SET).toBe("CAK");
    expect(PHASE6_ARM2_PARAM_SET).not.toBe(PHASE6_PARAM_SET);
    // Arm 1 scores the bistable band exactly as it always did — single-valued, {column} only.
    for (const tempC of PHASE6_ARM2_BISTABLE_TEMPERATURES_C) {
      expect(phase6ScoreHabit(tempC, "plate")).toBe("disagree");
      expect(phase6ScoreHabit(tempC, "column")).toBe("agree");
    }
  });

  it("pins the historical parameter-table binding only where the producer serialized it", () => {
    const arm1 = phase6ValuesManifest();
    const arm2 = phase6Arm2ValuesManifest();
    expect(Object.hasOwn(arm1, "parameterTableSha256")).toBe(true);
    expect(Object.hasOwn(arm2, "parameterTableSha256")).toBe(false);

    // Guard both claims non-vacuously: changing arm 1's serialized digest or retrofitting a
    // previously absent arm-2 field changes that manifest's identity.
    expect(canonicalJsonSha256({ ...arm1, parameterTableSha256: "0".repeat(64) }))
      .not.toBe(PHASE6_VALUES_SHA256);
    expect(canonicalJsonSha256({ ...arm2, parameterTableSha256: "0".repeat(64) }))
      .not.toBe(PHASE6_ARM2_VALUES_SHA256);
  });
});

describe("the arms differ in exactly the declared rows", () => {
  it("shares every non-overridden row BY REFERENCE, not by copy", () => {
    // The structural guarantee. `toBe` is object identity: a shared row cannot have been edited
    // for arm 2 without this failing, so "the arms differ in exactly these rows" is checked rather
    // than argued. A copied-then-tweaked row would pass a deep-equality check and fail this one.
    const arm2 = phase6Arm2FreezeList();
    for (const arm1Row of PHASE6_FREEZE_LIST) {
      const row = arm2.find((r) => r.id === arm1Row.id);
      expect(row, `${arm1Row.id} is missing from arm 2`).toBeDefined();
      if (arm1Row.id in PHASE6_ARM2_ROW_OVERRIDES) {
        expect(row).not.toBe(arm1Row);
        expect(row?.prose).toBe(PHASE6_ARM2_ROW_OVERRIDES[arm1Row.id]);
        // Only the prose differs — id, group and status are carried over untouched.
        expect(row?.id).toBe(arm1Row.id);
        expect(row?.group).toBe(arm1Row.group);
        expect(row?.status).toBe(arm1Row.status);
      } else {
        expect(row, `${arm1Row.id} was copied instead of shared`).toBe(arm1Row);
      }
    }
  });

  it("overrides exactly three rows, and each names why the arm-1 text would be FALSE", () => {
    expect(Object.keys(PHASE6_ARM2_ROW_OVERRIDES).sort()).toEqual([
      "param-set",
      "parameter-interpolation",
      "parameter-table",
    ]);
    // Every override must actually name arm 2's inputs, or it is decoration.
    expect(PHASE6_ARM2_ROW_OVERRIDES["param-set"]?.value).toContain("M1");
    expect(PHASE6_ARM2_ROW_OVERRIDES["parameter-interpolation"]?.value).toContain("no interpolation");
    expect(PHASE6_ARM2_ROW_OVERRIDES["parameter-table"]?.value).toContain("2306.13087v1");
  });

  it("adds exactly the three rows ADR 0036 pre-registers, all already registered", () => {
    expect(PHASE6_ARM2_ADDED_ROWS.map((r) => r.id)).toEqual([
      "bistable-band",
      "input-sourcing-tiers",
      "registered-expectation",
    ]);
    for (const row of PHASE6_ARM2_ADDED_ROWS) {
      expect(row.status, `${row.id} must be registered before the sweep`).toBe("registered");
      expect(row.prose.value ?? "", `${row.id} has no registered value`).not.toBe("");
      expect((row.prose.value ?? "").length).toBeGreaterThan(20);
      expect(row.prose.source.length).toBeGreaterThan(60);
    }
  });

  it("labels every live field of the withdrawn 42/90 proxy forecast", () => {
    const expectation = PHASE6_ARM2_ADDED_ROWS.find((row) => row.id === "registered-expectation");
    expect(expectation).toBeDefined();
    for (const field of [
      expectation?.prose.requirement,
      expectation?.prose.value,
      expectation?.prose.source,
    ]) {
      expect(field).toContain("historical");
      expect(field).toMatch(/forecast|proxy/);
    }
    expect(expectation?.prose.requirement).toContain("inadmissible as habit evidence");
    expect(expectation?.prose.value).toContain("not a valid pre-run habit prediction");

    const bistable = PHASE6_ARM2_ADDED_ROWS.find((row) => row.id === "bistable-band");
    expect(bistable?.prose.source).toContain("withdrawn/confounded historical proxy forecast");
    expect(bistable?.prose.source).toContain("inadmissible as habit evidence");
  });

  it("registers no pending row — a sweep cannot quote a freeze it has not earned", () => {
    expect(phase6Arm2FreezeList().filter((r) => r.status === "pending")).toEqual([]);
    expect(phase6Arm2FreezeList().length).toBe(PHASE6_FREEZE_LIST.length + PHASE6_ARM2_ADDED_ROWS.length);
  });

  it("shares the GRID with arm 1 — the property that makes the comparison controlled", () => {
    const v = phase6Arm2ValuesManifest() as Record<string, unknown>;
    const a1 = phase6ValuesManifest() as Record<string, unknown>;
    for (const key of [
      "temperatureGrid", "sigmaFractions", "sigmaWaterAnchors", "nakayaBoundariesC",
      "ambiguityHalfWidthC", "referenceRegimes", "headlineScopeC", "extentDriftBoundAR",
      "surfacePolicy", "farField", "latentHeating", "domainSpotCheck", "engineControl",
    ]) {
      expect(canonicalJsonSha256(v[key]), `${key} differs between arms`).toBe(canonicalJsonSha256(a1[key]));
    }
  });
});

describe("arm 2's scoring (ADR 0036 pre-registration 2)", () => {
  it("accepts BOTH pure classes in the bistable band, and only there", () => {
    for (const tempC of TEMPERATURES) {
      const bistable = phase6Arm2IsBistable(tempC);
      expect(bistable).toBe(([-4, -5, -6] as number[]).includes(tempC));
      if (bistable) {
        expect(phase6Arm2ScoreHabit(tempC, "plate")).toBe("agree");
        expect(phase6Arm2ScoreHabit(tempC, "column")).toBe("agree");
      } else {
        // Outside the band arm 2 scores identically to arm 1 — the change is local by construction.
        for (const cls of ["plate", "column", "neutral"] as const) {
          expect(phase6Arm2ScoreHabit(tempC, cls), `${tempC} C ${cls}`).toBe(phase6ScoreHabit(tempC, cls));
        }
      }
    }
  });

  it("still scores neutral as DISAGREE in the bistable band — the rule is not an amnesty", () => {
    // Accepting both classes would be unfalsifiable if neutral also passed: nothing could fail.
    for (const tempC of PHASE6_ARM2_BISTABLE_TEMPERATURES_C) {
      expect(phase6Arm2ScoreHabit(tempC, "neutral")).toBe("disagree");
      expect(phase6Arm2ScoreHabit(tempC, "invalid")).toBe("excluded");
    }
  });

  it("removes exactly 12 points from the headline, and they are -5 and -6 only", () => {
    // -4 C is already inside the ambiguity band, so the MARGINAL cost is two temperatures.
    const arm1Headline = phase6SweepGrid().filter((p) => {
      if (phase6IsInAmbiguityBand(p.tempC)) return false;
      return ["plates-warm", "columns", "plates-cold"].includes(phase6ReferenceRegime(p.tempC));
    });
    const arm2Headline = phase6SweepGrid().filter((p) => phase6Arm2InHeadlineScope(p.tempC));
    expect(arm1Headline.length).toBe(90);
    expect(arm2Headline.length).toBe(78);
    const dropped = [...new Set(arm1Headline.filter((p) => !phase6Arm2InHeadlineScope(p.tempC)).map((p) => p.tempC))];
    expect(dropped.sort((a, b) => b - a)).toEqual([-5, -6]);
    expect(phase6IsInAmbiguityBand(-4)).toBe(true);
  });
});

describe("arm 2's sourcing tiers (ADR 0036 pre-registration 3)", () => {
  it("assigns every registered temperature exactly one current source-reference tier", () => {
    const counts: Record<string, number> = {};
    for (const tempC of TEMPERATURES) {
      const tier = phase6Arm2SourceReferenceTier(tempC);
      counts[tier] = (counts[tier] ?? 0) + 1;
    }
    // All are inside Figure 1's M1 domain; these labels only describe the numeric-reference bracket.
    expect(counts).toEqual({
      "outside-reference-bracket-warm": 3,
      "within-reference-bracket": 21,
      "outside-reference-bracket-cold": 10,
    });
  });

  it("covers the axis with no gap and no overlap", () => {
    const tiers = [...PHASE6_ARM2_SOURCE_REFERENCE_TIERS];
    expect(tiers[0]?.warmestC).toBe(-2);
    expect(tiers[tiers.length - 1]?.coldestC).toBe(-35);
    for (let i = 1; i < tiers.length; i++) {
      expect((tiers[i] as { warmestC: number }).warmestC).toBe((tiers[i - 1] as { coldestC: number }).coldestC - 1);
    }
  });

  it("names EXACTLY ONE headline temperature beyond the numeric-reference bracket, and it is -2 C", () => {
    // The warmest same-lineage numeric reference is -5 C, so -2 C -- a headline temperature, and
    // the whole of plates-warm's headline scope -- sits warmer than every numeric reference while
    // remaining inside the M1 source's displayed domain. The historical tier identifier is retained.
    const outsideBracket = TEMPERATURES.filter(
      (t) =>
        phase6Arm2InHeadlineScope(t) &&
        phase6Arm2SourceReferenceTier(t) !== "within-reference-bracket",
    );
    expect(outsideBracket).toEqual([-2]);
    // Nothing in the headline is colder than the reference bracket: the headline stops at -21.5
    // and that tier starts at -26.
    for (const t of TEMPERATURES.filter(phase6Arm2InHeadlineScope)) {
      expect(phase6Arm2SourceReferenceTier(t), `${t} C`).not.toBe(
        "outside-reference-bracket-cold",
      );
    }
  });
});

describe("arm 2's two-hash scheme", () => {
  it("retains every historical manifest hash while making the latest correction current", () => {
    expect(PHASE6_ARM2_VALUES_REVISIONS.map(({ sha256 }) => sha256)).toEqual([
      "13e678d5eec467a391958a18c71c8d170900d6efd0d5c23bb4362d863b9acd76",
    ]);
    expect(PHASE6_ARM2_JUSTIFICATION_REVISIONS.map(({ sha256 }) => sha256)).toEqual([
      "1b7faeb85fb9095931ef9294d65c619723ac389de24daddd8d9c173b833d00e8",
      "80e9c920b04c0a6e1f6985b2edb1e6cf33d336bb8bb89eb3fdf437a7dcfc24ba",
      "f184f5459c99de6cac552e5b74bdd199a03ca205d6aabca5c12e6a98ff6464b9",
      "3d3e91954c71258c861092fd07a06297cae8ce39ece1bef62a35e8f4e81481d4",
      "ad00d02c57d22b4902bbc823aadf34c47dda559f0ca1484f4850cb94216649c1",
      "49ec78de5e79611918c08b88c3d43556f8ebd6f0b80451e13439181e7fd1a8a4",
      "e8d8bd749e456246a504ff5093734a8c6ba15f865b2f5413f2a98abb0183e80d",
      "e8dcc4378d6913c0da8d98f2820858cadd9a17fa541e4108770476883e26911e",
      "709646e565b0795cad50349db72f42d882abfb84a6f927424f96ee2417441603",
      "e2f7f24c5fc71137c9d06bb2344685b260d8702426edf656f22dd6b42f58471f",
    ]);
    expect(PHASE6_ARM2_PROTOCOL_REVISIONS.map(({ sha256 }) => sha256)).toEqual([
      "b09a932ec7345eddf838ee2de1c0ef4731212c625a1069e62193c06ae950fdec",
      "785f7325f7042b17ed220a19cc404d4ad0a5023d3c64de412afab138835db6e1",
      "6e405882ff46c8fb883ee11753e1fc5ecfc9f046e16350590115d55469099e81",
      "7b4b4c14e5d419e781224cfda36c2ed6b293d8c062014ff23a2e1dffa1507719",
      "8c8db86582d1ced530b5cdbdaa0e924797c1aa14dc999d463f72e980db43ce14",
      "cb88ee3020891867a170c20f62a6ce2cd72c1a4c248caef1899c90579e8e1c9b",
      "09f49f229c472cd47c4a100fcd340f7fd472d716eb734c9c3244b3a19928146a",
      "fa8c61f182966ea3496763ba766a2911086299fb3ef07e576be2a4023f82d2a9",
      "21b16a7bf69b5015909fd381a6f7d2ab42ba5b8d343573c3e554bd4f1363261f",
      "4be5c82d8ddb64947f459f40f1d941eb0e95d7548a6f6dd18067c65eda53076b",
    ]);
    expect(PHASE6_ARM2_VALUES_REVISIONS.at(-1)?.sha256).toBe(
      canonicalJsonSha256(phase6Arm2ValuesManifest()),
    );
    expect(PHASE6_ARM2_VALUES_SHA256).toBe(PHASE6_ARM2_VALUES_REVISIONS.at(-1)?.sha256);
    expect(PHASE6_ARM2_JUSTIFICATION_REVISIONS.at(-1)?.sha256).toBe(
      canonicalJsonSha256(phase6Arm2JustificationManifest()),
    );
    expect(PHASE6_ARM2_JUSTIFICATION_SHA256).toBe(
      PHASE6_ARM2_JUSTIFICATION_REVISIONS.at(-1)?.sha256,
    );
    expect(PHASE6_ARM2_PROTOCOL_REVISIONS.at(-1)?.sha256).toBe(
      canonicalJsonSha256(phase6Arm2ProtocolManifest()),
    );
    expect(PHASE6_ARM2_JUSTIFICATION_REVISIONS.at(-1)?.sha256).not.toBe(
      PHASE6_ARM2_JUSTIFICATION_REVISIONS[0]?.sha256,
    );
    expect(PHASE6_ARM2_PROTOCOL_REVISIONS.at(-1)?.sha256).not.toBe(
      PHASE6_ARM2_PROTOCOL_REVISIONS[0]?.sha256,
    );
    for (const revisions of [
      PHASE6_ARM2_VALUES_REVISIONS,
      PHASE6_ARM2_JUSTIFICATION_REVISIONS,
      PHASE6_ARM2_PROTOCOL_REVISIONS,
    ]) {
      expect(new Set(revisions.map(({ sha256 }) => sha256)).size).toBe(revisions.length);
    }
  });

  it("separates values from justification, and prose lives only on the justification side", () => {
    // ADR 0033's structural claim, re-established for the new arm rather than inherited.
    const values = JSON.stringify(phase6Arm2ValuesManifest());
    for (const row of phase6Arm2FreezeList()) {
      // A row's prose must not appear in the values manifest at all. Long strings only: short
      // requirement words like "pressure" collide with ids, which is the residual risk ADR 0033
      // named and which produced two false positives on arm 1.
      for (const text of [row.prose.value ?? "", row.prose.source]) {
        if (text.length >= 30) expect(values, `${row.id} prose leaked into values`).not.toContain(text);
      }
    }
    expect(JSON.stringify(phase6Arm2JustificationManifest())).toContain(
      PHASE6_ARM2_ADDED_ROWS[0]?.prose.value as string,
    );
  });

  it("carries arm 2's identity so an artifact can never be read as the other arm's", () => {
    expect((phase6Arm2ValuesManifest() as { arm: string }).arm).toBe(PHASE6_ARM2_ID);
    expect((phase6Arm2JustificationManifest() as { arm: string }).arm).toBe(PHASE6_ARM2_ID);
    expect(PHASE6_ARM2_ID).not.toBe("arm1");
  });

  it("hashes DIFFERENTLY from arm 1 on both sides — otherwise the freeze is decorative", () => {
    expect(canonicalJsonSha256(phase6Arm2ValuesManifest())).not.toBe(PHASE6_VALUES_SHA256);
    expect(canonicalJsonSha256(phase6Arm2JustificationManifest())).not.toBe(PHASE6_JUSTIFICATION_SHA256);
  });

  it("moves the VALUES hash when a registered value changes, and not when prose changes", () => {
    const baseline = canonicalJsonSha256(phase6Arm2ValuesManifest());
    // A prose-only edit must NOT move it — that is what makes a justification correction free.
    const proseEdited = phase6Arm2FreezeList().map((r) =>
      r.id === "bistable-band" ? { ...r, prose: { ...r.prose, source: "edited" } } : r,
    );
    expect(canonicalJsonSha256(phase6Arm2ValuesManifest(proseEdited))).toBe(baseline);
    // A structural edit MUST move it.
    const statusEdited = phase6Arm2FreezeList().map((r) =>
      r.id === "bistable-band" ? { ...r, group: "physics-inputs" as const } : r,
    );
    expect(canonicalJsonSha256(phase6Arm2ValuesManifest(statusEdited))).not.toBe(baseline);
  });

  it("refuses to produce a manifest while any row is pending", () => {
    const pending = phase6Arm2FreezeList().map((r) =>
      r.id === "param-set" ? { ...r, status: "pending" as const } : r,
    );
    expect(() => phase6Arm2ValuesManifest(pending)).toThrow(/not frozen/);
  });
});

describe("the arm-2 harness actually runs arm 2", () => {
  it("emits --param-set M1, and arm 1 still emits CAK", () => {
    // The ADR 0031 defect was a param set that was registered and never passed. Checked per arm.
    const point = phase6SweepGrid()[0] as Phase6GridPoint;
    const arm2 = phase6PointCommand(point, PHASE6_ARM2);
    const arm1 = phase6PointCommand(point, PHASE6_ARM1);
    expect(arm2[arm2.indexOf("--param-set") + 1]).toBe("M1");
    expect(arm1[arm1.indexOf("--param-set") + 1]).toBe("CAK");
    // The commands are otherwise IDENTICAL — that is what makes the arms a controlled comparison.
    const strip = (c: readonly string[]): string[] => {
      const at = c.indexOf("--param-set");
      return [...c.slice(0, at), ...c.slice(at + 2)];
    };
    expect(strip(arm2)).toEqual(strip(arm1));
  });

  it("writes to a DIFFERENT directory, so neither arm can overwrite the other", () => {
    expect(PHASE6_ARM2.outDirName).not.toBe(PHASE6_ARM1.outDirName);
    expect(PHASE6_ARM1.outDirName).toBe("phase6-sweep");
  });

  it("gates on the arm's OWN values hash", () => {
    expect(PHASE6_ARM2.valuesSha256()).toBe(PHASE6_ARM2_VALUES_SHA256);
    expect(PHASE6_ARM1.valuesSha256()).toBe(PHASE6_VALUES_SHA256);
    expect(PHASE6_ARM_VALUES_SHA256[PHASE6_ARM2.id]).toBe(PHASE6_ARM2_VALUES_SHA256);
    expect(PHASE6_ARM_VALUES_SHA256[PHASE6_ARM1.id]).toBe(PHASE6_VALUES_SHA256);
  });

  it("CATCHES an arm-2 command carrying arm 1's parameter set", () => {
    // The cross-arm version of ADR 0031: a run that looks like arm 2 and is arm 1.
    const point = phase6SweepGrid()[0] as Phase6GridPoint;
    const wrong = [...phase6PointCommand(point, PHASE6_ARM1)];
    expect(phase6CommandFlagFailures(wrong, PHASE6_ARM2).some((f) => f.includes("CAK"))).toBe(true);
    expect(phase6CommandFlagFailures(wrong, PHASE6_ARM1)).toEqual([]);
  });

  it("scores a point under the arm it is given, and the arms disagree where they should", () => {
    // A plate at -5 C: arm 1 says disagree (columns accepts {column}); arm 2 says agree (bistable).
    const at5 = phase6SweepGrid().find((p) => p.tempC === -5) as Phase6GridPoint;
    const platey = {
      tempC: -5, fraction: at5.fraction, sigmaInf: at5.sigmaInf, steps: 200, attached: 900,
      aspectRatio: 0.3, largestExtent: 21, symmetryError: 0, deltaSymClean: true,
      allConverged: true, domainContact: false, config: null, seconds: 100,
    };
    expect(phase6ScorePoint(at5, platey, PHASE6_ARM1).score).toBe("disagree");
    expect(phase6ScorePoint(at5, platey, PHASE6_ARM2).score).toBe("agree");
    expect(phase6ScorePoint(at5, platey, PHASE6_ARM1).inHeadlineScope).toBe(true);
    expect(phase6ScorePoint(at5, platey, PHASE6_ARM2).inHeadlineScope).toBe(false);
    // And identical outside the band.
    const at15 = phase6SweepGrid().find((p) => p.tempC === -15) as Phase6GridPoint;
    const cold = { ...platey, tempC: -15, fraction: at15.fraction, sigmaInf: at15.sigmaInf };
    expect(phase6ScorePoint(at15, cold, PHASE6_ARM2).score).toBe(phase6ScorePoint(at15, cold, PHASE6_ARM1).score);
  });
});

describe("the arm-2 freeze review's six blockers, each with the defect it closes", () => {
  /** An all-plate model over the registered grid — the review's own probe. */
  const allPlate = (arm: typeof PHASE6_ARM1) =>
    phase6SweepGrid().map((pt) =>
      phase6ScorePoint(
        pt,
        {
          tempC: pt.tempC, fraction: pt.fraction, sigmaInf: pt.sigmaInf, steps: 100, attached: 900,
          aspectRatio: 0.3, largestExtent: 21, symmetryError: 0, deltaSymClean: true,
          allConverged: true, domainContact: false, config: null, seconds: 10,
        },
        arm,
      ),
    );

  it("BLOCKER 1 — perRegime is scoped by the ARM's headline rule, so the tallies sum to the headline", () => {
    // Before the fix, arm 2's `columns` row published 24 points and counted the twelve bistable
    // agreements the exclusion exists to remove — for a model that produced no columns at all —
    // while ADR 0036 registers that row as n = 12, predicted agree 0. The identity below is what
    // makes a per-regime table a breakdown of its headline rather than a different measurement.
    for (const arm of [PHASE6_ARM1, PHASE6_ARM2]) {
      const r = phase6Aggregate(allPlate(arm), "x", "y", arm);
      const headlineRows = r.perRegime.filter((t) => t.inHeadline);
      expect(headlineRows.reduce((n, t) => n + t.agree, 0), `${arm.id} agree`).toBe(r.headlineAgree);
      expect(
        headlineRows.reduce((n, t) => n + t.agree + t.disagree, 0),
        `${arm.id} total`,
      ).toBe(r.headlineTotal);
    }
    const arm2 = phase6Aggregate(allPlate(PHASE6_ARM2), "x", "y", PHASE6_ARM2);
    const columns = arm2.perRegime.find((t) => t.regime === "columns");
    expect(columns?.agree).toBe(0);
    expect((columns?.agree ?? 0) + (columns?.disagree ?? 0)).toBe(12);
  });

  it("BLOCKER 2 — the report names its own arm, param set and gated hash", () => {
    const r = phase6Aggregate(allPlate(PHASE6_ARM2), "x", "y", PHASE6_ARM2);
    expect(r.arm).toBe(PHASE6_ARM2.id);
    expect(r.paramSet).toBe("M1");
    expect(r.valuesSha256).toBe(PHASE6_ARM2_VALUES_SHA256);
    expect(r.justificationSha256).toBe(PHASE6_ARM2.justificationSha256());
    // And arm 1's report is still arm 1's — the field is not merely present, it discriminates.
    const a1 = phase6Aggregate(allPlate(PHASE6_ARM1), "x", "y", PHASE6_ARM1);
    expect(a1.arm).not.toBe(r.arm);
    expect(a1.valuesSha256).not.toBe(r.valuesSha256);
    expect(a1.justificationSha256).not.toBe(r.justificationSha256);
  });

  it("BLOCKER 2b — the diagram is titled by ARM, so a figure cannot escape mislabelled", () => {
    const svg2 = phase6RenderDiagram(allPlate(PHASE6_ARM2), "sub", PHASE6_ARM2.diagramLabel);
    const svg1 = phase6RenderDiagram(allPlate(PHASE6_ARM1), "sub", PHASE6_ARM1.diagramLabel);
    expect(svg2).toContain("SDAK (M1)");
    expect(svg2).not.toContain("no-SDAK habit");
    expect(svg1).toContain("no-SDAK (CAK)");
  });

  it("BLOCKER 3 — the arm-2 freeze commit is inside the GATED values manifest", () => {
    // A freeze commit added after the run is a freeze commit chosen after seeing results. Being in
    // the gated hash is what makes adding it later cost the run.
    expect(JSON.stringify(phase6Arm2ValuesManifest())).toContain(PHASE6_ARM2_FREEZE_COMMIT);
  });

  it("BLOCKER 4 — preserves legacy bytes while naming source-inferred references correctly", () => {
    expect(PHASE6_ARM2_SDAK_ANCHORS.map((a) => a.tempC)).toEqual([-5, -10, -14, -25]);
    expect(PHASE6_ARM2_SOURCE_INFERRED_REFERENCES.map((a) => a.tempC)).toEqual([-5, -10, -14, -25]);
    expect(PHASE6_ARM2_SOURCE_INFERRED_REFERENCES.map((a) => a.sourceInferredPercent)).toEqual(
      PHASE6_ARM2_SDAK_ANCHORS.map((a) => a.measuredPercent),
    );
    for (const a of PHASE6_ARM2_SOURCE_INFERRED_REFERENCES) {
      const m1 = (a.facet === "basal" ? sigma0BasalM1(a.tempC) : sigma0PrismM1(a.tempC)) * 100;
      const ratio = m1 / a.sourceInferredPercent;
      expect(ratio, `${a.tempC} C ${a.facet}`).toBeGreaterThan(0.6);
      expect(ratio, `${a.tempC} C ${a.facet}`).toBeLessThan(1.05);
    }
    // This is same-lineage model consistency, not independent measurement agreement.
    const basal = PHASE6_ARM2_SOURCE_INFERRED_REFERENCES.filter((a) => a.facet === "basal");
    const prism = PHASE6_ARM2_SOURCE_INFERRED_REFERENCES.filter((a) => a.facet === "prism");
    const err = (a: { tempC: number; facet: string; sourceInferredPercent: number }): number =>
      Math.abs(
        (a.facet === "basal" ? sigma0BasalM1(a.tempC) : sigma0PrismM1(a.tempC)) * 100 /
          a.sourceInferredPercent -
          1,
      );
    expect(Math.max(...basal.map(err))).toBeLessThan(0.05);
    expect(Math.max(...prism.map(err))).toBeGreaterThan(0.25);
    // Historical tier labels bracket the numeric reference values, not the M1 equation domain.
    expect(phase6Arm2SourcingTier(-2)).toBe("extrapolating-warm");
    expect(phase6Arm2SourcingTier(-5)).toBe("bracketed");
    expect(phase6Arm2SourcingTier(-25)).toBe("bracketed");
    expect(phase6Arm2SourcingTier(-26)).toBe("extrapolating-cold");
    // Current reporting must not reuse those misleading values-hashed identifiers.
    expect(phase6Arm2SourceReferenceTier(-2)).toBe("outside-reference-bracket-warm");
    expect(phase6Arm2SourceReferenceTier(-5)).toBe("within-reference-bracket");
    expect(phase6Arm2SourceReferenceTier(-25)).toBe("within-reference-bracket");
    expect(phase6Arm2SourceReferenceTier(-26)).toBe("outside-reference-bracket-cold");
  });

  it("BLOCKER 6 — the bistable band is reported with its own count", () => {
    const r = phase6Aggregate(allPlate(PHASE6_ARM2), "x", "y", PHASE6_ARM2);
    expect(r.bistable.temperaturesC).toEqual([-4, -5, -6]);
    expect(r.bistable.points).toBe(18);
    expect(r.bistable.agree).toBe(18); // all-plate model: both pure classes are accepted here
    // Arm 1 registers no bistable band, so its report says so rather than omitting the field.
    expect(phase6Aggregate(allPlate(PHASE6_ARM1), "x", "y", PHASE6_ARM1).bistable.points).toBe(0);
  });

  it("BLOCKER 7 — the common denominator is published alongside arm 2's own", () => {
    // ADR 0036 forecloses reporting arm 2's headline under a denominator arm 1 was not scored
    // against without also reporting the common one.
    const r = phase6Aggregate(allPlate(PHASE6_ARM2), "x", "y", PHASE6_ARM2);
    expect(r.headlineTotal).toBe(78);
    expect(r.headlineTotalCommonDenominator).toBe(90);
    // For arm 1 the two are the same measurement, so they must agree exactly.
    const a1 = phase6Aggregate(allPlate(PHASE6_ARM1), "x", "y", PHASE6_ARM1);
    expect(a1.headlineAgreeCommonDenominator).toBe(a1.headlineAgree);
    expect(a1.headlineTotalCommonDenominator).toBe(a1.headlineTotal);
  });
});

describe("BLOCKER 3, enforced — preflight refuses an arm with no freeze commit", () => {
  it("names the missing freeze commit rather than running without one", () => {
    // The whole cost of "registered before it ran" is that it can fail. Until the arm-2 freeze
    // commit is filled in, preflight must REFUSE arm 2 by name — and this test is what proves the
    // refusal is real rather than a comment.
    const report = phase6SweepPreflight(process.cwd(), PHASE6_ARM2);
    const registered = /^[0-9a-f]{40}$/.test(PHASE6_ARM2_FREEZE_COMMIT);
    const complains = report.failures.some((f) => f.includes("freeze commit"));
    expect(complains, registered
      ? `arm 2 has a freeze commit (${PHASE6_ARM2_FREEZE_COMMIT}); preflight must not complain about it`
      : "arm 2 has NO freeze commit; preflight must refuse").toBe(!registered);
  });

  it("arm 1's freeze commit is a real 40-hex commit and is checked", () => {
    expect(PHASE6_ARM1.freezeCommit).toMatch(/^[0-9a-f]{40}$/);
    expect(PHASE6_ARM1.freezeCommit).not.toBe(PHASE6_ARM2.freezeCommit);
  });
});

describe("arm 2's combined hash names arm 2's protocol", () => {
  it("differs from arm 1's, and matches its registered pin", () => {
    // Caught after the sweep was launched and stopped a minute in: the header printed arm 1's
    // combined hash for an arm-2 run, and arm 2's report.json would have carried it. A report that
    // says `arm: arm2-sdak-m1` beside a hash whose manifest registers paramSet "CAK" is exactly the
    // confusion the arm-identity fields exist to remove.
    expect(PHASE6_ARM2.protocolSha256()).toBe(PHASE6_ARM2_PROTOCOL_SHA256);
    expect(PHASE6_ARM2.protocolSha256()).not.toBe(PHASE6_ARM1.protocolSha256());
    expect(PHASE6_ARM1.protocolSha256()).toBe(PHASE6_PROTOCOL_SHA256);
  });

  it("carries arm 2's param set, so the hash describes what it names", () => {
    const m = phase6Arm2ProtocolManifest() as { paramSet: string; arm: string };
    expect(m.paramSet).toBe("M1");
    expect(m.arm).toBe(PHASE6_ARM2.id);
  });

  it("adding it moved NOTHING gated — the freeze survives", () => {
    expect(canonicalJsonSha256(phase6Arm2ValuesManifest())).toBe(PHASE6_ARM2_VALUES_SHA256);
    expect(canonicalJsonSha256(phase6ValuesManifest())).toBe(PHASE6_VALUES_SHA256);
    expect(PHASE6_ARM2_FREEZE_COMMIT).toMatch(/^[0-9a-f]{40}$/);
  });
});
