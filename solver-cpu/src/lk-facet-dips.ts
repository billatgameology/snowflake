// ADR 0055: finite constant-environment interventions, not width-dependent SDAK.
import { prepareAlphaHK, type PreparedAlphaHK } from "@vcc/core";

export type LKFacetDipArm = "both" | "neither" | "basal-only" | "prism-only";

export function isLKFacetDipArm(value: unknown): value is LKFacetDipArm {
  return value === "both" || value === "neither" ||
    value === "basal-only" || value === "prism-only";
}

export function prepareFacetDipExperiment(tempC: number, arm: LKFacetDipArm): PreparedAlphaHK {
  if (!isLKFacetDipArm(arm)) throw new Error(`unknown experimentalFacetDips: ${String(arm)}`);
  if (arm === "both") return prepareAlphaHK(tempC, "M1");
  if (arm === "neither") return prepareAlphaHK(tempC, "M1_NO_DIP_ABLATION");
  const dipped = prepareAlphaHK(tempC, "M1");
  const undipped = prepareAlphaHK(tempC, "M1_NO_DIP_ABLATION");
  const basal = arm === "basal-only" ? dipped : undipped;
  const prism = arm === "prism-only" ? dipped : undipped;
  return Object.freeze({
    basalPrefactor: basal.basalPrefactor,
    basalSigma0: basal.basalSigma0,
    prismPrefactor: prism.prismPrefactor,
    prismSigma0: prism.prismSigma0,
  });
}
