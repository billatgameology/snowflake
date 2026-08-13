import { mkdirSync, mkdtempSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  configuredPhase9NasRoot,
  defaultPhase9NasRoot,
  phase9NasArtifactPath,
  phase9NasRelativePath,
  verifiedPhase9NasArtifactPath,
} from "../src/phase9-nas.js";

function makeTempDir(prefix: string): string {
  return mkdtempSync(join(tmpdir(), prefix));
}

describe("Phase 9 NAS resolver", () => {
  it("uses the explicit absolute override and platform defaults", () => {
    expect(configuredPhase9NasRoot({ VCC_NAS_ROOT: "/data/snow" }, "linux")).toBe(
      "/data/snow",
    );
    expect(defaultPhase9NasRoot("darwin")).toBe("/Volumes/snowcrystal");
    expect(defaultPhase9NasRoot("win32")).toBe("S:/");
    expect(() => configuredPhase9NasRoot({ VCC_NAS_ROOT: "relative" }, "darwin")).toThrow(
      /absolute/u,
    );
    expect(() => defaultPhase9NasRoot("linux")).toThrow(/VCC_NAS_ROOT/u);
  });

  it("resolves only contained relative logical paths", () => {
    expect(phase9NasArtifactPath("/data/snow", "research-cache/source.pdf")).toBe(
      "/data/snow/research-cache/source.pdf",
    );
    expect(() => phase9NasArtifactPath("/data/snow", "../escape.pdf")).toThrow(/escapes/u);
    expect(() => phase9NasArtifactPath("/data/snow", "/absolute.pdf")).toThrow(/relative/u);
  });

  it("accepts a regular artifact and returns its portable logical path", () => {
    const root = makeTempDir("phase9-nas-");
    mkdirSync(join(root, "research-cache"));
    const artifact = join(root, "research-cache", "source.pdf");
    writeFileSync(artifact, "source bytes");
    expect(verifiedPhase9NasArtifactPath(root, "research-cache/source.pdf")).toBe(artifact);
    expect(phase9NasRelativePath(root, artifact)).toBe("research-cache/source.pdf");
  });

  it("rejects directories and link-based redirection", () => {
    const root = makeTempDir("phase9-nas-");
    const outside = makeTempDir("phase9-outside-");
    writeFileSync(join(outside, "source.pdf"), "outside bytes");
    symlinkSync(join(outside, "source.pdf"), join(root, "redirect.pdf"));
    expect(() => verifiedPhase9NasArtifactPath(root, ".")).toThrow(/regular/u);
    expect(() => verifiedPhase9NasArtifactPath(root, "redirect.pdf")).toThrow(/symbolic/u);
    expect(() => phase9NasRelativePath(root, join(outside, "source.pdf"))).toThrow(/outside/u);
  });
});
