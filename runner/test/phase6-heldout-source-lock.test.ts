import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { deflateRawSync } from "node:zlib";
import { describe, expect, it } from "vitest";
import {
  loadPhase6HeldoutCandidateLock,
  parsePhase6HeldoutCandidateLockText,
  phase6CoalesceTraceRows,
  phase6HeldoutManifestFailures,
  phase6ReadZipEntries,
  phase6ZipEntriesByBaseName,
  verifyPhase6HeldoutSourceLock,
} from "../src/phase6-heldout-source-lock.ts";

function syntheticZip(
  members: readonly { readonly name: string; readonly text: string; readonly method: 0 | 8 }[],
): Uint8Array {
  const encoder = new TextEncoder();
  const locals: Uint8Array[] = [];
  const centrals: Uint8Array[] = [];
  let localOffset = 0;
  for (const member of members) {
    const name = encoder.encode(member.name);
    const plain = encoder.encode(member.text);
    const compressed =
      member.method === 0 ? plain : new Uint8Array(deflateRawSync(plain));
    const local = new Uint8Array(30 + name.length + compressed.length);
    const localView = new DataView(local.buffer);
    localView.setUint32(0, 0x04034b50, true);
    localView.setUint16(4, 20, true);
    localView.setUint16(8, member.method, true);
    localView.setUint32(18, compressed.length, true);
    localView.setUint32(22, plain.length, true);
    localView.setUint16(26, name.length, true);
    local.set(name, 30);
    local.set(compressed, 30 + name.length);
    locals.push(local);

    const central = new Uint8Array(46 + name.length);
    const centralView = new DataView(central.buffer);
    centralView.setUint32(0, 0x02014b50, true);
    centralView.setUint16(4, 20, true);
    centralView.setUint16(6, 20, true);
    centralView.setUint16(10, member.method, true);
    centralView.setUint32(20, compressed.length, true);
    centralView.setUint32(24, plain.length, true);
    centralView.setUint16(28, name.length, true);
    centralView.setUint32(42, localOffset, true);
    central.set(name, 46);
    centrals.push(central);
    localOffset += local.length;
  }
  const centralSize = centrals.reduce((sum, entry) => sum + entry.length, 0);
  const eocd = new Uint8Array(22);
  const eocdView = new DataView(eocd.buffer);
  eocdView.setUint32(0, 0x06054b50, true);
  eocdView.setUint16(8, members.length, true);
  eocdView.setUint16(10, members.length, true);
  eocdView.setUint32(12, centralSize, true);
  eocdView.setUint32(16, localOffset, true);
  const result = new Uint8Array(localOffset + centralSize + eocd.length);
  let offset = 0;
  for (const entry of [...locals, ...centrals, eocd]) {
    result.set(entry, offset);
    offset += entry.length;
  }
  return result;
}

