// Phase 6 arm 3's registration, checked. Decision 0045 item 4.
//
// The single most important property here is NEGATIVE, twice over: arm 1 AND arm 2 must be
// bit-unchanged. Both arms' 204-row artifacts are published evidence naming protocol hashes, and
// a third arm that perturbed either would invalidate work that cost 160+ core-hours. The first
// block exists to make that checkable rather than hoped for.
//
// The second most important property is the MATCHED PAIR: arm 3 is registered as identical to
// the executed arm-2 configuration in every registered respect except `paramSet`. Where arm 2's
// suite asserts difference-by-design against arm 1, this suite asserts sameness-by-identity
// against arm 2 — shared rows, shared scoring function objects, a command line that differs in
// exactly one flag value.

import { describe, expect, it } from "vitest";
import { canonicalJsonSha256 } from "../src/gate4-evidence.ts";
import {
  nucleationABasal,
  nucleationAPrism,
  sigma0BasalM2Broad,
  sigma0PrismM2Broad,
} from "@vcc/core";
import {
  PHASE6_ARM1,
  PHASE6_ARM2,
  PHASE6_ARM3,
  PHASE6_ARM_VALUES_SHA256,
  phase6CommandFlagFailures,
  phase6PointCommand,
  phase6SweepPreflight,
} from "../src/phase6-sweep.ts";
import {
  PHASE6_ARM3_ABLATION_IDENTITY,
  PHASE6_ARM3_ADDED_ROWS,
  PHASE6_ARM3_FREEZE_COMMIT,
  PHASE6_ARM3_ID,
  PHASE6_ARM3_JUSTIFICATION_REVISIONS,
  PHASE6_ARM3_JUSTIFICATION_SHA256,
  PHASE6_ARM3_PARAM_SET,
  PHASE6_ARM3_PROTOCOL_REVISIONS,
  PHASE6_ARM3_PROTOCOL_SHA256,
  PHASE6_ARM3_ROW_OVERRIDES,
  PHASE6_ARM3_VALUES_REVISIONS,
  PHASE6_ARM3_VALUES_SHA256,
  phase6Arm3FreezeList,
  phase6Arm3InHeadlineScope,
  phase6Arm3IsBistable,
  phase6Arm3JustificationManifest,
  phase6Arm3ProtocolManifest,
  phase6Arm3ScoreHabit,
  phase6Arm3ValuesManifest,
} from "../src/phase6-arm3-protocol.ts";
import {
  PHASE6_ARM2_FREEZE_COMMIT,
  PHASE6_ARM2_JUSTIFICATION_SHA256,
  PHASE6_ARM2_PROTOCOL_SHA256,
  PHASE6_ARM2_VALUES_SHA256,
  phase6Arm2InHeadlineScope,
  phase6Arm2IsBistable,
  phase6Arm2JustificationManifest,
  phase6Arm2ProtocolManifest,
  phase6Arm2ScoreHabit,
  phase6Arm2ValuesManifest,
} from "../src/phase6-arm2-protocol.ts";
import {
  PHASE6_FREEZE_LIST,
  PHASE6_JUSTIFICATION_SHA256,
  PHASE6_PROTOCOL_SHA256,
  PHASE6_VALUES_SHA256,
  phase6JustificationManifest,
  phase6ProtocolManifest,
  phase6SweepGrid,
  phase6ValuesManifest,
  type Phase6GridPoint,
} from "../src/phase6-protocol.ts";

/** The five arm-2 manifest keys the gated ablationIdentity block replaces, in arm 2's order. */
const ARM2_DIP_SPECIFIC_KEYS = [
  "bistableTemperaturesC",
  "sourcingTiers",
  "m1BasalDipCentreC",
  "m1PrismDipCentreC",
  "sdakAnchors",
];

