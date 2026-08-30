// Validate and render the maker-selected named snow-crystal animation catalog.
//
//   node scripts/named-crystal-catalog.ts validate
//   node scripts/named-crystal-catalog.ts table --out docs/named-snow-crystal-catalog.md

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, relative, resolve } from "node:path";

export const NAMED_CRYSTAL_CATALOG_FORMAT = "named-snow-crystal-catalog-v1" as const;
export const REQUIRED_VARIANT_SLOTS = ["lower", "baseline", "upper"] as const;

export type CatalogRoute = "gg" | "gg-plus" | "compose" | "excluded-new-physics";
export type VariantSlot = (typeof REQUIRED_VARIANT_SLOTS)[number];

export interface CurrentCandidate {
  readonly id: string;
  readonly assessment: "anchor-candidate" | "related-candidate";
  readonly sourceRecord: string;
}

export interface AcceptedVariant {
  readonly entryId: string;
  readonly variation: {
    readonly driver: string;
    readonly value: number | string;
    readonly unit: string;
  };
  readonly links: {
    readonly preview: string;
    readonly webAsset: string;
    readonly recipeOrScene: string;
    readonly scientificBundle: string;
  };
  readonly webPayloadBytes: number;
}

export interface NamedCrystalType {
  readonly id: string;
  readonly name: string;
  readonly route: CatalogRoute;
  readonly note: string;
  readonly currentCandidates: readonly CurrentCandidate[];
  readonly variants: Readonly<Partial<Record<VariantSlot, AcceptedVariant | null>>>;
  readonly exclusionReason: string | null;
}

export interface NamedCrystalCatalog {
  readonly format: typeof NAMED_CRYSTAL_CATALOG_FORMAT;
  readonly catalogId: string;
  readonly taxonomy: {
    readonly name: string;
    readonly guideUrl: string;
    readonly chartUrl: string;
    readonly note: string;
  };
  readonly webPayloadLimitBytes: number;
  readonly variationSlots: readonly VariantSlot[];
  readonly entries: readonly NamedCrystalType[];
}

export interface CatalogSummary {
  readonly taxonomyRows: number;
  readonly includedTypes: number;
  readonly excludedTypes: number;
  readonly ggTypes: number;
  readonly composeTypes: number;
  readonly requiredSlots: number;
  readonly acceptedSlots: number;
  readonly remainingSlots: number;
}

const EXPECTED_NAMES = [
  "Simple Prisms",
  "Solid Columns",
  "Sheaths",
  "Scrolls on Plates",
  "Triangular Forms",
  "Hexagonal Plates",
  "Hollow Columns",
  "Cups",
  "Columns on Plates",
  "12-branched Stars",
  "Stellar Plates",
  "Bullet Rosettes",
  "Capped Columns",
  "Split Plates & Stars",
  "Radiating Plates",
  "Sectored Plates",
  "Isolated Bullets",
  "Multiply Capped Columns",
  "Skeletal Forms",
  "Radiating Dendrites",
  "Simple Stars",
  "Simple Needles",
  "Capped Bullets",
  "Twin Columns",
  "Irregulars",
  "Stellar Dendrites",
  "Needle Clusters",
  "Double Plates",
  "Arrowhead Twins",
  "Rimed",
  "Fernlike Stellar Dendrites",
  "Crossed Needles",
  "Hollow Plates",
  "Crossed Plates",
  "Graupel",
] as const;

const object = (value: unknown, label: string): Record<string, unknown> => {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
  return value as Record<string, unknown>;
};

const exactKeys = (value: Record<string, unknown>, expected: readonly string[], label: string): void => {
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  if (actual.join("\0") !== wanted.join("\0")) {
    throw new Error(`${label} has unrecognized or missing keys`);
  }
};

