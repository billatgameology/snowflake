/** BLD saved-row selection. Complete frozen-cohort contrasts remain a separate results step. */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { BLD_GROWTH_DYNAMICS_OCT21_ROWS } from "./bld-growth-dynamics-oct21-roster.ts";
import { readGrowthDynamicsRow } from "./hil-growth-dynamics-oct21-readout.ts";
import type { DiscoveryRow } from "./post-phase10-discovery.ts";

export type BldReadoutKind = "warm" | "facet" | "cold";
interface Input { path: string; bytes: number; sha256: string }
type SavedReadout = ReturnType<typeof readGrowthDynamicsRow>;
interface SelectedRow {
  rowId: string | null; directory: string; kind: BldReadoutKind; row: DiscoveryRow | null;
  status: "missing" | "pending" | "invalid" | "unresolved-terminal" | "size-endpoint";
  reason: string | null; inputs: Input[]; scientificReadout: SavedReadout | null;
}
const hash = (bytes: Buffer) => createHash("sha256").update(bytes).digest("hex");

function requireKind(row: DiscoveryRow, kind: BldReadoutKind) {
  assert.equal(row.timelineEvent, undefined, `${row.id}: BLD readout excludes environment histories`);
  if (kind === "warm") {
    assert(row.tempC === -4.5 || row.tempC === -5, `${row.id}: not a registered warm temperature`);
    assert.equal(row.experimentalFacetDips, undefined, `${row.id}: facet intervention selected as warm`);
  } else {
    assert(row.experimentalFacetDips !== undefined, `${row.id}: ${kind} selection requires explicit facet arm`);
    assert.equal(row.experimentalBasalWidthCells, undefined, `${row.id}: width intervention selected as ${kind}`);
    assert(kind === "cold" ? row.tempC <= -10 : row.tempC > -10,
      `${row.id}: ${kind} temperature selection mismatch`);
  }
}

/** Bind terminal input bytes even when a checked row is invalid; never read a live event stream. */
export function readBldGrowthDynamicsRow(directory: string, kind: BldReadoutKind,
  expected?: DiscoveryRow): SelectedRow {
  const base: SelectedRow = { rowId: expected?.id ?? null, directory: resolve(directory), kind,
    row: expected ?? null, status: "missing", reason: null, inputs: [], scientificReadout: null };
  const bind = (leaf: string) => {
    const path = resolve(directory, leaf), bytes = readFileSync(path);
    base.inputs.push({ path, bytes: bytes.length, sha256: hash(bytes) });
    return bytes;
  };
  if (!existsSync(resolve(directory, "spec.json")))
    return { ...base, reason: "No immutable row specification is available." };
  try {
    const spec = JSON.parse(bind("spec.json").toString("utf8")) as { row: DiscoveryRow };
    assert(spec.row !== null && typeof spec.row === "object" && typeof spec.row.id === "string",
      "missing row identity in immutable specification");
    base.rowId = expected?.id ?? spec.row.id; base.row = expected ?? spec.row;
    if (expected !== undefined) assert.deepEqual(spec.row, expected,
      `${expected.id}: immutable registered row mismatch`);
    requireKind(spec.row, kind);
    if (!["result.json", "exit.json"].every((leaf) => existsSync(resolve(directory, leaf))))
      return { ...base, status: "pending", reason: "No complete terminal result and exit; live events were not read." };
    for (const leaf of ["result.json", "exit.json", "events.jsonl", "host.json"])
      if (existsSync(resolve(directory, leaf))) bind(leaf);
    const scientificReadout = readGrowthDynamicsRow(directory, expected ?? spec.row, { cavity: kind === "warm" });
    const invalid = "checked" in scientificReadout && scientificReadout.checked?.disposition === "invalid";
    return { ...base, status: invalid ? "invalid" : scientificReadout.status as SelectedRow["status"],
      reason: invalid ? scientificReadout.checked!.errors.join("; ") :
        "reason" in scientificReadout ? scientificReadout.reason ?? null : null, scientificReadout };
  } catch (error) {
    return { ...base, status: "invalid", reason: error instanceof Error ? error.message : String(error) };
  }
}

