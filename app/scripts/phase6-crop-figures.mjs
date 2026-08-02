// Crop the load-bearing Libbrecht figures out of the page renders into standalone images.
//
// Media in research/ is not versioned (decision 0004) — these crops are a local cache, exactly
// like the PDFs and page renders. research/figures.md is the tracked artifact: it records the
// source paper, page, crop rectangle and sha256 of every image below, so each is reproducible by
// re-running this script.
//
//   node app/scripts/phase6-crop-figures.mjs
//
// Rectangles are fractions of the page (x0, y0, x1, y1), origin top-left, so they are independent
// of render dpi. Rendering is done by PyMuPDF at 300 dpi to match the existing page renders.

import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const OUT = "research/figures";

const CROPS = [
  {
    file: "nakaya-bands-on-sigma0-M1.png",
    paper: "2306.13087v1",
    page: 6,
    rect: [0.52, 0.08, 0.9, 0.43],
    what: "Figure 1 — sigma0(T) for basal and prism in the M1 model, with source-drawn Nakaya habit bands overlaid. The reference-band edges and analytic curve crossings are separate quantities; this crop does not establish a morphology mapping.",
  },
  {
    file: "cak-broad-facet-sigma0-and-A.png",
    paper: "2009.08404v2",
    page: 3,
    rect: [0.52, 0.08, 0.9, 0.63],
    what: "Figure 2 — the CAK broad-facet model: sigma0 (top) and A (bottom) vs (Tm-T) for basal and prism, with source-fit/model-inferred points and error bars rather than independent direct measurements of every plotted parameter. The page also prints Eqs. (2)-(5), the closed forms for both sigma0 curves, A_basal = 1, and A_prism.",
  },
  {
    file: "cak-broad-facet-sigma0-and-A-alt.png",
    paper: "2011.02353v1",
    page: 2,
    rect: [0.52, 0.08, 0.9, 0.63],
    what: "Figure 1 — the same broad-facet CAK parameter figure as above, reprinted in the -4 C SDAK paper. Useful as a cross-check that the two papers show the same curves.",
  },
  {
    file: "sdak-dip-basal-source-inferred-near-minus4C.png",
    paper: "2011.02353v1",
    page: 7,
    rect: [0.52, 0.085, 0.9, 0.45],
    what: "Figure 5 — model-conditioned sigma0_basal_SDAK(T) inversion over -1..-10 C at sigma_inf ~ 8%, showing the inferred basal SDAK dip near -4 C against the broad-facet curves. The witness-surface analysis infers sigma_surf and constrains an attachment-coefficient ratio; the dotted line is an eye guide, not a fit.",
  },
  {
    file: "sdak-dip-prism-source-inferred-near-minus14C.png",
    paper: "2009.08404v2",
    page: 15,
    rect: [0.52, 0.08, 0.9, 0.46],
    what: "Figure 18 — model-conditioned sigma0_prism_SDAK(T) inversion over -5..-40 C at sigma_far = 32%, showing the inferred prism SDAK dip near -13/-14 C against the broad-facet curves. The witness-surface analysis infers sigma_surf and constrains a ratio; this is one far-field condition and the fit fails at the peak.",
  },
  {
    file: "sdak2-two-branch-table.png",
    paper: "2306.04042v1",
    page: 9,
    rect: [0.1, 0.61, 0.5, 0.79],
    what: "Table 1 — the SDAK-2 two-branch (A, sigma0) prism attachment kinetics, -1 to -15 C, plus v_kin(T). sigma0 is a FRACTION here. Branch 1 matches four same-lineage source-fit values at their stated precision; this is not independent experimental reproduction. This is a table, not a plot: usable with no digitization.",
  },
  {
    file: "latent-heating-faceting-vs-growth-rate.png",
    paper: "2306.04042v1",
    page: 10,
    rect: [0.1, 0.08, 0.9, 0.47],
    what: "Figures 2 and 3 — degree of prism faceting R/r_corner vs prism growth velocity at -1..-15 C, with latent heating ignored (black) and included (red), for R = 20 um and R = 500 um. Source sensitivity diagnostic only: the stated near-vacuum conditions are not this project's 1 atm configuration, so its onset or magnitude is non-transferable to the Phase 6 runs.",
  },
];

// The 206-observation matrix is already one figure per page; copy the plates whole.
const WHOLE_PAGES = [
  { paper: "2306.13087v1", page: 11, file: "nakaya-206-observations-p1-minus0.5-to-4.5C.png" },
  { paper: "2306.13087v1", page: 12, file: "nakaya-206-observations-p2-minus5-to-10C.png" },
  { paper: "2306.13087v1", page: 13, file: "nakaya-206-observations-p3-minus11-to-16C.png" },
  { paper: "2306.13087v1", page: 14, file: "nakaya-206-observations-p4-minus17-to-24C.png" },
];

mkdirSync(OUT, { recursive: true });

const py = `
import fitz, json, sys
jobs = json.loads(sys.argv[1])
for j in jobs:
    d = fitz.open('research/%s.pdf' % j['paper'])
    p = d[j['page'] - 1]
    r = p.rect
    if j.get('rect'):
        x0, y0, x1, y1 = j['rect']
        clip = fitz.Rect(r.x0 + x0 * r.width, r.y0 + y0 * r.height,
                         r.x0 + x1 * r.width, r.y0 + y1 * r.height)
    else:
        clip = None
    pix = p.get_pixmap(dpi=300, clip=clip, colorspace=fitz.csRGB)
    pix.save('${OUT}/' + j['file'])
    d.close()
    print('%s  %dx%d' % (j['file'], pix.width, pix.height))
`;

const jobs = [...CROPS, ...WHOLE_PAGES].map((c) => ({
  paper: c.paper,
  page: c.page,
  rect: c.rect ?? null,
  file: c.file,
}));

const out = execFileSync("python", ["-c", py, JSON.stringify(jobs)], { encoding: "utf8" });
process.stdout.write(out);

console.log("\nsha256 of each crop (for research/figures.md):\n");
for (const f of readdirSync(OUT).sort()) {
  const p = join(OUT, f);
  const h = createHash("sha256").update(readFileSync(p)).digest("hex");
  console.log(`| \`${f}\` | ${statSync(p).size.toLocaleString()} | \`${h}\` |`);
}
