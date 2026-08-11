import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { canonicalJson } from "../src/gate4-evidence.ts";
import {
  parsePhase8TargetBook,
  verifyPhase8SourceReferences,
  type Phase8Entry,
  type Phase8BookStatus,
} from "../src/phase8-target-book.ts";
import {
  PHASE8_FREEZE_PATH,
  verifyPhase8FreezeBytes,
  verifyPhase8FreezeFile,
  type Phase8Freeze,
} from "../src/phase8-freeze.ts";

const REPOSITORY_ROOT = fileURLToPath(new URL("../..", import.meta.url));

const SOURCE_A = { path: "research/source-a.md", extractId: "P8X-SOURCE-A-1" } as const;
const SOURCE_B = { path: "research/source-b.md", extractId: "P8X-SOURCE-B-1" } as const;

function target(overrides: Partial<Phase8Entry> = {}): Phase8Entry {
  return {
    recordKind: "entry",
    id: "P8-TARGET-A",
    role: "target",
    observable: { kind: "habit-boundary", description: "one registered boundary" },
    claim: "A page-cited test observation.",
    sourceRefs: [SOURCE_A],
    dataRefs: [],
    protocol: {
      seed: { kind: "free-fall-nucleated", detail: "source-reported free-fall seed population" },
      pressure: {
        kind: "approximate",
        valuesPascal: [101_000],
        uncertainty: "not stated",
        detail: "source reports about 1010 mb",
      },
      geometry: { kind: "free-fall-ventilated", detail: "vertical cloud tunnel" },
      supersaturation: {
        semantics: "at-water-saturation",
        valuesFraction: [],
        uncertainty: "actual warm-run ice supersaturation is not bounded",
        detail: "liquid-water cloud reported at water saturation",
      },
      growthHistory: { kind: "constant", detail: "nominally constant tunnel condition" },
      ensemble: { kind: "population-at-each-time", detail: "different crystals at each time" },
      substrate: { kind: "absent", detail: "freely falling crystals" },
      medium: "air with supercooled droplets",
    },
    uncertainty: "temperature read and source systematic stated in the extraction",
    robustness: {
      class: "B",
      witnesses: [{
        laboratory: "Lab A",
        method: "free-fall tunnel",
        position: "reported boundary",
        sourceRef: SOURCE_A,
      }],
      rationale: "one laboratory and protocol",
      reconciliationHypothesis: null,
    },
    partition: {
      split: "held-out",
      inSample: false,
      comparisonStatus: "conditional",
      rationale: "reserved, but protocol matching is required",
    },
    derivedOperator: "boundary-temperature-v1",
    limits: ["ventilation is absent from the current solver"],
    ...overrides,
  };
}

function input(overrides: Partial<Phase8Entry> = {}): Phase8Entry {
  return target({
    id: "P8-INPUT-A",
    role: "input",
    partition: {
      split: "not-applicable",
      inSample: true,
      comparisonStatus: "not-scoreable",
      rationale: "registered model input rather than a scored observation",
    },
    ...overrides,
  });
}

function status(entries: readonly Phase8Entry[]): Phase8BookStatus {
  const paths = [...new Set(entries.flatMap((entry) => entry.sourceRefs.map((ref) => ref.path)))].sort();
  return {
    recordKind: "book-status",
    schema: "phase8-target-book-v1",
    book: "fixture",
    entryCount: entries.length,
    targetCount: entries.filter((entry) => entry.role === "target").length,
    inputCount: entries.filter((entry) => entry.role === "input").length,
    leakageGuards: [],
    sourceIndexes: paths,
    extends: {
      path: "research/lab-validation-dataset.jsonl",
      entryCount: 122,
      passEligible: false,
      sha256: "a".repeat(64),
    },
  };
}

function bytes(entries: readonly Phase8Entry[], statusOverride: Partial<Phase8BookStatus> = {}): Uint8Array {
  const records = [...entries, { ...status(entries), ...statusOverride }];
  return new TextEncoder().encode(`${records.map(canonicalJson).join("\n")}\n`);
}

