# Phase 9 model-development guide

## What we tested, what we learned, and what may move us closer to a real snow-crystal model

**Status:** Phase 9 is complete as a development-only, all-no-pass campaign. It changed no
permanent solver, promoted no new mechanism, ran no combination campaign, and earned no
quantitative-validation credit.

This guide is the readable companion to the completed
[Phase 9 execution plan](plans/phase-9-execution.md). It explains the scientific reasoning,
measurements, equations, evaluation methods, outcomes, newly useful source material, and the
evidence still needed. For the earlier foundations, see the
[Phase 8 baseline guide](phase8-baseline-guide.md) and the
[Phase 9 knowledge guide](phase9-knowledge-guide.md).

### Reading paths

- For the outcome, read **The five-minute version** and **Outcome table**.
- For the science, read **A mental model** and **Results by physics layer**.
- For what should happen next, read **The frontier material** and **Evidence-gated route**.
- For unfamiliar terms, jump to the **Glossary**.

## The five-minute version

Phase 9 asked a disciplined question:

> Before adding more physics to the three-dimensional solver, which proposed mechanisms survive
> the cheapest experiment that can honestly distinguish them from a simpler explanation?

The answer was **none yet**. That does not mean all the proposed physics is false. It means the
present measurement/model pairs did not justify adding a mechanism without inventing a mapping,
ignoring an apparatus effect, extrapolating a formula outside its printed domain, or treating
missing information as agreement.

The most important results were:

- Phase 8 supplied **51 development records**, **252,134 native-history rows**, and **431
  digitized graph points**. None is held out for validation.
- The broader NAS reconciliation resolved **70 aliases into 59 complete artifacts**:
  55 PDFs and four ZIP archives totaling **283,899,114 bytes**. This materially changed the older
  Phase 9 design.
- Protocol-aware adapters registered **112 requested purposes** for the 51 records. Only 51 were
  eligible even with limitations; 41 were ineligible and 20 were source-blocked.
- Only **two Phase 9 families ran registered model-versus-source quantitative comparisons**:
  - The Lamb bulk-transfer law did not survive its six-history levitation comparison.
  - The M-K2 planar-facet result depended on an unresolved apparatus-to-surface mapping and could
    not receive a physical score.
- All other candidates ended as source intake, compatibility checks, categorical descriptions,
  analytic or manufactured calculations, or explicit refusals. Those are useful foundations, not
  measured failures.
- With **zero promoted one-factor mechanisms**, combining mechanisms would have been scientifically
  unjustified. The correct number of combination runs was zero.

In short, Phase 9 did not find the final model. It found a clearer route to one.

## A mental model: five layers must agree

A realistic snow-crystal simulation is not one formula. It is a chain of distinct physical and
observational layers:

| Layer | Plain-language question | Examples in Phase 9 |
|---|---|---|
| **1. Environmental transport** | Can water vapor reach the crystal, and can released heat leave it? | Bulk transfer, diffusion, latent heat, pressure, gas species, ventilation |
| **2. Surface attachment** | Once vapor reaches a face, how readily do molecules join the ice? | Broad-facet kinetics, printed one-/two-branch prism kinetics, pressure-conditioned surface residual |
| **3. State and history** | Does the route to the current condition or a measurable surface state matter? | Forcing paths, gas switches, roughness, initiation, growth–sublimation–regrowth |
| **4. Geometry** | Do facet width, molecular-step location, curvature, support, or hollowing change growth? | Width law, step-source rival, rim histories, Gibbs–Thomson diagnostic |
| **5. Observation mapping** | Does the simulated object actually represent the laboratory specimen and apparatus? | Supported versus falling versus levitated crystals, local versus plotted supersaturation |

The fifth layer is easy to underestimate. A good physical equation can still be tested unfairly if
the experiment measures a different object. For example, a levitated particle provides mass but
not its basal and prism faces; a substrate-supported needle has asymmetric vapor and heat transfer;
a free-falling ensemble has ventilation and population-selection effects.

That is why Phase 9 often stopped before running a model. Refusing an invalid comparison is part of
the scientific result.

## What Phase 8 gave Phase 9

### The selected development benchmark

The Phase 8B successor target book contains 51 records:

| Evidence grade | Records | Meaning in Phase 9 |
|---|---:|---|
| P0 | 18 | Native histories retained at source resolution |
| P1 | 28 | Adjudicated graph series or reported aggregates |
| P2 | 5 | Interpretive constraints and refusal rules, not numeric coordinates |
| **Total** | **51** | All are development evidence; none is held out |

The exact summary lives in
[`evidence/phase8b-benchmark-final-v1/report.json`](../evidence/phase8b-benchmark-final-v1/report.json),
and the entry book is
[`successor-target-book.jsonl`](../evidence/phase8b-benchmark-final-v1/successor-target-book.jsonl).

### The measurement families

