# Review findings — 2026-08-05

Two independent reviewers went over the twelve launch scripts: an **adversarial
fact-checker** (attacking six named error classes against the chapter corpus) and a
**short-form editor** (judging retention only, ignoring accuracy). Both were told to be
harsh. Both found real problems.

This file records what they found, what was applied, and what is still open.

---

## Blockers — found and fixed

### 1. Script 06's premise was partly wrong

**As written:** *"A snowflake grows branches because it's starving. Not because it's growing
fast."*

**The problem:** chapter 6 says the opposite of the second sentence. Fig. 3.5's caption:
branching becomes more likely "when a hexagonal crystal is large **and/or its growth rate is
fast**." And the caption *"Branches aren't a sign of plenty"* was flatly contradicted —
ch 6: "branching becomes more prevalent at higher supersaturation… **that is why the most
elaborate crystals fall from the wettest clouds**."

**The fix made the video better.** The two facts are compatible and their reconciliation is
a second reversal: the crystal isn't starving because the *cloud* is dry — it's starving
because it **eats faster than the air can hand the water over**. It digs its own hole. The
new beat states the wet-cloud fact up front and turns it into the hook's payload.

This one was mine, not an agent's — it was in the hook bank before any script was written.

### 2. Vapour-field legend contradicted itself across scripts

Scripts 06 and 07 assigned **opposite** meanings to dark and pale in the same shared asset,
and 07's own cell was internally contradictory ("blue depletion shell" under a legend saying
pale = emptied). The corpus itself uses more than one convention, so the slate has to pick
one and hold it.

