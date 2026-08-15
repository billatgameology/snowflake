import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { canonicalJson, canonicalJsonBytes, sha256Bytes } from "../src/gate4-evidence.js";
import {
  derivePhase9SourceOverlayBundle,
  type Phase9SourceArtifactLoader,
  type Phase9SourceOverlayInputs,
} from "../src/phase9-source-overlay.js";
import {
  verifyPhase9SourceOverlayPublication,
  type Phase9SourceOverlayVerifyInputs,
} from "../src/phase9-source-overlay-verify.js";

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function jsonl(rows: readonly unknown[]): Uint8Array {
  return encoder.encode(`${rows.map((row) => canonicalJson(row)).join("\n")}\n`);
}

function jsonlObjects(bytes: Uint8Array): Array<Record<string, unknown>> {
  return decoder.decode(bytes).trimEnd().split("\n").map((line) => JSON.parse(line) as Record<string, unknown>);
}

function fixture(): {
  readonly inputs: Phase9SourceOverlayInputs;
  readonly loader: Phase9SourceArtifactLoader;
  readonly sourceBytes: ReadonlyMap<string, Uint8Array>;
} {
  const sourceBytes = new Map<string, Uint8Array>();
  const add = (path: string, label: string) => {
    const bytes = encoder.encode(`${label}\n`);
    sourceBytes.set(path, bytes);
    return { path, bytes: bytes.byteLength, sha256: sha256Bytes(bytes) };
  };

  const acquiredArtifacts = Array.from({ length: 28 }, (_, index) =>
    add(`research-cache/fixture/acquired-${index}.pdf`, `acquired-${index}`));
  const localArtifacts = [
    ...Array.from({ length: 21 }, (_, index) => add(`research-cache/fixture/local-${index}.pdf`, `local-${index}`)),
    add("research-cache/fixture/local-0.zip", "local-zip-0"),
    add("research-cache/fixture/local-1.zip", "local-zip-1"),
  ];
  const knowledgeUnique = [
    ...Array.from({ length: 5 }, (_, index) => add(`research-cache/fixture/knowledge-${index}.pdf`, `knowledge-${index}`)),
    add("research-cache/fixture/knowledge-code.zip", "knowledge-code"),
  ];
  const knowledgeArtifacts = [
    ...acquiredArtifacts.slice(0, 10),
    localArtifacts[21] as { path: string; bytes: number; sha256: string },
    ...knowledgeUnique,
  ];
  const targetedArtifacts = [
    { ...add("research-cache/fixture/targeted.pdf", "targeted-pdf"), sourceId: "FIXTURE-TARGET-PDF", mediaType: "application/pdf" as const },
    { ...add("research-cache/fixture/targeted.zip", "targeted-zip"), sourceId: "FIXTURE-TARGET-ZIP", mediaType: "application/zip" as const },
  ].map(({ bytes, ...row }) => ({ ...row, byteLength: bytes }));

  const acquiredRegisterBytes = jsonl(acquiredArtifacts.map((artifact, index) => ({
    artifactLocator: {
      bytes: artifact.bytes,
      nasRoot: "research-cache/fixture",
      relativePath: `acquired-${index}.pdf`,
      sha256: artifact.sha256,
    },
    sourceId: `A-${index}`,
  })));
  const localRegisterBytes = jsonl(localArtifacts.map((artifact, index) => ({
    byteLength: artifact.bytes,
    id: `L-${index}`,
    logicalRoot: "research-cache/fixture",
    mediaType: artifact.path.endsWith(".pdf") ? "application/pdf" : "application/zip",
    relativePath: artifact.path.slice("research-cache/fixture/".length),
    sha256: artifact.sha256,
  })));
  const knowledgeRegisterBytes = jsonl([
    ...knowledgeArtifacts.map((artifact, index) => ({
      local: {
        path: `/Volumes/snowcrystal/${artifact.path}`,
        sha256: artifact.sha256,
      },
      sourceId: `K-${index}`,
    })),
    {
      identity: { doi: "10.1175/JAS-D-26-0016.1", year: 2026 },
      local: { pdfStatus: "absent" },
      sourceId: "P9K-HP26",
    },
    {
      identity: { doi: "10.1016/0022-0248(82)90176-2", year: 1982 },
      local: { pdfStatus: "no legitimate PDF" },
      sourceId: "P9K-KH82",
    },
    {
      identity: { doi: "10.1007/BF02656742", year: 1987 },
      local: { pdfStatus: "no authorized full text" },
      sourceId: "P9K-WANG87",
    },
  ]);

  const uniqueArtifacts = new Map<string, { path: string; sha256: string }>();
  for (const artifact of [...acquiredArtifacts, ...localArtifacts, ...knowledgeArtifacts, ...targetedArtifacts]) {
    uniqueArtifacts.set(artifact.sha256, artifact);
  }
  expect(uniqueArtifacts.size).toBe(59);
  const dispositionsBytes = jsonl([...uniqueArtifacts.values()]
    .sort((left, right) => left.sha256 < right.sha256 ? -1 : 1)
    .map((artifact, index) => {
      const extractionPrerequisite = index === 0
        ? "Extract fixture endpoint before protocol use."
        : "None for fixture use.";
      return {
        acquisitionPrerequisite: "None for fixture use.",
        artifactSha256: artifact.sha256,
        currency: {
          correction: "Fixture current.",
          currentVersion: "Fixture current.",
          laterAuthorOutput: "Fixture checked.",
          nativeData: "Fixture bytes present.",
          supplement: "Fixture complete.",
        },
        evidenceClass: "native-or-direct-quantitative",
        extractionPrerequisite,
        limitation: "Unresolved in prose only; structured disposition controls.",
        planEffect: "Fixture coverage.",
        protocol: {
          ensemble: "fixture",
          forcing: "fixture",
          geometry: "fixture",
          observable: "fixture",
          pressureGas: "fixture",
          support: "fixture",
          ventilation: "fixture",
        },
        protocolDisposition: {
          required: index === 0,
          restrictions: index === 0 ? [{
            id: `P9R-${artifact.sha256.slice(0, 16).toUpperCase()}-EXTRACTION`,
            kind: "extraction",
            text: extractionPrerequisite,
          }] : [],
        },
        schema: "phase9-source-disposition-v1",
        shelfItems: [index === 0 ? "M-F" : "D-BT"],
        status: "quantitative-input-with-limit",
      };
    }));

  const partialPrefix = "research-cache/phase8b-search/acquired-sources-20260811-v1/";
  const nakaya = [
    add(`${partialPrefix}nakaya-1957-diffusion-cloud-chamber.pdf.partial-corrupt`, "nakaya-a"),
    add(`${partialPrefix}nakaya-1957-diffusion-cloud-chamber.retry.partial-corrupt`, "nakaya-b"),
    add(`${partialPrefix}nakaya-1957-diffusion-cloud-chamber.retry2.partial-corrupt`, "nakaya-c"),
  ];
  const fourthNakayaPath = `${partialPrefix}nakaya-1957-diffusion-cloud-chamber.retry3.partial-corrupt`;
  sourceBytes.set(fourthNakayaPath, sourceBytes.get(nakaya[2]?.path as string) as Uint8Array);
  const completeGondaBytes = sourceBytes.get(acquiredArtifacts[0]?.path as string) as Uint8Array;
  const gondaFirst = add(`${partialPrefix}gonda-1971-skeletal-dendritic.pdf.partial-corrupt`, "gonda-partial");
  const secondGondaPath = `${partialPrefix}gonda-1971-skeletal-dendritic.retry2.partial-corrupt`;
  const thirdGondaPath = `${partialPrefix}gonda-1971-skeletal-dendritic.retry3.partial-corrupt`;
  sourceBytes.set(secondGondaPath, completeGondaBytes);
  sourceBytes.set(thirdGondaPath, completeGondaBytes);
  const completeGondaDigest = sha256Bytes(completeGondaBytes);
  const missingBlockers = [
    {
      affectedShelfItems: ["M-SS"],
      blockerId: "P9B-MISSING-HP26",
      identity: "Harrington and Pokrifka 2026, DOI 10.1175/JAS-D-26-0016.1",
      prerequisite: "Acquire and inspect the final article equations, fit cases, integrator, and hollowing update.",
      sourceRecordId: "P9K-HP26",
      status: "arm-freeze-blocked",
    },
    {
      affectedShelfItems: ["M-V", "M-PT", "M-LH"],
      blockerId: "P9B-MISSING-KH82",
      identity: "Keller and Hallett 1982, DOI 10.1016/0022-0248(82)90176-2",
      prerequisite: "Acquire the controlled-velocity article or freeze a conservative source-supported eligibility bound; no quantitative velocity series is presently available.",
      sourceRecordId: "P9K-KH82",
      status: "arm-freeze-blocked",
    },
    {
      affectedShelfItems: ["FRONTIER-WANG87"],
      blockerId: "P9B-MISSING-WANG87",
      identity: "Wang Angsheng 1987, DOI 10.1007/BF02656742",
      prerequisite: "Acquire an authorized full text before transcribing any equation or prediction; title metadata carry no model formula.",
      sourceRecordId: "P9K-WANG87",
      status: "source-blocked",
    },
  ];
  const nakayaAttempts = [
    ...nakaya,
    { path: fourthNakayaPath, bytes: nakaya[2]?.bytes as number, sha256: nakaya[2]?.sha256 as string },
  ].sort((left, right) => left.path < right.path ? -1 : 1);
  const gondaAttempts = [
    gondaFirst,
    { path: secondGondaPath, bytes: completeGondaBytes.byteLength, sha256: completeGondaDigest },
    { path: thirdGondaPath, bytes: completeGondaBytes.byteLength, sha256: completeGondaDigest },
  ].sort((left, right) => left.path < right.path ? -1 : 1);
  const blockerRows = [
    ...missingBlockers.map((blocker) => ({
      ...blocker,
      kind: "missing-full-text",
      schema: "phase9-source-blocker-v1",
    })),
    ...nakayaAttempts.map((artifact, index) => ({
      affectedShelfItems: ["S2-CONTROLS"],
      blockerId: `P9B-PARTIAL-NAKAYA-${String(index + 1).padStart(2, "0")}`,
      byteLength: artifact.bytes,
      identity: artifact.path,
      kind: "partial-corrupt-attempt",
      prerequisite: "Acquire complete Nakaya fixture.",
      schema: "phase9-source-blocker-v1",
      sha256: artifact.sha256,
      sourceRecordId: "P8B-ACQUISITION-AUDIT-V2",
      status: "source-blocked",
    })),
    ...gondaAttempts.map((artifact, index) => ({
      affectedShelfItems: ["M-PT", "M-LH", "M-GP"],
      blockerId: `P9B-PARTIAL-GONDA-${String(index + 1).padStart(2, "0")}`,
      byteLength: artifact.bytes,
      identity: artifact.path,
      kind: "partial-corrupt-attempt",
      prerequisite: "None; complete Gonda fixture exists.",
      schema: "phase9-source-blocker-v1",
      sha256: artifact.sha256,
      sourceRecordId: "P8B-ACQUISITION-AUDIT-V2",
      status: "resolved-by-complete-artifact",
    })),
  ];
  const partialAttemptRows = [...nakayaAttempts, ...gondaAttempts].map((artifact) => ({
    bytes: artifact.bytes,
    disposition: "partial-corrupt-not-a-source-pdf",
    relativePath: artifact.path.slice(partialPrefix.length),
    schema: "phase8b-partial-acquisition-v1",
  }));
  const partialAttemptsBytes = jsonl(partialAttemptRows);
  sourceBytes.set(
    "research-cache/phase8b-search/acquisition-audit-20260811-v2/partial-attempts.jsonl",
    partialAttemptsBytes,
  );
  sourceBytes.set(
    "research-cache/phase8b-search/acquisition-audit-20260811-v2/report.json",
    canonicalJsonBytes({
      byteCount: 0,
      firstPageRenderPassCount: 0,
      invalidPdfCount: 0,
      pageCount: 0,
      partialAttemptsSha256: sha256Bytes(partialAttemptsBytes),
      partialCorruptAttemptCount: 7,
      pdfCount: 0,
      pdfRegisterSha256: "0".repeat(64),
      pdfinfoPassCount: 0,
      schema: "phase8b-acquisition-audit-report-v1",
      sourceRoot: "research-cache/phase8b-search/acquired-sources-20260811-v1",
    }),
  );
  const targetedCurrencyBytes = encoder.encode(
    `${targetedArtifacts.map((artifact) => `${artifact.path} ${artifact.sha256}`).join("\n")}\n`,
  );
  const baconReportBytes = canonicalJsonBytes({
    path: targetedArtifacts[1]?.path,
    sha256: targetedArtifacts[1]?.sha256,
  });
  const auditEvidencePath = "fixture/source-audit.md";
  const auditEvidence = encoder.encode("Fixture visual audit coverage.\n");
  const auditEvidenceBytes = new Map([[auditEvidencePath, auditEvidence]]);
  const auditsBytes = jsonl([...uniqueArtifacts.values()]
    .sort((left, right) => left.sha256 < right.sha256 ? -1 : 1)
    .map((artifact) => {
      const isPdf = artifact.path.endsWith(".pdf");
      return {
        artifactSha256: artifact.sha256,
        auditEvidence: {
          path: auditEvidencePath,
          sha256: sha256Bytes(auditEvidence),
        },
        locators: [isPdf ? "pdf-page:1;fixture-render" : "archive-member:fixture-entry"],
        mediaType: isPdf ? "application/pdf" : "application/zip",
        method: isPdf ? "reused-page-complete-visual-audit" : "reused-archive-member-audit",
        newlyLoadBearingForPhase9: false,
        reviewer: {
          context: "fixture",
          identity: "fixture-reviewer",
          kind: "reused-record",
          limits: "Fixture-only structural coverage.",
          reviewDate: "2026-08-12",
        },
        schema: "phase9-source-audit-v1",
      };
    }));
  const inputs: Phase9SourceOverlayInputs = {
    scope: "test-fixture",
    adoptionCommit: "fixture-adoption",
    phase8IndexBytes: canonicalJsonBytes({ fixture: true }),
    phase8TargetBookBytes: jsonl([{ fixture: true }]),
    acquiredRegisterBytes,
    localRegisterBytes,
    knowledgeIndexBytes: canonicalJsonBytes({ fixture: true }),
    knowledgeRegisterBytes,
    targetedCurrencyBytes,
    baconReportBytes,
    dispositionsBytes,
    blockersBytes: jsonl(blockerRows),
    auditsBytes,
    auditEvidenceBytes,
    fixtureTargetedArtifacts: targetedArtifacts,
  };
  return {
    inputs,
    sourceBytes,
    loader: {
      load(path: string): Uint8Array {
        const value = sourceBytes.get(path);
        if (value === undefined) throw new Error(`fixture source absent: ${path}`);
        return value;
      },
    },
  };
}

