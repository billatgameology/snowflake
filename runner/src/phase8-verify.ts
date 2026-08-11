import { fileURLToPath, pathToFileURL } from "node:url";
import { resolve } from "node:path";
import { verifyPhase8FreezeFile } from "./phase8-freeze.ts";

export function phase8Verify(repositoryRoot: string): string {
  const { book } = verifyPhase8FreezeFile(repositoryRoot);
  return [
    "PHASE8 TARGET BOOK OK",
    `entries=${book.status.entryCount}`,
    `targets=${book.status.targetCount}`,
    `inputs=${book.status.inputCount}`,
    `bytes=${book.byteLength}`,
    `sha256=${book.sha256}`,
  ].join(" ");
}

const invokedPath = process.argv[1];
if (invokedPath !== undefined && import.meta.url === pathToFileURL(resolve(invokedPath)).href) {
  const repositoryRoot = fileURLToPath(new URL("../..", import.meta.url));
  try {
    process.stdout.write(`${phase8Verify(repositoryRoot)}\n`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`PHASE8 TARGET BOOK FAIL ${message}\n`);
    process.exitCode = 1;
  }
}
