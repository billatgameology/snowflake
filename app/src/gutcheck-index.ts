// Gut-check spike index page renderer: fetches the generated index.json from whichever of
// the two known locations answers with JSON (see INDEX_URLS) and renders section galleries.

import {
  animationQueueIdFromName,
  DEFAULT_ANIMATION_QUEUE_SETTINGS,
  parseAnimationQueueManifest,
  stringifyAnimationQueueManifest,
  type AnimationQueueItem,
  type AnimationQueueManifest,
} from "./gutcheck-animation-queue.ts";

interface IndexItem {
  label: string;
  href: string;
  image?: string;
  note?: string;
}
/** One crystal: its comparison image(s), then whatever else exists for the same crystal. */
interface CompareRow {
  label: string;
  comparisons: IndexItem[];
  viewers: IndexItem[];
  animation?: IndexItem;
  queue?: Omit<AnimationQueueItem, "label">;
}
interface IndexSection {
  title: string;
  note?: string;
  items: IndexItem[];
  rows?: CompareRow[];
}
interface IndexData {
  generated: string;
  root: string;
  sections: IndexSection[];
}

// Static-site bundles (scripts/gutcheck-build-site.ts) serve ./data/index.json next to the
// page; under the dev server, /gutcheck-index.json is out/gutcheck-gg-realism/index.json,
// mounted by the gutcheck-index-json plugin in app/vite.config.ts. Both are machine-neutral:
// this list used to end in the author's absolute macOS path, which no other checkout could
// load (2026-08-06 machine transfer).
const INDEX_URLS = ["./data/index.json", "/gutcheck-index.json"];
const QUEUE_ENDPOINT = "/gutcheck-animation-selection.json";
const QUEUE_STORAGE_KEY = "vcc.gutcheck.animationQueue.v1";

interface Lightbox {
  open: (index: number) => void;
}

/**
 * Full-screen image viewer over the page's gallery: click an image to open, click again
 * anywhere to close, ArrowLeft/ArrowRight (or the on-screen arrows) to page through the
 * whole set, Escape to close. `shots` is filled in as the galleries render, so it is read
 * at open time rather than captured here.
 */
function createLightbox(shots: ReadonlyArray<{ src: string; label: string }>): Lightbox {
  const root = document.createElement("div");
  root.className = "lightbox";
  root.hidden = true;
  root.setAttribute("role", "dialog");
  root.setAttribute("aria-modal", "true");
  root.setAttribute("aria-label", "image viewer");
  // Focusable so the arrow keys work straight after opening, with no extra click. -1 keeps
  // it out of the page's tab order while closed.
  root.tabIndex = -1;

  const img = document.createElement("img");
  const cap = document.createElement("div");
  cap.className = "lb-cap";
  const count = document.createElement("div");
  count.className = "lb-count";

  let current = 0;
  let opener: HTMLElement | null = null;

  const show = (index: number): void => {
    const shot = shots[index];
    if (shot === undefined) return;
    current = index;
    img.src = shot.src;
    img.alt = shot.label;
    cap.textContent = shot.label;
    count.textContent = `${index + 1} / ${shots.length}`;
    // Warm the neighbours so paging does not flash on these multi-MB renders.
    for (const near of [shots[index - 1], shots[index + 1]]) {
      if (near !== undefined) new Image().src = near.src;
    }
  };

  // Wraps at both ends: from the last image, "next" returns to the first.
  const step = (delta: number): void => {
    if (shots.length === 0) return;
    show((current + delta + shots.length) % shots.length);
  };

  const close = (): void => {
    root.hidden = true;
    document.body.style.overflow = "";
    // Drop the source so a huge image is not held decoded behind the closed overlay.
    img.removeAttribute("src");
    opener?.focus();
    opener = null;
  };

  const arrow = (dir: "prev" | "next", glyph: string): HTMLButtonElement => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `lb-nav lb-${dir}`;
    button.textContent = glyph;
    button.setAttribute("aria-label", dir === "prev" ? "previous image" : "next image");
    // Without this the click bubbles to the backdrop handler and closes the lightbox.
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      step(dir === "prev" ? -1 : 1);
    });
    return button;
  };

  root.append(arrow("prev", "‹"), img, cap, count, arrow("next", "›"));
  document.body.appendChild(root);

  root.addEventListener("click", close);
  root.addEventListener("keydown", (event) => {
    if (event.key === "ArrowRight") step(1);
    else if (event.key === "ArrowLeft") step(-1);
    else if (event.key === "Escape") close();
    else return;
    event.preventDefault();
  });

  return {
    open: (index: number): void => {
      opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      show(index);
      root.hidden = false;
      document.body.style.overflow = "hidden";
      root.focus();
    },
  };
}