const nonEmptyString = (value: unknown, label: string): string => {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${label} must be a non-empty string`);
  }
  return value;
};

const parseCandidate = (value: unknown, label: string): CurrentCandidate => {
  const candidate = object(value, label);
  exactKeys(candidate, ["assessment", "id", "sourceRecord"], label);
  const assessment = candidate["assessment"];
  if (assessment !== "anchor-candidate" && assessment !== "related-candidate") {
    throw new Error(`${label}.assessment is invalid`);
  }
  const sourceRecord = nonEmptyString(candidate["sourceRecord"], `${label}.sourceRecord`);
  if (
    sourceRecord.startsWith("/")
    || sourceRecord.includes("\\")
    || sourceRecord.split("/").includes("..")
    || !sourceRecord.endsWith("-record.json")
  ) {
    throw new Error(`${label}.sourceRecord must be a repository-relative record path`);
  }
  return {
    id: nonEmptyString(candidate["id"], `${label}.id`),
    assessment,
    sourceRecord,
  };
};

const parseAcceptedVariant = (
  value: unknown,
  label: string,
  payloadLimit: number,
): AcceptedVariant => {
  const variant = object(value, label);
  exactKeys(variant, ["entryId", "links", "variation", "webPayloadBytes"], label);
  const variation = object(variant["variation"], `${label}.variation`);
  exactKeys(variation, ["driver", "unit", "value"], `${label}.variation`);
  const variationValue = variation["value"];
  if (
    (typeof variationValue !== "number" || !Number.isFinite(variationValue))
    && (typeof variationValue !== "string" || variationValue.trim() === "")
  ) {
    throw new Error(`${label}.variation.value must be finite or a non-empty string`);
  }
  const links = object(variant["links"], `${label}.links`);
  exactKeys(
    links,
    ["preview", "recipeOrScene", "scientificBundle", "webAsset"],
    `${label}.links`,
  );
  const webPayloadBytes = Number(variant["webPayloadBytes"]);
  if (!Number.isSafeInteger(webPayloadBytes) || webPayloadBytes < 0 || webPayloadBytes >= payloadLimit) {
    throw new Error(`${label}.webPayloadBytes must be a safe integer below ${payloadLimit}`);
  }
  return {
    entryId: nonEmptyString(variant["entryId"], `${label}.entryId`),
    variation: {
      driver: nonEmptyString(variation["driver"], `${label}.variation.driver`),
      value: variationValue as number | string,
      unit: nonEmptyString(variation["unit"], `${label}.variation.unit`),
    },
    links: {
      preview: nonEmptyString(links["preview"], `${label}.links.preview`),
      webAsset: nonEmptyString(links["webAsset"], `${label}.links.webAsset`),
      recipeOrScene: nonEmptyString(links["recipeOrScene"], `${label}.links.recipeOrScene`),
      scientificBundle: nonEmptyString(links["scientificBundle"], `${label}.links.scientificBundle`),
    },
    webPayloadBytes,
  };
};

const parseType = (
  value: unknown,
  index: number,
  payloadLimit: number,
  acceptedEntryIds: Set<string>,
): NamedCrystalType => {
  const label = `entries[${index}]`;
  const entry = object(value, label);
  exactKeys(
    entry,
    ["currentCandidates", "exclusionReason", "id", "name", "note", "route", "variants"],
    label,
  );
  const id = nonEmptyString(entry["id"], `${label}.id`);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) throw new Error(`${label}.id is not canonical`);
  const name = nonEmptyString(entry["name"], `${label}.name`);
  const route = entry["route"];
  if (!(["gg", "gg-plus", "compose", "excluded-new-physics"] as const).includes(route as CatalogRoute)) {
    throw new Error(`${label}.route is invalid`);
  }
  if (!Array.isArray(entry["currentCandidates"])) {
    throw new Error(`${label}.currentCandidates must be an array`);
  }
  const currentCandidates = entry["currentCandidates"].map((candidate, candidateIndex) =>
    parseCandidate(candidate, `${label}.currentCandidates[${candidateIndex}]`),
  );
  const candidateIds = new Set<string>();
  for (const candidate of currentCandidates) {
    if (candidateIds.has(candidate.id)) throw new Error(`${label} duplicates candidate ${candidate.id}`);
    candidateIds.add(candidate.id);
  }
  const variantsRaw = object(entry["variants"], `${label}.variants`);
  const variants: Partial<Record<VariantSlot, AcceptedVariant | null>> = {};
  const exclusionReason = entry["exclusionReason"];
  if (route === "excluded-new-physics") {
    exactKeys(variantsRaw, [], `${label}.variants`);
    if (typeof exclusionReason !== "string" || exclusionReason.trim() === "") {
      throw new Error(`${label}.exclusionReason is required for an exclusion`);
    }
    if (currentCandidates.length !== 0) throw new Error(`${label} exclusion cannot have candidates`);
  } else {
    exactKeys(variantsRaw, REQUIRED_VARIANT_SLOTS, `${label}.variants`);
    if (exclusionReason !== null) throw new Error(`${label}.exclusionReason must be null`);
    for (const slot of REQUIRED_VARIANT_SLOTS) {
      const raw = variantsRaw[slot];
      if (raw === null) {
        variants[slot] = null;
      } else {
        const accepted = parseAcceptedVariant(raw, `${label}.variants.${slot}`, payloadLimit);
        if (acceptedEntryIds.has(accepted.entryId)) {
          throw new Error(`accepted entry ${accepted.entryId} fills more than one slot`);
        }
        acceptedEntryIds.add(accepted.entryId);
        variants[slot] = accepted;
      }
    }
  }
  return {
    id,
    name,
    route: route as CatalogRoute,
    note: nonEmptyString(entry["note"], `${label}.note`),
    currentCandidates,
    variants,
    exclusionReason: exclusionReason as string | null,
  };
};

export const parseNamedCrystalCatalog = (value: unknown): NamedCrystalCatalog => {
  const catalog = object(value, "catalog");
  exactKeys(
    catalog,
    ["catalogId", "entries", "format", "taxonomy", "variationSlots", "webPayloadLimitBytes"],
    "catalog",
  );
  if (catalog["format"] !== NAMED_CRYSTAL_CATALOG_FORMAT) {
    throw new Error("catalog.format is invalid");
  }
  const webPayloadLimitBytes = Number(catalog["webPayloadLimitBytes"]);
  if (!Number.isSafeInteger(webPayloadLimitBytes) || webPayloadLimitBytes < 1) {
    throw new Error("catalog.webPayloadLimitBytes must be a positive safe integer");
  }
  if (
    !Array.isArray(catalog["variationSlots"])
    || catalog["variationSlots"].join("\0") !== REQUIRED_VARIANT_SLOTS.join("\0")
  ) {
    throw new Error("catalog.variationSlots must be lower, baseline, upper in order");
  }
  const taxonomy = object(catalog["taxonomy"], "catalog.taxonomy");
  exactKeys(taxonomy, ["chartUrl", "guideUrl", "name", "note"], "catalog.taxonomy");
  if (!Array.isArray(catalog["entries"])) throw new Error("catalog.entries must be an array");
  const acceptedEntryIds = new Set<string>();
  const entries = catalog["entries"].map((entry, index) =>
    parseType(entry, index, webPayloadLimitBytes, acceptedEntryIds),
  );
  const ids = new Set<string>();
  const names = new Set<string>();
  for (const entry of entries) {
    if (ids.has(entry.id)) throw new Error(`catalog duplicates id ${entry.id}`);
    if (names.has(entry.name)) throw new Error(`catalog duplicates name ${entry.name}`);
    ids.add(entry.id);
    names.add(entry.name);
  }
  if (entries.map((entry) => entry.name).join("\0") !== EXPECTED_NAMES.join("\0")) {
    throw new Error("catalog entries do not match the registered 35-name chart order");
  }
  const parsed: NamedCrystalCatalog = {
    format: NAMED_CRYSTAL_CATALOG_FORMAT,
    catalogId: nonEmptyString(catalog["catalogId"], "catalog.catalogId"),
    taxonomy: {
      name: nonEmptyString(taxonomy["name"], "catalog.taxonomy.name"),
      guideUrl: nonEmptyString(taxonomy["guideUrl"], "catalog.taxonomy.guideUrl"),
      chartUrl: nonEmptyString(taxonomy["chartUrl"], "catalog.taxonomy.chartUrl"),
      note: nonEmptyString(taxonomy["note"], "catalog.taxonomy.note"),
    },
    webPayloadLimitBytes,
    variationSlots: [...REQUIRED_VARIANT_SLOTS],
    entries,
  };
  const summary = summarizeNamedCrystalCatalog(parsed);
  if (
    summary.taxonomyRows !== 35
    || summary.includedTypes !== 33
    || summary.excludedTypes !== 2
    || summary.ggTypes !== 24
    || summary.composeTypes !== 9
    || summary.requiredSlots !== 99
  ) {
    throw new Error("catalog route/count contract is not 35 total, 33 included, 24 GG, 9 Compose, 2 excluded, 99 slots");
  }
  const exclusions = entries.filter((entry) => entry.route === "excluded-new-physics").map((entry) => entry.name);
  if (exclusions.join("\0") !== ["Rimed", "Graupel"].join("\0")) {
    throw new Error("catalog exclusions must be Rimed and Graupel");
  }
  return parsed;
};

export const summarizeNamedCrystalCatalog = (catalog: NamedCrystalCatalog): CatalogSummary => {
  const included = catalog.entries.filter((entry) => entry.route !== "excluded-new-physics");
  const acceptedSlots = included.reduce(
    (total, entry) => total + REQUIRED_VARIANT_SLOTS.filter((slot) => entry.variants[slot] !== null).length,
    0,
  );
  const requiredSlots = included.length * REQUIRED_VARIANT_SLOTS.length;
  return {
    taxonomyRows: catalog.entries.length,
    includedTypes: included.length,
    excludedTypes: catalog.entries.length - included.length,
    ggTypes: included.filter((entry) => entry.route === "gg" || entry.route === "gg-plus").length,
    composeTypes: included.filter((entry) => entry.route === "compose").length,
    requiredSlots,
    acceptedSlots,
    remainingSlots: requiredSlots - acceptedSlots,
  };
};

const escapeTable = (value: string): string => value.replaceAll("|", "\\|").replaceAll("\n", " ");

export const renderNamedCrystalCatalogTable = (
  catalog: NamedCrystalCatalog,
  outputPath = resolve("docs/named-snow-crystal-catalog.md"),
): string => {
  const summary = summarizeNamedCrystalCatalog(catalog);
  const outputDirectory = dirname(outputPath);
  const lines = [
    "# Named snow-crystal animation catalog",
    "",
    `Operational taxonomy: [${catalog.taxonomy.name}](${catalog.taxonomy.guideUrl}) · [35-type chart](${catalog.taxonomy.chartUrl})`,
    "",
    "This is a generated text index. Candidate links point to current project run records; a candidate does not fill a variant slot until visual audit accepts it. Compose entries are explicitly visual scenes, not one solver state.",
    "",
    "Detailed intake: [current 52-animation visual audit](named-snow-crystal-current-assets.md).",
    "",
    "| Measure | Count |",
    "|---|---:|",
    `| Named taxonomy rows | ${summary.taxonomyRows} |`,
    `| Included types | ${summary.includedTypes} |`,
    `| GG / GG+ types | ${summary.ggTypes} |`,
    `| Compose types | ${summary.composeTypes} |`,
    `| Excluded new-physics types | ${summary.excludedTypes} |`,
    `| Required accepted animations | ${summary.requiredSlots} |`,
    `| Accepted animations | ${summary.acceptedSlots} |`,
    `| Remaining animations | ${summary.remainingSlots} |`,
    "",
    "| Named type | Route | Current candidates | Accepted variants | Status / next work |",
    "|---|---|---|---:|---|",
  ];
  for (const entry of catalog.entries) {
    const candidates = entry.currentCandidates.length === 0
      ? "—"
      : entry.currentCandidates.map((candidate) => {
        const target = relative(outputDirectory, resolve(candidate.sourceRecord)).replaceAll("\\", "/");
        const label = `${candidate.id} (${candidate.assessment.replace("-candidate", "")})`;
        return `[${label}](${target})`;
      }).join(" · ");
    const accepted = REQUIRED_VARIANT_SLOTS.filter((slot) => entry.variants[slot] !== null).length;
    const status = entry.route === "excluded-new-physics"
      ? `Excluded — ${entry.exclusionReason}`
      : entry.note;
    lines.push(
      `| ${escapeTable(entry.name)} | ${entry.route} | ${candidates} | ${entry.route === "excluded-new-physics" ? "—" : `${accepted}/3`} | ${escapeTable(status)} |`,
    );
  }
  lines.push(
    "",
    `Web limit: each entry's cold unique payload must be less than ${catalog.webPayloadLimitBytes.toLocaleString("en-US")} bytes.`,
    "",
    "Generated by `node scripts/named-crystal-catalog.ts table --out docs/named-snow-crystal-catalog.md`.",
    "",
  );
  return lines.join("\n");
};

