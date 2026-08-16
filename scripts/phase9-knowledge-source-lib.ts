// Catalogue-bound reads for the four NAS inputs used by the frozen Phase 9 knowledge replay.
//
// The public entry point fixes the collection, paths, byte lengths and digests. The generic
// contract entry point exists so fixture tests can exercise the same descriptor/read/rebind path
// without depending on the physical NAS or copying restricted source bytes into the repository.

import { createHash } from "node:crypto";
import {
  closeSync,
  fstatSync,
  lstatSync,
  readSync,
} from "node:fs";
import type { Stats } from "node:fs";

import {
  openContainedRegularFile,
  type NasAssetCatalogV1,
} from "./nas-asset-lib.ts";
import {
  loadBoundCollectionSelection,
  type BoundCollectionFileV1,
} from "./nas-asset-selection-lib.ts";

export const PHASE9_KNOWLEDGE_COLLECTION = "research-private-freeze@2026-08-11" as const;
export const PHASE9_KNOWLEDGE_LOCATOR =
  "collections/research-private-freeze/2026-08-11/payload" as const;

export type Phase9KnowledgeSourceId =
  | "lambPdf"
  | "iceNodeArchive"
  | "dimensions20231128"
  | "dimensions20240814";

export interface Phase9KnowledgeSourceIdentity {
  readonly id: Phase9KnowledgeSourceId;
  readonly sharePath: string;
  readonly recordedPath: string;
  readonly bytes: number;
  readonly sha256: string;
}

const recordedRoot = "/Volumes/snowcrystal/research-cache/content";
const harringtonPokrifkaDirectory =
  "harrington-pokrifka-revisiting-theories-for-the-growth-of-single-crystalline-ice-2026";

export const PHASE9_KNOWLEDGE_SOURCE_IDENTITIES = Object.freeze([
  Object.freeze({
    id: "lambPdf",
    sharePath: `${PHASE9_KNOWLEDGE_LOCATOR}/lamb-et-al-2025-neural-ode-symbolic-regression.pdf`,
    recordedPath: `${recordedRoot}/lamb-et-al-2025-neural-ode-symbolic-regression.pdf`,
    bytes: 2_013_127,
    sha256: "d1c9822c539365b9fc63203a85e0efab36d9c1508f6836724b8afe0b11e82364",
  }),
  Object.freeze({
    id: "iceNodeArchive",
    sharePath: `${PHASE9_KNOWLEDGE_LOCATOR}/icenode-2025-code-63078e02.zip`,
    recordedPath: `${recordedRoot}/icenode-2025-code-63078e02.zip`,
    bytes: 492_600,
    sha256: "98ff103b4ce5b95851c093f3f6e7717ea923ba420758f36fa1dcdf338b5044d8",
  }),
  Object.freeze({
    id: "dimensions20231128",
    sharePath: `${PHASE9_KNOWLEDGE_LOCATOR}/${harringtonPokrifkaDirectory}/dimensions-20231128.dat`,
    recordedPath: `${recordedRoot}/${harringtonPokrifkaDirectory}/dimensions-20231128.dat`,
    bytes: 1_692,
    sha256: "c4b8d3d5c674898b8e5bfa761e95933b251d59daa833dbd5fb27483238c57c48",
  }),
  Object.freeze({
    id: "dimensions20240814",
    sharePath: `${PHASE9_KNOWLEDGE_LOCATOR}/${harringtonPokrifkaDirectory}/dimensions-20240814.dat`,
    recordedPath: `${recordedRoot}/${harringtonPokrifkaDirectory}/dimensions-20240814.dat`,
    bytes: 4_100,
    sha256: "8aff69945a47d383b708942bb0441768ddf2822f812495fea69e51aebf3f25e8",
  }),
] satisfies readonly Phase9KnowledgeSourceIdentity[]);

export interface LoadedPhase9KnowledgeSource extends Phase9KnowledgeSourceIdentity {
  readonly data: Buffer;
}

export type LoadedPhase9KnowledgeSources = Readonly<
  Record<Phase9KnowledgeSourceId, LoadedPhase9KnowledgeSource>
>;

