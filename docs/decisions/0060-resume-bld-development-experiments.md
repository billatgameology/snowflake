# 0060 — Resume BLD development experiments without a wall-time cutoff

- **Date:** 2026-10-07
- **Status:** accepted — maker explicitly requested stopping the live run, removing its four-hour limit and implementing genuine resumability.
- **Charter impact:** §2.5 extended in this session; ordinary checkpoint and phase boundaries retained.

## Context

The interrupted first BLD batch has observation logs but no restart state. A four-hour cap can leave an interesting comparison unfinished. The maker requests continuation across interruptions, not a rerun represented as resume. Existing ordinary resume APIs intentionally exclude experimental modes and the no-dip control. Proposed ADR 0039 is not accepted by this decision and its Phase 6 runner/publication protocol stays deferred.

The complete affected charter clauses before this amendment are:

> Post-Phase-10 development experiment (decision 0055, 2026-09-09): under the maker's autonomous bounded-science direction, a separately identified constant-environment CPU experiment may select both, neither, basal-only or prism-only M1 dip preparations. It retains the coupled aggregate-v6 Robin/fill operator and ordinary behavior, and cannot use existing checkpoint formats to imply ordinary kinetics. The active discovery plan registers its finite comparisons and controls. These interventions identify effects within the implemented discrete model, not width-dependent SDAK, physical necessity, grid convergence or quantitative validation. They do not reopen Phase 10 or involve the separate Phase 7 path.

> Local basal-width experiment (decision 0058, 2026-09-11): a separately identified constant-environment aggregate-v6 CPU experiment may select the existing M1 or no-dip basal kinetics using an integer exposed-terrace chord threshold, while retaining no-dip prism kinetics and geometric completion. This is an explicitly P4 mesoscopic width rule, not a measured molecular law, full M2 implementation or physical validation. The attachment spec defines its symmetric geometry and coupled Robin/fill evaluation; the active discovery plan registers the finite comparisons, observables and reused controls before implementation. Ordinary operators, historical evidence, checkpoint meanings and the separate Phase 7 path remain unchanged.

> Early/late basal-width counterfactual (decision 0059, 2026-09-12): a separately identified constant-environment CPU experiment may enable that width rule before or after a registered physical-time cutoff, using broad basal kinetics outside its window. Switch only between complete coupled updates, re-relax before fill, and preserve accumulated state. The active plan registers matched controls, actual transition-time observations and longer growth comparisons. This tests early-growth history versus continuing feedback within the discrete model; it adds no physical-validation claim, arbitrary environment timeline or ordinary checkpoint meaning.

## Decision

Experimental continuation (decision 0060, 2026-10-07): the separately identified constant-environment CPU development path may save and restore complete aggregate-v6 monopole interface-cycle state for the four facet preparations, ordinary no-dip control and full/early basal-width modes in the BLD first batch. A distinct experimental resume format binds the effective preparation and cutoff to the full numerical state; ordinary checkpoint meanings and exclusions remain unchanged. The active plan registers interruption recovery, output continuity and executed uninterrupted-versus-resumed checks before an uncapped wall-time campaign. This authorizes no environment-timeline resume, Phase 6 production protocol, Phase 7 work or physical-validation claim.

Use a new version-1 experimental envelope, distinct from ordinary checkpoint families. Its strict descriptor permits only the BLD modes above; full width and early-only cutoff are supported, late-only and hole-fill interventions are outside this bounded delivery. Reuse the existing strict streamed v3 common-state codec internally without changing its bytes or ordinary solver export/restore guards. Restore consumes a decoded state once, with its descriptor; callers cannot substitute a preparation independently.

Retain exact controls, occupancy, fill, vapor, boundary and last-attachment order, physical time, monopole lag, last fill velocity, numerical ledgers and accepted relaxation report. Reconstruct only derived geometry/cache state. Export only at completed interface-cycle boundaries (including the initial boundary); refuse environment timelines, prior test hooks and incompatible state. Width activity is reevaluated from restored physical time for the next coupled solve/update.

Runner checkpoints also bind the row, runtime/source, accumulated measurements, pending spatial observations and committed event prefix. Write durable checkpoint bytes and metadata before atomically advancing the current pointer. Keep two rolling checkpoint slots; superseded slot bytes and unfinished checkpoint temporaries are declared recoverable scratch, while events and scientific observations remain retained. Preserve an uncommitted observation tail separately before restoring the canonical prefix. Interrupted relaxation is recomputed from the preceding complete boundary and never becomes a completed event.

Checkpoint every completed update; no four-hour experiment or parent wall-time kill applies to this BLD path. Operator pause stops queue dispatch and lets running workers checkpoint at the next boundary. Abrupt termination resumes the last published checkpoint. Memory limits remain active. The existing 20,000-update budget becomes a review pause with retained state, extendable by another resume invocation; it cannot imply completion or an absent effect. Size target, domain contact, stalled growth and scientific failures keep their explicit classifications. HIL's existing bounded path is unchanged.

## Consequences

Interruption loses at most the unfinished coupled update plus an unpublished write. Checkpoint I/O adds cost and requires disk space; no automatic OS-start task or cross-runtime bitwise claim is added. The old stopped run cannot be retroactively resumed. Begin in a fresh campaign directory and prove a real process pause/resume before launch. Full exact npm test covers the scientific/state change; direct/resumed comparisons and ordinary-format refusal tests protect the named boundary. These are recovery checks, not a scientific validation gate.

## Alternatives considered

- Seed reruns lose purchased progress and do not satisfy resume.
- Removing the wall cap without checkpoints repeats the known multi-day loss failure.
- Relabeling experimental bytes as ordinary v3 can restore the wrong kinetics.
- Timeline or mid-relaxation resume unnecessarily widens this BLD delivery.