const argument = (argv: readonly string[], name: string, fallback?: string): string | undefined => {
  const index = argv.indexOf(`--${name}`);
  return index >= 0 ? argv[index + 1] : fallback;
};

const main = (argv: readonly string[]): void => {
  const command = argv[0] ?? "validate";
  const manifestPath = resolve(argument(argv, "manifest", "docs/named-snow-crystal-catalog.json") as string);
  const catalog = parseNamedCrystalCatalog(JSON.parse(readFileSync(manifestPath, "utf8")) as unknown);
  const summary = summarizeNamedCrystalCatalog(catalog);
  if (command === "validate") {
    console.log(JSON.stringify(summary));
    return;
  }
  if (command === "table") {
    const outputPath = resolve(argument(argv, "out", "docs/named-snow-crystal-catalog.md") as string);
    writeFileSync(outputPath, renderNamedCrystalCatalogTable(catalog, outputPath));
    console.log(`${summary.taxonomyRows} rows, ${summary.requiredSlots} required slots -> ${outputPath}`);
    return;
  }
  throw new Error(`unknown command ${command}`);
};

const invokedPath = process.argv[1] === undefined ? "" : resolve(process.argv[1]);
if (invokedPath === fileURLToPath(import.meta.url)) main(process.argv.slice(2));
