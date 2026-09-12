// Verify the exact final Compose visual decision, fill the last 33 slots, and atomically apply the
// two deferred GG+ to Compose route changes. The production decision file is created only after
// real browser capture and visual review.
//
// node scripts/named-crystal-final-compose-accept.ts

import { createHash } from "node:crypto";
import { readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

import { growthSceneColdPayloadBytes, parseGrowthSceneV1 } from "../app/src/growth-scene.ts";
import {
  parseNamedCrystalCatalog,
  renderNamedCrystalCatalogTable,
  summarizeNamedCrystalCatalog,
} from "./named-crystal-catalog.ts";

const REPO = resolve(import.meta.dirname, "..");
const DEFAULT_DECISIONS = join(REPO, "docs", "named-snow-crystal-final-compose-decisions.json");
const DEFAULT_CATALOG = join(REPO, "docs", "named-snow-crystal-catalog.json");
const DEFAULT_TABLE = join(REPO, "docs", "named-snow-crystal-catalog.md");
const DEFAULT_REVIEW = join(REPO, "docs", "named-snow-crystal-final-compose-review.json");
const SLOTS = ["lower", "baseline", "upper"] as const;
type Slot = typeof SLOTS[number];
const ROUTE_CHANGES = ["multiply-capped-columns", "needle-clusters"] as const;
const VIEWS = [
  { id: "face", tiltDegrees: 0, yawDegrees: 0 },
  { id: "oblique", tiltDegrees: 55, yawDegrees: 15 },
  { id: "axial", tiltDegrees: 85, yawDegrees: 0 },
] as const;
const STAGES = [
  { id: "start", fraction: 0 },
  { id: "middle", fraction: 0.55 },
  { id: "final", fraction: 1 },
] as const;

interface IdentityWire {
  readonly path: string;
  readonly byteLength: number;
  readonly sha256: string;
}

interface DecisionsWire {
  readonly format: "named-crystal-final-compose-decisions-v1";
  readonly reviewedAt: string;
  readonly composeReport: IdentityWire;
  readonly browserReview: IdentityWire;
  readonly contactSheet: IdentityWire;
  readonly families: readonly { readonly typeId: string; readonly rationale: string }[];
}

interface ComposeResultWire {
  readonly entryId: string;
  readonly typeId: string;
  readonly slot: Slot;
  readonly pattern: string;
  readonly variation: { readonly driver: string; readonly value: number; readonly unit: string };
  readonly instanceCount: number;
  readonly uniqueWebAssetCount: number;
  readonly coldWebPayloadBytes: number;
  readonly webPayloadLimitBytes: number;
  readonly actualComponentDecoder: string;
  readonly scene: IdentityWire;
  readonly scientificSceneBundle: IdentityWire;
}

interface ComposeReportWire {
  readonly format: "named-crystal-final-compose-report-v1";
  readonly completed: number;
  readonly failed: number;
  readonly webPayloadLimitBytes: number;
  readonly routeChangesOnAcceptance: readonly string[];
  readonly results: readonly ComposeResultWire[];
}

interface CaptureWire extends IdentityWire {
  readonly entryId: string;
  readonly typeId: string;
  readonly slot: Slot;
  readonly view: string;
  readonly tiltDegrees: number;
  readonly yawDegrees: number;
  readonly stage: string;
  readonly fraction: number;
}

interface BrowserReviewWire {
  readonly format: "named-crystal-final-compose-browser-review-v1";
  readonly sourceReport: IdentityWire;
  readonly playback: {
    readonly queryMode: string;
    readonly componentVerification: string;
    readonly views: readonly { readonly id: string; readonly tiltDegrees: number; readonly yawDegrees: number }[];
    readonly stages: readonly { readonly id: string; readonly fraction: number }[];
  };
  readonly completedEntries: number;
  readonly contactSheet: IdentityWire;
  readonly captures: readonly CaptureWire[];
}

interface ScienceWire {
  readonly format: "named-crystal-composed-scientific-bundle-v1";
  readonly entryId: string;
  readonly scene: IdentityWire;
  readonly componentBundles: readonly {
    readonly locator: string;
    readonly identitySha256: string;
  }[];
}

export interface FinalComposeAcceptanceResult {
  readonly acceptedVariants: number;
  readonly remainingVariants: number;
  readonly directTypes: number;
  readonly composeTypes: number;
  readonly reviewPath: string;
}

const sha256 = (bytes: Uint8Array | string): string => createHash("sha256").update(bytes).digest("hex");
const isSha256 = (value: unknown): value is string =>
  typeof value === "string" && /^[0-9a-f]{64}$/.test(value);
const canonicalJson = (value: unknown): string => `${JSON.stringify(value, null, 2)}\n`;
const webPath = (value: string): string => value.replaceAll("\\", "/");
const sameSet = (actual: readonly string[], expected: readonly string[]): boolean =>
  actual.length === expected.length && [...actual].sort().join("\0") === [...expected].sort().join("\0");

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

const exactIdentity = (left: IdentityWire, right: IdentityWire): boolean =>
  left.path === right.path && left.byteLength === right.byteLength && left.sha256 === right.sha256;

const verifyReport = (bytes: Uint8Array): ComposeReportWire => {
  const report = JSON.parse(Buffer.from(bytes).toString()) as ComposeReportWire;
  if (
    report.format !== "named-crystal-final-compose-report-v1"
    || report.completed !== 33 || report.failed !== 0
    || report.webPayloadLimitBytes !== 20_000_000
    || report.routeChangesOnAcceptance.join(",") !== ROUTE_CHANGES.join(",")
    || !Array.isArray(report.results) || report.results.length !== 33
    || new Set(report.results.map(({ entryId }) => entryId)).size !== 33
    || new Set(report.results.map(({ typeId }) => typeId)).size !== 11
  ) {
    throw new Error("final Compose report is incomplete or has contract drift");
  }
  for (const typeId of new Set(report.results.map(({ typeId }) => typeId))) {
    const variants = report.results.filter((result) => result.typeId === typeId);
    if (variants.length !== 3 || !sameSet(variants.map(({ slot }) => slot), SLOTS)) {
      throw new Error(`${typeId}: final Compose report is not a complete trio`);
    }
  }
  return report;
};

const verifyBrowserReview = (
  repo: string,
  bytes: Uint8Array,
  reportIdentity: IdentityWire,
  contactIdentity: IdentityWire,
  report: ComposeReportWire,
): { readonly review: BrowserReviewWire; readonly captures: ReadonlyMap<string, CaptureWire> } => {
  const review = JSON.parse(Buffer.from(bytes).toString()) as BrowserReviewWire;
  if (
    review.format !== "named-crystal-final-compose-browser-review-v1"
    || review.completedEntries !== 33 || !Array.isArray(review.captures) || review.captures.length !== 297
    || review.playback.queryMode !== "growthScene"
    || review.playback.componentVerification !== "browser-fetch-sha256-decodeGrowthAssetV1"
    || JSON.stringify(review.playback.views) !== JSON.stringify(VIEWS)
    || JSON.stringify(review.playback.stages) !== JSON.stringify(STAGES)
    || !exactIdentity(review.sourceReport, reportIdentity)
    || !exactIdentity(review.contactSheet, contactIdentity)
  ) {
    throw new Error("final Compose browser review is incomplete or has identity drift");
  }
  const byEntry = new Map(report.results.map((result) => [result.entryId, result]));
  const captures = new Map<string, CaptureWire>();
  for (const capture of review.captures) {
    const result = byEntry.get(capture.entryId);
    const view = VIEWS.find(({ id }) => id === capture.view);
    const stage = STAGES.find(({ id }) => id === capture.stage);
    if (
      result === undefined || capture.typeId !== result.typeId || capture.slot !== result.slot
      || view === undefined || stage === undefined
      || capture.tiltDegrees !== view.tiltDegrees || capture.yawDegrees !== view.yawDegrees
      || capture.fraction !== stage.fraction
    ) {
      throw new Error(`${capture.entryId}: malformed browser capture binding`);
    }
    const key = `${capture.entryId}/${capture.view}/${capture.stage}`;
    if (captures.has(key)) throw new Error(`${key}: duplicate browser capture`);
    verifyIdentity(repo, capture, key);
    captures.set(key, capture);
  }
  for (const result of report.results) {
    for (const view of VIEWS) {
      for (const stage of STAGES) {
        if (!captures.has(`${result.entryId}/${view.id}/${stage.id}`)) {
          throw new Error(`${result.entryId}: browser review is missing ${view.id}/${stage.id}`);
        }
      }
    }
  }
  return { review, captures };
};

const verifyProducts = (
  repo: string,
  report: ComposeReportWire,
): void => {
  for (const result of report.results) {
    if (
      result.coldWebPayloadBytes >= 20_000_000
      || result.webPayloadLimitBytes !== 20_000_000
      || result.actualComponentDecoder !== "decodeGrowthAssetV1"
      || !Number.isSafeInteger(result.instanceCount) || result.instanceCount < 2
      || !Number.isSafeInteger(result.uniqueWebAssetCount) || result.uniqueWebAssetCount < 1
    ) {
      throw new Error(`${result.entryId}: final Compose result is not eligible`);
    }
    const sceneBytes = verifyIdentity(repo, result.scene, `${result.entryId} scene`);
    const scene = parseGrowthSceneV1(JSON.parse(Buffer.from(sceneBytes).toString()) as unknown);
    if (
      scene.components.length !== result.instanceCount
      || scene.variation.driver !== result.variation.driver
      || scene.variation.value !== result.variation.value
      || scene.variation.unit !== result.variation.unit
      || growthSceneColdPayloadBytes(scene, sceneBytes.byteLength) !== result.coldWebPayloadBytes
    ) {
      throw new Error(`${result.entryId}: scene/report cold payload or variation drift`);
    }
    const scienceBytes = verifyIdentity(
      repo,
      result.scientificSceneBundle,
      `${result.entryId} scientific-scene bundle`,
    );
    const science = JSON.parse(Buffer.from(scienceBytes).toString()) as ScienceWire;
    if (
      science.format !== "named-crystal-composed-scientific-bundle-v1"
      || science.entryId !== result.entryId
      || science.scene.path !== "scene.json"
      || science.scene.byteLength !== result.scene.byteLength
      || science.scene.sha256 !== result.scene.sha256
      || !Array.isArray(science.componentBundles) || science.componentBundles.length < 1
      || science.componentBundles.some(({ locator, identitySha256 }) =>
        typeof locator !== "string" || locator.trim() === "" || !isSha256(identitySha256))
    ) {
      throw new Error(`${result.entryId}: scientific-scene bundle drift`);
    }
  }
};

const writeAtomic = (path: string, bytes: string): void => {
  const temporary = `${path}.tmp-${process.pid}`;
  writeFileSync(temporary, bytes);
  renameSync(temporary, path);
};

export function acceptFinalComposeCatalog(
  decisionsPath = DEFAULT_DECISIONS,
  catalogPath = DEFAULT_CATALOG,
  tablePath = DEFAULT_TABLE,
  reviewPath = DEFAULT_REVIEW,
  repo = REPO,
): FinalComposeAcceptanceResult {
  const decisionBytes = readFileSync(decisionsPath);
  const decisions = JSON.parse(decisionBytes.toString()) as DecisionsWire;
  if (
    decisions.format !== "named-crystal-final-compose-decisions-v1"
    || typeof decisions.reviewedAt !== "string" || decisions.reviewedAt.trim() === ""
    || !Array.isArray(decisions.families) || decisions.families.length !== 11
    || new Set(decisions.families.map(({ typeId }) => typeId)).size !== 11
    || decisions.families.some(({ rationale }) => typeof rationale !== "string" || rationale.trim() === "")
  ) {
    throw new Error("final Compose decision file is malformed or incomplete");
  }
  const reportBytes = verifyIdentity(repo, decisions.composeReport, "final Compose report");
  const report = verifyReport(reportBytes);
  verifyIdentity(repo, decisions.contactSheet, "final Compose contact sheet");
  const browserBytes = verifyIdentity(repo, decisions.browserReview, "final Compose browser review");
  const { captures } = verifyBrowserReview(
    repo,
    browserBytes,
    decisions.composeReport,
    decisions.contactSheet,
    report,
  );
  verifyProducts(repo, report);
  if (!sameSet(decisions.families.map(({ typeId }) => typeId), [...new Set(report.results.map(({ typeId }) => typeId))])) {
    throw new Error("final Compose decision family set differs from its report");
  }

  const rawCatalog = JSON.parse(readFileSync(catalogPath, "utf8")) as {
    entries: Array<Record<string, unknown>>;
  };
  const before = parseNamedCrystalCatalog(rawCatalog);
  const beforeSummary = summarizeNamedCrystalCatalog(before);
  if (beforeSummary.acceptedSlots !== 66 || beforeSummary.remainingSlots !== 33) {
    throw new Error("final Compose acceptance requires the complete 66-slot direct catalog");
  }
  for (const typeId of ROUTE_CHANGES) {
    const entry = rawCatalog.entries.find((candidate) => candidate.id === typeId);
    if (entry?.route !== "gg-plus") throw new Error(`${typeId}: premature or missing deferred route state`);
    entry.route = "compose";
  }
  for (const decision of decisions.families) {
    const entry = rawCatalog.entries.find((candidate) => candidate.id === decision.typeId);
    if (entry?.route !== "compose") throw new Error(`${decision.typeId}: final Compose catalog route is invalid`);
    const variants = entry.variants as Record<string, unknown>;
    if (Object.values(variants).some((variant) => variant !== null)) {
      throw new Error(`${decision.typeId}: final Compose catalog target is already occupied`);
    }
    for (const result of report.results.filter(({ typeId }) => typeId === decision.typeId)) {
      const preview = captures.get(`${result.entryId}/oblique/final`)!;
      variants[result.slot] = {
        entryId: result.entryId,
        variation: result.variation,
        links: {
          preview: preview.path,
          webAsset: result.scene.path,
          recipeOrScene: result.scene.path,
          scientificBundle: result.scientificSceneBundle.path,
        },
        webPayloadBytes: result.coldWebPayloadBytes,
      };
    }
    entry.note = "Accepted composed-visualization trio; exact scene, component, browser and morphology identities are in docs/named-snow-crystal-final-compose-review.json.";
  }
  const catalog = parseNamedCrystalCatalog(rawCatalog);
  const summary = summarizeNamedCrystalCatalog(catalog);
  if (
    summary.acceptedSlots !== 99 || summary.remainingSlots !== 0
    || summary.ggTypes !== 22 || summary.composeTypes !== 11 || summary.excludedTypes !== 2
  ) {
    throw new Error("final Compose transaction did not reach the 99-slot 22/11/2 terminal catalog state");
  }

  const review = {
    format: "named-crystal-final-compose-review-v1",
    reviewedAt: decisions.reviewedAt,
    decision: {
      path: webPath(relative(repo, decisionsPath)),
      byteLength: decisionBytes.byteLength,
      sha256: sha256(decisionBytes),
    },
    composeReport: decisions.composeReport,
    browserReview: decisions.browserReview,
    contactSheet: decisions.contactSheet,
    counts: {
      acceptedFamilies: 11,
      acceptedVariants: 33,
      browserCaptures: 297,
      catalogAcceptedVariants: 99,
      catalogRemainingVariants: 0,
    },
    routeChanges: ROUTE_CHANGES.map((typeId) => ({ typeId, from: "gg-plus", to: "compose" })),
    families: decisions.families.map((decision) => ({
      ...decision,
      status: "accepted",
      variants: report.results.filter(({ typeId }) => typeId === decision.typeId).map((result) => ({
        entryId: result.entryId,
        slot: result.slot,
        variation: result.variation,
        coldWebPayloadBytes: result.coldWebPayloadBytes,
        scene: result.scene,
        scientificSceneBundle: result.scientificSceneBundle,
        preview: captures.get(`${result.entryId}/oblique/final`)!,
      })),
    })),
  };
  const reviewBytes = canonicalJson(review);
  const catalogBytes = canonicalJson(rawCatalog);
  const tableBytes = renderNamedCrystalCatalogTable(catalog, tablePath);
  writeAtomic(reviewPath, reviewBytes);
  writeAtomic(catalogPath, catalogBytes);
  writeAtomic(tablePath, tableBytes);
  return {
    acceptedVariants: summary.acceptedSlots,
    remainingVariants: summary.remainingSlots,
    directTypes: summary.ggTypes,
    composeTypes: summary.composeTypes,
    reviewPath,
  };
}

if (process.argv[1] !== undefined && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  console.log(JSON.stringify(acceptFinalComposeCatalog()));
}
