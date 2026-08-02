import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";

const REPOSITORY_ROOT = fileURLToPath(new URL("../../", import.meta.url));
const SCRIPT_ROOT = join(REPOSITORY_ROOT, "app", "scripts");
const temporaryDirectories: string[] = [];

function runScript(name: string, ...args: string[]) {
  return spawnSync(process.execPath, [join(SCRIPT_ROOT, name), ...args], {
    cwd: REPOSITORY_ROOT,
    encoding: "utf8",
  });
}

function output(result: ReturnType<typeof runScript>): string {
  return `${result.stdout ?? ""}${result.stderr ?? ""}`;
}

function makeFlipEvidenceRoot(): string {
  const root = mkdtempSync(join(tmpdir(), "phase6-flip-census-"));
  temporaryDirectories.push(root);
  for (const directory of ["phase6-sweep", "phase6-sweep-arm2"]) {
    const target = join(root, directory, "points.json");
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(
      target,
      readFileSync(join(REPOSITORY_ROOT, "evidence", directory, "points.json")),
    );
  }
  return root;
}

afterEach(() => {
  while (temporaryDirectories.length > 0) {
    const directory = temporaryDirectories.pop();
    if (directory !== undefined) rmSync(directory, { recursive: true, force: true });
  }
});

describe("Phase 6 independent evidence script labels", () => {
  it("labels arm 1 as measured-only rather than the registered ADR 0026 headline", () => {
    const result = runScript("phase6-wp5-independent.mjs");
    const text = output(result);
    expect(result.status).toBe(0);
    expect(text).toContain("MEASURED-ONLY AGREEMENT: 3/90");
    expect(text).toContain("not the registered ADR 0026 conservative-intersection headline");
    expect(text).not.toMatch(/^\s*HEADLINE agree/m);
  });

  it("labels both arm-2 denominators as measured-only", () => {
    const result = runScript("phase6-arm2-independent.mjs");
    const text = output(result);
    expect(result.status).toBe(0);
    expect(text).toContain("MEASURED-ONLY AGREEMENT: 54/78 in arm scope; 54/90 in the arm-1 common scope");
    expect(text).toContain("not the registered ADR 0026 conservative-intersection headline");
    expect(text).not.toMatch(/^\s*HEADLINE\s/m);
  });

  it("evaluates TAX2 M2 with its own unit prefactors, not CAK's A_prism curve", () => {
    const result = runScript("phase6-libbrecht-closed-forms.mjs");
    const text = output(result);
    expect(result.status).toBe(0);
    expect(text).toContain("project digitized 0.0280% [x0.93, -6.67%]");
    expect(text).toContain("project digitized 0.2700% [x1.35, +35.00%]");
    const m2Start = text.lastIndexOf("\n      2306.13087v1 M2");
    const m1Start = text.lastIndexOf("\n      2306.13087v1 M1");
    expect(m2Start).toBeGreaterThan(-1);
    expect(m1Start).toBeGreaterThan(m2Start);
    const m2Block = text.slice(m2Start, m1Start);
    expect(m2Block.match(/swaps =\s+1\s+at \(Tm-T\) = 8\.39/g)).toHaveLength(11);
  });

  it("pins the withdrawn linear proxy's invalid-row audit", () => {
    const result = runScript("phase6-sdak-arm2-expectation.mjs");
    const text = output(result);
    expect(result.status).toBe(0);
    expect(text).toContain(
      "Linear-fit alternative: REFUSED (9/78 headline rows have nonpositive/nonfinite AR)",
    );
    expect(text).toContain(
      "audit decomposition: 57 valid positive-AR agreements + " +
        "9 impossible values historically habit-scored = 66/78",
    );
  });
});

