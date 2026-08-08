# CH01 — Video-generator prompts (Seedance-class models)

Companion to [ch01-not-a-frozen-raindrop-script.md](ch01-not-a-frozen-raindrop-script.md) and
[ch01-animation-prompts.md](ch01-animation-prompts.md).

These prompts target text-to-video / image-to-video generators (written for Seedance 2.5;
they work unchanged in comparable models). They add a **cinematic B-roll track** on top of
the HTML DIAGRAM track. The two tracks have different jobs:

| Track | Carries | Never carries |
|---|---|---|
| HTML animations A1–A13 | every quantitative beat, every named temperature, every counter, every on-screen claim | — |
| Generated clips V-series | atmosphere, texture, scale, mood, physical setting | text, numbers, data, any beat where the visual *is* the evidence |

**Generated clips underlay or intercut a script row; they never replace the A-animation that
carries that row's facts.**

## Hard rules for the generated track

1. **No text in any generated clip.** Generators garble lettering. All words and numbers are
   added in the edit or come from the HTML pieces.
2. **Six-fold QC gate.** Generators habitually produce 4-, 5-, 7- and 8-armed "snowflakes"
   and floral non-crystalline geometry. Any clip containing a visible snow crystal is
   rejected unless every visible crystal has exactly six arms / six sides, arms that match
   each other, and geometry that stays stable across frames. Generate 3–4 takes per prompt
   and expect to discard most crystal takes. A wrong-fold crystal on screen is a factual
   error on this channel, not a style problem.
3. **No real people, no real likenesses.** Never generate Kenneth Libbrecht, his lab, or any
   identifiable person or institution. The lab shot (V12) is explicitly generic.
4. **On-screen tag.** Every generated clip that reaches the published edit carries a
   persistent corner tag, exactly like the DIAGRAM tag on the HTML pieces. Proposed wording:
   **AI ILLUSTRATION**. This extends the series bible's three-state PHOTO/MODEL/DIAGRAM
   system and needs maker ratification before publication (open question in the plan).
   Non-negotiable regardless of wording: photoreal generated footage is never presented in a
   way a viewer could mistake for a photograph of a real specimen.
5. **Format:** 16:9, 1080p minimum, 24 fps, clip lengths 5 s or 10 s. For beats longer than
   10 s, chain clips by feeding the previous clip's last frame in as the image reference for
   the next (image-to-video continuation), keeping the prompt's style block identical.
6. **One grade across the video:** cold blue-grey palette, deep shadows, a single restrained
   warm accent where a prompt calls for it. Keep the style sentence at the end of each
   prompt verbatim so clips cut together.

## Prompt anatomy used below

- **Cinematic shots:** [shot type + camera move] → [setting] → [subject and action, in
  order] → [lighting and mood] → [style sentence].
- **Animation-style shots** (no camera, motion-graphic look): [style declaration] → [the
  elements on screen] → [how each element animates, in order] → [background] → "static
  camera, no camera movement."

---

## Cold open — feeds rows 0:00–0:55 (with A1)

### V1a — Raindrop becomes sleet (10 s, cinematic)

```text
Extreme macro slow-motion shot, camera tracking vertically downward alongside a single
falling raindrop. Setting: a cold, featureless grey winter sky, soft depth-of-field haze.
The transparent wobbling raindrop gradually turns cloudy and opaque from the inside out,
stiffening into a dull, lumpy grey-white ice pellet while still falling. In the final
second it hits dark wet asphalt at the bottom of frame and gives one short, heavy, dead
bounce before lying still. Flat overcast lighting, cold and unglamorous; the pellet must
look dull and disappointing, never sparkling. Cold blue-grey palette, deep shadows,
photorealistic macro cinematography, shallow depth of field, no text.
```

### V1b — The other factory (10 s, animation-style)

```text
Stylised 3D animation, static camera, no camera movement. Elements: a small luminous
hexagonal ice crystal at centre frame, unfinished, with six short stubby branches; hundreds
of tiny pale motes of light drifting in slowly from all sides of the dark frame. Animation:
the motes spiral gently inward one after another and merge into the crystal's edges with a
soft glint; with each arrival the branches visibly extend a small step, the crystal growing
continuously but never finishing. The crystal slowly rotates in place, a few degrees per
second. Background: deep midnight-blue gradient with faint drifting fog. Cold blue-grey
palette with icy cyan glow on the crystal, elegant and precise, no text.
```

