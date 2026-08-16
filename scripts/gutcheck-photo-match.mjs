// Gut-check spike, "beyond the paper" WP: build ours-left / real-crystal-right composites
// against real captured photographs, using models we already grew.
//
//   node scripts/gutcheck-photo-match.mjs --root <research-directory> [--only <id>]
//
// Method is the one the WP registered: no new solver runs, pick the nearest verified model
// from the catalogue we already have and composite it against the photo. What that tests is
// whether G-G's morphology classes actually occur in nature, not whether a specific crystal
// can be dialled in.
//
// Source media is private NAS/cache material, not worktree state. Point --root at
// `collections/research-private-freeze/2026-08-11/payload/` or a staged archive extraction. Media in research/ is
// unversioned by decision 0004, so — exactly like app/scripts/phase6-crop-figures.mjs — the crop
// rectangles here are fractions of the source image and are the reproducible record.
//
// RIGHTS: Libbrecht holds copyright on the monograph figures and snowcrystals.com media.
// Every output lands in gitignored out/gutcheck-gg-realism/photos/ and must not be published.
// Bentley plates are public domain (Wikimedia) but follow the same path per branch discipline.

import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const REPO = resolve(import.meta.dirname, "..");
const OUT = join(REPO, "out/gutcheck-gg-realism");
const PHOTOS = join(OUT, "photos");
const FIGS = join(OUT, "figs");

if (process.argv.includes("--help")) {
  console.log(
    [
      "Usage: node scripts/gutcheck-photo-match.mjs [options]",
      "",
      "  --root <research-directory>  private cache root (default: <repo>/research)",
      "  --only <id>                  build only one registered comparison",
      "  --print-inputs               print resolved inputs as JSON without writing output",
    ].join("\n"),
  );
  process.exit(0);
}

const argValue = (name, fallback) => {
  const index = process.argv.indexOf(name);
  if (index < 0) return fallback;
  const value = process.argv[index + 1];
  if (value === undefined || value.startsWith("--")) {
    throw new Error(`${name} requires a value`);
  }
  return value;
};

const RESEARCH = resolve(argValue("--root", join(REPO, "research")));
const MONO = join(RESEARCH, "1910.06389v2-llm", "figures");

/**
 * crop: [x0, y0, x1, y1] as fractions of the source image, origin top-left, or null for whole.
 * Fractions rather than pixels so a re-render of the source at a different dpi still works.
 */
const TARGETS = [
  {
    id: "fig7-vs-mono10p7-fern",
    ours: join(FIGS, "fig7-render.png"),
    real: join(MONO, "fig-10.7", "visual.png"),
    crop: [0.0, 0.56, 0.52, 1.0],
    note: "our Fig. 7 fern vs Libbrecht 10.7 (lower left): symmetric fernlike stellar dendrite",
  },
  {
    id: "fig9v2-vs-mono10p7-sectored",
    ours: join(FIGS, "fig9v2-render.png"),
    real: join(MONO, "fig-10.7", "visual.png"),
    crop: [0.53, 0.56, 1.0, 1.0],
    note: "our Fig. 9-v2 sectored plate vs Libbrecht 10.7 (lower right): broad ridged plate star",
  },
  {
    id: "fig7-vs-mono10p7-large",
    ours: join(FIGS, "fig7-render.png"),
    real: join(MONO, "fig-10.7", "visual.png"),
    crop: [0.0, 0.0, 1.0, 0.55],
    note: "our Fig. 7 fern vs Libbrecht 10.7 (top): large asymmetric fernlike dendrite",
  },
  {
    // Grown for this target, not selected from the catalogue: stage 1 branches, stage 2
    // switches to plate-forming thresholds so the arm tips facet over. See specs/bentley872.json.
    id: "gen872v1-vs-bentley872",
    ours: join(OUT, "gen", "renders", "bentley872-render.png"),
    real: join(PHOTOS, "Bentley_Snowflake_872.jpg"),
    crop: null,
    note: "staged attempt v1 (branch -> terminal plates) vs Bentley 872",
  },
  {
    // The plan recorded Bentley 785 as unmatchable: its central medallion records a
    // plate-then-branch history that constant-parameter G-G cannot produce. This is that
    // history run as an explicit schedule. See specs/bentley785.json.
    id: "gen785v1-vs-bentley785",
    ours: join(OUT, "gen", "renders", "bentley785-render.png"),
    real: join(PHOTOS, "Bentley_Snowflake_785.jpg"),
    crop: null,
    note: "staged attempt v1 (extended plate core -> branching) vs Bentley 785",
  },
  {
    id: "fig32-vs-mono12p3-pond",
    ours: join(FIGS, "fig32-render.png"),
    real: join(MONO, "fig-12.3", "visual.png"),
    crop: null,
    note: "our Fig. 32 plate-with-dendritic-extensions vs Libbrecht 12.3: pond surface crystal",
  },
];

