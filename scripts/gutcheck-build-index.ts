// Gut-check spike: scan out/gutcheck-gg-realism and write index.json for the browsable
// index page (app/gutcheck-index.html). Re-run any time to refresh:
//   node scripts/gutcheck-build-index.ts

import { readdirSync, statSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const ROOT = resolve("out/gutcheck-gg-realism");
const FS = (p: string): string => `/@fs${p}`;
const VIEWER = "/spike-gg-realism.html";

interface Item {
  label: string;
  href: string;
  image?: string;
  note?: string;
}
interface Section {
  title: string;
  note?: string;
  items: Item[];
}

const listFiles = (dir: string): string[] => {
  try {
    return readdirSync(dir)
      .filter((f) => !f.startsWith("."))
      .map((f) => join(dir, f))
      .filter((p) => statSync(p).isFile());
  } catch {
    return [];
  }
};

const png = (p: string): boolean => p.endsWith(".png");
const name = (p: string): string => p.slice(p.lastIndexOf("/") + 1);

const rootFiles = listFiles(ROOT);
const figFiles = listFiles(join(ROOT, "figs"));
const photoFiles = listFiles(join(ROOT, "photos"));

const meshHref = (look: string, meshPath: string, extra = ""): string =>
  `${VIEWER}?look=${look}&interactive=1&mesh=${FS(meshPath)}${extra}`;

const sections: Section[] = [];

// 1. Interactive viewers. Large binaries live under large/<group>/ — see the
// "large-artifact inventory" WP in docs/plans/explore-gg-realism-gutcheck.md.
const timelineManifest = join(ROOT, "large", "anim-B", "manifest.json");
const viewers: Item[] = [];
for (const look of ["bold-ice", "footage-ice", "povray"]) {
  viewers.push({
    label: `Growth timeline (701 frames) — ${look}`,
    href: `${VIEWER}?look=${look}&manifest=${FS(timelineManifest)}&frameExtent=620&frame=700`,
    note: "play / scrub / orbit / upright / spin / bg",
  });
}
const meshes = join(ROOT, "large", "meshes");
const figMeshes = join(ROOT, "large", "figs");
const viewerMeshes: Array<[string, string, string]> = [
  ["Run B (Fig. 4 plate) — bold-ice", "bold-ice", join(meshes, "plate-1200-mesh-s045-h06.bin")],
  ["Run B — povray", "povray", join(meshes, "plate-1200-mesh-s0375-h06.bin")],
  ["Fig. 9-v2 sectored plate — footage-ice", "footage-ice", join(figMeshes, "fig9v2-mesh.bin")],
  ["Fig. 16 star — ggview (cell-true)", "ggview", join(figMeshes, "fig16-cellmesh.bin")],
  ["Fig. 9-v2 — ggview (cell-true)", "ggview", join(figMeshes, "fig9v2-cellmesh.bin")],
];
for (const [label, look, mesh] of viewerMeshes) {
  try {
    statSync(mesh);
    viewers.push({ label, href: meshHref(look, mesh) });
  } catch {
    /* not produced yet */
  }
}
sections.push({
  title: "Interactive viewers",
  note: "Every page has the look dropdown, background pickers, upright/spin/face-on, and (cell meshes) ?clip=1 cutaways.",
  items: viewers,
});

// 2. Paper-figure coverage composites.
const figComposites = figFiles
  .filter((p) => png(p) && name(p).startsWith("side-by-side-"))
  .sort((a, b) => {
    const num = (p: string): number => Number((name(p).match(/fig(\d+)/) ?? [0, 0])[1]);
    return num(a) - num(b);
  })
  .map((p) => ({
    label: name(p).replace("side-by-side-", "").replace(".png", ""),
    href: FS(p),
    image: FS(p),
  }));
sections.push({
  title: "Paper-figure reproductions (ours left, paper right)",
  note: "Verdicts live in the coverage table in docs/plans/explore-gg-realism-gutcheck.md.",
  items: figComposites,
});

// 3. Real-photo comparisons.
sections.push({
  title: "Real-photo comparisons (ours left, photo right)",
  items: photoFiles
    .filter((p) => png(p) && name(p).startsWith("side-by-side-"))
    .map((p) => ({
      label: name(p).replace("side-by-side-", "").replace(".png", ""),
      href: FS(p),
      image: FS(p),
    })),
});

// 4. Gut-check & style heroes at the root.
sections.push({
  title: "Gut check, style heroes, and paper-scale composites",
  items: rootFiles
    .filter(
      (p) =>
        png(p) &&
        (name(p).startsWith("side-by-side-") ||
          name(p).startsWith("style-") ||
          name(p).startsWith("render-1200-") ||
          name(p).startsWith("render-384-final")),
    )
    .sort()
    .map((p) => ({ label: name(p).replace(".png", ""), href: FS(p), image: FS(p) })),
});

// 5. Videos.
sections.push({
  title: "Videos",
  items: rootFiles
    .filter((p) => p.endsWith(".mp4"))
    .map((p) => ({ label: name(p), href: FS(p), note: "video" })),
});

// 6. Everything else (remaining figure renders etc.).
const indexed = new Set(
  sections.flatMap((s) => s.items.map((i) => i.image ?? "")).filter(Boolean),
);
sections.push({
  title: "All remaining renders",
  items: [...rootFiles, ...figFiles, ...photoFiles]
    .filter((p) => png(p) && !indexed.has(FS(p)))
    .sort()
    .map((p) => ({ label: name(p).replace(".png", ""), href: FS(p), image: FS(p) })),
});

const out = {
  generated: new Date().toISOString(),
  root: ROOT,
  sections: sections.filter((s) => s.items.length > 0),
};
writeFileSync(join(ROOT, "index.json"), JSON.stringify(out, null, 1));
console.log(
  `index.json: ${out.sections.length} sections, ` +
    `${out.sections.reduce((acc, s) => acc + s.items.length, 0)} items`,
);
