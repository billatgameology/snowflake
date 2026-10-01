# CH01 — Claude animation prompts

Companion to [ch01-not-a-frozen-raindrop-script.md](ch01-not-a-frozen-raindrop-script.md).

**How to use:** for each animation, open a **fresh** Claude session and paste the **global
preamble** below followed by that animation's prompt block. Each pairing is fully
self-contained — Claude needs no repo access and no memory of other sessions. Ask for the
result as a single HTML file (or an Artifact), open it in a browser at fullscreen, and screen
record at 1080p60 in capture mode.

Every prompt states which script rows it feeds. Animation durations are ≥ their script
segment so the editor can trim, never stretch.

---

## Global preamble (paste first, every time)

```text
You are building one animation for an educational YouTube video about snow-crystal physics.
Deliver a SINGLE self-contained HTML file (inline CSS/JS, no external assets, fonts, or
libraries). It must:

- Render a 1920×1080 (16:9) canvas or SVG stage, scaled to fit the window, dark theme.
- Palette: background #0B1220; primary text #E8F1F8; muted text #8FA3B8; ICE (all ice,
  always) #9BE8FF; LIQUID water (droplets) #6FA8FF; VAPOUR (gas-phase dots) #C9D7E4 at low
  opacity; accent/warning #FFC66E; negation/strike #FF6B6B. Never swap the ice and liquid
  colours: ice is the pale cyan, liquid is the deeper blue, everywhere.
- Typography: system-ui stack. Minimum 30px for annotations, 44–60px for labels, up to 120px
  for hero words. Generous margins; nothing within 60px of the frame edge.
- A small persistent tag in the top-right corner reading "DIAGRAM" (24px, muted, all caps).
  It must be visible in capture mode.
- British spelling in all on-screen text ("vapour", "colour", "organise").
- Deterministic playback: use a small seeded PRNG (e.g. mulberry32 with a fixed seed you
  hard-code), never Math.random(), so every replay is frame-identical.
- A master timeline of fixed total duration (given per animation), driven by
  requestAnimationFrame against elapsed time. Start PAUSED at t=0.
- Controls at the bottom, outside the 16:9 stage: play/pause button, restart button, a
  scrubber showing seconds, and a "capture mode" toggle that hides all controls and the
  cursor. Keyboard: Space = play/pause, R = restart, C = capture mode.
- Smooth 60fps motion; ease in/out on entrances; nothing pops without at least 150ms of
  transition unless the beat is deliberately a hard cut (marked "HARD CUT" in the beat list).
- Text must never overlap other text or key artwork; hold every caption on screen at least
  2.5 seconds.

Scientific honesty rules (non-negotiable):
- Only the numbers explicitly given in the animation brief may appear on screen. Do not
  invent additional quantities, decimals, units, or statistics.
- Where the brief marks something "illustrative", render the exact caveat caption the brief
  provides, inside the frame, in muted text.
- Do not depict any photograph, published figure, or recognisable published illustration.
  Everything is original diagram artwork.
- Ice is always drawn with hexagonal geometry (regular hexagons or hexagonal prisms);
  liquid droplets are always circles.

After the style rules, the brief below defines the animation: its purpose, total duration,
and a beat list with timecodes. Follow the beat timings exactly — they are matched to a
recorded voiceover.
```

---

## A1 — The two factories (cold open)

**Feeds script rows 0:00–0:55.** Total duration **60 s** (acts 1–3; hold final frame to 60 s).

