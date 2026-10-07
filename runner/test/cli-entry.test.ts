import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { sameNativePath } from "../../scripts/cli-entry.ts";

const ROOT = resolve(import.meta.dirname, "../..");
const SCRIPTS = [
  "gutcheck-bake-growth.ts",
  "gutcheck-build-growth-comparison.ts",
  "gutcheck-publish-growth-comparison.ts",
];

describe("portable CLI entry boundary", () => {
  it("uses host case semantics and keeps distinct paths distinct", () => {
    const path = resolve(ROOT, "scripts", SCRIPTS[0]!);
    expect(sameNativePath(path, path.toUpperCase())).toBe(process.platform === "win32");
    expect(sameNativePath(path, `${path}.other`)).toBe(false);
  });

  for (const script of SCRIPTS) {
    it(`does not execute imported ${script} when an eval positional argument names it`, () => {
      const path = resolve(ROOT, "scripts", script);
      const code = "await import((await import('node:url')).pathToFileURL(process.argv[1]).href); " +
        "console.log('import remained inert')";
      const child = spawnSync(process.execPath, ["--input-type=module", `--eval=${code}`, path], {
        cwd: ROOT,
        encoding: "utf8",
      });
      expect(child.status, child.stderr).toBe(0);
      expect(child.stdout.trim()).toBe("import remained inert");
      expect(child.stderr).toBe("");
    });
  }

  it("executes the comparison CLI and refuses incomplete arguments", () => {
    const child = spawnSync(process.execPath, [resolve(ROOT, "scripts/gutcheck-build-growth-comparison.ts")], {
      cwd: ROOT,
      encoding: "utf8",
    });
    expect(child.status).toBe(1);
    expect(child.stderr).toContain("--poster-start-time is required");
  });

  it("executes the retired publisher CLI and refuses before probing a configured NAS", () => {
    const child = spawnSync(process.execPath, [resolve(ROOT, "scripts/gutcheck-publish-growth-comparison.ts")], {
      cwd: ROOT,
      encoding: "utf8",
      env: { ...process.env, VCC_NAS_ROOT: resolve(ROOT, "missing-retired-nas") },
    });
    expect(child.status).toBe(1);
    expect(child.stderr).toContain("retired Run B publisher");
    expect(child.stdout).toBe("");
  });
});
