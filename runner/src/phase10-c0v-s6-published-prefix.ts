import type { Phase10C0VS6RawRuntimeAuthorityInput } from "./phase10-c0v-s6-runtime-authority.ts";
import {
  independentlyReopenPhase10C0VS6VerifiedPublishedDependencies as independentlyReopenVerifiedPublishedDependencies,
  independentlyVerifyPhase10C0VS6ObservedPublishedDependencyPrefix as independentlyVerifyObservedPublishedDependencyPrefix,
  type Phase10C0VS6ObservedPreflightDependencyInput,
  type Phase10C0VS6VerifiedCoreDependencySet,
} from "./phase10-c0v-s6-published-packet.ts";

export type Phase10C0VS6VerifiedPublishedPrefix = Phase10C0VS6VerifiedCoreDependencySet;

/**
 * Thin cycle-breaking entry point for the exact historical prefix before current-preflight
 * publication. The lower raw verifier owns moving-publication semantic reproof so callers cannot
 * provide a passing semantic token beside the bytes it is meant to validate.
 */
export function independentlyVerifyPhase10C0VS6ObservedPublishedDependencyPrefix(
  input: Phase10C0VS6ObservedPreflightDependencyInput,
): Phase10C0VS6VerifiedPublishedPrefix {
  return independentlyVerifyObservedPublishedDependencyPrefix(input);
}

/** Live-current-preflight equivalent of the same fully raw-derived prefix verifier. */
export function independentlyReopenPhase10C0VS6VerifiedPublishedDependencies(
  input: Phase10C0VS6RawRuntimeAuthorityInput,
): Phase10C0VS6VerifiedPublishedPrefix {
  return independentlyReopenVerifiedPublishedDependencies(input);
}