```text
BRIEF — "The two factories" (cold open, 60 seconds)

Purpose: kill the belief that a snowflake is frozen rain, in the first 12 seconds, then
promise the video. The frame must already be in motion at t=0.

Act 1 (0:00–0:12) — SLEET.
- At t=0 a liquid raindrop (LIQUID colour, teardrop-to-circle) is already falling down the
  left-centre of frame. Mid-fall it ices over: colour shifts toward a dull grey-cyan, the
  outline turns irregular and lumpy — NOT hexagonal, this is the one ice object in the video
  drawn without hexagonal geometry, because that is the point.
- It lands at the bottom with a heavy, dead settle (two small bounces, then still).
- HARD CUT label at the moment of landing: "SLEET" (60px) beside the bead.

Act 2 (0:12–0:30) — THE OTHER FACTORY.
- The sleet bead slides to frame-left and desaturates.
- On frame-right, faint VAPOUR dots drift in from all sides and attach one by one to a
  growing six-branched crystal outline (ICE colour), visibly under construction — branches
  extend in small increments as dots arrive. Keep it obviously mid-growth, never finished.
- No caption in this act. The contrast carries it.

Act 3 (0:30–0:55) — CONTENTS.
- The growing crystal continues behind a left-aligned contents stack that types on, one line
  every ~5 seconds, 44px:
    WHAT IT IS
    WHAT IT'S MADE FROM
    NOTHING FREEZES AT ZERO
    NOBODY DESIGNED IT
- The crystal keeps gaining branch detail the whole time. End: hold frame.

Do not show a finished, perfect, static snowflake anywhere in this animation.
```

---

## A2 — One crystal or a thousand

**Feeds script rows 0:55–2:54.** Total duration **125 s**, four acts.

```text
BRIEF — "One crystal or a thousand" (125 seconds)

Purpose: separate "snow crystal" (a single crystal of ice) from "snowflake" (a loose weather
word that includes multi-crystal clumps), then land that shape depends on temperature.

Act 1 (0:00–0:26) — WHAT ACTUALLY FALLS.
- A dark-sleeve backdrop (near-black, slight fabric vignette). Mixed snowfall drifts down
  slowly: exactly one six-pointed star outline, several stubby splinters, a few
  pencil-shaped hexagonal columns (hexagon cross-section visible), and some irregular grey
  clumps. All ICE colour except clumps, which are muted.
- As each type crosses centre-frame it gets a passing 30px label: "star", "splinter",
  "column", "clump". Labels fade with the object.

Act 2 (0:26–0:52) — THE INSIDE SHOWING THROUGH.
- Zoom continuously into one falling hexagonal plate until a molecular lattice resolves: a
  repeating honeycomb array of dots (ICE colour), perfectly regular, filling the frame.
- Pull back out in one continuous move; as the outline reappears, briefly overlay thin
  guide lines showing the hexagon's six edges aligned with the lattice rows.
- Caption (44px, held 4 s): "the inside, showing through".

Act 3 (0:52–1:39) — THE PUFFBALL.
- Return to the snowfall, now mild and sticky: falling hexagons that touch now fuse and
  fall on together. Clumps grow. Single crystals are drawn as ICE outlines; fused
  aggregates get a translucent ICE fill so clumps read as filled shapes.
- Persistent counter, top-left, 36px: "crystals in the biggest clump: N" (integer, updates
  live, driven by the actual simulation).
- At ~1:15, freeze the largest clump centre-frame, dim everything else. One by one its
  member hexagons flash a clean individual outline (each one perfect), then the whole
  clump's lumpy silhouette pulses in muted grey.
- Caption (44px, held 4 s): "a clump is just a clump".
- Small legend, bottom-left: outline hexagon = "single snow crystal"; filled = "aggregate
  snowflake".

Act 4 (1:39–2:05, then hold to 2:05/end) — TEN DEGREES.
- HARD CUT to a split screen, thin vertical divider.
  Left panel label (60px): "−15 °C" — a thin six-pointed stellar outline grows.
  Right panel label (60px): "−5 °C" — a stubby hexagonal column grows (shown in slight
  3-D so its hexagonal cross-section and its length both read).
- Both grow from small seeds simultaneously over ~15 s.
- Caption across the bottom (44px): "ten degrees changes everything".

The only temperatures allowed on screen are −15 °C and −5 °C. The clump counter is this
animation's own tally, not a measurement — keep it an integer count of drawn shapes.
```