describe("Phase 8 target-book schema", () => {
  it("accepts a canonical, counted, protocol-complete target", () => {
    const parsed = parsePhase8TargetBook(bytes([target()]));
    expect(parsed.entries).toHaveLength(1);
    expect(parsed.status.targetCount).toBe(1);
    expect(parsed.sha256).toMatch(/^[0-9a-f]{64}$/);
  });

  it("rejects noncanonical bytes, stale counts, and duplicate ids", () => {
    const canonical = new TextDecoder().decode(bytes([target()]));
    expect(() => parsePhase8TargetBook(new TextEncoder().encode(canonical.replace("{", "{ "))))
      .toThrow(/not canonical/);
    expect(() => parsePhase8TargetBook(bytes([target()], { entryCount: 2 })))
      .toThrow(/counts do not match/);
    expect(() => parsePhase8TargetBook(bytes([target(), target()])))
      .toThrow(/ids must be unique/);
  });

  it("enforces the inputs-versus-targets and split boundary", () => {
    expect(() => parsePhase8TargetBook(bytes([target({
      role: "input",
      partition: {
        split: "held-out",
        inSample: false,
        comparisonStatus: "conditional",
        rationale: "invalid fixture",
      },
    })]))).toThrow(/input must be in-sample/);
    expect(() => parsePhase8TargetBook(bytes([target({
      partition: {
        split: "not-applicable",
        inSample: false,
        comparisonStatus: "not-scoreable",
        rationale: "invalid fixture",
      },
    })]))).toThrow(/target must belong/);
  });

  it("requires an explicit guard for every shared-source input and held-out target", () => {
    const entries = [input(), target()];
    expect(() => parsePhase8TargetBook(bytes(entries)))
      .toThrow(/leakage guard is required.*shared-source held-out targets/);

    const parsed = parsePhase8TargetBook(bytes(entries, {
      leakageGuards: [{
        inputId: "P8-INPUT-A",
        targetIds: ["P8-TARGET-A"],
        rule: "The target remains held-out only when this fitted input is not adopted.",
      }],
    }));
    expect(parsed.status.leakageGuards).toEqual([{
      inputId: "P8-INPUT-A",
      targetIds: ["P8-TARGET-A"],
      rule: "The target remains held-out only when this fitted input is not adopted.",
    }]);
  });

  it("validates leakage-guard roles, held-out status, ordering, and complete coverage", () => {
    const targetB = target({ id: "P8-TARGET-B" });
    const entries = [input(), target(), targetB];
    expect(() => parsePhase8TargetBook(bytes(entries, {
      leakageGuards: [{
        inputId: "P8-INPUT-A",
        targetIds: ["P8-TARGET-B", "P8-TARGET-A"],
        rule: "invalid ordering",
      }],
    }))).toThrow(/targetIds must be in lexical order/);
    expect(() => parsePhase8TargetBook(bytes(entries, {
      leakageGuards: [{
        inputId: "P8-INPUT-A",
        targetIds: ["P8-TARGET-A", "P8-TARGET-A"],
        rule: "invalid duplicate",
      }],
    }))).toThrow(/targetIds must not contain duplicates/);
    expect(() => parsePhase8TargetBook(bytes(entries, {
      leakageGuards: [{
        inputId: "P8-INPUT-A",
        targetIds: ["P8-TARGET-A", "P8-TARGET-B"],
        rule: " ",
      }],
    }))).toThrow(/rule must be a nonempty string/);
    expect(() => parsePhase8TargetBook(bytes(entries, {
      leakageGuards: [{
        inputId: "P8-INPUT-A",
        targetIds: ["P8-TARGET-A"],
        rule: "incomplete guard",
      }],
    }))).toThrow(/leaves shared-source held-out targets uncovered: P8-TARGET-B/);
    expect(() => parsePhase8TargetBook(bytes([target()], {
      leakageGuards: [{
        inputId: "P8-TARGET-A",
        targetIds: ["P8-TARGET-A"],
        rule: "invalid role",
      }],
    }))).toThrow(/inputId must name an input entry/);

    const developmentTarget = target({
      partition: {
        split: "model-development",
        inSample: true,
        comparisonStatus: "conditional",
        rationale: "model-development fixture",
      },
    });
    expect(() => parsePhase8TargetBook(bytes([input(), developmentTarget], {
      leakageGuards: [{
        inputId: "P8-INPUT-A",
        targetIds: ["P8-TARGET-A"],
        rule: "invalid target split",
      }],
    }))).toThrow(/target must be held-out/);
  });

  it("requires two genuinely independent witnesses for Class A", () => {
    const sameLineage = target({
      sourceRefs: [SOURCE_A, SOURCE_B],
      robustness: {
        class: "A",
        witnesses: [
          { laboratory: "Lab A", method: "free-fall tunnel", position: "860 mb", sourceRef: SOURCE_A },
          { laboratory: "Lab A", method: "free-fall tunnel", position: "1010 mb", sourceRef: SOURCE_B },
        ],
        rationale: "invalid same-lineage pressure pair",
        reconciliationHypothesis: null,
      },
    });
    expect(() => parsePhase8TargetBook(bytes([sameLineage])))
      .toThrow(/different laboratories and methods/);

    const independent = target({
      sourceRefs: [SOURCE_A, SOURCE_B],
      robustness: {
        class: "A",
        witnesses: [
          { laboratory: "Lab A", method: "free-fall tunnel", position: "position one", sourceRef: SOURCE_A },
          { laboratory: "Lab B", method: "electrodynamic levitation", position: "position two", sourceRef: SOURCE_B },
        ],
        rationale: "two independent witnesses",
        reconciliationHypothesis: null,
      },
    });
    expect(parsePhase8TargetBook(bytes([independent])).entries[0]?.robustness.class).toBe("A");
  });

  it("requires Class C to carry a testable reconciliation hypothesis", () => {
    expect(() => parsePhase8TargetBook(bytes([target({
      robustness: {
        class: "C",
        witnesses: [{
          laboratory: "Lab A",
          method: "free-fall tunnel",
          position: "one side",
          sourceRef: SOURCE_A,
        }],
        rationale: "standing disagreement",
        reconciliationHypothesis: null,
      },
    })]))).toThrow(/testable reconciliation hypothesis/);

    expect(() => parsePhase8TargetBook(bytes([target({
      robustness: {
        class: "C",
        witnesses: [{
          laboratory: "Lab A",
          method: "free-fall tunnel",
          position: "one side",
          sourceRef: SOURCE_A,
        }],
        rationale: "standing disagreement",
        reconciliationHypothesis: "Changing seed and transport protocol changes the observed side.",
      },
    })]))).toThrow(/two explicitly different witness positions/);
  });

  it("rejects unclassified supersaturation and invented water-saturation fractions", () => {
    const base = target();
    expect(() => parsePhase8TargetBook(bytes([target({
      protocol: {
        ...base.protocol,
        supersaturation: {
          ...base.protocol.supersaturation,
          semantics: "mystery",
        },
      },
    })]))).toThrow(/must be one of/);
    expect(() => parsePhase8TargetBook(bytes([target({
      protocol: {
        ...base.protocol,
        supersaturation: {
          ...base.protocol.supersaturation,
          valuesFraction: [0.1],
        },
      },
    })]))).toThrow(/must not invent values/);

    const composite = target({
      protocol: {
        ...base.protocol,
        supersaturation: {
          semantics: "mixed-source-specific",
          valuesFraction: [],
          uncertainty: "source-specific uncertainties are retained in the extraction indexes",
          detail: "one witness reports water saturation; the other reports chamber-calibrated values",
        },
      },
    });
    expect(parsePhase8TargetBook(bytes([composite])).entries[0]?.protocol.supersaturation.semantics)
      .toBe("mixed-source-specific");
    expect(() => parsePhase8TargetBook(bytes([target({
      protocol: {
        ...composite.protocol,
        supersaturation: {
          ...composite.protocol.supersaturation,
          valuesFraction: [0.02],
        },
      },
    })]))).toThrow(/must not invent values/);

    const curveCalibratedWithoutPooledValue = target({
      protocol: {
        ...base.protocol,
        supersaturation: {
          semantics: "chamber-calibrated-ice-relative",
          valuesFraction: [],
          uncertainty: "fit is curve-specific and no aggregate value is frozen",
          detail: "each trajectory keeps its own chamber inversion",
        },
      },
    });
    expect(parsePhase8TargetBook(bytes([curveCalibratedWithoutPooledValue])).entries[0]
      ?.protocol.supersaturation.valuesFraction).toEqual([]);

    expect(() => parsePhase8TargetBook(bytes([target({
      protocol: {
        ...base.protocol,
        pressure: {
          detail: "the component studies report different pressures",
          kind: "mixed-source-specific",
          uncertainty: "retained per source",
          valuesPascal: [101_000],
        },
      },
    })]))).toThrow(/must have no aggregate values/);
  });

  it("resolves each cited extraction anchor exactly once", () => {
    const book = parsePhase8TargetBook(bytes([target()]));
    const root = mkdtempSync(join(tmpdir(), "phase8-book-test-"));
    mkdirSync(join(root, "research"));
    writeFileSync(
      join(root, "research", "source-a.md"),
      '<a id="P8X-SOURCE-A-1"></a>\n- claim (printed p. 12 / PDF p. 3).\n',
    );
    expect(() => verifyPhase8SourceReferences(book, root)).not.toThrow();
    writeFileSync(
      join(root, "research", "source-a.md"),
      '<a id="P8X-SOURCE-A-1"></a>\n- printed p. 12.\n<a id="P8X-SOURCE-A-1"></a>\n',
    );
    expect(() => verifyPhase8SourceReferences(book, root)).toThrow(/duplicated/);
  });

  it("rejects a bare anchor and accepts a concrete archive-member locator", () => {
    const book = parsePhase8TargetBook(bytes([target()]));
    const root = mkdtempSync(join(tmpdir(), "phase8-book-locator-test-"));
    mkdirSync(join(root, "research"));
    writeFileSync(
      join(root, "research", "source-a.md"),
      '<a id="P8X-SOURCE-A-1"></a>\n- unlocated synthesis from `source-a.pdf` only.\n',
    );
    expect(() => verifyPhase8SourceReferences(book, root)).toThrow(/no source reference.*explicit page\/archive\/data locator/);
    writeFileSync(
      join(root, "research", "source-a.md"),
      '<a id="P8X-SOURCE-A-1"></a>\n- exact row from `dimensions-20240814.dat`.\n',
    );
    expect(() => verifyPhase8SourceReferences(book, root)).not.toThrow();
  });

  it("requires every robustness witness anchor itself to carry a source locator", () => {
    const entry = target({
      sourceRefs: [SOURCE_A, SOURCE_B],
      robustness: {
        class: "B",
        witnesses: [{
          laboratory: "Lab B",
          method: "levitation",
          position: "unlocated position",
          sourceRef: SOURCE_B,
        }],
        rationale: "the witness must resolve directly",
        reconciliationHypothesis: null,
      },
    });
    const book = parsePhase8TargetBook(bytes([entry]));
    const root = mkdtempSync(join(tmpdir(), "phase8-book-witness-test-"));
    mkdirSync(join(root, "research"));
    writeFileSync(
      join(root, "research", "source-a.md"),
      '<a id="P8X-SOURCE-A-1"></a>\n- direct fact on manuscript p. 7.\n',
    );
    writeFileSync(
      join(root, "research", "source-b.md"),
      '<a id="P8X-SOURCE-B-1"></a>\n- interpretive position without a locator.\n',
    );
    expect(() => verifyPhase8SourceReferences(book, root))
      .toThrow(/robustness witness 0 lacks an explicit page\/archive\/data locator/);
  });
});