| Measurement family | Phase 8 content | What it can directly tell us | What it cannot directly tell us |
|---|---|---|---|
| Levitated particle mass | 16 histories, 252,040 rows; initial equivalent radii 5.8–12 µm | Bulk mass-growth history under the recorded apparatus conditions | Habit, grain count, basal/prism growth, or unconfounded free-particle transfer |
| Supported dimension/rim | Two native −50 °C histories, 94 rows | Axis and rim evolution, event timing, categorical forcing-label response | A calibrated local forcing value or unsupported-crystal transfer |
| Libbrecht 2011 supported histories | Six series, 207 points at −15 °C | Registered source-forcing, radius, and height histories for two supported crystals | Substrate-free growth or a directly measured surface supersaturation |
| Libbrecht 2016 supported histories | Four series, 78 points at −5 °C and one bar | Radius/height source replay under two one-bar source conditions | Cross-pressure response; the two height series also contain arbitrary offsets |
| Sei–Gonda planar facets | Six series, 96 points at −7, −15, and −30 °C | Direct basal and prism normal-growth observations | A proven conversion from the plotted apparatus coordinate to facet-local supersaturation |
| Gonda–Komabayasi free fall | Ten series, 50 points | Relative gas/pressure ordering and separate reported transport interventions | Still-air behavior, absolute ventilation-free scoring, or a pure surface-kinetics residual |
| Bacon initiation aggregates | Two summaries | Reported group ranges and growth contrasts | Frequencies, effect sizes, or individual distributions without denominators |

This heterogeneity is why the records cannot be pooled into one universal score.

## What the expanded NAS material changed

The original Phase 9 proposal predated the final Phase 8 search. Before freezing any evaluation,
Phase 9 reconciled the broader registered source collection. The
[source-overlay report](../evidence/phase9-source-overlay-v1/report.json) records 59 complete
artifacts and their dispositions; the bounded set is substantial but is not a claim of complete
global literature coverage. Three named full texts remained missing—the complete HP26 article,
Keller–Hallett 1982, and Wang 1987—and four Nakaya partial paths remained unresolved.

Several acquisition filenames misidentify their contents. This guide follows the bound source
identity and digest—not the filename—for Isono 1957, Kobayashi 1958, Gonda 1976, Voigtländer 2018,
and Magee 2014. The [Sato correction record](../research/phase9-sato-source-correction.md) is also
load-bearing.

Several papers changed the scientific design:

| Source material | Newly useful observation | Consequence for model development |
|---|---|---|
| **Isono et al. 1957** | Same-crystal air↔hydrogen histories; the plotted times are minutes | Shows that gas changes have paths and transients, not just scalar endpoints |
| **Kobayashi 1958** | Low-pressure size transforms, pressure/temperature histories, and same-run habit transitions | Makes pressure a transport/history problem, not merely a `1/pressure` correction |
| **Gonda–Komabayasi 1970** | Gas-mixture axes, branching, hollowing, and habit observations | Adds aggregate gas/pressure confrontation material while retaining geometry confounds |
| **Gonda 1976** | Pressure-by-gas morphology, dimensions, and axis ratios | Adds useful candidate rows, but Figure 3 is numerically refused because caption and prose disagree on temperature |
| **Gonda–Komabayasi 1971** | Separate reported vapor-diffusivity and thermal-conductivity interventions | Motivates separate vapor and latent-heat resistances rather than one pressure knob |
| **Crowther–Saunders 1973** | Electric-field effects on crystal growth | Makes the levitation electric field an explicit transfer confound for D-BT |
| **Voigtländer et al. 2018** | Reported roughness changes during repeated growth–sublimation cycles | Adds observable surface-state vocabulary; numeric trajectories and calibration media remain unregistered |
| **Nelson–Swanson 2019** | Lateral facets, corner pockets, and growth–sublimation–regrowth sequences | Adds a third hollowing/surface-structure rival beyond width and step-source laws |
| **Magee et al. 2014** | Ridges, stalled old crystals, and neighboring new growth in ESEM | Supports a persistent observable-state question, with substrate/ESEM limitations |
| **Takahashi 1991 plus correction** | Reynolds-number and ventilation behavior | Supports a diagnostic bound, but not a complete controlled-velocity score for the selected rows |
| **Sato–Kikuchi 1988** | Denominated categorical initiation contrasts | Enables honest descriptive proportions without inventing counts from printed bars |
| **Murai 2012 and categorical atlases** | Larger condition-labeled morphology collections | Opens a future atlas evaluation once categories, sampling, and denominators are frozen |
| **Fuchs et al. 2025** | Classified natural-cloud particle sizes and rates inferred from plume residence time | Adds future M-V/M-PT/M-LH compatibility context; native Zenodo data/scripts and contamination rules remain missing |

These sources forced three design corrections:

1. Gas/pressure **transport response** is not the same claim as a pressure-conditioned **surface
   attachment residual**.
2. Observed roughness, pockets, and lateral facets form a rival family; they should not be silently
   assigned to a width law or step-source theory.
3. Apparatus, specimen lineage, and re-expressions of the same experiment must stay together. A
   measured curve cannot be called held out if its fitted coefficient helped design the model.

## The evidence filter Phase 9 built

### Protocol-aware adapters

Phase 9 introduced six measurement classes rather than forcing every source into one schema:

| Adapter | Records | Why it remains separate |
|---|---:|---|
| Free-particle mass | 16 | Mass-only levitation histories do not contain facet or habit observations |
| Gas/pressure intervention | 10 | Free-fall gas experiments jointly carry transport and ventilation limits |
| Initiation aggregate | 2 | Group summaries are not individual observations |
| Interpretive constraint | 5 | These prevent invalid claims rather than supply score rows |
| Planar facet | 6 | Direct face speeds still need a source-to-surface forcing map |
| Supported dimension/rim | 12 | Substrate, support, and asymmetric transfer remain part of the protocol |

Across all records, the adapter registry contains 112 requested uses: 51 are
`eligible-with-limitation`, 41 are `ineligible`, and 20 are `source-blocked`. The exact policies are
in [`phase9-adapter-registry-v1.jsonl`](../research/phase9-adapter-registry-v1.jsonl).

### What “fail closed” means

If a required field is absent, the evaluation returns **unavailable**, **ineligible**, or
**source-blocked**. It does not guess a value. Examples include:

- no local surface supersaturation mapping → no physical planar-facet score;
- no interval-wide fall speed, density, viscosity, and size → no Reynolds-based eligibility;
- no denominator → no frequency or effect-size calculation;
- no complete printed equations → no implementation reconstructed from a companion archive;
- no matched curvature intervention → no experimental curvature result.

This is deliberately conservative. It prevents an absence of evidence from being misread as model
agreement.

## New evaluation methods

| Method | Easy explanation | Why it helps |
|---|---|---|
| **Cheapest discriminator first** | Try a scalar or planar calculation before building a 3-D mechanism | Weak or unidentifiable ideas stop early and cheaply |
| **Protocol-aware comparison** | Compare only experiments and models that represent the same support, geometry, forcing, gas, ensemble, and observable | Prevents plausible but physically mismatched scores |
| **Equal-history loss** | Compute the mean error inside each history, then average the histories | A densely sampled history does not gain extra scientific weight |
| **Leave-one-history-out rival** | Fit a simple multiplier on five histories and test only the sixth | Avoids evaluating that multiplier on a history used to fit it; this is cross-fitting within development data, not held-out validation |
| **Heldout-only sensitivity** | Perturb only the omitted leave-one-history-out fold and do not refit on that perturbation | Checks cross-fit robustness without leaking the answer into the fit; the fold remains development evidence, not held-out validation |
| **Digitization-interval gap** | Measure separation between graph-reading intervals | Preserves coordinate-reading uncertainty without calling it a confidence interval |
| **Mapping-family diagnostic** | Predeclare several possible apparatus-to-surface conversions | Reveals when the unknown mapping, rather than the candidate law, controls the conclusion |
| **One-factor intervention** | Change vapor diffusivity or thermal conductivity, never both | Separates mechanisms and refuses an interaction the experiment did not cross |
| **Endpoint-erasure diagnostic** | Count the condition changes lost if only start and end are retained | Separates path fidelity from a claim of hidden memory |
| **Categorical constraint** | Preserve a reported state or direction without inventing coordinates | Lets images and printed categories constrain a model honestly |
| **Descriptive null diagnostic** | Show contingency-table arithmetic but omit inferential claims when groups are unmatched | Retains useful contrast information without claiming causality |
| **Manufactured convergence ladder** | Test numerical arithmetic against a synthetic answer known in advance | Prepares a future estimator without pretending it already works in the solver |
| **Independent byte verifier** | A sibling implementation reparses source bytes and rebuilds the verdict | Detects computational and provenance errors without trusting the publisher’s pass field |
| **Explicit refusal branch** | “Not computable honestly” is a registered outcome | Keeps pressure to produce a number from weakening the protocol |

The byte verifiers check computation and provenance; they do not create physical validity. For
example, the D-BT verifier reparsed 57,199 rows and exercised 15 named mutations, while the
M-F/M-K2 verifier rederived 96 points and rejected nine mutations. Both remain development results.

## Results by physics layer

### 1. Permanent controls: no compatible score, not a zero score

The permanent `GGThreshold` and `LibbrechtKinetics` operators were checked against all 51
selections and 112 registered purposes.

- `GGThreshold` has no physical clock or mapping to experimental temperature, pressure, mass,
  size, or normal face speed.
- `LibbrechtKinetics` has physical interface time but lacks the needed source support/substrate,
  initial geometry, ensemble initiation, gas species, ventilation, and local planar-forcing maps.

Therefore **zero solver runs and zero scores were authorized**. The outcome is an unavailable
mismatch vector, not 51 measured zeros. Releasing the Phase 6 compute host would not fix the
scientific incompatibility. Separately, the `S2-CONTROLS` source shelf retains four unresolved
Nakaya partial-acquisition paths.

Protocol: [`phase9-permanent-control-readiness-protocol-v1.json`](../research/phase9-permanent-control-readiness-protocol-v1.json).

### 2. D-BT: mass-conditioned bulk transfer

#### The question

Does the Lamb learned bulk-transfer formula beat the precommitted leave-one-history-out continuum
rescale on the six registered histories? Ordinary continuum and the project hybrid are reported
alongside them but do not enter the survival verdict.

#### The calculation

An equivalent sphere converts mass to radius:

```text
r = (3m / (4*pi*rhoIce))^(1/3)
```

Bulk growth is then integrated as:

```text
dm/dt = 4*pi*r*sigmaExcess*K(m,T,P)
```

Here `K` is the candidate bulk-transfer coefficient. This is a mass model, not a facet, habit, or
morphology model.

The family score gives every history equal weight:

```text
familyMSE = mean over histories [ mean over that history (prediction - observation)^2 ]
```

That differs from pooling every second from every history, which would let longer histories count
more heavily.

#### The supporting data

- six Button Electrode Levitation histories inside the registered 205–240 K domain;
- 57,199 raw source rows;
- 2,550 integer-second samples under strict `time < 500 s`;
- 141 adjacent mass decreases retained rather than smoothed away;
- four sensitivity cases per history: lower/upper initial radius and ±5% observation bands.

#### The result

| Comparator | Equal-history MSE |
|---|---:|
| Ordinary continuum | 87.45272 |
| Project ambient-excess hybrid | 86.8825 |
| Lamb symbolic law | 431.3416 |
| Leave-one-history-out continuum rescale | 0.6578183 |

On the central inputs, Lamb won **0 of 6** histories; the protocol required at least 4 of 6 and a
lower family MSE. None
of 24 sensitivity cases changed the win/loss direction. The smallest published Lamb-minus-rescale
margin was approximately `140.224`. These MSE values are squared errors of the dimensionless mass ratio; they
are not comparable in magnitude to the planar-facet errors below.

The outcome is `central-no-effect-or-failure`. It means the Lamb law did not survive this bounded,
within-apparatus development comparison. It does **not** mean bulk mass conditioning is universally
false or that the fitted rescale is the true physical law. The rescale may absorb apparatus,
electric-field, shape, or other missing effects. Habit and crystallography were not observed, and
the training-history identity join is not definitive. The project hybrid is also a deliberately
named diagnostic with three departures from the printed Nelson–Baker relation, not an exact
Nelson–Baker reproduction.

Evidence: [`phase9-dbt-six-history-development-v3`](../evidence/phase9-dbt-six-history-development-v3/).

### 3. M-F versus M-K2: planar-facet kinetics

#### The question

Before growing a whole crystal, does the printed M-K2 prism rule improve direct basal/prism face
speed predictions over the inherited broad-facet comparator?

The local normal speed has the Hertz–Knudsen form:

```text
vNormal = alphaHK(T,sigmaSurface) * vKin(T) * sigmaSurface
```

`alphaHK` is the dimensionless Hertz–Knudsen attachment coefficient. For M-K2, the prism
coefficient is a sum of printed nucleation branches:

```text
alphaHKPrism = sum_i [ A_i * exp(-sigma0_i / sigmaSurface) ]
```

M-K2 prints two prism branches at −7 °C and one at −15 °C. It does not print a −30 °C branch, so
Phase 9 refused that extrapolation. Its basal comparator remains unchanged.

#### The mapping problem

The six Sei–Gonda series contain 96 direct face-growth observations, but the plotted apparatus
supersaturation is not proven to be the supersaturation at the growing facet. Phase 9 therefore
predeclared five diagnostic constructions:

```text
sigmaSurface = q * sigmaPlotted
q in {0.125, 0.25, 0.5, 0.75, 1}
```

#### The result

| Mapping `q` | M-F central equal-series matched-prism MSE `(µm/s)^2` | M-K2 central equal-series matched-prism MSE `(µm/s)^2` | Registered effect met? |
|---:|---:|---:|---|
| 0.125 | 0.416781 | 0.413991 | Yes |
| 0.25 | 0.261990 | 0.221395 | Yes |
| 0.5 | 0.069841 | 0.381919 | No |
| 0.75 | 0.809256 | 2.659277 | No |
| 1 | 2.978023 | 7.875276 | No |

Only **2 of 5** constructions met the diagnostic effect. The answer changes with an unresolved
mapping, so the result is `diagnostic-mapping-dependent`, the physical score is unavailable, and
no morphology inference or promotion follows. The central MSE values here have units of
`(µm/s)^2` and cannot be compared numerically with the D-BT mass-ratio MSE. The registered effect
also required strict wins on both matched prism series and interval-gap MSE no worse than M-F.
Digitization intervals represent graph-reading uncertainty, not specimen dispersion or confidence
intervals, and the candidate prediction uncertainty remains incomplete.

Evidence: [`phase9-mf-mk2-planar-diagnostic-v1`](../evidence/phase9-mf-mk2-planar-diagnostic-v1/).

### 4. Ventilation: a compatibility gate, not a correction factor

For a falling crystal, gas motion can change vapor and heat transport. A useful diagnostic is the
Reynolds number:

```text
ReUpper = densityUpper * speedUpper * aAxisUpper / viscosityLower
```

The registered diagnostic threshold was an interval-wide maximum below 2, chosen below the earliest
approximate reported onset. It could not open eligibility because no consuming record supplied the
complete operands and protocol fields. The source also reports a no-effect example at 7.5, so the
threshold is not a universal classifier.