---

## A3 — Three factories

**Feeds script rows 2:54–4:36.** Total duration **105 s**, four acts.

```text
BRIEF — "Three factories" (105 seconds)

Purpose: show deposition (gas → solid, one molecule at a time), the seed exception, rime,
and graupel, ending in a three-way recap.

Act 1 (0:00–0:37) — DEPOSITION.
- Extreme close-up of a growing ice edge along the bottom third: a honeycomb lattice of
  ICE dots with a stepped, growing top edge.
- VAPOUR dots wander in from above on jittery random walks (seeded). One at a time, a dot
  reaches the edge, snaps into the next lattice site, and changes to ICE colour with a
  small settle flash. Roughly one attachment per second early, accelerating slightly.
- Counter, top-right, 36px: "molecules attached: N".
- At 0:25, stamp centre-top (60px): "GAS → SOLID = DEPOSITION". Under the arrow, the word
  "liquid" appears in muted text and is immediately struck through with the negation
  colour. Keep the stamp on for the rest of the act.

Act 2 (0:37–1:06) — THE SEED.
- Pull back in one continuous move from the edge to a whole branched crystal.
- Push toward its exact centre; everything else dims. A tiny circle at the centre
  highlights in LIQUID colour, then converts to ICE.
- Caption (44px, two lines, held 5 s): "the seed — the only part that was ever liquid"
  / "≈ 1 part in 100,000 of the finished object".

Act 3 (1:06–1:28) — RIME AND GRAUPEL.
- A hexagonal plate outline traverses the frame left to right through a field of LIQUID
  droplets. Droplets it touches stick where they land and instantly convert to tiny ICE
  beads sitting proud of the outline — beads, not lattice growth.
- Label as beads accumulate (44px): "RIME".
- The plate loops back across the field twice more; beads pile up until the hexagonal
  outline is completely hidden inside a lumpy ball of beads.
- Label change (44px): "GRAUPEL — soft hail".

Act 4 (1:28–1:45, hold to end) — THE RECAP.
- Three columns assemble: "SLEET" / "RIME" / "SNOW CRYSTAL". Each column: a small looping
  micro-diagram (sleet: drop freezing to lump; rime: beads pelting an outline; snow
  crystal: dots attaching to a lattice edge) and one line beneath:
    SLEET — "was entirely liquid"
    RIME — "the beads were liquid"
    SNOW CRYSTAL — "only the seed — the rest arrived as gas"

The only number allowed on screen is the 1-in-100,000 caption in act 2. The attachment
counter is a tally of drawn events, not a measurement.
```

---

## A4 — Failing to sink

**Feeds script rows 4:36–5:58.** Total duration **85 s**, three acts.

