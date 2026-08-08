// Build a self-contained work pack: drop it on another machine, run one script, copy the
// results back. No repo, no git, no npm install, no docs.
//
//   node scripts/gutcheck-make-workpack.mjs [--out <dir>] [--concurrency 56] [--dims 500,500,96]
//        [--ticks 30000] [--frames-every 120] [--spacing 0.8] [--only <substring>]
//
// This works because the solver has ZERO external runtime dependencies: @vcc/core and
// @vcc/solver-cpu are plain TypeScript whose package exports point straight at src/index.ts.
// The pack ships their sources plainly and rewrites the @vcc/* imports to relative paths, so
// there is no npm install and no network. Only prerequisite: Node >= 23.6, which is what
// strips the TypeScript types at run time.
//
// What comes back: results/gen/*-record.json (+ logs), results/large/gen/*-mesh.bin, and
// results/large/anim/<id>/ timelines. Those drop straight into out/gutcheck-gg-realism/.

import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const arg = (n, d) => {
  const i = process.argv.indexOf(`--${n}`);
  return i >= 0 && process.argv[i + 1] !== undefined ? process.argv[i + 1] : d;
};

const REPO = resolve(import.meta.dirname, "..");
const out = resolve(arg("out", "out/gutcheck-gg-realism/workpack"));
const concurrency = arg("concurrency", "56");
const dims = arg("dims", "500,500,96");
const ticks = arg("ticks", "30000");
const framesEvery = arg("frames-every", "120");
const spacing = arg("spacing", "0.8");
const only = arg("only", null);

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

// 1. The two solver packages, as plain directories — NOT under node_modules.
//
// The obvious packaging (ship them as node_modules/@vcc/*) does not work: Node refuses to
// strip TypeScript types for anything under node_modules
// (ERR_UNSUPPORTED_NODE_MODULES_TYPE_STRIPPING). It only works in the repo because npm makes
// node_modules/@vcc/core a SYMLINK whose realpath is <repo>/core, outside node_modules — and
// symlinks do not survive a copy to another machine. So the pack carries the sources plainly
// and rewrites the bare @vcc/* specifiers to relative paths below. No node_modules, no npm.
for (const pkg of ["core", "solver-cpu"]) {
  cpSync(join(REPO, pkg, "src"), join(out, pkg, "src"), { recursive: true });
}

// 2. The scripts that actually do the work.
mkdirSync(join(out, "scripts"), { recursive: true });
for (const f of ["gutcheck-grow-params.ts", "gutcheck-mesh-lib.ts", "gutcheck-grow-batch.mjs"]) {
  cpSync(join(REPO, "scripts", f), join(out, "scripts", f));
}

// 3. Rewrite cross-package imports. Only three files inside solver-cpu/src reach for
//    @vcc/core, and core/src imports nothing, so the mapping is uniform per directory.
const REWRITES = [
  { dir: join(out, "scripts"), core: "../core/src/index.ts", solver: "../solver-cpu/src/index.ts" },
  { dir: join(out, "solver-cpu", "src"), core: "../../core/src/index.ts", solver: null },
];
let rewritten = 0;
for (const { dir, core, solver } of REWRITES) {
  for (const f of readdirSync(dir)) {
    if (!f.endsWith(".ts") && !f.endsWith(".mjs")) continue;
    const p = join(dir, f);
    const before = readFileSync(p, "utf8");
    let after = before.replaceAll('"@vcc/core"', JSON.stringify(core));
    if (solver !== null) after = after.replaceAll('"@vcc/solver-cpu"', JSON.stringify(solver));
    if (after !== before) {
      writeFileSync(p, after);
      rewritten++;
    }
  }
}
// Fail loudly rather than shipping a pack that dies on the other machine.
for (const { dir } of REWRITES) {
  for (const f of readdirSync(dir)) {
    if (!f.endsWith(".ts") && !f.endsWith(".mjs")) continue;
    if (readFileSync(join(dir, f), "utf8").includes("@vcc/")) {
      throw new Error(`unrewritten @vcc/ specifier left in ${join(dir, f)}`);
    }
  }
}

// 4. The specs to grow. Anything already finished here is excluded so the remote machine does
//    not redo work — pass --only to narrow further.
const specsSrc = join(REPO, "out/gutcheck-gg-realism/specs");
const genDir = join(REPO, "out/gutcheck-gg-realism/gen");
const animDir = join(REPO, "out/gutcheck-gg-realism/large/anim");
mkdirSync(join(out, "specs"), { recursive: true });
let packed = 0;
const skipped = [];
for (const f of readdirSync(specsSrc).sort()) {
  if (!f.endsWith(".json")) continue;
  const id = f.replace(/\.json$/, "");
  if (only !== null && !id.includes(only)) continue;
  // Skip anything whose timeline is already complete locally.
  const manifest = join(animDir, id, "manifest.json");
  if (existsSync(manifest)) {
    try {
      if (JSON.parse(readFileSync(manifest, "utf8")).complete === true) {
        skipped.push(id);
        continue;
      }
    } catch {
      /* partial — let the remote machine redo it */
    }
  }
  cpSync(join(specsSrc, f), join(out, "specs", f));
  packed++;
}
// 5. Package marker so Node treats .ts/.mjs here as ESM.
writeFileSync(
  join(out, "package.json"),
  JSON.stringify({ name: "gutcheck-workpack", private: true, type: "module" }, null, 1),
);

// 6. The one thing to run. Batch writes into results/ so the whole folder is the deliverable.
const args =
  `--specs-dir specs --out-root results --concurrency ${concurrency} --dims ${dims} ` +
  `--ticks ${ticks} --frames-every ${framesEvery} --spacing ${spacing}`;

writeFileSync(
  join(out, "RUN.cmd"),
  [
    "@echo off",
    "cd /d %~dp0",
    "node --version",
    `node scripts\\gutcheck-grow-batch.mjs ${args}`,
    "echo.",
    "echo Done. Copy the results folder back.",
    "pause",
  ].join("\r\n") + "\r\n",
);
writeFileSync(
  join(out, "run.sh"),
  ["#!/bin/sh", 'cd "$(dirname "$0")"', "node --version", `node scripts/gutcheck-grow-batch.mjs ${args}`].join("\n") + "\n",
);

// Deliberately terse: the ask was "no context or docs, just scripts and hit run".
writeFileSync(
  join(out, "READ-ME-FIRST.txt"),
  [
    "Needs Node 23.6 or newer (24 recommended). Nothing else - no npm install, no network.",
    "",
    "  Windows : double-click RUN.cmd",
    "  Other   : sh run.sh",
    "",
    `${packed} crystals to grow, ${concurrency} at a time, ${dims}, up to ${ticks} ticks.`,
    "Each takes roughly 2-3 hours; the whole set runs unattended.",
    "",
    "Safe to stop and re-run: finished crystals are skipped, unfinished ones restart.",
    "",
    "When it finishes, copy the whole results\\ folder back. That is the only output.",
  ].join("\r\n") + "\r\n",
);

console.log(`work pack -> ${out}`);
console.log(`  ${rewritten} files import-rewritten`);
console.log(`  ${packed} specs packed${skipped.length ? `, ${skipped.length} skipped (already done here)` : ""}`);
console.log(`  run: ${concurrency} concurrent, dims ${dims}, ticks ${ticks}, frames every ${framesEvery}`);
