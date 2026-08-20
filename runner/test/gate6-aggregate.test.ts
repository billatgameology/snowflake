import { execFileSync, spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { collectGate6Evidence, evaluateGate6, type Gate6EvidenceCapture } from "../src/gate6-aggregate.ts";

// Phase 6 WP8 negative controls (plan: "Execute all registered negative controls and prove
// each named mutation occurred independently of the verifier it attacks"). Every mutation is a
// plain-data edit on a cloned evidence capture — the evaluator never constructs or selects the
// mutation, so a control that is caught can only have been caught by re-derivation.
const REPO = fileURLToPath(new URL("../..", import.meta.url));
const HEAD = execFileSync("git", ["rev-parse", "HEAD"], { cwd: REPO, encoding: "utf8" }).trim();

// The suite runs on working trees that are legitimately dirty mid-development, so the
// repository-identity seam pins tree cleanliness for the baseline; the real gate command
// derives it from git and is exercised end-to-end before every Phase 6 closure push.
const baseline = (): Gate6EvidenceCapture =>
  collectGate6Evidence(REPO, { repositoryIdentity: { headCommit: HEAD, treeClean: true } });

type Mutable = { -readonly [K in keyof Gate6EvidenceCapture]: Gate6EvidenceCapture[K] };

interface Gate6NegativeControl {
  readonly id: string;
  readonly attacks: string;
  readonly mutate: (capture: Mutable) => void;
  /** Proves the named mutation executed: must return different values before/after. */
  readonly witness: (capture: Gate6EvidenceCapture) => unknown;
}

const CONTROLS: readonly Gate6NegativeControl[] = [
  {
    id: "NC-FORGED-PROVENANCE", // registered: forged provenance
    attacks: "G6-ARM3-ABLATION",
    mutate: (c) => {
      (c.arms.arm3.report as Record<string, unknown>).valuesSha256 = "0".repeat(64);
    },
    witness: (c) => c.arms.arm3.report.valuesSha256,
  },
  {
    id: "NC-POST-FREEZE-PARAMETER-EDIT", // registered: a post-freeze parameter edit
    attacks: "G6-PARAMETER-TABLE",
    mutate: (c) => {
      c.parameterTableLfSha256 = "f".repeat(64);
    },
    witness: (c) => c.parameterTableLfSha256,
  },
  {
    id: "NC-MERGED-REPORT", // registered: a merged no-SDAK/SDAK report
    attacks: "G6-NARRATIVE",
    mutate: (c) => {
      c.narrative = c.narrative.replace(
        "The three arms are reported separately throughout; no-SDAK and SDAK results are never merged.",
        "Across all arms combined, agreement reaches 62 points.",
      );
    },
    witness: (c) => c.narrative.length,
  },
  {
    id: "NC-DOMAIN-CONTACT", // registered: a domain-contacted run entering results
    attacks: "G6-ARM2-M1",
    mutate: (c) => {
      const row = c.arms.arm2.points.find((p) => p.score === "agree");
      if (row === undefined) throw new Error("no agreeing arm-2 row to mutate");
      (row.result as { domainContact: boolean }).domainContact = true;
    },
    witness: (c) => c.arms.arm2.points.filter((p) => p.result.domainContact).length,
  },
  {
    id: "NC-FARFIELD-MISMATCH", // registered: a mismatched far-field condition
    attacks: "G6-LADDER",
    mutate: (c) => {
      (c.ladderRows[0] as { farField: string }).farField = "dirichlet";
    },
    witness: (c) => c.ladderRows[0]?.farField,
  },
  {
    id: "NC-WRONG-MEASUREMENT-SIZE", // registered: habit classification at the wrong measurement size
    attacks: "G6-ARM1-CAK",
    mutate: (c) => {
      const row = c.arms.arm1.points.find((p) => p.score !== "excluded");
      if (row === undefined) throw new Error("no scored arm-1 row to mutate");
      (row.result as { largestExtent: number }).largestExtent = 19;
    },
    witness: (c) => Math.min(...c.arms.arm1.points.map((p) => p.result.largestExtent)),
  },
  {
    id: "NC-CLOSURE-LABEL-SWAP", // WP4's control, converted under decision 0045
    attacks: "G6-CLOSURE-LABELS",
    mutate: (c) => {
      c.progress = c.progress
        .replaceAll("not computed by decision 0045", "satisfied by the measured-only counts")
        .replace("They are not the registered conservative-intersection verdict", "They satisfy the registered verdict");
    },
    witness: (c) => c.progress.includes("not computed by decision 0045"),
  },
  {
    id: "NC-STRATA-VALUE-EDIT",
    attacks: "G6-STRATA",
    mutate: (c) => {
      // Value-only edit with the hash left intact: proves the S1 check re-derives from content
      // independently of the byte identity check.
      const s1 = (c.strata.strata as Record<string, Record<string, unknown>>).s1ObservedInitialSize;
      s1.unionIntervalUm = [5.8999999999999995, 12.2];
    },
    witness: (c) => JSON.stringify((c.strata.strata as Record<string, Record<string, unknown>>).s1ObservedInitialSize.unionIntervalUm),
  },
  {
    id: "NC-MANIFEST-PIN-DRIFT",
    attacks: "G6-MANIFEST-PHASE6",
    mutate: (c) => {
      (c.manifestPhase6[0] as { actualSha256: string }).actualSha256 = "1".repeat(64);
    },
    witness: (c) => c.manifestPhase6[0]?.actualSha256,
  },
  {
    id: "NC-LADDER-VERDICT-FORGE",
    attacks: "G6-LADDER",
    mutate: (c) => {
      (c.ladderReport as Record<string, unknown>).overallVerdict = "pass";
    },
    witness: (c) => c.ladderReport.overallVerdict,
  },
  {
    id: "NC-DEFERRAL-ELIGIBILITY-FLIP",
    attacks: "G6-DEFERRALS",
    mutate: (c) => {
      (c.heldoutLock as { passEligible: unknown }).passEligible = true;
    },
    witness: (c) => c.heldoutLock.passEligible,
  },
  {
    id: "NC-HISTORY-SUBSTITUTION",
    attacks: "G6-HISTORY",
    mutate: (c) => {
      c.supersededCakA1PointsSha256 = c.liveArm1PointsSha256;
    },
    witness: (c) => c.supersededCakA1PointsSha256 === c.liveArm1PointsSha256,
  },
  {
    id: "NC-DIRTY-TREE",
    attacks: "G6-TREE-CLEAN",
    mutate: (c) => {
      c.treeClean = false;
    },
    witness: (c) => c.treeClean,
  },
  {
    id: "NC-BROKEN-ANCESTRY",
    attacks: "G6-FREEZE-ANCESTRY",
    mutate: (c) => {
      (c.freezeAncestryOk[0] as { ancestor: boolean }).ancestor = false;
    },
    witness: (c) => c.freezeAncestryOk.every((entry) => entry.ancestor),
  },
];

describe("Phase 6 WP8 final gate (gate6)", () => {
  it("passes every criterion against the committed evidence", () => {
    const results = evaluateGate6(baseline());
    expect(results.map((r) => r.id)).toEqual([
      "G6-TREE-CLEAN",
      "G6-FREEZE-ANCESTRY",
      "G6-MANIFEST-PHASE6",
      "G6-STRATA",
      "G6-ARM1-CAK",
      "G6-ARM2-M1",
      "G6-ARM3-ABLATION",
      "G6-LADDER",
      "G6-NARRATIVE",
      "G6-CLOSURE-LABELS",
      "G6-DEFERRALS",
      "G6-PARAMETER-TABLE",
      "G6-HISTORY",
    ]);
    const failing = results.filter((r) => !r.pass);
    expect(failing, JSON.stringify(failing, null, 2)).toEqual([]);
  });

  it("covers every criterion with at least one negative control", () => {
    const attacked = new Set(CONTROLS.map((control) => control.attacks));
    for (const result of evaluateGate6(baseline())) expect(attacked.has(result.id), result.id).toBe(true);
  });

  for (const control of CONTROLS) {
    it(`${control.id} executes its named mutation and is refused by ${control.attacks}`, () => {
      const clean = baseline();
      const mutated = structuredClone(clean) as Mutable;
      const before = JSON.stringify(control.witness(clean));
      control.mutate(mutated);
      // The mutation executed (witness moved) and the clean capture is untouched.
      expect(JSON.stringify(control.witness(mutated))).not.toBe(before);
      expect(JSON.stringify(control.witness(clean))).toBe(before);

      const results = evaluateGate6(mutated);
      const target = results.find((r) => r.id === control.attacks);
      expect(target?.pass, `${control.attacks} accepted the ${control.id} mutation`).toBe(false);
      // The clean capture still evaluates green, so the refusal came from the mutation alone.
      expect(evaluateGate6(clean).every((r) => r.pass)).toBe(true);
    });
  }

  it("refuses every flag with exit 2 (flagless contract)", () => {
    const child = spawnSync(process.execPath, [resolve(REPO, "runner", "src", "main.ts"), "gate6", "--not-allowed"], {
      cwd: REPO,
      encoding: "utf8",
    });
    expect(child.status).toBe(2);
    expect(child.stderr).toContain("gate6 takes no flags");
    expect(child.stderr).toContain("GATE6 EXIT STATUS: 2");
  });
});