```text
BRIEF — "Failing to sink" (85 seconds)

Purpose: where a cloud's raw material comes from — lifted air crosses the dew point,
supersaturates, condenses onto dust — and why a cloud stays up.

Act 1 (0:00–0:37) — THE RISING PARCEL.
- A rounded-rectangle "parcel" of air containing faint VAPOUR dots rises slowly from the
  bottom of frame. As it rises it expands (grows ~40 % linearly) and a temperature readout
  attached to it counts smoothly downward (no numeric values shown — draw the readout as a
  small unlabelled falling bar/needle, because the brief gives no temperatures for this
  act).
- A horizontal dashed line across the upper third, labelled (44px): "dew point".
- When the parcel crosses the line, a fraction of its VAPOUR dots begin to glow in the
  accent colour.
- Caption card at 0:22, held 8 s (44px, two lines): "SUPERSATURATED" / "= carrying spare
  vapour — more than it can hold on to". The glowing dots are the "spare" ones.

Act 2 (0:37–1:00) — DUST BECOMES DROPLETS.
- Inside the parcel, scatter ~20 tiny dark specks ("dust"). The glowing spare dots stream
  onto the specks; each speck grows a LIQUID circular shell around itself until the parcel
  is a field of droplets (LIQUID colour) with a barely-visible dark speck at each centre.
- Caption (44px, held 4 s): "a cloud = liquid droplets, not vapour".

Act 3 (1:00–1:25, hold to end) — SCALE, THEN THE PUNCHLINE.
- Split the frame. Left: a scale comparison drawn honestly — a stellar-crystal outline
  labelled "4 mm tip to tip" spanning ~800 px, and beside it a droplet drawn to relative
  scale (it will be a barely-visible dot of 2–4 px), labelled "a cloud droplet, 10–20
  microns". Add the line (30px, muted): "a couple of hundred droplet-widths across".
- Right: a raindrop (large LIQUID circle) and a cloud droplet (tiny LIQUID dot) released
  from the same height at the same moment. The raindrop falls fast and exits; the droplet
  descends almost imperceptibly, visibly jittering in the air.
- Caption (60px, held 5 s): "failing to sink".

Numbers allowed on screen: "4 mm", "10–20 microns", "a couple of hundred droplet-widths".
No other quantities, no fall speeds, no altitudes, no temperatures.
```

---

## A5 — Supercooling roulette

**Feeds script rows 5:58–7:57.** Total duration **120 s**, four acts.

```text
BRIEF — "Supercooling roulette" (120 seconds)

Purpose: nothing freezes at 0 °C; droplets supercool and freeze one by one across an
enormous range, decided by the speck inside each; the speck then retires from the story.

Stage: sixty LIQUID droplets in a 10×6 grid, upper two-thirds. A large temperature readout,
top-centre, 60px, e.g. "0.0 °C", counting smoothly downward when the sweep runs. A
histogram strip along the bottom (x-axis 0 to −40 °C, marked every −5): bars fill as
droplets freeze in each 2 °C bin.

Freezing model (deterministic, seeded): assign the sixty droplets fixed thresholds —
one at −2.0 (labelled "bacterial protein"), one at −4.0 (labelled "silver iodide"),
46 clustered roughly bell-shaped around −10 (between −5.2 and −19), 8 stragglers between
−20 and −33, one at −37.6, and one labelled "no speck: pure water (nearly −40 °C)" placed
near −38.8 with NO numeric value ever shown for it beyond the words "nearly −40 °C".
A droplet freezes the moment the readout passes its threshold: it pops from a LIQUID
circle to an ICE hexagon with a brief flash.

Act 1 (0:00–0:36) — ZERO IS NOT A TRIGGER.
- Readout slides +5 → 0 °C over 8 s. At 0 °C everything holds still for a long beat.
  Caption (44px, held 4 s): "0 °C: nothing happens".
- Readout continues to −3 °C. All sixty droplets remain liquid, shimmering slightly.
- Caption (44px, two lines, held 6 s): "SUPERCOOLED" / "= liquid below freezing, and
  staying that way". Pause the sweep at −3 °C at act end.

Act 2 (0:36–1:23) — WHY: NUCLEATION.
- Inset panel over the grid: inside one droplet, molecular dots jitter; against the
  surface of its dark speck they briefly line into a small ordered honeycomb patch that
  dissolves, re-forms, dissolves. Caption (44px): "freezing needs a starting point —
  nucleation".
- Close inset. Highlight the four labelled droplets in place with connector lines and
  30px labels: "no speck: pure water (nearly −40 °C)", "silver iodide (−4 °C)",
  "bacterial protein (−2 °C)", plus one ordinary droplet labelled "ordinary dust
  (≈ −10 °C)".

Act 3 (1:23–1:50) — THE SWEEP.
- Resume the sweep: −3 → −40 °C over ~22 s. Droplets pop one by one per their
  thresholds; the histogram fills live.
- Mark on the histogram axis, as each is passed, in 30px: "some freeze below −5 °C",
  "most near −10 °C", "a hearty few past −20 °C", "all are ice by −40 °C".
- Permanent in-frame caption (30px, muted, from act start to end of animation):
  "spread illustrative — only the marked temperatures come from the source".

Act 4 (1:50–2:00, hold to end) — THE SPECK RETIRES.
- Push into one frozen hexagon: at its centre the dark speck sits entombed, tiny,
  surrounded by clean hexagonal lattice.
- Caption (44px, held to end): "the speck picks the moment, not the shape".

Numbers allowed on screen: the running readout, the axis marks, −2 °C, −4 °C, ≈ −10 °C,
"nearly −40 °C", and the four quoted anchor phrases. Never print a numeric threshold for
the pure-water droplet.
```

