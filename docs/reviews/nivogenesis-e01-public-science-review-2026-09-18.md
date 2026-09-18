# Nivogenesis Episode 1 public science review — 2026-09-18

## Provenance and method (Rule 10)

Required by the [public release plan](../plans/explore-nivogenesis-public-release.md) step 8 (D6, Rule 13)
before the live deploy. Reviewing agents ran as a workflow on **Claude Opus** (a different model from the
implementing session, Claude Fable 5.1) with no shared conversation context; they received only the file
paths, the chapters' locations and the review brief. Four reviewers covered (1) the performed English
narration and optional reader, (2) on-screen text and what the drawings imply, (3) Mandarin scientific
fidelity (building on the earlier 137-agent translation review), and (4) public framing and disclosures.
Every finding was then challenged by two independent Opus refuters reading the same files; a finding counts
as confirmed only when both judged it real. Raw output (76 agents, 1,179 tool uses) is retained locally at
`out/nivogenesis-release/e01-public-science-review-2026-09-18.json`.

Reviewed bytes: website release branch at `833ee9e`/`576e61b` (sources under `src/series/`, `src/hero1/`,
`index.html`), ground-truthed against `docs/education/chapters/01-not-a-frozen-raindrop.html` and
`04-the-fuel-supply.html`. Independently re-executed by the reviewers: reading of every narrated
paragraph and reader note, extraction of the drawing labels from the canvas code, paragraph-by-paragraph
Mandarin comparison, reproduction of the reader's gram figures, and file-level checks of the marker,
catalog and dictionary code. Not checked: audio delivery, animation timing, and anything outside Episode 1.

## Result

36 findings: **8 confirmed, 6 contested, 22 rejected**; the reviewers also listed 75 checked-and-sound
items. No confirmed finding against the public Episode 1 text, labels or Mandarin rose above **low** after
refutation. The two **high** items concern the education chapters that the public Sources links open
(Chapter 1's "too cold to snow" framing and the droplet-freezing quotation without a nucleation qualifier);
they are outside this release's deploy and are recorded below as follow-ups for the education workstream.

### Confirmed

| Category | Severity (reviewer → refuters) | Location | Issue |
|---|---|---|---|
| label-implication | medium → low, low | `website src/series/EpisodeOne.tsx:357` | The parenthesis is presented as the complete set of inspectable opening crystals but lists five of the six in the library; the Dendrite entry is omitt |
| wording | medium → low, low | `website src/hero1/RecordedSnowMarker.tsx:19 and :135` | The arrival crystal — the first one a viewer inspects, and the one the opening is built around — is labelled 'Stellar dendrite', which has no entry in |
| label-implication | medium → low, low | `website src/series/series-ui.zh-CN.json:46 and :80` | The Chinese voice disclosure renders 'the user-selected ElevenLabs voice' as 你选定的 — literally 'the voice you selected' — which addresses the site visi |
| overclaim | high → high, high | `docs/education/chapters/01-not-a-frozen-raindrop.html:70 and 713-733 (section "Too cold to` | "And that is the whole of it", plus the learning objective "Give the real mechanism behind ‘too cold to snow.’", asserts that the liquid-droplet reser |
| missing-qualifier | high → medium, high | `docs/education/chapters/01-not-a-frozen-raindrop.html:426-431 and 702-710 (sections "Nothi` | This is quoted accurately, but the chapter adopts it as a description of a real cloud without the qualifier that makes the rest of the chapter arithme |
| scientific-error | medium → low, low | `docs/education/chapters/01-not-a-frozen-raindrop.html:348-356 and docs/education/chapters/` | This is the "air is a sponge" misconception, which Chapter 4 explicitly refutes and which the public narration also refutes. Saturation is a property  |
| mandarin-fidelity | low → low, low | `website src/hero1/RecordedSnowMarker.tsx:141 (loupe Sources disclosure for the opening sno` | The per-crystal disclosure text for the opening snowfall is rendered raw, not through the translation helper, so a Chinese visitor who opens one of th |
| number | low → low, low | `docs/education/chapters/04-the-fuel-supply.html:1066-1070` | The source's operand is a crystal radius near 100 µm, not a diameter. Stated as "across", the 1/500 figure is quoted at half the size it belongs to, w |

### Contested (one refuter real, one not)

| Category | Severity | Location | Issue |
|---|---|---|---|
| label-implication | medium → medium, low | `website src/series/earlyEpisodeDrawing.ts:261-262,272-273 (E01-03) and website src/series/` | Both scenes give the two species an explicit dot legend, so the dot ratio reads as a composition claim, and both draw water vapour as roughly a fifth  |
| missing-qualifier | medium → low, low | `website src/series/EpisodeOne.tsx:356` | Two weakenings in the Chinese half of the same line. (1) 'unvalidated' becomes 尚未经过定量验证 — 'not yet quantitatively validated' — which asserts less than |
| overclaim | blocker → low, low | `docs/education/chapters/04-the-fuel-supply.html:1240-1247 (section "Falling through the su` | The chapter presents a cross-paper, cross-site comparison as a clean experimental confirmation of its own diffusion arithmetic. The project's own sour |
| overclaim | medium → low, low | `docs/education/chapters/04-the-fuel-supply.html:1058-1072 (section "The mirror experiment"` | Two problems. (a) The 1/500 figure is a model-dependent inference built from an assumed mean free path, not a measured quantity, and the chapter prese |
| mandarin-fidelity | medium → low, low | `website src/series/EpisodeOne.tsx:324-326 (the public "A closer look" reader, Chinese bran` | The three string replacements applied to the optional reader match English text only, so none of them fires on the Chinese paragraphs. The public Chin |
| label-implication | medium → low, low | `website src/series/seriesLocale.ts:39 (sourceLabel) with website src/series/episode-one.js` | Every external link in the Sources panel is labelled "Primary source". That label is applied to a Caltech faculty directory page, to a NASA K-12 educa |

### Dispositions applied to the public site (website `30d05f6`)

- Sources panel: the opening-collection sentence no longer enumerates five habits (the library has six and
  Run B is separate); it now reads "The other inspectable crystals in the opening snowfall are recorded
  G–G model growths from the same library, also unvalidated…" in both languages.
- Chinese Run B disclosure restores the dropped clause: "Run B 未经物理验证，不是对真实雪晶生长的测量。…"
- The per-crystal inspector source line and the Run B label ("Stellar dendrite") now translate in Chinese
  mode (`t(asset.source)`; new dictionary entries).
- External Sources links are labelled "External link · host" (zh 站外链接) instead of "Primary source".
- The optional reader's public-facing rewrites (chapter section instead of an internal production document,
  no numbered future episodes, no working-source trailer) now apply to the Chinese paragraphs too.

