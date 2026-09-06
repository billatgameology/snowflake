import { growthStudyCollection, growthStudyLabel, growthStudyShape, type GrowthShape, type GrowthStudyEntry, type GrowthStudyLibrary } from "./growth-study-library.ts";
import "./growth-study-gallery.css";

export function createGrowthGallery(library: GrowthStudyLibrary, options: {
  choose: (id: string) => Promise<void>;
  refresh: () => void;
  onOpen: (open: boolean) => void;
}) {
  const dialog = document.querySelector<HTMLDialogElement>("#crystal-browser")!;
  const browse = document.querySelector<HTMLButtonElement>("#browse-crystals")!;
  const grid = document.querySelector<HTMLElement>("#gallery-grid")!;
  const results = document.querySelector<HTMLElement>("#gallery-results")!;
  const search = document.querySelector<HTMLInputElement>("#crystal-search")!;
  const collection = document.querySelector<HTMLSelectElement>("#collection")!;
  const empty = document.querySelector<HTMLElement>("#gallery-empty")!;
  const collectionButtons = [...dialog.querySelectorAll<HTMLButtonElement>("[data-collection]")];
  const shapeButtons = [...dialog.querySelectorAll<HTMLButtonElement>("[data-shape]")];
  const cards = new Map<string, HTMLButtonElement>();
  let shape: GrowthShape | "all" = "all";
  let signature = "";
  let browsing = false;
  const finishClose = () => {
    if (!browsing) return;
    browsing = false;
    document.body.classList.remove("browsing-crystals");
    options.onOpen(false);
    browse.focus({ preventScroll: true });
  };
  const close = () => { dialog.close(); finishClose(); };
  const open = () => {
    if (dialog.open) return;
    browsing = true;
    dialog.showModal();
    options.onOpen(true);
    document.body.classList.add("browsing-crystals");
    (innerWidth > 700 ? search : document.querySelector<HTMLButtonElement>("#gallery-close")!).focus({ preventScroll: true });
  };
  browse.onclick = open;
  document.querySelector<HTMLButtonElement>("#gallery-close")!.onclick = close;
  dialog.addEventListener("close", () => { if (!dialog.open) finishClose(); });
  dialog.addEventListener("cancel", event => { event.preventDefault(); close(); });
  dialog.addEventListener("keydown", event => {
    if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); close(); return; }
    if (event.key !== "Tab") return;
    const controls = [...dialog.querySelectorAll<HTMLElement>("button:not(:disabled), input:not(:disabled), [tabindex='0']")].filter(el => el.getClientRects().length > 0);
    const first = controls[0], last = controls.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  });
  dialog.onclick = event => {
    const rect = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) close();
  };
  for (const button of collectionButtons) {
    const value = button.dataset.collection!;
    const count = library.entries.filter(entry => entry.available && (value === "all" || growthStudyCollection(entry) === value)).length;
    button.querySelector("span")!.textContent = String(count);
    button.onclick = () => { collection.value = value; collection.dispatchEvent(new Event("change")); };
  }
  for (const button of shapeButtons) {
    button.onclick = () => { shape = button.dataset.shape as typeof shape; options.refresh(); };
  }
  document.querySelector<HTMLButtonElement>("#gallery-reset")!.onclick = () => {
    search.value = ""; shape = "all"; collection.value = "all";
    collection.dispatchEvent(new Event("change"));
    search.focus();
  };

  function card(entry: GrowthStudyEntry): HTMLButtonElement {
    const button = document.createElement("button");
    button.type = "button"; button.className = "crystal-card"; button.dataset.crystal = entry.id;
    button.disabled = !entry.available;
    button.setAttribute("aria-label", `Play ${growthStudyLabel(entry)}${entry.source === "named-compose" ? ", composed visualization" : ""}${entry.available ? "" : ", source unavailable"}`);
    const preview = document.createElement("span"); preview.className = "crystal-preview";
    const fallback = document.createElement("span"); fallback.className = "preview-fallback";
    fallback.textContent = "Preview unavailable";
    preview.append(fallback);
    if (entry.previewAvailable) {
      const image = document.createElement("img");
      image.src = new URL(`./growth-studies/${entry.id}.png`, document.baseURI).href;
      image.alt = ""; image.width = 384; image.height = 320; image.loading = "lazy"; image.decoding = "async";
      image.onload = () => { preview.classList.add("preview-loaded"); };
      image.onerror = () => { image.remove(); preview.classList.remove("preview-loaded"); };
      preview.append(image);
    }
    const name = document.createElement("span"); name.className = "crystal-card-name";
    name.textContent = growthStudyLabel(entry);
    const meta = document.createElement("span"); meta.className = "crystal-card-meta";
    const kind = document.createElement("span");
    kind.textContent = !entry.available ? "Source unavailable" : entry.source === "named-compose" ? "Composed" : growthStudyCollection(entry) === "named" ? "Named catalogue" : "Earlier library";
    const action = document.createElement("span"); action.className = "crystal-card-action";
    action.textContent = "Play ↗";
    meta.append(kind, action);
    button.append(preview, name, meta);
    button.onclick = () => { void options.choose(entry.id); close(); };
    return button;
  }

  return {
    open,
    get isOpen() { return dialog.open; },
    matches: (entry: GrowthStudyEntry) => shape === "all" || growthStudyShape(entry) === shape,
    render(entries: GrowthStudyEntry[], current: string) {
      const next = entries.map(entry => entry.id).join("|");
      if (signature !== next || cards.size === 0) {
        const fragment = document.createDocumentFragment(); cards.clear();
        for (const entry of entries) { const button = card(entry); cards.set(entry.id, button); fragment.append(button); }
        grid.replaceChildren(fragment); results.scrollTop = 0; signature = next;
      }
      for (const [id, button] of cards) {
        button.setAttribute("aria-pressed", String(id === current));
        button.querySelector(".crystal-card-action")!.textContent = id === current ? "Selected ✓" : "Play ↗";
      }
      for (const button of collectionButtons) button.setAttribute("aria-pressed", String(button.dataset.collection === collection.value));
      for (const button of shapeButtons) button.setAttribute("aria-pressed", String(button.dataset.shape === shape));
      const playable = entries.filter(entry => entry.available).length;
      document.querySelector("#gallery-count")!.textContent = `${entries.length} ${entries.length === 1 ? "animation" : "animations"}${playable === entries.length ? "" : ` · ${playable} available here`}`;
      empty.hidden = entries.length !== 0;
      const selected = library.entries.find(entry => entry.id === current);
      document.querySelector("#browse-selected")!.textContent = selected ? growthStudyLabel(selected) : "Explore the library";
      browse.disabled = false;
    },
  };
}