---

## A6 — Facing up

**Feeds script rows 7:57–8:53.** Total duration **60 s**, three acts.

```text
BRIEF — "Facing up" (60 seconds)

Purpose: the first frozen droplet tidies itself into a faceted hexagonal prism because
rough patches catch molecules and smooth faces don't; name the two facet types; show that
column and plate are the same solid stretched or squashed.

Act 1 (0:00–0:17) — ONE FROZEN, AMONG LIQUID.
- A field of LIQUID droplets; one at centre pops to a small ICE hexagon (flash). Its
  neighbours shimmer on, unchanged. Everything then quietens.
- Caption (44px, held 3 s): "one frozen. now what?"

Act 2 (0:17–0:43) — ROUGH STICKS, SMOOTH DOESN'T.
- Zoom to the new ice: draw it as a hexagon with a deliberately bumpy, irregular outline.
- VAPOUR dots arrive on seeded walks. Dots that meet a bump stick (flash, become ICE);
  dots that meet a flat stretch bounce away with a small deflection arc. Make the two
  outcomes visually unmistakable; roughly four sticks per bounce.
- The bumps visibly fill in one by one; when the last fills, the outline SNAPS to a clean
  regular hexagon (150 ms).
- HARD CUT to a 3-D hexagonal prism rotating slowly about a tilted axis. Leader-line
  labels (44px): "BASAL FACETS — the two flat ends", "PRISM FACETS — the six flat sides".

Act 3 (0:43–1:00, hold final) — ONE SOLID.
- The prism morphs smoothly: elongates to a pencil-proportioned column — label "COLUMN"
  (60px); returns; flattens to a thin plate — label "PLATE" (60px).
- Caption (44px, held to end): "one solid, every crystal".

No numbers on screen anywhere in this animation.
```

---

## A7 — The corner's head start

**Feeds script row 8:53–9:22.** Total duration **35 s**, one continuous act.

```text
BRIEF — "The corner's head start" (35 seconds)

Purpose: the branching instability — corners stick out into the vapour, catch more, grow
faster, stick out further. The shape supplies its own head start.

- A regular hexagonal plate (ICE) sits centre-left in a faint haze of VAPOUR dots.
- Draw the local vapour supply honestly as flux: many faint streamlines/arrows drifting
  toward the crystal, visibly crowding at the six corners and sparse at the flat edge
  midpoints.
- Over ~20 s, each corner bulges, the bulge catches even more streamlines, and the bulges
  extend into six growing arms. The feedback must be visible as an accelerating loop, not
  a linear stretch: growth increments per second increase for the parts sticking
  furthest out.
- Centre-right, a small circular three-node loop diagram draws itself and then cycles a
  highlight around its arrows for the rest of the animation (30px node labels):
  "sticks out further" → "catches more vapour" → "grows faster" → back.
- At 0:25 stamp (60px): "BRANCHING INSTABILITY".
- Closing caption (44px, held to end): "the shape supplies its own head start".

No numbers on screen. All six arms must grow identically and simultaneously (use exact
six-fold symmetry in the code: compute one arm, replicate by rotation).
```

