# E12 — What we know, and where it stops

English production draft and closing episode of the chapter 1–13 series: it revisits all eleven earlier episodes as one visible causal build on a single continuing crystal, states what is settled, what is a leading proposal and what is open, and opens the next story; narration not yet recorded; every drawing is an identified teaching schematic or a re-drawn scene from an earlier episode, and no drawing is a new measurement or an unreported simulation. Because its recap describes the repaired wording of the pending E10 and E11 revisions, E12 is recorded and promoted only together with, or after, those revisions; its release also requires the corrected Chapter 14 to be merged to main, deployed and verified at the public URL its footer links to.

## E12-01 — One drop, one crystal, one more time

### Narration

A small drop of cloud water hangs in cold air, with a tiny ice crystal a short distance away. As we watch, the drop shrinks and the ice grows, though the two never touch. Eleven episodes ago, that exchange was a puzzle.

We will keep coming back to this one crystal. Each investigation will leave its mark, and nothing it gains will be taken away.

Two questions stay with it to the end. How much of it can eleven investigations now explain? And where, exactly, does what we know stop?

### Visual and sources

Purpose: reopen on the series' first subject and make it the starting state of one continuing crystal that never resets, then pose the episode's two questions. After this beat the learner should be able to say what the episode will do (add each investigation's feature to one crystal) and what it will ask (how much is explained; where knowledge stops).

Prerequisites and depth: Episode 1's drop-and-crystal relay, recalled here only as a picture; its explanation returns in E12-02. No new term.

Evidence and limits: E12-owned Canvas2D teaching drawing, labelled "Teaching drawing · not to scale". It is not the Run B model recording that opened Episode 1, so no model key is shown. No WebGL in this scene.

Subject and focus: one drop (left) with a dashed outline of its earlier size; one small hexagonal plate (right of centre), called the E12 crystal from here on; a few white vapour dots in the gap between them.

Changed input → action → result: at "the drop shrinks", dots leave the drop and cross the gap → the drop's solid outline shrinks inside its dashed earlier outline while the crystal gains a thin outer band → at "never touch" the gap is held open and visibly empty of liquid. At "keep coming back to this one crystal" an empty eleven-slot tray fades in along the bottom edge (slots numbered 1–11, no titles, no answers); no pin or support is drawn under the crystal. At "How much of it" and "where, exactly" two question cards appear and dock as a persistent header through E12-11; the first is answered in E12-09 and the second by the pinned card in E12-11.

Build order: new: drop, crystal, tray, question cards. Nothing from later answers is visible: no direction ticks, halo, arms, badges or labels.

Continuity: the crystal's centre and orientation are fixed from here to E12-11. The drawing is not to scale, so it carries no scale bar or units. The parent view changes scale only at three declared reframings, each marked by keeping the previous view as a dashed rectangle with a unitless tag: the widening in E12-04 ("view widened"), the reduction to the left half in E12-10 ("view reduced") and the reduction to a small inset in E12-12 ("view reduced"). Every other close-up is a linked inset or an explicit cut, including the E12-11 magnifier. The drop stays through E12-02 paragraph 1, then retires.

Likely wrong inference: that the drop freezes onto the crystal, or that this is a photograph or the earlier model recording. The held gap and the label prevent both.

Narrow layout (360×351, cut mode): drop at about 25% width, crystal at about 62%; question cards stacked in the top 60 px at no less than 13 px text; the tray becomes eleven 8 px dots in the bottom band. After this scene the header collapses to two 12 px tabs, "How much?" and "Where?", under the narrow-layout rule in the build contract. Static mode: the P3 composition with both questions visible and the drop at its shrunken size beside its dashed outline.

Words and timing: this opening paragraph is fresh wording because the public leak probe reads its first 70 characters; do not replace it with an Episode 1 sentence. Reveal the shrink at "the drop shrinks", the tray at "keep coming back to this one crystal" and the question cards at their own clauses.

Sources: `docs/education/chapters/01-not-a-frozen-raindrop.html#the-relay`; `docs/education/chapters/01-not-a-frozen-raindrop.html#not-a-raindrop`; `docs/education/chapters/13-the-frontier.html#why-bother`.

## E12-02 — Where the water went, and why six

### Narration

Episode one asked where the shrinking drop's water goes. It leaves as invisible vapour, crosses the air and joins the ice. At one temperature, liquid water needs more vapour than ice to stay in balance, so air between the two levels shrinks the drop and grows the ice. Our crystal began as a seed frozen on a speck of other material; not every ice particle starts that way.

Look inside our crystal. Episode two asked why six keeps appearing. In ordinary ice, water molecules link into puckered rings of six, joined in stacked sheets. The hexagon belongs to the arrangement of molecules, not to one molecule. Our crystal inherits that arrangement as six equivalent directions.

Take one of its faces. Episode two's warning runs through the series: arriving and joining are not the same event. Six directions say where faces can form, not how fast each will grow.

### Visual and sources

Purpose: recall Episode 1's answer (the vapour relay works because liquid needs more vapour than ice to stay in balance) and Episode 2's answer (the six comes from the arrangement of molecules), each as a feature added to the E12 crystal, then restate the arriving-versus-joining warning that later scenes depend on.

Prerequisites and depth: Episodes 1 and 2. The balance comparison and the ring-to-sheet construction are recalled, not re-derived; their full demonstrations and limits stay in those episodes and in reader 1.

Evidence and limits: both callbacks are earlier teaching drawings redrawn by their own functions; the balance comparison shows no measured vapour values; the ring is a drawing, not an image of atoms.

Subject and focus: the E12 crystal and one linked callback panel at a time. Each callback is introduced by selecting a feature on the crystal and drawing a leader line to the panel; the panel carries the label "Episode N · title", placed as that callback's crop box specifies (see Narrow layout).

Callback 1, P1, "Episode 1 · Not a frozen raindrop": select the gap between drop and crystal. Draw `drawEpisode(ctx, 360, 351, 5, p, t, false)` (the Episode 1 two-surface comparison, "Same air. Opposite changes."), ramping `p` from the first pose after that scene's prediction phase to 1 so no prediction heading appears. If the later-module chunk cost is refused, use `drawEarlyEpisode` scene 4 (the arriving-versus-leaving exchange) instead. At "began as a seed" the panel retires and the crystal's centre shows a small amber seed with its speck, labelled "seed · one common start". The drop retires after this paragraph.

Callback 2, P2, "Episode 2 · Why six is only the beginning": at "look inside our crystal", select the crystal's interior. Draw `drawStructure` with a synthetic `StructureCue` {index: 2, scene: 6, paragraph: 0, phase and action ramped 0→1 (ring → sheet), seconds from the E12 clock, predicting: false, released: true} and explicit zeros for any detail keys not wanted, because Episode 2 treats a missing detail key as revealed. The Episode 2 drawing and cue files currently carry someone else's uncommitted edits; paragraph 0 of E02-06 lies outside the changed E02-07 view, but do not pin Episode 2 pixels in tests until that work lands. Fallback: an E12-owned ring-to-sheet inset. At "six equivalent directions" six faint direction ticks grow from the crystal centre through its six corners and stay.

Changed input → action → result, P3: at "Take one of its faces", select one face. A dot reaches the face ("arrives") and a separate dot enters the lattice ("joins?"); the two labels stay as a small legend through E12-06. Tray slots 1 and 2 fill with their titles as each callback closes.

Build order: new: seed mark, six direction ticks, arrive/join legend. Retained: crystal, question header, tray. Retired: drop, callback panels.

Continuity: the crystal does not move while panels cut in; every panel returns to the same parent view.

Likely wrong inference: that the six comes from the shape of one water molecule, that the ring is a photograph, or that the drop's water flows through contact. The callback label, the retained gap in callback 1 and the "drawing" caption address these.

Narrow layout (360×351, cut mode): the crystal fills the band; each callback cuts in at its native 360×351 at scale 1 with its own crop box, chosen per callback rather than by one blanket rule. Where the drawer's heading only repeats the original scene's words (both callbacks here), crop from y ≈ 40 so the "Episode N · title" label replaces it. Where the heading carries words the narration depends on (Episode 6 scene 9 in E12-04), keep it and show the "Episode N · title" label as a bottom tag instead. Every callback follows the callback sequence in the build contract; cut back to the crystal for P3. Never scale a callback below 1.

Words and timing: this opening paragraph is fresh wording (probed by the public leak test). The exact echo "the hexagon belongs to the arrangement of molecules, not to one molecule" is in paragraph 2, not paragraph 1.

Sources: `docs/education/chapters/01-not-a-frozen-raindrop.html#the-relay`; `docs/education/chapters/01-not-a-frozen-raindrop.html#supercooling`; `docs/education/chapters/03-why-six-sides.html#the-honeycomb`; `docs/education/chapters/03-why-six-sides.html#two-ways-to-stack`; `docs/education/chapters/04-the-fuel-supply.html#two-bottlenecks-in-series`.

## E12-03 — Through the air, onto a flat face

### Narration

Look at the air around our crystal. Episode three asked how water crosses it. Each molecule wanders at random, but together they make a net flow toward the ice. Growth has two waits. The air controls how much water reaches the face. The surface controls how much becomes net added ice. Our crystal's growth leaves the nearby air thinner.

Return to that one face. Episode four asked how a face stays flat when water arrives from all sides. New ice spreads as molecular steps, and the slowest-growing directions survive as flat faces. Slow does not mean stopped. On a small blocky crystal, a face's edges get more vapour, so steps start there and crowd inward, keeping the advance nearly even. Our crystal's face advances the same way.

That correction has a limit. Select one corner: it pokes out into richer air than the middle of the face beside it.

### Visual and sources

Purpose: recall Episode 3 (net delivery, depletion and the two waits) and Episode 4 (steps, slow faces survive, the flat-face correction) as the next two features on the E12 crystal, and hand the correction's limit to Episode 5.

Prerequisites and depth: Episodes 3 and 4, plus the arrive/join legend from E12-02. Transport equations and the step-crowding mechanism stay in those episodes and in reader 1.

Evidence and limits: the halo is a transport schematic, not an image of vapour; the corners-richer pattern is a small blocky-crystal example, not a universal rule; the flat-face account is Libbrecht's qualitative mechanism, drawn exaggerated; real surfaces are less rigid than the steps shown.

Subject and focus: the air around the E12 crystal (P1), then one selected face (P2), then one selected corner (P3).

Callback 1, P1, "Episode 3 · The air is part of the problem": at "Look at the air around our crystal", select the air beside the crystal. Cut to `drawAir` with a synthetic cue {scene: 9, paragraph: 0, action ramped 0→1, seconds from the E12 clock, predicting: false, released: true, detail revealed in three steps, recapWalk, recapNet, recapDeplete, then the final pose with recapShape and recapAir} across the echo sentences. Cut back at "Our crystal's growth": a depletion halo (darker near the ice, lighter outward, captioned "thinner air near the ice · not a shell") and converging net-flow arrows appear and stay; contour lines crowd slightly at the corners; the arrive/join legend gains a two-part bar, "air delivers · surface builds".

Callback 2, P2, "Episode 4 · How a growing face stays flat": at "return to that one face", reselect the face chosen in E12-02. Import Episode 4's `drawSurface` under an alias (Episode 9 exports the same name) and cut to {scene: 9, paragraph: 1, detail: ledge 1, spread 1, slow 1, steps and balance ramped}. Cut back at "Our crystal's face advances the same way": the selected face advances flat past its retained dashed old outline while small step marks travel from its ends toward its middle.

Changed input → action → result, P3: no callback; the limit is shown on the crystal itself. At "Select one corner", one corner is selected and the halo contours around it brighten, closer together than at the middle of the neighbouring face, with the label "richer air"; the flat face beside it keeps its outline for comparison.

Build order: new: halo, flow arrows, two-wait bar, face step marks, corner selection. Retained: seed, six ticks, legend, header, tray (slots 3 and 4 fill). Retired: callback panels.

Continuity: same crystal, same framing; the halo persists for the rest of the episode as a quiet background layer.

Likely wrong inference: that the halo is a physical shell, that a flat face has stopped growing, or that the drawn steps are single visible molecules. The captions "not a shell" and "slow ≠ stopped" and the exaggeration note address them.

Narrow layout (360×351, cut mode): crystal and halo fill the band; each callback cuts in at native size with its own crop box (heading cropped for both) and follows the callback sequence in the build contract; P3 stays on the crystal. Static mode: the P3 state with halo, flat face and selected corner.

Sources: `docs/education/chapters/04-the-fuel-supply.html#the-hungry-halo`; `docs/education/chapters/04-the-fuel-supply.html#two-bottlenecks-in-series`; `docs/education/chapters/05-the-restless-surface.html#a-staircase-not-a-wall`; `docs/education/chapters/05-the-restless-surface.html#the-slowest-faces-win`; `docs/education/chapters/05-the-restless-surface.html#how-a-facet-stays-flat`.

## E12-04 — A corner runs ahead, and a map asks why

### Narration

Episode five asked whether a small lead can disappear. Without enough correction, a corner that pokes out reaches richer air, grows faster and pokes out further. Shape changes delivery; delivery changes growth; growth changes shape. The feedback didn't invent six: our six arms inherit the six corners, with side branches similar, not identical.

Now look at our crystal edge-on: it is thin. Episode six asked why one crystal is almost flat while another grows long like a pencil. Faster growth at the sides makes a plate; at the ends, a column. In one cloud-tunnel study, long forms grew near five degrees below freezing and flat, branched forms near fifteen below, but the extra vapour differed too: temperature was not the only change. Such comparisons fill a shape map, the Nakaya diagram.

The map organizes what happens; it does not say why the faces trade places. Episode six promised that explaining it would need measurements of growing faces and a model that survives comparison with them.

### Visual and sources

Purpose: recall Episode 5 (positive feedback turns corners into arms; six inherited, not invented) as the crystal's arms, then Episode 6 (proportions come from which faces advance faster; the map organizes observations) as a visible question about the crystal's thickness. The learner should leave this scene holding Episode 6's unanswered "why".

Prerequisites and depth: Episodes 5 and 6. Tip selection, fractal limits, pressure and seed conditions remain in those episodes and reader 1.

Evidence and limits: the map is qualitative with illustrative positions. Only "near −15 °C" and "near −5 °C" appear. No band boundaries, no exhaustive coloured bins, no cold-end column region, no plate–column alternation. The cloud-tunnel pair also differed in extra vapour, so the recalled observation is not a claim that temperature acts alone.

Subject and focus: the E12 crystal's corners (P1), then its thickness seen edge-on (P2–P3).

Callback 1, P1, "Episode 5 · The moment a corner becomes a branch": continue the corner selection from E12-03. Draw `drawBranching` {scene: 9, paragraph: 0, predicting: false, released: true, detail ramped: replayLead, replayGrowth, replaySurface, replaySide}. Cut back at "our six arms inherit the six corners": all six corners extend into arms while the earlier hexagon stays as a dashed "earlier ice" outline; irregular side branches bud, similar but not identical on the two sides of an arm. This is the first declared reframing: the view widens, the pre-widening view stays as a dashed rectangle tagged "view widened" (no units, because the drawing is not to scale), and every earlier outline is kept.

Callback 2, P2, "Episode 6 · One substance, many shapes": at "look at our crystal edge-on", a side-view strip slides out from the crystal on a leader line, showing that our crystal is thin. Then cut to `drawHabit` {scene: 7, paragraph: 2, detail: temperature, supply, plate, branches, column, name, approximate} so the map builds in at most four cuts to its final pose, with the chip "Pressure · seed · method · size/time" and "Approximate regions; no universal bins". At "temperature was not the only change", an E12 caption under the panel reads "extra vapour also differed". Do not use scene 1 (it mounts recordings).

Changed input → action → result, P3: redraw with {scene: 9, paragraph: 1, detail: map 1, unexplained 1}, which heads the panel "A description; not yet a complete explanation". This callback's crop keeps that heading, because it is the visible change for "does not say why"; the "Episode 6 · One substance, many shapes" label moves to E12's own band outside the panel on desktop and to a bottom tag in cut mode. A "why?" tag attaches to the side-view thickness strip and stays until E12-09. A small map thumbnail (two temperature ticks only) docks beside the tray.

Build order: new: arms, side branches, "view widened" reframing mark, thickness strip, "why?" tag, map thumbnail. Retained: halo, ticks, legend, header, tray (slots 5 and 6 fill). Retired: callback panels.

Continuity: arms grow from the existing corners; the old hexagon remains inside; the view is widened and the crystal is not replaced.

Likely wrong inference: that temperature alone sets the shape, that the map reads a crystal's temperature like a thermometer, or that branching explains thinness. The spoken extra-vapour qualification, the conditions chip, the "approximate" caption and the "why?" tag on thickness, not on arms, address these.

Narrow layout (360×351, cut mode): arms fill the band after the widening; the thickness strip sits in the bottom 70 px, above the single row of tray dots; the map callbacks cut in at native size, the scene 9 one with its heading kept and its "Episode 6" label as a bottom tag. Static mode: arms, strip with "why?" and the map thumbnail.

Sources: `docs/education/chapters/06-the-runaway-bump.html#the-runaway-bump`; `docs/education/chapters/06-the-runaway-bump.html#six-corners-at-once`; `docs/education/chapters/06-the-runaway-bump.html#sidebranches-that-do-not-match`; `docs/education/chapters/07-plates-columns-plates-columns.html#habit`; `docs/education/chapters/07-plates-columns-plates-columns.html#the-map`; `docs/education/chapters/07-plates-columns-plates-columns.html#cold-end-rewritten`.

## E12-05 — A partial record, and a ruler

### Narration

Episode seven asked how much a finished shape can tell us about a crystal's journey. New ice is added outside old ice, so a crystal can keep its growth order, like a column that later grew caps. But it keeps no clock, and the record can blur or break. The crystal is evidence to interpret, not a complete written log. Our crystal keeps its earlier outlines the same way.

A finished shape could not answer Episode six's question: to explain the map, we needed to know how fast each face grows, and why. Episode eight measured the first part: count brightness cycles in laser light reflected from a growing crystal, convert them to added thickness, and divide by the time. The light measured a change; the clock made it a rate.

Now suppose the top face grows slowly while the arm tips run ahead. Is the air slow to deliver water, or is the surface slow to build it into ice? From the rate alone, can we tell which?

The rate alone does not separate them. The same slow advance could come from thin delivery or from a reluctant surface, so the measurement needs a calculation beside it.

### Visual and sources

Purpose: recall Episode 7 (growth order survives; the record is partial) on the crystal's retained inner outlines; state why the series turned to measurement (to explain Episode 6's map we needed each face's growth speed and its cause); recall Episode 8's measurement chain on the crystal's top face; then run one prediction hold that re-earns the need for Episode 9.

Prerequisites and depth: Episodes 7 and 8; the arrive/join legend and two-wait bar from E12-02 and E12-03. Instrument calibration and levitation stay in Episode 8 and reader 1.

Evidence and limits: the optical chain is a schematic with no data; a counted rate is an average over a marked interval; laser cycles do not give the starting thickness; a finished shape carries no exact temperature, humidity or timestamp.

Subject and focus: the crystal's retained inner outlines (P1), its top face (P2), the top face's slow advance beside the advancing arm tips (P3–P4).

Callback 1, P1, "Episode 7 · A crystal remembers—but not perfectly": select the dashed inner outlines (seed, first hexagon) as the paragraph begins. Cut to `drawHistory` {scene: 2, paragraph: 2, detail: keep, input, route, qualified, answer, caps ramped 0→1, built, order, unknown}, revealed in at most four steps before its final pose; omit its prediction keys (ask, options). Scene 2 draws the two-dimensional capped column; no recording mounts outside scene 1. Cut back at "Our crystal keeps its earlier outlines": the outlines brighten as "earlier ice, kept".

Signpost and callback 2, P2, "Episode 8 · How to measure a growing crystal": at "how fast each face grows, and why", the "why?" tag on the thickness strip pulses and two small arrows, labelled "how fast?" and "why?", both attach to the top face, the face whose slow growth keeps the crystal thin. Select the top face; cut to `drawMeasurement` {scene: 6, paragraph: 1, detail: spot, cycles, conversion, bands, count, clock, interval, endpoints, thickness, rate}, revealing the chain in at most four steps before its final pose. Cut back at "The light measured a change": a thickness tick attaches to the top face, and at "the clock made it a rate" a small clock joins it; both stay.

Prediction hold, P3 → P4 (answer onset "The rate alone does not separate them."): changed input first, at "Now suppose the top face grows slowly": the top face's advance marker visibly slows, with its tick, clock and Episode 8's rate readout retained beside it, while the arm tips keep advancing. Then two suspect tags appear, both with question marks: "air slow to deliver?" (linked to the halo) and "surface slow to join?" (linked to the arrive/join legend). During the hold neither suspect is highlighted, no answer label appears, and the slow advance keeps moving (a real ongoing process, not a freeze); a small hold indicator distinguishes the editorial pause from steady growth. Release at the P4 onset: both tags draw an arrow to the same rate readout with "same slow rate either way"; then an empty "calculation" slot opens beside the top face for E12-06.

Build order: new: "earlier ice" highlight, top-face tick and clock, "how fast? / why?" arrows, suspect tags, empty calculation slot. Retained: all earlier features, under the narrow-layout rule in the build contract (slots 7 and 8 fill). Retired: callback panels; the suspect tags shrink into the legend after release.

Continuity: same crystal and framing after the E12-04 widening; the slow face is the crystal's own top face, not a new specimen, and the arm tips beside it are its own.

Likely wrong inference: that a slow face proves a reluctant surface, or that the finished shape records times. The hold's symmetric tags and the "no exact time" caption from Episode 7's panel address these.

Narrow layout (360×351, cut mode): callbacks cut in at native size; the hold returns to the crystal with the two tags stacked above the top face at no less than 13 px. Static mode: the released P4 state with both tags pointing to one readout.

Sources: `docs/education/chapters/08-a-snowflake-is-a-record.html#reading-a-capped-column`; `docs/education/chapters/08-a-snowflake-is-a-record.html#what-the-record-does-not-say`; `docs/education/chapters/10-how-we-know.html#counting-fringes`; `docs/education/chapters/10-how-we-know.html#two-thermometers`; `docs/education/chapters/04-the-fuel-supply.html#two-bottlenecks-in-series`.

## E12-06 — The surface's share, and a narrow rim

### Narration

Episode nine supplied that calculation. Compute a copy of the measured face with the same estimated local supply but a surface that holds nothing back, and compare their advances. Their ratio is the attachment coefficient; fits describe it through a barrier to starting new layers. We inferred it from motion and a model; we did not count successful molecular collisions. Our crystal's slow top face now carries that comparison.

Look at the narrow edge at the tip of one arm. Episode ten asked whether a narrow face responds like a broad one of the same kind. Experiments, read through a model, suggest narrow faces start new layers more easily near certain temperatures. The proposed reason: molecules arriving from the corners crowd onto a narrow terrace, and in ordinary air a faster-growing edge can sharpen itself further.

Episode ten brought those measurements back to the shapes Episode six mapped, with a proposed answer: that sharpening could build thin plates near fifteen below and hollow columns near five below.

### Visual and sources

Purpose: recall Episode 9 (the surface response is inferred as measured ÷ reference advance) and Episode 10 (narrow faces may start layers more easily; proposed crowding and edge-sharpening feedback), and state that Episode 10 brought the measurements back to the shapes Episode 6 mapped. The learner should be able to say that the narrow-edge idea is a proposed answer, not yet a verdict.

Prerequisites and depth: E12-05's hold; Episodes 9 and 10. Barrier and prefactor fits, the witness-face inversion and the temperature window stay in those episodes and in readers 2 and 3.

Evidence and limits: the attachment coefficient is inferred from motion plus a transport model; narrow-facet reductions are model-based inversions of growth experiments; the crowding mechanism and feedback are proposed; the edge-sharpening feedback needs growth limited by diffusion through a background gas and need not operate in near vacuum, so it is spoken with "in ordinary air"; Episode 10's twelve arrival dots are illustrative, not counted molecules or a molecular recording.

Subject and focus: the slow top face and its calculation slot (P1), the narrow tip edge of one arm, with the top face kept in view for contrast (P2), the link from that edge to the thickness strip and map thumbnail (P3).

Callback 1, P1, "Episode 9 · How do we measure the surface response?": the calculation slot beside the top face fills with a dashed reference copy of that face that advances farther than the measured top face. Import Episode 9's `drawSurface` under an alias and cut to {scene: 2, paragraph: 2, detail: supply, depletion, local, reference, referenceAdvance, ideal, ratio, response, coefficient, notcount}. Cut back at "Our crystal's slow top face": a bracket "measured ÷ reference = inferred response" stays on the top face.

Callback 2, P2, "Episode 10 · Can the edge change the rules?": at "the narrow edge at the tip of one arm", select that arm's tip edge and enlarge it in a linked close-up labelled "a narrow edge", with the broad top face still visible beside it. Cut to `drawEdge` {scene: 4, paragraph: 1, predicting: false, released: true, detail: proposal, sharp, traffic, equal, answer, density, arrivals, island, notmovie}; omit `question` so no prediction heading appears. Cut back at "sharpen itself further": the tip edge gains a thin outer addition while the earlier ice stays, labelled "proposed".

Changed input → action → result, P3: at "brought those measurements back", the thickness strip and its "why?" tag return; a dotted link runs from the narrow edge to the strip, labelled "proposed answer"; the map thumbnail brightens its two ticks. No verdict badge yet.

Build order: new: response bracket, narrow-edge close-up and addition, edge-to-strip link. Retained: everything earlier, under the narrow-layout rule in the build contract (slots 9 and 10 fill). Retired: callback panels; the arrive/join legend retires into the tray after P1.

Continuity: the narrow edge is the crystal's own arm tip; nothing old shrinks or is erased.

Likely wrong inference: that the coefficient was counted directly, that the narrow-edge mechanism is established, or that its feedback works the same way in near vacuum. The "inferred" and "proposed" labels, the spoken "in ordinary air" and the absent verdict badge address these.

Narrow layout (360×351, cut mode): callbacks at native size (Episode 10's drawer scales itself to 360×345); the P3 link returns to the crystal with the strip in the bottom band. Static mode: P3 state, which is also a required narrow capture pose.

Sources: `docs/education/chapters/11-the-stickiness-of-ice.html#sticking`; `docs/education/chapters/11-the-stickiness-of-ice.html#the-barrier`; `docs/education/chapters/11-the-stickiness-of-ice.html#the-coefficient-that-moves`; `docs/education/chapters/12-why-the-shape-flips.html#narrow-facets`; `docs/education/chapters/12-why-the-shape-flips.html#the-dips`; `docs/education/chapters/12-why-the-shape-flips.html#esi`.

## E12-07 — Resemblance, prediction and a proposed test

### Narration

Episode eleven asked what would count as an explanation. A computer can draw a convincing six-armed outline without showing how any face grows. The harder, more useful job is to predict how a known crystal will change under stated conditions, then compare.

It proposed a test: grow a hollow crystal while measuring its width, height and rim thickness, then lower the water supply at a recorded moment, with every prediction fixed before the later growth is seen. In this series it remains a comparison designed, not a result reported.

Our crystal is flat, not hollow, but its narrow arm edges raise the same kind of question. With every episode in place, what it shows sorts into three kinds: settled, a leading proposal, and still open.

### Visual and sources

Purpose: recall Episode 11 (resemblance is not prediction; a stronger test predicts a change before it is seen) and its concrete proposed test, then close the recap by opening the three-way ledger.

Prerequisites and depth: Episode 11. Model families, surface energy, grid refinement and the triangular stress test stay in Episode 11 and reader 1.

Evidence and limits: protocol diagram only; no data, no outcome, no pass or fail badge; the test is proposed and was not run in this series.

Subject and focus: two outlines (P1), the proposed-test callback (P2), one arm's narrow edge and the empty ledger bins (P3).

Changed input → action → result, P1 (E12-owned): two identical six-armed outlines appear side by side, labelled "drawn" and "grown"; then a supply strip and a clock appear beside the "grown" one only, with an empty "predicted change" box. No winner mark.

Callback, P2, "Episode 11 · What would count as an explanation?": draw `drawExplanation` {scene: 8, paragraph: 1, detail: test, measure, change, retain, before, matched, widthlaw, fit}. Omit outcomes, missesBoth and uncertain so the later observations stay covered, which the drawer's own state rule enforces.

P3: on the narrow edge of the arm selected in E12-06, a small marker set appears: a dashed starting outline, a supply-drop tick on a mini clock strip, and a covered box "not yet measured". A caption states "this crystal is not the hollow crystal of the proposed test". Slot 11 fills; the tray is complete. Three empty bins appear: "Settled", "Leading proposal", "Open", with distinct shapes (filled disc, half disc, open ring), not colour alone. A fourth shape, a filled square, is reserved for "settled as an observation · not explained"; it joins the Settled bin's legend when it first lands in E12-08, as a kind of settled item, not a fourth bin, and no bin shares its shape.

Build order: new: outlines (retire after P1), test markers, ledger bins. Retained: the whole crystal and tray.

Continuity: the recap ends on the same crystal it began with; the bins are the only new layer carried into E12-08.

Likely wrong inference: that the test has been performed or passed, or that the E12 crystal is the specimen of that test. The covered box, the "not the hollow crystal" caption and the absent outcome address these.

Narrow layout (360×351, cut mode): the callback cuts in at native size; P3 returns to the crystal with the three bins as a 3-icon strip in the bottom band, where they take the map thumbnail's place. Static mode: P3 state, which is also a required narrow capture pose.

Sources: `docs/education/chapters/13-the-frontier.html#modelling-2012`; `docs/education/chapters/13-the-frontier.html#starter-models`; `docs/education/chapters/13-the-frontier.html#the-other-laboratory`; [Libbrecht 2012 survey, pp. 2–3](https://arxiv.org/abs/1211.5555); [2023 model-to-experiment programme, pp. 7–8](https://arxiv.org/abs/2306.13087).

## E12-08 — What is settled

### Narration

Start with what is settled. The six comes from how water molecules stack in ordinary ice, and the crystal inherits it. How water reaches the crystal, and how growth thins the vapour around it, is ordinary physics.

So is the branching that follows: corners run ahead, and nothing assigns where side branches go. Controlled experiments also agree, as an observation, that the favoured shape changes with temperature, though they differ on exactly where.

Those settled pieces explain why our crystal has six branching arms. They do not, alone, explain why it is so thin. That is Episode six's question, and there the explanation becomes less certain.

### Visual and sources

Purpose: turn the recap into a verdict by attaching "Settled" badges to the features that earned them, mark the temperature pattern as observed but not explained, and isolate thickness as the open part of Episode 6's question.

Prerequisites and depth: E12-02 to E12-04. Dates and sources for each settled item are in reader 2.

Evidence and limits: "settled" means the causal account taught at this level is established, not that every quantitative detail is known; the observation badge means "seen repeatedly", not "explained"; no badge is placed on the surface layer.

Subject and focus: the E12 crystal's six ticks, halo and arms (P1–P2), the map thumbnail (P2), the thickness strip (P3).

Changed input → action → result: a filled "Settled" disc travels from its bin to the six direction ticks at "stack in ordinary ice"; a second to the halo and flow arrows at "ordinary physics"; a third to the arms at "So is the branching", with a small note on the side branches, "placement not assigned". At "favoured shape changes with temperature" a filled-square "Observed" badge goes to the map thumbnail, and the Settled bin's legend gains "■ settled as an observation · not explained". Each badge's landing briefly lights its matching tray slots: the six-direction badge slot 2, the transport badge slots 1 and 3 (the drop-to-ice relay and the delivery and depletion it depends on), the branching badge slot 5 and the Observed badge slot 6. P3: the settled badges dim slightly but stay; slots 7, 8 and 9 gain a small "how we know" tool glyph, because those episodes supplied methods rather than ledger items; slot 4 stays unbadged, because the ledger sources do not classify the qualitative flat-face mechanism and E12 does not invent a status for it; the thickness strip's "why?" tag brightens.

Build order: new: badges only. Retained: all features. No callback redraws: this scene sorts what the recap already built.

Continuity: nothing moves except the badges; the crystal is unchanged.

Likely wrong inference: that "settled" means everything about snow growth is known, or that the observed temperature pattern is explained. The filled-square "Observed" badge, a shape no bin uses, its legend line and the lit "why?" tag address these.

Narrow layout (360×351, cut mode): badges are 18 px icons with one-word labels at no less than 12 px; the bins stay in the bottom band; the map thumbnail returns as a small overlay above them while the Observed badge lands, then retires to its slot glyph. Static mode: all P3 badges placed.

Sources: `docs/education/chapters/13-the-frontier.html#why-bother`; `docs/education/chapters/13-the-frontier.html#confidence-map`; `docs/education/chapters/03-why-six-sides.html#the-honeycomb`; `docs/education/chapters/04-the-fuel-supply.html#the-hungry-halo`; `docs/education/chapters/06-the-runaway-bump.html#sidebranches-that-do-not-match`; `docs/education/chapters/12-why-the-shape-flips.html#how-sure`.

## E12-09 — Why so thin? A leading proposal

### Narration

Curves fitted to broad-face measurements describe top and side growth at each temperature, but alone leave a serious gap for the thinnest plates and hollow columns. Kenneth Libbrecht, whose experiments run through this series, combines them with the narrow-edge proposal in what he calls the comprehensive attachment kinetics model.

He calls the narrow-edge idea a working hypothesis and judges it the only viable option currently available for explaining the map. Separate experiments, read through a model, do point to easier layer starts near minus four and minus fourteen degrees. But the model draws these as windows whose exact placement, width and depth were chosen to match the shape map. If a model built with those windows later matches that same map, what has it shown?

Much less than it seems. The windows fit where they were chosen to fit, so that match is not an independent test. And, as Episode ten warned, the idea needs top and side faces to become disordered differently near melting, which simulations have not confirmed; they may be too coarse to tell.

It also falls short in size. For the side face near minus fourteen, working it forward leaves about half the broad-face barrier; the value inferred from the experiments is about a tenth. So how much of our crystal can eleven investigations explain? Its six directions, the water reaching it and its branching arms: settled. Why it is so thin: a leading proposal, with real support and real gaps. Whether a model built on it survives the comparison Episode six asked for: still open.

### Visual and sources

Purpose: answer Episode 6's plate/column question as far as the sources allow: the pattern is observed; broad-face fits describe but leave a gap for the extreme shapes; the narrow-edge proposal is the leading working hypothesis in its author's assessment; its exact windows were chosen to match the map (in-sample); it needs a facet-dependent surface difference that simulations have not confirmed; and for the side face near −14 °C the forward estimate leaves about half the barrier while the experiments suggest about a tenth. The prediction hold makes the in-sample point something the learner reasons out using Episode 11's lesson. The scene then answers the episode's first question explicitly: directions, delivery and branching settled; thinness a leading proposal; the model comparison Episode 6 asked for still open.

Prerequisites and depth: Episodes 6, 9, 10 and 11; E12-08's "why?" tag. Exact dip formulas, the crossing-count history and the rough inputs of the forward estimate are in reader 3 and in Episode 10's reader, not narrated.

Evidence and limits: all curves are schematic, with no digitized or invented values; the windows' exact placement, width and depth are hand choices in the source, while the reduction regions near −4 °C and −14 °C have separate model-based support; "only viable option currently available" is the author's assessment, not a proof of exhaustiveness; half and one tenth are two routes (forward mechanism estimate; model-based inversion of experiments, spoken as "the value inferred from the experiments") to the same prism (side) face near −14 °C, shown as amounts of barrier left, not as "recovered" fractions; the premelting caveat is recalled as Episode 10's warning, which is true only of the pending E10 revision. No temperature band boundaries; the windows are not habit boundaries.

Subject and focus: the thickness strip and a small curves inset (P1), the narrow edge and a temperature strip under the map thumbnail (P2), the hold overlay (P2–P3), a surface-skin inset linked from the narrow edge (P3), the barrier bars, then the thickness strip and first header card (P4).

Changed input → action → result, P1 (E12-owned): two smooth broad-face curves (top face, side face), labelled "fitted to broad-face measurements · schematic", appear beside the thickness strip; a gap marker "thinnest plates, hollow columns: serious gap" sits between the curves and the strip. A package outline labelled "comprehensive attachment kinetics model (its author's name)" encloses the curves and an empty dotted slot.

P2: the narrow-edge proposal fills the dotted slot; a half-disc "Leading proposal" badge travels from its bin to the narrow edge of the selected arm. Under the map thumbnail a temperature strip shows two shaded windows labelled "near −4 °C" and "near −14 °C · model-based support"; at "were chosen to match the shape map" the drawn windows' edges, widths and depths gain the tag "chosen to match the map", with a thin arrow from the map to the windows, while the "model-based support" label stays on the regions.

Prediction hold, P2 → P3 (answer onset "Much less than it seems."): changed input first: a panel labelled "hypothetical match" slides over the map thumbnail and lines up with it. During the hold the windows, the map-to-window arrow and the overlay stay visible so the learner can reason; no verdict word, no loop arrow and no badge change appear; a small hold indicator marks the editorial pause. Release at the P3 onset: a loop arrow closes from the windows back to the same map, captioned "chosen from this map → compared with this map: not an independent test". Then a linked surface-skin inset opens from the narrow edge: top-face and side-face skins drawn with different disorder thickness, captioned "assumed difference · not confirmed by molecular simulations, which may be too coarse to see it".

Callback, P4, "Episode 10 · Can the edge change the rules?": draw `drawEdge` {scene: 9, paragraph: 0, detail: gap, reference, half, tenth, amount} with no replay keys: the full broad-face reference bar, then the forward estimate ending at one half, then the inferred value ending at one tenth, all for the same side face near −14 °C. Cut back at "So how much of our crystal": the narrow edge's badge gains the subtitle "real support · real gaps"; at "its branching arms" the filled discs on the six ticks, halo and arms flash once; at "Why it is so thin" the "why?" tag on the thickness strip turns into a half-disc badge; at "still open" the first header card ("How much?") gains a mini key (filled discs on directions, delivery and arms; a half disc on thickness; an open ring on the model comparison) and docks as answered.

Build order: new: curves inset, package outline, windows strip, hold overlay, loop arrow, skin inset, edge badge subtitle, half-disc thickness badge, answered header key. Retained: the crystal and all badges. Retired: curves inset and hold overlay after the loop arrow lands; the bars retire into a small reference chip on the narrow edge; the "why?" tag retires into the half-disc badge.

Continuity: every new element is linked to the narrow edge, the thickness strip, the map thumbnail or the header card already on screen.

Likely wrong inference: that curve crossings or window edges are the temperatures where plates become columns; that "about half" means the mechanism recovers half the effect; that the in-sample match validates the idea; that the facet-dependent surface difference has been observed. The "not habit boundaries" caption on the strip, the "amount left" bar labels, the loop arrow and the "assumed" skin caption address these.

Narrow layout (360×351, cut mode): P1 and P2 use the top half for the inset, or for the map thumbnail brought back from the bottom band with the windows strip under it, and the bottom half for the selected arm's narrow edge; the hold overlay fills the band at native size with the question visible in the caption line; the Episode 10 callback cuts in at native size. Static mode: the released P3 loop arrow with the skin inset, then the P4 answered state (bars chip, half-disc thickness badge, docked header key) as a second authored state.

Sources: `docs/education/chapters/12-why-the-shape-flips.html#how-sure`; `docs/education/chapters/12-why-the-shape-flips.html#the-dips`; `docs/education/chapters/12-why-the-shape-flips.html#esi`; `docs/education/chapters/13-the-frontier.html#working-hypothesis`; `docs/education/chapters/13-the-frontier.html#chosen-numbers`; [Dip positions and widths chosen, p. 5](https://arxiv.org/abs/2009.08404); [Forward estimate against inferred dip, p. 9](https://arxiv.org/abs/2012.12916); [Working hypothesis and assessment, p. 5](https://arxiv.org/abs/2306.13087).

## E12-10 — Where knowledge stops

### Narration

Where does knowledge stop? Mostly at the outer layers of ice, where an arriving molecule joins the crystal or does not. Microscopes have watched single molecular layers spread across growing ice, but no experiment has yet watched, molecule by molecule, which arrivals join a growing face at snowfall temperatures. Open questions come in two kinds.

Some are open because they are hard. Ice near melting has a real disordered skin, but how it controls growth is not established. Traces of certain other vapours can turn plates into columns; Libbrecht sums that up as much experimental evidence and little understanding. Even whether ordinary air changes the surface rules is unresolved: his book reaches opposite verdicts, and the broad-face curves assume it does not.

Others wait only for the work to be done. Growth calculations usually leave out the heat released as ice forms, a stated choice, least safe near freezing. The narrow-edge proposal still lacks a rule for how a face's response changes as it narrows. Episode eleven's hollow-rim comparison is still only a proposal.

### Visual and sources

Purpose: answer the episode's second question concretely: where knowledge stops, which specific items are open, and whether each is open because it is hard or because it has not yet been done.

Prerequisites and depth: the arrive/join thread (E12-02, E12-03, E12-05) and E12-09. The at-rest (equilibrium) shape, cubic ice, pyramidal step energy, missing map axes, disputes between the two schools and the triangular-growth origin are in reader 2, with dates. The at-rest shape is kept out of narration because the series never taught it beyond Episode 4's warning that the lowest surface energy does not explain a growing shape, and a spoken item the learner cannot place would lengthen the list without helping.

Evidence and limits: the molecule at the surface is an illustration, not an observation; the imaging statement first says what has been seen (optical microscopy has watched elementary steps, each one molecular layer high, spread on ice growing from vapour; Sazaki and colleagues, PNAS 2010) and then uses the narrow wording (no experiment has yet watched, molecule by molecule, which arrivals join a growing face at snowfall temperatures), not a claim that the ice surface has never been imaged; trace-vapour effects are observed and not understood; the plain-air statement rests on the monograph's opposite verdicts (printed pp. 61 and 170) and its flagged implicit assumption that the kinetics does not depend on background gas pressure (printed p. 145), and it is sorted as hard because Chapter 13 files it inside its hard trace-gas item; heat omission is the modelling source's stated, regime-scoped choice and is Chapter 13's one item left for later; the width rule and the rim comparison are this episode's own not-yet-done classifications.

Subject and focus: one selected face's outermost layers (P1), then six item cards, each anchored to a feature before it moves.

Changed input → action → result, P1: a linked zoom from the selected face to its outer layers; one molecule arrives and hovers at the boundary under the label "joins?"; the "Open" bin slides beside the zoom. Two trays open below it, "Open · hard to do" and "Open · not yet done", marked with distinct icons.

P2 (each card appears on its own clause and slides into "hard to do"): (1) the surface-skin inset from E12-09: "disordered skin is real · its link to growth is not established"; (2) a faint vapour wisp crossing the crystal beside small plate and column silhouettes: "trace vapours can turn plates into columns · little understanding"; (3) a small pressure gauge beside two open-book icons with opposite arrows: "does ordinary air change the surface rules? · two verdicts · the curves assume not".

P3 (each slides into "not yet done"): (4) a heat shimmer at the surface: "heat left out by choice · least safe near freezing"; (5) the width question, callback "Episode 11 · What would count as an explanation?": draw `drawExplanation` {scene: 3, paragraph: 2, detail: faces, compact, split, broad, narrow, switch, how, missing}, omitting the m1 and m2 keys so no M1/M2 labels appear, showing the width bracket moving between limits with the rule region left unresolved; (6) the rim-test marker set from E12-07 slides in labelled "proposed · Episode 11", and tray slot 11 gains an open ring.

Build order: new: surface zoom, two trays, six cards (three per tray, one per spoken item). Retained: the crystal with its badges, reduced to the left half as the second declared reframing (the previous view kept as a dashed rectangle tagged "view reduced"). Retired: the Episode 11 panel after card 5.

Continuity: every card originates at a feature of the same crystal; the settled badges remain visible, so open and settled are seen together.

Likely wrong inference: that "open" means nothing is known; that every open item is difficult rather than simply undone; that the ice surface has never been imaged at all; that heat and air are questions about the surface skin. The two-tray sort, the retained settled badges, the spoken microscope clause and cards that anchor heat and air to the crystal as a whole, not to the zoomed surface, address these.

Narrow layout (360×351, cut mode): the zoom fills the band for P1; the trays become two stacked rows of three icons with one-line labels at no less than 12 px; the callback cuts in at native size. Static mode: all six cards sorted, with the crystal at left.

Sources: `docs/education/chapters/13-the-frontier.html#where-it-runs-out`; `docs/education/chapters/13-the-frontier.html#starter-models`; `docs/education/chapters/12-why-the-shape-flips.html#how-sure`; `docs/education/chapters/12-why-the-shape-flips.html#counting`; `docs/education/chapters/05-the-restless-surface.html#a-slushy-skin`; [Sazaki and colleagues, elementary steps on growing ice, 2010](https://doi.org/10.1073/pnas.1008866107).

## E12-11 — A small field, and a dark card

### Narration

Why is so much still open? The experiments are hard: a crystal smaller than a grain of salt, growing slowly, in air whose humidity cannot be measured at its surface. And few people work on it. As Libbrecht puts it, typically, there are a handful of interested souls around the globe at any given time thinking about this problem.

Difficulty and neglect look alike from outside but differ, which is why the open list has two trays. The field is small, not solitary: two groups with different instruments each find a surface's response depends on the crystal's structure and history, not temperature alone. And saying we do not know is a scientific position, not a shrug, as the book these episodes are drawn from puts it. It marks where the next person can start.

Careful looking still counts, and you can do some. Next time it snows on a cold day, chill a dark card outside, catch a few falling crystals and look with a magnifier. Star-shaped crystals grow in cloud near fifteen below, and on cold days more of them may reach you intact. Look for flat faces, six directions and branches that almost match. There was no drawing of those branches inside the seed.

### Visual and sources

Purpose: give the human reasons the frontier is still open (hard experiments; a tiny field), distinguish difficulty from neglect, present "we do not know" as a position that points somewhere, and end the science with a practical invitation and the Episode 1 bookend line.

Prerequisites and depth: E12-10's trays; Episode 8's instruments and Episode 9's second laboratory. Funding details, biographies and the two schools' disputes are in reader 2; practical looking tips are in reader 7.

Evidence and limits: "a handful of interested souls" is Libbrecht's own sentence (printed p. 41), spoken with attribution; "we do not know is a scientific position, not a shrug" is a sentence from the book these episodes are drawn from (Chapter 13 of the book behind this series, not Libbrecht's monograph Snow Crystals), attributed to it; the two-groups statement is converging evidence, not a shared mechanism, and follows Chapter 13's "not a fixed property of ice at a given temperature"; the cold-day reason is that book's practical inference, spoken as a tip, not a measurement; the size comparison concerns laboratory crystals and is illustrative.

Subject and focus: the size and humidity problem (P1), two instruments converging on one tag (P2), a dark card, a magnifier and one landed crystal that is the E12 crystal's identity (P3).

Changed input → action → result, P1: apart from the E12 crystal, a small icon labelled "laboratory crystal" appears beside a grain-of-salt silhouette, captioned "lab crystals: smaller than a grain of salt · illustrative"; the salt is never paired with the E12 crystal, whose drawing is not to scale. A humidity probe icon stops short of the laboratory crystal's surface with "cannot read here". Then a dim globe outline with a handful of small lights and the caption "a handful · Libbrecht's phrase", with no count.

P2: at "two trays", the two open trays from E12-10 briefly return with their labels. A camera-on-facet icon and a levitation-between-plates icon each draw an arrow to one shared tag, "response not fixed by temperature alone · depends on structure and history". At "the book these episodes are drawn from", a small card reads "The book behind this series · Part One: the science"; the closing card's "Continue reading: Part Two of the book behind this series" later echoes it. The card never uses the title Snow Crystals, which names Libbrecht's monograph. Then the two trays close into one card, "where the next person can start", which stays pinned by the header's second question.

P3: cut to a dark card and a folding magnifier; a few crystals drift down and land; the magnifier frames one, which cross-fades into the E12 crystal with all its badges hidden (the same crystal identity, now seen as an object to look at). At "flat faces, six directions and branches", three labels appear directly on the magnified E12 crystal: "flat faces · six directions · branches". There is no callback here, so the handoff stays on one picture; the spoken line carries the Episode 1 bookend. At the final sentence, the E12 crystal's seed highlights at the centre, then the arms light outward from it; nothing is pre-drawn inside the seed.

Build order: new: laboratory-crystal icon and salt silhouette, probe, globe, instrument icons, book card, dark card and magnifier, three direct labels. Retained: header questions (the first answered in E12-09, the second now answered by the pinned card). Retired: trays, badges (hidden, not deleted: Replay and Still restore them).

Continuity: the magnified crystal is explicitly the E12 crystal (cross-fade with matched outline); the seed highlight uses the seed mark from E12-02.

Likely wrong inference: that the field has been abandoned, that "we do not know" means giving up, that any snowy day will show stars, or that the continuing crystal is smaller than a grain of salt. The two-instrument tag, the "where to start" card, the hedged cold-day caption and the separate laboratory-crystal icon address these.

Narrow layout (360×351, cut mode): the magnifier frame fills the band; captions sit in the bottom 50 px at no less than 13 px; the three labels sit on the magnified crystal and no callback cuts in. Static mode: the magnified E12 crystal with the seed highlighted and the arms lit.

Sources: `docs/education/chapters/13-the-frontier.html#a-field-of-a-handful`; `docs/education/chapters/13-the-frontier.html#the-other-laboratory`; `docs/education/chapters/13-the-frontier.html#why-bother`; `docs/education/chapters/10-how-we-know.html#go-and-look`; `docs/education/chapters/01-not-a-frozen-raindrop.html#no-blueprint`.

## E12-12 — The next story

### Narration

Episode eleven's standard applies to the crystal that opened this series. Like the other computer-grown crystals here, it came from the project behind the series, using a Gravner and Griffeath kind of rule with no temperature in it. It shows resemblance, not a tested prediction.

That project is where the story goes next. You cannot ask those crystals what grows at minus fifteen: their settings are not in degrees. The project keeps that kind of lattice but changes the rules so temperature is an input: the question can be asked, and the answer can be wrong. Its face rules are mostly published fits to experiments or values worked back through models; a few, including those windows, are chosen by hand. Every number it shows is meant to carry two labels: what kind it is, and how far it has been tested. The rule for scoring its main test was written before the test ran.

That test asked whether such a model, given a temperature, grows the shapes on Episode six's map. So far, no: no version grew columns where the map has columns, not even one with windows chosen from that map on every face. Nor has the project yet shown that its grid is fine enough. This is a result about these models, not a verdict on the narrow-edge idea. Separate tests it named, against measurements its rules were not tuned to, have not been run. The next story asks what it takes to build a model that is allowed to fail, and what it means when it does.

### Visual and sources

Purpose: apply Episode 11's standard to the crystal that opened the series and to the other computer-grown crystals, without repeating the pending E11-02 disclosure as new; describe, in the third person, the project behind the series: the same kind of lattice with rules that contain temperature, so that a question about temperature can be asked and answered wrongly; give its honest status qualitatively, including that its result concerns its own models and is not a verdict on the narrow-edge idea; end on the question the next story asks. The learner should be able to say why the catalogue crystals are resemblance, not prediction, and what would make a model's failure informative.

Prerequisites and depth: Episode 11's resemblance-versus-prediction lesson and the E12-09 hold. The project's first headline comparison, with every caveat, is reader 5; the catalogue and Run B provenance is reader 4.

Evidence and limits: third person throughout; no maker thoughts, no chronology, no dates, no spoken scores or fractions. The catalogue crystals and Run B are unvalidated Gravner–Griffeath-type (`GGThreshold`) model output; the Nakaya-scoring runs used a different operator on the same kind of lattice, with temperature-dependent attachment inputs. Never show a catalogue crystal as that model's output. The face rules are spoken as fitted curves and model-inverted values plus a few hand choices (the source-tabulated inputs are themselves fits or inversions, and the hand choices include the project's own, not only the source's); no face rule is described as directly measured, and nothing is called "measured surface physics". "Two labels" is a stated design rule ("meant to"). "Written before the test" refers to the scoring rule; the registered headline rule that combined measured and grid-extrapolated classes was never implemented, which reader 5 records. The main pre-scored sweep carried the broad-face curves alone, with the narrow-edge dips switched off; only the separate M1 version had windows, on every face, and its partial match is in-sample. No version produced columns where the map has columns; the grid resolutions are published as not converged; the result is implementation-level and can neither establish nor refute the narrow-edge mechanism in nature. The four named held-out comparison families were never frozen or run.

Subject and focus: the recording or catalogue strip (P1), an unlabelled settings dial and then a separate empty model frame with four cards (P2), the status cards and the closing question (P3).

Changed input → action → result, P1: optional single WebGL mount, the only one in the episode: the Run B recording (the crystal that opened the series), labelled "MODEL · NOT VALIDATED · Gravner–Griffeath-type cellular rule · no temperature input · cells are not molecules; ticks are not seconds · replay time-compressed · thickness shown 2.6× exaggerated", shown while the E12 teaching crystal stays small at left, separately labelled "teaching drawing" (the third declared reframing, with a "view reduced" dashed rectangle). Unmount before P2. Authored 2D fallback: a strip of three catalogue outlines labelled "MODEL · NOT VALIDATED · Gravner–Griffeath-type cellular rule · no temperature input". Show the model key only while the recording is drawn.

P2: the recording retires. At "You cannot ask those crystals", a small "−15 °C?" card is held up to an unlabelled settings dial and finds no degree marks on it. At "keeps that kind of lattice", a new, empty frame labelled "same kind of lattice · different rules · temperature is an input" appears (no crystal inside it). Four cards enter on their clauses: "temperature: input"; "face rules: fitted to experiments · inferred through models · a few chosen by hand", with the "chosen to match the map" tag from E12-09 flying in to the last item; "two labels on every number: what kind of number · how far tested"; a sealed envelope "scoring rule written before the main test".

P3: a small map outline with the plain caption "not reproduced"; at "no version grew columns", a card "no columns where the map has columns · every version", with a tag "compact model · windows on every face" and a small width-bracket icon echoing E12-10's width-rule card; at "fine enough", a grid icon "grid not yet shown fine enough"; at "not a verdict", the caption "a result about these models · not a verdict on the idea"; at "have not been run", a covered panel "named held-out tests · not yet run". No fractions, no scores, no dates. The closing question card: "What does it take to build a model that is allowed to fail, and what does it mean when it does?", with the line "Continue reading: Part Two of the book behind this series" shown on the card itself, not only in the footer. The spoken destination stays neutral until the maker decides between Part Two, a future video series or both (plan, Open questions); once decided, it is named once in narration or on this card.

Footer: kicker "End of the series"; heading taken from the closing question; buttons "Replay Episode 12" and "Return to the series"; a link "Continue reading: Part Two · What We Are Building" to https://billatgameology.github.io/snowflake/chapters/14-what-we-are-building.html, enabled only after the corrected Chapter 14 is merged to main, deployed, and the public page at that URL is verified to show the new opening. No "Episode 13", no "Coming soon", no promised video series. Known limitation of the destination, outside this plan's scope and to be recorded in the plan: Chapter 14's `#where-it-stands` section still carries an internal status note ("This audit found that its entry at 8c781b1 lags three commits…").

Build order: new: recording or strip (retires), settings dial (retires), model frame, four cards, status cards, question card with the continue-reading line. Retained: the small E12 teaching crystal at left, whole and unbadged, as the series' subject.

Continuity: the E12 teaching crystal is never presented as model output; the recording, the teaching crystal and the new model frame carry three different labels.

Likely wrong inference: that the beautiful crystals validate the project; that the project succeeded; that the narrow-edge proposal was tested and refuted; that every version was tuned to the map; that the project's model is the same rule that made the catalogue crystals; that "chosen by hand" means arbitrary or hidden. The separate frames, the "not reproduced" and "no columns" cards, the "not a verdict on the idea" caption, the "compact model · windows on every face" tag, the spoken grid limit and the provenance card address these.

Narrow layout (360×351, cut mode): the recording or strip fills the band for P1; cards stack two per row at no less than 12 px; the closing question sits in the band with only its continue-reading line before the footer. Static mode: the P3 composition with the question card.

Sources: `docs/education/chapters/14-what-we-are-building.html#the-ending-first`; `docs/education/chapters/14-what-we-are-building.html#the-gap`; `docs/education/chapters/14-what-we-are-building.html#where-it-stands`; `docs/education/chapters/17-a-model-that-can-be-wrong.html#in-sample`; `docs/education/chapters/17-a-model-that-can-be-wrong.html#held-out`; `docs/education/chapters/13-the-frontier.html#starter-models`; `docs/education/chapters/30-finished-failed-and-not-yet-built.html#status`; `docs/education/chapters/09-the-menagerie.html#one-rule`; [Gravner and Griffeath, three-dimensional cellular model](https://doi.org/10.1103/PhysRevE.79.011601).

## Reader depth retained, not discarded

### Episode by episode: what this closing episode recalls

Episode 1, Not a frozen raindrop, asked where a shrinking drop's water goes when it never touches the crystal beside it. Its answer is the vapour relay: at one temperature, liquid water needs more vapour than ice to stay in balance, so air between the two levels shrinks drops while ice grows. It kept its example of about 100,000 droplets as Libbrecht's water budget, not a count of collisions, and it said that not every ice particle begins by freezing on a speck. Episode 2, Why six is only the beginning, placed the six in the way molecules connect in ordinary ice, not in one molecule, and ended on the warning that arriving and joining are different events.

Episode 3, The air is part of the problem, showed random molecular paths producing a net delivery toward the ice, a depleted halo, and the two waits of delivery and surface. Episode 4, How a growing face stays flat, showed steps spreading across terraces, slow faces surviving, and, on a blocky crystal, steps starting at the better-supplied edges and crowding toward the middle, a qualitative mechanism that works up to a limit. Episode 5, The moment a corner becomes a branch, showed the positive feedback that turns a corner into an arm, with the six inherited from the corners and the side branches similar rather than identical.

Episode 6, One substance, many shapes, related proportions to which faces advance faster and organized controlled comparisons into the morphology diagram. It narrated only a cloud-tunnel pair (long forms near −5 °C, flat branched forms near −15 °C, with the air held near liquid-water balance and the extra vapour different between the two), attached pressure, seed, method and size to the map, and said the traditional cold end has been revised. Episode 7, A crystal remembers—but not perfectly, showed that growth order can survive while exact times, humidities and weather cannot be read from a finished shape. Episode 8, How to measure a growing crystal, built the interference-and-clock chain for a thickening speed and showed that a rate alone cannot separate delivery from incorporation.

Episode 9, How do we measure the surface response?, inferred the attachment coefficient as measured advance divided by a calculated reference advance, and kept fitted values attached to temperature, pressure, geometry and preparation history. Episode 10, Can the edge change the rules?, presented model-based evidence that narrow facets start layers more easily near −14 °C (side faces) and −4 °C (top faces), a proposed crowding mechanism with a temperature window, edge-sharpening feedback, the rule that a curve crossing is not a habit boundary, and the half-versus-one-tenth gap. Episode 11, What would count as an explanation?, separated resemblance from prediction, numerical checks from experimental checks, and ended on a proposed hollow-rim, supply-drop test.

This closing episode recalls each answer by redrawing a scene with that episode's own drawing function, labelled with the episode's number and title. The recall is a reminder, not a re-derivation: the demonstrations and their stated limits remain in the earlier episodes.

Sources: `docs/education/chapters/01-not-a-frozen-raindrop.html#the-relay`; `docs/education/chapters/03-why-six-sides.html#the-honeycomb`; `docs/education/chapters/04-the-fuel-supply.html#the-hungry-halo`; `docs/education/chapters/05-the-restless-surface.html#how-a-facet-stays-flat`; `docs/education/chapters/06-the-runaway-bump.html#the-runaway-bump`; `docs/education/chapters/07-plates-columns-plates-columns.html#the-map`; `docs/education/chapters/08-a-snowflake-is-a-record.html#reading-a-capped-column`; `docs/education/chapters/10-how-we-know.html#counting-fringes`; `docs/education/chapters/11-the-stickiness-of-ice.html#the-coefficient-that-moves`; `docs/education/chapters/12-why-the-shape-flips.html#narrow-facets`; `docs/education/chapters/13-the-frontier.html#starter-models`

### The ledger in full: settled, proposed and open, with dates

Settled. The six-fold symmetry follows from the hexagonal lattice of ordinary ice (ice Ih), whose structure X-ray photographs determined in 1929 (Libbrecht, Snow Crystals, printed p. 28); the crystal inherits it. Vapour transport to a growing crystal, and the depletion of the air around it, are standard diffusion physics. Branching follows from that transport: a projection reaches richer air and runs ahead, and side-branch placement is largely random (Figure 3.8 caption). More spare vapour, larger size or higher pressure makes crystals more elaborate, which diffusion explains qualitatively (arXiv:1211.5555, pp. 2–3). Latent heat release is itself uncontroversial physics; only its omission from calculations is at issue.

Observed, not explained. Published morphology diagrams show broadly repeated temperature-dependent habit changes, with differences in exact placement; the old cold end was revised by later experiments. Broad-face barrier curves are model-dependent inversions plus fitted smooth curves: they describe broad-face growth and are well grounded in experiments in their author's words, but they do not by themselves account for the thinnest plates and hollow columns. Narrow rims grow fast, hollows form, thin plates form. Triangular plates grew reproducibly near −14 °C within a narrow supply range in one controlled study. Two groups with unrelated instruments, Libbrecht imaging facets and a Penn State group weighing levitated crystals (Journal of the Atmospheric Sciences, 2016 and 2020), both find that a surface's response is not a fixed property of ice at one temperature; that is converging evidence, not a shared mechanism.

Leading proposal. Structure-dependent attachment kinetics, the narrow-facet idea, is called a working hypothesis by its author, who judges it "the only viable option currently available" for the Nakaya diagram (arXiv:2306.13087, 2023, p. 5); that is an assessment, not a proof that no alternative exists. The dip positions and widths were "judiciously chosen" to explain the diagram (arXiv:2009.08404, 2020, p. 5), and a companion paper says molecular understanding of the ice surface is not sufficient "even to roughly estimate the temperatures of the two SDAK dips" (arXiv:2011.02353, 2020, p. 4). Separate model-based inversions of dedicated growth experiments (2020) support reductions near −4 °C and −14 °C. The idea rests on the two facets premelting differently; molecular-dynamics simulations "generally see similar premelting behaviors on the two facets, but the calculations may not be accurate enough to see small facet-dependent effects" (printed p. 159). The 2023 starter models are proposals: M1 treats every facet as narrow and sets the prefactor to one against broad-face prefactor data; M2 lacks a rule for how the response changes with width.

Open because hard. The equilibrium (at-rest) shape: one experiment in 1985 is "the sole experimental investigation", and its crystal probably never reached equilibrium (printed p. 65). The link between surface premelting, predicted by Faraday in 1859, and growth: "no concrete, well-established physical connection" (printed p. 55). The pyramidal step energy: "only the basal and prism step energies have been measured to date" (printed p. 54). Trace-gas effects, from a 1948 butyl-alcohol observation onward: "much experimental evidence … and little understanding of any of it" (printed p. 170), with contamination control the obstacle. Whether plain air alters the kinetics: the monograph gives opposite verdicts at printed pp. 61 and 170, and the broad-face curves carry its flagged implicit assumption that attachment kinetics does not depend on background gas pressure (printed p. 145); Chapter 13 files the air question inside its hard trace-gas item, so it is listed here once. How the triangular asymmetry starts, and a full three-dimensional calculation of it.

Open because not yet done. Latent heat and thermal transport, omitted with a stated reason that is weakest near 0 °C (arXiv:2306.13087, p. 5); this is Chapter 13's one item left for later, and the other items in this paragraph are this episode's own classification. Pressure, seed and history as missing axes of the morphology diagram (printed p. 160). How the −14 °C dip depends on supply, since that inversion used a single far-field supply. The M2 width-transition rule. The proposed hollow-rim, supply-drop comparison (Episode 11). Live disputes between the two schools over functional form, supersaturation calibration and what the young-crystal transition means. Polycrystals, aggregates and riming lie outside models of a single crystal orientation.

Sources: `docs/education/chapters/13-the-frontier.html#why-bother`; `docs/education/chapters/13-the-frontier.html#working-hypothesis`; `docs/education/chapters/13-the-frontier.html#where-it-runs-out`; `docs/education/chapters/13-the-frontier.html#open-clock`; `docs/education/chapters/13-the-frontier.html#the-other-laboratory`; `docs/education/chapters/12-why-the-shape-flips.html#how-sure`; `docs/education/chapters/12-why-the-shape-flips.html#counting`; [Working hypothesis, 2023](https://arxiv.org/abs/2306.13087); [Chosen dip positions, 2020](https://arxiv.org/abs/2009.08404); [Dip temperatures not estimable from theory, 2020](https://arxiv.org/abs/2011.02353)

### Half and one tenth: two estimates for one face

Both numbers concern the same prism (side) facet near −14 °C; they are not two temperatures and not two faces. Working the corner-to-facet diffusion mechanism forward, a companion paper finds "a factor-of-two reduction in the effective" layer-nucleation barrier, which leaves about half of the broad-face value. Model-based inversion of the dedicated narrow-facet growth experiments puts the effective barrier at "about one-tenth of its broad-facet value". The same page calls the factor-of-two estimate "perhaps too small to reproduce the actual SDAK dip at -14 C" and concludes that "this basic picture is too simplistic to explain the observed SDAK phenomenon" (arXiv:2012.12916, p. 9).

The forward estimate uses rough inputs: a surface supersaturation near 1 percent, a corner radius near 100 nm, a surface-diffusion length called a rough estimate and a facet diffusion coefficient that could be wrong by an order of magnitude or more. The inversion depends on its growth model and on an inferred local supply that may carry systematic errors of perhaps a factor of two. The book behind this series calls the gap roughly fivefold and marks that arithmetic as its own, not the paper's. "Recovers about half" is therefore not a correct summary. Half and one tenth are amounts of barrier left, reached by two different routes, for the same face.

The broad-face curves and the dips together belong to what Libbrecht calls the comprehensive attachment kinetics (CAK) model: the barrier curves plus everything later added to them, including the edge-sharpening mechanism that, in his account, is largely responsible for thin plates near −15 °C and hollow columns near −5 °C in air. Part Two's "broad-facet CAK" label means the broad-face curves alone.

Sources: `docs/education/chapters/12-why-the-shape-flips.html#how-sure`; `docs/education/chapters/12-why-the-shape-flips.html#narrow-facets`; `docs/education/chapters/12-why-the-shape-flips.html#esi`; `docs/education/chapters/12-why-the-shape-flips.html#crossing-rule`; [Mechanism estimate and verdict, p. 9](https://arxiv.org/abs/2012.12916); [Witness-face uncertainty, pp. 9–10](https://arxiv.org/abs/2009.08404)

### The computer-grown crystals in this series

The crystal that opened the series, called Run B, is a recording from the project's Gravner–Griffeath lattice solver: a 1200 × 1200 × 48 lattice, seed 1, no noise, stopped at its 70,000-tick cap. Its cells are not molecules, its ticks are not seconds, its replay is time-compressed, and the series display exaggerates its thickness 2.6 times. The other computer-grown examples, in Episode 1's opening snowfall and in Episodes 2, 3, 4, 6 and 7, are recordings from the project's named snow-crystal catalogue, made with the same kind of Gravner–Griffeath solver; Episode 5 shows no recorded simulation. Each is a baseline example of one named crystal type, grown with settings selected to produce that type's look, and each carries the label "G–G named-direct model; unvalidated; ticks are not physical seconds". The catalogue states that its type labels are "not a claim that G-G parameters predict natural temperature/supersaturation occurrence". These are called catalogue crystals here, because Part Two uses "library" for a separate collection of measurements.

The Gravner–Griffeath rule freezes a boundary cell once the mass it has collected from the surrounding vapour passes a threshold set by how many of its neighbours are already frozen. Its thresholds are abstract settings: some make plates and some make columns, but none is labelled in degrees, so "what grows at −15 °C?" cannot be asked of it. That is why these crystals show resemblance, not prediction. The project's temperature-dependent model, which installs source-tabulated, fitted and model-inverted attachment parameterizations plus a few hand-chosen choices, is a different operator. It keeps the same kind of lattice; what changes is the rule. Every comparison with the Nakaya diagram came from that other operator, never from the catalogue crystals.

Sources: `docs/education/chapters/09-the-menagerie.html#one-rule`; `docs/education/chapters/14-what-we-are-building.html#the-gap`; `docs/education/chapters/13-the-frontier.html#modelling-2012`; [Gravner and Griffeath, 2009](https://doi.org/10.1103/PhysRevE.79.011601)

### The project's first headline comparison, with every caveat

Three versions of the project's temperature-dependent model were run across a grid of 204 temperature and supply conditions and scored against the Nakaya diagram by a rule written down before the runs. The rule sets aside conditions inside ambiguity bands around its own region boundaries and a cold region that accepts either habit, leaving 90 scored points in common. Those regions and boundaries are the scoring rule's own, set out in Part Two; this series does not present them as natural boundaries. On the common 90 points, the historical broad-face version matched 3; the version with the narrow-facet dips (M1) matched 54 (54 of 78 on its own scope); and the same version with only the dips switched off matched 5. None of the three produced a column anywhere the rule expected columns. Over all 204 runs, the broad-face version committed to neither plate nor column in 168. The first and main sweep carried the broad-face curves alone, with the narrow-facet dips deliberately switched off. M1 applies the dips on every face; M2's width rule is not implemented, so no version implemented the width-dependent form of the narrow-facet idea.

Every number carries these labels. Measured-only: they are recorded run outcomes. The frozen protocol's registered headline combined measured and grid-extrapolated classes; no artifact carries the extrapolated class, so these are measured-only counts, not the registered headline verdicts, and the phase closed under an amended gate. "Common 90" is a re-scoring on the broad-face version's scope, not a second measurement. Non-converged: the final numerical refinement ladder passed 36 of 64 comparisons and failed 28 on attached count, so the grid resolutions are published as not converged, and one size stratum was never verified. In-sample: M1's dips were placed using the Nakaya diagram, so its 54 is reproduction of a target it was tuned toward, not a prediction. Implementation-level: the drop from 54 to 5 when only the dips are switched off is a statement about this implementation and cannot establish that the physical narrow-facet effect causes habit. Confounded: the broad-face version and M1 also differ in their broad curves and prefactors, so their difference is not a clean dip test.

Two more cautions. "5 of 90" also names an earlier broad-face sweep that the project voided under its own scoring decision; never quote it without saying which. A separate closure check verified that the promised protocol was completed and the failures kept; that is not a model pass, and the project claims no validation. None of the four named held-out comparison families (growth rates against temperature and supply, size-dependent habit, pressure dependence, growth-history responses) has been frozen or run, and every recorded non-maker review round was an LLM review; there has been no human domain-expert review.

Sources: `docs/education/chapters/14-what-we-are-building.html#the-ending-first`; `docs/education/chapters/14-what-we-are-building.html#where-it-stands`; `docs/education/chapters/13-the-frontier.html#why-bother`; `docs/education/chapters/17-a-model-that-can-be-wrong.html#in-sample`; `docs/education/chapters/17-a-model-that-can-be-wrong.html#held-out`

### Claims this episode does not repeat, and why

Cubic ice. The older statement that pure cubic ice had never been definitively observed is out of date: a 2020 experiment reported stacking-disorder-free cubic ice, and a 2023 study imaged its molecular growth at 102 kelvin. Whether cubic ice occurs in atmospheric snow is still open, and neither result makes it common there. Imaging. Statements that nothing has imaged the growing ice surface at the molecular scale need care: optical microscopy has watched elementary steps, each one molecular layer high, appear and spread on the basal faces of ice crystals growing from vapour (Sazaki and colleagues, PNAS, 2010), although it does not resolve individual molecules. This episode therefore says that microscopes have watched single molecular layers spread, and that no experiment has yet watched, molecule by molecule, which arrivals join a growing face at snowfall temperatures. This note rests on the paper's abstract and published summaries, not a full-text review; other recent surface-imaging work was not checked.

Closing overstatements. The image, in the book behind this series, of two dials, temperature and spare vapour, that produce the whole pattern when turned conflicts with the book's own point that the diagram lacks axes for pressure, seed and history; this episode does not use it. Its line that everything below the surface skin is in hand is also set aside, because heat, pressure, history and polycrystals are not surface questions; the episode says the frontier is mostly at the surface. Attributed assessments stay attributed: "only viable option" and "required to explain" are the author's judgments.

Dated status. The Penn State paper that the book behind this series described from its data archive has since been published: Harrington and Pokrifka, Revisiting Theories for the Growth of Solid and Hollow Single Crystals: The Importance of Step-Source Location, Journal of the Atmospheric Sciences, July 2026. Its abstract motivates rim-width measurements alongside axis growth, which strengthens the purpose of Episode 11's proposed test without settling a mechanism; this note rests on the abstract, not a full-text review. Chapter 14's opening once described curve crossings as deciding tall versus wide, which contradicted Chapter 12 and Episode 10; the version this episode links to has that sentence corrected, and the link stays disabled until the corrected page is public.

Sources: `docs/education/chapters/13-the-frontier.html#where-it-runs-out`; `docs/education/chapters/13-the-frontier.html#why-bother`; `docs/education/chapters/13-the-frontier.html#the-other-laboratory`; `docs/education/chapters/12-why-the-shape-flips.html#crossing-rule`; [Stacking-disorder-free cubic ice, 2020](https://doi.org/10.1038/s41467-020-14346-5); [Molecular growth of cubic ice, 2023](https://doi.org/10.1038/s41586-023-05864-5); [Harrington and Pokrifka, 2026](https://journals.ametsoc.org/view/journals/atsc/aop/JAS-D-26-0016.1/JAS-D-26-0016.1.xml); [Sazaki and colleagues, elementary steps on growing ice, 2010](https://doi.org/10.1073/pnas.1008866107)

### Looking at snow yourself

A folding magnifier of about four or five times is enough; the monograph calls that "about right, as this provides a reasonable amount of detail with a fairly wide field of view" (printed p. 445). Use a matte dark card, such as dark-blue foam board, and let it get properly cold outside first so crystals do not melt on contact. Catch them in mid-fall and look at once: crystals that have landed on the ground stick together and soon change shape.

Large stellar crystals appear when the cloud temperature is near −15 °C (Figure 1.1 caption). The book behind this series infers that cold days are when they reach the ground intact; that is a practical tip, not a measured rule. Henry David Thoreau, watching crystals land on his coat in 1856, wrote: "How full of the creative genius is the air in which these are generated! I should hardly admire more if real stars fell and lodged on my coat."

Sources: `docs/education/chapters/10-how-we-know.html#go-and-look`; `docs/education/chapters/13-the-frontier.html#why-bother`

### Topics the series deferred, and why

Negative crystals. Supersaturation can be negative: in air drier than the ice balance, the transport problem reverses and ice sublimates, with tips and corners retreating fastest, so a sublimation movie run backward is not a growth movie. A negative snow crystal in the literal sense is a crystal-shaped void inside ice. Episode 3 deferred this; it stays in the reader because the continuing crystal of this episode only grows.

Fall orientation. A falling crystal meets the air at its terminal speed, and the flow can orient it and refresh part of its depleted halo: thin plates tend to fall with their broad faces roughly horizontal, and slender columns with their long axis horizontal, with the best alignment expected roughly between 0.1 and 1 mm and substantial uncertainty. Episode 3 deferred it; it does not change the ledger's settled, proposed or open items, so it stays here.

Two-branch prism kinetics. A later faceting model replaces the single layer-nucleation law on prism facets with the sum of two processes; the second, warm-end process is the paper's convenient parameterization of an effect it calls speculative, absent by −15 °C. Episode 4 deferred it to Episodes 9 and 11, and only Episode 11's reader mentioned it. It stays in the reader because it does not change the narrow-edge status given in E12-09, and Part Two treats it as one of the project's hypotheses.

Sources: `docs/education/chapters/04-the-fuel-supply.html#when-growth-runs-backward`; `docs/education/chapters/04-the-fuel-supply.html#falling-through-the-supply`; `docs/education/chapters/05-the-restless-surface.html#two-processes-or-two-branches`; [Two-process faceting model](https://arxiv.org/abs/2306.04042)

## Source dispositions

Earlier episodes (all recalled in narration with a labelled callback drawn by that episode's own function):

- Episode 1: bookend picture in E12-01; answer in E12-02 (callback to the two-surface comparison); closing line "There was no drawing of those branches inside the seed" in E12-11, spoken over direct labels on the magnified E12 crystal (no second Episode 1 callback, so the closing sentences carry no extra cut). The catalogue crystals of its opening snowfall are identified in reader 4. The 100,000-droplet figure and nucleation examples stay in Episode 1 and reader 1.
- Episode 2: E12-02 (ring-to-sheet callback; exact echo of "the hexagon belongs to the arrangement of molecules, not to one molecule"; arriving-versus-joining warning). Cubic-ice currency note in reader 6.
- Episode 3: E12-03 (built-in recap callback; exact echo of the two waits). Heat omission returns as an open item in E12-10.
- Episode 4: E12-03 (staged recap callback, paragraph 1 only; "Slow does not mean stopped"; the correction's limit shown on the crystal's corner). Its flat-face mechanism gets no ledger badge in E12-08, because the ledger sources do not classify it. Two-branch prism kinetics deferred to reader 8 with reason.
- Episode 5: E12-04 (replay callback; exact echo "shape changes delivery; delivery changes growth; growth changes shape").
- Episode 6: E12-04 (map callback, with the heading "A description; not yet a complete explanation" kept in the crop; the cloud-tunnel pair's extra-vapour qualification now spoken); its promise is carried in E12-05, answered as far as the sources allow in E12-08 and E12-09, and its model half is stated as still open in E12-09 and E12-12. No band boundaries, bins or cold-column region.
- Episode 7: E12-05 (capped-column callback; exact echo "The crystal is evidence to interpret, not a complete written log").
- Episode 8: E12-05 (optics callback; exact echo "The light measured a change; the clock made it a rate"; prediction hold on delivery versus surface, answered with "The rate alone does not separate them").
- Episode 9: E12-06 (reference-comparison callback; exact echo "We inferred it from motion and a model; we did not count successful molecular collisions"). The signpost that measurement was needed to explain Episode 6's map is spoken in E12-05, repairing the audit's E09-01 finding without an Episode 9 edit.
- Episode 10: E12-06 (crowding callback; the "in ordinary air" condition spoken) and E12-09 (barrier-bar callback; half and one tenth restated briefly without repeating Episode 10's sentence; in-sample windows spoken, and the facet-dependent premelting caveat recalled as Episode 10's warning). E12-06 and E12-09 describe the pending E10 revision, which is why E12 is recorded only with or after it.
- Episode 11: E12-07 (proposed-test callback), E12-10 (width-rule callback without the M1/M2 labels) and E12-12 (Episode 11's standard applied to the crystal that opened the series, without repeating the pending E11-02 disclosure as if it were new).

Chapter 13 frontier items:

- Four kinds of line and the epistemic line conventions: earlier episodes (Episode 9 inference chain; Episode 11 reader); used here as the measured / fitted / proposed distinction without re-teaching.
- Working hypothesis and chosen numbers: taught here in E12-09 (status, attributed assessment, chosen placement, in-sample prediction hold, separate model-based support). Exact dip formulas and the logarithm convention stay in the chapter and Episodes 10 and 11 readers.
- Modelling in 2012: earlier episode (Episode 11); recalled in E12-07 and applied to the series' own crystals in E12-12; detail in reader 4.
- Two starter models: earlier episode (Episode 11); the missing width rule is spoken as an open item in E12-10, and E12-12 speaks of the version that put the windows on every face; M1 and M2 names are reader-only here, and the E12-10 callback omits their labels.
- Triangular stress test: earlier episode (Episode 11); not recalled in narration because the recap follows one continuing crystal's causal build and the triangle is a separate stress test; its open origin is in reader 2.
- Six places the account runs out: (1) cubic ice, earlier episode (Episode 2 narration already corrected) and reader 6, not narrated here because the dated claim is superseded and its open part does not bear on this crystal; (2) at-rest shape, reader 2, not narrated: the series never taught equilibrium shape beyond Episode 4's warning that the lowest surface energy does not explain a growing shape, and E12-10 keeps one card per spoken item in a short list; (3) premelting and growth, taught here (E12-09 caveat, E12-10 open item); (4) pyramidal step energy, earlier episode (Episode 11) and reader 2, not narrated because this crystal has no pyramidal faces; (5) trace gases, taught here (E12-10), with the plain-air dispute also spoken there as a hard item; (6) latent heat, taught here (E12-10).
- Missing axes of the diagram (pressure, seed, history): partly taught here (the plain-air question and the broad-face curves' assumption in E12-10; history recalled in E12-05) and in Episode 6; full statement in reader 2.
- Confidence map and open-question clock: interactive chapter figures; E12-08 to E12-10 perform the same sorting on the continuing crystal; dates in reader 2.
- A field of a handful of people: taught here in E12-11 with the attributed quotation and the difficulty-versus-neglect distinction. The funding quotations ("forbidden research", the credit card) are deliberately not narrated: they describe one researcher's funding, not the field.
- The other laboratory: taught here in one sentence (E12-11); instruments were performed in Episodes 8 and 9; disputes and the 2026 publication in readers 2 and 6.
- Why bother: settled account taught here (E12-08, using the vetted wording); the frontier location taught in E12-10 as "mostly at the surface"; "we do not know" and the magnifier invitation taught in E12-11; Thoreau in reader 7. Deliberately not repeated: "two dials", "everything under that skin is in hand" and the claim that nothing has photographed the surface a molecule at a time (reader 6 explains why). The Feynman quotation is omitted because it does not advance the ledger. The chapter's Part Two handoff numbers are reader-only (reader 5).

Deferred topics: negative crystals, fall orientation and two-branch prism kinetics are placed in reader 8, each with its reason; none was taught in narration because none changes the settled, proposed or open status given in this episode.

Part Two: Chapter 14 is the footer destination and the source for E12-12, including its point that a model with temperature as an input can be asked a question and be wrong; Chapters 15 and 17 are previewed by the "two labels" card and the in-sample prediction hold; Chapter 30's statement that the untuned-mechanism question is unanswered is why the closing question stays on building a model that is allowed to fail rather than on why a tuned version still missed; scores, arms, scopes and numerical-ladder results are reader-only. No maker chronology, dates, thoughts or phase numbers are narrated, and the synthetic narrator never speaks as the maker.

## Continuing-crystal build and review contract

| Scene | Added to the one E12 crystal (never reset) | Callback (episode's own drawer, synthetic cue) | Prediction hold |
| --- | --- | --- | --- |
| 01 | drop beside a small plate; tray; two question cards | none (E12-owned) | none |
| 02 | seed mark; six direction ticks; arrive/join legend | E01 scene 5 (fallback scene 4); E02-06 p0 | none |
| 03 | halo and net-flow arrows; flat face with steps; corner selected with "richer air" | E03-09 p0 recap; E04-09 p1 (the limit is shown on the crystal) | none |
| 04 | six arms, side branches, first reframing ("view widened"); thickness strip with "why?"; map thumbnail | E05-09 p0 replay; E06-07 p2 map, E06-09 p1 "unexplained" (heading kept) | none |
| 05 | "earlier ice" highlight; top-face tick and clock with "how fast? / why?"; suspect tags | E07-02 p2 caps; E08-06 p1 optics | P3 → P4: air or surface, from the rate alone? answer "The rate alone does not separate them." |
| 06 | response bracket on the top face; narrow-edge close-up and addition at one arm tip; edge-to-strip link | E09-02 p2; E10-04 p1 (no question key) | none |
| 07 | test markers on the narrow edge; ledger bins | E11-08 p1 (outcomes withheld) | none |
| 08 | Settled badges; filled-square Observed badge; tray slot marks | none | none |
| 09 | Leading-proposal badge on the narrow edge; windows strip; skin inset; half-disc thickness badge; first header card answered | E10-09 p0 bars (no replay) | P2 → P3: what does a match on the same map show? answer "Much less than it seems." |
| 10 | surface zoom; second reframing ("view reduced"); six open cards, three per tray | E11-03 p2 width bracket (no M1/M2 labels) | none |
| 11 | magnified crystal with three direct labels; seed-first highlight | none (the Episode 1 line is spoken) | none |
| 12 | third reframing ("view reduced"); separate model frame and cards; optional single Run B recording, labelled | none (E12-owned) | none |

Callback sequence (all layouts; required in cut mode, where the crystal and a callback share one band): (1) select the feature on the crystal on the clause that introduces it; (2) cut to the callback for its echo sentences, revealing at most four of its keys in steps and then its final pose; (3) cut back to the crystal; (4) perform the crystal's addition on a clause that names it. Each scene's visual notes give the clauses for steps 1 and 4, so no crystal change happens off screen.

Narrow-layout rule (360×351): after its scene, each feature's labels retire and the feature keeps only a small number glyph matching its tray slot; after E12-01 the question header collapses to two 12 px tabs, "How much?" and "Where?"; the header and tray hide while a callback fills the band; the tray is one row of 8 px dots at the very bottom, with the thickness strip above it; from E12-07 the bins take the map thumbnail's place in the bottom band, and the thumbnail returns only as a temporary overlay while E12-08 and E12-09 act on it. The E12-06 and E12-07 end states are required narrow capture poses, alongside every Still pose.

Cue phrases: every phrase quoted in these visual notes as a reveal point (after "at", or as an answer onset) must occur exactly once in its scene's narration, in the paragraph the notes assign, matched as the website's phrase clock matches (whole words, ignoring case, so a phrase that is also the tail of an earlier sentence is ambiguous). This revision was checked against that rule; the website implementation should add the same check to its tests.

Round 1 must be a non-author adversarial source review of this script (Rule 13) plus an arc review asking whether the series now ends: whether each episode's question and answer is recognizable, whether Episode 6's question is closed as far as the sources allow, and whether the what's-next scene invents status or chronology. Round 2 must inspect a complete local-voice rehearsal with chronological desktop and 360×351 captures, including both prediction holds, every callback crop and the Still mode poses. Record editorial observations, technical playback and the absence of human listening and uncoached learner testing separately. Before any public release, E05–E11 must be public first, because the E12 bundle carries their canvas strings.
