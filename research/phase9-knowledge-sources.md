# Phase 9 knowledge sources and theory baseline

## Result

The Phase 9 theory search is complete enough to design the proposed experiments. It found two
mechanism-bearing additions that were not represented cleanly in the earlier module shelf:

1. Lamb et al. (2025) supply a mass-conditioned **bulk transfer surrogate** that can be tested
   cheaply against the 16 native levitation histories before changing either crystal solver.
2. Harrington and Pokrifka (2026), extending Nelson and Baker (1996), make **step-source location
   and self-consistent facet flux** a distinct explanation for solid-versus-hollow growth. This is
   observationally competitive with width-conditioned SDAK and therefore must not be hidden inside
   a generic history or facet-kinetics arm.

The search also corrected an attractive misreading: Wang Angsheng's *The quantitative growth law
of ice crystals and its new model* is a 1987 paper, not a new publication. No authorized full text
was found, so its title and metadata do not carry an equation or Phase 9 prediction.

The resulting baseline contains 18 source records and 15 explicit hypothesis records. It covers
the named Phase 9 arms, both permanent controls, the two new candidate families, and their named
observational rivals. It is a model-development knowledge base, not a proof that the literature is
exhausted or that any mechanism is true.

## Search boundary and request ledger

The live search was deliberately small because Phase 8 had already completed broad measurement
discovery. On 2026-08-12, three OpenAlex result pages were requested sequentially, with no
pagination, parallel same-host traffic, automatic retry, or CiNii request:

| Query family | Exact query | Returned first-page records | OpenAlex result count | Charged cost | Saved response SHA-256 |
|---|---|---:|---:|---:|---|
| Surface/model | `"ice crystal" vapor growth model surface kinetics step source` | 25 | 2,040 | 0.001 | `e380061dd5082e4fd4a92a977abf8ff2e330041511b1df76c913f20151bb2f3d` |
| Transport | `"ice crystal" vapor growth diffusion thermal pressure ventilation model` | 25 | 260 | 0.001 | `9153e6292d7ac8288b3091c861d457763fcf7cc7a61aa9bf4d87cb7245834b89` |
| History/initiation | `"ice crystal" vapor growth initiation history transition hysteresis model` | 25 | 51 | 0.001 | `3751ee665666f7ed8febcbc538cdcfc80785c850ca561dffa5064ab6c8766c81` |

Raw responses are retained on the NAS under
`/Volumes/snowcrystal/research-cache/phase9-search/knowledge-baseline-20260812-v1/openalex/`.
The first two queries were useful for author/citation lineage routing. The third was low precision
and did not justify expansion. Exact DOI, arXiv, author-output, publisher, NASA NTRS, and companion-
archive lookups were then used only for named candidates.

The stopping rule was reached when every module had a primary equation source or was explicitly
graded source-limited, and another broad result page no longer had a named decision it could
change. The residual Phase 8 metadata backlog was not reopened.

## Source acquisition and visual inspection

New source bytes were retained on the NAS, not Git. Each PDF was converted to text, rendered to
page images, and its load-bearing equation or figure pages were visually checked:

| Source | NAS artifact | SHA-256 | Pages visually checked | Why retained |
|---|---|---|---|---|
| Lamb et al. 2025 | `content/lamb-et-al-2025-neural-ode-symbolic-regression.pdf` | `d1c9822c539365b9fc63203a85e0efab36d9c1508f6836724b8afe0b11e82364` | PDF 5, 7, 9, 19 | Learned bulk law, loss table, continuum equations and symbolic candidates |
| IceNODE code snapshot | `content/icenode-2025-code-63078e02.zip` | `98ff103b4ce5b95851c093f3f6e7717ea923ba420758f36fa1dcdf338b5044d8` | Formula and preprocessing source inspected | Hidden scaling, training lineage and reproducibility audit |
| Nelson and Baker 1996 | `content/nelson-baker-1996-theoretical-framework.pdf` | `dee100af051b8c6dacb3a8a0f0cc17f4dca26c29bc8f6c50963311dd3ce2fcbc` | PDF 1, 5, 9, 11 | Self-consistent facet flux and hollowing condition |
| Nelson and Knight 1998 | `content/nelson-knight-1998-layer-nucleation.pdf` | `8ad834c7263f5bcceaf63a27589b283e132b1c0c2a2ea5715b4cca8ff58b415b` | PDF 1, 7 | Measured critical supersaturation and layer-nucleation closure |
| Shi et al. 2025 v3 | `content/shi-et-al-2024-face-dependent-ice-growth-kinetics.pdf` | `732c8ee8f01dcd3c5770b9c09804f9a3c6e4128d0fbc303d86c2e032b2764f79` | PDF 1, 7 | Molecular face dependence and quasi-liquid-layer interpretation |
| Harrington, Sokolowsky and Morrison 2021 | `content/harrington-sokolowsky-morrison-2021-semianalytic-deposition.pdf` | `18bff2fe4bbf27323d61a092db7bf36efa1e19424ea63ab098f193ffb325a1d8` | PDF 1, 7, 13, 20 | Reduced self-consistent deposition and source-mechanism branches |

