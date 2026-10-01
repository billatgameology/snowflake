// Bind the current maker-selected 52 growth assets to a conservative visual type audit.
// The command reads existing products only and writes one deterministic tracked inventory.
//
// node scripts/named-crystal-current-audit.ts build \
//   --queue <queue-plus-needles.json> --web-root <growth-assets> \
//   --scientific-root <growth-scientific> --website-index <library/index.json> \
//   --out docs/named-snow-crystal-current-assets.json

import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { parseAnimationQueueManifest } from "../app/src/gutcheck-animation-queue.ts";
import { pinnedRecordPath } from "./gutcheck-growth-fleet.ts";

type MatchStrength = "strong" | "near";
type VisualBasis = "face" | "face-and-oblique";

interface Classification {
  readonly typeId: string;
  readonly match: MatchStrength;
  readonly visualBasis: VisualBasis;
  readonly rationale: string;
}

const c = (
  typeId: string,
  match: MatchStrength,
  rationale: string,
  visualBasis: VisualBasis = "face",
): Classification => ({ typeId, match, visualBasis, rationale });

export const CURRENT_CLASSIFICATIONS: Readonly<Record<string, Classification>> = {
  "bentley785": c("stellar-dendrites", "near", "Plate core with six strongly branched arms; more dendritic than a broad stellar plate."),
  "bentley872": c("stellar-plates", "strong", "Six broad terminal-plate arms with elaborate symmetric face markings."),
  "bentley872-v2": c("stellar-plates", "strong", "Broad six-armed plate form retained by the terminal-plate search."),
  "bentley872-v3": c("stellar-plates", "strong", "Six broad faceted petal-like arms and a plate-dominant silhouette."),
  "bentley872-v5": c("stellar-plates", "strong", "Broad plate-like arms with dense but bounded internal markings."),
  "bentley872-v6": c("stellar-plates", "strong", "Broad six-armed plate form with symmetric terminal structure."),
  "fig11": c("simple-prisms", "strong", "Compact thick hexagonal prism with decorated facets but no branching instability.", "face-and-oblique"),
  "fig13": c("fernlike-stellar-dendrites", "strong", "Dense closely spaced sidebranches give all six arms a fernlike outline."),
  "fig15": c("stellar-dendrites", "strong", "Six tree-like arms with clear but comparatively sparse sidebranches."),
  "fig16": c("simple-stars", "strong", "Six slender essentially sidebranch-free arms."),
  "fig17": c("simple-stars", "near", "Sidebranch-free star skeleton, but the blocky sandwich tips make it less canonical."),
  "fig19": c("skeletal-forms", "strong", "Thick faceted arms expose a pronounced internal skeleton and blocky edge-led growth."),
  "fig29": c("simple-needles", "strong", "Extremely elongated slender hexagonal needle.", "face-and-oblique"),
  "fig30": c("hollow-columns", "strong", "Elongated hexagonal column with symmetric hollows at both basal ends.", "face-and-oblique"),
  "fig31": c("skeletal-forms", "strong", "Stubby prism with recessed skeletal markings on basal and prism facets.", "face-and-oblique"),
  "fig32": c("fernlike-stellar-dendrites", "strong", "Plate core with six densely sidebranched fernlike extensions."),
  "fig37": c("capped-columns", "strong", "Central column with a broad simple plate cap at each end.", "face-and-oblique"),
  "fig38": c("capped-columns", "strong", "Central column with a broad sectored plate cap at each end.", "face-and-oblique"),
  "fig39": c("columns-on-plates", "strong", "Planar stellar base carrying multiple true needles rising out of the plane.", "face-and-oblique"),
  "fig40": c("columns-on-plates", "strong", "Narrow stellar base bristling with vertical needle/column growth.", "face-and-oblique"),
  "fig42v2": c("scrolls-on-plates", "near", "Out-of-plane plate wings suggest a route to scrolls, but the blades are not yet curled."),
  "fig44": c("stellar-plates", "strong", "Six broad exploded plate tips with elaborate internal markings."),
  "fig45": c("stellar-plates", "strong", "Six broad rounded hexagonal plate tips form a clear stellar plate."),
  "fig46": c("stellar-plates", "strong", "Broad lace-like terminal plates dominate the six-armed silhouette."),
  "fig47": c("stellar-plates", "strong", "Six widened intricately patterned plate tips remain plate-dominant."),
  "fig6": c("double-plates", "strong", "Oblique and edge views show two close parallel plates with a short central connection.", "face-and-oblique"),
  "fig7": c("stellar-dendrites", "strong", "Six main arms carry dense sidebranches with well-defined ridges."),
  "fig9v2": c("sectored-plates", "strong", "Six broad plate sectors are separated by prominent straight ridges."),
  "staged-branch1-to-plate3-at12000": c("stellar-dendrites", "near", "Unfired branch stage produced a highly branched star, but not a controlled three-member family."),
  "staged-branch1-to-plate3-at3000": c("stellar-plates", "strong", "Early transition broadened all six arms into terminal plate structures."),
  "staged-branch1-to-plate3-at6000": c("stellar-plates", "strong", "Intermediate transition retained six broad plate-dominant arms."),
  "staged-branch1p15-to-plate2p25-at3000": c("stellar-plates", "strong", "Broad symmetric arms with terminal plate growth dominate over sidebranching."),
  "staged-branch1p3-to-plate2p6-at3000": c("stellar-plates", "strong", "Six broad faceted terminal structures produce a stellar plate silhouette."),
  "staged-plate2p25-to-branch1p15-at12000": c("stellar-dendrites", "near", "Late branching leaves a spiky branched stellar form with residual plate structure."),
  "staged-plate2p25-to-branch1p15-at3000": c("stellar-dendrites", "strong", "Early branching produces six separated tree-like arms."),
  "staged-plate2p25-to-branch1p15-at8000": c("stellar-dendrites", "strong", "Six branched arms remain separated despite elaborate central plate history."),
  "staged-plate2p6-to-branch1p3-at3000": c("stellar-plates", "strong", "Broad wedge-like faceted arms retain a plate-dominant outline."),
  "staged-plate2p6-to-branch1p3-at4000": c("stellar-plates", "strong", "Broad plate-like arms with modest terminal branching."),
  "staged-plate3-to-branch1-at12000": c("stellar-dendrites", "strong", "Six separated arms show repeated tree-like terminal growth."),
  "staged-plate3-to-branch1-at3000": c("stellar-dendrites", "strong", "Early branch stage produces six strong dendritic arms."),
  "staged-plate3-to-branch1-at6000": c("stellar-dendrites", "strong", "Intermediate transition yields six separated branched arms."),
  "sweep-t1-r0p1": c("simple-stars", "near", "Open six-arm star is close to the type, but faint lateral growth is visible."),
  "sweep-t1-sharp": c("stellar-dendrites", "strong", "Tree-like arms and sidebranches under the sharpened-tip recipe."),
  "sweep-t1p15-sharp": c("stellar-dendrites", "strong", "Same sharpened-tip family with a modest qualified-threshold increase."),
  "sweep-t1p3-sharp": c("stellar-dendrites", "strong", "Same sharpened-tip family retains branched stellar morphology."),
  "sweep-t1p75-k0p1-m0p001": c("stellar-dendrites", "strong", "Six tree-like arms with visible secondary branching."),
  "sweep-t1p75-k0p1-m0p006": c("stellar-plates", "near", "Broad near-hexagonal plate outline with deep arm notches."),
  "sweep-t2-r0p08": c("hexagonal-plates", "strong", "Thin broad hexagonal plate with shallow edge notches."),
  "sweep-t2-r0p12": c("stellar-plates", "strong", "Broad six-armed plate form with complex symmetric face structure."),
  "sweep-t2p5-k0p001-m0p006": c("hexagonal-plates", "strong", "Thin simple hexagonal plate with little branching."),
  "sweep-t2p5-r0p08": c("hexagonal-plates", "strong", "Thin compact hexagonal plate with concentric facet markings."),
  "sweep-t3-r0p08": c("hexagonal-plates", "strong", "Thin compact hexagonal plate in the same one-parameter family as sweep-t2p5-r0p08."),
};

