// Gut-check spike: scan tracked provenance plus the local/NAS gut-check workspace and write
// out/gutcheck-gg-realism/index.json for the browsable index page
// (app/gutcheck-index.html). Re-run any time to refresh:
//   node scripts/gutcheck-build-index.ts
// Use `--detached` for an explicit metadata-only index without probing a mounted share.

import { closeSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import {
  decideNasCatalogServePath,
  openContainedRegularFile,
  parseNasAssetCatalogV1,
} from "./nas-asset-lib.ts";

// Every path below is kept in forward-slash form. node:path's join() emits backslashes on
// Windows, which broke name() (it splits on "/", so it returned the whole path and every
// startsWith filter below matched nothing) as well as the URLs — 2026-08-06 machine transfer.
const ROOT = resolve("out/gutcheck-gg-realism").replace(/\\/g, "/");
const LOGICAL_ROOT = "out/gutcheck-gg-realism";
const join = (...parts: string[]): string => parts.join("/");
const CATALOGUE = parseNasAssetCatalogV1(
  readFileSync(resolve(import.meta.dirname, "..", "docs/nas-assets.json"), "utf8"),
);
const arguments_ = process.argv.slice(2);
if (arguments_.some((argument) => argument !== "--detached") || arguments_.length > 1) {
  throw new Error("usage: node scripts/gutcheck-build-index.ts [--detached]");
}
const DETACHED = arguments_[0] === "--detached";

// Large artifacts (large/** and gen/renders) moved to the NAS on 2026-08-12 —
// \\GameStation\snowcrystal, ledgered in docs/nas-ledger.md, mounted as S: on Windows and
// under /Volumes on macOS (scripts/nas-root.ts resolves which). Only a validated marked share
// supplies browsable bytes. Local out/ remains staging: detached builds keep tracked run metadata
// but do not emit dead /nas links or revive the retired /@fs local-file path.
const NAS_MOUNT = DETACHED ? null : (await import("./nas-root.ts")).detectNasMount();
const NAS_ROOT = NAS_MOUNT === null ? null : `${NAS_MOUNT}out/gutcheck-gg-realism`;
const BULK_ROOT = NAS_ROOT ?? ROOT;
const BULK_AVAILABLE = NAS_ROOT !== null;

// Index URLs are logical NAS identities, never checkout paths. Every emitted path must match an
// explicit catalogue serve prefix. This also keeps private reference images from leaking through
// Vite's /@fs escape hatch.
const relativeToPhysicalRoot = (path: string, root: string): string | null => {
  const normalizedPath = path.replace(/\\/g, "/").replace(/\/+$/u, "");
  const normalizedRoot = root.replace(/\\/g, "/").replace(/\/+$/u, "");
  if (normalizedPath === normalizedRoot) return "";
  return normalizedPath.startsWith(`${normalizedRoot}/`)
    ? normalizedPath.slice(normalizedRoot.length + 1)
    : null;
};

const logicalPath = (path: string): string => {
  const relativePath = relativeToPhysicalRoot(path, BULK_ROOT);
  if (relativePath === null || relativePath === "") {
    throw new Error(`gutcheck asset is outside the configured staging roots: ${path}`);
  }
  return `${LOGICAL_ROOT}/${relativePath}`;
};

const maybeFS = (path: string): string | null => {
  const logical = logicalPath(path);
  const decision = decideNasCatalogServePath(CATALOGUE, logical);
  if (decision.kind !== "allow") return null;
  return `/nas/${logical.split("/").map((segment) => encodeURIComponent(segment)).join("/")}`;
};

const FS = (path: string): string => {
  const href = maybeFS(path);
  if (href === null) throw new Error(`gutcheck asset is not authorized for /nas serving: ${logicalPath(path)}`);
  return href;
};

const served = (path: string): boolean => maybeFS(path) !== null;

/**
 * Open one catalogue-authorized NAS file without following any path-component symlink.
 * The index is a metadata publication boundary too: it must not read private bytes through an
 * allowed lexical prefix and leave the stricter /nas route to reject the resulting dead URL.
 */
const openServedFile = (path: string) => {
  if (NAS_MOUNT === null) return null;
  const logical = logicalPath(path);
  const decision = decideNasCatalogServePath(CATALOGUE, logical);
  if (decision.kind !== "allow") return null;
  const opened = openContainedRegularFile(NAS_MOUNT, logical, decision.matchedPrefix);
  return opened.kind === "ok" ? opened : null;
};

const servedFileExists = (path: string): boolean => {
  const opened = openServedFile(path);
  if (opened === null) return false;
  closeSync(opened.fd);
  return true;
};

const readServedText = (path: string): string | null => {
  const opened = openServedFile(path);
  if (opened === null) return null;
  try {
    return readFileSync(opened.fd, "utf8");
  } finally {
    closeSync(opened.fd);
  }
};

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

const listServedFiles = (dir: string): string[] => {
  if (!BULK_AVAILABLE) return [];
  try {
    return readdirSync(dir)
      .filter((f) => !f.startsWith("."))
      .map((f) => join(dir, f))
      .filter(servedFileExists);
  } catch {
    return [];
  }
};

const png = (p: string): boolean => p.endsWith(".png");
const name = (p: string): string => p.slice(p.lastIndexOf("/") + 1);

// The root, figs, and photos directories mix private/restricted reference media with generated
// presentation outputs. They are intentionally not scanned or indexed. A later collection split
// may restore a generated subset, but directory presence alone can never authorize it.
const rootFiles: string[] = [];
const figFiles: string[] = [];
const photoFiles: string[] = [];

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
  glass: "clear glass: thin walls, double-sided, backdrop visible through the crystal",
};
// The label already ends in the look name, so the gloss does not repeat it. A look present in
// LOOKS but missing here used to render the literal string "undefined" on every card using it
// — which is how `glass`, the default for all 30-odd figure meshes, shipped as "undefined ·
// no side-by-side comparison for this crystal". Fail the build instead: this is a generator,
// and a named stop costs one line where a silent template hole costs a page of nonsense.
const lookNote = (look: string, controls: string): string => {
  const blurb = LOOK_BLURB[look];
  if (blurb === undefined) {
    throw new Error(`look "${look}" has no LOOK_BLURB entry (add one restating its LOOKS note)`);
  }
  return `${blurb} · ${controls}`;
};

