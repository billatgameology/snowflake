import { mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { afterEach, describe, expect, it } from "vitest";

import {
  decideNasCatalogServePath,
  parseNasAssetCatalogV1,
} from "../../scripts/nas-asset-lib.ts";

const REPO = resolve(import.meta.dirname, "../..");
const SCRIPT = join(REPO, "scripts/gutcheck-build-index.ts");
const CATALOGUE = parseNasAssetCatalogV1(readFileSync(join(REPO, "docs/nas-assets.json"), "utf8"));
const temporaryRoots: string[] = [];

function temporaryRoot(): string {
  const root = mkdtempSync(join(tmpdir(), "gutcheck-index-catalog-"));
  temporaryRoots.push(root);
  return root;
}

function put(path: string, contents = "fixture"): void {
  mkdirSync(resolve(path, ".."), { recursive: true });
  writeFileSync(path, contents);
}

function collectStrings(value: unknown, output: string[] = []): string[] {
  if (typeof value === "string") output.push(value);
  else if (Array.isArray(value)) value.forEach((entry) => collectStrings(entry, output));
  else if (value !== null && typeof value === "object") {
    Object.values(value).forEach((entry) => collectStrings(entry, output));
  }
  return output;
}

afterEach(() => {
  for (const root of temporaryRoots.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe("gutcheck index catalogue boundary", () => {
  it("emits only catalogue-authorized logical NAS URLs from local or NAS staging", () => {
    const working = temporaryRoot();
    const share = join(working, "share");
    const bulk = join(share, "out/gutcheck-gg-realism");
    const recordName = readdirSync(join(REPO, "evidence/gutcheck-gg-realism/gen-records"))
      .find((name) => name.endsWith("-record.json"));
    expect(recordName).toBeDefined();
    const id = (recordName as string).replace(/-record\.json$/u, "");

    put(join(bulk, "large/gen", `${id}-mesh.bin`));
    put(join(bulk, "large/anim", id, "manifest.json"), JSON.stringify({ complete: true, frames: [{}, {}] }));
    put(join(bulk, "gen/renders", `${id}-render.png`));
    put(join(bulk, "photos/known-private.png"));
    put(join(bulk, "figs/side-by-side-private.png"));
    put(join(working, "out/gutcheck-gg-realism/style-private.png"));
    put(
      join(share, ".snowflake-nas.json"),
      `${JSON.stringify({ format: "snowflake-nas-share-v1", projectId: "virtual-cloud-chamber" })}\n`,
    );

    const result = spawnSync(process.execPath, [SCRIPT], {
      cwd: working,
      encoding: "utf8",
      env: {
        ...process.env,
        VCC_NAS_ROOT: share,
        GUTCHECK_NAS_ROOT: share,
      },
    });
    expect(result.status, result.stderr).toBe(0);

    const indexPath = join(working, "out/gutcheck-gg-realism/index.json");
    const source = readFileSync(indexPath, "utf8");
    const index = JSON.parse(source) as { root: string; sections: unknown[] };
    expect(index.root).toBe("out/gutcheck-gg-realism");
    expect(source).not.toContain(working);
    expect(source).not.toContain(bulk);
    expect(source).not.toContain("/@fs/");
    expect(source).not.toContain("known-private.png");
    expect(source).not.toContain("side-by-side-private.png");
    expect(source).not.toContain("style-private.png");

    const urls = collectStrings(index).filter((value) => value.includes("/nas/"));
    expect(urls.some((url) => url.includes(`/nas/out/gutcheck-gg-realism/large/gen/${id}-mesh.bin`))).toBe(true);
    expect(urls.some((url) => url.includes(`/nas/out/gutcheck-gg-realism/large/anim/${id}/manifest.json`))).toBe(true);
    expect(urls.some((url) => url.includes(`/nas/out/gutcheck-gg-realism/gen/renders/${id}-render.png`))).toBe(true);
    expect(urls.length).toBeGreaterThan(0);
    for (const url of urls) {
      const encoded = url.slice(url.indexOf("/nas/") + "/nas/".length).split(/[?&]/u, 1)[0] as string;
      const logical = decodeURIComponent(encoded);
      expect(decideNasCatalogServePath(CATALOGUE, logical).kind, url).toBe("allow");
    }
  });

  it("does not turn local out staging into a browsable NAS asset", () => {
    const working = temporaryRoot();
    const share = join(working, "empty-share");
    put(
      join(share, ".snowflake-nas.json"),
      `${JSON.stringify({ format: "snowflake-nas-share-v1", projectId: "virtual-cloud-chamber" })}\n`,
    );
    put(join(working, "out/gutcheck-gg-realism/large/gen/local-only-mesh.bin"));
    put(join(working, "out/gutcheck-gg-realism/gen/renders/local-only-render.png"));
    put(
      join(working, "out/gutcheck-gg-realism/large/anim/dialin-b1p3-500-f2/manifest.json"),
      JSON.stringify({ complete: true, frames: [{ tick: 0 }, { tick: 2 }] }),
    );

    const result = spawnSync(process.execPath, [SCRIPT], {
      cwd: working,
      encoding: "utf8",
      env: {
        ...process.env,
        VCC_NAS_ROOT: share,
        GUTCHECK_NAS_ROOT: share,
      },
    });
    expect(result.status, result.stderr).toBe(0);
    const source = readFileSync(join(working, "out/gutcheck-gg-realism/index.json"), "utf8");
    expect(source).not.toContain("local-only-mesh.bin");
    expect(source).not.toContain("local-only-render.png");
    expect(source).not.toContain("dialin-b1p3-500-f2/manifest.json");
    expect(source).not.toContain("/@fs/");
  });

  it("does not read a local tracked-dialin manifest in explicit detached mode", () => {
    const working = temporaryRoot();
    const dialinId = readdirSync(join(REPO, "evidence/gutcheck-gg-realism/gen-records"))
      .map((name) => name.replace(/-record\.json$/u, ""))
      .find((id) => id.startsWith("dialin-"));
    expect(dialinId).toBeDefined();
    put(
      join(working, "out/gutcheck-gg-realism/large/anim", dialinId as string, "manifest.json"),
      JSON.stringify({ complete: true, frames: [{ tick: 0 }, { tick: 2 }] }),
    );

    const result = spawnSync(process.execPath, [SCRIPT, "--detached"], {
      cwd: working,
      encoding: "utf8",
      env: {
        ...process.env,
        VCC_NAS_ROOT: "",
        GUTCHECK_NAS_ROOT: "",
      },
    });
    expect(result.status, result.stderr).toBe(0);
    const source = readFileSync(join(working, "out/gutcheck-gg-realism/index.json"), "utf8");
    expect(source).not.toContain(`${dialinId as string}/manifest.json`);
    expect(source).not.toContain("/nas/");
  });
});