const sha256 = (bytes: Buffer): string => createHash("sha256").update(bytes).digest("hex");

const argument = (argv: readonly string[], name: string): string => {
  const index = argv.indexOf(`--${name}`);
  const value = index < 0 ? undefined : argv[index + 1];
  if (value === undefined || value === "") throw new Error(`missing --${name} <path>`);
  return resolve(value);
};

interface CurrentAuditAsset {
  readonly id: string;
  readonly label: string;
  readonly sourceRecord: string;
  readonly webAsset: string;
  readonly webBytes: number;
  readonly websiteIncluded: boolean;
  readonly classification: Classification;
}

interface CurrentAudit {
  readonly format: "named-snow-crystal-current-assets-v1";
  readonly summary: {
    readonly assetCount: number;
    readonly websiteEntryCount: number;
    readonly totalWebBytes: number;
    readonly maximumWebBytes: number;
    readonly webPayloadLimitBytes: number;
    readonly strongMatches: number;
    readonly nearMatches: number;
  };
  readonly assets: readonly CurrentAuditAsset[];
}

export const renderCurrentAuditTable = (audit: CurrentAudit, outputPath: string): string => {
  if (audit.format !== "named-snow-crystal-current-assets-v1" || audit.assets.length !== 52) {
    throw new Error("current audit must contain the exact 52-item format");
  }
  const outputDirectory = dirname(outputPath);
  const lines = [
    "# Current 52-animation type audit",
    "",
    "These are visual morphology matches, not accepted lower/baseline/upper catalog slots and not physical-validation claims.",
    "",
    "| Measure | Value |",
    "|---|---:|",
    `| Current assets | ${audit.summary.assetCount} |`,
    `| Website entries | ${audit.summary.websiteEntryCount} |`,
    `| Strong visual matches | ${audit.summary.strongMatches} |`,
    `| Near visual matches | ${audit.summary.nearMatches} |`,
    `| Total web bytes | ${audit.summary.totalWebBytes.toLocaleString("en-US")} |`,
    `| Largest web asset | ${audit.summary.maximumWebBytes.toLocaleString("en-US")} |`,
    `| Per-entry ceiling | < ${audit.summary.webPayloadLimitBytes.toLocaleString("en-US")} bytes |`,
    "",
    "| Current animation | Visual type match | Strength | Web bytes | Website | Source record | Rationale |",
    "|---|---|---|---:|---|---|---|",
  ];
  for (const asset of audit.assets) {
    const recordTarget = relative(outputDirectory, resolve(asset.sourceRecord)).replaceAll("\\", "/");
    lines.push(
      `| ${asset.id} | ${asset.classification.typeId} | ${asset.classification.match} | ${asset.webBytes.toLocaleString("en-US")} | ${asset.websiteIncluded ? "yes" : "no"} | [record](${recordTarget}) | ${asset.classification.rationale.replaceAll("|", "\\|")} |`,
    );
  }
  lines.push(
    "",
    "Generated by `node scripts/named-crystal-current-audit.ts table --audit docs/named-snow-crystal-current-assets.json --out docs/named-snow-crystal-current-assets.md`.",
    "",
  );
  return lines.join("\n");
};

