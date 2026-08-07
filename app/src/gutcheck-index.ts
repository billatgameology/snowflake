// Gut-check spike index page renderer: fetches the generated index.json (absolute /@fs
// path injected at generation time is not known here, so the page asks the dev server
// for the conventional location) and renders section galleries.

interface IndexItem {
  label: string;
  href: string;
  image?: string;
  note?: string;
}
interface IndexSection {
  title: string;
  note?: string;
  items: IndexItem[];
}
interface IndexData {
  generated: string;
  root: string;
  sections: IndexSection[];
}

const INDEX_URL =
  "/@fs/Users/clipper/github/snowflake-gutcheck-gg-realism/out/gutcheck-gg-realism/index.json";

async function main(): Promise<void> {
  const mainEl = document.getElementById("main");
  if (mainEl === null) return;
  const response = await fetch(INDEX_URL);
  if (!response.ok) {
    mainEl.innerHTML =
      "<h1>GG gut check — output index</h1><p class='note'>index.json missing — run " +
      "<code>node scripts/gutcheck-build-index.ts</code> and reload.</p>";
    return;
  }
  const data = (await response.json()) as IndexData;
  mainEl.innerHTML = "<h1>GG gut check — output index</h1>";

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
    const hasImages = section.items.some((item) => item.image !== undefined);
    if (!hasImages) {
      const links = document.createElement("div");
      links.className = "links";
      for (const item of section.items) {
        const a = document.createElement("a");
        a.href = item.href;
        a.target = "_blank";
        a.textContent = item.label;
        if (item.note !== undefined) a.title = item.note;
        links.appendChild(a);
      }
      mainEl.appendChild(links);
      continue;
    }
    const grid = document.createElement("div");
    grid.className = "grid";
    for (const item of section.items) {
      const card = document.createElement("div");
      card.className = "card";
      const a = document.createElement("a");
      a.href = item.href;
      a.target = "_blank";
      if (item.image !== undefined) {
        const img = document.createElement("img");
        img.loading = "lazy";
        img.src = item.image;
        img.alt = item.label;
        a.appendChild(img);
      }
      const cap = document.createElement("div");
      cap.className = "cap";
      cap.textContent = item.label;
      a.appendChild(cap);
      card.appendChild(a);
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
}

void main();