describe("arms 1 and 2 are untouched by arm 3 existing", () => {
  it("keeps all three of arm 1's registered hashes and all three of arm 2's", () => {
    // If any of these move, published evidence stops verifying against the commit it names.
    expect(canonicalJsonSha256(phase6ValuesManifest())).toBe(PHASE6_VALUES_SHA256);
    expect(canonicalJsonSha256(phase6JustificationManifest())).toBe(PHASE6_JUSTIFICATION_SHA256);
    expect(canonicalJsonSha256(phase6ProtocolManifest())).toBe(PHASE6_PROTOCOL_SHA256);
    expect(canonicalJsonSha256(phase6Arm2ValuesManifest())).toBe(PHASE6_ARM2_VALUES_SHA256);
    expect(canonicalJsonSha256(phase6Arm2JustificationManifest())).toBe(
      PHASE6_ARM2_JUSTIFICATION_SHA256,
    );
    expect(canonicalJsonSha256(phase6Arm2ProtocolManifest())).toBe(PHASE6_ARM2_PROTOCOL_SHA256);
  });

  it("pins the historical parameter-table binding only where a producer serialized it", () => {
    const arm1 = phase6ValuesManifest();
    const arm3 = phase6Arm3ValuesManifest();
    expect(Object.hasOwn(arm1, "parameterTableSha256")).toBe(true);
    expect(Object.hasOwn(phase6Arm2ValuesManifest(), "parameterTableSha256")).toBe(false);
    expect(Object.hasOwn(arm3, "parameterTableSha256")).toBe(false);

    // Guard both claims non-vacuously: changing arm 1's serialized digest or retrofitting a
    // previously absent arm-3 field changes that manifest's identity.
    expect(canonicalJsonSha256({ ...arm1, parameterTableSha256: "0".repeat(64) }))
      .not.toBe(PHASE6_VALUES_SHA256);
    expect(canonicalJsonSha256({ ...arm3, parameterTableSha256: "0".repeat(64) }))
      .not.toBe(PHASE6_ARM3_VALUES_SHA256);
  });
});

