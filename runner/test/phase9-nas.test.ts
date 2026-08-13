import { mkdirSync, mkdtempSync, realpathSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  assertPhase9ShareRelativePath,
  detectPhase9NasRoot,
  normalizeFrozenKnowledgeNasPath,
  resolvePhase9NasFile,
} from "../src/phase9-nas.js";

function makeNasFixture(prefix = "phase9-nas-"): string {
  const root = mkdtempSync(join(tmpdir(), prefix));
  mkdirSync(join(root, "research-cache"));
  return root;
}

describe("Phase 9 NAS resolver", () => {
  it("uses an attached explicit override and detects either platform mount candidate", () => {
    const macStyle = makeNasFixture("phase9-mac-mount-");
    const windowsStyle = makeNasFixture("phase9-windows-mount-");
    expect(detectPhase9NasRoot({ VCC_NAS_ROOT: macStyle })).toBe(`${macStyle}/`);
    expect(detectPhase9NasRoot({}, ["/missing-phase9-mount", windowsStyle])).toBe(`${windowsStyle}/`);
    expect(detectPhase9NasRoot({}, ["/missing-phase9-mount"])).toBeNull();
    expect(() => detectPhase9NasRoot({ VCC_NAS_ROOT: "/missing-phase9-mount" })).toThrow(
      /does not contain research-cache/u,
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

  it("resolves a contained regular artifact and reports its exact size", () => {
    const root = makeNasFixture();
    const artifact = join(root, "research-cache", "source.pdf");
    writeFileSync(artifact, "source bytes");
    expect(resolvePhase9NasFile("research-cache/source.pdf", root)).toEqual({
      kind: "ok",
      path: realpathSync.native(artifact),
      byteLength: 12,
    });
  });

  it("refuses traversal, directories, missing files, and link-based escape", () => {
    const root = makeNasFixture();
    const outside = mkdtempSync(join(tmpdir(), "phase9-outside-"));
    const outsideFile = join(outside, "source.pdf");
    writeFileSync(outsideFile, "outside bytes");
    symlinkSync(outsideFile, join(root, "research-cache", "redirect.pdf"));

    expect(resolvePhase9NasFile("../escape.pdf", root).kind).toBe("forbidden");
    expect(resolvePhase9NasFile("research-cache", root).kind).toBe("not-found");
    expect(resolvePhase9NasFile("research-cache/missing.pdf", root).kind).toBe("not-found");
    expect(resolvePhase9NasFile("research-cache/redirect.pdf", root).kind).toBe("forbidden");
  });
});
