// Preserve the two scaled production fleets as screening evidence while withdrawing their catalog
// completion credit after the maker's final-resolution clarification.
//
//   node scripts/named-crystal-resolution-supersession.ts

import { createHash } from "node:crypto";
import { readFileSync, statSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

import {
  parseNamedCrystalCatalog,
  renderNamedCrystalCatalogTable,
  summarizeNamedCrystalCatalog,
} from "./named-crystal-catalog.ts";

const REPO = resolve(import.meta.dirname, "..");
const CATALOG_PATH = join(REPO, "docs", "named-snow-crystal-catalog.json");
const TABLE_PATH = join(REPO, "docs", "named-snow-crystal-catalog.md");
const FIRST_REVIEW_PATH = join(REPO, "docs", "named-snow-crystal-direct-production-review.json");
const SECOND_ROOT = join(REPO, "out", "named-crystal-catalog", "direct-production-v2");
const SECOND_REPORT_PATH = join(SECOND_ROOT, "report.json");
const SECOND_CONTACT_PATH = join(SECOND_ROOT, "contact-sheet.png");
const SUPERSESSION_PATH = join(REPO, "docs", "named-snow-crystal-resolution-supersession.json");

const EXPECTED = {
  catalog: {
    byteLength: 36_501,
    sha256: "d56f22a73ca90cb87ff03670d53c950df8049095a7967e8571c9dec22f65357f",
  },
  firstReview: {
    byteLength: 24_369,
    sha256: "931e297d66487ab757a9f2964861e2974c72b0b5e639b8d557cfb9f8fd606b07",
  },
  secondReport: {
    byteLength: 594_644,
    sha256: "f5d30f6e896980a19df9716f5400c207c5c9994dce7fcd3804ec0c2ef97b85e1",
  },
  secondContact: {
    byteLength: 9_983_672,
    sha256: "6e849aab1f49ed1e6e107516e42c27578ed6dee37a3d15e7abde5c92d3e6e578",
  },
} as const;

const MORPHOLOGY_RATIONALE: Readonly<Record<string, string>> = {
  "simple-prisms": "All three views retain a compact thick hexagonal prism without plate branching.",
  "hexagonal-plates": "All three variants retain a thin compact six-sided plate.",
  "hollow-columns": "All three variants are elongated hexagonal columns with an open axial cavity.",
  "stellar-plates": "All three variants retain six broad plate-like stellar arms.",
  "capped-columns": "All three variants retain one central column and a plate cap at each end.",
  "sectored-plates": "All three variants retain a thin plate divided into six broad sectors.",
  "simple-needles": "All three variants are slender axial needles rather than planar habits.",
  "fernlike-stellar-dendrites": "All three variants retain repeated fernlike sidebranching on six arms.",
};
const VERTICAL_TYPES = new Set(["hollow-columns", "simple-needles", "capped-columns"]);
const RESET_NOTE = " Scaled production variants are preserved as morphology screens in named-snow-crystal-resolution-supersession.json; final-resolution replacement is pending.";

interface ProductWire {
  readonly webByteLength: number;
  readonly webSha256: string;
  readonly stateByteLength: number;
  readonly stateSha256: string;
  readonly frameCount: number;
  readonly bundleFileCount: number;
  readonly bundleBytes: number;
  readonly bundleTreeSha256: string;
}

interface ResultWire {
  readonly jobId: string;
  readonly typeId: string;
  readonly slot: "lower" | "baseline" | "upper";
  readonly sourceJobId: string;
  readonly sourceSpecSha256: string;
  readonly specSha256: string;
  readonly driverName: string;
  readonly driverValue: number;
  readonly dims: readonly [number, number, number];
  readonly tickCap: number;
  readonly exitCode: number;
  readonly products: ProductWire;
  readonly failure: string | null;
}

interface ReportWire {
  readonly format: string;
  readonly completed: number;
  readonly failed: number;
  readonly missing: number;
  readonly launch: {
    readonly requestedProcessConcurrency: number;
    readonly actualWorkerCount: number;
  };
  readonly webSummary: {
    readonly minimumBytes: number;
    readonly maximumBytes: number;
    readonly totalBytes: number;
    readonly limitBytes: number;
    readonly allDecoderVerified: boolean;
  };
  readonly scientificSummary: {
    readonly totalBundleBytes: number;
    readonly totalBundleFiles: number;
    readonly minimumFrameCount: number;
    readonly maximumFrameCount: number;
  };
  readonly results: readonly ResultWire[];
}

interface FirstReviewWire {
  readonly families: readonly {
    readonly typeId: string;
    readonly variants: readonly { readonly jobId: string; readonly slot: string }[];
  }[];
}

interface RecordWire {
  readonly dims: { readonly nx: number; readonly ny: number; readonly nz: number };
  readonly mesh: {
    readonly bboxCartesian: { readonly zMin: number; readonly zMax: number };
  };
}

const canonicalJson = (value: unknown): string => `${JSON.stringify(value, null, 2)}\n`;
const sha256 = (bytes: Uint8Array): string => createHash("sha256").update(bytes).digest("hex");

const verifyIdentity = (path: string, expected: { byteLength: number; sha256: string }): Uint8Array => {
  const bytes = readFileSync(path);
  const actual = { byteLength: statSync(path).size, sha256: sha256(bytes) };
  if (actual.byteLength !== expected.byteLength || actual.sha256 !== expected.sha256) {
    throw new Error(`${path}: identity drift; got ${actual.byteLength} / ${actual.sha256}`);
  }
  return bytes;
};

const firstReviewBytes = verifyIdentity(FIRST_REVIEW_PATH, EXPECTED.firstReview);
const secondReportBytes = verifyIdentity(SECOND_REPORT_PATH, EXPECTED.secondReport);
verifyIdentity(SECOND_CONTACT_PATH, EXPECTED.secondContact);
const catalogBytes = verifyIdentity(CATALOG_PATH, EXPECTED.catalog);

const firstReview = JSON.parse(firstReviewBytes.toString()) as FirstReviewWire;
const report = JSON.parse(secondReportBytes.toString()) as ReportWire;
if (
  report.format !== "named-crystal-direct-production-report-v1" ||
  report.completed !== 24 || report.failed !== 0 || report.missing !== 0 ||
  report.launch.requestedProcessConcurrency !== 24 || report.launch.actualWorkerCount !== 24 ||
  report.webSummary.limitBytes !== 20_000_000 || !report.webSummary.allDecoderVerified ||
  report.results.length !== 24
) {
  throw new Error("second production report does not match the registered successful screen");
}
if (report.results.some((result) => result.exitCode !== 0 || result.failure !== null)) {
  throw new Error("second production report contains a failed result");
}

const secondFamilies = [...new Set(report.results.map(({ typeId }) => typeId))].sort();
if (secondFamilies.length !== 8 || secondFamilies.some((typeId) => MORPHOLOGY_RATIONALE[typeId] === undefined)) {
  throw new Error("second production report has an unexpected family set");
}
const familyReviews = secondFamilies.map((typeId) => {
  const variants = report.results
    .filter((result) => result.typeId === typeId)
    .sort((left, right) => left.slot.localeCompare(right.slot))
    .map((result) => {
      const recordPath = join(SECOND_ROOT, result.jobId, "record.json");
      const recordBytes = readFileSync(recordPath);
      const record = JSON.parse(recordBytes.toString()) as RecordWire;
      if ([record.dims.nx, record.dims.ny, record.dims.nz].join(",") !== result.dims.join(",")) {
        throw new Error(`${result.jobId}: record dimension drift`);
      }
      const lowerClearance = record.mesh.bboxCartesian.zMin;
      const upperClearance = record.dims.nz - record.mesh.bboxCartesian.zMax;
      return {
        jobId: result.jobId,
        slot: result.slot,
        sourceJobId: result.sourceJobId,
        sourceSpecSha256: result.sourceSpecSha256,
        specSha256: result.specSha256,
        driverName: result.driverName,
        driverValue: result.driverValue,
        dims: result.dims,
        tickCap: result.tickCap,
        webByteLength: result.products.webByteLength,
        webSha256: result.products.webSha256,
        stateByteLength: result.products.stateByteLength,
        stateSha256: result.products.stateSha256,
        meshStateCount: result.products.frameCount,
        bundleFileCount: result.products.bundleFileCount,
        bundleBytes: result.products.bundleBytes,
        bundleTreeSha256: result.products.bundleTreeSha256,
        record: {
          path: `out/named-crystal-catalog/direct-production-v2/${result.jobId}/record.json`,
          byteLength: recordBytes.byteLength,
          sha256: sha256(recordBytes),
        },
        verticalClearance: VERTICAL_TYPES.has(typeId)
          ? { lowerLayers: lowerClearance, upperLayers: upperClearance }
          : null,
      };
    });
  if (variants.length !== 3 || variants.map(({ slot }) => slot).join(",") !== "baseline,lower,upper") {
    throw new Error(`${typeId}: expected one baseline/lower/upper trio`);
  }
  return {
    typeId,
    status: "morphology-screen-pass-resolution-superseded",
    rationale: MORPHOLOGY_RATIONALE[typeId],
    variants,
  };
});

const rawCatalog = JSON.parse(catalogBytes.toString()) as {
  entries: Array<{
    id: string;
    note: string;
    variants: Record<string, unknown>;
  }>;
};
const parsedBefore = parseNamedCrystalCatalog(rawCatalog);
if (summarizeNamedCrystalCatalog(parsedBefore).acceptedSlots !== 24) {
  throw new Error("catalog no longer contains the expected 24 scaled accepted slots");
}
const firstFamilyIds = new Set(firstReview.families.map(({ typeId }) => typeId));
if (firstFamilyIds.size !== 8) throw new Error("first review family set drift");
for (const family of firstReview.families) {
  const entry = rawCatalog.entries.find(({ id }) => id === family.typeId);
  if (entry === undefined) throw new Error(`${family.typeId}: catalog entry missing`);
  for (const variant of family.variants) {
    const accepted = entry.variants[variant.slot] as { entryId?: unknown } | null;
    if (accepted?.entryId !== variant.jobId) {
      throw new Error(`${family.typeId}/${variant.slot}: catalog/review identity drift`);
    }
    entry.variants[variant.slot] = null;
  }
  if (!entry.note.endsWith(RESET_NOTE.trimStart())) entry.note += RESET_NOTE;
}
const parsedAfter = parseNamedCrystalCatalog(rawCatalog);
const summary = summarizeNamedCrystalCatalog(parsedAfter);
if (summary.acceptedSlots !== 0 || summary.remainingSlots !== 99) {
  throw new Error("resolution supersession did not reset catalog completion credit");
}

const supersession = {
  format: "named-crystal-resolution-supersession-v1",
  decidedAt: "2026-08-30",
  reason: "Maker requires established large scientific domains; scaled runs remain screening evidence only.",
  firstProductionReview: {
    path: "docs/named-snow-crystal-direct-production-review.json",
    ...EXPECTED.firstReview,
    priorAcceptedVariants: 24,
    disposition: "morphology-screen-pass-resolution-superseded",
  },
  secondProductionScreen: {
    report: {
      path: "out/named-crystal-catalog/direct-production-v2/report.json",
      ...EXPECTED.secondReport,
    },
    contactSheet: {
      path: "out/named-crystal-catalog/direct-production-v2/contact-sheet.png",
      ...EXPECTED.secondContact,
      views: ["face-0-degrees", "oblique-55-degrees", "axial-85-degrees"],
    },
    executionSummary: {
      requestedProcessConcurrency: report.launch.requestedProcessConcurrency,
      actualWorkerCount: report.launch.actualWorkerCount,
      completed: report.completed,
      failed: report.failed,
      minimumWebBytes: report.webSummary.minimumBytes,
      maximumWebBytes: report.webSummary.maximumBytes,
      totalWebBytes: report.webSummary.totalBytes,
      webPayloadLimitBytes: report.webSummary.limitBytes,
      allWebAssetsDecoderVerified: report.webSummary.allDecoderVerified,
      totalScientificBundleBytes: report.scientificSummary.totalBundleBytes,
      totalScientificBundleFiles: report.scientificSummary.totalBundleFiles,
      minimumMeshStateCount: report.scientificSummary.minimumFrameCount,
      maximumMeshStateCount: report.scientificSummary.maximumFrameCount,
    },
    families: familyReviews,
  },
  catalogAfterSupersession: summary,
  preservation: "No run, scientific bundle, web payload, review render, or earlier tracked review was deleted.",
};

writeFileSync(SUPERSESSION_PATH, canonicalJson(supersession));
writeFileSync(CATALOG_PATH, canonicalJson(rawCatalog));
writeFileSync(TABLE_PATH, renderNamedCrystalCatalogTable(parsedAfter, TABLE_PATH));
console.log(JSON.stringify({ supersession: SUPERSESSION_PATH, ...summary }));