describe("published Phase 8 freeze", () => {
  it("re-derives the book, pins, and split from published bytes", () => {
    const { book, freeze } = verifyPhase8FreezeFile(REPOSITORY_ROOT);
    expect(book.status).toMatchObject({ entryCount: 18, targetCount: 16, inputCount: 2 });
    expect(freeze.split.heldOutIds).toHaveLength(7);
    expect(freeze.supportingRecords).toHaveLength(3);
    expect(freeze.verifier.map((pin) => pin.path)).toContain("runner/src/gate4-evidence.ts");
    expect(freeze.scope).toMatchObject({ grantsValidationClaim: false, permitsSolverRun: false });
  });

  it.each([
    ["target-book identity", (freeze: Phase8Freeze) => ({
      ...freeze,
      targetBook: { ...freeze.targetBook, sha256: "0".repeat(64) },
    })],
    ["held-out membership", (freeze: Phase8Freeze) => ({
      ...freeze,
      split: { ...freeze.split, heldOutIds: freeze.split.heldOutIds.slice(1) },
    })],
    ["source-index identity", (freeze: Phase8Freeze) => ({
      ...freeze,
      sourceIndexes: freeze.sourceIndexes.map((pin, index) => index === 0
        ? { ...pin, sha256: "f".repeat(64) }
        : pin),
    })],
    ["supporting-record identity", (freeze: Phase8Freeze) => ({
      ...freeze,
      supportingRecords: freeze.supportingRecords.map((pin, index) => index === 0
        ? { ...pin, sha256: "e".repeat(64) }
        : pin),
    })],
    ["verifier-dependency identity", (freeze: Phase8Freeze) => ({
      ...freeze,
      verifier: freeze.verifier.map((pin) => pin.path === "runner/src/gate4-evidence.ts"
        ? { ...pin, sha256: "d".repeat(64) }
        : pin),
    })],
  ] as const)("rejects a mutated %s", (_name, mutate) => {
    const path = resolve(REPOSITORY_ROOT, PHASE8_FREEZE_PATH);
    const freeze = JSON.parse(readFileSync(path, "utf8")) as Phase8Freeze;
    const bytes = new TextEncoder().encode(`${canonicalJson(mutate(freeze))}\n`);
    expect(() => verifyPhase8FreezeBytes(bytes, REPOSITORY_ROOT))
      .toThrow(/differs from independently re-derived bytes and split/);
  });
});