### Considered and not changed

- E01-08 gas-box dot composition (contested): the scene is a schematic already covered by the Sources
  statement that diagram sizes and rates are not measurements; an unconditioned on-screen ratio would add a
  new under-qualified number, and stacked on-stage disclaimers are against the maker's design direction.
- E02 disclosure wording (confirmed, low): Episode 2 is frozen and unreleased; deferred with it.
- Chapter findings (confirmed high/medium/low; contested): the "too cold to snow" framing and objective,
  the droplet-freezing quotation's missing nucleation qualifier, the "more than it can hold" wording,
  the 100-micron radius/diameter operand, the wind-tunnel comparison framing and the Nelson 1/500
  paragraph. These are edits to the education chapters, not to the deployed site; the refuters' proposed
  wordings are in the retained JSON. Recorded as the next education-content task.

### Rejected by both refuters

- [missing-qualifier/medium] `episode-one.json → sections[5] "E01-06 The same air, two different outcomes", pa`: This is the load-bearing physical claim of the whole episode — the ice/water vapour-pressure gap that drives the Wegener–Bergeron–Findeisen 
- [label-implication/medium] `episode-one.json → sections[0] "E01-01 A cloud disappears into a crystal", parag`: The qualifying sentence switches the noun from "crystal" to "snowflake" and points the correction in only one direction — downward. One sect
- [missing-qualifier/low] `episode-one.json → sections[3] "E01-04 Ice has to get started", paragraph 4`: The source gives a concrete floor to "far below zero" — near −40 °C, below which no droplet stays liquid — and the narration drops the numbe
- [wording/low] `episode-one.json → reader[1] "Percentage, vapour excess and the temperature curv`: The three gram figures are correct (I reproduced them), but their only stated derivation points at an internal production document that is n
- [scientific-error/medium] `website src/series/comprehensionDrawing.ts:30-37,63 (scene E01-08, "What “water-`: In the box captioned "Same box size · fixed temperature", the number of water-molecule dots and the thickness of the ice slab both increase 
- [missing-qualifier/medium] `website src/series/EpisodeOne.tsx (stage caption removed in commit 4d7cc52); orp`: The persistent on-stage caption that marked every diagram as explanatory rather than measured was deleted. Eight of the eleven scenes are no
- [label-implication/medium] `website src/series/EpisodeVisual.tsx:90 (affects scene E01-01)`: The "Model · unvalidated" badge is suppressed on scene E01-01, which is the first and longest-held image of the episode and does display the
- [missing-qualifier/medium] `website src/series/comprehensionDrawing.ts:122 and narration E01-09 §6 (episode-`: "Not guaranteed" and "do not promise" read as "possible but not assured". Both source chapters state something much stronger: supercooled cl
- [missing-qualifier/low] `website src/series/waterStory.ts:26-40 (cloudPopulation, used by scene E01-10); `: The "cloud spends its liquid" sequence shows exactly six of twelve cloud droplets freezing into ice seeds and six evaporating. The 50/50 spl
- [missing-qualifier/low] `website src/series/laterEpisodeDrawing.ts:114 (scene E01-06, "The same air, two `: The two-box comparison draws the liquid's balance amount as 26 gas dots against the ice's 18 — a 44 % surplus. The real ice-to-water saturat
- [label-implication/low] `website src/series/earlyEpisodeDrawing.ts:91-92 (E01-01); same string at website`: The largest piece of text in the episode states the 100,000 figure without naming what it buys. The source prices those droplets against one
- [label-implication/high] `website src/hero1/RecordedSnowMarker.tsx:141 (with strings at :19-20 and website`: The "Sources" disclosure inside every inspectable opening crystal renders `asset.source` raw instead of through `t()`, so the only unvalidat
- [scientific-error/medium] `website src/series/series-diagrams.zh-CN.json:215`: 而非冰 attaches to the verb phrase, so the caption reads most naturally as 'water molecules leave liquid water more easily — not ice', i.e. tha
- [wording/low] `website src/series/series-ui.zh-CN.json:90-95 (vs series-diagrams.zh-CN.json:340`: Two related problems in the habit vocabulary. (1) 扇区 in Mainland usage is the disk/circle sector; the conventional Chinese name for the sect
- [overclaim/low] `website src/series/episode-one.zh-CN.json:4`: The Chinese status adds a claim the English status does not make — 经独立复审, 'independently reviewed' — with no qualifier naming what the revie
- [overclaim/medium] `website index.html:12-15, 22-25, 28-30 (meta description, og:description, twitte`: The public tagline — in the page description, both social cards, and as the site's on-screen strapline — is a universal claim using the one 
- [mandarin-fidelity/medium] `website src/series/EpisodeOne.tsx:356 (Menu → Sources, Chinese branch)`: The English disclosure on the same line says Run B "is unvalidated, not measured crystal growth". The Chinese says only that it "has not yet
- [label-implication/medium] `website src/series/episode-one.json, reader item 4 "Conditions can change new gr`: The disclaimer separating Libbrecht's work from Run B is exactly right, but the citation then attaches the phrase "Libbrecht's experiments" 
- [scientific-error/medium] `docs/education/chapters/04-the-fuel-supply.html:83-86 (section "Where the water `: An unqualified universal that the project has already superseded elsewhere. Stacking-disordered ice (ice I_sd, containing cubic sequences) d
- [label-implication/medium] `docs/education/chapters/04-the-fuel-supply.html:513-523 (section "Percentages ar`: The quotation is accurate but is a statement about habit (which shape appears) being used as evidence for a claim about size and growth rate
- [number/low] `docs/education/chapters/04-the-fuel-supply.html:98-106`: Two mismatches in the framing. The 1.65 mbar figure is the ice balance value, but the vapour actually present in a snow-producing cloud is t
- [wording/low] `website src/growth/RunBHero.tsx:22-24 (module doc comment)`: The source comment describing the public site's opening calls Run B "the same measured crystal", which directly contradicts the disclosure t

## Limits

An agent review with a different model, not a domain expert's sign-off; no listening, no timing review, no
audience test. The chapter follow-ups remain open.
