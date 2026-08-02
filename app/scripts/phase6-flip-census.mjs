// Phase 6 — the registered FLIP CENSUS, discharged (pin register R55).
//
// ADR 0025 registers the flip count as "itself a first-class result", and `phase6DetectFlips`
// exists to produce it. Before this census it had no caller outside `runner/test`, and neither
// arm's artifact carried a flip count — a registered output simply absent from the published
// evidence. Preflight does not check that registered outputs were produced, so nothing failed.
//
// This costs no compute: flips are a function of the published `points.json` files.
//
// WHAT A FLIP IS, per the registered definition. Scanning warm to cold along a constant-f ladder,
// a flip is a change between PURE classes. It is BRACKETED, never pinpointed: reported as the
// interval between the last temperature of one pure class and the first of the other. Neutral and
// invalid points do not terminate a scan, they widen the bracket — a wide neutral span means the
// flip is poorly located, and collapsing it to a midpoint would manufacture precision.
//
// TWO IMPLEMENTATIONS, DELIBERATELY. The registered `phase6DetectFlips` is imported and used,
// because it IS the registered operator. It is also re-derived here from the definition above,
// importing nothing, and the two are required to agree — so a silent change to the operator cannot
// pass as a change in the result.
//
//   node app/scripts/phase6-flip-census.mjs [evidenceRoot]

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { phase6DetectFlips } from "../../runner/src/phase6-protocol.ts";

const ARMS = [
  { id: "arm1-cak", label: "arm 1 (CAK, no SDAK)", dir: "phase6-sweep" },
  {
    id: "arm2-sdak-m1",
    label: "arm 2 (M1, SDAK-dipped approximation)",
    dir: "phase6-sweep-arm2",
  },
];
const FRACTIONS = [0.1, 0.15, 0.25, 0.4, 0.6, 0.9];
const TEMPERATURES_C = Array.from({ length: 34 }, (_, i) => -2 - i);
const PLATE_CEILING = 1 / 1.5;
const COLUMN_FLOOR = 1.5;
const DOMAIN_N = 48;
const TARGET_EXTENT = 21;
const DOMAIN_CONTACT_FRACTION = 0.65;
const EVIDENCE_ROOT = process.argv[2] ?? join(process.cwd(), "evidence");
const EXPECTED_CENSUS = {
  flips: 2,
  plateToColumn: 2,
  columnToPlate: 0,
  laddersWithFlip: 2,
  laddersWithoutFlip: 4,
};

function rederiveModelClass(entry, arm) {
  const armId = arm.id;
  if (entry === null || typeof entry !== "object" || entry.point === null || entry.result === null) {
    throw new Error(`${armId}: row is missing point/result objects`);
  }
  const r = entry.result;
  if (
    r.tempC !== entry.point.tempC ||
    r.fraction !== entry.point.fraction ||
    !Object.is(r.sigmaInf, entry.point.sigmaInf)
  ) {
    throw new Error(
      `${armId} ${entry.point.tempC}|${entry.point.fraction}: point/result coordinates disagree`,
    );
  }
  if (!Number.isInteger(r.largestExtent) || r.largestExtent !== TARGET_EXTENT) {
    throw new Error(
      `${armId} ${entry.point.tempC}|${entry.point.fraction}: largestExtent=${r.largestExtent}, ` +
        `expected the historical measurement target ${TARGET_EXTENT}`,
    );
  }
  if (!Number.isInteger(r.steps) || r.steps <= 0 || !Number.isInteger(r.attached) || r.attached <= 0) {
    throw new Error(`${armId} ${entry.point.tempC}|${entry.point.fraction}: invalid steps/attached witnesses`);
  }
  if (arm.id === "arm2-sdak-m1") {
    const config = r.config;
    if (config === null || typeof config !== "object") {
      throw new Error(`${armId} ${entry.point.tempC}|${entry.point.fraction}: config is absent`);
    }
    for (const [field, expected] of [
      ["paramSet", "M1"],
      ["dimsN", DOMAIN_N],
      ["targetExtent", TARGET_EXTENT],
      ["finalExtent", r.largestExtent],
      ["stopReason", "size-target"],
      ["tempC", entry.point.tempC],
      ["sigmaInf", Number(entry.point.sigmaInf.toFixed(6))],
    ]) {
      if (!Object.is(config[field], expected)) {
        throw new Error(
          `${armId} ${entry.point.tempC}|${entry.point.fraction}: config.${field}=${config[field]}, ` +
            `expected ${expected}`,
        );
      }
    }
  }
  const contactByGeometry = r.largestExtent / DOMAIN_N > DOMAIN_CONTACT_FRACTION;
  if (r.domainContact !== contactByGeometry) {
    throw new Error(
      `${armId} ${entry.point.tempC}|${entry.point.fraction}: domainContact=${r.domainContact} ` +
        `disagrees with ${r.largestExtent}/${DOMAIN_N} > ${DOMAIN_CONTACT_FRACTION}`,
    );
  }
  const invalid =
    r.allConverged !== true ||
    r.deltaSymClean !== true ||
    r.symmetryError !== 0 ||
    contactByGeometry;
  if (invalid) return "invalid";
  if (!Number.isFinite(r.aspectRatio) || r.aspectRatio <= 0) return "invalid";
  if (r.aspectRatio <= PLATE_CEILING) return "plate";
  if (r.aspectRatio >= COLUMN_FLOOR) return "column";
  return "neutral";
}

