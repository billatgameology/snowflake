import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

/** Native path spelling only; callers still enforce their own file identity and containment. */
export function sameNativePath(left: string, right: string): boolean {
  const resolvedLeft = resolve(left);
  const resolvedRight = resolve(right);
  return process.platform === "win32"
    ? resolvedLeft.toLowerCase() === resolvedRight.toLowerCase()
    : resolvedLeft === resolvedRight;
}

/** Imports stay inert even when a node --eval/--print positional argument names this module. */
export function isCliEntry(moduleUrl: string): boolean {
  const entry = process.argv[1];
  if (entry === undefined || process.execArgv.some((argument) =>
    argument === "-e" || argument === "--eval" || argument.startsWith("--eval=") ||
    argument === "-p" || argument === "--print" || argument.startsWith("--print="))) return false;
  return sameNativePath(entry, fileURLToPath(moduleUrl));
}