None of the ten selected Gonda–Komabayasi records binds all required density, viscosity, speed,
size, time, temperature, droplet, support, and method fields. Absolute and model-relative
eligibility are therefore zero. The ten source-reported order spans remain usable only as
descriptive, non-air, free-fall, transport-confounded records: six helium–argon series and four
reduced-pressure helium series.

Protocol: [`phase9-mv-protocol-v1.json`](../research/phase9-mv-protocol-v1.json).

### 5. Vapor and latent-heat resistance

Phase 9 separated two ways growth can be limited:

```text
Rv = R*T / (pSatIce * Dv * Mw)

Rh = [Ls / (k*T)] * [Ls*Mw / (R*T) - 1]

Kbulk = 1 / (Rv + Rh)
```

`Rv` is the vapor-diffusion resistance and `Rh` is the latent-heat resistance. The following are
reproducible 64-bit floating-point outputs from deliberately manufactured operands, not estimates of a source
experiment:

```text
T = 250 K, pSatIce = 100 Pa, Dv = 2e-5 m^2/s, k = 0.02 W/(m*K)
R = 8.3144521 J/(mol*K), Mw = 0.018 kg/mol, Ls = 2,837,000 J/kg
```

| Quantity | Value |
|---|---:|
| Vapor resistance `Rv` | 57,739,250.6944 s·m/kg |
| Latent-heat resistance `Rh` | 13,372,110.6504 s·m/kg |
| Total resistance | 71,111,361.3448 s·m/kg |
| Bulk coefficient | 1.40624505×10⁻⁸ kg/(m·s) |

Halving vapor diffusivity doubled only `Rv` and reduced the bulk coefficient by a factor of about
`0.55189`. Halving thermal conductivity doubled only `Rh` and reduced the coefficient by about
`0.84172`. Changing both was refused because the source design was not a crossed factorial
experiment, so an interaction could not be identified.

Printed latent-heating anchors were retained only as identities:

| Temperature | Printed `chi0` | Multiplier `1/(1+chi0)` |
|---:|---:|---:|
| −1 °C | 0.8 | 0.555556 |
| −10 °C | 0.4 | 0.714286 |

They do not define an interpolation to −7 or −15 °C. All ten selected source rows remained blocked
for quantitative transport scoring by ventilation and source-condition gaps.

Protocol: [`phase9-transport-analytic-protocol-v1.json`](../research/phase9-transport-analytic-protocol-v1.json).

### 6. Gas and pressure: transport response versus surface residual

The expanded corpus produced 26 bounded M-GP intake records:

- 14 coordinate-null digitization candidates;
- seven categorical or image constraints;
- two printed Isono timelines;
- one hard numeric refusal;
- two source-derived exclusions;
- zero authorized cross-pressure coordinates.

These papers report different size, axis-ratio, branching, hollowing, and habit outcomes under
changed pressure or gas. But pressure, gas species, vapor diffusivity, thermal conductivity,
support, geometry, and history also change. The observations therefore constrain aggregate transport response; they do
not isolate a surface attachment coefficient.

Registry: [`phase9-mgp-development-registry-v1.jsonl`](../research/phase9-mgp-development-registry-v1.jsonl).

### 7. Path fidelity, memory, and observable surface state

These are different claims:

- **Path fidelity:** represent the actual sequence of external conditions.
- **Hidden memory:** introduce an internal state not explained by the resolved path and geometry.
- **Observable state:** represent something measured, such as roughness, terraces, pockets, or rim
  width.

Isono provides two exact categorical paths whose final air condition hides intermediate gas
switches. Figure 9 contains four registered gas changes and Figure 10 contains two; an
endpoint-only representation erases all six. That supports an endpoint-erasure diagnostic:
endpoint-only input discards real history.
The HP26 archive supplies a categorical `48 → 20` label event at 13,800 s, bracketed by rows at
13,504 and 13,804 s, but those labels are not calibrated solver forcing values.

Voigtländer, Nelson–Swanson, and Magee support source-bound vocabularies for smooth/rough,
terraces, corner or center pockets, ridges, stalled surfaces, growth, sublimation, and regrowth.
They do not yet supply a calibrated numeric state trajectory under matched transport.

Consequently hidden memory remained `null` and non-identifiable. No replay, state fit, causal
claim, or promotion ran.

Registry: [`phase9-mh-msr-registry-v1.jsonl`](../research/phase9-mh-msr-registry-v1.jsonl).

### 8. Pressure-conditioned surface-kinetics residual

The M-PK foundation preserved four Libbrecht 2016 series—two radius and two height series, 78
points total—as one-bar, supported-needle source envelopes. It did not re-zero the arbitrary height
offsets.

No residual score was honest because:

- the solver lacks needle/substrate heat flow and asymmetric vapor transfer;
- the evolving supported geometry is not represented;
- M-GP supplies no authorized cross-pressure numeric coordinates; and
- aggregate gas/pressure response does not identify a surface residual.

Protocol: [`phase9-mpk-residual-protocol-v1.json`](../research/phase9-mpk-residual-protocol-v1.json).

### 9. Three hollowing and surface-structure rivals

Similar-looking hollow crystals can result from different mechanisms.

