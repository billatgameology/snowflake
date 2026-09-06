export interface GrowthStudyEntry {
  id: string;
  label: string;
  habit: string;
  source: "fleet" | "run-b";
  sourceSha256: string;
  eventCount: number;
  finalTick: number;
  terminationReason: string;
  available?: boolean;
}
export interface GrowthStudyLibrary {
  format: "growth-study-library-v1";
  defaultId: string;
  entries: GrowthStudyEntry[];
  excluded: Array<{ id: string; reason: string }>;
}

export function filterGrowthEntries(entries: GrowthStudyEntry[], search: string): GrowthStudyEntry[] {
  const terms = search.toLowerCase().trim().split(/\s+/u);
  return entries.filter(entry => terms.every(term => `${entry.id} ${entry.label} ${entry.habit}`.toLowerCase().includes(term)));
}

export function growthStudyLabel(entry: GrowthStudyEntry): string {
  return entry.habit === "planar" || entry.label.toLowerCase().includes(entry.habit.toLowerCase())
    ? entry.label : `${entry.label} · ${entry.habit}`;
}
