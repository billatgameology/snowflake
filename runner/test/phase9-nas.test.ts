import { mkdirSync, mkdtempSync, realpathSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  assertPhase9ShareRelativePath,
  currentResearchSharePath,
  detectPhase9NasRoot,
  normalizeFrozenKnowledgeNasPath,
  resolvePhase9NasFile,
} from "../src/phase9-nas.js";

function makeNasFixture(prefix = "phase9-nas-"): string {
  const root = mkdtempSync(join(tmpdir(), prefix));
  mkdirSync(join(root, "collections", "research-private-freeze", "2026-08-11", "payload"), { recursive: true });
  writeFileSync(
    join(root, ".snowflake-nas.json"),
    `${JSON.stringify({ format: "snowflake-nas-share-v1", projectId: "virtual-cloud-chamber" })}\n`,
  );
  return root;
}

// detectPhase9NasRoot returns the forward-slash normalized mount by contract; a native Windows
// fixture path must be normalized the same way before comparison.
function mountForm(root: string): string {
  return `${root.replace(/\\/g, "/")}/`;
}

// File symlink creation on Windows needs SeCreateSymbolicLinkPrivilege (admin or Developer
// Mode); without it the escape fixture cannot be built and would misreport the guard as broken.
const CAN_SYMLINK = (() => {
  const probe = join(mkdtempSync(join(tmpdir(), "phase9-symlink-probe-")), "link");
  try {
    symlinkSync(join(probe, "..", "missing-target"), probe);
    return true;
  } catch {
    return false;
  }
})();

describe("Phase 9 NAS resolver", () => {
  it("uses an attached explicit override and detects either platform mount candidate", () => {
    const macStyle = makeNasFixture("phase9-mac-mount-");
    const windowsStyle = makeNasFixture("phase9-windows-mount-");
    expect(detectPhase9NasRoot({ VCC_NAS_ROOT: macStyle })).toBe(mountForm(macStyle));
    expect(detectPhase9NasRoot({}, ["/missing-phase9-mount", windowsStyle])).toBe(mountForm(windowsStyle));
    expect(detectPhase9NasRoot({}, ["/missing-phase9-mount"])).toBeNull();
    expect(() => detectPhase9NasRoot({ VCC_NAS_ROOT: "/missing-phase9-mount" })).toThrow(
      /not the marked snowcrystal share/u,
    );
  });

  it("accepts only normalized share-relative POSIX identities", () => {
    expect(() => assertPhase9ShareRelativePath("research-cache/source.pdf")).not.toThrow();
    for (const path of ["", "/absolute.pdf", "../escape.pdf", "a/../escape.pdf", "a\\b.pdf", "a//b.pdf"]) {
      expect(() => assertPhase9ShareRelativePath(path), path).toThrow(/share-relative/u);
    }
    expect(normalizeFrozenKnowledgeNasPath("/Volumes/snowcrystal/research-cache/source.pdf")).toBe(
      "research-cache/source.pdf",
    );
    expect(() => normalizeFrozenKnowledgeNasPath("S:/research-cache/source.pdf")).toThrow(/registered/u);
  });

  it("maps producer-era research identities to governed collection locators", () => {
    expect(currentResearchSharePath("research-cache/content/source.pdf")).toBe(
      "collections/research-private-freeze/2026-08-11/payload/source.pdf",
    );
    expect(currentResearchSharePath("research-cache/local-worktree-archives/snapshot.tar")).toBe(
      "collections/research-mac-snapshot/2026-08-15/payload/snapshot.tar",
    );
    expect(currentResearchSharePath("research-cache/phase8b-derived/data.json")).toBe(
      "collections/phase8b-derived/2026-08-15/payload/data.json",
    );
    expect(currentResearchSharePath("research-cache/phase8b-search/source.pdf")).toBe(
      "collections/phase8b-search/2026-08-15/payload/source.pdf",
    );
    expect(currentResearchSharePath("research-cache/phase9-search/result.json")).toBe(
      "collections/phase9-search/2026-08-15/payload/result.json",
    );
    expect(currentResearchSharePath("research-cache/post-phase9-intake/20260813-unregistered-v1/source.pdf")).toBe(
      "collections/post-phase9-intake/2026-08-13/payload/source.pdf",
    );
  });

  it("resolves a contained regular artifact and reports its exact size", () => {
    const root = makeNasFixture();
    const artifact = join(root, "collections", "research-private-freeze", "2026-08-11", "payload", "source.pdf");
    writeFileSync(artifact, "source bytes");
    expect(resolvePhase9NasFile("research-cache/content/source.pdf", root)).toEqual({
      kind: "ok",
      path: realpathSync.native(artifact),
      byteLength: 12,
    });
  });

  it("refuses traversal, directories, and missing files", () => {
    const root = makeNasFixture();
    expect(resolvePhase9NasFile("../escape.pdf", root).kind).toBe("forbidden");
    expect(resolvePhase9NasFile("research-cache/content", root).kind).toBe("not-found");
    expect(resolvePhase9NasFile("research-cache/content/missing.pdf", root).kind).toBe("not-found");
  });

  it.skipIf(!CAN_SYMLINK)("refuses link-based escape", () => {
    const root = makeNasFixture();
    const outside = mkdtempSync(join(tmpdir(), "phase9-outside-"));
    const outsideFile = join(outside, "source.pdf");
    writeFileSync(outsideFile, "outside bytes");
    symlinkSync(
      outsideFile,
      join(root, "collections", "research-private-freeze", "2026-08-11", "payload", "redirect.pdf"),
    );
    expect(resolvePhase9NasFile("research-cache/content/redirect.pdf", root).kind).toBe("forbidden");
  });
});