#### Width-conditioned attachment

The normalized width hypothesis is:

```text
sigma0(w) / sigma0(infinity) = 1 - exp(-w/w0)
```

| `w/w0` | Normalized barrier |
|---:|---:|
| 0.1 | 0.09516 |
| 0.5 | 0.39347 |
| 1 | 0.63212 |
| 2 | 0.86466 |
| 5 | 0.99326 |

This checks the shape of the dimensionless hypothesis. A physical `w0` and a lattice-to-width map
remain absent, and the current Princeton edition has not been compared.

The manufactured width estimator used threshold crossings at `−0.5` and `+0.5`, giving width `1`
and zero fixture error. That proves the registered estimator arithmetic only; it is not a physical
rim-width calibration.

#### Step-source location

Molecular steps beginning at different facet locations may favor solid or hollow advance. The
captured companion archive contains rim histories but not the final article’s complete equations,
integrator, fit cases, or hollowing update. Phase 9 correctly did not invent the missing model.

#### Observed roughness and lateral-facet state

Pockets, terraces, roughness, ridges, and regrowth form a third rival family. They are observations,
not automatic confirmation of either width-conditioned attachment or step-source causality.

The two HP26 rim histories show why spatial data may eventually discriminate mechanisms. In the
26-row history, the `a` dimension grew by about 3.38×, the `c` dimension by 6.33×, and rim width
remained about 0.994× its initial value; rim/`a` fell from about 0.606 to 0.178. In the 68-row
history, `a` grew by 3.87×, `c` by 10.10×, and rim width by 5.72×; rim/`a` rose from about 0.391 to
0.579. Around the 13,800 s source-label event, rim width rose from 6.37 µm at 13,504 s to 7.87 µm
at 13,804 s. These remain same-lineage endpoint and event-bracket source features; no
matched-transport ranking was possible.

Protocol: [`phase9-hollowing-rivals-protocol-v1.json`](../research/phase9-hollowing-rivals-protocol-v1.json).

### 10. Initiation and exposure

Sato–Kikuchi supplies denominated categorical contrasts. For microcline nucleants:

```text
small group: 89 / 112 = 0.7946428571
large group: 48 / 49  = 0.9795918367
difference:             0.1849489796
```

The descriptive two-by-two Pearson diagnostic is approximately `9.1920`; its p-value is deliberately
`null` because the groups were not a predeclared matched inferential experiment. The printed
frozen-droplet result of 35% for 20 observations is exactly `7/20`.

Printed morphology directions were preserved, but bar heights were not converted into invented
counts. Bacon group summaries remained refused for frequency/effect-size calculations because
their denominators and individual rows are absent. Initial size, exposure, vapor competition, and
prior growth/evaporation also differ, so the contrast is not a causal initiation-state estimate.

Protocol: [`phase9-ms-protocol-v1.json`](../research/phase9-ms-protocol-v1.json).

### 11. Gibbs–Thomson curvature

For a manufactured sphere:

```text
dSv = gammaSv / (cIce * kBoltzmann * temperatureK)
kappa = 2 / radius
sigmaEffective = sigmaSurface - dSv*kappa
```

The registered 1 nm `dSv` is a manufactured numerical fixture, rounded from a
temperature-dependent derived scale with incomplete uncertainty; it is not an adopted physical
input. The source-provenance labels used in the underlying protocol are separate from Phase 8's
P0/P1/P2 measurement-evidence grades.

Here `temperatureK` is absolute temperature in kelvin, and `cIce` is the molecular number density
of ice. Those definitions make `dSv` a length.

As a scale-only calculation, applying that manufactured, non-adopted 1 nm fixture to the Phase 8 equivalent-
sphere radius range of 5.8–12 µm gives equilibrium-shift fractions from about `3.4483e-4` down to
`1.6667e-4`. This does not turn the fixture into a measured curvature correction.

The manufactured grid target was:

```text
estimatedCurvature(N) = (2/radius) * [1 + 0.08*(8/N)^2]
```

| Cells per radius `N` | Relative error | Pairwise order to next level |
|---:|---:|---:|
| 8 | 0.08 | 2 |
| 16 | 0.02 | 2 |
| 32 | 0.005 | 2 |
| 64 | 0.00125 | — |

The arithmetic and second-order fixture passed. No actual stacked-triangular-lattice curvature
estimator was implemented or run, and Phase 8 contains no matched curvature intervention.

Protocol: [`phase9-mgt-analytic-protocol-v1.json`](../research/phase9-mgt-analytic-protocol-v1.json).

## Outcome table: what each result really means

