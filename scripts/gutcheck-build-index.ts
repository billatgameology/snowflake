// Gut-check spike: scan out/gutcheck-gg-realism and write index.json for the browsable
// index page (app/gutcheck-index.html). Re-run any time to refresh:
//   node scripts/gutcheck-build-index.ts

import { readdirSync, statSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

// Every path below is kept in forward-slash form. node:path's join() emits backslashes on
// Windows, which broke name() (it splits on "/", so it returned the whole path and every
// startsWith filter below matched nothing) as well as the URLs — 2026-08-06 machine transfer.
const ROOT = resolve("out/gutcheck-gg-realism").replace(/\\/g, "/");
const join = (...parts: string[]): string => parts.join("/");

// Vite's dev-server escape hatch for files outside the app root. `/@fs` + the path works only
// when the path starts with "/": on Windows the same concatenation produced "/@fsG:\Code
// Files\..." — no separator, backslashes, unencoded space. The Windows form is
// "/@fs/G:/Code%20Files/...", and percent-encoding per segment also keeps "&", "?" and "#" in
// a filename from splitting the query string the viewer parses with URLSearchParams. A bare
// drive-letter ":" is legal in a URL path and is what /@fs expects, so it is put back.
// On POSIX paths without special characters this returns the original string unchanged.
const FS = (p: string): string =>
  `/@fs/${p
    .replace(/^\/+/, "")
    .split("/")
    .map((segment) => encodeURIComponent(segment).replace(/%3A/gi, ":"))
    .join("/")}`;

const VIEWER = "/spike-gg-realism.html";

interface Item {
  label: string;
  href: string;
  image?: string;
  note?: string;
}
/**
 * One row per crystal: its side-by-side comparison(s), then whatever else exists for that
 * same crystal. Grouping by crystal rather than by image is the whole point — Run B alone
 * has six comparisons, and giving each its own row would show the single growth animation
 * six times over, which is the impression this view exists to correct.
 */
interface CompareRow {
  label: string;
  comparisons: Item[];
  viewers: Item[];
  animation?: Item;
}
interface Section {
  title: string;
  note?: string;
  items: Item[];
  rows?: CompareRow[];
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
//
// Labels name the crystal first and the look second, because the look names are internal
// recipe ids: on their own, "Run B — povray" says nothing about what opens. Each link
// carries the one-line gloss below as a visible second line. The LOOKS registry in
// app/src/spike-gg-realism.ts stays the source of truth for the recipes themselves; these
// are short restatements of its notes, in the same spirit as the plan file's mirror table.
const LOOK_BLURB: Record<string, string> = {
  "bold-ice": "high-visibility presentation ice",
  "footage-ice": "J0521r2p microscopy footage target",
  povray: "G-G Fig. 4 ray-trace target, backlit navy glow",
  ggview: "the paper's own display mode: cell-true prisms + drawn structure edges",
};
// The label already ends in the look name, so the gloss does not repeat it.
const lookNote = (look: string, controls: string): string => `${LOOK_BLURB[look]} · ${controls}`;

const meshes = join(ROOT, "large", "meshes");
const figMeshes = join(ROOT, "large", "figs");
const timelineManifest = join(ROOT, "large", "anim-B", "manifest.json");

const exists = (p: string): boolean => {
  try {
    statSync(p);
    return true;
  } catch {
    return false;
  }
};

// What exists per crystal, beyond the still comparison. Keyed by the id the composite
// filenames resolve to (see crystalOf). Only three crystals have an interactive mesh and
// only Run B has a growth animation — anim-B is the single 701-frame timeline in the whole
// spike (large/anim-smoke is a 20-frame pipeline smoke test, deliberately not surfaced).
interface Crystal {
  viewers: Array<{ subject: string; look: string; mesh: string }>;
  animation?: { look: string; manifest: string; frames: number };
}
const CRYSTALS: Record<string, Crystal> = {
  runB: {
    viewers: [
      // Same Run B checkpoint both times; σ is the mesh-extraction smoothing, and each value
      // is the one its look was locked against (plan: "locked recipe" notes).
      { subject: "final frame, σ 0.45 mesh", look: "bold-ice", mesh: join(meshes, "plate-1200-mesh-s045-h06.bin") },
      { subject: "final frame, σ 0.375 mesh", look: "povray", mesh: join(meshes, "plate-1200-mesh-s0375-h06.bin") },
    ],
    animation: { look: "bold-ice", manifest: timelineManifest, frames: 701 },
  },
  fig9v2: {
    viewers: [
      { subject: "surface mesh", look: "footage-ice", mesh: join(figMeshes, "fig9v2-mesh.bin") },
      { subject: "cell-true", look: "ggview", mesh: join(figMeshes, "fig9v2-cellmesh.bin") },
    ],
  },
  fig16: {
    viewers: [{ subject: "cell-true", look: "ggview", mesh: join(figMeshes, "fig16-cellmesh.bin") }],
  },
};

/**
 * Which crystal a composite belongs to. Rules are ordered, because several names contain
 * more than one cue: "B-vs-fig4" and "stylepov-vs-fig4" are Run B renders compared against
 * the paper's Fig. 4, and "B-vs-takahashi-fig1h" would otherwise match a bogus "fig1".
 * A composite with no match simply has no extra columns — that is the common case.
 */
const crystalOf = (base: string): string | undefined => {
  if (/^[B]-vs-/.test(base) || /^style(ice|pov)-vs-/.test(base)) return "runB";
  const fig = /fig(\d+(?:v\d+)?)/.exec(base);
  if (fig === null) return undefined;
  const key = `fig${fig[1]}`;
  return key === "fig4" ? "runB" : key;
};

/**
 * Filename stem -> something readable. These are internal names; the goal is legibility.
 * Hyphen-to-space runs before the figure prettifier, or it would eat the hyphen that
 * prettifier just inserted ("Fig. 9-v2" came back out as "Fig. 9 v2").
 */
const prettyLabel = (base: string): string => {
  const s = base
    .replace(/^([ABC])-vs-/, "Run $1 vs ")
    .replace(/^styleice-vs-/, "Style ice vs ")
    .replace(/^stylepov-vs-/, "Style povray vs ")
    .replace(/-vs-/g, " vs ")
    .replace(/-/g, " ")
    .replace(/fig(\d+)v(\d+)/gi, "Fig. $1-v$2")
    .replace(/fig(\d+)/gi, "Fig. $1")
    .replace(/bentley(\d+)/gi, "Bentley $1")
    .replace(/\btakahashi\b/gi, "Takahashi")
    .replace(/\bggview\b/g, "ggview view");
  return s.charAt(0).toUpperCase() + s.slice(1);
};

/** Display name for a crystal group. */
const crystalLabel = (key: string, firstBase: string): string => {
  if (key === "runB") return "Run B — the Fig. 4 plate, 70,000 ticks";
  const fig = /^fig(\d+)(?:v(\d+))?$/.exec(key);
  if (fig !== null) return fig[2] === undefined ? `Fig. ${fig[1]}` : `Fig. ${fig[1]}-v${fig[2]}`;
  return prettyLabel(firstBase);
};

// 1. Crystal by crystal: every side-by-side comparison of that crystal, then whatever else
// exists for it. Composites with no crystal cue group under their own name, so nothing is
// dropped for lacking a rule.
const compositePaths = [...figFiles, ...photoFiles, ...rootFiles].filter(
  (p) => png(p) && name(p).startsWith("side-by-side-"),
);
const compositeImages = new Set(compositePaths.map((p) => FS(p)));

const grouped = new Map<string, { bases: string[]; paths: string[] }>();
for (const p of compositePaths) {
  const base = name(p).replace("side-by-side-", "").replace(".png", "");
  const key = crystalOf(base) ?? base;
  const bucket = grouped.get(key) ?? { bases: [], paths: [] };
  bucket.bases.push(base);
  bucket.paths.push(p);
  grouped.set(key, bucket);
}

const rows: CompareRow[] = [...grouped.entries()].map(([key, bucket]) => {
  const crystal = CRYSTALS[key];
  const viewers: Item[] = (crystal?.viewers ?? [])
    .filter((v) => exists(v.mesh))
    .map((v) => ({
      label: `${v.subject} · ${v.look}`,
      href: meshHref(v.look, v.mesh),
      note: lookNote(v.look, "orbit / upright / spin / face-on"),
    }));
  const anim = crystal?.animation;
  const animation =
    anim !== undefined && exists(anim.manifest)
      ? {
          label: `Growth timeline · ${anim.frames} frames`,
          href: `${VIEWER}?look=${anim.look}&manifest=${FS(anim.manifest)}&frameExtent=620&frame=700`,
          note: "play / scrub from seed to final · look switches in-page",
        }
      : undefined;
  return {
    label: crystalLabel(key, bucket.bases[0]!),
    comparisons: bucket.paths.map((p, i) => ({
      label: prettyLabel(bucket.bases[i]!),
      href: FS(p),
      image: FS(p),
    })),
    viewers,
    ...(animation && { animation }),
  };
});

// Richest first, so the few crystals that are more than a still are immediately visible;
// figure order within each band keeps the paper walkthrough intact.
const figNumber = (label: string): number => Number(/^Fig\. (\d+)/.exec(label)?.[1] ?? 999);
const rank = (r: CompareRow): number => (r.animation !== undefined ? 0 : r.viewers.length > 0 ? 1 : 2);
rows.sort((a, b) => rank(a) - rank(b) || figNumber(a.label) - figNumber(b.label) || a.label.localeCompare(b.label));

const withViewer = rows.filter((r) => r.viewers.length > 0).length;
const withAnimation = rows.filter((r) => r.animation !== undefined).length;
const comparisonCount = rows.reduce((acc, r) => acc + r.comparisons.length, 0);
sections.push({
  title: "Crystal by crystal",
  note:
    `${rows.length} crystals · ${comparisonCount} side-by-side comparisons · ` +
    `${withViewer} crystals also open in the interactive viewer · ` +
    `${withAnimation} has a growth animation (Run B is the only animated run in the spike). ` +
    "Ours left, target right — click any comparison to open it full-screen and arrow through " +
    "the set. Verdicts live in the coverage table in docs/plans/explore-gg-realism-gutcheck.md.",
  items: [],
  rows,
});

// Guard: an interactive view whose crystal has no composite would otherwise vanish from the
// index entirely. None today; this fires rather than silently dropping one later.
const linkedMeshes = new Set(rows.flatMap((r) => r.viewers.map((v) => v.href)));
const orphanViewers: Item[] = [];
for (const [key, crystal] of Object.entries(CRYSTALS)) {
  for (const v of crystal.viewers) {
    if (!exists(v.mesh)) continue;
    const href = meshHref(v.look, v.mesh);
    if (linkedMeshes.has(href)) continue;
    orphanViewers.push({
      label: `${key} — ${v.subject} · ${v.look}`,
      href,
      note: lookNote(v.look, "no side-by-side comparison for this crystal"),
    });
  }
}
if (orphanViewers.length > 0) {
  sections.push({
    title: "Interactive views with no comparison image",
    items: orphanViewers,
  });
}

// 4. Style heroes at the root. side-by-side-* used to be listed here too; those are now rows
// in "Crystal by crystal" above, and listing them twice was part of what made the page hard
// to read as an inventory.
sections.push({
  title: "Style heroes and paper-scale renders",
  items: rootFiles
    .filter(
      (p) =>
        png(p) &&
        !compositeImages.has(FS(p)) &&
        (name(p).startsWith("style-") ||
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

// 6. Everything else (remaining figure renders etc.). Row images count as indexed too —
// otherwise every comparison would reappear here as an unlabelled leftover.
const indexed = new Set(
  [
    ...sections.flatMap((s) => s.items.map((i) => i.image ?? "")),
    ...sections.flatMap((s) => (s.rows ?? []).map((r) => r.image)),
  ].filter(Boolean),
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
  sections: sections.filter((s) => s.items.length > 0 || (s.rows ?? []).length > 0),
};
writeFileSync(join(ROOT, "index.json"), JSON.stringify(out, null, 1));
console.log(
  `index.json: ${out.sections.length} sections, ` +
    `${out.sections.reduce((acc, s) => acc + s.items.length, 0)} items`,
);
