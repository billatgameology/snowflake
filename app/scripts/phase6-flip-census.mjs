// Phase 6 — the registered FLIP CENSUS, discharged (pin register R55).
//
// ADR 0025 registers the flip count as "itself a first-class result", and `phase6DetectFlips`
// exists to produce it. It has no caller outside `runner/test`, and neither arm's artifact carries
// a flip count — a registered output simply absent from the published evidence. Preflight does not
// check that registered outputs were produced, so nothing failed.
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
//   node app/scripts/phase6-flip-census.mjs

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { phase6DetectFlips } from "../../runner/src/phase6-protocol.ts";

const ARMS = [
  { id: "arm1-cak", label: "arm 1 (CAK, no SDAK)", dir: "phase6-sweep" },
  { id: "arm2-sdak-m1", label: "arm 2 (M1, SDAK)", dir: "phase6-sweep-arm2" },
];
const FRACTIONS = [0.1, 0.15, 0.25, 0.4, 0.6, 0.9];

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

for (const arm of ARMS) {
  const rows = JSON.parse(readFileSync(join(process.cwd(), "evidence", arm.dir, "points.json"), "utf8"));
  console.log(`\n${"=".repeat(88)}\n${arm.label}`);
  let armFlips = 0;
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
    armFlips += registered.length;
    for (const fl of registered) kinds[`${fl.from}->${fl.to}`] += 1;
    const pure = obs.filter((o) => o.modelClass === "plate" || o.modelClass === "column").length;
    const desc = registered.length === 0
      ? "none"
      : registered.map((fl) => `${fl.from}->${fl.to} bracketed ${fl.warmerC}..${fl.colderC} C (width ${fl.widthC})`).join("; ");
    console.log(`  f=${String(f).padEnd(5)} pure points ${String(pure).padStart(2)}/34   flips ${registered.length}: ${desc}`);
  }
  summary.push({ arm: arm.label, flips: armFlips, kinds });
  console.log(`  TOTAL over the 6 ladders: ${armFlips} flips  ${JSON.stringify(kinds)}`);
}

console.log(`\n${"=".repeat(88)}`);
console.log("THE REFERENCE, for comparison. Scanning warm to cold the Nakaya diagram changes habit");
console.log("THREE times: plate->column at -3.3, COLUMN->PLATE at -9.9, plate->column at -21.5.");
console.log("");
for (const s of summary) {
  console.log(`${s.arm.padEnd(24)} ${s.flips} flips   plate->column ${s.kinds["plate->column"]}   column->plate ${s.kinds["column->plate"]}`);
}
console.log("");
if (disagreements.length > 0) {
  console.log("REGISTERED OPERATOR AND INDEPENDENT RE-DERIVATION DISAGREE — that is the finding:");
  for (const d of disagreements) console.log(`  - ${d}`);
  process.exit(1);
}
console.log("The registered operator and an independent re-derivation agree on every ladder.");
console.log("PHASE6 FLIP CENSUS: COMPLETE");
