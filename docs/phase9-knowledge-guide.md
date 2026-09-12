# Phase 9 knowledge baseline — plain-English guide

## The short version

Phase 8 collected the **measurements**. This Phase 9 preparation collects the **explanations we can
test against those measurements**.

The result is not one accepted theory. It is a map of 15 testable hypotheses: what each idea says,
which Phase 8 records can challenge it, what other idea could produce the same observation, and
what result would count against it.

The research is sufficient to design Phase 9. I would not do another broad paper search now. Two
specific papers remain worth acquiring if their corresponding experiments are adopted: the full
2026 Harrington-Pokrifka step-source article and the full 1982 Keller-Hallett ventilation article.
Any input found only in the captured Libbrecht monograph also remains provisional until its newer
Princeton edition is compared.

## Data versus knowledge

| Foundation | What it contains | What it lets us do |
|---|---|---|
| Phase 8 data | 51 development records, 252,134 native rows and 431 graph points | Ask whether a prediction matches an observation |
| Phase 9 knowledge | 18 source records, 15 hypotheses and replayable calculations | Decide what to predict, what assumptions are being made, and which observation can separate competing explanations |

Neither foundation is held-out validation. The same evidence helped us choose the Phase 9 tests,
so it is honest model-development material. A later independent validation claim needs genuinely
unseen data frozen before its values influence the model.

## The main ideas we now need to distinguish

### 1. Ordinary broad-facet surface kinetics

A crystal face grows when water molecules attach. The baseline physical law says the rate depends
on local vapor supersaturation and a face-specific attachment coefficient. Basal and prism faces
can therefore grow at different rates, producing plates or columns.

The direct Sei-Gonda measurements are the cleanest test because they measure basal and prism growth
rates separately at -7, -15 and -30 C. If the model cannot reproduce those local rates, a plausible
whole-crystal picture does not rescue it.

### 2. Narrow-face enhancement, or SDAK

One Libbrecht hypothesis says a narrow facet has a lower nucleation barrier than a broad facet. A
narrow edge then grows faster, becomes sharper and reinforces the effect. This is a possible
explanation for thin plates, hollow columns and abrupt habit changes.

It is not the only explanation. A nonuniform diffusion field and the location where molecular
steps begin can also make edges and centers grow differently. Endpoint appearance alone cannot
choose between them.

### 3. Step-source location

Nelson-Baker theory and the new 2026 Harrington-Pokrifka paper say that a facet must receive both
vapor and a supply of molecular steps. Whether those steps start near the center or edge can decide
whether the face advances as a solid surface or becomes hollow.

This deserves its own Phase 9 hypothesis. It predicts a spatial growth profile and rim-width
history, while SDAK predicts a material-law change with facet width. The two native -50 C histories
record rim width over time, including one forcing change, so they can help separate these ideas.

The full 2026 article is still needed before its exact equations can be implemented. The saved
companion archive contains useful shape functions and measurements but not the complete model.
Those measurements are from the same source lineage that developed the mechanism, so they can test
source replay and compare rivals but cannot independently confirm step-source causality.

### 4. The new learned bulk-growth law

One likely OpenAlex paper is Lamb et al. 2025, *Discovering How Ice Crystals Grow Using Neural
ODE's and Symbolic Regression*. It learned an effective bulk transfer coefficient from 290
levitated ice particles and reduced that neural result to a formula involving crystal mass and the
ordinary continuum transfer coefficient. If the paper you saw was the 2026 Harrington-Pokrifka
article instead, that is the step-source/hollowing model described in the preceding section; both
are now represented explicitly.

This is interesting, but it is not a new facet or morphology mechanism. It predicts mass growth
only. It has no basal/prism distinction, no shape, no support, no ventilation and no initiation
state. Its public code snapshot is also incomplete and cannot reproduce the paper end to end.

It is still valuable because the cheapest first Phase 9 calculation is to test that formula against
our native mass histories. The primary comparison is limited to 0-500 s on the six histories inside
the paper's 205-240 K training-temperature range. Hotter conditions and later times are reported as
extrapolation. That can happen as a small spherical growth calculation without changing the 3-D
solver.

Important warnings:

- The formula approaches a nonzero transfer at zero mass, so it is not a nucleation-scale law.
- At very large mass it does not return to the ordinary continuum value, despite the stated
  physical expectation.
