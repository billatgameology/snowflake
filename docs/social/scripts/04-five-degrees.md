# 04 — Five Degrees

- **Runtime:** 60 s (reads 60–62; see production notes before cutting)
- **Format:** THE PROOF
- **Chapter:** 3
- **Badge:** SETTLED
- **Slot:** Launch video 4 — the question everyone actually has, answered completely

## Script

| TIME | VOICEOVER | ON SCREEN |
|---|---|---|
| 0:00–0:02 | A water molecule is not hexagonal. | DIAGRAM. Single 2D water molecule, three atoms, one angle. A ghosted hexagon behind it fades out. Overlay: **NOT HEXAGONAL** |
| 0:02–0:07 | Three atoms. One angle. Nothing about one molecule is six-fold. | DIAGRAM. Count the atoms on screen: 1, 2, 3. Angle arc highlights |
| 0:07–0:17 | That angle is a hundred and four and a half degrees. The tetrahedral angle — four directions spread as evenly as four directions can — is a hundred and nine and a half. Five degrees apart. | DIAGRAM. Readout ticks to **104.5°**. Beside it a tetrahedron with four rays, **109.5°**. A gap bar animates: **5°** |
| 0:17–0:23 | Five degrees is nothing. So in ice, the four bonds around every oxygen sit in an essentially tetrahedral arrangement. | DIAGRAM. Zoom to one oxygen, four bonds splaying — two solid (its own hydrogens), two dashed (reaching to neighbours). Overlay: **ESSENTIALLY TETRAHEDRAL** |
| 0:23–0:31 | Now try to close a ring at that angle. Flat, its corners are fixed: three gives sixty degrees, six gives a hundred and twenty. | DIAGRAM. Flat rings build in sequence with corner angles printed: **3 → 60° · 4 → 90° · 5 → 108° · 6 → 120°**. The 109.5 line drawn across as a red rule |
| 0:31–0:41 | And folding a closed ring only sharpens its corners. Never widens them. So a flat ring must overshoot a hundred and nine and a half, or it can never fold onto it. | DIAGRAM. One ring folds edge-on; its readout only counts *down*. Overlay: **FOLDING SHARPENS. NEVER WIDENS.** Rings below the rule grey out |
| 0:41–0:49 | Five is a hundred and eight. Short by one and a half. Six clears it — then buckles, three up, three down, and lands exactly. | DIAGRAM. 5-ring greys with **108° — SHORT BY 1.5°**. The 6-ring rotates edge-on, alternate atoms lift and drop, readout runs 120 → **109.5°** and locks |
| 0:49–0:55 | Those rings can stack two ways, though, and only one of them is hexagonal ice. Earth picks that one. | DIAGRAM. Two stacks from identical rings, one bond twisted in the right-hand one. Labels: **HEXAGONAL / CUBIC**. A tick lands on the left |
| 0:55–1:02 | And none of that says plate, column or star. That's the surface. So catch a flat one — you're looking down the only direction the hexagon exists in. | MODEL. Same crystal in three looks — plate, column, star — cycling over one unchanged lattice inset. Then a plate rotating: hexagon face-on, gone at ninety degrees. Badge: **SETTLED** |

## Caption

Water's bond angle is 104.5°. Tetrahedral is 109.5°. A flat ring has to overshoot that to fold onto it — five misses by one and a half degrees. Six is the first that makes it.

## Title options

1. Five Degrees
2. Why Five Sides Doesn't Work
3. The Ring That Has to Overshoot

## Production notes

**Exists:** MODEL renders in the plate/column/star looks; the rotating-plate "hexagon lives along one axis" shot is a camera move on an existing render.

**Must be built:** essentially the whole video is one 2D sequence — angle readouts, the ring ladder, the fold. High effort, high reuse: this is the chapter-3 explainer and will serve several videos. Build the ring-fold as a single parameterised rig (ring size, fold height, live corner readout), not four separate animations.

**The 0:49 stacking line is the honest hedge, not garnish.** The loop argument establishes a *ring* of six; it does not by itself establish hexagonal ice, because near-tetrahedral bonding permits a cubic lattice too. If runtime forces a cut, cut elsewhere and let it run to 62 s.

**No Greek characters anywhere on screen**, including readouts — degrees only.

**Difficulty:** medium–high. All animation, no render dependencies.

## Fact-check

| CLAIM | CH | CITATION | CONFIDENCE |
|---|---|---|---|
| A water molecule is not hexagonal; three atoms, one angle | 3 | "Careful" box | settled |
| The hexagon is a property of packing, not of one molecule | 3 | "Careful" box | settled |
| The two O–H bonds meet at 104.5 degrees | 3 | prose near p. 49 | settled |
| The tetrahedral angle is 109.5 degrees | 3 | prose (definitional geometry) | settled |
| The four bonds at each oxygen are essentially in a tetrahedral arrangement | 3 | p. 49, quoted verbatim | settled — **hedge "essentially" preserved** |
| A flat ring of n bonds has corners (n−2)×180/n: 60, 90, 108, 120 | 3 | site's loop interactive; exact result | settled (exact geometry) |
| Folding a closed loop can only sharpen its corners | 3 | site's loop interactive: exterior angles must sum to at least one full turn | settled (exact geometry) |
| Five falls short of 109.5 by one and a half degrees | 3 | prose: "108 degrees, short by one and a half" | settled |
| Six is the first loop that clears it, buckling 120 → 109.5, three high three low | 3 | "Stack tetrahedra, get a honeycomb" | settled |
| Tetrahedral bonding permits two lattices; Earth's ice is hexagonal | 3 | p. 49, quoted | settled |
| The lattice does not decide plate, column or star | 3 | "What the lattice does not explain"; p. 46 | settled |
| The hexagon is only visible along one axis | 3 | Fig. 2.2 caption, p. 48 | settled |