| Candidate or tool | Phase 9 grade | Outcome | What would unlock the next grade? |
|---|---|---|---|
| Permanent controls | Compatibility/refusal | No score-compatible selection; no solver run | Source-specific geometry, support, ensemble, gas, ventilation, and forcing mappings |
| D-BT | Quantitative development score | Lamb 0/6; `central-no-effect-or-failure` | Independent apparatus and one-factor temperature/supersaturation evidence |
| M-F/M-K2 | Quantitative diagnostic | 2/5 mappings; physical score unavailable | Source-backed local surface-forcing map and complete uncertainty |
| M-V | Compatibility/refusal | Ten descriptive order spans; zero absolute eligibility | Complete controlled-velocity record with interval-wide operands |
| M-PT/M-LH | Manufactured analytic | Manufactured equation and one-factor arithmetic checks pass; all source scores blocked | Ventilation-complete target records and crossed design |
| M-GP | Source intake | 26 bounded records; zero authorized cross-pressure coordinates | Two-reader extraction plus condition conflicts resolved |
| M-H/M-SR | Categorical/refusal | Path categories preserved; hidden memory non-identifiable | Numeric observable state, exact forcing, matched endpoints, relaxation evidence |
| M-PK | Source-envelope/refusal | Four series prepared; no residual score | Supported asymmetric transfer plus transport-separated pressure series |
| M-W/M-SS/M-SR | Manufactured/categorical/refusal | No mechanism ranking | Current monograph, complete HP26 article, numeric surface trajectories, matched transport |
| M-S | Descriptive categorical | Denominated contrasts preserved; no causal effect | Matched size/exposure cohorts and complete denominators |
| M-GT | Manufactured numerical | Spherical identity and synthetic second order pass | Actual estimator, coupling, 3-D convergence, matched experiment |
| Promotions/combinations | Decision | Zero promotions; zero eligible combinations | At least one separately supported one-factor mechanism |

## The frontier material: useful leads, not executed candidates

The machine source overlay also uses ten `FRONTIER-*` labels to route papers that could matter
later. These are **not** members of the executed 11-row candidate table and were not tested as
Phase 9 mechanisms. Nine retain pending prerequisites; the Wang-1987 lead is source-blocked and
marked `not-required`. The distinction matters: Phase 9’s all-no-pass conclusion covers the
adopted candidate modules, not every possible technique mentioned by the broader literature.

| Frontier tag | Material it preserves | How it could help | Current blocker |
|---|---|---|---|
| Morphology atlas | TAX2, Murai 2012, needle-seeded panels | Broader categorical habit coverage | Frozen categories, sampling rules, and denominators absent |
| Cold end | Bailey–Hallett precursor and Takahashi–Fukuta | Extend very-low-temperature behavior | Later primary lineage and source-specific extraction needed |
| Electric field | Crowther–Saunders 1973 | Quantify the levitation apparatus confound | No registered field intervention or electric-field module |
| Geometry/gradient | Historical vapor-gradient filaments | Test imposed-gradient geometries | Geometry and gradient calibration not represented |
| Shape instability | Cross-material instability source | Context for branching mechanisms | No matched ice-only intervention |
| Isotope transport | Lamb et al. 2017 | Orthogonal transport observable | Not mapped to current mass/dimension/morphology outputs |
| Radiative cooling | Historical radiative-forcing source | Add a real thermal boundary mechanism | Radiative boundary conditions absent |
| Sublimation | Jambon-Puillet et al. 2018, ESEM sources, Nelson 1998 | Build a proper negative-drive model | The forward LK path has no source-matched sublimation operator or adapter; G–G melting is not that physical model |
| Threefold symmetry | True threefold-crystal source | Challenge the sixfold-only morphology contract | Current hex-lattice/morphology contracts have no true threefold branch; exact D6h behavior is configuration- and policy-dependent |
| Wang 1987 lead | Possible quantitative bulk-law rival | Add another mass-transfer hypothesis | No authorized full text or formula |

A frontier is a research lead, not a validated missing module.

## Evidence-gated route toward a more realistic model

This is a scientific priority order, not an already authorized new phase.

1. **Solve observation mapping before changing surface physics.** Establish how the apparatus
   coordinate maps to local surface supersaturation and how substrate/support alters vapor and heat
   transfer. This is the central blocker for both planar facets and the pressure residual.
2. **Complete the ventilation evidence.** Obtain the full controlled-velocity source or a source-
   complete conservative protocol with interval-wide size, speed, density, and viscosity.
3. **Separate gas transport from surface response.** Seek same-geometry, cross-pressure trajectories
   that hold gas/thermal/transport factors sufficiently controlled. Do not infer a surface law from
   heterogeneous historical comparisons.
4. **Obtain the complete HP26 model.** Then compare step-source, width-conditioned, and observed
   roughness/lateral-facet rivals using spatial/rim trajectories rather than final aspect ratio.
5. **Turn surface state into a calibrated observable.** Acquire numeric roughness, pocket, terrace,
   or rim trajectories with uncertainty and matched transport before introducing a hidden state.
6. **Test exact paths before memory.** Hidden memory becomes eligible only after exact forcing,
   matched endpoints, post-event relaxation, resolved geometry/transport, and a named observable
   state exist.
7. **Match initiation exposure.** Reproduce known size and exposure differences before adding an
   initiation variable.
8. **Implement curvature last and numerically.** Build a real lattice estimator and demonstrate
   convergence before coupling it to growth; physical promotion still needs a matched experiment.
9. **Combine only supported one-factor mechanisms.** Combining mechanisms does not supply the
   missing one-factor identification; do not use complexity to hide that gap.