### V1c — Contents backdrop (10 s loopable, cinematic)

```text
Slow forward drift through the inside of a dark winter cloud at night. Setting: dense
blue-grey fog with faint layered depth, occasional tiny ice sparkles catching light as
they drift past the lens. Motion: continuous gentle dolly forward, fog parting softly
around the camera, sparkles passing at different depths for parallax. No distinct objects,
no ground, no sky — pure interior atmosphere, seamless and loopable. Dim, moody, cold
lighting with a faint cyan cast. Cold blue-grey palette, deep shadows, photorealistic
atmospheric cinematography, no text.
```

---

## Two words — feeds rows 0:55–2:54 (with A2)

### V2a — The dark sleeve (10 s, cinematic) — SIX-FOLD QC

```text
Macro shot, camera locked off with a very slow push-in. Setting: the woven texture of a
dark navy wool coat sleeve filling the frame, cold outdoor light. Action: snow lands
gently on the fibres over the whole shot — first a few tiny irregular splinters of ice,
then a small stubby hexagonal ice column shaped like a short pencil, then ragged little
grey-white clumps, and finally one perfect six-armed stellar snow crystal that lands
near centre frame and stays intact, resting on the fibres. Each arrival settles without
melting. Soft overcast daylight, crisp focus on the crystals, wool fibres slightly soft.
Cold blue-grey palette, photorealistic macro cinematography, no text.
```

### V2b — Into the lattice (10 s, animation-style)

```text
Stylised 3D animation, continuous camera dive. Elements: a thin translucent hexagonal ice
plate floating in dark space; inside it, an endless perfectly regular honeycomb lattice of
softly glowing points connected by faint lines. Animation: the camera pushes slowly and
steadily into the plate's surface; the outline gives way to the lattice, rows of glowing
points passing the camera in perfect hexagonal order, identical in every direction, depth
receding forever; the points shimmer faintly but never move from their positions. The dive
then reverses, pulling back out until the plate's six straight outer edges re-enter frame,
visibly parallel to the lattice rows. Background: near-black deep blue. Icy cyan glow,
precise and crystalline, no text.
```

### V2c — Puffballs under the streetlight (10 s, cinematic)

```text
Slow-motion medium shot, camera static, angled slightly upward. Setting: a mild winter
evening under a single streetlight, darkness beyond its cone. Action: large, ragged,
fluffy clumps of snow — fat puffballs the size of coins, visibly lumpy aggregates rather
than single flakes — drift down through the light cone, tumbling slowly, occasionally
brushing each other and sticking. Their fall is slow, wandering, heavy. Warm sodium light
inside the cone as the single warm accent against a cold blue-grey night. Photorealistic,
shallow depth of field, gentle bokeh, no text.
```

### V2d — Star and column growing (2 × 10 s, animation-style) — SIX-FOLD QC

```text
Clip 1: Stylised time-lapse animation on a plain deep-blue studio background, static
camera. Elements: a single small hexagonal ice plate at centre. Animation: the plate grows
outward continuously; its six corners extend into six slender branches at exactly the same
moment and exactly the same rate; delicate side-branches appear in matched pairs on all
six arms simultaneously, the whole crystal remaining perfectly six-fold symmetric at every
instant, ending as a large stellar dendrite. Rim-lit icy cyan on deep blue, precise and
elegant, no camera movement, no text.

Clip 2: identical style sentence and background, static camera. Elements: a single small
hexagonal block of ice at centre, shown at a slight three-quarter angle so its hexagonal
cross-section and its length both read. Animation: the block elongates steadily along its
axis into a stubby pencil-shaped hexagonal column, its six side faces staying dead flat
and its two end faces staying hexagonal; a shallow conical hollow slowly deepens in each
visible end near the finish. No branches ever appear. Rim-lit icy cyan on deep blue,
precise and elegant, no camera movement, no text.
```

---

## Not a frozen raindrop — feeds rows 2:54–4:36 (with A3)

### V3a — Deposition for real: window frost (10 s, cinematic)

