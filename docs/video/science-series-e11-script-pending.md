# E11 — What would count as an explanation?

Pending revision awaiting recording, staged beside the recorded `science-series-e11-script.md`, which stays byte-identical and bound to the recorded audio: E11-02 and E11-09 carry the finale-audit repairs, and the other seven scenes are unchanged. Episode 11 is no longer the final episode: the closing Episode 12 follows it. All drawings are identified teaching schematics; none is an unreported simulation or a new measurement. The test named at the ending is a proposed comparison, not a claim that this project executed it. Optional reading is unvoiced.

## E11-01 — A shape is a beginning

### Narration

Here are two ways to make the same six-armed outline. One follows a drawing recipe. The other lets a boundary grow, with water delivered through the air and a rule for adding ice. Looking only at the finished outlines, we might struggle to tell them apart.

Now give both a harder job. Begin from the same small crystal, specify the air conditions, and ask how far each face will move during a known time. Keep that starting outline beside the result. Which comparison tells us more about how a crystal grows: the final resemblance, or a prediction of the change?

The prediction of the change. A convincing outline is useful, but it does not tell us whether the rules predict the growth speed or the response to different air. In this episode, we will keep the beautiful shapes and ask more of their explanations.

### Visual and sources

Purpose: distinguish reproduction of an outline from a growth prediction without asserting that all drawing algorithms are scientifically useless. Two labelled constructions form the same illustrative branched outline: a path is drawn on the left, boundary is progressively added on the right. Both are explicitly teaching sketches, not measured/model data. At “same small crystal” reset explicitly to a common hexagonal starting mark. Equal clocks run while the proposed boundaries separate, with starting marks retained. Prediction answer words and the informative comparison emphasis wait until paragraph 2 after the hold. No fictitious experimental pass/fail badge.