function validateRows(rows, arm) {
  const armId = arm.id;
  if (!Array.isArray(rows)) throw new Error(`${armId}: points.json is not an array`);
  const expected = new Set();
  for (const tempC of TEMPERATURES_C) {
    for (const fraction of FRACTIONS) expected.add(`${tempC}|${fraction}`);
  }
  const seen = new Map();
  for (const entry of rows) {
    const key = `${entry?.point?.tempC}|${entry?.point?.fraction}`;
    seen.set(key, (seen.get(key) ?? 0) + 1);
    if (!expected.has(key)) throw new Error(`${armId}: unexpected grid row ${key}`);
    const rederived = rederiveModelClass(entry, arm);
    if (entry.modelClass !== rederived) {
      throw new Error(
        `${armId} ${key}: stored modelClass=${entry.modelClass}, re-derived ${rederived}`,
      );
    }
    if ((rederived === "invalid") !== (entry.exclusionReason !== null)) {
      throw new Error(
        `${armId} ${key}: invalid/exclusionReason presence disagrees`,
      );
    }
  }
  if (rows.length !== expected.size) {
    throw new Error(`${armId}: ${rows.length} rows, expected exactly ${expected.size}`);
  }
  for (const [key, count] of seen) {
    if (count !== 1) throw new Error(`${armId}: grid row ${key} appears ${count} times`);
  }
  for (const key of expected) {
    if (!seen.has(key)) throw new Error(`${armId}: registered grid row ${key} is missing`);
  }
}

/** Independent re-derivation. Same definition, no import. */
function flipsIndependently(observations) {
  const ordered = [...observations].sort((a, b) => b.tempC - a.tempC); // warm -> cold
  const out = [];
  let lastPure = null;
  for (const o of ordered) {
    if (o.modelClass !== "plate" && o.modelClass !== "column") continue;
    if (lastPure !== null && lastPure.modelClass !== o.modelClass) {
      out.push({
        warmerC: lastPure.tempC,
        colderC: o.tempC,
        from: lastPure.modelClass,
        to: o.modelClass,
        widthC: Math.abs(lastPure.tempC - o.tempC),
      });
    }
    lastPure = { tempC: o.tempC, modelClass: o.modelClass };
  }
  return out;
}

const disagreements = [];
const summary = [];

console.log("SCOPE: historical measured-only flip diagnostic; not R15 and not Phase 6 gate evidence.");
console.log("OPERATOR: registered pure-class flip operator; neutral and invalid rows are skipped.");
console.log("INPUT: exactly six constant-supersaturation-fraction ladders per arm, 34 temperatures each.");
console.log("LIMIT: arm 1 has no stored stop reason/config; exact extent 21 is its termination witness.");