describe("Phase 6 held-out candidate source lock", () => {
  it("is explicitly candidate-only and pins all 16 usable traces", () => {
    const lock = loadPhase6HeldoutCandidateLock();
    expect(lock.gateMeaning.passEligible).toBe(false);
    expect(lock.harrisonCandidate.status).toBe("source-locked-not-scoreable");
    expect(lock.harrisonCandidate.traces).toHaveLength(16);
    expect(lock.harrisonCandidate.excludedMembers.map((row) => row.name)).toContain(
      "heticegrowth_625.dat",
    );
    expect(lock.harrisonCandidate.requiredAbsence).not.toHaveLength(0);
  });

  it("fails closed if a producer promotes the candidate or removes an expected trace", () => {
    const path = resolve(process.cwd(), "research/phase6-heldout-candidate-lock.json");
    const source = JSON.parse(readFileSync(path, "utf8")) as Record<string, unknown>;
    const promoted = structuredClone(source) as {
      gateMeaning: { passEligible: boolean };
      harrisonCandidate: { traces: unknown[] };
    };
    promoted.gateMeaning.passEligible = true;
    promoted.harrisonCandidate.traces.pop();
    const failures = phase6HeldoutManifestFailures(promoted);
    expect(failures).toContain("candidate lock must carry passEligible=false");
    expect(failures.some((failure) => failure.includes("exactly 16"))).toBe(true);
  });

  it("rejects duplicate raw JSON keys even when JSON.parse would preserve the pinned value", () => {
    const path = resolve(process.cwd(), "research/phase6-heldout-candidate-lock.json");
    const baseline = readFileSync(path, "utf8");
    const needle = '"passEligible": false';
    const changed = baseline.replace(
      needle,
      '"passEligible": true,\n    "passEligible": false',
    );
    expect(changed).not.toBe(baseline);
    expect(changed.match(/"passEligible"/g)).toHaveLength(2);
    expect(JSON.parse(changed).gateMeaning.passEligible).toBe(false);
    expect(() => parsePhase6HeldoutCandidateLockText(changed)).toThrow(
      /normalized-text SHA-256/,
    );
  });

  it("rejects unknown and duplicate CLI flags before external source access", () => {
    const script = resolve(process.cwd(), "scripts/verify-phase6-heldout-source-lock.mjs");
    const baseArgs = [
      script,
      "--harrison", "absent-harrison.zip",
      "--pokrifka", "absent-pokrifka.pdf",
      "--takahashi", "absent-takahashi.pdf",
      "--corrigendum", "absent-corrigendum.pdf",
      "--history", "absent-history.zip",
    ];
    const unknown = spawnSync(process.execPath, [...baseArgs, "--foo", "ignored"], {
      encoding: "utf8",
    });
    expect(unknown.status).not.toBe(0);
    expect(unknown.stderr).toContain("unrecognized flag --foo");
    expect(unknown.stdout).not.toContain("SOURCE LOCK");

    const duplicate = spawnSync(
      process.execPath,
      [...baseArgs, "--harrison", "second.zip"],
      { encoding: "utf8" },
    );
    expect(duplicate.status).not.toBe(0);
    expect(duplicate.stderr).toContain("duplicate flag --harrison");
    expect(duplicate.stdout).not.toContain("SOURCE LOCK");
  });

  it("pins every load-bearing scientific field and makes the full verifier reject each mutation", () => {
    const path = resolve(process.cwd(), "research/phase6-heldout-candidate-lock.json");
    const baseline = JSON.parse(readFileSync(path, "utf8")) as Record<string, unknown>;
    const mutations: readonly {
      readonly name: string;
      readonly apply: (value: any) => void;
      readonly witness: (value: any) => unknown;
    }[] = [
      { name: "condition", apply: (v) => { v.harrisonCandidate.traces[0].tempC = 999; }, witness: (v) => v.harrisonCandidate.traces[0].tempC },
      { name: "Harrison status", apply: (v) => { v.harrisonCandidate.status = "scoreable"; }, witness: (v) => v.harrisonCandidate.status },
      { name: "Takahashi score", apply: (v) => { v.takahashiDiagnostic.scoreable = true; }, witness: (v) => v.takahashiDiagnostic.scoreable },
      { name: "pressure score", apply: (v) => { v.pressureContext.scoreable = true; }, witness: (v) => v.pressureContext.scoreable },
      { name: "missing row", apply: (v) => { v.harrisonCandidate.requiredAbsence = [{}]; }, witness: (v) => v.harrisonCandidate.requiredAbsence },
      { name: "column count", apply: (v) => { v.harrisonCandidate.extraction.columns = 5; }, witness: (v) => v.harrisonCandidate.extraction.columns },
      { name: "time column", apply: (v) => { v.harrisonCandidate.extraction.timeColumnZeroBased = 0; }, witness: (v) => v.harrisonCandidate.extraction.timeColumnZeroBased },
      { name: "mass column", apply: (v) => { v.harrisonCandidate.extraction.massRatioColumnZeroBased = 0; }, witness: (v) => v.harrisonCandidate.extraction.massRatioColumnZeroBased },
      { name: "finite rows", apply: (v) => { v.harrisonCandidate.extraction.finiteRowsOnly = false; }, witness: (v) => v.harrisonCandidate.extraction.finiteRowsOnly },
      { name: "time order", apply: (v) => { v.harrisonCandidate.extraction.requireNondecreasingTime = false; }, witness: (v) => v.harrisonCandidate.extraction.requireNondecreasingTime },
      { name: "positive ratio", apply: (v) => { v.harrisonCandidate.extraction.requirePositiveMassRatio = false; }, witness: (v) => v.harrisonCandidate.extraction.requirePositiveMassRatio },
      { name: "duplicates", apply: (v) => { v.harrisonCandidate.extraction.duplicateTimeOperator = "first"; }, witness: (v) => v.harrisonCandidate.extraction.duplicateTimeOperator },
      { name: "interpolation", apply: (v) => { v.harrisonCandidate.extraction.interpolation = "nearest"; }, witness: (v) => v.harrisonCandidate.extraction.interpolation },
      { name: "rounding", apply: (v) => { v.harrisonCandidate.extraction.reportedDecimalPlaces = 0; }, witness: (v) => v.harrisonCandidate.extraction.reportedDecimalPlaces },
      { name: "gap", apply: (v) => { v.harrisonCandidate.extraction.maximumObservedBracketGapSeconds = 1e9; }, witness: (v) => v.harrisonCandidate.extraction.maximumObservedBracketGapSeconds },
      { name: "mass uncertainty", apply: (v) => { v.harrisonCandidate.observationUncertainty.operator = "[0, infinity]"; }, witness: (v) => v.harrisonCandidate.observationUncertainty.operator },
      { name: "Takahashi mass", apply: (v) => { v.takahashiDiagnostic.ensembleFit.rows[0].massGrams = 999; }, witness: (v) => v.takahashiDiagnostic.ensembleFit.rows[0].massGrams },
      { name: "history status", apply: (v) => { v.historyCandidates[0].status = "scoreable"; }, witness: (v) => v.historyCandidates[0].status },
    ];
    const absentPaths = {
      harrison: "absent-harrison.zip",
      pokrifka: "absent-pokrifka.pdf",
      takahashi: "absent-takahashi.pdf",
      corrigendum: "absent-corrigendum.pdf",
      history: "absent-history.zip",
    };
    for (const mutation of mutations) {
      const changed = structuredClone(baseline) as any;
      const before = mutation.witness(changed);
      mutation.apply(changed);
      expect(mutation.witness(changed), `${mutation.name} did not execute`).not.toEqual(before);
      const failures = phase6HeldoutManifestFailures(changed);
      expect(
        failures.some((failure) => failure.includes("canonical SHA-256")),
        `${mutation.name} passed manifest verification`,
      ).toBe(true);
      const full = verifyPhase6HeldoutSourceLock(changed, absentPaths);
      expect(full.ok, `${mutation.name} passed full verification`).toBe(false);
      expect(full.checkedFiles, `${mutation.name} reached external bytes`).toEqual([]);
    }
  });

  it("uses a deterministic median for duplicate timestamps", () => {
    const result = phase6CoalesceTraceRows([
      [0, 1],
      [1, 7],
      [1, 3],
      [1, 5],
      [2, 9],
      [2, 1],
    ]);
    expect(result.duplicateCount).toBe(3);
    expect(result.rows).toEqual([
      [0, 1],
      [1, 5],
      [2, 5],
    ]);
  });

  it("reads stored and deflated ZIP members and rejects duplicate basenames", () => {
    const entries = phase6ReadZipEntries(
      syntheticZip([
        { name: "stored/a.txt", text: "stored bytes", method: 0 },
        { name: "deflated/b.txt", text: "deflated bytes", method: 8 },
      ]),
    );
    expect(entries.map((entry) => [entry.name, new TextDecoder().decode(entry.bytes)])).toEqual([
      ["stored/a.txt", "stored bytes"],
      ["deflated/b.txt", "deflated bytes"],
    ]);
    const duplicate = phase6ReadZipEntries(
      syntheticZip([
        { name: "one/data.txt", text: "first", method: 0 },
        { name: "two/data.txt", text: "second", method: 8 },
      ]),
    );
    expect(() => phase6ZipEntriesByBaseName(duplicate)).toThrow(
      /duplicate ZIP basename data\.txt/,
    );
  });
});