Previously archived Libbrecht, Kuroda, Gravner-Griffeath, Phase 8 measurement, and Harrington-
Pokrifka companion files were reused rather than downloaded again. The machine-readable
[source register](../evidence/phase9-knowledge-baseline-v1/source-register.jsonl) records all 18
identities, versions, hashes, page locators, evidence grades and limits.

### Phase 8A frozen-index errata carried forward

Two context statements discovered during this research cannot be corrected in place because their
Phase 8A source-index files are byte-frozen. For Phase 9, the companion archive's actual ranges are
0.01–20 in `hfunctiondata.dat` and 0.01–100 in both `Qfunctionsdata.dat` and
`hfunctions-jas-2026.f90`; the frozen index abbreviates them as 0.01–0.20 and 0.01–1.00. The correct
Harrington–Sokolowsky–Morrison 2021 DOI is `10.1175/JAS-D-20-0307.1`; the frozen Pokrifka context
note says `10.1175/JAS-D-20-0228.1`. None of those context anchors is referenced by a Phase 8 target
record, so the Phase 8 freeze remains unchanged and this Phase 9 overlay owns the corrections.

## Theory capsules

The full falsifiable records are in
[hypotheses.jsonl](../evidence/phase9-knowledge-baseline-v1/hypotheses.jsonl). The compact map below
states the essential scientific distinctions.

### 1. Broad-facet nucleation kinetics

The local baseline is

```text
v_n = alphaHK * vKin * sigmaSurface
alphaHK = A(T) * exp[-sigma0(T) / sigmaSurface]
```

Here `v_n` is normal facet velocity, `vKin` is the kinetic speed scale, `sigmaSurface` is local
surface supersaturation, and `A` and `sigma0` are facet- and temperature-dependent inputs. The
direct Sei-Gonda basal/prism series are the cleanest confrontation, but their x coordinates may not
be silently substituted for `sigmaSurface`; the source-specific diffusion mapping is part of the
test. These inputs mix direct measurements, fits and inversions, so agreement with the same lineage
is calibration, not independent confirmation.

### 2. Width-conditioned SDAK

Libbrecht's explicit width hypothesis is

```text
sigma0(w) / sigma0Infinity = 1 - exp(-w / w0)
```

It predicts a lower barrier on a narrower facet and therefore a positive sharpening feedback. The
shape of the law can be calculated, but Phase 9 does not yet have a frozen `w0` or a physical
facet-width mapping. Endpoint habit is not decisive: transport-driven edge gradients and the
step-source hypothesis can generate similar hollow or sharpened forms. Spatial or rim-width
trajectories are needed.

### 3. Step-source location and hollowing

Nelson and Baker require `alphaHK(x) * sigmaSurface(x)` to be compatible with uniform advance over
a flat face. If the center would need `alphaHK > 1` to keep up with the edge, the solid-face
solution is inadmissible and hollowing becomes possible. Harrington and Pokrifka's 2026 extension
centers the location of step sources as the missing state.

The companion archive makes rim width measurable, but it does not contain the article's final
equations, integrator, kinetic closure, or hollowing update. Two native histories nevertheless show
why this is useful:

- 2023: a dimension grows by `3.379x`, c dimension by `6.331x`, while rim width changes only
  `0.994x`; rim/a falls from `0.606` to `0.178`.
- 2024: no observation occurs exactly at the 13,800 s forcing event. Rim width rises from 6.37 µm
  at 13,504 s to 7.87 µm at 13,804 s and 13.81 µm at 14,104 s: `+23.5%` and `+116.8%` relative to
  the last pre-event row.

Those values are observations and project arithmetic, not evidence that step-source location
caused the change. They come from the same investigator/source lineage that developed the 2026
mechanism, so they support source replay and rival-fit comparison, not independent causal
confirmation. A promoted causal test needs an independently triggered hollowing transition. The
`48` to `20` forcing semantics remain unresolved.

### 4. Lamb mass-conditioned bulk transfer

The exact scaling transcribed from the commented public code is

```text
G = 1e-9 * [
  (1e9 * Gc)^1.3153063 /
  (1 / 1.1682062 + 2.6606467 / (1e12 * m))
  + 0.1123054
]
```

