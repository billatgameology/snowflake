import { createHash } from "node:crypto";

/**
 * Digest an archive's exact member identity. JSON encoding a sorted array is unambiguous for
 * every legal filename (including whitespace) and keeps the contract independent of zip order.
 */
export const archiveMemberListSha256 = (members: readonly string[]): string =>
  createHash("sha256").update(JSON.stringify([...members].sort())).digest("hex");

/** The inventory group an archive member belongs to. Root-level workspace files are extras. */
export const archiveGroupForEntry = (entry: string): string => {
  if (!entry.startsWith("large/")) return "extras";
  const group = entry.split("/")[1];
  if (group === undefined || group === "") {
    throw new Error(`archive entry has no large/ group: ${entry}`);
  }
  return group;
};

/** Comparison key for names that must not alias on a case-insensitive host. */
export const archiveEntryPortableKey = (entry: string): string =>
  entry.normalize("NFC").toLowerCase();

/** Member syntax that is safe and representable on both supported macOS and Windows hosts. */
export const archiveEntryPathIsSafe = (entry: string): boolean => {
  const withoutTrailingSlash = entry.endsWith("/") ? entry.slice(0, -1) : entry;
  if (
    withoutTrailingSlash === "" ||
    withoutTrailingSlash !== withoutTrailingSlash.normalize("NFC") ||
    withoutTrailingSlash.startsWith("/") ||
    withoutTrailingSlash.includes("\\") ||
    withoutTrailingSlash.includes(":") ||
    /[\u0000-\u001f\u007f]/.test(withoutTrailingSlash)
  ) {
    return false;
  }
  return withoutTrailingSlash.split("/").every(
    (part) =>
      part !== "" &&
      part !== "." &&
      part !== ".." &&
      !/[<>"|?*]/.test(part) &&
      !/[. ]$/.test(part) &&
      !/^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(part),
  );
};