10. **Reserve genuinely unseen evidence for a future separately chartered validation gate.** None
    of the Phase 8B or Phase 9 inputs can become held out after influencing the model design.

## How not to read the results

- The low leave-one-history-out MSE is not a discovered physical constant or a validated model.
- The D-BT result does not disprove all mass-conditioned transfer laws.
- A successful diagnostic `q` does not establish the real local surface supersaturation.
- `Re < 2` is not a universal no-ventilation theorem.
- Gas or pressure observations do not, by themselves, identify surface attachment kinetics.
- The −1 and −10 °C heat anchors do not define interpolation to other temperatures.
- The categorical `48` and `20` labels are not calibrated solver forcing values.
- Roughness, pockets, and terraces are observations, not automatically a hidden state.
- In the present evidence, final aspect ratio alone did not separate width effects, step-source
  location, diffusion gradients, substrate asymmetry, and surface state.
- The curvature ladder is manufactured; no actual solver curvature convergence was run.
- The permanent controls did not score zero; they were not score-compatible and did not run.
- Zero promotions means zero justified combinations, not that all snow-crystal physics was disproved.
- Phase 9 completion is procedural and evidential success, not physical validation.

## Glossary

| Term | Plain-language meaning |
|---|---|
| **Attachment coefficient (`alphaHK`)** | Dimensionless Hertz–Knudsen efficiency for molecules joining an ice face |
| **Basal face** | The top and bottom faces of a hexagonal ice crystal |
| **Prism face** | The side faces of a hexagonal ice crystal |
| **Supersaturation** | Vapor excess above ice equilibrium; far-field, apparatus, and surface values can differ |
| **Transport resistance** | Difficulty moving vapor to the crystal or heat away from it |
| **Latent heat** | Heat released when water vapor becomes ice |
| **Ventilation** | Changed transport caused by gas moving past a falling crystal |
| **Facet** | A flat crystallographic face |
| **SDAK** | Hypothesis that attachment kinetics change when a facet becomes narrow |
| **Step source** | A location supplying molecular ledges that allow a facet to advance |
| **Rim width** | Measured width of a raised or structured edge region |
| **Path fidelity** | Representing the actual time sequence of external conditions |
| **Memory state** | An additional internal state not explained by represented path and geometry |
| **Gibbs–Thomson effect** | Curvature raises equilibrium vapor pressure at small convex tips |
| **MSE** | Mean squared error; larger misses receive disproportionate weight |
| **Leave one history out** | Fit on all histories except one, then test the omitted history |
| **Digitization interval** | Coordinate-reading uncertainty from a graph, not a population confidence interval |
| **Promotion** | Permission to carry a mechanism into a more expensive campaign |
| **Development evidence** | Data used to design or choose a model; not independent validation |
| **Source replay** | Reproducing a source-derived rule on related data; not independent confirmation |
| **Manufactured test** | A synthetic problem with an answer chosen in advance to test arithmetic or numerics |
| **Refusal** | A deliberate result that the present evidence cannot support the requested calculation |

## Evidence map

| Topic | Authoritative record |
|---|---|
| Completed execution and limits | [Phase 9 execution plan](plans/phase-9-execution.md) |
| Phase 8 measurement foundation | [Phase 8 baseline guide](phase8-baseline-guide.md) |
| Mechanism and hypothesis foundation | [Phase 9 knowledge guide](phase9-knowledge-guide.md) |
| Expanded source reconciliation | [`phase9-source-overlay-v1`](../evidence/phase9-source-overlay-v1/) |
| Adapter policies | [`phase9-adapter-registry-v1.jsonl`](../research/phase9-adapter-registry-v1.jsonl) |
| D-BT quantitative result | [`phase9-dbt-six-history-development-v3`](../evidence/phase9-dbt-six-history-development-v3/) |
| Planar-facet diagnostic | [`phase9-mf-mk2-planar-diagnostic-v1`](../evidence/phase9-mf-mk2-planar-diagnostic-v1/) |
| Gas/pressure intake | [`phase9-mgp-development-registry-v1.jsonl`](../research/phase9-mgp-development-registry-v1.jsonl) |
| Path and surface-state registry | [`phase9-mh-msr-registry-v1.jsonl`](../research/phase9-mh-msr-registry-v1.jsonl) |
| Initiation registry | [`phase9-ms-categorical-registry-v1.jsonl`](../research/phase9-ms-categorical-registry-v1.jsonl) |
| Review of the completed result | [Phase 9 completion review](reviews/phase9-completion-review-2026-08-13.md) |
| Adversarial review of this guide | [Phase 9 guide review](reviews/phase9-model-development-guide-review-2026-08-13.md) |

## Final perspective

The project is closer to a real model in a specific sense: it now knows more clearly which physical
layer each observation can constrain and which missing measurements prevent an honest decision.
That is different from having found the final equations.

The strongest next advance is unlikely to come from adding several mechanisms at once. It is more
likely to come from one carefully matched experiment that connects the laboratory forcing to the
local crystal surface while preserving geometry, support, gas, ventilation, and history. With that
bridge in place, the existing planar, transport, rim, and surface-state observations become much
more discriminating—and a future model can become more realistic for reasons the evidence can
actually explain.