function verifierInputs(
  inputs: Phase9SourceOverlayInputs,
  published: ReadonlyMap<string, Uint8Array>,
): Phase9SourceOverlayVerifyInputs {
  return { ...inputs, published };
}

describe("Phase 9 bounded source overlay", () => {
  it("deduplicates 70 aliases into 55 PDFs and 4 ZIPs and independently verifies all bytes", () => {
    const value = fixture();
    const bundle = derivePhase9SourceOverlayBundle(value.inputs, value.loader);
    expect(bundle.counts).toEqual({
      aliases: 70,
      blockerRows: 10,
      completeArtifacts: 59,
      missingFullTexts: 3,
      partialAttemptPaths: 7,
      pdfs: 55,
      uniquePartialAttemptDigests: 5,
      zipArchives: 4,
    });
    expect(verifyPhase9SourceOverlayPublication(
      verifierInputs(value.inputs, bundle.artifacts),
      value.loader,
    )).toEqual({
      ok: true,
      aliases: 70,
      completeArtifacts: 59,
      pdfs: 55,
      zipArchives: 4,
      missingFullTexts: 3,
      partialAttemptPaths: 7,
      uniquePartialAttemptDigests: 5,
      modelScoresProduced: 0,
    });
    const overlay = decoder.decode(bundle.artifacts.get("source-overlay.jsonl") as Uint8Array);
    expect(overlay).not.toContain("partial-corrupt");
  });

  it("rejects a complete NAS byte mutation", () => {
    const value = fixture();
    const firstPath = [...value.sourceBytes.keys()].find((path) => path.includes("acquired-0.pdf")) as string;
    const mutatedLoader: Phase9SourceArtifactLoader = {
      load(path) {
        return path === firstPath ? encoder.encode("mutated complete bytes\n") : value.loader.load(path);
      },
    };
    expect(() => derivePhase9SourceOverlayBundle(value.inputs, mutatedLoader)).toThrow(/digest differs/u);
  });

  it("rejects a dropped disposition and a dropped blocker row", () => {
    const value = fixture();
    const dispositionLines = decoder.decode(value.inputs.dispositionsBytes).trimEnd().split("\n");
    const blockerLines = decoder.decode(value.inputs.blockersBytes).trimEnd().split("\n");
    expect(() => derivePhase9SourceOverlayBundle({
      ...value.inputs,
      dispositionsBytes: encoder.encode(`${dispositionLines.slice(1).join("\n")}\n`),
    }, value.loader)).toThrow(/cover the exact/u);
    expect(() => derivePhase9SourceOverlayBundle({
      ...value.inputs,
      blockersBytes: encoder.encode(`${blockerLines.slice(1).join("\n")}\n`),
    }, value.loader)).toThrow(/row count/u);
  });

  it("rejects a producer-supplied pass even when the report descriptor is rehashed", () => {
    const value = fixture();
    const bundle = derivePhase9SourceOverlayBundle(value.inputs, value.loader);
    const report = JSON.parse(decoder.decode(bundle.artifacts.get("report.json") as Uint8Array)) as Record<string, unknown>;
    report.state = "pass";
    const forgedReport = canonicalJsonBytes(report);
    const index = JSON.parse(decoder.decode(bundle.artifacts.get("artifact-index.json") as Uint8Array)) as {
      artifacts: Array<Record<string, unknown>>;
    };
    const reportDescriptor = index.artifacts.find((artifact) => artifact.path === "report.json") as Record<string, unknown>;
    reportDescriptor.byteLength = forgedReport.byteLength;
    reportDescriptor.sha256 = sha256Bytes(forgedReport);
    const published = new Map(bundle.artifacts);
    published.set("report.json", forgedReport);
    published.set("artifact-index.json", canonicalJsonBytes(index));
    expect(sha256Bytes(forgedReport)).not.toBe(
      createHash("sha256").update(bundle.artifacts.get("report.json") as Uint8Array).digest("hex"),
    );
    expect(() => verifyPhase9SourceOverlayPublication(
      verifierInputs(value.inputs, published),
      value.loader,
    )).toThrow(/report differs/u);
  });

  it("independently rejects a disposition with a missing protocol or nested disposition field", () => {
    const value = fixture();
    const bundle = derivePhase9SourceOverlayBundle(value.inputs, value.loader);
    const withoutProtocol = jsonlObjects(value.inputs.dispositionsBytes);
    delete withoutProtocol[0]?.protocol;
    expect(() => verifyPhase9SourceOverlayPublication(
      verifierInputs({ ...value.inputs, dispositionsBytes: jsonl(withoutProtocol) }, bundle.artifacts),
      value.loader,
    )).toThrow(/source disposition keys differ/u);

    const withoutRequired = jsonlObjects(value.inputs.dispositionsBytes);
    const protocolDisposition = withoutRequired[0]?.protocolDisposition as Record<string, unknown>;
    delete protocolDisposition.required;
    expect(() => verifyPhase9SourceOverlayPublication(
      verifierInputs({ ...value.inputs, dispositionsBytes: jsonl(withoutRequired) }, bundle.artifacts),
      value.loader,
    )).toThrow(/protocolDisposition keys differ/u);
  });

  it("independently rejects a missing-source identity or shelf mapping shift", () => {
    const value = fixture();
    const bundle = derivePhase9SourceOverlayBundle(value.inputs, value.loader);
    const invented = jsonlObjects(value.inputs.blockersBytes);
    invented[0] = { ...invented[0], identity: "Invented Missing Paper 2099, DOI 10.0000/invented" };
    expect(() => verifyPhase9SourceOverlayPublication(
      verifierInputs({ ...value.inputs, blockersBytes: jsonl(invented) }, bundle.artifacts),
      value.loader,
    )).toThrow(/knowledge provenance|roster mapping/u);

    const shiftedShelf = jsonlObjects(value.inputs.blockersBytes);
    shiftedShelf[0] = { ...shiftedShelf[0], affectedShelfItems: ["D-BT"] };
    expect(() => verifyPhase9SourceOverlayPublication(
      verifierInputs({ ...value.inputs, blockersBytes: jsonl(shiftedShelf) }, bundle.artifacts),
      value.loader,
    )).toThrow(/roster mapping differs/u);
  });

  it("independently rejects missing or digest-shifted visual-audit coverage", () => {
    const value = fixture();
    const bundle = derivePhase9SourceOverlayBundle(value.inputs, value.loader);
    const missing = jsonlObjects(value.inputs.auditsBytes).slice(1);
    expect(() => verifyPhase9SourceOverlayPublication(
      verifierInputs({ ...value.inputs, auditsBytes: jsonl(missing) }, bundle.artifacts),
      value.loader,
    )).toThrow(/digest coverage differs/u);

    const shifted = jsonlObjects(value.inputs.auditsBytes);
    shifted[0] = { ...shifted[0], artifactSha256: "f".repeat(64) };
    expect(() => verifyPhase9SourceOverlayPublication(
      verifierInputs({ ...value.inputs, auditsBytes: jsonl(shifted) }, bundle.artifacts),
      value.loader,
    )).toThrow(/coverage differs/u);
  });

  it("keeps source blockers separate from explicit protocol dispositions and rejects shelf flag forgery", () => {
    const value = fixture();
    const bundle = derivePhase9SourceOverlayBundle(value.inputs, value.loader);
    const shelfFreeze = JSON.parse(decoder.decode(bundle.artifacts.get("shelf-freeze.json") as Uint8Array)) as {
      shelf: Array<Record<string, unknown>>;
    };
    const shelf = (item: string) => shelfFreeze.shelf.find((row) => row.item === item) as Record<string, unknown>;
    expect(shelf("D-BT")).toMatchObject({
      blockerIdentities: [],
      protocolDispositionRequired: false,
      protocolDispositionState: "not-required",
      protocolRestrictions: [],
      sourceBlocked: false,
      sourceBlockerPresent: false,
    });
    expect(shelf("M-F")).toMatchObject({
      protocolDispositionRequired: true,
      protocolDispositionState: "pending",
      sourceBlocked: false,
      sourceBlockerPresent: false,
    });
    expect((shelf("M-F").protocolRestrictions as unknown[]).length).toBe(1);
    expect(shelf("M-SS")).toMatchObject({
      sourceBlocked: false,
      sourceBlockerIds: ["P9B-MISSING-HP26"],
      sourceBlockerPresent: true,
    });
    expect(shelf("FRONTIER-WANG87")).toMatchObject({ sourceBlocked: true, sourceBlockerPresent: true });

    const forgedShelf = structuredClone(shelfFreeze);
    const forgedDbt = forgedShelf.shelf.find((row) => row.item === "D-BT") as Record<string, unknown>;
    forgedDbt.sourceBlocked = true;
    const published = new Map(bundle.artifacts);
    published.set("shelf-freeze.json", canonicalJsonBytes(forgedShelf));
    expect(() => verifyPhase9SourceOverlayPublication(
      verifierInputs(value.inputs, published),
      value.loader,
    )).toThrow(/shelf freeze differs/u);
  });
});
