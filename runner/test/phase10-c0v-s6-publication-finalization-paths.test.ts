import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import {
  parsePhase10C0VS6Matrix,
  parsePhase10C0VS6PacketCatalogue,
  parsePhase10C0VS6PacketProtocol,
  parsePhase10C0VS6PrettyJsonBytes,
  type Phase10C0VS6PacketProtocol,
} from "../src/phase10-c0v-s6-contracts.ts";
import {
  phase10C0VS6ArtifactIdentity,
  type Phase10C0VS6ArtifactIdentity,
} from "../src/phase10-c0v-s6-execution-contracts.ts";
import { phase10C0VS6PhysicalRepositoryRoot } from "../src/phase10-c0v-s6-filesystem.ts";
import type { Phase10C0VS6RawTerminalCandidateProjection } from
  "../src/phase10-c0v-s6-lifecycle.ts";
import {
  independentlyProjectPhase10C0VS6PublicationFinalizationJoins,
  phase10C0VS6ResolveCurrentWholeFileOutputPath,
  type Phase10C0VS6ReopenedPublicationAuthority,
} from "../src/phase10-c0v-s6-published-packet.ts";

const REPOSITORY_ROOT = fileURLToPath(new URL("../..", import.meta.url));
const MATRIX_PATH = "research/phase10-c0v-s6-obligation-matrix-v1.json" as const;
const PREDECESSOR_ROOT = "research/phase10-execution-v2/recovery-v4" as const;
const PREDECESSOR_CATALOGUE_PATH = `${PREDECESSOR_ROOT}/packet-catalogue.json` as const;
const AP_PROTOCOL_PATH = `${PREDECESSOR_ROOT}/packets/a-p-c0v-s6/protocol.json` as const;
const MOVING_PROTOCOL_PATH = `${PREDECESSOR_ROOT}/packets/c0v-moving-produce/protocol.json` as const;

const AP_OUTPUTS = Object.freeze([
  Object.freeze({
    outputId: "out-ap-c0v-s6-artifact-index",
    path: "evidence/phase10-obligation-preflight-v6/artifact-index.json",
  }),
  Object.freeze({
    outputId: "out-ap-c0v-s6-missing-producer",
    path: "evidence/phase10-obligation-preflight-v6/missing-producer.json",
  }),
  Object.freeze({
    outputId: "out-ap-c0v-s6-preflight",
    path: "evidence/phase10-obligation-preflight-v6/packets/a-p-c0v-s6/preflight.json",
  }),
  Object.freeze({
    outputId: "out-ap-c0v-s6-terminal-receipt",
    path: "evidence/phase10-obligation-preflight-v6/packets/a-p-c0v-s6/terminal-receipt.json",
  }),
  Object.freeze({
    outputId: "out-ap-c0v-s6-uncalled-check",
    path: "evidence/phase10-obligation-preflight-v6/uncalled-check.json",
  }),
  Object.freeze({
    outputId: "out-ap-c0v-s6-verification",
    path: "evidence/phase10-obligation-preflight-v6/verification.json",
  }),
] as const);

const temporaryRoots: string[] = [];

afterEach(() => {
  while (temporaryRoots.length > 0) {
    rmSync(temporaryRoots.pop()!, { recursive: true, force: true });
  }
});

function liveBytes(path: string): Uint8Array {
  return new Uint8Array(readFileSync(resolve(REPOSITORY_ROOT, path)));
}

function liveJson(path: string): unknown {
  return parsePhase10C0VS6PrettyJsonBytes(liveBytes(path), path);
}

function writeBytes(root: string, path: string, bytes: Uint8Array): void {
  const absolute = resolve(root, path);
  mkdirSync(dirname(absolute), { recursive: true });
  writeFileSync(absolute, bytes);
}

function outputPaths(
  rows: readonly Readonly<{ readonly outputId: string; readonly path: string }>[],
): Readonly<Record<string, string>> {
  return Object.freeze(Object.fromEntries(rows.map((entry) => [entry.outputId, entry.path])));
}

function syntheticV6ApPacket(): Phase10C0VS6PacketProtocol {
  const predecessor = parsePhase10C0VS6PacketProtocol(liveJson(AP_PROTOCOL_PATH));
  const v6Path = (path: string): string => path
    .replace("phase10-obligation-preflight-v5", "phase10-obligation-preflight-v6")
    .replace("a-p-c0v-s6-20260822-v5", "a-p-c0v-s6-20260822-v6");
  return Object.freeze({
    ...predecessor,
    registeredAttemptId: "a-p-c0v-s6-20260822-v6",
    paths: Object.freeze({
      ...predecessor.paths,
      allowedPublicationPaths: Object.freeze(predecessor.paths.allowedPublicationPaths.map(v6Path)),
      preflightReceiptPath: v6Path(predecessor.paths.preflightReceiptPath),
      terminalReceiptPath: v6Path(predecessor.paths.terminalReceiptPath),
      publicationStagingPaths: Object.freeze(predecessor.paths.publicationStagingPaths.map((entry) =>
        Object.freeze({ finalPath: v6Path(entry.finalPath), stagingPath: v6Path(entry.stagingPath) }))),
    }),
    resources: Object.freeze({
      ...predecessor.resources,
      publicationFinalizationProjections: Object.freeze(
        predecessor.resources.publicationFinalizationProjections.map((entry) => Object.freeze({
          ...entry,
          path: v6Path(entry.path),
          stagingPath: v6Path(entry.stagingPath),
        })),
      ),
    }),
  }) as Phase10C0VS6PacketProtocol;
}