/** A link rendered as a button: bold label, plus a dim second line when there is a note. */
function linkButton(item: IndexItem): HTMLAnchorElement {
  const a = document.createElement("a");
  a.href = item.href;
  a.target = "_blank";
  const main = document.createElement("span");
  main.textContent = item.label;
  a.appendChild(main);
  if (item.note !== undefined) {
    const sub = document.createElement("span");
    sub.className = "sub";
    sub.textContent = item.note;
    a.appendChild(sub);
    a.title = item.note;
  }
  return a;
}

/**
 * A gallery thumbnail wired to the lightbox. The href stays the raw file so ctrl/cmd/middle
 * click still opens it in a new tab; only a plain left click is intercepted. Registers the
 * image in `shots` so the arrow keys page through the page in document order.
 */
function thumbnail(
  item: IndexItem & { image: string },
  shots: Array<{ src: string; label: string }>,
  lightbox: Lightbox,
): HTMLAnchorElement {
  const a = document.createElement("a");
  a.href = item.href;
  a.target = "_blank";
  const img = document.createElement("img");
  img.loading = "lazy";
  img.src = item.image;
  img.alt = item.label;
  a.appendChild(img);
  const cap = document.createElement("div");
  cap.className = "cap";
  cap.textContent = item.label;
  a.appendChild(cap);
  const position = shots.length;
  shots.push({ src: item.image, label: item.label });
  a.addEventListener("click", (event) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey) return;
    event.preventDefault();
    lightbox.open(position);
  });
  return a;
}

/** Empty cell marker, so a missing interactive view or animation reads as a real absence. */
function emptyCell(text: string): HTMLDivElement {
  const div = document.createElement("div");
  div.className = "cell-empty";
  div.textContent = text;
  return div;
}

/**
 * The crystal-by-crystal table: comparison images, interactive views, animation. Built as a
 * three-column grid with one row per crystal, so the columns that are mostly empty read as
 * the inventory they are — three crystals open interactively, one has an animation.
 */
function renderRows(
  rows: CompareRow[],
  shots: Array<{ src: string; label: string }>,
  lightbox: Lightbox,
  selected: Set<string>,
  selectionChanged: (id: string, checked: boolean) => void,
): HTMLDivElement {
  const table = document.createElement("div");
  table.className = "rows";

  for (const heading of ["Comparison — ours vs target", "Interactive", "Animation"]) {
    const head = document.createElement("div");
    head.className = "rows-head";
    head.textContent = heading;
    table.appendChild(head);
  }

  for (const row of rows) {
    const first = document.createElement("div");
    first.className = "cell cell-compare";
    const name = document.createElement("div");
    name.className = "crystal";
    name.textContent = row.label;
    first.appendChild(name);
    if (row.queue !== undefined) {
      const selector = document.createElement("label");
      selector.className = "queue-select";
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = selected.has(row.queue.id);
      checkbox.dataset["queueId"] = row.queue.id;
      checkbox.addEventListener("change", () => selectionChanged(row.queue!.id, checkbox.checked));
      const text = document.createElement("span");
      text.textContent = "Select for animation";
      selector.append(checkbox, text);
      first.appendChild(selector);
      first.classList.toggle("is-selected", checkbox.checked);
      checkbox.addEventListener("change", () => first.classList.toggle("is-selected", checkbox.checked));
    }
    const strip = document.createElement("div");
    strip.className = "strip";
    for (const comparison of row.comparisons) {
      if (comparison.image === undefined) continue;
      // Same .card wrapper the plain galleries use, so both share the thumbnail styling.
      const card = document.createElement("div");
      card.className = "card";
      card.appendChild(thumbnail({ ...comparison, image: comparison.image }, shots, lightbox));
      strip.appendChild(card);
    }
    first.appendChild(strip);

    const second = document.createElement("div");
    second.className = "cell cell-links";
    if (row.viewers.length === 0) second.appendChild(emptyCell("—"));
    else for (const viewer of row.viewers) second.appendChild(linkButton(viewer));

    const third = document.createElement("div");
    third.className = "cell cell-links";
    if (row.animation === undefined) third.appendChild(emptyCell("—"));
    else third.appendChild(linkButton(row.animation));

    table.append(first, second, third);
  }
  return table;
}