- Later-time evaluation used the same particles as training; the AIDA data helped choose the
  final equation. Those are not clean held-out tests.
- Before calling our 16 histories external to training, their experiment IDs must be joined against
  the three datasets cited by the paper.
- The constant-rescale rival must be fair: in each primary-history fold, fit one global multiplier
  on the other five histories and evaluate it only on the held-out history.

### 5. Vapor transport, heat and pressure

The far-field vapor percentage is not the same as the supersaturation right at a growing surface.
Vapor diffusion, latent heat, gas pressure, specimen geometry and air motion all stand between
them.

Phase 8 contains unusually useful one-factor experiments that changed reported thermal conductivity
or vapor diffusivity while holding the other approximately fixed. Those should be tested before
inventing a more complicated surface mechanism. Because these crystals were in free fall,
ventilation eligibility must be decided before quantitative scoring. A 2016 pressure study also
says the prism surface kinetics at -5 C change with background gas beyond the expected diffusion
change, but the selected Phase 8 trajectories are all at one bar. They can replay the source rule;
they cannot identify pressure dependence without a cross-pressure trajectory.

The two printed latent-heating anchors are useful for direction and rough scale only. They do not
define an interpolation to the Phase 8 temperatures. A quantitative -7 C or -15 C comparison must
first evaluate the full printed vapor-plus-thermal resistance expression with the source geometry
and conductivity.

### 6. History and initiation

The route to a condition may matter, not just its endpoint. Phase 8 has full forcing and size
histories that can test this. But “history” is not permission to add an invisible free parameter.
The first comparison is the exact forcing path with no hidden state; improvement over an endpoint-
only approximation demonstrates path fidelity, not memory. A real memory test must compare an
exact-path Markov model with a named stateful model on matched-endpoint or post-event relaxation
rows. If there is no matched resolved state, memory remains non-identifiable.

The seed-versus-frozen-droplet evidence is even more cautious. The groups also differed in initial
size and how much mass they gained. Phase 9 must reproduce those known differences before adding a
special initiation-state mechanism.

### 7. Ventilation and curvature

Air motion can change transport and even habit, so free-fall crystals cannot automatically be
treated as still-air crystals. The available ventilation source is abstract-level only. Phase 9
must either acquire the full paper or show that ventilation is negligible for a named subset.

The Gibbs-Thomson curvature effect is real physics, but Phase 8 found no direct matched experiment.
It should first be tested as a numerical curvature and grid-convergence correction, not advertised
as measurement-validated.

## What the calculations already tell us

The calculations are reproducible with
[phase9-knowledge-calculations.mjs](../scripts/phase9-knowledge-calculations.mjs), and their complete
output is in [calculations.json](../evidence/phase9-knowledge-baseline-v1/calculations.json).

### The learned-law crossover sits inside our data

The Lamb formula changes most strongly around a mass of
`3.10818397095e-12 kg`, equivalent to a spherical radius of about `9.3424 µm`. Our 16 initial radii
span 5.8 to 12 µm, almost perfectly straddling that crossover.

At those initial conditions, the learned formula predicts effective transfer from about `0.378` to
`1.312` times the continuum value. Runs 731A and 731B report the same temperature, pressure and
supersaturation but start at 12.0 and 6.3 µm; the learned law therefore predicts ratios of about
`1.312` and `0.469`. That is a sharp, inexpensive and falsifiable size-ordering test.

The implementation checks the exact scaled formula against its algebraic expansion. Maximum
relative disagreement is `4.09e-16`; using the rounded printed coefficients changes results by at
most `1.28e-4` over our conditions. The paper's public code hard-codes 97,190 Pa, while the project
calculation uses each measured pressure; that choice changes transfer by at most about 1.00% and is
recorded explicitly.

### Several visually similar mechanisms remain non-identifiable

Width-dependent SDAK, step-source location, ordinary diffusion gradients and substrate asymmetry
can all contribute to hollow or sharpened forms. A final aspect ratio cannot separate them. The
useful observations are the spatial growth profile, rim width, forcing-event response and direct
facet rate.

### The Phase 8 particle scale is not the strongest curvature regime

For the 5.8-12 µm equivalent initial spheres, the simple spherical curvature correction is small.
It can become important at submicron tips, so it remains worth implementing only after it passes
analytic and grid-convergence tests. The current data do not make it a high-priority physical arm.

