// Verify one exact three-fleet visual decision and fill the 66 final direct catalog slots.
// The production decision file does not exist until all real outputs have passed visual review.
//
// node scripts/named-crystal-final-direct-accept.ts

import { createHash } from "node:crypto";
import { readFileSync, renameSync, statSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

import { decodeGrowthAssetV1 } from "../app/src/growth-asset.ts";
import {
  parseNamedCrystalCatalog,
  renderNamedCrystalCatalogTable,
  summarizeNamedCrystalCatalog,
} from "./named-crystal-catalog.ts";

const REPO = resolve(import.meta.dirname, "..");
const DEFAULT_DECISIONS = join(REPO, "docs", "named-snow-crystal-final-direct-decisions.json");
const DEFAULT_CATALOG = join(REPO, "docs", "named-snow-crystal-catalog.json");
const DEFAULT_TABLE = join(REPO, "docs", "named-snow-crystal-catalog.md");
const DEFAULT_REVIEW = join(REPO, "docs", "named-snow-crystal-final-direct-review.json");
const SLOTS = ["lower", "baseline", "upper"] as const;
type Slot = typeof SLOTS[number];
type FleetId = "a" | "b" | "c";

const EXPECTED_TYPES: Readonly<Record<FleetId, readonly string[]>> = {
  a: [
    "simple-prisms", "hexagonal-plates", "hollow-columns", "stellar-plates",
    "capped-columns", "sectored-plates", "simple-needles", "fernlike-stellar-dendrites",
  ],
  b: [
    "solid-columns", "sheaths", "split-plates-and-stars", "isolated-bullets",
    "scrolls-on-plates", "triangular-forms", "cups", "hollow-plates",
  ],
  c: [
    "columns-on-plates", "skeletal-forms", "simple-stars", "stellar-dendrites",
    "double-plates", "capped-bullets",
  ],
};
const CAPPED_BULLET_STOPS = [2750, 3000, 3250, 3500, 3750, 4000, 4500, 5000, 5500] as const;

interface IdentityWire {
  readonly path: string;
  readonly byteLength: number;
  readonly sha256: string;
}

interface FamilyDecisionWire {
  readonly typeId: string;
  readonly rationale: string;
  readonly selectedJobIds: readonly string[];
}

interface FleetDecisionWire {
  readonly fleet: FleetId;
  readonly report: IdentityWire;
  readonly contactSheet: IdentityWire;
  readonly verticalClearance: IdentityWire;
  readonly families: readonly FamilyDecisionWire[];
}

interface DecisionsWire {
  readonly format: "named-crystal-final-direct-decisions-v1";
  readonly reviewedAt: string;
  readonly fleets: readonly FleetDecisionWire[];
}

interface ProductWire {
  readonly webDecoder: string;
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
  readonly typeName: string;
  readonly slot: Slot;
  readonly sourceLane: string;
  readonly sourceJobId: string;
  readonly sourceSpecSha256: string;
  readonly specSha256: string;
  readonly driverName: string;
  readonly driverValue: number;
  readonly dims: readonly [number, number, number];
  readonly reviewViews: readonly string[];
  readonly exitCode: number;
  readonly products: ProductWire;
  readonly failure: string | null;
}

interface ReportWire {
  readonly format: "named-crystal-direct-production-report-v1";
  readonly launch: {
    readonly requestedProcessConcurrency: number;
    readonly actualWorkerCount: number;
  };
  readonly completed: number;
  readonly failed: number;
  readonly missing: number;
  readonly webSummary: {
    readonly limitBytes: number;
    readonly allDecoderVerified: boolean;
  };
  readonly scientificSummary: {
    readonly minimumFrameCount: number;
    readonly maximumFrameCount: number;
  };
  readonly results: readonly ResultWire[];
}

interface ClearanceWire {
  readonly format: string;
  readonly gate: { readonly typeIds: readonly string[] };
  readonly requiredResults: number;
  readonly results: readonly {
    readonly jobId: string;
    readonly typeId: string;
    readonly passed: boolean;
  }[];
}

interface SelectedResult {
  readonly fleet: FleetId;
  readonly decision: FamilyDecisionWire;
  readonly result: ResultWire;
  readonly acceptedSlot: Slot;
  readonly root: string;
  readonly webPath: string;
}

export interface FinalDirectAcceptanceResult {
  readonly acceptedFamilies: number;
  readonly acceptedVariants: number;
  readonly remainingVariants: number;
  readonly reviewPath: string;
}

const sha256 = (bytes: Uint8Array | string): string => createHash("sha256").update(bytes).digest("hex");
const isSha256 = (value: unknown): value is string =>
  typeof value === "string" && /^[0-9a-f]{64}$/.test(value);
const canonicalJson = (value: unknown): string => `${JSON.stringify(value, null, 2)}\n`;
const webPath = (value: string): string => value.replaceAll("\\", "/");

const verifyIdentity = (repo: string, identity: IdentityWire, label: string): Uint8Array => {
  if (
    typeof identity.path !== "string" || identity.path.trim() === ""
    || !Number.isSafeInteger(identity.byteLength) || identity.byteLength < 1
    || !isSha256(identity.sha256)
  ) {
    throw new Error(`${label} has a malformed identity`);
  }
  const target = resolve(repo, identity.path);
  if (
    isAbsolute(identity.path)
    || identity.path.split(/[\\/]/u).includes("..")
    || (target !== repo && !target.startsWith(`${repo}${sep}`))
  ) {
    throw new Error(`${label} must be repository-relative and contained`);
  }
  const bytes = readFileSync(target);
  if (bytes.byteLength !== identity.byteLength || sha256(bytes) !== identity.sha256) {
    throw new Error(`${label} identity drift`);
  }
  return bytes;
};

const sameSet = (actual: readonly string[], expected: readonly string[]): boolean =>
  actual.length === expected.length && [...actual].sort().join("\0") === [...expected].sort().join("\0");

const verifyReport = (bytes: Uint8Array, fleet: FleetId): ReportWire => {
  const report = JSON.parse(Buffer.from(bytes).toString()) as ReportWire;
  if (
    report.format !== "named-crystal-direct-production-report-v1"
    || report.completed !== 24 || report.failed !== 0 || report.missing !== 0
    || report.launch.requestedProcessConcurrency !== 24 || report.launch.actualWorkerCount !== 24
    || report.webSummary.limitBytes !== 20_000_000 || report.webSummary.allDecoderVerified !== true
    || report.scientificSummary.minimumFrameCount < 100
    || report.scientificSummary.maximumFrameCount > 122
    || !Array.isArray(report.results) || report.results.length !== 24
    || new Set(report.results.map(({ jobId }) => jobId)).size !== 24
  ) {
    throw new Error(`Fleet ${fleet.toUpperCase()} report does not satisfy final direct production`);
  }
  const expectedTypes = EXPECTED_TYPES[fleet];
  if (!sameSet([...new Set(report.results.map(({ typeId }) => typeId))], expectedTypes)) {
    throw new Error(`Fleet ${fleet.toUpperCase()} report type set drift`);
  }
  for (const result of report.results) {
    if (
      result.exitCode !== 0 || result.failure !== null
      || result.products.webDecoder !== "decodeGrowthAssetV1"
      || result.products.webByteLength >= 20_000_000
      || result.products.frameCount < 100 || result.products.frameCount > 122
      || !isSha256(result.products.webSha256) || !isSha256(result.products.stateSha256)
      || !isSha256(result.products.bundleTreeSha256)
      || result.products.bundleFileCount < 1 || result.products.bundleBytes < 1
      || !isSha256(result.specSha256) || !isSha256(result.sourceSpecSha256)
    ) {
      throw new Error(`${result.jobId}: result is not eligible for final direct acceptance`);
    }
  }
  return report;
};

const verifyClearance = (
  bytes: Uint8Array,
  fleet: FleetId,
  report: ReportWire,
): ClearanceWire => {
  const clearance = JSON.parse(Buffer.from(bytes).toString()) as ClearanceWire;
  const validFormat = fleet === "c"
    ? clearance.format === "named-crystal-final-resolution-vertical-clearance-c-v1"
    : clearance.format === "named-crystal-final-resolution-vertical-clearance-v1";
  if (
    !validFormat || !Array.isArray(clearance.gate?.typeIds) || !Array.isArray(clearance.results)
    || clearance.requiredResults !== clearance.results.length
    || new Set(clearance.results.map(({ jobId }) => jobId)).size !== clearance.results.length
    || clearance.results.some(({ passed }) => passed !== true)
  ) {
    throw new Error(`Fleet ${fleet.toUpperCase()} clearance report is incomplete or failed`);
  }
  const expected = report.results.filter(({ typeId }) => clearance.gate.typeIds.includes(typeId));
  if (!sameSet(clearance.results.map(({ jobId }) => jobId), expected.map(({ jobId }) => jobId))) {
    throw new Error(`Fleet ${fleet.toUpperCase()} clearance rows do not cover every registered vertical job`);
  }
  return clearance;
};

const selectedForFleet = (
  repo: string,
  fleetDecision: FleetDecisionWire,
  report: ReportWire,
): readonly SelectedResult[] => {
  const expectedTypes = EXPECTED_TYPES[fleetDecision.fleet];
  if (
    fleetDecision.families.length !== expectedTypes.length
    || !sameSet(fleetDecision.families.map(({ typeId }) => typeId), expectedTypes)
  ) {
    throw new Error(`Fleet ${fleetDecision.fleet.toUpperCase()} decision family set drift`);
  }
  const selected: SelectedResult[] = [];
  for (const decision of fleetDecision.families) {
    if (typeof decision.rationale !== "string" || decision.rationale.trim() === "") {
      throw new Error(`${decision.typeId}: morphology rationale is missing`);
    }
    const familyResults = report.results.filter(({ typeId }) => typeId === decision.typeId);
    const chosen = decision.selectedJobIds.map((jobId) => {
      const result = familyResults.find((candidate) => candidate.jobId === jobId);
      if (result === undefined) throw new Error(`${decision.typeId}: selected job ${jobId} is not in its report`);
      return result;
    });
    if (new Set(chosen.map(({ jobId }) => jobId)).size !== 3) {
      throw new Error(`${decision.typeId}: exactly three unique jobs must be selected`);
    }
    let acceptedSlots: readonly Slot[];
    if (decision.typeId === "capped-bullets") {
      const ordered = [...chosen].sort((left, right) => left.driverValue - right.driverValue);
      const indices = ordered.map(({ driverValue }) => CAPPED_BULLET_STOPS.indexOf(
        driverValue as (typeof CAPPED_BULLET_STOPS)[number],
      ));
      if (
        ordered.some(({ driverName }) => driverName !== "stop-tick")
        || indices.some((index) => index < 0)
        || indices[1] !== indices[0]! + 1 || indices[2] !== indices[1]! + 1
      ) {
        throw new Error("capped-bullets: selected stops must be three adjacent registered candidates");
      }
      chosen.splice(0, chosen.length, ...ordered);
      acceptedSlots = SLOTS;
    } else {
      if (!sameSet(chosen.map(({ slot }) => slot), SLOTS)) {
        throw new Error(`${decision.typeId}: selected jobs must be lower/baseline/upper`);
      }
      chosen.sort((left, right) => SLOTS.indexOf(left.slot) - SLOTS.indexOf(right.slot));
      acceptedSlots = chosen.map(({ slot }) => slot);
    }
    for (const [index, result] of chosen.entries()) {
      const root = dirname(resolve(repo, fleetDecision.report.path));
      const assetPath = join(root, result.jobId, "growth-v1.bin");
      const bytes = readFileSync(assetPath);
      if (bytes.byteLength !== result.products.webByteLength || sha256(bytes) !== result.products.webSha256) {
        throw new Error(`${result.jobId}: selected web asset identity drift`);
      }
      decodeGrowthAssetV1(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
      selected.push({
        fleet: fleetDecision.fleet,
        decision,
        result,
        acceptedSlot: acceptedSlots[index]!,
        root,
        webPath: assetPath,
      });
    }
  }
  return selected;
};

const writeAtomic = (path: string, bytes: string): void => {
  const temporary = `${path}.tmp-${process.pid}`;
  writeFileSync(temporary, bytes);
  renameSync(temporary, path);
};

const variationUnit = (driver: string): string => {
  if (driver === "rho-scale") return "multiplier";
  if (driver === "stop-tick") return "ticks";
  if (driver === "cavity-radius") return "lattice sites";
  throw new Error(`unknown direct variation driver ${driver}`);
};

export function acceptFinalDirectCatalog(
  decisionsPath = DEFAULT_DECISIONS,
  catalogPath = DEFAULT_CATALOG,
  tablePath = DEFAULT_TABLE,
  reviewPath = DEFAULT_REVIEW,
  repo = REPO,
): FinalDirectAcceptanceResult {
  const decisionBytes = readFileSync(decisionsPath);
  const decisions = JSON.parse(decisionBytes.toString()) as DecisionsWire;
  if (
    decisions.format !== "named-crystal-final-direct-decisions-v1"
    || typeof decisions.reviewedAt !== "string" || decisions.reviewedAt.trim() === ""
    || !Array.isArray(decisions.fleets) || decisions.fleets.length !== 3
    || !sameSet(decisions.fleets.map(({ fleet }) => fleet), ["a", "b", "c"])
  ) {
    throw new Error("final direct decision file is malformed or incomplete");
  }

  const selected: SelectedResult[] = [];
  const fleetReview: Record<string, unknown>[] = [];
  for (const fleet of ["a", "b", "c"] as const) {
    const decision = decisions.fleets.find((candidate) => candidate.fleet === fleet)!;
    const reportBytes = verifyIdentity(repo, decision.report, `Fleet ${fleet.toUpperCase()} report`);
    verifyIdentity(repo, decision.contactSheet, `Fleet ${fleet.toUpperCase()} contact sheet`);
    const clearanceBytes = verifyIdentity(
      repo,
      decision.verticalClearance,
      `Fleet ${fleet.toUpperCase()} clearance report`,
    );
    const report = verifyReport(reportBytes, fleet);
    const clearance = verifyClearance(clearanceBytes, fleet, report);
    const fleetSelected = selectedForFleet(repo, decision, report);
    selected.push(...fleetSelected);
    fleetReview.push({
      fleet,
      report: decision.report,
      contactSheet: decision.contactSheet,
      verticalClearance: decision.verticalClearance,
      generatedJobs: report.results.length,
      acceptedVariants: fleetSelected.length,
      clearanceRows: clearance.results.length,
    });
  }
  if (
    selected.length !== 66 || new Set(selected.map(({ result }) => result.jobId)).size !== 66
    || new Set(selected.map(({ result }) => result.typeId)).size !== 22
  ) {
    throw new Error("final direct decision must select 22 families and 66 unique variants");
  }

  const families = [...new Set(selected.map(({ result }) => result.typeId))].map((typeId) => {
    const variants = selected.filter(({ result }) => result.typeId === typeId);
    if (variants.length !== 3 || !sameSet(variants.map(({ acceptedSlot }) => acceptedSlot), SLOTS)) {
      throw new Error(`${typeId}: accepted direct family is not a complete trio`);
    }
    return {
      typeId,
      status: "accepted" as const,
      rationale: variants[0]!.decision.rationale,
      variants: variants.sort(
        (left, right) => SLOTS.indexOf(left.acceptedSlot) - SLOTS.indexOf(right.acceptedSlot),
      ).map(({ acceptedSlot, result, root, webPath: assetPath }) => ({
        slot: acceptedSlot,
        entryId: result.jobId,
        sourceLane: result.sourceLane,
        sourceJobId: result.sourceJobId,
        sourceSpecSha256: result.sourceSpecSha256,
        specSha256: result.specSha256,
        dims: result.dims,
        variation: {
          driver: result.driverName,
          value: result.driverValue,
          unit: variationUnit(result.driverName),
        },
        frameCount: result.products.frameCount,
        webAsset: {
          path: webPath(relative(repo, assetPath)),
          byteLength: result.products.webByteLength,
          sha256: result.products.webSha256,
        },
        scientificBundle: {
          locator: `${webPath(relative(repo, join(root, result.jobId)))}/`,
          identitySha256: result.products.bundleTreeSha256,
          byteLength: result.products.bundleBytes,
          fileCount: result.products.bundleFileCount,
          stateSha256: result.products.stateSha256,
        },
      })),
    };
  });

  const rawCatalog = JSON.parse(readFileSync(catalogPath, "utf8")) as {
    entries: Array<Record<string, unknown>>;
  };
  for (const family of families) {
    const entry = rawCatalog.entries.find((candidate) => candidate.id === family.typeId);
    if (entry === undefined || (entry.route !== "gg" && entry.route !== "gg-plus")) {
      throw new Error(`${family.typeId}: direct catalog target is missing or has a non-direct route`);
    }
    const variants = entry.variants as Record<string, unknown>;
    if (Object.values(variants).some((variant) => variant !== null)) {
      throw new Error(`${family.typeId}: direct catalog target is already occupied`);
    }
    for (const variant of family.variants) {
      const jobRoot = dirname(variant.webAsset.path);
      const fleetRoot = dirname(jobRoot);
      variants[variant.slot] = {
        entryId: variant.entryId,
        variation: variant.variation,
        links: {
          preview: webPath(join(fleetRoot, "review-renders", `${variant.entryId}-tilt55.png`)),
          webAsset: variant.webAsset.path,
          recipeOrScene: `${jobRoot}/spec.json`,
          scientificBundle: variant.scientificBundle.locator,
        },
        webPayloadBytes: variant.webAsset.byteLength,
      };
    }
    entry.note = "Accepted final-resolution direct trio; exact output, clearance and visual identities are in docs/named-snow-crystal-final-direct-review.json.";
  }
  const catalog = parseNamedCrystalCatalog(rawCatalog);
  const summary = summarizeNamedCrystalCatalog(catalog);
  if (summary.acceptedSlots !== 66 || summary.remainingSlots !== 33) {
    throw new Error("final direct transaction did not reach 66 accepted / 33 remaining slots");
  }

  const review = {
    format: "named-crystal-final-direct-review-v1",
    reviewedAt: decisions.reviewedAt,
    decision: {
      path: webPath(relative(repo, decisionsPath)),
      byteLength: decisionBytes.byteLength,
      sha256: sha256(decisionBytes),
    },
    counts: { acceptedFamilies: 22, acceptedVariants: 66, remainingComposeVariants: 33 },
    fleets: fleetReview,
    families,
  };
  const reviewBytes = canonicalJson(review);
  const catalogBytes = canonicalJson(rawCatalog);
  const tableBytes = renderNamedCrystalCatalogTable(catalog, tablePath);
  writeAtomic(reviewPath, reviewBytes);
  writeAtomic(catalogPath, catalogBytes);
  writeAtomic(tablePath, tableBytes);
  return {
    acceptedFamilies: 22,
    acceptedVariants: summary.acceptedSlots,
    remainingVariants: summary.remainingSlots,
    reviewPath,
  };
}

if (process.argv[1] !== undefined && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = acceptFinalDirectCatalog();
  console.log(JSON.stringify(result));
}
