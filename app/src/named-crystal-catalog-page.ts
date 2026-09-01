import "./named-crystal-catalog.css";

interface GalleryVariant {
  readonly entryId: string;
  readonly slot: string;
  readonly variation: { readonly driver: string; readonly value: number; readonly unit: string };
  readonly webPayloadBytes: number;
  readonly previewUrl: string;
  readonly sceneUrl: string;
}

interface GalleryEntry {
  readonly id: string;
  readonly name: string;
  readonly route: "gg" | "gg-plus" | "compose" | "excluded-new-physics";
  readonly note: string;
  readonly exclusionReason: string | null;
  readonly variants: readonly GalleryVariant[];
}

interface GalleryIndex {
  readonly taxonomy: { readonly name: string; readonly guideUrl: string; readonly chartUrl: string };
  readonly webPayloadLimitBytes: number;
  readonly counts: {
    readonly families: number;
    readonly includedFamilies: number;
    readonly variants: number;
    readonly directFamilies: number;
    readonly composeFamilies: number;
    readonly excludedFamilies: number;
  };
  readonly entries: readonly GalleryEntry[];
}

const app = document.querySelector<HTMLElement>("#catalog-app");
if (app === null) throw new Error("catalog app root is missing");

const routeLabel = (route: GalleryEntry["route"]): string => {
  if (route === "compose") return "Compose";
  if (route === "excluded-new-physics") return "Excluded: new physics";
  return route === "gg" ? "G-G" : "G-G+";
};

const bytes = (value: number): string => `${(value / 1_000_000).toFixed(2)} MB`;
const titleCase = (value: string): string => value.replaceAll("-", " ");

const createModal = (): { readonly open: (entry: GalleryEntry, variant: GalleryVariant) => void } => {
  const dialog = document.createElement("dialog");
  dialog.className = "player-dialog";
  dialog.innerHTML = `
    <div class="player-head">
      <div><p class="eyebrow" data-player-route></p><h2 data-player-title></h2></div>
      <button type="button" class="close-player" aria-label="Close animation">Close</button>
    </div>
    <iframe title="Snow-crystal growth animation" allow="fullscreen"></iframe>`;
  document.body.appendChild(dialog);
  const frame = dialog.querySelector<HTMLIFrameElement>("iframe");
  const title = dialog.querySelector<HTMLElement>("[data-player-title]");
  const route = dialog.querySelector<HTMLElement>("[data-player-route]");
  const close = dialog.querySelector<HTMLButtonElement>(".close-player");
  if (frame === null || title === null || route === null || close === null) throw new Error("player modal is incomplete");
  const clear = (): void => { frame.src = "about:blank"; };
  close.addEventListener("click", () => dialog.close());
  dialog.addEventListener("close", clear);
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });
  return {
    open(entry, variant) {
      title.textContent = `${entry.name} — ${titleCase(variant.slot)}`;
      route.textContent = entry.route === "compose"
        ? "Composed visualization from accepted G-G recordings"
        : "Direct accepted G-G/G-G+ growth recording";
      const query = new URLSearchParams({ growthScene: variant.sceneUrl, look: "bold-ice", ui: "1" });
      frame.src = `/spike-gg-realism.html?${query.toString()}`;
      dialog.showModal();
    },
  };
};

