# E02 source, implementation and design review — 2026-09-16

## Pre-build review

Scope: the complete [E02 script](../video/science-series-e02-script.md) and
[plan](../plans/science-series-episode-2.md), education Chapters 2–3 and targeted primary
checks. Root authored the draft. Shared-context, read-only science, story and runtime agents
reviewed it; exact model identifiers were unavailable. This is not an independent scientific
gate or audience comprehension test. No audio was generated or reviewed.

The science reviewer read the complete script/plan and relevant original-monograph passages,
and independently calculated the proposed ideal oxygen coordinates. The story reviewer checked
the actual script against the maker's design guide. Runtime review inspected existing player
contracts before implementation. Pre-repair script SHA-256:
`d773c86dc99e913fdee0b66836b44673acb49ab6e87ad4fb28b2748247273e7f`.
Chapter 3 at authority baseline `6cc99bd`:
`6f1268a444d8c063c59d70ce3b1bb19d7ac2a3a536b332efc16edcd260994da7`.

### Findings incorporated before build

| Finding | Repair / boundary |
| --- | --- |
| Circle packing is an analogy, not the oxygen structure. | Separate labelled packing and open-network examples; do not morph cannonballs into water molecules. |
| Diffraction needs observable cause/effect, not six invented dots. | Reinforcement/cancellation, then plane spacing and angle at fixed wavelength; name the one-wavelength path condition and Barnes's experiment. Drawings remain principle diagrams, not experimental data. |
| Scene 2's first paragraph lacked its own visual discovery. | Reveal optical detail before retaining the same specimen's record, then show selection bias. |
| Molecular and network angles describe different objects. | Isolated H–O–H approximately 104.5°; ideal oxygen-neighbour tetrahedral angle approximately 109.5°. Explicit oxygen-only legend; no four covalently attached hydrogens. |
| Arbitrary six-cycle selection could contradict the c-axis view. | Use a basal chair ring with alternating heights and persistent oxygen IDs. Local tetrahedral coordination is not a proof of a unique lattice. |
| Ring and macroscopic hexagons do not align corner-for-corner. | Explicit 30° molecular-ring/crystallographic-hexagon comparison; distinguish corner directions from side-face normals. |
| Local chapter's no-pure-cubic-ice assertion is obsolete. | Positive 2020 laboratory finding, qualified by detectable stacking disorder. Do not say this finding came after the cited 2021 monograph version or that ordinary snow is cubic. |
| Ideal network and measured dimensions differ slightly. | Geometry uses ideal c/a = sqrt(8/3); measured rounded a/c values are separate source annotations, not measurements of the drawing. |
| Scale can silently become a claim about Run B. | The 2.3 mm tip-to-tip specimen is Libbrecht's example. Roughly five million basal-plane repeats is a length comparison, not a molecule count or Run B dimension. |
| Plan retained a geometric-prediction scene absent from script. | Observation/selection takes that slot; pyramidal-angle derivation is explicitly deferred to the source reader. |

### Primary checks and source limits

- [Libbrecht monograph](https://arxiv.org/pdf/1910.06389v2), relevant structure and scale
  discussion, including printed p. 46's 2.3 mm specimen. The local chapter's blanket temperature/
  phase language and angle-only polygon argument are not copied into the episode.
- [NIST water geometry](https://cccbdb.nist.gov/exp2x.asp?casno=7732185&charge=0):
  isolated-molecule H–O–H angle supports the rounded molecular value. Root also read this page.
- [Barnes 1929](https://doi.org/10.1098/rspa.1929.0195): historical ice X-ray attribution.
  The animation does not determine hydrogen positions or uniquely infer Ih from six spots.
- [Brumberg et al. 2017](https://digitalcommons.dartmouth.edu/facoa/3201/): chair-form molecular
  hexagons, crystallographic hexagon and their 30° relative orientation. Root also read the
  primary authors' repository abstract. This is not permission to use its images.
- [Komatsu et al. 2020](https://www.nature.com/articles/s41467-020-14346-5) and
  [del Rosso et al. 2020](https://www.nature.com/articles/s41563-020-0606-y): primary reports
  correcting the obsolete pure-Ic assertion; laboratory context retained.
- [Stacking illustration](https://journals.iucr.org/j/issues/2018/04/00/kc5075/kc5075fig1.html):
  ideal hexagonal/cubic registries versus disorder. E02 uses original symbolic layer diagrams.

The reviewer independently calculated four nearest oxygen neighbours for each interior basis
site, nearest distance sqrt(3/8) in a-unit coordinates and tetrahedral neighbour-pair angles.
The proposed basis is `(0,0,0), (0,0,3/8), (2/3,1/3,1/2), (2/3,1/3,7/8)` with
`a1=(1,0,0), a2=(-1/2,sqrt(3)/2,0), c=sqrt(8/3)`.
This verifies ideal teaching geometry, not a physical simulation, measured coordinates or
implementation correctness. Production tests and visual inspection follow separately.

## Build and design-guide review

Pending implementation. No rendered-scene, normal-speed, phone, final narration or maker
acceptance verdict is inferred from the source review above.