const meshes = join(BULK_ROOT, "large", "meshes");
const figMeshes = join(BULK_ROOT, "large", "figs");
const timelineManifest = join(BULK_ROOT, "large", "anim-B", "manifest.json");

const exists = (p: string): boolean => {
  return BULK_AVAILABLE && servedFileExists(p);
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
for (const path of listServedFiles(figMeshes)) {
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
  (p) => png(p) && name(p).startsWith("side-by-side-") && served(p),
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
const genRenders = join(BULK_ROOT, "gen", "renders");
const animRoot = join(BULK_ROOT, "large", "anim");
const genRows: CompareRow[] = [];

// 3c. Animation dial-in (2026-08-08): the same branch 1 -> plate 3 recipe grown at three
// domain sizes to pick the spec for smooth large-crystal animations (the 63-frame sweep
// timelines scrub badly; anim-B's 701 frames are the bar). These rows are shown even while
// a run is still growing — a mid-run manifest is exactly what ?frameExtent exists for, and
// watching the timeline fill in is the point of the exercise — so, unlike the sweep rows
// below, "incomplete" here is labelled rather than hidden.
interface DialinRecord {
  stopReason?: string;
  tick?: number;
  stageTransitions?: Array<{ tick?: number }>;
}
interface DialinManifest {
  complete?: boolean;
  frames?: Array<{ tick?: number; vertexCount?: number }>;
  config?: {
    dims?: { nx?: number; ny?: number; nz?: number };
    every?: number;
    extraction?: { spacing?: number };
  };
  finalBBox?: { xMin: number; xMax: number; yMin: number; yMax: number };
  elapsedSeconds?: number;
}
const dialinRows: CompareRow[] = [];
const dialinSeen = new Set<string>();
// All three runs at one zoom, sized to the largest domain (1200 * 0.8 spacing * ~0.82
// crystal-to-domain ratio measured on the staged 500 runs) — relative crystal size is real.
const DIALIN_COMMON_EXTENT = 790;

function dialinRow(id: string, record: DialinRecord | null): CompareRow | null {
  if (!BULK_AVAILABLE) return null;
  const manifestPath = join(animRoot, id, "manifest.json");
  let manifest: DialinManifest;
  try {
    const source = readServedText(manifestPath);
    if (source === null) return null;
    manifest = JSON.parse(source) as DialinManifest;
  } catch {
    return null; // no frames yet (or a torn mid-run write) — nothing to show
  }
  const frames = manifest.frames ?? [];
  if (frames.length === 0) return null;
  const dims = manifest.config?.dims;
  const nx = dims?.nx ?? 0;
  const spacing = manifest.config?.extraction?.spacing ?? 0.8;
  const complete = manifest.complete === true && record !== null;
  const lastTick = frames[frames.length - 1]?.tick ?? 0;
  const hours = ((manifest.elapsedSeconds ?? 0) / 3600).toFixed(1);
  // Estimated from the manifest, not statted: the timelines live on the NAS since
  // 2026-08-12, and one stat per frame file over SMB (13k files for f2) turned a
  // sub-second rebuild into minutes. 48 B/vertex matches the mesh format (pos + normal
  // + ~2 tris/vertex) within a few percent of measured directory sizes.
  const gb = (frames.reduce((sum, f) => sum + (f.vertexCount ?? 0) * 48, 0) / 1e9).toFixed(1);
  const bb = manifest.finalBBox;
  // Pin framing to the expected final size while growing so early frames aren't magnified;
  // once complete, frame the actual crystal.
  const pinned = complete && bb !== undefined
    ? Math.ceil(Math.max(bb.xMax - bb.xMin, bb.yMax - bb.yMin) * 1.05)
    : Math.round(nx * spacing * 0.82);
  const fired = (record?.stageTransitions?.length ?? 0) > 0
    ? ` · switch fired t${String(record?.stageTransitions?.[0]?.tick ?? "?")}`
    : "";
  // A STOPPED marker in the frames dir means the run was killed on purpose (maker call,
  // e.g. the 1200 at 75 h) — label it as a decision, not as a run that is still coming.
  const stoppedEarly = exists(join(animRoot, id, "STOPPED"));
  const status = complete
    ? `${String(frames.length)} frames · ${record?.stopReason ?? "stopped"} t${String(lastTick)}`
    : stoppedEarly
      ? `stopped by choice at t${String(lastTick)} — ${String(frames.length)} frames kept`
      : `growing — ${String(frames.length)} frames so far · t${String(lastTick)}`;
  const label =
    `${String(nx)}×${String(dims?.ny ?? "?")}×${String(dims?.nz ?? "?")} — ${status} · ` +
    `every ${String(manifest.config?.every ?? "?")} ticks · spacing ${String(spacing)} · ` +
    `${hours} h · ${gb} GB${fired}`;

  const viewers: Item[] = [];
  const meshPath = join(BULK_ROOT, "large", "gen", `${id}-mesh.bin`);
  if (record !== null && exists(meshPath)) {
    viewers.push({
      label: "final mesh · glass",
      href: meshHref("glass", meshPath),
      note: `${record.stopReason ?? "?"} at tick ${String(record.tick ?? 0)}`,
    });
  }
  viewers.push({
    label: "timeline · same scale",
    href: `${VIEWER}?look=glass&manifest=${FS(manifestPath)}&frameExtent=${String(DIALIN_COMMON_EXTENT)}`,
    note: "all three sizes at one zoom — relative size is real",
  });

  const render = join(genRenders, `${id}-render.png`);
  return {
    label,
    comparisons: exists(render) ? [{ label: id, href: FS(render), image: FS(render) }] : [],
    viewers,
    animation: {
      label: `Growth timeline · ${String(frames.length)} frames${complete ? "" : " (so far)"}`,
      href: `${VIEWER}?look=glass&manifest=${FS(manifestPath)}&frameExtent=${String(pinned)}`,
      note: complete
        ? "play / scrub from seed to final · look switches in-page"
        : stoppedEarly
          ? "partial timeline — plays up to where the run was stopped"
          : "run in progress — reload to pick up new frames",
    },
  };
}
// Records are git-tracked provenance (evidence/gutcheck-gg-realism/gen-records/ since
// 2026-08-12), so every worktree has them with no share attached. Obsolete NAS/local record
// copies are not fallback authority: only these manifest-pinned tracked records describe runs.
const RECORDS = resolve(import.meta.dirname, "..", "evidence/gutcheck-gg-realism/gen-records").replace(/\\/g, "/");
const recordFiles = listFiles(RECORDS);
for (const path of recordFiles) {
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
  if (id.startsWith("dialin-")) {
    // Not sweep entries (different dims, specs live in dialin/, not specs/) — they get the
    // comparison section below instead of a row here.
    dialinSeen.add(id);
    const row = dialinRow(id, record as DialinRecord);
    if (row !== null) dialinRows.push(row);
    continue;
  }
  const viewers: Item[] = [];
  const meshPath = join(BULK_ROOT, "large", "gen", `${id}-mesh.bin`);
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
      const source = readServedText(manifestPath);
      if (source === null) throw new Error("manifest is not an authorized ordinary NAS file");
      const manifest = JSON.parse(source) as {
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
// Dial-in runs still growing have a timeline directory but no record yet — pick those up too.
if (BULK_AVAILABLE) {
  try {
    for (const d of readdirSync(animRoot)) {
      if (!d.startsWith("dialin-") || dialinSeen.has(d)) continue;
      const row = dialinRow(d, null);
      if (row !== null) dialinRows.push(row);
    }
  } catch {
    /* no anim directory yet */
  }
}
if (dialinRows.length > 0) {
  dialinRows.sort((a, b) => Number(a.label.split("×")[0]) - Number(b.label.split("×")[0]));
  sections.push({
    title: "Animation dial-in — one recipe at 500 / 800 / 1200",
    note:
      "The same branch 1 → plate 3 schedule grown at three domain sizes (switch tick scaled " +
      "per size: 4000 / 8000 / 12000) to pick the generation spec for smooth large-crystal " +
      "animations, plus two probes at 500 for the video deliverable (15 s–60 s, phone up to " +
      "1080p): frames every 2 = one sim frame per video frame at 60 s × 30 fps or 30 s × " +
      "60 fps, and spacing 0.6 = finer mesh for full-screen 1080p. The three 500-size rows " +
      "are the same crystal (same seed), so they A/B cleanly. Judge: scrub smoothness, arm " +
      "detail, crystal size, and the hours/GB in each row. Rows fill in live while runs are " +
      "growing — reload for new frames.",
    items: [],
    rows: dialinRows,
  });
}
if (genRows.length > 0) {
  genRows.sort((a, b) => Number(b.animation !== undefined) - Number(a.animation !== undefined));
  sections.push({
    title: "Generated crystals (parameter sweep)",
    note:
      `${genRows.length} grown from tracked specs in evidence/gutcheck-gg-realism/specs/. ` +
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
        served(p) &&
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
    .filter((p) => p.endsWith(".mp4") && served(p))
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
    .filter((p) => png(p) && served(p) && !indexed.has(FS(p)))
    .sort()
    .map((p) => ({ label: name(p).replace(".png", ""), href: FS(p), image: FS(p) })),
});

const out = {
  generated: new Date().toISOString(),
  root: LOGICAL_ROOT,
  sections: sections.filter((s) => s.items.length > 0 || (s.rows ?? []).length > 0),
};
// A fresh worktree has no out/ tree at all; the index is the first thing written into it.
mkdirSync(ROOT, { recursive: true });
writeFileSync(join(ROOT, "index.json"), JSON.stringify(out, null, 1));
console.log(
  `index.json: ${out.sections.length} sections, ` +
    `${out.sections.reduce((acc, s) => acc + s.items.length, 0)} items`,
);