---

## A8 — The one-way robbery

**Feeds script rows 9:22–10:17.** Total duration **60 s**, two acts.

```text
BRIEF — "The one-way robbery" (60 seconds)

Purpose: ice out-competes liquid for the same vapour because ice holds its molecules more
tightly; then the full 100,000-droplet relay that builds one crystal.

Act 1 (0:00–0:32) — THE UNEVEN DUEL.
- One shared air parcel outline. Inside, left: a LIQUID droplet (circle). Right: a small
  ICE hexagon. Between and around them, VAPOUR dots.
- Both objects continuously emit and receive dots. Draw rates honestly and unmistakably:
  the droplet's outgoing stream is denser than its incoming; the hexagon's incoming is
  denser than its outgoing. Over the act, the droplet's radius shrinks steadily; the
  hexagon grows.
- Caption at 0:08 (44px, held 5 s): "ice holds on tighter".
- Caption at 0:22 (44px, held 5 s): "the droplet loses. every time."

Act 2 (0:32–1:00, hold final) — THE BUDGET.
- HARD CUT to wide shot: a small ICE hexagon at centre, ~200 LIQUID dots scattered around
  it (avoid a clear ring; irregular field).
- Legend, bottom-left (30px): "1 dot = 500 droplets".
- The crystal grows continuously — hexagon first, then six arms breaking out (reuse exact
  six-fold replication). Droplets are consumed nearest-first: each fades as a thin
  dashed stream of VAPOUR dots hands its material inward to the crystal.
- Counter, top-centre, 60px: "droplets consumed: N of 100,000" counting up as dots fade
  (N = dots consumed × 500, rounded to hundreds).
- Across the bottom, a persistent three-step path diagram with the active stage
  highlighted as material flows: "LIQUID → GAS → ICE".
- End state: droplet field almost gone, one large branched crystal, counter at
  "100,000 of 100,000". Hold.

Numbers allowed on screen: the counter, "1 dot = 500 droplets", "100,000". Nothing else.
Timing is illustrative — do not put any time units on screen.
```

---

## A9 — Too cold to snow

**Feeds script rows 10:17–11:21.** Total duration **70 s**, three acts.

```text
BRIEF — "Too cold to snow" (70 seconds)

Purpose: snowfall is fed by supercooled liquid, not by cold; follow a cloud down the
thermometer until it runs out of fuel near −20 °C.

Stage: left third — a vertical thermometer, marked 0, −5, −10, −15, −20, −25 °C, with a
descending indicator. Centre — a cloud outline containing a mixed population: LIQUID
droplets and ICE hexagons, with live counts displayed as two labelled bars ("liquid
droplets", "ice crystals") — bars only, no numeric values. Right — gentle falling snow
whose density tracks the ice-growth activity. Top-right corner: a fuel gauge whose tank
icon is a droplet.

Act 1 (0:00–0:15) — THE CLAIM.
- Before the descent starts, caption card (60px, held 5 s): "snow runs on liquid water".
- The gauge shows full; the thermometer sits at 0 °C.

Act 2 (0:15–0:50) — DOWN THE THERMOMETER.
- The indicator descends smoothly 0 → −25 °C over the act.
- Above −5 °C: droplets dominate, almost no hexagons, right-side snowfall sparse.
- Passing below −5 °C: droplets convert to hexagons in large numbers; snowfall on the
  right thickens markedly. Highlight the −5…−20 band on the thermometer and label it
  (44px): "snowfall window".
- Approaching −20 °C: the liquid bar drains fast. Show both exits honestly: some droplets
  pop to hexagons (freeze), many shrink away to nothing (evaporate). The fuel gauge falls
  with the liquid bar.
- Caption at the −20 °C crossing (44px, held 4 s): "some froze. many evaporated."

Act 3 (0:50–1:10, hold final) — EMPTY.
- Below −20 °C: liquid bar at essentially zero, gauge on empty, right-side snowfall thins
  to nothing even as the thermometer keeps falling.
- Closing caption (44px, two lines, held to end): ""too cold to snow"" / "= out of fuel,
  not out of cold".

Temperatures allowed on screen: the thermometer scale and −5 / −20 in the band label.
The population bars are illustrative proportions — never attach numbers to them.
```