`m` is in kg and `G` and `Gc` are in kg m^-1 s^-1. The paper omits the units implied by its fitted
coefficients; the scaled form is therefore safer than copying the rounded printed equation.

This is an empirical early-growth surrogate, not a facet or morphology theory:

- it was selected after a neural model was trained on 290 levitated histories, using their first
  500 seconds;
- the later 500-1,000 second assessment uses the same particles, not independent specimens;
- AIDA experiments were independent of neural training but used to select the final symbolic
  expression, so they are not held out from formula selection;
- the public snapshot lacks data, loaders, checkpoints, selected symbolic artifacts, dependency
  lock and runnable paths; and
- it has no basal/prism, support, ventilation, initiation or habit state.

The weak neural model's reported summed losses improve over continuum and Nelson-Baker in aggregate,
but it is the best of the compared models for only 138/290 histories at 500 s and 142/290 at 1,000
s. The selected symbolic equation is not separately scored in that table.

The learned law has two important extrapolation warnings. As mass tends to zero, `G` tends to
`1.123054e-10` rather than zero. As mass becomes large, it does not return to `Gc`, contrary to the
stated physical expectation. It must remain a bounded comparator, never a local surface rule.

The proposed primary comparison is therefore narrower than all 16 complete traces: only 0-500 s
from the six Phase 8 histories inside the paper's 205-240 K training-temperature range. Each fold
fits one global constant `Gc` rescale on the other five primary histories and evaluates it on the
held-out history. Hotter conditions and later times are reported separately as extrapolation. This
does not make the six rows held out from Phase 9; it only makes the comparator fair and in-domain.

### 5. Coupled vapor and heat transport

Vapor diffusion, latent-heat removal, surface kinetics, specimen geometry and ventilation all
contribute resistance between far-field forcing and surface growth. This is established physics;
the uncertainties are in the experimental mapping and reduced geometry. The Gonda-Komabayasi
families separately vary reported thermal conductivity and vapor diffusivity, making them the best
one-factor checks. They do not form a crossed matrix, so they cannot identify a heat-vapor
interaction term.

The monograph supplies approximate latent-heating anchors `chi0 = 0.8` at -1 C and `0.4` at -10 C.
Under the printed `1/(1+chi0)` correction these correspond to multipliers `0.556` and `0.714`.
They are direction and rough-scale checks, not a frozen interpolation curve. A quantitative -7 C
or -15 C target requires evaluating the printed vapor-plus-thermal resistance equation with the
source geometry and conductivity; interpolating these two anchors is not authorized.

### 6. Pressure-conditioned kinetics

Libbrecht's 2016 -5 C work reports a prism attachment change beyond the `D(P)` transport effect and
supersedes the earlier pressure-invariant interpretation. The Phase 8 trajectories are all at one
pressure. They can replay or calibrate the source-derived one-bar rule, but they cannot identify
pressure dependence. Promoting M-PK as a pressure discriminator requires a frozen cross-pressure
trajectory that was not used to choose the rule.

### 7. Forcing history and initiation state

History is not a free parameter name. Two questions are now separated. First, does a memoryless
model reproduce the trajectory when it receives the exact forcing path? Comparing that run with an
endpoint-only approximation tests forcing-path fidelity, not memory. Second, after exact forcing,
geometry and transport are represented, do matched-endpoint or post-event relaxation rows require
a named state with an observable and a stable relaxation time? If the data cannot establish a
matched resolved state, memory is non-identifiable rather than fitted.

The Bacon initiation contrast is even more constrained: droplet- and seed-initiated groups also
differ in initial size and mass exposure. Phase 9 must reproduce those differences before adding a
named initiation mechanism. The reported aggregate ranges do not authorize invented per-particle
rows or population denominators.

### 8. Ventilation

Keller and Hallett's controlled-velocity paper reports that a 5 cm/s intervention can change
skeletal transitions near -4 and -15 C close to water saturation. NASA NTRS provides metadata and
an abstract but no downloadable full text. Without its numerical series and protocol, ventilation
is a qualitative compatibility gate: either acquire the full paper or derive a documented low-
Reynolds-number bound before scoring free-fall observations as still-air growth.

### 9. Curvature, molecular mechanism and phenomenological control

Gibbs-Thomson curvature is established interfacial physics but has no matched Phase 8 experiment;
it remains a manufactured-solution and grid-convergence diagnostic. Shi et al.'s molecular dynamics
supports face-dependent molecular behavior and quasi-liquid-layer interpretations, but lacks a
validated scale bridge to a macroscopic `alphaHK(T, face)` law; it is a qualitative consistency
screen only. Gravner-Griffeath remains the
permanent phenomenological control: its ability to generate attractive shapes is useful, but its
thresholds and ticks have no physical attachment or time interpretation.

