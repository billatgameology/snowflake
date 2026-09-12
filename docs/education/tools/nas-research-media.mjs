import { createHash } from "node:crypto";
import { readFileSync, statSync } from "node:fs";
import { join, posix } from "node:path";

import { parseNasAssetCatalogV1 } from "../../../scripts/nas-asset-lib.ts";
import { detectNasMount, resolveNasRequest } from "../../../scripts/nas-root.ts";

const COLLECTION_ID = "research-private-freeze@2026-08-11";
const INVENTORY_OVERLAY_ID = "research-media-subset";

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function fail(message) {
  throw new Error(`Education NAS media: ${message}`);
}

function safeResearchPath(value) {
  return typeof value === "string"
    && value.length > 0
    && !value.includes("\\")
    && !value.startsWith("/")
    && !value.includes("\0")
    && posix.normalize(value) === value
    && !value.split("/").includes("..");
}

/**
 * Resolve the tracked research-media inventory through its governed private NAS
 * collection. A detached host returns null so the personal build retains its
 * existing local-cache/placeholder behavior. An attached but inconsistent
 * collection fails closed instead of silently substituting stale local bytes.
 */
export function loadNasResearchMedia(repoRoot) {
  const nasMount = detectNasMount();
  if (nasMount === null) return null;

  const catalog = parseNasAssetCatalogV1(
    readFileSync(join(repoRoot, "docs/nas-assets.json"), "utf8"),
  );
  const collection = catalog.collections.find(
    (entry) => `${entry.assetId}@${entry.version}` === COLLECTION_ID,
  );
  if (
    collection === undefined
    || collection.state !== "active"
    || collection.locator === null
    || collection.storageClass !== "private-source"
    || collection.privacy !== "private"
    || collection.serve.policy !== "deny"
  ) {
    return fail(`${COLLECTION_ID} is not the active, private, non-served source collection`);
  }

  const overlay = catalog.overlays.find((entry) => entry.overlayId === INVENTORY_OVERLAY_ID);
  if (
    overlay === undefined
    || !overlay.appliesTo.includes(COLLECTION_ID)
    || overlay.manifest.storage !== "tracked"
    || overlay.manifest.path !== "research/media-inventory.json"
  ) {
    return fail(`${INVENTORY_OVERLAY_ID} does not bind the tracked inventory to ${COLLECTION_ID}`);
  }

  const inventoryBytes = readFileSync(join(repoRoot, overlay.manifest.path));
  if (
    inventoryBytes.byteLength !== overlay.manifest.bytes
    || sha256(inventoryBytes) !== overlay.manifest.sha256
  ) {
    return fail("the tracked research-media inventory does not match its catalogue binding");
  }
  const inventory = JSON.parse(inventoryBytes.toString("utf8"));
  if (
    inventory.format !== overlay.manifest.format
    || inventory.root !== "research"
    || !Array.isArray(inventory.files)
  ) {
    return fail("the tracked research-media inventory has the wrong schema");
  }

  const files = new Map();
  let totalBytes = 0;
  for (const entry of inventory.files) {
    if (
      entry === null
      || typeof entry !== "object"
      || !safeResearchPath(entry.path)
      || !Number.isSafeInteger(entry.bytes)
      || entry.bytes <= 0
      || typeof entry.sha256 !== "string"
      || !/^[0-9a-f]{64}$/u.test(entry.sha256)
      || files.has(entry.path)
    ) {
      return fail("the tracked research-media inventory contains an invalid or duplicate row");
    }
    files.set(entry.path, entry);
    totalBytes += entry.bytes;
  }
  if (inventory.totals?.files !== files.size || inventory.totals?.bytes !== totalBytes) {
    return fail("the tracked research-media inventory totals do not rederive");
  }

  return Object.freeze({
    collection: COLLECTION_ID,
    resolve(researchPath) {
      if (!safeResearchPath(researchPath)) return fail("an authored media path is unsafe");
      const expected = files.get(researchPath);
      if (expected === undefined) return null;
      const encoded = [collection.locator, researchPath]
        .join("/")
        .split("/")
        .map(encodeURIComponent)
        .join("/");
      const resolution = resolveNasRequest(encoded, nasMount);
      if (resolution.kind !== "ok") {
        return fail(`registered media is ${resolution.kind}: research/${researchPath}`);
      }
      const status = statSync(resolution.path);
      if (!status.isFile() || status.size !== expected.bytes) {
        return fail(`registered media has the wrong type or byte length: research/${researchPath}`);
      }
      return Object.freeze({
        path: resolution.path,
        bytes: expected.bytes,
        sha256: expected.sha256,
        canonicalResearchPath: `research/${researchPath}`,
      });
    },
  });
}