## Recommended Phase 9 order

This is the leanest sequence that extracts information before adding 3-D machinery:

1. **Cheap scalar discriminator.** Join the Lamb training-data IDs, then forward-integrate the 16
   mass histories with continuum, Nelson-Baker, Lamb and a simple constant-rescale baseline. Use
   the six in-temperature-domain histories at 0-500 s as the primary leave-one-history-out score;
   label the remainder extrapolation. Preserve measurement decreases and uncertainty.
2. **Direct facet calibration.** Test broad-facet basal and prism rates at all three Sei-Gonda
   temperatures. Stop morphology interpretation if the local surface rule fails.
3. **Ventilation eligibility, then controlled transport.** Acquire the quantitative velocity
   protocol or freeze a conservative eligibility bound before scoring the free-fall heat and vapor
   interventions.
4. **One-bar source replay and exact forcing paths.** Replay the pressure-conditioned source rule
   without claiming pressure identification. Compare endpoint-only and exact-path runs only for
   path fidelity; add a memory state only with matched-endpoint or relaxation evidence.
5. **Hollowing rivals.** After obtaining the full 2026 equations, compare step-source and
   width-conditioned SDAK predictions using rim/spatial trajectories. Do not select by final shape.
6. **Narrower gates.** Decide whether quantitative ventilation is needed, test initiation only
   after matching size/exposure, and keep curvature as a numerical diagnostic unless new data are
   acquired.
7. **Combinations last.** Combine only mechanisms that first passed their own cheapest
   discriminator. It is an acceptable result if none do.

This order changes the old plan in two useful ways: it adds a no-solver bulk-transfer test before
expensive implementation, and it separates step-source hollowing from SDAK rather than treating
all hollowing as one mechanism.

## What would count as useful failure

Phase 9 is not a contest to make every idea pass. Examples of good scientific outcomes include:

- the learned mass law performs no better than a constant rescaling of continuum transport;
- one surface law cannot reproduce both basal and prism measurements;
- transport alone explains a supposed pressure or morphology effect;
- a width law cannot use one frozen physical width scale across histories;
- step-source theory predicts the wrong rim direction or onset;
- the initiation contrast disappears after matching size and exposure; or
- a source protocol is too incomplete for a quantitative score.

Each of those narrows the model honestly and prevents an unnecessary implementation.

## What is still missing

| Missing item | Needed when | Current effect |
|---|---|---|
| Harrington-Pokrifka 2026 full article | Before implementing exact step-source/hollowing equations | Blocks that one quantitative arm, not Phase 9 design |
| Keller-Hallett 1982 full article | Only if quantitative ventilation is adopted | Ventilation remains a qualitative compatibility gate |
| Lamb training experiment-ID bundle | Before calling our 16 histories non-training transfer data | Requires a lineage join; comparator can still be development-only |
| Newer Libbrecht monograph edition | Before freezing an input found only in the captured edition | M-W's monograph-only width law remains provisional |
| Cross-pressure trajectory | Before claiming M-PK identifies pressure dependence | Current one-bar data support source replay only |
| Definition of the -50 C archive's `48` and `20` labels | Before absolute forcing conversion | Rim and dimension change points remain usable categorically |
| A future unseen dataset | Before independent validation | No effect on model-development experiments |

## Where to look next

- [Final machine-readable baseline report](../evidence/phase9-knowledge-baseline-v1/report.json)
- [Detailed source and theory report](../research/phase9-knowledge-sources.md)
- [Machine-readable 18-source register](../evidence/phase9-knowledge-baseline-v1/source-register.jsonl)
- [Machine-readable 15-hypothesis map](../evidence/phase9-knowledge-baseline-v1/hypotheses.jsonl)
- [Reproducible calculation output](../evidence/phase9-knowledge-baseline-v1/calculations.json)
- [Proposed Phase 9 experiment plan](plans/phase-9-modular-physics-arms.md)
- [Plain-English Phase 8 data guide](phase8-baseline-guide.md)

The PDFs, code archives, rendered pages and raw OpenAlex responses live in private NAS collections
under `collections/research-private-freeze/2026-08-11/payload/`,
`collections/phase8b-search/2026-08-15/payload/`, and
`collections/phase9-search/2026-08-15/payload/`. Git contains only the smaller provenance,
calculations, hypotheses and readable guides.