Prerequisites: earlier measured face advance and evolving delivery field. Invariant: common starting outline, common scale and elapsed time. Likely wrong inference: a realistic rendered crystal establishes measured growth accuracy. Narrow layout: two large outlines, one shared conditions/time strip, no four-panel dashboard. Sources: `docs/education/chapters/13-the-frontier.html#modelling-2012`; [Libbrecht 2012, numerical approaches, pp. 2–3](https://arxiv.org/abs/1211.5555).

## E11-02 — Different ways to move a boundary

### Narration

There are different ways to do that growing calculation. One follows a moving boundary, or spreads the boundary across a thin transition region. Another divides space into cells: water moves between them, and boundary cells become ice. Watch the edge advance in both descriptions. The mesh is the computer's bookkeeping, not the arrangement of water molecules.

The challenge is to keep both flat faces and branching. Select a flat side, then the sharp corner where a branch can start. A method that rounds away the face loses one feature; a method that only stamps a hexagon misses the developing branches. A useful model must let those demands coexist.

In a survey published in twenty twelve, Libbrecht described cellular models by Gravner and Griffeath that produced impressive faceted, branching structures. Their surface rules were chosen to reproduce behaviour at a larger scale, rather than measured molecular laws. That was a real achievement in representing shapes. It did not, by itself, establish accurate growth across measured temperatures and water supplies. The computer-grown crystals shown earlier in this series come from this kind of cellular rule, run by the project behind the series. The settings for those crystals were chosen, some by eye, to make their shapes. There is no temperature in them. They show that the rule can grow a convincing snow crystal, not that it predicts which crystal real air will grow. Later models must earn that comparison from their own results.

### Visual and sources

Purpose: compare concrete numerical representations before naming authors. A retained hexagon develops flat-sided protrusions in two representations: continuous moving outline/soft boundary ribbon and cell-grid fill. Each cumulative boundary expands rather than swapping completed pictures. Select one flat run and linked corner in both. Two deliberately labelled failure sketches then show excessive rounding and a faceted outline with no branches; these illustrate requirements, not claims about all modern methods. Restore both features together before the historical caption. Show “2012 survey” beside source-scoped status, not a current league table. No code ticks or cell units are called physical time.

Pending revision (paragraph 3 only; paragraphs 1–2 unchanged). Production reveals `history`, `rules`, `achievement`, `notvalidated` and `later` keep their exact sentences, keys and drawing; four new sentences sit between `notvalidated` and `later`, each one reveal whose phrase is the whole sentence (quoted below by its opening), drawn only when its pending-only key exists. `seriesCrystals` at “The computer-grown crystals shown earlier in this series”: the cell-grid construction stays as the rule's identity; beside it appear three small flat silhouettes (plate, star, column) drawn as 2D sketches, linked to the grid by a bracket labelled “earlier episodes' computer-grown crystals · model output, not specimens · run by the project behind this series”. No WebGL recording is mounted and no specific recording is implied. `chosenSettings` at “The settings for those crystals were chosen, some by eye,”: a small settings panel with three abstract knobs appears under the grid, each tagged “chosen”, one also “by eye”; an arrow runs from the panel to the silhouettes. `noTemperature` at “There is no temperature in them.”: a dashed, empty thermometer slot appears on the same panel, labelled “no temperature input”. `drawNotPredict` at “They show that the rule can grow”: two stacked lines under the silhouettes, a solid “grows a convincing shape” and a dashed “predicts which crystal given air grows · not shown”; no tick, cross, pass or fail badge. Caption stays “Resemblance does not establish growth accuracy.” through these reveals. Likely wrong inference: these crystals are the project's temperature-dependent model, or natural specimens, or Gravner and Griffeath chose the series' settings; the spoken “The settings for those crystals” keeps the two “chosen” sentences' referents apart, the panel's missing thermometer and the model-output label address the first two, and nothing in this scene shows the project's other operator or any score. Narrow layout: silhouettes and panel replace the left boundary construction; the grid stays at right.

Sources: `docs/education/chapters/13-the-frontier.html#modelling-2012`; `docs/education/chapters/14-what-we-are-building.html#the-gap`; [2012 survey, pp. 2–3](https://arxiv.org/abs/1211.5555); [Gravner and Griffeath, three-dimensional cellular model](https://doi.org/10.1103/PhysRevE.79.011601). Series-crystal provenance is a repository record, not a chapter claim. The recordings the episodes mount (the opening snowfall's inspectable crystals and the E02–E07 recordings) are drawn from the six named-direct catalogue entries in the website's `src/growth/recorded-models.json`, each labelled “G–G named-direct model; unvalidated; ticks are not physical seconds”. Their source paths (`out/named-crystal-catalog/final-resolution-{a,b,c}-v1/…`) are the output roots of the named-crystal catalogue's final-resolution production (`scripts/named-crystal-final-resolution-production.ts` and `scripts/named-crystal-final-resolution-production-c.ts`; manifests `docs/named-snow-crystal-final-resolution-production.json` and `docs/named-snow-crystal-final-resolution-production-c.json`), whose named habit presets start from baseline settings that include transcribed Gravner–Griffeath figure settings (for example `fig30` for hollow columns and `fig37` for capped columns); each trio was selected after visual review (`docs/named-snow-crystal-final-direct-decisions.json`), and the catalogue's type labels are “not a claim that G-G parameters predict natural temperature/supersaturation occurrence” (`docs/plans/named-crystal-animation-catalog.md`). The opening Run B is a separate `gutcheck-growth-v1` Gravner–Griffeath run (website `README.md`). The growth-fleet library (`scripts/gutcheck-growth-fleet.ts`, “eyeball assets, not gate evidence”) is not mounted in any episode and is not the source of these recordings. The `GGThreshold` operator has no temperature input and its tick is not physical time (`AGENTS.md`).

## E11-03 — What changes when a face narrows?

### Narration

Keep one broad face beside one narrow strip, at the same temperature and local water supply. The previous episode asked whether they can have different surface responses. A compact model can ignore that distinction and give both the response intended for narrow facets. The twenty twenty-three proposal calls that first approximation M one.

A second proposal keeps the distinction. On the broad face, use the broad-face relation. As the selected strip becomes narrow, use a relation with a reduced difficulty in starting new layers. This proposal is called M two. The change is in the surface rule; the surrounding diffusion calculation is still needed.

But the switch on our drawing is a question the model must answer. How narrow is narrow, and how should the response change between the two limits? The paper does not supply a complete transition law. M one also sets the overall response scale to one, a simplifying choice that some broad-face measurements do not support. These are useful starting proposals, with assumptions we can test, rather than two finished explanations.

### Visual and sources

Purpose: perform policy assignment, not fabricate a forward calculation. Retain equal temperature/supply markers and original broad face. In upper comparison, identical lower layer-start barriers/response-rule tokens reach both wide and narrow regions. In lower comparison, broad rule remains on wide region while selected strip narrows and receives narrow rule. Names M1/M2 appear only after physical distinction. At the transition question, move a width bracket continuously between limits and show the intervening rule region as unresolved rather than silently selecting a threshold. No numerical growth speed output. A separate reference scale shows M1's chosen 1, with “choice” attached. Sources: `docs/education/chapters/13-the-frontier.html#starter-models`; [2023 starter models, pp. 5–7](https://arxiv.org/abs/2306.13087); [Broad-face measurements near −2 °C](https://arxiv.org/abs/2004.06212).

## E11-04 — A shape that follows the grid

### Narration

Here is a trap that a finished picture can hide. Suppose a calculation makes a plate only one cell thick. Keep its physical scale fixed and halve the cell width. If the new plate is still one cell thick, its physical thickness has also halved. The smaller cells have changed the answer.

We need a physical reason for sharp features to stop shrinking with the grid. Surface energy supplies one: strong curvature changes the vapour balance at an ice surface. A highly curved surface needs a higher vapour level to balance ice loss. At the same local vapour level, less surplus remains to drive growth. The twenty twenty-three model proposal explicitly includes this effect to avoid unrealistically thin features.

That does not give us permission to round every crystal into a ball. Surface energy and the difficulty of adding molecules to different faces do different jobs. A numerical check asks whether refining the grid preserves the quantities we intend to predict. An experimental check asks whether those quantities agree with a real crystal. Passing one check does not pass the other.

### Visual and sources

Purpose: numerical convergence versus experimental agreement. Diagram states “illustrative grid check”. First coarse grid: plate one cell thick, fixed physical ruler and extent. Refine grid in place; one-cell plate halves physical thickness while the previous thickness outline stays. Keep reference ruler fixed. Next link a zoomed tip to parent. At the same local supply, compare broad and sharply curved regions: show the higher balance reference at the sharp feature and the smaller remaining surplus. Do this before any illustrative finite-width interface is restored. Do not claim a solver was executed or that surface energy alone fixes every grid defect. Finally separate a refinement comparison from an experiment-outline/measurement comparison, retaining visible failure in the first until resolved. Sources: `docs/education/chapters/13-the-frontier.html#starter-models`; [2023 proposal, pp. 5, 7](https://arxiv.org/abs/2306.13087).

## E11-05 — A triangle under controlled conditions

### Narration

Now return to a real challenge for a six-sided crystal: a triangular plate. In one published experiment, plates grew from the tips of needle seeds at minus fourteen degrees Celsius, in air at about one atmosphere. Keep that seed, temperature and pressure beside the shapes as the water supply changes.

Below about six percent extra vapour relative to ice balance, the tips produced slow blocky forms or simple columns instead of plates. At higher supply, plates appeared. Within a narrow range of supply, plates with a three-fold outline became almost all of the observed plates. These are different growth trials, not one crystal turning its humidity dial.

The outline is three-sided, but its underlying crystal arrangement is still hexagonal. In the triangular form, three alternating side faces advance differently from the other three. That is a demanding test: an explanation must account for when the difference appears, not merely accept a triangle that we drew at the start.

### Visual and sources

Purpose: retain specific controls and separate population outcomes from one-specimen history. Three successive labelled trials preserve needle-seed origin, −14 °C, one-atmosphere condition and common size convention; each trial is explicitly new. Low-supply blocky extension, higher-supply plate, selected narrow-range triangular plate; no invented threshold bounds or numeric frequencies. All are teaching reconstructions of reported forms, not source photographs. Select alternating prism facets and keep a small hexagonal lattice inset linked to triangle. Do not suggest the precise frequencies apply outside these conditions. Sources: `docs/education/chapters/13-the-frontier.html#triangular-test`; `docs/education/chapters/09-the-menagerie.html#twins`; [Triangular crystal experiment, pp. 7–11](https://arxiv.org/abs/2106.09809).

## E11-06 — Drawing the difference is not deriving it

### Narration

Start a separate geometric demonstration from a small hexagon. Mark alternate sides in two groups. First let all six sides move out at the same speed: the outline stays hexagonal. Reset to the same starting mark. Now assign one group a faster outward speed. The two groups still have the same molecular orientation relationships as before.

As they move, the three faster faces shrink in length while the slower faces occupy more of the perimeter. They can leave a triangular outline. We imposed that speed difference with a control. Have we therefore explained why a real crystal develops it?

No. We have shown what the difference can do. The triangular-growth paper proposes that the tiny terrace at a sharp tip could make new layers easier to start, extending the narrow-facet idea into three dimensions. Follow the selected tip into the close-up: the terrace shrinks in two directions. That is a proposed cause to calculate and test. The imposed-speed drawing neither derives it nor tells us how the first asymmetry began.

### Visual and sources

Purpose: distinguish kinematic construction from mechanism. Use half-plane intersection of six advancing support lines, not a radial morph. First all equal, then explicit reset retains dashed original. Second alternate speeds set by visible two-group control; equal clock accompanies advance. Faster normal motion makes fast facets recede from the perimeter. Prediction hold before “No.” keeps actual imposed cause visible but withholds mechanism close-up/answer labels. Then connect a selected tip to oblique tiny top terrace whose two in-plane extents shrink, label “proposed”; do not animate unseen molecules as observation. Sources: `docs/education/chapters/13-the-frontier.html#triangular-test`; `docs/education/chapters/09-the-menagerie.html#twins`; [Triangular-growth hypothesis and geometric condition, pp. 9–18](https://arxiv.org/abs/2106.09809).

## E11-07 — The shapes a model leaves out

### Narration

A second kind of test asks what the model can represent at all. Keep a single crystal's orientation visible, then place another grain beside it at a different angle. A cluster can contain both. A model restricted to one orientation cannot explain that cluster's full growth simply by adjusting its water supply.

Now inspect a column whose end has sloping faces. These pyramidal faces are different from the flat end and side faces we have followed. A rule that describes only those familiar faces needs additional information to predict growth on the sloping ones. The missing face is a missing physical question, not a label to add afterwards.

Finally keep a column while plates grow from its ends. Its earlier ice survives the change in conditions. A model that forgets the starting shape or the growth history can miss this result even if it uses the final temperature correctly. The diversity of snow crystals tells us which assumptions to challenge: orientation, surface type and history, as well as the air around them.

### Visual and sources

Purpose: concrete scope tests without retelling taxonomy. Sequentially retain labelled two-grain orientations with interior lattice marks, then a newly introduced prism whose flat end becomes a selected sloped roof in a separate shape comparison (not a growing transformation claim), then a column and cumulative end plates in explicitly changed growth conditions. Single-orientation frame encloses only one grain; add second frame at different angle so unsupported domain is visible. Two-face rule markers land on top/side but not pyramidal roof. Retained blue core plus bright added plates makes history visible. Sources: `docs/education/chapters/09-the-menagerie.html#twins`; `docs/education/chapters/09-the-menagerie.html#pyramidal`; `docs/education/chapters/09-the-menagerie.html#no-clean-boxes`; `docs/education/chapters/13-the-frontier.html#where-it-runs-out`.

## E11-08 — Ask for the next prediction

### Narration

Here is a useful next test to design. Grow a hollow crystal while recording its width, height and the thickness of the rim around its opening. Then reduce the chamber's water supply at a recorded moment, and continue measuring the same crystal. Keep its earlier outline, the size readings and the change in supply together.

Before looking at that later growth, calculate predictions. To isolate a proposed surface effect, keep the seed, transport calculation and other inputs matched, and change only the surface rule under investigation. Record how that rule depends on width; do not leave the missing transition hidden. Fitting the earlier part can set parameters, but the later observations must be kept separate from that fitting.

Compare the predicted changes with the later dimensions and rim thickness, including measurement uncertainty. The observations might distinguish the predictions, disagree with both, or be too uncertain to choose. An honest failure tells us where to investigate; it does not authorize retuning the same comparison and calling it a new prediction. This is a proposed test, not a result we have already obtained.

### Visual and sources

Purpose: specific falsifiable next test based on measured size histories and supply interventions. Teaching protocol diagram, not measurements. A single hollow column grows with width/height/rim brackets, common clock, supply lowered at a marked instant; retain earlier outline and measured-axis identities. Keep all later growth/readings covered until the predictions are fixed; first-paragraph “continue measuring” announces the protocol, not a visible result. Plot space uses no invented numerical data. Only after “calculate predictions” extend two clearly labelled hypothetical paths beyond fit region; vertical divider and cover show withheld later observation. Show potential distinguish/miss-both/overlap outcome schematics one at a time, explicitly “possible outcome”. Preserve uncertainty bars rather than checking a winner. No curve is labelled an actual M1/M2 computation; proposal requires a supplied/frozen width law first. Sources: `docs/education/chapters/13-the-frontier.html#starter-models`; `docs/education/chapters/13-the-frontier.html#the-other-laboratory`; [2023 model-to-experiment programme, pp. 7–8](https://arxiv.org/abs/2306.13087); [2026 step-source comparison, abstract](https://journals.ametsoc.org/view/journals/atsc/aop/JAS-D-26-0016.1/JAS-D-26-0016.1.xml).

## E11-09 — From resemblance to prediction

### Narration

Return to this episode's question: what would count as an explanation? A convincing outline, like the matching pair we began with, is a resemblance. The triangle we drew by choosing face speeds is a demonstration: it shows what a speed difference can do, not why it arises. The tiny terrace at a sharp tip is a proposed mechanism, a cause still to be calculated and tested. A prediction goes furthest: it is fixed before the result is seen, and checked against observations that were not used to set it.

The hollow-crystal test we just designed asks for exactly that: each surface rule's prediction for the rim, written down before the later growth is seen. Even a mismatch would teach us more than another convincing picture.

So the strongest explanation does more than match a crystal's outline: it names a cause, and predicts a change before the crystal shows it. With that standard, how much of a snow crystal can we now explain? In the closing episode, we will look back across the whole investigation, from the first small seed to this narrow rim. We will separate what is settled, what is a leading proposal, and what is still open. Then we will open the next story: an attempt, by the project behind this series, to build a model that has temperature in it and is allowed to fail.

### Visual and sources

Purpose: answer this episode's own question on screen, make the proposed test the concrete next step, and hand off to the closing E12. Not a whole-series recap: E12 owns the look back and the settled/proposed/open ledger. Paragraph 2 recalls E11-08's protocol in one sentence instead of restating its steps, because E11-08 has just taught it and E12-07 recalls it again. The whole section is new in the pending revision. Every sentence is one reveal with a new pending-only key, and each reveal phrase is its whole sentence, so the reveals tile every paragraph (the quotations below give each sentence's opening); the production keys of this scene (`seed`, `six`, `supply`, `branch`, `nopicture`, `keep`, `arrive`, `layers`, `knowledge`, `distinct`, `test`, `fail`, `outline`, `record`) are absent from the pending cues and are not reused with new meanings, so the production star-regrowth composition and its caption “A record of growth. A question we can test.” stay untouched. The pending composition is drawn only when a pending-only key is present. Heading: “What would count as an explanation?” No pass/fail badge, score, measured value, maker chronology or project result anywhere in the scene.

Paragraph 1 (the answer, as a ladder built from this episode's own pictures):
- `question` “Return to this episode's question: what would count as an explanation?”: an empty four-rung ladder appears at right; at left, E11-01's two matching six-armed outlines (drawn path, grown boundary) return small with their labels.
- `resemblance` “A convincing outline, like the matching pair we began with, is a resemblance.”: a leader joins the pair to the bottom rung, labelled “resemblance”.
- `demonstration` “The triangle we drew by choosing face speeds is a demonstration:”: E11-06's construction returns small, the dashed starting hexagon kept and the visible two-group speed control set, the three fast faces receding to a triangle; it joins the second rung, “demonstration · speeds chosen”, with a small “not why” tag on the speed control. The outlines shrink to a rung icon.
- `mechanism` “The tiny terrace at a sharp tip is a proposed mechanism,”: a selected tip on that triangle links to E11-06's oblique tiny terrace, shrinking in two directions, labelled “proposed”; it joins the third rung, “mechanism · proposed”.
- `prediction` “A prediction goes furthest:”: the top rung lights, “prediction”, with a small divider beside it, “fit earlier | test later”, whose later side is covered.

Paragraph 2 (the concrete test):
- `designed` “The hollow-crystal test we just designed asks for exactly that:” (whole sentence, one reveal; it replaces the earlier `rimRecord`, `supplyDrop` and `predictFirst` reveals, which are retired): the ladder slides to a narrow reference strip at the edge; E11-08's hollow column returns in one step in its already-taught protocol state, not replayed: earlier outline kept dashed, width, height and rim brackets, the supply strip stepped down at a marked instant on the common clock, a cover over the later growth, and beyond the divider two dashed paths, “rule A · prediction” and “rule B · prediction”, neither labelled as a computed M one or M two output. The column is joined to the top rung by a leader; label “proposed test · no result shown”.
- `mismatch` “Even a mismatch would teach us more than another convincing picture.”: one possible-outcome mark, labelled “possible outcome”, appears off both paths, with a short arrow “where to look next”; at the same time the resemblance rung icon dims. The cover stays on: no observation is shown.

Paragraph 3 (the standard, then the hand-off):
- `standard` “So the strongest explanation does more than match a crystal's outline:”: in the reference strip, the mechanism and prediction rungs join under one bracket, “names a cause · predicts before looking”.
- `howMuch` “With that standard, how much of a snow crystal can we now explain?”: the test diagram shrinks to its rim; a small hexagonal seed appears at left, the selected rim stays at right, both on one baseline.
- `lookBack` “In the closing episode, we will look back across the whole investigation,”: a dotted route runs from the seed to the rim, labelled “Episode 12 · looking back”; no episode titles or recap icons are drawn along it.
- `ledger` “We will separate what is settled, what is a leading proposal, and what is still open.”: three empty bins appear under the route with E12-07's labels and shapes, “Settled” (filled disc), “Leading proposal” (half disc) and “Open” (open ring), distinguished by shape, not colour alone, and left empty so that E12-07's bins read as the same objects.
- `nextStory` “Then we will open the next story:”: an arrow leaves the rim past the right edge, labelled “next story · a model with temperature as an input, built so it can fail”; no crystal image from the earlier model recordings is attached to it.

Captions in order: “Resemblance · demonstration · mechanism · prediction”; “A proposed test asks for a prediction.”; “Episode 12: settled, leading proposal, still open.” Likely wrong inference: the proposed test has been run, or the project's model is the model that grew the earlier crystals; the permanent cover, “no result shown” label and separate next-story arrow prevent both. Narrow layout: ladder as a vertical strip at the left edge from paragraph 2 on; one diagram at a time in the centre. Footer (visual only): the next episode is Episode 12, the closing episode, shown as “Coming soon” while it is held; Replay and Return stay; the kicker no longer reads as an open-ended “The investigation continues”.

Sources: `docs/education/chapters/13-the-frontier.html#modelling-2012`; `docs/education/chapters/13-the-frontier.html#triangular-test`; `docs/education/chapters/13-the-frontier.html#starter-models`; `docs/education/chapters/13-the-frontier.html#the-other-laboratory`; `docs/education/chapters/13-the-frontier.html#why-bother`; `docs/education/chapters/14-what-we-are-building.html#the-gap`; [Triangular-growth hypothesis, pp. 9–18](https://arxiv.org/abs/2106.09809); [2023 model-to-experiment programme, pp. 7–8](https://arxiv.org/abs/2306.13087); [2026 step-source comparison, abstract](https://journals.ametsoc.org/view/journals/atsc/aop/JAS-D-26-0016.1/JAS-D-26-0016.1.xml).

## Reader depth retained, not discarded

### Four kinds of mark on a graph

A measured crystal dimension or speed is an observation. An attachment parameter inferred from that observation is already conditioned on a transport and surface model. A fitted curve summarizes selected data with a chosen mathematical form. An eye guide helps a reader follow a pattern without asserting such a form. A convenient analytic function can make a model easy to compute while incorporating chosen constants. Error bars alone do not turn an inferred parameter into a directly observed surface property.

The narrow-facet reduction regions discussed in the preceding episode are supported by model inversions. The exact analytic functions in the 2023 starter model have a different status: their positions, widths and depths include choices informed by the morphology diagram. Therefore a model fitted using that diagram cannot treat matching the same diagram as wholly independent confirmation. This episode's schematic curves are labelled as illustrations and contain no digitized or invented experimental values.

Sources: `docs/education/chapters/13-the-frontier.html#four-kinds-of-line`; `docs/education/chapters/13-the-frontier.html#working-hypothesis`; [2023 model definitions](https://arxiv.org/abs/2306.13087).

### A historical comparison is not a current ranking

Libbrecht's 2012 survey described front-tracking and phase-field success for melt-grown dendrites alongside difficulties for vapour-grown crystals with sharp facets and large attachment anisotropies. It described cellular automata that reproduced many observed structural features, and physically motivated cellular approaches that might yield accurate growth across a range of conditions. The paper distinguished that possible route from a result already accomplished at the time.

Those dates matter. The episode does not claim that every later phase-field, front-tracking or cellular method has the same limits. A numerical family is not one algorithm, parameterization or validation result. A particular later calculation must be assessed using its physical inputs, boundary conditions, numerical checks and actual comparisons. Facets and branches are useful feature tests; correct growth rates and responses under new conditions demand additional evidence.

The computer-grown crystals shown in earlier episodes of this series, including the opening crystal, are recordings from the project behind the series, made with its implementation of the Gravner–Griffeath lattice rules. Apart from the opening crystal, which is a separate run of the same rules, the crystals' settings are named habit presets from a visual catalogue, selected after visual review; some presets start from parameter sets transcribed from Gravner and Griffeath's published figures. The type names are catalogue labels, not claims about the temperature or water supply at which such crystals grow in nature. The rule has no temperature input, its ticks are not physical seconds, and its outputs are unvalidated model recordings rather than natural specimens. They illustrate what this kind of rule can represent; they are not predictions of which crystal grows under stated conditions, and they are not outputs of the project's separate, temperature-dependent model, which Part Two of the book behind this series describes.

Sources: `docs/education/chapters/13-the-frontier.html#modelling-2012`; `docs/education/chapters/14-what-we-are-building.html#the-gap`; [2012 survey](https://arxiv.org/abs/1211.5555); [Gravner–Griffeath model](https://doi.org/10.1103/PhysRevE.79.011601).

### What the two 2023 starter models actually specify

M1 uses its dipped layer-nucleation-barrier curves throughout the crystal, without distinguishing wide and narrow facets, and sets the attachment prefactor to one. It is an everywhere-narrow approximation motivated by edge sharpening in air. The dipped curves already contain that approximation; adding the same reduction again would count it twice. Broad-face experiments near minus two degrees require a prism prefactor substantially below one, so M1's unit choice deliberately omits a measured distinction.

M2 proposes broad-face relations on broad facets and reduced barriers on narrow facets. This adds a geometry question: identify the relevant facet width in three dimensions and specify how width changes the surface law. The paper does not provide a complete prefactor-versus-width law or transition prescription. That missing closure must be supplied, justified and frozen before the proposed controlled comparison can be run. The episode's rule-selection drawings illustrate this distinction; they are not forward model outputs.

Both proposals still require diffusion, a seed and surface-energy effects. The paper approximates latent-heating effects by rescaling far-field supersaturation; this is a stated shortcut, not general validation of omitting thermal physics. A separate 2023 faceting paper combines two layer-nucleation contributions and a curvature correction. That is not automatically interchangeable with switching between M2's broad and narrow branches.

Sources: `docs/education/chapters/13-the-frontier.html#starter-models`; [M1/M2, pp. 5–7](https://arxiv.org/abs/2306.13087); [Broad prism prefactor](https://arxiv.org/abs/2004.06212); [Separate faceting policy](https://arxiv.org/abs/2306.04042).

### A triangle tests more than six-fold geometry

The triangular-plate study used needle seeds at minus fourteen degrees Celsius and approximately one atmosphere while changing far-field supersaturation. Its high yield of trigonal plates occurred over a restricted supply range. Below roughly six percent, plates gave way to slow blocky or simple columnar growth. These conditions matter; the experiment does not establish a general triangular-growth rule for all temperatures and seeds.

In a geometric construction, moving three alternating facet planes faster can remove those planes from the visible perimeter and leave a triangle. That constructs a consequence of assigned speeds. It neither derives the speeds nor explains the initial asymmetry. The paper's sharp-tip analysis requires the tip-side attachment response to exceed the large-facet response by more than roughly a factor of two; that is a geometric/model condition, not an independently measured coefficient.

The proposed mechanism extends the narrow-facet idea to a small terrace constrained in two directions at a sharp tip. A quantitative three-dimensional calculation and comparisons under additional conditions are separate obligations. The episode's linked terrace close-up is labelled as that proposal.

Sources: `docs/education/chapters/13-the-frontier.html#triangular-test`; `docs/education/chapters/09-the-menagerie.html#twins`; [Controlled triangular growth and hypothesis](https://arxiv.org/abs/2106.09809).

### Questions outside a single-orientation growth model

Polycrystals contain grains with different orientations; aggregates can combine previously separate crystals; riming adds frozen droplets during a crystal's fall. A model of vapour deposition onto one orientation does not automatically cover these processes. Their presence is a scope question before it becomes a parameter-fitting question. Pyramidal facets also demand surface information beyond a rule that names only basal and prism faces.

The underlying chapter lists further research questions about ice structure, equilibrium shape, surface premelting, air chemistry and thermal treatment. Several historical status claims need currency checks before being repeated as present-day universal statements. In particular, the old claim that pure cubic ice had never been observed has been superseded: a 2020 experiment reported stacking-disorder-free cubic ice, and a 2023 study imaged its molecular growth at 102 kelvin. Neither establishes that pure cubic crystals are common in atmospheric snow. Nor does this episode turn the estimated equilibrium relaxation time of one idealized shape into a claim that nobody can perform long experiments. The useful general lesson is to identify the observable, source date and missing physical input for each open question.

Sources: `docs/education/chapters/09-the-menagerie.html#what-falls`; `docs/education/chapters/09-the-menagerie.html#twins`; `docs/education/chapters/09-the-menagerie.html#pyramidal`; `docs/education/chapters/13-the-frontier.html#where-it-runs-out`; [Stacking-disorder-free cubic ice, 2020](https://doi.org/10.1038/s41467-020-14346-5); [Molecular growth of cubic ice, 2023](https://doi.org/10.1038/s41586-023-05864-5).

### Comparing independent instruments without merging their claims

Microscopy of individual facets measures geometric changes. Electrodynamic levitation follows mass from the electrical force needed to support a particle of fixed charge. A fitted surface response can depend on structure and preparation history in either programme, but a mass record does not image a particular face, defect or grain. Agreement that a constant response can be inadequate does not establish that both instruments observed the same microscopic mechanism.

A paper published in July 2026 compares step sources at corners with sources near facet centers. Its abstract reports sensitive hollow-growth predictions when rims become narrow, motivating rim-width measurements alongside axis growth. This strengthens the purpose of the test proposed at the end of this episode without establishing one universal microscopic mechanism. This update is supported by the publisher abstract and authors’ publication record, not a full-text review.

A useful comparison keeps temperature, pressure, preparation and observable attached to each result. Colder mass-growth studies should not be silently assigned the same domain as warmer facet measurements. The main story therefore uses width and height as an explicit proposed observable and avoids presenting the source chapter's supplement-only status of later work as current publication news.

Sources: `docs/education/chapters/13-the-frontier.html#the-other-laboratory`; `docs/education/chapters/11-the-stickiness-of-ice.html#the-coefficient-that-moves`; [Harrington and Pokrifka, 2026](https://journals.ametsoc.org/view/journals/atsc/aop/JAS-D-26-0016.1/JAS-D-26-0016.1.xml).

### What the proposed test would need before execution

Specify the seed geometry, temperature, pressure, far-field vapour history, transport solver, surface law and numerical resolution. Keep the same inputs in the comparison arms except for the physical intervention being tested. If a broad-versus-narrow policy is compared, define its width measure and full transition law first; naming M2 does not supply them. Measure the initial crystal and subsequent dimensions using a common scale and a recorded clock.

Decide before the comparison which data set parameters, which later observations test them, how uncertainty is propagated, which quantities are judged and what would count as disagreement. A recorded supply step is attractive because it asks the calculation to respond to a new condition while keeping the same crystal's earlier history. It still requires checking transport, calibration, contact and heating. Numerical refinement and comparison with experiment answer distinct questions. Failure can reveal a numerical defect, a missing process, an inappropriate parameterization or insufficient measurement precision; its cause needs investigation rather than a convenient label.

Sources: `docs/education/chapters/13-the-frontier.html#starter-models`; `docs/education/chapters/13-the-frontier.html#the-other-laboratory`; [2023 model-to-experiment proposal](https://arxiv.org/abs/2306.13087).

## Source dispositions

- Chapter 13 graph epistemology: concise resemblance/demonstration/mechanism/prediction distinction in the ending (E11-09), substantive first reader; no need to repeat E09's full inference demonstration.
- Chapter 13 working-hypothesis and exact dip formulas: E10 owns the causal explanation, and the pending E10-05 now speaks the in-sample status of the hand-chosen dip placement; retained here in policy assumptions/reader without re-teaching dip equality roots.
- Chapter 13 model families and dated 2012 status: sections 1–2 and historical reader.
- The series' own computer-grown crystals: E11-02 says the crystals shown earlier in this series come from this kind of cellular rule, run by the project behind the series, with settings chosen (some by eye) and no temperature, so they show resemblance, not prediction; the second “chosen” sentence names “those crystals” so it cannot be heard as Gravner and Griffeath's choice. Reader 2 gives their repository provenance (named-direct catalogue recordings, with the opening Run B a separate run; not the growth-fleet library) and keeps them separate from the project's temperature-dependent model; no project operator, run, score or phase is narrated.
- M1/M2, surface energy and missing width closure: sections 3–4 and detailed reader.
- Triangular stress test: sections 5–6 and detailed source-bound reader.
- Other limits: concrete orientation/pyramidal/history tests in section 7; further open questions/dated claims in reader. No blanket present-day “never observed” claims. The spoken series-wide ledger of settled, proposed and open questions belongs to the closing E12.
- Funding history and biographies: deliberately omitted from narration because they do not support the next model comparison; source remains accessible.
- Independent instruments: E08/E09 already perform the measurement chains; reader retains distinct observables and inference limits.
- Chapter 9 diversity: used as scope tests, not a duplicate taxonomy tour. Riming, aggregation and detailed classification remain in the earlier episodes/source reader.
- Ending: E11-09 answers this episode's question with its own examples (resemblance, demonstration, mechanism, prediction), points back in one sentence to the hollow-rim supply-drop test designed in E11-08 as the concrete next step without restating its protocol, and hands off to the closing E12 with the same three-way sort (settled, leading proposal, open) that E12 fills; E12 owns the whole-series look back, that ledger and the opening of what comes next. The earlier series-wide causal recap, the “sleeve” image and the method-only last line are removed from E11. The project behind the series is mentioned only in the third person (E11-02 and the E11-09 hand-off), with no chronology, dates, results or scores; the maker journey and internal scientific gate histories remain outside this episode.