```text
Macro time-lapse, camera locked off. Setting: a dark cold windowpane at night, out-of-focus
deep blue darkness beyond the glass. Action: feathery frost crystals grow across the glass
from the lower corner, advancing as branching fern-like fronds, each needle visibly
extending and sprouting side-needles as it goes; the pattern spreads to cover two thirds
of the frame by the end. The growth is continuous and organic, ice appearing out of thin
air onto the surface with no water droplets anywhere. Faint cool rim light tracing the
crystal edges. Cold blue-grey palette, photorealistic macro time-lapse, no text.
```

*Editorial note: window frost is genuine deposition — vapour to solid on a surface — so
this clip may sit under the deposition VO honestly. Do not use any clip where liquid
droplets are visible freezing; that would depict the wrong mechanism under this VO.*

### V3b — Rime accreting (10 s, cinematic)

```text
Macro time-lapse, camera locked off with a barely perceptible push-in. Setting: a single
dark thin twig crossing the frame diagonally against a grey-white fog background. Action:
supercooled fog drifts past continuously from the left; minute white beads of ice
accumulate on the twig's windward side one droplet at a time, building outward into a
ragged, granular white crust of stacked frozen beads — knobbly and chaotic, with no
crystal facets and no symmetry anywhere. By the end the twig has doubled in thickness on
one side. Flat cold fog light. Cold blue-grey palette, photorealistic macro time-lapse,
no text.
```

### V3c — Graupel (5 s, cinematic)

```text
Slow-motion macro shot, static camera at surface level. Setting: a dark slate surface
outdoors in flat winter light. Action: small soft white pellets of graupel — round, lumpy,
matte, like miniature styrofoam balls — fall into frame and bounce with small dry hops
before settling; a few roll briefly. Nothing sparkles; the pellets are dull and granular.
Cold blue-grey palette, photorealistic macro cinematography, shallow depth of field,
no text.
```

---

## Where the raw material comes from — feeds rows 4:36–5:58 (with A4)

### V4a — The steaming lake (10 s, cinematic)

```text
Slow aerial dolly forward, low over water. Setting: a vast cold lake on a winter morning,
open dark water below, a solid grey cloud deck above. Action: sheets of sea-smoke mist
rise continuously off the water surface, curling and thinning as they climb, dissolving
into clear air partway up, while the cloud deck above hangs heavy and unbroken; the far
shoreline is a thin dark line. Steady, calm forward drift, no fast motion. Cold dawn
light, blue-grey water, soft grey sky. Photorealistic aerial cinematography, no text.
```

### V4b — Inside the cloud (10 s loopable, cinematic)

```text
Extreme macro drift, camera moving forward very slowly. Setting: the interior of a dense
cloud, backlit softly from one side. Action: countless microscopic water droplets hang
suspended at every depth, each a tiny glinting sphere; they drift and swirl minutely with
the air but do not fall; the camera slides past layer after layer, near droplets passing
as soft bokeh spheres, far ones as faint points. The overwhelming impression is of
stillness and suspension — a fog made of countless individual drops hanging in place.
Soft diffuse silver light. Cold blue-grey palette, photorealistic macro atmospheric
cinematography, no text.
```

---

## Nothing freezes at zero — feeds rows 5:58–7:57 (with A5)

### V5a — The droplet that refuses (10 s, cinematic)

```text
Extreme macro shot, static camera. Setting: a single glistening water droplet resting on a
dark frosted surface, deep blue darkness around it, visible cold — faint frost crystals on
the surface nearby, a wisp of freezing air drifting through frame. Action: the droplet
trembles slightly, its surface tension holding it in a perfect glassy dome; frost creeps
slowly across the surface around it, but the droplet itself stays stubbornly liquid,
catching a cold gleam of light. It never freezes in this shot. Crisp, cold, expectant
mood. Cold blue-grey palette, photorealistic macro cinematography, no text.
```

### V5b — The pop (5 s, cinematic)

```text
Extreme macro slow-motion shot, static camera, same setting and framing as a glassy water
droplet resting on a dark frosted surface in deep blue darkness. Action: a front of
crystallisation ignites at one point inside the droplet and races through it in slow
motion, the clear liquid clouding to milky white ice in a single continuous wave that
crosses the whole droplet in under two seconds; the frozen droplet's surface stiffens and
dulls, and a faint bloom of frost flashes outward around its base. Crisp, cold, decisive.
Cold blue-grey palette, photorealistic macro cinematography, no text.
```

---