describe("the arms differ in exactly the declared rows", () => {
  it("shares every non-overridden row with arm 1 BY REFERENCE, not by copy", () => {
    // `toBe` is object identity: a shared row cannot have been edited for arm 3 without this
    // failing, so "the arms differ in exactly these rows" is checked rather than argued.
    const arm3 = phase6Arm3FreezeList();
    for (const arm1Row of PHASE6_FREEZE_LIST) {
      const row = arm3.find((r) => r.id === arm1Row.id);
      expect(row, `${arm1Row.id} is missing from arm 3`).toBeDefined();
      if (arm1Row.id in PHASE6_ARM3_ROW_OVERRIDES) {
        expect(row).not.toBe(arm1Row);
        expect(row?.prose).toBe(PHASE6_ARM3_ROW_OVERRIDES[arm1Row.id]);
        // Only the prose differs — id, group and status are carried over untouched.
        expect(row?.id).toBe(arm1Row.id);
        expect(row?.group).toBe(arm1Row.group);
        expect(row?.status).toBe(arm1Row.status);
      } else {
        expect(row, `${arm1Row.id} was copied instead of shared`).toBe(arm1Row);
      }
    }
  });

  it("overrides exactly the three rows arm 2 also overrides, each naming arm 3's inputs", () => {
    expect(Object.keys(PHASE6_ARM3_ROW_OVERRIDES).sort()).toEqual([
      "param-set",
      "parameter-interpolation",
      "parameter-table",
    ]);
    // Every override must actually name arm 3's inputs, or it is decoration.
    expect(PHASE6_ARM3_ROW_OVERRIDES["param-set"]?.value).toContain("M1_NO_DIP_ABLATION");
    expect(PHASE6_ARM3_ROW_OVERRIDES["parameter-interpolation"]?.value).toContain("no interpolation");
    expect(PHASE6_ARM3_ROW_OVERRIDES["parameter-table"]?.value).toContain("2306.13087v1");
    // The load-bearing negative: no logarithm-base transcription choice survives the ablation.
    expect(PHASE6_ARM3_ROW_OVERRIDES["parameter-interpolation"]?.value).toContain(
      "dip factors are identically 1",
    );
  });

  it("adds exactly two rows — the adopted bistable band and the matched-pair identity", () => {
    expect(PHASE6_ARM3_ADDED_ROWS.map((r) => r.id)).toEqual([
      "bistable-band",
      "ablation-identity",
    ]);
    for (const row of PHASE6_ARM3_ADDED_ROWS) {
      expect(row.status, `${row.id} must be registered before the sweep`).toBe("registered");
      expect(row.prose.value ?? "", `${row.id} has no registered value`).not.toBe("");
      expect((row.prose.value ?? "").length).toBeGreaterThan(20);
      expect(row.prose.source.length).toBeGreaterThan(60);
    }
    // Arm 2's other two added rows are deliberately absent: the sourcing tiers bracket SDAK
    // numeric references this arm removes, and decision 0045 registers no arm-3 forecast.
    const ids = phase6Arm3FreezeList().map((r) => r.id);
    expect(ids).not.toContain("input-sourcing-tiers");
    expect(ids).not.toContain("registered-expectation");
  });

  it("registers no pending row — a sweep cannot quote a freeze it has not earned", () => {
    expect(phase6Arm3FreezeList().filter((r) => r.status === "pending")).toEqual([]);
    expect(phase6Arm3FreezeList().length).toBe(
      PHASE6_FREEZE_LIST.length + PHASE6_ARM3_ADDED_ROWS.length,
    );
  });

  it("shares the GRID with arm 1 — the property that makes the comparison controlled", () => {
    const v = phase6Arm3ValuesManifest() as Record<string, unknown>;
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

describe("arm 3 scores under arm 2's rules by OBJECT IDENTITY — the matched pair cannot drift", () => {
  it("reuses arm 2's scoring functions, not copies of them", () => {
    // Decision 0045 item 4 registers the configurations as identical except paramSet, and the
    // scoring rule is part of the configuration. Function identity is the checked version of
    // that: there is exactly one implementation, so the pair cannot be one mistaken edit apart.
    expect(phase6Arm3ScoreHabit).toBe(phase6Arm2ScoreHabit);
    expect(phase6Arm3InHeadlineScope).toBe(phase6Arm2InHeadlineScope);
    expect(phase6Arm3IsBistable).toBe(phase6Arm2IsBistable);
    expect(PHASE6_ARM3.scoreHabit).toBe(PHASE6_ARM2.scoreHabit);
    expect(PHASE6_ARM3.inHeadlineScope).toBe(PHASE6_ARM2.inHeadlineScope);
    expect(PHASE6_ARM3.isBistable).toBe(PHASE6_ARM2.isBistable);
    // And they are genuinely arm 2's rules, not arm 1's — the identity is discriminating.
    expect(PHASE6_ARM3.scoreHabit).not.toBe(PHASE6_ARM1.scoreHabit);
    expect(PHASE6_ARM3.inHeadlineScope).not.toBe(PHASE6_ARM1.inHeadlineScope);
    expect(PHASE6_ARM3.isBistable).not.toBe(PHASE6_ARM1.isBistable);
  });
});

describe("the ablationIdentity block — the ONE registered replacement for arm 2's five dip keys", () => {
  it("is carried in the gated manifest by reference, with the registered content", () => {
    const manifest = phase6Arm3ValuesManifest();
    expect(manifest["ablationIdentity"]).toBe(PHASE6_ARM3_ABLATION_IDENTITY);
    expect(PHASE6_ARM3_ABLATION_IDENTITY).toEqual({
      sigma0Basal: "sigma0BasalM2Broad",
      sigma0Prism: "sigma0PrismM2Broad",
      aBasal: 1,
      aPrism: 1,
      matchedPairClaim: PHASE6_ARM3_ABLATION_IDENTITY.matchedPairClaim,
    });
  });

  it("names REAL exports and the values the param set actually evaluates", () => {
    // The registered names bind to core's export names, so a rename there fails here instead of
    // leaving the manifest pointing at functions that no longer exist.
    expect(PHASE6_ARM3_ABLATION_IDENTITY.sigma0Basal).toBe(sigma0BasalM2Broad.name);
    expect(PHASE6_ARM3_ABLATION_IDENTITY.sigma0Prism).toBe(sigma0PrismM2Broad.name);
    for (const tempC of [-2, -10, -25, -35]) {
      expect(nucleationABasal(tempC, PHASE6_ARM3_PARAM_SET)).toBe(
        PHASE6_ARM3_ABLATION_IDENTITY.aBasal,
      );
      expect(nucleationAPrism(tempC, PHASE6_ARM3_PARAM_SET)).toBe(
        PHASE6_ARM3_ABLATION_IDENTITY.aPrism,
      );
    }
  });

  it("scopes the matched pair to an implementation-level contrast, in the GATED hash", () => {
    const claim = PHASE6_ARM3_ABLATION_IDENTITY.matchedPairClaim;
    expect(claim).toContain("the only implemented kinetic difference from M1");
    expect(claim).toContain("implementation-level contrast");
    expect(claim).toContain("never");
    expect(claim).toContain("physical SDAK causality");
    expect(claim).toContain("in nature");
  });

  it("replaces arm 2's five dip-specific keys and keeps every other key in arm 2's order", () => {
    const arm3 = phase6Arm3ValuesManifest();
    for (const key of ARM2_DIP_SPECIFIC_KEYS) {
      expect(Object.hasOwn(phase6Arm2ValuesManifest(), key), `${key} missing from arm 2`).toBe(true);
      expect(Object.hasOwn(arm3, key), `${key} must not appear in arm 3`).toBe(false);
    }
    // Derived, not hand-maintained: arm 2's key order with the contiguous five replaced by the
    // one block. A new arm-2 key or a reordering fails this test instead of drifting silently.
    const expected: string[] = [];
    let replaced = false;
    for (const key of Object.keys(phase6Arm2ValuesManifest())) {
      if (ARM2_DIP_SPECIFIC_KEYS.includes(key)) {
        if (!replaced) {
          expected.push("ablationIdentity");
          replaced = true;
        }
        continue;
      }
      expected.push(key);
    }
    expect(replaced).toBe(true);
    expect(Object.keys(arm3)).toEqual(expected);
    // Non-vacuous both ways: dropping the block or restoring a replaced key moves the hash.
    const { ablationIdentity: _dropped, ...withoutBlock } = arm3;
    expect(canonicalJsonSha256(withoutBlock)).not.toBe(PHASE6_ARM3_VALUES_SHA256);
    expect(canonicalJsonSha256({ ...arm3, sdakAnchors: [] })).not.toBe(PHASE6_ARM3_VALUES_SHA256);
  });
});

describe("arm 3's two-hash scheme", () => {
  it("pins the stage-1 hashes literally and keeps every revision list consistent", () => {
    // STAGE-1 PINS: computed with freezeCommit = "pending-stage-2-landing". The stage-2 landing
    // replaces the values and protocol literals (the freeze commit sits inside both manifests)
    // and leaves the justification literal alone.
    expect(PHASE6_ARM3_VALUES_SHA256).toBe(
      "399f264e2ccd71cbb622fe23000b098e63f106d5a99253ec9c43abc5e3069f3b",
    );
    expect(PHASE6_ARM3_JUSTIFICATION_SHA256).toBe(
      "7d01d251c98d7663b215daeb47bb39baec1f070e4c7edd7eac86f4f9d63803a2",
    );
    expect(PHASE6_ARM3_PROTOCOL_SHA256).toBe(
      "d9d02f32be20fc500aeffd74aaf05ecce85e2027cf0e90aa6e843fc87594ec90",
    );
    expect(PHASE6_ARM3_VALUES_REVISIONS.map(({ sha256 }) => sha256)).toEqual([
      PHASE6_ARM3_VALUES_SHA256,
    ]);
    expect(PHASE6_ARM3_JUSTIFICATION_REVISIONS.map(({ sha256 }) => sha256)).toEqual([
      PHASE6_ARM3_JUSTIFICATION_SHA256,
    ]);
    expect(PHASE6_ARM3_PROTOCOL_REVISIONS.map(({ sha256 }) => sha256)).toEqual([
      PHASE6_ARM3_PROTOCOL_SHA256,
    ]);
    // The tail of each list is the CURRENT computed manifest — the pin is live, not archival.
    expect(PHASE6_ARM3_VALUES_REVISIONS.at(-1)?.sha256).toBe(
      canonicalJsonSha256(phase6Arm3ValuesManifest()),
    );
    expect(PHASE6_ARM3_JUSTIFICATION_REVISIONS.at(-1)?.sha256).toBe(
      canonicalJsonSha256(phase6Arm3JustificationManifest()),
    );
    expect(PHASE6_ARM3_PROTOCOL_REVISIONS.at(-1)?.sha256).toBe(
      canonicalJsonSha256(phase6Arm3ProtocolManifest()),
    );
    for (const revisions of [
      PHASE6_ARM3_VALUES_REVISIONS,
      PHASE6_ARM3_JUSTIFICATION_REVISIONS,
      PHASE6_ARM3_PROTOCOL_REVISIONS,
    ]) {
      expect(new Set(revisions.map(({ sha256 }) => sha256)).size).toBe(revisions.length);
    }
  });

  it("hashes DIFFERENTLY from both prior arms on every side — otherwise the freeze is decorative", () => {
    expect(PHASE6_ARM3_VALUES_SHA256).not.toBe(PHASE6_VALUES_SHA256);
    expect(PHASE6_ARM3_VALUES_SHA256).not.toBe(PHASE6_ARM2_VALUES_SHA256);
    expect(PHASE6_ARM3_JUSTIFICATION_SHA256).not.toBe(PHASE6_JUSTIFICATION_SHA256);
    expect(PHASE6_ARM3_JUSTIFICATION_SHA256).not.toBe(PHASE6_ARM2_JUSTIFICATION_SHA256);
    expect(PHASE6_ARM3_PROTOCOL_SHA256).not.toBe(PHASE6_PROTOCOL_SHA256);
    expect(PHASE6_ARM3_PROTOCOL_SHA256).not.toBe(PHASE6_ARM2_PROTOCOL_SHA256);
  });

  it("moves the VALUES hash when a registered value changes, and not when prose changes", () => {
    const baseline = canonicalJsonSha256(phase6Arm3ValuesManifest());
    // A prose-only edit must NOT move it — that is what makes a justification correction free.
    const proseEdited = phase6Arm3FreezeList().map((r) =>
      r.id === "bistable-band" ? { ...r, prose: { ...r.prose, source: "edited" } } : r,
    );
    expect(canonicalJsonSha256(phase6Arm3ValuesManifest(proseEdited))).toBe(baseline);
    // A structural edit MUST move it.
    const statusEdited = phase6Arm3FreezeList().map((r) =>
      r.id === "bistable-band" ? { ...r, group: "physics-inputs" as const } : r,
    );
    expect(canonicalJsonSha256(phase6Arm3ValuesManifest(statusEdited))).not.toBe(baseline);
  });

  it("refuses to produce a manifest while any row is pending", () => {
    const pending = phase6Arm3FreezeList().map((r) =>
      r.id === "param-set" ? { ...r, status: "pending" as const } : r,
    );
    expect(() => phase6Arm3ValuesManifest(pending)).toThrow(/not frozen/);
  });

  it("carries arm 3's identity so an artifact can never be read as another arm's", () => {
    expect((phase6Arm3ValuesManifest() as { arm: string }).arm).toBe(PHASE6_ARM3_ID);
    expect((phase6Arm3JustificationManifest() as { arm: string }).arm).toBe(PHASE6_ARM3_ID);
    expect(PHASE6_ARM3_ID).not.toBe(PHASE6_ARM1.id);
    expect(PHASE6_ARM3_ID).not.toBe(PHASE6_ARM2.id);
  });

  it("keeps the freeze commit INSIDE the gated values manifest", () => {
    // A freeze commit added after the run is a freeze commit chosen after seeing results. Being
    // in the gated hash means the stage-2 landing visibly moves the pin, and nothing can slip a
    // commit in later without invalidating the run.
    expect(JSON.stringify(phase6Arm3ValuesManifest())).toContain(PHASE6_ARM3_FREEZE_COMMIT);
  });

  it("separates values from justification, and prose lives only on the justification side", () => {
    const values = JSON.stringify(phase6Arm3ValuesManifest());
    for (const row of phase6Arm3FreezeList()) {
      // Long strings only: short requirement words collide with ids — the residual risk ADR 0033
      // named, which produced two false positives on arm 1.
      for (const text of [row.prose.value ?? "", row.prose.source]) {
        if (text.length >= 30) expect(values, `${row.id} prose leaked into values`).not.toContain(text);
      }
    }
    expect(JSON.stringify(phase6Arm3JustificationManifest())).toContain(
      PHASE6_ARM3_ADDED_ROWS[0]?.prose.value as string,
    );
  });
});

describe("the arm-3 harness actually runs arm 3", () => {
  it("emits --param-set M1_NO_DIP_ABLATION, and differs from BOTH arms in that flag alone", () => {
    const point = phase6SweepGrid()[0] as Phase6GridPoint;
    const arm3 = phase6PointCommand(point, PHASE6_ARM3);
    const arm2 = phase6PointCommand(point, PHASE6_ARM2);
    const arm1 = phase6PointCommand(point, PHASE6_ARM1);
    expect(arm3[arm3.indexOf("--param-set") + 1]).toBe("M1_NO_DIP_ABLATION");
    expect(arm2[arm2.indexOf("--param-set") + 1]).toBe("M1");
    expect(arm1[arm1.indexOf("--param-set") + 1]).toBe("CAK");
    // The commands are otherwise IDENTICAL to both — the controlled three-arm comparison.
    const strip = (c: readonly string[]): string[] => {
      const at = c.indexOf("--param-set");
      return [...c.slice(0, at), ...c.slice(at + 2)];
    };
    expect(strip(arm3)).toEqual(strip(arm1));
    expect(strip(arm3)).toEqual(strip(arm2));
  });

  it("writes to a DIFFERENT directory, so no arm can overwrite another", () => {
    expect(PHASE6_ARM3.outDirName).toBe("phase6-sweep-arm3");
    expect(PHASE6_ARM3.outDirName).not.toBe(PHASE6_ARM1.outDirName);
    expect(PHASE6_ARM3.outDirName).not.toBe(PHASE6_ARM2.outDirName);
  });

  it("gates on the arm's OWN values hash, and the table covers all three arms", () => {
    expect(PHASE6_ARM3.valuesSha256()).toBe(PHASE6_ARM3_VALUES_SHA256);
    expect(PHASE6_ARM2.valuesSha256()).toBe(PHASE6_ARM2_VALUES_SHA256);
    expect(PHASE6_ARM1.valuesSha256()).toBe(PHASE6_VALUES_SHA256);
    expect(PHASE6_ARM_VALUES_SHA256[PHASE6_ARM3.id]).toBe(PHASE6_ARM3_VALUES_SHA256);
    expect(PHASE6_ARM_VALUES_SHA256[PHASE6_ARM2.id]).toBe(PHASE6_ARM2_VALUES_SHA256);
    expect(PHASE6_ARM_VALUES_SHA256[PHASE6_ARM1.id]).toBe(PHASE6_VALUES_SHA256);
  });

  it("CATCHES a cross-arm command in either direction", () => {
    // The cross-arm version of ADR 0031: a run that looks like arm 3 and is another arm.
    const point = phase6SweepGrid()[0] as Phase6GridPoint;
    const asArm1 = [...phase6PointCommand(point, PHASE6_ARM1)];
    const asArm2 = [...phase6PointCommand(point, PHASE6_ARM2)];
    const asArm3 = [...phase6PointCommand(point, PHASE6_ARM3)];
    expect(
      phase6CommandFlagFailures(asArm1, PHASE6_ARM3).some((f) =>
        f.includes("not the registered M1_NO_DIP_ABLATION"),
      ),
    ).toBe(true);
    expect(
      phase6CommandFlagFailures(asArm2, PHASE6_ARM3).some((f) =>
        f.includes("not the registered M1_NO_DIP_ABLATION"),
      ),
    ).toBe(true);
    expect(
      phase6CommandFlagFailures(asArm3, PHASE6_ARM2).some((f) => f.includes("not the registered M1")),
    ).toBe(true);
    expect(
      phase6CommandFlagFailures(asArm3, PHASE6_ARM1).some((f) => f.includes("not the registered CAK")),
    ).toBe(true);
    expect(phase6CommandFlagFailures(asArm3, PHASE6_ARM3)).toEqual([]);
  });
});

describe("preflight refuses arm 3 by name until the stage-2 freeze commit lands", () => {
  it("names the pending freeze commit rather than running without one", () => {
    // The whole cost of "registered before it ran" is that it can fail. Until the stage-2
    // landing fills the 40-hex commit, preflight must REFUSE arm 3 by name — and this test is
    // what proves the refusal is real rather than a comment.
    const report = phase6SweepPreflight(process.cwd(), PHASE6_ARM3);
    const registered = /^[0-9a-f]{40}$/.test(PHASE6_ARM3_FREEZE_COMMIT);
    if (registered) {
      // Stage 2 has landed: preflight must not complain about the freeze commit's FORM. (The
      // ancestry check may still fail on an unrelated tree; that failure names "ancestor".)
      expect(report.failures.some((f) => f.includes("no freeze commit registered"))).toBe(false);
    } else {
      expect(
        report.failures.some((f) =>
          f.includes(
            `${PHASE6_ARM3.id} has no freeze commit registered ` +
              `(it reads "${PHASE6_ARM3_FREEZE_COMMIT}")`,
          ),
        ),
        "preflight must refuse arm 3 by name while the freeze commit is pending",
      ).toBe(true);
    }
  });

  it("stage 1 reads the literal pending marker; both prior arms hold real 40-hex commits", () => {
    // Pinning the marker text keeps the preflight refusal message stable; the stage-2 landing
    // consciously replaces this assertion's expectation along with the hash pins.
    if (!/^[0-9a-f]{40}$/.test(PHASE6_ARM3_FREEZE_COMMIT)) {
      expect(PHASE6_ARM3_FREEZE_COMMIT).toBe("pending-stage-2-landing");
    }
    expect(PHASE6_ARM1.freezeCommit).toMatch(/^[0-9a-f]{40}$/);
    expect(PHASE6_ARM2_FREEZE_COMMIT).toMatch(/^[0-9a-f]{40}$/);
    expect(PHASE6_ARM3_FREEZE_COMMIT).not.toBe(PHASE6_ARM1.freezeCommit);
    expect(PHASE6_ARM3_FREEZE_COMMIT).not.toBe(PHASE6_ARM2_FREEZE_COMMIT);
  });
});