const build = (argv: readonly string[]): void => {
  const queuePath = argument(argv, "queue");
  const webRoot = argument(argv, "web-root");
  const scientificRoot = argument(argv, "scientific-root");
  const websiteIndexPath = argument(argv, "website-index");
  const outputPath = argument(argv, "out");
  const queueBytes = readFileSync(queuePath);
  const queue = parseAnimationQueueManifest(JSON.parse(queueBytes.toString("utf8")) as unknown);
  const websiteBytes = readFileSync(websiteIndexPath);
  const website = JSON.parse(websiteBytes.toString("utf8")) as {
    format?: unknown;
    entries?: Array<{ id?: unknown; file?: unknown; bytes?: unknown }>;
  };
  if (website.format !== "growth-library-v1" || !Array.isArray(website.entries)) {
    throw new Error("website index is not growth-library-v1");
  }
  const websiteIds = new Set(website.entries.map((entry) => String(entry.id)));
  const queueIds = new Set(queue.items.map((item) => item.id));
  const classifiedIds = Object.keys(CURRENT_CLASSIFICATIONS);
  if (
    queue.items.length !== 52
    || classifiedIds.length !== 52
    || classifiedIds.some((id) => !queueIds.has(id))
    || queue.items.some((item) => CURRENT_CLASSIFICATIONS[item.id] === undefined)
  ) {
    throw new Error("classification map and exact 52-item queue are not exhaustive and identical");
  }
  if (websiteIds.size !== 51 || [...queueIds].filter((id) => !websiteIds.has(id)).join("\0") !== "fig6") {
    throw new Error("website index must contain the queue except for fig6");
  }

  const assets = queue.items.map((item) => {
    const webAsset = `${item.id}-growth-v1.bin`;
    const webPath = join(webRoot, webAsset);
    const webBytes = readFileSync(webPath);
    if (webBytes.byteLength >= 20_000_000) throw new Error(`${item.id} reaches the web payload ceiling`);
    const scientificRecord = `${item.id}-record.json`;
    const scientificRecordBytes = readFileSync(join(scientificRoot, scientificRecord));
    return {
      id: item.id,
      label: item.label,
      sourceRecord: pinnedRecordPath(item.id, item.spec),
      preview: item.render,
      webAsset,
      webBytes: webBytes.byteLength,
      webSha256: sha256(webBytes),
      websiteIncluded: websiteIds.has(item.id),
      scientificRecord,
      scientificRecordBytes: scientificRecordBytes.byteLength,
      scientificRecordSha256: sha256(scientificRecordBytes),
      classification: CURRENT_CLASSIFICATIONS[item.id],
    };
  });
  const totalWebBytes = assets.reduce((total, asset) => total + asset.webBytes, 0);
  const maximumWebBytes = Math.max(...assets.map((asset) => asset.webBytes));
  const output = {
    format: "named-snow-crystal-current-assets-v1",
    classificationRevision: "manual-contact-sheet-and-oblique-2026-08-29-v1",
    source: {
      queueFile: basename(queuePath),
      queueBytes: queueBytes.byteLength,
      queueSha256: sha256(queueBytes),
      websiteIndexFile: basename(websiteIndexPath),
      websiteIndexBytes: websiteBytes.byteLength,
      websiteIndexSha256: sha256(websiteBytes),
    },
    summary: {
      assetCount: assets.length,
      websiteEntryCount: websiteIds.size,
      totalWebBytes,
      maximumWebBytes,
      webPayloadLimitBytes: 20_000_000,
      strongMatches: assets.filter((asset) => asset.classification.match === "strong").length,
      nearMatches: assets.filter((asset) => asset.classification.match === "near").length,
    },
    assets,
  };
  writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`);
  console.log(JSON.stringify(output.summary));
};

const table = (argv: readonly string[]): void => {
  const auditPath = argument(argv, "audit");
  const outputPath = argument(argv, "out");
  const audit = JSON.parse(readFileSync(auditPath, "utf8")) as CurrentAudit;
  writeFileSync(outputPath, renderCurrentAuditTable(audit, outputPath));
  console.log(`${audit.assets.length} rows -> ${outputPath}`);
};

const main = (argv: readonly string[]): void => {
  if (argv[0] === "build") build(argv);
  else if (argv[0] === "table") table(argv);
  else {
    throw new Error("usage: named-crystal-current-audit.ts build|table [options]");
  }
};

if (process.argv[1] !== undefined && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2));
}
