import { execFileSync } from "node:child_process";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const REPO = resolve(import.meta.dirname, "../..");
const SCRIPT = join(REPO, "scripts/gutcheck-photo-match.mjs");

describe("gutcheck photo-match cache boundary", () => {
  it("advertises the explicit private research root", () => {
    const output = execFileSync(process.execPath, [SCRIPT, "--help"], {
      cwd: REPO,
      encoding: "utf8",
    });

    expect(output).toContain("--root <research-directory>");
    expect(output).toContain("default: <repo>/research");
  });

  it("resolves monograph inputs under the supplied root without writing output", () => {
    const root = resolve(REPO, "..", "photo-match-cache-fixture");
    const output = execFileSync(
      process.execPath,
      [
        SCRIPT,
        "--root",
        root,
        "--only",
        "fig7-vs-mono10p7-fern",
        "--print-inputs",
      ],
      { cwd: REPO, encoding: "utf8" },
    );
    const inputs = JSON.parse(output) as Array<{ id: string; ours: string; real: string }>;

    expect(inputs).toEqual([
      {
        id: "fig7-vs-mono10p7-fern",
        ours: join(REPO, "out/gutcheck-gg-realism/figs/fig7-render.png"),
        real: join(root, "1910.06389v2-llm/figures/fig-10.7/visual.png"),
      },
    ]);
  });
});
