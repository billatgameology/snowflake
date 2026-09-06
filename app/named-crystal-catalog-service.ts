import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import type { IncomingMessage, ServerResponse } from "node:http";
import { isAbsolute, relative, resolve, sep } from "node:path";

import { decodeGrowthAssetV1 } from "./src/growth-asset.ts";
import { parseGrowthSceneV1, type GrowthSceneV1 } from "./src/growth-scene.ts";

type JsonRecord = Record<string, unknown>;

interface ArtifactIdentity {
  readonly path: string;
  readonly byteLength: number;
  readonly sha256: string;
}

interface DirectVariantReview {
  readonly slot: string;
  readonly entryId: string;
  readonly frameCount: number;
  readonly variation: { readonly driver: string; readonly value: number; readonly unit: string };
  readonly webAsset: ArtifactIdentity;
  readonly scientificBundle: {
    readonly locator: string;
    readonly identitySha256: string;
  };
}

interface ComposeVariantReview {
  readonly entryId: string;
  readonly slot: string;
  readonly scene: ArtifactIdentity;
  readonly preview: ArtifactIdentity & { readonly entryId: string };
}

interface CatalogVariant {
  readonly entryId: string;
  readonly variation: { readonly driver: string; readonly value: number; readonly unit: string };
  readonly links: { readonly preview: string; readonly webAsset: string };
  readonly webPayloadBytes: number;
}

interface CatalogEntry {
  readonly id: string;
  readonly name: string;
  readonly route: "gg" | "gg-plus" | "compose" | "excluded-new-physics";
  readonly note: string;
  readonly variants: Readonly<Record<string, CatalogVariant>>;
  readonly exclusionReason: string | null;
}

interface CatalogSource {
  readonly format: string;
  readonly catalogId: string;
  readonly taxonomy: { readonly name: string; readonly guideUrl: string; readonly chartUrl: string };
  readonly webPayloadLimitBytes: number;
  readonly variationSlots: readonly string[];
  readonly entries: readonly CatalogEntry[];
}

export interface NamedCrystalCatalogService {
  readonly index: JsonRecord;
  readonly handler: (request: IncomingMessage, response: ServerResponse) => void;
}

const json = <T>(path: string): T => JSON.parse(readFileSync(path, "utf8")) as T;
const sha256 = (bytes: Uint8Array): string => createHash("sha256").update(bytes).digest("hex");

const containedPath = (repositoryRoot: string, projectPath: string): string => {
  if (projectPath.includes("\\") || !projectPath.startsWith("out/named-crystal-catalog/")) {
    throw new Error(`catalog artifact is outside the named catalog: ${projectPath}`);
  }
  const absolute = resolve(repositoryRoot, projectPath);
  const rel = relative(repositoryRoot, absolute);
  if (isAbsolute(rel) || rel === ".." || rel.startsWith(`..${sep}`)) {
    throw new Error(`catalog artifact escapes the repository: ${projectPath}`);
  }
  return absolute;
};

const volumePreviewPath = (repositoryRoot: string, entryId: string): string => {
  if (!/^[a-z0-9-]+$/u.test(entryId)) throw new Error(`invalid catalog entry id: ${entryId}`);
  const previewRoot = resolve(repositoryRoot, "out/named-crystal-gallery-volume-previews");
  const absolute = resolve(previewRoot, `${entryId}.png`);
  const rel = relative(previewRoot, absolute);
  if (isAbsolute(rel) || rel === ".." || rel.startsWith(`..${sep}`)) {
    throw new Error(`catalog preview escapes its generated root: ${entryId}`);
  }
  return absolute;
};

const verifiedBytes = (repositoryRoot: string, identity: ArtifactIdentity): Buffer => {
  const bytes = readFileSync(containedPath(repositoryRoot, identity.path));
  if (bytes.byteLength !== identity.byteLength || sha256(bytes) !== identity.sha256) {
    throw new Error(`catalog artifact identity mismatch: ${identity.path}`);
  }
  return bytes;
};

const arrayBuffer = (bytes: Buffer): ArrayBuffer =>
  bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;

