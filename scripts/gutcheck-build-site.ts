// Phase 7 prep spike, Track A (docs/plans/explore-phase7-prep.md): assemble the shippable
// static site — a normal `vite build` of the app pages plus a curated data bundle — into
// out/gutcheck-gg-realism/site/, servable by any plain static host:
//
//   node scripts/gutcheck-build-site.ts [--skip-vite]
//   python3 -m http.server -d out/gutcheck-gg-realism/site 8080   # then browse
//
// Curation rules (copyright + size, per the gut-check plan's media constraints):
// - ONLY project-generated artifacts ship: v2q meshes, the v2q timeline, our renders and
//   videos. side-by-side composites, paper crops/pages, and photo files embed third-party
//   media and are NEVER copied here.
// - Multi-GB data is hardlinked (same volume) rather than copied.
// - Cell-true (ggview) meshes are not in the v1 bundle (no v2q path yet — plan Track A).

import {
  copyFileSync,
  existsSync,
  linkSync,
  mkdirSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { basename, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const REPO = resolve(import.meta.dirname, "..");
const OUT = join(REPO, "out/gutcheck-gg-realism");
const SITE = join(OUT, "site");
const DATA = join(SITE, "data");

const skipVite = process.argv.includes("--skip-vite");

if (!skipVite) {
  console.log("vite build ...");
  // shell:true on Windows, where npx is npx.cmd and bare spawnSync yields a null status.
  const result = spawnSync("npx", ["vite", "build"], {
    cwd: join(REPO, "app"),
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  if (result.status !== 0) {
    throw new Error(`vite build failed (status ${result.status}${result.error ? `: ${result.error.message}` : ""})`);
  }
}

rmSync(SITE, { recursive: true, force: true });
mkdirSync(DATA, { recursive: true });

// 1. Built pages.
const dist = join(REPO, "app", "dist");
const copyTree = (from: string, to: string): void => {
  mkdirSync(to, { recursive: true });
  for (const name of readdirSync(from)) {
    const src = join(from, name);
    const dst = join(to, name);
    if (statSync(src).isDirectory()) copyTree(src, dst);
    else copyFileSync(src, dst);
  }
};
copyTree(dist, SITE);

// 1b. Committed scene scripts (Developer-profile prototype, Track B).
const scenesDir = join(REPO, "app", "scenes");
if (existsSync(scenesDir)) copyTree(scenesDir, join(SITE, "scenes"));

// 2. Data bundle (hardlinks for the heavy binaries).
// Returns the placed file's BASENAME (or null when the source is absent). basename() rather
// than a "/" search so Windows' backslash paths work; copy fallback so a cross-filesystem
// out/ tree degrades instead of aborting a build that already deleted the previous site.
const link = (src: string, dstDir: string, dstName?: string): string | null => {
  if (!existsSync(src)) return null;
  mkdirSync(dstDir, { recursive: true });
  const name = dstName ?? basename(src);
  const dst = join(dstDir, name);
  rmSync(dst, { force: true });
  try {
    linkSync(src, dst);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "EXDEV") throw error;
    copyFileSync(src, dst);
  }
  return name;
};

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
const sections: Section[] = [];
const viewer = "spike-gg-realism.html";

// Heroes: quantize outputs staged in p7/ by Track A, plus any *-v2q.bin already produced.
const heroMeshes: Array<[string, string, string]> = [
  ["Run B (Fig. 4 plate) — bold-ice", "bold-ice", join(OUT, "p7", "plate-1200-v2q.bin")],
  ["Smoke crystal — footage-ice", "footage-ice", join(OUT, "p7", "smoke-v2q.bin")],
];
const viewers: Item[] = [];
const animSrc = join(OUT, "large", "anim-B-v2q");
if (existsSync(animSrc)) {
  const animDst = join(DATA, "anim-B");
  mkdirSync(animDst, { recursive: true });
  for (const name of readdirSync(animSrc)) link(join(animSrc, name), animDst);
  for (const look of ["bold-ice", "footage-ice", "povray"]) {
    viewers.push({
      label: `Growth timeline (701 frames) — ${look}`,
      href: `${viewer}?look=${look}&manifest=data/anim-B/manifest.json&frameExtent=620&frame=700`,
      note: "play / scrub / orbit / upright / spin / bg",
    });
  }
}
const missingSources: string[] = [];
for (const [label, look, mesh] of heroMeshes) {
  const linked = link(mesh, join(DATA, "meshes"));
  if (linked !== null) {
    viewers.push({ label, href: `${viewer}?look=${look}&interactive=1&mesh=data/meshes/${linked}` });
  } else {
    missingSources.push(mesh);
  }
}
sections.push({
  title: "Interactive viewers",
  note: "Look dropdown, background pickers, upright/spin/face-on on every page.",
  items: viewers,
});

// 3. Our renders (never side-by-side composites, paper crops, or photos).
const galleries: Array<[string, string, (name: string) => boolean]> = [
  [
    "Figure-family renders (model output only)",
    join(OUT, "figs"),
    (n) => /^fig.*-(render|cutaway|xray|endon|ggview)\.png$/.test(n),
  ],
  [
    "Style heroes and large renders",
    OUT,
    (n) => /^(style-|render-1200-|render-384-final|occupancy|occ-).*\.png$/.test(n),
  ],
];
for (const [title, dir, match] of galleries) {
  const items: Item[] = [];
  if (!existsSync(dir)) {
    missingSources.push(dir);
    continue;
  }
  for (const name of readdirSync(dir).sort()) {
    if (!match(name) || !statSync(join(dir, name)).isFile()) continue;
    link(join(dir, name), join(DATA, "renders"));
    items.push({ label: name.replace(".png", ""), href: `data/renders/${name}`, image: `data/renders/${name}` });
  }
  sections.push({ title, items });
}
const video = link(join(OUT, "growth-B-topdown.mp4"), join(DATA, "renders"));
if (video !== null) {
  sections.push({
    title: "Videos",
    items: [{ label: "growth-B-topdown.mp4", href: "data/renders/growth-B-topdown.mp4", note: "video" }],
  });
}

writeFileSync(
  join(DATA, "index.json"),
  JSON.stringify(
    {
      generated: new Date().toISOString(),
      root: "site bundle (relative paths)",
      sections: sections.filter((s) => s.items.length > 0),
    },
    null,
    1,
  ),
);

// Absent sources are a curation fact, never a silent gap: a fresh clone has only tracked/,
// so the bundle is thinner and the record must say which sections were skipped.
if (missingSources.length > 0) {
  console.log(`skipped ${missingSources.length} absent source(s):`);
  for (const src of missingSources) console.log(`  ${src}`);
}
const du = spawnSync("du", ["-sh", SITE], { encoding: "utf8" }).stdout.trim();
console.log(`site assembled: ${du}`);
console.log(`serve with: python3 -m http.server -d ${SITE} 8080`);
