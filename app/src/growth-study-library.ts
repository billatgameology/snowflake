export interface GrowthStudyEntry {
  id: string;
  label: string;
  habit: string;
  source: "fleet" | "run-b" | "named-direct" | "named-compose";
  sourcePath?: string;
  sourceSha256: string;
  eventCount: number;
  finalTick: number;
  terminationReason: string;
  available?: boolean;
  previewAvailable?: boolean;
  browseShape?: GrowthShape;
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

export function growthStudyCollection(entry: GrowthStudyEntry): "named" | "original" {
  return entry.source.startsWith("named-") ? "named" : "original";
}

export type GrowthShape = "dendrites" | "plates" | "columns" | "other";
/** Navigation buckets from catalog names, not a scientific morphology classification. */
export function growthStudyShape(entry: GrowthStudyEntry): GrowthShape {
  if (entry.browseShape) return entry.browseShape;
  const words = `${entry.label} ${entry.habit}`.toLowerCase();
  if (/dendrit|fern/u.test(words)) return "dendrites";
  if (/column|needle|sheath/u.test(words)) return "columns";
  if (/plate|star|stellar|sectored|triang|planar/u.test(words)) return "plates";
  return "other";
}

export function orderGrowthEntries(entries: GrowthStudyEntry[]): GrowthStudyEntry[] {
  const order: Record<GrowthShape, number> = { dendrites: 0, plates: 1, columns: 2, other: 3 };
  const rank = (entry: GrowthStudyEntry) => (growthStudyCollection(entry) === "named" ? 0 : 10)
    + order[growthStudyShape(entry)] + (entry.source === "named-compose" ? 0.5 : 0);
  return [...entries].sort((a, b) => rank(a) - rank(b));
}

/** An oblique view exposes cavities/caps that an end-on or exact side view hides. */
export function growthStudyTilt(entry: GrowthStudyEntry | null): number | undefined {
  if (entry?.source !== "named-direct") return undefined;
  return ["Simple Prisms", "Solid Columns", "Sheaths", "Scrolls on Plates", "Hollow Columns", "Cups",
    "Columns on Plates", "Capped Columns", "Split Plates & Stars", "Isolated Bullets", "Capped Bullets",
    "Double Plates", "Hollow Plates"].includes(entry.habit) ? 55 * Math.PI / 180 : undefined;
}

export function growthStudyLabel(entry: GrowthStudyEntry): string {
  return entry.habit === "planar" || entry.label.toLowerCase().includes(entry.habit.toLowerCase())
    ? entry.label : `${entry.label} · ${entry.habit}`;
}