## Faceting and branching — feeds rows 7:57–9:22 (with A6, A7)

### V6a — Facing up (10 s, animation-style) — SIX-FOLD QC

```text
Stylised 3D time-lapse animation on a plain deep-blue studio background, static camera.
Elements: a small irregular blob of ice at centre frame, its surface lumpy and rough,
rim-lit in icy cyan. Animation: the rough patches of the blob visibly fill in and smooth
over one by one, the fastest-changing areas being the roughest; as they vanish, flat
faces emerge and meet at clean straight edges, and the shape resolves steadily into a
perfect hexagonal prism — two flat hexagonal ends, six flat rectangular sides — which
then rotates slowly in place to show off its geometry. The transformation is continuous
and calm, never morphing rubber-like. Rim-lit icy cyan on deep blue, precise and elegant,
no camera movement, no text.
```

### V7a — Six arms at once (10 s, animation-style) — SIX-FOLD QC

```text
Stylised time-lapse animation, camera directly overhead, very slow rotation of the whole
frame. Elements: a thin regular hexagonal ice plate centred on a deep-blue background;
a faint haze of drifting bright motes surrounding it, denser near the plate's six corners.
Animation: the six corners of the plate bulge outward at exactly the same instant; each
bulge extends into a slender arm, all six arms growing at identical speed and staying
identical to one another at every moment; the motes stream visibly toward the arm tips,
and the further the arms reach, the faster they grow. Side branches appear in matched
pairs on all six arms simultaneously near the end. Perfect six-fold symmetry throughout.
Icy cyan glow on deep blue, precise and elegant, no text.
```

---

## The relay — feeds rows 9:22–10:17 (with A8)

### V8a — The uneven duel (10 s, animation-style)

```text
Stylised macro animation, static camera. Elements: on the left, a spherical water droplet
rendered in deep blue glass; on the right, a small hexagonal ice crystal rendered in pale
icy cyan; between them, a field of faint drifting vapour motes. Animation: a steady stream
of motes leaves the droplet's surface and drifts rightward through the gap, arriving at
the crystal and merging into its edges with small glints; a much thinner trickle of motes
travels the other way. Over the shot the droplet shrinks smoothly and noticeably while
the crystal's arms and edges grow; by the end the droplet is half its starting size. The
flow reads clearly as one-directional traffic. Background: dark blue-grey gradient. Cold
palette, elegant and precise, no camera movement, no text.
```

---

## Too cold to snow — feeds rows 10:17–11:21 (with A9)

### V9a — The sky with nothing left (10 s, cinematic)

```text
Very slow lateral dolly, wide shot. Setting: a vast open snowfield at dawn under an
utterly clear, deep-blue sky, air brutally cold and perfectly still — no wind, no falling
snow, nothing moving except a thin low band of light on the horizon. Action: the camera
glides slowly sideways past sparse black skeletal trees; fine surface frost glitters
faintly on the snowpack; the sky stays empty and cloudless for the entire shot. The mood
is silence and absence: beautiful, hostile, and completely dry. Cold blue-grey palette
with a pale warm horizon accent, photorealistic landscape cinematography, no text.
```

*Editorial note: the emptiness is the point — this underlays "nothing left to hand over."
Reject any take where the model adds falling snow or clouds.*

---

## Nobody is designing this — feeds rows 11:21–13:22 (with A10–A12)

### V10a — The carver (10 s, cinematic)

```text
Medium close-up, slow orbit around the workpiece. Setting: a dim workshop at night, a
single cold work lamp. Action: a pair of gloved hands carves a block of clear ice with a
chisel, striking in steady rhythm; with each stroke, chips fly and a deliberate flat face
emerges; between strokes the hands pause while the carver's eyes move to a paper drawing
pinned at the edge of frame — the drawing is out of focus and unreadable, but the
back-and-forth glance between plan and block repeats clearly. Faces only ever appear
where the chisel removes material. Framing stays on hands, block, and drawing; no face
visible. Cold key light with warm lamp accent, photorealistic, no text.
```

*Editorial note: this is the subtractive half only. The additive half of the split screen
comes from A10/V7a. Never let a generated shot imply the crystal is carved.*

### V11a — Capped column (10 s, animation-style) — SIX-FOLD QC, HIGH REJECT RATE

