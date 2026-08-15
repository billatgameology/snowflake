// Phase 7 prep Track C (docs/plans/explore-phase7-prep.md): ramp -> staircase compiler
// PROTOTYPE. Charter Phase 7 (v1.18, decision 0029): a drawn ramp is UI sugar compiling to
// a dense staircase of decision-0011 abrupt events; adoption is conditional on a recorded
// step-halving convergence check. This prototype emits the staircase as a stages[] spec for
// scripts/gutcheck-grow-params.ts, so every event executes the already-tested public
// applyTimelineEnvironment path. Its outputs inform, but do not constitute, the charter's
// adoption check (that belongs to the real phase, on the real app, after Phase 6).
//
//   node scripts/gutcheck-ramp-compile.ts <ramp.json> <out-spec.json> --events N
//
// ramp.json: {label, from:{rho,phi,ggThreshTable,kappa,mu}, to:{...same...},
//             rampStartTick, rampEndTick}
// from/to use gutcheck-grow-params vector syntax: ggThreshTable is per-slot
// ({"01":..,"10":..,...}), kappa/mu are {default, overrides}. Every scalar interpolates
// linearly in event index; each of N events holds its interpolated vector until the next.

import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const SLOT_KEYS = ["01", "10", "11", "20", "21", "30", "31"] as const;
type SlotKey = (typeof SLOT_KEYS)[number];
type SlotTable = Record<SlotKey, number>;

interface SlotSpread {
  default: number;
  overrides: Partial<Record<SlotKey, number>>;
}
interface RampVector {
  rho: number;
  phi: number;
  ggThreshTable: SlotTable;
  kappa: SlotSpread;
  mu: SlotSpread;
}
interface RampSpec {
  label: string;
  from: RampVector;
  to: RampVector;
  rampStartTick: number;
  rampEndTick: number;
}

const spread = (s: SlotSpread): SlotTable => {
  const out = {} as SlotTable;
  for (const key of SLOT_KEYS) out[key] = s.overrides[key] ?? s.default;
  return out;
};
const lerpTable = (a: SlotTable, b: SlotTable, k: number): SlotTable => {
  const out = {} as SlotTable;
  for (const key of SLOT_KEYS) out[key] = a[key] + (b[key] - a[key]) * k;
  return out;
};
const asSpread = (t: SlotTable): SlotSpread => ({ default: t["01"], overrides: { ...t } });

function run(): void {
  const argv = process.argv.slice(2);
  const [rampPath, outPath] = argv;
  const eventsIdx = argv.indexOf("--events");
  if (rampPath === undefined || outPath === undefined || eventsIdx < 0) {
    throw new Error("usage: gutcheck-ramp-compile.ts <ramp.json> <out-spec.json> --events N");
  }
  const events = Number(argv[eventsIdx + 1]);
  if (!Number.isInteger(events) || events < 1) throw new Error("--events must be a positive integer");
  const ramp = JSON.parse(readFileSync(resolve(rampPath), "utf8")) as RampSpec;
  if (ramp.rampEndTick <= ramp.rampStartTick) throw new Error("rampEndTick must exceed rampStartTick");
  // Charter Phase 7: at most one event per solver step. gutcheck-grow-params advances at
  // most one stage per tick, so N > span silently cascades one event per tick and stretches
  // the ramp past rampEndTick — the denser rung of a step-halving ladder would then execute
  // a different schedule, not a denser sampling of the same one. Fail closed instead.
  // (2026-08-05 adversarial review; reproduced before fixing.)
  const rampSpan = ramp.rampEndTick - ramp.rampStartTick;
  if (events > rampSpan) {
    throw new Error(
      `--events ${events} exceeds the ramp span of ${rampSpan} ticks: one event per tick is the ` +
        `solver's native resolution, so the staircase cannot be denser than the span`,
    );
  }

  const fromKappa = spread(ramp.from.kappa);
  const toKappa = spread(ramp.to.kappa);
  const fromMu = spread(ramp.from.mu);
  const toMu = spread(ramp.to.mu);

  const stages: unknown[] = [];
  // Stage 0: the `from` vector holds until the ramp starts.
  // k === 1 returns the `to` vector exactly rather than a + (b-a)*1, which is not
  // bit-equal in float64 — the final event must land on the drawn endpoint.
  const stageAt = (k: number, untilTick: number | null): unknown =>
    k === 1
      ? {
          untilTick,
          rho: ramp.to.rho,
          phi: ramp.to.phi,
          ggThreshTable: { ...ramp.to.ggThreshTable },
          kappa: asSpread(toKappa),
          mu: asSpread(toMu),
        }
      : {
          untilTick,
          rho: ramp.from.rho + (ramp.to.rho - ramp.from.rho) * k,
          phi: ramp.from.phi + (ramp.to.phi - ramp.from.phi) * k,
          ggThreshTable: lerpTable(ramp.from.ggThreshTable, ramp.to.ggThreshTable, k),
          kappa: asSpread(lerpTable(fromKappa, toKappa, k)),
          mu: asSpread(lerpTable(fromMu, toMu, k)),
        };
  stages.push(stageAt(0, ramp.rampStartTick));
  const span = ramp.rampEndTick - ramp.rampStartTick;
  // Event i begins at rampStart + span*(i-1)/N and applies the vector at fraction i/N —
  // the drawn ramp sampled at each step's end, applied at its start. The final event
  // applies the exact `to` vector at rampEnd's preceding step and holds it thereafter.
  for (let i = 1; i <= events; i++) {
    const next = i === events ? null : ramp.rampStartTick + Math.round((span * i) / events);
    stages.push(stageAt(i / events, next));
  }

  const spec = {
    label: `${ramp.label} [staircase ${events} events over ${ramp.rampStartTick}..${ramp.rampEndTick}]`,
    stages,
  };
  writeFileSync(resolve(outPath), JSON.stringify(spec, null, 1));
  console.log(`${outPath}: ${events} events -> ${stages.length} stages`);
}

run();