describe("Phase 10 C0V S6 publication finalization path joins", () => {
  it("carries all six fresh A-P v6 identities through current and historical finalization joins", () => {
    const matrix = parsePhase10C0VS6Matrix(liveJson(MATRIX_PATH));
    const packet = syntheticV6ApPacket();
    const catalogue = parsePhase10C0VS6PacketCatalogue(liveJson(PREDECESSOR_CATALOGUE_PATH));
    const subroute = packet.terminalSubroutes.find((entry) =>
      entry.subrouteId === "a-p-c0v-s6-structural-complete");
    expect(subroute?.requiredOutputIds).toEqual(AP_OUTPUTS.map((entry) => entry.outputId));

    const rootPath = mkdtempSync(join(tmpdir(), "phase10-c0v-s6-finalization-paths-"));
    temporaryRoots.push(rootPath);
    const candidateDirectory =
      "out/phase10-execution-v2/recovery-v5/attempts/a-p-c0v-s6/" +
      "a-p-c0v-s6-20260822-v6/candidate";
    const bytesByOutput = new Map(AP_OUTPUTS.map((entry, index) => [
      entry.outputId,
      new TextEncoder().encode(`${index}:${entry.outputId}\n`),
    ]));
    const identities = new Map<string, Phase10C0VS6ArtifactIdentity>();
    for (const entry of AP_OUTPUTS) {
      const bytes = bytesByOutput.get(entry.outputId)!;
      writeBytes(rootPath, entry.path, bytes);
      identities.set(entry.path, phase10C0VS6ArtifactIdentity(entry.path, bytes));
    }
    for (const outputId of [
      "out-ap-c0v-s6-artifact-index",
      "out-ap-c0v-s6-missing-producer",
      "out-ap-c0v-s6-uncalled-check",
    ] as const) {
      const entry = AP_OUTPUTS.find((candidate) => candidate.outputId === outputId)!;
      writeBytes(rootPath, `${candidateDirectory}/${basename(entry.path)}`, bytesByOutput.get(outputId)!);
    }

    const preflightPath = AP_OUTPUTS.find((entry) => entry.outputId === "out-ap-c0v-s6-preflight")!.path;
    const candidate = Object.freeze({
      lifecycle: Object.freeze({
        packet,
        selectedSubrouteId: subroute!.subrouteId,
        preflightIdentity: identities.get(preflightPath)!,
        preflight: Object.freeze({
          observed: Object.freeze({ candidateDirectory }),
        }),
      }),
    }) as unknown as Phase10C0VS6RawTerminalCandidateProjection;
    const authority: Phase10C0VS6ReopenedPublicationAuthority = Object.freeze({
      root: phase10C0VS6PhysicalRepositoryRoot(rootPath),
      catalogue,
      matrix,
      manifest: identities,
      dependencyArtifacts: Object.freeze([]),
    });

    const projection = independentlyProjectPhase10C0VS6PublicationFinalizationJoins(
      authority,
      candidate,
    );
    const expectedPaths = outputPaths(AP_OUTPUTS);
    const rawOutputIds = AP_OUTPUTS
      .map((entry) => entry.outputId)
      .filter((outputId) => !outputId.endsWith("-verification") &&
        !outputId.endsWith("-terminal-receipt"));
    for (const rows of [
      projection.candidatePublicationArtifacts,
      projection.currentVerifiedArtifacts,
      projection.historicalMaterializedPublicationArtifacts,
      projection.historicalVerifiedArtifacts,
    ]) {
      expect(outputPaths(rows.map((entry) => Object.freeze({
        outputId: entry.outputId!,
        path: "identity" in entry ? entry.identity.path : entry.path,
      })))).toEqual(Object.freeze(Object.fromEntries(rawOutputIds.map((outputId) => [
        outputId,
        expectedPaths[outputId],
      ]))));
    }
    expect(projection.selectedPublicationPaths).toEqual(AP_OUTPUTS.map((entry) => entry.path));
    expect(projection.selectedPublicationIdentities).toHaveLength(6);
    for (const [index, identity] of projection.selectedPublicationIdentities.entries()) {
      const expected = AP_OUTPUTS[index]!;
      expect(identity).toEqual(phase10C0VS6ArtifactIdentity(
        expected.path,
        bytesByOutput.get(expected.outputId)!,
      ));
    }
  });

  it("leaves a non-A-P whole-file matrix path unchanged", () => {
    const matrix = parsePhase10C0VS6Matrix(liveJson(MATRIX_PATH));
    const packet = parsePhase10C0VS6PacketProtocol(liveJson(MOVING_PROTOCOL_PATH));
    const definition = matrix.outputs.find((entry) =>
      entry.packetId === "c0v-moving-produce" && entry.outputId === "out-c0v-moving-attempt-ledger");
    expect(definition?.artifact.field).toBeNull();
    expect(phase10C0VS6ResolveCurrentWholeFileOutputPath(
      matrix,
      packet,
      "out-c0v-moving-attempt-ledger",
    )).toBe(definition!.artifact.path);
  });
});