function packageReport(mode: "campaign" | "retained", rows: SelectedRow[]) {
  const identities = rows.flatMap((row) => row.rowId === null ? [] : [row.rowId]);
  assert.equal(new Set(identities).size, identities.length, "duplicate selected row IDs");
  assert.equal(new Set(rows.map((row) => row.directory)).size, rows.length, "duplicate selected directories");
  const selected = (status: SelectedRow["status"]) => rows.filter((row) => row.status === status)
    .map((row) => ({ rowId: row.rowId, directory: row.directory }));
  return { schema: "bld-growth-dynamics-oct21-row-readout-v1", createdAt: new Date().toISOString(), mode,
    scope: "Individual saved-row reconstruction only; no frozen-cohort comparison or physical validation.",
    definitions: {
      age: "Fractions of each individual terminal age with adjacent-event brackets; these are not common cohort ages.",
      extent: "Largest occupied lattice-coordinate extent includes end cells; center span is (extent - 1) times dxUm.",
      occupancy: "Occupied sites and cell volume exclude partial fill; neither is total accreted mass.",
      warm: "Per-row open intervals, width exposure and size brackets; matched persistence contrasts remain pending.",
      facet: "Independently reconstructed initial and terminal spans/counts; no absent-arm contrasts or catch-up claim.",
      cold: "Terminal central-plane rings only; exact-tip plateaus and common-age comparisons remain pending.",
    },
    census: { requestedRows: rows.length, sizeEndpoints: selected("size-endpoint").length,
      missing: selected("missing"), pending: selected("pending"), invalid: selected("invalid"),
      unresolvedTerminal: selected("unresolved-terminal"),
      kinds: (["warm", "facet", "cold"] as const).map((kind) => ({ kind,
        requested: rows.filter((row) => row.kind === kind).length,
        sizeEndpoints: rows.filter((row) => row.kind === kind && row.status === "size-endpoint").length })) },
    frozenCohortComparisons: { available: false,
      reason: mode === "retained" ? "Retained identities are exercises and historical inputs, not new BLD results." :
        "This launch slice reconstructs individuals; complete cohorts, including bound historical controls, remain pending.",
      pending: ["W1 16-member and W2 10-member temperature cohorts, warm switch windows",
        "W3 four-member pressure/forcing cohorts", "F0 six-member and F1-F3 eight-member common-age cohorts",
        "C0 twelve-member exact-tip-8/9 plateaus and common-age cohort"] }, rows };
}

export function readBldGrowthDynamicsCampaign(directory: string) {
  return packageReport("campaign", BLD_GROWTH_DYNAMICS_OCT21_ROWS.map(({ row }) => {
    const block = row.id.split("-")[2];
    const kind: BldReadoutKind = block.startsWith("w") ? "warm" : block === "c0" ? "cold" : "facet";
    return readBldGrowthDynamicsRow(resolve(directory, "rows", row.id), kind, row);
  }));
}

export function readRetainedBldGrowthDynamicsRows(selections: readonly { kind: BldReadoutKind; directory: string }[]) {
  assert(selections.length > 0, "retained mode needs explicit kind=row-directory selections");
  return packageReport("retained", selections.map(({ kind, directory }) => readBldGrowthDynamicsRow(directory, kind)));
}

if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const [mode, first, second, ...rest] = process.argv.slice(2);
  if ((mode === "campaign" && first && second && rest.length === 0) || (mode === "retained" && first && second)) {
    const output = resolve(mode === "campaign" ? second : first);
    const report = mode === "campaign" ? readBldGrowthDynamicsCampaign(first) :
      readRetainedBldGrowthDynamicsRows([second, ...rest].map((argument) => {
        const separator = argument.indexOf("="), kind = argument.slice(0, separator);
        assert(separator > 0 && ["warm", "facet", "cold"].includes(kind) && argument.length > separator + 1,
          "retained selection must be warm=<row-directory>, facet=<row-directory> or cold=<row-directory>");
        return { kind: kind as BldReadoutKind, directory: argument.slice(separator + 1) };
      }));
    mkdirSync(dirname(output), { recursive: true });
    writeFileSync(output, JSON.stringify({ ...report, command: process.argv }, null, 2) + "\n", { flag: "wx" });
    console.log(JSON.stringify({ output, sha256: hash(readFileSync(output)), census: report.census,
      frozenCohortComparisonsAvailable: false }));
    if (report.census.invalid.length > 0) process.exitCode = 1;
  } else throw new Error("Usage: node runner/src/bld-growth-dynamics-oct21-readout.ts campaign <root> <new-output.json> | retained <new-output.json> <warm|facet|cold>=<row-directory> [...]");
}
