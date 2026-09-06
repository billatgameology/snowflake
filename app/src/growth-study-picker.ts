import { filterGrowthEntries, growthStudyCollection, growthStudyLabel, type GrowthStudyEntry, type GrowthStudyLibrary } from "./growth-study-library.ts";

export async function installGrowthPicker(load: (entry: GrowthStudyEntry) => Promise<void>): Promise<void> {
  const select = document.querySelector<HTMLSelectElement>("#crystal")!;
  const search = document.querySelector<HTMLInputElement>("#crystal-search")!;
  const collection = document.querySelector<HTMLSelectElement>("#collection")!;
  const previous = document.querySelector<HTMLButtonElement>("#previous-crystal")!;
  const next = document.querySelector<HTMLButtonElement>("#next-crystal")!;
  const response = await fetch(new URL("./growth-studies/index.json", document.baseURI));
  if (!response.ok) throw new Error("The growth library is unavailable. Reload this page to try again.");
  const library = await response.json() as GrowthStudyLibrary;
  if (library.format !== "growth-study-library-v1" || !Array.isArray(library.entries)) throw new Error("Unrecognized growth library");
  const available = library.entries.filter(entry => entry.available);
  let current = new URL(location.href).searchParams.get("crystal") ?? library.defaultId;
  if (!available.some(entry => entry.id === current)) current = library.defaultId;
  if (!available.some(entry => entry.id === current)) current = available[0]?.id ?? "";
  const namedCount = available.filter(entry => growthStudyCollection(entry) === "named").length;
  document.querySelector("#library-note")!.textContent = `${available.length} animations · ${namedCount} named catalogue + ${available.length - namedCount} earlier library`;
  document.querySelector("#excluded")!.textContent = library.excluded.map(entry => `${entry.id}: ${entry.reason}`).join(" ");
  const initialCollection = new URL(location.href).searchParams.get("collection");
  if (initialCollection === "named" || initialCollection === "original") collection.value = initialCollection;
  if (!available.some(entry => entry.id === current && (collection.value === "all" || growthStudyCollection(entry) === collection.value))) collection.value = "all";
  const filtered = (entries: GrowthStudyEntry[]): GrowthStudyEntry[] => filterGrowthEntries(entries.filter(entry => collection.value === "all" || growthStudyCollection(entry) === collection.value), search.value);
  const matches = (): GrowthStudyEntry[] => filtered(available);
  function refresh(): void {
    const entries = filtered(library.entries);
    select.replaceChildren();
    if (!entries.some(entry => entry.id === current && entry.available)) {
      const prompt = new Option(entries.length ? "Select a matching crystal…" : "No matching crystals", "");
      prompt.disabled = true; prompt.selected = true; select.add(prompt);
    }
    for (const group of ["named", "original"] as const) {
      const grouped = entries.filter(entry => growthStudyCollection(entry) === group);
      if (!grouped.length) continue;
      const optgroup = document.createElement("optgroup");
      optgroup.label = group === "named" ? "Named snow-crystal catalogue" : "Earlier growth library";
      for (const entry of grouped) {
        const option = new Option(`${growthStudyLabel(entry)}${entry.source === "named-compose" ? " · Composed" : ""}${entry.available ? "" : " — source unavailable"}`, entry.id);
        option.disabled = !entry.available; option.selected = entry.available === true && entry.id === current; optgroup.append(option);
      }
      select.append(optgroup);
    }
    select.disabled = matches().length === 0;
    previous.disabled = next.disabled = matches().length < 2;
    document.querySelector("#search-count")!.textContent = `${matches().length} ${search.value ? "matches" : "animations"}`;
  }
  const choose = async (id: string): Promise<void> => {
    const entry = available.find(item => item.id === id);
    if (!entry) return;
    current = id;
    const url = new URL(location.href); url.searchParams.set("crystal", id); history.replaceState(null, "", url);
    refresh();
    await load(entry);
  };
  const move = (direction: number): void => {
    const entries = matches();
    if (!entries.length) return;
    const index = entries.findIndex(entry => entry.id === current);
    void choose(entries[(index + direction + entries.length) % entries.length]!.id);
  };
  search.oninput = refresh;
  collection.onchange = () => {
    const url = new URL(location.href); url.searchParams.set("collection", collection.value); history.replaceState(null, "", url);
    refresh();
  };
  select.onchange = () => { void choose(select.value); };
  previous.onclick = () => move(-1);
  next.onclick = () => move(1);
  document.querySelector<HTMLButtonElement>("#retry")!.onclick = () => { void choose(current); };
  refresh();
  if (!current) throw new Error("No growth replays are available on this host.");
  await choose(current);
}