## Reproducible project calculations

[phase9-knowledge-calculations.mjs](../scripts/phase9-knowledge-calculations.mjs) writes
[calculations.json](../evidence/phase9-knowledge-baseline-v1/calculations.json). It calculates:

- the Lamb law at all 16 Phase 8 initial conditions;
- exact scaled-versus-expanded and rounded-paper replay errors;
- its mass crossover and large-/small-mass behavior;
- project kinetic length and spherical curvature scales;
- idealized M1-versus-broad-facet sensitivity at -7, -15 and -30 C;
- the normalized width-law shape;
- latent-heating anchors; and
- rim-history endpoint and change-point diagnostics.

Key results are:

- Lamb crossover mass: `3.10818397095e-12 kg`, equivalent spherical radius `9.34240961638 µm`
  at 910 kg/m3.
- Phase 8 initial Lamb `G/Gc`: `0.377597782649` to `1.3118858647`.
- Same-condition 731A/731B initial ratios: about `1.312` versus `0.469`, driven only by initial
  radius in this law.
- Exact scaled-versus-expanded maximum relative error: `4.09205942347e-16`; rounded printed
  coefficients differ by at most `1.27955921775e-4` over the 16 conditions.
- The public code hard-codes 97,190 Pa; applying measured per-record pressures changes predicted
  transfer by at most about `1.00%`. The output records both conventions instead of calling the
  measured-pressure rows exact condition replay.
- Primary learned-law scoring domain: the six 725C/725E/805A/805B/805H/805L histories, 0-500 s;
  the other ten temperature conditions and all later time points are extrapolation.

These calculations rank tests; they do not score a model against the observations or authorize a
Phase 9 run.

## Source gaps that still matter

Two targeted full-text acquisitions and two lineage checks could materially change the proposed
experiment contract:

1. **Harrington-Pokrifka 2026 full article.** Required before implementing or numerically scoring
   its exact step-source/hollowing model. The companion archive is insufficient.
2. **Keller-Hallett 1982 full article.** Required only if Phase 9 chooses a quantitative ventilation
   arm rather than restricting free-fall evidence through a conservative compatibility bound.
3. **Current Libbrecht monograph comparison.** The captured arXiv book explicitly says a newer
   Princeton edition exists. Any monograph-only width-law input remains provisional until the newer
   edition is compared; later primary papers already cover the broad-facet baseline.
4. **Lamb training experiment-ID join.** Required before calling the Phase 8 Harrison histories
   non-training transfer evidence.

The Wang 1987 article and complete IceNODE training bundle are useful acquisition targets but not
blockers for experiment design. M-PK additionally needs a genuinely cross-pressure trajectory
before it can identify pressure dependence; the current one-bar rows remain useful source replay.

## Why the search stops here

Another broad search is unlikely to improve Phase 9 design enough to justify more traffic or paper
processing. The main uncertainty is now experimental identifiability, not missing mechanism names:
several theories can fit endpoint habit, while the baseline contains only a few spatial, forcing-
change and direct-facet measurements that can separate them. Work should move to adapters,
pre-registered rejection criteria and cheap scalar replays. New external search should reopen only
for one of the two named source gaps, an experiment-ID overlap join, or a new discrepancy exposed by
an actual Phase 9 calculation.

## Adversarial audit and evidence limits

A separate OpenAI Codex subagent (model identifier not exposed by the collaboration interface)
performed the interpretation audit with the author's full turn context but without editing the
files. It independently parsed the JSON/JSONL, resolved every hypothesis source and Phase 8 target
identifier, checked tracked relative links, verified NAS/OpenAlex hashes, recalculated the Lamb
formula scaling/crossover/limits and checked the headline counts and query totals.

The first pass found one wrong DOI and seven design seams: one-bar pressure non-identifiability,
forcing-path versus memory conflation, ventilation eligibility occurring after free-fall scoring,
an unfrozen Lamb comparison domain and constant-rescale rule, same-lineage step-source circularity,
non-executable latent-heat anchors at the target temperatures, and a molecular-to-macroscopic
observable mismatch. Those were repaired. A focused post-repair recheck found no unresolved
baseline-publication blocker.

The audit did **not** acquire inaccessible full texts, reproduce the incomplete IceNODE training
pipeline, execute or score any Phase 9 model, establish an independent-validation split, compare
the newer Princeton monograph edition, or create cross-pressure, matched-memory, ventilation, or
independent hollowing evidence. Those remain explicit future prerequisites rather than implied
green results.
