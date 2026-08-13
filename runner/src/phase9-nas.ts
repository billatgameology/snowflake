import { lstatSync, realpathSync, statSync } from "node:fs";
import { isAbsolute, relative, resolve, sep } from "node:path";

const WINDOWS_NAS_ROOT = "S:/";
const MAC_NAS_ROOT = "/Volumes/snowcrystal";

function isContained(root: string, candidate: string): boolean {
  const offset = relative(root, candidate);
  return offset === "" || (!offset.startsWith("..") && !isAbsolute(offset));
}

export function defaultPhase9NasRoot(platform: NodeJS.Platform = process.platform): string {
  if (platform === "win32") return WINDOWS_NAS_ROOT;
  if (platform === "darwin") return MAC_NAS_ROOT;
  throw new Error(`no default Phase 9 NAS root for platform ${platform}; set VCC_NAS_ROOT`);
}

export function configuredPhase9NasRoot(
  environment: NodeJS.ProcessEnv = process.env,
  platform: NodeJS.Platform = process.platform,
): string {
  const configured = environment.VCC_NAS_ROOT;
  if (configured !== undefined) {
    if (configured.trim() === "" || !isAbsolute(configured)) {
      throw new Error("VCC_NAS_ROOT must be a non-empty absolute path");
    }
    return resolve(configured);
  }
  return resolve(defaultPhase9NasRoot(platform));
}

export function phase9NasArtifactPath(root: string, logicalPath: string): string {
  if (logicalPath.trim() === "" || isAbsolute(logicalPath)) {
    throw new Error("NAS logical path must be non-empty and relative");
  }
  const resolvedRoot = resolve(root);
  const candidate = resolve(resolvedRoot, logicalPath);
  if (!isContained(resolvedRoot, candidate)) {
    throw new Error(`NAS logical path escapes its root: ${logicalPath}`);
  }
  return candidate;
}

export function verifiedPhase9NasArtifactPath(root: string, logicalPath: string): string {
  const resolvedRoot = realpathSync(resolve(root));
  const candidate = phase9NasArtifactPath(resolvedRoot, logicalPath);
  const linkStats = lstatSync(candidate);
  if (linkStats.isSymbolicLink()) {
    throw new Error(`NAS artifact must not be a symbolic link: ${logicalPath}`);
  }
  const physical = realpathSync(candidate);
  if (!isContained(resolvedRoot, physical)) {
    throw new Error(`NAS artifact resolves outside its root: ${logicalPath}`);
  }
  const stats = statSync(physical);
  if (!stats.isFile() || !Number.isSafeInteger(stats.size) || stats.size < 0) {
    throw new Error(`NAS artifact is not a regular finite-size file: ${logicalPath}`);
  }
  return physical;
}

export function phase9NasRelativePath(root: string, physicalPath: string): string {
  const resolvedRoot = realpathSync(resolve(root));
  const physical = realpathSync(resolve(physicalPath));
  if (!isContained(resolvedRoot, physical)) {
    throw new Error("physical artifact is outside the Phase 9 NAS root");
  }
  return relative(resolvedRoot, physical).split(sep).join("/");
}