const directBounds = (bytes: Buffer): GrowthSceneV1["bounds"] => {
  const growth = decodeGrowthAssetV1(arrayBuffer(bytes));
  const [nx, ny] = growth.dims;
  const [centerI, centerJ, centerK] = growth.center;
  const centerX = centerI + centerJ / 2;
  const centerY = Math.sqrt(3) * centerJ / 2;
  let xMin = Infinity;
  let xMax = -Infinity;
  let yMin = Infinity;
  let yMax = -Infinity;
  let zMin = Infinity;
  let zMax = -Infinity;
  for (const flat of growth.flatIndices) {
    const i = flat % nx;
    const j = Math.floor(flat / nx) % ny;
    const k = Math.floor(flat / (nx * ny));
    const x = i + j / 2 - centerX;
    const y = Math.sqrt(3) * j / 2 - centerY;
    const z = (k - centerK) * 3.5;
    xMin = Math.min(xMin, x - 0.58);
    xMax = Math.max(xMax, x + 0.58);
    yMin = Math.min(yMin, y - 0.58);
    yMax = Math.max(yMax, y + 0.58);
    zMin = Math.min(zMin, z - 0.46);
    zMax = Math.max(zMax, z + 0.46);
  }
  const padX = Math.max(2, (xMax - xMin) * 0.04);
  const padY = Math.max(2, (yMax - yMin) * 0.04);
  const padZ = Math.max(2, (zMax - zMin) * 0.04);
  return { xMin: xMin - padX, xMax: xMax + padX, yMin: yMin - padY, yMax: yMax + padY, zMin: zMin - padZ, zMax: zMax + padZ };
};

const send = (
  request: IncomingMessage,
  response: ServerResponse,
  body: Buffer,
  contentType: string,
): void => {
  response.statusCode = 200;
  response.setHeader("content-type", contentType);
  response.setHeader("content-length", body.byteLength);
  response.setHeader("cache-control", "no-store");
  response.setHeader("x-content-type-options", "nosniff");
  response.end((request.method ?? "GET") === "HEAD" ? undefined : body);
};

const reject = (response: ServerResponse, status = 403): void => {
  response.statusCode = status;
  response.setHeader("cache-control", "no-store");
  response.end();
};