for (const arm of ARMS) {
  const rows = JSON.parse(readFileSync(join(EVIDENCE_ROOT, arm.dir, "points.json"), "utf8"));
  try {
    validateRows(rows, arm);
  } catch (error) {
    disagreements.push(error instanceof Error ? error.message : String(error));
  }
  console.log(`\n${"=".repeat(88)}\n${arm.label}`);
  let armFlips = 0;
  let laddersWithFlip = 0;
  const kinds = { "plate->column": 0, "column->plate": 0 };
  for (const f of FRACTIONS) {
    const obs = rows
      .filter((e) => e.point.fraction === f)
      .map((e) => ({ tempC: e.point.tempC, modelClass: e.modelClass }));
    const registered = phase6DetectFlips(obs);
    const mine = flipsIndependently(obs);
    if (JSON.stringify(registered) !== JSON.stringify(mine)) {
      disagreements.push(`${arm.id} f=${f}: registered ${JSON.stringify(registered)} vs independent ${JSON.stringify(mine)}`);
    }
    if (obs.length !== TEMPERATURES_C.length) {
      disagreements.push(`${arm.id} f=${f}: ${obs.length} rows, expected ${TEMPERATURES_C.length}`);
    }
    armFlips += registered.length;
    if (registered.length > 0) laddersWithFlip += 1;
    for (const fl of registered) kinds[`${fl.from}->${fl.to}`] += 1;
    const pure = obs.filter((o) => o.modelClass === "plate" || o.modelClass === "column").length;
    const desc = registered.length === 0
      ? "none"
      : registered.map((fl) => `${fl.from}->${fl.to} bracketed ${fl.warmerC}..${fl.colderC} C (width ${fl.widthC})`).join("; ");
    console.log(`  f=${String(f).padEnd(5)} pure points ${String(pure).padStart(2)}/34   flips ${registered.length}: ${desc}`);
  }
  const laddersWithoutFlip = FRACTIONS.length - laddersWithFlip;
  summary.push({ arm: arm.label, flips: armFlips, kinds, laddersWithFlip, laddersWithoutFlip });
  console.log(`  TOTAL over the 6 ladders: ${armFlips} flips  ${JSON.stringify(kinds)}`);
  console.log(
    `  LADDER SCOPE: ${laddersWithFlip}/6 ladders contain a flip; ` +
      `${laddersWithoutFlip}/6 contain none.`,
  );

  const expectedChecks = [
    ["total flips", armFlips, EXPECTED_CENSUS.flips],
    ["plate->column flips", kinds["plate->column"], EXPECTED_CENSUS.plateToColumn],
    ["column->plate flips", kinds["column->plate"], EXPECTED_CENSUS.columnToPlate],
    ["ladders with a flip", laddersWithFlip, EXPECTED_CENSUS.laddersWithFlip],
    ["ladders without a flip", laddersWithoutFlip, EXPECTED_CENSUS.laddersWithoutFlip],
  ];
  for (const [name, got, expected] of expectedChecks) {
    if (got !== expected) disagreements.push(`${arm.id}: ${name} ${got}, registered result ${expected}`);
  }
}

console.log(`\n${"=".repeat(88)}`);
console.log("THE REFERENCE, for comparison. Scanning warm to cold the Nakaya diagram changes habit");
console.log("THREE times: plate->column at -3.3, COLUMN->PLATE at -9.9, plate->column at -21.5.");
console.log("");
for (const s of summary) {
  console.log(
    `${s.arm.padEnd(24)} ${s.flips} flips   plate->column ${s.kinds["plate->column"]}   ` +
      `column->plate ${s.kinds["column->plate"]}   ladders ${s.laddersWithFlip}/6 with, ` +
      `${s.laddersWithoutFlip}/6 without`,
  );
}
console.log("");
if (disagreements.length > 0) {
  console.log("REGISTERED OPERATOR AND INDEPENDENT RE-DERIVATION DISAGREE — that is the finding:");
  for (const d of disagreements) console.log(`  - ${d}`);
  process.exit(1);
}
console.log("The registered operator and an independent re-derivation agree on every ladder.");
console.log("Each arm has two plate->column flips in 2/6 ladders, none in 4/6, and no reverse flip.");
console.log("PHASE6 HISTORICAL MEASURED-ONLY FLIP CENSUS: COMPLETE (not the R15/gate verdict)");