---

## A10 — No blueprint

**Feeds script rows 11:21–12:04.** Total duration **45 s**, two acts.

```text
BRIEF — "No blueprint" (45 seconds)

Purpose: nobody designs a snowflake — the information is stored nowhere. Contrast
subtractive human making (needs the answer in advance) with additive natural growth.

Act 1 (0:00–0:20) — WHERE IS THE PLAN?
- A finished six-armed crystal outline rotates slowly at centre.
- Three probes fire in sequence: an arrow labelled "plan?" (44px) points to the ice, then
  to a cluster of LIQUID droplets, then to a cloud outline. Each time, the target pulses
  and a flat answer appears beside it (44px): "no."
- After the third "no.", caption (44px, held 4 s): "the information is stored nowhere".

Act 2 (0:20–0:45, hold final) — CARVE VERSUS GROW.
- Split screen, thin divider. This must be an ORIGINAL composition — do not reproduce or
  echo any published cartoon of a snowflake workshop.
- Left panel: a plain rectangular block; a chisel icon removes material in strokes,
  revealing a simple star shape. Pinned beside the block, a small framed diagram of that
  exact same star — the blueprint — with a connecting glance-line from chisel to
  blueprint before each stroke. Label (44px): "SUBTRACTIVE — needs the answer in
  advance".
- Right panel: a small hexagonal seed accretes VAPOUR dots and grows outward into a
  branched crystal. Beside it, an identical empty frame where the blueprint would hang —
  conspicuously blank. Label (44px): "ADDITIVE — no blueprint anywhere".
- Closing caption across both panels (44px, held to end): "the shape emerges as it
  grows".

No numbers on screen.
```

---

## A11 — The capped column

**Feeds script row 12:04–12:33.** Total duration **35 s**, one continuous act.

```text
BRIEF — "The capped column" (35 seconds)

Purpose: a crystal is a readable record of its history — a capped column is two designs in
sequence, and the join is the moment it changed altitude.

- Stage split: main area shows the crystal in 3-D-ish diagram form; a slim strip at the
  top shows an altitude/temperature context: two cloud layers, the lower marked "−5 °C",
  the upper marked "colder", with a small marker showing where the crystal currently is.
- 0:00–0:12: the marker sits in the "−5 °C" layer. A hexagonal column grows — the pencil
  shape elongating along its axis, hexagonal cross-section visible.
- 0:12–0:17: the marker drifts to the "colder" layer. The column stops elongating.
- 0:17–0:28: thin hexagonal plates sprout and widen from BOTH ends of the column
  simultaneously, forming the cotton-reel silhouette.
- 0:28–0:35 (hold final): everything stills. A leader line points to the junction where
  plate meets column on each end. Caption (44px, two lines, held to end): "the join is a
  timestamp" / "this line is the moment it moved".

Temperatures allowed on screen: "−5 °C" and the word "colder" — the source gives no number
for the second layer, so none may appear.
```

---

## A12 — Six arms, one weather report

**Feeds script rows 12:33–13:22.** Total duration **55 s**, two acts.