describe("Phase 6 registered flip census", () => {
  it("pins the pure-class, six-ladder scope and the tracked census", () => {
    const result = runScript("phase6-flip-census.mjs");
    const text = output(result);
    expect(result.status).toBe(0);
    expect(text).toContain("historical measured-only flip diagnostic; not R15 and not Phase 6 gate evidence");
    expect(text).toContain("registered pure-class flip operator; neutral and invalid rows are skipped");
    expect(text.match(/LADDER SCOPE: 2\/6 ladders contain a flip; 4\/6 contain none\./g)).toHaveLength(2);
    expect(text).toContain(
      "Each arm has two plate->column flips in 2/6 ladders, none in 4/6, and no reverse flip.",
    );
  });

  it("fails closed when a registered row is missing", () => {
    const root = makeFlipEvidenceRoot();
    const path = join(root, "phase6-sweep", "points.json");
    const rows = JSON.parse(readFileSync(path, "utf8")) as unknown[];
    rows.pop();
    writeFileSync(path, `${JSON.stringify(rows)}\n`, "utf8");

    const result = runScript("phase6-flip-census.mjs", root);
    expect(result.status).toBe(1);
    expect(output(result)).toContain("203 rows, expected exactly 204");
  });

  it("independently catches a stored-class mutation before counting flips", () => {
    const root = makeFlipEvidenceRoot();
    const path = join(root, "phase6-sweep-arm2", "points.json");
    const rows = JSON.parse(readFileSync(path, "utf8")) as {
      modelClass: string;
      point: { tempC: number; fraction: number };
    }[];
    rows[0]!.modelClass = "plate";
    writeFileSync(path, `${JSON.stringify(rows)}\n`, "utf8");

    const result = runScript("phase6-flip-census.mjs", root);
    expect(result.status).toBe(1);
    expect(output(result)).toContain("stored modelClass=plate, re-derived neutral");
  });

  it("rejects a short arm-1 row and an arm-2 non-size-target row", () => {
    const root = makeFlipEvidenceRoot();
    const arm1Path = join(root, "phase6-sweep", "points.json");
    const arm1 = JSON.parse(readFileSync(arm1Path, "utf8")) as Array<{
      result: { largestExtent: number };
    }>;
    arm1[0]!.result.largestExtent = 20;
    writeFileSync(arm1Path, `${JSON.stringify(arm1)}\n`, "utf8");
    const short = runScript("phase6-flip-census.mjs", root);
    expect(short.status).toBe(1);
    expect(output(short)).toContain("largestExtent=20, expected the historical measurement target 21");

    const freshRoot = makeFlipEvidenceRoot();
    const arm2Path = join(freshRoot, "phase6-sweep-arm2", "points.json");
    const arm2 = JSON.parse(readFileSync(arm2Path, "utf8")) as Array<{
      result: { config: { stopReason: string } };
    }>;
    arm2[0]!.result.config.stopReason = "step-cap";
    writeFileSync(arm2Path, `${JSON.stringify(arm2)}\n`, "utf8");
    const stopped = runScript("phase6-flip-census.mjs", freshRoot);
    expect(stopped.status).toBe(1);
    expect(output(stopped)).toContain("config.stopReason=step-cap, expected size-target");
  });

  it("rejects shifted raw and serialized supersaturation coordinates", () => {
    const rawRoot = makeFlipEvidenceRoot();
    const rawPath = join(rawRoot, "phase6-sweep", "points.json");
    const rawRows = JSON.parse(readFileSync(rawPath, "utf8")) as Array<{
      result: { sigmaInf: number };
    }>;
    rawRows[0]!.result.sigmaInf += 0.001;
    writeFileSync(rawPath, `${JSON.stringify(rawRows)}\n`, "utf8");
    const raw = runScript("phase6-flip-census.mjs", rawRoot);
    expect(raw.status).toBe(1);
    expect(output(raw)).toContain("point/result coordinates disagree");

    const configRoot = makeFlipEvidenceRoot();
    const configPath = join(configRoot, "phase6-sweep-arm2", "points.json");
    const configRows = JSON.parse(readFileSync(configPath, "utf8")) as Array<{
      result: { config: { sigmaInf: number } };
    }>;
    configRows[0]!.result.config.sigmaInf += 0.001;
    writeFileSync(configPath, `${JSON.stringify(configRows)}\n`, "utf8");
    const config = runScript("phase6-flip-census.mjs", configRoot);
    expect(config.status).toBe(1);
    expect(output(config)).toContain("config.sigmaInf=0.019, expected 0.018");
  });
});
