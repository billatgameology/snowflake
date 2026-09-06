import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import {
  CURRENT_CLASSIFICATIONS,
  renderCurrentAuditTable,
} from "../../scripts/named-crystal-current-audit.ts";

const REPO = resolve(import.meta.dirname, "../..");
const audit = JSON.parse(
  readFileSync(resolve(REPO, "docs/named-snow-crystal-current-assets.json"), "utf8"),
) as Parameters<typeof renderCurrentAuditTable>[0];

describe("current named-crystal asset audit", () => {
  it("exhaustively binds the 52 current assets below the web ceiling", () => {
    expect(Object.keys(CURRENT_CLASSIFICATIONS)).toHaveLength(52);
    expect(audit.summary).toEqual({
      assetCount: 52,
      websiteEntryCount: 51,
      totalWebBytes: 196_599_652,
      maximumWebBytes: 10_003_779,
      webPayloadLimitBytes: 20_000_000,
      strongMatches: 45,
      nearMatches: 7,
    });
    expect(new Set(audit.assets.map((asset) => asset.id)).size).toBe(52);
    expect(audit.assets.every((asset) => asset.webBytes < audit.summary.webPayloadLimitBytes)).toBe(true);
    expect(audit.assets.filter((asset) => !asset.websiteIncluded).map((asset) => asset.id)).toEqual(["fig6"]);
  });

  it("renders all exact assets as a linked text table without promoting them to catalog slots", () => {
    const output = resolve(REPO, "docs/named-snow-crystal-current-assets.md");
    const table = renderCurrentAuditTable(audit, output);
    const assetRows = table.split("\n").filter((line) =>
      audit.assets.some((asset) => line.startsWith(`| ${asset.id} |`)),
    );
    expect(assetRows).toHaveLength(52);
    expect(table).toContain("| fig30 | hollow-columns | strong | 2,635,627 | yes |");
    expect(table).toContain("These are visual morphology matches, not accepted");
  });
});