export const createNamedCrystalCatalogService = (repositoryRoot: string): NamedCrystalCatalogService => {
  const docsRoot = resolve(repositoryRoot, "docs");
  const catalog = json<CatalogSource>(resolve(docsRoot, "named-snow-crystal-catalog.json"));
  const directReview = json<{ readonly families: readonly { readonly typeId: string; readonly variants: readonly DirectVariantReview[] }[] }>(
    resolve(docsRoot, "named-snow-crystal-final-direct-review.json"),
  );
  const composeReview = json<{ readonly families: readonly { readonly typeId: string; readonly variants: readonly ComposeVariantReview[] }[] }>(
    resolve(docsRoot, "named-snow-crystal-final-compose-review.json"),
  );
  if (catalog.format !== "named-snow-crystal-catalog-v1") throw new Error("unexpected named catalog format");

  const directByEntry = new Map(directReview.families.flatMap((family) =>
    family.variants.map((variant) => [variant.entryId, variant] as const)));
  const composeByEntry = new Map(composeReview.families.flatMap((family) =>
    family.variants.map((variant) => [variant.entryId, variant] as const)));
  const previewEntryIds = new Set<string>();
  const growthBySha = new Map<string, ArtifactIdentity>();
  const catalogEntries = catalog.entries.map((entry) => ({
    id: entry.id,
    name: entry.name,
    route: entry.route,
    note: entry.note,
    exclusionReason: entry.exclusionReason,
    variants: catalog.variationSlots.flatMap((slot) => {
      const variant = entry.variants[slot];
      if (variant === undefined) return [];
      const direct = directByEntry.get(variant.entryId);
      const compose = composeByEntry.get(variant.entryId);
      if (entry.route === "compose" && compose === undefined) throw new Error(`missing compose review: ${variant.entryId}`);
      if (entry.route !== "compose" && direct === undefined) throw new Error(`missing direct review: ${variant.entryId}`);
      if (direct !== undefined) growthBySha.set(direct.webAsset.sha256, direct.webAsset);
      previewEntryIds.add(variant.entryId);
      return [{
        entryId: variant.entryId,
        slot,
        variation: variant.variation,
        webPayloadBytes: variant.webPayloadBytes,
        previewUrl: `/named-crystal-catalog-api/preview/${variant.entryId}.png`,
        sceneUrl: `/named-crystal-catalog-api/scene/${variant.entryId}.json`,
      }];
    }),
  }));

  // The tracked direct review already supplies the complete growth allowlist. Generated scenes
  // may be absent in a fresh checkout; validate their components when the scene is requested.
  const index: JsonRecord = {
    format: "named-crystal-local-gallery-v1",
    catalogId: catalog.catalogId,
    taxonomy: catalog.taxonomy,
    webPayloadLimitBytes: catalog.webPayloadLimitBytes,
    counts: {
      families: catalog.entries.length,
      includedFamilies: catalog.entries.filter((entry) => entry.route !== "excluded-new-physics").length,
      variants: catalogEntries.reduce((sum, entry) => sum + entry.variants.length, 0),
      directFamilies: catalog.entries.filter((entry) => entry.route === "gg" || entry.route === "gg-plus").length,
      composeFamilies: catalog.entries.filter((entry) => entry.route === "compose").length,
      excludedFamilies: catalog.entries.filter((entry) => entry.route === "excluded-new-physics").length,
    },
    entries: catalogEntries,
  };
  const indexBytes = Buffer.from(`${JSON.stringify(index)}\n`);

  const handler = (request: IncomingMessage, response: ServerResponse): void => {
    const method = request.method ?? "GET";
    if (method !== "GET" && method !== "HEAD") {
      response.setHeader("allow", "GET, HEAD");
      reject(response, 405);
      return;
    }
    let path: string;
    try {
      path = decodeURIComponent((request.url ?? "").split("?", 1)[0] as string);
    } catch {
      reject(response);
      return;
    }
    try {
      if (path === "/index.json") {
        send(request, response, indexBytes, "application/json; charset=utf-8");
        return;
      }
      const previewMatch = /^\/preview\/([a-z0-9-]+)\.png$/u.exec(path);
      if (previewMatch !== null) {
        const entryId = previewMatch[1] as string;
        if (!previewEntryIds.has(entryId)) return reject(response);
        const bytes = readFileSync(volumePreviewPath(repositoryRoot, entryId));
        send(request, response, bytes, "image/png");
        return;
      }
      const growthMatch = /^\/growth\/([0-9a-f]{64})\.bin$/u.exec(path);
      if (growthMatch !== null) {
        const identity = growthBySha.get(growthMatch[1] as string);
        if (identity === undefined) return reject(response);
        send(request, response, verifiedBytes(repositoryRoot, identity), "application/octet-stream");
        return;
      }
      const sceneMatch = /^\/scene\/([a-z0-9-]+)\.json$/u.exec(path);
      if (sceneMatch !== null) {
        const entryId = sceneMatch[1] as string;
        const direct = directByEntry.get(entryId);
        if (direct !== undefined) {
          const bytes = verifiedBytes(repositoryRoot, direct.webAsset);
          const scene: GrowthSceneV1 = {
            format: "growth-scene-v1",
            title: entryId,
            disclosure: "direct-growth-recording",
            durationSeconds: 8,
            variation: direct.variation,
            bounds: directBounds(bytes),
            camera: { tiltDegrees: 38, yawDegrees: 15, zoom: 1.4 },
            components: [{
              id: entryId,
              growthAsset: {
                url: `/named-crystal-catalog-api/growth/${direct.webAsset.sha256}.bin`,
                byteLength: direct.webAsset.byteLength,
                sha256: direct.webAsset.sha256,
              },
              scientificBundle: {
                locator: direct.scientificBundle.locator,
                identitySha256: direct.scientificBundle.identitySha256,
              },
              transform: { translate: [0, 0, 0], rotateDegrees: [0, 0, 0], scale: 1 },
              phaseOffset: 0,
            }],
          };
          send(request, response, Buffer.from(`${JSON.stringify(scene)}\n`), "application/json; charset=utf-8");
          return;
        }
        const compose = composeByEntry.get(entryId);
        if (compose !== undefined) {
          const scene = parseGrowthSceneV1(JSON.parse(verifiedBytes(repositoryRoot, compose.scene).toString("utf8")) as unknown);
          for (const component of scene.components) {
            if (!growthBySha.has(component.growthAsset.sha256)) {
              throw new Error(`compose component has no accepted direct asset: ${component.growthAsset.sha256}`);
            }
          }
          const rewritten: GrowthSceneV1 = {
            ...scene,
            components: scene.components.map((component) => ({
              ...component,
              growthAsset: {
                ...component.growthAsset,
                url: `/named-crystal-catalog-api/growth/${component.growthAsset.sha256}.bin`,
              },
            })),
          };
          send(request, response, Buffer.from(`${JSON.stringify(rewritten)}\n`), "application/json; charset=utf-8");
          return;
        }
      }
      reject(response);
    } catch (error) {
      response.statusCode = 409;
      response.setHeader("cache-control", "no-store");
      response.end(error instanceof Error ? error.message : String(error));
    }
  };
  return { index, handler };
};