**Fixed:** slate-wide convention is now **strong blue = emptied · pale = full supply**
(matching chapter 4's animation), with the legend on every frame that shows the field.

---

## Fixes applied

| # | Script | Was | Now |
|---|---|---|---|
| 3 | 09 | "nothing **like** it has ever fallen" | "nothing **exactly** like it" — the source's claim is about exact likeness only; similar ferns fall constantly |
| 4 | 07 | "**every** crystal that ever fell past your face was wearing that moat" | "every crystal that ever **grew** in a cloud" — the halo is a property of a growing crystal; falling ones are often sublimating |
| 5 | 07 | "it's why the arms grew" | "the **first half** of why" — ch 4 explicitly disclaims this step as unearned by the halo argument |
| 6 | 12 | "ten parts per million turns plates into columns" | added "**at twenty below**" — the temperature is load-bearing and was in the script's own fact-check row but not the spoken line |
| 7 | 06 | "It's not a ring" | "It isn't a **uniform** ring" — as written it denied what 07 and 08 both assert |
| 8 | 06 | "that's where the crystal ate first" | "that's the part **shielded on both sides**" — the sourced mechanism, not a substituted one |
| 9 | 02 | "cells following **one rule**" | "a handful of simple local rules" — the G-G model has three ingredients and the source says removing any breaks it |
| 10 | 02 | "Nineteen cells" | "Nineteen cells **in our model**" — it was marked ARTIFACT in its own fact-check table but stated unscoped, 30 s before the disclosure |
| 11 | 01 | "a hundredth of a millimetre" | "a hundredth of a millimetre **or two**" — collapsed a 2× range to its low end |
| 12 | 09 | "one in five thousand… one in five hundred… a billion billion" | "**about** one in five thousand… **roughly** a billion billion" — three hedges dropped in one row |
| 13 | 12 | "Most of the measurements… were paid for on one man's credit card" | quotes "**mainly** just me and my credit card" — the source hedges and the video's own next beat supplies a mixed picture |
| 14 | 10 | "its **proposers** call it a working hypothesis" | "the **paper proposing it** calls it" — plural read as a research community, which scripts 11 and 12 spend their runtime contradicting |
| 15 | 10 | "In **the research literature**" | "In the paper that states the sequence most precisely" — generalised one paper to a field, and Bailey & Hallett published observations through that range |
| 16 | 05 | "he never altered a crystal" | "he **always insisted** he never altered a crystal. Nobody has ever shown otherwise" — it rests on his own testimony, not an independent check |
| 17 | 05 | footer strap "c.1902" | date removed — unsourced colour; the corpus dates only the first photograph, the run, and the book |
| 18 | 06 | fact-check row: seaweed claim marked "high" | now flagged that **the source evidence is itself a numerical simulation** — the neighbouring halo row was correctly model-scoped, so the table contradicted itself |

---

## Editorial changes applied

**Two titles killed as actively dangerous:**

- ~~"The Farmer's Honest Lie"~~ — the video's thesis is that Bentley never lied, and the
  script carries a mandatory tone gate asking a fresh reviewer *"is this accusing Bentley of
  anything?"* Putting **lie** in the title is the only thing most people ever read. That was
  an inconsistency in the brief, not a taste call. → **"Five Thousand True Photographs, One
  False Impression."**
- ~~"Me And My Credit Card"~~ — reads as *the creator* discussing *their own* spending, on a
  video whose framing guard says the researcher is never named. → **"Difficulty and neglect
  look identical from the outside."**

**Script 01 restructured.** It opened on a negation nobody actively holds, then spent
fourteen of forty-five seconds on vocabulary (sleet, rime, graupel) before the idea arrived
— a glossary read aloud. It also stated the same fact twice with the fraction inverted
("a hundred thousand droplets" / "one part in a hundred thousand"), which reads as two facts
and stalls the viewer. Now opens on the sleet image and reaches deposition by 0:08.

**Script 09's factorial beat cut.** Twelve seconds building 10¹⁵⁸ and then a mandatory held
card telling the viewer the number doesn't mean what they just concluded — expensive,
hard to follow once, and **self-negating**. The claim it supported is fully delivered
without it. Removing it makes the video *more* honest, not less.

**Script 02's ending replaced.** It was near-identical to script 08's ending, pointing at
the same hexagon. 02 now closes on the six-corners synchrony beat, which was its actual hero
and was unused elsewhere.

**Script 10 restructured.** The free-fall cloud chamber beat was seven seconds of "there is
data" with no data shown — by construction, since the notes correctly forbid drawing a curve
we don't have. Cut. The read-uncertainty passage went from fourteen seconds to seven with
every load-bearing hedge intact. And the mic drop — *"ninety years on, no convincing physical
model has been established"* — moved to last, with the useful takeaway promoted to mid-video.

**Script 06's naming beat went silent.** Six seconds of "this has a name, two guys, 1964, but
we prefer the other name" dropped into the middle of the best mechanism explanation on the
slate. The strike-through gag reads perfectly without narration.

**Script 11 held from launch.** See its own header for the reasoning and the three fixes
required before it ships.

---

## Open — not yet applied

**Script 08 needs a rebuild or a merge.** It duplicates 02's payoff, spends 28% of its
runtime on defensive qualification against misreadings the script never plants, and carries
a compound-unit arithmetic beat (mm²/s) at exactly the point retention breaks. One genuinely
distinct idea survives — *the centre was starved by its own arms* — strong enough to carry a
~35 s piece alone. Decision needed: rebuild small, or fold into 02 and free the slot.

**Six of twelve scripts end with "go outside and look."** 01, 02, 04, 05, 08, 09.
Individually good; collectively a tic a viewer notices before you do. Keep it for 05 and 09
where it's strongest and most specific. The other four need different exits.

**Three structural gaps across the slate:**

1. **No failure video — which means the Mark Rober engine is missing.** All twelve are
   finished explanations delivered with confidence. The uncertainty on display is always
   *the field's*, never *ours*. There is no video where something we did was wrong and we
   show it. This project is full of that material — a render whose sixfold symmetry silently
   broke, invisible at one setting and obvious at a larger one, is a superb 45-second story
   with a real reveal. **Right now the honesty is a policy. That video would make it a
   behaviour.**
2. **No short piece.** Every video is 45–70 s; six overrun their own stated runtime. A
   20–30 s piece is missing, and one is sitting inside script 02 already ("six arms leave at
   the same instant and nothing coordinated them").
3. **Format distribution is inverted against the assets.** THE PROOF gets three slots and
   needs the most from-scratch animation. GROW IT and CUT IT OPEN get one each — and those
   are the formats that use assets we *already have* and produce the most spectacle per hour.
   Flip the ratio.

**The one piece the editor would add:** a near-silent spectacle video built on the seaweed
split-screen from script 06 — same physics, one property switched off, completely different
object. Ten words of narration, thirty seconds. It currently gets 4.5 buried seconds. That
is the cheapest reach available.

---

## Limits of this review

Stated because the channel's whole position requires it.

1. **No page number was verified against Libbrecht's monograph itself** — only against the
   chapter files. If a chapter mis-cites a page, the error was inherited silently. arXiv
   identifiers were checked for internal consistency, **not fetched**.
2. **Chapters 9, 11 and 12 were not read in full** by the fact-checker — only targeted greps
   for the specific claims the scripts lean on.
3. **All rights and licensing assertions are unverified**: Bentley's public-domain status,
   USDA LT-SEM availability, the 1 Jan 2027 expiry claimed for the 1931 book, and the claim
   that Fig. 10.4 is permanently off-limits.
4. **Asset existence was not checked against the repository** — the 701-frame timeline, the
   cell-true view, the look registry, the vapour-field toggle, and the isotropic companion
   run script 06 requires. The "Exists:" lists in the production notes are unconfirmed.
5. **Read rate was not tested.** Only that stated runtimes match the timecode columns.
6. **Badge assignments were not audited** — no rubric defining SETTLED / MOSTLY / HYPOTHESIS
   / NOBODY KNOWS was supplied, so no script could be tested against one. **Writing that
   rubric is an open task.**
7. **The hook bank and question bank were not fact-checked** — the brief scoped this to the
   twelve scripts. Anything drafted from the same facts needs the same pass, particularly
   anything drawn from script 06's starvation framing, where both blockers lived.

### One error caught before it reached a file

The line *"Nobody has ever filmed a snowflake growing"* was proposed in discussion. **It is
false** — Libbrecht films laboratory crystals routinely; chapter 4 cites a time-lapse movie
and chapter 6's Fig. 3.9 shows dendrites grown on a wire. The correct claim is scoped to
*natural* crystals: snow that falls is collected already finished.

It never entered `hook-bank.md`, and the script writer independently scoped script 02
correctly ("Snow arrives done. You get one look — at the final object"). Recorded here
because it is exactly the class of error this channel is most likely to make: a line that is
*nearly* true, is much punchier in its false form, and would have been indexed forever.
Script 02 now carries a permanent scope guard in its production notes.

### One correction applied to the hook bank

Hook 14 previously read *"Snowflakes don't have branches because they're growing fast. They
have branches because they're starving."* The first half is contradicted by ch 6's Fig. 3.5
caption. Corrected to the wet-cloud framing — see blocker 1 above.
