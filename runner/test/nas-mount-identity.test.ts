import {
  linkSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "vitest";

import {
  detectNasMount,
  NAS_CANDIDATE_MOUNTS,
  NAS_SHARE_MARKER,
  NAS_SHARE_MARKER_PATH,
  pathIsWithinRoot,
} from "../../scripts/nas-root.ts";
import { detectPhase9NasRoot } from "../src/phase9-nas.ts";

const roots: string[] = [];

function fixture(label: string): string {
  const root = mkdtempSync(join(tmpdir(), `nas-mount-${label}-`));
  roots.push(root);
  return root;
}

function writeMarker(root: string, value: unknown = NAS_SHARE_MARKER): void {
  writeFileSync(join(root, NAS_SHARE_MARKER_PATH), `${JSON.stringify(value)}\n`);
}

const CAN_SYMLINK = (() => {
  const root = fixture("symlink-probe");
  const link = join(root, "link");
  try {
    symlinkSync(join(root, "missing"), link);
    return true;
  } catch {
    return false;
  }
})();

const CAN_HARDLINK = (() => {
  const root = fixture("hardlink-probe");
  try {
    writeFileSync(join(root, "source"), "probe");
    linkSync(join(root, "source"), join(root, "alias"));
    return true;
  } catch {
    return false;
  }
})();

afterAll(() => {
  for (const root of roots) rmSync(root, { recursive: true, force: true });
});

describe("shared NAS mount identity", () => {
  it("uses the exact marker for canonical, compatibility, shared, and candidate resolution", () => {
    const root = fixture("valid");
    writeMarker(root);
    // normalizeEnvironmentRoot folds the mount identity to lowercase on win32 by contract;
    // the fixture path must be folded the same way before comparison.
    const normalized = `${root.replace(/\\/gu, "/")}/`;
    const expected = process.platform === "win32" ? normalized.toLowerCase() : normalized;

    expect(detectNasMount({ VCC_NAS_ROOT: root })).toBe(expected);
    expect(detectNasMount({ GUTCHECK_NAS_ROOT: root })).toBe(expected);
    expect(detectNasMount({ VCC_NAS_ROOT: root, GUTCHECK_NAS_ROOT: `${root}/` })).toBe(expected);
    expect(detectNasMount({}, [join(root, "missing"), root])).toBe(expected);
    expect(detectPhase9NasRoot({ VCC_NAS_ROOT: root })).toBe(expected);
  });

  it("fails closed for missing, malformed, wrong, extra-field, and non-file markers", () => {
    const missing = fixture("missing-marker");
    expect(() => detectNasMount({ VCC_NAS_ROOT: missing })).toThrow(/missing \.snowflake-nas\.json/u);

    const malformed = fixture("malformed-marker");
    writeFileSync(join(malformed, NAS_SHARE_MARKER_PATH), "{not-json");
    expect(() => detectNasMount({ VCC_NAS_ROOT: malformed })).toThrow(/malformed JSON/u);

    const wrong = fixture("wrong-marker");
    writeMarker(wrong, { format: "snowflake-nas-share-v1", projectId: "another-project" });
    expect(() => detectNasMount({ VCC_NAS_ROOT: wrong })).toThrow(/wrong identity schema/u);

    const extra = fixture("extra-marker-field");
    writeMarker(extra, { ...NAS_SHARE_MARKER, label: "looks harmless" });
    expect(() => detectNasMount({ VCC_NAS_ROOT: extra })).toThrow(/wrong identity schema/u);

    const directory = fixture("directory-marker");
    mkdirSync(join(directory, NAS_SHARE_MARKER_PATH));
    expect(() => detectNasMount({ VCC_NAS_ROOT: directory })).toThrow(/not an ordinary non-symlink file/u);
  });

  it.skipIf(!CAN_SYMLINK)("refuses a symlink marker even when its target stays inside the root", () => {
    const root = fixture("marker-link");
    writeFileSync(join(root, "actual-marker.json"), `${JSON.stringify(NAS_SHARE_MARKER)}\n`);
    symlinkSync(join(root, "actual-marker.json"), join(root, NAS_SHARE_MARKER_PATH));
    expect(() => detectNasMount({ VCC_NAS_ROOT: root })).toThrow(/not an ordinary non-symlink file/u);
  });

  it.skipIf(!CAN_SYMLINK)("refuses a configured symlink root", () => {
    const root = fixture("actual-root");
    writeMarker(root);
    const parent = fixture("root-link-parent");
    const linkedRoot = join(parent, "share");
    symlinkSync(root, linkedRoot, "dir");
    expect(() => detectNasMount({ VCC_NAS_ROOT: linkedRoot })).toThrow(/root is not an ordinary non-symlink directory/u);
  });

  it.skipIf(!CAN_HARDLINK)("refuses a hard-linked share marker", () => {
    const root = fixture("marker-hardlink");
    writeFileSync(join(root, "marker-source.json"), `${JSON.stringify(NAS_SHARE_MARKER)}\n`);
    linkSync(join(root, "marker-source.json"), join(root, NAS_SHARE_MARKER_PATH));
    expect(() => detectNasMount({ VCC_NAS_ROOT: root })).toThrow(/not an ordinary non-symlink file/u);
  });

  it("rejects a same-length in-place marker mutation after the first read", () => {
    const root = fixture("marker-mutation");
    writeMarker(root);
    const original = `${JSON.stringify(NAS_SHARE_MARKER)}\n`;
    const replacement = original.replace("virtual-cloud-chamber", "virtual-cloud-chambeX");
    expect(Buffer.byteLength(replacement)).toBe(Buffer.byteLength(original));
    expect(() => detectNasMount({ VCC_NAS_ROOT: root }, [], {
      afterMarkerRead: (markerPath) => writeFileSync(markerPath, replacement),
    })).toThrow(/changed/u);
  });

  it("rejects two environment variables that identify different marked roots", () => {
    const canonical = fixture("canonical");
    const compatibility = fixture("compatibility");
    writeMarker(canonical);
    writeMarker(compatibility);
    expect(() => detectNasMount({
      VCC_NAS_ROOT: canonical,
      GUTCHECK_NAS_ROOT: compatibility,
    })).toThrow(/conflicts with legacy GUTCHECK_NAS_ROOT/u);
  });

  it("does not fall back after an explicit wrong root and rejects relative configuration", () => {
    const candidate = fixture("candidate");
    writeMarker(candidate);
    const wrong = fixture("explicit-wrong");
    expect(() => detectNasMount({ VCC_NAS_ROOT: wrong }, [candidate])).toThrow(/not the marked snowcrystal share/u);
    expect(() => detectNasMount({ VCC_NAS_ROOT: "relative/share" }, [candidate])).toThrow(/absolute/u);
    expect(detectNasMount({}, [wrong])).toBeNull();
  });

  it("pins both automatic host candidates and handles drive roots without prefix confusion", () => {
    expect(NAS_CANDIDATE_MOUNTS).toEqual(["S:/", "/Volumes/snowcrystal/"]);
    expect(pathIsWithinRoot("S:\\", "S:\\", "win32")).toBe(true);
    expect(pathIsWithinRoot("S:/", "S:/out/artifact.bin", "win32")).toBe(true);
    expect(pathIsWithinRoot("S:\\", "s:\\out\\artifact.bin", "win32")).toBe(true);
    expect(pathIsWithinRoot("S:\\out", "S:\\outside\\artifact.bin", "win32")).toBe(false);
    expect(pathIsWithinRoot("S:\\", "T:\\out\\artifact.bin", "win32")).toBe(false);
    expect(pathIsWithinRoot("/Volumes/snowcrystal", "/Volumes/snowcrystal/out/file", "darwin")).toBe(true);
    expect(pathIsWithinRoot("/Volumes/snowcrystal", "/Volumes/snowcrystal-copy/file", "darwin")).toBe(false);
  });
});