const only = argValue("--only", null);

if (process.argv.includes("--print-inputs")) {
  console.log(
    JSON.stringify(
      TARGETS.filter((target) => only === null || target.id === only).map(({ id, ours, real }) => ({
        id,
        ours,
        real,
      })),
      null,
      2,
    ),
  );
  process.exit(0);
}

function ffprobeSize(path) {
  const r = spawnSync(
    "ffprobe",
    ["-v", "error", "-select_streams", "v", "-show_entries", "stream=width,height", "-of", "csv=p=0", path],
    { encoding: "utf8" },
  );
  if (r.status !== 0) throw new Error(`ffprobe failed for ${path}: ${r.stderr}`);
  const [w, h] = r.stdout.trim().split(",").map(Number);
  return { w, h };
}

function run(args) {
  const r = spawnSync("ffmpeg", args, { encoding: "utf8" });
  if (r.status !== 0) throw new Error(`ffmpeg failed: ${r.stderr.split("\n").slice(-6).join("\n")}`);
}

const sha = (p) => createHash("sha256").update(readFileSync(p)).digest("hex");

mkdirSync(PHOTOS, { recursive: true });
const tmp = join(PHOTOS, ".match-tmp");
mkdirSync(tmp, { recursive: true });

const results = [];
try {
  for (const t of TARGETS) {
    if (only !== null && t.id !== only) continue;
    for (const p of [t.ours, t.real]) {
      if (!existsSync(p)) throw new Error(`missing input: ${p}`);
    }

    // 1. Crop the single crystal out of the source figure.
    let realPath = t.real;
    if (t.crop !== null) {
      const { w, h } = ffprobeSize(t.real);
      const [x0, y0, x1, y1] = t.crop;
      // Round to even pixels: some encoders reject odd dimensions, and it keeps the
      // fraction -> pixel mapping stable across source re-renders.
      const even = (n) => Math.max(2, Math.round(n / 2) * 2);
      const cw = even((x1 - x0) * w);
      const ch = even((y1 - y0) * h);
      const cx = Math.round(x0 * w);
      const cy = Math.round(y0 * h);
      realPath = join(tmp, `${t.id}-real.png`);
      run(["-y", "-loglevel", "error", "-i", t.real, "-vf", `crop=${cw}:${ch}:${cx}:${cy}`, realPath]);
    }

    // 2. Match heights, then stack ours | real. Pad rather than stretch so neither crystal's
    //    aspect ratio is distorted — a squashed comparison is a misleading comparison.
    const out = join(PHOTOS, `side-by-side-${t.id}.png`);
    const H = 1000;
    run([
      "-y", "-loglevel", "error",
      "-i", t.ours, "-i", realPath,
      "-filter_complex",
      `[0:v]scale=-1:${H}:force_original_aspect_ratio=decrease,pad=iw:${H}:(ow-iw)/2:(oh-ih)/2:color=0x101828[l];` +
        `[1:v]scale=-1:${H}:force_original_aspect_ratio=decrease,pad=iw:${H}:(ow-iw)/2:(oh-ih)/2:color=0x101828[r];` +
        `[l][r]hstack=inputs=2`,
      out,
    ]);
    const { w, h } = ffprobeSize(out);
    results.push({ id: t.id, out, w, h, sha: sha(out), note: t.note });
    console.log(`${t.id}\n  ${w}x${h}  sha256 ${sha(out)}\n  ${t.note}`);
  }
} finally {
  rmSync(tmp, { recursive: true, force: true });
}

console.log(`\n${results.length} composite(s) -> out/gutcheck-gg-realism/photos/`);