const render = (index: GalleryIndex): void => {
  const modal = createModal();
  app.innerHTML = `
    <header class="hero">
      <p class="eyebrow">The Virtual Cloud Chamber</p>
      <h1>Named snow-crystal animation catalog</h1>
      <p class="lede">Every type in the selected 35-name Libbrecht catalog boundary. Each included type has three accepted growth variations; every web payload stays below 20 MB.</p>
      <div class="stats" aria-label="Catalog totals">
        <span><strong>${index.counts.families}</strong> named types</span>
        <span><strong>${index.counts.variants}</strong> animations</span>
        <span><strong>${index.counts.directFamilies}</strong> direct G-G/G-G+</span>
        <span><strong>${index.counts.composeFamilies}</strong> Compose</span>
        <span><strong>${index.counts.excludedFamilies}</strong> new-physics exclusions</span>
      </div>
      <p class="source">Taxonomy: <a href="${index.taxonomy.guideUrl}" target="_blank" rel="noreferrer">${index.taxonomy.name}</a> · <a href="${index.taxonomy.chartUrl}" target="_blank" rel="noreferrer">classification chart</a></p>
    </header>
    <section class="controls" aria-label="Catalog filters">
      <label><span>Find a crystal</span><input type="search" placeholder="Needles, plates, rosettes…" data-search /></label>
      <div class="filter-row" role="group" aria-label="Filter by production route">
        <button class="filter active" data-filter="all">All 35</button>
        <button class="filter" data-filter="direct">Direct</button>
        <button class="filter" data-filter="compose">Compose</button>
        <button class="filter" data-filter="excluded">Excluded</button>
      </div>
    </section>
    <p class="visible-count" data-visible-count></p>
    <section class="families" data-families></section>`;

  const families = app.querySelector<HTMLElement>("[data-families]");
  const search = app.querySelector<HTMLInputElement>("[data-search]");
  const count = app.querySelector<HTMLElement>("[data-visible-count]");
  if (families === null || search === null || count === null) throw new Error("catalog controls are incomplete");
  let activeFilter = "all";

  const draw = (): void => {
    const query = search.value.trim().toLowerCase();
    const visible = index.entries.filter((entry) => {
      const routeMatch = activeFilter === "all"
        || (activeFilter === "direct" && (entry.route === "gg" || entry.route === "gg-plus"))
        || (activeFilter === "compose" && entry.route === "compose")
        || (activeFilter === "excluded" && entry.route === "excluded-new-physics");
      return routeMatch && `${entry.name} ${entry.note}`.toLowerCase().includes(query);
    });
    count.textContent = `Showing ${visible.length} of ${index.counts.families} named types`;
    families.replaceChildren(...visible.map((entry) => {
      const section = document.createElement("article");
      section.className = `family family-${entry.route}`;
      section.dataset.familyId = entry.id;
      section.innerHTML = `
        <div class="family-heading">
          <div><p class="eyebrow">${routeLabel(entry.route)}</p><h2>${entry.name}</h2></div>
          <p>${entry.exclusionReason ?? entry.note}</p>
        </div>
        <div class="variants"></div>`;
      const grid = section.querySelector<HTMLElement>(".variants");
      if (grid === null) throw new Error("variant grid is missing");
      if (entry.variants.length === 0) {
        grid.innerHTML = `<div class="exclusion"><strong>Not generated</strong><span>This form needs physics outside G-G+ and Compose scope.</span></div>`;
      } else {
        for (const variant of entry.variants) {
          const card = document.createElement("button");
          card.type = "button";
          card.className = "variant-card";
          card.dataset.entryId = variant.entryId;
          card.innerHTML = `
            <img src="${variant.previewUrl}" alt="Final preview of ${entry.name}, ${variant.slot} variation" loading="lazy" />
            <span class="card-copy">
              <span class="slot">${titleCase(variant.slot)}</span>
              <span>${titleCase(variant.variation.driver)}: <strong>${variant.variation.value} ${variant.variation.unit}</strong></span>
              <span class="payload">Web payload ${bytes(variant.webPayloadBytes)} · Play animation</span>
            </span>`;
          card.addEventListener("click", () => modal.open(entry, variant));
          grid.appendChild(card);
        }
      }
      return section;
    }));
  };

  search.addEventListener("input", draw);
  for (const button of app.querySelectorAll<HTMLButtonElement>("[data-filter]")) {
    button.addEventListener("click", () => {
      activeFilter = button.dataset.filter ?? "all";
      for (const candidate of app.querySelectorAll("[data-filter]")) candidate.classList.toggle("active", candidate === button);
      draw();
    });
  }
  draw();
};

fetch("/named-crystal-catalog-api/index.json")
  .then(async (response) => {
    if (!response.ok) throw new Error(`catalog endpoint returned ${response.status}`);
    return response.json() as Promise<GalleryIndex>;
  })
  .then(render)
  .catch((error: unknown) => {
    app.innerHTML = `<p class="load-error">The local catalog could not be loaded: ${error instanceof Error ? error.message : String(error)}</p>`;
  });
