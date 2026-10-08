import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { float64SmootherDriftAbsLimit, type RelaxationReport, type SurfaceReport } from "@vcc/solver-cpu";
import { validateLKStepEvidence } from "./gate2b-validation.ts";
import type { DiscoveryRow, DiscoveryTerminalResult } from "./post-phase10-discovery.ts";

interface Cycle {
  rowId: string;
  cycle: number;
  relaxation: RelaxationReport;
  surface: SurfaceReport;
  simTimeSeconds: number;
  extent: number;
  attachedCount: number;
  symmetryError: number;
  attachmentEventD6h: boolean;
  timelineEvent?: unknown;
  basalWidthObservation?: { simTimeSecondsBeforeUpdate: number };
}

/** Operational coverage inventory. It does not replace track-specific morphology analysis. */
export function summarizeFirstBatchRow(directory: string) {
  const spec = JSON.parse(readFileSync(resolve(directory, "spec.json"), "utf8")) as { row: DiscoveryRow };
  const row = spec.row;
  const errors: string[] = [];
  const result = existsSync(resolve(directory, "result.json"))
    ? JSON.parse(readFileSync(resolve(directory, "result.json"), "utf8")) as DiscoveryTerminalResult : null;
  const exit = existsSync(resolve(directory, "exit.json"))
    ? JSON.parse(readFileSync(resolve(directory, "exit.json"), "utf8")) as { exitCode: number | null; signal: string | null } : null;
  const events: Cycle[] = [];
  // Complete hexagonal layers: 1 + 6 * (1 + ... + radius), with 2*radius+1 axial layers.
  const radius = Math.floor((row.dimsN - 1) / 2);
  const activeCells = (1 + 3 * radius * (radius + 1)) * (2 * radius + 1);
  let sigmaInfinity = row.sigmaInfinity;
  const eventsPath = resolve(directory, "events.jsonl");
  if (existsSync(eventsPath)) {
    for (const line of readFileSync(eventsPath, "utf8").split(/\r?\n/).filter(Boolean)) {
      try {
        const event = JSON.parse(line) as Cycle;
        if (event.rowId !== row.id || event.cycle !== events.length + 1) throw new Error("event identity/order mismatch");
        if (!event.surface || !event.relaxation) throw new Error("incomplete interface update");
        if (!Number.isFinite(event.simTimeSeconds) || event.simTimeSeconds < (events.at(-1)?.simTimeSeconds ?? 0)) {
          throw new Error("invalid physical-time sequence");
        }
        if (!Number.isSafeInteger(event.extent) || event.extent < 1 ||
            !Number.isSafeInteger(event.attachedCount) || event.attachedCount < 1 ||
            event.symmetryError !== 0 || event.attachmentEventD6h !== true) {
          throw new Error("invalid geometry/symmetry record");
        }
        const validated = validateLKStepEvidence(event.relaxation, event.surface, 1e-9, 1e-7,
          "aggregate-hv-g1h1-v6", float64SmootherDriftAbsLimit(activeCells, sigmaInfinity));
        if (validated.maxKineticFillIncrement > row.cflFill + 1e-12) throw new Error("kinetic fill exceeds registered CFL");
        events.push(event);
        if (event.timelineEvent !== undefined && row.timelineEvent !== undefined) sigmaInfinity = row.timelineEvent.sigmaInfinity;
      } catch (error) {
        errors.push(error instanceof Error ? error.message : String(error));
        break; // Only the consecutive completed prefix is usable.
      }
    }
  }
  const last = events.at(-1);
  const event = events.find((entry) => entry.timelineEvent !== undefined);
  if (result !== null) {
    if (result.rowId !== row.id || result.cycles !== events.length ||
        (last !== undefined && (result.simTimeSeconds !== last.simTimeSeconds || result.extent !== last.extent ||
          result.attachedCount !== last.attachedCount))) errors.push("terminal result disagrees with event prefix");
    errors.push(...result.integrityErrors);
  }
  const endpoint = result?.stopReason === "size-target" && last !== undefined &&
    last.extent >= row.targetExtent && errors.length === 0 && exit?.exitCode === 0 && exit.signal === null &&
    (row.timelineEvent === undefined || event !== undefined);
  const censored = result === null || result.stopReason === "wall-budget" || result.stopReason === "step-cap";
  return {
    rowId: row.id,
    directory,
    disposition: endpoint ? "size-endpoint" : errors.length > 0 ? "invalid" : censored ? "unresolved-prefix" : "failed",
    stopReason: result?.stopReason ?? "no-terminal-result",
    exitCode: exit?.exitCode ?? null,
    completedUpdates: events.length,
    physicalTimeSeconds: last?.simTimeSeconds ?? 0,
    extent: last?.extent ?? null,
    timelineEventTimeSeconds: event?.simTimeSeconds ?? null,
    postEventSeconds: event === undefined || last === undefined ? null : last.simTimeSeconds - event.simTimeSeconds,
    cutoffReached: row.experimentalBasalWidthHistory === undefined ? null :
      events.some((entry) => entry.simTimeSeconds >= row.experimentalBasalWidthHistory!.cutoffSeconds),
    postCutoffUpdateObserved: row.experimentalBasalWidthHistory === undefined ? null : events.some((entry) =>
      (entry.basalWidthObservation?.simTimeSecondsBeforeUpdate ?? -Infinity) >= row.experimentalBasalWidthHistory!.cutoffSeconds),
    postUpdateSizeCrossings: (row.spatialSampleExtents ?? []).map((extent) => {
      const crossing = events.find((entry) => entry.extent >= extent);
      return { extent, cycle: crossing?.cycle ?? null, physicalTimeSeconds: crossing?.simTimeSeconds ?? null };
    }),
    errors,
  };
}

export function summarizeFirstBatch(directory: string) {
  const root = resolve(directory);
  const rowsDirectory = resolve(root, "rows");
  const campaignPath = resolve(root, "campaign.json");
  const expected = existsSync(campaignPath)
    ? (JSON.parse(readFileSync(campaignPath, "utf8")) as { rows: DiscoveryRow[] }).rows.map((row) => row.id) : [];
  const present = existsSync(rowsDirectory) ? readdirSync(rowsDirectory, { withFileTypes: true })
    .filter((entry) => entry.isDirectory()).map((entry) => entry.name) : [];
  const rows = [...new Set([...expected, ...present])].sort().map((id) => {
      const path = resolve(rowsDirectory, id);
      if (!existsSync(resolve(path, "spec.json"))) return {
        rowId: id, directory: path, disposition: "unresolved-prefix", errors: ["no row spec: worker may not have started"],
      };
      return summarizeFirstBatchRow(path);
    });
  const summary = {
    schema: "hil-bld-first-batch-summary-v1",
    generatedAt: new Date().toISOString(),
    interpretation: "Operational coverage only; capped or unobserved contrasts remain unresolved. Compare physical-time brackets in subsequent track analysis.",
    rows,
  };
  writeFileSync(resolve(root, "summary.json"), `${JSON.stringify(summary, null, 2)}\n`);
  return summary;
}
