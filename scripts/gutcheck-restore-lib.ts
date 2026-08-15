// Destination-side placement guard for scripts/gutcheck-archive-restore.ts.
//
// The restore script vets archive ENTRY names (no "..", no absolute paths, no backslashes,
// regular files only) — but a crafted DESTINATION defeated all of that: with `dest/figs`
// symlinked elsewhere, placing "figs/fig10.err" wrote outside --dest and exited 0
// (adversarial review, 2026-08-12). Names tell you nothing about where the filesystem will
// actually put the bytes; only the destination chain does.

import { lstatSync, mkdirSync, realpathSync } from "node:fs";
import { dirname, join, resolve, sep } from "node:path";

/**
 * Validate that placing `entry` under `destRoot` cannot write outside it, create the parent
 * directories, and return the path to place at. Throws on: any existing path component below
 * the root that is a symlink, a non-directory where a directory is needed, or a parent that
 * realpath-resolves outside the root after creation. Call it immediately before the
 * rename/copy to minimize the chain's check-to-use window.
 *
 * Trust boundary, stated explicitly (round-2 review): between this check and the caller's
 * rename there remains a check-to-use window that only an O_NOFOLLOW/openat-anchored write
 * could fully close, which Node's fs API does not expose portably. The enforced boundary is
 * a single-user working tree — these guards defend against crafted INPUTS (archives,
 * destinations, prepared symlinks), not against a concurrent hostile process mutating the
 * filesystem mid-operation. A hostile local co-tenant is outside this project's threat
 * model everywhere, not just here.
 */
export const prepareSafePlacement = (destRoot: string, entry: string): string => {
  const root = resolve(destRoot);
  const parts = entry.split("/").filter((p) => p.length > 0);
  if (parts.length === 0) throw new Error("empty entry path");
  let current = root;
  for (let i = 0; i < parts.length; i++) {
    current = join(current, parts[i]!);
    let stat;
    try {
      stat = lstatSync(current);
    } catch {
      break; // the rest of the chain does not exist yet; mkdirSync below creates real dirs
    }
    if (stat.isSymbolicLink()) {
      throw new Error(`destination component is a symlink: ${current}`);
    }
    if (i < parts.length - 1 && !stat.isDirectory()) {
      throw new Error(`destination component is not a directory: ${current}`);
    }
  }
  const target = join(root, ...parts);
  mkdirSync(dirname(target), { recursive: true });
  // Belt and braces after creation: the parent must physically live inside the root. The
  // root is realpathed too so a legitimately symlinked --dest (or a /var-style fixture)
  // compares against itself rather than 100%-failing.
  const realRoot = realpathSync.native(root);
  const realParent = realpathSync.native(dirname(target));
  if (realParent !== realRoot && !realParent.startsWith(realRoot + sep)) {
    throw new Error(`destination parent escapes the restore root: ${realParent}`);
  }
  return target;
};
