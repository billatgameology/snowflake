import { resolve } from "node:path";
import {
  loadPhase6HeldoutCandidateLock,
  verifyPhase6HeldoutSourceLock,
} from "../runner/src/phase6-heldout-source-lock.ts";

function usage() {
  return (
    "usage: node scripts/verify-phase6-heldout-source-lock.mjs --manifest-only\n" +
    "   or: node scripts/verify-phase6-heldout-source-lock.mjs " +
    "--harrison <zip> --pokrifka <pdf> --takahashi <pdf> --corrigendum <pdf> --history <zip>"
  );
}

const args = process.argv.slice(2);
const manifestOnly = args.length === 1 && args[0] === "--manifest-only";
const paths = {};
if (!manifestOnly) {
  const expectedKeys = new Set(["harrison", "pokrifka", "takahashi", "corrigendum", "history"]);
  for (let index = 0; index < args.length; index += 2) {
    const flag = args[index];
    const value = args[index + 1];
    if (!flag?.startsWith("--") || value === undefined) throw new Error(usage());
    const key = flag.slice(2);
    if (!expectedKeys.has(key)) throw new Error(`${usage()}\nunrecognized flag ${flag}`);
    if (Object.hasOwn(paths, key)) throw new Error(`${usage()}\nduplicate flag ${flag}`);
    paths[key] = resolve(value);
  }
  for (const key of expectedKeys) {
    if (typeof paths[key] !== "string") throw new Error(`${usage()}\nmissing --${key}`);
  }
}

const lock = loadPhase6HeldoutCandidateLock();
if (manifestOnly) {
  console.log(`SOURCE LOCK MANIFEST OK id=${lock.lockId} passEligible=false traces=16`);
} else {
  const report = verifyPhase6HeldoutSourceLock(lock, paths);
  if (!report.ok) {
    for (const failure of report.failures) console.error(`SOURCE LOCK FAIL: ${failure}`);
    process.exitCode = 1;
  } else {
    console.log(
      `SOURCE LOCK BYTES OK id=${lock.lockId} files=${report.checkedFiles.length} ` +
        `members=${report.checkedHarrisonMembers} maxGap=${report.maximumInterpolationGapSeconds}s ` +
        "passEligible=false",
    );
  }
}