export interface Phase9KnowledgeReadHooks {
  /** Fault-injection hook. Production callers leave this unset. */
  readonly afterPayloadChunk?: (
    source: Phase9KnowledgeSourceIdentity,
    physicalPath: string,
    bytesRead: number,
  ) => void;
}

export interface LoadCatalogueBoundKnowledgeSourcesOptions {
  readonly catalogue: NasAssetCatalogV1;
  readonly repoRoot: string;
  /** Already marker-validated root of the snowcrystal share. */
  readonly shareRoot: string;
  readonly collection: string;
  readonly locator: string;
  readonly identities: readonly Phase9KnowledgeSourceIdentity[];
  readonly hooks?: Phase9KnowledgeReadHooks;
}

export interface LoadPhase9KnowledgeSourcesOptions {
  readonly catalogue: NasAssetCatalogV1;
  readonly repoRoot: string;
  /** Already marker-validated root of the snowcrystal share. */
  readonly shareRoot: string;
  readonly hooks?: Phase9KnowledgeReadHooks;
}

export class Phase9KnowledgeSourceError extends Error {
  override readonly name = "Phase9KnowledgeSourceError";
}

const fail = (message: string): never => {
  throw new Phase9KnowledgeSourceError(message);
};

const sameFileState = (
  left: Stats,
  right: Stats,
): boolean =>
  left.isFile() &&
  right.isFile() &&
  left.nlink === 1 &&
  right.nlink === 1 &&
  left.dev === right.dev &&
  left.ino === right.ino &&
  left.mode === right.mode &&
  left.size === right.size &&
  left.mtimeMs === right.mtimeMs &&
  left.ctimeMs === right.ctimeMs;

const readExactBoundSource = (
  shareRoot: string,
  locator: string,
  identity: Phase9KnowledgeSourceIdentity,
  selected: BoundCollectionFileV1,
  hooks: Phase9KnowledgeReadHooks | undefined,
): LoadedPhase9KnowledgeSource => {
  if (
    selected.sharePath !== identity.sharePath ||
    selected.bytes !== identity.bytes ||
    selected.sha256 !== identity.sha256
  ) {
    return fail(`catalogue binding disagrees with frozen source identity ${identity.id}`);
  }
  const expectedRelativePath = identity.sharePath.slice(locator.length + 1);
  if (selected.relativePath !== expectedRelativePath) {
    return fail(`catalogue locator stripping disagrees for frozen source identity ${identity.id}`);
  }

  const opened = openContainedRegularFile(shareRoot, identity.sharePath, locator);
  if (opened.kind !== "ok") {
    return fail(`frozen source ${identity.id} is missing or unsafe: ${opened.reason}`);
  }
  try {
    const before = fstatSync(opened.fd);
    if (
      !before.isFile() ||
      before.nlink !== 1 ||
      before.dev !== opened.dev ||
      before.ino !== opened.ino ||
      before.size !== identity.bytes ||
      opened.byteLength !== identity.bytes
    ) {
      return fail(`frozen source ${identity.id} changed before its descriptor read`);
    }

    const chunks: Buffer[] = [];
    let total = 0;
    while (total < identity.bytes) {
      const chunk = Buffer.allocUnsafe(Math.min(1024 * 1024, identity.bytes - total));
      const count = readSync(opened.fd, chunk, 0, chunk.byteLength, null);
      if (count === 0) return fail(`frozen source ${identity.id} ended before its bound byte length`);
      chunks.push(chunk.subarray(0, count));
      total += count;
      hooks?.afterPayloadChunk?.(identity, opened.path, total);
    }
    const sentinel = Buffer.allocUnsafe(1);
    if (readSync(opened.fd, sentinel, 0, 1, null) !== 0) {
      return fail(`frozen source ${identity.id} exceeds its bound byte length`);
    }

    const data = Buffer.concat(chunks, total);
    const after = fstatSync(opened.fd);
    let currentPath;
    try {
      currentPath = lstatSync(opened.path);
    } catch {
      return fail(`frozen source ${identity.id} was removed or replaced while reading`);
    }
    if (
      !sameFileState(before, after) ||
      currentPath.isSymbolicLink() ||
      !currentPath.isFile() ||
      currentPath.nlink !== 1 ||
      currentPath.dev !== after.dev ||
      currentPath.ino !== after.ino ||
      currentPath.mode !== after.mode ||
      currentPath.size !== after.size ||
      currentPath.mtimeMs !== after.mtimeMs ||
      currentPath.ctimeMs !== after.ctimeMs
    ) {
      return fail(`frozen source ${identity.id} changed while reading`);
    }
    const actualSha256 = createHash("sha256").update(data).digest("hex");
    if (data.byteLength !== identity.bytes || actualSha256 !== identity.sha256) {
      return fail(`frozen source ${identity.id} bytes disagree with its catalogue binding`);
    }

    // Re-run the containment walk after the read. This detects a replaced directory ancestor,
    // including one changed to a symlink that happens to resolve back to the same payload.
    const rebound = openContainedRegularFile(shareRoot, identity.sharePath, locator);
    if (rebound.kind !== "ok") {
      return fail(`frozen source ${identity.id} path changed after reading`);
    }
    try {
      const reboundState = fstatSync(rebound.fd);
      if (
        rebound.dev !== after.dev ||
        rebound.ino !== after.ino ||
        rebound.byteLength !== after.size ||
        !sameFileState(after, reboundState)
      ) {
        return fail(`frozen source ${identity.id} was replaced while reading`);
      }
    } finally {
      closeSync(rebound.fd);
    }
    return { ...identity, data };
  } finally {
    closeSync(opened.fd);
  }
};