```text
Stylised 3D time-lapse animation on a plain deep-blue studio background, static camera at
a slight three-quarter angle. Elements: a small hexagonal ice block at centre, rim-lit in
icy cyan. Animation: first the block elongates steadily along its axis into a stubby
hexagonal column with flat faces; the elongation then stops completely; after a still
beat, a thin flat hexagonal plate begins to grow outward from each end of the column
simultaneously, both plates widening at the same rate far beyond the column's thickness,
until the object is a spool shape — a column with a wide thin plate capping each end.
The junction lines where each plate meets the column stay sharp and visible. Slow final
rotation in place. Rim-lit icy cyan on deep blue, precise and elegant, no text.
```

*Editorial note: two growth regimes in strict sequence is exactly what generators blur.
Reject takes where plates and column grow at the same time — simultaneity here is a
factual error, not a style choice. If no take passes, A11 carries the beat alone.*

### V12a — A cold chamber, generic (10 s, cinematic)

```text
Slow push-in, medium shot. Setting: a generic, anonymous cold-laboratory interior at
night — brushed-metal chamber with a small circular viewport, faint frost on its rim,
soft blue instrument glow, cables and unlabelled equipment in dark bokeh. Action: through
the viewport, a small brilliant ice crystal sits on the tip of a slender needle, softly
lit, its edges glinting as it slowly grows; the camera pushes gently toward the viewport
the whole shot. No people, no hands, no readable dials, no logos, no lettering anywhere.
Quiet, precise, reverent mood. Cold blue-grey palette with icy cyan accent,
photorealistic, no text.
```

*Editorial note: runs under the 12:33 lab VO. Because the VO names a real scientist, the
AI ILLUSTRATION tag on this shot is mandatory and the edit must not linger in a way that
implies documentary footage of his laboratory.*

---

## Ending — feeds rows 13:22–14:10 (with A13)

### V13a — One crystal, landing (10 s, cinematic) — SIX-FOLD QC

```text
Slow-motion macro shot, camera drifting downward with the subject. Setting: darkness at
night with a cone of cool light from above, out-of-focus dark wool in the lower frame.
Action: a single perfect six-armed stellar snow crystal drifts down through the light
cone, rotating slowly, its arms identical and its geometry crisp; it settles onto the
dark wool fibres in the final two seconds and comes to rest intact, filling the lower
third of frame in sharp focus. Nothing else falls. Still, quiet, conclusive mood. Cold
blue-grey palette with faint icy sparkle, photorealistic macro cinematography, shallow
depth of field, no text.
```

---

## Shot–script map

| Clip | Underlays rows | Pairs with | Crystal QC |
|---|---|---|---|
| V1a | 0:00–0:12 | A1 act 1 | — |
| V1b | 0:12–0:30 | A1 act 2 | yes |
| V1c | 0:30–0:55 | A1 act 3 (backdrop) | — |
| V2a | 0:55–1:21 | A2 act 1 | yes |
| V2b | 1:21–1:47 | A2 act 2 | yes |
| V2c | 1:47–2:10 | A2 act 3 | — |
| V2d | 2:34–2:54 | A2 act 4 | yes |
| V3a | 2:54–3:31 | A3 act 1 | — |
| V3b | 4:00–4:22 | A3 act 3 | — |
| V3c | 4:00–4:22 | A3 act 3 | — |
| V4a | 4:36–4:58 | A4 act 1 | — |
| V4b | 5:13–5:58 | A4 acts 2–3 | — |
| V5a | 5:58–6:34 | A5 act 1 | — |
| V5b | 6:57–7:41 | A5 acts 2–3 | — |
| V6a | 8:14–8:53 | A6 acts 2–3 | yes |
| V7a | 8:53–9:22 | A7 | yes |
| V8a | 9:22–9:54 | A8 act 1 | — |
| V9a | 11:02–11:21 | A9 act 3 | — |
| V10a | 11:41–12:04 | A10 act 2 (left half) | — |
| V11a | 12:04–12:33 | A11 | yes (high reject) |
| V12a | 12:33–12:55 | A12 act 1 | — |
| V13a | 13:51–14:10 | A13 act 2 | yes |

The quantitative beats with no V-clip at all (the A5 roulette sweep and histogram, the A8
budget counter, the A9 thermometer descent) are deliberate: those beats are made of numbers,
and numbers do not go through a generator.