async function main(): Promise<void> {
  const mainEl = document.getElementById("main");
  if (mainEl === null) return;
  // A 200 is not enough to accept a candidate: the dev server answers unknown paths with an
  // SPA fallback, so ./data/index.json (which only exists in a static bundle) comes back as
  // 200 text/html. Taking that as the index made response.json() throw and left a blank page
  // — the first location must be rejected on content type for the second to ever be tried.
  let response: Response | null = null;
  for (const url of INDEX_URLS) {
    try {
      const candidate = await fetch(url);
      if (candidate.ok && (candidate.headers.get("content-type") ?? "").includes("json")) {
        response = candidate;
        break;
      }
    } catch {
      /* try the next location */
    }
  }
  if (response === null) {
    mainEl.innerHTML =
      "<h1>GG gut check — output index</h1><p class='note'>index.json missing — run " +
      "<code>node scripts/gutcheck-build-index.ts</code> and reload.</p>";
    return;
  }
  const data = (await response.json()) as IndexData;
  mainEl.innerHTML = "<h1>GG gut check — output index</h1>";

  const candidates = new Map<string, AnimationQueueItem>();
  for (const section of data.sections) {
    for (const row of section.rows ?? []) {
      if (row.queue === undefined) continue;
      candidates.set(row.queue.id, { ...row.queue, label: row.label });
    }
  }
  let queueName = "Snowflake animation selection";
  const selected = new Set<string>();
  const localQueue = localStorage.getItem(QUEUE_STORAGE_KEY);
  const applyManifest = (manifest: AnimationQueueManifest): void => {
    for (const item of manifest.items) {
      const candidate = candidates.get(item.id);
      if (
        candidate === undefined ||
        candidate.id !== item.id ||
        candidate.label !== item.label ||
        candidate.mesh !== item.mesh ||
        candidate.render !== item.render ||
        candidate.spec !== item.spec
      ) {
        throw new Error(`queue item ${item.id} is not an exact candidate in this index`);
      }
    }
    queueName = manifest.queueId.replaceAll("-", " ");
    selected.clear();
    manifest.items.forEach((item) => selected.add(item.id));
  };
  if (localQueue !== null) {
    try {
      applyManifest(parseAnimationQueueManifest(JSON.parse(localQueue) as unknown));
    } catch {
      localStorage.removeItem(QUEUE_STORAGE_KEY);
    }
  } else {
    try {
      const saved = await fetch(QUEUE_ENDPOINT, { headers: { accept: "application/json" } });
      if (saved.ok && (saved.headers.get("content-type") ?? "").includes("json")) {
        applyManifest(parseAnimationQueueManifest(await saved.json()));
      }
    } catch {
      /* Static hosts have no persistence endpoint; import/export remains available. */
    }
  }

  const selectionPanel = document.createElement("section");
  selectionPanel.className = "queue-panel";
  const title = document.createElement("strong");
  title.textContent = "Animation queue";
  const nameInput = document.createElement("input");
  nameInput.type = "text";
  nameInput.value = queueName;
  nameInput.maxLength = 80;
  nameInput.setAttribute("aria-label", "animation queue name");
  const count = document.createElement("span");
  count.className = "queue-count";
  const status = document.createElement("span");
  status.className = "queue-status";

  const manifest = (): AnimationQueueManifest => ({
    format: "gutcheck-animation-queue-v1",
    queueId: animationQueueIdFromName(nameInput.value),
    createdAt: new Date().toISOString(),
    sourceIndexGenerated: data.generated,
    settings: DEFAULT_ANIMATION_QUEUE_SETTINGS,
    items: [...selected]
      .sort()
      .map((id) => candidates.get(id))
      .filter((item): item is AnimationQueueItem => item !== undefined),
  });
  let saveTimer: number | undefined;
  const persist = (): void => {
    const value = manifest();
    const source = stringifyAnimationQueueManifest(value);
    localStorage.setItem(QUEUE_STORAGE_KEY, source);
    count.textContent = `${value.items.length} selected`;
    status.textContent = "saved in this browser";
    window.clearTimeout(saveTimer);
    saveTimer = window.setTimeout(() => {
      void fetch(QUEUE_ENDPOINT, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: source,
      }).then((saved) => {
        if (saved.ok) status.textContent = "saved to out/ and this browser";
      }).catch(() => {
        /* Static host: browser persistence and export are the supported paths. */
      });
    }, 150);
  };
  const syncCheckboxes = (): void => {
    for (const checkbox of document.querySelectorAll<HTMLInputElement>("input[data-queue-id]")) {
      const id = checkbox.dataset["queueId"];
      checkbox.checked = id !== undefined && selected.has(id);
      checkbox.closest(".cell-compare")?.classList.toggle("is-selected", checkbox.checked);
    }
  };
  const selectionChanged = (id: string, checked: boolean): void => {
    if (checked) selected.add(id);
    else selected.delete(id);
    persist();
  };
  nameInput.addEventListener("input", persist);

  const button = (label: string): HTMLButtonElement => {
    const result = document.createElement("button");
    result.type = "button";
    result.textContent = label;
    return result;
  };
  const exportButton = button("Export queue JSON");
  exportButton.addEventListener("click", () => {
    const value = manifest();
    const url = URL.createObjectURL(
      new Blob([stringifyAnimationQueueManifest(value)], { type: "application/json" }),
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${value.queueId}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  });
  const importInput = document.createElement("input");
  importInput.type = "file";
  importInput.accept = "application/json,.json";
  importInput.hidden = true;
  const importButton = button("Import queue JSON");
  importButton.addEventListener("click", () => importInput.click());
  importInput.addEventListener("change", () => {
    const file = importInput.files?.[0];
    if (file === undefined) return;
    void file.text().then((source) => {
      applyManifest(parseAnimationQueueManifest(JSON.parse(source) as unknown));
      nameInput.value = queueName;
      syncCheckboxes();
      persist();
      status.textContent = `imported ${file.name}`;
      importInput.value = "";
    }).catch((error: unknown) => {
      status.textContent = `import refused: ${error instanceof Error ? error.message : String(error)}`;
    });
  });
  const clearButton = button("Clear selection");
  clearButton.addEventListener("click", () => {
    selected.clear();
    syncCheckboxes();
    persist();
  });
  const formatNote = document.createElement("span");
  formatNote.className = "queue-format";
  formatNote.textContent = "web mesh: v2q + gzip (measured hero: 18.3 MB)";
  selectionPanel.append(
    title,
    nameInput,
    count,
    exportButton,
    importButton,
    importInput,
    clearButton,
    status,
    formatNote,
  );
  mainEl.appendChild(selectionPanel);

  // Every gallery image on the page, in document order — the lightbox pages through this
  // one list rather than per section, so arrow keys run the whole set end to end.
  const shots: Array<{ src: string; label: string }> = [];
  const lightbox = createLightbox(shots);

  for (const section of data.sections) {
    const h2 = document.createElement("h2");
    h2.textContent = section.title;
    mainEl.appendChild(h2);
    if (section.note !== undefined) {
      const p = document.createElement("p");
      p.className = "note";
      p.textContent = section.note;
      mainEl.appendChild(p);
    }
    if (section.rows !== undefined && section.rows.length > 0) {
      mainEl.appendChild(renderRows(section.rows, shots, lightbox, selected, selectionChanged));
      continue;
    }
    const hasImages = section.items.some((item) => item.image !== undefined);
    if (!hasImages) {
      const links = document.createElement("div");
      links.className = "links";
      for (const item of section.items) links.appendChild(linkButton(item));
      mainEl.appendChild(links);
      continue;
    }
    const grid = document.createElement("div");
    grid.className = "grid";
    for (const item of section.items) {
      const card = document.createElement("div");
      card.className = "card";
      card.appendChild(
        item.image === undefined
          ? linkButton(item)
          : thumbnail({ ...item, image: item.image }, shots, lightbox),
      );
      grid.appendChild(card);
    }
    mainEl.appendChild(grid);
  }
  const meta = document.createElement("p");
  meta.className = "meta";
  meta.textContent =
    `generated ${data.generated} from ${data.root} — refresh with ` +
    "node scripts/gutcheck-build-index.ts";
  mainEl.appendChild(meta);
  persist();
}

void main();
