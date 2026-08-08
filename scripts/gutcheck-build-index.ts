// Gut-check spike: scan out/gutcheck-gg-realism and write index.json for the browsable
// index page (app/gutcheck-index.html). Re-run any time to refresh:
//   node scripts/gutcheck-build-index.ts

import { readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
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
};

// Every paper figure that was reproduced left the mesh its render was made from in
// large/figs/ — 33 of them. Discover those rather than listing them: a hardcoded list is
// what kept all but two figures out of the index even though their models were on disk, and
// it would go stale again the next time a figure is harvested.
//   fig9v2-mesh.bin     -> fig9v2, surface
//   fig16-cellmesh.bin  -> fig16, cell-true (needs style=ggview; the surface looks cannot
//                          draw the paper's own prism/edge display mode)
for (const path of listFiles(figMeshes)) {
  const match = /^(fig\d+(?:v\d+)?)-(cellmesh|mesh)\.bin$/.exec(name(path));
  if (match === null) continue;
  const key = match[1]!;
  const cellTrue = match[2] === "cellmesh";
  const crystal = (CRYSTALS[key] ??= { viewers: [] });
  crystal.viewers.push({
    subject: cellTrue ? "cell-true" : "surface mesh",
    // glass is the maker's pick (2026-08-06); the viewer's look dropdown switches live, so
    // this is a starting point rather than a fixed choice.
    look: cellTrue ? "ggview" : "glass",
    mesh: path,
  });
}
// Surface before cell-true, so every figure row reads the same way.
for (const crystal of Object.values(CRYSTALS)) {
  crystal.viewers.sort((a, b) => Number(a.subject === "cell-true") - Number(b.subject === "cell-true"));
}

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

// 3b. Generated crystals — the parameter sweep. These are grown from the tracked specs rather
// than reproduced from the paper, so they have no side-by-side and do not belong in the
// crystal-by-crystal table. Each row is one spec: its render, its final mesh in the viewer,
// and its growth timeline when a COMPLETE one exists (a partial manifest means the run was
// interrupted, and linking it would present a half-grown crystal as finished).
const genRecords = join(ROOT, "gen");
const genRenders = join(genRecords, "renders");
const animRoot = join(ROOT, "large", "anim");
const genRows: CompareRow[] = [];
for (const path of listFiles(genRecords)) {
  const file = name(path);
  if (!file.endsWith("-record.json")) continue;
  const id = file.replace(/-record\.json$/, "");
  let record: {
    label?: string;
    tick?: number;
    stopReason?: string;
    unfiredTransitions?: number;
    stageTransitions?: unknown[];
    spec?: { stages?: unknown[] };
  };
  try {
    record = JSON.parse(readFileSync(path, "utf8")) as typeof record;
  } catch {
    continue;
  }
  const viewers: Item[] = [];
  const meshPath = join(ROOT, "large", "gen", `${id}-mesh.bin`);
  if (exists(meshPath)) {
    viewers.push({
      label: "final mesh · glass",
      href: meshHref("glass", meshPath),
      note: `${record.stopReason ?? "?"} at tick ${String(record.tick ?? 0)}`,
    });
  }
  let animation: Item | undefined;
  const manifestPath = join(animRoot, id, "manifest.json");
  if (exists(manifestPath)) {
    try {
      const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as {
        complete?: boolean;
        frames?: unknown[];
      };
      if (manifest.complete === true && (manifest.frames ?? []).length > 1) {
        animation = {
          label: `Growth timeline · ${String((manifest.frames ?? []).length)} frames`,
          href: `${VIEWER}?look=glass&manifest=${FS(manifestPath)}&frameExtent=620`,
          note: "play / scrub from seed to final · look switches in-page",
        };
      }
    } catch {
      /* unreadable manifest — treat as no timeline */
    }
  }
  const render = join(genRenders, `${id}-render.png`);
  const renderAlt = join(genRenders, `${id}.png`);
  const image = exists(render) ? render : exists(renderAlt) ? renderAlt : null;
  genRows.push({
    // A schedule that never fired is a single-stage crystal wearing a staged name; say so here
    // rather than letting the id imply something the run did not do.
    // Records written before unfiredTransitions existed still need the flag, so derive it from
    // the spec when the field is absent: stages-1 scheduled, minus the ones that actually fired.
    label:
      (record.label ?? id) +
      ((record.unfiredTransitions ??
        Math.max(0, (record.spec?.stages?.length ?? 1) - 1 - (record.stageTransitions?.length ?? 0))) > 0
        ? "  [schedule never fired — single stage]"
        : ""),
    comparisons: image === null ? [] : [{ label: id, href: FS(image), image: FS(image) }],
    viewers,
    ...(animation && { animation }),
  });
}
if (genRows.length > 0) {
  genRows.sort((a, b) => Number(b.animation !== undefined) - Number(a.animation !== undefined));
  sections.push({
    title: "Generated crystals (parameter sweep)",
    note:
      `${genRows.length} grown from tracked specs in out/gutcheck-gg-realism/specs/. ` +
      `${genRows.filter((r) => r.animation !== undefined).length} have a growth timeline. ` +
      "Not paper reproductions and not photo matches — these exist to show the range a few " +
      "parameters cover. Regrow any of them with scripts/gutcheck-grow-batch.mjs.",
    items: [],
    rows: genRows,
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
    // Every image in every row, not r.image — rows carry a list of comparisons. This read
    // r.image until 2026-08-07, which after the row refactor was always undefined, so all 48
    // comparisons were also re-listed below as unlabelled leftovers.
    ...sections.flatMap((s) => (s.rows ?? []).flatMap((r) => r.comparisons.map((c) => c.image ?? ""))),
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