```text
BRIEF — "Six arms, one weather report" (55 seconds)

Purpose: complexity is written by changing conditions — demonstrated deliberately in the
lab — and six arms match because they share one history, not because they communicate.

Act 1 (0:00–0:24) — TURNING THE DIALS.
- Top of frame: two dials, labelled "TEMPERATURE" and "HUMIDITY" (44px), no numeric
  scales. Below: a growing six-armed schematic crystal (exact six-fold replication in
  code: compute one arm, rotate ×6). A timer, top-right, runs 0:00 → 45:00 fast (30px,
  labelled "elapsed").
- Three times during the act, one dial visibly turns; at each turn, the SAME new feature
  (a ring of side branches, a widening plate tip) appears on all six arms at the same
  instant.
- Caption after the second turn (44px, held 4 s): "the environment is the only input".

Act 2 (0:24–0:55, hold final) — ONE PATH, SIX COPIES.
- HARD CUT: wide cloud cross-section. The crystal (small) rides a wandering path across
  it. Beneath, a strip-chart scrolls, tracing conditions along the path (an unlabelled
  wiggling line — no axes, no units).
- Each distinct wiggle in the chart coincides with the same new ornament appearing
  simultaneously on all six arms. Draw connector flashes from chart wiggle to arm
  features the first two times so the causation is unmissable.
- At 0:38, a tempting alternative appears: thin dashed "signal" arcs between arm tips,
  as if the arms were coordinating. Hold 2 s, then strike the arcs through in the
  negation colour and collapse them. Caption (44px, held 3 s): "the arms never
  communicate".
- Closing caption (44px, two lines, held to end): "same ride, same diary" / "six copies".

The only number on screen is the 45:00 timer. The strip-chart must remain unlabelled —
it is illustrative history, not data.
```

---

## A13 — Two dials, one open door

**Feeds script rows 13:22–14:10.** Total duration **55 s**, two acts.

```text
BRIEF — "Two dials, one open door" (55 seconds)

Purpose: close the video — the whole system is two dials; the story told is settled
science; the one named open question is left standing, honestly.

Act 1 (0:00–0:29) — TWO DIALS.
- On black: two large dials, labelled (60px) "TEMPERATURE" and "SPARE VAPOUR", no numeric
  scales. Between them, a schematic crystal.
- As the dials turn (slow, deliberate), the crystal morphs between a thin plate and a
  stubby column and back. No new shapes — just the plate ↔ column axis.
- At 0:18, HARD CUT to the split panel from earlier: left "−15 °C" with the stellar
  outline, right "−5 °C" with the column. A large "WHY?" (120px, accent colour) fades in
  between the panels and stays. Do not answer it. Small caption beneath (30px, muted):
  "a long-standing puzzle".

Act 2 (0:29–0:55, hold final) — THE BADGE.
- HARD CUT to the badge beat: a stamp animation slams "SETTLED" (120px, ICE colour,
  boxed) centre-frame — this grades the story just told.
- Beside it, smaller, a door icon drawn ajar with light behind it, labelled (30px):
  "except the why — next".
- Fade up end-card layout: series title placeholder "SNOW CRYSTALS" (60px), next-episode
  slot "NEXT: FOUR HUNDRED YEARS OF LOOKING" (44px), and a subscribe affordance
  (simple outlined button shape, no platform logos).
- Hold to end.

Temperatures allowed on screen: −15 °C and −5 °C only.
```

---

## Coverage map

| Animation | Script rows | Segment |
|---|---|---|
| A1 | 0:00–0:55 | Cold open |
| A2 | 0:55–2:54 | Two words |
| A3 | 2:54–4:36 | Not a frozen raindrop |
| A4 | 4:36–5:58 | Where the raw material comes from |
| A5 | 5:58–7:57 | Nothing freezes at zero |
| A6 | 7:57–8:53 | Faceting |
| A7 | 8:53–9:22 | Branching instability |
| A8 | 9:22–10:17 | The relay and the 100,000 budget |
| A9 | 10:17–11:21 | Too cold to snow |
| A10 | 11:21–12:04 | No blueprint |
| A11 | 12:04–12:33 | The capped column |
| A12 | 12:33–13:22 | Six arms, one history |
| A13 | 13:22–14:10 | Two dials, badge, end card |

Every second of the script is covered by exactly one animation; hard cuts between
animations land on row boundaries.
