# The Snowflake Project, Explained From Zero

**Maker-directed educational material (2026-07-28).** This file teaches the science and the
story of this project at a "smart teenager" level, as raw material for planning a video. It
deliberately simplifies; where it simplifies, it says so. It is not a spec, grants no evidence
claims, and the charter, ADRs, and solver docs remain authoritative everywhere they differ.

---

## Part 1 — How a snowflake actually grows

### It's not frozen rain

A snowflake is not a raindrop that froze. A frozen raindrop is just a boring little ball of
ice (that's sleet). A snow crystal is built **directly from water vapor** — individual water
molecules floating in cold air land on ice and lock into place, one by one, skipping the
liquid stage entirely. Scientists call this *deposition*. A single snow crystal contains
around a **billion billion** molecules (10^18), and every one of them arrived individually,
found a spot, and snapped into position. Nobody assembled it. No blueprint exists. The shape
builds itself.

That's the deepest idea in this whole project: **elaborate, beautiful structure emerging from
dumb local rules**. Each molecule only "knows" about its immediate neighbors. Yet the result
is a six-armed star with matching feathery branches, thinner than paper, more intricate than
anything you could carve.

### Why six?

Water molecules are shaped like little boomerangs (H-O-H at an angle), and when they freeze,
their hydrogen bonds force them into a honeycomb pattern — a hexagonal crystal lattice. Ice's
sixfold symmetry isn't decoration; it's baked into the molecule itself. Every snowflake is
six-sided because every water molecule votes for hexagons.

A tiny growing ice crystal is basically a microscopic hexagonal prism — like a pencil stub
with six flat sides. It has two families of faces:

- the **basal facets** — the flat top and bottom (think: the faces of a coin)
- the **prism facets** — the six sides around the edge (think: the sides of a pencil)

Hold onto this, because *every* mystery in this project comes down to one question: **which
family grows faster?** If the sides grow faster than the top and bottom, you get a thin, wide
**plate** (and eventually a star). If the top and bottom win, you get a tall, skinny
**column** (like a tiny glass pencil). Same molecule, same honeycomb — two totally different
shapes.

### The crystal is a diary

A snowflake grows while falling through a cloud, and the cloud is not the same everywhere.
As the crystal tumbles down, it passes through layers with different temperatures and
different amounts of moisture. Its growth style changes with the conditions — so each part of
the crystal records the conditions at the moment it grew. The center grew first, the edges
grew last. **The crystal's shape is a diary of its journey.**

And this explains the two most famous snowflake facts:

- **Why all six arms match:** the whole crystal is tiny (millimeters), so all six arms travel
  through the *same* cloud layers at the *same* time. Same diary, same story, six copies.
  (They match approximately, not perfectly — look closely at real ones.)
- **Why no two snowflakes are alike:** no two crystals take exactly the same path through
  exactly the same cloud. Different journey, different diary.

### The long-running modeling problem: the Nakaya diagram

In the 1930s, a Japanese physicist named **Ukichiro Nakaya** pioneered controlled laboratory
growth of snow crystals (his trick for suspending them: a strand of rabbit hair). He grew
thousands of crystals at controlled temperatures and humidity levels and mapped what shape
grew where. The map — the **Nakaya morphology diagram** — is bizarre:

- around **−2 °C**: thin plates
- around **−5 °C**: columns and needles
- around **−15 °C**: plates again — the big stellar ones with branches
- below about **−30 °C**: columns again

Plates, columns, plates, columns. The same substance flips its preferred shape **back and
forth** as you cool it down, across just a few degrees. And separately: the more moisture in
the air, the more elaborate and branchy the shape gets; less moisture gives small, simple,
compact crystals.

Why the flip-flop? It remains an active modeling problem rather than settled textbook
science. A major modern quantitative account came from **Kenneth Libbrecht** (a Caltech
physicist who spent decades growing and measuring snow crystals) in **2019**. The sources
reviewed for this project establish that model's relevance, not a universal priority claim
or a decades-long absence of other explanations. That's what makes this project more than a
graphics demo.

(One honesty note the project itself insists on: Nakaya's diagram is a hand-drawn qualitative
map with fuzzy boundaries, not a precision dataset. Modern observations even disagree with it
below about −20 °C. The project treats it as a report card, not as gospel.)

---

## Part 2 — The physics in the papers

The physical model used by this project organizes growth as a supply chain with two stages. Stage one:
water vapor has to **travel through the air** to reach the crystal. Stage two: when a
molecule arrives at the surface, it has to actually **stick**. Everything — plates, columns,
branches, hollows, the whole Nakaya mystery — comes from how these two stages compete.

### Stage 1: The delivery problem (diffusion)

Air is crowded. A water vapor molecule can't fly straight to the crystal; it staggers around
like a person crossing a packed concert hall, bumping into nitrogen molecules billions of
times per second. This random staggering is called **diffusion**, and it is *slow*. Since the
crystal eats vapor much faster than diffusion can deliver it, the air right next to the
crystal is always partly emptied out — the crystal sits inside its own little vapor shortage.

First, one essential word: **supersaturation** (the papers write it as sigma). It's the fuel
gauge. Cold air can hold only so much vapor before it "wants" to dump the excess onto any ice
available. Supersaturation measures how far past that limit the air is — sigma = 0.01 means
"1% more vapor than the air can comfortably hold." Bigger sigma, more fuel, faster growth.
The whole simulation is basically a 3D map of sigma at every point around the crystal.

Two consequences of slow delivery create most of a snowflake's drama:

**Tips win.** Any part of the crystal that sticks out — a corner, an edge, a bump — pokes out
of the local vapor shortage into fresher air, so it grows faster, so it sticks out more, so
it grows even faster. This runaway loop is called a **branching instability** (the fancy name
is Mullins–Sekerka). It's why crystals sprout arms, and why arms sprout side-branches. Nobody
designs the branches; the shortage does.

**Centers starve.** Flip that logic: the middle of a wide flat face is the hardest place to
deliver vapor to, because the face's own edges intercept it first. The center of the face
gets shortchanged — this is called the **Berg effect**. Push it far enough and the center of
a face stops growing while its rim keeps going... and the crystal grows a **hollow**. Hollow
columns and hollowed plates are real, common, and completely emergent. This project has a
hard rule about that: hollows must *emerge* from the vapor physics in the simulation. There
is no "make it hollow" instruction anywhere in the code, and there's an automated test that
would catch one.

The papers add one more helpful fact: crystal growth is thousands of times slower than
diffusion's staggering, so at any instant, the vapor cloud around the crystal has settled
into a steady pattern (the math name: the field is *quasi-static*, satisfying the Laplace
equation). Practical translation: the simulator's main job each step is "let the vapor cloud
settle, then grow the crystal a tiny bit, repeat."

### Stage 2: The bouncer problem (attachment kinetics)

Popular explanations of snowflakes often skip this part, and it is central to the Nakaya
modeling problem.

When a vapor molecule finally reaches the ice surface... it usually **doesn't stick**. It
lands, skitters around, and often leaves again. Whether it sticks depends on what the surface
looks like at the atomic scale. Physicists compress all of that mess into one number: the
**attachment coefficient**, written in this project as `alphaHK` (the "HK" tags it as
belonging to the Hertz–Knudsen growth law — the project is strict about naming, for reasons
you'll see later). Think of `alphaHK` as **stickiness**, from 0 to 1:

- `alphaHK = 1`: perfectly sticky — every arriving molecule stays
- `alphaHK = 0.01`: a picky bouncer — only 1 in 100 gets in

The growth law itself (Hertz–Knudsen) is almost embarrassingly simple. Growth speed of a
surface =

    stickiness × (max possible speed) × (local fuel)
    v_n     =    alphaHK · v_kin · sigma_surf

where `v_kin` is a temperature-dependent speed limit (how fast molecules bombard the surface)
and `sigma_surf` is the fuel gauge *right at the surface* — after diffusion has taken its
cut. Simple law; much of the surface-attachment model hides inside `alphaHK`.

**Why flat faces exist at all.** An atomically flat ice face is hard to grow on. A molecule
landing mid-face has no ledge to grab, so it usually leaves. Growth on a flat face has to
start a **new island** — a little one-molecule-thick patch — and starting an island is hard
(it needs several molecules to meet and hold on before any of them bail). But once an island
exists, its *edge* is a staircase step, and steps are easy to join. So a facet grows in
layers: long wait... island forms... the layer zips across the whole face fast... long
wait... next island. Like a brick wall where starting a new row is the hard part and
finishing the row is easy. Consequence: facet growth has an **exponential on-switch**. In
formula form, `alphaHK ≈ A · exp(−sigma_0 / sigma_surf)`: below a critical fuel level
(`sigma_0`), the face barely grows at all; above it, growth switches on hard. This
nonlinearity — whole shape families appearing and disappearing as conditions cross
thresholds — is the engine behind the diagram's sharp personality changes.

**The Nakaya mystery, restated carefully.** Basal faces (coin faces) and prism faces
(pencil sides) each have their own attachment parameterization — their own
`alphaHK(T, sigma_surf)`, with `sigma_0(T)` and `A(T)`. The broad-facet evidence combines
P1 measurements with P2 source fits, inferences, and figure digitizations; a continuous
curve is not a direct measurement at every temperature. Under a deliberately restricted
diagnostic, one can feed both facets the same positive `sigma_surf` and compare their
coefficients. M1's equal-prefactor functions swap ordering with temperature. But a growing
3-D crystal presents different, evolving local fields and geometry to its two facet
families, so equal-field coefficient ordering does **not** determine plate or column habit.
That answer has to come from the coupled forward solver.

**And the honest gap in the science.** The broad-facet P1/P2 parameterization does not by
itself settle the whole diagram. Libbrecht's proposed missing piece is called **SDAK**
(structure-dependent attachment kinetics): the hypothesis that stickiness depends not only on
temperature and fuel but on the **shape of the facet itself** — specifically, that very
narrow facet edges get stickier. That creates a feedback loop (narrow edge → stickier →
grows faster → gets narrower → stickier...) which could help produce razor-thin plates and
needles. Published model-dependent inversions of narrow-facet growth observations support
approximate barrier-reduction regions near −4 °C and −14 °C, but the surface fuel was not
directly verified and the dip widths and depths remain poorly constrained. The exact M1
dip functions and placement were selected using the Nakaya diagram, so they are P3 and a
Nakaya comparison using them is in-sample reproduction. The lattice mapping,
interpolation, resolutions, and tolerances are separately registered P4 discretization
choices. This provenance split — rather than a claim that every narrow-facet effect was
simply unmeasured — becomes the plot of Phase 6.

### The two papers that give you a computable model

**Gravner & Griffeath (2009) — the machinery paper.** Two mathematicians built a 3D
simulation that produces jaw-droppingly realistic snowflakes ("snowfakes," they called them)
on a home PC. Their world is a 3D honeycomb of cells — hexagonal LEGO. Each cell holds a few
numbers (vapor here? ice here? boundary mush?), and every tick, four simple rules run:
**diffuse** (each cell's vapor averages with its neighbors), **freeze**, **attach** (a
boundary cell joins the crystal when its local conditions pass a threshold), **melt**. That's
it. Plates, stellar dendrites, hollow columns, sandwich plates — all emerge. It's a vivid
demonstration that simple local rules can generate elaborate forms. But it has one honest limitation:
**there is no temperature anywhere in it.** Its attachment thresholds are abstract knobs.
Some knob settings make plates and some make columns, but *no knob is labeled in degrees*.
You can't ask it "what grows at −15 °C?" — the question isn't just unanswered, it's
un-askable. It's a "how to compute" paper, not a "why" paper.

**Libbrecht (2019 + the monograph) — the physics.** The other side has complementary
strengths: broad-facet measurements and source fits tied to physical temperatures, a
semi-empirical morphology model with explicitly Nakaya-informed narrow-facet inputs, and a
500-page reference book (*Snow Crystals*) full of equations, data, and lab technique. His
published simulations in the reviewed set mostly run in simplified geometry (like assuming
the crystal is perfectly round or cylindrical), rather than full free-form 3-D.

**The gap between them is where this project lives.** One side: a 3-D engine with no temperature.
The other: temperature-dependent physics developed mainly in reduced geometries. The reviewed July
2026 source set did not supply this exact end-to-end 3-D validation, but that search was not an
exhaustive priority review. This project tests the connection without making a universal priority
claim.

---

## Part 3 — What this project is, and how it uses that science

### The product idea (the reason this exists)

**The Virtual Cloud Chamber**: a desktop-browser app where *you* design a snowflake's journey
— you draw the path: "start at −4 °C and humid, drift to −15 °C, dry out, then a final cold
snap" — and watch a 3D crystal grow through your custom cloud in real time. Design the
journey; the crystal writes the diary.

But the twist that makes it special: the app **shows you the invisible**. You can slice
through the air around the crystal and *see* the vapor shortage as a colored field — watch
the tips glow with supply while the face centers starve. You can see, live, *why* the arms
sprout and *why* the hollow forms. Many online snowflake toys work like slot machines: pull
the lever, get a pretty shape. This is designed as an instrument: it makes the model's
cause-and-effect visible, so you can reason about it.

### The scientific move

The build strategy in one sentence: **take Gravner–Griffeath's honeycomb machinery, replace
its temperature-blind attachment thresholds, and install Libbrecht's source-cited attachment
parameterizations in their place.**

Now the temperature slider has a physical interpretation. It feeds the basal and prism
`alphaHK(T, sigma_surf)` parameterizations into the coupled field/surface solver, and the
plate-vs-column outcome is computed by that solver rather than assigned from a temperature
label. The inputs do not all have the same standing: broad-facet evidence is P1/P2; exact
M1 dips are Nakaya-informed P3 and in-sample for Nakaya; interpolation and the lattice
mapping are P4. Set −15 °C: does a plate grow under a frozen parameter set and numerical
protocol? Either answer is a scientific result about that implemented model. It is not,
by itself, a parameter-free consequence of the underlying measurements.

Both attachment rules are kept forever, side by side: `GGThreshold` (the original
Gravner–Griffeath rule — the reliable working floor and control for debugging) and
`LibbrechtKinetics` (the source-parameterized coupled operator). Like keeping a differential
control next to your own work.

### The honesty system

The project's stated identity is **epistemic honesty** — never claiming more than has been
earned. Concretely:

- Every number shown to a user carries two labels: what it **is** (input? computed?
  phenomenological knob?) and what it has **earned** (unvalidated? qualitatively supported?
  quantitatively validated?). The UI says "−15 °C (model input; not yet validated against
  measurement)" until — *unless* — Phase 6 earns the stronger claim. A real-looking number
  resting on an untested model is the most convincing fake there is.
- "We supplied source-cited physical parameterizations" and "the model reproduces reality"
  are **different claims**. Only the required Phase 6 evidence could support the second.
- A quirky but revealing rule: the bare word "alpha" is *banned from the entire repository*,
  enforced by an automated scanner. Why? Libbrecht's stickiness coefficient and
  Gravner–Griffeath's threshold knob are unrelated quantities that are both traditionally
  written with the same Greek letter — and they appear in the *same update step*. A simulator
  that confuses them would still make gorgeous crystals — for the wrong reasons — which for
  this project is the worst possible failure. So the code must always say *which* one:
  `alphaHK` or `ggThresh`. When correctness matters, you don't rely on being careful; you
  make the build reject the ambiguous form.

### The engineering shape (quick, because Part 4 tells the story)

- **The world** is a honeycomb lattice (hexagonal prisms, 6 side-neighbors + 2 vertical),
  because sixfold symmetry has to live in the *bones*. On a normal cubic voxel grid you can
  tune parameters forever and never turn four into six.
- **Two solvers, permanently.** A slow, ultra-careful CPU solver in double precision — the
  **oracle**, the pinned float64 numerical comparison reference, never deleted — and a fast GPU solver for interactivity,
  which must continually prove it agrees with the oracle. Fast intern, checked against the
  meticulous accountant.
- **Metrics, not vibes.** Every scientific milestone is an automated number (a symmetry
  error, an aspect ratio, a hollowness index) with a command that reproduces it. "Looks
  right" is explicitly not evidence.
- Built by **multiple AI models across sessions with no shared memory**, coordinated entirely
  through written state files, plan files, decision records, and adversarial review — a
  relay race where every runner writes detailed notes for the next. (Numbered ADRs preserve
  accepted decisions and proposed changes; every mid-course correction is written down with
  its reasons.)

---

## Part 4 — The story so far, phase by phase

This is the part with the drama. The project ran **Phases 0 through 5 in about two weeks**
(mid-to-late July 2026, ~270 commits), and is now deep in Phase 6. What follows is the
detailed story, including the failures — *especially* the failures, because the project's
whole method is that failures get recorded, diagnosed, and turned into fixes with a paper
trail.

### Phase 0 — Read until you actually understand (no code allowed)

Before any code: read the papers until specific skills exist — sketch the Nakaya diagram from
memory; explain why a cubic grid cannot preserve the required sixfold environment; write
Gravner–Griffeath's update cycle as pseudocode; **explain hollowing without mentioning any
hollowing rule**; and separate measured, fitted/inferred, Nakaya-informed, and numerical
inputs. That last skill matters most: it's the honesty system in embryo.

### Phase 1 — A cheap toy answers the only product question that matters (a weekend)

Before betting months on 3D: is "designing a cloud journey" even *fun*? A throwaway 2D
snowflake toy (an old-school cellular automaton) got an editable timeline bolted on —
pause mid-growth, change conditions, resume; save a journey; replay it. Verdict: yes,
engaging. Two design lessons got recorded for the real app (the frozen-history timeline model
works; replay honesty must be designed in from day one). Then the toy was **archived with a
freeze notice** — deliberately, so a quick hack can't quietly become the architecture.

### Phase 2a — Build the machinery, prove it's perfect, then trust it (the plate)

Rule for this phase: **never physics ahead of machinery**. First build and verify the
honeycomb world with Gravner–Griffeath's published rules exactly — because when the physics
misbehaves later, you need to know the ground it stands on is solid. A physics bug on top of
an unproven lattice is two bugs wearing one coat.

Built and tested: the lattice with its 6+2 neighbor bookkeeping; diffusion with a
mass-conservation test (vapor may not silently leak — over a full run, total mass drifted by
about 2 parts in 10 trillion, essentially rounding dust); then the full G-G cycle, growing
from a tiny seed.

The gate: grow a sixfold-symmetric hexagonal plate with symmetry error **exactly zero** —
not approximately, *exactly* — checked every step of a 4,800-step run by an automated metric.

Two war stories from this phase set the tone for everything after:

- **The box that couldn't be perfect.** The plate kept failing perfect symmetry, and the
  natural suspicion was an indexing bug. The real cause was geometry: a rectangular
  simulation box *cannot* host exact sixfold symmetry — its corners and walls sit at
  different distances in different directions, and the crystal feels it. Fix: carve a
  hexagonal-prism-shaped world out of the box. A "negative control" test now pins this
  forever: the same gate deliberately run in a box, asserting that it *fails*.
- **The seed erratum.** The paper describes the starting seed as 20 cells. Count them
  yourself on the honeycomb: it's **19**. The paper is simply wrong by one. This tiny catch
  is a warning label the repo carries permanently ("do not 'fix' it back to 20"), and it was
  a preview: read sources critically, because print can be wrong. That instinct pays off big
  in Phase 6.

Also from day one: dump pictures of the vapor field every run — because a malformed crystal
can look plausibly organic, but a malformed *field* is obvious at a glance.

### Phase 2b — Install the physics (the hard part, and a beautiful failure)

Now the real surgery: replace the attachment thresholds with Libbrecht's source-cited kinetics.
Two documents had to exist *before* any code, by explicit decision:

- **The parameter record.** Source-derived inputs — `sigma_0(T)`, `A(T)` for basal and
  prism, the speed limit `v_kin(T)`, and diffusion `D(T, P)` — carry page citations, units,
  and a provenance grade. P1 is a directly adopted authoritative source quantity: measured or
  source-tabulated empirical input, or exact metrological definition;
  P2 is fitted, model-inferred, project-derived, or figure-digitized; P3 marks the Nakaya-informed exact M1 dip functions and
  placement. Interpolation and other numerical/discretization choices are separately
  registered as P4 rather than presented as paper-backed physics. The P3 label marks a
  Nakaya comparison as in-sample rather than independently validated. One trap the table
  guards in writing: sources quote `sigma_0` sometimes as a percent, sometimes as a fraction
  — mix them up and your exponential is wrong by a factor of 100.
- **The seam spec.** G-G attaches cells in a binary flip; Libbrecht's law gives a smooth
  growth *speed*. Converting a speed into honest cell-flips is the actual engineering
  problem. The design: each surface cell accumulates a "fill fraction" at the physical rate;
  at fill = 1, it becomes ice. With bookkeeping so strict it's an accounting identity —
  placed ice + recorded leftover must equal computed demand, every step, checked by tests.

Then the first pre-registered experiment in the project's history. **Protocol v3**: grow at
−5 °C and at −15 °C, changing *nothing but temperature* — do two different habits emerge?
The thresholds for "plate" and "column" were written down and committed *before* running.

**v3 failed.** Both temperatures produced the *same* one-layer plate. Temperature did almost
nothing. And here's where the project's culture shows: the result was recorded as a
legitimate negative — not deleted, not rerun-until-it-works. *Then* the autopsy: a
line-by-line audit against the monograph found the surface-classification code had
misassigned which cell configurations count as basal, prism, and rough — traceable to
ambiguous (and, it turns out, partly *typo'd*) labels in the book itself. The fix became a
new versioned policy under a formal decision record; the failed version was preserved,
unchanged, as history.

**v4 failed differently — and more interestingly.** The warm run passed, but the cold run
ground to a halt: the solver demanded the vapor field settle to a tolerance of 1 part in
10 million, and the field refused, plateauing forever just above the line. Diagnosis, after
genuine numerical detective work: the leftover wasn't physics at all — it was **the dust of
floating-point arithmetic itself**. Computers store numbers with ~16 digits; every addition
rounds; the accumulated rounding in one smoothing step created a phantom imbalance of about
1e-13 — irrelevant physically, but fatal to a checker demanding better. The fix (v5): *meter
the rounding dust directly* and include it in the balance check, with a strict independent
bound on how big it's allowed to be so real leaks can't hide in it. Balancing the checkbook
to the penny — by explicitly tracking the pennies lost under the couch, and proving they're
couch-sized.

Then a comedy beat: the v5 run was killed near the finish line by an accidental host
shutdown. Rather than trust a partial result, the pair was rerun from scratch as two parallel
processes (v5p).

**And then it worked.** One flagless run, all criteria enforced, temperature the *only*
difference:

- **−5 °C → a plate.** Aspect ratio 0.12 (twelve times wider than tall).
- **−15 °C → a column.** Aspect ratio 12.2 (twelve times taller than wide).

Same code, same seed, same everything — a hundredfold shape flip from temperature alone,
with perfect symmetry and every registered numerical check green. Temperature was an
explicit physical input to this source-parameterized run; this gate did not independently
validate the parameterization against nature.

One more thing. Sharp readers should check that historical pair against Part 1: its −5 °C
plate and −15 °C column labels are opposite the corresponding Nakaya labels. That scoped
result is neither a universal prediction nor, by itself, proof for or against an
implementation defect. It becomes one of the scientific questions Phase 6 examines.

### Phase 3 — Make the invisible visible (and then distrust your eyes)

The 3D instrument: the crystal rendered as its actual honeycomb cells, orbit camera, color
overlays painting the surface with growth propensity, and the signature feature — a
**draggable slice plane** through the vapor field, showing the shortage as color. You can
watch the Berg effect happen: the face centers dimming with starvation while the corners
stay bright.

But the gate for this phase wasn't "the visualization looks right" — the project doesn't
accept looks. The gate was the *physics claim behind the picture*, measured: an automated
center-vs-rim metric confirming facet centers genuinely starve. Result: center fuel level
about **0.53×** the rim's (median over the run), with 90% of samples showing starvation.
The pretty picture and the hard number agree; the number is the evidence, the picture is the
explanation. And the same views double as the developer's debugging instrument — the rare
case where the debug tool and the killer feature are the same artifact.

### Phase 4 — The obstacle course (prove the machinery can express everything)

Before porting to GPU, prove the whole system can express and *detect* every target
behavior. A gauntlet, run twice: **Pass A** with the G-G control rule — *blocking*, because
it certifies the machinery and the measurement pipeline with no physics excuses available —
and **Pass B** with the Libbrecht physics — *diagnostic*, an early scouting report.

Pass A, all 24 checks green:

- plate and column from the same solver (parameter change only), aspect ratio inverts;
- a **continuous** plate-to-column transition — sweep one knob through five values, aspect
  ratio climbs strictly monotonically (no chaos in between);
- facet-center starvation visible and measured on a widening column;
- **hollowing emerges** — hollowness index rises from field dynamics alone, reproducibly
  across seeds, with zero hollow-making code (the emergence claim, now regression-tested);
- **the timeline works**: change the environment mid-growth, column conditions then plate
  conditions, and get a **capped column** — a column wearing plate hats, a shape you can
  find in real snow photographs. The diary-of-the-journey concept, demonstrated end to end;
- dendrites branch at high fuel (6 branches) while the matched low-fuel control stays
  compact (0).

Pass B ran validly and delivered its honest scouting report: 3 of 8 morphology diagnostics
pass under the physics rule, 5 miss. Not a blocker — a preview of what Phase 6 exists to
test properly.

War story: the original branching experiment was designed with a control condition that
turned out to be *impossible to satisfy* — its stopping rule could never trigger. Discovered
honestly when a full evidence run burned hours and then failed by name. The redesign went
through a formal decision record, and the broken protocol stayed on the books as immutable
failed history. (Also in this phase, the review process got genuinely adversarial: reviewers
tried to *forge* evidence — fake timelines, junction-aliased output directories, hard-link
swaps — and every hole they found got closed with a named test. Paranoid? The project's
product *is* trustworthy claims; the paranoia is the feature.)

### Phase 5 — Port it to the GPU (a different kind of hard)

The CPU oracle is meticulous and slow. Interactivity needs the GPU — thousands of tiny
processors updating cells in parallel in the browser (WebGPU). The port is treacherous in
quiet ways: GPUs use lower-precision arithmetic (float32 vs the oracle's float64), drivers
recompile your math, and Windows literally kills any GPU job running longer than ~2 seconds
(so all work must be chopped into bounded dispatches). The governing rule: **never port ahead
of the oracle** — every GPU stage must reproduce the CPU truth within pre-registered
tolerances on identical seeds before the next stage starts.

Best war story of the phase: deep in the port, the cold test case started... *breathing*. The
GPU field wouldn't settle to a fixed point; it oscillated forever between two states, in
**exactly two cells**, by **exactly one unit in the last binary digit** — the smallest
possible flicker a float32 can express. Not a bug in anyone's code: at that precision, the
true fixed point falls *between* two representable numbers, and the solver alternates
eternally between its nearest neighbors. The protocol was amended (decision record, of
course) to classify a *strictly bounded* period-two orbit as converged — with tight guards so
only that one phenomenon qualifies and a genuine oscillation still fails.

The phase closed with the gate: **16 of 16 criteria**, GPU agreeing with the oracle within
tolerance on the real hardware (Windows, RTX 3080), the ~8-million-cell preview grid
**interactively editable** — a parameter edit acknowledged in ~10 ms, first updated frame in
~0.3 s — with an audit trail of 2,715 checked GPU readbacks and zero forbidden shortcuts.

Phase 6 now has two separate compute obligations. The float64 CPU oracle carries the replacement
production and numerical-convergence campaigns. The charter also requires hundreds of automated
runs at the preview-resolution GPU budget, with a binary32 error envelope and CPU comparison. The
historical small-grid timing and tolerance probes do not replace that GPU clause; the cohort remains
open.

### Phase 6 — The exam (in progress)

Everything so far was building and verifying the instrument. Phase 6 points it at nature:
sweep temperature from −2 to −35 °C and humidity across the whole range, auto-classify the
habit at every grid point, and lay the model's morphology diagram next to Nakaya's. **The
model's report card.**

The defining rule is **pre-registration**. Every outcome-sensitive choice is versioned before a
campaign. A post-freeze correction needs a decision record, a new protocol identity, and a full
rerun; old bytes keep their old identity. This does not make quiet tuning impossible. It makes
authorized edits auditable and gives reviewers artifacts against which undisclosed drift can be
detected.

Preparing the exam room turned into a scientific story of its own. Four discoveries:

**1. The crystal that grew a flaw — one addition at a time.** A calibration run reported a
tiny but *nonzero* symmetry error, with noise off. Should be impossible. The cause is the
kind of thing that makes numerical people grin: when the code summed each cell's
opposite-neighbor vapor values, it added them **in lattice order** — and a 60° rotation
visits those neighbors in a *different* order. Computer addition rounds, so order changes
the last digit: (a+b)+c can differ from (b+c)+a by one part in 10^16. Two cells that should
be perfect mirror images computed the *same* values in *different orders*, differing by one
ulp — and growth **amplified** that dust, step by step, until one arm of the crystal
attached a cell one step before its five siblings. Fix: sum in a fixed sorted order, making
the result depend only on *which* values (the multiset), not the visiting order. And the
verification is satisfying: the corrected version reproduces the scoped accepted Phase 2b
cases **digit for digit**. That establishes bit-identical outputs for those cases while the
summation order changed; it is not a theorem about every configuration.

**2. The book is wrong (Equation 3.35).** Building an independent accuracy anchor — an
exact 1D spherical solution to check the 3D solver against — meant transcribing formulas
from the monograph. One didn't behave. Equation 3.35 (the correction for a finite outer
boundary) disagreed with the project's derivation and with the form Libbrecht printed in a
2013 paper cited by the book; the denominator uses a different symbol in the monograph.
That one-symbol inconsistency matters (the erratum email is drafted, pending the maker's
send). The consequence is not cosmetic: the corrected form says finite
simulation boxes bias growth far more than the printed form implies — up to ~160% under
some of this project's own earlier configurations. Which forced...

**3. Walls that pretend to be sky.** Every simulation lives in a finite box, but a real
crystal grows under an effectively infinite sky. Holding the box walls at fixed fuel level
("Dirichlet") oversupplied the smaller sampled case: the same crystal grown the same number
of steps came out **291 cells** in a small domain vs **279** in a bigger one. The project
then implemented the monograph's monopole idea: make the walls impersonate infinite sky by
setting each wall cell from the crystal's current sink estimate. The matched sampled answers
were **231 cells in both domains**. That demonstrates removal of the observed domain difference
for those two sampled answers only; it does not prove wall independence across sizes, shapes,
or parameters. The reviewed source set did not contain this exact check, but that is a scoped
search result rather than a universal implementation or priority claim.

**4. The convergence studies — including two transfer traps.** The first domain ladder ran at the
wrong crystal size and reversed when repeated at the historical registered size. R15 then showed
that even that repair did not generalize: N = 48 and N = 64 each failed three of four registered
domain checks. The spacing ladder also changed the represented physical geometry while changing
cell size, so its extrapolated limit is withdrawn. The replacement protocol must compose fixed-
physical-size grid, timestep, and domain controls at the exact configuration they govern.

**Where it stands.** Two historical 204-row forward campaigns measured poor Nakaya agreement: CAK
3/90 and M1 54/90 under their measured-only scoring. That failure is accepted, but Phase 6 is not
complete. R15's numerical controls, corrected parameter-table freeze, matched M1/no-dip ablation,
preview-budget GPU cohort, and held-out obligations remain open. The old analytic plate/column
forecast is retracted: same-field coefficient order is not coupled morphology, and CAK→M1 changes
too many inputs to isolate the dip factors.

Published model-dependent inversions of narrow-facet growth observations support approximate
barrier-reduction regions near −4 °C and −14 °C. The exact M1 functions and placement remain
Nakaya-informed and in-sample. The science-first ending is therefore not predetermined: run the
matched forward ablation and report what the artifacts say, including another negative result.

(And whichever way the exam lands: Phase 2a's control rule still grows a beautiful crystal,
and Phase 7 still builds the instrument around it. The product doesn't die if the physics
result is negative — the honesty labels just keep telling the truth.)

---

## Appendix A — Ten-second glossary

- **Deposition** — vapor becoming ice directly, molecule by molecule; how snowflakes grow.
- **Basal / prism facets** — the coin-faces (top/bottom) vs pencil-sides of the hexagonal
  crystal. Their growth race decides plate vs column.
- **Habit** — a crystal's overall shape family (plate, column, needle, dendrite).
- **Nakaya diagram** — the qualitative map, developed from experiments beginning in the
  1930s, of which habit grows at which temperature and humidity; explaining its alternating
  plate/column regions remains an active modeling problem.
- **Supersaturation (sigma)** — the fuel gauge: how much excess vapor the air holds beyond
  its comfortable limit.
- **Diffusion** — vapor's slow, staggering delivery through air; creates the shortage that
  makes tips win and centers starve.
- **Berg effect** — face centers starve because their own edges intercept the supply;
  source of hollowing.
- **Attachment coefficient (`alphaHK`)** — stickiness, 0 to 1: the fraction of arriving
  molecules that actually stay. Different for basal and prism, changing with temperature
  and fuel; the heart of the mystery.
- **SDAK** — width-dependent attachment kinetics. Model-dependent inversions of narrow-facet
  observations support approximate barrier-reduction regions, while dip widths and depths
  remain poorly constrained and the exact M1 prescription is Nakaya-informed P3/in-sample.
  The implemented M1 is an everywhere-narrow approximation, not the full width-feedback
  closure; numerical mappings remain P4.
- **Lattice / mesoscopic** — the honeycomb LEGO world; each cell stands for trillions of
  molecules, not one.
- **Oracle** — the slow float64 CPU solver kept forever as the numerical comparison reference. It is
  not physical ground truth; Phase 6 tests whether the model itself agrees with observations.
- **Pre-registration** — sealed-envelope science: freeze every choice before running, so a
  match means something and a miss is a result.
- **Ulp** — a float's last binary digit; the dust grain that broke the crystal's symmetry
  and taught the project about addition order.

## Appendix B — Video-flow seeds (raw ore, not a script)

Themes with legs, in rough narrative order:

1. **Cold open:** "The Nakaya diagram has mapped ice's alternating plate and column regions
   since the 1930s, but reproducing them quantitatively remains an active modeling problem.
   This computer is about to take the exam."
2. **The diary metaphor** carries Part 1; the capped column (Phase 4's timeline demo) is
   its on-screen payoff.
3. **Two-stage supply chain** (delivery vs bouncer) carries Part 2; the slice-plane
   starvation view is the money shot for "centers starve."
4. **The contrast between two source lineages** (G-G's 3-D engine has no physical
   temperature input; Libbrecht's reviewed simulations are mainly reduced-geometry) sets up
   the project in one breath without a priority claim.
5. **Failure montage** carries Part 4: the box that couldn't be perfect → the seed the
   paper miscounted → v3's identical twins → v4's phantom pennies → the breathing GPU →
   the crystal that grew a flaw one addition at a time → the typo in the textbook. Each
   failure caught by a written rule, each fix on the record.
6. **The sealed envelope ending, updated:** the historical registered arms failed to reproduce the
   diagram under their executed protocol, and the envelope made that negative result reportable.
   Do not say the flip is universally backwards or that SDAK became load-bearing: the former
   crossing proof was wrong and CAK→M1 is not a causal ablation. The matched M1/no-dip arm and R15
   numerical/held-out work remain open, so the cliffhanger is the still-unanswered effect of the
   implemented dip factors within the frozen solver and the validation question—not nonexistent
   historical results. Even the matched intervention cannot establish physical SDAK causality or
   necessity in nature.