/**
 * Load one exact active collection and read only contract-named member files through descriptors.
 * This generic form is also the fixture-test seam; production uses the fixed wrapper below.
 */
export function loadCatalogueBoundKnowledgeSources(
  options: LoadCatalogueBoundKnowledgeSourcesOptions,
): LoadedPhase9KnowledgeSources {
  const selection = loadBoundCollectionSelection({
    catalogue: options.catalogue,
    collection: options.collection,
    repoRoot: options.repoRoot,
    shareRoot: options.shareRoot,
  });
  if (selection.identity !== options.collection || selection.state !== "active") {
    return fail(`knowledge source collection must be the exact active catalogue selection`);
  }
  if (selection.locator !== options.locator || selection.ownershipRoot !== options.locator) {
    return fail(`knowledge source collection locator disagrees with the authorized locator`);
  }

  const identitiesById = new Map<Phase9KnowledgeSourceId, Phase9KnowledgeSourceIdentity>();
  const identitiesByPath = new Map<string, Phase9KnowledgeSourceIdentity>();
  for (const identity of options.identities) {
    if (identitiesById.has(identity.id) || identitiesByPath.has(identity.sharePath)) {
      return fail(`knowledge source contract contains a duplicate identity or path`);
    }
    if (!identity.sharePath.startsWith(`${options.locator}/`)) {
      return fail(`knowledge source ${identity.id} is outside the authorized locator`);
    }
    identitiesById.set(identity.id, identity);
    identitiesByPath.set(identity.sharePath, identity);
  }
  if (identitiesById.size !== 4) {
    return fail(`knowledge source contract must name exactly four source identities`);
  }

  const selectedByPath = new Map(selection.files.map((file) => [file.sharePath, file]));
  const loaded = {} as Record<Phase9KnowledgeSourceId, LoadedPhase9KnowledgeSource>;
  for (const identity of options.identities) {
    const selected = selectedByPath.get(identity.sharePath);
    if (selected === undefined) {
      return fail(`frozen source ${identity.id} is not a member of ${options.collection}`);
    }
    loaded[identity.id] = readExactBoundSource(
      options.shareRoot,
      options.locator,
      identity,
      selected,
      options.hooks,
    );
  }
  return Object.freeze(loaded);
}

/** Load the exact four frozen Phase 9 inputs from their one authorized active collection. */
export function loadPhase9KnowledgeSources(
  options: LoadPhase9KnowledgeSourcesOptions,
): LoadedPhase9KnowledgeSources {
  return loadCatalogueBoundKnowledgeSources({
    ...options,
    collection: PHASE9_KNOWLEDGE_COLLECTION,
    locator: PHASE9_KNOWLEDGE_LOCATOR,
    identities: PHASE9_KNOWLEDGE_SOURCE_IDENTITIES,
  });
}
